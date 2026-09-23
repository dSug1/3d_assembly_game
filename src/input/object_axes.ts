/**
 * ⭐⭐⭐ **THE OBJECT AXES — the basis a body is translated along, and when it changes.**
 *
 * The owner, 2026-09-22, in three parts:
 *
 * > *"A flag with a slider … WorldAxisB toggle on: the world x, world gravity and world depth
 * > axis are created at scene boot as per camera position at scene boot and are fixed forever
 * > for this scene. … For both, at scene boot, all object axis are updated based on camera
 * > quaternion at scene boot."*
 *
 * > *"If pioneer and follower objects are outside the offset radius zone: object axis shall be
 * > aligned with world axis if the flag WorldAxisB is toggled on, or with camera screen and
 * > depth axis if the flag WorldAxisB is toggled off."*
 *
 * > *"If pioneer and follower objects are inside the offset radius zone: object axis shall be
 * > aligned with LeadingFace normal direction, gravity direction and direction orthogonal to
 * > LeadingFace normal & gravity directions."*
 *
 * ## ⭐⭐ THREE NAMED AXES, AND THE NAMES ARE THE CHANNELS
 *
 * ```
 *   x        — the holder's dx
 *   depth    — the holder's dy      ⚠ HORIZONTAL, not the screen's vertical
 *   gravity  — the SECOND finger's dy
 * ```
 *
 * ⛔⛔ **THAT IS A REMAP OF RULE 6, NOT A RE-BASIS OF IT.** Before this, the holder's dy moved
 * the body UP and the second finger's dy moved it AWAY. They are now swapped: one finger
 * slides the body about its own horizontal plane, a second finger lifts it. ⚠ It is the
 * owner's dictation and it is unconditional — the `worldAxisB` flag chooses which axes, never
 * whether the remap applies.
 *
 * ## ⭐⭐⭐ WHY THE IN-ZONE BASIS IS ORTHOGONALISED
 *
 * The dictation names *the LeadingFace normal, gravity, and their orthogonal*. ⚠ Those three
 * are only a BASIS when the leading face is vertical: on a sloped face the normal has a
 * vertical component, so *push along depth* and *push along gravity* would partly do the same
 * thing, by `cos(slope)`. ⛔ That is `A7`'s own argument, met again — *the argument is
 * ORTHOGONALITY, not tidiness; there is no gain that fixes a basis that is not a basis* — and
 * the owner chose to orthogonalise (2026-09-22).
 *
 * ⭐ So gravity is kept EXACT and the normal is flattened onto the horizontal plane, which is
 * the same construction `gravityFrame` uses for its own `depth`. ⚠ What it costs, stated: on a
 * 45° face the depth axis runs along the face's horizontal shadow rather than up its slope.
 *
 * ## ⚠ THE AXES CHANGE ON AN EDGE, NEVER CONTINUOUSLY
 *
 * ⛔⛔ **AND THAT IS WHAT BREAKS A CIRCULARITY.** The leading face is chosen by the direction
 * the body is travelling; in the zone the travel direction is chosen by the axes; the axes are
 * built from the leading face. ⭐ The owner's own sequencing resolves it: *"If the object has
 * entered or exited an offset radius zone, update the object axis directions"* — so the axes
 * are latched at the TRANSITION, from the leading face at that instant, and the leading face
 * goes on being recomputed every frame for the gizmo only.
 *
 * ⚠ It also means a body that turns while inside the zone keeps the basis it entered with. A
 * basis that re-derived itself every frame would swing through 90° the moment the drag crossed
 * a face boundary, mid-push — which is `METHOD`'s *a mode may be keyed on PRESENCE, never on
 * MOTION*, one level up: the zone is discrete and deliberate, the leading face is not.
 *
 * ⛔ ENGINE-FREE.
 */
import { cross, dot, normalize, scale, sub, type Vec3 } from "../core/vec";
import type { GravityFrame } from "./gravity_frame";

/**
 * The basis one body is translated along. ⛔ A DISTINCT type from `GravityFrame`, whose
 * `right`/`up`/`depth` are the CAMERA's answer to the same question — two frames, two
 * purposes, and the compiler is what keeps a rule from reading one where it meant the other.
 * ⚠ The same split `gravity_frame.ts` made against `ScreenFrame`, for the same reason.
 */
export interface ObjectAxes {
  /** Unit, world. The holder's `dx` channel. */
  readonly x: Vec3;
  /** Unit, world. The SECOND touchpoint's `dy` channel. ⚠ Not always the true vertical: it
   * is whatever the rule below put there, and in the zone it is exactly world up. */
  readonly gravity: Vec3;
  /** Unit, world. The holder's `dy` channel. ⚠ HORIZONTAL outside the zone. */
  readonly depth: Vec3;
}

/**
 * The camera's basis, read as object axes — `WorldAxisA`, and the axes every body is given at
 * boot whichever way the flag is set.
 *
 * ⭐ It is a RENAMING and not a computation: `A7`'s frame already answers *horizontal across
 * the screen / straight up / horizontal into the scene*. ⛔ Doing arithmetic here would be a
 * second implementation of a basis that is already orthonormal by construction, free to
 * disagree with the one every rotation uses.
 */
