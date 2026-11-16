/**
 * ⛔⛔ **THE TEST SCENES — THROWAWAY** (package T1, 2026-11-16; branch `1.0.146t-Orbit-charts-test-scenes`, never merged): six test SHAPES for the
 * tilted-pole orbit's study (`TILTED_POLE_CLOSE_IN.md` §14 – §15), not game scenes. Each: `Scene_1`'s floor, lights, rig, units and play volume (as
 * `Scene_0`), one placed body (or two glued ones), the green piece, a goal on a level face. Indices `?sceneIndex=5` … `10` (appended, `worlds.ts`).
 *   T_a (5) an upright PENTAGON prism — its level top not a rectangle
 *   T_b (6) a square BIPYRAMID with a 1 mm band, laid on a triangle — the nearest `BodySpec` makes to the octahedron on a face (RINGS, `ORBIT_CHARTS.md` §6)
 *   T_c (7) a STEP — a low box against a high one
 *   T_d (8) an L-shaped level top — two boxes of one height
 *   T_e (9) a box turned 30° about the vertical
 *   T_f (10) a thin long lying heptagon bar with pointed ends (`Scene_0bis`'s kind: 2.4 × 2.4 units across, 9.6 long, tips 1.8)
 * Authored units (0.1 m), as `Scene_1`.
 */
