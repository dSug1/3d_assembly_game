/**
 * ⭐⭐ **THE GREEN BOX, WIRED** (prototype (green box)) — built once at boot from `input/green_box.ts`'s answer (the smallest yellow body's
 * size), and placed every frame, just before the scene is drawn, midway between the yellow orbit-centre marker and the
 * camera — after everything that moves either (an orbit, a pinch, the wheel, the reset, a demo's camera, the marker's
 * jump to a new barycentre). ⛔ No rule here.
 * ⛔ Not pickable (a touch goes through it to what is behind), not in the model: no collision, no goal, no score.
 */
import { restingContourShown } from "../input/quad_gate";
import { RESTING_FACE_COLOUR } from "./colours";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { OrbitController } from "../input";
import { shapeOfBody, topologyFromMesh, topologyOfBody } from "./bodies";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { candidateForFace, chooseInGroup, coupleStops, faceEdges, faceFlushAxes, faceLongAxes, nextCoupleRoll, placeByFaceCentre, restAlignToFace, restingFaceRecord, restingFaces, type Edge, type LongAxes, type RestingCandidate, type RestingResult } from "../core/resting_face";
import { highlightLiftM } from "../input/highlight_lift";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Material } from "@babylonjs/core/Materials/material";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { bodyNamed, cameraGapM, clampPieceRadiusM, clampGreenZoom, faceToward, GREEN_PIECE_ORBIT_ZOOM, greenPyramidSizeM, minGreenZoom, greenBootOrientation, counterYaw, wrapAngle, hexPrismVolumeM3, turquoiseSizeM, pieceFaces } from "../input/green_box";
import { SCENE_1_PALETTE } from "../content/scene_1";
import { faceWorld, makeWorld, setLocalPlacement, setRestingFace, worldPlacementOf, type ObjectId, type SceneObject } from "../core/object_model";
import { cameraRelease, frustumVolumeM3, inertiaTauMs } from "../input/orbit_inertia";
import { trackingMetresPerPx } from "../input";
import { OBJECT_TOP_SCALE } from "../core/scene_dims";
import { taperMesh } from "./bodies";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { GIZMO_RING_PX, ORBIT_START_YAW_RAD, RING_POINTS } from "./scene_state";
import { boxDragGains, cameraLag, cameraOffset, cameraOrbitAt, cameraOrbitStep, springOrbit } from "../input/follow_camera";
import { orbitOffset } from "../input/orbit";
import { goalLocked } from "../input/goal_lock";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { SceneState } from "./scene_state";
import { add, length, qRotate, qSlerp, scale, sub, type Quat, type Vec3 } from "../core/vec";
import { syncCentre } from "./camera_rig";
import { hoverCameraBlend, hoverFrame, hoverOffsetFrame, hoverVisualFrame, wayInDrawFrame } from "./hover_wiring";
/** ⭐ (2026-10-14) the gap queries a frame keeps for the way in after a hover (out of `pieceSolverQueries`). */
const HOVER_FADE_QUERIES = 8;
import { modelLag, orbitFrameUnderHover } from "../input/hover";
import { dirLabel } from "./orient_cube";
import { pieceCollisionSetup } from "./collision_wiring";
import { orbitFrame, relocationKey, stuckGate, stuckKeep, turnSweep, worldSignature, stuckNext, stuckProbe, stuckRecord, turnStepHeld, type OrbitQ, type SolveOptions, type SolverEnv } from "../input/piece_orbit_solver";
import { contactNormal, nearestObstacle, type CollisionSetup } from "../core/collision";
import { setWorldPlacement, type World } from "../core/object_model";
import { STUCK_FRESH } from "../input/piece_orbit_solver";
import type { OrientDirection } from "../core/orientation_set";
import { ORBIT_ROLL_SPAN_RAD, aimProgress, aimRing, startPieceAim, ringProgress, zoomScale, anglesOf, carryHeading, entryCamera, entryLook, entryPieceOffset, entryProgress, headingAbout, pieceCamera, pushedPiece, referenceYawGain, returnCamera, returnLook, returnPieceOffset, returnProgress, ringDistanceRange, scaledGap, smoothTravel, startCentreReturn, startPieceEntry, startPieceOrbit } from "../input/piece_orbit";

/** ⭐ The green. */
const GREEN = new Color3(0.12, 0.62, 0.2);
/** ⭐ The turquoise. */
const TURQUOISE = new Color3(0.19, 0.84, 0.78);

/** ⭐ prototype: a piece's logical faces, read off its mesh (`topologyFromMesh`, `pieceFaces`) — a hexagonal prism 8, the frustum 6. */
function piecesFacesOf(m: Mesh): number {
  const topo = topologyFromMesh(m);
  return topo === null ? 0 : pieceFaces(topo.positions, topo.faces).length;
}

/** ⭐ The colour of a resting face — the PINK ring's (the owner, 2026-10-06: *"resting face highlight in pink (same as pink ring) instead of yellow"*; it was yellow). */
// ⭐⭐ (2026-10-12, the owner: *"resting face and cube current aligned face highlighted contours in yellow (no more pink highlight of the
// resting face …)"*) — the resting face is a YELLOW CONTOUR (the cube's aligned-face yellow), its fill hidden
export const RESTING_COLOUR = new Color3(1, 0.85, 0.1);

/** ⭐ The contour seen THROUGH its own piece (drawn over the scene). */
const RESTING_CONTOUR_XRAY_ALPHA = 0.35;
/** ⭐ Its fill's opacity — the face still visible under it, as the other face fills. */
const RESTING_ALPHA = 0.6;

/**
 * ⭐⭐ prototype — **THE ORBITED PIECE'S RESTING FACE, IN YELLOW** (the owner, 2026-10-05: *"For the green and turquoise pieces,
 * highlight the resting face in yellow"*). The selector (`core/resting_face.ts`) on the piece's own mesh, at creation; the face
 * chosen from its winning group is the one needing the smallest turn from the BOOT pose (`chooseInGroup`, the boot quaternion both
 * pieces spawn at). Its fill: that face's triangles, double-sided, a child of the piece (it turns and hides with it), lifted along its
 * normal each frame by the highlight offset (`restingFillFrame`).
 */
function restingOf(
  st: SceneState,
  m: Mesh,
): {
  resting: RestingResult;
  restingFace: RestingCandidate | null;
  restingFill: Mesh | null;
  restingAxes: readonly Vec3[];
  restingAxesFallback: boolean;
  restingEdges: readonly Edge[];
  restingLong: LongAxes;
  restingCentre: Vec3;
  restingFlush: readonly Vec3[];
} {
  const topo = topologyFromMesh(m);
  const resting = topo === null ? restingFaces([], []) : restingFaces(topo.positions, topo.faces);
  const restingFace = resting.winner === null ? null : chooseInGroup(resting.winner, greenBootOrientation(st.sceneSpec.id));
  if (topo === null || restingFace === null) return { resting, restingFace, restingFill: null, restingAxes: [], restingAxesFallback: true, restingEdges: [], restingLong: { axes: [], ends: [] }, restingCentre: [0, 0, 0], restingFlush: [] };
  const parts = restingParts(st, m, topo, restingFace);
  restingDepth(st, m);
  return { resting, restingFace, ...parts };
}

/**
 * ⭐ What a resting face carries on the orbited piece — its long axes, its edges and its PINK fill (with its x-ray twin) — for the face
 * `restingFace` of the piece's topology. Built at creation, and again when a tap on the piece makes another face the resting face
 * (`restOnTappedFace`, 2026-10-09).
 */
function restingParts(
  st: SceneState,
  m: Mesh,
  topo: NonNullable<ReturnType<typeof topologyFromMesh>>,
  restingFace: RestingCandidate,
): { restingFill: Mesh; restingAxes: readonly Vec3[]; restingAxesFallback: boolean; restingEdges: readonly Edge[]; restingLong: LongAxes; restingCentre: Vec3; restingFlush: readonly Vec3[] } {
  // ⭐ the resting face's LONG AXES (`faceLongAxes`, `RESTING_FACE_ALIGNMENT.md` §3) — edge to edge, perpendicular to both edges
  const facePoints = [...new Set(restingFace.faces.flatMap((f) => topo.faces[f]!.triangles))].map((i) => topo.positions[i]!);
  const lo = [0, 1, 2].map((k) => Math.min(...topo.positions.map((p) => p[k]!)));
  const hi = [0, 1, 2].map((k) => Math.max(...topo.positions.map((p) => p[k]!)));
  const tol = 0.005 * Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!);
  const long = faceLongAxes(facePoints, restingFace.normal, tol);
  // ⭐ (2026-10-10) ALL its edge-to-edge symmetry axes, computed when the face is chosen — what a roll lines up (`nextCoupleRoll`)
  const restingFlush = faceFlushAxes(facePoints, restingFace.normal, tol).axes;
  const local = new Map<number, number>();
  const positions: number[] = [];
  const indices: number[] = [];
  for (const f of restingFace.faces)
    for (const vi of topo.faces[f]!.triangles) {
      let li = local.get(vi);
      if (li === undefined) {
        li = local.size;
        local.set(vi, li);
        const p = topo.positions[vi]!;
        positions.push(p[0], p[1], p[2]);
      }
      indices.push(li);
    }
  const fill = new Mesh(`${m.name}-resting-face`, st.scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = [...indices, ...indices.slice().reverse()]; // ⚠ double-sided: it must read from either side
  data.applyToMesh(fill, false);
  const mat = new StandardMaterial(`${m.name}-resting-face-mat`, st.scene);
  mat.emissiveColor = RESTING_FACE_COLOUR.clone();
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.alpha = RESTING_ALPHA;
  fill.material = mat;
  fill.parent = m;
  fill.isPickable = false;
  fill.metadata = { orbitCandidate: false };
  // ⭐ the contour along the face's edges, a child of the (hidden) fill so it rides its lift; and its twin drawn THROUGH the piece, fainter
  const edges = faceEdges(facePoints, restingFace.normal).map((e) => e.map((p) => new Vector3(p[0], p[1], p[2])));
  const contour = CreateLineSystem(`${m.name}-resting-contour`, { lines: edges }, st.scene);
  contour.color = RESTING_FACE_COLOUR.clone();
  contour.parent = fill;
  contour.isPickable = false;
  const xray = CreateLineSystem(`${m.name}-resting-contour-xray`, { lines: edges }, st.scene);
  xray.color = RESTING_FACE_COLOUR.clone();
  xray.alpha = RESTING_CONTOUR_XRAY_ALPHA;
  xray.renderingGroupId = 1;
  xray.parent = fill;
  xray.isPickable = false;
  void data;
  const restingCentre = restingFaceRecord(topo.positions, topo.faces, restingFace)?.centre ?? [0, 0, 0];
  return { restingFill: fill, restingAxes: long.axes, restingAxesFallback: long.fallback, restingEdges: faceEdges(facePoints, restingFace.normal), restingLong: { axes: long.axes, ends: long.ends }, restingCentre, restingFlush };
}

/**
 * ⭐⭐ prototype — **THE YELLOW FACE SEEN THROUGH ITS OWN PIECE, NEVER THROUGH ANOTHER** (the owner, 2026-10-05: *"Make the yellow face not
 * occluded entirely but slightly translucent if occluded by the piece which owns it. It can be occluded entirely by other pieces"*).
 * ⭐ Draw ORDER, in the transparent pass (after every opaque body, which has written its depth), by `alphaIndex`:
 * 1. **the piece** — its colour, but NO depth written (convex, back faces culled: it needs none to draw itself right);
 * 2. **the yellow twin** — faint (`RESTING_XRAY_ALPHA`), depth-tested against the OTHER bodies only (the piece wrote none): hidden by
 *    another piece, seen through its own;
 * 3. **the piece's depth** — a colourless clone writing depth only, so whatever is drawn after (the yellow fill, other transparents)
 *    is hidden by the piece as usual;
 * 4. the yellow fill (`RESTING_ALPHA`, the default index — after all three): full where the face is in view.
 * ⚠ The cost: a TRANSPARENT body of another piece in front of this one (`Scene_1`'s contours) is drawn after it and tints it as it
 * should; one BEHIND it is hidden by step 3 — both right. What step 1 gives up is only the piece hiding itself, which a convex body
 * with culled back faces never needs.
 */

/** ⭐ Steps 1 and 3 of the draw order (above), once per piece: the piece into the transparent pass without depth, and its colourless depth clone. */
function restingDepth(st: SceneState, m: Mesh): void {
  const own = m.material as StandardMaterial;
  own.transparencyMode = Material.MATERIAL_ALPHABLEND; // ⭐ into the transparent pass, after every opaque body (alpha 1: unchanged)
  own.disableDepthWrite = true;
  m.alphaIndex = RESTING_ORDER;
  const depth = m.clone(`${m.name}-depth`, m, true);
  if (depth === null) return;
  depth.position.set(0, 0, 0);
  depth.rotationQuaternion = Quaternion.Identity();
  const dm = new StandardMaterial(`${m.name}-depth-mat`, st.scene);
  dm.disableColorWrite = true;
  dm.forceDepthWrite = true; // ⚠ the transparent pass writes no depth unless forced
  dm.transparencyMode = Material.MATERIAL_ALPHABLEND;
  depth.material = dm;
  depth.alphaIndex = RESTING_ORDER + 2;
  depth.isPickable = false;
  depth.metadata = { orbitCandidate: false };
}

