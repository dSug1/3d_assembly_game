/**
 * ⭐⭐⭐ prototype (green box) — **A PIECE IN ITS GOAL CANNOT BE MOVED** (the owner, 2026-10-01: *"any piece which is in its goal
 * transform cannot be moved (translation or rotation). therefore, disable the translation and rotation of those pieces (don't
 * delete the methods, just disable them, as we may re-enable them later on)"*).
 *
 * ⭐ "In its goal" is the COMMITTED status (`D189`'s `GoalCommit`): the pieces counted at the last completed action — the
 * `goal n/41` the player reads. A piece being dragged INTO its goal is free until the action completes; from then on it is
 * locked. ⭐ What stays (the owner's answers):
 * * it can be PRESSED — a HitFace, a Pioneer others align to, the double-tap undo (which may take it out again);
 * * it is CARRIED by its seated assembly when another member is dragged (only a drag ON it is refused);
 * * ⛔ it cannot be a FOLLOWER: an alignment would turn it out of its goal.
 * ⭐ Re-enabled by `lockPlacedPieces = 0` — every method it gates is intact.
 *
 * ⛔ ENGINE-FREE.
 */
export interface PlacedSet {
  has(id: string): boolean;
}

/** ⭐ Is the piece `id` locked in its goal? `false` when the lock is off, or the press is on no piece. */
export function goalLocked(id: string | undefined, placed: PlacedSet, enabled: boolean): boolean {
  return enabled && id !== undefined && placed.has(id);
}

/**
 * ⭐⭐ prototype (green box) — **THE ORBIT TARGET ON A PRESS ON A PIECE IN ITS GOAL** (the owner, 2026-10-01): the FIRST touch,
 * or the LEFT button (never the right, the mouse's HitFace), pressed on a piece LOCKED in its goal moves the yellow orbit target
 * to where the ray hits it. `null`: the target stays. ⚠ Tied to the lock: with `lockPlacedPieces = 0` a placed piece is a
 * piece like any other and a press on it drags it.
 */
export function orbitTargetOnPress(
  firstTouch: boolean,
  touchOrLeftButton: boolean,
  locked: boolean,
  hitPoint: readonly [number, number, number] | null,
): [number, number, number] | null {
  if (!firstTouch || !touchOrLeftButton || !locked || hitPoint === null) return null;
  return [hitPoint[0], hitPoint[1], hitPoint[2]];
}

/**
 * ⭐⭐ prototype (green box) — **ONLY A PRESS ON A PLACED PIECE MOVES THE YELLOW TARGET** (the owner, 2026-10-02: *"a press on
 * empty space or frozen object or green piece does not change the yellow orbit center position. Only a press on placed object
 * changes the yellow orbit center position."*). ⛔ So the empty-space press — the frozen floor and the green piece are empty
 * space to the router — no longer retargets (§2 rule 1's barycentre, `nearestPairCentre`); its drag still orbits. ⭐ Switched
 * OFF, not deleted: `true` restores it.
 */
export const EMPTY_PRESS_MOVES_TARGET = false;
