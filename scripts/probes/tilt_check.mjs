// Does the tilted-pole orbit still fire close in? A deterministic headless run (the replay probe's virtual clock): approach until the automatic
// tilt's latch is on, orbit by dy onto a face holding a pole, orbit in the tilt, approach back out. Prints every change of the tilt's state.
//   URL=http://127.0.0.1:5191/?sceneIndex=1&idleOrbitOn=0[&chartLayout=1] [MODE=out|ridge|press|rim|pole] [SHOW=<leg>] node scripts/probes/tilt_check.mjs
//   (a dev server must serve the URL; scripts/probes/tilt_batch.sh starts one and stops it — the runbook: scripts/probes/ORBIT_GATES.md)
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.URL;
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_tilt_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); else chrome.kill(); };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(2); }, 8 * 60_000);
watchdog.unref();

const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;
// every frame: the tilt's state; a line kept only when it changes
const RECORD = `(() => { const st = window.__st; window.__log = []; window.__cam = []; window.__leg = "start"; let last = ""; let f = 0;
  window.__frame = () => { try { f++;
    const t = st.asmTilt; const n = st.gizmoNormal; const z = st.asmZone;
    const s = { auto: !!st.asmTiltAuto, pend: !!st.asmTiltPending, tilt: t ? t.id + (t.off ? " off" : "") : "-", zone: z ? z.zone.orientation : "-",
      n: n ? [n[0], n[1], n[2]].map((x) => x.toFixed(2)).join(",") : "-", v: String(st.lastVerdict ?? "").slice(0, 120) };
    const key = JSON.stringify(s);
    window.__cam.push([window.__leg, st.camera.position.x, st.camera.position.y, st.camera.position.z, st.camera.getTarget().x, st.camera.getTarget().y, st.camera.getTarget().z, st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z, st.orbit.yaw, st.orbit.elevation, ...(st.asmGizmoAt ? st.asmGizmoAt : [NaN, NaN, NaN]), st.asmCalm ? st.asmCalm.sV : NaN, ...(st.asmPieceDrawn ? st.asmPieceDrawn : [NaN, NaN, NaN]), ...(st.asmMapQ && st.asmPrevQ ? [Math.atan2(Math.sin(st.asmMapQ.yaw - st.asmPrevQ.yaw), Math.cos(st.asmMapQ.yaw - st.asmPrevQ.yaw)), st.asmMapQ.pitch - (2 * st.asmPrevQ.v - 1) * (Math.PI / 2)] : [NaN, NaN]), (st.asmZoneMix || (st.asmTilt && (st.asmTilt.swingMs !== null || st.asmTilt.finishing))) ? 1 : 0, st.asmZoneMix ? st.asmZoneMix.k : -1, st.asmZoneMix && st.asmZoneMix.byMm ? 1 : 0, st.asmTilt ? st.asmTilt.id : 0, st.asmTiltPending ? 1 : 0, st.asmBlend ? st.asmBlend.mm : -1, st.asmDirEase ? st.asmDirEase.angle * 180 / Math.PI : 0, st.asmZoneMix ? st.asmZoneMix.rad * 180 / Math.PI : 0, st.approach, st.asmTiltAuto ? 1 : 0, st.asmEdgeHold ? 1 : 0]);
    if (key !== last) { last = key; window.__log.push({ f, leg: window.__leg, ap: +st.approach.toFixed(3), el: +st.orbit.elevation.toFixed(3), up: [st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z].map((x) => +x.toFixed(2)), ...s }); }
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
    if (m.method === "Runtime.exceptionThrown") { errors++; console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 400)); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id; const tm = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out`)); }, 30000);
    pending.set(i, (v) => { clearTimeout(tm); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr }))?.result?.value;
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
  await send("Page.navigate", { url: URL });
  let ready = false;
  for (let i = 0; i < 750 && !ready; i++) { await sleep(40); ready = await ev("!!(window.__step && window.__st && window.__st.greenBox)"); }
  if (!ready) throw new Error("the scene did not build");
  await sleep(1500);
  await ev(`[...document.querySelectorAll('pre[data-role="error"]')].forEach((x) => x.remove())`);
  await ev("window.__step(240)");
  await ev(RECORD);
  const step = (n) => ev(`window.__step(${n})`);
  const state = async () => JSON.parse(await ev(`(() => { const s = window.__st; const n = s.gizmoNormal; return JSON.stringify({ ap: s.approach, auto: !!s.asmTiltAuto, tilt: s.asmTilt ? s.asmTilt.id : null, ny: n ? n[1] : null, nz: n ? n[2] : null, el: s.orbit.elevation, yaw: s.orbit.yaw, chart: s.cfg.chartLayout, gx: s.asmGizmoAt ? s.asmGizmoAt[0] : null, gy: s.asmGizmoAt ? s.asmGizmoAt[1] : null, gz: s.asmGizmoAt ? s.asmGizmoAt[2] : null, hold: !!s.asmEdgeHold, mix: !!s.asmZoneMix }); })()`));
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const keyA = (down) => send("Input.dispatchKeyEvent", down ? { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 } : { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
  // one drag of n frames (dx, dy px a frame) from (x, y); `a`: the approach's key held; `until`: stops it early (read every 4 frames)
  const drag = async (leg, x, y, dx, dy, n, a, until) => {
    await ev(`window.__leg = "${leg}"`);
    if (a) await keyA(true);
    await mouse("mousePressed", x, y, 1); await step(2);
    let hit = false;
    for (let k = 0; k < n && !hit; k++) {
      x = Math.max(5, Math.min(1195, x + dx)); y = Math.max(5, Math.min(795, y + dy));
      await mouse("mouseMoved", x, y, 1); await step(1);
      if (until && k % 4 === 3) hit = until(await state());
    }
    await mouse("mouseReleased", x, y, 0);
    if (a) await keyA(false);
    await step(25);
    return hit;
  };
  const s0 = await state();
  console.log(`${URL}\n  boot: chartLayout ${s0.chart}, approach ${s0.ap.toFixed(3)}, auto ${s0.auto}, the gizmo's normal y ${s0.ny?.toFixed(2)}`);
  // 1. which way is IN: a short approach drag up
  const FAR = process.env.MODE === "rim" || process.env.MODE === "press"; // measured far out: no approach
  if (!FAR) await drag("probe", 250, 500, 0, -5, 12, true, null);
  const s1 = await state();
  const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
  // 2. in, until the automatic tilt's latch is on
  let auto = s1.auto || FAR;
  for (let i = 0; i < 10 && !auto; i++) auto = await drag("approach-in", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, 110, true, (s) => s.auto);
  const s2 = await state();
  console.log(`  after the approach in: approach ${s2.ap.toFixed(3)}, auto ${s2.auto}, tilt ${s2.tilt}, normal y ${s2.ny?.toFixed(2)}`);
  if (process.env.MODE === "rim") {
    const RIM = +(process.env.RIM ?? 0.2475), PX = +(process.env.PX ?? 2);
    const g0 = (await state()).gx;
    // which way on the glass takes the gizmo toward +x
    await drag("rim-probe", 600, 560, PX, 0, 10, false, null);
    const g1 = (await state()).gx;
    const sgn = g1 > g0 ? 1 : -1;
    console.log(`  the gizmo's x ${g0.toFixed(3)} → ${g1.toFixed(3)} for a dx to the right: toward the +x tip the finger goes ${sgn > 0 ? "right" : "left"}`);
    let o = false;
    for (let i = 0; i < 6 && !o; i++) o = await drag("rim-out", sgn > 0 ? 300 : 900, 560, sgn * PX, 0, 280, false, (s) => s.gx > RIM + 0.05);
    console.log(`  out: the gizmo's x ${(await state()).gx.toFixed(3)}`);
    let b = false;
    for (let i = 0; i < 6 && !b; i++) b = await drag("rim-back", sgn > 0 ? 900 : 300, 560, -sgn * PX, 0, 280, false, (s) => s.gx < RIM - 0.07);
    console.log(`  back: the gizmo's x ${(await state()).gx.toFixed(3)}`);
    // the view's turn against the gizmo's travel, frame by frame, near the rim
    const C = await ev("window.__cam");
    const sub = (a, b2) => [a[0] - b2[0], a[1] - b2[1], a[2] - b2[2]], len = (a) => Math.hypot(a[0], a[1], a[2]);
    const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
    const ang = (a, b2) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b2[0] + a[1] * b2[1] + a[2] * b2[2]))) * 180) / Math.PI;
    const look = C.map((x) => unit(sub([x[4], x[5], x[6]], [x[1], x[2], x[3]])));
    for (const leg of ["rim-out", "rim-back"]) {
      const rows = [];
      for (let i = 1; i < C.length; i++) {
        if (C[i][0] !== leg || C[i - 1][0] !== leg) continue;
        const gx = C[i][12], dg = len(sub([C[i][12], C[i][13], C[i][14]], [C[i - 1][12], C[i - 1][13], C[i - 1][14]])) * 1000;
        rows.push({ gx, dg, turn: ang(look[i - 1], look[i]), sV: C[i][15] });
      }
      const near = rows.filter((r) => Math.abs(r.gx - RIM) < 0.045 && r.dg > 1e-6);
      const far = rows.filter((r) => r.gx < RIM - 0.08 && r.dg > 1e-6);
      const med = (v) => { const q = [...v].sort((a, b2) => a - b2); return q.length ? q[Math.floor(q.length / 2)] : 0; };
      console.log(`  ${leg}: the view's turn in a frame — on the rectangle away from the edge: median ${med(far.map((r) => r.turn)).toFixed(2)}°; within 45 mm of the edge: largest ${Math.max(0, ...near.map((r) => r.turn)).toFixed(2)}°`);
      // a strip of the crossing: every 3rd frame
      const k0 = rows.findIndex((r) => Math.abs(r.gx - RIM) < 0.045);
      const strip = rows.slice(Math.max(0, k0 - 6), k0 + 60).filter((_, j) => j % 3 === 0);
      console.log(`     x mm (rim ${(RIM * 1000).toFixed(0)}) / view °/frame / the calm's eased vertical share:`);
      console.log("     " + strip.map((r) => `${(r.gx * 1000).toFixed(0)}/${r.turn.toFixed(2)}/${Number.isNaN(r.sV) ? "-" : r.sV.toFixed(2)}`).join("  "));
    }
  } else if (process.env.MODE === "press") {
    // A PRESS HELD STILL, far out, the gizmo on a face holding a pole (FACE=top|bottom): what the press alone turns — no finger travel
    const WANT = process.env.FACE === "bottom" ? -1 : 1, NY = +(process.env.NY ?? 0.8), PX = +(process.env.PX ?? 2), DXN = +(process.env.DX ?? 0);
    const gy = async () => JSON.parse(await ev(`JSON.stringify(window.__st.asmGizmoAt ? window.__st.asmGizmoAt[1] : null)`));
    if (DXN !== 0) await drag("press-dx", 600, 300, DXN > 0 ? 1 : -1, 0, Math.abs(DXN), false, null);
    const y0 = await gy();
    await drag("dir-probe", 950, 400, 0, -PX, 8, false, null);
    const y1 = await gy();
    const upDir = y1 >= y0 ? -1 : 1; // the finger's way on the glass that raises the gizmo
    console.log(`  the gizmo's height ${y0} → ${y1} for a finger up the glass`);
    const dir = WANT > 0 ? upDir : -upDir;
    let on = false;
    for (let i = 0; i < 1 && !on; i++) on = await drag("to-face", 950, dir < 0 ? 700 : 100, 0, dir * PX, 340, false, (s) => s.ny !== null && s.ny * WANT > NY);
    await ev(`window.__leg = "settle"`); await step(90);
    const p0 = await state();
    const i0 = (await ev("window.__cam.length")) - 1;
    console.log(`  on the face: ${on}, the gizmo's normal y ${p0.ny?.toFixed(2)}, tilt ${p0.tilt}, auto ${p0.auto}, approach ${p0.ap.toFixed(3)}`);
    await ev(`window.__leg = "still-press"`);
    await mouse("mousePressed", 950, 400, 1); await step(150);
    const p1 = await state();
    await mouse("mouseReleased", 950, 400, 0); await ev(`window.__leg = "after-release"`); await step(40);
    console.log(`  after the press held 150 frames: tilt ${p1.tilt}, the gizmo's normal y ${p1.ny?.toFixed(2)}`);
    const C = await ev("window.__cam");
    const sub = (a, b2) => [a[0] - b2[0], a[1] - b2[1], a[2] - b2[2]], dot = (a, b2) => a[0] * b2[0] + a[1] * b2[1] + a[2] * b2[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
    const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
    const cross = (a, b2) => [a[1] * b2[2] - a[2] * b2[1], a[2] * b2[0] - a[0] * b2[2], a[0] * b2[1] - a[1] * b2[0]];
    const deg = (x) => (x * 180) / Math.PI;
    const F = (i) => { const x = C[i]; const l = unit(sub([x[4], x[5], x[6]], [x[1], x[2], x[3]])); const k = dot([x[7], x[8], x[9]], l); const u = unit([x[7] - k * l[0], x[8] - k * l[1], x[9] - k * l[2]]); return { l, u, r: unit(cross(u, l)), g: [x[12], x[13], x[14]], yaw: x[10], el: x[11] }; };
    const rot = (a, b2) => deg(Math.acos(Math.max(-1, Math.min(1, (dot(a.l, b2.l) + dot(a.u, b2.u) + dot(a.r, b2.r) - 1) / 2))));
    // the roll on the glass: the world's up against the screen's up (0 upright, 180 upside down); looking straight down it has no meaning
    const roll = (a) => { const k = a.l[1]; const w = [-k * a.l[0], 1 - k * a.l[1], -k * a.l[2]]; return len(w) < 0.05 ? NaN : deg(Math.atan2(dot(unit(w), a.r), dot(unit(w), a.u))); };
    const head = (a) => deg(Math.atan2(a.l[2], a.l[0])), down = (a) => deg(Math.asin(Math.max(-1, Math.min(1, -a.l[1]))));
    const a0 = F(i0);
    console.log(`  before the press: the camera's heading ${head(a0).toFixed(1)}°, looking down ${down(a0).toFixed(1)}°, the world's up on the glass ${roll(a0).toFixed(1)}°, the orbit's yaw ${deg(a0.yaw).toFixed(1)}° elevation ${a0.el.toFixed(3)}`);
    for (const k of [1, 2, 5, 10, 20, 40, 80, 150]) {
      const a = F(Math.min(C.length - 1, i0 + k));
      console.log(`     +${String(k).padStart(3)} frames: the view turned ${rot(a0, a).toFixed(1)}° in all — heading ${head(a).toFixed(1)}°, looking down ${down(a).toFixed(1)}°, the world's up on the glass ${roll(a).toFixed(1)}°; the gizmo moved ${(len(sub(a.g, a0.g)) * 1000).toFixed(1)} mm; the camera moved ${(len(sub([C[Math.min(C.length - 1, i0 + k)][1], C[Math.min(C.length - 1, i0 + k)][2], C[Math.min(C.length - 1, i0 + k)][3]], [C[i0][1], C[i0][2], C[i0][3]])) * 1000).toFixed(0)} mm`);
    }
    let worst = 0; for (let i = i0 + 1; i <= Math.min(C.length - 1, i0 + 150); i++) worst = Math.max(worst, rot(F(i - 1), F(i)));
    console.log(`  the largest turn of the view in ONE frame while the press is held still: ${worst.toFixed(2)}°`);
  } else if (process.env.MODE === "ridge") {
    // CLOSE IN, a dy up the front top face to the ridge and over it; then the same dy kept (the hold: no way back); then the dy reversed (down the far face)
    const PX = +(process.env.PX ?? 3);
    const fmt = (s) => `normal (y ${s.ny?.toFixed(2)}, z ${s.nz?.toFixed(2)}), the gizmo (y ${((s.gy ?? NaN) * 1000).toFixed(0)}, z ${((s.gz ?? NaN) * 1000).toFixed(0)}) mm, yaw ${((s.yaw * 180) / Math.PI).toFixed(1)}°, elevation ${s.el.toFixed(3)}, tilt ${s.tilt}, hold ${s.hold}, turning ${s.mix}`;
    const a0 = await state();
    console.log(`  start: ${fmt(a0)}`);
    let top = false;
    for (let i = 0; i < 8 && !top; i++) top = await drag("to-top-face", 950, 700, 0, -PX, 140, false, (s) => s.ny !== null && s.ny > 0.8);
    const a1 = await state();
    console.log(`  on the top face: ${top} — ${fmt(a1)}`);
    // ONE drag up, long: the crossing, then the same dy kept in the SAME gesture (the hold: no way back); every 4 frames the yaw, the hold, the turn
    const watch = (rows) => (s) => { rows.push({ yaw: s.yaw, hold: s.hold, mix: s.mix, el: s.el }); return false; };
    const crossings = (rows) => { let n = 0, heldAfter = 0, after = 0; for (let i = 1; i < rows.length; i++) { const d = Math.abs(Math.atan2(Math.sin(rows[i].yaw - rows[i - 1].yaw), Math.cos(rows[i].yaw - rows[i - 1].yaw))); if (d > 1.5) n++; if (n > 0) { after++; if (rows[i].hold) heldAfter++; } } return `crossings ${n}; after the first: the dy hold on in ${heldAfter} of ${after} readings`; };
    const r1 = [];
    await drag("ridge-up", 950, 700, 0, -PX, 230, false, watch(r1));
    await ev(`window.__leg = "ridge-settle"`); await step(60);
    const a2 = await state();
    console.log(`  ONE drag up over the ridge (230 frames): ${crossings(r1)} — ${fmt(a2)}`);
    await drag("ridge-reversed", 950, 300, 0, PX, 45, false, null);
    const a4 = await state();
    console.log(`  the dy reversed 45 frames: ${fmt(a4)}`);
    const r2 = [];
    await drag("ridge-back-up", 950, 700, 0, -PX, 230, false, watch(r2));
    await ev(`window.__leg = "ridge-settle2"`); await step(60);
    const a5 = await state();
    console.log(`  ONE drag back up over the ridge (230 frames): ${crossings(r2)} — ${fmt(a5)}`);
  } else if (process.env.MODE === "out") {
    // THE WAY OUT OF CLOSE IN (TILTED_POLE_CLOSE_IN.md §8): onto the top by dy (the tilt made), the gizmo brought to GZ (m, the top's depth from the
    // front edge at z ≈ -0.05: its far half beyond ~0.19), a dx if asked, then ONE approach drag OUT past the threshold and on
    const GZ = +(process.env.GZ ?? 0.33), OUTPX = +(process.env.OUTPX ?? 1), DXN = +(process.env.DX ?? 0);
    let tilt = false;
    for (let i = 0; i < 6 && !tilt; i++) tilt = await drag("orbit-dy-up", 950, 700, 0, -5, 110, false, (s) => s.tilt !== null);
    await ev(`window.__leg = "settle"`); await step(40);
    let at = (await state()).gz >= GZ;
    for (let i = 0; i < 6 && !at; i++) at = await drag("to-place", 950, 700, 0, -2, 160, false, (s) => s.gz !== null && s.gz >= GZ);
    if (DXN !== 0) await drag("to-side", 600, 400, DXN > 0 ? 2 : -2, 0, Math.abs(DXN), false, null);
    await ev(`window.__leg = "settle"`); await step(60);
    const p0 = await state();
    console.log(`  on the top, close in: tilt ${p0.tilt}, the gizmo (x ${((p0.gx ?? NaN) * 1000).toFixed(0)}, z ${((p0.gz ?? NaN) * 1000).toFixed(0)}) mm, normal y ${p0.ny?.toFixed(2)}, approach ${p0.ap.toFixed(3)}, auto ${p0.auto}`);
    const i0 = await ev("window.__cam.length");
    await drag("out", 250, inDy < 0 ? 100 : 700, 0, -inDy * OUTPX, 520, true, (s) => s.ap > p0.ap + 0.3);
    await ev(`window.__leg = "out-settle"`); await step(150);
    const p1 = await state();
    console.log(`  after the approach out: approach ${p1.ap.toFixed(3)}, auto ${p1.auto}, tilt ${p1.tilt}, the gizmo (x ${((p1.gx ?? NaN) * 1000).toFixed(0)}, z ${((p1.gz ?? NaN) * 1000).toFixed(0)}) mm`);
    const C = await ev("window.__cam");
    const sub = (a, b2) => [a[0] - b2[0], a[1] - b2[1], a[2] - b2[2]], dot = (a, b2) => a[0] * b2[0] + a[1] * b2[1] + a[2] * b2[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
    const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
    const cross = (a, b2) => [a[1] * b2[2] - a[2] * b2[1], a[2] * b2[0] - a[0] * b2[2], a[0] * b2[1] - a[1] * b2[0]];
    const deg = (x) => (x * 180) / Math.PI;
    const F = (i) => { const x = C[i]; const l = unit(sub([x[4], x[5], x[6]], [x[1], x[2], x[3]])); const k = dot([x[7], x[8], x[9]], l); const u = unit([x[7] - k * l[0], x[8] - k * l[1], x[9] - k * l[2]]); return { l, u, r: unit(cross(u, l)) }; };
    const rot = (a, b2) => deg(Math.acos(Math.max(-1, Math.min(1, (dot(a.l, b2.l) + dot(a.u, b2.u) + dot(a.r, b2.r) - 1) / 2))));
    const dist = (i) => len(sub([C[i][16], C[i][17], C[i][18]], [C[i][12], C[i][13], C[i][14]]));
    let k0 = -1;
    for (let i = Math.max(1, i0); i < C.length; i++) if (C[i - 1][30] === 1 && C[i][30] === 0) { k0 = i; break; }
    if (k0 < 0) console.log("  the latch never turned off");
    else {
      const per = []; let total = 0;
      for (let i = k0; i < C.length; i++) { const t = rot(F(i - 1), F(i)); per.push(t); total += t; }
      const whole = rot(F(k0 - 1), F(C.length - 1));
      let acc = 0, k95 = per.length - 1;
      for (let j = 0; j < per.length; j++) { acc += per[j]; if (acc >= 0.95 * total) { k95 = j; break; } }
      const turning = per.filter((_, j) => C[k0 + j][21] === 1).length;
      let gz = 0; for (let i = k0; i <= Math.min(C.length - 1, k0 + k95); i++) gz = Math.max(gz, len(sub([C[i][12], C[i][13], C[i][14]], [C[k0 - 1][12], C[k0 - 1][13], C[k0 - 1][14]])) * 1000);
      console.log(`  THE WAY OUT: the latch off at frame ${k0 - i0} of the approach (the piece ${(dist(k0) * 1000).toFixed(0)} mm from the gizmo). From there the view turned ${total.toFixed(0)}° along its path (${whole.toFixed(0)}° from start to end), 95 % of it within ${k95 + 1} frames = ${((k95 + 1) / 60).toFixed(2)} s, at most ${Math.max(...per).toFixed(1)}° in one frame; meanwhile the piece backed out ${((dist(Math.min(C.length - 1, k0 + k95)) - dist(k0)) * 1000).toFixed(0)} mm; frames marked "a turn runs" ${turning}; the gizmo moved at most ${gz.toFixed(1)} mm`);
      console.log("     frame (from the latch off) / the piece's distance mm / view °/frame / a turn runs / leg — every 4th frame:");
      const strip = [];
      for (let i = Math.max(1, k0 - 8); i <= Math.min(C.length - 1, k0 + 100); i += 4) strip.push(`${i - k0}/${(dist(i) * 1000).toFixed(0)}/${rot(F(i - 1), F(i)).toFixed(2)}/${C[i][21]}/${C[i][0] === "out" ? "o" : "s"}`);
      console.log("     " + strip.join("  "));
    }
  } else if (process.env.MODE === "pole") {
    // the zenith first (far out again), then in until the automatic tilt is made there, then out past its threshold
    let out0 = false;
    for (let i = 0; i < 10 && !out0; i++) out0 = await drag("approach-out0", 250, inDy < 0 ? 100 : 700, 0, -inDy * 5, 110, true, (s) => !s.auto);
    let top = false;
    for (let i = 0; i < 8 && !top; i++) top = await drag("to-zenith", 950, 700, 0, -5, 110, false, (s) => s.el >= 0.99999);
    const z0 = await state();
    console.log(`  at the zenith: elevation ${z0.el.toFixed(5)}, tilt ${z0.tilt}, auto ${z0.auto}`);
    let a1 = false;
    for (let i = 0; i < 10 && !a1; i++) a1 = await drag("approach-in2", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, 110, true, (s) => s.auto && s.tilt !== null);
    await step(60);
    const z1 = await state();
    console.log(`  after the approach in: elevation ${z1.el.toFixed(5)}, tilt ${z1.tilt}, auto ${z1.auto}`);
    let a2 = false;
    for (let i = 0; i < 10 && !a2; i++) a2 = await drag("approach-out2", 250, inDy < 0 ? 100 : 700, 0, -inDy * 5, 110, true, (s) => !s.auto);
    await ev(`window.__leg = "settle"`); await step(150);
    const z2 = await state();
    console.log(`  after the approach out: elevation ${z2.el.toFixed(5)}, tilt ${z2.tilt}, auto ${z2.auto}`);
  } else {
  // 3. orbit by dy until a tilt is on (first up the glass, then down)
  let tilt = s2.tilt !== null;
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 6 && !tilt; i++) tilt = await drag(`orbit-dy${dir < 0 ? "-up" : "-down"}`, 950, dir < 0 ? 700 : 100, 0, dir * 5, 110, false, (s) => s.tilt !== null);
    if (tilt) break;
  }
  const s3 = await state();
  console.log(`  after the orbit by dy: tilt ${s3.tilt}, normal y ${s3.ny?.toFixed(2)}, elevation ${s3.el.toFixed(3)}`);
  // 3b. SWITCH=1: the piece switched under the tilt / in the zone (the test scenes' piece switch — `spawnOrbitPiece`, not at the boot)
  if (process.env.SWITCH) {
    const full = () => ev(`(() => { const s = window.__st; return JSON.stringify({ kind: s.orbitPieceKind, pieces: s.orbitPieces.length, tilt: s.asmTilt ? s.asmTilt.id : null, zone: s.asmZone ? s.asmZone.zone.orientation : null,
      auto: !!s.asmTiltAuto, pend: !!s.asmTiltPending, mapQ: s.asmMapQ ? [s.asmMapQ.yaw, s.asmMapQ.pitch].map((x) => +x.toFixed(3)) : null, shown: !!s.asmShown, calm: !!s.asmCalm, hold: !!s.asmEdgeHold, mix: !!s.asmZoneMix,
      yaw: +s.orbit.yaw.toFixed(3), el: +s.orbit.elevation.toFixed(3), boot: [+s.bootYawRad.toFixed(3), +s.bootElevation.toFixed(3)], pieceQ: s.pieceQ ? [+s.pieceQ.yaw.toFixed(3), +s.pieceQ.v.toFixed(3)] : null,
      g: s.asmG ? s.asmG.map((x) => +x.toFixed(3)) : null, ap: +s.approach.toFixed(3), frames: s.frames }); })()`);
    console.log(`  SWITCH before: ${await full()}`);
    await ev(`window.__leg = "switch"; window.__st.cfg.orbitPieceKind = window.__st.orbitPieceKind === 0 ? 1 : 0; true`);
    await step(1);
    console.log(`  SWITCH +1 frame: ${await full()}`);
    await step(60);
    console.log(`  SWITCH +61 frames: ${await full()}`);
  }
  // 4. orbit in the tilt: a dx, a dy, a dx back
  await drag("tilt-dx", 400, 400, 4, 0, 60, false, null);
  await drag("tilt-dy", 600, 400, 0, 4, 40, false, null);
  await drag("tilt-dx-back", 700, 400, -4, 0, 60, false, null);
  const s4 = await state();
  console.log(`  after orbiting in it: tilt ${s4.tilt}, normal y ${s4.ny?.toFixed(2)}`);
  // 5. back out past the threshold
  let out = false;
  for (let i = 0; i < 10 && !out; i++) out = await drag("approach-out", 250, inDy < 0 ? 100 : 700, 0, -inDy * 5, 110, true, (s) => !s.auto);
  await step(180);
  const s5 = await state();
  console.log(`  after the approach out: approach ${s5.ap.toFixed(3)}, auto ${s5.auto}, tilt ${s5.tilt}`);
  }
  // the largest roll and view turn in one frame, by leg
  {
    const C = await ev("window.__cam");
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
    const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const ang = (a, b) => (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;
    const look = C.map((x) => unit(sub([x[4], x[5], x[6]], [x[1], x[2], x[3]])));
    const up = C.map((x, i) => { const u = [x[7], x[8], x[9]], l = look[i], k = dot(u, l); return unit([u[0] - k * l[0], u[1] - k * l[1], u[2] - k * l[2]]); });
    const worst = new Map();
    for (let i = 1; i < C.length; i++) {
      const ax = cross(look[i - 1], look[i]), sn = len(ax), cs = dot(look[i - 1], look[i]);
      let u0 = up[i - 1];
      if (sn > 1e-12) { const k = unit(ax), kxu = cross(k, u0), kd = dot(k, u0); u0 = [0, 1, 2].map((j) => u0[j] * cs + kxu[j] * sn + k[j] * kd * (1 - cs)); }
      const roll = ang(unit(u0), up[i]), turn = ang(look[i - 1], look[i]);
      const w = worst.get(C[i][0]) ?? { roll: 0, turn: 0, yaw0: C[i][10], yaw1: 0, g: 0 };
      w.roll = Math.max(w.roll, roll); w.turn = Math.max(w.turn, turn); w.yaw1 = C[i][10];
      { const dg = Math.hypot(C[i][12] - C[i - 1][12], C[i][13] - C[i - 1][13], C[i][14] - C[i - 1][14]) * 1000; if (dg === dg) { w.g = Math.max(w.g, dg); if (C[i][21] === 1 && C[i - 1][21] === 1) w.gt = Math.max(w.gt ?? 0, dg); } }
      { const gp = Math.hypot(C[i][19], C[i][20]) * 180 / Math.PI; if (gp === gp) { if (C[i][21] === 1) w.gapT = Math.max(w.gapT ?? 0, gp); else w.gapR = Math.max(w.gapR ?? 0, gp); } }
      { const pc = (j) => { const x = C[j]; const v = [x[16] - x[1], x[17] - x[2], x[18] - x[3]]; const l = Math.hypot(v[0], v[1], v[2]); const lk = look[j], u = up[j], r = cross(u, lk); return l > 0 ? [dot(v, r) / l, dot(v, u) / l, dot(v, lk) / l] : null; };
        const a0 = pc(i - 1), a1 = pc(i); if (a0 && a1 && a0[0] === a0[0] && a1[0] === a1[0]) { const an = ang(a0, a1); w.pg = Math.max(w.pg ?? 0, an); } }
      worst.set(C[i][0], w);
    }
    if (process.env.SHOW) {
      let im = -1, m = -1;
      for (let i = 1; i < C.length; i++) { if (C[i][0] !== process.env.SHOW) continue; const t = ang(look[i - 1], look[i]); if (t > m) { m = t; im = i; } }
      console.log(`  frames round the largest view turn of leg ${process.env.SHOW} (frame ${im}): turn° / roll° / gizmo mm / turn's share k (−1 none) / paced / tilt id / pending / blend mm / dir ease° / turn whole°`);
      for (let i = Math.max(1, im - 8); i <= Math.min(C.length - 1, im + 14); i++) {
        const ax = cross(look[i - 1], look[i]), sn = len(ax), cs = dot(look[i - 1], look[i]); let u0 = up[i - 1];
        if (sn > 1e-12) { const k = unit(ax), kxu = cross(k, u0), kd = dot(k, u0); u0 = [0, 1, 2].map((j) => u0[j] * cs + kxu[j] * sn + k[j] * kd * (1 - cs)); }
        const dg = Math.hypot(C[i][12] - C[i - 1][12], C[i][13] - C[i - 1][13], C[i][14] - C[i - 1][14]) * 1000;
        console.log(`     ${String(i).padStart(5)} ${C[i][0].padEnd(12)} ${ang(look[i - 1], look[i]).toFixed(2).padStart(6)} ${ang(unit(u0), up[i]).toFixed(2).padStart(6)} ${dg.toFixed(1).padStart(6)}  k ${Number(C[i][22]).toFixed(3)}  paced ${C[i][23]}  tilt ${C[i][24]}  pend ${C[i][25]}  blend ${Number(C[i][26]).toFixed(1)}  ease ${Number(C[i][27]).toFixed(2)}  whole ${Number(C[i][28]).toFixed(1)}`);
      }
    }
    console.log("  the largest roll / view turn in ONE frame, by leg (and the orbit's yaw at its start → end):");
    // THE SUMMARY (ORBIT_GATES.md's baseline columns), every recorded frame: the view's whole turn (look and roll) per frame, the tilts, the holds
    {
      const Fm = (i) => { const l = look[i], u = up[i]; return { l, u, r: unit(cross(u, l)) }; };
      const rotF = (a, b) => (Math.acos(Math.max(-1, Math.min(1, (dot(a.l, b.l) + dot(a.u, b.u) + dot(a.r, b.r) - 1) / 2))) * 180) / Math.PI;
      let big = 0, all = 0, made = 0, left = 0, holds = 0;
      for (let i = 1; i < C.length; i++) { const t = rotF(Fm(i - 1), Fm(i)); if (t === t) { big = Math.max(big, t); all += t; } if (C[i][24] !== 0 && C[i - 1][24] === 0) made++; if (C[i][24] === 0 && C[i - 1][24] !== 0) left++; if (C[i][31] === 1 && C[i - 1][31] !== 1) holds++; }
      console.log(`  SUMMARY (${C.length} frames): the view's largest turn in one frame ${big.toFixed(1)}°, in all ${all.toFixed(0)}°; tilts made ${made}, left ${left}; dy holds set ${holds}`);
    }
    for (const [leg, w] of worst) console.log(`     ${leg.padEnd(14)} roll ${w.roll.toFixed(1)}°, turn ${w.turn.toFixed(1)}°, the gizmo ${w.g.toFixed(1)} mm (while a turn runs ${(w.gt ?? 0).toFixed(1)}), orbit≠map ${(w.gapR ?? 0).toFixed(2)}° (in a turn ${(w.gapT ?? 0).toFixed(2)}°), the piece on the glass ${(w.pg ?? 0).toFixed(2)}°, yaw ${w.yaw0.toFixed(3)} → ${w.yaw1.toFixed(3)}`);
  }
  const log = await ev("window.__log");
  const err = await ev("window.__recErr ?? window.__stepErr ?? null");
  console.log(`  errors ${errors}, recErr ${err}; the tilt's state, every change (${log.length}):`);
  for (const l of log) console.log(`   f${String(l.f).padStart(4)} ${l.leg.padEnd(14)} ap ${l.ap.toFixed(3)} el ${l.el.toFixed(2)} auto ${l.auto ? 1 : 0} pend ${l.pend ? 1 : 0} tilt ${String(l.tilt).padEnd(6)} zone ${l.zone} n ${l.n} up ${l.up.join(",")} | ${l.v}`);
  ws.close();
} finally {
  kill();
  for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } }
  clearTimeout(watchdog);
}
