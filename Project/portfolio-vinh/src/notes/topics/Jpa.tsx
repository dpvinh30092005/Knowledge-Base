import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Tr, say, type Tx } from "../i18n";
import { Defs, Fig, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 09 · JPA & Hibernate.
 *
 * The two walkthroughs are the two things that bite: which state an entity is in
 * (because the state decides whether your change is saved at all), and how a
 * query count grows (because it grows invisibly on a development machine).
 */

const T = {
  lede: {
    vi: "Hai thứ hay gây lỗi nhất ở đây đều vô hình trong mã nguồn: entity đang ở trạng thái nào, và một getter vừa bắn ra bao nhiêu câu SQL.",
    en: "The two things that bite hardest here are both invisible in the source: which state an entity is in, and how many SQL statements a getter just fired.",
  },
  source: {
    vi: "42 entity của IntelliPath, schema do migration quản lý với ddl-auto: none.",
    en: "IntelliPath's 42 entities, schema owned by migrations with ddl-auto: none.",
  },

  /* 9.1 */
  s1: { vi: "Ba tầng chồng lên nhau", en: "Three layers stacked" },
  fig1aria: {
    vi: "Sáu tầng từ code của bạn xuống tới driver PostgreSQL",
    en: "Six layers, from your code down to the PostgreSQL driver",
  },
  l1a: { vi: "Code của bạn", en: "Your code" },
  l1c: { vi: "JPA (đặc tả)", en: "JPA (the spec)" },
  l1f: { vi: "Driver PG", en: "PG driver" },
  d1spec: { vi: "chỉ là interface — không chạy được", en: "interfaces only — it cannot run" },
  d1abs: { vi: "trừu tượng nhất", en: "most abstract" },
  d1hw: { vi: "gần phần cứng nhất", en: "closest to the hardware" },

  /* 9.2 */
  s2: { vi: "Bốn trạng thái của một entity", en: "The four states of an entity" },
  fig2aria: {
    vi: "Một entity đi từ transient sang managed, được sửa, flush, rồi thành detached",
    en: "An entity moves from transient to managed, is modified, flushed, and becomes detached",
  },
  st1: { vi: "chưa có id", en: "no id yet" },
  st2: { vi: "đang theo dõi", en: "being tracked" },
  st3: { vi: "không ai theo dõi", en: "nobody is tracking it" },
  st4: { vi: "chờ xoá", en: "queued for deletion" },
  d2tx: { vi: "tx đóng", en: "tx closes" },
  d2snap: { vi: "ảnh chụp lúc nạp", en: "snapshot taken at load" },
  d2now: { vi: "trạng thái hiện tại", en: "current state" },
  d2diff: {
    vi: "khác nhau → sinh UPDATE students SET full_name = ? — không ai gọi save()",
    en: "they differ → UPDATE students SET full_name = ? — nobody called save()",
  },
  d2nosql: { vi: "sửa ở đây không sinh SQL nào cả", en: "editing here produces no SQL at all" },
  d2new: {
    vi: "new Student() — persistence context chưa biết object này tồn tại",
    en: "new Student() — the persistence context does not know this object exists",
  },

  /* 9.3 */
  s3: { vi: "Persistence context và dirty checking", en: "The persistence context and dirty checking" },
  trap3: { vi: "Hệ quả về hiệu năng", en: "The performance consequence" },

  /* 9.4 */
  s4: { vi: "N+1 — lỗi mà máy dev không bao giờ cho bạn thấy", en: "N+1 — the bug a dev machine never shows you" },
  fig4aria: {
    vi: "Một truy vấn danh sách rồi thêm một truy vấn cho mỗi phần tử, so với một truy vấn JOIN FETCH",
    en: "One list query plus one query per element, against a single JOIN FETCH query",
  },
  k4a: { vi: "một lần đi lại database", en: "one round trip" },
  k4b: { vi: "N lần thừa", en: "N surplus trips" },
  k4c: { vi: "sau khi chữa", en: "after the fix" },
  d4fetch: { vi: "1 · JOIN FETCH — quan hệ nạp cùng lúc", en: "1 · JOIN FETCH — the relation loads with it" },
  d4sel: { vi: "1 · select skill_nodes", en: "1 · select skill_nodes" },
  d4trips: { vi: "500 nút → 501 lần đi lại", en: "500 nodes → 501 round trips" },
  d4one: { vi: "một lần đi lại, cùng dữ liệu", en: "one round trip, the same data" },
  t4h1: { vi: "Cách chữa", en: "The fix" },
  t4h2: { vi: "Được gì", en: "What you gain" },
  t4h3: { vi: "Mất gì", en: "What you lose" },
  t4r1b: { vi: "một câu duy nhất", en: "a single statement" },
  t4r1c: { vi: "không ghép được với phân trang", en: "does not combine with pagination" },
  t4r2b: {
    vi: "khai báo, ghép được với method suy ra từ tên",
    en: "declarative, works with derived query methods",
  },
  t4r2c: { vi: "vẫn dính bẫy phân trang", en: "still hits the pagination trap" },
  t4r3b: { vi: "gom N câu thành N/size câu IN(...)", en: "folds N statements into N/size IN(...) statements" },
  t4r3c: { vi: "không xoá hết, nhưng ghép được phân trang", en: "does not eliminate it, but pagination works" },
  t4r4a: { vi: "Chiếu ra DTO", en: "DTO projection" },
  t4r4b: { vi: "nhanh nhất, không tạo entity", en: "fastest, no entities created" },
  t4r4c: { vi: "không sửa được kết quả trả về", en: "the result cannot be modified" },
  trap4: { vi: "Câu đào sâu chắc chắn sẽ tới", en: "The deep cut that always comes" },

  /* 9.5 */
  s5: { vi: "LAZY và EAGER", en: "LAZY and EAGER" },

  /* 9.6 */
  s6: { vi: "ddl-auto: none, và vì sao", en: "ddl-auto: none, and why" },

  /* 9.7 */
  s7: { vi: "equals và hashCode cho entity", en: "equals and hashCode on an entity" },
  t7h1: { vi: "Cách", en: "Approach" },
  t7r1a: { vi: "Hằng số", en: "Constant" },
  t7r1c: { vi: "so id", en: "compare the id" },
  t7r2a: { vi: "Business key", en: "Business key" },
  t7r2b: { vi: "từ khoá tự nhiên bất biến", en: "from an immutable natural key" },
  t7r2c: { vi: "so khoá đó", en: "compare that key" },
  t7r3a: { vi: "UUID gán sớm", en: "UUID assigned early" },
  t7r3b: { vi: "từ UUID sinh trong constructor", en: "from a UUID generated in the constructor" },
  t7r3c: { vi: "so UUID", en: "compare the UUID" },
} satisfies Record<string, Tx>;

function lifeSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "transient", note: "new Student() — chưa có id, persistence context chưa biết tới nó. Sửa gì cũng không ai ghi lại." },
        { label: "managed", note: "persist() hoặc findById() đưa nó vào persistence context. Từ đây Hibernate giữ một ảnh chụp trạng thái ban đầu." },
        { label: "sửa trường", note: "setFullName(...). KHÔNG cần gọi save() — đang managed thì Hibernate tự phát hiện thay đổi." },
        { label: "flush", note: "Trước commit, Hibernate so trạng thái hiện tại với ảnh chụp và sinh UPDATE cho đúng những cột đã đổi. Đó là dirty checking." },
        { label: "detached", note: "Transaction đóng, persistence context đóng theo. Object vẫn còn trong bộ nhớ nhưng không ai theo dõi nữa." },
        { label: "sửa khi detached", note: "Sửa lúc này KHÔNG sinh SQL nào. Đây là lỗi im lặng phổ biến nhất trong JPA — muốn ghi thì phải merge() lại." },
      ]
    : [
        { label: "transient", note: "new Student() — no id yet, and the persistence context has never heard of it. Change anything you like; nobody records it." },
        { label: "managed", note: "persist() or findById() puts it into the persistence context. From here Hibernate keeps a snapshot of the loaded state." },
        { label: "modify a field", note: "setFullName(...). No save() call needed — while it is managed, Hibernate detects the change itself." },
        { label: "flush", note: "Before commit, Hibernate compares the current state against the snapshot and emits an UPDATE for exactly the changed columns. That is dirty checking." },
        { label: "detached", note: "The transaction closes and the persistence context closes with it. The object is still in memory, but nobody is watching it." },
        { label: "modify while detached", note: "This change produces NO SQL. It is the most common silent bug in JPA — to persist it you must merge() first." },
      ];
}

