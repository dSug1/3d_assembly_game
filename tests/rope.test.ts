/**
 * ⭐⭐⭐ §29 THE ROPE (2026-11-07, `TILTED_ORBIT_REBUILD_SCOPE.md` §29, `src/input/rope.ts`) — the sections as ropes tightened round the assembly, the gizmo
 * on them, never waiting. Each vector is RED against `f622b31` (no rope: the gizmo by `gizmoCase` — a void at the edge a GAP, the gizmo WAITING there; a
 * step drawn as a straight segment between two samples).
 */
import { describe, expect, it } from "vitest";
import { buildRope, ropeAt, ropeDrawn, MIN_PACE, type Landing, type RopePlace } from "../src/input/rope";
import type { Vec3 } from "../src/core/vec";

const STEP = 0.012;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** a front facet (normal +z, the track at z = 0.1), the loop along x = s; `depth(x)` the first surface's z behind the track, `null` a void */
function front(depth: (x: number) => number | null) {
  const at = (s: number): RopePlace => ({ p: [s, 0.2, 0.1], facet: 0, n: [0, 0, 1] });
  const land = (q: RopePlace): Landing | null => {
    const z = depth(q.p[0]);
    return z === null ? null : { point: [q.p[0], q.p[1], z], host: "part" };
  };
  return { at, land };
}

/**
 * the red loop up a box's front and over its top (the side section): the track the SHELL, 50 mm in front of the front (z = 0.1) and 50 mm above the top
 * (y = 0.5) — a proud part elsewhere set it there; the box z ∈ [−0.1, 0.05], y ∈ [0, 0.45]. Arc s: up the front (s = y), then back across the top.
 */
function frontAndTop() {
  const at = (s: number): RopePlace => (s <= 0.5 ? { p: [0, s, 0.1], facet: 0, n: [0, 0, 1] } : { p: [0, 0.5, 0.1 - (s - 0.5)], facet: 1, n: [0, 1, 0] });
  const land = (q: RopePlace): Landing | null => {
    if (q.facet === 0) return q.p[1] <= 0.45 ? { point: [0, q.p[1], 0.05], host: "box" } : null; // nothing behind the strip above the box
    return q.p[2] <= 0.05 && q.p[2] >= -0.1 ? { point: [0, 0.45, q.p[2]], host: "box" } : null;
  };
  return { at, land };
}
const onBox = (p: Vec3) => (Math.abs(p[2] - 0.05) < 1e-9 && p[1] <= 0.45 + 1e-9) || (Math.abs(p[1] - 0.45) < 1e-9 && p[2] <= 0.05 + 1e-9);

describe("⭐⭐⭐ §29 THE ROPE — the sections tightened round the assembly, the gizmo on them", () => {
  it("⭐⭐⭐ R2 — A STEP (a face parallel to the cast, the red part's bottom seen from the front): the rope draws it along the normal; the gizmo JUMPS across it (the owner: *\"jump across the bottom segment\"*) — never a diagonal through the air", () => {
    const { at, land } = front((x) => (x < 0.05 ? 0.08 : 0.02));
    const r = buildRope(at, land, -0.3, 0.3, STEP, 10);
    // the corner at the step: the proud landing's place at the deeper depth
    expect(r.verts.some((v, i) => i > 0 && Math.abs(v.p[0] - 0.05) < 0.0003 && Math.abs(v.p[2] - 0.02) < 1e-9 && r.verts[i - 1]!.p[2] === 0.08 && r.verts[i - 1]!.p[0] === v.p[0])).toBe(true);
    // every drawn segment along the face (z constant) or along the normal (x constant): no diagonal
    const d = ropeDrawn(r);
    for (let i = 1; i < d.length; i++) {
      const a = d[i - 1]!.p;
      const b = d[i]!.p;
      expect(Math.abs(a[2] - b[2]) < 1e-9 || Math.abs(a[0] - b[0]) < 1e-12).toBe(true);
    }
    // the gizmo: on the proud face just before, on the deeper face just after — a jump, no slide down the step
    expect(ropeAt(r, 0.0495)!.p[2]).toBeCloseTo(0.08, 9);
    expect(ropeAt(r, 0.0505)!.p[2]).toBeCloseTo(0.02, 9);
  });

  it("⭐⭐⭐ R3 — A VOID THE LINE CROSSES (closed along it): the rope straight across, the gizmo travelling OVER it at the track's pace (⛔ `f622b31`: a gap open at the face's edge — the gizmo waited)", () => {
    const { at, land } = front((x) => (x > 0.1 && x < 0.2 ? null : 0.02));
    const r = buildRope(at, land, -0.3, 0.3, STEP, 10);
    for (const s of [0.11, 0.13, 0.15, 0.17, 0.19]) {
      const g = ropeAt(r, s)!;
      expect(g.p[0]).toBeCloseTo(s, 3);
      expect(g.p[2]).toBeCloseTo(0.02, 9);
      expect(g.overVoid).toBe(true);
    }
    expect(ropeAt(r, 0.05)!.overVoid).toBe(false);
  });

  it("⭐⭐⭐ R3 + R5 — A VOID AT THE EDGE (the strip of shell beyond the box's top, nothing behind it): the rope ROUNDS THE EDGE — every drawn point on the box, none hanging in the air — and the gizmo NEVER WAITS: it slows round the corner (at least MIN_PACE of the track there) and is exactly the landing outside the window", () => {
    const { at, land } = frontAndTop();
    const r = buildRope(at, land, -0.2, 1.0, STEP, 10);
    for (const q of ropeDrawn(r)) expect(onBox(q.p)).toBe(true);
    let prev = ropeAt(r, 0.3)!.p;
    for (let s = 0.302; s <= 0.7; s += 0.002) {
      const g = ropeAt(r, s)!.p;
      expect(onBox(g)).toBe(true);
      expect(dist(g, prev)).toBeGreaterThan(0.002 * MIN_PACE * 0.9); // ⛔ `f622b31`: 0 over the strip — the gizmo waited at the corner
      prev = g;
    }
    // outside the window: exactly the landing at the place
    expect(dist(ropeAt(r, 0.2)!.p, [0, 0.2, 0.05])).toBeLessThan(1e-9);
    expect(dist(ropeAt(r, 0.65)!.p, [0, 0.45, 0.1 - 0.15])).toBeLessThan(1e-9);
  });

  it("⭐⭐ R3 — a void reaching the drawn reach's end (the travel held at the shell's edge): its landing looked for on along the loop — the gizmo still moves up to the end; the line drawn only as far as the reach", () => {
    const { at, land } = frontAndTop();
    const r = buildRope(at, land, -0.2, 0.5, STEP, 10);
    expect(Math.max(...ropeDrawn(r).map((q) => q.s))).toBeLessThanOrEqual(0.5 + 1e-9);
    let prev = ropeAt(r, 0.44)!.p;
    for (let s = 0.442; s <= 0.5; s += 0.002) {
      const g = ropeAt(r, s)!.p;
      expect(dist(g, prev)).toBeGreaterThan(0);
      prev = g;
    }
  });

  it("⭐ a slanted face is no step: the rope follows it, no corner inserted", () => {
    const { at, land } = front((x) => 0.05 - 0.5 * Math.max(0, x)); // a 27° slope from x = 0
    const r = buildRope(at, land, -0.2, 0.2, STEP, 10);
    for (const v of r.verts) expect(v.p[2]).toBeCloseTo(0.05 - 0.5 * Math.max(0, v.p[0]), 9);
  });
});
