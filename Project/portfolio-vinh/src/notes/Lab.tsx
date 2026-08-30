import { useLang } from "./i18n";

/**
 * lab — the fifth primitive, and the first one the reader can break.
 *
 * ## Why this exists when `Walkthrough` already does
 *
 * A walkthrough is a slideshow. Six frames were drawn by hand, the reader
 * advances through them, and every reader sees the same six. That is the right
 * shape for a mechanism with one true sequence — a request entering the
 * `DispatcherServlet` goes through those stages in that order, and letting the
 * reader reorder them would teach a lie.
 *
 * It is the *wrong* shape for a mechanism whose whole lesson is that the order
 * is not fixed. A drawing of one interleaving of three threads says "this can
 * happen". The reader nods and learns nothing, because the thing worth knowing
 * is that a hundred other interleavings can happen too and you do not get to
 * choose. No sequence of frames can carry that, however many frames you draw.
 *
 * So a lab is a small machine with real state, and the reader supplies the
 * input. The picture is computed from that state rather than drawn ahead of it,
 * which means the reader can reach a screen the author never saw — and that is
 * the point, not a defect.
 *
 * ## What a lab must not become
 *
 * Not a playground. Every control has to correspond to something a reader would
 * be asked about in an interview; a slider that only makes the drawing prettier
 * is decoration wearing an interaction. And a lab always keeps a button that
 * reproduces the exact output printed in the book it cites, so the simulation
 * can be checked against something that is not itself.
 */

/** The shell: a title, the machine, the claim. The machine supplies its own controls. */
export function Lab({
  tag,
  title,
  aria,
  caption,
  children,
}: {
  tag?: string;
  title: string;
  aria: string;
  caption: React.ReactNode;
  children: React.ReactNode;
}) {
  const lang = useLang();
  return (
    <figure className="lab" role="group" aria-label={aria}>
      <div className="lab-head">
        <span className="lab-tag">{tag ?? (lang === "vi" ? "máy chạy thật" : "live machine")}</span>
        <h3 className="lab-title">{title}</h3>
      </div>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** The row of controls. Wraps on a narrow screen rather than scrolling. */
export function LabBar({ children }: { children: React.ReactNode }) {
  return <div className="lab-bar">{children}</div>;
}

export function LabBtn({
  onClick,
  disabled,
  primary,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={primary ? "lab-btn lab-btn-a" : "lab-btn"} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/**
 * A real checkbox, not a styled div.
 *
 * The one control on this page that changes the *program* rather than the
 * schedule, so it reads as a switch and sits apart from the step buttons.
 */
export function LabSwitch({
  on,
  onChange,
  children,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="lab-sw">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
