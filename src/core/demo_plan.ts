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

/** ⭐ What a player does, as the demo plays it (forwards). */
export type DemoMoveKind = "SNAP" | "APPROACH" | "ALIGN" | "TRANSLATE" | "LIFT" | "YAW";

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
  /** ⭐ Distance + angle × the piece's half-diagonal, authored units — what the playback times it by. */
  readonly travel: number;
}

export interface DemoPlan {
  readonly seed: number;
  /** ⭐ The cube every piece stays inside (`DEMO_SCENE.md` §3). */
  readonly volume: Aabb;
  /** ⭐ PLAY order: the first move is played first. */
  readonly moves: readonly DemoMove[];
  /** ⭐ The start pose of every piece a move touches; the others start at their final pose. */
  readonly start: Readonly<Record<string, DemoPose>>;
}

export interface DemoOptions {
  readonly seed: number;
  readonly moveCount: number;
  readonly snapGap: number;
  readonly estrange: readonly [number, number];
  readonly skin: number;
  readonly segment: number;
  readonly tries: number;
  /** ⭐ A face must overlap its neighbour by this much, on both of its axes, to be a seat. */
  readonly minContact: number;
  /**
   * ⭐ The moves per piece, `[min, max]` — at least 4 (unsnap, estrange, unalign, translate). `D171`: `[5, 5]`, the
   * owner's hypothesis *"30 pieces, 5 movements each"*.
   */
  readonly chain: readonly [number, number];
  /** ⭐ `D171`: after its estrangement a piece is at least this far from every other body — truly CLEAR. */
  readonly clearance: number;
  /**
   * ⭐ `D171` (the owner: *"bring the pieces towards where the camera will be when the pieces are re-assembled"*): a
   * scattered piece's centre lies at least this far from the orbit centre TOWARD that camera, horizontally.
   */
  readonly facing: number;
}

/** ⭐ The owner: *"the camera shall orbit uniformly towards the right"* — one full turn over the demo. */
export const DEMO_ORBIT_TURNS = 1;

/** ⭐ `D171` (the owner: *"the final configuration shall be reached when the camera still has 15 degrees yaw to orbit"*). */
export const DEMO_TAIL_DEG = 15;

/**
 * ⭐⭐ `D171` — **WHERE THE MOVES END, as a fraction of the demo**. The camera turns at a steady rate `ω` while the
 * moves play (`360° × turns − 15°`), then DECELERATES uniformly to rest over the last 15° — which, arriving at zero
 * speed, takes `2 × 15° / ω`. So the moves take `(360 T − 15) / (360 T + 15)` of the demo: 345 / 375 = 0.92 at one turn.
 */
export const DEMO_MOVES_END = (360 * DEMO_ORBIT_TURNS - DEMO_TAIL_DEG) / (360 * DEMO_ORBIT_TURNS + DEMO_TAIL_DEG);

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
  const total = 2 * Math.PI * DEMO_ORBIT_TURNS;
  const tail = (DEMO_TAIL_DEG * Math.PI) / 180;
  const omega = (total - tail) / DEMO_MOVES_END; // rad per unit of progress
  if (p <= DEMO_MOVES_END) return ORBIT_START_YAW_RAD + omega * p;
  const u = p - DEMO_MOVES_END;
  const span = 1 - DEMO_MOVES_END;
  return ORBIT_START_YAW_RAD + (total - tail) + omega * u - (omega * u * u) / (2 * span);
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
  chain: [5, 5],
  clearance: 0.15,
  facing: 1.5,
};

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

type Reverse = { kind: DemoMoveKind; body: string; pioneer?: string; from: Placed; to: Placed; travel: number };

