/**
 * ⭐⭐⭐ (2026-11-24, package S14 — `ORBIT_SURFACE_LANDING_CAST.md` §6 item 3, §9) THE CAST — P2's landing read at query time (`src/core/landing_cast.ts`)
 * against today's sums (`landing_map.ts`, LIVE): V1 the cross-engine agreement on `Scene_1` (its placed boxes × the green piece, as `cost_when.ts`
 * builds them — as held and TURNED); V2 on `Scene_2`'s stages 3, 9, 13, 16 (the `.glb`, the part placed next held as held) — kinds and parts
 * identical, the depth within `TOUCH_M` (`Scene_1`: within 1e-9 m, the gate's); queries ON pair rectangle edges (flush, ± 10 nm, ± 1 µm) and from
 * `F` (through the stack, and the drive's case); V3 the chain above `F`; V4 `top` and the refused, bit for bit; V5 a turn's hulls re-read by index;
 * V6 the switch and the wiring — at `landingEngine` 1 `heldSumsOn` NEVER runs. S1's and S12's vectors run on both engines in `landing_map.test.ts`.
 * Each shown RED on its mutant first (the design's §9: the list and how).
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { SCENE_1, SCENE_1_FINAL } from "../src/content/scene_1";
import { apply, glbBin, partGeometry } from "../src/core/glb_geometry";
import { castHeldHulls, castHeldOn, castPlacedOn, landingCast, prepareLandingCast } from "../src/core/landing_cast";
import * as LM from "../src/core/landing_map";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { qFromAxisAngle, type Quat, type Vec3 } from "../src/core/vec";
import type { FaceMap } from "../src/input/face_map";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { driveGizmoLanding, driveKey, driveSupport, landingDriveFrame } from "../src/render/landing_drive";
import { castLandingFor, heldCastFor, landingReadoutFrame, type GizmoRead, type ReadoutSource } from "../src/render/landing_readout";
import type { SceneState } from "../src/render/scene_state";
import { bx, toConvex } from "./helpers/surface_shapes";

// ⭐ (V6) `heldSumsOn` watched where the game imports it (the readout's shared preparation): called through, counted
vi.mock("../src/core/landing_map", async (orig) => {
  const m = await orig<typeof import("../src/core/landing_map")>();
  return { ...m, heldSumsOn: vi.fn(m.heldSumsOn) };
});

const { heldSumsOn, landingFor, preparePlaced, TOUCH_M } = LM;
type V3 = [number, number, number];
const M = 0.001;

// ── the sets (`cost_when.ts`'s): Scene_1's placed boxes × the green piece; Scene_2's stages
const unit = SCENE_1.unitM!;
const goal = new Map(SCENE_1_FINAL.bodies.map((b) => [b.id, b.position]));
const SCENE1: LM.ConvexPiece[] = SCENE_1.bodies
  .filter((b) => !b.frozen && b.topScale === 1 && b.prismSides === undefined && b.orientation === "identity" && JSON.stringify(goal.get(b.id)) === JSON.stringify(b.position))
  .map((b) => {
    const h = b.dims.map((d) => (d / 2 + (b.margin ?? 0)) * unit);
    const c = b.position.map((x) => x * unit);
    const pts: Vec3[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push([c[0]! + sx * h[0]!, c[1]! + sy * h[1]!, c[2]! + sz * h[2]!]);
    return { id: b.id, points: pts };
  });
const GREEN: Vec3[] = [];
for (const x of [-20.65, 20.65]) for (const y of [0, 48]) for (const z of [-22.5, 22.5]) GREEN.push([x * M, y * M, z * M]);
/** a rigid turn: 0.7 rad about (1, 2, 3)/√14 (Rodrigues) — the held pieces as an alignment's slerp leaves them, every facet of the sum slanted */
const rot = (p: Vec3): Vec3 => {
  const k = [1 / Math.sqrt(14), 2 / Math.sqrt(14), 3 / Math.sqrt(14)] as const, ca = Math.cos(0.7), sa = Math.sin(0.7);
  const d = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
  const c = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]] as const;
  return [p[0] * ca + c[0] * sa + k[0] * d * (1 - ca), p[1] * ca + c[1] * sa + k[1] * d * (1 - ca), p[2] * ca + c[2] * sa + k[2] * d * (1 - ca)];
};

