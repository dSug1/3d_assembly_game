/**
 * THE POINTER HANDLER — every press, move and release, routed by `IN2` and dispatched to the rules. ⛔ The largest block of the old `scene.ts`, moved verbatim; it holds calls, not rules.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { elevationGainScale } from "../input/orbit";
import { quadTapsAllowed } from "../input/quad_gate";
import { orientTapShown, restingQuadPointer, shownDirection } from "./orient_cube";
import { pieceRespawnArmed, pieceTapAction } from "../input/piece_orbit_solver";
import { pieceRingRangeM, pieceSolveRuns, respawnStuckPiece } from "./green_box_wiring";
import { worldPlacementOf } from "../core/object_model";
import { hoverDragStep, hoverOrbitStep, hoverPressNote, hoverRelease } from "./hover_wiring";
import { pressSteers, pressHit } from "../input/frozen_pick";
import { bandMmNow } from "./empty_space_probe";
import { inEdgeBand } from "../input/edge_band";
import { GREEN_PIECE_ORBIT_ZOOM, orbitSlideDirection, orbitSwayDegAt, orbitSwayKinds, orbitSwingAxis, placedBarycentre, throughGreenBox } from "../input/green_box";
import { clampCameraRadiusM } from "../input/pinch";
import { EMPTY_PRESS_MOVES_TARGET, goalLocked, orbitTargetOnPress, orbitTargetOnRelease } from "../input/goal_lock";
import type { Sample } from "../input";
import { alignRestingFace, orbitTravelStep, greenDragGains, orbitDvPerMm, restOnTappedFace, restTargetKey, topPauseOn } from "./green_box_wiring";
import { pauseYawStep } from "../input/top_pause";
import { approachInput, approachRelease, assemblyOn, leavesCone } from "./assembly_wiring";
import { orbitDegPerMm } from "../input/follow_camera"; // ⏸ (2026-10-12) orbitRollStepRad, rollRestingFace — with the commented-out way in
import { restingFaceTap } from "../input/orbit_tap";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { isTapRelease, pairPressRevertsToggle, toggleBehaviour, tapTogglesMode, pressMeaning, outsideTapRelease, flatTwistAngle, rollSignFor, rotateAboutAxis, trackingMetresPerPx, SwayWatcher, SpinSwayWatcher, Recognizer, screenPlaneRotation, pitchSense, pressSideFrom, MotionTracker, swayScale, impulseForPeak } from "../input";
import { type Vec3, IDENTITY } from "../core/vec";
import { mmToPx } from "../core/units";
import { incrementRadians } from "../input/rotation_increment";
import { alignedFaceOf, faceFromPickedNormal } from "../core/face_pick";
import { rotationChannel } from "../core/constraint_stack";
import { frozenHoldAdmitted } from "../input/assembly";
import { translatesOnDrag } from "../input/highlight";
import { secondTouchDrive } from "../input/second_touch_drive";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { holdFirstPress, holdMove, holdRelease, holdSecondPress } from "./hold_wiring";
import { episodeCounts } from "../input/episode_ledger";
import { beginGesture, endGesture, gestureChangedSoFar, undoLast } from "./undo_wiring";
import { axisDisplacement, axisTravel } from "../input/axis_translate";
import { nextDxSign } from "../input/hold_pinch";
import { seatLockAllows } from "../input/seat_lock";
import { holdPinchStep } from "./hold_pinch_wiring";
import { TURN_PITCH, TURN_ROLL, TURN_YAW, type SceneState } from "./scene_state";
import { modelOrientation, poseOf, setModelOrientation } from "./bodies";
import { alignFollowerTo, isSeatedCouple, noteTap, releaseAlignmentOf } from "./alignment_wiring";
import { axesOf, gizmoClientX, noteAxisTravel, noteTurnAxis, rotationFrameOf } from "./gizmo";
import { applyCamera, pinchPair, recomputeOrbitCentre, requireGestureFrame, retargetGizmo, screenFrame, syncCentre, updatePinch } from "./camera_rig";
import { describe, sampleOf } from "./hud_paint";
import { noteSpin, nudgeOthers, nudgeOthersWorld, swingBlock } from "./sway_pass";
import { applyDepthDrag, applyWorldStep, forgetAnchor, gripIsAlignedFollower } from "./drive";
import { cursorPointer, feedUnsnap } from "./seat_wiring";
import { advanceCentreReturn, advancePieceAim, advancePieceEntry } from "../input/piece_orbit"; // ⏸ (2026-10-12) orbitRollSteps — with the commented-out way in

/** ⭐ `D182`: is this touchpoint half of an unsnap couple (so it drives nothing)? The rule is `UnsnapHold`'s. */
function unsnapHolds(st: SceneState, pointerId: number): boolean {
  return st.unsnapHold.holds(pointerId, (id) => st.router.all().some((p) => p.id === id));
}

