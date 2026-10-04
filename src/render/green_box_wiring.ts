/**
 * ⭐⭐ **THE GREEN BOX, WIRED** (prototype (green box)) — built once at boot from `input/green_box.ts`'s answer (the smallest yellow body's
 * size), and placed every frame, just before the scene is drawn, midway between the yellow orbit-centre marker and the
 * camera — after everything that moves either (an orbit, a pinch, the wheel, the reset, a demo's camera, the marker's
 * jump to a new barycentre). ⛔ No rule here.
 * ⛔ Not pickable (a touch goes through it to what is behind), not in the model: no collision, no goal, no score.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { edgeLines } from "./markers";
import { topologyFromMesh } from "./bodies";
import { offsetPositions } from "../core/mesh_topology";
import { highlightLiftM, outlineOffsetStale } from "../input/highlight_lift";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { bodyNamed, cameraGapM, clampGreenZoom, faceToward, GREEN_PIECE_ORBIT_ZOOM, greenPyramidSizeM, minGreenZoom, faceTracking, greenBootOrientation, coarseMinDistance, nextCommit, towardSignAt, waistParam, oppositeFace, snapsActive, pickedFace, pieceFaces, outsideYawShare, accumulateFaceSteps, antiAlignedOrientation, degreesYawPerFace, deltaXYawPerFace, cycleStep, cycleTargets, faceCycles, capTurn, levelHeading, maxSnapTurnDegPerS, mostAntiAligned, orientationAt, scrollIncrements, snapAngle, staircaseAngles, staircaseOrientation, staircasePerOrbitDeg, targetAtStep, turnAxes, pinkRingVisibility } from "../input/green_box";
import { SCENE_1_PALETTE } from "../content/scene_1";
import { faceWorld } from "../core/object_model";
import { cameraRelease, frustumVolumeM3, inertiaTauMs } from "../input/orbit_inertia";
import { trackingMetresPerPx } from "../input";
import { OBJECT_TOP_SCALE } from "../core/scene_dims";
import { taperMesh } from "./bodies";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Ray } from "@babylonjs/core/Culling/ray";
import { GIZMO_RING_PX, RING_POINTS } from "./scene_state";
import { boxDragGains, cameraLag, cameraOffset, cameraOrbitAt, cameraOrbitStep, orbitDegPerMm, springOrbit, wrapPi } from "../input/follow_camera";
import { elevationGainScale, orbitOffset } from "../input/orbit";
import { clampCameraRadiusM } from "../input/pinch";
import { goalLocked } from "../input/goal_lock";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ALIGN_SNAP_FRACTION } from "./scene_state";
import { add, qAngle, qconj, qmul, qRotate, qSlerp, type Quat, type Vec3 } from "../core/vec";
import type { FreeTurn, SceneState } from "./scene_state";

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
  // ⭐ prototype (green box), 2026-10-02: the first orbited piece — its faces are tracked outside the guide sphere (`trackOrbitedFaces`).
  st.orbitedPieces.push(box);
  // ⭐ the owner, 2026-10-04: the boot orientation is the scene's (`greenBootOrientation`: Scene_1 (1,2,3,4) normalized; else the identity)
  box.rotationQuaternion = toBabylon(greenBootOrientation(st.sceneSpec.id));
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
  // ⭐ prototype (green box), the owner 2026-10-02: *"draw a sphere of 75% of the top ring radius, centered on the yellow orbit
  // center. it shall be almost translucent so I can see through. This is for prototyping purpose and will not be shown in the
  // final game"* — a guide, nothing more: unit radius, scaled each frame (`guideSphereFrame`); not pickable, not an orbit
  // candidate (it can block no press and no occlusion ray); both faces drawn, so it reads the same from inside.
  const sphere = CreateSphere("guide-sphere", { diameter: 2, segments: 32 }, st.scene);
  const sm = new StandardMaterial("guide-sphere-mat", st.scene);
  sm.disableLighting = true;
  sm.emissiveColor = new Color3(0.75, 0.85, 1);
  sm.backFaceCulling = false;
  sm.alpha = st.cfg.guideSphereAlpha;
  sphere.material = sm;
  sphere.isPickable = false;
  // ⭐ The green piece's white CONTOUR — its crease edges, offset like the part outlines — shown while it is outside the sphere
  // (`guideSphereFrame`). Parented to it (it is not billboarded), so it turns and moves with it.
  const topo = topologyFromMesh(box);
  if (topo !== null && topo.edges.length > 0) {
    const lines = edgeLines(st, "green-outline", topo, offsetPositions(topo, 0), new Color3(1, 1, 1), null);
    lines.parent = box;
    lines.isPickable = false;
    lines.metadata = { orbitCandidate: false };
    lines.isVisible = false;
    st.greenOutline = { lines, topo, builtM: null };
  }
  sphere.metadata = { orbitCandidate: false };
  st.guideSphere = sphere;
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
  // ⭐ The owner, 2026-10-02: *"the pink ring shall occlude already from boot because it sits on the blue piece face"* — the
  // boot exemption (translucent behind pieces until a placed-piece press, `bootTarget`) is switched OFF: the boot target is on a
  // face now, so the one rule applies from the first frame.
  const v = pinkRingVisibility(hits, dist, PINK_EPS_M);
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
  // ⭐ prototype (green box), 2026-10-02: the zoom moves the CAMERA, not the green piece — it rides the rings as they are, and the
  // one zoom (wheel, pinch, boot) is held to its range here (`clampGreenZoom`), every frame.
  // ⭐⭐ …never closer than keeps the green piece on screen (`minGreenZoom`, the worst case over the rings) — RECOMPUTED ONLY when
  // what it depends on changes (an offset, the margin, the radius offset, the rings, the field of view, the screen's shape — a
  // turn between portrait and landscape): the owner, *"not recomputed at each frame"*. The key is compared each frame; the limit
  // (exact, over 33 positions along the rings, the box's distance clamp included) is computed on a change only.
  const cfg = st.cfg;
  const aspect = st.canvas.clientHeight > 0 ? st.canvas.clientWidth / st.canvas.clientHeight : 1;
  const key = [cfg.cameraYawOffsetDeg, cfg.cameraPitchOffsetDeg, cfg.greenKeepInViewMargin, cfg.cameraRadiusOffsetMm, cfg.cameraRadiusMaxM, cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM, cfg.orbitLowerRingOn, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM, st.camera.fov, aspect].join("|");
  if (key !== st.greenZoomMinKey) {
    st.greenZoomMinKey = key;
    const ring = Array.from({ length: 33 }, (_, i) => {
      const o = orbitOffset(cfg, 0, i / 32, GREEN_PIECE_ORBIT_ZOOM);
      return { distanceM: clampCameraRadiusM(o.radiusM, cfg), pitchRad: Math.atan2(o.offsetM[1], Math.hypot(o.offsetM[0], o.offsetM[2])) };
    });
    st.greenZoomMin = minGreenZoom({
      yawOffsetRad: (cfg.cameraYawOffsetDeg * Math.PI) / 180,
      pitchOffsetRad: (cfg.cameraPitchOffsetDeg * Math.PI) / 180,
      ring,
      radiusOffsetM: cfg.cameraRadiusOffsetMm / 1000,
      fovVerticalRad: st.camera.fov,
      aspect,
      margin: cfg.greenKeepInViewMargin,
    });
    st.hudDirty = true;
  }
  st.zoom = clampGreenZoom(st.zoom, st.greenZoomMin);
  const rig = { yaw: st.orbit.yaw, v: st.orbit.elevation, zoom: GREEN_PIECE_ORBIT_ZOOM };
  // ⭐ prototype (green box), 2026-10-02: on a critically damped SPRING (`springOrbit`) — no speed jump at a pointer event, so
  // the camera's time lag no longer shows a pulse (it was `easeOrbit`, one exponential). Same response: τ = boxSmoothMs / 2.
  st.boxSpring =
    st.boxSpring === null
      ? { at: rig, velYaw: 0, velV: 0, velLnZoom: 0 }
      : springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  st.boxOrbit = st.boxSpring.at;
  const bo = orbitOffset(st.cfg, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);
  // ⛔ The same near-plane guard the rig's pose had (`applyCamera`): the clamp only shortens.
  let k = bo.radiusM > 1e-9 ? clampCameraRadiusM(bo.radiusM, st.cfg) / bo.radiusM : 1;
  // ⭐ approach step 2 (the owner, 2026-10-04: *"increase momentarily the radius of the ring to be able to reach this if the piece is already
  // at the max radius"*): at a ring's END, a pull away (`w` < 0) moves the piece outward by up to `GREEN_BACK_EXTENSION` of its distance —
  // VISUAL: `w` itself counts there anyway (§3.2)
  const atRingEnd = st.orbit.elevation <= 1e-6 || st.orbit.elevation >= 1 - 1e-6;
  if (atRingEnd && st.greenPushMm < 0) k *= 1 + GREEN_BACK_EXTENSION * Math.min(1, -st.greenPushMm / Math.max(1e-6, st.cfg.greenCommitBackMm));
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
    // ⭐ …and the ZOOM scales the camera's distance behind the green piece (`cameraGapM`) — 1.00 the radius offset itself.
    cameraGapM(st.cfg.cameraRadiusOffsetMm / 1000, st.zoom),
  );
  // ⭐ The owner: *"the camera looks at the yellow target (orbit center)"*.
  st.camera.setPosition(new Vector3(c.x + o[0], c.y + o[1], c.z + o[2]));
  st.camera.setTarget(c.clone());
  // ⭐ prototype (green box): the green piece's distance to the YELLOW target (the marker — where the centre is going, not
  // the blend in progress), for the HUD's `green` line (the owner, 2026-10-02).
  const tgt = st.centreBlend.targetM;
  st.greenBoxDistM = Math.hypot(box.position.x - tgt[0], box.position.y - tgt[1], box.position.z - tgt[2]);
  pinkRingFrame(st);
  guideSphereFrame(st);
  greenSelectionFrame(st);
  greenCommitFrame(st, now);
  trackOrbitedFaces(st, now);
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
  const toward = orbitOffset(st.cfg, st.orbit.yaw, st.orbit.elevation, GREEN_PIECE_ORBIT_ZOOM).offsetM;
  const face = faceToward(faces, toward);
  // ⭐ …and that face's normal is the one the pink ring sits on — what an orbited piece anti-aligns with (`trackOrbitedFaces`).
  if (face !== null) st.pinkFaceNormal = face.normal;
  return face === null ? null : [face.centre[0], face.centre[1], face.centre[2]];
}


/**
 * ⭐ prototype (green box): the guide sphere, each frame — on the yellow target, radius `guideSphereShare` (the slider) × the top ring's
 * radius (the green piece's own orbit, `GREEN_PIECE_ORBIT_ZOOM`), at `guideSphereAlpha` (0 hides it).
 */
