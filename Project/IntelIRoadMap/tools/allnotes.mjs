import { chromium } from "playwright";
const TOPICS = process.argv[3].split(",");
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
let fail = 0;

for (const t of TOPICS) {
  const errs = [];
  p.removeAllListeners("pageerror"); p.removeAllListeners("console");
  p.on("pageerror", e => errs.push(String(e)));
  p.on("console", m => m.type() === "error" && errs.push(m.text()));

  await p.goto(`http://localhost:5182/#/notes/${t}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);

  const r = await p.evaluate(() => {
    const clipped = [];
    document.querySelectorAll(".walk svg, .plate-scroll svg").forEach((svg, i) => {
      const vb = svg.viewBox.baseVal;
      svg.querySelectorAll("text").forEach(tx => {
        const bb = tx.getBBox();
        if (bb.x + bb.width > vb.width - 2 || bb.x < -1 || bb.y > vb.height)
          clipped.push(`svg#${i+1} "${tx.textContent.slice(0,26)}" ${Math.round(bb.x+bb.width)}/${vb.width}`);
      });
    });
    return {
      clipped,
      walks: document.querySelectorAll(".walk").length,
      figs: document.querySelectorAll(".plate-fig").length,
      secs: document.querySelectorAll(".nsec, .plate").length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  // drive every walkthrough to its last step, checking the drawing changes
  const walks = await p.$$(".walk");
  let stuck = 0;
  for (const w of walks) {
    const read = () => w.evaluate(el => [...el.querySelectorAll("svg text")].map(t => t.textContent).join("|"));
    const a = await read();
    const next = await w.$('button[aria-label="Bước sau"]');
    for (let k = 0; k < 8; k++) { if (await next.isDisabled()) break; await next.click(); await p.waitForTimeout(160); }
    if (await read() === a) stuck++;
  }

  const bad = r.clipped.length || errs.length || stuck || r.overflow;
  if (bad) fail++;
  console.log(
    `${bad ? "✗" : "✓"} ${t.padEnd(9)} ${r.secs} mục · ${r.walks} hình chạy · ${r.figs} hình tĩnh` +
    (r.clipped.length ? `\n     CẮT: ${r.clipped.join("; ")}` : "") +
    (stuck ? `\n     ${stuck} hình chạy KHÔNG đổi khung` : "") +
    (r.overflow ? `\n     TRÀN NGANG` : "") +
    (errs.length ? `\n     LỖI: ${errs.slice(0,2).join(" | ")}` : "")
  );
}
console.log(fail ? `\n${fail} trang có vấn đề` : "\ntất cả trang sạch");
await b.close();
