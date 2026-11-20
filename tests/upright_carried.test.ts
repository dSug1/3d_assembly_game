// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/UPRIGHT_CARRIED_UP.md` §4.2 — packet E) ONE CARRIED UP, pure (`upCarried`, `askedTwist`, `carriedHold`,
// `dxSignPushing`): the picture turns about the framed line only by what the finger asks (C1, C2); its target reached only by a dx near the vertical, by
// time far out (C4); the ONE half turn at a logic change, its sense by continuity (C5); the push held from the same answer — the dy as OP8, a dx only
// when a half turn opened (C6); close in the logic's pose. Each vector red on a named mutant (the kit's `fo3/rebuild_e/mut_carried.json`).
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dxSignPushing, rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, poseRolled, twistAbout } from "../src/input/roll_follow";
import { askedTwist, CARRIED_REST, carriedHold, dxPays, leaveShare, upCarried, uprightAngle, viewFromVertical, type CarriedKnobs, type CarriedState } from "../src/input/upright";

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
const one = (s: CarriedState, g: CamPose, opt: { kappa?: number; change?: boolean; asked?: number; dxMm?: number; dxYaw?: number; moved?: boolean; k?: CarriedKnobs } = {}) => {
  const line = framedLine(g, piece);
  const r = upCarried(s, g, line, DT, opt.k ?? K, opt.kappa ?? 1, opt.change ?? false, opt.asked ?? 0, opt.dxMm ?? 0, opt.dxYaw ?? 0, opt.moved ?? false);
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

// ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` §9 — packet K) THE PAYERS (`uprightPayers` 1): K1 a dx by k × its OWN yaw, K2 the dy leaving the pole toward upright in
// proportion to the view's outward travel while the finger moves, K3 nothing by time; the whole at most the one pace. The vectors above run with the payers
// off (`K` has none): the first build's C4, `461eeb2`. Mutants: the kit's `fo3/rebuild_e/mut_k.json`.
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const KP: CarriedKnobs = { ...K, payers: true, alignPerYaw: 0.5 };
const K0: CarriedKnobs = { ...KP, maxDegS: 0 };
describe("the carried up — packet K: a change while the alignment is paid (the owner: what happens when the gizmo crosses another edge then)", () => {
  it("(a) a dx paying when a change under 90° arrives: the payment goes on toward the NEW target from where the picture is — no jump, nothing undone", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one({ phi: 1.2 }, g0, { k: KP });
    const g1 = poseRolled(g0, framedLine(g0, piece), 20 * DEG);
    const b = one(a.r.state, g1, { k: KP, change: true, dxYaw: 20 * DEG, moved: true });
    expect(b.r.halfStart).toBe(0);
    expect(pictureRoll(a.p, b.p, g1)).toBeCloseTo(-10, 3);
    const c = one(b.r.state, g1, { k: KP, dxYaw: 20 * DEG, moved: true });
    expect((c.r.phi - b.r.phi) / DEG).toBeCloseTo(-10, 6);
  });
  it("(b) a change whose new gap is 90° or more: the half turn opens there, at its pace — the dx's payment paused until it closes", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(CARRIED_REST, g0, { k: KP });
    const g1 = poseRolled(g0, framedLine(g0, piece), 170 * DEG);
    const pc = wrapPi(a.r.phi - twistAbout(g0, g1, framedLine(g1, piece).dir));
    const b = one(a.r.state, g1, { k: KP, change: true, dxYaw: 20 * DEG, moved: true });
    expect(b.r.halfStart / DEG).toBeCloseTo(170, 3);
    expect(Math.abs(wrapPi(b.r.phi - pc)) / DEG).toBeCloseTo(12, 6);
    const c = one(b.r.state, g1, { k: KP, dxYaw: 20 * DEG, moved: true });
    expect(c.r.state.hs).toBe(true);
    expect(Math.abs(wrapPi(c.r.phi - b.r.phi)) / DEG).toBeCloseTo(12, 6);
  });
  it("(c) a change during a half turn re-decides it: 120° left the SHORT way (not by the turn's own roll); under 90° it ends", () => {
    const g0 = poseAt(87, 30, 0);
    let f = one(CARRIED_REST, g0, { k: KP });
    const g1 = poseRolled(g0, framedLine(g0, piece), 170 * DEG);
    f = one(f.r.state, g1, { k: KP, change: true });
    f = one(f.r.state, g1, { k: KP });
    expect(f.r.state.hs).toBe(true);
    // the turn rolls the picture + (its own roll, `rr`); the new gap's short way is − : taken the short way, not the turn's
    expect(f.r.state.rr ?? 0).toBeGreaterThan(0);
    const th = f.r.phi - 120 * DEG;
    const g2 = poseRolled(g1, framedLine(g1, piece), th);
    const r = one(f.r.state, g2, { k: KP, change: true });
    expect(r.r.halfStart / DEG).toBeCloseTo(120, 3);
    const g3 = poseRolled(g1, framedLine(g1, piece), f.r.phi - 40 * DEG);
    const e = one(f.r.state, g3, { k: KP, change: true });
    expect(e.r.halfStart).toBe(0);
    expect(e.r.state.hs).not.toBe(true);
  });
});

