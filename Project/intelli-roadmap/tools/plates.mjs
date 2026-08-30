import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
p.on("pageerror", e => errs.push(String(e)));
await p.goto("http://localhost:5182/#/notes", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);

// Any <text> whose painted box escapes its own svg viewBox is a clipped label.
const bad = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll(".plate-scroll svg").forEach((svg, i) => {
    const vb = svg.viewBox.baseVal;
    svg.querySelectorAll("text").forEach(t => {
      const bb = t.getBBox();
      if (bb.x + bb.width > vb.width - 2 || bb.x < -1 || bb.y + bb.height > vb.height + 1) {
        out.push(`svg#${i + 1} "${t.textContent.slice(0, 34)}" ends at ${Math.round(bb.x + bb.width)} of ${vb.width}`);
      }
    });
  });
  return out;
});
console.log(bad.length ? "CLIPPED LABELS:\n  " + bad.join("\n  ") : "no clipped labels");

const plates = await p.$$(".plate");
for (let i = 0; i < plates.length; i++) {
  await plates[i].scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  await plates[i].screenshot({ path: `${out}/plate-${i + 1}.png` });
}
console.log("plates captured:", plates.length);
console.log("page errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
