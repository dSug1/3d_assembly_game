/**
 * ⭐⭐⭐ **PROXIMITY — how near is the nearest other object, and is it near enough?**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] (`D46` §1, `A16`,
 * and **`D49` §19** for the surface rule).
 *
 * ⛔⛔ **IT IS A SURFACE GAP NOW, NOT A CENTRE DISTANCE** (the owner, 2026-09-18: *"I want to
 * modify that to an offset to the faces of the object"*). ⭐ The base plate is what forced it
 * and the audit had already measured the damage: a `6L × 0.3L × 9L` body has its centre `3L`
 * below its own top face, so a part **resting on the plate** read as 312 mm away while a part
 * hovering high above its middle read as near. ⚠ **No radius value fixes that** — the error is
 * the body's own half-extent, which differs per body, per axis and per orientation.
 *
 * ⭐⭐⭐ **BUT ONLY THE DISTANCE MOVED TO SURFACES — THE DIRECTION MUST NOT.** `D46` replaced
 * the earlier `TargetPosition` design precisely because a finger mapped onto a *face-to-face*
 * direction collapses to noise exactly at contact, where precision matters most. ⛔ Centres
 * cannot meet, so the approach direction stays centre-to-centre and `centreDistance` below is
 * kept for it. ⚠ `APPROACH_AND_MATE.md` §18 flagged this migration as *not a free upgrade* for
 * exactly this reason; splitting the two quantities is what makes it one.
 *
 * ⚠⚠ **AND IT QUIETLY GIVES BACK THE SCALE-FREEDOM `4L` GAVE UP, WHICH IS A REAL CHANGE.** An
 * absolute centre radius meant a big part and a small part captured at the same *centre
 * separation*; a surface offset means they capture at the same *clearance*. ⭐ That is almost
 * certainly what a hand wants — a plate should capture at the same visible gap as a part — but
 * it reverses a decision taken deliberately on 2026-09-17, so it is stated rather than
 * discovered. ⛔ The number's MEANING changed with it, so its old value carries no information.
 *
 * ⛔ ENGINE-FREE, and every function is a QUESTION about the world rather than a change to it.
 */
import { gapBetween } from "./collision_shape";
import type { FaceId, ObjectId, World } from "./object_model";
import { faceWorld, worldPlacementOf } from "./object_model";
import type { Vec3 } from "./vec";
import { add, qRotate, sub } from "./vec";

/**
 * ⭐⭐ **NOT WIRED — RESERVED FOR THE APPROACH DIRECTION, AND DECLARED RATHER THAN DELETED.**
 *
 * ⛔⛔ Nothing calls this today; `A16`'s capture test reads `surfaceGap` instead. ⚠ It is kept
 * because `D46` §4b.1 maps the finger's travel onto the **centre → centre** line, and that is
 * the one quantity in this mechanism that must NOT become face-based: a face-to-face direction
 * shrinks to noise at contact, which is the degeneracy the whole design was rebuilt to remove.
 * ⭐ Same precedent as `alignmentMatchesTarget` in `input/highlight.ts`: a pure predicate that
 * nothing calls cannot change behaviour, and *deleted, not disabled* is a rule about forks,
 * flags and detectors that own a verdict.
 *
 * Centre to centre, in metres. `null` if either object is gone.
 */
export function centreDistance(world: World, a: ObjectId, b: ObjectId): number | null {
  const pa = worldPlacementOf(world, a);
  const pb = worldPlacementOf(world, b);
  if (!pa || !pb) return null;
  const d = sub(pb.position, pa.position);
  return Math.hypot(d[0], d[1], d[2]);
}

/**
 * A body's collision points in WORLD space, or `null` if it has no shape or no placement.
 *
 * ⛔ IT READS THE MODEL, NOT THE DISPLAY POSE. The sway and the follower are decoration —
 * `display_pose.ts` owns `SWAY ∘ FOLLOW ∘ model`, and what the eye sees is deliberately not
 * where the object IS. ⚠ Measuring capture against the swayed pose would make a highlight
 * flicker with an animation nobody asked it to track, and the barycentre already learned this.
 */
export function worldShapePoints(world: World, id: ObjectId): Vec3[] | null {
  const o = world.objects.get(id);
  if (!o?.shape || o.shape.points.length === 0) return null;
  const at = worldPlacementOf(world, id);
  if (!at) return null;
  return o.shape.points.map((p) => add(at.position, qRotate(at.orientation, p)));
}

