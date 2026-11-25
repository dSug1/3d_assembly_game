/**
 * ⭐⭐⭐ THE LANDING MAP (layer L2, principle P2) — its vectors (`ORBIT_SURFACE_LANDING_MAP.md` §8; package S1 of `ORBIT_SURFACE_BUILD.md`).
 * ⛔ The map is NOT wired: these vectors are its only reader. Each was shown RED on a mutant of `src/core/landing_map.ts` (the list: the design
 * document §10). The full comparison with the brute force (every place of the library's travels, the 1596-cell sweep) is the offline
 * `scripts/surface/landing_compare.ts`; here a fixed, deterministic choice of places.
 * ⭐⭐ (2026-11-24, S14 — `ORBIT_SURFACE_LANDING_CAST.md` §6 item 3) S1's and S12's vectors run on BOTH ENGINES (`ENGINES`): today's sums and the cast
 * (`src/core/landing_cast.ts`) — the same answers against the same brute force. The grid's own vectors (the lookup, the layers, the invariance of
 * the map, C2's size) stay the sums'; the cast's own (the cross-engine agreement on the scenes, its mutants) are `landing_cast.test.ts`.
 */
import { describe, expect, it } from "vitest";
import { prepareLandingCast } from "../src/core/landing_cast";
import { buildLandingMap, heldSumsOn, LANDING_STEP_MM, preparePlaced, sumsSize, type ConvexPiece, type Landing, type LandingFrame, type LandingMap } from "../src/core/landing_map";
import type { Vec3 } from "../src/core/vec";
import {
  PIECES, PIECE_A, PIECE_B, TOP_F, base, boxHeld, bruteLanding, bx, frameOf, library, hullPart, placesOf, prismZ, toConvex, vd, withVoids, type Part,
} from "./helpers/surface_shapes";

const M = 0.001;
const IX = -100, IZ = -60;
/** the design's tolerance, and the brute force's own convention on a slope (its footprint shrunk by 1e-4 mm; the steepest: the knife, 85/15) */
const TOL_M = 1e-9;
const OPEN_SHRINK_M = (85 / 15) * 1e-4 * M + TOL_M;

/**
 * ⭐⭐ (2026-11-24, S14) THE TWO ENGINES the vectors read: today's sums (the map itself, LIVE) and the cast (`prepareLandingCast`). The cast has no
 * grid: its "sample" is its exact landing at the sample's place — the sums' own sample is that, bit for bit (the lookup's vector below) — on the
 * places of the same grid (its step, its count: the map's formula, here only to choose the places).
 */
const ENGINES = ["the sums", "the cast"] as const;
type Engine = (typeof ENGINES)[number];
type Readable = Pick<LandingMap, "nu" | "nv" | "stepM" | "uAt" | "vAt" | "refused" | "landingAt" | "landingSample">;
function mapOn(engine: Engine, placed: readonly ConvexPiece[], held: readonly (readonly Vec3[])[], frame: LandingFrame, stepMm: number = LANDING_STEP_MM): Readable {
  if (engine === "the sums") return buildLandingMap(placed, held, frame, stepMm);
  const c = prepareLandingCast(placed, held, frame);
  const stepM = stepMm * M;
  const nu = Math.max(1, Math.floor((frame.uMax - frame.uMin) / stepM + 1e-9) + 1), nv = Math.max(1, Math.floor((frame.vMax - frame.vMin) / stepM + 1e-9) + 1);
  const uAt = (i: number) => frame.uMin + i * stepM, vAt = (j: number) => frame.vMin + j * stepM;
  return { nu, nv, stepM, uAt, vAt, refused: c.refused, landingAt: c.landingAt, landingSample: (i, j) => c.landingAt(uAt(i), vAt(j)) };
}
const topMap = (E: Engine, parts: Part[], held: Vec3[][], u0: number, u1: number, v0: number, v1: number, stepMm?: number): Readable =>
  mapOn(E, toConvex(parts), held, frameOf(TOP_F, u0, u1, v0, v1), stepMm);
const r6 = (x: number) => Math.round(x * 1e6) / 1e6 + 0; // to 1e-6 mm; + 0: no −0
const depthMm = (l: Landing): number | string => (l.kind === "land" ? r6(l.depth / M) : l.kind);
const landA = (E: Engine, parts: Part[], L: number, s: number) => topMap(E, parts, [boxHeld(PIECE_A, TOP_F)], L - 1, L + 1, s - 1, s + 1).landingAt(L * M, s * M);

