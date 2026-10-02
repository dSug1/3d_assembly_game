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
 * ⭐⭐ **`D169` — THE FLOOR'S TOP CENTRE IS THE ORIGIN** (the owner, 2026-09-29: *"translate all the objects of
 * the scene (floor, pieces, lights, camera orbit rings in Scene_1, etc.) so that the center of the top face
 * of the floor is at (0,0,0)"*): every position below is the owner's plus `SCENE_1_SHIFT_Y` = 2.3 in gravity
 * (the Unity plane sat at −2.3), and the orbit's boot centre moves with them, so the view is unchanged.
 *
 * ⭐⭐ **THE SECOND LAYOUT** (the owner, 2026-09-27: *"reshuffle the pieces as follows"*) — a new table
 * of 41 rows replaces the first one whole: 13 white, 20 black, 3 yellow, 4 red, 1 blue, every piece
 * at `z = −0.34` and 0.3 deep, the bounds unchanged (x −2.41 → 2.46, gravity −2.13 → 2.67). Its
 * materials are named `Mat_White` … `Mat_Blue`; they map onto the slots below. ⚠ The first table's
 * gaps and its Piece42–44 renaming are gone with it.
 *
 * ⚠ Colours: the owner named them (*white, black, yellow, red, blue, sand yellow*) and deferred real
 * materials to the glTF path; the RGB values below are mine, a Mondrian palette on the flat diffuse
 * path the build already has.
 */
import type { BodySpec, FinalConfiguration, SceneDescriptor, Triple } from "../core/game_structure";

