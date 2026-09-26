/**
 * ⭐⭐⭐ **A SEATED ASSEMBLY IS DRIVEN AS ONE BODY** — the owner, 2026-09-26:
 *
 * > *"When the follower is snapped to the pioneer, they shall be treated as a whole during rotation
 * > and translation (although the capacity to unsnap shall remain). In particular, when
 * > translating, the faces of the pioneer and follower shall be part of the same object and the
 * > gizmo shall reach any face (except the parts which are occulted in the PioneerFace and
 * > FollowerFace). Also, the follower shall be raycast hittable to receive the input as part of
 * > the same object."*
 *
 * ⭐⭐ **THE DECISION IS *WHICH BODY A PRESS DRIVES*.** A press on any member of a seated assembly
 * drives its ROOT — the top-most Pioneer reached by walking seated links upward — and the tree
 * carries the rest (`3D1`, parent ≠ root). ⛔ The walk STOPS BELOW A FROZEN PIONEER: a part seated
 * on the base plate is fixed to it, so the press holds the part (whose translation the seat
 * refuses and whose twist about its face survives) rather than a plate that can never move.
 *
 * ⚠ The face the finger actually touched is kept beside the drive body (`rawPress`), because the
 * gizmo anchors on it: *"the gizmo shall reach any face"*. ⛔ It is NOT a HitFace — face ids are
 * per body, and an alignment of the assembly by a member's face is a later generalisation.
 *
 * ⛔ ENGINE-FREE.
 */

/**
 * ⭐ The body a press on `id` drives. `id` itself when it is not seated, or when its Pioneer is
 * frozen. ⚠ Capped at the tree's depth, so a corrupt ring cannot hang a press.
 */
export function assemblyRoot(
  id: string,
  pioneerOf: (follower: string) => string | null,
  isSeated: (follower: string) => boolean,
  isFrozen: (body: string) => boolean,
): string {
  let x = id;
  for (let i = 0; i < 16; i++) {
    if (!isSeated(x)) return x;
    const p = pioneerOf(x);
    if (p === null || isFrozen(p)) return x;
    x = p;
  }
  return x;
}

/**
 * ⭐ May a FROZEN body be HELD by the first touch? — only when a seated Follower rests on it, so
 * the unsnap gesture (*first touch on the pioneer*) has something to hold. ⛔ `D89` still makes a
 * bare plate's first touch a MISS.
 */
export function frozenHoldAdmitted(hasSeatedFollowers: boolean): boolean {
  return hasSeatedFollowers;
}
