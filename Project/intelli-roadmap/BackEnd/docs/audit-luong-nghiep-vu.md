# Soát luồng nghiệp vụ so với đề — các khúc mắc

> Ngày soát: 2026-08-02
> Cách soát: đọc code thật + truy vấn DB dev, **không** tin mô tả trong tài liệu hay tên hàm.
> Mỗi mục đều có bằng chứng kiểm chứng lại được (đường dẫn file, số dòng, câu SQL).

Mục đích: phân biệt rõ **luồng nghiệp vụ thật** (có dữ liệu chạy qua, có thuật toán, kiểm chứng
được) với **logic chỉ để render UI** (màn hình đẹp nhưng phía sau không có gì, hoặc có nhưng
không ai đọc).

---

## 0. Tóm tắt

| Mức | Số mục | Ý nghĩa |
|---|---|---|
| Mức | Còn lại | Đã sửa | Ý nghĩa |
|---|---|---|---|
| 🔴 Nghiêm trọng | 2 | **2** | Luồng gãy hoặc giả — người dùng tưởng có tác dụng nhưng không |
| 🟠 Thiếu / che giấu lỗi | 4 | **1** | Đề yêu cầu nhưng chưa có code, hoặc lỗi bị nuốt im lặng |
| 🟡 Có luồng nhưng yếu | 7 | 0 | Chạy thật nhưng số liệu chưa đáng tin / tên gọi nói quá |
| 🟢 Luồng thật, kiểm chứng được | 10 | — | Có pipeline, có thuật toán, endpoint khớp đầy đủ |

**Đã sửa trong phiên 2026-08-02:** §1.1 (trả lời feedback giả), §1.4 (scraper không tích luỹ),
§4b.1 (mentor nuốt lỗi). Chi tiết ở §7.

**Hai mục 🔴 còn lại là *xây tính năng mới*, không phải sửa luồng sai:** §1.2 (RQ1 — đọc commit/diff
GitHub) và §1.3 (FR2.3 — cổng xuất bản node). Cả hai đổi hành vi người dùng nhìn thấy nên cần bạn
quyết trước khi làm — xem §5.

Đã soát **cả 4 vai**: Student, Mentor, Counselor, Admin (+ Portfolio công khai).
Riêng Mentor/Counselor/Admin/Portfolio: **44/44 endpoint FE gọi đều tồn tại thật ở backend**,
đúng cả HTTP method — chi tiết ở §4b.

Nhận xét của giảng viên — *"đang làm như 1 prompt AI thôi, không có luồng gì"* — **đúng một phần**.
Có những luồng thật sự (mục §4), nhưng chúng **không lộ ra ở chỗ người chấm hay mở**, còn những
chỗ dễ mở nhất (Market Pulse, phản hồi mentor) thì đúng là mỏng hoặc giả.

---

## 1. 🔴 Nghiêm trọng

### 1.1 ~~Trả lời phản hồi mentor là hàm giả~~ — ✅ **ĐÃ SỬA**

`FrontEnd/intelipath-frontend/src/api/studentApi.ts:48-57`

```ts
replyFeedback: async (feedbackId: string, content: string) => {
  // NEW LOGIC: Instant resolve for mock
  return { success: true };
},
```

Không có request nào được gửi. Đã grep toàn bộ backend: **không tồn tại endpoint**
`replyFeedback` / `REPLY_FEEDBACK` nào.

Hệ quả: sinh viên gõ phản hồi cho mentor, bấm gửi, UI báo thành công, **nội dung biến mất**.
Không lỗi, không log, không lưu. Đây là ví dụ rõ nhất của "chỉ là logic show UI".

Tham số `feedbackId` và `content` được nhận rồi bỏ đi.

**Đã sửa (2026-08-02):** dựng luồng thật, không gỡ nút.

- `FeedbackService.replyToFeedback(feedbackId, content)` + impl — trả lời là **một dòng
  `feedback` ngược chiều** (sender/receiver đảo), nên hộp thư, trạng thái chưa đọc, email thông báo
  và đính kèm đều dùng lại được, **không cần bảng thread mới**
- Chỉ **người nhận** mới trả lời được (`ForbiddenException`) — nếu không, bất kỳ ai đăng nhập cũng
  chen được vào hội thoại của người khác chỉ bằng cách đoán `feedbackId`
- Trả lời cũng tự đánh dấu tin gốc là READ — đã trả lời tức là đã đọc
- Email lỗi thì **không** làm hỏng request (đã lưu rồi), chỉ log cảnh báo
- `POST /api/v1/student/dashboard/mentor-feedback/{id}/reply` + `ReplyFeedbackRequest` (validate rỗng)
- FE gọi thật, **và quan trọng hơn**: `setReplySuccess()` trước đây chạy vô điều kiện; giờ lỗi hiện
  banner đỏ. Tin nhắn mất mà sinh viên tưởng đã gửi là kết cục tệ nhất.

