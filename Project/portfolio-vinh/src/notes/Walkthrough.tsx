import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useLang } from "./i18n";

/**
 * step-walk — the fourth motion primitive, and the only one that is a control
 * rather than a reveal.
 *
 * A reveal answers "has the reader arrived here yet". This answers "which step
 * of the mechanism are we looking at", which is a different question: the reader
 * drives it, it goes backwards, and it has to be readable while paused. That is
 * why it is a primitive and not a variation of `cell-wake`.
 *
 * No animation library was added for it. GSAP is already the project's motion
 * system and a timeline is exactly the right shape here; a second library would
 * have bought nothing and cost a dependency plus its bundle.
 *
 * THE RULE THIS OBEYS — inherited, non-negotiable: motion decides *how* a mark
 * appears, never *whether*. Every frame renders complete. Marks tagged
 * `data-enter` are tweened in from the frame before, but they rest visible, so a
 * frame that is never tweened — reduced motion, GSAP failing to load, a throttled
 * tab — is still a correct picture of that step.
 */

export type Step = {
  /** Shown in the step rail and read by screen readers. Keep it to a few words. */
  label: string;
  /** One sentence under the figure explaining what changed. Optional. */
  note?: string;
};

type Props = {
  steps: Step[];
  /** Drawn coordinate space. Same 8px-cell discipline as the static plates. */
  viewBox: string;
  /** What the whole figure shows, for readers who cannot see it. */
  aria: string;
  /** Sits under the controls. States what the reader is looking at. */
  caption: React.ReactNode;
  /** Milliseconds each step holds during autoplay. */
  hold?: number;
  children: (step: number) => React.ReactNode;
};

const REDUCED = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Walkthrough({ steps, viewBox, aria, caption, hold = 1900, children }: Props) {
  const lang = useLang();
  const L =
    lang === "vi"
      ? { prev: "Bước trước", next: "Bước sau", play: "Chạy", pause: "Tạm dừng" }
      : { prev: "Previous step", next: "Next step", play: "Play", pause: "Pause" };
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const last = steps.length - 1;

  const go = useCallback(
    (n: number) => setI(Math.max(0, Math.min(last, n))),
    [last],
  );

  /* ---- autoplay -------------------------------------------------------- */

  useEffect(() => {
    if (!playing) return;
    // Stop at the end rather than looping. A loop makes the last step hard to
    // read, and the reader has already been given the whole sequence once.
    if (i >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((n) => n + 1), hold);
    return () => clearTimeout(t);
  }, [playing, i, last, hold]);

  /* ---- the tween ------------------------------------------------------- */

  useLayoutEffect(() => {
    const el = svg.current;
    if (!el || REDUCED()) return;

    const entering = el.querySelectorAll("[data-enter]");
    if (!entering.length) return;

    // fromTo with immediateRender:false — the element must not be painted in its
    // from-state at creation, or a frame whose tween never runs shows nothing.
    const tw = gsap.fromTo(
      entering,
      { opacity: 0, y: 6 },
      {
        opacity: 1,
        y: 0,
        duration: 0.34,
        stagger: 0.045,
        ease: "power2.out",
        immediateRender: false,
        // Assert the end state rather than trusting the tween to have reached it.
        onComplete: () => gsap.set(entering, { opacity: 1, y: 0, clearProps: "transform" }),
      },
    );
    return () => {
      tw.kill();
      gsap.set(entering, { opacity: 1, y: 0, clearProps: "transform" });
    };
  }, [i]);

  /* ---- keyboard -------------------------------------------------------- */

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setPlaying(false);
      go(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPlaying(false);
      go(i - 1);
    }
  };

  return (
    <figure className="walk">
      <div
        className="walk-stage"
        tabIndex={0}
        onKeyDown={onKey}
        role="group"
        aria-label={aria}
      >
        <svg ref={svg} viewBox={viewBox} role="img" aria-label={`${aria} — ${steps[i].label}`}>
          {children(i)}
        </svg>
      </div>

      <div className="walk-bar">
        <div className="walk-btns">
          <button type="button" onClick={() => { setPlaying(false); go(i - 1); }} disabled={i === 0} aria-label={L.prev}>
            ←
          </button>
          <button
            type="button"
            className="walk-play"
            onClick={() => (i >= last ? (go(0), setPlaying(true)) : setPlaying((p) => !p))}
            aria-label={playing ? L.pause : L.play}
          >
            {playing ? "❚❚" : i >= last ? "↻" : "▶"}
          </button>
          <button type="button" onClick={() => { setPlaying(false); go(i + 1); }} disabled={i === last} aria-label={L.next}>
            →
          </button>
        </div>

        <ol className="walk-rail">
          {/* Keyed by position, not label: two steps of the same kind share a
              name ("quét" three times), and a duplicate key silently drops one. */}
          {steps.map((s, n) => (
            <li key={n}>
              <button
                type="button"
                className="walk-step"
                aria-current={n === i ? "step" : undefined}
                onClick={() => { setPlaying(false); go(n); }}
              >
                <span className="walk-step-n">{n + 1}</span>
                <span className="walk-step-l">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {steps[i].note && <p className="walk-note">{steps[i].note}</p>}

      <figcaption>{caption}</figcaption>
    </figure>
  );
}
