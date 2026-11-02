/**
 * GOLDEN VECTORS — **THE FACE-SPAN GIZMO** (2026-11-02, `1.0.90-`; `input/face_span.ts`, `render/face_span_wiring.ts`, `FACE_SPAN_2026-11-02.md`).
 *
 * The owner: *"I find it extremely difficult to control the gizmo: the red and green sections have strange contours, sometimes the contours stop somewhere in
 * the face, the gizmo do not follow the delta position input, the gizmo jumps, the protruding parts further complicate the red and green sections, the
 * scene gets slanted vs. the face … once the orbit is tilted to follow a face orientation, the red and green sections do not need to fully circumference the
 * assembly, but they only need to span the hosting coplanar faces"* → the design, then: *"1- Leaving a face: Option B. Design the tilt and catch
 * properly"*, *"2- … make a slider. I prefer to engage as far as reasonably possible"*, *"3- constant gizmo speed, which shall follow the current orbit
 * angular speed on dy and dx"*, *"4- … gizmo following the orbit … I want to keep this behavior"*, *"5- Gizmo shall pass over the protruding part. Blend
 * the movements to avoid jumps"*, *"6- Roll freeze: I liked what was implemented in 65a691a"*.
 *
 * ⭐ Every vector here was shown RED against `8548714` (the module and its wiring did not exist; the centre was read before the world matrices; the roll
 * took the travel first). The geometry is SYNTHETIC on purpose — boxes 3 mm apart (the painting's cores), a 16 mm empty slot (an unplaced piece), a
 * protrusion 41 mm out (Piece45) — so a fixture where the quantity under test is zero cannot pass for one where it is not.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import {
  axisOnScreen,
  closestOnTriangle,
  coveredTop,
  fromP2,
  isWall,
  regionDistance,
  regionRun,
  rideStep,
  SPAN_RELEASE_FACTOR,
  spanAxes,
  spanDirection,
  spanEngaged,
  spanEngageM,
  spanMmOf,
  spanMove,
  spanPlane,
  spanPolyline,
  spanRegion,
  spanShareAfter,
  spanSolids,
  spanStepOf,
  spanUp,
  toP2,
  wrapCandidate,
  wrapTurn,
  type SpanFace,
  type SpanMotion,
  type Tri,
} from "../src/input/face_span";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const near = (a: readonly number[], b: readonly number[]) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, 9));

/** ⭐ A box's six faces (outward normals, two triangles each) — and its closed triangle set. */
function box(lo: Vec3, hi: Vec3): { faces: SpanFace[]; tris: Tri[] } {
  const [x0, y0, z0] = lo;
  const [x1, y1, z1] = hi;
  const q = (a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): SpanFace => ({ normal: n, tris: [[a, b, c], [a, c, d]] });
  const faces = [
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]),
    q([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [0, 0, -1]),
    q([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]),
    q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]),
    q([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]),
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]),
  ];
  return { faces, tris: faces.flatMap((f) => [...f.tris]) };
}

/** ⭐ A "painting": boxes 0.1 m wide, 0.2 m tall, 0.03 m deep, front faces on z = 0 (normal +z), `gaps` between them (m). */
function painting(gaps: number[]): { faces: SpanFace[]; parts: Tri[][]; front: number[] } {
  const faces: SpanFace[] = [];
  const parts: Tri[][] = [];
  const front: number[] = [];
  let x = 0;
  for (let i = 0; i <= gaps.length; i++) {
    const b = box([x, 0, -0.03], [x + 0.1, 0.2, 0]);
    front.push(faces.length);
    faces.push(...b.faces);
    parts.push(b.tris);
    x += 0.1 + (gaps[i] ?? 0);
  }
  return { faces, parts, front };
}

const FRONT = spanPlane([0, 0, 1], [0, 0, 0]);
const P = (x: number, y: number) => toP2(FRONT, [x, y, 0]);

