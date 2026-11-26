// ⭐⭐⭐ (2026-11-25, IN14 — `Claude/10_INPUT_TOUCH/spec/PIECE_TURN.md` §7 P2 – P6) THE PIECE ZONE, SMOKE-TESTED headless on `Scene_1` (and `Scene_2`'s pick):
// the drag in the zone turns the piece and the release snaps it onto a direction; the camera stays; the undo puts it back; A + drag rolls to a stop; the
// face tap rests the tapped face onto the last quad; close in the piece STEPS BACK, turns, comes back in — never into a part; the touch twist rolls.
// Real time (not the virtual clock): a smoke test, not a replay. Prints one CHECK line per check; exit 1 on a FAIL.
// Chrome hygiene as `contact_probe.mjs` (its own profile with its TEMP inside, removed in `finally`; a watchdog; the tree killed on Windows).
//   URL=…  BOOT_MS=15000  ONLY=<scenario substring>
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_zone_${process.pid}`);
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET_FLAGS = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET_FLAGS, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
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
  console.error("WATCHDOG: past 10 min");
  killChrome();
  removeProfile();
  process.exit(2);
}, 10 * 60_000);
watchdog.unref();

let fails = 0;
const check = (name, ok, detail) => {
  if (!ok) fails++;
  console.log(`CHECK ${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
};

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
    if (m.method === "Runtime.exceptionThrown") {
      fails++;
      console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 600));
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr });
    if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 800));
    return r?.result?.value;
  };
  await send("Runtime.enable");
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Page.navigate", { url: env.URL ?? "http://127.0.0.1:5191/?sceneIndex=1&bootAnimOn=0&idleOrbitOn=0" });
  await sleep(+(env.BOOT_MS ?? 15000));
  // ⭐ the page's helpers: the piece's centre on the glass, its pose, its resting face's normal, its alignment's error, its gap (the drawn pose)
  await ev(`(async () => {
    const st = window.__st; if (!st) throw new Error("no window.__st");
    const C = await import("/src/core/collision.ts"); const W = await import("/src/render/collision_wiring.ts"); const O = await import("/src/core/object_model.ts"); const G = await import("/src/render/green_box_wiring.ts");
    const rot = (q, v) => { const [w, x, y, z] = q; const ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
      return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]; };
    const z = {
      q: () => { const r = st.greenBox.rotationQuaternion; return [r.w, r.x, r.y, r.z]; },
      cam: () => { const c = st.camera.position; return [c.x, c.y, c.z]; },
      centre: () => { const c = st.greenBox.getBoundingInfo().boundingBox.centerWorld; return [c.x, c.y, c.z]; },
      project: (w) => { const m = st.scene.getTransformMatrix().m; const x = w[0] * m[0] + w[1] * m[4] + w[2] * m[8] + m[12], y = w[0] * m[1] + w[1] * m[5] + w[2] * m[9] + m[13], ww = w[0] * m[3] + w[1] * m[7] + w[2] * m[11] + m[15];
        const r = st.canvas.getBoundingClientRect(); return [r.left + ((x / ww + 1) / 2) * r.width, r.top + ((1 - y / ww) / 2) * r.height]; },
      restN: () => { const p = st.orbitPieces.find((o) => o.mesh === st.greenBox); return rot(z.q(), p.restingFace.normal); },
      alignErr: () => { const n = z.restN(); let best = 180; for (const d of st.orientDirs) best = Math.min(best, (Math.acos(Math.max(-1, Math.min(1, -(n[0] * d.normal[0] + n[1] * d.normal[1] + n[2] * d.normal[2])))) * 180) / Math.PI); return best; },
      // the solver's anchor (the ring's, no offset) against the drawn one (m)
      drift: () => { if (!st.pieceQ || !st.pieceAnchor) return -1; const a = G.ringAnchorRaw(st, st.pieceQ); const o = st.pieceTurn.offset ?? [0, 0, 0]; return Math.hypot(a[0] + o[0] - st.pieceAnchor[0], a[1] + o[1] - st.pieceAnchor[1], a[2] + o[2] - st.pieceAnchor[2]); },
      gap: () => { const b = st.greenBox; const p = b.position; const world = O.setWorldPlacement(st.world, b.name, { position: [p.x, p.y, p.z], orientation: z.q() }); return C.nearestObstacle(world, b.name, W.pieceCollisionSetup(st), 0.3).gapM; },
      state: () => { const pt = st.pieceTurn; return { phase: pt.phase, lift: +pt.lift.toFixed(4), off: pt.offset ? +Math.hypot(...pt.offset).toFixed(4) : 0, hist: pt.history.size, live: pt.live, lit: pt.lit,
        zone: pt.zone ? pt.zone.mode + (pt.zone.committed ? "+" : "") + (pt.zone.refused ? "!" : "") : null, quads: st.restingQuads?.shown ?? null, rolls: st.restRoll?.rolls ?? null, aligning: st.restAlign !== null,
        face: st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingFace?.faces?.join(",") ?? null, v: String(st.lastVerdict ?? "").slice(0, 120) }; },
    };
    window.__z = z; window.__minGap = Infinity; window.__watch = false; window.__maxLift = 0; window.__phases = new Set();
    const tick = () => { try { if (window.__watch) { window.__minGap = Math.min(window.__minGap, z.gap()); window.__maxLift = Math.max(window.__maxLift, st.pieceTurn.lift); window.__phases.add(st.pieceTurn.phase); } } catch (e) { window.__recErr = String(e); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    return true; })()`);
  const S = async () => JSON.parse(await ev("JSON.stringify(window.__z.state())"));
  const num = async (e) => +(await ev(e));
  const arr = async (e) => JSON.parse(await ev(`JSON.stringify(${e})`));
  const [Wd, Ht] = await arr("[innerWidth, innerHeight]");
  const mouse = (type, x, y, buttons, clickCount = 1) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount });
  const key = (type, k) => send("Input.dispatchKeyEvent", { type, key: k, code: `Key${k.toUpperCase()}`, windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0), text: type === "keyDown" ? k : undefined });
  const idle = async (ms = 1500) => {
    for (let t = 0; t < ms; t += 100) {
      await sleep(100);
      const s = await S();
      if (s.phase === "IDLE" && !s.aligning && !s.live) return s;
    }
    return S();
  };
  const centrePx = async () => arr("window.__z.project(window.__z.centre())");
  const dot4 = (a, b) => Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
  const drag = async (from, d, steps, buttons = 1) => {
    await mouse("mousePressed", from[0], from[1], buttons);
    for (let i = 1; i <= steps; i++) {
      await mouse("mouseMoved", from[0] + (d[0] * i) / steps, from[1] + (d[1] * i) / steps, buttons);
      await sleep(16);
    }
  };
  const run = (name) => env.ONLY === undefined || name.includes(env.ONLY);
  const drift = async (tag) => console.log(`drift ${tag}: the solver's anchor vs the drawn ${((await num("window.__z.drift()")) * 1000).toFixed(2)} mm`);
  console.log(`window ${Wd}×${Ht}; boot: ${JSON.stringify(await S())}`);

  // ── 1. far: a drag in the zone turns the piece; the camera stays; the release snaps onto a direction ──
  if (run("far")) {
    await idle();
    const c = await centrePx();
    const q0 = await arr("window.__z.q()");
    const cam0 = await arr("window.__z.cam()");
    const h0 = (await S()).hist;
    await drift("far, at rest");
    // ⭐ (2026-11-26, §9.1) the drag sized by the piece orbit's gains: ≈ 65° at any gain, as at 2°/mm (⛔ at 10.2°/mm the old drag turned ~330° — back
    // onto the start's direction, a snap that changes nothing: no history step, by D-P13)
    const kT = JSON.parse(await ev(`(async () => { const P = await import("/src/input/piece_turn.ts"); const cfg = window.__st.cfg; const s = P.sceneOrbitDegPerMm(cfg); return JSON.stringify([2 / (s.x * cfg.pieceTurnGainX), 2 / (s.y * cfg.pieceTurnGainY)]); })()`));
    const dF = [Math.round(30 * kT[0]), Math.round(120 * kT[1])];
    await drag(c, dF, 30);
    const mid = await S();
    const qMid = await arr("window.__z.q()");
    const cam1 = await arr("window.__z.cam()");
    check("far: the drag is the zone's turn", mid.zone === "TURN+", JSON.stringify(mid));
    check("far: the piece turns under the finger", dot4(q0, qMid) < 0.995, `|q0·q| ${dot4(q0, qMid).toFixed(4)}`);
    check("far: the quads shown during the drag", mid.quads === true, `quads ${mid.quads}, lit ${mid.lit}`);
    check("far: the camera stays", Math.hypot(cam1[0] - cam0[0], cam1[1] - cam0[1], cam1[2] - cam0[2]) < 1e-3, `moved ${Math.hypot(cam1[0] - cam0[0], cam1[1] - cam0[1], cam1[2] - cam0[2]).toExponential(2)} m`);
    await mouse("mouseReleased", c[0] + dF[0], c[1] + dF[1], 0);
    const end = await idle();
    const err = await num("window.__z.alignErr()");
    check("far: snapped onto a direction", err < 0.5, `the resting face ${err.toFixed(3)}° off the nearest direction; ${JSON.stringify(end)}`);
    check("far: one step in the history", end.hist === h0 + 1, `history ${h0} → ${end.hist}`);
    check("far: back in place (no offset left)", end.phase === "IDLE" && end.off === 0, JSON.stringify(end));
    await sleep(700);
    check("far: the quads faded", (await S()).quads === false, JSON.stringify(await S()));

    // ── 2. the undo: a double click on empty space puts the pose back ──
    const qA = await arr("window.__z.q()");
    const ex = Wd - 30, ey = Ht * 0.45;
    await mouse("mousePressed", ex, ey, 1, 1);
    await mouse("mouseReleased", ex, ey, 0, 1);
    await sleep(80);
    const one = await S();
    check("undo: a single tap on empty space does nothing", one.hist === end.hist && dot4(qA, await arr("window.__z.q()")) > 0.99999, JSON.stringify(one));
    await mouse("mousePressed", ex, ey, 1, 2);
    await mouse("mouseReleased", ex, ey, 0, 2);
    const und = await idle();
    const qU = await arr("window.__z.q()");
    check("undo: the double click puts the pose back", dot4(q0, qU) > 0.9999 && und.hist === h0, `|q0·q| ${dot4(q0, qU).toFixed(5)}, history ${und.hist}; ${und.v}`);
  }

  // ── 3. A + drag in the zone rolls the piece to a stop ──
  if (run("roll")) {
    await idle();
    const c = await centrePx();
    const n0 = await arr("window.__z.restN()");
    const r0 = (await S()).rolls;
    const gR = await num("window.__st.cfg.pieceRollGain"); // ⭐ (2026-11-26, §9.1) the drag over the roll's gain: ≈ 85° at any gain
    const dxR = Math.round(160 / gR);
    await key("keyDown", "a");
    await drag(c, [dxR, 0], 30);
    const mid = await S();
    check("roll: A + drag in the zone is the roll", mid.zone === "ROLL+", JSON.stringify(mid));
    await mouse("mouseReleased", c[0] + dxR, c[1], 0);
    await key("keyUp", "a");
    const end = await idle();
    const n1 = await arr("window.__z.restN()");
    const same = n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2];
    check("roll: about the resting face's normal (the normal kept)", same > 0.9999, `n0·n1 ${same.toFixed(6)}`);
    check(`roll: snapped to the next stop (${dxR} px × 2°/mm × the gain ${gR} ≈ 85°: one stop)`, end.rolls !== null && r0 !== null && Math.abs(end.rolls - r0) === 1, `rolls ${r0} → ${end.rolls}; ${end.v}`);
    check("roll: still on a direction", (await num("window.__z.alignErr()")) < 0.5, `err ${(await num("window.__z.alignErr()")).toFixed(3)}°`);
    // A + a click in the zone: one stop clockwise
    await key("keyDown", "a");
    await mouse("mousePressed", c[0], c[1], 1);
    await mouse("mouseReleased", c[0], c[1], 0);
    await key("keyUp", "a");
    const one = await idle();
    check("roll: A + a click in the zone = one stop", one.rolls !== null && end.rolls !== null && Math.abs(one.rolls - end.rolls) === 1, `rolls ${end.rolls} → ${one.rolls}`);
  }

  // ── 4. the face tap: the face under the finger rests on the last quad ──
  if (run("face")) {
    await idle();
    const c = await centrePx();
    const f0 = (await S()).face;
    await mouse("mousePressed", c[0], c[1], 1);
    await mouse("mouseReleased", c[0], c[1], 0);
    const end = await idle();
    check("face: the tapped face is the resting face now", end.face !== f0, `faces ${f0} → ${end.face}; ${end.v}`);
    check("face: rested on a direction", (await num("window.__z.alignErr()")) < 0.5, `err ${(await num("window.__z.alignErr()")).toFixed(3)}°`);
  }

  // ── 6. the touch twist: the first finger in the zone, the second lands and turns 60° ──
  if (run("twist")) {
    await idle();
    await drift("twist, at rest");
    const c = await centrePx();
    const r0 = (await S()).rolls;
    const qT0 = await arr("window.__z.q()");
    const nT0 = await arr("window.__z.restN()");
    const t = (pts) => pts.map(([x, y], i) => ({ x, y, id: i + 1, radiusX: 2, radiusY: 2, force: 1 }));
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: t([[c[0], c[1]]]) });
    await sleep(30);
    const R = 90;
    const gT = await num("window.__st.cfg.pieceRollGain"); // ⭐ (2026-11-26, §9.1) the fingers twist 60° / the gain: the roll 60° at any gain
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: t([[c[0], c[1]], [c[0] + R, c[1]]]) });
    await sleep(30);
    for (let i = 1; i <= 20; i++) {
      const a = ((60 / gT) * i / 20) * (Math.PI / 180);
      await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: t([[c[0], c[1]], [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]]) });
      await sleep(16);
    }
    const mid = await S();
    check("twist: the second finger rolls (the first started in the zone)", mid.zone === "HOST+", JSON.stringify(mid));
    const rollDeg = await num("(window.__st.pieceTurn.zone?.roll?.angle ?? NaN) * 180 / Math.PI");
    check("twist: the roll = the gain × the fingers' twist", Math.abs(rollDeg - 60) < 1.5, `the fingers ${(60 / gT).toFixed(1)}°, the gain ${gT}, the roll ${rollDeg.toFixed(2)}°`);
    // ⭐ (2026-11-26) the second lifted: a touchEnd NAMING it (⛔ a touchMove without it lifted nothing — the lift was never tested before)
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [{ x: c[0] + R * Math.cos((60 / gT) * (Math.PI / 180)), y: c[1] + R * Math.sin((60 / gT) * (Math.PI / 180)), id: 2, radiusX: 2, radiusY: 2, force: 1 }] });
    await sleep(300);
    check("twist: the second's lift snaps the roll; the first finger turns again (§9.2)", (await S()).zone === "TURN+" && (await num("window.__z.alignErr()")) < 0.5, JSON.stringify(await S()));
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const end = await idle();
    // ⭐ (2026-11-26, §9.2) the second's lift snaps, the first turns on (it did not move): its lift keeps the roll (D-P21) — the stop read as the pose's turn
    const qT1 = await arr("window.__z.q()");
    const nT1 = await arr("window.__z.restN()");
    const turnT = (2 * Math.acos(Math.min(1, dot4(qT0, qT1))) * 180) / Math.PI;
    check("twist: snapped to the nearest stop (60° → one stop: the pose turned 60° or 90° about the normal)", (Math.abs(turnT - 90) < 1 || Math.abs(turnT - 60) < 1) && nT0[0] * nT1[0] + nT0[1] * nT1[1] + nT0[2] * nT1[2] > 0.9999 && (await num("window.__z.alignErr()")) < 0.5, `turned ${turnT.toFixed(2)}°, rolls ${r0} → ${end.rolls}; ${end.v}`);
  }

  // ── 7. ⭐ (2026-11-26, §9.2) a turn, then a roll with NO snap at its start; the second lifts (A lifts) — snapped, the first finger (the drag) turns on;
  //       its lift snapped; ONE history step ──
  if (run("turnroll")) {
    const k = JSON.parse(await ev(`(async () => { const P = await import("/src/input/piece_turn.ts"); const U = await import("/src/core/units.ts"); const cfg = window.__st.cfg;
      return JSON.stringify({ degPerPx: (P.sceneOrbitDegPerMm(cfg).x * cfg.pieceTurnGainX) / U.mmToPx(1), mmPx: U.mmToPx(1), g: cfg.pieceRollGain, aDegPerMm: cfg.pieceRollDegPerMm }); })()`));
    const dT = Math.round(40 / k.degPerPx); // ≈ 40° of turn (committed by the tap's time: 20 steps)
    const angle = (a, b) => (2 * Math.acos(Math.min(1, dot4(a, b))) * 180) / Math.PI;
    const ndot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const t = (pts) => pts.map(([x, y], i) => ({ x, y, id: i + 1, radiusX: 2, radiusY: 2, force: 1 }));
    // (a) the tablet
    await idle();
    let c = await centrePx();
    let h0 = (await S()).hist;
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: t([[c[0], c[1]]]) });
    for (let i = 1; i <= 20; i++) {
      await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: t([[c[0] + (dT * i) / 20, c[1]]]) });
      await sleep(16);
    }
    await sleep(150);
    const p1 = [c[0] + dT, c[1]];
    const m1 = await S();
    const q1 = await arr("window.__z.q()");
    const n1 = await arr("window.__z.restN()");
    const off1 = await num("window.__z.alignErr()");
    check("turnroll: the first finger turns the piece off its quad", m1.zone === "TURN+" && off1 > 2, `off the nearest direction ${off1.toFixed(1)}°; ${JSON.stringify(m1)}`);
    const R = 90;
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: t([p1, [p1[0] + R, p1[1]]]) });
    await sleep(150);
    const m2 = await S();
    const q2 = await arr("window.__z.q()");
    check("turnroll: NO snap when the second finger lands (the pose unchanged)", m2.zone === "HOST+" && dot4(q1, q2) > 0.9999, `turned ${angle(q1, q2).toFixed(3)}° at the landing; ${JSON.stringify(m2)}`);
    for (let i = 1; i <= 20; i++) {
      const a = ((60 / k.g) * i / 20) * (Math.PI / 180);
      await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: t([p1, [p1[0] + R * Math.cos(a), p1[1] + R * Math.sin(a)]]) });
      await sleep(16);
    }
    await sleep(60);
    const q3 = await arr("window.__z.q()");
    const n3 = await arr("window.__z.restN()");
    check("turnroll: the twist rolls from the pose as it is (60°, about the face's normal)", Math.abs(angle(q2, q3) - 60) < 2 && ndot(n1, n3) > 0.9999, `rolled ${angle(q2, q3).toFixed(2)}°, n1·n3 ${ndot(n1, n3).toFixed(6)}`);
    const aE = (60 / k.g) * (Math.PI / 180);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [{ x: p1[0] + R * Math.cos(aE), y: p1[1] + R * Math.sin(aE), id: 2, radiusX: 2, radiusY: 2, force: 1 }] }); // the second lifted (a touchEnd naming it)
    await sleep(300);
    const m4 = await S();
    const err4 = await num("window.__z.alignErr()");
    check("turnroll: the second's lift snaps the roll onto the quad; the first still turns", m4.zone === "TURN+" && err4 < 0.5, `err ${err4.toFixed(3)}°; ${JSON.stringify(m4)}`);
    const q4 = await arr("window.__z.q()");
    for (let i = 1; i <= 10; i++) {
      await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: t([[p1[0], p1[1] + (dT * i) / 10]]) });
      await sleep(16);
    }
    await sleep(150);
    const q5 = await arr("window.__z.q()");
    check("turnroll: the first finger turns the piece again", angle(q4, q5) > 20, `turned ${angle(q4, q5).toFixed(1)}°`);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    let end = await idle();
    check("turnroll: its lift snapped; ONE history step for the gesture", (await num("window.__z.alignErr()")) < 0.5 && end.hist === h0 + 1, `history ${h0} → ${end.hist}; ${JSON.stringify(end)}`);
    // (b) the desktop: A pressed and released during the drag
    c = await centrePx();
    h0 = (await S()).hist;
    await mouse("mousePressed", c[0], c[1], 1);
    for (let i = 1; i <= 20; i++) {
      await mouse("mouseMoved", c[0] + (dT * i) / 20, c[1], 1);
      await sleep(16);
    }
    await sleep(150);
    const b1 = await arr("window.__z.q()");
    const bn1 = await arr("window.__z.restN()");
    await key("keyDown", "a");
    await sleep(150);
    const mb2 = await S();
    const b2 = await arr("window.__z.q()");
    check("turnroll: NO snap when A is pressed during the drag", mb2.zone === "ROLL+" && dot4(b1, b2) > 0.9999, `turned ${angle(b1, b2).toFixed(3)}° at A; ${JSON.stringify(mb2)}`);
    const dR = Math.round((60 / (k.aDegPerMm * k.g)) * k.mmPx); // ≈ 60° of roll
    for (let i = 1; i <= 10; i++) {
      await mouse("mouseMoved", c[0] + dT + (dR * i) / 10, c[1], 1);
      await sleep(16);
    }
    await sleep(60);
    const b3 = await arr("window.__z.q()");
    const bn3 = await arr("window.__z.restN()");
    check("turnroll: A + dx rolls from the pose as it is (≈ 60°, about the face's normal)", Math.abs(angle(b2, b3) - 60) < 4 && ndot(bn1, bn3) > 0.9999, `rolled ${angle(b2, b3).toFixed(2)}° (${dR} px), n·n ${ndot(bn1, bn3).toFixed(6)}`);
    await key("keyUp", "a");
    await sleep(300);
    const mb4 = await S();
    const berr = await num("window.__z.alignErr()");
    check("turnroll: A's release snaps the roll; the drag still turns", mb4.zone === "TURN+" && berr < 0.5, `err ${berr.toFixed(3)}°; ${JSON.stringify(mb4)}`);
    const b4 = await arr("window.__z.q()");
    for (let i = 1; i <= 10; i++) {
      await mouse("mouseMoved", c[0] + dT + dR, c[1] + (dT * i) / 10, 1);
      await sleep(16);
    }
    await sleep(150);
    const b5 = await arr("window.__z.q()");
    check("turnroll: the drag turns the piece again after A", angle(b4, b5) > 20, `turned ${angle(b4, b5).toFixed(1)}°`);
    await mouse("mouseReleased", c[0] + dT + dR, c[1] + dT, 0);
    end = await idle();
    check("turnroll: the release snapped; ONE history step (the desktop)", (await num("window.__z.alignErr()")) < 0.5 && end.hist === h0 + 1, `history ${h0} → ${end.hist}; ${JSON.stringify(end)}`);
  }

  // ── 5. close in: the step back — out, turned, back in, never into a part ──
  if (run("close")) {
    await idle();
    const D = Math.PI / 180;
    await ev(`(() => { const st = window.__st; st.orbit.reset(${-90 * D}, ${(62 / 90 + 1) / 2}); st.orbitInertia.stop(); if (st.pieceQ) st.pieceQ = { ...st.pieceQ, yaw: ${-90 * D}, v: ${(62 / 90 + 1) / 2} }; st.boxSpring = null; })()`);
    await sleep(1500);
    await ev(`(async () => { const st = window.__st; const A = await import("/src/input/assembly_orbit.ts"); st.approach = A.approachRange(st.cfg).min; st.approachInertia?.stop?.(); })()`);
    await sleep(2500);
    const g0 = await num("window.__z.gap()");
    await drift("close, at rest");
    const c = await centrePx();
    console.log(`close: the gap before ${(g0 * 1000).toFixed(2)} mm, the piece at (${c.map((x) => x.toFixed(0)).join(", ")}) px`);
    await ev("window.__minGap = Infinity; window.__maxLift = 0; window.__phases = new Set(); window.__watch = true");
    await drag(c, [0, 70], 30);
    await sleep(300);
    const mid = await S();
    await mouse("mouseReleased", c[0], c[1] + 70, 0);
    const end = await idle(4000);
    await ev("window.__watch = false");
    const minGap = await num("window.__minGap");
    const maxLift = await num("window.__maxLift");
    const phases = await arr("[...window.__phases]");
    check("close: the piece stepped back to turn (as far as its sphere needed)", phases.includes("OUT") && maxLift > 0, `the largest lift ${(maxLift * 1000).toFixed(0)} mm, phases ${phases.join(" ")}; mid ${JSON.stringify(mid)}`);
    check("close: never into a part", minGap >= 0, `the least gap while turning ${(minGap * 1000).toFixed(3)} mm`);
    check("close: snapped onto a direction", (await num("window.__z.alignErr()")) < 0.5, `err ${(await num("window.__z.alignErr()")).toFixed(3)}°; ${JSON.stringify(end)}`);
    check("close: back in (the step back over)", end.phase === "IDLE" && end.off === 0, `${JSON.stringify(end)}; the gap after ${((await num("window.__z.gap()")) * 1000).toFixed(2)} mm`);
  }

  const sceneIndex = +(new URL(env.URL ?? "http://x/?sceneIndex=1").searchParams.get("sceneIndex") ?? 1);

  // ── 7. (review finding 1) a lost release mid-drag (the window blurred): the gesture ends as a release would; the next drag outside orbits ──
  if (run("lost") && sceneIndex !== 3) {
    await idle();
    const c = await centrePx();
    await drag(c, [20, 90], 20);
    await ev("window.dispatchEvent(new Event('blur'))");
    const end = await idle();
    check("lost: the gesture ended (snapped, no zone left)", end.zone === null && end.phase === "IDLE" && (await num("window.__z.alignErr()")) < 0.5, JSON.stringify(end));
    await mouse("mouseReleased", c[0] + 20, c[1] + 90, 0);
    const yaw0 = await num("window.__st.orbit.yaw");
    const ox = Wd - 60, oy = Ht * 0.5;
    await drag([ox, oy], [-80, 0], 20);
    await mouse("mouseReleased", ox - 80, oy, 0);
    const yaw1 = await num("window.__st.orbit.yaw");
    check("lost: the next drag outside the zone orbits", Math.abs(yaw1 - yaw0) > 1e-3, `yaw ${yaw0.toFixed(4)} → ${yaw1.toFixed(4)}; ${JSON.stringify(await S())}`);
  }

  // ── 8. Scene_2: a part picked, then turned in the zone ──
  if (run("s2") && sceneIndex === 3) {
    await sleep(1000);
    const p2 = await arr(`(() => { const st = window.__st; const ms = st.scene.meshes.filter((m) => st.modelBrowse.has(m) && m.name.startsWith("E02") && m.isEnabled()); if (!ms.length) return null;
      let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (const m of ms) { m.computeWorldMatrix(true); const b = m.getBoundingInfo().boundingBox; for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], b.minimumWorld.asArray()[k]); hi[k] = Math.max(hi[k], b.maximumWorld.asArray()[k]); } }
      return window.__z.project([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]); })()`);
    console.log(`s2: E02 on the glass ${JSON.stringify(p2)}`);
    await mouse("mouseMoved", p2[0], p2[1], 0);
    await mouse("mousePressed", p2[0], p2[1], 1);
    await sleep(50);
    await mouse("mouseReleased", p2[0], p2[1], 0);
    await sleep(2500);
    const held = await ev("window.__st.greenBox ? window.__st.greenBox.name : null");
    check("s2: the part picked", held === "E02", `held ${held}; ${JSON.stringify(await S())}`);
    if (held === "E02") {
      const c = await centrePx();
      const q0 = await arr("window.__z.q()");
      await drag(c, [20, 120], 30);
      const mid = await S();
      check("s2: the drag on the held part turns it", mid.zone === "TURN+" && dot4(q0, await arr("window.__z.q()")) < 0.999, JSON.stringify(mid));
      await mouse("mouseReleased", c[0] + 20, c[1] + 120, 0);
      const end = await idle(3000);
      check("s2: snapped onto a direction, still held", (await num("window.__z.alignErr()")) < 0.5 && (await ev("window.__st.greenBox ? window.__st.greenBox.name : null")) === "E02", JSON.stringify(end));
      check("s2: never into a part", (await num("window.__z.gap()")) >= 0, `gap ${((await num("window.__z.gap()")) * 1000).toFixed(2)} mm`);
    }
  }

  const err = await ev("window.__recErr ?? null");
  check("no error in the page's ticker", err === null, String(err));
  console.log(fails === 0 ? "ZONE PROBE: ALL PASS" : `ZONE PROBE: ${fails} FAIL`);
} catch (e) {
  fails++;
  console.error("PROBE ERROR", e);
} finally {
  killChrome();
  removeProfile();
  process.exit(fails === 0 ? 0 : 1);
}
