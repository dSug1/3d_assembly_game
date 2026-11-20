/**
 * GOLDEN VECTORS — **A SPIT ZONE'S LEVEL FACES ON THE CARRIED HEADING, STEP C4** (2026-11-16, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §3.4,
 * §4.1, §7; the owner's D-T2: *"a spit's level faces follow the same rule — no turn in the middle of the bottom face, the half turn at its far edge, the
 * picture unchanged when coming in from a tip"*) (⛔ the switch `chartLayout` deleted at step 2.5, 2026-11-16 — the default half of the pins kept):
 * * `contourFaceAt` — a map's facet found on the atlas's contour by its normal and a point: every face of `Scene_0bis` from its own; a point off its plane,
 *   a normal 2° off: none; two faces sharing a normal told apart by the plane; every real facet of the ZONE's map (built in F) found back on the contour.
 * * `freeHeadingAngle` — `offsetFrame`'s up IS the carried heading laid square to the view, exactly, within 30° of the vertical from below and above.
 * * THE RULE on `Scene_0bis`'s bottom face (the zone's own frame, `chartZones`): entered from a tip's triangle the heading along the axis, the finger's dy
 *   along it, its dx round it; from a long side the axis across the glass, dx along it, dy round it — both the finger's way (as the camera upright in F);
 *   the exits 0, π/2, π and the hold from 120° only at the far edge; the entry with no edge (`freeEntryHeading`).
 * * IN AT THE EDGE, OUT ONE BAND PAST IT — the place 1, 3, 6 mm past each side of the bottom face (in the zone's map): on, on, off.
 * * The wiring (`render/assembly_wiring.ts`): source pins.
 * RED on the mutants listed in the step's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, DEFAULT_FACET_OPTS, mapAngles, mapTarget, type FacetOpts, type MapOpts } from "../src/input/face_map";
import { assignCharts, chartContour, chartZones, type ChartFace } from "../src/input/orbit_charts";
import { contourFaceAt, entryHeading, exitTurnRad, FREE_CONTOUR_DEG, FREE_EXIT_HOLD_FROM_RAD, freeEdges, freeEntryHeading, freeFaces, freeHeadingAngle, turnHolds } from "../src/input/free_face";
import { fingerInFrame, distanceToFacets } from "../src/input/polar_zone";
import { mulM, mulT, onTiltedFacet, tiltBox, tiltFaces, type Mat3 } from "../src/input/orbit_tilt";
import { offsetFrame } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";
import { solid } from "./helpers/chart_shapes";
import { FREE_FACE_SHAPES } from "./helpers/free_face_shapes";

const D = Math.PI / 180;
const H = Math.PI / 2;
const Y: Vec3 = [0, 1, 0];
const CHART: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" };
const O: MapOpts = { edgeMm: 0, edgeDeg: 0 };
const MM = 0.001;
/** the band: `gizmoEdgeMarginMm`'s default, 5 mm, in metres (the wiring's `edgeMarginM`) */
const BAND = 0.005;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => mul(a, 1 / len(a));
const rotAbout = (v: Vec3, k: Vec3, th: number): Vec3 => add(add(mul(v, Math.cos(th)), mul(cross(k, v), Math.sin(th))), mul(k, dot(k, v) * (1 - Math.cos(th))));

/** `Scene_0bis` as the game builds it: the world map, its contour and atlas, the spit zone's frame F and the zone's map built in F (`faceMapOf`) */
function scene0bis() {
  const s = solid(FREE_FACE_SHAPES.find((x) => x.key === "scene0bis")!.polys());
  const wm = buildFaceMap(s.faces, s.box, CHART);
  const C = chartContour(wm);
  const zones = chartZones(assignCharts(C), C);
  expect(zones.length).toBe(1);
  expect(zones[0]!.orientation).toBe("SPIT");
  const R: Mat3 = zones[0]!.frame;
  const zm = buildFaceMap(tiltFaces(s.faces, R), tiltBox(s.box, R), CHART);
  const free = freeFaces(C, Y);
  expect(free.length).toBe(1);
  const ci = free[0]!;
  return { C, R, axis: zones[0]!.axis, zm, ci, bottom: C[ci]! };
}