const between = (rnd: () => number, lo: number, hi: number): number => lo + (hi - lo) * rnd();
function shuffled<T>(rnd: () => number, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
/**
 * ⭐ Chain lengths in `[lo, hi]` summing to `total`, drawn at random; ⛔ throws when no such split exists (a total
 * below `lo`, or one no mix of lengths reaches — 150 in chains of exactly 5 is 30 chains, 151 is none).
 */
function chains(rnd: () => number, total: number, [lo, hi]: readonly [number, number]): number[] {
  if (lo < 4 || hi < lo) throw new Error(`a chain needs at least 4 moves (unsnap, estrange, unalign, translate), got [${lo}, ${hi}]`);
  // ⭐ reach[n]: can `n` moves be split into chains of `lo`..`hi`?
  const reach = [true];
  for (let n = 1; n <= total; n++) reach.push([...Array(hi - lo + 1).keys()].some((k) => n - lo - k >= 0 && reach[n - lo - k]!));
  if (!reach[total]) throw new Error(`${total} moves cannot be split into chains of ${lo}–${hi} moves`);
  const out: number[] = [];
  let left = total;
  while (left > 0) {
    const ok = [...Array(hi - lo + 1).keys()].map((k) => lo + k).filter((p) => left - p >= 0 && reach[left - p]);
    const p = ok[Math.floor(rnd() * ok.length)]!;
    out.push(p);
    left -= p;
  }
  return out;
}

/** ⭐⭐ Take `scene`'s final configuration apart in `opt.moveCount` checked reverse moves; return the plan. */
export function generateDemoPlan(scene: SceneDescriptor, options: Partial<DemoOptions> = {}): DemoPlan {
  const opt: DemoOptions = { ...DEMO_DEFAULTS, ...options };
  const rnd = mulberry32(opt.seed);
  const volume = demoVolume(scene);
  const final = finalPoses(scene);
  let world = assembledWorld(scene, final);
  const setup: CollisionSetup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: opt.skin };
  const reverse: Reverse[] = [];
  const out = new Set<string>();

  const step = (kind: DemoMoveKind, id: string, to: Placed, pioneer?: string): boolean => {
    const from = worldPlacementOf(world, id)!;
    const w = tryPath(world, id, to, setup, volume, opt);
    if (!w) return false;
    reverse.push({ kind, body: id, from, to, travel: travelOf(world, id, from, to), ...(pioneer ? { pioneer } : {}) });
    world = w;
    return true;
  };
  const at = (id: string): Placed => worldPlacementOf(world, id)!;
  const moved = (id: string, d: Vec3): Placed => ({ position: add(at(id).position, d), orientation: at(id).orientation });
  const turned = (id: string, axis: Vec3, rad: number): Placed => ({
    position: at(id).position,
    orientation: canonical(qmul(qFromAxisAngle(axis, rad), at(id).orientation)),
  });

  const plan = chains(rnd, opt.moveCount, opt.chain);
  const centre: Vec3 = [0, 1, 2].map((i) => (volume.min[i]! + volume.max[i]!) / 2) as unknown as Vec3;
  for (const [k, length_] of plan.entries()) {
    // ⭐⭐ `D171`: WHERE THE CAMERA WILL BE when this piece is put back. Chains are taken apart last-played-first, so
    // chain `k` plays as chain `K − 1 − k`, around progress `(K − 1 − k + ½) / K` — ⚠ an estimate: the schedule
    // weighs moves by travel, and the camera turns 360° / K (12° at 30 pieces) over one chain.
    const toCam = towardCamera(demoYawAt(DEMO_MOVES_END * ((plan.length - 1 - k + 0.5) / plan.length)));
    // ⭐ 1. UNSNAP — a piece with a seat it can leave, chosen at random among those that can.
    let piece: string | null = null;
    for (const id of shuffled(rnd, [...final.keys()].filter((k) => !out.has(k)).sort())) {
      for (const seat of shuffled(rnd, seatsOf(world, id, opt.minContact)))
        if (step("SNAP", id, moved(id, scale(seat.away, opt.snapGap)), seat.pioneer)) {
          piece = id;
          break;
        }
      if (piece) break;
    }
    if (!piece) throw new Error(`${scene.id}: no piece can leave its seat after ${reverse.length} moves`);
    out.add(piece);
    const id = piece;

    // ⭐ 2. ESTRANGE — along one world axis, toward the boot camera (−z) first.
    // ⭐ `D171`: the horizontal axis most toward that camera first (was always −z), then the others by how far they face it.
    const axes: Vec3[] = ([[0, 0, -1], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0]] as Vec3[])
      .map((a) => ({ a, f: dot(a, toCam) + rnd() * 1e-6 }))
      .sort((p, q) => q.f - p.f)
      .map((x) => x.a);
    let done = false;
    let pulled: Vec3 = [0, 1, 0];
    // ⛔ `D171`, FOUND AT 150 MOVES: with −z crowded, a pull along `+y` slid a piece up INSIDE the painting's plane,
    // into a hole a removed piece had left — never clear, and with no room to turn. ⭐ An estrangement must now end
    // `clearance` away from every other body; else another axis, farther (up to twice the range) is tried.
    // ⭐ Each axis, most camera-facing first, at 1×, 1.5× and 2× the range. ⚠ Measured on seed 1: sorting by facing is
    // what counts (the −z-first rule sent 16 of 30 pieces out behind, worst −1.00; this sends 1, worst −0.29); a second
    // pass that exhausted the facing axes first added nothing and was deleted.
    const order = axes.flatMap((a) => [1, 1.5, 2].map((far) => ({ a, far })));
    for (let t = 0; t < order.length * 4 && !done; t++) {
      const { a: axis, far } = order[Math.floor(t / 4)]!;
      const to = moved(id, scale(axis, between(rnd, opt.estrange[0], opt.estrange[1]) * far));
      const w = tryPath(world, id, to, setup, volume, opt);
      if (!w || clearanceOf(w, id) < opt.clearance) continue;
      done = step("APPROACH", id, to);
      if (done) pulled = axis;
    }
    if (!done) throw new Error(`${scene.id}: ${id} cannot be pulled clear`);

    // ⭐ 3. UNALIGN — a random turn about the centre, shrinking; then (`D171`) about the axis it was pulled out
    // along, which keeps it parallel to where it came from — a wide piece just out of the painting has room for
    // nothing else; the last resort a turn about the vertical.
    done = false;
    for (let t = 0; t < opt.tries && !done; t++) {
      const shrink = 1 - t / opt.tries;
      const axis =
        t >= opt.tries - 10
          ? ([0, 1, 0] as Vec3)
          : t >= opt.tries - 30
            ? pulled
            : normalize([rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]) ?? ([0, 1, 0] as Vec3);
      const deg = between(rnd, 30, 120) * shrink + 5;
      done = step("ALIGN", id, turned(id, axis, ((rnd() < 0.5 ? -1 : 1) * deg * Math.PI) / 180));
    }
    if (!done) throw new Error(`${scene.id}: ${id} cannot be turned`);

    // ⭐ 4. TRANSLATE, then LIFT / YAW in a random order — a kind that fails is replaced by another.
    const extras: DemoMoveKind[] = ["TRANSLATE", ...shuffled(rnd, ["LIFT", "YAW"] as DemoMoveKind[])];
    let made = 0;
    for (let k = 0; made < length_ - 3; k++) {
      if (k > opt.tries) throw new Error(`${scene.id}: ${id} cannot be scattered`);
      const kind = k < extras.length ? extras[k]! : (["TRANSLATE", "LIFT", "YAW"] as DemoMoveKind[])[Math.floor(rnd() * 3)]!;
      let ok = false;
      for (let t = 0; t < opt.tries * (kind === "TRANSLATE" ? 3 : 1) && !ok; t++) {
        const p = at(id).position;
        if (kind === "TRANSLATE") {
          // ⭐ `D171`: a spot on the CAMERA's side — `facing` or more out from the centre toward it, anywhere across;
          // drawn in the camera's own frame (drawing the whole cube and rejecting wasted most tries, measured).
          const half = (volume.max[0] - volume.min[0]) / 2;
          const along = between(rnd, opt.facing, half * Math.SQRT2);
          const across = between(rnd, -half * Math.SQRT2, half * Math.SQRT2);
          const x = centre[0] + toCam[0] * along - toCam[2] * across;
          const z = centre[2] + toCam[2] * along + toCam[0] * across;
          if (x < volume.min[0] || x > volume.max[0] || z < volume.min[2] || z > volume.max[2]) continue;
          ok = step(kind, id, moved(id, [x - p[0], 0, z - p[2]]));
        } else if (kind === "LIFT") {
          const y = between(rnd, volume.min[1], volume.max[1]);
          ok = step(kind, id, moved(id, [0, y - p[1], 0]));
        } else {
          const deg = between(rnd, 30, 150) * (rnd() < 0.5 ? -1 : 1);
          ok = step(kind, id, turned(id, [0, 1, 0], (deg * Math.PI) / 180));
        }
      }
      if (ok) made++;
    }
  }

  // ⭐ Forwards: reversed, each move from its end back to its start.
  const moves: DemoMove[] = reverse.reverse().map((r) => ({
    kind: r.kind,
    body: r.body,
    ...(r.pioneer ? { pioneer: r.pioneer } : {}),
    from: toPose(r.to),
    to: toPose(r.from),
    travel: round(r.travel),
  }));
  const start: Record<string, DemoPose> = {};
  for (const m of moves) if (!(m.body in start)) start[m.body] = m.from;
  return { seed: opt.seed, volume: { min: volume.min.map(round) as unknown as Vec3, max: volume.max.map(round) as unknown as Vec3 }, moves, start };
}
