import { Suspense, useRef } from "react";
import { COPY, type Lang } from "../content";
import { useCellWake } from "../Grid";
import { LangProvider } from "../notes/i18n";
import { TOPICS, resolveTopic } from "../notes/topics";

/**
 * 11 · Annotated Plate — the notebook.
 *
 * The third shape in the family. Profile is a map, project is a workflow, and
 * this is a drawing set with numbered pages. Type is annotation on a drawing,
 * which is the register the retired `art` side introduced and the only part of
 * it worth keeping.
 *
 * The contents rail is plain data from `notes/topics.ts` and renders without
 * loading a single page, which is what lets every topic be code-split. The
 * heaviest side of the site therefore costs the other two nothing.
 */

export default function Notes({
  lang,
  topic,
  go,
}: {
  lang: Lang;
  topic: string | null;
  go: (side: "notes", topic?: string) => void;
}) {
  const head = useRef<HTMLElement>(null);
  useCellWake(head, [lang, topic]);
  const t = COPY[lang].notes;
  const current = resolveTopic(topic);
  const { Page } = current;

  return (
    /* One provider for the whole side. The shared marks in `parts.tsx` — the
       "where it stops" label, the trap heading — read the language from here
       rather than taking a prop at each of their ~90 call sites. Page bodies
       still take `lang` as a prop; this is only for the marks. */
    <LangProvider value={lang}>
    <div className="side notes" id="main">
      <header className="notes-head" ref={head}>
        <p className="notes-lede">{t.lede}</p>
        <h1 className="notes-h">{t.h}</h1>
        <p className="notes-intro">{t.intro}</p>
      </header>

      {/* Contents. A rail rather than a dropdown: the list is short enough to
          show whole, and a reader deciding what to open should see the options
          rather than remember them. */}
      <nav className="toc" aria-label={lang === "vi" ? "Nội dung" : "Contents"}>
        <ol>
          {TOPICS.map((tp) => (
            <li key={tp.id}>
              <button
                type="button"
                className="toc-item"
                aria-current={tp.id === current.id ? "page" : undefined}
                onClick={() => go("notes", tp.id)}
              >
                <span className="toc-no">{tp.no}</span>
                <span className="toc-body">
                  <span className="toc-name">{tp.name[lang]}</span>
                  <span className="toc-blurb">{tp.blurb[lang]}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* A lazily-loaded page needs a fallback that reserves height, or the
          footer jumps up and back down on every topic switch. */}
      <Suspense fallback={<div className="topic-loading" aria-live="polite">{lang === "vi" ? "đang mở trang…" : "opening the page…"}</div>}>
        <Page lang={lang} />
      </Suspense>
    </div>
    </LangProvider>
  );
}