export function guideSphereFrame(st: SceneState): void {
  // ⭐ prototype (green box), 2026-10-02: *"when the green piece is outside of this sphere, highlight its contour in white"* —
  // *"(same offset of contour highlights as the rest of the pioneer / follower parts)"*: its own crease edges, pushed out by the
  // highlight offset (`highlightLiftMm` on the glass, at its camera distance) and rebuilt only when that goes stale — exactly
  // the part outlines' machinery (`edgeLines`, `offsetPositions`, `outlineOffsetStale`). Shown while its centre is beyond the
  // sphere, the sphere shown or not.
  const box = st.greenBox;
  const o = st.greenOutline;
  if (box !== null && o !== null) {
    // ⭐ the owner, 2026-10-03: shown while the green piece is HELD for orbit, wherever it is (`greenHeldForOrbit`; it was: outside the sphere).
    // ⛔ 2026-10-04 (the approach spec, §1): REPLACED by the white highlight of the SELECTED face — switched off, the code kept.
    const out = GREEN_CONTOUR_ON && st.greenSnapsActive;
    o.lines.isVisible = out;
    if (out) {
      const h = highlightLiftM(st.cfg.highlightLiftMm, Vector3.Distance(st.camera.position, box.position), st.camera.fov, st.canvas.clientHeight);
      if (outlineOffsetStale(o.builtM, h)) {
        edgeLines(st, "green-outline", o.topo, offsetPositions(o.topo, h), o.lines.color, o.lines);
        o.builtM = h;
      }
    }
  }
  const s = st.guideSphere;
  if (s === null) return;
  const a = st.cfg.guideSphereAlpha;
  s.isVisible = a > 0;
  if (!(a > 0)) return;
  (s.material as StandardMaterial).alpha = a;
  const r = st.cfg.guideSphereShare * st.cfg.orbitTopRadiusM * GREEN_PIECE_ORBIT_ZOOM;
  s.scaling.set(r, r, r);
  const t = st.centreBlend.targetM;
  s.position.set(t[0], t[1], t[2]);
}