---

### 1.2 RQ1 (nhận diện năng lực qua coding patterns) chưa có dòng code nào

Đề có 2 Research Question, RQ1 là *"AI nhận diện năng lực tiềm ẩn của sinh viên qua **coding
patterns**"*. RBL chấm nặng phần RQ.

`clients/GithubApiClient.java` hiện chỉ có:

| Hàm | Làm gì |
|---|---|
| `getRepoMetadata` | mô tả, branch, sao, homepage |
| `fetchFileContent` / `fetchRepoFile` | đọc 1 file |
| `listOwnedRepos` | liệt kê repo |

**Không có** `stats/contributors`, không đọc commit, không đọc diff. Nghĩa là hệ thống chưa từng
nhìn vào *cách sinh viên viết code* — chỉ nhìn metadata repo và README.

Nói cách khác: phần đang có trả lời được câu "sinh viên có repo gì", **không** trả lời được câu
"sinh viên viết code ra sao", mà đó mới là RQ1.

**Cần làm:** 3 endpoint GitHub (contributor stats, list commits by author, commit detail) + chấm
tỉ lệ đóng góp theo số dòng + cho AI đọc diff **bắt buộc trích dẫn `file:line`** (không trích dẫn
= FAIL, chống bịa).

---

### 1.3 FR2.3 — 212/1200 node vi phạm luật "tối thiểu 2 link"

Đếm trực tiếp trên DB:

```sql
SELECT CASE WHEN resource IS NULL THEN '0 link'
            WHEN jsonb_array_length(resource)=0 THEN '0 link'
            WHEN jsonb_array_length(resource)=1 THEN '1 link'
            ELSE '>=2 link' END AS so_link, count(*)
FROM skill_nodes GROUP BY 1;
```

| Số link | Số node |
|---|---|
| ≥2 link | 988 |
| 1 link | 121 |
| **0 link** | **91** |

**17.7% node vi phạm.** Đây là loại lỗi người chấm mở DB hoặc bấm vài node là thấy, và đếm được
thành con số.

**Cần làm:** cột `status` (DRAFT/PUBLISHED) + roadmap chỉ đọc `PUBLISHED`, kèm test tự động
`everyPublishedNodeHasAtLeastTwoResourceLinks()`. Cách này giữ được kho node lớn mà vẫn tuân thủ.

---

### 1.4 Scraper đào lại cùng một tập mỗi ngày, không đảm bảo bắt được tin mới

`intelipath-service/app/scrapers/parsers/itviec_parser.py`

Lịch: 09:00 hằng ngày (`JobScrapingScheduler:58`), cào `SCRAPER_LIMIT` tin.

Hai vấn đề chồng nhau:

1. **URL không có tham số sort** → duyệt theo thứ tự mặc định của ITviec (trộn tin tài trợ +
   độ liên quan), **không phải mới nhất trước**. Tin vừa đăng nằm ở vị trí nào là do thuật toán
   xếp hạng của họ, rất có thể **nằm ngoài giới hạn** và không bao giờ được lấy.
2. **Luôn tải trang chi tiết trước rồi mới kiểm tra DB** (dòng ~279): mỗi ngày tốn đủ N request
   để phát hiện "đã có rồi, không ghi gì".

Bằng chứng trong dữ liệu: 205 tin trải suốt 6 tuần (18-06 → 28-07). Nếu thật sự lấy mới-nhất-trước
thì 205 tin phải dồn vào vài ngày cuối, vì ITviec đăng nhiều hơn thế rất nhiều trong 6 tuần.

**Đây chính là chỗ "chạy hằng ngày nhưng không tích luỹ"** — vòng lặp lặp lại chứ không tiến lên.

**Đã sửa (2026-08-02):**

- `ITVIEC_SORT_QUERY` cấu hình được + `_check_newest_first()` cảnh báo khi trang 1 không giảm dần
  theo ngày, **phân biệt rõ** "chưa cấu hình sort" với "cấu hình rồi nhưng tham số sai"
- **Early stop**: đếm số tin *thực sự mới* mỗi trang; trang nào không có tin mới nào thì dừng.
  Biến vòng lặp lặp lại thành vòng lặp tích luỹ — chạy hằng ngày chỉ chạm 1–2 trang thay vì 50
- Early stop **có điều kiện `sort_configured`**: không sort mới-nhất-trước thì thứ tự tuỳ ý, một
  trang toàn tin cũ **không** nói gì về các trang sau, dừng ở đó sẽ bỏ sót tin thật

