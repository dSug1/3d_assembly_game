/**
 * THE DRIVE — where a translation or a depth step lands on a body. ⛔ `applyWorldStep` is the ONE place a translation lands (`D102` forwards a seated member's to its root).
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { rollDragDeg, secondFingerDrive, depthLimits, flatTwistAngle, rollSignFor, rotateAboutAxis, trackingMetresPerPx, screenRollRotation, MotionTracker, type Sample } from "../input";
import { type Vec3, IDENTITY } from "../core/vec";
import { incrementRadians } from "../input/rotation_increment";
import { rotationChannel } from "../core/constraint_stack";
import { bothAxesSecondDrive } from "../input/second_touch_drive";
import { axesFromFrame } from "../input/object_axes";
import { axisDisplacement, axisTravel, clampDepthRange } from "../input/axis_translate";
import { TURN_ROLL, type Held, type SceneState } from "./scene_state";
import { asVec3, modelOrientation, requirePose, setModelOrientation, setModelPose } from "./bodies";
import { driveBodyOf } from "./alignment_wiring";
import { axesOf, noteAxisTravel, noteTurnAxis, rotationFrameOf } from "./gizmo";
import { screenFrame } from "./camera_rig";
import { noteSpin, nudgeOthersWorld } from "./sway_pass";

// ⛔ History: `A6` (depth by a common vertical drag) and `A10` (the anchor drives depth) stood
// here; both are superseded by the object axes (`D75`) — the holder's `dy` drives the body's
// DEPTH axis and the second touchpoint's `dy` its GRAVITY axis. ⚠ `gainTranslateDepth` keeps its
// name (*the second finger's translate gain*): renaming a number a hand has tuned is how a
// device session loses its baseline. ⛔ `depthTranslate` is deleted (`D109`).
/**
 * ⭐⭐⭐ **APPLY A WORLD TRANSLATION STEP — the ONE place a translation lands on a body.**
 *
 * ⭐⭐ Every channel (the holder's and the second touchpoint's) goes through here, so applying a
 * step and its bookkeeping — the seat redirect, the depth clamp — cannot drift apart. ⚠ It was
 * made one function after a 2026-09-23 report where the second touchpoint's channel skipped the
 * (since deleted, `D120`) approach swing's travel record — *one fact, two writers, one forgot*.
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
    st.cfg.axisTrackingConeDeg,
    grip.frame,
  );
  // ⭐ The gizmo hears this finger exactly as it hears the holder's — same function, same frame.
  noteAxisTravel(st, gid, travel);
  // ⭐ ONE writer — the same `applyWorldStep` as the holder's channel.
  applyWorldStep(st, grip, axisDisplacement(travel, axes));
}


// ⛔⛔ **THE OLD DEPTH RULE STOOD HERE UNTIL 2026-09-22.** `depthTranslate` moved the body
// along `GravityFrame.depth` with an `awaySign` of its own; the second touchpoint now drives
// the body's GRAVITY axis instead, and the projection supplies that sign. ⛔ `depthTranslate`
// itself is deleted (`D109`).

/**
 * ⭐⭐ IS A SECOND TOUCHPOINT DOWN FOR THIS GRIP? — for the HUD's mode readout.
 *
 * ⛔ Presence, re-read every frame — never latched. ⚠ A touchpoint on a DIFFERENT body is
 * routed `OUTSIDE` since `D124` (it steers), so it counts here too.
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
 * ⭐ `D59` — is the body this grip carries an **aligned Follower**? ⛔ The alignment index is
 * the one record of that.
 */
export function gripIsAlignedFollower(st: SceneState, grip: Held) : boolean {
  const id = st.idOf.get(grip.mesh);
  return id !== undefined && st.links.pioneerFor(id) !== null;
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

  // ⭐⭐⭐ A12 + A16 — the second finger drives **roll** by its x and/or **translation** by its y.
  // ⚠ `bothAxes` (an aligned Follower, `D59`/`D108`; a free body in `TRANSLATE`, `D123`) gives it
  // both at once, kept independent by A11's per-axis bands; otherwise the MODE picks one
  // (`secondFingerDrive`). ⛔ The travel is the DEADBANDED travel, exactly as rule 6 and 2bis
  // take the holder's.
  // ⛔ The live mode is handed over so the choice is made inside the vectored rule, not
  // here — `D23`: breaking a decision left in `scene.ts` reddens nothing.
  const drive = bothAxes
    ? bothAxesSecondDrive(tracker.axes, tracker.step)
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
    } else if (rollChannel.kind === "TWIST" || bothAxes) {
      // ⭐⭐ `D123`: a FREE body driven on both axes spins about GRAVITY — the world vertical — by the
      // same chart, sign and gain as an aligned body spins about its normal.
      const axis =
        rollChannel.kind === "TWIST" ? rollChannel.axis : rotationFrameOf(st, grip.frame).up;
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
      // while `constrainedRollAngle` (deleted since, `D109`) mapped a screen roll through
      // `sign(axis·view)`. ⚠ A
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
      // ⛔⛔ AND THE ROLL CHART (`constrainedRollAngle`, deleted `D109`) WAS NO FALLBACK: an axis
      // horizontal on screen is **square to the view**, where that chart returned `null` too.
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
        // ⛔⛔ **AND *WHICH* GRAVITY FRAME IS `rotationFrameOf`'s ANSWER** — the boot camera's
        // (`WorldAxisB`, the only frame since `D109`). ⚠ Taken ONCE and handed to all three readers
        // below (the grey line, the turn, the tally), because two of them restate the other's axis
        // and sign.
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
  // object, which is a tap's exact shape — and a DOUBLE_TAP on a body is the undo (`D111`).
  // See `Recognizer.consumeAsMotion`.
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