/** ⭐ The transparent-pass order of the piece, its yellow twin and its depth (below the default index, so all three come first). */
const RESTING_ORDER = 1000;

/**
 * ⭐ prototype — **THE FACE THE PIECE ALIGNS TO**: ⛔⛔ (2026-10-12, the owner: *"Alignment of resting face shall be with the cube only"*) the
 * orientation cube's facet only (`st.pinkDir`, a virtual pink face — *"sit against this face"*): its direction and its edges (the roll's
 * axes); no position (the long axes' ends at the piece — a tie between them is never decided by a gap). A part's face and the frozen body's
 * are deleted as targets (the boot's is the cube's +y, `BOOT_UP`). `null` with no facet.
 */
function alignFaceOf(
  st: SceneState,
  piece: Vec3,
): { readonly label: string; readonly normal: Vec3; readonly long: LongAxes; readonly flush: readonly Vec3[] } | null {
  const d = st.pinkDir;
  if (d === null) return null;
  return {
    label: `cube ${dirLabel(d.normal)}`,
    normal: d.normal,
    long: { axes: d.axes, ends: d.axes.map((a) => [sub(piece, scale(a, 0.05)), add(piece, scale(a, 0.05))] as const) },
    flush: d.axes,
  };
}

/**
 * ⭐ (2026-10-12) the boot's alignment target: the cube's +y facet (the floor's top direction), its edges along the world's x and z — what the
 * frozen floor's top gave before, without a pink face (*"The boot alignment … could become simply the cube's +y facet"*).
 */
const BOOT_UP: OrientDirection = { normal: [0, 1, 0], axes: [[1, 0, 0], [0, 0, 1]] };

/** ⭐ A body's face in the world: its outward normal, its long axes (with their ends) and its edge-to-edge axes — `null` with no such face. */
function faceGeometry(
  st: SceneState,
  id: ObjectId,
  faceId: string,
): { readonly normal: Vec3; readonly long: LongAxes; readonly flush: readonly Vec3[] } | null {
  const mesh = st.meshOf.get(id);
  const pose = worldPlacementOf(st.world, id);
  if (mesh === undefined || pose === null) return null;
  const topo = st.topoOf.get(id) ?? topologyOfBody(st, mesh);
  const face = topo.faces.find((f) => f.id === faceId);
  if (face === undefined) return null;
  const pts = [...new Set(face.triangles)].map((i) => topo.positions[i]!);
  const lo = [0, 1, 2].map((k) => Math.min(...topo.positions.map((p) => p[k]!)));
  const hi = [0, 1, 2].map((k) => Math.max(...topo.positions.map((p) => p[k]!)));
  const tol = 0.005 * Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!);
  const long = faceLongAxes(pts, face.normal, tol);
  // ⭐ (2026-10-10) and ALL its edge-to-edge symmetry axes — the pink side of a roll's couples (`nextCoupleRoll`)
  const flush = faceFlushAxes(pts, face.normal, tol).axes;
  const w = (v: Vec3): Vec3 => add(pose.position, qRotate(pose.orientation, v));
  return {
    normal: qRotate(pose.orientation, face.normal),
    long: { axes: long.axes.map((a) => qRotate(pose.orientation, a)), ends: long.ends.map((e) => [w(e[0]), w(e[1])] as const) },
    flush: flush.map((a) => qRotate(pose.orientation, a)),
  };
}

/** ⭐ The resting-face alignment's single turn, ms (`RESTING_FACE_ALIGNMENT.md` §2: *"snap in one single rotation in 125 ms"*). */
const REST_ALIGN_MS = 125;

/**
 * ⭐ The horizontal heading of the piece about the orbit centre (radians about +y) — what the counter-yaw reads. ⭐⭐ (2026-10-08, the owner:
 * *"I want the position and quaternion to remain at the entrance and exit of the sphere even if the resting face is not aligned"*) read from
 * the piece AS PLACED (`headingAbout`), no longer from the spring's yaw: the way out's rebase of the yaw, and a dx that turns only the camera
 * round the piece, used to spin it by 3× a turn it never made.
 */
function orbitHeading(st: SceneState): number {
  const p = st.pieceAnchor;
  const c = st.orbitCentreM;
  return p === null ? 0 : headingAbout([c.x, c.y, c.z], p);
}

/**
 * ⭐⭐⭐ prototype — **THE RESTING-FACE ALIGNMENT** (`RESTING_FACE_ALIGNMENT.md` §2; the owner, 2026-10-05): the first second-finger tap
 * while orbiting. The target (`restAlignToFace`, `1.0.59q-`): the resting face ANTI-ALIGNED with the pink face, then the two faces' long
 * axes made parallel. Eased in ONE turn over `REST_ALIGN_MS` from the pose as it is; the counter-yaw stops at this tap (§2bis), so nothing
 * fights the ease, and the piece holds the aligned pose afterwards.
 */
