/**
 * THE CAPTURE HIGHLIGHT PASS — the white contours and the approach-swing latch, once per frame. ⛔ The rule is `input/highlight.ts`'s.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { pairBarycentre } from "../input";
import { worldPlacementOf, type ObjectId } from "../core/object_model";
import { surfaceGap } from "../core/proximity";
import { captureOffsetM, highlightedPair, translatesOnDrag } from "../input/highlight";
import { zoneEdge } from "../input/object_axes";
import { freezeProgress, rebaseTriggerGap, smoothAmplitude, swingDriverIndex, endApproach, acquireSwingSign, approachSpeedMmPerS, swingAmplitudeRad, swingProgress, swingSignFor, swingYawRad } from "../input/approach_swing";
import { type SceneState } from "./scene_state";
import { guardDraw } from "./bodies";
import { showCaptureOutlines } from "./markers";
import { cameraOffsetZoneEnter } from "./gizmo";
import { rebaseGestureFrames, syncCentre } from "./camera_rig";
import { gripOfObject, secondTouchOwnsRollAndDepth } from "./drive";

export function refreshHighlight(st: SceneState) : void {
  // ⭐ Held bodies in PRESS ORDER, de-duplicated — `router.objects()` is ordered by press, and
  // press order is the only ordering a hand controls. ⚠ Two fingers on the SAME body collapse
  // to one entry, which is right: that is a holder plus a `SECOND`, not a pair.
  const ids: ObjectId[] = [];
  for (const p of st.router.objects()) {
    const g = st.held.get(p.id);
    const id = g === undefined ? undefined : st.idOf.get(g.mesh);
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  }
  // ⛔⛔ `D60` — THE HIGHLIGHT MUST SEE IT TOO, or the white contours would say the pair is
  // not being translated while the finger is translating it. ⚠ That is the readout-that-lies
  // shape, and the comment below is the reason it is passed rather than recomputed.
  // ⭐ Only meaningful with ONE held body: with two, `translatesOnDrag`'s first line already
  // fires and this adds nothing.
  const soleGrip = ids.length === 1 ? gripOfObject(st, ids[0]!) : undefined;
  st.highlighted = highlightedPair(
    st.world,
    ids,
    // ⛔ CONDITION 2, from the SAME function `grip.mode` is assigned from — one rule, one place.
    translatesOnDrag(
      ids.length,
      st.behaviour,
      soleGrip !== undefined && secondTouchOwnsRollAndDepth(st, soleGrip),
    ),
    {
      // ⭐⭐⭐ **RECOMPUTED EVERY FRAME FROM THE CAMERA** (`D49`, the owner: the offset *"shall
      // depend on the camera position and focus"*). ⛔ Not a constant and deliberately not
      // cached: a pinch changes `camera.radius` with no pointer event on any body, and an
      // offset that only updated on input would describe the zoom the hand had a moment ago.
      // ⚠ `camera.radius` is the distance to the orbit FOCUS, which is what was asked for.
      // ⛔⛔ **UNLESS AN APPROACH IS LIVE, IN WHICH CASE IT IS FROZEN** — the pitch half of the
      // swing moves the camera nearer or further (the ring surface has a different radius at
      // every elevation), so an offset that kept tracking would be decided by the swing it is
      // deciding. ⚠ Measured on the tablet: `172mm → 345mm` mid-approach before this.
      // ⭐ `approach_swing.ts` argues the feedback loop this prevents.
      captureOffsetM:
        st.swing?.offsetAtTriggerM ??
        captureOffsetM(
          st.cfg.captureOffsetMm,
          st.camera.radius,
          st.camera.fov,
          st.canvas.clientHeight,
        ),
      alignMatchRad: (st.cfg.alignMatchDeg * Math.PI) / 180,
    },
    st.highlighted.pair?.target ?? null,
    // ⛔ SURFACE TO SURFACE. ⚠ It reads the MODEL, not the display pose — the sway is
    // decoration and a highlight must not flicker with an animation nobody asked it to track.
    (a, b) => surfaceGap(st.world, a, b),
    // ⛔⛔⛔ `D62` — **A BODY MAY APPROACH ITS ALIGNMENT PARTNERS AND NOTHING ELSE.**
    //
    // > *"I want to do the same with Pioneer: currently, when I second touch an object which
    // > becomes Pioneer, it can white highlight if the Pioneer is close to a third object
    // > (which could be not the Follower): this should not happen. the white highlight should
    // > be reserved only for Pioneer-Follower duo."* — the owner, 2026-09-19
    //
    // ⚠ The first build restricted only the FOLLOWER, because that is the side the owner
    // named first — and a Pioneer has no Pioneer of its own, so it fell through to *the whole
    // scene* and lit up against any third body. ⭐ Both directions now, from the same two-way
    // index: **a Follower's partner is its Pioneer; a Pioneer's are its Followers.**
    //
    // ⛔ A body in neither role answers **empty**, which captures nothing — the owner's
    // *"reserved only for Pioneer-Follower duo"* taken at its word.
    // ⚠ The alignment index lives here, in the render layer, so the lookup is handed over
    // rather than reached for: `highlight.ts` stays engine-free and link-free.
    // ⛔ THE RULE IS `AlignmentLinks.partnersOf`, NOT A LAMBDA HERE. ⚠ It WAS a lambda, and a
    // mutant that reinstated the reported bug left all 944 vectors green — because a rule in a
    // render file is a rule nothing can interrogate.
    (id) => st.links.partnersOf(id),
  );
  // ⭐⭐⭐ **THE OFFSET RADIUS ZONE'S OWN EDGE — WHERE THE OBJECT AXES ARE RE-DECIDED.**
  //
  // > *"If the object has entered or exited an offset radius zone, Update the object axis
  // > directions as per below method and — if CameraOffsetZoneEnterSetupB is toggled on —
  // > launch the CameraOffsetZoneEnter method"* — the owner, 2026-09-22
  //
  // ⛔⛔ **IT IS THE SAME VERDICT THE WHITE CONTOURS ARE DRAWN FROM.** A second proximity
  // test of its own would be free to disagree with the contours a hand is looking at —
  // `D62`'s readout lesson, and the swing three lines below already obeys it.
  //
  // ⭐⭐ **ON AN EDGE, NEVER ON THE LEVEL, AND THAT IS WHAT BREAKS A CIRCULARITY**: in the
  // zone the basis comes from the leading face, the leading face comes from the travel
  // direction, and the travel direction comes from the basis. ⚠ Latching at the crossing
  // resolves it, and `object_axes.ts` argues why that is also the right feel — a basis
  // re-derived every frame would swing through 90° mid-push as the drag crossed a face.
  {
    const edge = zoneEdge(st.zoneWas, st.highlighted.inRange);
    st.zoneWas = st.highlighted.inRange;
    // ⛔⛔ **THE ZONE IS ENTERED BY PROXIMITY; THE DUO IS NAMEABLE ONLY WHILE A DRAG
    // TRANSLATES.** `inRange` is a distance and `pair` additionally requires condition 2, so a
    // hand can drift into range in ROTATE mode — the crossing happens, and there is nobody to
    // apply it to. ⚠ Without this the body would then be dragged on the OUTSIDE basis while
    // sitting inside the zone, and the edge that would have fixed it is already spent.
    // ⭐ So the pair is latched the moment it becomes nameable, and that counts as the entry.
    const named =
      st.highlighted.pair === null
        ? null
        : [st.highlighted.pair.subject, st.highlighted.pair.target];
    const becameNameable =
      st.highlighted.inRange && named !== null && st.zonePair.length === 0;
    if (named !== null && (edge === "ENTER" || becameNameable))
      st.zonePair = named;
    if (edge !== null || becameNameable) {
      // ⛔⛔⛔ **THE BASIS NO LONGER MOVES HERE** — `D82`, 2026-09-23, the owner: *"eliminate
      // this rule: Inside the offset radius the axes are the LeadingFace normal, gravity, and
      // their orthogonal. Inside shall be the same as outside."* ⭐ What remains on the edge is
      // the pair's identity, for the readout, and the owner's own hook.
      // ⛔ The HOOK fires on the CROSSING only, never on the late naming: the owner's trigger is
      // *"has entered … an offset radius zone"*, and a body that was already inside has not.
      if (edge === "ENTER" && st.cfg.cameraOffsetZoneEnterSetupB === 1)
        cameraOffsetZoneEnter(st);
      st.lastVerdict =
        `zone ${edge ?? "IN(named)"} — ${st.zonePair.length} body pair, axes UNCHANGED (D82)` +
        (edge === "ENTER" && st.cfg.cameraOffsetZoneEnterSetupB === 1
          ? `, CameraOffsetZoneEnter #${st.zoneEnterCalls} (no behaviour yet)`
          : "");
      // ⚠ Cleared AFTER the readout, or the line would report zero bodies on every exit.
      if (edge === "EXIT") st.zonePair = [];
    }
  }

  // ⭐⭐⭐ **THE APPROACH SWING ARMS AND DISARMS ON THE CAPTURE'S OWN EDGES** — the trial on
  // branch `1.0.18-`. ⛔ The owner's trigger is *"when the offset radius is crossed (= white
  // highlights toggle on)"*, so it is THIS verdict and not a second proximity test: a rule
  // keyed on its own copy of *near enough* would be free to disagree with the contours a hand
  // is looking at, and `D62`'s readout lesson is one line old.
  //
  // ⚠⚠ **THE TRIGGER GAP IS LATCHED, AND THAT IS LOAD-BEARING.** `captureOffsetM` is
  // recomputed every frame from the camera distance (`D49`) — and the swing is about to move
  // the camera. ⛔ A live offset would make the progress depend on the swing the progress is
  // driving. ⭐ A yaw-only lean keeps the orbit RADIUS constant so it would not in fact drift
  // today, but the latch means that stays true if the swing ever gains a radial component.
  if (st.highlighted.inRange && st.swing === null && st.highlighted.gapM !== null) {
    // ⭐⭐⭐ **CASE 2 — THE YELLOW TARGET SWITCHES TO THE PAIR'S BARYCENTRE** (the owner,
    // 2026-09-19), on the capture's rising edge and once only.
    // ⛔ *"same as if the switch of barycenter was triggered by the user input"* — so it goes
    // through `centreBlend.retarget` + `syncCentre`, exactly the two calls
    // `recomputeOrbitCentre` makes. ⚠ The camera therefore MIGRATES and the marker jumps at
    // once, which is rule 1's own behaviour; assigning the centre directly would put back the
    // jump that blend exists to remove.
    // ⚠⚠ It reads the MODEL, never the display pose — the sway is decoration, and an orbit
    // centre that moved with a wobble would make the camera chase an animation.
    if (st.cfg.approachRetargetsOrbit === 1 && st.highlighted.pair !== null) {
      const a = worldPlacementOf(st.world, st.highlighted.pair.subject)?.position;
      const b = worldPlacementOf(st.world, st.highlighted.pair.target)?.position;
      // ⚠ A body without a placement is refused rather than substituted: a barycentre computed
      // from one of the two would name a point neither body is at.
      if (a && b) {
        st.centreBlend.retarget(pairBarycentre(a, b));
        syncCentre(st);
      }
    }
    st.swing = {
      gapAtTriggerM: st.highlighted.gapM,
      // ⚠ The threshold this capture was judged against, frozen with it — they are one fact.
      offsetAtTriggerM: st.highlighted.offsetM,
      // ⛔ *"opposite to the dx movement"* — `approach_swing.ts` owns that negation, so the
      // one place the word OPPOSITE becomes arithmetic is a function with a vector on it.
      // ⛔⛔⛔ **AND IT IS THE TRAVEL OF *THIS* FRAME** — device-reported, 2026-09-20:
      // *"sometimes the yaw is to the left bottom, sometimes it is to the right up for the
      // same delta position x."* ⚠ The threshold can be crossed with no travel at all (a
      // press inside the band, a rotation moving the closest points, a pinch rescaling
      // `D49`'s offset), and then this is **zero** — which `swingSignFor` answers with
      // `null`, and a `null` sign is a swing of zero. ⛔ The old code answered `+1`.
      sign: swingSignFor(
        st.frameTravelRightM,
        st.frameTravelUpM,
        st.frameTravelDepthM,
      ),
      armTravelM: st.frameTravelRightM,
      armTravelUpM: st.frameTravelUpM,
    };
  } else if (!st.highlighted.inRange && st.swing !== null) {
    // ⚠ Pulling apart past the offset ends the approach. ⛔ Nothing has to be restored: the
    // progress is already back at 0 by the time the capture drops, so dropping the latch is
    // continuous rather than a jump. That is the whole argument for an additive offset.
    // ⭐⭐⭐ **ABSORB THE LEAN BEFORE DROPPING THE LATCH** — device-reported, 2026-09-19:
    // *"the camera shall not jump back … instead the camera shall keep its current
    // transform."* ⛔ The capture verdict is computed from the HELD bodies, so releasing the
    // Follower empties it and the latch drops — and the offset the camera was leaning on
    // vanished in one frame. ⭐ Absorbing makes the pose IDENTICAL, so there is nothing to
    // vanish and no special case for *which kind of ending this was*.
    // ⚠ At contact and on a clean separation the offset is already zero, so this is a no-op
    // there; doing it unconditionally is what keeps that from being a decision.
    //
    // ⭐⭐⭐ **AND THE ENDING ALSO HANDS EVERY LIVE GRIP A NEW BASIS** — the owner,
    // 2026-09-20: *"the delta position axis ends up being quite off vs the camera axis and
    // therefore the user feels a disconnect between the touch input axis and the follower
    // translation axis."* ⛔ `A7`'s frame is latched at the press against the **HAND's**
    // orbit, which is deliberate. The swing is the **GAME's** orbit, and `absorb` is the
    // instant that displacement becomes permanent — so it is also the instant the latch
    // stops protecting anything and starts lying. `approach_swing.ts` owns the decision.
    // ⚠ It moves nothing: a basis decides where the NEXT travel goes.
    const rings = st.orbit.ringElevationRad();
    const ending = endApproach(st.appliedSwingYaw, rings.bottom, rings.top);
    st.orbit.absorb(ending.yawRad, ending.vOffset);
    if (ending.rebaseFrames) rebaseGestureFrames(st);
    st.appliedSwingYaw = 0;
    st.swing = null;
    // ⚠ Forgotten with the approach, so the next one starts from its own first reading.
    st.swingAmp = null;
    st.swingFrozenProgress = null;
  }
  // ⛔⛔⛔ **CONSUMED HERE, EVERY FRAME, WHETHER OR NOT ANYTHING ARMED.** This one line is what
  // keeps the swing's direction a property of the approach: the arming edge above can only
  // ever see travel applied since the previous frame. ⚠ Zeroing it anywhere else — on a
  // press, on a release, at the end of the render loop — would leave a window in which a
  // stale direction is readable, which is the defect of 2026-09-20 in a smaller form.
  // ⭐⭐⭐ **A SWING THAT ARMED WITHOUT A DIRECTION TAKES THE FIRST ONE THAT ARRIVES** (defect
  // 65). ⛔ It must run BEFORE the accumulators are consumed below, and it reads the same travel
  // the arming edge would have read had it landed on this frame.
  if (st.swing !== null && st.swing.sign === null && st.highlighted.gapM !== null) {
    const signed = acquireSwingSign(
      st.swing,
      st.frameTravelRightM,
      st.frameTravelUpM,
      st.highlighted.gapM,
      st.frameTravelDepthM,
    );
    if (signed !== null) st.swing = signed;
  }
  st.frameTravelRightM = 0;
  st.frameTravelUpM = 0;
  st.frameTravelDepthM = 0;
  // ⛔ The contours ARE the state, drawn. They have no lifetime of their own, so they are
  // synced here and nowhere else.
  // ⚠ The SAME offset the rule just compared against — taken off the verdict rather than
  // recomputed here, so the contour and the threshold cannot disagree.
  // ⭐⭐ BOTH WHITES, ON ONE VERDICT AND ONE MACHINERY — the body's own edges at a hair, and
  // the same edges offset by HALF the capture distance. ⛔ They appear and vanish together:
  // two readings of ONE state, and a pair where only one showed would invent a state the rule
  // has not got.
  guardDraw(st, "captureOutlines", () =>
    showCaptureOutlines(st, 
      [st.highlighted.pair?.subject ?? null, st.highlighted.pair?.target ?? null],
      st.highlighted.offsetM,
    ),
  );
}


/**
 * ⭐⭐ How far the camera is currently leaning out of its own orbit, in radians.
 * ⛔ `0` whenever there is no live approach — and `0` at both ENDS of a live one, which is
 * what makes *"back to its original position"* a fact rather than a restore that has to run.
 */
