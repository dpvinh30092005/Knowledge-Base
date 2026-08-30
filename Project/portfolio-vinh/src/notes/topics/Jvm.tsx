import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Tr, say, type Tx } from "../i18n";
import { Code, Defs, Fig, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 01 · JVM & bộ nhớ / JVM & memory.
 *
 * The GC walkthrough is the one figure on this page that could not have been a
 * paragraph: object promotion is a movement between three spaces over time, and
 * every still drawing of it has to pick one moment and lose the rest.
 */

const T = {
  name: { vi: "JVM & bộ nhớ", en: "JVM & memory" },
  lede: {
    vi: "Câu hỏi mở đầu của gần như mọi buổi phỏng vấn Java, và cũng là chỗ dễ trả lời thuộc lòng nhất. Ba hình dưới đây vẽ những thứ không nhìn thấy được trong mã nguồn.",
    en: "The opening question of almost every Java interview, and the easiest place to answer from memory. The three figures below draw what the source code cannot show.",
  },
  source: {
    vi: "Java 21 · HotSpot · G1 là GC mặc định từ Java 9",
    en: "Java 21 · HotSpot · G1 has been the default GC since Java 9",
  },

  /* 1.1 */
  s1: { vi: "JDK, JRE, JVM", en: "JDK, JRE, JVM" },

  /* 1.2 */
  s2: { vi: "Write once, run anywhere — nhờ đâu", en: "Write once, run anywhere — by what means" },
  fig2aria: {
    vi: "Mã nguồn Java biên dịch thành bytecode độc lập nền tảng, rồi được JVM thông dịch và JIT dịch sang mã máy",
    en: "Java source compiles to platform-independent bytecode, which the JVM interprets and the JIT compiles to machine code",
  },
  b2a: { vi: "mã nguồn", en: "source" },
  b2b: { vi: "trình biên dịch", en: "compiler" },
  b2c: { vi: "bytecode", en: "bytecode" },
  b2d: { vi: "thông dịch", en: "interpreter" },
  b2e: { vi: "mã máy", en: "machine code" },
  d2any: { vi: "file này chạy được trên mọi hệ điều hành", en: "this file runs on every operating system" },
  d2any2: { vi: "Windows · Linux · macOS — miễn là có JVM", en: "Windows · Linux · macOS — wherever there is a JVM" },
  d2interp: { vi: "khởi động nhanh, chạy chậm", en: "fast to start, slow to run" },
  d2jit: { vi: "chỉ dịch đoạn chạy nhiều", en: "only the hot code gets compiled" },
  d2jit2: { vi: "đó là lý do Java \"nóng máy\" rồi mới nhanh", en: "which is why Java gets fast only after it warms up" },

  /* 1.3 */
  s3: { vi: "Các vùng bộ nhớ", en: "The memory areas" },
  fig3aria: {
    vi: "Mỗi thread có stack riêng chứa tham chiếu; object nằm chung trên heap; metaspace ở native memory",
    en: "Each thread has its own stack holding references; objects live together on the heap; metaspace sits in native memory",
  },
  d3per: { vi: "MỖI THREAD MỘT CÁI", en: "ONE PER THREAD" },
  d3sa: { vi: "Stack · thread A", en: "Stack · thread A" },
  d3frame: { vi: "frame của lời gọi hàm", en: "one frame per method call" },
  d3sb: { vi: "Stack · thread B", en: "Stack · thread B" },
  d3sep: { vi: "tách biệt hoàn toàn", en: "completely separate" },
  d3shared: { vi: "DÙNG CHUNG TOÀN JVM", en: "SHARED ACROSS THE JVM" },
  d3heap: { vi: "Heap — mọi object, GC dọn ở đây", en: "Heap — every object; this is where GC works" },
  d3pool: { vi: "String pool — trong heap từ Java 7", en: "String pool — inside the heap since Java 7" },
  d3meta: { vi: "metadata của class", en: "class metadata" },
  d3meta2: { vi: "nằm ở native memory", en: "lives in native memory" },
  d3pc: { vi: "PC register · native stack", en: "PC register · native stack" },
  d3pc2: { vi: "mỗi thread một cái", en: "one per thread" },
  d3xmx1: { vi: "Metaspace KHÔNG bị", en: "Metaspace is NOT bounded" },
  d3xmx2: { vi: "giới hạn bởi -Xmx", en: "by -Xmx" },

  /* 1.4 */
  s4: { vi: "Garbage collector — dọn theo thế hệ", en: "The garbage collector — collecting by generation" },
  fig4aria: {
    vi: "Object sinh ra ở Eden, sống sót chuyển sang Survivor, và sau vài vòng được thăng lên Old generation",
    en: "Objects are born in Eden, survivors move to Survivor space, and after a few cycles are promoted to the old generation",
  },
  d4young: { vi: "YOUNG GENERATION", en: "YOUNG GENERATION" },
  d4old: { vi: "OLD GENERATION", en: "OLD GENERATION" },
  d4promote: { vi: "thăng lên sau đủ số vòng", en: "promoted after enough cycles" },
  d4minor: { vi: "Minor GC — nhanh", en: "Minor GC — fast" },
  d4major: { vi: "Major GC — chậm", en: "Major GC — slow" },
  d4full: { vi: "Eden đầy", en: "Eden is full" },
  d4run: { vi: "đang chạy", en: "running" },
  d4minor2: {
    vi: "chỉ quét Young, chép cái còn sống sang Survivor, phần còn lại biến mất không tốn công",
    en: "scans only Young, copies the survivors into Survivor space, and the rest vanish for free",
  },
  d4major2: {
    vi: "phải quét cả Old generation — đây là nguồn gốc của những lần dừng dài",
    en: "must scan the old generation too — this is where the long pauses come from",
  },
  d4full2: { vi: "hết chỗ cấp phát → kích hoạt Minor GC", en: "no room left to allocate → a Minor GC fires" },
  d4run2: { vi: "cấp phát chỉ là dịch một con trỏ trong Eden", en: "allocation is just moving a pointer inside Eden" },
  d4foot: {
    vi: "G1 là GC mặc định từ Java 9 · Java 21 có thêm generational ZGC, dừng dưới một mili-giây",
    en: "G1 has been the default since Java 9 · Java 21 adds generational ZGC, with sub-millisecond pauses",
  },

  /* 1.5 */
  s5: { vi: "String, và hai cái bẫy đi kèm", en: "String, and the two traps that come with it" },
  t5h2: { vi: "String", en: "String" },
  t5r1: { vi: "Thay đổi được", en: "Mutable" },
  t5r1a: { vi: "không", en: "no" },
  t5r1b: { vi: "có", en: "yes" },
  t5r2: { vi: "Thread-safe", en: "Thread-safe" },
  t5r2a: { vi: "có (vì bất biến)", en: "yes (it is immutable)" },
  t5r2b: { vi: "không", en: "no" },
  t5r2c: { vi: "có (synchronized)", en: "yes (synchronized)" },
  t5r3: { vi: "Dùng khi", en: "Use when" },
  t5r3a: { vi: "mặc định", en: "the default" },
  t5r3b: { vi: "nối chuỗi trong vòng lặp", en: "concatenating in a loop" },
  t5r3c: { vi: "hầu như không cần", en: "almost never needed" },

  /* 1.6 */
  s6: { vi: "Java 21 — vì sao chọn bản này", en: "Java 21 — why this release" },
  t6h1: { vi: "Tính năng", en: "Feature" },
  t6h2: { vi: "Giải quyết gì", en: "What it solves" },
  t6r1: {
    vi: "hàng triệu tác vụ đồng thời kiểu blocking mà không cần lập trình bất đồng bộ — hợp với web server, nơi thread chủ yếu nằm chờ I/O",
    en: "millions of concurrent blocking tasks with no async programming — a fit for web servers, where threads mostly sit waiting on I/O",
  },
  t6r2a: { vi: "Pattern matching cho switch", en: "Pattern matching for switch" },
  t6r2: { vi: "bỏ được chuỗi instanceof rồi ép kiểu", en: "removes the instanceof-then-cast chain" },
  t6r3: { vi: "tách trường của record ngay trong điều kiện", en: "destructures a record inside the condition itself" },
  t6r4: {
    vi: "getFirst()/getLast() thống nhất cho List, Deque, LinkedHashSet",
    en: "one getFirst()/getLast() across List, Deque and LinkedHashSet",
  },
  t6r5: { vi: "thời gian dừng dưới một mili-giây", en: "pause times below a millisecond" },
} satisfies Record<string, Tx>;

function gcSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "cấp phát", note: "Object mới luôn sinh ra ở Eden. Cấp phát chỉ là dịch một con trỏ — đó là lý do tạo object trong Java rẻ hơn nhiều người nghĩ." },
        { label: "Eden đầy", note: "Eden hết chỗ, kích hoạt một Minor GC. Đây là lần dọn nhanh, chỉ quét Young generation." },
        { label: "Minor GC", note: "Object còn được tham chiếu chuyển sang vùng Survivor. Object không ai trỏ tới biến mất mà không tốn công gì — GC chỉ chép cái còn sống." },
        { label: "sống thêm vòng nữa", note: "Lứa mới lại lấp đầy Eden. Object sống sót lần trước tăng tuổi và đổi qua Survivor còn lại." },
        { label: "thăng lên Old", note: "Qua đủ số vòng, object được coi là sống lâu và chuyển sang Old generation." },
        { label: "Major GC", note: "Old đầy thì phải quét cả vùng này — chậm hơn hẳn, và là nguồn gốc của những lần dừng dài." },
      ]
    : [
        { label: "allocate", note: "A new object is always born in Eden. Allocation is just moving a pointer — which is why creating objects in Java is cheaper than people assume." },
        { label: "Eden fills", note: "Eden runs out of room and a Minor GC fires. This is the fast collection: it scans only the young generation." },
        { label: "Minor GC", note: "Still-referenced objects are copied into Survivor space. Objects nobody points at simply vanish at no cost — the GC only copies what is alive." },
        { label: "survive another cycle", note: "A new batch fills Eden again. Last round's survivors age by one and swap to the other Survivor space." },
        { label: "promote to Old", note: "After enough cycles, an object counts as long-lived and moves to the old generation." },
        { label: "Major GC", note: "When Old fills up, this region must be scanned too — far slower, and the origin of the long pauses." },
      ];
}

function jitSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: ".java", note: "Mã nguồn. javac không biết gì về CPU của bạn." },
        { label: "javac", note: "Biên dịch ra bytecode — tập lệnh của một máy ảo giả tưởng, giống nhau trên mọi hệ điều hành." },
        { label: ".class", note: "File này chép sang Windows, Linux hay macOS đều chạy được. Đây là thứ 'write once' thật sự nói tới." },
        { label: "thông dịch", note: "JVM chạy bytecode bằng thông dịch trước. Khởi động nhanh, chạy chậm." },
        { label: "JIT vào cuộc", note: "Đoạn nào chạy nhiều thì JIT dịch sang mã máy thật, tối ưu dựa trên hồ sơ chạy thật — inline, bỏ nhánh chết, escape analysis." },
      ]
    : [
        { label: ".java", note: "The source. javac knows nothing about your CPU." },
        { label: "javac", note: "Compiles to bytecode — the instruction set of an imaginary machine, identical on every operating system." },
        { label: ".class", note: "Copy this file to Windows, Linux or macOS and it runs. This is what 'write once' actually refers to." },
        { label: "interpret", note: "The JVM starts by interpreting the bytecode. Fast to start, slow to run." },
        { label: "the JIT steps in", note: "Whatever runs often is compiled to real machine code, optimised against an actual execution profile — inlining, dead-branch removal, escape analysis." },
      ];
}