for (const E of ENGINES) describe(`⭐⭐⭐ S1 [${E}] — the landing map against its SECOND IMPLEMENTATION (the study's brute-force P reading)`, () => {
  it("the library L01 – Q10, every studied facet, pieces A and B (A, the bar, the bar turned on L53): the same landing, the same 'nothing'", () => {
    let places = 0, nothing = 0, shrink = 0;
    for (const sh of library()) {
      if (sh.parts.length === 0) continue;
      const placed = toConvex(sh.parts);
      for (const st of sh.studies) {
        const pls = st.lines.flatMap((ln) => placesOf(st, ln, 7));
        const Ls = pls.map((p) => p[0]), Ss = pls.map((p) => p[1]);
        for (const pk of sh.pieces) {
          const pc = PIECES[pk]!;
          const map = mapOn(E, placed, [boxHeld(pc, st)], frameOf(st, Math.min(...Ls), Math.max(...Ls), Math.min(...Ss), Math.max(...Ss)), 16);
          const check = (l: Landing, L: number, s: number) => {
            const br = bruteLanding(sh.parts, st.n, st.t, st.b, L, s, pc);
            places++;
            if (br.nothing) {
              nothing++;
              expect(l.kind, `${sh.name} ${pk} (${L}, ${s})`).toBe("nothing");
              return;
            }
            expect(l.kind, `${sh.name} ${pk} (${L}, ${s})`).toBe("land");
            const d = (l as { depth: number }).depth - br.level * M;
            if (Math.abs(d) > TOL_M) {
              shrink++;
              expect(d, `${sh.name} ${pk} (${L}, ${s}): only the brute's shrink on a slope`).toBeGreaterThan(0);
              expect(d).toBeLessThanOrEqual(OPEN_SHRINK_M);
            }
          };
          for (const [L, s] of pls) check(map.landingAt(L * M, s * M), L, s);
          for (let i = 0; i < map.nu; i += 2) for (let j = 0; j < map.nv; j += 2) check(map.landingSample(i, j), map.uAt(i) / M, map.vAt(j) / M);
        }
      }
    }
    expect(places).toBeGreaterThan(15000);
    expect(nothing).toBeGreaterThan(500); // the comparison is not vacuous on "nothing"
    expect(shrink).toBeLessThan(places / 20);
  });
});

