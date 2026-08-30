import { useRef } from "react";
import { COPY, LINKS, SIDE_REF, STACK, type Lang } from "../content";
import type { Side } from "../router";
import { useCellWake } from "../Grid";

/**
 * 19 · Map / Diagram.
 *
 * The profile as a system map rather than a column. Each block is addressed by a
 * sheet reference (A / B / C / D) and occupies a span of the twelve-column grid,
 * so the reader takes in a layout before they take in a sentence. The previous
 * system stacked the same content as a diptych, which read as "about me" — this
 * reads as a drawing of one.
 */
/**
 * One panel, projecting its own four edges onto the sheet.
 *
 * Registering the container alone gave the page two rectangles' worth of lines,
 * which is a margin, not a grid. The cells only become cells when each block
 * contributes the edges it actually occupies.
 */
function Node({ className, lang, children }: { className: string; lang: Lang; children: React.ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  useCellWake(el, [lang]);
  return (
    <div className={`node ${className}`} ref={el}>
      {children}
    </div>
  );
}

export default function Home({ lang, go }: { lang: Lang; go: (s: Side) => void }) {
  const t = COPY[lang].home;
  const head = useRef<HTMLDivElement>(null);

  useCellWake(head, [lang]);

  return (
    <section className="side" id="main">
      <div className="map-head" ref={head}>
        <p className="map-ref">
          {SIDE_REF.home} — {COPY[lang].sideName.home}
        </p>
        <h1 className="map-name">{t.name}</h1>
        <p className="map-role">{t.role}</p>
        <p className="map-place">{t.place}</p>
        <p className="map-open">{t.open}</p>
      </div>

      <div className="map-grid">
        <Node className="node--intro" lang={lang}>
          <p className="node-ref">A — {lang === "vi" ? "Giới thiệu" : "Introduction"}</p>
          <div className="intro">
            {t.intro.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </Node>

        <Node className="node--stack" lang={lang}>
          <p className="node-ref">B — {t.stackLabel}</p>
          <ul className="chips">
            {STACK.map((s) => (
              <li className="chip" key={s}>
                {s}
              </li>
            ))}
          </ul>
        </Node>

        <Node className="node--reach" lang={lang}>
          <p className="node-ref">C — {t.reachLabel}</p>
          <div className="reach">
            <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
            <a href={LINKS.github} target="_blank" rel="noreferrer">
              github.com/dpvinh30092005
            </a>
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
              linkedin.com/in/vinhdpse2005
            </a>
            <a href={LINKS.demo} target="_blank" rel="noreferrer">
              intelipath.online
            </a>
          </div>
        </Node>

        <Node className="node--sides" lang={lang}>
          <p className="node-ref">D — {t.sidesLabel}</p>
          <div className="side-cards">
            <button type="button" className="side-card" onClick={() => go("project")}>
              <span className="side-card-t">
                <span className="side-card-ref">{SIDE_REF.project}</span>
                {t.sides.project.t}
              </span>
              <span className="side-card-d">{t.sides.project.d}</span>
            </button>
            <a className="side-card" href={LINKS.demo} target="_blank" rel="noreferrer">
              <span className="side-card-t">
                <span className="side-card-ref">↗</span>
                intelipath.online
              </span>
              <span className="side-card-d">
                {lang === "vi"
                  ? "Bản đang chạy thật. Mở thử được ngay."
                  : "The running system. Open it and try it."}
              </span>
            </a>
          </div>
        </Node>
      </div>
    </section>
  );
}
