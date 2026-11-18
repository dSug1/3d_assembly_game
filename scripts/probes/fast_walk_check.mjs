// ⭐⭐⭐ (2026-11-18, package FO1 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §4, §6) THE FAST WALKS: one walk a run, the gizmo STEERED to targets on the
// glass (so the ROUTE is the same whatever the pace), headless on the probes' virtual clock (`level_entry_check.mjs`'s harness, copied), every frame
// recorded for `fast_walk_analyse.mjs`. Run by `fast_walk_batch.sh` (the runbook: scripts/probes/ORBIT_GATES.md §9).
//   URL=... TGT="<label>:<x m>:<phi deg>:<face>[:pass];..." SEQ="<label> <label> ..." [REPS=1] [IN=0|half] [HALFN=7] LPX=20 [K=4] [TOL=0.008]
//     [START_PX=2] [AY=0.229] [AZ=0.191] OUTJSON=<frames.json> [REC=<inputs.json>] node fast_walk_check.mjs
//   A target is a place round the body's long axis (x along it; phi the angle round it in the y-z plane — 0 toward +z, 90° up): the gizmo is steered
//   toward it (the error on the glass: FAST at LPX px a frame until it has passed it, then FINE at START_PX — see `leg`), reached within TOL m and on
//   the face `<face>` (the heptagon's: B the bottom, F the lower front rectangle, T / U the tip's triangles, o<k> the k-th face round, t<k> a tip's;
//   `*` any). `:pass` — reached once the angle round the axis is PAST the target (the zigzag across an edge: never slowed).
//   The finger stops 6 frames before every release (no coast after a lift: a route the pace does not change).
//   The gizmo read is the map's raw point (`asmG`: where the orbit's angles put it this frame — never the eased ring, which trails a fast finger).
//   SEQ: the first label is the start (its leg `to-start`, at START_PX px a frame), the rest the loop, repeated REPS times (legs `loop<r>-<label>`).
//   REC=<file>: the inputs as they reached each frame — the events dispatched before it, and the orbit's angles and the approach as the frame began —
//   for the no-drift replay (gate G4 (ii)).
//   REPLAY=<inputs.json> (no TGT): the same events at the same frames, the orbit's angles and the approach SET as recorded before each frame (the URL
//   should carry `&tiltRollDegS=0`: every turn whole at once); OUTJSON the frames, compared by `fast_walk_drift.mjs`.
import { guardProbe } from "./probe_guard.mjs";
import { SHADOW_REC } from "./turn_rec.mjs"; // (FO3 S0) the shadow per frame (`sh`)
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.URL;
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_fast_walk_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); else chrome.kill(); };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(2); }, 8 * 60_000);
watchdog.unref();
guardProbe({ chromePid: chrome.pid, prof, ms: 8 * 60_000 + 30_000 });

