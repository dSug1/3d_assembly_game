/**
 * ⭐⭐ prototype — **A TAP ON THE ORBITED PIECE** (`Claude/40_RENDER_SCENE/spec/RESTING_FACE_ALIGNMENT.md` §13, §20).
 *
 * ⛔ (2026-10-11) the second-finger tap while orbiting (`RESTING_FACE_ALIGNMENT.md` §1, §4, §19 — it counted, aligned, rolled, then aligned
 * to a new pink face) is DELETED with its helpers (`secondMoved`, `isOrbitTap`, `orbitTapCount`, `tapAlignsToPink`): the second touch is
 * HELD now (`hold_gesture.ts`) — its press on a placed part's face takes the pink face and aligns to it.
 *
 * ⛔ ENGINE-FREE.
 */

/**
 * ⭐⭐ prototype — **A TAP ON THE ORBITED PIECE ITSELF** (2026-10-09; the owner: *"when a face of the green piece or the turquoise piece is
 * left button tapped or first touch tapped, the hit face becomes the resting face and it aligns. the roll to the next edge is then
 * implemented on this new resting face"*): the FIRST touch (or the left button) pressed on the orbited piece — empty space to the router,
 * so its drag orbits — makes the face it hit the resting face when it is released as a TAP (`isTapRelease`, §1.3's); outside the edge
 * band. ⭐ (2026-10-11, *"First touch tap on green or turquoise pieces with or without Second touch pressed"*) the second touch may be held;
 * ⭐ and the SECOND touch's own tap on the piece does the same (*"add the possibility of selecting another resting face by second touch tap
 * on the green or turquoise piece"*) — the caller passes `firstTouch` true for any touch.
 * ⛔ Consumed: it is not one of a camera-reset double tap.
 */
export function restingFaceTap(onOrbitedPiece: boolean, firstTouch: boolean, inBand: boolean): boolean {
  return onOrbitedPiece && firstTouch && !inBand;
}