/**
 * ⭐⭐ prototype (green box) — **AN ORBITED PIECE'S FACES, TRACKED OUTSIDE THE GUIDE SPHERE** (the owner, 2026-10-02: *"when a piece
 * goes outside the white sphere, compute its number of faces and track them. This is valid for the green piece or any other piece
 * which will later be orbited"* — *"also at boot, if any piece is outside the white sphere"*). Each frame, for each orbited piece
 * (`orbitedPieces`), the decision is `faceTracking`'s: on `START` (an outward crossing, or outside at its first frame — the boot)
 * its logical faces are read off its mesh (`topologyFromMesh`, `pieceFaces`); while it stays outside, their world normals and
 * centres follow it; back inside, they are dropped. ⭐ Since 2026-10-04 "outside" is the snapped rotation ON (`greenSnapsOn`; held for orbit 2026-10-03; `greenHeldForOrbit`).
 * ⭐⭐ **AND IT STEPS THROUGH THEM AS IT ORBITS IN YAW** (the owner, 2026-10-02): `DegreesYawPerFace` = the yaw face alignment span ÷
 * its faces, and `DeltaXYawPerFace` = the finger dx that orbits that much, at the yaw rate (`orbitDegPerMm`). On `START` the face
 * most anti-aligned with the pink ring's face is turned exactly anti-parallel; from that pose its faces fall into a YAW cycle and a
 * PITCH cycle (`faceCycles`, the owner 2026-10-03: *"a chain of yaw turns … then … a cycle of pitch turns … then yaw again"*). Then the
 * orbit's yaw each frame, as finger mm (the drag's dx; the inertia coast's too, so the faces never fall out of step with the
 * yaw), accumulates since `START` (`accumulateFaceSteps`): rounded to whole `DeltaXYawPerFace`s it names the face — one step one
 * way anti-aligns the NEXT face — through the yaw cycle until the start face is back, then the pitch cycle, then yaw again
 * (`cycleStep`) — each face's orientation its cycle's turn from the START pose (`cycleTargets`); the other way retraces it, at the
 * same yaws. A change of the pink face starts the cycles again from the face anti-aligned then. Every turn is eased like an
 * alignment's (`greenTurnFrame`, a slerp from where the piece is to the step's orientation). ⛔ Inside the sphere nothing turns (a turn already in
 * flight lands): the face anti-aligned is kept.
 */
