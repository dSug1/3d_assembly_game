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
 * ⭐⭐ prototype — **WHAT A TAP DOES** (`1.0.59z-Rotation-of-resting-face`; the owner, 2026-10-09: *"if (the first touch / left click is
 * held or tapped /clicked again) and second touch on piece / right click is tapped again : rotation of the piece around the normal of the
 * resting face so the next edge of the resting face takes the alignment with the pink face long axis"*): `ROLL` when the piece is
 * already aligned AND to the SAME target face as now (`sameTarget`); else `ALIGN` — the first tap, after a respawn, or when the pink
 * face has changed since. ⛔ The tap count plays no part: lifting and pressing the orbit finger again in between changes nothing.
 */
export function tapAction(aligned: boolean, sameTarget: boolean): "ALIGN" | "ROLL" {
  return aligned && sameTarget ? "ROLL" : "ALIGN";
}
