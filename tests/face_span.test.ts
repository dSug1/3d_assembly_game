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
 *
 * ⭐⭐⭐ (2026-11-03, branch `1.0.91-`) **THE SHADOW GIZMO** — the owner: *"I want to make the red and green contours strictly in their respectively single plan
 * which strictly corresponds to the section cut of the assembly by a vertical or horizontal plane … if a overhanging face would be hidden if the camera view
 * was anti-aligned with the normal of the face, the red or green contour shall ignore this face and the gizmo shall behave like a shadow (ie jumping over the
 * discontinuity). Also, a slanted face shall behave as its projection … Also, no tilt of the curve"*; *"a step but the gizmo acts as a break"*; *"the far
 * orbit too"*. The region, the glued faces, the wrap onto any face, the ride and the release are DELETED with their vectors; the shadow's were shown RED
 * against `67893d7` (none of `shadowMap`, `shadowAt`, `shadowRun`, `boxDirs`, `snapDir` existed; the wiring read the solved steps and released far out).
 *
 * ⭐⭐⭐ (2026-11-03, eighth pass) **THE WORLD'S PLANES, THE MAIN FACE** — the owner: *"I do not want sections which plan is not aligned with … the three plans
 * which define x y z axis in world coordinates"*; *"If one face is not connected, it should not be included in the section"*. `boxDirs` deleted (`WORLD_DIRS`),
 * a top's axes the world's x / z, a face cut off by a step deeper than `shadowStepMm` out of the shadow — shown RED against `f8965ff`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import {
  fromP2,
  heightOf,
  isWall,
  SPAN_RELEASE_FACTOR,
  shadowAt,
  shadowDist,
  shadowMap,
  shadowRun,
  snapDir,
  spanEngageM,
  spanMmOf,
  spanMove,
  spanPolyline,
  spanAxisStep,
  faceAxes,
  axisSense,
  greenPaceOf,
  edgeShare,
  shownDir,
  calmWeight,
  toP2,
  zenithCrossing,
  zenithRollStep,
  type SpanFace,
  type SpanMotion,
  type Tri,
  WORLD_DIRS,
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


describe("⭐⭐⭐ (2026-11-03) THE SHADOW — the assembly as seen along a base (the owner: *\"if a overhanging face would be hidden if the camera view was anti-aligned with the normal of the face … the gizmo shall behave like a shadow\"*)", () => {
  const BASE: Vec3 = [0, 0, 1]; // looking at the painting's front (z = 0) from +z
  it("⭐⭐⭐ the frontmost surface: a part in front HIDES the face behind it (an overhang's shadow), a step in it is a JUMP; the plane at the parts' outermost extent", () => {
    const a = painting([0.003, 0.003]);
    const over = box([0, 0.1, 0], [0.1, 0.2, 0.06]); // in front of the first box's upper half
    const low = box([0, 0.05, 0], [0.1, 0.15, 0.03]); // its front half-hidden behind `over` (y 0.10–0.15)
    const m = shadowMap(BASE, [...a.parts, over.tris, low.tris], 0.03)!;
    expect(m.plane.n).toEqual([0, 0, 1]);
    expect(heightOf(m.plane, [0, 0, 0.06])).toBeCloseTo(0, 12); // the plane at the outermost front
    const S = (x: number, y: number) => toP2(m.plane, [x, y, 0]);
    expect(shadowAt(m, S(0.05, 0.12))!.h).toBeCloseTo(0, 9); // `over`'s front — ⛔ never `low`'s (hidden behind it)
    expect(shadowAt(m, S(0.05, 0.07))!.h).toBeCloseTo(-0.03, 9); // `low`'s front below it
    expect(shadowAt(m, S(0.05, 0.02))!.h).toBeCloseTo(-0.06, 9); // the painting's face below both
    expect(shadowAt(m, S(0.15, 0.12))!.h).toBeCloseTo(-0.06, 9); // beside them: the face
  });
  it("⭐⭐⭐ A SLANTED FACE IS ITS PROJECTION: the shadow's height runs linearly up a frustum's slanted side; its triangle's normal (the real face — the quads') turned toward the base", () => {
    const a = painting([]);
    // a wedge on the face: its front slanted from z = 0.04 at y = 0.05 to z = 0 at y = 0.15
    const p: Vec3[] = [[0.02, 0.05, 0], [0.08, 0.05, 0], [0.08, 0.05, 0.04], [0.02, 0.05, 0.04], [0.02, 0.15, 0], [0.08, 0.15, 0]];
    const wedge: Tri[] = [[p[0]!, p[1]!, p[2]!], [p[0]!, p[2]!, p[3]!], [p[3]!, p[2]!, p[5]!], [p[3]!, p[5]!, p[4]!], [p[0]!, p[3]!, p[4]!], [p[1]!, p[5]!, p[2]!], [p[0]!, p[4]!, p[5]!], [p[0]!, p[5]!, p[1]!]];
    const m = shadowMap(BASE, [...a.parts, wedge], 0.03)!;
    const S = (x: number, y: number) => toP2(m.plane, [x, y, 0]);
    const at = (y: number) => shadowAt(m, S(0.05, y))!;
    expect(at(0.075).h - at(0.125).h).toBeCloseTo(0.02, 9); // 0.04 over 0.1: 0.02 over 0.05
    const n = m.tris[at(0.1).tri]!.n;
    expect(n[2]).toBeGreaterThan(0.9); // toward the base
    expect(n[1]).toBeGreaterThan(0.3); // and the slant's own (up)
  });
  it("⭐⭐ GAPS BRIDGED (the slider, 30 mm): 3 mm and 16 mm between cores bridged, 50 mm not; filled to the LOWER side; the outline exact — never grown outward", () => {
    const a = painting([0.003, 0.016, 0.05]);
    const m = shadowMap(BASE, a.parts, 0.03)!;
    const S = (x: number, y: number) => toP2(m.plane, [x, y, 0]);
    expect(shadowAt(m, S(0.1015, 0.1))!.tri).toBe(-1); // the 3 mm joint: a bridge
    expect(shadowAt(m, S(0.1015, 0.1))!.h).toBeCloseTo(0, 9);
    expect(shadowAt(m, S(0.211, 0.1))).not.toBeNull(); // the 16 mm slot
    expect(shadowAt(m, S(0.344, 0.1))).toBeNull(); // the 50 mm gap
    expect(shadowAt(m, S(0.3185, 0.1))).not.toBeNull(); // 0.5 mm inside the third box's edge (0.319)
    expect(shadowAt(m, S(0.3195, 0.1))).toBeNull(); // 0.5 mm outside it
    expect(shadowAt(m, S(-0.0005, 0.1))).toBeNull(); // the outline's other end
    // two depths: the gap filled to the lower of the two sides
    const b = painting([0.01]);
    const deep = box([0, 0, -0.03], [0.1, 0.2, 0.02]); // the first box 2 cm prouder
    const m2 = shadowMap(BASE, [deep.tris, b.parts[1]!], 0.03)!;
    expect(shadowAt(m2, toP2(m2.plane, [0.105, 0.1, 0]))!.h).toBeCloseTo(-0.02, 9);
  });
  it("⭐⭐ THE RUN on the outline: across the bridged joints edge to edge, stopping at a gap wider than the bridge; none off the shadow", () => {
    const a = painting([0.003, 0.016, 0.05]);
    const m = shadowMap(BASE, a.parts, 0.03)!;
    const g = toP2(m.plane, [0.05, 0.1, 0]);
    const d = toP2(m.plane, [1, 0, 0]);
    const run = shadowRun(m, g, [d[0], d[1]]);
    const xs = run.map((t) => fromP2(m.plane, [g[0] + d[0] * t, g[1] + d[1] * t])[0]).sort((x, y) => x - y);
    expect(xs[0]).toBeCloseTo(0, 4);
    expect(xs[1]).toBeCloseTo(0.319, 4);
    const up = toP2(m.plane, [0, 1, 0]);
    const v = shadowRun(m, g, [up[0], up[1]]);
    expect(v[1] - v[0]).toBeCloseTo(0.2, 4);
    expect(shadowRun(m, toP2(m.plane, [0.344, 0.1, 0]), [d[0], d[1]])).toEqual([0, 0]);
  });
  it("⭐⭐⭐ THE LINE IS ONE PLANE'S: the profile through the gizmo along the level axis — a step a near-vertical connector in that plane, never a point off it (the gizmo jumps it)", () => {
    const a = painting([0.003, 0.003]);
    const p45 = box([0.12, 0.05, 0], [0.18, 0.15, 0.041]); // Piece45's protrusion
    const m = shadowMap(BASE, [...a.parts, p45.tris], 0.03)!;
    const g = toP2(m.plane, [0.05, 0.1, 0]);
    const d = toP2(m.plane, [1, 0, 0]);
    const run = shadowRun(m, g, [d[0], d[1]]);
    const pts = spanPolyline((t) => shadowAt(m, [g[0] + d[0] * t, g[1] + d[1] * t])!.h, run[0], run[1], 0.004);
    expect(pts.some(([t]) => t === 0)).toBe(true);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]![0]).toBeGreaterThan(pts[i - 1]![0]);
      const dh = Math.abs(pts[i]![1] - pts[i - 1]![1]);
      if (dh > 0.001) expect(pts[i]![0] - pts[i - 1]![0]).toBeLessThan(0.0002);
    }
    const world = pts.map(([t, h]) => fromP2(m.plane, [g[0] + d[0] * t, g[1] + d[1] * t], h));
    for (const w of world) expect(w[1]).toBeCloseTo(0.1, 12); // every point in the level plane y = 0.1
    expect(Math.max(...pts.map((p) => p[1]))).toBeCloseTo(0, 9); // the protrusion's front
  });
});