export function trackOrbitedFaces(st: SceneState, now: number): void {
  const yaw = st.orbit.yaw;
  const g = greenDragGains(st);
  const yawDegPerMm = orbitDegPerMm(st.cfg, st.orbit.elevation, g).yawDegPerMm;
  const pink = st.pinkFaceNormal;
  for (const m of st.orbitedPieces) {
    const p = m.getAbsolutePosition();
    // ⭐ the owner, 2026-10-04: "outside" = the SNAPPED ROTATION ON — the coarse push `w` below the snap-off (`greenSnapsOn`; it was the
    // green piece HELD, `greenHeldForOrbit`, 2026-10-03; the sphere's radius before). ⛔ was: radius)
    const out = st.greenSnapsActive; // ⭐ step 2: `snapsActive` — COARSE, above the minimum distance, `w` below the snap-off
    const prev = st.faceTracks.get(m);
    const step = faceTracking(prev === undefined ? null : prev.outside, out);
    if (step === "NONE" || step === "STOP") {
      st.faceTracks.set(m, { outside: out, faces: null, world: [], cycles: NO_CYCLES, targets: NO_TARGETS, step: 0, degPerFace: 0, dxPerFaceMm: Infinity, accMm: 0, yaw, pink, free: null });
      if (step === "STOP") st.hudDirty = true;
      continue;
    }
    const cur = fromBabylon(m.rotationQuaternion ?? Quaternion.Identity());
    let faces = prev?.faces ?? null;
    let cycles = prev?.cycles ?? NO_CYCLES;
    let targets = prev?.targets ?? NO_TARGETS;
    let s = prev?.step ?? 0;
    let accMm = prev?.accMm ?? 0;
    // ⭐ the orientation turns are computed FROM: where a turn in flight is going, else where the piece is
    const base = st.pieceTurns.get(m)?.to ?? cur;
    let target: Quat | null = null;
    const cam = st.camera.getDirection(new Vector3(0, 0, 1));
    const axes = pink === null ? null : turnAxes(pink, [0, 1, 0], [cam.x, cam.y, cam.z]);
    if (step === "START" || faces === null) {
      const topo = topologyFromMesh(m);
      faces = topo === null ? [] : pieceFaces(topo.positions, topo.faces);
      st.hudDirty = true;
    }
    // ⭐⭐ the owner, 2026-10-03: `FacesRotateByIncrement` OFF — dx turns the piece CONTINUOUSLY: yaw for 360°, a smooth blend, pitch
    // for 360°, a blend, yaw again (`staircaseOrientation`). START (or the switch, or a new pink face) takes the pose AS IT IS (no
    // snap) and s = 0; the yaw axis is the world vertical, the pitch axis the horizontal across the pink normal, both frozen then.
    let free: FreeTurn | null = null;
    const freeMode = st.cfg.facesRotateByIncrement === 0;
    if (freeMode) {
      // ⛔⛔ the owner, 2026-10-03: *"make sure that there is no pitch mixed with yaw when rotation is on yaw"* — the turn RESTARTED at
      // every exit from the pose as it was, so a piece that left the sphere part-pitched (or came from the face cycles) yawed TILTED
      // about the vertical: its own axis circled the vertical, a pitch riding on the yaw. ⭐ Now the turn's state is kept for the
      // session (`freeTurns`; inside the sphere it pauses, an exit continues it) and its start pose is LEVEL (`levelHeading`): every
      // yaw phase is a level piece about the vertical. The pitch axis is frozen with it (a later pink face does not move it).
      const stored = st.freeTurns.get(m);
      const entering = step !== "KEEP" || prev === undefined || prev.free === null; // an exit, the switch, or the first frame
      if (stored === undefined) {
        // ⭐ the owner, 2026-10-04: the level-out only when switched on (`greenLevelOutOn`, OFF) — *"The alignment on gravity shall be the
        // user's own action, not a game compute"*: by default the turn starts from the pose AS IT IS, the tumbled one surviving the hold
        const q0 = st.cfg.greenLevelOutOn === 1 ? levelHeading(cur) : cur;
        const pitchAxis: Vec3 = axes?.pitch ?? [1, 0, 0];
        // ⭐ the owner, 2026-10-03: the faces that scroll past in a 360° yaw and a 360° pitch, counted ONCE (at boot) — the increments
        const inc = scrollIncrements(faces, q0, [0, 1, 0], pitchAxis);
        // ⭐ the owner, 2026-10-03: the fastest TURN the snaps can follow (°/s of the piece's rotation), computed ONCE — one increment
        // per alignment's ease. It reads no gain and no cycle: the measured turn rate carries them
        const maxTurnDegPerS = maxSnapTurnDegPerS(inc.yawStepDeg, inc.pitchStepDeg, st.cfg.greenSnapEaseMs);
        free = { q0, sDeg: 0, pitchAxis, ...inc, maxTurnDegPerS, maxForEaseMs: st.cfg.greenSnapEaseMs, turnDegPerS: 0, lastT: now, pendingDeg: 0, capped: false };
      }
      else if (entering) free = { ...stored, lastT: now };
      else {
        // the orbit's yaw this frame (a drag's, a coast's): one full cycle per `yawFaceAlignSpanDeg` of it — the span, as for the face cycles (the owner, 2026-10-03)
        const dYawDeg = (wrapPi(yaw - prev!.yaw) * 180) / Math.PI;
        const dTurnDeg = dYawDeg * staircasePerOrbitDeg(st.cfg.greenRotateBlendDeg, st.cfg.yawFaceAlignSpanDeg);
        // ⭐ the PIECE's turn rate (°/s) — the orbit's yaw (the outside yaw gain share in it) × the cycle's turn per orbit degree —
        // smoothed over `SNAP_SPEED_TAU_MS`: the rig steps per pointer EVENT, 15–20 a second
        const dtMs = stored.lastT === null ? 0 : now - stored.lastT;
        const inst = dtMs > 0 ? Math.abs(dTurnDeg) / (dtMs / 1000) : stored.turnDegPerS;
        const turnDegPerS = stored.turnDegPerS + (inst - stored.turnDegPerS) * (dtMs > 0 ? 1 - Math.exp(-dtMs / SNAP_SPEED_TAU_MS) : 0);
        // ⭐⭐ the owner, 2026-10-03: *"cap the rotation speed (maintaining the snap duration) instead of freezing the rotation"* — with
        // the snaps on, the turn goes on at most at the limit (one snap per snap duration), a short burst spread, the excess discarded
        // (`capTurn`). ⚠ So above the limit a span of orbit no longer makes a full cycle — the span stays exact for the face cycles.
        const cap =
          st.cfg.greenRotateSnap === 1
            ? capTurn(stored.pendingDeg, dTurnDeg, stored.maxTurnDegPerS, dtMs, SNAP_SPEED_TAU_MS)
            : { applied: dTurnDeg, pending: 0, capped: false };
        free = {
          ...stored,
          sDeg: stored.sDeg + cap.applied,
          turnDegPerS,
          lastT: now,
          pendingDeg: cap.pending,
          capped: cap.capped,
        };
        if (free.capped !== stored.capped) st.hudDirty = true;
      }
      // ⭐ the owner, 2026-10-03: *"recompute and speed up the snap movement"* — the snap has its OWN ease (`greenSnapEaseMs`, 60 ms); the
      // limit is recomputed only when that slider differs from the value it was computed from (one comparison a frame)
      if (free.maxForEaseMs !== st.cfg.greenSnapEaseMs) {
        free = { ...free, maxTurnDegPerS: maxSnapTurnDegPerS(free.yawStepDeg, free.pitchStepDeg, st.cfg.greenSnapEaseMs), maxForEaseMs: st.cfg.greenSnapEaseMs };
        st.hudDirty = true;
      }
      st.freeTurns.set(m, free);
      // ⭐⭐ the owner, 2026-10-03: *"snap the green piece yaw and pitch rotations onto these angle increments during the yaw orbit,
      // so the rotation of the green piece is not continuous but incremented"* — each angle to its NEAREST increment
      // (`greenRotateSnap`, on), each new increment reached by an alignment's ease (`greenTurnFrame`)
      const ang = staircaseAngles(free.sDeg, st.cfg.greenRotateBlendDeg);
      const snapped = st.cfg.greenRotateSnap === 1;
      const want = snapped
        ? orientationAt(free.q0, snapAngle(ang.yawDeg, free.yawStepDeg), snapAngle(ang.pitchDeg, free.pitchStepDeg), [0, 1, 0], free.pitchAxis)
        : staircaseOrientation(free.q0, free.sDeg, st.cfg.greenRotateBlendDeg, [0, 1, 0], free.pitchAxis);
      const easing = st.pieceTurns.get(m);
      if (snapped) {
        // a new increment: eased there from where the piece is; the same one: nothing (a turn in flight lands).
        if (qAngle(qmul(want, qconj(easing?.to ?? cur))) > 1e-6) {
          st.pieceTurns.set(m, { from: cur, to: want, t0: now, ms: st.cfg.greenSnapEaseMs });
          st.hudDirty = true;
        }
      } else if (entering && qAngle(qmul(want, qconj(cur))) > 1e-3) {
        // a different pose than the turn's (the face cycles, a first level-out): eased there, as an alignment's turn
        st.pieceTurns.set(m, { from: cur, to: want, t0: now });
        st.hudDirty = true;
      } else if (easing !== undefined) st.pieceTurns.set(m, { ...easing, to: want }); // still easing in: it chases the turn
      else m.rotationQuaternion = toBabylon(want);
      cycles = NO_CYCLES;
      targets = NO_TARGETS;
      s = 0;
      accMm = 0;
    }
    // ⭐ ON: the face cycles. A START — or the switch turned back on (no cycles yet) — anti-aligns and reads the cycles.
    const cyclesStart = !freeMode && (step === "START" || prev?.free !== null || cycles.yaw.length + cycles.pitch.length === 0);
    if (cyclesStart) {
      s = 0;
      accMm = 0;
      if (pink !== null && faces.length > 0) {
        // ⭐ the face most anti-aligned turned onto the pink face, then the two cycles and every face's orientation read off that pose
        const start = mostAntiAligned(faces, cur, pink);
        target = antiAlignedOrientation(faces, start, cur, pink);
        cycles = axes === null ? { yaw: [start], pitch: [start] } : faceCycles(faces, target, start, pink, axes);
        targets = axes === null ? { yaw: [target], pitch: [target] } : cycleTargets(faces, target, pink, axes, cycles);
      } else {
        cycles = NO_CYCLES;
        targets = NO_TARGETS;
      }
      st.hudDirty = true;
    }
    // ⭐ the owner, 2026-10-03: *"span to cover one full period"* — the span shared among the STEPS of one yaw + pitch period
    // (the frustum: 4 + 4 = 8 → 22.5°), not among the faces (6 → 30°, a period then took 240°)
    const degPerFace = degreesYawPerFace(st.cfg.yawFaceAlignSpanDeg, cycles.yaw.length + cycles.pitch.length);
    const dxPerFaceMm = deltaXYawPerFace(degPerFace, yawDegPerMm);
    if (!freeMode && !cyclesStart && step === "KEEP" && prev !== undefined && cycles.yaw.length + cycles.pitch.length > 0 && pink !== null) {
      // the orbit's yaw this frame, as the finger mm that would make it (a drag's dx exactly; a coast's equivalent)
      const dYawDeg = (wrapPi(yaw - prev.yaw) * 180) / Math.PI;
      const a = accumulateFaceSteps(accMm, yawDegPerMm > 0 ? dYawDeg / yawDegPerMm : 0, dxPerFaceMm);
      accMm = a.accMm;
      if (a.steps !== 0) {
        // ⭐ the step's face and its orientation, computed at START (`targetAtStep`) — a fast frame crossing several lands on the last
        s += a.steps;
        target = targetAtStep(cycles, targets, s);
        st.hudDirty = true;
      } else if (prev.pink !== pink) {
        // ⭐ the pink face changed: the face anti-aligned now slerps onto it, and the cycles START again from there
        const now0 = cycleStep(cycles, s).face;
        target = antiAlignedOrientation(faces, now0, base, pink);
        cycles = axes === null ? { yaw: [now0], pitch: [now0] } : faceCycles(faces, target, now0, pink, axes);
        targets = axes === null ? { yaw: [target], pitch: [target] } : cycleTargets(faces, target, pink, axes, cycles);
        s = 0;
        accMm = 0;
        st.hudDirty = true;
      }
    }
    if (target !== null) {
      // ⭐ from where the piece IS (a turn in flight is retargeted, never queued)
      st.pieceTurns.set(m, { from: cur, to: target, t0: now });
    }
    // ⚠ The topology already carries the mesh's SCALE (`topologyFromMesh`), so only its rotation and position place the faces.
    m.computeWorldMatrix(true);
    const r = m.absoluteRotationQuaternion;
    const q: Quat = [r.w, r.x, r.y, r.z];
    const world = faces.map((f) => ({ normal: qRotate(q, f.normal), centre: add([p.x, p.y, p.z], qRotate(q, f.centre)) }));
    st.faceTracks.set(m, { outside: out, faces, world, cycles, targets, step: s, degPerFace, dxPerFaceMm, accMm, yaw, pink, free });
  }
  greenTurnFrame(st, now);
}

