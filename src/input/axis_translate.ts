/**
 * ⭐⭐⭐ **AXIS TRANSLATION — the delta position mapped onto the object axes.**
 *
 * > *"the delta position inputs … are projected onto the object axis and the object is
 * > translated along these axis according to these projected values (same as what Blender does
 * > for translation of an object)."* — the owner, 2026-09-22
 *
 * ## ⛔⛔ REWRITTEN 2026-09-23, AFTER A DEVICE LOOK, AND THE OLD RULE IS THE LESSON
 *
 * The first build projected each input onto its axis **without normalising** — the rate was
 * `cos(foreshortening)`. Three reports came back from the glass, and all three are the same
 * quantity seen from different sides:
 *
 * 1. *"the dx continues to move on the x world axis and dy on the world depth axis, which feels
 *    strange … the input axis and movements axis seem inverted"*;
 * 2. *"the gain drops for dx and dy due to projection of input on world axis … the input seems
 *    very weak and not the same as the gravity axis input which is right"*;
 * 3. *"the holder's dy is dead at a level camera … I would expect the object to continue
 *    translating."*
 *
 * ⭐⭐⭐ **AND THE OWNER'S QUESTION — *is that what Blender does?* — HAS A DEFINITE ANSWER, AND
 * IT IS NO.** Blender never binds screen-x to a world axis. It does one of two things:
 *
 * * **unconstrained** (`G`): the object moves in the **view plane** and follows the mouse
 *   exactly — one screen pixel of mouse is one screen pixel of object;
 * * **axis-constrained** (`G X`): the **whole** mouse delta is mapped onto the chosen axis by
 *   intersecting the mouse ray with the axis line, so the object still **tracks the mouse**
 *   along that axis. ⛔ There is no cosine loss: Blender solves for the travel that puts the
 *   object under the pointer, it does not scale the input by the axis's foreshortening.
 *
 * ⚠ So report 2 is a defect of ours, not a property of the technique — and report 1 is a
 * pairing Blender does not make at all: *the user* picks the axis there, and the mapping is
 * from the whole pointer motion, never from one of its components.
 *
 * ## ⭐⭐ WHAT THIS FILE DOES NOW
 *
 * **`PLANE` (the default).** The holder's 2D delta is **decomposed onto {x, gravity}** — a 2×2
 * solve — so the body moves inside its own VERTICAL plane and its image follows the finger
 * **exactly**. ⛔⛔ **THE PAIR WAS {x, depth} UNTIL 2026-09-23**, when the owner swapped the two
 * `dy` channels; the vertical plane is also the better-conditioned one, since the horizontal plane
 * went edge-on at a LEVEL camera and this one does not. ⭐ Nothing can feel inverted, because the body goes
 * where the finger goes; and the gain is 1 by construction, which is report 2's answer.
 * ⛔ It is Blender's *unconstrained* move with the view plane replaced by the body's horizontal
 * plane — the nearest thing in Blender to what this product is doing.
 *
 * **`CHANNELS`.** The dictated pairing, `dx`→x and `dy`→depth, each **normalised** — Blender's
 * `G X` applied twice, once per channel. ⚠ Kept as a selector so a hand can compare the two
 * rather than take my word for which answers report 1.
 *
 * **Depth** is the second touchpoint's channel, normalised the same way — and it is the axis that
 * turns to face the camera, so it is the one that carries the judged fixed-rate fallback.
 *
 * ## ⛔⛔ THE EDGE-ON CASE, AND WHERE WE DEPART FROM BLENDER ON PURPOSE
 *
 * Exact tracking divides by the axis's screen shadow, so it **explodes** as an axis turns to
 * face the camera — and the body's horizontal plane is edge-on at a **level camera**, which is
 * an ordinary place to be.
 *
 * ⭐ **Blender's own answer is a cone**: `axisProjection()` takes the angle between the axis and
 * the view direction and, **below 5°**, abandons the exact mapping for a plain projection —
 * which means the object very nearly **stops**. ⚠ That is a guard against `NaN`, not a feature,
 * and it is exactly the behaviour the owner rejected in report 3.
 *
 * ⛔⛔ **SO INSIDE THE CONE WE USE THE RULE A HAND HAS ALREADY JUDGED**: `depthTranslate`'s
 * fixed-rate push — `dy × trackingFactor × gain`, with `sign(towardGravity)` deciding whether
 * fingers-up means *away* or *towards*. ⭐ That rule was closed by a device look on 2026-09-16
 * and its sign was itself a defect found by finger, so the degenerate branch is the
 * best-attested mapping in the file rather than an improvisation.
 * ⚠ **At an exactly level camera `towardGravity` is 0 and the picture is genuinely symmetric** —
 * a body pushed away produces no screen motion at all — so the convention there is
 * *fingers-up = away*, continuous with the camera looking even slightly down.
 *
 * ⚠ **The cost of the cone, stated**: the rate is capped at `1/sin(cone)` just outside it and
 * drops to the fixed rate inside, so there is a step in world speed at the boundary. ⛔ Both
 * sides produce nearly no SCREEN motion there, which is why the step is not what a hand feels —
 * but it is real, it is on the HUD as `⛔EDGE-ON`, and `axisTrackingConeDeg` is a slider.
 *
 * ⛔ ENGINE-FREE.
 */
