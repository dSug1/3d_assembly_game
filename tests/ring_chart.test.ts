/**
 * GOLDEN VECTORS — **THE ORBIT ON CHARTS, STEP 1.3** (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §2.4, §7.2): the RINGS chart, the orbit's
 * last fallback (`src/input/ring_chart.ts`), not wired yet.
 * * A dodecahedron standing on a face: a ring (one pitch, every yaw) is level; a cut (one yaw, every pitch) lies in one plane through the spine; no step of
 *   1° moves nothing, none more than 12 mm; at ±90° the top / bottom face's centre whatever the yaw, the cap's places on the cap; the round trip.
 * * A cube standing on a corner: the levels' heights and pitches (the prototype's numbers, pinned); two levels never at one pitch; the round trip.
 * * A barrel (a box bevelled 22° top and bottom): THE REPAIR — the rings' means put its inner levels 22° apart over 90 % of the height; spread to a quarter
 *   of their share.
 * * The shed (its spine slanted): a cut in one plane through the spine; the way back off its bottom cap exact (the rim's meridian about the spine).
 * * A box: the rings' place on a side face is on that face's plane and inside it.
 * The whole comparison with the prototype (`scripts/probes/chart_lib.ts`) on 35 shapes: `scripts/probes/ring_chart_check.ts`. RED on the mutants recorded
 * in the step's report.
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap } from "../src/input/face_map";
import { chartContour, type ChartFace } from "../src/input/orbit_charts";
import { buildRingChart, ringAngles, ringTarget, type RingChart } from "../src/input/ring_chart";
import type { Vec3 } from "../src/core/vec";
import { barrelPolys, boxPolys, CUBE, DOD, DOD_FACE, hullPolys, onSphere, shedPolys, solid } from "./helpers/chart_shapes";

const D = Math.PI / 180;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** the contour and the rings chart of a solid given by its polygons */
function rings(polys: readonly (readonly Vec3[])[]): { C: ChartFace[]; R: RingChart } {
  const s = solid(polys);
  const map = buildFaceMap(s.faces, s.box);
  const C = chartContour(map);
  return { C, R: buildRingChart(map, C) };
}
const dodecahedron = () => rings(hullPolys(onSphere(DOD, 0.25, DOD_FACE)));
const cubeOnCorner = () => rings(hullPolys(onSphere(CUBE, 0.4, [1, 1, 1])));
/** the contour face whose normal is straight up (`up`) or down */
const capOf = (C: readonly ChartFace[], up: boolean): ChartFace => C.find((f) => (up ? f.n[1] : -f.n[1]) > 0.9999)!;
/** is `p` inside the convex polygon `f` (within `tol`), whichever way its corners turn? */
const inside = (f: ChartFace, p: Vec3, tol: number): boolean => {
  const s = f.pts.map((a, k) => dot(cross(sub(f.pts[(k + 1) % f.pts.length]!, a), sub(p, a)), f.n));
  return s.every((x) => x >= -tol) || s.every((x) => x <= tol);
};
/** the largest round trip place → angles → place on a 1° grid (m) */
function roundTrip(R: RingChart): number {
  let w = 0;
  for (let iy = 0; iy < 360; iy++)
    for (let ip = -90; ip <= 90; ip++) {
      const t = ringTarget(R, iy * D, ip * D);
      const a = ringAngles(R, t.surface, t.stack);
      w = Math.max(w, dist(ringTarget(R, a.yaw, a.pitch).surface, t.surface));
    }
  return w;
}
/** the spine's point at the height `y`: the bottom end's centre → the top end's, given */
const spineAt = (b: Vec3, t: Vec3, y: number): Vec3 => {
  const u = (y - b[1]) / (t[1] - b[1]);
  return [b[0] + u * (t[0] - b[0]), y, b[2] + u * (t[2] - b[2])];
};
/**
 * the largest distance (m) of the places of one yaw, every pitch, from the half-plane of that azimuth through the spine `b` → `t` (−1: behind it);
 * `sideOnly`: the side band's places only (a cap's run from its rim to its centre, off a slanted spine's foot by the rim's 1 µm)
 */
function offCut(R: RingChart, b: Vec3, t: Vec3, sideOnly = false): number {
  let w = 0;
  for (let iy = 0; iy < 360; iy += 7)
    for (let ip = -90; ip <= 90; ip++) {
      const g = ringTarget(R, iy * D, ip * D);
      if (sideOnly && g.band !== "SIDE") continue;
      const p = g.surface;
      const s = spineAt(b, t, p[1]);
      const d: Vec3 = [Math.cos(iy * D), 0, Math.sin(iy * D)];
      const v = sub(p, s);
      if (dot(v, d) < -1e-9) return -1;
      w = Math.max(w, Math.abs(v[0] * d[2] - v[2] * d[0]));
    }
  return w;
}

