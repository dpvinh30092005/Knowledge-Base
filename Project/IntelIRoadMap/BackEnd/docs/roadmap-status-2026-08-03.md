# IntelliPath — Trạng thái thật của roadmap động

> Cập nhật 2026-08-03. Mọi con số dưới đây đo trực tiếp trên DB `intelipath` trong
> phiên này, không phải ước lượng.

---

## 0. Dữ liệu đang dùng

Seeder đọc bằng `new File(...)`, tức **đường dẫn tương đối theo thư mục chạy**, không
phải classpath. `src/main/resources/data/` **rỗng** — file thật nằm ở
`intelipath-backend/data/`. Đây là một điểm giòn: chạy jar từ thư mục khác là seed
im lặng không có gì.

| file | vai trò |
|---|---|
| `data/v2/roadmap_nodes_v6.csv` | node roadmap (chính) — fallback `roadmap_nodes.csv` |
| `data/v2/skills_v5.csv` | catalog skill — fallback `skills.csv` |
| `data/v2/careers.csv` | 8 career |
| `data/flm_overlay.json` | overlay chương trình FPT |
| `data/v2/incoming/*.csv` | nguồn thô roadmap.sh, đầu vào cho `merge_incoming.py` |
| `data/v2/roadmap_roots.csv` | 149 root cần AI xếp thứ tự (báo cáo, chưa dùng) |

Các file `_v3`, `_v4`, `_v5` giữ lại theo yêu cầu, không còn được đọc.

---

## 1. ĐÃ LÀM

### 1.1 Chuẩn hoá cấu trúc `skill_nodes` ✅

`node_level` mang **hai nghĩa** nên mọi consumer phải đoán. Bằng chứng:

- 2.610 node có `node_level = 0`, còn lại rải đều 1…14 **ở mọi độ sâu**
  → nó là thứ tự trong roadmap nguồn, không phải vị trí trên spine
- ở depth 0 chỉ 32/149 node có level 0 → luật "gốc + level 0" là **trùng hợp**
- 585 nhóm anh em trùng `node_level` → thứ tự anh em **không xác định**

Thêm 4 cột, mỗi cột một nghĩa duy nhất: `depth`, `sort_order`, `subtree_size`,
`root_node_id`. `node_level` đánh `@Deprecated` kèm lý do. 9/9 kiểm tra = 0.

### 1.2 Sửa `prerequisite` trỏ vào hư không ✅

`extract_prerequisites.py` ghi **slug nguồn** (`"computer-science-sorting"`) vào jsonb
trong khi `node_id` là UUID sinh mới → **cả 1.498 quan hệ đều không tra cứu được**.
Dựng lại từ FK `previous_node` (vốn map đúng). Còn **1.488** sau khi bỏ 10 quan hệ
tự trỏ theo tên (`JavaScript` yêu cầu `JavaScript`).

> 152 quan hệ "xuyên roadmap" đã kiểm tra: **hợp lệ**, đó là chuỗi spine.

### 1.3 Node sâu là roadmap riêng ✅

Luật cũ (`gốc + level 0`) trượt `Java` vì Java treo dưới `Pick a Language`. Luật mới:
**`subtree_size >= 12`**, bất kể vị trí. Bắt đủ Java 71, Python 122, C# 110, Rust 99.
Không bao giờ giấu chính node đó → không career nào bị làm rỗng.

`GET /roadmaps/student/sub/{nodeId}` + breadcrumb `Backend › Java`. View con không vẽ
lại node gốc và phát `depth` **tương đối**, nên con của gốc lên làm spine.

### 1.4 Chọn ra thay vì ẩn bớt ✅

Nhánh CHOOSE_ONE không chọn: **bỏ hẳn khỏi payload** thay vì tô xám. Node lựa chọn
vẫn ở lại (đổi ý được), chỉ ruột bị cắt. Backend "Pick a Language": chọn Java bỏ 372
node.

### 1.5 Extraction skill ✅

Ba lỗi, lỗi thứ ba mới là gốc:

| lỗi | tác động |
|---|---|
| `C++` khớp cả `C` | nhỏ |
| sắp dài-trước-ngắn nhưng không ăn mòn văn bản | vừa |
| **ranh giới ASCII, chữ Việt có dấu bị coi là ranh giới từ** | `C` = 347/866 tin |

`của`, `các`, `cần` đều khớp `C`. Sửa bằng `\w` Unicode. **`C`: 750 → 28.**
48 test Python.

### 1.6 Scraper ✅

`scraper.recruitments` thiếu cột `dedup_key` (chỉ thêm vào DB `intelipath`), nên
52 phút cào chỉ lưu được công ty, **0 tin**. Sửa xong: **866 tin**, 501 skill,
**10 skill vượt ngưỡng 8%**.

### 1.7 Khác ✅

- `PrerequisiteMerger` — 3 luật máy kiểm được, **không có mentor duyệt**
- `LearningPlanPanel` nối `/roadmaps/student/plan` vào UI (trước đó là code chết)
- 4 cột chiều sâu node: `difficulty`, `estimated_hours`, `objectives`, `why_it_matters`
- node hiện `currentProficiency` vs ngưỡng + câu luật hoàn thành
- `findOneBySkillNameIgnoreCase` — sửa `NonUniqueResultException` làm mất cả lượt extract
- layout serpentine → **wrap theo thứ tự đọc** + số thứ tự trên node

**Trạng thái test: 122 backend, 48 python, TypeScript sạch.**

---

## 2. ĐANG LỖI / CHƯA XONG

### 2.1 🔴 Chưa nhìn tận mắt bất kỳ thay đổi UI nào

