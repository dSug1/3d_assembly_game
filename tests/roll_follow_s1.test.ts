// ⭐⭐⭐ (2026-11-18, FAST_ORBIT.md §12.4, §13.7, §14 — FO3 S1) the picture DRAWN: a change judged free on its whole angle (`poseTurnAngle`, `turnIsFree`),
// the piece's shown direction's rest on a clock of its own (`restShare`), the sliders; and its wiring (`roll_shadow.ts` `rollPictureFrame`) read in the source
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import { rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { FREE_TURN_TOL_DEG, GAP_ZERO, gapStep, poseRolled, framedLine, poseTurnAngle, restShare, turnIsFree, type RollGap } from "../src/input/roll_follow";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const turnPose = (p: CamPose, c: Vec3, k: Vec3, th: number): CamPose => ({
  eye: add(c, rotateAbout(sub(p.eye, c), k, th)),
  look: add(c, rotateAbout(sub(p.look, c), k, th)),
  up: rotateAbout(p.up, k, th),
});
const piece: Vec3 = [0.21, 0.32, 0.18];
const ghost: CamPose = { eye: [1.1, 0.9, 1.3], look: [0, 0.229, 0.191], up: unit([0.1, 1, -0.2]) };

describe("poseTurnAngle — the camera's whole turn between two poses (swing and twist)", () => {
  it("a pose against itself: 0; a rigid turn of θ about any axis: θ, whatever the axis or the centre", () => {
    expect(poseTurnAngle(ghost, ghost)).toBeLessThan(1e-7);
    for (const th of [5, 30, 51, 88.3, 90, 135, 179]) {
      for (const k of [unit([0, 1, 0]), unit([1, 0.3, -0.2]), unit([-0.2, 0.1, 1])]) {
        expect(poseTurnAngle(ghost, turnPose(ghost, piece, k, th * DEG)) / DEG).toBeCloseTo(th, 6);
        expect(poseTurnAngle(ghost, turnPose(ghost, [3, -1, 2], k, -th * DEG)) / DEG).toBeCloseTo(th, 6);
      }
    }
  });
  it("a roll about the framed line counts whole (a twist is part of the whole angle)", () => {
    const line = framedLine(ghost, piece);
    expect(poseTurnAngle(ghost, poseRolled(ghost, line, 40 * DEG)) / DEG).toBeCloseTo(40, 6);
  });
  it("a translation alone (the orbit's own step with no turn) is no turn", () => {
    const moved: CamPose = { eye: add(ghost.eye, [0.1, -0.2, 0.05]), look: add(ghost.look, [0.1, -0.2, 0.05]), up: ghost.up };
    expect(poseTurnAngle(ghost, moved)).toBeLessThan(1e-7);
  });
});

describe("turnIsFree — a change made free under freeTurnMaxDeg less its tolerance (§13.7 (d): a quarter turn read 88.3° stays)", () => {
  it("the tolerance is 2°: at 90, 87.9° free, 88° and 88.3° and 90° and 180° stay", () => {
    expect(FREE_TURN_TOL_DEG).toBe(2);
    expect(turnIsFree(87.9 * DEG, 90)).toBe(true);
    expect(turnIsFree(51 * DEG, 90)).toBe(true);
    expect(turnIsFree(0, 90)).toBe(true);
    expect(turnIsFree(88 * DEG, 90)).toBe(false);
    expect(turnIsFree(88.3 * DEG, 90)).toBe(false);
    expect(turnIsFree(90 * DEG, 90)).toBe(false);
    expect(turnIsFree(Math.PI, 90)).toBe(false);
  });
  it("freeTurnMaxDeg 0: never (today's game); a smaller slider frees less; a NaN angle never", () => {
    expect(turnIsFree(0, 0)).toBe(false);
    expect(turnIsFree(1 * DEG, 0)).toBe(false);
    expect(turnIsFree(30 * DEG, 45)).toBe(true);
    expect(turnIsFree(44 * DEG, 45)).toBe(false);
    expect(turnIsFree(Number.NaN, 90)).toBe(false);
  });
});

describe("restShare — the piece's shown direction's rest on its own clock (O3), the follower's law", () => {
  it("whole rest: share 0; at rest: 1; half the angle left: 0.5", () => {
    expect(restShare({ gap: 0.2, speed: 0 }, 0.2)).toBe(0);
    expect(restShare(GAP_ZERO, 0.2)).toBe(1);
    expect(restShare({ gap: 0.1, speed: -1 }, 0.2)).toBeCloseTo(0.5, 12);
    expect(restShare({ gap: 0.1, speed: 0 }, 0)).toBe(1);
  });
  it("stepped by gapStep at 200 ms: it rises smoothly to exactly 1 with no overshoot — the same at 60 and at 143 frames a second", () => {
    const at = (hz: number): number[] => {
      let r: RollGap = { gap: 7.7 * DEG, speed: 0 };
      const out: number[] = [];
      for (let t = 0; t < 1500; t += 1000 / hz) {
        r = gapStep(r, 1000 / hz, 200);
        out.push(restShare(r, 7.7 * DEG));
      }
      return out;
    };
    const a = at(60);
    for (let i = 1; i < a.length; i++) expect(a[i]!).toBeGreaterThanOrEqual(a[i - 1]!);
    expect(a[0]!).toBeLessThan(0.05); // a smooth start (critically damped: no step at the first frame)
    expect(a[a.length - 1]).toBe(1);
    // 0.4 s: the same share at both rates (the closed form)
    const b = at(143);
    expect(Math.abs(a[Math.round(0.4 * 60) - 1]! - b[Math.round(0.4 * 143) - 1]!)).toBeLessThan(0.01);
  });
});

describe("the two sliders (FO3 S1): rollFollowMs 200 (60 – 600), freeTurnMaxDeg 90 (0 – 90)", () => {
  it("the defaults and the bounds", () => {
    expect(DEFAULT_CONFIG.rollFollowMs).toBe(200);
    expect(DEFAULT_CONFIG.freeTurnMaxDeg).toBe(90);
    for (const v of [60, 600]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, rollFollowMs: v })).not.toThrow();
    for (const v of [59, 601, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, rollFollowMs: v })).toThrow();
    for (const v of [0, 45, 90]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeTurnMaxDeg: v })).not.toThrow();
    for (const v of [-1, 91, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeTurnMaxDeg: v })).toThrow();
  });
});

