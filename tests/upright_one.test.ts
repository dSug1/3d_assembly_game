// ⭐⭐⭐ (2026-11-19, `Claude/40_RENDER_SCENE/spec/UPRIGHT_ONE_POSE.md` §5.2 — packet D) ONE POSE, pure (`upOne`): the carry whole far out (OP4), the
// target faded out from 90° to 150° (OP3), the half turn opened at a rest of 90° or more, its sense kept between changes and RE-DECIDED at a change (OP5,
// the lead's A1), the dead band near the vertical far out (OP6), the square camera's complement (κ), the gizmo held while 90° or more is left (OP7)
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, poseRolled } from "../src/input/roll_follow";
import { gravityTilt, ONE_REST, UPRIGHT_DEAD_DEG, upOne, type OneKnobs, type OneState } from "../src/input/upright";

const DEG = Math.PI / 180;
const DT = 1000 / 60;
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
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
const K: OneKnobs = { fromDeg: 15, fullDeg: 50, maxDegS: 720, deadDeg: 0, halfHold: true };
/** one frame: the law, and the picture drawn */
const one = (s: OneState, g: CamPose, k = K, kappa = 1, change = false) => {
  const line = framedLine(g, piece);
  const r = upOne(s, g, line, DT, k, kappa, change);
  return { r, p: poseRolled(g, line, r.phi), line };
};
/** the logic's pose rolled rigidly about its framed line by `deg` */
const rolled = (g: CamPose, deg: number): CamPose => poseRolled(g, framedLine(g, piece), deg * DEG);

describe("one pose — the carry and the target (OP3, OP4)", () => {
  it("OP4: near the vertical far out (w 0, κ 1) a 40° turn of the logic in one frame, no change, rolls the picture by the pace at most (12° at 720° a second)", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0);
    const g1 = rolled(g0, 40);
    const b = one(a.r.state, g1);
    expect(angle(a.p.up, b.p.up)).toBeLessThan(12.001 * DEG);
    expect(angle(a.p.up, b.p.up)).toBeGreaterThan(11.9 * DEG);
    // …and the picture then reaches the logic's pose at the pace: 40° in 4 frames, the logic's pose itself at rest
    let s = b.r.state;
    let p = b.p;
    for (let i = 0; i < 3; i++) ({ r: { state: s }, p } = one(s, g1));
    expect(angle(p.up, g1.up)).toBeLessThan(1e-7);
  });
  it("w 1 (60° off the vertical): the picture upright exactly, and a rigid roll of the logic (±30° a frame, within 90° of upright) leaves it upright — the IDEAL far out", () => {
    let g = poseAt(30, 40, 50);
    let s: OneState = ONE_REST;
    for (let i = 0; i < 10; i++) ({ r: { state: s } } = one(s, g));
    for (const d of [-30, -30, 30, -30, 60]) {
      g = rolled(g, d);
      const f = one(s, g);
      s = f.r.state;
      expect(Math.abs(gravityTilt(f.p)!)).toBeLessThan(1e-6);
    }
  });
  it("OP3: a logic pose 160° from upright is never blended toward upright (its half turn waits for a change); 80° from upright is righted whole at w 1", () => {
    const k0 = { ...K, maxDegS: 0 };
    const far = one(ONE_REST, poseAt(30, 40, 160), k0);
    expect(Math.abs(gravityTilt(far.p)!)).toBeGreaterThan(150 * DEG);
    const near = one(ONE_REST, poseAt(30, 40, 80), k0);
    expect(Math.abs(gravityTilt(near.p)!)).toBeLessThan(1e-6);
  });
  it("κ 0 (close in, the square camera's): φ exactly 0, the picture IS the logic's pose (the same object), whatever the logic turns", () => {
    let g = poseAt(87, 30, 0);
    let s: OneState = ONE_REST;
    for (const d of [40, -170, 95, 5]) {
      g = rolled(g, d);
      const f = one(s, g, K, 0);
      s = f.r.state;
      expect(f.r.phi).toBe(0);
      expect(f.p).toBe(g);
    }
  });
  it("uprightMaxDegS 0: at once — a change of 120° closes in its frame, nothing held", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0, { ...K, maxDegS: 0 });
    const g1 = rolled(g0, 120);
    const b = one(a.r.state, g1, { ...K, maxDegS: 0 }, 1, true);
    expect(angle(b.p.up, g1.up)).toBeLessThan(1e-7);
    expect(b.r.holding).toBe(false);
    expect(b.r.state.s).toBeUndefined();
  });
});