const NO_CYCLES = { yaw: [], pitch: [] } as const;
/** ⭐ prototype (green box): the smoothing of the dx speed the snap freeze reads, ms — over a few pointer events. */
const SNAP_SPEED_TAU_MS = 120;
const NO_TARGETS = { yaw: [], pitch: [] } as const;

const toBabylon = (q: Quat): Quaternion => new Quaternion(q[1], q[2], q[3], q[0]);
const fromBabylon = (q: Quaternion): Quat => [q.w, q.x, q.y, q.z];

/** ⭐ prototype (green box): each orbited piece's anti-alignment turn, one frame — a smoothstep slerp over an alignment's time. */
function greenTurnFrame(st: SceneState, now: number): void {
  const alignMs = st.cfg.cameraResetMs * ALIGN_SNAP_FRACTION;
  for (const [m, turn] of st.pieceTurns) {
    const ms = turn.ms ?? alignMs; // ⭐ a snap of the green piece's turn eases over its own time (`greenSnapEaseMs`)
    const u = ms > 0 ? Math.min(1, Math.max(0, (now - turn.t0) / ms)) : 1;
    m.rotationQuaternion = toBabylon(qSlerp(turn.from, turn.to, u * u * (3 - 2 * u)));
    if (u >= 1) st.pieceTurns.delete(m);
  }
}

