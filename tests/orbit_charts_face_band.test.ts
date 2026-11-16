/**
 * GOLDEN VECTORS — **THE ORBIT ON CHARTS, STEP 2.4d: ONE BAND AGAINST NOISE AT THE TRIGGERS OF A CAMERA MOVEMENT** (2026-11-16,
 * `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §10.2, §12 2.4d; the owner: *"consider adding hysteresis where needed (for example crossing of edges which
 * trigger camera movement) so that input noise does not transfer to camera movement"*) (⛔ its switch `chartLayout`: step 2.5) — the one band `gizmoEdgeMarginMm`
 * (5 mm), millimetres ON THE MODEL:
 * * THE BANDED FACET (`bandedFacet`, `input/face_band.ts`) — the square camera's target: the facet kept while the place is on it or within the band, the
 *   place's own beyond; none yet: the place's own. On a real face map: a ±3 mm wobble across an edge never changes it; a crossing changes it once, the way
 *   back once more only a band past the edge; a place circling a corner at 2 mm never leaves the first facet.
 * * IN AT THE EDGE, OUT ONE BAND PAST IT (`onTiltedFacet`'s tolerance) — the tilt's exit: 5 mm: on at 4.9, off at 5.1, the same stack on at any
 *   distance (⛔ the default tie of the switch off: deleted at step 2.5).
 * * The two agree on a real map (a box and `Scene_1`'s real cube; the world's map and the tilted frame's): 1, 3 mm past the top's edge on a side face —
 *   both "still the top"; 6 mm — both "left".
 * * The wiring (`render/assembly_wiring.ts`): read once a frame where `asmShown` is set, afresh at every change of frame; `squareFrame` reads it;
 *   `tiltFrame` hands the band.
 * RED on the mutants listed in the step's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, DEFAULT_FACET_OPTS, facetOfNormal, mapAngles, mapTarget, type FaceMap, type Facet, type FacetOpts, type MapFace, type MapOpts } from "../src/input/face_map";
import { assignCharts, capTiltHeading, chartContour } from "../src/input/orbit_charts";
import { capTilt, mulT, onTiltedFacet, tiltBox, tiltFaces } from "../src/input/orbit_tilt";
import { distanceToFacets } from "../src/input/polar_zone";
import { bandedFacet } from "../src/input/face_band";
import type { ShellBox } from "../src/input/orbit_shell";
import type { Vec3 } from "../src/core/vec";
import { boxPolys, solid } from "./helpers/chart_shapes";

const CHART: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" };
const O: MapOpts = { edgeMm: 0, edgeDeg: 0 };
/** the band: `gizmoEdgeMarginMm`'s default, 5 mm, in metres (the wiring's `edgeMarginM`) */
const BAND = 0.005;
const MM = 0.001;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("⭐⭐⭐ the banded facet (`bandedFacet`)", () => {
  it("⭐ none yet: the place's facet at once, whatever the distance handed", () => {
    expect(bandedFacet(null, 3, 0, BAND)).toBe(3);
    expect(bandedFacet(null, 3, 1, BAND)).toBe(3);
    expect(bandedFacet(null, 3, Infinity, BAND)).toBe(3);
  });
  it("⭐ on the facet it has: kept", () => {
    expect(bandedFacet(2, 2, 0, BAND)).toBe(2);
    expect(bandedFacet(2, 2, 1, BAND)).toBe(2); // its own: whatever the distance handed
  });
  it("⭐ on another facet within the band: kept (0.1 mm, 4.9 mm, the band itself); beyond it: the place's (5.1 mm, far, unknown)", () => {
    expect(bandedFacet(2, 5, 0.1 * MM, BAND)).toBe(2);
    expect(bandedFacet(2, 5, 4.9 * MM, BAND)).toBe(2);
    expect(bandedFacet(2, 5, BAND, BAND)).toBe(2);
    expect(bandedFacet(2, 5, 5.1 * MM, BAND)).toBe(5);
    expect(bandedFacet(2, 5, 1, BAND)).toBe(5);
    expect(bandedFacet(2, 5, Infinity, BAND)).toBe(5);
    expect(bandedFacet(2, 5, Number.NaN, BAND)).toBe(5);
    // a band of zero: the place's own as soon as it is off (a tie only at the border itself)
    expect(bandedFacet(2, 5, 1e-9, 0)).toBe(5);
    expect(bandedFacet(2, 5, 0, 0)).toBe(2);
  });
});