export function alignRestingFace(st: SceneState, now: number, carryRolls = 0): boolean {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined || p.restingFace === null || st.greenBox === null || st.orbitPiecePlaced) return false; // ⭐ (2026-10-14) placed: no turn
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const q: Quat = [r.w, r.x, r.y, r.z];
  // ⭐ (2026-10-09) where the orbit placed it — its resting face's centre (`pieceAnchor`) — else the mesh before the first frame
  const a = st.pieceAnchor;
  const pos = a === null ? p.mesh.position : { x: a[0], y: a[1], z: a[2] };
  // ⭐ `1.0.59q-` (the owner, 2026-10-05): priority 1 BY THE PINK FACE — the resting face anti-aligned with it, then the two faces' long
  // axes parallel (the most parallel pair; a tie to the closest ends) by a turn about its normal. No face at all: the pose as it is.
  const target = alignFaceOf(st, [pos.x, pos.y, pos.z]);
  let base: Quat = q;
  let paired = -1;
  if (target === null) {
    st.lastVerdict = "orbit: tap 1 — nothing to align to (no pink face, no frozen body)";
  } else {
    const r = restAlignToFace(q, [pos.x, pos.y, pos.z], p.restingFace.normal, p.restingLong, target.normal, target.long);
    base = r.q;
    paired = r.pinkAxis;
    st.lastVerdict =
      `orbit: tap 1 — aligned: the resting face against ${target.label}` +
      (r.restAxis < 0 ? " (no long axes to pair)" : `, long axes a${r.restAxis} ∥ a${r.pinkAxis}`);
  }
  void paired; // ⭐ the first alignment pairs the LONG axes (above); the rolls use every edge-to-edge couple (2026-10-10)
  const pinkWas = st.pinkTargetNormal;
  st.pinkTargetNormal = target?.normal ?? null; // ⭐ (2026-10-12) the orientation cube lights this direction's facet
  const pinkAxes: readonly Vec3[] = target?.flush ?? [];
  // ⭐⭐ (2026-10-09, the owner: *"when a new resting face is selected and no change in the pink face, the numbers of rolls applied to the
  // previous resting face shall immediately apply to the new resting face"*) — `carryRolls` steps to the next edge on top of the alignment,
  // in the SAME turn
  let couple: readonly [number, number] | null = null;
  let rolls = 0;
  if (carryRolls !== 0) {
    // ⭐ (2026-10-10) SIGNED: the net rolls, clockwise (+) or counter-clockwise (−) on the screen
    const sense: 1 | -1 = carryRolls > 0 ? 1 : -1;
    const cam = st.camera.position;
    const tg = st.camera.getTarget();
    const view: Vec3 = [tg.x - cam.x, tg.y - cam.y, tg.z - cam.z];
    const right = st.camera.getDirection(new Vector3(1, 0, 0));
    for (let i = 0; i < Math.abs(carryRolls); i++) {
      const step = nextCoupleRoll(base, p.restingFace.normal, p.restingFlush, pinkAxes.length > 0 ? pinkAxes : [[right.x, right.y, right.z]], view, sense);
      if (step === null) break;
      base = step.q;
      couple = [step.rest, step.pink];
      rolls += sense;
    }
    if (rolls !== 0 && couple !== null) st.lastVerdict += ` — ${Math.abs(rolls)} roll${Math.abs(rolls) > 1 ? "s" : ""} carried over (${rolls > 0 ? "clockwise" : "counter-clockwise"}): a${couple[0]} ∥ b${couple[1]}`;
  }
  // ⛔⛔ (2026-10-13, `COLLISION.md` §11) the turn checked WHOLE before it starts — refused when it would push the piece into a part (a turn
  // cut short would leave the resting face misaligned); nothing changes, no episode
  const blockedBy = pieceTurnBlocker(st, base);
  if (blockedBy !== null) {
    st.pinkTargetNormal = pinkWas;
    st.lastVerdict = `orbit: the turn is blocked by ${blockedBy} — refused`;
    st.hudDirty = true;
    return false;
  }
  st.restAlign = { from: q, t0: now, base }; // ⭐ about the resting face's centre — the anchor (`placeByFaceCentre`)
  st.restAligned = true; // ⭐ from now on the piece no longer turns against the orbit (§2bis)
  // ⭐ (2026-10-09) what it aligned TO — the next tap on the same target ROLLS to the next edge (`rollRestingFace`) against that face's
  // long axis (the one paired), or the screen's horizontal with none; and how many rolls it carries
  st.restRoll = { key: target?.label ?? "", pinkAxes, rolls, couple };
  st.orbitRollAcc = 0;
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐ prototype — **THE TAPPED FACE BECOMES THE RESTING FACE** (2026-10-09; the owner: *"when a face of the green piece or the turquoise
 * piece is left button tapped or first touch tapped, the hit face becomes the resting face and it aligns. the roll to the next edge is
 * then implemented on this new resting face"*). The face `faceId` (the model's id — the topology's) of the shown piece: its candidate
 * (`candidateForFace`), its long axes, its edges and its pink fill rebuilt (the old fill disposed), and the object model's resting face
 * set to it (`TAPPED`). The alignment and the roll then read it as any resting face. `false` with no such face.
 */
export function restOnTappedFace(st: SceneState, faceId: string): boolean {
  const i = st.orbitPieces.findIndex((o) => o.mesh === st.greenBox);
  const p = st.orbitPieces[i];
  if (p === undefined) return false;
  const topo = topologyFromMesh(p.mesh);
  if (topo === null) return false;
  const idx = topo.faces.findIndex((f) => f.id === faceId);
  if (idx < 0) return false;
  if (p.restingFace !== null && p.restingFace.faces.includes(idx)) return true; // ⭐ already its resting face: nothing to rebuild
  const cand = candidateForFace(p.resting, idx, topo.faces[idx]!.normal);
  p.restingFill?.dispose(); // its x-ray twin is its child: it goes with it
  const parts = restingParts(st, p.mesh, topo, cand);
  // ⭐ (2026-10-09) the new face's centre now rides the anchor: the jump that would make (q·(new − old)) is faded out over the turn
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const q: Quat = [r.w, r.x, r.y, r.z];
  const jump = qRotate(q, [parts.restingCentre[0] - p.restingCentre[0], parts.restingCentre[1] - p.restingCentre[1], parts.restingCentre[2] - p.restingCentre[2]]);
  const prev = anchorShiftNow(st, performance.now());
  st.anchorShift = { off: [jump[0] + prev[0], jump[1] + prev[1], jump[2] + prev[2]], t0: performance.now() };
  st.orbitPieces[i] = { ...p, restingFace: cand, ...parts };
  const rec = restingFaceRecord(topo.positions, topo.faces, cand);
  if (rec !== null) st.world = setRestingFace(st.world, p.mesh.name, { ...rec, why: "TAPPED" });
  st.hudDirty = true;
  return true;
}

/**
 * ⭐ The orbit's turn per roll outside the sphere (2026-10-10): `ORBIT_ROLL_SPAN_RAD` over the stops of a half turn of the shown piece's
 * resting face against the axes it was aligned to (`coupleStops`); 0 with nothing to roll.
 */
export function orbitRollStepRad(st: SceneState): number {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  const rr = st.restRoll;
  if (p === undefined || p.restingFace === null || rr === null || rr.pinkAxes.length === 0) return 0;
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const n = coupleStops([r.w, r.x, r.y, r.z], p.restingFace.normal, p.restingFlush, rr.pinkAxes);
  return n > 0 ? ORBIT_ROLL_SPAN_RAD / n : 0;
}

/** ⭐ The face a tap would align the orbited piece to now (`alignFaceOf`'s label; "" with none) — compared with the last alignment's. */
export function restTargetKey(st: SceneState): string {
  const b = st.greenBox;
  if (b === null) return "";
  return alignFaceOf(st, st.pieceAnchor ?? [b.position.x, b.position.y, b.position.z])?.label ?? "";
}

/**
 * ⭐⭐⭐ prototype — **THE ROLL TO THE NEXT EDGE** (`1.0.59z-Rotation-of-resting-face`; the owner, 2026-10-09: *"rotation of the piece around
 * the normal of the resting face so the next edge of the resting face takes the alignment with the pink face long axis … a series of second
 * touch/right click make scroll the edges so there is a snapped roll around the normal of the resting face"* → the proposal agreed: *"Build
 * what you proposed"*). A tap on a piece already aligned to the same face (`tapAction`, ⛔ deleted 2026-10-10 — the orbit dx rolls): the piece turns about its resting face's normal,
 * CLOCKWISE AS SEEN FROM THE CAMERA, to the next EDGE STOP (`edgeStops`, `nextEdgeRoll`) — that edge's outward line parallel to the
 * reference (the paired long axis of the face it was aligned to, else the screen's horizontal laid on the face). Green: long axis →
 * short axis → … (4 stops, 90°); turquoise: one long axis to the next (6 stops, 60°). One turn eased over `REST_ALIGN_MS`, rotation
 * only; quick taps add up (each from the stop the last one was heading for). `false` with nothing to roll.
 */
export function rollRestingFace(st: SceneState, now: number, sense: 1 | -1 = 1, byOrbit = false): boolean {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  const rr = st.restRoll;
  if (p === undefined || p.restingFace === null || st.greenBox === null || rr === null || st.orbitPiecePlaced) return false; // ⭐ (2026-10-14) placed: no roll
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const shown: Quat = [r.w, r.x, r.y, r.z];
  const from = st.restAlign?.base ?? shown; // ⭐ quick taps add up: from where the last one was heading
  const cam = st.camera.position;
  const tg = st.camera.getTarget();
  const view: Vec3 = [tg.x - cam.x, tg.y - cam.y, tg.z - cam.z];
  // ⭐⭐ (2026-10-10) the next COUPLE of edge-to-edge symmetry axes — the resting face's and the pink face's (`nextCoupleRoll`); with no
  // pink axis, the screen's horizontal laid on the face
  let pinkAxes = rr.pinkAxes;
  if (pinkAxes.length === 0) {
    const right = st.camera.getDirection(new Vector3(1, 0, 0));
    pinkAxes = [[right.x, right.y, right.z]];
  }
  const roll = nextCoupleRoll(from, p.restingFace.normal, p.restingFlush, pinkAxes, view, sense);
  if (roll === null) {
    st.lastVerdict = "orbit: tap — nothing to roll (no symmetry axis, or the reference along the normal)";
    st.hudDirty = true;
    return false;
  }
  // ⛔⛔ (2026-10-13, `COLLISION.md` §11) refused when the whole turn is not free
  const blockedBy = pieceTurnBlocker(st, roll.q);
  if (blockedBy !== null) {
    st.lastVerdict = `orbit: the roll is blocked by ${blockedBy} — refused`;
    st.hudDirty = true;
    return false;
  }
  // ⭐⭐ (2026-10-09) about the resting face's CENTRE — it is the anchor the orbit places (`placeByFaceCentre`), so it stays put
  st.restAlign = { from: shown, t0: now, base: roll.q };
  st.restRoll = { ...rr, couple: [roll.rest, roll.pink], rolls: rr.rolls + sense }; // ⭐ signed: the net rolls (2026-10-10)
  st.lastVerdict = `orbit: ${byOrbit ? (sense > 0 ? "dx → roll" : "dx ← roll") : "tap — roll"} ${((roll.angleRad * 180) / Math.PI).toFixed(0)}°: resting axis a${roll.rest} ∥ ${rr.pinkAxes.length === 0 ? "the screen's horizontal" : `pink axis b${roll.pink}`}`;
  st.hudDirty = true;
  return true;
}


/**
 * ⭐⭐⭐ prototype — **THE CAMERA ENTERS THE ORBIT AROUND THE PIECE** (`PIECE_ORBIT.md`; the owner, 2026-10-06: *"when resting face is
 * aligned, the orbit center moves to the piece, the rest orbit around the piece"*). ⭐ AN ACTION OF ITS OWN (the owner, 2026-10-07:
 * *"Make those two actions independent, although triggered by the same input. Later on, we will likely map other inputs for those two
 * different actions"*): it no longer lives inside `alignRestingFace` — the tap (`orbitTapped`, ⛔ inert since 2026-10-10) called both, each alone. Entered once; a
 * second call keeps it (`false`). `true` when it starts here. ⭐ Since 2026-10-11 called by the HELD SECOND TOUCH (`hold_wiring.ts`); the sphere is deleted.
 */
export function enterPieceOrbit(st: SceneState): boolean {
  const box = st.greenBox;
  if (box === null || st.pieceOrbit !== null || st.pieceEntry !== null) return false;
  // ⛔⛔ (2026-10-11, the owner: *"At the end of the roll to the next axis, the object systematically translates towards the world's negative
  // depth axis when second touch is lifted"*) — the ANCHOR (the resting face's centre: what rides the rings since 2026-10-09), never the
  // mesh's origin: read there, the way out's offset carried the piece by its middle-to-face distance at the release (20.6 mm headless)
  const a = st.pieceAnchor;
  const pos = a === null ? box.position : { x: a[0], y: a[1], z: a[2] };
  const c = st.orbitCentreM;
  const cam = st.camera.position;
  const tg = st.camera.getTarget();
  // ⭐⭐ (2026-10-08) THE WAY IN starts (`startPieceEntry`) — the fingers keep the centre orbit until it is done (the frame then starts the
  // orbit around the piece, `startPieceOrbit`). Recorded now: the camera against the centre orbit's own camera (zero but for a way back
  // cut short), where it looks, its distance from the piece, and the PINK GIZMO's distance (for the record)
  // ⭐ (2026-10-08) the camera's angles round the piece against the rings', and the piece's heading round the gizmo — the orbit's yaw now
  const ring = anglesOf(cameraOffset(st.cfg, st.cameraLagged ?? { yaw: st.orbit.yaw, v: st.orbit.elevation }, [0, 0, 0], pieceOrbitAngleOffset(st), 1));
  // ⭐⭐ (2026-10-08) a WAY OUT cut short gives way — its piece offset still left is taken over and faded out by the way in (no jump)
  const left: Vec3 = st.centreReturn === null ? [0, 0, 0] : returnPieceOffset(st.centreReturn, st.cfg.pieceOrbitReturnMm);
  st.pieceEntry = startPieceEntry([c.x, c.y, c.z], [pos.x, pos.y, pos.z], [cam.x, cam.y, cam.z], [tg.x - cam.x, tg.y - cam.y, tg.z - cam.z], st.centreBlend.targetM, ring, st.boxOrbit?.yaw ?? st.orbit.yaw, left, clampGreenZoom(st.zoom));
  // ⭐ (2026-10-10) the view's re-aim to the piece: by dx only (`PieceAim`)
  st.pieceAim = startPieceAim(st.pieceEntry);
  st.centreReturn = null;
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐⭐ prototype — **THE WAY BACK TO THE ORBIT AROUND THE CENTRE** (`PIECE_ORBIT.md`; the owner, 2026-10-07: *"When it ends (in this case or
 * at respawn), the camera orbit transition to center orbit is the same reverse as when it transitions from center orbit to piece orbit"*).
 * The orbit around the piece ends; on this frame nothing moves — the camera where it is, looking where it looks, recorded against the
 * centre orbit's own camera (`startCentreReturn`); the frame then fades the difference out with finger travel (`returnCamera`,
 * `returnLook`). `rebase` (the end by distance): the rig's yaw is put back on the piece's own direction from the centre — dx turned only the
 * camera around the piece, so the rig had drifted from it — the springs and the camera starting again from there, and the piece's
 * difference from the rings fades out too; a respawn (`rebase` false) has already put the rig and the piece back at boot.
 */
export function returnToCentreOrbit(st: SceneState, rebase: boolean): void {
  const box = st.greenBox;
  if (box === null) return;
  const c = st.orbitCentreM;
  const cam = st.camera.position;
  const tg = st.camera.getTarget();
  const lk: Vec3 = [tg.x - cam.x, tg.y - cam.y, tg.z - cam.z];
  const ln = Math.hypot(lk[0], lk[1], lk[2]) || 1;
  if (rebase) {
    const a = st.pieceAnchor;
    const p = a === null ? box.position : { x: a[0], y: a[1], z: a[2] };
    st.orbit = new OrbitController(st.cfg, Math.atan2(p.z - c.z, p.x - c.x), st.orbit.elevation);
    st.orbitInertia.stop();
    // ⭐⭐ (2026-10-09, the owner: *"do the fix"* — a fast dy kept the piece far from the gizmo) the spring is re-based on the new YAW
    // only: its ELEVATION goes on where the piece is drawn, still easing after the finger. ⛔ It was reset onto the finger's elevation and
    // the gap measured from there, so the spring's trailing (larger the faster the push) was baked into the piece offset below — and
    // faded over 30 mm of travel instead of the spring's ~60 ms
    const sp = st.boxSpring;
    st.boxSpring = sp === null ? null : { at: { yaw: st.orbit.yaw, v: sp.at.v, zoom: sp.at.zoom }, velYaw: 0, velV: sp.velV, velLnZoom: sp.velLnZoom };
    st.pieceQ = null; // ⭐ (§12) the yaw re-based: the solved place starts again from the piece as drawn
    st.cameraOrbit = null;
    st.cameraLagged = null;
    st.orbitHeadingPrev = null;
  }
  // ⭐ where the rings put the piece and the camera — at the elevation the piece is DRAWN at (the spring's), on a rebase
  const hv = rebase && st.boxSpring !== null ? st.boxSpring.at.v : st.orbit.elevation;
  const bo = orbitOffset(st.cfg, st.orbit.yaw, hv, GREEN_PIECE_ORBIT_ZOOM);
  const k = bo.radiusM > 1e-9 ? clampPieceRadiusM(bo.radiusM, st.cfg) / bo.radiusM : 1;
  const rel: Vec3 = [bo.offsetM[0] * k, bo.offsetM[1] * k, bo.offsetM[2] * k];
  const ringCam = cameraOffset(st.cfg, { yaw: st.orbit.yaw, v: hv }, rel, pieceOrbitAngleOffset(st), cameraGapM(st.cfg.cameraRadiusOffsetMm / 1000, st.zoom));
  // ⛔⛔ (2026-10-11, the owner: *"At the end of the roll to the next axis, the object systematically translates towards the world's negative
  // depth axis when second touch is lifted"*) — the ANCHOR (the resting face's centre: what rides the rings since 2026-10-09), never the
  // mesh's origin: read there, the way out's offset carried the piece by its middle-to-face distance at the release (20.6 mm headless)
  const a = st.pieceAnchor;
  const p = a === null ? box.position : { x: a[0], y: a[1], z: a[2] };
  const pieceOff: Vec3 = rebase ? [p.x - (c.x + rel[0]), p.y - (c.y + rel[1]), p.z - (c.z + rel[2])] : [0, 0, 0];
  // ⭐ seen from the PIECE as it is drawn (where the rings put it + its offset): the home camera and the camera as it is
  const piece: Vec3 = [c.x + rel[0] + pieceOff[0], c.y + rel[1] + pieceOff[1], c.z + rel[2] + pieceOff[2]];
  const homeRel: Vec3 = [c.x + ringCam[0] - piece[0], c.y + ringCam[1] - piece[1], c.z + ringCam[2] - piece[2]];
  // ⭐ (2026-10-09) the rings' distance now — the start of the piece's progress toward their closest point (`ringProgress`)
  st.centreReturn = startCentreReturn(piece, [cam.x, cam.y, cam.z], [lk[0] / ln, lk[1] / ln, lk[2] / ln], homeRel, pieceOff, bo.radiusM * k);
  st.pieceOrbit = null;
  st.pieceAim = null; // ⭐ (2026-10-10) the way out starts from the view as it is
  st.hudDirty = true;
}

/**
 * ⭐⭐ Each frame: the orbited piece turned WITH the orbit (the owner, 2026-10-06: *"when in orbit around center, yaw rotate the piece in
 * the other direction"* — it turned AGAINST it, `counterYaw` with the orbit's sign, §2bis) — by the change of its heading about the ring since the
 * last frame, read from the spring (what is drawn): at boot, the finger down or not, a coast too — ⛔ UNTIL its resting face is ALIGNED
 * (the owner, 2026-10-05: *"remove the rotation when the resting piece is aligned"* → *"The counter-yaw once aligned"*): from the tap on,
 * it holds its aligned pose while it orbits (a respawn clears it). ⭐ A respawn or the first frame starts the reading again.
 */
function counterYawFrame(st: SceneState): void {
  const box = st.greenBox;
  if (box === null || st.boxOrbit === null) return;
  const h = orbitHeading(st);
  const prev = st.orbitHeadingPrev;
  st.orbitHeadingPrev = h;
  // ⭐⭐ (2026-10-08, the owner: *"when the piece is not aligned and inside the sphere, the piece rotates with the yaw orbit. remove that (I want
  // the piece to behave the same as when resting face is aligned)"*) — while the SPHERE is on, no spin at all, inside it or out (the way in's
  // carried share too), aligned or not; the heading is still read, so a sphere set to 0 resumes the spin without a jump
  // ⭐ (2026-10-11) the sphere is deleted: no spin ever — every piece is aligned from its spawn
  if (prev === null || st.restAligned) return;
  const d = wrapAngle(h - prev);
  if (d === 0) return;
  const r = box.rotationQuaternion ?? Quaternion.Identity();
  // ⭐ the orbit's own sense: −k·d to `counterYaw` turns the piece by +k·d — k = `orbitPieceYawFactor`, 3 (*"rotate twice faster"*, then 3):
  // it turns on itself three times what the orbit carries it round
  const q = counterYaw([r.w, r.x, r.y, r.z], -st.cfg.orbitPieceYawFactor * d);
  box.rotationQuaternion = new Quaternion(q[1], q[2], q[3], q[0]);
}

/** ⭐ Each frame: the alignment's single ease toward its target (the counter-yaw stopped at the tap); landed, it ends. */
function restAlignFrame(st: SceneState, now: number): void {
  const a = st.restAlign;
  if (a === null || st.greenBox === null) return;
  let u = Math.min(1, Math.max(0, (now - a.t0) / REST_ALIGN_MS));
  // ⭐⭐ (2026-10-13, the second audit) the turn was checked at the tap; the orbit may have carried the piece since — the next increment, at
  // the piece's place NOW, is held when it would take it under the margin (`turnStepHeld`): the slerp waits, and resumes once the way is open
  const b = st.greenBox;
  const anchor = st.pieceAnchor;
  if (anchor !== null && u > (a.u ?? 0) && worldPlacementOf(st.world, b.name) !== null) {
    const t1 = performance.now();
    const r = b.rotationQuaternion ?? Quaternion.Identity();
    const shown: Quat = [r.w, r.x, r.y, r.z];
    const next = u < 1 ? qSlerp(a.from, a.base, u * u * (3 - 2 * u)) : a.base;
    const setup = pieceCollisionSetup(st);
    const gapWith = (o: Quat): number => {
      const pose = pieceMeshAt(st, anchor, o);
      return pose === null ? LOOK_M : nearestObstacle(setWorldPlacement(st.world, b.name, pose), b.name, setup, LOOK_M).gapM;
    };
    if (turnStepHeld(gapWith(next), gapWith(shown), pieceSolveOptions(st).gapM)) {
      u = a.u ?? 0;
      st.restAlign = { ...a, t0: now - u * REST_ALIGN_MS };
      st.restAlignHeld = true; // ⭐ (the third audit) shown: the yellow quad turns red while its turn waits
    } else {
      st.restAlign = { ...a, u };
      st.restAlignHeld = false;
    }
    st.pieceGuardCarryMs += performance.now() - t1;
    st.pieceQueriesCarry += 2;
  }
  const q = u < 1 ? qSlerp(a.from, a.base, u * u * (3 - 2 * u)) : a.base;
  b.rotationQuaternion = new Quaternion(q[1], q[2], q[3], q[0]);
  if (u >= 1) {
    st.restAlign = null; // ⭐ landed: the pose stays as it is (and goes on turning against the orbit)
    st.restAlignHeld = false;
    st.hudDirty = true;
  }
}

/** ⭐ The piece in use's yellow fill, lifted off its face by the highlight offset (`highlightLiftMm` on the glass, at its distance). */
function restingFillFrame(st: SceneState, now: number): void {
  void now;
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined || p.restingFill === null || p.restingFace === null) return;
  // ⛔ (2026-10-12, the owner: *"Do not fade the pink faces on the green piece in the screen nor on the cube"* → *"resting face … highlighted
  // contours in yellow (no more pink highlight of the resting face …)"*) — the fill hidden; its yellow contour (and its x-ray twin) always shown
  const fill = p.restingFill;
  fill.isVisible = false;
  // ⭐⭐ (2026-10-12, the owner: *"same for the outline as for the quads: min 1 pixel, hidden below half max distance"*) — hidden with the quads (below half the farthest distance: it had shrunk to a flickering point there)
  // ⭐⭐ (2026-10-14, the owner: *"scale the yellow highlight on the hosting part and the resting face on the piece in the same way they scale for the quads as the piece moves towards the gizmo (instead as towards the max distance). So that this is the mirror effect passing the point where quads disappear. At full scale the yellow highlight follows the contour of the hosting face. At min scale (1 pixel) it is centered on the center of the hosting face."*) — and in the MIRROR: past where the quads disappear it grows again toward the gizmo (`growth`)
  // ⭐⭐ (2026-10-14, the owner: *"keep the yellow highlight of the resting face at full scale, do not diminish it."*) — ALWAYS SHOWN, AT FULL SCALE (no growth with the quads, no mirror)
  // ⭐⭐⭐ (2026-10-15, the owner: *"Hide the yellow highlight of the resting face when the quads are not shown"* · *"Continue to green highlight the resting face … when sliding is allowed"*) — shown with the quads, or while a slide is available or on (`restingContourShown`)
  const shown = restingContourShown(st.restingQuads?.shown === true, st.hoverReady !== null || st.hover !== null);
  for (const c of fill.getChildMeshes(true)) c.isVisible = shown;
  const camD = Vector3.Distance(st.camera.position, p.mesh.position);
  const lift = highlightLiftM(st.cfg.highlightLiftMm, camD, st.camera.fov, st.canvas.clientHeight);
  const n = p.restingFace.normal;
  // ⭐⭐ (2026-10-12, the owner: *"scale the yellow highlight of the resting face in the same way as the quads"*) — about the face's centre, by the
  // quads' growth this frame (`quadSize` ÷ the full size, at most 1); ⭐ never under ONE PIXEL across (its longest axis, on the glass)
  const k = 1;
  const c = p.restingCentre;
  fill.scaling.setAll(k);
  fill.position.set(c[0] * (1 - k) + n[0] * lift, c[1] * (1 - k) + n[1] * lift, c[2] * (1 - k) + n[2] * lift);
}

