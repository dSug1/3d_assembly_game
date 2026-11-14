// ⭐⭐ THE REPLAY PROBE (CL1, 2026-11-14) — a DETERMINISTIC headless run for a bit-for-bit check before / after a clean-up: the page's clock is
// VIRTUAL (`performance.now()` advances 1000/60 ms a frame, `requestAnimationFrame` queued and stepped by the probe), so every frame is the same
// on every run whatever the machine's speed; a seeded script of presses, drags, approaches (A + drag) and taps; every frame the camera, the orbited
// piece and every body's placement recorded at full precision.
//   URL (default http://127.0.0.1:5191/?sceneIndex=1&idleOrbitOn=0) · OUT — the recording `<PROBE_DIR>/<OUT>.json` · SEED (1) · LEGS (40)
//   CMP=a.json,b.json — no browser: compare two recordings frame by frame (exit 1 on the first difference)
// ⭐ Its own Chrome profile with Chrome's TEMP inside it, removed in `finally`; the updater and background network off (memory: no disk litter).
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
if (env.CMP) {
  const [a, b] = env.CMP.split(",").map((f) => JSON.parse(readFileSync(f, "utf8")));
  console.log(`frames: ${a.frames.length} vs ${b.frames.length}`);
  const n = Math.min(a.frames.length, b.frames.length);
  for (let i = 0; i < n; i++) {
    const x = JSON.stringify(a.frames[i]), y = JSON.stringify(b.frames[i]);
    if (x !== y) {
      console.log(`⛔ FIRST DIFFERENCE at frame ${i} (${a.frames[i].leg})`);
      for (const k of Object.keys(a.frames[i])) if (JSON.stringify(a.frames[i][k]) !== JSON.stringify(b.frames[i][k])) console.log(`  ${k}: ${JSON.stringify(a.frames[i][k]).slice(0, 300)}\n  ${" ".repeat(k.length)}  ${JSON.stringify(b.frames[i][k]).slice(0, 300)}`);
      process.exit(1);
    }
  }
  if (a.frames.length !== b.frames.length) { console.log("⛔ different lengths"); process.exit(1); }
  console.log(`✅ IDENTICAL, bit for bit: ${n} frames; errors ${a.errors} / ${b.errors}`);
  process.exit(0);
}

const OUT = env.OUT ?? "replay";
const DIR = env.PROBE_DIR ?? join(tmpdir(), "replay_probe");
mkdirSync(DIR, { recursive: true });
const URL = env.URL ?? "http://127.0.0.1:5191/?sceneIndex=1&idleOrbitOn=0";
const LEGS = +(env.LEGS ?? 40);
let seed = +(env.SEED ?? 1);
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_${OUT}_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const QUIET_FLAGS = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET_FLAGS, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
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
const watchdog = setTimeout(() => { console.error("WATCHDOG"); killChrome(); removeProfile(); process.exit(2); }, 20 * 60_000);
watchdog.unref();

// the virtual clock and the frame stepper, installed before any page script runs
const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;
// the per-frame record: full precision (JSON keeps every bit of a double)
const RECORD = `(() => { const st = window.__st; window.__frames = []; window.__leg = "start";
  const v = (x) => (x ? [x.x, x.y, x.z] : null);
  window.__frame = () => { try { const c = st.camera; const gb = st.greenBox;
    const w = []; for (const [id, o] of st.world.objects) w.push([id, ...o.local.position, ...o.local.orientation, o.parent ?? null]);
    window.__frames.push({ leg: window.__leg, c: v(c.position), t: v(c.getTarget()), up: v(c.upVector), fov: c.fov,
      p: gb ? v(gb.position) : null, q: gb && gb.rotationQuaternion ? gb.rotationQuaternion.asArray() : null,
      o: [st.orbit.yaw, st.orbit.elevation], g: st.asmGizmoAt ? [...st.asmGizmoAt] : null, ap: st.approach ?? null, w,
      v: String(st.lastVerdict ?? ""), ep: st.hudEpisodes ?? null });
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
    if (m.method === "Runtime.exceptionThrown") { errors++; console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 500)); }
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") { errors++; console.log("CONSOLE", JSON.stringify(m.params.args).slice(0, 300)); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id; const tm = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out`)); }, 30000);
    pending.set(i, (v) => { clearTimeout(tm); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr }); if (r?.exceptionDetails) console.log("EVAL ERROR", JSON.stringify(r.exceptionDetails).slice(0, 400)); return r?.result?.value; };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
  await send("Page.navigate", { url: URL });
  // boot: ⛔ no frame stepped while the page loads (a count that varied with the real loading time left the springs' residues different in
  // their last bits); the scene built (real time, no frames), then a FIXED number of frames
  let ready = false;
  for (let i = 0; i < 750 && !ready; i++) { await sleep(40); ready = await ev("!!(window.__step && window.__st && window.__st.greenBox)"); }
  if (!ready) throw new Error("the scene did not build");
  await sleep(1500);
  await ev("window.__step(240)");
  if (!(await ev("window.__st.frames > 30"))) throw new Error("the scene does not draw");
  await ev(RECORD);
  const step = (n) => ev(`window.__step(${n})`);
  const W = 1200, H = 800;
  const mouse = (type, x, y, buttons, clickCount = 1) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount });
  for (let L = 0; L < LEGS; L++) {
    const kind = rnd();
    let x = 200 + rnd() * (W - 400), y = 150 + rnd() * (H - 300);
    if (kind < 0.12) {
      // a TAP on the screen's centre (the piece is near it): the resting face / the quad
      await ev(`window.__leg = "tap${L}"`);
      x = W / 2 + (rnd() - 0.5) * 60; y = H / 2 + (rnd() - 0.5) * 60;
      await mouse("mousePressed", x, y, 1); await step(3); await mouse("mouseReleased", x, y, 0); await step(30);
      continue;
    }
    const approach = kind > 0.85;
    await ev(`window.__leg = "${approach ? "A" : "drag"}${L}"`);
    if (approach) await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
    await mouse("mousePressed", x, y, 1); await step(2);
    const segs = 1 + Math.floor(rnd() * 3);
    for (let s = 0; s < segs; s++) {
      const dx = approach ? 0 : (rnd() - 0.5) * 16, dy = (rnd() - 0.5) * 16, n = 5 + Math.floor(rnd() * 25);
      for (let k = 0; k < n; k++) { x = Math.max(5, Math.min(W - 5, x + dx)); y = Math.max(5, Math.min(H - 5, y + dy)); await mouse("mouseMoved", x, y, 1); await step(1); }
    }
    await mouse("mouseReleased", x, y, 0);
    if (approach) await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
    await step(10 + Math.floor(rnd() * 40));
  }
  await ev(`window.__leg = "settle"`); await step(120);
  const frames = await ev("window.__frames");
  const recErr = await ev("window.__recErr ?? window.__stepErr ?? null");
  writeFileSync(join(DIR, `${OUT}.json`), JSON.stringify({ url: URL, seed: +(env.SEED ?? 1), errors, recErr, frames }));
  console.log(`${OUT}: ${frames.length} frames, ${errors} errors, recErr ${recErr} → ${join(DIR, OUT + ".json")}`);
  ws.close();
} finally {
  killChrome();
  removeProfile();
  clearTimeout(watchdog);
}