for (const E of ENGINES) describe(`⭐⭐ S1 [${E}] — the analytic cases of P2 (ORBIT_SURFACE.md §2.2), each with its known answer (mm)`, () => {
  it("a void NARROWER than the piece is CLOSED: A rests on the rims of L02's 30 hole and L04's 30 slot", () => {
    expect(depthMm(landA(E, withVoids([vd(IX - 15, IX + 15, IZ - 15, IZ + 15, 240)]), IX, IZ))).toBe(240);
    expect(depthMm(landA(E, withVoids([vd(IX - 15, IX + 15, IZ - 15, IZ + 15, 40)]), IX, IZ))).toBe(240);
  });
  it("a WIDER void gives its floor, no nearer than half a piece from each wall (L03, 60 x 60 x 40: A's band 60 − 41.3 along t, 60 − 45 along b)", () => {
    const slot = withVoids([vd(IX - 30, IX + 30, IZ - 30, IZ + 30, 40)]);
    const map = topMap(E, slot, [boxHeld(PIECE_A, TOP_F)], IX - 20, IX + 20, IZ - 20, IZ + 20, 1);
    for (let k = -12; k <= 12; k++) expect(depthMm(map.landingAt((IX + k) * M, IZ * M)), `t ${k}`).toBe(Math.abs(k) < 30 - 20.65 ? 200 : 240);
    for (let k = -12; k <= 12; k++) expect(depthMm(map.landingAt(IX * M, (IZ + k) * M)), `b ${k}`).toBe(Math.abs(k) < 30 - 22.5 ? 200 : 240);
    // piece B (80 > 60): closed everywhere
    expect(depthMm(topMap(E, slot, [boxHeld(PIECE_B, TOP_F)], IX - 1, IX + 1, IZ - 1, IZ + 1).landingAt(IX * M, IZ * M))).toBe(240);
  });
  it("a PIN is touched first (L35, 10 x 10 x 40): its top wherever A's footprint covers it, else the block", () => {
    const pin = [...base(), bx("pin", IX - 5, IX + 5, 240, 280, IZ - 5, IZ + 5)];
    expect(depthMm(landA(E, pin, IX, IZ))).toBe(280);
    expect(depthMm(landA(E, pin, IX + 25, IZ))).toBe(280); // 25 − 20.65 = 4.35 < 5
    expect(depthMm(landA(E, pin, IX + 26, IZ))).toBe(240); // 5.35 > 5
    expect(depthMm(landA(E, pin, IX, IZ + 27))).toBe(280); // 27 − 22.5 = 4.5 < 5
    expect(depthMm(landA(E, pin, IX, IZ + 28))).toBe(240);
    expect((landA(E, pin, IX, IZ) as { part: string }).part).toBe("pin");
  });
  it("a FIELD OF STUDS is surface at their tops (L39, 12 x 12 x 8 at a 40 pitch: A's 41.3 always covers one)", () => {
    const studs: Part[] = [...base()];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) studs.push(bx(`st${i}${j}`, IX - 66 + 40 * i, IX - 54 + 40 * i, 240, 248, IZ - 66 + 40 * j, IZ - 54 + 40 * j));
    const map = topMap(E, studs, [boxHeld(PIECE_A, TOP_F)], IX - 60, IX + 60, IZ - 60, IZ + 60, 2);
    for (let i = 0; i < map.nu; i++) for (let j = 0; j < map.nv; j++) expect(depthMm(map.landingSample(i, j))).toBe(248);
  });
  it("a hole RIGHT THROUGH and wider than the piece is NOTHING TO LAND ON (L01, 100): a kind with no depth; the rim once the footprint reaches it", () => {
    const hole = withVoids([vd(IX - 50, IX + 50, IZ - 50, IZ + 50, 240)]);
    const l = landA(E, hole, IX, IZ);
    expect(l).toEqual({ kind: "nothing" });
    expect("depth" in l).toBe(false);
    expect(landA(E, hole, IX + 29, IZ).kind).toBe("nothing"); // 29 + 20.65 = 49.65 < 50
    expect(depthMm(landA(E, hole, IX + 30, IZ))).toBe(240); // 50.65 > 50: over the rim
  });
  it("⭐ THE MIRROR: an asymmetric held piece (a 40 x 40 x 20 body and a peg hanging 30 below it, 30 – 40 along +b) over L12's step (high z < 0, low z > 0)", () => {
    const step = [bx("low", -240, 240, 0, 180, -240, 240), bx("high", -240, 240, 180, 240, -240, 0)];
    const body: Vec3[] = [], peg: Vec3[] = [];
    for (const x of [-20, 20]) for (const y of [0, 20]) for (const z of [-20, 20]) body.push([x * M, y * M, z * M]);
    for (const x of [-5, 5]) for (const y of [-30, 0]) for (const z of [30, 40]) peg.push([x * M, y * M, z * M]);
    const map = topMap(E, step, [body, peg], -10, 10, -100, 100);
    expect(depthMm(map.landingAt(0, -50 * M))).toBe(270); // the peg over the high tread: 240 + 30
    expect(depthMm(map.landingAt(0, -25 * M))).toBe(240); // the body over the high tread, the peg over the low (180 + 30 = 210)
    expect(depthMm(map.landingAt(0, 50 * M))).toBe(210); // both over the low tread: the peg first
  });
  it("⭐ EDGE AGAINST EDGE: a box turned 45° about t, its lowest edge the reference, lands ON the knife's ridge (L46, 240 + 85) — a facet neither part has", () => {
    const knife = [...base(), prismZ("blade", [[-15, 240], [15, 240], [0, 325]], -150, 150)];
    const r = Math.SQRT1_2 * 20;
    const turned: Vec3[] = [];
    for (const x of [-30, 30]) for (const [y, z] of [[0, 0], [r, r], [r, -r], [2 * r, 0]] as const) turned.push([x * M, y * M, z * M]);
    const map = topMap(E, knife, [turned], -50, 50, -10, 10);
    expect(depthMm(map.landingAt(0, 0))).toBe(325); // the edge across the ridge: the sum's facet is the cross product of the two edges
    expect(depthMm(map.landingAt(0, 100 * M))).toBe(325); // anywhere along the ridge
    expect(depthMm(map.landingAt(40 * M, 0))).toBe(Math.round((325 - (85 / 15) * 10) * 1e6) / 1e6); // the edge over the flank at x 10 only
  });
  it("⭐ EDGE AGAINST A SLANTED EDGE: the same turned box over a roof whose ridge rises 40 mm over 200 — the contact facet (x × the ridge) is NO face of either", () => {
    const roof = [...base(), hullPart("roof", [[-15, 240, -100], [15, 240, -100], [0, 300, -100], [-15, 240, 100], [15, 240, 100], [0, 340, 100]])];
    const r = Math.SQRT1_2 * 20;
    const turned: Vec3[] = [];
    for (const x of [-30, 30]) for (const [y, z] of [[0, 0], [r, r], [r, -r], [2 * r, 0]] as const) turned.push([x * M, y * M, z * M]);
    const map = topMap(E, roof, [turned], -2, 2, -2, 2);
    for (const s of [-50, 0, 50]) expect(depthMm(map.landingAt(0, s * M)), `s ${s}`).toBe(r6(320 + 0.2 * s)); // the ridge's height where the edge crosses it
  });
  it("⭐ TOUCHING IS NOT OVERLAPPING: B (80 x 80) exactly as wide as an 80 slot lands on its floor; a 79 slot is closed", () => {
    const slot = (w: number) => withVoids([vd(IX - w / 2, IX + w / 2, IZ - w / 2, IZ + w / 2, 40)]);
    const B = (parts: Part[]) => topMap(E, parts, [boxHeld(PIECE_B, TOP_F)], IX - 1, IX + 1, IZ - 1, IZ + 1).landingAt(IX * M, IZ * M);
    expect(depthMm(B(slot(80)))).toBe(200);
    expect(depthMm(B(slot(79)))).toBe(240);
    // ⭐ and the slot and B turned 30° about the normal, the frame NOT: the walls are then oblique to the frame's axes, so the samples' rectangle
    // does not cut them and the half-spaces alone decide that a flush side is no overlap
    const c30 = Math.cos(Math.PI / 6), s30 = Math.sin(Math.PI / 6);
    const ry = (p: Vec3): Vec3 => [c30 * p[0] + s30 * p[2], p[1], -s30 * p[0] + c30 * p[2]];
    const ctr: Vec3 = [IX * M, 0, IZ * M];
    // (S14) `d`: B moved d metres along the turned slot's width — into a wall by d
    const turnedB = (parts: Part[], d = 0) => {
      const placed = toConvex(parts).map((p) => ({ id: p.id, points: p.points.map((q) => { const r = ry([q[0] - ctr[0], q[1], q[2] - ctr[2]]); return [r[0] + ctr[0], r[1], r[2] + ctr[2]] as Vec3; }) }));
      return mapOn(E, placed, [boxHeld(PIECE_B, TOP_F).map(ry)], frameOf(TOP_F, IX - 1, IX + 1, IZ - 1, IZ + 1)).landingAt(IX * M + d * c30, IZ * M - d * s30);
    };
    expect(depthMm(turnedB(slot(80)))).toBe(200);
    expect(depthMm(turnedB(slot(79)))).toBe(240);
    // ⭐ (2026-11-24, S14) TOUCHING IS WITHIN `TOUCH` (0.1 µm), on the oblique walls: 50 nm into a wall is no overlap (the floor); 300 nm is (the rim)
    expect(depthMm(turnedB(slot(80), 50e-9))).toBe(200);
    expect(depthMm(turnedB(slot(80), -50e-9))).toBe(200);
    expect(depthMm(turnedB(slot(80), 300e-9))).toBe(240);
  });
  it("⭐ TIES go to the SMALLER id, whatever the order (two parts with one top under the footprint)", () => {
    const two = [bx("zeta", -100, 0, 0, 240, -100, 100), bx("alpha", 0, 100, 0, 240, -100, 100)];
    for (const parts of [two, [...two].reverse()]) {
      const l = landA(E, parts, 0, 0);
      expect(l).toEqual({ kind: "land", depth: 240 * M, part: "alpha" });
    }
  });
  it("a piece with no volume is LEFT OUT and NAMED, never replaced", () => {
    const flat = { id: "sheet", points: [[0, 0, 0], [0.1, 0, 0], [0, 0, 0.1], [0.1, 0, 0.1]] as Vec3[] };
    const map = mapOn(E, [...toConvex(base()), flat], [boxHeld(PIECE_A, TOP_F), [[0, 0, 0], [0.01, 0, 0], [0, 0.01, 0]]], frameOf(TOP_F, 0, 1, 0, 1));
    expect(map.refused).toEqual(["held#1", "sheet"]);
    expect(LANDING_STEP_MM).toBe(4);
    expect(map.stepM).toBe(0.004);
  });
});

