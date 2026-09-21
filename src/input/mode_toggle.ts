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

/**
 * ⛔⛔⛔ **`D66` — A PRESS DOES NOT TOGGLE THE MODE. ONLY A TAP DOES, AND THAT IS `D28`
 * AGAIN.** Four decisions are repealed here, all of them from this file:
 *
 * > *"A press never toggles while a body is held, but a tap by the second touchpoint can (as
 * > per present rule for tap)."* — the owner, 2026-09-21
 *
 * ⛔ **GONE**: `pressTogglesMode` and its `PressToggleContext` (`D58`, the press toggle in its
 * two places), `D61`'s first-outside-press exemption, and `releaseTogglesMode` with both of the
 * facts it was tried on — `D64`'s *did this finger drive* and `D65`'s *is this a second touch*.
 *
 * ⭐⭐⭐ **AND THE WHOLE CHAIN WAS ONE DEFECT'S CONSEQUENCES.** `D58` made a press toggle;
 * that collided with `A16` (*the second finger's channel is chosen by the mode its own arrival
 * flips*), so `D61` made the first press inert — but exempted an aligned Follower, on the
 * argument that `D59` had left nothing for a toggle to disturb. ⚠⚠ **That argument was
 * incomplete**: the toggle disturbs what the FIRST touch does *after the second one lifts*, and
 * `translatesOnDrag` hides the change until exactly that moment. ⭐ So the mode flipped on the
 * press, invisibly, and a hand reported it as *"when I release the second touch, the follower
 * switches to rotation mode"* — which sent two fixes (`D64`, `D65`) at the release, where the
 * defect was not.
 *
 * ⭐⭐ **THE LESSON, AND IT IS ABOUT THE REPORT AND NOT THE CODE**: *when a rule's effect is
 * masked while a gesture is in progress, a hand can only report the moment the MASK lifts.*
 * ⛔ Two rounds were spent fixing the event the finger was on rather than the event the state
 * changed on. The HUD had said `press outside → ROTATE` the whole time.
 *
 * ⭐ What is left is what `A16` asked for before any of this: **switching the mode requires a
 * TAP** — and a tap is a tap wherever it lands, held or not, which is `D27`/`D28` unchanged.
 */

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
