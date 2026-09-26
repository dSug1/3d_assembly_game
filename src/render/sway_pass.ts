/**
 * THE SYMPATHETIC SWAY — the nudge and the spin of the other bodies. ⛔ Who sways is `input/sway.ts`'s `receivesSway`.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { impulseForPeak, trackingMetresPerPx, swayScale, receivesSway, pioneerSwaySuppressed, swayWorldDirection, type SwayKick, type SpinSwayKick } from "../input";
import { type Vec3 } from "../core/vec";
import { type ObjectId } from "../core/object_model";
import { mmToPx } from "../core/units";
import { surfaceGap } from "../core/proximity";
import { captureOffsetM } from "../input/highlight";
import { type Held, type SceneState } from "./scene_state";
import { bodyOf, followerFor, modelOrientation } from "./bodies";
import { inAssemblyWith } from "./alignment_wiring";

/**
 * ⭐⭐⭐ **THE ROTATIONAL SWAY, FOR EVERY PATH THAT TURNS A HELD OBJECT.**
 *
 * ⛔⛔ DEVICE-REPORTED 2026-09-17: *"when the object is aligned and rotates, you lost the
 * sway in the other objects."* ⭐ Exactly right, and the cause was an early `return`: the
 * aligned twist (2sexte) applied its rotation and returned from the handler, so the sway
 * block at the END of the rotate branch never ran. The free rotation kept its sway, which
 * is why only ALIGNED objects lost it.
 *
 * ⚠⚠ THE SHAPE, AND IT IS WHY THIS IS A FUNCTION AND NOT A FIX IN TWO PLACES: a rule
 * added later took a shortcut past a consequence that an earlier rule reached by falling
 * through. ⛔ Three paths now turn a held object — free rotation, the aligned twist, and the
 * second finger's roll — and a fourth is likely. Each calls this; none can forget it.
 *
 * ⭐ It also keeps the held object's follower `qHome` in step, which the render loop needs
 * or it would fight the rotation rule.
 */
export function noteSpin(st: SceneState, grip: Held, t: number) : void {
  const home = modelOrientation(st, grip.mesh);
  followerFor(st, grip.mesh).qHome = home;
  const spin = grip.spinSway.push(home, t, true);
  if (spin && st.cfg.rotateSwayDeg > 0) spinOthers(st, grip, spin);
}


/**
 * Kick every OTHER object along the direction the held one has just set off in.
 *
 * ⛔ THE AMPLITUDE IS IN SCREEN MILLIMETRES, converted through the same tracking factor
 * rule 6 uses — so the sway looks the same size at every zoom. A world-metre amplitude
 * would disappear zoomed out and swamp the scene zoomed in.
 * ⚠ The direction comes from the finger's travel since the last sample, mapped through
 * the axes LATCHED AT PRESS — the same frame the translation itself uses, so the scene
 * cannot lean one way while the object goes another.
 */
/**
 * ⭐ The sympathetic sway, given a WORLD direction the held object set off in.
 *
 * ⛔ Split out of `nudgeOthers` when amendment A5's depth pinch needed the same
 * reaction. The pinch already knows its world direction and has no screen heading to
 * convert, so the conversion moved OUT and the reaction stayed put. ⚠ One
 * implementation: a second copy would let the scene lean one way for a drag and another
 * for a pinch, which is the drift `CONSTRAINTS` §4 exists to stop.
 * ⭐ It reads the SAME four tunables the drag's sway does — amplitude, softness,
 * re-trigger and reference speed — so no new slider appears for a second cause.
 */
/**
 * ⭐⭐ **IS A TOUCHPOINT PRESSED ON THIS BODY?** — `D53`'s sway exclusion.
 *
 * ⛔ Read from `held`, which is keyed by pointer id, so it answers *is a finger on it right
 * now* rather than *did something move it*. ⚠ `A15`'s ORPHANED grip still counts: the finger
 * is down and the user believes they are holding the part, which is exactly whose placement
 * the sway must not disturb.
 */
export function isGrasped(st: SceneState, id: ObjectId) : boolean {
  for (const g of st.held.values()) if (st.idOf.get(g.mesh) === id) return true;
  return false;
}


/**
 * ⭐ Is the held body within `pioneerSwayRadii` capture offsets of its Pioneer? ⛔ The two
 * numbers are the white contour's own: the SURFACE gap and the offset in world metres at the
 * current camera distance, so the sway's *near* is the capture's *near*.
 */
export function moverNearPioneer(st: SceneState, heldId: ObjectId | null,
  pioneerId: ObjectId | null,) : boolean {
return heldId !== null &&
  pioneerId !== null &&
  pioneerSwaySuppressed(
    surfaceGap(st.world, heldId, pioneerId),
    captureOffsetM(
      st.cfg.captureOffsetMm,
      st.camera.radius,
      st.camera.fov,
      st.canvas.clientHeight,
    ),
    st.cfg.pioneerSwayRadii,
  );
}