**Còn lại (cần bạn):** điền giá trị `ITVIEC_SORT_QUERY` thật — copy từ chính nút sắp xếp của ITviec.
Chưa có nó thì early stop nằm im và scraper vẫn duyệt hết như cũ.

---

## 2. 🟠 Đề yêu cầu nhưng chưa có

### 2.1 FR3.3 — xuất báo cáo/PDF khoảng cách kỹ năng

Đề: *"Generate a visual report or PDF of missing skills and priorities"*.

Đã grep toàn bộ `controllers/` + `services/`: **không có endpoint export nào**. `PdfToMarkdownService`
là chiều ngược lại (đọc PDF transcript vào), không phải xuất ra.

FR3.2 (so khớp skill với yêu cầu nghề) **thì có thật** — `StudentDashboardServiceImpl:149`
`getSkillGaps()` đọc `findMissingRequiredSkills` + `calculateSkillProgress`. Nhưng dừng ở JSON
cho UI, không có bản xuất.

**Lưu ý khi làm:** phải **nhúng font Unicode** (DejaVuSans/Roboto), không thì dấu tiếng Việt mất sạch.

---

### 2.2 FR2.2 — "prioritised sequence" chưa có ưu tiên

Đề: *"Generate a hierarchical Skill Tree in a **prioritised** sequence"*.

Cây thì có. Thứ tự ưu tiên thì không: grep `importance|priority|frequency` trong
`RoadmapServiceImpl` → **0 kết quả**. Node sắp theo `nodeLevel`, `nodeName` (dòng 156) — tức là
thứ tự tác giả nhập, không phải mức độ quan trọng với thị trường.

Bảng `career_targets` (thứ quyết định "cái gì quan trọng") **chưa tồn tại** — đã kiểm tra
`domain/entity/`, không có entity Target nào. Đó là Phase 3 trong plan, chưa triển khai.

---

### 2.3 RQ2 chưa có số đo hiệu quả

Đề hỏi *"how **effective** is a dynamic roadmap that updates from real-time job trend analysis"*.
"Effective" cần **con số**, không phải mô tả tính năng.

Chưa có phần đo. Plan §9.3 đã ghi sẵn cách: giữ lại 20 tin không dùng để tính target, so
`precision = |target ∩ posting| / |target|` và `recall`, báo cáo trung bình.

Không có bảng này thì RQ2 là mô tả chức năng chứ không phải nghiên cứu.

---

### 2.4 FR4.1 — đề ghi "LinkedIn, TopCV", hệ thống cào ITviec

Có parser cho cả ba (`topcv_parser.py`, `linkedin_parser.py`, `itviec_parser.py`) nhưng luồng
đang chạy là ITviec.

Không sai về bản chất (đều là job portal IT lớn ở VN) nhưng **phải giải trình trong báo cáo**:
ITviec nhúng sẵn schema.org JSON-LD nên parse ổn định; LinkedIn chặn scraping chủ động.

---

## 3. 🟡 Có luồng nhưng còn yếu

### 3.1 Mẫu 205 tin quá nhỏ để nói về "thị trường"

MB Bank đăng 18/205 tin = **9% toàn bộ "thị trường"** là một công ty. Mọi biểu đồ trending thực
chất phản ánh vài công ty lớn.

Đã nâng `SCRAPER_LIMIT` 200 → 1000, `max_scrape_limit` 200 → 1200, `scrapeJobTimeout` 40 → 120 phút.
**Chưa chạy** (tốn ~100 phút + ~1000 lời gọi LLM).

### 3.2 Trường `experience` gần như vô dụng

Chỉ **4 giá trị** cho 205 tin: `3.1 years` (116), `10 months` (63), `5.1 years` (19),
`No requirements` (7). 116 tin cùng một con số ⇒ đây là số chung của ITviec, không phải theo tin.

Vì vậy `SeniorityClassifier` **ưu tiên title trước** (44% title có từ chỉ cấp bậc rõ ràng).
Cần nói rõ lựa chọn này trong báo cáo, vì nó là quyết định thiết kế có căn cứ số liệu.

### 3.3 `application_deadline` bị bịa khi nguồn không khai

`itviec_parser.py:167` — không có `validThrough` thì lấy `now() + 30 ngày`.

Mà `RemoveOverdueJobScheduler` (08:00 hằng ngày) **xoá tin dựa trên chính hạn chót này**. Tức là
hệ thống tự đặt hạn rồi tự xoá theo hạn đó. 30 ngày là hợp lý nhưng **không phải sự thật từ nguồn**
— phải ghi chú, đừng để người chấm tự phát hiện.

Ngược lại `posted_date` **là dữ liệu thật**, lấy từ `datePosted` trong JSON-LD, không khai thì để
`None` chứ không đắp ngày (dòng 177-183). 205/205 tin đều có ngày.

