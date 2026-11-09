// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — F7b, the owner: *"the calm shall apply for any slanted face which is not one of the two faces holding the
// pole. Build it, and simulate it on a simple fake assembly (a hexagon extruded horizontally)"*). RED against `f82bfbe`: `calmTarget`, `calmStep`,
// `calmShown` absent — the calm read every side facet's normal FLATTENED to level and dy's run in world height, so on a 30° face it squared the piece to the
// HORIZONTAL: 20 – 25° off the face's own normal in its middle, pushed away from it (simulated below with the old rule beside the new).
// The fake assembly: a regular hexagonal prism, apothem 150 mm, 500 mm long, lying along x with a face on top — its ends vertical (±x), two facets stacked
// at ±30° in each of the ±z columns, the caps its top and bottom faces. The orbit simulated frame by frame (16 ms) through the real face map.
import { describe, expect, it } from "vitest";
import { buildFaceMap, mapTarget, type MapFace } from "../src/input/face_map";
import { calmShown, calmStep, calmTarget, type CalmKnobs, type CalmState } from "../src/input/orbit_calm";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ang = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / D;
function face(vs: Vec3[]): MapFace {
  const c = cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
  const l = Math.hypot(...c);
  const tris: [Vec3, Vec3, Vec3][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  return { normal: [c[0] / l, c[1] / l, c[2] / l], centre: [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as Vec3, tris };
}
const r = 0.15;
const h = 0.5;
const R0 = r / Math.cos(30 * D);
const ring = (x: number) => [...Array(6)].map((_, k) => [x, R0 * Math.sin(60 * k * D), R0 * Math.cos(60 * k * D)] as Vec3);
const A = ring(-h / 2);
const B = ring(h / 2);
const raw: MapFace[] = [];
for (let k = 0; k < 6; k++) raw.push(face([A[k]!, B[k]!, B[(k + 1) % 6]!, A[(k + 1) % 6]!]));
raw.push(face([...B].reverse()), face(A));
const faces = raw.map((f) => (dot(f.normal, f.centre) < 0 ? { ...f, normal: [-f.normal[0], -f.normal[1], -f.normal[2]] as Vec3 } : f));
const box = { lo: [-h / 2, -r, -R0] as Vec3, hi: [h / 2, r, R0] as Vec3 };
const fm = buildFaceMap(faces, box);
const opts = { edgeMm: 10, edgeDeg: 10 };
const K: CalmKnobs = { shareH: 0.25, zoneHPct: 25, zoneMinHM: 0.03, vOn: true, shareV: 0.25, zoneVPct: 25, zoneMinVM: 0.03 };
const dirOf = (y: number, p: number): Vec3 => [Math.cos(p) * Math.cos(y), Math.sin(p), Math.cos(p) * Math.sin(y)];

/** one frame as the wiring runs it: the map's place, its facet, the normals beyond the column's slice ends (`acrossNormals`), the calm stepped */
function frame(c: CalmState | null, y: number, p: number, rule: "new" | "old" = "new"): CalmState | null {
  const t = mapTarget(fm, y, p, opts);
  const f = fm.facets[t.stack]!;
  if (rule === "old") {
    // ⛔ the rule as built before: the normal flattened to level, dy's run the world's height in the box
    const l = Math.hypot(f.n[0], f.n[2]);
    return calmStep(c, calmTarget(t, { n: l > 1e-9 ? [f.n[0] / l, 0, f.n[2] / l] : f.n, b: [0, 1, 0], bLo: 0, bHi: 1 }, box, K), 16);
  }
  const col = fm.columns[t.side]!;
  const across = { lo: mapTarget(fm, col.mid - col.hw - 1e-6, p, opts).normal, hi: mapTarget(fm, col.mid + col.hw + 1e-6, p, opts).normal };
  return calmStep(c, calmTarget(t, f, box, K, across), 16);
}
const settled = (y: number, p: number, rule: "new" | "old" = "new") => {
  let c: CalmState | null = null;
  for (let i = 0; i < 300; i++) c = frame(c, y, p, rule);
  return c;
};
/** the shown direction's largest step a frame along a path of the orbit's angles (deg) */
function sweep(path: (i: number) => [number, number], n: number, rule: "new" | "old" = "new"): number {
  let c: CalmState | null = null;
  let prev: Vec3 | null = null;
  let worst = 0;
  for (let i = 0; i <= n; i++) {
    const [y, p] = path(i);
    c = frame(c, y * D, p * D, rule);
    const s = calmShown(dirOf(y * D, p * D), c);
    if (prev !== null) worst = Math.max(worst, ang(prev, s));
    prev = s;
  }
  return worst;
}

describe("⭐⭐⭐ (2026-11-09, §8) THE CALM ON A SLANTED FACE — the horizontal hexagonal prism", () => {
  it("⭐⭐⭐ in the middle of the upper +z face (30° up): the piece near square to THAT face — 10° of orbit off its normal shows 2.5°, on it 0° (⛔ the old rule: 25°, 22.5°, 7.6° off it — squared to the horizontal)", () => {
    const upper = fm.facets.find((f) => f.n[1] > 0.4 && f.n[1] < 0.6 && f.n[2] > 0.8)!;
    for (const [p, off] of [[20, 10], [30, 0], [40, 10]] as const) {
      const t = mapTarget(fm, 90 * D, p * D, opts);
      expect(fm.facets[t.stack]).toBe(upper);
      const u = dirOf(90 * D, p * D);
      expect(ang(u, upper.n)).toBeCloseTo(off, 6);
      expect(ang(calmShown(u, settled(90 * D, p * D)), upper.n)).toBeCloseTo(off * 0.25, 6);
      expect(ang(calmShown(u, settled(90 * D, p * D, "old")), upper.n)).toBeGreaterThan(off * 0.25 + 5); // ⛔ as built before
    }
  });

  it("⭐⭐⭐ across a slanted face, dx calmed in ITS frame: 10° of yaw off its normal shows a quarter — the heading turned about the face's own `b`", () => {
    const upper = fm.facets.find((f) => f.n[1] > 0.4 && f.n[1] < 0.6 && f.n[2] > 0.8)!;
    const y = 100 * D; // the face's interior (its slice-end zone a quarter of its 500 mm)
    const p = 30 * D;
    expect(fm.facets[mapTarget(fm, y, p, opts).stack]).toBe(upper);
    const s = calmShown(dirOf(y, p), settled(y, p));
    // the shown direction's angle about `b` off the normal: a quarter of the orbit's
    const t = [-upper.n[2], 0, upper.n[0]] as Vec3;
    const l = Math.hypot(...t);
    const a = Math.atan2(dot(s, [t[0] / l, 0, t[2] / l]), dot(s, upper.n)) / D;
    const u = dirOf(y, p);
    const a0 = Math.atan2(dot(u, [t[0] / l, 0, t[2] / l]), dot(u, upper.n)) / D;
    expect(Math.abs(a)).toBeCloseTo(Math.abs(a0) * 0.25, 6);
  });

  it("⭐⭐⭐ the caps (the two faces holding the poles) no calm: over the top the orbit's whole direction", () => {
    for (const [y, p] of [[90, 70], [0, 80], [200, 65], [300, -75]] as const) {
      expect(mapTarget(fm, y * D, p * D, opts).band).not.toBe("SIDE");
      const u = dirOf(y * D, p * D);
      expect(ang(calmShown(u, settled(y * D, p * D)), u)).toBeLessThan(1e-3);
    }
  });

  it("⭐⭐⭐ the whole angle at a face's edges — up the slope (the ridge between the two slanted faces, pitch 0) and where the frame changes across a slice's end", () => {
    const u = dirOf(90 * D, 0.2 * D);
    expect(ang(calmShown(u, settled(90 * D, 0.2 * D)), u)).toBeLessThan(0.5); // the ridge
    const v = dirOf(134.5 * D, 20 * D); // the +z column's end, toward the −x hexagon end
    expect(ang(calmShown(v, settled(134.5 * D, 20 * D)), v)).toBeLessThan(1);
  });

  it("⭐⭐⭐ NO SWING, simulated frame by frame (0.5° of orbit a frame): every sweep's worst step of the shown direction no larger than the old rule's — through the slanted faces, the ridge, the ends, the caps", () => {
    const paths: [string, (i: number) => [number, number], number][] = [
      ["dy at yaw 90", (i) => [90, -85 + i * 0.5], 340],
      ["dy at yaw 60", (i) => [60, -85 + i * 0.5], 340],
      ["dx at pitch 20", (i) => [i * 0.5, 20], 720],
      ["dx at pitch −40", (i) => [i * 0.5, -40], 720],
      ["dx at pitch 0", (i) => [i * 0.5, 0], 720],
    ];
    for (const [, path, n] of paths) {
      const now = sweep(path, n);
      expect(now).toBeLessThanOrEqual(sweep(path, n, "old") + 1e-6);
      expect(now).toBeLessThan(1.7); // the orbit's own 0.5°: a little over three times, at worst
    }
  });

  it("⭐⭐ a VERTICAL face exactly as before (the cube's every side): the same targets in either rule (the world's up; the box's height)", () => {
    for (const y of [0, 10, 170, 180, 185]) {
      const p = 15 * D;
      const t = mapTarget(fm, y * D, p, opts);
      const f = fm.facets[t.stack]!;
      expect(Math.abs(f.n[1])).toBeLessThan(1e-9);
      const col = fm.columns[t.side]!;
      const across = { lo: mapTarget(fm, col.mid - col.hw - 1e-6, p, opts).normal, hi: mapTarget(fm, col.mid + col.hw + 1e-6, p, opts).normal };
      const a = calmTarget(t, f, box, K);
      expect(a).toEqual(calmTarget(t, { n: f.n, b: [0, 1, 0], bLo: 0, bHi: 1 }, box, K));
      // its slice ends neighbour slanted faces: there the vertical calm released too — in its middle untouched
      if (Math.abs(((y + 360) % 180) - 0) < 11) expect(calmTarget(t, f, box, K, across).sV).toBeCloseTo(a.sV, 9);
    }
  });
});