import type { BodySpec, FinalPose, SceneDescriptor, Triple } from "../core/game_structure";
import { qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../core/vec";
import { SCENE_1 } from "./scene_1";

const UNIT_M = SCENE_1.unitM ?? 1;
const FLOOR = SCENE_1.bodies.find((b) => b.id === "Floor" && b.frozen)!;
const PIECE17 = SCENE_1.bodies.find((b) => b.id === "Piece17")!;
const { bodies: _b, final: _f, orbitGoals: _g, ...shared } = SCENE_1;
const GREY: Triple = [0.65, 0.67, 0.72];
const TAN: Triple = [0.75, 0.62, 0.45];
const ID: Quat = [1, 0, 0, 0];
const nz = <T extends readonly number[]>(v: T): T => v.map((x) => x + 0) as unknown as T;

/** the scene: its bodies (all placed, their goal where they boot), the green piece's goal at `goal` (units) with the turn `goalQ`, the orbit's centre */
function testScene(id: string, title: string, bodies: BodySpec[], goal: Vec3, goalQ: Quat, centre: Vec3): SceneDescriptor {
  const goals: FinalPose[] = [
    { id: "green-box", position: nz(goal) as unknown as Triple, orientation: { quat: goalQ }, symmetry: "yawHalfTurns" },
    { id: "turquoise-piece", position: nz(goal) as unknown as Triple, orientation: { quat: goalQ }, symmetry: "hexPrism" },
  ];
  return {
    ...shared,
    id,
    title,
    orbit: { ...SCENE_1.orbit!, centreM: [centre[0] * UNIT_M, centre[1] * UNIT_M, centre[2] * UNIT_M] },
    bodies: [...bodies, FLOOR],
    final: { frame: "ABSOLUTE", bodies: bodies.map((b) => ({ id: b.id, position: b.position, orientation: b.orientation })) },
    orbitGoals: goals,
    orbitPieceRefDims: PIECE17.dims,
  };
}
const LIFT = 0.25; // the goal's centre this far above its face (units): the piece's half height, about

// (a) the upright pentagon: the polygon in the body's x–y, extruded along its z, turned −90° about x (body z → world up)
const A_DIMS: Triple = [4.8, 4.6, 4.0];
const A_Q = nz(qFromAxisAngle([1, 0, 0], -Math.PI / 2));
const A_POS: Triple = [0, A_DIMS[2] / 2, 1.9];
export const TEST_A = testScene("Test_a", "Test a — upright pentagon prism", [
  { id: "Pentagon", position: A_POS, colour: GREY, dims: A_DIMS, orientation: { quat: A_Q }, frozen: false, topScale: 1, prismSides: 5 },
], [A_POS[0], A_DIMS[2] + LIFT, A_POS[2]], ID, A_POS);

// (b) the bipyramid: ⚠ the engine's 4-sided prism is a DIAMOND (a vertex at the top — `render/bodies.ts`' apex turn — so one at the bottom too: the
// `BodySpec.prismSides` note "one edge flat at the bottom" holds for odd sides only); its half diagonal A, apexes A out (a regular octahedron), a 1 mm
// band; turned so the triangle of outward normal (1, 1, 1)/√3 lies level at the bottom (→ (0, −1, 0))
const B_A = 1.75;
const B_TIP = B_A;
const B_BAND = 0.01;
const B_DIMS: Triple = [2 * B_A, 2 * B_A, 2 * B_TIP + B_BAND];
const B_Q = nz(qFromAxisAngle([Math.SQRT1_2, 0, -Math.SQRT1_2], Math.acos(-1 / Math.sqrt(3))));
const B_VERTS: Vec3[] = [
  ...[[1, 0], [0, 1], [-1, 0], [0, -1]].flatMap(([x, y]) => [-1, 1].map((z) => [x! * B_A, y! * B_A, (z * B_BAND) / 2] as Vec3)),
  [0, 0, B_BAND / 2 + B_TIP] as Vec3,
  [0, 0, -B_BAND / 2 - B_TIP] as Vec3,
].map((v) => qRotate(B_Q, v));
const B_LO = Math.min(...B_VERTS.map((v) => v[1]));
const B_HI = Math.max(...B_VERTS.map((v) => v[1]));
const B_POS: Triple = nz([0, -B_LO, 1.9] as Triple);
const B_TOP = B_VERTS.filter((v) => v[1] > B_HI - 0.02);
export const TEST_B = testScene("Test_b", "Test b — octahedron-like bipyramid on a face (RINGS)", [
  { id: "Bipyramid", position: B_POS, colour: GREY, dims: B_DIMS, orientation: { quat: B_Q }, frozen: false, topScale: 1, prismSides: 4, prismTip: B_TIP },
], [B_POS[0] + B_TOP.reduce((s, v) => s + v[0], 0) / B_TOP.length, B_POS[1] + B_HI + LIFT, B_POS[2] + B_TOP.reduce((s, v) => s + v[2], 0) / B_TOP.length], ID, [0, (B_HI - B_LO) / 2, 1.9]);

// (c) the step: a low box (x −4 … 0, 1.6 high) against a high one (x 0 … 2.4, 4.8 high), one depth (z −0.5 … 4.3)
export const TEST_C = testScene("Test_c", "Test c — a step (a low box against a high one)", [
  { id: "Low", position: [-2.0, 0.8, 1.9], colour: GREY, dims: [4.0, 1.6, 4.8], orientation: "identity", frozen: false, topScale: 1 },
  { id: "High", position: [1.2, 2.4, 1.9], colour: TAN, dims: [2.4, 4.8, 4.8], orientation: "identity", frozen: false, topScale: 1 },
], [-2.0, 1.6 + LIFT, 1.9], ID, [-0.8, 2.4, 1.9]);

// (d) the L-shaped top: two boxes 3.0 high — A x −2.5 … 2.5, z −0.6 … 1.9; B x −2.5 … 0, z 1.9 … 4.4
export const TEST_D = testScene("Test_d", "Test d — an L-shaped level top (two boxes of one height)", [
  { id: "LongArm", position: [0, 1.5, 0.65], colour: GREY, dims: [5.0, 3.0, 2.5], orientation: "identity", frozen: false, topScale: 1 },
  { id: "ShortArm", position: [-1.25, 1.5, 3.15], colour: TAN, dims: [2.5, 3.0, 2.5], orientation: "identity", frozen: false, topScale: 1 },
], [-1.25, 3.0 + LIFT, 0.65], ID, [0, 1.5, 1.9]);

// (e) Scene_1's cube's box turned 30° about the vertical
const E_POS: Triple = [0.025, 2.415, 1.91];
export const TEST_E = testScene("Test_e", "Test e — a box turned 30 degrees", [
  { id: "Turned", position: E_POS, colour: GREY, dims: [4.9, 4.83, 4.83], orientation: { yawDeg: 30 }, frozen: false, topScale: 1 },
], [E_POS[0], 4.83 + LIFT, E_POS[2]], nz(qFromAxisAngle([0, 1, 0], Math.PI / 6)), E_POS);

// (f) the thin lying bar: a heptagon 2.4 × 2.4 across, 9.6 long with tips of 1.8, extruded along world x (a face on the floor, an edge at the top)
const F_POS: Triple = [0, 1.2, 1.9];
export const TEST_F = testScene("Test_f", "Test f — a thin long lying bar with pointed ends", [
  { id: "Bar", position: F_POS, colour: GREY, dims: [2.4, 2.4, 9.6], orientation: { yawDeg: 90 }, frozen: false, topScale: 1, prismSides: 7, prismTip: 1.8 },
], [F_POS[0], 2.4 + LIFT, F_POS[2]], ID, F_POS);
