/**
 * GOLDEN VECTORS — **PACKAGE A, W11's OPTION A: ONE TRANSITION, ONE TURN** (2026-11-16 night, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §12.4
 * A and §18; the owner: *"1- A"*):
 * * `seamTurnStep`'s FINGER pace — the finger-paced entry's share SHOWN never over the tilts' one speed (`degS` over the turn's whole angle), and only
 *   from the frame the turn's angle is read (as the timed clock).
 * * `squareShareStep` — the square camera's own share (no transition running): the direction it shows (`calmDir`'s mix of the calm's direction and the
 *   square normal, an nlerp) never turned more than the budget in a frame — exact on the arc, both ways, whole once within the budget.
 * * `squareRestarts` — a turn whose ease is read: a change of the square camera's target (its normal or its share) is a change of frame, the turn
 *   restarted from the pose shown; a turn just started (its read pending): none (the snap is part of that turn).
 * * The wiring's source pins (comments stripped): the square camera at its target inside a running turn; the ease read after `calmFrame`; every clock
 *   waiting for that read; every turn start keeping the direction drawn before it (`dirFrom`).
 * * (2026-11-17, the audit's blocker) `poseTurnRad`, `shownShareCap`, `seamOutShareInv` — the share DRAWN: the picture's turn from the pose drawn last
 *   frame never over the one speed, the turn's end pose still moving under the rig's own lags (measured: 6.66° in a frame of `Scene_0bis`'s free-face
 *   exit); the turn ended once drawn whole (`zoneMixPose`), the clocks carried on from the share drawn (`turnShareDrawn`).
 * RED on the mutants listed in the package's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { nlerpAngle, poseTurnRad, seamOutShare, seamOutShareInv, seamStepRad, seamTurnStep, shownShareCap, squareRestarts, squareShareStep, SQUARE_SAME_RAD } from "../src/input/seam_turn";
import { rotateAbout } from "../src/input/orbit_tilt";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const DT = 1000 / 60;
const STEP = 6 * D; // the tilts' one speed, a frame at 60 fps (360°/s)

describe("⭐⭐⭐ the finger-paced entry: the share shown never over the one speed (`seamTurnStep`, FINGER)", () => {
  it("⭐ a finger far ahead: one speed's step a frame over the whole angle — ⛔ the finger's share at once", () => {
    const whole = Math.PI;
    const r = seamTurnStep({ k: 0, done: 0, rad: whole, axisKnown: true }, "FINGER", 1, DT, 360);
    expect(r.k).toBeCloseTo(STEP / whole, 12);
    expect(r.done).toBeCloseTo(STEP, 12);
    // frame after frame: every step of the shown angle at most one speed's, whole in the end
    let t = { k: 0, done: 0 };
    let n = 0;
    while (t.k < 1 && n < 100) {
      const nx = seamTurnStep({ ...t, rad: whole, axisKnown: true }, "FINGER", 1, DT, 360);
      expect((nx.k - t.k) * whole).toBeLessThanOrEqual(STEP + 1e-12);
      t = nx;
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(30); // 180° at 6° a frame (a last sliver of rounding: one more)
    expect(n).toBeLessThanOrEqual(31);
  });
  it("⭐ a slow finger: its share exactly (under the cap); never back", () => {
    const r = seamTurnStep({ k: 0.2, done: 0.2, rad: 1, axisKnown: true }, "FINGER", 0.21, DT, 360);
    expect(r.k).toBe(0.21);
    expect(seamTurnStep({ k: 0.5, done: 0.5, rad: 1, axisKnown: true }, "FINGER", 0.2, DT, 360).k).toBe(0.5);
  });
  it("⭐ held until the turn's angle is read (the camera's stage, the ease) — ⛔ the finger's share before the whole is known", () => {
    expect(seamTurnStep({ k: 0, done: 0, rad: Math.PI / 2, axisKnown: false }, "FINGER", 0.4, DT, 360)).toEqual({ k: 0, done: 0 });
  });
  it("⭐ `degS` 0 (no speed): the finger's share at once, as before; a turn of no angle: the share", () => {
    expect(seamTurnStep({ k: 0, done: 0, rad: 2, axisKnown: true }, "FINGER", 0.7, DT, 0).k).toBe(0.7);
    expect(seamTurnStep({ k: 0, done: 0, rad: 0, axisKnown: true }, "FINGER", 0.7, DT, 360).k).toBe(0.7);
  });
});

describe("⭐⭐⭐ the clock's step with the camera's angle growing with the ease (`seamStepRad`)", () => {
  it("⭐ no ease: the step itself, exactly (the timed turn as before)", () => {
    for (const t of [0, 0.3, 2]) expect(seamStepRad(STEP, t, 0)).toBe(STEP);
    expect(seamStepRad(STEP, 1, -1)).toBe(STEP);
  });
  it("⭐ an ease: the share's step x with x·(turn + ease) + x²·ease = the step — the picture's turn in the frame, its angle grown, never over it", () => {
    for (const [t, e] of [
      [0, 90 * D],
      [32 * D, 84 * D],
      [6 * D, 22 * D],
      [170 * D, 7.7 * D],
    ] as const) {
      const r = seamStepRad(STEP, t, e);
      const x = r / (t + e);
      expect(x * (t + e) + x * x * e).toBeCloseTo(STEP, 12);
      expect(r).toBeLessThan(STEP);
      expect(r).toBeGreaterThan(0.8 * STEP);
    }
    // the measured frame (`Scene_1`, an exit by an edge: the camera's angle read 0, the ease 90°): 5.64° of the clock — ⛔ 6° (6.19° on the glass)
    expect(seamStepRad(STEP, 0, 90 * D) / D).toBeCloseTo(5.645, 2);
  });
  it("⭐ wired: the timed turn and the paced entry both step by it (the ease of this turn handed)", () => {
    const sp = "seamTurnStep({ k: zm.k, done: zm.done, rad: turnWhole(st, zm), axisKnown: zm.axis !== null && zm.dirFrom === undefined }, pace,";
    const t = fnCode("render/assembly_wiring.ts", "function seamTurnFrame(");
    expect(t).toContain(sp);
    expect(t).toContain("dtMs, st.cfg.tiltRollDegS, turnEase(st, zm));");
  });
});

describe("⭐⭐⭐ the square camera's own share (`squareShareStep`, `nlerpAngle`)", () => {
  it("⭐ `nlerpAngle`: the angle from the calm's direction of the normalised mix — 0 at 0, θ at 1, ½θ at ½", () => {
    for (const th of [10 * D, 90 * D, 150 * D]) {
      expect(nlerpAngle(0, th)).toBe(0);
      expect(nlerpAngle(1, th)).toBeCloseTo(th, 12);
      expect(nlerpAngle(0.5, th)).toBeCloseTo(th / 2, 12);
      // the mix's own angle, computed directly
      const n: Vec3 = [Math.sin(th), 0, Math.cos(th)];
      for (const q of [0.1, 0.37, 0.8]) {
        const m: Vec3 = [q * n[0], 0, 1 - q + q * n[2]];
        expect(nlerpAngle(q, th)).toBeCloseTo(Math.atan2(m[0], m[2]), 12);
      }
    }
  });
  it("⭐ toward 1 and back to 0: every frame's turn of the direction shown at most the budget, exactly the budget while short — whole in the end", () => {
    for (const th of [30 * D, 84 * D, 90 * D, 170 * D])
      for (const [q0, want] of [
        [0, 1],
        [1, 0],
        [0.5, 1],
        [0.5, 0],
      ] as const) {
        let q: number = q0;
        let n = 0;
        while (q !== want && n < 200) {
          const q1 = squareShareStep(q, want, th, STEP);
          const turned = Math.abs(nlerpAngle(q1, th) - nlerpAngle(q, th));
          expect(turned).toBeLessThanOrEqual(STEP + 1e-9);
          if (q1 !== want) expect(turned).toBeCloseTo(STEP, 9);
          q = q1;
          n++;
        }
        expect(q).toBe(want);
        const frames = Math.ceil(Math.abs(nlerpAngle(want, th) - nlerpAngle(q0, th)) / STEP - 1e-9);
        expect(n).toBeGreaterThanOrEqual(frames);
        expect(n).toBeLessThanOrEqual(frames + 1); // a last sliver of rounding
      }
  });
  it("⭐ within the budget: the share asked, exactly; no angle, no budget limit (`Infinity`), or opposite directions: the share asked", () => {
    expect(squareShareStep(0.2, 0.25, 90 * D, STEP)).toBe(0.25);
    expect(squareShareStep(0, 1, 0, STEP)).toBe(1);
    expect(squareShareStep(0, 1, 90 * D, Infinity)).toBe(1);
    expect(squareShareStep(0, 1, Math.PI, STEP)).toBe(1);
  });
  it("⭐ a budget spent (0): the share kept", () => {
    expect(squareShareStep(0.3, 1, 90 * D, 0)).toBeCloseTo(0.3, 12);
  });
});

describe("⭐⭐⭐ a target changed while a turn runs (`squareRestarts`)", () => {
  const N: Vec3 = [0, 0, 1];
  it("⭐ the turn read: a normal more than the tie apart, or another share — a restart; the same — none", () => {
    expect(squareRestarts(true, N, [0, 1, 0], 1, 1)).toBe(true);
    expect(squareRestarts(true, N, N, 1, 1)).toBe(false);
    expect(squareRestarts(true, N, N, 1, 0)).toBe(true);
    expect(squareRestarts(true, N, N, 0.4, 1)).toBe(true);
    const c = Math.cos(SQUARE_SAME_RAD * 0.9);
    const s = Math.sin(SQUARE_SAME_RAD * 0.9);
    expect(squareRestarts(true, N, [s, 0, c], 1, 1)).toBe(false);
    const c2 = Math.cos(SQUARE_SAME_RAD * 1.1);
    const s2 = Math.sin(SQUARE_SAME_RAD * 1.1);
    expect(squareRestarts(true, N, [s2, 0, c2], 1, 1)).toBe(true);
    expect(SQUARE_SAME_RAD).toBeCloseTo(0.5 * D, 15);
  });
  it("⭐ a turn just started (its ease not read yet): never — the snap is that turn's; no square normal yet: never", () => {
    expect(squareRestarts(false, N, [0, 1, 0], 0, 1)).toBe(false);
    expect(squareRestarts(true, null, [0, 1, 0], 0, 1)).toBe(false);
    expect(squareRestarts(true, N, null, 1, 1)).toBe(false);
  });
});

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const codeOnly = (s: string) => s.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
function fnCode(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return codeOnly(s.slice(i, s.indexOf(close, i) + close.length)).replace(/\s+/g, " ");
}
const before = (src: string, a: string, b: string) => {
  expect(src.indexOf(a), a).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(b), b).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(a), `${a} before ${b}`).toBeLessThan(src.indexOf(b));
};

describe("⭐⭐⭐ the wiring (source pins, comments stripped)", () => {
  const W = "render/assembly_wiring.ts";
  it("⭐ `squareFrame`: while a turn runs the square camera AT its target (normal and share) — a change of it restarts the turn; ⛔ its own turn there", () => {
    const f = fnCode(W, "function squareFrame(");
    expect(f).toContain("const zm = st.asmZoneMix; if (zm !== null) { if (squareRestarts(zm.dirFrom === undefined, sq.n, sq.target, sq.q, qT)) turnRestart(st); if (sq.target !== null) sq.n = sq.target; sq.q = qT; return; }");
    before(f, "turnRestart(st);", "sq.n = squareTurn(");
    // its own share capped by the angle it turns the direction (`squareShareStep`)
    expect(f).toContain("sq.q = squareShareStep(");
  });
  it("⭐ the ease read ONCE THE VIEW IS SET (after `calmFrame`) — ⛔ at the turn's start", () => {
    const a = fnCode(W, "export function assemblyFrame(");
    expect(a).toContain("calmFrame(st, dtMs); seamEaseRead(st);");
    expect(codeOnly(raw(W)).match(/seamEaseRead\(st\);/g)?.length).toBe(1); // ONE read, after the view (⛔ before `calmFrame` too)
    const r = fnCode(W, "function seamEaseRead(");
    before(r, "delete zm.dirFrom;", "dirGap(from, drawnDir(st))");
    // the turn's axis and framing rule read afresh toward the view just set (⛔ kept: the spit's turn from a tip went round the far way, 285° for 93°)
    before(r, "zm.axis = null; zm.rule = 0; zm.keep = null;", "dirGap(from, drawnDir(st))");
    expect(r).toContain("st.asmDirEase = { axis: gap.axis, angle: gap.angle, mix: zm };");
    const e = fnCode(W, "function seamEase(");
    expect(e).toContain("mix.dirFrom = uWas;");
  });
  it("⭐ every clock waits for the read: the timed (`zoneStep`), the paced entry (`seamTurnFrame`), the way out (`seamOutFrame`)", () => {
    expect(fnCode(W, "function zoneStep(")).toContain("if (zm !== null && zm.axis !== null && zm.dirFrom === undefined && zm.byMm !== true && zm.out === undefined) {");
    expect(fnCode(W, "function seamTurnFrame(")).toContain("axisKnown: zm.axis !== null && zm.dirFrom === undefined");
    expect(fnCode(W, "function seamOutFrame(")).toContain("zm.axis !== null && zm.dirFrom === undefined");
  });
  it("⭐ every start keeps the direction drawn before it: a carried turn (the spit, a free face) its drawn direction read BEFORE the turn is replaced", () => {
    const c = fnCode(W, "function crossTurn(");
    before(c, "const uCarry = c.uWas === null && c.carry ? drawnDir(st) : null;", "seamTurnStart(st, false)");
    expect(c).toContain("else if (uCarry !== null) easeCarry(st, mixWas, uCarry);");
    const ff = fnCode(W, "function freeFaceFrame(");
    before(ff, "const uWas = drawnDir(st);", "st.asmZoneMix = { from: poseShown(st)");
    expect(ff).toContain("easeCarry(st, mixWas, uWas);");
    const ec = fnCode(W, "function easeCarry(");
    expect(ec).toContain("if (st.asmZoneMix !== null && st.asmZoneMix !== was) st.asmZoneMix.dirFrom = uWas;");
    const tr = fnCode(W, "function turnRestart(");
    expect(tr).toContain("const uWas = drawnDir(st);");
    expect(tr).toContain("easeCarry(st, zm, uWas);");
  });
});

describe("⭐⭐⭐ the share DRAWN: the picture never over the one speed, its end pose moving (`poseTurnRad`, `shownShareCap`) — the audit's blocker", () => {
  const pose = (dir: Vec3, up: Vec3, eye: Vec3 = [0, 0, 0]) => ({ eye, look: [eye[0] + dir[0], eye[1] + dir[1], eye[2] + dir[2]] as Vec3, up });
  it("⭐ `poseTurnRad`: the look's turn, the roll's turn, the two together — the one rotation of the camera's axes; the eye's place does not count", () => {
    const a = pose([0, 0, 1], [0, 1, 0]);
    expect(poseTurnRad(a, pose(rotateAbout([0, 0, 1], [0, 1, 0], 10 * D), [0, 1, 0]))).toBeCloseTo(10 * D, 12); // a yaw
    expect(poseTurnRad(a, pose([0, 0, 1], rotateAbout([0, 1, 0], [0, 0, 1], 7 * D)))).toBeCloseTo(7 * D, 12); // a roll alone (⛔ the look only: 0)
    const ax: Vec3 = [Math.SQRT1_2, 0.5, 0.5];
    expect(poseTurnRad(a, pose(rotateAbout([0, 0, 1], ax, 23 * D), rotateAbout([0, 1, 0], ax, 23 * D), [5, -2, 3]))).toBeCloseTo(23 * D, 12);
    // an up not square to the look: made square first (Babylon's `upSquareToView`)
    expect(poseTurnRad(a, pose([0, 0, 1], [0, 1, 0.4]))).toBeCloseTo(0, 12);
    expect(poseTurnRad(a, { eye: [0, 0, 0], look: [0, 0, 0], up: [0, 1, 0] })).toBe(0);
  });
  it("⭐ within the speed: the clock's share, exactly (nothing changes where nothing was over)", () => {
    expect(shownShareCap(0.1, 0.13, () => 5 * D, STEP)).toBe(0.13);
    expect(shownShareCap(0.1, 0.13, () => STEP, STEP)).toBe(0.13);
  });
  it("⭐ the end pose moving: the largest share whose picture turns exactly the one speed's step — ⛔ the clock's share: 6.66° in a frame", () => {
    // a half turn about y whose END pose has moved on by `drift` since last frame (the camera's leash catching up): the picture at the share k, from
    // the pose drawn last frame (k0 of the half turn then) — about one axis, so |k·(π + drift) − k0·π|: the clock's step plus the drift's share
    const k0 = 0.2;
    const drift = 3 * D;
    const dirAt = (k: number, end: number) => rotateAbout([0, 0, 1], [0, 1, 0], k * end);
    const was = pose(dirAt(k0, Math.PI), [0, 1, 0]);
    const shown = (k: number) => poseTurnRad(was, pose(dirAt(k, Math.PI + drift), [0, 1, 0]));
    const kClock = k0 + STEP / Math.PI;
    expect(shown(kClock)).toBeGreaterThan(STEP); // the clock alone: over (the drift's share added)
    const k = shownShareCap(k0, kClock, shown, STEP);
    expect(k).toBeLessThan(kClock);
    expect(k).toBeGreaterThan(k0);
    expect(shown(k)).toBeLessThanOrEqual(STEP + 1e-12);
    expect(shown(k)).toBeGreaterThan(STEP - 1e-6); // exactly the step (⛔ held at k0: the turn stalls behind a drift it could carry)
  });
  it("⭐ the end pose alone moving more than the speed: the share drawn last frame (the turn adds nothing); `kWant` not ahead, or no speed: the clock's", () => {
    expect(shownShareCap(0.3, 0.35, () => 9 * D, STEP)).toBe(0.3);
    expect(shownShareCap(0.3, 0.3, () => 9 * D, STEP)).toBe(0.3);
    expect(shownShareCap(0.3, 0.35, () => 9 * D, 0)).toBe(0.35);
    expect(shownShareCap(0.3, 0.35, () => 9 * D, Number.POSITIVE_INFINITY)).toBe(0.35);
  });
  it("⭐ `seamOutShareInv`: the way out's progress whose smooth share is k — `seamOutShare` undone, both ends exact", () => {
    for (const p of [0, 0.03, 0.2, 0.5, 0.77, 0.99, 1]) expect(seamOutShareInv(seamOutShare(p))).toBeCloseTo(p, 12);
    expect(seamOutShareInv(-1)).toBeCloseTo(0, 15);
    expect(seamOutShareInv(2)).toBeCloseTo(1, 15);
  });
  it("⭐ wired: the camera's stage draws the capped share, ends the turn once drawn whole; the clocks never end it themselves, carried on from the share drawn", () => {
    const W = "render/assembly_wiring.ts";
    const z = fnCode(W, "export function zoneMixPose(");
    expect(z).toContain("const k0 = zm.kShown ?? 0;");
    expect(z).toContain("k = shownShareCap(k0, k, (x) => poseTurnRad(was, at(x)), ((degS * Math.PI) / 180) * (Math.max(0, dtMs) / 1000)); if (k !== zm.k) turnShareDrawn(st, zm, k);");
    before(z, "const was = poseShown(st);", "shownShareCap(");
    expect(z).toContain("zm.kShown = k; if (k >= 1) { st.asmZoneMix = null; return to; }");
    expect(z).toContain("const r = poseAboutPiece(zm.from, to, piece, k, zm.axis);");
    const d = fnCode(W, "function turnShareDrawn(");
    expect(d).toContain("zm.k = k; zm.done = k * turnWhole(st, zm); if (zm.out !== undefined) zm.out.p = seamOutShareInv(k);");
    for (const sig of ["function seamTurnFrame(", "function seamOutFrame("]) expect(fnCode(W, sig)).not.toContain("st.asmZoneMix = null");
    const zs = fnCode(W, "function zoneStep(");
    // the one end left in a clock: a turn whole last frame that no camera stage drew
    expect(zs.match(/st\.asmZoneMix = null/g)?.length).toBe(1);
    before(zs, "if (st.asmZoneMix !== null && st.asmZoneMix.k >= 1) st.asmZoneMix = null;", "const zm = st.asmZoneMix;");
  });
});