Toàn bộ phần frontend phiên này **chỉ đúng về kiểu dữ liệu**. Không mở được trình
duyệt (không nhập mật khẩu hộ được). Ba thứ nghi ngờ nhất:

- roadmap con sau khi sửa `depth` tương đối — đã hết một cột dọc chưa
- breadcrumb ở góc trên trái có đè lên rail công cụ không
- chỗ gập cuối hàng của layout wrap

### 2.2 🔴 Hai lựa chọn ngôn ngữ rỗng ruột

`JavaScript (Node.js)` và `JavaScript` là hai lựa chọn song song trong
"Pick a Language", **cả hai đều 0 node con**. Sinh viên chọn trúng → roadmap rỗng.
Lỗi merge, chưa vá.

### 2.3 🟡 149 root chưa có thứ tự xuyên roadmap

`roadmap_roots.csv` đã sinh. Cần analyzer LLM sinh cặp `(before, after, confidence,
reason)` rồi đẩy qua `PrerequisiteMerger`. **Chưa viết.**

Chưa quyết: endpoint admin ghi thẳng DB, hay script Python sinh CSV cho seeder
(tái lập được qua mỗi lần reseed — nên chọn cái này).

### 2.4 🟡 4 cột chiều sâu node đang rỗng

`difficulty`, `estimated_hours`, `objectives`, `why_it_matters` — schema có, dữ liệu
**0/4.177**. Cần cùng một lượt AI với 2.3.

### 2.5 🟡 Tầng 3 nghề nghiệp chưa có

- `career_roles.parent_career_id` — chưa thêm
- `students.stack_node_id` — chưa thêm
- UI hỏi ngôn ngữ ở bước chọn career — chưa làm

Backend đã sẵn sàng nhận: `nodesInsideEnterables(nodes, keep)` giữ roadmap đã chọn
nằm trong spine. Chỉ thiếu chỗ lưu lựa chọn và chỗ hỏi.

### 2.6 🟡 Market Pulse chưa có hướng xu thế

`direction` (UP/FLAT/DOWN) + `changePercent` chưa làm. Dữ liệu đã đủ (866 tin,
5 tuần) nhưng so hai cửa sổ trên 5 tuần vẫn là nhiễu. Cần vài tuần cào đều.

### 2.7 🟡 AI planner + verifier

`RoadmapPlanAnalyzer` + `RoadmapPlanVerifier` với 6 ràng buộc, 2 vòng sửa, rơi về
`RoadmapEdgeResolver`. **Chưa bắt đầu.** Phụ thuộc 2.3 và 2.4.

### 2.8 🟡 Catalog skill còn rác

3.397 skill, **1.339 có node (39%)**, 501 có mặt thị trường. Tên kiểu
"Organize code by actor it belongs to" là tiêu đề roadmap, không phải kỹ năng.
`prune-skill-catalog.sql` đã viết, **chưa chạy**.

Khớp tag tuyển dụng: 160/344 khớp đúng tên (47%), 69% theo lượt. Còn thiếu:
- **alias**: `ReactJS`→React, `NodeJS`→Node.js, `Golang`→Go, `NextJS`→Next.js
- **loại trừ**: `English` (199 tin!), `Fresher Accepted`, `Tester`, `Data Engineer`
- **thiếu thật**: `QA QC`, `Automation Test`, `ERP`, `Embedded`, `DevSecOps`

### 2.9 ⚪ Task #25 — cổng xuất bản FR2.3 (chỉ node lá)

---

## 3. RỦI RO KỸ THUẬT

| | |
|---|---|
| 🔴 **Chưa có repo git nào** | `git rev-parse` fail ở cả 3 thư mục. Toàn bộ công việc nhiều phiên chỉ tồn tại dưới dạng file trên một ổ đĩa. |
| 🟡 Seeder đọc theo CWD | `new File("data/v2/...")` — chạy từ thư mục khác là seed rỗng, không báo lỗi |
| 🟡 `ddl-auto: none`, không Flyway | mọi thay đổi schema là SQL chạy tay; entity thêm field trước khi chạy SQL là **sập toàn bộ endpoint** (đã xảy ra với `difficulty`) |

---

## 4. THỨ TỰ ĐỀ XUẤT

1. **Xác minh UI** (2.1) — rẻ nhất, đang chặn mọi kết luận về frontend
2. **`git init`** (3) — không ép commit sớm, chỉ là có chỗ để commit
3. **Alias + loại trừ catalog** (2.8) — tác động lớn nhất trên mỗi giờ bỏ ra
4. **Một lượt AI làm cả 2.3 + 2.4** — cùng prompt, cùng endpoint
5. **Tầng stack** (2.5)
6. **Planner + verifier** (2.7)
7. **Market Pulse direction** (2.6) — sau vài tuần cào đều

---

## 5. SQL

| file (scratchpad) | trạng thái |
|---|---|
| `standardize-roadmap-structure.sql` | ✅ đã chạy, 9/9 = 0 |
| `add-node-depth.sql` | ✅ đã chạy |
| `fix-scraper-dedup-key.sql` | ✅ đã chạy |
| `merge-duplicate-skills.sql` | ✅ đã chạy |
| `reseed-roadmap.sql` | ✅ đã chạy |
| `prune-skill-catalog.sql` | ❌ **chưa chạy** |

⚠️ `standardize-roadmap-structure.sql` phải **chạy lại sau mỗi lần reseed** — nó tính
`depth`/`sort_order`/`subtree_size` từ dữ liệu, seeder chưa tự làm. Về lâu dài nên
đưa vào seeder.