/**
 * ⭐⭐ The swing's angle this frame, in radians — **one number, spent twice**.
 * ⛔ `0` whenever there is no live approach, and `0` at both ENDS of a live one.
 */
export function swingAngleNow(st: SceneState) : number {
  if (st.swing === null) return 0;
  // ⭐⭐⭐ **DIVIDED BY THE FINGER'S SPEED** (the owner, 2026-09-19) — which cancels the
  // `dp/dt` in the lean's derivative and makes the camera sweep at the same rate whatever the
  // hand does. `approach_swing.ts` carries the derivation.
  // ⛔ THE SPEED IS THE RECOGNIZER'S OWN WINDOWED ESTIMATE, never a per-frame delta: §1.1
  // estimated a rate over one sample pair and made `STATIONARY` unreachable for every real
  // finger, silently, for weeks. ⚠ One definition of *how fast*, shared with the flick.
  // ⚠ With no holder the speed is unknown — `0` reads as *stopped*, which gives the maximum
  // swing and is what a hand that has let go should see: the widest look at the join.
  // ⭐⭐⭐ **THE SWING IS DRIVEN BY A TRANSLATION, AND BY NOTHING ELSE** — device-reported,
  // 2026-09-19: *"a rotation of the pioneer controls the rotation of the follower (which is
  // normal) but also controls the camera to orbit which is not wanted."*
  //
  // ⛔⛔ `p` is a function of the SURFACE GAP, and turning two boxes moves their closest
  // points — so `gapBetween` changes and the swing advanced although nothing approached.
  // ⚠ In `FOLLOW` both bodies turn, which is why the report names orange. ⭐ The owner's spec
  // is explicit: the swing accompanies *"the translation of the Follower"*.
  //
  // ⛔ So: no translating grip, no advance. The camera holds exactly where it is — it does not
  // spring home either, because springing home is also a motion the hand did not ask for.
  // ⛔ THE DECISION IS `swingDriverIndex`'s, not this file's — deleting the mode test here
  // reinstates the reported defect, and a mutant that did exactly that left the whole suite
  // green while it lived in a `.find()`.
  const grips = [...st.held.values()];
  const driver = swingDriverIndex(grips.map((g) => g.mode));
  const translating = driver >= 0 ? grips[driver] : undefined;
  if (translating === undefined) {
    // ⭐⭐ **AND THE TRIGGER GAP IS RE-BASED WHILE FROZEN**, so that whatever a rotation does to
    // the geometry the swing resumes at the angle it is already showing. ⛔ Without it the
    // first frame of the resumed drag would JUMP the camera to whatever the new gap implies —
    // trading a continuous unwanted orbit for a discontinuous one.
    // ⚠ The progress is captured ONCE, on the frame the translation stopped. Recomputing it
    // from the live gap is the IDENTITY and the fix would silently do nothing.
    st.swingFrozenProgress = freezeProgress(
      st.swingFrozenProgress,
      swingProgress(st.highlighted.gapM ?? 0, st.swing),
      false,
    );
    const rebased = rebaseTriggerGap(
      st.highlighted.gapM ?? 0,
      st.swingFrozenProgress ?? 0,
    );
    if (rebased !== null) st.swing = { ...st.swing, gapAtTriggerM: rebased };
    return st.appliedSwingYaw;
  }
  st.swingFrozenProgress = freezeProgress(st.swingFrozenProgress, 0, true);
  // ⛔⛔ **EVERY FINGER DRIVING THIS BODY, AS OF NOW** (defects 64 and 70). The holder's own
  // recognizer was the only speed consulted, so a second-finger push read `0` — which the
  // amplitude law answers with the WIDEST swing, bypassing both tuned dials. ⚠ And the window
  // used to end at each finger's last event, so a push that had already finished kept answering
  // *"fast"*. ⭐ The choice is `approach_swing.ts`'s, not this file's.
  const nowSpeedMs = performance.now();
  const speed = approachSpeedMmPerS([
    translating.rec.speedMmPerSAt(nowSpeedMs),
    ...[...translating.anchorMotion.values()].map((t) =>
      t.speedMmPerSAt(nowSpeedMs),
    ),
  ]);
  const target = swingAmplitudeRad(
    (st.cfg.approachSwingDeg * Math.PI) / 180,
    speed,
    st.cfg.approachSwingSpeedGain,
    st.cfg.approachSwingSpeedExponent,
  );
  // ⭐⭐⭐ **SMOOTHED — device-reported, 2026-09-19**: *"the orbit of the camera becomes
  // jittery … especially the swing speed exponent"*, and *"although the delta position movement
  // is quite regular"*. ⛔ That second sentence is the diagnosis: a steady hand with a stepping
  // camera means the STEPS ARE IN THE ESTIMATOR, not the input. `approach_swing.ts` carries
  // the arithmetic — the exponent multiplies the estimator's relative wobble.
  // ⚠ Smoothing `A` and never the speed: three other rules read that number, and there is one
  // definition of *how fast is this finger*.
  const now = performance.now();
  st.swingAmp =
    st.swingAmp === null
      ? { rad: target, atMs: now }
      : {
          rad: smoothAmplitude(st.swingAmp.rad, target, now - st.swingAmp.atMs),
          atMs: now,
        };
  return swingYawRad(
    swingProgress(st.highlighted.gapM ?? 0, st.swing),
    st.swingAmp.rad,
    st.swing.sign,
  );
}
