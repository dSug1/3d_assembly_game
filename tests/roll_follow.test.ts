// ⭐⭐⭐ (2026-11-18, FAST_ORBIT.md §12, FO3 S0) the picture a follower of the logic — its pure parts (`src/input/roll_follow.ts`)
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, GAP_ZERO, gapStep, onGlass, poseAxes, poseRolled, ROLL_LINE_MIN_M, twistAbout, type RollGap } from "../src/input/roll_follow";

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
const dot = (a: Vec3, b: Vec3): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0]!, a[1]!, a[2]!);
  return [a[0]! / l, a[1]! / l, a[2]! / l];
};
/** a pose turned rigidly by `th` about the axis `k` through `c` */
const turnPose = (p: CamPose, c: Vec3, k: Vec3, th: number): CamPose => ({
  eye: add(c, rotateAbout(sub(p.eye, c), k, th)),
  look: add(c, rotateAbout(sub(p.look, c), k, th)),
  up: rotateAbout(p.up, k, th),
});
/** a point in the camera's own coordinates */
const inCam = (p: CamPose, x: Vec3): Vec3 => {
  const [f, u, s] = poseAxes(p);
  const d = sub(x, p.eye);
  return [dot(d, f), dot(d, u), dot(d, s)];
};

// far out: the camera 1.6 m from the look point (the assembly's centre), the piece off the centre on the glass, the up tilted
const piece: Vec3 = [0.21, 0.32, 0.18];
const ghost: CamPose = { eye: [1.1, 0.9, 1.3], look: [0, 0.229, 0.191], up: unit([0.1, 1, -0.2]) };

/** ⛔ (2026-11-22, R6) the roll follower (`followStep`, `gapTake`) deleted with FO3 S1's path: the gap's ease (`gapStep`, kept — the piece's shown
 *  direction's rest, `asmDirEase.own`) run from a gap of `-51°` at frame 0 (what the follower took then), `n` frames at `hz` a second (deg) */
function run(n: number, hz: number, ms = 200): number[] {
  let g: RollGap = { gap: -51 * DEG, speed: 0 };
  const out: number[] = [g.gap / DEG];
  for (let i = 1; i < n; i++) {
    g = gapStep(g, 1000 / hz, ms);
    out.push(g.gap / DEG);
  }
  return out;
}

describe("the framed line (O4)", () => {
  it("goes through the piece and the look point, pointing away from the eye", () => {
    const l = framedLine(ghost, piece);
    expect(l.at).toEqual(piece);
    expect(l.throughLook).toBe(true);
    const d = unit(sub(piece, ghost.look));
    expect(Math.abs(Math.abs(dot(l.dir, d)) - 1)).toBeLessThan(1e-12);
    expect(dot(l.dir, sub(ghost.look, ghost.eye))).toBeGreaterThan(0);
  });
  it("the two closer than the stated few mm: the view's own direction through the piece", () => {
    const near: Vec3 = add(ghost.look, [ROLL_LINE_MIN_M * 0.5, 0, 0]);
    const l = framedLine(ghost, near);
    expect(l.throughLook).toBe(false);
    expect(dot(l.dir, unit(sub(ghost.look, ghost.eye)))).toBeCloseTo(1, 12);
  });
});

describe("the picture: the ghost turned about the framed line", () => {
  it("the piece and the look point keep their places in the camera's own coordinates, whatever the gap", () => {
    const l = framedLine(ghost, piece);
    const p0 = inCam(ghost, piece);
    const l0 = inCam(ghost, ghost.look);
    for (const g of [1, -7, 33, 89, -150, 179]) {
      const pic = poseRolled(ghost, l, g * DEG);
      const p1 = inCam(pic, piece);
      const l1 = inCam(pic, pic.look);
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(p1[i]! - p0[i]!)).toBeLessThan(1e-12);
        expect(Math.abs(l1[i]! - l0[i]!)).toBeLessThan(1e-12);
      }
      // and on the glass
      const a = onGlass(ghost, piece, 0.8, 2.07);
      const b = onGlass(pic, piece, 0.8, 2.07);
      expect(Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!)).toBeLessThan(1e-9);
      // the eye did move (a real roll)
      expect(Math.hypot(...sub(pic.eye, ghost.eye))).toBeGreaterThan(1e-4);
    }
  });
  it("gap 0 gives the pose itself, bit for bit", () => {
    expect(poseRolled(ghost, framedLine(ghost, piece), 0)).toBe(ghost);
  });
});

