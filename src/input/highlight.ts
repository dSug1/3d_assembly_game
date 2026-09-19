/**
 * ⭐⭐⭐ **`A16` — WHEN THE TWO WHITE HIGHLIGHTS APPEAR, AND WHEN THEY DO NOT.**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] §12 (`A16`).
 *
 * > *"two highlights possible only when the first object is aligned && translation by one
 * > touchpoint or two touchpoints and distance below threshold"* — the owner, 2026-09-17
 *
 * > *"modify the rule: the white contour does not necessitate the object to be aligned to
 * > toggle on and off. I want to remove the 'object is aligned' from the approach logic (we
 * > will see how to handle the alignment for the mate logic later on)"* — the owner, same day
 *
 * ⛔⛔ **SO THE RULE IS NOW TWO CONDITIONS, NOT THREE**: a drag that TRANSLATES, and a body
 * within the radius. ⚠ The alignment requirement was added and removed within the day, and the
 * sequence is worth keeping because neither end of it was arbitrary:
 *
 * 1. The first build hung the contours on **proximity alone**, in any movement mode.
 * 2. A hand rejected that: *"highlight both objects even if they are not aligned: this is
 *    NOK"*, then *"that's also the case with single object translation."*
 * 3. I read that as *require the alignment* — and it did fix the symptom.
 * 4. ⭐⭐ The owner then removed the alignment and KEPT the translation condition, which
 *    suggests the real objection in (2) was the contours appearing during a **rotation**, not
 *    their appearing unaligned. ⚠ Condition 2 did not exist when the complaint was made, so
 *    both readings fitted the evidence and I picked the stronger one without saying so.
 *
 * ⭐⭐ **WHAT WHITE MEANS NOW, IN ONE SENTENCE**: *these two bodies are close enough to
 * approach, and the drag in progress could move them.* ⛔ The alignment is no longer part of it
 * — it returns for the MATE, which is a different and irreversible act.
 * ⚠ `alignmentMatchesTarget` below is therefore **kept and NOT WIRED**, declared rather than
 * deleted; see its header.
 *
 * ⛔ ENGINE-FREE. Every function DECIDES; the caller draws.
 */
import type { ObjectId, World } from "../core/object_model";
import { faceWorld } from "../core/object_model";
import type { Constraint } from "../core/constraint_stack";
import type { Behaviour } from "./mode_toggle";
import { nearestCapture } from "../core/proximity";
import type { ObjectId as CaptureId } from "../core/object_model";
import { mmToPx } from "../core/units";
import { trackingMetresPerPx } from "./translate";
import { dot, normalize } from "../core/vec";

/**
 * ⭐⭐⭐ **THE CAPTURE OFFSET IN WORLD METRES, FROM A DISTANCE ON THE GLASS** (`D49`, the owner:
 * *"the offset distance shall depend on the camera position and focus … or more or less the
 * same in pixels although I do not want to use pixel since this may vary depending on device
 * screens"*).
 *
 * ⭐⭐ **THAT REQUEST HAS AN EXACT ANSWER ALREADY IN THIS CODEBASE.** `trackingMetresPerPx` is
 * the world displacement that keeps an object under a moving finger — computed from the
 * camera's field of view, its distance and the viewport height. ⛔ Composing it with `mmToPx`
 * turns *millimetres of finger travel* into *metres of world*, which is precisely
 * *"the same apparent size at every zoom, authored in millimetres and never in pixels"*:
 *
 * * **close camera ⇒ a smaller world offset**, far camera ⇒ larger, proportionally;
 * * **device-independent**, because the viewport height and field of view are in the formula —
 *   which is the half of the request raw pixels could not satisfy;
 * * ⭐ **no new constant.** `referenceCameraDistance`'s ratio form was deliberately superseded
 *   for rule 6 by this same computation (`translate.ts`), and the sway already scales this way
 *   so it looks the same size at every zoom. Three rules, one factor.
 *
 * ⚠⚠ **THE DISTANCE IS THE CAMERA'S TO ITS FOCUS, NOT TO EACH BODY** — which is what the owner
 * asked for (*"camera and focus"*) and is one number for the whole scene. ⛔ A per-body distance
 * would make two bodies at different depths capture at different world gaps, so a pair could be
 * *in range* measured from one and *out of range* measured from the other — a rule with two
 * answers. ⭐ Stated because it is a modelling choice, not an approximation.
 *
 * ⛔ Returns 0 for a degenerate viewport or camera, which reads as *nothing captures* — the
 * safe direction, and the same convention `trackingMetresPerPx` already uses.
 */
