/**
 * ⭐⭐⭐ **THE APPROACH SWING — the camera looks around the join and comes back.**
 *
 * ⚠⚠ **A TRIAL, ON BRANCH `1.0.18-`.** The owner: *"Let's try a fork of the build here … If the
 * trial is not successful, I will just discard the branch later on."* ⛔ So this file is written
 * to be **deletable in one commit**: nothing else depends on it, and the wiring in `scene.ts` is
 * two call sites. It is not a flag — `D28` and `D40` deleted the last of those — the BRANCH is
 * the fork.
 *
 * > *"When the offset radius is crossed … while the translation of the Follower continues with
 * > the same user dx delta position movement, the camera orbits opposite to the dx movement …
 * > When the offset is half what it initially was, the camera orbit reverses so the camera aims
 * > at coming back to its original orbit. When the offset is null (contact of both objects), the
 * > camera shall be back to its original position."* — the owner, 2026-09-19
 *
 * ⭐⭐ **WHAT IT IS FOR**: parallax. A face-to-face approach seen head-on gives a hand almost no
 * depth cue — which is the same degeneracy `D46` was built around, one sense over. Swinging the
 * view out and back while the gap closes shows the join from a changing angle **without leaving
 * the hand anywhere new**, because the swing returns to zero exactly as contact is made.
 *
 * ⛔⛔⛔ **THE RETURN IS BY CONSTRUCTION, NOT BY A RESTORE.** The owner described it as a
 * SNAPSHOT of the camera taken at the trigger and restored at contact. ⚠ This computes an
 * **additive yaw offset** that is zero at both ends instead, and the difference matters:
 *
 *   • a restore fights the hand — orbit the camera yourself mid-approach and a restore would
 *     yank it back to where it was before you did;
 *   • a restore has to run, so a lost frame, an early release or a body that never reaches
 *     contact all leave the camera somewhere nobody chose;
 *   • an offset that is zero at `p = 0` and `p = 1` **cannot** leave it anywhere, and it rides
 *     on top of whatever the hand does with the orbit meanwhile.
 *
 * ⭐ `LESSONS_CARRIED`'s own shape: *make the bad state unrepresentable rather than guarded.*
 * ⚠ The cost, stated: if the hand orbits during the approach, contact returns the camera to
 * **its own orbit**, not to the snapshot. That is a real difference from the dictation and it is
 * the first thing to judge.
 *
 * ⛔ ENGINE-FREE. It knows a gap, an angle and a sign; it moves nothing.
 */

/** What the swing remembers, latched when the capture first triggers. */
export interface SwingLatch {
  /**
   * The surface gap at the instant the capture triggered, in metres — the swing's whole
   * parameterisation. ⛔ LATCHED, never re-read: the capture offset is recomputed every frame
   * from the camera distance (`D49`), and the camera is about to move, so a live offset would
   * make the progress depend on the swing the progress is driving.
   */
  readonly gapAtTriggerM: number;
  /**
   * Which way to swing. ⭐ *"opposite to the dx movement"*, decided once.
   * ⚠ Latched for the same reason `D57`'s roll sign is: recomputed per frame it would flip
   * whenever the finger paused or jittered across zero, at full amplitude.
   */
  readonly sign: 1 | -1;
}

/**
 * ⭐⭐ **WHERE THE APPROACH HAS GOT TO — `0` at the trigger, `1` at contact.**
 *
 * ⛔ CLAMPED AT BOTH ENDS. Past contact the bodies interpenetrate and `gapBetween` returns `0`,
 * so `1` is the most this can mean; and pulling back **beyond** the trigger gap must not drive
 * the swing the other way — it returns to zero and stays there, which is what a hand backing off
 * expects to see.
 *
 * ⚠ A non-positive `gapAtTriggerM` is degenerate — it would divide by zero, and it means the
 * capture triggered at contact, where there is no approach left to show. ⭐ Returns `1`, so the
 * swing is already home: the one answer that cannot move the camera.
 */
export function swingProgress(gapM: number, latch: SwingLatch): number {
  const g0 = latch.gapAtTriggerM;
  if (!(g0 > 0) || !Number.isFinite(g0) || !Number.isFinite(gapM)) return 1;
  const p = (g0 - gapM) / g0;
  return p <= 0 ? 0 : p >= 1 ? 1 : p;
}

/**
 * ⭐⭐⭐ **THE SWING ITSELF — out, then back, with the reversal at half the gap.**
 *
 * ⛔⛔ **A HALF SINE, NOT A TRIANGLE.** Both peak at `p = 0.5` and both end at zero, and the
 * owner's words (*"the camera orbit reverses"*) fit either. ⭐ The sine is chosen because its
 * VELOCITY is continuous at the reversal: a triangle changes the camera's angular speed
 * instantaneously at the halfway point, which on glass reads as a knock exactly when the hand is
 * concentrating on the last millimetres. ⚠ A hand may disagree; it is one line.
 *
 * ⛔⛔⛔ **EXACTLY ZERO AT BOTH ENDS, AND THAT IS NOT PEDANTRY.** `Math.sin(Math.PI)` is
 * `1.2246e-16`, not `0`. ⭐ The owner's requirement is *"the camera shall be back to its original
 * position"*, and a residual — however small — makes that a near-miss rather than a fact.
 * `AlignSnaps.advance` lands on its solved orientation for the same reason, and says so.
 */
export function swingYawRad(progress: number, amplitudeRad: number, sign: 1 | -1): number {
  if (!(progress > 0) || progress >= 1) return 0;
  return sign * amplitudeRad * Math.sin(Math.PI * progress);
}

/**
 * ⭐ Which way the camera swings, from the finger travel that is closing the gap.
 *
 * ⛔ *"the camera orbits OPPOSITE to the dx movement"* — so the sign is negated, and that is the
 * whole of this function. ⚠ It is a separate function because a sign convention stated in prose
 * inside a render file is a sign convention nobody can test; `A7` and `D52` were both sign
 * compositions that nothing measured.
 *
 * ⚠ **A ZERO `dx` FALLS BACK TO `+1`, DECLARED.** The trigger can fire on a frame where the
 * finger happened to be between samples, and `Math.sign(0)` is `0` — which would be *no swing at
 * all*, silently, on a gesture the hand can only repeat by pulling apart and coming back.
 */
export function swingSignFor(dxPx: number): 1 | -1 {
  return dxPx > 0 ? -1 : 1;
}
