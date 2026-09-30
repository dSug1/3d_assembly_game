/**
 * ⭐⭐⭐ **THE DEMO PLAN — a scene's final configuration taken apart backwards** (`D170`, the owner,
 * 2026-09-29). Design of record: `Claude/20_GAME_RULES/spec/DEMO_SCENE.md`.
 *
 * ⭐ From the assembled goal, `generateDemoPlan` takes the scene apart one move at a time, each move the
 * exact REVERSE of a player move (an unsnap for a snap, an estrangement for an approach, an unalignment
 * for an alignment, and plain translations and spins). Played forwards, the plan is a sequence of player
 * moves that ends on the goal.
 *
 * ⛔⛔ **EVERY MOVE IS CHECKED, NEVER ASSUMED**: along its whole path no body penetrates another
 * (`core/collision.ts`, `D136`), and the moving piece stays inside the demo VOLUME. A random choice that
 * fails is re-drawn; a plan that cannot be completed THROWS — it never ships shorter or colliding.
 *
 * ⛔ ENGINE-FREE. Authored units throughout (the scene's own; `Scene_1`: 0.1 m).
 */
import { contourDims, resolveBootOrientation, type SceneDescriptor, type Triple } from "./game_structure";
import { boxShape, gapBetween } from "./collision_shape";
import { boundsFromShapes, hullAtSpawn, resolveMove, type Aabb, type CollisionSetup } from "./collision";
import { makeWorld, setWorldPlacement, worldPlacementOf, type SceneObject, type World } from "./object_model";
import type { Placed } from "./mate_connector";
import { mulberry32 } from "./random_pose";
import { ORBIT_START_YAW_RAD } from "./scene_dims";
import { add, dot, IDENTITY, length, normalize, qAngle, qconj, qFromAxisAngle, qmul, qRotate, qSlerp, scale, sub, type Quat, type Vec3 } from "./vec";

/** ⭐ What a player does, as the demo plays it (forwards). ⛔ `YAW` is gone with the scatter (`D174`). */
export type DemoMoveKind = "SNAP" | "APPROACH" | "ALIGN" | "TRANSLATE" | "LIFT";

/**
 * ⭐⭐ `D174` — **A PIECE'S CHAIN, PLAYED FORWARDS**: lifted off its grid cell, carried to the spot in front of its slot,
 * turned upright there, approached, seated. 150 moves = 30 pieces × these 5.
 */
export const DEMO_CHAIN: readonly DemoMoveKind[] = ["LIFT", "TRANSLATE", "ALIGN", "APPROACH", "SNAP"];

export interface DemoPose {
  readonly position: Triple;
  /** `[w, x, y, z]`. */
  readonly orientation: readonly [number, number, number, number];
}

export interface DemoMove {
  readonly kind: DemoMoveKind;
  readonly body: string;
  /** ⭐ `SNAP` only: the neighbour whose face the piece seats against. */
  readonly pioneer?: string;
  readonly from: DemoPose;
  readonly to: DemoPose;
  /**
   * ⭐ `D174`, `TRANSLATE` only: the corners of a path that goes OVER the build — `from` → each `via` → `to`, straight
   * legs, the orientation unchanged. Absent: one straight leg.
   */
  readonly via?: readonly Triple[];
  /** ⭐ Distance (along the legs) + angle × the piece's half-diagonal, authored units — what the playback times it by. */
  readonly travel: number;
}

export interface DemoPlan {
  readonly seed: number;
  /** ⭐ The cube the build's moves stay inside (`DEMO_SCENE.md` §3). */
  readonly volume: Aabb;
  /**
   * ⭐ `D174`: the floor GRID's box — where the start configuration lies, just outside the cube toward the boot camera,
   * from the floor to the thickest flat piece's top, its cells' gutters included. A move may use the cube and this,
   * never more (`demoReach`).
   */
  readonly stage: Aabb;
  /** ⭐ PLAY order: the first move is played first. */
  readonly moves: readonly DemoMove[];
  /** ⭐ The start pose of every piece a move touches; the others start at their final pose. */
  readonly start: Readonly<Record<string, DemoPose>>;
}

export interface DemoOptions {
  readonly seed: number;
  /** ⭐ A multiple of 5 (`DEMO_CHAIN`): `D171`'s 150 = 30 pieces. */
  readonly moveCount: number;
  readonly snapGap: number;
  readonly estrange: readonly [number, number];
  readonly skin: number;
  readonly segment: number;
  readonly tries: number;
  /** ⭐ A face must overlap its neighbour by this much, on both of its axes, to be a seat. */
  readonly minContact: number;
  /** ⭐ `D171`: after its estrangement a piece is at least this far from every other body — truly CLEAR. */
  readonly clearance: number;
  /** ⭐ `D174`: the grid's cell — every piece takes a whole number of cells, gutter included. */
  readonly gridPitch: number;
  /** ⭐ `D174`: the least gutter between two pieces on the grid, and between two rows. */
  readonly gridGap: number;
  /** ⭐ `D174`/`D175`: how far outside the cube's front face the longest piece's far end lies, when the floor allows. */
  readonly gridOffset: number;
  /**
   * ⭐ `D174`: the colour groups' order on the grid, as body colours; a colour not listed follows, in the order of its
   * first body in the scene. `Scene_1`: white, black, yellow, red, blue (`SCENE1_DEMO_OPTIONS`).
   */
  readonly colourOrder?: readonly Triple[];
  /**
   * ⭐ `D177` (the owner: *"randomly roll the parts when they are laid on the floor at start by up to 1.5 degrees negative
   * or positive to give a natural feel"* — *"I was meaning yaw, not roll"*): each piece on the grid is turned about the
   * VERTICAL by a random angle in ±this, degrees. It stays flat on the floor.
   */
  readonly startYawDeg: number;
  /**
   * ⭐ `D177` (the owner: *"randomly misalign the face facing camera by up to 1 pixel negative or positive in depth
   * axis"*): each piece on the grid is shifted along depth by a random amount in ±this, authored units. ⚠ A PIXEL is a
   * size on the glass and the plan is fixed data, so it is fixed at what one CSS pixel covers AT THE GRID in the start
   * view on the reference tablet (882 × 1304 portrait, fov 0.8, the grid ~2.15 m from the camera): `2 × 2.15 × tan 0.4 /
   * 1304` = **1.4 mm** = 0.014 units. On another screen it is a little more or less than a pixel.
   */
  readonly startJitter: number;
}

