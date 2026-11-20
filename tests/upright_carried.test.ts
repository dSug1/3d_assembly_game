// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/UPRIGHT_CARRIED_UP.md` §4.2 — packet E) ONE CARRIED UP, pure (`upCarried`, `askedTwist`, `carriedHold`,
// `dxSignPushing`): the picture turns about the framed line only by what the finger asks (C1, C2); its target reached only by the finger — a dx (half its
// yaw at most) and the dy that leaves the vertical (E-D6), never by time (C4, fix round 1); the ONE half turn at a logic change, its sense by continuity (C5); the push held from the same answer — the dy as OP8, a dx only
// when a half turn opened (C6); close in the logic's pose. Each vector red on a named mutant (the kit's `fo3/rebuild_e/mut_carried.json`).
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dxSignPushing, rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, poseRolled, twistAbout } from "../src/input/roll_follow";
import { askedTwist, CARRIED_REST, carriedHold, upCarried, uprightAngle, uprightWeight, viewFromVertical, type CarriedKnobs, type CarriedState } from "../src/input/upright";

const DEG = Math.PI / 180;
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
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
const K: CarriedKnobs = { fromDeg: 15, fullDeg: 50, maxDegS: 720, alignPerYaw: 0.5, halfHold: true };
/** one frame: the law, and the picture drawn */
const one = (s: CarriedState, g: CamPose, opt: { kappa?: number; change?: boolean; asked?: number; dYaw?: number; k?: CarriedKnobs } = {}) => {
  const line = framedLine(g, piece);
  const r = upCarried(s, g, line, DT, opt.k ?? K, opt.kappa ?? 1, opt.change ?? false, opt.asked ?? 0, opt.dYaw ?? 0);
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

describe("the carried up — C4: the alignment is PAID by the finger alone (fix round 1: E-D6, F-E4)", () => {
  it("a dx at a pole, the picture 34° off its target: it turns 10° toward it on a 20° yaw (half the yaw) — never against the turn asked", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one({ phi: 0.6 }, g0);
    expect(a.r.phi).toBe(0.6);
    const g1 = yawed(g0, 20);
    const asked = askedTwist(g0, g1, framedLine(g1, piece).dir, Y, 20 * DEG);
    const b = one(a.r.state, g1, { asked, dYaw: 20 * DEG });
    expect((a.r.phi - b.r.phi) / DEG).toBeCloseTo(10, 3);
    const own = twistAbout(g0, g1, framedLine(g1, piece).dir) / DEG;
    const ratio = pictureRoll(a.p, b.p, g1) / own;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(1.55);
  });
  it("THE DY THAT LEAVES pays (E-D6): out of the band from w0 to w1 the gap closes by (w1 − w0) / (1 − w0); back toward the vertical, or still: nothing", () => {
    const k = { ...K, maxDegS: 0 };
    const g0 = poseAt(60, 30, 40);
    const g1 = poseAt(50, 30, 40);
    const a = one(CARRIED_REST, g0, { k });
    expect(a.r.phi).toBe(0);
    const l1 = framedLine(g1, piece);
    const w0 = uprightWeight(viewFromVertical(g0), 15, 50);
    const w1 = uprightWeight(viewFromVertical(g1), 15, 50);
    const f = (w1 - w0) / (1 - w0);
    expect(f).toBeGreaterThan(0.5);
    const pc = wrapPi(a.r.phi - twistAbout(g0, g1, l1.dir));
    const t1 = w1 * uprightAngle(g1, l1)!;
    const b = one(a.r.state, g1, { k });
    expect(b.r.phi).toBeCloseTo(pc + f * (t1 - pc), 6);
    const c = one(b.r.state, g0, { k });
    expect(c.r.phi).toBeCloseTo(wrapPi(b.r.phi - twistAbout(g1, g0, framedLine(g0, piece).dir)), 9);
    const d = one(c.r.state, g0, { k });
    expect(d.r.phi).toBeCloseTo(c.r.phi, 12);
  });
  it("beyond the band NEVER by time: no finger, the picture stays off upright; the view still leaving pays the rest, at most 12° a frame (720° a second)", () => {
    const g = poseAt(10, 30, 30);
    const a = one(CARRIED_REST, g);
    expect(a.r.phi).toBe(0);
    const b = one(a.r.state, g);
    expect(b.r.phi).toBe(0);
    const g2 = poseAt(5, 30, 30);
    const l2 = framedLine(g2, piece);
    const pc = wrapPi(b.r.phi - twistAbout(g, g2, l2.dir));
    expect(Math.abs(uprightAngle(g2, l2)! - pc) / DEG).toBeGreaterThan(20);
    const c = one(b.r.state, g2);
    expect(Math.abs(c.r.phi - pc) / DEG).toBeCloseTo(12, 3);
    const g3 = poseAt(15, 30, 30);
    const d = one(c.r.state, g3);
    expect(d.r.phi).toBeCloseTo(wrapPi(c.r.phi - twistAbout(g2, g3, framedLine(g3, piece).dir)), 9);
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

describe("the carried up — C5: a change during a half turn re-decides it", () => {
  it("a change that brings the target within 60° of the picture ENDS the half turn: the picture stops turning", () => {
    const g0 = poseAt(87, 30, 0);
    let f = one(CARRIED_REST, g0);
    const g1 = poseRolled(g0, framedLine(g0, piece), 170 * DEG);
    f = one(f.r.state, g1, { change: true });
    f = one(f.r.state, g1);
    expect(f.r.state.hs).toBe(true);
    // the logic jumps back near where the picture is now (a level face's entry): the rest is under 90°
    const left = (f.r.state.g ?? 0) / DEG;
    const g2 = poseRolled(g1, framedLine(g1, piece), -(left - 40) * DEG);
    const a = one(f.r.state, g2, { change: true });
    expect(a.r.state.hs).not.toBe(true);
    const b = one(a.r.state, g2);
    expect(Math.abs(pictureRoll(a.p, b.p, g2))).toBeLessThan(0.01);
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
