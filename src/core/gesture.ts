/**
 * ⭐⭐ **A GESTURE, AND WHETHER IT CHANGED THE WORLD** — the score's question (`SCORE.md` §3.2, `D158`: a gesture that changes nothing costs
 * zero episodes).
 *
 * ⛔ (2026-11-02, *"remove the translation and the rotation of the parts"*) — this was `core/undo_history.ts`: the undo (`D111`, `D141`), its
 * history and the links / cursors / snap-arming snapshots are deleted with the parts' translation, rotation and alignment (commit `d8134eb`);
 * what the score reads stays.
 *
 * ⛔ ENGINE-FREE.
 */
import type { SceneObject, World } from "./object_model";

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
    // ⭐ prototype (2026-10-09): an ORBITED piece moves with the camera's orbit — never an action, never undone
    if (oa.orbited === true) continue;
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
