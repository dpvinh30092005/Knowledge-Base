import { useCallback, useState } from "react";
import type { Lang } from "../../content";
import { say, type Tx } from "../i18n";
import { Lab, LabBar, LabBtn, LabSwitch } from "../Lab";
import { Glyph } from "../parts";

/**
 * A scheduler for Schildt's `Synch` program, ch.11 pp.239–240.
 *
 * The book prints one interleaving. This runs the same three threads and lets
 * the reader pick who goes next, so the mangled output is *produced* rather than
 * quoted — and so the reader can find, by trying, that there is no way to hold
 * it right. `Lịch của sách` replays the exact schedule that produces the output
 * on page 240, which is what keeps the simulation honest: if that button ever
 * stops matching the printed page, the machine is wrong, not the book.
 *
 * The lesson the static figure could not carry is the last line of the tally.
 * Turning `synchronized` on does not make the schedule deterministic — the three
 * threads still finish in any order, and the reader can watch that happen. What
 * it removes is interleaving *inside* the method, so every one of the two
 * thousand random schedules comes out well-formed. That distinction is asked
 * about in interviews and is invisible in a drawing of a single run.
 */

/* ---- the machine --------------------------------------------------------- */

/** Schildt's three Callers, verbatim from p.239. */
const MSG = ["Hello", "Synchronized", "World"] as const;

/** Legend roles, one per thread. Same four colours as every figure on the side. */
const C = ["info", "warn", "ok"] as const;

type Emit = { t: number; s: string };
type M = { pc: number[]; lock: number | null; out: Emit[] };

const start = (): M => ({ pc: [0, 0, 0], lock: null, out: [] });

/**
 * Can thread `t` take its next instruction?
 *
 * The only reason it cannot is the monitor: with `synchronized` on, a thread
 * that has not entered yet is held at the door while another holds the lock.
 * Note what is *not* here — nothing stops a thread once it is inside, which is
 * why `sleep` mid-method is safe under the lock and catastrophic without it.
 */
function runnable(m: M, sync: boolean, t: number): boolean {
  if (m.pc[t] > 2) return false;
  return !(sync && m.pc[t] === 0 && m.lock !== null);
}

function step(m: M, sync: boolean, t: number): M {
  const pc = m.pc[t];
  const next: M = { pc: [...m.pc], lock: m.lock, out: m.out };
  if (pc === 0) {
    if (sync) next.lock = t;
    next.out = [...m.out, { t, s: `[${MSG[t]}` }];
    next.pc[t] = 1;
  } else if (pc === 1) {
    next.pc[t] = 2; // Thread.sleep(1000) — the yield, and it prints nothing
  } else {
    next.out = [...m.out, { t, s: "]\n" }];
    if (sync) next.lock = null;
    next.pc[t] = 3;
  }
  return next;
}

/** A line is mangled when a second `[` opens before the first one closed. */
function mangled(out: Emit[]): boolean {
  let open = false;
  for (const e of out) {
    if (e.s.startsWith("[")) {
      if (open) return true;
      open = true;
    } else open = false;
  }
  return false;
}

const ready = (m: M, sync: boolean) => [0, 1, 2].filter((t) => runnable(m, sync, t));

/** Play `runs` schedules to the end and count how many came out broken. */
function tally(sync: boolean, runs: number): number {
  let bad = 0;
  for (let i = 0; i < runs; i++) {
    let m = start();
    for (;;) {
      const r = ready(m, sync);
      if (!r.length) break;
      m = step(m, sync, r[(Math.random() * r.length) | 0]);
    }
    if (mangled(m.out)) bad++;
  }
  return bad;
}

/**
 * The schedule that prints what page 240 prints.
 *
 * All three enter and print their opening bracket, then each wakes and closes
 * in turn — `[Hello[Synchronized[World]` and two stray brackets after it.
 */
const BOOK = [0, 1, 2, 0, 0, 1, 1, 2, 2];

const RUNS = 2000;

/* ---- the sheet ----------------------------------------------------------- */