describe("the ghost's twist (swing and twist)", () => {
  it("a turn of the camera about the line reads as that twist, signed", () => {
    const l = framedLine(ghost, piece);
    for (const a of [5, -20, 51, -89, 135]) {
      const g2 = poseRolled(ghost, l, a * DEG);
      expect(twistAbout(ghost, g2, framedLine(g2, piece).dir) / DEG).toBeCloseTo(a, 9);
    }
  });
  it("the orbit itself (the line swung, no turn about it) reads as no twist", () => {
    const l = framedLine(ghost, piece);
    // a swing: the whole pose turned about an axis square to the line, through the piece
    const k = unit([l.dir[1], -l.dir[0], 0]);
    const g2 = turnPose(ghost, piece, k, 25 * DEG);
    expect(Math.abs(twistAbout(ghost, g2, framedLine(g2, piece).dir))).toBeLessThan(1e-9);
  });
  it("a swing and a twist together: the twist alone", () => {
    const l = framedLine(ghost, piece);
    const k = unit([l.dir[1], -l.dir[0], 0]);
    const g1 = turnPose(ghost, piece, k, 25 * DEG);
    const l1 = framedLine(g1, piece);
    const g2 = poseRolled(g1, l1, -37 * DEG);
    expect(twistAbout(ghost, g2, framedLine(g2, piece).dir) / DEG).toBeCloseTo(-37, 9);
  });
  it("the line sliding on the glass (the look point trailing): rolled back by its twist, the picture keeps no turn about the line", () => {
    for (const th of [0.1, 0.5, 1.0]) {
      const k = unit([0.267, 0.534, 0.802]);
      const g1 = turnPose(ghost, piece, k, th);
      const g2: CamPose = { eye: g1.eye, look: add(g1.look, [0.12, -0.05, 0.03]), up: g1.up };
      const l2 = framedLine(g2, piece);
      const tw = twistAbout(ghost, g2, l2.dir);
      expect(Math.abs(tw)).toBeGreaterThan(0.5 * DEG);
      const pic = poseRolled(g2, l2, -tw);
      expect(Math.abs(twistAbout(ghost, pic, l2.dir))).toBeLessThan(1e-9);
    }
  });
  it("the short way: a turn of 350° reads as −10°", () => {
    const l = framedLine(ghost, piece);
    const g2 = poseRolled(ghost, l, 350 * DEG);
    expect(twistAbout(ghost, g2, framedLine(g2, piece).dir) / DEG).toBeCloseTo(-10, 9);
  });
});

describe("the gap: the critically damped follower (rollFollowMs 200)", () => {
  it("a change of 51° is within 5° after 0.39 s, within 1° after 0.58 s, at 188° a second at most, and never overshoots", () => {
    const g = run(120, 60);
    // the picture holds on the change's frame: the gap is the whole change
    expect(g[0]!).toBeCloseTo(-51, 9);
    const at = (s: number): number => g[Math.round(s * 60) - 1 + 1]!;
    expect(Math.abs(at(0.4))).toBeLessThan(5); // §12.4: within 5° after about 0.39 s
    expect(Math.abs(at(0.3))).toBeGreaterThan(8);
    expect(Math.abs(at(0.58))).toBeLessThan(1.1);
    let peak = 0;
    for (let i = 1; i < g.length; i++) {
      expect(g[i]!).toBeLessThanOrEqual(0); // never past 0
      expect(Math.abs(g[i]!)).toBeLessThanOrEqual(Math.abs(g[i - 1]!) + 1e-12);
      peak = Math.max(peak, (Math.abs(g[i]! - g[i - 1]!) * 60));
    }
    expect(peak).toBeLessThan(188);
    expect(peak).toBeGreaterThan(170);
  });
  it("at rest the ghost: exactly 0 within 1.5 s (R5), and 0 stays 0", () => {
    const g = run(91, 60);
    expect(g[90]!).toBe(0);
    expect(gapStep(GAP_ZERO, 16.7, 200)).toBe(GAP_ZERO);
    // a gap closing on its own: exactly 0 too
    let k: RollGap = { gap: 51 * DEG, speed: 0 };
    for (let i = 0; i < 90; i++) k = gapStep(k, 1000 / 60, 200);
    expect(k).toBe(GAP_ZERO);
  });
  it("the same picture at 60 and at 143 frames a second (the closed form: exact over any step)", () => {
    const g60 = run(61, 60);
    const g143 = run(144, 143);
    expect(Math.abs(g60[60]! - g143[143]!)).toBeLessThan(1e-9); // both at 1 s
    const h60 = run(12, 60); // 0.2 s
    const h143 = run(143, 143);
    // the change at t 0 in both: 0.2 s after it is frame 12 at 60 and frame 28.6 at 143 — read at 1 s instead, and at 0.2 s by the closed form
    expect(h60[11]!).toBeCloseTo(-51 * (1 + 10 * (11 / 60)) * Math.exp(-10 * (11 / 60)), 9);
    expect(h143[28]!).toBeCloseTo(-51 * (1 + 10 * (28 / 143)) * Math.exp(-10 * (28 / 143)), 9);
  });
  // ⛔ (2026-11-22, R6) the follower's own vectors (a twist and its undo, the rounding taken at rest, `gapTake`'s short way, SKIP / ZERO) deleted with it
});
