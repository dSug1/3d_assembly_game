/**
 * THE RENDER LOOP — the per-frame order: snaps, cascades, seats, the follower, the markers, the HUD, then `scene.render()`.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { advanceFollow, retargetAlignment, displayPose, exponentialSmooth, phantomTarget, trackingMetresPerPx, easeInOut } from "../input";
import { worldPlacementOf } from "../core/object_model";
import { alignedFaceOf } from "../core/face_pick";
import { rotationChannel } from "../core/constraint_stack";
import { clearObjectConstraints, faceWorld, pushObjectConstraint } from "../core/object_model";
import { qmul } from "../core/vec";
import { followerLinksFrom, followerMoveLinksFrom, resolvePioneerMoves, resolvePioneerTurns } from "../input/pioneer_cascade";
import { ALIGN_SNAP_FRACTION, CANDIDATE_COLOUR, FOLLOWER_COLOUR, GIZMO_RING_PX, PIONEER_COLOUR, type SceneState } from "./scene_state";
import { followerFor, guardDraw, modelOrientation, modelPose, requirePose, setModelOrientation, setModelPose, writePose } from "./bodies";
import { candidateFacesNow, candidateRingFor, faceMarkerFor, hitFaceNow, outlinesFor, syncPioneerCursors, worldPointOn } from "./markers";
import { advanceRotation, releaseAlignmentOf, unseatWorld } from "./alignment_wiring";
import { refreshAxisGizmo } from "./gizmo";
import { refreshHighlight, swingAngleNow } from "./highlight_pass";
import { applyCamera, applyCameraPose, recomputeOrbitCentre } from "./camera_rig";
import { paint } from "./hud_paint";
import { syncSeats } from "./seat_wiring";

export function startRenderLoop(st: SceneState): void {

  st.engine.runRenderLoop(() => {
    const now = performance.now();

    // ⭐ And on idle frames too: a flip made with an empty glass produces no pointer event.
    const dtSec = st.lastFrameMs === null ? 0 : (now - st.lastFrameMs) / 1000;
    st.lastFrameMs = now;

    // ⛔⛔⛔ ADVANCE THE MOTION CLOCK FOR EVERY LIVE TOUCHPOINT, EVERY FRAME.
    //
    // A still finger emits NO `pointermove`, and `MotionTracker` is otherwise driven only
    // by those events — so without this line a finger held deliberately still stays
    // `MOVING` for ever, and A10's depth gate never opens. ⚠ Reported from the device three
    // times before it was found: *"passing from x/y translation to depth translation
    // (sometimes, it is blocked) while passing from depth translation to x/y translation is
    // smooth and instantaneous."*
    //
    // ⭐ The asymmetry was structural: `MOVING` is entered by an event that necessarily
    // exists, `STATIONARY` by one that by definition may not arrive. ⭐⭐ Elapsed time with
    // no sample is the strongest evidence of stillness there is — it simply has to be asked
    // for, and the render loop is the clock everything visible already runs on.
    for (const grip of st.held.values()) {
      grip.rec.tick(now);
      for (const tracker of grip.anchorMotion.values()) tracker.tick(now);
    }

    // ⭐⭐ `A16`: re-derived EVERY FRAME, here, before anything reads it.
    refreshHighlight(st);

    // ⭐ The leading face and its gizmo, AFTER the highlight — the zone edge may have just
    // re-decided the axes, and the gizmo is documented to point along them. ⚠ A gizmo drawn
    // first would show the previous basis for one frame, at exactly the moment a hand is
    // looking at it to see what changed.
    refreshAxisGizmo(st);

    // ⭐⭐⭐ **AND THE APPROACH SWING IS PUT ON THE CAMERA HERE** — device-reported, 2026-09-19:
    // *"not working. the camera does not orbit."*
    //
    // ⛔⛔ THE LAW WAS RIGHT AND THE WIRING WAS ABSENT. `applyCamera()` is called only by
    // CAMERA events — reset, startup, pinch, a slider, the orbit drag — and an approach is a
    // finger translating an OBJECT, during which not one of them fires. ⚠ So the yaw was
    // recomputed every frame and never written. ⭐ `METHOD`: *a rule that is never called is
    // indistinguishable from a rule that is wrong*, and only the glass can tell them apart:
    // `approach_swing.ts` has eleven green vectors and every one of them still passed.
    //
    // ⚠ Skipped while the camera reset is flying home — that animation writes the whole pose
    // every frame, and two writers would fight for the camera with the reset winning by
    // arriving second. ⛔ The swing's own return to zero is unaffected: it is a pure function
    // of the gap, so whatever it missed it picks up on the next frame it is allowed to write.
    if (st.cameraReset === null) {
      const wantSwing = swingAngleNow(st);
      if (wantSwing !== st.appliedSwingYaw) {
        st.appliedSwingYaw = wantSwing;
        applyCamera(st);
      }
    }

    // ⭐ Advance every follower, whether or not a finger is still down — the tail of the
    // deceleration is the part that makes it feel like mass. The step is unconditionally
    // stable, so a stalled frame simply arrives rather than exploding.
    // ⭐ The double-tap reset, flying home. ⛔ Advanced here and not on a timer: the loop
    // is the clock everything visible already runs on, and there is no callback to leak.
    if (st.cameraReset !== null) {
      applyCameraPose(st, st.cameraReset.advance(dtSec * 1000));
      if (st.cameraReset.done) st.cameraReset = null;
    }

    // ⭐ The deferred orbit centre, committed once its grace has passed with no second
    // touchpoint outside. ⚠ `router.outside().length` is re-checked here and not only at
    // press: a finger could have arrived and left again within the window.
    if (
      st.pendingCentre !== null &&
      now - st.pendingCentre.at >= st.cfg.orbitCentreGraceMs
    ) {
      const p = st.pendingCentre;
      st.pendingCentre = null;
      // ⚠ BOTH conditions re-checked at commit time, not only at press: within the grace
      // a second finger could have arrived and left, or a finger could have landed on an
      // object and turned the whole gesture into a translation.
      if (st.router.outside().length === 1 && st.router.objects().length === 0) {
        recomputeOrbitCentre(st, { clientX: p.x, clientY: p.y });
      }
    }

    // ⛔⛔⛔ **THE MODEL WRITERS RUN BEFORE THE VIEW READS THE MODEL — reordered by audit,
    // 2026-09-17.** The alignment slerp and the Pioneer cascade both WRITE orientations, and
    // they used to run AFTER the follower loop below, which READS the model and sets every
    // mesh transform. ⚠ So a snapping or a cascading body was drawn one frame behind its own
    // model, for the whole length of the animation.
    // ⭐ The slerp's own comment claimed it ran *"before anything reads an orientation this
    // frame"* — true of the Pioneer watch and the markers that followed it, and false of the
    // loop that actually draws the scene.
    // ⭐⭐ `METHOD`: *a claim about ORDER has to name what it is ordered against.*

    // ⭐⭐ THE ALIGNMENT'S SLERP, ADVANCED BEFORE ANYTHING READS AN ORIENTATION this frame —
    // the Pioneer watch below compares orientations, the markers are drawn from them, and
    // since 2026-09-17 the follower loop that writes every mesh runs after it too.
    // ⚠ `easeInOut` is the camera reset's own easing, imported rather than re-derived: two
    // eased snaps in one product should not accelerate differently for no reason.
    // ⚠ EVERY live snap, not one: see `alignSnaps` where it is declared.
    for (const step of st.alignSnaps.advance(
      now,
      st.cfg.cameraResetMs * ALIGN_SNAP_FRACTION,
      easeInOut,
      (id) => st.meshOf.has(id),
    )) {
      const mesh = st.meshOf.get(step.id);
      if (mesh) setModelOrientation(st, mesh, step.orientation);
    }

    // ⭐⭐⭐ **WHICH INCREMENT IS EACH HELD BODY IN NOW?** Asked once per frame, per grip.
    //
    // ⛔ HERE RATHER THAN IN THE POINTER HANDLER, deliberately: the rotation paths return early
    // in four places (the refusal, the twist, the roll, the free drag), and a check bolted to
    // each of them is four chances to forget one. ⭐ The render loop sees every grip, every
    // frame, whatever the gesture did — `A15`'s discipline: *ask the state, not the gesture.*
    //
    // ⚠ No edge-trigger and no rest test. A frame in which nothing crossed a boundary advances
    // nothing, so asking every frame costs a comparison and cannot repeat a step.
    for (const g of st.held.values()) advanceRotation(st, st.idOf.get(g.mesh));

    // ⭐⭐ **THE INCREMENT'S CHASE** — an exponential approach, advanced with the alignment
    // snaps. ⚠ A body cannot be in both: `advanceRotation` refuses to start one while an
    // alignment is travelling, so these two never write the same orientation in one frame.
    //
    // ⭐⭐⭐ **τ IS THE ALIGNMENT SNAP'S WINDOW OVER THREE**, so *essentially arrived* still takes
    // about that window — an exponential covers 95% in 3τ. ⛔ Borrowed rather than added, and
    // borrowable because it is the same KIND of number: how long a discrete, hand-requested
    // settle should take. ⚠ At `0` the slider means *arrive at once*, as it does everywhere.
    {
      // ⛔⛔ **`dtSec` IS THE LOOP'S OWN, NOT A SECOND CLOCK.** The first draft declared its own
      // `lastFrameMs` here — which the render loop had already advanced sixty lines above, so
      // `now - lastFrameMs` would have been **zero every frame** and the follower would never
      // have moved at all. ⚠ A silent freeze, caught by the compiler refusing the redeclaration
      // rather than by anything looking. ⭐ *One clock, `performance.now()`, as everywhere else.*
      for (const step of st.rotationFollower.advance(
        dtSec * 1000,
        (st.cfg.cameraResetMs * ALIGN_SNAP_FRACTION) / 3,
        (id) => {
          const m = st.meshOf.get(id);
          return m ? modelOrientation(st, m) : null;
        },
        (id) => st.meshOf.has(id),
      )) {
        const mesh = st.meshOf.get(step.id);
        if (mesh) setModelOrientation(st, mesh, step.orientation);
      }
    }

    // ⭐⭐⭐ **THE PIONEER'S OBJECT WAS TURNED** — `D41`'s C1/C2, checked once per frame.
    //
    // ⛔⛔ THE CASE HAD NO RULE AT ALL UNTIL 2026-09-17, AND ITS ABSENCE WAS INVISIBLE: an
    // alignment stores a FROZEN world direction, so turning the object that direction was read
    // FROM leaves the Follower obeying a target nothing on the glass corresponds to — and
    // both highlights keep saying it is fine. ⭐ Two readings, behind one flag, because *what
    // an alignment means* is the owner's question and not mine.
    //
    // ⚠ CHECKED HERE, AGAINST THE MODEL, and not at a pointer event: the Pioneer can be turned
    // by any rule — a drag, a twist, a rotation reset — and watching the ORIENTATION catches
    // every one of them without enumerating them. ⛔ The same discipline as `A15`'s raycast:
    // ask the state, not the gesture.
    // ⭐⭐⭐ **EVERY FOLLOWER WATCHES ITS OWN PIONEER, EVERY FRAME.**
    //
    // The owner, 2026-09-17: *"while the initial follower object is blue, if the pioneer object
    // is rotated because it is aligned with another object, the alignment of the initial
    // follower object shall be released"*, and *"the tracking shall enable a pioneer object to
    // rotate all its follower objects which are orange"*.
    //
    // ⛔⛔ **BOTH OF THOSE ARE ONE GENERALISATION, NOT TWO RULES.** `pioneerTurned` already
    // returns `RELEASE` for a `SNAPSHOT` (cyan) follower and `FOLLOW` for an orange one; it was
    // simply being asked **once**, about the single active alignment. ⭐ Asked per LINK it
    // covers every follower of every Pioneer, and chains fall out for free: an orange body
    // rotates when its own Pioneer turns, and anything cyan aligned to THAT body then sees its
    // baseline break and releases.
    //
    // ⚠ CHECKED AGAINST THE MODEL, never at a pointer event: a Pioneer can be turned by a drag,
    // a twist, a rotation reset, a slerp, or another alignment's `FOLLOW`. ⭐ Comparing poses
    // catches all of them without enumerating any — `A15`'s discipline, *ask the state, not the
    // gesture.*
    //
    // ⚠⚠ ONE FRAME OF LAG IS POSSIBLE IN A CHAIN AND IS ACCEPTED: the links are visited in
    // insertion order, so a follower processed before its Pioneer rotates sees the turn on the
    // next frame instead. ⛔ It cannot be MISSED, because the baseline is only re-set after the
    // turn has been accounted for — which is why this loop compares against a remembered pose
    // rather than a per-frame delta.
    // ⭐⭐ THE PLAN COMES FROM `input/pioneer_cascade.ts`, WHICH HAS VECTORS. ⛔ This block used
    // to BE the rule, inside the render loop, where nothing could interrogate it — and when a
    // hand reported the release *"not working"* there was no way to ask the code what it
    // believed. ⚠ Now the rule is a pure function with 14 vectors and this is only the part
    // that reads the world and applies the result.
    // ⚠ The ASSEMBLY moved out too, 2026-09-17: it was an inline `flatMap` here, so the wiring
    // test had to re-type it and its copy used one mode for every link. See `followerLinksFrom`.
    const cascade = resolvePioneerTurns(
      followerLinksFrom(
        st.links.alignedObjects(),
        (f) => st.links.pioneerFor(f),
        (f) => st.alignModeOf.get(f),
        (f) => st.links.isSeated(f),
      ),
      // ⚠ WORLD orientation, through the parent chain — never `local`, which is measured in
      // someone else's frame the moment an assembly exists.
      (id) => worldPlacementOf(st.world, id)?.orientation ?? null,
    );

    // ⚠ Anything the cascade decides must reach the readout in the SAME frame — see `hudDirty`.
    if (cascade.steps.length > 0) st.hudDirty = true;
    for (const step of cascade.steps) {
      if (step.kind === "RELEASE") {
        // ⭐ C1: *"releases the first object alignment (but not rotate the first object)"* — the
        // pose is left exactly as the hand left it, and only the RULE goes.
        const ref = st.links.pioneerFor(step.follower);
        releaseAlignmentOf(st, step.follower);
        st.lastVerdict =
          `align: SNAPSHOT — ${ref?.objectId ?? "pioneer"} turned, ` +
          `alignment released on ${step.follower}`;
        continue;
      }
      // ⭐⭐ C2: the follower takes the SAME WORLD ROTATION, which keeps the two normals
      // parallel by construction — no solve, and no chance of the solver adding a twist.
      const followerMesh = st.meshOf.get(step.follower);
      if (followerMesh) {
        setModelOrientation(st, 
          followerMesh,
          qmul(step.delta, modelOrientation(st, followerMesh)),
        );
      }
      // ⭐⭐ AN ANIMATION IN FLIGHT RIDES ALONG: both ends take the same world rotation, so the
      // snap keeps travelling toward a target that has moved with the Pioneer. ⛔ Without this
      // the slerp would drag the body back toward where the Pioneer USED to point.
      st.alignSnaps.ride(step.follower, step.delta);
      // ⭐ Keep the CONSTRAINT truthful — the geometry above already holds. ⚠ Without this the
      // stack would still name the old world direction, and the next rule to read it (a twist,
      // a reset) would act on a stale target.
      const ref = st.links.pioneerFor(step.follower);
      const pn =
        ref === null
          ? null
          : faceWorld(st.world, ref.objectId, ref.faceId)?.normal;
      const stack = st.world.objects.get(step.follower)?.constraints ?? [];
      // ⛔⛔ Audit, 2026-09-17: the count again. ⚠ Here the fall-through was SILENT rather than
      // destructive — the constraint simply kept naming the Pioneer's OLD world direction, and
      // the next twist or reset acted on a stale target with nothing to say so.
      if (pn && rotationChannel(stack).kind === "TWIST") {
        st.world = clearObjectConstraints(st.world, step.follower);
        st.world = pushObjectConstraint(
          st.world,
          step.follower,
          retargetAlignment(stack[0]!, pn),
          false,
        );
      }
      st.lastVerdict = `align: FOLLOW — ${step.follower} took ${ref?.objectId ?? "pioneer"}'s turn`;
    }
    // ⛔ RE-BASELINE LAST, from the plan. ⚠ A released follower is deliberately absent from
    // `baselines`, so this cannot resurrect a link `releaseAlignmentOf` has just removed.
    for (const [follower, orientation] of cascade.baselines) {
      st.links.noteOrientation(follower, orientation);
    }

    // ⭐⭐⭐ **`D69` — AND A TRANSLATED PIONEER CARRIES ITS FOLLOWERS, ALL OF THEM.**
    //
    // > *"Currently, if in rotation mode, a rotation of the pioneer controls the same rotation
    // > of all the orange follower objects. Do the same with translation: a translation of
    // > pioneer controls the same translation of all the follower objects."* — the owner
    //
    // ⛔ Run AFTER the turn cascade and read the same index. ⚠ The two cannot fight: a turn is
    // about a body's orientation and a move about its position, and a rotation about a body's
    // own centre leaves that position alone.
    // ⛔⛔ THE DECISION IS `resolvePioneerMoves`'s — *a rule in a render file is a rule nothing
    // can interrogate*, which this branch has paid for seven times.
    const moves = resolvePioneerMoves(
      followerMoveLinksFrom(
        st.links.alignedObjects(),
        (f) => st.links.pioneerFor(f),
        (f) => st.alignModeOf.get(f),
        (f) => st.links.isSeated(f),
      ),
      (id) => worldPlacementOf(st.world, id)?.position ?? null,
    );
    if (moves.steps.length > 0) st.hudDirty = true;
    for (const step of moves.steps) {
      // ⭐⭐⭐ **`D70` — A MOVED PIONEER RELEASES A CYAN FOLLOWER**, exactly as a turned one does.
      // ⛔ The owner: *"a translation of the pioneer should break the alignment of the cyan."*
      // ⚠ Written through the SAME `releaseAlignmentOf` the turn cascade uses, so the two
      // channels cannot end in different states.
      if (step.kind === "RELEASE") {
        const ref = st.links.pioneerFor(step.follower);
        releaseAlignmentOf(st, step.follower);
        st.lastVerdict =
          `align: SNAPSHOT — ${ref?.objectId ?? "pioneer"} moved, ` +
          `alignment released on ${step.follower}`;
        continue;
      }
      const followerMesh = st.meshOf.get(step.follower);
      if (!followerMesh) continue;
      const mp = requirePose(st, followerMesh);
      // ⚠ A FROZEN body is refused by `object_model`'s writers, so the plate cannot be dragged
      // along even if something linked it — the guarantee is there and not here.
      setModelPose(st, followerMesh, {
        position: [
          mp.position[0] + step.delta[0],
          mp.position[1] + step.delta[1],
          mp.position[2] + step.delta[2],
        ],
        orientation: mp.orientation,
      });
    }
    for (const [follower, position] of moves.baselines) {
      st.links.notePosition(follower, position);
    }

    // ⭐⭐⭐ **THE SNAP AND THE SEATS, EVERY FRAME** (`D100`) — after the cascades, which may have
    // moved a Pioneer, and before the meshes are written.
    syncSeats(st, now);

    const tauSec = st.cfg.translateInertiaMs / 1000;
    // ⛔⛔ ITERATE THE **MODEL**, NOT THE FOLLOWER MAP — and this line is a defect fix, not
    // a tidy-up. The loop used to walk `followers`, a map populated lazily by whoever
    // happened to need one: the sway (for the OTHER objects) and the rotation rule (for the
    // held one). While the follower WAS the object's state that was self-consistent — a
    // thing with no follower had no state to draw.
    //
    // ⚠ The moment the MODEL became authoritative it stopped being true, and it broke
    // translation, found by finger 2026-09-15: drag an object at page load and nothing
    // moves, because the model updates and nothing draws it. Then drag a SECOND object and
    // the first JUMPS — the sway finally creates its follower, the sync pulls everything
    // that had accumulated, and it snaps there in one frame.
    //
    // ⭐ Rotation hid it: the rotation rule creates the follower as a side effect of
    // storing `qHome`, so only translation was affected — which is why a device pass that
    // exercised rotation first saw nothing wrong.
    //
    // ⭐⭐ The lesson is the shape, not the line: **an implicit invariant died when the
    // authority moved.** "Everything that needs drawing has a follower" was true by
    // construction and became false silently, because nothing stated it.
    // ⭐⭐⭐ **THE DISCONTINUITY WATCH** — the owner, 2026-09-25: *"at one point, one of the
    // objects has made a big jump (I could not see if it was the pioneer or the follower)."*
    //
    // ⛔⛔ Read off the **MODEL**, here, after every rule has written and before the follower and
    // the sway bend it. ⚠ A jump the eye sees that the model did not make is a different defect,
    // and one readout for both would report neither. ⭐ The decision is `jump_watch.ts`'s; this
    // holds the call, which is the 2026-09-19 lesson.
    for (const [jid, jmesh] of st.meshOf) {
      const jp = modelPose(st, jmesh);
      if (!jp) continue;
      const j = st.jumpWatch.note(jid, jp.position, jp.orientation);
      if (j !== null) {
        st.lastJump = j;
        st.lastJumpVerdict = st.lastVerdict;
        st.lastJumpAt = performance.now();
        st.hudDirty = true;
      }
    }
    for (const mesh of st.meshOf.values()) {
      const f = followerFor(st, mesh);
      // ⭐⭐ THE MODEL IS RE-READ EVERY FRAME — this is what makes it authoritative rather
      // than merely present. Whatever the rules wrote this frame is what the follower now
      // chases and what the sway is applied on top of.
      const mp = modelPose(st, mesh);
      if (mp) {
        f.target.set(mp.position[0], mp.position[1], mp.position[2]);
        f.qHome = mp.orientation;
      }
      const zeta = st.cfg.translateDampingRatio;
      const leadSec = st.cfg.translateLeadMs / 1000;
      // ⭐ The finger's smoothed velocity, then the phantom projected along it. ⛔ The
      // smoother uses the object's OWN time constant: the lead is estimated at the only
      // timescale that can matter to it, and it costs no second slider.
      if (dtSec > 0) {
        f.vTarget.set(
          exponentialSmooth(
            f.vTarget.x,
            (f.target.x - f.lastTarget.x) / dtSec,
            tauSec,
            dtSec,
          ),
          exponentialSmooth(
            f.vTarget.y,
            (f.target.y - f.lastTarget.y) / dtSec,
            tauSec,
            dtSec,
          ),
          exponentialSmooth(
            f.vTarget.z,
            (f.target.z - f.lastTarget.z) / dtSec,
            tauSec,
            dtSec,
          ),
        );
        f.lastTarget.copyFrom(f.target);
      }
      f.x = advanceFollow(
        f.x,
        phantomTarget(f.target.x, f.vTarget.x, leadSec),
        tauSec,
        zeta,
        dtSec,
      );
      f.y = advanceFollow(
        f.y,
        phantomTarget(f.target.y, f.vTarget.y, leadSec),
        tauSec,
        zeta,
        dtSec,
      );
      f.z = advanceFollow(
        f.z,
        phantomTarget(f.target.z, f.vTarget.z, leadSec),
        tauSec,
        zeta,
        dtSec,
      );
      // ⭐ The sway springs home on its own clock — slower and softer than the object's
      // own inertia, and CRITICALLY damped so it returns without wobbling about.
      const swayTau = st.cfg.translateSwayTauMs / 1000;
      f.swayX = advanceFollow(f.swayX, 0, swayTau, 1, dtSec);
      f.swayY = advanceFollow(f.swayY, 0, swayTau, 1, dtSec);
      f.swayZ = advanceFollow(f.swayZ, 0, swayTau, 1, dtSec);
      f.swayRotX = advanceFollow(f.swayRotX, 0, swayTau, 1, dtSec);
      f.swayRotY = advanceFollow(f.swayRotY, 0, swayTau, 1, dtSec);
      f.swayRotZ = advanceFollow(f.swayRotZ, 0, swayTau, 1, dtSec);

      // ⭐ The block's swing, as a rotation about the pivot. ⛔ RIGID: the object both
      // ⭐⭐ THE WHOLE CHAIN, IN ONE EXPRESSION, AND IT LIVES OUTSIDE THIS FILE.
      // `displayPose` is `SWAY ∘ FOLLOW ∘ model` — engine-free, pure, and vectored in
      // `tests/display_pose.test.ts`, including the RIGIDITY property this loop used to
      // claim in a comment and test nowhere: the block both ORBITS the pivot and SPINS by
      // the same angle, because orbiting alone shears the group and spinning alone leaves
      // it turning on the spot. ⛔ `QUEUE.md` names *a composition nobody computed* as the
      // mistake this project keeps making; three writers meeting in a render loop is
      // exactly that shape, so the composition was moved somewhere it could be checked.
      const pose = displayPose([f.x.x, f.y.x, f.z.x], f.qHome, {
        translation: [f.swayX.x, f.swayY.x, f.swayZ.x],
        rotationVector: [f.swayRotX.x, f.swayRotY.x, f.swayRotZ.x],
        pivot: [f.swayPivot.x, f.swayPivot.y, f.swayPivot.z],
      });

      // ⭐ ONE WRITER. The held-mesh exception is gone with the model: the rotation rule
      // used to write the mesh directly, so this loop had to skip a held object or it
      // would overwrite it. Now every rule writes the MODEL and this is the only place a
      // mesh transform is set at all — which is what a "view" means, and one special case
      // fewer to be wrong about.
      writePose(mesh, pose.orientation);
      mesh.position.set(pose.position[0], pose.position[1], pose.position[2]);
    }

    // ⭐⭐⭐ THE FACE HIGHLIGHT, placed from the MESH's world matrix — not from the model.
    //
    // ⛔⛔ THAT CHOICE IS THE WHOLE CORRECTNESS OF IT. What the eye sees is
    // `displayPose = SWAY ∘ FOLLOW ∘ model`, so a highlight positioned from the MODEL would
    // sit where the object *is* while the object is drawn where it is *going* — lagging by
    // the follower's time constant during every drag and by the sway's excursion after it.
    // ⭐ Reading the mesh's matrix makes the two agree by construction, which is the same
    // reason the barycentre subtracts the sway rather than compensating for it.
    // ⚠ The local face centre and normal come from the MODEL, which is where faces live.
    // ⭐⭐ BOTH MARKERS, ONE PATH — the filled quad on the Follower, the contour on the
    // Pioneer, each drawn only while the state that MEANS something is present.
    // ⭐⭐⭐ **EVERY ALIGNED OBJECT KEEPS ITS FOLLOWERFACE**, asked of the MODEL, every frame.
    // ⛔ `selectedFace` is no longer what decides this — it names the ACTIVE alignment and is
    // still what the tap, shake and flick rules read, but it is one record and the owner needs
    // to see all of them at once.
    //
    // ⭐⭐ **THIS LOOP COSTS *ALIGNED BODIES*, NOT *SCENE BODIES*, AND THAT IS DELIBERATE.** It
    // ran over `world.objects.keys()` when there were three; at sixty frames a second the shape
    // that stops working as the scene grows is the one that walks everything to find the two
    // that matter. ⚠ `links.prune` reconciles the index against the model and RETURNS what it
    // dropped, so retiring a released body's markers needs no second sweep either.
    // ⛔ `prune` reconciles the index against the model — it catches releases that evict a
    // constraint WITHOUT unlinking (the shake-on-self path does exactly that). ⚠ Its return
    // value is deliberately NOT used to decide what to hide; see below.
    for (const id of st.links.prune((f) => alignedFaceOf(st.world, f) !== null)) {
      st.alignModeOf.delete(id);
      unseatWorld(st, id);
      // ⚠ A pruned link is a state change with no pointer event behind it. See `hudDirty`.
      st.hudDirty = true;
    }

    // ⛔⛔⛔ **HIDE BY SET MEMBERSHIP, NEVER BY WHAT `prune` HAPPENED TO DROP — DEVICE BUG,
    // 2026-09-17.**
    //
    // > *"the rotation of the pioneer currently removes the highlight of the pioneer but does
    // > not release the alignment of the cyan follower object"*, then the clue that cracked it:
    // > *"if the highlight of the pioneer is toggled off, the shake on the cyan follower is not
    // > working any longer"*
    //
    // ⚠⚠ **THE RELEASE WAS WORKING ALL ALONG.** The constraint was evicted and the link
    // removed; what failed is that the follower's markers were never HIDDEN, so the body still
    // LOOKED aligned — and a shake on it then answered *"nothing to release"*, which read as a
    // second bug. ⭐ One stale quad produced two false reports and sent me hunting the rule,
    // which was correct and is now vectored twice over.
    //
    // ⛔⛔ THE CAUSE WAS THE SHAPE OF THE LOOP: it hid only what `prune` dropped, and
    // `releaseAlignmentOf` unlinks DIRECTLY — so for every release that went through it (the
    // shake sweep, the re-tap, the rotation reset, a turned Pioneer, the cycle guard) `prune`
    // never saw the body and nothing ever hid its markers.
    // ⭐⭐ `METHOD`: *prefer the structure that cannot express the defect.* Hiding everything
    // not currently wanted is correct **whatever** removed the link, and needs no cooperation
    // from the paths that remove them. ⚠ I used exactly this pattern for the Pioneer contours
    // twenty lines below and the wrong one here, in the same edit — which is why the Pioneer's
    // highlight DID disappear and the follower's did not, the asymmetry the report describes.
    const alignedNow = new Set(st.links.alignedObjects());
    // ⭐⭐⭐ **THE FUCHSIA CANDIDATES** — every face on another body that the HitFace is within
    // `pioneerCandidateConeDeg` of mating with (the owner, 2026-09-24). ⛔ Recomputed every frame
    // from the MODEL, never remembered: *during the rotation* means the set follows the pose, and
    // a remembered set is the shape that produced eight reports on the gizmo.
    const hitFace = hitFaceNow(st);
    // ⚠ `candidateFacesNow` is the gated source; `hitFace` is NOT gated, so the HitFace contour
    // below survives with the offer switched off.
    const candidates = candidateFacesNow(st);
    const candidateKeys = new Set(
      candidates.map((c) => `${c.objectId}/${c.faceId}`),
    );
    guardDraw(st, "alignmentMarkers", () => {
      // ⛔⛔ **RETIRED BY SET MEMBERSHIP, WHATEVER REMOVED THE LINK.** The 2026-09-17 bug was the
      // other pattern — hiding only what `prune` dropped, so `releaseAlignmentOf` left markers
      // behind and produced TWO false defect reports against a rule that was correct.
      // ⭐ `METHOD`: *prefer the structure that cannot express the defect.*
      for (const [key, q] of st.faceMarkers) {
        const id = key.slice(0, key.indexOf("/"));
        const faceId = key.slice(key.indexOf("/") + 1);
        // ⛔⛔ **ONE POOL, ONE MEMBERSHIP TEST.** The fuchsia faces join the same retire loop
        // rather than getting a pool of their own: on 2026-09-17 two marker pools retired by two
        // different rules in one edit, and the asymmetry produced TWO false device reports.
        const wanted =
          (alignedNow.has(id) && alignedFaceOf(st.world, id) === faceId) ||
          candidateKeys.has(key);
        // ⛔⛔ **THE RING IS RETIRED IN THE SAME PASS, ON THE SAME KEY.** ⚠ It had a loop of its
        // own and its own (correct) test, which is one edit away from the 2026-09-17 defect: two
        // marker pools retired by two rules, and the asymmetry produced two false device reports.
        // ⭐ One pass cannot drift, whatever a later change does to the membership test above.
        const ring = st.candidateRings.get(key);
        if (ring !== undefined && !candidateKeys.has(key))
          ring.isVisible = false;
        if (wanted) continue;
        q.fill.isVisible = false;
        // ⛔⛔ **RETIRED BY THE SAME MEMBERSHIP TEST, IN THE SAME LOOP.** The twin must not outlive
        // the marker it doubles: a stale highlight produced TWO false device reports in one day
        // (*"the release is not working"*, *"the shake is not working"*) against rules that were
        // correct, and the cause was one pool retired by membership and another by what changed.
        q.xray.isVisible = false;
      }
      for (const [id, o] of st.outlines) {
        if (alignedNow.has(id)) continue;
        // ⛔ THE PAIR IS ATOMIC. A body outline left behind by a released alignment would claim
        // the body is still aligned — the readout-that-lies shape this file guards against.
        o.align.isVisible = false;
      }

      // ⭐⭐ **THE FUCHSIA FILL AND ITS WHITE RING**, drawn BEFORE the alignment colours so that a
      // face which is both a candidate and a live Follower/Pioneer keeps its established meaning.
      for (const c of candidates) {
        const marker = faceMarkerFor(st, c.objectId, c.faceId);
        if (marker !== null) {
          if (!marker.mat.emissiveColor.equals(CANDIDATE_COLOUR))
            marker.mat.emissiveColor.copyFrom(CANDIDATE_COLOUR);
          marker.fill.isVisible = true;
          const xrayOn = st.cfg.followerFaceXrayAlpha > 0;
          if (xrayOn) {
            if (!marker.xrayMat.emissiveColor.equals(CANDIDATE_COLOUR))
              marker.xrayMat.emissiveColor.copyFrom(CANDIDATE_COLOUR);
            marker.xrayMat.alpha = st.cfg.followerFaceXrayAlpha;
          }
          marker.xray.isVisible = xrayOn;
        }
        // ⚠ Position AND scale written here — NOT parented (`worldPointOn`); the scale keeps a
        // constant apparent size as the camera moves, the same conversion the capture shell uses.
        const ring = candidateRingFor(st, c.objectId, c.faceId);
        const ringLocal = st.candidateRingLocal.get(`${c.objectId}/${c.faceId}`);
        const ringAt =
          ringLocal === undefined ? null : worldPointOn(st, c.objectId, ringLocal);
        if (ring !== null && ringAt !== null) {
          ring.position.copyFrom(ringAt);
          const m =
            trackingMetresPerPx(
              st.camera.radius,
              st.camera.fov,
              st.canvas.clientHeight,
            ) * GIZMO_RING_PX;
          ring.scaling.set(m, m, m);
          ring.isVisible = true;
        }
      }

      for (const id of alignedNow) {
        const faceId = alignedFaceOf(st.world, id);
        // ⚠ `prune` just guaranteed this, so the guard is for the types rather than the logic.
        if (faceId === null) continue;
        const mode = st.alignModeOf.get(id);
        const want = mode === "FOLLOW" ? PIONEER_COLOUR : FOLLOWER_COLOUR;
        // ⭐⭐⭐ THE FOLLOWER FACE, DRAWN FROM ITS OWN TRIANGLES (`D50`) — so a triangular or an
        // L-shaped face marks itself correctly instead of wearing a rectangle.
        const marker = faceMarkerFor(st, id, faceId);
        if (marker !== null) {
          // ⚠ Written only on CHANGE, not blindly per frame.
          if (!marker.mat.emissiveColor.equals(want))
            marker.mat.emissiveColor.copyFrom(want);
          marker.fill.isVisible = true;
          // ⭐ `0` means the twin is not drawn AT ALL, which is the build before this flag — not an
          // invisible mesh still costing a draw call and still able to come back wrong.
          const xrayOn = st.cfg.followerFaceXrayAlpha > 0;
          if (xrayOn) {
            if (!marker.xrayMat.emissiveColor.equals(want))
              marker.xrayMat.emissiveColor.copyFrom(want);
            // ⚠ Written every frame because it is a SLIDER: a hand turning it must see the overlay
            // change under the finger, which is the whole point of shipping the number with the rule.
            marker.xrayMat.alpha = st.cfg.followerFaceXrayAlpha;
          }
          marker.xray.isVisible = xrayOn;
        }
        // ⭐⭐ AND THE WHOLE BODY, in the alignment's colour — its own mesh edges, offset a
        // little further out than the white body outline so the two nest rather than z-fight.
        const o = outlinesFor(st, id);
        if (o !== null) {
          if (!o.align.color.equals(want)) o.align.color.copyFrom(want);
          o.align.isVisible = true;
        }
      }

      // ⛔⛔ **EVERY PIONEER FACE THAT SOMETHING IS ALIGNED TO**, from the index.
      //
      // ⭐ THE PAIR IS ATOMIC BY STRUCTURE: a Pioneer face is drawn only because a link names it,
      // and a link exists only while its follower's constraint does (`links.prune`, above).
      // ⚠ The old form was `selectedFace !== null && pioneerFace !== null && …` — two records
      // kept in step by hand, and defect 44 was exactly them falling out of step.
      const wantedPioneerKeys = new Set<string>();
      for (const ref of st.links.pioneerFaces()) {
        const key = `${ref.objectId}/${ref.faceId}`;
        wantedPioneerKeys.add(key);
        const m = faceMarkerFor(st, ref.objectId, ref.faceId);
        // ⭐ The Pioneer face is OUTLINED, not filled — *which face it was aimed at*, against the
        // Follower's fill for *which face moved*. `D39`'s distinction, now on real face boundaries.
        if (m !== null) {
          if (!m.loop.color.equals(PIONEER_COLOUR))
            m.loop.color.copyFrom(PIONEER_COLOUR);
          m.loop.isVisible = true;
        }
      }
      // ⭐⭐⭐ **THE HITFACE WEARS A FUCHSIA CONTOUR WHILE IT IS ACTIVE** — the owner, 2026-09-25:
      // *"when active, highlight the contour of the hitface in fuchsia."*
      //
      // ⭐ OUTLINED, not filled, and that is the existing grammar rather than a new one: a FILL
      // says *this face moved* (the Follower) or *this face is on offer* (a candidate); a CONTOUR
      // says *this face is the one being aimed*. ⚠ So the HitFace and the candidates share a
      // colour and differ in form, which is exactly the pair they are.
      // ⛔ It joins `wantedPioneerKeys` rather than getting a pool of its own: one set, one retire,
      // the same discipline the fills and the rings are now under.
      if (hitFace !== null) {
        const key = `${hitFace.objectId}/${hitFace.faceId}`;
        const m = faceMarkerFor(st, hitFace.objectId, hitFace.faceId);
        if (m !== null) {
          // ⚠ A Pioneer contour on the same face KEEPS its amber: an established relation outranks
          // an offer, which is the order the fills already use.
          if (!wantedPioneerKeys.has(key)) {
            if (!m.loop.color.equals(CANDIDATE_COLOUR))
              m.loop.color.copyFrom(CANDIDATE_COLOUR);
            m.loop.isVisible = true;
          }
          wantedPioneerKeys.add(key);
        }
      }
      // ⚠ Hidden rather than disposed: a body can be re-aligned to the same face seconds later,
      // and churning meshes per gesture is how a render loop acquires a stall.
      for (const [key, q] of st.faceMarkers) {
        if (!wantedPioneerKeys.has(key)) q.loop.isVisible = false;
      }
      // ⭐⭐⭐ THE PIONEERFACECURSORS, reconciled against the same links the contours read.
      syncPioneerCursors(st);
    });

    // ⛔⛔⛔ **THE HUD IS REPAINTED WHEN THE *LOOP* CHANGES SOMETHING** — audit fix, 2026-09-17.
    //
    // ⚠⚠ `paint()` ran on pointer events and slider changes only. ⛔ But the cascade, the
    // prune and the snap all decide things HERE, with no event behind them — and the move
    // handler paints BEFORE this loop runs them. So the readout built to diagnose *"the release
    // is not working"* showed the state as of the previous event, one step behind the rule it
    // was reporting on. ⭐ That is not a cosmetic lag: on 2026-09-17 two false device reports
    // came from a stale marker, and the instrument for telling a stale marker from a broken
    // rule was itself stale.
    // ⚠ Guarded by a DIRTY FLAG rather than painted every frame: the HUD writes text into the
    // DOM, and 60 unconditional layout-invalidating writes a second is a cost with no reader.
    if (st.hudDirty) {
      st.hudDirty = false;
      paint(st);
    }

    st.scene.render();
    st.frames++;
  });
}
