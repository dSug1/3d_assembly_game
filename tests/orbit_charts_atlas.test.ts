/**
 * GOLDEN VECTORS — **THE ORBIT ON CHARTS, STEP 2.4a: THE ATLAS DECIDES WHERE A FRAME CHANGES** (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md`
 * §3 3. – 6., §12 2.4a; D-C2, D-C4, D-C6), under `chartLayout` 1 only:
 * * `capTiltHeading` — a face tilts only if it is a CAP with a square layout, its heading one of the layouts' (⛔ `holdsPole`: a side beyond 45°, a virtual
 *   cap): a box's caps (and `Scene_1`'s real cube) give EXACTLY today's `tiltHeading` on every yaw; a rectangle turned 30° its own edges' headings; a
 *   pentagon or a triangle cap none (D-C2); the lying heptagon's bottom a heading, its two top faces and its virtual top none (D-C4, D-C6).
 * * `chartZones` — the frames the atlas takes as zones: on `Scene_0bis`'s tipped heptagon the SAME zone as `polarZones`' (axis, frame, orientation,
 *   whole, facets, poles), whichever tip comes first; a box and the flat-ended heptagon none.
 * * The wiring (`render/assembly_wiring.ts`): each reader guarded by the switch, the old calls kept for `chartLayout` 0, the atlas cached per placed set.
 * RED on the mutants listed in the step's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, DEFAULT_FACET_OPTS, holdsPole, type FaceMap, type FacetOpts, type MapFace } from "../src/input/face_map";
import { assignCharts, capTiltHeading, chartContour, chartZones, type ChartAssignment, type ChartFace } from "../src/input/orbit_charts";
import { polarZones } from "../src/input/polar_zone";
import { capTilt, snapHeading, tiltHeading } from "../src/input/orbit_tilt";
import { prismOutline } from "../src/core/prism";
import type { ShellBox } from "../src/input/orbit_shell";
import type { Vec3 } from "../src/core/vec";
import { boxPolys, heptagonPolys, solid, tippedPolys } from "./helpers/chart_shapes";

const D = Math.PI / 180;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const CHART: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" };
const LAYOUTS: readonly [string, FacetOpts][] = [["built", DEFAULT_FACET_OPTS], ["chart", CHART]];
const YAWS = [-7, -3.3, -2, -0.9, -0.2, 0, 0.3, 0.785, 1, 1.6, 2.5, 3.14, 4.4, 7, 12.6];

function atlas(map: FaceMap): { C: ChartFace[]; A: ChartAssignment } {
  const C = chartContour(map);
  return { C, A: assignCharts(C) };
}
const mapOf = (polys: readonly (readonly Vec3[])[], fo: FacetOpts = DEFAULT_FACET_OPTS): FaceMap => {
  const s = solid(polys);
  return buildFaceMap(s.faces, s.box, fo);
};
/** an upright N-gon prism (its axis vertical), 0.3 m tall */
function uprightPrism(sides: number): Vec3[][] {
  const P = prismOutline(sides, 0.4, 0.4)!;
  const n = P.length;
  const at = (k: number, y: number): Vec3 => [P[k]![0], y, P[k]![1]];
  const out: Vec3[][] = [];
  for (let k = 0; k < n; k++) out.push([at(k, 0), at((k + 1) % n, 0), at((k + 1) % n, 0.3), at(k, 0.3)]);
  out.push(P.map((_, k) => at(k, 0)));
  out.push(P.map((_, k) => at(k, 0.3)));
  return out;
}
const turnY = (a: number) => (p: Vec3): Vec3 => [p[0] * Math.cos(a) - p[2] * Math.sin(a), p[1], p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const caps = (C: readonly ChartFace[]) => C.filter((f) => Math.abs(f.n[1]) > 0.999);

describe("⭐⭐⭐ a cap's tilt heading from its square layouts (`capTiltHeading`, §3 6.)", () => {
  it("⭐ a box's top and bottom: EXACTLY today's heading (`tiltHeading`) on every yaw — both map layouts", () => {
    for (const [, fo] of LAYOUTS) {
      const map = mapOf(boxPolys(0.483, 0.483, 0.483), fo);
      const { C, A } = atlas(map);
      expect(caps(C).length).toBe(2);
      for (const f of caps(C)) for (const y of YAWS) expect(capTiltHeading(A, C, f.index, f.n, y)).toBe(tiltHeading(f.n, y));
    }
  });
  it("⭐ `Scene_1`'s REAL cube (the 240 faces the page fed the map): its caps EXACTLY today's heading on every yaw", () => {
    const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };
    for (const [, fo] of LAYOUTS) {
      const map = buildFaceMap(cube.faces, cube.box, fo);
      const { C, A } = atlas(map);
      const cs = C.filter((f) => f.index === map.top || f.index === map.bottom);
      expect(cs.length).toBe(2);
      for (const f of cs) for (const y of YAWS) expect(capTiltHeading(A, C, f.index, map.facets[f.index]!.n, y)).toBe(tiltHeading(map.facets[f.index]!.n, y));
    }
  });
  it("⭐ a rectangle turned 30° about the vertical: the headings along ITS edges (30° + k·90°), the nearest to today's — not `snapHeading`'s", () => {
    const map = mapOf(boxPolys(0.5, 0.3, 0.3).map((q) => q.map(turnY(30 * D))));
    const { C, A } = atlas(map);
    for (const f of caps(C)) {
      expect(A.layouts.get(C.indexOf(f))!.length).toBe(4);
      for (const y of YAWS) {
        const h = capTiltHeading(A, C, f.index, f.n, y)!;
        const t = tiltHeading(f.n, y);
        // on one of the rectangle's own edge headings (the orbit's convention: x = cos, z = sin — `turnY` turns x to the heading 30°)
        const k = wrapPi(h - 30 * D) / (Math.PI / 2);
        expect(Math.abs(k - Math.round(k))).toBeLessThan(1e-9);
        expect(Math.abs(wrapPi(h - snapHeading(y)))).toBeGreaterThan(29 * D);
        // the nearest of the four to today's, unwrapped next to it
        expect(Math.abs(h - t)).toBeLessThanOrEqual(45 * D + 1e-9);
        // capTilt there lays F's vertical along an edge of the rectangle (square to the cap, along x or z turned)
        const R = capTilt(h, f.n);
        const fy: Vec3 = [R[0][1], R[1][1], R[2][1]];
        const ex = turnY(30 * D)([1, 0, 0]);
        const ez = turnY(30 * D)([0, 0, 1]);
        expect(Math.max(Math.abs(dot(fy, ex)), Math.abs(dot(fy, ez)))).toBeCloseTo(1, 9);
      }
    }
  });
  it("⭐ a cap that is not a rectangle (a pentagon, a triangle — D-C2): no tilt", () => {
    for (const sides of [5, 3]) {
      const { C, A } = atlas(mapOf(uprightPrism(sides)));
      const cs = caps(C);
      expect(cs.length).toBe(2);
      for (const f of cs) {
        expect(A.kind[C.indexOf(f)]).toBe("CAP");
        for (const y of YAWS) expect(capTiltHeading(A, C, f.index, f.n, y)).toBeNull();
      }
    }
  });
  it("⭐ `Scene_0`'s lying heptagon: the bottom a heading (today's); the two top faces NO tilt (D-C4 — ⛔ `holdsPole` beyond 45°); the virtual top none (D-C6)", () => {
    for (const [, fo] of LAYOUTS) {
      const map = mapOf(heptagonPolys(), fo);
      const { C, A } = atlas(map);
      const bottom = map.facets[map.bottom]!;
      expect(C.some((f) => f.index === map.bottom)).toBe(true);
      for (const y of YAWS) expect(capTiltHeading(A, C, map.bottom, bottom.n, y)).toBe(tiltHeading(bottom.n, y));
      const tops = map.facets.map((f, i) => (f.real && f.kind === "SIDE" && f.n[1] > Math.SQRT1_2 ? i : -1)).filter((i) => i >= 0);
      expect(tops.length).toBe(2);
      for (const i of tops) {
        expect(holdsPole(map, i)).toBe("TOP"); // today's detector tilts them
        for (const y of YAWS) expect(capTiltHeading(A, C, i, map.facets[i]!.n, y)).toBeNull();
      }
      // the ridge: a pole held by an EDGE — the map's virtual top, not on the contour
      expect(map.facets[map.top]!.real).toBe(false);
      expect(holdsPole(map, map.top)).toBe("TOP");
      expect(capTiltHeading(A, C, map.top, map.facets[map.top]!.n, 0.3)).toBeNull();
    }
  });
  it("a heading is a candidate only where `capTilt` really builds the layout — a CAP of normal LEVEL (a frame's end, given by hand): `capTilt` keeps F upright there, so none", () => {
    const map = mapOf(boxPolys(0.483, 0.483, 0.483));
    const { C, A } = atlas(map);
    const side = C.findIndex((f) => f.n[0] > 0.999);
    const kind = A.kind.map((k, i) => (i === side ? "CAP" : k));
    const layouts = new Map(A.layouts);
    layouts.set(side, [{ frame: 0, rings: false, axis: [0, 0, 1], mode: "AXIS+" }, { frame: 0, rings: false, axis: [0, 0, 1], mode: "AXIS-" }]);
    const B: ChartAssignment = { ...A, kind, layouts };
    for (const y of YAWS) expect(capTiltHeading(B, C, C[side]!.index, C[side]!.n, y)).toBeNull();
  });
  it("a facet index not on the contour: none", () => {
    const map = mapOf(boxPolys(0.483, 0.483, 0.483));
    const { C, A } = atlas(map);
    for (const i of [-1, map.facets.length, 99]) expect(capTiltHeading(A, C, i, [0, 1, 0], 0)).toBeNull();
  });
});