describe("⭐⭐⭐ `contourFaceAt` — a map's facet on the contour, by its normal and a point (the MODEL's coordinates)", () => {
  const { C, R, zm } = scene0bis();
  it("every face of `Scene_0bis`'s contour from its own normal and centroid", () => {
    expect(C.length).toBeGreaterThan(10);
    C.forEach((f, i) => expect(contourFaceAt(C, f.n, f.c), `${i}`).toBe(i));
  });
  it("a point 2 mm off its plane: none; its normal 2° off: none (the tolerance under the cap's 1°: 0.5°)", () => {
    expect(FREE_CONTOUR_DEG).toBeLessThan(1);
    C.forEach((f) => {
      expect(contourFaceAt(C, f.n, add(f.c, mul(f.n, 2 * MM)))).toBe(-1);
      const ax = unit(cross(f.n, Math.abs(f.n[1]) < 0.9 ? Y : [1, 0, 0]));
      expect(contourFaceAt(C, rotAbout(f.n, ax, 2 * D), f.c)).toBe(-1);
      // within the tolerance it is still the face
      expect(contourFaceAt(C, rotAbout(f.n, ax, 0.2 * D), f.c)).toBe(C.indexOf(f));
    });
  });
  it("two faces sharing a normal at different heights (a step's two treads): told apart by the plane", () => {
    const face = (index: number, y: number, x0: number): ChartFace => ({ index, n: Y, pts: [[x0, y, 0], [x0 + 1, y, 0], [x0 + 1, y, 1], [x0, y, 1]], area: 1, c: [x0 + 0.5, y, 0.5] });
    const F = [face(0, 0, 0), face(1, 0.3, 1)];
    expect(contourFaceAt(F, Y, [0.5, 0, 0.5])).toBe(0);
    expect(contourFaceAt(F, Y, [1.5, 0.3, 0.5])).toBe(1);
    // a point on the lower tread's plane but over the upper one's polygon: still the lower (its plane holds it)
    expect(contourFaceAt(F, Y, [1.5, 0, 0.5])).toBe(0);
    expect(contourFaceAt(F, Y, [1.5, 0.15, 0.5])).toBe(-1);
    // two coplanar treads sharing the normal: the one whose polygon is nearer
    const G = [face(0, 0, 0), face(1, 0, 2)];
    expect(contourFaceAt(G, Y, [2.6, 0, 0.5])).toBe(1);
    expect(contourFaceAt(G, Y, [0.2, 0, 0.5])).toBe(0);
  });
  it("⭐ every real facet of the ZONE's map (built in F) found back on the contour — its normal and polygon's centroid turned into the world, as the wiring does", () => {
    let n = 0;
    zm.facets.forEach((f) => {
      if (!f.real || f.poly.length < 3) return;
      const c = mul(f.poly.reduce<Vec3>((t, p) => add(t, p), [0, 0, 0]), 1 / f.poly.length);
      const i = contourFaceAt(C, mulM(R, f.n), mulM(R, c));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(dot(C[i]!.n, mulM(R, f.n))).toBeGreaterThan(1 - 1e-9);
      n++;
    });
    expect(n).toBe(C.length);
  });
});

describe("⭐⭐⭐ `freeHeadingAngle` — `offsetFrame`'s up IS the carried heading laid square to the view", () => {
  const headings: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], unit([0.6, 0, -0.8])];
  it("from below and from above, straight and within 30° of the vertical, every azimuth: within 1e-9", () => {
    let n = 0;
    for (const below of [true, false])
      for (const off of [0, 5, 17, 30])
        for (const az of [0, 40, 135, 200, 290])
          for (const T of headings) {
            const e = (below ? -1 : 1) * (90 - off) * D;
            const u: Vec3 = [Math.cos(e) * Math.cos(az * D), Math.sin(e), Math.cos(e) * Math.sin(az * D)];
            const f = offsetFrame(u, freeHeadingAngle(T, u), 0, 0);
            const W = unit(sub(T, mul(u, dot(T, u))));
            expect(len(sub(f.up, W)), `${below} ${off} ${az} ${T}`).toBeLessThan(1e-9);
            expect(len(sub(f.dir, u))).toBeLessThan(1e-12);
            n++;
          }
    expect(n).toBe(2 * 4 * 5 * 5);
  });
  it("straight below its up is +[cos h, 0, sin h], straight above the opposite (`offsetFrame`'s convention)", () => {
    for (const T of headings) {
      const hB = freeHeadingAngle(T, [0, -1, 0]);
      expect(len(sub([Math.cos(hB), 0, Math.sin(hB)], T))).toBeLessThan(1e-12);
      const hA = freeHeadingAngle(T, [0, 1, 0]);
      expect(len(sub([-Math.cos(hA), 0, -Math.sin(hA)], T))).toBeLessThan(1e-12);
    }
  });
});

