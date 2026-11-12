// ⭐⭐ THE FACE MAP'S GRID (TILTED_ORBIT_REBUILD_SCOPE.md, Step 5's gate: `Scene_1` exactly as Step 4c-bis) — headless Chrome on the dev server
// (`npm run dev:usb`, 127.0.0.1:5173): the gizmo the orbit's angles give (`mapGizmo`, `render/assembly_wiring.ts`) on a grid of yaw × pitch, read in the
// page itself (the app's own module instance), plus the face map's facets. Two recordings of two builds compared with `COMPARE=a.json,b.json`.
//   OUT=name     — the recording `<PROBE_DIR>/<name>.json` (PROBE_DIR: default the OS temp dir)
//   STEP=2       — the grid's step (deg); yaw 0 … 360, pitch −90 … 90
//   COMPARE=a,b  — no browser: the largest distance between the two grids' gizmos, where, and how many differ by more than 0.1 mm
// ⭐ Its own Chrome profile, removed in `finally`; every DevTools call times out; the whole tree killed on Windows.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const DIR = env.PROBE_DIR ?? join(tmpdir(), "orbit_probe");
mkdirSync(DIR, { recursive: true });

if (env.COMPARE) {
  const [a, b] = env.COMPARE.split(",").map((f) => JSON.parse(readFileSync(f, "utf8")));
  let worst = { d: 0, at: null };
  let over = 0;
  let missing = 0;
  for (let i = 0; i < a.grid.length; i++) {
    const p = a.grid[i];
    const q = b.grid[i];
    if (!p.g || !q.g) {
      if (!p.g !== !q.g) missing++;
      continue;
    }
    const d = Math.hypot(p.g[0] - q.g[0], p.g[1] - q.g[1], p.g[2] - q.g[2]);
    if (d > 1e-4) over++;
    if (d > worst.d) worst = { d, at: [p.yaw, p.pitch, p.band, q.band, p.g, q.g] };
  }
  console.log(`${a.grid.length} angles: the largest difference ${(worst.d * 1000).toFixed(4)} mm at ${JSON.stringify(worst.at)}; ${over} over 0.1 mm; ${missing} present in one only`);
  console.log(`facets: A ${JSON.stringify(a.facets)}\n        B ${JSON.stringify(b.facets)}`);
  process.exit(0);
}

const OUT = env.OUT ?? "grid";
const STEP = +(env.STEP ?? 2);
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `map_grid_profile_${OUT}_${process.pid}`);
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
  console.error("WATCHDOG: the grid ran past 10 min");
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
  const out = await ev(`(async () => {
    const st = window.__st; if (!st) throw new Error("no window.__st");
    const w = await import("/src/render/assembly_wiring.ts");
    const D = Math.PI / 180, grid = [];
    for (let p = -90; p <= 90 + 1e-9; p += ${STEP}) for (let y = 0; y < 360 - 1e-9; y += ${STEP}) {
      const m = w.mapGizmo(st, y * D, p * D);
      grid.push({ yaw: y, pitch: p, g: m ? m.hit.point.slice() : null, band: m ? m.t.band : null, n: m ? m.t.normal.slice() : null });
    }
    const fm = st.asmFaceMap?.map ?? null;
    const facets = fm === null ? null : fm.facets ? fm.facets.map((f) => ({ n: f.n.map((x) => +x.toFixed(4)), e: +f.e.toFixed(5), kind: f.kind, share: f.share !== undefined ? +f.share.toFixed(3) : null, groups: f.groups.length })) : fm.stacks.map((s) => ({ axis: s.axis, sign: s.sign, groups: s.groups.length }));
    return JSON.stringify({ grid, facets, core: fm ? fm.core : null, columns: fm && fm.columns ? fm.columns.map((c) => ({ mid: +(c.mid / D).toFixed(2), hw: +(c.hw / D).toFixed(2), facets: c.facets, bounds: c.bounds.map((b) => +(b / D).toFixed(2)) })) : null });
  })()`);
  const file = join(DIR, `${OUT}.json`);
  writeFileSync(file, out);
  const o = JSON.parse(out);
  console.log(`${OUT}: ${o.grid.length} angles → ${file}\nfacets ${JSON.stringify(o.facets)}\ncore ${JSON.stringify(o.core)}\ncolumns ${JSON.stringify(o.columns)}`);
  ws.close();
} finally {
  clearTimeout(watchdog);
  killChrome();
  await sleep(700);
  removeProfile();
}