const T = {
  title: { vi: "Tự xếp lịch cho ba luồng", en: "Schedule the three threads yourself" },
  aria: {
    vi: "Máy chạy thật: ba luồng gọi một method, người đọc chọn luồng nào chạy tiếp",
    en: "A live machine: three threads calling one method, the reader picks which runs next",
  },
  pick: { vi: "Bấm một luồng để cho nó chạy một lệnh.", en: "Click a thread to run one instruction of it." },
  sync: { vi: "thêm synchronized", en: "add synchronized" },
  rand: { vi: "ngẫu nhiên", en: "random" },
  all: { vi: "chạy hết", en: "run to the end" },
  book: { vi: "lịch của sách", en: "the book's schedule" },
  reset: { vi: "đặt lại", en: "reset" },
  test: { vi: `thử ${RUNS.toLocaleString("vi")} lịch ngẫu nhiên`, en: `try ${RUNS.toLocaleString("en")} random schedules` },

  out: { vi: "MÀN HÌNH IN RA", en: "WHAT IS PRINTED" },
  idle: { vi: "chưa luồng nào chạy", en: "no thread has run yet" },
  holds: { vi: "đang giữ monitor", en: "holds the monitor" },

  stReady: { vi: "sẵn sàng", en: "ready" },
  stOpen: { vi: "đang giữ một dòng dở", en: "holding a half-printed line" },
  stBlocked: { vi: "bị chặn ở cửa monitor", en: "blocked at the monitor" },
  stDone: { vi: "xong", en: "done" },

  vBroken: { vi: "Hỏng — một dòng mở ra trước khi dòng trước đóng lại.", en: "Broken — a line opened before the previous one closed." },
  vOk: { vi: "Đủ cặp ngoặc. Lần này thôi.", en: "Well-formed. This time." },
  vOkSync: { vi: "Đủ cặp ngoặc — và không lịch nào làm khác được.", en: "Well-formed — and no schedule can make it otherwise." },
  vRun: { vi: "Còn lệnh chưa chạy.", en: "Instructions still pending." },

  tallyOff: {
    vi: `${RUNS.toLocaleString("vi")} lịch ngẫu nhiên, không có synchronized`,
    en: `${RUNS.toLocaleString("en")} random schedules, without synchronized`,
  },
  tallyOn: {
    vi: `${RUNS.toLocaleString("vi")} lịch ngẫu nhiên, có synchronized`,
    en: `${RUNS.toLocaleString("en")} random schedules, with synchronized`,
  },
  broke: { vi: "lần hỏng", en: "came out broken" },

  cap: {
    vi: "Cùng chương trình Schildt in ở trang 239. Bấm “lịch của sách” để dựng lại đúng kết quả trang 240 — rồi tự xếp lịch khác và xem nó hỏng theo kiểu mới.",
    en: "The same program Schildt prints on p.239. Press “the book's schedule” to rebuild exactly the output on p.240 — then pick a different order and watch it break a new way.",
  },
} satisfies Record<string, Tx>;

/** The three instructions of `Callme.call`. Java in both languages; it is code. */
const INSTR = ['print("[" + msg)', "Thread.sleep(1000)", 'println("]")'];