/** the orbit's angles in F at the world direction `u` (centre → camera), and F's up there in the world — `zoneFinger`'s `fUp` */
function orbitIn(R: Mat3, u: Vec3): { th: number; yw: number; fUp: Vec3 } {
  const uF = mulT(R, u);
  const th = Math.asin(Math.max(-1, Math.min(1, uF[1])));
  const yw = Math.atan2(uF[2], uF[0]);
  return { th, yw, fUp: mulM(R, [-Math.sin(th) * Math.cos(yw), Math.cos(th), -Math.sin(th) * Math.sin(yw)]) };
}
/** where a finger move (`dx` right, `dy` up) takes the camera's direction, on the glass: the mapped move applied as the wiring does (`zoneFinger`'s `dx`
 *  into `orbit.drag(−fdx …)`, whose yaw −= its first: the yaw + dx; its `fdy` (up positive) the pitch + dy),
 *  the direction's step in the world, and that step read on the glass (`[right, up]`, Babylon's right `up × view`) */
function moveOnGlass(R: Mat3, u: Vec3, cam: { dir: Vec3; up: Vec3 }, dx: number, dy: number, alpha0 = 0): { world: Vec3; glass: [number, number] } {
  const o = orbitIn(R, u);
  const r = fingerInFrame(dx, dy, mul(cam.dir, -1), cam.up, o.fUp, alpha0);
  // the direction's derivatives in F (`orbitDir`'s: x = cos θ cos ψ, y = sin θ, z = cos θ sin ψ), exact
  const dTh: Vec3 = [-Math.sin(o.th) * Math.cos(o.yw), Math.cos(o.th), -Math.sin(o.th) * Math.sin(o.yw)];
  const dYw: Vec3 = [-Math.cos(o.th) * Math.sin(o.yw), 0, Math.cos(o.th) * Math.cos(o.yw)];
  const w = mulM(R, add(mul(dTh, r.dy), mul(dYw, r.dx)));
  const V = mul(cam.dir, -1);
  const right = cross(cam.up, V);
  return { world: w, glass: [dot(w, right), dot(w, cam.up)] };
}
/** the angle (rad) between a move on the glass and the finger's */
const glassAngle = (g: [number, number], dx: number, dy: number): number => Math.acos(Math.max(-1, Math.min(1, (g[0] * dx + g[1] * dy) / (Math.hypot(g[0], g[1]) * Math.hypot(dx, dy)))));

