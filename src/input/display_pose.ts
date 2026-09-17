/**
 * ⭐⭐ THE DISPLAYED POSE — the whole chain from the MODEL to the pixels, in ONE
 * EXPRESSION.
 *
 * ```
 *   displayed = SWAY ∘ FOLLOW ∘ worldPlacementOf(model, id)
 * ```
 *
 * ⛔⛔ WHY THIS FILE EXISTS AT ALL. `QUEUE.md` names a *composition nobody computed* as
 * the mistake this project keeps making, and the predecessor's rotation stack was
 * defensible at every layer and a REFLECTION as a whole for exactly that reason. Three
 * things now write an object's transform — its modelled placement, rule 6's follower, and
 * the sympathetic sway — and until this file they were composed inline in a render loop
 * where nothing could test them. ⭐ Writing the chain down as one expression, engine-free,
 * is what makes it a thing that can be checked instead of a thing that looks right.
 *
 * ## The three layers, and what each is allowed to do
 *
 * | layer | owns | may it change what the scene MEANS? |
 * |---|---|---|
 * | **model** (`3D1`) | the object's real placement, through its parent chain | ⭐ it IS the meaning |
 * | **follow** (`IN4` rule 6) | a second-order filter on POSITION only | no — feel, not state |
 * | **sway** | a small offset and a block rotation about a pivot | ⛔ **no. It is decoration** |
 *
 * ⛔⛔ THE SWAY IS DECORATION AND MUST STAY OUT OF EVERYTHING THAT MEANS SOMETHING. §2
 * rule 1's barycentre already reads home positions with the sway subtracted, so the orbit
 * centre cannot depend on whether the scene happened to be mid-wobble when a finger
 * landed. This function is the other half of that promise: it is **pure**, so nothing it
 * produces can ever be read back as state.
 *
 * ⭐ ORIENTATION IS NOT FILTERED. Rotation has no inertia — it was built (`src/input/spin.ts`),
 * measured, and **rejected by the owner on the device**. Only position passes through the
 * follower; the model's orientation goes straight through, with the sway's block rotation
 * applied on top.
 *
 * ⛔ ENGINE-FREE: plain vectors in, plain placement out.
 */
import type { Placed } from "../core/mate_connector";
import { add, qFromAxisAngle, qmul, qRotate, sub, type Quat, type Vec3 } from "../core/vec";

/** What the sway contributes this frame. All three are zero when it is at rest. */
export interface SwayOffsets {
  /** The translational spring's current offset, world metres. */
  readonly translation: Vec3;
  /**
   * The block rotation, as an axis × angle vector (radians).
   * ⚠ Zero length means no rotation — and it must produce EXACTLY the unswayed pose, not
   * approximately, or a scene at rest would sit fractionally off its own model.
   */
  readonly rotationVector: Vec3;
  /** The world point the block swings about — the held object's centre. */
  readonly pivot: Vec3;
}

export const NO_SWAY: SwayOffsets = {
  translation: [0, 0, 0],
  rotationVector: [0, 0, 0],
  pivot: [0, 0, 0],
};

/**
 * Compose the three layers into the pose actually drawn.
 *
 * @param followedPosition the follower's position for this frame — already advanced by
 *   `advanceFollow`. ⚠ Passed in rather than computed here: the filter is stateful and
 *   this is not, and mixing the two is how a "pure" function quietly acquires a memory.
 * @param modelOrientation the object's orientation from the model. ⭐ Unfiltered.
 * @param sway what the decoration is doing this frame.
 */
export function displayPose(
  followedPosition: Vec3,
  modelOrientation: Quat,
  sway: SwayOffsets,
): Placed {
  const angle = Math.hypot(sway.rotationVector[0], sway.rotationVector[1], sway.rotationVector[2]);

  // ⛔ EXACTLY the unswayed pose at rest, by an early return rather than by arithmetic
  // that happens to come out right. A near-identity quaternion built from a zero axis is
  // where a normalise-by-zero would hide.
  if (!(angle > 1e-9)) {
    return {
      position: add(followedPosition, sway.translation),
      orientation: modelOrientation,
    };
  }

  const swayQ = qFromAxisAngle(sway.rotationVector, angle);

  // ⭐⭐ RIGID, AND THAT IS THE WHOLE POINT: the object both ORBITS the pivot and SPINS on
  // its own by the same angle. ⛔ Orbiting alone would SHEAR the group — objects sliding
  // past one another rather than one scene moving — and spinning alone would leave them
  // turning on the spot like a crowd rather than swinging like a block.
  const relative = sub(followedPosition, sway.pivot);
  const spun = qRotate(swayQ, relative);
  // The orbital part is the DISPLACEMENT the rotation causes, added like any other
  // offset, so it composes with the translational sway instead of fighting it.
  const orbital = sub(spun, relative);

  return {
    position: add(add(followedPosition, sway.translation), orbital),
    // ⚠ Left-multiplied: a WORLD-frame turn applied on top of the model's orientation,
    // never nested inside it. The same contract `screen_rotate.ts` and
    // `anchor_rotate.ts` hold to.
    orientation: qmul(swayQ, modelOrientation),
  };
}