/**
 * ⭐ prototype (green box): the gains the green piece's orbit drag runs at NOW — the inside-the-leash factors (`boxDragGains`) and,
 * on yaw, the share left while it is outside the guide sphere (`outsideYawShare`, the face tracking's own outside state). ⭐ ONE
 * home: the drag, the face stepping's yaw rate and the HUD read it, so the dx per face is the dx the drag needs.
 */
export function greenDragGains(st: SceneState): { yaw: number; pitch: number } {
  const g =
    st.boxOrbit === null || st.cameraOrbit === null
      ? { yaw: 1, pitch: 1 }
      : boxDragGains(st.cfg, st.boxOrbit, st.cameraOrbit.cam, (st.cfg.cameraLeashDeg * Math.PI) / 180, st.cfg.boxGainInsideLeash);
  const outside = st.greenBox !== null && st.greenSnapsActive;
  return { yaw: g.yaw * outsideYawShare(outside, st.cfg.boxGainYawOutsideShare), pitch: g.pitch };
}

/** ⭐ prototype (green box): the whole-piece white contour — OFF since the approach spec (§1): the SELECTED face's white fill replaces it. */
const GREEN_CONTOUR_ON = false;

/**
 * ⭐⭐ prototype (green box) — **APPROACH STEP 1: A PRESS ON A FACE OF THE GREEN PIECE SELECTS IT** (`GREEN_PIECE_PHASES.md` §3.1, the owner,
 * 2026-10-04: *"If a face of the green piece is pressed upon, it is selected and highlighted in white"*). The face is `pickedFace`'s
 * (the pick's world normal into the piece's frame); its WHITE fill replaces any earlier one. ⭐ The press still orbits, as anywhere.
 */
