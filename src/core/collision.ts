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
 * ⭐⭐ **`D136` — CONTACT IS ALLOWED; "PENETRATES" IS READ AS AN OVERLAP DEPTH** (2026-09-28). A pair
 * apart is free however close it comes; touching or overlapping (GJK answers `0` for both) is judged
 * by depth — up to `skinM` is tolerated, a pair already in contact may only get shallower, so it can
 * always leave. ⛔ It REPLACES *every pair is kept at least `skinM` apart*, which left `Scene_1`'s
 * zero-clearance slots unreachable (a piece stopped 33 mm short; a snap landing flush on a third body
 * was cancelled). ⚠ The depth is exact for boxes; for a slanted hull it over-reads, so such a pair
 * stops at first contact (safe).
 * ⛔ *(Superseded record:)* **"PENETRATES" WAS READ AS A SKIN.** GJK answers `0` for touching AND for
 * overlapping, so a body was kept at least `skinM` from every other; a pair already inside the skin
 * could move only in ways that did not bring it closer.
 * ⛔⛔ **AND AT EXACTLY 0 THE GAP CANNOT SAY "CLOSER"** (`D125`): a pair that STARTS in contact (a
 * `Scene_1` piece and its neighbour, face to face by construction) reads 0 before and 0 however deep it
 * is pushed. So at 0 → 0 the rule reads the OVERLAP DEPTH along the pair's separating axes instead, and
 * the slide takes its normal from the same measure.
 */
import { gapBetween, overlapAlong, separationBetween } from "./collision_shape";
import { setWorldPlacement, worldPlacementOf, type ObjectId, type World } from "./object_model";
import type { Placed } from "./mate_connector";
import { add, cross, dot, length, qAngle, qmul, qRotate, qSlerp, scale, sub, type Quat, type Vec3 } from "./vec";

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
  /**
   * ⭐ `3D7` — **THE PLAY VOLUME**, world metres: no body may leave it. Its walls are one more blocker to the same rule —
   * a move stops at a wall, a translation SLIDES along it, a rotation clamps on its own axis. Absent: unbounded.
   */
  readonly volume?: Aabb;
}

/** ⭐ `3D7`: what `blockedBy` names when a WALL of the play volume stopped the move — no body has this id. */
export const PLAY_VOLUME = "the play volume";

/**
 * ⭐ `3D7`: how far the parts' furthest point lies OUTSIDE the volume, metres (≤ 0: every point inside, by that margin).
 */
function excursion(parts: readonly Vec3[][], v: Aabb): number {
  let worst = -Infinity;
  for (const part of parts)
    for (const p of part)
      for (let i = 0; i < 3; i++) worst = Math.max(worst, v.min[i]! - p[i]!, p[i]! - v.max[i]!);
  return worst;
}

/**
 * ⭐ `3D7`: the INWARD normals of the walls the parts are at (within `eps`) or beyond — the contact normals a
 * translation slides along. A corner answers two or three.
 */
function wallNormals(parts: readonly Vec3[][], v: Aabb, eps: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < 3; i++) {
    let lo = Infinity, hi = -Infinity;
    for (const part of parts) for (const p of part) [lo, hi] = [Math.min(lo, p[i]!), Math.max(hi, p[i]!)];
    const e = (k: number): Vec3 => [i === 0 ? k : 0, i === 1 ? k : 0, i === 2 ? k : 0];
    if (lo <= v.min[i]! + eps) out.push(e(1));
    if (hi >= v.max[i]! - eps) out.push(e(-1));
  }
  return out;
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

/**
 * ⚠ `D125`: a GJK gap this small IS contact. GJK answers ~1e-16, not 0, for two boxes touching or
 * overlapping — measured — so a test for `> 0` let every overlap through. One nanometre.
 */
const CONTACT_M = 1e-9;

/**
 * ⭐ `D125`: the directions a pair's overlap is measured along — each body's three local axes (the
 * face normals of a box) and their cross products (a box's edge–edge axes), both signs. For two boxes
 * these are exactly the separating axes; for a hull, a fixed and ample set.
 */
function contactDirs(orientations: readonly Quat[]): Vec3[] {
  const axes: Vec3[] = [];
  for (const q of orientations) for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Vec3[]) axes.push(qRotate(q, e));
  const out: Vec3[] = [...axes];
  for (let i = 0; i < axes.length; i++)
    for (let j = i + 1; j < axes.length; j++) {
      const c = cross(axes[i]!, axes[j]!);
      const l = length(c);
      if (l > 1e-6) out.push(scale(c, 1 / l));
    }
  return [...out, ...out.map((u) => scale(u, -1))];
}

