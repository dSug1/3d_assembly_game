/**
 * GOLDEN VECTORS — **THE FACE-SPAN GIZMO** (2026-11-02, `1.0.90-`; `input/face_span.ts`, `render/face_span_wiring.ts`, `FACE_SPAN_2026-11-02.md`).
 *
 * The owner: *"I find it extremely difficult to control the gizmo … once the orbit is tilted to follow a face orientation, the red and green sections do not
 * need to fully circumference the assembly, but they only need to span the hosting coplanar faces"* → the first build (`3286ed5`); then, on the device:
 * *"1- I don't want sliding, I want orbit … I want to keep what was done for commit ff2fca2 in terms of gizmo leading … Tilting the face and face-span should
 * not impact the behavior of the gizmo and the behavior of the piece and the camera relative to the gizmo"*, *"2- do the roll as it was previously implemented
 * on branch 1.0.83"*, *"4- slide shall latch only on placed parts"*, *"5- slanted parts should stay faces the gizmo can stand on. implement the fix"*,
 * *"6- screen direction shall win"*.
 *
 * ⭐ The first pass's vectors were shown RED against `8548714`; the second pass's against `3286ed5` (the gizmo moved by the held orbit's step, the piece
 * along the face's normal, the wrap turned about the edge, the glued small face of a frustum taken as the face across, any body a slide's host, the roll's
 * time only with no finger). The geometry is SYNTHETIC on purpose — boxes 3 mm apart (the painting's cores), a 16 mm empty slot, a protrusion 41 mm out
 * (Piece45), a frustum glued under a box (Piece43) — so a fixture where the quantity under test is zero cannot pass for one where it is not.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import {
  closestOnTriangle,
  coveredTop,
  fromP2,
  gluedPartners,
  hiddenGlued,
  isWall,
  regionDistance,
  regionRun,
  rideStep,
  SPAN_RELEASE_FACTOR,
  spanEngaged,
  spanEngageM,
  spanMmOf,
  spanMove,
  spanPlane,
  spanPolyline,
  spanRegion,
  spanSolids,
  spanStepFromDir,
  toP2,
  wrapCandidate,
  zenithCrossing,
  zenithRollStep,
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


describe("⭐⭐⭐ the gizmo's step — the ORBIT's solved step (ff2fca2's relation), clamped, caught at the edge", () => {
  const deg = Math.PI / 180;
  const dir = (yawDeg: number, pitchDeg: number): Vec3 => [Math.cos(pitchDeg * deg) * Math.sin(yawDeg * deg), Math.sin(pitchDeg * deg), Math.cos(pitchDeg * deg) * Math.cos(yawDeg * deg)];
  it("⭐⭐⭐ the gizmo goes the way the piece's direction went — the angle × the assembly's radius along the step laid on the face (constant speed)", () => {
    const s = spanStepFromDir(dir(0, 0), dir(5, 0), [0, 0, 1], 0.283);
    expect(Math.hypot(...s)).toBeCloseTo(5 * deg * 0.283, 9);
    expect(s[0]).toBeGreaterThan(0); // the piece's direction swung toward +x: the gizmo too
    expect(Math.abs(s[1])).toBeLessThan(1e-12);
    // off the face's normal (the piece 40° to the side) the same angle moves the gizmo as far: no per-face pace
    expect(Math.hypot(...spanStepFromDir(dir(40, 0), dir(45, 0), [0, 0, 1], 0.283))).toBeCloseTo(5 * deg * 0.283, 9);
    const up = spanStepFromDir(dir(0, 0), dir(0, 3), [0, 0, 1], 0.283);
    expect(up[1]).toBeCloseTo(3 * deg * 0.283, 6);
    expect(spanStepFromDir(dir(0, 0), dir(0, 0), [0, 0, 1], 0.283)).toEqual([0, 0, 0]);
    expect(spanMmOf((5.1 * Math.PI) / 180, 0, 5.1)).toBeCloseTo(1, 12);
  });
  it("⭐⭐ clamped to the region: a push past the edge holds it ON the edge, slides along it, and is CAUGHT (mm of finger); one step back moves at once", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const dist = (p: readonly [number, number]) => regionDistance(r, p);
    const none = () => null;
    const m0: SpanMotion = { at: P(0.3, 0.1), overMm: 0 };
    const right = toP2(FRONT, [0.02, 0.01, 0]);
    const m1 = spanMove(m0, right, 2, dist, 3, none);
    const x1 = fromP2(FRONT, m1.motion.at);
    expect(x1[0]).toBeCloseTo(0.3076, 6); // on the edge (0.306 + the grow)
    expect(x1[1]).toBeCloseTo(0.11, 9); // slid along it
    expect(m1.motion.overMm).toBeCloseTo((2 * 0.0124) / Math.hypot(0.02, 0.01), 9);
    const m2 = spanMove(m1.motion, right, 4, dist, 3, none);
    expect(m2.held).toBe(true); // caught, nothing across: the edge holds
    expect(m2.motion.overMm).toBe(3);
    const back = spanMove(m2.motion, toP2(FRONT, [-0.01, 0, 0]), 1, dist, 3, none);
    expect(fromP2(FRONT, back.motion.at)[0]).toBeCloseTo(0.2976, 6);
    expect(back.motion.overMm).toBe(0);
  });
  it("⭐⭐⭐ past the catch the gizmo goes onto the face across AT ONCE — no wrap left pending (the piece and the camera are the orbit's: nothing turns about the edge)", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const dist = (p: readonly [number, number]) => regionDistance(r, p);
    const cand = { index: 5, normal: [1, 0, 0] as Vec3, kind: "CONVEX" as const, dist: 0 };
    const right = toP2(FRONT, [0.01, 0, 0]);
    const m1 = spanMove({ at: P(0.3076, 0.1), overMm: 0 }, right, 2, dist, 3, () => cand);
    expect(m1.next).toBeNull();
    const m2 = spanMove(m1.motion, right, 2, dist, 3, () => cand);
    expect(m2.next).toEqual(cand);
    expect(m2.motion.overMm).toBe(0);
  });
});

describe("⭐⭐⭐ the edge — the face across (convex, concave), glued faces", () => {
  it("⭐ convex: at the top edge pushing up, the boxes' TOP faces; at an inner corner a wall standing on the plane; nothing: null", () => {
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const ex = new Set(r.members);
    const top = wrapCandidate(a.faces, ex, [0.05, 0.2016, 0], [0, 0, 1], [0, 1, 0]);
    expect(top!.kind).toBe("CONVEX");
    expect(top!.normal).toEqual([0, 1, 0]);
    const wall = box([0.307, 0, 0], [0.33, 0.2, 0.1]);
    const faces = [...a.faces, ...wall.faces];
    const inner = wrapCandidate(faces, ex, [0.3076, 0.1, 0], [0, 0, 1], [1, 0, 0]);
    expect(inner!.kind).toBe("CONCAVE");
    expect(inner!.normal).toEqual([-1, 0, 0]);
    expect(wrapCandidate(a.faces.slice(0, 1), new Set([0]), [0.05, 0.2016, 0], [0, 0, 1], [0, 1, 0])).toBeNull();
  });
  // ⭐ a frustum glued (1.5 mm off) under a wide box — Piece43 under Piece19: its small face up against the box's bottom
  const base = box([-0.1, 0, -0.05], [0.1, 0.05, 0]);
  const t = 0.0015;
  const sm = 0.02;
  const wd = 0.04;
  const h = 0.04;
  const top: Vec3[] = [[-sm, -t, -0.04], [sm, -t, -0.04], [sm, -t, -0.01], [-sm, -t, -0.01]];
  const bot: Vec3[] = [[-wd, -t - h, -0.04], [wd, -t - h, -0.04], [wd, -t - h, -0.01], [-wd, -t - h, -0.01]];
  const quad = (p: Vec3[], idx: number[]): Tri[] => [[p[idx[0]!]!, p[idx[1]!]!, p[idx[2]!]!], [p[idx[0]!]!, p[idx[2]!]!, p[idx[3]!]!]];
  const unit = (v: Vec3): Vec3 => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };
  const all = [...top, ...bot];
  const fr: SpanFace[] = [
    { normal: [0, 1, 0], tris: quad(all, [0, 3, 2, 1]) }, // the small face, glued
    { normal: [0, -1, 0], tris: quad(all, [4, 5, 6, 7]) },
    { normal: unit([h, wd - sm, 0]), tris: quad(all, [1, 2, 6, 5]) }, // the +x slanted side
    { normal: unit([-h, wd - sm, 0]), tris: quad(all, [0, 4, 7, 3]) },
    { normal: [0, 0, -1], tris: quad(all, [0, 1, 5, 4]) },
    { normal: [0, 0, 1], tris: quad(all, [3, 7, 6, 2]) },
  ];
  const faces = [...base.faces, ...fr];
  const owner = [...base.faces.map(() => "box"), ...fr.map(() => "frustum")];
  it("⭐⭐ GLUED: the frustum's small face is pressed against the box's bottom (and the bottom against it) — no other face is", () => {
    const p = gluedPartners(faces, owner);
    expect(p[6]).toBe(3); // the small face → the box's bottom (index 3)
    expect(p[3]).toBe(6);
    expect(p.filter((x) => x >= 0).length).toBe(2);
  });
  it("⭐⭐ which of a glued pair is HIDDEN: the one whose coplanar region is the smaller — the face a part stands on stays (⛔ the smaller FACE: Piece43's top is wider than Piece19's bottom)", () => {
    const p = gluedPartners(faces, owner);
    const area = (i: number) => (i === 3 ? 0.2 : i === 6 ? 0.0036 : 0.01); // the box's bottom a large region, the small face alone
    const h = hiddenGlued(p, area);
    expect(h[6]).toBe(true);
    expect(h[3]).toBe(false);
    expect(hiddenGlued([1, 0], () => 1)).toEqual([true, true]); // two neighbours' touching sides: both
  });
  it("⛔⛔ OFF A FRUSTUM'S SLANTED SIDE toward the part it stands on: the box's bottom (the glued small face's partner) — ⛔ the frustum's own hidden face, round and round", () => {
    const p = gluedPartners(faces, owner);
    const side = fr[2]!;
    const n = side.normal;
    // the side's top edge (y = −t, x = sm), pushing up along the side
    const B: Vec3 = [sm, -t, -0.025];
    const Dv = [-n[1], n[0], 0] as Vec3; // in the side's plane, toward +y
    const D: Vec3 = Dv[1] > 0 ? Dv : [-Dv[0], -Dv[1], 0];
    const without = wrapCandidate(faces, new Set([8]), B, n, D);
    expect(without!.index).toBe(6); // the old answer: the glued small face itself
    const c = wrapCandidate(faces, new Set([8]), B, n, D, undefined, p.map((x, i) => (hiddenGlued(p, (j) => (j === 3 ? 0.2 : 0.004))[i] ? x : -1)));
    expect(c!.index).toBe(3);
    expect(c!.normal).toEqual([0, -1, 0]);
  });
  it("⭐ a concave face is judged NEAR the edge: a face straddling the plane far from it is not refused for that", () => {
    // a wall at the region's right edge: in front of the plane near the edge, reaching far BEHIND it 30 cm away (it straddles the plane)
    const a = painting([0.003, 0.003]);
    const r = spanRegion(a.faces, a.front[0]!, FRONT)!;
    const wall: SpanFace = { normal: [-1, 0, 0], tris: [[[0.308, 0.09, 0], [0.308, 0.11, 0], [0.308, 0.11, -0.3]], [[0.308, 0.09, 0], [0.308, 0.11, -0.3], [0.308, 0.09, -0.3]], [[0.308, 0.09, 0], [0.308, 0.11, 0.1], [0.308, 0.11, 0]]] };
    const c = wrapCandidate([...a.faces.slice(0, 24), wall], new Set(r.members), [0.3076, 0.1, 0], [0, 0, 1], [1, 0, 0]);
    expect(c).not.toBeNull();
  });
  it("⭐ the closest point on a triangle (Ericson): a vertex, an edge, the inside", () => {
    const tr: Tri = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
    expect(closestOnTriangle([-1, -1, 0], tr)).toEqual([0, 0, 0]);
    expect(closestOnTriangle([0.5, -1, 0], tr)).toEqual([0.5, 0, 0]);
    near(closestOnTriangle([0.2, 0.2, 3], tr), [0.2, 0.2, 0]);
  });
});

describe("⭐⭐⭐ the top face's roll at the zenith — branch 1.0.83's pause", () => {
  const n: Vec3 = [0, 1, 0];
  const e: Vec3 = [0, 0, 1];
  const d = (z: number): Vec3 => { const l = Math.hypot(z, 1); return [0, 1 / l, z / l]; };
  it("⭐ a step across the zenith: where (its share) and onto which side; none away from it, none leaving it, none outside the cone", () => {
    const c = zenithCrossing(d(-0.1), d(0.1), n, e)!;
    expect(c.k).toBeCloseTo(0.5, 9);
    expect(c.side).toBe(1);
    expect(zenithCrossing(d(0.1), d(-0.3), n, e)!.side).toBe(-1);
    expect(zenithCrossing(d(0.1), d(0.2), n, e)).toBeNull();
    expect(zenithCrossing(d(0), d(0.2), n, e)).toBeNull();
    expect(zenithCrossing([1, 0.1, -0.1], [1, 0.1, 0.1], n, e)).toBeNull(); // crossing far below the cone (looking along the face)
  });
  it("⭐⭐ the roll's share by the travel along the axis over the half turn's millimetres — linear, reversible, the travel left over once it lands", () => {
    expect(zenithRollStep(0, 8, 16)).toEqual({ share: 0.5, leftMm: 0 });
    expect(zenithRollStep(0.5, -4, 16)).toEqual({ share: 0.25, leftMm: 0 });
    const end = zenithRollStep(0.9, 4, 16);
    expect(end.share).toBe(1);
    expect(end.leftMm).toBeCloseTo(2.4, 9);
    expect(zenithRollStep(0.1, -4, 16).share).toBe(0);
    expect(zenithRollStep(0.3, 0, 16)).toEqual({ share: 0.3, leftMm: 0 }); // a dx: held mid-roll
    expect(isWall([0, 1, 0])).toBe(false);
    expect(isWall([0.847, -0.531, 0])).toBe(true); // a frustum's slanted side is a wall: it never rolls
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

describe("⭐⭐ engage, release", () => {
  it("⭐ engage within the slider's distance, out only past 1.2 × it; the slider held so the far orbit stays reachable", () => {
    expect(SPAN_RELEASE_FACTOR).toBe(1.2);
    expect(spanEngaged(false, 4.5, 4.5)).toBe(true);
    expect(spanEngaged(false, 4.6, 4.5)).toBe(false);
    expect(spanEngaged(true, 5.3, 4.5)).toBe(true);
    expect(spanEngaged(true, 5.5, 4.5)).toBe(false);
    expect(spanEngageM(4.5, 6)).toBe(4.5);
    expect(spanEngageM(6, 6) * SPAN_RELEASE_FACTOR).toBeLessThan(6);
  });
});

describe("⭐⭐⭐ wired", () => {
  it("⭐ the assembly's centre from the placed parts' vertices on their MODEL poses (⛔ bounding boxes read before the world matrices: (0, 0, 0), 0.2415)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const box = placedVertexBox(st) ?? placedBox(st);");
    expect(a).toContain("const vs = placedParts(st).parts.flat();");
  });
  it("⭐⭐⭐ the ORBIT runs in the face-span (ff2fca2's relation): never held, the piece on its direction, the gizmo moved by its SOLVED step; engaged / released by the slider", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const engageM = spanEngageM(st.cfg.faceSpanEngageM, farDistance(st.cfg));");
    expect(a).toContain("if (st.span !== null && !spanEngaged(true, d, engageM)) spanRelease(st);");
    expect(a).toContain("if (spanEngage(st, st.asmG, st.gizmoNormal ?? null, u)) {");
    expect(a).not.toContain("return st.span.w");
    expect(a).toContain("if (st.span !== null) return st.span.g;");
    expect(a).toContain("if (!assemblyOn(st) || st.asmUp === null) return 1;"); // the governor as far out
    expect(a).toContain("const h = castCovered(st, r);");
    expect(code("render/green_box_wiring.ts")).not.toContain("} else if (st.span !== null) {"); // no hold: the solver runs
    const w = code("render/face_span_wiring.ts");
    expect(w).not.toContain("st.orbit.reset(q.yaw, q.v);");
    expect(w).toContain("const step = toPlaneDir(pl, spanStepFromDir(u0, u1, n, st.asm.radius));");
    expect(w).toContain("const u1 = dirOf(q.yaw, q.v);");
  });
  it("⭐⭐⭐ the screen wins on a settled picture — every frame in the face-span, at the release (⛔ `signAfter` carried an inversion out)", () => {
    const w = code("render/face_span_wiring.ts");
    expect(w).toContain("if (sp.zen === null && st.asmRoll === null && facing && !sp.signHold) spanScreenSigns(st, sp.plane.n);");
    // ⭐ facing: the frame's `dir` points from the look point TOWARD the camera (⛔ read as the view's: the rule never ran — measured, the signs stayed inverted)
    expect(w).toContain("const facing = scr !== null && scr.dir[0] * sp.plane.n[0] + scr.dir[1] * sp.plane.n[1] + scr.dir[2] * sp.plane.n[2] >= SPAN_FACING_COS;");
    // ⭐ the one exception: a drag that rolled over a top keeps its sense until the finger lifts
    expect(w).toContain("if (st.router.size === 0) sp.signHold = false;");
    expect(w).not.toContain("signAfter(");
  });
  it("⭐⭐⭐ the zenith's roll: the drag's and the coast's steps, the up within the cone; an unfinished roll completes by time with the finger STILL", () => {
    expect(code("render/pointer_wiring.ts")).toContain("if (asmOn && !shiftApproach) orbitZenithStep(st, yawBefore, vBefore, left);");
    expect(code("render/green_box_wiring.ts")).toContain("orbitZenithCoast(st, y0, v0);");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("if (z !== null) return rollUp(z.from, z.to, u, z.share, z.sense);");
    expect(a).toContain('const still = st.router.size === 0 || (om !== null && om.tracker.axes.x !== "MOVING" && om.tracker.axes.y !== "MOVING");');
  });
  it("⭐⭐ a slide latches on PLACED parts only (⛔ a loose piece hovering beside the painting)", () => {
    expect(code("render/hover_wiring.ts")).toContain("bodiesWithin(st.world, b.name, setup, reachM).filter((x) => goalLocked(x.id, st.goalCommit, true))");
  });
  it("⭐ the sliders (CAMERA ORBIT AROUND CENTER) and their defaults; the lock slider relabelled (it only places the look point now)", () => {
    const m = code("render/tuning_menu.ts");
    for (const k of ["faceSpanEngageM", "faceSpanCatchMm", "faceSpanRollMm", "faceSpanRideMm"]) expect(m).toContain(`"${k}"`);
    expect(m).not.toContain('"faceSpanTurnMm"');
    expect(m).toContain('"camera looks at the gizmo within (m) — the centre beyond", "assemblyLockDistM"');
    const c = code("input/gestureConfig.ts");
    expect(c).toContain("faceSpanEngageM: 4.5,");
    expect(c).toContain("faceSpanCatchMm: 3,");
    expect(c).toContain("faceSpanRollMm: 16,");
    expect(c).toContain("faceSpanRideMm: 3,");
  });
});
