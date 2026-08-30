# InteliPath — Nhật ký & Runbook Deploy Production

> ⚠️ **FILE RIÊNG TƯ — KHÔNG COMMIT / KHÔNG PUSH.**
> File này nằm ngoài mọi git repo (thư mục `BackEnd/` không phải repo) nên an toàn để chứa IP VPS
> và ghi chú nội bộ. Phiên bản "sạch" (dùng placeholder `<VPS_IP>`) để public cho giáo viên xem là
> `infrastructure/DEPLOY.md`. Đừng đưa nội dung file này lên GitHub.

Ghi lại toàn bộ những gì đã làm để đưa InteliPath lên production trên Hostinger VPS, kèm các sự cố
gặp phải và cách xử lý. Đọc theo thứ tự; phần cuối là runbook redeploy cho lần sau.

---

## 0. Thông tin hạ tầng (private)

| Mục | Giá trị |
|---|---|
| Domain | `intelipath.online` (Hostinger, auto-renew, hết hạn 2027-07-24) |
| VPS | Hostinger **KVM 1** (1 vCPU / 4 GB RAM), Ubuntu 24.04, Singapore |
| VPS IP | `187.127.210.17` |
| SSH user thường dùng | `deploy` (thuộc nhóm `sudo` + `docker`) |
| Swap | 4 GB file `/swapfile` (bù RAM lúc build) |
| Layout thư mục trên VPS | `~/BackEnd/{infrastructure, intelipath-backend, intelipath-service, intelipath-frontend}` |
| Frontend static | `/var/www/intelipath/` (Nginx serve) |
| Nhánh deploy | `develop` (cả BE lẫn FE) |
| GitHub org | https://github.com/InteliRoadMap (3 repo đang **public**) |

### Kiến trúc runtime
```
Internet ──80/443──> Nginx (chạy trên host)
                       ├── /              → frontend static  (/var/www/intelipath)
                       ├── /api/          → 127.0.0.1:8080   (Spring backend)
                       ├── /oauth2/       → 127.0.0.1:8080
                       └── /login/oauth2/ → 127.0.0.1:8080
                     docker compose: postgres(pgvector) + ai-service + backend
                     (cổng 8080/8000/5432 chỉ mở nội bộ host, KHÔNG ra internet)
```
Frontend và API cùng origin (`/api` là subpath) → không có vấn đề CORS thật sự, refresh cookie
HttpOnly hoạt động tự nhiên.

---

## 1. Hardening bảo mật TRƯỚC khi deploy (làm trên máy local, đã commit)

Đây là 4 điểm audit + 2 việc thêm, làm trước để lên prod không hở.

### 1.1 Tắt Swagger ở prod
`intelipath-backend/src/main/resources/application-prod.yaml`:
```yaml
springdoc:
  swagger-ui:
    enabled: false
  api-docs:
    enabled: false
```
→ Swagger chỉ còn ở profile `dev`. Prod không lộ danh sách endpoint.

### 1.2 Rate limiting (2 filter tự viết)
- **`AuthRateLimitFilter`** — 10 request / 60s theo **IP**, áp cho
  `/api/v1/auth/{login,refresh,forgot-password,reset-password}`. Trả **429** khi vượt.
  Env: `auth.rate-limit.*`. IP đọc từ header `X-Forwarded-For` (Nginx set — xem mục cảnh báo 1.6).
- **`AiRateLimitFilter`** — 15 request / 3600s theo **user đã đăng nhập** (key = tên trong
  SecurityContext, **không phải IP**, vì OAuth tự tạo account STUDENT nên nhiều user có thể chung IP).
  Áp cho: `/api/v1/chat/sessions/*/stream`, `/api/v1/student/portfolio/projects/github-import`,
  `.../github-import-batch`. Có `@Scheduled` dọn map định kỳ.
  Env: `AI_RATE_LIMIT_MAX_REQUESTS` (mặc định 15), `AI_RATE_LIMIT_WINDOW_SECONDS` (mặc định 3600).
- Wiring trong `SecurityConfig.java`:
  `.addFilterBefore(authRateLimitFilter, JwtAuthenticationFilter.class)` và
  `.addFilterAfter(aiRateLimitFilter, JwtAuthenticationFilter.class)`.

> Đây là cách chặn "AI xài hết token" — mỗi user tối đa 15 tin AI / 1 giờ.

