# IntelliPath — Việc còn lại sau F1–F10 và hướng giải quyết

> Cập nhật 2026-08-04. Mọi con số dưới đây **đo trực tiếp** trên DB `intelipath`
> đang chạy (`docker exec intelipath-postgres psql -U intelipath -d intelipath`)
> trong phiên này, không phải ước lượng. File này nối tiếp
> [`roadmap-status-2026-08-03.md`](roadmap-status-2026-08-03.md) và
> [`dynamic-roadmap-plan.md`](dynamic-roadmap-plan.md).

---

## 0. Đã xong trong đợt này (F1–F10)

Ghi vắn tắt để biết cái gì **không** cần bàn lại nữa.

| # | việc | kết quả đo được |
|---|---|---|
| F1 | Ràng buộc `ck_sa_level` | Nhận đủ 6 bậc; `submitAssessment` không còn ném lỗi ở lần save thứ hai |
| F2 | FE nhận 6 bậc | `BEGINNER`/`EXPERT` có blurb, không còn tiêu đề rỗng |
| F3 | `promoteFromEvidence` | Evidence nâng proficiency **không cần** node hoàn thành |
| F4 | TF-IDF per-career | Backend đổi từ `AI, Agile, Python` sang `SQL, Microservices, Docker, Java` |
| F5 | UI level + nudge GitHub | Nudge nêu số thật, ẩn khi `ratioVerified ≥ 0.30` |
| F6 | Priority + Readiness | `priorityScore` chuẩn hoá theo `relevance/maxRelevance`; mẫu số readiness = HIGH (29), không phải 1.466 |
| F7 | `StackBranchScorer` | Chấm điểm cây con thay khớp tên; hoà trong 10% → không đoán |
| F8 | Skill Map bong bóng | `ZAxis` nhận **diện tích**, không phải bán kính |
| F9 | Jaccard career affinity | HIGH-only; Backend `0.727`, DevOps `0.949`, còn lại ≥ `0.967` |
| F10 | `estimated_hours` / `difficulty` | `@Deprecated` + thu hẹp 1–5 → 1–4; **và** vá 8 cột thiếu trong init SQL |

**175/175 test backend pass.** Frontend không có test runner (không vitest, không
script `test`, 0 file test) — đây vẫn là một khoảng trống, xem §5.

---

## 1. 🔴 162 file chưa commit, commit cuối cách đây một tuần

Có git từ lâu — **4 repo riêng**, nằm sâu hơn một cấp so với `BackEnd/` và
`FrontEnd/` (hai thư mục này tự chúng không phải repo):

| repo | remote | branch | commit cuối | file bẩn |
|---|---|---|---|---|
| `BackEnd/intelipath-backend` | `InteliRoadMap/intelipath-backend` | `test/phuocvinh` | 2026-07-28 | **115** |
| `FrontEnd/intelipath-frontend` | `InteliRoadMap/intelipath-frontend` | `refactor/student-cleanup` | 2026-07-29 | **35** |
| `BackEnd/intelipath-service` | `InteliRoadMap/intelipath-ai-service` | `vinhdp` | 2026-07-28 | **11** |
| `BackEnd/infrastructure` | `InteliRoadMap/infrastructure` | `develop` | 2026-07-24 | **1** |

Nên rủi ro không phải "không có lịch sử" mà là **toàn bộ F1–F10 nằm ngoài lịch sử
đó**. Backend: 52 file sửa + 63 file mới. Frontend: 25 sửa + 10 mới. Và nhánh
`refactor/student-cleanup` **chưa có upstream** (`git status -sb` không hiện
`...origin/`) — nhánh này chưa từng được push, nên 35 file kia không có bản sao nào
ngoài ổ đĩa này.

**Đã kiểm, không phải lo:** `.env` bị che ở cả hai repo (`.gitignore:223` backend,
`.gitignore:14` frontend), `target/` và `node_modules` cũng vậy. `DEPLOYMENT-NOTES.md`
nằm ở `BackEnd/` — **ngoài cả 4 repo** — nên không có đường nào lọt vào commit.

