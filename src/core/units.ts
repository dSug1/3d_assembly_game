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
