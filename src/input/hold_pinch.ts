/**
 * ⭐⭐⭐ **`D137` — A HORIZONTAL PINCH WHILE HOLDING A BODY ZOOMS** (the owner, 2026-09-28: *"In mobile,
 * during the translation of an object, if two touchpoints have dx which go towards or away from each
 * other and no dy (similar to a pinch out or in to zoom), then pause the translation and perform a zoom
 * out or in"*, then *"pause the translation and the roll"*). ENGINE-FREE.
 *
 * ⭐ **ON** (`holdPinch`): both fingers' x axes are `MOVING`, their latest sideways travel points in
 * OPPOSITE directions, and **both `dy` are zero** — the deadbanded `dy` of §1.1 (`A11`), so *"no dy"* is
 * a finger's vertical travel inside its own band (`motionDeadbandMm`, the slider already there).
 * ⭐⭐ **OFF** (`holdPinchEnds`) — amended the same day (the owner: *"the zoom should stop and the
 * translation toggled back as soon as one dy is not zero … subject to the deadband"*): the moment
 * EITHER finger's deadbanded `dy` is non-zero, the zoom ends and that move is the translation's (or the
 * roll's) again. It may come back if the pinch comes back.
 *
 * ⛔⛔ **A MODE KEYED ON MOTION — `METHOD` forbids it; the owner chose it, and the deadband is its
 * hysteresis.** *"A MODE may be keyed on PRESENCE; never on MOTION."* The first build latched the zoom
 * until a finger lifted, whose cost was a translation stuck as a zoom; this one toggles, and its cost is
 * the other side: a finger's vertical jitter past the band ends a zoom, and a sideways drift with both
 * fingers inside their y bands starts one. ⚠ The band is the same one every rule reads, so the two
 * directions of the toggle cannot disagree about what *"no dy"* means.
 */
import type { MotionState } from "./motion";

/** One finger, as the rule needs it. */
export interface PinchFinger {
  readonly axes: { readonly x: MotionState };
  /** The sign of its latest NON-ZERO deadbanded `dx` — `0` before it has moved sideways. */
  readonly dxSign: -1 | 0 | 1;
  /** Its latest DEADBANDED `dy`, CSS px — `0` while its vertical travel is inside the band. */
  readonly dy: number;
  /** Its screen x, CSS px. */
  readonly x: number;
}

/** ⭐ `"OUT"` — spreading; `"IN"` — closing; `null` — not a horizontal pinch. */
export type HoldPinch = "OUT" | "IN" | null;

/** ⭐ Does the zoom START? */
export function holdPinch(holder: PinchFinger, second: PinchFinger): HoldPinch {
  if (holder.axes.x !== "MOVING" || second.axes.x !== "MOVING") return null;
  if (holder.dy !== 0 || second.dy !== 0) return null;
  if (holder.dxSign === 0 || second.dxSign === 0 || holder.dxSign === second.dxSign) return null;
  // ⭐ Opposite horizontal travel: spreading when the finger on the RIGHT moves right.
  const right = second.x >= holder.x ? second : holder;
  return right.dxSign > 0 ? "OUT" : "IN";
}

/** ⭐⭐ Does a running zoom END? — as soon as either finger's deadbanded `dy` is not zero. */
export function holdPinchEnds(holderDy: number, secondDy: number): boolean {
  return holderDy !== 0 || secondDy !== 0;
}

/** ⭐ A finger's remembered `dx` sign: the new travel's, or the old one while it has none. */
export function nextDxSign(previous: -1 | 0 | 1, dx: number): -1 | 0 | 1 {
  return dx > 0 ? 1 : dx < 0 ? -1 : previous;
}
