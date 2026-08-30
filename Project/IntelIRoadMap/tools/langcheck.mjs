import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto("http://localhost:5182/#/notes/javacore", { waitUntil: "networkidle" });
await p.waitForTimeout(800);

const read = async () => p.evaluate(() => ({
  lede: document.querySelector(".topic-lede")?.textContent?.slice(0, 60),
  sec1: document.querySelector(".nsec-h")?.textContent?.slice(0, 40),
  limit: document.querySelector(".plate-limitlabel")?.textContent,
  trap: document.querySelector(".ntrap-l")?.textContent,
  toc: document.querySelector(".toc-name")?.textContent,
  step: document.querySelector(".walk-step-l")?.textContent,
  src: document.querySelector(".nsrc")?.textContent?.slice(0, 50),
  next: document.querySelector('.walk-btns button:last-child')?.getAttribute("aria-label"),
}));

console.log("VI:", JSON.stringify(await read(), null, 1));
const en = await p.$('.lang-btn:not([aria-pressed="true"])');
await en.click();
await p.waitForTimeout(900);
console.log("EN:", JSON.stringify(await read(), null, 1));
await b.close();
