import { useRef } from "react";
import { COPY, PLATES, type Lang, type PlateId } from "../../content";
import { useCellWake } from "../../Grid";
import { Defs } from "../parts";

/**
 * 00 · Hệ thống của tôi.
 *
 * The six plates that were the whole notes side before it became a notebook.
 * They stay first because they are the only pages here that are *evidence* — the
 * rest of the notebook is theory anyone could write, and these are drawings of
 * something that is running.
 *
 * Bilingual, unlike the theory pages. These face a hiring reader; the theory
 * pages face one student. See design.md.
 */

/* ------------------------------------------------------------- drawings - */

function ChainFig({ lang }: { lang: Lang }) {
  const vi = lang === "vi";
  return (
    <svg viewBox="0 0 720 232" role="img" aria-label={vi ? "Request đi qua ba bộ lọc; danh tính chỉ tồn tại sau bộ lọc JWT" : "A request through three filters; identity exists only after the JWT filter"}>
      <text x="8" y="24" className="d-s">{vi ? "REQUEST" : "REQUEST"}</text>
      <line x1="8" y1="72" x2="88" y2="72" className="d-l" markerEnd="url(#pa)" />

      <rect x="96" y="40" width="136" height="64" className="d-box" />
      <text x="108" y="64" className="d-b">AuthRateLimit</text>
      <text x="108" y="84" className="d-m">IP · 10 / 60s</text>
      <text x="108" y="98" className="d-s">{vi ? "login · refresh · reset" : "login · refresh · reset"}</text>

      <line x1="232" y1="72" x2="272" y2="72" className="d-l" markerEnd="url(#pa)" />

      <rect x="280" y="40" width="136" height="64" className="d-box-a" />
      <text x="292" y="64" className="d-b-a">JwtAuthentication</text>
      <text x="292" y="84" className="d-m">Bearer → principal</text>

      <line x1="416" y1="72" x2="456" y2="72" className="d-l" markerEnd="url(#pa)" />

      <rect x="464" y="40" width="136" height="64" className="d-box" />
      <text x="476" y="64" className="d-b">AiRateLimit</text>
      <text x="476" y="84" className="d-m">user · 15 / 3600s</text>
      <text x="476" y="98" className="d-s">{vi ? "chat · github-import" : "chat · github-import"}</text>

      <line x1="600" y1="72" x2="632" y2="72" className="d-l" markerEnd="url(#pa)" />
      <rect x="632" y="48" width="80" height="48" className="d-box-q" />
      <text x="644" y="76" className="d-s">Controller</text>

      {/* The identity boundary — the one thing this drawing exists to show. */}
      <line x1="348" y1="112" x2="348" y2="160" className="d-l-a" strokeDasharray="4 4" />
      <path d="M348 160 L712 160" className="d-l-a" />
      <text x="356" y="152" className="d-a">{vi ? "từ đây mới biết ai đang gọi" : "identity exists from here"}</text>

      <line x1="8" y1="160" x2="340" y2="160" className="d-l-q" />
      <text x="8" y="152" className="d-s">{vi ? "chưa có danh tính → đếm theo IP" : "no identity yet → count per IP"}</text>

      <text x="356" y="184" className="d-s">
        {vi ? "đăng nhập OAuth tự tạo tài khoản mới," : "OAuth login provisions new accounts,"}
      </text>
      <text x="356" y="200" className="d-s">
        {vi ? "nên đếm theo IP ở đây là vô nghĩa" : "so counting per IP here means nothing"}
      </text>
      <text x="8" y="208" className="d-s">SecurityConfig.java:98–111</text>
    </svg>
  );
}