### 1.3 Docker chạy non-root
`intelipath-backend/Dockerfile` và `intelipath-service/Dockerfile`: thêm user riêng
(`spring` / `appuser`) + directive `USER`. Container không còn chạy bằng root.

### 1.4 Không rò exception ra client
`GlobalExceptionHandler.java` — handler `MethodArgumentTypeMismatchException` giờ **log
server-side** và trả message chung, thôi trả `exception.getMessage()` ra ngoài.

### 1.5 Fix OAuth redirect http/https (rất quan trọng)
`intelipath-backend/src/main/resources/application.yaml` thêm ở top-level:
```yaml
server:
  forward-headers-strategy: framework
```
→ Spring tôn trọng `X-Forwarded-Proto` do Nginx gửi, nên build `redirect_uri` thành **https**
thay vì http. Không có dòng này → Google trả `redirect_uri_mismatch` (xem sự cố 5.2).

### 1.6 ⚠️ Cảnh báo bảo mật đi kèm rate limit
`AuthRateLimitFilter` tin `X-Forwarded-For`. Chỉ an toàn vì Nginx set header đó và backend
**không** truy cập trực tiếp được từ internet. **Tuyệt đối không mở cổng 8080 ra ngoài**, nếu không
limit bị spoof dễ dàng.

---

## 2. Tách repo `infrastructure` (giữ nguyên lịch sử git)

Mục tiêu: tách config deploy/ops ra khỏi source ứng dụng, để public repo hạ tầng cho giáo viên xem.

- Dùng `git filter-repo` để trích thư mục ra repo mới, **giữ nguyên 44 commit lịch sử**.
- Repo `infrastructure` chứa:
  - `docker-compose.yml` — 3 service (postgres+pgvector, ai-service, backend); build context trỏ
    `../intelipath-backend`, `../intelipath-service`.
  - `DEPLOY.md` — runbook public (dùng placeholder `<VPS_IP>`, domain `intelipath.online`).
  - `nginx/intelipath.online.conf` — reverse proxy config.
  - `README.md`, `docker/postgres/init/*.sql`.
- Lệnh chạy stack (env lấy từ `.env` của backend):
  ```bash
  docker compose --env-file ../intelipath-backend/.env up -d
  ```
- Đã push cả nhánh `main` và `develop`.

> **Nguyên tắc secret:** không có secret nào trong repo. Mọi credential đến từ file `.env` trên VPS
> (đã gitignore ở các repo app), nạp qua `env_file:` / `--env-file`.

---

## 3. Provisioning VPS (chạy TRÊN VPS, từng bước)

### 3.1 Tạo VPS
Hostinger → **VPS** (không phải "Web Hosting") → **KVM 1** → Ubuntu 24.04 → Singapore. Đặt mật khẩu
root, ghi lại IP.

### 3.2 Đăng nhập lần đầu + hardening
```bash
ssh root@187.127.210.17
adduser deploy
usermod -aG sudo deploy
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```
Từ đây SSH bằng `deploy`. Cổng 8080/8000/5432 **không bao giờ mở**.

### 3.3 Thêm swap (vì KVM1 chỉ 4 GB, build hay OOM)
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h        # xác nhận Swap: 4.0Gi
```
Mẹo: build **lần lượt** frontend rồi backend, đừng build song song để đỉnh RAM không chồng nhau.

### 3.4 Cài Docker + Compose
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
```
Logout/login lại cho nhóm `docker` có hiệu lực. Kiểm tra `docker compose version`.

### 3.5 Clone repo (layout sibling)
```bash
mkdir -p ~/BackEnd && cd ~/BackEnd
git clone https://github.com/InteliRoadMap/infrastructure.git
git clone https://github.com/InteliRoadMap/intelipath-backend.git
git clone https://github.com/InteliRoadMap/intelipath-ai-service.git intelipath-service
```
> Nhớ checkout đúng nhánh `develop` ở các repo app trước khi build.

### 3.6 File `.env` production (không bao giờ commit)
```bash
cp ~/BackEnd/intelipath-backend/.env.example ~/BackEnd/intelipath-backend/.env
cp ~/BackEnd/intelipath-service/.env.example  ~/BackEnd/intelipath-service/.env
nano ~/BackEnd/intelipath-backend/.env
```
Giá trị BẮT BUỘC khác dev trong `intelipath-backend/.env`:

