import { useEffect, useState } from "react";

/**
 * Three sides, one bundle.
 *
 * Hash routing rather than the History API, and no router dependency. The
 * reason is deployment: a History-API route 404s on GitHub Pages, Netlify drop
 * folders, and any static host without a rewrite rule, because the server is
 * asked for a file at /project that was never built. A hash never leaves the
 * server's view of the URL, so `index.html` answers every side. For a portfolio
 * someone will host wherever is free, that matters more than a clean path.
 */
export const SIDES = ["home", "project", "notes"] as const;
export type Side = (typeof SIDES)[number];

/**
 * The notes side carries a second segment: `#/notes/dsa`.
 *
 * It is a segment rather than a query parameter because a topic is a place, not
 * a filter — it has its own heading, its own figures, and it is the thing you
 * would send someone a link to. A query string would say the opposite.
 *
 * Still no hidden routes. An unknown topic falls back to the first one instead
 * of rendering an empty side, so a stale bookmark lands somewhere real.
 */
export type Route = { side: Side; topic: string | null };

function read(): Route {
  const parts = location.hash
    .replace(/^#\/?/, "")
    .split("?")[0]
    .split("/")
    .filter(Boolean);

  const side = (SIDES as readonly string[]).includes(parts[0]) ? (parts[0] as Side) : "home";
  return { side, topic: parts[1] ?? null };
}

export function useRoute(): [Route, (side: Side, topic?: string) => void] {
  const [route, setRoute] = useState<Route>(read);

  useEffect(() => {
    const on = () => setRoute(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  // Each side is its own document as far as the reader is concerned, so it
  // starts at the top. Without this you arrive at a topic already halfway down
  // it, because the browser kept the scroll offset from the side before.
  //
  // Keyed on side AND topic: switching topic inside the notes side is the same
  // kind of move as switching side, and leaving the reader mid-page in new
  // content is the bug this exists to prevent.
  useEffect(() => {
    scrollTo({ top: 0, behavior: "auto" });
  }, [route.side, route.topic]);

  const go = (side: Side, topic?: string) => {
    if (side === "home") {
      location.hash = "/";
      return;
    }
    location.hash = topic ? `/${side}/${topic}` : `/${side}`;
  };

  return [route, go];
}
