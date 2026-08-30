import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Tr, say, type Tx } from "../i18n";
import { CodeTr, Defs, Fig, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 05 · Cấu trúc & giải thuật / Data structures & algorithms.
 *
 * The four walkthroughs are the algorithms Vinh's own question bank already
 * lists, not a generic syllabus — two pointers, binary search, duplicate
 * detection with a set, and unlinking a node. Each one is drawn because its
 * mechanism is a *movement*, which is the case where a picture beats a
 * paragraph and a moving picture beats a still one.
 *
 * Frames are computed up front rather than mutated as the reader steps. A frame
 * is therefore a pure function of its index: stepping backwards is the same
 * operation as stepping forwards, and no state can drift out of sync with what
 * is drawn.
 *
 * The frame computation is language-independent — it produces positions, not
 * prose — so only the labels below take `lang`.
 */

/* ------------------------------------------------------ two pointers - */

type TwoP = { arr: number[]; l: number; r: number; swaps: number; act: "scan" | "swap" | "done" };

/** Even numbers to the front with the fewest swaps. Each swap places two. */
function twoPointerFrames(input: number[]): TwoP[] {
  const arr = [...input];
  const out: TwoP[] = [];
  let l = 0;
  let r = arr.length - 1;
  let swaps = 0;
  out.push({ arr: [...arr], l, r, swaps, act: "scan" });

  while (l < r) {
    while (l < r && arr[l] % 2 === 0) l++;
    while (l < r && arr[r] % 2 !== 0) r--;
    if (l < r) {
      out.push({ arr: [...arr], l, r, swaps, act: "scan" });
      [arr[l], arr[r]] = [arr[r], arr[l]];
      swaps++;
      out.push({ arr: [...arr], l, r, swaps, act: "swap" });
      l++;
      r--;
    }
  }
  out.push({ arr: [...arr], l, r, swaps, act: "done" });
  return out;
}

const TP = twoPointerFrames([3, 8, 5, 2, 7, 4]);

function Cells({ arr, mark }: { arr: number[]; mark: (i: number) => string }) {
  return (
    <>
      {arr.map((v, i) => (
        <g key={i}>
          <rect x={40 + i * 64} y={40} width={56} height={48} className={mark(i)} />
          <text x={68 + i * 64} y={70} className="d-m" textAnchor="middle">
            {v}
          </text>
          <text x={68 + i * 64} y={104} className="d-s" textAnchor="middle">
            {i}
          </text>
        </g>
      ))}
    </>
  );
}

function Pointer({ i, label, hot }: { i: number; label: string; hot?: boolean }) {
  const x = 68 + i * 64;
  return (
    <g data-enter="">
      <line x1={x} y1={136} x2={x} y2={96} className={hot ? "d-l-a" : "d-l"} markerEnd={hot ? "url(#pa-a)" : "url(#pa)"} />
      <text x={x} y={156} className={hot ? "d-a" : "d-s"} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/* ---------------------------------------------------- binary search - */

type BS = { lo: number; hi: number; mid: number; cmp: "lt" | "gt" | "eq" | null };

function binaryFrames(arr: number[], target: number): BS[] {
  const out: BS[] = [];
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) {
      out.push({ lo, hi, mid, cmp: "eq" });
      break;
    }
    if (arr[mid] < target) {
      out.push({ lo, hi, mid, cmp: "lt" });
      lo = mid + 1;
    } else {
      out.push({ lo, hi, mid, cmp: "gt" });
      hi = mid - 1;
    }
  }
  return out;
}

const BS_ARR = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const BS_TARGET = 23;
const BSF = binaryFrames(BS_ARR, BS_TARGET);

/* -------------------------------------------------------- duplicates - */

const DUP_INPUT = [4, 7, 4, 9, 7, 2];

type Dup = { at: number; seen: number[]; dups: number[]; hit: boolean };

function dupFrames(input: number[]): Dup[] {
  const seen: number[] = [];
  const dups: number[] = [];
  const out: Dup[] = [];
  input.forEach((v, at) => {
    const hit = seen.includes(v);
    if (hit) {
      if (!dups.includes(v)) dups.push(v);
    } else {
      seen.push(v);
    }
    out.push({ at, seen: [...seen], dups: [...dups], hit });
  });
  return out;
}

const DUPF = dupFrames(DUP_INPUT);

/* ------------------------------------------------------------- copy - */

const T = {
  name: { vi: "Cấu trúc & giải thuật", en: "Data structures & algorithms" },
  lede: {
    vi: "Bốn giải thuật dưới đây là những cái hay bị hỏi nhất ở vòng phỏng vấn thực tập, và cả bốn đều là chuyển động — nên chúng được vẽ để chạy chứ không để đọc.",
    en: "The four algorithms below are the ones an internship interview asks for most, and all four are movements — so they are drawn to run rather than to be read.",
  },
  source: {
    vi: "Bấm ▶ để chạy, hoặc dùng phím ← → khi hình đang được chọn.",
    en: "Press ▶ to play, or use ← → while a figure has focus.",
  },

  /* 5.1 */
  s1: { vi: "Độ phức tạp — đọc thế nào cho đúng", en: "Complexity — how to read it correctly" },
  fig1aria: {
    vi: "Đường cong chi phí của O(1), O(log n), O(n), O(n log n) và O(n bình phương) khi n tăng",
    en: "Cost curves for O(1), O(log n), O(n), O(n log n) and O(n squared) as n grows",
  },
  d1cost: { vi: "chi phí", en: "cost" },
  t1h1: { vi: "Thao tác", en: "Operation" },
  t1h2: { vi: "Độ phức tạp", en: "Complexity" },
  t1h3: { vi: "Vì sao", en: "Why" },
  t1r1: { vi: "địa chỉ tính được từ chỉ số", en: "the address is computed from the index" },
  t1r2a: { vi: "O(n)", en: "O(n)" },
  t1r2: { vi: "phải dời mọi phần tử phía sau", en: "everything after it has to shift" },
  t1r3: { vi: "phải đi từ đầu", en: "it has to walk from the head" },
  t1r4a: { vi: "O(1) trung bình", en: "O(1) average" },
  t1r4: { vi: "băm ra bucket, rồi so trong bucket", en: "hash to a bucket, then compare inside it" },
  t1r5a: { vi: "O(log n) xấu nhất", en: "O(log n) worst case" },
  t1r5: { vi: "bucket đã thành cây đỏ-đen", en: "the bucket has become a red-black tree" },
  t1r6: { vi: "cây cân bằng", en: "a balanced tree" },
  add_mid: { vi: "ArrayList.add(giữa)", en: "ArrayList.add(middle)" },

  /* 5.2 */
  s2: {
    vi: "Hai con trỏ — đưa số chẵn lên trước với ít lần đổi chỗ nhất",
    en: "Two pointers — evens to the front in the fewest swaps",
  },
  fig2aria: {
    vi: "Hai con trỏ quét từ hai đầu mảng và đổi chỗ số lẻ bên trái với số chẵn bên phải",
    en: "Two pointers scan inward from both ends, swapping an odd on the left with an even on the right",
  },
  fig2cap: {
    vi: "Ô tô đậm là số chẵn.",
    en: "The filled cells are the even numbers.",
  },
  d2left: { vi: "trái", en: "left" },
  d2right: { vi: "phải", en: "right" },
  d2done: { vi: "mọi số chẵn đã ở bên trái", en: "every even number is now on the left" },

  /* 5.3 */
  s3: { vi: "Tìm nhị phân — vì sao lại là log n", en: "Binary search — why it is log n" },
  fig3aria: {
    vi: "Tìm nhị phân giá trị 23 trong mảng đã sắp xếp, mỗi bước loại đi một nửa",
    en: "Binary search for 23 in a sorted array, halving the range at each step",
  },
  fig3cap: {
    vi: "Ô mờ là phần đã bị loại và sẽ không bao giờ được xét lại.",
    en: "The dimmed cells are eliminated and will never be looked at again.",
  },

  /* 5.4 */
  s4: { vi: "Tìm phần tử trùng — đánh đổi bộ nhớ lấy thời gian", en: "Finding duplicates — trading memory for time" },
  fig4aria: {
    vi: "Duyệt mảng và thêm từng phần tử vào một tập hợp; phần tử thêm không thành công là phần tử trùng",
    en: "Walk the array adding each element to a set; the ones that fail to add are the duplicates",
  },
  fig4cap: {
    vi: "Một lượt duyệt, một lần chạm vào tập cho mỗi phần tử.",
    en: "One pass, one touch of the set per element.",
  },
  d4in: { vi: "mảng đầu vào", en: "input array" },
  d4seen: { vi: "HashSet · đã gặp", en: "HashSet · already seen" },
  d4dup: { vi: "trùng", en: "duplicates" },

  /* 5.5 */
  s5: {
    vi: "Danh sách liên kết — chi phí nằm ở chỗ đi tới, không phải ở chỗ xoá",
    en: "Linked lists — the cost is the walk, not the removal",
  },
  fig5aria: {
    vi: "Xoá một nút khỏi danh sách liên kết bằng cách cho nút trước trỏ vượt qua nó",
    en: "Removing a node from a linked list by pointing the previous node past it",
  },
  fig5cap: {
    vi: "Bước 2 là chỗ tốn thời gian. Bước 3 là một phép gán.",
    en: "Step 2 is where the time goes. Step 3 is one assignment.",
  },
  d5walk: { vi: "duyệt từ head tới đây — O(n)", en: "walk from head to here — O(n)" },
  d5gc: { vi: "không còn tham chiếu tới C → GC dọn", en: "nothing references C → the GC collects it" },
  trapFollow: { vi: "Câu hay bị hỏi tiếp", en: "The usual follow-up" },

  /* 5.6 */
  s6: { vi: "Stack và Queue", en: "Stacks and queues" },
  fig6aria: {
    vi: "Stack đẩy và lấy ở cùng một đầu; queue đẩy ở một đầu và lấy ở đầu kia",
    en: "A stack pushes and pops at the same end; a queue enters at one end and leaves at the other",
  },
  d6same: { vi: "vào và ra cùng một đầu", en: "in and out at the same end" },
  d6opp: { vi: "vào một đầu, ra đầu kia", en: "in one end, out the other" },
  d6deque: {
    vi: "ArrayDeque nhanh hơn LinkedList cho cả hai",
    en: "ArrayDeque beats LinkedList for both",
  },
} satisfies Record<string, Tx>;

function llSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "danh sách ban đầu", note: "Bốn nút. Muốn xoá C thì phải đứng ở B, vì chỉ B mới sửa được con trỏ trỏ vào C." },
        { label: "đi tới nút trước", note: "Duyệt từ head đếm tới nút thứ 2 — đây là chỗ O(n) nằm, không phải ở phép xoá." },
        { label: "nối B sang D", note: "B.next = C.next. Một phép gán duy nhất." },
        { label: "C không còn ai trỏ tới", note: "Không cần giải phóng gì; không còn tham chiếu thì GC dọn." },
      ]
    : [
        { label: "the starting list", note: "Four nodes. To remove C you must be standing at B, because only B can change the pointer that reaches C." },
        { label: "walk to the previous node", note: "Traverse from head, counting to node 2 — this is where the O(n) lives, not in the removal." },
        { label: "link B past C", note: "B.next = C.next. A single assignment." },
        { label: "nothing points at C", note: "Nothing needs freeing; with no references left, the GC takes it." },
      ];
}