| Biến | Giá trị prod |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://intelipath.online` |
| `FRONTEND_URL` | `https://intelipath.online` |
| `AUTHORIZED_REDIRECT_URI` | `https://intelipath.online/oauth/callback` |
| `POSTGRES_PASSWORD` / `DB_PASSWORD` | chuỗi random mạnh, mới (cùng giá trị) |
| `JWT_SECRET` | chuỗi random dài, mới |
| `GITHUB_TOKEN_ENC_KEY` | `openssl rand -base64 32` |
| `OPENAI_API_KEY`, `CLIENT_ID/SECRET_GOOGLE`, `CLIENT_ID/SECRET_GITHUB` | credential thật |

Sinh secret ngay trên VPS: `openssl rand -base64 32`.

### 3.7 Cập nhật OAuth app (vì đổi domain)
- **Google Cloud Console** → OAuth client → Authorized redirect URIs → thêm
  `https://intelipath.online/login/oauth2/code/google`.
- **GitHub** → 2 OAuth App:
  - App login: callback `https://intelipath.online/login/oauth2/code/github`.
  - App "Connect GitHub" (sync): callback `https://intelipath.online/github/callback`.

### 3.8 Build frontend + đặt cho Nginx
```bash
cd ~/BackEnd
git clone https://github.com/InteliRoadMap/intelipath-frontend.git
cd intelipath-frontend

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

cat > .env.production <<'EOF'
VITE_API_BASE_URL=https://intelipath.online/api/v1
VITE_API_HOST=https://intelipath.online
VITE_GOOGLE_CLIENT_ID=<google client id>
VITE_GITHUB_CLIENT_ID=<github login client id>
EOF

npm install        # KHÔNG dùng npm ci — xem sự cố 5.3
npm run build
sudo mkdir -p /var/www/intelipath
sudo cp -r dist/* /var/www/intelipath/
```
> Lưu ý: `VITE_GITHUB_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` thực ra **không được dùng** (login đi qua
> backend redirect flow `/oauth2/authorization/{provider}`), nhưng vẫn để cho khớp DEPLOY.md.

### 3.9 Nginx + HTTPS
```bash
sudo apt-get install -y nginx
sudo cp ~/BackEnd/infrastructure/nginx/intelipath.online.conf \
        /etc/nginx/sites-available/intelipath.online
sudo ln -s /etc/nginx/sites-available/intelipath.online /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Trỏ DNS **trước** khi xin cert (Let's Encrypt verify qua HTTP): hPanel → domain → DNS → thêm
**A record** `@ → 187.127.210.17`. Đợi `dig +short intelipath.online` trả đúng IP.
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d intelipath.online -d www.intelipath.online
```
Certbot tự rewrite config thêm block 443 + redirect HTTP→HTTPS, và cài timer auto-renew.

### 3.10 Chạy stack
```bash
cd ~/BackEnd/infrastructure
docker compose --env-file ../intelipath-backend/.env up -d --build
docker compose ps
docker compose logs -f backend     # xem khởi động; Ctrl-C để thoát xem log
```
Backend chạy profile `prod` mặc định (Swagger off, log INFO).

### 3.11 Verify
```bash
curl -I https://intelipath.online         # 200, index frontend
```
Mở trình duyệt: đăng ký/đăng nhập, login Google/GitHub, thử upload. → Đã xác nhận HTTPS 200,
frontend live tại https://intelipath.online.

---

## 4. Seed data (catalog) — không nằm trong git

`DatabaseSeeder` (CommandLineRunner) đọc `data/v2/*.csv` và `data/flm_overlay.json` để seed catalog
(Career Roles, Skills, Roadmap nodes).

- **Vấn đề gốc:** thư mục `data/` bị **gitignore** (vì `data/flm_overlay.json` là dữ liệu chương
  trình FPT, không nên public). Nên clone trên VPS **thiếu** `data/` → seeder log
  `... not found`, `Career Roles loaded: 0`.
- **Cách xử lý:** copy `data/` (7 file, ~648 KB) lên VPS bằng `scp` (KHÔNG commit):
  ```bash
  scp -r "D:/Project/IntelIRoadMap/BackEnd/intelipath-backend/data" \
      deploy@187.127.210.17:~/BackEnd/intelipath-backend/
  ```
- **Bẫy quyền:** lần đầu scp báo `Permission denied` vì Docker đã tự tạo `data/` **thuộc root**
  (bind-mount `../intelipath-backend/data:/app/data:ro` không thấy thư mục → daemon root tạo).
  Fix: trên VPS `sudo chown -R deploy:deploy ~/BackEnd/intelipath-backend/data` rồi scp lại.
