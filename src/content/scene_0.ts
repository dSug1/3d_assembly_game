/**
 * ⭐⭐⭐ **`Scene_0`** — the workbench level (World 0's `Level_0`): **THE HEPTAGON** (the owner, 2026-11-12).
 *
 * ⭐ *"copy the content of the scene 2 into the scene 0. Therefore, delete the entire content of scene 0 and copy the content of scene 2"* — `Scene_2`'s
 * content: `Scene_1`'s frozen floor, lights, orbit rig, units, boot view and play volume (read from `SCENE_1`, never retyped; a COPY of
 * `scene_2.ts`'s way, not a link). ⛔ Its content until then — the four workbench bodies (`objectA` – `objectD`; `D93`, `D72`, `D91`, `D92`) and its own
 * rig — is DELETED; `core/scene_dims.ts` keeps their dimensions; the record is git history.
 * ⭐ Then *"in scene 0 add: an heptagon extruded horizontally. One face on the floor, the opposite edge at the zenith. Dimensions: overall the same as
 * the cube of the assembly of scene 1. Grey color. — a green piece (same as the green piece of scene 1). The objective is to test all the
 * functionalities of the scene 1 (polar orbit, tilted-pole orbit, snap, etc.) with an assembly which is not the scene 1's cube but another shape."*
 * * **The heptagon** (`prismSides: 7`, `core/prism.ts`): `Scene_1`'s cube's bounding box (its 41 table pieces' contours at their goals, the frusta
 *   left out — 4.9 × 4.83 × 4.83 units, centred at x 0.025, z 1.91), standing ON the floor (its bottom face at y = 0; the cube floats 0.155 above);
 *   extruded ALONG x (turned a quarter about the vertical), so its two top faces slope toward and away from the boot camera. A PLACED part (its goal
 *   is where it boots — `final`), so the orbit takes it as the assembly; ⚠ not frozen (a frozen body hosts no gizmo).
 * * **The green piece** (and the turquoise one) as `Scene_1`'s: its size from `Scene_1`'s Piece17 (`orbitPieceRefDims`), its boot turn the same.
 * * **Its goal** (the owner: *"the center of the topmost slanted face towards the user at boot, the green piece resting face being oriented
 *   longitudinally and being the largest face of the green piece"*): the top face on the camera's side (−z), centred, the green piece's wide base
 *   (its largest face) flush on it, its long side along the heptagon's length (x). The turquoise standing on the same spot.
 *
 * ⚠ Engine-free data. Nothing here may import the renderer.
 */