export default function Jvm({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="01" name={s(T.name)} lede={s(T.lede)} source={s(T.source)} />

      <Sec n="1.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                <strong>JVM</strong> là máy ảo — nạp bytecode, kiểm tra, rồi thực thi. Nó là một <em>đặc tả</em>,
                có nhiều bản hiện thực: HotSpot, OpenJ9, GraalVM.
              </>
            }
            en={
              <>
                The <strong>JVM</strong> is the virtual machine — it loads bytecode, verifies it, and executes
                it. It is a <em>specification</em> with several implementations: HotSpot, OpenJ9, GraalVM.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <strong>JRE</strong> = JVM + thư viện chuẩn. Đủ để <em>chạy</em>, không đủ để biên dịch.
              </>
            }
            en={
              <>
                <strong>JRE</strong> = JVM + the standard library. Enough to <em>run</em>, not enough to
                compile.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <strong>JDK</strong> = JRE + công cụ phát triển (<code>javac</code>, <code>jar</code>,{" "}
                <code>javadoc</code>, <code>jdb</code>). Quan hệ bao hàm: JDK ⊃ JRE ⊃ JVM.
              </>
            }
            en={
              <>
                <strong>JDK</strong> = JRE + the development tools (<code>javac</code>, <code>jar</code>,{" "}
                <code>javadoc</code>, <code>jdb</code>). They nest: JDK ⊃ JRE ⊃ JVM.
              </>
            }
          />
        </P>
        <Trap>
          <Tr
            vi={
              <p>
                Từ Java 11, Oracle <strong>không phát hành JRE riêng nữa</strong>. Người ta dùng{" "}
                <code>jlink</code> để cắt một runtime tối giản chỉ chứa module cần thiết. Nói được chỗ này cho
                thấy bạn đang dùng Java hiện đại chứ không nhắc lại tài liệu Java 8.
              </p>
            }
            en={
              <p>
                Since Java 11 Oracle <strong>no longer ships a separate JRE</strong>. People use{" "}
                <code>jlink</code> to cut a minimal runtime containing only the modules they need. Saying this
                shows you are working with modern Java rather than reciting Java 8 documentation.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="1.2" t={s(T.s2)}>
        <Walkthrough
          viewBox="0 0 720 200"
          aria={s(T.fig2aria)}
          hold={1900}
          steps={jitSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 1.2" : "Figure 1.2"}</span>
              <Tr
                vi={
                  <>
                    Phần phụ thuộc nền tảng nằm ở JVM, không ở file <code>.class</code>. Chính xác hơn phải nói
                    là "compile once, run anywhere <em>there is a JVM</em>".
                  </>
                }
                en={
                  <>
                    The platform-dependent part is the JVM, not the <code>.class</code> file. Stated precisely
                    it is "compile once, run anywhere <em>there is a JVM</em>".
                  </>
                }
              />
            </>
          }
        >
          {(i) => (
            <>
              {[
                { t: "Main.java", s: s(T.b2a) },
                { t: "javac", s: s(T.b2b) },
                { t: "Main.class", s: s(T.b2c) },
                { t: "JVM", s: s(T.b2d) },
                { t: s(T.b2e), s: "JIT · C1/C2" },
              ].map((b, n) => (
                <g key={b.t}>
                  <rect
                    x={16 + n * 140}
                    y={56}
                    width={112}
                    height={56}
                    className={n === i ? "d-box-a" : n < i ? "d-box-fill" : "d-box"}
                  />
                  <text x={72 + n * 140} y={82} className={n === i ? "d-b-a" : "d-b"} textAnchor="middle" fontSize="11">
                    {b.t}
                  </text>
                  <text x={72 + n * 140} y={100} className="d-s" textAnchor="middle">
                    {b.s}
                  </text>
                  {n < 4 && (
                    <line x1={128 + n * 140} y1={84} x2={148 + n * 140} y2={84} className={n < i ? "d-l-a" : "d-l"} markerEnd={n < i ? "url(#pa-a)" : "url(#pa)"} />
                  )}
                </g>
              ))}

              {i === 2 && (
                <g data-enter="">
                  <text x="296" y="144" className="d-a">{s(T.d2any)}</text>
                  <text x="296" y="164" className="d-s">{s(T.d2any2)}</text>
                </g>
              )}
              {i === 3 && (
                <text x="436" y="144" className="d-s" data-enter="">
                  {s(T.d2interp)}
                </text>
              )}
              {i === 4 && (
                <g data-enter="">
                  <text x="436" y="144" className="d-a">{s(T.d2jit)}</text>
                  <text x="436" y="164" className="d-s">{s(T.d2jit2)}</text>
                </g>
              )}
            </>
          )}
        </Walkthrough>
      </Sec>

      <Sec n="1.3" t={s(T.s3)}>
        <Fig
          viewBox="0 0 720 264"
          aria={s(T.fig3aria)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 1.3" : "Figure 1.3"}</span>
              <Tr
                vi={
                  <>
                    Tham chiếu <code>s</code> nằm trên stack của thread, object nó trỏ tới nằm trên heap dùng
                    chung. Đó là lý do heap cần đồng bộ còn stack thì không.
                  </>
                }
                en={
                  <>
                    The reference <code>s</code> lives on the thread's stack; the object it points at lives on
                    the shared heap. That is why the heap needs synchronisation and the stack does not.
                  </>
                }
              />
            </>
          }
        >
          <text x="8" y="20" className="d-s">{s(T.d3per)}</text>
          <rect x="8" y="28" width="152" height="100" className="d-box" />
          <text x="20" y="50" className="d-b">{s(T.d3sa)}</text>
          <text x="20" y="76" className="d-m">s ──────────●</text>
          <text x="20" y="96" className="d-m">count = 3</text>
          <text x="20" y="118" className="d-s">{s(T.d3frame)}</text>

          <rect x="8" y="144" width="152" height="100" className="d-box" />
          <text x="20" y="166" className="d-b">{s(T.d3sb)}</text>
          <text x="20" y="192" className="d-m">s2 ─────────●</text>
          <text x="20" y="214" className="d-s">{s(T.d3sep)}</text>

          <text x="240" y="20" className="d-s">{s(T.d3shared)}</text>
          <rect x="240" y="28" width="248" height="216" className="d-box-a" />
          <text x="252" y="50" className="d-a">{s(T.d3heap)}</text>
          <rect x="256" y="64" width="216" height="48" className="d-box" />
          <text x="268" y="84" className="d-m">Student@1f4a</text>
          <text x="268" y="102" className="d-s">Young generation</text>
          <rect x="256" y="128" width="216" height="48" className="d-box" />
          <text x="268" y="148" className="d-m">Student@7b0c</text>
          <text x="268" y="166" className="d-s">Old generation</text>
          <rect x="256" y="192" width="216" height="36" className="d-box-q" />
          <text x="268" y="215" className="d-s">{s(T.d3pool)}</text>

          <path d="M160 72 C 200 72 210 86 236 86" className="d-l-a" markerEnd="url(#pa-a)" />
          <path d="M160 188 C 200 188 210 152 236 152" className="d-l-a" markerEnd="url(#pa-a)" />

          <rect x="520" y="28" width="192" height="88" className="d-box" />
          <text x="532" y="50" className="d-b">Metaspace</text>
          <text x="532" y="76" className="d-s">{s(T.d3meta)}</text>
          <text x="532" y="96" className="d-s">{s(T.d3meta2)}</text>

          <rect x="520" y="132" width="192" height="56" className="d-box-q" />
          <text x="532" y="154" className="d-s">{s(T.d3pc)}</text>
          <text x="532" y="174" className="d-s">{s(T.d3pc2)}</text>

          <text x="520" y="216" className="d-a">{s(T.d3xmx1)}</text>
          <text x="520" y="236" className="d-a">{s(T.d3xmx2)}</text>
        </Fig>
        <Trap>
          <Tr
            vi={
              <p>
                <strong>Metaspace thay PermGen từ Java 8</strong>, và nó nằm ở native memory chứ không phải heap
                — nên nó không bị giới hạn bởi <code>-Xmx</code>. Ai còn nói "PermGen" là đang dùng kiến thức
                Java 7.
              </p>
            }
            en={
              <p>
                <strong>Metaspace replaced PermGen in Java 8</strong>, and it lives in native memory rather than
                the heap — so <code>-Xmx</code> does not bound it. Anyone still saying "PermGen" is working from
                Java 7 knowledge.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="1.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                GC thu hồi object <strong>không còn reachable</strong> từ tập GC roots (biến trên stack của
                thread đang sống, biến static, tham chiếu JNI). Tiêu chí là <em>reachable</em>, không phải "hết
                dùng" — một object bạn không bao giờ đụng tới nữa nhưng vẫn nằm trong một <code>List</code>{" "}
                static thì GC không đụng vào. Đó chính là hình thái rò rỉ bộ nhớ trong Java.
              </>
            }
            en={
              <>
                The GC reclaims objects that are <strong>no longer reachable</strong> from the GC roots (locals
                on a live thread's stack, static fields, JNI references). The criterion is{" "}
                <em>reachability</em>, not "finished with" — an object you will never touch again but which
                still sits in a static <code>List</code> is untouchable by the GC. That is exactly what a memory
                leak looks like in Java.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Heap chia theo <strong>giả thuyết thế hệ</strong>: hầu hết object chết rất trẻ. Nên có Young
                generation (Eden + hai Survivor) và Old generation.
              </>
            }
            en={
              <>
                The heap is split on the <strong>generational hypothesis</strong>: most objects die very young.
                Hence a young generation (Eden + two Survivor spaces) and an old generation.
              </>
            }
          />
        </P>

        <Walkthrough
          viewBox="0 0 720 232"
          aria={s(T.fig4aria)}
          hold={2000}
          steps={gcSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 1.4" : "Figure 1.4"}</span>
              <Tr
                vi={
                  <>
                    GC <strong>chép cái còn sống</strong>, không xoá cái đã chết. Đó là lý do Minor GC nhanh khi
                    phần lớn object vừa chết — không có gì để chép.
                  </>
                }
                en={
                  <>
                    The GC <strong>copies what is alive</strong>; it does not erase what is dead. That is why a
                    Minor GC is fast when most objects have just died — there is nothing to copy.
                  </>
                }
              />
            </>
          }
        >
          {(i) => {
            const eden = i === 0 ? 2 : i === 1 ? 5 : i === 2 ? 0 : i === 3 ? 4 : i === 4 ? 1 : 1;
            const surv = i <= 1 ? 0 : i === 2 ? 2 : i === 3 ? 2 : i === 4 ? 1 : 1;
            const old = i <= 3 ? 1 : i === 4 ? 2 : 2;
            const dot = (x: number, y: number, k: number, cls: string) => (
              <circle key={`${x}-${k}`} cx={x + (k % 4) * 20} cy={y + Math.floor(k / 4) * 20} r="6" className={cls} data-enter="" />
            );
            return (
              <>
                <text x="24" y="24" className="d-s">{s(T.d4young)}</text>
                <rect x="24" y="32" width="192" height="88" className={i === 1 || i === 2 ? "d-box-a" : "d-box"} />
                <text x="36" y="52" className={i === 1 || i === 2 ? "d-b-a" : "d-b"}>Eden</text>
                {Array.from({ length: eden }, (_, k) => dot(40, 74, k, "d-dot"))}

                <rect x="232" y="32" width="152" height="88" className={i === 2 || i === 3 ? "d-box-a" : "d-box"} />
                <text x="244" y="52" className={i === 2 || i === 3 ? "d-b-a" : "d-b"}>Survivor</text>
                {Array.from({ length: surv }, (_, k) => dot(248, 74, k, "d-dot-a"))}

                <text x="424" y="24" className="d-s">{s(T.d4old)}</text>
                <rect x="424" y="32" width="272" height="88" className={i === 5 ? "d-box-a" : "d-box"} />
                <text x="436" y="52" className={i === 5 ? "d-b-a" : "d-b"}>Old</text>
                {Array.from({ length: old }, (_, k) => dot(440, 74, k, "d-dot"))}

                {i >= 2 && (
                  <line x1="216" y1="76" x2="228" y2="76" className="d-l-a" markerEnd="url(#pa-a)" data-enter="" />
                )}
                {i >= 4 && (
                  <line x1="384" y1="76" x2="418" y2="76" className="d-l-a" markerEnd="url(#pa-a)" data-enter="" />
                )}
                {i >= 4 && <text x="386" y="140" className="d-a" data-enter="">{s(T.d4promote)}</text>}

                <text x="24" y="168" className="d-b">
                  {i === 2 ? s(T.d4minor) : i === 5 ? s(T.d4major) : i === 1 ? s(T.d4full) : s(T.d4run)}
                </text>
                <text x="24" y="192" className="d-s">
                  {i === 2 ? s(T.d4minor2) : i === 5 ? s(T.d4major2) : i === 1 ? s(T.d4full2) : s(T.d4run2)}
                </text>
                <text x="24" y="216" className="d-s">
                  {s(T.d4foot)}
                </text>
              </>
            );
          }}
        </Walkthrough>

        <Trap>
          <Tr
            vi={
              <p>
                <code>System.gc()</code> chỉ là <strong>gợi ý</strong>, JVM có quyền phớt lờ. Và{" "}
                <code>finalize()</code> đã bị deprecated từ Java 9, xoá hẳn ở Java 18 — thay bằng{" "}
                <code>try-with-resources</code> hoặc <code>Cleaner</code>.
              </p>
            }
            en={
              <p>
                <code>System.gc()</code> is only a <strong>hint</strong>; the JVM may ignore it. And{" "}
                <code>finalize()</code> was deprecated in Java 9 and removed outright in Java 18 — use{" "}
                <code>try-with-resources</code> or <code>Cleaner</code> instead.
              </p>
            }
          />
        </Trap>
        <Limit>
          <Tr
            vi={
              <>
                Nếu vẫn <code>OutOfMemoryError</code> dù có GC thì nguyên nhân không phải GC yếu, mà là còn tham
                chiếu: cache không giới hạn, collection static giữ mãi, hoặc một truy vấn nạp quá nhiều dòng.
                Cách tìm là lấy heap dump và mở bằng Eclipse MAT hoặc VisualVM, không phải tăng{" "}
                <code>-Xmx</code>.
              </>
            }
            en={
              <>
                An <code>OutOfMemoryError</code> despite the GC is never a weak collector, it is a surviving
                reference: an unbounded cache, a static collection that holds everything, or a query loading far
                too many rows. You find it by taking a heap dump and opening it in Eclipse MAT or VisualVM — not
                by raising <code>-Xmx</code>.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="1.5" t={s(T.s5)}>
        <P>
          <Tr
            vi={
              <>
                <code>String</code> bất biến vì bốn lý do khoá lẫn nhau: cho phép dùng chung qua String pool; an
                toàn khi làm tham số nhạy cảm; cache được <code>hashCode</code> nên làm key lý tưởng cho{" "}
                <code>HashMap</code>; và mặc nhiên thread-safe.
              </>
            }
            en={
              <>
                <code>String</code> is immutable for four interlocking reasons: it can be shared through the
                String pool; it is safe as a sensitive parameter; its <code>hashCode</code> can be cached, which
                makes it an ideal <code>HashMap</code> key; and it is thread-safe for free.
              </>
            }
          />
        </P>
        <Code>{`String a = "java";
String b = "java";
String c = new String("java");

a == b                 // true  — the same object in the pool
a == c                 // false — new always creates a fresh object outside it
a.equals(c)            // true  — compares contents
c.intern() == a        // true  — intern() brings it back to the pool`}</Code>
        <Trap>
          <Tr
            vi={
              <p>
                <code>Integer a = 127, b = 127;</code> thì <code>a == b</code> là <strong>true</strong>, nhưng{" "}
                <code>Integer a = 128, b = 128;</code> thì <code>a == b</code> là <strong>false</strong>. Nguyên
                nhân: <code>Integer.valueOf</code> cache sẵn các giá trị từ <strong>−128 đến 127</strong>, ngoài
                khoảng đó tạo object mới.
              </p>
            }
            en={
              <p>
                With <code>Integer a = 127, b = 127;</code>, <code>a == b</code> is <strong>true</strong>; with{" "}
                <code>Integer a = 128, b = 128;</code> it is <strong>false</strong>. The reason:{" "}
                <code>Integer.valueOf</code> caches the values from <strong>−128 to 127</strong>, and creates a
                new object outside that range.
              </p>
            }
          />
        </Trap>
        <Table
          head={["", s(T.t5h2), "StringBuilder", "StringBuffer"]}
          rows={[
            [s(T.t5r1), s(T.t5r1a), s(T.t5r1b), s(T.t5r1b)],
            [s(T.t5r2), s(T.t5r2a), s(T.t5r2b), s(T.t5r2c)],
            [s(T.t5r3), s(T.t5r3a), s(T.t5r3b), s(T.t5r3c)],
          ]}
        />
      </Sec>

      <Sec n="1.6" t={s(T.s6)}>
        <Table
          head={[s(T.t6h1), s(T.t6h2)]}
          rows={[
            ["Virtual threads", s(T.t6r1)],
            [s(T.t6r2a), s(T.t6r2)],
            ["Record patterns", s(T.t6r3)],
            ["Sequenced collections", s(T.t6r4)],
            ["Generational ZGC", s(T.t6r5)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Đây là bản LTS. Nếu bị hỏi "sao chọn Java 21", câu trả lời ngắn gọn là: LTS nên được hỗ trợ dài,
                và virtual threads đổi hẳn cách một web server chịu tải.
              </>
            }
            en={
              <>
                It is an LTS release. Asked "why Java 21", the short answer is: LTS means long support, and
                virtual threads change how a web server carries load altogether.
              </>
            }
          />
        </P>
      </Sec>
    </div>
  );
}