describe("⭐⭐⭐ the rings on a dodecahedron standing on a face (§2.4)", () => {
  it("a RING — one pitch, every yaw — is level, on the side band", () => {
    const { R } = dodecahedron();
    const lv = R.levels.p;
    expect(lv.length).toBe(4);
    let n = 0;
    for (let ip = -55; ip <= 55; ip += 5) {
      const y0 = ringTarget(R, 0, ip * D).surface[1];
      for (let iy = 0; iy < 360; iy++) {
        const t = ringTarget(R, iy * D, ip * D);
        expect(t.band).toBe("SIDE");
        expect(Math.abs(t.surface[1] - y0)).toBeLessThan(1e-12);
        n++;
      }
    }
    expect(n).toBe(23 * 360);
  });
  it("a CUT — one yaw, every pitch — lies in the half-plane of that azimuth through the spine (the bottom face's centre → the top face's)", () => {
    const { C, R } = dodecahedron();
    expect(offCut(R, capOf(C, false).c, capOf(C, true).c)).toBeGreaterThanOrEqual(0);
    expect(offCut(R, capOf(C, false).c, capOf(C, true).c)).toBeLessThan(1e-9);
  });
  it("no step of 1° moves nothing (but round a pole), none moves more than 12 mm", () => {
    const { R } = dodecahedron();
    let lo = Infinity;
    let hi = 0;
    for (let iy = 0; iy < 360; iy++)
      for (let ip = -90; ip <= 90; ip++) {
        const p = ringTarget(R, iy * D, ip * D).surface;
        if (ip < 90) {
          const d = dist(p, ringTarget(R, iy * D, (ip + 1) * D).surface);
          lo = Math.min(lo, d);
          hi = Math.max(hi, d);
        }
        if (Math.abs(ip) < 90) {
          const d = dist(p, ringTarget(R, (iy + 1) * D, ip * D).surface);
          lo = Math.min(lo, d);
          hi = Math.max(hi, d);
        }
      }
    expect(lo).toBeGreaterThan(1e-6);
    expect(hi).toBeLessThan(0.012);
  });
  it("at ±90° the top / bottom face's centre whatever the yaw; every place beyond a cap's level on the cap, inside it", () => {
    const { C, R } = dodecahedron();
    for (const up of [true, false]) {
      const cap = capOf(C, up);
      for (let iy = 0; iy < 360; iy += 5) {
        const t = ringTarget(R, iy * D, up ? 90 * D : -90 * D);
        expect(t.band).toBe(up ? "TOP" : "BOTTOM");
        expect(t.stack).toBe(cap.index);
        expect(dist(t.surface, cap.c)).toBeLessThan(1e-12);
      }
      const edge = up ? R.levels.p[R.levels.p.length - 1]! : R.levels.p[0]!;
      for (let iy = 0; iy < 360; iy += 3)
        for (let k = 0; k <= 20; k++) {
          const pitch = up ? edge + 1e-9 + (k / 20) * (90 * D - edge - 1e-9) : edge - 1e-9 - (k / 20) * (edge + 90 * D - 1e-9);
          const t = ringTarget(R, iy * D, pitch);
          expect(t.stack).toBe(cap.index);
          expect(Math.abs(dot(sub(t.surface, cap.pts[0]!), cap.n))).toBeLessThan(1e-9);
          // (the rim is read on the ring 1 µm inside the cap's height — on the dodecahedron's flaring sides 0.5 µm beyond the cap's own outline)
          expect(inside(cap, t.surface, 1e-6 * Math.max(...cap.pts.map((q) => dist(q, cap.c))))).toBe(true);
        }
    }
  });
  it("the round trip place → angles → place within 1e-9 m", () => {
    expect(roundTrip(dodecahedron().R)).toBeLessThan(1e-9);
  });
});