function np1Steps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "1 truy vấn", note: "findAll() lấy về 5 nút lộ trình. Một câu SQL, mọi thứ vẫn ổn." },
        { label: "chạm nút 1", note: "getSkill() trên nút đầu. Quan hệ là LAZY, nên Hibernate bắn thêm một câu SELECT ngay tại đây." },
        { label: "chạm nút 2", note: "Lại một câu nữa. Không có gì trong code trông giống một truy vấn — chỉ là một lời gọi getter." },
        { label: "chạm nút 3", note: "Ba câu. Trên máy dev với hai mươi dòng dữ liệu, tất cả vẫn tức thì." },
        { label: "…tới hết", note: "Với 500 nút là 501 lần đi lại database. Mỗi lần tốn độ trễ mạng cộng chi phí phân tích câu lệnh." },
        { label: "JOIN FETCH", note: "Nạp quan hệ ngay trong câu đầu. Cùng dữ liệu trả về, một lần đi lại." },
      ]
    : [
        { label: "1 query", note: "findAll() returns 5 roadmap nodes. One SQL statement, everything is fine." },
        { label: "touch node 1", note: "getSkill() on the first node. The relation is LAZY, so Hibernate fires another SELECT right here." },
        { label: "touch node 2", note: "And another. Nothing in the code looks like a query — it is just a getter call." },
        { label: "touch node 3", note: "Three statements. On a dev machine with twenty rows of data, all of it is still instant." },
        { label: "…all the way", note: "At 500 nodes that is 501 round trips to the database. Each one costs network latency plus statement parsing." },
        { label: "JOIN FETCH", note: "Load the relation in the first query. Same data returned, one round trip." },
      ];
}

