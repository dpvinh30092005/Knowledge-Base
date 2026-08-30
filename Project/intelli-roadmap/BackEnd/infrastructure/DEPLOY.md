# Deploying InteliPath to a VPS

End-to-end runbook for deploying the full stack (Postgres + AI service + backend + frontend)
to a single Linux VPS behind Nginx with HTTPS. Written for **Ubuntu 24.04** and the domain
**intelipath.online** — substitute your own where needed.

## Architecture

```
Internet ──80/443──> Nginx (host)
                       ├── /              → frontend static  (/var/www/intelipath)
                       ├── /api/          → 127.0.0.1:8080   (Spring backend)
                       ├── /oauth2/       → 127.0.0.1:8080
                       └── /login/oauth2/ → 127.0.0.1:8080
                     docker compose: postgres + ai-service + backend
                     (published ports reachable only from the host)
```

Frontend and API share one origin (`/api` is a subpath), so there is effectively no
cross-origin problem and the HttpOnly refresh cookie just works.

---

## 1. Create the VPS

Hostinger → **VPS** (not "Web Hosting" — that's shared PHP hosting with no root/Docker) →
**KVM 1** (1 vCPU / 4 GB) → OS **Ubuntu 24.04** → location **Singapore** (closest to VN).
Set a root password. Note the public **IP**.

4 GB comfortably *runs* the stack (~1.7–2.4 GB in use); it only gets tight during
`--build` (Maven/npm spike). Step 2b adds swap to cover that, so KVM 1 is enough. KVM 2
(8 GB) just removes the need to think about build memory.

## 2. First login + server hardening

```bash
ssh root@<VPS_IP>

adduser deploy
usermod -aG sudo deploy

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Ports 8080 / 8000 / 5432 are **never** opened — only Nginx (80/443) faces the internet.
From here on, `ssh deploy@<VPS_IP>`.

## 2b. Add swap (KVM 1 / 4 GB)

The `docker compose --build` and `npm run build` steps briefly need more RAM than a 4 GB
box has free while the services are running. A 4 GB swap file absorbs that spike so builds
don't get OOM-killed. Skip this on an 8 GB+ VPS.

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab   # persists across reboot
free -h                                                       # confirm Swap: 4.0Gi
```

Also build one thing at a time (frontend, then backend) rather than in parallel, so the
spikes don't overlap.

## 3. Install Docker + Compose

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
```

Log out and back in so the `docker` group applies. Verify: `docker compose version`.

## 4. Clone the repos (sibling layout)

```bash
mkdir -p ~/BackEnd && cd ~/BackEnd
git clone https://github.com/InteliRoadMap/infrastructure.git
git clone https://github.com/InteliRoadMap/intelipath-backend.git
git clone https://github.com/InteliRoadMap/intelipath-ai-service.git intelipath-service
```

Result: `~/BackEnd/{infrastructure, intelipath-backend, intelipath-service}`.

## 5. Production `.env` files (never committed)

```bash
cp ~/BackEnd/intelipath-backend/.env.example ~/BackEnd/intelipath-backend/.env
cp ~/BackEnd/intelipath-service/.env.example ~/BackEnd/intelipath-service/.env
nano ~/BackEnd/intelipath-backend/.env
```

Values that MUST differ from dev in `intelipath-backend/.env`:

| Variable | Production value |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://intelipath.online` |
| `FRONTEND_URL` | `https://intelipath.online` |
| `AUTHORIZED_REDIRECT_URI` | the frontend OAuth-callback route, e.g. `https://intelipath.online/oauth/callback` |
| `POSTGRES_PASSWORD` / `DB_PASSWORD` | a fresh strong random string (same value; the backend connects with it) |
| `JWT_SECRET` | a fresh long random string |
| `GITHUB_TOKEN_ENC_KEY` | a fresh base64 256-bit key: `openssl rand -base64 32` |
| `OPENAI_API_KEY`, `CLIENT_ID/SECRET_GOOGLE`, `CLIENT_ID/SECRET_GITHUB` | real credentials |

Generate secrets on the box: `openssl rand -base64 32`.

## 6. Update the OAuth apps (Google + GitHub)

Because the domain changed, the OAuth providers must allow the production callback URLs, or
Google/GitHub login returns `redirect_uri_mismatch`.

- **Google Cloud Console** → OAuth client → Authorized redirect URIs → add
  `https://intelipath.online/login/oauth2/code/google`.
- **GitHub** → both OAuth Apps (login app + the "Connect GitHub" sync app) → Authorization
  callback URL → the login app uses `https://intelipath.online/login/oauth2/code/github`;
  the sync app uses your frontend callback (`https://intelipath.online/github/callback`).

## 7. Build the frontend and place it for Nginx

Node is needed only to build; install it, build, copy the static output, then it's just files.

```bash
cd ~/BackEnd
git clone https://github.com/InteliRoadMap/intelipath-frontend.git
cd intelipath-frontend

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Production build-time env (Vite bakes these in at build)
cat > .env.production <<'EOF'
VITE_API_BASE_URL=https://intelipath.online/api/v1
VITE_API_HOST=https://intelipath.online
VITE_GOOGLE_CLIENT_ID=<your google client id>
VITE_GITHUB_CLIENT_ID=<your github login client id>
EOF

npm ci
npm run build

sudo mkdir -p /var/www/intelipath
sudo cp -r dist/* /var/www/intelipath/
```

## 8. Nginx + HTTPS

```bash
sudo apt-get install -y nginx
sudo cp ~/BackEnd/infrastructure/nginx/intelipath.online.conf \
        /etc/nginx/sites-available/intelipath.online
sudo ln -s /etc/nginx/sites-available/intelipath.online /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Point DNS at the VPS **before** requesting the certificate (Let's Encrypt validates over HTTP):
in Hostinger hPanel → domain → DNS/Nameservers → add an **A record** `@ → <VPS_IP>` and
`www → <VPS_IP>`. Wait until `dig +short intelipath.online` returns your IP (can take minutes).

Then get the certificate (Certbot rewrites the Nginx config to add TLS + the HTTP→HTTPS redirect):

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d intelipath.online -d www.intelipath.online
```

Certbot installs a systemd timer that auto-renews — nothing else to do.

## 9. Bring up the stack

```bash
cd ~/BackEnd/infrastructure
docker compose --env-file ../intelipath-backend/.env up -d --build
docker compose ps
docker compose logs -f backend      # watch it start; Ctrl-C to stop watching
```

The backend runs with the `prod` Spring profile by default (Swagger off, INFO logs).

## 10. Verify

```bash
curl -I https://intelipath.online                 # 200, frontend index
curl -s https://intelipath.online/api/v1/...       # a public endpoint returns JSON
```

Open `https://intelipath.online` in a browser: register/login, Google/GitHub login, an
upload. Check `docker compose logs backend` if anything 500s.

---

## Hardening notes

- **Postgres is never exposed.** The firewall (step 2) blocks 5432 from the internet. As
  defense-in-depth you can also bind the published ports to localhost in `docker-compose.yml`
  (e.g. `"127.0.0.1:5432:5432"`) — the compose network still lets the services reach each
  other by name.
- **Rate limiting trusts `X-Forwarded-For`.** `AuthRateLimitFilter` reads the client IP from
  that header, which is only trustworthy because Nginx sets it (step 8 config) and the backend
  is not reachable directly. Never expose 8080 to the internet, or the limit can be spoofed.
- **Secrets live only in `.env` on the VPS.** They are git-ignored in the app repos and must
  never be committed — not here, not in a private repo.

## Redeploying after a code change

```bash
# frontend
cd ~/BackEnd/intelipath-frontend && git pull && npm ci && npm run build \
  && sudo cp -r dist/* /var/www/intelipath/

# backend / ai-service
cd ~/BackEnd/intelipath-backend && git pull      # (and/or intelipath-service)
cd ~/BackEnd/infrastructure \
  && docker compose --env-file ../intelipath-backend/.env up -d --build
```
