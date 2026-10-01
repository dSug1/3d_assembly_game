/**
 * ⭐⭐ **THE GREEN BOX, WIRED** (prototype (green box)) — built once at boot from `input/green_box.ts`'s answer (the smallest yellow body's
 * size), and placed every frame, just before the scene is drawn, midway between the yellow orbit-centre marker and the
 * camera — after everything that moves either (an orbit, a pinch, the wheel, the reset, a demo's camera, the marker's
 * jump to a new barycentre). ⛔ No rule here.
 * ⛔ Not pickable (a touch goes through it to what is behind), not in the model: no collision, no goal, no score.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { sizeM, smallestOfColour } from "../input/green_box";
import { cameraOffset, cameraOrbitAt, cameraOrbitStep, easeOrbit } from "../input/follow_camera";
import { orbitOffset } from "../input/orbit";
import { clampCameraRadiusM } from "../input/pinch";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SCENE_1_PALETTE } from "../content/scene_1";
import type { SceneState } from "./scene_state";

/** ⭐ The green. */
const GREEN = new Color3(0.12, 0.62, 0.2);

export function createGreenBox(st: SceneState): void {
  const yellow = smallestOfColour(st.sceneSpec.bodies, SCENE_1_PALETTE.MAT_C);
  if (yellow === null) {
    st.greenBox = null;
    return;
  }
  const [w, h, d] = sizeM(yellow.dims, st.sceneSpec.unitM ?? 1);
  const box = CreateBox("green-box", { width: w, height: h, depth: d }, st.scene);
  const mat = new StandardMaterial("green-box-mat", st.scene);
  mat.diffuseColor = GREEN;
  box.material = mat;
  box.isPickable = false;
  // ⭐ prototype (green box) (the owner: *"the green cube shall billboard the camera"*): it always turns its 65 × 37 face to the camera.
  // ⛔ Safe only because it has NO parent — a billboarded child keeps its parent's scale and translation and drops its
  // rotation (the PioneerFaceCursor's lesson, `CLAUDE.md`).
  box.billboardMode = Mesh.BILLBOARDMODE_ALL;
  st.greenBox = box;
}

/**
 * ⭐ Every frame (prototype): the box where the orbit rig put it; the camera on ITS orbit (`input/follow_camera.ts`: twice
 * the rig's radius and height, leashed and settled per axis), looking at the yellow target — the orbit centre.
 */
export function greenBoxFrame(st: SceneState, dtSec: number): void {
  const box = st.greenBox;
  if (box === null || st.greenBoxRigM === null) return;
  const now = performance.now();
  const c = st.orbitCentreM;
  // ⭐ The rig — what the input drives, stepping with its events — and the box easing after it every frame.
  const rig = { yaw: st.orbit.yaw, v: st.orbit.elevation, zoom: st.zoom };
  st.boxOrbit = st.boxOrbit === null ? rig : easeOrbit(st.boxOrbit, rig, dtSec * 1000, st.cfg.boxSmoothMs);
  const bo = orbitOffset(st.cfg, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);
  // ⛔ The same near-plane guard the rig's pose had (`applyCamera`): the clamp only shortens.
  const k = bo.radiusM > 1e-9 ? clampCameraRadiusM(bo.radiusM, st.cfg) / bo.radiusM : 1;
  box.position.set(c.x + bo.offsetM[0] * k, c.y + bo.offsetM[1] * k, c.z + bo.offsetM[2] * k);
  const at = { yaw: st.boxOrbit.yaw, v: st.boxOrbit.v };
  // ⭐ The orbit finger, if one is down and orbiting: ticked (a still finger sends no event), and asked per axis.
  const out = st.router.outside();
  const orbiting = out.length === 1 && st.router.objects().length === 0 ? out[0]!.id : null;
  if (st.orbitMotion !== null && st.orbitMotion.pointerId !== orbiting) st.orbitMotion = null;
  let finger: { yaw: boolean; pitch: boolean } | null = null;
  if (st.orbitMotion !== null) {
    st.orbitMotion.tracker.tick(now);
    const ax = st.orbitMotion.tracker.axes;
    finger = { yaw: ax.x === "MOVING", pitch: ax.y === "MOVING" };
  }
  st.cameraOrbit =
    st.cameraOrbit === null
      ? cameraOrbitAt(at, now, st.cfg)
      : cameraOrbitStep(
          st.cameraOrbit,
          at,
          now,
          dtSec * 1000,
          st.cfg,
          {
            leashRad: (st.cfg.cameraLeashDeg * Math.PI) / 180,
            settleDelayMs: st.cfg.cameraSettleDelayMs,
          },
          { yaw: rig.yaw, v: rig.v },
          finger,
        );
  // ⭐ At the box's distance (the box as placed, clamp included) + the radius offset, at the camera's angles plus the
  // owner's offsets.
  const D = Math.PI / 180;
  const o = cameraOffset(
    st.cfg,
    st.cameraOrbit.cam,
    [bo.offsetM[0] * k, bo.offsetM[1] * k, bo.offsetM[2] * k],
    { yawRad: st.cfg.cameraYawOffsetDeg * D, pitchRad: st.cfg.cameraPitchOffsetDeg * D },
    st.cfg.cameraRadiusOffsetMm / 1000,
  );
  // ⭐ The owner: *"the camera looks at the yellow target (orbit center)"*.
  st.camera.setPosition(new Vector3(c.x + o[0], c.y + o[1], c.z + o[2]));
  st.camera.setTarget(c.clone());
}
