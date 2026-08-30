import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Tr, say, type Tx } from "../i18n";
import { CodeTr, Defs, Fig, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 10 · PostgreSQL & SQL.
 *
 * The index walkthrough draws the one thing an EXPLAIN output states but never
 * shows: that a sequential scan reads every row and a B-tree descends three
 * nodes. Seeing the two side by side is what makes "index makes it faster" stop
 * being a slogan.
 */

const T = {
  lede: {
    vi: "Sáu index trong IntelliPath đều nằm trên cột thật sự xuất hiện trong WHERE hoặc JOIN. Trang này giải thích vì sao chúng giúp được, và vì sao thêm nữa lại hại.",
    en: "All six indexes in IntelliPath sit on columns that really appear in a WHERE or a JOIN. This page explains why they help, and why more of them would hurt.",
  },
  source: {
    vi: "PostgreSQL 16 · pgvector · 6 index trên 5 bảng",
    en: "PostgreSQL 16 · pgvector · 6 indexes across 5 tables",
  },

  /* 10.1 */
  s1: { vi: "Index hoạt động thế nào", en: "How an index works" },
  fig1aria: {
    vi: "Quét tuần tự đọc mọi dòng; cây B-tree đi xuống ba tầng để tới đúng dòng",
    en: "A sequential scan reads every row; a B-tree descends three levels to reach the right one",
  },
  k1a: { vi: "phải đọc — chi phí", en: "must be read — the cost" },
  k1b: { vi: "đường đi của index", en: "the index's path" },
  k1c: { vi: "cái giá phải trả khi ghi", en: "the price paid on writes" },
  d1scan: { vi: "Sequential scan — đọc từng dòng", en: "Sequential scan — every row is read" },
  d1scan2: {
    vi: "8 dòng → 8 lần đọc · 8 triệu dòng → 8 triệu lần đọc",
    en: "8 rows → 8 reads · 8 million rows → 8 million reads",
  },
  d1win: {
    vi: "3 phép so thay cho 8 lần đọc — tỉ lệ đó càng lớn khi bảng càng to",
    en: "3 comparisons instead of 8 reads — and the ratio widens as the table grows",
  },
  d1cost: {
    vi: "nhưng mọi INSERT/UPDATE/DELETE phải cập nhật cây này",
    en: "but every INSERT/UPDATE/DELETE has to update this tree",
  },
  d1bal: {
    vi: "cây cân bằng — mọi khoá đều cách gốc đúng bằng nhau",
    en: "a balanced tree — every key sits the same distance from the root",
  },
  t1h1: { vi: "Loại index", en: "Index type" },
  t1h2: { vi: "Dùng cho", en: "Used for" },
  t1r1a: { vi: "B-tree (mặc định)", en: "B-tree (the default)" },
  t1r1b: { vi: "so bằng, so khoảng, ORDER BY", en: "equality, ranges, ORDER BY" },
  t1r2b: { vi: "mảng, jsonb, full-text search", en: "arrays, jsonb, full-text search" },
  t1r3b: { vi: "dữ liệu hình học, phạm vi", en: "geometric data, ranges" },
  t1r4b: { vi: "vector — pgvector, tìm kiếm ngữ nghĩa", en: "vectors — pgvector, semantic search" },

  /* 10.2 */
  s2: { vi: "Index biểu thức — chỗ nhỏ mà lộ trình độ", en: "Expression indexes — a small thing that shows the level" },

  /* 10.3 */
  s3: { vi: "Các phép JOIN", en: "The JOINs" },
  fig3aria: {
    vi: "Bốn kiểu join minh hoạ bằng hai tập hợp giao nhau",
    en: "Four kinds of join drawn as two intersecting sets",
  },
  j1: { vi: "chỉ phần khớp", en: "matches only" },
  j2: { vi: "toàn bộ trái", en: "all of the left" },
  j3: { vi: "toàn bộ phải", en: "all of the right" },
  j4: { vi: "cả hai", en: "both sides" },

  /* 10.4 */
  s4: { vi: "ACID và mức cô lập", en: "ACID and the isolation levels" },
  t4h1: { vi: "Mức", en: "Level" },
  t4h2: { vi: "Dirty read", en: "Dirty read" },
  t4h3: { vi: "Non-repeatable", en: "Non-repeatable" },
  t4h4: { vi: "Phantom", en: "Phantom" },
  yes: { vi: "có", en: "yes" },
  no: { vi: "không", en: "no" },
  nostar: { vi: "không*", en: "no*" },
  rcLabel: { vi: "READ COMMITTED ← mặc định PG", en: "READ COMMITTED ← PG default" },
  trap4: { vi: "Chỗ ăn điểm", en: "Where marks are won" },

  /* 10.5 */
  s5: { vi: "Vài câu SQL hay bị hỏi", en: "The SQL questions that keep coming up" },
  t5r1: { vi: "Xoá gì", en: "Removes" },
  t5r1a: { vi: "dòng theo điều kiện", en: "rows matching a condition" },
  t5r1b: { vi: "toàn bộ dòng", en: "every row" },
  t5r1c: { vi: "cả bảng", en: "the table itself" },
  t5r2: { vi: "Dùng WHERE", en: "Takes a WHERE" },
  t5r2a: { vi: "được", en: "yes" },
  t5r2b: { vi: "không", en: "no" },
  t5r3: { vi: "Cấu trúc bảng", en: "Table structure" },
  t5r3a: { vi: "còn", en: "kept" },
  t5r3c: { vi: "mất", en: "gone" },
  t5r4: { vi: "Tốc độ", en: "Speed" },
  t5r4a: { vi: "chậm — ghi log từng dòng", en: "slow — logs every row" },
  t5r4b: { vi: "nhanh", en: "fast" },

  /* 10.6 */
  s6: { vi: "pgvector và tìm kiếm ngữ nghĩa", en: "pgvector and semantic search" },
} satisfies Record<string, Tx>;

function idxSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "không có index", note: "Sequential scan. Database đọc TỪNG dòng và so điều kiện. Với 8 dòng thì nhanh; với 8 triệu thì không." },
        { label: "thêm index", note: "CREATE INDEX dựng một cây B-tree trên cột đó. Cây cân bằng: mọi khoá đều cách gốc đúng bằng nhau." },
        { label: "xuống tầng 1", note: "So với nút gốc để chọn nhánh. Một phép so, loại đi phần lớn dữ liệu." },
        { label: "xuống tầng 2", note: "Lại một phép so. Số dòng còn phải xét giảm theo cấp số nhân." },
        { label: "tới lá", note: "Nút lá chứa con trỏ tới dòng thật. Ba lần so thay cho tám lần đọc — và tỉ lệ đó càng lớn khi bảng càng to." },
        { label: "cái giá", note: "Mỗi INSERT, UPDATE, DELETE phải cập nhật cả index. Index thừa làm chậm ghi và làm bộ tối ưu chọn sai kế hoạch." },
      ]
    : [
        { label: "no index", note: "Sequential scan. The database reads EVERY row and tests the condition. Fine at 8 rows; not at 8 million." },
        { label: "add the index", note: "CREATE INDEX builds a B-tree over that column. It is balanced: every key sits the same distance from the root." },
        { label: "down to level 1", note: "Compare against the root to pick a branch. One comparison, and most of the data is eliminated." },
        { label: "down to level 2", note: "Another comparison. The rows still under consideration fall away exponentially." },
        { label: "reach the leaf", note: "A leaf node holds a pointer to the real row. Three comparisons instead of eight reads — and the ratio widens as the table grows." },
        { label: "the price", note: "Every INSERT, UPDATE and DELETE must maintain the index too. Surplus indexes slow writes down and push the planner toward worse plans." },
      ];
}

