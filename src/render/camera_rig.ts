/**
 * THE CAMERA RIG — the orbit, the zoom, the centre blend, the reset, the gesture frames. ⛔ The rules are `input/orbit.ts`'s, `input/pinch.ts`'s and `input/camera_reset.ts`'s.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { clampCameraRadiusM, orbitCentre, gravityFrame, CameraResetAnimation, type GravityFrame, type CameraPose, type Sample, type ScreenFrame } from "../input";
import { type Vec3 } from "../core/vec";
import { WORLD_DOWN } from "../core/object_model";
import { pitchOffsetV, pitchAngleFor } from "../input/approach_swing";
import { ORBIT_START_ELEVATION, ORBIT_START_YAW_RAD, type SceneState } from "./scene_state";
import { asVec3, modelPose } from "./bodies";
import { swingAngleNow } from "./highlight_pass";

/**
 * §2 rule 1's orbit centre: the barycentre nearest the touchpoint's ray.
 * ⚠ Only the objects actually ON SCREEN are offered — the spec asks for candidates
 * to be viewport-culled before ranking, and culling needs the projection, which is
 * why it happens here and not in `input/`.
 */
export function recomputeOrbitCentre(st: SceneState, e: { clientX: number; clientY: number }) {
  const ray = st.scene.createPickingRay(e.clientX, e.clientY, null, st.camera);
  const visible = st.scene.meshes
    .filter(
      (m) =>
        m.isEnabled() && m.isVisible && m.metadata?.orbitCandidate === true,
    )
    // ⛔⛔ THE HOME POSITION, WITH THE SWAY TAKEN BACK OFF. The sympathetic sway is a
    // decoration: it must not move what the scene MEANS. Reading `mesh.position`
    // directly would let the barycentre — and so where the camera orbits — depend on
    // whether the objects happened to be mid-wobble when the finger landed.
    // ⚠ `METHOD`: an instrument must not be moved by the thing it is measuring.
    // ⭐⭐ NOW IT READS THE MODEL, so there is no sway to subtract: the decoration
    // never enters the object's real placement in the first place. The subtraction this
    // replaces was correct but defensive — it undid a contamination that can no longer
    // happen. `display_pose.meaningfulPose` is the statement of that rule.
    .map((m) => {
      const mp = modelPose(st, m);
      return mp
        ? mp.position
        : ([m.position.x, m.position.y, m.position.z] as Vec3);
    });
  const c = orbitCentre(
    visible,
    {
      origin: [ray.origin.x, ray.origin.y, ray.origin.z],
      direction: [ray.direction.x, ray.direction.y, ray.direction.z],
    },
    st.cfg,
  );
  // ⚠ RETARGET, never assign. The blend starts from wherever the centre actually is,
  // so interrupting a half-finished migration does not put the jump back.
  st.centreBlend.retarget(c);
  syncCentre(st);
}


/** Read the blended centre into the scene, and show the chosen target. */
export function syncCentre(st: SceneState) {
  const c = st.centreBlend.centreM;
  st.orbitCentreM = new Vector3(c[0], c[1], c[2]);
  // ⭐⭐ THE MARKER JUMPS TO THE CHOSEN BARYCENTRE IMMEDIATELY, while the camera
  // migrates to it. Owner's instruction, and it is the right reading of what the
  // marker is FOR: it exists to show which barycentre rule 1 SELECTED, so a marker
  // that crawls along with the camera makes the selection harder to read rather
  // than easier. ⚠ The migration is still visible — as the gap between the camera
  // and a marker that is already where it is going.
  const t = st.centreBlend.targetM;
  st.centreMarker.position.set(t[0], t[1], t[2]);
}


/** Put the camera where the rig surface says, clamped away from the near plane. */
/**
 * §1.3's DOUBLE-TAP outside any object: put the camera back where it launched.
 * ⛔ Everything that defines the view — yaw, elevation, zoom AND the orbit centre.
 * Resetting the angles but leaving the centre where a barycentre had moved it would
 * give a "default" view of somewhere the camera has never been.
 */
