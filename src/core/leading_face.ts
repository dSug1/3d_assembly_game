/**
 * ⭐⭐⭐ **THE LEADING FACE — the face a body is advancing on.**
 *
 * > *"raycast with the direction of delta position from the object center. The last face of
 * > the object hit by this raycast is the LeadingFace"* — the owner, 2026-09-22
 *
 * ⭐⭐ **THE RAY LEAVES THE BODY, SO *LAST HIT* IS THE **EXIT** FACE.** A ray fired from
 * inside a convex body crosses exactly one face on its way out; *last* and *exit* are the
 * same face, and the word "last" is what makes the rule unambiguous for the degenerate
 * direction that grazes an edge.
 *
 * ⭐ **NO TRIANGLES, NO ENGINE, NO PICKING.** The body's LOGICAL faces already carry a centre
 * and a true outward normal in the local frame (`D50` made them mesh-derived), so the exit
 * face is a plane intersection over `faces` — which is exact for a convex body and needs
 * neither Babylon's raycaster nor the mesh's triangles. ⛔ That matters beyond tidiness: the
 * gizmo this feeds is drawn every frame during a drag, and a rule living in the render layer
 * is a rule nothing can interrogate — the 2026-09-19 lesson, seven mutants deep.
 *
 * ⚠⚠ **STATED LIMIT: IT ASSUMES CONVEX.** Both boot shapes are (a box and `D72`'s frustum),
 * and `collision_shape.ts` already computes a convex hull for the capture, so the assumption
 * is the one this codebase already makes about a body's volume. ⛔ For a concave import the
 * answer is the first plane the ray leaves through, which is still A face of the body and
 * still in front — it is simply not guaranteed to be the outermost one. ⭐ Recorded rather
 * than guarded, because a guard that cannot fire on today's scene is untested code.
 *
 * ⛔ ENGINE-FREE.
 */
import { dot, normalize, sub, type Vec3 } from "./vec";
import { faceWorld, worldPlacementOf, type FaceId, type ObjectId, type World } from "./object_model";

/** The face the body is advancing on, in WORLD space. */
export interface LeadingFace {
  readonly faceId: FaceId;
  /** Centre of that face, world. ⭐ Where the gizmo goes. */
  readonly centre: Vec3;
  /** Its TRUE OUTWARD normal, world. ⭐ What the in-zone basis is built from. */
  readonly normal: Vec3;
  /** Metres from the body's origin to that face along the ray. ⚠ Reported so the HUD can
   * print the quantity the rule compared, never a recomputation of it. */
  readonly distanceM: number;
}

/**
 * The face `id` is advancing on, travelling along `direction`.
 *
 * @param direction the world direction the body is being translated in. ⛔ **The direction
 *   the object ACTUALLY GOES**, after the delta position has been projected onto the object
 *   axes — the owner's choice, 2026-09-22, over the finger's own screen direction. ⚠ The two
 *   differ the moment the object axes stop matching the screen axes, which is exactly what
 *   `worldAxisB` and the in-zone basis do; *leading* then has to mean *leading the motion*,
 *   or the gizmo names a face the body never advances on.
 *
 * ⛔ Returns `null` for a zero direction, a body that is not in the world, a body with no
 * faces, and a body no face of which faces along the ray. ⚠ **Never a stand-in face**: a
 * body whose geometry cannot answer must show no gizmo at all, exactly as `⛔NOSHAPE` does
 * for the capture shell — `LESSONS_CARRIED` §6, suppress rather than substitute.
 */