// ── the directions: the six axes and two slanted (the study's §4)
const norm = (a: V3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const slanted = (n: Vec3): LM.LandingAxes => {
  const a: Vec3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm([a[1] * n[2] - a[2] * n[1], a[2] * n[0] - a[0] * n[2], a[0] * n[1] - a[1] * n[0]]);
  return { origin: [0, 0, 0], u, v: [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]], n };
};
const AX = (n: Vec3, u: Vec3, v: Vec3): LM.LandingAxes => ({ origin: [0, 0, 0], u, v, n });
const TOP = AX([0, 1, 0], [1, 0, 0], [0, 0, -1]);
const FRAMES: LM.LandingAxes[] = [
  TOP,
  AX([0, -1, 0], [1, 0, 0], [0, 0, 1]),
  AX([1, 0, 0], [0, 1, 0], [0, 0, 1]),
  AX([-1, 0, 0], [0, 1, 0], [0, 0, -1]),
  AX([0, 0, 1], [1, 0, 0], [0, 1, 0]),
  AX([0, 0, -1], [1, 0, 0], [0, -1, 0]),
  slanted(norm([1, 1, 0])),
  slanted(norm([0.3, 0.9, 0.3])),
];

/** ⭐ THE AGREEMENT: the sums against the cast over `frames`, `n` queries a direction and a mode (a quarter ON a pair's rectangle edge: flush,
 *  ± 10 nm, ± 1 µm; half from F — through the stack, or `near` (each mode's flag): 0 – 20 mm above the landing, the drive's case); `like`: the
 *  cast's hulls re-read from these. One preparation of the sums for every mode (their cost, not the queries', is the vectors' time) */
function agreement(placed: readonly LM.ConvexPiece[], held: readonly (readonly Vec3[])[], frames: readonly LM.LandingAxes[], n: number, nears: readonly boolean[], like?: ReturnType<typeof castHeldHulls>) {
  const pp = preparePlaced(placed);
  const sums = heldSumsOn(pp, held);
  const hh = castHeldHulls(held, like);
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const out = { near: nears.every((x) => x), queries: 0, edges: 0, kinds: 0, parts: 0, maxD: 0, top: 0, refused: 0, seen: { land: 0, inside: 0, nothing: 0 } as Record<string, number>, first: "" };
  for (const f of frames) {
    const old = landingFor(sums, f);
    const pl = castPlacedOn(pp, f), hd = castHeldOn(hh, f);
    const cast = landingCast(pl, hh, hd);
    if (cast.top !== old.top) out.top++;
    if (JSON.stringify(cast.refused) !== JSON.stringify(old.refused)) out.refused++;
    let uL = Infinity, uH = -Infinity, vL = Infinity, vH = -Infinity, nL = Infinity, nH = -Infinity;
    for (const p of pl.pieces) (uL = Math.min(uL, p.box[0]!)), (vL = Math.min(vL, p.box[1]!)), (nL = Math.min(nL, p.box[2]!)), (uH = Math.max(uH, p.box[3]!)), (vH = Math.max(vH, p.box[4]!)), (nH = Math.max(nH, p.box[5]!));
    for (const near of nears) for (let q = 0; q < n; q++) {
      let U = uL - 0.03 + rnd() * (uH - uL + 0.06), V = vL - 0.03 + rnd() * (vH - vL + 0.06);
      if (q % 4 === 0) {
        const pb = pl.pieces[Math.floor(rnd() * pl.pieces.length)]!.box, hb = hd.pieces[Math.floor(rnd() * hd.pieces.length)]!.box;
        const jit = [0, 1e-8, -1e-8, 1e-6, -1e-6][Math.floor(rnd() * 5)]!;
        if (rnd() < 0.5) U = (rnd() < 0.5 ? pb[0]! - hb[3]! : pb[3]! - hb[0]!) + jit;
        else V = (rnd() < 0.5 ? pb[1]! - hb[4]! : pb[4]! - hb[1]!) + jit;
        out.edges++;
      }
      let from = q % 2 === 0 ? undefined : nL - 0.01 + rnd() * (nH - nL + 0.02);
      if (from !== undefined && near) {
        const o = old.landingAt(U, V);
        from = o.kind === "land" ? o.depth + rnd() * 0.02 : nH + 0.01;
      }
      const a = old.landingAt(U, V, from), b = cast.landingAt(U, V, from);
      out.queries++;
      out.seen[a.kind] = (out.seen[a.kind] ?? 0) + 1;
      const was = out.kinds + out.parts;
      if (a.kind !== b.kind) out.kinds++;
      else if ((a.kind === "land" || a.kind === "inside") && a.part !== (b as { part: string }).part) out.parts++;
      else if (a.kind === "land" && b.kind === "land") out.maxD = Math.max(out.maxD, Math.abs(a.depth - b.depth));
      if (out.kinds + out.parts > was && out.first === "") out.first = `n=${f.n.join(",")} U=${U} V=${V} from=${from} sums=${JSON.stringify(a)} cast=${JSON.stringify(b)}`;
    }
  }
  return out;
}
const expectSame = (r: ReturnType<typeof agreement>, depthWithin: number) => {
  expect(r.first, "the first query that differs").toBe("");
  expect(r.kinds).toBe(0);
  expect(r.parts).toBe(0);
  expect(r.maxD).toBeLessThanOrEqual(depthWithin);
  expect(r.top).toBe(0);
  expect(r.refused).toBe(0);
  // not vacuous: every kind met (from just above the landing, never inside), the edges asked
  for (const k of r.near ? ["land", "nothing"] : ["land", "inside", "nothing"]) expect(r.seen[k], k).toBeGreaterThan(0);
  expect(r.edges).toBeGreaterThan(r.queries / 5);
};