export function captureOffsetM(
  offsetMm: number,
  cameraDistanceM: number,
  fovRad: number,
  viewportHeightPx: number,
): number {
  if (!(offsetMm > 0)) return 0;
  return mmToPx(offsetMm) * trackingMetresPerPx(cameraDistanceM, fovRad, viewportHeightPx);
}

/**
 * ⛔⛔ **`captureShellDims`, `bodyContourDims` AND `MIN_CONTOUR_SCALE` ARE DELETED** (`D50`,
 * 2026-09-18). They sized a BOX outline: the body's three extents, grown additively for the
 * shell and by a hair for the body contour.
 * ⭐ The outlines are the mesh's own edges now, offset by `mesh_topology.offsetPositions` — a
 * true offset of every face plane, which a box's extents cannot express for any body that is
 * not a box. ⚠ **The HALF survives**: `scene.ts` offsets each body by `offsetM / 2`, so two
 * shells still meet exactly at the capture threshold, and a vector in `mesh_topology.test.ts`
 * asserts that composition against the rule.
 * ⛔ *Deleted, not disabled* — a vector for a rule that no longer exists passes while
 * describing the wrong product.
 */

/** ⚠ Both are `D46` §1 placeholders, flagged for fine-tuning by the owner. */
export interface HighlightNumbers {
  /**
   * The capture offset in **METRES**, already converted from the glass by `captureOffsetM`.
   *
   * ⛔⛔ **SURFACE TO SURFACE, NOT CENTRE TO CENTRE** (`D49`). ⚠ It replaced `snapRadiusM`, whose
   * `4L` value carries no information here: that number answered *how far apart may two CENTRES
   * be*, and this one answers *how far apart may two SURFACES be*. ⭐ A value borrowed from the
   * old question would be a constant inheriting the wrong question — `METHOD` names that trap.
   */
  readonly captureOffsetM: number;
  /**
   * How near parallel the alignment axis must be to a target face normal, in radians.
   * ⚠ NO LONGER READ BY `highlightedPair` — kept because `alignmentMatchesTarget` takes it and
   * the mate will. ⛔ See that function's header for why it is declared, not deleted.
   */
  readonly alignMatchRad: number;
}

/** The pair to outline. ⛔ `null` everywhere else — there is no partial state. */
export interface HighlightPair {
  /** The *"first object"* — the one carrying the alignment. */
  readonly subject: ObjectId;
  /** The `TargetObject` it is aligned to and near. */
  readonly target: ObjectId;
}

/**
 * ⭐⭐⭐ **THE VERDICT, WITH ITS REASONS** — and the reasons are not a luxury.
 *
 * ⛔⛔ **THREE CONDITIONS AND THEY ARE AN `AND`, SO A MISSING HIGHLIGHT LOOKS IDENTICAL
 * WHICHEVER ONE IS FALSE.** ⚠ *"I forgot to align"*, *"I am in rotation mode"* and *"they are
 * too far apart"* are one symptom with three causes, and this project has spent whole device
 * passes on exactly that ambiguity.
 *
 * ⭐⭐ THEY ARE RETURNED RATHER THAN RECOMPUTED BY THE READOUT, which is the part that
 * matters: a HUD that derived its own answer would be a **second implementation**, free to
 * disagree with the product while both show green. ⛔ One computation, one truth, printed.
 */