export function selectGreenFace(st: SceneState, worldNormal: Vec3): void {
  const box = st.greenBox;
  const topo = st.greenOutline?.topo;
  if (box === null || topo === undefined) return;
  const r = box.rotationQuaternion ?? Quaternion.Identity();
  const face = pickedFace(topo.faces, [r.w, r.x, r.y, r.z], worldNormal);
  if (face < 0) return;
  selectGreenFaceIndex(st, face);
}

/** ⭐ prototype (green box), the approach: select face `face` (its index in the topology's faces) with the white fill. */
function selectGreenFaceIndex(st: SceneState, face: number): void {
  const box = st.greenBox;
  const topo = st.greenOutline?.topo;
  if (box === null || topo === undefined || topo.faces[face] === undefined) return;
  st.greenSelectedFace = face;
  st.greenSelectMesh?.dispose();
  const f = topo.faces[face]!;
  const local = new Map<number, number>();
  const positions: number[] = [];
  const indices: number[] = [];
  for (const vi of f.triangles) {
    let li = local.get(vi);
    if (li === undefined) {
      li = local.size;
      local.set(vi, li);
      const p = topo.positions[vi]!;
      positions.push(p[0], p[1], p[2]);
    }
    indices.push(li);
  }
  const fill = new Mesh("green-selected-face", st.scene);
  const data = new VertexData();
  data.positions = positions;
  // ⚠ Double-sided, as the face markers: it must read from either side
  data.indices = [...indices, ...indices.slice().reverse()];
  data.applyToMesh(fill, false);
  const mat = new StandardMaterial("green-selected-face-mat", st.scene);
  mat.emissiveColor = new Color3(1, 1, 1);
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.alpha = GREEN_SELECT_ALPHA;
  fill.material = mat;
  fill.parent = box;
  fill.isPickable = false;
  fill.metadata = { orbitCandidate: false };
  st.greenSelectMesh = fill;
  st.lastVerdict = `green piece: face f${face} selected`;
  st.hudDirty = true;
}

/** ⭐ The selected face's white fill alpha: white, readable, the face still visible under it. */
const GREEN_SELECT_ALPHA = 0.6;

/** ⭐ prototype (green box), approach step 1: unselect (§3.1: *"Double tap on green piece unselects any face if not null"*). */
export function unselectGreenFace(st: SceneState): void {
  st.greenSelectMesh?.dispose();
  st.greenSelectMesh = null;
  st.greenSelectedFace = null;
  st.lastVerdict = "green piece: face unselected (double tap)";
  st.hudDirty = true;
}

/**
 * ⭐ prototype (green box), approach step 1: the selected face's fill floats the highlight offset off its face (`highlightLiftMm` on the
 * glass, at the camera distance) — the same lift as every other highlight, so it never z-fights the face.
 */
function greenSelectionFrame(st: SceneState): void {
  const fill = st.greenSelectMesh;
  const box = st.greenBox;
  const f = st.greenSelectedFace === null ? undefined : st.greenOutline?.topo.faces[st.greenSelectedFace];
  if (fill === null || box === null || f === undefined) return;
  const h = highlightLiftM(st.cfg.highlightLiftMm, Vector3.Distance(st.camera.position, box.position), st.camera.fov, st.canvas.clientHeight);
  fill.position.set(f.normal[0] * h, f.normal[1] * h, f.normal[2] * h);
}

/**
 * ⭐⭐ prototype (green box) — **APPROACH STEP 1: THE COARSE PUSH `w` STARTS AGAIN** at every press outside a seated piece (§2, the owner,
 * 2026-10-04: *"Yes to both"* — the reference is the last such press, and every new press resets `w` to 0). The sign that makes dy
 * "toward the target" is the RING HALF's (`towardSignAt`, above or below the waist) — and it is re-read at every drag step: carried across the
 * waist, `w` stays and the sense of dy is mirrored (`orbitDragStep`).
 */