import { resolveBootOrientation, type BodySpec, type FinalPose, type SceneDescriptor, type Triple } from "../core/game_structure";
import { prismOutline } from "../core/prism";
import { normalize, qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../core/vec";
import { greenPyramidSizeM, turquoiseSizeM } from "../input/green_box";
import { SCENE_1 } from "./scene_1";

const UNIT_M = SCENE_1.unitM ?? 1;
const FLOOR = SCENE_1.bodies.find((b) => b.id === "Floor" && b.frozen);
if (FLOOR === undefined) throw new Error("Scene_0: Scene_1 has no frozen Floor to copy");
const PIECE17 = SCENE_1.bodies.find((b) => b.id === "Piece17");
if (PIECE17 === undefined) throw new Error("Scene_0: Scene_1 has no Piece17 to size the green piece from");

// ⭐ Scene_1 without its pieces and its goals (the play volume, units, boot view, lighting and rig carried) — as `Scene_2`
const { bodies: _bodies, final: _final, orbitGoals: _orbitGoals, ...shared } = SCENE_1;

/** ⭐ `Scene_1`'s cube (measured from its table: x −2.425 … 2.475, y 0.155 … 4.985, z −0.505 … 4.325 units). */
const CUBE_SIZE: Triple = [4.9, 4.83, 4.83];
const CUBE_CENTRE_XZ = [0.025, 1.91] as const;
export const SCENE_0_HEPTAGON_SIDES = 7;
/** ⭐ The heptagon's own dims: across the polygon (→ world z), high, the extrusion (→ world x) — the cube's world extents once turned. */
export const SCENE_0_HEPTAGON_DIMS: Triple = [CUBE_SIZE[2], CUBE_SIZE[1], CUBE_SIZE[0]];
const HEPTAGON_TURN = { yawDeg: 90 } as const;
export const SCENE_0_HEPTAGON_POSITION: Triple = [CUBE_CENTRE_XZ[0], CUBE_SIZE[1] / 2, CUBE_CENTRE_XZ[1]];
/** ⭐ Grey — the workbench's grey part's. */
const GREY: Triple = [0.65, 0.67, 0.72];

const HEPTAGON: BodySpec = {
  id: "Heptagon",
  position: SCENE_0_HEPTAGON_POSITION,
  colour: GREY,
  dims: SCENE_0_HEPTAGON_DIMS,
  orientation: HEPTAGON_TURN,
  frozen: false,
  topScale: 1,
  prismSides: SCENE_0_HEPTAGON_SIDES,
};

/** ⭐ The side of the boot camera, in world z (the painting's front, `Scene_1`'s, faces −z). */
const TOWARD_USER_Z = -1;

/**
 * ⭐ The topmost slanted face on the user's side, in the world (authored units): its centre and its outward normal — one of the two edges at the
 * apex of the outline, carried by the heptagon's turn and position.
 */
export function heptagonGoalFace(): { readonly centre: Vec3; readonly normal: Vec3 } {
  const pts = prismOutline(SCENE_0_HEPTAGON_SIDES, SCENE_0_HEPTAGON_DIMS[0], SCENE_0_HEPTAGON_DIMS[1])!;
  const apex = pts.reduce((k, p, i) => (p[1] > pts[k]![1] ? i : k), 0);
  const q = resolveBootOrientation(HEPTAGON_TURN, []) ?? ([1, 0, 0, 0] as Quat);
  const faces = [pts[(apex + pts.length - 1) % pts.length]!, pts[(apex + 1) % pts.length]!].map((p) => {
    const a = pts[apex]!;
    const mid: Vec3 = [(a[0] + p[0]) / 2, (a[1] + p[1]) / 2, 0];
    // outward: perpendicular to the edge, away from the outline's middle (the origin)
    let n: Vec3 = [-(p[1] - a[1]), p[0] - a[0], 0];
    if (n[0] * mid[0] + n[1] * mid[1] < 0) n = [-n[0], -n[1], 0];
    const c = qRotate(q, mid);
    return { centre: [c[0] + SCENE_0_HEPTAGON_POSITION[0], c[1] + SCENE_0_HEPTAGON_POSITION[1], c[2] + SCENE_0_HEPTAGON_POSITION[2]] as Vec3, normal: normalize(qRotate(q, n))! };
  });
  return faces.find((f) => Math.sign(f.normal[2]) === TOWARD_USER_Z)!;
}

/** ⭐ The turn that stands a piece's own +y on the face's normal, its own x kept along the world's x (the heptagon's length). */
function onFace(n: Vec3): Quat {
  // about x: +y turned by θ is (0, cos θ, sin θ) — θ from the normal's y and z (the normal has no x)
  const q = qFromAxisAngle([1, 0, 0], Math.atan2(n[2], n[1]));
  const y = qRotate(q, [0, 1, 0]);
  return Math.hypot(y[0] - n[0], y[1] - n[1], y[2] - n[2]) < 1e-9 ? q : qFromAxisAngle([1, 0, 0], -Math.atan2(n[2], n[1]));
}

const GOAL_FACE = heptagonGoalFace();
// ⭐ `+ 0`: no −0 in the data (JSON has none — the scene would not survive its own round trip)
const noNegZero = <T extends readonly number[]>(v: T): T => v.map((x) => x + 0) as unknown as T;
const GOAL_TURN = noNegZero(onFace(GOAL_FACE.normal));
const at = (lift: number): Triple => noNegZero([GOAL_FACE.centre[0] + GOAL_FACE.normal[0] * lift, GOAL_FACE.centre[1] + GOAL_FACE.normal[1] * lift, GOAL_FACE.centre[2] + GOAL_FACE.normal[2] * lift] as Triple);
// ⭐ the green piece's wide base at −h/2 of its centre; the turquoise standing, its length along its own y
const GREEN = greenPyramidSizeM(PIECE17.dims, 1);
const TURQUOISE = turquoiseSizeM(GREEN);

/**
 * ⭐⭐ (2026-11-12, the owner: *"add a protruding part on the left of the topmost slanted face of the heptagon to give a visual anchor to the player"*)
 * **THE ANCHOR** — a small orange box standing proud of the goal face, on its LEFT as the boot camera sees it (−x: the camera at −z looking at +z, Babylon's
 * left-handed frame), its base flush on the face, centred across the face's slope, clear of the green piece's goal (`ANCHOR_SHIFT` from the face's
 * centre along x). A PLACED part like the heptagon (its goal where it boots), so the orbit takes it as part of the assembly.
 */
export const SCENE_0_ANCHOR_DIMS: Triple = [0.6, 0.45, 0.6];
/** ⭐ Along x from the goal face's centre (units): −1.6 — the green piece's goal spans ±0.52, the anchor ±0.3: 0.78 units (78 mm) of face between them. */
export const SCENE_0_ANCHOR_SHIFT = -1.6;
const ANCHOR_AT = at(SCENE_0_ANCHOR_DIMS[1] / 2);
export const SCENE_0_ANCHOR_POSITION: Triple = noNegZero([ANCHOR_AT[0] + SCENE_0_ANCHOR_SHIFT, ANCHOR_AT[1], ANCHOR_AT[2]] as Triple);
const ANCHOR: BodySpec = {
  id: "Anchor",
  position: SCENE_0_ANCHOR_POSITION,
  colour: [0.9, 0.5, 0.15],
  dims: SCENE_0_ANCHOR_DIMS,
  orientation: { quat: GOAL_TURN },
  frozen: false,
  topScale: 1,
};

export const SCENE_0_ORBIT_GOALS: readonly FinalPose[] = [
  { id: "green-box", position: at(GREEN[1] / 2), orientation: { quat: GOAL_TURN }, symmetry: "yawHalfTurns" },
  { id: "turquoise-piece", position: at(TURQUOISE.lengthM / 2), orientation: { quat: GOAL_TURN }, symmetry: "hexPrism" },
];

export const SCENE_0: SceneDescriptor = {
  ...shared,
  id: "Scene_0",
  title: "Scene 0 — the workbench",
  // ⭐ (the owner: *"the camera orbit center shall be the center of the heptagon"*) `Scene_1`'s rig, its boot centre at the heptagon's (its body's
  // origin — the middle of its bounding box), in metres
  orbit: { ...SCENE_1.orbit!, centreM: [SCENE_0_HEPTAGON_POSITION[0] * UNIT_M, SCENE_0_HEPTAGON_POSITION[1] * UNIT_M, SCENE_0_HEPTAGON_POSITION[2] * UNIT_M] },
  bodies: [HEPTAGON, ANCHOR, FLOOR],
  // ⭐ the heptagon's goal is where it boots: a PLACED part from the first frame — the assembly the orbit goes round
  // ⛔ ABSOLUTE, not Scene_1's RELATIVE: with fewer than three bodies a relative fit is only their mean offset — the green piece far out dragged it and
  // the heptagon read as out of place (goal 0/2, no assembly; measured headless)
  final: {
    frame: "ABSOLUTE",
    bodies: [
      { id: "Heptagon", position: SCENE_0_HEPTAGON_POSITION, orientation: HEPTAGON_TURN },
      { id: "Anchor", position: SCENE_0_ANCHOR_POSITION, orientation: { quat: GOAL_TURN } },
    ],
  },
  orbitGoals: SCENE_0_ORBIT_GOALS,
  orbitPieceRefDims: PIECE17.dims,
};
