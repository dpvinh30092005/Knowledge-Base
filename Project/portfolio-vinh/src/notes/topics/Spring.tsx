import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Src, Tr, say, type Tx } from "../i18n";
import { CodeTr, Defs, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 08 · Spring.
 *
 * Two walkthroughs, both chosen because the thing that confuses people is a
 * *path*: which object the call actually lands on, and which components a
 * request passes through. Both are invisible in the source, which is exactly
 * when a drawing earns its place.
 *
 * The cast is CarBO / CarDAO, taken from the Java/J2EE Job Interview Companion
 * Q09, which is the only one of the four books that covers Spring at all.
 *
 * Sections 8.3–8.4 have no book behind them — Spring's CGLIB proxying is years
 * newer than every one of these four — and the source line says so rather than
 * attaching a citation that would not survive being checked. The measured
 * figures (137 endpoints, 22 controllers) are claims about the system I run and
 * are worded so they cannot be mistaken for part of the example.
 */

const T = {
  lede: {
    vi: "Phần lớn thứ gây bối rối ở Spring không nằm trong cú pháp mà nằm ở chỗ lời gọi thật sự đi tới đâu. Hai hình dưới đây vẽ đúng hai đường đi đó.",
    en: "Most of what confuses people about Spring is not the syntax but where the call actually lands. The two figures below draw exactly those two paths.",
  },
  source: {
    vi: "Java/J2EE Job Interview Companion, chương 4 · trong hệ thống thật của tôi, 137 endpoint trên 22 controller đều đi qua đường ở mục 8.5",
    en: "Java/J2EE Job Interview Companion, ch.4 · in the system I actually run, all 137 endpoints across 22 controllers travel the path in 8.5",
  },

  /* 8.1 */
  s1: { vi: "IoC và DI — và vì sao chúng không phải một thứ", en: "IoC and DI — and why they are not the same thing" },
  s1src: {
    vi: 'Java/J2EE Job Interview Companion, Q09 — "What is inversion of control (IoC)?", trang 319. Hai class CarBO và CarDAO là của sách; đoạn code là bản Java hoá cái hình trong sách.',
    en: `Java/J2EE Job Interview Companion, Q09 — "What is inversion of control (IoC)?", p.319. CarBO and CarDAO are the book's; the code writes out the diagram it draws.`,
  },
  t1h1: { vi: "Kiểu tiêm", en: "Injection style" },
  t1h2: { vi: "Dùng khi", en: "Use when" },
  t1h3: { vi: "Vấn đề", en: "The catch" },
  t1r1a: { vi: "Constructor", en: "Constructor" },
  t1r1b: { vi: "mặc định, dùng cho mọi phụ thuộc bắt buộc", en: "the default, for every required dependency" },
  t1r1c: {
    vi: "constructor dài khi class làm quá nhiều — mà đó là tín hiệu đúng",
    en: "a long constructor when the class does too much — which is the signal working correctly",
  },
  t1r2a: { vi: "Setter", en: "Setter" },
  t1r2b: { vi: "phụ thuộc tuỳ chọn, thay được lúc chạy", en: "optional dependencies, swappable at run time" },
  t1r2c: {
    vi: "object có khoảng thời gian tồn tại mà chưa đủ phụ thuộc",
    en: "the object exists for a while without all its dependencies",
  },
  t1r3b: { vi: "hầu như không nên", en: "almost never" },
  t1r3c: {
    vi: "không khai final được, test phải dùng reflection, giấu đi việc class phụ thuộc quá nhiều",
    en: "cannot be final, tests need reflection, and it hides how much the class depends on",
  },
  trap1: { vi: "Câu hay bị hỏi ngay sau", en: "The question that follows immediately" },

  /* 8.2 */
  s2: { vi: "Bean scope, và cái bẫy nằm trong singleton", en: "Bean scopes, and the trap inside singleton" },

  /* 8.3 */
  s3: { vi: "Proxy — Spring bọc bean của bạn bằng gì", en: "Proxies — what Spring wraps your bean in" },
  t3h1: { vi: "Cơ chế", en: "Mechanism" },
  t3h2: { vi: "Dùng khi", en: "Used when" },
  t3h3: { vi: "Proxy là gì", en: "The proxy is" },
  t3r1b: { vi: "bean có hiện thực interface", en: "the bean implements an interface" },
  t3r1c: { vi: "một object cũng hiện thực interface đó", en: "an object implementing that same interface" },
  t3r2b: { vi: "không có interface", en: "there is no interface" },
  t3r2c: { vi: "một lớp con sinh lúc chạy", en: "a subclass generated at run time" },

  /* 8.4 */
  s4: { vi: "Vì sao @Transactional im lặng không chạy", en: "Why @Transactional silently does nothing" },
  s4src: {
    vi: 'Spring Framework Reference — "Understanding AOP Proxies": "self invocation via an explicit or implicit this reference will bypass the advice". Trang "Using @Transactional" nói thẳng hệ quả: "self-invocation … does not lead to an actual transaction at runtime even if the invoked method is marked with @Transactional".',
    en: 'Spring Framework Reference — "Understanding AOP Proxies": "self invocation via an explicit or implicit this reference will bypass the advice". The "Using @Transactional" page states the consequence outright: "self-invocation … does not lead to an actual transaction at runtime even if the invoked method is marked with @Transactional".',
  },
  fig4aria: {
    vi: "Lời gọi từ ngoài đi qua proxy và có transaction; lời gọi nội bộ đi thẳng và bỏ qua proxy",
    en: "A call from outside goes through the proxy and gets a transaction; an internal call goes direct and skips the proxy",
  },
  k4a: { vi: "có transaction", en: "transaction present" },
  k4b: { vi: "proxy bị bỏ qua", en: "proxy bypassed" },
  d4client: { vi: "controller", en: "controller" },
  d4open: { vi: "mở transaction", en: "opens the transaction" },
  d4read: { vi: "đọc @Transactional", en: "reads @Transactional" },
  d4self: { vi: "this.saveOne() — không rời khỏi object", en: "this.saveOne() — never leaves the object" },
  d4never: { vi: "proxy không bao giờ thấy lời gọi này", en: "the proxy never sees this call" },
  d4noeffect: {
    vi: "nên @Transactional trên saveOne() không có tác dụng",
    en: "so @Transactional on saveOne() has no effect",
  },
  d4n0: {
    vi: "client giữ tham chiếu tới proxy, không phải bean thật",
    en: "the client holds a reference to the proxy, not the real bean",
  },
  d4n1: { vi: "đường này đúng — có transaction", en: "this path is correct — there is a transaction" },

  /* 8.5 */
  s5: { vi: "Một request đi qua những đâu", en: "What a request passes through" },
  fig5aria: {
    vi: "Request đi qua filter chain, DispatcherServlet, HandlerMapping, chuyển đổi JSON, controller và service",
    en: "A request travels through the filter chain, DispatcherServlet, HandlerMapping, JSON conversion, controller and service",
  },
  k5a: { vi: "chặng đang chạy", en: "the stage running now" },
  k5b: { vi: "đã đi qua", en: "already passed" },
  b5a: { vi: "3 filter bảo mật", en: "3 security filters" },
  b5b: { vi: "Front Controller", en: "Front Controller" },
  b5c: { vi: "URL → method", en: "URL → method" },
  b5valid: { vi: "@Valid chạy ở bước chuyển JSON → DTO", en: "@Valid runs during JSON → DTO conversion" },
  b5exc: {
    vi: "exception ném ra → HandlerExceptionResolver → @RestControllerAdvice (GlobalExceptionHandler)",
    en: "an exception thrown → HandlerExceptionResolver → @RestControllerAdvice (GlobalExceptionHandler)",
  },
  d5container: { vi: "servlet container", en: "servlet container" },

  /* 8.6 – 8.8 */
  s6: { vi: "Các mức propagation", en: "The propagation levels" },
  t6h1: { vi: "Propagation", en: "Propagation" },
  t6h2: { vi: "Đang có transaction", en: "A transaction exists" },
  t6h3: { vi: "Chưa có", en: "None yet" },
  t6r1a: { vi: "tham gia vào", en: "join it" },
  t6r1b: { vi: "tạo mới", en: "start a new one" },
  t6r2a: { vi: "treo cái cũ, tạo mới", en: "suspend it, start a new one" },
  t6r3a: { vi: "tham gia", en: "join" },
  t6r3b: { vi: "chạy không transaction", en: "run without one" },
  t6r4b: { vi: "ném exception", en: "throw" },
  t6r6a: { vi: "tạo savepoint", en: "create a savepoint" },
  s7: { vi: "Auto-configuration thật ra làm gì", en: "What auto-configuration actually does" },
  s8: { vi: "@Qualifier và @Primary", en: "@Qualifier and @Primary" },
} satisfies Record<string, Tx>;

function proxySteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "gọi từ ngoài", note: "Client giữ tham chiếu tới proxy, không phải tới bean thật. Nó không biết điều đó, và không cần biết." },
        { label: "proxy mở transaction", note: "Proxy thấy @Transactional, mở transaction, rồi mới uỷ quyền xuống bean thật." },
        { label: "bean thật chạy", note: "saveAll() chạy trong transaction do proxy mở. Tới đây mọi thứ vẫn đúng." },
        { label: "gọi nội bộ", note: "saveAll() gọi saveOne() cho từng phần tử. Lời gọi này là this.saveOne() — đi thẳng trong cùng một object." },
        { label: "proxy bị bỏ qua", note: "Không đi qua proxy thì không ai đọc @Transactional. Lưu 200 bản ghi mà hỏng ở bản thứ 150 thì 149 bản đầu đã nằm lại trong database — không có gì để rollback." },
      ]
    : [
        { label: "a call from outside", note: "The client holds a reference to the proxy, not to the real bean. It does not know that, and does not need to." },
        { label: "the proxy opens a transaction", note: "The proxy sees @Transactional, opens a transaction, and only then delegates down to the real bean." },
        { label: "the real bean runs", note: "saveAll() runs inside the transaction the proxy opened. Everything is still correct at this point." },
        { label: "an internal call", note: "saveAll() calls saveOne() for each element. That call is this.saveOne() — it goes straight through, inside the same object." },
        { label: "the proxy is bypassed", note: "No proxy means nobody reads @Transactional. Save 200 rows, fail on row 150, and the first 149 are already in the database — with nothing to roll back." },
      ];
}

function reqSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "filter chain", note: "Servlet container chạy filter trước tiên — dãy cổng an ninh ở trang 07. Chúng thấy request thô, nhưng chưa biết controller nào sẽ xử lý." },
        { label: "DispatcherServlet", note: "Một servlet duy nhất nhận mọi request và điều phối. Đây là mẫu Front Controller." },
        { label: "HandlerMapping", note: "Đối chiếu URL và HTTP method với danh sách handler đã quét được lúc khởi động, trả về controller và method khớp." },
        { label: "chuyển JSON → DTO", note: "HttpMessageConverter (Jackson) đọc body, dựng DTO. @Valid chạy ở đây; sai thì ném MethodArgumentNotValidException." },
        { label: "controller → service", note: "Controller gọi xuống tầng service. Transaction mở ở đây, không phải ở controller." },
        { label: "chuyển DTO → JSON", note: "Giá trị trả về đi ngược qua converter thành JSON. Nếu có exception, HandlerExceptionResolver bắt và dẫn về @RestControllerAdvice." },
      ]
    : [
        { label: "filter chain", note: "The servlet container runs filters first — the row of security gates from page 07. They see the raw request but do not yet know which controller will handle it." },
        { label: "DispatcherServlet", note: "One servlet receives every request and routes it. This is the Front Controller pattern." },
        { label: "HandlerMapping", note: "Matches the URL and HTTP method against the handler list scanned at startup, and returns the controller and method that fit." },
        { label: "JSON → DTO", note: "An HttpMessageConverter (Jackson) reads the body and builds the DTO. @Valid runs here; on failure it throws MethodArgumentNotValidException." },
        { label: "controller → service", note: "The controller calls down into the service layer. The transaction opens here, not in the controller." },
        { label: "DTO → JSON", note: "The return value travels back out through the converter as JSON. On an exception, HandlerExceptionResolver catches it and routes to @RestControllerAdvice." },
      ];
}

