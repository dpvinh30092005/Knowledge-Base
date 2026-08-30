import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
let bad = 0;
for (const t of ["javacore", "servlet", "concurrency", "database"]) {
  await p.goto(`http://localhost:5182/#/notes/${t}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({
    over: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    w: document.documentElement.scrollWidth,
    keys: document.querySelectorAll(".d-key").length,
    ics: document.querySelectorAll(".d-ic").length,
  }));
  if (r.over) bad++;
  console.log(`${r.over ? "✗" : "✓"} ${t.padEnd(12)} rộng ${r.w}px · ${r.keys} bảng chú giải · ${r.ics} nét icon`);
}
console.log(bad ? `${bad} trang tràn ngang` : "375px: không trang nào tràn ngang");
await b.close();