/**
 * ⭐⭐ prototype — **THE ORBITED PIECE, SPAWNED AS AT BOOT** (the owner, 2026-10-04: *"Create a slider in scene menu to choose between the
 * green piece or the turquoise piece. When toggled, the piece shall be spawn as per boot"*). The piece `kind` names (0 green, 1 turquoise)
 * is the one the orbit carries (`st.greenBox`), shown and pickable; the other is hidden. Its orientation is the boot one
 * (`greenBootOrientation`, Scene_1 (1,2,3,4)); its position is the rig's boot pose — so a switch puts the rig back there too (yaw, ring,
 * zoom; the yellow target stays where it is, as a camera reset keeps it), the spring and the camera starting again from it, no coast.
 */
export function spawnOrbitPiece(st: SceneState, kind: number, atBoot: boolean): void {
  const p = st.orbitPieces[kind] ?? st.orbitPieces[0];
  if (p === undefined) return;
  for (const o of st.orbitPieces) o.mesh.setEnabled(o === p);
  st.greenBox = p.mesh;
  st.orbitPieceKind = kind;
  st.orbitPieceFaces = p.faces;
  st.greenPieceVolumeM3 = p.volumeM3;
  p.mesh.rotationQuaternion = toBabylon(greenBootOrientation(st.sceneSpec.id));
  if (!atBoot) {
    st.orbit = new OrbitController(st.cfg, ORBIT_START_YAW_RAD, st.bootElevation);
    st.zoom = st.orbitStartZoom;
    st.cameraReset = null;
    st.orbitInertia.stop();
    st.orbitMotion = null;
    st.boxSpring = null;
    st.cameraOrbit = null;
    st.cameraLagged = null;
    st.restAlign = null;
    st.orbitHeadingPrev = null;
    st.restAligned = false;
    st.restRoll = null;
    st.anchorShift = null;
    st.pieceOrbit = null;
    st.pieceEntry = null;
    st.pieceAim = null;
    st.orbitRollAcc = 0;
    st.centreReturn = null;
    // ⭐ (2026-10-11) the held second touch's input ends with the respawn — no way in, no way out (the sphere is deleted)
    st.hold = null;
    st.pieceQ = null; // ⭐ (2026-10-13, §12) a new orbit: the solved place starts again from it
    st.orbitPiecePlaced = false; // ⭐ (2026-10-14) a switch or a respawn brings a piece back to the orbit
    st.hover = null; // ⭐ (2026-10-14) a new orbit: no hover, no piece-only offset, the orbit's camera
    st.hoverPress = null;
    st.hoverBand = null;
    st.hoverFollow = null;
    st.hoverDraw = null;
    st.wayInDrawn = null;
    st.hoverSpent = null;
    st.hoverOffset = null;
    st.hoverWayIn = null;
    st.hoverView = null;
    st.orbitRawPrev = null;
    st.orbitUserV = null;
  }
  // ⭐⭐ (2026-10-10, the owner: *"at boot, all the pieces (not placed) have their resting face aligned with frozen object … so the roll is
  // immediately active at boot"*) — aligned to the frozen body on the first frame, once the orbit has placed it (`bootRestAlign`)
  st.bootRestAlign = true;
  st.hudDirty = true;
}

/**
 * ⭐⭐ (2026-10-13, the owner: *"build a piece-switch respawn which activates if any delta position input (orbiting or translation) and any rotation by quad is blocked: in such case, if the user double tap/click on the piece, the piece respawns at its initial spawn transform"*; `COLLISION.md` §11quater) — THE STUCK PIECE RESPAWNED: as the piece switch does (`spawnOrbitPiece`: the
 * boot orientation, the boot orbit, aligned to the frozen body at the next frame), and the orbit centre back where it booted (its spawn
 * transform is on the boot ring). ⚠ An episode MALUS is owed (the episode counts come later).
 */
export function respawnStuckPiece(st: SceneState): void {
  spawnOrbitPiece(st, st.orbitPieceKind, false);
  st.centreBlend.snapTo([st.bootCentreM[0], st.bootCentreM[1], st.bootCentreM[2]]);
  syncCentre(st);
  st.pieceMoveBlocked = false;
  st.pieceStuck = STUCK_FRESH;
  st.quadTurnCheck = { blockedBy: null, key: "", at: 0 };
  st.lastVerdict = "orbit: stuck — double tap on the piece: respawned at its spawn transform (⚠ an episode malus to come)";
  // ⭐ the verdict line is the boot alignment's at the next frame: the HUD's collision slot keeps the respawn for 2 s
  st.lastCollision = "stuck → respawned (⚠ episode malus owed)";
  st.lastCollisionAt = performance.now();
  st.hudDirty = true;
}

/**
 * ⭐⭐ prototype — **THE BOOT ALIGNMENT TO THE FROZEN BODY** (2026-10-10, the owner: *"at boot, all the pieces (not placed) have their resting
 * face aligned with frozen object"* — *"so the roll is immediately active at boot"*). At the first frame after a spawn (boot, respawn, the
 * switch), the piece where the orbit put it (`at`): its resting face turned AT ONCE against the frozen body's face toward it (the floor's top),
 * the long axes paired (`restAlignToFace`, as a tap's alignment — but no ease, no episode), and the piece counted ALIGNED to it — so a roll,
 * by dx outside the sphere or by a tap, works from the start, against the floor's axes. Aligning to the pink face takes a press on the piece.
 */
function bootRestAlign(st: SceneState, at: Vec3): void {
  st.bootRestAlign = false;
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined || p.restingFace === null) return;
  // ⭐ (2026-10-12) the cube's +y facet (`BOOT_UP`) — the floor's top direction, no pink face
  st.pinkDir = BOOT_UP;
  const target = alignFaceOf(st, at);
  if (target === null) return;
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const turned = restAlignToFace([r.w, r.x, r.y, r.z], at, p.restingFace.normal, p.restingLong, target.normal, target.long);
  p.mesh.rotationQuaternion = toBabylon(turned.q);
  st.restAlign = null;
  st.restAligned = true;
  st.pinkTargetNormal = target.normal;
  st.restRoll = { key: target.label, pinkAxes: target.flush, rolls: 0, couple: null };
  st.orbitRollAcc = 0;
  st.lastVerdict = `orbit: boot — the resting face aligned to ${target.label}; the roll is active`;
  st.hudDirty = true;
}

/**
 * ⭐⭐ prototype — **THE ORBITED PIECES JOIN THE OBJECT MODEL** (the owner, 2026-10-09: *"add the object model to the green and turquoise
 * pieces so their faces can be tracked"*). Both pieces (one shown at a time): their logical faces from the mesh (the same topology the
 * scene's parts are read from, so the ids match), their convex shape (for the collision to come), their resting face as chosen at their
 * creation (`SPAWN`, the face the pink fill shows), and `orbited` — the orbit places them, the model follows (`syncOrbitPieceModel`).
 * Called once, after the model and the shadows exist.
 */