describe("⭐⭐⭐ (2026-11-03, eighth pass) THE WORLD'S SIX BASES — the wrap at 90° (the owner: *\"those are the three plans which define x y z axis in world coordinates … Otherwise, the movement of the gizmo is very hard to control\"*)", () => {
  it("⭐⭐⭐ the bases are the world's ±x, ±z, ±y — whatever the assembly's plan (⛔ seventh pass: its smallest rectangle — a plan turned 30° gave turned bases)", () => {
    expect(WORLD_DIRS).toEqual([[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]);
    const w = code("render/face_span_wiring.ts");
    expect(w).toContain("dirs: WORLD_DIRS };");
    expect(w).not.toContain("boxDirs");
  });
  it("⭐⭐⭐ a slanted face snaps to the nearest world base; the next base across the outline is the push's, never the base itself nor its opposite", () => {
    const d = WORLD_DIRS;
    near(snapDir([0.2, 0.55, -0.81], d)!, [0, 0, -1]); // a frustum's side, 34° up: its base the front
    near(snapDir([0.1, 0.9, -0.42], d)!, [0, 1, 0]); // steeper: the top
    near(snapDir([0.9, 0.1, -0.4], d, [1, 0, 0])!, [0, 0, -1]); // ±x excluded
    near(snapDir([0.8, 0, 0.6], d)!, [1, 0, 0]); // a wall turned 37°: the world's x, never its own
    expect(snapDir([0, 0, 0], d)).toBeNull();
  });
});

describe("⭐⭐⭐ (2026-11-03, eighth pass) THE MAIN FACE — a face not connected is not in the section (the owner: *\"If one face is not connected, it should not be included in the section\"*)", () => {
  // Scene_1 seen from its +x side: the painting's side strip (z −0.05…−0.018) at x 0.248, Piece42 41 mm prouder (x 0.289) on its upper part, Piece45 on the
  // back (z −0.092…−0.05) with its +x side at x 0.046 — 20 cm behind
  const painting1 = box([-0.242, 0.015, -0.05], [0.248, 0.499, -0.018]);
  const p42 = box([0.247, 0.404, -0.057], [0.289, 0.508, -0.011]);
  const p45 = box([0, 0.138, -0.092], [0.046, 0.242, -0.05]);
  const parts = [painting1.tris, p42.tris, p45.tris];
  it("⭐⭐⭐ a step within `shadowStepMm` (60 mm) is the main face's — Piece42, 41 mm proud, a jump; Piece45's side, 20 cm deep, CUT OFF (⛔ seventh pass: the gizmo jumped onto it and back)", () => {
    const m = shadowMap([1, 0, 0], parts, 0.03, 0.004, 0.06)!;
    const P = (y: number, z: number) => toP2(m.plane, [0, y, z]);
    expect(shadowAt(m, P(0.3, -0.03))!.h).toBeCloseTo(-0.041, 9); // the painting's side
    expect(shadowAt(m, P(0.45, -0.03))!.h).toBeCloseTo(0, 9); // Piece42
    expect(shadowAt(m, P(0.45, -0.055))!.h).toBeCloseTo(0, 9); // Piece42 beyond the strip: connected through itself
    expect(shadowAt(m, P(0.19, -0.07))).toBeNull(); // Piece45's side: not connected
    expect(shadowAt(m, P(0.19, -0.0505))).toBeNull(); // right at its border with the strip
    expect(shadowAt(m, P(0.19, -0.0495))!.h).toBeCloseTo(-0.041, 9); // the strip at that border
    // without the step (seventh pass) Piece45 was in the shadow
    const all = shadowMap([1, 0, 0], parts, 0.03)!;
    expect(shadowAt(all, toP2(all.plane, [0, 0.19, -0.07]))!.h).toBeCloseTo(-0.243, 9);
  });
  it("⭐⭐ the run along the side stops at the cut-off face: the green line across the strip only", () => {
    const m = shadowMap([1, 0, 0], parts, 0.03, 0.004, 0.06)!;
    const g = toP2(m.plane, [0, 0.19, -0.03]);
    const d = toP2(m.plane, [0, 0, 1]);
    const run = shadowRun(m, g, [d[0], d[1]]);
    const zs = run.map((t) => fromP2(m.plane, [g[0] + d[0] * t, g[1] + d[1] * t])[2]).sort((x, y) => x - y);
    expect(zs[0]).toBeCloseTo(-0.05, 3);
    expect(zs[1]).toBeCloseTo(-0.018, 3);
  });
  it("⭐⭐ the plane at the MAIN face's outermost extent: a disconnected part standing prouder neither moves the foot nor is reached", () => {
    const far = box([0.1, 0.6, -0.3], [0.5, 0.65, -0.25]); // a part away from the side, 21 cm prouder in x than the strip, not touching it
    const m = shadowMap([1, 0, 0], [painting1.tris, far.tris], 0.03, 0.004, 0.06)!;
    expect(heightOf(m.plane, [0.248, 0, 0])).toBeCloseTo(0, 9);
    expect(shadowAt(m, toP2(m.plane, [0, 0.62, -0.27]))).toBeNull();
    expect(shadowAt(m, toP2(m.plane, [0, 0.3, -0.03]))!.h).toBeCloseTo(0, 9);
  });
});

describe("⭐⭐⭐ the gizmo's step — ff2fca2's relation: dx along the face's level line, dy along its steepest (third pass)", () => {
  const deg = Math.PI / 180;
  const yawStep = (yawDeg: number): Vec3 => [-Math.sin(yawDeg * deg), 0, Math.cos(yawDeg * deg)]; // the orbit's +yaw at an untilted frame (orbitDir: x cos, z sin)
  it("⭐⭐⭐ ON A WALL a dx moves the gizmo EXACTLY horizontally and a dy EXACTLY vertically — the piece seen at an oblique yaw and pitch (⛔ second pass: the orbit's step laid on the face, tilted)", () => {
    const n: Vec3 = [0, 0, -1]; // the painting's front
    const ax = faceAxes(n, [0.7, 0.3, 0.64]); // a screen's right off any level
    near(ax.h, [-1, 0, 0]);
    near(ax.v, [0, 1, 0]);
    // the piece 40° to the side and 35° up: the orbit's yaw step has a z part, its pitch step an x and a z part — the gizmo's steps stay level
    const yawW = yawStep(-50);
    const pitchW: Vec3 = [-Math.sin(35 * deg) * Math.cos(-50 * deg), Math.cos(35 * deg), -Math.sin(35 * deg) * Math.sin(-50 * deg)];
    const sh = axisSense(1, ax.h, yawW);
    const sv = axisSense(1, ax.v, pitchW);
    const dx = spanAxisStep(0.1, 0, 0.17, 0.283, ax.h, ax.v, sh, sv);
    const dy = spanAxisStep(0, 0.1, 0.17, 0.283, ax.h, ax.v, sh, sv);
    expect(dx[1]).toBe(0);
    expect(Math.abs(dx[2])).toBeLessThan(1e-15);
    expect(Math.hypot(...dx)).toBeCloseTo(0.017, 12); // the green loop's pace × the yaw
    expect(dy[0]).toBe(0);
    expect(Math.abs(dy[2])).toBeLessThan(1e-15);
    expect(dy[1]).toBeCloseTo(0.0283, 12); // the radius × the pitch, UP for +pitch
  });
  it("⭐⭐ a slanted wall (a seated frustum's side): horizontal its level line, vertical its steepest line", () => {
    const l = Math.hypot(0.847, 0.531);
    const n: Vec3 = [0.847 / l, -0.531 / l, 0];
    const ax = faceAxes(n, [1, 0, 0]);
    expect(ax.h[1]).toBe(0);
    expect(Math.abs(ax.h[0] * n[0] + ax.h[2] * n[2])).toBeLessThan(1e-12);
    expect(ax.v[1]).toBeGreaterThan(0.8);
    expect(Math.abs(ax.v[0] * n[0] + ax.v[1] * n[1] + ax.v[2] * n[2])).toBeLessThan(1e-12);
  });
  it("⭐⭐⭐ ON A TOP both axes the WORLD's x and z — the one nearer the screen's right, and square to it (eighth pass; ⛔ the right itself: a green section at any angle over the top)", () => {
    const ax = faceAxes([0, 1, 0], [0.8, 0.5, 0.33]);
    near(ax.h, [1, 0, 0]);
    expect(Math.abs(ax.v[0])).toBeLessThan(1e-12);
    expect(Math.abs(Math.abs(ax.v[2]) - 1)).toBeLessThan(1e-12);
    near(faceAxes([0, 1, 0], [-0.3, 0.2, -0.9]).h, [0, 0, -1]);
    near(faceAxes([0, -1, 0], [-0.9, 0, 0.4]).h, [-1, 0, 0]);
  });
  it("⭐⭐⭐ ff2fca2's parity on an upright front view: +yaw goes the way the yaw turns round the green loop (+x on the front), +pitch up the red chain; the paces the green loop's perimeter / 2π and the radius", () => {
    const ax = faceAxes([0, 0, -1], [1, 0, 0]);
    const sh = axisSense(-1, ax.h, yawStep(-90)); // the piece in front (yaw −90°): the yaw step is +x
    const sv = axisSense(-1, ax.v, [0, 1, 0]);
    const s = spanAxisStep(0.05, 0.02, 0.17, 0.283, ax.h, ax.v, sh, sv);
    expect(s[0]).toBeCloseTo(0.05 * 0.17, 12);
    expect(s[1]).toBeCloseTo(0.02 * 0.283, 12);
    expect(axisSense(1, ax.h, [0.1, 0, 0.99])).toBe(1); // near square: kept
    // a 0.49 m × 0.033 m painting: the green loop's pace ≈ 0.167 m/rad (ff2fca2: `greenPace`)
    const pts: Vec3[] = [[-0.24, 0, -0.05], [0.25, 0, -0.05], [0.25, 0, -0.017], [-0.24, 0, -0.017], [0, 0.5, -0.03]];
    expect(greenPaceOf(pts)).toBeCloseTo((2 * 0.49 + 2 * 0.033) / (2 * Math.PI), 12);
    expect(spanMmOf((5.1 * Math.PI) / 180, 0, 5.1)).toBeCloseTo(1, 12);
  });
  it("⭐⭐ clamped to the shadow's outline: a push past the edge holds it ON the edge, slides along it, and is CAUGHT (mm of finger); one step back moves at once", () => {
    const a = painting([0.003, 0.003]);
    const m = shadowMap([0, 0, 1], a.parts, 0.03)!;
    const dist = shadowDist(m);
    const none = () => null;
    const Q = (x: number, y: number) => toP2(m.plane, [x, y, 0]);
    const m0: SpanMotion = { at: Q(0.3, 0.1), overMm: 0 };
    const right = toP2(m.plane, [0.02, 0.01, 0]);
    const m1 = spanMove(m0, right, 2, dist, 3, none);
    const x1 = fromP2(m.plane, m1.motion.at);
    expect(x1[0]).toBeCloseTo(0.306, 6); // on the outline (exact: never grown)
    expect(x1[1]).toBeCloseTo(0.11, 9); // slid along it
    expect(m1.motion.overMm).toBeCloseTo((2 * 0.014) / Math.hypot(0.02, 0.01), 6);
    const m2 = spanMove(m1.motion, right, 4, dist, 3, none);
    expect(m2.held).toBe(true); // caught, nothing across: the edge holds
    expect(m2.motion.overMm).toBe(3);
    const back = spanMove(m2.motion, toP2(m.plane, [-0.01, 0, 0]), 1, dist, 3, none);
    expect(fromP2(m.plane, back.motion.at)[0]).toBeCloseTo(0.296, 6);
    expect(back.motion.overMm).toBe(0);
  });
  it("⭐⭐⭐ past the catch the gizmo goes onto the next base AT ONCE — no wrap left pending (the piece and the camera are the orbit's: nothing turns about the edge)", () => {
    const a = painting([0.003, 0.003]);
    const m = shadowMap([0, 0, 1], a.parts, 0.03)!;
    const dist = shadowDist(m);
    const cand = { normal: [1, 0, 0] as Vec3 };
    const right = toP2(m.plane, [0.01, 0, 0]);
    const m1 = spanMove({ at: toP2(m.plane, [0.306, 0.1, 0]), overMm: 0 }, right, 2, dist, 3, () => cand);
    expect(m1.next).toBeNull();
    const m2 = spanMove(m1.motion, right, 2, dist, 3, () => cand);
    expect(m2.next).toEqual(cand);
    expect(m2.motion.overMm).toBe(0);
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

describe("⭐⭐ the engage distance — now the calm's", () => {
  it("⭐ the slider held so its 1.2 × stays within the far orbit (the calm of the shares fades out by then)", () => {
    expect(SPAN_RELEASE_FACTOR).toBe(1.2);
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
  it("⭐⭐⭐ the ORBIT runs (ff2fca2's relation): never held, the piece on its direction; ⭐⭐⭐ (2026-11-03) the SHADOW GIZMO AT EVERY DISTANCE — engaged as soon as there is a gizmo, never released; the piece and the camera read its FOOT; the gizmo moved by the FINGER's steps", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("if (st.span === null && st.pieceQ !== null) {");
    expect(a).toContain("const g = st.asmG ?? castGizmo(st, u)?.point ?? null;");
    expect(a).not.toContain("spanRelease(");
    expect(a).not.toContain("spanEngaged(");
    expect(a).toContain("if (st.span !== null) return spanAnchor(st.span, approachDistance(st.cfg, st.approach), st.cfg.orbitShellOffsetMm / 1000);");
    expect(a).toContain("const target = spanAnchor(sp, d, st.cfg.orbitShellOffsetMm / 1000);");
    expect(a).toContain("st.asmGizmoAt = [sp.g[0], sp.g[1], sp.g[2]];"); // the ring at the gizmo itself: it jumps
    // ⭐⭐⭐ the orbit's face frame from the BASE (no tilt, no roll from a slanted face)
    expect(a).toContain("const want = tiltWanted(spanTiltNormal(st), st.asmFace.kind);");
    expect(a).toContain("spanInputAdd(st, yaw0, v0);");
    expect(a).toContain("if (!assemblyOn(st) || st.asmUp === null) return 1;"); // the governor as far out
    expect(a).toContain("const h = castCovered(st, r);");
    expect(code("render/green_box_wiring.ts")).not.toContain("} else if (st.span !== null) {"); // no hold: the solver runs
    const w = code("render/face_span_wiring.ts");
    expect(w).not.toContain("st.orbit.reset(q.yaw, q.v);");
    // ⭐⭐⭐ (third pass, restated 2026-11-03) the gizmo by the FINGER's yaw and pitch steps along the base's level axes — ⛔ the solved ones: a piece sliding down
    // a part under a pure dx took the gizmo 16 cm down with it
    expect(w).toContain("const dYaw = sp.input.frame === frame ? sp.input.yaw : 0;");
    expect(w).toContain("const dPitch = sp.input.frame === frame ? sp.input.pitch : 0;");
    expect(w).toContain("const step = toPlaneDir(pl, spanAxisStep(dYaw, dPitch, sp.paceH, st.asm.radius, sp.eH, sp.eV, sp.sh, sp.sv));");
    // the depth the shadow's at once (a jump), the next base the box's along the push
    expect(w).toContain("const hit = shadowAt(sp.map, sp.motion.at);");
    expect(w).not.toContain("rideStep");
    expect(w).toContain("const next = snapDir(D, sp.dirs, n);");
    expect(w).toContain("return st.span !== null ? st.span.plane.n : (st.gizmoNormal ?? null);");
    expect(w).toContain("sp.eYaw = sp.eH;");
    expect(w).toContain("sp.ePitch = sp.eV;");
    expect(w).toContain("const u1 = dirOf(q.yaw, q.v);");
  });
  it("⭐⭐⭐ the screen wins on a settled picture — every frame in the face-span (⛔ `signAfter` carried an inversion out)", () => {
    const w = code("render/face_span_wiring.ts");
    // ⭐⭐⭐ (2026-11-03, restated) mid-drag too, inside the zenith's cone too — only a roll under way waits (the finger turns with the picture meanwhile)
    expect(w).toContain("if (!zenithRolling(st) && st.asmRoll === null && facing) spanScreenSigns(st, sp.plane.n);");
    // ⭐ facing: the frame's `dir` points from the look point TOWARD the camera (⛔ read as the view's: the rule never ran — measured, the signs stayed inverted)
    expect(w).toContain("const facing = scr !== null && scr.dir[0] * sp.plane.n[0] + scr.dir[1] * sp.plane.n[1] + scr.dir[2] * sp.plane.n[2] >= SPAN_FACING_COS;");
    // ⛔ (2026-11-03) no drag keeps its sense through a roll until the lift (`signHold`): the piece came out on the far side with a dy reversed on the screen
    expect(w).not.toContain("signHold");
    expect(w).toContain("if (st.router.size === 0 && sp.zen !== null) sp.zen.block = false;");
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
    for (const k of ["faceSpanEngageM", "faceSpanCatchMm", "faceSpanRollMm", "shadowBridgeMm", "shadowStepMm"]) expect(m).toContain(`"${k}"`);
    expect(m).not.toContain('"faceSpanRideMm"');
    expect(m).not.toContain('"faceSpanTurnMm"');
    expect(m).toContain('"camera looks at the gizmo within (m) — the centre beyond", "assemblyLockDistM"');
    const c = code("input/gestureConfig.ts");
    expect(c).toContain("faceSpanEngageM: 4.5,");
    expect(c).toContain("faceSpanCatchMm: 3,");
    expect(c).toContain("faceSpanRollMm: 16,");
    expect(c).toContain("shadowBridgeMm: 30,");
    expect(c).toContain("shadowStepMm: 60,");
  });
});

describe("⭐⭐⭐ the fourth pass — the slide's calm in the middle of a face, the orbit's whole angle at its edges (the owner: *\"a mix of the slide of the gizmo of commit 3286ed5 and this implementation of commit 46ee3a2\"*)", () => {
  const deg = Math.PI / 180;
  const n: Vec3 = [0, 0, -1];
  const h: Vec3 = [1, 0, 0];
  const v: Vec3 = [0, 1, 0];
  const dir = (aDeg: number, bDeg: number): Vec3 => [Math.cos(bDeg * deg) * Math.sin(aDeg * deg), Math.sin(bDeg * deg), -Math.cos(bDeg * deg) * Math.cos(aDeg * deg)];
  const off = (w: Vec3) => Math.acos(Math.max(-1, Math.min(1, w[0] * n[0] + w[1] * n[1] + w[2] * n[2]))) / deg;
  it("⭐⭐ the share: the interior value in the middle, rising by a smoothstep to 1 within the edge zone (25 % of the run, at least 3 cm), 1 at the edge; a thin face 1 everywhere", () => {
    expect(edgeShare(0.245, 0.49, 0.25, 25, 0.03)).toBe(0.25); // the middle of the painting's 0.49 m front
    expect(edgeShare(0, 0.49, 0.25, 25, 0.03)).toBe(1); // at the edge
    expect(edgeShare(0.1225, 0.49, 0.25, 25, 0.03)).toBe(0.25); // the zone's inner end (0.1225 m)
    const mid = edgeShare(0.06125, 0.49, 0.25, 25, 0.03);
    expect(mid).toBeCloseTo(0.25 + 0.75 * 0.5, 12); // halfway through the zone: the smoothstep's half
    expect(edgeShare(0.01, 0.033, 0.25, 25, 0.03)).toBe(1); // the 33 mm top: thin — the orbit's whole angle (the zenith's roll unchanged)
    expect(edgeShare(0.1, 0.4, 0.25, 0, 0.03)).toBe(0.25); // the zone's minimum governs a small percentage
    let prev = 2;
    for (let d = 0; d <= 0.245; d += 0.005) { const s2 = edgeShare(d, 0.49, 0.25, 25, 0.03); expect(s2).toBeLessThanOrEqual(prev + 1e-12); prev = s2; } // monotonic inward
  });
  it("⭐⭐⭐ IN THE MIDDLE OF A LARGE FACE the view stays near square: a 60° orbit offset shows 15° (⛔ 46ee3a2: the whole 60°); AT THE EDGE exactly the orbit's", () => {
    const u = dir(60, 0);
    expect(off(shownDir(u, n, h, v, 0.25, 0.25))).toBeCloseTo(15, 9);
    expect(off(shownDir(dir(40, 30), n, h, v, 0.25, 0.25))).toBeLessThan(20);
    expect(shownDir(u, n, h, v, 1, 1)).toBe(u); // the edge and the crossing: 46ee3a2's direction itself
  });
  it("⭐⭐ dy OFF (`faceSpanShareVOn` 0): the vertical angle shown whole, the horizontal still calmed", () => {
    const w = shownDir(dir(40, 30), n, h, v, 0.25, 1);
    expect(Math.asin(w[1]) / deg).toBeCloseTo(30, 9);
    expect(Math.atan2(w[0], -w[2]) / deg).toBeCloseTo(10, 9);
  });
  it("⭐⭐ continuous in the orbit's direction (a small orbit step a small shown step — never more), and the same place and direction give the same view (reversible)", () => {
    for (const [a, b] of [[10, 5], [50, -20], [-70, 40]] as const) {
      const w0 = shownDir(dir(a, b), n, h, v, 0.25, 0.25);
      const w1 = shownDir(dir(a + 0.5, b + 0.5), n, h, v, 0.25, 0.25);
      expect(Math.acos(Math.min(1, w0[0] * w1[0] + w0[1] * w1[1] + w0[2] * w1[2])) / deg).toBeLessThanOrEqual(0.71);
    }
    expect(shownDir(dir(33, 12), n, h, v, 0.4, 0.6)).toEqual(shownDir(dir(33, 12), n, h, v, 0.4, 0.6));
  });
  it("⭐ the calm's weight: none just after the engage (the far orbit's direction never jumps), whole by 0.8 × the engage distance, none at the release", () => {
    expect(calmWeight(0, 3, 4.5, 1.2)).toBe(0);
    expect(calmWeight(1, 3.6, 4.5, 1.2)).toBe(1);
    expect(calmWeight(1, 5.4, 4.5, 1.2)).toBe(0);
    expect(calmWeight(1, 4.5, 4.5, 1.2)).toBeGreaterThan(0);
  });
  it("⭐⭐⭐ wired: the piece, the camera, the approach and the solve on the shown direction; the shares from the gizmo's runs; SEVEN sliders in a new submenu", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("if (st.span !== null) return spanShownDir(st.span, u, approachDistance(st.cfg, st.approach), spanEngageM(st.cfg.faceSpanEngageM, farDistance(st.cfg)), SPAN_RELEASE_FACTOR);");
    const w = code("render/face_span_wiring.ts");
    expect(w).toContain("sp.shareH = shareOf(sp.eH, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm);");
    expect(w).toContain("sp.shareV = cfg.faceSpanShareVOn === 1 ? shareOf(sp.eV, cfg.faceSpanShareV, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm) : 1;");
    const m = code("render/tuning_menu.ts");
    const i = m.indexOf('title: "FACE-SPAN ORBIT SHARE"');
    expect(i).toBeGreaterThan(m.indexOf('title: "CAMERA ORBIT AROUND CENTER"'));
    const sub = m.slice(i, m.indexOf("],", i));
    for (const k of ["faceSpanShareH", "faceSpanZoneHPct", "faceSpanZoneMinHCm", "faceSpanShareVOn", "faceSpanShareV", "faceSpanZoneVPct", "faceSpanZoneMinVCm"]) expect(sub).toContain(`"${k}"`);
    const c = code("input/gestureConfig.ts");
    for (const d of ["faceSpanShareH: 0.25,", "faceSpanZoneHPct: 25,", "faceSpanZoneMinHCm: 3,", "faceSpanShareVOn: 1,", "faceSpanShareV: 0.25,", "faceSpanZoneVPct: 25,", "faceSpanZoneMinVCm: 3,"]) expect(c).toContain(d);
  });
});