import { add, dot, normalize, scale, sub, type Vec3 } from "../core/vec";
import type { ObjectAxes } from "./object_axes";

/** The camera's own axes — `ScreenFrame`'s `right` and `up`. ⚠ Never the gravity frame. */
export interface CameraScreenAxes {
  readonly right: Vec3;
  readonly up: Vec3;
}

/** One frame's finger travel, CSS pixels. ⭐ **Deadbanded** travel (`A11`), never a raw delta. */
export interface AxisInputsPx {
  /** The holder's horizontal travel → the object's **x** axis. */
  readonly holderDxPx: number;
  /**
   * The holder's vertical travel → the object's **GRAVITY** axis. ⚠ Screen y grows DOWNWARD.
   * ⛔⛔ **SWAPPED WITH `secondDyPx` ON 2026-09-23** (the owner: *"for translation the gravity
   * input comes from the dy of the second touch and the depth input comes from dy of first touch.
   * Swap."*). ⭐ It restores the pairing rule 6 and `A10` had before `D75` — the holder moves the
   * body in a VERTICAL plane and the second finger pushes it away — now expressed in object axes
   * rather than in the camera's.
   */
  readonly holderDyPx: number;
  /** The second touchpoint's vertical travel → the object's **DEPTH** axis (swapped, 2026-09-23). */
  readonly secondDyPx: number;
}

/**
 * ⭐⭐⭐ **WHICH MAPPING THE HOLDER'S TWO NUMBERS GET** — a RULE SELECTOR, not a tunable.
 *
 * ⛔ `PLANE`: the 2D delta is decomposed onto both horizontal axes, so the body follows the
 * finger inside its own horizontal plane.
 * ⛔ `CHANNELS`: the dictation's literal pairing, `dx`→x and `dy`→depth, each tracking exactly
 * along its own axis — Blender's `G X`, twice.
 */
export type TranslatePairing = "PLANE" | "CHANNELS";

/** Metres along each object axis this frame. */
export interface AxisTravelM {
  readonly xM: number;
  readonly gravityM: number;
  readonly depthM: number;
}

/**
 * What the mapping did, for the readout. ⛔ Returned rather than recomputed by the HUD: *a
 * readout that derives its own answer is a second implementation* (`METHOD`), and the whole
 * point of `edgeOn` is to tell *"the rule refused"* from *"I pushed the wrong way"*.
 */
export interface AxisTravel extends AxisTravelM {
  /** True while the horizontal plane is edge-on and the fixed-rate fallback is driving. */
  readonly edgeOn: boolean;
  /**
   * ⭐⭐ **THE LEVERAGE** — world travel per unit of finger travel, both in tracking-factor
   * units. ⛔ It is NOT 1 when the body is under the finger: a foreshortened plane needs MORE
   * world travel to produce the same screen travel, so `1` is a plane square to the view and a
   * large number means the plane is nearly edge-on and a small push is going a long way.
   * ⚠ Stated carefully because the first draft of this comment claimed the opposite and the
   * round-trip vector caught it — the body being under the finger is the ROUND TRIP's claim,
   * which is a different quantity from this one.
   */
  readonly trackGain: number;
}

/**
 * An axis's SCREEN SHADOW: where one metre along it goes on the glass, in screen units
 * (x right, **y down** — the browser's convention, and the opposite of the camera's up).
 *
 * ⭐ Its LENGTH is the foreshortening (1 square to the view, 0 pointing at the camera) and its
 * DIRECTION is the line the body slides along on screen. ⛔ Both are needed, and the length
 * going to zero is exactly where the direction stops meaning anything — which is why the cone
 * below is on the length.
 */
export function screenShadow(
  axis: Vec3,
  camera: CameraScreenAxes,
): readonly [number, number] | null {
  const right = normalize(camera.right);
  const up = normalize(camera.up);
  const a = normalize(axis);
  if (!right || !up || !a) return null;
  return [dot(a, right), -dot(a, up)];
}

const finite = (n: number): number => (Number.isFinite(n) ? n : 0);

