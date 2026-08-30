import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import Race from "../labs/Race";
import { Src, Tr, say, type Tx } from "../i18n";
import { Code, CodeTr, Defs, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 06 · Đa luồng / Threads.
 *
 * The walkthrough is Schildt's `Synch` program, ch.11 pp.239–240, and it is
 * here because it is the rare race whose damage you can *read*: three threads
 * call one unsynchronised method and the book prints the result,
 * `Hello[Synchronized[World]` followed by two stray brackets. A stepped figure
 * that can show real interleaved output beats any drawing of an invisible
 * reordering.
 *
 * 6.3 takes the Car1/Car2 diagram from the J2EE Job Interview Companion, Q49,
 * which is the clearest answer to "what does synchronized actually lock" —
 * two objects, three threads, and six numbered outcomes.
 *
 * Both languages. The two quotes from Schildt stay in his English in both, for
 * the same reason the code does: a quote that has been translated is a
 * paraphrase, and the reader is meant to find these words on the printed page.
 */

const T = {
  name: { vi: "Đa luồng", en: "Threads" },
  lede: {
    vi: "Ba luồng cùng gọi một method trên cùng một object. Sách in ra kết quả rối tung, và một từ khoá duy nhất làm nó thẳng lại — đó là toàn bộ nội dung của trang này.",
    en: "Three threads call one method on one object. The book prints the mangled result, and a single keyword straightens it out — that is the whole of this page.",
  },
  source: {
    vi: "Herbert Schildt · Java: The Complete Reference, 7th ed · chương 11 · và Java/J2EE Job Interview Companion, Q49 và Q51",
    en: "Herbert Schildt · Java: The Complete Reference, 7th ed · ch.11 · and Java/J2EE Job Interview Companion, Q49 and Q51",
  },

  /* 6.1 */
  s1: { vi: "volatile làm gì, và không làm gì", en: "What volatile does, and what it does not" },
  s1lead: { vi: "Hai đảm bảo, và chỉ hai:", en: "Two guarantees, and only two:" },
  t1h1: { vi: "Đảm bảo", en: "Guarantee" },
  t1h2: { vi: "Nghĩa là", en: "Means" },
  t1r1: { vi: "Khả kiến", en: "Visibility" },
  t1r1b: {
    vi: "ghi được đẩy thẳng ra bộ nhớ chính, mọi lần đọc đều lấy từ đó — không có volatile, một luồng có thể mãi mãi đọc bản sao cũ trong cache CPU của nó",
    en: "a write goes straight to main memory and every read comes from there — without volatile a thread can read a stale copy out of its own CPU cache forever",
  },
  t1r2: { vi: "Cấm sắp xếp lại", en: "No reordering" },
  t1r2b: {
    vi: "compiler và CPU không được đảo lệnh qua điểm truy cập volatile",
    en: "the compiler and the CPU may not move instructions across a volatile access",
  },

  /* 6.2 */
  s2: { vi: "Race condition — cái lỗi mà sách in ra cho bạn thấy", en: "The race condition the book prints out for you" },
  s2src: {
    vi: 'Schildt, chương 11 — "Using Synchronized Methods", trang 239–240. Chép nguyên văn, kể cả kết quả in ra rối tung.',
    en: 'Schildt, ch.11 — "Using Synchronized Methods", pp.239–240. Verbatim, mangled output included.',
  },
  s2src2: {
    vi: 'Schildt, chương 11 — "The synchronized Statement", trang 241.',
    en: 'Schildt, ch.11 — "The synchronized Statement", p.241.',
  },
  fig2aria: {
    vi: "Ba luồng cùng gọi một method chưa được đồng bộ trên một object, và ba dòng in ra trộn vào nhau",
    en: "Three threads call one unsynchronised method on one object, and their three printed lines interleave",
  },
  k2a: { vi: "luồng 1 · Hello", en: "thread 1 · Hello" },
  k2b: { vi: "luồng 2 và 3 chen vào", en: "threads 2 and 3 cut in" },
  k2c: { vi: "kết quả hỏng", en: "the broken result" },
  k2d: { vi: "sau khi thêm synchronized", en: "after adding synchronized" },
  d2threads: { vi: "BA LUỒNG", en: "THREE THREADS" },
  d2wait: { vi: "chờ", en: "waiting" },
  d2one: { vi: "một luồng một lúc", en: "one thread at a time" },
  d2nolock: { vi: "không khoá gì cả", en: "nothing is locked" },
  d2single: { vi: "một object duy nhất", en: "one single object" },
  d2out: { vi: "MÀN HÌNH IN RA", en: "WHAT IS PRINTED" },
  d2idle: { vi: "chưa luồng nào chạy", en: "no thread has run yet" },
  d2bad: {
    vi: "race condition — ba luồng đua nhau vào cùng một method",
    en: "race condition — three threads racing into one method",
  },
  d2fix: {
    vi: "synchronized void call(String msg) — thêm đúng một từ khoá",
    en: "synchronized void call(String msg) — exactly one keyword added",
  },
  d2n0: {
    vi: "một Callme, ba Caller — cùng object là điều kiện cần của race",
    en: "one Callme, three Callers — the shared object is what makes a race possible",
  },
  d2n1: {
    vi: "sleep() nhả CPU giữa chừng, khi dòng in còn dang dở",
    en: "sleep() gives up the CPU mid-way, with the line half printed",
  },

  /* 6.3 */
  s3: { vi: "synchronized khoá cái gì", en: "What synchronized actually locks" },
  t3h1: { vi: "Viết", en: "You write" },
  t3h2: { vi: "Khoá lên", en: "It locks" },
  t3r1: { vi: "method instance có synchronized", en: "a synchronized instance method" },
  t3r2: { vi: "method static có synchronized", en: "a synchronized static method" },
  t4h1: { vi: "Luồng gọi", en: "The calling thread" },
  t4h2: { vi: "Có vào được không", en: "Does it get in" },
  t4h3: { vi: "Vì sao", en: "Why" },
  t4r1b: { vi: "được", en: "yes" },
  t4r1c: { vi: "method1 của car1 đang rảnh", en: "car1's method1 is free" },
  t4r2b: { vi: "KHÔNG", en: "NO" },
  t4r2c: { vi: "cùng một monitor — monitor của car1", en: "same monitor — car1's monitor" },
  t4r3b: { vi: "được", en: "yes" },
  t4r3c: { vi: "khác object thì khác monitor", en: "a different object is a different monitor" },
  t4r4b: { vi: "luôn được", en: "always" },
  t4r4c: { vi: "method3 không synchronized", en: "method3 is not synchronized" },
  s3src: {
    vi: 'Java/J2EE Job Interview Companion, Q49 — "If 2 different threads hit 2 different synchronized methods in an object at the same time will they both continue?", trang 61.',
    en: 'Java/J2EE Job Interview Companion, Q49 — "If 2 different threads hit 2 different synchronized methods in an object at the same time will they both continue?", p.61.',
  },

  /* 6.4 – 6.6 */
  s4: { vi: "ConcurrentHashMap", en: "ConcurrentHashMap" },
  s5: { vi: "Deadlock", en: "Deadlock" },
  s6: { vi: "Virtual threads — vì sao Java 21 đáng nói", en: "Virtual threads — why Java 21 is worth mentioning" },
} satisfies Record<string, Tx>;

function synchSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "một Callme, ba Caller", note: "Sách tạo ĐÚNG MỘT object Callme rồi đưa nó cho cả ba Caller. Ba luồng, một object dùng chung — đây là điều kiện cần của mọi race condition." },
        { label: "Hello in dấu [", note: 'Luồng 1 vào call(), in "[Hello" rồi gọi Thread.sleep(1000). Nó đang giữ nửa chừng một dòng chưa in xong.' },
        { label: "ngủ → nhường CPU", note: "sleep() cho luồng khác chạy. Không có gì ngăn luồng 2 bước vào cùng method đó, trên cùng object đó." },
        { label: "hai luồng nữa chen vào", note: 'Luồng 2 in "[Synchronized", luồng 3 in "[World". Ba dòng của ba luồng trộn vào nhau ngay trên màn hình.' },
        { label: "kết quả rối", note: "Sách in đúng thế này: Hello[Synchronized[World] rồi hai dấu ] lạc lõng ở hai dòng sau. Schildt gọi tên nó: race condition." },
        { label: "thêm synchronized", note: "Chỉ thêm một từ khoá vào trước call(). Monitor của object Callme cho vào từng luồng một, và ba dòng ra đúng thứ tự, đủ cặp ngoặc." },
      ]
    : [
        { label: "one Callme, three Callers", note: "The book creates EXACTLY ONE Callme object and hands it to all three Callers. Three threads, one shared object — the precondition of every race condition." },
        { label: "Hello prints its [", note: 'Thread 1 enters call(), prints "[Hello" and calls Thread.sleep(1000). It is holding a half-finished line.' },
        { label: "asleep → CPU released", note: "sleep() lets another thread run. Nothing stops thread 2 walking into the same method, on the same object." },
        { label: "two more cut in", note: 'Thread 2 prints "[Synchronized", thread 3 prints "[World". Three threads\' lines interleave right there on the screen.' },
        { label: "the mangled result", note: "This is exactly what the book prints: Hello[Synchronized[World] then two stray ] on the following lines. Schildt names it: race condition." },
        { label: "add synchronized", note: "One keyword in front of call(). The Callme object's monitor admits one thread at a time, and the three lines come out in order with their brackets paired." },
      ];
}

