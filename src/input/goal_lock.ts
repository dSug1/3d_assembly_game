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
 * ⭐⭐ (2026-10-13, the owner: *"Piece still locked onto the collided part without possibility to go backwards"* → *"Build"*; `COLLISION.md` §11nonies) — the press only NOTES where the gizmo would go (`orbitTargetOnPress`); it MOVES
 * there at the release, and only if that release is a TAP. A drag that starts on a placed part ORBITS and leaves the gizmo where it is — every
 * re-press used to move it (half a metre in six drags, measured), the whole ring with it: the piece's place on the ring dropped into the part it
 * touched and locked it. ⚠ It narrows the owner's 2026-10-01 rule (*"when first touch or left button is pressed and hold on a placed piece, the
 * yellow orbit target moves"*) to the TAP of 2026-10-12 (*"Second touch tap on seated / placed part now sets the pink gizmo (same as first touch
 * tap on seated / placed part)"*). `null`: the gizmo stays.
 */
export function orbitTargetOnRelease(
  noted: readonly [number, number, number] | null,
  tapped: boolean,
): [number, number, number] | null {
  return noted !== null && tapped ? [noted[0], noted[1], noted[2]] : null;
}

/**
 * ⭐⭐ (2026-11-13, the owner: *"at boot (ie before a part is picked up), the player shall be able to peep at the pieces therefore the player shall be
 * able to move the center of the current orbit towards the piece of his choice. I would propose a click or first touch moves the orbit center to the
 * point where the raycast hit the surface of a piece or the floor"*) — BROWSING a scene's model before a part is in hand: a first touch (or the
 * left button) whose ray hits a part or the floor gives the point the centre GLIDES to (`browseGlideAt`) — AT THE PRESS, that press driving the
 * orbit (the owner: *"at boot, a press modifies the position of the center of the orbit (not any longer the tap + press). I am ok that each press
 * changes the orbit center at boot"*). ⛔ Before: a tap armed the point and the press after it started the glide.
 */
export function browseTargetOnPress(
  firstTouch: boolean,
  touchOrLeftButton: boolean,
  partInHand: boolean,
  hitPoint: readonly [number, number, number] | null,
): [number, number, number] | null {
  if (!firstTouch || !touchOrLeftButton || partInHand || hitPoint === null) return null;
  return [hitPoint[0], hitPoint[1], hitPoint[2]];
}


/**
 * ⭐⭐⭐ (2026-11-13) THE BROWSED CENTRE'S GLIDE — the owner: *"the center of the orbit shall reach its goal within a travel of xx mm of finger. Its
 * travel shall be proportional to the finger travel"*. The centre's position = start + (goal − start) × min(1, finger travel / `arriveMm`) — LINEAR
 * (proportional), arriving after exactly `arriveMm` of finger whatever the distance; a still finger leaves it where it is.
 * ⛔ (1) The centre blend of 2026-09-14 (commits `2590d16`, `08a6a65`: the same budget, 30 mm) was EASED (smoothstep): its slow start and end were
 * the stalls (the owner: *"there are big jumps and stalls"*). ⛔ (2) A time-driven MINIMUM SPEED (40 → 80 → 240 → 120 mm/s) — removed (*"remove this
 * min speed entirely as the logic is wrong"*). ⛔ (3) A glide at 1 screen mm per finger mm — replaced by this rule.
 */
export function browseGlideAt(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  travelledMm: number,
  arriveMm: number,
): { at: [number, number, number]; arrived: boolean } {
  const t = arriveMm <= 0 ? 1 : Math.min(1, Math.max(0, travelledMm) / arriveMm);
  return { at: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t], arrived: t >= 1 };
}

// ⛔ (2026-10-11) `pinkFaceTapCandidate` is DELETED — the pink face is the held second touch's now (`hold_gesture.ts`'s `pinkCandidate`).

// ⛔ (2026-11-14, CL1) `EMPTY_PRESS_MOVES_TARGET` (off since 2026-10-02: only a press on a placed piece moves the yellow target) deleted with
// the empty-press barycentre it switched (`recomputeOrbitCentre`, `nearestPairCentre`).
