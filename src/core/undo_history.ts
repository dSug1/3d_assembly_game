/**
 * ⭐⭐⭐ **THE UNDO — one history for the scene** (`D111`, the owner, 2026-09-27).
 *
 * > *"Double tap on an object shall revert the previous action (therefore bring back the object
 * > to the previous transform if there was movement, un-snap if there was snap, snap if there was
 * > un-snap, etc.)"* — and, asked which action: *"Last action, any body"*.
 *
 * ⭐⭐ **AN ACTION IS A GESTURE THAT CHANGED THE MODEL** — from the first touchpoint down to the
 * last one up (`GestureSpan`). Its entry is the model as it stood BEFORE, so undoing restores a
 * snapshot rather than inverting an operation: a snap, an unsnap, an alignment and a move are all
 * undone by the same line, and a seat between two bodies comes back with both of them.
 * ⛔ A gesture that changed nothing (an orbit, a zoom, a tap) leaves no entry — `modelsDiffer`.
 *
 * ⛔ ENGINE-FREE: the snapshot type is the caller's; this file only orders them.
 */
import type { ObjectId, SceneObject, World } from "./object_model";
import type { Vec3 } from "./vec";

/** A last-in, first-out history of the model as it stood before each action. */
export class UndoHistory<S> {
  private readonly stack: S[] = [];

  /** @param cap the number of actions kept — the oldest is dropped past it. */
  constructor(private readonly cap = 50) {}

  push(before: S): void {
    this.stack.push(before);
    if (this.stack.length > this.cap) this.stack.shift();
  }

  /** The most recent entry, removed — or `null` when there is nothing to undo. */
  pop(): S | null {
    return this.stack.pop() ?? null;
  }

  get size(): number {
    return this.stack.length;
  }
}

/**
 * ⭐ **WHERE A GESTURE BEGINS AND ENDS** — the first pointer down, and the pointer up that leaves
 * none down. ⛔ Counted by id, not by events: a second finger joining or leaving is inside the
 * same gesture, and a duplicated DOWN for one id must not open a second one.
 */
export class GestureSpan {
  private readonly down = new Set<number>();

  /** `true` when this press BEGINS a gesture (nothing else was down). */
  press(id: number): boolean {
    if (this.down.has(id)) return false;
    this.down.add(id);
    return this.down.size === 1;
  }

  /** `true` when this release ENDS the gesture (nothing is left down). ⚠ An unknown id ends nothing. */
  release(id: number): boolean {
    if (!this.down.delete(id)) return false;
    return this.down.size === 0;
  }

  get active(): number {
    return this.down.size;
  }
}

/** The part of the model an action can change, beyond `World`. */
export interface ModelSnapshot<L, C, H> {
  readonly world: World;
  readonly links: L;
  readonly cursors: C;
  readonly heldOff: H;
}

const near = (a: readonly number[], b: readonly number[], eps: number): boolean =>
  a.length === b.length && a.every((v, i) => Math.abs(v - b[i]!) <= eps);

/**
 * ⭐⭐ **DID THE WORLD CHANGE?** — placement, parent (the seat) and constraints (the alignment),
 * per object. ⛔ A tolerance, not identity: the model is rewritten by rules that land exactly
 * where they started (a retarget, a re-derived seat), and an unchanged body must not look moved.
 * ⭐ A body's orientation is compared up to SIGN — `q` and `−q` are the same turn.
 */
export function worldsDiffer(a: World, b: World, eps = 1e-6): boolean {
  if (a === b) return false;
  if (a.objects.size !== b.objects.size) return true;
  for (const [id, oa] of a.objects) {
    const ob = b.objects.get(id);
    if (ob === undefined) return true;
    if (oa === ob) continue;
    if (objectsDiffer(oa, ob, eps)) return true;
  }
  return false;
}

function objectsDiffer(a: SceneObject, b: SceneObject, eps: number): boolean {
  if (a.parent !== b.parent) return true;
  if (!near(a.local.position, b.local.position, eps)) return true;
  const qa = a.local.orientation;
  const qb = b.local.orientation;
  if (!near(qa, qb, eps) && !near(qa, qb.map((v) => -v), eps)) return true;
  return JSON.stringify(a.constraints) !== JSON.stringify(b.constraints);
}

/** The alignment index as plain data: who follows whom on which face, and who is seated. */
export interface LinksState {
  readonly forward: readonly (readonly [ObjectId, ObjectId, string])[];
  readonly seated: readonly ObjectId[];
}

export function linksDiffer(a: LinksState, b: LinksState): boolean {
  const key = (s: LinksState) =>
    JSON.stringify([
      [...s.forward].map((f) => f.join("\u0000")).sort(),
      [...s.seated].sort(),
    ]);
  return key(a) !== key(b);
}

/** The cursors as plain data: each couple's key and where its ring sits. */
export type CursorsState = readonly (readonly [string, Vec3])[];

export function cursorsDiffer(a: CursorsState, b: CursorsState, eps = 1e-6): boolean {
  if (a.length !== b.length) return true;
  const m = new Map(b);
  for (const [k, p] of a) {
    const q = m.get(k);
    if (q === undefined || !near(p, q, eps)) return true;
  }
  return false;
}

/** ⭐ The one question the history asks at the end of a gesture. */
export function modelsDiffer(
  a: ModelSnapshot<LinksState, CursorsState, unknown>,
  b: ModelSnapshot<LinksState, CursorsState, unknown>,
): boolean {
  return (
    worldsDiffer(a.world, b.world) ||
    linksDiffer(a.links, b.links) ||
    cursorsDiffer(a.cursors, b.cursors)
  );
}
