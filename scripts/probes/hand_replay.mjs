// ⭐⭐⭐ (2026-11-18, package FO3 S0 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §12.5 (H), §13) THE OWNER'S HAND REPLAYED, DETERMINISTIC: a stretch of a
// play recorder's session (`src/render/play_recorder.ts`, its JSONL: the raw pointer events at their times) sent as the same mouse events on HIS glass
// (1536 × 742, the DevTools' metrics override) under the VIRTUAL clock (`FPS` frames a second, 60 by default; 143 his desk): each event dispatched before
// the first frame whose time reaches it, so a run repeats bit for bit. Every frame recorded: the camera drawn, the gizmo, the turn under way, the
// pointer's move in the frame, and THE SHADOW (`st.asmRollShadow`, FO3 S0 — null before it).
//   URL=http://127.0.0.1:5191/?sceneIndex=4&idleOrbitOn=0 SRC=<session.jsonl> T0=<ms> T1=<ms> [FPS=60] [PRE=half|close] [HALFN=7] OUTJSON=<file> node hand_replay.mjs
//   PRE=half: the approach made first as the fast walks make it (A held, a drag; 0.736 on Scene_0bis); PRE=close: on until the automatic tilt latches.
//   ⛔ The owner's play is private: SRC on E: is read only; OUTJSON never in the repository.
import { guardProbe } from "./probe_guard.mjs";
import { SHADOW_REC } from "./turn_rec.mjs";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const URL = env.URL ?? "http://127.0.0.1:5191/?sceneIndex=4&idleOrbitOn=0";
const FPS = +(env.FPS ?? 60);
const W = 1536, H = 742;
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_hand_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET_FLAGS = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, `--window-size=${W},${H + 100}`, `--user-data-dir=${prof}`, ...QUIET_FLAGS, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
function killChrome() {
  if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
  else chrome.kill();
}
function removeProfile() {
  for (let i = 0; i < 6; i++) {
    try { rmSync(prof, { recursive: true, force: true }); return; } catch (e) {
      if (i === 5) console.error(`⚠ the probe's Chrome profile was NOT removed: ${prof} (${e})`);
      else spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]);
    }
  }
}
const watchdog = setTimeout(() => { console.error("WATCHDOG"); killChrome(); removeProfile(); process.exit(2); }, 12 * 60_000);
watchdog.unref();
guardProbe({ chromePid: chrome.pid, prof, ms: 12 * 60_000 + 30_000 });

const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / ${FPS}; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;
const RECORD = `(() => { const st = window.__st; window.__rows = []; window.__leg = "start"; window.__fd = [0, 0]; const ids = new WeakMap(); let nid = 0;
  window.__frame = () => { try {
    const g = st.asmGizmoAt, m = st.asmZoneMix, t = st.camera.getTarget();
    let mid = 0; if (m) { if (!ids.has(m)) ids.set(m, ++nid); mid = ids.get(m); }
    window.__rows.push({ leg: window.__leg, fd: window.__fd, c: [st.camera.position.x, st.camera.position.y, st.camera.position.z], t: [t.x, t.y, t.z],
      up: [st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z], g: g ? [g[0], g[1], g[2]] : null,
      mix: m ? { id: mid, k: m.k, rad: m.rad, byMm: !!m.byMm, out: !!m.out } : null, sq: st.asmSquare ? st.asmSquare.q : -1,
      tilt: st.asmTilt ? st.asmTilt.id : 0, zone: st.asmZone ? st.asmZone.zone.orientation : null, ap: st.approach, auto: !!st.asmTiltAuto,
      free: st.asmFree ? 1 : 0, h: st.asmEdgeHold ? [st.asmEdgeHold.sign, st.asmEdgeHold.back ?? null] : null, ds: st.asmDySign ?? null, sh: ${SHADOW_REC} });
    window.__fd = [0, 0];
  } catch (e) { window.__recErr = String(e); } }; return true; })()`;