/** ⭐ The owner: *"the camera shall orbit uniformly towards the right"* — one full turn over the demo. */
export const DEMO_ORBIT_TURNS = 1;

/** ⭐ `D171` (the owner: *"the final configuration shall be reached when the camera still has 15 degrees yaw to orbit"*). */
export const DEMO_TAIL_DEG = 15;

/**
 * ⭐ `D175` (the owner, 2026-09-30: *"start the camera 15degrees orbit yaw before current start camera position"*): the
 * demo's camera starts this far BEFORE the boot yaw — to the left, since it orbits to the right — and still ENDS where it
 * did, at the boot yaw a turn on (the level's own front view, where the player takes over). So it turns 375°.
 */
export const DEMO_START_BEFORE_DEG = 15;

/** ⭐ `D175`: the whole orbit, degrees — one turn and the 15° it starts before. */
const DEMO_ORBIT_DEG = 360 * DEMO_ORBIT_TURNS + DEMO_START_BEFORE_DEG;

/**
 * ⭐⭐ `D171` — **WHERE THE MOVES END, as a fraction of the demo**. The camera turns at a steady rate `ω` while the
 * moves play (the orbit less 15°), then DECELERATES uniformly to rest over the last 15° — which, arriving at zero
 * speed, takes `2 × 15° / ω`. So the moves take `(orbit − 15) / (orbit + 15)` of the demo: 360 / 390 = 0.923 since
 * `D175`'s 375° orbit (345 / 375 = 0.92 before).
 */
export const DEMO_MOVES_END = (DEMO_ORBIT_DEG - DEMO_TAIL_DEG) / (DEMO_ORBIT_DEG + DEMO_TAIL_DEG);

/** ⭐ `D171`: the MOVES' own progress ∈ [0, 1] at the demo's `progress` — 1 from `DEMO_MOVES_END` on. */
export function movesProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress) / DEMO_MOVES_END);
}

/**
 * ⭐ The demo camera's yaw at the DEMO's `progress` ∈ [0, 1] — to the RIGHT (increasing yaw carries the camera to its
 * right): uniform while the moves play, then (`D171`) slowing uniformly into the final yaw, which it reaches at rest as
 * the demo ends. ⭐ Here, in `core/`, because the GENERATOR needs it too: it aims each piece at the camera.
 */
export function demoYawAt(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  const total = (DEMO_ORBIT_DEG * Math.PI) / 180;
  const tail = (DEMO_TAIL_DEG * Math.PI) / 180;
  const start = ORBIT_START_YAW_RAD - (DEMO_START_BEFORE_DEG * Math.PI) / 180; // ⭐ `D175`
  const omega = (total - tail) / DEMO_MOVES_END; // rad per unit of progress
  if (p <= DEMO_MOVES_END) return start + omega * p;
  const u = p - DEMO_MOVES_END;
  const span = 1 - DEMO_MOVES_END;
  return start + (total - tail) + omega * u - (omega * u * u) / (2 * span);
}

/** ⭐ The horizontal direction from the orbit centre toward the camera at `yawRad` (`orbitOffset`'s own). */
export function towardCamera(yawRad: number): Vec3 {
  return [Math.cos(yawRad), 0, Math.sin(yawRad)];
}

/** ⭐ `DEMO_SCENE.md` §4 — `Scene_1`'s numbers, in its authored units. */
export const DEMO_DEFAULTS: DemoOptions = {
  seed: 1,
  // ⭐ `D171` (the owner, 2026-09-29: *"150 movements instead of 30"*).
  moveCount: 150,
  snapGap: 0.3,
  estrange: [1.0, 1.6],
  skin: 0.003,
  segment: 0.1,
  tries: 60,
  minContact: 0.02,
  clearance: 0.15,
  // ⭐ `D174`: a 5 mm grid, 1 cm gutters, 3 cm outside the cube (`D175`: one rank, lengthwise in depth).
  gridPitch: 0.05,
  gridGap: 0.1,
  gridOffset: 0.3,
  // ⭐ `D177`: a natural feel — ±1.5° of yaw, ±1 pixel (1.4 mm) along depth.
  startYawDeg: 1.5,
  startJitter: 0.014,
};

