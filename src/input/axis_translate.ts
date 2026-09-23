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
 * **`PLANE` (the default).** The holder's 2D delta is **decomposed onto the two axes' screen
 * shadows** — a 2×2 solve — so the body moves inside its own `{x, gravity}` plane and its image
 * follows the finger **exactly**, for as long as that plane is presented well enough to solve. ⭐ Nothing can feel inverted, because the body goes
 * where the finger goes; and the gain is 1 by construction, which is report 2's answer.
 * ⛔ It is Blender's *unconstrained* move with the view plane replaced by the body's horizontal
 * plane — the nearest thing in Blender to what this product is doing.
 *
 * **`CHANNELS`.** The dictated pairing, `dx`→x and `dy`→depth, each **normalised** — Blender's
 * `G X` applied twice, once per channel. ⚠ Kept as a selector so a hand can compare the two
 * rather than take my word for which answers report 1.
 *
 * **Gravity** is always its own channel, normalised the same way.
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
 * ⛔⛔ **SO INSIDE THE CONE THE SECOND TOUCHPOINT USES THE RULE A HAND HAS ALREADY JUDGED**:
 * `depthTranslate`'s fixed-rate push — `dy × trackingFactor × gain`, with `sign(towardGravity)`
 * deciding whether fingers-up means *away* or *towards*. ⭐ That rule was closed by a device look
 * on 2026-09-16 and its sign was itself a defect found by finger.
 * ⚠ **At an exactly level camera `towardGravity` is 0 and the picture is genuinely symmetric** —
 * a body pushed away produces no screen motion at all — so the convention there is
 * *fingers-up = away*, continuous with the camera looking even slightly down.
 *
 * ## ⛔⛔⛔ THE HOLDER'S DEGENERATE BRANCH — REWRITTEN 2026-09-23 (defect 56)
 *
 * > *"There are still issues with blocking at white highlight and erratic movement. **Debug
 * > better.**"* — the owner, with a HUD showing `PLANE track=0.00× ⛔EDGE-ON` at **one pointer**
 *
 * ⭐⭐⭐ **BOTH SYMPTOMS ARE ONE CLIFF, AND IT WAS MEASURED RATHER THAN REASONED ABOUT.** The
 * solve's rate is `1/|det|`, so at a 5° cone the body moves **11.5× the finger** just outside
 * the boundary and **~0** just inside it. *Erratic* is the outside; *blocked* is the inside;
 * the white contour is where a basis SWITCHES (`D74`) and therefore where the boundary is
 * crossed most often. ⛔ Two reports, one number.
 *
 * ⚠⚠ **AND THE COMMENT THAT STOOD HERE WAS FALSE.** It claimed the `{x, gravity}` plane *"faces
 * the camera at every ordinary pose"*. With `worldAxisB` the axes are frozen at BOOT, so a
 * quarter-turn of orbit puts `x` along the view and the plane is edge-on with a perfectly
 * ordinary camera — which is the pose in the owner's screenshot. ⭐ `METHOD`: *a claim about
 * conditioning is a MEASUREMENT* — one `|det|` sweep would have refused the swap's justification
 * the day it was written.
 *
 * ⭐ **And the cone is now a LEVERAGE BOUND, not a `NaN` guard** — `1/sin(cone)` is the fastest
 * the body may outrun the finger, so 20° reads *"never more than 2.9×"*. That is why the default
 * moved off Blender's 5°: Blender is protecting a division, this is protecting a hand.
 * ⚠ It is a judgement, it has a slider, and no hand has judged it yet.
 *
 * ⛔⛔ **DEFECT 56's OWN ANSWER WAS RETRACTED THE SAME DAY, AND BOTH ARE KEPT.** It decomposed
 * the finger's screen travel onto **all three** axes, so the body followed the finger exactly —
 * and paid for it by travelling along **depth**, which the holder does not own. ⭐ The owner read
 * it off the gizmo within the hour: *"back and forth with dx translates in depth"*.
 *
 * ## ⭐⭐⭐ THE RULE THAT REPLACED IT — AN INPUT KEEPS ITS AXIS (defect 58)
 *
 * > *"I would expect the object to continue translating with dy input (that should translate the
 * > object **towards or away from the camera**)"* — the owner, 2026-09-23, report 3
 *
 * ⭐⭐ **That sentence decides it, and it was already on file.** A channel whose axis points at
 * the camera is expected to push the body **along that axis**, toward or away — not to be
 * re-pointed at a more photogenic axis so the image keeps up with the finger. ⛔ So when the
 * plane degenerates it stops being a plane: **each channel falls back to its own dictated axis**,
 * tracking where the axis is presented well enough to track and a fixed rate where it is not.
 *
 * ⭐ **Three fixed rates, one shape**, all of them `depthTranslate`'s — the rule a device look
 * closed on 2026-09-16: `gravity` needs no convention (it is `up`, so fingers-up lifts), `depth`
 * keeps `sign(towardGravity)`, and `x` takes *finger right = away from the camera*.
 * ⚠⚠ **`x`'s sense REVERSES as the axis swings through edge-on** and no convention can bridge
 * it, because the two sides are mirror images — the same symmetry `towardGravity = 0` already has.
 *
 * ⛔ **What is given up, stated: the body no longer stays under the finger in that pose.** It
 * cannot — the finger is asking for a travel the dictated axes cannot show.
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
   * ⛔⛔ **SWAPPED WITH `secondDyPx` ON 2026-09-23**, the owner: *"when in translation mode and
   * when in rotation mode with two touches pressed with object aligned: swap the inputs dy of
   * second touch and dy of first touch."* ⭐ Those are exactly the configurations in which the
   * holder's `dy` translates at all, so the swap is unconditional here and observable only
   * there. ⚠ It restores the pairing rule 6 and `A10` had before the object axes existed — the
   * holder moves the body in a VERTICAL plane and the second finger pushes it away.
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
  /**
   * True while **either** fallback is driving. ⚠ Kept for the call sites that only ask *did the
   * exact mapping hold?*; `mode` and `planeDet` are what a device report needs.
   */
  readonly edgeOn: boolean;
  /**
   * ⭐⭐⭐ **WHICH BRANCH RAN — because *"it moved strangely"* has three causes and the HUD could
   * not tell them apart.** The owner's 2026-09-23 report (*"blocking at white highlight and
   * erratic movement — debug better"*) arrived with `⛔EDGE-ON` lit and **one pointer** down,
   * which was the whole of the evidence: it did not say which plane, how near degenerate, or
   * whether the depth channel was involved at all. ⛔ Named, not inferred.
   */
  readonly mode: "PLANE-SOLVE" | "PLANE-PER-AXIS" | "CHANNELS";
  /**
   * ⭐⭐ **THE HOLDER PLANE'S CONDITIONING**, `|det|` of the two axes' screen shadows — 1 when the
   * plane is square to the view, 0 when it is edge-on, and the solve's rate is its reciprocal.
   * ⛔ This is the number that decides everything above, so it is REPORTED: the cliff stood for
   * a day because nobody could see how close to it a drag was running.
   */
  readonly planeDet: number;
  /**
   * The second touchpoint's channel fell back to the fixed-rate push. ⚠ Separate from the
   * holder's branch: they degenerate at different camera poses and conflating them is what made
   * `⛔EDGE-ON` with one finger unreadable.
   */
  readonly depthFallback: boolean;
  /**
   * ⭐⭐⭐ **HOW LONG EACH AXIS LOOKS ON THE GLASS — `[x, gravity, depth]`, 1 square to the
   * view and 0 pointing straight at the camera.**
   *
   * ⛔⛔ Added 2026-09-23 because `det=0.000` says the plane is degenerate and NOT WHICH AXIS
   * did it — and the difference is the difference between two defects. I had to read it off the
   * gizmo in a photograph of the tablet: a stub of red told me `x` was edge-on, which is what
   * made defect 59 findable. ⚠ A readout that requires a photograph of another readout is not
   * an instrument.
   */
  readonly shadowLens: readonly [number, number, number];
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
 * ⛔⛔ **`towardGravity` WAS A PARAMETER HERE AND IS GONE** (defect 63): it was the fixed rate's
 * sign, and a camera ELEVATION cannot aim an arbitrary world axis. ⚠ Deleted rather than left
 * unread — an argument nothing consults is the shape `unwired_debt.test.ts` exists to refuse.
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
): AxisTravel {
  const right = normalize(camera.right);
  const up = normalize(camera.up);
  const sx = screenShadow(axes.x, camera);
  const sd = screenShadow(axes.depth, camera);
  const sg = screenShadow(axes.gravity, camera);
  // ⛔ A camera with no basis moves nothing, rather than moving by NaN. One NaN written into a
  // placement is permanent — it never washes out of a position.
  if (!right || !up || !sx || !sd || !sg || !Number.isFinite(metresPerPx)) {
    return {
      xM: 0,
      gravityM: 0,
      depthM: 0,
      edgeOn: false,
      mode: "PLANE-SOLVE",
      planeDet: 0,
      depthFallback: false,
      shadowLens: [0, 0, 0],
      trackGain: 0,
    };
  }
  // ⭐ The view direction, for the one convention the glass cannot supply (see `sense`).
  const view = normalize([
    right[1] * up[2] - right[2] * up[1],
    right[2] * up[0] - right[0] * up[2],
    right[0] * up[1] - right[1] * up[0],
  ]);
  const dx = finite(input.holderDxPx) * metresPerPx;
  const dy = finite(input.holderDyPx) * metresPerPx;
  const dy2 = finite(input.secondDyPx) * metresPerPx;
  const coneSin = Math.sin(Math.max(0, finite(coneDeg)) * (Math.PI / 180));

  /**
   * Exact tracking along ONE axis: the travel that keeps the body under the finger.
   *
   * ⛔⛔⛔ **THE GUARD IS ON THE PROJECTED SHADOW `|s · m̂|`, NOT ON `|s|` — defect 57,
   * 2026-09-23.** The travel is `|m| · cosθ / |s|`, so the exact mapping fails in **two**
   * directions and the old test caught only one:
   *
   * * `|s| → 0`, the axis pointing at the camera — it **explodes**;
   * * `cosθ → 0`, the finger's direction square to the axis's screen line — it **vanishes**.
   *
   * ⭐⭐ The owner met the second: *"The second touch is losing its input"*, at a camera where
   * the depth axis lies **horizontal on the glass** while that finger's travel is purely
   * **vertical**. ⚠ The shadow was FULL LENGTH (1.000) there, so the cone passed and the channel
   * returned **exactly zero** — a dead finger with every guard satisfied.
   *
   * ⭐⭐⭐ **ONE TEST COVERS BOTH, because `|s · m̂| = |s|·cosθ` is small in either case** — and it
   * bounds the gain from both sides: at most `1/sin(cone)` (defect 56's leverage bound) and at
   * least `sin(cone)`, so a channel may be weak but never dead.
   * ⚠ `METHOD`: *guard the quantity that is actually divided, not the one that is easy to name.*
   */
  const along = (s: readonly [number, number], mx: number, my: number): number | null => {
    const len = Math.hypot(s[0], s[1]);
    const askedPx = Math.hypot(mx, my);
    if (!(len > 0) || !(askedPx > 0)) return null;
    // ⭐ How much of the axis's screen LINE this particular travel actually runs along.
    if (!(Math.abs((mx * s[0] + my * s[1]) / askedPx) > coneSin)) return null;
    // ⭐ `(m · s) / |s|²` — project onto the axis's screen LINE, then undo the foreshortening.
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
  // ⭐⭐⭐ **SINCE THE SWAP IT BELONGS TO THE SECOND TOUCHPOINT**, which is where it came from:
  // `depth` is the axis that turns to face the camera, and the second finger drives it now.
  // ⛔⛔⛔ **ONE FALLBACK, AND IT KEEPS THE DIRECTION THE EXACT MAPPING WOULD HAVE TAKEN —
  // defect 63, 2026-09-23.**
  //
  // > *"inversion of dy input direction"* — the owner, crossing into the capture zone
  //
  // ⚠⚠ The three channels had three UNRELATED sign rules: the exact branch's direction comes
  // from the axis's screen shadow, `depth`'s fixed rate came from `sign(towardGravity)` (a camera
  // ELEVATION), and `x`'s came from the axis against the view direction. ⛔ Nothing made them
  // agree, so crossing the cone — which happens exactly where a basis switches — could reverse
  // the body for the same finger movement.
  //
  // ⭐⭐ So the fallback now replaces only the RATE. The sense is `sign(m · s)`: the way the body
  // would have gone had the exact mapping still been trusted. ⛔ **It cannot invert at the
  // boundary**, by construction, because both sides read the same quantity — only the magnitude
  // steps.
  //
  // ⭐ `towardGravity` is no longer consulted, and that is a correction rather than a loss: it was
  // the right quantity while `depth` WAS the camera's own away-axis, and `worldAxisB` froze the
  // axes at boot while `D74` gave the zone a basis of its own. A camera-elevation sign says
  // nothing about an arbitrary world direction.
  const sense = (s: readonly [number, number], mx: number, my: number, axis: Vec3): number => {
    const proj = mx * s[0] + my * s[1];
    if (proj !== 0) return Math.sign(proj);
    // ⚠⚠ **EXACTLY EDGE-ON OR EXACTLY SQUARE: the glass says nothing, and the two answers are
    // mirror images.** The convention is *finger right, or finger up, pushes the body AWAY from
    // the camera along its axis* — which is what `sign(towardGravity)` encoded for the one axis
    // it was ever correct for, so the judged behaviour is preserved where it was judged.
    const forward = mx !== 0 ? Math.sign(mx) : Math.sign(-my);
    const away = view === null ? 1 : Math.sign(dot(axis, view)) || 1;
    return (forward || 1) * away;
  };
  /** The judged fixed rate — one finger-travel maps to one tracking unit — aimed by `sense`. */
  const fixedAlong = (
    s: readonly [number, number],
    mx: number,
    my: number,
    axis: Vec3,
  ): number => Math.hypot(mx, my) * sense(s, mx, my, axis);

  const fallbackDepth = fixedAlong(sd, 0, dy2, axes.depth) * secondGain;

  // ⭐⭐⭐ **THE HOLDER'S OWN TWO FIXED RATES** (defect 58) — same shape as the depth channel's,
  // which a device look closed on 2026-09-16, and each one on the axis the owner DICTATED for it.
  //
  // ⛔ **Gravity needs no convention at all**: it is `frame.up`, so fingers-up is up. That is the
  // one channel where the picture can never be symmetric, which is why it gets the plain rate.
  //
  // ⚠⚠ **x DOES need one, and it is a genuine ambiguity rather than a choice I am ducking.** An
  // axis pointing at the camera has no left or right on the glass, so the convention is
  // *finger right = away from the camera*, continuous with the depth channel's *fingers-up =
  // away*. ⛔ **Its cost, stated: the sense REVERSES as the axis swings through edge-on** — the
  // exact mapping just outside the cone is right-is-away on one side and right-is-towards on the
  // other, and no convention can bridge that, because the two are mirror images. ⭐ It is the
  // same symmetry the depth channel meets at a level camera, where `towardGravity` is 0.
  const fallbackX = fixedAlong(sx, dx, 0, axes.x);
  const fallbackGravity = fixedAlong(sg, 0, dy, axes.gravity);

  let xM = 0;
  let gravityM = 0;
  // ⭐⭐ THE HOLDER'S OWN depth contribution. ⛔⛔ **IT IS NOW ALWAYS ZERO, AND THAT IS THE
  // POINT OF DEFECT 58** — the holder owns `x` and `gravity`, and nothing may quietly spend its
  // travel on the second finger's axis. ⚠ Kept as a named zero rather than deleted so
  // `trackGain` keeps measuring the same quantity across the retraction.
  const holderDepthM = 0;
  let depthM = 0;
  let mode: AxisTravel["mode"] = "CHANNELS";
  let planeDet = 0;

  if (pairing === "PLANE") {
    // ⭐⭐⭐ **THE 2×2 SOLVE, ON THE {x, gravity} PLANE SINCE THE SWAP** (the owner, 2026-09-23:
    // *"swap the inputs dy of second touch and dy of first touch"*). Find the travels whose
    // SCREEN motion adds up to the finger's. ⛔ Solving beats projecting onto each axis
    // separately: the two shadows are not perpendicular on screen in general, so independent
    // projections would double-count the overlap and the body would outrun the finger.
    //
    // ⛔⛔ **AND THE CLAIM THAT USED TO STAND HERE — *"a vertical plane faces the camera at
    // every ordinary pose"* — WAS FALSE, AND UNMEASURED.** With `worldAxisB` the axes are frozen
    // at boot: orbit a quarter turn and `x` points at the camera, `|det|` → 0, at a camera pose
    // nobody would call unusual. See the header.
    const det = sx[0] * sg[1] - sx[1] * sg[0];
    planeDet = Math.abs(det);
    if (planeDet > coneSin) {
      mode = "PLANE-SOLVE";
      xM = ((dx * sg[1] - dy * sg[0]) / det) * holderGain;
      gravityM = ((sx[0] * dy - sx[1] * dx) / det) * holderGain;
    } else {
      mode = "PLANE-PER-AXIS";
      // ⛔⛔⛔ **A DEGENERATE PLANE MUST NOT STOP THE BODY, AND IT MUST NOT RE-POINT THE INPUT
      // EITHER — defect 58, and it RETRACTS defect 56's answer hours after it shipped.**
      //
      // > *"back and forth with dx translates in depth"* — the owner, 2026-09-23
      //
      // ⭐ Defect 56 decomposed the finger's screen travel onto all THREE axes, so the body
      // followed the finger exactly — and paid for it by moving along **depth**, an axis the
      // holder does not own. ⚠ The owner saw it on the gizmo within the hour.
      // ⭐⭐⭐ **AND HIS OWN EARLIER SENTENCE IS THE RULE**: *"I would expect the object to
      // continue translating with dy input (that should translate the object **towards or away
      // from the camera**)"*. ⛔ So an input whose axis points at the camera keeps that axis and
      // pushes the body along it — it is NOT re-pointed to keep the image under the finger.
      //
      // ⭐⭐ So the degenerate plane simply stops being a plane: each channel falls back to its
      // OWN dictated axis, exactly as the `CHANNELS` pairing and the second finger's depth
      // channel already do. ⛔ Tracking where the axis is presented well enough to track, a fixed
      // rate where it is not, and **never another axis**.
      xM = (along(sx, dx, 0) ?? fallbackX) * holderGain;
      gravityM = (along(sg, 0, dy) ?? fallbackGravity) * holderGain;
    }
  } else {
    // ⭐ CHANNELS: Blender's `G X`, once per channel — the whole delta is not used, only the
    // component assigned to that axis.
    // ⛔ **AND IT GETS THE SAME FIXED RATES SINCE DEFECT 58**, which it should have had from the
    // start: it used to return 0 for a foreshortened axis, which is the dead channel the owner
    // rejected in report 3. ⚠ The two pairings now differ ONLY in whether the two channels are
    // solved together, which is the comparison this selector exists to make.
    xM = (along(sx, dx, 0) ?? fallbackX) * holderGain;
    gravityM = (along(sg, 0, dy) ?? fallbackGravity) * holderGain;
  }

  // ⭐⭐⭐ **DEPTH IS THE SECOND TOUCHPOINT'S CHANNEL SINCE THE SWAP.** ⛔ It is the axis that
  // turns to face the camera, so it is the one that needs the judged fixed-rate fallback — and
  // it now has it, which is where `depthTranslate` put it in the first place.
  const d = along(sd, 0, dy2);
  let depthFallback = false;
  if (d === null) {
    // ⚠ Reported only when **an input existed**, not whenever it would have. ⛔ Lighting it for
    // an idle channel would flag every ordinary drag at a level camera, and a readout that cries
    // wolf is worse than none.
    if (dy2 !== 0) depthFallback = true;
    depthM = fallbackDepth;
  } else {
    depthM = d * secondGain;
  }
  // ⭐ The two channels SUM on this axis, exactly as `D43` made every other pair of channels sum.
  depthM += holderDepthM;

  const asked = Math.hypot(dx, dy);
  return {
    xM,
    depthM,
    gravityM,
    edgeOn: mode === "PLANE-PER-AXIS" || depthFallback,
    mode,
    planeDet,
    depthFallback,
    shadowLens: [Math.hypot(...sx), Math.hypot(...sg), Math.hypot(...sd)],
    // ⭐ What one pixel bought, as a multiple of the tracking factor: 1 is under the finger.
    // ⛔ THE HOLDER'S THREE COMPONENTS, including the depth one — in the screen-plane branch that
    // component carries most of the travel, and leaving it out is what made the owner's HUD read
    // `track=0.00×` while the body was in fact being moved. ⚠ A readout that measures only the
    // channels the healthy branch uses cannot describe the branch that replaces it.
    trackGain: asked > 0 ? Math.hypot(xM, gravityM, holderDepthM) / asked : 0,
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
