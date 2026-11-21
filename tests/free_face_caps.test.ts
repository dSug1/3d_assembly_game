/**
 * GOLDEN VECTORS — **PACKAGE C2W: C2's WIRING ON GRAVITY'S CAPS** (2026-11-16, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §16), under
 * the charts (⛔ their switch `chartLayout` deleted at step 2.5, 2026-11-16 — the default half of the pins kept):
 * * **W5** — `capTiltHeading(…, along)`: the tilt's heading on a cap is the layout whose up (F's vertical in the world) is the heading CARRIED IN by the
 *   entry edge (`freeEdges` / `entryHeading`, the functions C4's spit entry calls) — on a box turned 30° every entry edge's own layout at every yaw
 *   (⛔ the snapped yaw's nearest: 90° off at some); on an axis-aligned box the SAME number as before (`tiltHeading`, bit for bit) for a yaw over the
 *   entry side.
 * * **W7** — `frameBox`: a frame's map is built in the placed parts' own box read in that frame — the turned world box's number kept where equal within
 *   float noise (an axis-aligned shape: bit for bit), the parts' own bounds where tighter (a turned shape).
 * * The wiring (`render/assembly_wiring.ts`): one entry function (`freeEntry`) for a spit's free face and gravity's cap; the tilt's heading along it;
 *   the place before the one shown kept (`asmPlaceWas`); the frame's box under the switch.
 * RED on the mutants listed in the package's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, DEFAULT_FACET_OPTS, type FaceMap, type FacetOpts, type MapFace } from "../src/input/face_map";
import type { ShellBox } from "../src/input/orbit_shell";
import { assignCharts, capTiltHeading, chartContour, type ChartAssignment, type ChartFace } from "../src/input/orbit_charts";
import { capTilt, FRAME_BOX_NOISE_M, frameBox, mulT, tiltBox, tiltFaces, tiltHeading, type Mat3 } from "../src/input/orbit_tilt";
import { freeEdges } from "../src/input/free_face";
import { boxPolys, solid } from "./helpers/chart_shapes";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const UP: Vec3 = [0, 1, 0];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const CHART: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" };
const YAWS = [-7, -3.3, -2, -0.9, -0.2, 0, 0.3, 0.785, 1, 1.6, 2.5, 3.14, 4.4, 7, 12.6];
const turnY = (a: number) => (p: Vec3): Vec3 => [p[0] * Math.cos(a) - p[2] * Math.sin(a), p[1], p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const fVertical = (R: Mat3): Vec3 => [R[0][1], R[1][1], R[2][1]];

function atlasOf(polys: readonly (readonly Vec3[])[]): { map: FaceMap; C: ChartFace[]; A: ChartAssignment } {
  const s = solid(polys);
  const map = buildFaceMap(s.faces, s.box, CHART);
  const C = chartContour(map);
  return { map, C, A: assignCharts(C) };
}
const caps = (C: readonly ChartFace[]) => C.map((f, ci) => ({ f, ci })).filter(({ f }) => Math.abs(f.n[1]) > 0.999);

describe("⭐⭐⭐ W5 — the tilt's heading carried in by the entry edge (`capTiltHeading` with `along`)", () => {
  it("⭐ a box turned 30°: over EVERY edge of either cap, at EVERY yaw, the layout whose up is that edge's heading — F's vertical along it", () => {
    const { C, A } = atlasOf(boxPolys(0.5, 0.3, 0.3).map((q) => q.map(turnY(30 * D))));
    const cs = caps(C);
    expect(cs.length).toBe(2);
    let n = 0;
    for (const { f, ci } of cs)
      for (const e of freeEdges(C, ci, UP)) {
        expect(e.heading).not.toBeNull();
        for (const y of YAWS) {
          const h = capTiltHeading(A, C, f.index, f.n, y, e.heading)!;
          expect(dot(fVertical(capTilt(h, f.n)), e.heading!)).toBeGreaterThan(1 - 1e-9);
          // unwrapped next to today's heading (the swing's angle never over a half turn)
          expect(Math.abs(h - tiltHeading(f.n, y))).toBeLessThanOrEqual(Math.PI + 1e-9);
          n++;
        }
      }
    expect(n).toBe(2 * 4 * YAWS.length);
  });
  it("⭐ (the finding, §15 F2) without `along` — the snapped yaw's nearest — some entry takes another edge's layout, a quarter off", () => {
    const { C, A } = atlasOf(boxPolys(0.5, 0.3, 0.3).map((q) => q.map(turnY(30 * D))));
    let off = 0;
    for (const { f, ci } of caps(C))
      for (const e of freeEdges(C, ci, UP)) {
        // the camera over the entry side: its yaw the side's own heading (the orbit's convention, x = cos, z = sin), ±40°
        const G = C[e.to]!;
        const ys = Math.atan2(G.n[2], G.n[0]);
        for (const dy of [-40, -20, 0, 20, 40]) {
          const h = capTiltHeading(A, C, f.index, f.n, ys + dy * D)!;
          if (dot(fVertical(capTilt(h, f.n)), e.heading!) < 0.5) off++;
          // ⭐ the carried one is the edge's whatever the yaw
          expect(dot(fVertical(capTilt(capTiltHeading(A, C, f.index, f.n, ys + dy * D, e.heading)!, f.n)), e.heading!)).toBeGreaterThan(1 - 1e-9);
        }
      }
    expect(off).toBeGreaterThan(0);
  });
  it("⭐ an axis-aligned box: over a side, the yaw over that side (±44°) — the SAME number as before (`tiltHeading`), bit for bit", () => {
    for (const dims of [[0.483, 0.483, 0.483], [0.5, 0.3, 0.2]] as const) {
      const { C, A } = atlasOf(boxPolys(dims[0], dims[1], dims[2]));
      for (const { f, ci } of caps(C))
        for (const e of freeEdges(C, ci, UP)) {
          const G = C[e.to]!;
          const ys = Math.atan2(G.n[2], G.n[0]);
          for (const k of [-3, -1, 0, 1, 3]) for (const dy of [-44, -30, -5, 0, 5, 30, 44]) {
            const y = ys + dy * D + k * 2 * Math.PI;
            const h = capTiltHeading(A, C, f.index, f.n, y, e.heading);
            expect(h).toBe(tiltHeading(f.n, y));
            expect(h).toBe(capTiltHeading(A, C, f.index, f.n, y));
          }
        }
    }
  });
  it("⭐ `along` null or along the cap's normal (nothing in its plane): the nearest to today's, as before", () => {
    const { C, A } = atlasOf(boxPolys(0.5, 0.3, 0.3).map((q) => q.map(turnY(30 * D))));
    for (const { f } of caps(C))
      for (const y of YAWS) {
        expect(capTiltHeading(A, C, f.index, f.n, y, null)).toBe(capTiltHeading(A, C, f.index, f.n, y));
        expect(capTiltHeading(A, C, f.index, f.n, y, f.n)).toBe(capTiltHeading(A, C, f.index, f.n, y));
      }
  });
  it("⭐ a heading EXACTLY between two layouts (45° on a box's top): a tie — the first candidate in the layouts' order (each layout's heading, then its opposite)", () => {
    const { C, A } = atlasOf(boxPolys(0.5, 0.3, 0.3));
    const top = caps(C).find(({ f }) => f.n[1] > 0)!;
    // the candidates in `capTiltHeading`'s own order, the first whose F-vertical is nearest the heading
    const lay = A.layouts.get(top.ci)!;
    const along: Vec3 = [Math.SQRT1_2, 0, Math.SQRT1_2];
    let first: Vec3 | null = null;
    let best = -Infinity;
    for (const l of lay) {
      const up: Vec3 = l.mode === "AXIS-" ? [-l.axis[0], -l.axis[1], -l.axis[2]] : l.axis;
      const h0 = Math.atan2(up[2], up[0]);
      for (const hs of [h0, h0 + Math.PI]) {
        const fy = fVertical(capTilt(hs, top.f.n));
        if (dot(fy, up) < Math.cos(3 * D)) continue;
        const k = dot(fy, along);
        if (k > best + 1e-9) {
          best = k;
          first = fy;
        }
      }
    }
    const h = capTiltHeading(A, C, top.f.index, top.f.n, 0.3, along)!;
    expect(dot(fVertical(capTilt(h, top.f.n)), first!)).toBeGreaterThan(1 - 1e-9);
    expect(Math.abs(dot(fVertical(capTilt(h, top.f.n)), along) - Math.SQRT1_2)).toBeLessThan(1e-9);
  });
  it("⭐ a heading between two layouts: the nearest of them (a tie: the first in the layouts' order — deterministic)", () => {
    const { C, A } = atlasOf(boxPolys(0.5, 0.3, 0.3));
    const top = caps(C).find(({ f }) => f.n[1] > 0)!;
    const a: Vec3 = [Math.cos(20 * D), 0, Math.sin(20 * D)];
    const h = capTiltHeading(A, C, top.f.index, top.f.n, 0.3, a)!;
    expect(dot(fVertical(capTilt(h, top.f.n)), [1, 0, 0])).toBeGreaterThan(1 - 1e-9);
    const b: Vec3 = [Math.cos(70 * D), 0, Math.sin(70 * D)];
    const hb = capTiltHeading(A, C, top.f.index, top.f.n, 0.3, b)!;
    expect(dot(fVertical(capTilt(hb, top.f.n)), [0, 0, 1])).toBeGreaterThan(1 - 1e-9);
  });
});

describe("⭐⭐⭐ W7 — a frame's map in the parts' own box read in that frame (`frameBox`)", () => {
  const pts = (polys: readonly (readonly Vec3[])[]): Vec3[][] => [polys.flat()];
  it("⭐ an axis-aligned box, every tilt the charts make on it: the turned world box's numbers EXACTLY (bit for bit)", () => {
    const polys = boxPolys(0.5, 0.3, 0.2).map((q) => q.map((p): Vec3 => [p[0] + 0.137, p[1] + 0.05, p[2] - 0.211]));
    const s = solid(polys);
    for (const n of [UP, [0, -1, 0] as Vec3])
      for (const hs of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 2.5 * Math.PI]) {
        const R = capTilt(hs, n);
        const a = frameBox(s.box, R, pts(polys));
        const b = tiltBox(s.box, R);
        for (const k of [0, 1, 2]) {
          expect(Object.is(a.lo[k], b.lo[k])).toBe(true);
          expect(Object.is(a.hi[k], b.hi[k])).toBe(true);
        }
      }
  });
  it("⭐ a box turned 30°, tilted on its own layout: the parts' bounds in F (tight), ⛔ not the turned world box (looser by centimetres)", () => {
    const polys = boxPolys(0.5, 0.3, 0.3).map((q) => q.map(turnY(30 * D)));
    const { C, A } = atlasOf(polys);
    const s = solid(polys);
    const top = caps(C).find(({ f }) => f.n[1] > 0)!;
    const e = freeEdges(C, top.ci, UP)[0]!;
    const R = capTilt(capTiltHeading(A, C, top.f.index, top.f.n, 0, e.heading)!, top.f.n);
    const a = frameBox(s.box, R, pts(polys));
    const b = tiltBox(s.box, R);
    const vs = polys.flat().map((p) => mulT(R, p));
    let looser = 0;
    for (const k of [0, 1, 2]) {
      expect(a.lo[k]).toBeCloseTo(Math.min(...vs.map((v) => v[k]!)), 12);
      expect(a.hi[k]).toBeCloseTo(Math.max(...vs.map((v) => v[k]!)), 12);
      looser = Math.max(looser, a.lo[k]! - b.lo[k]!, b.hi[k]! - a.hi[k]!);
    }
    expect(looser).toBeGreaterThan(0.05);
  });
  it("⭐ a part proud of the main shape stays inside the box (the parts' vertices, never the contour's corners)", () => {
    const main = boxPolys(0.5, 0.3, 0.3).map((q) => q.map(turnY(30 * D)));
    const proud = boxPolys(0.05, 0.05, 0.05).map((q) => q.map((p): Vec3 => turnY(30 * D)([p[0] + 0.3, p[1] + 0.1, p[2]])));
    const s = solid([...main, ...proud]);
    const R = capTilt(Math.PI / 6, UP);
    const a = frameBox(s.box, R, [main.flat(), proud.flat()]);
    for (const p of [...main.flat(), ...proud.flat()]) {
      const v = mulT(R, p);
      for (const k of [0, 1, 2]) {
        expect(v[k]!).toBeGreaterThanOrEqual(a.lo[k]! - 1e-12);
        expect(v[k]!).toBeLessThanOrEqual(a.hi[k]! + 1e-12);
      }
    }
  });
  it("⭐ `Scene_1`'s REAL cube (the 240 faces the page fed the map; their float32 triangles 0.6 nm inside the box): every tilt — the turned box's numbers EXACTLY", () => {
    const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };
    const vs = cube.faces.flatMap((f) => f.tris.flat());
    for (const n of [UP, [0, -1, 0] as Vec3])
      for (const hs of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 2.5 * Math.PI, -2.5 * Math.PI]) {
        const R = capTilt(hs, n);
        const a = frameBox(cube.box, R, [vs]);
        const b = tiltBox(cube.box, R);
        for (const k of [0, 1, 2]) {
          expect(Object.is(a.lo[k], b.lo[k])).toBe(true);
          expect(Object.is(a.hi[k], b.hi[k])).toBe(true);
        }
      }
  });
  it("⭐ the noise band is float noise only (well under a micrometre); no parts: the turned world box", () => {
    expect(FRAME_BOX_NOISE_M).toBeGreaterThan(0);
    expect(FRAME_BOX_NOISE_M).toBeLessThanOrEqual(1e-9);
    const s = solid(boxPolys(0.5, 0.3, 0.3));
    const R = capTilt(0.4, UP);
    expect(frameBox(s.box, R, [])).toEqual(tiltBox(s.box, R));
  });
  it("⭐ (§16, measured) a long flat box (0.8 × 0.2 × 0.3 m) turned 30° and 45°, tilted on each of its top's four layouts: the map in F has its six faces REAL in every one — ⛔ in the turned world box two of the four were ALL virtual", () => {
    for (const deg of [30, 45]) {
      const polys = boxPolys(0.8, 0.2, 0.3).map((q) => q.map(turnY(deg * D)));
      const { C, A } = atlasOf(polys);
      const s = solid(polys);
      const top = caps(C).find(({ f }) => f.n[1] > 0)!;
      let virtualBefore = 0;
      for (const e of freeEdges(C, top.ci, UP)) {
        const R = capTilt(capTiltHeading(A, C, top.f.index, top.f.n, 0, e.heading)!, top.f.n);
        const mF = buildFaceMap(tiltFaces(s.faces, R), frameBox(s.box, R, pts(polys)), CHART);
        expect(mF.facets.filter((f) => f.real).length).toBe(6);
        // the cap a side in F, real
        expect(mF.facets.some((f) => f.real && Math.abs(dot(f.n, mulT(R, UP)) - 1) < 1e-9)).toBe(true);
        const mW = buildFaceMap(tiltFaces(s.faces, R), tiltBox(s.box, R), CHART);
        if (mW.facets.every((f) => !f.real)) virtualBefore++;
      }
      expect(virtualBefore).toBe(2);
    }
  });
});

describe("⭐⭐⭐ the wiring (`render/assembly_wiring.ts`)", () => {
  const raw = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const fn = (sig: string): string => {
    const i = raw.indexOf(sig);
    expect(i, sig).toBeGreaterThanOrEqual(0);
    return raw.slice(i, raw.indexOf("\n}\n", i) + 3).replace(/\s+/g, " ");
  };
  it("⭐ ONE entry function for a free face whatever its zone (`freeEntry`): the contour's face, the side shared with the place before, C4's functions", () => {
    const f = fn("function freeEntry(");
    expect(f).toContain("const ci = contourOfFacet(map, B, at.contour, stack);");
    expect(f).toContain("const from = prev !== null && prev.map === map ? contourOfFacet(map, B, at.contour, prev.stack) : -1;");
    expect(f).toContain("const heading = freeEntryHeading(freeEdges(at.contour, ci, WORLD_UP), from, st.asmCamDrawn?.up ?? F.n, F.n);");
    expect(f).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|computeWorldMatrix|cameraPrev|modelCast|gizmoNormal/);
    expect(raw.match(/freeEntry\(st, /g)?.length).toBe(2);
    expect(fn("function freeFaceFrame(")).toContain("const en = freeEntry(st, map, B, at, t.stack, prev);");
  });
  it("⭐ `tiltOn`: the cap the gizmo's own place, a free face — the heading carried in (`freeEntry` on the world's map, the place before the one shown)", () => {
    const f = fn("function tiltOn(");
    expect(f).toContain("const en = capStack === sh.t.stack && isFreeFace(cap.n, WORLD_UP) ? freeEntry(st, wm, IDENTITY3, at, capStack, st.asmPlaceWas) : null;");
    expect(f).toContain("const hs = capTiltHeading(at.assign, at.contour, capStack, cap.n, q.yaw, en?.heading ?? null); if (hs === null) return;");
    expect(f.indexOf("freeEntry(")).toBeLessThan(f.indexOf("capTiltHeading("));
  });
  it("⭐ the place before the one shown, kept by the map's step (the same `prev` C4's entry reads), reset with the orbit's state", () => {
    const a = fn("export function assemblyFrame(");
    expect(a).toContain("const placeWas = sh0 !== null && fbWas !== null ? { map: fbWas.map, stack: sh0.t.stack } : null;");
    expect(a).toContain("st.asmPlaceWas = placeWas; freeFaceFrame(st, m.t, placeWas);");
    expect(fn("export function orbitStateStart(")).toContain("asmPlaceWas: null,");
    expect(raw.match(/st\.asmPlaceWas = /g)?.length).toBe(1);
  });
  it("⭐ `faceMapOf`: the frame's box the parts' own (`frameBox`) — ⛔ the turned world box of the switch off (`tiltBox`): step 2.5", () => {
    const f = fn("function faceMapOf(");
    expect(f).toContain("const map = buildFaceMap(tiltFaces(placedFaces(st), R), frameBox(box, R, parts.parts), { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare, ...CHART_MAP_OPTS });");
    expect(f).not.toContain("tiltBox(box, R)");
  });
  it("⭐ `IDENTITY3` is the identity — `contourOfFacet` on the world's map turns nothing", () => {
    expect(raw).toContain("const IDENTITY3: Mat3 = [\n  [1, 0, 0],\n  [0, 1, 0],\n  [0, 0, 1],\n];");
  });
});
