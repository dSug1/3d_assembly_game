/**
 * ⭐⭐⭐ **`Scene_1` — the painting** (the owner, 2026-09-27).
 *
 * > *"It is built from 42 flat 3D boxes standing upright in the XGravity plane, facing the camera
 * > (camera looks along depth), lit by two spot lights and one directional light."*
 *
 * ⭐ Every value below is the OWNER'S, in the owner's (Unity) world units, unchanged — the scene's
 * `unitM` (0.1 m per unit) is what makes it fit the camera rig, so the painting stands 0.49 m wide
 * the way `Scene_0`'s parts are 8 cm. ⛔ Change `unitM`, never a number here.
 *
 * ⚠⚠ **WHAT THE BRIEF SAID AND THE TABLE DID NOT** — built as the TABLE says, and named:
 * * The brief says 42 pieces; the table lists **41** (Piece13, Piece18 and Piece35 absent, and the
 *   blank row between Piece34 and Piece36 carries nothing).
 * * `MAT_B` is said to cover 24 pieces; the table gives it **23** (Piece11 + the 22 bars).
 * * The conventions say `z = −0.33333`; every row says `−0.34`. ⭐ The ROWS are used (a table is
 *   the more specific statement, and the painting's own numbers agree with each other).
 *
 * ⭐ **The renaming the owner asked for** — *"rename the pieces so Piece13, Piece18 and Piece35 are
 * in the scene and Piece42, Piece43 and Piece44 do not exist any longer"* — is applied in order:
 * Piece42 → **Piece13**, Piece43 → **Piece18**, Piece44 → **Piece35**.
 *
 * ⚠ Colours: the owner named them (*white, black, yellow, red, blue, sand yellow*) and deferred real
 * materials to the glTF path; the RGB values below are mine, a Mondrian palette on the flat diffuse
 * path the build already has.
 */
import type { BodySpec, SceneDescriptor } from "../core/game_structure";

type Slot = "MAT_A" | "MAT_B" | "MAT_C" | "MAT_D" | "MAT_E" | "MAT_F";

/** The owner's slots, as flat diffuse colours (linear RGB). */
export const SCENE_1_PALETTE: Readonly<Record<Slot, readonly [number, number, number]>> = {
  MAT_A: [0.93, 0.93, 0.9], // white
  MAT_B: [0.03, 0.03, 0.03], // black
  MAT_C: [0.95, 0.78, 0.08], // yellow
  MAT_D: [0.78, 0.09, 0.08], // red
  MAT_E: [0.08, 0.2, 0.62], // blue
  MAT_F: [0.84, 0.74, 0.52], // sand yellow
};

/** `[name, slot, x, y, z, sx, sy, sz]` — the owner's table, row for row. */
const ROWS: readonly (readonly [string, Slot, number, number, number, number, number, number])[] = [
  ["Piece1", "MAT_A", -1.844, 2.402, -0.34, 1.13, 0.53, 0.3],
  ["Piece2", "MAT_A", -2.13, 1.48, -0.34, 0.49, 1.06, 0.3],
  ["Piece3", "MAT_A", -2.13, -0.03, -0.34, 0.49, 1.65, 0.3],
  ["Piece4", "MAT_C", -2.13, -1.56, -0.34, 0.49, 1.08, 0.3],
  ["Piece5", "MAT_A", -0.313, 2.402, -0.34, 1.73, 0.53, 0.3],
  ["Piece6", "MAT_C", 1.37, 2.402, -0.34, 1.41, 0.53, 0.3],
  ["Piece7", "MAT_C", 1.37, 1.48, -0.34, 1.41, 1.08, 0.3],
  ["Piece8", "MAT_A", 1.37, -0.65, -0.34, 1.41, 0.46, 0.3],
  ["Piece9", "MAT_A", 0.02, -0.65, -0.34, 1.07, 0.46, 0.3],
  ["Piece10", "MAT_A", 0.02, -1.25, -0.34, 1.07, 0.46, 0.3],
  ["Piece11", "MAT_B", -1.18, -0.98, -0.34, 1.07, 1.06, 0.3],
  ["Piece12", "MAT_D", -0.61, 0.86, -0.34, 2.27, 2.29, 0.3],
  ["Piece14", "MAT_A", -1.18, -1.87, -0.34, 1.07, 0.45, 0.3],
  ["Piece15", "MAT_A", 0.79, -2.02, -0.34, 2.58, 0.16, 0.3],
  ["Piece16", "MAT_A", 2.34, 0.9, -0.34, 0.23, 3.52, 0.3],
  ["Piece17", "MAT_D", 2.34, -1.58, -0.34, 0.23, 1.04, 0.3],
  ["Piece19", "MAT_E", 1.37, -1.42, -0.34, 1.41, 0.74, 0.3],
  ["Piece20", "MAT_A", 1.77, 0.28, -0.34, 0.62, 1.08, 0.3],
  ["Piece21", "MAT_A", 1, 0.28, -0.34, 0.62, 1.08, 0.3],
  ["Piece22", "MAT_B", -0.17, 2.07, -0.34, 4.47, 0.1, 0.3],
  ["Piece23", "MAT_B", -1.19, -0.37, -0.34, 1.05, 0.1, 0.3],
  ["Piece24", "MAT_B", -2.12, 0.89, -0.34, 0.46, 0.1, 0.3],
  ["Piece25", "MAT_B", -2.12, -0.94, -0.34, 0.46, 0.1, 0.3],
  ["Piece26", "MAT_B", 2.36, -0.96, -0.34, 0.17, 0.1, 0.3],
  ["Piece27", "MAT_B", -1.19, -1.58, -0.34, 1.05, 0.1, 0.3],
  ["Piece28", "MAT_B", 0.03, -0.37, -0.34, 1.05, 0.1, 0.3],
  ["Piece29", "MAT_B", 0.03, -0.97, -0.34, 1.05, 0.1, 0.3],
  ["Piece30", "MAT_B", 0.03, -1.55, -0.34, 1.05, 0.1, 0.3],
  ["Piece31", "MAT_B", 0.03, -1.87, -0.34, 1.05, 0.1, 0.3],
  ["Piece32", "MAT_B", 1.41, -0.37, -0.34, 1.4, 0.1, 0.3],
  ["Piece33", "MAT_B", 1.41, 0.85, -0.34, 1.4, 0.1, 0.3],
  ["Piece34", "MAT_B", 1.41, -0.97, -0.34, 1.4, 0.1, 0.3],
  ["Piece36", "MAT_B", 1.41, -1.92, -0.34, 1.4, 0.1, 0.3],
  ["Piece37", "MAT_B", -1.22, 2.4, -0.34, 0.1, 0.51, 0.3],
  ["Piece38", "MAT_B", 0.61, 2.4, -0.34, 0.1, 0.51, 0.3],
  ["Piece39", "MAT_B", 0.61, 0.04, -0.34, 0.1, 3.9, 0.3],
  ["Piece40", "MAT_B", 1.4, 0.25, -0.34, 0.1, 1.06, 0.3],
  ["Piece41", "MAT_B", 2.18, 0.26, -0.34, 0.1, 4.77, 0.3],
  // ⭐ Renamed as asked: these three rows were Piece42, Piece43 and Piece44.
  ["Piece13", "MAT_B", -1.8, -0.06, -0.34, 0.1, 4.12, 0.3],
  ["Piece18", "MAT_B", -0.58, -1.21, -0.34, 0.1, 1.8, 0.3],
  ["Piece35", "MAT_B", 0.02, -1.7, -0.34, 1.07, 0.18, 0.3],
];

