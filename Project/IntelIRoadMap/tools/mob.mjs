import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:5182/#/notes", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => ({
  sw: document.documentElement.scrollWidth,
  cw: document.documentElement.clientWidth,
  figScrolls: [...document.querySelectorAll(".plate-scroll")].map(e => e.scrollWidth > e.clientWidth),
}));
console.log(`375px → scrollWidth ${r.sw} / clientWidth ${r.cw} ${r.sw > r.cw ? "PAGE OVERFLOW" : "ok"}`);
console.log("figures scroll inside their own box:", r.figScrolls.every(Boolean) ? "all 6 yes (expected)" : r.figScrolls);
await p.evaluate(() => document.querySelectorAll(".plate")[0].scrollIntoView());
await p.waitForTimeout(800);
await p.screenshot({ path: out + "/notes-mobile.png" });
await b.close();
