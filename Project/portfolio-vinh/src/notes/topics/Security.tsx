import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Tr, say, type Tx } from "../i18n";
import { CodeTr, Defs, Ic, Key, Fig, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 11 · Bảo mật / Security.
 *
 * The OAuth2 flow and the AES-GCM envelope already have plates on page 00, drawn
 * against the real implementation. This page carries what those plates do not:
 * what a JWT actually is, where state lives, and how a password differs from a
 * token. Repeating the two plates here would have been padding.
 */

const T = {
  name: { vi: "Bảo mật", en: "Security" },
  lede: {
    vi: "Luồng OAuth2 và lớp mã hoá token đã có bản vẽ riêng ở trang 00, vẽ theo đúng code đang chạy. Trang này lo phần còn lại: JWT thật ra là gì, trạng thái nằm ở đâu, và vì sao mật khẩu phải băm chứ không mã hoá.",
    en: "The OAuth2 flow and the token-encryption envelope already have their own plates on page 00, drawn against the running code. This page takes the rest: what a JWT really is, where the state lives, and why a password must be hashed rather than encrypted.",
  },
  source: {
    vi: "Spring Security · JwtAuthenticationFilter · TokenCipher · BCryptPasswordEncoder",
    en: "Spring Security · JwtAuthenticationFilter · TokenCipher · BCryptPasswordEncoder",
  },

  /* 11.1 */
  s1: { vi: "Xác thực và phân quyền", en: "Authentication and authorization" },

  /* 11.2 */
  s2: { vi: "JWT — được ký, không được mã hoá", en: "JWT — signed, not encrypted" },
  fig2aria: {
    vi: "Một JWT được tách ba phần rồi giải base64, cho thấy payload đọc được mà không cần khoá",
    en: "A JWT split into three parts and base64-decoded, showing the payload is readable without any key",
  },
  k2a: { vi: "ai cũng đọc được", en: "anyone can read this" },
  k2b: { vi: "phần được khoá bảo vệ", en: "what the key protects" },
  k2c: { vi: "giải mã, không cần khoá", en: "decoded, no key required" },
  d2look: { vi: "nhìn như đã mã hoá — nó không", en: "it looks encrypted — it is not" },
  d2b64: { vi: "base64url — không cần khoá", en: "base64url — no key needed" },
  d2read: { vi: "ai cũng đọc được", en: "anyone can read this" },
  d2never1: { vi: "nên đừng bao giờ để", en: "so never put sensitive" },
  d2never2: { vi: "dữ liệu nhạy cảm ở đây", en: "data in here" },
  d2sig: { vi: "chữ ký = HMAC(header.payload, khoá)", en: "signature = HMAC(header.payload, key)" },
  d2tamper: {
    vi: "sửa payload → chữ ký không khớp → server loại",
    en: "edit the payload → the signature fails → the server rejects it",
  },
  d2still: {
    vi: "nhưng payload vẫn luôn đọc được, kể cả khi không sửa",
    en: "but the payload is always readable, edited or not",
  },
  trap2: { vi: "Lỗ hổng lịch sử cần biết", en: "A historic hole worth knowing" },
  t2h1: { vi: "Loại", en: "Kind" },
  t2r1a: { vi: "đối xứng", en: "symmetric" },
  t2r1b: { vi: "bất đối xứng", en: "asymmetric" },
  t2h2: { vi: "Khoá", en: "Key" },
  t2r2a: { vi: "một khoá vừa ký vừa kiểm", en: "one key both signs and verifies" },
  t2r2b: { vi: "khoá riêng ký, khoá công khai kiểm", en: "private key signs, public key verifies" },
  t2h3: { vi: "Hệ quả", en: "Consequence" },
  t2r3a: { vi: "ai kiểm được cũng ký được", en: "whoever can verify can also sign" },
  t2r3b: {
    vi: "phát khoá công khai mà không ai giả được token",
    en: "you can publish the public key and nobody can forge a token",
  },
  t2h4: { vi: "Hợp với", en: "Suits" },
  t2r4a: { vi: "một dịch vụ vừa phát vừa kiểm", en: "one service that both issues and verifies" },
  t2r4b: { vi: "nhiều dịch vụ cùng kiểm", en: "many services verifying" },

  /* 11.3 */
  s3: { vi: "Trạng thái nằm ở đâu — session hay token", en: "Where the state lives — session or token" },
  fig3aria: {
    vi: "So sánh nơi lưu trạng thái đăng nhập giữa session phía máy chủ và JWT không trạng thái",
    en: "Where login state is kept: a server-side session against a stateless JWT",
  },
  d3jwt: { vi: "JWT · không trạng thái", en: "JWT · stateless" },
  d3sess: { vi: "Session · trạng thái ở máy chủ", en: "Session · state on the server" },
  d3holdT: { vi: "giữ token", en: "holds the token" },
  d3holdS: { vi: "giữ session id", en: "holds a session id" },
  d3srv1: { vi: "Máy chủ 1", en: "Server 1" },
  d3srv2: { vi: "Máy chủ 2", en: "Server 2" },
  d3keyonly: { vi: "chỉ giữ khoá ký", en: "holds only the signing key" },
  d3table: { vi: "giữ bảng phiên", en: "holds the session table" },
  d3same: { vi: "cùng khoá → kiểm được", en: "same key → it can verify" },
  d3notable: { vi: "không có bảng phiên", en: "has no session table" },
  d3free: { vi: "thêm máy chủ không cần làm gì", en: "adding a server needs nothing" },
  d3sticky: { vi: "cần sticky session hoặc Redis", en: "needs sticky sessions or Redis" },
  d3ram: { vi: "bảng phiên trong RAM", en: "session table in RAM" },
  d3nolookup: { vi: "không tra bảng nào", en: "no table lookup at all" },
  d3verify: { vi: "chỉ kiểm chữ ký bằng khoá", en: "just verify the signature with the key" },
  d3tradeT: {
    vi: "đánh đổi: token đã phát thì không thu hồi được — xem mục 11.4",
    en: "the trade: an issued token cannot be revoked — see 11.4",
  },
  d3tradeS: {
    vi: "đánh đổi: đăng xuất tức thì được, nhưng máy chủ phải nhớ mọi phiên",
    en: "the trade: instant logout, but the server must remember every session",
  },

  /* 11.4 */
  s4: { vi: "Vì sao cần cả access token và refresh token", en: "Why you need both an access and a refresh token" },

  /* 11.5 */
  s5: { vi: "Băm và mã hoá là hai việc khác nhau", en: "Hashing and encryption are two different jobs" },
  fig5aria: {
    vi: "Băm là một chiều dùng cho mật khẩu; mã hoá là hai chiều dùng cho token phải đọc lại",
    en: "Hashing is one-way, for passwords; encryption is two-way, for tokens that must be read back",
  },
  d5hash: { vi: "Băm · một chiều", en: "Hashing · one way" },
  d5pw: { vi: "mật khẩu", en: "password" },
  d5noway: { vi: "không có đường về", en: "no way back" },
  d5enc: { vi: "Mã hoá · hai chiều", en: "Encryption · two ways" },
  d5ct: { vi: "IV ‖ bản mã ‖ tag", en: "IV ‖ ciphertext ‖ tag" },
  d5must: { vi: "phải đọc lại được", en: "must be readable again" },
  d5cant: { vi: "nên không thể băm", en: "so it cannot be hashed" },

  /* 11.6 */
  s6: { vi: "CORS và CSRF — hai thứ hay bị lẫn", en: "CORS and CSRF — the two that get confused" },
  t6r1: { vi: "Là gì", en: "What it is" },
  t6r1a: { vi: "cơ chế nới lỏng", en: "a relaxation mechanism" },
  t6r1b: { vi: "một loại tấn công", en: "a kind of attack" },
  t6r2: { vi: "Bảo vệ ai", en: "Protects whom" },
  t6r2a: { vi: "người dùng, phía trình duyệt", en: "the user, in the browser" },
  t6r2b: { vi: "người dùng, phía máy chủ", en: "the user, at the server" },
  t6r3: { vi: "Postman có bị không", en: "Does Postman hit it" },
  t6r3a: { vi: "không — chỉ trình duyệt áp dụng", en: "no — only browsers enforce it" },
  t6r3b: { vi: "không liên quan", en: "not applicable" },
  t6r4: { vi: "Trong hệ của tôi", en: "In my system" },
  t6r4a: { vi: "bật, và cho OPTIONS đi tự do", en: "on, with OPTIONS let through" },
  t6r4b: { vi: "tắt, vì token nằm ở header", en: "off, because the token is in a header" },
} satisfies Record<string, Tx>;

function jwtSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "token thô", note: "Ba phần nối bằng dấu chấm. Nhìn như đã mã hoá — và đó chính là chỗ nhiều người hiểu sai." },
        { label: "tách ba phần", note: "header, payload, signature. Hai phần đầu là base64url, phần cuối là chữ ký trên hai phần đầu." },
        { label: "giải base64", note: "Base64 là mã hoá dạng biểu diễn, không phải mật mã. Ai cũng giải được, không cần khoá nào." },
        { label: "payload lộ ra", note: "Toàn bộ claim đọc được. Dán token vào jwt.io là thấy y hệt thế này." },
        { label: "chữ ký làm gì", note: "Chữ ký chỉ đảm bảo token KHÔNG BỊ SỬA. Nó không giấu gì cả. Sửa payload là chữ ký không khớp và server loại." },
      ]
    : [
        { label: "the raw token", note: "Three parts joined by dots. It looks encrypted — and that is exactly where people go wrong." },
        { label: "split into three", note: "header, payload, signature. The first two are base64url; the last is a signature over those two." },
        { label: "decode the base64", note: "Base64 is an encoding, not a cipher. Anybody can decode it, with no key at all." },
        { label: "the payload is exposed", note: "Every claim is readable. Paste the token into jwt.io and you see precisely this." },
        { label: "what the signature does", note: "The signature only guarantees the token HAS NOT BEEN ALTERED. It hides nothing. Edit the payload and the signature no longer matches, so the server rejects it." },
      ];
}

function stateSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "session — đăng nhập", note: "Server tạo một bản ghi phiên trong bộ nhớ của nó và gửi về client một session id." },
        { label: "session — request sau", note: "Client gửi kèm session id. Server tra bảng phiên của mình để biết đó là ai." },
        { label: "session — thêm máy chủ", note: "Instance thứ hai không có bảng phiên đó. Phải dùng sticky session hoặc một kho phiên chung như Redis." },
        { label: "JWT — đăng nhập", note: "Server ký một token chứa danh tính và gửi về. Server KHÔNG lưu gì cả." },
        { label: "JWT — request sau", note: "Client gửi token. Server chỉ cần kiểm chữ ký bằng khoá của mình — không tra bảng nào." },
        { label: "JWT — thêm máy chủ", note: "Instance mới có cùng khoá là kiểm được ngay. Đây là lý do JWT hợp với hệ có nhiều instance." },
      ]
    : [
        { label: "session — login", note: "The server creates a session record in its own memory and sends the client a session id." },
        { label: "session — later request", note: "The client sends the session id back. The server looks it up in its session table to learn who this is." },
        { label: "session — add a server", note: "The second instance does not have that session table. You need sticky sessions or a shared session store such as Redis." },
        { label: "JWT — login", note: "The server signs a token carrying the identity and returns it. The server stores NOTHING." },
        { label: "JWT — later request", note: "The client sends the token. The server only has to verify the signature with its key — no lookup anywhere." },
        { label: "JWT — add a server", note: "A new instance with the same key can verify immediately. This is why JWT suits multi-instance systems." },
      ];
}

