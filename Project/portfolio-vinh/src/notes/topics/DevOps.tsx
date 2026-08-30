import type { Lang } from "../../content";
import Walkthrough from "../Walkthrough";
import { Tr, say, type Tx } from "../i18n";
import { Code, CodeTr, Defs, Ic, Key, Limit, P, Sec, Table, TopicHead, Trap } from "../parts";

/**
 * 13 · Docker, Git, Maven.
 *
 * The layer-cache walkthrough is the only figure here, and it earns its place
 * because Docker's build cache is a *sequence* — one changed step invalidates
 * everything after it, and that dependency is invisible when you read a
 * Dockerfile top to bottom.
 */

const T = {
  lede: {
    vi: "Ba công cụ dùng hằng ngày mà phần lớn người dùng chỉ thuộc dăm câu lệnh. Trang này lo phần cơ chế bên dưới những câu lệnh đó.",
    en: "Three tools used daily by people who mostly know a handful of commands. This page is about the mechanism under those commands.",
  },
  source: {
    vi: "IntelliPath chạy trong Docker trên một VPS Linux · Maven · Git với luồng nhánh và pull request",
    en: "IntelliPath runs in Docker on a Linux VPS · Maven · Git with a branch-and-pull-request flow",
  },

  /* 13.1 */
  s1: { vi: "Image, container, và lớp", en: "Images, containers and layers" },
  fig1aria: {
    vi: "Thứ tự lệnh trong Dockerfile quyết định lớp nào được dùng lại từ cache khi mã nguồn thay đổi",
    en: "The order of instructions in a Dockerfile decides which layers survive the cache when the source changes",
  },
  k1a: { vi: "lấy lại từ cache — miễn phí", en: "taken from cache — free" },
  k1b: { vi: "phải dựng lại", en: "has to be rebuilt" },
  d1good: { vi: "THỨ TỰ ĐÚNG", en: "CORRECT ORDER" },
  d1bad: { vi: "THỨ TỰ SAI", en: "WRONG ORDER" },
  d1rebuild: { vi: "dựng lại", en: "rebuilt" },
  d1cached: { vi: "dùng lại cache", en: "cache hit" },
  d1all: { vi: "lớp nào cũng đang trong cache", en: "every layer is still cached" },
  d1okmsg: {
    vi: "chỉ 2 lớp cuối dựng lại — dependency vẫn nguyên vì pom.xml không đổi",
    en: "only the last 2 layers rebuild — the dependencies survive because pom.xml did not change",
  },
  d1badmsg: {
    vi: "sửa một dòng code làm hỏng cache của cả phần tải dependency",
    en: "one edited line of source destroys the cache for the whole dependency download",
  },

  /* 13.2 */
  s2: { vi: "Git — những lệnh cần hiểu chứ không chỉ gõ", en: "Git — the commands worth understanding, not just typing" },
  t2h1: { vi: "Lệnh", en: "Command" },
  t2h2: { vi: "Làm gì", en: "What it does" },
  t2h3: { vi: "Khi nào", en: "When" },
  t2r1b: { vi: "tạo một commit gộp hai nhánh, giữ nguyên lịch sử", en: "makes a commit joining two branches, history intact" },
  t2r1c: {
    vi: "mặc định — lịch sử thật quan trọng hơn lịch sử đẹp",
    en: "the default — a true history beats a pretty one",
  },
  t2r2b: { vi: "viết lại commit lên trên nhánh khác", en: "rewrites commits on top of another branch" },
  t2r2c: { vi: "dọn nhánh của riêng mình TRƯỚC khi push", en: "tidying your own branch BEFORE pushing" },
  t2r3b: { vi: "lấy đúng một commit sang nhánh hiện tại", en: "brings exactly one commit onto the current branch" },
  t2r3c: { vi: "cần một sửa lỗi mà không muốn cả nhánh", en: "you want one fix, not the whole branch" },
  t2r4b: { vi: "tạo commit mới đảo ngược một commit cũ", en: "makes a new commit undoing an old one" },
  t2r4c: { vi: "sửa sai trên nhánh đã public", en: "correcting a mistake on a public branch" },
  t2r5b: { vi: "vứt bỏ commit và thay đổi", en: "throws away commits and changes" },
  t2r5c: { vi: "chỉ khi chắc chắn — không hoàn tác được", en: "only when certain — there is no undo" },
  trap2: { vi: "Quy tắc vàng của rebase", en: "The golden rule of rebase" },

  /* 13.3 */
  s3: { vi: "Maven — nhiều hơn một chỗ khai thư viện", en: "Maven — more than a place to list libraries" },
  t3h1: { vi: "Pha", en: "Phase" },
  t3h2: { vi: "Làm gì", en: "What it does" },
  t3r1: { vi: "kiểm cấu trúc project", en: "checks the project structure" },
  t3r2: { vi: "biên dịch mã nguồn", en: "compiles the sources" },
  t3r3: { vi: "chạy unit test", en: "runs the unit tests" },
  t3r4: { vi: "đóng gói thành jar hoặc war", en: "packages a jar or war" },
  t3r5: { vi: "chạy kiểm tra tích hợp", en: "runs integration checks" },
  t3r6: { vi: "đưa vào kho cục bộ ~/.m2", en: "installs into the local repo ~/.m2" },
  t3r7: { vi: "đẩy lên kho từ xa", en: "deploys to a remote repo" },
} satisfies Record<string, Tx>;

