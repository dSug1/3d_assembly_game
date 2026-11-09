// ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 5 — TILTED_ORBIT_REBUILD_SCOPE.md §5, §16.1 D3 / D5) THE FACES CONTOUR: the face map on FACETS —
// `src/input/face_map.ts` (`buildFaceMap`, `mapTarget`, `blendThroughEdges`, `mapAngles`), wired by `render/assembly_wiring.ts`. RED against `81e5ba2`
// (Step 4c-bis: no facets — the map read on the core box's six world axes; `columnAt`, `facetFrame`, `blendThroughEdges` absent).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { blendThroughEdges, buildFaceMap, columnAt, mapAngles, mapTarget, type FaceMap, type MapFace } from "../src/input/face_map";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const D = Math.PI / 180;
const opts = { edgeMm: 10, edgeDeg: 10 };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

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

/** ⭐ a regular hexagonal prism, apothem `r`: VERTICAL (its axis y, from 0 to `h`, face normals at headings 0°, 60° …) or HORIZONTAL (its axis x, from
 * −`h`/2 to `h`/2, a face on top: face normals at 90°, 30°, −30°, −90°, −150°, 150° from +z toward +y) */
function hexPrism(r: number, h: number, vertical: boolean): { faces: MapFace[]; box: ShellBox } {
  const R = r / Math.cos(30 * D);
  const faces: MapFace[] = [];
  if (vertical) {
    const ring = (y: number) => [...Array(6)].map((_, k) => [R * Math.cos((30 + 60 * k) * D), y, R * Math.sin((30 + 60 * k) * D)] as Vec3);
    const lo = ring(0);
    const hi = ring(h);
    for (let k = 0; k < 6; k++) faces.push(face([lo[(k + 5) % 6]!, hi[(k + 5) % 6]!, hi[k]!, lo[k]!]));
    faces.push(face(hi), face(lo));
    const mid: Vec3 = [0, h / 2, 0];
    return { faces: faces.map((f) => (dot(f.normal, sub(f.centre, mid)) < 0 ? { ...f, normal: [-f.normal[0], -f.normal[1], -f.normal[2]] as Vec3 } : f)), box: { lo: [-r, 0, -R], hi: [r, h, R] } };
  }
  // the hexagon in (z, y) at x; vertices at 0°, 60° … from +z toward +y
  const ring = (x: number) => [...Array(6)].map((_, k) => [x, R * Math.sin(60 * k * D), R * Math.cos(60 * k * D)] as Vec3);
  const a = ring(-h / 2);
  const b = ring(h / 2);
  for (let k = 0; k < 6; k++) faces.push(face([a[k]!, b[k]!, b[(k + 1) % 6]!, a[(k + 1) % 6]!]));
  faces.push(face([...b].reverse()), face(a));
  // orient every face outward (the builder's winding checked against the centre, the origin)
  const out = faces.map((f) => (dot(f.normal, f.centre) < 0 ? { ...f, normal: [-f.normal[0], -f.normal[1], -f.normal[2]] as Vec3 } : f));
  return { faces: out, box: { lo: [-h / 2, -r, -R], hi: [h / 2, r, R] } };
}

/** the contour's counts: the side facets, the columns, the real facets (the caps included) */
const facetCount = (fm: FaceMap) => ({ sides: fm.facets.filter((f) => f.kind === "SIDE").length, columns: fm.columns.length, real: fm.facets.filter((f) => f.real).length });

/** the place THROUGH AN EDGE (the wiring's gizmo less the cast): the target's surface, blended */
const place = (fm: FaceMap, yaw: number, pitch: number): Vec3 =>
  blendThroughEdges(fm, yaw, pitch, opts, mapTarget(fm, yaw, pitch, opts).surface, (y, p) => mapTarget(fm, y, p, opts).surface);