**Hướng giải quyết:** commit theo từng repo, chia commit theo mốc F chứ đừng gộp một
cục 115 file — sau này không ai đọc nổi. Với 4 repo tách rời, thứ tự push có ý nghĩa:
backend trước (frontend đọc DTO của nó), rồi frontend.

```bash
git -C BackEnd/intelipath-backend status --porcelain
```

Nhắc lại ràng buộc đã thống nhất: **không** thêm trailer `Co-Authored-By: Claude`;
integrate bằng **merge**, không rebase/force-push nhánh chung; PR dùng "Create a merge
commit", không Squash; **không** đưa IP VPS vào bất kỳ file nào trong repo.

---

## 2. ✅ `completion_policy` + `required_proficiency` (làm xong 2026-08-05)

Đã theo phương án (1) — phân loại theo hình dạng node, thuần SQL, giải thích được:

| loại node | policy | số node đặt mới |
|---|---|---|
| có con (là tiêu đề) | `NEVER_COMPLETE` | 632 |
| checkpoint | `MANUAL_ONLY` | 12 |
| lá, ≥2 link | `EVIDENCE_ALLOWED` | 2.785 |
| lá, mỏng (đã DRAFT) | `MANUAL_ONLY` | 277 |

Chỉ đặt cho 3.706 dòng đang NULL — 471 dòng đã có giá trị thì **không đụng**.
Kết quả: 3.031 EVIDENCE_ALLOWED / 664 NEVER_COMPLETE / 482 MANUAL_ONLY.

**Tác dụng phụ tốt, không nằm trong dự tính.** `isSequentialGateLocked` coi node
`NEVER_COMPLETE` là cổng đã thoả chừng nào nó không còn LOCKED. Trước đây 632 tiêu đề
mang NULL nên sinh viên phải **hoàn thành cả tiêu đề** mới mở được node kế tiếp — một
việc không có nghĩa. Giờ tiêu đề tự thông. `RoadmapProgressCalculator` cũng bỏ chúng
khỏi mẫu số: Frontend 486 → 401 node, tiến độ của `vinh.student` 0,4% → 0,5%.

### Va chạm đơn vị trong `required_proficiency` (phát hiện khi đo)

`meetsNodeProficiency` đọc cột này là **phần trăm 0–100**. Nhưng dữ liệu có hai đơn vị:

```
required_proficiency | count
                   2 |  3706   ← ProficiencyLevel (1..4), không phải phần trăm
                  65 |   246   ← phần trăm
                   0 |   225
```

`2 / 100 = 0.02` — một ngưỡng **không gì trượt nổi**. Tức 3.706 node đó suốt thời gian
qua không hề có ngưỡng riêng, chỉ còn sàn theo importance đỡ. Không phải lỗi "chưa
chạy lần nào" như tôi viết ở bản nháp, mà là ngưỡng bị vô hiệu hoá âm thầm.

CSV nguồn xác nhận đúng hai quy ước trong một cột: 9.665 dòng ghi `2`, 345 dòng ghi
`65`. Đã chuyển sang đúng thang phần trăm mà bảng confidence đã dùng — AWARE 40,
PRACTICED 55, APPLIED 70, PROFESSIONAL 85 — và thêm `ck_skill_nodes_required_proficiency`
chặn khoảng 1–9: sàn importance thấp nhất là 60, nên một giá trị dưới 10 chỉ có thể là
đơn vị cũ quay lại, và nó phải chết ở seeder chứ không phải chết âm thầm ở sinh viên.

### Không có trận lụt tự tick

Ngưỡng thật = `max(required_proficiency/100, sàn importance)`. Vì 55 < mọi sàn, sàn
importance vẫn là thứ quyết định:

| importance của skill | ngưỡng | số node EVIDENCE_ALLOWED |
|---|---|---|
| LOW | 0,60 | 2.003 |
| AVG (kể cả node không nối career) | 0,70 | 791 |
| HIGH | 0,85 | 229 |

