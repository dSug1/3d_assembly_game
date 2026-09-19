/**
 * ⭐⭐⭐ **THE MOVEMENT MODE, AND THE TAP THAT FLIPS IT.**
 *
 * A held object's own drag either **translates** it in the screen plane or **rotates** it
 * (yaw about the world vertical, pitch about the horizontal screen axis), and **any single
 * tap, anywhere, flips between the two**. ⭐ The mode is one latch for the SESSION: it
 * survives a release, so the next grab resumes what the last one was doing.
 *
 * ⛔⛔ **THIS FILE REPLACES `assignment.ts`, AND THE RENAME IS THE POINT.** From `1.0.5` to
 * `1.0.7` the project carried **three forks** of §2/§4 behind one flag — `A` one touchpoint
 * translates, `B` the spec's own inversion, `C` this tap toggle — so that a hand could
 * compare them in the same minute on the same scene. ⭐ **The comparison is over**: the owner
 * closed fork C on the glass and chose it (`D28`, 2026-09-16), and A and B are **deleted**.
 * ⚠ A file called `assignment.ts` exporting only a mode toggle would be exactly the stale
 * name `router.ts` warns about: *a name that describes its consumer goes stale the moment the
 * consumer changes.*
 * ⭐ The forks' full account — why a flag beat two branches, what each fork did, and the
 * three formulations this toggle went through — is in
 * `Claude/00_CORE/queue_notes/IN13.md`. Nothing is lost by the deletion; it is one tier down.
 *
 * ⛔ ENGINE-FREE, like every file in this folder.
 */

import type { PointerRole } from "./router";

/** Everything `pressTogglesMode` depends on. ⛔ An object, not four positional booleans. */
export interface PressToggleContext {
  /** `IN2`'s role for this press, latched by the router. */
  readonly role: PointerRole;
  /** Is any touchpoint already carrying an object? ⚠ The owner's *"while the first touch is
   * pressed on an object"* — nothing held, nothing toggled. */
  readonly somethingIsHeld: boolean;
  /**
   * ⭐ Did this press land on the **exact same PioneerFace** the held body is aligned to?
   * ⛔ Both halves: the right object AND the right face. A different face of that Pioneer is
   * `A23`'s re-point, and a different object is a fresh alignment — neither is this.
   */
  readonly pressedTheHeldBodysPioneerFace: boolean;
  /**
   * Did the press already make, upgrade or re-point an alignment (`D55`/`A22`/`A23`)?
   * ⛔ **One gesture, one consequence** — the rule the whole alignment path is built on.
   */
  readonly pressActedOnTheAlignment: boolean;
  /**
   * ⭐ Is the held body an aligned Follower? ⛔ `D61` turns on this: a Follower's channels no
   * longer depend on the mode (`D59`), so a toggle there costs nothing — on a FREE body it
   * would change what the very finger being placed is about to drive.
   */
  readonly heldBodyIsAlignedFollower: boolean;
  /**
   * ⭐⭐ Is this the **first** press outside any object since the holder took the body?
   * ⚠ *"This first time the second touch is also reset when the first touch releases"* — and it
   * is reset **by construction**: the fact lives on the holder's grip, and the grip dies with
   * the finger. ⛔ Nothing calls a reset, so nothing can forget to.
   */
  readonly firstOutsidePressOfThisHold: boolean;
}