export default function Database({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="10" name="PostgreSQL & SQL" lede={s(T.lede)} source={s(T.source)} />

      <Sec n="10.1" t={s(T.s1)}>
        <Walkthrough
          viewBox="0 0 720 248"
          aria={s(T.fig1aria)}
          hold={2000}
          steps={idxSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 10.1" : "Figure 10.1"}</span>
              <Tr
                vi={
                  <>
                    O(n) so với O(log n). Ở tám dòng thì không thấy gì; ở tám triệu dòng thì đó là toàn bộ khác
                    biệt.
                  </>
                }
                en={
                  <>
                    O(n) against O(log n). At eight rows you see nothing; at eight million it is the whole
                    difference.
                  </>
                }
              />
              <Key
                items={[
                  { c: "warn", t: s(T.k1a) },
                  { c: "ok", t: s(T.k1b) },
                  { c: "bad", t: s(T.k1c) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const scan = i === 0;
            return (
              <>
                {scan && (
                  <>
                    <g data-c="warn">
                      <Ic n="clock" x={16} y={12} s={16} c="warn" />
                      <text x="40" y="25" className="d-m">{s(T.d1scan)}</text>
                      {Array.from({ length: 8 }, (_, k) => (
                        <g key={k}>
                          <rect x={16 + k * 88} y={40} width={80} height={44} className="d-box-fill" />
                          <text x={56 + k * 88} y={68} className="d-m" textAnchor="middle">{k + 1}</text>
                        </g>
                      ))}
                    </g>
                    <text x="16" y="120" className="d-s">{s(T.d1scan2)}</text>
                  </>
                )}

                {!scan && (
                  <>
                    <Ic n="zap" x={16} y={10} s={16} c="ok" />
                    <text x="40" y="24" className="d-s">B-tree index</text>
                    {/* root */}
                    <g data-c={i >= 2 ? "ok" : undefined}>
                      <rect x="304" y="36" width="112" height="40" className={i >= 2 ? "d-box-fill" : "d-box"} />
                      <text x="360" y="62" className="d-m" textAnchor="middle">≤ 40 | &gt; 40</text>
                    </g>

                    {/* level 2 */}
                    {[0, 1].map((k) => (
                      <g key={k}>
                        <line x1="360" y1="76" x2={168 + k * 384} y2="108" className="d-l" markerEnd={i >= 3 && k === 0 ? "url(#pa-ok)" : "url(#pa)"} data-c={i >= 3 && k === 0 ? "ok" : undefined} />
                        <g data-c={i >= 3 && k === 0 ? "ok" : undefined}>
                          <rect x={112 + k * 384} y={108} width={112} height={40} className={i >= 3 && k === 0 ? "d-box-fill" : "d-box"} />
                          <text x={168 + k * 384} y={134} className="d-m" textAnchor="middle">{k === 0 ? "≤ 20 | > 20" : "≤ 60 | > 60"}</text>
                        </g>
                      </g>
                    ))}

                    {/* leaves */}
                    {[0, 1, 2, 3].map((k) => (
                      <g key={k}>
                        <line x1={168 + Math.floor(k / 2) * 384} y1="148" x2={72 + k * 192} y2="180" className="d-l" markerEnd={i >= 4 && k === 1 ? "url(#pa-ok)" : "url(#pa)"} data-c={i >= 4 && k === 1 ? "ok" : undefined} />
                        <g data-c={i >= 4 && k === 1 ? "ok" : undefined}>
                          <rect x={16 + k * 192} y={180} width={112} height={40} className={i >= 4 && k === 1 ? "d-box-fill" : "d-box"} />
                          <text x={72 + k * 192} y={206} className="d-m" textAnchor="middle">
                            {["1–20", "21–40", "41–60", "61–80"][k]}
                          </text>
                        </g>
                      </g>
                    ))}

                    {i >= 4 && (
                      <g data-enter="" data-c="ok">
                        <Ic n="check" x={16} y={228} s={15} c="ok" />
                        <text x="38" y="240" className="d-m">
                          {s(T.d1win)}
                        </text>
                      </g>
                    )}
                    {i === 5 && (
                      <g data-enter="" data-c="bad">
                        <Ic n="alert" x={392} y={228} s={15} c="bad" />
                        <text x="414" y="240" className="d-m">
                          {s(T.d1cost)}
                        </text>
                      </g>
                    )}
                    {i <= 3 && (
                      <text x="16" y="240" className="d-s">
                        {s(T.d1bal)}
                      </text>
                    )}
                  </>
                )}
              </>
            );
          }}
        </Walkthrough>

        <Table
          head={[s(T.t1h1), s(T.t1h2)]}
          rows={[
            [s(T.t1r1a), s(T.t1r1b)],
            ["GIN", s(T.t1r2b)],
            ["GiST", s(T.t1r3b)],
            ["HNSW / IVFFlat", s(T.t1r4b)],
          ]}
        />
      </Sec>

      <Sec n="10.2" t={s(T.s2)}>
        <P>
          <Tr
            vi={
              <>
                Index B-tree thường chỉ dùng được khi vế trái của điều kiện là <strong>cột trần</strong>. Viết{" "}
                <code>WHERE LOWER(skill_name) = 'java'</code> thì index trên <code>skill_name</code> vô dụng —
                database phải tính <code>LOWER</code> cho từng dòng, tức quét toàn bảng.
              </>
            }
            en={
              <>
                An ordinary B-tree index only applies when the left side of the condition is a{" "}
                <strong>bare column</strong>. Write <code>WHERE LOWER(skill_name) = 'java'</code> and the index
                on <code>skill_name</code> is useless — the database must compute <code>LOWER</code> for every
                row, which is a full scan.
              </>
            }
          />
        </P>
        <CodeTr
          lang="sql"
          vi={`-- index thường: không giúp được câu dưới
CREATE INDEX ON fpt_subject_skills (skill_name);

-- index biểu thức: lưu sẵn kết quả LOWER(...)
CREATE INDEX idx_fss_skill_name ON fpt_subject_skills (LOWER(skill_name));`}
          en={`-- an ordinary index: no help to the query below
CREATE INDEX ON fpt_subject_skills (skill_name);

-- an expression index: stores the LOWER(...) result itself
CREATE INDEX idx_fss_skill_name ON fpt_subject_skills (LOWER(skill_name));`}
        />
        <P>
          <Tr
            vi={
              <>
                Cùng nguyên lý đó giải thích vì sao{" "}
                <code>WHERE created_at + interval '1 day' &gt; now()</code> chậm, còn{" "}
                <code>WHERE created_at &gt; now() - interval '1 day'</code> nhanh — chỉ khác chỗ đặt phép tính.
              </>
            }
            en={
              <>
                The same principle explains why{" "}
                <code>WHERE created_at + interval '1 day' &gt; now()</code> is slow while{" "}
                <code>WHERE created_at &gt; now() - interval '1 day'</code> is fast — the only difference is
                which side the arithmetic sits on.
              </>
            }
          />
        </P>
        <Limit>
          <Tr
            vi={
              <>
                Sáu index của tôi được thêm dựa trên việc <em>đọc câu truy vấn</em>, không phải dựa trên{" "}
                <code>EXPLAIN ANALYZE</code> trước và sau. Đó là suy luận đúng hướng nhưng chưa phải phép đo, và
                tôi nói rõ điều đó khi được hỏi.
              </>
            }
            en={
              <>
                My six indexes were added by <em>reading the queries</em>, not from an{" "}
                <code>EXPLAIN ANALYZE</code> before and after. That is reasoning in the right direction but it
                is not a measurement, and I say so when asked.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="10.3" t={s(T.s3)}>
        <Fig
          viewBox="0 0 720 200"
          aria={s(T.fig3aria)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 10.3" : "Figure 10.3"}</span>
              <Tr
                vi={
                  <>
                    Phần được tô là phần giữ lại. <code>LEFT JOIN</code> giữ toàn bộ bảng trái kể cả khi bên
                    phải không khớp — chỗ không khớp thành <code>NULL</code>.
                  </>
                }
                en={
                  <>
                    The filled area is what survives. <code>LEFT JOIN</code> keeps the whole left table even
                    where the right side has no match — those places become <code>NULL</code>.
                  </>
                }
              />
            </>
          }
        >
          {[
            { t: "INNER", l: false, r: false, c: true },
            { t: "LEFT", l: true, r: false, c: true },
            { t: "RIGHT", l: false, r: true, c: true },
            { t: "FULL OUTER", l: true, r: true, c: true },
          ].map((j, n) => (
            <g key={j.t}>
              <circle cx={64 + n * 176} cy={88} r={44} className={j.l ? "d-box-a" : "d-box"} />
              <circle cx={112 + n * 176} cy={88} r={44} className={j.r ? "d-box-a" : "d-box"} />
              <text x={88 + n * 176} y={160} className="d-b" textAnchor="middle" fontSize="11">{j.t}</text>
              <text x={88 + n * 176} y={178} className="d-s" textAnchor="middle">
                {[s(T.j1), s(T.j2), s(T.j3), s(T.j4)][n]}
              </text>
              <text x={44 + n * 176} y={40} className="d-s">A</text>
              <text x={128 + n * 176} y={40} className="d-s">B</text>
            </g>
          ))}
        </Fig>
        <P>
          <Tr
            vi={
              <>
                <code>CROSS JOIN</code> tạo tích Descartes — mọi dòng bảng A ghép với mọi dòng bảng B. Nó gần như
                luôn là lỗi khi xuất hiện ngoài ý muốn, thường do quên điều kiện <code>ON</code>.
              </>
            }
            en={
              <>
                <code>CROSS JOIN</code> produces the Cartesian product — every row of A paired with every row of
                B. When it turns up unintentionally it is almost always a bug, usually a forgotten{" "}
                <code>ON</code> clause.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="10.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                <strong>A</strong>tomicity — được ăn cả ngã về không. <strong>C</strong>onsistency — ràng buộc
                luôn được giữ. <strong>I</strong>solation — transaction song song không thấy trạng thái dở dang
                của nhau. <strong>D</strong>urability — commit rồi thì mất điện vẫn còn.
              </>
            }
            en={
              <>
                <strong>A</strong>tomicity — all of it or none of it. <strong>C</strong>onsistency — the
                constraints always hold. <strong>I</strong>solation — concurrent transactions never see each
                other's half-finished state. <strong>D</strong>urability — once committed, it survives the power
                going out.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t4h1), s(T.t4h2), s(T.t4h3), s(T.t4h4)]}
          rows={[
            ["READ UNCOMMITTED", s(T.yes), s(T.yes), s(T.yes)],
            [s(T.rcLabel), s(T.no), s(T.yes), s(T.yes)],
            ["REPEATABLE READ", s(T.no), s(T.no), s(T.nostar)],
            ["SERIALIZABLE", s(T.no), s(T.no), s(T.no)],
          ]}
        />
        <Trap t={T.trap4}>
          <Tr
            vi={
              <p>
                PostgreSQL <strong>không có READ UNCOMMITTED thật</strong> — khai mức đó thì nó chạy như READ
                COMMITTED, vì kiến trúc MVCC không bao giờ để lộ dữ liệu chưa commit. Và REPEATABLE READ của
                PostgreSQL <em>mạnh hơn</em> chuẩn SQL: nó chặn luôn phantom read, nhờ chụp ảnh toàn bộ database
                chứ không khoá từng dòng.
              </p>
            }
            en={
              <p>
                PostgreSQL <strong>has no real READ UNCOMMITTED</strong> — ask for it and you get READ
                COMMITTED, because the MVCC architecture never exposes uncommitted data at all. And
                PostgreSQL's REPEATABLE READ is <em>stronger</em> than the SQL standard: it blocks phantom
                reads too, by snapshotting the whole database rather than locking individual rows.
              </p>
            }
          />
        </Trap>
        <P>
          <Tr
            vi={
              <>
                <strong>MVCC:</strong> <code>UPDATE</code> không ghi đè dòng cũ mà <em>viết một phiên bản
                mới</em>. Kết quả quan trọng nhất: <strong>đọc không chặn ghi, ghi không chặn đọc</strong>. Cái
                giá là các phiên bản chết tích lại làm bảng phình, và <code>VACUUM</code> phải dọn chúng.
              </>
            }
            en={
              <>
                <strong>MVCC:</strong> an <code>UPDATE</code> does not overwrite the old row, it{" "}
                <em>writes a new version</em>. The consequence that matters:{" "}
                <strong>readers never block writers and writers never block readers</strong>. The price is dead
                versions accumulating and bloating the table, which <code>VACUUM</code> has to clear.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="10.5" t={s(T.s5)}>
        <P>
          <Tr
            vi={
              <>
                <strong>WHERE và HAVING:</strong> <code>WHERE</code> lọc <em>trước</em> <code>GROUP BY</code>,
                làm việc trên từng dòng. <code>HAVING</code> lọc <em>sau</em>, làm việc trên nhóm và dùng được
                hàm tổng hợp.
              </>
            }
            en={
              <>
                <strong>WHERE and HAVING:</strong> <code>WHERE</code> filters <em>before</em>{" "}
                <code>GROUP BY</code> and works on individual rows. <code>HAVING</code> filters{" "}
                <em>after</em>, works on groups, and may use aggregate functions.
              </>
            }
          />
        </P>
        <CodeTr
          lang="sql"
          vi={`-- phòng ban có hơn 10 nhân viên
SELECT department, COUNT(*) FROM employee
GROUP BY department
HAVING COUNT(*) > 10;

-- lương cao thứ hai, bỏ giá trị trùng
SELECT DISTINCT salary FROM employee
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- hoặc bằng hàm cửa sổ, rõ ý hơn khi có nhiều người cùng lương
SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) r FROM employee
) t WHERE r = 2;`}
          en={`-- departments with more than 10 employees
SELECT department, COUNT(*) FROM employee
GROUP BY department
HAVING COUNT(*) > 10;

-- second highest salary, duplicates removed
SELECT DISTINCT salary FROM employee
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- or with a window function, clearer when several people share a salary
SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) r FROM employee
) t WHERE r = 2;`}
        />
        <Table
          head={["", "DELETE", "TRUNCATE", "DROP"]}
          rows={[
            [s(T.t5r1), s(T.t5r1a), s(T.t5r1b), s(T.t5r1c)],
            [s(T.t5r2), s(T.t5r2a), s(T.t5r2b), s(T.t5r2b)],
            [s(T.t5r3), s(T.t5r3a), s(T.t5r3a), s(T.t5r3c)],
            [s(T.t5r4), s(T.t5r4a), s(T.t5r4b), s(T.t5r4b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                <strong>UNION và UNION ALL:</strong> <code>UNION</code> loại dòng trùng nên phải sắp xếp hoặc
                băm — chậm hơn. <code>UNION ALL</code> gộp thẳng, giữ cả dòng trùng. Nếu biết chắc không trùng
                thì dùng <code>UNION ALL</code>.
              </>
            }
            en={
              <>
                <strong>UNION and UNION ALL:</strong> <code>UNION</code> removes duplicates, so it must sort or
                hash — slower. <code>UNION ALL</code> simply concatenates, duplicates included. When you know
                there are none, use <code>UNION ALL</code>.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="10.6" t={s(T.s6)}>
        <P>
          <Tr
            vi={
              <>
                pgvector thêm kiểu <code>vector</code> cùng các toán tử khoảng cách: <code>&lt;-&gt;</code>{" "}
                Euclid, <code>&lt;=&gt;</code> cosine, <code>&lt;#&gt;</code> tích vô hướng.
              </>
            }
            en={
              <>
                pgvector adds a <code>vector</code> type and its distance operators: <code>&lt;-&gt;</code>{" "}
                Euclidean, <code>&lt;=&gt;</code> cosine, <code>&lt;#&gt;</code> inner product.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Với embedding văn bản, <strong>cosine</strong> là lựa chọn thường dùng vì nó đo <em>hướng</em>{" "}
                chứ không đo độ dài — hai đoạn cùng chủ đề nhưng khác độ dài vẫn gần nhau.
              </>
            }
            en={
              <>
                For text embeddings, <strong>cosine</strong> is the usual choice because it measures{" "}
                <em>direction</em> rather than magnitude — two passages on the same subject stay close even when
                one is far longer.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Cả <code>IVFFlat</code> lẫn <code>HNSW</code> đều là tìm kiếm <strong>gần đúng</strong> — đánh
                đổi một chút độ chính xác lấy tốc độ. Đây là khác biệt căn bản với B-tree, nơi kết quả luôn chính
                xác tuyệt đối.
              </>
            }
            en={
              <>
                Both <code>IVFFlat</code> and <code>HNSW</code> are <strong>approximate</strong> searches —
                trading a little accuracy for speed. That is the fundamental difference from a B-tree, whose
                answer is always exact.
              </>
            }
          />
        </P>
      </Sec>
    </div>
  );
}
