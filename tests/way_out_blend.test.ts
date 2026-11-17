/**
 * GOLDEN VECTORS — **THE WAY OUT OF CLOSE IN, BLENDED, STEP C3** (2026-11-16, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §8; the owner's D-T1:
 * *"I would prefer to return to the orbit when the distance is crossed back … Find a way to blend properly the camera movement on the way out"*), under
 * the charts' layout (⛔ its switch `chartLayout` and `seamOutPaced`'s argument deleted at step 2.5, 2026-11-16), for the automatic tilt left BY DISTANCE
 * only, with `tiltOutBlendMm` over 0:
 * * `seamOutPaced` — the way out paced only when left by distance (`off`, the latch off), the span over 0; an edge's exit, a zone's, 0: timed.
 * * `seamOutTarget`, `seamOutStep` — the progress: no travel with a finger down, it waits; the approach's travel outward over the span, the orbit's over
 *   `tiltBlendMm`, the larger; the finger lifted, it completes at the tilts' one speed (a half turn at 360°/s: 30 frames at 60 fps); a fast finger, one
 *   speed's step a frame; never back; held until the turn's angle is read; no angle: whole.
 * * `seamOutShare` — the share shown: a smoothstep (0, ½, 1; its first and last steps smaller than the middle one; monotone).
 * * `turnHoldsGizmo` — the way out never holds the gizmo; every other turn as before (`seamTurnHolds`, `k < 1`).
 * * The tunable (`tiltOutBlendMm`: 12 by default, 0 … 60) and the wiring's source pins (comments stripped).
 * RED on the mutants listed in the step's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { seamOutPaced, seamOutShare, seamOutStep, seamOutTarget, seamTurnHolds, turnHoldsGizmo } from "../src/input/seam_turn";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const DT = 1000 / 60;
const HALF = Math.PI;
const SPEED = 360;
const SPAN = 12; // tiltOutBlendMm
const ORB = 10; // tiltBlendMm

/** frames of `seamOutStep` toward a fixed target until whole (at most `max`) */
function framesToWhole(p0: number, target: number, whole = HALF, degS = SPEED, max = 1000): number {
  let p = p0;
  let n = 0;
  while (p < 1 && n < max) {
    p = seamOutStep(p, target, DT, whole, degS, true);
    n++;
  }
  return n;
}

describe("⭐⭐⭐ `seamOutPaced`: the way out paced only when left by distance, the span over 0", () => {
  it("⭐ the table", () => {
    for (const off of [false, true])
      for (const closeIn of [false, true])
        for (const mm of [0, 12, 60]) expect(seamOutPaced(off, closeIn, mm), `${off} ${closeIn} ${mm}`).toBe(off && !closeIn && mm > 0);
  });
  it("⭐ an edge's exit (`off` false), a zone's (`off` with the latch still on), `tiltOutBlendMm` 0: the timed turn (false) — ⛔ `chartLayout` 0: step 2.5", () => {
    expect(seamOutPaced(false, false, 12)).toBe(false);
    expect(seamOutPaced(true, true, 12)).toBe(false);
    expect(seamOutPaced(true, false, 0)).toBe(false);
    expect(seamOutPaced(true, false, 12)).toBe(true);
  });
});