/**
 * ⭐ `D177` — **EACH PIECE'S NATURAL IMPERFECTION** on the grid: a yaw about the vertical (radians) and a shift along
 * depth (authored units), drawn from the seed AND the piece — its own stream, so the draw does not depend on which pieces
 * come off or in what order, and the rest of the generator's random sequence is untouched.
 */
export function naturalOf(scene: SceneDescriptor, id: string, opt: Pick<DemoOptions, "seed" | "startYawDeg" | "startJitter">): { yaw: number; dz: number } {
  const i = scene.bodies.findIndex((b) => b.id === id);
  const r = mulberry32(opt.seed * 7919 + 104729 * (i + 1));
  return { yaw: ((r() * 2 - 1) * opt.startYawDeg * Math.PI) / 180, dz: (r() * 2 - 1) * opt.startJitter };
}

/** ⭐ `D174`: the box that holds the cube AND the floor grid — every move of the plan stays inside it. */
export function demoReach(plan: Pick<DemoPlan, "volume" | "stage">): Aabb {
  const { volume: v, stage: s } = plan;
  return {
    min: [Math.min(v.min[0], s.min[0]), v.min[1], Math.min(v.min[2], s.min[2])],
    max: [Math.max(v.max[0], s.max[0]), v.max[1], Math.max(v.max[2], s.max[2])],
  };
}

/**
 * ⭐⭐ `D174` — **A PIECE LAID FLAT** (the owner: *"aligned with the floor"*): resting on its LARGEST face — its
 * smallest side vertical. ⭐ `D175` (the owner: *"present their longest dimension towards the depth axis"*): its longest
 * side along world `z` (depth), the middle one along `x`. Four square orientations do that (the half-turns); they are
 * returned nearest the final one (identity) first.
 */
export function flatOrientations(dims: Vec3): Quat[] {
  const order = [0, 1, 2].sort((a, b) => dims[b]! - dims[a]! || a - b);
  const axis = (i: number): Vec3 => [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0];
  const q90 = [0, 1, 2, 3].map((k) => (k * Math.PI) / 2);
  const seen = new Map<string, Quat>();
  for (const a of q90)
    for (const b of q90)
      for (const c of q90) {
        const q = canonical(qmul(qFromAxisAngle([0, 1, 0], a), qmul(qFromAxisAngle([1, 0, 0], b), qFromAxisAngle([0, 0, 1], c))));
        const long = qRotate(q, axis(order[0]!));
        const short = qRotate(q, axis(order[2]!));
        if (Math.abs(Math.abs(long[2]) - 1) > 1e-9 || Math.abs(Math.abs(short[1]) - 1) > 1e-9) continue;
        // ⭐ `q` and `−q` are one turn: `canonical` settles the sign by `w` alone, so a half-turn (`w = 0`) needs
        // the first non-zero component positive too, or it is counted twice.
        const lead = q.find((v) => Math.abs(v) > 1e-9)!;
        const r = q.map((v) => Math.round((lead < 0 ? -v : v) * 1e9) / 1e9 + 0) as unknown as Quat;
        seen.set(r.join(","), r);
      }
  return [...seen.values()].sort((p, q) => qAngle(p) - qAngle(q) || p.join(",").localeCompare(q.join(",")));
}

/** ⭐ `D175`: the half-sizes of a piece laid flat, in world axes — `[middle, smallest, longest] / 2`. */
function flatHalf(dims: Vec3): Vec3 {
  const s = [...dims].sort((a, b) => b - a);
  return [s[1]! / 2, s[2]! / 2, s[0]! / 2];
}

const sameColour = (a: Triple, b: Triple): boolean => a.every((v, i) => Math.abs(v - b[i]!) < 1e-9);

/**
 * ⭐⭐⭐ `D174` — **THE FLOOR GRID** (the owner: *"set on the floor on a virtual grid (do not show any grid), ordered by
 * color and inside the color groups by descending size"*, *"in front, just outside the demo cube"*). Where each of
 * `ids` rests at the start, laid flat, and the grid's box. Colour groups in `colourOrder`, each by CORE volume, largest
 * first (ties: the scene's order). ⭐ `D175`: each piece LENGTHWISE in depth, between the floor's edge and the cube.
 * ⭐⭐ `D176` (the owner: *"make two or three rows of parts instead of one unique row. If required to fit the parts,
 * reverse the order of alignment along longest dimension every second row. The rows do not need to be justified"*):
 * **TWO ROWS THAT INTERLOCK** in that one strip —
 * * **row 1**, left to right, its NEAR ends (lowest `z`) flush on a line half a gutter in from the floor's edge;
 * * **row 2**, the order continuing RIGHT TO LEFT, its FAR ends flush on a line `gridOffset` outside the cube (nearer the
 *   floor's edge if its longest piece needs it): each piece slid from where the one before ended to the first place
 *   where it clears row 1 by a gutter — a long piece opposite short ones. So the rows are ragged, not justified.
 * The split between the rows is the one that makes the whole narrowest; the whole is centred across the cube. Each
 * piece takes a whole number of `gridPitch` cells across — its width and a `gridGap` gutter.
 * ⚠ A THIRD row cannot interlock: it would share row 1's line. ⛔ Nothing is drawn. ⛔ A grid that leaves the floor, or
 * a piece that would reach into the cube, THROWS.
 */
