import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Src, Tr, say, type Tx } from "../i18n";
import { CodeTr, Defs, Fig, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 04 · Collections.
 *
 * The HashMap walkthrough exists because every step of `put` is a
 * transformation of the same value — hash, mix, mask, land — and a still
 * drawing has to show all four at once, which is exactly when nobody can tell
 * which one produced which.
 *
 * There is no book citation on this page and 4.2 says so. Schildt's 7th edition
 * covers Java 6, and treeified buckets arrived in Java 8; the five constants
 * come from the JDK source itself, which is a better authority than any of the
 * four books would have been anyway.
 */

const T = {
  lede: {
    vi: "HashMap là cấu trúc hay bị hỏi sâu nhất, vì nó vừa được dùng hàng ngày vừa gần như không ai mở ra xem bên trong.",
    en: "HashMap is the structure interviewers dig into hardest, because it is used daily and almost nobody has opened it up.",
  },
  source: { vi: "java.util.HashMap · Java 8 trở đi", en: "java.util.HashMap · Java 8 onwards" },

  /* 4.1 */
  s1: { vi: "Cây thừa kế, rút gọn", en: "The hierarchy, cut down" },
  fig1aria: {
    vi: "Collection chia thành List, Set, Queue; Map đứng riêng không kế thừa Collection",
    en: "Collection splits into List, Set and Queue; Map stands apart and does not extend Collection",
  },
  b1a: { vi: "có thứ tự, trùng được", en: "ordered, duplicates allowed" },
  b1b: { vi: "không trùng", en: "no duplicates" },
  b1c: { vi: "FIFO / ưu tiên", en: "FIFO / priority" },
  d1apart: { vi: "đứng riêng", en: "stands apart" },
  d1pair1: { vi: "lưu cặp key–value,", en: "stores key–value pairs," },
  d1pair2: { vi: "không phải phần tử đơn", en: "not single elements" },

  /* 4.2 */
  s2: { vi: "HashMap.put() — từng bước một", en: "HashMap.put() — one step at a time" },
  fig2aria: {
    vi: "Một key đi qua hashCode, trộn bit, tính chỉ số bucket, rồi nằm vào bảng hoặc va chạm",
    en: "A key passes through hashCode, bit mixing and the bucket index, then lands in the table or collides",
  },
  s2src: {
    vi: 'Mã nguồn java.util.HashMap của OpenJDK — khối chú thích "Implementation notes" và năm hằng số ngay đầu class. Javadoc của TREEIFY_THRESHOLD ghi rõ giá trị "should be at least 8", còn MIN_TREEIFY_CAPACITY được mô tả là "the smallest table capacity for which bins may be treeified".',
    en: 'The java.util.HashMap source in OpenJDK — the "Implementation notes" comment block and the five constants at the head of the class. The javadoc on TREEIFY_THRESHOLD states the value "should be at least 8", and MIN_TREEIFY_CAPACITY is described as "the smallest table capacity for which bins may be treeified".',
  },
  d2mix: { vi: "trộn bit cao xuống", en: "mixes the high bits down" },
  d2chain: { vi: "cùng bucket → nối vào danh sách", en: "same bucket → appended to the list" },
  d2chain2: {
    vi: "so hash trước, rồi mới equals — hash là phép so số nguyên, rẻ hơn",
    en: "compare hashes first, equals second — an int comparison is far cheaper",
  },
  d2tree: { vi: "≥ 8 phần tử VÀ bảng ≥ 64 ô → cây đỏ-đen", en: "≥ 8 entries AND a table of ≥ 64 → red-black tree" },
  d2tree2: {
    vi: "xấu nhất từ O(n) về O(log n). Chưa đủ 64 thì HashMap resize chứ không treeify.",
    en: "worst case from O(n) to O(log n). Below 64, HashMap resizes instead of treeifying.",
  },
  d2empty: {
    vi: "bucket rỗng → đặt vào, xong. Đây là đường chạy thường gặp nhất, O(1).",
    en: "empty bucket → drop it in, done. This is the common path, and it is O(1).",
  },
  t2h1: { vi: "Hằng số", en: "Constant" },
  t2h2: { vi: "Giá trị", en: "Value" },
  t2h3: { vi: "Nghĩa là", en: "Meaning" },
  t2r1: { vi: "số bucket ban đầu", en: "how many buckets to start with" },
  t2r2: { vi: "đầy 75% thì tăng gấp đôi", en: "75% full triggers a doubling" },
  t2r3: { vi: "số phần tử trong một bucket để chuyển sang cây", en: "entries in one bucket before it becomes a tree" },
  t2r4: { vi: "kích thước bảng tối thiểu để được phép treeify", en: "the smallest table size allowed to treeify" },
  t2r5: { vi: "co lại còn 6 thì quay về danh sách", en: "shrink back to 6 and it returns to a list" },
  trap2: { vi: "Chỗ tách hẳn khỏi số đông", en: "Where it breaks from the pack" },

  /* 4.3 */
  s3: { vi: "Vì sao dung lượng luôn là luỹ thừa của 2", en: "Why the capacity is always a power of two" },

  /* 4.4 */
  s4: { vi: "Hợp đồng equals và hashCode", en: "The equals / hashCode contract" },
  t4h1: { vi: "Điều khoản", en: "Clause" },
  t4h2: { vi: "Bắt buộc", en: "Requirement" },
  t4r1a: { vi: "Hai object equals nhau", en: "Two objects that are equal" },
  t4r1b: { vi: "PHẢI có cùng hashCode", en: "MUST have the same hashCode" },
  t4r2a: { vi: "Hai object cùng hashCode", en: "Two objects with the same hashCode" },
  t4r2b: { vi: "không nhất thiết equals — va chạm là hợp lệ", en: "need not be equal — a collision is legal" },
  t4r3a: { vi: "hashCode trong lúc object không đổi", en: "hashCode while the object is unchanged" },
  t4r3b: { vi: "phải ổn định", en: "must stay stable" },

  /* 4.5 */
  s5: { vi: "Chọn cấu trúc nào", en: "Which structure to pick" },
  t5h1: { vi: "Cần gì", en: "What you need" },
  t5h2: { vi: "Dùng", en: "Use" },
  t5h3: { vi: "Vì sao", en: "Why" },
  t5r1a: { vi: "danh sách, truy cập theo chỉ số", en: "a list, indexed access" },
  t5r1c: {
    vi: "O(1), nằm liền trong bộ nhớ nên thân thiện cache CPU",
    en: "O(1), contiguous in memory so it is CPU-cache friendly",
  },
  t5r2a: { vi: "không trùng, không cần thứ tự", en: "no duplicates, order irrelevant" },
  t5r2c: { vi: "O(1) trung bình", en: "O(1) on average" },
  t5r3a: { vi: "không trùng, giữ thứ tự thêm vào", en: "no duplicates, insertion order kept" },
  t5r3c: { vi: "kết quả xác định, dễ viết test", en: "deterministic output, easy to assert on" },
  t5r4a: { vi: "không trùng, sắp xếp", en: "no duplicates, sorted" },
  t5r4c: { vi: "O(log n), có ceiling/floor/headSet", en: "O(log n), with ceiling/floor/headSet" },
  t5r5a: { vi: "hàng đợi hoặc ngăn xếp", en: "a queue or a stack" },
  t5r5c: { vi: "nhanh hơn LinkedList cho cả hai", en: "faster than LinkedList for both" },
  t5r6a: { vi: "nhiều luồng cùng ghi", en: "many threads writing at once" },
  t5r6c: { vi: "khoá theo từng bucket, đọc không khoá", en: "per-bucket locking, lock-free reads" },

  /* 4.6 */
  s6: { vi: "fail-fast và ConcurrentModificationException", en: "fail-fast and ConcurrentModificationException" },
} satisfies Record<string, Tx>;

function putSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "hashCode()", note: "Gọi hashCode() của key. Với String đây là giá trị đã được cache sẵn — một lý do nữa để String bất biến." },
        { label: "trộn bit", note: "h ^ (h >>> 16). Đẩy 16 bit cao xuống thấp, vì bước sau chỉ dùng vài bit thấp — không trộn thì mọi key khác nhau ở bit cao sẽ đâm vào cùng một bucket." },
        { label: "tìm bucket", note: "h & (n - 1). Phép AND này thay được cho chia lấy dư vì n luôn là luỹ thừa của 2, và AND nhanh hơn chia rất nhiều." },
        { label: "bucket rỗng", note: "Đặt vào, xong. Đây là đường chạy thường gặp nhất và nó là O(1)." },
        { label: "va chạm", note: "Bucket đã có phần tử. Duyệt danh sách, so hash trước rồi mới equals — so hash là phép so số nguyên, rẻ hơn nhiều." },
        { label: "thành cây", note: "Bucket đủ 8 phần tử VÀ bảng đã có ít nhất 64 ô thì danh sách chuyển thành cây đỏ-đen, đưa trường hợp xấu nhất từ O(n) về O(log n)." },
      ]
    : [
        { label: "hashCode()", note: "Call the key's hashCode(). For a String this value is already cached — one more reason String is immutable." },
        { label: "mix the bits", note: "h ^ (h >>> 16). Pushes the top 16 bits down, because the next step only uses the low bits — without mixing, keys differing only high up would all land in one bucket." },
        { label: "find the bucket", note: "h & (n - 1). This AND stands in for a modulo because n is always a power of two, and AND is far faster than division." },
        { label: "empty bucket", note: "Drop it in, done. This is the common path, and it is O(1)." },
        { label: "collision", note: "The bucket is occupied. Walk the list, comparing hashes before equals — a hash comparison is an int comparison, and much cheaper." },
        { label: "treeify", note: "Once a bucket holds 8 entries AND the table has at least 64 slots, the list becomes a red-black tree, taking the worst case from O(n) to O(log n)." },
      ];
}