describe("⭐⭐⭐ V1 — the cross-engine agreement on `Scene_1` (36 placed boxes × the green piece): kinds, parts identical; depths within 1e-9 m (the gate's)", () => {
  it("as held — 8 directions × 300 queries, F through the stack, then near the landing (the drive's case)", () => expectSame(agreement(SCENE1, [GREEN], FRAMES, 300, [false, true]), 1e-9));
  it("TURNED (an alignment's slerp: every facet of the sums slanted) — the cast's hulls re-read by index from the piece as held", () => {
    expectSame(agreement(SCENE1, [GREEN.map(rot)], FRAMES, 300, [false, true], castHeldHulls([GREEN])), 1e-9);
  });
});

// ── Scene_2's stages (the .glb, read as `cost_when.ts` reads it)
const bytes = new Uint8Array(readFileSync(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url)));
const j = glbJson(bytes);
if (!("json" in j)) throw new Error("the Scene_2 .glb is not read");
const catalog = readModelCatalog(j.json).catalog!;
const geo = partGeometry(j.json, glbBin(bytes), catalog);
const piecesAt = new Map(geo.map((g) => [g.id, g.pieces.map((pts): LM.ConvexPiece => ({ id: g.id, points: pts.map((p) => { const w = apply(g.goal, p); return [w[0] * catalog.unitM, w[1] * catalog.unitM, w[2] * catalog.unitM] as Vec3; }) }))] as const));
const own = new Map(geo.map((g) => [g.id, g.pieces.map((pts) => pts.map((p) => [p[0] * catalog.unitM, p[1] * catalog.unitM, p[2] * catalog.unitM] as Vec3))] as const));
const order = [...catalog.parts.filter((p) => p.frozen), ...catalog.parts.filter((p) => !p.frozen)].map((p) => p.id);
const stage = (s: number) => ({ placed: order.slice(0, s).flatMap((id) => piecesAt.get(id)!), held: own.get(order[s]!)! });

describe("⭐⭐⭐ V2 — the cross-engine agreement on `Scene_2`'s stages (the part placed next held as held): kinds, parts identical; depths within TOUCH", () => {
  it("stage 3 (16 × 14) and stage 9 (61 × 2): 8 directions × 100 queries, F through the stack, and TURNED", () => {
    for (const s of [2, 8]) {
      const { placed, held } = stage(s);
      expectSame(agreement(placed, held, FRAMES, 100, [false]), TOUCH_M);
      expectSame(agreement(placed, held.map((p) => p.map(rot)), FRAMES, 100, [true], castHeldHulls(held)), TOUCH_M);
    }
  });
  it("stage 13 (69 × 15) and stage 16 (115 × 16): the top, a side, a slant × 120 queries, F through the stack and near the landing", () => {
    for (const s of [12, 15]) {
      const { placed, held } = stage(s);
      const frames = [TOP, FRAMES[2]!, FRAMES[7]!];
      expectSame(agreement(placed, held, frames, 120, [false, true]), TOUCH_M);
    }
  });
});

