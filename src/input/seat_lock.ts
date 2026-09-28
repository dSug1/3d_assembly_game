/**
 * ⭐⭐⭐ **`D139` — A SNAP STOPS THE GESTURE THAT MADE IT** (the owner, 2026-09-28: *"when the follower
 * snaps the pioneer, the translation shall stop and a touch lift or a click release is expected before
 * any other action except roll which can still continue. (otherwise, currently, the moment the follower
 * snaps, the translation continues and it translate both the pioneer and the follower together)."*).
 * ENGINE-FREE.
 *
 * ⭐ The moment a HELD Follower lands on its Pioneer (`D100`'s seat), that grip is LOCKED: every channel
 * it drives is refused except the ROLL (the spin about the seated face — the second finger's `dx`),
 * until the holding finger lifts or the click is released, which ends the grip and the lock with it.
 * ⛔ Without it, `D102` carried the finger straight on: a seated member's translation lands on the
 * assembly's ROOT, so the same drag that made the seat went on to drag the Pioneer and the Follower away
 * together.
 * ⭐ Keyed on an EVENT (the landing) and ended by PRESENCE (the lift) — never on motion (`METHOD`).
 */

/** What a grip can drive. */
export type GripChannel =
  /** The first finger's translation. */
  | "TRANSLATE"
  /** The first finger's free rotation (yaw / pitch). */
  | "ROTATE"
  /** The second finger's `dy` — along gravity. */
  | "LIFT"
  /** The second finger's `dx` — the spin about the seated face (or gravity). */
  | "ROLL"
  /** `D137`'s sideways pinch. */
  | "ZOOM"
  /** A second-touch TAP: align elsewhere, unalign, release followers, toggle the mode. */
  | "TAP";

/** ⭐ May this grip drive `channel`? A locked grip keeps the ROLL alone. */
export function seatLockAllows(locked: boolean, channel: GripChannel): boolean {
  return !locked || channel === "ROLL";
}
