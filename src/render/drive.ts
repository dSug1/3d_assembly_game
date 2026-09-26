/**
 * THE DRIVE — where a translation or a depth step lands on a body. ⛔ `applyWorldStep` is the ONE place a translation lands (`D102` forwards a seated member's to its root).
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { rollDragDeg, secondFingerDrive, depthLimits, flatTwistAngle, rollSignFor, rotateAboutAxis, trackingMetresPerPx, screenRollRotation, MotionTracker, type Sample } from "../input";
import { type Vec3 } from "../core/vec";
import { type ObjectId } from "../core/object_model";
import { incrementRadians } from "../input/rotation_increment";
import { rotationChannel } from "../core/constraint_stack";
import { IDENTITY, dot } from "../core/vec";
import { pinnedPair, pinnedSecondDrive, secondTouchDrive } from "../input/pinned_pioneer";
import { axesFromFrame } from "../input/object_axes";
import { axisDisplacement, axisTravel, clampDepthRange } from "../input/axis_translate";
import { secondTouchAlwaysAvailable } from "../input/mouse_second_touch";
import { TURN_ROLL, type Held, type SceneState } from "./scene_state";
import { asVec3, modelOrientation, requirePose, setModelOrientation, setModelPose } from "./bodies";
import { driveBodyOf } from "./alignment_wiring";
import { axesOf, noteAxisTravel, noteTurnAxis, rotationFrameOf } from "./gizmo";
import { screenFrame } from "./camera_rig";
import { noteSpin, nudgeOthersWorld } from "./sway_pass";

/**
 * ⭐⭐ AMENDMENT A6 — DEPTH TRANSLATION BY A COMMON VERTICAL DRAG.
 *
 * One touchpoint on the object, one touchpoint beside it, and **both travelling in y by
 * the same amount** — the object goes deeper into the scene or comes back.
 *
 * ⛔⛔ IT SHARES A CONFIGURATION WITH RULE 6, so the discriminator is the whole design:
 * **common mode is depth, differential mode is rule 6.** The anchor sitting still is what
 * makes a gesture rule 6; both fingers travelling together is what makes it A6.
 *
 * ⭐ A6 replaced A5's pinch because a hand found the hole: two fingers will not fit on a
 * SMALL object, and pushing a part away shrinks it — so the pinch destroyed its own
 * affordance as it succeeded. The anchor can now be anywhere.
 */
/**
 * Move the held object in depth by ONE touchpoint's share of this frame's travel.
 *
 * ⛔⛔ HALF, AND THAT IS ARITHMETIC RATHER THAN CAUTION. The common travel is the AVERAGE
 * of the two fingers', and each finger delivers its own move event — so applying half of
 * each event's delta sums to exactly the common travel. Applying the whole of each would
 * move the object TWICE as far as the hand asked.
 */
/**
 * Move the held object in depth by the DRIVER's own travel.
 *
 * ⛔⛔ THE DRIVER IS THE FINGER TOUCHING THE OBJECT, AND IT SUPPLIES ALL THE MOTION. The
 * second finger contributes none — it authorises the depth reading by following. ⚠ Three
 * earlier versions of this blended the two fingers' travel (a mean, a minimum, a faded
 * mean) and a hand felt every one of them: a blend has seams.
 */
/**
 * ⭐⭐⭐ **THE SECOND TOUCHPOINT'S `dy` NOW DRIVES THE BODY'S *GRAVITY* AXIS** (the owner,
 * 2026-09-22) — it drove the depth axis until then, and the holder's own `dy` has taken
 * that over. ⛔ The channel moved; the plumbing did not. `secondFingerDrive` still decides
 * WHETHER this finger is translating, `gainTranslateDepth` is still the gain, and the name
 * of that tunable is deliberately unchanged: it is *the second finger's translate gain*,
 * and renaming a number a hand has tuned is how a device session loses its baseline.
 *
 * ⚠⚠ **`depthTranslate` IS NOT CALLED ANY MORE**, and it is declared as such in
 * `tests/unwired_debt.test.ts` rather than deleted: six models and five device passes are
 * behind it, and rule 5 has not judged the remap that replaced it.
 */