/**
 * ⭐⭐⭐ **`D58` — A NEW PRESS TOGGLES THE MOVEMENT MODE TOO, IN TWO PLACES.**
 *
 * > *"while the first touch is pressed on an object (free object or follower object), the toggle
 * > back and forth between rotation mode and translation mode can be triggered by: a tap outside
 * > any object (this is currently what is built) — a new continued press (= a tap where there is
 * > no release) outside any object — if the object is Follower, a new continued press on the
 * > exact same PioneerFace of the Pioneer object."* — the owner, 2026-09-19
 *
 * ⭐⭐ `D55`'s sweep reaching `D28`, the last rule that still demanded a RELEASE. The owner's
 * reason is the same throughout: *a finger that comes down and stays down is asking for the same
 * thing as one that comes down and lifts.*
 *
 * ⭐⭐⭐ **THE `PioneerFace` CASE GIVES A JOB TO THE ONE PRESS THAT HAD NONE.** Since `A22`, a
 * press on the face already aligned returns `NOTHING` unless it completes a rapid pair (then it
 * upgrades to `FOLLOW`). ⚠ That was the only safe handhold left on a Pioneer after `A23`, and it
 * is now also the mode toggle — so the two rules share one gesture and `pressActedOnTheAlignment`
 * is what keeps them from both firing.
 *
 * ⛔⛔ **A PRESS ON THE HELD OBJECT ITSELF IS *NOT* IN THE OWNER'S LIST, AND THAT MATTERS.**
 * `SECOND` is excluded. ⚠ Had it been included, the collision below would bite twice as hard:
 * that finger's channel is chosen by the very mode its arrival would flip.
 *
 * ⚠⚠⚠ **AND IT STILL COLLIDES WITH `A16`, WHICH IS THE OWNER'S TOO — FLAGGED, NOT RESOLVED
 * HERE.** *"Switching between the two shall indeed require the tap."* An `OUTSIDE` finger is
 * **the** finger that drives depth or roll (`scene.ts`, the only place either is applied), and
 * `secondFingerDrive` picks which by the mode. ⛔ So placing it flips what it will drive, and the
 * channel **alternates every time it goes down** rather than being chosen. ⭐ The `PioneerFace`
 * case is clean: with `pioneerTranslates = 0`, `pinnedSecondDrive` hands over BOTH axes and the
 * mode does not pick. See `ALIGNMENT_RULES.md` §5.6 for the worked consequence and the
 * one-line alternative (latch the channel at that finger's press).
 *
 * ⚠ `IGNORED` is excluded, and that is not an extra rule — it is *"wherever a tap triggers the
 * toggle"* read honestly: a third touchpoint runs **nothing** on release by `IN2`'s design, so no
 * tap triggers a toggle there and no press may either.
 */
export function pressTogglesMode(ctx: PressToggleContext): boolean {
  if (!ctx.somethingIsHeld) return false;
  // ⛔ The alignment wins the gesture whenever it acted — `D55`, `A22` and `A23` all consume it.
  if (ctx.pressActedOnTheAlignment) return false;
  if (ctx.role === "OUTSIDE") {
    // ⭐⭐⭐ **`D61` — ON A FREE BODY, THE FIRST OUTSIDE PRESS OF A HOLD DOES NOT TOGGLE.**
    //
    // > *"when an object is free (not follower), the first time the second touch is pressed
    // > outside any object shall not trigger a toggle of the translation/rotation mode. This
    // > first time the second touch is also reset when the first touch releases."*
    // > — the owner, 2026-09-19
    //
    // ⭐⭐ **IT CLOSES THE `A16` COLLISION `D58` OPENED, AND CLOSES IT WHERE `D59` COULD NOT.**
    // On a free body the mode still picks whether that finger drives roll or depth, so a toggle
    // on its arrival would change what it is about to do — the channel alternating on every
    // touch instead of being chosen. ⛔ The press that PLACES the finger is now inert; a
    // SECOND press during the same hold toggles, so switching costs a lift and a re-press
    // rather than being unavoidable. ⭐ That is `A16`'s *"switching … shall require the tap"*
    // with a press standing in for the tap — which is the whole of `D55`'s sweep.
    //
    // ⚠ A Follower is exempt because `D59` took the mode out of its channel selection: there is
    // nothing left for a toggle to disturb, and `D58` applies to it unchanged.
    if (!ctx.heldBodyIsAlignedFollower && ctx.firstOutsidePressOfThisHold) return false;
    return true;
  }
  if (ctx.role === "OBJECT") return ctx.pressedTheHeldBodysPioneerFace;
  return false;
}

/** What a held object's own drag does. ⭐ One latch per SESSION, not per gesture. */
export type Behaviour = "TRANSLATE" | "ROTATE";

