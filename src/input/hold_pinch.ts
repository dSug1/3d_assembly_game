/**
 * ⭐⭐⭐ **`D137` — A HORIZONTAL PINCH WHILE HOLDING A BODY ZOOMS** (the owner, 2026-09-28: *"In mobile,
 * during the translation of an object, if two touchpoints have dx which go towards or away from each
 * other and no dy (similar to a pinch out or in to zoom), then pause the translation and perform a zoom
 * out or in"*, then *"pause the translation and the roll"*). ENGINE-FREE.
 *
 * ⭐ **THE TEST**: both fingers' x axes are `MOVING`, neither y axis is, and their latest horizontal
 * travel points in OPPOSITE directions — so the fingers close or spread along the screen's x. ⭐ It
 * reads §1.1's per-axis states and deadband (`A11`), so it adds NO threshold: *"no dy"* is the y axis
 * still inside its own band.
 *
 * ⛔⛔ **A MODE KEYED ON MOTION — `METHOD` forbids it, so the decision is LATCHED.** *"A MODE may be
 * keyed on PRESENCE; never on MOTION"*: a verdict re-read every frame inherits every artefact of the
 * sensor. The gesture the owner asked for is motion by nature, so the render layer asks this ONCE per
 * pair of fingers: the first time it says yes, the pair is a zoom until a finger LIFTS, and translation
 * and roll are paused for all of it. ⚠ The cost, stated: a translation that happens to start with the
 * two fingers moving apart horizontally becomes a zoom for the rest of that pair's life.
 */
import type { MotionState } from "./motion";

/** One finger, as the rule needs it. */
export interface PinchFinger {
  readonly axes: { readonly x: MotionState; readonly y: MotionState };
  /** The sign of its latest NON-ZERO deadbanded `dx` — `0` before it has moved sideways. */
  readonly dxSign: -1 | 0 | 1;
  /** Its screen x, CSS px. */
  readonly x: number;
}

/** ⭐ `"OUT"` — spreading; `"IN"` — closing; `null` — not a horizontal pinch. */
export type HoldPinch = "OUT" | "IN" | null;

export function holdPinch(holder: PinchFinger, second: PinchFinger): HoldPinch {
  if (holder.axes.x !== "MOVING" || second.axes.x !== "MOVING") return null;
  if (holder.axes.y === "MOVING" || second.axes.y === "MOVING") return null;
  if (holder.dxSign === 0 || second.dxSign === 0 || holder.dxSign === second.dxSign) return null;
  // ⭐ Opposite horizontal travel: spreading when the finger on the RIGHT moves right.
  const right = second.x >= holder.x ? second : holder;
  return right.dxSign > 0 ? "OUT" : "IN";
}

/** ⭐ A finger's remembered `dx` sign: the new travel's, or the old one while it has none. */
export function nextDxSign(previous: -1 | 0 | 1, dx: number): -1 | 0 | 1 {
  return dx > 0 ? 1 : dx < 0 ? -1 : previous;
}
