// ⭐⭐⭐ (2026-11-18, UPRIGHT_PICTURE.md §2 step 2 — U0) law U, pure: gravity on the glass's vertical at w = 1 whatever the logic's own roll, the piece
// and the look point unmoved on the glass, the logic's pose bit for bit at the vertical, φ continuous through the band and across α = ±180°, the cap exact at
// w = 1, the same at 60 and 143 frames a second, the no-root case held
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, onGlass, poseRolled, twistAbout } from "../src/input/roll_follow";
import { gravityTilt, UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG, UPRIGHT_MAX_DEG_S, UPRIGHT_REST, changeSeen, changeWeight, lawHalfTurn, uprightAngle, uprightStep, uprightWeight, viewFromVertical, type UprightKnobs, type UprightState } from "../src/input/upright";

const DEG = Math.PI / 180;
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
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
// ⭐ the law's vectors below are written on the band 5 – 25° (their fixtures' views sit in it and beyond it); the defaults moved to 15 – 50° on the
// owner's word (2026-11-19) and are pinned on their own just below — the law is the same function of its knobs
const K = { fromDeg: 5, fullDeg: 25, maxDegS: 0 };
const pic = (s: UprightState, g: CamPose, dt = 1000 / 60, k: UprightKnobs = K, scale = 1) => {
  const line = framedLine(g, piece);
  const r = uprightStep(s, g, line, dt, k, scale);
  return { r, p: poseRolled(g, line, r.phi), line };
};