- Sau khi copy xong: `docker compose restart backend` rồi kiểm tra
  `docker compose logs --tail 30 backend | grep "loaded:"` phải thấy số **> 0**.

---

## 5. Sự cố đã gặp & cách xử lý (troubleshooting log)

### 5.1 DNS có bản ghi rác
`@` có **2 A record**: IP VPS thật `187.127.210.17` và IP parking cũ `2.57.91.91`. → Xóa bản
`2.57.91.91`. `www` để là CNAME → `intelipath.online` (giữ).
- Link preview hiện "Parked Domain name on Hostinger" chỉ là **cache cũ** — `curl` cho thấy
  `<title>InteliPath</title>`, app React thật đã được serve.

### 5.2 `redirect_uri_mismatch` khi login Google
Spring dựng `redirect_uri` thành `http://` vì đứng sau Nginx. Fix bằng
`server.forward-headers-strategy: framework` (mục 1.5). Nginx đã gửi sẵn `X-Forwarded-Proto`.

### 5.3 `npm ci` fail trên VPS
Lockfile lệch, thiếu native dep Linux (`@emnapi/*`). → Dùng `npm install` thay `npm ci`.

### 5.4 IntelliJ khóa file / index git hỏng (trên máy local)
- IntelliJ giữ lock file → `git checkout`/switch nhánh báo "Invalid argument". → Đóng IDE.
- Index git hỏng (dto/, .env, data/ hiện untracked) do checkout bị ngắt giữa chừng. → `git reset`
  làm sạch index.
- **False alarm `.env` "bị track":** `git ls-files` hiện `.env` do index hỏng. Kiểm tra
  `git ls-tree origin/*` và `git log --all -- .env` → `.env` **chưa từng** được commit ở bất kỳ
  nhánh nào. `.gitignore` đã có `.env`. An toàn.

### 5.5 Thư mục `docs/` bị push nhầm
`docs/code-audit.md`, `docs/security-review.md` lỡ lên repo. → Xóa file + thêm `docs` vào
`.gitignore` (commit f795c97). *(Mới xoá ở "Level 1" — file vẫn còn trong lịch sử commit; xem mục 6.)*

---

## 6. Việc còn TỒN ĐỌNG (cần làm)

- [ ] **Copy seed data + verify**: hoàn tất scp `data/` → restart backend → xác nhận
      `Career Roles loaded > 0` (mục 4).
- [ ] **Merge `test/phuocvinh` → `develop` (BACKEND)**: mang theo fix forward-headers (1.5) + xoá
      docs (5.5). Rồi trên VPS:
      ```bash
      cd ~/BackEnd/intelipath-backend && git pull
      cd ~/BackEnd/infrastructure && docker compose --env-file ../intelipath-backend/.env up -d --build backend
      ```
- [ ] **Merge `test/phuocvinh` → `develop` (FRONTEND)**: refresh-token không lưu localStorage +
      Upload Transcript UI. Rồi VPS rebuild frontend (git pull → `npm install` → `npm run build` →
      `sudo cp -r dist/* /var/www/intelipath/`).
- [ ] **Quyết định `docs/` Level 2**: có purge lịch sử bằng `git filter-repo` + force-push không
      (làm phiền collaborator), hay chỉ dừng ở Level 1. Hiện `docs/` vẫn còn trong lịch sử `develop`
      và `main`.
- [ ] **⚠️ Xoay (rotate) secret**: OpenAI API key và FLM cookie đã lộ trong ảnh chụp màn hình lúc
      thao tác → nên tạo key/cookie mới, cập nhật `.env` trên VPS, restart.
- [ ] **Verify full login flow** sau khi deploy fix forward-headers.

---

## 7. Runbook redeploy sau này (tóm tắt để dùng nhanh)

```bash
# --- FRONTEND ---
cd ~/BackEnd/intelipath-frontend && git pull && npm install && npm run build \
  && sudo cp -r dist/* /var/www/intelipath/

# --- BACKEND / AI-SERVICE ---
cd ~/BackEnd/intelipath-backend && git pull        # và/hoặc intelipath-service
cd ~/BackEnd/infrastructure \
  && docker compose --env-file ../intelipath-backend/.env up -d --build

# xem log / trạng thái
docker compose ps
docker compose logs --tail 50 backend
```

Nhớ: build lần lượt (FE trước, BE sau) để không OOM; `.env` chỉ nằm trên VPS, không commit;
không mở cổng 8080/8000/5432 ra internet.