export interface HighlightVerdict {
  /** The pair to outline, or `null`. ⭐ This is what is DRAWN. */
  readonly pair: HighlightPair | null;
  /** The TRANSLATION condition. */
  readonly translating: boolean;
  /** The RANGE condition — another body is within the offset of at least one held body. */
  readonly inRange: boolean;
  /**
   * ⭐⭐ The **measured surface gap** to the nearest candidate, in metres, or `null` when
   * nothing was measurable (nothing held, or no body has a shape).
   *
   * ⛔⛔ **IT IS THE NUMBER THE RULE ACTUALLY COMPARED, CARRIED OUT FOR THE READOUT** — not a
   * recomputation. ⚠ `A16`'s two flags say *which condition failed*; they cannot say *by how
   * much*, and with a camera-scaled threshold *"too far"* now depends on the zoom as well as on
   * the bodies. ⭐ Printing gap against threshold is what turns *"no white contour"* from a
   * symptom into a reading. ⚠ Reported even when the pair is refused, which is the case a hand
   * needs it in.
   */
  readonly gapM: number | null;
  /** The threshold `gapM` was compared against, in metres — so the HUD can print both. */
  readonly offsetM: number;
}

/**
 * ⭐⭐⭐ **`A16`'s CONDITION 2 — *"translation by one touchpoint or two touchpoints"*.**
 *
 * ⛔⛔ **THIS IS THE ONE PLACE THAT RULE LIVES, AND `scene.ts` NOW READS IT TOO.** The render
 * file already decided the same thing for its own purposes
 * (`mode = objects().length === 1 ? behaviour : "TRANSLATE"`), and a second copy here would be
 * two implementations of one rule — free to disagree, with nothing to catch it. ⭐ `METHOD`'s
 * shape: *one constant lives in exactly one place*, and so does one rule.
 *
 * ⭐ Why two held objects translate in EITHER mode: they are two holders, and the mode is
 * overridden because a pair being moved together is a translation by construction. ⚠ Two
 * fingers on the SAME object are a holder plus a `SECOND` (roll or depth), not a pair — the
 * caller must pass DISTINCT objects, which is why this takes a count of objects and not of
 * touchpoints.
 */
/**
 * ⭐⭐⭐ **`D60` — AND A SECOND TOUCH THAT OWNS ROLL *AND* DEPTH TAKES THE MODE'S PLACE.**
 *
 * > *"whatever translation mode, when an object is aligned as follower the second touch shall
 * > control the depth and the roll … **and the first touch shall control the translation with
 * > delta position x and y** (which is currently the case in translation mode but not in rotation
 * > mode)."* — the owner, 2026-09-19
 *
 * ⭐⭐ **IT IS THE SAME RULE THIS FUNCTION ALREADY HAD, WITH ITS REASON GENERALISED.** Two held
 * objects translate in either mode because *a pair being moved together is a translation by
 * construction*. ⛔ That is also why the owner saw the behaviour they wanted **only** when the
 * second touch hit the Pioneer: that is two held objects, so `heldObjectCount >= 2` already fired.
 * ⚠ A second touch **outside** leaves the count at one, and the mode decided — which is the case
 * they are correcting.
 *
 * ⭐⭐⭐ **THE REAL CONDITION IS A DOF BUDGET, AND NOW IT READS AS ONE.** When the second touch
 * owns roll **and** depth (`D59`), the two fingers already cover the body's whole remaining
 * freedom: first touch x/y in the screen plane, second touch roll + depth. ⛔ Leaving the first
 * touch on the twist would put **two fingers on one DOF**, which is precisely the conflict the
 * owner reported: *"… and conflicts with the dx or dy of the first touch."*
 *
 * ⚠ **KEYED ON PRESENCE, NEVER ON MOTION** — `A15`'s rule, and this obeys it: the second
 * touchpoint being DOWN is a discrete fact, so the first touch's job changes when a finger lands
 * or lifts and never because something moved.
 */
