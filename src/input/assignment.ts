/**
 * ⭐⭐⭐ **THE TOUCHPOINT ASSIGNMENT — the `1.0.5` A/B, as a flag rather than a fork.**
 *
 * Two readings of §2/§4 are live at once, and the owner intends to judge them *holistically*
 * when the input system is more complete rather than now:
 *
 * * **`ONE_FINGER_TRANSLATE`** — `A13`/`D23`: one touchpoint TRANSLATES, and a second one
 *   held still turns the same drag into a ROTATION. ⚠ The shipped default until 2026-09-16,
 *   and still the only reading closed by a device look of its own (*"everything is
 *   working"*). ⛔ **Fork C is now the default**, by the owner's decision after driving all
 *   three — so A is one URL parameter away rather than the baseline.
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
 * ⭐⭐⭐ FORK C — what the SESSION starts as, once.
 *
 * ⛔ `TRANSLATE`, which is fork A's single-touchpoint behaviour, because the owner named the
 * toggle as *"between the behaviors of fork A and fork B"* in that order — and because
 * translate is the commonest gesture, which is `D23`'s whole argument.
 *
 * ⛔⛔ **AND IT IS THE SESSION'S DEFAULT, NOT EVERY GESTURE'S — CORRECTED BY A DEVICE LOOK,
 * 2026-09-16.** I first read the owner's *"for one single ongoing touchpoint"* as *the toggle
 * dies with the gesture*, and said so. A hand rejected it: *"when the first touchpoint is
 * released and pressed again, the movement automatically resets to translation. I would
 * expect the movement resumes the behavior as it was prior to release."*
 * ⭐⭐ So the toggle is a **MODE, not a per-gesture flag**: it persists until tapped again,
 * and a new grip adopts it. ⭐ It also removes the cost I had stated — rotation no longer
 * costs a tap *every time*, only when switching — which was the strongest argument against
 * the fork and was an artefact of my reading, not of the owner's design.
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
 * ⛔⛔ **RETIRED BY A DEVICE LOOK, 2026-09-16 — THE TOGGLE IS IMMEDIATE.**
 *
 * This file briefly held a **deferral**: a tap armed a toggle that fired only after
 * `doubleTapWindow` with no second tap, so that a double tap could be told from two single
 * taps before anything moved. ⚠ It was correct, it was Unity's parameter, and **a hand
 * rejected it**: *"there is a lag when the second touchpoint is tapped and the behavior
 * change. It shall be immediate."*
 *
 * ⭐⭐ **THE OWNER'S TRADE, IN THEIR OWN WORDS**: *"worst case, a double tap occurs and the
 * behavior and movement can be reverted back while the camera orbit resets."* So a double
 * tap now toggles **twice** — back to where it started, which is *"reverted back"* — and the
 * camera reset fires as it does in every other fork. ⛔ Both consequences are ACCEPTED, not
 * overlooked: latency on a mode switch is felt on every use, and a double tap while holding
 * an object is rare and self-correcting.
 *
 * ⭐⭐⭐ **AND THAT IS EXACTLY WHAT UNITY DOES**, which is worth recording rather than
 * quietly reverting to: its `Tap` interaction *"triggers immediately upon release … It does
 * not wait to detect a second tap"*, so binding `Tap` and `MultiTap` to one control fires
 * the single action twice on a double tap. ⚠ I had called that a wart Unity leaves to the
 * application. A hand has now chosen it deliberately, for a reason the docs do not mention:
 * **the immediacy is worth more than the discrimination.**
 * ⭐ The inter-tap window still exists and still means what it did — `TapHistory` uses it
 * for §1.3's double tap — it simply no longer gates the toggle.
 *
 * ⚠ `METHOD`: *a device judgement overturns a confident synthetic argument.* The deferral
 * was reasoned from first principles and from Unity's own parameters, and the thing it cost
 * (300 ms on every mode switch) was invisible to all of that.
 */

/**
 * ⛔⛔ **ANY SINGLE TAP TOGGLES, ANYWHERE — owner, 2026-09-16.** *"A single tap by one only
 * touchpoint anywhere also toggles the movement behavior (not only a tap by second
 * touchpoint as currently setup)."*
 *
 * ⚠ **THE GUARD THAT WENT, AND WHY IT WAS THERE.** This took a third argument —
 * `holderPresent`, something actually being carried — on two arguments I had written down:
 * that a *second* touchpoint presupposes a first, so with nothing held there was no ongoing
 * gesture to toggle; and that §1.3's camera double-tap had to stay reachable on an empty
 * scene. ⭐ The first dissolved when the toggle became a **session mode** — it is now the
 * state the NEXT grab inherits, so setting it with an empty hand is the useful case rather
 * than a meaningless one. ⭐⭐ The second was already answered by the owner's accepted trade:
 * a double tap toggles twice — back where it started — **and** resets the camera. Nothing
 * became unreachable; one gesture does two things, deliberately.
 * ⛔ So the parameter is **removed rather than ignored**: a dead argument named after a
 * condition a hand overruled is an invitation to wire it back — the same reason
 * `holderDrive` refuses to take a motion state.
 *
 * @param assignment only `TAP_TOGGLE` toggles; forks A and B are untouched by this.
 * @param wasTap     did the release pass §1.3's tap test — `isTapRelease` for a touchpoint
 *   that carried nothing, or the recognizer's own `TAP`/`DOUBLE_TAP` verdict for one that
 *   was carrying an object. ⛔ The only condition left.
 */
export function tapTogglesBehaviour(assignment: Assignment, wasTap: boolean): boolean {
  return assignment === "TAP_TOGGLE" && wasTap;
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