export default function Security({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="11" name={s(T.name)} lede={s(T.lede)} source={s(T.source)} />

      <Sec n="11.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                <strong>Authentication</strong> trả lời <em>"anh là ai"</em>. Người dùng gửi email và mật khẩu,
                hệ thống kiểm và cấp token.
              </>
            }
            en={
              <>
                <strong>Authentication</strong> answers <em>"who are you"</em>. The user sends an email and a
                password, the system checks them and issues a token.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <strong>Authorization</strong> trả lời <em>"anh được làm gì"</em>. Đã biết là ai rồi, giờ xét vai
                trò — STUDENT chỉ xem dashboard của mình, ADMIN quản lý được người dùng.
              </>
            }
            en={
              <>
                <strong>Authorization</strong> answers <em>"what may you do"</em>. Identity is settled, so now
                the role decides — a STUDENT sees only their own dashboard, an ADMIN can manage users.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Thứ tự luôn là xác thực trước, phân quyền sau. Và chúng ánh xạ thẳng sang hai mã trạng thái:{" "}
                <strong>401</strong> là chưa xác thực, <strong>403</strong> là đã xác thực nhưng không đủ quyền.
                Nhầm hai mã này là lỗi hay gặp nhất trong thiết kế API.
              </>
            }
            en={
              <>
                The order is always authentication first, authorization second. And they map straight onto two
                status codes: <strong>401</strong> is not authenticated, <strong>403</strong> is authenticated
                but not permitted. Mixing these two up is the most common mistake in API design.
              </>
            }
          />
        </P>
        <CodeTr
          vi={`// phân quyền theo vai trò, kiểm ở mức method
@PreAuthorize("hasRole('ADMIN')")
public void deactivate(Long userId) { ... }

// hoặc ở mức đường dẫn, trong SecurityConfig
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")`}
          en={`// role-based authorization, checked at the method
@PreAuthorize("hasRole('ADMIN')")
public void deactivate(Long userId) { ... }

// or at the path, in SecurityConfig
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")`}
        />
      </Sec>

      <Sec n="11.2" t={s(T.s2)}>
        <Walkthrough
          viewBox="0 0 720 240"
          aria={s(T.fig2aria)}
          hold={2200}
          steps={jwtSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 11.2" : "Figure 11.2"}</span>
              <Tr
                vi={
                  <>
                    Chữ ký bảo vệ <strong>tính toàn vẹn</strong>, không bảo vệ <strong>tính bí mật</strong>. Đây
                    là câu bẫy hay nhất về JWT.
                  </>
                }
                en={
                  <>
                    The signature protects <strong>integrity</strong>, not <strong>confidentiality</strong>.
                    This is the best trick question about JWT there is.
                  </>
                }
              />
              <Key
                items={[
                  { c: "bad", t: s(T.k2a) },
                  { c: "ok", t: s(T.k2b) },
                  { c: "info", t: s(T.k2c) },
                ]}
              />
            </>
          }
        >
          {(i) => (
            <>
              {i === 0 && (
                <>
                  <rect x="24" y="56" width="664" height="48" className="d-box" />
                  <Ic n="lock" x={40} y={70} s={18} />
                  <text x="70" y="86" className="d-m">eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMiIsInJvbGUiOiJTVFVERU5UIn0.4f2b…</text>
                  <text x="24" y="140" className="d-s">{s(T.d2look)}</text>
                </>
              )}

              {i >= 1 && (
                <>
                  <rect x="24" y="56" width="192" height="48" className={i === 4 ? "d-box" : "d-box-fill"} />
                  <text x="40" y="80" className="d-s">header</text>
                  <text x="40" y="96" className="d-m">eyJhbGciOiJIUzI1NiJ9</text>

                  <g data-c={i >= 2 && i <= 3 ? "bad" : undefined}>
                    <rect x="232" y="56" width="272" height="48" className="d-box-fill" />
                    <text x="248" y="80" className="d-s">payload</text>
                    <text x="248" y="96" className="d-m">eyJzdWIiOiIxMiIsInJvbGUi…</text>
                    {i >= 2 && i <= 3 && <Ic n="unlock" x={476} y={68} s={16} c="bad" />}
                  </g>

                  <g data-c={i === 4 ? "ok" : undefined}>
                    <rect x="520" y="56" width="168" height="48" className={i === 4 ? "d-box-fill" : "d-box"} />
                    <text x="536" y="80" className="d-s">signature</text>
                    <text x="536" y="96" className="d-m">4f2b9c…</text>
                    {i === 4 && <Ic n="shield" x={660} y={68} s={16} c="ok" />}
                  </g>
                </>
              )}

              {i >= 2 && (
                <g data-enter="" data-c="info">
                  <line x1="368" y1="104" x2="368" y2="136" className="d-l" markerEnd="url(#pa-info)" />
                  <text x="384" y="128" className="d-m">{s(T.d2b64)}</text>
                </g>
              )}

              {i >= 3 && (
                <g data-enter="" data-c="bad">
                  <rect x="232" y="144" width="272" height="72" className="d-box-fill" />
                  <text x="248" y="166" className="d-m">{`{ "sub": "12",`}</text>
                  <text x="248" y="184" className="d-m">{`  "role": "STUDENT",`}</text>
                  <text x="248" y="202" className="d-m">{`  "exp": 1771200000 }`}</text>
                  <Ic n="eye" x={520} y={158} s={16} c="bad" />
                  <text x="546" y="170" className="d-m">{s(T.d2read)}</text>
                  <text x="520" y="192" className="d-s">{s(T.d2never1)}</text>
                  <text x="520" y="208" className="d-s">{s(T.d2never2)}</text>
                </g>
              )}

              {i === 4 && (
                <g data-enter="" data-c="ok">
                  <Ic n="key" x={24} y={158} s={15} c="ok" />
                  <text x="46" y="170" className="d-m">{s(T.d2sig)}</text>
                  <text x="24" y="192" className="d-s">{s(T.d2tamper)}</text>
                  <text x="24" y="212" className="d-s">{s(T.d2still)}</text>
                </g>
              )}
            </>
          )}
        </Walkthrough>

        <Trap t={T.trap2}>
          <Tr
            vi={
              <p>
                Tấn công <code>alg: none</code>: kẻ tấn công đổi header thành <code>{`{"alg":"none"}`}</code> và
                xoá chữ ký. Thư viện viết ẩu sẽ chấp nhận vì "token này khai là không có chữ ký". Thư viện hiện
                đại luôn kiểm thuật toán <em>mong đợi</em> ở phía server thay vì tin header.
              </p>
            }
            en={
              <p>
                The <code>alg: none</code> attack: the attacker rewrites the header to{" "}
                <code>{`{"alg":"none"}`}</code> and drops the signature. A sloppy library accepts it because
                "this token declares it has no signature". Modern libraries check the algorithm the server{" "}
                <em>expects</em> rather than trusting the header.
              </p>
            }
          />
        </Trap>

        <Table
          head={["", "HS256", "RS256"]}
          rows={[
            [s(T.t2h1), s(T.t2r1a), s(T.t2r1b)],
            [s(T.t2h2), s(T.t2r2a), s(T.t2r2b)],
            [s(T.t2h3), s(T.t2r3a), s(T.t2r3b)],
            [s(T.t2h4), s(T.t2r4a), s(T.t2r4b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                IntelliPath dùng <strong>HS256</strong> vì chỉ một dịch vụ vừa phát vừa kiểm token. Nếu tách
                microservice thì phải chuyển sang RS256 — nói được câu điều kiện đó là chỗ phân biệt người hiểu
                với người tra Google.
              </>
            }
            en={
              <>
                IntelliPath uses <strong>HS256</strong> because a single service both issues and verifies. Split
                it into microservices and it would have to become RS256 — being able to state that condition is
                what separates understanding from a search result.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="11.3" t={s(T.s3)}>
        <Walkthrough
          viewBox="0 0 720 232"
          aria={s(T.fig3aria)}
          hold={2000}
          steps={stateSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 11.3" : "Figure 11.3"}</span>
              <Tr
                vi={
                  <>
                    Cùng một câu hỏi "ai đang gọi", hai chỗ trả lời khác nhau — và đó quyết định việc thêm máy
                    chủ dễ hay khó.
                  </>
                }
                en={
                  <>
                    One question — "who is calling" — answered in two different places, and that decides whether
                    adding a server is easy or hard.
                  </>
                }
              />
            </>
          }
        >
          {(i) => {
            const jwt = i >= 3;
            return (
              <>
                <text x="24" y="24" className={jwt ? "d-s" : "d-a"}>{jwt ? s(T.d3jwt) : s(T.d3sess)}</text>

                <rect x="24" y="48" width="128" height="56" className="d-box" />
                <text x="88" y="76" className="d-b" textAnchor="middle">Client</text>
                <text x="88" y="94" className="d-s" textAnchor="middle">{jwt ? s(T.d3holdT) : s(T.d3holdS)}</text>

                <rect x="288" y="48" width="160" height="56" className="d-box-a" />
                <text x="368" y="76" className="d-b-a" textAnchor="middle">{s(T.d3srv1)}</text>
                <text x="368" y="94" className="d-s" textAnchor="middle">{jwt ? s(T.d3keyonly) : s(T.d3table)}</text>

                {(i === 2 || i === 5) && (
                  <g data-enter="">
                    <rect x="288" y="128" width="160" height="56" className={jwt ? "d-box-a" : "d-box-out"} />
                    <text x="368" y="156" className={jwt ? "d-b-a" : "d-s"} textAnchor="middle">{s(T.d3srv2)}</text>
                    <text x="368" y="174" className="d-s" textAnchor="middle">{jwt ? s(T.d3same) : s(T.d3notable)}</text>
                    <text x="472" y="160" className={jwt ? "d-a" : "d-s"}>
                      {jwt ? s(T.d3free) : s(T.d3sticky)}
                    </text>
                  </g>
                )}

                <line x1="152" y1="76" x2="280" y2="76" className="d-l" markerEnd="url(#pa)" />
                <text x="168" y="68" className="d-m">{jwt ? "Bearer <token>" : "Cookie: JSESSIONID"}</text>

                {!jwt && (
                  <g data-enter="">
                    <rect x="488" y="48" width="200" height="56" className="d-box-fill" />
                    <text x="504" y="72" className="d-s">{s(T.d3ram)}</text>
                    <text x="504" y="92" className="d-m">abc123 → user 12</text>
                    <line x1="448" y1="76" x2="480" y2="76" className="d-l" markerEnd="url(#pa)" />
                  </g>
                )}
                {jwt && (
                  <g data-enter="">
                    <text x="488" y="72" className="d-a">{s(T.d3nolookup)}</text>
                    <text x="488" y="92" className="d-s">{s(T.d3verify)}</text>
                  </g>
                )}

                <text x="24" y="216" className="d-s">
                  {jwt ? s(T.d3tradeT) : s(T.d3tradeS)}
                </text>
              </>
            );
          }}
        </Walkthrough>
      </Sec>

      <Sec n="11.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                JWT <strong>không thu hồi được</strong> — server không giữ trạng thái nên không có cách nào làm
                một token đã phát mất hiệu lực. Token sống lâu bị lộ thì kẻ tấn công dùng được tới lúc hết hạn.
              </>
            }
            en={
              <>
                A JWT <strong>cannot be revoked</strong> — the server keeps no state, so there is no way to
                invalidate a token it has already issued. Leak a long-lived token and the attacker keeps it
                until it expires.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Giải pháp là đánh đổi: access token <strong>sống ngắn</strong> nên cửa sổ thiệt hại hẹp; refresh
                token <strong>sống dài</strong> nhưng được <strong>lưu trong database</strong> — mà đã lưu thì
                xoá được, tức thu hồi được.
              </>
            }
            en={
              <>
                The answer is a trade: the access token is <strong>short-lived</strong>, so the damage window is
                narrow; the refresh token is <strong>long-lived</strong> but{" "}
                <strong>stored in the database</strong> — and what is stored can be deleted, which is to say
                revoked.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Trong repo tôi có entity <code>RefreshToken</code>, và <code>JwtAuthenticationFilter</code> cố ý{" "}
                <strong>bỏ qua</strong> đường <code>/api/v1/auth/refresh</code> — vì lúc đó access token đã hết
                hạn, việc kiểm tra do service làm dựa trên refresh token.
              </>
            }
            en={
              <>
                My repository has a <code>RefreshToken</code> entity, and{" "}
                <code>JwtAuthenticationFilter</code> deliberately <strong>skips</strong> the{" "}
                <code>/api/v1/auth/refresh</code> path — by then the access token has expired, and the check is
                the service's job, against the refresh token.
              </>
            }
          />
        </P>
        <Limit>
          <Tr
            vi={
              <>
                Đăng xuất trong hệ hiện tại xoá refresh token, nhưng access token đang cầm vẫn dùng được tới lúc
                hết hạn. Muốn đăng xuất tức thì thì phải có danh sách đen, mà danh sách đen lại đưa trạng thái
                quay về máy chủ — tức là bỏ đi lý do chọn JWT ban đầu.
              </>
            }
            en={
              <>
                Logging out of the current system deletes the refresh token, but an access token already in hand
                keeps working until it expires. Instant logout would need a blacklist, and a blacklist puts the
                state back on the server — discarding the reason JWT was chosen in the first place.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="11.5" t={s(T.s5)}>
        <Fig
          viewBox="0 0 720 200"
          aria={s(T.fig5aria)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 11.5" : "Figure 11.5"}</span>
              <Tr
                vi={
                  <>
                    Chọn sai chiều là lỗi thiết kế, không phải lỗi cấu hình. Mật khẩu mã hoá được nghĩa là giải
                    mã được, tức là ai vào được database thì đọc được hết.
                  </>
                }
                en={
                  <>
                    Choosing the wrong direction is a design error, not a configuration error. An encrypted
                    password is a decryptable password, which means anyone who reaches the database reads them
                    all.
                  </>
                }
              />
            </>
          }
        >
          <text x="24" y="24" className="d-b">{s(T.d5hash)}</text>
          <rect x="24" y="40" width="128" height="44" className="d-box" />
          <text x="88" y="68" className="d-m" textAnchor="middle">{s(T.d5pw)}</text>
          <line x1="152" y1="62" x2="200" y2="62" className="d-l" markerEnd="url(#pa)" />
          <rect x="200" y="40" width="112" height="44" className="d-box-fill" />
          <text x="256" y="68" className="d-m" textAnchor="middle">BCrypt</text>
          <line x1="312" y1="62" x2="360" y2="62" className="d-l" markerEnd="url(#pa)" />
          <rect x="360" y="40" width="176" height="44" className="d-box" />
          <text x="376" y="68" className="d-m">$2a$10$N9qo8u…</text>
          <path d="M360 96 L 200 96" className="d-l-q" />
          <text x="360" y="112" className="d-s">{s(T.d5noway)}</text>

          <text x="24" y="148" className="d-b">{s(T.d5enc)}</text>
          <rect x="24" y="156" width="128" height="40" className="d-box" />
          <text x="88" y="182" className="d-m" textAnchor="middle">GitHub token</text>
          <line x1="152" y1="176" x2="200" y2="176" className="d-l-a" markerEnd="url(#pa-a)" />
          <rect x="200" y="156" width="112" height="40" className="d-box-a" />
          <text x="256" y="182" className="d-m-a" textAnchor="middle">AES-GCM</text>
          <line x1="312" y1="176" x2="360" y2="176" className="d-l-a" markerEnd="url(#pa-a)" />
          <rect x="360" y="156" width="176" height="40" className="d-box" />
          <text x="376" y="182" className="d-m">{s(T.d5ct)}</text>
          <path d="M360 148 C 300 132 260 132 208 148" className="d-l-a" markerEnd="url(#pa-a)" />
          <text x="552" y="176" className="d-a">{s(T.d5must)}</text>
          <text x="552" y="196" className="d-s">{s(T.d5cant)}</text>
        </Fig>

        <P>
          <Tr
            vi={
              <>
                <strong>Vì sao BCrypt chứ không phải SHA-256:</strong> SHA-256 được thiết kế để <em>nhanh</em> —
                mà nhanh chính là điều bạn không muốn ở hàm băm mật khẩu. GPU băm hàng tỷ SHA-256 mỗi giây, nên
                tấn công từ điển gần như miễn phí.
              </>
            }
            en={
              <>
                <strong>Why BCrypt and not SHA-256:</strong> SHA-256 is designed to be <em>fast</em> — and fast
                is precisely what you do not want from a password hash. A GPU computes billions of SHA-256
                hashes a second, which makes a dictionary attack close to free.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                BCrypt <strong>cố tình chậm</strong> và có tham số chi phí điều chỉnh được: tăng cost lên 1 là
                gấp đôi thời gian. Phần cứng mạnh lên thì tăng cost, thuật toán không lỗi thời. Nó còn{" "}
                <strong>tự sinh salt và nhúng vào chuỗi kết quả</strong>, nên hai người cùng mật khẩu vẫn ra hai
                hash khác nhau và rainbow table vô dụng.
              </>
            }
            en={
              <>
                BCrypt is <strong>deliberately slow</strong> and carries an adjustable cost parameter: raise the
                cost by one and the time doubles. As hardware improves you raise the cost, and the algorithm
                does not become obsolete. It also <strong>generates its own salt and embeds it in the
                output</strong>, so two people with the same password still get different hashes and rainbow
                tables are worthless.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="11.6" t={s(T.s6)}>
        <Table
          head={["", "CORS", "CSRF"]}
          rows={[
            [s(T.t6r1), s(T.t6r1a), s(T.t6r1b)],
            [s(T.t6r2), s(T.t6r2a), s(T.t6r2b)],
            [s(T.t6r3), s(T.t6r3a), s(T.t6r3b)],
            [s(T.t6r4), s(T.t6r4a), s(T.t6r4b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Request "không đơn giản" sẽ có bước <strong>preflight</strong>: trình duyệt gửi{" "}
                <code>OPTIONS</code> trước để hỏi. Đó là lý do <code>SecurityConfig</code> phải cho{" "}
                <code>OPTIONS /**</code> đi qua tự do — nếu không, preflight bị chặn và mọi request thật đều
                hỏng.
              </>
            }
            en={
              <>
                A "non-simple" request gets a <strong>preflight</strong>: the browser sends an{" "}
                <code>OPTIONS</code> first to ask permission. That is why <code>SecurityConfig</code> has to let{" "}
                <code>OPTIONS /**</code> through — otherwise the preflight is blocked and every real request
                fails.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                CSRF tắt được vì token nằm ở header <code>Authorization</code>, mà header thì{" "}
                <strong>trình duyệt không tự đính kèm</strong> — kẻ tấn công không lấy được token nên không giả
                mạo được. <strong>Nếu để token trong cookie thì phải bật CSRF lại.</strong>
              </>
            }
            en={
              <>
                CSRF can be switched off because the token sits in the <code>Authorization</code> header, and{" "}
                <strong>browsers do not attach headers automatically</strong> — the attacker cannot obtain the
                token, so cannot forge the request. <strong>Put the token in a cookie and CSRF has to go back
                on.</strong>
              </>
            }
          />
        </P>
      </Sec>
    </div>
  );
}