export function translatesOnDrag(
  heldObjectCount: number,
  mode: Behaviour,
  secondTouchOwnsRollAndDepth = false,
): boolean {
  if (heldObjectCount >= 2) return true;
  // ⛔ `D60`: the second touch has taken the rotational freedom, so the first takes translation
  // — whatever the mode says. ⚠ Defaulted to `false` so every caller that does not know about a
  // second touch keeps exactly the behaviour it had.
  if (secondTouchOwnsRollAndDepth) return true;
  return mode === "TRANSLATE";
}

/**
 * ⭐⭐ **NOT WIRED — RESERVED FOR THE MATE, AND DECLARED HERE RATHER THAN DELETED.**
 *
 * ⛔⛔ Nothing calls this today. It was `A16`'s condition 1 until the owner removed the
 * alignment from the approach: *"we will see how to handle the alignment for the mate logic
 * later on."* ⭐ So the debt is made EXPLICIT, in the same spirit as `config_debt.test.ts`
 * declaring an unread tunable, rather than the function quietly sitting here looking live.
 *
 * ⚠ WHY IT IS KEPT AT ALL, since this project's discipline is *deleted, not disabled*: that
 * rule exists for **forks, flags and detectors that own a verdict** — defect 40 was a retired
 * detector still vetoing a live gesture. ⛔ A pure predicate that nothing calls cannot change
 * behaviour, and its vectors encode two lessons that were expensive to learn: that this test
 * must be GEOMETRY and not identity, and that `|dot|` cannot be pinned with a cube fixture.
 * ⚠ If the mate turns out not to need it, delete it **with** its vectors.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *
 * Is this object's alignment pointed along one of `target`'s face normals?
 *
 * ⛔⛔ **IT IS GEOMETRY, NOT IDENTITY, AND THAT IS DELIBERATE.** The obvious implementation is
 * *"is the target the same object the alignment was tapped on?"* — and it is wrong, because
 * `D46` §2 says the target is *"any other object, **not necessarily the object with
 * PioneerFace**"*. ⭐ A hand may align a part against one block and then carry it to a different
 * block that happens to share the orientation, which is ordinary in assembly and which an
 * identity test would silently refuse.
 *
 * ⚠ `|dot|`, so parallel and anti-parallel both match: which sign a frozen alignment vector
 * carries is an accident of which face was tapped. ⛔ On a **cube** that makes no difference —
 * every face has an opposite — so the vector that pins it uses a body with no opposite face.
 */
export function alignmentMatchesTarget(
  world: World,
  constraints: readonly Constraint[],
  target: ObjectId,
  alignMatchRad: number,
): boolean {
  const o = world.objects.get(target);
  if (!o) return false;
  const threshold = Math.cos(alignMatchRad);
  for (const c of constraints) {
    // ⛔ Only an ALIGNMENT counts. A `MATE` is a seat, not an orientation to dock along, and
    // its `targetWorld` is a real direction that a looser test would happily accept.
    if (c.kind !== "FACE_ALIGN" && c.kind !== "WORLD_AXIS_ALIGN") continue;
    const axis = normalize(c.targetWorld);
    if (!axis) continue;
    for (const f of o.faces) {
      const w = faceWorld(world, target, f.id);
      if (!w) continue;
      const n = normalize(w.normal);
      if (!n) continue;
      if (Math.abs(dot(axis, n)) >= threshold) return true;
    }
  }
  return false;
}

/**
 * ⭐⭐⭐ **THE WHOLE OF `A16`, AS ONE ANSWER** — the pair to outline, or `null`.
 *
 * ⛔⛔ **ALL THREE CONDITIONS, IN ONE FUNCTION, ON PURPOSE.** They are an AND, and an AND is a
 * composition — `METHOD`: *a composition is a thing to MEASURE, not an emergent property*.
 * ⚠ Assembling it from three separate green tests inside a 3000-line render file is exactly how
 * `A7`'s gravity frame ended up with four correct parts and an untested whole, which then cost a
 * false defect report.
 *
 * ⭐ Order of the checks is cheapest-first, but the ANSWER does not depend on the order — each
 * is necessary.
 *
 * @param heldIds the DISTINCT held objects, in press order.
 * @param translating `translatesOnDrag(...)` — condition 2, decided by the caller because only
 *   it knows the session mode.
 * @param current last frame's target, for `nearestCapture`'s tie rule. The ONLY memory.
 * @param pioneerOf ⛔⛔ **`D62`** — *what is this body aligned to?* ⭐ Injected rather than read:
 *   the alignment INDEX lives in the render layer, and `highlight.ts` must not learn to reach
 *   into it. ⚠ Returning `null` means *not a Follower*, and such a body still sees the whole
 *   scene — the restriction is a property of BEING a Follower.
 */
