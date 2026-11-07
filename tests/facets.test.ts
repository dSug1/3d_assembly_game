// ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 5 — TILTED_ORBIT_REBUILD_SCOPE.md §5, §16.1 D3 / D5) THE FACES CONTOUR: the face map on FACETS —
// `src/input/face_map.ts` (`buildFaceMap`, `mapTarget`, `blendThroughEdges`, `mapAngles`), wired by `render/assembly_wiring.ts`. RED against `81e5ba2`
// (Step 4c-bis: no facets — the map read on the core box's six world axes; `columnAt`, `facetFrame`, `blendThroughEdges` absent).
import { describe, expect, it } from "vitest";
import { buildFaceMap, type FaceMap, type MapFace } from "../src/input/face_map";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const D = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** a planar convex face from its vertices, counter-clockwise seen from outside */
function face(vs: readonly Vec3[]): MapFace {
  const c = cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
  const l = Math.hypot(...c);
  const tris: [Vec3, Vec3, Vec3][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  const centre: Vec3 = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as Vec3;
  return { normal: [c[0] / l, c[1] / l, c[2] / l], centre, tris };
}

/** a box's six faces */
function boxFaces(b: ShellBox): MapFace[] {
  const [x0, y0, z0] = b.lo;
  const [x1, y1, z1] = b.hi;
  return [
    face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]), // +x
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]), // −x
    face([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]), // +y
    face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]), // −y
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]), // +z
    face([[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]), // −z
  ];
}


/** the contour's counts: the side facets, the columns, the real facets (the caps included) */
const facetCount = (fm: FaceMap) => ({ sides: fm.facets.filter((f) => f.kind === "SIDE").length, columns: fm.columns.length, real: fm.facets.filter((f) => f.real).length });



describe("⭐⭐⭐ (2026-11-04, Step 5) THE FACES CONTOUR — the face map on facets", () => {
  it("⭐⭐⭐ D5: a painting-like box with an OVERHANG's slanted face whose plane crosses the box's top-front edge — exactly the box's SIX facets (the slanted plane's real face covers ~14 % of its own polygon: refused); with a tenth asked, it cuts the contour", () => {
    const box: ShellBox = { lo: [-0.25, 0, -0.05], hi: [0.25, 0.6, -0.017] };
    // a frustum's 32° side hanging in front of the top-front edge: 30 × 80 mm, its plane crossing the box — through the front and the top
    const n: Vec3 = [0, Math.cos(32 * D), -Math.sin(32 * D)];
    const c: Vec3 = [0, 0.57, -0.07];
    const u: Vec3 = [1, 0, 0];
    const v = cross(n, u);
    const at = (a: number, b: number): Vec3 => [c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b];
    const slant = face([at(-0.015, -0.04), at(0.015, -0.04), at(0.015, 0.04), at(-0.015, 0.04)]);
    expect(dot(slant.normal, n)).toBeCloseTo(1, 9);
    expect(dot(n, [0, 0.6, -0.05]) > dot(n, c)).toBe(true); // the box's corner beyond the slanted plane: the plane crosses the box
    const faces = [...boxFaces(box), slant];
    const fm = buildFaceMap(faces, box, { mergeDeg: 20, minShare: 0.25 });
    expect(fm.facets.length).toBe(6);
    expect(fm.facets.every((f) => f.real && [0, 1, 2].some((k) => Math.abs(Math.abs(f.n[k]!) - 1) < 1e-12))).toBe(true);
    expect(facetCount(fm)).toEqual({ sides: 4, columns: 4, real: 6 });
    // ⭐⭐⭐ (§29) the box's six planes: THE TRACK IS THE SHELL — the front and the top pushed out to the overhang's support (⛔ §27: the track at the real
    // faces, the overhang outside it)
    const sv = slant.tris.flatMap((tr) => [...tr]);
    const front = Math.min(...sv.map((p) => p[2]));
    const top = Math.max(...sv.map((p) => p[1]));
    // (the parts' box holds every part — the product's `shellBox`)
    const whole: ShellBox = { lo: [box.lo[0], box.lo[1], Math.min(box.lo[2], front)], hi: [box.hi[0], Math.max(box.hi[1], top), box.hi[2]] };
    const fw = buildFaceMap(faces, whole, { mergeDeg: 20, minShare: 0.25 });
    expect(fw.facets.length).toBe(6);
    for (const [k, lo] of [[0, true], [0, false], [1, true], [1, false], [2, true], [2, false]] as const) expect(lo ? fw.core.lo[k] : fw.core.hi[k]).toBeCloseTo(lo ? whole.lo[k]! : whole.hi[k]!, 12);
    for (const f of fw.facets) expect(f.e).toBe(f.es);
    expect(fw.facets.find((f) => f.n[2] < -0.9)!.es).toBeCloseTo(-front, 12);
    expect(fw.facets.find((f) => f.n[1] > 0.9)!.es).toBeCloseTo(Math.max(box.hi[1], top), 12);
    // a share of a tenth asked: the slanted plane is CHOSEN as a facet (its real face ~14 % of its polygon) — ⭐⭐⭐ (§24.1) then pushed out to the parts'
    // support: through the box's top-front corner, it no longer cuts the contour into a part
    const all = buildFaceMap(faces, box, { mergeDeg: 20, minShare: 0.1 });
    expect(all.facets.length).toBe(7);
    const slanted = all.facets.find((f) => dot(f.n, n) > 0.999)!;
    const sup = Math.max(...[...faces.flatMap((f) => f.tris.flatMap((tr) => [...tr]))].map((p) => dot(n, p)));
    expect(slanted.es).toBeCloseTo(sup, 12);
    expect(slanted.es).toBeGreaterThanOrEqual(dot(n, [0, 0.6, -0.05]) - 1e-12);
    // and merged within 35°, the slanted face is the top's (its normal 32° off +y): six again
    expect(buildFaceMap(faces, box, { mergeDeg: 35, minShare: 0 }).facets.length).toBe(6);
  });





});
