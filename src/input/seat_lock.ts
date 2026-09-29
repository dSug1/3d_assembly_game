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
 *
 * ⭐⭐ **`D172` — AND THE ROLL MUST BE RE-ARMED** (the owner, 2026-09-29: *"when a follower snaps, the roll with
 * second touch or shift + click shall be possible only if re-armed (by a new second touch or a new click or a new
 * shift). Otherwise there is a risk a slight dx modifies the roll immediately after the snap occurs."*): the second
 * touchpoint that was ALREADY DOWN at the landing no longer rolls; only one pressed AFTER it does — a new finger on
 * the tablet, a new Shift on the desktop (each a new touchpoint). A new click ends the grip, and its lock with it.
 * ⭐ Decided by PRESS ORDER (the router's `seq`, which only grows), never by motion or by a timer.
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

/**
 * ⭐ May this grip drive `channel`? A locked grip keeps the ROLL alone — and (`D172`) only from a RE-ARMED touchpoint.
 * @param rearmed `rollRearmed(...)` for the touchpoint asking; ignored for every other channel.
 */
export function seatLockAllows(locked: boolean, channel: GripChannel, rearmed = false): boolean {
  return !locked || (channel === "ROLL" && rearmed);
}

/**
 * ⭐⭐ `D172`: is the touchpoint `seq` pressed AFTER the seat? `lastSeqAtSeat` is the highest press order among the
 * touchpoints down at the landing (`−1` when none) — any later press has a greater one.
 */
export function rollRearmed(seq: number, lastSeqAtSeat: number): boolean {
  return seq > lastSeqAtSeat;
}