function tpSteps(lang: Lang) {
  return TP.map((f) => ({
    // The rail numbers the steps already; repeating the index in the
    // label made it read as data instead of a name.
    label:
      lang === "vi"
        ? f.act === "swap"
          ? "đổi chỗ"
          : f.act === "done"
            ? "xong"
            : "quét"
        : f.act === "swap"
          ? "swap"
          : f.act === "done"
            ? "done"
            : "scan",
    note:
      lang === "vi"
        ? f.act === "swap"
          ? `Đổi chỗ lần ${f.swaps}. Hai phần tử về đúng phía trong một thao tác.`
          : f.act === "done"
            ? `Kết thúc khi hai con trỏ gặp nhau. Tổng cộng ${f.swaps} lần đổi, một lượt duyệt, O(n).`
            : "Con trỏ trái dừng ở số lẻ, con trỏ phải dừng ở số chẵn — cả hai đều đang đứng sai phía."
        : f.act === "swap"
          ? `Swap number ${f.swaps}. Two elements land on the correct side in one operation.`
          : f.act === "done"
            ? `It ends when the pointers meet. ${f.swaps} swaps in total, one pass, O(n).`
            : "The left pointer stops on an odd number, the right on an even one — both are on the wrong side.",
  }));
}

function bsSteps(lang: Lang) {
  return BSF.map((f, i) => ({
    label: lang === "vi" ? `bước ${i + 1}` : `step ${i + 1}`,
    note:
      lang === "vi"
        ? f.cmp === "eq"
          ? `Tìm thấy ${BS_TARGET} ở chỉ số ${f.mid}. Ba bước cho mười phần tử.`
          : f.cmp === "lt"
            ? `${BS_ARR[f.mid]} < ${BS_TARGET}, nên nửa trái bị loại. Vùng tìm còn ${f.hi - f.mid} phần tử.`
            : `${BS_ARR[f.mid]} > ${BS_TARGET}, nên nửa phải bị loại. Vùng tìm còn ${f.mid - f.lo} phần tử.`
        : f.cmp === "eq"
          ? `Found ${BS_TARGET} at index ${f.mid}. Three steps for ten elements.`
          : f.cmp === "lt"
            ? `${BS_ARR[f.mid]} < ${BS_TARGET}, so the left half is gone. ${f.hi - f.mid} elements still in range.`
            : `${BS_ARR[f.mid]} > ${BS_TARGET}, so the right half is gone. ${f.mid - f.lo} elements still in range.`,
  }));
}

