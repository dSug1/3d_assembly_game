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
import { boundsFromShapes, hullAtSpawn, poseFree, resolveMove, type Aabb, type CollisionSetup } from "./collision";
import { makeWorld, setWorldPlacement, worldPlacementOf, type SceneObject, type World } from "./object_model";
import type { Placed } from "./mate_connector";
import { mulberry32 } from "./random_pose";
import { ORBIT_START_YAW_RAD } from "./scene_dims";
import { add, cross, dot, IDENTITY, length, normalize, qAngle, qconj, qFromAxisAngle, qmul, qRotate, qSlerp, scale, sub, type Quat, type Vec3 } from "./vec";

/** ⭐ What a player does, as the demo plays it (forwards). ⛔ `YAW` is gone with the scatter (`D174`). */
export type DemoMoveKind = "SNAP" | "APPROACH" | "ALIGN" | "TRANSLATE" | "LIFT";

/**
 * ⭐⭐ `D174` — **A PIECE'S CHAIN, PLAYED FORWARDS**: lifted off its heap (`D191`), carried to the spot in front of its slot,
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
   * ⭐ `D174`/`D191`: the HEAPS' box — where the start configuration lies, just outside the cube toward the boot camera,
   * with every carry and lift outside the cube, from the floor to the top of the heaps. A move may use the cube and
   * this, never more (`demoReach`).
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
  /**
   * ⭐ `D174`/`D191`: the colour groups' order — the heaps, left to right as the boot camera sees them — as body colours;
   * a colour not listed follows, in the order of its first body in the scene. `Scene_1`: white, black, yellow, red, blue
   * (`SCENE1_DEMO_OPTIONS`).
   */
  readonly colourOrder?: readonly Triple[];
  /** ⭐ `D191`: a heap's width across = `heapWidthK × √(its pieces' flat area) + heapWidthPad`. */
  readonly heapWidthK: number;
  readonly heapWidthPad: number;
  /** ⭐ `D191`: the gap between two heaps' strips, across. */
  readonly heapGap: number;
  /** ⭐ `D191`: a piece's centre is drawn around its heap's centre — σ across = `heapSpread` × the heap's width; σ in depth. */
  readonly heapSpread: number;
  readonly heapSpreadDepth: number;
  /** ⭐ `D191`: the heaps lie at least this far outside the cube's front face, and `heapFloorMargin` in from the floor's edge. */
  readonly heapOffset: number;
  readonly heapFloorMargin: number;
  /** ⭐ `D191`: how far a piece may tilt as it settles — about its width (pitch) and about its length (roll), and the steps. */
  readonly heapPitchDeg: number;
  readonly heapRollDeg: number;
  readonly heapPitchStepDeg: number;
  readonly heapRollStepDeg: number;
  /** ⭐ `D191`: how many spots on its heap a piece is offered before the generation throws. */
  readonly heapTries: number;
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
  // ⭐ `D191`: five small heaps, the snapshot the owner chose (E) — a heap as wide as 1.2 √area + 3 cm, 4 cm apart; a
  // piece dropped within σ = 15 % of its heap across and 5 cm in depth, 3 cm outside the cube; it settles tilted by
  // up to 40° (pitch, 2.5° steps) and 6° (roll, 2° steps) — a pose AT either limit is refused (it would tip further).
  heapWidthK: 1.2,
  heapWidthPad: 0.3,
  heapGap: 0.4,
  heapSpread: 0.15,
  heapSpreadDepth: 0.5,
  heapOffset: 0.3,
  heapFloorMargin: 0.05,
  heapPitchDeg: 40,
  heapRollDeg: 6,
  heapPitchStepDeg: 2.5,
  heapRollStepDeg: 2,
  heapTries: 60,
};

/** ⭐ `D174`/`D191`: the box that holds the cube AND the heaps — every move of the plan stays inside it. */
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

const sameColour = (a: Triple, b: Triple): boolean => a.every((v, i) => Math.abs(v - b[i]!) < 1e-9);

