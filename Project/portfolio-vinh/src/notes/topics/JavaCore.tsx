import type { Lang } from "../../content";
import { Src, Tr, say, type Tx } from "../i18n";
import { Code, Defs, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";
import Walkthrough from "../Walkthrough";

/**
 * 02 · Java core.
 *
 * The worked examples are lifted verbatim from Herbert Schildt, *Java: The
 * Complete Reference*, 7th ed — the copy on Vinh's shelf — with the chapter and
 * the printed page number under each one, so the sheet can be read beside the
 * open book. Where the book has a printed output, the output is here too: a
 * reader who runs the snippet and gets those exact lines has verified the claim
 * rather than believed it.
 *
 * That edition covers Java 6. Lambdas, streams, `Optional` and records postdate
 * it by years, so the sections about them say plainly that the example was
 * written here and not taken from the book. Citing a 2006 book for a 2014
 * feature would be borrowed authority, which is the one thing this notebook is
 * built to avoid.
 */

/* -------------------------------------------------------------------------- */
/*  Copy                                                                       */
/*                                                                             */
/*  Plain strings live here as pairs. Prose carrying markup stays inline in     */
/*  <Tr>, because splitting a sentence from its <code> tags to satisfy a        */
/*  table is how translations drift out of sync with the thing they describe.   */
/* -------------------------------------------------------------------------- */

const T = {
  lede: {
    vi: "Chín quy tắc của ngôn ngữ, không quy tắc nào nhìn thấy được khi đọc code. Ví dụ lấy nguyên văn từ Schildt — có ghi rõ chương và số trang để bạn mở sách ra đối chiếu.",
    en: "Nine rules of the language, not one of them visible in the source. The examples are lifted verbatim from Schildt, with the chapter and printed page under each so you can read this beside the open book.",
  },
  source: {
    vi: "Herbert Schildt · Java: The Complete Reference, 7th ed · chương 7, 10, 14, 15 và 17",
    en: "Herbert Schildt · Java: The Complete Reference, 7th ed · chapters 7, 10, 14, 15 and 17",
  },

  /* 2.1 */
  s1: { vi: "Java truyền tham số kiểu gì", en: "How Java passes arguments" },
  s1src: {
    vi: 'Schildt, chương 7 — "A Closer Look at Argument Passing", trang 132–134. Chép nguyên văn, kể cả kết quả in ra.',
    en: 'Schildt, ch.7 — "A Closer Look at Argument Passing", pp.132–134. Copied verbatim, printed output included.',
  },
  fig1: {
    vi: "Một câu để trả lời phỏng vấn: sửa được ruột, không đổi được mũi tên.",
    en: "One sentence for the interview: you can change the contents, you cannot change the arrow.",
  },

  /* 2.2 */
  s2: { vi: "static, final, this", en: "static, final, this" },
  s2src: {
    vi: "Schildt, chương 7 — \"Understanding static\" và \"Introducing final\", trang 141–143.",
    en: 'Schildt, ch.7 — "Understanding static" and "Introducing final", pp.141–143.',
  },

  /* 2.3 */
  s3: {
    vi: "Exception — và cái return bị finally nuốt mất",
    en: "Exceptions — and the return finally swallows",
  },
  s3src: {
    vi: "Schildt, chương 10 — \"finally\", trang 216–217. Class FinallyDemo và kết quả in ra là nguyên văn của sách.",
    en: 'Schildt, ch.10 — "finally", pp.216–217. The FinallyDemo class and its printed output are the book\'s own.',
  },
  fig3: {
    vi: "return không phải là \"đi ra ngay\". Nó là \"tính xong, để đây, chờ finally\".",
    en: 'return does not mean "leave now". It means "value computed, parked, waiting for finally".',
  },

  /* 2.4 */
  s4: { vi: "Generic và chuyện kiểu bị xoá lúc chạy", en: "Generics, and type erasure" },
  s4src: {
    vi: "Schildt, chương 14 — \"Generics\", trang 315–318. Class Gen<T> là ví dụ mở đầu chương.",
    en: 'Schildt, ch.14 — "Generics", pp.315–318. Gen<T> is the chapter\'s opening example.',
  },

  /* 2.5 */
  s5: { vi: "Lambda và Stream", en: "Lambdas and streams" },
  s5src: {
    vi: 'Javadoc gói java.util.stream — mục "Stream operations and pipelines" định nghĩa phép trung gian là lazy và mô tả chính cơ chế đi dọc ở hình dưới. Joshua Bloch, Effective Java 3rd ed, Item 45 "Use streams judiciously" nói phần nên và không nên dùng.',
    en: 'The java.util.stream package javadoc — its "Stream operations and pipelines" section defines intermediate operations as lazy and describes the vertical traversal drawn below. Joshua Bloch, Effective Java 3rd ed, Item 45 "Use streams judiciously", covers when not to reach for them.',
  },
  fig5: {
    vi: "Stream đi dọc — một phần tử qua hết mọi tầng — chứ không đi ngang từng tầng một.",
    en: "A stream runs down, one element through every stage, not across one stage at a time.",
  },

  /* 2.6 */
  s6: { vi: "Optional", en: "Optional" },
  s6src: {
    vi: 'Javadoc java.util.Optional — "a container object which may or may not contain a non-null value". Joshua Bloch, Effective Java 3rd ed, Item 55 "Return optionals judiciously" là chỗ nói rõ nhất khi nào nên trả Optional và khi nào không.',
    en: 'The java.util.Optional javadoc — "a container object which may or may not contain a non-null value". Joshua Bloch, Effective Java 3rd ed, Item 55 "Return optionals judiciously", is the clearest statement of when to return one and when not to.',
  },

  /* 2.7 */
  s7: { vi: "enum, record, sealed", en: "enum, record, sealed" },
  s7src: {
    vi: "enum: Schildt chương 12, trang 255–262. record: JEP 395, chốt ở Java 16. sealed: JEP 409, chốt ở Java 17 — bản này không đổi gì so với bản xem trước ở Java 16.",
    en: "enum: Schildt ch.12, pp.255–262. record: JEP 395, finalised in Java 16. sealed: JEP 409, finalised in Java 17 — unchanged from the Java 16 preview.",
  },

  /* 2.8 */
  s8: { vi: "String bất biến, và bản sao phòng thủ", en: "String immutability, and defensive copies" },
  s8src: {
    vi: "String: Schildt chương 15 — \"String Handling\", trang 359–360. Phần bản sao phòng thủ do tôi viết.",
    en: 'String: Schildt ch.15 — "String Handling", pp.359–360. The defensive-copy part is mine.',
  },

  /* 2.9 */
  s9: { vi: "equals và hashCode", en: "equals and hashCode" },
  s9src: {
    vi: "Hợp đồng: Schildt chương 16 — java.lang.Object, trang 385. Cái bẫy khoá thay đổi được thì do tôi dựng.",
    en: "The contract: Schildt ch.16 — java.lang.Object, p.385. The mutable-key trap is mine.",
  },
  fig9: {
    vi: "Đây là lý do khoá của một tập hợp băm phải bất biến.",
    en: "This is why a key in a hash-based collection has to be immutable.",
  },
} satisfies Record<string, Tx>;

/* -------------------------------------------------------------------------- */

function passSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "ob.a=15 ob.b=20", note: "Test ob = new Test(15, 20). Biến ob trên stack giữ một tham chiếu; object thật nằm trên heap." },
        { label: "gọi ob.meth(ob)", note: "Java sao chép THAM CHIẾU, không sao chép object. Tham số o là mũi tên thứ hai chỉ vào đúng object cũ." },
        { label: "o.a *= 2", note: "Sửa qua o thì object trên heap đổi thật — và ob nhìn thấy, vì cả hai cùng chỉ vào một chỗ." },
        { label: "o.b /= 2", note: "Tương tự cho b. Sách in ra: ob.a and ob.b after call: 30 10." },
        { label: "so với kiểu nguyên thuỷ", note: "Ở ví dụ CallByValue, meth(int i, int j) nhận bản sao của chính con số. a và b bên ngoài giữ nguyên 15 20." },
        { label: "câu kết của sách", note: "\"When an object reference is passed to a method, the reference itself is passed by use of call-by-value.\" Bản sao của mũi tên, không phải bản sao của object." },
      ]
    : [
        { label: "ob.a=15 ob.b=20", note: "Test ob = new Test(15, 20). The variable ob on the stack holds a reference; the object itself lives on the heap." },
        { label: "call ob.meth(ob)", note: "Java copies the REFERENCE, not the object. The parameter o is a second arrow into the same object." },
        { label: "o.a *= 2", note: "Changing through o changes the heap object for real — and ob sees it, because both point at one place." },
        { label: "o.b /= 2", note: "Same for b. The book prints: ob.a and ob.b after call: 30 10." },
        { label: "against a primitive", note: "In the CallByValue example, meth(int i, int j) receives copies of the numbers themselves. Outside, a and b stay 15 20." },
        { label: "the book's own line", note: '"When an object reference is passed to a method, the reference itself is passed by use of call-by-value." A copy of the arrow, not a copy of the object.' },
      ];
}

function finallySteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "procA ném exception", note: "procA in \"inside procA\" rồi ném RuntimeException. Thoát khỏi try bằng đường exception." },
        { label: "finally của A vẫn chạy", note: "In \"procA's finally\" TRƯỚC khi exception bay ra ngoài. main bắt được và in \"Exception caught\"." },
        { label: "procB gặp return", note: "procB in \"inside procB\" rồi return. Giá trị trả về đã tính xong nhưng method CHƯA rời đi." },
        { label: "finally của B chạy trước", note: "In \"procB's finally\" rồi mới thật sự trả về. Đây là bước ai cũng bỏ qua khi đọc." },
        { label: "procC chạy bình thường", note: "Không exception, không return sớm. finally vẫn chạy — nó không phải là bộ xử lý lỗi." },
        { label: "nếu finally có return", note: "Sách không nói tiếp chỗ này: đặt return trong finally thì giá trị đang giữ tạm bị vứt thẳng, và exception đang bay cũng bị nuốt. Đừng bao giờ làm." },
      ]
    : [
        { label: "procA throws", note: 'procA prints "inside procA" then throws a RuntimeException. It leaves the try by the exception path.' },
        { label: "A's finally still runs", note: 'It prints "procA\'s finally" BEFORE the exception escapes. main catches it and prints "Exception caught".' },
        { label: "procB hits return", note: 'procB prints "inside procB" then returns. The return value is computed but the method has NOT left yet.' },
        { label: "B's finally runs first", note: 'It prints "procB\'s finally", and only then does the method actually return. This is the step everyone reads past.' },
        { label: "procC runs normally", note: "No exception, no early return. finally still runs — it is not an error handler." },
        { label: "if finally returns", note: "The book stops before this: a return inside finally throws away the parked value and swallows any exception in flight. Never write one." },
      ];
}

function streamSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "chưa chạy gì", note: "Mới có filter và map thì chưa phần tử nào bị đụng tới. Không có toán tử kết thúc thì không có gì xảy ra — đây là lazy." },
        { label: "phần tử 1 vào filter", note: "findFirst() là toán tử kết thúc, nó kéo dữ liệu. Phần tử đầu đi vào filter và qua được." },
        { label: "phần tử 1 qua map", note: "Cùng phần tử đó đi tiếp sang map ngay. Nó KHÔNG chờ ba phần tử kia lọc xong." },
        { label: "findFirst đủ rồi", note: "Có phần tử đầu tiên là findFirst dừng cả dây chuyền. Không hỏi thêm phần tử nào nữa." },
        { label: "ba phần tử kia bị bỏ", note: "Ba phần tử còn lại không được nhìn tới lần nào. Đây là short-circuit." },
        { label: "so với hai vòng for", note: "Viết bằng hai vòng for tuần tự: lọc hết 4, map hết 2, rồi mới lấy cái đầu — 6 lượt thay vì 2." },
      ]
    : [
        { label: "nothing runs yet", note: "With only filter and map declared, no element has been touched. No terminal operation, no work — this is laziness." },
        { label: "element 1 into filter", note: "findFirst() is the terminal operation and it pulls. The first element enters filter and passes." },
        { label: "element 1 through map", note: "That same element goes straight on to map. It does NOT wait for the other three to be filtered." },
        { label: "findFirst has enough", note: "One element is all findFirst needs, so it stops the whole pipeline. It asks for nothing more." },
        { label: "the other three skipped", note: "The remaining three are never looked at once. This is short-circuiting." },
        { label: "against two for loops", note: "Written as two sequential loops: filter all 4, map all 2, then take the first — 6 operations instead of 2." },
      ];
}

function hashSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "một object", note: "Point p = new Point(1, 2). hashCode() của nó tính từ x và y." },
        { label: "tính hash → ô 3", note: "HashSet lấy hashCode rồi quy về số ô. Object này rơi vào ô số 3." },
        { label: "cất vào ô 3", note: "Object nằm trong ô 3. Tới đây contains() trả về true và mọi thứ đúng." },
        { label: "đổi x", note: "p.x = 9. Vẫn là object cũ, nhưng hashCode của nó vừa đổi." },
        { label: "tìm lại: hash → ô 6", note: "contains() tính hash MỚI, ra ô 6, và đi thẳng tới đó. Nó không quét hết các ô." },
        { label: "ô 6 rỗng", note: "Trả về false — trong khi object vẫn nằm yên ở ô 3. Còn đó, chiếm bộ nhớ, và không ai lấy ra được nữa." },
      ]
    : [
        { label: "one object", note: "Point p = new Point(1, 2). Its hashCode() is computed from x and y." },
        { label: "hash → bucket 3", note: "HashSet takes the hashCode and reduces it to a bucket number. This object lands in bucket 3." },
        { label: "stored in bucket 3", note: "The object sits in bucket 3. At this point contains() returns true and everything is correct." },
        { label: "change x", note: "p.x = 9. Same object as before, but its hashCode has just changed." },
        { label: "look again: hash → 6", note: "contains() computes the NEW hash, gets bucket 6, and goes straight there. It does not scan every bucket." },
        { label: "bucket 6 is empty", note: "It returns false — while the object still sits in bucket 3. Still there, still holding memory, and now unreachable." },
      ];
}

