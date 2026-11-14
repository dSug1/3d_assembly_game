/**
 * GOLDEN VECTORS — **THE ORBIT ON ANY SHAPE** (2026-11-12, `Claude/40_RENDER_SCENE/spec/ORBIT_ANY_SHAPE.md`; the owner: *"in the polar orbit of the
 * heptagon: the red and green sections are broken … the green contour larger than the slanted faces … the gizmo can travel in the void beyond the edges"*,
 * *"OK. Capture these rules in the tiered md files. Proceed with the fixes."*).
 * * ⭐⭐⭐ `Scene_1`'s cube UNCHANGED: its face map's grid (place, blended place, band, facet, chord, the angles read back) is `12dc4b6`'s, bit for bit.
 * * F1 a facet placed on its POLYGON (§2's rule — the green straight, the red on the chord): every place ON the surface (⛔ the ends' squares' corners).
 * * F2a the cap's centre its polygon's centroid; F2b a RIDGE holds the pole (no cap, the side band to 90°); F3 one pitch → height scale (the green level).
 * RED on `12dc4b6`'s `face_map.ts` (the cube's grid excepted: it is that commit's).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blendThroughEdges, buildFaceMap, capCentre, chordAt, holdsPole, mapAngles, mapTarget, RIDGE_TIE_DEG, type FaceMap, type MapFace } from "../src/input/face_map";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const D = Math.PI / 180;
const opts = { edgeMm: 10, edgeDeg: 10 };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** a planar convex face, oriented outward from `mid` */
function face(vs: readonly Vec3[], mid: Vec3): MapFace {
  const c = cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
  const l = Math.hypot(...c);
  const tris: [Vec3, Vec3, Vec3][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  const centre: Vec3 = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as Vec3;
  let n: Vec3 = [c[0] / l, c[1] / l, c[2] / l];
  if (dot(n, sub(centre, mid)) < 0) n = [-n[0], -n[1], -n[2]];
  return { normal: n, centre, tris };
}

/** ⭐ A prism EXTRUDED ALONG x on a polygon in (z, y) — `Scene_0`'s heptagon's shape: `profile` its vertices (z, y), counter-clockwise; x ±`hx` */
function prismX(profile: readonly (readonly [number, number])[], hx: number): { faces: MapFace[]; box: ShellBox; planes: [Vec3, number][] } {
  const ys = profile.map((p) => p[1]);
  const zs = profile.map((p) => p[0]);
  const mid: Vec3 = [0, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
  const at = (x: number, k: number): Vec3 => [x, profile[k]![1], profile[k]![0]];
  const n = profile.length;
  const faces: MapFace[] = [];
  for (let k = 0; k < n; k++) faces.push(face([at(-hx, k), at(-hx, (k + 1) % n), at(hx, (k + 1) % n), at(hx, k)], mid));
  faces.push(face([...Array(n)].map((_, k) => at(hx, k)), mid), face([...Array(n)].map((_, k) => at(-hx, k)), mid));
  const planes = faces.map((f) => [f.normal, dot(f.normal, f.centre)] as [Vec3, number]);
  return { faces, box: { lo: [-hx, Math.min(...ys), Math.min(...zs)], hi: [hx, Math.max(...ys), Math.max(...zs)] }, planes };
}
/** a regular n-gon's profile, its bottom EDGE flat (an odd n: a vertex at the zenith), circumradius `R`, its bottom at y 0 */
function ngon(nSides: number, R: number): [number, number][] {
  const step = (2 * Math.PI) / nSides;
  const pts = [...Array(nSides)].map((_, k) => [Math.cos(-Math.PI / 2 + step / 2 + k * step) * R, Math.sin(-Math.PI / 2 + step / 2 + k * step) * R] as [number, number]);
  const y0 = Math.min(...pts.map((p) => p[1]));
  return pts.map(([z, y]) => [z, y - y0]);
}
/** a point's signed distance to the convex prism (≤ 0 inside / on) */
const sdist = (p: Vec3, planes: readonly [Vec3, number][]) => Math.max(...planes.map(([n, e]) => dot(n, p) - e));
const place = (fm: FaceMap, yaw: number, pitch: number): Vec3 =>
  blendThroughEdges(fm, yaw, pitch, opts, mapTarget(fm, yaw, pitch, opts).surface, (y, p) => mapTarget(fm, y, p, opts).surface);

const HEPT = prismX(ngon(7, 0.25), 0.245);

describe("⭐⭐⭐ `Scene_1`'s cube UNCHANGED — its face map is `12dc4b6`'s, bit for bit", () => {
  it("⭐⭐⭐ the grid (every 11.25° of yaw and pitch): band, facet, place, blended place, chord, the angles read back — and the columns", () => {
    const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };
    const fx = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_map_grid.json", import.meta.url), "utf8")) as { columns: unknown; rows: (number | string)[][] };
    const fm = buildFaceMap(cube.faces, cube.box);
    expect(JSON.parse(JSON.stringify(fm.columns))).toEqual(fx.columns);
    for (const r of fx.rows) {
      const [y, p] = r as [number, number];
      const t = mapTarget(fm, y * D, p * D, opts);
      const b = blendThroughEdges(fm, y * D, p * D, opts, t.surface, (yy, pp) => mapTarget(fm, yy, pp, opts).surface);
      const back = mapAngles(fm, t.surface, t.stack, opts);
      expect([y, p, t.band, t.stack, ...t.surface, ...b, t.across.lo, t.across.hi, back.yaw, back.pitch]).toEqual(r);
    }
  });
});

describe("⭐⭐⭐ the heptagon (`Scene_0`'s shape: extruded along x, a face on the floor, a vertex at the zenith)", () => {
  const fm = buildFaceMap(HEPT.faces, HEPT.box);

  it("⭐⭐⭐ F2b — A RIDGE HOLDS THE POLE: the two top faces (tied) are neither the cap — each holds it, from its own side; the side columns run to 90°", () => {
    expect(fm.facets[fm.top]!.real).toBe(false);
    const tops = fm.facets.map((f, i) => ({ f, i })).filter(({ f }) => f.kind === "SIDE" && f.n[1] > Math.SQRT1_2);
    expect(tops.length).toBe(2);
    for (const { i } of tops) expect(holdsPole(fm, i)).toBe("TOP");
    expect(Math.abs(Math.asin(tops[0]!.f.n[1]) - Math.asin(tops[1]!.f.n[1])) / D).toBeLessThan(RIDGE_TIE_DEG);
    for (const c of fm.columns) expect(c.bounds[c.bounds.length - 1]).toBeCloseTo(90 * D, 12);
    // the bottom is a real level cap (the floor's face): its band from −45°, as a box's
    expect(fm.facets[fm.bottom]!.real).toBe(true);
    for (const c of fm.columns) expect(c.bounds[0]).toBeCloseTo(-45 * D, 12);
    // ⭐ a vertical side holds no pole (a box's sides: its caps alone)
    expect(fm.facets.filter((f) => f.kind === "SIDE" && Math.abs(f.n[1]) < 1e-9).every((_, j, a) => holdsPole(fm, fm.facets.indexOf(a[j]!)) === null)).toBe(true);
  });

  it("⭐⭐⭐ F1 — THE ROPE ON THE SURFACE: every place, every yaw and pitch, lies ON the heptagon (⛔ the ends' squares: up to 184 mm off it, walked)", () => {
    let worst = -Infinity;
    for (let p = -89; p <= 90; p += 1.5) for (let y = 0; y < 360; y += 1.5) worst = Math.max(worst, sdist(mapTarget(fm, y * D, p * D, opts).surface, HEPT.planes));
    expect(worst).toBeLessThan(1e-9);
  });

  it("⭐⭐ F1 — an end face (not a rectangle) placed on its CHORD: the green straight edge to edge at every height, the red the same share of it", () => {
    const end = fm.facets.findIndex((f) => f.kind === "SIDE" && f.n[0] > 0.99);
    const f = fm.facets[end]!;
    expect(f.rect).toBe(false);
    // the chord at the zenith a point (the vertex), at mid-height the widest
    const top = chordAt(f, f.bHi);
    expect(top.hi - top.lo).toBeLessThan(1e-9);
    const w = (s: number) => chordAt(f, s).hi - chordAt(f, s).lo;
    expect(w((f.bLo + f.bHi) / 2)).toBeGreaterThan(w(f.bLo + 0.01));
    // a rectangle's chord: its extents, exactly
    const long = fm.facets.find((g) => g.kind === "SIDE" && g.rect)!;
    expect(chordAt(long, (long.bLo + long.bHi) / 2)).toEqual({ lo: long.tLo, hi: long.tHi });
  });

  it("⭐⭐⭐ F3 — THE GREEN IS LEVEL: one pitch, one height in every column (away from a facet's edge stretch) — ⛔ each column's own bands: 38 / 51 / 45° tops", () => {
    const B = fm.columns.flatMap((c) => c.bounds);
    for (let p = -40; p <= 85; p += 2.5) {
      if (B.some((b) => Math.abs(p * D - b) < 10.5 * D)) continue; // the edge stretch (`edgeDeg`) — the slow last mm through an edge
      const ys = [...Array(72)].map((_, k) => mapTarget(fm, (k * 5 + 2.5) * D, p * D, opts).surface[1]);
      expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(1e-9);
    }
  });

  it("⭐⭐ no jump: the blended place through every edge and slice's end (0.5°)", () => {
    let worst = 0;
    for (let p = -89; p <= 90; p += 2.5) for (let y = 0; y < 360; y += 0.5) worst = Math.max(worst, dist(place(fm, y * D, p * D), place(fm, (y + 0.5) * D, p * D)));
    for (let y = 0; y < 360; y += 2.5) for (let p = -89; p < 90; p += 0.5) worst = Math.max(worst, dist(place(fm, y * D, p * D), place(fm, y * D, (p + 0.5) * D)));
    expect(worst).toBeLessThan(0.02);
  });

  it("⭐⭐ …and back: every place read back to its own angles (`mapAngles`)", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let k = 0; k < 300; k++) {
      const yaw = rnd() * 2 * Math.PI;
      const pitch = (rnd() * 2 - 1) * (Math.PI / 2 - 2e-3);
      const t = mapTarget(fm, yaw, pitch, opts);
      const back = mapAngles(fm, t.surface, t.stack, opts);
      expect(dist(mapTarget(fm, back.yaw, back.pitch, opts).surface, t.surface)).toBeLessThan(1e-6);
    }
  });
});