const q07 = [...withVoids([vd(-30, 30, 150, 210, 40)]), bx("post", -100, -80, 240, 300, 100, 240), bx("slab", -100, 100, 300, 320, 100, 240)];
for (const E of ENGINES) describe(`⭐⭐ S1 [${E}] — FROM A DEPTH (P2's fifth point): a slot under an overhang (Q07)`, () => {
  const map = topMap(E, q07, [boxHeld(PIECE_A, TOP_F)], -8, 8, 172, 188);
  const at = (from?: number) => map.landingAt(0, 180 * M, from === undefined ? undefined : from * M);
  it("from outside: the slab's top; from below the slab's stretch: the slot's FLOOR; from inside it: inside", () => {
    expect(at()).toEqual({ kind: "land", depth: 320 * M, part: "slab" });
    expect(at(330)).toEqual({ kind: "land", depth: 320 * M, part: "slab" });
    expect(depthMm(at(251))).toBe(200); // the slab's stretch is 300 − 48 … 320
    expect(depthMm(at(200))).toBe(200); // resting on the floor reads the floor
    expect(at(260)).toEqual({ kind: "inside", part: "slab" });
    expect(at(150).kind).toBe("inside"); // in the block under the slot
  });
});
describe("⭐⭐ S1 — FROM A DEPTH, the grid's layers (the sums' only: the cast keeps no layers)", () => {
  const map = buildLandingMap(toConvex(q07), [boxHeld(PIECE_A, TOP_F)], frameOf(TOP_F, -8, 8, 172, 188));
  it("the layers, OUTERMOST FIRST: the parts' (the slab, then the block under the slot) and the piece's (the slab's, then the floor's)", () => {
    const i = Math.round((0 - -8) / 4), j = Math.round((180 - 172) / 4);
    const parts = map.partsLayers(i, j).map((l) => [l.top / M, l.bottom / M].map(r6));
    expect(parts).toEqual([[320, 300], [200, 0]]);
    const piece = map.pieceLayers(i, j).map((l) => [l.top / M, l.bottom / M].map(r6));
    expect(piece).toEqual([[320, 252], [200, -48]]);
    expect(map.pieceLayers(i, j)[0]!.part).toBe("slab");
  });
});

