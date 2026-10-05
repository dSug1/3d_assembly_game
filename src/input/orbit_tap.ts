/**
 * ⭐⭐⭐ prototype — **THE SECOND-FINGER TAP WHILE ORBITING** (`Claude/40_RENDER_SCENE/spec/RESTING_FACE_ALIGNMENT.md` §1, §4; the owner,
 * 2026-10-05). While the first touch (or the left button) orbits, a SECOND touch is either:
 * * a **PINCH** — the moment it moves beyond the deadband (*"you don't need to wait further and the zoom can start"*); from then it can
 *   no longer be a tap, and the orbit pauses;
 * * a **TAP** — released within `tapMaxDuration` (Unity's definition: a press and release within a time — and, for a touch, within a
 *   radius: the deadband, millimetres on the glass), never having pinched, with the orbit finger still down;
 * * or nothing (held still longer than a tap).
 * ⭐ The mouse's right button, with the left one orbiting, is judged on TIME only — the cursor moves with the orbit, and Unity applies
 * no radius to a button.
 * ⭐ The taps are COUNTED while the orbit finger is down (reset when it lifts): the FIRST is the resting-face alignment, the later
 * ones do nothing yet.
 *
 * ⛔ ENGINE-FREE.
 */

/** ⭐ Has the second touch become a PINCH — its travel from its press beyond the deadband (mm on the glass)? */
export function secondPinches(travelMm: number, deadbandMm: number): boolean {
  return travelMm > deadbandMm;
}

/** ⭐ Is the second touch's release a TAP? `pinched`: it moved beyond the deadband at some point (a touch); never for the mouse. */
export function isOrbitTap(pressMs: number, releaseMs: number, tapMaxMs: number, pinched: boolean, orbitStillDown: boolean): boolean {
  return orbitStillDown && !pinched && releaseMs >= pressMs && releaseMs - pressMs <= tapMaxMs;
}

/** ⭐ One more tap counted: the new count, and whether this tap ALIGNS (the first only — the next ones are to be defined). */
export function orbitTapCount(count: number): { readonly count: number; readonly aligns: boolean } {
  return { count: count + 1, aligns: count === 0 };
}
