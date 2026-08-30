import { useEffect, useState } from "react";
import Grid from "./Grid";
import Home from "./pages/Home";
import Project from "./pages/Project";
import Notes from "./pages/Notes";
import { COPY, LINKS, PORTRAIT, SIDE_REF, type Lang } from "./content";
import { SIDES, useRoute } from "./router";
import "./styles.css";

export default function App() {
  const [lang, setLang] = useState<Lang>("vi");
  const [{ side, topic }, go] = useRoute();
  const t = COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const label = side === "home" ? null : t.sideName[side];
    document.title = label ? `${label} · ${t.home.name}` : `${t.home.name} — ${t.home.role}`;
  }, [side, lang, t]);

  return (
    <div className="page" data-side={side}>
      <Grid />

      <a className="skip" href="#main">
        {t.hud.skip}
      </a>

      {/* N3 side-rail. The three sides are addressed like sheet references —
          01 / 02 / 03 — because the page is a drawing set, not a document with
          chapters. It lies down into a bottom bar under 768px. */}
      <nav className="rail" aria-label={t.hud.sides}>
        <button type="button" className="rail-id" onClick={() => go("home")} title={t.home.name}>
          <img src={PORTRAIT} alt="" width={24} height={24} />
        </button>

        <div className="rail-sides">
          {SIDES.map((s) => (
            <button
              key={s}
              type="button"
              className="rail-side"
              aria-current={side === s ? "page" : undefined}
              onClick={() => go(s)}
            >
              <span className="rail-ref" aria-hidden="true">
                {SIDE_REF[s]}
              </span>
              <span className="rail-name">{t.sideName[s]}</span>
            </button>
          ))}
        </div>

        <div className="rail-lang" role="group" aria-label={t.hud.lang}>
          {(["vi", "en"] as Lang[]).map((code) => (
            <button
              key={code}
              type="button"
              className="lang-btn"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {side === "home" && <Home lang={lang} go={go} />}
        {side === "project" && <Project lang={lang} />}
        {side === "notes" && <Notes lang={lang} topic={topic} go={go} />}
      </main>

      {/* Ft5 statement. One line, and it is the only thing on this page that is
          asking for something. */}
      <footer className="foot">
        <p className="foot-statement">{t.home.open}</p>
        <a className="btn" href={`mailto:${LINKS.email}`}>
          {t.home.cta}
        </a>
        <p className="colophon">
          {t.colophon} © {new Date().getFullYear()} {t.home.name}.
        </p>
      </footer>
    </div>
  );
}