/**
 * The three channels.
 *
 * @param metresPerPx `trackingMetresPerPx` for this camera — rule 6's computed factor. ⭐ With
 *   exact tracking this is the whole of the scale: the gains below multiply it, and `1.0` puts
 *   the body under the finger.
 * @param holderGain `gainTranslateScreen`.
 * @param secondGain `gainTranslateDepth` — the second touchpoint's channel. ⚠ It has kept its
 *   name and its number while its AXIS moved to gravity; renaming a tuned number is how a
 *   device session loses its baseline.
 * @param coneDeg `axisTrackingConeDeg` — how near the view direction an axis may come before
 *   the exact mapping is abandoned for the fixed-rate push. ⭐ **5° is Blender's own number**
 *   (`axisProjection`), adopted rather than guessed. `0` disables the fallback entirely, which
 *   is how to see the runaway a hand is being protected from.
 * @param towardGravity `GravityFrame.towardGravity` — +1 looking down on the scene, −1 looking
 *   up at it. ⛔ Only read inside the cone, where it is the sign `depthTranslate` needed.
 */
export function axisTravel(
  input: AxisInputsPx,
  camera: CameraScreenAxes,
  axes: ObjectAxes,
  metresPerPx: number,
  holderGain: number,
  secondGain: number,
  pairing: TranslatePairing,
  coneDeg: number,
  towardGravity: number,
): AxisTravel {
  const sx = screenShadow(axes.x, camera);
  const sd = screenShadow(axes.depth, camera);
  const sg = screenShadow(axes.gravity, camera);
  // ⛔ A camera with no basis moves nothing, rather than moving by NaN. One NaN written into a
  // placement is permanent — it never washes out of a position.
  if (!sx || !sd || !sg || !Number.isFinite(metresPerPx)) {
    return { xM: 0, gravityM: 0, depthM: 0, edgeOn: false, trackGain: 0 };
  }
  const dx = finite(input.holderDxPx) * metresPerPx;
  const dy = finite(input.holderDyPx) * metresPerPx;
  const dy2 = finite(input.secondDyPx) * metresPerPx;
  const coneSin = Math.sin(Math.max(0, finite(coneDeg)) * (Math.PI / 180));

  /** Exact tracking along ONE axis: the travel that keeps the body under the finger. */
  const along = (s: readonly [number, number], mx: number, my: number): number | null => {
    const len = Math.hypot(s[0], s[1]);
    if (!(len > coneSin) || !(len > 0)) return null;
    // ⭐ `(m · ŝ) / |s|` — project onto the axis's screen LINE, then undo the foreshortening.
    // ⛔ The division is the whole of report 2's fix, and it is what Blender's ray/line
    // intersection amounts to for a straight drag.
    return (mx * s[0] + my * s[1]) / (len * len);
  };

  // ⭐⭐ THE FIXED-RATE PUSH, for an axis that points at the camera. ⛔ `depthTranslate`'s
  // mapping, which a device look closed on 2026-09-16 — including its sign, which was itself a
  // defect found by finger. ⚠ `sign(towardGravity)` is 0 only at an exactly level camera, where
  // the picture is symmetric and no sign is derivable; *fingers-up = away* is the convention,
  // continuous with the camera looking even slightly down.
  //
  // ⭐⭐⭐ **SINCE THE 2026-09-23 SWAP IT BELONGS TO THE SECOND TOUCHPOINT**, which is where it
  // came from: `depth` is the axis that turns to face the camera, and the second finger is now
  // what drives it. ⛔ The degenerate case and its judged fallback are back on the same channel.
  const awaySign = Math.sign(finite(towardGravity)) || 1;
  const fallbackDepth = -dy2 * secondGain * awaySign;

  let xM = 0;
  let gravityM = 0;
  let depthM = 0;
  let edgeOn = false;

  if (pairing === "PLANE") {
    // ⭐⭐⭐ **THE 2×2 SOLVE, ON THE {x, gravity} PLANE SINCE THE SWAP.** Find the travels whose
    // SCREEN motion adds up to the finger's. ⛔ Solving beats projecting onto each axis
    // separately: the two shadows are not perpendicular on screen in general, so independent
    // projections would double-count the overlap and the body would outrun the finger.
    //
    // ⭐⭐ **AND IT IS A BETTER-CONDITIONED PLANE THAN {x, depth} WAS.** A vertical plane faces
    // the camera at every ordinary pose; the horizontal one it replaced went edge-on at a LEVEL
    // camera, which is where a hand spends much of its time. ⚠ This one degenerates only looking
    // straight DOWN (gravity's shadow vanishes, and the orbit rings make it unreachable) or with
    // the camera along the body's own `x` — reachable, and quiet rather than wild.
    const det = sx[0] * sg[1] - sx[1] * sg[0];
    if (Math.abs(det) > coneSin) {
      xM = ((dx * sg[1] - dy * sg[0]) / det) * holderGain;
      gravityM = ((sx[0] * dy - sx[1] * dx) / det) * holderGain;
    } else {
      edgeOn = true;
      // ⛔ **SUPPRESS, DO NOT GUESS.** Each axis keeps exact tracking on its own channel and the
      // foreshortened one goes QUIET. ⚠ No fixed-rate rescue here, unlike depth: *away* has a
      // meaning a hand has judged and `x` has none, so inventing a direction for it would be the
      // guessed convention `LESSONS_CARRIED` §6 refuses.
      xM = (along(sx, dx, dy) ?? 0) * holderGain;
      gravityM = (along(sg, dx, dy) ?? 0) * holderGain;
    }
  } else {
    // ⭐ CHANNELS: Blender's `G X`, once per channel — the whole delta is not used, only the
    // component assigned to that axis.
    xM = (along(sx, dx, 0) ?? 0) * holderGain;
    gravityM = (along(sg, 0, dy) ?? 0) * holderGain;
  }

  // ⭐⭐⭐ **DEPTH IS THE SECOND TOUCHPOINT'S CHANNEL SINCE 2026-09-23** (the owner: *"for
  // translation the gravity input comes from the dy of the second touch and the depth input comes
  // from dy of first touch. Swap."*). ⛔ It is the axis that turns to face the camera, so it is
  // the one that needs the judged fixed-rate fallback — and it now has it.
  const d = along(sd, 0, dy2);
  if (d === null) {
    // ⚠ `edgeOn` means **the exact mapping was abandoned for an input that existed**, not that it
    // would have been. ⛔ Reporting it for an idle channel would light `⛔EDGE-ON` on the HUD
    // through every ordinary drag at a level camera — a readout that cries wolf is one a hand
    // learns to ignore, which is worse than none.
    if (dy2 !== 0) edgeOn = true;
    depthM = fallbackDepth;
  } else {
    depthM = d * secondGain;
  }

  const asked = Math.hypot(dx, dy);
  return {
    xM,
    depthM,
    gravityM,
    edgeOn,
    // ⭐ What one pixel bought, as a multiple of the tracking factor: 1 is under the finger.
    // ⚠ The HOLDER's plane — {x, gravity} since the swap. ⛔ It measured `depth` until then,
    // which after the swap is a channel the holder does not drive at all: the leverage would have
    // read 0 for every drag, which is what the round-trip vector caught.
    trackGain: asked > 0 ? Math.hypot(xM, gravityM) / asked : 0,
  };
}