/** the cube's top and its +x and +z sides (the chart's world map of a box) */
function boxMap(): { wm: FaceMap; top: number; px: number; pz: number; xE: number; yE: number; zE: number } {
  const s = solid(boxPolys(0.483, 0.483, 0.483));
  const wm = buildFaceMap(s.faces, s.box, CHART);
  const find = (n: Vec3) => wm.facets.findIndex((f) => f.real && f.n[0] * n[0] + f.n[1] * n[1] + f.n[2] * n[2] > 0.999);
  const top = find([0, 1, 0]);
  const px = find([1, 0, 0]);
  const pz = find([0, 0, 1]);
  expect(top).toBe(wm.top);
  expect(px).toBeGreaterThanOrEqual(0);
  expect(pz).toBeGreaterThanOrEqual(0);
  return { wm, top, px, pz, xE: wm.facets[px]!.e, yE: wm.facets[top]!.e, zE: wm.facets[pz]!.e };
}

/** the reading run over places: each `[place, the facet it is on]` — the readings, frame by frame */
function run(wm: FaceMap, path: readonly (readonly [Vec3, number])[], band = BAND): number[] {
  let cur: number | null = null;
  return path.map(([p, here]) => {
    const d = cur === null || cur === here ? 0 : distanceToFacets(wm, [cur], p);
    cur = bandedFacet(cur, here, d, band);
    return cur;
  });
}
const changes = (r: readonly number[]) => r.reduce((c, x, i) => c + (i > 0 && x !== r[i - 1] ? 1 : 0), 0);

describe("⭐⭐⭐ the banded facet on a real face map (a box, the charts' layout): the places' distances by `distanceToFacets`", () => {
  const { wm, top, px, pz, xE, yE, zE } = boxMap();
  /** `s` mm across the top / +x edge: ≥ 0 on the top, `s` in from the edge; < 0 on the side, `−s` below it (z 0.07: away from the corners) */
  const across = (s: number): readonly [Vec3, number] => (s >= 0 ? [[xE - s * MM, yE, 0.07], top] : [[xE, yE + s * MM, 0.07], px]);
  it("⭐ the fixture: the place's distance to the top is how far below the edge it is", () => {
    for (const d of [0.5, 1, 3, 6, 20]) expect(distanceToFacets(wm, [top], across(-d)[0])).toBeCloseTo(d * MM, 12);
    expect(distanceToFacets(wm, [px], across(4)[0])).toBeCloseTo(4 * MM, 12);
  });
  it("⭐ a wobble across the edge (±3 mm, a sine of 24 frames, 100 frames) never changes the reading — from either side", () => {
    const fromTop = Array.from({ length: 100 }, (_, k) => across(3 * Math.sin((2 * Math.PI * k) / 24)));
    const r1 = run(wm, fromTop);
    expect(r1[0]).toBe(top);
    expect(changes(r1)).toBe(0);
    expect(fromTop.filter(([, h]) => h === px).length).toBeGreaterThan(30); // the place itself crossed, again and again
    const fromSide = Array.from({ length: 100 }, (_, k) => across(-0.5 - 3 * Math.cos((2 * Math.PI * k) / 24)));
    const r2 = run(wm, fromSide);
    expect(r2[0]).toBe(px);
    expect(changes(r2)).toBe(0);
    // ⛔ the band off (the tie): the reading follows the place — the flips the band removes
    expect(changes(run(wm, fromTop, 0))).toBeGreaterThan(5);
  });
  it("⭐ a crossing 6 mm deep changes it exactly once (5 mm past the edge), and the way back once more only 5 mm past the edge on the other side", () => {
    const down = Array.from({ length: 161 }, (_, k) => (100 - k) / 10); // +10 → −6 mm
    const up = Array.from({ length: 161 }, (_, k) => (k - 60) / 10); // −6 → +10 mm
    const s = [...down, ...up];
    const r = run(wm, s.map(across));
    expect(changes(r)).toBe(2);
    const i1 = r.findIndex((x, i) => i > 0 && x !== r[i - 1]);
    expect(r[i1]).toBe(px);
    expect(s[i1]!).toBeLessThanOrEqual(-5);
    expect(s[i1]!).toBeGreaterThanOrEqual(-5.1 - 1e-9);
    expect(r[s.indexOf(-4.9)]).toBe(top); // still the top 4.9 mm down the side
    const i2 = r.findIndex((x, i) => i > i1 && x !== r[i - 1]);
    expect(r[i2]).toBe(top);
    expect(s[i2]!).toBeGreaterThanOrEqual(5);
    expect(s[i2]!).toBeLessThanOrEqual(5.1 + 1e-9);
    expect(r[down.length + s.slice(down.length).indexOf(4.9)]).toBe(px); // still the side 4.9 mm onto the top
  });
  it("⭐ three facets round a corner (the top, +x, +z): a place circling it at 2 mm, three turns — the reading never leaves the first facet; at 6 mm it does", () => {
    const C: Vec3 = [xE, yE, zE];
    const ex: Vec3 = [-1, 0, 0];
    const ey: Vec3 = [0, -1, 0];
    const ez: Vec3 = [0, 0, -1];
    // the wedges round the vertex, in turn: the top (from the +x edge to the +z edge), +z (to the vertical edge), +x (back to the top's)
    const wedges: readonly [number, Vec3, Vec3][] = [
      [top, ez, ex],
      [pz, ex, ey],
      [px, ey, ez],
    ];
    const circle = (r: number) =>
      Array.from({ length: 271 }, (_, k): readonly [Vec3, number] => {
        const th = 45 + k * 3; // from the middle of the top's wedge
        const w = wedges[Math.floor((th % 270) / 90)]!;
        const ph = (((th % 270) % 90) * Math.PI) / 180;
        const [f, e1, e2] = w;
        return [[C[0] + r * (Math.cos(ph) * e1[0] + Math.sin(ph) * e2[0]), C[1] + r * (Math.cos(ph) * e1[1] + Math.sin(ph) * e2[1]), C[2] + r * (Math.cos(ph) * e1[2] + Math.sin(ph) * e2[2])], f];
      });
    const near = circle(2 * MM);
    // the fixture: each place on its facet (its distance to it 0), and every facet visited
    for (const [p, f] of near) expect(distanceToFacets(wm, [f], p)).toBeLessThan(1e-12);
    expect(new Set(near.map(([, f]) => f)).size).toBe(3);
    const r = run(wm, near);
    expect(new Set(r)).toEqual(new Set([top]));
    // a control: 6 mm out from the corner the place is more than a band from the top on the sides — the reading leaves it
    expect(changes(run(wm, circle(6 * MM)))).toBeGreaterThan(0);
  });
});