/** ⭐ `D169`: how far up every position moved so the floor's top centre is the origin — authored units. */
export const SCENE_1_SHIFT_Y = 2.3;

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
  ["Piece1", "MAT_A", -0.7, 4.825, -0.34, 1.26, 0.29, 0.3],
  ["Piece2", "MAT_D", -2.24, 4.56, -0.34, 0.34, 0.82, 0.3],
  ["Piece3", "MAT_A", -1.7, 4.56, -0.34, 0.42, 0.82, 0.3],
  ["Piece4", "MAT_A", 1.04, 4.56, -0.34, 1.9, 0.82, 0.3],
  ["Piece5", "MAT_A", 2.305, 4.56, -0.34, 0.31, 0.82, 0.3],
  ["Piece6", "MAT_C", -1.005, 4.335, -0.34, 0.65, 0.37, 0.3],
  ["Piece7", "MAT_D", -0.295, 4.335, -0.34, 0.45, 0.37, 0.3],
  ["Piece8", "MAT_A", -0.7, 3.385, -0.34, 1.26, 1.21, 0.3],
  ["Piece9", "MAT_A", -1.95, 2.785, -0.34, 0.92, 2.41, 0.3],
  ["Piece10", "MAT_E", 1.04, 2.785, -0.34, 1.9, 2.41, 0.3],
  ["Piece11", "MAT_A", 2.305, 2.785, -0.34, 0.31, 2.41, 0.3],
  ["Piece12", "MAT_D", -1.15, 1.75, -0.34, 0.36, 1.74, 0.3],
  ["Piece13", "MAT_A", -0.44, 1.75, -0.34, 0.74, 1.74, 0.3],
  ["Piece14", "MAT_A", -1.95, 1.15, -0.34, 0.92, 0.54, 0.3],
  ["Piece15", "MAT_A", 1.04, 1.15, -0.34, 1.9, 0.54, 0.3],
  ["Piece16", "MAT_A", 2.305, 1.15, -0.34, 0.31, 0.54, 0.3],
  ["Piece17", "MAT_C", -1.95, 0.445, -0.34, 0.92, 0.55, 0.3],
  ["Piece18", "MAT_A", -0.7, 0.445, -0.34, 1.26, 0.55, 0.3],
  ["Piece19", "MAT_C", 0.555, 0.445, -0.34, 0.93, 0.55, 0.3],
  ["Piece20", "MAT_A", 1.585, 0.445, -0.34, 0.81, 0.55, 0.3],
  ["Piece21", "MAT_D", 2.305, 0.445, -0.34, 0.31, 0.55, 0.3],
  ["Piece22", "MAT_B", -0.7, 4.6, -0.34, 1.26, 0.1, 0.3],
  ["Piece23", "MAT_B", -1.99, 4.56, -0.34, 0.1, 0.82, 0.3],
  ["Piece24", "MAT_B", -0.6, 4.335, -0.34, 0.1, 0.37, 0.3],
  ["Piece25", "MAT_B", -1.95, 4.07, -0.34, 0.92, 0.1, 0.3],
  ["Piece26", "MAT_B", -0.7, 4.07, -0.34, 1.26, 0.1, 0.3],
  ["Piece27", "MAT_B", 1.04, 4.07, -0.34, 1.9, 0.1, 0.3],
  ["Piece28", "MAT_B", 2.305, 4.07, -0.34, 0.31, 0.1, 0.3],
  ["Piece29", "MAT_B", -0.7, 2.7, -0.34, 1.26, 0.1, 0.3],
  ["Piece30", "MAT_B", -1.41, 2.57, -0.34, 0.1, 4.8, 0.3],
  ["Piece31", "MAT_B", 0.01, 2.57, -0.34, 0.1, 4.8, 0.3],
  ["Piece32", "MAT_B", 2.07, 2.57, -0.34, 0.1, 4.8, 0.3],
  ["Piece33", "MAT_B", -0.89, 1.75, -0.34, 0.1, 1.74, 0.3],
  ["Piece34", "MAT_B", -1.95, 1.5, -0.34, 0.92, 0.1, 0.3],
  ["Piece35", "MAT_B", 1.04, 1.5, -0.34, 1.9, 0.1, 0.3],
  ["Piece36", "MAT_B", 2.305, 1.5, -0.34, 0.31, 0.1, 0.3],
  ["Piece37", "MAT_B", -1.95, 0.8, -0.34, 0.92, 0.1, 0.3],
  ["Piece38", "MAT_B", -0.7, 0.8, -0.34, 1.26, 0.1, 0.3],
  ["Piece39", "MAT_B", 1.04, 0.8, -0.34, 1.9, 0.1, 0.3],
  ["Piece40", "MAT_B", 2.305, 0.8, -0.34, 0.31, 0.1, 0.3],
  ["Piece41", "MAT_B", 1.1, 0.445, -0.34, 0.1, 0.55, 0.3],
];

/** Which slot each piece wears — kept so a later glTF material can be matched by slot. */
export const SCENE_1_SLOTS: Readonly<Record<string, Slot>> = Object.fromEntries(
  ROWS.map((r) => [r[0], r[1]]),
);

/**
 * ⭐⭐ **THE TRANSPARENT CONTOUR** (`D125`, the owner, 2026-09-27: *"extend the pieces so that their
 * faces touch (no gap between the faces) but maintain a transparent margin with the colored core
 * inside"*). ⭐ Every gap between two neighbouring pieces in the table is **0.03** units (a vector), so
 * half of it on every side makes every neighbouring pair touch, face to face, while the coloured
 * cores — the table's own sizes, unchanged — keep their 0.03 apart.
 */
export const SCENE_1_CONTOUR_MARGIN = 0.03 / 2;

/**
 * ⭐⭐⭐ **THE LEVEL-COMPLETED CONFIGURATION IS THE TABLE** (`D129`, the owner, 2026-09-28: *"current
 * configuration of parts is 'level completed configuration', therefore the target the user has to
 * achieve in minimum touchpoint episodes and time"*) — every piece where the table puts it, square.
 */
