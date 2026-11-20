// ⭐⭐⭐ (2026-11-19, `Claude/40_RENDER_SCENE/spec/UPRIGHT_ONE_POSE.md` §5.2, §12 — packet D, fix round 1) ONE POSE, pure (`upOne`): THE PICTURE = ITS
// TARGET + A GAP (F1) — the target followed exactly (the logic's own motion at a pole 1:1, upright exactly far out), the gap opened only by a logic change
// (the picture's last up carried to the new view), re-decided the shortest way at every change (A1), closed at one pace in one sense; a half turn = a
// gap of 90° or more at its opening, the gizmo held for the whole of it (F2); the fade (OP3); the square camera's complement (κ)
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, poseRolled } from "../src/input/roll_follow";
import { gravityTilt, ONE_REST, upOne, type OneKnobs, type OneState } from "../src/input/upright";
import { spitCameraHeading, spitCameraHeadingOne, spitHeading } from "../src/input/polar_zone";

const DEG = Math.PI / 180;
const DT = 1000 / 60;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const angle = (a: Vec3, b: Vec3): number =>
  Math.atan2(Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]), a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
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
const K: OneKnobs = { fromDeg: 15, fullDeg: 50, maxDegS: 720, halfHold: true };
/** one frame: the law, and the picture drawn */
const one = (s: OneState, g: CamPose, k = K, kappa = 1, change = false) => {
  const line = framedLine(g, piece);
  const r = upOne(s, g, line, DT, k, kappa, change);
  return { r, p: poseRolled(g, line, r.phi), line };
};
/** the logic's pose rolled rigidly about its framed line by `deg` */
const rolled = (g: CamPose, deg: number): CamPose => poseRolled(g, framedLine(g, piece), deg * DEG);

describe("one pose — the TARGET followed exactly (F1)", () => {
  it("near the vertical (w 0) the logic's own turn WITHOUT a change shows 1:1 — 40° then 50° in a frame (a yaw the finger asks at a pole): the picture IS the logic's pose", () => {
    let g = poseAt(87, 30, 0);
    let f = one(ONE_REST, g);
    for (const d of [40, 50, -35]) {
      g = rolled(g, d);
      f = one(f.r.state, g);
      expect(f.r.phi).toBe(0);
      expect(f.p).toBe(g);
      expect(f.r.halfStart).toBe(0);
    }
  });
  it("w 1 (60° off the vertical): the picture upright exactly every frame, the logic rolling ±30° a frame within 90° of upright — no pace", () => {
    let g = poseAt(30, 40, 50);
    let s: OneState = ONE_REST;
    for (const d of [0, -30, -30, 30, -30, 60]) {
      g = rolled(g, d);
      const f = one(s, g);
      s = f.r.state;
      expect(Math.abs(gravityTilt(f.p)!)).toBeLessThan(1e-6);
    }
  });
  it("a target sweeping 120° WITHOUT a change opens no half turn (a half turn opens only at a logic change): the picture follows, nothing held", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0);
    const b = one(a.r.state, rolled(g0, 120));
    expect(b.r.halfStart).toBe(0);
    expect(b.r.holding).toBe(false);
    expect(b.r.phi).toBe(0);
  });
  it("OP3: a logic pose 160° from upright is never blended toward upright; 80° from upright is righted whole at w 1", () => {
    const far = one(ONE_REST, poseAt(30, 40, 160));
    expect(Math.abs(gravityTilt(far.p)!)).toBeGreaterThan(150 * DEG);
    const near = one(ONE_REST, poseAt(30, 40, 80));
    expect(Math.abs(gravityTilt(near.p)!)).toBeLessThan(1e-6);
  });
  it("κ 0 (close in, the square camera's) 60° off the vertical: no target — φ exactly 0, the picture IS the logic's pose, whatever the logic turns", () => {
    let g = poseAt(30, 40, 50);
    let s: OneState = ONE_REST;
    for (const d of [40, -170, 95]) {
      g = rolled(g, d);
      const f = one(s, g, K, 0);
      s = f.r.state;
      expect(f.r.phi).toBe(0);
      expect(f.p).toBe(g);
    }
  });
});