/**
 * ⭐⭐⭐ **APPLY A WORLD TRANSLATION STEP — the ONE place a translation lands on a body.**
 *
 * ⛔⛔⛔ **DEVICE-REPORTED, 2026-09-23**: *"the swing of camera [is] missing at offset radius
 * zone enter sometimes when the follower approaches the pioneer from the gravity axis
 * direction."* ⚠ The swing takes its direction from `frameTravel*`, and **only the holder's
 * branch fed it** — the second touchpoint's channel, which is the GRAVITY axis, applied its
 * displacement and recorded nothing. ⭐ So an approach along gravity armed with
 * `swingSignFor(0, 0)`, which is `null`, and the swing never started. *"Sometimes"* is exactly
 * the frames where the holder happened to be moving too.
 *
 * ⭐⭐ **IT IS THE `D68` SHAPE IN ANOTHER FILE: one fact, two writers, one of which forgot.**
 * ⛔ So the fix is not the missing line — it is that applying a step and recording what it did
 * are now the same function, and a third channel cannot be added without both.
 */
export function applyWorldStep(st: SceneState, grip: Held, step: Vec3) : void {
  // ⛔⛔ `D100`: a SEATED or SNAPPING Follower is not translated by its own finger — it sits on
  // its Pioneer's cursor and moves with the Pioneer. ⚠ Reported, never silent: this is the
  // *nothing visibly happened* failure a hand cannot diagnose from outside.
  const seatedId = st.idOf.get(grip.mesh);
  // ⭐⭐⭐ **A TRANSLATION OF A SEATED MEMBER MOVES ITS ASSEMBLY** (`D102`, re-homed here on
  // 2026-09-26): the step lands on the ROOT `assemblyRoot` names, and the tree carries the member.
  // ⛔ A member whose root is itself (its Pioneer is frozen, or it is still snapping) is refused,
  // reported — it is fixed to the plate, or still on its way to the cursor.
  const rootId = seatedId === undefined ? undefined : driveBodyOf(st, seatedId);
  const targetMesh =
    rootId === undefined || rootId === seatedId
      ? grip.mesh
      : (st.meshOf.get(rootId) ?? grip.mesh);
  if (
    seatedId !== undefined &&
    targetMesh === grip.mesh &&
    (st.links.isSeated(seatedId) || st.seatSnaps.has(seatedId))
  ) {
    st.lastVerdict = `snap: ${seatedId} is seated — move its Pioneer, or unsnap`;
    return;
  }
  // ⚠ The LeadingFace ray is NOT aimed from here any more — it follows what the channels asked
  // for (`frameAskedM`), which has no lag, rather than what the body did. See `noteAxisTravel`.
  // ⚠ The swing reads SCREEN travel (*"opposite to the dx movement"*), so the applied
  // displacement is projected back onto the gravity frame rather than recomputed from a pointer
  // delta that `A11`'s deadband may have swallowed. ⛔⛔ ACCUMULATED, NOT LATCHED:
  // `refreshHighlight` zeroes it every frame, so the arming edge reads only the travel that
  // crossed the threshold.
  st.frameTravelRightM += dot(step, grip.frame.right);
  st.frameTravelUpM += dot(step, grip.frame.up);
  // ⛔⛔ **AND THE ALONG-VIEW COMPONENT.** `right` and `up` span the SCREEN, so a body pushed
  // along the gravity frame's own depth leaves no trace in either — which is what the holder's
  // `dy` does at a LEVEL camera, where its plane is edge-on and the judged fixed rate drives.
  // ⚠ Without it the swing has no direction to find there, however long it waits.
  st.frameTravelDepthM += dot(step, grip.frame.depth);
  const mp = requirePose(st, targetMesh);
  // ⛔⛔ THE DEPTH RANGE STILL BINDS — `A5`'s derived bounds: twice the near plane, and the
  // camera's own maximum orbit radius. A body through the near plane renders *a black page with
  // no error at all*, and one past the ceiling cannot be brought back by any zoom.
  const limits = depthLimits(st.cfg);
  setModelPose(st, targetMesh, {
    position: clampDepthRange(
      asVec3(st.camera.position),
      [
        mp.position[0] + step[0],
        mp.position[1] + step[1],
        mp.position[2] + step[2],
      ],
      grip.frame.depth,
      limits.minM,
      limits.maxM,
    ),
    orientation: mp.orientation,
  });
}

