// ⭐⭐⭐ THE TILTED POLE'S PROBE (POLAR_ORBIT_CLEANUP.md §9.4) — headless Chrome on the dev server (`npm run dev:usb`, 127.0.0.1:5173): for each scenario the
// orbit is put over the cube's top (or under its bottom), a left press held still (the press's swing), then a drag at a constant step until the tilted
// facet is left and past it. Every frame: the camera (its place, its look, its up), its ROLL (the world's up on the screen against the screen's up), the
// gizmo, the tilt's state (k, the facet, the exit). Prints, per scenario: the press's jumps, the swing's end, the drag's largest per-frame steps, the roll
// at the exit and after, the exit's frame. Chrome hygiene as `page_eval.mjs` (its own profile, removed in `finally`; a watchdog; the tree killed on Windows).
//   URL=…  BOOT_MS=15000  ONLY=name (one scenario)  STEP=3 (px a frame)  OUT=file.json (the frames)
import { spawn, spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `tilt_probe_profile_${process.pid}`);
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1500,830", `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
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
const STEP = +(env.STEP ?? 3);
// name, the orbit's yaw and pitch to start from (deg), the drag's step (px a frame: x right, y down), the most steps
const SCENARIOS = [
  ["top_dx_right_swing30", -60, 62, [STEP, 0], 420],
  ["top_dx_left_square", -90, 62, [-STEP, 0], 420],
  ["top_dy_away_far_edge", -90, 62, [0, -STEP], 420],
  ["top_dy_toward_front", -75, 62, [0, STEP], 420],
  ["top_diag_swing40", -50, 70, [STEP * 0.7, -STEP * 0.7], 420],
  ["bottom_dx_right", -90, -62, [STEP, 0], 420],
  ["bottom_dy_down_far_edge", -120, -62, [0, STEP], 420],
].filter((s) => env.ONLY === undefined || s[0] === env.ONLY);

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
  // the recorder: every frame
  await ev(`(() => { const st = window.__st; if (!st) throw new Error("no window.__st"); window.__rec = []; window.__tag = "";
    const v3 = (v) => [v.x, v.y, v.z];
    const tick = () => { try { const c = st.camera; const p = v3(c.position); const t = v3(c.target); const up = v3(c.upVector);
      const f = [t[0] - p[0], t[1] - p[1], t[2] - p[2]]; const fl = Math.hypot(...f); const fn = f.map((x) => x / fl);
      const wp = [0 - fn[1] * fn[0], 1 - fn[1] * fn[1], 0 - fn[1] * fn[2]]; const wl = Math.hypot(...wp);
      let roll = null; if (wl > 0.2) { const w = wp.map((x) => x / wl); const ul = Math.hypot(...up); const u = up.map((x) => x / ul);
        const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        roll = Math.atan2(cr[0] * fn[0] + cr[1] * fn[1] + cr[2] * fn[2], u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) * 180 / Math.PI; }
      const tl = st.asmTilt;
      window.__rec.push({ tag: window.__tag, p, t, up, roll, g: st.asmG ? [...st.asmG] : null, piece: st.greenBox ? v3(st.greenBox.getAbsolutePosition()) : null,
        tl: tl ? { id: tl.id, k: tl.k, facet: tl.facet, exit: tl.exit, sw: tl.swingMs } : null, stack: st.asmShown ? st.asmShown.t.stack : null, band: st.asmShown ? st.asmShown.t.band : null,
        goff: st.asmGOff ? st.asmGOff.left : null, gz: st.asmGizmo ? [...st.asmGizmo] : null, ov: [st.orbit.yaw, st.orbit.elevation], v: String(st.lastVerdict ?? "").slice(0, 80) }); } catch (e) { window.__recErr = String(e); }
      requestAnimationFrame(tick); };
    requestAnimationFrame(tick); return true; })()`);
  const vp = JSON.parse(await ev("JSON.stringify([innerWidth, innerHeight])"));
  const [W, H] = vp;
  const move = (type, m, buttons) => send("Input.dispatchMouseEvent", { type, x: m[0], y: m[1], button: "left", buttons, clickCount: 1 });
  const frame = () => ev("new Promise((r) => requestAnimationFrame(() => r(1)))");
  const all = {};
  for (const [name, yaw, pitch, step, n] of SCENARIOS) {
    await ev(`window.__tag = "setup"; (() => { const st = window.__st; st.asmTilt = null; st.asmGOff = null; st.asmMapQ = null; st.orbitUserV = null; st.orbitRawPrev = null; st.orbit.reset(${yaw * D}, ${(pitch / 90 + 1) / 2}); st.orbitInertia.stop(); })()`);
    await sleep(2500);
    const start = [step[0] > 0 ? 160 : step[0] < 0 ? W - 160 : W * 0.25, step[1] > 0 ? 180 : step[1] < 0 ? H - 60 : H - 120];
    await ev(`window.__rec = []; window.__tag = "before"`);
    for (let k = 0; k < 5; k++) await frame();
    await ev(`window.__tag = "press"`);
    await move("mousePressed", start, 1);
    for (let k = 0; k < 40; k++) await frame(); // the swing (300 ms) held still
    await ev(`window.__tag = "drag"`);
    let m = start;
    let after = -1;
    for (let j = 0; j < n; j++) {
      const m2 = [m[0] + step[0], m[1] + step[1]];
      if (m2[0] < 4 || m2[0] > W - 4 || m2[1] < 4 || m2[1] > H - 4) break;
      m = m2;
      await move("mouseMoved", m, 1);
      await frame();
      const out = await ev("window.__st.asmTilt === null");
      if (out && after < 0) after = j;
      if (after >= 0 && j - after > 40) break;
    }
    await ev(`window.__tag = "release"`);
    await move("mouseReleased", m, 0);
    for (let k = 0; k < 20; k++) await frame();
    all[name] = JSON.parse(await ev("JSON.stringify(window.__rec)"));
    const err = await ev("window.__recErr ?? null");
    if (err) console.log("REC ERROR", err);
  }
  ws.close();
  if (env.OUT) writeFileSync(env.OUT, JSON.stringify(all));
  // the summary
  const ang = (a, b) => { const la = Math.hypot(...a), lb = Math.hypot(...b); return (Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb)))) * 180) / Math.PI; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const look = (r) => [r.p[0] - r.t[0], r.p[1] - r.t[1], r.p[2] - r.t[2]];
  const head = (r) => (r.piece && r.gz ? (Math.atan2(r.piece[2] - r.gz[2], r.piece[0] - r.gz[0]) * 180) / Math.PI : NaN); // the piece's heading from the gizmo's foot
  const elev = (r) => (r.piece && r.gz ? (Math.asin((r.piece[1] - r.gz[1]) / dist(r.piece, r.gz)) * 180) / Math.PI : NaN);
  for (const [name, fr] of Object.entries(all)) {
    const step = SCENARIOS.find((x) => x[0] === name)[3];
    const before = fr.filter((r) => r.tag === "before").at(-1);
    const press = fr.filter((r) => r.tag === "press");
    const drag = fr.filter((r) => r.tag === "drag");
    const p0 = press[0];
    const lines = [`\n=== ${name}: ${fr.length} frames; before the press: band ${before?.band}, roll ${before?.roll?.toFixed(1)}°, heading ${before ? head(before).toFixed(1) : "?"}°`];
    if (before && p0) {
      lines.push(`  PRESS (1st frame): tilt ${p0.tl ? `#${p0.tl.id} facet ${p0.tl.facet}` : "NONE"}; camera moved ${(dist(before.p, p0.p) * 1000).toFixed(1)} mm, its look ${ang(look(before), look(p0)).toFixed(2)}°, its up ${ang(before.up, p0.up).toFixed(2)}°; gizmo ${before.g && p0.g ? (dist(before.g, p0.g) * 1000).toFixed(2) : "?"} mm — ${p0.v}`);
      const pe = press.at(-1);
      let maxRoll = 0, maxG = 0, maxLook = 0;
      for (let i = 1; i < press.length; i++) {
        if (press[i].roll !== null) maxRoll = Math.max(maxRoll, Math.abs(press[i].roll));
        if (press[i].g && press[i - 1].g) maxG = Math.max(maxG, dist(press[i].g, press[i - 1].g) * 1000);
        maxLook = Math.max(maxLook, ang(look(press[i]), look(press[i - 1])));
      }
      lines.push(`  SWING (held still, ${press.length} frames): the piece's heading ${head(p0).toFixed(1)}° → ${head(pe).toFixed(1)}°, its elevation ${elev(p0).toFixed(1)}° → ${elev(pe).toFixed(1)}°; |roll| max ${maxRoll.toFixed(2)}°; a frame's look ≤ ${maxLook.toFixed(2)}°, gizmo ≤ ${maxG.toFixed(2)} mm; gizmo moved ${(dist(before.g, pe.g) * 1000).toFixed(1)} mm in all; the gOff left ${pe.goff}`);
    }
    if (drag.length > 1) {
      let mLook = 0, mUp = 0, mG = 0, mPiece = 0, mRollStep = 0;
      const exitI = drag.findIndex((r) => r.tl === null);
      for (let i = 1; i < drag.length; i++) {
        const a = drag[i - 1], b = drag[i];
        mLook = Math.max(mLook, ang(look(a), look(b)));
        mUp = Math.max(mUp, ang(a.up, b.up));
        if (a.g && b.g) mG = Math.max(mG, dist(a.g, b.g) * 1000);
        if (a.piece && b.piece) mPiece = Math.max(mPiece, dist(a.piece, b.piece) * 1000);
        if (a.roll !== null && b.roll !== null) mRollStep = Math.max(mRollStep, Math.abs(((b.roll - a.roll + 540) % 360) - 180));
      }
      // the gizmo's way on the screen against the finger's (I5: the same direction) — while tilted and in the face's middle (k 0), and after the exit
      const agree = (rs) => {
        let ok = 0, bad = 0;
        for (let i = 1; i < rs.length; i++) {
          const a = rs[i - 1], b = rs[i];
          if (!a.g || !b.g) continue;
          const dg = [b.g[0] - a.g[0], b.g[1] - a.g[1], b.g[2] - a.g[2]];
          if (Math.hypot(...dg) < 1e-4) continue;
          const f = [b.t[0] - b.p[0], b.t[1] - b.p[1], b.t[2] - b.p[2]];
          const u = b.up;
          const r = [u[1] * f[2] - u[2] * f[1], u[2] * f[0] - u[0] * f[2], u[0] * f[1] - u[1] * f[0]];
          const sx = dg[0] * r[0] + dg[1] * r[1] + dg[2] * r[2];
          const sy = dg[0] * u[0] + dg[1] * u[1] + dg[2] * u[2];
          const want = [step[0], -step[1]]; // screen y down; the camera's up is up
          const dotv = sx * want[0] + sy * want[1];
          if (dotv > 0) ok++;
          else bad++;
        }
        return `${ok} with / ${bad} against`;
      };
      lines.push(`  the gizmo on the screen against the finger: tilted, mid-face ${agree(drag.filter((r) => r.tl !== null && r.tl.k < 0.05))}; after the exit ${agree(drag.filter((r) => r.tl === null))}`);
      lines.push(`  DRAG (${drag.length} frames): a frame's look ≤ ${mLook.toFixed(2)}°, up ≤ ${mUp.toFixed(2)}°, roll step ≤ ${mRollStep.toFixed(2)}°, gizmo ≤ ${mG.toFixed(1)} mm, piece ≤ ${mPiece.toFixed(1)} mm`);
      if (exitI >= 0) {
        const ks = drag.slice(Math.max(0, exitI - 25), exitI + 1).map((r) => (r.tl ? r.tl.k.toFixed(2) : "W")).join(" ");
        const rolls = drag.slice(Math.max(0, exitI - 25), Math.min(drag.length, exitI + 6)).map((r) => (r.roll === null ? "—" : r.roll.toFixed(0))).join(" ");
        lines.push(`  EXIT at drag frame ${exitI}: k before → ${ks}`);
        lines.push(`  roll (°) round it: ${rolls}`);
        const tail = drag.slice(exitI, exitI + 40).filter((r) => r.roll !== null);
        lines.push(`  after the exit: |roll| max ${Math.max(0, ...tail.map((r) => Math.abs(r.roll))).toFixed(2)}° (${tail.length} frames with a roll read); band ${drag[exitI].band}; ${drag[exitI].v}`);
      } else lines.push(`  NO EXIT in the drag (last: tilt ${drag.at(-1).tl ? `k ${drag.at(-1).tl.k.toFixed(2)}` : "none"}, band ${drag.at(-1).band}, roll ${drag.at(-1).roll?.toFixed(1)})`);
    }
    console.log(lines.join("\n"));
  }
} finally {
  clearTimeout(watchdog);
  killChrome();
  await sleep(700);
  removeProfile();
}
