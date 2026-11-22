// ⭐⭐⭐ (2026-11-18, UPRIGHT_PICTURE.md §2 step 2 — U0) law U's pure parts the carried up still reads: the weight on the band, the root that levels the
// glass (`uprightAngle`), the change as he sees it (`changeSeen`), the half turn's reader. ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) law U's own
// step (`uprightStep`, `UPRIGHT_REST`: the law in time, its carry, its rest, `closed`, its half turn) deleted with its path, and its vectors with it
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { poseRolled } from "../src/input/roll_follow";
import { gravityTilt, UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG, UPRIGHT_MAX_DEG_S, changeSeen, lawHalfTurn, uprightAngle, uprightWeight, viewFromVertical } from "../src/input/upright";

const DEG = Math.PI / 180;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const piece: Vec3 = [0.21, 0.32, 0.18];
/** a pose looking at the piece from `el` deg above the horizon (negative: from below), heading `yaw`, rolled `roll` about its view */
function poseAt(el: number, yaw: number, roll: number, off: Vec3 = [0.005, 0.002, -0.003]): CamPose {
  const f = unit([Math.cos(el * DEG) * Math.cos(yaw * DEG), -Math.sin(el * DEG), Math.cos(el * DEG) * Math.sin(yaw * DEG)]);
  const eye = add(piece, mul(f, -2));
  const look = add(add(piece, mul(f, 0.5)), off);
  const k = f[1];
  const u0 = Math.abs(k) > 0.999999 ? ([1, 0, 0] as Vec3) : unit([-f[0] * k, 1 - f[1] * k, -f[2] * k]);
  return { eye, look, up: rotateAbout(u0, f, roll * DEG) };
}

describe("law U's defaults and its weight", () => {
  it("the defaults: the band 15 – 50°, the rest at 720° a second (the owner 2026-11-19: \"Changing both together is much better\"; 5 – 25°, 1 800 before)", () => {
    expect([UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG, UPRIGHT_MAX_DEG_S]).toEqual([15, 50, 520]); // ⭐ (2026-11-20) his 520
    expect(uprightWeight(14.99 * DEG, UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG)).toBe(0);
    expect(uprightWeight(50 * DEG, UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG)).toBe(1);
    expect(uprightWeight(32.5 * DEG, UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG)).toBeCloseTo(0.5, 12);
  });
  it("w a smoothstep on the band 5 – 25° (the knobs as given): 0 within 5°, 1 from 25°", () => {
    expect(uprightWeight(4.99 * DEG, 5, 25)).toBe(0);
    expect(uprightWeight(25 * DEG, 5, 25)).toBe(1);
    expect(uprightWeight(15 * DEG, 5, 25)).toBeCloseTo(0.5, 12);
    expect(uprightWeight(10 * DEG, 5, 25)).toBeCloseTo(0.15625, 12);
    expect(viewFromVertical(poseAt(70, 30, 0, [0, 0, 0])) / DEG).toBeCloseTo(20, 9);
    expect(viewFromVertical(poseAt(-50, 30, 0, [0, 0, 0])) / DEG).toBeCloseTo(40, 9);
  });
});


describe("the root: always a root, the nearest 0", () => {
  it("whatever the line (near the vertical, far off the view): a number returned levels the glass; an upright pose is not turned", () => {
    let roots = 0;
    let none = 0;
    for (const d of [[0.3, 1, 0.2], [0, 1, 0.6], [1, 0.4, 0], [0.2, -1, 0.1]] as Vec3[]) {
      for (const roll of [0, 40, -100, 170]) {
        const g = poseAt(50, 0, roll, [0, 0, 0]);
        const line = { at: piece, dir: unit(d), throughLook: false };
        const a = uprightAngle(g, line);
        if (a === null) none++;
        else {
          roots++;
          expect(Math.abs(gravityTilt(poseRolled(g, line, a))!)).toBeLessThan(1e-9);
          if (roll === 0) expect(Math.abs(a)).toBeLessThan(1e-9);
        }
      }
    }
    expect(roots).toBeGreaterThan(5);
    expect(none).toBeGreaterThan(0);
  });
});