export function applyDepthStep(st: SceneState, grip: Held, dyPx: number) : void {
  const gid = st.idOf.get(grip.mesh);
  const axes =
    gid === undefined
      ? (st.bootObjectAxes ?? axesFromFrame(grip.frame))
      : axesOf(st);
  const travel = axisTravel(
    { holderDxPx: 0, holderDyPx: 0, secondDyPx: dyPx },
    screenFrame(st),
    axes,
    // ⭐ RULE 6's COMPUTED FACTOR, redirected: a given finger travel moves the object as far
    // along this axis as it would move it across the screen.
    trackingMetresPerPx(st.camera.radius, st.camera.fov, st.canvas.clientHeight),
    st.cfg.gainTranslateScreen,
    st.cfg.gainTranslateDepth,
    st.cfg.translatePairing === 1 ? "PLANE" : "CHANNELS",
    st.cfg.axisTrackingConeDeg,
    grip.frame.towardGravity,
  );
  // ⭐ The gizmo hears this finger exactly as it hears the holder's — same function, same frame.
  noteAxisTravel(st, gid, travel);
  // ⭐ ONE writer, so this channel now feeds the swing exactly as the holder's does.
  applyWorldStep(st, grip, axisDisplacement(travel, axes));
}


// ⛔⛔ **THE OLD DEPTH RULE STOOD HERE UNTIL 2026-09-22.** `depthTranslate` moved the body
// along `GravityFrame.depth` with an `awaySign` of its own; the second touchpoint now drives
// the body's GRAVITY axis instead, and the projection supplies that sign. ⭐ Deleted from the
// call path rather than parked here: *a dormant fork is a trap* (`D28`), and the module itself
// survives with its vectors, declared in `tests/unwired_debt.test.ts` until rule 5 judges the
// remap that replaced it.

/**
 * Feed the gate and, if this is a common drag, move the object. ⭐ Called from BOTH
 * touchpoints' move handlers — the anchor has no recognizer, so without its own call its
 * travel would be invisible and the gesture would work only while the object finger moved.
 *
 * @returns true when A6 owns this object right now, so the caller skips its own rule.
 */
/**
 * ⭐⭐ AMENDMENT A10 — the ANCHOR drives depth, while the finger on the object is STILL.
 *
 * ⛔⛔ THE GATE IS THE HOLDER'S MOTION STATE AND NOTHING ELSE. No window, no ratio, no
 * tolerance: A6 had all three and the owner rejected the result on the glass, because
 * *"are these two travels equal?"* has no answer at a reversal or at a late start, and
 * both happen in every gesture.
 *
 * @param anchor  the touchpoint OUTSIDE every object — the one supplying the motion.
 * @param anchorDyPx its travel THIS FRAME.
 * @returns whether depth consumed the event, so the caller stops.
 */
/**
 * ⭐⭐ THE SECOND TOUCHPOINT AND ITS LIVE MOTION STATE, for A13's mode choice.
 *
 * ⛔ Presence and state, re-read every frame — never latched. ⚠ `null` state means the
 * finger has gone down and NEVER MOVED, so it has no tracker yet: the strongest form of
 * idle there is, not a missing answer.
 * ⚠ A touchpoint on a DIFFERENT object is deliberately not one of these — that is §4
 * rule 5 / 6bis / 6ter's configuration and must stay reachable.
 */