export function resetCamera(st: SceneState) {
  // ⚠ Any centre still waiting out its grace is dropped: it was chosen for a gesture
  // that has turned out to be a reset.
  st.pendingCentre = null;

  // ⭐⭐ HOME IS THE LAST YELLOW TARGET, NOT THE ORIGIN. The marker shows the barycentre
  // §2 rule 1 last CHOSE, and that is the thing the user has been orbiting — sending
  // the camera back to the world origin instead would reset it to a place it may never
  // have looked at. ⚠ Only the ANGLES and the zoom go back to their launch values.
  const home: CameraPose = {
    yawRad: ORBIT_START_YAW_RAD,
    elevation: ORBIT_START_ELEVATION,
    // ⚠ THE BOOT ZOOM, NOT 1. ⛔ *"Home"* has to be the view the session opened with, or a
    // double tap would fly the camera somewhere the user has never seen — the same argument
    // this function already makes about the orbit CENTRE, applied to the zoom.
    zoom: st.orbitStartZoom,
    centreM: st.centreBlend.targetM,
  };
  const now: CameraPose = {
    yawRad: st.orbit.yaw,
    elevation: st.orbit.elevation,
    zoom: st.zoom,
    centreM: st.centreBlend.centreM,
  };

  if (st.cfg.cameraResetMs > 0) {
    // ⛔ A blend in flight is ABANDONED to the animation: two things easing the same
    // centre on two different clocks would fight, and the finger-travel one cannot
    // even advance — a double-tap supplies no travel.
    st.centreBlend.snapTo(now.centreM);
    st.cameraReset = new CameraResetAnimation(now, home, st.cfg.cameraResetMs);
    return;
  }

  st.cameraReset = null;
  applyCameraPose(st, home);
}


/** Put the camera exactly at a pose. Shared by the reset's every frame and its end. */
export function applyCameraPose(st: SceneState, p: CameraPose) : void {
  st.orbit.reset(p.yawRad, p.elevation);
  st.zoom = p.zoom;
  st.zoomAtPinchStart = p.zoom;
  st.centreBlend.snapTo(p.centreM);
  syncCentre(st);
  applyCamera(st);
}


/**
 * ⭐⭐⭐ **THE SWING IS NOW YAW *AND* PITCH** — the owner, 2026-09-19: *"also add a pitch
 * swing of the same value … the swing of the camera helps the user visualize the alignment in
 * the directions orthogonal to the translation approach."*
 *
 * ⛔ **ONE ANGLE, APPLIED ON TWO AXES.** *"The same value"* is taken literally: both halves
 * are the same `sin(π p)`, so the camera leaves on a diagonal and comes back along it — one
 * motion rather than two that happen to coincide. ⚠ They also therefore reach zero together,
 * which is what keeps *"back to its original position"* true for both.
 *
 * ⭐⭐ **AND THE SAME SIGN.** A dx approach is horizontal, so the two orthogonal directions it
 * cannot show are DEPTH (which the yaw reveals) and HEIGHT (the pitch). ⚠ Giving them opposite
 * signs would sweep the camera along the other diagonal — equally defensible, and a hand
 * decides. This is the one line to try if the motion reads oddly.
 */
export function applyCamera(st: SceneState) {
  const a = swingAngleNow(st);
  const rings = st.orbit.ringElevationRad();
  // ⛔ THE PITCH TAKES THE MAGNITUDE, NOT THE SIGNED ANGLE — `pitchAngleFor` argues why: the
  // owner's expectation names ONE vertical direction for both drag directions.
  const pose = st.orbit.pose(
    st.zoom,
    a,
    pitchOffsetV(pitchAngleFor(a), rings.bottom, rings.top),
  );
  // ⛔ The rig gives a DIRECTION and a distance; the clamp may only shorten it.
  // Clamping the components independently would change the viewing ANGLE, which is
  // not what a near-plane guard is for.
  const wanted = pose.radiusM;
  const allowed = clampCameraRadiusM(wanted, st.cfg);
  const k = wanted > 1e-9 ? allowed / wanted : 1;
  st.camera.setPosition(
    st.orbitCentreM.add(
      new Vector3(
        pose.offsetM[0] * k,
        pose.offsetM[1] * k,
        pose.offsetM[2] * k,
      ),
    ),
  );
  st.camera.setTarget(st.orbitCentreM);
}