describe("⭐⭐ S1 — the LOOKUP between samples (the sums' grid)", () => {
  const slot = withVoids([vd(IX - 30, IX + 30, IZ - 30, IZ + 30, 40)]);
  const map = buildLandingMap(toConvex(slot), [boxHeld(PIECE_A, TOP_F)], frameOf(TOP_F, IX - 40, IX + 40, IZ - 40, IZ + 40));
  it("AT a sample it is that sample; a sample is the exact evaluation at its place, bit for bit", () => {
    for (let i = 0; i < map.nu; i++) for (let j = 0; j < map.nv; j++) {
      expect(map.landing(map.uAt(i), map.vAt(j))).toEqual(map.landingSample(i, j));
      expect(map.landingAt(map.uAt(i), map.vAt(j))).toEqual(map.landingSample(i, j));
    }
  });
  it("between samples it is never below a corner (conservative: the higher side), and outside the region it is 'uncovered'", () => {
    for (let k = 1; k <= 400; k++) {
      const U = (IX - 40 + (k * 0.37) % 80) * M, Vv = (IZ - 40 + (k * 0.61) % 80) * M;
      const l = map.landing(U, Vv);
      const i = Math.floor((U - map.frame.uMin) / map.stepM + 1e-9), j = Math.floor((Vv - map.frame.vMin) / map.stepM + 1e-9);
      for (const [a, b] of [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]] as const) {
        const c = map.landingSample(Math.min(a, map.nu - 1), Math.min(b, map.nv - 1));
        if (c.kind === "land") expect(l.kind === "land" && l.depth >= c.depth - 1e-7).toBe(true); // a tie within 0.1 µm may name the smaller id
      }
    }
    expect(map.landing((IX - 41) * M, IZ * M)).toEqual({ kind: "uncovered" });
    expect(map.layersNear((IX - 40.4) * M, IZ * M)).toBeNull(); // the nearest sample is 0.4 mm away, but the place is outside the region
    expect(map.layersNear((IX - 38.1) * M, IZ * M)!.piece).toEqual(map.pieceLayers(0, 10)); // 1.9 mm from sample 0: the nearest
    expect(map.layersNear((IX - 41) * M, IZ * M)).toBeNull();
  });
});

/** a rigid motion: R about (1, 2, 3)/√14 by 0.7 rad, then T */
const axis = [1 / Math.sqrt(14), 2 / Math.sqrt(14), 3 / Math.sqrt(14)];
const ca = Math.cos(0.7), sa = Math.sin(0.7);
const rot = (p: readonly number[]): Vec3 => {
  const [x, y, z] = [p[0]!, p[1]!, p[2]!], [kx, ky, kz] = axis as [number, number, number];
  const d = kx * x + ky * y + kz * z;
  const c: Vec3 = [ky * z - kz * y, kz * x - kx * z, kx * y - ky * x];
  return [x * ca + c[0] * sa + kx * d * (1 - ca), y * ca + c[1] * sa + ky * d * (1 - ca), z * ca + c[2] * sa + kz * d * (1 - ca)];
};
const T: Vec3 = [0.31, -0.17, 0.05];
const move = (p: readonly number[]): Vec3 => { const r = rot(p); return [r[0] + T[0], r[1] + T[1], r[2] + T[2]]; };
const dump = (m: LandingMap) => {
  const out: unknown[] = [];
  for (let i = 0; i < m.nu; i++) for (let j = 0; j < m.nv; j++) out.push([m.partsLayers(i, j), m.pieceLayers(i, j), m.landingSample(i, j)]);
  return out;
};

describe("⭐⭐ S1 — INVARIANCE: a rigid motion; every order of the parts and of the held pieces", () => {
  const shapes: [string, Part[]][] = [
    ["L26 countersink (prisms)", library().find((s) => s.name === "L26")!.parts],
    ["L46 knife", library().find((s) => s.name === "L46")!.parts],
    ["Q07 slot under a slab", library().find((s) => s.name === "Q07")!.parts],
    ["L39 studs", library().find((s) => s.name === "L39")!.parts],
  ];
  const held = (): Vec3[][] => {
    const body: Vec3[] = [], peg: Vec3[] = [];
    for (const x of [-20, 20]) for (const y of [0, 20]) for (const z of [-20, 20]) body.push([x * M, y * M, z * M]);
    for (const x of [-5, 5]) for (const y of [-30, 0]) for (const z of [30, 40]) peg.push([x * M, y * M, z * M]);
    return [body, peg];
  };
  for (const [name, parts] of shapes) {
    const frame = frameOf(TOP_F, -130, 130, -130, 130);
    const base0 = buildLandingMap(toConvex(parts), held(), frame, 8);
    it(`${name}: moved and turned (the parts, the held piece's turn, the frame) — the same map in its own frame, to 1e-9 m`, () => {
      const placed = toConvex(parts).map((p) => ({ id: p.id, points: p.points.map(move) }));
      const h = held().map((pts) => pts.map(rot));
      const f = { ...frame, origin: move(frame.origin), u: rot(frame.u), v: rot(frame.v), n: rot(frame.n) };
      const moved = buildLandingMap(placed, h, f, 8);
      let layers = 0;
      for (let i = 0; i < base0.nu; i++) for (let j = 0; j < base0.nv; j++) {
        for (const get of [(m: LandingMap) => m.partsLayers(i, j), (m: LandingMap) => m.pieceLayers(i, j)]) {
          const a = get(base0), b = get(moved);
          expect(b.length, `${name} (${i}, ${j})`).toBe(a.length);
          a.forEach((x, k) => {
            expect(Math.abs(b[k]!.top - x.top)).toBeLessThanOrEqual(TOL_M);
            expect(Math.abs(b[k]!.bottom - x.bottom)).toBeLessThanOrEqual(TOL_M);
            expect(b[k]!.part).toBe(x.part);
            layers++;
          });
        }
      }
      expect(layers).toBeGreaterThan(base0.nu * base0.nv);
    });
    it(`${name}: every order of its parts and of the held pieces — the same map BIT FOR BIT`, () => {
      const ref = JSON.stringify(dump(base0));
      const cv = toConvex(parts);
      let s = 7;
      const shuffled = [...cv].sort(() => ((s = (s * 16807) % 2147483647) % 3) - 1);
      for (const order of [[...cv].reverse(), shuffled]) expect(JSON.stringify(dump(buildLandingMap(order, held(), frame, 8)))).toBe(ref);
      expect(JSON.stringify(dump(buildLandingMap(cv, held().reverse(), frame, 8)))).toBe(ref);
    });
  }
});

