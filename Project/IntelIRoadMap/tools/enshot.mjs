import { chromium } from "playwright";
const [topic, wi, step, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
await p.goto(`http://localhost:5182/#/notes/${topic}`, { waitUntil: "networkidle" });
await p.waitForTimeout(700);
const en = await p.$('.lang-btn:not([aria-pressed="true"])');
await en.click();
await p.waitForTimeout(900);
const w = (await p.$$(".walk"))[Number(wi)];
const next = await w.$('button[aria-label="Next step"]');
for (let k = 0; k < Number(step); k++) { await next.click(); await p.waitForTimeout(300); }
await p.waitForTimeout(400);
await w.screenshot({ path: out });
console.log("wrote", out);
await b.close();
