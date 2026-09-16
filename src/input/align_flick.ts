/**
 * ⭐⭐⭐ **`IN3`, RULES 2ter AND 2quater — A FLICK PUSHES AN ALIGNMENT.**
 *
 * > **2ter** — one selected object && vertical flick && touchpoint released => push
 * > `GRAVITY_ALIGN(selected face, -g for y<0 / +g for y>0)`, re-solve per §1.4, unselect.
 * > **2quater** — horizontal flick => resolve screen +x (x>0) or -x (x<0) into a **world**
 * > vector, push `WORLD_AXIS_ALIGN(selected face, that vector)`, re-solve, unselect.
 *
 * ⛔⛔ **AND IT FIRES ONLY WHILE THE MODE IS `ROTATE`** *(owner, 2026-09-16)*. The spec
 * predates the movement mode, and read literally a flick anchors whatever the drag was
 * doing — so a brisk vertical **translate** would move a part and then spin it to align a
 * face with gravity. ⭐ In `ROTATE` the hand is already manipulating orientation, so
 * completing that with an alignment reads as the same intention; in `TRANSLATE` it is a
 * different one, and the gesture is identical either way.
 * ⚠ The alternative was to move anchoring to its own channel, as eviction moved off the
 * double-tap (`D12`→`D15`). Gating on the mode costs no new gesture, which is why it won.
 *
 * ⭐⭐ **THE WORLD VECTOR IS RESOLVED AT THE MOMENT THE SNAP FIRES**, never stored as a
 * screen axis. §1.4 is explicit about why: *"storing a screen axis meant that rule 1's
 * camera orbit invalidated the constraint, and the next snap would silently re-solve against
 * a different axis and rotate the object."* ⛔ So the gesture is view-relative and the
 * constraint it creates is world-absolute — and that asymmetry is the whole design.
 *
 * ⛔ ENGINE-FREE. The caller supplies the gravity frame's axes and the face's local normal.
 */
import type { Constraint } from "../core/constraint_stack";
import type { Vec3 } from "../core/vec";
import { scale } from "../core/vec";
import type { Flick } from "./flick";
import type { Behaviour } from "./mode_toggle";

/**
 * What a flick at release should do to the constraint stack, or `null` for *nothing*.
 *
 * @param mode        the live movement mode. ⛔ Only `ROTATE` pushes — the owner's call.
 * @param flick       §1.3's flick record, or `null` when the release was not a flick.
 * @param localNormal the SELECTED face's outward normal, in the object's local frame. ⚠ No
 *   face selected means no rule: there is nothing to align.
 * @param up          the world vertical, opposite gravity (the gravity frame's `up`).
 * @param right       the world direction of screen +x, from the same frame. ⭐ Resolved by
 *   the caller at THIS instant, which is what makes the constraint world-absolute.
 */
export function alignFromFlick(
  mode: Behaviour,
  flick: Flick | null,
  localNormal: Vec3 | null,
  up: Vec3,
  right: Vec3,
): Constraint | null {
  // ⛔ Three refusals, and each is a rule rather than a guard: not a flick, nothing
  // selected, or the hand was translating rather than turning.
  if (flick === null || localNormal === null || mode !== "ROTATE") return null;

  if (flick.axis === "VERTICAL") {
    // ⭐⭐ THE SIGN, AND IT READS THE WAY A HAND EXPECTS: screen y grows DOWNWARD, so
    // `sign === -1` is a flick UP and aligns the face with `-g` — it ends up pointing up.
    // ⚠ Flick a face down and it points down. *You flick the face the way you want it to
    // face*, which is the spec's `-g for y<0 / +g for y>0` said in plainer words.
    const targetWorld = flick.sign < 0 ? up : scale(up, -1);
    return { kind: "GRAVITY_ALIGN", localNormal, targetWorld };
  }

  // ⚠ `FlickAxis` is exactly two values, so this is the horizontal case and there is no
  // third branch to write. ⛔ A `return null` here would be dead code dressed as a guard —
  // and *a guard that cannot fire* is the shape `METHOD` warns about, not a safety net.
  const targetWorld = flick.sign > 0 ? right : scale(right, -1);
  return { kind: "WORLD_AXIS_ALIGN", localNormal, targetWorld };
}