export function demoGrid(
  scene: SceneDescriptor,
  ids: readonly string[],
  volume: Aabb,
  opt: Pick<DemoOptions, "gridPitch" | "gridGap" | "gridOffset" | "colourOrder" | "seed" | "startYawDeg" | "startJitter">,
): { rest: Map<string, Vec3>; stage: Aabb } {
  const floor = [...scene.bodies].filter((b) => b.frozen).sort((a, b) => Math.max(...contourDims(b)) - Math.max(...contourDims(a)))[0];
  if (!floor) throw new Error(`${scene.id}: a demo grid needs a floor (a frozen body)`);
  const fd = contourDims(floor);
  const floorTop = floor.position[1] + fd[1] / 2;
  const order: Triple[] = [...(opt.colourOrder ?? [])];
  for (const b of scene.bodies) if (!b.frozen && !order.some((c) => sameColour(c, b.colour))) order.push(b.colour);
  const index = new Map(scene.bodies.map((b, i) => [b.id, i]));
  const spec = (id: string) => scene.bodies.find((b) => b.id === id) ?? (() => { throw new Error(`${scene.id}: no body ${id}`); })();
  const sorted = [...ids].sort((a, b) => {
    const A = spec(a), B = spec(b);
    const ga = order.findIndex((c) => sameColour(c, A.colour)), gb = order.findIndex((c) => sameColour(c, B.colour));
    const va = A.dims[0] * A.dims[1] * A.dims[2], vb = B.dims[0] * B.dims[1] * B.dims[2];
    return ga - gb || vb - va || index.get(a)! - index.get(b)!;
  });
  const p = opt.gridPitch;
  const snap = (z: number) => Math.round(z / p) * p;
  const halves = sorted.map((id) => flatHalf(contourDims(spec(id)) as unknown as Vec3));
  // ⭐ `D177`: a turned piece is wider by its length × sin(yaw) and its corners pass its ends by half its width × sin(yaw);
  // with the depth jitter, all paid for here — so the gutters stay whole.
  const yawMax = (opt.startYawDeg * Math.PI) / 180;
  const cells = halves.map((h) => Math.ceil((2 * h[0] + 2 * h[2] * Math.sin(yawMax) + opt.gridGap) / p - 1e-9));
  const grow = (i: number) => halves[i]![0] * Math.sin(yawMax) + opt.startJitter;
  const lengthOf = (i: number) => 2 * halves[i]![2];
  const fx = [floor.position[0] - fd[0] / 2, floor.position[0] + fd[0] / 2];
  const fz = [floor.position[2] - fd[2] / 2, floor.position[2] + fd[2] / 2];
  const front = volume.min[2];
  // ⭐ Row 1's line: half a gutter in from the floor's edge — the most room for the two rows to interlock.
  // ⭐ `D177`: far enough in that a turned, shifted piece's corner stays on the floor (half a gutter before `D177`).
  const edgeGrow = Math.max(...halves.map((_, i) => grow(i)));
  const near = Math.ceil((fz[0]! + Math.max(opt.gridGap / 2, edgeGrow)) / p - 1e-9) * p;

  type Laid = { i: number; x0: number; z0: number; z1: number };
  const layout = (split: number): { laid: Laid[]; width: number; far: number } | null => {
    const laid: Laid[] = [];
    let x = 0;
    for (let i = 0; i < split; i++) {
      laid.push({ i, x0: x, z0: near, z1: near + lengthOf(i) });
      x += cells[i]!;
    }
    const long2 = Math.max(0, ...sorted.slice(split).map((_, k) => lengthOf(split + k)));
    const far = snap(Math.max(front - opt.gridOffset, near + long2));
    if (far >= front) return null;
    // ⭐ Row 2, right to left, each piece at the first place from the cursor that clears row 1 by a gutter.
    let cursor = x;
    for (let i = split; i < sorted.length; i++) {
      const z0 = far - lengthOf(i), z1 = far;
      let right = cursor;
      for (;;) {
        const left = right - cells[i]!;
        const hit = laid.filter((l) => l.i < split && l.x0 < right && l.x0 + cells[l.i]! > left && !(l.z1 + grow(l.i) + opt.gridGap + grow(i) <= z0 + 1e-9 || z1 + opt.gridGap <= l.z0 + 1e-9));
        if (hit.length === 0) break;
        right = Math.min(...hit.map((l) => l.x0));
      }
      laid.push({ i, x0: right - cells[i]!, z0, z1 });
      cursor = right - cells[i]!;
    }
    const lo = Math.min(...laid.map((l) => l.x0));
    const hi = Math.max(...laid.map((l) => l.x0 + cells[l.i]!));
    return { laid, width: hi - lo, far };
  };
  let best: { laid: Laid[]; width: number; far: number } | null = null;
  for (let split = 1; split < sorted.length; split++) {
    const l = layout(split);
    if (l && (!best || l.width < best.width)) best = l;
  }
  if (!best) best = sorted.length === 1 ? layout(1) : null;
  if (!best) throw new Error(`${scene.id}: the demo grid's pieces cannot lie between the floor's edge and the cube`);
  const minCell = Math.min(...best.laid.map((l) => l.x0));
  const centreX = (volume.min[0] + volume.max[0]) / 2;
  const originX = Math.round((centreX - (best.width * p) / 2) / p) * p - minCell * p;
  const rest = new Map<string, Vec3>();
  const lo: [number, number, number] = [Infinity, floorTop, Math.max(fz[0]!, near - opt.gridGap / 2 - edgeGrow)];
  const hi: [number, number, number] = [-Infinity, floorTop, -Infinity];
  for (const l of best.laid) {
    const h = halves[l.i]!;
    // ⭐ `D177`: turned a little about the vertical (`generateDemoPlan` gives it that orientation) and shifted along depth.
    rest.set(sorted[l.i]!, [originX + (l.x0 + cells[l.i]! / 2) * p, floorTop + h[1], (l.z0 + l.z1) / 2 + naturalOf(scene, sorted[l.i]!, opt).dz]);
    lo[0] = Math.min(lo[0], originX + l.x0 * p);
    hi[0] = Math.max(hi[0], originX + (l.x0 + cells[l.i]!) * p);
    hi[1] = Math.max(hi[1], floorTop + 2 * h[1]);
    hi[2] = Math.max(hi[2], l.z1 + grow(l.i) + opt.gridGap / 2);
  }
  if (lo[0] < fx[0]! || hi[0] > fx[1]! || lo[2] < fz[0]! - 1e-9)
    throw new Error(`${scene.id}: the demo grid (x ${lo[0].toFixed(2)}…${hi[0].toFixed(2)}, z from ${lo[2].toFixed(2)}) leaves the floor`);
  if (hi[2] - opt.gridGap / 2 >= front)
    throw new Error(`${scene.id}: the demo grid's longest piece reaches into the cube from the floor's edge`);
  return { rest, stage: { min: lo, max: hi } };
}