describe("⭐⭐ V3 — the CHAIN ABOVE F: inside a stretch, the merged layer's top (and its part) may rise through pairs wholly above F", () => {
  // two boxes stacked (one layer, 0 – 200 mm), the held piece 10 mm tall: from F = 50 mm the piece is inside the lower box — the layer's part is
  // its TOP's, the upper box's, though no pair above F reaches down to F
  const stack = toConvex([bx("lower", -100, 100, 0, 100, -100, 100), bx("upper", -100, 100, 100, 200, -100, 100)]);
  const held: Vec3[][] = [[0, 1, 2, 3, 4, 5, 6, 7].map((m): Vec3 => [(m & 1 ? 10 : -10) * M, (m & 2 ? 10 : 0) * M, (m & 4 ? 10 : -10) * M])];
  for (const [name, prep] of [["the sums", LM.prepareLanding], ["the cast", prepareLandingCast]] as const)
    it(`${name}: from 50 mm inside, its part the upper box's; from 150 mm the same; from above, its top`, () => {
      const p = prep(stack, held, TOP);
      expect(p.landingAt(0, 0, 50 * M)).toEqual({ kind: "inside", part: "upper" });
      expect(p.landingAt(0, 0, 150 * M)).toEqual({ kind: "inside", part: "upper" });
      const l = p.landingAt(0, 0, 250 * M);
      expect(l.kind === "land" && Math.abs(l.depth - 0.2) < 1e-12 && l.part === "upper").toBe(true);
    });
});

describe("⭐⭐ V4 — `top` (the sections' key) and the refused, bit for bit with `landingFor`", () => {
  it("over the 8 directions, `Scene_1` as held and turned; a flat placed piece and a flat held piece left out and named", () => {
    const flat = { id: "Flat", points: [[0, 0.2, 0], [0.01, 0.2, 0], [0, 0.2, 0.01], [0.01, 0.2, 0.01]] as Vec3[] };
    for (const held of [[GREEN], [GREEN.map(rot), [[0, 0, 0], [0.01, 0, 0], [0, 0.01, 0]] as Vec3[]]]) {
      const sums = heldSumsOn(preparePlaced([...SCENE1, flat]), held);
      for (const f of FRAMES) {
        const a = landingFor(sums, f), b = prepareLandingCast([...SCENE1, flat], held, f);
        expect(b.top).toBe(a.top);
        expect(b.refused).toEqual(a.refused);
      }
    }
    expect(prepareLandingCast([...SCENE1, flat], [GREEN, [[0, 0, 0], [0.01, 0, 0], [0, 0.01, 0]]], TOP).refused).toEqual(["Flat", "held#1"]);
    // no held piece with a volume: nothing to land on, no top
    const none = prepareLandingCast(SCENE1, [[[0, 0, 0], [0.01, 0, 0], [0, 0.01, 0]]], TOP);
    expect(none.top).toBe(-Infinity);
    expect(none.landingAt(0, 0)).toEqual({ kind: "nothing" });
  });
});

describe("⭐⭐ V5 — a TURN re-reads the held hulls by index (`castHeldHulls`' `like`): no hull computed, the same answers", () => {
  it("the turned piece through `like` = the turned piece hulled afresh, at every query; another shape → hulled afresh", () => {
    const h0 = castHeldHulls([GREEN]);
    const turned = [GREEN.map(rot)];
    const a = castHeldHulls(turned, h0), b = castHeldHulls(turned);
    expect(a.index).toBe(h0.index); // re-read, not recomputed
    expect(a.hulls[0]!.length).toBe(b.hulls[0]!.length);
    for (const f of [TOP, FRAMES[7]!]) {
      const pl = castPlacedOn(preparePlaced(SCENE1), f);
      const la = landingCast(pl, a, castHeldOn(a, f)), lb = landingCast(pl, b, castHeldOn(b, f));
      for (let k = 0; k < 200; k++) {
        const U = -0.3 + (k * 0.37) % 0.6, V = -0.3 + (k * 0.61) % 0.6;
        const x = la.landingAt(U, V), y = lb.landingAt(U, V);
        expect(x.kind).toBe(y.kind);
        if (x.kind === "land" && y.kind === "land") expect(Math.abs(x.depth - y.depth)).toBeLessThanOrEqual(1e-12);
      }
    }
    // another shape (another count of points): hulled afresh, its own indices
    const other = castHeldHulls([[...GREEN, [0, 0.05, 0]]], h0);
    expect(other.index).not.toBe(h0.index);
  });
});