/** the worst step of the blended place: a full turn of yaw at every pitch, a full sweep of pitch at every yaw (0.25°) */
function worstStep(fm: FaceMap): number {
  let worst = 0;
  const s = 0.25;
  for (let p = -90; p <= 90; p += 2.5) for (let y = 0; y < 360; y += s) worst = Math.max(worst, dist(place(fm, y * D, p * D), place(fm, (y + s) * D, p * D)));
  for (let y = 0; y < 360; y += 2.5) for (let p = -90; p < 90; p += s) worst = Math.max(worst, dist(place(fm, y * D, p * D), place(fm, y * D, (p + s) * D)));
  return worst;
}

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
    expect(fm.facets.every((f) => f.real && f.share > 0.99 && [0, 1, 2].some((k) => Math.abs(Math.abs(f.n[k]!) - 1) < 1e-12))).toBe(true);
    expect(facetCount(fm)).toEqual({ sides: 4, columns: 4, real: 6 });
    for (const k of [0, 1, 2]) expect([fm.core.lo[k], fm.core.hi[k]]).toEqual([expect.closeTo(box.lo[k]!, 12), expect.closeTo(box.hi[k]!, 12)]);
    // a share of a tenth asked: the slanted plane is a facet (its real face ~14 % of its polygon), the contour cut along it
    const all = buildFaceMap(faces, box, { mergeDeg: 20, minShare: 0.1 });
    expect(all.facets.length).toBe(7);
    const slanted = all.facets.find((f) => dot(f.n, n) > 0.999)!;
    expect(slanted.share).toBeGreaterThan(0.1);
    expect(slanted.share).toBeLessThan(0.25);
    // and merged within 35°, the slanted face is the top's (its normal 32° off +y): six again
    expect(buildFaceMap(faces, box, { mergeDeg: 35, minShare: 0 }).facets.length).toBe(6);
  });

  it("⭐⭐⭐ a VERTICAL hexagonal prism: six columns of 60° (each facet's slice from halfway to each neighbour's normal), the facet under the gizmo always facing the yaw (within 30°); I1 in the facet frame — a dx keeps the height, a dy the place across the facet; no jump on a full turn", () => {
    const { faces, box } = hexPrism(0.2, 0.5, true);
    const fm = buildFaceMap(faces, box);
    expect(facetCount(fm)).toEqual({ sides: 6, columns: 6, real: 8 });
    for (const c of fm.columns) {
      expect(c.hw).toBeCloseTo(30 * D, 12);
      expect(c.bounds).toEqual([expect.closeTo(-45 * D, 12), expect.closeTo(45 * D, 12)]);
    }
    for (let yaw = 0; yaw < 360; yaw += 1) {
      const t = mapTarget(fm, yaw * D, 0, opts);
      expect(t.band).toBe("SIDE");
      expect(dot(t.normal, [Math.cos(yaw * D), 0, Math.sin(yaw * D)])).toBeGreaterThan(Math.cos(30 * D) - 1e-9);
      expect(dot(sub(t.surface, [0, 0, 0]), t.normal)).toBeCloseTo(0.2, 9); // on the facet's plane
    }
    // I1 within a facet: dx (yaw) keeps the height; dy (pitch) keeps the place across (along t) and stays in the facet's plane
    for (const yaw of [5, 20, 77, 140, 250, 333]) {
      const t0 = mapTarget(fm, yaw * D, 0, opts);
      const f = fm.facets[t0.stack]!;
      for (let p = -44; p <= 44; p += 4) {
        const t = mapTarget(fm, yaw * D, p * D, opts);
        expect(dot(sub(t.surface, t0.surface), f.t)).toBeCloseTo(0, 12);
        expect(dot(sub(t.surface, t0.surface), f.n)).toBeCloseTo(0, 12);
      }
      const k = columnAt(fm, yaw * D).k;
      const col = fm.columns[k]!;
      for (let y = col.mid - col.hw + 1e-6; y <= col.mid + col.hw - 1e-6; y += 2 * D) expect(mapTarget(fm, y, 20 * D, opts).surface[1]).toBeCloseTo(mapTarget(fm, yaw * D, 20 * D, opts).surface[1], 12);
    }
    expect(worstStep(fm)).toBeLessThan(0.006);
  });

  it("⭐⭐⭐ a HORIZONTAL hexagonal prism (a face on top): six side facets in four columns — the ends (±x) and, at ±z, two facets STACKED at ±30° of elevation; the caps its top and bottom faces; the pitch bands from halfway to each neighbour's elevation; I1 on a SLANTED facet (the green the plane of t and n, the red of b and n)", () => {
    const { faces, box } = hexPrism(0.15, 0.5, false);
    const fm = buildFaceMap(faces, box);
    expect(facetCount(fm)).toEqual({ sides: 6, columns: 4, real: 8 });
    expect(fm.facets[fm.top]!.n[1]).toBeCloseTo(1, 12);
    expect(fm.facets[fm.bottom]!.n[1]).toBeCloseTo(-1, 12);
    const col = (deg: number) => fm.columns[columnAt(fm, deg * D).k]!;
    expect(col(0).bounds).toEqual([expect.closeTo(-45 * D, 12), expect.closeTo(45 * D, 12)]);
    expect(col(90).facets.length).toBe(2);
    expect(col(90).bounds).toEqual([expect.closeTo(-60 * D, 12), expect.closeTo(0, 12), expect.closeTo(60 * D, 12)]);
    // at +15° of pitch in the +z slice: the UPPER slanted facet; at −15° the lower; at 70° the top
    expect(mapTarget(fm, 90 * D, 15 * D, opts).normal[1]).toBeCloseTo(Math.sin(30 * D), 12);
    expect(mapTarget(fm, 90 * D, -15 * D, opts).normal[1]).toBeCloseTo(-Math.sin(30 * D), 12);
    expect(mapTarget(fm, 90 * D, 70 * D, opts).band).toBe("TOP");
    // I1 on the upper slanted facet (+z): a dx moves along t (x) only — the plane of t and n; a dy along b only — the plane of b and n
    const t0 = mapTarget(fm, 90 * D, 20 * D, opts);
    const f = fm.facets[t0.stack]!;
    expect(f.t[1]).toBe(0); // t level
    for (let y = 60; y <= 120; y += 3) {
      const t = mapTarget(fm, y * D, 20 * D, opts);
      expect(t.stack).toBe(t0.stack);
      expect(dot(sub(t.surface, t0.surface), f.b)).toBeCloseTo(0, 12);
      expect(dot(sub(t.surface, t0.surface), f.n)).toBeCloseTo(0, 12);
    }
    for (let p = 2; p <= 58; p += 4) {
      const t = mapTarget(fm, 90 * D, p * D, opts);
      expect(dot(sub(t.surface, t0.surface), f.t)).toBeCloseTo(0, 12);
      expect(dot(sub(t.surface, t0.surface), f.n)).toBeCloseTo(0, 12);
    }
    // ±90°: the cap's centre whatever the yaw
    for (const y of [0, 45, 90, 200, 300]) expect(dist(mapTarget(fm, y * D, 90 * D, opts).surface, [0, 0.15, 0])).toBeLessThan(1e-9);
  });

  it("⭐⭐⭐ NO JUMP on the horizontal prism — through every facet edge and every slice's end, the caps' quarters included — ⛔ with the slice-end blend at Step 4c-bis's pitches only, the end column (caps from 45°) and the slanted one (caps from 60°) parted at the slice's end over the caps", () => {
    const { faces, box } = hexPrism(0.15, 0.5, false);
    const fm = buildFaceMap(faces, box);
    expect(worstStep(fm)).toBeLessThan(0.006);
    // the parting it cures: the raw places at a slice's end at 75° of pitch, from either side
    const a = mapTarget(fm, 45 * D - 1e-9, 75 * D, opts).surface;
    const b = mapTarget(fm, 45 * D + 1e-9, 75 * D, opts).surface;
    expect(dist(a, b)).toBeGreaterThan(0.01);
    expect(dist(place(fm, 45 * D - 1e-9, 75 * D), place(fm, 45 * D + 1e-9, 75 * D))).toBeLessThan(1e-6);
  });

  it("⭐⭐ AND BACK on facets (`mapAngles`, after the slide): every place on the horizontal prism — slanted facets, ends, caps — read back to its own angles", () => {
    const { faces, box } = hexPrism(0.15, 0.5, false);
    const fm = buildFaceMap(faces, box);
    let seed = 11;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let k = 0; k < 400; k++) {
      const yaw = rnd() * 2 * Math.PI;
      const pitch = (rnd() * 2 - 1) * (Math.PI / 2 - 1e-3);
      const t = mapTarget(fm, yaw, pitch, opts);
      const back = mapAngles(fm, t.surface, t.stack, opts);
      expect(dist(mapTarget(fm, back.yaw, back.pitch, opts).surface, t.surface)).toBeLessThan(1e-9);
    }
  });

  it("⭐⭐⭐ WIRED: the gizmo on the facets (`mapTarget(map, …)`, the facet's stack in its own frame); ⭐ D3 — the ray's hit taken WHATEVER its depth (over an empty slot its bottom; ⛔ `MAP_REFINE_M`, 25 mm, deleted); the two knobs (D5) sliders, in the map's key", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("if (h !== null && (at.bridged !== true || level(h.point) > at.depth + MAP_BRIDGE_FRONT_M)) return { point: onto(level(h.point)), normal: h.normal ?? n, host: h.host };"); // ⭐ (2026-11-05) D3 amended: a bridged void is not cast to its bottom
    expect(a).not.toContain("MAP_REFINE_M");
    expect(a).toContain("const map = buildFaceMap(faces, box, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare });");
    expect(a).toContain("const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}`;");
    expect(DEFAULT_CONFIG.facetMergeDeg).toBe(20);
    expect(DEFAULT_CONFIG.facetMinShare).toBe(0.25);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, facetMergeDeg: 50 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, facetMinShare: 1.5 })).toThrow();
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"facetMergeDeg", 1, 44, 1');
    expect(m).toContain('"facetMinShare", 0, 1, 0.05');
  });
});