describe("⭐⭐⭐ the zones from the atlas (`chartZones`, §3 3. – 4.)", () => {
  it("⭐ `Scene_0bis`'s tipped heptagon (apex centred or off): ONE zone, the SAME as `polarZones`' — axis, frame, orientation, whole, facets, poles", () => {
    for (const centred of [true, false])
      for (const [, fo] of LAYOUTS) {
        const map = mapOf(tippedPolys(7, 0.12, centred), fo);
        const { C, A } = atlas(map);
        const zs = chartZones(A, C);
        const ps = polarZones(map);
        expect(zs.length).toBe(1);
        expect(ps.length).toBe(1);
        const [z, p] = [zs[0]!, ps[0]!];
        expect(z.axis).toEqual(p.axis);
        expect(z.frame).toEqual(p.frame);
        expect(z.orientation).toBe("SPIT");
        expect(z.orientation).toBe(p.orientation);
        expect(z.whole).toBe(true);
        expect(z.whole).toBe(p.whole);
        expect(z.facets).toEqual(p.facets);
        expect(z.facets.length).toBe(14);
        expect(z.poles).toEqual(p.poles);
      }
  });
  it("⭐ the same with the tips' order reversed: the axis's sense follows the contour's first pole, as `polarZones`' does (+x then)", () => {
    const P = tippedPolys(7, 0.12);
    const map = mapOf([...P.slice(0, 7), ...P.slice(14), ...P.slice(7, 14)]);
    const { C, A } = atlas(map);
    const [z, p] = [chartZones(A, C)[0]!, polarZones(map)[0]!];
    expect(p.axis).toEqual([1, 0, 0]);
    expect(z.axis).toEqual(p.axis);
    expect(z.frame).toEqual(p.frame);
    expect(z.poles).toEqual(p.poles);
  });
  it("a box and the flat-ended heptagon: no zone", () => {
    for (const polys of [boxPolys(0.483, 0.483, 0.483), heptagonPolys()])
      for (const [, fo] of LAYOUTS) {
        const { C, A } = atlas(mapOf(polys, fo));
        expect(chartZones(A, C)).toEqual([]);
      }
  });
  it("a frame held AXIS is an UPRIGHT zone, its axis UP (the AXIS- frame's opposite) — the assignment's hold changed by hand", () => {
    const map = mapOf(tippedPolys(7, 0.12));
    const { C, A } = atlas(map);
    const u = A.used[0]!;
    for (const mode of ["AXIS+", "AXIS-"] as const) {
      const B: ChartAssignment = { ...A, used: [{ ...u, home: { ...u.home, mode } }] };
      const z = chartZones(B, C)[0]!;
      expect(z.orientation).toBe("UPRIGHT");
      const want = mode === "AXIS+" ? A.frames[u.home.frame]!.axis[0] : -A.frames[u.home.frame]!.axis[0];
      expect(z.axis[0]).toBe(Math.sign(want));
    }
  });
  it("`own`: the frame's own faces before the whole rule (`Scene_0bis`: the 14 tips of the 21 it serves)", () => {
    const { C, A } = atlas(mapOf(tippedPolys(7, 0.12)));
    const u = A.used[0]!;
    expect(new Set(u.faces).size).toBe(21);
    expect(u.own.length).toBe(14);
    for (const i of u.own) expect(C[i]!.pts.length).toBe(3);
    expect(u.faces.slice(0, 14)).toEqual(u.own);
  });
});