try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error("no DevTools page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0, errors = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") { errors++; console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 300)); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id; const tm = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out`)); }, 30000);
    pending.set(i, (v) => { clearTimeout(tm); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr }))?.result?.value;
  await send("Runtime.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
  await send("Page.navigate", { url: URL });
  let ready = false;
  for (let i = 0; i < 750 && !ready; i++) { await sleep(40); ready = await ev("!!(window.__step && window.__st && window.__st.greenBox)"); }
  if (!ready) throw new Error("the scene did not build");
  await sleep(1500);
  await ev(`[...document.querySelectorAll('pre[data-role="error"]')].forEach((x) => x.remove())`);
  await ev("window.__step(240)");
  const vp = await ev("[window.innerWidth, window.innerHeight]");
  await ev(RECORD);
  const step = (n) => ev(`window.__step(${n})`);
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const keyA = (down) => send("Input.dispatchKeyEvent", down ? { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 } : { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
  const state = async () => JSON.parse(await ev(`JSON.stringify({ ap: window.__st.approach, auto: !!window.__st.asmTiltAuto })`));
  const drag = async (leg, x, y, dx, dy, n) => {
    await ev(`window.__leg = "${leg}"`);
    await keyA(true);
    await mouse("mousePressed", x, y, 1); await step(2);
    for (let k = 0; k < n; k++) { x = Math.max(5, Math.min(W - 5, x + dx)); y = Math.max(5, Math.min(H - 5, y + dy)); await mouse("mouseMoved", x, y, 1); await step(1); }
    await step(6); await mouse("mouseReleased", x, y, 0); await keyA(false);
    await ev(`window.__leg = "${leg}-settle"`); await step(40);
  };
  const s0 = await state();
  let pre = `approach ${s0.ap.toFixed(3)}`;
  if (env.PRE === "half" || env.PRE === "close") {
    await drag("probe", 250, 400, 0, -5, 12);
    const s1 = await state();
    const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
    await drag("approach-half", 250, inDy < 0 ? H - 40 : 40, 0, inDy * 5, +(env.HALFN ?? 7));
    let s2 = await state();
    for (let k = 0; env.PRE === "close" && !s2.auto && k < 8; k++) { await drag(`approach-close${k}`, 250, inDy < 0 ? H - 40 : 40, 0, inDy * 5, 10); s2 = await state(); }
    pre = `approach ${s2.ap.toFixed(3)}, close in ${s2.auto}`;
  }
  console.log(`viewport ${vp}, ${FPS} frames a second, ${pre}`);
  // the stretch: the recorded events from T0 to T1 at their times on the virtual clock
  const T0 = +env.T0, T1 = +env.T1;
  const evs = readFileSync(env.SRC, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).flatMap((b) => b.events ?? []).filter((e) => e.t >= T0 && e.t <= T1).sort((a, b) => a.t - b.t);
  if (evs.length === 0) throw new Error("no event in the stretch");
  const dtF = 1000 / FPS;
  let k = 0, down = 0, last = null, f = 0, press = 0;
  while (k < evs.length) {
    const tf = (f + 1) * dtF; // this frame's time from the stretch's start
    let fdx = 0, fdy = 0;
    while (k < evs.length && evs[k].t - T0 <= tf) {
      const e = evs[k++];
      if (e.type === "pointerdown") { press++; down = 1; await ev(`window.__leg = "press${press}"`); await mouse("mousePressed", e.x, e.y, 1); }
      else if (e.type === "pointermove") { if (down && last) { fdx += e.x - last[0]; fdy += e.y - last[1]; } await mouse("mouseMoved", e.x, e.y, down); }
      else { down = 0; await mouse("mouseReleased", e.x, e.y, 0); await ev(`window.__leg = "free${press}"`); }
      last = [e.x, e.y];
    }
    if (fdx !== 0 || fdy !== 0) await ev(`window.__fd = [${fdx}, ${fdy}]`);
    await step(1);
    f++; if (f % 120 === 0 && !(await ev("Array.isArray(window.__rows)"))) throw new Error(`the page was replaced during the replay (the recorder window.__rows is gone at frame ${f}): rerun this stretch`); // (packet D, A6) a reload mid-run made every step a no-op and crashed at the end
  }
  if (down && last) { await mouse("mouseReleased", last[0], last[1], 0); await ev(`window.__leg = "end-release"`); }
  await ev(`window.__leg = "settle"`); await step(Math.round(1.5 * FPS));
  const rows = await ev("window.__rows"); if (!Array.isArray(rows)) throw new Error("the page was replaced during the replay (the recorder window.__rows is gone): rerun this stretch");
  const recErr = await ev("window.__recErr ?? window.__stepErr ?? null");
  const boxes = await ev(`[...document.querySelectorAll('pre[data-role="error"]')].map((x) => x.textContent.slice(0, 200))`);
  writeFileSync(env.OUTJSON, JSON.stringify({ url: URL, fps: FPS, src: env.SRC.split("/").pop(), t0: T0, t1: T1, pre, errors, recErr, boxes, rows }));
  console.log(`hand: ${rows.length} frames, ${k} events, ${press} presses, ${errors} errors, recErr ${recErr}, boxes ${boxes.length}`);
  ws.close();
} finally {
  killChrome();
  removeProfile();
  clearTimeout(watchdog);
}