describe("one pose — THE GAP and THE HALF TURN (F1, F2, A1)", () => {
  it("a 178° change near the vertical opens ONE half turn: its gap closes 12° a frame in one sense while the logic rolls on, the gizmo held for the WHOLE of it", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0);
    let g = rolled(g0, 178);
    let f = one(a.r.state, g, K, 1, true);
    expect(f.r.halfStart).toBeGreaterThan(177 * DEG);
    const sense = Math.sign(f.r.state.g!);
    let prev = Math.abs(f.r.state.g!);
    let frames = 1;
    let starts = 0;
    while (f.r.state.g !== 0 && frames < 40) {
      expect(f.r.holding, `frame ${frames}`).toBe(true);
      g = rolled(g, frames <= 5 ? 14 : 0);
      f = one(f.r.state, g);
      if (f.r.halfStart > 0) starts++;
      if (f.r.state.g !== 0) expect(Math.sign(f.r.state.g!)).toBe(sense);
      expect(Math.abs(f.r.state.g!)).toBeLessThan(prev);
      prev = Math.abs(f.r.state.g!);
      frames++;
    }
    expect(starts).toBe(0);
    expect(frames).toBe(15); // 178° at 12° a frame
    expect(f.r.holding).toBe(false);
    expect(f.p).toBe(g);
  });
  it("A1: the target jumping BACK mid-turn (a second change) re-decides the shortest way — 108° back, never 252° forward", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0);
    let g = rolled(g0, 170);
    let f = one(a.r.state, g, K, 1, true);
    for (let i = 0; i < 8; i++) f = one(f.r.state, g); // 108° turned (its opening frame closes too), 62° left
    g = rolled(g, -170);
    const back = one(f.r.state, g, K, 1, true);
    expect(back.r.halfStart).toBeGreaterThan(107 * DEG);
    expect(back.r.halfStart).toBeLessThan(109 * DEG);
    let s = back.r.state;
    let n = 1;
    while (s.g !== 0 && n < 40) {
      s = one(s, g).r.state;
      n++;
    }
    expect(n).toBe(9); // 108° at 12° a frame
  });
  it("close in (κ 0) a change applied at once: its gap opens and closes at the pace from its own frame (as law U at the square camera's share)", () => {
    const g0 = poseAt(30, 40, 0);
    const a = one(ONE_REST, g0, K, 0);
    const g1 = rolled(g0, 60);
    const b = one(a.r.state, g1, K, 0, true);
    expect(Math.abs(b.r.phi + 48 * DEG)).toBeLessThan(1e-9);
    expect(b.r.halfStart).toBe(0);
  });
  it("uprightMaxDegS 0: a change's gap closes at once, nothing held", () => {
    const g0 = poseAt(87, 30, 0);
    const k0 = { ...K, maxDegS: 0 };
    const a = one(ONE_REST, g0, k0);
    const g1 = rolled(g0, 120);
    const b = one(a.r.state, g1, k0, 1, true);
    expect(angle(b.p.up, g1.up)).toBeLessThan(1e-7);
    expect(b.r.holding).toBe(false);
  });
  it("uprightHalfHold 0: the same half turn never holds the gizmo", () => {
    const g0 = poseAt(87, 30, 0);
    const k = { ...K, halfHold: false };
    const a = one(ONE_REST, g0, k);
    const g1 = rolled(g0, 120);
    let f = one(a.r.state, g1, k, 1, true);
    expect(f.r.halfStart).toBeGreaterThan(0);
    for (let i = 0; i < 12; i++) {
      expect(f.r.holding).toBe(false);
      expect(f.r.state.half).toBeUndefined();
      f = one(f.r.state, g1, k);
    }
  });
});

describe("one pose — F3: the spit camera's heading at the pole, at its source (`spitCameraHeadingOne`)", () => {
  const ax: Vec3 = [1, 0, 0];
  const at = (nuDeg: number, th: number): Vec3 => [Math.sin(nuDeg * DEG) * Math.cos(th), Math.cos(nuDeg * DEG), Math.sin(nuDeg * DEG) * Math.sin(th)];
  const dev = (h: number, h0: number): number => Math.abs(Math.atan2(Math.sin(h - h0), Math.cos(h - h0)));
  it("3° from the vertical, the camera going round the pole: the side's own heading exactly (the formula alone swings over 9°)", () => {
    const h0 = spitHeading(ax, 1);
    let oldSwing = 0;
    for (let k = 0; k < 72; k++) {
      const u = at(3, (k * 5 * Math.PI) / 180);
      expect(dev(spitCameraHeadingOne(u, ax, 1), h0)).toBeLessThan(1e-12);
      oldSwing = Math.max(oldSwing, dev(spitCameraHeading(u, ax, 1), h0));
    }
    expect(oldSwing).toBeGreaterThan(9 * DEG);
  });
  it("from 12° the formula as before, bit for bit; between, never farther from the side's heading than the formula", () => {
    const h0 = spitHeading(ax, 1);
    for (let k = 0; k < 72; k++) {
      const th = (k * 5 * Math.PI) / 180;
      expect(spitCameraHeadingOne(at(20, th), ax, 1)).toBe(spitCameraHeading(at(20, th), ax, 1));
      expect(dev(spitCameraHeadingOne(at(8, th), ax, 1), h0)).toBeLessThanOrEqual(dev(spitCameraHeading(at(8, th), ax, 1), h0) + 1e-12);
    }
  });
  it("continuous as the view leaves the pole: the camera along the axis (the formula 35° off the side at 12°), never more than 0.5° a 0.05° of view", () => {
    let prev = spitCameraHeadingOne(at(3, 0), ax, 1);
    for (let nu = 3.05; nu <= 14; nu += 0.05) {
      const h = spitCameraHeadingOne(at(nu, 0), ax, 1);
      expect(dev(h, prev), `${nu.toFixed(2)}`).toBeLessThan(0.5 * DEG);
      prev = h;
    }
  });
});
