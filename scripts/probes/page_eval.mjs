// ⭐ A MEASUREMENT IN THE PAGE (POLAR_ORBIT_CLEANUP.md §8) — headless Chrome on the dev server (`npm run dev:usb`, 127.0.0.1:5173): boots the app, then runs
// the file `EXPR` (an async function body; `st` = window.__st, `W` = the app's own `render/assembly_wiring.ts`, `FM` = `input/face_map.ts`) and prints what
// it returns (JSON). Same Chrome hygiene as `map_grid.mjs` (its own profile, removed in `finally`; a watchdog; the tree killed on Windows).
//   EXPR=file.js  — the body;  URL=…  — the page (default http://127.0.0.1:5173/);  BOOT_MS=15000
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const DIR = env.PROBE_DIR ?? join(tmpdir(), "orbit_probe");
mkdirSync(DIR, { recursive: true });

const OUT = "eval";
const BODY = readFileSync(env.EXPR, "utf8");
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `page_eval_profile_${OUT}_${process.pid}`);
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SEND_MS = +(env.SEND_MS ?? 60000);
// ⭐⭐ (2026-11-12) NO DISK LITTER: Chrome's own temp files (the component updater's `Cr24` packages, `scoped_dir*`, the url fetcher's folder) went to %TEMP%
// itself — outside the profile removed in `finally`, and a `taskkill /F` skips Chrome's own cleanup (20 files, ~4 MB, one session). Now its TEMP / TMP are
// INSIDE the profile, and the updater and the background network are off.
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET_FLAGS = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1500,830", `--user-data-dir=${prof}`, ...QUIET_FLAGS, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
function killChrome() {
  if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
  else chrome.kill();
}
function removeProfile() {
  for (let i = 0; i < 6; i++) {
    try {
      rmSync(prof, { recursive: true, force: true });
      return;
    } catch (e) {
      if (i === 5) console.error(`⚠ the probe's Chrome profile was NOT removed: ${prof} (${e})`);
      else spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]);
    }
  }
}
const watchdog = setTimeout(() => {
  console.error("WATCHDOG: the eval ran past 10 min");
  killChrome();
  removeProfile();
  process.exit(2);
}, 10 * 60_000);
watchdog.unref();
try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    await sleep(250);
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch {}
  }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error(`Chrome's DevTools did not answer on port ${port}`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id).resolve(m.result);
      pending.delete(m.id);
    }
    if (m.method === "Runtime.exceptionThrown") console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 600));
  });
  ws.addEventListener("close", () => {
    for (const p of pending.values()) p.reject(new Error("the DevTools socket closed"));
    pending.clear();
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      const timer = setTimeout(() => {
        pending.delete(i);
        reject(new Error(`${method} timed out after ${SEND_MS} ms`));
      }, SEND_MS);
      pending.set(i, { resolve: (v) => (clearTimeout(timer), resolve(v)), reject: (e) => (clearTimeout(timer), reject(e)) });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr });
    if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 800));
    return r?.result?.value;
  };
  await send("Runtime.enable");
  await send("Page.navigate", { url: env.URL ?? "http://127.0.0.1:5173/" });
  await sleep(+(env.BOOT_MS ?? 15000));
  const out = await ev(`(async () => { const st = window.__st; if (!st) throw new Error("no window.__st"); const W = await import("/src/render/assembly_wiring.ts"); const FM = await import("/src/input/face_map.ts"); const r = await (async () => { ${BODY} })(); return JSON.stringify(r); })()`);
  console.log(out);
  ws.close();
} finally {
  clearTimeout(watchdog);
  killChrome();
  await sleep(700);
  removeProfile();
}