function LayersFig({ lang }: { lang: Lang }) {
  const vi = lang === "vi";
  return (
    <svg viewBox="0 0 720 264" role="img" aria-label={vi ? "Bốn tầng, với lớp DTO cắt giữa tầng dịch vụ và tầng điều khiển" : "Four layers, with the DTO boundary between service and controller"}>
      <rect x="8" y="24" width="240" height="48" className="d-box" />
      <text x="24" y="46" className="d-b">Controller</text>
      <text x="24" y="64" className="d-m">22 · 137 endpoints</text>

      <rect x="8" y="96" width="240" height="48" className="d-box" />
      <text x="24" y="118" className="d-b">Service</text>
      <text x="24" y="136" className="d-m">{vi ? "nghiệp vụ · transaction" : "business rules · transactions"}</text>

      <rect x="8" y="168" width="240" height="48" className="d-box" />
      <text x="24" y="190" className="d-b">Repository</text>
      <text x="24" y="208" className="d-m">Spring Data JPA</text>

      <line x1="128" y1="72" x2="128" y2="88" className="d-l" markerEnd="url(#pa)" />
      <line x1="128" y1="144" x2="128" y2="160" className="d-l" markerEnd="url(#pa)" />
      <line x1="248" y1="192" x2="304" y2="192" className="d-l" markerEnd="url(#pa)" />

      <rect x="304" y="168" width="152" height="48" className="d-box" />
      <text x="320" y="190" className="d-b">@Entity</text>
      <text x="320" y="208" className="d-m">42</text>

      <line x1="456" y1="192" x2="512" y2="192" className="d-l" markerEnd="url(#pa)" />
      <rect x="512" y="160" width="200" height="64" className="d-box-q" />
      <text x="528" y="182" className="d-s">PostgreSQL 16</text>
      <text x="528" y="198" className="d-s">ddl-auto: none</text>
      <text x="528" y="214" className="d-s">{vi ? "migration giữ schema" : "migrations own the schema"}</text>

      {/* The cut. Entities stop here; only DTOs cross. */}
      <line x1="304" y1="16" x2="304" y2="152" className="d-l-a" strokeDasharray="4 4" />
      <rect x="320" y="24" width="152" height="48" className="d-box-a" />
      <text x="336" y="46" className="d-b-a">DTO</text>
      <text x="336" y="64" className="d-m">181</text>

      <line x1="248" y1="48" x2="312" y2="48" className="d-l-a" markerEnd="url(#pa-a)" />
      <line x1="472" y1="48" x2="528" y2="48" className="d-l-a" markerEnd="url(#pa-a)" />
      <text x="536" y="44" className="d-b">JSON</text>
      <text x="536" y="62" className="d-s">{vi ? "ra ngoài" : "outward"}</text>

      <text x="312" y="112" className="d-a">{vi ? "entity dừng ở đây" : "entities stop here"}</text>
      <text x="312" y="132" className="d-s">
        {vi ? "mã băm mật khẩu, token đã mã hoá không có đường ra" : "password hash and encrypted token have no route out"}
      </text>
      <text x="8" y="248" className="d-s">domain/entity · domain/dto · controllers</text>
    </svg>
  );
}