describe("⭐⭐⭐ THE RULE on `Scene_0bis`'s bottom face — the heading carried in, the finger in F's upright screen (`fingerInFrame` alone)", () => {
  const { C, R, axis, ci, bottom } = scene0bis();
  const E = freeEdges(C, ci, Y);
  const tips = E.map((e) => e.to).filter((g) => C[g]!.pts.length === 3);
  const longs = E.map((e) => e.to).filter((g) => C[g]!.pts.length === 4);
  const ax = unit(axis);
  /** the reference "finger's way": a camera UPRIGHT IN F (its up F's up on the glass — `fingerInFrame` the identity) on a side of the body */
  const refSigns = (): [number, number] => {
    const u = unit(mulM(R, [0, 0.2, 1])); // a side, a little above the middle, in F
    const o = orbitIn(R, u);
    const up = unit(sub(o.fUp, mul(u, dot(o.fUp, u))));
    const cam = { dir: u, up };
    const a = moveOnGlass(R, u, cam, 1, 0);
    const b = moveOnGlass(R, u, cam, 0, 1);
    expect(Math.abs(a.glass[1])).toBeLessThan(1e-3 * Math.abs(a.glass[0]));
    expect(Math.abs(b.glass[0])).toBeLessThan(1e-3 * Math.abs(b.glass[1]));
    return [Math.sign(a.glass[0]), Math.sign(b.glass[1])];
  };
  const [sx, sy] = refSigns();
  const views: Vec3[] = [[0, -1, 0], unit([0.2, -1, 0.1]), unit([-0.3, -1, -0.2]), unit([0.1, -1, -0.45])];
  it("the face: two tips' triangles, two long sides; the axis level (x)", () => {
    expect(tips.length).toBe(2);
    expect(longs.length).toBe(2);
    expect(Math.abs(ax[0])).toBeCloseTo(1, 9);
    expect(bottom.n[1]).toBeLessThan(-0.999);
  });
  it("⭐ entered from a tip's triangle: the heading along the axis — its dy moves the place ALONG the axis, its dx ROUND it, both the finger's way", () => {
    for (const g of tips) {
      // the up shown points across (a long side's layout): the entry over the tip's side must win (⛔ the nearest to the picture shown)
      const shown = entryHeading(E, longs[0]!)!;
      const h = freeEntryHeading(E, g, shown, bottom.n)!;
      expect(Math.abs(dot(h, ax))).toBeCloseTo(1, 12);
      expect(h).toEqual(entryHeading(E, g));
      for (const u of views) {
        const cam = offsetFrame(u, freeHeadingAngle(h, u), 0, 0);
        const r = fingerInFrame(1, 0, mul(cam.dir, -1), cam.up, orbitIn(R, u).fUp, 0);
        // the axis exactly up (or down) the glass: F's up at 0 or π
        expect(Math.abs(Math.sin(r.alpha))).toBeLessThan(1e-9);
        const dy = moveOnGlass(R, u, cam, 0, 1);
        const dx = moveOnGlass(R, u, cam, 1, 0);
        // along the axis: the move in the plane of the axis and the view (its meridian — square to `axis × u`), toward a pole; round it: square to it
        expect(Math.abs(dot(unit(dy.world), unit(cross(ax, u))))).toBeLessThan(1e-9);
        expect(Math.abs(dot(unit(dy.world), ax))).toBeGreaterThan(0.9);
        expect(Math.abs(dot(unit(dx.world), ax))).toBeLessThan(1e-9);
        expect(Math.abs(dy.glass[0])).toBeLessThan(1e-9 * Math.abs(dy.glass[1]));
        expect(Math.abs(dx.glass[1])).toBeLessThan(1e-9 * Math.abs(dx.glass[0]));
        expect(Math.sign(dy.glass[1])).toBe(sy);
        expect(Math.sign(dx.glass[0])).toBe(sx);
      }
    }
  });
  it("⭐ entered from a long side: the axis ACROSS the glass — its dx moves the place along the axis, its dy round it, both the finger's way", () => {
    // ⭐ exact on the views a long side's entry passes through (round the axis: the view in the plane square to it) …
    const round: Vec3[] = [[0, -1, 0], unit([0, -1, 0.3]), unit([0, -1, -0.5])];
    for (const g of longs) {
      const shown = entryHeading(E, tips[0]!)!;
      const h = freeEntryHeading(E, g, shown, bottom.n)!;
      expect(Math.abs(dot(h, ax))).toBeLessThan(1e-12);
      expect(h).toEqual(entryHeading(E, g));
      for (const u of round) {
        const cam = offsetFrame(u, freeHeadingAngle(h, u), 0, 0);
        const r = fingerInFrame(1, 0, mul(cam.dir, -1), cam.up, orbitIn(R, u).fUp, 0);
        expect(Math.abs(Math.cos(r.alpha))).toBeLessThan(1e-9);
        const dy = moveOnGlass(R, u, cam, 0, 1);
        const dx = moveOnGlass(R, u, cam, 1, 0);
        expect(Math.abs(dot(unit(dx.world), unit(cross(ax, u))))).toBeLessThan(1e-9);
        expect(Math.abs(dot(unit(dx.world), ax))).toBeGreaterThan(0.9);
        expect(Math.abs(dot(unit(dy.world), ax))).toBeLessThan(1e-9);
        expect(Math.abs(dy.glass[0])).toBeLessThan(1e-9 * Math.abs(dy.glass[1]));
        expect(Math.abs(dx.glass[1])).toBeLessThan(1e-9 * Math.abs(dx.glass[0]));
        expect(Math.sign(dy.glass[1])).toBe(sy);
        expect(Math.sign(dx.glass[0])).toBe(sx);
      }
      // … and off it (a view leaning along the axis too) the axis is across the glass as far as the view allows — the heading and the axis laid square to
      // the view part by `u_x·u_z` exactly — and the finger keeps its way within that angle (and the cos θ of the orbit's yaw)
      for (const u of views) {
        const cam = offsetFrame(u, freeHeadingAngle(h, u), 0, 0);
        const r = fingerInFrame(1, 0, mul(cam.dir, -1), cam.up, orbitIn(R, u).fUp, 0);
        const aP = unit(sub(ax, mul(u, dot(ax, u))));
        const hP = unit(sub(h, mul(u, dot(h, u))));
        expect(Math.abs(Math.cos(r.alpha))).toBeCloseTo(Math.abs(dot(aP, hP)), 9);
        const lean = Math.asin(Math.abs(dot(aP, hP)));
        expect(lean).toBeLessThan(5 * D);
        for (const [fx, fy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
          const m = moveOnGlass(R, u, cam, fx, fy);
          expect(glassAngle(m.glass, sx * fx, sy * fy), `${u} ${fx} ${fy}`).toBeLessThan(lean + 2 * D);
        }
      }
    }
  });
  it("⭐ the exits: 0 back over the entry side, π/2 at a side, π at the far side — the dy hold from any turn over a quarter (D-T4): at the far side only on this rectangle", () => {
    expect(FREE_EXIT_HOLD_FROM_RAD).toBeCloseTo(90 * D, 15);
    for (const g of [...tips, ...longs]) {
      const h = entryHeading(E, g)!;
      const turns = E.map((e) => exitTurnRad(h, E, e.to)!);
      const far = (tips.includes(g) ? tips : longs).find((x) => x !== g)!;
      for (const e of E) {
        const t = exitTurnRad(h, E, e.to)!;
        const want = e.to === g ? 0 : e.to === far ? Math.PI : H;
        expect(t).toBeCloseTo(want, 12);
        expect(turnHolds(t, FREE_EXIT_HOLD_FROM_RAD), `${g} → ${e.to}`).toBe(e.to === far);
      }
      expect(turns.length).toBe(4);
      // not a neighbour (another face, or none): no turn known
      expect(exitTurnRad(h, E, ci)).toBeNull();
      expect(exitTurnRad(h, E, -1)).toBeNull();
    }
  });
  it("⭐ an entry with no edge (no previous place, not a neighbour, the face itself): the layout nearest the up shown", () => {
    for (const e of E) {
      const shown = add(rotAbout(e.heading!, Y, 25 * D), [0, -0.7, 0]);
      expect(freeEntryHeading(E, -1, shown, bottom.n)).toEqual(e.heading);
      expect(freeEntryHeading(E, ci, shown, bottom.n)).toEqual(e.heading);
    }
    expect(freeEntryHeading([{ a: [0, 0, 0], b: [1, 0, 0], to: -1, heading: null }], -1, [1, 0, 0], Y)).toBeNull();
  });
});

describe("⭐⭐⭐ in at the edge, out one band past it — the place 1, 3, 6 mm past each side of the bottom face, in the zone's map (F)", () => {
  const { C, R, zm, ci } = scene0bis();
  const fb = zm.facets.findIndex((f) => f.real && f.poly.length >= 3 && contourFaceAt(C, mulM(R, f.n), mulM(R, mul(f.poly.reduce<Vec3>((t, p) => add(t, p), [0, 0, 0]), 1 / f.poly.length))) === ci);
  it("each side: on, on, off — the place's own facet the neighbour, its distance the bottom's", () => {
    expect(fb).toBeGreaterThanOrEqual(0);
    const B = zm.facets[fb]!;
    const P = B.poly.filter((p, k) => len(sub(p, B.poly[(k + 1) % B.poly.length]!)) > 1e-7);
    expect(P.length).toBe(4);
    let n = 0;
    for (let k = 0; k < P.length; k++) {
      const a = P[k]!;
      const b = P[(k + 1) % P.length]!;
      const m = mul(add(a, b), 0.5);
      // the neighbour across that side
      const nb = zm.facets.findIndex((f, j) => j !== fb && f.real && f.poly.some((p) => len(sub(p, a)) < 5e-4) && f.poly.some((p) => len(sub(p, b)) < 5e-4));
      expect(nb).toBeGreaterThanOrEqual(0);
      const G = zm.facets[nb]!;
      const gc = mul(G.poly.reduce<Vec3>((t, p) => add(t, p), [0, 0, 0]), 1 / G.poly.length);
      let w = unit(cross(G.n, unit(sub(b, a))));
      if (dot(w, sub(gc, m)) < 0) w = mul(w, -1);
      for (const [mm, on] of [[1, true], [3, true], [6, false]] as const) {
        const p = add(m, mul(w, mm * MM));
        const mq = mapAngles(zm, p, nb, O);
        const here = mapTarget(zm, mq.yaw, mq.pitch, O);
        expect(here.stack, `${k} ${mm}`).toBe(nb);
        const d = distanceToFacets(zm, [fb], here.surface);
        expect(d).toBeCloseTo(mm * MM, 6);
        expect(onTiltedFacet(here.stack, fb, d, BAND), `${k} ${mm}`).toBe(on);
        n++;
      }
    }
    expect(n).toBe(12);
    // on the face itself: on at any distance handed
    expect(onTiltedFacet(fb, fb, Infinity, BAND)).toBe(true);
  });
});

describe("⭐ the tunable `freeFaceSquare` (N2 0 by default, N1 1)", () => {
  it("0 by default; 0 and 1 valid; anything else refused", () => {
    expect(DEFAULT_CONFIG.freeFaceSquare).toBe(0);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeFaceSquare: 1 })).not.toThrow();
    for (const v of [0.5, 2, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeFaceSquare: v })).toThrow();
  });
});

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
/** the comments out (a pin reads the code, not its prose) */
const codeOnly = (s: string) => s.replace(/\/\/[^\n]*/g, "");
/** one function's CODE (its comments out, then its whitespace collapsed) */
function fnCode(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return codeOnly(s.slice(i, s.indexOf(close, i) + close.length)).replace(/\s+/g, " ");
}
const before = (src: string, a: string, b: string) => {
  expect(src.indexOf(a), a).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(b), b).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(a), `${a} before ${b}`).toBeLessThan(src.indexOf(b));
};

