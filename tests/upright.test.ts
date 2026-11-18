// ⭐⭐⭐ (2026-11-18, UPRIGHT_PICTURE.md §2 step 2 — U0) law U, pure: gravity on the glass's vertical at w = 1 whatever the logic's own roll, the piece
// and the look point unmoved on the glass, the logic's pose bit for bit at the vertical, φ continuous through the band and across α = ±180°, the cap exact at
// w = 1, the same at 60 and 143 frames a second, the no-root case held
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import { framedLine, onGlass, poseRolled } from "../src/input/roll_follow";
import { gravityTilt, UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG, UPRIGHT_MAX_DEG_S, UPRIGHT_REST, uprightAngle, uprightStep, uprightWeight, viewFromVertical, type UprightState } from "../src/input/upright";

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
const K = { fromDeg: UPRIGHT_FROM_DEG, fullDeg: UPRIGHT_FULL_DEG, maxDegS: 0 };
const pic = (s: UprightState, g: CamPose, dt = 1000 / 60, k = K, scale = 1) => {
  const line = framedLine(g, piece);
  const r = uprightStep(s, g, line, dt, k, scale);
  return { r, p: poseRolled(g, line, r.phi), line };
};

describe("law U's defaults and its weight", () => {
  it("the band 5 – 25°, no cap; w a smoothstep, 0 within 5°, 1 from 25°", () => {
    expect([UPRIGHT_FROM_DEG, UPRIGHT_FULL_DEG, UPRIGHT_MAX_DEG_S]).toEqual([5, 25, 0]);
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

describe("the cap (uprightMaxDegS)", () => {
  it("exact at w = 1: the logic rolled 90° a frame, gravity still on the vertical", () => {
    let s: UprightState = UPRIGHT_REST;
    const k = { ...K, maxDegS: 720 };
    for (let i = 0; i < 8; i++) {
      const { r, p } = pic(s, poseAt(50, 10, i * 90), 1000 / 60, k);
      s = r.state;
      expect(Math.abs(gravityTilt(p)!)).toBeLessThan(1e-9);
    }
    // the view leaving the vertical at once (w 0 → 1 in a frame, the logic rolled 150°): exact, never capped
    let s2: UprightState = pic(UPRIGHT_REST, poseAt(88, 10, 150), 1000 / 60, k).r.state;
    const j = pic(s2, poseAt(30, 10, 150), 1000 / 60, k);
    s2 = j.r.state;
    expect(Math.abs(gravityTilt(j.p)!)).toBeLessThan(1e-9);
  });
  it("inside the band the logic rolling 30° a frame (w 0.5): carried — φ = w·ᾱ exactly, the cap never reached", () => {
    const k = { ...K, maxDegS: 720 };
    let s: UprightState = UPRIGHT_REST;
    let u: UprightState = UPRIGHT_REST;
    for (let i = 0; i < 10; i++) {
      const g = poseAt(75, 10, i * 30);
      const a = pic(s, g, 1000 / 60, k).r;
      const b = pic(u, g).r;
      s = a.state;
      u = b.state;
      if (i > 0) expect(a.phi).toBeCloseTo(b.phi, 9);
    }
  });
  it("inside the band: the view crossing it at once (w 0 → 0.99, the logic rolled 150°) — φ at most 720° a second; then it reaches w·α exactly", () => {
    const k = { ...K, maxDegS: 720 };
    const dt = 1000 / 60;
    let s: UprightState = UPRIGHT_REST;
    let { r } = pic(s, poseAt(86, 10, 150), dt, k);
    expect(r.phi).toBe(0);
    s = r.state;
    const g = poseAt(66, 10, 150);
    let last = r.phi;
    for (let i = 0; i < 30; i++) {
      r = pic(s, g, dt, k).r;
      s = r.state;
      expect(Math.abs(r.phi - last)).toBeLessThanOrEqual(12 * DEG + 1e-12);
      last = r.phi;
    }
    const free = pic(UPRIGHT_REST, g).r;
    expect(r.phi).toBeCloseTo(free.phi, 12);
  });
});

describe("the same at 60 and at 143 frames a second", () => {
  const run = (hz: number, maxDegS: number): number => {
    let s: UprightState = UPRIGHT_REST;
    const n = Math.round(hz * 1.5);
    let phi = 0;
    for (let i = 0; i <= n; i++) {
      const t = Math.min(1, i / hz);
      const { r } = pic(s, poseAt(89 - 49 * t, 20, 100 * t), 1000 / hz, { ...K, maxDegS });
      s = r.state;
      phi = r.phi;
    }
    return phi;
  };
  it("no cap: φ a function of the pose (and the unwrap) — equal; with the cap 720° a second: both reach the same w·α", () => {
    expect(run(60, 0)).toBeCloseTo(run(143, 0), 12);
    expect(run(60, 720)).toBeCloseTo(run(143, 720), 9);
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