/** ⭐ `D125`: the deepest overlap between two lists of world parts, and its direction (`A` → `B`). */
function partsDepth(a: readonly Vec3[][], b: readonly Vec3[][], dirs: readonly Vec3[]): { depth: number; dir: Vec3 } | null {
  let worst: { depth: number; dir: Vec3 } | null = null;
  for (const pa of a)
    for (const pb of b) {
      const o = overlapAlong(pa, pb, dirs);
      if (o && (worst === null || o.depth > worst.depth)) worst = o;
    }
  return worst;
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
 * ⭐⭐ **IS THIS POSE CHANGE ALLOWED?** — `D136` (the owner, 2026-09-28, choosing *"Allow touching"*
 * after *"I cannot get the blue object to snap … Snap gets immediately cancelled"*).
 *
 * ⛔⛔ The rule was *every pair stays at least `skinM` apart*. `Scene_1`'s slots have ZERO clearance
 * (`D125`: neighbouring contours touch at exactly 0), so no piece could re-enter its slot — measured:
 * `Piece10` pushed back from 5 cm out stopped **33 mm short**, its back face unable to pass its
 * neighbours' front faces — and a snap landing flush against a third body was cancelled.
 * ⭐ Now **contact is allowed; only PENETRATION is refused**: a pair apart is free however close it
 * comes; a pair touching or overlapping is judged by its OVERLAP DEPTH (`D125`'s measure) — up to
 * `skinM` is tolerated, and a pair already deeper may only get shallower, so a body can always leave.
 * ⭐ `skinM` keeps one constant: the most a body may sink into another, and the substep length of the
 * path check, so a move still cannot tunnel. `before` and `after` differ only in where `moving` is.
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
    // ⭐ Apart — free, however close.
    if (gNew === null || gNew > CONTACT_M) continue;
    // ⭐ Touching or overlapping: GJK says ~0 for both, so the DEPTH decides (`D125`'s measure).
    const dirs = contactDirs(
      [worldPlacementOf(before, m), worldPlacementOf(after, m), worldPlacementOf(after, o)]
        .filter((p) => p !== null)
        .map((p) => p.orientation),
    );
    const dNew = partsDepth(ma, oa, dirs);
    if (dNew === null || dNew.depth <= setup.skinM) continue;
    // ⛔ Deeper than the tolerance: allowed only for a pair ALREADY in contact that gets no deeper —
    // leaving is free. ⛔⛔ Never for a pair that was APART: the depth measure is exact for boxes and
    // OVER-reads a slanted hull (it tests the bodies' own axes only), so an apart-then-touching step
    // could compare two equal over-reads and pass straight into a hull — measured, the notch test.
    const mb = worldParts(before, m, setup.shapes);
    const gOld = mb ? partsGap(mb, oa) : null;
    if (mb && gOld !== null && gOld <= CONTACT_M) {
      const dOld = partsDepth(mb, oa, dirs);
      if (dOld !== null && dNew.depth <= Math.max(0, dOld.depth) + 1e-12) continue;
    }
    return { free: false, blockedBy: o };
  }
  // ⭐⭐ `3D7` — THE WALLS. Out by more than the tolerance is refused — unless the subtree was ALREADY that far out and
  // gets no further: a body outside (a level that boots one there, a tolerance changed) can always come back in.
  if (setup.volume) {
    for (const m of moving) {
      const ma = worldParts(after, m, setup.shapes);
      if (!ma) continue;
      const out = excursion(ma, setup.volume);
      if (out <= setup.skinM) continue;
      const mb = worldParts(before, m, setup.shapes);
      if (mb && out <= Math.max(0, excursion(mb, setup.volume)) + 1e-12) continue;
      return { free: false, blockedBy: PLAY_VOLUME };
    }
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
  // ⭐⭐ `3D7`: stopped by a WALL — slide along it: the component into every wall the body is at is removed (a corner
  // removes two or three), the rest applied along the same path check.
  if (blocker === PLAY_VOLUME && setup.volume) {
    const eps = 2 * setup.skinM + 1e-9;
    const walls = moving.flatMap((m) => wallNormals(worldParts(stoppedWorld, m, setup.shapes) ?? [], setup.volume!, eps));
    let rest = scale(sub(target.position, from.position), 1 - t);
    for (const n of walls) rest = slideAlong(rest, n);
    if (walls.length === 0 || length(rest) <= 1e-15) return { placed: stopped, t, slid: false, blockedBy: blocker };
    const slideTo: Placed = { position: add(stopped.position, rest), orientation: stopped.orientation };
    const along = advance(stoppedWorld, id, moving, root, stopped, slideTo, setup);
    return { placed: along.t > 0 ? blendPlacement(stopped, slideTo, along.t) : stopped, t, slid: along.t > 0, blockedBy: blocker };
  }
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
    if (best && length(best) > CONTACT_M) n = scale(best, 1 / length(best));
    // ⭐ `D125`: stopped IN CONTACT, GJK's separation is the zero vector and names no normal — the
    // overlap measure does: `A` leaves along `−dir`.
    else if (best) {
      const bAt = worldPlacementOf(stoppedWorld, blocker);
      const dirs = contactDirs([stopped.orientation, ...(bAt ? [bAt.orientation] : [])]);
      const d = partsDepth(mp, bp, dirs);
      if (d) n = scale(d.dir, -1);
    }
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