function NPlusOneFig({ lang }: { lang: Lang }) {
  const vi = lang === "vi";
  const fan = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 720 256" role="img" aria-label={vi ? "Trước: một truy vấn cộng N truy vấn. Sau: một truy vấn JOIN FETCH" : "Before: one query plus N queries. After: a single JOIN FETCH query"}>
      <text x="8" y="20" className="d-s">{vi ? "TRƯỚC" : "BEFORE"}</text>
      <rect x="8" y="32" width="96" height="40" className="d-box" />
      <text x="24" y="57" className="d-b">Backend</text>
      <rect x="240" y="32" width="96" height="40" className="d-box-q" />
      <text x="256" y="57" className="d-s">Postgres</text>

      <line x1="104" y1="48" x2="232" y2="48" className="d-l" markerEnd="url(#pa)" />
      <text x="120" y="42" className="d-m">1 · findAll()</text>

      {fan.map((i) => (
        <line key={i} x1="104" y1={88 + i * 24} x2="232" y2={88 + i * 24} className="d-l" markerEnd="url(#pa)" />
      ))}
      <text x="112" y="82" className="d-m">{vi ? "rồi mỗi nút một câu" : "then one per node"}</text>
      <text x="112" y="214" className="d-s">…</text>
      <text x="8" y="238" className="d-s">{vi ? "500 nút → 501 lần đi lại" : "500 nodes → 501 round trips"}</text>

      <line x1="368" y1="16" x2="368" y2="240" className="d-l-q" />

      <text x="392" y="20" className="d-s">{vi ? "SAU" : "AFTER"}</text>
      <rect x="392" y="32" width="96" height="40" className="d-box" />
      <text x="408" y="57" className="d-b">Backend</text>
      <rect x="624" y="32" width="88" height="40" className="d-box-q" />
      <text x="640" y="57" className="d-s">Postgres</text>

      <line x1="488" y1="48" x2="616" y2="48" className="d-l-a" markerEnd="url(#pa-a)" />
      <text x="500" y="42" className="d-m">1 · JOIN FETCH</text>

      <text x="392" y="104" className="d-a">{vi ? "quan hệ nạp ngay trong câu đầu" : "the relation loads inside the first query"}</text>
      <text x="392" y="140" className="d-s">{vi ? "cùng dữ liệu trả về," : "same data returned,"}</text>
      <text x="392" y="158" className="d-s">{vi ? "khác số lần đi lại" : "different number of round trips"}</text>
      <text x="392" y="238" className="d-s">SkillNodeRepository.java</text>
    </svg>
  );
}

function CatalogFig({ lang }: { lang: Lang }) {
  const vi = lang === "vi";
  const steps = vi
    ? ["bỏ dấu", "giữ [a-z0-9+#]", "số nhiều → số ít", "bỏ khoảng trắng"]
    : ["strip accents", "keep [a-z0-9+#]", "singularise", "remove spaces"];
  return (
    <svg viewBox="0 0 720 240" role="img" aria-label={vi ? "Hai cách viết đi qua bốn bước chuẩn hoá và gặp nhau ở một khoá" : "Two spellings pass through four normalising steps and meet at one key"}>
      <rect x="8" y="32" width="120" height="40" className="d-box" />
      <text x="24" y="57" className="d-m">Fast API</text>
      <rect x="8" y="120" width="120" height="40" className="d-box" />
      <text x="24" y="145" className="d-m">FastAPI</text>

      {steps.map((s, i) => (
        <g key={s}>
          <rect x={160 + i * 112} y="72" width="96" height="48" className="d-box" />
          <text x={168 + i * 112} y="94" className="d-s">{i + 1}</text>
          <text x={168 + i * 112} y="112" className="d-s">{s}</text>
        </g>
      ))}

      <path d="M128 52 C 148 52 148 92 156 92" className="d-l" markerEnd="url(#pa)" />
      <path d="M128 140 C 148 140 148 100 156 100" className="d-l" markerEnd="url(#pa)" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={256 + i * 112} y1="96" x2={152 + (i + 1) * 112} y2="96" className="d-l" markerEnd="url(#pa)" />
      ))}

      <line x1="608" y1="96" x2="648" y2="96" className="d-l-a" markerEnd="url(#pa-a)" />
      <rect x="648" y="72" width="64" height="48" className="d-box-a" />
      <text x="656" y="102" className="d-m-a">fastapi</text>

      <text x="160" y="168" className="d-a">
        {vi ? "bước 4 là chỗ hai cách viết gặp nhau" : "step 4 is where the two spellings meet"}
      </text>
      <text x="160" y="192" className="d-s">
        {vi ? "một lần nạp cả danh mục vào bộ nhớ, tra O(1) — thay cho một truy vấn mỗi tên" : "one load of the catalog into memory, O(1) lookup — instead of one query per name"}
      </text>
      <text x="160" y="216" className="d-s">
        {vi ? "Go và Golang KHÔNG gộp ở đây; cặp đó khai tay, vì gộp nhầm là hỏng vĩnh viễn" : "Go and Golang are NOT merged here; that pair is declared by hand, because a wrong merge is permanent"}
      </text>
      <text x="8" y="216" className="d-s">SkillName</text>
      <text x="8" y="232" className="d-s">Canonicalizer</text>
    </svg>
  );
}

