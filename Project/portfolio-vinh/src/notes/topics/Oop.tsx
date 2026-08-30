import type { Lang } from "../../content";
import { Src, Tr, say, type Tx } from "../i18n";
import { Code, CodeTr, Defs, Fig, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";
import Walkthrough from "../Walkthrough";

/**
 * 03 · OOP & SOLID.
 *
 * Every class on this page is Schildt's. `A`/`B`/`C` for dispatch, `Figure` /
 * `Rectangle` / `Triangle` for abstraction, `IntStack` / `FixedStack` /
 * `DynStack` for interfaces — all lifted from *Java: The Complete Reference*,
 * 7th ed, with the printed page under each so the sheet can be read beside the
 * open book.
 *
 * SOLID itself is NOT in that book, and none of the other three cover it
 * either. Rather than invent a domain to demonstrate the principles, each one
 * is shown on the book's own classes, and 3.4 says out loud where the
 * principles actually came from. Borrowing the classes is honest; implying the
 * book teaches SOLID would not be.
 *
 * Both languages. Schildt's own snippets keep his English comments — they are
 * quoted, and a quote that has been edited is no longer a quote. Snippets
 * written here carry comments in whichever language the reader picked.
 */

const T = {
  lede: {
    vi: "Bốn tính chất thì ai cũng đọc thuộc. Phần khó là chỉ ra được method nào thật sự chạy, và nói được cái giá phải trả khi bỏ qua từng nguyên tắc.",
    en: "Anyone can recite the four pillars. The hard part is pointing at which method actually runs, and naming the price of skipping each principle.",
  },
  source: {
    vi: "Herbert Schildt · Java: The Complete Reference, 7th ed · chương 8 và 9",
    en: "Herbert Schildt · Java: The Complete Reference, 7th ed · chapters 8 and 9",
  },

  /* 3.1 */
  s1: { vi: "Bốn tính chất", en: "The four pillars" },
  th1: { vi: "Tính chất", en: "Pillar" },
  th2: { vi: "Là gì", en: "What it is" },
  th3: { vi: "Để làm gì", en: "What it buys" },
  r1a: { vi: "Đóng gói", en: "Encapsulation" },
  r1b: { vi: "giấu trạng thái, chỉ lộ hành vi", en: "hide the state, expose only behaviour" },
  r1c: {
    vi: "để ĐỔI được phần bên trong mà không làm vỡ người dùng lớp đó — không phải để bảo mật",
    en: "so the inside can CHANGE without breaking its callers — not for security",
  },
  r2a: { vi: "Kế thừa", en: "Inheritance" },
  r2b: { vi: "lớp con nhận lại và mở rộng lớp cha", en: "a subclass takes on and extends its parent" },
  r2c: {
    vi: "tái dùng code, nhưng là ràng buộc chặt nhất giữa hai lớp",
    en: "code reuse, but the tightest coupling two classes can have",
  },
  r3a: { vi: "Đa hình", en: "Polymorphism" },
  r3b: { vi: "một tham chiếu kiểu cha trỏ tới object kiểu con", en: "a parent-typed reference pointing at a child object" },
  r3c: {
    vi: "viết code làm việc với kiểu chung, chạy đúng với kiểu cụ thể",
    en: "write against the general type, run against the specific one",
  },
  r4a: { vi: "Trừu tượng", en: "Abstraction" },
  r4b: { vi: "mô tả cái gì cần làm, không nói làm thế nào", en: "state what must be done, not how" },
  r4c: { vi: "người dùng chỉ cần biết hợp đồng", en: "the caller only needs the contract" },

  /* 3.2 */
  s2: { vi: "Đa hình — method nào thật sự chạy", en: "Polymorphism — which method actually runs" },
  s2src: {
    vi: 'Schildt, chương 8 — "Dynamic Method Dispatch", trang 174–175. Chép nguyên văn, kể cả ba dòng in ra.',
    en: 'Schildt, ch.8 — "Dynamic Method Dispatch", pp.174–175. Copied verbatim, including the three printed lines.',
  },
  fig2aria: {
    vi: "Một biến kiểu A lần lượt trỏ vào ba object khác nhau, và cùng một dòng gọi cho ra ba kết quả khác nhau",
    en: "One variable of type A points at three different objects in turn, and the same call line produces three different results",
  },
  k2a: { vi: "kiểu của biến — compiler nhìn cái này", en: "the variable's type — what the compiler sees" },
  k2b: { vi: "kiểu của object — JVM nhìn cái này", en: "the object's type — what the JVM sees" },
  d2decl: { vi: "kiểu khai báo", en: "declared type" },
  d2c1: { vi: "compiler chỉ thấy A", en: "the compiler only sees A" },
  d2c2: { vi: "nên chỉ kiểm A có callme()", en: "so it only checks that A has callme()" },
  d2heap: { vi: "OBJECT TRÊN HEAP", en: "OBJECTS ON THE HEAP" },
  d2out: { vi: "MÀN HÌNH IN RA", en: "WHAT IS PRINTED" },
  d2none: { vi: "chưa in gì — mới chỉ khai biến", en: "nothing printed yet — only a declaration so far" },
  d2first: {
    vi: "A r;  — không object nào được tạo ở dòng này",
    en: "A r;  — no object is created on this line",
  },
  d2last: {
    vi: "cùng một dòng gọi, ba bản hiện thực — quyết định nằm ở lúc chạy",
    en: "one call line, three implementations — the choice is made at run time",
  },

  /* 3.3 */
  s3: { vi: "Abstract class hay interface", en: "Abstract class or interface" },
  s3srcA: {
    vi: 'Schildt, chương 8 — "Using abstract Classes", trang 179.',
    en: 'Schildt, ch.8 — "Using abstract Classes", p.179.',
  },
  s3srcB: {
    vi: 'Schildt, chương 9 — "Applying Interfaces", trang 196–199.',
    en: 'Schildt, ch.9 — "Applying Interfaces", pp.196–199.',
  },
  t3h2: { vi: "Abstract class", en: "Abstract class" },
  t3h3: { vi: "Interface", en: "Interface" },
  t3r1: { vi: "Trạng thái", en: "State" },
  t3r2: { vi: "Số lượng", en: "How many" },
  t3r2a: { vi: "kế thừa một", en: "extend one" },
  t3r2b: { vi: "hiện thực nhiều", en: "implement many" },
  t3r3: { vi: "Constructor", en: "Constructor" },
  t3r3a: { vi: "có", en: "yes" },
  t3r3b: { vi: "không", en: "no" },
  t3r4: { vi: "Ngữ nghĩa", en: "Meaning" },
  t3r4a: { vi: '"là một" + chia sẻ code', en: '"is a" + shared code' },
  t3r4b: { vi: '"có khả năng"', en: '"is able to"' },
  trapDiamond: { vi: "Vì sao Java không đa kế thừa class", en: "Why Java has no multiple class inheritance" },

  /* 3.4 */
  s4: { vi: "S — một lý do để thay đổi", en: "S — one reason to change" },
  s4src: {
    vi: 'Robert C. Martin, "Design Principles and Design Patterns" (2000) — năm nguyên tắc công bố lần đầu ở đây; chữ viết tắt SOLID do Michael Feathers đặt khoảng 2004. Riêng chữ L là của Barbara Liskov, "Data Abstraction and Hierarchy" (OOPSLA 1987). Class dùng minh hoạ vẫn là class của Schildt ở hai mục trên.',
    en: 'Robert C. Martin, "Design Principles and Design Patterns" (2000) — where the five principles were first set out; the SOLID acronym is Michael Feathers\', from around 2004. The L is Barbara Liskov\'s, "Data Abstraction and Hierarchy" (OOPSLA 1987). The demonstrating classes are still Schildt\'s, from the two sections above.',
  },

  fig4aria: {
    vi: "Năm chữ cái SOLID, mỗi chữ kèm tên đầy đủ của nguyên tắc và mục tương ứng trên trang",
    en: "The five letters of SOLID, each with the principle's full name and the section it is covered in",
  },
  fig4cap: {
    vi: "Năm chữ cái, và mục nào trên trang này nói về chữ nào.",
    en: "The five letters, and which section on this page covers which.",
  },
  solidS: { vi: "một lý do để thay đổi", en: "one reason to change" },
  solidO: { vi: "mở để mở rộng, đóng để sửa", en: "open to extend, closed to modify" },
  solidL: { vi: "thay lớp con vào phải vẫn đúng", en: "a subclass must still be correct" },
  solidI: { vi: "hợp đồng vừa đủ cho người dùng", en: "a contract sized to its caller" },
  solidD: { vi: "phụ thuộc vào trừu tượng", en: "depend on the abstraction" },

  /* 3.5 – 3.9 */
  s5: { vi: "O — mở để mở rộng, đóng để sửa đổi", en: "O — open to extend, closed to modify" },
  s6: { vi: "L — thay lớp con vào phải vẫn đúng", en: "L — a subclass must still be correct in its place" },
  s7: { vi: "I — đừng ép ai phụ thuộc thứ họ không dùng", en: "I — do not force anyone to depend on what they never call" },
  s8: { vi: "D — phụ thuộc vào trừu tượng", en: "D — depend on the abstraction" },
  s8src: {
    vi: "Schildt, chương 8 trang 179 và chương 9 trang 199 — cả hai chương đều cố ý khai biến bằng kiểu trừu tượng rồi mới gán object cụ thể vào.",
    en: "Schildt, ch.8 p.179 and ch.9 p.199 — both chapters deliberately declare the variable at the abstract type before assigning a concrete object.",
  },
  trapDip: { vi: "Phân biệt cho rõ", en: "Keep these apart" },
  s9: { vi: "Khi nào nên phá SOLID", en: "When to break SOLID" },
  trapFollow: { vi: "Câu hay bị hỏi tiếp", en: "The usual follow-up" },
} satisfies Record<string, Tx>;

function dispatchSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "A r;", note: 'Khai một tham chiếu kiểu A. Chưa object nào được tạo ở dòng này — Schildt ghi rõ: "this is OK, no object is created".' },
        { label: "r = a;", note: 'r trỏ vào object kiểu A. Gọi r.callme() in ra "Inside A\'s callme method".' },
        { label: "r = b;", note: "Cùng biến r đó, giờ trỏ vào object kiểu B. Dòng gọi r.callme() không đổi một ký tự." },
        { label: "B's callme chạy", note: 'In ra "Inside B\'s callme method". JVM chọn theo KIỂU CỦA OBJECT, không theo kiểu của biến.' },
        { label: "r = c;", note: "Trỏ vào object kiểu C. Vẫn dòng gọi cũ, vẫn không sửa gì." },
        { label: "ba kết quả khác nhau", note: 'Schildt: "it is the type of the object being referred to (not the type of the reference variable) that determines which version of an overridden method will be executed."' },
      ]
    : [
        { label: "A r;", note: 'Declare a reference of type A. No object is created on this line — Schildt is explicit: "this is OK, no object is created".' },
        { label: "r = a;", note: 'r points at an object of type A. Calling r.callme() prints "Inside A\'s callme method".' },
        { label: "r = b;", note: "The same variable r, now pointing at a B. The call line r.callme() has not changed by a single character." },
        { label: "B's callme runs", note: 'Prints "Inside B\'s callme method". The JVM picks by the TYPE OF THE OBJECT, not the type of the variable.' },
        { label: "r = c;", note: "Now pointing at a C. Same call line, still untouched." },
        { label: "three different results", note: 'Schildt: "it is the type of the object being referred to (not the type of the reference variable) that determines which version of an overridden method will be executed."' },
      ];
}

