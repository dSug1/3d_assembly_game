// ⭐⭐⭐ (2026-11-13, ORBIT_ANY_SHAPE.md §9 — the owner: *"in polar orbit, if I hit the zenith edge at zero camera yaw there is almost no roll of the camera
// when the gizmo hit the zenith edge. If I hit the zenith edge with camera yaw towards the left, there is a roll towards the left … the more the camera yaw
// when the gizmo hit the zenith edge the more the camera roll at the hit"*). RED against `16b5da4`: `calmLevelHeading`, `cameraHeading` absent — the
// world camera's heading was `calmHeading` of the SHOWN direction, which the calm's pole fade (`poleWeight`, 60° … 85°) and the vertical itself (no
// heading: the guard's bare yaw) took back to the orbit's yaw: a dy alone rolled a camera looking down by (1 − sH) × the yaw's angle off the face
// (probed: 14° on Scene_1's cube at 21° off its front, 18.6° in ONE frame on the heptagon's ridge). The old composition is kept below beside the new.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calmHeading, calmLevelHeading, calmShown, cameraHeading, heldOffsetStep, HELD_OFFSET_PER_YAW, LEVEL_HEADING_BLEND_RAD, type CalmState } from "../src/input/orbit_calm";
import { offsetFrame, orbitDir, vOfPitch } from "../src/input/assembly_orbit";

const D = Math.PI / 180;
const wrapDeg = (a: number) => (Math.atan2(Math.sin(a), Math.cos(a)) / D);
// Scene_1's front face (the orbit's yaw −90° looks at it), the calm in its middle: the shares 0.25 (the defaults)
const FRONT: CalmState = { n: [0, 0, -1], sH: 0.25, sV: 0.25, wA: 0 };
const yaw = -68.8 * D; // 21.2° to the left of square, as the probe's climb
const pitches = [0, 20, 40, 50, 55, 60, 70, 80, 85, 88, 89.5, 90];
const newHeading = (p: number, c: CalmState) => {
  const u0 = orbitDir(yaw, vOfPitch(p * D));
  return cameraHeading(yaw, u0, calmShown(u0, c), calmLevelHeading(yaw, c));
};
const oldHeading = (p: number, c: CalmState) => {
  const u0 = orbitDir(yaw, vOfPitch(p * D));
  return calmHeading(yaw, u0, calmShown(u0, c));
};
/** the screen's roll as seen looking down: the camera's up turned about the world's vertical (its heading, read off the up's level part) */
const upHeading = (p: number, h: number, c: CalmState) => {
  const u0 = orbitDir(yaw, vOfPitch(p * D));
  const f = offsetFrame(calmShown(u0, c), h, 0, 0);
  return Math.atan2(f.up[2], f.up[0]);
};