/**
 * ⭐⭐⭐ **THE GAP BETWEEN TWO BODIES' SURFACES, IN METRES** — `0` when they touch or overlap,
 * `null` when either body is missing, unplaced, or has no shape.
 *
 * ⛔ `null` is *out of range*, never *in range*. A body whose shape failed to build would
 * otherwise capture everything in the scene from any distance, and the failure would look like
 * a feature. `LESSONS_CARRIED` §6: a degenerate input returns null, never a default.
 */
export function surfaceGap(world: World, a: ObjectId, b: ObjectId): number | null {
  const pa = worldShapePoints(world, a);
  const pb = worldShapePoints(world, b);
  if (!pa || !pb) return null;
  return gapBetween(pa, pb);
}

/** What `nearestCapture` found: the body, and how far its surface is. */
export interface Capture {
  readonly target: ObjectId;
  /** Surface-to-surface, metres. ⭐ Returned so the HUD prints the number the rule compared. */
  readonly gapM: number;
}

/**
 * ⭐⭐⭐ **THE NEAREST OTHER OBJECT WITHIN CAPTURE RANGE**, or `null` — `A16`'s range condition.
 *
 * ⛔⛔⛔ **REVERSED BY THE OWNER, 2026-09-19 — A FOLLOWER MAY ONLY APPROACH ITS PIONEER.**
 *
 * > *"Currently, a Follower can enter in the offset radius of any object and the white highlights
 * > trigger. I want to restrict this strictly to its Pioneer object (= a Follower object cannot
 * > approach any other object than its Pioneer)."*
 *
 * ⚠⚠ **IT OVERTURNS `A21`, WHICH THIS COMMENT USED TO QUOTE VERBATIM**: *"within a
 * SnapIsPossibleRadius of ANY other object (not necessarily the object with PioneerFace)"*.
 * ⛔ Recorded rather than quietly replaced, because the old rule had an argument and a hand has
 * now overruled it: *the Pioneer answers which way is up; the target answers what am I docking
 * with* — and keeping them independent was what let a hand align against one part and assemble
 * to another. ✅ That freedom is deliberately given up.
 *
 * ⭐ A body with NO alignment is untouched and still sees the whole scene: the restriction is a
 * property of BEING a Follower, which is what the owner's sentence says.
 *
 * ⚠⚠ **AN EXACT TIE KEEPS THE CURRENT TARGET, AND THAT IS ALL IT DOES.** ⛔ This comment used
 * to call it *"hysteresis by memory"* and the 2026-09-17 audit corrected it: the comparison is
 * `===`, so an incumbent at `0.1 + 1e-13` loses to a challenger at `0.1`. ⭐ It is a TIE-BREAK.
 * ⚠ Left as it is, deliberately: real hysteresis needs a margin in millimetres that no hand has
 * judged, and *a guessed number has been wrong every single time here*. If a device pass reports
 * the highlight flickering between two candidates, this is the place, and the fix ships with a
 * slider.
 *
 * ⚠ *Nearest* was my choice and is now the owner's rule (`A21`, 2026-09-17).
 *
 * @param offsetM the capture offset in METRES — how far apart two SURFACES may be and still
 *   capture. ⛔ Computed per frame from the camera distance (`input/highlight.ts`), so it is not
 *   a constant: the owner's rule is that it shrinks as the camera comes in.
 * @param current last frame's target, for the tie rule. `null` on the first frame.
 * @param gapOf how to measure — `surfaceGap` in the product. ⭐ Injected so the tie rule and the
 *   threshold can be vectored against a stub, without building a world of geometry to do it.
 * @param allowed ⛔⛔ **`D62`** — the bodies this one may capture, and **nothing else**.
 *
 *   ⭐⭐ **A SET, NOT ONE BODY — widened 2026-09-19 when the owner saw a PIONEER capture a third
 *   object**: *"the white highlight should be reserved only for Pioneer-Follower duo."* A
 *   Follower's set is its one Pioneer; a **Pioneer's is all of its Followers** (`A18`'s index is
 *   two-way, so there may be several); a body in neither role has an **empty** set.
 *
 *   ⛔ **EMPTY MEANS NO CAPTURE, AND THERE IS DELIBERATELY NO *"UNRESTRICTED"* VALUE.** The
 *   whole point of the rule is that nothing captures outside its duo, so a caller must not be
 *   able to express *the whole scene* by omission — which a nullable parameter with a default
 *   invites, and which is what this signature used to be.
 *
 *   ⚠ An entry that is not in the world captures nothing rather than throwing: a stale link is a
 *   reason to refuse, never to widen.
 */