export default function Concurrency({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="06" name={s(T.name)} lede={s(T.lede)} source={s(T.source)} />

      <Sec n="6.1" t={s(T.s1)}>
        <P>{s(T.s1lead)}</P>
        <Table
          head={[s(T.t1h1), s(T.t1h2)]}
          rows={[
            [s(T.t1r1), s(T.t1r1b)],
            [s(T.t1r2), s(T.t1r2b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                <strong>Không</strong> đảm bảo tính nguyên tử. <code>count++</code> trên biến{" "}
                <code>volatile</code> vẫn hỏng, vì nó gồm ba bước đọc–cộng–ghi. Muốn nguyên tử thì dùng{" "}
                <code>AtomicInteger</code>.
              </>
            }
            en={
              <>
                It does <strong>not</strong> guarantee atomicity. <code>count++</code> on a{" "}
                <code>volatile</code> field is still broken, because it is three steps — read, add, write. For
                atomicity use <code>AtomicInteger</code>.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="6.2" t={s(T.s2)}>
        <P>
          <Tr
            vi={
              <>
                Ba luồng, một object. Method <code>call()</code> in dấu <code>[</code>, in nội dung, ngủ một
                giây, rồi mới in dấu <code>]</code> — và chính giây ngủ đó làm cho lỗi hiện ra{" "}
                <em>mỗi lần chạy</em> thay vì thi thoảng.
              </>
            }
            en={
              <>
                Three threads, one object. <code>call()</code> prints a <code>[</code>, prints the message,
                sleeps for a second, and only then prints the <code>]</code> — and that one second is what makes
                the bug appear <em>on every run</em> rather than occasionally.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// This program is not synchronized.
class Callme {
  void call(String msg) {
    System.out.print("[" + msg);
    try {
      Thread.sleep(1000);
    } catch(InterruptedException e) {
      System.out.println("Interrupted");
    }
    System.out.println("]");
  }
}

class Caller implements Runnable {
  String msg;
  Callme target;
  Thread t;

  public Caller(Callme targ, String s) {
    target = targ;
    msg = s;
    t = new Thread(this);
    t.start();
  }

  public void run() {
    target.call(msg);
  }
}

class Synch {
  public static void main(String args[]) {
    Callme target = new Callme();          // MỘT object duy nhất
    Caller ob1 = new Caller(target, "Hello");
    Caller ob2 = new Caller(target, "Synchronized");
    Caller ob3 = new Caller(target, "World");
    try { ob1.t.join(); ob2.t.join(); ob3.t.join(); }
    catch(InterruptedException e) { System.out.println("Interrupted"); }
  }
}`}
          en={`// This program is not synchronized.
class Callme {
  void call(String msg) {
    System.out.print("[" + msg);
    try {
      Thread.sleep(1000);
    } catch(InterruptedException e) {
      System.out.println("Interrupted");
    }
    System.out.println("]");
  }
}

class Caller implements Runnable {
  String msg;
  Callme target;
  Thread t;

  public Caller(Callme targ, String s) {
    target = targ;
    msg = s;
    t = new Thread(this);
    t.start();
  }

  public void run() {
    target.call(msg);
  }
}

class Synch {
  public static void main(String args[]) {
    Callme target = new Callme();          // ONE single object
    Caller ob1 = new Caller(target, "Hello");
    Caller ob2 = new Caller(target, "Synchronized");
    Caller ob3 = new Caller(target, "World");
    try { ob1.t.join(); ob2.t.join(); ob3.t.join(); }
    catch(InterruptedException e) { System.out.println("Interrupted"); }
  }
}`}
        />
        <Src vi={T.s2src.vi} en={T.s2src.en} />

        <Walkthrough
          viewBox="0 0 720 264"
          aria={s(T.fig2aria)}
          hold={2200}
          steps={synchSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 6.2" : "Figure 6.2"}</span>
              <Tr
                vi={
                  <>
                    Đây là lý do <code>sleep()</code> nằm trong ví dụ của sách: nó biến một lỗi thi thoảng mới
                    thấy thành một lỗi <strong>lần nào chạy cũng thấy</strong>.
                  </>
                }
                en={
                  <>
                    This is why <code>sleep()</code> is in the book's example: it turns a bug you see now and
                    then into a bug you see <strong>on every single run</strong>.
                  </>
                }
              />
              <Key
                items={[
                  { c: "info", t: s(T.k2a) },
                  { c: "warn", t: s(T.k2b) },
                  { c: "bad", t: s(T.k2c) },
                  { c: "ok", t: s(T.k2d) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const fixed = i === 5;
            const msgs = ["Hello", "Synchronized", "World"];
            const inside = fixed ? 0 : i >= 3 ? 3 : i >= 1 ? 1 : 0;
            const bad = i >= 3 && !fixed;
            return (
              <>
                {/* the three threads */}
                <text x="16" y="24" className="d-s">{s(T.d2threads)}</text>
                {msgs.map((m, k) => {
                  const on = k < inside;
                  const role = fixed ? (k === 0 ? "ok" : undefined) : k === 0 ? "info" : on ? "warn" : undefined;
                  return (
                    <g key={m} data-c={role}>
                      <rect x={16} y={40 + k * 56} width={168} height={40} className={on || (fixed && k === 0) ? "d-box-fill" : "d-box"} />
                      <Ic n="cpu" x={28} y={50 + k * 56} s={14} c={role} />
                      <text x={52} y={64 + k * 56} className="d-m">{m}</text>
                      {fixed && k > 0 && (
                        <text x={150} y={64 + k * 56} className="d-s" textAnchor="end">{s(T.d2wait)}</text>
                      )}
                    </g>
                  );
                })}

                {/* the one shared object */}
                <g data-c={fixed ? "ok" : bad ? "bad" : "info"}>
                  <rect x={248} y={56} width={168} height={120} className="d-box-fill" />
                  <Ic n={fixed ? "lock" : "unlock"} x={264} y={70} s={18} c={fixed ? "ok" : bad ? "bad" : "info"} />
                  <text x={294} y={84} className="d-b">Callme</text>
                  <text x={264} y={112} className="d-m">{fixed ? "synchronized" : "call(String)"}</text>
                  <text x={264} y={136} className="d-s">{fixed ? s(T.d2one) : s(T.d2nolock)}</text>
                  <text x={264} y={160} className="d-s">{s(T.d2single)}</text>
                </g>

                {[0, 1, 2].map((k) => {
                  const on = fixed ? k === 0 : k < inside;
                  return (
                    <line
                      key={k}
                      x1={184}
                      y1={60 + k * 56}
                      x2={240}
                      y2={100 + k * 12}
                      className={on ? "d-l" : "d-l-q"}
                      markerEnd={on ? (fixed ? "url(#pa-ok)" : k === 0 ? "url(#pa-info)" : "url(#pa-warn)") : "url(#pa)"}
                      data-c={on ? (fixed ? "ok" : k === 0 ? "info" : "warn") : undefined}
                    />
                  );
                })}

                {/* printed output */}
                <text x="448" y="24" className="d-s">{s(T.d2out)}</text>
                <rect x="448" y="40" width="256" height="152" className="d-box" />
                {(fixed
                  ? ["[Hello]", "[Synchronized]", "[World]"]
                  : i === 0
                    ? []
                    : i <= 2
                      ? ["[Hello"]
                      : ["Hello[Synchronized[World]", "]", "]"]
                ).map((line, k) => (
                  <text key={k} x="464" y={72 + k * 32} className="d-m" data-enter="" data-c={fixed ? "ok" : bad ? "bad" : undefined}>
                    {line}
                  </text>
                ))}
                {i === 0 && <text x="464" y="72" className="d-s">{s(T.d2idle)}</text>}

                {bad && (
                  <g data-enter="" data-c="bad">
                    <Ic n="alert" x={16} y={224} s={15} c="bad" />
                    <text x="38" y="236" className="d-m">{s(T.d2bad)}</text>
                  </g>
                )}
                {fixed && (
                  <g data-enter="" data-c="ok">
                    <Ic n="check" x={16} y={224} s={15} c="ok" />
                    <text x="38" y="236" className="d-m">{s(T.d2fix)}</text>
                  </g>
                )}
                {!bad && !fixed && (
                  <text x="16" y="236" className="d-s">
                    {i === 0 ? s(T.d2n0) : s(T.d2n1)}
                  </text>
                )}
              </>
            );
          }}
        </Walkthrough>

        <P>
          <Tr
            vi={
              <>
                Câu quan trọng nhất trong cả mục này là của Schildt:{" "}
                <em>"nothing exists to stop all three threads from calling the same method, on the same object,
                at the same time."</em> Ba điều kiện đó — cùng method, cùng object, cùng lúc — là định nghĩa đủ
                của một race condition.
              </>
            }
            en={
              <>
                The most important sentence in this whole section is Schildt's:{" "}
                <em>"nothing exists to stop all three threads from calling the same method, on the same object,
                at the same time."</em> Those three conditions — same method, same object, same time — are a
                complete definition of a race condition.
              </>
            }
          />
        </P>
        <Trap>
          <Tr
            vi={
              <p>
                Ví dụ này dùng <code>sleep()</code> để lỗi hiện ra chắc chắn. Sách nói thẳng chỗ đó:{" "}
                <em>"in most situations, a race condition is more subtle and less predictable… This can cause a
                program to run right one time and wrong the next."</em> Đó mới là hình dạng thật của loại lỗi
                này.
              </p>
            }
            en={
              <p>
                This example uses <code>sleep()</code> so the bug is guaranteed to show. The book says so
                itself: <em>"in most situations, a race condition is more subtle and less predictable… This can
                cause a program to run right one time and wrong the next."</em> That is the real shape of this
                class of bug.
              </p>
            }
          />
        </Trap>

        {/* Placed right under that quote, because it is the demonstration of it.
            The walkthrough above shows one interleaving; this one lets the reader
            hunt for a schedule that comes out clean, and find that the program
            "runs right one time and wrong the next" exactly as the book says. */}
        <Race lang={lang} />

        <P>
          <Tr
            vi={
              <>
                Cách sửa thứ hai, khi <strong>không sửa được class</strong> — ví dụ nó nằm trong thư viện của
                người khác — là bọc lời gọi bằng khối <code>synchronized</code>:
              </>
            }
            en={
              <>
                The second fix, for when <strong>you cannot edit the class</strong> — it lives in somebody
                else's library — is to wrap the call in a <code>synchronized</code> block:
              </>
            }
          />
        </P>
        <Code>{`public void run() {
  synchronized(target) {      // synchronized block
    target.call(msg);
  }
}`}</Code>
        <Src vi={T.s2src2.vi} en={T.s2src2.en} />
      </Sec>

      <Sec n="6.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Khoá một <strong>monitor gắn với một object cụ thể</strong>, không phải khoá đoạn code.
              </>
            }
            en={
              <>
                It locks <strong>a monitor belonging to one specific object</strong>, not a stretch of code.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t3h1), s(T.t3h2)]}
          rows={[
            [s(T.t3r1), <code key="a">this</code>],
            [
              s(T.t3r2),
              <Tr key="b" vi={<>object <code>Class</code></>} en={<>the <code>Class</code> object</>} />,
            ],
            [
              <code key="c">synchronized (obj)</code>,
              <Tr key="d" vi={<>đúng <code>obj</code> đó</>} en={<>that exact <code>obj</code></>} />,
            ],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Quyển J2EE Job Interview Companion hỏi thẳng câu này ở Q49, và trả lời bằng một hình: hai object{" "}
                <code>Car1</code> và <code>Car2</code>, mỗi cái có <code>method1()</code> và{" "}
                <code>method2()</code> đều <code>synchronized</code>, còn <code>method3()</code> thì không.
              </>
            }
            en={
              <>
                The J2EE Job Interview Companion asks this outright in Q49 and answers with a diagram: two
                objects, <code>Car1</code> and <code>Car2</code>, each with <code>method1()</code> and{" "}
                <code>method2()</code> declared <code>synchronized</code>, and a <code>method3()</code> that is
                not.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t4h1), s(T.t4h2), s(T.t4h3)]}
          rows={[
            [<code key="a">car1.method1()</code>, s(T.t4r1b), s(T.t4r1c)],
            [
              <Tr
                key="b"
                vi={<><code>car1.method2()</code> khi method1 của car1 đang chạy</>}
                en={<><code>car1.method2()</code> while car1's method1 is running</>}
              />,
              s(T.t4r2b),
              s(T.t4r2c),
            ],
            [
              <Tr
                key="c"
                vi={<><code>car2.method1()</code> khi car1.method1() đang chạy</>}
                en={<><code>car2.method1()</code> while car1.method1() is running</>}
              />,
              s(T.t4r3b),
              s(T.t4r3c),
            ],
            [<code key="d">car1.method3()</code>, s(T.t4r4b), s(T.t4r4c)],
          ]}
        />
        <Src vi={T.s3src.vi} en={T.s3src.en} />
        <Trap>
          <Tr
            vi={
              <p>
                Hàng thứ ba là chỗ nhiều người trả lời sai. Hai luồng gọi cùng một method{" "}
                <code>synchronized</code> trên <strong>hai instance khác nhau</strong> thì{" "}
                <em>không chặn nhau chút nào</em>, vì đó là hai monitor khác nhau. Câu trả lời gọn của sách:{" "}
                <em>"Only one method can acquire the lock"</em> — và cái khoá đó thuộc về <em>object</em>, không
                thuộc về method.
              </p>
            }
            en={
              <p>
                The third row is where most answers go wrong. Two threads calling the same{" "}
                <code>synchronized</code> method on <strong>two different instances</strong>{" "}
                <em>do not block each other at all</em>, because those are two different monitors. The book's
                short answer: <em>"Only one method can acquire the lock"</em> — and that lock belongs to the{" "}
                <em>object</em>, not to the method.
              </p>
            }
          />
        </Trap>
        <P>
          <Tr
            vi={
              <>
                Hàng thứ tư cũng đáng nhớ: <code>method3()</code> không <code>synchronized</code> nên{" "}
                <strong>luôn vào được</strong>, kể cả khi hai method kia đang bị khoá. Một method quên từ khoá là
                một cửa sau mở toang vào cùng khối dữ liệu.
              </>
            }
            en={
              <>
                The fourth row is worth remembering too: <code>method3()</code> is not <code>synchronized</code>,
                so it <strong>always gets in</strong>, even while the other two are locked. One method missing
                the keyword is a back door standing open onto the same data.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Khoá có tính <strong>reentrant</strong>: luồng đang giữ khoá gọi tiếp method{" "}
                <code>synchronized</code> khác của cùng object thì vào được, không tự chặn mình.
              </>
            }
            en={
              <>
                The lock is <strong>reentrant</strong>: a thread already holding it may call another{" "}
                <code>synchronized</code> method on the same object and walk straight in, rather than blocking
                against itself.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="6.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                <code>HashMap</code> không an toàn khi nhiều luồng ghi — có thể mất dữ liệu, và ở Java 7 còn có
                thể tạo vòng lặp vô hạn lúc resize.
              </>
            }
            en={
              <>
                <code>HashMap</code> is not safe under concurrent writes — entries can be lost, and on Java 7 a
                resize could even produce an infinite loop.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <code>ConcurrentHashMap</code> từ Java 8 khoá theo <strong>từng bucket</strong>: CAS cho bucket
                rỗng, <code>synchronized</code> trên node đầu khi có va chạm. Đọc thì{" "}
                <strong>hoàn toàn không khoá</strong>, nhờ các trường <code>volatile</code>.
              </>
            }
            en={
              <>
                Since Java 8 <code>ConcurrentHashMap</code> locks <strong>per bucket</strong>: CAS for an empty
                bucket, <code>synchronized</code> on the head node when there is a collision. Reads take{" "}
                <strong>no lock at all</strong>, thanks to <code>volatile</code> fields.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Trong hệ thống thật của tôi, hai filter rate limit dùng <code>ConcurrentHashMap</code> để giữ cửa
                sổ đếm — nhiều request tới cùng lúc là chuyện bình thường, và một <code>HashMap</code> ở đó sẽ
                hỏng dưới tải.
              </>
            }
            en={
              <>
                In the system I actually run, two rate-limit filters hold their counting windows in a{" "}
                <code>ConcurrentHashMap</code> — simultaneous requests are the normal case there, and a{" "}
                <code>HashMap</code> in that spot would break under load.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="6.5" t={s(T.s5)}>
        <P>
          <Tr
            vi={
              <>
                Cần đủ bốn điều kiện Coffman cùng lúc: loại trừ lẫn nhau, giữ và chờ, không thể tước đoạt, và chờ
                vòng tròn. <strong>Phá được một là hết deadlock.</strong>
              </>
            }
            en={
              <>
                All four Coffman conditions must hold at once: mutual exclusion, hold and wait, no preemption,
                and circular wait. <strong>Break any one of them and the deadlock is gone.</strong>
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Cách thực tế nhất là phá <em>chờ vòng tròn</em>: quy định một thứ tự khoá toàn cục và mọi nơi đều
                lấy khoá theo đúng thứ tự đó. Ngoài ra: dùng <code>tryLock</code> có timeout thay cho{" "}
                <code>synchronized</code>, và giữ khoá càng ngắn càng tốt.
              </>
            }
            en={
              <>
                The practical one to break is <em>circular wait</em>: fix a global lock ordering and have every
                site acquire in that order. Beyond that: use <code>tryLock</code> with a timeout instead of{" "}
                <code>synchronized</code>, and hold locks for as short a stretch as possible.
              </>
            }
          />
        </P>
        <Limit>
          <Tr
            vi={
              <>
                Bộ đếm rate limit của tôi nằm trong bộ nhớ tiến trình. Chạy hai instance sau cân bằng tải thì mỗi
                bên đếm riêng và giới hạn thật thành gấp đôi. Đây là đánh đổi có ý thức cho một VPS, không phải
                thiếu sót — nhưng nó là thiếu sót ngay khi có instance thứ hai.
              </>
            }
            en={
              <>
                My rate-limit counters live in process memory. Run two instances behind a load balancer and each
                counts on its own, so the real limit doubles. That is a deliberate trade for a single VPS, not
                an oversight — but it becomes one the moment a second instance exists.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="6.6" t={s(T.s6)}>
        <P>
          <Tr
            vi={
              <>
                Thread hệ điều hành nặng: mỗi cái tốn khoảng một megabyte stack, và chuyển ngữ cảnh phải đi qua
                nhân. Một web server vì thế phải dùng pool vài trăm thread, và khi tất cả đều đang{" "}
                <em>chờ I/O</em> thì máy rảnh mà server vẫn từ chối request.
              </>
            }
            en={
              <>
                An OS thread is expensive: about a megabyte of stack each, and every context switch goes through
                the kernel. So a web server runs a pool of a few hundred, and when all of them are{" "}
                <em>waiting on I/O</em> the machine sits idle while the server turns requests away.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <strong>Virtual thread</strong> do JVM quản lý, không ánh xạ một-một sang thread hệ điều hành.
                Khi nó chặn ở I/O, JVM tháo nó ra khỏi thread thật và cho thread thật chạy việc khác. Viết code
                kiểu blocking bình thường mà chịu được hàng trăm nghìn tác vụ đồng thời — không cần lập trình bất
                đồng bộ.
              </>
            }
            en={
              <>
                A <strong>virtual thread</strong> is managed by the JVM and does not map one-to-one onto an OS
                thread. When it blocks on I/O the JVM unmounts it and puts the real thread on other work. You
                write ordinary blocking code and carry hundreds of thousands of concurrent tasks — with no async
                programming at all.
              </>
            }
          />
        </P>
        <Trap>
          <Tr
            vi={
              <p>
                Virtual thread <strong>không giúp gì</strong> cho tác vụ nặng CPU — số lõi vẫn là số lõi. Nó chỉ
                thắng ở tác vụ chờ I/O, mà web server thì gần như toàn là loại đó.
              </p>
            }
            en={
              <p>
                Virtual threads do <strong>nothing</strong> for CPU-bound work — the core count is still the
                core count. They win on I/O-bound work, which is nearly all of what a web server does.
              </p>
            }
          />
        </Trap>
      </Sec>
    </div>
  );
}