export function installPointerHandler(st: SceneState): void {
  // ⭐⭐ `D111` — THE GESTURE'S FIRST DOWN, observed BEFORE every rule (`insertFirst`): the model is
  // snapshotted as it stands, so the undo's entry is the scene before anything this gesture did.
  st.scene.onPointerObservable.add(
    (info) => {
      if (info.type !== PointerEventTypes.POINTERDOWN) return;
      const e = info.event as PointerEvent;
      // ⭐ `D112`: the clock starts at the first press after boot (`SCORE.md` §6), not at load.
      if (st.sceneStartMs === null) st.sceneStartMs = performance.now();
      if (st.gestureSpan.press(e.pointerId)) {
        // ⭐⭐ `D159`: the latched HitFace that takes over a Space-frozen drag CONTINUES that gesture — no new
        // snapshot, and its hold is the drag's (`episodeContinued`). ⛔ Any other press ends a stale carry.
        if (st.freezeCarry && e.pointerId === MOUSE_SECOND_ID) st.episodeContinued.add(e.pointerId);
        else beginGesture(st);
        st.freezeCarry = false;
      }
    },
    undefined,
    true,
  );

  st.scene.onPointerObservable.add((info) => {
    const e = info.event as PointerEvent;
    const s = sampleOf(e);
    // ⭐⭐ (2026-10-28) Shift with the mouse (or a touchpad): around the assembly the drag's dy is the APPROACH (`approachInput`); the button's release
    // starts its coast
    st.orbitShift = e.pointerType === "mouse" && e.shiftKey;
    if (info.type === PointerEventTypes.POINTERUP && e.pointerType === "mouse" && assemblyOn(st)) approachRelease(st);

    // ⭐ The noise meter runs BEFORE the recognizer and independently of it: it must
    // see the raw stream whatever rule the touchpoint turns out to belong to, and it
    // must not be able to change what that rule does.
    if (info.type === PointerEventTypes.POINTERDOWN && st.noisePointer === null) {
      st.noisePointer = e.pointerId;
      st.noise.reset();
    }
    if (e.pointerId === st.noisePointer) {
      // ⚠ DOWN and MOVE only, named explicitly. Babylon also emits `POINTERPICK`,
      // `POINTERTAP` and `POINTERDOUBLETAP` carrying the SAME underlying event, and a
      // duplicated sample would pull the RMS down — an instrument that flatters
      // itself is worse than none. `METHOD`: the instrument is a suspect.
      if (info.type === PointerEventTypes.POINTERUP) st.noisePointer = null;
      else if (
        info.type === PointerEventTypes.POINTERDOWN ||
        info.type === PointerEventTypes.POINTERMOVE
      ) {
        st.noise.push(s);
      }
    }

    // ⛔⛔⛔ **THE NUMBER THE WHOLE DEFECT TURNS ON**: the gap between two consecutive move events
    // FOR ONE POINTER. §1.1 rests an axis after `restConfirmMs` of silence, so a pointer whose
    // events arrive slower than that reads STATIONARY *between events while the finger is still
    // moving*. ⭐ Measured per pointer and reported as the WORST gap in the last second — a mean
    // would hide exactly the excursions that cause it.
    if (
      info.type === PointerEventTypes.POINTERDOWN ||
      info.type === PointerEventTypes.POINTERMOVE
    ) {
      const seen = st.eventGaps.get(e.pointerId);
      if (seen !== undefined && info.type === PointerEventTypes.POINTERMOVE) {
        seen.gaps.push({ t: s.t, ms: s.t - seen.last });
        while (seen.gaps.length > 0 && s.t - seen.gaps[0]!.t > 1000)
          seen.gaps.shift();
      }
      st.eventGaps.set(e.pointerId, { last: s.t, gaps: seen?.gaps ?? [] });
    }
    if (info.type === PointerEventTypes.POINTERUP) {
      hoverRelease(st, e.pointerId); // ⭐ (2026-10-14) the finger lifted: the hover ends — back to the orbit
      // ⭐⭐ (2026-10-13, §11nonies) the press on a placed part released: a TAP moves the gizmo there (`orbitTargetOnRelease`), a drag does not
      const pc = st.pendingPartCentre;
      if (pc !== null && pc.pointerId === e.pointerId) {
        st.pendingPartCentre = null;
        const to = orbitTargetOnRelease(pc.target, isTapRelease(pc.t, pc.x, pc.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop)));
        // ⭐⭐⭐ (2026-10-16) and the rig turned onto the face the tap hit, at the camera's yaw
        if (to !== null) retargetGizmo(st, to, pc.normal, pc.host ?? null);
      }
      // ⭐ prototype (green box), 2026-10-03: the green piece is no longer held once its finger lifts
      st.eventGaps.delete(e.pointerId);
      st.rawPressedBody.delete(e.pointerId);
      st.pointerTypeOf.delete(e.pointerId);
    }

    // ⭐⭐ (2026-10-12, §21) A PRESS IN THE ORIENTATION CUBE'S WINDOW IS THE CUBE'S — before the router: it never orbits nor grabs
    // ⭐⭐ (2026-10-12) a press on a resting-face quad is the quads' (a tap aligns to its side; a drag orbits)
    if (restingQuadPointer(st, info.type, e, s, (id, ss, prev) => orbitDragStep(st, id, ss, prev))) {
      st.hudDirty = true;
      return;
    }
    // ⭐⭐⭐ A PIONEERFACECURSOR GRAB OWNS ITS POINTER — before the router can latch a role for it.
    if (cursorPointer(st, info.type, e)) {
      st.hudDirty = true;
      return;
    }

    // ⭐ The anchor fork latches here, before anything is dispatched, so one event cannot be
    // judged half under one rule set and half under another.
    // ⛔ `A15`'s orphaned-selection collection that stood here is deleted (`D54`): a holder keeps
    // its object for its touchpoint's lifetime.

    // ⛔⛔⛔ **A PRESS FOR AN ID THAT NEVER RELEASED TAKES ITS OLD GRIP WITH IT** — audit fix,
    // 2026-09-17.
    //
    // ⚠⚠ `router.press` already drops its own record for an id that is pressed while still
    // down. ⛔ This file did not: it overwrites `held` only on the `OBJECT` branch, and the
    // `SECOND` and `IGNORED` branches `return` before reaching it. So a re-press that resolved
    // to either of those left the PREVIOUS grip in `held` — ticked every frame, holding a
    // recognizer and a mesh, and never deleted, because the branch that would have deleted it
    // belongs to a release that has already happened.
    // ⭐⭐ That is **defect 40's shape and `A13`'s at once**: *a tracker that outlived its
    // finger*, which this project has already paid for twice. ⚠ It needs a lost `pointerup`
    // plus a reused pointer id — rare, real (Firefox reuses ids), and impossible to reproduce
    // deliberately, which is exactly the kind of report that costs a day.
    // ⭐ The anchors go with it: `anchorMotion` lives on the grip, so dropping the grip drops
    // the trackers that would otherwise answer §1.1's question about a previous gesture's
    // travel.
    if (info.type === PointerEventTypes.POINTERDOWN && st.held.has(e.pointerId)) {
      st.held.get(e.pointerId)!.anchorMotion.clear();
      st.held.delete(e.pointerId);
      st.lastVerdict = `pressed an id that never released — dropped its stale grip`;
    }

    if (info.type === PointerEventTypes.POINTERDOWN) {
      // ⛔ A NEW TOUCH CANCELS A RESET IN FLIGHT. The animation writes the whole camera
      // pose every frame, so a drag during one would be overwritten as fast as it was
      // applied — the hand would appear to have no effect at all.
      st.cameraReset = null;
      const pick = info.pickInfo;
      // ⭐⭐⭐ `D113` — **THE EDGE BAND IS ALWAYS EMPTY SPACE**: a press near a canvas edge is a MISS
      // whatever is drawn there, so the camera reset, the orbit and the pinch stay reachable when a
      // body fills the view. ⭐ The decision is `inEdgeBand`'s; this supplies the rectangle.
      const inBand = inEdgeBand(
        e.clientX,
        e.clientY,
        st.canvas.getBoundingClientRect(),
        mmToPx(bandMmNow(st)),
      );
      // ⭐ prototype (green box): the box stops the ray, and a hit on it is a MISS (`throughGreenBox`).
      // ⭐⭐⭐ (2026-10-11, `RESTING_FACE_ALIGNMENT.md` §20) THE HELD SECOND TOUCH — *"Second touch on mobile equals right click on desktop"*:
      // the right button (`MOUSE_SECOND_ID`), or a finger pressed while ONE other is down on empty space, is the SECOND touch — unless it lands
      // on the orbited piece (*"anywhere (except the green and turquoise pieces themselves)"*); while it is held, the next press is the FIRST
      // touch again (*"first touch release and re-press does nothing (i.e. continuation of previous input)"*). ⛔ Neither grabs anything nor
      // moves the orbit centre.
      const onOrbited = st.greenBox !== null && pick?.hit === true && pick.pickedMesh === st.greenBox;
      const holdRole: "SECOND" | "FIRST" | null =
        st.greenBox === null
          ? null
          : st.hold !== null
            ? st.hold.first === null && e.pointerId !== st.hold.second
              ? "FIRST"
              : null
            : e.pointerId === MOUSE_SECOND_ID ||
                // ⛔⛔ (2026-10-28, *"the double finger is not working reliably: sometimes it latches, sometimes not"*) — around the assembly a second finger
                // ON the orbited piece is the second touch too: close in the piece fills the screen, and a second finger landing on it made a plain pinch
                ((!onOrbited || assemblyOn(st)) &&
                  e.pointerType !== "mouse" &&
                  ((st.router.outside().length === 1 && st.router.objects().length === 0) || partFirst(st, e.pointerId) !== null))
              ? "SECOND" // ⭐ (2026-10-11) the desktop's key is the second touch over the orbited piece too (its press selects the resting face)
              : null;
      // ⭐⭐ (2026-10-09) the FIRST touch (or the left button) on the orbited piece: the face it hit — the resting face if it is released as
      // a TAP (`restingFaceTap`, at the release); any other pointer pressing drops it. ⭐ (2026-10-11) with the second touch held too
      // (*"First touch tap on green or turquoise pieces with or without Second touch pressed"*)
      // ⭐⭐ (2026-10-11, the owner: *"add the possibility of selecting another resting face by second touch tap on the green or turquoise
      // piece"*) — the SECOND touch's tap on it too (the right button on a desktop): any touch pressed on the orbited piece is the candidate;
      // a press elsewhere leaves a pending one alone (its own release decides)
      if (onOrbited && e.pointerId !== MOUSE_SECOND_ID) {
        const n = pick?.getNormal(true);
        const face = n && st.greenBox !== null ? faceFromPickedNormal(st.world, st.greenBox.name, [n.x, n.y, n.z] as Vec3) : null;
        st.pieceFaceTap = restingFaceTap(onOrbited, true, inBand) && face !== null ? { pointerId: e.pointerId, faceId: face.faceId } : null;
        // ⭐⭐ (2026-10-14, the HOVER) the first touch on the piece: its drag may hover (`hoverDragStep`, decided past the tap's slop)
        if (holdRole === null && !inBand) hoverPressNote(st, e.pointerId, s);
      }
      const rayHit =
        holdRole !== null ? null : throughGreenBox(!inBand && pick?.hit && pick.pickedMesh ? pick.pickedMesh : null, st.greenBox);
      // ⭐⭐⭐ **EVERY TOUCH ON A FROZEN BODY IS TREATED AS A MISS** (`D119`; first the second touch
      // only, the owner 2026-09-23: *"therefore, this second touch could for example move another
      // object"*). ⛔ Filtered on the way IN, before the latch, so every rule downstream sees a
      // touchpoint that landed on nothing. ⭐ The one exception: a frozen body carrying a SEATED
      // follower (the unsnap's first touch). ⚠ The DECISION is `frozen_pick.ts`'s; this obeys.
      const rawHitId = rayHit === null ? undefined : st.idOf.get(rayHit);
      // ⛔⛔ **THE PRESS HOLDS THE BODY IT TOUCHED — `D102`'s redirect moved to the TRANSLATION
      // STEP** (the owner, 2026-09-26: *"now I cannot roll any longer the follower object around
      // the followerface normal axis … restore the behavior as it was in 389eaa2"*). ⚠ Redirecting
      // the GRIP to the assembly's root took the seated Follower's twist with it: its one free DOF
      // belongs to ITS constraint, and a grip on the root has no such channel. ⭐ So the finger
      // holds the member, its twist turns it about its face, and only `applyWorldStep` forwards a
      // translation to the root — *as a whole* for translation, *the touched body* for rotation.
      const hitId = rawHitId;
      const driveHit = rayHit;
      if (rawHitId !== undefined) {
        st.rawPressedBody.set(e.pointerId, rawHitId);
        // ⭐ `D183`: grabbed — from now on its goal is judged on the snap's margins, not the never-grabbed ones.
        st.grabbed.add(rawHitId);
      }
      st.pointerTypeOf.set(e.pointerId, e.pointerType);
      // ⛔ `D108`'s *the mouse's press latches the mode from Ctrl* is deleted (`D167`): the desktop keeps the mode, as
      // the tablet does, and a Shift tap toggles it.
      // ⭐ `D112`: the facts the episode ledger reads, taken BEFORE this press registers.
      const heldBefore = st.router
        .objects()
        .map((q) => st.held.get(q.id))
        .map((g) => (g === undefined ? undefined : st.idOf.get(g.mesh)));
      const hitFirst = pressHit(
        driveHit,
        // ⭐ A frozen body with a SEATED follower on it is holdable — the unsnap's first touch.
        hitId !== undefined &&
          st.world.objects.get(hitId)?.frozen === true &&
          !frozenHoldAdmitted(
            st.links.followersOf(hitId).some((f) => st.links.isSeated(f)),
          ),
      );
      // ⭐⭐⭐ `D124`: with a body held, a press on ANOTHER body steers it — never grabs the other one.
      const hitFirstId = hitFirst === null ? undefined : st.idOf.get(hitFirst);
      const steers =
        hitFirstId !== undefined &&
        pressSteers({
          holdersBefore: heldBefore.length,
          hitIsHeld: heldBefore.includes(hitFirstId),
          seatedPartnerOfHeld: heldBefore.some((h) => h !== undefined && isSeatedCouple(st, h, hitFirstId)),
        });
      const hit = steers ? null : hitFirst;
      // ⭐⭐ THE ONE PLACE A ROLE IS DECIDED, and it is decided by `IN2`, once.
      const routed = st.router.press(e.pointerId, s, hit);
      st.episodeFacts.set(e.pointerId, {
        role: routed.role,
        heldAtPress: heldBefore.length,
        pressedAnotherBody: rawHitId !== undefined && !heldBefore.includes(rawHitId),
      });
      // ⭐⭐ `D187`: classified NOW with what the press knows — so the episode can land the moment the action is
      // triggered (the render loop's `sync`), not at the release. ⛔ Counting is not landing: a press alone lands nothing.
      {
        const key = ++st.episodeSeq;
        st.episodeKey.set(e.pointerId, key);
        st.episodes.touch(
          key,
          st.cfg.pioneerCursorDrag !== 1 &&
            episodeCounts({
              role: routed.role,
              heldAtPress: heldBefore.length,
              pressedAnotherBody: rawHitId !== undefined && !heldBefore.includes(rawHitId),
              unaligned: false,
              continuesAnother: st.episodeContinued.has(e.pointerId),
            }),
          heldBefore.length > 0,
        );
      }
      if (rayHit !== null && hit === null) {
        st.lastVerdict = steers
          ? `${hitId ?? "?"} — the second touch STEERS (a tap on it aligns, D124)`
          : `frozen ${hitId ?? "?"} — routed as a MISS (a tap on it aligns, D119)`;
        // ⭐ `D119`/`D124`: remember the face under this touch — a TAP here aligns the held body to it.
        const n = pick?.getNormal(true);
        const f =
          n && hitId !== undefined
            ? faceFromPickedNormal(st.world, hitId, [n.x, n.y, n.z] as Vec3)
            : null;
        if (f !== null && hitId !== undefined) st.tapFace.set(e.pointerId, { id: hitId, faceId: f.faceId });
      }

      // ⭐⭐⭐ **`D68` — A PRESS THAT COMPLETES A DOUBLE TAP UNDOES THE FIRST TAP'S TOGGLE.**
      // ⛔ The owner (history — the orange FOLLOW it names is deleted, `D106`): *"if i double tap
      // without release the pioneer and press the follower → orange, the translation/rotation mode
      // toggles: it should not."* ⚠ `D28`'s *two taps revert* is keyed to the second RELEASE, and a
      // press that completes the pair never lifts first.
      // ⭐ THE DECISION IS `pairPressRevertsToggle`'s; this reads the two facts and obeys.
      if (pairPressRevertsToggle(st.taps.wouldPair(s), st.lastTapToggled)) {
        st.behaviour = toggleBehaviour(st.behaviour);
        st.lastTapToggled = false;
        // ⛔ …and this press's own release must not toggle again, or the full double tap would
        // end up flipped by one instead of reverting.
        st.pairReverted.add(e.pointerId);
        st.lastVerdict = `double tap (no release) → mode back to ${st.behaviour}`;
      }

      // ⛔⛔⛔ **`D66` — A PRESS NO LONGER TOGGLES THE MOVEMENT MODE, ANYWHERE.**
      //
      // > *"A press never toggles while a body is held, but a tap by the second touchpoint can
      // > (as per present rule for tap)."* — the owner, 2026-09-21
      //
      // ⭐⭐ `D58`'s two press triggers stood here and are **deleted**, and with them `D61`'s
      // exemption, `pressToggled` and `Held.outsidePressSeen`. ⚠ Everything they contained was
      // a consequence of the press toggle itself: the `A16` collision (*placing the control
      // finger flips what it will drive*) cannot happen once placing a finger does nothing.
      // ⭐ What is left is `D28`'s original rule, which `A16` asked for in the first place:
      // **switching the mode requires a TAP.**

      if (routed.role === "IGNORED") {
        // ⛔ A THIRD touchpoint on an object already held AND already pinched (A5 allows
        // exactly one partner). It starts no recognizer, takes no anchor and moves
        // nothing. ⚠ It is still COUNTED on the readout, so "why is nothing happening"
        // has a visible answer.
        st.hudDirty = true;
        return;
      }

      if (routed.role === "SECOND") {
        // ⭐ A second finger on an object another touchpoint already holds. It runs NO
        // recognizer — it never begins a §1.3 gesture of its own — it is one of A6's two
        // travelling fingers. ⛔ Creating a `Held` here would give one mesh two recognizers.
        // ⚠ A6's anchor may equally be a finger OUTSIDE every object; this branch is the
        // case where the hand happened to put it back on the part.
        st.hudDirty = true;
        return;
      }

      if (routed.role === "OUTSIDE") {
        // ⭐ Rule 1 chooses what to orbit AROUND at press, from the ray of the finger
        // that started it — so the centre cannot wander mid-drag as the ray moves.
        // ⛔⛔ AND ONLY IF NOTHING IS BEING HELD. A touchpoint outside an object while a
        // finger is already ON one is rule 6's ANCHOR, not an orbit — §2 rule 1 requires
        // ONE touchpoint and no hit. Choosing a barycentre for it would move the marker
        // and retarget the camera for a gesture that will never orbit at all.
        if (st.router.outside().length === 1 && st.router.objects().length === 0) {
          // ⭐⭐ DEFERRED, NOT IMMEDIATE. A second touchpoint outside any object turns
          // this into a PINCH (rule 4), and the two never land in the same instant — so
          // committing a new orbit centre on the first one moves the marker and
          // retargets the camera for a gesture the user meant as a zoom.
          // ⚠ The PRESS coordinates are kept, not re-read later: rule 1 chooses what to
          // orbit around from the ray of the finger that STARTED it, and a finger that
          // has drifted 120 ms' worth would choose a different barycentre.
          // ⭐⭐ prototype (green box), 2026-10-02: an empty-space press (the floor and the green piece are empty space here) does
          // NOT move the yellow target — only a press on a placed piece does (`EMPTY_PRESS_MOVES_TARGET`, switched off).
          st.pendingCentre =
            EMPTY_PRESS_MOVES_TARGET && st.cfg.orbitCentreGraceMs > 0
              ? { x: e.clientX, y: e.clientY, at: s.t }
              : null;
          if (EMPTY_PRESS_MOVES_TARGET && !st.pendingCentre) recomputeOrbitCentre(st, e);
        } else {
          // ⛔ A SECOND ONE ARRIVED: this is a pinch. Drop the pending retarget entirely
          // — the camera keeps orbiting whatever it was already orbiting.
          st.pendingCentre = null;
        }
        const p = pinchPair(st);
        if (p) {
          st.pinch.begin(p[0], p[1]);
          // ⭐ each finger's motion state starts here (`pinch_gate.ts`: the zoom only while BOTH are MOVING)
          // ⚠ Captured HERE, once. The zoom is a ratio against the gesture's start,
          // never an accumulation — so a pinch out and back returns exactly where it
          // began. See input/pinch.ts.
          st.zoomAtPinchStart = st.zoom;
        }
        // ⭐⭐⭐ (2026-10-11) the held second touch's input starts — the pink face its press would take noted (a PLACED part only: ⛔ never a
        // frozen body, never the orbited pieces); or the first touch pressed again while it is held
        // ⭐⭐ (2026-10-11, *"build with ALT and CTRL"*) on a desktop the key held is the second touch — it points at nothing — so the LEFT
        // click while it is held says which face: a placed part's is the pink face its input would take (the mouse only; a finger pressed
        // again on a part, on a tablet, takes nothing)
        if (holdRole === "SECOND") {
          // ⛔⛔ (2026-10-12, the owner: *"Remove the selection of pink face on the seated / placed parts and the resulting alignment of resting
          // face. Alignment of resting face shall be with the cube only"* — *"Remove the ctrl-alt raycast function in desktop"*) — a second touch
          // takes no pink face any more, and the desktop's key looks at nothing (it has no position); ⭐ a FINGER's press on a PLACED part notes
          // where — its TAP moves the orbit centre there (`holdRelease`), as a first touch's press does
          const hitObj = e.pointerId === MOUSE_SECOND_ID || inBand || pick?.hit !== true || pick.pickedMesh === null ? undefined : st.idOf.get(pick.pickedMesh);
          const onPlaced = hitObj !== undefined && goalLocked(hitObj, st.goalCommit, st.cfg.lockPlacedPieces === 1);
          const centreAt: [number, number, number] | null =
            onPlaced && pick?.pickedPoint ? [pick.pickedPoint.x, pick.pickedPoint.y, pick.pickedPoint.z] : null;
          // ⭐⭐ (2026-10-11, the owner: *"left click on a face and held then CTRL … then drag: the drag freezes the scene … I think this should
          // enable the roll to the next axis"*) — a first touch held on a PLACED part is the input's first touch too (`partFirst`): it was
          // left out (an OBJECT pointer, not an outside one), so its drag drove nothing — the locked part's own orbit stops once a second is down
          const firstNow = st.router.outside().find((q) => q.id !== e.pointerId)?.id ?? partFirst(st, e.pointerId);
          const centreN = centreAt !== null ? pick?.getNormal(true) : null;
          holdSecondPress(st, e.pointerId, s.x, firstNow, centreAt, centreN ? [centreN.x, centreN.y, centreN.z] : null, centreAt !== null && pick?.pickedMesh ? (st.idOf.get(pick.pickedMesh) ?? null) : null);
          // ⭐ (2026-10-28) on the orbited piece its tap is the resting face's, never the yellow quad's
          if (onOrbited && st.hold !== null) st.hold.pressActed = true;
        } else if (holdRole === "FIRST") holdFirstPress(st, e.pointerId, s.x);
        st.hudDirty = true;
        return;
      }

      const mesh = routed.object!;
      // ⭐⭐ prototype (green box) — **A FIRST PRESS ON A PIECE IN ITS GOAL MOVES THE ORBIT TARGET THERE** (the owner, 2026-10-01:
      // *"when first touch or left button is pressed and hold on a placed piece, the yellow orbit target moves to the point
      // where the raycast hits the face of the placed piece"*). ⭐ The decision is `orbitTargetOnPress`'s; the press point is the
      // pick's. ⚠ The RIGHT button is the mouse adapter's own re-issued press (`isTrusted` false) — it does not move it.
      const hitAt = pick?.hit && pick.pickedPoint ? ([pick.pickedPoint.x, pick.pickedPoint.y, pick.pickedPoint.z] as Vec3) : null;
      const newTarget = orbitTargetOnPress(
        routed.role === "OBJECT" && st.router.all().length === 1,
        e.pointerType !== "mouse" || e.isTrusted,
        goalLocked(st.idOf.get(mesh), st.goalCommit, st.cfg.lockPlacedPieces === 1),
        hitAt,
      );
      // ⭐⭐ (2026-10-13, *"Piece still locked onto the collided part without possibility to go backwards"* → *"Build"*; §11nonies) NOTED, not moved: the gizmo goes there at the release if it is a TAP — a drag from the part orbits
      // ⭐ (2026-10-16) with the face's normal there (world): the rig's turn when the gizmo moves
      const hitN = newTarget !== null ? pick?.getNormal(true) : null;
      st.pendingPartCentre = newTarget !== null ? { pointerId: e.pointerId, target: newTarget, normal: hitN ? [hitN.x, hitN.y, hitN.z] : null, host: st.idOf.get(mesh) ?? null, x: s.x, y: s.y, t: s.t } : null;
      // ⭐⭐⭐ `IN3` RULE 2 — *"the hit object is selected and the hit face is selected."*
      //
      // ⛔⛔ FROM THE PICKED **NORMAL**, never from `pickInfo.faceId`: that is a TRIANGLE
      // index, a box face is two of them, and an imported mesh face is arbitrarily many.
      // ⭐ `core/face_pick.ts` owns the mapping and carries the frame — the pick arrives in
      // world, face normals are stored local, and getting that direction backwards is the
      // silent error that only shows once an object has been turned.
      // ⭐⭐ EVERY PRESS ON AN OBJECT RESOLVES ITS FACE, from the picked **NORMAL**.
      // ⛔ `getNormal(true)` asks Babylon for the WORLD-space normal at the hit; the mapping
      // to a face lives in `core/face_pick.ts`, which carries the frame — the pick arrives in
      // world, face normals are stored local, and getting that direction backwards is the
      // silent error that only shows once an object has been turned.
      // ⚠ PER GRIP: the alignment's trigger names TWO faces on two objects at once, so one
      // global selection cannot express it.
      // ⛔ A PRESS DOES **NOT** HIGHLIGHT. The highlight is the ALIGNMENT's state — *"the
      // FollowerFace shall remain highlighted until un-highlight occurs"* is the alignment's
      // clause — so a press that aligns nothing draws nothing.
      const faceNormal = pick?.getNormal(true);
      const pickedId = st.idOf.get(mesh);
      // ⚠ `faceHit`, not `hit`: `hit` is the picked MESH a few lines above, and two different
      // things called the same name in one scope is how the wrong one gets used.
      const faceHit =
        faceNormal && pickedId !== undefined
          ? faceFromPickedNormal(st.world, pickedId, [
              faceNormal.x,
              faceNormal.y,
              faceNormal.z,
            ] as Vec3)
          : null;
      // ⛔⛔ (2026-10-11, the owner: *"the problem is that I did not ask to change the pink face: the ctrl was on empty so there is no reason the
      // pink face should have changed to the new face"*) — a plain first touch / left press on a part moves the ORBIT CENTRE only (§20: *"First
      // touch or left click on placed part change the center of orbit"*); the pink face is the second touch's alone (a finger, ALT / CTRL).
      // It was set here since `1.0.59q-` (*"a press that MOVED the target puts the pink ring on THIS face"*), from before the second touch
      // existed — so a later way in highlighted a face nobody had picked, and the piece was not aligned to it
      void faceHit;
      let pressFace = faceHit
        ? { faceId: faceHit.faceId, cos: faceHit.cos }
        : null;
      // ⭐⭐ `D155`: a Space freeze — this second touch takes over the face the frozen drag pressed, not
      // the one a pick at its point would name (a rotation moves the body under the pointer).
      if (st.inheritPressFace !== null && e.pointerId === MOUSE_SECOND_ID && st.inheritPressFace.mesh === mesh) {
        pressFace = st.inheritPressFace.pressFace;
      }
      st.inheritPressFace = null;
      st.lastVerdict = faceHit
        ? `${pickedId}/${faceHit.faceId} under the finger (cos ${faceHit.cos.toFixed(2)})`
        : "no face resolved";
      const rec = new Recognizer(st.cfg, poseOf(st, mesh), st.taps);
      rec.press(s);
      st.held.set(e.pointerId, {
        rec,
        mesh,
        frame: requireGestureFrame(st),
        prev: s,
        // ⭐ `D67`: asked HERE, once, on the way down — a peek, not a record. The release still
        // consumes the pair through `TapHistory.record`.
        pointerType: e.pointerType,
        mode: null,
        pressFace,
        sway: new SwayWatcher(st.cfg.swayTurnDeg, st.cfg.pointerNoiseMm),
        anchorMotion: new Map(),
        anchorRollSign: new Map(),
        holderDxSign: 0,
        anchorDxSign: new Map(),
        holdPinch: null,
        seatLocked: false,
        seatSeq: -1,
        // ⭐ `D185`: latched at the press — the maroon pitch turns like a wheel seen from the camera.
        pressSide: pressSideFrom(e.clientX, gizmoClientX(st, st.idOf.get(mesh))),
        depthSway: new SwayWatcher(st.cfg.swayTurnDeg, st.cfg.pointerNoiseMm),
        // ⛔ THE FLOOR IS DERIVED FROM THE MEASURED NOISE, not chosen: pointer jitter
        // reaches the pose multiplied by the rotation gain, so 0.761 mm becomes ~3.05°
        // of orientation noise per sample. Measured over 10 s of a still finger that is
        // still reported MOVING: ×1 → 377 false kicks, ×1.5 → 135, ×2 → 14, **×3 → 0**.
        // ⚠ The cost is the slowest turn that can still register — 92°/s at ×3, which is
        // a quarter turn a second, an ordinary rotation.
        spinSway: new SpinSwayWatcher(
          st.cfg.rotateSwayTurnDeg,
          3 * st.cfg.gainRotateFree * st.cfg.pointerNoiseMm * (180 / Math.PI),
        ),
      });
      // ⛔⛔ THE PRESS NEVER ALIGNS (`D119`), and since `D124` no second press on another body reaches
      // here at all — it steers, and its TAP aligns in the OUTSIDE release. The press-time alignment
      // (`D55`, `pendingAlign`, `alignFollowerToPioneer`) is deleted by the 2026-09-27 audit.
      st.hudDirty = true;
      return;
    }

    // ⛔ Everything past here is a MOVE or an UP for a touchpoint already latched. The
    // role decides which rule sees it — never a second look at what is under the finger.
    const routed = st.router.get(e.pointerId);
    if (!routed) return;

    if (routed.role === "SECOND") {
      if (info.type === PointerEventTypes.POINTERUP) {
        forgetAnchor(st, routed.seq);
        st.router.release(e.pointerId);
        st.lastVerdict = "second touchpoint released";
        // ⭐⭐⭐ *"Tapped ANYWHERE"* includes the held object itself.
        // ⚠ A `SECOND` release never fed §1.3's tap history before the toggle existed. It
        // does now, and that is deliberate: a tap on the held object is a tap *anywhere*.
        // ⛔⛔ **`D64` — AND A FINGER THAT DROVE THIS BODY DOES NOT TOGGLE ON THE WAY UP.**
        // ⚠ Both sets are consulted unconditionally, never short-circuited: each owns an entry
        // for this pointer id and leaving one behind would eat the NEXT gesture's tap.
        // ⛔⛔ `D108`: a tap on the held body itself no longer toggles — only empty space does.
        noteTap(st, routed.pressed, s, e.pointerId, false);
      } else {
        st.router.move(e.pointerId, s, throughGreenBox(info.pickInfo?.pickedMesh ?? null, st.greenBox));
        // ⭐ A second touch on a seated Follower (redirected to its root) is the UNSNAP's.
        st.lastFedPointer = e.pointerId;
        feedUnsnap(st, s);
        // ⭐⭐⭐ A12: A SECOND FINGER ON THE SAME OBJECT DRIVES IT, exactly as one outside
        // does — the owner: *"second touchpoint INSIDE OR OUTSIDE any object"*. Its x is
        // roll and its y is depth, while the finger on the object is held still.
        // ⚠ A touchpoint on a DIFFERENT object never lands here: since `D124` it is routed as a
        // MISS and steers from the OUTSIDE branch (its tap aligns).
        const holder2 = st.router
          .objects()
          .find((q) => q.object === routed.object);
        const grip2 = holder2 ? st.held.get(holder2.id) : undefined;
        // ⭐ The same table decides this finger as the OUTSIDE one (`D108`: the drive depends on
        // the body and the mode, never on where the finger landed).
        // ⭐⭐ `D182`: not while it is half of an unsnap couple — its pull is the unsnap's, never the Pioneer's.
        if (
          !unsnapHolds(st, e.pointerId) &&
          grip2 &&
          applyDepthDrag(st, 
            grip2,
            routed.seq,
            s,
            secondTouchDrive(gripIsAlignedFollower(st, grip2), st.behaviour) ===
              "BOTH",
          )
        ) {
          // ⚠ `D64` recorded a DRIVE here and `D65` deleted it: the fact could not answer the
          // question, because a finger moved along the channel the mode did not give it drives
          // nothing and is not a tap either. Nothing to record — the press already decided.
        }
      }
      st.hudDirty = true;
      return;
    }

    if (routed.role === "IGNORED") {
      // ⛔⛔ AN IGNORED TOUCHPOINT RUNS NOTHING, INCLUDING ON RELEASE — no release
      // verdict, no tap history. ⚠ The OPPOSITE of the pinch three
      // branches below, where lifting one of two fingers ends the gesture. A stray TAP
      // from here would evict a constraint (§1.4) that the user never asked to lose.
      if (info.type === PointerEventTypes.POINTERUP) {
        forgetAnchor(st, routed.seq);
        st.router.release(e.pointerId);
      } else st.router.move(e.pointerId, s, throughGreenBox(info.pickInfo?.pickedMesh ?? null, st.greenBox));
      st.hudDirty = true;
      return;
    }

    if (routed.role === "OUTSIDE") {
      if (info.type === PointerEventTypes.POINTERMOVE) {
        const prev = routed.last;
        // ⚠ The live hit is handed over and DISCARDED by the router: this finger may
        // now be over a part, and it is still an anchor. See router.ts's `hitNow`.
        st.router.move(e.pointerId, s, throughGreenBox(info.pickInfo?.pickedMesh ?? null, st.greenBox));
        // ⭐⭐ THIS IS THE FINGER THAT DRIVES DEPTH OR ROLL, and this branch is the only place
        // either is applied. ✅ **SIMULTANEOUS SINCE 2026-09-17** (owner): the holder's own
        // x/y keep running in their own handler while this one adds its axis, and the two SUM.
        // ⛔ `A10`'s gate — which required the holder to be STILL — is deleted, and
        // `depth_translate.ts` carries the note: what it protected is worth knowing first.
        const holder = st.router.objects()[0];
        const grip = holder ? st.held.get(holder.id) : undefined;
        // ⭐⭐⭐ **`D59` — AN ALIGNED FOLLOWER GIVES THIS FINGER BOTH AXES**, exactly as a
        // finger on its Pioneer already did. ⛔ The owner's generalisation: an aligned body has
        // one rotational DOF left, so there is nothing for the movement mode to choose between.
        // ⚠ A FREE body still has three, and `A16`'s split still earns its keep there.
        if (
          grip &&
          applyDepthDrag(st, 
            grip,
            routed.seq,
            s,
            secondTouchDrive(gripIsAlignedFollower(st, grip), st.behaviour) === "BOTH",
          )
        ) {
          st.hudDirty = true;
          return;
        }
        // ⭐⭐⭐ (2026-10-11) the held second touch's input owns its two touches' moves: undecided (nothing moves), the way in / round the
        // piece (the first touch's dx only), or the zoom — ⛔ never the centre orbit while the second touch is held
        if (st.hold !== null && (e.pointerId === st.hold.first || e.pointerId === st.hold.second)) {
          holdMove(st, e.pointerId, s, prev, (dxOnly) => orbitDragStep(st, e.pointerId, s, prev, dxOnly));
          st.hudDirty = true;
          return;
        }
        if (st.router.outside().length === 2) {
          updatePinch(st);
        } else if (
          st.router.outside().length === 1 &&
          st.router.objects().length === 0
        ) {
          // §2 rule 1: ONE touchpoint, no hit — orbit. ⭐⭐ (2026-10-14) …unless it pressed ON the orbited piece and may HOVER
          if (!hoverDragStep(st, e.pointerId, s, prev)) orbitDragStep(st, e.pointerId, s, prev);
        }
      } else if (info.type === PointerEventTypes.POINTERUP) {
        // ⭐⭐ DOUBLE-TAP OUTSIDE ANY OBJECT RESETS THE CAMERA. ⛔ Judged BEFORE the
        // release, while the router still knows where this touchpoint pressed: §1.3
        // measures a tap by its own press, not by whatever the last event happened to be.
        // ⚠ The SAME two thresholds §1.3 uses for an object — a tap is a tap whatever it
        // lands on, and a second definition here could disagree with the first.
        forgetAnchor(st, routed.seq);
        st.router.release(e.pointerId);
        // ⛔ A pinch needs BOTH touchpoints. Lifting one ends it rather than letting
        // the survivor keep scaling against a partner that is gone.
        st.pinch.end();
        // ⭐⭐⭐ (2026-10-11) the held second touch lifted: its input ends (the way out, or the pink face of a press that never pinched)
        // — consumed, not a tap; the first touch lifted while it is held: the input goes on (and a tap on the piece below still counts)
        // ⭐ (2026-10-28) a second finger's TAP on the orbited piece (around the assembly it is the second touch): its resting-face tap still goes on below
        const faceTapHere = st.pieceFaceTap !== null && st.pieceFaceTap.pointerId === e.pointerId && st.hold !== null && st.hold.second === e.pointerId && st.hold.mode === "HELD";
        if (
          holdRelease(
            st,
            e.pointerId,
            isTapRelease(routed.pressed.t, routed.pressed.x, routed.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop)),
          ) === "SECOND" &&
          !faceTapHere
        ) {
          st.hudDirty = true;
          return;
        }
        // ⭐⭐ (2026-10-09) the first touch / left button released on the orbited piece as a TAP, nothing else down: the face it hit becomes
        // the resting face and the piece ALIGNS it (one episode); the next taps of the second touch roll on that face. ⛔ Consumed — not a
        // camera-reset tap.
        {
          const ft = st.pieceFaceTap;
          if (ft !== null && ft.pointerId === e.pointerId) {
            st.pieceFaceTap = null;
            // ⭐ (2026-10-11) a TAP whatever else is down — the first touch's, or the second's with the first orbiting
            const tapped =
              isTapRelease(routed.pressed.t, routed.pressed.x, routed.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop));
            // ⭐⭐ (2026-10-13, *"build a piece-switch respawn which activates if any delta position input (orbiting or translation) and any rotation by quad is blocked: in such case, if the user double tap/click on the piece, the piece respawns at its initial spawn transform"*) — a DOUBLE tap on the piece while it is STUCK (its position input and its quad's turn both blocked)
            // ⭐⭐ (the third audit) decided by `pieceTapAction`: while the red pop-up shows, a single tap is CONSUMED — it used to change the
            // resting face, which dropped the stuck verdict, and the second tap of the double found the respawn unarmed
            const action = pieceTapAction(
              tapped,
              tapped && st.pieceTaps.record(routed.pressed, s.t) === "DOUBLE_TAP",
              pieceRespawnArmed(st.pieceStuck.position, st.pieceStuck.turns),
              st.blockedShown === true,
            );
            if (action === "RESPAWN") {
              respawnStuckPiece(st);
              return;
            }
            if (action === "CONSUME") return;
            if (action === "FACE" && selectRestingFace(st, ft.faceId)) {
              st.hudDirty = true;
              return;
            }
          }
          // ⭐⭐ (2026-10-12, the owner: *"a left click / first touch tap on empty is equivalent to a left click / first touch tap on the polyhedron pink
          // face"*) — a TAP on empty space (not the orbited piece, no second touch held, the desktop's key aside) taps the cube's face SHOWN
          if (
            (ft === null || ft.pointerId !== e.pointerId) &&
            st.hold === null &&
            e.pointerId !== MOUSE_SECOND_ID &&
            isTapRelease(routed.pressed.t, routed.pressed.x, routed.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop)) &&
            orientTapShown(st)
          ) {
            st.hudDirty = true;
            return;
          }
        }
        // ⭐⭐ ONE call, ONE record: it judges the tap, keeps §1.3's history, and arms the
        // pending toggle. ⛔ A DOUBLE tap here is the camera reset, and cancels the pending
        // toggle rather than being consumed by it.
        // ⛔⛔ **`D64` — a finger that drove depth or roll releases, it does not tap.** ⚠ The
        // DOUBLE-TAP is untouched: the history is recorded either way, so the camera reset
        // pairs exactly as it always has. Only the toggle is spent.
        // ⭐⭐⭐ **`D95` — A TAP HERE WHILE HOLDING AN ALIGNED BODY RELEASES ITS ALIGNMENT**, and is
        // consumed rather than also toggling the mode. ⛔ Judged with the SAME tap test `noteTap`
        // uses, and asked BEFORE it, because `noteTap` toggles. ⭐ The desktop's right-hold + left
        // click on empty space arrives here as exactly this configuration (`D94`).
        const soleHolder =
          st.router.objects().length === 1 ? st.router.objects()[0] : undefined;
        const heldGrip = soleHolder ? st.held.get(soleHolder.id) : undefined;
        const heldId = heldGrip ? st.idOf.get(heldGrip.mesh) : undefined;
        // ⭐ `D139`: a locked grip takes no tap meaning — no align, unalign, release or toggle.
        const isTap = seatLockAllows(heldGrip?.seatLocked === true, "TAP") && isTapRelease(
          routed.pressed.t,
          routed.pressed.x,
          routed.pressed.y,
          s.t,
          s.x,
          s.y,
          st.cfg.tapMaxDuration,
          mmToPx(st.cfg.doubleTapSlop),
        );
        // ⭐⭐ `D119`/`D124` — A TAP ON ANOTHER BODY (frozen, or steered by this touch) ALIGNS THE HELD
        // BODY TO THE FACE UNDER IT; `tapFace` was set at the press for any non-held body routed as a
        // miss. ⛔ Asked FIRST: it is an assembly act, and must not fall through to the unalign or the
        // mode toggle. ⚠ `frozenTap`/`frozenVerdict` are historical names — the body need not be frozen.
        const frozenTap = st.tapFace.get(e.pointerId);
        st.tapFace.delete(e.pointerId);
        const frozenVerdict =
          isTap && frozenTap !== undefined && heldGrip !== undefined && heldId !== undefined
            ? pressMeaning({
                pressedObject: frozenTap.id,
                pressedFace: frozenTap.faceId,
                heldObjects: [heldId],
                pioneerOfHeld: st.links.pioneerFor(heldId)?.objectId ?? null,
                alignedFaceOfHeld: alignedFaceOf(st.world, heldId),
                pioneerFaceOfHeld: st.links.pioneerFor(heldId)?.faceId ?? null,
                heldPressFace: heldGrip.pressFace?.faceId ?? null,
                pressedIsSeatedPartner: isSeatedCouple(st, heldId, frozenTap.id),
              })
            : null;
        if (frozenVerdict !== null && heldGrip !== undefined && heldId !== undefined && frozenTap !== undefined) {
          st.taps.record(routed.pressed, s.t);
          if (frozenVerdict.action === "ALIGN") {
            alignFollowerTo(st, heldId, heldGrip, frozenTap.id, frozenTap.faceId, null);
            // ⭐ The ledger: an assembly tap, like the unalign tap (`D112`).
            st.episodeUnaligned.add(e.pointerId);
          } else {
            st.lastVerdict = `align: tap on ${frozenTap.id}/${frozenTap.faceId} — nothing to do`;
          }
        } else if (
          isTap &&
          heldGrip !== undefined &&
          heldId !== undefined &&
          outsideTapRelease(
            st.router.objects().length,
            alignedFaceOf(st.world, heldId) !== null,
            st.links.followersOf(heldId).length,
          ) !== null
        ) {
          // ⚠ The history is still recorded, so a double tap keeps pairing exactly as it did.
          st.taps.record(routed.pressed, s.t);
          st.episodeUnaligned.add(e.pointerId);
          if (alignedFaceOf(st.world, heldId) !== null) {
            releaseAlignmentOf(st, heldId);
            st.lastVerdict = `align: TAP on empty space released the alignment on ${heldId}`;
          } else {
            // ⭐⭐ `D107`: holding a PIONEER — the tap releases EVERY follower aligned to it.
            // ⚠ `followersOf` hands back a COPY: releasing mutates the set being walked.
            const orphaned = st.links.followersOf(heldId);
            for (const f of orphaned) releaseAlignmentOf(st, f);
            st.lastVerdict = `align: TAP on empty space released ${orphaned.length} follower(s) of ${heldId}`;
          }
        } else {
          // ⛔ (prototype, the owner 2026-10-10: *"remove the camera reset"*) a DOUBLE tap on empty space no longer flies the camera home —
          // in this build the rig places the orbited piece, so the reset threw it back to its boot spot on the rings. The tap is still
          // recorded (§1.3's history) and may still toggle the mode.
          noteTap(
            st,
            routed.pressed,
            s,
            e.pointerId,
            tapTogglesMode({
              isMouseDerived:
                e.pointerType === "mouse" || e.pointerId === MOUSE_SECOND_ID,
              onEmptySpace: true,
              heldObjectCount: st.router.objects().length,
              heldIsAligned: heldId !== undefined && alignedFaceOf(st.world, heldId) !== null,
              heldFollowerCount: heldId !== undefined ? st.links.followersOf(heldId).length : 0,
            }),
          );
        }
      }
      st.hudDirty = true;
      return;
    }

    const grip = st.held.get(e.pointerId);
    if (!grip) return;

    if (info.type === PointerEventTypes.POINTERMOVE) {
      // ⭐⭐⭐ **THE UNSNAP GESTURE** (`D100`): the FIRST holder on the Pioneer, the SECOND on its
      // seated Follower, then a rapid move — the fingers' separation growing (tablet) or the
      // driven pointer travelling (mouse) by the unsnap leg (`unsnapLegMm`) within its window.
      // ⛔ The pair and the numbers are `unsnap.ts`'s; this reads press order off the router.
      st.lastFedPointer = e.pointerId;
      feedUnsnap(st, s);
      // ⚠ Handed the live hit, which the router discards: a finger that presses on a
      // part and slides off is still holding it (§4).
      st.router.move(e.pointerId, s, throughGreenBox(info.pickInfo?.pickedMesh ?? null, st.greenBox));

      // ⛔⛔ `D51`'s PINNED PIONEER IS DELETED (`D109`): a Pioneer held beside its Follower translates
      // like any held body, and the Follower's second finger drives both axes wherever it lands (`D108`).


      if (grip.rec.move(s) === "COMMITTED_CONTINUOUS") {
        // ⭐⭐ PRESENCE, RE-READ EVERY FRAME. A second finger outside any object — no
        // matter what it has done since it went down — means rule 6. Lift it and the
        // gesture goes back to rotating, which is a deliberate act and a visible one.
        // ⚠ `>= 1`: two anchors and one object is not in §4's table, and translating is
        // the answer that surprises nobody. Pinch and orbit both require NOTHING held,
        // so neither can be running at the same time.
        // ⭐⭐⭐ A13 SWAPPED THE ASSIGNMENT: **one touchpoint TRANSLATES, and a second
        // one held STILL turns the same drag into a ROTATION.** The second finger
        // contributes no motion — holding it still is the whole of the input.
        // ⛔ Presence AND state, re-read every frame, never latched. ⚠ Both fingers moving
        // resolves to TRANSLATE: the holder wins every tie, which is the one cell the
        // owner's four rules did not name.
        // ⚠⚠ `IN4` records a device verdict that LOOKS like this and is not — a
        // STATIONARY latch taken at press, overturned by a hand first try. This reads it
        // live, off a position deadband rather than a speed test, but a device pass should
        // look for mode flicker directly.
        // ⛔⛔⛔ PRESENCE ALONE, AND THE DEVICE SAID SO TWICE. I first keyed this on the
        // second finger's MOTION STATE, and a hand overturned it: *"if I transition quickly
        // there is a translation then a rotation, if I transition slowly there is directly
        // a rotation."* ⭐ A finger PLACED QUICKLY skids as it lands — the centroid slides
        // while the contact area grows — so it read MOVING for as long as the landing took,
        // and the mode followed it. Nothing about the GESTURE differed; only the landing.
        // ⭐⭐⭐ A14: A LIFT-AND-REPLACE IS ONE GESTURE. Between the lift and the press
        // there is genuinely one touchpoint down, so without the grace A13 translates
        // through the middle of a swap — and a swap is 150-300 ms of hand, which is very
        // visible if the holder happens to be moving at the time. ⚠ That is exactly why the
        // owner's cases 2 and 3 *"differ by timing of the input"*.
        // ⭐⭐ **ONE RULE, ONE PLACE** (`A16`): `translatesOnDrag` in `highlight.ts` owns it. ⛔ It
        // used to be spelled inline here as `objects().length === 1 ? behaviour : "TRANSLATE"`.
        // ⭐⭐⭐ `D60` — **AND A SECOND TOUCH THAT OWNS ROLL + DEPTH TAKES THE MODE'S PLACE.**
        // ⛔ The owner's completion: *"the first touch shall control the translation with delta
        // position x and y — which is currently the case in translation mode but not in rotation
        // mode."* ⚠ Without it the first touch keeps twisting about the very axis the second
        // touch's `dx` turns, and two fingers drive ONE DOF.
        grip.mode = translatesOnDrag(
          st.router.objects().length,
          st.behaviour,
          gripIsAlignedFollower(st, grip),
        )
          ? "TRANSLATE"
          : "ROTATE";
      }
      // ⭐⭐ `D139`: a grip whose Follower just SEATED drives nothing with this finger until it lifts.
      // ⭐⭐ `D182`: nor one that is half of an unsnap couple — the Pioneer holds still until a finger lifts.
      // ⭐⭐ prototype (green box): nor one whose piece is IN ITS GOAL — no translation, no rotation (`goal_lock.ts`).
      const lockedInGoal = goalLocked(st.idOf.get(grip.mesh), st.goalCommit, st.cfg.lockPlacedPieces === 1);
      if (lockedInGoal) st.lastVerdict = `${st.idOf.get(grip.mesh)} is in its goal — locked`;
      // ⭐⭐ prototype (green box) — **AND ITS DRAG ORBITS** (the owner, 2026-10-01: *"allow the orbit to occur when first touch
      // or left click is pressed and hold on placed piece"*): the one finger on a locked piece drives the orbit exactly as on
      // empty space (`orbitDragStep`); the piece stays pressed — a HitFace, a Pioneer, an undo.
      if (st.hold !== null && e.pointerId === st.hold.first) {
        // ⭐⭐ (2026-10-11) the held second touch's first touch, pressed on a part (`partFirst` — placed or not, *"left click on a face and held
        // then CTRL on the another face … the drag freezes the scene"*): its moves are the input's — the way in and the roll, as from empty
        // space; ⛔ the part itself never moves
        const from = grip.prev;
        holdMove(st, e.pointerId, s, from, (dxOnly) => orbitDragStep(st, e.pointerId, s, from, dxOnly));
        grip.prev = s;
        st.hudDirty = true;
        return;
      }
      if (lockedInGoal && st.router.objects().length === 1 && st.router.outside().length === 0) {
        orbitDragStep(st, e.pointerId, s, grip.prev);
      }
      if (lockedInGoal || unsnapHolds(st, e.pointerId) || !seatLockAllows(grip.seatLocked, grip.mode === "ROTATE" ? "ROTATE" : "TRANSLATE")) {
        grip.prev = s;
        st.hudDirty = true;
        return;
      }
      // ⭐⭐ THE SYMPATHETIC SWAY. Three triggers, all of them a CHANGE OF INTENT: the
      // finger starts or resumes moving, the gesture becomes a translation mid-rotation,
      // or the drag turns by more than `swayTurnDeg`. ⛔ Never per frame — that would be
      // a continuous shove, and the scene would drift rather than react.
      const kick = grip.sway.push(
        s,
        grip.rec.motionState === "MOVING",
        grip.mode === "TRANSLATE",
      );
      if (kick && st.cfg.translateSwayMm > 0) nudgeOthers(st, grip, kick);

      // ⛔⛔ A10: THE HOLDER MOVING IS RULE 6, ALWAYS. There is nothing to test here and
      // nothing to wait for — this event is proof the holder is not still, which is the
      // only question A10 asks. ⭐ A6 used to attempt a depth classification on this very
      // line and withhold the vertical until it had one; that hesitation at each end of
      // every drag is exactly what the owner rejected.

      // ⛔⛔ THE EVICTION SHAKE IS DELETED (`D107`): *tap empty space while holding* releases an
      // alignment — or, holding a Pioneer, all its followers — on both devices.
      // ⭐⭐ `D137`: two fingers spreading or closing sideways while translating — the ZOOM owns the move,
      // and the translation is paused (latched until a finger lifts; the rule is `input/hold_pinch.ts`).
      if (grip.mode === "TRANSLATE") grip.holderDxSign = nextDxSign(grip.holderDxSign, grip.rec.step.dx);
      if (grip.mode === "TRANSLATE" && holdPinchStep(st, grip)) {
        // ⭐ Zoomed inside `holdPinchStep`; nothing to translate.
      } else if (grip.mode === "TRANSLATE") {
        // §4 RULE 6 — ⛔⛔ **NO LONGER THE SCREEN VIEW PLANE** (`D75`, 2026-09-22): the body is
        // translated along ITS OWN AXES, and the two comments below about the gain and the
        // deadband are the parts of rule 6 that survive unchanged.
        // ⛔ The gain is a MULTIPLIER on a COMPUTED tracking factor, not a number: at
        // 1.0 the object stays exactly under the finger at every camera distance. The
        // whole derivation, and the 20× spread that forced it, is in input/translate.ts.
        // ⚠ `clientHeight` — CSS pixels, matching pointer coordinates. The render height
        // is device pixels and would be wrong by `devicePixelRatio`.
        // ⭐⭐ A10 GAVE THE VERTICAL BACK, WHOLE. A6 had to WITHHOLD it while its
        // detector said PENDING — the two rules shared a configuration and took a window
        // to tell apart — and the cost was that the first window of every drag's vertical
        // travel was DISCARDED. ⛔ There is no undecided state any more: this event exists
        // because the holder moved, and a moving holder is rule 6 by definition.
        // ⭐⭐ THE DEADBANDED TRAVEL (A11), never the raw delta. The dead radius is
        // applied once in §1.1 and every rule reads the same side of it — so a still
        // finger moves nothing, and a drag leaves rest continuously rather than stepping
        // by the radius. ⛔ This is also amendment A9, met at the source.
        // ⭐⭐⭐ **THE CHANNELS ARE REMAPPED (the owner, 2026-09-22)**: `dx` drives the body's
        // **x** axis and `dy` drives its **depth** axis — both horizontal — and the SECOND
        // touchpoint's `dy` drives its **gravity** axis (`applyDepthStep`). ⭐ The axes are the
        // boot-latched ones (`WorldAxisB`, the only frame since `D109`). ⚠ What it costs, and it is
        // inherent rather than tunable: the holder's `dy` goes quiet at a level camera, where a
        // depth change produces no screen motion at all. ⭐ `axis_translate.ts` derives it, and
        // the depth sign falls out of the projection instead of being asserted. ⛔ A body
        // the model does not know is given the boot basis rather than no basis — it is still
        // being dragged, and the alternative is a frame in which the finger does nothing.
        // ⭐⭐⭐ `D145`: the LIVE camera's axes — `dx` along the screen's right, `dy` along the view,
        // both flattened; finger up is AWAY when the camera is at or above the gizmo.
        const tid = st.idOf.get(grip.mesh);
        const axes = axesOf(st);
        const travel = axisTravel(
          {
            holderDxPx: grip.rec.step.dx,
            holderDyPx: grip.rec.step.dy,
            secondDyPx: 0,
          },
          // ⛔ THE TRUE CAMERA AXES, not the gravity frame: the question is what the axis looks
          // like ON THE GLASS. ⚠ Handing it `grip.frame` would make the depth channel's
          // projection identically zero at every camera angle.
          screenFrame(st),
          axes,
          trackingMetresPerPx(st.camera.radius, st.camera.fov, st.canvas.clientHeight),
          st.cfg.gainTranslateScreen,
          st.cfg.gainTranslateDepth,
          st.cfg.axisTrackingConeDeg,
        );
        noteAxisTravel(st, tid, travel);
        st.lastTrackGain = travel.trackGain;
        // ⛔ `st.edgeOnNow` is NOT written here any more (`D134`): it is the camera's, refreshed every frame.
        const step = axisDisplacement(travel, axes);
        // ⭐ `D145`: the live camera's axes decide the motion (the boot-latched `WorldAxisB` is gone).
        // ⭐ ONE writer for an applied step. ⛔ THE FINGER MOVES THE MODEL — the follower re-reads
        // it every frame, so the inertia stays a filter on the way to the screen rather than the
        // place the position is kept.
        applyWorldStep(st, grip, step);
      } else if (grip.mode === "ROTATE") {
        // The motion — applied LIVE (the flick that could undo it is deleted, `D110`).
        //
        // ⭐⭐⭐ `IN3`: RULE 2bis NOW HAS ITS PRECONDITION — *"with an empty constraint
        // stack"* — and it is asked through `dragRule`, which is also where 2sexte and the
        // two-constraint refusal live. ⛔ In forks A and C the stack is never consulted, so
        // this reads exactly as it did before: today's behaviour is the default.
        //
        // ⚠⚠ AND THE UNWIRED BRANCH DOES NOTHING RATHER THAN THE WRONG THING.
        // `CONSTRAINED_ROTATE`'s driver (`anchor_rotate.ts`, 25 vectors) is built and NOT
        // wired — blocked on a decision `A12` reopened by moving roll to the second
        // touchpoint. ⛔ So a constrained object does not rotate at all, and the readout
        // names the rule that would have run. A fall-through to free rotation would
        // silently break the anchor the user set, which is the defect §1.4's eviction
        // clause exists to prevent, arriving by a different door.
        // ⭐⭐⭐ **FORK C: AN ALIGNED OBJECT TWISTS ABOUT ITS OWN ALIGNED NORMAL** — the
        // owner's answer to *an aligned object, one finger, no target*: **twist about the
        // aligned normal**.
        //
        // ⭐⭐ `anchor_rotate.ts` is reused UNCHANGED, and that is the point: it was built for
        // `A3`/2sexte in fork B, and the geometry of *one constraint, one free DOF* does not
        // care which fork created the constraint. ⚠ What differs is only that fork C can
        // never reach two constraints (the cap), so there is no refusal branch here.
        // ⛔ It REFUSES where the axis points at the camera — the projection has no direction
        // there — and says so, rather than turning the object by an arbitrary amount.
        {
          const fid = st.idOf.get(grip.mesh);
          const fstack =
            fid === undefined
              ? []
              : (st.world.objects.get(fid)?.constraints ?? []);
          // ⛔⛔ **`rotationChannel`, NOT `fstack.length === 1`** — audit, 2026-09-17. The count
          // asked the wrong question: it meant *"is this body aligned?"* and answered *"does it
          // hold exactly one thing?"*, so a body holding a MATE plus an alignment fell through
          // to the FREE rotation below and broke both. ⚠ Unreachable under the cap, armed by
          // `3D2`. ⭐ The REFUSED verdict is the honest third answer, and it is reported.
          const channel = rotationChannel(fstack);
          if (channel.kind === "REFUSED") {
            st.lastVerdict = `align: rotation refused — ${channel.why}`;
            // ⛔⛔⛔ **AND IT RETURNS, WHICH IS THE ENTIRE POINT OF THE FIX.** Setting a verdict
            // and falling through would leave the body FREE-ROTATING under the refusal — the
            // very behaviour this branch exists to prevent, with a readout that says the
            // opposite. ⚠ That is the readout-that-lies shape, and it would have been worse
            // than the defect it replaced: the HUD would have reported the refusal while the
            // mate broke.
            grip.prev = s;
            st.hudDirty = true;
            return;
          } else if (channel.kind === "TWIST") {
            const axis = channel.axis;
            // ⭐⭐ **THE GREY LINE COVERS THIS GESTURE TOO** — the owner, 2026-09-23: *"also when
            // there is rotation with the dx of the first touch in rotation mode (on aligned
            // follower object)."* ⛔ Recorded where the turn is APPLIED, exactly as the second
            // touchpoint's roll is: both channels twist about the SAME constraint axis, and a
            // gizmo that learned it from only one of them would go blank on the other.
            noteTurnAxis(st, st.idOf.get(grip.mesh), TURN_ROLL, axis);
            // ⛔⛔⛔ **D57 REACHES THE FIRST TOUCHPOINT AT LAST** -- device-reported 2026-09-22:
            // *"there are some cases where the dx delta position and the yaw rotation direction
            // are inverted."*
            //
            // ⛔⛔ **MEASURED, NOT REASONED.** A sweep of the FREE yaw over 408 camera positions
            // found **zero** inversions -- it turns about the world vertical and cannot reverse.
            // A sweep of THIS channel over alignment orientations found **12 of 24**, exactly the
            // half a cosine predicts. ⭐ *"Same symptom" never means "same cause"*: the report
            // said *yaw*, and the culprit was the twist.
            //
            // ⭐⭐ **THE CAUSE IS THE PROJECTION D57 ALREADY DELETED FROM THE OTHER CHANNEL.**
            // `constrainedDragAngle` maps the drag onto the NEAR-SIDE screen direction, whose
            // x component reverses as the alignment axis swings past horizontal-on-screen. The
            // second touchpoint had exactly this, and the owner dictated the cure in 2026-09-19's
            // own words: *"If there are cos or sin projections on axis based on orientation,
            // remove those projections."* ⚠ It was applied to one channel and not its twin --
            // `METHOD`: *when a rule has two channels, the correction belongs to the RULE.*
            //
            // ⚠⚠ **WHAT IT COSTS, STATED**: `dy` no longer contributes. The old mapping let a
            // hand drag ALONG the near-side direction whatever its screen orientation; now a
            // vertical drag does not twist. ⛔ That is the trade D57 already made once, and it
            // buys the property the owner asked for: `dx` and the turn always agree.
            let twistSign = grip.twistSign;
            if (twistSign === undefined) {
              // ⭐ LATCHED AT FIRST USE, exactly as the second touchpoint latches its own --
              // recomputed per frame it would flip mid-drag as the axis swung through
              // horizontal-on-screen, which is worse than being inverted consistently.
              twistSign = rollSignFor(screenFrame(st), axis);
              grip.twistSign = twistSign;
            }
            const twist = flatTwistAngle(
              grip.rec.step.dx,
              twistSign,
              st.cfg.gainRotateConstrained,
            );
            if (twist !== 0) {
              if (
                incrementRadians(st.cfg.rotationIncrementDeg) !== null &&
                fid !== undefined
              ) {
                st.rotationTally.add(fid, "twist", axis, twist);
              } else {
                setModelOrientation(st, 
                  grip.mesh,
                  rotateAboutAxis(modelOrientation(st, grip.mesh), axis, twist),
                );
              }
              // ⛔⛔ **DEVICE-REPORTED 2026-09-17: *"there is no slerp during rotation: did you
              // wire it?"*** ⭐ It was wired, in both modes — and this line used to SETTLE the
              // snap, so the first finger movement past the deadband landed it instantly. In
              // `TRANSLATE` the holder writes only POSITION, so the animation survived and the
              // slerp was visible; in `ROTATE` the twist wrote the orientation and killed it.
              // That is why it looked wired in one mode and missing in the other.
              // ✅ NOW IT RIDES ALONG: the twist is a WORLD rotation about the aligned axis, so
              // composing it onto both ends of the animation keeps the snap travelling AND
              // accumulates the turn. ⚠ Not a compromise: a
              // hand twisting while the object swings into place gets both, which is what both
              // gestures asked for.
              if (fid !== undefined) {
                // ⛔ ONE definition of the world rotation, borrowed from the rule that applies
                // it — a second `qFromAxisAngle` here would be free to disagree with it.
                // ⚠ `ride` ignores a body with no snap in flight, so no guard is needed here.
                st.alignSnaps.ride(fid, rotateAboutAxis(IDENTITY, axis, twist));
              }
              st.lastVerdict = `align: twist ${((twist * 180) / Math.PI).toFixed(1)}° about the alignment`;
              // ⭐⭐ THE SWAY — the line whose absence the owner spotted. An aligned object
              // turning is still an object turning, and the scene reacts to it.
              noteSpin(st, grip, s.t);
            }
            grip.prev = s;
            st.hudDirty = true;
            return;
          }
          // ⚠ An UNALIGNED object in fork C rotates freely — fork A's 2bis, which is what
          // *"fork C branches from fork A"* means when no alignment exists. It also matches
          // 2bis's own precondition (*an empty constraint stack*), so nothing is special-cased.
        }
        //
        // ⭐ APPLIED AS A PER-FRAME INCREMENT onto the pose the object already has,
        // about the screen axes latched at press. Every step is a small world-frame
        // rotation, so the two axes never end up nested inside one another.
        const cur = modelOrientation(st, grip.mesh);
        // ⭐⭐⭐ A12: ONE TOUCHPOINT IS ALWAYS YAW/PITCH. There is nothing left to decide
        // here. Roll moved to the SECOND touchpoint's x, so the two gestures are no longer
        // the same hand shape — and everything that existed to tell them apart is gone:
        // 2quinte's circle fit, the `rollAngle` commit threshold, the provisional
        // yaw/pitch, A8's rebase to the circle's start, and the jump all of it produced.
        // ⛔ `roll.ts` is deleted; `anchor_rotate.ts` stays built and off the gesture path.
        // ⭐ TALLIED PER AXIS, and the angles restated here are `screenPlaneRotation`'s own,
        // negation and all. ⛔ The settle corrects what the gesture DEMANDED, so a sign that
        // disagreed with the rule would land the body on a multiple of the wrong quantity.
        const radPerPx = st.cfg.gainRotateFree / mmToPx(1);
        const freeId = st.idOf.get(grip.mesh);
        // ⭐⭐⭐ **PURPLE AND MAROON** — the owner, 2026-09-23: *"create purple and marron axis for
        // yaw and pitch rotation on unaligned object in rotation mode."*
        // ⛔⛔ **PER CHANNEL, FROM THE DEADBANDED STEP THE TURN ITSELF USES** (`grip.rec.step`, not
        // the raw delta): a `dx`-only drag yaws and must light purple ALONE, exactly as a `dx`-only
        // translation lights red alone. ⚠ Reading the raw pointer delta here would light both lines
        // on a resting finger's noise — the mistake the translation channels already made once.
        // ⭐ The axes are `screenPlaneRotation`'s own — the gravity frame's `up` and `right` — taken
        // from the same `grip.frame` the rotation below is handed, so the line cannot disagree with
        // the turn it describes.
        // ⭐ `rotationFrameOf` picks the frame (the boot-latched `WorldAxisB`, the only one since
        // `D109`). ⚠ ONE lookup for the lines, the tally and the turn — they restate each other's axes.
        const turnFrame = rotationFrameOf(st, grip.frame);
        // ⭐⭐ `D185`: the pitch's sense — the pressed side follows the finger, as a wheel seen from the camera does.
        const pitchSign = pitchSense(turnFrame.right, screenFrame(st), grip.pressSide, st.cfg.pitchSideConeDeg);
        if (grip.rec.step.dx !== 0)
          noteTurnAxis(st, freeId, TURN_YAW, turnFrame.up);
        if (grip.rec.step.dy !== 0)
          noteTurnAxis(st, freeId, TURN_PITCH, turnFrame.right);
        const incOnFree =
          incrementRadians(st.cfg.rotationIncrementDeg) !== null &&
          freeId !== undefined;
        if (incOnFree) {
          // ⭐ The angles restated here are `screenPlaneRotation`'s own, negation and all, about
          // the same two frame axes — pinned to the real function by
          // `tests/rotation_increment.test.ts`, because this is a place a sign is restated.
          st.rotationTally.add(
            freeId,
            "yaw",
            turnFrame.up,
            -grip.rec.step.dx * radPerPx,
          );
          st.rotationTally.add(
            freeId,
            "pitch",
            turnFrame.right,
            -grip.rec.step.dy * radPerPx * pitchSign,
          );
        } else
          setModelOrientation(st, 
            grip.mesh,
            screenPlaneRotation(
              cur,
              turnFrame,
              // ⭐⭐ Deadbanded (A11) — the raw delta is what made a held object turn
              // while the hand was still.
              grip.rec.step.dx,
              grip.rec.step.dy,
              // ⭐ THE REAL GAIN, from the config, in radians per MILLIMETRE.
              // ⛔ A hard-coded `DIAGNOSTIC_RAD_PER_PX` used to live in this file,
              // deliberately kept OUT of the config so a debug value could not leak
              // into production. Carried rule `L1`: a tuning value living in both a debug
              // tool and production silently drifted.
              st.cfg.gainRotateFree / mmToPx(1),
              pitchSign,
            ),
          );
      }
      // ⭐⭐ THE ROTATIONAL SWAY. Same shape as the translational one: it fires when the
      // object STARTS turning and whenever the turn AXIS swings by more than
      // `rotateSwayTurnDeg` — a reversal being a 180° axis change.
      if (grip.mode === "ROTATE") {
        noteSpin(st, grip, s.t);
      } else {
        grip.spinSway.push(modelOrientation(st, grip.mesh), s.t, false);
      }

      grip.prev = s;
      st.hudDirty = true;
      return;
    }

    if (info.type === PointerEventTypes.POINTERUP) {
      // ⭐ (2026-10-11) the held input's first touch on a placed part lifting: the input goes on (`holdRelease` → "FIRST")
      if (st.hold !== null && e.pointerId === st.hold.first) holdRelease(st, e.pointerId);
      const verdict = grip.rec.release(s);
      st.lastVerdict = describe(verdict);

      // ⛔⛔ THE FLICK IS DELETED (`D110`, 2026-09-27) — its rotation reset with it. ⛔ `tapMeaning`,
      // `D39`'s re-tap undo and the FOLLOW double tap are deleted too (`D106`/`D107`): a holder's own
      // release never aligns; the second touch's TAP does, in the OUTSIDE branch above.
      let alignedByThisTap = false;
      // ⚠⚠ `D68` — THE HONEST HALF. A tap consumed by an alignment toggles NOTHING, so the
      // fact is cleared before either branch can set it: undoing a toggle that never happened
      // would flip the mode the hand actually had.
      st.lastTapToggled = false;
      // ⭐⭐⭐ `D111` — **A DOUBLE TAP ON A BODY UNDOES THE LAST ACTION** (the owner, 2026-09-27),
      // and it no longer flies the camera home: that stays on EMPTY space. ⚠ Cost: an orbit stuck
      // close in with a body filling the view must find a patch of empty space to reset.
      // ⭐ The pair costs ONE episode: the second tap is excluded by the ledger.
      // ⭐⭐ `D141`: and only on the body the last action MOVED — a double tap elsewhere undoes nothing.
      if (verdict.kind === "DOUBLE_TAP" && !alignedByThisTap) {
        // ⭐ `D158`: nothing to mark — the first tap changed nothing and costs 0; the second's gesture
        // costs 1 if the undo landed and 0 if it did not (`D157`).
        undoLast(st, st.idOf.get(grip.mesh) ?? null);
      }
      // ⛔⛔ *"A single tap by one only touchpoint ANYWHERE also toggles"* — and
      // *anywhere* includes the object the touchpoint was carrying, which is this branch.
      // ⭐⭐ THE VERDICT IS READ, NOT RE-JUDGED: the recognizer already recorded this tap in
      // the SHARED `TapHistory` (`recognizer.ts` does it), so calling `noteTap` here would
      // record the same tap twice and corrupt the double-tap pairing for every consumer.
      // ⛔⛔ **`D66` — AND NOTHING SETTLES UP HERE ANY MORE**: `D58`'s press toggle and its
      // rollback are deleted with the press toggle.
      // ⛔⛔ `D108`: a tap on the object the touchpoint was carrying NO LONGER TOGGLES the mode — only a
      // tap on EMPTY space does (`tapTogglesMode`); `lastTapToggled` was cleared above for this release.
      forgetAnchor(st, routed.seq);
      // ⭐⭐ **THE GESTURE ENDS, AND THERE IS NOTHING TO TIDY UP.** The body is already on an
      // increment — it has never been anywhere else — so a release needs no correction of its
      // own. ⛔ That is the whole difference from the three formulations before this one, each
      // of which had to decide what to do about a pose it should not have allowed.
      {
        const endId = st.idOf.get(grip.mesh);
        if (endId !== undefined) st.rotationTally.clear(endId);
      }
      st.router.release(e.pointerId);
      st.held.delete(e.pointerId);
      st.hudDirty = true;
    }
  });

  // ⭐⭐ THE RELEASE, observed AFTER every rule: the episode is classified with what the release DID,
  // and the gesture ends when nothing is left down (`D111`, `D112`).
  st.scene.onPointerObservable.add((info) => {
    if (info.type !== PointerEventTypes.POINTERUP) return;
    const e = info.event as PointerEvent;
    const facts = st.episodeFacts.get(e.pointerId);
    st.episodeFacts.delete(e.pointerId);
    const unaligned = st.episodeUnaligned.delete(e.pointerId);
    // ⛔ Free Flow escapes the score (`D101`): nothing is counted while the cursor drag is on.
    // ⭐⭐ `D115`: a two-touch action (an alignment, an unalign, an unsnap) costs ONE; ⭐ `D187`: it lands when triggered.
    // ⭐ `D187`: the same touch, RE-classified with what its release did (an unalign), under its press key.
    const key = st.episodeKey.get(e.pointerId) ?? --st.episodeSeq;
    st.episodeKey.delete(e.pointerId);
    st.episodes.touch(
      key,
      st.cfg.pioneerCursorDrag !== 1 &&
      episodeCounts({
        role: facts?.role ?? null,
        heldAtPress: facts?.heldAtPress ?? 0,
        pressedAnotherBody: facts?.pressedAnotherBody ?? false,
        unaligned,
        continuesAnother: st.episodeContinued.delete(e.pointerId),
      }),
      // ⭐ Pressed while a body was held: it completes a two-touch action, and uses up that hold.
      (facts?.heldAtPress ?? 0) > 0,
    );
    // ⭐ `D187`: a tap's action (an unalign, an alignment) is triggered BY this release — it lands now.
    st.episodes.sync(gestureChangedSoFar(st));
    st.hudDirty = true;
    // ⭐⭐ `D159`: a Space freeze's drag release does NOT end the gesture — the action it becomes lands once.
    if (st.gestureSpan.release(e.pointerId) && !st.freezeCarry) {
      // ⭐⭐ `D158`: a gesture that changed nothing lands no episode.
      st.episodes.gestureEnded(endGesture(st));
    }
  });
}


