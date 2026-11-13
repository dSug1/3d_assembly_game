// ⭐⭐⭐ THE ORBIT AT CONTACT — step 0 of the slide's removal (CLOSE_IN_CONTACT.md): headless Chrome on the dev server (`npm run dev:usb`, 127.0.0.1:5173).
// For each scenario: the orbit put over a face of the cube (yaw, pitch), the piece brought to a distance from the gizmo — FREE (a set distance) or AT
// CONTACT (A held + a drag in, until the approach stops) — then a one-finger drag at a constant step. Every frame: the exact gizmo, the piece, the solver's
// work (queries, touched, deferred, blocked), the slide (ready = the contours lit, on = latched), the orbit's target against the solved place.
// Prints per scenario: the finger's travel, the gizmo's and the piece's (mm), their ratio to the FREE run of the same face, the frames the contact readout was
// lit (`contactReady`) / a slide on (none since 2026-11-12), the frames the solver deferred / touched / was blocked, the frames the finger moved and the orbit did not.
// Chrome hygiene as `tilt_probe.mjs` (its own profile, removed in `finally`; a watchdog; the tree killed on Windows).
//   URL=…  BOOT_MS=15000  ONLY=name  STEP=2 (px a frame)  N=40 (frames)  OUT=file.json (the frames)
//   MISALIGN=1 — the piece turned so its resting face's normal is (1, 1, 1)/√3 (a CORNER down): more than 2° off every face of the cube (the contours
//   never light, the slide never latches) — the solver's contact alone; MISALIGN=edge — turned 45° about the world's x (an EDGE onto the top and the front)
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `contact_probe_profile_${process.pid}`);
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
// ⭐⭐ (2026-11-12) NO DISK LITTER: Chrome's own temp files (the component updater's `Cr24` packages, `scoped_dir*`, the url fetcher's folder) went to %TEMP%
// itself — outside the profile removed in `finally`, and a `taskkill /F` skips Chrome's own cleanup (20 files, ~4 MB, one session). Now its TEMP / TMP are
// INSIDE the profile, and the updater and the background network are off.
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET_FLAGS = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1500,830", `--user-data-dir=${prof}`, ...QUIET_FLAGS, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const killChrome = () => (process.platform === "win32" && chrome.pid !== undefined ? spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }) : chrome.kill());
function removeProfile() {
  for (let i = 0; i < 6; i++) {
    try {
      rmSync(prof, { recursive: true, force: true });
      return;
    } catch (e) {
      if (i === 5) console.error(`⚠ the probe's Chrome profile was NOT removed: ${prof} (${e})`);
      else spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]);
    }
  }
}
const watchdog = setTimeout(() => {
  console.error("WATCHDOG: past 15 min");
  killChrome();
  removeProfile();
  process.exit(2);
}, 15 * 60_000);
watchdog.unref();

const D = Math.PI / 180;
const STEP = +(env.STEP ?? 2);
const N = +(env.N ?? 40);
// name, the orbit's yaw and pitch (deg), the piece: a distance from the gizmo (m) or "contact", the drag's step (px: x right, y down)
const SCENARIOS = [
  ["top_free_dx", -90, 62, 0.3, [STEP, 0]],
  ["top_contact_dx", -90, 62, "contact", [STEP, 0]],
  ["top_free_dy", -90, 62, 0.3, [0, STEP]],
  ["top_contact_dy", -90, 62, "contact", [0, STEP]],
  ["top_near_dx", -90, 62, 0.012, [STEP, 0]],
  ["front_free_dx", -90, 10, 0.3, [STEP, 0]],
  ["front_contact_dx", -90, 10, "contact", [STEP, 0]],
  ["front_free_dy", -90, 10, 0.3, [0, -STEP]],
  ["front_contact_dy", -90, 10, "contact", [0, -STEP]],
  // ⭐ (before 2026-11-12) the slide kept from latching: the solver's contact alone — the slide is removed since, kept for the comparison
  ["top_contact_dx_noslide", -90, 62, "contact", [STEP, 0], { noSlide: true }],
  ["top_contact_dy_noslide", -90, 62, "contact", [0, STEP], { noSlide: true }],
  // ⭐ (2026-11-12, step 2) the distance SET (no approach drag — its sticky blocked flag left out): far, 0.3 m, 20 mm, the approach's minimum
  ["top_set1.0_dx", -90, 62, 1.0, [STEP, 0]],
  ["top_set0.3_dx", -90, 62, 0.3, [STEP, 0]],
  ["top_set0.02_dx", -90, 62, 0.02, [STEP, 0]],
  ["top_setmin_dx", -90, 62, "min", [STEP, 0]],
  // ⭐ (2026-11-12) SCEN='[["name", yaw, pitch, "contact", [dx, dy]], …]' — scenarios of one's own (the owner's channel: in by A + dy, then dx)
  ...(env.SCEN ? JSON.parse(env.SCEN) : []),
].filter((s) => (env.SCEN === undefined || env.SCEN.includes(`"${s[0]}"`)) && (env.ONLY === undefined || String(s[0]).includes(env.ONLY)));

