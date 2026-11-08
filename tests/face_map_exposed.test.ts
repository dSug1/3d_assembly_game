// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §5, R1 + R2) THE FACES CONTOUR FROM THE EXPOSED FACES, CLIPPED AT ONE TOLERANCE. RED against `b2ad345`:
// R1 — the stack read EVERY face, the glued ones included, so the largest coplanar region could be an INTERNAL plane (the cube's +x facet on Piece32's
// covered side at 213.5 mm, −x on Piece30's at −147.5, against the real 247.5 / −242.5); R2 — a facet's polygon was clipped at 1e-9 m while its plane
// and the box's come from two computations 5.1e-9 m apart (the cube's back facet empty, dropped).
// ⭐ The cube's fixture is the REAL specimen: the 240 faces the page fed to `buildFaceMap` (float32 noise and all), dumped 2026-11-09.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, mapTarget, regionReal, stackOf, facetFrame, type MapFace } from "../src/input/face_map";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const D = Math.PI / 180;
const opts = { edgeMm: 10, edgeDeg: 10 };
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function face(vs: readonly Vec3[], part: string): MapFace {
  const c = cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
  const l = Math.hypot(...c);
  const tris: [Vec3, Vec3, Vec3][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  const centre = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as Vec3;
  return { normal: [c[0] / l, c[1] / l, c[2] / l], centre, tris, part };
}
function boxFaces(b: ShellBox, part: string): MapFace[] {
  const [x0, y0, z0] = b.lo;
  const [x1, y1, z1] = b.hi;
  return [
    face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], part),
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], part),
    face([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], part),
    face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], part),
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], part),
    face([[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], part),
  ];
}

const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };

describe("⭐⭐⭐ (2026-11-09, R1) the faces contour from the EXPOSED faces — a face glued to another part's is not a surface", () => {
  // A: x −1…0, 1.5 tall; B: x 0…1, 1 tall — glued on x = 0 over y 0…1. A's +x side at x = 0 is 1.5 m² (the largest +x plane) but only 0.5 m² of it
  // is exposed; B's +x side at x = 1 is 1 m², all exposed. ⛔ RED: the +x facet was the glued plane x = 0 — B stood 1 m proud of the contour.
  const A: ShellBox = { lo: [-1, 0, 0], hi: [0, 1.5, 1] };
  const B: ShellBox = { lo: [0, 0, 0], hi: [1, 1, 1] };
  const box: ShellBox = { lo: [-1, 0, 0], hi: [1, 1.5, 1] };
  const faces = [...boxFaces(A, "A"), ...boxFaces(B, "B")];

  it("⭐⭐ two glued boxes: the +x facet is the OUTER face (x = 1), not the larger glued plane (x = 0)", () => {
    const fm = buildFaceMap(faces, box);
    const px = fm.facets.find((f) => f.n[0] > 0.99)!;
    expect(px.e).toBeCloseTo(1, 9);
    const mx = fm.facets.find((f) => f.n[0] < -0.99)!;
    expect(mx.e).toBeCloseTo(1, 9);
  });

  it("⭐ a glued face's cells are not REAL (the void rule reads them), its exposed part is", () => {
    const n: Vec3 = [1, 0, 0];
    const { t, b } = facetFrame(n);
    const g = stackOf(faces, n, t, b, Math.cos(20 * D)).find((q) => Math.abs(q.depth) < 1e-9)!;
    const at = (y: number, z: number): boolean => regionReal(g.region, z * t[2] + 0 * t[0], y * b[1]);
    expect(at(0.5, 0.5)).toBe(false); // glued to B's −x side
    expect(at(1.25, 0.5)).toBe(true); // A's side above B: exposed
  });

  it("⭐ faces without a part (the vectors' plain shapes) are never covered — the old behaviour kept", () => {
    const anon = faces.map((f) => ({ normal: f.normal, centre: f.centre, tris: f.tris }));
    expect(buildFaceMap(anon, box).facets.find((f) => f.n[0] > 0.99)!.e).toBeCloseTo(0, 9);
  });

  it("⭐⭐⭐ Scene_1 the cube (the page's own 240 faces): the ±x facets on the REAL outer faces — 247.5 / −242.5 mm (RED: 213.5 / −147.5, internal)", () => {
    const fm = buildFaceMap(cube.faces, cube.box);
    expect(fm.facets.find((f) => f.n[0] > 0.99)!.e).toBeCloseTo(0.2475, 5);
    expect(fm.facets.find((f) => f.n[0] < -0.99)!.e).toBeCloseTo(0.2425, 5);
    expect(fm.core.hi[0] - fm.core.lo[0]).toBeCloseTo(0.49, 4);
  });
});

describe("⭐⭐⭐ (2026-11-09, R2 = F9) a facet's polygon clipped with the face map's own coplanar tolerance", () => {
  it("⭐⭐⭐ Scene_1 the cube: SIX facets — the back at 432.5 mm, its share whole; four columns of 90° (RED: five, the back's polygon empty, its share 0)", () => {
    const fm = buildFaceMap(cube.faces, cube.box);
    expect(fm.facets.length).toBe(6);
    const back = fm.facets.find((f) => f.n[2] > 0.99)!;
    expect(back.e).toBeCloseTo(0.4325, 6);
    expect(back.share).toBeGreaterThan(0.95);
    expect(fm.columns.length).toBe(4);
    for (const c of fm.columns) expect(c.hw).toBeCloseTo(45 * D, 9);
  });

  it("⭐⭐ a plain box whose faces' levels carry 5e-9 m of noise keeps its six facets (the fixture's two sources of one plane NOT the same numbers)", () => {
    const b: ShellBox = { lo: [-0.2, 0, -0.1], hi: [0.2, 0.5, 0.3] };
    const noisy = boxFaces(b, "P").map((f) => {
      const k = f.normal.findIndex((x) => Math.abs(x) > 0.5);
      const shift = (v: Vec3): Vec3 => v.map((x, i) => (i === k ? x + 5e-9 : x)) as unknown as Vec3;
      return { ...f, centre: shift(f.centre), tris: f.tris.map((tr) => tr.map(shift) as unknown as [Vec3, Vec3, Vec3]) };
    });
    expect(buildFaceMap(noisy, b).facets.length).toBe(6);
  });

  it("⭐⭐⭐ the green on the cube at pitch 20°: no step of the place over 10 mm a quarter degree, the whole turn (RED: 490 mm across the back's missing facet)", () => {
    const fm = buildFaceMap(cube.faces, cube.box);
    let worst = 0;
    for (let y = 0; y < 360; y += 0.25) worst = Math.max(worst, dist(mapTarget(fm, y * D, 20 * D, opts).surface, mapTarget(fm, (y + 0.25) * D, 20 * D, opts).surface));
    expect(worst).toBeLessThan(0.01);
  });
});
