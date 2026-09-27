/**
 * ⭐⭐⭐ **COLLISION — no body penetrates another** (`3D6`, `D116`; the owner, 2026-09-27).
 *
 * Design of record: [`Claude/30_OBJECTS_3D/spec/COLLISION.md`]. ⛔ ENGINE-FREE.
 *
 * ⭐⭐ **THE TWO SOURCES ARE SEAMS** — `CollisionShapeSource` and `BoundsSource`. The owner: *"Make
 * sure it is modular, and can be later replaced by the collision shapes authored in Blender"* and
 * the same for the bounding box. Today: the convex hull computed at spawn (`hullAtSpawn`) and its
 * box (`boundsFromShapes`); later, `UCX_` pieces and an authored box (`3D8`, `3D9`) — one new
 * implementation each, and nothing below changes. ⭐ A body is a LIST of convex parts already, a
 * list of one today, so the Blender pieces are not a signature change.
 *
 * ⭐ **THE MOVE** (`resolveMove`): a pose change is tested whole; if it penetrates, the largest
 * fraction `t` of it that does not is kept — position LERPED, orientation SLERPED, so a clamped
 * turn keeps **the axis of the asked turn** (the owner: *"i do not want to switch rotation axis if
 * there is a collision because quaternion are not commutable and the user cannot go back"*). A
 * PURE translation then SLIDES the rest along the contact; a rotation never slides.
 *
 * ⛔ **"PENETRATES" IS READ AS A SKIN.** GJK answers `0` for touching AND for overlapping, so a
 * body is kept at least `skinM` from every other; a pair already inside the skin may move only in
 * ways that do not bring it closer — so a body resting in contact can always leave.
 */
import { gapBetween, separationBetween } from "./collision_shape";
import { setWorldPlacement, worldPlacementOf, type ObjectId, type World } from "./object_model";
import type { Placed } from "./mate_connector";
import { add, dot, length, qAngle, qmul, qRotate, qSlerp, scale, sub, type Vec3 } from "./vec";

/** One convex piece of a body, in its LOCAL frame. */
export type ConvexPart = readonly Vec3[];

/** ⭐ SEAM 1 — where a body's collision shape comes from. */
export interface CollisionShapeSource {
  partsOf(world: World, id: ObjectId): readonly ConvexPart[] | null;
}

/** An axis-aligned box. */
export interface Aabb {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** ⭐ SEAM 2 — where a body's bounding box comes from, in its LOCAL frame. */
export interface BoundsSource {
  boundsOf(world: World, id: ObjectId): Aabb | null;
}

/** ⭐ TODAY's shape: the one convex hull computed at spawn from the mesh (`SceneObject.shape`). */
export const hullAtSpawn: CollisionShapeSource = {
  partsOf(world, id) {
    const pts = world.objects.get(id)?.shape?.points;
    return pts && pts.length > 0 ? [pts] : null;
  },
};

/** ⭐ TODAY's bounds: the box of whatever the shape source answers. */
export function boundsFromShapes(shapes: CollisionShapeSource): BoundsSource {
  return {
    boundsOf(world, id) {
      const parts = shapes.partsOf(world, id);
      if (!parts) return null;
      const min: [number, number, number] = [Infinity, Infinity, Infinity];
      const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
      for (const part of parts)
        for (const p of part)
          for (let i = 0; i < 3; i++) {
            min[i] = Math.min(min[i]!, p[i]!);
            max[i] = Math.max(max[i]!, p[i]!);
          }
      return Number.isFinite(min[0]) ? { min, max } : null;
    },
  };
}

/** Everything the rules need besides the world. */
export interface CollisionSetup {
  readonly shapes: CollisionShapeSource;
  readonly bounds: BoundsSource;
  /** The distance every pair is kept apart, world metres. */
  readonly skinM: number;
  /** Pairs that never collide — the render layer's snapping and just-unsnapped couples. */
  readonly exempt?: (a: ObjectId, b: ObjectId) => boolean;
}

/** The body and every body seated below it — what moves when it moves. */
export function subtreeOf(world: World, id: ObjectId): ObjectId[] {
  const out: ObjectId[] = [id];
  for (let i = 0; i < out.length; i++)
    for (const [cid, o] of world.objects) if (o.parent === out[i] && !out.includes(cid)) out.push(cid);
  return out;
}

/** The root of the assembly a body belongs to (itself when it is not seated). */
export function rootOf(world: World, id: ObjectId): ObjectId {
  let cur = id;
  for (let depth = 0; depth < 64; depth++) {
    const p = world.objects.get(cur)?.parent ?? null;
    if (p === null) return cur;
    cur = p;
  }
  return cur;
}

function worldParts(world: World, id: ObjectId, shapes: CollisionShapeSource): Vec3[][] | null {
  const parts = shapes.partsOf(world, id);
  const at = worldPlacementOf(world, id);
  if (!parts || !at) return null;
  return parts.map((part) => part.map((p) => add(at.position, qRotate(at.orientation, p))));
}

function worldBox(world: World, id: ObjectId, bounds: BoundsSource): Aabb | null {
  const b = bounds.boundsOf(world, id);
  const at = worldPlacementOf(world, id);
  if (!b || !at) return null;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let c = 0; c < 8; c++) {
    const local: Vec3 = [
      c & 1 ? b.max[0] : b.min[0],
      c & 2 ? b.max[1] : b.min[1],
      c & 4 ? b.max[2] : b.min[2],
    ];
    const w = add(at.position, qRotate(at.orientation, local));
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i]!, w[i]!);
      max[i] = Math.max(max[i]!, w[i]!);
    }
  }
  return { min, max };
}