/**
 * ⭐⭐ **THE DEMO VOLUME** (the owner: *"a cube of half the largest dimension of the floor, centered on the
 * camera orbit center at boot"*): the floor is the frozen body with the largest horizontal extent; the
 * centre is `orbit.centreM` in authored units (the origin when the scene has none).
 */
export function demoVolume(scene: SceneDescriptor): Aabb {
  const floors = scene.bodies.filter((b) => b.frozen);
  if (floors.length === 0) throw new Error(`${scene.id}: a demo volume needs a floor (a frozen body)`);
  const largest = Math.max(...floors.map((b) => Math.max(...contourDims(b))));
  const unitM = scene.unitM ?? 1;
  const c = scene.orbit?.centreM ?? [0, 0, 0];
  const centre: Vec3 = [c[0] / unitM, c[1] / unitM, c[2] / unitM];
  const h = largest / 4;
  return { min: [centre[0] - h, centre[1] - h, centre[2] - h], max: [centre[0] + h, centre[1] + h, centre[2] + h] };
}

const round = (v: number): number => {
  const r = Math.round(v * 1e6) / 1e6;
  return Object.is(r, -0) ? 0 : r;
};
const toPose = (p: Placed): DemoPose => ({
  position: [round(p.position[0]), round(p.position[1]), round(p.position[2])],
  orientation: canonical(p.orientation).map(round) as unknown as DemoPose["orientation"],
});
const canonical = (q: Quat): Quat => (q[0] < 0 ? [-q[0], -q[1], -q[2], -q[3]] : q);

/** ⭐ The final pose of every non-frozen body of the scene. */
function finalPoses(scene: SceneDescriptor): Map<string, Placed> {
  if (!scene.final) throw new Error(`${scene.id}: a demo needs a final configuration`);
  const out = new Map<string, Placed>();
  for (const f of scene.final.bodies)
    out.set(f.id, { position: [...f.position], orientation: resolveBootOrientation(f.orientation, []) ?? IDENTITY });
  return out;
}

/** ⭐ The assembled world: every piece at its final pose, every frozen body where the scene puts it. */
function assembledWorld(scene: SceneDescriptor, final: Map<string, Placed>): World {
  const objects: SceneObject[] = scene.bodies.map((b) => ({
    id: b.id,
    local: b.frozen
      ? { position: [...b.position], orientation: resolveBootOrientation(b.orientation, []) ?? IDENTITY }
      : final.get(b.id) ?? (() => { throw new Error(`${scene.id}: ${b.id} has no final pose`); })(),
    parent: null,
    faces: [],
    connectors: [],
    constraints: [],
    frozen: b.frozen,
    shape: boxShape(contourDims(b)),
  }));
  return makeWorld(objects);
}

/** The piece's world box corners. */
function corners(world: World, id: string): Vec3[] {
  const o = world.objects.get(id);
  const at = worldPlacementOf(world, id);
  if (!o?.shape || !at) return [];
  return o.shape.points.map((p) => add(at.position, qRotate(at.orientation, p)));
}

/** ⭐ Every corner of the piece within the volume, `margin` inside its walls. */
function inside(world: World, id: string, v: Aabb, margin: number): boolean {
  return corners(world, id).every((p) => p.every((x, i) => x >= v.min[i]! + margin && x <= v.max[i]! - margin));
}

/**
 * ⭐⭐ **MOVE `id` TO `to` IF THE WHOLE PATH IS FREE** — cut into segments of at most `segment` (a turn
 * counts its sweep), each resolved by the game's own `resolveMove`, which must apply it WHOLE; and at the
 * end of every segment the piece's box must be inside the volume. `null` if anything refuses.
 */
