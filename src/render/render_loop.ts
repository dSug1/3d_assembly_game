/**
 * THE RENDER LOOP — the per-frame order: snaps, cascades, seats, the follower, the markers, the HUD, then `scene.render()`.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { orientCubeFrame } from "./orient_cube";
import { advanceDemoFrame } from "./demo_wiring";
import { hiddenFromBelow, topFaceOutline } from "../core/underside";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { autoShadowVerdict, shadowLevel } from "../core/auto_shadow";
import { applyShadowLevel } from "./lighting";
import { FrameMeter } from "../core/frame_meter";
import { advanceFollow, displayPose, exponentialSmooth, phantomTarget } from "../input";
import { worldPlacementOf } from "../core/object_model";
import { type SceneState } from "./scene_state";
import { followerFor, guardDraw, modelPose, shapeOfBody, writePose } from "./bodies";
import { recomputeOrbitCentre } from "./camera_rig";
import { paint } from "./hud_paint";
import { goalCommitFrame } from "./goal_commit_wiring";
import { goalCaptureFrame } from "./goal_capture_wiring";
import { levelEndFrame } from "./level_end_wiring";
import { gestureChangedSoFar } from "./gesture_wiring";
import { greenBoxFrame, syncOrbitPieceModel } from "./green_box_wiring";
import { restingFaceFrame } from "./resting_face_wiring";

export function startRenderLoop(st: SceneState): void {

  // ⛔⛔ AUDIT 2026-09-27: THE WHOLE FRAME IS GUARDED. Babylon queues the next frame only AFTER this
  // function returns (`AbstractEngine._renderLoop`), so one throw anywhere below used to stop the loop
  // for good — a frozen glass with no error. ⭐ Now it lands on the HUD's DRAWFAULT line and the next
  // frame runs; the inner `guardDraw` around the markers stays, so a marker fault does not skip the rest.
  st.engine.runRenderLoop(() => guardDraw(st, "frame", () => {
    const now = performance.now();

    // ⭐ And on idle frames too: a flip made with an empty glass produces no pointer event.
    const dtSec = st.lastFrameMs === null ? 0 : (now - st.lastFrameMs) / 1000;
    // ⭐ The frame meter: every render-loop interval, so the HUD reports what THIS device takes.
    if (st.lastFrameMs !== null) st.frameMeter.push(now - st.lastFrameMs);
    st.lastFrameMs = now;

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
    // ⭐ `D170`: a demo scene's replay writes its poses (and the camera) first, as the other model writers do.
    advanceDemoFrame(st, dtSec);

    // ⛔⛔ (2026-11-02) the alignment's slerp, the rotation increments' chase, the Pioneer's turn and move cascades are deleted with the parts'
    // translation and rotation (the code is at commit `d8134eb`)

    // ⭐⭐⭐ `D183`: a piece moved into its goal margins is pulled onto its goal, before the meshes are written.
    goalCaptureFrame(st, now);
    // ⭐⭐ `D189`: the goal is COMMITTED when the scene comes to rest after a change — never midway through a movement.
    goalCommitFrame(st);
    // ⭐⭐ the resting faces: the boot pass once the goal's baseline exists, then every part the frame UNSEATED (`resting_face_wiring.ts`).
    restingFaceFrame(st);
    // ⭐⭐ `D180`: the level end — asked only while the scene is at rest; once, it freezes the scene and tells `main.ts`.
    levelEndFrame(st, now);

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
      if (st.world.objects.get(jid)?.orbited === true) continue; // ⭐ prototype: the orbit places it (`greenBoxFrame`)
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
    for (const [fid, mesh] of st.meshOf) {
      // ⭐ prototype (2026-10-09): an ORBITED piece's mesh is the orbit's to place — the model is copied FROM it, never written back
      if (st.world.objects.get(fid)?.orbited === true) continue;
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
      // ⭐ prototype (green box), 2026-10-02: on the softness its kick was sized with (`swayTransTauMs`).
      const transTau = f.swayTransTauMs / 1000;
      f.swayX = advanceFollow(f.swayX, 0, transTau, 1, dtSec);
      f.swayY = advanceFollow(f.swayY, 0, transTau, 1, dtSec);
      f.swayZ = advanceFollow(f.swayZ, 0, transTau, 1, dtSec);
      // ⭐ prototype (green box), 2026-10-02: the swing springs back on the softness its kick was sized with (`swayRotTauMs`) —
      // ⚠ before, it always used the TRANSLATION softness while `spinOthers` sized its impulse with `rotateSwayTauMs` (equal by default).
      const rotTau = f.swayRotTauMs / 1000;
      f.swayRotX = advanceFollow(f.swayRotX, 0, rotTau, 1, dtSec);
      f.swayRotY = advanceFollow(f.swayRotY, 0, rotTau, 1, dtSec);
      f.swayRotZ = advanceFollow(f.swayRotZ, 0, rotTau, 1, dtSec);

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

    // ⛔⛔ (2026-11-02) the alignment's markers (the Follower face's fill, the Pioneer face's contour, the HitFace, the PioneerFaceCursors) are
    // deleted with the parts' alignment (commit `d8134eb`)

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
    {
      // ⭐ `D128`: a frozen body the camera sees from BELOW disappears — its material untouched.
      // ⚠ `isVisible` is what Babylon's default pick reads too, so a press goes through it to
      // what is behind. ⛔ Not inherited: the coloured core (`D125`) is hidden with it.
      const cam: [number, number, number] = [st.camera.position.x, st.camera.position.y, st.camera.position.z];
      for (const [fid, o] of st.world.objects) {
        if (o.frozen !== true) continue;
        const mesh = st.meshOf.get(fid);
        if (!mesh) continue;
        const want = !hiddenFromBelow(st.world, fid, cam);
        if (mesh.isVisible !== want) mesh.isVisible = want;
        const core = mesh.metadata?.core as { isVisible: boolean } | undefined;
        if (core && core.isVisible !== want) core.isVisible = want;
        // ⭐⭐ `D196`: hidden from below, its TOP FACE's contour shows instead — in its own colour (the floor's sand yellow),
        // never pickable, never an orbit candidate: it can touch nothing.
        const outline = topOutlineFor(st, fid, mesh);
        if (outline !== null && outline.isVisible === want) outline.isVisible = !want;
      }
    }
    // ⭐ The shadow switch (shadowsOn, CAMERA): three soft shadow maps redraw every piece each frame
    // in `Scene_1` — the slider measures what that costs on a weak GPU. ⚠ Written on change only.
    // ⭐⭐ `D138`: 2 = AUTO — shadows ON while the device is measured, then the verdict, once.
    {
      const mode = st.cfg.shadowsOn;
      if (mode !== st.shadowModeSeen) {
        // ⭐ Set (back) to auto: a FRESH measurement, with the shadows on — the old frames were taken
        // under another setting and would decide for the wrong one.
        st.shadowModeSeen = mode;
        if (mode === 2) {
          st.autoShadow = null;
          st.autoShadowArmedAt = now;
          st.frameMeter = new FrameMeter();
        }
        st.hudDirty = true;
      }
      if (mode === 2 && st.autoShadow === null) {
        const v = autoShadowVerdict(st.frameMeter.stats(), now - st.autoShadowArmedAt, st.cfg.autoShadowBudgetMs);
        if (v !== null) {
          st.autoShadow = v;
          st.hudDirty = true;
        }
      }
      // ⭐⭐⭐ (2026-10-15, *"make the green - turquoise piece project shadows, even on low fps device"*) — off means the orbited piece's shadow ALONE, from
      // one light (`shadowLevel`, `applyShadowLevel`); ⛔ every shadow was switched off
      applyShadowLevel(st, shadowLevel(mode, st.autoShadow));
    }
    // ⭐ `D125`: the contour slider. ⚠ Written on change only.
    for (const m of st.contourMats) if (m.alpha !== st.cfg.pieceContourAlpha) m.alpha = st.cfg.pieceContourAlpha;
    // ⭐ `D112`: the timer repaints the HUD once a SECOND, not per frame. ⛔ On the wall clock, not the
    // score's: counted from the first press, it never ticked before a touch — and the `frame` line
    // (and `D138`'s shadow verdict) sat at `—` on an untouched page.
    // ⭐⭐ `D187`: an episode lands the frame its action changes the model — a drag's first step, a capture.
    if (st.gestureBefore !== null && st.episodes.sync(gestureChangedSoFar(st)) > 0) st.hudDirty = true;
    const second = Math.floor(performance.now() / 1000);
    if (second !== st.hudSecond) {
      st.hudSecond = second;
      st.hudDirty = true;
    }
    if (st.hudDirty) {
      st.hudDirty = false;
      // ⛔⛔ (2026-11-04, the audit) the HUD GUARDED ON ITS OWN: a throw in `paint` skipped `scene.render()` every frame — a frozen glass, and the
      // DRAWFAULT line it latched was written only by `paint` itself
      guardDraw(st, "hud", () => paint(st));
    }

    // ⭐ prototype (green box): the green box, midway between the yellow target and the camera — after everything that moved either.
    greenBoxFrame(st, dtSec);
    syncOrbitPieceModel(st);
    orientCubeFrame(st); // ⭐ (2026-10-12, §21) after the camera moved
    st.scene.render();
    st.frames++;
  }));
}

/**
 * ⭐⭐ `D196` — a frozen body's TOP-FACE contour (`topFaceOutline`, `core/underside.ts`), built once from its own hull and pose
 * — a frozen body never moves — in its own colour; hidden until the body is. `null`: no top face, or a body with no shape.
 */
export function topOutlineFor(st: SceneState, id: string, mesh: AbstractMesh): LinesMesh | null {
  if (st.topOutlines.has(id)) return st.topOutlines.get(id)!;
  const pose = worldPlacementOf(st.world, id);
  const ring = pose === null ? null : topFaceOutline(shapeOfBody(st, mesh).points, pose);
  if (ring === null) {
    st.topOutlines.set(id, null);
    return null;
  }
  const lines = CreateLines(`top-outline-${id}`, { points: ring.map((p) => new Vector3(p[0], p[1], p[2])) }, st.scene);
  const c = st.sceneSpec.bodies.find((b) => b.id === id)?.colour ?? [0.84, 0.74, 0.52];
  lines.color = new Color3(c[0], c[1], c[2]);
  lines.isPickable = false;
  lines.metadata = { orbitCandidate: false };
  lines.isVisible = false;
  st.topOutlines.set(id, lines);
  return lines;
}
