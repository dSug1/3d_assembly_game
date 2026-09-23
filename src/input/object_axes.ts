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
 * ## ⛔⛔⛔ THAT THIRD PART IS **DELETED** — `D82`, 2026-09-23, the owner
 *
 * > *"eliminate this rule: Inside the offset radius the axes are the LeadingFace normal, gravity,
 * > and their orthogonal. Inside shall be the same as outside. I think this is polluting the
 * > approach movement."*
 *
 * ⚠ It is kept quoted above because a reversal is only legible beside what it reverses. ⭐ What
 * remains is the flag: the boot camera's basis frozen for the scene, or the live camera's — and
 * a body's axes no longer change because it came near another body.
 *
 * ⭐⭐ **WHAT THE BASIS SWITCH COST, WHICH IS THE ARGUMENT FOR DELETING IT**: the zone edge is
 * where the translation directions changed under a moving finger, so every defect it produced was
 * about the MOMENT it took effect rather than about the geometry. ⛔ `METHOD`: *a rule whose every
 * defect is about the moment it takes effect is a rule about the wrong thing.*
 *
 * ⚠ `leadingFace` and its gizmo SURVIVE — they were never part of this rule: the owner asked for
 * the marker in the same dictation and has not asked for it to go.
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
import type { Vec3 } from "../core/vec";
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
  /** `worldAxisB` as a boolean — the flag the owner asked for. */
  readonly worldAxisB: boolean;
  /** ⭐ The axes built at scene boot from the boot camera, fixed for the whole scene. */
  readonly bootAxes: ObjectAxes;
  /** The camera's basis NOW. ⚠ `null` only where `gravityFrame` refuses. */
  readonly liveFrame: GravityFrame | null;
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
  // ⭐⭐ THE FLAG DECIDES, AND THE DIFFERENCE IS ONLY *WHICH CAMERA*. `WorldAxisB` is the boot
  // camera's basis, frozen for the scene; `WorldAxisA` is the camera as it is now. ⛔ Both are
  // `axesFromFrame` of a gravity frame — one latched, one live — so there is exactly one
  // construction of a basis in this file.
  if (i.worldAxisB) return i.bootAxes;
  return i.liveFrame === null ? i.previous : axesFromFrame(i.liveFrame);
}