/**
 * The three travels composed into one world displacement.
 *
 * ⭐⭐ **ONE EXPRESSION, AND THAT IS DELIBERATE.** `METHOD`: *a composition is a thing to
 * MEASURE, not an emergent property* — the predecessor's rotation stack was defensible at
 * every layer and a reflection as a whole. ⚠ Separating *what each channel asked for* from
 * *where the body ends up* is what lets a vector check the composite directly, which is the
 * check that was missing when `A7` was wrongly accused.
 */
export function axisDisplacement(travel: AxisTravelM, axes: ObjectAxes): Vec3 {
  return [
    axes.x[0] * travel.xM + axes.gravity[0] * travel.gravityM + axes.depth[0] * travel.depthM,
    axes.x[1] * travel.xM + axes.gravity[1] * travel.gravityM + axes.depth[1] * travel.depthM,
    axes.x[2] * travel.xM + axes.gravity[2] * travel.gravityM + axes.depth[2] * travel.depthM,
  ];
}

/**
 * ⭐ Keep a body inside the depth range a gesture may drive it to — `A5`'s bounds, unchanged.
 *
 * ⛔⛔ **IT IS CARRIED OVER DELIBERATELY, BECAUSE THE CHANNEL MOVED AND THE HAZARD DID NOT.**
 * `depthTranslate` clamped the along-push distance so an object could not be driven through
 * the near plane (*a black page with no error at all*) or past the camera's maximum orbit
 * radius, where it cannot be brought back. ⚠ Exact tracking makes this MORE load-bearing, not
 * less: near the cone a small push buys a long way, and the clamp is what bounds it.
 *
 * @param pushDir the horizontal depth direction the range is measured along — `A7`'s
 *   `GravityFrame.depth`, which is what the limits were derived against.
 *
 * ⭐ Returns the position unchanged when it is already inside the range, when there is no
 * push direction, or when the body is behind the camera — never a `NaN`.
 */
export function clampDepthRange(
  cameraPosition: Vec3,
  position: Vec3,
  pushDir: Vec3,
  minM: number,
  maxM: number,
): Vec3 {
  const dir = normalize(pushDir);
  if (!dir) return position;
  const depth = dot(sub(position, cameraPosition), dir);
  if (!Number.isFinite(depth) || !(depth > 0)) return position;
  const clamped = Math.min(maxM, Math.max(minM, depth));
  if (clamped === depth) return position;
  // ⭐ Only the along-push component moves, so the other two axes' travel survives the clamp
  // intact — a body pressed against the ceiling still slides sideways.
  return add(position, scale(dir, clamped - depth));
}
