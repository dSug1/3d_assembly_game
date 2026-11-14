// ⭐⭐ THE PICK-UP FLOW'S PROBE (2026-11-14, `PICK_AND_PLACE.md`) — headless, on the virtual clock of `replay_probe.mjs`: `Scene_2` booted (its
// animation off), its parts made bodies; then the flow walked and its state printed at each step — the pickable parts, a TAP on one (the pick:
// the piece orbit, the inputs held through the switch), a DOUBLE TAP on it (the put-down: the free spot, the least turn), a pick again and the
// piece set ON its goal (the capture, the commit, the step after the snap), a pick of the next part. Exit 1 on a failed check.
//   URL (default http://127.0.0.1:5191/?sceneIndex=3&anim=0&idleOrbitOn=0&bootSeed=5) · SHOTS=dir — a screenshot at each step (PNG) there
// ⭐ Its own Chrome profile with Chrome's TEMP inside it, removed in `finally`; the updater and background network off (memory: no disk litter).
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const URL = env.URL ?? "http://127.0.0.1:5191/?sceneIndex=3&anim=0&idleOrbitOn=0&bootSeed=5";
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `pick_probe_profile_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const QUIET_FLAGS = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const W = 1200, H = 800;
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, `--user-data-dir=${prof}`, ...QUIET_FLAGS, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const killChrome = () => { if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); else chrome.kill(); };
const removeProfile = () => { for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); return; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } } console.error(`⚠ profile NOT removed: ${prof}`); };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); killChrome(); removeProfile(); process.exit(2); }, 15 * 60_000);
watchdog.unref();

const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } } return T; }; })();`;