export default function Collections({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="04" name="Collections" lede={s(T.lede)} source={s(T.source)} />

      <Sec n="4.1" t={s(T.s1)}>
        <Fig
          viewBox="0 0 720 208"
          aria={s(T.fig1aria)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 4.1" : "Figure 4.1"}</span>
              <Tr
                vi={
                  <>
                    <strong><code>Map</code> không kế thừa <code>Collection</code>.</strong> Đây là câu hỏi bẫy
                    hay gặp — một Map lưu <em>cặp</em>, không lưu phần tử đơn, nên nó không thoả hợp đồng của
                    Collection.
                  </>
                }
                en={
                  <>
                    <strong><code>Map</code> does not extend <code>Collection</code>.</strong> A common trick
                    question — a Map stores <em>pairs</em>, not single elements, so it cannot satisfy the
                    Collection contract.
                  </>
                }
              />
            </>
          }
        >
          <rect x="24" y="24" width="128" height="44" className="d-box" />
          <text x="88" y="52" className="d-b" textAnchor="middle">Collection</text>

          {[
            { t: "List", s: s(T.b1a), i: ["ArrayList", "LinkedList"] },
            { t: "Set", s: s(T.b1b), i: ["HashSet", "TreeSet"] },
            { t: "Queue", s: s(T.b1c), i: ["ArrayDeque", "PriorityQueue"] },
          ].map((b, n) => (
            <g key={b.t}>
              <line x1="88" y1="68" x2={72 + n * 152} y2="96" className="d-l" markerEnd="url(#pa)" />
              <rect x={24 + n * 152} y={96} width={128} height={44} className="d-box" />
              <text x={88 + n * 152} y={118} className="d-b" textAnchor="middle">{b.t}</text>
              <text x={88 + n * 152} y={134} className="d-s" textAnchor="middle">{b.s}</text>
              <text x={24 + n * 152} y={162} className="d-s">{b.i[0]}</text>
              <text x={24 + n * 152} y={180} className="d-s">{b.i[1]}</text>
            </g>
          ))}

          <rect x="520" y="24" width="176" height="44" className="d-box-a" />
          <text x="608" y="52" className="d-b-a" textAnchor="middle">Map</text>
          <line x1="520" y1="46" x2="160" y2="46" className="d-l-q" />
          <text x="520" y="88" className="d-a">{s(T.d1apart)}</text>
          <text x="520" y="112" className="d-s">HashMap · LinkedHashMap</text>
          <text x="520" y="130" className="d-s">TreeMap · ConcurrentHashMap</text>
          <text x="520" y="162" className="d-s">{s(T.d1pair1)}</text>
          <text x="520" y="180" className="d-s">{s(T.d1pair2)}</text>
        </Fig>
      </Sec>

      <Sec n="4.2" t={s(T.s2)}>
        <Walkthrough
          viewBox="0 0 720 248"
          aria={s(T.fig2aria)}
          hold={2100}
          steps={putSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 4.2" : "Figure 4.2"}</span>
              <Tr
                vi={
                  <>
                    Bốn phép biến đổi trên cùng một giá trị. Bước trộn bit là bước hay bị bỏ qua nhất, và cũng
                    là bước khó đoán nhất nếu chỉ đọc tài liệu.
                  </>
                }
                en={
                  <>
                    Four transformations of one value. The bit-mixing step is the one most often skipped, and
                    the hardest to guess from the documentation alone.
                  </>
                }
              />
            </>
          }
        >
          {(i) => (
            <>
              <rect x="16" y="40" width="112" height="48" className={i === 0 ? "d-box-a" : "d-box"} />
              <text x="72" y="62" className={i === 0 ? "d-b-a" : "d-b"} textAnchor="middle" fontSize="11">key</text>
              <text x="72" y="80" className="d-m" textAnchor="middle">"java"</text>

              <line x1="128" y1="64" x2="152" y2="64" className="d-l" markerEnd="url(#pa)" />
              <rect x="160" y="40" width="128" height="48" className={i === 0 ? "d-box-a" : i > 0 ? "d-box-fill" : "d-box"} />
              <text x="224" y="62" className="d-b" textAnchor="middle" fontSize="11">hashCode()</text>
              <text x="224" y="80" className="d-m" textAnchor="middle">3254818</text>

              {i >= 1 && (
                <g data-enter="">
                  <line x1="288" y1="64" x2="312" y2="64" className="d-l-a" markerEnd="url(#pa-a)" />
                  <rect x="320" y="40" width="152" height="48" className={i === 1 ? "d-box-a" : "d-box-fill"} />
                  <text x="396" y="62" className={i === 1 ? "d-b-a" : "d-b"} textAnchor="middle" fontSize="11">h ^ (h &gt;&gt;&gt; 16)</text>
                  <text x="396" y="80" className="d-m" textAnchor="middle">{s(T.d2mix)}</text>
                </g>
              )}

              {i >= 2 && (
                <g data-enter="">
                  <line x1="472" y1="64" x2="496" y2="64" className="d-l-a" markerEnd="url(#pa-a)" />
                  <rect x="504" y="40" width="192" height="48" className={i === 2 ? "d-box-a" : "d-box-fill"} />
                  <text x="600" y="62" className={i === 2 ? "d-b-a" : "d-b"} textAnchor="middle" fontSize="11">h &amp; (n − 1)</text>
                  <text x="600" y="80" className="d-m" textAnchor="middle">→ bucket 2</text>
                </g>
              )}

              {/* the table */}
              {i >= 3 &&
                Array.from({ length: 8 }, (_, k) => (
                  <g key={k} data-enter="">
                    <rect x={16 + k * 88} y={128} width={80} height={44} className={k === 2 ? "d-box-a" : "d-box"} />
                    <text x={56 + k * 88} y={190} className="d-s" textAnchor="middle">{k}</text>
                    {k === 2 && <text x={56 + k * 88} y={156} className="d-m-a" textAnchor="middle">"java"</text>}
                  </g>
                ))}

              {i === 4 && (
                <g data-enter="">
                  <rect x="192" y="128" width="80" height="44" className="d-box-fill" />
                  <text x="232" y="156" className="d-m" textAnchor="middle">"js"</text>
                  <line x1="176" y1="150" x2="188" y2="150" className="d-l-a" markerEnd="url(#pa-a)" />
                  <text x="16" y="216" className="d-a">{s(T.d2chain)}</text>
                  <text x="16" y="236" className="d-s">{s(T.d2chain2)}</text>
                </g>
              )}

              {i === 5 && (
                <g data-enter="">
                  <text x="16" y="216" className="d-a">{s(T.d2tree)}</text>
                  <text x="16" y="236" className="d-s">{s(T.d2tree2)}</text>
                </g>
              )}

              {i === 3 && (
                <text x="16" y="216" className="d-s" data-enter="">
                  {s(T.d2empty)}
                </text>
              )}
            </>
          )}
        </Walkthrough>

        <Table
          head={[s(T.t2h1), s(T.t2h2), s(T.t2h3)]}
          rows={[
            ["DEFAULT_INITIAL_CAPACITY", "16", s(T.t2r1)],
            ["DEFAULT_LOAD_FACTOR", "0.75", s(T.t2r2)],
            ["TREEIFY_THRESHOLD", "8", s(T.t2r3)],
            ["MIN_TREEIFY_CAPACITY", "64", s(T.t2r4)],
            ["UNTREEIFY_THRESHOLD", "6", s(T.t2r5)],
          ]}
        />
        <Src vi={T.s2src.vi} en={T.s2src.en} />

        <Trap t={T.trap2}>
          <Tr
            vi={
              <p>
                Bucket đủ 8 phần tử <strong>chưa chắc</strong> thành cây. Còn một điều kiện nữa: bảng phải có ít
                nhất <strong>64</strong> ô. Chưa đủ 64 thì HashMap <em>resize</em> chứ không treeify — vì bảng
                nhỏ thì va chạm nhiều là do bảng chật, không phải do hàm băm dở. Rất ít ứng viên nói được vế thứ
                hai.
              </p>
            }
            en={
              <p>
                A bucket reaching 8 entries <strong>does not</strong> necessarily become a tree. There is a
                second condition: the table must hold at least <strong>64</strong> slots. Below that, HashMap{" "}
                <em>resizes</em> instead — because in a small table, heavy collision means the table is cramped,
                not that the hash function is poor. Very few candidates give the second half.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="4.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Để thay <code>hash % n</code> bằng <code>hash &amp; (n − 1)</code>. Khi <code>n</code> là luỹ
                thừa của 2, <code>n − 1</code> có dạng nhị phân toàn số 1 ở các bit thấp, nên phép AND lấy đúng
                phần dư — mà AND nhanh hơn chia rất nhiều.
              </>
            }
            en={
              <>
                So that <code>hash % n</code> can be replaced by <code>hash &amp; (n − 1)</code>. When{" "}
                <code>n</code> is a power of two, <code>n − 1</code> is all ones in its low bits, so the AND
                produces exactly the remainder — and AND is far faster than division.
              </>
            }
          />
        </P>
        <CodeTr
          lang="plain"
          vi={`n = 16  →  n - 1 = 15  →  0000 1111
hash              →  0011 0110
hash & (n-1)      →  0000 0110  = 6

// tăng gấp đôi: n = 32 → n - 1 = 31 → 0001 1111
// chỉ MỘT bit mới lộ ra quyết định phần tử ở lại hay dời đi`}
          en={`n = 16  →  n - 1 = 15  →  0000 1111
hash              →  0011 0110
hash & (n-1)      →  0000 0110  = 6

// after doubling: n = 32 → n - 1 = 31 → 0001 1111
// ONE newly exposed bit decides whether an entry stays or moves`}
        />
        <P>
          <Tr
            vi={
              <>
                Lợi ích thứ hai nằm ở lúc resize: khi bảng tăng gấp đôi, mỗi phần tử hoặc ở nguyên chỗ cũ, hoặc
                dời đúng <code>oldCapacity</code> vị trí — quyết định chỉ bằng <strong>một bit</strong> vừa lộ
                ra. Không phải băm lại toàn bộ.
              </>
            }
            en={
              <>
                The second benefit shows at resize: when the table doubles, each entry either stays exactly
                where it was or moves exactly <code>oldCapacity</code> slots — decided by the{" "}
                <strong>single bit</strong> that has just been exposed. Nothing is rehashed.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Truyền vào dung lượng khác, ví dụ <code>new HashMap&lt;&gt;(20)</code>, thì HashMap tự làm tròn
                lên luỹ thừa của 2 gần nhất là 32.
              </>
            }
            en={
              <>
                Pass some other capacity — <code>new HashMap&lt;&gt;(20)</code>, say — and HashMap rounds it up
                to the next power of two, which is 32.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="4.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={<>Ba điều khoản, theo javadoc của <code>Object</code>:</>}
            en={<>Three clauses, from the <code>Object</code> javadoc:</>}
          />
        </P>
        <Table
          head={[s(T.t4h1), s(T.t4h2)]}
          rows={[
            [s(T.t4r1a), s(T.t4r1b)],
            [s(T.t4r2a), s(T.t4r2b)],
            [s(T.t4r3a), s(T.t4r3b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Vi phạm điều đầu tiên là lỗi thật: bỏ object vào <code>HashSet</code> rồi <code>contains</code>{" "}
                trả về <code>false</code>, vì HashMap tìm bucket bằng hash trước — sai bucket thì không bao giờ
                tới bước gọi <code>equals</code>.
              </>
            }
            en={
              <>
                Breaking the first clause is a real bug: put the object into a <code>HashSet</code> and{" "}
                <code>contains</code> returns <code>false</code>, because HashMap finds the bucket by hash
                first — land in the wrong bucket and <code>equals</code> is never reached at all.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="4.5" t={s(T.s5)}>
        <Table
          head={[s(T.t5h1), s(T.t5h2), s(T.t5h3)]}
          rows={[
            [s(T.t5r1a), <code key="a">ArrayList</code>, s(T.t5r1c)],
            [s(T.t5r2a), <code key="b">HashSet</code>, s(T.t5r2c)],
            [s(T.t5r3a), <code key="c">LinkedHashSet</code>, s(T.t5r3c)],
            [s(T.t5r4a), <code key="d">TreeSet</code>, s(T.t5r4c)],
            [s(T.t5r5a), <code key="e">ArrayDeque</code>, s(T.t5r5c)],
            [s(T.t5r6a), <code key="f">ConcurrentHashMap</code>, s(T.t5r6c)],
          ]}
        />
        <Trap>
          <Tr
            vi={
              <p>
                Đừng dùng lớp <code>Stack</code> cũ — nó kế thừa <code>Vector</code> nên mọi method đều{" "}
                <code>synchronized</code>, tốn vô ích khi chỉ có một luồng. Cùng lý do đó, đừng dùng{" "}
                <code>Vector</code> và <code>Hashtable</code>.
              </p>
            }
            en={
              <p>
                Do not use the old <code>Stack</code> class — it extends <code>Vector</code>, so every method is{" "}
                <code>synchronized</code>, which is wasted work on a single thread. Same reasoning rules out{" "}
                <code>Vector</code> and <code>Hashtable</code>.
              </p>
            }
          />
        </Trap>
        <Limit>
          <Tr
            vi={
              <>
                <code>ConcurrentHashMap</code> không cho phép key hay value <code>null</code>, vì{" "}
                <code>get</code> trả <code>null</code> sẽ nhập nhằng giữa "không có key" và "key ánh xạ tới
                null" — mà trong môi trường đa luồng thì không thể phân biệt bằng <code>containsKey</code> được
                nữa.
              </>
            }
            en={
              <>
                <code>ConcurrentHashMap</code> allows neither <code>null</code> keys nor <code>null</code>{" "}
                values, because a <code>null</code> from <code>get</code> would be ambiguous between "no such
                key" and "the key maps to null" — and under concurrency you can no longer settle it with{" "}
                <code>containsKey</code>.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="4.6" t={s(T.s6)}>
        <P>
          <Tr
            vi={
              <>
                Iterator giữ một biến <code>modCount</code>. Mỗi lần cấu trúc bị đổi, nó tăng. Iterator so giá
                trị nó ghi nhớ với hiện tại ở mỗi bước; lệch là ném{" "}
                <code>ConcurrentModificationException</code>.
              </>
            }
            en={
              <>
                The iterator keeps a <code>modCount</code>. Every structural change increments it. At each step
                the iterator compares the value it remembered against the current one; a mismatch throws{" "}
                <code>ConcurrentModificationException</code>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Đây là cơ chế <strong>phát hiện lỗi sớm</strong>, không phải cơ chế đồng bộ — nó cố ý làm chương
                trình chết ngay thay vì âm thầm chạy sai. Và nó xảy ra cả khi chỉ có một luồng, nếu bạn xoá phần
                tử trong lúc <code>for-each</code>.
              </>
            }
            en={
              <>
                This is <strong>early bug detection</strong>, not a synchronisation mechanism — it deliberately
                kills the program rather than let it quietly go wrong. And it fires on a single thread too, if
                you remove an element during a <code>for-each</code>.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// sai — ném ConcurrentModificationException
for (String s : list) if (s.isBlank()) list.remove(s);

// đúng
list.removeIf(String::isBlank);

// hoặc
Iterator<String> it = list.iterator();
while (it.hasNext()) if (it.next().isBlank()) it.remove();`}
          en={`// wrong — throws ConcurrentModificationException
for (String s : list) if (s.isBlank()) list.remove(s);

// right
list.removeIf(String::isBlank);

// or
Iterator<String> it = list.iterator();
while (it.hasNext()) if (it.next().isBlank()) it.remove();`}
        />
      </Sec>
    </div>
  );
}