### 3.4 `skill_trends` chỉ trải 3 tuần nhưng hằng số ghi 90 ngày

DB: `week_stamp` từ 2026-07-06 → 2026-07-27. `MarketDemandService.WINDOW_DAYS = 90`.

Con số "nhu cầu thị trường" hiện lên roadmap thực chất là cửa sổ ~3 tuần. Không sai công thức,
nhưng nhãn đang nói quá phạm vi dữ liệu.

### 3.5 Lọc theo level: JUNIOR chỉ có 6 tin

Sau phân loại: SENIOR 103, FRESHER 56, MID 40, **JUNIOR 6**.

Sinh viên JUNIOR bật lọc thấy 6 job. Đúng dữ liệu nhưng trải nghiệm kém. Cân nhắc đổi thành
"level của bạn **trở xuống**" (JUNIOR + FRESHER = 62) — hợp với người tìm việc hơn.

Ngoài ra `manager|lead|expert` đang xếp vào SENIOR nên SENIOR chiếm 50%. Có thể tranh luận.

### 3.6 461 node có `required_proficiency = 2`, tức gần như không có cổng nào

`required_proficiency` là **ngưỡng confidence thang 0–100**, không phải thang 1–4 (xem
`RoadmapPersonalizationServiceImpl.meetsNodeProficiency`). Phân bố thật trên 1.200 node:

| giá trị | số node | nghĩa thật |
|---|---|---|
| 0 | 394 | rơi về mặc định 0.70 — ổn |
| 2 | 461 | ngưỡng **0.02** — bằng chứng yếu cỡ nào cũng đủ để bỏ qua node |
| 65 | 345 | ngưỡng 0.65 — hợp lý |

461 node đó thực tế **không có cổng**: chỉ còn `importanceFloor` chặn, và node nào không nằm trong
`career_required_skills` thì không có cả floor. Đây là lỗi dữ liệu (nhiều khả năng ai đó điền theo
thang 1–4), không phải lỗi code — sửa bằng UPDATE, không sửa bằng đổi công thức.

---

## 4. 🟢 Luồng thật, kiểm chứng được — **dùng những mục này để phản biện**

Đây là phần nên đưa ra khi bị nói "chỉ là prompt AI".

### 4.1 Pipeline thu thập → xử lý → phân tích

```
ITviec (JSON-LD)
  → itviec_parser        → DB Scraper: recruitments (thô)
  → processor            → DB Scraper: processed_recruitments   [LLM tóm tắt, chỉ dòng mới]
  → GET /api/recruitments
  → JobScrapingScheduler → DB intelipath: recruitments
  → SkillExtractionService → skill_trends                        [nhóm theo (skill, tuần)]
```

Hai database riêng, có tầng xử lý ở giữa. LLM chỉ đóng vai **trích skill từ mô tả**, không phải
toàn bộ hệ thống.

### 4.2 Thuật toán tính trạng thái node roadmap — không dùng AI

`RoadmapServiceImpl:519-576` `buildFrontendStatusMap`:
- sắp xếp topo (Kahn) theo `parentNode`/`previousNode` để phụ thuộc được xét trước
- khoá theo stage (`stageUnlockKey`, mọi node của stage phải xong)
- node cha tự hoàn thành khi tỉ lệ trọng số con ≥ ngưỡng (mặc định 0.6)
- đường ghi cũng dùng lại chính hàm này để **từ chối** ghi vào node đang khoá (403)

### 4.3 Engine gợi ý bỏ qua node — cố ý không dùng LLM

`RoadmapPersonalizationServiceImpl`: chấm bằng ngưỡng confidence, so `requiredProficiency`, chỉ
áp dụng cho node `completionPolicy = EVIDENCE_ALLOWED`. Có `RoadmapRecommendation` làm vết kiểm toán.

### 4.4 Bộ dữ liệu roadmap tự dựng

10.404 node nhập từ roadmap.sh, quan hệ cha-con **suy ra từ hình học** (bounding box của `section`
chứa `label`) vì repo gốc không còn cây. 3.634 dòng skill ghép từ nhiều nguồn.

### 4.5 Bài đánh giá năng lực (làm trong phiên này)

- Câu hỏi **dựng deterministic** từ `career_required_skills` (HIGH→AVG→LOW, cap 15) — không để AI
  sinh câu hỏi, vì (a) tên skill phải khớp catalog nếu không evidence bị vứt, (b) chấm phải giải
  thích được
- AI chỉ **chấm** phần văn bản sinh viên tự viết, có quyền hạ bậc, **không được nâng** quá mức
  sinh viên tự khai