// the virtual clock; `__pre` runs before each frame's callbacks (the replay sets the inputs there; the recorder reads them there)
const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { if (window.__pre) window.__pre(); T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;
// every frame: the camera drawn, the gizmo, the transition's turn (its id — one per turn object —, share, angle, whole, whether it holds the gizmo:
// \`hold\` as decided, or as today's rule reads it), the state that must not read the fade (zone, tilt, free face and its heading, spit side, map
// angles), the pose the camera's stage built (\`probeCamPose\`, when the build has it), the inputs as the frame began (\`pre\`)
const RECORD = `(() => { const st = window.__st; window.__cam = []; window.__leg = "start"; const ids = new WeakMap(); let nid = 0; window.__preRec = []; window.__nFrame = 0;
  window.__pre = () => { const o = st.orbit; const f = window.__force && window.__force[window.__nFrame];
    if (f) { o.reset(f.yaw, f.v); o.beyond = f.beyond; st.approach = f.ap; }
    window.__preRec.push({ yaw: o.yaw, v: o.elevation, beyond: o.beyond, ap: st.approach }); };
  window.__frame = () => { try { window.__nFrame++;
    const g = st.asmGizmoAt, n = st.gizmoNormal, m = st.asmZoneMix, e = st.asmDirEase, t = st.camera.getTarget(), fr = st.asmFree, mq = st.asmMapQ, cp = st.probeCamPose;
    let mid = 0; if (m) { if (!ids.has(m)) ids.set(m, ++nid); mid = ids.get(m); }
    window.__cam.push({ leg: window.__leg, c: [st.camera.position.x, st.camera.position.y, st.camera.position.z], t: [t.x, t.y, t.z], up: [st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z],
      yaw: st.orbit.yaw, el: st.orbit.elevation, g: g ? [g[0], g[1], g[2]] : null, n: n ? [n[0], n[1], n[2]] : null,
      mix: m ? { id: mid, k: m.k, rad: m.rad, whole: m.rad + (e && e.mix === m ? e.angle : 0), known: m.axis !== null, rule: m.rule, byMm: !!m.byMm, out: !!m.out, hold: m.hold === undefined ? null : m.hold } : null,
      tilt: st.asmTilt ? st.asmTilt.id : 0, zone: st.asmZone ? st.asmZone.zone.orientation + "#" + st.asmZone.id : null, ap: st.approach, auto: !!st.asmTiltAuto, eh: st.asmEdgeHold ? 1 : 0,
      free: fr ? [fr.facet, fr.heading[0], fr.heading[1], fr.heading[2]] : null, spit: st.asmSpitSide ?? null, mq: mq ? [mq.yaw, mq.pitch] : null,
      sqn: st.asmSquare && st.asmSquare.n ? [st.asmSquare.n[0], st.asmSquare.n[1], st.asmSquare.n[2]] : null, sqq: st.asmSquare ? st.asmSquare.q : -1,
      pose: cp ? { to: [cp.to.eye, cp.to.look, cp.to.up], drawn: [cp.drawn.eye, cp.drawn.look, cp.drawn.up] } : null, sh: ${SHADOW_REC} });
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
  // every input dispatched, with the frame it reaches (the frames stepped since the recorder started)
  let frame = 0;
  const log = [];
  const step = async (n) => { frame += n; return ev(`window.__step(${n})`); };
  const dispatch = async (method, params) => { log.push([frame, method, params]); await send(method, params); };
  const mouse = (type, x, y, buttons) => dispatch("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const keyA = (down) => dispatch("Input.dispatchKeyEvent", down ? { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 } : { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
  console.log(`${URL}`);

  if (process.env.REPLAY) {
    // ===== THE NO-DRIFT REPLAY: the recorded events at their frames, the inputs set before each frame
    const R = JSON.parse(readFileSync(process.env.REPLAY, "utf8"));
    await ev(`window.__force = ${JSON.stringify(R.pre)}`);
    let k = 0;
    for (let f = 0; f < R.pre.length; f++) {
      while (k < R.events.length && R.events[k][0] === f) { await send(R.events[k][1], R.events[k][2]); k++; }
      await ev(`window.__leg = ${JSON.stringify(R.legs[f] ?? "")}`);
      await step(1);
    }
    console.log(`  replayed ${R.pre.length} frames, ${k} of ${R.events.length} events`);
  } else {
    const state = async () => JSON.parse(await ev(`(() => { const s = window.__st; return JSON.stringify({ ap: s.approach, auto: !!s.asmTiltAuto }); })()`));
    // a straight drag (the approach): `n` moves of (dx, dy) a frame, A held
    const drag = async (leg, x, y, dx, dy, n, a) => {
      await ev(`window.__leg = "${leg}"`);
      if (a) await keyA(true);
      await mouse("mousePressed", x, y, 1); await step(2);
      for (let k = 0; k < n; k++) { x = Math.max(5, Math.min(1195, x + dx)); y = Math.max(5, Math.min(795, y + dy)); await mouse("mouseMoved", x, y, 1); await step(1); }
      await step(6);
      await mouse("mouseReleased", x, y, 0);
      if (a) await keyA(false);
      await ev(`window.__leg = "${leg}-settle"`);
      await step(40);
    };
    const s0 = await state();
    console.log(`  boot: approach ${s0.ap.toFixed(3)}`);
    if (process.env.IN === "half") {
      await drag("probe", 250, 500, 0, -5, 12, true);
      const s1 = await state();
      const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
      await drag("approach-half", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, +(process.env.HALFN ?? 7), true);
      const s2 = await state();
      console.log(`  part way in: approach ${s2.ap.toFixed(3)}, auto ${s2.auto}`);
    }
    const AY = +(process.env.AY ?? 0.229), AZ = +(process.env.AZ ?? 0.191), RIM = +(process.env.RIM ?? 0.2475), SEC = 360 / 7;
    const LPX0 = +(process.env.LPX ?? 20), SPX = +(process.env.START_PX ?? 2), K = +(process.env.K ?? 4), TOL = +(process.env.TOL ?? 0.008), REPS = +(process.env.REPS ?? 1);
    const where = () => ev(`(() => { const g = window.__st.asmG ?? window.__st.asmGizmoAt; if (!g) return null; const phi = Math.atan2(g[1] - ${AY}, g[2] - ${AZ}) * 180 / Math.PI;
      const k = Math.round((phi + 90) / ${SEC}); const tip = Math.abs(g[0]) > ${RIM} + 0.002; const f = k === 0 ? (tip ? "T" : "B") : k === -1 ? (tip ? "U" : "F") : (tip ? "t" : "o") + k;
      return { x: g[0], phi, f, r: Math.hypot(g[1] - ${AY}, g[2] - ${AZ}), g: [g[0], g[1], g[2]] }; })()`);
    const glass = (w) => ev(`(() => { const c = window.__st.camera, t = c.getTarget(); const f = [t.x - c.position.x, t.y - c.position.y, t.z - c.position.z];
      const l = Math.hypot(...f); const F = f.map((x) => x / l); let u = [c.upVector.x, c.upVector.y, c.upVector.z]; const k = u[0]*F[0]+u[1]*F[1]+u[2]*F[2];
      u = [u[0]-k*F[0], u[1]-k*F[1], u[2]-k*F[2]]; const ul = Math.hypot(...u); u = u.map((x) => x / ul);
      const r = [u[1]*F[2]-u[2]*F[1], u[2]*F[0]-u[0]*F[2], u[0]*F[1]-u[1]*F[0]]; const w = ${JSON.stringify(w)};
      const a = w[0]*r[0]+w[1]*r[1]+w[2]*r[2], b = w[0]*u[0]+w[1]*u[1]+w[2]*u[2]; const m = Math.hypot(a, b) || 1; return [a / m, -b / m]; })()`);
    const T = {};
    for (const s of (process.env.TGT ?? "").split(";").filter(Boolean)) { const [lab, x, phi, face, mode] = s.split(":"); T[lab] = { x: +x, phi: +phi, face, pass: mode === "pass" }; }
    // where the gizmo is GOING: its raw point lags the finger by the map's catch-up and the piece's spring (2 – 3 frames); led by its last step × LEAD
    // (a `:pass` target — the zigzag — reads the gizmo itself: the crossing is the one it makes)
    const LEAD = +(process.env.LEAD ?? 2.5);
    const placeOf = (g) => { const phi = Math.atan2(g[1] - AY, g[2] - AZ) * 180 / Math.PI; return { x: g[0], phi, r: Math.hypot(g[1] - AY, g[2] - AZ) }; };
    const errOf = (tg, p) => { const ex = tg.x - p.x, ephi = ((tg.phi - p.phi + 540) % 360) - 180; return { ex, arc: (ephi * Math.PI / 180) * p.r }; };
    // ONE LEG: (1) FAST — at LPX px a frame toward the target, until the led place has PASSED it (or is within TOL); the finger stops 6 frames and lifts;
    // (2) FINE (not for a `:pass` target) — after 10 frames of settle, at most START_PX px a frame, slowing within K·START_PX mm, until on the target's face
    // within TOL. The same plan whatever the build: the route is the targets'.
    // CONT=1 (the default): the legs CHAINED — the finger stays down from one target to the next (a fast finger going round), lifted only at the glass's border
    // and after the last leg; no FINE phase
    const CONT = (process.env.CONT ?? "1") === "1";
    let x = 600, y = 400, pressed = false, gPrev = null;
    const leg = async (name, to, LPX = LPX0, last = false) => {
      await ev(`window.__leg = "${name}"`);
      const tg = T[to];
      if (!tg) throw new Error(`no target ${to}`);
      const cont = CONT && name !== "to-start";
      let frames = 0, ok = false, e0 = null;
      if (!cont) gPrev = null;
      const release = async () => { await step(6); await mouse("mouseReleased", x, y, 0); await step(2); pressed = false; gPrev = null; };
      const push = async (p, er, sp) => {
        const ph = p.phi * Math.PI / 180; const w = [er.ex, er.arc * Math.cos(ph), -er.arc * Math.sin(ph)];
        const [fx, fy] = await glass(w);
        if (!pressed) { x = 600 - 380 * fx; y = 380 - 240 * fy; await mouse("mousePressed", x, y, 1); await step(2); pressed = true; }
        x += fx * sp; y += fy * sp; frames++;
        await mouse("mouseMoved", x, y, 1); await step(1);
        if (x < 30 || x > 1170 || y < 30 || y > 720) await release();
      };
      // (1) fast
      let fast = 0;
      while (fast < 600) {
        const p = await where(); if (!p) break;
        const g = p.g, gl = gPrev === null || tg.pass ? g : [g[0] + (g[0] - gPrev[0]) * LEAD, g[1] + (g[1] - gPrev[1]) * LEAD, g[2] + (g[2] - gPrev[2]) * LEAD];
        gPrev = g;
        const pl = placeOf(gl), er = errOf(tg, pl);
        if (e0 === null) e0 = er;
        // passed (the led place) or there — and, for a target with a face, the gizmo itself ON that face (a fast finger may cut a corner: it goes on)
        const there = er.ex * e0.ex + er.arc * e0.arc <= 0 || Math.hypot(er.ex, er.arc) < TOL;
        if (there && (tg.pass || tg.face === "*" || p.f === tg.face)) break;
        await push(pl, er, LPX); fast++;
      }
      if (cont && !last) return `${fast < 600} ${fast} fr (chained)`;
      if (cont) await ev(`window.__leg = "end"`); // the lift after the last chained leg: not the loop's
      if (pressed) await release();
      await step(10);
      // (2) fine
      if (tg.pass || cont || process.env.FINE === "0") ok = true;
      else {
        while (frames < 1500) {
          const p = await where(); if (!p) break;
          const er = errOf(tg, p);
          if ((tg.face === "*" || p.f === tg.face) && Math.hypot(er.ex, er.arc) < TOL) { ok = true; break; }
          await push(p, er, Math.min(SPX, Math.max(0.5, Math.hypot(er.ex, er.arc) * 1000 / K)));
        }
        if (pressed) await release();
      }
      await step(20);
      const p = await where();
      return `${ok} ${frames} fr (${fast} fast), at ${p ? p.f : "?"} x ${p ? (p.x * 1000).toFixed(0) : "-"} phi ${p ? p.phi.toFixed(1) : "-"}`;
    };
    const seq = (process.env.SEQ ?? "").split(/\s+/).filter(Boolean);
    console.log(`  start ${seq[0]}: ${await leg("to-start", seq[0], SPX)}`);
    const L = seq.slice(1);
    for (let r = 0; r < REPS; r++) for (let i = 0; i < L.length; i++) console.log(`  loop${r} ->${L[i]}: ${await leg(`loop${r}-${L[i]}`, L[i], LPX0, r === REPS - 1 && i === L.length - 1)}`);
  }
  const C = await ev("window.__cam");
  const pre = await ev("window.__preRec");
  const err = await ev("window.__recErr ?? window.__stepErr ?? null");
  console.log(`  frames ${C.length}, errors ${errors}, recErr ${err}`);
  if (process.env.OUTJSON) writeFileSync(process.env.OUTJSON, JSON.stringify(C));
  if (process.env.REC && !process.env.REPLAY) writeFileSync(process.env.REC, JSON.stringify({ url: URL, events: log, pre, legs: C.map((c) => c.leg) }));
  ws.close();
} finally {
  kill();
  for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } }
  clearTimeout(watchdog);
}