function boxesNear(a: Aabb, b: Aabb, margin: number): boolean {
  for (let i = 0; i < 3; i++)
    if (a.min[i]! - margin > b.max[i]! || b.min[i]! - margin > a.max[i]!) return false;
  return true;
}

/** The min gap between two lists of world parts — `null` when either is empty. */
function partsGap(a: readonly Vec3[][], b: readonly Vec3[][]): number | null {
  let best: number | null = null;
  for (const pa of a)
    for (const pb of b) {
      const g = gapBetween(pa, pb);
      if (g !== null && (best === null || g < best)) best = g;
    }
  return best;
}

/**
 * ⭐ The pairs a moving set can hit: every body outside the moving body's ASSEMBLY (its members
 * never collide with each other — `COLLISION.md` §5), not exempt, whose box is within `margin`.
 * ⛔ The broad phase is a filter, never a verdict: a pair it keeps is still judged by GJK.
 */
function candidates(
  world: World,
  moving: readonly ObjectId[],
  assemblyRoot: ObjectId,
  setup: CollisionSetup,
  margin: number,
): [ObjectId, ObjectId][] {
  const out: [ObjectId, ObjectId][] = [];
  for (const m of moving) {
    const mb = worldBox(world, m, setup.bounds);
    if (!mb) continue;
    for (const o of world.objects.keys()) {
      if (moving.includes(o) || rootOf(world, o) === assemblyRoot) continue;
      if (setup.exempt?.(m, o)) continue;
      const ob = worldBox(world, o, setup.bounds);
      if (ob && boxesNear(mb, ob, margin)) out.push([m, o]);
    }
  }
  return out;
}

/**
 * ⭐⭐ **IS THIS POSE CHANGE ALLOWED?** Every candidate pair must stay at least `skinM` apart — or,
 * already inside the skin before, must not come any closer. `before` and `after` differ only in
 * where `moving` is.
 */
export function poseFree(
  before: World,
  after: World,
  moving: readonly ObjectId[],
  assemblyRoot: ObjectId,
  setup: CollisionSetup,
): { free: boolean; blockedBy: ObjectId | null } {
  for (const [m, o] of candidates(after, moving, assemblyRoot, setup, setup.skinM)) {
    const ma = worldParts(after, m, setup.shapes);
    const oa = worldParts(after, o, setup.shapes);
    if (!ma || !oa) continue;
    const gNew = partsGap(ma, oa);
    if (gNew === null || gNew >= setup.skinM) continue;
    const mb = worldParts(before, m, setup.shapes);
    const gOld = mb ? partsGap(mb, oa) : null;
    if (gOld !== null && gNew >= gOld - 1e-12) continue;
    return { free: false, blockedBy: o };
  }
  return { free: true, blockedBy: null };
}