- `SeniorityCalculator` là **công thức**, lấy min với kết quả AI
- **Trần JUNIOR**: tự khai mà không có bằng chứng khách quan thì `ratioVerified = 0` → cap JUNIOR
- Trần confidence 0.80 < ngưỡng HIGH 0.85 ⇒ **tự đánh giá không bao giờ bỏ qua được node nền tảng**

### 4.6 Phân loại cấp bậc tin tuyển dụng

`SeniorityClassifier` — luật + parse số, tái lập được. Bẫy đã xử lý: `"10 months"` nếu không nhận
đơn vị tháng sẽ thành 10 năm và 63 tin entry-level bị xếp SENIOR.

---

## 4b. Soát riêng: Mentor / Counselor / Admin / Portfolio

Phương pháp: đối chiếu **từng hằng số endpoint bên FE** với **từng `@GetMapping`/`@PostMapping`…
bên backend**, kiểm cả HTTP method, rồi đọc impl để xem có trả dữ liệu thật không.

### Kết quả tổng

| Nhóm | Endpoint FE gọi | Có thật ở backend | Kết luận |
|---|---|---|---|
| Mentor | 9 | 9/9 ✅ | Luồng thật |
| Counselor | 15 | 15/15 ✅ | Luồng thật |
| Admin | 13 | 13/13 ✅ | Luồng thật |
| Portfolio | 7 | 7/7 ✅ | Luồng thật |

**Không có tính năng giả nào trong bốn nhóm này.** Vụ `replyFeedback` (§1.1) nằm ở phía sinh viên,
không phải mentor.

### 4b.1 ~~Mọi lỗi API của mentor bị nuốt im lặng~~ — ✅ **ĐÃ SỬA**

`FrontEnd/.../features/mentor/api/mentorApi.ts` — mọi hàm đều theo mẫu:

```ts
try { ... } catch { return []; }      // hoặc: catch { return null; }
```

Backend 500 hay 404 thì mentor thấy **dashboard trống, không một thông báo nào**. Không phân biệt
được "chưa có sinh viên nào" với "API hỏng".

Đây không phải tính năng giả, nhưng nó **giấu luồng hỏng** — nguy hiểm đúng lúc demo: nếu hôm đó
backend lỗi, màn hình vẫn "chạy bình thường", trống trơn, và không ai biết vì sao.

**Đã sửa (2026-08-02):**

- Viết lại `mentorApi.ts`: **bỏ toàn bộ `catch`**, giữ phần chuẩn hoá shape (`toArray`/`toObject`).
  Xử lý lỗi thuộc về view — tầng duy nhất nói được cho mentor biết có chuyện gì
- 4 view (`MentorDashboardView`, `MentorStudentsView`, `MentorFeedbackHistoryView`,
  `MentorProgressReportsView`) có `loadError` + banner đỏ `role="alert"`
- `submitFeedback` trước trả `{ success: false }` khi lỗi ⇒ `catch` trong `FeedbackModal`
  **không bao giờ chạy**, modal báo gửi thành công dù thất bại. Giờ nó ném, và try/catch sẵn có
  của modal tự hoạt động đúng — không cần sửa modal

### 4b.2 🟡 `getInsight` không phải AI insight

`services/impl/MentorServiceImpl.java:119-126`

```java
long pending = reviewRequestRepository.countByMentor_UserIdAndStatus(..., PENDING);
String insight = pending > 0
        ? "Có " + pending + " sinh viên đang chờ feedback portfolio từ bạn."
        : "Bạn đã xử lý hết các yêu cầu feedback. Làm tốt lắm!";
```

Có truy vấn thật, nhưng kết quả là **câu mẫu ghép số đếm** — không có phân tích, không có AI.
Bản thân nó không sai, nhưng **đừng gọi là "AI insight" trong báo cáo/slide**, vì mở code ra là
thấy ngay và mất uy tín cho những phần AI thật.

### 4b.3 🟡 Endpoint `mark-read` có ở backend nhưng FE không dùng

`CounselorController.java:243` — `@PatchMapping("/feedback/mark-read/{feedbackId}")`.
Grep toàn FE (`mark-read|markRead|MARK_READ`): **0 kết quả**.

**Kiểm tra thêm (2026-08-02):** giao diện counselor **không có** khái niệm đọc/chưa đọc nào —
không badge, không lọc theo `status`. Nên endpoint này không phải "gọi sai", nó là endpoint chưa có
màn hình nào cần đến.

**Cố ý chưa sửa.** Nối nó vào nghĩa là *tự chế thêm* một hộp thư có trạng thái đọc cho counselor —
đó là quyết định sản phẩm, không phải sửa luồng gãy. Hai lựa chọn, bạn chọn:
(a) dựng hộp thư counselor có badge chưa đọc rồi gọi endpoint này, hoặc (b) xoá endpoint.

