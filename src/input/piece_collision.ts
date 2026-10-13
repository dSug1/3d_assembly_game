/**
 * ⭐⭐⭐ prototype — **THE ORBITED PIECE COLLIDES** (`COLLISION.md` §11; the owner, 2026-10-13: *"Now we need to work on the collision of the
 * green-turquoise piece with the other parts … reusing what we have done for the other parts (collision detection on next move, sliding,
 * etc) and adapting it for the piece specific orbit movement"* → the proposal agreed: *"I agree with all the rest of your recommendations.
 * Build"*).
 *
 * The rule is `core/collision.ts`'s (`resolveMove`: the path checked, contact allowed, only penetration refused — `D136`). What is the piece's
 * own is HOW its orbit step SLIDES: a world slide would push it off its ring, so a blocked step falls back in the ORBIT's coordinates — the
 * whole step, else the yaw alone, else the ring position alone; else it stops where the path stops. The input past the stop is DISCARDED
 * (the orbit's target pulled back), as for the other parts. ⛔ No engine, no scene.
 */

/** ⭐ The orbit's coordinates the piece rides: the yaw, the ring parameter, the zoom (the camera's — it never moves the piece). */
export interface OrbitParams {
  readonly yaw: number;
  readonly v: number;
  readonly zoom: number;
}

const same = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;

/**
 * ⭐⭐ The orbit steps to try, in order, from `from` toward `to`: the whole step; else the YAW alone (the ring position kept); else the RING
 * POSITION alone (the yaw kept) — the orbit's own slide. A fallback that is no step (an axis that did not move) is left out.
 */
export function orbitStepCandidates(from: OrbitParams, to: OrbitParams): OrbitParams[] {
  const out: OrbitParams[] = [to];
  const yawOnly: OrbitParams = { yaw: to.yaw, v: from.v, zoom: to.zoom };
  const vOnly: OrbitParams = { yaw: from.yaw, v: to.v, zoom: to.zoom };
  if (!same(to.yaw, from.yaw) && !same(to.v, from.v)) out.push(yawOnly, vOnly);
  return out;
}

/** ⭐ A fraction `t` of the orbit step (the stop when every candidate is blocked). */
export function lerpOrbit(from: OrbitParams, to: OrbitParams, t: number): OrbitParams {
  const k = Math.min(1, Math.max(0, t));
  return { yaw: from.yaw + (to.yaw - from.yaw) * k, v: from.v + (to.v - from.v) * k, zoom: to.zoom };
}

/** ⭐ Which of the orbit's axes the step taken REFUSED (it did not reach `to`): their input past the stop is discarded. */
export function refusedAxes(to: OrbitParams, taken: OrbitParams): { readonly yaw: boolean; readonly v: boolean } {
  return { yaw: !same(to.yaw, taken.yaw), v: !same(to.v, taken.v) };
}
