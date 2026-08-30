import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COPY, LINKS, STACK, STAGES, type Lang } from "../content";
import { useCellWake } from "../Grid";

gsap.registerPlugin(ScrollTrigger);

/**
 * 14 · Narrative Workflow.
 *
 * The three rooms become numbered stages, 1.0 → 2.0 → 3.0. The content was
 * already sequential — a problem, a build, a set of measurements — and the
 * previous system's continuous-prose shape hid that ordering behind paragraphs.
 *
 * The number is sticky beside its own stage rather than fixed to the page, so
 * the reader always knows which stage they're inside without a progress bar.
 */

/** stage-advance — the stage number counts up as its section takes the viewport. */
function useStageAdvance(ref: React.RefObject<HTMLElement | null>, to: number, deps: unknown[]) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = to.toFixed(1);
      return;
    }
    // Resting state is the CORRECT number, and the tween counts up TO it.
    // The other way round — start low, wait for the trigger — leaves a stage
    // labelled "0.0" whenever the trigger never fires, which is exactly what
    // happens to a section already past its start point on first paint. A
    // decoration must never be what makes a figure right.
    el.textContent = to.toFixed(1);
    const n = { v: to };
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        n.v = Math.max(0, to - 1);
        gsap.to(n, {
          v: to,
          duration: 0.7,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = n.v.toFixed(1);
          },
          onComplete: () => {
            el.textContent = to.toFixed(1);
          },
        });
      },
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function Stage({
  no,
  name,
  children,
  lang,
}: {
  no: string;
  name: string;
  children: React.ReactNode;
  lang: Lang;
}) {
  const root = useRef<HTMLElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  useCellWake(root, [lang]);
  useStageAdvance(num, parseFloat(no), [lang]);

  return (
    <section className="stage" ref={root}>
      <div className="stage-mark">
        <span className="stage-no" ref={num}>
          {no}
        </span>
        <span className="stage-name">{name}</span>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default function Project({ lang }: { lang: Lang }) {
  const t = COPY[lang].project;
  const names = COPY[lang].stageName;
  const head = useRef<HTMLDivElement>(null);
  useCellWake(head, [lang]);

  return (
    <div className="side" id="main">
      <div className="flow-head" ref={head}>
        <p className="label">IntelliPath</p>
        <h1 className="stage-h">{t.problem.h}</h1>
        <p className="flow-lede">{t.lede}</p>
      </div>

      <Stage no={STAGES[0].no} name={names.problem} lang={lang}>
        <div className="stage-body">
          {t.problem.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p className="pull">{t.problem.pull}</p>
        </div>
      </Stage>

      <Stage no={STAGES[1].no} name={names.build} lang={lang}>
        <h2 className="stage-h">{t.build.h}</h2>
        <div className="stage-body">
          <p>{t.build.body}</p>
        </div>

        <p className="label" style={{ marginTop: "var(--space-md)" }}>
          {t.build.stackLabel}
        </p>
        <ul className="chips">
          {STACK.map((s) => (
            <li className="chip" key={s}>
              {s}
            </li>
          ))}
        </ul>

        <p className="label" style={{ marginTop: "var(--space-md)" }}>
          {t.build.partsLabel}
        </p>
        <ul className="parts">
          {t.build.parts.map((p) => (
            <li className="part" key={p.n}>
              <p className="part-n">{p.n}</p>
              <p className="part-d">{p.d}</p>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: "var(--space-md)" }}>
          <a className="btn btn--ghost" href={LINKS.project} target="_blank" rel="noreferrer">
            {t.build.cta}
          </a>
        </p>
      </Stage>

      <Stage no={STAGES[2].no} name={names.proof} lang={lang}>
        <h2 className="stage-h">{t.proof.h}</h2>
        <div className="stage-body">
          <p>{t.proof.lede}</p>
        </div>
        <ul className="stats">
          {t.proof.stats.map((s) => (
            <li className="stat" key={s.label}>
              <p className="stat-n">{s.n}</p>
              <p className="stat-label">{s.label}</p>
              <p className="stat-how">{s.how}</p>
            </li>
          ))}
        </ul>
        <p className="note">{t.proof.note}</p>
      </Stage>
    </div>
  );
}