export default function JavaCore({ lang }: { lang: Lang }) {
  const s = say(lang);
  const vi = lang === "vi";

  return (
    <div className="topic">
      <Defs />
      <TopicHead no="02" name="Java core" lede={s(T.lede)} source={s(T.source)} />

      {/* ------------------------------------------------------------ 2.1 */}
      <Sec n="2.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                Câu trả lời đúng chỉ có một: <strong>Java luôn truyền theo giá trị</strong>. Chỗ gây hiểu lầm là{" "}
                <em>giá trị của một biến kiểu class không phải là object</em> — nó là tham chiếu tới object.
                Schildt gọi hệ quả của việc đó là "hiệu quả như truyền theo tham chiếu", và đó là cách nói chính
                xác nhất.
              </>
            }
            en={
              <>
                There is one correct answer: <strong>Java always passes by value</strong>. What misleads people
                is that <em>the value of a class-typed variable is not the object</em> — it is a reference to it.
                Schildt calls the effect "effectively call-by-reference", which is the precise way to say it.
              </>
            }
          />
        </P>

        <Code>{`// Primitive types are passed by value.
class Test {
  void meth(int i, int j) {
    i *= 2;
    j /= 2;
  }
}

class CallByValue {
  public static void main(String args[]) {
    Test ob = new Test();
    int a = 15, b = 20;
    System.out.println("a and b before call: " + a + " " + b);
    ob.meth(a, b);
    System.out.println("a and b after call: " + a + " " + b);
  }
}

// a and b before call: 15 20
// a and b after call:  15 20        ← không đổi`}</Code>

        <Code>{`// Objects are passed by reference.
class Test {
  int a, b;
  Test(int i, int j) { a = i; b = j; }

  void meth(Test o) {
    o.a *= 2;
    o.b /= 2;
  }
}

class CallByRef {
  public static void main(String args[]) {
    Test ob = new Test(15, 20);
    System.out.println("ob.a and ob.b before call: " + ob.a + " " + ob.b);
    ob.meth(ob);
    System.out.println("ob.a and ob.b after call: " + ob.a + " " + ob.b);
  }
}

// ob.a and ob.b before call: 15 20
// ob.a and ob.b after call:  30 10  ← đổi thật`}</Code>
        <Src vi={s(T.s1src)} en={s(T.s1src)} />

        <Walkthrough
          viewBox="0 0 720 280"
          aria={
            vi
              ? "Biến ob trỏ tới một object trên heap; tham số o là bản sao của tham chiếu và sửa được cùng object đó"
              : "The variable ob points at a heap object; the parameter o is a copy of that reference and mutates the same object"
          }
          hold={2200}
          steps={passSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 2.1" : "Figure 2.1"}</span>
              {s(T.fig1)}
              <Key
                items={
                  vi
                    ? [
                        { c: "ok", t: "người gọi thấy thay đổi" },
                        { c: "info", t: "bản sao của tham chiếu" },
                        { c: "bad", t: "người gọi không thấy" },
                      ]
                    : [
                        { c: "ok", t: "caller sees the change" },
                        { c: "info", t: "copy of the reference" },
                        { c: "bad", t: "caller sees nothing" },
                      ]
                }
              />
            </>
          }
        >
          {(i) => {
            const prim = i >= 4;
            const changedA = i >= 2 && !prim;
            const changedB = i >= 3 && !prim;
            return (
              <>
                <text x="16" y="24" className="d-s">STACK</text>
                <rect x="16" y="32" width="176" height="72" className="d-box" />
                <text x="28" y="52" className="d-b">main()</text>
                <text x="28" y="78" className="d-m">{prim ? "a = 15  b = 20" : "ob"}</text>

                {i >= 1 && (
                  <g data-enter="" data-c={prim ? "bad" : "info"}>
                    <rect x="16" y="136" width="176" height="88" className="d-box" />
                    <text x="28" y="156" className="d-b">meth()</text>
                    {prim ? (
                      <>
                        <text x="28" y="182" className="d-m">i = 15 → 30</text>
                        <text x="28" y="206" className="d-m">j = 20 → 10</text>
                      </>
                    ) : (
                      <>
                        <Ic n="link" x={152} y={140} s={14} c="info" />
                        <text x="28" y="182" className="d-m">o</text>
                        <text x="28" y="206" className="d-s">{vi ? "bản sao mũi tên" : "copy of the arrow"}</text>
                      </>
                    )}
                  </g>
                )}

                <text x="392" y="24" className="d-s">HEAP</text>
                <rect x="392" y="32" width="304" height="192" className="d-box-q" />

                {!prim ? (
                  <g data-c={changedA ? "ok" : undefined}>
                    <rect x="416" y="56" width="256" height="128" className="d-box" />
                    <Ic n="box" x={432} y={70} s={18} c={changedA ? "ok" : undefined} />
                    <text x="462" y="84" className="d-b">Test</text>
                    <text x="432" y="120" className="d-m">a = {changedA ? "30" : "15"}</text>
                    <text x="432" y="152" className="d-m">b = {changedB ? "10" : "20"}</text>
                  </g>
                ) : (
                  <g data-c="bad">
                    <rect x="416" y="56" width="256" height="128" className="d-box-out" />
                    <text x="432" y="112" className="d-s">{vi ? "không có object nào" : "no object at all"}</text>
                    <text x="432" y="140" className="d-s">{vi ? "int là giá trị, không phải mũi tên" : "an int is a value, not an arrow"}</text>
                  </g>
                )}

                {!prim && <line x1="192" y1="72" x2="408" y2="88" className="d-l" markerEnd="url(#pa)" />}
                {i >= 1 && !prim && (
                  <line x1="192" y1="180" x2="408" y2="120" className="d-l" markerEnd="url(#pa-info)" data-enter="" data-c="info" />
                )}

                {i === 3 && (
                  <g data-enter="" data-c="ok">
                    <Ic n="check" x={16} y={244} s={16} c="ok" />
                    <text x="40" y="257" className="d-m">ob.a and ob.b after call: 30 10</text>
                  </g>
                )}
                {i === 4 && (
                  <g data-enter="" data-c="bad">
                    <Ic n="x" x={16} y={244} s={16} c="bad" />
                    <text x="40" y="257" className="d-m">a and b after call: 15 20</text>
                  </g>
                )}
                {i !== 3 && i !== 4 && (
                  <text x="16" y="257" className="d-s">
                    {i === 5
                      ? vi
                        ? "the reference itself is passed by use of call-by-value — Schildt, tr.134"
                        : "the reference itself is passed by use of call-by-value — Schildt, p.134"
                      : vi
                        ? "một object, hai mũi tên cùng chỉ vào"
                        : "one object, two arrows into it"}
                  </text>
                )}
              </>
            );
          }}
        </Walkthrough>

        <Trap>
          <p>
            <Tr
              vi={
                <>
                  Vì bản sao là bản sao của <em>mũi tên</em>, gán lại tham số bên trong method{" "}
                  <strong>không</strong> ảnh hưởng gì tới người gọi. <code>o = new Test(0, 0)</code> chỉ đổi bản
                  sao. Đây là lý do không viết được <code>swap()</code> trong Java.
                </>
              }
              en={
                <>
                  Because the copy is a copy of the <em>arrow</em>, reassigning the parameter inside the method
                  does <strong>nothing</strong> to the caller. <code>o = new Test(0, 0)</code> only changes the
                  copy. This is why you cannot write <code>swap()</code> in Java.
                </>
              }
            />
          </p>
        </Trap>
      </Sec>

      {/* ------------------------------------------------------------ 2.2 */}
      <Sec n="2.2" t={s(T.s2)}>
        <P>
          <Tr
            vi={
              <>
                <strong><code>static</code> thuộc về class, không thuộc về object.</strong> Schildt nói rõ: một
                thành viên static "can be accessed before any objects of its class are created". Bộ đếm số object
                đã tạo phải là static, vì nó là con số của cả class.
              </>
            }
            en={
              <>
                <strong><code>static</code> belongs to the class, not to an object.</strong> Schildt puts it
                plainly: a static member "can be accessed before any objects of its class are created". A counter
                of objects created must be static, because it is the class's number.
              </>
            }
          />
        </P>
        <Code>{`class Test {
  static int count = 0;    // một bản duy nhất cho cả class
  final int id;            // gán một lần, mỗi object một cái
  int a, b;

  Test(int i, int j) {
    this.a = i;            // this: phân biệt trường với tham số
    this.b = j;
    this.id = ++count;
  }
}`}</Code>
        <Src vi={s(T.s2src)} en={s(T.s2src)} />
        <Table
          head={vi ? ["", "static", "final"] : ["", "static", "final"]}
          rows={
            vi
              ? [
                  ["Trên biến", "một bản dùng chung cho cả class", "gán đúng một lần rồi khoá"],
                  ["Trên method", "gọi không cần object, không override được", "lớp con không override được"],
                  ["Trên class", "chỉ dùng cho class lồng bên trong", "không ai kế thừa được"],
                ]
              : [
                  ["On a field", "one copy shared by the whole class", "assigned exactly once, then locked"],
                  ["On a method", "callable without an object, cannot be overridden", "subclasses cannot override it"],
                  ["On a class", "only for a nested class", "nobody can extend it"],
                ]
          }
        />
        <Trap>
          <p>
            <Tr
              vi={
                <>
                  <code>final</code> trên một biến kiểu class <strong>chỉ khoá mũi tên, không khoá ruột</strong> —
                  đúng cái quy tắc ở mục 2.1. <code>final List&lt;String&gt; names</code> vẫn{" "}
                  <code>add()</code> được thoải mái, chỉ là không gán sang list khác được.
                </>
              }
              en={
                <>
                  <code>final</code> on a class-typed variable <strong>locks the arrow, not the contents</strong> —
                  the same rule as 2.1. <code>final List&lt;String&gt; names</code> still takes{" "}
                  <code>add()</code> all day; you just cannot point it at a different list.
                </>
              }
            />
          </p>
        </Trap>
        <P>
          <Tr
            vi={
              <>
                Thứ tự khởi tạo khi <code>new</code>: khối <code>static</code> chạy một lần lúc class được nạp →
                khối khởi tạo thường → constructor. Lớp cha xong hết mới tới lớp con.
              </>
            }
            en={
              <>
                Initialisation order on <code>new</code>: the <code>static</code> block runs once when the class
                loads → instance initialiser → constructor. The superclass finishes all of that before the
                subclass starts.
              </>
            }
          />
        </P>
      </Sec>

      {/* ------------------------------------------------------------ 2.3 */}
      <Sec n="2.3" t={s(T.s3)}>
        <Table
          head={vi ? ["", "Checked", "Unchecked"] : ["", "Checked", "Unchecked"]}
          rows={
            vi
              ? [
                  ["Gốc", <><code key="a">Exception</code></>, <><code key="b">RuntimeException</code></>],
                  ["Bắt buộc khai báo", "có — không catch thì không compile", "không"],
                  ["Ý nghĩa", "chuyện ngoài tầm kiểm soát: mất mạng, mất file", "lỗi lập trình: null, chia 0, index sai"],
                  ["Ví dụ", <><code key="c">IOException</code></>, <><code key="d">NullPointerException</code></>],
                ]
              : [
                  ["Root", <><code key="a">Exception</code></>, <><code key="b">RuntimeException</code></>],
                  ["Must be declared", "yes — no catch, no compile", "no"],
                  ["Means", "outside your control: network gone, file missing", "a programming error: null, divide by zero, bad index"],
                  ["Example", <><code key="c">IOException</code></>, <><code key="d">NullPointerException</code></>],
                ]
          }
        />
        <P>
          <Tr
            vi={
              <>
                <code>Error</code> là nhánh thứ ba và <strong>đừng bắt nó</strong>:{" "}
                <code>OutOfMemoryError</code>, <code>StackOverflowError</code> là chuyện của máy ảo.
              </>
            }
            en={
              <>
                <code>Error</code> is the third branch and <strong>you do not catch it</strong>:{" "}
                <code>OutOfMemoryError</code> and <code>StackOverflowError</code> are the VM's business.
              </>
            }
          />
        </P>

        <Code>{`// Demonstrate finally.
class FinallyDemo {
  // Through an exception out of the method.
  static void procA() {
    try {
      System.out.println("inside procA");
      throw new RuntimeException("demo");
    } finally {
      System.out.println("procA's finally");
    }
  }

  // Return from within a try block.
  static void procB() {
    try {
      System.out.println("inside procB");
      return;
    } finally {
      System.out.println("procB's finally");
    }
  }

  // Execute a try block normally.
  static void procC() {
    try {
      System.out.println("inside procC");
    } finally {
      System.out.println("procC's finally");
    }
  }

  public static void main(String args[]) {
    try { procA(); } catch (Exception e) {
      System.out.println("Exception caught");
    }
    procB();
    procC();
  }
}`}</Code>
        <Src vi={s(T.s3src)} en={s(T.s3src)} />

        <Walkthrough
          viewBox="0 0 720 288"
          aria={
            vi
              ? "Ba method thoát khỏi try theo ba đường khác nhau, cả ba đều chạy finally trước khi rời đi"
              : "Three methods leave their try block by three different routes, and all three run finally before leaving"
          }
          hold={2200}
          steps={finallySteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 2.3" : "Figure 2.3"}</span>
              {s(T.fig3)}
              <Key
                items={
                  vi
                    ? [
                        { c: "ok", t: "finally đã chạy" },
                        { c: "warn", t: "đang giữ tạm" },
                        { c: "bad", t: "giá trị hoặc lỗi bị mất" },
                      ]
                    : [
                        { c: "ok", t: "finally has run" },
                        { c: "warn", t: "parked, not returned" },
                        { c: "bad", t: "value or error lost" },
                      ]
                }
              />
            </>
          }
        >
          {(i) => {
            const procs = [
              { n: "procA()", exit: vi ? "ném exception" : "throws", en: "throws" },
              { n: "procB()", exit: vi ? "return" : "return", en: "return" },
              { n: "procC()", exit: vi ? "chạy hết" : "runs out", en: "runs out" },
            ];
            const active = i <= 1 ? 0 : i <= 3 ? 1 : i === 4 ? 2 : 1;
            const broken = i === 5;
            const out = [
              "inside procA",
              "procA's finally",
              "Exception caught",
              "inside procB",
              "procB's finally",
              "inside procC",
              "procC's finally",
            ];
            const shown = i === 0 ? 1 : i === 1 ? 3 : i === 2 ? 4 : i === 3 ? 5 : 7;
            return (
              <>
                {procs.map((pr, n) => {
                  const on = n === active;
                  const role = broken && n === 1 ? "bad" : on ? (i === 0 || i === 2 ? "warn" : "ok") : undefined;
                  return (
                    <g key={pr.n} data-c={role}>
                      <rect x={16} y={40 + n * 72} width={320} height={56} className={on ? "d-box-fill" : "d-box"} />
                      <Ic
                        n={broken && n === 1 ? "trash" : n === 0 ? "alert" : n === 1 ? "send" : "check"}
                        x={32}
                        y={56 + n * 72}
                        s={16}
                        c={role}
                      />
                      <text x={58} y={68 + n * 72} className="d-b">{pr.n}</text>
                      <text x={32} y={88 + n * 72} className="d-m">
                        {broken && n === 1 ? (vi ? "return trong finally" : "return inside finally") : pr.exit}
                        {" → finally"}
                      </text>
                    </g>
                  );
                })}

                <text x="392" y="24" className="d-s">{vi ? "MÀN HÌNH IN RA" : "PRINTED OUTPUT"}</text>
                <rect x="392" y="32" width="304" height="216" className="d-box" />
                {out.slice(0, shown).map((line, n) => (
                  <text key={n} x={408} y={56 + n * 28} className="d-m" data-enter="">
                    {line}
                  </text>
                ))}
                {broken && (
                  <g data-enter="" data-c="bad">
                    <line x1="400" y1="140" x2="688" y2="140" className="d-l" />
                    <text x="408" y="164" className="d-m">{vi ? "procB không bao giờ trả giá trị thật" : "procB never returns its real value"}</text>
                  </g>
                )}

                <text x="16" y="272" className="d-s">
                  {i <= 1
                    ? vi
                      ? "thoát bằng exception — finally vẫn chạy trên đường ra"
                      : "left by exception — finally still runs on the way out"
                    : i <= 3
                      ? vi
                        ? "thoát bằng return — finally chạy TRƯỚC khi method rời đi"
                        : "left by return — finally runs BEFORE the method leaves"
                      : i === 4
                        ? vi
                          ? "không lỗi, không return sớm — finally vẫn chạy"
                          : "no error, no early return — finally still runs"
                        : vi
                          ? "return trong finally vứt cả giá trị lẫn exception đang bay"
                          : "a return inside finally discards both the value and the exception in flight"}
                </text>
              </>
            );
          }}
        </Walkthrough>

        <P>
          <Tr
            vi={
              <>
                Cách tránh cả hai cái bẫy: <strong>đừng tự viết <code>finally</code> để đóng tài nguyên</strong>.
                Dùng try-with-resources — trình biên dịch sinh khối dọn dẹp đúng cách, và exception lúc đóng được{" "}
                <em>gắn kèm</em> thay vì nuốt mất.
              </>
            }
            en={
              <>
                How to avoid both traps: <strong>do not hand-write <code>finally</code> to close things</strong>.
                Use try-with-resources — the compiler emits the cleanup correctly, and an exception thrown while
                closing is <em>suppressed and attached</em> rather than swallowed.
              </>
            }
          />
        </P>
        <Code>{`try (Scanner sc = new Scanner(new File("data.txt"))) {
  return sc.nextLine();
}   // sc.close() chạy tự động, kể cả khi có exception`}</Code>
        <Limit>
          <Tr
            vi={
              <>
                try-with-resources chỉ nhận object hiện thực <code>AutoCloseable</code>. Thứ gì không hiện thực nó
                — một khoá tự viết, một bộ đếm — vẫn phải dùng <code>finally</code> thủ công, và hai cái bẫy ở
                trên quay lại đầy đủ.
              </>
            }
            en={
              <>
                try-with-resources only accepts an <code>AutoCloseable</code>. Anything that is not one — a lock
                you wrote, a counter — still needs a hand-written <code>finally</code>, and both traps above come
                straight back.
              </>
            }
          />
        </Limit>
      </Sec>

      {/* ------------------------------------------------------------ 2.4 */}
      <Sec n="2.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                Generic là <strong>kiểm tra lúc biên dịch</strong>. Xong bước đó, trình biên dịch <em>xoá</em>{" "}
                tham số kiểu đi — Schildt gọi đúng tên: <em>erasure</em>. Mọi thứ kỳ lạ còn lại đều là hệ quả của
                nó.
              </>
            }
            en={
              <>
                Generics are a <strong>compile-time check</strong>. After it, the compiler <em>removes</em> the
                type parameter — Schildt names it: <em>erasure</em>. Everything strange that remains follows from
                that.
              </>
            }
          />
        </P>
        <Code>{`// A simple generic class.
class Gen<T> {
  T ob;                        // declare an object of type T

  Gen(T o) { ob = o; }

  T getob() { return ob; }

  void showType() {
    System.out.println("Type of T is " + ob.getClass().getName());
  }
}

Gen<Integer> iOb = new Gen<Integer>(88);
Gen<String>  sOb = new Gen<String>("Generics Test");

iOb.getClass() == sOb.getClass()   // true — lúc chạy chỉ còn một class Gen`}</Code>
        <Src vi={s(T.s4src)} en={s(T.s4src)} />
        <P>
          <Tr
            vi={
              <>
                Sách nói thẳng chỗ này: <em>"the compiler removes all generic type information, substituting the
                necessary casts… there is really only one version of Gen that actually exists in your program."</em>
              </>
            }
            en={
              <>
                The book says it outright: <em>"the compiler removes all generic type information, substituting
                the necessary casts… there is really only one version of Gen that actually exists in your
                program."</em>
              </>
            }
          />
        </P>
        <Table
          head={vi ? ["Hệ quả của erasure", "Nghĩa là"] : ["Consequence of erasure", "Meaning"]}
          rows={
            vi
              ? [
                  [<><code key="a">new T[10]</code> không được</>, "lúc chạy không ai biết T là gì để cấp phát"],
                  [<><code key="b">x instanceof Gen&lt;String&gt;</code> không được</>, "thông tin đó không còn tồn tại"],
                  ["Không overload theo tham số kiểu", "sau khi xoá kiểu, hai method thành trùng chữ ký"],
                  ["Kiểu nguyên thuỷ phải bọc lại", <><code key="c">Gen&lt;int&gt;</code> không hợp lệ, phải <code key="d">Gen&lt;Integer&gt;</code></>],
                ]
              : [
                  [<><code key="a">new T[10]</code> is illegal</>, "at run time nobody knows what T is, so nothing can be allocated"],
                  [<><code key="b">x instanceof Gen&lt;String&gt;</code> is illegal</>, "that information no longer exists"],
                  ["No overloading on the type argument", "after erasure the two methods have identical signatures"],
                  ["Primitives must be boxed", <><code key="c">Gen&lt;int&gt;</code> is invalid; it must be <code key="d">Gen&lt;Integer&gt;</code></>],
                ]
          }
        />
        <P>
          <Tr
            vi={
              <>
                <strong>PECS — Producer Extends, Consumer Super.</strong> Cái giỏ bạn chỉ <em>lấy ra</em> thì khai{" "}
                <code>? extends</code>; cái giỏ bạn chỉ <em>bỏ vào</em> thì khai <code>? super</code>.
              </>
            }
            en={
              <>
                <strong>PECS — Producer Extends, Consumer Super.</strong> A container you only <em>read from</em>{" "}
                is declared <code>? extends</code>; one you only <em>write into</em> is <code>? super</code>.
              </>
            }
          />
        </P>
        <Trap>
          <p>
            <Tr
              vi={
                <>
                  <code>List&lt;Integer&gt;</code> <strong>không phải</strong> <code>List&lt;Number&gt;</code>, dù{" "}
                  <code>Integer</code> là <code>Number</code>. Nếu Java cho phép, bạn sẽ bỏ được một{" "}
                  <code>Double</code> vào list số nguyên và compiler không cản được. Wildcard sinh ra để lấp đúng
                  chỗ đó một cách an toàn.
                </>
              }
              en={
                <>
                  <code>List&lt;Integer&gt;</code> is <strong>not</strong> a <code>List&lt;Number&gt;</code>, even
                  though <code>Integer</code> is a <code>Number</code>. If Java allowed it you could drop a{" "}
                  <code>Double</code> into a list of integers and the compiler could not stop you. Wildcards exist
                  to close exactly that hole safely.
                </>
              }
            />
          </p>
        </Trap>
      </Sec>

      {/* ------------------------------------------------------------ 2.5 */}
      <Sec n="2.5" t={s(T.s5)}>
        <Src vi={s(T.s5src)} en={s(T.s5src)} />
        <P>
          <Tr
            vi={
              <>
                <strong>Functional interface</strong> là interface có đúng một method trừu tượng. Lambda là cách
                viết ngắn cho một hiện thực của nó — không huyền bí hơn thế.
              </>
            }
            en={
              <>
                A <strong>functional interface</strong> has exactly one abstract method. A lambda is shorthand for
                an implementation of it — nothing more mysterious than that.
              </>
            }
          />
        </P>
        <Table
          head={vi ? ["Interface", "Nhận → trả", "Dùng ở"] : ["Interface", "Takes → returns", "Used by"]}
          rows={[
            [<code key="a">Predicate&lt;T&gt;</code>, "T → boolean", <code key="b">filter</code>],
            [<code key="c">Function&lt;T,R&gt;</code>, "T → R", <code key="d">map</code>],
            [<code key="e">Consumer&lt;T&gt;</code>, vi ? "T → không gì" : "T → nothing", <code key="f">forEach</code>],
            [<code key="g">Supplier&lt;T&gt;</code>, vi ? "không gì → T" : "nothing → T", <code key="h">orElseGet</code>],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Điều quan trọng nhất về stream không nằm ở cú pháp mà ở <strong>thứ tự chạy</strong>. Các toán tử
                trung gian — <code>filter</code>, <code>map</code>, <code>sorted</code> — không làm gì cả cho tới
                khi một toán tử kết thúc kéo dữ liệu đi.
              </>
            }
            en={
              <>
                The important thing about streams is not the syntax but the <strong>order of execution</strong>.
                Intermediate operations — <code>filter</code>, <code>map</code>, <code>sorted</code> — do nothing
                at all until a terminal operation pulls.
              </>
            }
          />
        </P>
        <Code>{`List<String> names = List.of("Ann", "Bob", "Ada", "Cy");

names.stream()
     .filter(n -> n.startsWith("A"))
     .map(String::toUpperCase)
     .findFirst();               // Optional[ANN]`}</Code>

        <Walkthrough
          viewBox="0 0 720 296"
          aria={
            vi
              ? "Stream đưa từng phần tử đi hết dây chuyền rồi mới tới phần tử sau, và dừng hẳn khi findFirst đã có kết quả"
              : "A stream takes one element through every stage before the next, and stops entirely once findFirst has a result"
          }
          hold={2000}
          steps={streamSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 2.5" : "Figure 2.5"}</span>
              {s(T.fig5)}
              <Key
                items={
                  vi
                    ? [
                        { c: "info", t: "đang đi qua dây chuyền" },
                        { c: "ok", t: "kết quả lấy được" },
                        { c: "warn", t: "không bao giờ được đụng tới" },
                      ]
                    : [
                        { c: "info", t: "moving through the pipeline" },
                        { c: "ok", t: "the result" },
                        { c: "warn", t: "never touched" },
                      ]
                }
              />
            </>
          }
        >
          {(i) => {
            const items = ["Ann", "Bob", "Ada", "Cy"];
            const stages = [
              { t: "filter", d: 'startsWith("A")', at: 1, ic: "filter" as const },
              { t: "map", d: "toUpperCase", at: 2, ic: "code" as const },
              { t: "findFirst", d: vi ? "lấy 1 rồi dừng" : "take 1, stop", at: 3, ic: "check" as const },
            ];
            const skipped = i >= 4;
            return (
              <>
                <text x="16" y="24" className="d-s">{vi ? "NGUỒN" : "SOURCE"}</text>
                {items.map((it, n) => {
                  const moving = n === 0 && i >= 1;
                  const dead = n > 0 && skipped;
                  return (
                    <g key={it} data-c={moving ? "info" : dead ? "warn" : undefined}>
                      <rect x={16} y={40 + n * 56} width={144} height={40} className={dead ? "d-box-out" : moving ? "d-box-fill" : "d-box"} />
                      <text x={32} y={64 + n * 56} className={dead ? "d-s" : "d-m"}>{it}</text>
                    </g>
                  );
                })}
                {skipped && (
                  <g data-enter="" data-c="warn">
                    <Ic n="eye" x={16} y={272} s={16} c="warn" />
                    <text x="40" y="285" className="d-m">{vi ? "ba phần tử dưới: 0 lần được nhìn tới" : "the three below: looked at 0 times"}</text>
                  </g>
                )}

                {stages.map((st, n) => {
                  const active = i === st.at;
                  const done = i > st.at;
                  const role = active ? (n === 2 ? "ok" : "info") : done ? "ok" : undefined;
                  return (
                    <g key={st.t} data-c={role}>
                      <rect x={216 + n * 168} y={40} width={136} height={104} className={active || done ? "d-box-fill" : "d-box"} />
                      <Ic n={st.ic} x={232 + n * 168} y={56} s={18} c={role} />
                      <text x={262 + n * 168} y={70} className="d-b">{st.t}</text>
                      <text x={232 + n * 168} y={102} className="d-s">{st.d}</text>
                      <text x={232 + n * 168} y={128} className={active || done ? "d-m" : "d-s"}>
                        {i === 0 ? (vi ? "chờ" : "idle") : i > n ? (n === 1 ? "ANN" : "Ann") : "—"}
                      </text>
                    </g>
                  );
                })}

                <line x1="160" y1="60" x2="208" y2="88" className={i >= 1 ? "d-l" : "d-l-q"} markerEnd={i >= 1 ? "url(#pa-info)" : "url(#pa)"} data-c={i >= 1 ? "info" : undefined} />
                {[0, 1].map((n) => (
                  <line
                    key={n}
                    x1={352 + n * 168}
                    y1={92}
                    x2={208 + (n + 1) * 168}
                    y2={92}
                    className={i >= n + 2 ? "d-l" : "d-l-q"}
                    markerEnd={i >= n + 2 ? "url(#pa-info)" : "url(#pa)"}
                    data-c={i >= n + 2 ? "info" : undefined}
                  />
                ))}

                {i === 0 && (
                  <text x="216" y="176" className="d-s" data-enter="">
                    {vi
                      ? "chưa có findFirst thì cả ba tầng chỉ là mô tả, không tầng nào chạy"
                      : "without findFirst all three stages are just a description; none of them runs"}
                  </text>
                )}
                {i === 3 && (
                  <g data-enter="" data-c="ok">
                    <Ic n="check" x={216} y={164} s={16} c="ok" />
                    <text x="240" y="177" className="d-m">
                      {vi ? "Optional[ANN] — xong sau đúng 1 phần tử" : "Optional[ANN] — done after exactly 1 element"}
                    </text>
                  </g>
                )}
                {i === 5 && (
                  <g data-enter="">
                    <text x="216" y="177" className="d-m">{vi ? "2 lượt xử lý" : "2 operations"}</text>
                    <text x="216" y="199" className="d-s">
                      {vi ? "hai vòng for tuần tự cần 6 — lọc 4, map 2" : "two sequential loops need 6 — filter 4, map 2"}
                    </text>
                  </g>
                )}
              </>
            );
          }}
        </Walkthrough>

        <Trap>
          <p>
            <Tr
              vi={
                <>
                  Một stream <strong>chỉ dùng được một lần</strong>. Gọi toán tử kết thúc lần thứ hai trên cùng
                  biến stream sẽ ném <code>IllegalStateException</code>.
                </>
              }
              en={
                <>
                  A stream is <strong>single-use</strong>. A second terminal operation on the same stream variable
                  throws <code>IllegalStateException</code>.
                </>
              }
            />
          </p>
          <p>
            <Tr
              vi={
                <>
                  Và <code>parallelStream()</code> không phải nút tăng tốc: nó chia việc cho ForkJoinPool chung
                  của cả JVM. Với danh sách nhỏ, chi phí chia và gộp lớn hơn phần tiết kiệm được.
                </>
              }
              en={
                <>
                  And <code>parallelStream()</code> is not a speed switch: it hands work to the JVM-wide common
                  ForkJoinPool. On a small list, splitting and joining costs more than it saves.
                </>
              }
            />
          </p>
        </Trap>
      </Sec>

      {/* ------------------------------------------------------------ 2.6 */}
      <Sec n="2.6" t={s(T.s6)}>
        <Src vi={s(T.s6src)} en={s(T.s6src)} />
        <P>
          <Tr
            vi={
              <>
                <code>Optional</code> sinh ra để nói một câu: <em>ở đây có thể không có gì, và bạn buộc phải nghĩ
                tới chuyện đó</em>. Nó là kiểu trả về, không phải thứ để nhét vào mọi chỗ.
              </>
            }
            en={
              <>
                <code>Optional</code> exists to say one thing: <em>there may be nothing here, and you are forced
                to think about it</em>. It is a return type, not something to sprinkle everywhere.
              </>
            }
          />
        </P>
        <Code>{`Optional<String> found = repo.findName(id);

// đúng
String label = found.orElse("chưa có tên");
found.ifPresent(n -> print(n));

// sai — chỉ là if (x != null) viết dài dòng hơn
if (found.isPresent()) { print(found.get()); }`}</Code>
        <Table
          head={vi ? ["Chỗ dùng", "Nên không"] : ["Where", "Should you"]}
          rows={
            vi
              ? [
                  ["Kiểu trả về của method", "nên — đây là chỗ nó sinh ra để dùng"],
                  ["Trường trong class", "không — không serialize được, và làm object nặng thêm vô ích"],
                  ["Tham số của method", "không — người gọi phải bọc lại, phiền hơn là nhận null"],
                  ["Trong collection", <><code key="a">List&lt;Optional&lt;T&gt;&gt;</code> gần như luôn là dấu hiệu thiết kế sai</>],
                ]
              : [
                  ["A method return type", "yes — this is what it was made for"],
                  ["A field", "no — not serialisable, and it makes the object heavier for nothing"],
                  ["A parameter", "no — the caller has to wrap, which is worse than accepting null"],
                  ["Inside a collection", <><code key="a">List&lt;Optional&lt;T&gt;&gt;</code> is almost always a design smell</>],
                ]
          }
        />
        <P>
          <Tr
            vi={
              <>
                <code>orElse</code> và <code>orElseGet</code> khác nhau ở chỗ dễ bỏ sót:{" "}
                <strong><code>orElse</code> tính giá trị mặc định ngay cả khi không cần</strong>. Nếu giá trị đó
                phải gọi database mới có thì dùng <code>orElseGet</code>.
              </>
            }
            en={
              <>
                The difference between <code>orElse</code> and <code>orElseGet</code> is easy to miss:{" "}
                <strong><code>orElse</code> evaluates its default even when it is not needed</strong>. If that
                default costs a database call, use <code>orElseGet</code>.
              </>
            }
          />
        </P>
      </Sec>

      {/* ------------------------------------------------------------ 2.7 */}
      <Sec n="2.7" t={s(T.s7)}>
        <Src vi={s(T.s7src)} en={s(T.s7src)} />
        <P>
          <Tr
            vi={
              <>
                <strong><code>enum</code> không chỉ là danh sách hằng số</strong> — Schildt dành cả một mục cho
                điều này: enum là class đầy đủ, có trường, constructor và method. Đây là chỗ nhiều người dừng lại
                quá sớm.
              </>
            }
            en={
              <>
                <strong>An <code>enum</code> is not just a list of constants</strong> — Schildt gives this its own
                section: an enum is a full class with fields, a constructor and methods. This is where most people
                stop too early.
              </>
            }
          />
        </P>
        <Code>{`enum Apple {
  Jonathan(10), GoldenDel(9), RedDel(12), Winesap(15), Cortland(8);

  private int price;
  Apple(int p) { price = p; }
  int getPrice() { return price; }
}`}</Code>
        <Trap>
          <p>
            <Tr
              vi={
                <>
                  Dùng <code>EnumMap</code> và <code>EnumSet</code> thay cho <code>HashMap</code> khi khoá là
                  enum: chúng dựa trên một mảng đánh theo thứ tự khai báo, nên không cần băm và không có va chạm.
                </>
              }
              en={
                <>
                  Reach for <code>EnumMap</code> and <code>EnumSet</code> instead of <code>HashMap</code> when the
                  key is an enum: they are arrays indexed by declaration order, so there is no hashing and no
                  collision.
                </>
              }
            />
          </p>
        </Trap>
        <P>
          <Tr
            vi={
              <>
                <strong><code>record</code></strong> (Java 16) là class chỉ để chở dữ liệu: một dòng khai báo sinh
                ra constructor, getter, <code>equals</code>, <code>hashCode</code>, <code>toString</code>, và tất
                cả đều <code>final</code>. <strong><code>sealed</code></strong> (Java 17) khai báo trước danh sách
                lớp con được phép có — nhờ đó <code>switch</code> thiếu một nhánh trở thành lỗi biên dịch.
              </>
            }
            en={
              <>
                A <strong><code>record</code></strong> (Java 16) is a class that only carries data: one line gives
                you the constructor, accessors, <code>equals</code>, <code>hashCode</code> and{" "}
                <code>toString</code>, all of it <code>final</code>. <strong><code>sealed</code></strong> (Java
                17) declares the permitted subclasses up front, which turns a <code>switch</code> missing a branch
                into a compile error.
              </>
            }
          />
        </P>
        <Code>{`record Point(int x, int y) { }

Point a = new Point(3, 4);
Point b = new Point(3, 4);
a.equals(b)      // true — record so sánh theo từng trường`}</Code>
      </Sec>

      {/* ------------------------------------------------------------ 2.8 */}
      <Sec n="2.8" t={s(T.s8)}>
        <Src vi={s(T.s8src)} en={s(T.s8src)} />
        <P>
          <Tr
            vi={
              <>
                Schildt viết rõ: <em>"String objects are immutable… once you create a String object, its contents
                cannot be altered."</em> Bốn hệ quả khoá lẫn nhau: dùng chung được qua String pool; an toàn khi
                làm tham số nhạy cảm; cache được <code>hashCode</code> nên làm khoá <code>HashMap</code> lý tưởng;
                và mặc nhiên an toàn giữa nhiều luồng.
              </>
            }
            en={
              <>
                Schildt states it plainly: <em>"String objects are immutable… once you create a String object, its
                contents cannot be altered."</em> Four consequences that lock together: it can be shared through
                the string pool; it is safe as a sensitive parameter; its <code>hashCode</code> can be cached,
                which makes it an ideal <code>HashMap</code> key; and it is thread-safe for free.
              </>
            }
          />
        </P>
        <Code>{`String a = "java";
String b = "java";
String c = new String("java");

a == b                 // true  — cùng một object trong pool
a == c                 // false — new luôn tạo object mới ngoài pool
a.equals(c)            // true  — so nội dung
c.intern() == a        // true  — intern() đưa về pool`}</Code>
        <P>
          <Tr
            vi={
              <>
                Bất biến là thứ bạn tự dựng được cho class của mình, và nó cần <strong>hai</strong> việc, không
                phải một:
              </>
            }
            en={<>Immutability is something you can build for your own class, and it takes <strong>two</strong> moves, not one:</>}
          />
        </P>
        <Code>{`final class Guests {
  private final List<String> names;

  Guests(List<String> names) {
    this.names = List.copyOf(names);   // 1 · chép vào
  }

  List<String> names() {
    return names;                       // 2 · đã bất biến nên trả thẳng được
  }
}`}</Code>
        <P>
          <Tr
            vi={
              <>
                Thiếu dòng 1, người đưa list vào vẫn giữ tay lái và sửa được từ bên ngoài. Thiếu dòng 2 — nếu{" "}
                <code>names</code> là list thường — thì người nhận sửa được. <strong>Object chỉ bất biến khi cả
                hai cửa cùng đóng.</strong>
              </>
            }
            en={
              <>
                Without move 1 the caller still holds the wheel and can mutate from outside. Without move 2 — if{" "}
                <code>names</code> were an ordinary list — the receiver can. <strong>An object is immutable only
                when both doors are shut.</strong>
              </>
            }
          />
        </P>
      </Sec>

      {/* ------------------------------------------------------------ 2.9 */}
      <Sec n="2.9" t={s(T.s9)}>
        <Src vi={s(T.s9src)} en={s(T.s9src)} />
        <P>
          <Tr
            vi={
              <>
                Hợp đồng ba điều khoản nằm ở mục 4.4. Ở đây là phần hiện thực, và cái bẫy chỉ hiện ra khi object
                đã nằm trong một <code>HashSet</code> rồi mới bị sửa.
              </>
            }
            en={
              <>
                The three-clause contract is in 4.4. Here is the implementation, and the trap that only appears
                once the object is already inside a <code>HashSet</code> and then gets modified.
              </>
            }
          />
        </P>
        <Code>{`@Override
public boolean equals(Object o) {
  if (this == o) return true;
  if (!(o instanceof Point p)) return false;
  return x == p.x && y == p.y;
}

@Override
public int hashCode() {
  return Objects.hash(x, y);       // PHẢI cùng bộ trường với equals
}`}</Code>

        <Walkthrough
          viewBox="0 0 720 272"
          aria={
            vi
              ? "Một object được cất vào ô theo hash, sau đó trường bị đổi nên lần tìm sau đi tới ô khác và không thấy gì"
              : "An object is stored in a bucket by its hash, a field is then changed, and the next lookup goes to a different bucket and finds nothing"
          }
          hold={2200}
          steps={hashSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 2.9" : "Figure 2.9"}</span>
              {s(T.fig9)}
              <Key
                items={
                  vi
                    ? [
                        { c: "ok", t: "cất và tìm thấy" },
                        { c: "info", t: "đang tính hash" },
                        { c: "bad", t: "tìm không ra" },
                      ]
                    : [
                        { c: "ok", t: "stored and found" },
                        { c: "info", t: "computing the hash" },
                        { c: "bad", t: "not found" },
                      ]
                }
              />
            </>
          }
        >
          {(i) => {
            const changed = i >= 3;
            const bucket = changed ? 6 : 3;
            const stored = i >= 2;
            const lost = i >= 5;
            return (
              <>
                <g data-c={changed ? "bad" : undefined}>
                  <rect x="16" y="32" width="200" height="64" className="d-box" />
                  <Ic n="box" x={32} y={48} s={18} c={changed ? "bad" : undefined} />
                  <text x="62" y="62" className="d-b">Point</text>
                  <text x="32" y="86" className="d-m">x = {changed ? "9" : "1"}, y = 2</text>
                </g>

                <line x1="216" y1="64" x2="264" y2="64" className="d-l" markerEnd="url(#pa)" />
                <g data-c={i === 1 || i === 4 ? "info" : undefined}>
                  <rect x="272" y="32" width="160" height="64" className={i === 1 || i === 4 ? "d-box-fill" : "d-box"} />
                  <Ic n="hash" x={288} y={48} s={18} c={i === 1 || i === 4 ? "info" : undefined} />
                  <text x="318" y="62" className="d-b">hashCode()</text>
                  <text x="288" y="86" className="d-m">{vi ? (changed ? "→ ô 6" : "→ ô 3") : changed ? "→ bucket 6" : "→ bucket 3"}</text>
                </g>

                <line x1="432" y1="64" x2="480" y2="64" className="d-l" markerEnd="url(#pa)" />
                <g data-c={lost ? "bad" : stored && !changed ? "ok" : undefined}>
                  <rect x="488" y="32" width="200" height="64" className={stored || changed ? "d-box-fill" : "d-box"} />
                  {(lost || (stored && !changed)) && (
                    <Ic n={lost ? "x" : "check"} x={504} y={48} s={18} c={lost ? "bad" : "ok"} />
                  )}
                  <text x={lost || (stored && !changed) ? 534 : 504} y="62" className="d-b">
                    {i < 2
                      ? vi ? "chưa cất" : "not stored"
                      : lost
                        ? "contains → false"
                        : changed
                          ? vi ? "đang tìm…" : "looking…"
                          : "contains → true"}
                  </text>
                  <text x="504" y="86" className="d-s">
                    {vi ? (changed ? "đi thẳng tới ô 6" : "đi thẳng tới ô 3") : changed ? "goes straight to 6" : "goes straight to 3"}
                  </text>
                </g>

                <text x="8" y="144" className="d-s">{vi ? "CÁC Ô CỦA HASHSET" : "HASHSET BUCKETS"}</text>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => {
                  const holds = stored && n === 3;
                  const looking = i >= 4 && n === bucket;
                  const role = looking && n === 6 ? "bad" : holds && i < 3 ? "ok" : looking ? "info" : undefined;
                  return (
                    <g key={n} data-c={role}>
                      <rect x={8 + n * 88} y={160} width={80} height={56} className={holds ? "d-box-fill" : looking ? "d-box-a" : "d-box"} />
                      <text x={48 + n * 88} y={182} className="d-s" textAnchor="middle">{n}</text>
                      {holds && (
                        <text x={48 + n * 88} y={204} className="d-m" textAnchor="middle">
                          Point
                        </text>
                      )}
                      {looking && !holds && (
                        <g data-enter="">
                          <Ic n="search" x={38 + n * 88} y={190} s={16} c={n === 6 ? "bad" : "info"} />
                        </g>
                      )}
                    </g>
                  );
                })}

                <text x="8" y="248" className="d-s">
                  {i <= 2
                    ? vi
                      ? "hashCode quyết định ô, equals chỉ được gọi khi đã tới đúng ô"
                      : "hashCode picks the bucket; equals is only called once you are in the right one"
                    : i === 3
                      ? vi
                        ? "object không di chuyển — HashSet không hề biết trường vừa đổi"
                        : "the object does not move — HashSet has no idea the field changed"
                      : i === 4
                        ? vi
                          ? "lần tìm này dùng hash mới, nên nó không bao giờ ghé qua ô 3"
                          : "this lookup uses the new hash, so it never visits bucket 3"
                        : vi
                          ? "object vẫn chiếm bộ nhớ trong ô 3 và không còn đường nào lấy ra"
                          : "the object still holds memory in bucket 3 with no way back to it"}
                </text>
                {lost && (
                  <g data-enter="" data-c="bad">
                    <Ic n="alert" x={520} y={236} s={16} c="bad" />
                    <text x="544" y="249" className="d-m">{vi ? "rò rỉ bộ nhớ kiểu im lặng" : "a silent memory leak"}</text>
                  </g>
                )}
              </>
            );
          }}
        </Walkthrough>

        <Limit>
          <Tr
            vi={
              <>
                <code>Objects.hash(...)</code> tạo một mảng và bọc từng tham số, nên nó không miễn phí. Trên đường
                chạy nóng — một <code>equals</code> gọi hàng triệu lần mỗi giây — người ta viết tay công thức{" "}
                <code>31 * result + field</code>. Ở mọi chỗ khác thì tối ưu điều này là tối ưu sai chỗ.
              </>
            }
            en={
              <>
                <code>Objects.hash(...)</code> allocates an array and boxes every argument, so it is not free. On
                a hot path — an <code>equals</code> called millions of times a second — people hand-write{" "}
                <code>31 * result + field</code>. Anywhere else, optimising this is optimising the wrong thing.
              </>
            }
          />
        </Limit>
      </Sec>
    </div>
  );
}