describe("⭐⭐⭐ in at the edge, out one band past it (`onTiltedFacet`'s tolerance)", () => {
  // ⛔ (2026-11-16, step 2.5) the default — the tie of the switch off (`TILT_TIE_M`) — deleted: the band is always handed
  it("⭐ a 5 mm band: 4.9 mm on, the band itself on, 5.1 mm off; its own stack on at any distance", () => {
    expect(onTiltedFacet(6, 7, 4.9 * MM, BAND)).toBe(true);
    expect(onTiltedFacet(6, 7, BAND, BAND)).toBe(true);
    expect(onTiltedFacet(6, 7, 5.1 * MM, BAND)).toBe(false);
    expect(onTiltedFacet(6, 7, Infinity, BAND)).toBe(false);
    expect(onTiltedFacet(7, 7, Infinity, BAND)).toBe(true);
    expect(onTiltedFacet(7, 7, 0.3, BAND)).toBe(true);
  });
});

describe("⭐⭐⭐ the banded facet and the tilt's exit AGREE on a real map — one band, one distance, the same facet", () => {
  const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };
  const SHAPES: readonly [string, { faces: MapFace[]; box: ShellBox }][] = [
    ["a box", solid(boxPolys(0.483, 0.483, 0.483))],
    ["Scene_1's real cube", { faces: cube.faces, box: cube.box }],
  ];
  const on = (f: Facet, L: number, s: number): Vec3 => [f.n[0] * f.e + f.t[0] * L + f.b[0] * s, f.n[1] * f.e + f.t[1] * L + f.b[1] * s, f.n[2] * f.e + f.t[2] * L + f.b[2] * s];
  const EXPECT: readonly [number, boolean][] = [
    [1, true],
    [3, true],
    [6, false],
  ];
  for (const [name, s] of SHAPES) {
    const wm = buildFaceMap(s.faces, s.box, CHART);
    const top = wm.facets[wm.top]!;
    const sides = wm.facets.map((f, i) => [f, i] as const).filter(([f]) => f.real && f.kind === "SIDE" && Math.abs(f.n[1]) < 1e-6);
    it(`⭐ ${name}: in the world's map — 1, 3, 6 mm past the top's edge down each vertical side face`, () => {
      expect(sides.length).toBeGreaterThanOrEqual(4);
      let n = 0;
      for (const [f, i] of sides) {
        // the side's top edge is the top's border (a cube): `bHi` up the side
        if (Math.abs(f.bHi - top.e) > 1e-9) continue;
        for (const [mm, still] of EXPECT) {
          const p = on(f, (f.tLo + f.tHi) / 2, f.bHi - mm * MM);
          const mq = mapAngles(wm, p, i, O);
          const here = mapTarget(wm, mq.yaw, mq.pitch, O);
          expect(here.stack).toBe(i); // the map's own place reading: on the side
          expect(dist(here.surface, p)).toBeLessThan(1e-9);
          const d = distanceToFacets(wm, [wm.top], p);
          expect(d).toBeCloseTo(mm * MM, 9);
          expect(bandedFacet(wm.top, here.stack, d, BAND) === wm.top, `${i} ${mm}`).toBe(still);
          expect(onTiltedFacet(here.stack, wm.top, d, BAND), `${i} ${mm}`).toBe(still);
          n++;
        }
      }
      expect(n).toBeGreaterThanOrEqual(12);
    });
    it(`⭐ ${name}: in the tilted frame (the top a side in F, the tilt's own map) — the same three places, the same answers`, () => {
      const C = chartContour(wm);
      const A = assignCharts(C);
      let n = 0;
      for (const yaw of [0.3, 1.9, -2.2]) {
        const h = capTiltHeading(A, C, wm.top, top.n, yaw);
        expect(h).not.toBeNull();
        const R1 = capTilt(h!, top.n);
        const mF = buildFaceMap(tiltFaces(s.faces, R1), tiltBox(s.box, R1), CHART);
        for (const [f] of sides) {
          if (Math.abs(f.bHi - top.e) > 1e-9) continue;
          for (const [mm, still] of EXPECT) {
            const p = on(f, (f.tLo + f.tHi) / 2, f.bHi - mm * MM);
            const pF = mulT(R1, p);
            const tf = facetOfNormal(mF, mulT(R1, top.n), mulT(R1, on(top, (top.tLo + top.tHi) / 2, (top.bLo + top.bHi) / 2)));
            const nb = facetOfNormal(mF, mulT(R1, f.n), pF);
            expect(tf).not.toBe(nb);
            expect(mF.facets[tf]!.kind).toBe("SIDE"); // the tilted facet is a side in F: the square camera's target, never a cap
            const mq = mapAngles(mF, pF, nb, O);
            const here = mapTarget(mF, mq.yaw, mq.pitch, O);
            expect(dist(here.surface, pF)).toBeLessThan(1e-9);
            const d = distanceToFacets(mF, [tf], here.surface);
            expect(d).toBeCloseTo(mm * MM, 9);
            const banded = bandedFacet(tf, here.stack, d, BAND);
            expect(banded === tf, `${yaw} ${mm}`).toBe(still);
            expect(onTiltedFacet(here.stack, tf, d, BAND), `${yaw} ${mm}`).toBe(still);
            // ⭐ while the tilt holds, the square camera's target is the tilted facet's normal (the banded facet's)
            if (still) expect(mF.facets[banded]!.n).toBe(mF.facets[tf]!.n);
            n++;
          }
        }
      }
      expect(n).toBeGreaterThanOrEqual(3 * 2 * EXPECT.length);
    });
  }
});

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
function fnSource(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return s.slice(i, s.indexOf(close, i) + close.length).replace(/\s+/g, " ");
}
const before = (src: string, a: string, b: string) => {
  expect(src.indexOf(a), a).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(b), b).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(a), `${a} before ${b}`).toBeLessThan(src.indexOf(b));
};
/** the comments out (a pin reads the code, not its prose) */
const codeOnly = (s: string) => s.replace(/\/\/[^\n]*/g, "");
/** one function's CODE (its comments out, then its whitespace collapsed) */
function fnCode(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return codeOnly(s.slice(i, s.indexOf(close, i) + close.length)).replace(/\s+/g, " ");
}

