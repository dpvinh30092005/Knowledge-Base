import { Tr, useLang } from "./i18n";

/**
 * The marks a page of the notebook is made of.
 *
 * Kept in one file so a topic page is only its content. A topic that needs a new
 * kind of mark adds it here rather than inventing a local one, which is what
 * stops twelve pages from drifting into twelve layouts.
 */

/**
 * Shared arrowheads for every figure on the side. One defs block per page.
 *
 * One marker per role rather than one marker reading `--c`: a `<marker>` paints
 * in its own context, detached from whatever referenced it, so a custom property
 * set on the line never reaches the head. Four heads is the price of coloured
 * arrows and it is worth paying — a green line ending in a grey point reads as
 * an unfinished drawing.
 */
export function Defs() {
  const head = (id: string, cls: string) => (
    <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L8 4 L0 8 z" className={cls} />
    </marker>
  );
  return (
    <svg width="0" height="0" aria-hidden="true" className="plate-defs">
      <defs>
        {head("pa", "d-head")}
        {head("pa-a", "d-head-a")}
        {head("pa-ok", "d-head-ok")}
        {head("pa-warn", "d-head-warn")}
        {head("pa-info", "d-head-info")}
      </defs>
    </svg>
  );
}

/* ---- glyphs -------------------------------------------------------------- */

/**
 * Drawn in the lucide idiom: 24-unit box, 2-unit stroke, round caps, no fill.
 *
 * Borrowing the vocabulary rather than the package. A padlock outline, a
 * cylinder, a stopwatch — a reader already knows these, and inventing a private
 * symbol set would make every figure need a legend before it could be read.
 * Twenty-four glyphs is not worth a dependency plus the build step that would
 * shake it back down to twenty-four.
 */