describe("⭐⭐⭐ the progress (`seamOutTarget`, `seamOutStep`)", () => {
  it("⭐ no finger travel, a finger down: the target 0 — the camera WAITS (nothing by time, for ever)", () => {
    expect(seamOutTarget(0, 0, SPAN, ORB, true)).toBe(0);
    let p = 0;
    for (let i = 0; i < 600; i++) p = seamOutStep(p, seamOutTarget(0, 0, SPAN, ORB, true), DT, HALF, SPEED, true);
    expect(p).toBe(0);
  });
  it("⭐ the approach's travel outward of ¼, ½, 1 × the span: the target ¼, ½, 1 (beyond: 1); a slow finger's progress follows it exactly", () => {
    expect(seamOutTarget(SPAN / 4, 0, SPAN, ORB, true)).toBeCloseTo(0.25, 12);
    expect(seamOutTarget(SPAN / 2, 0, SPAN, ORB, true)).toBeCloseTo(0.5, 12);
    expect(seamOutTarget(SPAN, 0, SPAN, ORB, true)).toBe(1);
    expect(seamOutTarget(3 * SPAN, 0, SPAN, ORB, true)).toBe(1);
    // 0.15 mm a frame: 1/80 of the span a frame, under the speed's 1/30 — the progress the target, frame by frame
    let p = 0;
    let mm = 0;
    for (let i = 0; i < 80; i++) {
      mm += 0.15;
      const t = seamOutTarget(mm, 0, SPAN, ORB, true);
      p = seamOutStep(p, t, DT, HALF, SPEED, true);
      expect(p).toBeCloseTo(Math.min(1, mm / SPAN), 12);
    }
    expect(p).toBeCloseTo(1, 9);
  });
  it("⭐ an orbit travel of `tiltBlendMm` alone: whole; both: the larger", () => {
    expect(seamOutTarget(0, ORB, SPAN, ORB, true)).toBe(1);
    expect(seamOutTarget(0, ORB / 2, SPAN, ORB, true)).toBeCloseTo(0.5, 12);
    expect(seamOutTarget(SPAN * 0.3, ORB * 0.6, SPAN, ORB, true)).toBeCloseTo(0.6, 12);
    expect(seamOutTarget(SPAN * 0.8, ORB * 0.2, SPAN, ORB, true)).toBeCloseTo(0.8, 12);
    // a span 0: whole at the first millimetre, none before
    expect(seamOutTarget(0, 0.01, SPAN, 0, true)).toBe(1);
    expect(seamOutTarget(0, 0, SPAN, 0, true)).toBe(0);
  });
  it("⭐ the finger LIFTED: the target 1 whatever the travels — it completes with the PICTURE never over the one speed: a half turn at 360°/s in 36 frames at 60 fps (within one; 30 at the speed + its smooth ends); from 0.3, 27", () => {
    expect(seamOutTarget(0, 0, SPAN, ORB, false)).toBe(1);
    expect(seamOutTarget(SPAN * 0.1, 0, SPAN, ORB, false)).toBe(1);
    expect(Math.abs(framesToWhole(0, 1) - 36)).toBeLessThanOrEqual(1);
    expect(Math.abs(framesToWhole(0.3, 1) - 27)).toBeLessThanOrEqual(1);
    // a quarter turn: half the frames
    expect(Math.abs(framesToWhole(0, 1, HALF / 2) - 18)).toBeLessThanOrEqual(1);
    // ⭐⭐⭐ (T5, the owner: "one speed for every tilt") the SHARE SHOWN never moves more than the one speed's step in a frame, cruises AT it in the middle,
    // and starts and ends slower — whatever the turn's angle
    for (const whole of [HALF, HALF / 2, HALF / 6]) {
      const r = (((SPEED * Math.PI) / 180) * (DT / 1000)) / whole;
      const steps: number[] = [];
      let p = 0;
      for (let i = 0; i < 400 && p < 1; i++) {
        const q = seamOutStep(p, 1, DT, whole, SPEED, true);
        steps.push(seamOutShare(q) - seamOutShare(p));
        p = q;
      }
      expect(p).toBe(1);
      for (const d of steps) expect(d).toBeLessThanOrEqual(r * (1 + 1e-9));
      if (steps.length >= 8) {
        expect(Math.max(...steps)).toBeGreaterThan(0.97 * r); // it cruises at the one speed
        expect(steps[0]!).toBeLessThan(0.5 * r); // the smooth start
        expect(steps[steps.length - 1]!).toBeLessThan(0.5 * r); // the smooth end
      }
    }
  });
  it("⭐ a FAST finger (the whole travel in one frame): the progress grows by the one speed's step only (1/30 a frame for a half turn at 360°/s)", () => {
    const t = seamOutTarget(5 * SPAN, 0, SPAN, ORB, true);
    expect(t).toBe(1);
    const p1 = seamOutStep(0, t, DT, HALF, SPEED, true);
    expect(p1).toBeCloseTo(1 / 30, 12);
    const p2 = seamOutStep(p1, t, DT, HALF, SPEED, true);
    expect(p2).toBeCloseTo(2 / 30, 12);
  });
  it("⭐ never back: a smaller target holds the progress", () => {
    expect(seamOutStep(0.6, 0.2, DT, HALF, SPEED, true)).toBe(0.6);
    expect(seamOutStep(0.6, 0, DT, HALF, SPEED, true)).toBe(0.6);
    let p = 0.4;
    for (const t of [0.1, 0.3, 0.35, 0.0]) {
      const q = seamOutStep(p, t, DT, HALF, SPEED, true);
      expect(q).toBeGreaterThanOrEqual(p);
      p = q;
    }
    expect(p).toBe(0.4);
  });
  it("⭐ held until the camera's stage has read the turn's angle (`axisKnown`); a turn of no angle: whole; `degS` 0: the target at once", () => {
    expect(seamOutStep(0, 1, DT, HALF, SPEED, false)).toBe(0);
    expect(seamOutStep(0.2, 1, DT, HALF, SPEED, false)).toBe(0.2);
    expect(seamOutStep(0, 0, DT, 0, SPEED, true)).toBe(1);
    expect(seamOutStep(0, 0.7, DT, HALF, 0, true)).toBe(0.7);
  });
  it("⭐ `tiltOutBlendMm` 0: the caller's TIMED path — `seamOutPaced` false, so no paced turn is ever started (the old `seamTurnStart(st, false)`)", () => {
    expect(seamOutPaced(true, false, 0)).toBe(false);
  });
});

