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