Lưu ý: sau khi luồng trả lời (§1.1) hoạt động, counselor **sẽ thật sự nhận** tin trả lời từ sinh
viên, nên hộp thư có trạng thái đọc bắt đầu có ý nghĩa hơn trước.

### 4b.4 ✅ Counselor — đã nghi sai, kiểm tra lại thì đúng

Ban đầu tôi nghi 3 chỗ lệch, đọc kỹ thì **cả 3 đều khớp**, ghi lại để khỏi soát lại lần sau:

- `MISSING_SKILLS` hằng số không có path variable, nhưng `counselorApi.ts:105` nối
  `/${encodeURIComponent(careerName)}` → khớp `@GetMapping("/dashboard/missing-skills/{careerName}")`
- `DELETE_FEEDBACK` tên là "delete" nhưng FE gọi `.patch()` → khớp `@PatchMapping("/feedback/delete/{id}")`
- `CHECK_STUDENT_EMAIL` → `/counselor/import-student/{email}` khớp backend

Counselor có tổng hợp dữ liệu thật (`CounselorServiceImpl`: thống kê nghề, sinh viên thiếu skill,
feedback), xuất/nhập Excel thật bằng Apache POI.

### 4b.5 ✅ Portfolio — không có dữ liệu bịa ở backend

Chuỗi `"Student Name"` / `"student@example.com"` chỉ là **giá trị mốc phía FE** để biết portfolio
chưa được điền lần nào, rồi ghi đè bằng dữ liệu thật của user
(`pages/StudentPortfolioPage.tsx:26-52`). Grep backend: **không có** placeholder nào như vậy.

`id: "edu-mock-1"` chỉ là **tên id đặt xấu** cho một mục học vấn dựng từ `university` / `major` /
`admissionDate` thật của sinh viên — không phải dữ liệu giả. Nên đổi tên id để khỏi bị hiểu nhầm
khi người khác đọc code.

FR5.3 (URL công khai) có route thật: `AppRoutes.tsx:46` → `PublicPortfolioPage` →
`@GetMapping("/public-portfolio/slug/{slug}")`.

### 4b.6 ✅ Admin — đầy đủ và khớp method

13 lời gọi FE khớp 9 endpoint `AdminController` + 4 `AdminFlmController`, đúng cả method
(`patch` cho role/status, `delete` cho xoá user, `post` cho các trigger). Có trigger thật cho
scraper, trích skill, và đồng bộ FLM.

---

## 5. Việc cần làm, theo thứ tự

| # | Việc | Vì sao trước |
|---|---|---|
| 1 | Gỡ hoặc dựng thật `replyFeedback` | Tính năng giả, mở ra là thấy |
| 2 | Điền `ITVIEC_SORT_QUERY` + early stop | Không có thì cào 1000 tin vẫn không phải tin mới |
| 3 | Chạy scrape 1000 tin | Mọi số liệu hiện tại đều dựa trên mẫu quá nhỏ |
| 4 | `status` PUBLISHED + test FR2.3 | Lỗi đếm được, rẻ nhất để đóng |
| 5 | Bảng đo precision/recall cho RQ2 | Không có thì RQ2 không phải nghiên cứu |
| 6 | Xuất PDF gap (FR3.3) | Đề yêu cầu thẳng |
| 7 | GitHub commit/diff cho RQ1 | Nặng nhất, nhưng là nửa còn lại của phần RQ |
| 8 | Bỏ `catch { return [] }` ở `mentorApi` | Đang giấu luồng hỏng, rủi ro đúng lúc demo |
| 9 | Nối `mark-read` hoặc bỏ endpoint | Endpoint chết, trạng thái đã đọc không bao giờ đổi |

---

## 6. Những chỗ đã sửa trong phiên này

- `posted_date` được đọc và dùng: cửa sổ 7/30/90 ngày cho Market Pulse, danh sách job sắp mới nhất trước
- `dedup_key` (công ty + tiêu đề + địa điểm) chạy hết chuỗi scraper → backend, backfill 205 dòng.
  Kiểm chứng: 205 tin → 205 việc riêng biệt; 2 tin cùng tên "Test Automation Engineer" ở 2 công ty
  ra **2 key khác nhau** — lý do bắt buộc giữ company trong khoá
- Endpoint `/market-trends/freshness`: số việc trong cửa sổ, số việc **chưa từng đăng trước đó**,
  ngày đăng gần nhất
- Bỏ nhãn "Live job market" — dữ liệu mới nhất 28-07, không "live". Giờ ghi "Job data to 28 Jul"
- Sửa lỗi de-dup evidence: `recordSelfDeclaredEvidence` ghi status ACCEPTED, nên quy tắc "chỉ thay
  row PENDING" sẽ không bao giờ thay được row cần thay. Đổi sang khoá theo `detectedBy` (nguồn)
