import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Tr, say, type Tx } from "../i18n";
import { CodeTr, Defs, Fig, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 07 · Servlet & JSP.
 *
 * This page sits before Spring on purpose. Everything Spring MVC does on the
 * web tier is a servlet and a filter chain wearing better clothes, and a reader
 * who meets `DispatcherServlet` without knowing what a servlet *is* has to take
 * the whole framework on faith.
 *
 * The running metaphor is a hotel front desk: one receptionist, many guests
 * arriving at once, a shared notepad on the counter that is exactly the
 * instance-field race. Section 7.7 spends the metaphor by mapping every part of
 * it onto the Spring Boot application the reader actually runs — a page about
 * servlets that never connects back would be trivia.
 */

const T = {
  lede: {
    vi: "Nền của mọi thứ chạy trên web tier của Java. Ví dụ xuyên suốt trang này là một quầy tiếp tân khách sạn — một người trực, nhiều khách tới cùng lúc, và một tờ giấy nhớ đặt sai chỗ.",
    en: "The floor everything on Java's web tier stands on. The example running through this page is a hotel front desk — one receptionist, many guests arriving at once, and one notepad in the wrong place.",
  },
  source: {
    vi: "Servlet and JSP Programming — IBM Redbook, chương 4 và 5",
    en: "Servlet and JSP Programming — IBM Redbook, chapters 4 and 5",
  },

  /* 7.1 */
  s1: { vi: "Một người trực, nhiều khách cùng lúc", en: "One receptionist, many guests at once" },
  fig1aria: {
    vi: "Một instance servlet phục vụ hai luồng cùng lúc, và trường instance bị hai luồng ghi đè lẫn nhau",
    en: "One servlet instance serves two threads at once, and its instance field is overwritten by both",
  },
  k1a: { vi: "luồng của khách A", en: "guest A's thread" },
  k1b: { vi: "luồng của khách B", en: "guest B's thread" },
  k1c: { vi: "dữ liệu bị ghi đè", en: "data overwritten" },
  k1d: { vi: "an toàn giữa các luồng", en: "safe across threads" },
  guestA: { vi: "Khách A", en: "Guest A" },
  guestB: { vi: "Khách B", en: "Guest B" },
  d1container: { vi: "SERVLET CONTAINER", en: "SERVLET CONTAINER" },
  d1loaded: { vi: "vừa được nạp", en: "just loaded" },
  d1inited: { vi: "init() xong", en: "init() done" },
  d1one: { vi: "1 instance duy nhất", en: "exactly 1 instance" },
  d1field: { vi: "trường instance", en: "instance field" },
  d1local: { vi: "biến cục bộ", en: "local variable" },
  d1stack: { vi: "String ten — trên stack", en: "String name — on the stack" },
  d1recv: { vi: "Khách A nhận", en: "Guest A receives" },
  d1own: { vi: "mỗi luồng một bản riêng — không ai đụng ai", en: "one copy per thread — nobody touches anybody" },
  d1n0: {
    vi: "nạp class · tạo instance — đúng một lần cho cả vòng đời ứng dụng",
    en: "load the class · create the instance — once for the whole application lifetime",
  },
  d1n1: {
    vi: "init() · sau bước này servlet sẵn sàng nhận request",
    en: "init() · after this the servlet is ready to take requests",
  },
  d1n2: {
    vi: "service() → doGet() chạy trên luồng riêng của khách A",
    en: "service() → doGet() runs on guest A's own thread",
  },
  d1n3: {
    vi: "hai luồng, một object — đây là chỗ mọi rắc rối bắt đầu",
    en: "two threads, one object — this is where the trouble starts",
  },
  d1n4: {
    vi: "không có khoá nào ở đây cả: hai luồng ghi vào cùng một trường",
    en: "there is no lock here at all: two threads write the same field",
  },
  d1n5: {
    vi: "sai dữ liệu giữa hai người dùng — loại lỗi tệ nhất trong một hệ thống có tài khoản",
    en: "data crossed between two users — the worst class of bug in a system with accounts",
  },
  d1n6: {
    vi: "sửa bằng cách bỏ trường đi, không phải bằng cách thêm synchronized",
    en: "the fix is to remove the field, not to add synchronized",
  },

  /* 7.2 */
  s2: { vi: "Request và Response cầm gì trong tay", en: "What request and response hold" },
  t2h1: { vi: "Trên request", en: "On the request" },
  t2h2: { vi: "Lấy được gì", en: "What you get" },
  t2r1: { vi: "dữ liệu từ query string hoặc form", en: "data from the query string or a form" },
  t2r2: { vi: "một header cụ thể", en: "one specific header" },
  t2r3: { vi: "phiên của người dùng này — tạo mới nếu chưa có", en: "this user's session — created if absent" },
  t2r4: { vi: "chỗ để đồ chỉ sống trong một request", en: "storage that lives for one request only" },
  t2r5: { vi: "GET, POST, PUT…", en: "GET, POST, PUT…" },
  t3h1: { vi: "Method", en: "Method" },
  t3h2: { vi: "Khác nhau ở đâu", en: "How it differs" },
  t3r1: {
    vi: "tham số nằm trên URL, cache được, đánh dấu trang được, có giới hạn độ dài",
    en: "parameters in the URL, cacheable, bookmarkable, length-limited",
  },
  t3r2: {
    vi: "tham số nằm trong body, không cache, dùng khi có thay đổi dữ liệu",
    en: "parameters in the body, not cached, used when data changes",
  },
  t3r3: {
    vi: "thay toàn bộ tài nguyên, gọi nhiều lần cùng kết quả",
    en: "replaces the whole resource; repeated calls give the same result",
  },
  t3r4: {
    vi: "xoá, cũng gọi nhiều lần cùng kết quả",
    en: "deletes; repeated calls also give the same result",
  },

  /* 7.3 */
  s3: {
    vi: "forward hay redirect — chuyển máy hay cho số khác",
    en: "forward or redirect — transfer the call or hand out another number",
  },
  fig3aria: {
    vi: "forward xử lý nội bộ trong một lượt đi về, redirect trả về 302 khiến trình duyệt gọi thêm lượt thứ hai",
    en: "forward is handled internally in one round trip; redirect returns a 302 and the browser makes a second call",
  },
  k3a: { vi: "forward · 1 lượt, URL giữ nguyên", en: "forward · 1 trip, URL unchanged" },
  k3b: { vi: "redirect · 2 lượt, URL đổi", en: "redirect · 2 trips, URL changes" },
  d3browser: { vi: "Trình duyệt", en: "Browser" },
  d3bar: { vi: "thanh địa chỉ", en: "address bar" },
  d3server: { vi: "MÁY CHỦ", en: "SERVER" },
  d3recv: { vi: "nhận request", en: "takes the request" },
  d3build: { vi: "dựng trang", en: "builds the page" },
  d3fwd: {
    vi: "forward — chuyển máy nội bộ, trình duyệt không biết",
    en: "forward — an internal transfer; the browser never knows",
  },
  d3req2: { vi: "2 — request hoàn toàn mới", en: "2 — an entirely new request" },
  d3one: {
    vi: "1 lượt đi về · URL giữ nguyên · dữ liệu request còn",
    en: "1 round trip · URL unchanged · request data survives",
  },
  d3two: {
    vi: "2 lượt đi về · URL đổi · dữ liệu request mất",
    en: "2 round trips · URL changes · request data is gone",
  },
  d3useFwd: {
    vi: "dùng forward khi chỉ đổi trang hiển thị của cùng một việc",
    en: "use forward when only the view of the same job changes",
  },
  d3useRed: {
    vi: "dùng redirect sau khi POST thành công, để F5 không gửi lại đơn",
    en: "use redirect after a successful POST, so F5 does not resubmit the order",
  },
  t4r1: { vi: "Ai thực hiện", en: "Who performs it" },
  t4r1a: { vi: "máy chủ, nội bộ", en: "the server, internally" },
  t4r1b: { vi: "trình duyệt, sau khi nhận 302", en: "the browser, after receiving a 302" },
  t4r2: { vi: "Số lượt đi về", en: "Round trips" },
  t4r3: { vi: "URL trên thanh địa chỉ", en: "URL in the address bar" },
  t4r3a: { vi: "không đổi", en: "unchanged" },
  t4r3b: { vi: "đổi", en: "changes" },
  t4r4: { vi: "Dữ liệu trong request", en: "Data in the request" },
  t4r4a: { vi: "còn nguyên", en: "kept intact" },
  t4r4b: { vi: "mất — phải gửi qua session hoặc query", en: "lost — must travel via session or query string" },
  t4r5: { vi: "Đi ra ngoài miền khác", en: "Can target another domain" },
  t4r5a: { vi: "không được", en: "no" },
  t4r5b: { vi: "được", en: "yes" },

  /* 7.4 */
  s4: { vi: "Ba phạm vi, và cái thẻ giữ xe", en: "Three scopes, and the parking ticket" },
  fig4aria: {
    vi: "Cookie giữ mã phiên như một cái vé giữ xe, dữ liệu thật nằm ở phía máy chủ",
    en: "The cookie holds a session id like a parking ticket; the real data stays on the server",
  },
  d4ticket: { vi: "= A7F3…  ← cái vé", en: "= A7F3…  ← the ticket" },
  d4send: { vi: "gửi kèm mọi request", en: "sent with every request" },
  d4srv: { vi: "Máy chủ", en: "Server" },
  d4car: { vi: "dữ liệu thật nằm ở đây — cái xe", en: "the real data lives here — the car" },
  d4lost: {
    vi: "mất vé thì lấy nhầm xe được — nên cookie phiên phải có HttpOnly, Secure và SameSite",
    en: "lose the ticket and someone drives off in your car — so a session cookie needs HttpOnly, Secure and SameSite",
  },
  d4rewrite: {
    vi: "trình duyệt tắt cookie thì còn cách URL rewriting: gắn ;jsessionid= vào cuối mọi đường dẫn",
    en: "with cookies disabled there is URL rewriting: append ;jsessionid= to every path",
  },
  t5h1: { vi: "Phạm vi", en: "Scope" },
  t5h2: { vi: "Sống bao lâu", en: "Lives for" },
  t5h3: { vi: "Đặt gì vào", en: "What goes in" },
  t5r1b: { vi: "một lượt đi về", en: "one round trip" },
  t5r1c: { vi: "kết quả tính cho đúng trang này", en: "values computed for this page only" },
  t5r2b: { vi: "cho tới khi hết hạn hoặc đăng xuất", en: "until it expires or the user logs out" },
  t5r2c: { vi: "người đang đăng nhập, giỏ hàng", en: "who is logged in, the shopping cart" },
  t5r3b: { vi: "cả vòng đời ứng dụng", en: "the whole application lifetime" },
  t5r3c: { vi: "cấu hình, bộ đếm dùng chung", en: "configuration, shared counters" },

  /* 7.5 */
  s5: { vi: "Filter — dãy cổng an ninh trước quầy", en: "Filters — the row of security gates before the desk" },
  fig5aria: {
    vi: "Request đi qua ba filter theo thứ tự rồi tới servlet, response quay ngược qua ba filter đó theo thứ tự ngược lại",
    en: "A request passes three filters in order and reaches the servlet; the response returns through the same three in reverse",
  },
  k5a: { vi: "đường vào", en: "the way in" },
  k5b: { vi: "đường ra", en: "the way out" },
  k5c: { vi: "cổng chặn lại", en: "a gate blocks it" },
  g1t: { vi: "soi vé", en: "check ticket" },
  g1s: { vi: "log", en: "log" },
  g2t: { vi: "soi hành lý", en: "screen bags" },
  g2s: { vi: "xác thực", en: "authentication" },
  g3t: { vi: "đếm lượt", en: "count trips" },
  g3s: { vi: "rate limit", en: "rate limit" },
  d5guest: { vi: "khách", en: "guest" },
  d5gate: { vi: "cổng", en: "gate" },
  d5never: { vi: "không bao giờ chạy", en: "never runs" },
  d5biz: { vi: "nghiệp vụ ở đây", en: "business logic here" },
  d5back: {
    vi: "phần code sau chain.doFilter() chạy ngược: cổng 3 → 2 → 1",
    en: "the code after chain.doFilter() runs in reverse: gate 3 → 2 → 1",
  },
  d5blocked: {
    vi: "401 trả thẳng từ cổng 2 — cổng 3 và servlet không được gọi",
    en: "a 401 straight from gate 2 — gate 3 and the servlet are never called",
  },
  d5raw: {
    vi: "filter thấy request thô: URL và header, nhưng chưa biết servlet nào sẽ xử lý",
    en: "a filter sees the raw request — URL and headers — but not which servlet will handle it",
  },
  d5known: {
    vi: "chỉ tới đây mới biết được người dùng là ai và họ muốn gì",
    en: "only here is it known who the user is and what they want",
  },
  d5out: {
    vi: "đây là chỗ đo thời gian, nén nội dung, thêm header — sau khi đã có response",
    en: "this is where timing, compression and extra headers happen — once a response exists",
  },
  d5gateline: {
    vi: "đúng một dòng chain.doFilter() quyết định request đi tiếp hay dừng",
    en: "one line, chain.doFilter(), decides whether the request continues or stops",
  },
  d5order: {
    vi: "thứ tự chạy = thứ tự đăng ký · đường ra luôn ngược lại đường vào",
    en: "execution order = registration order · the way out is always the reverse of the way in",
  },

  /* 7.6 */
  s6: { vi: "JSP thật ra chỉ là một servlet được viết hộ", en: "A JSP is only a servlet somebody wrote for you" },
  fig6aria: {
    vi: "File JSP được dịch thành mã nguồn servlet, biên dịch thành class, tạo instance rồi phục vụ request",
    en: "A JSP file is translated into servlet source, compiled to a class, instantiated, and then serves requests",
  },
  k6a: { vi: "chỉ chạy lần đầu", en: "first call only" },
  k6b: { vi: "chạy mỗi request", en: "every request" },
  st6a: { vi: "HTML + Java", en: "HTML + Java" },
  st6b: { vi: "mã servlet", en: "servlet source" },
  st6c: { vi: "đã biên dịch", en: "compiled" },
  d6once: {
    vi: "ba bước này chỉ chạy đúng một lần, cho request đầu tiên",
    en: "these three steps run exactly once, for the first request",
  },
  d6each: { vi: "mỗi request một lần", en: "once per request" },
  d6cached: { vi: "request thứ 2 trở đi đi thẳng vào đây", en: "from request 2 onward it comes straight here" },
  d6hand: {
    vi: "đây là file duy nhất bạn viết bằng tay — ba cái sau do container sinh ra",
    en: "this is the only file you write by hand — the container generates the other three",
  },
  t6h1: { vi: "Cú pháp", en: "Syntax" },
  t6h2: { vi: "Viết ra gì", en: "What it is" },
  t6h3: { vi: "Thành gì trong servlet", en: "What it becomes in the servlet" },
  t6r1b: { vi: "directive — khai báo cho cả trang", en: "a directive — a declaration for the whole page" },
  t6r1c: { vi: "ảnh hưởng lúc dịch, không sinh mã", en: "affects translation; generates no code" },
  t6r2b: { vi: "declaration", en: "a declaration" },
  t6r3b: { vi: "scriptlet", en: "a scriptlet" },
  t6r4b: { vi: "expression", en: "an expression" },
  t6r5b: { vi: "EL — cách viết hiện đại", en: "EL — the modern form" },
  t6r5c: { vi: "tra lần lượt qua bốn phạm vi", en: "searches the four scopes in order" },
  t7r1: { vi: "Ai nhận request", en: "Who receives the request" },
  t7r1a: { vi: "JSP nhận thẳng", en: "the JSP takes it directly" },
  t7r1b: { vi: "servlet nhận", en: "a servlet takes it" },
  t7r2: { vi: "Nghiệp vụ nằm ở", en: "Business logic lives" },
  t7r2a: { vi: "trong chính trang JSP", en: "inside the JSP page itself" },
  t7r2b: { vi: "trong servlet và tầng service", en: "in the servlet and the service layer" },
  t7r3: { vi: "JSP làm gì", en: "The JSP does" },
  t7r3a: { vi: "cả xử lý lẫn hiển thị", en: "both processing and display" },
  t7r3b: { vi: "chỉ hiển thị", en: "display only" },
  t7r4: { vi: "Dùng được khi", en: "Usable when" },
  t7r4a: { vi: "trang nhỏ, làm nhanh", en: "the page is small and quick" },
  t7r4b: { vi: "mọi thứ còn lại", en: "everything else" },

  /* 7.7 */
  s7: {
    vi: "Đã dùng Spring Boot rồi thì học cái này để làm gì",
    en: "Why learn this if you already use Spring Boot",
  },
  t8h1: { vi: "Ở trang này", en: "On this page" },
  t8h2: { vi: "Trong một ứng dụng Spring Boot", en: "In a Spring Boot application" },
  t8r1a: { vi: "servlet container", en: "servlet container" },
  t8r2a: { vi: "một servlet duy nhất nhận mọi request", en: "one servlet receives every request" },
  t8r3a: { vi: "ánh xạ URL → servlet", en: "URL → servlet mapping" },
  t8r4a: { vi: "chuỗi filter", en: "the filter chain" },
  t8r5a: { vi: "forward tới trang JSP", en: "forward to a JSP page" },
  t8r6a: { vi: "trường của servlet bị nhiều luồng ghi", en: "a servlet field written by many threads" },
  trapAsk: { vi: "Câu hay bị hỏi", en: "A question that gets asked" },
} satisfies Record<string, Tx>;

function lifeSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "container nạp class", note: "Servlet container — Tomcat — nạp class đúng một lần và tạo đúng MỘT instance. Không phải mỗi request một instance." },
        { label: "init() một lần", note: "init() được gọi đúng một lần, trước mọi request. Đây là chỗ đọc cấu hình, mở kết nối dùng chung." },
        { label: "khách A tới", note: "Container KHÔNG tạo servlet mới. Nó tạo một luồng mới và gọi service() trên cái instance sẵn có." },
        { label: "khách B tới cùng lúc", note: "Luồng thứ hai, vẫn cùng một instance đó. Hai luồng đang chạy trong cùng một object." },
        { label: "tờ giấy nhớ chung", note: "Biến instance là tờ giấy nhớ duy nhất đặt trên quầy. Luồng B ghi đè lên tên luồng A vừa viết." },
        { label: "khách A nhận nhầm", note: "Khách A nhận lời chào dành cho khách B. Lỗi này chỉ hiện ra khi có nhiều người cùng lúc — tức là trên production." },
        { label: "biến cục bộ thì an toàn", note: "Biến khai trong method nằm trên stack riêng của từng luồng. Đây là toàn bộ cách sửa: đừng để trạng thái của một request trong trường của servlet." },
      ]
    : [
        { label: "the container loads the class", note: "The servlet container — Tomcat — loads the class exactly once and creates exactly ONE instance. Not one instance per request." },
        { label: "init() runs once", note: "init() is called exactly once, before any request. This is where configuration is read and shared connections are opened." },
        { label: "guest A arrives", note: "The container does NOT create a new servlet. It creates a new thread and calls service() on the instance it already has." },
        { label: "guest B arrives at the same time", note: "A second thread, still that same instance. Two threads are now running inside one object." },
        { label: "the shared notepad", note: "The instance field is the single notepad on the counter. Thread B writes over the name thread A just put there." },
        { label: "guest A gets the wrong one", note: "Guest A receives the greeting meant for guest B. This only surfaces with several people at once — which is to say, in production." },
        { label: "a local variable is safe", note: "A variable declared inside the method lives on each thread's own stack. That is the whole fix: never keep one request's state in a servlet field." },
      ];
}

function dispatchSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "khách gọi tổng đài", note: "Trình duyệt gửi GET /dat-phong. Đây là lượt đi về thứ nhất." },
        { label: "forward: chuyển máy", note: "Server tự chuyển cuộc gọi sang bộ phận khác trong nội bộ. Trình duyệt hoàn toàn không biết chuyện này." },
        { label: "trả về sau 1 lượt", note: "Khách nhận kết quả. Thanh địa chỉ vẫn là /dat-phong, và mọi dữ liệu đặt trong request vẫn còn nguyên." },
        { label: "redirect: cho số khác", note: 'Cách còn lại: server trả về 302 kèm địa chỉ mới, chứ không trả nội dung. Đây là câu "anh gọi số này giúp em".' },
        { label: "khách gọi lại", note: "Trình duyệt tự gọi lần thứ hai tới địa chỉ mới. Đây là một request HOÀN TOÀN MỚI." },
        { label: "hết 2 lượt", note: "Thanh địa chỉ đổi thành /xac-nhan. Mọi thứ đặt trong request cũ đã mất — muốn giữ thì phải qua session." },
      ]
    : [
        { label: "the guest calls the switchboard", note: "The browser sends GET /book-room. This is the first round trip." },
        { label: "forward: transfer the call", note: "The server passes the call to another department internally. The browser knows nothing about it." },
        { label: "answered in 1 trip", note: "The guest gets the result. The address bar still reads /book-room, and everything put in the request is intact." },
        { label: "redirect: here is another number", note: 'The alternative: the server returns a 302 with a new address instead of any content. This is the "please call this number instead" answer.' },
        { label: "the guest calls again", note: "The browser makes a second call, to the new address, on its own. This is an ENTIRELY NEW request." },
        { label: "2 trips used", note: "The address bar becomes /confirm. Everything in the old request is gone — to keep it you need the session." },
      ];
}

function filterSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "cổng 1 · soi vé", note: "Filter đầu tiên thấy request thô. Nó ghi log rồi gọi chain.doFilter() để đẩy tiếp." },
        { label: "cổng 2 · soi hành lý", note: "Filter thứ hai kiểm tra danh tính. Nó vẫn chưa biết quầy nào sẽ phục vụ khách này." },
        { label: "cổng 3 · đếm lượt", note: "Filter thứ ba đếm số lần gọi. Ba cổng chạy đúng theo thứ tự đăng ký." },
        { label: "tới quầy", note: "Servlet chạy và dựng response. Đây mới là chỗ nghiệp vụ nằm." },
        { label: "đi ngược ra", note: "Response quay ngược qua đúng ba cổng theo thứ tự ngược lại — phần code SAU lời gọi chain.doFilter() chạy ở đây." },
        { label: "cổng 2 chặn", note: "Nếu một cổng không gọi chain.doFilter() mà tự trả 401, mọi thứ phía sau nó không chạy — kể cả servlet." },
      ]
    : [
        { label: "gate 1 · check the ticket", note: "The first filter sees the raw request. It logs, then calls chain.doFilter() to pass it along." },
        { label: "gate 2 · screen the bags", note: "The second filter checks identity. It still does not know which desk will serve this guest." },
        { label: "gate 3 · count the trips", note: "The third filter counts calls. All three run in exactly their registration order." },
        { label: "reach the desk", note: "The servlet runs and builds the response. This is where the business logic actually lives." },
        { label: "back out again", note: "The response travels back through those same three gates in reverse — the code AFTER the chain.doFilter() call runs here." },
        { label: "gate 2 blocks", note: "If a gate returns a 401 itself instead of calling chain.doFilter(), nothing behind it runs — the servlet included." },
      ];
}

function jspSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "file .jsp", note: "Người viết thấy một file HTML có chèn vài đoạn Java. Đây là thứ duy nhất bạn tạo ra bằng tay." },
        { label: "lần đầu có người gọi", note: "Container dịch file .jsp thành mã nguồn một servlet .java. Bước này chỉ xảy ra lần đầu." },
        { label: "biên dịch thành .class", note: "Mã nguồn vừa sinh được biên dịch bình thường. Tới đây nó là một class Java như mọi class khác." },
        { label: "tạo instance", note: "Container tạo một instance và gọi _jspInit(). Giống hệt init() của servlet ở mục 7.1." },
        { label: "_jspService() chạy", note: "Mỗi request gọi _jspService(). HTML tĩnh trở thành out.write(), biểu thức trở thành out.print()." },
        { label: "lần sau dùng lại", note: "Từ request thứ hai trở đi, container dùng thẳng class đã biên dịch. Đây là lý do lần tải đầu tiên luôn chậm hơn hẳn." },
      ]
    : [
        { label: "the .jsp file", note: "The author sees an HTML file with a few pieces of Java in it. This is the only thing you create by hand." },
        { label: "the first time anyone calls", note: "The container translates the .jsp into the source of a .java servlet. This step happens once." },
        { label: "compile to .class", note: "The generated source is compiled normally. From here it is a Java class like any other." },
        { label: "create the instance", note: "The container creates one instance and calls _jspInit(). Exactly the servlet init() from 7.1." },
        { label: "_jspService() runs", note: "Every request calls _jspService(). Static HTML becomes out.write(), expressions become out.print()." },
        { label: "reused afterwards", note: "From the second request on, the container uses the compiled class directly. This is why the very first page load is always much slower." },
      ];
}