function OauthFig({ lang }: { lang: Lang }) {
  const vi = lang === "vi";
  return (
    <svg viewBox="0 0 720 296" role="img" aria-label={vi ? "Mã uỷ quyền đi qua trình duyệt, còn token chỉ xuất hiện ở lời gọi giữa máy chủ và GitHub" : "The authorization code crosses the browser; the token appears only in the server-to-GitHub call"}>
      <rect x="8" y="24" width="152" height="40" className="d-box" />
      <text x="24" y="49" className="d-b">{vi ? "Trình duyệt" : "Browser"}</text>
      <rect x="280" y="24" width="152" height="40" className="d-box" />
      <text x="296" y="49" className="d-b">{vi ? "Máy chủ" : "Your server"}</text>
      <rect x="552" y="24" width="160" height="40" className="d-box" />
      <text x="568" y="49" className="d-b">GitHub</text>

      <line x1="84" y1="64" x2="84" y2="272" className="d-l-q" />
      <line x1="356" y1="64" x2="356" y2="272" className="d-l-q" />
      <line x1="632" y1="64" x2="632" y2="272" className="d-l-q" />

      <line x1="84" y1="96" x2="624" y2="96" className="d-l" markerEnd="url(#pa)" />
      <text x="96" y="90" className="d-m">1 · client_id, redirect_uri, scope, state</text>

      <line x1="632" y1="128" x2="92" y2="128" className="d-l" markerEnd="url(#pa)" />
      <text x="96" y="122" className="d-m">2 · {vi ? "người dùng đồng ý, GitHub trả mã" : "user consents, GitHub returns a code"}</text>

      <line x1="84" y1="160" x2="348" y2="160" className="d-l" markerEnd="url(#pa)" />
      <text x="96" y="154" className="d-m">3 · code</text>

      {/* The zone is painted BEFORE the arrows it frames. Drawn after, its fill
          would cover them — a presentation attribute like fill="none" loses to
          any CSS rule, so the class wins and the region goes opaque. */}
      <rect x="360" y="176" width="272" height="72" className="d-zone" />

      <line x1="356" y1="200" x2="624" y2="200" className="d-l-a" markerEnd="url(#pa-a)" />
      <text x="368" y="194" className="d-m-a">4 · code + client_secret</text>
      <line x1="632" y1="232" x2="364" y2="232" className="d-l-a" markerEnd="url(#pa-a)" />
      <text x="368" y="226" className="d-m-a">5 · access_token</text>
      <text x="368" y="264" className="d-a">
        {vi ? "hai bước này không đi qua trình duyệt" : "these two never cross the browser"}
      </text>
      <text x="368" y="280" className="d-s">
        {vi ? "token không bao giờ nằm trên thanh địa chỉ" : "the token is never in the address bar"}
      </text>
      <text x="8" y="288" className="d-s">{vi ? "mã dùng một lần, vô dụng nếu không có client_secret" : "single-use code, useless without the client secret"}</text>
    </svg>
  );
}

