/**
 * ⭐ (2026-11-04, the audit) **IS A CAMERA FINITE?** — its eye, the point it looks at and its up: every coordinate a number. A non-finite camera is
 * thrown by the render (`guardDraw` names it on the HUD), never written into Babylon's camera, where it blanked the glass with nothing to say why.
 *
 * ⛔ ENGINE-FREE.
 */
export function finiteCamera(eye: readonly number[], look: readonly number[], up: readonly number[]): boolean {
  return eye.every(Number.isFinite) && look.every(Number.isFinite) && up.every(Number.isFinite);
}