describe("⭐⭐⭐ the region — the hosting coplanar faces, never round the assembly", () => {
  it("⭐ boxes 3 mm apart (the painting's cores) are ONE region; 16 mm apart (an unplaced slot) two", () => {
    const a = painting([0.003, 0.003]);
    expect(spanRegion(a.faces, a.front[0]!, FRONT)!.members).toEqual(a.front);
    const b = painting([0.003, 0.016]);
    expect(spanRegion(b.faces, b.front[0]!, FRONT)!.members).toEqual(b.front.slice(0, 2));
  });
  it("⭐ distance 0 inside, across a joint too; positive beyond the edge (by the joint's half-width less)", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    expect(regionDistance(r, P(0.05, 0.1))).toBe(0);
    expect(regionDistance(r, P(0.1015, 0.1))).toBe(0); // in the 3 mm joint
    expect(regionDistance(r, P(0.3102, 0.1))).toBeCloseTo(0.0026, 6); // 4.2 mm past the last edge less the 1.6 mm grow
  });
  it("⛔⛔ THE LINES NEVER STOP INSIDE THE FACE: the run through the gizmo spans the region edge to edge across every joint; it stops at a hole's edge", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const g = P(0.05, 0.1);
    const d = toP2(FRONT, [1, 0, 0]);
    const run = regionRun(r, g, [d[0], d[1]]);
    const ends = [fromP2(FRONT, [g[0] + d[0] * run[0], g[1] + d[1] * run[0]])[0], fromP2(FRONT, [g[0] + d[0] * run[1], g[1] + d[1] * run[1]])[0]].sort((x, y) => x - y);
    expect(ends[0]).toBeCloseTo(-0.0016, 5);
    expect(ends[1]).toBeCloseTo(0.306 + 0.0016, 5);
    const up = toP2(FRONT, [0, 1, 0]);
    const v = regionRun(r, g, [up[0], up[1]]);
    expect(v[1] - v[0]).toBeCloseTo(0.2 + 0.0032, 5);
    // a hole (a missing middle piece): the run stops at its edge
    const b = painting([0.12, 0.003]);
    const rb = spanRegion(b.faces, b.front[0]!, FRONT)!;
    const rr = regionRun(rb, g, [d[0], d[1]]);
    expect(Math.max(...[rr[0], rr[1]].map((t) => fromP2(FRONT, [g[0] + d[0] * t, g[1] + d[1] * t])[0]))).toBeCloseTo(0.1016, 5);
  });
});

