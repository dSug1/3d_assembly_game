// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13 — F2) THE CAMERA FOLLOWER's pure rules (`src/input/camera_follow.ts`): the one
// ease on the sphere, the pole's detour by place, the yaw's ceiling never under his pace, the polar camera, the pose drawn far out.
import { describe, expect, it } from "vitest";
import { FOLLOW_CAP_DEG, followCeiling, followPose, followStep, polarStep, poleDetour, sphereSpring, type FollowDetour, type FollowState } from "../src/input/camera_follow";
import { offsetFrame } from "../src/input/assembly_orbit";

type V = [number, number, number];
const D2R = Math.PI / 180;
const dirOf = (thFromUpDeg: number, azDeg: number): V => {
  const t = thFromUpDeg * D2R;
  const a = azDeg * D2R;
  return [Math.sin(t) * Math.sin(a), Math.cos(t), Math.sin(t) * Math.cos(a)];
};
const ang = (a: readonly number[], b: readonly number[]): number => Math.acos(Math.max(-1, Math.min(1, a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!)));
const K = { tauMs: 50, poleDeg: 30, fromDeg: 60, maxDegS: 900 };
const DET0: FollowDetour = { on: false, pole: 1, phiIn: 0, side: 1, phiWas: null };

describe("F2 — the one ease on the sphere (`sphereSpring`)", () => {
  it("from rest toward a still target 90° away: nearer every frame, never past it, on the sphere; there within 0.1° after 10 τ", () => {
    let d: V = [1, 0, 0];
    let v: V = [0, 0, 0];
    const t: V = [0, 0, 1];
    let was = ang(d, t);
    for (let i = 0; i < 30; i++) {
      const r = sphereSpring(d, v, t, 1 / 60, 0.05);
      d = r.d as V;
      v = r.v as V;
      expect(Math.hypot(...d)).toBeCloseTo(1, 12);
      expect(ang(d, t)).toBeLessThan(was + 1e-12);
      expect(d[0]).toBeGreaterThanOrEqual(-1e-9); // never past the target
      was = ang(d, t);
    }
    expect(was / D2R).toBeLessThan(0.1);
  });
  it("an ease, not a jump: one frame of 16.7 ms at τ 50 ms moves less than half the way; τ 0 is the target at once", () => {
    const r = sphereSpring([1, 0, 0], [0, 0, 0], [0, 0, 1], 1 / 60, 0.05);
    expect(ang(r.d, [1, 0, 0])).toBeLessThan(Math.PI / 4);
    expect(ang(r.d, [1, 0, 0])).toBeGreaterThan(0);
    expect(sphereSpring([1, 0, 0], [0, 0, 0], [0, 0, 1], 1 / 60, 0).d).toEqual([0, 0, 1]);
  });
});

describe("F2 — the pole's detour, by place (`poleDetour`)", () => {
  it("beyond `fromDeg` of the vertical: the direction exactly, the detour off; `poleDeg` 0: none", () => {
    const d = dirOf(61, 20);
    const r = poleDetour(d, DET0, 30, 60);
    expect(r.dir).toEqual(d);
    expect(r.det.on).toBe(false);
    expect(poleDetour(dirOf(10, 20), DET0, 0, 60).dir).toEqual(dirOf(10, 20));
  });
  it("a pass straight over the vertical: ROUND it at `poleDeg` (never nearer than 29°), its azimuth ONE way through 180° (one yaw a pass)", () => {
    let det = DET0;
    let minTh = 90;
    let azWas: number | null = null;
    let turned = 0;
    let back = 0;
    for (let x = 70; x >= -70; x -= 1) {
      const d = x >= 0 ? dirOf(x, 0.5) : dirOf(-x, 180 - 0.5);
      const r = poleDetour(d, det, 30, 60);
      det = r.det;
      const th = Math.acos(r.dir[1]) / D2R;
      const az = Math.atan2(r.dir[0], r.dir[2]);
      if (Math.abs(x) < 60) minTh = Math.min(minTh, th);
      if (azWas !== null) {
        const s = Math.atan2(Math.sin(az - azWas), Math.cos(az - azWas));
        turned += s;
        if (s < -1e-9) back++;
      }
      azWas = az;
    }
    expect(minTh).toBeGreaterThan(29);
    expect(Math.abs(turned) / D2R).toBeGreaterThan(170);
    expect(back).toBe(0);
  });
  it("continuous at its reach: just inside `fromDeg` the push is nearly none (its fall-off), so the camera never jumps entering the detour", () => {
    const d = dirOf(59.9, 20);
    expect(ang(poleDetour(d, DET0, 30, 60).dir, d) / D2R).toBeLessThan(0.01);
  });
  it("the side kept from the entry (drifting the other way in: round the other side); by place: the same direction, the same answer", () => {
    const a = poleDetour(dirOf(50, 0), { ...DET0, phiWas: 1 * D2R }, 30, 60);
    const b = poleDetour(dirOf(50, 0), { ...DET0, phiWas: -1 * D2R }, 30, 60);
    expect(a.det.side).toBe(-1);
    expect(b.det.side).toBe(1);
    const at0a = poleDetour(dirOf(0.001, 0), a.det, 30, 60).dir;
    const at0b = poleDetour(dirOf(0.001, 0), b.det, 30, 60).dir;
    expect(Math.sign(at0a[0])).toBe(-Math.sign(at0b[0]));
    expect(poleDetour(dirOf(20, 10), a.det, 30, 60).dir).toEqual(poleDetour(dirOf(20, 10), a.det, 30, 60).dir);
  });
});

