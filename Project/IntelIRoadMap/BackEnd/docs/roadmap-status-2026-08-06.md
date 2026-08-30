# IntelliPath — Việc chưa xong và lỗi tìm được, tính đến 2026-08-06

> Nối tiếp [`roadmap-status-2026-08-04.md`](roadmap-status-2026-08-04.md).
>
> **Cách đọc file này.** Mọi con số ghi *(đo hôm nay)* lấy trực tiếp từ DB `intelipath`
> đang chạy trong phiên 06-08, không phải ước lượng.

---

## 0. Trạng thái build *(đo hôm nay)*

| kiểm tra | kết quả |
|---|---|
| `./mvnw -o test` (backend) | **241/241 pass**, BUILD SUCCESS |
| `tsc --noEmit` (frontend) | sạch, 0 lỗi |
| Tham chiếu chết tới `LLM_ESCALATION_THRESHOLD` / `MIN_RELEVANCE` | không còn, chỉ còn trong comment giải thích |
| DB `intelipath` | mở được, 3 container `Up` — mọi số ở §2/§3/§4 đo trực tiếp |

Frontend vẫn **không có test runner** (không vitest, không script `test`). Khoảng
trống này có từ 04-08, chưa đụng tới.

---

## 0b. Đợt "danh tính skill" — đã làm xong trong ngày

Trích xuất đã chạy (913/913 tin được LLM đọc, link 4467 → 5660). Kết quả đo lại lộ ra
**ba vấn đề hoá ra là một**: hệ thống không có hàm định danh skill. Ba nơi ghi catalog
đều dùng `findOneBySkillNameIgnoreCase` (seeder còn tệ hơn — `findBySkillName`, phân
biệt hoa thường), nên `Fast API` và `FastAPI` là hai skill khác nhau. **Catalog đã fork
từ trước khi LLM đụng vào.**

| việc | trạng thái |
|---|---|
| `SkillNameCanonicalizer` — một hàm định danh cho cả 6 đường ghi | ✅ |
| `CoreSkillEligibility` — 3 luật quyết định cái gì được làm HIGH | ✅ |
| `CareerCoreSkillDemoter` — hạ dòng HIGH không đo được, gọi sau grader | ✅ **đã chạy** |
| Prompt mới cho LLM (định nghĩa skill + ví dụ âm + dạng canonical) | ✅ **đã chạy** |
| `2026-08-06_skill_catalog_merge.sql` | ✅ **đã chạy** |
| `2026-08-06_career_core_regrade.sql` | ✅ **đã chạy** |
| Seeder đi qua canonicalizer | ✅ (nếu không, restart là fork lại) |
| `regradeByMarketDemand` chấm theo career thay vì toàn thị trường | ✅ (lỗi thứ tư, xem dưới) |

**Gộp catalog:** skills 3940 → 3849 (−91 fork), `career_required_skills` −45 dòng trùng,
**fork còn lại theo khoá chuẩn hoá = 0**, tham chiếu mồ côi = 0. `skill_nodes` (3994) và
`student_skills` (558) **không mất dòng nào**. `Microservices` 86→88, `GCP` 11→13.

**Hai merge sai đã bị chặn** nhờ chạy thử danh sách cặp trước khi viết migration:
`HTTPS`→`HTTP` (chữ s của từ viết tắt không phải số nhiều) và `Slices`→`$slice` (toán tử
MongoDB). Cả hai giờ có test khoá lại.

**Prompt mới:** 913/913 tin được đọc, catalog mới đúc **46 dòng (giảm từ 126)**. Skill kỹ
thuật cụ thể **không đổi một tin nào** (Python 193, Java 158, Docker 59 — keyword pass).
Cái mất đi đúng loại cần mất: `Cloud` 26→2, `Security` 26→2, `Database` 16→1,
`Software Development` 8→0, `Japanese` 12→0, `Project Management` 66→18.
Link 5654 → 4120 (−27%).

⚠️ **Mất ngoài ý muốn:** `Kafka` 22→11, `Redis` 6→3. Prompt chặt tay hơn cũng nuốt mất một
ít công nghệ thật. Chưa sửa — xem §2.6.

### Lỗi thứ tư, tìm ra nhờ việc dọn rác — đã sửa

Sau khi 17 dòng tiêu đề rời khỏi HIGH, Frontend lộ ra core skill là
`Agile, SQL, Java, AWS, JavaScript, Microservices, React` — **không có TypeScript, HTML5,
CSS3**. Nguyên nhân: `CareerSkillMarketGrader` chấm điểm từ `skill_trends`, bảng **không
có chiều career**. Mọi career bị chấm bằng cùng một bảng xếp hạng toàn thị trường rồi chỉ
chia cho mẫu số khác nhau — tức lỗi F4 đã sửa ở đường *xếp hạng* nhưng còn nguyên ở đường
*chấm điểm*, đúng chỗ quyết định core skill của một nghề.

