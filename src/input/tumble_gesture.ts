/**
 * ⭐⭐⭐ prototype — **THE YAW / PITCH GESTURE** (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"build the yaw and pitch"*, the
 * latch and the spacing tolerance *"OK"*; desktop *"the yaw/pitch shall be with left button hold and right button hold and drag"*).
 *
 * Outside the sphere, the orbited piece aligned:
 * - **Mobile** — the second finger lands while the orbit finger is down: UNDECIDED until either the fingers' SPACING changes by more than
 *   the tolerance (→ PINCH: the zoom and the taps go on as before) or their MIDPOINT travels past the deadband with the spacing kept
 *   (→ SLIDE). Latched for the gesture.
 * - **Desktop** — the right button pressed while the left one orbits, then a drag: a SLIDE from the start (one cursor, no spacing).
 * - **The axis** — of a SLIDE, whichever of x and y FIRST passes the deadband owns it until release (a diagonal never mixes yaw and pitch).
 * - **The steps** — the travel along that axis (x right +, y UP +), whole steps of `stepMm` (`orbitRollSteps`: a fresh count per gesture,
 *   signed; back through zero before it steps the other way).
 * - **The turn** — x: YAW on a vertical resting face, the ROLL on a horizontal one (the owner: *"the two-finger dx should do the same as the
 *   roll"*); y: PITCH. Decided once, when the axis latches.
 * ⛔ No engine, no scene: positions in millimetres.
 */
import { orbitRollSteps } from "./piece_orbit";

export type TumbleKind = "UNDECIDED" | "PINCH" | "SLIDE";
export type TumbleTurn = "YAW" | "PITCH" | "ROLL";

export interface TumbleGesture {
  readonly kind: TumbleKind;
  readonly axis: "X" | "Y" | null;
  /** The fingers' spacing at the start (mm); `null` for the mouse. */
  readonly spacing0Mm: number | null;
  /** The travel along the latched axis already counted (mm). */
  readonly countedMm: number;
  /** The travel not yet a whole step (mm, signed). */
  readonly acc: number;
}

/** ⭐ A gesture starting — two fingers `spacingMm` apart (UNDECIDED), or the mouse (`null`: a SLIDE at once). */
export function startTumble(spacingMm: number | null): TumbleGesture {
  return { kind: spacingMm === null ? "SLIDE" : "UNDECIDED", axis: null, spacing0Mm: spacingMm, countedMm: 0, acc: 0 };
}

/**
 * ⭐ One step of the gesture: `travelMm` the midpoint's (or the cursor's) travel SINCE THE START (x right, y up), `spacingMm` the fingers'
 * spacing now (`null` for the mouse). The new state and the whole steps to make now (signed, along the latched axis).
 */
export function stepTumble(
  g: TumbleGesture,
  travelMm: readonly [number, number],
  spacingMm: number | null,
  tolMm: number,
  deadbandMm: number,
  stepMm: number,
): { readonly g: TumbleGesture; readonly steps: number } {
  let kind = g.kind;
  if (kind === "UNDECIDED") {
    if (spacingMm !== null && g.spacing0Mm !== null && Math.abs(spacingMm - g.spacing0Mm) > tolMm) kind = "PINCH";
    else if (Math.hypot(travelMm[0], travelMm[1]) > deadbandMm) kind = "SLIDE";
  }
  if (kind !== "SLIDE") return { g: { ...g, kind }, steps: 0 };
  let axis = g.axis;
  if (axis === null) {
    const ax = Math.abs(travelMm[0]);
    const ay = Math.abs(travelMm[1]);
    if (ax > deadbandMm || ay > deadbandMm) axis = ax >= ay ? "X" : "Y";
  }
  if (axis === null) return { g: { ...g, kind }, steps: 0 };
  const along = axis === "X" ? travelMm[0] : travelMm[1];
  const r = orbitRollSteps(g.acc, along - g.countedMm, stepMm);
  return { g: { kind, axis, spacing0Mm: g.spacing0Mm, countedMm: along, acc: r.acc }, steps: r.steps };
}

/** ⭐ What a latched axis turns: x — the YAW on a vertical resting face, else the ROLL; y — the PITCH. */
export function tumbleTurnOf(axis: "X" | "Y", verticalFace: boolean): TumbleTurn {
  return axis === "Y" ? "PITCH" : verticalFace ? "YAW" : "ROLL";
}