function layerSteps(lang: Lang) {
  return lang === "vi"
    ? [
        { label: "thứ tự sai", note: "COPY . . đứng trước khi tải dependency. Mọi lớp phía sau phụ thuộc vào lớp này." },
        { label: "sửa một dòng code", note: "Lớp COPY . . đổi, nên nó và MỌI lớp sau nó bị bỏ cache." },
        { label: "tải lại toàn bộ", note: "Maven tải lại từ đầu, dù không dependency nào thay đổi. Vài phút mỗi lần build." },
        { label: "thứ tự đúng", note: "Chép pom.xml và tải dependency TRƯỚC, chép mã nguồn SAU." },
        { label: "sửa code lần nữa", note: "Chỉ lớp cuối bị bỏ cache. Lớp dependency vẫn dùng lại được vì pom.xml không đổi." },
        { label: "build vài giây", note: "Nguyên tắc chung: xếp thứ ít thay đổi lên trước, thứ hay thay đổi xuống cuối." },
      ]
    : [
        { label: "the wrong order", note: "COPY . . comes before the dependency download. Every layer below depends on this one." },
        { label: "edit one line of code", note: "The COPY . . layer changed, so it and EVERY layer after it lose their cache." },
        { label: "download it all again", note: "Maven refetches from scratch, although no dependency changed. Minutes on every build." },
        { label: "the right order", note: "Copy pom.xml and fetch the dependencies FIRST, copy the sources AFTER." },
        { label: "edit the code again", note: "Only the last layer misses. The dependency layer is reused because pom.xml did not change." },
        { label: "a build of seconds", note: "The general rule: what rarely changes goes first, what changes constantly goes last." },
      ];
}