export function nudgeOthersWorld(st: SceneState, heldMesh: AbstractMesh,
  dir: Vec3,
  speedMmPerS: number,) : void {
  const perPx = trackingMetresPerPx(
    st.camera.radius,
    st.camera.fov,
    st.canvas.clientHeight,
  );
  // ⭐ Amplitude × how fast the object set off. Slow, small and slow; fast, bigger AND
  // quicker — it still peaks at the same time constant, so a larger excursion covers
  // that ground faster. See `swayScale`, which clamps the ratio.
  const scale = swayScale(speedMmPerS, st.cfg.swayReferenceSpeedMmPerS);
  const peakM = mmToPx(st.cfg.translateSwayMm) * perPx * scale;
  const impulse = impulseForPeak(peakM, st.cfg.translateSwayTauMs / 1000);
  if (!(impulse > 0)) return;

  const heldId = st.idOf.get(heldMesh) ?? null;
  // ⭐ The mover's own Pioneer does not sway while the mover is within three capture offsets
  // of it (`receivesSway`, `pioneerSwaySuppressed` — the owner, 2026-09-26).
  const pioneerOfMover =
    heldId === null ? null : (st.links.pioneerFor(heldId)?.objectId ?? null);
  const nearPioneer = moverNearPioneer(st, heldId, pioneerOfMover);
  for (const mesh of st.scene.meshes) {
    // ⛔ The SAME tag §2 rule 1 filters barycentre candidates by, so the diagnostic
    // marker cannot sway — a readout that moved with the scene would be describing
    // itself. And the held object is excluded: it is already going that way.
    if (mesh.metadata?.orbitCandidate !== true) continue;
    if (mesh === heldMesh) continue;
    // ⛔⛔ **AND A FROZEN BODY DOES NOT WOBBLE** — the owner, 2026-09-17. ⚠ The model was
    // frozen and the PICTURE was not: the sway is a display offset added after the model is
    // read, so the base plate rocked while its placement could not change. ⭐ One predicate,
    // shared with `spinOthers` and vectored in `tests/sway.test.ts`.
    if (
      !receivesSway(
        bodyOf(st, mesh),
        heldId,
        (id: ObjectId) => isGrasped(st, id),
        pioneerOfMover,
        nearPioneer,
        (id) => inAssemblyWith(st, heldId, id),
      )
    )
      continue;
    const f = followerFor(st, mesh);
    f.swayX = { x: f.swayX.x, v: f.swayX.v + dir[0] * impulse };
    f.swayY = { x: f.swayY.x, v: f.swayY.v + dir[1] * impulse };
    f.swayZ = { x: f.swayZ.x, v: f.swayZ.v + dir[2] * impulse };
  }
}


/**
 * Rule 6's drag: convert the screen heading to a world one and hand it over.
 * ⚠ Through the axes LATCHED AT PRESS, the same frame the translation itself uses, so
 * the scene cannot lean one way while the object goes another.
 */
export function nudgeOthers(st: SceneState, grip: Held, kick: SwayKick) : void {
  nudgeOthersWorld(st, 
    grip.mesh,
    swayWorldDirection(grip.frame, kick.dirX, kick.dirY),
    kick.speedMmPerS,
  );
}


/**
 * Swing every OTHER object as a BLOCK about the held object's centre, on the axis it
 * has just started turning about.
 *
 * ⛔ Every object gets the SAME pivot and the SAME impulse, which is what makes it a
 * block rather than a crowd: each one orbits the held object's centre and spins by the
 * same angle, so their relative geometry is preserved through the whole swing.
 * ⚠ Their own distance from the pivot is what makes it read as rotation — an object
 * far from the pivot travels further, exactly as a rigid body does.
 */
export function spinOthers(st: SceneState, grip: Held, kick: SpinSwayKick) : void {
  const scale = swayScale(kick.degPerS, st.cfg.rotateSwayReferenceDegPerS);
  const peakRad = ((st.cfg.rotateSwayDeg * Math.PI) / 180) * scale;
  const impulse = impulseForPeak(peakRad, st.cfg.rotateSwayTauMs / 1000);
  if (!(impulse > 0)) return;

  const pivot = grip.mesh.position;
  const heldId = st.idOf.get(grip.mesh) ?? null;
  // ⭐ …and does not swing either — a follower TURNING is moving too.
  const pioneerOfMover =
    heldId === null ? null : (st.links.pioneerFor(heldId)?.objectId ?? null);
  const nearPioneer = moverNearPioneer(st, heldId, pioneerOfMover);
  for (const mesh of st.scene.meshes) {
    if (mesh.metadata?.orbitCandidate !== true) continue;
    if (mesh === grip.mesh) continue;
    // ⛔⛔ A frozen body does not swing about the held one either — the same rule, the same
    // predicate. ⚠ This is the writer that made the base plate SWING rather than rock, which
    // is the more obvious of the two on the glass.
    if (
      !receivesSway(
        bodyOf(st, mesh),
        heldId,
        (id: ObjectId) => isGrasped(st, id),
        pioneerOfMover,
        nearPioneer,
        (id) => inAssemblyWith(st, heldId, id),
      )
    )
      continue;
    const f = followerFor(st, mesh);
    // ⚠ The pivot is captured per kick and shared by the block. A kick arriving while
    // an older one is still decaying moves the pivot; for the sub-degree swings this
    // produces, the difference is second-order and invisible.
    f.swayPivot.copyFrom(pivot);
    f.swayRotX = {
      x: f.swayRotX.x,
      v: f.swayRotX.v + kick.axis[0] * impulse,
    };
    f.swayRotY = {
      x: f.swayRotY.x,
      v: f.swayRotY.v + kick.axis[1] * impulse,
    };
    f.swayRotZ = {
      x: f.swayRotZ.x,
      v: f.swayRotZ.v + kick.axis[2] * impulse,
    };
  }
}