describe("F2 — the yaw's ceiling never under his own pace (`followCeiling`, the ledger's row 6)", () => {
  it("0: none; still: the last resort; on the level his pace whole; near the vertical his pace over the cosine of the detour's latitude", () => {
    expect(followCeiling(0, 5, 0, 30)).toBe(Infinity);
    expect(followCeiling(900, 0, 0, 30)).toBeCloseTo(900 * D2R, 12);
    expect(followCeiling(900, 30, 0, 30)).toBeCloseTo(30, 12);
    expect(followCeiling(900, 30, 89 * D2R, 30)).toBeCloseTo(60, 9);
    expect(followCeiling(900, 30, 89 * D2R, 0)).toBeCloseTo(30 / Math.cos((90 - FOLLOW_CAP_DEG) * D2R), 9);
  });
});

describe("F2 — the polar camera (`polarStep`)", () => {
  it("a yaw asked within the ceiling is reached; beyond it, the ceiling's step; the latitude never within the cap of the vertical", () => {
    const s = { psi: 0, psiT: 0, azWas: 0, psiStep: 0 };
    expect(polarStep(s, dirOf(90, 5), 10, 1 / 60).psi).toBeCloseTo(5 * D2R, 12);
    const far = polarStep(s, dirOf(90, 60), 10, 1 / 60);
    expect(far.psi).toBeCloseTo(10 / 60, 12);
    expect(far.psiT).toBeCloseTo(60 * D2R, 12);
    expect(Math.acos(polarStep(s, dirOf(2, 0), 10, 1 / 60).dir[1]) / D2R).toBeCloseTo(FOLLOW_CAP_DEG, 9);
  });
  it("a half turn's ambiguity (±180°) resolved the way the yaw was already going — never back the long way", () => {
    const up = polarStep({ psi: 0, psiT: 0, azWas: 0, psiStep: 0.01 }, dirOf(90, -179), Infinity, 1 / 60);
    expect(up.psiT / D2R).toBeCloseTo(181, 6);
    const dn = polarStep({ psi: 0, psiT: 0, azWas: 0, psiStep: -0.01 }, dirOf(90, 179), Infinity, 1 / 60);
    expect(dn.psiT / D2R).toBeCloseTo(-181, 6);
  });
});

describe("F2 — one frame of the follower (`followStep`)", () => {
  const run = (path: (i: number) => V, n: number, k = K): FollowState[] => {
    const out: FollowState[] = [];
    let s: FollowState | null = null;
    for (let i = 0; i < n; i++) out.push((s = followStep(s, path(i), 1000 / 60, k)));
    return out;
  };
  it("a still target off the poles: reached (1e-4 rad after 1 s)", () => {
    const t = dirOf(70, 40);
    const s = run((i) => (i === 0 ? dirOf(80, 0) : t), 60);
    expect(ang(s[59]!.dir, t)).toBeLessThan(1e-4);
  });
  it("his pass straight over the vertical at 900°/s: the camera never within 25° of it, its yaw ONE way about 180°, then on the target", () => {
    const path = (i: number): V => {
      const x = 80 - i * 15;
      return x >= 0 ? dirOf(x, 0.3) : dirOf(Math.min(80, -x), 180.3);
    };
    const s = run((i) => path(Math.min(i, 11)), 60);
    const sense = Math.sign(s[59]!.psi - s[0]!.psi);
    let back = 0;
    for (let i = 1; i < s.length; i++) {
      expect(Math.acos(s[i]!.dir[1]) / D2R).toBeGreaterThan(25);
      const st = s[i]!.psi - s[i - 1]!.psi;
      if (Math.abs(st) > 1e-6 && Math.sign(st) === -sense) back++;
    }
    expect(back).toBe(0);
    expect(Math.abs(s[59]!.psi - s[0]!.psi) / D2R).toBeGreaterThan(170);
    expect(ang(s[59]!.dir, path(11))).toBeLessThan(1e-3);
  });
  it("his own fast dx on the level (1 600°/s round the assembly): the ceiling never bites — the same camera as with no ceiling", () => {
    const path = (i: number): V => dirOf(90, (i * 1600) / 60);
    const a = run(path, 40);
    const b = run(path, 40, { ...K, maxDegS: 0 });
    for (let i = 0; i < 40; i++) expect(ang(a[i]!.dir, b[i]!.dir)).toBeLessThan(1e-6); // acos's own resolution is 1.5e-8
  });
});

describe("F2 — the pose drawn far out (`followPose`)", () => {
  it("the piece hung along the followed direction from the foot; the camera on the owner's offsets in the WORLD-UP frame, at the look point; up the world's", () => {
    const dir = dirOf(60, 30);
    const look: V = [0, 0.2, 0.1];
    const foot: V = [0.1, 0.4, -0.1];
    const P = followPose(dir, look, foot, 6, 1.25, 2.5 * D2R, 2 * D2R);
    expect(P.piece[0]).toBeCloseTo(foot[0] + 6 * dir[0], 12);
    expect(P.piece[1]).toBeCloseTo(foot[1] + 6 * dir[1], 12);
    expect(P.piece[2]).toBeCloseTo(foot[2] + 6 * dir[2], 12);
    expect(P.look).toEqual(look);
    expect(P.up).toEqual([0, 1, 0]);
    const f = offsetFrame(dir, Math.atan2(dir[2], dir[0]), 2.5 * D2R, 2 * D2R).dir;
    const e: V = [P.eye[0] - look[0], P.eye[1] - look[1], P.eye[2] - look[2]];
    const r = Math.hypot(...e);
    expect(r).toBeCloseTo(Math.hypot(P.piece[0] - look[0], P.piece[1] - look[1], P.piece[2] - look[2]) + 1.25, 12);
    expect(ang(e.map((x) => x / r), f)).toBeLessThan(1e-9);
    expect(ang(e.map((x) => x / r), dir)).toBeGreaterThan(2 * D2R);
  });
});
