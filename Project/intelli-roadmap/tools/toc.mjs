import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:5182/#/notes", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.screenshot({ path: out + "/toc.png", clip: { x: 0, y: 0, width: 1280, height: 1100 } });
console.log("ok");
await b.close();
