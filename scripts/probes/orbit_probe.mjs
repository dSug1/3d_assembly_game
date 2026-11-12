// ⭐⭐⭐ THE ORBIT PROBE (TILTED_ORBIT_REBUILD_SCOPE.md, Step 0) — headless Chrome on the dev server (`npm run dev:usb`, 127.0.0.1:5173): drags the orbit
// with the mouse, ONE move per rendered frame, and records every frame (the gizmo, its face, the piece, the camera, the orbit's angles, the verdict).
//   MODE=const  LEGS='[["L",1400],["U",380]]'  — one press per leg, one direction, 3 px a frame (L R U D)
//   MODE=random SEED=3 PRESSES=5               — seeded random legs, mostly pure dx or dy
//   APPR=300    — an approach first (A + drag up, px); 0: far out
//   PRE=3       — seeded random legs first (a lead-in), then MODE's
//   DIAG=1      — every random leg a mix of dx and dy (a random direction)
//   LEGMAX=1400 — the random dx legs' longest (px; default 600 — 150 … 600); LEGMAXY=250 — the dy / diagonal legs' (40 … it; default LEGMAX)
//   DROP=1      — also record the carrier's drop ray re-cast (a diagnosis; ⛔ the carrier is deleted since Step 4c-bis — it records null)
//   AFTER=expr  — (2026-11-05) a page expression evaluated after the legs (a diagnosis: the solver's blocker, the gizmo at given angles), printed
//   OUT=name    — the recording `<PROBE_DIR>/<name>.json` (PROBE_DIR: default the OS temp dir); then `node scripts/probes/analyse_orbit.mjs <file>`
// ⛔ Never clamps a leg at the viewport's edge (a clamped leg sends one move backwards — read as a rocking roll): it ends the leg. ⭐ Its own Chrome profile,
// removed in `finally` (nothing left on the disk). ⚠ The viewport is the page's (`innerWidth` / `innerHeight`), not the window's.
// ⭐ (2026-11-04, the audit) never waits for ever: every DevTools call times out (`SEND_MS`, default 20 s), a closed socket fails what is pending, and a
// watchdog ends the run (`WATCHDOG_MIN`, default 20 min); on Windows Chrome's whole process tree is killed, and a profile left behind is NAMED.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const OUT = env.OUT ?? "orbit";
const DIR = env.PROBE_DIR ?? join(tmpdir(), "orbit_probe");
mkdirSync(DIR, { recursive: true });
let seed = +(env.SEED ?? 1);
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `orbit_probe_profile_${OUT}_${process.pid}`);
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SEND_MS = +(env.SEND_MS ?? 20000);
// ⭐ the watchdog: a run that hangs (a frame that never comes, a dead tab) is ended — `finally` cannot run from inside a wait that never returns
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: the probe ran past ${+(env.WATCHDOG_MIN ?? 20)} min — killing Chrome and exiting`);
  killChrome();
  removeProfile();
  process.exit(2);
}, +(env.WATCHDOG_MIN ?? 20) * 60_000);
watchdog.unref();
function killChrome() {
  // ⚠ on Windows `kill()` ends the browser process only — its renderer / GPU children keep the profile open; `taskkill /T` ends the tree
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
// ⭐⭐ (2026-11-12) NO DISK LITTER: Chrome's own temp files (the component updater's `Cr24` packages, `scoped_dir*`, the url fetcher's folder) went to %TEMP%
// itself — outside the profile removed in `finally`, and a `taskkill /F` skips Chrome's own cleanup (20 files, ~4 MB, one session). Now its TEMP / TMP are
// INSIDE the profile, and the updater and the background network are off.
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET_FLAGS = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1500,830", `--user-data-dir=${prof}`, ...QUIET_FLAGS, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error(`Chrome's DevTools did not answer on port ${port} (CHROME=${chromePath})`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  let errors = 0;
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).resolve(m.result); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") { errors++; console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 600)); }
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") { errors++; console.log("CONSOLE", JSON.stringify(m.params.args).slice(0, 300)); }
  });
  // ⭐ a closed socket fails every call still waiting (⛔ it hung for ever: Chrome gone, the run never reached `finally`)
  ws.addEventListener("close", () => { for (const p of pending.values()) p.reject(new Error("the DevTools socket closed")); pending.clear(); });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id;
    const timer = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out after ${SEND_MS} ms`)); }, SEND_MS);
    pending.set(i, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr }))?.result?.value;
  await send("Runtime.enable");
  await send("Page.navigate", { url: env.URL ?? "http://127.0.0.1:5173/" });
  await sleep(+(env.BOOT_MS ?? 15000));
  // the recorder: every field read defensively (a field the code under test lacks records null, never kills the row)
  const ok = await ev(`(() => { const st = window.__st; if (!st) return false; window.__rec = []; window.__leg = "boot";
    const v3 = (x) => (x && x.length === 3 ? [x[0], x[1], x[2]] : x && typeof x.x === "number" ? [x.x, x.y, x.z] : null);
    st.scene.onAfterRenderObservable.add(() => { try { const c = st.camera; const t = c.getTarget ? c.getTarget() : c.target;
      window.__rec.push({ leg: window.__leg, ts: performance.now(), g: v3(st.asmGizmoAt ?? st.asmG ?? null), gn: v3(st.gizmoNormal ?? null),
        p: st.greenBox ? v3(st.greenBox.getAbsolutePosition()) : null, c: v3(c.position), t: v3(t), up: v3(c.upVector),
        ov: [st.orbit.yaw, st.orbit.elevation], lk: st.asmLocked ?? null, cs: st.asmCarrier ? [st.asmCarrier.s, st.asmCarrier.chain?.total ?? null, st.asmCarrier.kind, st.asmCarrier.w, st.asmCarrier.heading ?? null] : null, pq: st.pieceQ ? [st.pieceQ.yaw, st.pieceQ.v] : null, tc: st.pieceTouching ?? null, uv: st.orbitUserV ?? null, mq: st.asmMapQ ? [st.asmMapQ.yaw, st.asmMapQ.pitch] : null, ms: st.asmShown ? [st.asmShown.t.stack, st.asmShown.t.band, st.asmShown.t.side] : null, dr: ${env.DROP ? `(() => { const d = st.asmCarrier?.drop; if (!d) return null; const Ray = c.getForwardRay(1).constructor; const V = c.position.constructor; const h = st.scene.pickWithRay(new Ray(new V(...d.origin), new V(...d.dir), d.length), (m) => { const id = st.idOf.get(m); return id !== undefined && st.goalCommit.placed.has(id) && m.isPickable && m.isEnabled(); }); const n = h?.hit ? h.getNormal(true) : null; return h?.hit ? [h.pickedMesh.name, h.pickedPoint.x, h.pickedPoint.y, h.pickedPoint.z, n ? n.y : null, d.origin, d.dir] : ["miss", d.origin, d.dir]; })()` : "null"}, rc: st.asmRedCache ? [st.asmRedCache.pts.filter(Boolean).length, st.asmRedCache.pts.length] : null, sh: st.asmShown ? (st.asmShown.t ? [st.asmShown.t.surface, st.asmShown.t.band, st.asmShown.t.side] : [st.asmShown.c.w, st.asmShown.c.heading]) : null, mq: st.asmMapQ ? [st.asmMapQ.yaw, st.asmMapQ.pitch] : null, cm: st.asmCalm ? [st.asmCalm.n, st.asmCalm.sH, st.asmCalm.sV] : null, ap: st.approach, hv: st.hover != null, v: String(st.lastVerdict ?? "").slice(0, 90) });
    } catch (e) { window.__recErr = String(e); } }); return true; })()`);
  if (!ok) throw new Error("no window.__st — is this the dev server (import.meta.env.DEV)?");
  const vp = JSON.parse(await ev("JSON.stringify([innerWidth, innerHeight])"));
  const [W, H] = vp;
  const top = Math.round(H * 0.42); // under the HUD
  const inside = (m) => m[0] > 4 && m[0] < W - 4 && m[1] > top && m[1] < H - 4;
  const move = (type, m, buttons) => send("Input.dispatchMouseEvent", { type, x: m[0], y: m[1], button: "left", buttons, clickCount: 1 });
  const frame = () => ev("new Promise((r) => requestAnimationFrame(() => r(1)))");
  const leg = async (tag, from, step, n) => {
    await ev(`window.__leg = ${JSON.stringify(tag)}`);
    let m = from;
    await move("mousePressed", m, 1); await frame();
    for (let j = 0; j < n; j++) { const m2 = [m[0] + step[0], m[1] + step[1]]; if (!inside(m2)) break; m = m2; await move("mouseMoved", m, 1); await frame(); }
    await ev(`window.__leg = ${JSON.stringify(tag + "_rel")}`);
    await move("mouseReleased", m, 0); await sleep(1500);
  };
  if (+(env.APPR ?? 0) > 0) {
    await ev(`window.__leg = "approach"`);
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
    let m = [60, H - 40]; await move("mousePressed", m, 1); await frame();
    const n = Math.round(+env.APPR / 3);
    for (let k = 0; k < n; k++) { m = [m[0], m[1] - 3]; if (!inside(m)) break; await move("mouseMoved", m, 1); await frame(); }
    await move("mouseReleased", m, 0); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 }); await sleep(1500);
  }
  const randomLeg = async (tag) => {
    const r = rnd(); const u = rnd(); const s = rnd() < 0.5 ? -1 : 1;
    const a = env.DIAG ? rnd() * 2 * Math.PI : 0; // DIAG=1 (no draw otherwise: the seeds keep their legs): every leg a mix of dx and dy at a random angle
    const d = env.DIAG ? [Math.cos(a), Math.sin(a)] : r < 0.45 ? [s, 0] : r < 0.9 ? [0, s] : [s * 0.7, (rnd() < 0.5 ? -1 : 1) * 0.7];
    // a dx leg up to LEGMAX, a dy (or diagonal) leg up to LEGMAXY — a long dy only parks the pitch at ±90° (~0.67° a px)
    const L = d[1] === 0 ? 150 + u * (+(env.LEGMAX ?? 600) - 150) : 40 + u * (+(env.LEGMAXY ?? env.LEGMAX ?? 600) - 40);
    const from = [W / 2 - d[0] * Math.min(W / 2 - 20, L / 2), (top + H) / 2 - d[1] * Math.min((H - top) / 2 - 10, L / 2)];
    await leg(`${tag}[${(d[0] * L).toFixed(0)},${(d[1] * L).toFixed(0)}]`, from, [d[0] * 3, d[1] * 3], Math.round(L / 3));
  };
  for (let k = 1; k <= +(env.PRE ?? 0); k++) await randomLeg(`pre${k}`);
  const mode = env.MODE ?? "const";
  if (mode === "const") {
    const starts = { L: [W - 20, (top + H) / 2], R: [20, (top + H) / 2], U: [W / 2, H - 15], D: [W / 2, top + 10] };
    const dirs = { L: [-3, 0], R: [3, 0], U: [0, -3], D: [0, 3] };
    let k = 0;
    for (const [d, px] of JSON.parse(env.LEGS ?? '[["L",1400],["U",380],["R",1400],["D",380]]')) { k++; await leg(`c${k}${d}`, starts[d], dirs[d], Math.round(px / 3)); }
  } else {
    for (let k = 1; k <= +(env.PRESSES ?? 5); k++) await randomLeg(`r${k}`);
  }
  if (env.AFTER) console.log("AFTER", await ev(env.AFTER));
  const rows = JSON.parse(await ev("JSON.stringify(window.__rec)"));
  const file = join(DIR, `${OUT}.json`);
  writeFileSync(file, JSON.stringify({ viewport: vp, recorderError: (await ev("window.__recErr ?? null")) ?? null, errors, rows }));
  console.log(`${OUT}: ${rows.length} frames, ${errors} page errors → ${file}`);
  ws.close();
} finally {
  clearTimeout(watchdog);
  killChrome();
  await sleep(700);
  removeProfile();
}