export default function Servlet({ lang }: { lang: Lang }) {
  const s = say(lang);
  const vi = lang === "vi";
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="07" name="Servlet & JSP" lede={s(T.lede)} source={s(T.source)} />

      <Sec n="7.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                Servlet là một class Java chạy bên trong <strong>servlet container</strong> — Tomcat, Jetty.
                Container lo phần nhận kết nối, phân luồng, và gọi đúng method; servlet chỉ lo phần trả lời.
              </>
            }
            en={
              <>
                A servlet is a Java class running inside a <strong>servlet container</strong> — Tomcat, Jetty.
                The container takes the connection, assigns a thread and calls the right method; the servlet
                only produces the answer.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Một câu duy nhất cần thuộc: <strong>một servlet, một instance, nhiều luồng</strong>. Container
                không tạo servlet mới cho từng request — nó tạo <em>luồng</em> mới và gọi vào cùng cái instance
                đã có.
              </>
            }
            en={
              <>
                One sentence to memorise: <strong>one servlet, one instance, many threads</strong>. The
                container does not create a new servlet per request — it creates a new <em>thread</em> and calls
                into the instance it already has.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`public class GreetServlet extends HttpServlet {

    private String tenKhach;              // tờ giấy nhớ dùng chung — SAI

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws IOException {
        tenKhach = req.getParameter("ten");        // luồng B ghi đè luồng A
        res.getWriter().write("Xin chào " + tenKhach);
    }
}`}
          en={`public class GreetServlet extends HttpServlet {

    private String guestName;             // the shared notepad — WRONG

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws IOException {
        guestName = req.getParameter("name");      // thread B overwrites thread A
        res.getWriter().write("Hello " + guestName);
    }
}`}
        />

        <Walkthrough
          viewBox="0 0 720 288"
          aria={s(T.fig1aria)}
          hold={2200}
          steps={lifeSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 7.1" : "Figure 7.1"}</span>
              <Tr
                vi={
                  <>
                    Đây là câu hỏi phỏng vấn kinh điển về servlet, và cũng đúng nguyên văn cho{" "}
                    <code>@Service</code> singleton của Spring.
                  </>
                }
                en={
                  <>
                    This is the classic servlet interview question, and it holds word for word for a Spring
                    singleton <code>@Service</code>.
                  </>
                }
              />
              <Key
                items={[
                  { c: "info", t: s(T.k1a) },
                  { c: "warn", t: s(T.k1b) },
                  { c: "bad", t: s(T.k1c) },
                  { c: "ok", t: s(T.k1d) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const aIn = i >= 2;
            const bIn = i >= 3;
            const clash = i >= 4 && i <= 5;
            const localFix = i === 6;
            return (
              <>
                {/* clients */}
                <g data-c={aIn ? "info" : undefined}>
                  <Ic n="user" x={16} y={48} s={20} c={aIn ? "info" : "mute"} />
                  <text x="44" y="64" className={aIn ? "d-m" : "d-s"}>{s(T.guestA)}</text>
                </g>
                <g data-c={bIn ? "warn" : undefined}>
                  <Ic n="user" x={16} y={144} s={20} c={bIn ? "warn" : "mute"} />
                  <text x="44" y="160" className={bIn ? "d-m" : "d-s"}>{s(T.guestB)}</text>
                </g>

                {/* container */}
                <text x="200" y="24" className="d-s">{s(T.d1container)}</text>
                <rect x="200" y="32" width="496" height="208" className="d-box-q" />

                <rect x="232" y="48" width="200" height="176" className="d-box" />
                <Ic n="server" x={248} y={62} s={18} />
                <text x="278" y="76" className="d-b">GreetServlet</text>
                <text x="248" y="96" className="d-s">
                  {i === 0 ? s(T.d1loaded) : i === 1 ? s(T.d1inited) : s(T.d1one)}
                </text>

                {/* the shared notepad */}
                <g data-c={clash ? "bad" : undefined}>
                  <rect x="248" y="112" width="168" height="48" className={clash ? "d-box-a" : "d-box-fill"} />
                  <text x="260" y="132" className="d-s">{s(T.d1field)}</text>
                  <text x="260" y="150" className={clash ? "d-m" : "d-m"}>
                    tenKhach = {i < 2 ? "null" : clash ? '"B"' : '"A"'}
                  </text>
                </g>

                {/* the local variable */}
                <g data-c={localFix ? "ok" : undefined}>
                  <rect x="248" y="172" width="168" height="40" className={localFix ? "d-box-fill" : "d-box-q"} />
                  <text x="260" y="197" className={localFix ? "d-m" : "d-s"}>
                    {localFix ? s(T.d1stack) : s(T.d1local)}
                  </text>
                </g>

                {/* threads in */}
                {aIn && (
                  <line x1="80" y1="64" x2="224" y2="88" className="d-l" markerEnd="url(#pa-info)" data-enter="" data-c="info" />
                )}
                {bIn && (
                  <line x1="80" y1="160" x2="224" y2="128" className="d-l" markerEnd="url(#pa-warn)" data-enter="" data-c="warn" />
                )}

                {/* responses */}
                {i >= 5 && (
                  <g data-enter="" data-c={i === 5 ? "bad" : "ok"}>
                    <rect x="464" y="88" width="216" height="64" className="d-box-fill" />
                    <Ic n={i === 5 ? "x" : "check"} x={480} y={104} s={18} c={i === 5 ? "bad" : "ok"} />
                    <text x="510" y="118" className="d-b">{s(T.d1recv)}</text>
                    <text x="480" y="140" className="d-m">
                      {i === 5 ? (vi ? '"Xin chào B"' : '"Hello B"') : vi ? '"Xin chào A"' : '"Hello A"'}
                    </text>
                    <line x1="432" y1="120" x2="456" y2="120" className="d-l" markerEnd={i === 5 ? "url(#pa-a)" : "url(#pa-ok)"} />
                  </g>
                )}

                <text x="16" y="264" className="d-s">
                  {i === 0
                    ? s(T.d1n0)
                    : i === 1
                      ? s(T.d1n1)
                      : i === 2
                        ? s(T.d1n2)
                        : i === 3
                          ? s(T.d1n3)
                          : i === 4
                            ? s(T.d1n4)
                            : i === 5
                              ? s(T.d1n5)
                              : s(T.d1n6)}
                </text>
                {localFix && (
                  <g data-enter="" data-c="ok">
                    <Ic n="check" x={464} y={192} s={16} c="ok" />
                    <text x="488" y="205" className="d-m">{s(T.d1own)}</text>
                  </g>
                )}
              </>
            );
          }}
        </Walkthrough>

        <P>
          <Tr
            vi={
              <>
                Vòng đời đầy đủ có ba mốc: <code>init()</code> gọi <strong>một lần</strong> trước mọi request,{" "}
                <code>service()</code> gọi <strong>mỗi request một lần</strong> và tự phân sang{" "}
                <code>doGet</code>/<code>doPost</code>, <code>destroy()</code> gọi <strong>một lần</strong> khi
                ứng dụng dừng.
              </>
            }
            en={
              <>
                The full lifecycle has three marks: <code>init()</code> is called <strong>once</strong> before
                any request, <code>service()</code> is called <strong>once per request</strong> and dispatches
                to <code>doGet</code>/<code>doPost</code>, and <code>destroy()</code> is called{" "}
                <strong>once</strong> when the application shuts down.
              </>
            }
          />
        </P>
        <Trap>
          <Tr
            vi={
              <p>
                Sửa bằng <code>synchronized</code> trên <code>doGet</code> là sửa sai: nó biến máy chủ thành hàng
                một người — mọi request xếp hàng chờ nhau. Cách đúng là <strong>bỏ trường đi</strong>, để trạng
                thái của một request nằm trong biến cục bộ hoặc trong <code>request</code>.
              </p>
            }
            en={
              <p>
                Putting <code>synchronized</code> on <code>doGet</code> is the wrong fix: it turns the server
                into a single queue where every request waits its turn. The right fix is to{" "}
                <strong>remove the field</strong>, keeping one request's state in a local variable or on the{" "}
                <code>request</code>.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="7.2" t={s(T.s2)}>
        <Table
          head={[s(T.t2h1), s(T.t2h2)]}
          rows={[
            [<code key="a">{vi ? 'getParameter("ten")' : 'getParameter("name")'}</code>, s(T.t2r1)],
            [<code key="b">getHeader("Authorization")</code>, s(T.t2r2)],
            [<code key="c">getSession()</code>, s(T.t2r3)],
            [<code key="d">getAttribute / setAttribute</code>, s(T.t2r4)],
            [<code key="e">getMethod()</code>, s(T.t2r5)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Trên <code>response</code> có một luật về thứ tự mà bỏ qua là hỏng:{" "}
                <strong>đặt status và header trước, ghi nội dung sau</strong>. Vừa ghi một byte vào body là
                header đã gửi đi rồi, đổi nữa sẽ ném <code>IllegalStateException</code>.
              </>
            }
            en={
              <>
                The <code>response</code> has an ordering rule that breaks things when ignored:{" "}
                <strong>set the status and the headers first, write the body second</strong>. One byte into the
                body and the headers are already on the wire; changing them then throws{" "}
                <code>IllegalStateException</code>.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t3h1), s(T.t3h2)]}
          rows={[
            ["GET", s(T.t3r1)],
            ["POST", s(T.t3r2)],
            ["PUT", s(T.t3r3)],
            ["DELETE", s(T.t3r4)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Cụm "gọi nhiều lần cùng kết quả" là <strong>idempotent</strong>, và đó là lý do trình duyệt hỏi
                lại khi bạn F5 một trang vừa POST — nó biết lặp lại POST có thể tạo hai đơn hàng.
              </>
            }
            en={
              <>
                "Repeated calls give the same result" is what <strong>idempotent</strong> means, and it is why
                the browser asks again when you refresh a page you just POSTed — it knows repeating that POST
                could create two orders.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="7.3" t={s(T.s3)}>
        <Walkthrough
          viewBox="0 0 720 272"
          aria={s(T.fig3aria)}
          hold={2200}
          steps={dispatchSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 7.3" : "Figure 7.3"}</span>
              <Tr
                vi="Chọn sai không làm hỏng ngay — nó chỉ làm người dùng F5 xong đặt trùng đơn hàng."
                en="Choosing wrong breaks nothing immediately — it just lets a user refresh and place the same order twice."
              />
              <Key
                items={[
                  { c: "ok", t: s(T.k3a) },
                  { c: "warn", t: s(T.k3b) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const red = i >= 3;
            const role = red ? "warn" : "ok";
            return (
              <>
                {/* browser */}
                <g data-c={role}>
                  <rect x="16" y="48" width="176" height="88" className="d-box" />
                  <Ic n="globe" x={32} y={62} s={18} c={role} />
                  <text x="62" y="76" className="d-b">{s(T.d3browser)}</text>
                  <text x="32" y="102" className="d-s">{s(T.d3bar)}</text>
                  <text x="32" y="122" className="d-m">
                    {i >= 5 ? (vi ? "/xac-nhan" : "/confirm") : vi ? "/dat-phong" : "/book-room"}
                  </text>
                </g>

                {/* server */}
                <text x="280" y="24" className="d-s">{s(T.d3server)}</text>
                <rect x="280" y="32" width="416" height="176" className="d-box-q" />

                <g data-c={i >= 1 ? role : undefined}>
                  <rect x="312" y="56" width="160" height="64" className={i >= 1 ? "d-box-fill" : "d-box"} />
                  <Ic n="server" x={328} y={70} s={18} c={i >= 1 ? role : undefined} />
                  <text x="358" y="84" className="d-b">{vi ? "DatPhong" : "BookRoom"}</text>
                  <text x="328" y="108" className="d-s">{s(T.d3recv)}</text>
                </g>

                <g data-c={i >= 2 ? role : undefined}>
                  <rect x="520" y="56" width="152" height="64" className={i >= 2 ? "d-box-fill" : "d-box"} />
                  <Ic n="file" x={536} y={70} s={18} c={i >= 2 ? role : undefined} />
                  <text x="566" y="84" className="d-b">{vi ? "XacNhan" : "Confirm"}</text>
                  <text x="536" y="108" className="d-s">{s(T.d3build)}</text>
                </g>

                {/* request 1 */}
                <line x1="192" y1="72" x2="304" y2="72" className="d-l" markerEnd={`url(#pa-${red ? "warn" : "ok"})`} data-c={role} />
                <text x="196" y="64" className="d-s">1</text>

                {/* the internal hop, or the 302 */}
                {i >= 1 && i <= 2 && (
                  <g data-enter="" data-c="ok">
                    <line x1="472" y1="88" x2="512" y2="88" className="d-l" markerEnd="url(#pa-ok)" />
                    <text x="312" y="156" className="d-m">{s(T.d3fwd)}</text>
                  </g>
                )}
                {i >= 3 && (
                  <g data-enter="" data-c="warn">
                    <path d="M312 136 C 240 152 216 152 196 136" className="d-l" markerEnd="url(#pa-warn)" />
                    <text x="312" y="156" className="d-m">{vi ? "302 Found · Location: /xac-nhan" : "302 Found · Location: /confirm"}</text>
                  </g>
                )}

                {/* request 2 */}
                {i >= 4 && (
                  <g data-enter="" data-c="warn">
                    <line x1="192" y1="180" x2="512" y2="180" className="d-l" markerEnd="url(#pa-warn)" />
                    <text x="196" y="172" className="d-s">{s(T.d3req2)}</text>
                  </g>
                )}

                {/* verdict */}
                <g data-c={role}>
                  <Ic n={red ? "refresh" : "zap"} x={16} y={224} s={18} c={role} />
                  <text x="46" y="238" className="d-m">
                    {i <= 2 ? s(T.d3one) : s(T.d3two)}
                  </text>
                </g>
                <text x="16" y="262" className="d-s">
                  {i <= 2 ? s(T.d3useFwd) : s(T.d3useRed)}
                </text>
              </>
            );
          }}
        </Walkthrough>

        <Table
          head={["", "forward", "redirect"]}
          rows={[
            [s(T.t4r1), s(T.t4r1a), s(T.t4r1b)],
            [s(T.t4r2), "1", "2"],
            [s(T.t4r3), s(T.t4r3a), s(T.t4r3b)],
            [s(T.t4r4), s(T.t4r4a), s(T.t4r4b)],
            [s(T.t4r5), s(T.t4r5a), s(T.t4r5b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Quy tắc thực dụng gọi là <strong>POST/Redirect/GET</strong>: xử lý xong một POST thì luôn
                redirect sang một GET. Người dùng F5 sẽ chỉ tải lại trang kết quả thay vì gửi lại đơn hàng.
              </>
            }
            en={
              <>
                The practical rule is called <strong>POST/Redirect/GET</strong>: once a POST is handled, always
                redirect to a GET. A refresh then reloads the result page instead of resubmitting the order.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="7.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                HTTP không nhớ gì cả. Hai request từ cùng một người là hai chuyện hoàn toàn rời nhau, và{" "}
                <strong>session là cách vá lại chuyện đó</strong> — đúng theo cách một bãi giữ xe làm.
              </>
            }
            en={
              <>
                HTTP remembers nothing. Two requests from the same person are two entirely unrelated events, and{" "}
                <strong>the session is the patch over that</strong> — done exactly the way a car park does it.
              </>
            }
          />
        </P>

        <Fig
          viewBox="0 0 720 232"
          aria={s(T.fig4aria)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 7.4" : "Figure 7.4"}</span>
              <Tr
                vi={
                  <>
                    Trình duyệt giữ <strong>cái vé</strong>, máy chủ giữ <strong>cái xe</strong>. Nếu dữ liệu
                    thật nằm trên vé thì ai cũng sửa được vé của mình.
                  </>
                }
                en={
                  <>
                    The browser holds <strong>the ticket</strong>, the server holds <strong>the car</strong>. If
                    the real data were on the ticket, everyone could edit their own.
                  </>
                }
              />
            </>
          }
        >
          <g data-c="info">
            <rect x="16" y="48" width="216" height="120" className="d-box" />
            <Ic n="globe" x={32} y={62} s={18} c="info" />
            <text x="62" y="76" className="d-b">{s(T.d3browser)}</text>
            <rect x="32" y="96" width="184" height="56" className="d-box-fill" />
            <Ic n="cookie" x={44} y={110} s={16} c="info" />
            <text x="70" y="122" className="d-m">JSESSIONID</text>
            <text x="44" y="142" className="d-s">{s(T.d4ticket)}</text>
          </g>

          <line x1="232" y1="108" x2="304" y2="108" className="d-l" markerEnd="url(#pa-info)" data-c="info" />
          <text x="238" y="100" className="d-s">{s(T.d4send)}</text>

          <g data-c="ok">
            <rect x="312" y="48" width="384" height="120" className="d-box" />
            <Ic n="server" x={328} y={62} s={18} c="ok" />
            <text x="358" y="76" className="d-b">{s(T.d4srv)}</text>
            <rect x="328" y="96" width="352" height="56" className="d-box-fill" />
            <text x="340" y="118" className="d-m">{vi ? "A7F3… → user=an, gioHang=[2 món]" : "A7F3… → user=an, cart=[2 items]"}</text>
            <text x="340" y="140" className="d-s">{s(T.d4car)}</text>
          </g>

          <text x="16" y="200" className="d-s">
            {s(T.d4lost)}
          </text>
          <text x="16" y="220" className="d-s">
            {s(T.d4rewrite)}
          </text>
        </Fig>

        <Table
          head={[s(T.t5h1), s(T.t5h2), s(T.t5h3)]}
          rows={[
            ["request", s(T.t5r1b), s(T.t5r1c)],
            ["session", s(T.t5r2b), s(T.t5r2c)],
            ["application", s(T.t5r3b), s(T.t5r3c)],
          ]}
        />
        <Trap>
          <Tr
            vi={
              <p>
                <code>application</code> dùng chung cho <strong>mọi</strong> người dùng và bị nhiều luồng ghi
                cùng lúc — nó là tờ giấy nhớ ở mục 7.1 phóng to lên cỡ toàn ứng dụng. Đặt dữ liệu của một người
                vào đó là lộ dữ liệu sang người khác.
              </p>
            }
            en={
              <p>
                <code>application</code> is shared by <strong>every</strong> user and written by many threads at
                once — it is the notepad from 7.1 blown up to the size of the whole application. Putting one
                person's data there leaks it to everybody else.
              </p>
            }
          />
        </Trap>
        <Limit>
          <Tr
            vi={
              <>
                Session nằm trong bộ nhớ của một máy chủ. Chạy hai máy chủ sau một bộ cân bằng tải thì lượt sau
                rơi sang máy khác là mất phiên — phải dùng sticky session, hoặc đẩy session ra Redis, hoặc bỏ
                session sang token. Đây chính là lựa chọn được nói ở trang 11.
              </>
            }
            en={
              <>
                A session lives in one server's memory. Run two servers behind a load balancer and the next trip
                landing on the other machine loses the session — you need sticky sessions, or a session store in
                Redis, or a move from sessions to tokens. That is exactly the choice discussed on page 11.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="7.5" t={s(T.s5)}>
        <P>
          <Tr
            vi={
              <>
                Filter là thứ đứng <strong>trước</strong> servlet và bọc lấy nó. Mỗi filter được gọi hai lần cho
                một request: một lần trên đường vào, một lần trên đường ra.
              </>
            }
            en={
              <>
                A filter sits <strong>in front of</strong> the servlet and wraps it. Each filter is entered
                twice per request: once on the way in and once on the way out.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`public class LogFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        long batDau = System.currentTimeMillis();     // đường VÀO

        chain.doFilter(req, res);                     // đẩy tiếp — cổng mở

        long het = System.currentTimeMillis();        // đường RA
        log.info("mất {} ms", het - batDau);
    }
}`}
          en={`public class LogFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        long start = System.currentTimeMillis();      // the way IN

        chain.doFilter(req, res);                     // pass it on — the gate opens

        long end = System.currentTimeMillis();        // the way OUT
        log.info("took {} ms", end - start);
    }
}`}
        />

        <Walkthrough
          viewBox="0 0 720 264"
          aria={s(T.fig5aria)}
          hold={2000}
          steps={filterSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 7.5" : "Figure 7.5"}</span>
              <Tr
                vi={
                  <>
                    Dòng <code>chain.doFilter()</code> là cái cổng. Không gọi nó thì mọi thứ phía sau đứng im.
                  </>
                }
                en={
                  <>
                    The <code>chain.doFilter()</code> line is the gate. Fail to call it and everything behind it
                    stands still.
                  </>
                }
              />
              <Key
                items={[
                  { c: "info", t: s(T.k5a) },
                  { c: "ok", t: s(T.k5b) },
                  { c: "bad", t: s(T.k5c) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const gates = [
              { t: s(T.g1t), s: s(T.g1s) },
              { t: s(T.g2t), s: s(T.g2s) },
              { t: s(T.g3t), s: s(T.g3s) },
            ];
            const blocked = i === 5;
            const out = i === 4;
            return (
              <>
                <Ic n="user" x={16} y={80} s={20} c={blocked ? "bad" : "info"} />
                <text x="16" y="124" className="d-s">{s(T.d5guest)}</text>

                {gates.map((g, n) => {
                  const inbound = !blocked && !out && i >= n && i < 3;
                  const outbound = out || (blocked && n === 0);
                  const stop = blocked && n === 1;
                  const role = stop ? "bad" : outbound ? "ok" : inbound ? "info" : undefined;
                  return (
                    <g key={g.t} data-c={role}>
                      <rect
                        x={72 + n * 152}
                        y={56}
                        width={120}
                        height={80}
                        className={role ? "d-box-fill" : "d-box"}
                      />
                      <Ic n={stop ? "x" : "filter"} x={88 + n * 152} y={70} s={16} c={role} />
                      <text x={112 + n * 152} y={82} className="d-b" fontSize="11">
                        {s(T.d5gate)} {n + 1}
                      </text>
                      <text x={88 + n * 152} y={106} className="d-m">{g.t}</text>
                      <text x={88 + n * 152} y={126} className="d-s">{g.s}</text>
                    </g>
                  );
                })}

                {/* The servlet stays lit once it has run — on the way out it is
                    part of the path, not a component waiting its turn. */}
                <g data-c={!blocked && i >= 3 ? "ok" : blocked ? "mute" : undefined}>
                  <rect x={528} y={56} width={168} height={80} className={!blocked && i >= 3 ? "d-box-fill" : blocked ? "d-box-out" : "d-box"} />
                  <Ic n="server" x={544} y={70} s={18} c={!blocked && i >= 3 ? "ok" : blocked ? "mute" : undefined} />
                  <text x={574} y={84} className={blocked ? "d-s" : "d-b"}>Servlet</text>
                  <text x={544} y={110} className="d-s">{blocked ? s(T.d5never) : s(T.d5biz)}</text>
                </g>

                {/* inbound arrows */}
                {[0, 1, 2, 3].map((n) => {
                  const x1 = n === 0 ? 44 : 192 + (n - 1) * 152;
                  const x2 = n === 0 ? 64 : 216 + (n - 1) * 152;
                  const lit = !blocked && i >= n;
                  const dead = blocked && n >= 2;
                  return (
                    <line
                      key={`in${n}`}
                      x1={x1}
                      y1={80}
                      x2={x2}
                      y2={80}
                      className={dead ? "d-l-q" : "d-l"}
                      markerEnd={dead ? "url(#pa)" : lit ? "url(#pa-info)" : "url(#pa)"}
                      data-c={dead ? undefined : lit ? "info" : undefined}
                    />
                  );
                })}

                {/* the return path */}
                {out && (
                  <g data-enter="" data-c="ok">
                    <path d="M528 168 L 72 168" className="d-l" markerEnd="url(#pa-ok)" />
                    <text x="80" y="190" className="d-m">{s(T.d5back)}</text>
                  </g>
                )}

                {blocked && (
                  <g data-enter="" data-c="bad">
                    <path d="M224 168 L 72 168" className="d-l" markerEnd="url(#pa-a)" />
                    <text x="80" y="190" className="d-m">{s(T.d5blocked)}</text>
                  </g>
                )}

                <text x="16" y="228" className="d-s">
                  {i < 3 ? s(T.d5raw) : i === 3 ? s(T.d5known) : out ? s(T.d5out) : s(T.d5gateline)}
                </text>
                <text x="16" y="252" className="d-s">
                  {s(T.d5order)}
                </text>
              </>
            );
          }}
        </Walkthrough>

        <Trap>
          <Tr
            vi={
              <p>
                Quên gọi <code>chain.doFilter()</code> là lỗi im lặng đúng nghĩa: không exception, không log,
                request treo cho tới khi hết thời gian chờ. Còn gọi nó <em>hai lần</em> thì servlet chạy hai lần.
              </p>
            }
            en={
              <p>
                Forgetting <code>chain.doFilter()</code> is a silent failure in the strict sense: no exception,
                no log, the request just hangs until it times out. Call it <em>twice</em> and the servlet runs
                twice.
              </p>
            }
          />
        </Trap>
        <P>
          <Tr
            vi={
              <>
                <strong>Listener</strong> là họ hàng của filter nhưng không nằm trên đường đi của request — nó
                đăng ký nghe sự kiện: ứng dụng khởi động, một session được tạo, một session hết hạn. Đếm số
                người đang online là việc của listener, không phải của filter.
              </>
            }
            en={
              <>
                A <strong>listener</strong> is a filter's relative but does not sit on the request path — it
                subscribes to events: the application starting, a session being created, a session expiring.
                Counting who is online is a listener's job, not a filter's.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="7.6" t={s(T.s6)}>
        <P>
          <Tr
            vi={
              <>
                Servlet dựng HTML bằng <code>out.write()</code> thì viết giao diện rất khổ. JSP lật ngược lại:
                viết HTML bình thường và chèn Java vào chỗ cần. Nhưng thứ cuối cùng chạy trên máy chủ{" "}
                <strong>vẫn là một servlet</strong> — chỉ là bạn không phải gõ nó ra.
              </>
            }
            en={
              <>
                Building HTML from a servlet with <code>out.write()</code> makes writing a view miserable. JSP
                inverts it: write ordinary HTML and drop Java in where needed. But what finally runs on the
                server <strong>is still a servlet</strong> — you simply did not have to type it.
              </>
            }
          />
        </P>

        <Walkthrough
          viewBox="0 0 720 248"
          aria={s(T.fig6aria)}
          hold={2000}
          steps={jspSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 7.6" : "Figure 7.6"}</span>
              <Tr
                vi={
                  <>
                    Ba bước giữa <strong>chỉ chạy một lần</strong>. Biết điều này là biết vì sao lần mở trang
                    đầu tiên sau khi deploy luôn chậm.
                  </>
                }
                en={
                  <>
                    The three middle steps <strong>run only once</strong>. Knowing this is knowing why the first
                    page load after a deploy is always slow.
                  </>
                }
              />
              <Key
                items={[
                  { c: "warn", t: s(T.k6a) },
                  { c: "ok", t: s(T.k6b) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const page = vi ? "trang" : "page";
            const stages = [
              { t: `${page}.jsp`, s: s(T.st6a), ic: "file" as const },
              { t: `${page}_jsp.java`, s: s(T.st6b), ic: "code" as const },
              { t: `${page}_jsp.class`, s: s(T.st6c), ic: "box" as const },
              { t: "instance", s: "_jspInit()", ic: "server" as const },
            ];
            const cached = i >= 5;
            return (
              <>
                {stages.map((s, n) => {
                  const active = i === n;
                  const done = i > n;
                  const once = n >= 1 && n <= 3;
                  const role = active ? (once ? "warn" : "info") : done ? (cached && once ? "mute" : "ok") : undefined;
                  return (
                    <g key={s.t} data-c={role}>
                      <rect
                        x={16 + n * 176}
                        y={48}
                        width={152}
                        height={88}
                        className={cached && once ? "d-box-out" : active || done ? "d-box-fill" : "d-box"}
                      />
                      <Ic n={s.ic} x={32 + n * 176} y={62} s={18} c={role} />
                      <text x={32 + n * 176} y={100} className={cached && once ? "d-s" : "d-m"} fontSize="11">
                        {s.t}
                      </text>
                      <text x={32 + n * 176} y={122} className="d-s">{s.s}</text>
                      {n < 3 && (
                        <line
                          x1={168 + n * 176}
                          y1={92}
                          x2={184 + n * 176}
                          y2={92}
                          className={i > n ? "d-l" : "d-l-q"}
                          markerEnd={i > n ? "url(#pa-warn)" : "url(#pa)"}
                          data-c={i > n ? "warn" : undefined}
                        />
                      )}
                    </g>
                  );
                })}

                {i >= 1 && i <= 3 && (
                  <g data-enter="" data-c="warn">
                    <path d="M180 156 L 556 156" className="d-l-q" />
                    <text x="180" y="178" className="d-m">{s(T.d6once)}</text>
                  </g>
                )}

                {i >= 4 && (
                  <g data-enter="" data-c={cached ? "ok" : "info"}>
                    <rect x="544" y="152" width="152" height="56" className="d-box-fill" />
                    <Ic n={cached ? "zap" : "refresh"} x={560} y={166} s={18} c={cached ? "ok" : "info"} />
                    <text x="590" y="180" className="d-b" fontSize="11">_jspService()</text>
                    <text x="560" y="200" className="d-s">{s(T.d6each)}</text>
                  </g>
                )}
                {cached && (
                  <g data-enter="" data-c="ok">
                    <path d="M16 208 C 200 232 400 232 536 190" className="d-l" markerEnd="url(#pa-ok)" />
                    <text x="24" y="196" className="d-m">{s(T.d6cached)}</text>
                  </g>
                )}

                {i === 0 && (
                  <text x="16" y="176" className="d-s">
                    {s(T.d6hand)}
                  </text>
                )}
              </>
            );
          }}
        </Walkthrough>

        <Table
          head={[s(T.t6h1), s(T.t6h2), s(T.t6h3)]}
          rows={[
            [<code key="a">{"<%@ page … %>"}</code>, s(T.t6r1b), s(T.t6r1c)],
            [
              <code key="b">{"<%! int n; %>"}</code>,
              s(T.t6r2b),
              <Tr
                key="s"
                vi={<><strong>trường</strong> của servlet — đúng cái bẫy ở mục 7.1</>}
                en={<>a servlet <strong>field</strong> — precisely the trap from 7.1</>}
              />,
            ],
            [
              <code key="c">{"<% … %>"}</code>,
              s(T.t6r3b),
              <Tr key="d" vi={<>thân <code>_jspService()</code></>} en={<>the body of <code>_jspService()</code></>} />,
            ],
            [<code key="e">{"<%= ten %>"}</code>, s(T.t6r4b), <code key="f">out.print(ten)</code>],
            [<code key="g">{"${ten}"}</code>, s(T.t6r5b), s(T.t6r5c)],
          ]}
        />
        <Trap>
          <Tr
            vi={
              <p>
                Dòng thứ hai trong bảng là cái bẫy thật: <code>{"<%! int soLuot = 0; %>"}</code> tạo ra một{" "}
                <strong>trường của servlet</strong>, dùng chung cho mọi khách. Cùng một lỗi ở mục 7.1, chỉ khác
                là lần này nó nấp trong một dấu chấm than.
              </p>
            }
            en={
              <p>
                The second row is the real trap: <code>{"<%! int hits = 0; %>"}</code> creates a{" "}
                <strong>servlet field</strong>, shared by every guest. The same bug as 7.1, except this time it
                is hiding inside an exclamation mark.
              </p>
            }
          />
        </Trap>
        <P>
          <Tr
            vi={
              <>
                JSP có sẵn chín <strong>đối tượng ngầm</strong> không cần khai báo: <code>request</code>,{" "}
                <code>response</code>, <code>session</code>, <code>application</code>, <code>out</code>,{" "}
                <code>config</code>, <code>pageContext</code>, <code>page</code>, <code>exception</code>.
              </>
            }
            en={
              <>
                A JSP has nine <strong>implicit objects</strong> that need no declaration: <code>request</code>,{" "}
                <code>response</code>, <code>session</code>, <code>application</code>, <code>out</code>,{" "}
                <code>config</code>, <code>pageContext</code>, <code>page</code>, <code>exception</code>.
              </>
            }
          />
        </P>
        <Table
          head={["", "Model 1", "Model 2 (MVC)"]}
          rows={[
            [s(T.t7r1), s(T.t7r1a), s(T.t7r1b)],
            [s(T.t7r2), s(T.t7r2a), s(T.t7r2b)],
            [s(T.t7r3), s(T.t7r3a), s(T.t7r3b)],
            [s(T.t7r4), s(T.t7r4a), s(T.t7r4b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Model 2 chính là <strong>khuôn mà Spring MVC dựng sẵn cho bạn</strong>: servlet nhận và điều
                phối, tầng service xử lý, trang chỉ hiển thị. Biết nó là biết Spring MVC không phát minh ra kiến
                trúc nào mới — nó làm sẵn phần bạn phải tự nối bằng tay.
              </>
            }
            en={
              <>
                Model 2 is <strong>the shape Spring MVC builds for you</strong>: a servlet receives and routes,
                the service layer does the work, the page only displays. Knowing it is knowing that Spring MVC
                invented no new architecture — it prebuilt the part you would otherwise wire by hand.
              </>
            }
          />
        </P>
        <Limit>
          <Tr
            vi={
              <>
                Scriptlet <code>{"<% %>"}</code> gần như không còn được dùng trong dự án mới: nó trộn Java vào
                giao diện, không test được, không tái sử dụng được. Thứ thay thế là <strong>JSTL và EL</strong>,
                và trong các dự án gần đây thì cả JSP cũng thường bị thay bằng Thymeleaf hoặc bỏ hẳn cho một
                frontend riêng.
              </>
            }
            en={
              <>
                The <code>{"<% %>"}</code> scriptlet is essentially gone from new projects: it mixes Java into
                the view, cannot be tested, cannot be reused. Its replacement is <strong>JSTL and EL</strong>,
                and in recent projects JSP itself is usually replaced by Thymeleaf or dropped altogether in
                favour of a separate frontend.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="7.7" t={s(T.s7)}>
        <P>
          <Tr
            vi={
              <>
                Vì Spring Boot <strong>không thay thế servlet — nó đứng trên servlet</strong>. Mọi thứ ở sáu mục
                trên vẫn đang chạy trong ứng dụng của bạn, chỉ là bạn không nhìn thấy chúng.
              </>
            }
            en={
              <>
                Because Spring Boot <strong>does not replace servlets — it stands on them</strong>. Everything
                in the six sections above is still running inside your application; you just do not see it.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t8h1), s(T.t8h2)]}
          rows={[
            [
              s(T.t8r1a),
              <Tr
                key="r1"
                vi={<>Tomcat nhúng — nó nằm sẵn trong file jar, không cần cài riêng</>}
                en={<>an embedded Tomcat — already inside the jar, nothing to install</>}
              />,
            ],
            [
              s(T.t8r2a),
              <Tr
                key="r2"
                vi={<><code>DispatcherServlet</code> — mẫu Front Controller</>}
                en={<><code>DispatcherServlet</code> — the Front Controller pattern</>}
              />,
            ],
            [
              s(T.t8r3a),
              <span key="r3">
                <code>@GetMapping</code>, <code>@PostMapping</code>
              </span>,
            ],
            [
              s(T.t8r4a),
              <Tr
                key="r4"
                vi={<>chuỗi filter của Spring Security — vẫn là <code>Filter</code> đúng nghĩa</>}
                en={<>Spring Security's filter chain — genuinely still a <code>Filter</code></>}
              />,
            ],
            [
              s(T.t8r5a),
              <Tr
                key="r5"
                vi={<>trả về đối tượng, để <code>HttpMessageConverter</code> đổi sang JSON</>}
                en={<>return an object and let <code>HttpMessageConverter</code> turn it into JSON</>}
              />,
            ],
            [
              s(T.t8r6a),
              <Tr
                key="r6"
                vi={<>trường thay đổi được trong một bean <code>@Service</code></>}
                en={<>a mutable field on a <code>@Service</code> bean</>}
              />,
            ],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Hàng cuối cùng là lý do thật để học trang này. <strong>Bean singleton của Spring có đúng cùng một
                cái bẫy với servlet</strong>, vì nó là đúng cùng một tình huống: một object, nhiều luồng, không
                khoá. Người hiểu servlet nhìn ra ngay; người chỉ học Spring thường phải gặp lỗi trên production
                một lần rồi mới hiểu.
              </>
            }
            en={
              <>
                The last row is the real reason to learn this page. <strong>A Spring singleton bean carries
                exactly the servlet trap</strong>, because it is exactly the same situation: one object, many
                threads, no lock. Someone who understands servlets sees it immediately; someone who only learned
                Spring usually has to meet the bug in production once first.
              </>
            }
          />
        </P>
        <Trap t={T.trapAsk}>
          <Tr
            vi={
              <p>
                <em>"Servlet với Spring MVC khác nhau gì?"</em> — Câu trả lời gọn:{" "}
                <strong>Spring MVC là một servlet</strong>. Nó cài đặt <code>DispatcherServlet</code> để nhận
                tất cả, rồi tự phân phối tới method của bạn dựa trên annotation. Cái nó bỏ đi là công đoạn khai
                báo tay và phân tích tham số, không phải mô hình bên dưới.
              </p>
            }
            en={
              <p>
                <em>"What is the difference between a servlet and Spring MVC?"</em> — The short answer:{" "}
                <strong>Spring MVC is a servlet</strong>. It installs a <code>DispatcherServlet</code> to
                receive everything, then dispatches to your methods based on annotations. What it removes is the
                manual declaration and parameter parsing, not the model underneath.
              </p>
            }
          />
        </Trap>
        <Limit>
          <Tr
            vi={
              <>
                Tôi <strong>chưa từng viết servlet hay JSP trong một dự án thật</strong> — hệ thống của tôi là
                API trả JSON với một frontend React riêng, nên không có trang JSP nào cả. Trang này viết từ sách
                và từ việc đọc lại đường đi của request trong ứng dụng Spring Boot mình đang chạy. Nếu bị hỏi "em
                đã làm JSP chưa", câu trả lời đúng là chưa — nhưng cơ chế bên dưới thì đúng là thứ đang chạy.
              </>
            }
            en={
              <>
                I have <strong>never written a servlet or a JSP in a real project</strong> — my system is a
                JSON API with a separate React frontend, so there is no JSP page anywhere in it. This page comes
                from the book and from tracing the request path through the Spring Boot application I actually
                run. Asked "have you done JSP", the honest answer is no — but the mechanism underneath is what
                is running.
              </>
            }
          />
        </Limit>
      </Sec>
    </div>
  );
}