// ── ⭐ (2026-11-23 night — `ORBIT_SURFACE.md` §5.3: *"still to add: a round hole in one face (C19), a 12-sided cylinder and a dome (C15, C38), … long
// flat shapes (C22), … facets other than the top and the front"*) the specification's missing shapes, each against the brute force, sample for sample ──
const R6 = (deg: number) => (deg * Math.PI) / 180;
/** a ROUND HOLE through the block's top (radius r, a 24-gon, centred at (cx, cz), `depth` deep): 24 convex wedges — each the sector between two
 * of its chords' rays, cut by the chord, bounded by the block's square */
function roundHole(r: number, cx: number, cz: number, depth: number): Part[] {
  const N = 24, B = 240, y0 = 240 - depth;
  const parts: Part[] = withVoids([]).length === 1 && depth < 240 ? [bx("floor", -B, B, 0, y0, -B, B)] : [];
  const ray = (a: number): [number, number] => {
    const dx = Math.cos(a), dz = Math.sin(a);
    const t = Math.min(dx !== 0 ? (dx > 0 ? (B - cx) / dx : (-B - cx) / dx) : Infinity, dz !== 0 ? (dz > 0 ? (B - cz) / dz : (-B - cz) / dz) : Infinity);
    return [cx + dx * t, cz + dz * t];
  };
  for (let k = 0; k < N; k++) {
    const a0 = (2 * Math.PI * k) / N, a1 = (2 * Math.PI * (k + 1)) / N;
    const poly: [number, number][] = [[cx + r * Math.cos(a0), cz + r * Math.sin(a0)], [cx + r * Math.cos(a1), cz + r * Math.sin(a1)], ray(a1)];
    for (const [qx, qz] of [[B, B], [-B, B], [-B, -B], [B, -B]] as const) {
      const aq = (Math.atan2(qz - cz, qx - cx) + 2 * Math.PI) % (2 * Math.PI);
      if (aq > a0 && aq < a1) poly.push([qx, qz]);
    }
    poly.push(ray(a0));
    parts.push(hullPart(`w${String(k).padStart(2, "0")}`, poly.flatMap(([x, z]): [number, number, number][] => [[x, y0, z], [x, 240, z]])));
  }
  return parts;
}
/** a 12-sided CYLINDER lying along x on the block's top (radius r, centred at z = cz), a face up */
const cylinder12 = (r: number, cz: number): Part => {
  const pts: [number, number, number][] = [];
  for (let k = 0; k < 12; k++) {
    const a = R6(15 + 30 * k); // a face up: vertices at ±15° off the vertical
    for (const x of [-120, 120]) pts.push([x, 240 + r + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return hullPart("cyl", pts);
};
/** a DOME on the block's top: the upper half of a sphere (radius r, at (cx, cz)), its points every 22.5° — a convex polyhedron */
const dome = (r: number, cx: number, cz: number): Part => {
  const pts: [number, number, number][] = [];
  for (let el = 0; el <= 90; el += 22.5) for (let az = 0; az < 360; az += 22.5) pts.push([cx + r * Math.cos(R6(el)) * Math.cos(R6(az)), 240 + r * Math.sin(R6(el)), cz + r * Math.cos(R6(el)) * Math.sin(R6(az))]);
  return hullPart("dome", pts);
};
/** compare the map with the brute force over a frame's every sample (pieces A and B) — the places and the 'nothing's counted */
function againstBrute(E: Engine, parts: Part[], f: { n: [number, number, number]; t: [number, number, number]; b: [number, number, number] }, u0: number, u1: number, v0: number, v1: number) {
  let places = 0, nothing = 0;
  // the brute force's own convention — its footprint shrunk by 1e-4 mm, so on a slope its level drops by 1e-4 mm × the slope: the bound from THIS shape's
  // steepest facet facing the frame (a fixed knife's 85 / 15 was the library's; a dome's hull triangles are steeper)
  let maxTan = 0;
  for (const pt of parts) for (const pl of pt.planes) {
    const c = pl.n[0] * f.n[0] + pl.n[1] * f.n[1] + pl.n[2] * f.n[2];
    if (c >= 0.1) maxTan = Math.max(maxTan, Math.sqrt(Math.max(0, 1 - c * c)) / c);
  }
  // (its footprint shrinks along BOTH its axes: a CORNER moves 1e-4 · √2 along its diagonal — the dome's band, slope 5.03, read 7.1e-4 mm: exactly that)
  const SHRINK = maxTan * Math.SQRT2 * 1e-4 * M + TOL_M;
  for (const pc of [PIECE_A, PIECE_B]) {
    const map = mapOn(E, toConvex(parts), [boxHeld(pc, f)], frameOf(f, u0, u1, v0, v1), 8);
    for (let i = 0; i < map.nu; i++)
      for (let j = 0; j < map.nv; j++) {
        const l = map.landingSample(i, j), L = map.uAt(i) / M, sv = map.vAt(j) / M;
        const br = bruteLanding(parts, f.n, f.t, f.b, L, sv, pc);
        places++;
        if (br.nothing) {
          nothing++;
          expect(l.kind, `${pc.name} (${L}, ${sv})`).toBe("nothing");
          continue;
        }
        expect(l.kind, `${pc.name} (${L}, ${sv})`).toBe("land");
        const d = (l as { depth: number }).depth - br.level * M;
        expect(d, `${pc.name} (${L}, ${sv})`).toBeGreaterThanOrEqual(-TOL_M);
        expect(d, `${pc.name} (${L}, ${sv})`).toBeLessThanOrEqual(Math.max(SHRINK, OPEN_SHRINK_M));
      }
  }
  return { places, nothing };
}

for (const E of ENGINES) describe(`⭐⭐ §5.3 [${E}] — the specification's missing shapes, each against the brute force`, () => {
  it("C19 — a ROUND HOLE through the top (ø 70, 24 convex wedges): nothing to land on where a piece fits inside it, the rim where it does not", () => {
    const r = againstBrute(E, roundHole(35, 0, 0, 240), TOP_F, -120, 120, -120, 120);
    expect(r.places).toBeGreaterThan(1000);
    expect(r.nothing).toBeGreaterThan(0);
  });
  it("C19 — a round BLIND hole (ø 70, 40 deep): its floor where a piece fits, the rim elsewhere — never nothing", () => {
    const r = againstBrute(E, roundHole(35, 0, 0, 40), TOP_F, -120, 120, -120, 120);
    expect(r.nothing).toBe(0);
  });
  it("C15 — a 12-sided CYLINDER lying on the top (r 40), read from the top and from the FRONT", () => {
    const parts = [...base(), cylinder12(40, 0)];
    expect(againstBrute(E, parts, TOP_F, -160, 160, -120, 120).places).toBeGreaterThan(1000);
    expect(againstBrute(E, parts, { n: [0, 0, 1], t: [-1, 0, 0], b: [0, 1, 0] }, -160, 160, 150, 360).places).toBeGreaterThan(1000);
  });
  it("C38 — a DOME on the top (r 60): every slanted facet of a doubly curved shape", () => expect(againstBrute(E, [...base(), dome(60, 30, -20)], TOP_F, -140, 140, -140, 140).places).toBeGreaterThan(1000));
  it("C22 — a long THIN BAR (400 × 8 × 20) on the top, narrower than either piece", () => expect(againstBrute(E, [...base(), bx("bar", -200, 200, 240, 260, -4, 4)], TOP_F, -220, 220, -60, 60).places).toBeGreaterThan(1000));
  it("C16 — a FAN: a pyramid's four faces meeting at its APEX (base 120, apex 60 up, off centre)", () => {
    expect(againstBrute(E, [...base(), hullPart("pyr", [[-60, 240, -60], [60, 240, -60], [60, 240, 60], [-60, 240, 60], [20, 300, -10]])], TOP_F, -120, 120, -120, 120).places).toBeGreaterThan(1000);
  });
  it("C20 — the FLOOR beyond the block's edge: a thin slab under everything, read past the block's side — the floor where the piece clears the block", () => {
    const r = againstBrute(E, [bx("floor", -480, 480, -10, 0, -480, 480), ...base()], TOP_F, 160, 340, -60, 60);
    expect(r.nothing).toBe(0);
  });
  it("a NARROWING profile: a V trench in the top (two wedge prisms, 80 wide at its mouth, 60 deep) — the piece held up by its walls where it is wider", () => {
    const wedge = (id: string, sx: number) => hullPart(id, [[sx * 240, 180, -240], [sx * 240, 240, -240], [sx * 40, 240, -240], [0, 180, -240], [sx * 240, 180, 240], [sx * 240, 240, 240], [sx * 40, 240, 240], [0, 180, 240]]);
    expect(againstBrute(E, [bx("under", -240, 240, 0, 180, -240, 240), wedge("vL", -1), wedge("vR", 1)], TOP_F, -120, 120, -60, 60).places).toBe(992); // 31 × 16 samples, two pieces
  });
  it("⭐ an OBLIQUE facet (its normal 30° off the vertical, toward +z) over the cylinder and a pin — a frame neither the top nor the front", () => {
    const c = Math.cos(R6(30)), sn = Math.sin(R6(30));
    const f = { n: [0, c, sn] as [number, number, number], t: [1, 0, 0] as [number, number, number], b: [0, -sn, c] as [number, number, number] };
    expect(againstBrute(E, [...base(), cylinder12(40, 0), bx("pin", 60, 70, 240, 280, 40, 50)], f, -160, 160, -140, 140).places).toBeGreaterThan(1000);
  });
});

// ── ⭐ (2026-11-24, S12 — `ORBIT_SURFACE.md` §5.3: *"still to add: `void_sim`'s families"*) the void study's nine families (`scripts/probes/void_sim.ts`,
// POLAR_ORBIT_CLEANUP.md §7: a plate's top cut by blind recesses, through holes, grooves, slots, a U-slot, notches, rebates, an L, an undercut) on the
// study's block (its top at 240, the plate's centre at 0), each against the brute force, sample for sample, pieces A and B ──
for (const E of ENGINES) describe(`⭐⭐ S12 [${E}] — \`void_sim\`'s families A – I, each against the brute force`, () => {
  const fam: [string, Part[], [number, number, number, number]][] = [
    ["A a blind recess 40 × 40, 60 deep", withVoids([vd(-20, 20, -20, 20, 60)]), [-100, 100, -100, 100]],
    ["A a blind recess 13 × 13, 10 deep", withVoids([vd(-6.5, 6.5, -6.5, 6.5, 10)]), [-80, 80, -80, 80]],
    ["B a through hole 40 × 40", withVoids([vd(-20, 20, -20, 20, 240)]), [-100, 100, -100, 100]],
    ["C a groove 40 wide, 60 deep, the whole face long", withVoids([vd(-20, 20, -240, 240, 60)]), [-100, 100, -120, 120]],
    ["D a through slot 13 wide, 200 long", withVoids([vd(-6.5, 6.5, -100, 100, 240)]), [-80, 80, -140, 140]],
    ["E a U-slot 40 wide, 60 deep, from the edge", withVoids([vd(-20, 20, -240, 0, 60)]), [-100, 100, -280, 60]],
    ["F a corner notch 50 × 50, 60 deep", withVoids([vd(-240, -190, -240, -190, 60)]), [-280, -120, -280, -120]],
    ["G a rebate 50 wide, 60 deep, along a whole edge", withVoids([vd(-240, 240, -240, -190, 60)]), [-120, 120, -280, -120]],
    ["H an L-shaped recess, arms 40 wide, 40 deep", withVoids([vd(-50, 50, -50, -10, 40), vd(-50, -10, -10, 50, 40)]), [-110, 110, -110, 110]],
    ["I an undercut: a mouth 20 wide, a cavity 60 wide below", withVoids([vd(-10, 10, -50, 50, 20), vd(-30, 30, -50, 50, 40, 220)]), [-90, 90, -100, 100]],
  ];
  for (const [name, parts, [u0, u1, v0, v1]] of fam) it(name, () => expect(againstBrute(E, parts, TOP_F, u0, u1, v0, v1).places).toBeGreaterThan(200));
});

describe("⭐ S10 — C2: the size of a preparation, machine-free (`sumsSize`)", () => {
  const box = (id: string, x: number): { id: string; points: Vec3[] } => ({ id, points: [0, 1, 2, 3, 4, 5, 6, 7].map((m): Vec3 => [x + (m & 1 ? 0.1 : 0), m & 2 ? 0.02 : 0, m & 4 ? 0.1 : 0]) });
  const heldBox = (turnDeg: number): Vec3[][] => {
    const c = Math.cos((turnDeg * Math.PI) / 180), s = Math.sin((turnDeg * Math.PI) / 180);
    return [[0, 1, 2, 3, 4, 5, 6, 7].map((m): Vec3 => { const x = m & 1 ? 0.01 : -0.01, z = m & 4 ? 0.01 : -0.01; return [c * x + s * z, m & 2 ? 0.01 : 0, -s * x + c * z]; })];
  };
  it("two placed boxes × a held box: 2 sums; aligned, each a box (6 half-spaces); the held box turned 45°, each an octagonal prism (10)", () => {
    const pp = preparePlaced([box("A", 0), box("B", 0.3)]);
    expect(sumsSize(heldSumsOn(pp, heldBox(0)))).toEqual({ sums: 2, halfSpaces: 12 });
    expect(sumsSize(heldSumsOn(pp, heldBox(45)))).toEqual({ sums: 2, halfSpaces: 20 });
  });
});