describe("⭐⭐⭐ the gizmo's step — the orbit's own, constant, clamped, caught at the edge", () => {
  it("⭐⭐ constant speed: the orbit's angle × the assembly's radius, on a wall and on a top alike (no per-face pace)", () => {
    const wall = spanStepOf(0.1, 0, 0.283, [1, 0, 0], [0, 1, 0]);
    const top = spanStepOf(0.1, 0, 0.283, [0, 0, 1], [1, 0, 0]);
    expect(Math.hypot(...wall)).toBeCloseTo(0.0283, 12);
    expect(Math.hypot(...top)).toBeCloseTo(0.0283, 12);
    expect(Math.hypot(...spanStepOf(0.06, 0.08, 0.283, [1, 0, 0], [0, 1, 0]))).toBeCloseTo(0.0283, 12);
    expect(spanMmOf((5.1 * Math.PI) / 180, 0, 5.1)).toBeCloseTo(1, 12); // the step read back as the finger's mm at the orbit's pace
  });
  it("⭐⭐⭐ the gizmo FOLLOWS THE ORBIT (the owner's 65a691a): its axes are where the orbit's yaw and pitch steps moved it — each keeping its sense", () => {
    // front face looking along −n = −z; the orbit's yaw step +x, its pitch step +y: the gizmo the same way
    const a = spanAxes([0, 0, 1], [1, 0, 0], [0, 1, 0], [1, 0, 0], [0, 1, 0]);
    expect(a.eYaw).toEqual([1, 0, 0]);
    expect(a.ePitch).toEqual([0, 1, 0]);
    // the orbit's steps reversed (its signs, `asmSign`, are the finger's): the axes reversed — never re-signed by the screen at the engage
    const b = spanAxes([0, 0, 1], [-1, 0, 0], [0, -1, 0], [1, 0, 0], [0, 1, 0]);
    near(b.eYaw, [-1, 0, 0]);
    near(b.ePitch, [0, -1, 0]);
  });
  it("⭐ VERTICALS RESPECTED: on a wall the axes are levelled (horizontal / the wall's up), their senses kept; a top keeps the orbit's", () => {
    const s = Math.SQRT1_2;
    const a = spanAxes([0, 0, 1], [s, s, 0], [-s, s, 0], [1, 0, 0], [0, 1, 0]);
    expect(a.eYaw[0]).toBeCloseTo(1, 12);
    expect(a.eYaw[1]).toBeCloseTo(0, 12);
    expect(a.ePitch[1]).toBeCloseTo(1, 12);
    expect(isWall([0, 0, 1])).toBe(true);
    expect(isWall([0, 1, 0])).toBe(false);
    const t = spanAxes([0, 1, 0], [s, 0, s], [-s, 0, s], [1, 0, 0], [0, 0, 1]);
    expect(t.eYaw[0]).toBeCloseTo(s, 12);
    expect(t.eYaw[2]).toBeCloseTo(s, 12);
  });
  it("⭐⭐ clamped to the region: a push past the edge holds it ON the edge, slides along it, and is CAUGHT (mm of finger); one step back moves at once", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const dist = (p: readonly [number, number]) => regionDistance(r, p);
    const none = () => null;
    const m0: SpanMotion = { at: P(0.3, 0.1), overMm: 0, wrap: null };
    const right = toP2(FRONT, [0.02, 0.01, 0]);
    const m1 = spanMove(m0, right, 2, dist, 3, 18, none);
    const x1 = fromP2(FRONT, m1.motion.at);
    expect(x1[0]).toBeCloseTo(0.3076, 6); // on the edge (0.306 + the grow)
    expect(x1[1]).toBeCloseTo(0.11, 9); // slid along it
    expect(m1.motion.overMm).toBeCloseTo((2 * 0.0124) / Math.hypot(0.02, 0.01), 9); // the refused share of the step's 2 mm
    const m2 = spanMove(m1.motion, right, 4, dist, 3, 18, none);
    expect(m2.held).toBe(true); // caught, nothing across: the edge holds
    expect(m2.motion.overMm).toBe(3);
    const back = spanMove(m2.motion, toP2(FRONT, [-0.01, 0, 0]), 1, dist, 3, 18, none);
    expect(fromP2(FRONT, back.motion.at)[0]).toBeCloseTo(0.2976, 6);
    expect(back.motion.overMm).toBe(0);
  });
  it("⭐⭐⭐ THE WRAP: past the catch the face across is asked for; its share is the finger's travel along the push over the turn; back to 0 returns, 1 commits", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const dist = (p: readonly [number, number]) => regionDistance(r, p);
    const cand = { index: 5, normal: [1, 0, 0] as Vec3, kind: "CONVEX" as const, dist: 0 };
    const right = toP2(FRONT, [0.01, 0, 0]);
    let m: SpanMotion = { at: P(0.3076, 0.1), overMm: 0, wrap: null }; // on the edge
    m = spanMove(m, right, 2, dist, 3, 18, () => cand).motion;
    expect(m.wrap).toBeNull(); // 2 mm caught
    expect(m.overMm).toBeCloseTo(2, 9);
    const w = spanMove(m, right, 10, dist, 3, 18, () => cand);
    expect(w.motion.wrap).not.toBeNull();
    expect(w.motion.wrap!.share).toBeCloseTo((2 + 10 - 3) / 18, 9);
    const back = spanMove(w.motion, toP2(FRONT, [-0.01, 0, 0]), 20, dist, 3, 18, () => cand);
    expect(back.motion.wrap).toBeNull(); // pushed back: onto this face again, the edge point kept
    expect(back.motion.at).toEqual(w.motion.at);
    const on = spanMove(w.motion, right, 9, dist, 3, 18, () => cand);
    expect(on.commit).toBe(true);
  });
});