/**
 * The two outside touchpoints, OLDEST FIRST, or `null` unless there are exactly two
 * and nothing is being held. ⭐ Press order is the router's `seq`, not a `Map`'s
 * insertion order — the two agree until an id is reused.
 */
export function pinchPair(st: SceneState) : [Sample, Sample] | null {
  const out = st.router.outside();
  if (out.length !== 2 || st.router.objects().length !== 0) return null;
  return [out[0]!.last, out[1]!.last];
}

export function updatePinch(st: SceneState) {
  const p = pinchPair(st);
  if (!p) return;
  const factor = st.pinch.scale(p[0], p[1]);
  if (factor === null) return; // still inside the deadband: leave the camera alone
  st.zoom = st.zoomAtPinchStart * factor;
  applyCamera(st);
}


/**
 * The camera's screen axes in WORLD space. ⚠ Latched at press, not recomputed per
 * frame: rule 1's camera orbit must not silently redefine the axes half-way
 * through a gesture. Same lesson as §1.4's `WORLD_AXIS_ALIGN`.
 */
/**
 * The gesture basis (A7). ⛔ Throws rather than guessing if the camera ever looks exactly
 * along gravity: there is no horizontal heading to call "depth" there, and every
 * direction across the screen would be equally entitled to the name.
 * ⭐ Unreachable by construction — §2 rule 1's orbit surface clamps the elevation to its
 * rings and never reaches a pole — and `requirePose`'s reasoning applies: a guard that
 * turns a broken state into silence is worse than a failure.
 */
export function requireGestureFrame(st: SceneState) : GravityFrame {
  const g = gravityFrame(screenFrame(st).viewAxis, WORLD_DOWN);
  if (!g) {
    throw new Error(
      "the camera is looking exactly along gravity, so there is no gesture frame. " +
        "The orbit surface is supposed to make this unreachable — see A7.",
    );
  }
  return g;
}


/**
 * ⭐⭐⭐ **HAND EVERY LIVE GRIP THE BASIS THE CAMERA IS ACTUALLY AT NOW.**
 *
 * ⛔ Called on ONE event: the end of an approach that left the camera somewhere new
 * (`endApproach().rebaseFrames`). ⚠ Not on a timer, not while the swing is live — the
 * dictation is explicit that the approach axis *"is not updated by the camera orbit"*, and
 * during the lean the displacement is temporary and returns to zero on its own.
 *
 * ⛔⛔ **IT DOES NOT THROW, AND `requireGestureFrame` DOES.** That one is called from a PRESS,
 * where a refusal is the honest answer and lands on the gesture that asked. This runs inside
 * the render loop, where a throw would take the whole frame down for a camera the orbit rings
 * make unreachable anyway. ⭐ So a frame that cannot be built leaves the grip with the basis
 * it has — the previous behaviour, which is a real answer rather than an improvised one.
 */
export function rebaseGestureFrames(st: SceneState) : void {
  const g = gravityFrame(screenFrame(st).viewAxis, WORLD_DOWN);
  if (!g) return;
  for (const grip of st.held.values()) grip.frame = g;
}

export function screenFrame(st: SceneState) : ScreenFrame {
return ({
  right: asVec3(st.camera.getDirection(Vector3.Right())),
  up: asVec3(st.camera.getDirection(Vector3.Up())),
  viewAxis: asVec3(st.camera.getDirection(Vector3.Forward())),
});
}