describe("⭐⭐ F2a — a cap NOT centred on the core: its quarters converge on ITS centroid (⛔ the core's middle on its plane — off the face)", () => {
  it("⭐⭐ a right trapezoid's top (z 0 … 0.1 over a core z −0.2 … 0.1): the centre ON the top face, at its middle", () => {
    const T = prismX([[-0.2, 0], [0.1, 0], [0.1, 0.3], [0, 0.3]], 0.2);
    const fm = buildFaceMap(T.faces, T.box);
    const cap = fm.facets[fm.top]!;
    expect(cap.real).toBe(true);
    const C = capCentre(fm, cap);
    expect(C[2]).toBeCloseTo(0.05, 9); // ⛔ the core's middle: −0.05, off the top (0 … 0.1)
    expect(sdist(C, T.planes)).toBeLessThan(1e-9);
    for (const y of [0, 70, 160, 250]) expect(dist(mapTarget(fm, y * D, 90 * D, opts).surface, C)).toBeLessThan(1e-9);
  });
});

describe("⭐⭐⭐ F4 — the pitch asked PAST A POLE reaches the map (⛔ the map moved by the orbit's step alone: zero at the pole — the face never reached)", () => {
  it("⭐⭐⭐ the orbit keeps what its rings' clamp cut off (`takeBeyond`), read once; a reset keeps it", async () => {
    const { OrbitController } = await import("../src/input/orbit");
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    const o = new OrbitController(DEFAULT_CONFIG, 0, 0.99);
    o.nudge(0, 0.05);
    expect(o.elevation).toBe(1);
    expect(o.takeBeyond()).toBeCloseTo(0.04, 12);
    expect(o.takeBeyond()).toBe(0);
    o.nudge(0, -0.02); // back inside: nothing beyond
    expect(o.takeBeyond()).toBe(0);
    o.reset(0, 0);
    o.nudge(0, -0.03);
    o.reset(0.1, 0); // the solve's reset keeps it
    expect(o.takeBeyond()).toBeCloseTo(-0.03, 12);
  });
  it("⭐⭐ `poleBeyondPitch`: only AT the limit and toward it, as pitch", async () => {
    const { poleBeyondPitch } = await import("../src/input/face_map");
    const H = Math.PI / 2;
    expect(poleBeyondPitch(1, 0.02, H)).toBeCloseTo(0.02 * Math.PI, 12);
    expect(poleBeyondPitch(0, -0.02, H)).toBeCloseTo(-0.02 * Math.PI, 12);
    expect(poleBeyondPitch(0.5, 0.02, H)).toBe(0);
    expect(poleBeyondPitch(1, -0.02, H)).toBe(0);
    expect(poleBeyondPitch(0, 0.02, H)).toBe(0);
  });
  it("⭐⭐⭐ wired: read every frame (before the assembly's early return), added to the map's pitch step, the map's pitch held within ±90°", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a.indexOf("const beyondV = st.orbit.takeBeyond();")).toBeLessThan(a.indexOf("if (!assemblyOn(st) || st.greenBox === null) {")); // ⭐ (2026-11-13, §9) the early return now also clears the held heading offset
    expect(a).toContain("const beyond = poleBeyondPitch(q.v, beyondV, ORBIT_PITCH_MAX_RAD);");
    expect(a).toContain("pitch: pitch - pitchOfV(prev.v) + beyond }, MAP_CATCH_UP,");
    expect(a).toContain("const mq = { yaw: mqs.yaw, pitch: Math.max(-ORBIT_PITCH_MAX_RAD, Math.min(ORBIT_PITCH_MAX_RAD, mqs.pitch)) };");
  });
});

