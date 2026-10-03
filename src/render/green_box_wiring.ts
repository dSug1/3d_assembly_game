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
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { bodyNamed, cameraGapM, clampGreenZoom, faceToward, GREEN_PIECE_ORBIT_ZOOM, greenPyramidSizeM, minGreenZoom, faceTracking, pieceFaces, outsideYawShare, accumulateFaceSteps, antiAlignedOrientation, degreesYawPerFace, deltaXYawPerFace, cycleStep, cycleTargets, faceCycles, mostAntiAligned, targetAtStep, turnAxes, outsideSphere, pinkRingVisibility } from "../input/green_box";
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
import { orbitOffset } from "../input/orbit";
import { clampCameraRadiusM } from "../input/pinch";
import { goalLocked } from "../input/goal_lock";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ALIGN_SNAP_FRACTION } from "./scene_state";
import { add, qRotate, qSlerp, type Quat } from "../core/vec";
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
  // ⭐ prototype (green box), 2026-10-02: the first orbited piece — its faces are tracked outside the guide sphere (`trackOrbitedFaces`).
  st.orbitedPieces.push(box);
  box.rotationQuaternion = Quaternion.Identity();
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

/** ⭐ The guide sphere's radius: 75 % of the top ring's — the owner's *"75% of the top ring radius"*. */
export const GUIDE_SPHERE_SHARE = 0.75;

/**
 * ⭐ prototype (green box): the guide sphere, each frame — on the yellow target, radius `GUIDE_SPHERE_SHARE` × the top ring's
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
    const t0 = st.centreBlend.targetM;
    const radius = GUIDE_SPHERE_SHARE * st.cfg.orbitTopRadiusM * GREEN_PIECE_ORBIT_ZOOM;
    const out = outsideSphere([box.position.x, box.position.y, box.position.z], [t0[0], t0[1], t0[2]], radius);
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
  const r = GUIDE_SPHERE_SHARE * st.cfg.orbitTopRadiusM * GREEN_PIECE_ORBIT_ZOOM;
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
 * centres follow it; back inside, they are dropped. The test is the white contour's own (`outsideSphere`, its centre).
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
  const t = st.centreBlend.targetM;
  const radius = GUIDE_SPHERE_SHARE * st.cfg.orbitTopRadiusM * GREEN_PIECE_ORBIT_ZOOM;
  const yaw = st.orbit.yaw;
  const g = greenDragGains(st);
  const yawDegPerMm = orbitDegPerMm(st.cfg, st.orbit.elevation, g).yawDegPerMm;
  const pink = st.pinkFaceNormal;
  for (const m of st.orbitedPieces) {
    const p = m.getAbsolutePosition();
    const out = outsideSphere([p.x, p.y, p.z], [t[0], t[1], t[2]], radius);
    const prev = st.faceTracks.get(m);
    const step = faceTracking(prev === undefined ? null : prev.outside, out);
    if (step === "NONE" || step === "STOP") {
      st.faceTracks.set(m, { outside: out, faces: null, world: [], cycles: NO_CYCLES, targets: NO_TARGETS, step: 0, degPerFace: 0, dxPerFaceMm: Infinity, accMm: 0, yaw, pink });
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
    if (step === "KEEP" && prev !== undefined && cycles.yaw.length + cycles.pitch.length > 0 && pink !== null) {
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
    st.faceTracks.set(m, { outside: out, faces, world, cycles, targets, step: s, degPerFace, dxPerFaceMm, accMm, yaw, pink });
  }
  greenTurnFrame(st, now);
}

const NO_CYCLES = { yaw: [], pitch: [] } as const;
const NO_TARGETS = { yaw: [], pitch: [] } as const;

const toBabylon = (q: Quat): Quaternion => new Quaternion(q[1], q[2], q[3], q[0]);
const fromBabylon = (q: Quaternion): Quat => [q.w, q.x, q.y, q.z];

/** ⭐ prototype (green box): each orbited piece's anti-alignment turn, one frame — a smoothstep slerp over an alignment's time. */
function greenTurnFrame(st: SceneState, now: number): void {
  const ms = st.cfg.cameraResetMs * ALIGN_SNAP_FRACTION;
  for (const [m, turn] of st.pieceTurns) {
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
  const outside = st.greenBox !== null && st.faceTracks.get(st.greenBox)?.outside === true;
  return { yaw: g.yaw * outsideYawShare(outside, st.cfg.boxGainYawOutsideShare), pitch: g.pitch };
}