try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    await sleep(250);
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch {}
  }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error(`Chrome's DevTools did not answer on port ${port}`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
    if (m.method === "Runtime.exceptionThrown") console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 600));
  });
  const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr });
    if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 800));
    return r?.result?.value;
  };
  await send("Runtime.enable");
  await send("Page.navigate", { url: env.URL ?? "http://127.0.0.1:5173/" });
  await sleep(+(env.BOOT_MS ?? 15000));
  await ev(`(() => { const st = window.__st; if (!st) throw new Error("no window.__st"); window.__rec = []; window.__tag = "";
    const v3 = (v) => [v.x, v.y, v.z];
    const tick = () => { try {
      window.__rec.push({ tag: window.__tag, g: st.asmG ? [...st.asmG] : null, piece: st.greenBox ? v3(st.greenBox.getAbsolutePosition()) : null,
        q: st.pieceQ ? [st.pieceQ.yaw, st.pieceQ.v] : null, ov: [st.orbit.yaw, st.orbit.elevation], ap: st.approach,
        sq: st.pieceSolveQueries, qs: st.pieceQueries, touch: !!st.pieceTouching, def: !!st.pieceDeferred, blk: !!st.pieceMoveBlocked,
        ready: st.contactReady != null, an: st.pieceAnchor ? [...st.pieceAnchor] : null, col: String(st.lastCollision ?? "").slice(0, 80), colAt: st.lastCollisionAt ?? 0, on: st.hover != null, rot: st.greenBox?.rotationQuaternion ? st.greenBox.rotationQuaternion.asArray().map((x) => +x.toFixed(3)) : null, tilt: st.asmTilt ? st.asmTilt.id : null, v: String(st.lastVerdict ?? "").slice(0, 110) });
    } catch (e) { window.__recErr = String(e); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick); return true; })()`);
  const [W, H] = JSON.parse(await ev("JSON.stringify([innerWidth, innerHeight])"));
  const move = (type, m, buttons) => send("Input.dispatchMouseEvent", { type, x: m[0], y: m[1], button: "left", buttons, clickCount: 1 });
  const frame = () => ev("new Promise((r) => requestAnimationFrame(() => r(1)))");
  const setDist = (m) => `(async () => { const st = window.__st; const A = await import("/src/input/assembly_orbit.ts"); let lo = A.approachRange(st.cfg).min, hi = 1; for (let i = 0; i < 40; i++) { const x = (lo + hi) / 2; if (A.approachDistance(st.cfg, x) < ${m}) lo = x; else hi = x; } st.approach = (lo + hi) / 2; st.approachInertia?.stop?.(); })()`;
  const all = {};
  const notes = {};
  for (const [name, yaw, pitch, dist, step, opts] of SCENARIOS) {
    await ev(`window.__noSlide = ${!!opts?.noSlide}`);
    // ⭐ far out first, the orbit put there and the solver seeded AT it (⛔ solved from the last scenario's place, the piece was driven through the cube)
    await ev(`window.__tag = "setup"; window.__st.approach = 1`);
    await ev(`(() => { const st = window.__st; st.asmTilt = null; st.asmGOff = null; st.asmMapQ = null; st.orbitUserV = null; st.orbitRawPrev = null; st.hover = null; st.hoverFollow = null; const v = ${(pitch / 90 + 1) / 2}; st.orbit.reset(${yaw * D}, v); st.orbitInertia.stop(); if (st.pieceQ) st.pieceQ = { ...st.pieceQ, yaw: ${yaw * D}, v }; st.boxSpring = null; })()`);
    if (env.MISALIGN) {
      // ⭐ the resting face turned off every face: the piece's rotation that takes the resting face's normal (from the boot's −y) to (1, 1, 1)/√3
      await ev(`(() => { const st = window.__st; const b = st.greenBox; const n = ${env.MISALIGN === "edge" ? "[0, -Math.SQRT1_2, Math.SQRT1_2]" : "[1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]"}; const f = [0, -1, 0];
        const ax = [f[1] * n[2] - f[2] * n[1], f[2] * n[0] - f[0] * n[2], f[0] * n[1] - f[1] * n[0]]; const l = Math.hypot(...ax); const a = Math.acos(f[0] * n[0] + f[1] * n[1] + f[2] * n[2]);
        const s = Math.sin(a / 2) / l; const r = b.rotationQuaternion; const q = [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(a / 2)];
        const boot = [r.x, r.y, r.z, r.w]; const m = (p, q) => [p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1], p[3] * q[1] - p[0] * q[2] + p[1] * q[3] + p[2] * q[0], p[3] * q[2] + p[0] * q[1] - p[1] * q[0] + p[2] * q[3], p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2]];
        if (!window.__boot) window.__boot = boot; const o = m(q, window.__boot); r.x = o[0]; r.y = o[1]; r.z = o[2]; r.w = o[3]; st.restAlign = null; })()`);
    }
    await sleep(1500);
    if (dist === "min") await ev(`(async () => { const A = await import("/src/input/assembly_orbit.ts"); window.__st.approach = A.approachRange(window.__st.cfg).min; })()`);
    else await ev(setDist(dist === "contact" ? 0.03 : dist));
    await sleep(1500);
    await ev(`window.__rec = []`);
    if (opts?.pre) {
      // ⭐ (2026-11-12) a drag BEFORE the approach: [dx, dy, frames] — the gizmo brought over the spot (the channel's middle)
      const [px0, py0, nf] = opts.pre;
      let m0 = [px0 >= 0 ? 200 : W - 200, py0 >= 0 ? 120 : H - 120];
      await move("mousePressed", m0, 1);
      for (let k = 0; k < 6; k++) await frame();
      for (let j = 0; j < nf; j++) { m0 = [m0[0] + px0, m0[1] + py0]; await move("mouseMoved", m0, 1); await frame(); }
      await move("mouseReleased", m0, 0);
      for (let k = 0; k < 40; k++) await frame();
      notes[name + "_pre"] = await ev(`({ g: window.__st.asmG, piece: window.__st.greenBox.getAbsolutePosition().asArray() })`);
    }
    if (dist === "contact") {
      // ⭐ A held + a drag: the approach in until it stops (the sign found by its first steps)
      await ev(`window.__tag = "approach"; window.__st.orbitApproachKey = true`);
      const p0 = [W * 0.5, H * 0.5];
      await move("mousePressed", p0, 1);
      const a0 = await ev("window.__st.approach");
      let m = p0, dir = 1, last = a0, still = 0, decided = false;
      for (let j = 0; j < 400 && still < 25; j++) {
        const m2 = [m[0], m[1] + dir * 2];
        if (m2[1] < 10 || m2[1] > H - 10) {
          await move("mouseReleased", m, 0);
          m = [W * 0.5, dir > 0 ? 40 : H - 40];
          await move("mousePressed", m, 1);
          continue;
        }
        m = m2;
        await move("mouseMoved", m, 1);
        await frame();
        const a = await ev("window.__st.approach");
        if (!decided && Math.abs(a - a0) > 1e-6) { decided = true; if (a > a0) dir = -dir; } // the wrong way (decided at its first change): reverse
        (globalThis.__trace ??= []).push(+a.toFixed(4));
        still = decided && Math.abs(a - last) < 1e-7 ? still + 1 : 0;
        last = a;
      }
      await move("mouseReleased", m, 0);
      await ev(`window.__st.orbitApproachKey = false`);
      for (let k = 0; k < 60; k++) await frame();
      if (env.TRACE) console.log(name, "approach trace", JSON.stringify(globalThis.__trace), "after", await ev("window.__st.approach"));
      globalThis.__trace = [];
      notes[name] = await ev(`(async () => { const st = window.__st; const A = await import("/src/input/assembly_orbit.ts"); return { approach: st.approach, distMm: A.approachDistance(st.cfg, st.approach) * 1000, ready: st.contactReady != null, on: st.hover != null, rot: st.greenBox?.rotationQuaternion ? st.greenBox.rotationQuaternion.asArray().map((x) => +x.toFixed(3)) : null, v: String(st.lastVerdict ?? "").slice(0, 140) }; })()`);
    } else {
      for (let k = 0; k < 20; k++) await frame();
      notes[name] = await ev(`({ ready: window.__st.contactReady != null, on: window.__st.hover != null, v: String(window.__st.lastVerdict ?? "").slice(0, 140) })`);
    }
    // ⭐ (2026-11-12) EVAL=file.js — an async function body run in the page before the drag (`st` = window.__st); its result in the notes
    if (env.EVAL) notes[name + "_eval"] = await ev(`(async () => { const st = window.__st; ${readFileSync(env.EVAL, "utf8")} })()`);
    // the drag: from a spot on empty space where the step has room
    const start = [step[0] > 0 ? 200 : step[0] < 0 ? W - 200 : 200, step[1] > 0 ? 120 : step[1] < 0 ? H - 60 : H - 120];
    await ev(`window.__tag = "press"`);
    await move("mousePressed", start, 1);
    for (let k = 0; k < 10; k++) await frame();
    await ev(`window.__tag = "drag"`);
    let m = start;
    let px = 0;
    for (let j = 0; j < N; j++) {
      const m2 = [m[0] + step[0], m[1] + step[1]];
      if (m2[0] < 4 || m2[0] > W - 4 || m2[1] < 4 || m2[1] > H - 4) break;
      m = m2;
      px += Math.hypot(step[0], step[1]);
      await move("mouseMoved", m, 1);
      await frame();
    }
    await ev(`window.__tag = "release"`);
    await move("mouseReleased", m, 0);
    for (let k = 0; k < 20; k++) await frame();
    // ⭐ (2026-11-12) EVAL_AFTER=file.js — the same, after the drag (where it stopped)
    if (env.EVAL_AFTER) notes[name + "_after"] = await ev(`(async () => { const st = window.__st; ${readFileSync(env.EVAL_AFTER, "utf8")} })()`);
    all[name] = { px, frames: JSON.parse(await ev("JSON.stringify(window.__rec)")) };
    const err = await ev("window.__recErr ?? null");
    if (err) console.log("REC ERROR", err);
  }
  ws.close();
  if (env.OUT) writeFileSync(env.OUT, JSON.stringify({ notes, all }));
  const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const pathMm = (rs, k) => { let s = 0; for (let i = 1; i < rs.length; i++) if (rs[i][k] && rs[i - 1][k]) s += dist3(rs[i][k], rs[i - 1][k]); return s * 1000; };
  const summary = {};
  for (const [name, { px, frames }] of Object.entries(all)) {
    const d = frames.filter((r) => r.tag === "drag");
    const n = d.length;
    const cnt = (f) => d.filter(f).length;
    const held = cnt((r, i) => i > 0 && Math.abs(r.ov[0] - d[i - 1].ov[0]) + Math.abs(r.ov[1] - d[i - 1].ov[1]) < 1e-9);
    const qsSorted = d.map((r) => r.sq ?? 0).sort((a, b) => a - b);
    summary[name] = { gMm: pathMm(d, "g"), pieceMm: pathMm(d, "piece") };
    const dYaw = d.length > 1 ? (Math.atan2(Math.sin(d.at(-1).ov[0] - d[0].ov[0]), Math.cos(d.at(-1).ov[0] - d[0].ov[0])) * 180) / Math.PI : 0;
    const dV = d.length > 1 ? d.at(-1).ov[1] - d[0].ov[1] : 0;
    console.log(`  the orbit's target: yaw ${dYaw.toFixed(2)}°, v ${dV.toFixed(4)} over the drag`);
    const verdicts = [...new Set(d.map((r) => r.v))].slice(0, 4);
    console.log(`\n=== ${name}: ${n} frames, the finger ${px} px; before the drag: ${JSON.stringify(notes[name])}
  the gizmo ${summary[name].gMm.toFixed(1)} mm, the piece ${summary[name].pieceMm.toFixed(1)} mm
  the slide: ready ${cnt((r) => r.ready)} frames, ON ${cnt((r) => r.on)}; the solver: touched ${cnt((r) => r.touch)}, deferred ${cnt((r) => r.def)}, blocked ${cnt((r) => r.blk)}; queries a frame median ${qsSorted[n >> 1]}, max ${qsSorted[n - 1]}; the orbit's angles unchanged on ${held} of ${n} frames; tilt ${[...new Set(d.map((r) => r.tilt))].join(",")}
  verdicts: ${verdicts.join(" | ")}`);
  }
  console.log("\n=== AT CONTACT AGAINST FREE (the gizmo's travel, the piece's)");
  for (const name of Object.keys(summary)) {
    if (!/contact|near/.test(name)) continue;
    const ref = summary[name.replace(/contact|near/, "free").replace("_noslide", "")];
    if (!ref) continue;
    const s = summary[name];
    console.log(`  ${name}: gizmo ${(s.gMm / Math.max(1e-9, ref.gMm)).toFixed(2)} ×, piece ${(s.pieceMm / Math.max(1e-9, ref.pieceMm)).toFixed(2)} × the free run's`);
  }
} finally {
  clearTimeout(watchdog);
  killChrome();
  await sleep(700);
  removeProfile();
}