Đã đổi `regradeByMarketDemand` đọc từ `recruitment_skills` join `recruitments.career_id`.

Kết quả (HIGH mỗi career, tất cả đều có bằng chứng thị trường):

| career | core skill |
|---|---|
| Frontend | JavaScript, React, TypeScript, Node.js, HTML5, CSS3, Angular, Vue |
| Backend | Java, Spring Boot, PostgreSQL, Docker, Microservices, Go, MySQL, .NET, Python, SQL, AWS, JavaScript, AI, Agile |
| DevOps | CI/CD, AWS, Linux, Kubernetes, Docker, Azure, Python, JavaScript |
| Data Science | Python, SQL, Machine Learning, AI |
| Game Developer | C#, C++, C, Unity, Unreal Engine, Python, AWS, AI |
| QA | Cypress, Automation Test, QA, CI/CD, Agile, Java, SQL, Python, JavaScript, AI |

`vinh.student` (Backend): mẫu số readiness 25 → **14**, giữ 6 skill, cả 6 đều verified.

⚠️ **Nhiễu còn lại:** `AI` (262 tin) và `Agile` (226) vẫn lọt vào HIGH của 4 career.
Chúng chưa nằm trong `CATEGORY_WORDS`. `AI` là tên hạng mục — nếu muốn loại, thêm vào
hằng số đó và chạy lại `2026-08-06_career_core_regrade.sql`. Tôi để nguyên vì đó là
quyết định nội dung, không phải lỗi.

Backend 276/276 test xanh. Đường lùi: `skill_merge_undo` (91 dòng) và
`career_core_regrade_undo` (3821 dòng).

---

## 1. 🔴 Đang chờ bạn chạy — chặn hết mọi việc đo phía sau

### 1.0 Chạy lại trích xuất **một lượt nữa** — bắt buộc

Hai thứ chỉ chạy được bên trong pipeline trích xuất và **hiện chưa chạy**:

1. `CareerCoreSkillDemoter` — hạ các dòng HIGH không đo được. Chưa chạy nên readiness
   vẫn sai: Frontend vẫn 26 HIGH, dự kiến còn ~8.
2. Prompt mới — dữ liệu hiện tại vẫn do prompt cũ sinh ra.

Lệnh: xem §1.1 bên dưới (giống hệt lần trước, ai-service đã build lại với prompt mới).
Sau khi chạy, kỳ vọng đo được:
- log `913 read by the LLM` (không đổi)
- **số dòng catalog mới đúc giảm mạnh** so với 126 lần trước
- `Cloud` / `API` / `Software Development` không còn tăng
- Frontend HIGH 26 → ~8, và **không dòng nào trong đó có 0 tin**

### 1.1 Lệnh chạy lại trích xuất

Sửa gốc đã nằm trong code (`intelipath-service/app/api/endpoints/extraction.py`):
bỏ `LLM_ESCALATION_THRESHOLD`, mọi mô tả **duy nhất** đều được model đọc, concurrency
8 → 12, `AiServiceProperties.readTimeout` 300s → 900s. **Nhưng dữ liệu cũ vẫn nguyên** —
sửa code không tự chạy lại việc trích xuất.

Cần ADMIN. Container đã build lại với code mới, chỉ cần lấy token rồi trigger:

Đã có snapshot `extraction_baseline_2026_08_06` trong DB (3814 skill, 4467 link,
586 skill có ít nhất một tin) — chụp **trước** khi chạy, để lần này chứng minh được
nhân quả chứ không phải suy đoán như lần `CareerSkillDemandDeriver`.

### 1.2 Ngay sau khi trích xuất xong: tính lại `MIN_WEIGHTED_DEMAND`

`MarketDemandMapper.MIN_WEIGHTED_DEMAND = 0.0075` **là thuộc tính của dữ liệu, không
phải hằng số của bài toán** — javadoc của chính nó ghi thế. Con số 0.0075 rút ra từ
phân bố *trước* khi sửa (413 cặp có dữ liệu thị trường, trung vị 0.0092, giữ 213 cặp,
tăng 105 cặp so với 108 cặp cũ). Trích xuất lại sẽ làm số tin trên mỗi skill tăng
mạnh → ngưỡng cũ thành quá dễ, mọi thứ lọt qua hết.

