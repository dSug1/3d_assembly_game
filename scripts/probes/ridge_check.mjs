// THE TOP RIDGE OF Scene_0bis ARRIVED AT FROM A TIP, AND CROSSED (2026-11-16, step C5 — TILTED_POLE_CLOSE_IN.md §13): a deterministic headless run (the
// replay probe's virtual clock), the manner of mid_check.mjs and across_check.mjs, on the TOP of the spit's body (its ridge's two faces):
//   MODE=tip (default): the gizmo onto the triangle above the TIP's end (TIP +1 / -1) at S0 mm off the middle plane, ONE drag along the axis toward the
//     body's middle (onto the ridge's faces), then (BACK, default on; BACK=0 none) ONE drag back toward the tip;
//   MODE=across: from the ridge's face on FROM_SIDE (+1 / -1), ONE drag round the axis over the ridge onto the other face, then (BACK) ONE drag back.
// Per drag: the side's changes, the timed camera turns, the dy hold, the view's turn, and the gizmo's way on the glass against the finger's (sideways:
// 60 – 120° off it; against: over 120°).
//   URL=http://127.0.0.1:5191/?sceneIndex=4&idleOrbitOn=0MODE=tip S0=2 PX=3 [TIP=-1] [IN=1] node scripts/probes/ridge_check.mjs
//   (run through scripts/probes/mid_batch.sh with SCRIPT=ridge_check.mjs — the runbook: scripts/probes/ORBIT_GATES.md)
import { guardProbe } from "./probe_guard.mjs";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.URL;
const S0 = +(process.env.S0 ?? 0) / 1000, PX = +(process.env.PX ?? 3), IN = !!process.env.IN;
const RIM = +(process.env.RIM ?? 0.2475);
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_ridge_${process.pid}`);
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
      st.asmSpitSide ?? 0, st.asmZoneMix ? 1 : 0, st.asmEdgeHold ? 1 : 0, st.orbit.yaw, st.orbit.elevation, st.approach, st.asmTilt ? 1 : 0, st.asmFree ? 1 : 0]);
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
    hold: !!s.asmEdgeHold, mix: !!s.asmZoneMix, el: s.orbit.elevation, yaw: s.orbit.yaw }); })()`));
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
      if (until && k % 4 === 3) hit = until(await state());
    }
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
  const s0 = await state();
  if (s0.axis === null) throw new Error("no polar zone here");
  const ref = (() => { const a = s0.axis; const l = Math.hypot(a[2], a[0]); return l > 1e-9 ? [-a[2] / l, 0, a[0] / l] : [1, 0, 0]; })();
  const P0 = s0.pole ?? [0, 0, 0];
  const off = (g) => (g[0] - P0[0]) * ref[0] + (g[1] - P0[1]) * ref[1] + (g[2] - P0[2]) * ref[2]; // the signed distance from the vertical plane through the AXIS (the bottom face's middle line)
  const along = (g) => g[0] * s0.axis[0] + g[1] * s0.axis[1] + g[2] * s0.axis[2];
  const f3 = (v) => v.map((x) => (x * 1000).toFixed(0)).join(",");
  console.log(`${URL}\n  boot: zone ${s0.zone} axis [${s0.axis.map((x) => x.toFixed(2))}], approach ${s0.ap.toFixed(3)}, the gizmo (${f3(s0.g)}) mm, normal [${s0.n.map((x) => x.toFixed(2))}], side ${s0.side}`);
  if (IN) {
    await drag("probe", 250, 500, [0, -5], 12, true, null);
    const s1 = await state();
    const inDy = s1.ap < s0.ap - 1e-6 ? -1 : 1;
    let auto = s1.auto;
    for (let i = 0; i < 10 && !auto; i++) auto = await drag("approach-in", 250, inDy < 0 ? 700 : 100, [0, inDy * 5], 110, true, (s) => s.auto);
    console.log(`  close in: approach ${(await state()).ap.toFixed(3)}, auto ${(await state()).auto}`);
  }
  const EVERY = +(process.env.EVERY ?? 12), SIDE = +(process.env.FROM_SIDE ?? 1), TIP = +(process.env.TIP ?? 1), MODE = process.env.MODE ?? "tip", BACK = process.env.BACK !== "0";
  // the walks: each one drag; its frames read on the rows (the finger's way on the glass `fg`: x right, y up)
  const walks = [];
  const walk = async (leg, b, until, n) => {
    const [wx, wy] = startOf(b.d);
    const i0 = await ev("window.__rows.length");
    const hit = await drag(leg, wx, wy, [b.d[0] * PX, b.d[1] * PX], n ?? Math.round(330 * 3 / PX), false, until);
    await ev(`window.__leg = "${leg}-settle"`); await step(40);
    walks.push({ leg, i0, fg: [b.d[0], -b.d[1]], hit, end: await state() });
    return hit;
  };
  // 1. onto the top (the ridge's faces: the highest)
  const onTop = await climb("to-top", (s) => s.g[1], (s) => s.n !== null && s.n[1] > 0.8);
  if (MODE === "tip") {
    // 2. onto the triangle above the TIP's end (the tip's upper faces: |n.x| 0.88, n.y 0.42), 3. to S0 off the middle plane there, 4. the walk along the
    // axis toward the body's middle (onto the ridge's faces), 5. (BACK) the walk back toward the tip
    const onTip = await climb("to-tip", (s) => TIP * along(s.g), (s) => TIP * along(s.g) > RIM + 0.02 && s.n !== null && s.n[1] > 0.2);
    const atS0 = await climb("to-s0", (s) => -Math.abs(off(s.g) - S0) - 4 * Math.max(0, RIM + 0.02 - TIP * along(s.g)), (s) => Math.abs(off(s.g) - S0) < 0.003 && TIP * along(s.g) > RIM + 0.005 && s.n !== null && s.n[1] > 0.3, 12, 2, 0.002);
    await ev(`window.__leg = "settle"`); await step(60);
    const s3 = await state();
    console.log(`  on the top ${onTop}; above the ${TIP > 0 ? "+" : "-"}x tip ${onTip}; at ${(S0 * 1000).toFixed(0)} mm off the middle ${atS0} — the gizmo (${f3(s3.g)}) mm, normal [${s3.n.map((x) => x.toFixed(2))}], side ${s3.side}, off ${(off(s3.g) * 1000).toFixed(1)} mm`);
    const o3 = off(s3.g);
    const b = process.env.WALKDIR ? { d: process.env.WALKDIR.split(",").map(Number) } : await bestDir("walk", (s) => -TIP * along(s.g) - 3 * Math.abs(off(s.g) - o3), 3);
    await walk("walk-in", b, (s) => TIP * along(s.g) < 0.02);
    if (BACK) await walk("walk-back", { d: [-b.d[0], -b.d[1]] }, (s) => TIP * along(s.g) > RIM + 0.02);
  } else {
    // ACROSS THE RIDGE: from the ridge's face on SIDE (well off the ridge), one drag round the axis over the ridge onto the other face; (BACK) one drag back
    const onSide = await climb("to-side", (s) => SIDE * off(s.g) - 2 * Math.abs(along(s.g)), (s) => s.n !== null && s.n[1] > 0.8 && SIDE * off(s.g) > 0.07 && Math.abs(along(s.g)) < 0.12, 16, 2, 0.006);
    await ev(`window.__leg = "settle"`); await step(60);
    const s3 = await state();
    console.log(`  on the top ${onTop}; on the ridge's face on side ${SIDE} ${onSide} — the gizmo (${f3(s3.g)}) mm, normal [${s3.n.map((x) => x.toFixed(2))}], side ${s3.side}, off ${(off(s3.g) * 1000).toFixed(1)} mm`);
    const a3 = along(s3.g);
    const b = process.env.WALKDIR ? { d: process.env.WALKDIR.split(",").map(Number) } : await bestDir("walk", (s) => -SIDE * off(s.g) - 3 * Math.abs(along(s.g) - a3), 3);
    await walk("walk-over", b, (s) => SIDE * off(s.g) < -0.07);
    if (BACK) await walk("walk-back", { d: [-b.d[0], -b.d[1]] }, (s) => SIDE * off(s.g) > 0.07);
  }
  const R = await ev("window.__rows");
  const V = await ev("window.__verd");
  const sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]], dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
  const cross = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
  const deg = (x) => (x * 180) / Math.PI;
  const F = (i) => { const x = R[i]; const l = unit(sub([x[4], x[5], x[6]], [x[1], x[2], x[3]])); const k = dot([x[7], x[8], x[9]], l); const u = unit([x[7] - k * l[0], x[8] - k * l[1], x[9] - k * l[2]]); return { l, u, r: unit(cross(u, l)) }; };
  const rot = (a, c) => deg(Math.acos(Math.max(-1, Math.min(1, (dot(a.l, c.l) + dot(a.u, c.u) + dot(a.r, c.r) - 1) / 2))));
  const G = (i) => [R[i][10], R[i][11], R[i][12]];
  for (const w of walks) {
    let flips = 0, turns = 0, total = 0, worst = 0, held = 0, turning = 0, frames = 0, still = 0, side60 = 0, against = 0, moved = 0;
    const events = [];
    for (let i = Math.max(1, w.i0); i < R.length; i++) {
      if (R[i][0] !== w.leg) continue;
      frames++;
      const t = rot(F(i - 1), F(i));
      total += t; worst = Math.max(worst, t);
      if (R[i][18]) held++;
      if (R[i][17]) turning++;
      const g = G(i), dg = sub(g, G(i - 1));
      // the gizmo's way on the glass (the frame before's camera) against the finger's — outside a camera turn
      const fp = F(i - 1), gx = dot(dg, fp.r), gy = dot(dg, fp.u), gl = Math.hypot(gx, gy);
      if (gl < 2e-4) still++;
      else if (!R[i][17] && !R[i - 1][17]) { moved++; const a = deg(Math.acos(Math.max(-1, Math.min(1, (gx * w.fg[0] + gy * w.fg[1]) / gl)))); if (a > 120) against++; else if (a > 60) side60++; if (a > 60 && events.length < 30) events.push(`f${i} the gizmo ${a.toFixed(0)}° off the finger's way (${(gl * 1000).toFixed(1)} mm), off ${(off(g) * 1000).toFixed(1)} mm, ${(along(g) * 1000).toFixed(0)} mm along, n [${[R[i][13], R[i][14], R[i][15]].map((v) => v.toFixed(2))}], free ${R[i][23]}`); }
      if (R[i][16] !== R[i - 1][16] && R[i - 1][16] !== 0) { flips++; events.push(`f${i} side ${R[i - 1][16]} → ${R[i][16]} at ${(off(g) * 1000).toFixed(1)} mm off the middle, ${(along(g) * 1000).toFixed(0)} mm along, n [${[R[i][13], R[i][14], R[i][15]].map((v) => v.toFixed(2))}]`); }
      if (R[i][17] && !R[i - 1][17]) { turns++; events.push(`f${i} a camera turn starts at ${(off(g) * 1000).toFixed(1)} mm off the middle, ${(along(g) * 1000).toFixed(0)} mm along, n [${[R[i][13], R[i][14], R[i][15]].map((v) => v.toFixed(2))}]`); }
      if (R[i][18] && !R[i - 1][18]) events.push(`f${i} the dy hold set at ${(off(g) * 1000).toFixed(1)} mm off, ${(along(g) * 1000).toFixed(0)} mm along`);
      if (!R[i][18] && R[i - 1][18]) events.push(`f${i} the dy hold ended`);
    }
    const e = w.end;
    console.log(`  ${w.leg.toUpperCase()} (finger [${w.fg}] × ${PX} px a frame, ${frames} frames): reached ${w.hit} — the gizmo ends (${f3(e.g)}) mm, off ${(off(e.g) * 1000).toFixed(1)} mm, ${(along(e.g) * 1000).toFixed(0)} mm along, normal [${e.n.map((x) => x.toFixed(2))}], hold ${e.hold}`);
    console.log(`     the side changed ${flips} times, ${turns} timed camera turns; the view ${total.toFixed(0)}° in all, at most ${worst.toFixed(1)}° in a frame; in a turn ${turning}, the dy hold ${held}, the gizmo still ${still}; of ${moved} frames moving outside a turn: ${side60} sideways (60 – 120° off the finger), ${against} against it (> 120°)`);
    for (const x of events.slice(0, 30)) console.log(`       ${x}`);
    const path = [];
    for (let i = Math.max(1, w.i0), k = 0; i < R.length; i++) { if (R[i][0] !== w.leg) continue; if (k++ % EVERY === 0) { const fr = F(i); const ax = s0.axis; path.push(`${(along(G(i)) * 1000).toFixed(0)}/${(off(G(i)) * 1000).toFixed(1)}/${R[i][16]}${R[i][23] ? "F" : ""}/${deg(Math.atan2(dot(ax, fr.u), dot(ax, fr.r))).toFixed(0)}/${deg(Math.asin(Math.max(-1, Math.min(1, -fr.l[1])))).toFixed(0)}`); } }
    console.log(`     along mm / off mm / side (F: on a free face) / the axis on the glass ° (0 right, 90 up) / looking down °, every ${EVERY} frames: ${path.join("  ")}`);
    console.log(`     verdicts: ${V.filter((v) => v[1] === w.leg).map((v) => `f${v[0]} ${v[2]}`).join(" | ") || "none"}`);
  }
  { let big = 0, all = 0, holds = 0;
    for (let i = 1; i < R.length; i++) { const t = rot(F(i - 1), F(i)); if (t === t) { big = Math.max(big, t); all += t; } if (R[i][18] && !R[i - 1][18]) holds++; }
    console.log(`  SUMMARY (${R.length} frames): the view's largest turn in one frame ${big.toFixed(1)}°, in all ${all.toFixed(0)}°; dy holds set ${holds}`); }
  console.log(`  errors ${errors}, recErr ${await ev("window.__recErr ?? window.__stepErr ?? null")}`);
  ws.close();
} finally {
  kill();
  for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } }
  clearTimeout(watchdog);
}