describe("one pose — THE HALF TURN (OP5, OP7; the lead's A1)", () => {
  it("a 178° change near the vertical opens ONE half turn (halfStart once), held while 90° or more is left; the logic rolling on past ±180° never reverses it", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0);
    let g = rolled(g0, 178);
    const b = one(a.r.state, g, K, 1, true);
    expect(b.r.halfStart).toBeGreaterThan(177 * DEG);
    expect(b.r.holding).toBe(true);
    let s = b.r.state;
    let phi = b.r.phi;
    let starts = 0;
    let closedAt = -1;
    for (let i = 1; i < 40 && closedAt < 0; i++) {
      const tau = i <= 5 ? 14 : 0; // the logic rolls on 14° a frame for 5 frames (faster than the pace), then stands
      g = rolled(g, tau);
      const f = one(s, g);
      const step = wrap(f.r.phi - phi + tau * DEG);
      expect(step, `frame ${i}`).toBeGreaterThan(-1e-9); // one sense to its end
      if (f.r.halfStart > 0) starts++;
      s = f.r.state;
      phi = f.r.phi;
      if (s.s === undefined) closedAt = i;
    }
    expect(starts).toBe(0);
    expect(closedAt).toBeGreaterThan(0);
  });
  it("A1: the target jumping BACK mid-turn (a second change) re-decides the shortest way — 108° back, never 252° forward", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0);
    let g = rolled(g0, 170);
    let f = one(a.r.state, g, K, 1, true);
    for (let i = 0; i < 8; i++) f = one(f.r.state, g); // 108° turned (its opening frame steps too), 62° left
    const phi0 = f.r.phi;
    g = rolled(g, -170);
    const back = one(f.r.state, g, K, 1, true);
    const step = wrap(back.r.phi - phi0 - 170 * DEG);
    expect(step).toBeLessThan(0);
    expect(back.r.halfStart).toBeGreaterThan(107 * DEG);
    expect(back.r.halfStart).toBeLessThan(109 * DEG);
    let s = back.r.state;
    let n = 1;
    while (s.s !== undefined && n < 40) {
      s = one(s, g).r.state;
      n++;
    }
    expect(n).toBe(9); // 108° at 12° a frame
  });
  it("a rest of 90° or more with no change (the logic's own 120° turn): a half turn too — held until under 90° is left, then on to its end; no second start", () => {
    const g0 = poseAt(87, 30, 0);
    const a = one(ONE_REST, g0);
    const g1 = rolled(g0, 120);
    const seen: boolean[] = [];
    let f = one(a.r.state, g1);
    expect(f.r.halfStart).toBeGreaterThan(119 * DEG);
    let starts = 1;
    seen.push(f.r.holding);
    while (f.r.state.s !== undefined) {
      expect(f.r.state.s).toBe(f.r.state.s); // under way: the sense recorded
      f = one(f.r.state, g1);
      if (f.r.halfStart > 0) starts++;
      seen.push(f.r.holding);
    }
    expect(starts).toBe(1);
    expect(seen.slice(0, 3)).toEqual([true, true, false]); // 108°, 96° left: held; 84° left: free
    expect(seen.length).toBe(10); // 120° at 12° a frame
    expect(angle(f.p.up, g1.up)).toBeLessThan(1e-7);
  });
  it("uprightHalfHold 0: the same half turn never holds the gizmo", () => {
    const g0 = poseAt(87, 30, 0);
    const k = { ...K, halfHold: false };
    const a = one(ONE_REST, g0, k);
    let f = one(a.r.state, rolled(g0, 120), k);
    expect(f.r.halfStart).toBeGreaterThan(0);
    for (let i = 0; i < 12; i++) {
      expect(f.r.holding).toBe(false);
      expect(f.r.state.half).toBeUndefined();
      f = one(f.r.state, rolled(g0, 120), k);
    }
  });
});

describe("one pose — THE DEAD BAND (OP6, T11)", () => {
  it("its default 10°; far out within uprightFromDeg of the vertical a ±8° wobble of the logic moves the picture by nothing", () => {
    expect(UPRIGHT_DEAD_DEG).toBe(10);
    const k = { ...K, deadDeg: 10 };
    let g = poseAt(85, 30, 0);
    let f = one(ONE_REST, g, k);
    for (const d of [8, -16, 16, -16, 8]) {
      g = rolled(g, d);
      const n = one(f.r.state, g, k);
      expect(angle(f.p.up, n.p.up)).toBeLessThan(1e-7);
      f = n;
    }
  });
  it("no band beyond uprightFromDeg (30° from the vertical), nor close in (κ 0.5): the same wobble moves the picture", () => {
    const k = { ...K, deadDeg: 10 };
    for (const [el, kappa] of [[60, 1], [85, 0.5]] as const) {
      let g = poseAt(el, 30, 0);
      let f = one(ONE_REST, g, k, kappa);
      for (let i = 0; i < 6; i++) f = one(f.r.state, g, k, kappa);
      g = rolled(g, 8);
      const n = one(f.r.state, g, k, kappa);
      expect(angle(f.p.up, n.p.up), `el ${el} κ ${kappa}`).toBeGreaterThan(0.5 * DEG);
      // …and close in no rest is left standing: the picture reaches the logic's pose (the live build's path)
      if (kappa < 1) {
        let m = n;
        for (let i = 0; i < 3; i++) m = one(m.r.state, g, k, kappa);
        expect(angle(m.p.up, g.up)).toBeLessThan(1e-7);
      }
    }
  });
});
