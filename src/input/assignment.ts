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
  | "TWO_FINGER_TRANSLATE"
  /**
   * ⭐⭐⭐ **FORK C — a second touchpoint TAPPED toggles what the ongoing drag does**
   * (owner, 2026-09-16). A *pressed* second touchpoint keeps every meaning it has now
   * (depth, roll, two objects); only a **tap** flips the holder between A's behaviour
   * (translate) and B's (rotate), **for the gesture in progress**.
   *
   * ⛔⛔ IT IS NOT AN INVERSION, WHICH IS WHY IT IS A THIRD FORK AND NOT A SETTING OF THE
   * FIRST TWO. In A and B the mode is a function of *presence*; in C presence does not
   * choose the mode at all — a **discrete tap** does, and a held second finger is left free
   * to mean only what it already means.
   * ⭐ One consequence argues in C's favour and is worth recording: the mode no longer
   * depends on whether a second touchpoint is down, so **fork C structurally cannot have the
   * defect `A14` was written to fix** — there is no lift-and-replace gap to translate
   * through.
   */
  | "TAP_TOGGLE";

/** What a held object's own drag does. ⭐ Fork C carries one of these PER GESTURE. */
export type Behaviour = "TRANSLATE" | "ROTATE";

/**
 * Read the config flag as an assignment.
 *
 * ⚠ The flag is a **number** (`0`/`1`) and not a boolean for one concrete reason: the URL
 * override parser accepts the numeric fields of the config and nothing else, so a numeric
 * flag is A/B-able by URL (`?touchpointAssignment=1`) and by the menu's own slider with
 * **no new machinery**. ⛔ Anything other than 0 or 1 is refused by `validateGestureConfig`
 * rather than silently rounded — a half-set flag would be a third reading nobody designed.
 */
export function assignmentOf(flag: number): Assignment {
  if (flag === 2) return "TAP_TOGGLE";
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
  if (a === "TAP_TOGGLE") return "tap-toggle";
  return a === "TWO_FINGER_TRANSLATE" ? "two-finger-translate" : "one-finger-translate";
}

/**
 * ⭐⭐⭐ FORK C — what a gesture STARTS as.
 *
 * ⛔ `TRANSLATE`, which is fork A's single-touchpoint behaviour, because the owner named
 * the toggle as *"between the behaviors of fork A and fork B"* in that order — and because
 * translate is the commonest gesture, which is `D23`'s whole argument.
 * ⚠ So in fork C **rotation always costs one tap**. That is the trade the fork exists to be
 * judged on, not an oversight.
 */
export function initialBehaviour(): Behaviour {
  return "TRANSLATE";
}

/** ⭐ FORK C — flip the ongoing gesture's behaviour. A tap, and nothing else, calls this. */
export function toggleBehaviour(b: Behaviour): Behaviour {
  return b === "TRANSLATE" ? "ROTATE" : "TRANSLATE";
}

/**
 * ⭐⭐⭐ FORK C — does this second-touchpoint RELEASE consume as a toggle?
 *
 * ⛔⛔ AND *CONSUME* IS THE LOAD-BEARING WORD. A tap outside any object already means
 * something: two of them fly the camera home (§1.3's double-tap). If a toggling tap also
 * reached the tap history, **toggling twice would reset the camera** — a gesture the user
 * never asked for, arriving while they were switching modes. ⭐ So a tap that toggles is
 * spent: no tap history, no release verdict, no flick test. ⚠ It is the rule `D10` already
 * states for an `IGNORED` touchpoint and `A15` for an orphaned holder — a touch that did one
 * job does not also get to do another.
 *
 * @param assignment    only `TAP_TOGGLE` toggles; A and B are untouched by this.
 * @param wasTap        did the release pass §1.3's tap test (`isTapRelease`)?
 * @param holderPresent is a touchpoint actually carrying an object? ⛔ With nothing held
 *   there is no ongoing gesture to toggle, and the tap must keep its existing meaning — the
 *   camera double-tap has to stay reachable on an empty scene, which is the scene it is most
 *   wanted on.
 */
