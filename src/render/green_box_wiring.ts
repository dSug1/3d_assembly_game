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
import { bodyNamed, faceToward, greenPyramidSizeM, pinkRingVisibility } from "../input/green_box";
import { SCENE_1_PALETTE } from "../content/scene_1";
import { faceWorld } from "../core/object_model";
import { cameraRelease, frustumVolumeM3, inertiaTauMs } from "../input/orbit_inertia";
import { trackingMetresPerPx } from "../input";
import { OBJECT_TOP_SCALE } from "../core/scene_dims";
import { taperMesh } from "./bodies";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Ray } from "@babylonjs/core/Culling/ray";
import { GIZMO_RING_PX, RING_POINTS } from "./scene_state";
import { cameraLag, cameraOffset, cameraOrbitAt, cameraOrbitStep, springOrbit } from "../input/follow_camera";
import { orbitOffset } from "../input/orbit";
import { clampCameraRadiusM } from "../input/pinch";
import { goalLocked } from "../input/goal_lock";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { SceneState } from "./scene_state";

/** ⭐ The green. */
const GREEN = new Color3(0.12, 0.62, 0.2);

export function createGreenBox(st: SceneState): void {
  // ⭐⭐ prototype (green box), the owner 2026-10-02: *"replace the green box by a green trapezoidal pyramid (same type as the one
  // in scene 0). Dimensions = 150 % dimensions of the piece 17"*, then *"divide the height of the green piece by 2"* — Piece17's
  // core × 1.5, the height halved, the length cut by 25 % (103.5 × 41.25 × 45 mm in `Scene_1`, `greenPyramidSizeM`), its
  // top tapered to half (`OBJECT_TOP_SCALE`, `Scene_0`'s pyramid) by `taperMesh`. ⛔ It was the smallest yellow piece's box.
  const piece17 = bodyNamed(st.sceneSpec.bodies, "Piece17");
  if (piece17 === null) {
    st.greenBox = null;
    return;
  }
  const [w, h, d] = greenPyramidSizeM(piece17.dims, st.sceneSpec.unitM ?? 1);
  // ⭐ Its volume (the frustum, not its bounding box) — what the orbit's inertia is sized by (`inertiaTauMs`).
  st.greenPieceVolumeM3 = frustumVolumeM3(w, h, d, OBJECT_TOP_SCALE);
  const box = CreateBox("green-box", { width: w, height: h, depth: d }, st.scene);
  if (!taperMesh(box, OBJECT_TOP_SCALE)) st.untaperedBodies.push("green-box");
  const mat = new StandardMaterial("green-box-mat", st.scene);
  mat.diffuseColor = GREEN;
  box.material = mat;
  // ⭐ prototype (green box), 2026-10-01: PICKABLE, so it stops the ray — a press on it is empty space (`throughGreenBox`).
  box.isPickable = true;
  // ⭐ prototype (green box): NOT billboarded (the owner, 2026-10-02: *"remove the billboarding"* — it had been since *"the green
  // cube shall billboard the camera"*). It keeps the world's axes: its width along x, its tapered height up y, its depth along z.
  box.billboardMode = Mesh.BILLBOARDMODE_NONE;
  st.greenBox = box;
  // ⭐⭐ prototype (green box): the PINK RING at the yellow target — billboarded, the amber gizmo ring's size on the glass
  // (`GIZMO_RING_PX`), drawn on top; WHAT hides it is decided each frame by a ray (`pinkRingFrame`).
  // ⭐ prototype (green box), the owner 2026-10-02: *"make the pink ring slightly thicker and brighter so I can see it better"*.
  // ⛔ WebGL draws a line ONE pixel wide whatever is asked, so the band is `PINK_RING_LOOPS` concentric loops half a pixel apart
  // (~3 px), one line system — still billboarded, unpickable, and hidden / translucent by the same rule.
  const ring = CreateLineSystem(
    "pink-target-ring",
    { lines: PINK_RING_LOOPS.map((k) => RING_POINTS.map((p) => p.scale(k))) },
    st.scene,
  );
  ring.color = PINK.clone();
  ring.isPickable = false;
  ring.metadata = { orbitCandidate: false };
  ring.billboardMode = Mesh.BILLBOARDMODE_ALL;
  ring.renderingGroupId = 2;
  st.pinkRing = ring;
}

/** ⭐ The pink — brighter since 2026-10-02 (it was 1, 0.42, 0.78). */
const PINK = new Color3(1, 0.6, 0.9);
/**
 * ⭐ The band's loops, as scales of the ring: the ring is `GIZMO_RING_PX` (11 px) across, so 1 px of radius is 2/11 ≈ 0.18 of its
 * radius; loops ±1 px around it, half a pixel apart — a ~3 px band centred on the old line.
 */