export default function Oop({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="03" name="OOP & SOLID" lede={s(T.lede)} source={s(T.source)} />

      <Sec n="3.1" t={s(T.s1)}>
        <Table
          head={[s(T.th1), s(T.th2), s(T.th3)]}
          rows={[
            [s(T.r1a), s(T.r1b), s(T.r1c)],
            [s(T.r2a), s(T.r2b), s(T.r2c)],
            [s(T.r3a), s(T.r3b), s(T.r3c)],
            [s(T.r4a), s(T.r4b), s(T.r4c)],
          ]}
        />
        <Trap t={T.trapFollow}>
          <Tr
            vi={
              <p>
                <strong>Đóng gói và trừu tượng khác nhau chỗ nào?</strong> Đóng gói là che giấu <em>dữ liệu</em>,
                trừu tượng là che giấu <em>cách hiện thực</em>. Đóng gói trả lời "ai được đụng vào"; trừu tượng
                trả lời "người dùng cần biết gì".
              </p>
            }
            en={
              <p>
                <strong>How do encapsulation and abstraction differ?</strong> Encapsulation hides <em>data</em>;
                abstraction hides <em>the implementation</em>. Encapsulation answers "who may touch this";
                abstraction answers "what does the caller need to know".
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="3.2" t={s(T.s2)}>
        <Code>{`// Dynamic Method Dispatch
class A {
  void callme() {
    System.out.println("Inside A's callme method");
  }
}

class B extends A {
  // override callme()
  void callme() {
    System.out.println("Inside B's callme method");
  }
}

class C extends A {
  // override callme()
  void callme() {
    System.out.println("Inside C's callme method");
  }
}

class Dispatch {
  public static void main(String args[]) {
    A a = new A();
    B b = new B();
    C c = new C();
    A r;                  // obtain a reference of type A

    r = a;  r.callme();   // calls A's version of callme
    r = b;  r.callme();   // calls B's version of callme
    r = c;  r.callme();   // calls C's version of callme
  }
}`}</Code>
        <Src vi={T.s2src.vi} en={T.s2src.en} />

        <Walkthrough
          viewBox="0 0 720 256"
          aria={s(T.fig2aria)}
          hold={2100}
          steps={dispatchSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 3.2" : "Figure 3.2"}</span>
              <Tr
                vi={
                  <>
                    Dòng <code>r.callme()</code> viết đúng một lần. Ba bản hiện thực chạy. Đây là toàn bộ nội
                    dung của cụm từ <em>run-time polymorphism</em>.
                  </>
                }
                en={
                  <>
                    The line <code>r.callme()</code> is written exactly once. Three implementations run. That is
                    the whole of what <em>run-time polymorphism</em> means.
                  </>
                }
              />
              <Key
                items={[
                  { c: "info", t: s(T.k2a) },
                  { c: "ok", t: s(T.k2b) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const which = i <= 1 ? 0 : i <= 3 ? 1 : 2;
            const names = ["A", "B", "C"];
            const printed = ["A's callme method", "B's callme method", "C's callme method"];
            const shown = i === 0 ? 0 : i <= 2 ? 1 : i <= 4 ? 2 : 3;
            return (
              <>
                {/* the reference variable */}
                <g data-c="info">
                  <rect x="16" y="48" width="152" height="64" className="d-box-fill" />
                  <Ic n="link" x={32} y={62} s={16} c="info" />
                  <text x="58" y="74" className="d-b">A r</text>
                  <text x="32" y="98" className="d-s">{s(T.d2decl)}</text>
                </g>
                <text x="16" y="136" className="d-s">{s(T.d2c1)}</text>
                <text x="16" y="156" className="d-s">{s(T.d2c2)}</text>

                {/* the three objects */}
                <text x="248" y="24" className="d-s">{s(T.d2heap)}</text>
                {names.map((n, k) => {
                  const on = k === which && i > 0;
                  return (
                    <g key={n} data-c={on ? "ok" : undefined}>
                      <rect x={248} y={40 + k * 64} width={168} height={48} className={on ? "d-box-fill" : "d-box"} />
                      <Ic n="box" x={264} y={54 + k * 64} s={16} c={on ? "ok" : undefined} />
                      <text x={292} y={70 + k * 64} className="d-b">
                        new {n}()
                      </text>
                    </g>
                  );
                })}

                {i > 0 && (
                  <line
                    x1="168"
                    y1="80"
                    x2="240"
                    y2={64 + which * 64}
                    className="d-l"
                    markerEnd="url(#pa-ok)"
                    data-enter=""
                    data-c="ok"
                  />
                )}

                {/* printed output */}
                <text x="440" y="24" className="d-s">{s(T.d2out)}</text>
                <rect x="440" y="40" width="264" height="152" className="d-box" />
                {printed.slice(0, shown).map((line, k) => (
                  <text key={k} x="456" y={72 + k * 36} className="d-m" data-enter="">
                    Inside {line}
                  </text>
                ))}
                {shown === 0 && (
                  <text x="456" y="72" className="d-s">
                    {s(T.d2none)}
                  </text>
                )}

                <text x="16" y="240" className="d-s">
                  {i === 0
                    ? s(T.d2first)
                    : i === 5
                      ? s(T.d2last)
                      : lang === "vi"
                        ? `r = ${names[which].toLowerCase()};  r.callme();  →  bản của ${names[which]} chạy`
                        : `r = ${names[which].toLowerCase()};  r.callme();  →  ${names[which]}'s version runs`}
                </text>
              </>
            );
          }}
        </Walkthrough>

        <Trap>
          <Tr
            vi={
              <p>
                Method <code>static</code> <strong>không</strong> được override, chỉ bị <em>che khuất</em>. Gọi
                qua tham chiếu kiểu cha thì chạy bản của cha, vì static phân giải theo kiểu khai báo — tức là
                theo cái ô bên trái của hình trên, không phải theo object bên phải.
              </p>
            }
            en={
              <p>
                A <code>static</code> method is <strong>not</strong> overridden, only <em>hidden</em>. Call it
                through a parent-typed reference and the parent's version runs, because static resolves against
                the declared type — the box on the left of the figure above, not the object on the right.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="3.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Schildt dùng <code>Figure</code> để giải thích abstract: <em>"since there is no meaningful
                concept of area for an undefined two-dimensional figure"</em>, <code>area()</code> được khai
                abstract, và mọi lớp con <strong>bắt buộc</strong> phải override.
              </>
            }
            en={
              <>
                Schildt explains abstraction with <code>Figure</code>: <em>"since there is no meaningful concept
                of area for an undefined two-dimensional figure"</em>, <code>area()</code> is declared abstract,
                and every subclass is <strong>required</strong> to override it.
              </>
            }
          />
        </P>
        <Code>{`// Using abstract methods and classes.
abstract class Figure {
  double dim1;
  double dim2;

  Figure(double a, double b) { dim1 = a; dim2 = b; }

  abstract double area();          // no body — the subclass must write it
}

class Rectangle extends Figure {
  Rectangle(double a, double b) { super(a, b); }
  double area() { return dim1 * dim2; }
}

class Triangle extends Figure {
  Triangle(double a, double b) { super(a, b); }
  double area() { return dim1 * dim2 / 2; }
}

// Figure f = new Figure(10, 10);   // illegal now
Figure figref;                       // this is OK, no object is created`}</Code>
        <Src vi={T.s3srcA.vi} en={T.s3srcA.en} />

        <P>
          <Tr
            vi={
              <>
                Còn interface thì sách dùng <code>IntStack</code>: một hợp đồng hai method, hai hiện thực khác
                hẳn nhau về cách chứa dữ liệu.
              </>
            }
            en={
              <>
                For interfaces the book uses <code>IntStack</code>: a two-method contract with two
                implementations that store their data in completely different ways.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// Define an integer stack interface.
interface IntStack {
  void push(int item);   // store an item
  int  pop();            // retrieve an item
}

class FixedStack implements IntStack { ... }   // mảng cố định
class DynStack   implements IntStack { ... }   // mảng tự lớn ra khi đầy`}
          en={`// Define an integer stack interface.
interface IntStack {
  void push(int item);   // store an item
  int  pop();            // retrieve an item
}

class FixedStack implements IntStack { ... }   // a fixed array
class DynStack   implements IntStack { ... }   // an array that grows when full`}
        />
        <Src vi={T.s3srcB.vi} en={T.s3srcB.en} />

        <Table
          head={["", s(T.t3h2), s(T.t3h3)]}
          rows={[
            [
              s(T.t3r1),
              <Tr key="a" vi={<><code>Figure</code> có dim1, dim2</>} en={<><code>Figure</code> holds dim1, dim2</>} />,
              <Tr key="b" vi={<><code>IntStack</code> không có trường nào</>} en={<><code>IntStack</code> has no fields</>} />,
            ],
            [s(T.t3r2), s(T.t3r2a), s(T.t3r2b)],
            [s(T.t3r3), s(T.t3r3a), s(T.t3r3b)],
            [s(T.t3r4), s(T.t3r4a), s(T.t3r4b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Từ Java 8 interface có <code>default</code> và <code>static</code> method; từ Java 9 có{" "}
                <code>private</code> method. <strong>Ranh giới thật sự còn lại là trạng thái</strong> — và hai ví
                dụ trên chỉ đúng vào chỗ đó: <code>Figure</code> mang dữ liệu, <code>IntStack</code> thì không.
              </>
            }
            en={
              <>
                Since Java 8 an interface can carry <code>default</code> and <code>static</code> methods; since
                Java 9, <code>private</code> ones too. <strong>The line that is actually left is state</strong> —
                and the two examples above land exactly on it: <code>Figure</code> carries data,{" "}
                <code>IntStack</code> does not.
              </>
            }
          />
        </P>
        <Trap t={T.trapDiamond}>
          <Tr
            vi={
              <p>
                Để tránh <strong>diamond problem</strong>: nếu một lớp kế thừa hai lớp cha cùng có một method,
                không xác định được dùng bản nào. Interface tránh được vì trước Java 8 nó không mang hiện thực —
                và từ Java 8, nếu hai interface có <code>default</code> method trùng nhau thì compiler{" "}
                <em>bắt buộc</em> lớp con phải override để tự chọn.
              </p>
            }
            en={
              <p>
                To avoid the <strong>diamond problem</strong>: if a class inherited from two parents that both
                have the same method, there would be no way to say which one runs. Interfaces escaped it because
                before Java 8 they carried no implementation — and since Java 8, when two interfaces bring the
                same <code>default</code> method the compiler <em>forces</em> the implementing class to override
                and choose.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="3.4" t={s(T.s4)}>
        <Src vi={T.s4src.vi} en={T.s4src.en} />

        <Fig
          viewBox="0 0 720 232"
          aria={s(T.fig4aria)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 3.4" : "Figure 3.4"}</span>
              {s(T.fig4cap)}
            </>
          }
        >
          {[
            { l: "S", n: "Single Responsibility", d: s(T.solidS), sec: "3.4", c: "bad" },
            { l: "O", n: "Open / Closed", d: s(T.solidO), sec: "3.5", c: "ok" },
            { l: "L", n: "Liskov Substitution", d: s(T.solidL), sec: "3.6", c: "info" },
            { l: "I", n: "Interface Segregation", d: s(T.solidI), sec: "3.7", c: "warn" },
            { l: "D", n: "Dependency Inversion", d: s(T.solidD), sec: "3.8", c: "bad" },
          ].map((r, k) => (
            <g key={r.l} data-c={r.c}>
              <text x="24" y={44 + k * 44} className="d-b-a" fontSize="22">
                {r.l}
              </text>
              <rect x={56} y={22 + k * 44} width={584} height={32} className="d-box-fill" />
              <text x={72} y={44 + k * 44} className="d-b">
                {r.n}
              </text>
              <text x={288} y={44 + k * 44} className="d-s">
                {r.d}
              </text>
              <text x={664} y={44 + k * 44} className="d-s" textAnchor="end">
                {lang === "vi" ? `mục ${r.sec}` : `§ ${r.sec}`}
              </text>
            </g>
          ))}
        </Fig>

        <P>
          <Tr
            vi={
              <>
                Phát biểu chuẩn không phải "một class làm một việc", mà:{" "}
                <strong>một class chỉ nên có một lý do để thay đổi</strong>.
              </>
            }
            en={
              <>
                The actual statement is not "a class does one thing", it is:{" "}
                <strong>a class should have only one reason to change</strong>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <code>Figure</code> ở mục trên chỉ giữ hai chiều và biết tính diện tích. Nó không in ra màn hình,
                không ghi xuống đâu cả, không đọc dữ liệu vào. Một lý do để thay đổi: <em>công thức hình học</em>.
              </>
            }
            en={
              <>
                The <code>Figure</code> above holds two dimensions and knows how to compute an area. It prints
                nothing, writes nowhere, reads nothing in. One reason to change: <em>the geometry</em>.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// một lý do để thay đổi
abstract class Figure {
  double dim1, dim2;
  abstract double area();
}

// ba lý do để thay đổi — đổi cách in cũng phải mở file này ra
abstract class Figure {
  double dim1, dim2;
  abstract double area();
  void print()        { System.out.println("Area is " + area()); }
  void saveTo(File f) { ... }
}`}
          en={`// one reason to change
abstract class Figure {
  double dim1, dim2;
  abstract double area();
}

// three reasons to change — altering how it prints reopens this file
abstract class Figure {
  double dim1, dim2;
  abstract double area();
  void print()        { System.out.println("Area is " + area()); }
  void saveTo(File f) { ... }
}`}
        />
        <P>
          <Tr
            vi={
              <>
                Cái giá của bản dưới rất cụ thể: muốn đổi từ in ra màn hình sang ghi ra file thì phải mở đúng
                file đang giữ công thức hình học, và <strong>mọi test tính diện tích phải chạy lại</strong>.
              </>
            }
            en={
              <>
                The price of the second version is concrete: switching from printing to writing a file means
                reopening the very file that holds the geometry, and{" "}
                <strong>every area test has to be run again</strong>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Chú ý một chỗ thật thà: trong sách, <code>Rectangle.area()</code> có{" "}
                <code>System.out.println("Inside Area for Rectangle.")</code> ngay bên trong. Tiện cho một ví dụ
                dạy học, và cũng chính là chỗ vi phạm nguyên tắc này.
              </>
            }
            en={
              <>
                One honest note: in the book, <code>Rectangle.area()</code> has{" "}
                <code>System.out.println("Inside Area for Rectangle.")</code> right inside it. Convenient for a
                teaching example, and exactly where this principle is broken.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="3.5" t={s(T.s5)}>
        <P>
          <Tr
            vi={
              <>
                Thêm hành vi bằng cách <em>thêm code</em>, không phải sửa code đã chạy đúng. Ví dụ có sẵn ngay
                trong sách, chỉ là Schildt không gọi tên nó.
              </>
            }
            en={
              <>
                Add behaviour by <em>adding code</em>, not by editing code that already works. The example is
                already in the book; Schildt simply never names it.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// hàm này ĐÓNG — thêm hình mới không cần mở nó ra
double tongDienTich(Figure[] figs) {
  double sum = 0;
  for (Figure f : figs) sum += f.area();
  return sum;
}

// MỞ để mở rộng — thêm một class, không sửa gì phía trên
class Circle extends Figure {
  Circle(double r) { super(r, r); }
  double area() { return Math.PI * dim1 * dim1; }
}`}
          en={`// this one is CLOSED — a new shape never reopens it
double totalArea(Figure[] figs) {
  double sum = 0;
  for (Figure f : figs) sum += f.area();
  return sum;
}

// OPEN to extension — add a class, change nothing above
class Circle extends Figure {
  Circle(double r) { super(r, r); }
  double area() { return Math.PI * dim1 * dim1; }
}`}
        />
        <P>
          <Tr
            vi={
              <>
                Khác biệt thật không nằm ở chỗ code đẹp hơn mà ở <strong>vùng có thể hỏng</strong>: thêm{" "}
                <code>Circle</code> thì <code>Rectangle</code> và <code>Triangle</code> <em>không thể</em> hỏng
                theo, vì không dòng nào của chúng bị đụng tới.
              </>
            }
            en={
              <>
                The real difference is not prettier code, it is <strong>the blast radius</strong>: adding{" "}
                <code>Circle</code> <em>cannot</em> break <code>Rectangle</code> or <code>Triangle</code>,
                because not one of their lines was touched.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Phản ví dụ là viết <code>tongDienTich</code> bằng một chuỗi{" "}
                <code>if (f instanceof Rectangle) … else if (f instanceof Triangle) …</code>. Lúc đó thêm hình
                mới bắt buộc phải mở hàm cũ ra sửa, và mỗi lần sửa là một lần có thể làm hỏng hai nhánh đang chạy
                đúng.
              </>
            }
            en={
              <>
                The counter-example is writing <code>totalArea</code> as a chain of{" "}
                <code>if (f instanceof Rectangle) … else if (f instanceof Triangle) …</code>. Then a new shape
                forces the old function open, and every edit is another chance to break two branches that were
                working.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="3.6" t={s(T.s6)}>
        <P>
          <Tr
            vi={
              <>
                Lớp con <strong>không được siết chặt điều kiện đầu vào</strong> và{" "}
                <strong>không được nới lỏng cam kết đầu ra</strong>.
              </>
            }
            en={
              <>
                A subclass <strong>may not tighten what it accepts</strong> and{" "}
                <strong>may not weaken what it promises</strong>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <code>Rectangle</code> và <code>Triangle</code> của Schildt đều tuân thủ: đưa cái nào vào{" "}
                <code>tongDienTich</code> cũng chạy đúng, vì cả hai đều thật sự trả về một diện tích.
              </>
            }
            en={
              <>
                Schildt's <code>Rectangle</code> and <code>Triangle</code> both hold to it: hand either one to{" "}
                <code>totalArea</code> and it works, because both really do return an area.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// vi phạm: lớp con từ chối làm việc mà lớp cha đã hứa
class PointFigure extends Figure {
  PointFigure() { super(0, 0); }
  double area() {
    throw new UnsupportedOperationException("một điểm không có diện tích");
  }
}`}
          en={`// a violation: the subclass refuses work the parent promised
class PointFigure extends Figure {
  PointFigure() { super(0, 0); }
  double area() {
    throw new UnsupportedOperationException("a point has no area");
  }
}`}
        />
        <P>
          <Tr
            vi={
              <>
                Đoạn trên biên dịch được và trông vô hại, cho tới khi <code>tongDienTich</code> duyệt mảng và gặp
                nó. <strong>Dấu hiệu nhận biết là câu <code>throw new UnsupportedOperationException</code> nằm
                trong một method override</strong> — đó là lời thú nhận rằng quan hệ kế thừa này sai ngay từ đầu.
              </>
            }
            en={
              <>
                That compiles and looks harmless, right up until <code>totalArea</code> walks the array and
                reaches it. <strong>The tell is a <code>throw new UnsupportedOperationException</code> inside an
                overriding method</strong> — a written confession that the inheritance was wrong from the start.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Ví dụ vi phạm kinh điển hơn — <code>Square extends Rectangle</code> — đến từ chính bài viết
                năm 2000 của Robert Martin. Người dùng <code>Rectangle</code> tin rằng đặt chiều rộng không làm
                đổi chiều cao, và <code>Square</code> phá vỡ niềm tin đó, dù về mặt toán học hình vuông đúng là
                hình chữ nhật.
              </>
            }
            en={
              <>
                The more famous violation — <code>Square extends Rectangle</code> — comes from Robert Martin's
                own 2000 paper. A caller of <code>Rectangle</code> believes that setting the width leaves the
                height alone, and <code>Square</code> breaks that belief, however true it is mathematically
                that a square is a rectangle.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="3.7" t={s(T.s7)}>
        <P>
          <Tr
            vi={
              <>
                <code>IntStack</code> của Schildt có đúng <strong>hai</strong> method. Đó chính là ISP đang được
                áp dụng, dù sách không gọi tên: ai cần một cái ngăn xếp thì chỉ phải biết <code>push</code> và{" "}
                <code>pop</code>.
              </>
            }
            en={
              <>
                Schildt's <code>IntStack</code> has exactly <strong>two</strong> methods. That is ISP being
                applied, though the book never names it: whoever needs a stack only has to know{" "}
                <code>push</code> and <code>pop</code>.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// hợp đồng vừa đủ — hai method
interface IntStack {
  void push(int item);
  int  pop();
}

// phản ví dụ: ai hiện thực cũng phải viết đủ sáu
interface IntStorage {
  void push(int item);
  int  pop();
  void saveToDisk(String path);
  void loadFromDisk(String path);
  void printAll();
  int  averageOfAll();
}`}
          en={`// a contract that is exactly enough — two methods
interface IntStack {
  void push(int item);
  int  pop();
}

// the counter-example: every implementer must write all six
interface IntStorage {
  void push(int item);
  int  pop();
  void saveToDisk(String path);
  void loadFromDisk(String path);
  void printAll();
  int  averageOfAll();
}`}
        />
        <P>
          <Tr
            vi={
              <>
                Với bản dưới, <code>FixedStack</code> — chỉ là một mảng cố định — bị ép phải có{" "}
                <code>saveToDisk</code>, và gần như chắc chắn sẽ hiện thực nó bằng cách ném exception, tức là kéo
                luôn vi phạm ở mục 3.6 theo.
              </>
            }
            en={
              <>
                With the second one, <code>FixedStack</code> — a fixed array, nothing more — is forced to have{" "}
                <code>saveToDisk</code>, and will almost certainly implement it by throwing, dragging the
                violation from 3.6 along with it.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Chỗ hay làm sai là tách theo <em>dữ liệu</em> — cứ liên quan tới ngăn xếp thì gom vào một
                interface. ISP nói tách theo <strong>người dùng</strong>: ai chỉ đẩy và lấy thì thấy{" "}
                <code>IntStack</code>, ai cần ghi ra đĩa thì thấy một interface khác.
              </>
            }
            en={
              <>
                The common mistake is to split by <em>data</em> — anything stack-related goes in one interface.
                ISP says split by <strong>caller</strong>: whoever only pushes and pops sees{" "}
                <code>IntStack</code>, whoever needs the disk sees a different interface.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="3.8" t={s(T.s8)}>
        <P>
          <Tr
            vi={
              <>
                Hai dòng quan trọng nhất trong cả hai ví dụ của Schildt đều là dòng khai biến, không phải dòng{" "}
                <code>new</code>:
              </>
            }
            en={
              <>
                The two most important lines in either of Schildt's examples are the declarations, not the{" "}
                <code>new</code>:
              </>
            }
          />
        </P>
        <CodeTr
          vi={`Figure   figref;     // không phải Rectangle figref
IntStack mystack;    // không phải FixedStack mystack

figref  = new Triangle(10, 8);
mystack = new DynStack(5);

// code phía dưới chỉ nói chuyện với Figure và IntStack
System.out.println("Area is " + figref.area());
mystack.push(42);`}
          en={`Figure   figref;     // not Rectangle figref
IntStack mystack;    // not FixedStack mystack

figref  = new Triangle(10, 8);
mystack = new DynStack(5);

// everything below only ever talks to Figure and IntStack
System.out.println("Area is " + figref.area());
mystack.push(42);`}
        />
        <Src vi={T.s8src.vi} en={T.s8src.en} />
        <P>
          <Tr
            vi={
              <>
                Nhờ đúng hai dòng đó mà đổi <code>DynStack</code> thành <code>FixedStack</code> không phải sửa
                một chữ nào ở phần dùng. Trong Spring, việc tiêm bean qua interface là đúng ý này, chỉ khác ở chỗ{" "}
                <em>ai</em> gán object cụ thể vào — container gán, thay vì bạn tự viết <code>new</code>.
              </>
            }
            en={
              <>
                Because of those two lines, swapping <code>DynStack</code> for <code>FixedStack</code> changes
                not one character of the calling code. Injecting a bean by its interface in Spring is the same
                idea; the only difference is <em>who</em> assigns the concrete object — the container does it,
                instead of you writing <code>new</code>.
              </>
            }
          />
        </P>
        <Trap t={T.trapDip}>
          <Tr
            vi={
              <p>
                <strong>DI không phải DIP.</strong> DIP là <em>nguyên tắc</em> — hãy phụ thuộc vào trừu tượng.
                DI là <em>kỹ thuật</em> — ai đó đưa phụ thuộc vào từ ngoài. Dùng DI mà tiêm một class cụ thể thì
                có DI nhưng không có DIP.
              </p>
            }
            en={
              <p>
                <strong>DI is not DIP.</strong> DIP is the <em>principle</em> — depend on abstractions. DI is
                the <em>technique</em> — someone hands the dependency in from outside. Inject a concrete class
                and you have DI without DIP.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="3.9" t={s(T.s9)}>
        <P>
          <Tr
            vi={
              <>
                SOLID phục vụ một mục tiêu: <em>giảm chi phí thay đổi</em>. Khi việc tuân thủ làm tăng chi phí
                thay đổi thì nó phản tác dụng. Chia một class 30 dòng thành sáu interface là làm khó người đọc,
                không phải làm sạch kiến trúc.
              </>
            }
            en={
              <>
                SOLID serves one goal: <em>lowering the cost of change</em>. When following it raises that cost,
                it is working against itself. Splitting a 30-line class into six interfaces makes the reader's
                job harder; it does not make the architecture cleaner.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Cách nói an toàn trong phỏng vấn: "Em áp dụng khi đã thấy trục thay đổi thật. Trừu tượng hoá
                trước một biến thể chưa bao giờ xuất hiện thường là đoán sai chỗ."
              </>
            }
            en={
              <>
                A safe way to put it in an interview: "I apply it once I can see a real axis of change.
                Abstracting ahead of a variant that never arrives is usually a guess in the wrong place."
              </>
            }
          />
        </P>
        <Limit>
          <Tr
            vi={
              <>
                Chính Schildt cũng phá nguyên tắc 3.4 ngay trong ví dụ của mình — <code>Rectangle.area()</code>{" "}
                vừa tính diện tích vừa <code>println</code>. Với một quyển sách dạy cú pháp thì đó là lựa chọn
                đúng: in ra màn hình là cách duy nhất để người học thấy được kết quả. Nguyên tắc phục vụ mục
                tiêu, và mục tiêu của một ví dụ dạy học khác với mục tiêu của code chạy thật.
              </>
            }
            en={
              <>
                Schildt himself breaks 3.4 inside his own example — <code>Rectangle.area()</code> computes an
                area <em>and</em> <code>println</code>s. For a book teaching syntax that is the right call:
                printing is the only way the learner sees a result at all. Principles serve a goal, and the goal
                of a teaching example is not the goal of code in production.
              </>
            }
          />
        </Limit>
      </Sec>
    </div>
  );
}
