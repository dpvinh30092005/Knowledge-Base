import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Extension lines.
 *
 * On a drafting sheet the edges of an object are projected out to the margins by
 * thin lines, so the drawing carries its own measurements. This page does the
 * same thing: every content block projects its four edges across the full width
 * and height of the sheet. The cells you end up looking at are the intersections
 * of those projections.
 *
 * Which means the grid is not a backdrop. It is a drawing OF the layout — there
 * is no line on this page that isn't the edge of something. A block moved a
 * pixel moves its lines with it, and a grid that disagreed with the content
 * would be visibly wrong rather than quietly wrong.
 *
 * Two rejected approaches, for whoever reads this next:
 *   · an 8px quadrille mesh — notebook paper, not a layout; it competed with the
 *     type instead of measuring it.
 *   · a 12-column guide set — correct, and borrowed. Twelve columns with a 24px
 *     gutter is the default every framework ships; using it would have made the
 *     page look like the tool that built it.
 *
 * Canvas rather than DOM: the lines span the whole viewport, sit behind
 * everything, and must cost nothing while scrolling.
 */

type Line = {
  /** Fixed axis position in viewport space. */
  p: number;
  axis: "x" | "y";
  /** 0 → 1, how far the line has been drawn out from its origin. */
  t: number;
  /** Where the draw starts from, in viewport space along the free axis. */
  from: number;
};

type Fill = { x: number; y: number; w: number; h: number; a: number };

/**
 * Blocks waiting to be projected, plus the canvas's projector once it exists.
 *
 * A durable registry, not a one-shot queue. In StrictMode React re-mounts each
 * component independently, and the observed order is Home cleanup → Home mount →
 * Grid cleanup → Grid mount: every registration lands in the canvas closure that
 * is about to be thrown away, and the surviving one starts empty. A queue drained
 * once at mount does not fix that, because by then it has already been emptied by
 * the closure that died. Keeping the set means any projector, at any point, can
 * ask what exists and draw all of it.
 */
const registered = new Set<HTMLElement>();
let projector: ((el: HTMLElement) => void) | null = null;

function register(el: HTMLElement) {
  registered.add(el);
  projector?.(el);
}

/**
 * Project an element's edges across the sheet, once, when it first arrives.
 *
 * A block ALREADY in view on first paint is projected immediately rather than
 * handed to ScrollTrigger. A trigger whose start point is behind the scroll
 * position never fires, so everything above the fold — which on this page is
 * most of the profile — would never draw a line. The scroll trigger is for
 * blocks the reader has yet to reach; it is not what decides whether a block
 * gets measured at all.
 */
