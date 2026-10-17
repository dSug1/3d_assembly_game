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
import { blendRig, rigFrameBetween, rigPlace, rigTurnFor, waistV, type RigCameraFrame, type RigParams } from "../input/orbit_rig";
import { frontSide, keepInFront, nearestCorner, waistDirection, waistEntryNext, waistFrame, waistLatchWeight, waistRings } from "../input/waist_view";
import { hoverCameraSwing, slerpDir } from "../input/hover";
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

/** ⭐⭐⭐ (2026-10-16) THE CAMERA'S FRAME now — derived from the piece's place at the camera's orbit place, on the same turn (`rigCameraFrame`). */
export function cameraFrameNow(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  return rigFrameBetween(st.cfg, st.rigFrom, st.rigTo, st.rigShare, cam, off);
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"fix the rotation at the camera's yaw when the gizmo moves"*) — the gizmo moved onto a face (`normal`, world; `null`:
 * none): the new turn takes the curve's direction halfway between rings 2 and 3, at the camera's yaw, onto that normal (`rigRotationFor`), the rings'
 * centres beyond the piece as the camera sees it (`rigBetaFor`); blended from the turn it had (the nearer end of a blend in progress).
 */
export function retargetGizmo(st: SceneState, to: Vec3, normal: Vec3 | null): void {
  const yaw = st.orbit.yaw;
  const cam = st.camera.position;
  st.rigFrom = rigNow(st); // ⭐ the turn as it stands, a blend in progress included — never a jump
  st.rigShare = 0;
  // ⭐ the new near side the way nearer the old one (it only picks which way a swing turns) — a gizmo change never turns it half a round
  // ⭐⭐ (2026-10-16) the nearer of the two turns at this yaw (`rigTurnFor`): the piece stays on its side through the gizmo's change
  st.rigTo = rigTurnFor(st.cfg, yaw, st.orbit.elevation, normal, [cam.x - to[0], 0, cam.z - to[2]], st.rigFrom);
  st.centreBlend.retarget(to);
  syncCentre(st);
}

/**
 * ⭐⭐⭐ (2026-10-17, the owner: *"during the travel between the 2nd ring and the 3rd ring the camera positions itself so that the view is nearly isometric (i.e. same nearest-corner-with-gravity-direction-aligned-with-screen-vertical-direction isometric view as during the slide)"*) — **THE SLIDE VIEW BETWEEN RINGS 2 AND 3**: at the camera's orbit place, with the gizmo on a face, the
 * camera arcs (the slide view's own arc, `hoverCameraSwing`) toward the face's isometric corner about the PIECE (`piece`, world) by `waistLatchWeight` (all along the curve) —
 * looking at it, its distance kept. The corners: ring 2's and ring 3's (their sides along gravity's axis of the face; across it, the camera's own side),
 * turned between or the entry one kept (`waistCornerTurn`). Returns the camera and the weight (the up rolls upright by it).
 */
export function waistViewNow(st: SceneState, piece: Vec3, camAt: Vec3, lookAt: Vec3): { camAt: Vec3; lookAt: Vec3; w: number } {
  const cam = st.cameraLagged ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const s = st.rigShare;
  // ⭐⭐⭐ (2026-10-17, *"build 1 following my suggestion"*) LATCHED all along the curve with the gizmo on a face — no ramp by v (the S on rings 1 and 4)
  const w = waistLatchWeight(!!st.rigFrom.faced, !!st.rigTo.faced, st.rigShare);
  const { v2, v3 } = waistRings(st.cfg);
  st.waistEntry = waistEntryNext(st.waistEntry, cam.v, v2, v3);
  if (!(w > 0)) return { camAt, lookAt, w: 0 };
  // ⭐ the corner taken on each END turn — where its choice is stable — and blended by the gizmo's share (⛔ on the blended turn the rings' sides
  // crossed the face's axis midway: the corner flipped, 32 % of the screen in a frame)
  const cornerOf = (p: RigParams): Vec3 | null => {
    const heading: Vec3 = [Math.cos(cam.yaw + p.beta), 0, Math.sin(cam.yaw + p.beta)];
    const f = waistFrame(rigPlace(st.cfg, p, cam.yaw, waistV(st.cfg), 1), heading);
    if (f === null) return null;
    // the corners' sides: along gravity's axis of the face from the rings' own places; across it, the side the camera's yaw OFFSET puts it on (a
    // fixed setting — ⛔ read off the camera's place it flipped wherever the camera sat in the curve's plane)
    const off = st.cfg.cameraYawOffsetDeg >= 0 ? 0.2 : -0.2;
    const offSide = nearestCorner(f, [Math.cos(cam.yaw + p.beta + off), 0, Math.sin(cam.yaw + p.beta + off)])[0];
    // ⭐⭐⭐ (2026-10-17, *"build 3"*) the side IN FRONT of the face as tapped (the yaw offset's only across a level face)
    const across = p.normal ? frontSide(f, p.normal, offSide) : offSide;
    const a: [number, number] = [across, nearestCorner(f, rigPlace(st.cfg, p, cam.yaw, v2, 1))[1]];
    const b: [number, number] = [across, nearestCorner(f, rigPlace(st.cfg, p, cam.yaw, v3, 1))[1]];
    const d = waistDirection(st.cfg, f, a, b, cam.v, st.cfg.waistCornerTurn === 1, st.waistEntry);
    return p.normal ? keepInFront(d, p.normal) : d; // ⭐ never behind the real face
  };
  const dTo = st.rigTo.faced ? cornerOf(st.rigTo) : null;
  const dFrom = s < 1 && st.rigFrom.faced ? cornerOf(st.rigFrom) : null;
  const dir = dTo !== null && dFrom !== null ? slerpDir(dFrom, dTo, s) : (dTo ?? dFrom);
  if (dir === null) return { camAt, lookAt, w: 0 };
  const sw = hoverCameraSwing(camAt, lookAt, piece, dir, w);
  return { ...sw, w };
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