describe("⭐⭐⭐ V6 — the switch `landingEngine`, the wiring: at 1 the cast, and `heldSumsOn` NEVER runs", () => {
  it("`landingEngine`: default 0 (the sums, LIVE); 0, 1 valid, 2 refused", () => {
    expect(DEFAULT_CONFIG.landingEngine).toBe(0);
    for (const v of [0, 1]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, landingEngine: v })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, landingEngine: 2 })).toThrow(/landingEngine/);
  });
  it("the menu: the slider in THE ORBIT'S SURFACE, next to P2 drives", () => {
    const m = readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8");
    expect(m).toContain('tunable(st, "P2 engine (0 = the sums, LIVE; 1 = the cast)", "landingEngine", 0, 1, 1),');
    expect(m.indexOf('"landingEngine", 0, 1, 1)')).toBeGreaterThan(m.indexOf('"landingDrives", 0, 2, 1)'));
  });

  // the drive's stub (`landing_drive.test.ts` V5's) and the readout's (`landing_readout_switch.test.ts` V4b's), on one placed set
  const PROUD = toConvex([bx("H", -200, 200, 0, 100, -100, 100), bx("P", 0, 60, 100, 141, -40, 40)]);
  const UP: Vec3 = [0, 1, 0];
  const RC: Vec3 = [0, 0, 0];
  const stub = (engine: number, q: Quat) => {
    const greenBox = { name: "g" };
    const objects = new Map<string, unknown>([["g", { id: "g", parent: null, local: { position: [0, 0.2, 0], orientation: q }, shape: { points: GREEN } }]]);
    return {
      cfg: { landingDrives: 2, landingReadout: 1, landingEngine: engine }, landingDrive: null, landing: null, greenBox, world: { objects },
      orbitPieces: [{ mesh: greenBox, restingCentre: RC }], orbitPiecePlaced: false, frames: 5, sceneSpec: { id: "Scene_1" },
      pieceHoldPrev: { anchor: [-10 * M, 110 * M, 0], approach: 0 }, asmShown: { t: { normal: UP }, yaw: 0, pitch: 0 },
    } as unknown as SceneState;
  };
  const MAP = { facets: [{ n: [0, 1, 0], t: [1, 0, 0], b: [0, 0, 1] }, { n: [1, 0, 0], t: [0, 0, -1], b: [0, 1, 0] }] } as unknown as FaceMap;
  const parts = { key: "H|P", parts: PROUD.map((p) => p.points), ids: PROUD.map((p) => p.id) };
  const src: ReadoutSource = { map: () => MAP, frame: () => null, placed: () => parts };
  const at = (x: number, stack = 0, n: Vec3 = UP): GizmoRead => ({ hit: { point: [x * M, 100 * M, 0] }, t: { stack, normal: n, surface: [x * M, 100 * M, 0] } });
  /** a frame of the game at `engine`: the drive (the gizmo on two faces, the support, the lines' key) and the readout (two facets) */
  const play = (engine: number, q: Quat) => {
    const st = stub(engine, q);
    landingDriveFrame(st, src);
    const out = [
      driveGizmoLanding(st, UP, [-10 * M, 0, 0]),
      driveGizmoLanding(st, UP, [-30 * M, 0, 0]),
      driveGizmoLanding(st, [0, -1, 0], [-30 * M, 0, 0]),
      driveGizmoLanding(st, [1, 0, 0], [0, 50 * M, 0]),
      driveSupport(st, UP, [-30 * M, 110 * M, 0], 0.06),
      driveSupport(st, UP, [-10 * M, 110 * M, 0], 0.06),
    ];
    landingReadoutFrame(st, at(11), at(11), src);
    const r0 = st.landing!.shown!.readout;
    landingReadoutFrame(st, at(0, 1, [1, 0, 0]), at(0, 1, [1, 0, 0]), src);
    const r1 = st.landing!.shown!.readout;
    return { st, out, r0, r1, key: driveKey(st) };
  };
  const close = (a: unknown, b: unknown): void => {
    // the same kinds and parts; every number within 1e-9 m
    const flat = (x: unknown): unknown[] => (x === null || typeof x !== "object" ? [x] : Object.entries(x as object).sort().flatMap(([k, v]) => [k, ...flat(v)]));
    const fa = flat(a), fb = flat(b);
    expect(fb.length).toBe(fa.length);
    fa.forEach((x, k) => (typeof x === "number" ? expect(Math.abs((fb[k] as number) - x)).toBeLessThanOrEqual(1e-9) : expect(fb[k]).toEqual(x)));
  };
  it("⭐ at 1 the sums are NEVER built (`heldSumsOn` not called — a pick-up, two turns, two faces, the readout's two facets); the answers the sums' within 1e-9 m", () => {
    const spy = vi.mocked(heldSumsOn);
    for (const q of [qFromAxisAngle([0, 1, 0], 0), qFromAxisAngle([0, 1, 0], 0.3), qFromAxisAngle([1, 1, 0], 0.2)]) {
      spy.mockClear();
      const one = play(1, q);
      expect(spy).not.toHaveBeenCalled();
      expect(one.st.landingDrive!.sums).toBe(null);
      expect(one.st.landingDrive!.cast).not.toBe(null);
      const zero = play(0, q);
      expect(spy).toHaveBeenCalled(); // the positive control: at 0 the sums are built, as LIVE
      expect(zero.st.landingDrive!.cast).toBe(null);
      close(one.out, zero.out);
      close([one.r0, one.r1], [zero.r0, zero.r1]);
      expect(one.key.replace(/^D\d+/, "")).toBe(zero.key.replace(/^D\d+/, "")); // the lines' key: the same reading per direction
    }
  });
  it("the cast's preparation cached on the same keys: the same held key → the same object (the held piece not read again); a turn → new held, the SAME placed hulls and hull indices", () => {
    let reads = 0;
    const held = () => (reads++, [GREEN]);
    const c1 = heldCastFor(parts, "k1", "g#1", held);
    expect(heldCastFor(parts, "k1", "g#1", held)).toBe(c1);
    expect(reads).toBe(1);
    const c2 = heldCastFor(parts, "k2", "g#1", () => [GREEN.map(rot)]);
    expect(c2).not.toBe(c1);
    expect(c2.pp).toBe(c1.pp);
    expect(c2.hulls.index).toBe(c1.hulls.index); // a turn: no hull computed
    const p = castLandingFor(c2, TOP);
    expect(castLandingFor(c2, TOP)).not.toBe(p); // a new reader object, on the cached frames:
    expect(c2.frames.size).toBe(1);
    castLandingFor(c2, FRAMES[7]!);
    expect(c2.frames.size).toBe(2);
  });
  it("the wiring, read in the source: the readout and the drive choose the engine at `landingEngine` 1, the key carries it at 1 only", () => {
    const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/\s+/g, " ");
    const r = strip(readFileSync(new URL("../src/render/landing_readout.ts", import.meta.url), "utf8"));
    expect(r).toContain("prep = cast ? castLandingFor(heldCastFor(parts, hk, `${id}#${idOf(local)}`, () => held), axes) : landingFor(heldSumsFor(parts, hk, () => held), axes);");
    expect(r).toContain('+ (cast ? "|E1" : "");');
    const d = strip(readFileSync(new URL("../src/render/landing_drive.ts", import.meta.url), "utf8"));
    expect(d).toContain("if (engine) (s.sums = null), (s.cast = heldCastFor(parts, hk, `${id}#${idOf(local)}`, () => held)); else (s.cast = null), (s.sums = heldSumsFor(parts, key, () => held));");
    expect(d).toContain("const prep = s.cast !== null ? castLandingFor(s.cast, landingAxes(n, a, b, null)) : landingFor(s.sums!, landingAxes(n, a, b, null));");
  });
});