export function axesFromFrame(frame: GravityFrame): ObjectAxes {
  return { x: frame.right, gravity: frame.up, depth: frame.depth };
}

/**
 * ⭐⭐⭐ **THE IN-ZONE BASIS** — built from the leading face's normal and gravity.
 *
 * @param normal the LeadingFace's TRUE OUTWARD normal, world.
 * @param up     the world vertical. ⚠ Passed in, never assumed: `WORLD_DOWN` is the object
 *   model's, and a second opinion about down would let a body be lifted along one vertical
 *   and pushed along another.
 *
 * ⛔ Returns `null` when the leading face is HORIZONTAL — its normal is then parallel to
 * gravity, it has no horizontal shadow, and every direction across the ground would be equally
 * entitled to be called depth. ⭐ The same refusal `gravityFrame` makes at the pole, and the
 * caller's answer is the same: keep the basis the body already has. Suppress, do not guess.
 */
export function axesFromLeadingFace(normal: Vec3, up: Vec3): ObjectAxes | null {
  const g = normalize(up);
  const n = normalize(normal);
  if (!g || !n) return null;
  // ⭐ The normal with everything vertical removed — `gravityFrame`'s own construction for
  // `depth`, so the two bases are built the same way and cannot drift apart in convention.
  const depth = normalize(sub(n, scale(g, dot(n, g))));
  if (!depth) return null;
  // ⚠⚠ `up × depth`, NOT `depth × up`, and it is the same sign trap `gravityFrame` records:
  // the camera builds its right as `worldUp × forward`, so a basis that flipped this would
  // send every horizontal push BACKWARDS relative to the one used outside the zone — and the
  // switch happens mid-drag, where a hand would read it as the controls inverting themselves.
  const x = normalize(cross(g, depth));
  if (!x) return null;
  return { x, gravity: g, depth };
}

/** Which way the offset radius zone was crossed this frame, or `null` for no crossing. */
export type ZoneEdge = "ENTER" | "EXIT" | null;

/**
 * ⭐ The edge, from the capture verdict's own `inRange`.
 *
 * ⛔ It takes the verdict the white contours are drawn from, never a second proximity test of
 * its own: *a rule keyed on its own copy of "near enough" would be free to disagree with the
 * contours a hand is looking at* — `D62`'s readout lesson, which this project has now paid for
 * twice.
 */
export function zoneEdge(was: boolean, now: boolean): ZoneEdge {
  if (was === now) return null;
  return now ? "ENTER" : "EXIT";
}

/** Everything the axes rule needs to answer. ⭐ Plain data, so the decision is vectorable. */
export interface AxesInputs {
  /** Is this body's Pioneer/Follower pair inside the offset radius zone? */
  readonly inZone: boolean;
  /** `worldAxisB` as a boolean — the flag the owner asked for. */
  readonly worldAxisB: boolean;
  /** ⭐ The axes built at scene boot from the boot camera, fixed for the whole scene. */
  readonly bootAxes: ObjectAxes;
  /** The camera's basis NOW. ⚠ `null` only where `gravityFrame` refuses. */
  readonly liveFrame: GravityFrame | null;
  /** The leading face's world normal, or `null` if the body is not advancing on one. */
  readonly leadingNormal: Vec3 | null;
  /** The world vertical. */
  readonly up: Vec3;
  /** What this body is using now — the answer when nothing better can be built. */
  readonly previous: ObjectAxes;
}

/**
 * ⭐⭐⭐ **THE RULE ITSELF — what a body's axes become.** Section C of the dictation, whole.
 *
 * ⛔⛔ **IT IS TOTAL: every branch returns a basis, and the fallback is always `previous`.**
 * The alternative — returning `null` and letting the caller decide — puts the decision back in
 * `scene.ts`, and *a rule written in `scene.ts` is a rule nothing can interrogate* (the
 * 2026-09-19 lesson, seven surviving mutants). ⚠ Keeping a working basis is also the only
 * honest answer: a body mid-drag has to be translated along something.
 */
export function updatedObjectAxes(i: AxesInputs): ObjectAxes {
  if (i.inZone) {
    if (i.leadingNormal === null) return i.previous;
    return axesFromLeadingFace(i.leadingNormal, i.up) ?? i.previous;
  }
  // ⭐⭐ OUTSIDE THE ZONE THE FLAG DECIDES, AND THE DIFFERENCE IS ONLY *WHICH CAMERA*.
  // `WorldAxisB` is the boot camera's basis, frozen for the scene; `WorldAxisA` is the camera
  // as it is now, which is today's build. ⛔ Both are `axesFromFrame` of a gravity frame — one
  // latched, one live — so there is exactly one construction of a basis in this file.
  if (i.worldAxisB) return i.bootAxes;
  return i.liveFrame === null ? i.previous : axesFromFrame(i.liveFrame);
}