describe("the carried up — packet K: the alignment's payers", () => {
  it("K1 what a dx pays: k × its own yaw, at most the one pace (12° a frame at 720° a second)", () => {
    const cap = 12 * DEG;
    expect(dxPays(20 * DEG, 0.5, cap) / DEG).toBeCloseTo(10, 9);
    expect(dxPays(-20 * DEG, 0.5, cap) / DEG).toBeCloseTo(10, 9);
    expect(dxPays(60 * DEG, 0.5, cap) / DEG).toBeCloseTo(12, 9);
  });
  it("K1 near the pole: a DY swinging the orbit's yaw pays nothing; the finger's own dx of 20° of yaw pays 10° toward the target; 60°: the pace, 12°", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one({ phi: 0.6 }, g0, { k: KP });
    const g1 = yawed(g0, 20);
    const asked = askedTwist(g0, g1, framedLine(g1, piece).dir, Y, 20 * DEG);
    const pc = wrapPi(0.6 - (twistAbout(g0, g1, framedLine(g1, piece).dir) - asked));
    const dy = one(a.r.state, g1, { k: KP, asked, moved: true });
    expect(dy.r.phi).toBeCloseTo(pc, 9);
    const dx = one(a.r.state, g1, { k: KP, asked, dxYaw: 20 * DEG, moved: true });
    expect((pc - dx.r.phi) / DEG).toBeCloseTo(10, 6);
    const fast = one(a.r.state, g1, { k: KP, asked, dxYaw: 60 * DEG, moved: true });
    expect((pc - fast.r.phi) / DEG).toBeCloseTo(12, 6);
  });
  it("K3 far out a still finger pays nothing (never by time), a view drifting out with no finger neither", () => {
    const g = poseAt(10, 30, 30);
    const a = one(CARRIED_REST, g, { k: KP });
    const b = one(a.r.state, g, { k: KP });
    expect(b.r.phi).toBe(0);
    const g2 = poseAt(8, 30, 30);
    const c = one(b.r.state, g2, { k: KP });
    expect(c.r.phi).toBeCloseTo(wrapPi(b.r.phi - twistAbout(g, g2, framedLine(g2, piece).dir)), 9);
  });
  it("K2 the dy leaving the pole pays TOWARD UPRIGHT its share of the way across the band (30° → 40° of 15 – 50°: a half), at most the pace; still or back toward the pole nothing", () => {
    const g0 = poseAt(60, 30, 40);
    const g1 = poseAt(50, 30, 40);
    const a = one(CARRIED_REST, g0, { k: K0 });
    const l1 = framedLine(g1, piece);
    const pc = wrapPi(a.r.phi - twistAbout(g0, g1, l1.dir));
    const al = uprightAngle(g1, l1)!;
    expect(leaveShare(40 * DEG, 30 * DEG, 15, 50, true)).toBeCloseTo(0.5, 9);
    const f = leaveShare(viewFromVertical(g1), viewFromVertical(g0), 15, 50, true);
    expect(f).toBeGreaterThan(0.45);
    const b = one(a.r.state, g1, { k: K0, moved: true });
    expect(b.r.phi).toBeCloseTo(pc + f * wrapPi(al - pc), 6);
    const still = one(a.r.state, g1, { k: K0 });
    expect(still.r.phi).toBeCloseTo(pc, 9);
    expect(Math.abs(f * wrapPi(al - pc)) / DEG).toBeGreaterThan(15);
    const paced = one(a.r.state, g1, { k: KP, moved: true });
    expect(Math.abs(paced.r.phi - pc) / DEG).toBeCloseTo(12, 6);
    const c = one(b.r.state, g0, { k: K0, moved: true });
    expect(c.r.phi).toBeCloseTo(wrapPi(b.r.phi - twistAbout(g1, g0, framedLine(g0, piece).dir)), 9);
  });
  it("K2 beyond the band: a rest paid in proportion to the outward travel (70° → 80°: half the way left to level); inward nothing", () => {
    expect(leaveShare(80 * DEG, 70 * DEG, 15, 50, true)).toBeCloseTo(0.5, 9);
    expect(leaveShare(75 * DEG, 80 * DEG, 15, 50, true)).toBe(0);
    expect(leaveShare(70.1 * DEG, 70 * DEG, 15, 50, true)).toBeLessThan(0.01);
    expect(leaveShare(12 * DEG, 5 * DEG, 15, 50, true)).toBe(0);
    const g0 = poseAt(20, 30, 50);
    const g1 = poseAt(10, 30, 50);
    const a = one({ phi: 0 }, g0, { k: K0 });
    const l1 = framedLine(g1, piece);
    const pc = wrapPi(a.r.phi - twistAbout(g0, g1, l1.dir));
    const f = leaveShare(viewFromVertical(g1), viewFromVertical(g0), 15, 50, true);
    expect(f).toBeGreaterThan(0.45);
    const b = one(a.r.state, g1, { k: K0, moved: true });
    expect(b.r.phi).toBeCloseTo(pc + f * wrapPi(uprightAngle(g1, l1)! - pc), 6);
  });
  it("K2 near 180° the way the picture rolled last (no flip-flop): 170° short way +, the picture rolling − : it pays −", () => {
    const g0 = poseAt(60, 30, 0);
    const g1 = poseAt(50, 30, 0);
    const l1 = framedLine(g1, piece);
    const tw = twistAbout(g0, g1, l1.dir);
    const al = uprightAngle(g1, l1)!;
    const a = one({ phi: wrapPi(al - 170 * DEG + tw), rr: -0.1 }, g0, { k: K0 });
    const pc = wrapPi(a.r.phi - tw);
    expect(wrapPi(al - pc) / DEG).toBeCloseTo(170, 6);
    const f = leaveShare(viewFromVertical(g1), viewFromVertical(g0), 15, 50, true);
    const b = one(a.r.state, g1, { k: K0, moved: true });
    expect(wrapPi(b.r.phi - pc) / DEG).toBeCloseTo(-f * 190, 4);
    expect(wrapPi(b.r.phi - pc)).toBeLessThan(-1.2);
  });
});
