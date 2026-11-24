/**
 * MILLIMETRES ON THE PHYSICAL SCREEN, and the conversion to pixels.
 *
 * ⛔⛔ NO THRESHOLD IN THIS PROJECT IS AUTHORED IN PIXELS. The whole gesture set is
 * threshold-driven, and a pixel threshold behaves differently on a phone and a
 * tablet: 8 px is a firm press on one and a twitch on the other. Spec §1.1.
 *
 * ⚠ `devicePixelRatio` is NOT a DPI. It is the ratio of device pixels to CSS
 * pixels, and CSS defines its own pixel as 1/96 inch. That is the whole conversion,
 * and getting it wrong by using DPR alone is the standard mistake.
 */

/** CSS pixels per inch, by definition of the CSS reference pixel. */
export const CSS_PX_PER_INCH = 96;
export const MM_PER_INCH = 25.4;

/**
 * Millimetres -> CSS pixels. Pointer events are already in CSS pixels, so this is
 * the unit every threshold comparison happens in.
 */
export function mmToPx(mm: number): number {
  return (mm / MM_PER_INCH) * CSS_PX_PER_INCH;
}

export function pxToMm(px: number): number {
  return (px / CSS_PX_PER_INCH) * MM_PER_INCH;
}

/**
 * ⭐ THE LANDING MAP'S GRID STEP — millimetres of the MODEL (not of the screen), converted at its use (`core/landing_map.ts`; `ORBIT_SURFACE.md` §5.1).
 * ⭐ (2026-11-22, package S2 — `ORBIT_SURFACE_BUILD.md` §6) its home here once the map is wired: one constant, one place. ⚠ The readout (S2) prepares the
 * sums with no grid (`prepareLanding`): the step serves `buildLandingMap` — the vectors and the offline comparison.
 */
export const LANDING_STEP_MM = 4;

/**
 * ⭐ THE SURFACE'S SMALLEST STEP — millimetres of the MODEL: his Q6 (2026-11-16, `ORBIT_SURFACE.md` §8), *"a step ≥ 0.5 mm a wall in contact range"* —
 * the first member of the noise family (S26, S27). ⭐ (2026-11-23, package S3 — `ORBIT_SURFACE_MOUTH_HOLD.md` §4 H2) its first use: a void the held piece
 * enters by at least this is OPEN for it (`voidOpenFor`).
 */
export const SURFACE_STEP_MIN_MM = 0.5;

/**
 * ⭐⭐⭐ (2026-11-23, S6 — `30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §7.3, his decisions) THE PROXY RULES' SCALES — millimetres of the MODEL:
 * `PROXY_PROBE_MM` ρ, the probe — an opening narrower than 2ρ is bridged (R1); `PROXY_FACE_MIN_MM` w, the narrowest face the gizmo travels (R3, his
 * Q1: SIMPLICITY — not the retired "too narrow to stand on"); `PROXY_FLUSH_MM`, a planar real face's proxy ON it (R2 — half the face map's coplanar
 * 0.5 mm); `PROXY_CURVE_TOL_MM` τ and `COLLISION_TOL_MM` τc (his "as proposed": 1 – 2 mm).
 */
export const PROXY_PROBE_MM = 3.5;
export const PROXY_FACE_MIN_MM = 10;
export const PROXY_FLUSH_MM = 0.25;
export const PROXY_CURVE_TOL_MM = 1.5;
export const COLLISION_TOL_MM = 1.5;