/**
 * ⭐⭐⭐ `D191` — **THE HEAPS** (the owner, 2026-09-30: *"the start configuration is small heaps one per color"*). The
 * strip in front of the cube is cut ACROSS into one heap per colour, in `colourOrder` left to right as the boot camera
 * sees it, each as wide as its pieces need (`heapWidthK × √area + heapWidthPad`), `heapGap` apart, the whole centred on
 * the cube. A heap's pieces are dropped around its centre (`demoGenerate`, phase C); their CENTRES stay inside its strip.
 * `region` is the box every heap piece must lie in: across the heaps, in depth from `heapFloorMargin` inside the floor's
 * edge to `heapOffset` outside the cube, from the floor up to the cube's top. ⛔ Heaps wider than the floor THROW.
 */
export function demoHeaps(scene: SceneDescriptor, ids: readonly string[], volume: Aabb, opt: Pick<DemoOptions, "colourOrder" | "heapWidthK" | "heapWidthPad" | "heapGap" | "heapOffset" | "heapFloorMargin">): DemoHeaps {
  const { floorTop, fx, z0, z1 } = heapStrip(scene, volume, opt);
  const order: Triple[] = [...(opt.colourOrder ?? [])];
  for (const b of scene.bodies) if (!b.frozen && !order.some((c) => sameColour(c, b.colour))) order.push(b.colour);
  const spec = (id: string) => scene.bodies.find((b) => b.id === id) ?? (() => { throw new Error(`${scene.id}: no body ${id}`); })();
  const groups = order
    .map((colour) => ({ colour, ids: ids.filter((id) => sameColour(spec(id).colour, colour)) }))
    .filter((g) => g.ids.length > 0);
  const flatArea = (id: string) => {
    const s = [...contourDims(spec(id))].sort((a, b) => b - a);
    return s[0]! * s[1]!;
  };
  const widths = groups.map((g) => opt.heapWidthK * Math.sqrt(g.ids.reduce((s, id) => s + flatArea(id), 0)) + opt.heapWidthPad);
  const total = widths.reduce((s, w) => s + w, 0) + opt.heapGap * (groups.length - 1);
  const centreX = (volume.min[0] + volume.max[0]) / 2;
  let x = centreX - total / 2;
  const heaps: DemoHeap[] = groups.map((g, i) => {
    const h: DemoHeap = { colour: g.colour, ids: g.ids, x0: x, x1: x + widths[i]!, centre: [x + widths[i]! / 2, (z0 + z1) / 2] };
    x += widths[i]! + opt.heapGap;
    return h;
  });
  const lo = heaps[0]!.x0, hi = heaps[heaps.length - 1]!.x1;
  if (lo < fx[0] || hi > fx[1]) throw new Error(`${scene.id}: the demo heaps (x ${lo.toFixed(2)}…${hi.toFixed(2)}) leave the floor`);
  // ⭐ A piece's centre stays in its heap's strip, and its body may reach half its length beyond — within the floor.
  const reachOut = Math.max(0, ...ids.map((id) => Math.max(...contourDims(spec(id))) / 2));
  const region: Aabb = {
    min: [Math.max(fx[0] + opt.heapFloorMargin, lo - reachOut), floorTop, z0],
    max: [Math.min(fx[1] - opt.heapFloorMargin, hi + reachOut), volume.max[1], z1],
  };
  const of = new Map<string, number>();
  heaps.forEach((h, i) => h.ids.forEach((id) => of.set(id, i)));
  return { heaps, of, region, floorTop };
}

/**
 * ⭐ `D191`: the STRIP the heaps lie in — in depth from `heapFloorMargin` inside the floor's edge to `heapOffset` outside
 * the cube (`z0`–`z1`), the floor's extent across (`fx`) and its top. ⛔ No room between them THROWS.
 */
export function heapStrip(scene: SceneDescriptor, volume: Aabb, opt: Pick<DemoOptions, "heapOffset" | "heapFloorMargin">): { floorTop: number; fx: readonly [number, number]; z0: number; z1: number } {
  const floor = [...scene.bodies].filter((b) => b.frozen).sort((a, b) => Math.max(...contourDims(b)) - Math.max(...contourDims(a)))[0];
  if (!floor) throw new Error(`${scene.id}: demo heaps need a floor (a frozen body)`);
  const fd = contourDims(floor);
  const z0 = floor.position[2] - fd[2] / 2 + opt.heapFloorMargin;
  const z1 = volume.min[2] - opt.heapOffset;
  if (z1 <= z0) throw new Error(`${scene.id}: no room for the demo heaps between the floor's edge and the cube`);
  return { floorTop: floor.position[1] + fd[1] / 2, fx: [floor.position[0] - fd[0] / 2, floor.position[0] + fd[0] / 2], z0, z1 };
}

