// ⭐⭐⭐ (2026-11-17, package LF1 — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §7, §10) THE LEVEL FACE'S ENTRY GATE, one walk a run: the study's
// walks (its `walk2.mjs`, ported unchanged but for the guard's import and this header), headless on the probes' virtual clock; every frame recorded
// (the camera, the gizmo, its face's normal, the timed turn `mix`, the square camera, the calm, the free face's heading) and written to OUTJSON for
// `level_entry_analyse.mjs`. Run by `level_entry_batch.sh` (the runbook: scripts/probes/ORBIT_GATES.md §7).
//   URL=... WALK=bottomout|top|dxbottom|end|front|loop IN=0|1|half [HALFN=n] PX=1 [TX=mm] [ADD=40] [EXITDIR=±1] [EXITDX=n] OUTJSON=path node level_entry_check.mjs
//   WALK=loop: LOOP=ccw|cw|back|backm|far, START=F|B|T|U, REPS=2, SIDE=1|-1 (the +x / −x tip), LPX (px a frame, default PX), OFF (m, 0.045)
//   IN=1 close in (the automatic tilt's latch on); IN=half: the approach finger HALFN frames in (7 → 0.736, 20 → 0.515 on Scene_0bis)
import { guardProbe } from "./probe_guard.mjs";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.URL;
const WALK = process.env.WALK ?? "front";
const IN = process.env.IN === "1";
const PX = +(process.env.PX ?? 3);
const ADD = +(process.env.ADD ?? 40);
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_level_entry_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); else chrome.kill(); };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(2); }, 6 * 60_000);
watchdog.unref();
guardProbe({ chromePid: chrome.pid, prof, ms: 6 * 60_000 + 30_000 });

