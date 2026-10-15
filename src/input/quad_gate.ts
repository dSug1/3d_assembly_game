/**
 * ⭐⭐⭐ prototype — **THE QUADS GATE THE TURN** (2026-10-15, the owner: *"Currently, if I tap on empty anywhere, the piece quad rotates. Allow the
 * quad rotation on tap only if the quads are shown. Also, allow the resting face selection by tap on piece only if quads are shown."* · *"Make the
 * quads' non-yellow edges highlight and their corresponding face fill 30% more transparent"* · *"Hide the yellow highlight of the resting face when
 * the quads are not shown. When the quads are shown, make the highlight of the resting face green (same as the highlight when sliding)"* ·
 * *"Continue to green highlight the resting face and the coplanar faces boundary when sliding is allowed"*; `RESTING_FACE_ALIGNMENT.md` §30).
 * Pure: what a tap may do, what the resting face's contour shows, how faint a quad is.
 */

/** ⭐ A tap on empty space (either touch) turns the piece to the yellow quad, and a tap on the piece makes the face tapped its resting face — only while the quads are SHOWN. */
export function quadTapsAllowed(quadsShown: boolean): boolean {
  return quadsShown;
}

/** ⭐ The resting face's (green) contour: shown with the quads, or while a slide is available or on (the hover's green); hidden otherwise. */
export function restingContourShown(quadsShown: boolean, slideReady: boolean): boolean {
  return quadsShown || slideReady;
}

/** ⭐ A quad that is NOT the yellow one: its edges and its fill 30 % more transparent (× 0.7); the yellow one unchanged. */
export const QUAD_UNLIT_SHARE = 0.7;
export function quadAlpha(alpha: number, lit: boolean): number {
  return lit ? alpha : alpha * QUAD_UNLIT_SHARE;
}
