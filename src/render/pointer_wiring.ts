/**
 * THE POINTER HANDLER — every press, move and release, routed by `IN2` and dispatched to the rules. ⛔ The largest block of the old `scene.ts`, moved verbatim; it holds calls, not rules.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { pressSteers } from "../input/frozen_pick";
import { rootOf } from "../core/collision";
import { bandMmNow } from "./empty_space_probe";
import { inEdgeBand } from "../input/edge_band";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { alignsOnRelease, isTapRelease, pairPressRevertsToggle, toggleBehaviour, tapTogglesMode, desktopBehaviour, pressMeaning, outsideTapRelease, flatTwistAngle, rollSignFor, rotateAboutAxis, trackingMetresPerPx, SwayWatcher, SpinSwayWatcher, Recognizer, screenPlaneRotation } from "../input";
import { type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { incrementRadians } from "../input/rotation_increment";
import { alignedFaceOf, faceFromPickedNormal } from "../core/face_pick";
import { hasAlignment, rotationChannel } from "../core/constraint_stack";
import { IDENTITY } from "../core/vec";
import { frozenHoldAdmitted } from "../input/assembly";
import { translatesOnDrag } from "../input/highlight";
import { secondTouchDrive } from "../input/second_touch_drive";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { episodeCounts } from "../input/episode_ledger";
import { beginGesture, endGesture, undoLast } from "./undo_wiring";
import { pressHit } from "../input/frozen_pick";
import { axesFromFrame } from "../input/object_axes";
import { axisDisplacement, axisTravel } from "../input/axis_translate";
import { TURN_PITCH, TURN_ROLL, TURN_YAW, type SceneState } from "./scene_state";
import { modelOrientation, poseOf, setModelOrientation } from "./bodies";
import { alignFollowerTo, alignFollowerToPioneer, isSeatedCouple, noteTap, releaseAlignmentOf } from "./alignment_wiring";
import { axesOf, noteAxisTravel, noteTurnAxis, rotationFrameOf } from "./gizmo";
import { applyCamera, pinchPair, recomputeOrbitCentre, requireGestureFrame, resetCamera, screenFrame, syncCentre, updatePinch } from "./camera_rig";
import { describe, paint, sampleOf } from "./hud_paint";
import { noteSpin, nudgeOthers } from "./sway_pass";
import { applyDepthDrag, applyWorldStep, forgetAnchor, gripIsAlignedFollower } from "./drive";
import { cursorPointer, feedUnsnap } from "./seat_wiring";

export function installPointerHandler(st: SceneState): void {
  // ⭐⭐ `D111` — THE GESTURE'S FIRST DOWN, observed BEFORE every rule (`insertFirst`): the model is
  // snapshotted as it stands, so the undo's entry is the scene before anything this gesture did.
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
      st.eventGaps.delete(e.pointerId);
      st.rawPressedBody.delete(e.pointerId);
      st.pointerTypeOf.delete(e.pointerId);
    }

    // ⭐⭐⭐ A PIONEERFACECURSOR GRAB OWNS ITS POINTER — before the router can latch a role for it.
    if (cursorPointer(st, info.type, e)) {
      paint(st);
      return;
    }

    // ⭐ The anchor fork latches here, before anything is dispatched, so one event cannot be
    // judged half under one rule set and half under another.

    // ⭐⭐⭐ A15 — AN ORPHANED SELECTION IS COLLECTED HERE, AT THE NEXT INPUT EVENT, and
    // before anything is dispatched. ⛔ The owner's requirement: the lift itself changes
    // nothing, and the object is unselected only once the hand says something new — after
    // which THIS event flows into whatever rule the re-resolved configuration selects.
    // ⚠ A POINTERUP is deliberately absent: the orphaned holder's own release is handled
    // in its branch, where the §1.3 verdict has to be SKIPPED rather than re-resolved.

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
      const rayHit = !inBand && pick?.hit && pick.pickedMesh ? pick.pickedMesh : null;
      // ⭐⭐⭐ **A SECOND TOUCH ON A FROZEN BODY IS TREATED AS A MISS** (the owner, 2026-09-23:
      // *"therefore, this second touch could for example move another object"*). ⛔ Filtered on
      // the way IN, before the latch, so every rule downstream sees a touchpoint that landed on
      // nothing — which is what makes it a working second finger for the body in the OTHER hand.
      // ⚠ The DECISION is `frozen_pick.ts`'s; this reads the two facts and obeys.
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
      if (rawHitId !== undefined) st.rawPressedBody.set(e.pointerId, rawHitId);
      st.pointerTypeOf.set(e.pointerId, e.pointerType);
      // ⭐⭐ `D108` — THE DESKTOP HAS NO MODE: the mouse's press latches it from Ctrl.
      if (e.pointerType === "mouse") st.behaviour = desktopBehaviour(e.ctrlKey);
      // ⭐⭐⭐ **IS THE FACE UNDER THIS RAY ONE THE PRODUCT IS OFFERING?** — the owner, 2026-09-24:
      // *"frozen object fuchsia face is not responsive to touch and nothing happens."*
      //
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
        // ⛔ The count BEFORE this press is registered: `router.press` has not run yet.
        st.router.size,
      );
      // ⭐⭐⭐ `D124`: with a body held, a press on ANOTHER body steers it — never grabs the other one.
      const hitFirstId = hitFirst === null ? undefined : st.idOf.get(hitFirst);
      const steers =
        hitFirstId !== undefined &&
        pressSteers({
          holdersBefore: heldBefore.length,
          hitIsHeld: heldBefore.includes(hitFirstId),
          sameAssemblyAsHeld: heldBefore.some(
            (h) => h !== undefined && rootOf(st.world, h) === rootOf(st.world, hitFirstId),
          ),
        });
      const hit = steers ? null : hitFirst;
      // ⭐⭐ THE ONE PLACE A ROLE IS DECIDED, and it is decided by `IN2`, once.
      const routed = st.router.press(e.pointerId, s, hit);
      st.episodeFacts.set(e.pointerId, {
        role: routed.role,
        heldAtPress: heldBefore.length,
        pressedAnotherBody: rawHitId !== undefined && !heldBefore.includes(rawHitId),
      });
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
      // ⛔ The owner: *"if i double tap without release the pioneer and press the follower →
      // orange, the translation/rotation mode toggles: it should not."* ⚠ `D28`'s *two taps
      // revert* was keyed to the second RELEASE, and `D67`'s route to orange never lifts.
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
        paint(st);
        return;
      }

      if (routed.role === "SECOND") {
        // ⭐ A second finger on an object another touchpoint already holds. It runs NO
        // recognizer — it never begins a §1.3 gesture of its own — it is one of A6's two
        // travelling fingers. ⛔ Creating a `Held` here would give one mesh two recognizers.
        // ⚠ A6's anchor may equally be a finger OUTSIDE every object; this branch is the
        // case where the hand happened to put it back on the part.
        paint(st);
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
          st.pendingCentre =
            st.cfg.orbitCentreGraceMs > 0
              ? { x: e.clientX, y: e.clientY, at: s.t }
              : null;
          if (!st.pendingCentre) recomputeOrbitCentre(st, e);
        } else {
          // ⛔ A SECOND ONE ARRIVED: this is a pinch. Drop the pending retarget entirely
          // — the camera keeps orbiting whatever it was already orbiting.
          st.pendingCentre = null;
        }
        const p = pinchPair(st);
        if (p) {
          st.pinch.begin(p[0], p[1]);
          // ⚠ Captured HERE, once. The zoom is a ratio against the gesture's start,
          // never an accumulation — so a pinch out and back returns exactly where it
          // began. See input/pinch.ts.
          st.zoomAtPinchStart = st.zoom;
        }
        paint(st);
        return;
      }

      const mesh = routed.object!;
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
      const pressFace = faceHit
        ? { faceId: faceHit.faceId, cos: faceHit.cos }
        : null;
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
        pressWasDoubleTap: st.taps.wouldPair(s),
        pointerType: e.pointerType,
        mode: null,
        pressFace,
        alignmentTouched: false,
        pressActed: false,
        pendingAlign: null,
        sway: new SwayWatcher(st.cfg.swayTurnDeg, st.cfg.pointerNoiseMm),
        anchorMotion: new Map(),
        anchorRollSign: new Map(),
        // ⭐ The four tunables and the MEASURED noise — passed in, never assumed, exactly as
        // `SwayWatcher` takes it.
        // ⛔⛔ THROUGH `shakeParamsFrom`, AND THAT IS A FIX: this file built the same four
        // fields inline while `shake.ts` exported the function for it — two copies of one
        // mapping, which is precisely what `CONSTRAINTS` §4 forbids (*a tuning value needed in
        // two places is IMPORTED, never copied*). ⚠ Nothing had drifted yet; the point is that
        // nothing now can.
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
      // ⭐⭐⭐ **`D55` — THE PIONEER–FOLLOWER MECHANISM TOGGLES ON *HERE*, ON THE WAY DOWN.**
      //
      // > *"when first touch is pressed on first object, as soon as a second touch is pressed
      // > on second object (= a tap or a continued press), the Pioneer - Follower mechanism
      // > toggles on. To toggle off, the rule stays unchanged."* — the owner, 2026-09-19
      //
      // ⛔⛔ **IT IS THE TRIGGER THAT MOVED, NOT THE MECHANISM.** `alignFollowerToPioneer` is
      // called unchanged, with all its refusals — frozen Follower, no resolved face, the cycle
      // undo — and the release path below still owns every way OUT. ⭐ What changed is that a
      // **continued press** now counts: the old trigger was a release verdict, so a finger that
      // came down on the second body and stayed there aligned NOTHING until it lifted.
      //
      // ⚠⚠ **AND THIS IS WHERE `D51` BECOMES THE ORDINARY POSTURE.** `pinnedPair` needs a live
      // relation, and the relation used to cost a deliberate tap; now the grab IS it. ⛔ With
      // `pioneerTranslates = 0` at boot, the second body stops being cargo and becomes a
      // control surface — its finger drives the Follower's depth and roll — the instant it is
      // touched. ⭐ That is the owner's intent read plainly, and it is stated rather than
      // discovered because it changes what two fingers on two bodies do at boot.
      //
      // ⛔ THE DECISION IS `pressMeaning`'s, NOT THIS FILE'S — `pioneer_cascade.ts`'s rule: *a
      // RULE in a render file is a rule nothing can interrogate.* ⚠ Only the WIRING is here.
      const pressGrip = st.held.get(e.pointerId)!;
      const pressOthers = [...st.held.entries()].filter(
        ([pid]) => pid !== e.pointerId,
      );
      const pressHeldIds = pressOthers
        .map(([, g]) => st.idOf.get(g.mesh))
        .filter((v): v is string => v !== undefined);
      // ⚠ Asked only when exactly one other body is held, so `links` is consulted about a body
      // that unambiguously exists — the same guard `pressMeaning` re-states and refuses on.
      const pressHeldId = pressHeldIds.length === 1 ? pressHeldIds[0]! : null;
      // ⚠ The held GRIP, not just its id: `D67` reads the Pioneer's own press for the mode.
      const pressHeldGrip =
        pressOthers.length === 1 ? pressOthers[0]![1] : undefined;
      const pressPioneerOfHeld =
        pressHeldId === null ? null : st.links.pioneerFor(pressHeldId);
      // ⭐⭐⭐ **A FUCHSIA FACE PRESSED BY THE SECOND TOUCH BECOMES THE PIONEERFACE.**
      //
      // > *"if one fuchsia highlighted face is pressed by second touch, it becomes PioneerFace and
      // > the object becomes Pioneer object and the highlight switches to the pioneer highlight
      // > and the object with HitFace becomes aligned Follower object and the HitFace becomes
      // > FollowerFace."* — the owner, 2026-09-24
      //
      // ⛔⛔ **THE ROLES ARE THE INVERSE OF `D67`'s**, which is why this cannot be folded into
      // `pressMeaning`: there the PRESSED body is the Follower and the HELD one the Pioneer,
      // because the hand reaches out to the part it wants to move. ⚠ Here the hand is already
      // holding the part and reaching out to the thing it wants to align TO — the fuchsia
      // highlight is what makes the intent unambiguous, and it only exists in this configuration.
      //
      // ⭐ It tails into what is already built: `alignFollowerToPioneer` is called with the HELD
      // grip as the Follower, so it finds the freshly pressed body as its one other holder and
      // every downstream rule — the colours, the two-way index, the cascade — is the vetted one.
      // ⛔ `pressActed` from the RETURN VALUE, as `D67`'s branch does: a refusal must leave the
      // release untouched so the tap still means what it always meant.
      // ⭐⭐⭐ **THE SECOND PRESS OF A DOUBLE TAP UPGRADES THE RELATION TO `FOLLOW`.**
      //
      // > *"rapid double tap on fuchsia face does not trigger the amber mode"* — the owner
      //
      // ⛔⛔ **THE FIRST PRESS CONSUMES THE OFFER, WHICH IS WHY THE SECOND ONE MISSES IT.** Once
      // it aligns, the held body IS aligned — and `pressMeaning` answers `NOTHING` for a press on
      // the very face it now follows (`D39`'s rule, so a press-and-hold does not silently undo).
      // ⭐ So the pair is recognised on the LINK that already exists rather than on an offer that
      // no longer does: same two bodies, same face, and this press pairs with the last.
      // ⚠ Waiting out the double-tap window before aligning was the other way to fix it, and it
      // would put the whole gesture behind a timer — `D73`'s lesson about lag, one rule over.
      //
      // ⛔ The ALIGN half of this branch is **deleted by `D87`**: with the roles inverted,
      // `pressMeaning` aligns the held body to the pressed one for ANY face, so a separate rule
      // for fuchsia ones would be a second decision about the same gesture. ⭐ The highlight is
      // what it always was — guidance — and no longer a precondition for acting.
      // ⛔ The double press on the Pioneer face that made a `FOLLOW` is deleted with it (`D106`).
      const pressVerdict = pressMeaning({
        // ⭐ `D67`: the body under THIS press is the FOLLOWER, and the held one is the Pioneer.
        pressedObject: pickedId ?? null,
        pressedFace: pressFace?.faceId ?? null,
        heldObjects: pressHeldIds,
        // ⛔ The cycle guard, in the inverted direction: does the PIONEER already follow the
        // body being pressed?
        pioneerOfHeld:
          pressPioneerOfHeld === null ? null : pressPioneerOfHeld.objectId,
        // ⭐⭐ The HELD body's CURRENT FollowerFace — it is the FOLLOWER under `D87`, so *already
        // aligned to this very face* is a question about IT. ⛔ Derived from its constraint rather
        // than remembered: `alignedFaceOf` is the one implementation, and a shadow copy would be a
        // second source of truth free to disagree after an eviction.
        alignedFaceOfHeld:
          pressHeldId === null ? null : alignedFaceOf(st.world, pressHeldId),
        // ⭐⭐ The PIONEERFACE the held body follows — a face of the PRESSED body, and the only
        // thing `pressedFace` may be compared against. ⛔ Straight off the link, not remembered.
        pioneerFaceOfHeld: pressPioneerOfHeld?.faceId ?? null,
        // ⭐ The held body's HitFace: the FollowerFace this press WOULD use. ⚠ A different one
        // makes the press a RE-POINT rather than a no-op.
        heldPressFace: pressHeldGrip?.pressFace?.faceId ?? null,
        // ⛔ `D100`: a seated couple's second touchpoint is the UNSNAP's, not the align's.
        pressedIsSeatedPartner: isSeatedCouple(st, pressHeldId, pickedId ?? null),
        // ⭐⭐⭐ **`D87` — THE MODE COMES FROM *THIS* PRESS.** ⛔ `D67` read it off the held grip
        // because the held body was the Pioneer; inverted, the Pioneer is the body being pressed,
        // so the touch that selects it is the one that says which relation is wanted.
        pressWasDoubleTap: pressGrip.pressWasDoubleTap === true,
      });
      if (
        pressVerdict.action === "ALIGN" &&
        pressVerdict.mode !== null &&
        pressHeldGrip !== undefined
      ) {
        // ⭐⭐⭐ **`D87` — THE HELD BODY IS THE FOLLOWER NOW.** ⛔ So the call is made with the
        // HELD pointer and grip, and `alignFollowerToPioneer` finds the freshly pressed body as
        // its one other holder — the Pioneer. ⚠ Under `D67` these two arguments were this press's
        // own, which is the whole of the inversion at the wiring level.
        // ⛔ `pressActed` is set from the RETURN VALUE, never from the intent. Every refusal
        // inside `alignFollowerToPioneer` returns `false` and says why on the HUD, and a press
        // that aligned nothing must leave its release completely untouched — the tap then means
        // whatever it has always meant, including `D28`'s toggle.
        // ⛔⛔ `D119`: REMEMBERED, NOT DONE — the release aligns, and only if it is a TAP.
        pressGrip.pendingAlign = { heldPointerId: pressOthers[0]![0], mode: pressVerdict.mode };
      }
      // ⛔⛔ `A22`'s **SWITCH** branch stood here and is deleted with `D67`: the upgrade to
      // `FOLLOW` was the second touch's rapid pair, and the owner has moved that decision to
      // the PIONEER's own press. ⚠ `pressMeaning` can no longer return `SWITCH` at all.
      // ⛔ `D58`'s THIRD TRIGGER — a continued press on the held body's exact PioneerFace —
      // stood here and is **deleted by `D66`**. ⚠ It was the one press on a Pioneer that had no
      // other job; it now has none again, and `A22`'s rapid-pair upgrade keeps the gesture.
      paint(st);
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
        // ⭐⭐⭐ A15: released FROM THE SAME OBJECT (A12's roll/depth finger). Ask whether
        // the holder is still on its object before anything else can happen.
      } else {
        st.router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
        // ⭐ A second touch on a seated Follower (redirected to its root) is the UNSNAP's.
        st.lastFedPointer = e.pointerId;
        feedUnsnap(st, s);
        // ⭐⭐⭐ A12: A SECOND FINGER ON THE SAME OBJECT DRIVES IT, exactly as one outside
        // does — the owner: *"second touchpoint INSIDE OR OUTSIDE any object"*. Its x is
        // roll and its y is depth, while the finger on the object is held still.
        // ⚠ A touchpoint on a DIFFERENT object is deliberately excluded: that is §4 rule 5
        // / 6bis / 6ter's configuration and must stay reachable.
        const holder2 = st.router
          .objects()
          .find((q) => q.object === routed.object);
        const grip2 = holder2 ? st.held.get(holder2.id) : undefined;
        // ⚠ `SAME_OBJECT` is untouched by `D59` — the owner's sentence says *outside any
        // object* — but it goes through the same table so all three configurations are decided
        // in one place rather than by three scattered call sites.
        if (
          grip2 &&
          applyDepthDrag(st, 
            grip2,
            routed.seq,
            s,
            secondTouchDrive("SAME_OBJECT", gripIsAlignedFollower(st, grip2), st.behaviour) ===
              "BOTH",
          )
        ) {
          // ⚠ `D64` recorded a DRIVE here and `D65` deleted it: the fact could not answer the
          // question, because a finger moved along the channel the mode did not give it drives
          // nothing and is not a tap either. Nothing to record — the press already decided.
        }
      }
      paint(st);
      return;
    }

    if (routed.role === "IGNORED") {
      // ⛔⛔ AN IGNORED TOUCHPOINT RUNS NOTHING, INCLUDING ON RELEASE — no release
      // verdict, no flick test, no tap history. ⚠ The OPPOSITE of the pinch three
      // branches below, where lifting one of two fingers ends the gesture. A stray TAP
      // from here would evict a constraint (§1.4) that the user never asked to lose.
      if (info.type === PointerEventTypes.POINTERUP) {
        forgetAnchor(st, routed.seq);
        st.router.release(e.pointerId);
      } else st.router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
      paint(st);
      return;
    }

    if (routed.role === "OUTSIDE") {
      if (info.type === PointerEventTypes.POINTERMOVE) {
        const prev = routed.last;
        // ⚠ The live hit is handed over and DISCARDED by the router: this finger may
        // now be over a part, and it is still an anchor. See router.ts's `hitNow`.
        st.router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
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
            secondTouchDrive("OUTSIDE", gripIsAlignedFollower(st, grip), st.behaviour) === "BOTH",
          )
        ) {
          paint(st);
          return;
        }
        if (st.router.outside().length === 2) {
          updatePinch(st);
        } else if (
          st.router.outside().length === 1 &&
          st.router.objects().length === 0
        ) {
          // §2 rule 1: ONE touchpoint, no hit — orbit.
          const dx = s.x - prev.x;
          const dy = s.y - prev.y;
          st.orbit.drag(dx, dy);
          // ⭐ The centre migrates by the SAME finger travel that drives the orbit, so
          // the camera arrives as the gesture progresses rather than on a timer.
          st.centreBlend.advance(Math.hypot(dx, dy) / mmToPx(1));
          syncCentre(st);
          applyCamera(st);
        }
      } else if (info.type === PointerEventTypes.POINTERUP) {
        // ⭐⭐ DOUBLE-TAP OUTSIDE ANY OBJECT RESETS THE CAMERA. ⛔ Judged BEFORE the
        // release, while the router still knows where this touchpoint pressed: §1.3
        // measures a tap by its own press, not by whatever the last event happened to be.
        // ⚠ The SAME two thresholds §1.3 uses for an object — a tap is a tap whatever it
        // lands on, and a second definition here could disagree with the first.
        forgetAnchor(st, routed.seq);
        st.router.release(e.pointerId);
        // ⭐⭐⭐ A15: this is A10's DEPTH ANCHOR going up — the case that motivated the
        // amendment, because depth is what slides the object off the holder's finger.
        // ⛔ A pinch needs BOTH touchpoints. Lifting one ends it rather than letting
        // the survivor keep scaling against a partner that is gone.
        st.pinch.end();
        // ⭐⭐ ONE call, ONE record: it judges the tap, keeps §1.3's history, and arms fork
        // C's pending toggle. ⛔ A DOUBLE tap keeps exactly the meaning it has in forks A and
        // B — the camera reset — and cancels the pending toggle rather than being consumed
        // by it. ⭐ That is what the discrimination bought: the two gestures stopped
        // overlapping, so the special case disappeared instead of growing.
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
        const isTap = isTapRelease(
          routed.pressed.t,
          routed.pressed.x,
          routed.pressed.y,
          s.t,
          s.x,
          s.y,
          st.cfg.tapMaxDuration,
          mmToPx(st.cfg.doubleTapSlop),
        );
        // ⭐⭐ `D119` — A TAP ON A FROZEN BODY ALIGNS THE HELD BODY TO THE FACE UNDER IT. ⛔ Asked FIRST:
        // it is an assembly act, and must not fall through to the unalign or the mode toggle.
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
                pressWasDoubleTap: false,
              })
            : null;
        if (frozenVerdict !== null && heldGrip !== undefined && heldId !== undefined && frozenTap !== undefined) {
          st.taps.record(routed.pressed, s.t);
          if (frozenVerdict.action === "ALIGN" && frozenVerdict.mode !== null) {
            alignFollowerTo(st, heldId, heldGrip, frozenVerdict.mode, frozenTap.id, frozenTap.faceId, null);
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
            heldGrip.alignmentTouched = false;
            st.lastVerdict = `align: TAP on empty space released the alignment on ${heldId}`;
          } else {
            // ⭐⭐ `D107`: holding a PIONEER — the tap releases EVERY follower aligned to it.
            // ⚠ `followersOf` hands back a COPY: releasing mutates the set being walked.
            const orphaned = st.links.followersOf(heldId);
            for (const f of orphaned) releaseAlignmentOf(st, f);
            st.lastVerdict = `align: TAP on empty space released ${orphaned.length} follower(s) of ${heldId}`;
          }
        } else if (
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
          ) === "DOUBLE_TAP"
        ) {
          resetCamera(st);
          st.lastVerdict = "DOUBLE_TAP → camera reset";
        }
      }
      paint(st);
      return;
    }

    const grip = st.held.get(e.pointerId);
    if (!grip) return;

    if (info.type === PointerEventTypes.POINTERMOVE) {
      // ⭐⭐⭐ **THE UNSNAP GESTURE** (`D100`): the FIRST holder on the Pioneer, the SECOND on its
      // seated Follower, then a rapid move — the fingers' separation growing (tablet) or the
      // driven pointer travelling (mouse) by the eviction shake's own leg within its window.
      // ⛔ The pair and the numbers are `unsnap.ts`'s; this reads press order off the router.
      st.lastFedPointer = e.pointerId;
      feedUnsnap(st, s);
      // ⚠ Handed the live hit, which the router discards: a finger that presses on a
      // part and slides off is still holding it (§4).
      st.router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);

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
        // ⭐⭐ **ONE RULE, ONE PLACE** (`A16`): `translatesOnDrag` is the same function the
        // highlight condition reads, so the two cannot drift apart. ⛔ It used to be spelled
        // inline here as `objects().length === 1 ? behaviour : "TRANSLATE"`, and a second copy
        // in `highlight.ts` would have been two implementations of one rule — free to
        // disagree, with nothing to catch it.
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
      if (grip.mode === "TRANSLATE") {
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
        // **x** axis and `dy` drives its **depth** axis — both horizontal outside the zone — and
        // the SECOND touchpoint's `dy` drives its **gravity** axis (`applyDepthStep`).
        // ⛔⛔ It is unconditional: `worldAxisB` chooses WHICH axes, never whether the remap
        // applies. ⚠ What it costs, and it is inherent rather than tunable: the holder's `dy`
        // goes quiet at a level camera, where a depth change produces no screen motion at all.
        // ⭐ `axis_translate.ts` derives it, and the sign `depthTranslate` needed `awaySign`
        // for falls out of the projection instead of being asserted.
        // ⚠ `sid` above is scoped to the shake block; this branch asks for its own. ⛔ A body
        // the model does not know is given the boot basis rather than no basis — it is still
        // being dragged, and the alternative is a frame in which the finger does nothing.
        const tid = st.idOf.get(grip.mesh);
        const axes =
          tid === undefined
            ? (st.bootObjectAxes ?? axesFromFrame(grip.frame))
            : axesOf(st);
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
          // ⭐ Read ONLY inside the cone, where it is the sign `depthTranslate` needed: +1
          // looking down on the scene, −1 looking up at it.
          grip.frame.towardGravity,
        );
        noteAxisTravel(st, tid, travel);
        st.lastTrackGain = travel.trackGain;
        st.lastEdgeOn = travel.edgeOn;
        const step = axisDisplacement(travel, axes);
        // ⭐ `grip.frame` is the basis LATCHED AT PRESS, and `applyWorldStep` uses it for the
        // swing's screen travel and the depth clamp only — the body's own axes decide the
        // motion, and with `worldAxisB` they were latched at BOOT rather than at this press.
        // ⛔ THE FINGER MOVES THE TARGET, NOT THE MESH. The mesh chases it in the render
        // loop. With `translateInertiaMs` at 0 the two are the same thing.
        // ⛔ THE FINGER MOVES THE MODEL. The follower's target is re-read from it every
        // frame, so the inertia stays exactly what it was — a filter on the way to the
        // screen, and no longer the place the object's position is kept.
        // ⭐ ONE writer for an applied step: it moves the body, feeds the swing's direction and
        // records the travel direction the LeadingFace ray is fired along. ⛔ THE FINGER MOVES
        // THE MODEL — the follower re-reads it every frame, so the inertia stays a filter on the
        // way to the screen rather than the place the position is kept.
        applyWorldStep(st, grip, step);
      } else if (grip.mode === "ROTATE") {
        // The provisional motion — applied LIVE, and undone by the recognizer itself
        // if the flick test passes at release.
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
            paint(st);
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
              // accumulates the turn — the same trick C2's follow uses. ⚠ Not a compromise: a
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
            paint(st);
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
        // ⚠ `roll.ts` still exists with its 40 vectors and is no longer on the gesture
        // path — the same status as `shake.ts` and `anchor_rotate.ts`.
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
        // ⛔⛔ **`worldAxisB` PICKS THE FRAME HERE TOO** (the owner, 2026-09-23). ⚠ ONE lookup for
        // the lines, the tally and the turn — they restate each other's axes, so two calls could
        // hand them different ones on the very frame the flag is toggled.
        const turnFrame = rotationFrameOf(st, grip.frame);
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
            -grip.rec.step.dy * radPerPx,
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
      paint(st);
      return;
    }

    if (info.type === PointerEventTypes.POINTERUP) {
      // ⭐⭐⭐ A15 — AN ORPHANED HOLDER LIFTS WITHOUT A VERDICT, and the exclusion is the
      // point. ⛔ A flick-to-align or a double-tap belongs to a finger that was still on
      // its object; running one here would align — or evict a constraint on — an object the
      // user stopped touching a few hundred milliseconds ago, and never aimed this gesture
      // at. ⚠ The camera reset is refused for the same reason: the press was on an object.
      // ⚠ No `ReleaseContext` yet: selection and the two-touchpoint context are
      // `IN2`/`IN3`. So 6quater cannot win here, and the readout will show 2ter /
      // 2quater only. That is a missing INPUT, not a recognizer that ignores it.
      const verdict = grip.rec.release(s);
      st.lastVerdict = describe(st, verdict);

      // ⛔⛔ THE FLICK IS DELETED (`D110`, 2026-09-27) — its rotation reset with it.
      // ⭐⭐⭐ **THE TAP'S FOUR MEANINGS, AND `tapMeaning` OWNS THE CHOICE.**
      //
      // ⛔⛔ `D27`/`D28` MADE EVERY TAP FLIP THE MOVEMENT MODE, and the alignment trigger IS a
      // tap — so the two rules want the same gesture, and the alignment CONSUMES it when it
      // fires (`D38`). ⭐ Since 2026-09-17 the GESTURE also chooses what the alignment means:
      // a single tap makes a `SNAPSHOT`, a double tap makes a `FOLLOW`, and either one on the
      // face that is already the Pioneer switches the mode or lets it go.
      //
      // ⚠⚠ **AND A DOUBLE TAP ON ANOTHER OBJECT'S FACE NO LONGER FLIES THE CAMERA HOME.**
      // That meaning survives everywhere else — empty space, the held object — but here it
      // would make every `FOLLOW` alignment reset the view, which is unusable. ⛔ The camera
      // reset is therefore evaluated AFTER the alignment decision and skipped when the tap
      // aligned; this block used to run first, which is why it moved.
      let alignedByThisTap = false;
      // ⚠⚠ `D68` — THE HONEST HALF. A tap consumed by an alignment toggles NOTHING, so the
      // fact is cleared before either branch can set it: undoing a toggle that never happened
      // would flip the mode the hand actually had.
      st.lastTapToggled = false;
      // ⛔⛔⛔ **`D55` — A RELEASE WHOSE OWN PRESS ALIGNED IS ALREADY SPENT.**
      //
      // ⚠⚠ WITHOUT THIS BRANCH THE GESTURE UNDOES ITSELF, and it would look like the trigger
      // never worked at all. The press aligns; the release that follows it is a `TAP` on the
      // very face that alignment names, and `tapMeaning` reads that — correctly, and by a rule
      // the owner explicitly kept — as `UNALIGN`. ⭐ So align-then-break, ~80 ms apart, with
      // nothing on the glass to show for it.
      //
      // ⭐⭐ **AND IT IS THE *PRESS* THAT IS ASKED, NOT THE STATE.** *"Is the held body aligned
      // to this one?"* would be the substituted quantity again: it is true for the second tap
      // of a double tap as well, and that release must NOT be consumed — it is what carries
      // `SNAPSHOT` → `FOLLOW`. ⛔ Only *"did MY press make it?"* separates the two.
      // ⭐⭐⭐ `D119` — THE REMEMBERED ALIGNMENT FIRES ON A RELEASED TAP, and on nothing else.
      if (grip.pendingAlign !== null) {
        const pa = grip.pendingAlign;
        grip.pendingAlign = null;
        const heldGrip = st.held.get(pa.heldPointerId);
        if (alignsOnRelease(verdict.kind) && heldGrip !== undefined) {
          grip.pressActed = alignFollowerToPioneer(st, pa.heldPointerId, heldGrip, pa.mode, grip);
        } else {
          st.lastVerdict = "align: the second touch was PRESSED, not tapped — no alignment (D119)";
        }
      }
      if (grip.pressActed) {
        alignedByThisTap = true;
        st.lastVerdict = `${st.lastVerdict} — release spent (the press aligned)`;
      }
      // ⭐⭐ A DOUBLE-TAP ON AN OBJECT RESETS THE CAMERA TOO. ⛔ The reason is reachability:
      // orbit can get stuck close in with an object filling the view, and then every tap
      // lands ON something — a reset that only listened to empty space would be
      // unreachable precisely when it is wanted.
      // ⚠⚠ UNLESS THE TAP ALIGNED — **the owner's rule, 2026-09-17**: *"the double tap in such
      // case shall not trigger the camera orbit reset."* ⭐ A double tap on another object's
      // face now makes a `FOLLOW` alignment, and flying the camera home on top of it would
      // make the gesture unusable. ⛔ One gesture, one consequence.
      // ⚠ Everywhere else the double tap keeps the camera reset: empty space, the held
      // object, a second touchpoint. Only this one configuration is claimed.
      // ⭐⭐⭐ `D111` — **A DOUBLE TAP ON A BODY UNDOES THE LAST ACTION** (the owner, 2026-09-27),
      // and it no longer flies the camera home: that stays on EMPTY space. ⚠ Cost: an orbit stuck
      // close in with a body filling the view must find a patch of empty space to reset.
      // ⭐ The pair costs ONE episode: the second tap is excluded by the ledger.
      if (verdict.kind === "DOUBLE_TAP" && !alignedByThisTap) {
        undoLast(st);
        st.episodeUndo.add(e.pointerId);
      }
      // ⛔⛔ *"A single tap by one only touchpoint ANYWHERE also toggles"* — and
      // *anywhere* includes the object the touchpoint was carrying, which is this branch.
      // ⭐⭐ THE VERDICT IS READ, NOT RE-JUDGED: the recognizer already recorded this tap in
      // the SHARED `TapHistory` (`recognizer.ts` does it), so calling `noteTap` here would
      // record the same tap twice and corrupt the double-tap pairing for every consumer.
      // ⚠ Both `TAP` and `DOUBLE_TAP` toggle, once each: a `DOUBLE_TAP` verdict IS the
      // second tap of a pair, so two taps flip the mode twice — back where it started — and
      // also reset the camera, which is the owner's stated worst case and identical to what
      // a second touchpoint's taps do. ⛔ One rule: **one toggle per tap release.**
      // ⛔⛔ **`D66` — AND NOTHING SETTLES UP HERE ANY MORE.** `D58`'s press toggle used to
      // land in this branch twice over: a flag saying *the press already did it*, and a
      // ROLLBACK for the one gesture where the press's meaning and the tap's disagreed (a
      // re-tap on the PioneerFace releases the alignment, `D39`). ⭐ Both are deleted with the
      // press toggle: a rule that cannot fire needs no correction, and `D39` gets its single
      // meaning back without one.
      // ⛔⛔ `D108`: a tap on the object the touchpoint was carrying NO LONGER TOGGLES the mode —
      // only a tap on EMPTY space does (`tapTogglesMode`). ⚠ Nothing toggled, so `D68`'s revert
      // must not fire on a press that pairs with it.
      if (verdict.kind === "TAP" || verdict.kind === "DOUBLE_TAP") st.lastTapToggled = false;
      // ⭐ §3 rule 3 — *"release unselects object and face, stack preserved."* ⛔ The stack
      // lives on the OBJECT, so preserving it is not an action: it is what NOT clearing the
      // selection state means.
      //
      // ⭐⭐⭐ AND THE OWNER AMENDED IT, 2026-09-16: *"keep the face highlighted when the
      // object is aligned, until the shaking releases the alignment."*
      // ⛔⛔ THE ARGUMENT IS THAT THE HIGHLIGHT IS NOT A SELECTION INDICATOR ANY MORE — it is
      // **the alignment's only visible state**. A constrained object looks exactly like a
      // free one: the stack is invisible, 2sexte's refusal to yaw feels like a dead control,
      // and *which* face is anchored is unknowable. ⭐ So the marker outlives the gesture
      // that made it and dies with the CONSTRAINT, which is the thing it now reports.
      // ⚠ §3's clause still governs an UNALIGNED object: press, look, release, and the
      // highlight goes — nothing to report, nothing drawn.
      // ⛔⛔⛔ **DEVICE-REPORTED: *"the aligned face shall continue to be highlighted. You
      // completely disregarded the highlight rule — or if you built it, I can't see it."***
      //
      // ⚠ It WAS built, and this line destroyed it one event later. The test asked *"is the
      // object being RELEASED the highlighted one?"* — and in fork C it never is: the
      // highlight names the **Follower**, while the release that follows an alignment is the
      // **Pioneer's** tap. So the marker was raised and wiped in the same handler.
      //
      // ⭐⭐ THE FIX IS TO ASK THE QUESTION THE HIGHLIGHT ACTUALLY ANSWERS. It reports *this
      // object is aligned on this face* (`D35`), so it lives exactly as long as that
      // alignment does — **whichever** object is being released. ⛔ The old form was a
      // condition about the GESTURE standing in for a fact about the MODEL, which is the
      // shape `METHOD` calls a substituted quantity.
      // ⛔⛔ `hasAlignment`, NOT `length > 0` — audit, 2026-09-17: a MATE is not an alignment,
      // and `evict` deliberately never removes one, so a mated body would keep its follower
      // marker for ever. ⚠ A stale highlight is what produced TWO false device reports on
      // 2026-09-17; this is the same shape one constraint-kind further on.
      const highlightedStillAligned =
        st.selectedFace !== null &&
        hasAlignment(
          st.world.objects.get(st.selectedFace.objectId)?.constraints ?? [],
        );
      if (!highlightedStillAligned) {
        st.selectedFace = null;
      }
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
      paint(st);
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
    const undoSecondTap = st.episodeUndo.delete(e.pointerId);
    // ⛔ Free Flow escapes the score (`D101`): nothing is counted while the cursor drag is on.
    // ⭐⭐ `D115`: classified NOW, counted when the gesture's LAST touch lifts — so a two-touch action
    // (an alignment, an unalign, an unsnap) lands on the HUD once, at its end.
    st.episodes.note(
      st.cfg.pioneerCursorDrag !== 1 &&
      episodeCounts({
        role: facts?.role ?? null,
        heldAtPress: facts?.heldAtPress ?? 0,
        pressedAnotherBody: facts?.pressedAnotherBody ?? false,
        unaligned,
        undoSecondTap,
      }),
      // ⭐ Pressed while a body was held: it completes a two-touch action, and uses up that hold.
      (facts?.heldAtPress ?? 0) > 0,
    );
    st.hudDirty = true;
    if (st.gestureSpan.release(e.pointerId)) {
      st.episodes.gestureEnded();
      endGesture(st);
    }
  });
}