describe("⭐⭐⭐ the wiring: the atlas decides only under the switch (`render/assembly_wiring.ts`)", () => {
  const raw = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const fn = (sig: string): string => {
    const i = raw.indexOf(sig);
    expect(i, sig).toBeGreaterThanOrEqual(0);
    return raw.slice(i, raw.indexOf("\n}\n", i) + 3).replace(/\s+/g, " ");
  };
  it("`tiltOn`: the atlas's test and heading under `chartLayout` 1, `holdsPole` / `tiltHeading` otherwise", () => {
    const f = fn("function tiltOn(");
    expect(f).toContain("if (st.cfg.chartLayout === 1) { ");
    expect(f).toContain("const h = capTiltHeading(at.assign, at.contour, capStack, f.n, q.yaw); if (h === null) return;");
    expect(f).toContain("} else { ");
    expect(f).toContain("const pole = holdsPole(wm, capStack); if (pole === null) return; top = pole === \"TOP\";");
    expect(f).toContain("hs = tiltHeading(cap.n, q.yaw);");
    expect(f.indexOf("capTiltHeading(")).toBeLessThan(f.indexOf("} else {"));
    expect(f.indexOf("holdsPole(")).toBeGreaterThan(f.indexOf("} else {"));
  });
  it("`nextTiltHeading`: the same", () => {
    const f = fn("function nextTiltHeading(");
    expect(f).toContain("if (st.cfg.chartLayout === 1) { const at = atlasOf(st); return f === undefined || at === null ? null : capTiltHeading(at.assign, at.contour, i, f.n, yaw); }");
    expect(f).toContain("return f === undefined || holdsPole(wm, i) === null ? null : tiltHeading(f.n, yaw);");
  });
  it("`zonesOf`: the atlas's zones under the switch, its own key; `polarZones` otherwise; `zoneOn` 0 none first", () => {
    const f = fn("function zonesOf(");
    expect(f).toContain("if (wm === null || st.cfg.zoneOn !== 1) return [];");
    expect(f).toContain("if (st.cfg.chartLayout === 1) { const at = atlasOf(st); if (at === null) return []; const keyA = `atlas#${at.key}`;");
    expect(f).toContain("const zonesA = chartZones(at.assign, at.contour);");
    expect(f).toContain("const zones = polarZones(wm, o);");
    expect(f.indexOf("st.cfg.zoneOn !== 1")).toBeLessThan(f.indexOf("chartLayout === 1"));
    expect(f.indexOf("chartZones(")).toBeLessThan(f.indexOf("polarZones("));
  });
  it("⭐ the atlas: from the WORLD face map, cached per its key and the three knobs — computed in ONE place, read only under the switch", () => {
    const f = fn("function atlasOf(");
    expect(f).toContain("const wm = worldFaceMap(st);");
    expect(f).toContain("const key = `${st.asmWorldMap?.key ?? \"\"}#${c.zoneUprightMaxDeg}#${c.zoneSpitMinDeg}#${c.zoneWholeShare}`;");
    expect(f).toContain("if (st.asmAtlas !== null && st.asmAtlas.key === key) return st.asmAtlas;");
    expect(f).toContain("const contour = chartContour(wm);");
    expect(f).toContain("assignCharts(contour, { ...DEFAULT_CHART_OPTS, uprightMaxDeg: c.zoneUprightMaxDeg, spitMinDeg: c.zoneSpitMinDeg, wholeShare: c.zoneWholeShare });");
    expect(raw.match(/assignCharts\(/g)?.length).toBe(1);
    expect(raw.match(/chartContour\(/g)?.length).toBe(1);
    // its three readers, each inside its function's `chartLayout === 1` branch
    expect(raw.match(/atlasOf\(st\)/g)?.length).toBe(3);
    for (const sig of ["function tiltOn(", "function nextTiltHeading(", "function zonesOf("]) {
      const g = fn(sig);
      expect(g.indexOf("st.cfg.chartLayout === 1")).toBeLessThan(g.indexOf("atlasOf(st)"));
    }
    // the old detectors: in the wiring only on the switch's other path
    expect(raw.match(/holdsPole\(/g)?.length).toBe(2);
    expect(raw.match(/polarZones\(/g)?.length).toBe(1);
  });
});