describe("⭐⭐⭐ the share shown (`seamOutShare`): a smoothstep", () => {
  it("⭐ 0 at 0, ½ at ½, 1 at 1; clamped", () => {
    expect(seamOutShare(0)).toBe(0);
    expect(seamOutShare(0.5)).toBe(0.5);
    expect(seamOutShare(1)).toBe(1);
    expect(seamOutShare(-0.2)).toBe(0);
    expect(seamOutShare(1.4)).toBe(1);
  });
  it("⭐ its first and last steps smaller than the middle one (a smooth start and end); monotone", () => {
    const N = 30;
    const steps: number[] = [];
    for (let i = 0; i < N; i++) steps.push(seamOutShare((i + 1) / N) - seamOutShare(i / N));
    const mid = steps[N / 2]!;
    expect(steps[0]!).toBeLessThan(mid / 4);
    expect(steps[N - 1]!).toBeLessThan(mid / 4);
    for (const s of steps) expect(s).toBeGreaterThan(0);
  });
});

describe("⭐⭐⭐ the hold (`turnHoldsGizmo`): the way out never holds the gizmo; every other turn as before", () => {
  it("⭐ the table", () => {
    for (const paced of [false, true])
      for (const pending of [false, true])
        for (const blend of [false, true])
          for (const k of [0, 0.4, 0.999, 1]) {
            expect(turnHoldsGizmo(true, paced, pending, blend, k)).toBe(false);
            expect(turnHoldsGizmo(false, paced, pending, blend, k)).toBe(paced ? seamTurnHolds(true, pending, blend, k) : k < 1);
          }
    // a timed turn short of whole still holds
    expect(turnHoldsGizmo(false, false, false, false, 0.5)).toBe(true);
  });
});

