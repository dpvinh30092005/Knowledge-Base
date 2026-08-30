import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:5182/#/notes", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "EN" }).click();
await p.waitForTimeout(1200);
const bad = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll(".plate-scroll svg").forEach((svg, i) => {
    const vb = svg.viewBox.baseVal;
    svg.querySelectorAll("text").forEach(t => {
      const bb = t.getBBox();
      if (bb.x + bb.width > vb.width - 2 || bb.x < -1) out.push(`svg#${i+1} "${t.textContent.slice(0,34)}" ends at ${Math.round(bb.x+bb.width)} of ${vb.width}`);
    });
  });
  return out;
});
console.log(bad.length ? "CLIPPED (EN):\n  " + bad.join("\n  ") : "no clipped labels in EN");
await b.close();