/** ⭐ The largest `t ∈ [0, 1]` the predicate accepts, by bisection. `0` when none does. */
export function largestFreeFraction(isFreeAt: (t: number) => boolean, iterations = 14): number {
  if (isFreeAt(1)) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (isFreeAt(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * ⭐⭐⭐ The pose at fraction `t` of a change: position LERPED, orientation SLERPED. ⛔ `slerp(a, b,
 * t) = Δᵗ·a` where `Δ = b·a⁻¹` — so the partial turn has **the same axis as the whole one**. This is
 * the owner's rule made arithmetic.
 */
export function blendPlacement(from: Placed, to: Placed, t: number): Placed {
  return {
    position: add(from.position, scale(sub(to.position, from.position), t)),
    orientation: qSlerp(from.orientation, to.orientation, t),
  };
}

/** ⭐ The slide: the part of `rest` that pushes INTO the contact (`n` points away from it) is removed. */
export function slideAlong(rest: Vec3, n: Vec3): Vec3 {
  const into = dot(rest, n);
  return into < 0 ? sub(rest, scale(n, into)) : rest;
}

/** What `resolveMove` decided. */
export interface MoveVerdict {
  readonly placed: Placed;
  /** The fraction of the asked change that was applied before any slide. */
  readonly t: number;
  readonly slid: boolean;
  readonly blockedBy: ObjectId | null;
}

const sameQuat = (a: readonly number[], b: readonly number[]): boolean =>
  a.every((v, i) => Math.abs(v - b[i]!) <= 1e-12);

/** ⛔ The most substeps one move is cut into — a bound on the work, stated. */
export const MAX_SUBSTEPS = 64;

/**
 * ⭐⭐ **HOW FAR ALONG `from → to` THE SUBTREE MAY GO** — checked ALONG THE PATH, never at the
 * end only: a step long enough to carry a body clean through another has a free end pose, and an
 * endpoint test would let it TUNNEL. ⭐ The path is cut into substeps no longer than the skin (the
 * furthest any point moves: `|Δp| + θ·R`, capped at `MAX_SUBSTEPS`); the first blocked substep is
 * bisected.
 */
function advance(
  world: World,
  id: ObjectId,
  moving: readonly ObjectId[],
  root: ObjectId,
  from: Placed,
  to: Placed,
  setup: CollisionSetup,
): { t: number; blockedBy: ObjectId | null } {
  const at = (f: number): World => setWorldPlacement(world, id, blendPlacement(from, to, f));
  // ⭐ The furthest any point of the subtree moves over the whole change.
  let reach = 0;
  for (const m of moving) {
    for (const part of worldParts(world, m, setup.shapes) ?? [])
      for (const p of part) reach = Math.max(reach, length(sub(p, from.position)));
  }
  const d = qmul(to.orientation, [from.orientation[0], -from.orientation[1], -from.orientation[2], -from.orientation[3]]);
  const travel = length(sub(to.position, from.position)) + qAngle(d) * reach;
  const n = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(travel / Math.max(setup.skinM, 1e-12))));
  let prev = 0;
  let prevWorld = world;
  for (let k = 1; k <= n; k++) {
    const f = k / n;
    const w = at(f);
    const v = poseFree(prevWorld, w, moving, root, setup);
    if (!v.free) {
      const lo = prev;
      const base = prevWorld;
      const t = lo + (f - lo) * largestFreeFraction((u) => poseFree(base, at(lo + (f - lo) * u), moving, root, setup).free);
      return { t, blockedBy: v.blockedBy };
    }
    prev = f;
    prevWorld = w;
  }
  return { t: 1, blockedBy: null };
}

/**
 * ⭐⭐⭐ **THE RULE** — move `id` (and its seated subtree) toward `target`, as far as it may go.
 *
 * 1. Along the path, the largest free fraction `t` is kept (`blendPlacement`: a turn keeps its axis).
 * 2. A PURE translation that stopped then SLIDES: the unused `(1 − t)` of the step, minus its
 *    component into the contact (GJK's separation at the stop), is applied the same way.
 *    ⛔ A rotation never slides.
 * ⛔ The excess is DISCARDED — never stored — so reversing the input moves the body back at once.
 */
export function resolveMove(
  world: World,
  id: ObjectId,
  target: Placed,
  setup: CollisionSetup,
): MoveVerdict {
  const from = worldPlacementOf(world, id);
  if (!from) return { placed: target, t: 1, slid: false, blockedBy: null };
  const moving = subtreeOf(world, id);
  const root = rootOf(world, id);
  const first = advance(world, id, moving, root, from, target, setup);
  if (first.blockedBy === null) return { placed: target, t: 1, slid: false, blockedBy: null };
  const t = first.t;
  const stopped = blendPlacement(from, target, t);
  const blocker = first.blockedBy;
  if (!sameQuat(from.orientation, target.orientation)) {
    return { placed: stopped, t, slid: false, blockedBy: blocker };
  }
  // ⭐ THE SLIDE — only for a translation. The contact normal is GJK's separation at the stop.
  const stoppedWorld = setWorldPlacement(world, id, stopped);
  const mp = worldParts(stoppedWorld, id, setup.shapes);
  const bp = worldParts(stoppedWorld, blocker, setup.shapes);
  let n: Vec3 | null = null;
  if (mp && bp) {
    let best: Vec3 | null = null;
    for (const a of mp)
      for (const b of bp) {
        const s = separationBetween(a, b);
        if (s && (best === null || length(s) < length(best))) best = s;
      }
    if (best && length(best) > 0) n = scale(best, 1 / length(best));
  }
  if (n === null) return { placed: stopped, t, slid: false, blockedBy: blocker };
  const slide = slideAlong(scale(sub(target.position, from.position), 1 - t), n);
  if (length(slide) <= 1e-15) return { placed: stopped, t, slid: false, blockedBy: blocker };
  const slideTarget: Placed = { position: add(stopped.position, slide), orientation: stopped.orientation };
  const second = advance(stoppedWorld, id, moving, root, stopped, slideTarget, setup);
  return {
    placed: second.t > 0 ? blendPlacement(stopped, slideTarget, second.t) : stopped,
    t,
    slid: second.t > 0,
    blockedBy: blocker,
  };
}