export default function Jpa({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="09" name="JPA & Hibernate" lede={s(T.lede)} source={s(T.source)} />

      <Sec n="9.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                <strong>JPA</strong> là đặc tả — một tập interface và annotation, tự nó không chạy được.{" "}
                <strong>Hibernate</strong> là bản hiện thực phổ biến nhất và là mặc định của Spring Boot.{" "}
                <strong>Spring Data JPA</strong> là lớp bọc bên trên: bạn khai một interface kế thừa{" "}
                <code>JpaRepository</code>, Spring sinh bản hiện thực lúc chạy.
              </>
            }
            en={
              <>
                <strong>JPA</strong> is the specification — a set of interfaces and annotations that cannot run
                on their own. <strong>Hibernate</strong> is the most widely used implementation and Spring
                Boot's default. <strong>Spring Data JPA</strong> is the layer above: you declare an interface
                extending <code>JpaRepository</code> and Spring generates the implementation at run time.
              </>
            }
          />
        </P>
        <Fig
          viewBox="0 0 720 176"
          aria={s(T.fig1aria)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 9.1" : "Figure 9.1"}</span>
              <Tr
                vi={
                  <>
                    Mỗi tầng chỉ biết tầng ngay dưới nó. Đó là lý do đổi Hibernate sang EclipseLink về lý thuyết
                    không cần sửa code nghiệp vụ.
                  </>
                }
                en={
                  <>
                    Each layer knows only the one directly beneath it. That is why swapping Hibernate for
                    EclipseLink should, in theory, leave the business code untouched.
                  </>
                }
              />
            </>
          }
        >
          {[s(T.l1a), "Spring Data JPA", s(T.l1c), "Hibernate", "JDBC", s(T.l1f)].map((t, i) => (
            <g key={t}>
              <rect x={8 + i * 118} y={56} width={104} height={56} className={i === 2 ? "d-box-a" : "d-box"} />
              <text x={60 + i * 118} y={80} className={i === 2 ? "d-b-a" : "d-b"} textAnchor="middle" fontSize="11">
                {t.split(" ")[0]}
              </text>
              <text x={60 + i * 118} y={96} className="d-s" textAnchor="middle">
                {t.split(" ").slice(1).join(" ")}
              </text>
              {i < 5 && <line x1={112 + i * 118} y1={84} x2={120 + i * 118} y2={84} className="d-l" markerEnd="url(#pa)" />}
            </g>
          ))}
          <text x="244" y="140" className="d-a">{s(T.d1spec)}</text>
          <text x="8" y="32" className="d-s">{s(T.d1abs)}</text>
          <text x="712" y="32" className="d-s" textAnchor="end">{s(T.d1hw)}</text>
        </Fig>
      </Sec>

      <Sec n="9.2" t={s(T.s2)}>
        <Walkthrough
          viewBox="0 0 720 224"
          aria={s(T.fig2aria)}
          hold={2100}
          steps={lifeSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 9.2" : "Figure 9.2"}</span>
              <Tr
                vi={
                  <>
                    Cùng một dòng <code>setFullName(...)</code> cho hai kết quả khác nhau, và khác biệt duy nhất
                    là entity đang ở trạng thái nào.
                  </>
                }
                en={
                  <>
                    The same <code>setFullName(...)</code> line gives two different outcomes, and the only
                    difference is which state the entity is in.
                  </>
                }
              />
            </>
          }
        >
          {(i) => {
            const state = i === 0 ? 0 : i <= 3 ? 1 : 2;
            const names = ["Transient", "Managed", "Detached", "Removed"];
            return (
              <>
                {names.map((n, k) => (
                  <g key={n}>
                    <rect x={16 + k * 176} y={48} width={144} height={56} className={k === state ? "d-box-a" : "d-box"} />
                    <text x={88 + k * 176} y={74} className={k === state ? "d-b-a" : "d-b"} textAnchor="middle">
                      {n}
                    </text>
                    <text x={88 + k * 176} y={92} className="d-s" textAnchor="middle">
                      {[s(T.st1), s(T.st2), s(T.st3), s(T.st4)][k]}
                    </text>
                  </g>
                ))}
                <line x1="160" y1="76" x2="184" y2="76" className={i >= 1 ? "d-l-a" : "d-l"} markerEnd={i >= 1 ? "url(#pa-a)" : "url(#pa)"} />
                <text x="164" y="40" className="d-s">persist()</text>
                <line x1="336" y1="76" x2="360" y2="76" className={i >= 4 ? "d-l-a" : "d-l"} markerEnd={i >= 4 ? "url(#pa-a)" : "url(#pa)"} />
                <text x="330" y="40" className="d-s">{s(T.d2tx)}</text>
                <line x1="512" y1="76" x2="536" y2="76" className="d-l-q" />
                <text x="516" y="40" className="d-s">remove()</text>

                {i >= 1 && i <= 3 && (
                  <g data-enter="">
                    <rect x={192} y={128} width={192} height={48} className="d-box-fill" />
                    <text x={204} y={148} className="d-s">{s(T.d2snap)}</text>
                    <text x={204} y={166} className="d-m">fullName = "Vinh"</text>
                  </g>
                )}
                {i >= 2 && i <= 3 && (
                  <g data-enter="">
                    <rect x={408} y={128} width={192} height={48} className="d-box-a" />
                    <text x={420} y={148} className="d-s">{s(T.d2now)}</text>
                    <text x={420} y={166} className="d-m-a">fullName = "Phước Vinh"</text>
                    <line x1={384} y1={152} x2={400} y2={152} className="d-l-a" markerEnd="url(#pa-a)" />
                  </g>
                )}
                {i === 3 && (
                  <text x={192} y={208} className="d-a" data-enter="">
                    {s(T.d2diff)}
                  </text>
                )}
                {i === 5 && (
                  <text x={352} y={208} className="d-a" data-enter="">
                    {s(T.d2nosql)}
                  </text>
                )}
                {i === 0 && (
                  <text x={16} y={208} className="d-s" data-enter="">
                    {s(T.d2new)}
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
                Ranh giới <strong>managed → detached</strong> còn là gốc của một lỗi khác: nạp entity trong
                service có <code>@Transactional</code>, trả về controller, transaction đóng, rồi Jackson chạm vào
                một collection lazy — <code>LazyInitializationException</code>. Đây là một lý do nữa để trả DTO
                thay vì entity.
              </>
            }
            en={
              <>
                The <strong>managed → detached</strong> boundary is also the root of another bug: load an entity
                in a <code>@Transactional</code> service, return it to the controller, the transaction closes,
                and then Jackson touches a lazy collection — <code>LazyInitializationException</code>. One more
                reason to return DTOs instead of entities.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="9.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Persistence context là <strong>cache cấp một</strong>, phạm vi một transaction. Nạp cùng một id
                hai lần trong một transaction chỉ tốn một câu SQL, và hai lần đều trả về{" "}
                <em>cùng một instance Java</em>.
              </>
            }
            en={
              <>
                The persistence context is the <strong>first-level cache</strong>, scoped to one transaction.
                Loading the same id twice inside a transaction costs one SQL statement, and both loads return{" "}
                <em>the same Java instance</em>.
              </>
            }
          />
        </P>
        <Trap t={T.trap3}>
          <Tr
            vi={
              <p>
                Nạp 10.000 entity chỉ để đọc là ép Hibernate giữ 10.000 ảnh chụp và so sánh tất cả lúc flush. Với
                truy vấn chỉ đọc, dùng <code>@Transactional(readOnly = true)</code> để tắt dirty checking, hoặc
                chiếu thẳng ra DTO.
              </p>
            }
            en={
              <p>
                Loading 10,000 entities just to read them forces Hibernate to keep 10,000 snapshots and compare
                every one of them at flush. For read-only queries, use{" "}
                <code>@Transactional(readOnly = true)</code> to switch dirty checking off, or project straight
                into a DTO.
              </p>
            }
          />
        </Trap>
      </Sec>

      <Sec n="9.4" t={s(T.s4)}>
        <Walkthrough
          viewBox="0 0 720 232"
          aria={s(T.fig4aria)}
          hold={1600}
          steps={np1Steps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 9.4" : "Figure 9.4"}</span>
              <Tr
                vi={
                  <>
                    Không dòng nào trong vòng lặp trông giống một truy vấn. Đó là lý do lỗi này sống sót qua code
                    review.
                  </>
                }
                en={
                  <>
                    Not one line in the loop looks like a query. That is how this bug survives code review.
                  </>
                }
              />
              <Key
                items={[
                  { c: "warn", t: s(T.k4a) },
                  { c: "bad", t: s(T.k4b) },
                  { c: "ok", t: s(T.k4c) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const fixed = i === 5;
            const n = Math.min(i, 3);
            return (
              <>
                <rect x="24" y="48" width="120" height="48" className="d-box" />
                <Ic n="server" x={36} y={62} s={16} />
                <text x="94" y="78" className="d-b" textAnchor="middle">Backend</text>
                <rect x="560" y="48" width="128" height="48" className="d-box-q" />
                <Ic n="database" x={572} y={62} s={16} />
                <text x="634" y="78" className="d-s" textAnchor="middle">PostgreSQL</text>

                <line x1="144" y1="72" x2="552" y2="72" className="d-l" markerEnd={fixed ? "url(#pa-ok)" : "url(#pa-warn)"} data-c={fixed ? "ok" : "warn"} />
                <text x="240" y="64" className="d-m" data-c={fixed ? "ok" : "warn"}>
                  {fixed ? s(T.d4fetch) : s(T.d4sel)}
                </text>

                {!fixed &&
                  [0, 1, 2].map((k) =>
                    k < n ? (
                      <g key={k} data-enter="" data-c="bad">
                        <line x1="144" y1={112 + k * 28} x2="552" y2={112 + k * 28} className="d-l" markerEnd="url(#pa-a)" />
                        <text x="240" y={104 + k * 28} className="d-m">
                          {k + 2} · select skill where id = ?
                        </text>
                      </g>
                    ) : null,
                  )}

                {i === 4 && (
                  <g data-enter="" data-c="bad">
                    <text x="240" y="200" className="d-s">…</text>
                    <Ic n="alert" x={24} y={188} s={15} c="bad" />
                    <text x="46" y="200" className="d-m">{s(T.d4trips)}</text>
                  </g>
                )}

                {fixed && (
                  <g data-enter="" data-c="ok">
                    <Ic n="check" x={24} y={124} s={15} c="ok" />
                    <text x="46" y="136" className="d-m">{s(T.d4one)}</text>
                  </g>
                )}

                <text x="24" y="224" className="d-s">
                  {fixed ? "@Query(\"select n from SkillNode n join fetch n.skill\")" : "for (SkillNode n : nodes) n.getSkill().getSkillName();"}
                </text>
              </>
            );
          }}
        </Walkthrough>

        <Table
          head={[s(T.t4h1), s(T.t4h2), s(T.t4h3)]}
          rows={[
            [<code key="a">JOIN FETCH</code>, s(T.t4r1b), s(T.t4r1c)],
            [<code key="b">@EntityGraph</code>, s(T.t4r2b), s(T.t4r2c)],
            [<code key="c">@BatchSize</code>, s(T.t4r3b), s(T.t4r3c)],
            [s(T.t4r4a), s(T.t4r4b), s(T.t4r4c)],
          ]}
        />

        <Trap t={T.trap4}>
          <Tr
            vi={
              <>
                <p>
                  <strong><code>JOIN FETCH</code> cộng phân trang là một cái bẫy.</strong> Khi fetch một
                  collection kèm <code>LIMIT</code>, Hibernate <em>không thể</em> phân trang trong SQL — một hàng
                  cha nở ra nhiều hàng sau khi join, nên <code>LIMIT 10</code> có thể chỉ lấy được 3 cha.
                  Hibernate xử lý bằng cách <strong>nạp toàn bộ về bộ nhớ rồi mới cắt trang</strong>, kèm cảnh
                  báo <code>HHH000104</code>. Với bảng lớn là hết bộ nhớ.
                </p>
                <p>
                  Cách đúng: dùng <code>@BatchSize</code>, hoặc truy vấn hai lần — lấy id có phân trang trước,
                  rồi fetch theo danh sách id đó.
                </p>
              </>
            }
            en={
              <>
                <p>
                  <strong><code>JOIN FETCH</code> plus pagination is a trap.</strong> When a collection is
                  fetched alongside a <code>LIMIT</code>, Hibernate <em>cannot</em> paginate in SQL — one parent
                  row multiplies into several after the join, so <code>LIMIT 10</code> might return only 3
                  parents. Hibernate's answer is to{" "}
                  <strong>load everything into memory and slice the page there</strong>, with an{" "}
                  <code>HHH000104</code> warning. On a large table that means running out of memory.
                </p>
                <p>
                  The right approach: use <code>@BatchSize</code>, or query twice — fetch the paginated ids
                  first, then fetch by that list of ids.
                </p>
              </>
            }
          />
        </Trap>
        <Limit>
          <Tr
            vi={
              <>
                Trong repo của tôi chỉ có <strong>4</strong> câu <code>JOIN FETCH</code>, tất cả trong{" "}
                <code>SkillNodeRepository</code>, và <strong>không có</strong> <code>@EntityGraph</code> nào.
                Nghĩa là những quan hệ lazy khác chưa được rà — tôi sửa chỗ đã đo được, không phải toàn bộ.
              </>
            }
            en={
              <>
                My repository holds only <strong>4</strong> <code>JOIN FETCH</code> queries, all in{" "}
                <code>SkillNodeRepository</code>, and <strong>no</strong> <code>@EntityGraph</code> at all. So
                the other lazy relations have not been audited — I fixed what I had measured, not everything.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="9.5" t={s(T.s5)}>
        <P>
          <Tr
            vi={
              <>
                Mặc định của JPA: <code>@OneToMany</code> và <code>@ManyToMany</code> là <strong>LAZY</strong>;{" "}
                <code>@ManyToOne</code> và <code>@OneToOne</code> là <strong>EAGER</strong>.
              </>
            }
            en={
              <>
                The JPA defaults: <code>@OneToMany</code> and <code>@ManyToMany</code> are{" "}
                <strong>LAZY</strong>; <code>@ManyToOne</code> and <code>@OneToOne</code> are{" "}
                <strong>EAGER</strong>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Mặc định EAGER cho <code>@ManyToOne</code> là một quyết định tồi của đặc tả. Lý do: EAGER là toàn
                cục và không tắt được ở chỗ dùng. Một entity EAGER trỏ tới entity EAGER khác tạo ra chuỗi join
                khổng lồ cho <em>mọi</em> truy vấn, kể cả truy vấn không cần dữ liệu đó.
              </>
            }
            en={
              <>
                EAGER as the <code>@ManyToOne</code> default was a poor decision in the specification. The
                reason: EAGER is global and cannot be switched off at the call site. One EAGER entity pointing
                at another produces an enormous join chain on <em>every</em> query, including the queries that
                never wanted that data.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Cách làm được khuyên: đặt <code>fetch = FetchType.LAZY</code> cho tất cả, rồi fetch có chủ đích ở
                từng truy vấn cần.
              </>
            }
            en={
              <>
                The recommended practice: set <code>fetch = FetchType.LAZY</code> everywhere, then fetch
                deliberately in the individual queries that need it.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="9.6" t={s(T.s6)}>
        <P>
          <Tr
            vi={
              <>
                <code>ddl-auto: update</code> để Hibernate tự sửa schema theo entity. Ba vấn đề: nó{" "}
                <strong>không bao giờ xoá hay sửa</strong> cột đã có nên schema cứ phình ra; thay đổi{" "}
                <strong>không được ghi lại ở đâu</strong> nên không ai review được; và nó{" "}
                <strong>không đảo ngược được</strong>.
              </>
            }
            en={
              <>
                <code>ddl-auto: update</code> lets Hibernate adjust the schema to match the entities. Three
                problems: it <strong>never drops or alters</strong> an existing column, so the schema only
                grows; the changes are <strong>recorded nowhere</strong>, so nobody can review them; and it is{" "}
                <strong>not reversible</strong>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Đặt <code>none</code> nghĩa là schema do <strong>file migration</strong> quyết định — chúng nằm
                trong git, được review như code, và chạy theo đúng thứ tự trên mọi môi trường.
              </>
            }
            en={
              <>
                Setting <code>none</code> means the schema is decided by <strong>migration files</strong> —
                which live in git, get reviewed like code, and run in the same order in every environment.
              </>
            }
          />
        </P>
        <Limit>
          <Tr
            vi={
              <>
                Thư mục migration của tôi có{" "}
                <strong>20 file SQL nhưng chỉ 5 file đặt tên đúng chuẩn Flyway</strong> (<code>V…__….sql</code>).
                15 file còn lại thiếu tiền tố <code>V</code> nên Flyway bỏ qua hoàn toàn — chúng là script chạy
                tay. Đây là nợ kỹ thuật tôi tự tìm ra và chưa trả.
              </>
            }
            en={
              <>
                My migration folder holds <strong>20 SQL files but only 5 named the way Flyway requires</strong>{" "}
                (<code>V…__….sql</code>). The other 15 lack the <code>V</code> prefix, so Flyway ignores them
                entirely — they are scripts run by hand. This is technical debt I found myself and have not paid
                off.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="9.7" t={s(T.s7)}>
        <P>
          <Tr
            vi={
              <>
                Câu này rất ít người trả lời được. Vấn đề: entity mới tạo có <code>id = null</code>. Nếu{" "}
                <code>hashCode</code> tính từ <code>id</code>, bạn bỏ nó vào <code>HashSet</code> lúc chưa có id,
                rồi <code>persist()</code> gán id — <strong>hash đổi</strong>, và object nằm sai bucket vĩnh
                viễn. <code>contains()</code> trả về <code>false</code> dù nó đang ở trong set.
              </>
            }
            en={
              <>
                Very few people answer this one. The problem: a freshly created entity has <code>id = null</code>.
                If <code>hashCode</code> is computed from <code>id</code>, you put it in a{" "}
                <code>HashSet</code> before it has one, then <code>persist()</code> assigns the id —{" "}
                <strong>the hash changes</strong>, and the object sits in the wrong bucket forever.{" "}
                <code>contains()</code> returns <code>false</code> even though it is in the set.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t7h1), "hashCode", "equals"]}
          rows={[
            [s(T.t7r1a), <code key="a">getClass().hashCode()</code>, s(T.t7r1c)],
            [s(T.t7r2a), s(T.t7r2b), s(T.t7r2c)],
            [s(T.t7r3a), s(T.t7r3b), s(T.t7r3c)],
          ]}
        />
        <Trap>
          <Tr
            vi={
              <p>
                Đừng đặt Lombok <code>@Data</code> hay <code>@EqualsAndHashCode</code> lên entity. Nó sinh{" "}
                <code>equals</code>/<code>hashCode</code> từ <em>mọi</em> trường — bao gồm cả quan hệ lazy, nên
                gọi <code>equals</code> là kích hoạt cả loạt truy vấn, và có thể đệ quy vô hạn với quan hệ hai
                chiều.
              </p>
            }
            en={
              <p>
                Do not put Lombok's <code>@Data</code> or <code>@EqualsAndHashCode</code> on an entity. It
                generates <code>equals</code>/<code>hashCode</code> from <em>every</em> field — lazy relations
                included — so calling <code>equals</code> triggers a burst of queries, and with a bidirectional
                relation it can recurse forever.
              </p>
            }
          />
        </Trap>
      </Sec>
    </div>
  );
}
