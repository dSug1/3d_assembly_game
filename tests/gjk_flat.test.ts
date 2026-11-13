/**
 * GOLDEN VECTORS — **GJK READ A FACE-PARALLEL GAP AS CONTACT** (2026-11-13, the slide's rebuild, branch `1.0.126-Slide_removal`).
 * Walked headless on `Scene_0`'s heptagon (the tilted pole, a dy up its slanted top face, the piece resting face-down parallel to it at 2.8 mm): the solver's
 * gap queries read 2.813 mm, 0, 2.813, 0 along a move PARALLEL to the face — the exact distance (separating axes) 2.813 everywhere. `nearestOnTetrahedron`
 * decided a flat simplex by an ABSOLUTE volume (`|6V| ≤ 1e-18` m³); support points of two bodies meeting face to face are coplanar to rounding, a volume
 * ~1e-12 at these sizes, read as solid — and the origin, on the near-zero side of every face, as INSIDE: a gap of 0. The solver then took free air for a
 * wall (blocked, projected, relocated: the owner's "friction" at contact) or landed on it. RED on the old code: the three captured poses read 0; the
 * sweep finds ~6 % of face-parallel pairs wrong.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { gapBetween } from "../src/core/collision_shape";
import type { Vec3 } from "../src/core/vec";

const cases: { piece: Vec3[]; part: Vec3[] }[] = JSON.parse(readFileSync(new URL("./fixtures/gjk_heptagon_face_parallel.json", import.meta.url), "utf8"));

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
/** ⭐ The exact separation of two convex point sets by separating axes (every cross of their point-difference directions): an INDEPENDENT reference. */
function satGap(A: readonly Vec3[], B: readonly Vec3[]): number {
  const dirs = (P: readonly Vec3[]): Vec3[] => {
    const o: Vec3[] = [];
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) o.push(sub(P[j]!, P[i]!));
    return o;
  };
  const ea = dirs(A);
  const eb = dirs(B);
  let best = -Infinity;
  const test = (ax: Vec3): void => {
    const l = Math.hypot(ax[0], ax[1], ax[2]);
    if (l < 1e-12) return;
    const n: Vec3 = [ax[0] / l, ax[1] / l, ax[2] / l];
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
    for (const p of A) { const t = dot(p, n); amin = Math.min(amin, t); amax = Math.max(amax, t); }
    for (const p of B) { const t = dot(p, n); bmin = Math.min(bmin, t); bmax = Math.max(bmax, t); }
    best = Math.max(best, bmin - amax, amin - bmax);
  };
  for (const u of ea) for (const v of ea) test(cross(u, v));
  for (const u of eb) for (const v of eb) test(cross(u, v));
  for (const u of ea) for (const v of eb) test(cross(u, v));
  return best;
}

describe("⭐⭐⭐ GJK on two bodies meeting face to face: the gap, never a false contact", () => {
  it("⭐⭐⭐ the three captured poses (the piece 2.813 mm over the heptagon's slanted face): 2.813 mm — ⛔ 0", () => {
    expect(cases.length).toBe(3);
    for (const c of cases) {
      const ref = satGap(c.piece, c.part);
      expect(ref * 1000).toBeCloseTo(2.813, 2);
      expect(gapBetween(c.piece, c.part)!).toBeCloseTo(ref, 7);
    }
  });

  it("⭐⭐ a sweep: boxes and frusta face-down over a box at 0.5 – 5 mm, turned and moved at random (6 m out) — every gap the exact one", () => {
    let seed = 7;
    const rnd = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const qmul = (a: number[], b: number[]): number[] => [a[0]! * b[0]! - a[1]! * b[1]! - a[2]! * b[2]! - a[3]! * b[3]!, a[0]! * b[1]! + a[1]! * b[0]! + a[2]! * b[3]! - a[3]! * b[2]!, a[0]! * b[2]! - a[1]! * b[3]! + a[2]! * b[0]! + a[3]! * b[1]!, a[0]! * b[3]! + a[1]! * b[2]! - a[2]! * b[1]! + a[3]! * b[0]!];
    const rot = (q: number[], v: Vec3): Vec3 => {
      const p = qmul(qmul(q, [0, ...v]), [q[0]!, -q[1]!, -q[2]!, -q[3]!]);
      return [p[1]!, p[2]!, p[3]!];
    };
    const box = (sx: number, sy: number, sz: number, top = 1): Vec3[] => {
      const o: Vec3[] = [];
      for (const y of [-1, 1]) for (const x of [-1, 1]) for (const z of [-1, 1]) o.push([(x * sx * (y > 0 ? top : 1)) / 2, (y * sy) / 2, (z * sz * (y > 0 ? top : 1)) / 2]);
      return o;
    };
    let n = 0;
    let wrong = 0;
    for (let k = 0; k < 600; k++) {
      const part = box(0.2 + rnd() * 0.3, 0.05 + rnd() * 0.3, 0.2 + rnd() * 0.3);
      const top = Math.max(...part.map((p) => p[1]));
      const pc = box(0.03 + rnd() * 0.1, 0.03 + rnd() * 0.05, 0.03 + rnd() * 0.1, rnd() < 0.5 ? 0.5 : 1);
      const g = 0.0005 + rnd() * 0.005;
      const yaw = rnd() * Math.PI;
      const qy = [Math.cos(yaw / 2), 0, Math.sin(yaw / 2), 0];
      const off: Vec3 = [(rnd() * 2 - 1) * 0.1, top + g - pc[0]![1], (rnd() * 2 - 1) * 0.1];
      const u = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1];
      const ul = Math.hypot(...u);
      const Q = u.map((x) => x / ul);
      const T: Vec3 = [(rnd() * 2 - 1) * 6, (rnd() * 2 - 1) * 6, (rnd() * 2 - 1) * 6];
      const W = (P: Vec3[]): Vec3[] => P.map((p) => { const r = rot(Q, p); return [r[0] + T[0], r[1] + T[1], r[2] + T[2]] as Vec3; });
      const A = W(pc.map((p) => { const r = rot(qy, p); return [r[0] + off[0], r[1] + off[1], r[2] + off[2]] as Vec3; }));
      const B = W(part);
      const ref = satGap(A, B);
      if (!(ref > 1e-4)) continue;
      n++;
      if (Math.abs((gapBetween(A, B) ?? 0) - ref) > 1e-5) wrong++;
    }
    expect(n).toBeGreaterThan(500);
    expect(wrong).toBe(0);
  });
});
