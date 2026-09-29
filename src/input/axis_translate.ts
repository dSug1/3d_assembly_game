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
 * **`PLANE` (the default).** The holder's 2D delta is **decomposed onto the two horizontal
 * axes' screen shadows** — a 2×2 solve — so the body moves inside its own horizontal plane and
 * its image follows the finger **exactly**. ⭐ Nothing can feel inverted, because the body goes
 * where the finger goes; and the gain is 1 by construction, which is report 2's answer.
 * ⛔ It is Blender's *unconstrained* move with the view plane replaced by the body's horizontal
 * plane — the nearest thing in Blender to what this product is doing.
 *
 * ⛔ **`CHANNELS`**, the dictated `dx`→x / `dy`→depth pairing, was a selectable alternative
 * (`translatePairing = 0`) and is DELETED (`D109`, 2026-09-27): `PLANE` is the one mapping.
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
 * ⛔⛔ **SO INSIDE THE CONE WE USE THE RULE A HAND HAS ALREADY JUDGED**: `depthTranslate`'s
 * fixed-rate push (the function is deleted, `D109`; its mapping lives on here) —
 * `dy × trackingFactor × gain`, with `sign(towardGravity)` deciding whether
 * fingers-up means *away* or *towards*. ⭐ That rule was closed by a device look on 2026-09-16
 * and its sign was itself a defect found by finger, so the degenerate branch is the
 * best-attested mapping in the file rather than an improvisation.
 * ⚠ **At an exactly level camera `towardGravity` is 0 and the picture is genuinely symmetric** —
 * a body pushed away produces no screen motion at all — so the convention there is
 * *fingers-up = away*, continuous with the camera looking even slightly down.
 *
 * ⭐⭐⭐ **`D127` — THE AXES STAY THE WORLD'S; *AWAY* IS READ OFF THE CAMERA OF NOW** (the owner,
 * 2026-09-28: *"I want to translate the object in the world axis in whatever camera position … In
 * edge-on case, I want dy to translate the object on blue axis (finger up = translation on blue
 * axis away from the camera)."*). ⛔⛔ The push was `+blue` for fingers-up, which is *away* only
 * at the BOOT camera: past a quarter-orbit it brought the body toward the camera. ⭐ Now the holder's
 * `dy` drives **blue alone** and its sign is `blue · viewDepth` — so the axis never changes, only
 * which of its two ends is *away*. ⚠ A camera orbit re-reads it; a finger mid-drag cannot orbit.
 * ⭐⭐ **`D132`** (the owner, the same day: *"compute the camera position vs. the center of the gizmo,
 * not the camera position in absolute world coordinates"*): *away* is read along the line from the
 * camera to the GIZMO's anchor, not along the view — the body's distance from the camera is what
 * must grow, and for a body off the screen's centre the two directions part.
 * ⭐ **Blender has the same flaw**: `axisProjection`'s view-parallel branch moves along
 * `axis × −factor` whatever the axis's orientation, so mouse-up is *away* only when the axis
 * points at the viewer. ⚠ **Cost, stated**: at a quarter-orbit blue is square to the view, *away*
 * has no meaning (`+blue` by convention), fingers-up slides the body SIDEWAYS on the glass, and
 * nothing moves it in depth — red points at the camera and goes quiet.
 *
 * ⚠ **The cost of the cone, stated**: the rate is capped at `1/sin(cone)` just outside it and
 * drops to the fixed rate inside, so there is a step in world speed at the boundary. ⛔ Both
 * sides produce nearly no SCREEN motion there, which is why the step is not what a hand feels —
 * but it is real, it is on the HUD as `⛔EDGE-ON`, and `axisTrackingConeDeg` is a slider.
 *
 * ## ⭐⭐⭐ `D145` — THE AXES ARE THE CAMERA'S AGAIN, AND *AWAY* IS READ FROM HEIGHTS (2026-09-29)
 *
 * > *"horizontal plane translation (first touch or left click without shift) is done: on camera view
 * > axis (projected onto the horizontal plane) for dy — dy towards top translates the object away
 * > from the camera if the camera is above or at the gizmo gravity position, towards the camera if
 * > the camera is below the gizmo gravity position; on camera screen horizontal axis (projected onto
 * > the horizontal plane …) for dx. Translation sense follows dx sense."* — the owner, 2026-09-29
 *
 * ⛔⛔ **IT REVERSES `D74`/`D75`'s BOOT-FIXED AXES AND `D127`'s *"the axes stay the world's"*.** The
 * caller now hands this function the LIVE camera's gravity frame (`axesFromFrame`): **x** is the
 * screen's right, flattened, and **depth** the view direction, flattened — so the 2×2 solve that
 * spread one finger channel over two world axes has nothing left to solve, and is gone:
 *
 * * **`dx` → x, exactly under the finger** — x lies across the glass (no camera roll exists);
 * * **`dy` → depth**, at `1 / |its screen shadow|` (the tracking `D76` asked for: *"the input seems
 *   very weak"* was the cosine loss) outside the cone, and at the judged fixed rate inside it;
 * * ⭐⭐ **its SIGN is the owner's rule, everywhere, not only edge-on**: finger up is AWAY when the
 *   camera is at or above the gizmo's height, TOWARD when below. ⭐ It is also the true perspective
 *   answer — a body moved away slides toward the HORIZON row, i.e. UP on the glass when it sits
 *   below eye level — where the old screen shadow's sign was the VIEW's pitch, which disagrees for
 *   a body above eye level while the camera looks down (the `D132` shape, one axis over).
 *
 * ⭐ And the gizmo's **red and blue light together** for any holder input (`driven`), reversing the
 * 2026-09-23 *"both only when both dx and dy are not null"*.
 * ⚠ A free body's TURN still stands on the boot frame (`D84`, `rotationFrame`) — the owner named
 * the translation only.
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
  /** The holder's horizontal travel. */
  readonly holderDxPx: number;
  /** The holder's vertical travel. ⚠ Screen y grows DOWNWARD. */
  readonly holderDyPx: number;
  /** The second touchpoint's vertical travel → the object's **gravity** axis. */
  readonly secondDyPx: number;
}

/**
 * ⭐ The gizmo's six channels: `[x, gravity, depth, roll, yaw, pitch]`.
 *
 * ⛔⛔ **THE FIRST THREE ARE DIRECTIONS THE BODY IS MOVED ALONG; THE LAST THREE ARE AXES IT IS
 * TURNED ABOUT** — a different kind of fact, which is why they carry a different family of
 * colours (grey, purple, maroon) rather than a fourth, fifth and sixth shade of the first three.
 *
 * ⭐⭐ **AND THEY ARE ONE SET, NOT TWO** — the owner, 2026-09-23: *"add a grey axis … also when
 * there is rotation with the dx of the first touch … create purple and marron axis for yaw and
 * pitch rotation on unaligned object in rotation mode."* ⛔ Keeping translation and rotation in the
 * SAME set is what makes starting to translate put the rotation lines away, and starting to turn
 * put the translation lines away, **with no rule written for either**: `displayedAxes` replaces a
 * non-empty set wholesale. ⚠ A second, independent set would have needed a rule to clear the
 * first, and that rule is exactly the sort nothing can interrogate.
 */
export type GizmoChannels = readonly [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

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
  /**
   * ⭐⭐⭐ **WHICH CHANNELS PUSHED THIS FRAME**, as `[x, gravity, depth]`.
   *
   * ⛔ The gizmo's rule reads this and not the travel, because under `PLANE` a pure `dx` moves the
   * body along BOTH horizontal axes and the owner asked for the line of the channel he pushed.
   * ⚠ Returned rather than recomputed by the caller: the channel map has one home, the line that
   * fills this.
   */
  readonly driven: readonly [boolean, boolean, boolean];
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

/** ⭐ `+1`: finger up takes the body AWAY from the camera (`+depth`); `−1`: TOWARD it. */
export type AwaySign = 1 | -1;

/**
 * ⭐⭐⭐ `D145` — **WHICH WAY FINGER UP GOES**: AWAY when the camera is at or above the gizmo's height,
 * TOWARD when below. `toAnchor` is the camera → the gizmo's anchor; only its height is read.
 * ⭐⭐ `D146` (the owner, 2026-09-29: *"Camera position after zoom shall not change direction of
 * translation during drag."*): the caller asks this ONCE, at the press, and keeps the answer for the
 * grip's lifetime — a zoom slides the camera along its view line, changing its HEIGHT, and read every
 * step it could flip a drag half-way. ⚠ The latch also holds when the second finger lifts the body
 * across the camera's height mid-drag.
 */
export function awaySignFrom(toAnchor: Vec3): AwaySign {
  return finite(toAnchor[1]) <= 0 ? 1 : -1;
}

/**
 * ⭐⭐ **IS THE BODY'S HORIZONTAL PLANE EDGE-ON TO THIS CAMERA?** — the one definition, read by
 * `axisTravel` to choose its branch AND by the HUD every frame (`D134`). `|det|` is the area the x
 * and depth axes' screen shadows span — `sin(pitch)` for a pair of horizontal axes — and the plane
 * is edge-on when that is within `sin(coneDeg)`. ⛔ A property of the CAMERA, not of a drag: the
 * readout used to be written only by a translating finger, so a click or an orbit left the last
 * drag's answer on the glass. `false` for a camera with no basis.
 */
export function planeEdgeOn(camera: CameraScreenAxes, axes: ObjectAxes, coneDeg: number): boolean {
  const sx = screenShadow(axes.x, camera);
  const sd = screenShadow(axes.depth, camera);
  if (!sx || !sd) return false;
  const coneSin = Math.sin(Math.max(0, finite(coneDeg)) * (Math.PI / 180));
  return !(Math.abs(sx[0] * sd[1] - sx[1] * sd[0]) > coneSin);
}

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
 * @param axes ⭐ `D145`: the LIVE camera's gravity frame (`axesFromFrame`) — x the screen's right
 *   and depth the view, both flattened; gravity the world vertical.
 * @param view `awaySign` — `awaySignFrom`'s answer, LATCHED at the grip's press (`D146`): the sign of
 *   the holder's `dy`, so a zoom mid-drag cannot flip it.
 */
export function axisTravel(
  input: AxisInputsPx,
  camera: CameraScreenAxes,
  axes: ObjectAxes,
  metresPerPx: number,
  holderGain: number,
  secondGain: number,
  coneDeg: number,
  view: { readonly awaySign: AwaySign },
): AxisTravel {
  const sx = screenShadow(axes.x, camera);
  const sd = screenShadow(axes.depth, camera);
  const sg = screenShadow(axes.gravity, camera);
  // ⛔ A camera with no basis moves nothing, rather than moving by NaN. One NaN written into a
  // placement is permanent — it never washes out of a position.
  if (!sx || !sd || !sg || !Number.isFinite(metresPerPx)) {
    return {
      xM: 0,
      gravityM: 0,
      depthM: 0,
      edgeOn: false,
      trackGain: 0,
      driven: [false, false, false],
    };
  }
  const dx = finite(input.holderDxPx) * metresPerPx;
  const dy = finite(input.holderDyPx) * metresPerPx;
  const dy2 = finite(input.secondDyPx) * metresPerPx;
  // ⭐⭐⭐ **THE CHANNEL MAP, STATED ONCE AND READ TWICE.** `dx` drives x, the holder's `dy` drives
  // depth, and the second touchpoint's `dy` drives gravity (`D75`). ⛔ The gizmo asks THIS rather
  // than inspecting the travel.
  // ⭐⭐ `D145`: *"Red and blue axis are displayed as soon as one or two of the two dx or dy inputs are
  // above the deadband (both axis display even if there is only one input)"* — so the holder lights
  // x AND depth together. ⚠ `dx`/`dy` are already §1.1's deadbanded travel: non-zero IS *above*.
  const holder = dx !== 0 || dy !== 0;
  const driven: readonly [boolean, boolean, boolean] = [holder, dy2 !== 0, holder];
  const coneSin = Math.sin(Math.max(0, finite(coneDeg)) * (Math.PI / 180));

  /** Exact tracking along ONE axis: the travel that keeps the body under the finger. */
  const along = (
    s: readonly [number, number],
    mx: number,
    my: number,
  ): number | null => {
    const len = Math.hypot(s[0], s[1]);
    if (!(len > coneSin) || !(len > 0)) return null;
    // ⭐ `(m · ŝ) / |s|` — project onto the axis's screen LINE, then undo the foreshortening.
    // ⛔ The division is the whole of report 2's fix, and it is what Blender's ray/line
    // intersection amounts to for a straight drag.
    return (mx * s[0] + my * s[1]) / (len * len);
  };

  // ⭐⭐⭐ `D145` — **THE SIGN OF THE HOLDER'S `dy`, FROM HEIGHTS.** Finger up (`dy < 0`) is AWAY —
  // `+depth`, the view flattened, which points away from the camera — when the camera is at or above
  // the gizmo's height, and TOWARD it when below. ⛔ It replaces `D127`/`D132`'s *which end of blue
  // is away* (an answer for BOOT axes, which no longer exist) and the view-pitch sign the screen
  // shadow carried outside the cone: the two disagreed for a body above eye level while the camera
  // looked down, and the owner's rule is the perspective-correct one. ⭐ `D146`: latched at the press.
  const awaySign = view.awaySign === -1 ? -1 : 1;

  // ⭐ x lies across the glass (no camera roll), so its shadow is `[1, 0]` and `along` is the finger's
  // `dx` itself — exact tracking, *"translation sense follows dx sense"*. ⚠ Degenerate only for a
  // camera with no basis, answered above.
  const xM = (along(sx, dx, 0) ?? 0) * holderGain;

  // ⭐⭐ depth: tracked outside the cone — `1 / |shadow|`, the leverage `D76` asked for — and the
  // judged fixed rate inside it, where the shadow vanishes (a level camera; `Scene_1` boots there).
  // ⭐ The test is `planeEdgeOn`'s, so the HUD's `⛔EDGE-ON` and this branch cannot disagree.
  // ⚠ The cost is unchanged: a step in world speed at the cone's edge, capped at `1/sin(cone)`.
  const edgeOn = planeEdgeOn(camera, axes, coneDeg);
  const shadow = Math.hypot(sd[0], sd[1]);
  const rate = edgeOn || !(shadow > 0) ? 1 : 1 / shadow;
  const depthM = -dy * awaySign * rate * holderGain;

  // ⭐ Gravity, always its own channel and always tracking exactly. ⚠ Its shadow shrinks as the
  // camera looks down and vanishes at the pole, which the orbit rings make unreachable — the
  // fallback is there because *unreachable* is a property of today's camera, not of the rule.
  const g = along(sg, 0, dy2);
  const gravityM = g === null ? -dy2 * secondGain : g * secondGain;

  const asked = Math.hypot(dx, dy);
  return {
    driven,
    xM,
    depthM,
    gravityM,
    edgeOn,
    // ⭐ What one pixel bought, as a multiple of the tracking factor: 1 is under the finger.
    trackGain: asked > 0 ? Math.hypot(xM, depthM) / asked : 0,
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
    axes.x[0] * travel.xM +
      axes.gravity[0] * travel.gravityM +
      axes.depth[0] * travel.depthM,
    axes.x[1] * travel.xM +
      axes.gravity[1] * travel.gravityM +
      axes.depth[1] * travel.depthM,
    axes.x[2] * travel.xM +
      axes.gravity[2] * travel.gravityM +
      axes.depth[2] * travel.depthM,
  ];
}

/**
 * ⭐⭐⭐ **WHICH BODY CARRIES THE GIZMO — EXACTLY ONE, EVER.**
 *
 * > *"the gizmo shall not be applied to a second object (pioneer object for example) as this
 * > confuses the reading on the screen"* — the owner, 2026-09-23
 *
 * ⛔⛔ **THE GIZMO IS SIX FULL-SCREEN LINES**, and two sets of them cross each other everywhere.
 * ⚠ That is why this is not a matter of taste: a second gizmo does not add information, it
 * removes it, because no line can then be read back to the body it belongs to.
 *
 * ⭐⭐ **THE DRIVEN ONE WINS.** Two fingers can hold two bodies — a held part and the Pioneer it
 * is being aligned to — and only one of them is being pushed at a time. ⛔ Preferring the driven
 * candidate means the gizmo follows the GESTURE rather than the press order, so picking up a
 * second body to steady it never takes the instrument away from the one under the moving finger.
 * ⚠ With none driven (every finger resting), the FIRST candidate keeps it — press order, so a
 * pause does not hand the gizmo about between fingers that are both still.
 *
 * @param candidates every body eligible for a gizmo this frame, in press order.
 * @returns the one body to draw it on, or `null` when there are none.
 */
export function soleGizmoBody<T>(
  candidates: readonly { readonly id: T; readonly driven: boolean }[],
): T | null {
  const driving = candidates.find((c) => c.driven);
  if (driving) return driving.id;
  return candidates.length > 0 ? candidates[0]!.id : null;
}

/**
 * ⭐⭐⭐ **WHICH AXES THE GIZMO SHOWS — the ones this delta position actually translates along.**
 *
 * > *"the direction is shown only if the delta position triggers a translation in this direction.
 * > Therefore, for example, for a pure translation in the gravity axis only the green line would
 * > show. For a translation in the horizontal plane, both blue and red lines would show but not
 * > the green line."* — the owner, 2026-09-23
 *
 * > *"on first touch, if there is only dx or only dy, the other gizmo line should not appear.
 * > Both red and blue gizmo lines should appear only if both dx and dy are not null."* — the
 * > owner, clarifying it the same day
 *
 * ⛔ The gizmo used to draw all three axes always, so it said *"here is the basis"* when the
 * question a hand is asking is *"where will this push go"*. ⭐ Now it answers the second.
 *
 * ⛔⛔⛔ **AND THAT CLARIFICATION IS WHY THIS READS THE *INPUT* AND NOT THE TRAVEL.** Under
 * `PLANE` a pure `dx` produces travel on **both** horizontal axes — that is exactly how the 2×2
 * solve keeps the body under the finger — so a rule reading the OUTPUT lights both lines for a
 * single-axis drag, which is what the owner rejected. ⭐ Read from the channel that was pushed,
 * the answer is the one a hand can act on: *this finger is driving that line.*
 *
 * ⚠⚠ **AND A PAUSE MUST NOT BLANK IT.** A finger that stops emits nothing, and `A11`'s deadband
 * emits nothing on an axis inside its band — so the instantaneous answer is *no axes at all* many
 * frames per second. ⛔ A gizmo that blinked out whenever the hand paused would be unreadable,
 * which is the same argument `lastTravelDir` already carries. ⭐ So the last NON-EMPTY answer
 * stands until the body is translated again.
 *
 * ⭐⭐ **THE LAST THREE CHANNELS ARE ROTATIONS** — the owner, 2026-09-23: *"add a grey axis to the
 * gizmo to show the rotation axis when there is rotation with the second touch dx"*, then *"create
 * purple and marron axis for yaw and pitch rotation on unaligned object in rotation mode."* ⛔ They
 * are channels like the first three, so they obey the same rule: one lights when it is driven, and
 * a new non-empty set replaces the old one. ⚠ That is why a translation puts the turn lines away
 * by itself, and a turn puts the translation lines away — nothing had to be written for either.
 *
 * @param previous what is showing now, or `null` before the body has ever been driven.
 * @param driven which channels pushed — `AxisTravel.driven`, computed where the channel map is
 *   applied so that the map has ONE home.
 * @returns the triple `[x, gravity, depth]`, or `previous` when nothing was pushed — which is
 *   `null` only until the first push, where showing nothing is correct.
 */
export function displayedAxes(
  previous: GizmoChannels | null,
  driven: GizmoChannels,
): GizmoChannels | null {
  return driven.some((d) => d) ? driven : previous;
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