describe("⭐⭐⭐ the wiring (`render/assembly_wiring.ts`): the carried heading, in a spit only", () => {
  const W = "render/assembly_wiring.ts";
  it("⭐ the camera's spit branch: `freeHeadingAngle` with `asmFree` set, `spitCameraHeading` otherwise", () => {
    const c = fnCode(W, "function assemblyCameraFrameRaw(");
    // ⭐ (2026-11-17, LF1 (iv′); 2026-11-18, ES) the heading SHOWN (`freeShownHeading`: the carried one, or the picture kept at the entry, stepped toward the layout)
    // ⭐ (2026-11-18, ES) one heading for both: the free face's shown one, else the side's; the picture before the offsets kept for the next entry
    const g = "const hS = st.asmFree !== null ? freeHeadingAngle(freeShownHeading(st, uW, side, dtMs), uW) : spitCameraHeading(uW, st.asmZone!.zone.axis, side);"; // ⭐ (v5) the side passed down: the entry keeps it
    expect(c).toContain(g);
    before(c, "const uW = mulM(B, sF);", g);
    before(c, g, "return offsetFrame(uW, hS, o.yawRad, o.pitchRad);");
    expect(c.match(/freeHeadingAngle\(/g)?.length).toBe(1);
  });
  it("⭐ `zoneFinger`: `fingerInFrame`'s own answer with `asmFree` set — before the swap", () => {
    const z = fnCode(W, "export function zoneFinger(");
    const g = "if (st.asmFree !== null) return { dx: r.dx, fdy: r.dy };";
    expect(z).toContain(g);
    before(z, "st.asmZoneAlpha = r.alpha;", g);
    before(z, g, "const sw = fingerSwapped(dx, dy, r.alpha);");
  });
  it("⭐ `spitStep`: returns with `asmFree` set before any side change", () => {
    const s = fnCode(W, "export function spitStep(");
    const g = "if (st.asmFree !== null) return;";
    expect(s).toContain(g);
    before(s, g, "const side = spitSide(u, z.axis, prev);");
    before(s, g, "st.asmSpitSide = side;");
  });
  it("⭐ read once a frame in `assemblyFrame`, after the place and its band — the previous place with the map it indexed", () => {
    const a = fnCode(W, "export function assemblyFrame(");
    expect(a).toContain("const sh0 = st.asmShown; const fbWas = st.asmFaceBand;");
    // ⭐ (2026-11-16, C2W) the previous place named (`placeWas`) and kept for the tilt's entry (`asmPlaceWas`)
    expect(a).toContain("const placeWas = sh0 !== null && fbWas !== null ? { map: fbWas.map, stack: sh0.t.stack } : null;");
    const g = "st.asmPlaceWas = placeWas; freeFaceFrame(st, m.t, placeWas);";
    expect(a).toContain(g);
    before(a, "faceBandRead(st, m.t);", g);
    before(a, "tiltFrame(st, m.t.stack, m.t.surface);", g);
    before(a, g, "calmFrame(st, dtMs);");
    expect(raw(W).match(/freeFaceFrame\(st, /g)?.length).toBe(1);
  });
  it("⭐ the entry and the exit: each ONE camera turn from the pose shown (`asmZoneMix` from `poseShown`, as `spitStep`'s); the exit the side afresh, the coast stopped, the hold on the dy that pushed over the side (`exitHoldSign`, D-T4)", () => {
    const turn = "turnBegin(st, { paced: false, byMm: false, noCamNull: false, uWas: null, carry: true, tilt: false, stopCoast: false });"; // ⭐ (2026-11-19, RB1) through the one starter
    const f = fnCode(W, "function freeFaceFrame(");
    expect(f).toContain("const z = spitZone(st);");
    expect(f).toContain("if (z === null || map === null || B === null || at === null) { st.asmFree = null; return; }");
    expect(f).toContain("if (st.asmFree !== null && st.asmFree.map !== map) { st.asmFree = null; st.asmSpitSide = 0; st.asmSpitU = null; }");
    // ⭐ (2026-11-17, LF1 (iv′)) kept on the face: the heading shown re-read there (`tests/free_entry_upright.test.ts`), nothing else
    expect(f).toContain("if (onTiltedFacet(t.stack, fr.facet, d, edgeMarginM(st))) { if (fr.entry !== null) st.asmFree = { ...fr, depth: entryDepth(fr.entry, mulM(B, t.surface)) }; return; }");
    expect(f).toContain("const d = t.stack === fr.facet ? 0 : distanceToFacets(map, [fr.facet], t.surface);");
    expect(f).toContain("if (f === undefined || !isFreeFace(mulM(B, f.n), WORLD_UP)) return;");
    // ⭐ (2026-11-16, C2W) the entry through the one function a free face's entry calls whatever its zone (`freeEntry`; its body: `free_face_caps.test.ts`)
    expect(f).toContain("const en = freeEntry(st, map, B, at, t.stack, prev); if (en === null) return; const { ci, from, heading } = en;");
    expect(fnCode(W, "function freeEntry(")).toContain("const heading = freeEntryHeading(freeEdges(at.contour, ci, WORLD_UP), from, st.asmCamLast?.up ?? F.n, F.n);");
    expect(f).toContain("st.asmFree = { map, facet: t.stack, ci, heading, layout: heading, entry, depth: entry === null ? 0 : entryDepth(entry, mulM(B, t.surface)), offset: null, side: 0, turning: false };"); // ⭐ (LF1) + the layout, the entry edge, the depth, the offset; ⭐ (v5, v7) + the entry's side not yet read, no turn seen yet
    before(f, "st.asmFree = { map, facet: t.stack, ci, heading, layout: heading, entry, depth: entry === null ? 0 : entryDepth(entry, mulM(B, t.surface)), offset: null, side: 0, turning: false };", turn);
    expect(f).not.toContain("asmEdgeHold"); // no dy hold at an entry
    const x = fnCode(W, "function freeFaceExit(");
    expect(x).toContain("const turn = exitTurnRad(fr.heading, edges, to);");
    expect(x).toContain("st.asmFree = null; st.asmSpitSide = 0; st.asmSpitU = null;");
    // ⭐⭐⭐ (2026-11-16, step C5) the turn, the ease carried, the coast stopped and the hold through the one event (`crossTurn`)
    expect(x).toContain("const held = st.asmG === null ? 0 : exitHoldSign(fr.heading, edges, to, contour[fr.ci]?.c ?? [0, 0, 0], st.asmDySign);");
    expect(x).toContain("st.asmFree = null; st.asmSpitSide = 0; st.asmSpitU = null; crossTurn(st, { at: null, uWas: null, carry: true, paced: false, hold: held });");
    expect(x).not.toContain("crossingHold(");
    const c = fnCode(W, "function crossTurn(");
    expect(c).toContain("turnBegin(st, { paced: c.paced, byMm: false, noCamNull: false, uWas: c.uWas, carry: c.carry, tilt: c.tilt === true, stopCoast: true, hold: c.hold });"); // ⭐ (2026-11-19, RB1) through the one starter
    expect(fnCode(W, "function turnBegin(")).toContain("if (uprightDecides(st)) changeAsk(st, a); else { const mixWas = st.asmZoneMix; if (a.paced) seamOutStart(st); else if (a.noCamNull || st.asmCamLast !== null) seamTurnStart(st, a.byMm); if (a.uWas !== null) seamEase(st, a.uWas); else if (a.carry) easeCarry(st, mixWas); if (a.tilt && st.asmZoneMix !== null) st.asmZoneMix.tilt = true; } if (a.stopCoast) st.orbitInertia.stop(); if (a.hold !== undefined && !uprightDecides(st)) st.asmEdgeHold = holdAtCrossing(a.hold);");
    // ⛔ the sway: nothing drawn, picked or seen by the camera decides — the pose shown and the up shown only continue the picture
    for (const s of [f, x]) expect(s).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|computeWorldMatrix|cameraPrev|modelCast|gizmoNormal/);
    const cf = fnCode(W, "function contourOfFacet(");
    expect(cf).toContain("return contourFaceAt(contour, mulM(B, f.n), mulM(B, [c[0] * k, c[1] * k, c[2] * k]));");
  });
  it("⭐ none carried at a zone's switch, a tilt and the reset — beside the band's clear", () => {
    for (const sig of ["function zoneSwitch(", "function tiltOn("]) expect(fnCode(W, sig), sig).toContain("st.asmShown = null; st.asmFaceBand = null; st.asmFree = null;");
    expect(fnCode(W, "export function orbitStateStart(")).toContain("asmFree: null,");
  });
  it("⭐ N1 (`freeFaceSquare` 1): the square camera's target the free face's normal and its share whole — with a face carried only", () => {
    const q = fnCode(W, "function squareFrame(");
    expect(q).toContain("const freeSq = st.cfg.freeFaceSquare === 1 && st.asmFree !== null ? st.asmFree.map.facets[st.asmFree.facet] : undefined;");
    expect(q).toContain("sq.target = bf === undefined || onCapB ? sq.target : bf.n; if (freeSq !== undefined) sq.target = freeSq.n;");
    expect(q).toContain("else sq.q = wholeShareStep(sq.q, st.asmTiltAuto || freeSq !== undefined ? 1 : 0, dtMs, rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS));");
  });
  it("⭐ the reads of `asmFree`: five (⛔ each under `chartLayout === 1` before step 2.5 — the switch deleted)", () => {
    const code = codeOnly(raw(W));
    const reads = [...code.matchAll(/[^\n]*st\.asmFree !== null[^\n]*/g)].map((m) => m[0]);
    expect(reads.length).toBe(5);
    // the only writes: the start, the clears, the entry — ⭐ (2026-11-17, LF1 (iv′)) + the depth on the face and the heading shown (the camera's frame)
    expect(code.match(/st\.asmFree = /g)?.length).toBe(8);
  });
});