/**
 * ⭐⭐ (2026-10-11) the one pointer down, if it is held on a PART (placed in its goal or not; ⛔ never the orbited piece) — the held second touch's
 * first touch, as a pointer on empty space would be; `null` otherwise (another outside pointer than `except` — the second touch pressing —,
 * more than one). ⭐ First placed parts only; widened the same day (*"CTRL on the another face … the drag freezes the scene"*: a part not in its
 * goal froze it still)
 */
function partFirst(st: SceneState, except: number | null = null): number | null {
  if (st.router.outside().some((q) => q.id !== except)) return null;
  const objs = st.router.objects();
  if (objs.length !== 1) return null;
  const grip = st.held.get(objs[0]!.id);
  return grip !== undefined && grip.mesh !== st.greenBox ? objs[0]!.id : null;
}

/**
 * ⭐ §2 rule 1's ORBIT DRAG, one step — from empty space, and (prototype (green box)) from a finger on a piece locked in its goal.
 * ⭐ Prototype (the owner: *"invert the inputs direction for the box"* — *"and invert input directions for the camera orbit as
 * well"*): with a green box, the orbit drag turns the other way — the camera follows the box, so both orbits invert together;
 * its own gains, yaw and pitch (*"the green box orbits too fast"*), slower inside the leash (`boxDragGains`). ⚠ The zoom (pinch,
 * wheel) is unchanged.
 */