describe("⭐⭐⭐ F2b / F2c wired — the tilt on ANY face holding a pole (`holdsPole`), toward its own heading (`tiltHeading`)", () => {
  it("⭐⭐⭐ `tiltOn`: a pole by `holdsPole` (the cap, or a side beyond 45°), its heading by `tiltHeading` (⛔ the cap alone; the orbit's heading)", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const pole = holdsPole(wm, capStack); if (pole === null) return; const top = pole === \"TOP\";");
    expect(a).toContain("const hs = tiltHeading(cap.n, q.yaw);");
    expect(a).not.toContain("const hs = snapHeading(q.yaw);");
  });
});

describe("⭐⭐⭐ F5 — A FRAME NEVER SPENDS MORE THAN THE OWNER'S 24 (⛔ 25 – 38 on both scenes, the walks)", () => {
  it("⭐⭐ a solve's first iteration — the frame's reserve — is 12 at most (its worst branch counted)", async () => {
    const { FIRST_ITERATION_MAX_QUERIES } = await import("../src/input/piece_orbit_solver");
    expect(FIRST_ITERATION_MAX_QUERIES).toBe(12);
  });
  it("⭐⭐⭐ `orbitFrame` within its cap — the relocation leaves the solve its first iteration (⛔ `max(1, …)`: the search took the frame, the solve went past)", async () => {
    const { orbitFrame } = await import("../src/input/piece_orbit_solver");
    // a ring (radius 0.4 m round the origin, height by v) pressed against a wall at x = 0.3 — the piece inside its margin (the relocation searches)
    let n = 0;
    const anchor = (q: { yaw: number; v: number }): Vec3 => [0.4 * Math.cos(q.yaw), (q.v - 0.5) * 0.4, 0.4 * Math.sin(q.yaw)];
    const env = {
      anchor,
      gap: (q: { yaw: number; v: number }) => (n++, Math.max(0, 0.3 - anchor(q)[0])),
      normal: (q: { yaw: number; v: number }) => (n++, anchor(q)[0] > 0.29 ? ([-1, 0, 0] as Vec3) : null),
    };
    let seed = 3;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    let worst = 0;
    for (let k = 0; k < 200; k++) {
      const cap = 13 + Math.floor(rnd() * 12);
      const q = { yaw: (rnd() - 0.5) * 0.6, v: rnd(), zoom: 1 };
      const target = { yaw: q.yaw + (rnd() - 0.5) * 0.4, v: Math.min(1, Math.max(0, q.v + (rnd() - 0.5) * 0.2)), zoom: 1 };
      n = 0;
      orbitFrame({ q, target, userV: null, prevRaw: { yaw: q.yaw, v: q.v } }, env, { gapM: 0.001, maxQueries: cap }, { stepM: 0.002, maxM: 0.2, from: 0 });
      worst = Math.max(worst, n - cap);
    }
    expect(worst).toBeLessThanOrEqual(0);
  });
  it("⭐⭐⭐ wired: one ledger a frame (`st.pieceQueries = 0` before the solve, every check charged to it); the checks within what is left — or asked again later", () => {
    const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(g).not.toContain("pieceQueriesCarry");
    expect(g.indexOf("st.pieceQueries = 0;")).toBeLessThan(g.indexOf("assemblyFrame(st, dtSec * 1000);"));
    expect(g).toContain("return st.cfg.pieceSolverQueries - st.pieceQueries;");
    expect(g).toContain("&& queriesLeft(st) < 2) { u = a.u ?? 0;"); // the turn waits a frame
    expect(g).toContain("if (queriesLeft(st) < 1) return;"); // the stuck check
    expect(g).toContain("if (n >= left) throw OUT_OF_FRAME;");
    expect(g).toContain('const v = turn === null ? "a part" : pieceTurnVerdict(st, turn, left - n); if (v === "PENDING") throw OUT_OF_FRAME;');
    const o = readFileSync(new URL("../src/render/orient_cube.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(o).toContain("QUAD_CHECK_MS, st.cfg.pieceSolverQueries, st.pieceQueries);");
  });
});

describe("⭐⭐⭐ §8 — THE DY HOLD after a pole-holding face's FAR edge (the owner: *\"just give an hysteresis of the dy … This will also be OK in case of the cube of scene 1\"*)", () => {
  it("⭐⭐⭐ set only over the edge AWAY from the tilt's heading (the camera turns round): the heptagon's ridge, the cube's far edge, the nadir's far edge — never the near edge, a side edge", async () => {
    const { edgeHoldAt } = await import("../src/input/orbit_tilt");
    const front = -Math.PI / 2; // the heading toward −z (the user's side)
    const g0: Vec3 = [0, 0.48, 0.19];
    const n = (deg: number): Vec3 => [0, Math.cos(deg * D), -Math.sin(deg * D)]; // a face's normal tilted `deg` from up toward −z
    // the heptagon: the front top face tilted (heading front), left over the ridge onto the back top face
    expect(edgeHoldAt(front, n(25.7), n(-25.7), g0, 1)).not.toBeNull();
    // the cube: its top tilted (heading front), left over the far edge onto the back side (+z) — and over the near edge onto the front side: none
    expect(edgeHoldAt(front, [0, 1, 0], [0, 0, 1], g0, 1)).not.toBeNull();
    expect(edgeHoldAt(front, [0, 1, 0], [0, 0, -1], g0, 1)).toBeNull();
    // across, onto a side (±x): none; no dy: none; the nadir's far edge (the bottom tilted, heading front, onto a back lower face): set, its sign kept
    expect(edgeHoldAt(front, [0, 1, 0], [1, 0, 0], g0, 1)).toBeNull();
    expect(edgeHoldAt(front, [0, 1, 0], [0, 0, 1], g0, 0)).toBeNull();
    expect(edgeHoldAt(front, [0, -1, 0], [0, -0.614, 0.789], g0, -1)!.sign).toBe(-1);
  });
  it("⭐⭐⭐ the held sign none, the other whole; released after `edgeHoldMm` of FINGER the other way (2026-11-14 — the owner's hysteresis, a finger's: the same far out as close in)", async () => {
    const { edgeHoldAt, edgeHoldFinger, edgeHoldDy } = await import("../src/input/orbit_tilt");
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    const h = edgeHoldAt(-Math.PI / 2, [0, 1, 0], [0, 0, 1], [0, 0.5, 0.25], 1)!;
    expect(h.back).toBe(0);
    expect(edgeHoldDy(h, 3)).toBe(0);
    expect(edgeHoldDy(h, -3)).toBe(-3);
    expect(edgeHoldDy(null, 3)).toBe(3);
    // the held way pushes on: nothing gathered, still held
    expect(edgeHoldFinger(h, 10, 30)).toBe(h);
    // the other way: gathered, the forward pushes in between change nothing; released at the band, not before
    const a = edgeHoldFinger(h, -12, 30)!;
    expect(a.back).toBeCloseTo(12, 12);
    expect(edgeHoldFinger(a, 50, 30)).toBe(a);
    const b = edgeHoldFinger(a, -17.9, 30)!;
    expect(b).not.toBeNull();
    expect(b.back).toBeCloseTo(29.9, 12);
    expect(edgeHoldFinger(b, -0.2, 30)).toBeNull();
    // a held nadir (−1): the up way gathers
    const n = edgeHoldAt(-Math.PI / 2, [0, -1, 0], [0, -0.614, 0.789], [0, 0, 0.3], -1)!;
    expect(edgeHoldFinger(n, -5, 30)).toBe(n);
    expect(edgeHoldFinger(n, 31, 30)).toBeNull();
    expect(edgeHoldFinger(h, 0, 30)).toBe(h);
    expect(DEFAULT_CONFIG.edgeHoldMm).toBe(30);
  });
  it("⭐⭐⭐ wired: the tilt keeps its heading; `tiltOff` sets the hold from the dy that crossed (the coast stopped); released by the FINGER (2026-11-14); the drag's dy through it", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("exit: false, exitAcross: false, heading: hs };");
    expect(a).toContain("const hold = edgeHoldAt(tl.heading, nT, nW, g, st.asmDySign);");
    expect(a).toContain("if (st.asmEdgeHold !== null && (!assemblyOn(st) || st.asmG === null)) st.asmEdgeHold = null;");
    expect(a).not.toContain("edgeHoldDepth");
    const p = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(p).toContain("const fdy1 = asmOn ? edgeHoldDy(st.asmEdgeHold, fdy0) : fdy0;");
    expect(p).toContain("if (asmOn && fdy0 !== 0 && !dxOnly && !shiftApproach) st.asmDySign = Math.sign(fdy0);");
    expect(p).toContain("if (asmOn && st.asmEdgeHold !== null && fdy0 !== 0 && !dxOnly && !shiftApproach) st.asmEdgeHold = edgeHoldFinger(st.asmEdgeHold, fdy0 / mmToPx(1), st.cfg.edgeHoldMm);");
  });
});

// ⭐⭐⭐ (2026-11-14, the owner: "there are times I cannot reverse … I can only go in one dy direction") §8's hold ends WITH THE GESTURE that crossed —
// ⛔ kept across presses: a new press the way the last one crossed moved nothing for 4 – 8 s (the reversal walks far out)
describe("§8's hold: the gesture's own", () => {
  it("wired: ended at the gesture's end (the last finger up, the window lost) — and nowhere else by time", async () => {
    const { readFileSync } = await import("node:fs");
    const pw = readFileSync("src/render/pointer_wiring.ts", "utf8");
    expect(pw).toContain("function gestureOver(st: SceneState): void {\n  st.asmEdgeHold = null;\n  st.episodes.gestureEnded(endGesture(st));\n}");
    expect(pw).toContain("if (st.gestureSpan.release(e.pointerId)) gestureOver(st);");
    expect(pw).toContain("if (st.gestureSpan.release(p.id)) gestureOver(st);");
    expect(pw).not.toContain("st.episodes.gestureEnded(endGesture(st));\n  });");
  });
});