describe("no root", () => {
  it("a line along the world's vertical: no turn about it levels the glass — α null", () => {
    const g = poseAt(50, 0, 30);
    const vertical = { at: piece, dir: [0, 1, 0] as Vec3, throughLook: false };
    expect(uprightAngle(g, vertical)).toBeNull();
  });
});

describe("RB1 — changeSeen: a change of frame as the player SEES it, decided once (UPRIGHT_PICTURE.md §12, the rebuild)", () => {
  const C = { stays: false, wBefore: 1, wAfter: 1, turnRad: Math.PI, freeMaxDeg: 90 };
  it("upright at both ends (w 1): any turn applied at once — its roll the law hides; the share seen 0", () => {
    for (const t of [10, 89, 90, 135, 180]) {
      const r = changeSeen({ ...C, turnRad: t * DEG });
      expect(r.timed).toBe(false);
      expect(r.seenRad).toBe(0);
    }
  });
  it("at the vertical (w 0 at either end): FO3's rule — timed from freeTurnMaxDeg (its 2° tolerance), at once under it", () => {
    expect(changeSeen({ ...C, wBefore: 0, turnRad: 120 * DEG }).timed).toBe(true);
    expect(changeSeen({ ...C, wAfter: 0, turnRad: 89 * DEG }).timed).toBe(true); // 89 ≥ 90 − 2
    expect(changeSeen({ ...C, wAfter: 0, turnRad: 87 * DEG }).timed).toBe(false);
    expect(changeSeen({ ...C, wBefore: 0, turnRad: 87 * DEG }).seenRad).toBeCloseTo(87 * DEG, 12);
  });
  it("in the band: the share seen (1 − min w) × the turn — the SMALLER weight of the two ends", () => {
    const r = changeSeen({ ...C, wBefore: 0.25, wAfter: 0.75, turnRad: 160 * DEG });
    expect(r.seenRad).toBeCloseTo(0.75 * 160 * DEG, 12);
    expect(r.timed).toBe(true); // 120° seen
    const q = changeSeen({ ...C, wBefore: 0.6, wAfter: 0.9, turnRad: 160 * DEG });
    expect(q.seenRad).toBeCloseTo(0.4 * 160 * DEG, 12);
    expect(q.timed).toBe(false); // 64° seen
  });
  it("a kind that stays is timed whatever is seen; an unknown angle is timed; freeTurnMaxDeg 0: every change timed", () => {
    expect(changeSeen({ ...C, stays: true, turnRad: 1 * DEG }).timed).toBe(true);
    expect(changeSeen({ ...C, turnRad: Number.NaN }).timed).toBe(true);
    expect(changeSeen({ ...C, turnRad: Number.NaN }).seenRad).toBe(Infinity);
    expect(changeSeen({ ...C, wBefore: 0, turnRad: 1 * DEG, freeMaxDeg: 0 }).timed).toBe(true);
  });
  it("weights out of [0, 1] or not finite read as clamped (not finite: 0 — the vertical, the safe side)", () => {
    expect(changeSeen({ ...C, wBefore: 2, wAfter: 1.5, turnRad: 170 * DEG }).timed).toBe(false);
    expect(changeSeen({ ...C, wBefore: Number.NaN, turnRad: 170 * DEG }).timed).toBe(true);
    expect(changeSeen({ ...C, wBefore: -1, turnRad: 170 * DEG }).seenRad).toBeCloseTo(170 * DEG, 12);
  });
});

describe("RB3 — the half turn's one reader (`lawHalfTurn`: the carried up's state, `asmRollShadow.one.state`)", () => {
  it("under way only while `half` is set", () => {
    expect(lawHalfTurn({ half: true })).toBe(true);
    expect(lawHalfTurn({})).toBe(false);
    expect(lawHalfTurn(undefined)).toBe(false);
  });
});