export default function Race({ lang }: { lang: Lang }) {
  const s = say(lang);
  const [sync, setSync] = useState(false);
  const [m, setM] = useState(start);
  const [bad, setBad] = useState<number | null>(null);

  const r = ready(m, sync);
  const done = r.length === 0;

  const reset = useCallback((next?: boolean) => {
    setM(start());
    setBad(null);
    if (next !== undefined) setSync(next);
  }, []);

  const runOne = (t: number) => setM((cur) => (runnable(cur, sync, t) ? step(cur, sync, t) : cur));

  const runRandom = () =>
    setM((cur) => {
      const k = ready(cur, sync);
      return k.length ? step(cur, sync, k[(Math.random() * k.length) | 0]) : cur;
    });

  const runAll = () =>
    setM((cur) => {
      let x = cur;
      for (;;) {
        const k = ready(x, sync);
        if (!k.length) return x;
        x = step(x, sync, k[(Math.random() * k.length) | 0]);
      }
    });

  /* The book's schedule only exists for the unsynchronised program — under the
     lock the monitor refuses that order, and silently playing a different one
     would be a lie about what the button does. */
  const runBook = () => {
    setSync(false);
    setBad(null);
    let x = start();
    for (const t of BOOK) x = step(x, false, t);
    setM(x);
  };

  const state = (t: number) => {
    if (m.pc[t] > 2) return { k: "done", l: s(T.stDone) };
    if (sync && m.pc[t] === 0 && m.lock !== null) return { k: "blocked", l: s(T.stBlocked) };
    if (m.pc[t] > 0) return { k: "open", l: s(T.stOpen) };
    return { k: "ready", l: s(T.stReady) };
  };

  const verdict = !done
    ? { c: "mute" as const, t: s(T.vRun) }
    : mangled(m.out)
      ? { c: "bad" as const, t: s(T.vBroken) }
      : { c: "ok" as const, t: sync ? s(T.vOkSync) : s(T.vOk) };

  return (
    <Lab title={s(T.title)} aria={s(T.aria)} caption={s(T.cap)}>
      <p className="lab-hint">{s(T.pick)}</p>

      <div className="lab-split">
        <ol className="lab-lanes">
          {MSG.map((msg, t) => {
            const st = state(t);
            return (
              <li key={msg} className="lab-lane" data-c={st.k === "done" ? "mute" : C[t]} data-st={st.k}>
                <button
                  type="button"
                  className="lab-lane-b"
                  onClick={() => runOne(t)}
                  disabled={!runnable(m, sync, t)}
                  aria-label={`${msg} — ${st.l}`}
                >
                  <span className="lab-lane-n">t{t + 1}</span>
                  <span className="lab-lane-m">{msg}</span>
                  {m.lock === t && (
                    <span className="lab-lane-lock" title={s(T.holds)}>
                      <Glyph n="lock" s={13} />
                    </span>
                  )}
                  <span className="lab-lane-s">{st.l}</span>
                </button>
                <ol className="lab-pc">
                  {INSTR.map((ins, k) => (
                    <li key={ins} aria-current={m.pc[t] === k ? "step" : undefined} data-past={m.pc[t] > k || undefined}>
                      {ins}
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>

        <div className="lab-con">
          <span className="lab-con-l">{s(T.out)}</span>
          <pre className="lab-out" aria-live="polite">
            {m.out.length === 0 ? (
              <span className="lab-out-idle">{s(T.idle)}</span>
            ) : (
              m.out.map((e, k) => (
                <span key={k} className="lab-out-c" data-c={C[e.t]}>
                  {e.s}
                </span>
              ))
            )}
          </pre>
        </div>
      </div>

      <p className="lab-verdict" data-c={verdict.c}>
        {verdict.t}
      </p>

      <LabBar>
        <LabSwitch on={sync} onChange={(v) => reset(v)}>
          {s(T.sync)}
        </LabSwitch>
        <LabBtn onClick={runRandom} disabled={done} primary>
          {s(T.rand)}
        </LabBtn>
        <LabBtn onClick={runAll} disabled={done}>
          {s(T.all)}
        </LabBtn>
        <LabBtn onClick={runBook}>{s(T.book)}</LabBtn>
        <LabBtn onClick={() => reset()}>{s(T.reset)}</LabBtn>
        <LabBtn onClick={() => setBad(tally(sync, RUNS))}>{s(T.test)}</LabBtn>
      </LabBar>

      {bad !== null && (
        <p className="lab-tally" data-c={bad > 0 ? "bad" : "ok"}>
          {sync ? s(T.tallyOn) : s(T.tallyOff)} — <strong>{bad.toLocaleString(lang)}</strong> {s(T.broke)}
        </p>
      )}
    </Lab>
  );
}