Cách tính lại: lấy trung vị của `frequency × weight(importance)` trên toàn bộ cặp
(skill, career) có dữ liệu, đặt ngưỡng dưới cặp yếu nhất hiện đang hiển thị, để lần
đổi này cũng **thuần cộng thêm** — không career nào mất skill đang có.

---

## 2. Lỗi tìm ra hôm nay, **chưa sửa**

### 2.0 `DevOps`, `Cloud`, `API` sẽ rời khỏi HIGH — có chủ ý, nhưng cần biết

Ba dòng này có bằng chứng thật (132 / 84 / 80 tin) nhưng vẫn bị `CoreSkillEligibility`
loại khỏi HIGH vì chúng là **tên hạng mục**, không phải thứ học được. Không ai ở bậc
"Practiced về Cloud". Chúng vẫn nằm trong catalog ở AVG, vẫn hiện trên Market Pulse —
chỉ không còn là mẫu số readiness.

Đây là quyết định có ý kiến. Nếu sau này thấy sai, sửa một chỗ: hằng số
`CATEGORY_WORDS` trong `CoreSkillEligibility`.

### 2.6 Prompt mới nuốt mất một ít công nghệ thật — đã vá, **chưa đo**

`Kafka` 22→11, `Redis` 6→3 sau khi đổi prompt. Danh sách "không trả về" (`Cloud`, `API`,
`Database`, `Security`...) làm model thận trọng quá mức với cả tên cụ thể nằm trong
những hạng mục đó.

Đã thêm một đoạn vào `_SKILL_SYSTEM_PROMPT`: *lệnh cấm là cấm HẠNG MỤC, không bao giờ
cấm một sản phẩm bên trong nó* — Redis và PostgreSQL đều là database và đều phải trả về;
Kafka và RabbitMQ đều là messaging; OAuth và JWT đều là security. ai-service đã build lại.

**Chưa đo.** Lượt trích xuất tiếp theo phải kiểm: `Kafka` phải ≥ 22, `Redis` ≥ 6, và
`Cloud`/`Database` phải vẫn ở mức ~2/1 (nếu chúng bật lên lại thì đoạn thêm vào quá tay).

### 2.1 Bậc `AWARE` không bao giờ tới được từ evidence *(đo hôm nay)*

Chỉ có hai chỗ ghi proficiency: `SkillProficiencyPromoter` và
`StudentAssessmentServiceImpl`. Bảng ánh xạ của evidence là ≥0.85 → 4, ≥0.70 → 3,
còn lại → **2**. Không nhánh nào ghi 1. Đo trên DB: **0 dòng nào có proficiency = 1**
trong toàn hệ thống. Bậc `Aware` chỉ tới được bằng tự đánh giá.

Hệ quả: thang 4 bậc trên UI thực chất là thang 3 bậc.

### 2.2 Confidence dồn cục ở 0.85–0.90 → thang chỉ còn hai bậc

AI trả confidence quanh 0.85–0.90 gần như mọi lần, mà ngưỡng lại là 0.85 và 0.70.
Kết quả thực tế: hầu hết rơi vào bậc cao nhất, phần còn lại rơi xuống đáy — mất hẳn
hai bậc giữa. Đã đề xuất điều tra, **chưa được duyệt nên chưa làm**.

### 2.3 Bong bóng Skill Map chồng nhau ở cùng một hàng proficiency

Trục Y rời rạc (0–4), nên mọi skill cùng bậc nằm đúng một đường ngang; skill nào
frequency gần nhau thì chồng lên nhau. Đã nêu và **cố ý chưa sửa** — cần jitter hoặc
đổi trục, cả hai đều là quyết định thiết kế chứ không phải vá.

### 2.4 Skill Map chỉ hiện skill `HIGH`

Nên `PostgreSQL` ở bậc Applied vẫn vô hình dù sinh viên đã đạt. Là lựa chọn từ trước,
nhưng bây giờ nó mâu thuẫn với dải "chưa đo được" mới thêm — dải đó nói "skill này có
thật, chỉ thiếu số liệu", còn skill AVG/LOW thì biến mất không lời giải thích nào.

### 2.5 Sai số trong javadoc — **đã sửa hôm nay**

`MIN_WEIGHTED_DEMAND` ghi "97 pairs are gained" trong khi số đo là 213 − 108 = **105**.
Đã sửa lại đúng số đo.

---

## 3. Đã quyết định để nguyên, đừng "sửa" lại

**4 dòng evidence mồ côi trên 2 repo đã xoá** — `intelipath-backend` → Docker;
`tour-vista` → Java, PostgreSQL, Spring Boot.