export function registerOrbitPieces(st: SceneState): void {
  const added: SceneObject[] = [];
  for (const p of st.orbitPieces) {
    const m = p.mesh;
    const topo = topologyOfBody(st, m);
    const rec = p.restingFace === null ? null : restingFaceRecord(topo.positions, topo.faces, p.restingFace);
    const r = m.rotationQuaternion ?? Quaternion.Identity();
    added.push({
      id: m.name,
      local: { position: [m.position.x, m.position.y, m.position.z], orientation: [r.w, r.x, r.y, r.z] },
      parent: null,
      faces: topo.faces.map((f) => ({ id: f.id, centre: f.centre, normal: f.normal })),
      shape: shapeOfBody(st, m),
      connectors: [],
      constraints: [],
      orbited: true,
      ...(rec === null ? {} : { restingFace: { ...rec, why: "SPAWN" as const } }),
    });
    st.idOf.set(m, m.name);
    st.meshOf.set(m.name, m);
  }
  st.world = makeWorld([...st.world.objects.values(), ...added]);
}

/**
 * ⭐⭐ prototype — each frame, AFTER the orbit placed it: the shown piece's model placement copied from its mesh, so its faces and its
 * resting face are tracked (`faceWorld`, `restingFaceWorld`). Written only when it moved. ⛔ It is no scene change: a goal commit
 * that had seen the world as it was still has (the undo already ignores an orbited piece, `worldsDiffer`).
 */
export function syncOrbitPieceModel(st: SceneState): void {
  const m = st.greenBox;
  if (m === null) return;
  const o = st.world.objects.get(m.name);
  if (o === undefined || o.orbited !== true) return;
  // ⛔⛔⛔ (2026-10-15, the owner: *"the green piece reached its goal and still, it is misaligned. Your fix in 716b71b did not work."*) — PLACED, the MODEL
  // leads: the mesh is drawn from it (the goal pull, the exact goal pose). ⛔ The mesh was copied INTO the model every frame — and once placed nothing
  // moved the mesh (the orbit stops placing it, the parts' drawing skips the orbited piece): the pull and the exact pose were undone the next frame
  if (st.orbitPiecePlaced) {
    m.position.set(o.local.position[0], o.local.position[1], o.local.position[2]);
    m.rotationQuaternion = new Quaternion(o.local.orientation[1], o.local.orientation[2], o.local.orientation[3], o.local.orientation[0]);
    return;
  }
  const r = m.rotationQuaternion ?? Quaternion.Identity();
  // ⭐⭐ (2026-10-14, the hover's audit) the hover's drawn lag is the mesh's, not the model's
  const d = modelLag(st.hoverDraw, st.orbitPiecePlaced);
  const pos: Vec3 = [m.position.x - d[0], m.position.y - d[1], m.position.z - d[2]];
  const q: Quat = [r.w, r.x, r.y, r.z];
  const was = o.local;
  const same =
    Math.hypot(pos[0] - was.position[0], pos[1] - was.position[1], pos[2] - was.position[2]) < 1e-9 &&
    q.every((v, i) => Math.abs(v - was.orientation[i]!) < 1e-12);
  if (same) return;
  const committed = st.goalCommitWorld === st.world;
  st.world = setLocalPlacement(st.world, m.name, { position: pos, orientation: q });
  if (committed) st.goalCommitWorld = st.world;
}

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
  // ⭐ Its volume (the frustum, not its bounding box) — what the orbit's inertia is sized by (`inertiaTauMs`).
  st.orbitPieces.push({ mesh: box, faces: piecesFacesOf(box), volumeM3: frustumVolumeM3(w, h, d, OBJECT_TOP_SCALE), ...restingOf(st, box) });
  // ⭐⭐ prototype, the owner 2026-10-04: *"Create the turquoise hexagonal piece as previous. Set the same transform as the green piece
  // (quaternion =(1,2,3,4) and position) at boot"* — a 6-sided prism as long as the green piece's longest side, half that across its
  // corners (`turquoiseSizeM`), FLAT shaded (⛔ a smooth-shaded hexagon reads as a cylinder — defect 68's lesson); the orbit carries
  // whichever one the SCENE menu's switch names (`orbitPieceKind`), the other one hidden.
  const ts = turquoiseSizeM([w, h, d]);
  const hex = CreateCylinder("turquoise-piece", { height: ts.lengthM, diameter: ts.diameterM, tessellation: 6 }, st.scene);
  hex.convertToFlatShadedMesh();
  const hm = new StandardMaterial("turquoise-piece-mat", st.scene);
  hm.diffuseColor = TURQUOISE;
  hex.material = hm;
  hex.isPickable = true; // as the green piece: a press on it is empty space (`throughGreenBox`, the piece in use)
  hex.billboardMode = Mesh.BILLBOARDMODE_NONE;
  st.orbitPieces.push({ mesh: hex, faces: piecesFacesOf(hex), volumeM3: hexPrismVolumeM3(ts.diameterM, ts.lengthM), ...restingOf(st, hex) });
  spawnOrbitPiece(st, st.cfg.orbitPieceKind, true);
  // ⭐⭐ prototype (green box): the PINK RING at the yellow target — billboarded, the amber gizmo ring's size on the glass
  // (`GIZMO_RING_PX`), drawn on top — ⭐⭐⭐ (2026-10-15, the owner: *"make the gizmo always seen if the gizmo slider is toggled on. No need for raycast, timer"*) always.
  // ⭐ prototype (green box), the owner 2026-10-02: *"make the pink ring slightly thicker and brighter so I can see it better"*.
  // ⛔ WebGL draws a line ONE pixel wide whatever is asked, so the band is `PINK_RING_LOOPS` concentric loops half a pixel apart
  // (~3 px), one line system — still billboarded, unpickable.
  const ring = CreateLineSystem(
    "pink-target-ring",
    { lines: PINK_RING_LOOPS.map((k) => RING_POINTS.map((p) => p.scale(k))) },
    st.scene,
  );
  // ⭐⭐ (2026-10-12, the owner: *"change the color of the pink gizmo to the same yellow as the quad color"*) — the quads' yellow (it was
  // pink, 1, 0.6, 0.9)
  ring.color = RESTING_COLOUR.clone();
  ring.isPickable = false;
  ring.metadata = { orbitCandidate: false };
  ring.billboardMode = Mesh.BILLBOARDMODE_ALL;
  ring.renderingGroupId = 2;
  st.pinkRing = ring;
}

/**
 * ⭐ The band's loops, as scales of the ring: the ring is `GIZMO_RING_PX` (11 px) across, so 1 px of radius is 2/11 ≈ 0.18 of its
 * radius; ⭐ (2026-10-12, the owner: *"reduce the thickness of the yellow gizmo ring by a factor 2"*) loops ±0.5 px around it (~1.5 px) →
 * *"make the yellow gizmo ring thickness the same as the quad edge thickness"* — ONE loop, a 1 px line as a quad's edge (it was ±1 px, ~3 px).
 */
const PINK_RING_LOOPS = [0].map((px) => 1 + (px * 2) / GIZMO_RING_PX);

/**
 * ⭐⭐ prototype (green box) — **THE YELLOW GIZMO, EACH FRAME**: at the yellow target, the amber ring's size on the glass, drawn on top, ALWAYS
 * shown while its slider is on. ⛔⛔ (2026-10-15, the owner: *"Let's make it simple and light for game lightness: make the gizmo always seen if the
 * gizmo slider is toggled on. No need for raycast, timer, etc."*) — the per-frame ray that hid it behind a part (translucent behind the piece) is
 * DELETED: it blinked the ring off for the 1–2 frames it crossed a thin part on a far orbit (measured; the pink build `74e48e2` did the same), and
 * a 120 ms hold on its verdict was refused.
 */