Đối chiếu thang confidence: PRACTICED 0,55 → **không mở được node nào**;
PRACTICED + verified 0,65 → chỉ node LOW; APPLIED 0,70 → LOW + AVG; PROFESSIONAL 0,85
→ tất cả. `vinh.student` toàn skill PRACTICED và không có `verified_by`, nên **0 node
tự hoàn thành** — thay đổi này mở đường chứ không tự đi thay sinh viên.

Đã vá `data/v2/roadmap_nodes_v6.csv` (9.665 dòng cho mỗi cột) để reseed không nuốt
lại; kiểm sau khi ghi: 10.456 dòng, 24 cột, 0 dòng lệch.

Đảo ngược nếu cần:
```sql
UPDATE skill_nodes sn SET completion_policy = u.old_policy, required_proficiency = u.old_required
FROM skill_node_policy_undo u WHERE u.node_id = sn.node_id;
```

---

## 3. ✅ S1 — Cổng xuất bản FR2.3 (làm xong 2026-08-05)

Chẩn đoán ban đầu ở bản nháp file này là **sai**: tôi viết "chạy khối SQL là xong".
Đo ra thì cột `skill_nodes.status` **không ai đọc** — entity `SkillNode` không có
field `status`, không repository nào lọc theo nó, và `PUBLISHABLE_STATUS` trong
`DatabaseSeeder` là bộ lọc lúc **nạp CSV**, không phải lúc truy vấn. Đánh dấu DRAFT
xong thì không có gì thay đổi trên màn hình.

**Ba việc đã làm:**

1. **Sửa lỗi trong chính khối SQL của cổng.** Nó ẩn cả checkpoint. Checkpoint là thứ
   sinh viên *làm* ("Checkpoint - Simple CRUD Apps"), không phải thứ để đọc, nên đòi
   2 link ở đó là cùng một lỗi phân loại mà comment ngay bên trên đã cảnh báo cho
   node cha — và `PUBLISHABLE_STATUS` của seeder cũng đã nhận `CHECKPOINT`. Thêm
   `AND NOT coalesce(is_checkpoint, FALSE)`, cứu 12 node.
2. **Chạy cổng đã sửa:** 285 DRAFT / 3.892 PUBLISHED, 12 checkpoint được giữ.
   Kiểm bất biến quan trọng nhất: **0 node DRAFT có con** — cổng chỉ đánh node lá nên
   không thể bỏ rơi cây con nào.
3. **Nối vào code.** `SkillNode.status` map `insertable = false, updatable = false`:
   cột do seeder và SQL đặt, không service nào được vô tình gỡ xuất bản một node khi
   lưu thứ khác. Thêm 3 finder `findPublished*` **bên cạnh** 3 finder cũ (không sửa
   tại chỗ), rồi chuyển 6 call-site hiển thị sang chúng.

| lọc DRAFT | giữ nguyên toàn bộ |
|---|---|
| `getStudentRoadmap`, `getStudentSubRoadmap`, `getStudentPlan` | `RoadmapEditorServiceImpl` — phải thấy cái cần sửa |
| `getCareerRoadmapTemplate`, `getCareerProgress` | `CounselorServiceImpl` (xem nội dung roadmap) |
| `StudentDashboardServiceImpl` roadmap progress | `updateNodeProgress` — đường ghi, cần cả cây để giải CHOOSE_ONE |
| `CareerServiceImpl` chi tiết career | `RoadmapSelectionServiceImpl` — cần đủ nhánh thay thế |
| `generateRecommendationsForCurrentStudent` | `DatabaseSeeder` |

**Mẫu số phải khớp.** Chỗ nào tính *tiến độ của sinh viên* thì phải đếm đúng cái sinh
viên nhìn thấy, nếu không cố vấn và sinh viên đọc hai con số khác nhau về cùng một
người — và người phải giải thích khoảng lệch đó là sinh viên. Đã đổi thêm 3 chỗ:
`CounselorServiceImpl` (% trong danh sách và trong file Excel) và
`RoadmapPersonalizationServiceImpl.calculateCurrentProgress`.