- Nâng giới hạn scrape 200 → 1000, timeout 40 → 120 phút

---

## 7. Đã sửa trong phiên 2026-08-02 (đợt sửa luồng sai)

Tất cả đều **compile sạch** (backend `BUILD SUCCESS`, frontend `tsc --noEmit` không lỗi).
**Chưa chạy thử trên trình duyệt** — xem §8.

### 7.1 Luồng trả lời feedback (§1.1) — từ giả thành thật

| Tầng | File |
|---|---|
| Service | `services/FeedbackService.java` + `services/impl/FeedbackServiceImpl.java` |
| Request DTO | `domain/dto/request/ReplyFeedbackRequest.java` |
| Controller | `controllers/StudentDashboardController.java` |
| FE api | `src/api/studentApi.ts` |
| FE endpoint | `src/shared/api/endpoints.ts` → `MENTOR_FEEDBACK_REPLY` |
| FE view | `src/features/student/feedback/StudentFeedbackPageView.tsx` |

Không thêm bảng nào: trả lời là một dòng `feedback` với sender/receiver đảo chiều.

### 7.2 Scraper thành incremental (§1.4)

`intelipath-service/app/scrapers/parsers/itviec_parser.py`
`intelipath-service/app/config/config.py` → `itviec_sort_query`

`_listing_url()`, `_check_newest_first()`, biến đếm `page_new_count` + early stop có điều kiện.

### 7.3 Mentor không còn nuốt lỗi (§4b.1)

`src/features/mentor/api/mentorApi.ts` viết lại (bỏ mọi `catch`), 4 view thêm `loadError` + banner
`role="alert"`.

### 7.4 🔴 Level của sinh viên bị kẹt vĩnh viễn ở JUNIOR — **lỗi nặng nhất tìm được**

**Triệu chứng:** không sinh viên nào có thể lên MID, dù import bao nhiêu project GitHub hay upload
bảng điểm.

**Nguyên nhân:** `SeniorityCalculator` bỏ qua mọi dòng `student_skills` có `proficiency IS NULL`, và
`ratioVerified` đếm dòng có `verified_by IS NOT NULL`. Nhưng **chỉ duy nhất assessment ghi hai cột
đó** — mà assessment cố tình ghi `verified_by = null` (nó *là* tự khai). Đường còn lại,
`RoadmapPersonalizationServiceImpl.syncCompletedSkillsToProfile`, tạo `StudentSkill` với cả
`proficiency` lẫn `verified_by` đều null:

```java
studentSkillRepository.save(StudentSkill.builder()
        .student(...).skill(skill).build());   // không proficiency, không verifiedBy
```

Hệ quả: `ratioVerified` **luôn = 0.00** cho mọi user trong hệ thống → `VERIFIED_FLOOR` (0.30) luôn
kích hoạt → `min(rawLevel, JUNIOR)` luôn chạy. Bằng chứng khách quan không có đường nào chạm tới
level. Đúng chỗ mà đề bài yêu cầu "AI đánh giá profile → user này ở mức độ nào".

**Sửa:** thêm `components/SkillProficiencyPromoter.java`, chạy *sau* sync hiện có trong
`acceptRecommendation`. Nó lấy evidence mạnh nhất của mỗi skill và đóng dấu lên dòng:

| Nguồn evidence | `verified_by` | Ngưỡng confidence → proficiency |
|---|---|---|
| `GITHUB_PROJECT` | `GITHUB` | ≥0.85 → 4, ≥0.70 → 3, còn lại 2 |
| `TRANSCRIPT` | `TRANSCRIPT` | như trên |
| `CHAT_FILE`, `MANUAL` | *null* (tự khai, giữ nguyên trần JUNIOR) | như trên |

Chỉ nâng, không bao giờ hạ: không ghi đè `proficiency` cao hơn, không xoá `verified_by` đã có. Chạy
lại / import lại cùng repo là idempotent. `syncCompletedSkillsToProfile` và
`recordEvidence` **không bị sửa** (đúng nguyên tắc additive).

### 7.5 Import project GitHub không hề cập nhật roadmap

`GithubPortfolioServiceImpl.analyzeRepo` gọi `recordEvidence` rồi dừng. Recommendation nằm PENDING
cho tới khi sinh viên tình cờ mở roadmap và bấm generate. Về phía sinh viên, import project **không
làm gì cả** — trong khi đề bài nói "cung cấp project → hệ thống phân tích và cập nhật roadmap".

**Sửa:** thêm `components/RoadmapRefreshTrigger.java`, gọi ở `importFromGithub` và một lần ở cuối
`importBatch` (không gọi mỗi repo — N lần cho cùng một kết quả). Nó generate rồi auto-accept, nuốt
mọi exception: personalization là *hệ quả* của import, không phải một phần của import — repo đã đọc
đúng thì không được fail vì engine gợi ý trục trặc, evidence vẫn nằm đó cho lần generate sau.

