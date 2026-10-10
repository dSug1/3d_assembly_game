/**
 * ⭐⭐⭐ prototype — **THE SECOND-FINGER TAP WHILE ORBITING** (`Claude/40_RENDER_SCENE/spec/RESTING_FACE_ALIGNMENT.md` §1, §4; the owner,
 * 2026-10-05, amended 2026-10-06: *"Zoom is triggered by second touch outside the piece, resting face alignment triggered by second touch
 * tap on the piece"*). While the first touch (or the left button) orbits, a SECOND touch:
 * * landing OFF the orbited piece is a **PINCH** from the moment it lands (no tap to wait for: nothing held back, no jump);
 * * landing ON the piece is a **TAP** candidate — a tap if released within `tapMaxDuration` (Unity's definition: a press and release
 *   within a time — and, for a touch, within a radius: the deadband, millimetres on the glass), never having MOVED beyond it, with the
 *   orbit finger still down; otherwise nothing. ⛔ It never zooms, and the first finger keeps orbiting meanwhile.
 * ⭐ The mouse's right button, with the left one orbiting, is judged on TIME only — the cursor moves with the orbit, and Unity applies
 * no radius to a button.
 * ⭐ The taps are COUNTED while the orbit finger is down (reset when it lifts) — for the HUD. ⭐⭐ (2026-10-09, `tapAction`) a tap ALIGNS the
 * resting face, or — the piece already aligned to the same target face — ROLLS it to the next edge, whether or not the orbit finger
 * lifted in between.
 *
 * ⛔ ENGINE-FREE.
 */

/** ⭐ Has the second touch MOVED — its travel from its press beyond the deadband (mm on the glass)? Then it is no longer a tap. */
export function secondMoved(travelMm: number, deadbandMm: number): boolean {
  return travelMm > deadbandMm;
}

/** ⭐ Is the second touch's release a TAP? `moved`: it went beyond the deadband at some point (a touch); never for the mouse. */
export function isOrbitTap(pressMs: number, releaseMs: number, tapMaxMs: number, moved: boolean, orbitStillDown: boolean): boolean {
  return orbitStillDown && !moved && releaseMs >= pressMs && releaseMs - pressMs <= tapMaxMs;
}

/** ⭐ One more tap counted (the HUD's `taps N`). */
export function orbitTapCount(count: number): { readonly count: number } {
  return { count: count + 1 };
}

/**
 * ⭐⭐ prototype — **A TAP ON THE ORBITED PIECE ITSELF** (2026-10-09; the owner: *"when a face of the green piece or the turquoise piece is
 * left button tapped or first touch tapped, the hit face becomes the resting face and it aligns. the roll to the next edge is then
 * implemented on this new resting face"*): the FIRST touch (or the left button) pressed on the orbited piece — empty space to the router,
 * so its drag orbits — makes the face it hit the resting face when it is released as a TAP (`isTapRelease`, §1.3's) with no other
 * pointer down; outside the edge band. ⛔ Consumed: it is not one of a camera-reset double tap.
 */
export function restingFaceTap(onOrbitedPiece: boolean, firstTouch: boolean, inBand: boolean): boolean {
  return onOrbitedPiece && firstTouch && !inBand;
}

// ⛔ (2026-10-10, the owner) `tapAction` is DELETED: the second-touch / right-button tap neither rolls (*"remove the increment of the roll by
// right button tap / second touch tap"*) nor aligns (*"remove that as the existing pieces are aligned at boot"*) — every piece is aligned
// at its spawn (`bootRestAlign`), the roll is the orbit's dx, a new resting face is a tap ON the piece (`restingFaceTap`).