export function orbitDragStep(st: SceneState, pointerId: number, s: Sample, prev: Sample, dxOnly = false): void {
  const dx = s.x - prev.x;
  // ⭐ (2026-10-11, *"first touch's dy while the second is held: ignored"*) — the way in and the orbit round the piece take dx only
  const dy = dxOnly ? 0 : s.y - prev.y;
  // ⭐⭐ (2026-10-12, *"… keep on rolling the resting piece on this quad until the next delta position"*) — a drag drops the quad tapped:
  // the yellow quad is the candidate again
  if (dx !== 0 || dy !== 0) st.orientShown.clicked = null;
  if (st.greenBox !== null) {
    // ⭐ The orbit finger's own tracker — the camera reads from it whether the input is MOVING, per axis.
    if (st.orbitMotion === null || st.orbitMotion.pointerId !== pointerId) {
      // ⭐ (the third audit) the drag's own deadband (`orbitDeadbandMm`), apart from the tracker the camera reads MOVING from
      st.orbitMotion = { pointerId, tracker: new MotionTracker(st.cfg), band: new MotionTracker({ ...st.cfg, motionDeadbandMm: st.cfg.orbitDeadbandMm }, st.cfg.orbitBandRestMs, true) };
      // ⭐ prototype (2026-10-06): the yaw gain around the piece (`referenceYawGain`, one for the game) applies to a drag that STARTS
      // orbiting around the piece — a drag already running at the alignment tap keeps its speed to its end. ⭐⭐ (2026-10-08, the owner:
      // *"the camera yaw speed is identical on way in and on piece orbit so there is no visual discontinuity"*) …or on the WAY IN: one speed
      // through the way in and the orbit that follows, whichever a drag starts in
      st.pieceYawGainDrag = st.pieceOrbit !== null || st.pieceEntry !== null || st.hold?.mode === "WAY" ? st.pieceYawGain : 1;
      // ⭐ (2026-10-10, the owner: *"there seem to be the need for a bigger dx to trigger the first roll than afterwards"* → *"build the two
      // changes"*) a NEW drag starts its roll count fresh — no leftover from the last drag, so its first roll takes one step like every other.
      // ⭐ (2026-10-11) …except a first touch pressed again while the second is held: the same input goes on (*"continuation"*)
      if (st.hold === null) st.orbitRollAcc = 0;
    }
    st.orbitMotion.tracker.push(s);
    st.orbitMotion.band.push(s);
    // ⭐ the inside-the-leash gains (`greenDragGains`).
    const g = greenDragGains(st);
    const yaw0 = st.orbit.yaw;
    const v0 = st.orbit.elevation;
    // ⭐ the owner, 2026-10-04: *"For the orbit, invert the sense of the delta position y input"* — dy enters with its own sign now
    // (it was negated: finger UP raised the green piece on the rings; now finger DOWN does). dx unchanged.
    // ⭐ prototype (2026-10-06): orbiting around the piece, the yaw gain is LOWERED so the scene slides as far as before (`referenceYawGain`)
    // ⭐⭐ (2026-10-13, the second audit) through §1.1's per-axis DEADBAND (the tracker's step): a finger's wobble on the axis it is not moving
    // emits nothing — raw, it rocked the piece's slide along a sloped part every other event; one band paid once per axis entering motion
    const db = st.orbitMotion.band.step;
    // ⭐⭐⭐ (2026-10-19) THE TURN GOVERNOR (`orbitTravelStep`): the dy cut where the camera would turn faster than the cap per mm of finger
    // ⭐⭐⭐ (2026-10-21) …on the TRAVEL: over a horizontal face, through the middle, the dy turns the camera half round while the piece waits (the top face pause)
    // ⭐⭐⭐ (2026-10-28) AROUND THE ASSEMBLY: Shift + drag's dy is the APPROACH (and nothing else moves); one finger's dy the PITCH, at the dx yaw's pace
    // (the owner's default: *"the same °/mm as the dx yaw"*) — 170° of pitch over the ring parameter
    const asmOn = assemblyOn(st);
    const shiftApproach = asmOn && st.orbitShift && !dxOnly;
    if (shiftApproach) approachInput(st, db.dy / mmToPx(1));
    const dyPx = (dxOnly || shiftApproach ? 0 : db.dy) * st.cfg.boxGainPitch * g.pitch;
    const dvRaw = (dyPx / mmToPx(1)) * st.cfg.gainOrbitElevation * elevationGainScale(st.cfg);
    const dvWant = asmOn ? (((dxOnly || shiftApproach ? 0 : db.dy) / mmToPx(1)) * orbitDegPerMm(st.cfg, st.orbit.elevation, g).yawDegPerMm) / 170 : dvRaw;
    const travel = dvRaw !== 0 ? (asmOn ? { dv: dvWant, du: dvWant } : orbitTravelStep(st, dvRaw, orbitDvPerMm(st))) : { dv: 0, du: 0 };
    const share = dvRaw !== 0 ? travel.dv / dvRaw : 1;
    const yawBefore = st.orbit.yaw;
    const vBefore = st.orbit.elevation;
    // ⭐⭐ (2026-10-25) no yaw while the top face pause's roll is under way (straight above, a dx would turn the picture like a roll)
    st.orbit.drag(shiftApproach ? 0 : pauseYawStep(topPauseOn(st), st.topPause, -db.dx * st.cfg.boxGainYaw * g.yaw * st.pieceYawGainDrag), dyPx * share);
    // ⭐ (2026-10-28) locked close in: a step further out of the face's cone is refused (the piece never goes behind the face)
    if (leavesCone(st, yawBefore, vBefore, st.orbit.yaw, st.orbit.elevation)) st.orbit.reset(yawBefore, vBefore);
    // ⭐ (2026-10-14) the orbit is back: the piece-only hover offset dropped, the camera out of the hover view with this travel
    hoverOrbitStep(st, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1));
    // ⭐ prototype (green box), 2026-10-02: the orbit's own step, recorded for its INERTIA after the finger lifts (`OrbitInertia`).
    st.orbitInertia.record(s.t, st.orbit.yaw - yaw0, travel.du); // ⭐ (2026-10-21) the TRAVEL taken — a coast goes on through the pause
    void v0;
    // ⭐⭐ (2026-10-10, the owner: *"when the piece is outside the white sphere, I want the dx to also drive the roll to the next axis. In 45 degree
    // orbit around the piece I want all the axis to have rolled at least once. direction of the roll : clockwise if dx is to the right"*) —
    // outside the sphere and aligned to the face it would align to now, the orbit's turn (signed by dx) rolls the piece a stop every
    // `orbitRollStepRad` (green 22.5°, turquoise 7.5°): right clockwise on the screen, left counter-clockwise, whatever the ring
    // ⭐ (2026-10-10) …the pink face changed since or not: the roll goes on against the axes it was aligned to
    // ⭐⭐ (2026-10-11) …on the held second touch's way in and round the piece (the sphere is deleted)
// ⏸⏸ (2026-10-12, the owner: *"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held …
// Comment out the way in and the piece orbit accordingly (don't remove it, as it may be useful later on)"*) — kept, commented out:
// ⏸     if (st.hold !== null && st.hold.mode === "WAY" && st.restAligned && st.restRoll !== null && dx !== 0) {
// ⏸       const turned = Math.abs(Math.atan2(Math.sin(st.orbit.yaw - yaw0), Math.cos(st.orbit.yaw - yaw0)));
// ⏸       const r = orbitRollSteps(st.orbitRollAcc, Math.sign(dx) * turned, orbitRollStepRad(st));
// ⏸       st.orbitRollAcc = r.acc;
// ⏸       // ⛔⛔ (2026-10-10, the owner: *"when the dx is too fast, the piece makes strange movements. consider clamping"*) ONE turn in flight: a roll
// ⏸       // only once the last turn landed, one at most — a fast dx crossing several stops drops the rest (queued, they made a turn past 180°,
// ⏸       // eased the SHORT way round, about another axis)
// ⏸       if (r.steps !== 0 && st.restAlign === null) rollRestingFace(st, performance.now(), r.steps > 0 ? 1 : -1, true);
// ⏸     }
    // ⭐⭐ prototype (green box), the owner 2026-10-02: *"apply the sway to other objects when the green piece orbits"* → *"build
    // 1-3"*: the held body's own TRIGGER (`SwayWatcher` on the orbit finger) — but a SWING of the scene, as a block, about the
    // yellow target, in the sense the green piece orbits (`orbitSwingAxis`), `orbitSwayDeg` × the finger's speed factor, on the
    // sway's own spring (`swingBlock`). Each kick is counted for the HUD (`orbitSwayKicks`).
    if (st.orbitSway === null || st.orbitSway.pointerId !== pointerId)
      st.orbitSway = { pointerId, watcher: new SwayWatcher(st.cfg.swayTurnDeg, st.cfg.pointerNoiseMm) };
    const kick = st.orbitSway.watcher.push(s, st.orbitMotion.tracker.current === "MOVING", true);
    if (kick) {
      const kinds = orbitSwayKinds(st.cfg.orbitSwayKind);
      const pose = st.orbit.pose(GREEN_PIECE_ORBIT_ZOOM); // ⭐ the rings as they are — the zoom moves the camera only
      const k = pose.radiusM > 1e-9 ? clampCameraRadiusM(pose.radiusM, st.cfg) / pose.radiusM : 1;
      const c = st.orbitCentreM;
      const t = st.centreBlend.targetM;
      const p = st.greenBox.position;
      const box: Vec3 = [p.x, p.y, p.z];
      const rig: Vec3 = [c.x + pose.offsetM[0] * k, c.y + pose.offsetM[1] * k, c.z + pose.offsetM[2] * k];
      let kicked = false;
      // ⭐ Option 1, the SWING — ⭐⭐ (2026-10-14, the owner: *"Orbit sway: make the sway in degree decrease linearly with the distance of the piece to the gizmo, from the orbit sway value of the slider (at maximum distance) to 0.1 degree (at minimum distance). If the piece is sliding on a part, set to minimum. Also, modify so that the center of the sway is not the gizmo but the barycenter of the placed"* → *"All placed parts"*) about the barycentre of the PLACED parts (the gizmo with none placed), its
      // angle by the piece's distance to the gizmo (`orbitSwayDegAt`: 0.1° at the rings' closest, the slider's at their farthest; 0.1° while it
      // slides on a part)
      if (kinds.swing && st.cfg.orbitSwayDeg > 0) {
        const axis = orbitSwingAxis([c.x, c.y, c.z], box, rig);
        const a = st.pieceAnchor ?? box;
        const range = pieceRingRangeM(st);
        const deg = orbitSwayDegAt(st.cfg.orbitSwayDeg, Math.hypot(a[0] - c.x, a[1] - c.y, a[2] - c.z), range.minM, range.maxM, st.pieceTouching);
        const peakRad = ((deg * Math.PI) / 180) * swayScale(kick.speedMmPerS, st.cfg.swayReferenceSpeedMmPerS);
        const placed: Vec3[] = [];
        for (const id of st.world.objects.keys()) {
          if (!st.goalCommit.has(id)) continue;
          const w = worldPlacementOf(st.world, id);
          if (w !== null) placed.push(w.position);
        }
        const pivot = placedBarycentre(placed) ?? t;
        // ⭐ Its OWN softness (`orbitSwayTauMs`) — quicker than a held piece's, *"I want the sway to resolve quickly"*.
        const impulse = impulseForPeak(peakRad, st.cfg.orbitSwayTauMs / 1000);
        if (axis !== null && impulse > 0) {
          swingBlock(st, st.greenBox, { x: pivot[0], y: pivot[1], z: pivot[2] }, axis, impulse, st.cfg.orbitSwayTauMs);
          kicked = true;
        }
      }
      // ⭐ Option 2 (the owner, 2026-10-02: *"build also option 2"*), the SLIDE — the pieces translate the way the green piece
      // is heading, `orbitSlideMm` on the glass × the finger's speed factor, on the same quick softness.
      if (kinds.slide && st.cfg.orbitSlideMm > 0) {
        const dir = orbitSlideDirection(box, rig);
        if (dir !== null) {
          nudgeOthersWorld(st, st.greenBox, dir, kick.speedMmPerS, st.cfg.orbitSlideMm, st.cfg.orbitSwayTauMs);
          kicked = true;
        }
      }
      if (kicked) {
        st.orbitSwayKicks++;
        st.hudDirty = true;
      }
    }
  } else st.orbit.drag(dx, dy);
  // ⭐ The centre migrates by the SAME finger travel that drives the orbit, so the camera arrives as the gesture progresses
  // rather than on a timer.
  // ⭐⭐ (2026-10-17) …but while the piece's place is solved (no hover), by the travel the solver HONOURS — the frame applies it (`gizmoBlendTravel`)
  if (pieceSolveRuns(st) && st.hover === null) {
    const p = st.gizmoTravelPending ?? { mm: 0, mmX: 0, mmY: 0 };
    st.gizmoTravelPending = { mm: p.mm + Math.hypot(dx, dy) / mmToPx(1), mmX: p.mmX + Math.abs(dx) / mmToPx(1), mmY: p.mmY + Math.abs(dy) / mmToPx(1) };
  } else st.centreBlend.advance(Math.hypot(dx, dy) / mmToPx(1));
  // ⭐ prototype (2026-10-06): …and the camera's glide to the piece, once orbiting around it (`piece_orbit.ts`) — the same travel
  if (st.pieceEntry !== null) st.pieceEntry = advancePieceEntry(st.pieceEntry, Math.hypot(dx, dy) / mmToPx(1));
  // ⭐ (2026-10-10) …and the view's re-aim to the piece: dx ALONE (a pure dy leaves the piece where it is on the screen)
  if (st.pieceAim !== null) st.pieceAim = advancePieceAim(st.pieceAim, dx / mmToPx(1));
  // …and the way back to the centre orbit (2026-10-07), the same travel
  if (st.centreReturn !== null) st.centreReturn = advanceCentreReturn(st.centreReturn, Math.hypot(dx, dy) / mmToPx(1));
  syncCentre(st);
  applyCamera(st);
}

