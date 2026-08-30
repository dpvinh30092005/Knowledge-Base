import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
p.on("pageerror", e => errs.push(String(e)));
p.on("console", m => m.type() === "error" && errs.push(m.text()));

await p.goto("http://localhost:5182/#/notes/dsa", { waitUntil: "networkidle" });
await p.waitForTimeout(1800);

const walks = await p.$$(".walk");
console.log("walkthroughs on page:", walks.length);

// Drive the two-pointer walkthrough forward and confirm the drawing changes.
const w = walks[0];
const readCells = () => w.evaluate(el => [...el.querySelectorAll("svg text")].map(t => t.textContent).join(","));
const before = await readCells();
const next = await w.$('button[aria-label="Bước sau"]');
for (let i = 0; i < 4; i++) { await next.click(); await p.waitForTimeout(450); }
const after = await readCells();
console.log("frame actually changed on step:", before !== after ? "yes" : "NO — walkthrough is static");

// Autoplay
await w.$eval('.walk-play', b => b.click());
await p.waitForTimeout(2600);
const played = await readCells();
console.log("autoplay advanced:", played !== after ? "yes" : "NO");

const clipped = await p.evaluate(() => {
  const bad = [];
  document.querySelectorAll(".walk svg, .plate-scroll svg").forEach((svg, i) => {
    const vb = svg.viewBox.baseVal;
    svg.querySelectorAll("text").forEach(t => {
      const bb = t.getBBox();
      if (bb.x + bb.width > vb.width - 2 || bb.x < -1) bad.push(`svg#${i+1} "${t.textContent.slice(0,30)}" → ${Math.round(bb.x+bb.width)}/${vb.width}`);
    });
  });
  return bad;
});
console.log(clipped.length ? "CLIPPED:\n  " + clipped.join("\n  ") : "no clipped labels");
console.log("errors:", errs.length ? errs.slice(0,3).join(" | ") : "none");

await p.evaluate(() => document.querySelectorAll(".walk")[0].scrollIntoView({ block: "center" }));
await p.waitForTimeout(600);
await p.screenshot({ path: out + "/dsa-walk.png" });
await b.close();