describe("⭐⭐⭐ the levels: every corner's height, the pitch the mean of the rings just below and just above (§2.4)", () => {
  it("a cube standing on a corner: four levels a third of its diagonal apart, at −90°, ∓35.25°, +90° (the prototype's numbers)", () => {
    const { R } = cubeOnCorner();
    const h = (0.8 * 1) / 1;
    const want = { y: [0, h / 3, (2 * h) / 3, h], p: [-Math.PI / 2, -0.6152950647577868, 0.6152950647577857, Math.PI / 2] };
    expect(R.bottom.kind).toBe("POINT");
    expect(R.top.kind).toBe("POINT");
    expect(R.levels.y.length).toBe(4);
    want.y.forEach((y, k) => expect(R.levels.y[k]!).toBeCloseTo(y, 12));
    want.p.forEach((p, k) => expect(R.levels.p[k]!).toBeCloseTo(p, 12));
    // the cube's own elevations: its faces at ±35.26° (asin 1/√3) — the rings just below the first inner level and just above the second
    expect(R.levels.p[1]! / D).toBeCloseTo(-35.254, 3);
  });
  it("…two levels never at one pitch (each interval at least a quarter of its share by the height)", () => {
    for (const { R } of [cubeOnCorner(), dodecahedron(), rings(barrelPolys())]) {
      const { y, p } = R.levels;
      const range = p[p.length - 1]! - p[0]!;
      const height = y[y.length - 1]! - y[0]!;
      for (let k = 1; k < p.length; k++) expect(p[k]! - p[k - 1]!).toBeGreaterThanOrEqual(0.25 * ((y[k]! - y[k - 1]!) / height) * range - 1e-12);
    }
  });
  it("the round trip on the cube standing on a corner within 1e-9 m", () => {
    expect(roundTrip(cubeOnCorner().R)).toBeLessThan(1e-9);
  });
  it("⭐ THE REPAIR — the barrel: the rings' means put its inner levels at −11° and +11° over 90 % of the height; the second raised to a quarter of its share", () => {
    const { R } = rings(barrelPolys());
    expect(R.levels.y.length).toBe(4);
    [0, 0.05, 0.95, 1].forEach((y, k) => expect(R.levels.y[k]!).toBeCloseTo(y, 12));
    // the prototype's numbers: −56°, −11° (the means), +14.2° (−11° + a quarter of 0.9 × 112°), +56°
    [-0.9773843811168245, -0.1919862177193762, 0.24783675378319472, 0.9773843811168244].forEach((p, k) => expect(R.levels.p[k]!).toBeCloseTo(p, 12));
  });
});

describe("⭐⭐ the spine runs END TO END — the shed's slants (§2.4)", () => {
  it("a cut's side places lie in the half-plane through the spine: the bottom face's centre → the top edge's middle", () => {
    const { C, R } = rings(shedPolys());
    expect(R.top.kind).toBe("EDGE");
    const top = C.flatMap((f) => f.pts).filter((p) => p[1] > R.top.y - 1e-6);
    const mid: Vec3 = [(Math.min(...top.map((p) => p[0])) + Math.max(...top.map((p) => p[0]))) / 2, R.top.y, top[0]![2]];
    expect(Math.abs(mid[2])).toBeGreaterThan(0.2);
    const w = offCut(R, capOf(C, false).c, mid, true);
    expect(w).toBeGreaterThanOrEqual(0);
    expect(w).toBeLessThan(1e-9);
  });
  it("the round trip off its bottom cap within 1e-9 m (the rim's meridian is about the spine, 0.2 µm off the cap's centre there)", () => {
    expect(roundTrip(rings(shedPolys()).R)).toBeLessThan(1e-9);
  });
});

describe("⭐ a box: the rings' place on a side face", () => {
  it("is on that face's plane and inside it", () => {
    const { C, R } = rings(boxPolys(0.483, 0.3, 0.6));
    let n = 0;
    for (let iy = 0; iy < 360; iy++)
      for (let ip = -44; ip <= 44; ip++) {
        const t = ringTarget(R, iy * D, ip * D);
        expect(t.band).toBe("SIDE");
        const f = C.find((g) => g.index === t.stack)!;
        expect(Math.abs(f.n[1])).toBeLessThan(1e-9);
        expect(t.normal).toEqual(f.n);
        expect(Math.abs(dot(sub(t.surface, f.pts[0]!), f.n))).toBeLessThan(1e-12);
        expect(inside(f, t.surface, 1e-12)).toBe(true);
        expect(t.across.L).toBeGreaterThanOrEqual(t.across.lo - 1e-12);
        expect(t.across.L).toBeLessThanOrEqual(t.across.hi + 1e-12);
        expect(t.side).toBe(-1);
        n++;
      }
    expect(n).toBe(360 * 89);
  });
});