function CipherFig({ lang }: { lang: Lang }) {
  const vi = lang === "vi";
  return (
    <svg viewBox="0 0 720 240" role="img" aria-label={vi ? "Token được mã hoá AES-256-GCM với IV mới mỗi lần, IV ghép trước bản mã, thẻ xác thực kiểm trước khi giải mã" : "The token is encrypted with AES-256-GCM using a fresh IV, prepended to the ciphertext, with the tag checked before decryption"}>
      <text x="8" y="20" className="d-s">{vi ? "GHI" : "WRITE"}</text>
      <rect x="8" y="32" width="128" height="40" className="d-box" />
      <text x="24" y="57" className="d-m">access_token</text>

      <rect x="8" y="88" width="128" height="40" className="d-box-a" />
      <text x="24" y="106" className="d-m-a">IV</text>
      <text x="24" y="122" className="d-s">{vi ? "sinh mới mỗi lần gọi" : "fresh per call"}</text>

      <line x1="136" y1="52" x2="200" y2="76" className="d-l" markerEnd="url(#pa)" />
      <line x1="136" y1="108" x2="200" y2="92" className="d-l-a" markerEnd="url(#pa-a)" />

      <rect x="208" y="56" width="120" height="56" className="d-box" />
      <text x="224" y="80" className="d-b">AES-256</text>
      <text x="224" y="100" className="d-m">GCM</text>

      <line x1="328" y1="84" x2="384" y2="84" className="d-l" markerEnd="url(#pa)" />

      <rect x="392" y="56" width="72" height="56" className="d-box-a" />
      <text x="410" y="90" className="d-m-a">IV</text>
      <rect x="464" y="56" width="136" height="56" className="d-box" />
      <text x="480" y="90" className="d-m">{vi ? "bản mã" : "ciphertext"}</text>
      <rect x="600" y="56" width="72" height="56" className="d-box" />
      <text x="616" y="90" className="d-m">tag</text>

      <text x="392" y="136" className="d-s">{vi ? "một cột TEXT trong bảng students" : "one TEXT column on the students table"}</text>

      <text x="8" y="176" className="d-s">{vi ? "ĐỌC" : "READ"}</text>
      <line x1="8" y1="200" x2="200" y2="200" className="d-l" markerEnd="url(#pa)" />
      <text x="16" y="194" className="d-m">{vi ? "đọc từ DB" : "read from DB"}</text>
      <rect x="208" y="180" width="152" height="40" className="d-box-a" />
      <text x="224" y="205" className="d-b-a">{vi ? "kiểm tag trước" : "verify tag first"}</text>
      <line x1="360" y1="200" x2="424" y2="200" className="d-l-a" markerEnd="url(#pa-a)" />
      <rect x="432" y="180" width="136" height="40" className="d-box" />
      <text x="448" y="205" className="d-m">{vi ? "rồi mới giải mã" : "only then decrypt"}</text>
      <text x="584" y="205" className="d-s">{vi ? "sai một bit → loại" : "one bit off → rejected"}</text>
    </svg>
  );
}

const FIGURES: Record<PlateId, (p: { lang: Lang }) => React.JSX.Element> = {
  chain: ChainFig,
  layers: LayersFig,
  nplus1: NPlusOneFig,
  catalog: CatalogFig,
  oauth: OauthFig,
  cipher: CipherFig,
};


function Plate({ id, no, lang }: { id: PlateId; no: string; lang: Lang }) {
  const root = useRef<HTMLElement>(null);
  useCellWake(root, [lang]);
  const t = COPY[lang].notes;
  const p = t.plates[id];
  const Fig = FIGURES[id];

  return (
    <article className="plate" ref={root} id={id}>
      <header className="plate-head">
        <span className="plate-no" aria-hidden="true">
          {no}
        </span>
        <h2 className="plate-t">{p.t}</h2>
      </header>

      <figure className="plate-fig">
        <div className="plate-scroll">
          <Fig lang={lang} />
        </div>
        <figcaption>
          <span className="plate-figlabel">
            {t.figLabel} {no}
          </span>
          {p.fig}
        </figcaption>
      </figure>

      <div className="plate-body">
        <p>{p.body}</p>
        <p className="plate-limit">
          <span className="plate-limitlabel">{t.limitLabel}</span>
          {p.limit}
        </p>
      </div>
    </article>
  );
}

export default function System({ lang }: { lang: Lang }) {
  const t = COPY[lang].notes;

  return (
    <div className="topic topic-plates">
      <Defs />
      <header className="topic-head">
        <p className="topic-ref">
          <span className="topic-no">00</span> {t.systemLede}
        </p>
        <p className="topic-lede">{t.systemIntro}</p>
      </header>

      {PLATES.map((p) => (
        <Plate key={p.id} id={p.id} no={p.no} lang={lang} />
      ))}
    </div>
  );
}