/**
 * ⭐⭐ prototype — **THE FACE HIT BECOMES THE RESTING FACE**, aligned (§13): a tap on the orbited piece (any touch, any button), or the desktop's
 * key pressed over it (2026-10-11). ⭐ (2026-10-09) the pink face unchanged since the last alignment: its rolls carry over to the new resting
 * face, at once. One episode; the highlights shown, then held and faded. `false` if nothing was aligned.
 */
function selectRestingFace(st: SceneState, faceId: string): boolean {
  if (st.orbitPiecePlaced) return false; // ⭐ (2026-10-14) a piece placed in its goal keeps its faces
  // ⭐⭐⭐ (2026-10-15, the owner: *"allow the resting face selection by tap on piece only if quads are shown"*)
  if (!quadTapsAllowed(st.restingQuads?.shown === true)) return false;
  // ⭐⭐ (2026-10-14, the owner: *"a tap on the green-turquoise piece will select it as the resting face and align it with the current yellow-highlighted quad or part's face"*) — aligned to the direction SHOWN now (the yellow quad; ⛔ the gizmo's supporting face is deleted, 2026-10-15)
  // — ⛔ it aligned to the direction last TAPPED, whatever was yellow
  const shown = shownDirection(st);
  if (shown !== null) st.pinkDir = shown;
  const carry = st.restRoll !== null && st.restRoll.key === restTargetKey(st) ? st.restRoll.rolls : 0;
  if (!(restOnTappedFace(st, faceId) && alignRestingFace(st, performance.now(), carry))) return false;
  st.episodes.touch(--st.episodeSeq, true, true);
  st.episodes.sync(true);
  st.lastVerdict = st.lastVerdict.replace("orbit: tap 1 — ", `orbit: ${faceId} — the resting face now; `);
  st.hudDirty = true;
  return true;
}