Phân bố node bị ẩn — không career nào bị móc rỗng:

| career | node lá | bị ẩn | % số lá |
|---|---|---|---|
| Backend | 1375 | 99 | 7,2 |
| Data Science | 583 | 81 | 13,9 |
| Frontend | 423 | 47 | 11,1 |
| Software Architect | 286 | 32 | 11,2 |
| DevOps | 504 | 21 | 4,2 |
| Full Stack | 36 | 13 | **36,1** |
| Game Developer | 135 | 2 | 1,5 |
| QA | 43 | 2 | 4,7 |

Full Stack mất 36% số lá, nhưng đó là 13 node trên một roadmap chỉ có 53 — roadmap
này vốn đã mỏng, không phải bị cổng làm mỏng.

⚠️ **Chưa kiểm được ở runtime.** 175/175 test pass, nhưng test là unit test thuần
Mockito, **không đụng JPQL**. Ba chuỗi `@Query` mới chỉ được Hibernate phân tích lúc
dựng SessionFactory, tức lúc khởi động ứng dụng. Tôi không boot vì `application.yaml`
đang `active: prod` và `DB_URL` trỏ ra DB triển khai, khởi động sẽ chạy cả seeder.
Cần bạn chạy local với profile dev trỏ vào DB docker rồi xem log có
`QuerySyntaxException` không. Đây là bước xác nhận cuối còn thiếu của S1.

Đảo ngược nếu cần: `UPDATE skill_nodes SET status = 'PUBLISHED';`

---

## 4. 🟡 F4b — 442 skill thị trường không thuộc career nào

```
market_skills_no_career | 442
```

Nguyên nhân đã xác định: `SkillExtractionServiceImpl` tự chèn tên skill lạ vào bảng
`skills` khi trích từ tin tuyển dụng nhưng không nối vào career nào. Tồn tại **hai
bộ từ vựng rời nhau** — bộ roadmap.sh (có career) và bộ thị trường (mồ côi).

**Hệ quả đo được:** 13/29 core skill của Backend **không có dữ liệu thị trường**, nên
Skill Map vẽ được 16 bong bóng thay vì 29, và `priorityScore` của 13 node kia không
có tín hiệu thị trường nào để dựa vào.

**Hướng giải quyết** (đã chốt từ trước, chưa làm):

1. Xuất 442 skill kèm `jobs_needed` 90 ngày ra CSV.
2. Một lượt AI phân loại vào 8 career **kèm `importance_level`** — không chỉ gán
   career mà phải nói HIGH/AVG/LOW, vì mẫu số readiness dùng HIGH.
3. **Kiểm bằng tay 50 dòng ngẫu nhiên trước khi nạp.** Gán sai một skill vào HIGH là
   làm hỏng cả mẫu số readiness lẫn xếp hạng Jaccard của career đó.
4. Nạp qua seeder, chạy lại truy vấn TF-IDF trong `dynamic-roadmap-plan.md` §Verification
   và so bảng trước/sau. `Spring Boot` (47 tin, hiện `df = 0`) phải xuất hiện trong
   bảng Backend — đó là phép thử một dòng cho biết lượt phân loại có ăn hay không.

---

## 5. 🟡 UI chưa bao giờ được kiểm bằng mắt

Toàn bộ F5–F9 chỉ được xác nhận bằng `npx tsc --noEmit` và test backend. **Không màn
hình nào từng được mở.** Lý do: preview tool làm sập ứng dụng, và tôi không đăng nhập
hộ bằng mật khẩu của bạn.

Những chỗ rủi ro nhất, xếp theo khả năng sai:

1. **Skill Map** (`SkillMapView.tsx`) — với `vinh.student` sẽ vẽ **16 bong bóng rỗng
   ruột nằm hết trên đường y = 0** (29 core HIGH, 16 có dữ liệu thị trường, 0 skill ở
   mức APPLIED trở lên). Về mặt dữ liệu là đúng, về mặt nhìn có thể trông như lỗi.
   Cần bạn xem và nói nó đọc được hay không.
2. **`LearningPlanPanel`** — panel 264px giờ mang thêm khối readiness, khối "Branches
   chosen for you" và top-5 ưu tiên. Nhiều khả năng tràn.
3. **`CareerAffinityHint`** — hiện `9/29 essential skills`, cố ý không hiện phần trăm.
4. **Badge ưu tiên trên node** — `CustomRoadmapNode.tsx` đã đông chip sẵn.

**Hướng giải quyết:**

- Backend phải **build lại và restart** thì các field mới mới ra tới dây; xem trên
  UI cũ sẽ thấy toàn `undefined` và tưởng là lỗi code.
- Bạn tự đăng nhập `vinh.student`, chụp màn hình 4 chỗ trên, gửi lại. Ảnh chụp là
  cách sửa nhanh nhất — ba lỗi nghiêm trọng nhất của đợt trước đều lộ ra từ **một**
  ảnh chụp dashboard.
- Cân nhắc thêm vitest cho frontend: hiện `skillMapData.ts` là hàm thuần, test được
  không cần render, mà đang phải chứng minh bằng script node vứt đi.

---

## 6. ✅ Lỗi catalog — node trỏ nhầm skill (làm xong 2026-08-05)

Con số "15 node" ở bản nháp file này cũng **sai**, và sai theo hướng nguy hiểm hơn:
nó chỉ đếm những node trỏ vào một skill mang **tên nhóm** ("Pick a Language"). Đo kỹ
thì cơ chế thật là **node thừa kế `skill_id` của node cha**: 2.299/3.175 node có cha
đang mang đúng `skill_id` của cha.

Phần lớn chuyện đó vô hại — node "Abstraction" nằm dưới "More about OOP" trỏ vào skill
của nhóm thì cũng chẳng mất gì, vì "Abstraction" không phải một skill thị trường. Chỗ
thật sự tốn: **node mang đúng tên một skill có dữ liệu thị trường nhưng lại trỏ đi chỗ
khác.** Node tên `Python` trong roadmap Data Science trỏ vào skill "Programming
Skills" (0 tin) thay vì `Python` (184 tin). Đó là 99 node đang vứt đi tín hiệu thị
trường thật, và `marketDemand`, `priorityScore`, Skill Map đều đọc qua liên kết này.

**Cái bẫy suýt dính:** quy tắc đầu tiên tôi định dùng là khớp tên **không phân biệt
hoa thường**. Nó gộp `ReAct` (kỹ thuật prompting cho LLM) với `React` (thư viện UI) và
sẽ gán cho node ReAct 61 tin tuyển React — đúng loại số bịa mà cả hệ thống này được
xây để tránh. Đổi sang khớp **phân biệt hoa thường**: 105 → 99 node, `ReAct` được giữ
nguyên. Ba trường hợp còn lại chỉ khác hoa thường thật (`PyTorch`/`Pytorch`,
`TensorFlow`/`Tensorflow`, `ElasticSearch`/`Elasticsearch`) đáng giá 2, 2 và 1 tin —
để lại cho quyết định alias của catalog, không gộp bừa.

Đã sửa 99 node trên DB **kèm bảng `skill_node_relink_undo`** để đảo ngược được mà
không cần dump, và vá 101 dòng `skill_group` trong `data/v2/roadmap_nodes_v6.csv` để
reseed không nuốt lại. CSV kiểm sau khi ghi: 10.456 dòng, 24 cột, 0 dòng lệch cột.

⚠️ **`data/` nằm trong `.gitignore`** (`.gitignore:307`) — toàn bộ CSV seed **không
được version control**. File log của lượt sửa này nằm trong scratchpad của phiên, tức
sẽ mất. Đây là một khoảng trống riêng, đáng sửa trước khi có thêm lượt vá dữ liệu nào.

