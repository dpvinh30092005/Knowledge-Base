import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const bad = [];
p.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await p.goto("http://localhost:5182/#/notes/system", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
console.log(bad.length ? bad.join("\n") : "no failed requests");
await b.close();
