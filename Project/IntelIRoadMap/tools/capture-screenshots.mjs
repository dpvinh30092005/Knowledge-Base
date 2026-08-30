/**
 * Screenshot capture for IntelliPath — logs in, walks the app, writes PNGs.
 *
 * The credentials are read from the environment and are never written to disk,
 * never printed, and never committed. Run it like this (PowerShell):
 *
 *   $env:INTELIPATH_USER = "your-username"
 *   $env:INTELIPATH_PASS = "your-password"
 *   node tools/capture-screenshots.mjs
 *
 * First time only:
 *   npm i -D playwright && npx playwright install chromium
 *
 * Options (env vars):
 *   INTELIPATH_URL      base URL              default https://intelipath.online
 *   HEADED=1            watch the run in a real window
 *   OUT=docs/shots      output directory      default docs/screenshots
 *   SLOW=250            ms delay per action, useful when watching
 *
 * Output: numbered PNGs plus a manifest.json listing what each one is, so a
 * README can be assembled from it without opening every file.
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.INTELIPATH_URL ?? "https://intelipath.online";
const USER = process.env.INTELIPATH_USER;
const PASS = process.env.INTELIPATH_PASS;
const OUT = process.env.OUT ?? "docs/screenshots";
const HEADED = process.env.HEADED === "1";
const SLOW = Number(process.env.SLOW ?? 0);
/**
 * Capture only what a signed-out visitor sees.
 *
 * Exists so the whole pipeline — browser launch, viewport, screenshot writing,
 * manifest, console-error collection — can be exercised and verified without
 * anyone's credentials. The login step is the only thing it cannot prove.
 */
const PUBLIC_ONLY = process.env.PUBLIC_ONLY === "1";

if (!PUBLIC_ONLY && (!USER || !PASS)) {
  console.error(
    "Missing credentials.\n" +
      "  PowerShell:  $env:INTELIPATH_USER=\"...\"; $env:INTELIPATH_PASS=\"...\"\n" +
      "  bash:        INTELIPATH_USER=... INTELIPATH_PASS=... node capture-screenshots.mjs\n" +
      "\nTo check the script itself without an account:  PUBLIC_ONLY=1 node capture-screenshots.mjs",
  );
  process.exit(1);
}

/** Routes worth a picture. Anything not found is skipped, not fatal. */
const ROUTES = [
  { slug: "landing", url: "/", auth: false, note: "Landing page" },
  { slug: "dashboard", url: "/dashboard", auth: true, note: "Student dashboard" },
  { slug: "profile", url: "/profile", auth: true, note: "Profile and declared skills" },
  { slug: "roadmap", url: "/roadmap", auth: true, note: "Generated roadmap" },
  { slug: "assessment", url: "/assessment", auth: true, note: "Skill assessment" },
  { slug: "portfolio", url: "/portfolio", auth: true, note: "GitHub portfolio import" },
  { slug: "market", url: "/market", auth: true, note: "Job market signals" },
  { slug: "mentor", url: "/mentor", auth: true, note: "AI mentor chat" },
];

const shots = [];
let n = 0;

async function shoot(page, slug, note, { full = true } = {}) {
  n += 1;
  const file = path.join(OUT, `${String(n).padStart(2, "0")}-${slug}.png`);
  await page.screenshot({ path: file, fullPage: full });
  shots.push({ file, slug, note, url: page.url() });
  console.log(`  saved ${file}`);
}

/** Wait for the page to stop moving, without failing the run if it never does. */
async function settle(page, ms = 1200) {
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

const run = async () => {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: !HEADED, slowMo: SLOW });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // 2× so the PNGs stay sharp when a README scales them down.
    deviceScaleFactor: 2,
    locale: "vi-VN",
  });
  const page = await context.newPage();

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  console.log(`→ ${BASE}`);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shoot(page, "landing", "Landing page");

  // ---- log in ------------------------------------------------------------
  if (PUBLIC_ONLY) {
    console.log("→ PUBLIC_ONLY: skipping login and every authenticated route");
    for (const anchor of ["#features", "#how-it-works", "#testimonials"]) {
      const el = page.locator(anchor);
      if ((await el.count()) === 0) continue;
      await el.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await shoot(page, anchor.slice(1), `Landing section ${anchor}`, { full: false });
    }
    await finish(page, browser, errors);
    return;
  }

  console.log("→ logging in");
  await page.getByRole("button", { name: /log ?in/i }).first().click();
  await page.locator("#login-username").waitFor({ state: "visible", timeout: 10000 });

  await page.locator("#login-username").fill(USER);
  await page.locator("#login-password").fill(PASS);
  // The modal's submit is the one labelled exactly "Login"; the header's is
  // "Log in" and would just re-open the dialog.
  await page.getByRole("button", { name: /^login$/i }).click();

  // Logged-in state is "the username field is gone", which holds whether the
  // app redirects, swaps the modal, or re-renders in place.
  await page
    .locator("#login-username")
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => {
      throw new Error("Login did not complete — check the credentials or whether the form changed.");
    });
  await settle(page, 2000);
  console.log(`  in as ${USER}`);
  await shoot(page, "after-login", "First screen after login");

  // ---- walk the known routes --------------------------------------------
  for (const r of ROUTES) {
    if (!r.auth) continue;
    const url = new URL(r.url, BASE).toString();
    console.log(`→ ${r.url}`);
    const res = await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => null);
    if (!res || res.status() >= 400) {
      console.log(`  skipped (${res ? res.status() : "no response"})`);
      continue;
    }
    await settle(page);
    // A route that silently redirects to the landing page is not that route.
    if (new URL(page.url()).pathname === "/" && r.url !== "/") {
      console.log("  skipped (redirected to /)");
      continue;
    }
    await shoot(page, r.slug, r.note);
  }

  // ---- anything the nav knows about that the list above missed -----------
  const discovered = await page.evaluate(() => {
    const seen = new Set();
    return [...document.querySelectorAll("a[href^='/']")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && h !== "/" && !h.startsWith("//"))
      .filter((h) => (seen.has(h) ? false : seen.add(h)));
  });
  const known = new Set(ROUTES.map((r) => r.url));
  for (const href of discovered.filter((h) => !known.has(h)).slice(0, 6)) {
    console.log(`→ ${href} (discovered)`);
    const res = await page.goto(new URL(href, BASE).toString(), { waitUntil: "domcontentloaded" }).catch(() => null);
    if (!res || res.status() >= 400) continue;
    await settle(page);
    await shoot(page, href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "page", `Discovered route ${href}`);
  }

  await finish(page, browser, errors);
};

/** Write the manifest, report, close. Shared by the public and full runs. */
async function finish(page, browser, errors) {
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify({ base: BASE, capturedAt: new Date().toISOString(), shots }, null, 2));

  console.log(`\n${shots.length} screenshots → ${OUT}`);
  if (errors.length) {
    console.log(`\n${errors.length} console error(s) seen while capturing:`);
    for (const e of errors.slice(0, 10)) console.log(`  · ${e.slice(0, 160)}`);
  }
  if (!PUBLIC_ONLY) {
    console.log(
      "\nCheck the PNGs before committing — they are of a logged-in account and may\n" +
        "contain personal data (email, real name, imported repositories).",
    );
  }

  await browser.close();
}

run().catch((e) => {
  // Never let a stack trace carry the password into a log.
  console.error(`Failed: ${e.message}`);
  process.exit(1);
});