describe("the camera's heading through the zenith (§9)", () => {
  it("a dy alone: the heading is the calm's level reading from 60° to the pole — no roll at the zenith (the old one swung by the withheld share)", () => {
    const at60 = newHeading(60, FRONT);
    for (const p of pitches.filter((q) => q >= 60)) expect(Math.abs(wrapDeg(newHeading(p, FRONT) - at60))).toBeLessThan(1e-9);
    // ⛔ the old composition: back to the bare yaw at the vertical — 15.9° of roll (0.75 × 21.2°)
    expect(Math.abs(wrapDeg(oldHeading(90, FRONT) - oldHeading(60, FRONT)))).toBeGreaterThan(15);
    expect(Math.abs(wrapDeg(oldHeading(90, FRONT) - yaw))).toBeLessThan(1e-9);
  });

  it("the roll's size followed the yaw (the owner's report): left and right, more with more yaw — none now", () => {
    for (const off of [-35, -20, -5, 5, 20, 35]) {
      const y = (-90 + off) * D;
      const u60 = orbitDir(y, vOfPitch(60 * D));
      const u90 = orbitDir(y, vOfPitch(90 * D));
      const old = wrapDeg(calmHeading(y, u90, calmShown(u90, FRONT)) - calmHeading(y, u60, calmShown(u60, FRONT)));
      expect(Math.sign(old)).toBe(Math.sign(off));
      expect(Math.abs(old)).toBeCloseTo(0.75 * Math.abs(off), 6);
      const now = wrapDeg(cameraHeading(y, u90, calmShown(u90, FRONT), calmLevelHeading(y, FRONT)) - cameraHeading(y, u60, calmShown(u60, FRONT), calmLevelHeading(y, FRONT)));
      expect(Math.abs(now)).toBeLessThan(1e-9);
    }
  });

  it("below the blend the heading is the shown direction's own, as before (nothing else changes); on a vertical face the two readings agree", () => {
    for (const p of [0, 20, 40, LEVEL_HEADING_BLEND_RAD / D]) expect(newHeading(p, FRONT)).toBe(oldHeading(p, FRONT));
    for (const p of [0, 30, 50]) expect(Math.abs(wrapDeg(calmLevelHeading(yaw, FRONT) - oldHeading(p, FRONT)))).toBeLessThan(1e-9);
  });

  it("the camera's up, as the view comes down to vertical, holds still from 40° to the pole within 0.1° (the old one turned by 15.9° between 60° and 85°)", () => {
    const a = upHeading(40, newHeading(40, FRONT), FRONT);
    for (const p of [55, 60, 65, 70, 75, 80, 85, 88, 89.99]) expect(Math.abs(wrapDeg(upHeading(p, newHeading(p, FRONT), FRONT) - a))).toBeLessThan(0.1);
    const b0 = upHeading(89.99, oldHeading(89.99, FRONT), FRONT);
    expect(Math.abs(wrapDeg(b0 - a))).toBeGreaterThan(15);
  });

  it("the level reading: whole share = the yaw; behind the face faded to the yaw; a cap's normal (no heading) = the yaw; the whole share by position (kH)", () => {
    expect(calmLevelHeading(yaw, { ...FRONT, sH: 1 })).toBeCloseTo(yaw, 12);
    expect(calmLevelHeading(yaw, FRONT, 1)).toBeCloseTo(yaw, 12);
    expect(calmLevelHeading(yaw, null)).toBe(yaw);
    expect(calmLevelHeading(yaw, { ...FRONT, n: [0, 1, 0] })).toBe(yaw);
    expect(calmLevelHeading(90 * D, FRONT)).toBeCloseTo(90 * D, 12); // straight behind the front face
    expect(wrapDeg(calmLevelHeading(yaw, FRONT) - -90 * D)).toBeCloseTo(0.25 * 21.2, 9);
    // a slanted face reads its own heading (the heptagon's front top face): the same as the vertical front's
    expect(calmLevelHeading(yaw, { ...FRONT, n: [0, 0.8966, -0.4429] })).toBeCloseTo(calmLevelHeading(yaw, FRONT), 12);
  });

  it("the held offset (`heldOffsetStep`): a dy alone climbing holds it; a dx looking down relaxes it toward none (the old zenith heading) by at most half the yaw; coming down closes it by the pitch, whole at 60°", () => {
    const O = -16 * D;
    // none yet / whole share: the target
    expect(heldOffsetStep(null, O, 0.3, 0.5)).toBe(O);
    expect(heldOffsetStep(5 * D, O, 1, 0.9)).toBe(O);
    // climbing (w falling) or level, no dx: held whatever the target does (the cap's reading changing under it)
    expect(heldOffsetStep(O, -3 * D, 0.4, 0.6)).toBe(O);
    expect(heldOffsetStep(O, 7 * D, 0, 0)).toBe(O);
    // a dx at the zenith: toward 0 by HELD_OFFSET_PER_YAW × |dYaw|, never past it
    expect(heldOffsetStep(O, 7 * D, 0, 0, 4 * D)).toBeCloseTo(O + HELD_OFFSET_PER_YAW * 4 * D, 12);
    expect(heldOffsetStep(O, 7 * D, 0, 0, -4 * D)).toBeCloseTo(O + HELD_OFFSET_PER_YAW * 4 * D, 12);
    expect(heldOffsetStep(1 * D, 7 * D, 0, 0, 40 * D)).toBe(0);
    // coming down: the share of the way to 60° just made — by the pitch: two half steps = one whole
    const half = heldOffsetStep(0, 10 * D, 0.5, 0);
    expect(half).toBeCloseTo(5 * D, 12);
    expect(heldOffsetStep(half, 10 * D, 1, 0.5)).toBeCloseTo(10 * D, 12);
    expect(heldOffsetStep(half, 10 * D, 0.75, 0.5)).toBeCloseTo(7.5 * D, 12);
  });

  it("wired: the world's camera through `cameraHeading` with the held level heading (stepped once a frame in `calmFrame`), the tilted pole's exit target with the level reading", () => {
    const src = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8");
    expect(src).toMatch(/offsetFrame\(u, st\.asmLocked \? cam\.yaw : cameraHeading\(cam\.yaw, orbitDir\(cam\.yaw, cam\.v\), u, levelHeadingOf\(st, cam\.yaw\)\)/);
    expect(src).toMatch(/st\.asmHeadO = heldOffsetStep\(st\.asmHeadO, tgt, w, st\.asmHeadW, dYaw\)/);
    expect(src).toMatch(/return st\.asmHeadO !== null \? yaw \+ st\.asmHeadO : calmLevelHeading\(yaw, st\.asmCalm, st\.asmCalmWhole\)/);
    expect(src).toMatch(/const hW = cameraHeading\(yW, uOW, headingFrom\(uW, nX\), calmLevelHeading\(yW, cW\)\)/);
  });
});
