// THE EDGE RUN (2026-11-16, step 2.4d): close in, the gizmo parked just short of an edge, then the orbit's own angle wobbled across that edge
// (a sine of +-AMM mm on the model) for RUN frames: how often the facet, the tilt, the square camera's target flip, and how far the view turns.
// A deterministic headless run (the replay probe's virtual clock).
//   URL=http://127.0.0.1:5191/?sceneIndex=1&idleOrbitOn=0&idleOrbitOn=0 EDGE=top|side AMM=2.5 OFFMM=0 RUN=240 [PARKTILT=1] [TRACE=1] node scripts/probes/edge_noise.mjs
//   (scripts/probes/edge_batch.sh starts a dev server and stops it — the runbook: scripts/probes/ORBIT_GATES.md)
import { guardProbe } from "./probe_guard.mjs";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.URL;
const S0 = +(process.env.S0 ?? 0) / 1000, A = +(process.env.A ?? 0), PX = +(process.env.PX ?? 3), PERIOD = +(process.env.PERIOD ?? 40), IN = !!process.env.IN;
const RIM = +(process.env.RIM ?? 0.2475);
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_edge_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); else chrome.kill(); };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(2); }, 8 * 60_000);
watchdog.unref();
guardProbe({ chromePid: chrome.pid, prof, ms: 8 * 60_000 + 30_000 }); // (2026-11-16) the deadline in a process of its own: the timer above cannot fire while a write to a dead pipe blocks this loop (probe_guard.mjs)