Auto-accept an toàn vì **không cổng nào bị bỏ qua**: `acceptRecommendation` vẫn chạy đủ
`importanceFloor`, `meetsNodeProficiency`, `completionPolicy`. Evidence yếu không bao giờ trở thành
recommendation ngay từ đầu.

### 7.6 AI mentor không gắn lời khuyên với thị trường

Mentor đã có `jobMarketTool` và đã biết `Level`, nhưng prompt không hề buộc nó dùng dữ liệu thị
trường khi xếp thứ tự học. Thêm một guideline vào `prompts/virtual-mentor-system.st`: câu hỏi dạng
"học gì tiếp theo / X có đáng học không" phải gọi `jobMarketTool` trước và **nêu con số** — "Docker
xuất hiện trong 34/120 tin backend tháng này" thay vì "nên học Docker". Không có dữ liệu thì nói
thẳng là dữ liệu mỏng, không được bịa nhu cầu.

### 7.7 🔴 Roadmap là đồ thị tĩnh — profile sinh viên chỉ đổi màu, không đổi cạnh

Đo trên 1.200 node thật:

| node_level | số node | có `parent_node` | có `previous_node` |
|---|---|---|---|
| 0 | 896 | 896 (100%) | 0 |
| ≥1 | 304 | 0 | 269 (89%) |

Level ≥1 là **một chuỗi thẳng** mà `previous` của level N luôn là level N−1 — suy ra được hoàn toàn
từ `node_level`, không phải DAG tiên quyết ai dựng tay. Mọi sinh viên nhận cùng một thứ tự. Đây
chính là chỗ đúng của lời chê "làm như một prompt AI thôi, không có luồng gì".

**Sửa:** `skill_nodes` giờ là **kho node**; **thứ tự** được tính lúc chạy theo profile.

- `components/RoadmapEdgeResolver.java` — chia node theo nhóm anh em rồi sắp xếp bằng:
  khoá chính `heldFirst` (phần sinh viên đã có dồn lên đầu, **không xoá** khỏi đồ thị vì xoá sẽ làm
  sai % tiến độ), khoá phụ `0.4×importance + 0.3×demand + 0.3×readiness`, khoá chốt
  `node_level, node_name`.
- **Tính chất hồi quy:** sinh viên không assessment, không skill, không dữ liệu thị trường → mọi
  điểm bằng nhau → rơi về khoá chốt → **ra đúng roadmap hôm nay**, từng node một. Có test.
- `components/NodeSkillMatcher.java` — 671/1.200 node không có `skill_id` (Data Science 446/461),
  khớp bằng `evidence_keywords` + `node_name`.
- Mỗi cạnh mang một câu `reason` (`RoadmapEdgeResponse.reason`), hiện khi hover. Đây là bằng chứng
  nhìn thấy được rằng thứ tự do dữ liệu quyết định.

**Bẫy đã xử lý:** `buildFrontendStatusMap` đọc trạng thái của node-trước, và trạng thái chưa biết
được tính là **locked**. Duyệt theo thứ tự DB với thứ tự động sẽ khoá sạch mọi thứ phía sau. Nay
duyệt theo `ResolvedOrder.visitOrder()`, còn Kahn giữ lại làm lưới an toàn. Có test riêng cho trường
hợp thứ tự profile **ngược hẳn** thứ tự DB.

Đường ghi cũng dùng chung resolver (`updateNodeProgress`), nếu không sinh viên sẽ bị từ chối đúng
node mà roadmap vừa hiện là đã mở.

---

## 8. Giới hạn của chính bản soát này

Nói rõ để không ai hiểu nhầm mức độ đảm bảo:

1. **Soát bằng đọc code + truy vấn DB, chưa chạy thử ứng dụng.** Các sửa đổi ở §7 compile sạch
   nhưng **chưa được bấm thử trên giao diện**. Cần smoke test: gửi một trả lời thật rồi kiểm tra
   bảng `feedback` có dòng mới với `sender`/`receiver` đảo chiều đúng không.

2. **Cách chắc chắn nhất để tìm nốt tính năng giả kiểu §1.1** là mở DevTools → tab Network, bấm
   từng nút trên mọi màn hình. Nút nào **không phát request** thì nút đó giả. Grep
   `mock|dummy|TODO` không bắt được, vì `replyFeedback` chỉ lộ ra khi đọc thân hàm.

3. **Chưa soát:** luồng Auth (đăng ký/đăng nhập/quên mật khẩu), FLM curriculum, RAG document
   ingestion, và roadmap editor của mentor.