Đây đúng bằng nhánh mặc định của hộp thoại xoá dự án ("chỉ gỡ khỏi portfolio, giữ
skill đã chứng minh"). Tự động xoá chúng chính là hạ level sinh viên trong im lặng —
đúng cái mà tính năng hộp thoại sinh ra để ngăn.

---

## 4. Tồn đọng cũ — **đã kiểm lại trên DB hôm nay**

Ba mục trong file 04-08 sai số, đã sửa lại theo số đo.

| # | việc | trạng thái đo hôm nay |
|---|---|---|
| #36 | **F4b** — phân loại 442 skill mồ côi vào career bằng AI | 74 dòng `data/v2/career_skills_from_market.csv` đã viết, **chưa nạp**. Bảng `f4b_before_snapshot` đã có sẵn. Nạp là đổi readiness/level/skill-map/Jaccard của mọi sinh viên → phải có lượt riêng đo trước/sau |
| #48 | **R2** — đo trước/sau `RepoSkillCandidateSelector` | Còn nguyên. 4 repo có evidence sống, xem §3 |
| | **Full Stack** — ~~42 root~~ → **16 root** | ⚠️ **Số cũ sai, và vấn đề thật khác với mô tả cũ.** Cây đang có *hai* cấu trúc song song: một spine tên `Full Stack` với 15 con, **cộng thêm 15 root khác trôi nổi ở depth 0** (`Authentication`, `Backend Runtime`, `CI/CD`, `Cloud & Deployment`, `CSS`, `Internet`, `Linux & Shell`, `Package Managers`, `REST APIs` — 9 cái này **0 con**). Đây là lỗi *cấu trúc* (15 root kia lẽ ra phải nằm dưới spine), không phải chỉ "thiếu nội dung" |
| | `Spring Boot` không có node nào | ✅ **Xác nhận: 0 node** tên `Spring Boot` trong toàn bộ `skill_nodes` |
| | `Password Hashing` chào MD5/SHA/scrypt | ✅ **Xác nhận: đúng 3 con — `MD5`, `SHA`, `scrypt`.** MD5 và SHA trần **không phải** thuật toán băm mật khẩu. Thiếu bcrypt/argon2. Đây là **lời khuyên bảo mật sai**, nên là mục ưu tiên cao nhất trong bảng này |
| | Frontend thiếu Angular, `Svelte` rỗng | ✅ **Xác nhận: 0 node `Angular`, `Svelte` có 0 con** |
| | Seeder chưa tự tính `depth`/`sort_order`/`subtree_size` | ⚠️ **Số liệu hiện tại đã sạch** — 0 node thiếu `depth`, 0 node thiếu `sort_order`. Nhưng đó là do migration tay vá lại, **seeder vẫn chưa tự tính**: seed mới là hỏng lại |
| | File chưa commit | Đếm lại hôm nay: backend `test/phuocvinh` ~40+ file sửa, frontend `refactor/student-cleanup` ~32 file sửa + 8 file mới chưa add |
| | `refactor/student-cleanup` chưa push | Còn nguyên |
| | Red toast chưa tái hiện được | Chưa đụng |
| | Career lật Frontend/Backend cho `dpvinh30092005` | Chưa đụng |

---

## 5. Thứ tự reseed — chạy sai thứ tự là hỏng

```
standardize-roadmap-structure.sql
2026-08-05_roadmap_choice_zones.sql
2026-08-05_roadmap_spine_order.sql          (psql -1)
2026-08-06_node_kind_repair.sql
2026-08-06_node_tier.sql
2026-08-06_option_skill_relink.sql
2026-08-06_career_skills_market.sql         (psql -1)
2026-08-06_settle_stuck_evidence.sql
2026-08-06_github_import_audit.sql
2026-08-06_skill_catalog_cleanup.sql
2026-08-06_github_import_audit_authorship.sql
2026-08-06_recruitment_skills.sql
```

⚠️ `ddl-auto: none`, **không có Flyway**. Mỗi thay đổi schema phải vào **cả ba đích**:
2 bản init SQL + DB đang chạy. Quên một cái là 500 toàn bộ endpoint (đã dính một lần
với cột `difficulty`).

---

## 6. Lệnh hay dùng

```bash
cd D:/Project/IntelIRoadMap/BackEnd/infrastructure && docker compose --env-file ../intelipath-backend/.env up -d --build backend
```

```bash
MSYS_NO_PATHCONV=1 docker exec -it intelipath-postgres psql -U intelipath -d intelipath
```

Tên **service** trong compose là `postgres`, `ai-service`, `backend` — `intelipath-service`
là tên *container*, `docker compose up intelipath-service` sẽ báo "no such service".