/**
 * ⭐⭐ `D130` (the owner, 2026-09-28): *"goal completed when parts sit correctly relative to each
 * other … painting can sit anywhere for this Scene_01"* → `RELATIVE`; and *"their respective goal can
 * be achieved by two way: face aligned or opposite face aligned"* → `halfTurns`. ⚠ Given for ALL 41,
 * not only the five that boot away: every piece is a plain box, so any one a player moves and puts
 * back flipped looks the same and must count the same.
 */
/**
 * ⭐⭐ `D183`: and IDENTICAL pieces are interchangeable — one colour and one size is one `kind`, so any black
 * 1.26 bar (Piece22, 26, 29, 38) may fill any of their four slots. ⚠ Same size in the same axis order: a bar turned
 * a quarter is not its upright twin, the half-turns being the only turns accepted.
 */
export const SCENE_1_FINAL: FinalConfiguration = {
  frame: "RELATIVE",
  bodies: ROWS.map(([id, slot, x, y, z, sx, sy, sz]) => ({
    id,
    position: [x, y, z],
    orientation: "identity",
    symmetry: "halfTurns",
    kind: `${slot} ${sx}×${sy}×${sz}`,
  })),
};

/**
 * ⭐⭐ **THE BOOT — five pieces out of the painting** (`D129`, the owner, 2026-09-28: *"reproduce the
 * pieces transforms as in the snapshot (just change the transform of the couple of pieces which have
 * changed, the rest and the camera stay unchanged)"*).
 *
 * ⭐ RECOVERED FROM THE SNAPSHOT, since nothing on the device prints a pose: the camera was solved
 * from four unmoved pieces' corners (0.97 px rms, and it reproduced the phone's canvas height at
 * Babylon's 0.8 rad fov), then each moved piece's x, z and yaw from its own corners at its known
 * size. ⭐ Every piece kept its table HEIGHT — a one-finger drag is horizontal — and Piece41, fitted
 * with y free, landed on it to 0.001. ⚠ The two black bars are a few pixels wide: their yaw cannot
 * be read and is 0. Reprojection rms per piece: 1.2, 1.6, 1.5, 1.8, 0.4 px.
 */
const BOOT_MOVES: Readonly<Record<string, { position: Triple; yawDeg: number }>> = {
  Piece1: { position: [-1.992, 4.825, 1.287], yawDeg: 32.4 },
  Piece2: { position: [-2.116, 4.56, -1.591], yawDeg: -5 },
  Piece17: { position: [-2.17, 0.445, -1.313], yawDeg: 9.3 },
  Piece23: { position: [-2.864, 4.56, 0.587], yawDeg: 0 },
  Piece41: { position: [1.323, 0.445, -1.412], yawDeg: 0 },
};

const pieces: BodySpec[] = ROWS.map(([id, slot, x, y, z, sx, sy, sz]) => {
  const moved = BOOT_MOVES[id];
  return {
    id,
    position: moved?.position ?? [x, y, z],
    colour: SCENE_1_PALETTE[slot],
    dims: [sx, sy, sz],
    orientation: moved && moved.yawDeg !== 0 ? { yawDeg: moved.yawDeg } : "identity",
    frozen: false,
    topScale: 1,
    margin: SCENE_1_CONTOUR_MARGIN,
  };
});

/**
 * ⭐ The floor — Unity's built-in Plane (10 × 10 units) at `(0, −2.3, 0)`, scale `(4.79, 0.22, 4.79)`:
 * 47.9 × 47.9 units — ⭐ HALVED to 23.95 (`D122`, the owner, 2026-09-27: *"make the dimension of the
 * yellow sand plane half of what they are currently"*), then to **80 %** of that, **19.16 × 19.16**
 * (*"reduce the width and length of the yellow sand plate to 80 % of their current sizes"*), then
 * **107 %** of that (*"increase … to 107 % of their current sizes"*), then **103 %**: 21.116236 × 21.116236, ⭐ and then **20 × 20** — 2.000 m × 5 mm × 2.000 m (`D169`, the owner,
 * 2026-09-29). ⚠ A plane has no thickness and a body needs a shape, so it is a slab 0.05 units thick whose TOP
 * is the plane — at `y = 0` since `D169` (it was −2.3). Frozen, as asked.
 */