/**
 * ⭐⭐⭐ What the session starts as, **once**.
 *
 * ⛔⛔ **`ROTATE` — the owner's *"Default start: rotation mode"* (2026-09-16), re-confirmed
 * 2026-09-17: *"I confirm the scene shall boot in rotation mode, not translation mode."***
 *
 * ⛔⛔ **IT RETURNED `TRANSLATE` UNTIL 2026-09-17 AND EVERY DOCUMENT SAID OTHERWISE.**
 * `CLAUDE.md`, this file's own neighbouring comment and `scene.ts`'s call site all recorded
 * `ROTATE`; the code returned `TRANSLATE`; and `tests/mode_toggle.test.ts` asserted the
 * RETURNED value, so the suite defended the defect. ⚠ `git log -S` finds no commit that ever
 * returned `ROTATE` — nothing regressed, the decision simply never reached the code.
 * ⭐⭐ `METHOD`: *a vector written from the code it tests cannot contradict that code* — which
 * is the same shape as `A7`'s composition, one layer lower: a correct decision, recorded
 * everywhere except in the one place that runs.
 * ⚠ `D23`'s argument for `TRANSLATE` (*the commonest gesture on the cheapest input*) is kept
 * here as the record of what was NOT chosen; it lost to the owner's hand.
 *
 * ⚠ **AND IT IS THE *SESSION'S* DEFAULT, NOT EVERY GESTURE'S** — corrected by a device look
 * on 2026-09-16. I first read the owner's *"for one single ongoing touchpoint"* as *the
 * toggle dies with the gesture*, and shipped it on the grip. A hand rejected it: *"when the
 * first touchpoint is released and pressed again, the movement automatically resets to
 * translation. I would expect the movement resumes the behavior as it was prior to
 * release."* ⭐ So it is a MODE, and rotation costs a tap only when **switching**.
 */
export function initialBehaviour(): Behaviour {
  return "ROTATE";
}

/**
 * ⭐ Flip the mode. **A tap, and nothing else, calls this.**
 *
 * ⛔⛔ **ONE TOGGLE PER TAP RELEASE, IMMEDIATELY** — and that took three formulations, each
 * corrected by a hand:
 *
 * 1. toggle at once, *consuming* the tap so two toggles could not reset the camera → a
 *    double tap toggled **twice** and the double-tap gesture could never form;
 * 2. a single tap **held** for `doubleTapWindow` and cancelled by a second — correct, and
 *    Unity's own parameter → ⛔ *"there is a lag … it shall be immediate"*;
 * 3. ✅ immediate again, with the consequence accepted in the owner's words: *"worst case, a
 *    double tap occurs and the behavior and movement can be reverted back while the camera
 *    orbit resets."*
 *
 * ⭐⭐⭐ Which is exactly what Unity's `Tap` does — it *"triggers immediately upon release …
 * does not wait to detect a second tap"* — chosen here deliberately, for a reason no
 * documentation states: **immediacy on a mode switch beats the discrimination.**
 * ⚠ `METHOD`: *a device judgement overturns a confident synthetic argument.* The deferral
 * was reasoned from first principles AND from Unity's parameters, and its cost was invisible
 * to both.
 */
export function toggleBehaviour(b: Behaviour): Behaviour {
  return b === "TRANSLATE" ? "ROTATE" : "TRANSLATE";
}

/**
 * §1.3's tap test, in **one** place.
 *
 * ⛔ It was inlined in the camera-reset branch, and the toggle needs the identical question
 * at a second site. ⭐ *"A tap is a tap whatever it lands on"* — that comment was already in
 * the code, and two copies of the arithmetic would be two definitions free to disagree
 * (`CONSTRAINTS` §4).
 *
 * ⚠ **A touchpoint that was CARRYING an object does not come through here**: it goes through
 * the §1.3 recognizer, which has already recorded its tap in the shared `TapHistory`. That
 * path reads the recognizer's own `TAP`/`DOUBLE_TAP` verdict instead — judging the same tap
 * twice would corrupt the double-tap pairing for every consumer, the camera reset included.
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