describe("law U's defaults and its weight", () => {
  it("the defaults: the band 15 – 50°, the rest at 720° a second (the owner 2026-11-19: \"Changing both together is much better\"; 5 – 25°, 1 800 before)", () => {
    expect([UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG, UPRIGHT_MAX_DEG_S]).toEqual([15, 50, 720]);
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

describe("w = 1: gravity exactly on the glass's vertical, whatever the logic's own roll; the places on the glass kept", () => {
  it("over every roll, from above and from below, any heading — the tilt under 1e-9 rad; the piece and the look point within 1e-9 of the half glass", () => {
    for (const el of [30, 50, 64, -40, -64, 0]) {
      for (const yaw of [0, 77, -140]) {
        for (const roll of [-179, -120, -45, 0, 3, 60, 135, 180]) {
          const g = poseAt(el, yaw, roll);
          const { r, p, line } = pic(UPRIGHT_REST, g);
          expect(r.w).toBe(1);
          expect(Math.abs(gravityTilt(p)!)).toBeLessThan(1e-9);
          for (const q of [piece, g.look]) {
            const a = onGlass(g, q, 0.8, 1.6);
            const b = onGlass(p, q, 0.8, 1.6);
            expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(1e-9);
          }
          expect(line.throughLook).toBe(true);
          // the root nearest 0: a pose already upright is not turned round
          if (roll === 0) expect(Math.abs(r.phi)).toBeLessThan(5 * DEG);
        }
      }
    }
  });
  it("the glass's up to the sky, not upside down (the other root refused)", () => {
    const g = poseAt(40, 10, 170);
    const { p } = pic(UPRIGHT_REST, g);
    const [, u] = [0, p.up];
    expect(u[1]).toBeGreaterThan(0);
  });
});

describe("at the vertical: the logic's pose bit for bit", () => {
  it("within 5° of the vertical φ is exactly 0 and the picture is the same object; scale 0 (the square camera holds) likewise", () => {
    for (const el of [89.9, 87, 86, -88]) {
      const g = poseAt(el, 33, 120);
      const { r, p } = pic(UPRIGHT_REST, g);
      expect(r.phi).toBe(0);
      expect(p).toBe(g);
      expect(r.state).toBe(UPRIGHT_REST);
    }
    const g = poseAt(40, 33, 120);
    const z = pic(UPRIGHT_REST, g, 1000 / 60, K, 0);
    expect(z.r.phi).toBe(0);
    expect(z.p).toBe(g);
  });
});

describe("continuity of φ", () => {
  it("through the band (the view leaving the vertical, the logic rolled 170°): at most 3° a frame at 0.2° of view a frame", () => {
    let s: UprightState = UPRIGHT_REST;
    let last = 0;
    let big = 0;
    for (let i = 0; i <= 200; i++) {
      const g = poseAt(89 - i * 0.2, 20, 170);
      const { r } = pic(s, g);
      s = r.state;
      big = Math.max(big, Math.abs(wrap(r.phi - last))); // φ and φ ± 2π: the same pose (wrapped at w = 1)
      last = r.phi;
    }
    expect(big).toBeLessThan(3 * DEG);
    expect(Math.abs(last)).toBeGreaterThan(160 * DEG);
  });
  it("across α = ±180° inside the band (w 0.5): φ moves by half the logic's roll a frame, never a half turn at once", () => {
    let s: UprightState = UPRIGHT_REST;
    let last: number | null = null;
    let big = 0;
    for (let i = 0; i <= 40; i++) {
      const g = poseAt(75, 20, 160 + i);
      const { r } = pic(s, g);
      expect(r.w).toBeCloseTo(0.5, 1);
      s = r.state;
      if (last !== null) big = Math.max(big, Math.abs(r.phi - last));
      last = r.phi;
    }
    expect(big).toBeLessThan(0.6 * DEG);
  });
});

describe("UD6b — law U in time (fix round 1, UPRIGHT_PICTURE.md §6): the carry at once, the rest at uprightMaxDegS everywhere", () => {
  const K6 = { ...K, maxDegS: 720 };
  const dt = 1000 / 60;
  const cap = 12 * DEG; // 720° a second × 1/60 s
  // ⭐ (fix round 3, UD6c) the carry: the logic's twist about the framed line over the frame, undone at c = min(w, w before)
  const carryOf = (s: UprightState, r: { w: number }, g: CamPose): number => {
    const c = Math.min(r.w, s.wp ?? 0);
    return s.gp !== undefined && c > 0 ? -c * twistAbout(s.gp, g, framedLine(g, piece).dir) : 0;
  };
  /** a rough path: the view in and out of the band in jumps, the logic's roll jumping too */
  const path: [number, number][] = [[88, 0], [50, 170], [50, 175], [87, -60], [30, -60], [70, 140], [72, -170], [89, 10], [40, 10], [40, -175], [60, 90], [86, 90], [20, 90]];
  it("(a) the picture never turns in one frame by more than the carry plus uprightMaxDegS × dt", () => {
    let s: UprightState = UPRIGHT_REST;
    for (let k = 0; k < 3; k++) {
      for (const [el, roll] of path) {
        for (let n = 0; n < 4; n++) {
          const g = poseAt(el, 20, roll);
          const { r } = pic(s, g, dt, K6);
          expect(Math.abs(wrap(r.phi - s.phi - carryOf(s, r, g)))).toBeLessThanOrEqual(cap + 1e-12);
          s = r.state;
        }
      }
    }
  });
  it("(b) the carry is exact: through a rigid roll of the logic at w = 1 gravity stays on the vertical; a change of 180° at w = 1 leaves the picture where it was", () => {
    let s: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 40; n++) s = pic(s, poseAt(50, 20, 30), dt, K6).r.state;
    for (let i = 0; i < 20; i++) {
      const { r, p } = pic(s, poseAt(50, 20, 30 + i * 37), dt, K6);
      s = r.state;
      expect(Math.abs(gravityTilt(p)!)).toBeLessThan(1e-9);
    }
    const before = pic(s, poseAt(50, 20, 30), dt, K6);
    s = before.r.state;
    const g0 = poseAt(50, 20, 30);
    const after = pic(s, poseRolled(g0, framedLine(g0, piece), Math.PI), dt, K6); // the change: the logic turned half a turn about the framed line
    for (const k of [0, 1, 2] as const) {
      expect(Math.abs(after.p.eye[k] - before.p.eye[k])).toBeLessThan(1e-9);
      expect(Math.abs(after.p.up[k] - before.p.up[k])).toBeLessThan(1e-9);
    }
  });
  it("(c) the band crossed in ONE frame with α near 180°: the rest closes in 170 / 720 s, 12° a frame the short way — never a flip", () => {
    let s = pic(UPRIGHT_REST, poseAt(88, 20, 170), dt, K6).r.state;
    expect(s.phi).toBe(0);
    const g = poseAt(50, 20, 170);
    const goal = pic(UPRIGHT_REST, g, dt, K).r.phi;
    let n = 0;
    let last = 0;
    let sign = 0;
    while (n < 100) {
      const { r } = pic(s, g, dt, K6);
      const d = wrap(r.phi - last);
      expect(Math.abs(d)).toBeLessThanOrEqual(cap + 1e-12);
      if (Math.abs(d) > 0) {
        if (sign === 0) sign = Math.sign(d);
        expect(Math.sign(d)).toBe(sign);
      }
      last = r.phi;
      s = r.state;
      n++;
      if (Math.abs(wrap(r.phi - goal)) < 1e-12) break;
    }
    expect(n).toBe(Math.ceil(Math.abs(goal) / cap - 1e-9));
  });
  it("(c') at 143 frames a second the same rest takes the same TIME: 720 / 143° a frame", () => {
    const d143 = 1000 / 143;
    let s = pic(UPRIGHT_REST, poseAt(88, 20, 170), d143, K6).r.state;
    const g = poseAt(50, 20, 170);
    const goal = pic(UPRIGHT_REST, g, d143, K).r.phi;
    let n = 0;
    while (n < 200) {
      const { r } = pic(s, g, d143, K6);
      s = r.state;
      n++;
      if (Math.abs(wrap(r.phi - goal)) < 1e-12) break;
    }
    expect(n).toBe(Math.ceil(Math.abs(goal) / ((720 / 143) * DEG) - 1e-9));
  });
  it("(c'') the 10 flips' cause: an α read just inside the band (w ≈ 0.01, where it is wild) is never carried at the weight after a one-frame crossing", () => {
    let s = pic(UPRIGHT_REST, poseAt(84, 20, -100), dt, K6).r.state;
    expect(s.wp).toBeGreaterThan(0);
    expect(s.wp).toBeLessThan(0.02);
    const { r } = pic(s, poseAt(40, 20, 170), dt, K6);
    expect(Math.abs(wrap(r.phi - s.phi))).toBeLessThanOrEqual(cap + 2 * DEG);
  });
  it("(d) α crossing ±180° inside the band (w 0.5): no jump — at most the carry plus 12° a frame", () => {
    let s: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 30; n++) s = pic(s, poseAt(75, 20, 160), dt, K6).r.state;
    for (let i = 0; i <= 40; i++) {
      const { r } = pic(s, poseAt(75, 20, 160 + i), dt, K6);
      expect(Math.abs(wrap(r.phi - s.phi))).toBeLessThanOrEqual(cap + 1.1 * DEG);
      s = r.state;
    }
  });
  it("(e) the same picture at 60 and at 143 frames a second: within 3° on the way, exactly at the end", () => {
    const run = (hz: number, until: number): number => {
      let s: UprightState = UPRIGHT_REST;
      let phi = 0;
      for (let i = 0; i <= Math.round(hz * until); i++) {
        const t = Math.min(1, i / hz);
        const { r } = pic(s, poseAt(89 - 49 * t, 20, 100 + 80 * t), 1000 / hz, K6);
        s = r.state;
        phi = r.phi;
      }
      return phi;
    };
    expect(Math.abs(wrap(run(60, 0.5) - run(143, 0.5)))).toBeLessThan(3 * DEG);
    expect(Math.abs(wrap(run(60, 1.5) - run(143, 1.5)))).toBeLessThan(1e-9);
  });
  it("(f) uprightMaxDegS 0: law U as first built — φ = w·ᾱ (ᾱ unwrapped in the band), the state without the carry's weight", () => {
    let s: UprightState = UPRIGHT_REST;
    let au: number | null = null;
    for (const [el, roll] of path) {
      const g = poseAt(el, 20, roll);
      const { r } = pic(s, g, dt, K);
      const a = r.w > 0 ? uprightAngle(g, framedLine(g, piece)) : null;
      au = !(r.w > 0) ? null : a === null ? au : au === null || r.w >= 1 ? wrap(a) : au + wrap(a - au);
      expect(r.phi).toBe(au === null ? 0 : r.w * au);
      expect(r.state.wp).toBeUndefined();
      s = r.state;
    }
  });
  it("at the vertical the logic's continuous spin opens no rest: φ exactly 0, the picture is the logic's pose", () => {
    let s: UprightState = UPRIGHT_REST;
    for (let i = 0; i < 60; i++) {
      const g = poseAt(88, i * 9, i * 13);
      const { r, p } = pic(s, g, dt, K6);
      expect(r.phi).toBe(0);
      expect(p).toBe(g);
      s = r.state;
    }
  });
  it("UD4b: a freed change (its twist given) keeps the picture's roll across that frame, at w 0, 0.5 and 1", () => {
    for (const el of [88, 75, 50]) {
      let s: UprightState = UPRIGHT_REST;
      for (let n = 0; n < 40; n++) s = pic(s, poseAt(el, 20, 30), dt, K6).r.state;
      const g0 = poseAt(el, 20, 30);
      const p0 = poseRolled(g0, framedLine(g0, piece), s.phi);
      const g1 = poseAt(el, 20, 30 + 140);
      const line = framedLine(g1, piece);
      const r = uprightStep(s, g1, line, 0, K6, 1, true); // ⭐ (fix round 3, UD6c) the twist read by the law itself from its state (`gp`)
      const p1 = poseRolled(g1, line, r.phi);
      expect(Math.abs(twistAbout(p0, p1, line.dir))).toBeLessThan(1e-9);
      if (el === 88) {
        // at the vertical the rest so opened closes to the logic's pose itself (φ exactly 0) at the rest's pace
        let u = r.state;
        let n = 0;
        while (u.phi !== 0 && n < 60) {
          u = pic(u, g1, dt, K6).r.state;
          n++;
        }
        expect(u.phi).toBe(0);
        expect(n).toBe(Math.ceil(Math.abs(r.phi) / cap - 1e-9));
      }
    }
  });
});

describe("UD6c — the carry is the logic's twist undone, never Δα (fix round 3, UPRIGHT_PICTURE.md §10)", () => {
  const K14 = { ...K, maxDegS: 1440 };
  const dt = 1000 / 60;
  const cap = 24 * DEG; // 1 440° a second × 1/60 s
  /** the pose `g` carried to view along `f1` by the MINIMAL rotation (no twist of its own): the upright's own swing when the view passes the vertical */
  const carried = (g: CamPose, f1: Vec3): CamPose => {
    const f0 = unit([g.look[0] - g.eye[0], g.look[1] - g.eye[1], g.look[2] - g.eye[2]]);
    const ax: Vec3 = [f0[1] * f1[2] - f0[2] * f1[1], f0[2] * f1[0] - f0[0] * f1[2], f0[0] * f1[1] - f0[1] * f1[0]];
    const ang = Math.acos(Math.max(-1, Math.min(1, f0[0] * f1[0] + f0[1] * f1[1] + f0[2] * f1[2])));
    return { eye: add(piece, mul(f1, -2)), look: add(piece, mul(f1, 0.5)), up: rotateAbout(g.up, unit(ax), ang) };
  };
  const settle = (g: CamPose, k = K14): UprightState => {
    let s: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 40; n++) s = pic(s, g, dt, k).r.state;
    return s;
  };
  it("(a) a rigid roll of the logic at w = 1: the picture does not move, gravity exactly on the glass's vertical", () => {
    let s = settle(poseAt(50, 20, 30));
    for (let i = 1; i < 30; i++) {
      const { r, p } = pic(s, poseAt(50, 20, 30 + i * 41), dt, K14);
      expect(Math.abs(gravityTilt(p)!)).toBeLessThan(1e-9);
      expect(r.closed).toBe(true); // the carry alone: nothing left for the rest
      s = r.state;
    }
  });
  it("(b) a path off the vertical whose upright turns under the cap: exactly upright on every frame", () => {
    let s = settle(poseAt(60, 0, 10));
    for (let i = 1; i <= 90; i++) {
      const { r, p } = pic(s, poseAt(60 - i * 0.3, i * 2, 10 + i * 7), dt, K14);
      expect(Math.abs(gravityTilt(p)!)).toBeLessThan(1e-9);
      expect(r.closed).toBe(true);
      s = r.state;
    }
  });
  it("(c) the upright's OWN turn over the cap in one frame (the view swung past the vertical, w 1 both ends): the picture rolls by the cap at most, upright once the rest has closed", () => {
    const g0 = poseAt(64, 0, 0, [0, 0, 0]);
    let s = settle(g0);
    // the view swung over the vertical to the other side (26° from it both ends: w 1), the logic's pose carried with no twist — the upright swings
    const g1 = carried(g0, unit([-Math.cos(64 * DEG), -Math.sin(64 * DEG), 0.3]));
    const a0 = uprightAngle(g0, framedLine(g0, piece))!, a1 = uprightAngle(g1, framedLine(g1, piece))!;
    expect(Math.abs(wrap(a1 - a0)) / DEG).toBeGreaterThan(30);
    const first = pic(s, g1, dt, K14);
    expect(first.r.w).toBe(1);
    expect(s.wp).toBe(1);
    expect(Math.abs(wrap(first.r.phi - s.phi - (-twistAbout(g0, g1, framedLine(g1, piece).dir))))).toBeLessThanOrEqual(cap + 1e-9);
    s = first.r.state;
    let n = 0;
    while (!pic(s, g1, dt, K14).r.closed && n < 30) { s = pic(s, g1, dt, K14).r.state; n++; }
    const end = pic(s, g1, dt, K14);
    expect(Math.abs(gravityTilt(end.p)!)).toBeLessThan(1e-9);
  });
  it("(d) the view crossing the band in one step with α wild before it (w ≈ 0.01): the picture's roll that frame bounded by the cap plus the carried twist share", () => {
    let s = pic(UPRIGHT_REST, poseAt(84, 20, -100), dt, K14).r.state;
    s = pic(s, poseAt(84, 20, -100), dt, K14).r.state;
    const g0 = poseAt(84, 20, -100);
    const g1 = poseAt(40, 20, 170);
    const { r } = pic(s, g1, dt, K14);
    const c = Math.min(r.w, s.wp ?? 0);
    const carried = -c * twistAbout(g0, g1, framedLine(g1, piece).dir);
    expect(c).toBeLessThan(0.02);
    expect(Math.abs(wrap(r.phi - s.phi - carried))).toBeLessThanOrEqual(cap + 1e-9);
    expect(Math.abs(wrap(r.phi - s.phi))).toBeLessThanOrEqual(cap + 4 * DEG);
  });
  it("(e) w = 0: the picture is the logic's pose, bit for bit; (g) 60 and 143 frames a second: the same picture once the rest has closed", () => {
    const g = poseAt(88, 40, 77);
    const { r, p } = pic(UPRIGHT_REST, g, dt, K14);
    expect(r.phi).toBe(0);
    expect(p).toBe(g);
    const run = (hz: number): number => {
      let s: UprightState = UPRIGHT_REST;
      let phi = 0;
      for (let i = 0; i <= hz * 1.5; i++) {
        const t = Math.min(1, i / hz);
        const q = pic(s, poseAt(89 - 49 * t, 20, 100 + 80 * t), 1000 / hz, K14);
        s = q.r.state;
        phi = q.r.phi;
      }
      return phi;
    };
    expect(Math.abs(wrap(run(60) - run(143)))).toBeLessThan(1e-9);
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

describe("no root: held", () => {
  it("a line along the world's vertical: no turn about it levels the glass — α null, the last ᾱ kept", () => {
    const g = poseAt(50, 0, 30);
    const vertical = { at: piece, dir: [0, 1, 0] as Vec3, throughLook: false };
    expect(uprightAngle(g, vertical)).toBeNull();
    const held: UprightState = { au: 0.3, phi: 0.3, ap: 0.3 };
    const r = uprightStep(held, g, vertical, 16, K);
    expect(r.alpha).toBeNull();
    expect(r.phi).toBeCloseTo(0.3, 12);
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

describe("RB3 — the law's own half turn is a turn he sees (UPRIGHT_PICTURE.md §12): `halfStart`, `half`, `lawHalfTurn`", () => {
  const K6 = { ...K, maxDegS: 720 };
  const dt = 1000 / 60;
  it("off the vertical in one frame with the logic near half a turn from upright: the rest opens at 170° — started once, under way until it closes, then over", () => {
    let v: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 5; n++) v = pic(v, poseAt(89, 20, 0), dt, K6).r.state;
    expect(lawHalfTurn(v)).toBe(false);
    const first = pic(v, poseAt(40, 20, 170), dt, K6).r;
    expect(first.halfStart).toBeGreaterThan(165 * DEG); // ~170° (the look point a little off the piece)
    expect(first.halfStart).toBeLessThan(175 * DEG);
    expect(lawHalfTurn(first.state)).toBe(true);
    let s = first.state;
    let n = 0;
    let starts = 0;
    for (; n < 40 && lawHalfTurn(s); n++) {
      const r = pic(s, poseAt(40, 20, 170), dt, K6).r;
      if (r.halfStart > 0) starts++;
      s = r.state;
    }
    expect(starts).toBe(0);
    expect(lawHalfTurn(s)).toBe(false);
    expect(n).toBeGreaterThanOrEqual(13); // ~170° at 12° a frame: about 15 frames in all, the first above
    expect(n).toBeLessThanOrEqual(15);
  });
  it("a rest under 90°, a rest closed in its own frame (no pace), at rest, at the vertical: no half turn", () => {
    let v: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 5; n++) v = pic(v, poseAt(89, 20, 0), dt, K6).r.state;
    const small = pic(v, poseAt(40, 20, 80), dt, K6).r;
    expect(small.halfStart).toBe(0);
    expect(lawHalfTurn(small.state)).toBe(false);
    const atOnce = pic(v, poseAt(40, 20, 170), dt, K).r; // maxDegS 0: law U as first built
    expect(atOnce.halfStart).toBe(0);
    expect(lawHalfTurn(atOnce.state)).toBe(false);
    expect(lawHalfTurn(undefined)).toBe(false);
    let w: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 30; n++) {
      const r = pic(w, poseAt(50, 20, 30), dt, K6).r;
      if (n > 0) expect(r.halfStart).toBe(0);
      w = r.state;
    }
  });
  it("a rigid roll of the logic by half a turn at w 1 is carried (the picture where it was): no half turn", () => {
    let s: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 40; n++) s = pic(s, poseAt(50, 20, 30), dt, K6).r.state;
    const g0 = poseAt(50, 20, 30);
    const r = pic(s, poseRolled(g0, framedLine(g0, piece), Math.PI), dt, K6).r;
    expect(r.halfStart).toBe(0);
    expect(lawHalfTurn(r.state)).toBe(false);
  });
});

describe("law U's `closed`", () => {
  it("closed: a change of 180° at w 1 carried (the picture where it was) is closed; a band crossed with α near 180° leaves a rest (not closed) until it is", () => {
    const K6 = { ...K, maxDegS: 720 };
    const dt = 1000 / 60;
    let s: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 40; n++) s = pic(s, poseAt(50, 20, 30), dt, K6).r.state;
    expect(pic(s, poseAt(50, 20, 30), dt, K6).r.closed).toBe(true);
    const g0 = poseAt(50, 20, 30);
    expect(pic(s, poseRolled(g0, framedLine(g0, piece), Math.PI), dt, K6).r.closed).toBe(true);
    // at the vertical, then off it in one frame with the logic rolled near half a turn: the rest is 12° a frame, so not closed on that frame
    let v: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 5; n++) v = pic(v, poseAt(89, 20, 0), dt, K6).r.state;
    const jump = pic(v, poseAt(40, 20, 170), dt, K6).r;
    expect(jump.closed).toBe(false);
    let st2 = jump.state, last = jump;
    for (let n = 0; n < 30 && !last.closed; n++) { last = pic(st2, poseAt(40, 20, 170), dt, K6).r; st2 = last.state; }
    expect(last.closed).toBe(true);
    // no pace (maxDegS 0): always closed
    expect(pic(v, poseAt(40, 20, 170)).r.closed).toBe(true);
  });
});

describe("V1 — near the vertical the picture keeps the roll it arrives with (UPRIGHT_PICTURE.md §15; the slider uprightKeepRoll)", () => {
  const KV = { ...K, maxDegS: 720, keep: true };
  const K6 = { ...K, maxDegS: 720 };
  const dt = 1000 / 60;
  /** the view at `th` deg along the great circle through the vertical over heading 20° (60: 30° off the vertical; 90: straight down; 120: 30° off it, the far side) */
  const viewAt = (th: number): Vec3 => unit([Math.cos(th * DEG) * Math.cos(20 * DEG), -Math.sin(th * DEG), Math.cos(th * DEG) * Math.sin(20 * DEG)]);
  /** the pose `g` carried to view along `f1` by the minimal rotation (no twist of its own) — the logic over a top, carried upside down (UD12) */
  const carried = (g: CamPose, f1: Vec3): CamPose => {
    const f0 = unit([g.look[0] - g.eye[0], g.look[1] - g.eye[1], g.look[2] - g.eye[2]]);
    const c: Vec3 = [f0[1] * f1[2] - f0[2] * f1[1], f0[2] * f1[0] - f0[0] * f1[2], f0[0] * f1[1] - f0[1] * f1[0]];
    const sn = Math.hypot(c[0], c[1], c[2]);
    const ang = Math.atan2(sn, f0[0] * f1[0] + f0[1] * f1[1] + f0[2] * f1[2]);
    const up = sn < 1e-12 ? g.up : rotateAbout(g.up, mul(c, 1 / sn), ang);
    return { eye: add(piece, mul(f1, -2)), look: add(piece, mul(f1, 0.5)), up };
  };
  /** a pass over the vertical, `step` deg a frame from 60 to `to`, the logic rolled 100° at the start and carried with no twist; `hold` frames at `to` */
  const pass = (k: UprightKnobs, to: number, hold: number, step = 0.5) => {
    let g = poseAt(60, 20, 100, [0, 0, 0]);
    let s: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 40; n++) s = pic(s, g, dt, k).r.state;
    const frames: { th: number; phi: number; p: CamPose; half: number; w: number }[] = [];
    for (let th = 60 + step; th <= to + 1e-9; th += step) {
      g = carried(g, viewAt(th));
      const { r, p } = pic(s, g, dt, k);
      frames.push({ th, phi: r.phi, p, half: r.halfStart, w: r.w });
      s = r.state;
    }
    for (let n = 0; n < hold; n++) {
      const { r, p } = pic(s, g, dt, k);
      frames.push({ th: to, phi: r.phi, p, half: r.halfStart, w: r.w });
      s = r.state;
    }
    return { frames, s, g };
  };
  it("(a) the roll kept at the vertical: the picture arrives upright and keeps that roll there (the defaults commit: the logic's pose, rolled 100° away)", () => {
    const at = pass(KV, 90, 0).frames.filter((f) => f.th >= 86 && f.th <= 90);
    const far = pass(KV, 60.5, 0).frames[0]!.phi; // upright out there: about −100°
    expect(Math.abs(far)).toBeGreaterThan(80 * DEG);
    for (const f of at) {
      expect(f.w).toBe(0);
      expect(Math.abs(wrap(f.phi - at[0]!.phi))).toBeLessThan(1e-9); // kept
      expect(Math.abs(wrap(f.phi - far))).toBeLessThan(2 * DEG); // the roll it arrived with (upright, the logic carried with no twist)
    }
    for (const f of pass(K6, 90, 0).frames.filter((x) => x.th >= 86)) expect(f.phi).toBe(0); // the defaults commit: the logic's pose
  });
  it("(b) the carry whole at the vertical: a roll of the logic about the view (w 0) leaves the picture where it was, frame after frame", () => {
    const { s, g } = pass(KV, 90, 5);
    const f: Vec3 = unit([g.look[0] - g.eye[0], g.look[1] - g.eye[1], g.look[2] - g.eye[2]]);
    let st = s;
    const p0 = pic(st, g, dt, KV).p;
    for (let i = 1; i <= 12; i++) {
      const gi: CamPose = { ...g, up: rotateAbout(g.up, f, i * 37 * DEG) };
      const { r, p } = pic(st, gi, dt, KV);
      expect(r.w).toBe(0);
      for (let j = 0; j < 3; j++) expect(Math.abs(p.up[j]! - p0.up[j]!)).toBeLessThan(1e-9);
      st = r.state;
    }
  });
  it("(c) on the way out over the far side: upright against the kept roll weighted by k — half way at k 0.5, upright at k 1; the half turn started once at most, about 180° in all", () => {
    const mid = pass(KV, 105, 90).frames; // ν 15°: k 0.5 on the band 5 – 25°
    const last = mid[mid.length - 1]!;
    expect(last.w).toBeCloseTo(0.5, 9);
    const t = Math.abs(gravityTilt(last.p)!) / DEG;
    expect(t).toBeGreaterThan(70);
    expect(t).toBeLessThan(110);
    const out = pass(KV, 125, 60).frames;
    const end = out[out.length - 1]!;
    expect(Math.abs(gravityTilt(end.p)!)).toBeLessThan(1e-6);
    expect(out.filter((f) => f.half > 0).length).toBeLessThanOrEqual(1);
    const way = out.filter((f) => f.th > 90);
    let turned = 0;
    for (let i = 1; i < way.length; i++) turned += Math.abs(wrap(way[i]!.phi - way[i - 1]!.phi));
    expect(turned / DEG).toBeGreaterThan(150);
    expect(turned / DEG).toBeLessThan(200);
  });
  it("(d) close in (the square camera's share whole, scale 0): the logic's pose every frame, as the defaults commit (UD3)", () => {
    let a: UprightState = UPRIGHT_REST, b: UprightState = UPRIGHT_REST;
    for (const el of [60, 60, 70, 80, 88, 89, 80, 60, 60]) {
      const g = poseAt(el, 20, 100);
      const ra = pic(a, g, dt, KV, 0).r, rb = pic(b, g, dt, K6, 0).r;
      expect(ra.phi).toBe(0);
      expect(ra.phi).toBe(rb.phi);
      a = ra.state;
      b = rb.state;
    }
  });
  it("(e) keep absent or false: the defaults commit's law, bit for bit", () => {
    const x = pass(K6, 125, 10).frames, y = pass({ ...K6, keep: false }, 125, 10).frames;
    expect(y.map((f) => f.phi)).toEqual(x.map((f) => f.phi));
  });
  it("(c3) out of the vertical at his pace (4° a frame, 240° a second): the half turn is the law's own — started ONCE, the gizmo held while it closes (lawHalfTurn), then upright", () => {
    let g = poseAt(60, 20, 100, [0, 0, 0]);
    let s: UprightState = UPRIGHT_REST;
    for (let n = 0; n < 40; n++) s = pic(s, g, dt, KV).r.state;
    let starts = 0, under = 0;
    for (let th = 64; th <= 160; th += 4) {
      g = carried(g, viewAt(Math.min(th, 124)));
      const r = pic(s, g, dt, KV).r;
      if (r.halfStart > 0) starts++;
      if (lawHalfTurn(r.state)) under++;
      s = r.state;
    }
    expect(starts).toBe(1);
    expect(under).toBeGreaterThan(2);
    expect(lawHalfTurn(s)).toBe(false);
    expect(Math.abs(gravityTilt(pic(s, g, dt, KV).p)!)).toBeLessThan(1e-6);
  });
  it("(c2) the side of the half turn chosen once: upright against the kept roll unwrapped in the band — through 180° the target goes on, never back the other way", () => {
    const g = poseAt(75, 20, 170, [0, 0, 0]); // ν 15°: k 0.5
    const line = framedLine(g, piece);
    const a = uprightAngle(g, line)!;
    const prev = a + 2 * Math.PI - 20 * DEG; // last frame upright stood 20° short of half a turn on the positive side
    const s: UprightState = { au: null, phi: 0.5 * prev, ap: a, wp: 0.5, gp: g, sp: 1, psi: 0, dk: prev };
    const r = uprightStep(s, g, line, dt, KV);
    expect(r.state.dk!).toBeCloseTo(a + 2 * Math.PI, 9); // past 180°, not wrapped back to −170°
    expect(wrap(r.phi - s.phi)).toBeGreaterThan(0); // on toward 0.5 × (a + 2π), the same way
  });
  it("(f) changeWeight: with V1 the carry's weight (the square camera's complement), so a change far out is never seen; without it, or no complement known, w", () => {
    expect(changeWeight(true, 0, 1)).toBe(1);
    expect(changeWeight(true, 0.3, 0.6)).toBe(0.6);
    expect(changeWeight(false, 0.3, 0.6)).toBe(0.3);
    expect(changeWeight(true, 0.3, undefined)).toBe(0.3);
    const seen = changeSeen({ stays: false, wBefore: changeWeight(true, 0, 1), wAfter: changeWeight(true, 0, 1), turnRad: Math.PI, freeMaxDeg: 90 });
    expect(seen.timed).toBe(false);
    expect(seen.seenRad).toBe(0);
  });
});