describe("⭐⭐⭐ the edge — the face across (convex, concave), the turn", () => {
  it("⭐ convex: at the top edge pushing up, the boxes' TOP faces; at an inner corner a wall standing on the plane; nothing: null", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const ex = new Set(r.members);
    const top = wrapCandidate(a.faces, ex, [0.05, 0.2016, 0], [0, 0, 1], [0, 1, 0]);
    expect(top!.kind).toBe("CONVEX");
    expect(top!.normal).toEqual([0, 1, 0]);
    // a tall wall standing on the front plane just right of the painting (an inner corner)
    const wall = box([0.307, 0, 0], [0.33, 0.2, 0.1]);
    const faces = [...a.faces, ...wall.faces];
    const inner = wrapCandidate(faces, ex, [0.3076, 0.1, 0], [0, 0, 1], [1, 0, 0]);
    expect(inner!.kind).toBe("CONCAVE");
    expect(inner!.normal).toEqual([-1, 0, 0]);
    expect(wrapCandidate(a.faces.slice(0, 1), new Set([0]), [0.05, 0.2016, 0], [0, 0, 1], [0, 1, 0])).toBeNull();
  });
  it("⭐ the turn: the normal onto the next one about the edge; the piece's direction turned by the wrap's share, slerped from the far orbit's at the engage", () => {
    const t = wrapTurn([0, 0, 1], [0, 1, 0])!;
    expect(t.angle).toBeCloseTo(Math.PI / 2, 12);
    const half = spanDirection([0, 0, 1], { ...t, share: 0.5 }, null, 1);
    expect(half[1]).toBeCloseTo(Math.SQRT1_2, 9);
    expect(half[2]).toBeCloseTo(Math.SQRT1_2, 9);
    const u0: Vec3 = [1, 0, 0];
    expect(spanDirection([0, 0, 1], null, u0, 0)).toEqual(u0);
    const mid = spanDirection([0, 0, 1], null, u0, 0.5);
    expect(mid[0]).toBeCloseTo(Math.SQRT1_2, 9);
    expect(spanDirection([0, 0, 1], null, u0, 1)).toEqual([0, 0, 1]);
  });
  it("⭐ the closest point on a triangle (Ericson): a vertex, an edge, the inside", () => {
    const t: Tri = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
    expect(closestOnTriangle([-1, -1, 0], t)).toEqual([0, 0, 0]);
    expect(closestOnTriangle([0.5, -1, 0], t)).toEqual([0.5, 0, 0]);
    near(closestOnTriangle([0.2, 0.2, 3], t), [0.2, 0.2, 0]);
  });
});

describe("⭐⭐⭐ the protrusion — ridden over, blended (the owner's item 5)", () => {
  const a = painting([0.003, 0.003]);
  // Piece45: 41 mm out, seated one contour margin (1.5 mm) off the face
  const p45 = box([0.12, 0.05, 0.0015], [0.18, 0.15, 0.041]);
  // a part across a 16 mm gap in front (never touching the plane): not a protrusion
  const far = box([0.22, 0.05, 0.016], [0.26, 0.15, 0.06]);
  const solids = spanSolids(FRONT, [...a.parts, p45.tris, far.tris]);
  it("⭐ the frontmost height: the protrusion's top over it, the plane off it; ⛔ a part not touching the plane is no protrusion (the gizmo leapt across a slot)", () => {
    expect(solids.length).toBe(1);
    expect(coveredTop(solids, P(0.15, 0.1))).toBeCloseTo(0.041, 9);
    expect(coveredTop(solids, P(0.05, 0.1))).toBe(0);
    expect(coveredTop(solids, P(0.24, 0.1))).toBe(0);
  });
  it("⭐ the line over it: through the gizmo exactly, its step a near-vertical connector — never a stray segment", () => {
    const g = P(0.05, 0.1);
    const d = toP2(FRONT, [1, 0, 0]);
    const pts = spanPolyline(solids, g, [d[0], d[1]], -0.05, 0.25, 0.004);
    expect(pts.some(([t]) => t === 0)).toBe(true);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]![0]).toBeGreaterThan(pts[i - 1]![0]);
      const dh = Math.abs(pts[i]![1] - pts[i - 1]![1]);
      if (dh > 0.001) expect(pts[i]![0] - pts[i - 1]![0]).toBeLessThan(0.0002);
    }
    expect(Math.max(...pts.map((p) => p[1]))).toBeCloseTo(0.041, 9);
  });
  it("⭐ the ride eased by the finger's travel (no jump), and by time at rest", () => {
    const one = rideStep(0, 0.041, 0.25, 3, 16, false);
    expect(one).toBeGreaterThan(0);
    expect(one).toBeLessThan(0.041 * 0.25);
    let h = 0;
    for (let i = 0; i < 4; i++) h = rideStep(h, 0.041, 1, 3, 16, false);
    expect(h).toBeGreaterThan(0.041 * 0.95);
    expect(rideStep(0.041, 0, 0, 3, 300, true)).toBeLessThan(0.041 * 0.06);
    expect(rideStep(0.02, 0.041, 0, 3, 16, false)).toBe(0.02); // no travel, no time: held
  });
});

