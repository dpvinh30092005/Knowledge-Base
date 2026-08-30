/**
 * Read every notes page in English and report what is still Vietnamese.
 *
 * The Vietnamese-only harness (allnotes.mjs) cannot catch a missed translation:
 * a page that never switched still renders, still animates, still passes. This
 * one reads the rendered text of the English view and looks for the diacritics
 * that only Vietnamese uses, which is a test the page cannot pass by accident.
 *
 * Proper nouns are allowed through — a name is the same name in both languages.
 *
 *   node tools/encheck.mjs system,jvm,javacore,…
 */
import { chromium } from "playwright";

const TOPICS = process.argv[2].split(",");
const ALLOW = [/Phước Vinh/, /Đặng/, /IntelliPath/];

const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
let fail = 0;

for (const t of TOPICS) {
  const errs = [];
  p.removeAllListeners("pageerror");
  p.removeAllListeners("console");
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));

  await p.goto(`http://localhost:5182/#/notes/${t}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);

  // switch to English once; the choice persists across pages
  const en = await p.$('button:text-is("EN")');
  if (en) await en.click();
  await p.waitForTimeout(900);

  const r = await p.evaluate(() => {
    const bits = [];
    document.querySelectorAll(".topic p, .topic li, .topic td, .topic th, .topic h2, .topic svg text, .topic .walk-note").forEach((el) => {
      if (el.querySelector("p, li, td, h2")) return; // containers only report leaves
      const s = el.textContent.trim();
      if (s) bits.push(s);
    });
    const clipped = [];
    document.querySelectorAll(".walk svg, .plate-scroll svg").forEach((svg, i) => {
      const vb = svg.viewBox.baseVal;
      svg.querySelectorAll("text").forEach((tx) => {
        const bb = tx.getBBox();
        if (bb.x + bb.width > vb.width - 2 || bb.x < -1 || bb.y > vb.height)
          clipped.push(`svg#${i + 1} "${tx.textContent.slice(0, 26)}" ${Math.round(bb.x + bb.width)}/${vb.width}`);
      });
    });
    return { bits, clipped, lang: document.documentElement.lang };
  });

  const vn = r.bits.filter((s) => VN.test(s) && !ALLOW.some((a) => a.test(s)));
  const bad = vn.length || errs.length || r.clipped.length;
  if (bad) fail++;
  console.log(
    `${bad ? "✗" : "✓"} ${t.padEnd(11)} ${r.bits.length} khối chữ` +
      (vn.length ? `\n     CÒN TIẾNG VIỆT (${vn.length}): ${vn.slice(0, 3).map((s) => JSON.stringify(s.slice(0, 60))).join("; ")}` : "") +
      (r.clipped.length ? `\n     CẮT: ${r.clipped.join("; ")}` : "") +
      (errs.length ? `\n     LỖI: ${errs.slice(0, 2).join(" | ")}` : ""),
  );
}
console.log(fail ? `\n${fail} trang còn sót` : "\nbản tiếng Anh sạch");
await b.close();