export function highlightedPair(
  world: World,
  heldIds: readonly ObjectId[],
  translating: boolean,
  n: HighlightNumbers,
  current: ObjectId | null,
  gapOf: (a: CaptureId, b: CaptureId) => number | null,
  pioneerOf: (id: ObjectId) => ObjectId | null = () => null,
): HighlightVerdict {
  let inRange = false;
  let pair: HighlightPair | null = null;
  // ⭐ The nearest gap seen across every held body, whether or not it was near enough. ⚠ The
  // rule needs only the verdict; the READOUT needs the number, and a hand asking *"why is there
  // no contour"* is usually looking at a pair that is close but not close enough.
  let gapM: number | null = null;
  for (const subject of heldIds) {
    // ⛔⛔ `D62` — A FOLLOWER MAY APPROACH ITS PIONEER AND NOTHING ELSE (the owner, 2026-09-19).
    // ⚠ Computed ONCE per subject and handed to both the rule and the readout, so the contour and
    // the printed gap can never describe different bodies.
    const only = pioneerOf(subject);
    // ⛔ THE RANGE CONDITION — surface gap below the offset, inside `nearestCapture`.
    const capture = nearestCapture(world, subject, n.captureOffsetM, current, gapOf, only);
    if (capture === null) {
      // ⚠ Out of range is still a measurement, and it is the one worth printing.
      const nearest = nearestUnboundedGap(world, subject, gapOf, only);
      if (nearest !== null && (gapM === null || nearest < gapM)) gapM = nearest;
      continue;
    }
    inRange = true;
    if (gapM === null || capture.gapM < gapM) gapM = capture.gapM;
    // ⛔ THE TRANSLATION CONDITION, checked second so the readout can still report the range
    // while it is false. ⚠ The ORDER does not change the answer — both are necessary — but it
    // changes how much the HUD can say about a rotation-mode drag, which is the state a hand
    // hits most often.
    if (translating) {
      pair = { subject, target: capture.target };
      break;
    }
  }
  return { pair, translating, inRange, gapM, offsetM: n.captureOffsetM };
}

/**
 * The nearest surface gap to any other body, with **no threshold** — for the readout only.
 *
 * ⛔ Deliberately separate from `nearestCapture`, which is the RULE. ⚠ Folding *"and also tell
 * me the distance when the answer is no"* into the rule would give one function two jobs and
 * make the threshold easy to drop by accident — and this project has a HUD line that lied for
 * the whole life of a file because nobody separated the two.
 */
function nearestUnboundedGap(
  world: World,
  held: ObjectId,
  gapOf: (a: CaptureId, b: CaptureId) => number | null,
  only: ObjectId | null = null,
): number | null {
  let best: number | null = null;
  for (const id of world.objects.keys()) {
    if (id === held) continue;
    // ⛔⛔ `D62` — **THE READOUT OBEYS THE SAME RESTRICTION AS THE RULE.** ⚠ Without this the
    // HUD would print the gap to some third body the Follower is forbidden to capture, and a
    // hand reading *"gap=40/70mm"* while no contour appears would be looking at a number that
    // describes nothing. ⭐ That is the readout-that-lies shape, and it has cost this project a
    // day more than once.
    if (only !== null && id !== only) continue;
    const d = gapOf(held, id);
    if (d === null) continue;
    if (best === null || d < best) best = d;
  }
  return best;
}
