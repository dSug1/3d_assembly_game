/**
 * ⭐⭐⭐ **THE TOUCHPOINT ASSIGNMENT — the `1.0.5` A/B, as a flag rather than a fork.**
 *
 * Two readings of §2/§4 are live at once, and the owner intends to judge them *holistically*
 * when the input system is more complete rather than now:
 *
 * * **`ONE_FINGER_TRANSLATE`** — `A13`/`D23`: one touchpoint TRANSLATES, and a second one
 *   held still turns the same drag into a ROTATION. ⭐ The shipped default, because it is
 *   the one a hand has judged (2026-09-16, *"everything is working"*).
 * * **`TWO_FINGER_TRANSLATE`** — ⭐ **the SPEC's original assignment**, which `A13` amended:
 *   §2 rule 2bis rotates on one touchpoint, §4 rule 6 translates on two. ⚠ Not a revert to
 *   an old commit: everything built since `A13` — `A14`'s grace, `A15`'s orphan check, the
 *   gravity frame, `3D1`'s model — applies to both readings unchanged.
 *
 * ⭐⭐ WHY A FLAG AND NOT TWO BRANCHES. The entire behavioural difference is **one
 * inversion**, in `holderDrive`, at one call site. Everything else is assignment-agnostic:
 * depth and roll key on *the holder is still*, which neither reading touches. ⛔ Two
 * branches would have doubled every device pass and made every later row a cherry-pick,
 * to express one boolean — and `CLAUDE.md` forbids a second queue, which two forks invite.
 *
 * ⛔⛔ **AND IT LATCHES ONLY WHILE NOTHING IS TOUCHING THE GLASS** *(owner, 2026-09-16)*.
 * ⭐ The owner's rule is stricter than the one I proposed (latch at press) and it is the
 * better one: at press, a flip between two fingers landing would still swap the meaning of
 * a gesture that had already begun. **Nothing down** is the only state in which no gesture
 * can be in flight, so it is the only safe moment to change what a gesture MEANS.
 * ⚠ The toggle's own touch cannot block it: the menu is a DOM panel over the canvas, so its
 * events never reach the pointer router at all.
 * ⭐ It is the same family as §4's role latch and `A7`'s frame — decide on a discrete,
 * visible boundary, never mid-gesture — one level up: this latches the RULE TABLE, not a
 * role within it.
 */

/** Which reading of §2/§4 is in force. */
export type Assignment =
  /** `A13`: one touchpoint translates; a second held still rotates. The default. */
  | "ONE_FINGER_TRANSLATE"
  /** The spec as written: one touchpoint rotates; two translate. */
  | "TWO_FINGER_TRANSLATE";

/**
 * Read the config flag as an assignment.
 *
 * ⚠ The flag is a **number** (`0`/`1`) and not a boolean for one concrete reason: the URL
 * override parser accepts the numeric fields of the config and nothing else, so a numeric
 * flag is A/B-able by URL (`?translateNeedsSecondTouch=1`) and by the menu's own slider with
 * **no new machinery**. ⛔ Anything other than 0 or 1 is refused by `validateGestureConfig`
 * rather than silently rounded — a half-set flag would be a third reading nobody designed.
 */
export function assignmentOf(flag: number): Assignment {
  return flag === 1 ? "TWO_FINGER_TRANSLATE" : "ONE_FINGER_TRANSLATE";
}

/**
 * ⭐⭐⭐ Adopt a requested assignment **only when the glass is empty**.
 *
 * @param live          what is in force right now.
 * @param requested     what the config says now (the menu or the URL may have changed it).
 * @param touchpointsDown every live touchpoint, `IGNORED` ones included. ⛔ `router.size`,
 *   never `activeCount`: an ignored third finger is still a finger on the glass, and the
 *   question here is *"is any gesture possibly in flight?"*, not *"does a rule see it?"*.
 * @returns the assignment to use. ⚠ Unchanged while anything is down, so a flip mid-gesture
 *   is **deferred, not dropped** — it takes effect the moment the last finger lifts.
 */
export function adoptAssignment(
  live: Assignment,
  requested: Assignment,
  touchpointsDown: number,
): Assignment {
  return touchpointsDown === 0 ? requested : live;
}

/**
 * ⭐ Is a requested change waiting for the glass to clear?
 *
 * ⛔ FOR THE READOUT, and it is not decoration: while this is true the menu shows one value
 * and the product obeys another. ⚠ An A/B session is exactly when that gap would be
 * mistaken for the flag doing nothing — and `METHOD` has the verdict twice over, most
 * recently the tuning line that was computed, handed over and never printed.
 */
export function assignmentPending(live: Assignment, requested: Assignment): boolean {
  return live !== requested;
}

/** ⭐ Short form for the HUD. ⚠ Names the FORK, so a device report cannot be misattributed. */
export function assignmentLabel(a: Assignment): string {
  return a === "TWO_FINGER_TRANSLATE" ? "two-finger-translate" : "one-finger-translate";
}