export function pinkRingFrame(st: SceneState): void {
  const ring = st.pinkRing;
  if (ring === null) return;
  // ⭐ (2026-10-11, the owner: *"add a slider to hide the pink gizmo"*) hidden by its slider
  if (st.cfg.pinkGizmoVisible !== 1) {
    ring.isVisible = false;
    return;
  }
  const t = st.centreBlend.targetM;
  const cam = st.camera.position;
  const dir = new Vector3(t[0] - cam.x, t[1] - cam.y, t[2] - cam.z);
  const dist = dir.length();
  if (!(dist > 1e-6)) {
    ring.isVisible = false;
    return;
  }
  ring.isVisible = true;
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
  // ⭐ the SCENE menu's switch moved: the other piece, spawned as at boot (`spawnOrbitPiece`)
  if (st.cfg.orbitPieceKind !== st.orbitPieceKind) spawnOrbitPiece(st, st.cfg.orbitPieceKind, false);
  const now = performance.now();
  let c = st.orbitCentreM;
  // ⭐ (2026-10-11) the orbit around the piece starts and ends with the HELD SECOND TOUCH (`hold_wiring.ts`) — the sphere is deleted
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
      return { distanceM: clampPieceRadiusM(o.radiusM, cfg), pitchRad: Math.atan2(o.offsetM[1], Math.hypot(o.offsetM[0], o.offsetM[2])) };
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
  let rig: OrbitQ = { yaw: st.orbit.yaw, v: st.orbit.elevation, zoom: GREEN_PIECE_ORBIT_ZOOM };
  // ⭐ (2026-10-13, the second audit) the stuck and turn checks of the last frame counted too (they run after this frame's mean)
  st.pieceGuardFrameMs = st.pieceGuardCarryMs;
  st.pieceQueries = st.pieceQueriesCarry;
  st.pieceGuardCarryMs = 0;
  st.pieceQueriesCarry = 0;
  st.pieceDeferred = false;
  st.pieceSolveQueries = 0;
  // ⭐⭐⭐ (2026-10-13, the audit's rebuild → *"Build"*; `COLLISION.md` §12) — THE PIECE'S PLACE ON ITS RING IS SOLVED, ONCE A FRAME: from where
  // it is (`st.pieceQ`, the one authority) toward the orbit's target (the finger, the coast) by `solveOrbitStep` — conservative advancement
  // along the arc, the exact slide at the gap kept, a work cap. The eye eases toward the SOLVED place on the orbit's spring (never toward a
  // refused target: no pull-back); the camera is driven by the solved place. ⛔ The way in / out round a piece (`pieceOrbit`, `pieceEntry`, `centreReturn`) is not solved.
  const b0 = st.greenBox;
  // ⭐ (2026-10-14) a piece captured onto its goal stays placed: no solve (the camera still rides the rings)
  if (!st.orbitPiecePlaced && st.pieceOrbit === null && st.pieceEntry === null && st.centreReturn === null && b0 !== null && worldPlacementOf(st.world, b0.name) !== null) {
    const t0 = performance.now();
    const env = pieceSolverEnv(st);
    // ⭐ (2026-10-14) the way in after a hover keeps its share of the frame's cap (`HOVER_FADE_QUERIES`): near the hosting face the orbit's slide
    // took it all and the way in advanced in bursts
    const opt0 = pieceSolveOptions(st);
    const opt = st.hoverWayIn !== null && st.hoverOffset !== null ? { ...opt0, maxQueries: Math.max(4, opt0.maxQueries - HOVER_FADE_QUERIES) } : opt0;
    if (st.pieceQ === null) {
      st.pieceQ = st.boxSpring?.at ?? rig;
    }
    // ⭐⭐ (2026-10-13, the second audit) ONE FRAME DECIDED in `orbitFrame` (input/piece_orbit_solver.ts): the relocation, the solve, the target's
    // reset, the work cap's rest, the ring height kept — the render only applies it
    // ⭐ (the third audit) the relocation's search resumes where the cap cut it, and is not re-run for a place already found exhausted
    if (st.hover !== null) {
      // ⭐⭐⭐ (2026-10-14, the hover's second audit) THE ORBIT HOLDS STILL UNDER A HOVER (`orbitFrameUnderHover`): no backlog, no way back to the height, no relocation
      const held = orbitFrameUnderHover(st.pieceQ);
      if (!sameQ(held.target, rig)) st.orbit.reset(held.target.yaw, held.target.v);
      st.orbitInertia.stop();
      st.orbitUserV = held.userV;
      st.pieceQ = held.q;
      st.pieceSolveQueries = held.queries;
      rig = { ...held.q };
      st.orbitRawPrev = { yaw: st.orbit.yaw, v: st.orbit.elevation };
    } else {
    const rr = b0.rotationQuaternion;
    const relocKey = relocationKey(st.pieceQ, rr ? [rr.w, rr.x, rr.y, rr.z] : null, st.centreBlend.targetM, sceneSignature(st));
    if (st.relocateCursor.key !== relocKey) st.relocateCursor = { key: relocKey, from: 0 };
    const fr = orbitFrame(
      { q: st.pieceQ, target: rig, userV: st.orbitUserV, prevRaw: st.orbitRawPrev },
      env,
      opt,
      { stepM: RELOCATE_STEP_M, maxM: RELOCATE_MAX_M, from: st.relocateCursor.from },
    );
    st.relocateCursor = { key: relocKey, from: fr.relocateNext ?? (fr.relocateExhausted ? -1 : 0) };
    st.pieceQueries += fr.queries;
    st.pieceSolveQueries = fr.queries;
    st.pieceTouching = fr.touched;
    st.pieceDeferred = fr.deferred;
    // ⭐ half of STUCK: an input that pushed into a part; a free input clears it (no input: unchanged)
    if (fr.blocked !== null) st.pieceMoveBlocked = fr.blocked;
    if (!sameQ(fr.target, rig)) st.orbit.reset(fr.target.yaw, fr.target.v);
    if (fr.stopCoast) st.orbitInertia.stop();
    if (fr.relocated) {
      st.lastCollision = "orbit: the ring moved the piece into a part — moved to the nearest free place";
      st.lastCollisionAt = now;
    }
    st.orbitUserV = fr.userV;
    st.pieceQ = fr.q;
    rig = { ...fr.q };
    st.orbitRawPrev = { yaw: st.orbit.yaw, v: st.orbit.elevation };
    }
    st.pieceGuardFrameMs += performance.now() - t0;
  } else {
    // ⭐ the way in / out round a piece, or no piece in the world: the rings as they are
    st.pieceQ = null;
    st.pieceTouching = false;
    st.orbitRawPrev = null;
    st.orbitUserV = null;
  }
  // ⭐⭐ THE EYE: the orbit's critically damped SPRING toward `rig` — the SOLVED place (τ = boxSmoothMs / 2), per coordinate, so a finger's own
  // dy wobble is smoothed out. ⛔ (2026-10-13, *"the travel during orbit is extremely jittery"* → *"when the piece orbit anywhere … the piece
  // jitters, and so do the quads"*) the eye FOLLOWING THE SOLVER'S PATH was deleted the same day: the path holds every wobble of the finger, and
  // the piece shook with it (112 reversals on a headless drag where the spring had 0); and measured in the anchor's metres, a yaw near the waist
  // was spent in one frame. ⚠ The cost: on a slide the shown piece may cut a corner of the solved path for ~τ (sub-millimetre at contact speeds)
  st.boxSpring =
    st.boxSpring === null
      ? { at: rig, velYaw: 0, velV: 0, velLnZoom: 0 }
      : springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  st.boxOrbit = st.boxSpring.at;
  const bo = orbitOffset(st.cfg, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);
  // ⛔ The piece's own range (`clampPieceRadiusM`, 2026-10-09: its minimum ZERO, no longer the camera's near-plane guard): the clamp only shortens.
  const k = bo.radiusM > 1e-9 ? clampPieceRadiusM(bo.radiusM, st.cfg) / bo.radiusM : 1;
  // ⭐⭐ prototype (2026-10-06): orbiting AROUND THE PIECE (`piece_orbit.ts`), the piece is pushed along its frozen line through the
  // centre at the rings' distance (dy as fast as before; dx no longer moves it) — else on the rings as before
  // ⭐⭐ (2026-10-07) *"Smooth the movement of the camera at start and end of piece orbit"* — the travel the transitions read eases toward
  // the finger's on the orbit's own spring (`smoothTravel`, τ = `boxSmoothMs` / 2), every frame
  if (st.pieceEntry !== null) st.pieceEntry = smoothTravel(st.pieceEntry, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  if (st.pieceAim !== null) st.pieceAim = smoothTravel(st.pieceAim, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  if (st.centreReturn !== null) st.centreReturn = smoothTravel(st.centreReturn, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  // ⭐⭐ (2026-10-08) THE PIVOT HANDED OVER GRADUALLY: the piece carried round the gizmo by the share of the orbit's yaw LEFT of the way in
  // (`carryHeading`) — the camera turning round it with all of it (`entryCamera`)
  if (st.pieceEntry !== null) st.pieceEntry = carryHeading(st.pieceEntry, st.boxOrbit.yaw, cfg.pieceOrbitEnterMm);
  const po = st.pieceOrbit;
  // ⭐⭐ (2026-10-09) the way out's leftover also fades by the piece's progress toward the rings' closest point (`ringProgress`)
  if (st.centreReturn !== null) st.centreReturn = ringProgress(st.centreReturn, bo.radiusM * k, piecesClosestM(st));
  const cr = st.centreReturn;
  // ⭐ (2026-10-07) on the way back to the centre orbit, the piece's difference from the rings fades out (`returnPieceOffset`)
  const back: Vec3 = cr === null ? [0, 0, 0] : returnPieceOffset(cr, cfg.pieceOrbitReturnMm);
  // ⭐ (2026-10-08) on the way in, at its own heading round the gizmo (`carryHeading`) — the rings' radius and height as the orbit's
  const be = st.pieceEntry === null ? null : orbitOffset(st.cfg, st.pieceEntry.headingRad, st.boxOrbit.v, st.boxOrbit.zoom).offsetM;
  // ⭐ (2026-10-08) …plus what a way out cut short had left, fading out (`entryPieceOffset`)
  const eo: Vec3 = st.pieceEntry === null ? [0, 0, 0] : entryPieceOffset(st.pieceEntry, cfg.pieceOrbitEnterMm);
  // ⭐ (2026-10-13) the solver's cost on the HUD: a mean over ~30 frames and the PEAK of the last 2 s (a freeze shows there)
  st.pieceGuardMs += (st.pieceGuardFrameMs - st.pieceGuardMs) / 30;
  st.pieceGuardPeak = now - st.pieceGuardPeakAt > 2000 || st.pieceGuardFrameMs >= st.pieceGuardPeak ? (st.pieceGuardPeakAt = now, st.pieceGuardFrameMs) : st.pieceGuardPeak;
  // ⭐ (2026-10-14, the hover) the drawn hover offset following the solved one; the piece-only offset eased out once the orbit drops it
  hoverFrame(st, now, dtSec);
  hoverOffsetFrame(st, dtSec * 1000);
  wayInDrawFrame(st, dtSec * 1000); // ⭐ (2026-10-14) the way in drawn on the orbit's spring
  // ⭐ (2026-10-14, the hover's second audit) the centre as the hover left it THIS frame (`syncCentre` replaces it) — ⛔ read at the frame's top, the piece and the camera trailed a frame
  c = st.orbitCentreM;
  const hov = st.hoverOffset ?? [0, 0, 0];
  const pp: Vec3 =
    po !== null
      ? pushedPiece([c.x, c.y, c.z], po.dir, bo.radiusM * k)
      : be !== null
        ? [c.x + be[0] * k + eo[0], c.y + be[1] * k + eo[1], c.z + be[2] * k + eo[2]]
        : [c.x + bo.offsetM[0] * k + back[0] + hov[0], c.y + bo.offsetM[1] * k + back[1] + hov[1], c.z + bo.offsetM[2] * k + back[2] + hov[2]];
  // ⭐⭐ (2026-10-09) `pp` is the ANCHOR — where the resting face's centre goes; the mesh is placed from it at the frame's end
  // (`anchorFrame`); until then everything orbit-side reads the anchor
  // ⭐ (2026-10-13) how far the piece moved this frame (the yellow quad's check waits while it sweeps)
  st.pieceFrameStepM = st.pieceAnchor === null ? 0 : length(sub(pp, st.pieceAnchor));
  st.pieceAnchor = pp;
  if (st.bootRestAlign) bootRestAlign(st, pp); // ⭐ (2026-10-10) a spawn: aligned to the frozen body, now that the orbit placed it
  // ⭐⭐ (2026-10-14, *"Piece stays placed"*) captured onto its goal, the piece is the pull's, then stays — the orbit no longer places it
  if (!st.orbitPiecePlaced) box.position.set(pp[0], pp[1], pp[2]);
  const at = { yaw: st.boxOrbit.yaw, v: st.boxOrbit.v };
  // ⭐ The orbit finger, if one is down and orbiting: ticked (a still finger sends no event), and asked per axis.
  const out = st.router.outside();
  const objs = st.router.objects();
  // ⭐ prototype (green box): or ONE finger on a piece locked in its goal — its drag orbits too (`orbitDragStep`).
  const lockedHolder =
    out.length === 0 && objs.length === 1 && st.held.get(objs[0]!.id) !== undefined &&
    goalLocked(st.idOf.get(st.held.get(objs[0]!.id)!.mesh), st.goalCommit, st.cfg.lockPlacedPieces === 1);
  // ⭐⭐ (2026-10-11) the HELD SECOND TOUCH's input: the first touch orbits only on the way in / round the piece (`WAY`)
  const h = st.hold;
  const orbiting = h !== null
    ? (h.mode === "WAY" || h.mode === "HELD" ? h.first : null) // ⭐ (2026-10-11) undecided, it orbits the centre: the camera follows it
    : out.length === 1 && objs.length === 0
      ? out[0]!.id
      : lockedHolder
        ? objs[0]!.id
        : null;
  // ⭐ The finger leaving the orbit (lifted, or a second finger down) is a RELEASE: the camera realigns.
  const released = st.orbitMotion !== null && st.orbitMotion.pointerId !== orbiting;
  if (released) {
    st.orbitMotion = null;
    // ⭐ The finger lifted: the coast starts at the orbit's rate over the last moments of the drag — ⛔ (2026-10-11, *"no coasting; the orbit
    // simply waits for the re-press"*) not while the second touch is held
    if (st.hold === null) st.orbitInertia.release(now);
    else st.orbitInertia.stop();
  }
  let finger: { yaw: boolean; pitch: boolean; holdMs: number } | null = null;
  if (st.orbitMotion !== null) {
    st.orbitMotion.tracker.tick(now);
    // ⭐ (the fourth audit) the drag's own band ticked too: a silent pause re-rests it, so its wobble is filtered again (it was "once per drag")
    st.orbitMotion.band.tick(now);
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
  const off = pieceOrbitAngleOffset(st);
  // ⭐ …and the ZOOM scales the camera's distance behind the green piece (`cameraGapM`) — 1.00 the radius offset itself.
  const gapFull = cameraGapM(st.cfg.cameraRadiusOffsetMm / 1000, st.zoom);
  // ⭐⭐ prototype (2026-10-06): AROUND THE PIECE (`piece_orbit.ts`) — the camera at the rings' angles around the piece (`cameraOffset`'s,
  // dx yaw, dy pitch, the offsets), its distance the one it had, scaled as the piece comes in (`scaledGap`), looking at the piece; before it,
  // the WAY IN (2026-10-08) inside the centre orbit — the camera brought to that pose, its view from the gizmo to the piece.
  let camAt: Vec3;
  let lookAt: Vec3;
  if (po === null) {
    const o = cameraOffset(st.cfg, st.cameraLagged, [bo.offsetM[0] * k, bo.offsetM[1] * k, bo.offsetM[2] * k], off, gapFull);
    camAt = [c.x + o[0], c.y + o[1], c.z + o[2]];
    lookAt = [c.x, c.y, c.z];
    if (cr !== null) {
      // ⭐⭐ (2026-10-07) the way back: AROUND THE PIECE, its difference from this home pose (seen from the piece) fading out, its view
      // aimed at a point sliding from the piece to the centre — ONE progress, finger travel over `pieceOrbitReturnMm` (60 mm)
      const homeRel: Vec3 = [c.x + o[0] - pp[0], c.y + o[1] - pp[1], c.z + o[2] - pp[2]];
      camAt = returnCamera(cr, pp, homeRel, cfg.pieceOrbitReturnMm);
      const ax = returnLook(cr, camAt, pp, [c.x, c.y, c.z], cfg.pieceOrbitReturnMm);
      lookAt = [camAt[0] + ax[0], camAt[1] + ax[1], camAt[2] + ax[2]];
      if (returnProgress(cr, cfg.pieceOrbitReturnMm) >= 1) {
        st.centreReturn = null; // home: the centre orbit as it always was
        st.hudDirty = true;
      }
    }
    const pe = st.pieceEntry;
    if (pe !== null) {
      // ⭐⭐⭐ (2026-10-08) THE WAY IN: ONE progress, finger travel over `pieceOrbitEnterMm` — the camera round the piece at the rings' angles
      // (dx turning it round the piece), the piece carried round the gizmo by the share left (`carryHeading`): the pivot passes from the
      // gizmo to the piece GRADUALLY; its view from the gizmo to the piece — then the orbit around the piece starts, nothing changing
      const ring = anglesOf(cameraOffset(st.cfg, st.cameraLagged, [0, 0, 0], off, 1));
      // ⭐ (2026-10-10) its view re-aims to the piece by dx only (`aimProgress`), AND the camera's start shift round the piece (the camera
      // offsets seen from the piece) fades by it too — a pure dy leaves the piece where it was on the screen
      const aimT = st.pieceAim === null ? entryProgress(pe, cfg.pieceOrbitEnterMm) : aimProgress(st.pieceAim, cfg.pieceOrbitEnterMm);
      // ⭐ (2026-10-09) the zoom acts here too — the distance from the piece × the zoom now over the zoom at the start (`zoomScale`)
      camAt = entryCamera(pe, pp, ring, cfg.pieceOrbitEnterMm, clampGreenZoom(st.zoom), aimT);
      const ax = entryLook(pe, camAt, [c.x, c.y, c.z], pp, cfg.pieceOrbitEnterMm, aimT);
      lookAt = [camAt[0] + ax[0], camAt[1] + ax[1], camAt[2] + ax[2]];
      if (entryProgress(pe, cfg.pieceOrbitEnterMm) >= 1) {
        const out = orbitOffset(st.cfg, st.orbit.yaw, 0, 1).offsetM;
        const h = Math.hypot(out[0], out[2]) || 1;
        // ⭐ (2026-10-08) the end distance measured from HERE — the start of the orbit around the piece, not the tap
        const t = st.centreBlend.targetM;
        st.pieceOrbit = startPieceOrbit([c.x, c.y, c.z], pp, [out[0] / h, 0, out[2] / h], camAt, Math.hypot(pp[0] - t[0], pp[1] - t[1], pp[2] - t[2]), clampGreenZoom(st.zoom));
        st.pieceEntry = null;
        st.hudDirty = true;
      }
    }
  } else {
    const ring = anglesOf(cameraOffset(st.cfg, st.cameraLagged, [0, 0, 0], off, 1));
    // ⭐ (2026-10-09, *"why the zoom only works if the piece is inside the white sphere?"*) × the zoom now over the zoom at its start
    const gapPiece =
      scaledGap(po.gap0M, bo.radiusM * k, po.ring0M, ringDistanceRange((v) => orbitOffset(cfg, 0, v, GREEN_PIECE_ORBIT_ZOOM).radiusM).minM, cfg.pieceOrbitGapMinPct) *
      zoomScale(po.zoom0, clampGreenZoom(st.zoom));
    camAt = pieceCamera(pp, ring, gapPiece);
    lookAt = pp;
    // ⭐ (2026-10-10) …or, while the re-aim (by dx) is not done, the way in's view carried on — nothing moves at the hand-over
    const aim = st.pieceAim;
    if (aim !== null) {
      const aimT = aimProgress(aim, cfg.pieceOrbitEnterMm);
      if (aimT >= 1) st.pieceAim = null;
      else {
        // ⭐ the camera with what is left of its start shift (`aimRing`), then the view as the way in's
        camAt = pieceCamera(pp, aimRing(aim.look, ring, aimT), gapPiece);
        const ax = entryLook(aim.look, camAt, [c.x, c.y, c.z], pp, cfg.pieceOrbitEnterMm, aimT);
        lookAt = [camAt[0] + ax[0], camAt[1] + ax[1], camAt[2] + ax[2]];
      }
    }
  }
  // ⭐⭐ prototype (2026-10-06): *"the gain shall be unique during the whole game, and computed based on the camera position dictated by
  // the sliders values"* — the yaw gain around the piece (`referenceYawGain`), RECOMPUTED ONLY when a slider it reads changes (the
  // offsets, the radius offset, the boot zoom, the gap's %, the rings) — never from the live camera. Read at each orbit drag's start.
  const gainKey = [cfg.cameraYawOffsetDeg, cfg.cameraPitchOffsetDeg, cfg.cameraRadiusOffsetMm, st.orbitStartZoom, cfg.pieceOrbitGapMinPct, cfg.cameraRadiusMaxM, cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM, cfg.orbitLowerRingOn, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM].join("|");
  if (gainKey !== st.pieceYawGainKey) {
    st.pieceYawGainKey = gainKey;
    const pv = st.playVolume;
    const centre: Vec3 = pv !== null ? [(pv.min[0] + pv.max[0]) / 2, c.y, (pv.min[2] + pv.max[2]) / 2] : [c.x, c.y, c.z];
    st.pieceYawGain = referenceYawGain({
      centre,
      ring: (y, v) => {
        const r = orbitOffset(cfg, y, v, GREEN_PIECE_ORBIT_ZOOM);
        const kk = r.radiusM > 1e-9 ? clampPieceRadiusM(r.radiusM, cfg) / r.radiusM : 1;
        return { offsetM: [r.offsetM[0] * kk, r.offsetM[1] * kk, r.offsetM[2] * kk], radiusM: r.radiusM * kk };
      },
      camOffset: (y, v, rel, g) => cameraOffset(cfg, { yaw: y, v }, rel, off, g),
      gapM: cameraGapM(cfg.cameraRadiusOffsetMm / 1000, st.orbitStartZoom),
      minPct: cfg.pieceOrbitGapMinPct,
      points: sweepPoints(st, centre),
    });
    st.hudDirty = true;
  }
  // ⭐⭐ (2026-10-14) toward the HOVER VIEW by its progress (the hover drag's travel in, the orbit's out)
  ({ camAt, lookAt } = hoverCameraBlend(st, camAt, lookAt));
  // ⭐ The owner: *"the camera looks at the yellow target (orbit center)"*.
  st.camera.setPosition(new Vector3(camAt[0], camAt[1], camAt[2]));
  st.camera.setTarget(new Vector3(lookAt[0], lookAt[1], lookAt[2]));
  // ⭐ prototype (green box): the green piece's distance to the YELLOW target (the marker — where the centre is going, not
  // the blend in progress), for the HUD's `green` line (the owner, 2026-10-02).
  const tgt = st.centreBlend.targetM;
  st.greenBoxDistM = Math.hypot(box.position.x - tgt[0], box.position.y - tgt[1], box.position.z - tgt[2]);
  pinkRingFrame(st);
  if (!st.orbitPiecePlaced) {
    counterYawFrame(st);
    restAlignFrame(st, now);
    anchorFrame(st, now);
  }
  hoverVisualFrame(st, now); // ⭐ (2026-10-14) the contact shadow, the hosting face, the ready colour — ⭐ (2026-10-15, the Fable audit) BEFORE the contour reads its readiness
  restingFillFrame(st, now);
}

/**
 * ⭐⭐ (2026-10-09, *"I want the center of the resting position to be on the ring at the 0.09 m min distance … not the center of the
 * object"*) The piece placed so that its RESTING FACE'S CENTRE is at the anchor the orbit placed this frame (`placeByFaceCentre`), its
 * rotation as the frame left it — so the alignment and every roll pivot on that centre; plus a new face's jump fading out
 * (`anchorShift`). Last, after the sphere, the transitions and the turn.
 */
function anchorFrame(st: SceneState, now: number): void {
  const b = st.greenBox;
  const a = st.pieceAnchor;
  const p = st.orbitPieces.find((o) => o.mesh === b);
  if (b === null || a === null || p === undefined) return;
  const r = b.rotationQuaternion ?? Quaternion.Identity();
  const at = placeByFaceCentre(a, [r.w, r.x, r.y, r.z], p.restingCentre);
  const s = anchorShiftNow(st, now);
  // ⭐⭐ (2026-10-14, the hover's audit) the hover's drawn lag: the mesh only — the model is the solved place (`syncOrbitPieceModel` takes it off)
  const d = st.hoverDraw ?? [0, 0, 0];
  b.position.set(at[0] + s[0] + d[0], at[1] + s[1] + d[1], at[2] + s[2] + d[2]);
}

/** ⭐ A new resting face's jump still left (`anchorShift`), eased out over the alignment's turn (`REST_ALIGN_MS`); cleared once gone. */
function anchorShiftNow(st: SceneState, now: number): Vec3 {
  const sh = st.anchorShift;
  if (sh === null) return [0, 0, 0];
  const u = Math.min(1, Math.max(0, (now - sh.t0) / REST_ALIGN_MS));
  if (u >= 1) {
    st.anchorShift = null;
    return [0, 0, 0];
  }
  const left = 1 - u * u * (3 - 2 * u);
  return [sh.off[0] * left, sh.off[1] * left, sh.off[2] * left];
}

/** ⭐ (2026-10-13) the piece's anchor (its resting face's centre) on the rings at `o`, the piece's own distance clamp applied. */
export function ringAnchorAt(st: SceneState, o: OrbitQ): Vec3 {
  const c = st.orbitCentreM;
  const off = orbitOffset(st.cfg, o.yaw, o.v, o.zoom);
  const k = off.radiusM > 1e-9 ? clampPieceRadiusM(off.radiusM, st.cfg) / off.radiusM : 1;
  // ⭐ (2026-10-14, the hover) the piece-only offset (`hoverGizmoMove` 0) rides with it until the orbit drops it
  const h = st.hoverOffset ?? [0, 0, 0];
  return [c.x + off.offsetM[0] * k + h[0], c.y + off.offsetM[1] * k + h[1], c.z + off.offsetM[2] * k + h[2]];
}

/** ⭐ (2026-10-13) the orbited piece's mesh pose with its resting face's centre at `anchor`, turned `q` (else as it is). */
function pieceMeshAt(st: SceneState, anchor: Vec3, q?: Quat): { position: Vec3; orientation: Quat } | null {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined) return null;
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const o: Quat = q ?? [r.w, r.x, r.y, r.z];
  return { position: placeByFaceCentre(anchor, o, p.restingCentre), orientation: o };
}

/** ⭐ (2026-10-13, §12) how far the solver looks for a part (m): a gap larger than this reads as this — the advancement's longest stride. */
const LOOK_M = 0.3;
/** ⭐ (§12) the relocation's search: its stride along the ring and its reach (anchor metres). */
const RELOCATE_STEP_M = 0.01;
const RELOCATE_MAX_M = 0.4;
/** ⭐ (§12) the stuck probe: the anchor moved this far each way (m); one check of the round every this many ms (the second audit). */
const STUCK_PROBE_M = 0.003;
const STUCK_EVERY_MS = 100;

const sameQ = (a: OrbitQ, b: OrbitQ): boolean => Math.abs(a.yaw - b.yaw) + Math.abs(a.v - b.v) < 1e-12;
/**
 * ⭐⭐ (the third audit) THE SCENE AS THE COLLISION SEES IT — every body's position (0.1 mm) and orientation (1e-4), hashed (FNV-1a): the stuck
 * check's and the red quad's verdicts are re-judged when it changes. ⛔ It was a weighted sum of positions — blind to a part turned in place,
 * and able to cancel.
 */
export function sceneSignature(st: SceneState): string {
  return worldSignature(st.world);
}

/** ⭐ (§12) the shown piece has come to rest on its solved place (the spring has caught up). */
export const pieceShownAtRest = (st: SceneState, q: OrbitQ): boolean =>
  st.boxOrbit !== null && Math.abs(st.boxOrbit.yaw - q.yaw) + Math.abs(st.boxOrbit.v - q.v) < 1e-4;

/** ⭐ (§12) the solver's options from the tunables: the gap kept, in the WORLD (never the camera's), and the work cap. */
export function pieceSolveOptions(st: SceneState): SolveOptions {
  return { gapM: st.cfg.pieceGapMm / 1000, maxQueries: st.cfg.pieceSolverQueries };
}

/**
 * ⭐⭐ (2026-10-13, §12) — what the solver asks of the scene: the piece's anchor on the ring at `q`, its gap to the nearest part there
 * (`nearestObstacle`, the floor and the hidden piece exempt), and the contact normal against that part (`contactNormal`). The last pose asked
 * is remembered (the normal is asked right after the gap at the same place).
 */
export function pieceSolverEnv(st: SceneState, anchorOf: (q: OrbitQ) => Vec3 = (q) => ringAnchorAt(st, q), setup: CollisionSetup = pieceCollisionSetup(st)): SolverEnv {
  const b = st.greenBox!;
  let memo: { q: OrbitQ; world: World; gapM: number; blocker: ObjectId | null; secondGapM: number } | null = null;
  const at = (q: OrbitQ) => {
    if (memo !== null && sameQ(memo.q, q)) return memo;
    const pose = pieceMeshAt(st, anchorOf(q));
    const world = pose === null ? st.world : setWorldPlacement(st.world, b.name, pose);
    const n = nearestObstacle(world, b.name, setup, LOOK_M);
    memo = { q, world, gapM: n.gapM, blocker: n.blocker, secondGapM: n.secondGapM };
    return memo;
  };
  return {
    anchor: anchorOf,
    gap: (q) => at(q).gapM,
    secondGap: (q) => at(q).secondGapM,
    normal: (q) => {
      const m = at(q);
      return m.blocker === null ? null : contactNormal(m.world, b.name, m.blocker, setup);
    },
  };
}

/**
 * ⭐⭐ (2026-10-13, the owner: *"the red message shall appear if all delta position and quad rotations are blocked"*; §12) — is EVERY move of
 * the piece blocked? Its position: the SOLVER's own answer (`stuckProbe`: a small step each way along both ring coordinates). Its turns: every
 * direction's quad tap (aligned to it, or its roll when already aligned there), by the same gap rule (`pieceTurnBlocker`). Asked once the
 * input was blocked (or the piece is inside the margin) and the shown piece has caught up: ONE check every `STUCK_EVERY_MS`, in turn
 * (`stuckNext`); a round's verdict holds for its key (§12ter, §12quater).
 */
export function pieceStuckFrame(st: SceneState): void {
  // ⭐ (the sixth audit) read and cleared FIRST — an early return below left it stale for a later frame
  const quadRan = st.quadCheckRan;
  st.quadCheckRan = false;
  const b = st.greenBox;
  const q = st.pieceQ;
  if (b === null || q === null || st.orbitPiecePlaced || worldPlacementOf(st.world, b.name) === null) {
    st.pieceStuck = STUCK_FRESH;
    return;
  }
  // ⭐⭐ (the fifth audit) the shown piece still easing: no check this frame — and the verdict KEPT unless the solved anchor really moved
  if (!pieceShownAtRest(st, q)) {
    if (!stuckKeep(st.pieceStuck.anchor, ringAnchorAt(st, q), STUCK_PROBE_M)) st.pieceStuck = STUCK_FRESH;
    return;
  }
  // ⭐ (the fifth audit) staggered: not on a frame the red quad's check already ran
  if (quadRan) return;
  const t0 = performance.now();
  const env = pieceSolverEnv(st);
  const opt = pieceSolveOptions(st);
  // ⭐ (2026-10-13, the second audit) INSIDE the margin (no free place within reach) is checked too, blocked input or not — it was silent
  const inside = env.gap(q) < opt.gapM / 2;
  st.pieceQueriesCarry += 1;
  // ⭐⭐ (the sixth audit) the gate decided in `input/` (`stuckGate`): a free wiggle step no longer resets an armed verdict that has not moved
  const armed = st.pieceStuck.position && st.pieceStuck.turns;
  if (stuckGate(st.pieceMoveBlocked, inside, armed, st.pieceStuck.anchor, ringAnchorAt(st, q), STUCK_PROBE_M) === "RESET") {
    st.pieceStuck = STUCK_FRESH;
    st.pieceGuardCarryMs += performance.now() - t0;
    return;
  }
  const r = b.rotationQuaternion;
  const c = st.centreBlend.targetM;
  const key = [q.yaw.toFixed(5), q.v.toFixed(5), r ? [r.w, r.x, r.y, r.z].map((x) => x.toFixed(4)).join(",") : "", c.map((x) => x.toFixed(4)).join(","), sceneSignature(st), st.restAligned, st.pinkTargetNormal?.join(",") ?? ""].join("|");
  const next = stuckNext(st.pieceStuck, key, t0, STUCK_EVERY_MS);
  st.pieceStuck = next.s;
  if (next.check !== null) {
    const k = next.check;
    let blocked: boolean;
    if (k === 0) {
      let n = 0;
      const counted: SolverEnv = { anchor: env.anchor, gap: (x) => (n++, env.gap(x)), normal: (x) => (n++, env.normal(x)) };
      blocked = stuckProbe(q, counted, opt, STUCK_PROBE_M);
      st.pieceQueriesCarry += n;
    }
    else {
      const aligned = st.restAligned && st.restRoll !== null ? st.pinkTargetNormal : null;
      const d = st.orientDirs[k - 1]!;
      const roll = aligned !== null && d.normal[0] * aligned[0] + d.normal[1] * aligned[1] + d.normal[2] * aligned[2] > 0.9998;
      const turn = restingPreview(st, d, roll);
      blocked = turn === null || pieceTurnBlocker(st, turn) !== null;
    }
    st.pieceStuck = stuckRecord(st.pieceStuck, k, blocked, 1 + st.orientDirs.length);
    // ⭐ (the fifth audit) armed: remember where — a nudge smaller than a quarter of the probe keeps the verdict
    // ⭐ (the sixth audit) re-anchored at every check that keeps it armed — a drift of nudges does not add up to a reset
    if (st.pieceStuck.position && st.pieceStuck.turns && blocked) st.pieceStuck = { ...st.pieceStuck, anchor: ringAnchorAt(st, q) };
    if (!(st.pieceStuck.position && st.pieceStuck.turns)) st.pieceStuck = { ...st.pieceStuck, anchor: null };
  }
  st.pieceGuardCarryMs += performance.now() - t0;
}

/**
 * ⭐⭐⭐ (2026-10-13, `COLLISION.md` §11, §12) — WHAT BLOCKS the orbited piece's turn to `q` about its resting face's centre, the whole turn
 * swept by the gap rule (`turnSweep`, the slerp the alignment plays); `null` when it is free. Read before an align or a roll starts (refused when blocked) and for the
 * yellow quad (red while its tap's turn is blocked).
 */
export function pieceTurnBlocker(st: SceneState, q: Quat): string | null {
  const v = pieceTurnVerdict(st, q, Infinity);
  return v === "PENDING" ? "a part" : v;
}

/** ⭐ (the sixth audit) the turn's verdict under `budget` gap queries — `"PENDING"` when it ran out (the red quad asks again next frame). */
export function pieceTurnVerdict(st: SceneState, q: Quat, budget: number): string | null | "PENDING" {
  const b = st.greenBox;
  const p = st.orbitPieces.find((o) => o.mesh === b);
  if (b === null || p === undefined || worldPlacementOf(st.world, b.name) === null) return null;
  const a = st.pieceAnchor ?? [b.position.x, b.position.y, b.position.z];
  const r = b.rotationQuaternion ?? Quaternion.Identity();
  const from: Quat = [r.w, r.x, r.y, r.z];
  const d = Math.min(1, Math.abs(from[0] * q[0] + from[1] * q[1] + from[2] * q[2] + from[3] * q[3]));
  const setup = pieceCollisionSetup(st);
  let blocker: ObjectId | null = null;
  // ⭐⭐ (§12) the turn the alignment PLAYS (`restAlignFrame`: the slerp from the shown pose, about the anchor), swept by the gap
  const gapAtU = (u: number): number => {
    const pose = pieceMeshAt(st, a, qSlerp(from, q, u));
    if (pose === null) return LOOK_M;
    const n = nearestObstacle(setWorldPlacement(st.world, b.name, pose), b.name, setup, LOOK_M);
    blocker = n.blocker;
    return n.gapM;
  };
  const t0 = performance.now();
  const opt = pieceSolveOptions(st);
  let n = 0;
  const counted = (u: number): number => {
    n++;
    return gapAtU(u);
  };
  // ⭐ (2026-10-13, the second audit) under the frame's cap (it took ~61 gap queries at the gap kept), timed and counted for the HUD
  const u = turnSweep(counted, 2 * Math.acos(d), pieceReachM(p.mesh, p.restingCentre), opt.gapM, opt.maxQueries, Math.min(opt.maxQueries, budget));
  st.pieceGuardCarryMs += performance.now() - t0;
  st.pieceQueriesCarry += n;
  if (u === "PENDING") return "PENDING";
  return u === null ? null : (blocker ?? "a part");
}

/** ⭐ (§12) the furthest any point of the piece is from its resting face's centre (m) — its bounding box's corners, scaled. */
function pieceReachM(mesh: Mesh, centre: Vec3): number {
  const bb = mesh.getBoundingInfo().boundingBox;
  const sc = mesh.scaling;
  let best = 0;
  for (const c of bb.vectors) best = Math.max(best, Math.hypot(c.x * sc.x - centre[0], c.y * sc.y - centre[1], c.z * sc.z - centre[2]));
  return best;
}

/**
 * ⭐⭐ (restored 2026-10-13 for the yellow quad's check; it was the orientation window's preview) — the orientation the orbited piece WOULD
 * take, nothing moved: sitting against the direction `dir` (`alignRestingFace`'s turn), or, with `roll`, the next roll to the next axis
 * (`rollRestingFace`'s, from where a turn in flight is heading). `null` with nothing to turn to.
 */
export function restingPreview(st: SceneState, dir: OrientDirection, roll: boolean): Quat | null {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined || p.restingFace === null) return null;
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const shown: Quat = [r.w, r.x, r.y, r.z];
  if (roll) {
    const rr = st.restRoll;
    if (rr === null) return null;
    const from = st.restAlign?.base ?? shown;
    const cam = st.camera.position;
    const tg = st.camera.getTarget();
    let pinkAxes = rr.pinkAxes;
    if (pinkAxes.length === 0) {
      const right = st.camera.getDirection(new Vector3(1, 0, 0));
      pinkAxes = [[right.x, right.y, right.z]];
    }
    return nextCoupleRoll(from, p.restingFace.normal, p.restingFlush, pinkAxes, [tg.x - cam.x, tg.y - cam.y, tg.z - cam.z], 1)?.q ?? null;
  }
  const a = st.pieceAnchor;
  const pos: Vec3 = a ?? [p.mesh.position.x, p.mesh.position.y, p.mesh.position.z];
  const ends = dir.axes.map((x) => [sub(pos, scale(x, 0.05)), add(pos, scale(x, 0.05))] as const);
  return restAlignToFace(st.restAlign?.base ?? shown, pos, p.restingFace.normal, p.restingLong, dir.normal, { axes: dir.axes, ends }).q;
}

/** ⭐ The rings' closest distance to the orbit centre, as the piece rides them (its own minimum, zero, applied) — the waist. */
/** ⭐ (2026-10-14) the piece's distance range to the gizmo on the rings (their closest and farthest, the piece's own clamp applied), m. */
export function pieceRingRangeM(st: SceneState): { minM: number; maxM: number } {
  const r = ringDistanceRange((v) => orbitOffset(st.cfg, 0, v, GREEN_PIECE_ORBIT_ZOOM).radiusM);
  return { minM: clampPieceRadiusM(r.minM, st.cfg), maxM: clampPieceRadiusM(r.maxM, st.cfg) };
}

function piecesClosestM(st: SceneState): number {
  const m = ringDistanceRange((v) => orbitOffset(st.cfg, 0, v, GREEN_PIECE_ORBIT_ZOOM).radiusM).minM;
  return clampPieceRadiusM(m, st.cfg);
}


/** ⭐ The camera's yaw and pitch offsets (the CAMERA OFFSET sliders), radians. */
function pieceOrbitAngleOffset(st: SceneState): { yawRad: number; pitchRad: number } {
  return { yawRad: (st.cfg.cameraYawOffsetDeg * Math.PI) / 180, pitchRad: (st.cfg.cameraPitchOffsetDeg * Math.PI) / 180 };
}

/** ⭐ The scene points whose on-screen sweep sets the yaw gain around the piece: the play volume's eight corners and its centre — or, with
 * none, a 2 m cube about the orbit centre. */
function sweepPoints(st: SceneState, c: Vec3): Vec3[] {
  const pv = st.playVolume;
  const lo: Vec3 = pv !== null ? pv.min : [c[0] - 1, c[1] - 1, c[2] - 1];
  const hi: Vec3 = pv !== null ? pv.max : [c[0] + 1, c[1] + 1, c[2] + 1];
  const pts: Vec3[] = [[(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]];
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) pts.push([x, y, z]);
  return pts;
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
  // ⛔ (2026-10-11) no longer the pink face too (`1.0.59q-`'s *"that face IS the pink face"*): the boot pink face is the floor's the piece is
  // aligned to (`bootRestAlign`) — the orbit centre and the pink face are two separate things (the owner: *"changing the center of orbit and
  // selecting a new pink face are two separate actions, not linked together"*)
  return face === null ? null : [face.centre[0], face.centre[1], face.centre[2]];
}


/**
 * ⭐ prototype (green box): the gains the green piece's orbit drag runs at NOW — the inside-the-leash factors (`boxDragGains`). ⭐ ONE
 * home: the drag and the HUD read it. (The yaw share while held went with the rotation, 2026-10-04.)
 */
export function greenDragGains(st: SceneState): { yaw: number; pitch: number } {
  const g =
    st.boxOrbit === null || st.cameraOrbit === null
      ? { yaw: 1, pitch: 1 }
      : boxDragGains(st.cfg, st.boxOrbit, st.cameraOrbit.cam, (st.cfg.cameraLeashDeg * Math.PI) / 180, st.cfg.boxGainInsideLeash);
  return g;
}

const toBabylon = (q: Quat): Quaternion => new Quaternion(q[1], q[2], q[3], q[0]);

/**
 * ⭐⭐ (2026-10-12, §21) THE FACE FRAMES THE ORIENTATION CUBE IS BUILT FROM: every face of every SEATED part (placed in its goal — the last
 * commit's) and of every FROZEN body (the floor) — its outward normal and its edge-to-edge axes, in the world. ⛔ Never the orbited pieces.
 * ⚠ A later refinement (the owner): the non-seated parts too — read every frame, as they move.
 */
export function orientationFrames(st: SceneState): { readonly normal: Vec3; readonly axes: readonly Vec3[] }[] {
  const out: { normal: Vec3; axes: readonly Vec3[] }[] = [];
  const orbited = new Set(st.orbitPieces.map((o) => o.mesh.name));
  for (const [id, o] of st.world.objects) {
    if (orbited.has(id)) continue;
    if (o.frozen !== true && !st.goalCommit.has(id)) continue;
    for (const f of o.faces) {
      const g = faceGeometry(st, id, f.id);
      if (g !== null) out.push({ normal: g.normal, axes: g.flush });
    }
  }
  return out;
}

