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
   */
  commit(inPlaceIds: readonly string[], total: number): string[] {
    const before = this.placed;
    const now = new Set(inPlaceIds);
    this.placed = now;
    this.totalCount = total;
    if (before === null) return [];
    return inPlaceIds.filter((id) => !before.has(id));
  }
}
