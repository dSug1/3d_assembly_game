/**
 * THE POINTER HANDLER — every press, move and release, routed by `IN2` and dispatched to the rules; it holds calls, not rules. ⛔⛔ (2026-11-02) no
 * press holds a part any more: the parts' translation, rotation, alignment, snap and undo are deleted (the code is at commit `d8134eb`) — every press
 * is the orbit's, the approach's, the pinch's, the held second touch's, the slide's or the quads'.
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
import { hoverDragStep, hoverOrbitStep, hoverPressNote, hoverRelease, slideModeOn } from "./hover_wiring";
import { GREEN_PIECE_ORBIT_ZOOM, orbitSlideDirection, orbitSwayDegAt, orbitSwayKinds, orbitSwingAxis, placedBarycentre } from "../input/green_box";
import { clampCameraRadiusM } from "../input/pinch";
import { EMPTY_PRESS_MOVES_TARGET, goalLocked, orbitTargetOnPress, orbitTargetOnRelease } from "../input/goal_lock";
import type { Sample } from "../input";
import { alignRestingFace, orbitTravelStep, greenDragGains, orbitDvPerMm, restOnTappedFace, restTargetKey, topPauseOn } from "./green_box_wiring";
import { pauseYawStep } from "../input/top_pause";
import { isApproachKey, ORBIT_PITCH_MAX_RAD } from "../input/assembly_orbit";
import { slideArmedAfter } from "../input/hover";
import { fingerOnAxes } from "../input/orbit_frame";
import { approachInput, approachRelease, assemblyOn, leavesCone, orbitTravelMm, orbitZenithStep, viewTurnGoverned } from "./assembly_wiring";
import { orbitDegPerMm } from "../input/follow_camera"; // ⏸ (2026-10-12) orbitRollStepRad, rollRestingFace — with the commented-out way in
import { restingFaceTap } from "../input/orbit_tap";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { isTapRelease, SwayWatcher, MotionTracker, swayScale, impulseForPeak } from "../input";
import { type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { faceFromPickedNormal } from "../core/face_pick";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { holdFirstPress, holdMove, holdRelease, holdSecondPress } from "./hold_wiring";
import { episodeCounts } from "../input/episode_ledger";
import { beginGesture, endGesture, gestureChangedSoFar } from "./gesture_wiring";
import { type SceneState } from "./scene_state";
import { applyCamera, pinchPair, recomputeOrbitCentre, retargetGizmo, syncCentre, updatePinch } from "./camera_rig";
import { sampleOf } from "./hud_paint";
import { nudgeOthersWorld, swingBlock } from "./sway_pass";
import { advanceCentreReturn, advancePieceAim, advancePieceEntry } from "../input/piece_orbit"; // ⏸ (2026-10-12) orbitRollSteps — with the commented-out way in

export function installPointerHandler(st: SceneState): void {
  // ⭐⭐ (2026-10-29, *"A should replace shift"*) THE APPROACH KEY held (`isApproachKey`): its release ends the approach (its coast); a lost window forgets it
  const approachKey = (down: boolean) => (e: KeyboardEvent) => {
    if (!isApproachKey(e.key)) return;
    if (!down && st.orbitApproachKey && assemblyOn(st)) approachRelease(st);
    st.orbitApproachKey = down;
  };
  window.addEventListener("keydown", approachKey(true));
  window.addEventListener("keyup", approachKey(false));
  window.addEventListener("blur", () => {
    st.orbitApproachKey = false;
  });
  // ⭐⭐ THE GESTURE'S FIRST DOWN, observed BEFORE every rule (`insertFirst`): the model is snapshotted as it stands, so the score can tell a gesture
  // that changed something from one that did not (`D158`).
  st.scene.onPointerObservable.add(
    (info) => {
      if (info.type !== PointerEventTypes.POINTERDOWN) return;
      const e = info.event as PointerEvent;
      // ⭐ `D112`: the clock starts at the first press after boot (`SCORE.md` §6), not at load.
      if (st.sceneStartMs === null) st.sceneStartMs = performance.now();
      if (st.gestureSpan.press(e.pointerId)) beginGesture(st);
    },
    undefined,
    true,
  );

  st.scene.onPointerObservable.add((info) => {
    const e = info.event as PointerEvent;
    const s = sampleOf(e);
    // ⭐⭐ (2026-10-28) A held with the mouse (or a touchpad) — ⭐ 2026-10-29, ⛔ Shift: around the assembly the drag's dy is the APPROACH
    // (`approachInput`); the button's release starts its coast
    st.orbitShift = e.pointerType === "mouse" && st.orbitApproachKey;
    if (info.type === PointerEventTypes.POINTERUP && e.pointerType === "mouse" && assemblyOn(st)) approachRelease(st);

    // ⭐ The noise meter runs before everything else and independently of it: it must see the raw stream whatever the touchpoint turns out to drive.
    if (info.type === PointerEventTypes.POINTERDOWN && st.noisePointer === null) {
      st.noisePointer = e.pointerId;
      st.noise.reset();
    }
    if (e.pointerId === st.noisePointer) {
      // ⚠ DOWN and MOVE only, named explicitly: Babylon's `POINTERPICK`, `POINTERTAP` and `POINTERDOUBLETAP` carry the SAME event.
      if (info.type === PointerEventTypes.POINTERUP) st.noisePointer = null;
      else if (info.type === PointerEventTypes.POINTERDOWN || info.type === PointerEventTypes.POINTERMOVE) st.noise.push(s);
    }

    // ⭐ The gap between two consecutive move events for one pointer — the worst in the last second, on the HUD.
    if (info.type === PointerEventTypes.POINTERDOWN || info.type === PointerEventTypes.POINTERMOVE) {
      const seen = st.eventGaps.get(e.pointerId);
      if (seen !== undefined && info.type === PointerEventTypes.POINTERMOVE) {
        seen.gaps.push({ t: s.t, ms: s.t - seen.last });
        while (seen.gaps.length > 0 && s.t - seen.gaps[0]!.t > 1000) seen.gaps.shift();
      }
      st.eventGaps.set(e.pointerId, { last: s.t, gaps: seen?.gaps ?? [] });
    }
    let partTap = false;
    if (info.type === PointerEventTypes.POINTERUP) {
      hoverRelease(st, e.pointerId); // ⭐ (2026-10-14) the finger lifted: the hover ends — back to the orbit
      // ⭐⭐ (2026-10-13, §11nonies) the press on a placed part released: a TAP moves the gizmo there (`orbitTargetOnRelease`), a drag does not
      const pc = st.pendingPartCentre;
      // ⭐ (2026-11-02, the third audit's C1) this release is the placed part's tap — never the cube's below as well
      partTap = pc !== null && pc.pointerId === e.pointerId;
      if (pc !== null && pc.pointerId === e.pointerId) {
        st.pendingPartCentre = null;
        const to = orbitTargetOnRelease(pc.target, isTapRelease(pc.t, pc.x, pc.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop)));
        // ⭐⭐⭐ (2026-10-16) and the rig turned onto the face the tap hit, at the camera's yaw — ⭐ (2026-11-01) not in the slide mode: the gizmo rides the slide
        if (to !== null && st.hover === null) retargetGizmo(st, to, pc.normal, pc.host ?? null);
      }
      st.eventGaps.delete(e.pointerId);
      st.pointerTypeOf.delete(e.pointerId);
    }

    // ⭐⭐ (2026-10-12, §21) A PRESS IN THE ORIENTATION CUBE'S WINDOW IS THE CUBE'S — before the router: it never orbits
    // ⭐⭐ (2026-10-12) a press on a resting-face quad is the quads' (a tap aligns to its side; a drag orbits)
    if (restingQuadPointer(st, info.type, e, s, (id, ss, prev) => orbitDragStep(st, id, ss, prev))) {
      st.hudDirty = true;
      return;
    }

    if (info.type === PointerEventTypes.POINTERDOWN) {
      const pick = info.pickInfo;
      // ⭐⭐⭐ (2026-10-11, `RESTING_FACE_ALIGNMENT.md` §20) THE HELD SECOND TOUCH — *"Second touch on mobile equals right click on desktop"*:
      // the right button (`MOUSE_SECOND_ID`), or a finger pressed while ONE other is down, is the SECOND touch — unless it lands on the orbited
      // piece (*"anywhere (except the green and turquoise pieces themselves)"*; around the assembly there too: close in the piece fills the
      // screen); while it is held, the next press is the FIRST touch again (*"first touch release and re-press does nothing"*).
      const onOrbited = st.greenBox !== null && pick?.hit === true && pick.pickedMesh === st.greenBox;
      const holdRole: "SECOND" | "FIRST" | null =
        st.greenBox === null
          ? null
          : st.hold !== null
            ? st.hold.first === null && e.pointerId !== st.hold.second
              ? "FIRST"
              : null
            : e.pointerId === MOUSE_SECOND_ID || ((!onOrbited || assemblyOn(st)) && e.pointerType !== "mouse" && st.router.outside().length === 1)
              ? "SECOND"
              : null;
      // ⭐⭐ (2026-10-09) the first touch (or the left button) on the orbited piece: the face it hit — the resting face if it is released as a TAP
      // (`restingFaceTap`, at the release); ⭐ (2026-10-11) the second touch's tap on it too
      if (onOrbited && e.pointerId !== MOUSE_SECOND_ID) {
        const n = pick?.getNormal(true);
        const face = n && st.greenBox !== null ? faceFromPickedNormal(st.world, st.greenBox.name, [n.x, n.y, n.z] as Vec3) : null;
        st.pieceFaceTap = restingFaceTap(onOrbited, true, false) && face !== null ? { pointerId: e.pointerId, faceId: face.faceId } : null;
        // ⭐⭐ (2026-10-14, the HOVER) the first touch on the piece: its drag may slide (`hoverDragStep`, decided past the tap's slop)
        if (holdRole === null) hoverPressNote(st, e.pointerId, s);
      } else if (holdRole === null && e.pointerId !== MOUSE_SECOND_ID && slideModeOn(st) && st.hover !== null && st.hover.pointerId === null) {
        // ⭐ (2026-11-02, the third audit's B10) the slide on with no finger on it: a first press anywhere noted NOW — its drag slides from the press, its
        // deadband paid once (⛔ noted at its first move: the press → first-move travel lost, a second band paid)
        hoverPressNote(st, e.pointerId, s);
      }
      st.pointerTypeOf.set(e.pointerId, e.pointerType);
      // ⛔⛔ (2026-11-02, *"remove the translation and the rotation of the parts … I will only keep orbit and sliding"*) — NO PRESS HOLDS A PART:
      // every press is the orbit's, on a part as on empty space (the router's OBJECT role is never asked for)
      const routed = st.router.press(e.pointerId, s, null);
      // ⭐ `D187`: classified NOW with what the press knows — the episode lands the moment its action is triggered, not at the release
      {
        const key = ++st.episodeSeq;
        st.episodeKey.set(e.pointerId, key);
        st.episodes.touch(key, episodeCounts({ role: routed.role, heldAtPress: 0, pressedAnotherBody: false, unaligned: false, continuesAnother: false }), false);
      }
      // ⭐⭐ (2026-10-13, §11nonies) a FIRST press alone on a part PLACED in its goal NOTES the point — its TAP moves the gizmo there at the release
      // (`orbitTargetOnRelease`; the 2D curve's orbit — around the assembly the ray places the gizmo), a drag orbits
      const hitMesh = pick?.hit === true && pick.pickedMesh !== null && pick.pickedMesh !== st.greenBox ? pick.pickedMesh : null;
      const hitId = hitMesh === null ? undefined : st.idOf.get(hitMesh);
      const hitAt = hitMesh !== null && pick?.pickedPoint ? ([pick.pickedPoint.x, pick.pickedPoint.y, pick.pickedPoint.z] as Vec3) : null;
      const newTarget = orbitTargetOnPress(hitId !== undefined && st.router.all().length === 1 && holdRole === null, e.pointerType !== "mouse" || e.isTrusted, goalLocked(hitId, st.goalCommit, true), hitAt);
      const hitN = newTarget !== null ? pick?.getNormal(true) : null;
      st.pendingPartCentre = newTarget !== null ? { pointerId: e.pointerId, target: newTarget, normal: hitN ? [hitN.x, hitN.y, hitN.z] : null, host: hitId ?? null, x: s.x, y: s.y, t: s.t } : null;

      if (st.router.outside().length === 1) {
        // ⭐⭐ DEFERRED, NOT IMMEDIATE: a second touchpoint turns this into a PINCH, and the two never land in the same instant. ⭐ prototype
        // (green box), 2026-10-02: an empty-space press does NOT move the yellow target (`EMPTY_PRESS_MOVES_TARGET`, switched off).
        st.pendingCentre = EMPTY_PRESS_MOVES_TARGET && st.cfg.orbitCentreGraceMs > 0 ? { x: e.clientX, y: e.clientY, at: s.t } : null;
        if (EMPTY_PRESS_MOVES_TARGET && !st.pendingCentre) recomputeOrbitCentre(st, e);
      } else {
        // ⛔ A SECOND ONE ARRIVED: this is a pinch — the camera keeps orbiting whatever it was already orbiting.
        st.pendingCentre = null;
      }
      const p = pinchPair(st);
      if (p) {
        st.pinch.begin(p[0], p[1]);
        // ⚠ Captured HERE, once: the zoom is a ratio against the gesture's start, never an accumulation (`input/pinch.ts`).
        st.zoomAtPinchStart = st.zoom;
      }
      // ⭐⭐⭐ (2026-10-11) the held second touch's input starts — or the first touch pressed again while it is held. ⭐ A FINGER's press on a PLACED
      // part notes where: its TAP moves the orbit centre there (`holdRelease`), as a first touch's press does
      if (holdRole === "SECOND") {
        const onPlaced = e.pointerId !== MOUSE_SECOND_ID && hitId !== undefined && goalLocked(hitId, st.goalCommit, true);
        const centreAt: [number, number, number] | null = onPlaced && hitAt !== null ? [hitAt[0], hitAt[1], hitAt[2]] : null;
        const firstNow = st.router.outside().find((q) => q.id !== e.pointerId)?.id ?? null;
        const centreN = centreAt !== null ? pick?.getNormal(true) : null;
        holdSecondPress(st, e.pointerId, s.x, firstNow, centreAt, centreN ? [centreN.x, centreN.y, centreN.z] : null, centreAt !== null ? (hitId ?? null) : null);
        // ⭐ (2026-10-28) on the orbited piece its tap is the resting face's, never the yellow quad's
        if (onOrbited && st.hold !== null) st.hold.pressActed = true;
      } else if (holdRole === "FIRST") holdFirstPress(st, e.pointerId, s.x);
      st.hudDirty = true;
      return;
    }

    // ⛔ Everything past here is a MOVE or an UP for a touchpoint already latched — every one of them the orbit's.
    const routed = st.router.get(e.pointerId);
    if (!routed) return;
    if (info.type === PointerEventTypes.POINTERMOVE) {
      const prev = routed.last;
      st.router.move(e.pointerId, s, null);
      // ⭐⭐⭐ (2026-10-11) the held second touch's input owns its two touches' moves: undecided (nothing moves), the way in / round the piece (the
      // first touch's dx only), the approach, or the zoom
      if (st.hold !== null && (e.pointerId === st.hold.first || e.pointerId === st.hold.second)) {
        holdMove(st, e.pointerId, s, prev, (dxOnly) => orbitDragStep(st, e.pointerId, s, prev, dxOnly));
        st.hudDirty = true;
        return;
      }
      if (st.router.outside().length === 2) updatePinch(st);
      // §2 rule 1: ONE touchpoint — orbit. ⭐⭐ (2026-10-14) …unless it pressed ON the orbited piece and slides
      else if (st.router.outside().length === 1 && !hoverDragStep(st, e.pointerId, s, prev)) orbitDragStep(st, e.pointerId, s, prev);
    } else if (info.type === PointerEventTypes.POINTERUP) {
      st.router.release(e.pointerId);
      // ⛔ A pinch needs BOTH touchpoints: lifting one ends it.
      st.pinch.end();
      const tapped = isTapRelease(routed.pressed.t, routed.pressed.x, routed.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop));
      // ⭐⭐⭐ (2026-10-11) the held second touch lifted: its input ends — consumed, not a tap; ⭐ (2026-10-28) a second finger's TAP on the orbited
      // piece (around the assembly it is the second touch): its resting-face tap still goes on below
      const faceTapHere = st.pieceFaceTap !== null && st.pieceFaceTap.pointerId === e.pointerId && st.hold !== null && st.hold.second === e.pointerId && st.hold.mode === "HELD";
      const held = holdRelease(st, e.pointerId, tapped);
      if ((held === "SECOND" && !faceTapHere) || held === "ENDED") {
        st.hudDirty = true;
        return;
      }
      // ⭐⭐ (2026-10-09) released on the orbited piece as a TAP: the face it hit becomes the resting face and the piece ALIGNS it (one episode)
      const ft = st.pieceFaceTap;
      if (ft !== null && ft.pointerId === e.pointerId) {
        st.pieceFaceTap = null;
        // ⭐⭐ (2026-10-13) a DOUBLE tap on the piece while it is STUCK respawns it (`pieceTapAction`); while the red pop-up shows a single tap is CONSUMED
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
      } else if (st.hold === null && e.pointerId !== MOUSE_SECOND_ID && tapped && !partTap) {
        // ⭐⭐ (2026-10-12, *"a left click / first touch tap on empty is equivalent to a left click / first touch tap on the polyhedron pink face"*) —
        // a TAP elsewhere taps the cube's face SHOWN
        orientTapShown(st);
      }
    }
    st.hudDirty = true;
  });

  // ⭐⭐ THE RELEASE, observed AFTER every rule: the episode is classified with what the release did, and the gesture ends when nothing is left down
  // (`D112`); ⭐ `D158`: a gesture that changed nothing lands no episode.
  st.scene.onPointerObservable.add((info) => {
    if (info.type !== PointerEventTypes.POINTERUP) return;
    const e = info.event as PointerEvent;
    const key = st.episodeKey.get(e.pointerId) ?? --st.episodeSeq;
    st.episodeKey.delete(e.pointerId);
    st.episodes.touch(key, episodeCounts({ role: "OUTSIDE", heldAtPress: 0, pressedAnotherBody: false, unaligned: false, continuesAnother: false }), false);
    // ⭐ `D187`: a tap's action is triggered BY this release — it lands now.
    st.episodes.sync(gestureChangedSoFar(st));
    st.hudDirty = true;
    if (st.gestureSpan.release(e.pointerId)) st.episodes.gestureEnded(endGesture(st));
  });
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
    // ⭐⭐⭐ (2026-10-28) AROUND THE ASSEMBLY: A + drag's dy (⛔ Shift, 2026-10-29) is the APPROACH (and nothing else moves); one finger's dy the PITCH, at the dx yaw's pace
    // (the owner's default: *"the same °/mm as the dx yaw"*) — 170° of pitch over the ring parameter
    const asmOn = assemblyOn(st);
    const shiftApproach = asmOn && st.orbitShift && !dxOnly;
    if (shiftApproach) approachInput(st, db.dy / mmToPx(1));
    // ⭐⭐⭐ (2026-11-02) the finger's axes' signs on the orbit (`st.asmSign`: kept through a re-base of its frame — the same finger the same way in the world)
    const sg = asmOn ? st.asmSign : { yaw: 1, v: 1 };
    // ⭐⭐⭐ (2026-11-03, the owner: *"after a camera roll, the delta position direction on the screen and the gizmo direction are always the same. Blend that
    // properly during the camera roll"*) around the assembly the finger laid on the gizmo's axes AS THE SCREEN SHOWS THEM (`fingerOnAxes`, read each frame:
    // through a roll the gizmo never goes against the finger — ⛔ the signs, read before a roll and kept through it, sent the piece out on the far side of
    // a bottom with its dy reversed); the signs' rule where they lie along the screen's
    const ax = asmOn && !shiftApproach && !dxOnly ? st.asmAxes : null;
    // (before the first frame's axes: the signs — around the assembly a dy with the finger too, `fingerOnAxes`)
    const fd = ax !== null ? fingerOnAxes(db.dx, db.dy, ax.yaw, ax.pitch) : { yaw: sg.yaw * db.dx, pitch: (asmOn ? -sg.v : sg.v) * db.dy };
    const dyPx = (dxOnly || shiftApproach ? 0 : fd.pitch) * st.cfg.boxGainPitch * g.pitch;
    const dvRaw = (dyPx / mmToPx(1)) * st.cfg.gainOrbitElevation * elevationGainScale(st.cfg);
    const dvWant = asmOn ? (((dxOnly || shiftApproach ? 0 : fd.pitch) / mmToPx(1)) * orbitDegPerMm(st.cfg, st.orbit.elevation, g).yawDegPerMm) / ((2 * ORBIT_PITCH_MAX_RAD * 180) / Math.PI) : dvRaw;
    const travel = dvRaw !== 0 ? (asmOn ? { dv: dvWant, du: dvWant } : orbitTravelStep(st, dvRaw, orbitDvPerMm(st))) : { dv: 0, du: 0 };
    const share = dvRaw !== 0 ? travel.dv / dvRaw : 1;
    const yawBefore = st.orbit.yaw;
    const vBefore = st.orbit.elevation;
    // ⭐⭐ (2026-10-25) no yaw while the top face pause's roll is under way (straight above, a dx would turn the picture like a roll)
    const travelMm = Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1);
    // ⭐⭐⭐ (2026-11-02) the screen's roll and the next switch's wait go on with the orbit's travel (`orbitTravelMm`) — ⭐⭐⭐ a roll under way TAKES it first,
    // at the view's cap: the piece waits while the camera rolls (the owner: *"smoothed … by travel of the camera and piece with delta position"*)
    const left = asmOn && !shiftApproach ? orbitTravelMm(st, travelMm) : travelMm;
    const kRoll = travelMm > 0 ? left / travelMm : 1;
    const dxArg = shiftApproach ? 0 : pauseYawStep(topPauseOn(st), st.topPause, -fd.yaw * st.cfg.boxGainYaw * g.yaw * st.pieceYawGainDrag) * kRoll;
    const dyArg = dyPx * share * kRoll;
    st.orbit.drag(dxArg, dyArg);
    // ⭐⭐⭐ (2026-11-02, *"clamping the angular travel per mm input for any face"*) the view's turn held to the cap per mm (`viewTurnGoverned`): the step cut
    if (asmOn && !shiftApproach) {
      const k = viewTurnGoverned(st, yawBefore, vBefore, st.orbit.yaw, st.orbit.elevation, left);
      if (k < 1) {
        st.orbit.reset(yawBefore, vBefore);
        st.orbit.drag(dxArg * k, dyArg * k);
      }
    }
    // ⭐ (2026-10-28) locked close in: a step further out of the face's cone is refused (the piece never goes behind the face)
    if (leavesCone(st, yawBefore, vBefore, st.orbit.yaw, st.orbit.elevation)) st.orbit.reset(yawBefore, vBefore);
    // ⭐⭐⭐ (2026-11-02, the owner: *"do the roll as it was previously implemented on branch 1.0.83"*) over a top in the face-span, the step held at the zenith
    // while the camera rolls
    if (asmOn && !shiftApproach) orbitZenithStep(st, yawBefore, vBefore, left);
    // ⭐ (2026-10-14) the orbit is back: the piece-only hover offset dropped, the camera out of the hover view with this travel
    hoverOrbitStep(st, travelMm);
    // ⭐⭐⭐ (2026-11-01) an orbit step arms the slide mode again (`slideArmedAfter`; A + drag's is the approach's)
    if (!shiftApproach) st.slideArmed = slideArmedAfter(st.slideArmed, 0, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1));
    // ⭐ prototype (green box), 2026-10-02: the orbit's own step, recorded for its INERTIA after the finger lifts (`OrbitInertia`).
    // ⭐ (2026-10-21) the TRAVEL taken — a coast goes on through the pause; ⭐⭐ (2026-11-02, the third audit's A2) around the assembly the pitch APPLIED, its
    // sign (`asmSign.v`) and the governor's cut in it — ⛔ the unsigned want: after the view went over the top a flick coasted the wrong way
    st.orbitInertia.record(s.t, st.orbit.yaw - yaw0, asmOn ? st.orbit.elevation - vBefore : travel.du);
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
