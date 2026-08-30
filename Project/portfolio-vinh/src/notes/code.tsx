import { Highlight, Prism, type PrismTheme } from "prism-react-renderer";
import { useLang } from "./i18n";

/**
 * Coloured code.
 *
 * The earlier note here said the opposite — that a code block stays black
 * because colour would be a second accent competing with the vermilion. That
 * reasoning holds on the profile side, where colour is emphasis. It does not
 * hold here, for exactly the reason already recorded for the figure legend in
 * `tokens.css`: inside teaching material colour is not emphasis, it is an
 * encoding. A reader scanning `@Transactional public void saveOne(Car c)` for
 * the thing that matters should not have to read the line to find it.
 *
 * So the code palette is the SAME four roles as the figures, not a new one:
 *
 *   blue      keywords          the language's own words
 *   green     strings, chars    literal data
 *   amber     numbers           literal quantities
 *   vermilion annotations       the subject of pages 08 and 09
 *   ink       type names        what the code is about
 *   grey      comments, syntax  scaffolding
 *
 * Vermilion lands on annotations alone. That keeps it under the 3% rule and
 * spends it on the one mark these pages are actually about — on the Spring
 * page, `@Transactional` *is* the lesson.
 *
 * ## Why the grammars are written here
 *
 * `prism-react-renderer` bundles a Prism core with about forty languages, and
 * Java is not one of them. The alternative was a second dependency (`prismjs`)
 * imported for its side effects. Three small grammars extending the bundled
 * `clike` cost less than that and can be read in one sitting, which matters
 * more than completeness: this notebook shows Java, SQL, a Dockerfile and a
 * handful of shell lines, and nothing else.
 */

/* -------------------------------------------------------------------------- */
/*  Grammars                                                                   */
/* -------------------------------------------------------------------------- */

const JAVA_KEYWORDS =
  /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;

if (!Prism.languages.java) {
  Prism.languages.java = Prism.languages.extend("clike", {
    "class-name": [
      /* Lookbehind, not a plain group: without it the keyword introducing the
         type gets swallowed into the type token and stops being blue. */
      {
        pattern: /(\b(?:class|enum|record|interface|extends|implements|instanceof|new|throws)\s+)[A-Z]\w*/,
        lookbehind: true,
      },
      /\b[A-Z]\w*(?=\s+\w+\s*[;,=)])/,
      /\b[A-Z]\w*(?=\s*<)/,
    ],
    keyword: JAVA_KEYWORDS,
    boolean: /\b(?:true|false)\b/,
    number: /\b0[xb][\da-f_]+L?\b|\b\d[\d_]*(?:\.\d[\d_]*)?(?:e[+-]?\d+)?[dflL]?\b/i,
    operator: {
      pattern: /(^|[^.])(?:<<=?|>>>?=?|->|::|[-+*/%&|^!=<>]=?|&&|\|\||[?:~])/m,
      lookbehind: true,
    },
  });

  Prism.languages.insertBefore("java", "class-name", {
    /* The mark these pages are about. Given its own role so it can be found
       without reading the line it sits on. */
    annotation: {
      pattern: /(^|[^.\w])@\w+/,
      lookbehind: true,
      alias: "annotation",
    },
    generics: {
      pattern: /<\s*[A-Z]\w*(?:\s*,\s*(?:\?|[A-Z]\w*))*\s*>/,
      alias: "class-name",
    },
  });
}

/** Just enough for one Dockerfile. Instructions, comments, strings. */
if (!Prism.languages.docker) {
  Prism.languages.docker = {
    comment: /#.*/,
    keyword:
      /^\s*(?:FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL|AS)\b/im,
    string: /"(?:\\.|[^"\\])*"/,
    operator: /--[\w-]+/,
  };
}

/** Shell, at the level these pages use it: a comment, a command, its flags. */
if (!Prism.languages.shell) {
  Prism.languages.shell = {
    comment: /#.*/,
    string: /"(?:\\.|[^"\\])*"|'[^']*'/,
    keyword: /^\s*(?:git|mvn|npm|docker|node|java|cd|export)\b/m,
    operator: /--?[\w-]+|&&|\|\||[|>&]/,
  };
}

export type CodeLang = "java" | "sql" | "docker" | "shell" | "plain";

/* -------------------------------------------------------------------------- */
/*  Theme                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Every colour is a `var()` rather than a literal.
 *
 * Prism themes are applied as inline styles, which would normally put six hard
 * hex values into the markup and take them out of reach of `tokens.css`. Naming
 * the variables instead keeps the one rule this design has — that a colour is
 * declared once — true of the code blocks as well.
 */
const theme: PrismTheme = {
  plain: { color: "var(--color-ink)", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "cdata"], style: { color: "var(--code-comment)", fontStyle: "italic" } },
    { types: ["keyword", "builtin"], style: { color: "var(--code-kw)", fontWeight: "600" } },
    { types: ["string", "char", "attr-value", "triple-quoted-string"], style: { color: "var(--code-str)" } },
    { types: ["number", "boolean", "constant", "symbol"], style: { color: "var(--code-num)" } },
    { types: ["annotation"], style: { color: "var(--code-anno)", fontWeight: "600" } },
    { types: ["class-name", "generics", "tag"], style: { color: "var(--code-type)", fontWeight: "600" } },
    { types: ["function", "attr-name", "property"], style: { color: "var(--code-fn)" } },
    { types: ["operator", "punctuation"], style: { color: "var(--code-punct)" } },
    { types: ["variable", "namespace"], style: { color: "var(--color-ink-2)" } },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Marks                                                                      */
/* -------------------------------------------------------------------------- */

/** Source code. `lang` defaults to Java, which is almost every block here. */
export function Code({ children, lang = "java" }: { children: string; lang?: CodeLang }) {
  return (
    <Highlight prism={Prism} theme={theme} code={children.replace(/\n+$/, "")} language={lang}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="ncode">
          <code>
            {tokens.map((line, i) => {
              const { key: _lk, ...lineProps } = getLineProps({ line }) as { key?: unknown } & Record<string, unknown>;
              return (
                <span key={i} {...lineProps} className="ncode-l">
                  {line.map((token, k) => {
                    const { key: _tk, ...tokenProps } = getTokenProps({ token }) as {
                      key?: unknown;
                    } & Record<string, unknown>;
                    return <span key={k} {...tokenProps} />;
                  })}
                  {"\n"}
                </span>
              );
            })}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

/**
 * Source code whose comments are written in the reader's language.
 *
 * The identifiers, the keywords and the printed strings are the same bytes in
 * both — a snippet the reader retypes has to compile — so only the `//` text
 * moves. Where a snippet is quoted verbatim from a book, use `Code` instead and
 * leave the author's own comments alone: translating them would make the page
 * disagree with the printed page it cites.
 */
export function CodeTr({ vi, en, lang }: { vi: string; en: string; lang?: CodeLang }) {
  return <Code lang={lang}>{useLang() === "vi" ? vi : en}</Code>;
}
