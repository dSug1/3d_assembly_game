// ⭐⭐⭐ (2026-11-18, package DH — `Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md` §3) THE DY HOLD'S LONG WALKS, one run = one distance and one
// crossing, with REAL pointer events (the hold lives on the finger's path in `pointer_wiring.ts`: a walk that sets the orbit's angles would not see it).
// Headless on the probes' virtual clock (deterministic); every frame recorded to OUTJSON for `hold_walk_analyse.mjs`. Run by `hold_walk_batch.sh`
// (the runbook: scripts/probes/ORBIT_GATES.md §10).
//
// A run: boot, the approach (IN=far | half (HALFN frames of the approach finger) | close (the automatic tilt's latch on)), then one SUB-WALK per N
// (NS="3,6,12,20,30,45" mm), each from the side the last one left (so the crossings alternate: each way round):
//   to-start  the gizmo steered (any finger way, lifts allowed) to START° before the edge, at X mm along the axis; released
//   cross     ONE press at the glass's middle, a pure finger dy at PX px a frame toward the edge until the hold is set (or the gizmo is CROSSDEG past
//             the edge with none)
//   push      PUSH more frames the same way (the crossing's overshoot)
//   back      N mm of finger the other way (pure dy)
//   come      the crossing's finger way again, COME mm ("come back") — stopped once a new crossing has run 10 frames
//   (LIFT=1: released after `back`, 10 frames, pressed again for `come`)
//   (TRI=1: after `push`, `tri-dx` a pure finger dx toward the tip until the gizmo is on its triangle, then `tri-held` (the held way), `tri-other`,
//    `tri-held2`, TRIMM mm each — the owner's completion)
//   (COAST=1: `cross` released COASTDEG° before the edge at the pace PX: the coast carries it over; then a new press `come`)
//   (WOBBLE=1: after `push`, `wobble` the finger still pushing the crossing way at 0.5 px a frame with ±WAMP mm of dy (a sine, PERIOD frames), WN frames)
// The geometry: phi the angle round the body's long axis (x) about (AY, AZ) in the y-z plane (atan2(y − AY, z − AZ)); EDGE the edge's phi (°);
// Scene_0bis / Scene_0: AY 0.229, AZ 0.191, the zenith ridge 90°, the bottom face's edges −64.3° / −115.7°; Scene_1 (the cube): AY, AZ its centre.
//   URL=... IN=far SITE=zenith|bottom|<phi> [NS=...] [PX=2] [X=80] [START=8] [PUSH=8] [COME=60] [LIFT=1] [TRI=1] [COAST=1] [WOBBLE=1] OUTJSON=path
import { guardProbe } from "./probe_guard.mjs";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const E = process.env;
const URL = E.URL;
const IN = E.IN ?? "far";
const PX = +(E.PX ?? 2);
const NS = (E.NS ?? "3,6,12,20,30,45").split(",").map(Number);
const X = +(E.X ?? 80) / 1000;
const START = +(E.START ?? 8);
const PUSH = +(E.PUSH ?? 8);
const COME = +(E.COME ?? 60);
let AY = +(E.AY ?? 0.229), AZ = +(E.AZ ?? 0.191); // AY=auto: the orbit's centre (Scene_1's cube)
const SITE = E.SITE ?? "zenith";
const EDGE = SITE === "zenith" ? 90 : SITE === "bottom" ? -64.3 : +SITE;
const EDGE2 = SITE === "bottom" ? -115.7 : EDGE; // the bottom face's two far edges (one each way round)
const RIM = +(E.RIM ?? 0.2475);
const PXMM = 96 / 25.4; // CSS px per mm (src/core/units.ts)
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_hold_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(E.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...E, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); else chrome.kill(); };
const WD = 14 * 60_000;
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(2); }, WD);
watchdog.unref();
guardProbe({ chromePid: chrome.pid, prof, ms: WD + 30_000 });