/**
 * ⭐⭐⭐ **A SINGLE TAP IS NOT KNOWN TO BE SINGLE UNTIL THE DOUBLE-TAP WINDOW HAS PASSED.**
 *
 * ⛔⛔ THE DEFECT THIS FIXES, owner-reported 2026-09-16: fork C toggled on **every** tap
 * the instant it landed, so a **double** tap toggled **twice** — a visible net-nothing — and
 * the double-tap gesture could never form at all. *"Double tap vs two single taps: it shall
 * be discriminated by time between two taps."*
 *
 * ⭐⭐ **UNITY, CHECKED (Input System 1.12 docs), because the owner asked:**
 *
 * | Unity | ours |
 * |---|---|
 * | `InputSettings.defaultTapTime` = **0.2 s** — max press-to-release for a tap | `tapMaxDuration` = **250 ms** |
 * | `MultiTapInteraction.tapDelay` = **2 × tapTime** (`multiTapDelayTime` = **0.75 s** globally) — max gap BETWEEN taps | `doubleTapWindow` = **300 ms** |
 * | `InputSettings.tapRadius` = **5 px** — movement bound | `doubleTapSlop` = **8 mm** — ⭐ millimetres, per `D7` |
 *
 * ⭐ So the owner is right and the parameter is the **inter-tap delay**, which this project
 * already had. ⛔⛔ **BUT UNITY DOES NOT SOLVE THE AMBIGUITY, AND THAT IS THE HALF WE WERE
 * MISSING**: its `Tap` interaction *"triggers immediately upon release … It does not wait to
 * detect a second tap"*, so binding `Tap` and `MultiTap` to one control fires the single
 * action twice on a double tap. ⭐ Unity leaves the deferral to the application — so here it
 * is, and it is the classic single-vs-double-click answer: **hold the single action for the
 * inter-tap window, and cancel it if a second tap arrives.**
 *
 * ⚠ **THE COST, STATED**: in fork C the toggle now lands `doubleTapWindow` (300 ms) after
 * the tap. That is real, and it is the price of the two gestures being distinguishable at
 * all. ⭐ Unity's own default would make it 500-750 ms.
 *
 * ⛔⛔ **AND IT MUST BE THE SAME CONSTANT AS THE DOUBLE-TAP WINDOW, not a second tunable.**
 * The quantity *is* *"the time within which a second tap would have arrived"*. Two numbers
 * could disagree, and a gap between them is a tap that is **neither** single nor double:
 * shorter, and a toggle fires before the pair completes; longer, and the pair is judged
 * while a toggle is still pending. `CONSTRAINTS` §4 — one constant, one place.
 */

/** ⭐ Fork C's provisional tap: the release time of a tap not yet known to be single. */
export type PendingToggle = number | null;

/**
 * ⭐⭐ Fold a tap verdict into the pending state.
 *
 * @param verdict `TapHistory`'s answer — ONE definition of the gap and slop tests, shared
 *   with §1.3's camera double-tap rather than re-derived here.
 * @param armed   is this tap one that fork C would act on at all (`tapTogglesBehaviour`)?
 */
export function pendingAfterTap(
  pending: PendingToggle,
  verdict: "TAP" | "DOUBLE_TAP",
  armed: boolean,
  releaseT: number,
): PendingToggle {
  // ⛔⛔ A DOUBLE TAP CANCELS, and this line is the whole fix. The first tap of the pair
  // already armed a toggle; without cancelling it, the pair toggles once AND resets the
  // camera — which is worse than the original defect, not better.
  if (verdict === "DOUBLE_TAP") return null;
  if (!armed) return pending;
  return releaseT;
}

/**
 * ⭐ Has a provisional tap outlived the window in which a second one could have joined it?
 *
 * ⚠ Strictly greater: at exactly `windowMs` a second tap would still form a pair
 * (`TapHistory` compares `gap <= doubleTapWindow`), so firing AT the boundary would make
 * both verdicts true for the same instant.
 */
export function toggleDue(pending: PendingToggle, now: number, windowMs: number): boolean {
  return pending !== null && now - pending > windowMs;
}

export function tapTogglesBehaviour(
  assignment: Assignment,
  wasTap: boolean,
  holderPresent: boolean,
): boolean {
  return assignment === "TAP_TOGGLE" && wasTap && holderPresent;
}

/**
 * §1.3's tap test, as one function instead of two copies.
 *
 * ⛔ It was inlined in the camera-reset branch, and fork C needs the identical question at
 * a second place. ⭐ *"A tap is a tap whatever it lands on"* — that comment was already in
 * the code; two copies of the arithmetic would be two definitions free to disagree, and
 * `CONSTRAINTS` §4 is explicit that one rule lives in one place.
 *
 * @param slopPx the slop already converted to pixels. ⚠ Converted by the CALLER, because
 *   `mmToPx` needs the device and this file is engine-free and device-free.
 */
export function isTapRelease(
  pressedT: number,
  pressedX: number,
  pressedY: number,
  releaseT: number,
  releaseX: number,
  releaseY: number,
  maxDurationMs: number,
  slopPx: number,
): boolean {
  return (
    releaseT - pressedT <= maxDurationMs &&
    Math.hypot(releaseX - pressedX, releaseY - pressedY) <= slopPx
  );
}
