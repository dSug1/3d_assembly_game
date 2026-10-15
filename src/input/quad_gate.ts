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

/**
 * ⭐ A quad's edges and fill: the YELLOW one (lit) as before — edges 1, fill 0.12; the others fainter — ⭐⭐ (2026-10-15, the owner: *"non-yellow quads'
 * edges go from 0.45 to 0.2 and their fills from 0.12 to 0.05. The yellow quad is unchanged."*) edges 0.2, fill 0.05 (⛔ × 0.7 — 0.315, 0.084 —
 * the same day) → *"from 0.2 to 0.1 and their fills from 0.05 to 0.025"* → a slider (`quadUnlitAlpha`, the edges; the fill a quarter).
 */
export const QUAD_LIT_EDGE_ALPHA = 1;
export const QUAD_LIT_FILL_ALPHA = 0.12;
/** ⭐ (2026-10-15, *"make a slider for non-yellow quad highlight transparency (edges and fill)"*) — the unlit fill is this share of the unlit edges (`quadUnlitAlpha`): 0.1 → 0.025, as asked. */
export const QUAD_UNLIT_FILL_SHARE = 0.25;
export function quadEdgeAlpha(lit: boolean, unlitAlpha: number): number {
  return lit ? QUAD_LIT_EDGE_ALPHA : unlitAlpha;
}
export function quadFillAlpha(lit: boolean, unlitAlpha: number): number {
  return lit ? QUAD_LIT_FILL_ALPHA : unlitAlpha * QUAD_UNLIT_FILL_SHARE;
}