const GLYPH: Record<string, React.ReactNode> = {
  /* verdicts */
  check: <path className="d-ic" d="M20 6 9 17l-5-5" />,
  x: <path className="d-ic" d="M18 6 6 18M6 6l12 12" />,
  alert: (
    <>
      <path className="d-ic" d="M12 3 22 20H2Z" />
      <path className="d-ic" d="M12 10v4" />
      <path className="d-ic" d="M12 17.5v.01" />
    </>
  ),
  /* the machine */
  server: (
    <>
      <rect className="d-ic" x="2" y="3" width="20" height="8" rx="1" />
      <rect className="d-ic" x="2" y="13" width="20" height="8" rx="1" />
      <path className="d-ic" d="M6 7h.01M6 17h.01" />
    </>
  ),
  database: (
    <>
      <path className="d-ic" d="M3 5c0-1.7 4-3 9-3s9 1.3 9 3-4 3-9 3-9-1.3-9-3Z" />
      <path className="d-ic" d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path className="d-ic" d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    </>
  ),
  cpu: (
    <>
      <rect className="d-ic" x="4" y="4" width="16" height="16" rx="2" />
      <rect className="d-ic" x="9" y="9" width="6" height="6" />
      <path className="d-ic" d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </>
  ),
  layers: (
    <>
      <path className="d-ic" d="M12 2 2 8l10 6 10-6Z" />
      <path className="d-ic" d="m2 14 10 6 10-6" />
    </>
  ),
  box: (
    <>
      <path className="d-ic" d="M12 2 21 7v10l-9 5-9-5V7Z" />
      <path className="d-ic" d="m3 7 9 5 9-5M12 12v10" />
    </>
  ),
  /* people and the wire */
  user: (
    <>
      <circle className="d-ic" cx="12" cy="8" r="4" />
      <path className="d-ic" d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  globe: (
    <>
      <circle className="d-ic" cx="12" cy="12" r="10" />
      <path className="d-ic" d="M2 12h20" />
      <path className="d-ic" d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
    </>
  ),
  send: <path className="d-ic" d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />,
  link: (
    <>
      <path className="d-ic" d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path className="d-ic" d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </>
  ),
  /* security */
  lock: (
    <>
      <rect className="d-ic" x="3" y="11" width="18" height="11" rx="2" />
      <path className="d-ic" d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  unlock: (
    <>
      <rect className="d-ic" x="3" y="11" width="18" height="11" rx="2" />
      <path className="d-ic" d="M7 11V7a5 5 0 0 1 9.9-1" />
    </>
  ),
  key: (
    <>
      <circle className="d-ic" cx="7.5" cy="15.5" r="4.5" />
      <path className="d-ic" d="M10.7 12.3 21 2M17.5 5.5 20 8" />
    </>
  ),
  shield: <path className="d-ic" d="M12 2 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6Z" />,
  eye: (
    <>
      <path className="d-ic" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle className="d-ic" cx="12" cy="12" r="3" />
    </>
  ),
  filter: <path className="d-ic" d="M3 4h18l-7 8v7l-4 2v-9Z" />,
  /* time and cost */
  clock: (
    <>
      <circle className="d-ic" cx="12" cy="12" r="10" />
      <path className="d-ic" d="M12 6v6l4 2" />
    </>
  ),
  zap: <path className="d-ic" d="M13 2 4 14h7l-1 8 9-12h-7Z" />,
  refresh: (
    <>
      <path className="d-ic" d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path className="d-ic" d="M21 3v6h-6" />
    </>
  ),
  trash: (
    <>
      <path className="d-ic" d="M3 6h18M8 6V4h8v2" />
      <path className="d-ic" d="m5 6 1 15h12l1-15" />
    </>
  ),
  /* code and data */
  file: (
    <>
      <path className="d-ic" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path className="d-ic" d="M14 2v6h6" />
    </>
  ),
  code: <path className="d-ic" d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  terminal: <path className="d-ic" d="m4 17 6-6-6-6M12 19h8" />,
  search: (
    <>
      <circle className="d-ic" cx="11" cy="11" r="7" />
      <path className="d-ic" d="m20 20-4.3-4.3" />
    </>
  ),
  list: <path className="d-ic" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  hash: <path className="d-ic" d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />,
  branch: (
    <>
      <circle className="d-ic" cx="6" cy="18" r="3" />
      <circle className="d-ic" cx="18" cy="6" r="3" />
      <path className="d-ic" d="M6 15V6M18 9a9 9 0 0 1-9 9" />
    </>
  ),
  cookie: (
    <>
      <circle className="d-ic" cx="12" cy="12" r="10" />
      <path className="d-ic" d="M9 9h.01M15 10h.01M10 15h.01M15.5 14.5h.01" />
    </>
  ),
};

export type GlyphName = keyof typeof GLYPH;

/**
 * One glyph, placed in the drawing's own coordinate space.
 *
 * `x`/`y` is the TOP-LEFT of an `s`×`s` box, not the centre — every other mark
 * on these sheets is positioned by its corner, and one primitive measuring from
 * somewhere else is how figures end up half a cell out.
 *
 * `c` sets the legend role for the glyph and anything else inside the same
 * group; leaving it off gives plain ink, which is the right default for a glyph
 * that names a component rather than judging it.
 */
export function Ic({
  n,
  x,
  y,
  s = 16,
  c,
}: {
  n: GlyphName;
  x: number;
  y: number;
  s?: number;
  c?: "ok" | "warn" | "info" | "bad" | "mute";
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 24})`} data-c={c} aria-hidden="true">
      {GLYPH[n]}
    </g>
  );
}

/**
 * The same glyph outside a drawing — in a button, a lane header, a line of prose.
 *
 * Its own `<svg>` box rather than `Ic`'s `<g>`, because there is no figure
 * coordinate space out here; it sizes off the text beside it. Both read the same
 * `--c`, so a padlock in a lab lane is the colour the lane is.
 */
export function Glyph({ n, s = 16 }: { n: GlyphName; s?: number }) {
  return (
    <svg className="d-glyph" width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {GLYPH[n]}
    </svg>
  );
}

/**
 * What the four colours mean, stated once under the figure that uses them.
 *
 * Colour is only a legend if the legend is written down. Without this the
 * palette is decoration that the reader has to reverse-engineer, and a reader
 * doing that is not learning the mechanism.
 */
export function Key({ items }: { items: { c: "ok" | "warn" | "info" | "bad"; t: string }[] }) {
  return (
    <ul className="d-key">
      {items.map((k) => (
        <li key={k.c} data-c={k.c}>
          <i aria-hidden="true" />
          {k.t}
        </li>
      ))}
    </ul>
  );
}

/** A topic's opening: what this page covers and where the material came from. */
export function TopicHead({ no, name, lede, source }: { no: string; name: string; lede: string; source?: string }) {
  return (
    <header className="topic-head">
      <p className="topic-ref">
        <span className="topic-no">{no}</span> {name}
      </p>
      <p className="topic-lede">{lede}</p>
      {source && <p className="topic-source">{source}</p>}
    </header>
  );
}

/** A numbered section inside a topic. */
export function Sec({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <section className="nsec">
      <h2 className="nsec-h">
        <span className="nsec-n">{n}</span>
        {t}
      </h2>
      {children}
    </section>
  );
}

/** Body prose. Constrained to the measure; never full width. */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="nprose">{children}</p>;
}

/** A static drawing with its caption. */
export function Fig({
  viewBox,
  aria,
  caption,
  children,
}: {
  viewBox: string;
  aria: string;
  caption: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className="plate-fig">
      <div className="plate-scroll">
        <svg viewBox={viewBox} role="img" aria-label={aria}>
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/**
 * The boundary of what is being claimed.
 *
 * Every mechanism on this side carries one. A note that only says what works
 * reads as advertising, and naming the limit is what makes the rest credible.
 */
export function Limit({ children }: { children: React.ReactNode }) {
  return (
    <p className="plate-limit">
      <span className="plate-limitlabel">
        <Tr vi="Chỗ nó dừng lại" en="Where it stops" />
      </span>
      {children}
    </p>
  );
}

/** A thing that is true and costs marks in an interview when it is not known. */
export function Trap({ t, children }: { t?: { vi: string; en: string }; children: React.ReactNode }) {
  const lang = useLang();
  const label = t ? t[lang] : lang === "vi" ? "Bẫy hay gặp" : "Common trap";
  return (
    <aside className="ntrap">
      <span className="ntrap-l">{label}</span>
      {children}
    </aside>
  );
}

/** Source code, coloured. Both marks live in `code.tsx` with the palette that
 *  drives them; they are re-exported here so a page still imports one file. */
export { Code, CodeTr, type CodeLang } from "./code";

/** A comparison the reader is meant to scan rather than read. */
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="ntbl-wrap">
      <table className="ntbl">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
