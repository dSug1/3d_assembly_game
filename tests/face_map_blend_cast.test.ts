// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §5, R3) THE EDGE BLEND AND ITS CAST. RED against `3c3ce8d`: (a) the blended place's cast ran even where the two
// facets FACE APART (a chord along a face — it took the near facet's own face: the cube's 490 mm jump across its missing back); (b) over a cap the
// slice-end blend was skipped for two columns of equal bounds (a raw step at the slice's end: 284 mm at −61°); (c) the real depth was cast from the
// facet polygon's RIM — the neighbour's plane, a grazing ray (127 mm spikes at the exact bounds).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { blendThroughEdges, buildFaceMap, castPoint, edgeBlend, mapTarget, MAP_COPLANAR_M, type MapFace } from "../src/input/face_map";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const D = Math.PI / 180;
const opts = { edgeMm: 10, edgeDeg: 10 };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

function face(vs: readonly Vec3[]): MapFace {
  const c = cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
  const l = Math.hypot(...c);
  const tris: [Vec3, Vec3, Vec3][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  const centre = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as Vec3;
  return { normal: [c[0] / l, c[1] / l, c[2] / l], centre, tris };
}
const b: ShellBox = { lo: [-0.25, 0, -0.05], hi: [0.25, 0.5, 0.43] };
const [x0, y0, z0] = b.lo;
const [x1, y1, z1] = b.hi;
/** the cube WITHOUT its back (+z) face — the seam geometry of I11: +x and −x adjacent, facing apart */
const noBack = [
  face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]),
  face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]),
  face([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]),
  face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]),
  face([[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]),
];
const fm = buildFaceMap(noBack, b);
const surf = (y: number, p: number) => mapTarget(fm, y, p, opts).surface;

describe("⭐⭐⭐ (2026-11-09, R3) the edge blend and its cast", () => {
  it("the fixture: three columns, +x and −x adjacent at yaw 90° (facing apart)", () => {
    expect(fm.columns.length).toBe(3);
    expect(dot(mapTarget(fm, 89.9 * D, 0, opts).normal, mapTarget(fm, 90.1 * D, 0, opts).normal)).toBeLessThan(-0.99);
  });

  it("⭐⭐⭐ (a) no cast across two facets FACING APART — the blend's own place kept (RED: the cast asked, its hit taken)", () => {
    let asked = 0;
    const cast = (p: Vec3, n: Vec3): Vec3 => {
      asked++;
      return [p[0] + n[0] * 0.01, p[1] + n[1] * 0.01, p[2] + n[2] * 0.01]; // a surface 1 cm in front: today taken
    };
    for (const y of [86, 88, 89.5, 89.9, 90.1, 91, 94]) blendThroughEdges(fm, y * D, 0, opts, surf(y * D, 0), surf, cast);
    expect(asked).toBe(0);
    // across a CONVEX edge with a part standing PROUD of the front (the gizmo there 3 cm out — §18's front-left corner) the cast still reads the parts
    const proud = (y: number, p: number): Vec3 => {
      const t = mapTarget(fm, y, p, opts);
      return t.normal[2] < -0.99 ? [t.surface[0], t.surface[1], t.surface[2] - 0.03] : t.surface;
    };
    blendThroughEdges(fm, -44 * D, 0, opts, surf(-44 * D, 0), proud, cast);
    expect(asked).toBe(1);
  });

  it("⭐⭐⭐ (b) over a cap the slice's end is blended too: under the bottom at −61° no step over 10 mm a quarter degree through yaw 90° (RED: 280 mm)", () => {
    expect(edgeBlend(fm, 89.5 * D, -61 * D, opts).h).not.toBeNull();
    let worst = 0;
    const place = (y: number) => blendThroughEdges(fm, y * D, -61 * D, opts, surf(y * D, -61 * D), surf);
    for (let y = 70; y < 110; y += 0.25) worst = Math.max(worst, dist(place(y), place(y + 0.25)));
    expect(worst).toBeLessThan(0.01);
  });

  it("⭐ (b) on a box the caps' quarters still meet on the diagonals — the blend there moves nothing", () => {
    const box = buildFaceMap([...noBack, face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])], b);
    for (const y of [44, 45.5, 134, 136]) {
      const t = mapTarget(box, y * D, 70 * D, opts).surface;
      expect(dist(blendThroughEdges(box, y * D, 70 * D, opts, t, (yy, pp) => mapTarget(box, yy, pp, opts).surface), t)).toBeLessThan(0.0005);
    }
  });

  it("⭐⭐ (c) the depth cast from JUST INSIDE the facet: a place on its rim moved in by MAP_COPLANAR_M along t and b, a place inside unchanged; the wiring casts from it", () => {
    const f = fm.facets.find((q) => q.n[0] > 0.99)!;
    const rim = surf(-45 * D + 1e-12, 45 * D - 1e-12); // the +x facet's front-top corner
    const c = castPoint(f, rim);
    expect(dot(c, f.t) - f.tLo).toBeGreaterThan(MAP_COPLANAR_M - 1e-9);
    expect(f.bHi - dot(c, f.b)).toBeGreaterThan(MAP_COPLANAR_M - 1e-9);
    expect(dot(c, f.n)).toBeCloseTo(dot(rim, f.n), 12);
    const mid = surf(0, 0);
    expect(dist(castPoint(f, mid), mid)).toBeLessThan(1e-12);
    expect(code("render/assembly_wiring.ts")).toContain("const pc = castPoint(f, p);");
  });
});