let failures = 0;
const check = (ok, what) => { console.log(`${ok ? "✅" : "⛔"} ${what}`); if (!ok) failures++; };

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
    if (m.method === "Runtime.exceptionThrown") { errors++; console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 700)); }
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") { errors++; console.log("CONSOLE", JSON.stringify(m.params.args).slice(0, 500)); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id; const tm = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out`)); }, 60000);
    pending.set(i, (v) => { clearTimeout(tm); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr }); if (r?.exceptionDetails) console.log("EVAL ERROR", JSON.stringify(r.exceptionDetails).slice(0, 600)); return r?.result?.value; };
  const step = (n) => ev(`window.__step(${n})`);
  const shot = async (name) => {
    if (!env.SHOTS) return;
    const r = await send("Page.captureScreenshot", { format: "png" });
    mkdirSync(env.SHOTS, { recursive: true });
    writeFileSync(join(env.SHOTS, `${name}.png`), Buffer.from(r.data, "base64"));
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
  await send("Page.navigate", { url: URL });
  let ready = false;
  for (let i = 0; i < 1500 && !ready; i++) { await sleep(40); ready = await ev("(window.__step ? (window.__step(1), !!(window.__st && window.__st.modelHooks)) : false)"); }
  if (!ready) throw new Error(`the parts did not become bodies: ${await ev("window.__st && window.__st.modelStatus")}`);
  await step(60);
  await ev(`Promise.all([import("/src/core/object_model.ts")]).then(([a]) => { window.__OM = a; return 1; })`);
  console.log("status:", await ev("window.__st.modelStatus"));
  const state = () => ev(`(() => { const st = window.__st; const OM = window.__OM;
    const pose = (id) => { const p = OM.worldPlacementOf(st.world, id); return p ? [...p.position.map((x) => +x.toFixed(4)), ...p.orientation.map((x) => +x.toFixed(4))] : null; };
    const outl = []; for (const m of st.scene.meshes) if (m.renderOutline) outl.push(m.name);
    return { held: st.greenBox ? st.greenBox.name : null, placed: st.goalCommit.count, total: st.goalCommit.total, verdict: st.lastVerdict, outlined: [...new Set(outl.map((n) => n.split("_")[0]))],
      cam: [st.camera.position.x, st.camera.position.y, st.camera.position.z].map((x) => +x.toFixed(3)), placedFlag: st.orbitPiecePlaced, E02: pose("E02"), E03: pose("E03"), orbit: [+st.orbit.yaw.toFixed(3), +st.orbit.elevation.toFixed(3)] }; })()`);
  // the screen point of a part: its drawn meshes' bounding centre, projected
  const screenOf = (pid) => ev(`(() => { const st = window.__st; const ms = st.scene.meshes.filter((m) => st.modelBrowse.has(m) && m.name.startsWith("${pid}") && m.isEnabled());
    if (ms.length === 0) return null; let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const m of ms) { m.computeWorldMatrix(true); const b = m.getBoundingInfo().boundingBox; for (const [k, v] of [["x", 0], ["y", 1], ["z", 2]]) { lo[v] = Math.min(lo[v], b.minimumWorld[k]); hi[v] = Math.max(hi[v], b.maximumWorld[k]); } }
    const c = { x: (lo[0] + hi[0]) / 2, y: (lo[1] + hi[1]) / 2, z: (lo[2] + hi[2]) / 2 };
    const e = st.scene.getEngine(); const vp = st.camera.viewport.toGlobal(e.getRenderWidth(), e.getRenderHeight());
    const V = c.constructor; const p = window.BABYLON_project ? null : null;
    const m = st.scene.getTransformMatrix(); const w = [c.x, c.y, c.z, 1]; const M = m.m;
    const x = w[0] * M[0] + w[1] * M[4] + w[2] * M[8] + M[12], y = w[0] * M[1] + w[1] * M[5] + w[2] * M[9] + M[13], ww = w[0] * M[3] + w[1] * M[7] + w[2] * M[11] + M[15];
    const s = e.getHardwareScalingLevel(); return [((x / ww + 1) / 2) * vp.width * s, ((1 - y / ww) / 2) * vp.height * s]; })()`);
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const tap = async (x, y) => { await mouse("mouseMoved", x, y, 0); await mouse("mousePressed", x, y, 1); await step(3); await mouse("mouseReleased", x, y, 0); };

  let s = await state();
  console.log("boot:", JSON.stringify(s));
  check(s.held === null, "boot: nothing held (the scene orbit)");
  check(s.placed === 1 && s.total === 17, `boot: the anchor placed (${s.placed}/${s.total})`);
  check(s.outlined.length === 1 && s.outlined[0] === "E02", `boot: the outlined parts are the next step's: ${s.outlined}`);
  await shot("1_boot");

  // ⭐ THE PICK — a tap on the lower case
  const p2 = await screenOf("E02");
  console.log("E02 on the glass:", p2);
  await tap(p2[0], p2[1]);
  await step(2);
  s = await state();
  check(s.held === "E02", `pick: E02 in hand (${s.verdict})`);
  check(s.outlined.length === 0, "pick: the outlines off while a part is held");
  const held = await ev(`(() => { const st = window.__st; return { busy: st.camera.position.x, during: true }; })()`);
  void held;
  await step(60);
  s = await state();
  console.log("held:", JSON.stringify(s));
  await shot("2_held");
  check(s.E02 !== null && s.E02[1] > 0.1, `pick: lifted (y ${s.E02?.[1]})`);

  // ⭐ THE PUT-DOWN — a double tap on the held part
  const p3 = await screenOf("E02");
  await tap(p3[0], p3[1]);
  await step(4);
  await tap(p3[0], p3[1]);
  await step(70);
  s = await state();
  console.log("put down:", JSON.stringify(s));
  await shot("3_put_down");
  check(s.held === null, `put down: out of the hand (${s.verdict})`);
  check(s.E02 !== null && s.E02[1] < 0.2, `put down: on the floor (y ${s.E02?.[1]})`);
  check(s.outlined.includes("E02"), "put down: the outline back");

  // ⭐ A PICK AGAIN, then the part set on its goal: the capture, the commit, the step after the snap
  const p4 = await screenOf("E02");
  await tap(p4[0], p4[1]);
  await step(60);
  s = await state();
  check(s.held === "E02", "pick again: E02 in hand");
  await ev(`(() => { const st = window.__st; const OM = window.__OM; const g = st.sceneSpec.final.bodies.find((b) => b.id === "E02"); const u = st.sceneSpec.unitM ?? 1;
    const at = { position: [g.position[0] * u, g.position[1] * u + 0.002, g.position[2] * u], orientation: [1, 0, 0, 0] };
    st.greenBox.position.set(...at.position); st.greenBox.rotationQuaternion.set(0, 0, 0, 1); st.world = OM.setLocalPlacement(st.world, "E02", at); return 1; })()`);
  await step(2);
  await step(80);
  s = await state();
  console.log("seated:", JSON.stringify(s));
  await shot("4_seated");
  check(s.placed === 2, `seat: E02 placed (${s.placed}/${s.total}; ${s.verdict})`);
  check(s.held === null, "seat: out of the hand, the scene orbit");
  check(s.outlined.length === 1 && s.outlined[0] === "E03", `seat: the next step outlined: ${s.outlined}`);

  // ⭐ the next part: the crankshaft
  const p5 = await screenOf("E03");
  await tap(p5[0], p5[1]);
  await step(60);
  s = await state();
  await shot("5_crank");
  check(s.held === "E03", `the next pick: E03 in hand (${s.verdict})`);
  const err = await ev("window.__stepErr ?? null");
  check(errors === 0 && err === null, `no exception (${errors}; ${err})`);
  ws.close();
} finally {
  killChrome();
  removeProfile();
  clearTimeout(watchdog);
}
process.exit(failures > 0 ? 1 : 0);