/** Which slot each piece wears — kept so a later glTF material can be matched by slot. */
export const SCENE_1_SLOTS: Readonly<Record<string, Slot>> = Object.fromEntries(
  ROWS.map((r) => [r[0], r[1]]),
);

const pieces: BodySpec[] = ROWS.map(([id, slot, x, y, z, sx, sy, sz]) => ({
  id,
  position: [x, y, z],
  colour: SCENE_1_PALETTE[slot],
  dims: [sx, sy, sz],
  orientation: "identity",
  frozen: false,
  topScale: 1,
}));

/**
 * ⭐ The floor — Unity's built-in Plane (10 × 10 units) at `(0, −2.3, 0)`, scale `(4.79, 0.22, 4.79)`:
 * 47.9 × 47.9 units — ⭐ HALVED to 23.95 (`D122`, the owner, 2026-09-27: *"make the dimension of the
 * yellow sand plane half of what they are currently"*), then to **80 %** of that, **19.16 × 19.16**
 * (*"reduce the width and length of the yellow sand plate to 80 % of their current sizes"*). ⚠ A plane has no thickness and a body needs a shape, so it is a slab 0.05 units
 * thick whose TOP is the plane (`y = −2.3`). Frozen, as asked.
 */
const FLOOR: BodySpec = {
  id: "Floor",
  position: [0, -2.3 - 0.025, 0],
  colour: SCENE_1_PALETTE.MAT_F,
  dims: [19.16, 0.05, 19.16],
  orientation: "identity",
  frozen: true,
  topScale: 1,
};

export const SCENE_1: SceneDescriptor = {
  id: "Scene_1",
  title: "Scene 1 — the painting",
  // ⭐ One authored unit = 0.1 m, so the 4.9-unit painting is 0.49 m and the rig frames it.
  unitM: 0.1,
  bootView: "LEVEL",
  bodies: [...pieces, FLOOR],
  lighting: {
    background: [0.0087, 0.1465, 0.2138],
    shadowStrength: 0.4,
    ambient: 0.35,
    lights: [
      {
        name: "Light_spot_left",
        type: "SPOT",
        position: [-39.9, 17.67, -24.6],
        eulerDeg: [17.5, 57.4, 180.6],
        intensity: 1500,
        range: 67.51,
        spotOuterDeg: 48.71,
        spotInnerDeg: 34.99,
        kelvin: 5250,
        filter: [0.976, 0.957, 0.971],
      },
      {
        name: "Light_spot_rear",
        type: "SPOT",
        position: [55.0, 15.78, 33.0],
        eulerDeg: [11.4, 238.93, 180.6],
        intensity: 2000,
        range: 83.15,
        spotOuterDeg: 39.19,
        spotInnerDeg: 28.47,
        kelvin: 5130,
        filter: [1.0, 0.993, 0.98],
      },
      {
        name: "Light_directional",
        type: "DIRECTIONAL",
        position: [0.5, 32.27, -8.2],
        eulerDeg: [65.25, 0, 180],
        intensity: 1,
        kelvin: 5250,
        filter: [0.976, 0.958, 0.896],
      },
    ],
  },
  final: null,
};