Đảo ngược nếu cần:
```sql
UPDATE skill_nodes sn SET skill_id = u.old_skill_id
FROM skill_node_relink_undo u WHERE u.node_id = sn.node_id;
```

**Còn lại, chưa làm:** ~2.682 dòng CSV khác cũng có `skill_group` khác `name`. Không
sửa tay — đó là việc của `assign_node_skills.py` (script v4 vốn sinh ra để làm đúng
việc này và đã bỏ sót). Và sửa liên kết node **không** cải thiện mẫu số readiness:
Backend vẫn 16/29 core skill có dữ liệu thị trường, vì con số đó đọc từ
`career_required_skills` chứ không từ node. Chỉ F4b (§4) mới chạm được.

---

## 6b. ✅ Spine roadmap xếp theo bảng chữ cái (làm xong 2026-08-05)

Nguyên nhân gốc khiến ChoiceZone và MarketChoiceRail **cùng vẽ ra rỗng** dù cả hai đều
chạy đúng. Đo trên DB:

Backend, 9 bước đầu là **API Design, ASP.NET Core, Backend Beginner, Golang, Kotlin,
Laravel, PostgreSQL DBA, Scala** — tám roadmap nhập khẩu xếp **theo bảng chữ cái**.
Đường học thật bắt đầu ở vị trí **10** (`Internet`) và chạy mạch lạc tới 23. Frontend
y hệt: `Design System`, `Frontend`, `Frontend Beginner`, `TypeScript` chiếm 1–4, đường
thật bắt đầu ở 6.

Hai hệ quả sinh viên nhìn thấy:

1. `Pick a Language` là bước **11** → render **khoá** sau 8 bước không liên quan → nhóm
   khoá thì không trả option → zone không có gì để bọc, rail không có gì để xếp hạng.
2. Chín bước đầu **không phụ thuộc vào sinh viên chút nào** → mọi sinh viên mở lên thấy
   y chang nhau, đúng cái đã khiến dự án bị từ chối trước đây.

Riêng root `Frontend` (43 hậu duệ) là **bản sao bóng của cả spine** — VCS Hosting, SSR,
SSG, Design Systems, Performance, Accessibility, PWAs, mỗi cái trùng một root đã có nội
dung thật. Chỉ `AI Assisted Coding` (9) là mới.

**Đã làm** — `db/migration/2026-08-05_roadmap_spine_order.sql`:

| việc | kết quả đo được |
|---|---|
| Golang / Kotlin / Scala → `Pick a Language` | chooser từ 6 lên **9 option**, nhỏ nhất 71 node |
| ASP.NET Core → `C#`, Laravel → `PHP` | C# 110→**268**, PHP 41→**121** |
| PostgreSQL DBA → `Relational Databases` | 7→**128** |
| TypeScript → `JavaScript` (Frontend) | JavaScript 85→**114** |
| `AI Assisted Coding` cứu lên root | giữ được 9 node duy nhất không trùng |
| Vỏ `Frontend`, `Frontend Beginner`, `Backend Beginner` + hậu duệ → DRAFT | 193 node bị giữ lại, **0 node mồ côi** |
| Xếp lại spine bằng tay | Backend 15 root bắt đầu `Internet` → `Pick a Language`; Frontend 24 root bắt đầu `Internet` → `HTML` |
| Nối `skill_id` cho 3 ngôn ngữ vừa chuyển | Golang→**Go** (36 tin), Kotlin (9), Scala (1) — nếu không nối thì Golang hiện "No posting data" trong khi thị trường có 36 tin |