export function secondFingerOf(st: SceneState, grip: Held) : { present: boolean } {
  for (const q of st.router.all()) {
    const isSecond =
      q.role === "OUTSIDE" || (q.role === "SECOND" && q.object === grip.mesh);
    if (!isSecond) continue;
    return { present: true };
  }
  return { present: false };
}


/**
 * ⛔ Forget a released touchpoint's motion tracker, everywhere.
 *
 * ⚠ Keyed by `seq`, so a reused pointer id can no longer inherit it — this is belt to
 * that structural brace, and it is what stops the map growing for the life of a gesture.
 */
export function forgetAnchor(st: SceneState, seq: number) : void {
  for (const grip of st.held.values()) {
    grip.anchorMotion.delete(seq);
    grip.anchorRollSign.delete(seq);
  }
}


/**
 * @param bothAxes ⭐⭐ `D51`'s PINNED PIONEER: the driving finger gives roll AND depth at
 *   once, instead of the movement mode picking one. ⛔ Reachable only from the pinned
 *   configuration — two touchpoints on a Pioneer and its Follower, with the flag off.
 *   ⚠ The owner named the difference from `A16` himself; `pinned_pioneer.ts` argues it.
 */
/**
 * ⭐⭐⭐ **`D51` — ARE THE TWO HELD BODIES A PIONEER AND ITS FOLLOWER, WITH THE FLAG OFF?**
 *
 * ⛔ `null` whenever the flag is on, so the default path is byte-for-byte what it was and a
 * device close of the old behaviour still means something.
 * ⚠ Press order is irrelevant — the hand chooses which body to align, not which to grab
 * first — so the rule asks the alignment index both ways.
 */
export function pinnedNow(st: SceneState) : { follower: ObjectId; pioneer: ObjectId } | null {
  if (st.cfg.pioneerTranslates !== 0) return null;
  const ids: ObjectId[] = [];
  for (const q of st.router.objects()) {
    const g = st.held.get(q.id);
    const id = g === undefined ? undefined : st.idOf.get(g.mesh);
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  }
  return pinnedPair(ids, (f) => st.links.pioneerFor(f)?.objectId ?? null);
}


/**
 * ⭐ `D59` — is the body this grip carries an **aligned Follower**? ⛔ The alignment index is
 * the one record of that; `alignModeOf` says what an alignment MEANS, never whether one exists.
 */
export function gripIsAlignedFollower(st: SceneState, grip: Held) : boolean {
  const id = st.idOf.get(grip.mesh);
  return id !== undefined && st.links.pioneerFor(id) !== null;
}


/**
 * ⭐⭐⭐ `D59`/`D60` — **is a second touchpoint currently owning this body's roll AND depth?**
 *
 * ⛔ ONE HELPER, READ BY BOTH HALVES OF THE RULE: it decides what that second finger drives
 * (`D59`) and, because of that, what the FIRST touch does (`D60`). ⚠ Two copies of this
 * question would be free to disagree, and the pair would then either fight over one DOF or
 * leave one unreachable — with nothing to catch it.
 *
 * ⚠ `router.outside()` is the OUTSIDE case only. The Pioneer case needs no test here: two
 * held objects already translate on a drag by `translatesOnDrag`'s own first line, which is
 * exactly why the owner saw the wanted behaviour there and nowhere else.
 */
// ⭐⭐ A MOUSE HOLDER'S SECOND TOUCH IS ALWAYS AVAILABLE (`secondTouchAlwaysAvailable`, the
// owner 2026-09-25): an aligned body under the left button translates at once, whatever the mode,
// exactly as it does on the glass once a second finger is down. ⛔ The desktop fact lives in the
// desktop module; this rule only reads it.
export function secondTouchOwnsRollAndDepth(st: SceneState, grip: Held) : boolean {
return (st.router.outside().length >= 1 || secondTouchAlwaysAvailable(grip.pointerType)) &&
  secondTouchDrive("OUTSIDE", gripIsAlignedFollower(st, grip)) === "BOTH";
}