export function resetGreenPush(st: SceneState): void {
  st.greenPushMm = 0;
  st.greenTowardSign = towardSignAt(st.orbit.elevation, st.greenWaistV);
  st.hudDirty = true;
}

/** ⭐ prototype (green box): the outer-ring visual extension's reach — the owner's *"1.03"*, kept as 3 % of the distance. */
const GREEN_BACK_EXTENSION = 0.03;

/**
 * ⭐⭐⭐ prototype (green box) — **APPROACH STEP 2: THE COMMITS, EACH FRAME** (`GREEN_PIECE_PHASES.md` §3.2, §3.4; the owner, 2026-10-04).
 * - The minimum distance (`coarseMinDistance`) — computed at boot and again only when the rings, the elevation gains or the forward
 *   commit change (a key compared each frame, never recomputed otherwise); below it, `COARSE` takes no commit and does not snap.
 * - The commit step (`nextCommit`) on the coarse push `w`, and its event:
 *   · FORWARD — the selected face, or with none the face whose normal points most AGAINST the pink face's (Q2.1), eases onto exact
 *     anti-parallel by the smallest turn (the settle, `greenSnapEaseMs`); it is latched as the MATING face;
 *   · BACKWARD — the face opposite the selected one, or with none the face whose normal ALIGNS most with the pink face's (Q2.2), turns
 *     to face it; it becomes the selected face (white) and is latched;
 *   · UNCOMMIT — the quaternion is KEPT: the snapped turn starts again FROM THE POSE AS IT IS (its stored state dropped, so the next
 *     frame's start pose is the current one).
 * - `greenSnapsActive` (`snapsActive`) for every reader of "the snaps are on": the face tracking, the yaw share, the cross deadband.
 */
function greenCommitFrame(st: SceneState, now: number): void {
  const box = st.greenBox;
  if (box === null) return;
  const cfg = st.cfg;
  const key = [cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM, cfg.orbitLowerRingOn, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM, cfg.gainOrbitElevation, cfg.boxGainPitch, cfg.greenCommitFwdMm].join("|");
  if (key !== st.greenCoarseMinKey) {
    st.greenCoarseMinKey = key;
    st.greenWaistV = waistParam((v) => orbitOffset(cfg, 0, v, GREEN_PIECE_ORBIT_ZOOM).radiusM);
    st.greenCoarseMinM = coarseMinDistance(
      (v) => orbitOffset(cfg, 0, v, GREEN_PIECE_ORBIT_ZOOM).radiusM,
      cfg.gainOrbitElevation * elevationGainScale(cfg) * cfg.boxGainPitch,
      cfg.greenCommitFwdMm,
    );
    st.hudDirty = true;
  }
  const t = st.centreBlend.targetM;
  const d = Math.hypot(box.position.x - t[0], box.position.y - t[1], box.position.z - t[2]);
  const coarseEnabled = d >= st.greenCoarseMinM;
  st.greenCoarseEnabled = coarseEnabled;
  const step = nextCommit(st.greenCommitMode, st.greenPushMm, { snapOffMm: cfg.greenSnapOffMm, fwdMm: cfg.greenCommitFwdMm, backMm: cfg.greenCommitBackMm }, coarseEnabled);
  const topo = st.greenOutline?.topo;
  const n = st.pinkFaceNormal;
  if (step.event === "UNCOMMIT") {
    st.freeTurns.delete(box); // ⭐ the quaternion KEPT: the snapped turn restarts from the pose as it is
    st.greenMatingFace = null;
    st.lastVerdict = "green piece: un-committed — the snapped rotation resumes from this pose";
    st.hudDirty = true;
  } else if ((step.event === "FORWARD" || step.event === "BACKWARD") && topo !== undefined && n !== null) {
    const faces = pieceFaces(topo.positions, topo.faces);
    const cur = fromBabylon(box.rotationQuaternion ?? Quaternion.Identity());
    const base = st.pieceTurns.get(box)?.to ?? cur;
    const F = st.greenSelectedFace;
    const face =
      step.event === "FORWARD"
        ? (F ?? mostAntiAligned(faces, base, n))
        : F !== null
          ? oppositeFace(faces, F)
          : mostAntiAligned(faces, base, [-n[0], -n[1], -n[2]]);
    if (face >= 0) {
      st.pieceTurns.set(box, { from: cur, to: antiAlignedOrientation(faces, face, base, n), t0: now, ms: cfg.greenSnapEaseMs });
      st.greenMatingFace = face;
      if (step.event === "BACKWARD") selectGreenFaceIndex(st, face);
      st.lastVerdict = `green piece: ${step.event === "FORWARD" ? "forward" : "backward"} commit — f${face} latched`;
      st.hudDirty = true;
    }
  }
  if (step.mode !== st.greenCommitMode) st.hudDirty = true;
  st.greenCommitMode = step.mode;
  st.greenSnapsActive = snapsActive(step.mode, st.greenPushMm, cfg.greenSnapOffMm, coarseEnabled);
}
