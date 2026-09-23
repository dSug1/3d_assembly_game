/**
 * ⭐⭐⭐ **WHICH GRIP MODES ARE A TRANSLATION — one set, and every rule that asks reads THIS.**
 *
 * ⛔⛔⛔ **IT EXISTS BECAUSE THE SAME MISTAKE HAS NOW BEEN MADE THREE TIMES**, each time by a
 * rule spelling the question out for itself:
 *
 * * **defect 55** (device-reported three times): the approach swing asked *is any grip
 *   `"TRANSLATE"`* — and `scene.ts` sets a holder's mode to `"DEPTH"` the instant the second
 *   touchpoint drives its axis, so pushing a body along that channel renamed the very grip the
 *   swing was hunting for. The camera never swung.
 * * **defect 60** (this file's reason, 2026-09-23): the axis gizmo hid itself whenever
 *   `grip.mode !== "TRANSLATE"` — so the LeadingFace marker vanished for exactly as long as the
 *   second finger was advancing the body, which is when a hand most wants to see it.
 * * and the sway, which asks the same question one line after `scene.ts` has re-decided the
 *   mode, and is therefore right today **by accident of ordering**.
 *
 * ⭐⭐ `METHOD`: *a rule keyed on a NAME inherits every later meaning of that name.* `"DEPTH"`
 * did not exist as a mode when the first of those tests was written — `A10` added it, and it
 * quietly took a translation out of every set that had been spelled out by hand.
 *
 * ⚠ So the set is written ONCE, as data: a mode added later is a **decision** taken here, not a
 * silent omission somewhere else. ⛔ Adding one without touching this file is the failure this
 * module exists to make impossible.
 *
 * ⚠ Takes a mode rather than a grip so it stays engine-free: the caller holds the objects, this
 * holds the decision.
 *
 * ⛔ ENGINE-FREE.
 */

/**
 * The modes in which a grip is MOVING ITS BODY THROUGH SPACE.
 *
 * ⭐ `"TRANSLATE"` is the holder's own drag; `"DEPTH"` is the same body being pushed along the
 * one axis the second touchpoint owns. ⛔ `"ROTATE"` is not here, and that is the distinction
 * every caller actually wants: a turn moves a body's surface without moving the body.
 */
export const TRANSLATING_MODES: readonly string[] = ["TRANSLATE", "DEPTH"];

/** Is this grip moving its body through space? ⚠ `null` — no grip — is not. */
export function isTranslatingMode(mode: string | null | undefined): boolean {
  return mode === undefined || mode === null ? false : TRANSLATING_MODES.includes(mode);
}