const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;
// every frame: the finger's move (px, set by the probe), the deadbanded step and the orbit's drag (the pair after the spit's mapping, its gains in), the
// hold (sign, back), the dy sign remembered, the gizmo and its face, the turn, the spit's side, the free face, the zone, the tilt, the verdict when it changes.
// Read defensively: an older commit may lack a field (null then).
const RECORD = `(() => { const st = window.__st; window.__rows = []; window.__leg = "start"; window.__fin = [0, 0]; window.__dr = []; let lastV = "";
  const o = st.orbit; if (!o.__wrapped) { const d0 = o.drag.bind(o); o.drag = (a, b) => { const m = st.orbitMotion; const s = m && m.band ? m.band.step : null; window.__dr.push([a, b, s ? s.dx : null, s ? s.dy : null]); return d0(a, b); }; o.__wrapped = true; }
  window.__frame = () => { try {
    const g = st.asmGizmoAt, n = st.gizmoNormal, h = st.asmEdgeHold, v = String(st.lastVerdict ?? "");
    const dr = window.__dr.splice(0); let a = 0, b = 0, ddx = null, ddy = null; for (const x of dr) { a += x[0]; b += x[1]; if (x[2] !== null) { ddx = (ddx ?? 0) + x[2]; ddy = (ddy ?? 0) + x[3]; } }
    const row = { leg: window.__leg, f: window.__fin, dr: dr.length ? [a, b] : null, db: ddx === null ? null : [ddx, ddy], g: g ? [g[0], g[1], g[2]] : null, n: n ? [n[0], n[1], n[2]] : null,
      h: h ? [h.sign, h.back ?? null] : null, ds: st.asmDySign ?? null, mix: st.asmZoneMix ? 1 : 0, side: st.asmSpitSide ?? null, free: st.asmFree ? 1 : 0,
      zone: st.asmZone ? st.asmZone.zone.orientation : null, tilt: st.asmTilt ? st.asmTilt.id : 0, ap: st.approach, yaw: st.orbit.yaw, el: st.orbit.elevation,
      cam: [st.camera.position.x, st.camera.position.y, st.camera.position.z], up: [st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z] };
    if (v !== lastV) { lastV = v; row.v = v.slice(0, 140); }
    window.__rows.push(row); window.__fin = [0, 0];
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
  await send("Runtime.enable"); await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
  await send("Page.navigate", { url: URL });
  let ready = false;
  for (let i = 0; i < 750 && !ready; i++) { await sleep(40); ready = await ev("!!(window.__step && window.__st && window.__st.greenBox)"); }
  if (!ready) throw new Error("the scene did not build");
  await sleep(1500);
  await ev(`[...document.querySelectorAll('pre[data-role="error"]')].forEach((x) => x.remove())`);
  await ev("window.__step(240)");
  await ev(RECORD);
  if (E.AY === "auto") { const c = await ev("(() => { const c = window.__st.orbitCentreM; return [c.y, c.z]; })()"); AY = c[0]; AZ = c[1]; }
  // one frame (or n) and the state, in one call; `fin` the finger's move this frame (px)
  const WHERE = `(() => { const s = window.__st; const g = s.asmGizmoAt; const n = s.gizmoNormal; const h = s.asmEdgeHold;
    return { ap: s.approach, auto: !!s.asmTiltAuto, g: g ? [g[0], g[1], g[2]] : null, n: n ? [n[0], n[1], n[2]] : null, hold: h ? h.sign : 0, back: h ? (h.back ?? null) : null, mix: !!s.asmZoneMix,
      phi: g ? Math.atan2(g[1] - ${AY}, g[2] - ${AZ}) * 180 / Math.PI : null, r: g ? Math.hypot(g[1] - ${AY}, g[2] - ${AZ}) : null, x: g ? g[0] : null, side: s.asmSpitSide ?? null }; })()`;
  const go = (n, fin) => ev(`(() => { ${fin ? `window.__fin = [${fin[0]}, ${fin[1]}];` : ""} window.__step(${n}); return ${WHERE}; })()`);
  const where = () => ev(WHERE);
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const keyA = (down) => send("Input.dispatchKeyEvent", down ? { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 } : { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
  const setLeg = (l) => ev(`window.__leg = ${JSON.stringify(l)}`);
  // a plain drag (the approach)
  const drag = async (leg, x, y, dx, dy, n, a, until) => {
    await setLeg(leg);
    if (a) await keyA(true);
    await mouse("mousePressed", x, y, 1); await go(2);
    let hit = false;
    for (let k = 0; k < n && !hit; k++) { x += dx; y += dy; await mouse("mouseMoved", x, y, 1); const s = await go(1, [dx, dy]); if (until && until(s)) hit = true; }
    await mouse("mouseReleased", x, y, 0);
    if (a) await keyA(false);
    await go(30);
    return hit;
  };
  const s0 = await where();
  console.log(`${URL} IN=${IN} SITE=${SITE} (edge ${EDGE}°) PX=${PX} X=${X * 1000} mm NS=${NS} ${E.LIFT ? "LIFT " : ""}${E.TRI ? "TRI " : ""}${E.COAST ? "COAST " : ""}${E.WOBBLE ? "WOBBLE " : ""}`);
  console.log(`  boot: approach ${s0.ap.toFixed(3)}, phi ${s0.phi?.toFixed(1)}°, r ${(s0.r * 1000).toFixed(0)} mm`);
  if (IN === "close" || IN === "half") {
    await drag("probe", 250, 500, 0, -5, 12, true, null);
    const s1 = await where();
    const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
    if (IN === "close") { let auto = s1.auto; for (let i = 0; i < 10 && !auto; i++) auto = await drag("approach-in", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, 110, true, (s) => s.auto); }
    else await drag("approach-half", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, +(E.HALFN ?? 7), true, null);
    const s2 = await where();
    console.log(`  approach ${s2.ap.toFixed(3)}, auto ${s2.auto}`);
  }
  // the glass's direction (right, down) of a model direction w
  const glass = (w) => ev(`(() => { const c = window.__st.camera, t = c.getTarget(); const f = [t.x - c.position.x, t.y - c.position.y, t.z - c.position.z];
    const l = Math.hypot(...f); const F = f.map((x) => x / l); let u = [c.upVector.x, c.upVector.y, c.upVector.z]; const k = u[0]*F[0]+u[1]*F[1]+u[2]*F[2];
    u = [u[0]-k*F[0], u[1]-k*F[1], u[2]-k*F[2]]; const ul = Math.hypot(...u); u = u.map((x) => x / ul);
    const r = [u[1]*F[2]-u[2]*F[1], u[2]*F[0]-u[0]*F[2], u[0]*F[1]-u[1]*F[0]]; const w = ${JSON.stringify(w)};
    const a = w[0]*r[0]+w[1]*r[1]+w[2]*r[2], b = w[0]*u[0]+w[1]*u[1]+w[2]*u[2]; const m = Math.hypot(a, b) || 1; return [a / m, -b / m]; })()`);
  const tangent = (phiDeg, dir) => { const p = (phiDeg * Math.PI) / 180; return [0, dir * Math.cos(p), -dir * Math.sin(p)]; };
  const dphi = (a, b) => ((a - b + 540) % 360) - 180;
  // steer the gizmo to (tx, tphi) — level_entry_check.mjs's steering (any finger way, lifted at the glass's border)
  const steer = async (name, tx, tphi) => {
    await setLeg(name);
    let x = 600, y = 400, pressed = false, frames = 0, ok = false;
    while (frames < 900) {
      const p = await where(); if (!p.g) break;
      const ex = tx - p.x, arc = (dphi(tphi, p.phi) * Math.PI / 180) * p.r;
      if (Math.hypot(ex, arc) < 0.004) { ok = true; break; }
      const ph = p.phi * Math.PI / 180; const w = [ex, arc * Math.cos(ph), -arc * Math.sin(ph)];
      const [fx, fy] = await glass(w);
      if (!pressed) { x = 600 - 380 * fx; y = 380 - 240 * fy; await mouse("mousePressed", x, y, 1); await go(2); pressed = true; }
      const sp = Math.min(3, Math.max(0.5, Math.hypot(ex, arc) * 1000 / 4));
      x += fx * sp; y += fy * sp; frames++;
      await mouse("mouseMoved", x, y, 1); await go(1, [fx * sp, fy * sp]);
      if (x < 30 || x > 1170 || y < 30 || y > 720) { await mouse("mouseReleased", x, y, 0); await go(2); pressed = false; }
    }
    if (pressed) { await mouse("mouseReleased", x, y, 0); }
    await go(30);
    const p = await where();
    return `${ok} ${frames} fr, x ${(p.x * 1000).toFixed(0)} mm phi ${p.phi.toFixed(1)}°`;
  };
  // a pure finger dy (vs: +1 down on the glass) of `mm` at PX px a frame from (x, y) — the finger kept down; `stop` read every frame
  let fx0 = 600, fy0 = 400;
  const fingerDy = async (leg, vs, mm, stop, pace = PX) => {
    await setLeg(leg);
    const n = Math.max(1, Math.round((mm * PXMM) / pace));
    let s = null;
    for (let k = 0; k < n; k++) {
      fy0 += vs * pace;
      await mouse("mouseMoved", fx0, fy0, 1);
      s = await go(1, [0, vs * pace]);
      if (stop && stop(s)) break;
    }
    return s;
  };
  const fingerDx = async (leg, hs, n, stop, pace = PX) => {
    await setLeg(leg);
    let s = null;
    for (let k = 0; k < n; k++) { fx0 += hs * pace; await mouse("mouseMoved", fx0, fy0, 1); s = await go(1, [hs * pace, 0]); if (stop && stop(s)) break; }
    return s;
  };
  const summary = [];
  let dir = +(E.DIR0 ?? 1); // +1: the crossing goes toward increasing phi
  for (let i = 0; i < NS.length; i++) {
    const N = NS[i];
    const edge = dir > 0 ? EDGE : EDGE2;
    const tag = `s${i}`;
    const st0 = await steer(`${tag}-to-start`, X, edge - dir * START);
    let p = await where();
    // a hold left on after the steering's release (set with no finger down: the camera's side change a frame after the lift, a coast) — recorded,
    // then ended by a still press off the piece (a gesture's end), so each sub-walk starts clean
    let stale = "";
    if (p.hold !== 0) {
      const f = (await ev("window.__rows")).length;
      stale = ` STALE hold ${p.hold} after the steering (f${f})`;
      await setLeg(`${tag}-clear`);
      await mouse("mousePressed", 300, 600, 1); await go(3); await mouse("mouseReleased", 300, 600, 0); await go(10);
      p = await where();
      if (p.hold !== 0) stale += " — NOT ended by a press";
    }
    const [gx, gy] = await glass(tangent(p.phi, dir));
    const vs = gy >= 0 ? 1 : -1; // the finger's dy that takes the gizmo toward the edge (+1: down on the glass)
    fx0 = 600; fy0 = vs > 0 ? 250 : 550;
    await setLeg(`${tag}-cross`);
    await mouse("mousePressed", fx0, fy0, 1); await go(2);
    const hold0 = (await where()).hold;
    let crossed = null;
    if (E.COAST) {
      // the coast: released COASTDEG before the edge
      const cd = +(E.COASTDEG ?? 6);
      p = await fingerDy(`${tag}-cross`, vs, 80, (s) => dir * dphi(s.phi, edge) > -cd || (s.hold !== 0 && s.hold !== hold0));
      await mouse("mouseReleased", fx0, fy0, 0);
      await setLeg(`${tag}-coast`);
      for (let k = 0; k < 90; k++) { const s = await go(1); if (s.hold !== 0 && crossed === null) crossed = { how: "coast", k }; }
      p = await where();
      fx0 = 600; fy0 = 400;
      await setLeg(`${tag}-come`);
      await mouse("mousePressed", fx0, fy0, 1); await go(2);
      const pc = await fingerDy(`${tag}-come`, vs, 40, null);
      await mouse("mouseReleased", fx0, fy0, 0); await go(20);
      await setLeg(`${tag}-other`);
      fx0 = 600; fy0 = 400;
      await mouse("mousePressed", fx0, fy0, 1); await go(2);
      await fingerDy(`${tag}-other`, -vs, 40, null);
      await mouse("mouseReleased", fx0, fy0, 0); await go(20);
      summary.push(`${tag} N=- (coast) start ${st0}${stale} | crossed ${crossed ? `by the coast, ${crossed.k} frames after the release` : "no hold set"} | after the come ${pc.phi.toFixed(1)}°`);
    } else {
      const s1 = await fingerDy(`${tag}-cross`, vs, 140, (s) => (s.hold !== 0 && s.hold !== hold0) || dir * dphi(s.phi, edge) > +(E.CROSSDEG ?? 40));
      crossed = s1.hold !== 0 ? "hold" : "none";
      await fingerDy(`${tag}-push`, vs, (PUSH * PX) / PXMM, null);
      if (E.WOBBLE) {
        await setLeg(`${tag}-wobble`);
        const WAMP = +(E.WAMP ?? 2.5) * PXMM, PER = +(E.PERIOD ?? 24), WN = +(E.WN ?? 144);
        let prev = 0;
        for (let k = 1; k <= WN; k++) { const w = WAMP * Math.sin((2 * Math.PI * k) / PER); const d = vs * 0.5 + (w - prev); prev = w; fy0 += d; await mouse("mouseMoved", fx0, fy0, 1); await go(1, [0, d]); }
      }
      if (E.TRI) {
        // the travel sideways onto the tip's triangle (+x tip when X ≥ 0), then the dy both ways
        const sx = X >= 0 ? 1 : -1;
        const [ax] = await glass([sx, 0, 0]);
        const hs = ax >= 0 ? 1 : -1;
        const sT = await fingerDx(`${tag}-tri-dx`, hs, 400, (s) => s.x * sx > RIM + 0.03);
        const TR = +(E.TRIMM ?? 30);
        await fingerDy(`${tag}-tri-held`, vs, TR, null);
        await fingerDy(`${tag}-tri-other`, -vs, TR, null);
        await fingerDy(`${tag}-tri-held2`, vs, TR, null);
        await mouse("mouseReleased", fx0, fy0, 0); await go(20);
        summary.push(`${tag} TRI start ${st0}${stale} | crossed: ${crossed} | on the triangle: x ${(sT.x * 1000).toFixed(0)} mm, hold ${sT.hold}`);
      } else {
        await fingerDy(`${tag}-back`, -vs, N, null);
        if (E.LIFT) { await mouse("mouseReleased", fx0, fy0, 0); await setLeg(`${tag}-lifted`); await go(10); await mouse("mousePressed", fx0, fy0, 1); await go(2); }
        // come back: stopped 10 frames after a new crossing (a hold set again, or the turn of a crossing)
        let after = -1; const hb = (await where()).hold;
        let prevMix = (await where()).mix;
        await fingerDy(`${tag}-come`, vs, COME, (s) => { if (after < 0 && ((s.hold !== 0 && s.hold !== hb) || (s.mix && !prevMix))) after = 10; prevMix = s.mix; return after >= 0 && --after <= 0; });
        await mouse("mouseReleased", fx0, fy0, 0); await go(20);
        const pe = await where();
        summary.push(`${tag} N=${N} start ${st0}${stale} | crossed: ${crossed} | at the end phi ${pe.phi.toFixed(1)}° hold ${pe.hold}`);
      }
    }
    // the next sub-walk from the side this one left
    p = await where();
    dir = dphi(p.phi, edge) * dir > 0 ? -dir : dir;
    if (SITE === "bottom") dir = p.phi > -90 ? -1 : 1;
    if (E.KEEPDIR) dir = +(E.DIR0 ?? 1);
  }
  for (const l of summary) console.log(`  ${l}`);
  const R = await ev("window.__rows");
  const err = await ev("window.__recErr ?? window.__stepErr ?? null");
  console.log(`  frames ${R.length}, errors ${errors}, recErr ${err}`);
  if (E.OUTJSON) writeFileSync(E.OUTJSON, JSON.stringify({ meta: { URL, IN, SITE, EDGE, EDGE2, PX, X, NS, AY, AZ, RIM, LIFT: !!E.LIFT, TRI: !!E.TRI, COAST: !!E.COAST, WOBBLE: !!E.WOBBLE }, rows: R }));
  ws.close();
} finally {
  kill();
  for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } }
  clearTimeout(watchdog);
}
