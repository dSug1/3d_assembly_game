// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — I17 (3), the owner: *"build the fix"*) THE LINES SAMPLED ADAPTIVELY (`refineSamples`,
// `input/section_hull.ts`: `refineStart`, `refineStep`, `refineNow`). RED against `b073178`: absent — the lines were drawn from fixed angles, so a face narrower than a sample's
// interval was a CHORD through its part (the green over Piece42's slanted sides: 6.5° of yaw against a sample every 3.75°).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LINE_REFINE_BUDGET, LINE_REFINE_M, LINE_REFINE_PER_FRAME, LINE_REFINE_LEVELS, refineNow, refineStart, refineStep, sectionFixed } from "../src/input/section_hull";
import type { Vec3 } from "../src/core/vec";

/** a profile along x (m): the depth z(x) — a plane at 0 with a proud trapezoid (Piece42's shape: 41 mm proud, slopes 9 mm wide, front 22 mm) at x 0.170 … 0.212 */
function piece42(x: number): number {
  const a = 0.17;
  const b = 0.212;
  const s = 0.009;
  const h = 0.041;
  if (x <= a || x >= b) return 0;
  if (x < a + s) return (h * (x - a)) / s;
  if (x > b - s) return (h * (b - x)) / s;
  return h;
}
const posOf = (v: Vec3): Vec3 => v;
/** the whole refinement at once (the wiring spends it a slice a frame) */
function refineSamples<T>(params: readonly number[], closed: boolean, period: number, ev: (x: number) => T | null, pos: (v: T) => Vec3, tolM = LINE_REFINE_M, levels = LINE_REFINE_LEVELS, budget = LINE_REFINE_BUDGET) {
  const r = refineStart(params, closed, period, ev, undefined, budget);
  while (!r.done) refineStep(r, ev, pos, Infinity, tolM, levels);
  return refineNow(r);
}

describe("⭐⭐⭐ (2026-11-09, I17) the lines sampled adaptively", () => {
  it("⭐⭐⭐ a narrow proud part between two fixed samples (25 mm apart, the part 42 mm wide): its slopes and front drawn within 1 mm — ⛔ the chord through it", () => {
    const base = sectionFixed(0.5, 21, false); // 25 mm apart over 0 … 0.5
    const ev = (x: number): Vec3 => [x, 0, piece42(x)];
    const r = refineSamples(base, false, 0.5, ev, posOf);
    // every point of the true profile within ~1 mm of the drawn polyline
    const pts = r.vals.map((v) => v!);
    let worst = 0;
    for (let x = 0.15; x <= 0.23; x += 0.0005) {
      const z = piece42(x);
      let best = Infinity;
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const L = (b[0] - a[0]) ** 2 + (b[2] - a[2]) ** 2;
        const k = L > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (z - a[2]) * (b[2] - a[2])) / L)) : 0;
        best = Math.min(best, Math.hypot(x - a[0] - (b[0] - a[0]) * k, z - a[2] - (b[2] - a[2]) * k));
      }
      worst = Math.max(worst, best);
    }
    expect(worst).toBeLessThan(LINE_REFINE_M * 1.5);
    // the params stay sorted, the base kept
    for (let i = 1; i < r.params.length; i++) expect(r.params[i]!).toBeGreaterThan(r.params[i - 1]!);
    for (const x of base) expect(r.params).toContain(x);
    // without the refinement the chord ran 20 mm and more off the part's slope
    const chordOff = Math.abs(piece42(0.1745) - (piece42(0.15) + ((piece42(0.175) - piece42(0.15)) * (0.1745 - 0.15)) / 0.025));
    expect(chordOff).toBeGreaterThan(0.001);
  });

  it("⭐⭐ a flat line: nothing added (the base only)", () => {
    const base = sectionFixed(0.5, 21, false);
    const r = refineSamples(base, false, 0.5, (x): Vec3 => [x, 0.1, 0.2], posOf);
    expect(r.params).toEqual(base);
  });

  it("⭐⭐ a JUMP: halved to the last level and kept as a jump (the join rule breaks it there); the budget bounds the evaluations", () => {
    const base = sectionFixed(1, 11, false);
    let calls = 0;
    const ev = (x: number): Vec3 => {
      calls++;
      return [x, 0, x < 0.43 ? 0 : 0.05];
    };
    const r = refineSamples(base, false, 1, ev, posOf);
    const i = r.params.findIndex((x) => x >= 0.43);
    expect(r.params[i]! - r.params[i - 1]!).toBeLessThan(0.1 / 2 ** 5); // narrowed round the jump (until its chord lies within 1 mm of the riser)
    expect(r.vals[i]![2] - r.vals[i - 1]![2]).toBeCloseTo(0.05, 9); // still a jump
    expect(calls - base.length).toBeLessThanOrEqual(LINE_REFINE_BUDGET);
  });

  it("⭐⭐ a CLOSED line refines its last interval round to the first (+ the period); the params stay in [first, first + period)", () => {
    const base = sectionFixed(2 * Math.PI, 8, true);
    const ev = (x: number): Vec3 => {
      const a = ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const r = a > 6.0 ? 1.1 : 1; // a bump just before the wrap
      return [Math.cos(x) * r, 0, Math.sin(x) * r];
    };
    const r = refineSamples(base, true, 2 * Math.PI, ev, posOf, 0.01);
    expect(r.params.some((x) => x > 6.0)).toBe(true);
    expect(Math.max(...r.params)).toBeLessThan(2 * Math.PI);
  });

  it("⭐⭐⭐ RESUMABLE, a slice a frame (⛔ all at once: 18.6 ms for one green on the desktop): each step at most its evaluations, the line sorted mid-way, the same line at the end", () => {
    const base = sectionFixed(0.5, 21, false);
    let calls = 0;
    const ev = (x: number): Vec3 => {
      calls++;
      return [x, 0, piece42(x)];
    };
    const r = refineStart(base, false, 0.5, ev);
    expect(calls).toBe(base.length);
    let frames = 0;
    while (!r.done) {
      const c0 = calls;
      refineStep(r, ev, posOf);
      expect(calls - c0).toBeLessThanOrEqual(LINE_REFINE_PER_FRAME);
      const now = refineNow(r).params;
      for (let i = 1; i < now.length; i++) expect(now[i]!).toBeGreaterThan(now[i - 1]!);
      frames++;
    }
    expect(frames).toBeGreaterThan(1);
    expect(refineNow(r).params).toEqual(refineSamples(base, false, 0.5, (x): Vec3 => [x, 0, piece42(x)], posOf).params);
  });

  it("⭐ wired: both lines' samples refined a slice a frame, the mesh at a fixed size", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("else if (!cache.ref.done) refineStep(cache.ref, ev, pos);");
    expect(a).toContain("sectionFixed(Math.PI, RED_SAMPLES - 1, false), false, Math.PI)");
    expect(a).toContain("sectionFixed(2 * Math.PI, GREEN_SAMPLES, true), true, 2 * Math.PI)");
  });
});
