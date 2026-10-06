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
 * ⭐ The taps are COUNTED while the orbit finger is down (reset when it lifts): the FIRST is the resting-face alignment, the later
 * ones do nothing yet.
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

/** ⭐ One more tap counted: the new count, and whether this tap ALIGNS (the first only — the next ones are to be defined). */
export function orbitTapCount(count: number): { readonly count: number; readonly aligns: boolean } {
  return { count: count + 1, aligns: count === 0 };
}