export default function Spring({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="08" name="Spring" lede={s(T.lede)} source={s(T.source)} />

      <Sec n="8.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                <strong>IoC</strong> là đảo ngược quyền điều khiển: bình thường object tự <code>new</code> ra thứ
                nó cần; với IoC, container tạo và nối, còn code chỉ khai báo nó cần gì.
              </>
            }
            en={
              <>
                <strong>IoC</strong> is inverting control: normally an object <code>new</code>s up what it needs;
                with IoC the container builds and wires, and the code only declares what it wants.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <strong>DI</strong> là cách hiện thực IoC phổ biến nhất — phụ thuộc được đưa vào từ ngoài qua
                constructor, setter, hoặc trường.
              </>
            }
            en={
              <>
                <strong>DI</strong> is the most common way to implement IoC — the dependency is handed in from
                outside through a constructor, a setter, or a field.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Sách gọi tên chỗ này rất gọn — <em>Hollywood principle</em>: object được gọi nói với người gọi{" "}
                <em>"don't call us, we'll call you"</em>. Người gọi thôi không đi tìm phụ thuộc nữa; container
                đưa tới tận nơi.
              </>
            }
            en={
              <>
                The book names it neatly — the <em>Hollywood principle</em>: the called object tells the caller{" "}
                <em>"don't call us, we'll call you"</em>. The caller stops going to look for its dependencies;
                the container brings them.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// KHÔNG có dependency injection — CarBO tự đi tìm CarDAO
class CarBO {
  private CarDAO dao = new CarDAO();     // buộc chặt vào đúng class này
  public List<Car> findAll() { return dao.findAll(); }
}

// CÓ dependency injection — ai đó đưa vào từ ngoài
class CarBO {
  private final CarDAO dao;
  public CarBO(CarDAO dao) { this.dao = dao; }   // container gán
  public List<Car> findAll() { return dao.findAll(); }
}`}
          en={`// WITHOUT dependency injection — CarBO goes and finds CarDAO itself
class CarBO {
  private CarDAO dao = new CarDAO();     // welded to this exact class
  public List<Car> findAll() { return dao.findAll(); }
}

// WITH dependency injection — somebody hands it in from outside
class CarBO {
  private final CarDAO dao;
  public CarBO(CarDAO dao) { this.dao = dao; }   // the container assigns it
  public List<Car> findAll() { return dao.findAll(); }
}`}
        />
        <Src vi={T.s1src.vi} en={T.s1src.en} />
        <P>
          <Tr
            vi={
              <>
                Lợi ích thật sự không phải "code đẹp hơn" mà là <strong>kiểm thử được</strong>. Bản dưới nhận{" "}
                <code>CarDAO</code> qua constructor, nên trong test bạn đưa vào một mock — không cần database
                nào. Bản trên thì không có cách nào thay <code>new CarDAO()</code> ra.
              </>
            }
            en={
              <>
                The real benefit is not "nicer code", it is <strong>testability</strong>. The second version
                takes <code>CarDAO</code> through the constructor, so a test hands in a mock — no database
                needed. In the first there is no way to replace <code>new CarDAO()</code> at all.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Đây không phải lợi ích lý thuyết: 330 test trong hệ thống thật của tôi chạy được mà không cần một
                database nào là nhờ đúng điều này.
              </>
            }
            en={
              <>
                This is not a theoretical benefit: 330 tests in the system I actually run pass without a
                database anywhere, and this is why.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t1h1), s(T.t1h2), s(T.t1h3)]}
          rows={[
            [s(T.t1r1a), s(T.t1r1b), s(T.t1r1c)],
            [s(T.t1r2a), s(T.t1r2b), s(T.t1r2c)],
            [
              <Tr key="f" vi={<><code>@Autowired</code> trên trường</>} en={<><code>@Autowired</code> on a field</>} />,
              s(T.t1r3b),
              s(T.t1r3c),
            ],
          ]}
        />
        <Trap t={T.trap1}>
          <Tr
            vi={
              <p>
                <strong>DI không phải DIP.</strong> DIP là nguyên tắc thiết kế — hãy phụ thuộc vào trừu tượng.
                DI là kỹ thuật — ai đó đưa phụ thuộc vào từ ngoài. Bạn hoàn toàn có thể dùng DI mà tiêm một class
                cụ thể, khi đó có DI nhưng không có DIP.
              </p>
            }
            en={
              <p>
                <strong>DI is not DIP.</strong> DIP is the design principle — depend on abstractions. DI is the
                technique — somebody hands the dependency in from outside. You can perfectly well use DI to
                inject a concrete class, and then you have DI without DIP.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="8.2" t={s(T.s2)}>
        <P>
          <Tr
            vi={
              <>
                <code>singleton</code> là mặc định — <strong>một instance cho mỗi container</strong>, không phải
                mỗi JVM. Ngoài ra có <code>prototype</code>, và trong ứng dụng web có <code>request</code>,{" "}
                <code>session</code>, <code>application</code>, <code>websocket</code>.
              </>
            }
            en={
              <>
                <code>singleton</code> is the default — <strong>one instance per container</strong>, not per
                JVM. There is also <code>prototype</code>, and in a web application <code>request</code>,{" "}
                <code>session</code>, <code>application</code> and <code>websocket</code>.
              </>
            }
          />
        </P>
        <Trap>
          <Tr
            vi={
              <>
                <p>
                  Bean singleton <strong>phải phi trạng thái</strong>, vì mọi request dùng chung nó. Đặt một
                  trường thay đổi được vào <code>@Service</code> là tạo ra lỗi tranh chấp dữ liệu giữa những
                  người dùng khác nhau — loại lỗi chỉ xuất hiện khi có tải, tức là trên production.
                </p>
                <p>
                  Đây đúng là tình huống ở trang 06: một object <code>Callme</code> duy nhất, ba luồng cùng gọi
                  vào. Bean <code>@Service</code> singleton của Spring <strong>là</strong> object đó, còn ba
                  luồng là ba request đến cùng lúc — chỉ khác là Spring không in ra màn hình cho bạn thấy kết quả
                  rối.
                </p>
              </>
            }
            en={
              <>
                <p>
                  A singleton bean <strong>must be stateless</strong>, because every request shares it. Putting
                  a mutable field on a <code>@Service</code> creates a data race between different users — the
                  kind of bug that only shows up under load, which is to say in production.
                </p>
                <p>
                  This is exactly the situation on page 06: one <code>Callme</code> object, three threads
                  calling into it. Spring's singleton <code>@Service</code> bean <strong>is</strong> that
                  object, and the three threads are three requests arriving at once — the only difference being
                  that Spring does not print the mangled result on screen for you.
                </p>
              </>
            }
          />
        </Trap>
      </Sec>

      <Sec n="8.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Spring không gọi thẳng vào bean của bạn khi bean đó cần transaction, kiểm tra quyền, hay cache.
                Nó dựng một <strong>proxy</strong> bọc bên ngoài và đưa proxy cho người gọi.
              </>
            }
            en={
              <>
                Spring does not call straight into your bean when that bean needs a transaction, an authority
                check, or a cache. It builds a <strong>proxy</strong> around it and hands the proxy to the
                caller.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t3h1), s(T.t3h2), s(T.t3h3)]}
          rows={[
            ["JDK dynamic proxy", s(T.t3r1b), s(T.t3r1c)],
            ["CGLIB", s(T.t3r2b), s(T.t3r2c)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Spring Boot đặt <code>proxyTargetClass = true</code> theo mặc định, nghĩa là{" "}
                <strong>luôn dùng CGLIB</strong>, kể cả khi có interface.
              </>
            }
            en={
              <>
                Spring Boot sets <code>proxyTargetClass = true</code> by default, which means it{" "}
                <strong>always uses CGLIB</strong>, even when an interface exists.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Hệ quả trực tiếp: class và method <strong>không được <code>final</code></strong>, vì proxy phải
                override được. Đặt <code>final</code> lên một method <code>@Transactional</code> thì transaction
                lặng lẽ không hoạt động — không lỗi, không cảnh báo.
              </>
            }
            en={
              <>
                The direct consequence: the class and its methods <strong>may not be <code>final</code></strong>,
                because the proxy has to override them. Put <code>final</code> on a <code>@Transactional</code>{" "}
                method and the transaction quietly stops working — no error, no warning.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="8.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                Đây là câu phân loại người dùng Spring thật với người mới đọc tài liệu, và nó là hệ quả trực tiếp
                của mục trên.
              </>
            }
            en={
              <>
                This is the question that separates people who have used Spring from people who have read about
                it, and it follows directly from the section above.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`@Service
public class CarBO {

    public void saveAll(List<Car> cars) {
        for (Car c : cars) saveOne(c);   // KHÔNG có transaction
    }

    @Transactional
    public void saveOne(Car c) { ... }
}`}
          en={`@Service
public class CarBO {

    public void saveAll(List<Car> cars) {
        for (Car c : cars) saveOne(c);   // NO transaction here
    }

    @Transactional
    public void saveOne(Car c) { ... }
}`}
        />
        <Src vi={T.s4src.vi} en={T.s4src.en} />

        <Walkthrough
          viewBox="0 0 720 240"
          aria={s(T.fig4aria)}
          hold={2100}
          steps={proxySteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 8.4" : "Figure 8.4"}</span>
              <Tr
                vi={
                  <>
                    Cùng một annotation, hai kết quả khác nhau — khác biệt duy nhất là lời gọi có đi qua proxy
                    hay không.
                  </>
                }
                en={
                  <>
                    One annotation, two different outcomes — the only difference is whether the call went
                    through the proxy.
                  </>
                }
              />
              <Key
                items={[
                  { c: "ok", t: s(T.k4a) },
                  { c: "bad", t: s(T.k4b) },
                ]}
              />
            </>
          }
        >
          {(i) => (
            <>
              <rect x="24" y="72" width="112" height="56" className="d-box" />
              <text x="80" y="98" className="d-b" textAnchor="middle">Client</text>
              <text x="80" y="116" className="d-s" textAnchor="middle">{s(T.d4client)}</text>

              <g data-c={i >= 1 && i <= 2 ? "ok" : i >= 4 ? "bad" : undefined}>
                <rect x="216" y="56" width="160" height="88" className={i >= 1 && i <= 2 ? "d-box-fill" : "d-box"} />
                <Ic n={i >= 4 ? "unlock" : "shield"} x={228} y={64} s={16} c={i >= 1 && i <= 2 ? "ok" : i >= 4 ? "bad" : undefined} />
              </g>
              <text x="296" y="84" className="d-b" textAnchor="middle" data-c={i >= 1 && i <= 2 ? "ok" : i >= 4 ? "bad" : undefined}>Proxy</text>
              <text x="296" y="104" className="d-m" textAnchor="middle">CGLIB</text>
              <text x="296" y="126" className="d-s" textAnchor="middle">
                {i >= 1 && i <= 2 ? s(T.d4open) : s(T.d4read)}
              </text>

              <rect x="456" y="40" width="232" height="120" className={i >= 2 ? "d-box-fill" : "d-box"} />
              <text x="572" y="68" className="d-b" textAnchor="middle">CarBO</text>
              <text x="472" y="98" className={i >= 2 ? "d-m-a" : "d-m"}>saveAll()</text>
              <text x="472" y="128" className={i >= 4 ? "d-m-a" : "d-m"}>saveOne()  @Transactional</text>

              {i >= 0 && (
                <line x1="136" y1="100" x2="208" y2="100" className="d-l" markerEnd="url(#pa)" />
              )}
              {i >= 2 && (
                <line x1="376" y1="100" x2="448" y2="100" className="d-l" markerEnd="url(#pa-ok)" data-enter="" data-c="ok" />
              )}

              {/* the internal call — the whole point */}
              {i >= 3 && (
                <g data-enter="" data-c="bad">
                  <path d="M472 106 C 440 112 440 122 468 128" className="d-l" markerEnd="url(#pa-a)" />
                  <text x="472" y="152" className="d-m">{s(T.d4self)}</text>
                </g>
              )}

              {i >= 4 && (
                <g data-enter="" data-c="bad">
                  <path d="M448 176 L 384 176" className="d-l-q" />
                  <Ic n="x" x={24} y={170} s={15} c="bad" />
                  <text x="46" y="182" className="d-m">{s(T.d4never)}</text>
                  <text x="24" y="204" className="d-s">{s(T.d4noeffect)}</text>
                </g>
              )}

              {i <= 2 && (
                <text x="24" y="204" className="d-s">
                  {i === 0 ? s(T.d4n0) : s(T.d4n1)}
                </text>
              )}
            </>
          )}
        </Walkthrough>

        <P>
          <Tr
            vi={
              <>
                Ba cách sửa: tách <code>saveOne</code> sang một bean khác rồi tiêm vào, tự tiêm chính mình, hoặc
                dùng <code>TransactionTemplate</code>. <strong>Tách bean là cách sạch nhất</strong> — hai cách
                kia đều là lách qua cơ chế thay vì đi theo nó.
              </>
            }
            en={
              <>
                Three fixes: move <code>saveOne</code> into a separate bean and inject it, inject the bean into
                itself, or use <code>TransactionTemplate</code>. <strong>Splitting the bean is the cleanest</strong>{" "}
                — the other two work around the mechanism instead of with it.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Cùng lý do đó giải thích vì sao <code>@Transactional</code> trên method <code>private</code> cũng
                vô tác dụng: proxy không override được method private. Chi tiết ít người biết:{" "}
                <strong>từ Spring 6.0, method <code>protected</code> và package-private đã chạy được</strong> với
                proxy dựa trên class — nhưng qua interface thì vẫn bắt buộc <code>public</code>.
              </>
            }
            en={
              <>
                The same reason explains why <code>@Transactional</code> on a <code>private</code> method does
                nothing either: a proxy cannot override a private method. The detail few people know:{" "}
                <strong>since Spring 6.0, <code>protected</code> and package-visible methods do work</strong>{" "}
                with class-based proxies — though through an interface they must still be <code>public</code>.
              </>
            }
          />
        </P>
        <Limit>
          <Tr
            vi={
              <>
                Proxy chỉ chặn được lời gọi <em>đi vào</em> bean từ ngoài. Mọi annotation dựa trên AOP —{" "}
                <code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code>,{" "}
                <code>@PreAuthorize</code> — đều dính cùng một hạn chế này, không riêng gì transaction.
              </>
            }
            en={
              <>
                A proxy can only intercept calls <em>entering</em> the bean from outside. Every AOP-based
                annotation — <code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code>,{" "}
                <code>@PreAuthorize</code> — carries the same limit, not transactions alone.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="8.5" t={s(T.s5)}>
        <Walkthrough
          viewBox="0 0 720 232"
          aria={s(T.fig5aria)}
          hold={1900}
          steps={reqSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 8.5" : "Figure 8.5"}</span>
              <Tr
                vi={
                  <>
                    Điểm mấu chốt: <strong>filter chạy trước <code>DispatcherServlet</code></strong>. Filter thấy
                    request thô nhưng chưa biết controller nào; interceptor thì ngược lại. Vòng đời servlet nằm ở
                    trang 07.
                  </>
                }
                en={
                  <>
                    The key point: <strong>filters run before <code>DispatcherServlet</code></strong>. A filter
                    sees the raw request but not which controller will handle it; an interceptor is the other
                    way round. The servlet lifecycle is on page 07.
                  </>
                }
              />
              <Key
                items={[
                  { c: "info", t: s(T.k5a) },
                  { c: "ok", t: s(T.k5b) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const boxes = [
              { t: "Filter chain", s: s(T.b5a), ic: "filter" as const },
              { t: "Dispatcher", s: s(T.b5b), ic: "server" as const },
              { t: "HandlerMapping", s: s(T.b5c), ic: "search" as const },
              { t: "Converter", s: "JSON → DTO", ic: "code" as const },
              { t: "Controller", s: "→ Service", ic: "box" as const },
              { t: "Converter", s: "DTO → JSON", ic: "send" as const },
            ];
            return (
              <>
                <line x1="8" y1="88" x2="32" y2="88" className="d-l" markerEnd="url(#pa)" />
                {boxes.map((b, n) => {
                  const role = n === i ? "info" : n < i ? "ok" : undefined;
                  return (
                    <g key={b.t + n} data-c={role}>
                      <rect x={32 + n * 112} y={48} width={96} height={64} className={role ? "d-box-fill" : "d-box"} />
                      <Ic n={b.ic} x={72 + n * 112} y={54} s={16} c={role} />
                      <text x={80 + n * 112} y={88} className="d-b" textAnchor="middle" fontSize="11">
                        {b.t}
                      </text>
                      <text x={80 + n * 112} y={104} className="d-s" textAnchor="middle">
                        {b.s}
                      </text>
                      {n < boxes.length - 1 && (
                        <line
                          x1={128 + n * 112}
                          y1={88}
                          x2={24 + (n + 1) * 112}
                          y2={88}
                          className="d-l"
                          markerEnd={n < i ? "url(#pa-ok)" : "url(#pa)"}
                          data-c={n < i ? "ok" : undefined}
                        />
                      )}
                    </g>
                  );
                })}

                <line x1="8" y1="136" x2="128" y2="136" className="d-l-q" />
                <text x="8" y="156" className="d-s">{s(T.d5container)}</text>
                <line x1="144" y1="136" x2="712" y2="136" className="d-l-q" />
                <text x="152" y="156" className="d-s">Spring MVC</text>

                {i >= 3 && (
                  <g data-enter="" data-c="info">
                    <Ic n="check" x={32} y={180} s={15} c="info" />
                    <text x="54" y="192" className="d-m">{s(T.b5valid)}</text>
                  </g>
                )}
                {i >= 5 && (
                  <text x="32" y="216" className="d-s" data-enter="">
                    {s(T.b5exc)}
                  </text>
                )}
              </>
            );
          }}
        </Walkthrough>
      </Sec>

      <Sec n="8.6" t={s(T.s6)}>
        <Table
          head={[s(T.t6h1), s(T.t6h2), s(T.t6h3)]}
          rows={[
            [<code key="a">REQUIRED</code>, s(T.t6r1a), s(T.t6r1b)],
            [<code key="b">REQUIRES_NEW</code>, s(T.t6r2a), s(T.t6r1b)],
            [<code key="c">SUPPORTS</code>, s(T.t6r3a), s(T.t6r3b)],
            [<code key="d">MANDATORY</code>, s(T.t6r3a), s(T.t6r4b)],
            [<code key="e">NEVER</code>, s(T.t6r4b), s(T.t6r3b)],
            [<code key="f">NESTED</code>, s(T.t6r6a), s(T.t6r1b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                <code>REQUIRED</code> là mặc định. <code>REQUIRES_NEW</code> hữu ích cho ghi log kiểm toán:
                transaction chính rollback thì bản ghi log vẫn còn.
              </>
            }
            en={
              <>
                <code>REQUIRED</code> is the default. <code>REQUIRES_NEW</code> is useful for audit logging: the
                main transaction can roll back and the log row survives.
              </>
            }
          />
        </P>
        <Trap>
          <Tr
            vi={
              <p>
                <code>@Transactional</code> <strong>mặc định chỉ rollback với unchecked exception</strong>. Ném
                một checked exception thì transaction vẫn commit. Muốn khác thì phải khai{" "}
                <code>@Transactional(rollbackFor = Exception.class)</code>. Đây là lý do exception nghiệp vụ
                trong Spring gần như luôn nên kế thừa <code>RuntimeException</code>.
              </p>
            }
            en={
              <p>
                <code>@Transactional</code> <strong>rolls back on unchecked exceptions only, by default</strong>.
                Throw a checked exception and the transaction still commits. To change that you must declare{" "}
                <code>@Transactional(rollbackFor = Exception.class)</code>. This is why business exceptions in
                Spring should nearly always extend <code>RuntimeException</code>.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="8.7" t={s(T.s7)}>
        <P>
          <Tr
            vi={
              <>
                <code>@SpringBootApplication</code> gộp ba annotation: <code>@SpringBootConfiguration</code>,{" "}
                <code>@ComponentScan</code>, và <code>@EnableAutoConfiguration</code>.
              </>
            }
            en={
              <>
                <code>@SpringBootApplication</code> bundles three annotations:{" "}
                <code>@SpringBootConfiguration</code>, <code>@ComponentScan</code> and{" "}
                <code>@EnableAutoConfiguration</code>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Cái thứ ba đọc file <code>META-INF/spring/…AutoConfiguration.imports</code> trong mọi jar trên
                classpath, lấy ra danh sách lớp cấu hình ứng viên, rồi lọc bằng các annotation điều kiện:{" "}
                <code>@ConditionalOnClass</code>, <code>@ConditionalOnMissingBean</code>,{" "}
                <code>@ConditionalOnProperty</code>.
              </>
            }
            en={
              <>
                The third one reads <code>META-INF/spring/…AutoConfiguration.imports</code> from every jar on
                the classpath, collects the candidate configuration classes, then filters them with the
                conditional annotations: <code>@ConditionalOnClass</code>,{" "}
                <code>@ConditionalOnMissingBean</code>, <code>@ConditionalOnProperty</code>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Nên "Boot tự cấu hình" thực chất nghĩa là: <em>thấy thư viện nào trên classpath thì bật cấu hình
                mặc định cho nó, trừ khi bạn đã tự khai bean đó</em>. Chính <code>@ConditionalOnMissingBean</code>{" "}
                là lý do bạn ghi đè được — khai <code>SecurityFilterChain</code> của riêng mình thì cấu hình mặc
                định tự rút lui.
              </>
            }
            en={
              <>
                So "Boot configures itself" really means: <em>whatever library it finds on the classpath, it
                switches on a default configuration for it, unless you already declared that bean</em>.{" "}
                <code>@ConditionalOnMissingBean</code> is precisely why you can override — declare your own{" "}
                <code>SecurityFilterChain</code> and the default configuration steps aside.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="8.8" t={s(T.s8)}>
        <P>
          <Tr
            vi={
              <>
                Khi một interface có hai hiện thực, Spring không biết tiêm cái nào và ném{" "}
                <code>NoUniqueBeanDefinitionException</code> ngay lúc khởi động — không phải lúc chạy, đó là điểm
                tốt.
              </>
            }
            en={
              <>
                When an interface has two implementations, Spring cannot tell which to inject and throws{" "}
                <code>NoUniqueBeanDefinitionException</code> at startup — not at run time, which is the good
                part.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`@Service("emailSender")
class EmailSender implements NotificationSender { }

@Service("smsSender")
class SmsSender implements NotificationSender { }

// chọn đích danh
public AlertService(@Qualifier("emailSender") NotificationSender sender) { }`}
          en={`@Service("emailSender")
class EmailSender implements NotificationSender { }

@Service("smsSender")
class SmsSender implements NotificationSender { }

// name the one you want
public AlertService(@Qualifier("emailSender") NotificationSender sender) { }`}
        />
        <P>
          <Tr
            vi={
              <>
                <code>@Primary</code> đặt trên một hiện thực để nó thành mặc định khi không ai chỉ định.{" "}
                <code>@Qualifier</code> mạnh hơn <code>@Primary</code> khi cả hai cùng có.
              </>
            }
            en={
              <>
                <code>@Primary</code> marks one implementation as the default when nobody names one.{" "}
                <code>@Qualifier</code> beats <code>@Primary</code> when both are present.
              </>
            }
          />
        </P>
      </Sec>
    </div>
  );
}