Mọi thay đổi ghi vào `skill_node_zone_undo` + `skill_node_order_undo` mới; không xoá gì.
`depth`/`root_node_id` đổi 764 hàng, `subtree_size` đổi đúng **6** hàng — bằng đúng số
tổ tiên mới (Pick a Language, C#, PHP, Relational Databases, JavaScript, vỏ Frontend).

**Full Stack cố tình không đụng.** 42 root, `subtree_size` toàn 0–3: nó không sai thứ
tự, nó **chưa có nội dung**. Sắp lại node rỗng chỉ làm nó *trông* xong.

⚠️ Migration này phải chạy **sau** `2026-08-05_roadmap_choice_zones.sql`, và trong **một
transaction** (`psql -1`) vì nó dùng temp table `ON COMMIT DROP`.

---

## 7. 🟡 Reseed vẫn là thao tác thủ công nhiều bước

Seeder **chưa tự tính** `depth` / `sort_order` / `subtree_size` / `root_node_id`, nên
mỗi lần reseed phải chạy lại `scratchpad/standardize-roadmap-structure.sql` bằng tay.
Quên một lần là thứ tự node quay về trạng thái hỏng đã mô tả ở
`roadmap-status-2026-08-03.md` §1.1 — và lần hỏng đó **đã từng lọt ra UI**: toán tử
MongoDB (`$all`, `$and`, `$eq`) hiện lên làm việc-cần-làm đầu tiên của sinh viên, vì
`$` (ASCII 36) đứng trước mọi chữ cái khi sort rơi về `node_name`.

**Hướng giải quyết:** đưa phép tính đó vào chính seeder (một lần `UPDATE` sau khi nạp
xong), hoặc tối thiểu gộp vào cuối init SQL để nó chạy cùng schema. Việc gì phải nhớ
làm bằng tay thì sớm muộn cũng có lần quên.

---

## 8. Bài học quy trình rút ra từ F10 (đáng ghi lại nhất)

F10 lẽ ra chỉ là "đánh `@Deprecated` và đổi 5 thành 4". Khi đo mới lộ ra:

> **8 cột `skill_nodes` mà entity đang map không hề tồn tại trong bất kỳ file init SQL
> nào** — `depth`, `sort_order`, `subtree_size`, `root_node_id`, `difficulty`,
> `estimated_hours`, `objectives`, `why_it_matters`.

Chúng được thêm tay vào DB đang chạy qua nhiều phiên (`scratchpad/add-node-depth.sql`)
và chưa bao giờ ghi ngược về repo. Với `ddl-auto: none` và không Flyway, một lần
`docker compose up` sạch sẽ dựng ra schema mà Hibernate **không đọc nổi** → mọi
endpoint chạm node trả 500. Đã vá ở F10, áp cho cả hai bản init và kiểm idempotent
trên DB thật.

**Quy tắc rút ra, áp cho mọi việc còn lại trong file này:** SQL chạy tay trong
`scratchpad/` **không phải là schema**. Chưa nằm trong init SQL thì coi như chưa tồn
tại. Và **đo trước khi kết luận** — trong đợt này, số đo đã lật ngược 5 giả định của
bản kế hoạch (mẫu số readiness, tập importance cho Jaccard, kênh kích thước bong
bóng, ý nghĩa `week_stamp`, và cả `node_level`).

---

## 9. Thứ tự đề nghị

| # | việc | vì sao trước |
|---|---|---|
| 1 | §1 commit + push 4 repo | mất dữ liệu là hỏng không cứu được, mọi thứ khác chỉ là hỏng tạm |
| 2 | §5 xem UI bằng mắt | rẻ nhất, và lộ lỗi nhanh nhất |
| 3 | §6 sửa 15 node trỏ nhầm skill | 15 dòng SQL, chặn số liệu sai lan tiếp |
| 4 | §2 `completion_policy` + `required_proficiency` | mở đường evidence→hoàn thành, hiện đang tắc hoàn toàn |
| 5 | §3 bật cổng FR2.3 | cần §2 xong để biết node nào thật sự là lá có nội dung |
| 6 | §4 F4b phân loại 442 skill | đắt nhất, và giá trị của nó phụ thuộc UI đã đọc được |
| 7 | §7 gộp chuẩn hoá cấu trúc vào seeder | dọn nợ quy trình, làm lúc nào cũng được |
