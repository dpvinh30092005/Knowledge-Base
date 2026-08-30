import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
p.on("console", m => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", e => errs.push(String(e)));
await p.goto("http://localhost:5182/#/notes", { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
await p.screenshot({ path: out + "/notes-top.png", clip: { x: 0, y: 0, width: 1280, height: 1000 } });
const h = await p.evaluate(() => document.body.scrollHeight);
await p.evaluate(() => scrollTo(0, 1400));
await p.waitForTimeout(1200);
await p.screenshot({ path: out + "/notes-p2.png", clip: { x: 0, y: 0, width: 1280, height: 1000 } });
// horizontal overflow check at three widths
const over = [];
for (const w of [1280, 768, 375]) {
  await p.setViewportSize({ width: w, height: 900 });
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  over.push(`${w}px → scrollWidth ${r.sw} / clientWidth ${r.cw} ${r.sw > r.cw ? "OVERFLOW" : "ok"}`);
}
console.log("page height:", h);
console.log(over.join("\n"));
console.log("console errors:", errs.length ? errs.slice(0,5).join(" | ") : "none");
await b.close();
