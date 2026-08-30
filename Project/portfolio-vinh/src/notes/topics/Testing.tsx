import type { Lang } from "../../content";
import { Src, Tr, say, type Tx } from "../i18n";
import { Code, Defs, Fig, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 12 · Kiểm thử / Testing.
 *
 * No walkthrough here on purpose. Nothing on this page is a movement — the
 * pyramid is a proportion and the mock/stub distinction is a definition. A
 * stepped figure would have been decoration pretending to be a mechanism.
 *
 * The worked example is a test out of my own repository, and 12.2 says so.
 * None of the four books can supply one: JUnit 5 and Mockito postdate all of
 * them, and the J2EE companion's testing material predates annotations
 * entirely. A real test I wrote is the honest substitute for a citation I do
 * not have.
 */

const T = {
  name: { vi: "Kiểm thử", en: "Testing" },
  lede: {
    vi: "330 test trên 53 class trong IntelliPath, gần như toàn bộ là unit test. Trang này giải thích vì sao tỉ lệ đó là cố ý, và chỗ nó còn thiếu.",
    en: "330 tests across 53 classes in IntelliPath, almost all of them unit tests. This page explains why that ratio is deliberate, and where it falls short.",
  },
  source: {
    vi: "JUnit 5 · Mockito · 24 file test có dùng mock",
    en: "JUnit 5 · Mockito · 24 test files that use mocks",
  },

  /* 12.1 */
  s1: { vi: "Kim tự tháp test", en: "The test pyramid" },
  fig1aria: {
    vi: "Kim tự tháp test với nhiều unit test ở đáy, ít integration ở giữa và rất ít end-to-end ở đỉnh",
    en: "A test pyramid: many unit tests at the base, fewer integration tests in the middle, very few end-to-end at the top",
  },
  d1slow: { vi: "chậm · đắt", en: "slow · expensive" },
  d1flaky: { vi: "hay hỏng vặt", en: "flaky" },
  d1fast: { vi: "nhanh · rẻ", en: "fast · cheap" },
  d1always: { vi: "chạy mọi lúc", en: "run constantly" },
  d1few: { vi: "vài cái", en: "a handful" },
  d1some: { vi: "vừa phải", en: "a moderate number" },
  d1many: { vi: "330 cái", en: "330 of them" },
  t1h2: { vi: "Unit test", en: "Unit test" },
  t1h3: { vi: "Integration test", en: "Integration test" },
  t1r1: { vi: "Phạm vi", en: "Scope" },
  t1r1a: { vi: "một class", en: "one class" },
  t1r1b: { vi: "nhiều tầng ghép lại", en: "several layers wired together" },
  t1r2: { vi: "Phụ thuộc", en: "Dependencies" },
  t1r2a: { vi: "mock hết", en: "all mocked" },
  t1r2b: { vi: "thật — có thể cả database", en: "real — possibly a database too" },
  t1r3: { vi: "Cần Spring context", en: "Needs a Spring context" },
  t1r3a: { vi: "không", en: "no" },
  t1r4: { vi: "Tốc độ", en: "Speed" },
  t1r4a: { vi: "mili-giây", en: "milliseconds" },
  t1r4b: { vi: "giây tới phút", en: "seconds to minutes" },
  t1r5: { vi: "Bắt được lỗi gì", en: "Catches" },
  t1r5a: { vi: "logic sai trong một chỗ", en: "wrong logic in one place" },
  t1r5b: { vi: "cấu hình sai, mapping JPA sai, SQL sai", en: "bad configuration, bad JPA mapping, bad SQL" },

  /* 12.2 */
  s2: { vi: "@Mock, @InjectMocks, @Spy", en: "@Mock, @InjectMocks, @Spy" },
  t2h1: { vi: "Annotation", en: "Annotation" },
  t2h2: { vi: "Tạo ra gì", en: "What it creates" },
  t2h3: { vi: "Dùng khi", en: "Use when" },
  t2r1b: {
    vi: "object rỗng hoàn toàn — mọi method trả giá trị mặc định",
    en: "a completely hollow object — every method returns a default value",
  },
  t2r1c: { vi: "phụ thuộc mà bạn không muốn chạy thật", en: "a dependency you do not want to really run" },
  t2r2b: {
    vi: "instance THẬT của class đang kiểm, các @Mock được nhét vào",
    en: "a REAL instance of the class under test, with the @Mocks pushed in",
  },
  t2r2c: { vi: "chính đối tượng bạn đang test", en: "the thing you are actually testing" },
  t2r3b: {
    vi: "bọc một object thật — method không khai lại thì chạy code thật",
    en: "a wrapper around a real object — any method you do not restub runs the real code",
  },
  t2r3c: { vi: "chỉ cần thay đúng một method", en: "you need to replace exactly one method" },
  s2src: {
    vi: "Một test thật trong repo IntelliPath, chép nguyên văn. Cơ chế đằng sau: JUnit 5 User Guide (mục Extension Model) và javadoc Mockito cho MockitoExtension — extension này mặc định áp Strictness.STRICT_STUBS, tức là stub khai rồi không dùng sẽ ném UnnecessaryStubbingException.",
    en: "A real test from the IntelliPath repository, copied verbatim. The mechanism behind it: the JUnit 5 User Guide (Extension Model) and the Mockito javadoc for MockitoExtension — that extension applies Strictness.STRICT_STUBS by default, so a stub declared and never used throws UnnecessaryStubbingException.",
  },

  /* 12.3 */
  s3: { vi: "Thế nào là một test tốt", en: "What makes a test good" },
  t3h1: { vi: "Tính chất", en: "Property" },
  t3h2: { vi: "Nghĩa là", en: "Means" },
  t3r1: { vi: "Độc lập", en: "Independent" },
  t3r1b: {
    vi: "thứ tự chạy không quan trọng, không test nào phụ thuộc test khác",
    en: "run order does not matter and no test depends on another",
  },
  t3r2: { vi: "Tất định", en: "Deterministic" },
  t3r2b: {
    vi: "không phụ thuộc giờ hệ thống, số ngẫu nhiên, hay mạng",
    en: "does not depend on the clock, on randomness, or on the network",
  },
  t3r3: { vi: "Nhanh", en: "Fast" },
  t3r3b: {
    vi: "chạy được sau mỗi lần sửa, không phải chỉ trên CI",
    en: "runnable after every edit, not only on CI",
  },
  t3r4: { vi: "Tên nói rõ điều được đảm bảo", en: "Named for the guarantee" },
  t3r4b: {
    vi: "đọc tên là biết cái gì hỏng khi nó đỏ",
    en: "the name alone tells you what broke when it goes red",
  },

  /* 12.4 */
  s4: { vi: "Độ phủ — con số dễ bị hiểu sai nhất", en: "Coverage — the most misread number there is" },
} satisfies Record<string, Tx>;

export default function Testing({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="12" name={s(T.name)} lede={s(T.lede)} source={s(T.source)} />

      <Sec n="12.1" t={s(T.s1)}>
        <Fig
          viewBox="0 0 720 232"
          aria={s(T.fig1aria)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 12.1" : "Figure 12.1"}</span>
              <Tr
                vi={
                  <>
                    Tỉ lệ này không phải quy ước thẩm mỹ. Nó đến từ chi phí: test càng lên cao càng chậm, càng
                    đắt để viết, và càng hay hỏng vì lý do không liên quan tới lỗi thật.
                  </>
                }
                en={
                  <>
                    The proportions are not an aesthetic convention. They come from cost: the higher a test
                    sits, the slower it runs, the more it costs to write, and the more often it fails for
                    reasons that have nothing to do with a real bug.
                  </>
                }
              />
            </>
          }
        >
          <path d="M360 24 L 468 88 L 252 88 Z" className="d-box-a" />
          <text x="360" y="72" className="d-m-a" textAnchor="middle">E2E</text>
          <path d="M252 96 L 468 96 L 540 160 L 180 160 Z" className="d-box-fill" />
          <text x="360" y="134" className="d-m" textAnchor="middle">Integration</text>
          <path d="M180 168 L 540 168 L 612 224 L 108 224 Z" className="d-box" />
          <text x="360" y="202" className="d-m" textAnchor="middle">Unit</text>

          {/* Right-anchored, not left. "slow · expensive" is two characters
              longer than "chậm · đắt" and ran past the viewBox in English; an
              anchor cannot overflow the edge it is measured from. */}
          <text x="712" y="64" className="d-s" textAnchor="end">{s(T.d1slow)}</text>
          <text x="712" y="82" className="d-s" textAnchor="end">{s(T.d1flaky)}</text>
          <text x="712" y="200" className="d-s" textAnchor="end">{s(T.d1fast)}</text>
          <text x="712" y="218" className="d-s" textAnchor="end">{s(T.d1always)}</text>

          <text x="16" y="64" className="d-s">{s(T.d1few)}</text>
          <text x="16" y="134" className="d-s">{s(T.d1some)}</text>
          <text x="16" y="202" className="d-a">{s(T.d1many)}</text>
        </Fig>

        <Table
          head={["", s(T.t1h2), s(T.t1h3)]}
          rows={[
            [s(T.t1r1), s(T.t1r1a), s(T.t1r1b)],
            [s(T.t1r2), s(T.t1r2a), s(T.t1r2b)],
            [s(T.t1r3), s(T.t1r3a), <code key="a">@SpringBootTest</code>],
            [s(T.t1r4), s(T.t1r4a), s(T.t1r4b)],
            [s(T.t1r5), s(T.t1r5a), s(T.t1r5b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Unit test <strong>không</strong> chứng minh hệ thống chạy được — nó chứng minh từng mảnh đúng
                theo giả định của bạn. Nếu giả định sai thì mọi test vẫn xanh và hệ thống vẫn hỏng. Đó chính là
                khoảng trống mà integration test lấp.
              </>
            }
            en={
              <>
                Unit tests do <strong>not</strong> prove the system works — they prove each piece is correct
                under your assumptions. If an assumption is wrong, every test stays green and the system is
                still broken. That gap is exactly what integration tests fill.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="12.2" t={s(T.s2)}>
        <Table
          head={[s(T.t2h1), s(T.t2h2), s(T.t2h3)]}
          rows={[
            [<code key="a">@Mock</code>, s(T.t2r1b), s(T.t2r1c)],
            [<code key="b">@InjectMocks</code>, s(T.t2r2b), s(T.t2r2c)],
            [<code key="c">@Spy</code>, s(T.t2r3b), s(T.t2r3c)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Mockito ưu tiên tiêm qua <strong>constructor</strong>, nên nó ăn khớp thẳng với{" "}
                <code>@RequiredArgsConstructor</code> — cách toàn bộ component trong repo của tôi được nối.
              </>
            }
            en={
              <>
                Mockito prefers <strong>constructor</strong> injection, so it lines up directly with{" "}
                <code>@RequiredArgsConstructor</code> — the way every component in my repository is wired.
              </>
            }
          />
        </P>
        <Code>{`@ExtendWith(MockitoExtension.class)
class SkillNameCanonicalizerTest {

    @Mock SkillRepository skillRepository;
    @InjectMocks SkillNameCanonicalizer canonicalizer;

    @Test
    void resolve_fallsBackToExactMatch_whenIndexMisses() {
        // Arrange
        when(skillRepository.findAll()).thenReturn(List.of());
        when(skillRepository.findOneBySkillNameIgnoreCase("Java"))
            .thenReturn(javaSkill);

        // Act
        Skill found = canonicalizer.resolve("Java");

        // Assert
        assertThat(found).isSameAs(javaSkill);
        verify(skillRepository).findOneBySkillNameIgnoreCase("Java");
    }
}`}</Code>
        <Src vi={T.s2src.vi} en={T.s2src.en} />
        <Trap>
          <Tr
            vi={
              <p>
                <code>when(...)</code> chỉ dùng được cho method <strong>có giá trị trả về</strong>. Method{" "}
                <code>void</code> phải viết ngược lại: <code>doThrow(...).when(mock).method()</code> hoặc{" "}
                <code>doNothing().when(mock).method()</code>. Đây là chỗ hay bị vấp lần đầu.
              </p>
            }
            en={
              <p>
                <code>when(...)</code> only works for methods that <strong>return a value</strong>. A{" "}
                <code>void</code> method has to be written the other way round:{" "}
                <code>doThrow(...).when(mock).method()</code> or <code>doNothing().when(mock).method()</code>.
                This is the usual first stumble.
              </p>
            }
          />
        </Trap>
        <P>
          <Tr
            vi={
              <>
                JUnit 5 dùng <strong>strict stubs</strong> theo mặc định: khai một stub rồi không dùng tới thì
                test <em>thất bại</em>. Nghe khó chịu nhưng đúng — một stub thừa nghĩa là test đang mô tả sai thứ
                nó kiểm.
              </>
            }
            en={
              <>
                JUnit 5 runs with <strong>strict stubs</strong> by default: declare a stub and never use it and
                the test <em>fails</em>. It feels harsh and it is right — an unused stub means the test is
                describing something other than what it checks.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="12.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Cấu trúc <strong>AAA</strong>: Arrange, Act, Assert — dựng dữ liệu, gọi <em>một</em> hành động,
                kiểm <em>một</em> kết quả.
              </>
            }
            en={
              <>
                The <strong>AAA</strong> shape: Arrange, Act, Assert — build the data, call <em>one</em> action,
                check <em>one</em> outcome.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t3h1), s(T.t3h2)]}
          rows={[
            [s(T.t3r1), s(T.t3r1b)],
            [s(T.t3r2), s(T.t3r2b)],
            [s(T.t3r3), s(T.t3r3b)],
            [s(T.t3r4), s(T.t3r4b)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Tên tốt: <code>resolve_fallsBackToExactMatch_whenIndexMisses</code>. Tên tệ: <code>test1</code>.
              </>
            }
            en={
              <>
                A good name: <code>resolve_fallsBackToExactMatch_whenIndexMisses</code>. A bad one:{" "}
                <code>test1</code>.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Và test nên kiểm <strong>hành vi</strong>, không kiểm hiện thực. Test khoá chặt vào chi tiết bên
                trong sẽ vỡ mỗi lần refactor dù chương trình vẫn đúng — lúc đó test trở thành gánh nặng thay vì
                lưới an toàn.
              </>
            }
            en={
              <>
                And a test should check <strong>behaviour</strong>, not implementation. A test welded to
                internal detail breaks on every refactor even though the program is still correct — at which
                point the test is a burden rather than a safety net.
              </>
            }
          />
        </P>
      </Sec>

      <Sec n="12.4" t={s(T.s4)}>
        <P>
          <Tr
            vi={
              <>
                Độ phủ đo <em>dòng nào đã chạy</em>, không đo <em>điều gì đã được kiểm</em>. Một test gọi hết mọi
                method mà không <code>assert</code> gì vẫn cho độ phủ 100%.
              </>
            }
            en={
              <>
                Coverage measures <em>which lines ran</em>, not <em>what was checked</em>. A test that calls
                every method and <code>assert</code>s nothing still reports 100%.
              </>
            }
          />
        </P>
        <Trap>
          <Tr
            vi={
              <p>
                Đặt độ phủ làm chỉ tiêu là mời gọi test rác. Con số hữu ích hơn là:{" "}
                <em>nhánh nào của logic nghiệp vụ chưa từng được kiểm</em> — và đó phải đọc bằng mắt, không đọc
                bằng phần trăm.
              </p>
            }
            en={
              <p>
                Making coverage a target is an invitation to write junk tests. The more useful question is{" "}
                <em>which branch of the business logic has never been checked</em> — and that is read with your
                eyes, not with a percentage.
              </p>
            }
          />
        </Trap>
        <Limit>
          <Tr
            vi={
              <>
                Trong 330 test của tôi, phần lớn là unit test cho các component tính toán. Tầng repository và các
                câu truy vấn <strong>chưa có integration test</strong> chạy trên database thật — nghĩa là mapping
                JPA và SQL đang được tin chứ chưa được chứng minh. Testcontainers là cách đúng để lấp chỗ này và
                tôi chưa làm.
              </>
            }
            en={
              <>
                Of my 330 tests, most are unit tests for the computational components. The repository layer and
                its queries have <strong>no integration test</strong> running against a real database — meaning
                the JPA mappings and the SQL are trusted rather than proven. Testcontainers is the right way to
                close that, and I have not done it.
              </>
            }
          />
        </Limit>
      </Sec>
    </div>
  );
}
