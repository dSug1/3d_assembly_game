/**
 * THE CAMERA RIG — the orbit, the zoom, the centre blend, the reset, the gesture frames. ⛔ The rules are `input/orbit.ts`'s, `input/pinch.ts`'s and `input/camera_reset.ts`'s.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { pinchAllowed } from "../input/pinch";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { clampCameraRadiusM, nearestPairCentre, gravityFrame, type GravityFrame, type CameraPose, type Sample, type ScreenFrame } from "../input";
import { type Vec3 } from "../core/vec";
import { blendRig, horizontalShare, rigPlace, rigTurnFor, snapToGravity, type RigCameraFrame, type RigParams } from "../input/orbit_rig";
import { pauseEndNearer, pauseUnderWay } from "../input/top_pause";
import { cameraFrameHeld } from "../input/camera_frame";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { WORLD_DOWN } from "../core/object_model";
import { type SceneState } from "./scene_state";
import { asVec3, modelPose } from "./bodies";

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
    // ⭐ prototype (green box): frozen bodies (the floor) are not candidates — `nearestPairCentre`.
    .filter((m) => {
      const id = st.idOf.get(m);
      return id === undefined || st.world.objects.get(id)?.frozen !== true;
    })
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
  // ⭐⭐ prototype (green box): the MIDPOINT of the two piece centres nearest the ray (the owner, 2026-10-01) — it replaces
  // `orbitCentre`'s subset barycentres here. ⭐ No piece: the target stays where it is.
  const c =
    nearestPairCentre(visible, {
      origin: [ray.origin.x, ray.origin.y, ray.origin.z],
      direction: [ray.direction.x, ray.direction.y, ray.direction.z],
    }) ?? st.centreBlend.targetM;
  // ⚠ RETARGET, never assign. The blend starts from wherever the centre actually is,
  // so interrupting a half-finished migration does not put the jump back.
  st.centreBlend.retarget(c);
  syncCentre(st);
}


/** ⭐⭐⭐ (2026-10-16) the rig's turn NOW — the old and the new BLENDED at the gizmo's share (`blendRig`): the piece and the camera read this one. */
export function rigNow(st: SceneState): RigParams {
  return blendRig(st.rigFrom, st.rigTo, st.rigShare);
}

/** ⭐⭐⭐ (2026-10-16) THE PIECE'S RING PLACE now (from the gizmo): the turned curve swung round the gizmo's vertical (`rigPlace`), on the turn now. */
export function ringPlaceNow(st: SceneState, yaw: number, v: number, zoom: number): Vec3 {
  return rigPlace(st.cfg, rigNow(st), yaw, v, zoom);
}

/** ⭐⭐⭐ (2026-10-16) THE CAMERA'S FRAME now — derived from the piece's place at the camera's orbit place, on the same turn; between rings 2 and 3 the
 * semi-isometric hold — the whole composition is `cameraFrameHeld` (`input/camera_frame.ts`), its up carried from the last frame drawn (`st.cameraPrev` — the ORBIT's frame, whatever camera the screen shows over it: the way in, a hover). */
export function cameraFrameNow(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset, dtMs?: number): RigCameraFrame {
  // ⭐⭐⭐ (2026-10-21) over a horizontal face the TOP FACE PAUSE's share as drawn (`st.topPauseShown`) turns the camera half round while the piece waits
  return cameraFrameHeld(st.cfg, st.rigFrom, st.rigTo, st.rigShare, cam.pause === undefined ? { ...cam, pause: st.topPauseShown } : cam, off, st.cameraPrev ?? null, dtMs);
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"fix the rotation at the camera's yaw when the gizmo moves"*) — the gizmo moved onto a face (`normal`, world; `null`:
 * none): the new turn takes the curve's direction halfway between rings 2 and 3, at the camera's yaw, onto that normal (`rigRotationFor`), the rings'
 * centres beyond the piece as the camera sees it (`rigBetaFor`); blended from the turn it had (the nearer end of a blend in progress).
 */