const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;
const RECORD = `(() => { const st = window.__st; window.__cam = []; window.__leg = "start";
  window.__frame = () => { try {
    const g = st.asmGizmoAt, n = st.gizmoNormal, m = st.asmZoneMix, sq = st.asmSquare, c = st.asmCalm, t = st.camera.getTarget(), fr = st.asmFree;
    window.__cam.push({ leg: window.__leg, c: [st.camera.position.x, st.camera.position.y, st.camera.position.z], t: [t.x, t.y, t.z], up: [st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z],
      yaw: st.orbit.yaw, el: st.orbit.elevation, g: g ? [g[0], g[1], g[2]] : null, n: n ? [n[0], n[1], n[2]] : null,
      mix: m ? { k: m.k, rad: m.rad, whole: m.rad + (st.asmDirEase && st.asmDirEase.mix === m ? st.asmDirEase.angle : 0), known: m.axis !== null, rule: m.rule, byMm: !!m.byMm, out: !!m.out } : null, ds: st.asmDySign, eh: st.asmEdgeHold ? 1 : 0,
      sqq: sq ? sq.q : -1, sqn: sq && sq.n ? [sq.n[0], sq.n[1], sq.n[2]] : null, sqt: sq && sq.target ? [sq.target[0], sq.target[1], sq.target[2]] : null,
      tilt: st.asmTilt ? st.asmTilt.id : 0, th: st.asmTilt ? st.asmTilt.heading : null, zone: st.asmZone ? st.asmZone.zone.orientation : null, ap: st.approach, auto: !!st.asmTiltAuto,
      ease: st.asmDirEase ? st.asmDirEase.angle * 180 / Math.PI : 0, spit: st.asmSpitSide ?? null, hold: !!st.asmEdgeHold,
      calm: c ? { n: [c.n[0], c.n[1], c.n[2]], sH: c.sH, sV: c.sV, wA: c.wA ?? 0 } : null, cw: st.asmCalmWhole, cwv: st.asmCalmWholeV, headO: st.asmHeadO, headW: st.asmHeadW, cp: st.cameraPrev && st.cameraPrev.cam ? [st.cameraPrev.cam.yaw, st.cameraPrev.cam.v] : null, pq: st.pieceQ ? [st.pieceQ.yaw, st.pieceQ.v] : null,
      free: fr ? [fr.heading[0], fr.heading[1], fr.heading[2]] : null });
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
  const step = (n) => ev(`window.__step(${n})`);
  const state = async () => JSON.parse(await ev(`(() => { const s = window.__st; const n = s.gizmoNormal; const g = s.asmGizmoAt; return JSON.stringify({ ap: s.approach, auto: !!s.asmTiltAuto, tilt: s.asmTilt ? s.asmTilt.id : null, nx: n ? n[0] : null, ny: n ? n[1] : null, nz: n ? n[2] : null, el: s.orbit.elevation, yaw: s.orbit.yaw, gx: g ? g[0] : null, gy: g ? g[1] : null, gz: g ? g[2] : null, hold: !!s.asmEdgeHold, mix: !!s.asmZoneMix }); })()`));
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const keyA = (down) => send("Input.dispatchKeyEvent", down ? { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 } : { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
  // a drag; `until` read every 2 frames; after it returns true, `extra` more frames in the SAME drag
  const drag = async (leg, x, y, dx, dy, n, a, until, extra = 0) => {
    await ev(`window.__leg = "${leg}"`);
    if (a) await keyA(true);
    await mouse("mousePressed", x, y, 1); await step(2);
    let hit = false, left = -1;
    for (let k = 0; k < n; k++) {
      x = Math.max(5, Math.min(1195, x + dx)); y = Math.max(5, Math.min(795, y + dy));
      await mouse("mouseMoved", x, y, 1); await step(1);
      if (!hit && until && until(await state())) { hit = true; left = extra; }
      if (hit) { if (left-- <= 0) break; }
    }
    await mouse("mouseReleased", x, y, 0);
    if (a) await keyA(false);
    await ev(`window.__leg = "${leg}-settle"`);
    await step(40);
    return hit;
  };
  const s0 = await state();
  console.log(`${URL} WALK=${WALK} IN=${IN} PX=${PX}`);
  console.log(`  boot: approach ${s0.ap.toFixed(3)}, normal (${s0.nx?.toFixed(2)}, ${s0.ny?.toFixed(2)}, ${s0.nz?.toFixed(2)}), el ${s0.el.toFixed(3)}`);
  if (IN) {
    await drag("probe", 250, 500, 0, -5, 12, true, null);
    const s1 = await state();
    const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
    let auto = s1.auto;
    for (let i = 0; i < 10 && !auto; i++) auto = await drag("approach-in", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, 110, true, (s) => s.auto);
    const s2 = await state();
    console.log(`  close in: approach ${s2.ap.toFixed(3)}, auto ${s2.auto}`);
  }
  if (process.env.IN === "half") {
    await drag("probe", 250, 500, 0, -5, 12, true, null);
    const s1 = await state();
    const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
    await drag("approach-half", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, +(process.env.HALFN ?? 30), true, null);
    const s2 = await state();
    console.log(`  part way in: approach ${s2.ap.toFixed(3)}, auto ${s2.auto}`);
  }
  // which finger way raises the gizmo: 8 frames up at (950, 450)
  const y0 = (await state()).gy;
  await drag("dir-probe", 950, 450, 0, -3, 8, false, null);
  const y1 = (await state()).gy;
  const upDir = y1 >= y0 ? -1 : 1;
  console.log(`  the gizmo's height ${(y0 * 1000).toFixed(1)} -> ${(y1 * 1000).toFixed(1)} mm for a finger up: the finger raises it going ${upDir < 0 ? "up" : "down"}`);
  const dyDrag = async (leg, want /* +1 up, -1 down */, until, extra) => {
    const d = want > 0 ? upDir : -upDir;
    let on = false;
    for (let i = 0; i < 4 && !on; i++) on = await drag(leg, +(process.env.DYX ?? 950), d < 0 ? +(process.env.DYUP ?? 730) : 70, 0, d * PX, Math.floor(700 / PX) - 4, false, until, extra);
    return on;
  };
  // why_bottom: the gizmo moved along x to TX mm (a dx), on the face it is on
  const dxSign = async () => { const x0 = (await state()).gx; await drag("dx-probe", 600, 450, 3, 0, 8, false, null); const x1 = (await state()).gx; return x1 > x0 ? 1 : -1; };
  if (process.env.TX !== undefined) {
    const TX = +process.env.TX / 1000;
    const sgn = await dxSign();
    const want = (await state()).gx < TX ? 1 : -1;
    const fd = want * sgn;
    let e = false;
    for (let i = 0; i < 6 && !e; i++) e = await drag("to-x", fd > 0 ? 200 : 1000, 450, fd * 1, 0, 780, false, (s) => want * (s.gx - TX) >= 0 || (Math.abs(TX) > 0.245 && s.nx !== null && Math.abs(s.nx) > 0.9), Math.abs(TX) > 0.245 ? 60 : 0);
    const s = await state();
    console.log(`  moved to x: ${e}, normal (${s.nx?.toFixed(2)}, ${s.ny?.toFixed(2)}, ${s.nz?.toFixed(2)}), gizmo (${(s.gx * 1000).toFixed(0)}, ${(s.gy * 1000).toFixed(0)}, ${(s.gz * 1000).toFixed(0)}) mm`);
  }
  if (WALK === "dxbottom") {
    const on = await dyDrag("down-to-bottom", -1, (s) => s.ny !== null && s.ny < -0.85, ADD);
    let s = await state();
    console.log(`  on the bottom: ${on}, normal (${s.nx?.toFixed(2)}, ${s.ny?.toFixed(2)}, ${s.nz?.toFixed(2)}), gizmo (${(s.gx * 1000).toFixed(0)}, ${(s.gy * 1000).toFixed(0)}, ${(s.gz * 1000).toFixed(0)}) mm`);
    await ev(`window.__leg = "settle"`); await step(30);
    const sgn = await dxSign();
    const ex = +(process.env.EXX ?? 1);
    const fd = ex * sgn;
    let out = false;
    for (let i = 0; i < 6 && !out; i++) out = await drag("dx-out-of-bottom", fd > 0 ? 200 : 1000, 450, fd * PX, 0, Math.floor(780 / PX), false, (q) => q.ny !== null && q.ny > -0.85, ADD);
    s = await state();
    console.log(`  out of the bottom by dx: ${out}, normal (${s.nx?.toFixed(2)}, ${s.ny?.toFixed(2)}, ${s.nz?.toFixed(2)}), gizmo (${(s.gx * 1000).toFixed(0)}, ${(s.gy * 1000).toFixed(0)}, ${(s.gz * 1000).toFixed(0)}) mm`);
    await ev(`window.__leg = "settle2"`); await step(30);
    let back = false;
    for (let i = 0; i < 6 && !back; i++) back = await drag("dx-into-bottom", fd < 0 ? 200 : 1000, 450, -fd * PX, 0, Math.floor(780 / PX), false, (q) => q.ny !== null && q.ny < -0.85, ADD);
    s = await state();
    console.log(`  back on the bottom by dx: ${back}, normal (${s.nx?.toFixed(2)}, ${s.ny?.toFixed(2)}, ${s.nz?.toFixed(2)}), gizmo (${(s.gx * 1000).toFixed(0)}, ${(s.gy * 1000).toFixed(0)}, ${(s.gz * 1000).toFixed(0)}) mm`);
  }
  if (WALK === "end") {
    const x0 = (await state()).gx;
    await drag("dx-probe", 600, 450, 3, 0, 8, false, null);
    const x1 = (await state()).gx;
    const sgn = x1 > x0 ? 1 : -1;
    let e = false;
    for (let i = 0; i < 6 && !e; i++) e = await drag("to-end", sgn > 0 ? 200 : 1000, 450, sgn * PX, 0, Math.floor(780 / PX), false, (s) => s.nx !== null && s.nx > 0.8, 15);
    const s = await state();
    console.log(`  on the +x end face: ${e}, normal (${s.nx?.toFixed(2)}, ${s.ny?.toFixed(2)}, ${s.nz?.toFixed(2)}), gizmo (${(s.gx * 1000).toFixed(0)}, ${(s.gy * 1000).toFixed(0)}, ${(s.gz * 1000).toFixed(0)}) mm`);
  }
  if (WALK === "front" || WALK === "end" || WALK === "bottomout") {
    const on = await dyDrag("down-to-bottom", -1, (s) => s.ny !== null && s.ny < -0.85, ADD);
    const s = await state();
    console.log(`  on the bottom: ${on}, normal (${s.nx?.toFixed(2)}, ${s.ny?.toFixed(2)}, ${s.nz?.toFixed(2)}), gizmo (${(s.gx * 1000).toFixed(0)}, ${(s.gy * 1000).toFixed(0)}, ${(s.gz * 1000).toFixed(0)}) mm, hold ${s.hold}`);
    if (WALK === "bottomout") {
      await ev(`window.__leg = "settle"`); await step(30);
      if (process.env.EXITDX) { const n = +process.env.EXITDX; await drag("on-bottom-dx", 600, 300, n > 0 ? PX : -PX, 0, Math.abs(n), false, null); const sx = await state(); console.log(`  on the bottom after a dx: gizmo (${(sx.gx * 1000).toFixed(0)}, ${(sx.gy * 1000).toFixed(0)}, ${(sx.gz * 1000).toFixed(0)}) mm, normal y ${sx.ny?.toFixed(2)}`); }
      const out = await dyDrag("up-out-of-bottom", +(process.env.EXITDIR ?? 1), (s) => s.ny !== null && s.ny > -0.8, ADD);
      const s2 = await state();
      console.log(`  out of the bottom: ${out}, normal (${s2.nx?.toFixed(2)}, ${s2.ny?.toFixed(2)}, ${s2.nz?.toFixed(2)}), hold ${s2.hold}`);
    }
  }
  if (WALK === "top") {
    const on = await dyDrag("up-to-top", +1, (s) => s.ny !== null && s.ny > 0.85, ADD);
    const s = await state();
    console.log(`  on the top: ${on}, normal (${s.nx?.toFixed(2)}, ${s.ny?.toFixed(2)}, ${s.nz?.toFixed(2)}), hold ${s.hold}`);
    await ev(`window.__leg = "settle"`); await step(30);
    const out = await dyDrag("down-out-of-top", -1, (s) => s.ny !== null && s.ny < 0.5, ADD);
    const s2 = await state();
    console.log(`  out of the top: ${out}, normal (${s2.nx?.toFixed(2)}, ${s2.ny?.toFixed(2)}, ${s2.nz?.toFixed(2)}), hold ${s2.hold}`);
  }
  // ===== level_entry: LOOPS round the corner bottom / lower-front rectangle / tip triangles at +x (SIDE=-1: -x), steered on the glass toward
  // targets given as (x, phi): phi the angle round the body's axis (y 0.229, z 0.191 m) in the y-z plane, -90° the bottom, -141° the lower front face
  if (WALK === "loop") {
    const SIDE = +(process.env.SIDE ?? 1), REPS = +(process.env.REPS ?? 2), LPX = +(process.env.LPX ?? PX), OFF = +(process.env.OFF ?? 0.045);
    const AY = 0.229, AZ = 0.191, RIM = 0.2475, SEC = 360 / 7;
    const where = () => ev(`(() => { const g = window.__st.asmGizmoAt; if (!g) return null; const phi = Math.atan2(g[1] - ${AY}, g[2] - ${AZ}) * 180 / Math.PI;
      const k = Math.round((phi + 90) / ${SEC}); const tip = g[0] * ${SIDE} > ${RIM} + 0.002; const f = k === 0 ? (tip ? "T" : "B") : k === -1 ? (tip ? "U" : "F") : (tip ? "t" : "o") + k;
      return { x: g[0], phi, f, r: Math.hypot(g[1] - ${AY}, g[2] - ${AZ}) }; })()`);
    const glass = (w) => ev(`(() => { const c = window.__st.camera, t = c.getTarget(); const f = [t.x - c.position.x, t.y - c.position.y, t.z - c.position.z];
      const l = Math.hypot(...f); const F = f.map((x) => x / l); let u = [c.upVector.x, c.upVector.y, c.upVector.z]; const k = u[0]*F[0]+u[1]*F[1]+u[2]*F[2];
      u = [u[0]-k*F[0], u[1]-k*F[1], u[2]-k*F[2]]; const ul = Math.hypot(...u); u = u.map((x) => x / ul);
      const r = [u[1]*F[2]-u[2]*F[1], u[2]*F[0]-u[0]*F[2], u[0]*F[1]-u[1]*F[0]]; const w = ${JSON.stringify(w)};
      const a = w[0]*r[0]+w[1]*r[1]+w[2]*r[2], b = w[0]*u[0]+w[1]*u[1]+w[2]*u[2]; const m = Math.hypot(a, b) || 1; return [a / m, -b / m]; })()`);
    const corner = SIDE * RIM, phiC = -90 - SEC / 2;
    const T = { F: [corner - SIDE * OFF, phiC - 18], B: [corner - SIDE * OFF, phiC + 18], T: [corner + SIDE * OFF * 0.6, phiC + 18], U: [corner + SIDE * OFF * 0.6, phiC - 18],
      Bm: [0, phiC + 18], Fm: [0, phiC - 18], o1: [corner - SIDE * OFF, -90 + SEC / 2 + 18] };
    const leg = async (name, to) => {
      await ev(`window.__leg = "${name}"`);
      const [tx, tphi] = T[to];
      let x = 600, y = 400, pressed = false, frames = 0, ok = false;
      while (frames < 1200) {
        const p = await where(); if (!p) break;
        const ex = tx - p.x, ephi = ((tphi - p.phi + 540) % 360) - 180, arc = (ephi * Math.PI / 180) * p.r;
        if (p.f === to.slice(0, to === "o1" ? 2 : 1) && Math.hypot(ex, arc) < 0.008) { ok = true; break; }
        const ph = p.phi * Math.PI / 180; const w = [ex, arc * Math.cos(ph), -arc * Math.sin(ph)];
        const [fx, fy] = await glass(w);
        if (!pressed) { x = 600 - 380 * fx; y = 380 - 240 * fy; await mouse("mousePressed", x, y, 1); await step(2); pressed = true; } const sp = Math.min(LPX, Math.max(0.5, Math.hypot(ex, arc) * 1000 / 4));
        x += fx * sp; y += fy * sp; frames++;
        await mouse("mouseMoved", x, y, 1); await step(1);
        if (x < 30 || x > 1170 || y < 30 || y > 720) { await mouse("mouseReleased", x, y, 0); await step(2); pressed = false; }
      }
      if (pressed) await mouse("mouseReleased", x, y, 0);
      await step(20);
      const p = await where();
      return `${ok} ${frames} fr, at ${p ? p.f : "?"} x ${p ? (p.x * 1000).toFixed(0) : "-"} phi ${p ? p.phi.toFixed(0) : "-"}`;
    };
    const ccw = ["B", "T", "U", "F"], cw = ["U", "T", "B", "F"];
    const SEQ = { ccw, cw, back: ["B", "F"], backm: ["B", "Bm", "Fm", "F"], far: ["B", "o1", "B", "F"] };
    let seq = SEQ[process.env.LOOP ?? "ccw"];
    const st0 = process.env.START ?? "F";
    console.log(`  start ${st0}: ${await leg("to-start", st0)}`);
    const k0 = seq.indexOf(st0);
    seq = [...seq.slice(k0 + 1), ...seq.slice(0, k0 + 1)];
    for (let r = 0; r < REPS; r++) for (const f of seq) console.log(`  loop${r} ->${f}: ${await leg(`loop${r}-${f}`, f)}`);
  }
  const C = await ev("window.__cam");
  const err = await ev("window.__recErr ?? window.__stepErr ?? null");
  console.log(`  frames ${C.length}, errors ${errors}, recErr ${err}`);
  if (process.env.OUTJSON) writeFileSync(process.env.OUTJSON, JSON.stringify(C));
  ws.close();
} finally {
  kill();
  for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } }
  clearTimeout(watchdog);
}
