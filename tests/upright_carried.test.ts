// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/UPRIGHT_CARRIED_UP.md` §4.2 — packet E) ONE CARRIED UP, pure (`upCarried`, `askedTwist`, `carriedHold`,
// `dxSignPushing`): the picture turns about the framed line only by what the finger asks (C1, C2); its target reached only by a dx near the vertical, by
// time far out (C4); the ONE half turn at a logic change, its sense by continuity (C5); the push held from the same answer — the dy as OP8, a dx only
// when a half turn opened (C6); close in the logic's pose. Each vector red on a named mutant (the kit's `fo3/rebuild_e/mut_carried.json`).
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dxSignPushing, rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, poseRolled, twistAbout } from "../src/input/roll_follow";
import { askedTwist, CARRIED_REST, carriedHold, upCarried, type CarriedKnobs, type CarriedState } from "../src/input/upright";

const DEG = Math.PI / 180;
const DT = 1000 / 60;
const Y: Vec3 = [0, 1, 0];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const piece: Vec3 = [0.21, 0.32, 0.18];
/** a pose looking at the piece from `el` deg above the horizon, heading `yaw`, rolled `roll` about its view (the look point a little off the piece) */
function poseAt(el: number, yaw: number, roll: number): CamPose {
  const f = unit([Math.cos(el * DEG) * Math.cos(yaw * DEG), -Math.sin(el * DEG), Math.cos(el * DEG) * Math.sin(yaw * DEG)]);
  const eye = add(piece, mul(f, -2));
  const look = add(add(piece, mul(f, 0.5)), [0.005, 0.002, -0.003]);
  const k = f[1];
  const u0 = Math.abs(k) > 0.999999 ? ([1, 0, 0] as Vec3) : unit([-f[0] * k, 1 - f[1] * k, -f[2] * k]);
  return { eye, look, up: rotateAbout(u0, f, roll * DEG) };
}
/** the pose turned rigidly about the world's vertical through the piece (a turntable yaw) */
const yawed = (g: CamPose, deg: number): CamPose => ({
  eye: add(piece, rotateAbout(sub(g.eye, piece), Y, deg * DEG)),
  look: add(piece, rotateAbout(sub(g.look, piece), Y, deg * DEG)),
  up: rotateAbout(g.up, Y, deg * DEG),
});
const K: CarriedKnobs = { fromDeg: 15, fullDeg: 50, maxDegS: 720, alignDegPerMm: 3, halfHold: true };
/** one frame: the law, and the picture drawn */
const one = (s: CarriedState, g: CamPose, opt: { kappa?: number; change?: boolean; asked?: number; dxMm?: number; k?: CarriedKnobs } = {}) => {
  const line = framedLine(g, piece);
  const r = upCarried(s, g, line, DT, opt.k ?? K, opt.kappa ?? 1, opt.change ?? false, opt.asked ?? 0, opt.dxMm ?? 0);
  return { r, p: poseRolled(g, line, r.phi), line };
};
/** the picture's own turn about the framed line from one frame to the next (deg) */
const pictureRoll = (a: CamPose, b: CamPose, g: CamPose): number => twistAbout(a, b, framedLine(g, piece).dir) / DEG;

describe("the carried up — C1, C2: the picture turns only by what the finger asks", () => {
  it("near the vertical the logic rolls 20° by itself (a dy, its heading rule): the picture does NOT roll", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(CARRIED_REST, g0);
    const g1 = poseRolled(g0, framedLine(g0, piece), 20 * DEG);
    const b = one(a.r.state, g1);
    expect(Math.abs(pictureRoll(a.p, b.p, g1))).toBeLessThan(0.01);
  });
  it("a dx at a pole: the turntable's yaw IS asked — the picture turns with the logic, 1:1", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(CARRIED_REST, g0);
    const g1 = yawed(g0, 20);
    const asked = askedTwist(g0, g1, framedLine(g1, piece).dir, Y, 20 * DEG);
    const b = one(a.r.state, g1, { asked });
    const own = twistAbout(g0, g1, framedLine(g1, piece).dir) / DEG;
    expect(Math.abs(own)).toBeGreaterThan(15);
    expect(pictureRoll(a.p, b.p, g1)).toBeCloseTo(own, 3);
  });
  it("the turn asked: at a pole the turntable's for either sign of the yaw; far from the vertical the upright camera's", () => {
    for (const d of [20, -20]) {
      const g0 = poseAt(87, 30, 0);
      const g1 = yawed(g0, d);
      const dir = framedLine(g1, piece).dir;
      expect(askedTwist(g0, g1, dir, Y, Math.abs(d) * DEG)).toBeCloseTo(twistAbout(g0, g1, dir), 6);
    }
    const u0 = poseAt(20, 30, 0);
    const u1 = poseAt(20, 45, 0);
    const dir = framedLine(u1, piece).dir;
    expect(askedTwist(u0, u1, dir, Y, 0)).toBeCloseTo(twistAbout(u0, u1, dir), 3);
  });
});

