/**
 * ⭐⭐⭐ **THE OBJECT AXES — the basis a body is translated along.**
 *
 * > *"The world x, world gravity and world depth axis are created at scene boot as per camera
 * > position at scene boot and are fixed forever for this scene."* — the owner, `D74`
 *
 * ⛔ `worldAxisB` (the default) freezes them at boot; `worldAxisA` follows the live camera.
 * That is the whole of the rule.
 *
 * ## ⛔⛔⛔ THE IN-ZONE BASIS IS **DELETED** — `D82`, 2026-09-23, the owner
 *
 * > *"eliminate this rule: Inside the offset radius the axes are the LeadingFace normal, gravity,
 * > and their orthogonal. Inside shall be the same as outside. I think this is polluting the
 * > approach movement."*
 *
 * ⚠ It was `D74`'s part C, dictated the day before: inside the capture zone the basis became the
 * leading face's normal, gravity and their orthogonal, re-decided on the zone's EDGE — *"therefore
 * the translation direction differs when the object is inside the offset radius zone"*.
 *
 * ⭐⭐ **WHAT IT COST, KEPT HERE BECAUSE IT IS THE ARGUMENT FOR THE DELETION.** Four device
 * reports in one day, and all four were the SWITCH rather than the geometry:
 *
 * * *"the translation is blocked"* with `det=0.000` — the in-zone `x` pointed at the camera in
 *   the broadside view a hand orbits to for a join (defect 59);
 * * *"blocked on white highlight border, change of directions"* — the crossing handed the
 *   approach to a different channel (defect 62);
 * * *"inversion of dy input direction"* — compounded by a fallback sign that did not match the
 *   rule it replaced (defect 63).
 *
 * ⛔ Each fix made the switch better behaved and none of them made it invisible, which is what a
 * hand actually asks of it. ⭐ `METHOD`: *a rule whose every defect is about the MOMENT it takes
 * effect is a rule about the wrong thing.*
 *
 * ⚠ `leadingFace` and its gizmo SURVIVE — they were never part of this rule: the owner asked for
 * the marker in the same dictation and has not asked for it to go.
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
  /** The basis this body already has — kept when the live frame is unavailable. */
  readonly previous: ObjectAxes;
}

export function updatedObjectAxes(i: AxesInputs): ObjectAxes {
  // ⭐⭐ THE FLAG DECIDES, AND THE DIFFERENCE IS ONLY *WHICH CAMERA*. `WorldAxisB` is the boot
  // camera's basis, frozen for the scene; `WorldAxisA` is the camera as it is now. ⛔ Both are
  // `axesFromFrame` of a gravity frame — one latched, one live — so there is exactly one
  // construction of a basis in this file.
  if (i.worldAxisB) return i.bootAxes;
  return i.liveFrame === null ? i.previous : axesFromFrame(i.liveFrame);
}