describe("⭐⭐ engage, release, the screen", () => {
  it("⭐ engage within the slider's distance, out only past 1.2 × it; the slider held so the far orbit stays reachable", () => {
    expect(SPAN_RELEASE_FACTOR).toBe(1.2);
    expect(spanEngaged(false, 4.5, 4.5)).toBe(true);
    expect(spanEngaged(false, 4.6, 4.5)).toBe(false);
    expect(spanEngaged(true, 5.3, 4.5)).toBe(true);
    expect(spanEngaged(true, 5.5, 4.5)).toBe(false);
    expect(spanEngageM(4.5, 6)).toBe(4.5);
    expect(spanEngageM(6, 6) * SPAN_RELEASE_FACTOR).toBeLessThan(6);
  });
  it("⭐ the engage's and the wrap's shares by travel, whole at once with a zero span, by time at rest", () => {
    expect(spanShareAfter(0, 9, 18, 16, false)).toBeCloseTo(0.5, 12);
    expect(spanShareAfter(0, 0, 0, 0, false)).toBe(1);
    expect(spanShareAfter(0, 0, 18, 150, true)).toBeCloseTo(0.5, 12);
  });
  it("⭐ the screen's up: a wall's the world's; a top's the up carried in, laid on it", () => {
    expect(spanUp([0, 0, 1], [0.3, 0.9, 0.1])).toEqual([0, 1, 0]);
    const u = spanUp([0, 1, 0], [0, 0.2, 0.9]);
    expect(u[2]).toBeCloseTo(1, 12);
  });
  it("⭐ at rest an axis read off the screen as the orbit's own rule does (after a roll the finger moves the gizmo the screen's way)", () => {
    near(axisOnScreen([1, 0, 0], 1, [-1, 0, 0]), [-1, 0, 0]);
    expect(axisOnScreen([1, 0, 0], -1, [-1, 0, 0])).toEqual([1, 0, 0]);
    expect(axisOnScreen([1, 0, 0], 1, [0.1, 1, 0])).toEqual([1, 0, 0]); // near square: kept
  });
});

describe("⭐⭐⭐ wired", () => {
  it("⭐ the assembly's centre from the placed parts' vertices on their MODEL poses (⛔ bounding boxes read before the world matrices: (0, 0, 0), 0.2415)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const box = placedVertexBox(st) ?? placedBox(st);");
    expect(a).toContain("const vs = placedParts(st).parts.flat();");
  });
  it("⭐⭐ the face-span in the frame: engaged within the slider's distance from the far gizmo's face, released past 1.2 ×, the piece along its direction, the gizmo its point", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const engageM = spanEngageM(st.cfg.faceSpanEngageM, farDistance(st.cfg));");
    expect(a).toContain("if (st.span !== null && st.span.motion.wrap === null && !spanEngaged(true, d, engageM)) spanRelease(st);");
    expect(a).toContain("if (spanEngage(st, st.asmG, st.gizmoNormal ?? null, st.gizmoHost ?? null, u, st.pieceQ)) {");
    expect(a).toContain("if (st.span !== null) return st.span.w;");
    expect(a).toContain("if (st.span !== null) return st.span.g;");
    expect(a).toContain("if (st.span !== null) return st.span.up;");
    // no view governor in the face-span (its step turns no view); the far sections' drops bridged
    expect(a).toContain("if (!assemblyOn(st) || st.asmUp === null || st.span !== null) return 1;");
    expect(a).toContain("const h = castCovered(st, r);");
    // the orbit's place held, no solve, while the face-span reads its step
    expect(code("render/green_box_wiring.ts")).toContain("} else if (st.span !== null) {");
    const w = code("render/face_span_wiring.ts");
    expect(w).toContain("st.orbit.reset(q.yaw, q.v);");
    expect(w).toContain("const stepW = spanStepOf(dYaw, dPitch, st.asm.radius, sp.eYaw, sp.ePitch);");
  });
  it("⭐ the sliders (CAMERA ORBIT AROUND CENTER) and their defaults", () => {
    const m = code("render/tuning_menu.ts");
    for (const k of ["faceSpanEngageM", "faceSpanCatchMm", "faceSpanTurnMm", "faceSpanRideMm"]) expect(m).toContain(`"${k}"`);
    const c = code("input/gestureConfig.ts");
    expect(c).toContain("faceSpanEngageM: 4.5,");
    expect(c).toContain("faceSpanCatchMm: 3,");
    expect(c).toContain("faceSpanTurnMm: 18,");
    expect(c).toContain("faceSpanRideMm: 3,");
  });
});
