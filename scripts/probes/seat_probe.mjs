// ⭐⭐ THE SEAT PROBE (2026-11-14) — can the lower case be SEATED by the orbit (no teleport)? Picked, its bottom face made the resting face, the gizmo on
// the plinth's top, then the approach (A + drag): the distance to its goal printed as it comes in. Diagnostic, not a gate.
// (from) THE PICK-UP FLOW'S PROBE (2026-11-14, `PICK_AND_PLACE.md`) — headless, on the virtual clock of `replay_probe.mjs`: `Scene_2` booted (its
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
  // a screen point ON a part: its drawn meshes' vertices projected, the first whose pick meets the part (⛔ its box's centre misses a thin bar)
  const screenOf = (pid) => ev(`(() => { const st = window.__st; const ms = st.scene.meshes.filter((m) => st.modelBrowse.has(m) && m.name.startsWith("${pid}") && m.isEnabled());
    if (ms.length === 0) return null; const e = st.scene.getEngine(); const vp = st.camera.viewport.toGlobal(e.getRenderWidth(), e.getRenderHeight()); const s = e.getHardwareScalingLevel();
    const M = st.scene.getTransformMatrix().m; const mine = new Set(ms); const pts = [];
    for (const m of ms) { m.computeWorldMatrix(true); const W = m.getWorldMatrix().m; const pos = m.getVerticesData("position") ?? []; const step = Math.max(3, 3 * Math.floor(pos.length / 3 / 40));
      for (let i = 0; i + 2 < pos.length; i += step) { const x0 = pos[i], y0 = pos[i + 1], z0 = pos[i + 2];
        const wx = x0 * W[0] + y0 * W[4] + z0 * W[8] + W[12], wy = x0 * W[1] + y0 * W[5] + z0 * W[9] + W[13], wz = x0 * W[2] + y0 * W[6] + z0 * W[10] + W[14];
        const x = wx * M[0] + wy * M[4] + wz * M[8] + M[12], y = wx * M[1] + wy * M[5] + wz * M[9] + M[13], w = wx * M[3] + wy * M[7] + wz * M[11] + M[15];
        if (w <= 0) continue; const sx = ((x / w + 1) / 2) * vp.width * s, sy = ((1 - y / w) / 2) * vp.height * s; if (sx > 8 && sy > 260 && sx < ${W} - 8 && sy < ${H} - 8) pts.push([sx, sy]); } }
    pts.sort((a, b) => a[1] - b[1]); const mid = pts.length ? pts[Math.floor(pts.length / 2)] : null; const order = mid ? [...pts].sort((a, b) => Math.hypot(a[0] - mid[0], a[1] - mid[1]) - Math.hypot(b[0] - mid[0], b[1] - mid[1])) : [];
    for (const [px, py] of order) { for (const [ox, oy] of [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const p = st.scene.pick(px + ox, py + oy, (m) => m.isEnabled() && (st.modelBrowse.has(m)), false, st.camera); if (p.hit && mine.has(p.pickedMesh)) return [px + ox, py + oy]; } }
    return null; })()`);
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const tap = async (x, y) => { await mouse("mouseMoved", x, y, 0); await mouse("mousePressed", x, y, 1); await step(3); await mouse("mouseReleased", x, y, 0); };

  await ev(`Promise.all([import("/src/render/pointer_wiring.ts"), import("/src/render/orient_cube.ts")]).then(([a, b]) => { window.__PW = a; window.__OC = b; return 1; })`);
  const diag = (pid) => ev(`(() => { const st = window.__st; const OM = window.__OM; const p = OM.worldPlacementOf(st.world, "${pid}"); const g = st.sceneSpec.final.bodies.find((b) => b.id === "${pid}"); const u = st.sceneSpec.unitM ?? 1;
    const d = p ? Math.hypot(p.position[0] - g.position[0] * u, p.position[1] - g.position[1] * u, p.position[2] - g.position[2] * u) : null;
    const ang = p ? 2 * Math.acos(Math.min(1, Math.abs(p.orientation[0]))) * 180 / Math.PI : null;
    return { held: st.greenBox?.name ?? null, d: d === null ? null : +(d * 1000).toFixed(1), angDeg: ang === null ? null : +ang.toFixed(1), approach: +st.approach.toFixed(3), placed: st.goalCommit.count, quads: st.restingQuads?.shown ?? null, v: st.lastVerdict.slice(0, 110), gizmo: st.asmGizmoAt ? st.asmGizmoAt.map((x) => +x.toFixed(3)) : null, host: st.gizmoHost ?? null, hit: st.lastCollision ?? null, piece: p ? p.position.map((x) => +x.toFixed(3)) : null, goal: [g.position[0] * u, g.position[1] * u, g.position[2] * u].map((x) => +x.toFixed(3)) }; })()`);
  const results = [];
  for (const pid of (env.PARTS ?? "E02,E03,E04").split(",")) {
    await ev(`(() => { const st = window.__st; st.orbit.reset(st.bootYawRad, st.bootElevation); return 1; })()`);
    await ev(`import("/src/render/camera_rig.ts").then((r) => { r.applyCamera(window.__st); return 1; })`);
    await step(10);
    const at = await screenOf(pid);
    if (at === null) { console.log(pid, "not on the glass"); results.push([pid, "not on the glass"]); break; }
    await tap(at[0], at[1]);
    await step(60);
    console.log(pid, "held:", JSON.stringify(await diag(pid)));
    // its bottom at the goal (the body's frame: the world's at its goal) as the resting face; the top quad tapped; rolled toward its goal's yaw
    const r = await ev(`(() => { const st = window.__st; const topo = st.topoOf.get("${pid}"); let best = null; for (const f of topo.faces) { if (best === null || f.normal[1] < best.n) best = { id: f.id, n: f.normal[1] }; }
      const ok = window.__PW.selectRestingFace(st, best.id); return { face: best, ok }; })()`);
    await step(30);
    const tag = await ev(`window.__st.orientDirs.findIndex((d) => d.normal[1] > 0.999)`);
    await ev(`window.__OC.orientCubeTap(window.__st, ${tag})`);
    await step(30);
    for (let k = 0; k < 6 && (await diag(pid)).angDeg > 3; k++) { await ev(`window.__OC.orientCubeTap(window.__st, ${tag})`); await step(30); }
    console.log(pid, "turned:", JSON.stringify(r), JSON.stringify(await diag(pid)));
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
    for (let leg = 0; leg < 10; leg++) {
      await mouse("mouseMoved", 600, 650, 0); await mouse("mousePressed", 600, 650, 1); await step(2);
      for (let k = 1; k <= 20; k++) { await mouse("mouseMoved", 600, 650 - 10 * k, 1); await step(1); }
      await mouse("mouseReleased", 600, 450, 0); await step(20);
      if ((await ev("window.__st.greenBox === null"))) break;
    }
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
    await step(60);
    const end = await diag(pid);
    console.log(pid, "end:", JSON.stringify(end));
    await shot(`seat_${pid}`);
    results.push([pid, end.held === null && end.d === 0 ? "SEATED" : `not seated: ${end.d} mm, ${end.angDeg}°`]);
    if (end.held !== null) break;
  }
  console.log("RESULTS", JSON.stringify(results));
  ws.close();
} finally {
  killChrome();
  removeProfile();
  clearTimeout(watchdog);
}