function tryPath(world: World, id: string, to: Placed, setup: CollisionSetup, volume: Aabb, opt: DemoOptions): World | null {
  const from = worldPlacementOf(world, id);
  if (!from) return null;
  const reach = Math.max(...corners(world, id).map((p) => length(sub(p, from.position))));
  const turn = qAngle(qmul(to.orientation, qconj(from.orientation)));
  const travel = length(sub(to.position, from.position)) + turn * reach;
  const n = Math.max(1, Math.ceil(travel / opt.segment));
  // ⛔ FOUND BY THE PLAYBACK'S OWN SAMPLING (a tighter cube): a corner of a TURNING piece sweeps an arc, and
  // between two segment ends it bulges out by up to `R (1 − cos(Δθ / 2))` — 0.47 mm past the wall, measured.
  // ⭐ So each end is checked that far INSIDE the walls (plus the saved plan's 1e-6 rounding): exact, not sampled.
  const margin = reach * (1 - Math.cos(turn / n / 2)) + 2e-6;
  let w = world;
  for (let k = 1; k <= n; k++) {
    const f = k / n;
    const target: Placed = {
      position: add(from.position, scale(sub(to.position, from.position), f)),
      orientation: qSlerp(from.orientation, to.orientation, f),
    };
    const v = resolveMove(w, id, target, setup);
    if (v.t < 1 || v.slid || v.blockedBy !== null) return null;
    w = setWorldPlacement(w, id, target);
    if (!inside(w, id, volume, margin)) return null;
  }
  return w;
}

/** ⭐ `D171`: the least surface gap from the piece to any other body (`Infinity` alone). */
function clearanceOf(world: World, id: string): number {
  const mine = corners(world, id);
  let best = Infinity;
  for (const other of world.objects.keys()) {
    if (other === id) continue;
    const g = gapBetween(mine, corners(world, other));
    if (g !== null) best = Math.min(best, g);
  }
  return best;
}

/** ⭐ The piece's travel for timing: distance + angle × half-diagonal. */
function travelOf(world: World, id: string, from: Placed, to: Placed): number {
  const at = worldPlacementOf(world, id)!;
  const reach = Math.max(...corners(world, id).map((p) => length(sub(p, at.position))));
  return length(sub(to.position, from.position)) + qAngle(qmul(to.orientation, qconj(from.orientation))) * reach;
}

/**
 * ⭐ A piece's SEATS: each of its box faces in contact with a neighbour, overlapping it by `minContact` on
 * both face axes. `away` is the direction that leaves the neighbour (the face's inward normal).
 */
export function seatsOf(world: World, id: string, minContact: number): { pioneer: string; away: Vec3 }[] {
  const o = world.objects.get(id);
  const at = worldPlacementOf(world, id);
  if (!o?.shape || !at) return [];
  const h: Vec3 = [0, 1, 2].map((i) => Math.max(...o.shape!.points.map((p) => Math.abs(p[i]!)))) as unknown as Vec3;
  const out: { pioneer: string; away: Vec3 }[] = [];
  const tol = 1e-5;
  for (const q of [...world.objects.keys()].sort()) {
    if (q === id) continue;
    const local = corners(world, q).map((p) => qRotate(qconj(at.orientation), sub(p, at.position)));
    if (local.length === 0) continue;
    for (let i = 0; i < 3; i++)
      for (const s of [1, -1]) {
        const near = Math.min(...local.map((p) => s * p[i]!));
        if (Math.abs(near - h[i]!) > tol) continue;
        const overlaps = [0, 1, 2]
          .filter((j) => j !== i)
          .every((j) => Math.min(h[j]!, Math.max(...local.map((p) => p[j]!))) - Math.max(-h[j]!, Math.min(...local.map((p) => p[j]!))) >= minContact);
        if (!overlaps) continue;
        const axis: [number, number, number] = [0, 0, 0];
        axis[i] = -s;
        out.push({ pioneer: q, away: qRotate(at.orientation, axis) });
      }
  }
  return out;
}

type Reverse = { kind: DemoMoveKind; body: string; pioneer?: string; from: Placed; to: Placed; via?: Vec3[]; travel: number };