describe("the wiring (`roll_shadow.ts` rollPictureFrame) — read in the source", () => {
  const rs = readFileSync("src/render/roll_shadow.ts", "utf8");
  const aw = readFileSync("src/render/assembly_wiring.ts", "utf8");
  it("freeTurnMaxDeg 0: the shadow and today's zoneMixPose, nothing else (R10)", () => {
    expect(rs).toMatch(/if \(!\(maxDeg > 0\)\) \{\n\s*rollShadowFrame\(st, piece, \{ eye, look, up \}, dtMs\);\n\s*return zoneMixPose\(st, piece, eye, look, up\);\n\s*\}/);
  });
  it("a turn made free only at its first frame, none of the kinds that stay, nothing that stays drawn last frame, on its whole angle", () => {
    expect(rs).toContain("if (zm !== null && fresh && was !== null && was.drawn && was.turn === null && zm.byMm !== true && zm.out === undefined && zm.tilt !== true && !sq && !tiltHold) {");
    expect(rs).toContain("const whole = poseTurnAngle(was.ghost, ghost);");
    expect(rs).toContain("if (turnIsFree(whole, maxDeg)) {");
    expect(rs).toContain('const mode: FollowMode = was === null || !was.drawn || zm !== null || afterStay ? "ZERO" : gizmoFree ? "TAKE" : "SKIP";');
    expect(rs).toContain("const g = followStep(was?.free ?? GAP_ZERO, tw, dtMs, st.cfg.rollFollowMs, mode);");
  });
  it("the tilt's turns tagged to stay (its entry, its exit); the direction's rest on its own clock, stepped before it is read", () => {
    expect(aw.match(/st\.asmZoneMix\.tilt = true;/g)?.length).toBe(2);
    expect(aw).toContain("return easedDir(s, e, e.own !== undefined ? restShare(e.own, e.angle) : e.mix === st.asmZoneMix && st.asmZoneMix !== null ? st.asmZoneMix.k : 1);");
    expect(aw).toContain("const r = gapStep(de.own, dtMs, st.cfg.rollFollowMs);");
  });
});