const PINK_RING_LOOPS = [-1, -0.5, 0, 0.5, 1].map((px) => 1 + (px * 2) / GIZMO_RING_PX);
/** ⭐ The ring's alpha when only the green piece is in front of it — *"slightly translucent"*. */
const PINK_MASKED_ALPHA = 0.35;
/** ⭐ A hit counts as IN FRONT only if nearer than the target by more than this — the piece it sits on is met right at it. */
const PINK_EPS_M = 0.002;

/**
 * ⭐⭐ prototype (green box) — **THE PINK RING, EACH FRAME**: at the yellow target, the amber ring's size on the glass, and
 * hidden / translucent / visible by what the camera's ray meets before the target (`pinkRingVisibility`). ⛔ Frozen bodies
 * (the floor) never hide it; the ring itself and the markers are not pickable, so they are never met.
 */
export function pinkRingFrame(st: SceneState): void {
  const ring = st.pinkRing;
  if (ring === null) return;
  const t = st.centreBlend.targetM;
  const cam = st.camera.position;
  const dir = new Vector3(t[0] - cam.x, t[1] - cam.y, t[2] - cam.z);
  const dist = dir.length();
  if (!(dist > 1e-6)) {
    ring.isVisible = false;
    return;
  }
  const hits = (
    st.scene.multiPickWithRay(new Ray(cam.clone(), dir.scale(1 / dist), dist), (m) => {
      if (!m.isPickable || !m.isVisible || !m.isEnabled()) return false;
      if (m === st.greenBox) return true;
      const id = st.idOf.get(m);
      return id !== undefined && st.world.objects.get(id)?.frozen !== true;
    }) ?? []
  ).map((h) => ({ distanceM: h.distance, isGreenBox: h.pickedMesh === st.greenBox }));
  // ⭐ At the BOOT target (no placed-piece press yet), never hidden — translucent behind pieces (the owner, 2026-10-02).
  const v = pinkRingVisibility(hits, dist, PINK_EPS_M, !st.targetSetByPress);
  ring.isVisible = v !== "HIDDEN";
  ring.alpha = v === "TRANSLUCENT" ? PINK_MASKED_ALPHA : 1;
  const m = trackingMetresPerPx(dist, st.camera.fov, st.canvas.clientHeight) * GIZMO_RING_PX;
  ring.scaling.set(m, m, m);
  ring.position.set(t[0], t[1], t[2]);
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
  // ⭐⭐ prototype (green box), 2026-10-02: the orbit's INERTIA — with no finger down it coasts on, slowing with τ = the gain × the
  // green piece's volume (`OrbitInertia`, `inertiaTauMs`); a NEW touch stops it at once.
  if (st.router.size > 0) {
    if (st.orbitMotion === null) st.orbitInertia.stop();
  } else if (st.orbitInertia.coasting) {
    const d = st.orbitInertia.step(dtSec * 1000, inertiaTauMs(st.greenPieceVolumeM3, st.cfg.orbitInertiaGain));
    st.orbit.nudge(d.dYaw, d.dV);
  }
  const rig = { yaw: st.orbit.yaw, v: st.orbit.elevation, zoom: st.zoom };
  // ⭐ prototype (green box), 2026-10-02: on a critically damped SPRING (`springOrbit`) — no speed jump at a pointer event, so
  // the camera's time lag no longer shows a pulse (it was `easeOrbit`, one exponential). Same response: τ = boxSmoothMs / 2.
  st.boxSpring =
    st.boxSpring === null
      ? { at: rig, velYaw: 0, velV: 0, velLnZoom: 0 }
      : springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  st.boxOrbit = st.boxSpring.at;
  const bo = orbitOffset(st.cfg, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);
  // ⛔ The same near-plane guard the rig's pose had (`applyCamera`): the clamp only shortens.
  const k = bo.radiusM > 1e-9 ? clampCameraRadiusM(bo.radiusM, st.cfg) / bo.radiusM : 1;
  box.position.set(c.x + bo.offsetM[0] * k, c.y + bo.offsetM[1] * k, c.z + bo.offsetM[2] * k);
  const at = { yaw: st.boxOrbit.yaw, v: st.boxOrbit.v };
  // ⭐ The orbit finger, if one is down and orbiting: ticked (a still finger sends no event), and asked per axis.
  const out = st.router.outside();
  const objs = st.router.objects();
  // ⭐ prototype (green box): or ONE finger on a piece locked in its goal — its drag orbits too (`orbitDragStep`).
  const lockedHolder =
    out.length === 0 && objs.length === 1 && st.held.get(objs[0]!.id) !== undefined &&
    goalLocked(st.idOf.get(st.held.get(objs[0]!.id)!.mesh), st.goalCommit, st.cfg.lockPlacedPieces === 1);
  const orbiting = out.length === 1 && objs.length === 0 ? out[0]!.id : lockedHolder ? objs[0]!.id : null;
  // ⭐ The finger leaving the orbit (lifted, or a second finger down) is a RELEASE: the camera realigns.
  const released = st.orbitMotion !== null && st.orbitMotion.pointerId !== orbiting;
  if (released) {
    st.orbitMotion = null;
    // ⭐ The finger lifted: the coast starts at the orbit's rate over the last moments of the drag.
    st.orbitInertia.release(now);
  }
  let finger: { yaw: boolean; pitch: boolean; holdMs: number } | null = null;
  if (st.orbitMotion !== null) {
    st.orbitMotion.tracker.tick(now);
    const ax = st.orbitMotion.tracker.axes;
    finger = { yaw: ax.x === "MOVING", pitch: ax.y === "MOVING", holdMs: st.orbitMotion.tracker.restMs };
  } else if (st.orbitInertia.coasting) {
    // ⭐⭐ prototype (green box), 2026-10-02: a COASTING orbit is an input still MOVING — the camera follows it exactly as a drag
    // (⛔ read as stopped, the lift frame ran the camera's glide ahead of the green piece and the leash pinned it back: a jump).
    finger = { yaw: true, pitch: true, holdMs: 0 };
  }
  // ⭐ …and the release reaches the camera only once the coast is over (`cameraRelease`) — its catch-up then, not mid-coast.
  const rel = cameraRelease(released, st.orbitInertia.coasting, st.cameraReleasePending);
  st.cameraReleasePending = rel.pending;
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
            restTauMs: st.cfg.cameraCatchUpMs,
          },
          { yaw: rig.yaw, v: rig.v },
          finger,
          rel.release,
        );
  // ⭐⭐ prototype (green box), the owner 2026-10-02: the TIME LAG on top of the leash — the camera eases toward where the leash
  // puts it (`cameraLag`, `cameraFollowMs`; 0 = none).
  st.cameraLagged =
    st.cameraLagged === null
      ? st.cameraOrbit.cam
      : cameraLag(st.cameraLagged, st.cameraOrbit.cam, dtSec * 1000, st.cfg.cameraFollowMs);
  // ⭐ At the box's distance (the box as placed, clamp included) + the radius offset, at the camera's angles plus the
  // owner's offsets.
  const D = Math.PI / 180;
  const o = cameraOffset(
    st.cfg,
    st.cameraLagged,
    [bo.offsetM[0] * k, bo.offsetM[1] * k, bo.offsetM[2] * k],
    { yawRad: st.cfg.cameraYawOffsetDeg * D, pitchRad: st.cfg.cameraPitchOffsetDeg * D },
    st.cfg.cameraRadiusOffsetMm / 1000,
  );
  // ⭐ The owner: *"the camera looks at the yellow target (orbit center)"*.
  st.camera.setPosition(new Vector3(c.x + o[0], c.y + o[1], c.z + o[2]));
  st.camera.setTarget(c.clone());
  // ⭐ prototype (green box): the green piece's distance to the YELLOW target (the marker — where the centre is going, not
  // the blend in progress), for the HUD's `green` line (the owner, 2026-10-02).
  const tgt = st.centreBlend.targetM;
  st.greenBoxDistM = Math.hypot(box.position.x - tgt[0], box.position.y - tgt[1], box.position.z - tgt[2]);
  pinkRingFrame(st);
}

/**
 * ⭐⭐ prototype (green box), the owner 2026-10-02: *"at boot, place the orbit center to center of the face of the blue piece which
 * faces the green piece"* — the boot yellow target (`faceToward`): the blue piece's face whose normal points most toward the
 * green piece's boot direction (the rig's boot yaw and elevation, at the boot zoom), at that face's centre. `null` with no blue
 * piece (the scene's own boot centre then).
 */
export function bootTargetOnBlueFace(st: SceneState): [number, number, number] | null {
  const blue = st.sceneSpec.bodies.find((b) => b.colour.every((c, i) => c === SCENE_1_PALETTE.MAT_E[i]));
  const o = blue === undefined ? undefined : st.world.objects.get(blue.id);
  if (blue === undefined || o === undefined) return null;
  const faces = o.faces
    .map((f) => faceWorld(st.world, blue.id, f.id))
    .filter((f): f is NonNullable<typeof f> => f !== null);
  const toward = orbitOffset(st.cfg, st.orbit.yaw, st.orbit.elevation, st.orbitStartZoom).offsetM;
  const face = faceToward(faces, toward);
  return face === null ? null : [face.centre[0], face.centre[1], face.centre[2]];
}