export default function DevOps({ lang }: { lang: Lang }) {
  const s = say(lang);
  return (
    <div className="topic">
      <Defs />
      <TopicHead no="13" name="Docker, Git, Maven" lede={s(T.lede)} source={s(T.source)} />

      <Sec n="13.1" t={s(T.s1)}>
        <P>
          <Tr
            vi={
              <>
                <strong>Image</strong> là bản mẫu chỉ đọc, gồm nhiều <em>lớp</em> xếp chồng.{" "}
                <strong>Container</strong> là một tiến trình đang chạy từ image đó, cộng một lớp ghi được ở trên
                cùng.
              </>
            }
            en={
              <>
                An <strong>image</strong> is a read-only template made of stacked <em>layers</em>. A{" "}
                <strong>container</strong> is a process running from that image, plus one writable layer on top.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                Mỗi lệnh trong Dockerfile tạo một lớp và được cache. Điều quan trọng: <strong>một lớp đổi thì mọi
                lớp sau nó đều bị bỏ cache</strong> — và đó là lý do thứ tự lệnh quyết định tốc độ build.
              </>
            }
            en={
              <>
                Each Dockerfile instruction produces a layer, and layers are cached. The part that matters:{" "}
                <strong>change one layer and every layer after it loses its cache</strong> — which is why the
                order of the instructions decides how fast the build is.
              </>
            }
          />
        </P>

        <Walkthrough
          viewBox="0 0 720 240"
          aria={s(T.fig1aria)}
          hold={2100}
          steps={layerSteps(lang)}
          caption={
            <>
              <span className="plate-figlabel">{lang === "vi" ? "Bản vẽ 13.1" : "Figure 13.1"}</span>
              <Tr
                vi={
                  <>
                    Cùng một Dockerfile, hai thứ tự, chênh nhau vài phút mỗi lần build — nhân với số lần build
                    mỗi ngày.
                  </>
                }
                en={
                  <>
                    One Dockerfile, two orderings, minutes apart on every build — multiplied by the number of
                    builds a day.
                  </>
                }
              />
              <Key
                items={[
                  { c: "ok", t: s(T.k1a) },
                  { c: "bad", t: s(T.k1b) },
                ]}
              />
            </>
          }
        >
          {(i) => {
            const good = i >= 3;
            const rows = good
              ? ["FROM maven:3.9-eclipse-temurin-21", "COPY pom.xml .", "RUN mvn dependency:go-offline", "COPY src ./src", "RUN mvn package"]
              : ["FROM maven:3.9-eclipse-temurin-21", "COPY . .", "RUN mvn dependency:go-offline", "RUN mvn package"];
            // which layers are busted by a source change
            const bustFrom = good ? 3 : 1;
            const showBust = good ? i >= 4 : i >= 1;
            return (
              <>
                <g data-c={good ? "ok" : "bad"}>
                  <Ic n={good ? "zap" : "alert"} x={16} y={10} s={16} c={good ? "ok" : "bad"} />
                  <text x="40" y="24" className="d-m">{good ? s(T.d1good) : s(T.d1bad)}</text>
                </g>
                {rows.map((r, k) => {
                  const busted = showBust && k >= bustFrom;
                  return (
                    <g key={k} data-c={busted ? "bad" : "ok"}>
                      <rect x={16} y={40 + k * 36} width={520} height={28} className="d-box-fill" />
                      <text x={28} y={59 + k * 36} className="d-m">{r}</text>
                      <Ic n={busted ? "refresh" : "check"} x={548} y={46 + k * 36} s={15} c={busted ? "bad" : "ok"} />
                      <text x={570} y={59 + k * 36} className="d-m">
                        {busted ? s(T.d1rebuild) : s(T.d1cached)}
                      </text>
                    </g>
                  );
                })}
                <text x="16" y="228" className={showBust ? "d-m" : "d-s"} data-c={showBust ? (good ? "ok" : "bad") : undefined}>
                  {!showBust ? s(T.d1all) : good ? s(T.d1okmsg) : s(T.d1badmsg)}
                </text>
              </>
            );
          }}
        </Walkthrough>

        <P>
          <Tr
            vi={
              <>
                <strong>Multi-stage build:</strong> stage đầu dùng image có JDK và Maven để build ra jar; stage
                sau chỉ dùng JRE và chép mỗi cái jar sang. Image cuối không chứa mã nguồn, không chứa Maven,
                không chứa compiler — nhỏ hơn nhiều và bề mặt tấn công hẹp hơn hẳn.
              </>
            }
            en={
              <>
                <strong>Multi-stage build:</strong> the first stage uses an image with a JDK and Maven to
                produce the jar; the second uses only a JRE and copies just the jar across. The final image
                holds no sources, no Maven, no compiler — far smaller, and with a much narrower attack surface.
              </>
            }
          />
        </P>
        <Code lang="docker">{`FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app
ENTRYPOINT ["java", "-jar", "app.jar"]`}</Code>
        <Trap>
          <Tr
            vi={
              <p>
                Container chạy bằng <code>root</code> là mặc định tồi — nếu ai đó thoát được khỏi tiến trình thì
                họ là root trong container, và với một số cấu hình là cả trên máy chủ. Tạo user thường rồi{" "}
                <code>USER</code> sang nó chỉ tốn hai dòng.
              </p>
            }
            en={
              <p>
                Running a container as <code>root</code> is a bad default — anyone who escapes the process is
                root inside the container, and with some configurations on the host as well. Creating an
                ordinary user and switching to it with <code>USER</code> costs two lines.
              </p>
            }
          />
        </Trap>
        <Limit>
          <Tr
            vi={
              <>
                Bí mật <strong>không được</strong> đưa vào Dockerfile hay build arg — chúng nằm lại trong lịch sử
                lớp và ai kéo image về cũng đọc được. Chúng phải đến từ biến môi trường lúc chạy, và đó là cách{" "}
                <code>application.yaml</code> của tôi đọc khoá.
              </>
            }
            en={
              <>
                Secrets must <strong>never</strong> go into a Dockerfile or a build arg — they stay in the layer
                history and anyone who pulls the image can read them. They have to arrive as environment
                variables at run time, which is how my <code>application.yaml</code> reads its keys.
              </>
            }
          />
        </Limit>
      </Sec>

      <Sec n="13.2" t={s(T.s2)}>
        <Table
          head={[s(T.t2h1), s(T.t2h2), s(T.t2h3)]}
          rows={[
            [<code key="a">merge</code>, s(T.t2r1b), s(T.t2r1c)],
            [<code key="b">rebase</code>, s(T.t2r2b), s(T.t2r2c)],
            [<code key="c">cherry-pick</code>, s(T.t2r3b), s(T.t2r3c)],
            [<code key="d">revert</code>, s(T.t2r4b), s(T.t2r4c)],
            [<code key="e">reset --hard</code>, s(T.t2r5b), s(T.t2r5c)],
          ]}
        />
        <Trap t={T.trap2}>
          <Tr
            vi={
              <p>
                <strong>Đừng rebase nhánh đã push và có người khác dùng.</strong> Rebase viết lại commit id, nên
                lịch sử của bạn và của họ tách đôi, và lần merge sau sẽ nhân đôi mọi commit. Nhánh riêng chưa
                push thì rebase thoải mái.
              </p>
            }
            en={
              <p>
                <strong>Never rebase a branch you have pushed and somebody else is using.</strong> Rebase
                rewrites commit ids, so your history and theirs split in two, and the next merge duplicates
                every commit. On a private branch you have not pushed, rebase freely.
              </p>
            }
          />
        </Trap>
        <P>
          <Tr
            vi={
              <>
                <strong>Xử lý conflict:</strong> mở file có dấu <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>,{" "}
                <code>=======</code>, <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code>, đọc <em>cả hai</em> phía để
                hiểu mỗi bên định làm gì, rồi viết lại đoạn đúng. Chọn bừa "current" hay "incoming" là cách tạo
                ra lỗi mà không ai nhớ nguồn gốc.
              </>
            }
            en={
              <>
                <strong>Resolving a conflict:</strong> open the file with the{" "}
                <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code>=======</code>,{" "}
                <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> markers, read <em>both</em> sides to see what each
                was trying to do, then write the correct passage. Blindly picking "current" or "incoming" is how
                you create a bug nobody can trace the origin of.
              </>
            }
          />
        </P>
        <CodeTr
          lang="shell"
          vi={`# luồng tôi dùng trên IntelliPath
git checkout -b feat/roadmap-tier
# ... làm việc, commit nhỏ và có nghĩa ...
git checkout develop && git pull
git merge feat/roadmap-tier      # merge, không rebase
git push`}
          en={`# the flow I use on IntelliPath
git checkout -b feat/roadmap-tier
# ... work, in small meaningful commits ...
git checkout develop && git pull
git merge feat/roadmap-tier      # merge, not rebase
git push`}
        />
      </Sec>

      <Sec n="13.3" t={s(T.s3)}>
        <P>
          <Tr
            vi={
              <>
                Maven là công cụ build <em>và</em> quản lý phụ thuộc. Phần người ta hay quên là nó cũng định
                nghĩa <strong>vòng đời</strong>: chạy một pha là chạy tất cả các pha trước nó.
              </>
            }
            en={
              <>
                Maven is a build tool <em>and</em> a dependency manager. The part people forget is that it also
                defines a <strong>lifecycle</strong>: running one phase runs every phase before it.
              </>
            }
          />
        </P>
        <Table
          head={[s(T.t3h1), s(T.t3h2)]}
          rows={[
            [<code key="a">validate</code>, s(T.t3r1)],
            [<code key="b">compile</code>, s(T.t3r2)],
            [<code key="c">test</code>, s(T.t3r3)],
            [<code key="d">package</code>, s(T.t3r4)],
            [<code key="e">verify</code>, s(T.t3r5)],
            [<code key="f">install</code>, s(T.t3r6)],
            [<code key="g">deploy</code>, s(T.t3r7)],
          ]}
        />
        <P>
          <Tr
            vi={
              <>
                Nên <code>mvn package</code> đã chạy <code>compile</code> và <code>test</code> rồi. Và{" "}
                <code>mvn clean install -DskipTests</code> nghĩa là: xoá <code>target/</code>, build, bỏ qua
                test, đưa vào kho cục bộ.
              </>
            }
            en={
              <>
                So <code>mvn package</code> has already run <code>compile</code> and <code>test</code>. And{" "}
                <code>mvn clean install -DskipTests</code> means: wipe <code>target/</code>, build, skip the
                tests, install into the local repository.
              </>
            }
          />
        </P>
        <P>
          <Tr
            vi={
              <>
                <strong>Phụ thuộc bắc cầu:</strong> khai A thì Maven kéo về cả những thứ A cần. Khi hai nhánh phụ
                thuộc kéo về hai phiên bản khác nhau của cùng một thư viện, Maven chọn cái{" "}
                <em>gần gốc cây nhất</em> — đó là "nearest wins", và nó là nguồn gốc của những lỗi{" "}
                <code>NoSuchMethodError</code> khó hiểu. <code>mvn dependency:tree</code> là lệnh để tìm ra.
              </>
            }
            en={
              <>
                <strong>Transitive dependencies:</strong> declare A and Maven pulls in what A needs too. When
                two branches of the tree pull two versions of the same library, Maven takes the one{" "}
                <em>nearest the root</em> — that is "nearest wins", and it is the source of those baffling{" "}
                <code>NoSuchMethodError</code>s. <code>mvn dependency:tree</code> is how you find it.
              </>
            }
          />
        </P>
      </Sec>
    </div>
  );
}