export function nearestCapture(
  world: World,
  held: ObjectId,
  offsetM: number,
  current: ObjectId | null,
  gapOf: (a: ObjectId, b: ObjectId) => number | null,
  allowed: readonly ObjectId[],
): Capture | null {
  let best: Capture | null = null;
  let bestGap = Infinity;
  // ⛔ ITERATE THE PARTNERS, NOT THE SCENE. ⚠ A scene-wide loop with a membership test would
  // give the same answer today and would keep a shape that reads as *"nearly everything is a
  // candidate, minus a filter"* — which is exactly the rule the owner removed.
  for (const id of allowed) {
    if (id === held) continue;
    if (!world.objects.has(id)) continue;
    const d = gapOf(held, id);
    if (d === null || d > offsetM) continue;
    // ⭐ Strictly nearer wins; an exact tie leaves `best` alone unless it is the incumbent.
    // ⚠ `<` and not `<=` IS the tie rule.
    if (d < bestGap) {
      best = { target: id, gapM: d };
      bestGap = d;
    } else if (d === bestGap && id === current) {
      best = { target: id, gapM: d };
    }
  }
  return best;
}

/** The two faces that are nearest each other across a pair of bodies, and how far apart. */
export interface FaceTwins {
  readonly faceA: FaceId;
  readonly faceB: FaceId;
  /** Between the two face CENTRES, in metres, world. */
  readonly centreGapM: number;
}

/**
 * ⭐⭐⭐ **THE CLOSEST FACE TWINS** — *"based on closest faces twins"* (the owner, 2026-09-23).
 *
 * ⛔⛔ **IT IS NOT THE CAPTURE TEST, AND THAT SPLIT IS THE WHOLE POINT.** `D49` made the zone a
 * **GJK distance between convex hulls** on the owner's own argument that *nothing there reads a
 * normal, so inverted normals cannot affect it* — and glTF has no quads, so an imported body's
 * faces are whatever the exporter made of it. ⚠ Deciding the THRESHOLD by faces would hand that
 * property back. ⭐ So `surfaceGap` still says *are they near enough*, and this says *which two
 * faces are the ones involved* — one quantity per question, the split the owner approved.
 *
 * ⚠⚠ **CENTRE TO CENTRE, BETWEEN FACES, AND IT IS A PROXY.** Two large faces that overlap
 * edge-on can be nearer as surfaces than their centres suggest. ⛔ Stated rather than hidden
 * because this project has paid for the centre-vs-surface confusion once already, one level up:
 * the base plate read as *far* while a part rested on it. ⭐ At the face level the error is
 * bounded by the face's own half-extent rather than the body's, which is why the proxy is
 * defensible here and was not there — and the mate will need the exact pair anyway, at which
 * point this becomes its seed rather than its answer.
 *
 * ⚠ **NO NORMAL TEST, DELIBERATELY.** A mate is anti-parallel (`D78`), so the twin of a face is
 * arguably one pointing BACK at it — but filtering on that here would make a missing white
 * contour have a second invisible cause, and *"nothing visibly happened"* is this mechanism's
 * whole failure mode. ⭐ The pair is reported; whether the mate demands opposition is `3D2`'s
 * decision to take, with both faces already on the HUD to judge it by.
 *
 * ⛔ `null` when either body is gone or has no faces.
 */
export function closestFaceTwins(world: World, a: ObjectId, b: ObjectId): FaceTwins | null {
  const oa = world.objects.get(a);
  const ob = world.objects.get(b);
  if (!oa || !ob) return null;
  let best: FaceTwins | null = null;
  for (const fa of oa.faces) {
    const wa = faceWorld(world, a, fa.id);
    if (!wa) continue;
    for (const fb of ob.faces) {
      const wb = faceWorld(world, b, fb.id);
      if (!wb) continue;
      const d = sub(wa.centre, wb.centre);
      const gap = Math.hypot(d[0], d[1], d[2]);
      // ⚠ `<` and not `<=`: a tie keeps the first in `faces` order, which is the mesh's own and
      // is stable across frames. An alternating tie would make the HUD's face names flicker.
      if (best === null || gap < best.centreGapM) {
        best = { faceA: fa.id, faceB: fb.id, centreGapM: gap };
      }
    }
  }
  return best;
}