describe("⭐⭐⭐ the wiring (`render/assembly_wiring.ts`): one band", () => {
  const W = "render/assembly_wiring.ts";
  it("⭐ the reading: the map it indexes (another map's: none), the distance only off its facet, the band `edgeMarginM` — in the model's coordinates", () => {
    const r = fnSource(W, "function faceBandRead(");
    expect(r).toContain("const map = faceMapOf(st);");
    expect(r).toContain("const cur = b !== null && b.map === map ? b.facet : null;");
    expect(r).toContain("const d = cur === null || cur === t.stack ? 0 : distanceToFacets(map, [cur], t.surface);");
    expect(r).toContain("st.asmFaceBand = { map, facet: bandedFacet(cur, t.stack, d, edgeMarginM(st)) };");
    // ⛔ the sway: nothing drawn, picked or seen by the camera
    expect(r).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|computeWorldMatrix|st\.camera\.|cameraPrev|asmCamLast|modelCast|asmG\b/);
  });
  it("⭐ read once a frame in `assemblyFrame`, right where the place is set and before the tilt's frame reads it", () => {
    const A = fnCode(W, "export function assemblyFrame(");
    expect(A).toContain("st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch }; faceBandRead(st, m.t); tiltFrame(st, m.t.stack, m.t.surface);");
    expect(A.match(/faceBandRead\(/g)?.length).toBe(1);
    // the square camera reads it after (`calmFrame` → `squareFrame`)
    before(A, "faceBandRead(st, m.t);", "calmFrame(st, dtMs);");
  });
  it("⭐ taken afresh at every change of frame: `tiltOn`, `tiltOff`, `poleCross`, `zoneSwitch` clear it with the place; `tiltOff` and `poleCross` read it again at the place they re-read", () => {
    for (const sig of ["function tiltOn(", "function tiltOff(", "function zoneSwitch("]) {
      const f = fnCode(W, sig);
      expect(f, sig).toContain("st.asmShown = null; st.asmFaceBand = null;");
    }
    // ⭐⭐⭐ (2026-11-16, step C5) the tilt's exit and the ridge's crossing re-read the place through the one event (`crossTurn`): cleared, then read there
    const ct = codeOnly(raw(W)).replace(/\s+/g, " ");
    const i0 = ct.indexOf("function crossTurn(");
    const c = ct.slice(i0, ct.indexOf("function ", i0 + 10));
    expect(c).toContain("st.asmShown = null; st.asmFaceBand = null;");
    expect(c).toContain("st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch }; faceBandRead(st, m.t);");
    before(c, "st.asmFaceBand = null;", "faceBandRead(st, m.t);");
    const off = fnCode(W, "function tiltOff(");
    expect(off).toContain("crossTurn(st, { at: { mq: poleYawKept(mq0, ORBIT_PITCH_MAX_RAD, hP), g }, uWas, carry: false, paced, hold: held });");
    expect(off).toContain("st.asmShown = { t: m.t, yaw: mq0.yaw, pitch: mq0.pitch }; faceBandRead(st, m.t);"); // no place to keep
    before(off, "st.asmFaceBand = null;", "faceBandRead(st, m.t);");
    expect(fnCode(W, "function poleCross(")).toContain("crossTurn(st, { at: { mq: { yaw: seam.yaw, pitch: seam.pitch }, g: P }, uWas, carry: false, paced: false, hold });");
    // nowhere else is it written but the reading and the clears (and the starting state)
    expect(codeOnly(raw(W)).match(/st\.asmFaceBand = /g)?.length).toBe(6); // the reading's two, the four clears
    expect(raw(W).match(/faceBandRead\(st, /g)?.length).toBe(3);
  });
  it("⭐ `squareFrame`: the BANDED facet's normal and kind (the cap test on it) — ⛔ not the place's own (the switch off's: step 2.5)", () => {
    const f = fnCode(W, "function squareFrame(");
    const on = f.slice(0, f.indexOf("if (sq.n === null) sq.n = sq.target;"));
    expect(on).toContain("const fb = sh === null ? null : st.asmFaceBand;");
    expect(on).toContain("const bf = fb === null ? undefined : fb.map.facets[fb.facet];");
    expect(on).toContain('const onCapB = fb !== null && bf !== undefined && bf.kind !== "SIDE" && (tl === null || fb.facet !== tl.facet);');
    expect(on).toContain("sq.target = bf === undefined || onCapB ? sq.target : bf.n;");
    expect(on).not.toContain("sh.t.normal");
    expect(on).not.toContain("sh.t.stack");
    expect(on).not.toContain("sh.t.band");
  });
  it("⭐ `tiltFrame`: the band handed (`edgeMarginM`) — one distance to the tilted facet (⛔ the tie of the switch off: step 2.5)", () => {
    const t = fnCode(W, "function tiltFrame(");
    expect(t).toContain("const borderM = stack === tl.facet ? 0 : fmB === null ? Infinity : distanceToFacets(fmB, [tl.facet], surface);");
    expect(t).toContain("const onFacet = onTiltedFacet(stack, tl.facet, borderM, edgeMarginM(st));");
    expect(t.match(/onTiltedFacet\(/g)?.length).toBe(1);
  });
});