/** ⭐ `D191`: one heap — its colour, its pieces, its strip across (`x0`–`x1`) and its centre `[x, z]`. */
export interface DemoHeap {
  readonly colour: Triple;
  readonly ids: readonly string[];
  readonly x0: number;
  readonly x1: number;
  readonly centre: readonly [number, number];
}

/** ⭐ `D191`: the heaps, which heap each piece belongs to, the box they lie in and the floor's top. */
export interface DemoHeaps {
  readonly heaps: readonly DemoHeap[];
  readonly of: Map<string, number>;
  readonly region: Aabb;
  readonly floorTop: number;
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

/** ⭐ A normal draw (Box–Muller) from the generator's stream. */
function gauss(rnd: () => number): number {
  const u = Math.max(1e-12, rnd());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

/** ⭐ `D191`: how far a box of `dims` reaches up and down from its centre at `q`. */
function verticalHalf(dims: Vec3, q: Quat): number {
  return [0, 1, 2].reduce((s, i) => s + (Math.abs(qRotate(q, [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0])[1]) * dims[i]!) / 2, 0);
}

/**
 * ⭐⭐ Take `scene`'s final configuration apart in `opt.moveCount` checked reverse moves; return the plan.
 *
 * ⭐⭐⭐ `D174` — **THREE PHASES**, because the heaps' layout depends on WHICH pieces come off, and that is known only
 * once they have:
 * * **A — who, and how each leaves** (inside the cube): an unsnap off a seat, an estrangement toward the camera that
 *   will watch it go back, and a check that it has room to turn flat there. The piece is then parked far away.
 * * **B — the heaps**, for that set (`demoHeaps`, `D191`).
 * * **C — the replay**: A's two moves again; then a spot on the piece's heap and the pose it SETTLES in there
 *   (`settle`), the turn at the estrangement spot into that pose, a path down onto it — straight, or over the build —
 *   and the lowering. ⭐⭐ The pieces reach their heaps IN THE ORDER THEY COME OFF, each settling onto the ones already
 *   there: played forwards, the last one down is the first one lifted, so every piece is lifted from the top of its
 *   heap — the lowering it reverses was checked against exactly the pieces then on the heaps.
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
  const strip = heapStrip(scene, volume, opt);
  /** ⭐ `D191`: a piece longer than 80 % of the heaps' strip is deep — it can lie only ACROSS it. */
  const isLong = (id: string): boolean => Math.max(...dimsOf.get(id)!) > 0.8 * (strip.z1 - strip.z0);
  const shifted = (w: World, id: string, d: Vec3): Placed => ({ position: add(placedAt(w, id).position, d), orientation: placedAt(w, id).orientation });

  /**
   * ⭐ ESTRANGE, then check it can turn FLAT there: along one world axis, most camera-facing first (`D171`), each at
   * 1×–3× the range and truly clear (`clearance`); then the nearest flat orientation the piece can turn to about its
   * centre, inside the cube. `null` if no spot allows both. ⭐ `D191`: the turn actually played is into its HEAP pose
   * (phase C) — this one proves the spot has room for a turn of that kind.
   */
  const leave = (w1: World, id: string, toCam: Vec3): { estrange: Placed; flat: Placed; world: World } | null => {
    const axes: Vec3[] = ([[0, 0, -1], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0]] as Vec3[])
      .map((a) => ({ a, f: dot(a, toCam) + rnd() * 1e-6 }))
      .sort((p, q) => q.f - p.f)
      .map((x) => x.a);
    // ⛔ FOUND BY THE SHAPE VECTOR: a piece that already lies flat in the painting (a horizontal bar) had an ALIGN of
    // 0° — an empty move, a pause in the demo. ⭐ It is laid down a HALF-TURN away instead: its goal all the same
    // (`D130`: a box's face or its opposite), and the ALIGN is a turn a player would make.
    const flats = flatOrientations(dimsOf.get(id)!).filter((q) => qAngle(q) > 1e-6);
    // ⛔ FOUND BY THE GENERATOR (`D191`): the 48 cm bar, pulled out SIDEWAYS beside the painting, could lie flat only
    // pointing in depth there — which no heap strip 46.5 cm deep holds. ⭐ A piece longer than 80 % of the strip's depth
    // lies ACROSS it (phase C), so the spot it is pulled to must have room for THAT turn.
    const across = isLong(id) ? qFromAxisAngle([0, 1, 0], Math.PI / 2) : IDENTITY;
    for (const axis of axes)
      for (const far of [1, 1.5, 2, 2.5, 3])
        for (let t = 0; t < 4; t++) {
          const estrange = shifted(w1, id, scale(axis, between(rnd, opt.estrange[0], opt.estrange[1]) * far));
          const wE = tryPath(w1, id, estrange, setup, volume, opt);
          if (!wE || clearanceOf(wE, id) < opt.clearance) continue;
          for (const q of flats) {
            const wT = tryPath(wE, id, { position: estrange.position, orientation: canonical(qmul(across, q)) }, setup, volume, opt);
            // ⭐ the flat face-down kept is the un-turned one: phase C adds the turn across itself
            if (wT) return { estrange, flat: { position: estrange.position, orientation: q }, world: wT };
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
    // ⭐ Parked far away, where nothing can meet it, until phase C puts it on its heap.
    world = setWorldPlacement(found.world, found.exit.id, { position: [1e4 * (k + 1), -1e4, 0], orientation: IDENTITY });
  }

  // ⭐ B — the heaps, for the pieces that came off. ⭐ Their region is the stage while the plan is made, so every move
  // is checked inside the reach the plan will carry.
  const heaps = demoHeaps(scene, exits.map((e) => e.id), volume, opt);
  const region = heaps.region;
  const reach = demoReach({ volume, stage: region });
  let heapTop = heaps.floorTop;

  const isFree = (w: World, id: string, at: Placed): boolean => poseFree(w, setWorldPlacement(w, id, at), [id], id, setup).free;
  const tilts = (max: number, step: number): number[] => {
    const out: number[] = [];
    for (let a = 0; a <= max + 1e-9; a += step) out.push(...(a === 0 ? [0] : [a, -a]));
    return out.map((a) => (a * Math.PI) / 180);
  };
  const pitches = tilts(opt.heapPitchDeg, opt.heapPitchStepDeg);
  const rolls = tilts(opt.heapRollDeg, opt.heapRollStepDeg);
  const pitchMax = Math.max(...pitches.map(Math.abs));
  const rollMax = Math.max(...rolls.map(Math.abs));

  /**
   * ⭐⭐ `D191` — **HOW A PIECE SETTLES ON ITS HEAP**: dropped straight down at `(x, z)` in its flat pose `base`, tilted
   * about its WIDTH (a pitch, up to `heapPitchDeg`) and its LENGTH (a roll, up to `heapRollDeg`); for each tilt it comes
   * down from above the heaps until it first TOUCHES the floor or a piece already there (`poseFree`, contact allowed —
   * `D136`), and of all the tilts it keeps the one whose CENTRE ends LOWEST — where a rigid body comes to rest: one end
   * on the floor and the other on a piece, flat on a piece that holds it whole, or flat on the floor. Every corner inside
   * the heaps' region. `null` if no tilt lands there.
   */
  /**
   * ⭐⭐ `D191` — **A REST THAT HOLDS**: ⛔ FOUND BY THE VECTOR — the lowest landing at a FIXED centre is not physics: a
   * piece could balance on one edge of another, its other half over nothing, and a real one would tip. ⭐ So a landing is
   * kept only if a small turn about its centre, either way about its WIDTH and either way about its LENGTH, presses into
   * something (`poseFree` refuses it, deeper than the skin) — whatever side of it goes down is held. A piece flat on the
   * floor, flat on a piece under its centre, or leaning with an end on the floor and its high side on a piece, holds.
   */
  const stable = (rest: World, id: string, at: Placed): boolean => {
    const d = dimsOf.get(id)!;
    const order = [0, 1, 2].sort((a, b) => d[b]! - d[a]! || a - b);
    const axis = (i: number): Vec3 => qRotate(at.orientation, [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]);
    // about the WIDTH the lever is half the length; about the LENGTH, half the width — each turn 3 skins deep at its end
    const turns: [number, number][] = [
      [order[1]!, d[order[0]!]! / 2],
      [order[0]!, d[order[1]!]! / 2],
    ];
    for (const [about, lever] of turns) {
      const delta = Math.min((10 * Math.PI) / 180, Math.asin(Math.min(1, (3 * opt.skin) / lever)));
      for (const s of [1, -1]) {
        const turned: Placed = { position: at.position, orientation: qmul(qFromAxisAngle(axis(about), s * delta), at.orientation) };
        if (poseFree(rest, setWorldPlacement(rest, id, turned), [id], id, setup).free) return false;
      }
    }
    return true;
  };

  const settle = (w: World, id: string, x: number, z: number, base: Quat, floorOnly: boolean): Placed | null => {
    const d = dimsOf.get(id)!;
    const longI = [0, 1, 2].sort((a, b) => d[b]! - d[a]! || a - b)[0]!;
    const longW = qRotate(base, [longI === 0 ? 1 : 0, longI === 1 ? 1 : 0, longI === 2 ? 1 : 0]);
    const widthW = normalize(cross([0, 1, 0], longW)) ?? ([1, 0, 0] as Vec3);
    type Landing = { at: Placed; y: number; p: number; r: number };
    /** ⭐ Drop the piece at tilt (`p`, `r`) from above the heaps until it first touches; `null` if it cannot land in the region. */
    const drop = (p: number, r: number, beat: number): Landing | null => {
      const q = canonical(qmul(qFromAxisAngle(widthW, p), qmul(qFromAxisAngle(longW, r), base)));
      const vh = verticalHalf(d, q);
      const yLow = heaps.floorTop + vh;
      if (yLow >= beat - 1e-9) return null; // ⭐ it cannot come to rest lower than on the floor
      const at = (y: number): Placed => ({ position: [x, y, z], orientation: q });
      const yTop = heapTop + vh + opt.clearance;
      if (!isFree(w, id, at(yTop))) return null;
      let free = yTop;
      let blocked: number | null = null;
      for (let y = yTop - opt.segment; y > yLow; y -= opt.segment) {
        if (isFree(w, id, at(y))) free = y;
        else {
          blocked = y;
          break;
        }
      }
      if (blocked === null) {
        if (isFree(w, id, at(yLow))) free = yLow;
        else blocked = yLow;
      }
      if (blocked !== null) {
        let lo: number = blocked;
        for (let i = 0; i < 16; i++) {
          const mid: number = (free + lo) / 2;
          if (isFree(w, id, at(mid))) free = mid;
          else lo = mid;
        }
      }
      // ⛔ FOUND BY THE VECTOR: the drop stops where the contact rule's tolerance runs out — the piece a SKIN deep in
      // what holds it, and the saved plan's rounding then tipped one past it. ⭐ It rests a skin higher: touching.
      free += opt.skin;
      if (free >= beat - 1e-9) return null;
      return { at: at(free), y: free, p, r };
    };
    // ⭐ `floorOnly`: the fallback — flat, and only where it lies ON THE FLOOR (beside the heap, not on it).
    const pairs = floorOnly
      ? [[0, 0] as const]
      : pitches
          .flatMap((p) => rolls.map((r) => [p, r] as const))
          .sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]));
    let coarse: Landing | null = null;
    for (const [p, r] of pairs) {
      const l: Landing | null = drop(p, r, coarse ? coarse.y : Infinity);
      if (l) coarse = l;
    }
    if (!coarse) return null;
    if (floorOnly && coarse.y > heaps.floorTop + verticalHalf(d, coarse.at.orientation) + 2 * opt.skin) return null;
    const isEdge = (l: Landing) => Math.abs(l.p) >= pitchMax - 1e-9 || Math.abs(l.r) >= rollMax - 1e-9;
    // ⭐ A lowest pose AT a tilt limit is not a rest: the piece would tip further than the search looks — refused.
    if (isEdge(coarse)) return null;
    const pStep = (opt.heapPitchStepDeg * Math.PI) / 180, rStep = (opt.heapRollStepDeg * Math.PI) / 180;
    const fine = 0.1 * (Math.PI / 180);
    /** ⭐ A landing made exact and judged: its rest, or `null` if it leaves the strip or does not hold. */
    const rest = (from: Landing): Placed | null => {
      // ⛔ FOUND BY THE VECTOR: on the coarse steps a leaning piece could stop with its support 11 mm away — the true
      // rest lies between two steps. ⭐ So the tilt is searched again finely around the coarse one, pitch then roll.
      let best = from;
      const p0 = best.p;
      for (let t = -pStep; t <= pStep + 1e-12; t += fine) best = drop(p0 + t, best.r, best.y) ?? best;
      const r0 = best.r;
      for (let t = -rStep; t <= rStep + 1e-12; t += fine) best = drop(best.p, r0 + t, best.y) ?? best;
      // ⛔ FOUND BY THE VECTOR: the heaps' strip was a filter INSIDE the search, so a 48 cm bar that did not fit lying
      // flat was tilted until it did — standing at 37° against nothing. ⭐ The rest is found as if the strip were not
      // there, and a spot whose rest leaves it is refused.
      const cs = corners(setWorldPlacement(w, id, best.at), id);
      if (cs.some((c) => c[0] < region.min[0] || c[0] > region.max[0] || c[2] < region.min[2] || c[2] > region.max[2])) return null;
      return stable(setWorldPlacement(w, id, best.at), id, best.at) ? best.at : null;
    };
    const first = rest(coarse);
    if (first) return first;
    // ⛔ FOUND BY THE GENERATOR: a bar balanced on ONE support at its lowest landing tips, and the pose it tips into — an
    // end down, resting on that support — lands its centre no lower, so the lowest-first search never reached it. ⭐ When
    // the lowest landing does not hold, the next-lowest are tried in order, and the first that holds is its rest.
    // (the pitches alone, rolled 0: the tip is about the width)
    const others = pitches
      .map((p) => drop(p, 0, Infinity))
      .filter((l): l is Landing => l !== null && !isEdge(l) && (l.p !== coarse.p || l.r !== coarse.r))
      .sort((x, y) => x.y - y.y)
      .slice(0, 6);
    for (const l of others) {
      const at = rest(l);
      if (at) return at;
    }
    return null;
  };

  // ⭐ C — the replay; each piece settles on its heap, in the order it comes off.
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
    const E = placedAt(world, id);
    const heap = heaps.heaps[heaps.of.get(id)!]!;
    const width = heap.x1 - heap.x0;
    const flats = [e.flat.orientation, ...flatOrientations(dimsOf.get(id)!).filter((q) => qAngle(qmul(q, qconj(e.flat.orientation))) > 1e-6)];
    const long = isLong(id);
    let done = false;
    for (let attempt = 0; attempt < opt.heapTries && !done; attempt++) {
      // ⭐ A spot on its heap: the centre drawn around the heap's, kept inside its strip; any yaw. ⭐ After half its
      // tries, a piece that finds no rest ON its heap lies flat on free FLOOR beside it — anywhere in the strip's depth,
      // within a heap and a half of its heap's centre (the 48 cm bar, longer than the strip is deep, needed it: found
      // by the generator).
      const beside = attempt >= opt.heapTries / 2;
      const x = beside
        ? heap.centre[0] + (rnd() * 2 - 1) * 1.5 * width
        : Math.min(heap.x1, Math.max(heap.x0, heap.centre[0] + gauss(rnd) * opt.heapSpread * width));
      const z = beside ? between(rnd, region.min[2], region.max[2]) : heap.centre[1] + gauss(rnd) * opt.heapSpreadDepth;
      // ⭐ Beside its heap — or on it, for a piece longer than 80 % of the strip's depth, which fits no other way — a piece
      // lies ACROSS the strip, along the row of heaps, within 20°. ⭐ Each try lays it on the next of its four flat
      // faces-down (the half-turns), so a turn at its estrangement spot that one blocks, another may not.
      const across = beside || long;
      const yaw = across ? Math.PI / 2 + (rnd() * 2 - 1) * ((20 * Math.PI) / 180) : rnd() * Math.PI;
      const base = canonical(qmul(qFromAxisAngle([0, 1, 0], yaw), flats[attempt % flats.length]!));
      const rest = settle(world, id, x, z, base, beside);
      if (!rest) continue;
      // ⭐ The ALIGN (played: from the heap pose to upright) — about the centre, at the estrangement spot, in the cube.
      const T: Placed = { position: E.position, orientation: rest.orientation };
      const wA = tryPath(world, id, T, setup, volume, opt);
      if (!wA) continue;
      const vh = verticalHalf(dimsOf.get(id)!, rest.orientation);
      // ⭐ The lowest height from which the piece clears every piece on the heaps now.
      const clear = Math.max(heapTop + opt.clearance + vh, rest.position[1]);
      const top = reach.max[1] - vh - 0.01;
      const lifted = (y: number): Placed => ({ position: [rest.position[0], y, rest.position[2]], orientation: rest.orientation });
      // ⭐ Routes, tried in order: straight from the spot to just above its place on the heap; straight at the spot's
      // own height; then OVER the build — up from the spot, across, and down — at rising heights.
      const routes: Placed[][] = [[lifted(clear)]];
      if (T.position[1] > clear) routes.push([lifted(T.position[1])]);
      for (let i = 0; i <= 8; i++) {
        const y = clear + ((top - clear) * i) / 8;
        if (y > T.position[1]) routes.push([{ position: [T.position[0], y, T.position[2]], orientation: T.orientation }, lifted(y)]);
      }
      // ⭐ `D175`, FOUND BY THE GENERATOR: a piece beside the painting's edge cannot rise straight from its spot — the
      // painting's side column is over it. So: first a step straight AWAY from its slot (the way it was pulled out,
      // flattened), then up, across, and down — at 1 to 3 units out, at rising heights.
      const fin = final.get(id)!.position;
      const away = normalize([T.position[0] - fin[0], 0, T.position[2] - fin[2]]) ?? ([0, 0, -1] as Vec3);
      for (const out of [1, 2, 3]) {
        const P: Vec3 = add(T.position, scale(away, out));
        routes.push([{ position: P, orientation: T.orientation }, lifted(clear)]);
        for (let i = 0; i <= 8; i++) {
          const y = clear + ((top - clear) * i) / 8;
          if (y > P[1]) routes.push([{ position: P, orientation: T.orientation }, { position: [P[0], y, P[2]], orientation: T.orientation }, lifted(y)]);
        }
      }
      for (const legs of routes) {
        let w: World | null = wA;
        for (const to of legs) w = w && tryPath(w, id, to, setup, reach, opt);
        const down = w && tryPath(w, id, rest, setup, reach, opt);
        if (!w || !down) continue;
        push("ALIGN", id, T, volume);
        const L = legs[legs.length - 1]!;
        const pts = [T, ...legs];
        const travel = pts.slice(1).reduce((s, p, i) => s + length(sub(p.position, pts[i]!.position)), 0);
        reverse.push({ kind: "TRANSLATE", body: id, from: T, to: L, travel, ...(legs.length > 1 ? { via: legs.slice(0, -1).map((p) => p.position) } : {}) });
        reverse.push({ kind: "LIFT", body: id, from: L, to: rest, travel: travelOf(w, id, L, rest) });
        world = down;
        heapTop = Math.max(heapTop, ...corners(world, id).map((c) => c[1]));
        done = true;
        break;
      }
    }
    if (!done) throw new Error(`${scene.id}: ${id} finds no place on its heap it can be put down on (piece ${exits.indexOf(e) + 1}/${K}, ${opt.heapTries} tries)`);
  }
  // ⭐ The stage — what the camera frames at the start and what the reach adds to the cube: across and in depth, every
  // corner OUTSIDE the cube of every piece on its heap and along every carry and lift (straight legs, so their ends
  // bound them); in height, the floor to the top of the heaps.
  const outside: Vec3[] = [];
  for (const r of reverse)
    if (r.kind === "TRANSLATE" || r.kind === "LIFT")
      for (const at of [r.from, r.to, ...(r.via ?? []).map((v) => ({ position: v, orientation: r.from.orientation }))])
        outside.push(...corners(setWorldPlacement(world, r.body, at), r.body).filter((c) => c[0] < volume.min[0] || c[0] > volume.max[0] || c[2] < volume.min[2] || c[2] > volume.max[2]));
  const stage: Aabb = {
    min: [Math.min(...outside.map((c) => c[0])), heaps.floorTop, Math.min(...outside.map((c) => c[2]))],
    max: [Math.max(...outside.map((c) => c[0])), heapTop, Math.max(...outside.map((c) => c[2]))],
  };

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