export function gripOfObject(st: SceneState, id: ObjectId) : Held | undefined {
  for (const g of st.held.values()) if (st.idOf.get(g.mesh) === id) return g;
  return undefined;
}

export function applyDepthDrag(st: SceneState, grip: Held,
  anchorSeq: number,
  anchorSample: Sample,
  bothAxes = false,) {
  // ⭐ The anchor gets a tracker of its own — the SAME §1.1 machine every other rule
  // reads, never a speed invented here. A second definition of "moving" would be free
  // to disagree with the one the holder is judged by.
  // ⛔ Keyed by PRESS ORDER, never by pointer id. See `Held.anchorMotion`.
  let tracker = grip.anchorMotion.get(anchorSeq);
  if (!tracker) {
    tracker = new MotionTracker(st.cfg);
    grip.anchorMotion.set(anchorSeq, tracker);
  }
  // ⭐⭐ ASK THE CLOCK RIGHT HERE TOO, not only in the render loop. This is the one
  // moment the holder's stillness actually decides something, and an anchor event can
  // arrive between frames — or after a dropped one. ⛔ Belt and braces on the exact
  // defect that made this gesture *"sometimes blocked"*.
  grip.rec.tick(anchorSample.t);
  tracker.push(anchorSample);

  // ⭐⭐⭐ A12 + A16 — the second finger drives ONE of two rules: **roll** by its x or
  // **depth** by its y, and the MODE picks which. ⚠ A12 gave it both at once, kept
  // independent by A11's per-axis bands; A16 narrowed it to one, and with the forks gone
  // (`D28`) that narrowing is all there is. ⛔ The travel is the DEADBANDED travel, exactly
  // as rule 6 and 2bis take the holder's.
  // ⛔ The live mode is handed over so the choice is made inside the vectored rule, not
  // here — `D23`: breaking a decision left in `scene.ts` reddens nothing.
  const drive = bothAxes
    ? pinnedSecondDrive(tracker.axes, tracker.step)
    : secondFingerDrive(tracker.axes, tracker.step, st.behaviour);
  if (drive.rollDxPx === 0 && drive.depthDyPx === 0) return false;

  if (drive.depthDyPx !== 0) {
    applyDepthStep(st, grip, drive.depthDyPx);
    grip.mode = "TRANSLATE_2ND";
  }
  if (drive.rollDxPx !== 0) {
    // ⭐⭐ ROLL AS AN INCREMENT, about the gravity frame's horizontal depth axis (A7).
    // ⚠ No baseline, no commit threshold, no circle fit, no rebase — the jump those
    // produced is gone with them. A12 replaced the gesture rather than the arithmetic.
    //
    // ⭐⭐⭐ AND ON AN ANCHORED OBJECT IT IS `A3`'s **OTHER CHART** OVER THE SAME ONE DOF.
    // ⛔ A free roll would swing the anchored face straight off its target — revision 5
    // forbade roll on a constrained object for exactly that reason, and `D14` corrected it
    // by keeping the gesture and changing its AXIS: the twist goes about the constraint,
    // never about the view. ⭐ This is the chart that works where the drag degenerates
    // (camera looking along the axis), which is why `A12`'s channel split answers `A3`
    // without a handover constant — see the 2sexte block in the ROTATE branch.
    // ⚠ `constrainedRollAngle` returns `null` square to the axis, where a roll has no
    // component to give: nothing happens, and the drag chart is the one that works there.
    const rollId = st.idOf.get(grip.mesh);
    const rollStack =
      rollId === undefined
        ? []
        : (st.world.objects.get(rollId)?.constraints ?? []);
    // ⛔⛔ The same audit fix as the one-finger twist, at the second finger's channel: a
    // COUNT stood in for *"is this body aligned?"* and sent a mated body to free roll.
    const rollChannel = rotationChannel(rollStack);
    if (rollChannel.kind === "REFUSED") {
      // ⛔ Same as the one-finger twist: a refusal that fell through to the free roll below
      // would break the mate while the HUD reported that it had not.
      st.lastVerdict = `align: roll refused — ${rollChannel.why}`;
    } else if (rollChannel.kind === "TWIST") {
      const axis = rollChannel.axis;
      // ⭐ The grey line's axis, recorded where the turn is applied (the owner, 2026-09-23).
      noteTurnAxis(st, rollId, TURN_ROLL, axis);
      // ⭐⭐⭐ **`D52` — THE SECOND TOUCHPOINT ROLLS THE FOLLOWER THE SAME WAY THE FIRST
      // DOES.** Device-reported, 2026-09-18: *"the Follower object roll controlled by the
      // second touchpoint is inverted vs. the roll controlled by the first touchpoint … the
      // second should be the same as the first touchpoint roll."*
      //
      // ⛔⛔ **IT WAS NOT A SIGN, IT WAS A DIFFERENT CHART — measured before changing
      // anything.** The two channels agreed for some constraint axes and opposed for others:
      // `constrainedDragAngle` projects the finger's travel onto the **near-side direction**,
      // while `constrainedRollAngle` mapped a screen roll through `sign(axis·view)`. ⚠ A
      // blanket sign flip would have fixed the axes that opposed and broken the ones that
      // agreed — the trap this project names as *a sign is not tested by any amount of
      // testing the magnitude*, one level up: the two SIGNS were each defensible and their
      // COMPOSITION was never computed.
      //
      // ✅ So the second touchpoint now uses the **same chart**, with its own gain converted
      // to radians. Measured over two camera frames and six axes, both drag directions: every
      // case agrees, and two that the roll chart could not serve at all now do.
      // ⚠⚠ **WHAT IT COSTS — AND THE FIRST STATEMENT OF IT HERE WAS WRONG.** It said the
      // price was *"the axis square to the view"*. ⛔ Measured 2026-09-19, after the owner
      // reported *"for some PioneerFaces I lose the roll control of the Follower by the
      // second touch"*: that is not where this dies, and the real dead zone is far commoner.
      //
      // ⛔⛔⛔ **THE ROLL FADES WITH THE AXIS'S *SCREEN ORIENTATION*, NOT WITH ITS ANGLE TO
      // THE CAMERA.** The near side travels along `axis × (−view)`, which is **perpendicular
      // to the axis's screen projection** — so the direction the object wants the finger to
      // go SPINS as the alignment axis does. ⚠ This channel supplies `dx` only (`A16`: *its x
      // is roll, its y is depth*), so the authority is `dir.x`, and it falls off as a cosine:
      //
      //   axis VERTICAL on screen → near side moves horizontally → authority 1.00 (20°/10 mm)
      //   45°                     →                             → authority 0.71 (14°)
      //   axis HORIZONTAL          → near side moves VERTICALLY   → authority 0.00 (**dead**)
      //
      // ⭐ The first touchpoint never loses it, because it passes `dx` AND `dy` and can always
      // drag along the near-side direction whatever its screen orientation.
      // ⛔⛔ AND `constrainedRollAngle` IS NOT A FALLBACK HERE, which is worth stating so the
      // next session does not try it: an axis horizontal on screen is **square to the view**,
      // which is exactly where that chart returns `null` too. Both charts are dead in the
      // same configuration; only the missing `dy` could have served it.
      // ⭐⭐⭐ **`D57` — CONSTANT RATE. THE PROJECTION IS GONE, AS THE OWNER REQUIRED.**
      //
      // > *"for the second touchpoint on the Pioneer, the dx on the screen shall drive the
      // > roll of the Follower, the dy on the screen shall drive the depth translation of the
      // > Follower, whatever the orientation of the Pioneer-Follower duo. If there are cos or
      // > sin projections on axis based on orientation, remove those projections."*
      // > — the owner, 2026-09-19, answering the dead-control report
      //
      // ⛔⛔ **WHAT THE PROJECTION WAS DOING, AND WHY ONLY HALF OF IT COULD GO.** It carried
      // the RATE *and* the DIRECTION. The rate was the defect — `|dir.x|`, a cosine in the
      // axis's screen orientation, reaching **zero** for any alignment whose axis lies
      // horizontally across the glass. ✅ That is deleted: the rate is now flat.
      // ⚠ The direction has **no orientation-free definition**: a handedness must be relative
      // to something, and the constraint axis can point at the camera or away from it. A raw
      // `+dx` would therefore roll *opposite to the first touchpoint* for every alignment with
      // `dir.x < 0` — measured at **−1.000** for an axis vertical on screen, i.e. the common
      // case — which is `D52`'s device report returning.
      //
      // ⭐⭐ **SO THE SIGN IS TAKEN FROM THE GEOMETRY ONCE AND LATCHED FOR THE GESTURE.**
      // ⛔ Per frame it would flip mid-drag as the axis swung through horizontal-on-screen,
      // at full rate — trading a dead control for an unpredictable one. ⚠ At that crossing the
      // latched sign is arbitrary, and that is the honest residue of the owner's rule: there
      // is nothing there to be consistent WITH. It is at least **stable for the whole drag**.
      // ⛔ THE RULE IS IN `anchor_rotate.ts`, NOT HERE — `pioneer_cascade.ts`'s standing rule:
      // *a RULE in a render file is a rule nothing can interrogate.* ⚠ Only the LATCH is here,
      // because only this file knows when a gesture began.
      let rollSign = grip.anchorRollSign.get(anchorSeq);
      if (rollSign === undefined) {
        rollSign = rollSignFor(screenFrame(st), axis);
        grip.anchorRollSign.set(anchorSeq, rollSign);
      }
      // ⭐ `gainRollDrag` keeps its meaning exactly: degrees per millimetre of finger — which
      // is what it always claimed to be, and only now always is.
      const twist = flatTwistAngle(
        drive.rollDxPx,
        rollSign,
        (st.cfg.gainRollDrag * Math.PI) / 180,
      );
      // ⚠ NO `null` BRANCH ANY MORE, and that is the point: this channel had one because
      // the projection could fail, and `D57` removed the projection. ⛔ A `twist !== null`
      // guard left here would be a dead condition implying a refusal that cannot happen.
      {
        // ⛔⛔ **WITH INCREMENTS ON, THE POSE IS NOT WRITTEN HERE.** The demand is tallied and
        // the body is advanced a whole increment at a time in the render loop — which is what
        // stops it ever sitting between two and having to come back.
        if (
          incrementRadians(st.cfg.rotationIncrementDeg) !== null &&
          rollId !== undefined
        ) {
          st.rotationTally.add(rollId, "roll", axis, twist);
        } else {
          setModelOrientation(st, 
            grip.mesh,
            rotateAboutAxis(modelOrientation(st, grip.mesh), axis, twist),
          );
        }
        // ⛔⛔⛔ **AND IT RIDES THE SNAP — AUDIT FIX, 2026-09-17.** The one-finger twist has
        // composed onto both ends of a travelling snap since `D45`; this channel never did.
        // ⚠ So a roll made during the 129 ms snap was written to the model and then
        // **overwritten** by the slerp on the very next frame: the body landed on `to` and
        // the hand movement vanished. ⭐ Exactly the shape of the device report that bought
        // the ride-along in the first place (*"there is no slerp during rotation"*), one
        // channel over — a fix that landed on one path and not on its twin.
        // ⛔ `METHOD`: *when a rule has two channels, the correction belongs to the RULE.*
        if (rollId !== undefined) {
          st.alignSnaps.ride(rollId, rotateAboutAxis(IDENTITY, axis, twist));
        }
      }
    } else {
      // ⭐ `FREE`: no constraint at all, so the roll is the screen-plane one.
      // ⚠⚠ **THIS COMMENT USED TO SAY THERE WAS NO REFUSAL BRANCH**, on the argument that the
      // cap of one makes *"the stack is full"* unreachable. ⛔ That was true of two
      // ALIGNMENTS and said nothing about a **MATE**, which is the second entry `3D2` adds —
      // so the `else` silently covered a case nobody had considered. ⭐ `rotationChannel`
      // now names all three outcomes, and the refusal is the branch above.
      {
        // ⭐ A FREE body rolls about the gravity frame's own depth — `screenRollRotation`'s axis,
        // stated here so the grey line cannot disagree with the turn it describes.
        // ⛔⛔ **AND *WHICH* GRAVITY FRAME IS `worldAxisB`'s ANSWER SINCE 2026-09-23** — the boot
        // camera's while it is on. ⚠ Taken ONCE and handed to all three readers below (the grey
        // line, the turn, the tally), because two of them restate the other's axis and sign.
        const rollFrame = rotationFrameOf(st, grip.frame);
        noteTurnAxis(st, rollId, TURN_ROLL, rollFrame.depth);
        const rollDeg = rollDragDeg(drive.rollDxPx, st.cfg.gainRollDrag);
        const incOn =
          incrementRadians(st.cfg.rotationIncrementDeg) !== null &&
          rollId !== undefined;
        if (!incOn) {
          setModelOrientation(st, 
            grip.mesh,
            screenRollRotation(
              modelOrientation(st, grip.mesh),
              rollFrame,
              rollDeg,
            ),
          );
        }
        // ⚠ `screenRollRotation` turns by MINUS deg about `frame.depth`; the tally states the
        // SAME axis and sign, or the settle would correct a turn it had mis-measured.
        // ⛔ *A sign is not tested by any amount of testing the magnitude.*
        // ⚠ `screenRollRotation` turns by MINUS deg about `frame.depth`; the tally states the
        // SAME axis and sign, or the detents would be counted on a quantity the body is not
        // turning. ⛔ *A sign is not tested by any amount of testing the magnitude.*
        if (rollId !== undefined) {
          st.rotationTally.add(
            rollId,
            "roll",
            rollFrame.depth,
            (-rollDeg * Math.PI) / 180,
          );
        }
      }
    }
    grip.mode = "ROTATE";
    // ⭐ The rotational sway answers a driven roll too — same watcher, same tunables.
    noteSpin(st, grip, anchorSample.t);
  }
  // ⛔⛔ AND THE HOLDER'S GESTURE IS NO LONGER A TAP. It is being held STILL on the
  // object, which is a tap's exact shape — and a DOUBLE_TAP resolves to 2septies
  // eviction. See `Recognizer.consumeAsMotion`.
  grip.rec.consumeAsMotion();

  // ⛔⛔ THE DEPTH SWAY ANSWERS A **DEPTH** PUSH, NOT ANY DRIVE. A12 gave this function a
  // second job — roll on the anchor's x — and the sway below was left firing on either.
  // ⚠ It is fed the anchor's `y`, so a pure ROLL drag (x only, y still) would push the
  // other objects along `frame.depth` on the strength of a coordinate that is not moving.
  // ⭐ Harmless today only because a still `y` produces no kick; the guard makes it
  // correct rather than lucky. The ROTATIONAL sway already fires in the roll branch above.
  if (drive.depthDyPx === 0) return true;

  // ⭐ THE SCENE REACTS TO A PUSH TOO — the same sway, the same four tunables.
  // ⚠ SIGN: fingers moving UP (negative screen y) push the object AWAY, which is +push.
  const kick = grip.depthSway.push(
    { x: 0, y: anchorSample.y, t: anchorSample.t },
    true,
    true,
  );
  if (kick) {
    const push = grip.frame.depth;
    {
      const away = kick.dirY < 0 ? 1 : -1;
      nudgeOthersWorld(st, 
        grip.mesh,
        [push[0] * away, push[1] * away, push[2] * away],
        kick.speedMmPerS,
      );
    }
  }
  return true;
}