export function leadingFace(
  world: World,
  id: ObjectId,
  direction: Vec3,
  current: FaceId | null = null,
): LeadingFace | null {
  const d = normalize(direction);
  if (!d) return null;
  const here = worldPlacementOf(world, id);
  if (!here) return null;
  const body = world.objects.get(id);
  if (!body) return null;
  // ⛔⛔ **A FROZEN BODY HAS NO LEADING FACE** (the owner, 2026-09-23: *"don't show the gizmo for the
  // frozen objects"*), and it is refused HERE rather than at the draw site. ⭐ The definition is what
  // settles it: the leading face is the face a body is **advancing on**, and a frozen body never
  // advances — `object_model.ts` refuses to move it at the one place its placement is stored.
  // ⚠ So the gizmo does not appear on the base plate **by construction**, and neither does the
  // in-zone basis it would otherwise have built: a guard at the renderer would have had to be
  // repeated by the next reader of this function, which is the shape `frozen` itself was fixed in
  // (the audit's *parent yes, child never*).
  if (body.frozen === true) return null;

  // ⭐⭐⭐ **STICKY: THE LEADING FACE CHANGES ONLY WHEN THE BODY STOPS ADVANCING ON IT.**
  //
  // ⛔⛔⛔ **DEVICE-REPORTED, 2026-09-23**: *"in this situation (ongoing translation = dx towards
  // left) the gizmo keeps swapping between the face and the center of the object."* ⚠ The face
  // was re-chosen from scratch every frame, from the direction of **one frame's applied step** —
  // and that is `QUEUE.md`'s **mistake shape 1**, *a rate estimated over the shortest available
  // baseline*, in its purest form. ⭐ During a slow drag `A11`'s per-axis deadband emits the
  // excess on one axis and nothing on the other, so the step's DIRECTION alternates even while
  // the hand moves in a straight line — and two faces whose exit distances are close then swap
  // the gizmo back and forth.
  //
  // ⭐⭐ **THE CURE IS THE ONE THIS PROJECT HAS USED TWICE** — the flick's travel (`D33`) and the
  // shake's axis (defect 45) were both fixed by reading over a window rather than by a threshold.
  // ⛔ Here the window is unnecessary: the honest rule is that a face a body is **still advancing
  // on** stays the leading one. ⚠ `n·d > 0` is the whole test, and it is a geometric boundary
  // rather than a tuned one — there is no number to guess and no slider to ship.
  //
  // ⚠ What it costs, stated: after a direction change the gizmo can sit on a face that is no
  // longer the NEAREST exit, until the body stops advancing on it. ⭐ That is a face the body
  // genuinely is advancing on, which is what the gizmo claims.
  // ⛔⛔⛔ **THE STICKINESS IS A SEED, NOT A LATCH — corrected 2026-09-23, device-reported.**
  //
  // > *"how is it possible that the green axis passes through this face, instead of the blue
  // > face? … a vertical translation along gravity axis should immediately select the blue face,
  // > not the left face."* — the owner
  //
  // ⚠⚠ It used to RETURN the held face whenever `n·d > 0` — *any* positive value, however
  // grazing. ⛔ And `objectB` is a **frustum**: its sides slant inward going up, so their outward
  // normals have an UPWARD component, and an upward push therefore *"advances on"* a side face by
  // a hair for ever. ⭐ The body rose and the gizmo stayed on the left side, with an exit distance
  // of metres — which is also what made it FLARE before the lines were sized from the camera.
  //
  // ⭐⭐ **SO THE HELD FACE IS SEEDED INTO THE SEARCH INSTEAD.** It wins a tie and loses to
  // anything strictly nearer, which keeps `D54`'s promise (a face the body is genuinely advancing
  // on does not flicker away on a hair) without the pathology (a grazing face held against a face
  // the body is about to leave through). ⛔ No threshold, no tunable: `<` does the whole job.
  let best: LeadingFace | null = null;
  if (current !== null) {
    const held = body.faces.find((f) => f.id === current);
    const w = held === undefined ? null : faceWorld(world, id, current);
    if (w && dot(w.normal, d) > 0) {
      const t = dot(sub(w.centre, here.position), w.normal) / dot(w.normal, d);
      if (t > 0 && Number.isFinite(t)) {
        best = { faceId: current, centre: w.centre, normal: w.normal, distanceM: t };
      }
    }
  }

  for (const face of body.faces) {
    const w = faceWorld(world, id, face.id);
    if (!w) continue;
    // ⭐ Only the planes the ray can LEAVE through: `n·d > 0` is the outward half. A face
    // whose normal opposes the ray is behind the body's origin in this direction, and the
    // one exactly square to it (`n·d === 0`) is parallel to the ray and never crossed.
    const facing = dot(w.normal, d);
    if (!(facing > 0)) continue;
    const t = dot(sub(w.centre, here.position), w.normal) / facing;
    // ⛔ STRICTLY IN FRONT. A body whose origin sits exactly on a face plane — a half-space
    // shape, or an origin moved to a face by an import — must not report `t = 0` as the
    // face it is advancing on, because every direction would then be leading.
    if (!(t > 0) || !Number.isFinite(t)) continue;
    // ⭐⭐ THE NEAREST EXIT, WHICH FOR A CONVEX BODY IS THE ONLY ONE. ⚠ `<` and not `<=`, so
    // a tie between two faces meeting at an edge keeps the first in `faces` order rather
    // than the last: the order is the mesh's, which is stable across frames, and a tie that
    // alternated would make the gizmo flicker on an exactly diagonal push.
    if (best === null || t < best.distanceM) {
      best = { faceId: face.id, centre: w.centre, normal: w.normal, distanceM: t };
    }
  }
  return best;
}

// ⛔⛔⛔ **`accumulateTravel` AND `decayTravel` STOOD HERE AND ARE DELETED** — 2026-09-23, the
// owner, rejecting the solution they served:
//
// > *"You can lag the travel, but the input itself has no lag. The gizmo repositioning should
// > match the input, not the travel and its lag."*
//
// ⚠ They summed the body's recent steps and faded them, so the direction the leading face is
// chosen from carried `τ/2` of memory — a visible lag when a hand changed direction. ⭐ The face
// is now aimed by **what the channels are asking for this frame**, which cannot lag by
// construction, and `leadingFaceMemoryMs` went with them.
//
// ⚠⚠ **WHAT THIS GIVES UP, STATED**: `D54`'s chatter report was answered by the memory and by the
// latch, and both are now gone. ⛔ What remains against it is the SEED above — the held face wins
// an exact tie — and the fact that the asked-for direction does not alternate the way an applied
// step does. ⭐ If the gizmo flickers between two nearly-tied faces on a slow drag, that is this
// trade, and the fix belongs to the direction and not to a latch.
