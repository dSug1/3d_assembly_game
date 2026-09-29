/**
 * ⭐⭐⭐ **WHICH GRIP MODES ARE A TRANSLATION — one set, and every rule that asks reads THIS.**
 *
 * ⛔⛔⛔ **IT EXISTS BECAUSE THE SAME MISTAKE HAS BEEN MADE TWICE**, each time by a rule spelling
 * the question out for itself:
 *
 * * **defect 55** (device-reported three times): the approach swing asked *is any grip
 *   `"TRANSLATE"`* — and `scene.ts` set a holder's mode to `"DEPTH"` the instant the second
 *   touchpoint drove its axis, so pushing a body with that finger renamed the very grip the
 *   swing was hunting for. The camera never swung.
 * * **and the axis gizmo, 2026-09-23**: *"make sure the delta position on the second touch
 *   triggers the gizmo in the same way as the delta positions of the first touch on the object.
 *   It seems sometimes the gizmo does not show when the second touch is driving the
 *   translation."* ⭐ Same cause, same shape: `refreshAxisGizmo` skipped every grip whose mode was
 *   not literally `"TRANSLATE"`, so the gizmo vanished for exactly as long as the second finger
 *   was moving the body — which is when a hand most wants to see which way it is going.
 *
 * ⭐⭐ `METHOD`: *a rule keyed on a NAME inherits every later meaning of that name.* `"DEPTH"` did
 * not exist as a mode when the first of those tests was written — `A10` added it, and it quietly
 * took a translation out of every set that had been spelled out by hand.
 *
 * ⭐⭐⭐ **AND THE NAME ITSELF WAS THE TRAP, WHICH THE OWNER NAMED: *"the second finger should not
 * set mode to depth since it is driving the translation along gravity axis, not depth … or the
 * name of the mode 'depth' is ill chosen."*** ⛔ It was minted by `A10`, when that finger did
 * drive depth; `D75` moved it to **gravity** and the name stayed. ⭐ `"TRANSLATE_2ND"` names the
 * mode by what it IS — a translation, driven by the second touchpoint — so it cannot go stale the
 * next time the channels move, and it reads as a translation to anyone spelling the set out.
 *
 * ⚠ So the set is written ONCE, as data: a mode added later is a **decision** taken here, not a
 * silent omission somewhere else.
 *
 * ⛔ ENGINE-FREE.
 */

/**
 * The modes in which a grip is MOVING ITS BODY THROUGH SPACE.
 *
 * ⭐ `"TRANSLATE"` is the holder's own drag; `"TRANSLATE_2ND"` is the same body being moved along
 * the one axis the second touchpoint owns — **gravity** today, and the name does not say so on
 * purpose. ⛔ `"ROTATE"` is not here, and that is the distinction every
 * caller actually wants: a turn moves a body's surface without moving the body.
 */
export const TRANSLATING_MODES: readonly string[] = ["TRANSLATE", "TRANSLATE_2ND"];

/** Is this grip moving its body through space? ⚠ `null` — no grip — is not. */
export function isTranslatingMode(mode: string | null | undefined): boolean {
  return mode === undefined || mode === null ? false : TRANSLATING_MODES.includes(mode);
}
