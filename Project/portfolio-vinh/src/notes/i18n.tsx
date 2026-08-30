import { createContext, useContext } from "react";
import type { Lang } from "../content";

/**
 * Two languages on the notes side.
 *
 * This reverses an earlier decision recorded in design.md — that the theory
 * pages would be Vietnamese-only because they were study material for one
 * reader. The reason it was wrong: the books these pages are drawn from are in
 * English, interviews for these jobs are often in English, and a reader who
 * learns `khoá kiểm tra hai lần` and then meets *double-checked locking* on a
 * whiteboard has learned the mechanism and lost the name for it.
 *
 * So: every page renders in both, and the English technical term survives inside
 * the Vietnamese prose rather than being translated away.
 *
 * ## Why a context and not a prop
 *
 * `lang` is already a prop on every page — that stays, and page bodies use it
 * directly. The context exists for the shared marks in `parts.tsx`: `Limit`
 * carries a label, `Trap` carries a default title, and threading `lang` through
 * every one of the ~90 places those appear would be noise at every call site
 * for a value that never differs within a page.
 *
 * A context is not the hidden coupling that reading `document.documentElement`
 * would be: the provider is explicit, a test can set it, and the default is a
 * real language rather than a crash.
 */

/** One string, both languages. The unit everything else is built from. */
export type Tx = { vi: string; en: string };

const LangCtx = createContext<Lang>("vi");

export const LangProvider = LangCtx.Provider;

export function useLang(): Lang {
  return useContext(LangCtx);
}

/**
 * Resolve a pair.
 *
 * Curried on purpose: a page body picks the language once and then reads dozens
 * of pairs, so `const s = say(lang)` then `s(T.heading)` keeps the call sites
 * short enough to sit inside an SVG label without wrapping.
 */
export function say(lang: Lang) {
  return (p: Tx): string => p[lang];
}

/** Prose that carries markup, so it cannot be a `Tx`. */
export function Tr({ vi, en }: { vi: React.ReactNode; en: React.ReactNode }) {
  return <>{useLang() === "vi" ? vi : en}</>;
}

/**
 * Where an example came from.
 *
 * Every worked example on a theory page is either lifted from one of the books
 * — with the chapter and page, so the reader can open it beside this sheet —
 * or it is written here, and says so. The second case is not a lesser one: two
 * of these books predate lambdas, streams and records entirely, and pretending
 * otherwise would be the kind of borrowed authority this notebook exists to
 * avoid.
 */
export function Src({ vi, en }: { vi: string; en: string }) {
  return (
    <p className="nsrc">
      <Tr vi={vi} en={en} />
    </p>
  );
}