describe("the carried up — C4: the alignment is PAID", () => {
  it("in the band, off its target and no dx: the picture stays; 5 mm of dx: it moves 15° toward the target (3° a mm)", () => {
    const g = poseAt(60, 30, 40);
    const a = one(CARRIED_REST, g);
    const still = one(a.r.state, g);
    expect(still.r.phi).toBeCloseTo(a.r.phi, 9);
    const paid = one(a.r.state, g, { dxMm: 5 });
    expect(Math.abs(paid.r.phi - a.r.phi) / DEG).toBeCloseTo(15, 3);
  });
  it("beyond the band (w 1) the picture goes upright by time: 12° a frame at 720° a second", () => {
    const g = poseAt(10, 30, 30);
    const a = one(CARRIED_REST, g);
    expect(Math.abs(a.r.phi) / DEG).toBeCloseTo(12, 3);
  });
  it("close in (κ 0) the picture IS the logic's pose", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one({ phi: 0.7 }, g0, { kappa: 0 });
    expect(a.r.phi).toBe(0);
  });
});

describe("the carried up — C5: THE half turn at a logic change", () => {
  it("a change of 170° opens it, the gizmo held; it closes in time (12° a frame) and lets the gizmo go", () => {
    const g0 = poseAt(87, 30, 0);
    let f = one(CARRIED_REST, g0);
    const g1 = poseRolled(g0, framedLine(g0, piece), 170 * DEG);
    f = one(f.r.state, g1, { change: true });
    expect(f.r.halfStart / DEG).toBeCloseTo(170, 3);
    expect(f.r.holding).toBe(true);
    let n = 1;
    while (f.r.state.hs === true && n < 40) {
      f = one(f.r.state, g1);
      n++;
    }
    expect(n).toBe(Math.ceil(170 / 12));
    expect(f.r.holding).toBe(false);
  });
  it("a change of 60°: no half turn, the picture does not move (paid later)", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(CARRIED_REST, g0);
    const g1 = poseRolled(g0, framedLine(g0, piece), 60 * DEG);
    const b = one(a.r.state, g1, { change: true });
    expect(b.r.halfStart).toBe(0);
    expect(Math.abs(pictureRoll(a.p, b.p, g1))).toBeLessThan(0.01);
  });
  it("its sense by continuity: the picture rolled + just before, a change of 175° the short way would roll it − : it rolls +", () => {
    const g0 = poseAt(87, 30, 0);
    let f = one(CARRIED_REST, g0);
    let g = g0;
    for (let i = 0; i < 4; i++) {
      const gn = yawed(g, 3);
      f = one(f.r.state, gn, { asked: askedTwist(g, gn, framedLine(gn, piece).dir, Y, 3 * DEG) });
      g = gn;
    }
    const before = f.p;
    const roll0 = twistAbout(g0, g, framedLine(g, piece).dir);
    expect(Math.sign(roll0)).not.toBe(0);
    const g1 = poseRolled(g, framedLine(g, piece), -Math.sign(roll0) * 175 * DEG);
    const b = one(f.r.state, g1, { change: true });
    expect(b.r.halfStart / DEG).toBeGreaterThan(180);
    expect(Math.sign(pictureRoll(before, b.p, g1))).toBe(Math.sign(roll0));
  });
});

describe("the carried up — C6: the push held from the same answer", () => {
  it("no half turn: nothing held; the dy that crossed: OP8's hold exactly; no dy and a dx pushing: the dx held on the glass", () => {
    expect(carriedHold(0, 1, 1)).toBeNull();
    expect(carriedHold(0, 0, -1)).toBeNull();
    expect(carriedHold(Math.PI, -1, 1)).toEqual({ sign: -1, back: 0 });
    expect(carriedHold(Math.PI, 0, 1)).toEqual({ sign: 1, back: 0, dir: [1, 0] });
    expect(carriedHold(Math.PI, 0, -1)).toEqual({ sign: 1, back: 0, dir: [-1, 0] });
    expect(carriedHold(Math.PI, 0, 0)).toBeNull();
  });
  it("the dx that pushes now: a dx its sign, a dy alone none, a still step unchanged", () => {
    expect(dxSignPushing(0, 3, 0)).toBe(1);
    expect(dxSignPushing(1, -2, 4)).toBe(-1);
    expect(dxSignPushing(1, 0, 2)).toBe(0);
    expect(dxSignPushing(-1, 0, 0)).toBe(-1);
  });
});