const between = (rnd: () => number, lo: number, hi: number): number => lo + (hi - lo) * rnd();
function shuffled<T>(rnd: () => number, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** ⭐ `D174`: how a piece leaves the painting — found in phase A, replayed in phase C. */
type Exit = { id: string; pioneer: string; unsnap: Placed; estrange: Placed; flat: Placed };

/**
 * ⭐⭐ Take `scene`'s final configuration apart in `opt.moveCount` checked reverse moves; return the plan.
 *
 * ⭐⭐⭐ `D174` — **THREE PHASES**, because the grid's order depends on WHICH pieces come off, and that is known only
 * once they have:
 * * **A — who, and how each leaves** (inside the cube): an unsnap off a seat, an estrangement toward the camera that
 *   will watch it go back, and a turn there to lie FLAT. The piece is then parked far away.
 * * **B — the grid**, for that set (`demoGrid`).
 * * **C — the replay**: A's three steps again, then a path from the estrangement spot down onto the piece's cell —
 *   straight, or over the build — and the lowering. ⭐ The grid lies outside the cube and A's steps inside it, so a
 *   piece already on the grid cannot block a replayed step.
 */
export function generateDemoPlan(scene: SceneDescriptor, options: Partial<DemoOptions> = {}): DemoPlan {
  const opt: DemoOptions = { ...DEMO_DEFAULTS, ...options };
  const K = opt.moveCount / DEMO_CHAIN.length;
  if (!Number.isInteger(K) || K < 1)
    throw new Error(`${opt.moveCount} moves cannot be split into chains of ${DEMO_CHAIN.length} (${DEMO_CHAIN.join(", ")})`);
  const rnd = mulberry32(opt.seed);
  const volume = demoVolume(scene);
  const final = finalPoses(scene);
  const assembled = assembledWorld(scene, final);
  const setup: CollisionSetup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: opt.skin };
  const dimsOf = new Map(scene.bodies.map((b) => [b.id, contourDims(b) as unknown as Vec3]));
  const placedAt = (w: World, id: string): Placed => worldPlacementOf(w, id)!;
  const shifted = (w: World, id: string, d: Vec3): Placed => ({ position: add(placedAt(w, id).position, d), orientation: placedAt(w, id).orientation });

  /**
   * ⭐ ESTRANGE, then turn FLAT there: along one world axis, most camera-facing first (`D171`), each at 1×–3× the range
   * and truly clear (`clearance`); then the nearest flat orientation the piece can turn to about its centre, inside
   * the cube. `null` if no spot allows both.
   */
  const leave = (w1: World, id: string, toCam: Vec3): { estrange: Placed; flat: Placed; world: World } | null => {
    const axes: Vec3[] = ([[0, 0, -1], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0]] as Vec3[])
      .map((a) => ({ a, f: dot(a, toCam) + rnd() * 1e-6 }))
      .sort((p, q) => q.f - p.f)
      .map((x) => x.a);
    // ⛔ FOUND BY THE SHAPE VECTOR: a piece that already lies flat in the painting (a horizontal bar) had an ALIGN of
    // 0° — an empty move, a pause in the demo. ⭐ It is laid down a HALF-TURN away instead: its goal all the same
    // (`D130`: a box's face or its opposite), and the ALIGN is a turn a player would make.
    // ⭐ `D177`: the piece is turned straight into its flat pose AND its little yaw, so the carry and the lift keep one
    // orientation all the way down onto the floor.
    const yaw = naturalOf(scene, id, opt).yaw;
    const flats = flatOrientations(dimsOf.get(id)!)
      .filter((q) => qAngle(q) > 1e-6)
      .map((q) => canonical(qmul(qFromAxisAngle([0, 1, 0], yaw), q)));
    for (const axis of axes)
      for (const far of [1, 1.5, 2, 2.5, 3])
        for (let t = 0; t < 4; t++) {
          const estrange = shifted(w1, id, scale(axis, between(rnd, opt.estrange[0], opt.estrange[1]) * far));
          const wE = tryPath(w1, id, estrange, setup, volume, opt);
          if (!wE || clearanceOf(wE, id) < opt.clearance) continue;
          for (const q of flats) {
            const flat: Placed = { position: estrange.position, orientation: q };
            const wT = tryPath(wE, id, flat, setup, volume, opt);
            if (wT) return { estrange, flat, world: wT };
          }
        }
    return null;
  };

  // ⭐ A — who comes off, in which order, and how each leaves the painting.
  let world = assembled;
  const exits: Exit[] = [];
  for (let k = 0; k < K; k++) {
    // ⭐⭐ `D171`: WHERE THE CAMERA WILL BE when this piece is put back. Chains are taken apart last-played-first, so
    // chain `k` plays as chain `K − 1 − k`, around progress `(K − 1 − k + ½) / K` — ⚠ an estimate: the schedule
    // weighs moves by travel, and the camera turns 360° / K (12° at 30 pieces) over one chain.
    const toCam = towardCamera(demoYawAt(DEMO_MOVES_END * ((K - 1 - k + 0.5) / K)));
    let found: { exit: Exit; world: World } | null = null;
    for (const id of shuffled(rnd, [...final.keys()].filter((x) => !exits.some((e) => e.id === x)).sort())) {
      for (const seat of shuffled(rnd, seatsOf(world, id, opt.minContact))) {
        const unsnap = shifted(world, id, scale(seat.away, opt.snapGap));
        const w1 = tryPath(world, id, unsnap, setup, volume, opt);
        if (!w1) continue;
        const out = leave(w1, id, toCam);
        if (!out) continue;
        found = { exit: { id, pioneer: seat.pioneer, unsnap, estrange: out.estrange, flat: out.flat }, world: out.world };
        break;
      }
      if (found) break;
    }
    if (!found) throw new Error(`${scene.id}: no piece can leave its seat and lie flat after ${exits.length} pieces`);
    exits.push(found.exit);
    // ⭐ Parked far away, where nothing can meet it, until phase C puts it on its cell.
    world = setWorldPlacement(found.world, found.exit.id, { position: [1e4 * (k + 1), -1e4, 0], orientation: IDENTITY });
  }

  // ⭐ B — the grid, for the pieces that came off.
  const grid = demoGrid(scene, exits.map((e) => e.id), volume, opt);
  const stage = grid.stage;
  const reach = demoReach({ volume, stage });

  // ⭐ C — the replay, and each piece's way down onto its cell.
  world = assembled;
  const reverse: Reverse[] = [];
  const push = (kind: DemoMoveKind, id: string, to: Placed, box: Aabb, pioneer?: string): void => {
    const from = placedAt(world, id);
    const w = tryPath(world, id, to, setup, box, opt);
    // ⛔ Phase A proved this step with the same neighbours inside the cube; a refusal here is a defect, never a retry.
    if (!w) throw new Error(`${scene.id}: ${id}'s ${kind} could not be replayed`);
    reverse.push({ kind, body: id, from, to, travel: travelOf(world, id, from, to), ...(pioneer ? { pioneer } : {}) });
    world = w;
  };
  for (const e of exits) {
    const id = e.id;
    push("SNAP", id, e.unsnap, volume, e.pioneer);
    push("APPROACH", id, e.estrange, volume);
    push("ALIGN", id, e.flat, volume);
    const E = placedAt(world, id);
    const rest: Placed = { position: grid.rest.get(id)!, orientation: E.orientation };
    const half = flatHalf(dimsOf.get(id)!);
    // ⭐ The lowest height from which the piece clears every piece that can lie on the grid.
    const clear = stage.max[1] + opt.clearance + half[1];
    const top = reach.max[1] - half[1] - 0.01;
    const lifted = (y: number): Placed => ({ position: [rest.position[0], y, rest.position[2]], orientation: E.orientation });
    // ⭐ Routes, tried in order: straight from the spot to just above the cell; straight at the spot's own height;
    // then OVER the build — up from the spot, across, and down onto the cell — at rising heights.
    const routes: Placed[][] = [[lifted(clear)]];
    if (E.position[1] > clear) routes.push([lifted(E.position[1])]);
    for (let i = 0; i <= 8; i++) {
      const y = clear + ((top - clear) * i) / 8;
      if (y > E.position[1]) routes.push([{ position: [E.position[0], y, E.position[2]], orientation: E.orientation }, lifted(y)]);
    }
    // ⭐ `D175`, FOUND BY THE GENERATOR: a piece laid flat LENGTHWISE beside the painting's edge cannot rise straight
    // from its spot — the painting's side column is over it. So: first a step straight AWAY from its slot (the way it
    // was pulled out, flattened), then up, across, and down — at 1 to 3 units out, at rising heights.
    const fin = final.get(id)!.position;
    const away = normalize([E.position[0] - fin[0], 0, E.position[2] - fin[2]]) ?? ([0, 0, -1] as Vec3);
    for (const out of [1, 2, 3]) {
      const P: Vec3 = add(E.position, scale(away, out));
      routes.push([{ position: P, orientation: E.orientation }, lifted(clear)]);
      for (let i = 0; i <= 8; i++) {
        const y = clear + ((top - clear) * i) / 8;
        if (y > P[1]) routes.push([{ position: P, orientation: E.orientation }, { position: [P[0], y, P[2]], orientation: E.orientation }, lifted(y)]);
      }
    }
    let done = false;
    for (const legs of routes) {
      let w: World | null = world;
      for (const to of legs) w = w && tryPath(w, id, to, setup, reach, opt);
      const down = w && tryPath(w, id, rest, setup, reach, opt);
      if (!w || !down) continue;
      const L = legs[legs.length - 1]!;
      const pts = [E, ...legs];
      const travel = pts.slice(1).reduce((s, p, i) => s + length(sub(p.position, pts[i]!.position)), 0);
      reverse.push({ kind: "TRANSLATE", body: id, from: E, to: L, travel, ...(legs.length > 1 ? { via: legs.slice(0, -1).map((p) => p.position) } : {}) });
      reverse.push({ kind: "LIFT", body: id, from: L, to: rest, travel: travelOf(w, id, L, rest) });
      world = down;
      done = true;
      break;
    }
    if (!done) throw new Error(`${scene.id}: ${id} finds no free way down onto its grid cell (from ${E.position.map((v) => v.toFixed(2))}, flat ${E.orientation.map((v) => v.toFixed(2))} to ${rest.position.map((v) => v.toFixed(2))}, clear ${clear.toFixed(2)}, piece ${exits.indexOf(e) + 1}/${K})`);
  }

  // ⭐ Forwards: reversed, each move from its end back to its start (a path's corners in the other order).
  const moves: DemoMove[] = reverse.reverse().map((r) => ({
    kind: r.kind,
    body: r.body,
    ...(r.pioneer ? { pioneer: r.pioneer } : {}),
    from: toPose(r.to),
    to: toPose(r.from),
    ...(r.via ? { via: [...r.via].reverse().map((p) => p.map(round) as unknown as Triple) } : {}),
    travel: round(r.travel),
  }));
  const start: Record<string, DemoPose> = {};
  for (const m of moves) if (!(m.body in start)) start[m.body] = m.from;
  const box = (b: Aabb): Aabb => ({ min: b.min.map(round) as unknown as Vec3, max: b.max.map(round) as unknown as Vec3 });
  return { seed: opt.seed, volume: box(volume), stage: box(stage), moves, start };
}

/**
 * ⭐⭐ `D173` — **A DEMO SCENE, COMPLETED BY ITS PLAN** once the plan has loaded: every piece the plan moves starts at
 * its start pose, and the plan rides on the scene. The shell's other pieces stay where it put them (their final pose).
 */
export function withDemoPlan(shell: SceneDescriptor, plan: DemoPlan): SceneDescriptor {
  return {
    ...shell,
    bodies: shell.bodies.map((b) => {
      const s = plan.start[b.id];
      return s && !b.frozen ? { ...b, position: s.position, orientation: { quat: s.orientation } } : b;
    }),
    demo: plan,
  };
}
