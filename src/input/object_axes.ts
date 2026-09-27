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
 * ⚠ It is kept quoted above because a reversal is only legible beside what it reverses. ⛔ The
 * flag went too (`D109`, 2026-09-27): `WorldAxisB`, the boot camera's basis frozen for the scene,
 * is the only basis — `WorldAxisA` (the live camera's) is deleted — and a body's axes no longer
 * change because it came near another body.
 *
 * ⭐⭐ **WHAT THE BASIS SWITCH COST, WHICH IS THE ARGUMENT FOR DELETING IT**: the zone edge is
 * where the translation directions changed under a moving finger, so every defect it produced was
 * about the MOMENT it took effect rather than about the geometry. ⛔ `METHOD`: *a rule whose every
 * defect is about the moment it takes effect is a rule about the wrong thing.*
 *
 * ⛔ `leadingFace` is deleted too, with `core/leading_face.ts`; the gizmo survives, on the
 * FollowerFace centre or else the body's own.
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
 * owner's dictation and it is unconditional.
 *
 * ⛔ The in-zone basis (orthogonalised from the LeadingFace normal) and its edge-latching are
 * deleted with the rule above (`D82`); their reasoning is in `Claude/00_CORE/queue_notes/IN4.md`.
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
  /** Unit, world. The SECOND touchpoint's `dy` channel — the boot frame's `up`, world vertical. */
  readonly gravity: Vec3;
  /** Unit, world. The holder's `dy` channel. ⚠ HORIZONTAL. */
  readonly depth: Vec3;
}

/**
 * A gravity frame's basis, read as object axes — at boot, from the boot camera, the axes every
 * body is given (`WorldAxisB`).
 *
 * ⭐ It is a RENAMING and not a computation: `A7`'s frame already answers *horizontal across
 * the screen / straight up / horizontal into the scene*. ⛔ Doing arithmetic here would be a
 * second implementation of a basis that is already orthonormal by construction, free to
 * disagree with the one every rotation uses.
 */
export function axesFromFrame(frame: GravityFrame): ObjectAxes {
  return { x: frame.right, gravity: frame.up, depth: frame.depth };
}

/** Everything the rotation basis needs. ⭐ Plain data, so this decision is vectorable too. */
export interface RotationFrameInputs {
  /** ⭐ The gravity frame built at scene boot. ⚠ `null` before boot has filled it. */
  readonly bootFrame: GravityFrame | null;
  /** The gravity frame this grip carries now — latched at press, re-based after a camera move. */
  readonly liveFrame: GravityFrame;
}

/**
 * ⭐⭐⭐ **THE BASIS A FREE BODY IS *TURNED* ABOUT — the boot frame, like the translation's.**
 *
 * > *"why for an unaligned object when world axis is toggled on, the translation is done along
 * > world axis but the rotation is done along screen axis? is it on purpose or was it a miss when
 * > we built world axis?"* … *"do the change."* — the owner, 2026-09-23
 *
 * ⛔⛔⛔ **THE HONEST ANSWER WAS: NEITHER.** The `D74`/`D75` dictation named only translation
 * channels — *x is the holder's dx, depth its dy, gravity the second finger's dy* — and nothing in
 * it, or in `IN4.md`, ever reached the rotation. ⭐ So rotation went on standing on `A7`'s LIVE
 * gravity frame, not by decision but because no decision was made.
 * ⭐⭐ `METHOD`: *a scope that was never stated is not a scope that was chosen, and the difference
 * is invisible in the code that results.*
 *
 * ## ⭐⭐ WHAT ACTUALLY CHANGES, WHICH IS LESS THAN THE QUESTION IMPLIES
 *
 * ⛔ A gravity frame's `up` is the **world vertical by definition**, at every camera. So the YAW
 * axis was ALREADY world-fixed and this cannot touch it. What freezes is:
 *
 * ```
 *   pitch — about the frame's `right`  (the camera's right, always horizontal)
 *   roll  — about the frame's `depth`  (the view direction flattened onto the ground)
 * ```
 *
 * ⚠ Vectored below as an equality that would otherwise just be assumed: two frames a quarter turn
 * apart share `up` EXACTLY and are orthogonal in the other two.
 *
 * ## ⚠⚠ THE COST, STATED BEFORE A HAND MEETS IT
 *
 * ⛔ Frozen, the pitch axis points at the camera after a quarter orbit, so a vertical finger sweep
 * there reads as a ROLL rather than a tip. ⭐ That is exactly the property the owner ASKED FOR on
 * the translation side — *a push that went "right" before an orbit still goes the same way in the
 * world afterwards* — carried over to the turn, and it is the thing to judge by finger.
 * ⛔ `worldAxisB = 0`, the live-camera alternative, is DELETED (`D109`, 2026-09-27): the boot
 * frame is the only frame.
 *
 * ⛔ It does NOT touch a TWIST on an aligned body: that turns about the constraint's own axis and
 * never consulted a camera frame at all. The owner's question was about the UNALIGNED case.
 */
export function rotationFrame(i: RotationFrameInputs): GravityFrame {
  // ⛔ The fallback is the live frame, never a throw and never a stand-in basis: this is read on
  // the gesture path, and a body mid-turn has to be turned about something. ⚠ It is reachable only
  // before boot fills the frame — the TDZ shape that crashed the 2026-09-19 build.
  if (i.bootFrame !== null) return i.bootFrame;
  return i.liveFrame;
}