export function retargetGizmo(st: SceneState, to: Vec3, normal: Vec3 | null, host: string | null = null): void {
  // ⭐⭐ (2026-10-25) the top face pause's roll under way: the change WAITS for its nearer end (`topPauseFrame` finishes or unwinds it, then makes the change)
  if (pauseUnderWay(horizontalShare(st.cfg, st.rigTo) >= 1, st.topPause)) {
    st.gizmoPending = { to, normal, host, end: pauseEndNearer(st.topPause) };
    return;
  }
  st.gizmoPending = null;
  const yaw = st.orbit.yaw;
  const cam = st.camera.position;
  st.rigFrom = rigNow(st); // ⭐ the turn as it stands, a blend in progress included — never a jump
  st.rigShare = 0;
  // ⭐ the new near side the way nearer the old one (it only picks which way a swing turns) — a gizmo change never turns it half a round
  // ⭐⭐ (2026-10-16) the nearer of the two turns at this yaw (`rigTurnFor`): the piece stays on its side through the gizmo's change
  // ⭐⭐⭐ (2026-10-18) the curve turned onto the face SNAPPED BY GRAVITY (`snapToGravity`) — two curves only: horizontal, vertical (its own heading)
  st.rigTo = rigTurnFor(st.cfg, yaw, st.orbit.elevation, snapToGravity(normal), [cam.x - to[0], 0, cam.z - to[2]], st.rigFrom);
  st.centreBlend.retarget(to);
  // ⭐⭐ (2026-10-19) the part the gizmo now rests on — its faces alone give the quads (`quadSourceIds`)
  if ((st.gizmoHost ?? null) !== host) {
    st.gizmoHost = host;
    st.orientDirty = true;
  }
  // ⭐⭐⭐ (2026-10-20) and its FACE — the fourth quad (`quadFrames`)
  const was = st.gizmoNormal ?? null;
  if ((was === null) !== (normal === null) || (was !== null && normal !== null && was[0] * normal[0] + was[1] * normal[1] + was[2] * normal[2] < Math.cos(Math.PI / 180))) st.orientDirty = true;
  st.gizmoNormal = normal;
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
 * ⭐ Write the orbit rig's pose onto the camera — the one writer every camera event calls (reset,
 * startup, pinch, a slider, the orbit drag, the wheel).
 */
export function applyCamera(st: SceneState) {
  // ⛔⛔ THE APPROACH SWING IS DELETED (`D120`, 2026-09-27): the rig pose is the camera, with no
  // offset added on top.
  const pose = st.orbit.pose(st.zoom);
  // ⛔ The rig gives a DIRECTION and a distance; the clamp may only shorten it.
  // Clamping the components independently would change the viewing ANGLE, which is
  // not what a near-plane guard is for.
  const wanted = pose.radiusM;
  const allowed = clampCameraRadiusM(wanted, st.cfg);
  const k = wanted > 1e-9 ? allowed / wanted : 1;
  // ⭐ Prototype: with a green box, the rig puts the BOX where it put the camera — the camera follows it
  // (`green_box_wiring.ts`). Without one (`Scene_0`), the camera as before.
  if (st.greenBox !== null) {
    const c = st.orbitCentreM;
    st.greenBoxRigM = [c.x + pose.offsetM[0] * k, c.y + pose.offsetM[1] * k, c.z + pose.offsetM[2] * k];
    return;
  }
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
  // ⛔ `D118`: never from a mouse — the wheel is the desktop's zoom.
  if (!pinchAllowed(out.map((q) => st.pointerTypeOf.get(q.id) === "mouse" || q.id === MOUSE_SECOND_ID))) return null;
  return [out[0]!.last, out[1]!.last];
}

export function updatePinch(st: SceneState) {
  const p = pinchPair(st);
  if (!p) return;
  // ⭐⭐ (2026-10-12, the owner: *"Simplify the zoom so that this reverts back to the standard zoom input design for mobile"*) — the STANDARD pinch:
  // the zoom follows the fingers' distance from the pinch's start; ⛔ the dx gate (2026-10-10) and the moving-fingers gate (2026-10-06) deleted
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


export function screenFrame(st: SceneState) : ScreenFrame {
return ({
  right: asVec3(st.camera.getDirection(Vector3.Right())),
  up: asVec3(st.camera.getDirection(Vector3.Up())),
  viewAxis: asVec3(st.camera.getDirection(Vector3.Forward())),
});
}