const FLOOR: BodySpec = {
  id: "Floor",
  position: [0, 0 - 0.025, 0],
  colour: SCENE_1_PALETTE.MAT_F,
  dims: [20, 0.05, 20],
  orientation: "identity",
  frozen: true,
  topScale: 1,
};

export const SCENE_1: SceneDescriptor = {
  id: "Scene_1",
  title: "Scene 1 — the painting",
  // ⭐ `3D7` (`D181`): no piece may leave the floor's 2 m × 2 m footprint, nor rise more than 1 m above it — twice the
  // painting's height, so every lift the level needs has room.
  playVolume: { aboveFloor: 10 },
  // ⭐ One authored unit = 0.1 m, so the 4.9-unit painting is 0.49 m and the rig frames it.
  unitM: 0.1,
  // ⭐ prototype (green box), the owner 2026-10-01: *"boot scene 1 on the top ring"* (was "LEVEL").
  bootView: "TOP",
  bodies: [...pieces, FLOOR],
  lighting: {
    background: [0.0087, 0.1465, 0.2138],
    shadowStrength: 0.4,
    ambient: 0.35,
    lights: [
      {
        name: "Light_spot_left",
        type: "SPOT",
        position: [-39.9, 19.97, -24.6],
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
        position: [55.0, 18.08, 33.0],
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
        position: [0.5, 34.57, -8.2],
        eulerDeg: [65.25, 0, 180],
        intensity: 1,
        kelvin: 5250,
        filter: [0.976, 0.958, 0.896],
      },
    ],
  },
  // ⭐ `D131` (the owner, 2026-09-28): radii top 1.8 m, middle 1 m, bottom 1.5 m; heights as `Scene_0`'s.
  // ⭐ prototype (green box), the owner 2026-10-01: top 0.9 / 0.5, middle 0.2 / 0, bottom 0.9 / −0.4 m (radius / height).
  orbit: {
    // ⭐ `D169`: the orbit rings travel with the scene — the boot centre is where the world origin was.
    centreM: [0, SCENE_1_SHIFT_Y * 0.1, 0],
    // ⭐⭐ prototype (green box), the owner 2026-10-02: a symmetric WAIST — *"top ring = 1.7 m radius, … middle ring = smallest
    // possible radius, height = 0, bottom ring = 1.7 m radius"*, the three others proposed and applied:
    // * middle 0.25 m — the smallest that keeps the green piece out of the painting at boot zoom 1.5 (1.5 × 0.25 = 0.375 m from
    //   the axis; the painting reaches 0.30 m, the piece ~0.06 m more);
    // * ±1.05 m — the tallest that stays under the 3 m camera clamp at boot zoom 1.5 (√(1.7² + 1.05²) = 2.00 m × 1.5 = 3.00 m):
    //   a taller waist turns more gently, but a clamped ring is a corner of its own. Symmetric, so the height runs evenly
    //   through the middle ring. (Was top 1.7 / 0.5, middle 0.2 / 0, bottom 0.9 / −0.4 — the stair.)
    // ⭐ prototype (green box), the owner 2026-10-02: *"I want to set the zoom at 1.00 but the scene shall be exactly the same"* —
    // every ring ×1.5 and the boot zoom 1.5 → 1.00 (`bootZoom`): the green piece sits at rings × zoom, so nothing moves.
    // (Was 1.7 / ±1.05, 0.25 / 0 at zoom 1.5.)
    topRadiusM: 2.55,
    topHeightM: 1.575,
    middleRadiusM: 0.375,
    middleHeightM: 0,
    bottomRadiusM: 2.55,
    bottomHeightM: -1.575,
  },
  final: SCENE_1_FINAL,
};