const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;
const REC = `(() => { const st = window.__st; window.__rows = []; window.__leg = "start"; window.__verd = []; let lastV = "";
  window.__frame = () => { try {
    const c = st.camera; const g = st.asmGizmoAt; const n = st.gizmoNormal; const t = c.getTarget();
    const v = String(st.lastVerdict ?? "");
    if (v !== lastV) { lastV = v; window.__verd.push([window.__rows.length, window.__leg, v.slice(0, 120)]); }
    window.__rows.push([window.__leg, c.position.x, c.position.y, c.position.z, t.x, t.y, t.z, c.upVector.x, c.upVector.y, c.upVector.z,
      g ? g[0] : NaN, g ? g[1] : NaN, g ? g[2] : NaN, n ? n[0] : NaN, n ? n[1] : NaN, n ? n[2] : NaN,
      st.asmSpitSide ?? 0, st.asmZoneMix ? 1 : 0, st.asmEdgeHold ? 1 : 0, st.orbit.yaw, st.orbit.elevation, st.approach, st.asmTilt ? 1 : 0, st.asmTilt ? st.asmTilt.id : 0, st.asmShown ? st.asmShown.t.stack : -1, ...(st.asmSquare && st.asmSquare.target ? st.asmSquare.target : [0, 0, 0])]);
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
  await ev(REC);
  const step = (n) => ev(`window.__step(${n})`);
  const state = async () => JSON.parse(await ev(`(() => { const s = window.__st; const n = s.gizmoNormal; const g = s.asmGizmoAt; const z = s.asmZone; return JSON.stringify({ ap: s.approach, auto: !!s.asmTiltAuto,
    tilt: s.asmTilt ? s.asmTilt.id : null, n: n ? [n[0], n[1], n[2]] : null, g: g ? [g[0], g[1], g[2]] : null, side: s.asmSpitSide ?? 0, zone: z ? z.zone.orientation : null, axis: z ? [z.zone.axis[0], z.zone.axis[1], z.zone.axis[2]] : null, pole: z && z.zone.poles.length ? [z.zone.poles[0][0], z.zone.poles[0][1], z.zone.poles[0][2]] : null,
    mapN: s.asmShown ? [s.asmShown.t.normal[0], s.asmShown.t.normal[1], s.asmShown.t.normal[2]] : null, band: s.asmShown ? s.asmShown.t.band : null, stack: s.asmShown ? s.asmShown.t.stack : -1, hold: !!s.asmEdgeHold, mix: !!s.asmZoneMix, el: s.orbit.elevation, yaw: s.orbit.yaw }); })()`));
  let EVERY = 4;
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const keyA = (down) => send("Input.dispatchKeyEvent", down ? { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 } : { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
  // one drag of n frames; (dx, dy) px a frame, or a function k → [dx, dy]; `until` read every 4 frames
  const drag = async (leg, x, y, d, n, a, until) => {
    await ev(`window.__leg = "${leg}"`);
    if (a) await keyA(true);
    await mouse("mousePressed", x, y, 1); await step(2);
    let hit = false;
    for (let k = 0; k < n && !hit; k++) {
      const [dx, dy] = typeof d === "function" ? d(k) : d;
      x = Math.max(5, Math.min(1195, x + dx)); y = Math.max(5, Math.min(795, y + dy));
      await mouse("mouseMoved", x, y, 1); await step(1);
      if (until && k % EVERY === EVERY - 1) hit = until(await state());
    }
    await step(12); // the finger rests before it lifts: no coast after the release
    await mouse("mouseReleased", x, y, 0);
    if (a) await keyA(false);
    await step(25);
    return hit;
  };
  const startOf = (d) => [d[0] > 0 ? 200 : d[0] < 0 ? 1000 : 600, d[1] > 0 ? 150 : d[1] < 0 ? 700 : 400];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // the finger's way that raises `obj` the most here (6-frame probes, each undone)
  const bestDir = async (leg, obj, px) => {
    let best = null;
    for (const d of DIRS) {
      const o0 = obj(await state());
      await drag(`${leg}-probe`, 600, 400, [d[0] * px, d[1] * px], 6, false, null);
      const o1 = obj(await state());
      await drag(`${leg}-probe`, 600, 400, [-d[0] * px, -d[1] * px], 6, false, null);
      if (best === null || o1 - o0 > best.gain) best = { d, gain: o1 - o0 };
    }
    return best;
  };
  const climb = async (leg, obj, pred, rounds = 14, px = 3, slack = 0.004) => {
    for (let r = 0; r < rounds; r++) {
      if (pred(await state())) return true;
      const b = await bestDir(leg, obj, px);
      if (!(b.gain > 1e-5)) { px = Math.min(8, px * 1.5); continue; }
      let top = obj(await state());
      const [sx, sy] = startOf(b.d);
      await drag(leg, sx, sy, [b.d[0] * px, b.d[1] * px], 110, false, (s) => { const v = obj(s); if (pred(s)) return true; if (v < top - slack) return true; top = Math.max(top, v); return false; });
    }
    return pred(await state());
  };
  // ───────── THE EDGE RUN: close in, the gizmo parked just short of an edge, then ONE drag ALONG the edge with a wobble across it ─────────
  //   EDGE=top  : a side face's top edge (the face holding the top pole beyond it)      EDGE=side : the vertical edge between two side faces
  //   AMM       : the wobble's half width across the edge, in millimetres ON THE MODEL (converted by a calibration drag)
  //   OFFMM     : the run's distance from the edge (0: on it; a control run: 20)
  const EDGE = process.env.EDGE ?? "top", AMM = +(process.env.AMM ?? 2), OFFMM = +(process.env.OFFMM ?? 0), RUN = +(process.env.RUN ?? 200);
  const s0 = await state();
  const f3 = (v) => v.map((x) => (x * 1000).toFixed(0)).join(",");
  console.log(`${URL}\n  boot: zone ${s0.zone}, approach ${s0.ap.toFixed(3)}, the gizmo (${f3(s0.g)}) mm, normal [${s0.n.map((x) => x.toFixed(2))}], facet ${s0.stack}`);
  {
    await drag("probe", 250, 500, [0, -5], 12, true, null);
    const s1 = await state();
    const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
    let auto = s1.auto;
    for (let i = 0; i < 10 && !auto; i++) auto = await drag("approach-in", 250, inDy < 0 ? 700 : 100, [0, inDy * 5], 110, true, (s) => s.auto);
    await step(60);
    const s2 = await state();
    console.log(`  close in: approach ${s2.ap.toFixed(3)}, auto ${s2.auto}, tilt ${s2.tilt}, the gizmo (${f3(s2.g)}) mm, normal [${s2.n.map((x) => x.toFixed(2))}], facet ${s2.stack}`);
  }
  // across: the model direction that crosses the edge (signed coordinate `acr`, growing toward the face beyond); along: the edge's own
  const start = await state();
  const n0 = start.n, g00 = start.g;
  const beyond = EDGE === "top" ? (s) => s.mapN !== null && s.mapN[1] > 0.7 : (s) => s.mapN !== null && (s.mapN[0] * n0[0] + s.mapN[1] * n0[1] + s.mapN[2] * n0[2]) < 0.7 && Math.abs(s.mapN[1]) < 0.5;
  const tng = (() => { const l = Math.hypot(n0[2], n0[0]); return l > 1e-6 ? [-n0[2] / l, 0, n0[0] / l] : [1, 0, 0]; })(); // the level direction along the start face
  const depth = (g) => -((g[0] - g00[0]) * n0[0] + (g[1] - g00[1]) * n0[1] + (g[2] - g00[2]) * n0[2]); // behind the first face's plane: on the face beyond
  const flat = EDGE === "top" ? (g) => g[1] : (g) => g[0] * tng[0] + g[2] * tng[2];
  const acrOf = (g) => flat(g) + Math.max(0, depth(g));
  const alongOf = EDGE === "top" ? (g) => g[0] * tng[0] + g[2] * tng[2] : (g) => g[1];
  // the finger's ways, read far from the edge (12 px probes)
  const bAcr = await bestDir("dir", (s) => (EDGE === "side" && process.env.SIGN === "-1" ? -1 : 1) * flat(s.g), 2);
  const mmPerPx = Math.max(0.05, (bAcr.gain * 1000) / 12);
  const bAl = await bestDir("dir2", (s) => alongOf(s.g), 2);
  const sgn = EDGE === "side" && process.env.SIGN === "-1" ? -1 : 1;
  const acrS = (g) => sgn * flat(g) + Math.max(0, depth(g));
  // 1. to the edge at one pixel a frame, read EVERY frame: stopped on the first frame the face beyond is under the gizmo
  EVERY = 1;
  const [ex, ey] = startOf(bAcr.d);
  let crossed = false;
  for (let i = 0; i < 12 && !crossed; i++) crossed = await drag("to-edge", ex, ey, [bAcr.d[0], bAcr.d[1]], 400, false, beyond);
  EVERY = 4;
  const sE = await state();
  const edgeAt = acrS(sE.g) - Math.max(0, depth(sE.g));
  console.log(`  one pixel = ${mmPerPx.toFixed(2)} mm on the model here; over the edge: ${crossed} — the gizmo (${f3(sE.g)}) mm, normal [${sE.n.map((x) => x.toFixed(2))}], facet ${sE.stack}, tilt ${sE.tilt}, ${(Math.max(0, depth(sE.g)) * 1000).toFixed(1)} mm past it`);
  if (process.env.PARKTILT) {
    // parked by the orbit's own angle in small steps (a pixel of finger is 3 – 7 mm of surface here): back to 1.5 – 2 mm short of the edge
    const nud = async (d, n) => { await ev(`(() => { const s = window.__st; s.orbit.reset(s.orbit.yaw, s.orbit.elevation + (${d})); return true; })()`); await step(n); };
    await ev(`window.__leg = "off"`);
    const a0 = (edgeAt - acrS((await state()).g)) * 1000;
    await nud(-0.0005, 6);
    const a1 = (edgeAt - acrS((await state()).g)) * 1000;
    const sg = a1 >= a0 ? -1 : 1;
    for (let i = 0; i < 60 && (edgeAt - acrS((await state()).g)) * 1000 < +(process.env.PARKMM ?? 1.5); i++) await nud(sg * 0.0004, 6);
  } else
  { EVERY = 1; await drag("off", 600, 400, [-bAcr.d[0] * 0.5, -bAcr.d[1] * 0.5], 600, false, (s) => (edgeAt - acrS(s.g)) * 1000 >= Math.max(1, OFFMM) && (process.env.PARKTILT ? true : !beyond(s) && s.tilt === null)); EVERY = 4; }
  await ev(`window.__leg = "settle2"`); await step(90);
  const sP = await state();
  console.log(`  parked ${((edgeAt - acrS(sP.g)) * 1000).toFixed(1)} mm short of the edge (negative: past it) — the gizmo (${f3(sP.g)}) mm, normal [${sP.n.map((x) => x.toFixed(2))}], facet ${sP.stack}, tilt ${sP.tilt}`);
  // 2. THE RUN: along the edge, a wobble of ±AMM across
  if (process.env.TRACE) {
    const Rt = await ev("window.__rows"); const Vt = await ev("window.__verd");
    const legs = new Set(["to-edge", "off", "settle2"]);
    let last = "";
    for (let i = 1; i < Rt.length; i++) { if (!legs.has(Rt[i][0])) continue; const g = [Rt[i][10], Rt[i][11], Rt[i][12]]; const line = `${Rt[i][0].padEnd(8)} short ${((edgeAt - acrS(g)) * 1000).toFixed(1).padStart(6)} mm  tilt ${Rt[i][23]}  turning ${Rt[i][17]}  facet ${Rt[i][24]}  el ${Number(Rt[i][20]).toFixed(4)}`; const key = line.slice(9); if (key !== last) { console.log(`     f${i} ${line}`); last = key; } }
    console.log("     verdicts: " + Vt.filter((v) => legs.has(v[1])).map((v) => `f${v[0]} [${v[1]}] ${v[2].slice(0, 60)}`).join(" | "));
  }
  // THE RUN: the ORBIT's own angle wobbled (a sine of ±AMM on the model, period 24 frames) — the place's noise, whatever its source (the finger past the
  // deadband, the solver, a coast); as the pointer's step does, no step while a camera turn runs or a tilt's exit is asked
  const AXIS = EDGE === "top" ? "v" : "yaw";
  const nudge = async (d, n) => { await ev(`(() => { const s = window.__st; ${AXIS === "v" ? `s.orbit.reset(s.orbit.yaw, s.orbit.elevation + (${d}))` : `s.orbit.reset(s.orbit.yaw + (${d}), s.orbit.elevation)`}; return true; })()`); await step(n); };
  // the calibration: millimetres across for a unit of the angle, away from the edge
  const cal0 = acrS((await state()).g);
  const CAL = AXIS === "v" ? (process.env.PARKTILT ? -0.0012 : -0.003) : 0.01;
  await nudge(CAL, 50);
  const cal1 = acrS((await state()).g);
  await nudge(-CAL, 50);
  const mmPerUnit = ((cal1 - cal0) * 1000) / CAL; // signed: the angle's way toward the face beyond
  const sQ = await state();
  const Aunit = AMM / Math.abs(mmPerUnit) * Math.sign(mmPerUnit || 1);
  const HALFP = +(process.env.PERIOD ?? 24);
  const Apx = AMM;
  console.log(`  one unit of the orbit's ${AXIS === "v" ? "elevation" : "yaw"} = ${mmPerUnit.toFixed(0)} mm across here; after the calibration ${((edgeAt - acrS(sQ.g)) * 1000).toFixed(1)} mm short of the edge, tilt ${sQ.tilt}`);
  const i0 = await ev("window.__rows.length");
  await ev(`window.__leg = "run"; window.__jit = { A: ${Aunit}, P: ${HALFP}, k: 0 }; true`);
  for (let k = 0; k < RUN; k++) {
    await ev(`(() => { const s = window.__st, j = window.__jit; const busy = s.asmZoneMix !== null || (s.asmTilt !== null && (s.asmTilt.exit || s.asmTilt.off)); const a0 = j.A * Math.sin((2 * Math.PI * j.k) / j.P); j.k++; const a1 = j.A * Math.sin((2 * Math.PI * j.k) / j.P); const d = a1 - a0;
      if (!busy) { ${AXIS === "v" ? "s.orbit.reset(s.orbit.yaw, Math.max(0, Math.min(1, s.orbit.elevation + d)))" : "s.orbit.reset(s.orbit.yaw + d, s.orbit.elevation)"}; } window.__step(1); return true; })()`);
  }
  await ev(`window.__leg = "run-settle"`); await step(60);
  const R = await ev("window.__rows");
  const V = await ev("window.__verd");
  const sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]], dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
  const cross = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
  const deg = (x) => (x * 180) / Math.PI;
  const F = (i) => { const x = R[i]; const l = unit(sub([x[4], x[5], x[6]], [x[1], x[2], x[3]])); const k = dot([x[7], x[8], x[9]], l); const u = unit([x[7] - k * l[0], x[8] - k * l[1], x[9] - k * l[2]]); return { l, u, r: unit(cross(u, l)) }; };
  const rot = (a, c) => deg(Math.acos(Math.max(-1, Math.min(1, (dot(a.l, c.l) + dot(a.u, c.u) + dot(a.r, c.r) - 1) / 2))));
  let frames = 0, total = 0, worst = 0, turns = 0, turning = 0, facetFlips = 0, faceFlips = 0, tiltChanges = 0, targetFlips = 0, held = 0, lo = Infinity, hi = -Infinity, edgeX = 0;
  for (let i = Math.max(1, i0); i < R.length; i++) {
    if (R[i][0] !== "run") continue;
    frames++;
    const t = rot(F(i - 1), F(i)); total += t; worst = Math.max(worst, t);
    if (R[i][17] && !R[i - 1][17]) turns++;
    if (R[i][17]) turning++;
    if (R[i][18]) held++;
    if (R[i][24] !== R[i - 1][24]) facetFlips++;
    if (Math.hypot(R[i][13] - R[i - 1][13], R[i][14] - R[i - 1][14], R[i][15] - R[i - 1][15]) > 0.02) faceFlips++;
    if (R[i][23] !== R[i - 1][23]) tiltChanges++;
    if (Math.hypot(R[i][25] - R[i - 1][25], R[i][26] - R[i - 1][26], R[i][27] - R[i - 1][27]) > 0.02) targetFlips++;
    const a = (edgeAt - acrS([R[i][10], R[i][11], R[i][12]])) * 1000; lo = Math.min(lo, a); hi = Math.max(hi, a); if ((a < 0) !== ((edgeAt - acrS([R[i - 1][10], R[i - 1][11], R[i - 1][12]])) < 0)) edgeX++;
  }
  console.log(`  THE RUN along the ${EDGE} edge (${frames} frames, the orbit's angle wobbled ±${AMM} mm across, period ${HALFP} frames): the gizmo went from ${hi.toFixed(1)} mm short of the edge to ${(-lo).toFixed(1)} mm past it, crossing it ${edgeX} times`);
  console.log(`     the map's facet under the gizmo changed ${facetFlips} times; the banded face (the quads') ${faceFlips}; the tilt made / left ${tiltChanges}; the square camera's target ${targetFlips}; timed camera turns ${turns} (${turning} frames in a turn); frames with the dy hold ${held}`);
  console.log(`     the view turned ${total.toFixed(0)}° in all, at most ${worst.toFixed(1)}° in one frame`);
  console.log(`  verdicts during the run (${V.filter((v) => v[1] === "run").length}): ${V.filter((v) => v[1] === "run").slice(0, 8).map((v) => `f${v[0] - i0} ${v[2].slice(0, 70)}`).join(" | ") || "none"}`);
  // THE SUMMARY (ORBIT_GATES.md's baseline columns), every recorded frame: the view's whole turn (look and roll) per frame, the tilts, the holds
  { let big = 0, all = 0, made = 0, left = 0, holds = 0;
    for (let i = 1; i < R.length; i++) { const t = rot(F(i - 1), F(i)); if (t === t) { big = Math.max(big, t); all += t; } if (R[i][22] && !R[i - 1][22]) made++; if (!R[i][22] && R[i - 1][22]) left++; if (R[i][18] && !R[i - 1][18]) holds++; }
    console.log(`  SUMMARY (${R.length} frames): the view's largest turn in one frame ${big.toFixed(1)}°, in all ${all.toFixed(0)}°; tilts made ${made}, left ${left}; dy holds set ${holds}`); }
  console.log(`  errors ${errors}, recErr ${await ev("window.__recErr ?? window.__stepErr ?? null")}`);
  ws.close();
} finally {
  kill();
  for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } }
  clearTimeout(watchdog);
}