export function useCellWake<T extends HTMLElement>(ref: React.RefObject<T | null>, deps: unknown[] = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (el.getBoundingClientRect().top < innerHeight * 0.88) {
      register(el);
      return;
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => register(el),
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function Grid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(document.documentElement);
    const lineColor = css.getPropertyValue("--grid-line").trim();
    const edgeColor = css.getPropertyValue("--grid-edge").trim();
    const accent = css.getPropertyValue("--color-accent").trim();

    let w = 0;
    let h = 0;
    let dpr = 1;
    const lines: Line[] = [];
    const fills: Fill[] = [];
    /** Elements whose edges are currently projected, kept so lines follow scroll. */
    const sources: { el: HTMLElement; lines: Line[] }[] = [];

    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.min(devicePixelRatio || 1, 2);
      // clientWidth, not innerWidth. innerWidth includes the classic scrollbar,
      // so on any page tall enough to scroll the canvas was ~15px wider than the
      // box CSS lays out in — and every projected line landed off its own block.
      w = document.documentElement.clientWidth;
      h = document.documentElement.clientHeight;
      // A zero-sized viewport is a real state: a tab rendered while hidden, or a
      // restored bfcache page, mounts at 0×0 and never fires `resize` after.
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (const f of fills) {
        if (f.a <= 0.002) continue;
        ctx.globalAlpha = f.a;
        ctx.fillStyle = accent;
        ctx.fillRect(f.x, f.y, f.w, f.h);
      }
      ctx.globalAlpha = 1;

      ctx.lineWidth = 1;

      // Two passes: a line still being drawn is stroked in the stronger colour,
      // and settles to the faint one once it is complete. The sheet therefore
      // shows you which measurement was taken most recently without any line
      // ever animating its colour.
      const stroke = (wet: boolean) => {
        ctx.strokeStyle = wet ? edgeColor : lineColor;
        ctx.beginPath();
        for (const l of lines) {
          if (l.t <= 0 || l.t >= 1 === wet) continue;
          // Half-pixel offset: a 1px line on an integer coordinate straddles two
          // device pixels and renders as a 2px smear.
          const p = Math.round(l.p) + 0.5;
          if (l.axis === "x") {
            const span = Math.max(l.from, h - l.from) * l.t;
            ctx.moveTo(p, Math.max(0, l.from - span));
            ctx.lineTo(p, Math.min(h, l.from + span));
          } else {
            const span = Math.max(l.from, w - l.from) * l.t;
            ctx.moveTo(Math.max(0, l.from - span), p);
            ctx.lineTo(Math.min(w, l.from + span), p);
          }
        }
        ctx.stroke();
      };
      stroke(true);
      stroke(false);
    }

    /** Re-read every projected element's box, so the lines track the scroll. */
    function sync() {
      for (const s of sources) {
        const r = s.el.getBoundingClientRect();
        const [top, right, bottom, left] = s.lines;
        left.p = r.left;
        right.p = r.right;
        top.p = r.top;
        bottom.p = r.bottom;
        left.from = right.from = r.top + r.height / 2;
        top.from = bottom.from = r.left + r.width / 2;
      }
      draw();
    }

    function project(el: HTMLElement) {
      if (sources.some((s) => s.el === el)) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      // Four lines per block: two horizontals from its top and bottom edges,
      // two verticals from its left and right. Order is fixed so sync() can
      // address them without searching.
      // t starts at 1 — fully drawn. The tween below reverses that and plays it
      // back in. If the tween never runs (reduced motion, a tab whose rAF is
      // throttled to a stop, GSAP failing to load) the lines are simply already
      // there. An animation may decide how something appears; it may never be
      // the thing that decides whether it appears at all.
      const set: Line[] = [
        { p: r.top, axis: "y", t: 1, from: cx },
        { p: r.right, axis: "x", t: 1, from: cy },
        { p: r.bottom, axis: "y", t: 1, from: cx },
        { p: r.left, axis: "x", t: 1, from: cy },
      ];
      lines.push(...set);
      sources.push({ el, lines: set });

      if (reduced) {
        draw();
        return;
      }

      // The lines draw outward from the block's centre, one pair after the
      // other, which is the order a person draws them in.
      set.forEach((l, i) => {
        gsap.fromTo(
          l,
          { t: 0 },
          {
            t: 1,
            duration: 0.75,
            delay: i * 0.06,
            ease: "power2.out",
            // Without this the from-state is written the moment the tween is
            // created, which puts the line back to invisible before the ticker
            // has had a chance to run it.
            immediateRender: false,
            onUpdate: draw,
            onComplete: () => {
              l.t = 1;
              draw();
            },
          },
        );
      });

      // The block's own cell fills briefly, then lets go — enough to say which
      // rectangle just joined the drawing, not enough to become a highlight.
      const f: Fill = { x: r.left, y: r.top, w: r.width, h: r.height, a: 0 };
      fills.push(f);
      gsap.to(f, {
        a: 0.05,
        duration: 0.3,
        ease: "none",
        onUpdate: draw,
        onComplete: () =>
          gsap.to(f, {
            a: 0,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: draw,
            onComplete: () => {
              const k = fills.indexOf(f);
              if (k > -1) fills.splice(k, 1);
            },
          }),
      });
    }

    projector = project;
    // Draw everything registered so far, whichever closure took the call. Nodes
    // torn out of the document in the meantime are dropped rather than measured.
    for (const el of registered) {
      if (el.isConnected) project(el);
      else registered.delete(el);
    }
    resize();

    // ResizeObserver plus the window event. The observer catches an element
    // gaining its first real size (which `resize` never reports); the event
    // catches viewport changes the observer has been seen to miss.
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    addEventListener("resize", resize);

    // The projections are in viewport space, so they have to be re-read as the
    // page moves. rAF-throttled: one read per frame, never one per scroll event.
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        sync();
      });
    };
    addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      removeEventListener("resize", resize);
      removeEventListener("scroll", onScroll);
      projector = null;
      gsap.killTweensOf(lines);
      gsap.killTweensOf(fills);
    };
  }, []);

  return <canvas ref={ref} className="sheet" aria-hidden="true" />;
}