describe("⭐⭐⭐ the tunable `tiltOutBlendMm`", () => {
  it("⭐ 12 by default; 0 … 60 accepted, outside refused", () => {
    expect(DEFAULT_CONFIG.tiltOutBlendMm).toBe(12);
    for (const v of [0, 1, 12, 60]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, tiltOutBlendMm: v })).not.toThrow();
    for (const v of [-1, 60.5, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, tiltOutBlendMm: v })).toThrow();
  });
});

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
/** the comments out (a pin reads the code, not its prose) */
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
  it("⭐ `tiltOff`: the paced turn only when `seamOutPaced` (left by distance, `tiltOutBlendMm` > 0) — else the old `seamTurnStart(st, false)`", () => {
    const f = fnCode(W, "function tiltOff(");
    // ⭐⭐⭐ (2026-11-16, step C5) through the one event (`crossTurn`): the paced flag the site's, the turn started there
    expect(f).toContain("const paced = seamOutPaced(tl.off, st.asmTiltAuto, st.cfg.tiltOutBlendMm);");
    expect(f).toContain("crossTurn(st, { at: { mq: poleYawKept(mq0, ORBIT_PITCH_MAX_RAD, hP), g }, uWas, carry: false, paced, hold: held });");
    expect(f).toContain("} else st.asmMapQ = null; crossTurn(st, { at: null, uWas, carry: false, paced, hold: held });");
    const c = fnCode(W, "function crossTurn(");
    expect(c).toContain("if (c.paced) seamOutStart(st); else if (st.asmCamLast !== null) seamTurnStart(st, false); if (c.uWas !== null) seamEase(st, c.uWas);");
    // the latch read is LAST frame's: `tiltOff` runs before the latch is stepped
    const a = fnCode(W, "export function assemblyFrame(");
    before(a, "if (st.asmTilt !== null && st.asmTilt.exit) tiltOff(st);", "st.asmTiltAuto = tiltAutoLatch(st.asmTiltAuto, approachDistance(st.cfg, st.approach), st.cfg.tiltAutoM);");
    // the only other place a paced out-turn is started: none
    expect(codeOnly(raw(W)).match(/seamOutStart\(st\)/g)?.length).toBe(1);
  });
  it("⭐ `seamOutStart`: the same turn from the pose shown, its progress at 0 and its travels at 0", () => {
    const s = fnCode(W, "function seamOutStart(");
    expect(s).toContain("seamTurnStart(st, false); if (st.asmZoneMix !== null) st.asmZoneMix.out = { p: 0, outMm: 0, orbitMm: 0 };");
  });
  it("⭐ the travels fed only while the turn is alive (`seamOutFeed` on `asmZoneMix.out`): the approach's outward, the orbit's", () => {
    const f = fnCode(W, "export function seamOutFeed(");
    expect(f).toContain("const o = st.asmZoneMix?.out; if (o === undefined) return; o.outMm += outMm; o.orbitMm += orbitMm;");
    const ai = fnCode(W, "export function approachInput(");
    expect(ai).toContain("const da = dyMm * orbitDvPerMm(st); if (da > 0) seamOutFeed(st, Math.abs(dyMm), 0); const taken = approachMove(st, da);");
    const pw = codeOnly(raw("render/pointer_wiring.ts")).replace(/\s+/g, " ");
    expect(pw).toContain("if (asmOn && !shiftApproach) seamOutFeed(st, 0, Math.hypot(db.dx, db.dy) / mmToPx(1));");
    // nowhere else is the out-turn's state written
    expect(codeOnly(raw(W)).match(/\.outMm \+=|\.orbitMm \+=/g)?.length).toBe(2);
  });
  it("⭐ `seamOutFrame`: the target from the travels and the router's pointers, the step at the one speed over `turnWhole`, `k` the smoothstep; called after `seamTurnFrame`", () => {
    const f = fnCode(W, "function seamOutFrame(");
    expect(f).toContain("if (zm === null || zm.out === undefined) return;");
    expect(f).toContain("const whole = turnWhole(st, zm);");
    expect(f).toContain("const target = seamOutTarget(o.outMm, o.orbitMm, st.cfg.tiltOutBlendMm, st.cfg.tiltBlendMm, st.router.all().length > 0);");
    expect(f).toContain("o.p = seamOutStep(o.p, target, dtMs, whole, st.cfg.tiltRollDegS, zm.axis !== null && zm.dirFrom === undefined); zm.k = seamOutShare(o.p);"); // ⭐ (package A) …and its ease read
    expect(f).not.toContain("st.asmZoneMix = null"); // ⭐ (package A, the audit's blocker) whole: ended once DRAWN, in the camera's stage (`zoneMixPose`)
    const a = fnCode(W, "export function assemblyFrame(");
    before(a, "seamTurnFrame(st, dtMs);", "seamOutFrame(st, dtMs);");
    before(a, "seamOutFrame(st, dtMs);", "const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };");
  });
  it("⭐ the timed clock leaves it alone (`zoneStep`), and `tiltClampStep` does not hold for it (`turnHoldsGizmo`)", () => {
    const z = fnCode(W, "function zoneStep(");
    expect(z).toContain("if (zm !== null && zm.axis !== null && zm.dirFrom === undefined && zm.byMm !== true && zm.out === undefined) {"); // ⭐ (package A) …and its ease read
    const h = fnCode(W, "export function tiltClampStep(");
    expect(h).toContain("const zoneTurning = zm !== null && turnHoldsGizmo(zm.out !== undefined, zm.byMm === true, st.asmTiltPending, st.asmBlend !== null, zm.k);");
  });
  it("⭐ coming back in: `tiltOn` starts its own turn (a new `asmZoneMix`, no `out`) and its own ease — nothing of the out-turn survives", () => {
    const s = fnCode(W, "function seamTurnStart(");
    expect(s).toContain("st.asmZoneMix = st.asmCamLast === null ? null : { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null, rule: 0, keep: null, done: 0, ...(paced ? { byMm: true } : {}) };");
    expect(s).not.toContain("out");
    const t = fnCode(W, "function tiltOn(");
    expect(t).toContain("st.asmFree = null; seamTurnStart(st, byMm); seamEase(st, uWas);");
    const e = fnCode(W, "function seamEase(");
    expect(e).toContain("st.asmDirEase = null;");
  });
});
