/**
 * ⭐⭐⭐ **THE GOAL, COMMITTED** (`D189`, the owner, 2026-09-30: *"an action which results in a transform identical to the
 * transform prior to the action, including the 180 degree rotation margin in this scene, cannot trigger the message
 * 'piece xxx reached its goal' (for example if I align a piece to a pioneer and the piece stays in its goal before and
 * after alignment, if I move a piece and move it back to its goal within the same input movement, etc.)"* — and *"goal
 * xx/yy shall be incremented / decremented only after the action has completed (release of the input, or snap, etc.), not
 * midway of a movement (because I can still put back the piece at the same initial transform)"*).
 *
 * ⭐ The pieces PLACED are committed only when an action COMPLETES — the scene at rest after a change, a snap landing, a
 * goal pull landing, a dissolve (the caller decides when; this holds the set). ⭐⭐ A piece *reaches its goal* only if it
 * was NOT placed at the previous commit and IS now — so an action that leaves a placed piece placed (an alignment, a
 * drag out and back in one movement, a half-turn in `Scene_1`, whose goal accepts it) says nothing, and a count shown
 * from this set never moves midway.
 *
 * ⛔ ENGINE-FREE.
 */
import { worldPlacementOf, type World } from "../core/object_model";
import type { Placed } from "../core/mate_connector";
import { length, qAngle, qconj, qmul, sub } from "../core/vec";
/**
 * ⭐ `D190`: the pieces an action MOVED — their world pose differs between the model last committed and the model now
 * (a seated follower carried by its root counts). ⛔ `World` is immutable, so the same model is one comparison.
 */
export function piecesMoved(before: World, after: World, ids: readonly string[]): Set<string> {
  const out = new Set<string>();
  if (before === after) return out;
  for (const id of ids) {
    const a = worldPlacementOf(before, id);
    const b = worldPlacementOf(after, id);
    if (a === null || b === null) {
      if (a !== b) out.add(id);
      continue;
    }
    const turned = qAngle(qmul(b.orientation, qconj(a.orientation)));
    if (length(sub(a.position, b.position)) > MOVED_M || turned > MOVED_RAD) out.add(id);
  }
  return out;
}

const MOVED_M = 1e-7;
const MOVED_RAD = 1e-6;

/**
 * ⭐⭐⭐ (2026-10-15, the owner: *"When a piece/part reaches its goal, set its transform to perfectly match the goal transform so there is no misalignment
 * of any sort."*) — **A PLACED PIECE SET EXACTLY ON ITS GOAL**: each placed piece (`ids`) whose pose differs from its exact goal pose by any amount, with
 * that pose — the parents before their children (`depthOf`: a parent moved carries its seated children), none `skip` names (a frozen body, the orbited
 * piece still in the orbit). ⛔ A piece is judged placed within margins (a grabbed part: the snap's 10 mm on the glass / 15°); a pull landed exactly,
 * but a DISSOLVE set only its spin (`D143`) and a piece placed without a pull kept its offset.
 */
export function goalSnaps(
  ids: readonly string[],
  targetOf: (id: string) => Placed | null,
  poseOf: (id: string) => Placed | null,
  skip: (id: string) => boolean,
  depthOf: (id: string) => number,
): { id: string; target: Placed }[] {
  const out: { id: string; target: Placed; depth: number }[] = [];
  for (const id of ids) {
    if (skip(id)) continue;
    const t = targetOf(id);
    const p = poseOf(id);
    if (t === null || p === null) continue;
    const turned = qAngle(qmul(t.orientation, qconj(p.orientation)));
    if (length(sub(t.position, p.position)) <= MOVED_M && turned <= MOVED_RAD) continue;
    out.push({ id, target: t, depth: depthOf(id) });
  }
  return out.sort((a, b) => a.depth - b.depth).map(({ id, target }) => ({ id, target }));
}

export class GoalCommit {
  private placed: ReadonlySet<string> | null = null;
  private totalCount = 0;

  /** ⭐ Nothing committed yet — the first commit (the boot) is a baseline, it reaches nothing. */
  get never(): boolean {
    return this.placed === null;
  }

  get count(): number {
    return this.placed?.size ?? 0;
  }

  get total(): number {
    return this.totalCount;
  }

  /** ⭐ prototype (green box): is `id` placed at the last commit? — what `goal_lock.ts` locks. */
  has(id: string): boolean {
    return this.placed?.has(id) ?? false;
  }

  /**
   * ⭐ Commit the pieces placed NOW; returns the ones that REACHED their goal (not placed at the previous commit).
   * ⛔ The first commit returns none: a piece placed at boot reached nothing.
   * ⭐⭐ `D190` (the owner: *"why a one piece move would trigger the check on goal for all other pieces?"*): only the pieces
   * the action MOVED (`moved`) are re-judged — every other piece keeps its committed status. ⛔ The relative frame is
   * refitted on every report, so a piece sitting at its margin's edge could otherwise flip when a DIFFERENT piece moved
   * (a fuzz of random moves found it). `null`: re-judge all (the first commit).
   */
  commit(inPlaceIds: readonly string[], total: number, moved: ReadonlySet<string> | null = null): string[] {
    const before = this.placed;
    const live = new Set(inPlaceIds);
    const now =
      before === null || moved === null
        ? live
        : new Set([...[...before].filter((id) => !moved.has(id)), ...[...live].filter((id) => moved.has(id))]);
    this.placed = now;
    this.totalCount = total;
    if (before === null) return [];
    return [...now].filter((id) => !before.has(id));
  }
}