function dupSteps(lang: Lang) {
  return DUPF.map((f) => ({
    label: `i = ${f.at}`,
    note:
      lang === "vi"
        ? f.hit
          ? `add(${DUP_INPUT[f.at]}) trả về false — giá trị này đã có trong tập, nên nó là phần tử trùng.`
          : `add(${DUP_INPUT[f.at]}) trả về true — lần đầu gặp, tập hợp lớn thêm một phần tử.`
        : f.hit
          ? `add(${DUP_INPUT[f.at]}) returns false — the value is already in the set, so this is a duplicate.`
          : `add(${DUP_INPUT[f.at]}) returns true — first sighting, and the set grows by one.`,
  }));
}

/* ============================================================== page - */

export default function Dsa({ lang }: { lang: Lang }) {
  const s = say(lang);
  const vi = lang === "vi";
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="05" name={s(T.name)} lede={s(T.lede)} source={s(T.source)} />

      <Sec n="5.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                Ký hiệu O lớn mô tả <strong>tốc độ tăng của chi phí khi dữ liệu lớn dần</strong>, không phải thời
                gian chạy. Một thuật toán O(n) có thể chậm hơn một thuật toán O(n²) trên 10 phần tử; điều O lớn
                nói là ở 10.000 phần tử thì không.
              </>
            }
            en={
              <>
                Big-O describes <strong>how the cost grows as the data grows</strong>, not the running time. An
                O(n) algorithm can be slower than an O(n²) one on 10 elements; what big-O says is that at 10,000
                it will not be.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Hằng số bị bỏ đi vì chúng phụ thuộc máy, còn bậc thì không. Đó cũng là lý do O(2n) và O(n) là
                một.
              </>
            }
            en={
              <>
                Constants are dropped because they depend on the machine and the order of growth does not. Which
                is also why O(2n) and O(n) are the same thing.
              </>
            }
          />
        </P>
        <Fig
          viewBox="0 0 720 296"
          aria={s(T.fig1aria)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 5.1" : "Figure 5.1"}</span>
              <Tr
                vi={
                  <>
                    Cùng một trục. Khác biệt giữa <code>O(log n)</code> và <code>O(n)</code> gần như không thấy ở
                    bên trái, và là toàn bộ vấn đề ở bên phải.
                  </>
                }
                en={
                  <>
                    One set of axes. The gap between <code>O(log n)</code> and <code>O(n)</code> is barely
                    visible on the left, and is the entire problem on the right.
                  </>
                }
              />
            </>
          }
        >
          <line x1="56" y1="248" x2="696" y2="248" className="d-l" markerEnd="url(#pa)" />
          <line x1="56" y1="248" x2="56" y2="24" className="d-l" markerEnd="url(#pa)" />
          <text x="700" y="268" className="d-s" textAnchor="end">n →</text>
          <text x="56" y="18" className="d-s">{s(T.d1cost)}</text>

          <path d="M56 240 L696 236" className="d-l" />
          <text x="640" y="228" className="d-s">O(1)</text>

          <path d="M56 240 C 200 176 400 152 696 136" className="d-l" />
          <text x="640" y="128" className="d-s">O(log n)</text>

          <path d="M56 240 L696 56" className="d-l-a" />
          <text x="628" y="48" className="d-a">O(n)</text>

          <path d="M56 240 C 320 200 480 120 640 24" className="d-l" />
          <text x="556" y="36" className="d-s">O(n log n)</text>

          <path d="M56 240 C 240 240 320 160 400 24" className="d-l" />
          <text x="404" y="36" className="d-s">O(n²)</text>
        </Fig>
        <Table
          head={[s(T.t1h1), s(T.t1h2), s(T.t1h3)]}
          rows={[
            [<code key="a">ArrayList.get(i)</code>, "O(1)", s(T.t1r1)],
            [<code key="b">{s(T.add_mid)}</code>, s(T.t1r2a), s(T.t1r2)],
            [<code key="c">LinkedList.get(i)</code>, s(T.t1r2a), s(T.t1r3)],
            [<code key="d">HashMap.get(k)</code>, s(T.t1r4a), s(T.t1r4)],
            [<code key="e">HashMap.get(k)</code>, s(T.t1r5a), s(T.t1r5)],
            [<code key="f">TreeMap.get(k)</code>, "O(log n)", s(T.t1r6)],
          ]}
        />
        <Trap>
          <Tr
            vi={
              <p>
                <code>HashMap</code> xấu nhất là <strong>O(log n)</strong> chứ không phải O(n), từ Java 8 — khi
                một bucket quá đông nó chuyển thành cây đỏ-đen. Nhiều tài liệu cũ vẫn ghi O(n); trả lời được chỗ
                này là dấu hiệu bạn đọc bản mới.
              </p>
            }
            en={
              <p>
                <code>HashMap</code>'s worst case is <strong>O(log n)</strong>, not O(n), as of Java 8 — an
                overcrowded bucket becomes a red-black tree. Plenty of older material still says O(n); getting
                this right signals you have read the current source.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="5.2" t={s(T.s2)}>
        <P>
          <Tr
            vi={
              <>
                Cách ngây thơ là duyệt và chèn, tốn O(n²) vì mỗi lần chèn phải dời mảng. Hai con trỏ giải xong
                trong <strong>một lượt duyệt</strong>: con trỏ trái đi tìm số lẻ đứng sai chỗ, con trỏ phải đi
                tìm số chẵn đứng sai chỗ, gặp nhau thì đổi.
              </>
            }
            en={
              <>
                The naive way walks and inserts, at O(n²), because every insert shifts the array. Two pointers
                finish it in <strong>a single pass</strong>: the left pointer hunts for a misplaced odd number,
                the right for a misplaced even one, and when they meet the two are exchanged.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Vì sao <em>ít lần đổi nhất</em>: mỗi lần đổi đưa <strong>hai</strong> phần tử về đúng phía cùng
                lúc. Không có cách nào sửa hai chỗ sai bằng ít hơn một thao tác.
              </>
            }
            en={
              <>
                Why <em>fewest swaps</em>: each swap puts <strong>two</strong> elements on their correct side at
                once. There is no way to fix two wrong placements in less than one operation.
              </>
            }
          />
        </P>

        <Walkthrough
          viewBox="0 0 720 200"
          aria={s(T.fig2aria)}
          hold={1700}
          steps={tpSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 5.2" : "Figure 5.2"}</span>
              <code>[3, 8, 5, 2, 7, 4]</code>. {s(T.fig2cap)}
            </>
          }
        >
          {(i) => {
            const f = TP[i];
            return (
              <>
                <text x="40" y="24" className="d-s">
                  {f.act === "done"
                    ? vi
                      ? `hoàn tất · ${f.swaps} lần đổi`
                      : `complete · ${f.swaps} swaps`
                    : vi
                      ? `số lần đổi: ${f.swaps}`
                      : `swaps so far: ${f.swaps}`}
                </text>
                <Cells
                  arr={f.arr}
                  mark={(n) =>
                    f.act === "swap" && (n === f.l || n === f.r)
                      ? "d-box-a"
                      : f.arr[n] % 2 === 0
                        ? "d-box-fill"
                        : "d-box"
                  }
                />
                {f.act !== "done" && <Pointer i={f.l} label={s(T.d2left)} hot={f.act === "swap"} />}
                {f.act !== "done" && <Pointer i={f.r} label={s(T.d2right)} hot={f.act === "swap"} />}
                {f.act === "done" && (
                  <text x="40" y="150" className="d-a" data-enter="">
                    {s(T.d2done)}
                  </text>
                )}
              </>
            );
          }}
        </Walkthrough>

        <CodeTr
          vi={`int left = 0, right = arr.length - 1, swaps = 0;

while (left < right) {
    while (left < right && arr[left] % 2 == 0)  left++;
    while (left < right && arr[right] % 2 != 0) right--;

    if (left < right) {
        int t = arr[left]; arr[left] = arr[right]; arr[right] = t;
        swaps++;
        left++; right--;
    }
}`}
          en={`int left = 0, right = arr.length - 1, swaps = 0;

while (left < right) {
    while (left < right && arr[left] % 2 == 0)  left++;
    while (left < right && arr[right] % 2 != 0) right--;

    if (left < right) {
        int t = arr[left]; arr[left] = arr[right]; arr[right] = t;
        swaps++;
        left++; right--;
    }
}`}
        />
        <Limit>
          <Tr
            vi={
              <>
                Cách này <strong>không giữ thứ tự tương đối</strong> của các số chẵn với nhau. Nếu đề bài yêu cầu
                ổn định thì phải dùng cách khác, và khi đó không còn đạt số lần đổi nhỏ nhất nữa.
              </>
            }
            en={
              <>
                This does <strong>not preserve the relative order</strong> of the even numbers. If the problem
                demands stability you need a different approach, and it will no longer achieve the minimum
                number of swaps.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="5.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Mỗi bước loại đi <strong>một nửa</strong> phần còn lại. Số bước là số lần chia đôi 1.000.000 để
                về 1, tức khoảng 20. Đó là ý nghĩa của log₂.
              </>
            }
            en={
              <>
                Each step eliminates <strong>half</strong> of what is left. The step count is how many times you
                halve 1,000,000 to reach 1 — about 20. That is what log₂ means.
              </>
            }
          />
        </P>
        <Walkthrough
          viewBox="0 0 720 208"
          aria={s(T.fig3aria)}
          hold={1800}
          steps={bsSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 5.3" : "Figure 5.3"}</span>
              <Tr vi={<>Tìm <code>23</code>. </>} en={<>Searching for <code>23</code>. </>} />
              {s(T.fig3cap)}
            </>
          }
        >
          {(i) => {
            const f = BSF[i];
            return (
              <>
                <text x="24" y="24" className="d-s">
                  lo = {f.lo} · hi = {f.hi} · mid = {f.mid}
                </text>
                {BS_ARR.map((v, n) => {
                  const out = n < f.lo || n > f.hi;
                  return (
                    <g key={n}>
                      <rect
                        x={24 + n * 68}
                        y={40}
                        width={60}
                        height={48}
                        className={n === f.mid ? "d-box-a" : out ? "d-box-out" : "d-box"}
                      />
                      <text
                        x={54 + n * 68}
                        y={70}
                        className={n === f.mid ? "d-m-a" : out ? "d-s" : "d-m"}
                        textAnchor="middle"
                      >
                        {v}
                      </text>
                      <text x={54 + n * 68} y={104} className="d-s" textAnchor="middle">
                        {n}
                      </text>
                    </g>
                  );
                })}
                <g data-enter="">
                  <line x1={54 + f.mid * 68} y1={136} x2={54 + f.mid * 68} y2={96} className="d-l-a" markerEnd="url(#pa-a)" />
                  <text x={54 + f.mid * 68} y={156} className="d-a" textAnchor="middle">
                    mid
                  </text>
                </g>
                <text x="24" y="188" className="d-s" data-enter="">
                  {f.cmp === "eq"
                    ? vi
                      ? "bằng → dừng"
                      : "equal → stop"
                    : f.cmp === "lt"
                      ? vi
                        ? `${BS_ARR[f.mid]} < 23 → bỏ nửa trái`
                        : `${BS_ARR[f.mid]} < 23 → drop the left half`
                      : vi
                        ? `${BS_ARR[f.mid]} > 23 → bỏ nửa phải`
                        : `${BS_ARR[f.mid]} > 23 → drop the right half`}
                </text>
              </>
            );
          }}
        </Walkthrough>
        <Trap>
          <Tr
            vi={
              <p>
                <code>(lo + hi) / 2</code> có thể <strong>tràn số</strong> khi mảng rất lớn, vì tổng vượt quá{" "}
                <code>Integer.MAX_VALUE</code>. Cách viết an toàn là <code>lo + (hi - lo) / 2</code>, hoặc{" "}
                <code>(lo + hi) &gt;&gt;&gt; 1</code> như trong thư viện chuẩn của Java. Lỗi này tồn tại trong{" "}
                <code>Arrays.binarySearch</code> của JDK suốt chín năm.
              </p>
            }
            en={
              <p>
                <code>(lo + hi) / 2</code> can <strong>overflow</strong> on a very large array, because the sum
                exceeds <code>Integer.MAX_VALUE</code>. The safe forms are <code>lo + (hi - lo) / 2</code> or{" "}
                <code>(lo + hi) &gt;&gt;&gt; 1</code>, which is what the Java standard library uses. This bug
                sat in the JDK's <code>Arrays.binarySearch</code> for nine years.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="5.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                Cách đối chiếu từng cặp mất O(n²). Dùng một <code>HashSet</code> đưa về{" "}
                <strong>O(n) thời gian</strong>, đổi lại <strong>O(n) bộ nhớ</strong>. Đây là kiểu đánh đổi phổ
                biến nhất trong giải thuật, và người phỏng vấn muốn nghe bạn gọi tên nó.
              </>
            }
            en={
              <>
                Comparing every pair costs O(n²). A <code>HashSet</code> brings it to{" "}
                <strong>O(n) time</strong> in exchange for <strong>O(n) memory</strong>. This is the most common
                trade in algorithms, and an interviewer wants to hear you name it.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Chi tiết đáng nói: <code>Set.add()</code> trả về <code>false</code> khi phần tử đã có. Nên không
                cần gọi <code>contains()</code> rồi mới <code>add()</code> — một lần gọi vừa kiểm tra vừa thêm.
              </>
            }
            en={
              <>
                A detail worth mentioning: <code>Set.add()</code> returns <code>false</code> when the element is
                already present. So there is no need to call <code>contains()</code> before{" "}
                <code>add()</code> — one call both tests and inserts.
              </>
            }
          />
        </P>
        <Walkthrough
          viewBox="0 0 720 216"
          aria={s(T.fig4aria)}
          hold={1500}
          steps={dupSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 5.4" : "Figure 5.4"}</span>
              <code>[4, 7, 4, 9, 7, 2]</code>. {s(T.fig4cap)}
            </>
          }
        >
          {(i) => {
            const f = DUPF[i];
            return (
              <>
                <text x="24" y="24" className="d-s">{s(T.d4in)}</text>
                {DUP_INPUT.map((v, n) => (
                  <g key={n}>
                    <rect
                      x={24 + n * 64}
                      y={32}
                      width={56}
                      height={44}
                      className={n === f.at ? (f.hit ? "d-box-a" : "d-box-fill") : n < f.at ? "d-box-out" : "d-box"}
                    />
                    <text x={52 + n * 64} y={60} className={n === f.at && f.hit ? "d-m-a" : "d-m"} textAnchor="middle">
                      {v}
                    </text>
                  </g>
                ))}

                <text x="24" y="116" className="d-s">{s(T.d4seen)}</text>
                {f.seen.map((v, n) => (
                  <g key={v} data-enter="">
                    <rect x={24 + n * 56} y={124} width={48} height={40} className="d-box" />
                    <text x={48 + n * 56} y={150} className="d-m" textAnchor="middle">
                      {v}
                    </text>
                  </g>
                ))}

                <text x="424" y="116" className="d-a">{s(T.d4dup)}</text>
                {f.dups.map((v, n) => (
                  <g key={v} data-enter="">
                    <rect x={424 + n * 56} y={124} width={48} height={40} className="d-box-a" />
                    <text x={448 + n * 56} y={150} className="d-m-a" textAnchor="middle">
                      {v}
                    </text>
                  </g>
                ))}

                <text x="24" y="196" className="d-s" data-enter="">
                  {f.hit ? `add(${DUP_INPUT[f.at]}) → false` : `add(${DUP_INPUT[f.at]}) → true`}
                </text>
              </>
            );
          }}
        </Walkthrough>
        <CodeTr
          vi={`Set<Integer> seen = new HashSet<>();
Set<Integer> duplicates = new LinkedHashSet<>();

for (int n : arr) {
    if (!seen.add(n)) {      // add trả về false khi đã có
        duplicates.add(n);
    }
}`}
          en={`Set<Integer> seen = new HashSet<>();
Set<Integer> duplicates = new LinkedHashSet<>();

for (int n : arr) {
    if (!seen.add(n)) {      // add returns false when it is already there
        duplicates.add(n);
    }
}`}
        />
        <P>
          <Tr
            vi={
              <>
                Dùng <code>LinkedHashSet</code> cho kết quả vì nó giữ thứ tự phát hiện. <code>HashSet</code>{" "}
                thường cũng đúng, nhưng thứ tự in ra sẽ không đoán được, và một kết quả không xác định thì khó
                viết test.
              </>
            }
            en={
              <>
                Use <code>LinkedHashSet</code> for the result because it keeps the order of discovery. A plain{" "}
                <code>HashSet</code> is also correct, but the printed order is unpredictable, and a
                non-deterministic result is hard to write a test against.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="5.5" t={s(T.s5)}>
        <P>
          <Tr
            vi={
              <>
                Ai cũng nói xoá trong danh sách liên kết là O(1). Câu đó chỉ đúng khi <strong>bạn đã cầm nút
                phía trước</strong>. Muốn xoá nút thứ k thì phải duyệt tới đó trước, và đó là O(n) — nên xoá theo
                chỉ số vẫn là O(n).
              </>
            }
            en={
              <>
                Everyone says removal from a linked list is O(1). That is true only when{" "}
                <strong>you already hold the previous node</strong>. To remove the k-th node you must walk there
                first, and that is O(n) — so removal by index is still O(n).
              </>
            }
          />
        </P>
        <Walkthrough
          viewBox="0 0 720 176"
          aria={s(T.fig5aria)}
          hold={1700}
          steps={llSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 5.5" : "Figure 5.5"}</span>
              {s(T.fig5cap)}
            </>
          }
        >
          {(i) => {
            const names = ["A", "B", "C", "D"];
            const removed = i >= 3;
            return (
              <>
                {names.map((nm, n) => {
                  const gone = removed && n === 2;
                  const cur = i === 1 && n === 1;
                  return (
                    <g key={nm}>
                      <rect
                        x={40 + n * 152}
                        y={48}
                        width={96}
                        height={48}
                        className={gone ? "d-box-out" : cur ? "d-box-a" : n === 2 && i >= 1 ? "d-box-fill" : "d-box"}
                      />
                      <text x={88 + n * 152} y={78} className={gone ? "d-s" : cur ? "d-m-a" : "d-m"} textAnchor="middle">
                        {nm}
                      </text>
                    </g>
                  );
                })}

                {/* B → C and C → D exist until the unlink. */}
                {i < 2 && <line x1="136" y1="72" x2="184" y2="72" className="d-l" markerEnd="url(#pa)" />}
                {i < 2 && <line x1="288" y1="72" x2="336" y2="72" className="d-l" markerEnd="url(#pa)" />}
                <line x1="288" y1="72" x2="336" y2="72" className={i >= 2 ? "d-l-q" : "d-l"} markerEnd={i >= 2 ? undefined : "url(#pa)"} />
                <line x1="-40" y1="72" x2="40" y2="72" className="d-l" markerEnd="url(#pa)" />
                <text x="8" y="40" className="d-s">head</text>

                {/* the new link */}
                {i >= 2 && (
                  <g data-enter="">
                    <path d="M136 60 C 200 8 280 8 340 60" className="d-l-a" markerEnd="url(#pa-a)" />
                    <text x="240" y="20" className="d-a" textAnchor="middle">
                      B.next = C.next
                    </text>
                  </g>
                )}

                {i === 1 && (
                  <text x="40" y="132" className="d-a" data-enter="">
                    {s(T.d5walk)}
                  </text>
                )}
                {removed && (
                  <text x="344" y="132" className="d-s" data-enter="">
                    {s(T.d5gc)}
                  </text>
                )}
              </>
            );
          }}
        </Walkthrough>
        <Trap t={T.trapFollow}>
          <Tr
            vi={
              <p>
                "Xoá nút <em>đầu</em> thì sao?" — đó là trường hợp riêng, vì không có nút phía trước:{" "}
                <code>head = head.next</code>. Với danh sách liên kết đôi còn phải gán{" "}
                <code>head.prev = null</code>, nếu quên thì nút cũ vẫn bị nút mới trỏ ngược tới và không được GC
                dọn.
              </p>
            }
            en={
              <p>
                "What about removing the <em>head</em>?" — a special case, because there is no previous node:{" "}
                <code>head = head.next</code>. On a doubly linked list you must also set{" "}
                <code>head.prev = null</code>; forget it and the new head still points back at the old one,
                which the GC therefore cannot collect.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="5.6" t={s(T.s6)}>
        <P>
          <Tr
            vi={
              <>
                <strong>Stack</strong> là LIFO — vào sau ra trước. Nó chính là cách JVM quản lý lời gọi hàm, và
                là lý do đệ quy quá sâu ném <code>StackOverflowError</code>.
              </>
            }
            en={
              <>
                A <strong>stack</strong> is LIFO — last in, first out. It is exactly how the JVM manages method
                calls, and why recursion that goes too deep throws <code>StackOverflowError</code>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <strong>Queue</strong> là FIFO — vào trước ra trước. Đây là hình dạng của mọi hàng đợi xử lý:
                request vào server, job chờ chạy, tin nhắn chờ gửi.
              </>
            }
            en={
              <>
                A <strong>queue</strong> is FIFO — first in, first out. This is the shape of every processing
                queue: requests arriving at a server, jobs waiting to run, messages waiting to be sent.
              </>
            }
          />
        </P>
        <Fig
          viewBox="0 0 720 208"
          aria={s(T.fig6aria)}
          caption={
            <>
              <span className="plate-figlabel">{vi ? "Bản vẽ 5.6" : "Figure 5.6"}</span>
              <Tr
                vi={
                  <>
                    Khác biệt duy nhất là <strong>chỗ lấy ra</strong>. Cùng một chỗ thì là stack, đầu kia thì là
                    queue.
                  </>
                }
                en={
                  <>
                    The only difference is <strong>where things come out</strong>. Same end and it is a stack;
                    the far end and it is a queue.
                  </>
                }
              />
            </>
          }
        >
          <text x="24" y="24" className="d-b">Stack · LIFO</text>
          {[0, 1, 2].map((n) => (
            <g key={n}>
              <rect x={24} y={104 - n * 32} width={96} height={28} className="d-box" />
              <text x={72} y={124 - n * 32} className="d-m" textAnchor="middle">
                {["A", "B", "C"][n]}
              </text>
            </g>
          ))}
          <line x1="176" y1="34" x2="128" y2="52" className="d-l-a" markerEnd="url(#pa-a)" />
          <text x="184" y="30" className="d-a">push</text>
          <line x1="128" y1="20" x2="176" y2="4" className="d-l-a" markerEnd="url(#pa-a)" />
          <text x="184" y="8" className="d-a">pop</text>
          <text x="24" y="160" className="d-s">{s(T.d6same)}</text>

          <text x="392" y="24" className="d-b">Queue · FIFO</text>
          {[0, 1, 2].map((n) => (
            <g key={n}>
              <rect x={392 + n * 104} y={48} width={96} height={44} className="d-box" />
              <text x={440 + n * 104} y={76} className="d-m" textAnchor="middle">
                {["A", "B", "C"][n]}
              </text>
            </g>
          ))}
          <line x1="712" y1="70" x2="700" y2="70" className="d-l-a" markerEnd="url(#pa-a)" />
          <text x="640" y="36" className="d-a">offer →</text>
          <line x1="384" y1="70" x2="368" y2="70" className="d-l-a" markerEnd="url(#pa-a)" />
          <text x="368" y="36" className="d-a">← poll</text>
          <text x="392" y="128" className="d-s">{s(T.d6opp)}</text>
          <text x="392" y="160" className="d-s">{s(T.d6deque)}</text>
        </Fig>
        <Trap>
          <Tr
            vi={
              <p>
                Đừng dùng lớp <code>Stack</code> cũ của Java — nó kế thừa <code>Vector</code> nên mọi method đều{" "}
                <code>synchronized</code>, tốn vô ích khi chỉ có một luồng. Dùng <code>ArrayDeque</code> cho cả
                stack lẫn queue.
              </p>
            }
            en={
              <p>
                Do not use Java's old <code>Stack</code> class — it extends <code>Vector</code>, so every method
                is <code>synchronized</code>, which is wasted work on a single thread. Use{" "}
                <code>ArrayDeque</code> for both stacks and queues.
              </p>
            }
          />
        </Trap>
      </Sec>
    </div>
  );
}
