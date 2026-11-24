/**
 * ⭐⭐⭐ prototype — **THE ORBIT AROUND THE ASSEMBLY, WIRED** (2026-10-28; the rules are `input/assembly_orbit.ts`'s). On while `orbitMode` is 0 (1: the
 * gizmo's 2D curve as built to 2026-10-25, kept whole). The centre the rest of the orbit reads (`orbitCentreM` — the quads, the hover, the markers) IS the
 * GIZMO, moved here every frame: ⭐⭐⭐ (2026-11-04, STEP 4c-bis) a FUNCTION of the orbit's angles — THE FACE MAP (`input/face_map.ts`: the angles' place on
 * the placed parts' box, the ray along the box face's axis onto the frontmost of the slide's coplanar regions, holes closed; `mapGizmo`) — ⛔ the carrier on
 * the sections' hull (2026-10-29 … Step 4c) deleted; the sections DRAWN from the same function (`sectionLinesFrame`). The piece's place from it (`placeOffset`,
 * read by `ringPlaceNow` — the solver's queries too) is its direction × the approach's distance; the approach (two fingers' dy, Shift + drag's) checked
 * against the parts (`approachMove`), with its own coast. The camera's frame (`assemblyCameraFrame`), its look point (`st.asmLook`: the centre far out, the
 * gizmo close in). ⛔ No rule here.
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { approachDistance, approachStep, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, offsetFrame, modelNormal, orbitDir, ORBIT_PITCH_MAX_RAD, pitchOfV, swayRay, unswayHit, vOfPitch, gizmoLag } from "../input/assembly_orbit";
import { gizmoJoins, insertIndex, joinsKnown, joinStep, LINE_REFINE_BUDGET, refineNow, refineStart, refineStep, sectionFixed, type RefineState } from "../input/section_hull";
import { blendThroughEdges, buildFaceMap, castPoint, mapAnglesStep, poleBeyondPitch, facetOfNormal, mapAngles, mapTarget, stackDepthAt, type FaceMap, type MapFace, type MapOpts, type MapTarget } from "../input/face_map";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { faceLift, pieceReach, placeAtAngles, shellAnchor, shellBox, type ShellBox } from "../input/orbit_shell";
import { footprintSupport, levelRaise, REST_SPARE_M, restRaise, supportLevelStep, supportTop } from "../input/footprint";
import { placeByFaceCentre } from "../core/resting_face";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import type { LineSample, SceneState } from "./scene_state";
import { faceTrianglesWorld } from "./contact_wiring";
import { calmHeading, calmLevelHeading, calmShown, calmStep as calmStepEase, calmTarget, cameraHeading, capEdgePitch, heldOffsetStep, poleWeight, type CalmKnobs, type CalmState } from "../input/orbit_calm";
import { askedCalm, calmInFrame, calmWorld, farReading, followTurnHoldsGizmo, levelledHeading, placeCrossings, type CalmAskTarget } from "../input/camera_follow";
import { CHART_MAP_OPTS, facetFrame } from "../input/face_map";
import { qRotate, type Vec3 } from "../core/vec";
import { faceWorld, worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { boxOf, rayMeetsBox, type Box3 } from "../input/ray_box";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { crossingHold, crossingPitch, distanceToFacets, fingerInFrame, fingerSwapped, SPIT_CROSSING_PITCH_RAD, spitCameraHeading, spitSide, zoneAt, type PolarZone } from "../input/polar_zone";
import { assignCharts, capTiltHeading, chartContour, chartZones, DEFAULT_CHART_OPTS, type ChartAssignment, type ChartFace } from "../input/orbit_charts";
import { holdAtCrossing, turnPose, type CamFrame, type CamPose, type EdgeHold } from "../input/orbit_tilt";
import { approachOutMm, bandShare } from "../input/picture";
import { poleCrossingDue, poleSeam } from "../input/pole_crossing";
import { gapStep, restShare } from "../input/roll_follow";
import { carriedHold, lawHalfTurn } from "../input/upright";
import { dirGap, easedDir, easeRest, poleYawKept, seamOutPaced, seamOutShare, seamOutStep, seamOutTarget, seamTurnPace, seamTurnStep, seamWholeRad, tiltLeavesNow, turnHoldsGizmo } from "../input/seam_turn";
import { bandedFacet } from "../input/face_band";
import { landingReadoutFrame, type ReadoutSource, mouthP2 } from "./landing_readout";
import { driveGizmoLanding, driveKey, driveStamp, driveSupport, landingDriveFrame } from "./landing_drive";
import { driveLevel } from "../core/landing_map";
import { contourFaceAt, crossingEvent, entryBlendHeading, entryDepth, entryEdgeOf, exitHoldSign, headingStep, pictureOffset, transportUp, viewLevelTurned, exitTurnRad, faceOwnUp, freeEdges, freeEntryHeading, freeHeadingAngle, isFreeFace } from "../input/free_face";
import { anglesOfDir, blendCrossed, blendShare, tiltPendingStep, capTilt, gizmoGlide, mouthHold, mouthHoldDomain, squareTurn, squareTurning, tiltCalmWholeHV, wholeShareStep, mulM, mulT, poleEdgeWhole, rollDurationMs, swingEase, tiltAutoLatch, frameBox, tiltDir, tiltFaces, onTiltedFacet, type Mat3 } from "../input/orbit_tilt";

/** ⭐ The look point's ease (ms). */
const LOOK_TAU_MS = 120;
/** ⭐ (Step 4c-bis) the ray along the facet's normal for the real surface, cast from this far outside the box (m). ⭐⭐⭐ (Step 5, D3) taken WHATEVER its
 * depth — over an empty slot its bottom (⛔ Step 4c-bis: refused beyond 25 mm of the region's plane, the gizmo across the slot's mouth). */
const MAP_OUT_M = 0.05;
/** ⭐ (Step 4c-bis) out of step after the slide: the map's angles close on the orbit's at 1 ± this of the orbit's step (`syncAngle`). */
const MAP_CATCH_UP = 0.5;
/** ⭐ (2026-11-05) over a bridged void a cast's hit counts only this far (m) in front of the facet's plane — a part rising out of it, not the plane's own rim. */
const MAP_BRIDGE_FRONT_M = 0.0005;

/** ⭐ Is the orbit the one around the assembly? */
export function assemblyOn(st: SceneState): boolean {
  return st.cfg.orbitMode === 0;
}

/**
 * ⭐⭐ (2026-11-14) THE PIECE ORBIT is on — a part in hand, around the assembly. ⛔ Not the SCENE ORBIT (no part in hand: the four rings, the centre
 * moved by a press): the owner, *"the approach with A + dy or finger zoom is not foreseen in the scene orbit"*, *"make sure the zoom with finger is
 * disabled in the scene orbit"* — the approach (A + dy, the pinch) runs only here (`SCENE_2_ASSEMBLY.md` §5 item 7).
 */
export function pieceOrbitOn(st: SceneState): boolean {
  return assemblyOn(st) && st.greenBox !== null;
}

/** ⭐ The placed parts' world bounding box, `null` with none. */
function placedBox(st: SceneState): { lo: Vec3; hi: Vec3 } | null {
  let lo: Vec3 | null = null;
  let hi: Vec3 | null = null;
  for (const [mesh, id] of st.idOf) {
    if (!goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1)) continue;
    const b = mesh.getBoundingInfo().boundingBox;
    const a = b.minimumWorld;
    const c = b.maximumWorld;
    lo = lo === null ? [a.x, a.y, a.z] : [Math.min(lo[0], a.x), Math.min(lo[1], a.y), Math.min(lo[2], a.z)];
    hi = hi === null ? [c.x, c.y, c.z] : [Math.max(hi[0], c.x), Math.max(hi[1], c.y), Math.max(hi[2], c.z)];
  }
  return lo === null || hi === null ? null : { lo, hi };
}

/**
 * ⭐ THE ASSEMBLY, once: its centre (the placed parts' box's — inside the assembly; fixed for the scene, the owner: *"put the center at the center inside the
 * assembly at boot and don't change it"*), its radius (half its largest dimension); and the boot's pitch the piece had on the rings.
 */
export function ensureAssembly(st: SceneState): void {
  if (st.asm !== null) return;
  const box = placedBox(st);
  const t = st.centreBlend.targetM;
  const centre: Vec3 = box === null ? [t[0], t[1], t[2]] : [(box.lo[0] + box.hi[0]) / 2, (box.lo[1] + box.hi[1]) / 2, (box.lo[2] + box.hi[2]) / 2];
  const radius = box === null ? 0.5 : Math.max(box.hi[0] - box.lo[0], box.hi[1] - box.lo[1], box.hi[2] - box.lo[2]) / 2;
  st.asm = { centre, radius };
  // ⭐ the piece at the pitch it had on the rings at the boot (its ring place's elevation from the gizmo)
  const p = rigPlace(st.cfg, st.rigTo, st.orbit.yaw, st.orbit.elevation, 1);
  const n = Math.hypot(p[0], p[1], p[2]);
  if (n > 1e-9) st.orbit.reset(st.orbit.yaw, vOfPitch(Math.asin(p[1] / n)));
  st.asmGizmo = null;
  st.asmLook = null;
  st.asmG = null;
}

/** ⭐ The orbit's state a held part starts from (`orbitStateStart`). */
type OrbitStateStart = Pick<
  SceneState,
  | "asmGizmo" | "asmSupport" | "asmSupportLevel" | "pieceHold" | "pieceHoldPrev" | "asmLook" | "asmFacePoint" | "asmG" | "asmPrevQ" | "asmShown" | "asmFaceBand" | "asmFree" | "asmPlaceWas" | "asmMapQ"
  | "asmEdgeHold" | "asmZone" | "asmZoneMix" | "asmChange" | "asmPieceDrawn" | "asmDirEase" | "asmCamLogic" | "asmCamDrawn" | "asmRollShadow" | "asmSpitSide" | "asmSpitU" | "asmSpitPic" | "asmSpitPicWas" | "asmZoneAlpha" | "asmDySign" | "asmFingerDxMm" | "asmDxSign" | "asmCarriedYaw" | "asmHeadO"
  | "asmHeadW" | "asmHeadYaw" | "asmTilt" | "asmGOff" | "asmTiltAuto" | "asmTiltPending" | "asmOrbitMm" | "asmFrameMm" | "asmBlend" | "asmCalmWhole" | "asmCalmWholeV"
  | "asmSquare" | "asmCalm" | "asmMouth" | "asmRawPrev" | "asmGizmoAt" | "asmGizmoLag" | "asmAskCalm" | "asmAsk" | "asmAskLevel" | "asmAskCalmWas" | "asmAskLevelWas" | "asmJumpAt" | "asmJumpWas" | "asmFollow" | "asmPicture"
>;

/**
 * ⭐⭐⭐ (2026-11-15, `ORBIT_STATE_INVENTORY.md` F.2; the owner: *"this is not intended. Fix it."*) THE ORBIT'S STARTING STATE, ONE HOME — every HISTORY,
 * TRANSITION and VIEW field of the inventory's table A (their inner state with them: each composite starts `null` or as a fresh object), and the two
 * per-part results that start empty (`asmSupport`, `asmOrbitMm`). Read by the scene's creation and by the pick-up (`resetOrbitState`): a newly held part
 * starts as the first one did. ⛔ Not here: the GEOMETRY caches (each carries its key; `asm` is the pick's own, re-read by `ensureAssembly`), the RENDER
 * objects, `asmRestOff` (the approach's re-entrancy flag, false outside it), `pieceHoldCount` (the HUD's and the probes' running count).
 */
export function orbitStateStart(): OrbitStateStart {
  return {
    asmGizmo: null,
    asmSupport: null,
    asmSupportLevel: null,
    pieceHold: null,
    pieceHoldPrev: null,
    asmLook: null,
    asmFacePoint: null,
    asmG: null,
    asmPrevQ: null,
    asmShown: null,
    asmFaceBand: null,
    asmFree: null,
    asmPlaceWas: null,
    asmMapQ: null,
    asmEdgeHold: null,
    asmZone: null,
    asmZoneMix: null,
    asmChange: null,
    asmPieceDrawn: null,
    asmDirEase: null,
    asmCamLogic: null,
    asmCamDrawn: null,
    asmRollShadow: null,
    asmSpitSide: 0,
    asmSpitU: null,
    asmSpitPic: null,
    asmSpitPicWas: null,
    asmZoneAlpha: 0,
    asmDySign: 0,
    asmFingerDxMm: 0,
    asmDxSign: 0,
    asmCarriedYaw: null,
    asmHeadO: null,
    asmHeadW: 1,
    asmHeadYaw: null,
    asmTilt: null,
    asmGOff: null,
    asmTiltAuto: false,
    asmTiltPending: false,
    asmOrbitMm: 0,
    asmFrameMm: 0,
    asmBlend: null,
    asmCalmWhole: 0,
    asmCalmWholeV: 0,
    asmSquare: { n: null, target: null, q: 0 },
    asmCalm: null,
    asmMouth: null,
    asmRawPrev: null,
    asmGizmoAt: null,
    asmGizmoLag: null,
    asmAskCalm: null,
    asmAsk: null,
    asmAskLevel: null,
    asmAskCalmWas: null,
    asmAskLevelWas: null,
    asmJumpAt: null,
    asmJumpWas: null,
    asmFollow: null,
    asmPicture: null,
  };
}

/**
 * ⭐⭐⭐ (2026-11-15) THE ORBIT'S STATE BACK TO ITS START (`orbitStateStart`) — at the scene's creation and at each pick-up; and the gizmo's per-frame memo
 * cleared (`GIZMO_MEMO`: keyed by the frame and the angles only — a pick inside a frame would be served the last part's gizmo). ⛔ The tilt's and the
 * zone's id counters are never reset: an id reused would match a face map's cache key.
 */
export function resetOrbitState(st: SceneState): void {
  Object.assign(st, orbitStateStart());
  GIZMO_MEMO.delete(st);
}

interface GizmoHit {
  readonly point: Vec3;
  readonly normal: Vec3 | null;
  readonly host: string | null;
}

/**
 * ⭐⭐⭐ (2026-11-01) A pick on a placed part read on its MODEL pose (`unswayHit`) — ⛔ on the mesh as drawn, swayed by the orbit: the gizmo's face a few
 * degrees off, kept, and the quads' turn laid the resting face on it (the slide never latched).
 */
function modelHit(st: SceneState, mesh: AbstractMesh | null, point: Vec3, normal: Vec3 | null, localN: Vec3 | null = null): { point: Vec3; normal: Vec3 | null } {
  const id = mesh === null ? undefined : st.idOf.get(mesh);
  const pose = id === undefined ? null : worldPlacementOf(st.world, id);
  if (mesh === null || pose === null) return { point, normal };
  const p = mesh.absolutePosition;
  const r = mesh.absoluteRotationQuaternion;
  const at = unswayHit(point, normal, [p.x, p.y, p.z], [r.w, r.x, r.y, r.z], pose.position, pose.orientation);
  // the normal from the mesh's own local facet (`modelNormal`): exact whatever the sway did between the pick and now
  if (localN === null) return at;
  const s = mesh.absoluteScaling;
  return { point: at.point, normal: modelNormal(localN, [s.x, s.y, s.z], pose.orientation) };
}

/**
 * ⭐⭐⭐ (2026-11-04, Step 4c, the owner: *"make sure the orbit slide (the pieces translate the way the green box orbits) does not pollute the gizmo"*) — A RAY
 * CAST IN THE MODEL'S SPACE: against each placed part, the ray moved onto the part as drawn (`swayRay` — its sway, translation and turn, undone), the nearest
 * hit kept and brought back onto the part's model pose (`modelHit`). The gizmo, its drop and every section sample read the parts AT REST, whatever the orbit's
 * sway does to the meshes. ⛔ `pickWithRay` in the world, its hit only mapped back (2026-11-01): a part swayed across the ray was met — or missed — where it
 * was DRAWN.
 */
function modelCast(st: SceneState, origin: Vec3, dir: Vec3, length: number): GizmoHit | null {
  let best: { d: number; mesh: AbstractMesh; info: import("@babylonjs/core/Collisions/pickingInfo").PickingInfo } | null = null;
  for (const c of castParts(st)) {
    // ⭐⭐ (2026-11-04, the audit) the slab pre-reject in the MODEL's space: a part the ray misses is never tested (⛔ every placed mesh, every sample —
    // 6–25k mesh tests a drag frame)
    if (c.box !== null && !rayMeetsBox(origin, dir, length, c.box, CAST_BOX_MARGIN_M)) continue;
    let o = origin;
    let d = dir;
    if (c.pose !== null) {
      const m = swayRay(origin, dir, c.drawnAt, c.drawnQ, c.pose.position, c.pose.orientation);
      o = m.origin;
      d = m.dir;
    }
    CAST_RAY.origin.copyFromFloats(o[0], o[1], o[2]);
    CAST_RAY.direction.copyFromFloats(d[0], d[1], d[2]);
    CAST_RAY.length = length;
    const info = CAST_RAY.intersectsMesh(c.mesh, false);
    if (!info.hit || info.pickedPoint === null) continue;
    if (best === null || info.distance < best.d) best = { d: info.distance, mesh: c.mesh, info };
  }
  if (best === null) return null;
  const pp = best.info.pickedPoint!;
  const nn = best.info.getNormal(true);
  const ln = best.info.getNormal(false, false);
  const m = modelHit(st, best.mesh, [pp.x, pp.y, pp.z], nn ? [nn.x, nn.y, nn.z] : null, ln ? [ln.x, ln.y, ln.z] : null);
  return { point: m.point, normal: m.normal, host: st.idOf.get(best.mesh) ?? null };
}

/** ⭐ (2026-11-04, the audit) one scratch ray for every cast (⛔ a `Ray` and two `Vector3` per mesh per cast) */
const CAST_RAY = new Ray(new Vector3(), new Vector3(0, 0, 1), 1);
/** ⭐ the pre-reject's margin — a box grown 2 mm: a hit on its skin is never refused */
const CAST_BOX_MARGIN_M = 0.002;

type CastPart = NonNullable<SceneState["asmCast"]>["parts"][number];

/**
 * ⭐⭐ (2026-11-04, the audit) THE PARTS A CAST READS, ONCE A FRAME (`st.frames`, the world, the placed count): each placed mesh, its model pose, its drawn
 * place and turn (the sway) and its model-space box. ⛔ Read per mesh per cast: ~10 allocations and an ancestry walk, every sample.
 */
function castParts(st: SceneState): readonly CastPart[] {
  const c = st.asmCast;
  if (c !== null && c.frame === st.frames && c.world === st.world && c.count === st.goalCommit.count) return c.parts;
  const boxes = placedParts(st).boxes;
  const parts: CastPart[] = [];
  for (const [mesh, id] of st.idOf) {
    if (!goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) || !mesh.isPickable || !mesh.isEnabled()) continue;
    const p = mesh.absolutePosition;
    const r = mesh.absoluteRotationQuaternion;
    parts.push({ mesh, pose: worldPlacementOf(st.world, id), drawnAt: [p.x, p.y, p.z], drawnQ: [r.w, r.x, r.y, r.z], box: boxes.get(mesh) ?? null });
  }
  st.asmCast = { frame: st.frames, world: st.world, count: st.goalCommit.count, parts };
  return parts;
}

/** ⭐ The piece's direction at the orbit place (the calm's). */
function dirAt(st: SceneState, yaw: number, v: number): Vec3 {
  // ⭐⭐⭐ (2026-11-10, §9.4) the orbit's angles in its FRAME (the tilted pole's F, `dirFrame`), turned into the world here — the calm in F
  const R = dirFrame(st);
  const u = orbitDir(yaw, v);
  // ⭐⭐⭐ (2026-11-04, `1.0.95-`, the owner: *"i am referring to this calm behavior of commit 58d86ff… It shall stay"*) the piece and the camera on the SHOWN
  // direction — the orbit's angle calm in the middle of a face, whole at its edges (`calmDir`); the gizmo is still moved by the orbit's own `u`
  const s = tiltDir(R, calmDir(st, u));
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4c) THE SHOWN DIRECTION EASED after a change of frame: the new chart's
  // turned back by the rest of the gap to the one drawn before (`easedDir`), its share the camera turn's own (`asmZoneMix.k`; that turn over or replaced:
  // whole) — ONE place, for the piece, its solver and the foot alike
  const e = st.asmDirEase;
  if (e === null) return s;
  // ⭐⭐⭐ (2026-11-18, `FAST_ORBIT.md` §14 — FO3 S1, O3) no turn carries it (a change made free): its rest on its own clock (`own`)
  // ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB1) a change ASKED and not yet resolved (`asmChange`, law U): its share 0 — the direction drawn before it
  return easedDir(s, e, e.own !== undefined ? restShare(e.own, e.angle) : e.mix === st.asmZoneMix && st.asmZoneMix !== null ? st.asmZoneMix.k : st.asmChange !== null && e.mix === st.asmChange.tok ? 0 : 1);
}

/**
 * ⭐⭐⭐ (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §13 — F1) THE DIRECTION ASKED at the orbit's angles `yaw`, `v`: `dirAt`'s without its eases — the calm asked
 * (`asmAskCalm`: the target, not the eased state), no shown direction's ease after a change (`asmDirEase`), no square camera (far out its share is 0).
 * The follower's target (D-F6: one ease); recorded each frame (`asmAsk`).
 */
export function askedDir(st: SceneState, yaw: number, v: number): Vec3 {
  return tiltDir(dirFrame(st), calmShown(orbitDir(yaw, v), st.asmAskCalm));
}

/**
 * ⭐⭐⭐ (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §15 — H2) THE CALM'S LEVELLED READING at the orbit's angles `yaw`, `v` — the same calm asked as `askedDir`
 * (`asmAskCalm`), in the same frame (`dirFrame`): the follower's heading target far out (`levelledHeading`); `null`: carried. The MODEL's space.
 */
export function levelledAsked(st: SceneState, yaw: number, v: number): number | null {
  return levelledHeading(yaw, v, st.asmAskCalm, dirFrame(st), st.cfg.followPoleDeg);
}

/**
 * ⭐⭐⭐ (2026-11-21, `PICTURE_REBUILD.md` §4.7 R5 — `TOP_BOTTOM_STUDY.md` §3, §6) THE FAR TARGET'S TOP RULE AS DECIDED (D-H13 – D-H19): the one picture
 * (⛔ R6: `pictureOne`, `cameraFollower`, `followTop` deleted — always on). Else (`pictureFarTop` 0) H2 / H3 exactly.
 */
export function farTopDecided(st: SceneState): boolean {
  // ⭐⭐⭐ (2026-11-21 night, `PICTURE_REBUILD.md` §4.3a item 7 — R3-FIX) behind its own switch `pictureFarTop` (⭐ 1 by default since 2026-11-22, the owner's word; 0 before: R5's gates unfinished)
  return st.cfg.pictureFarTop === 1;
}

/**
 * ⭐⭐⭐ (R5, D-H19) THE FAR READING at the orbit's angles `yaw`, `v` for the calm asked `c` (in this frame's F, `dirFrame`): the band read on the ORBIT's
 * direction in the world (`st.orbit`, his finger's place — the follower's `orbit`). The MODEL's space.
 */
export function farAsked(st: SceneState, yaw: number, v: number, c: CalmState | null): number | null {
  const R = dirFrame(st);
  return farReading(yaw, v, c, R, st.cfg.followPoleDeg, tiltDir(R, orbitDir(st.orbit.yaw, st.orbit.elevation)));
}

/**
 * ⭐⭐⭐ (2026-11-22, `CAMERA_FOLLOWS_GIZMO.md` §19, D-H20) THE FAR READING WHERE THE GIZMO WILL WAIT: at the map's place shown (`asmShown` — the place F-3's
 * `seamRebase` sets every angle to when a far turn starts: its yaw, `vOfPitch(pitch)`), this frame's calm asked (`asmAskCalm`), the band read on the orbit's
 * direction AT that place (where the orbit stands after the rebase). `undefined`: no place shown (no rebase follows); `null`: carried. The MODEL's space.
 */
export function farAskedWhereHeld(st: SceneState): number | null | undefined {
  const sh = st.asmShown;
  if (sh === null) return undefined;
  const v = vOfPitch(sh.pitch);
  const R = dirFrame(st);
  return farReading(sh.yaw, v, st.asmAskCalm, R, st.cfg.followPoleDeg, tiltDir(R, orbitDir(sh.yaw, v)));
}

/**
 * ⭐⭐⭐ (R5, D-H15 — `TOP_BOTTOM_STUDY.md` §3 H-3) THE JUMP'S SECOND READING, at the rig's angles `yaw`, `v` beside the first (`farAsked` of this frame's
 * calm): LAST frame's calm asked, kept in the world, read in this frame's F at these angles (`asmAskLevelWas`) — then this frame's calm kept. Off the far
 * rule as decided: none kept. The MODEL's space.
 */
export function farJumpRead(st: SceneState, yaw: number, v: number): void {
  if (!farTopDecided(st)) {
    st.asmAskCalmWas = null;
    st.asmAskLevelWas = null;
    return;
  }
  const R = dirFrame(st);
  const was = st.asmAskCalmWas;
  st.asmAskLevelWas = was === null ? null : { psi: farAsked(st, yaw, v, calmInFrame(was.c, R)) };
  st.asmAskCalmWas = { c: calmWorld(st.asmAskCalm, R) };
}

/**
 * ⭐⭐⭐ (2026-11-22 evening, `CAMERA_FOLLOWS_GIZMO.md` §20, D-H23) THE CALM ASKED AT ANOTHER PLACE on the map — `calmTargets` ITSELF (one owner: the same
 * rule that builds the camera's calm, never a copy — the bounce's and the charts' report 1's lesson: one reference, decided once), run on a shallow copy of
 * the state with that place shown; its target and whole shares folded as `calmFrame` folds them (`askedCalm`). Nothing of `st` written.
 */
export function calmAskedAt(st: SceneState, place: { readonly t: MapTarget; readonly yaw: number; readonly pitch: number }): CalmState | null {
  const p: SceneState = { ...st, asmShown: place };
  const keep = calmAsked;
  calmAsked = null;
  calmTargets(p, 0);
  const c = calmAsked === null ? null : askedCalm(calmAsked, p.asmCalmWhole, p.asmCalmWholeV);
  calmAsked = keep;
  return c;
}

/** ⭐⭐⭐ (D-H23) the calm's SOURCE as a key — its normal (a side's facet, or the side a cap reads at its edge), or none (a cap with no side to read) */
function calmSourceKey(c: CalmState | null): string {
  return c === null ? "none" : `${c.n[0].toFixed(6)},${c.n[1].toFixed(6)},${c.n[2].toFixed(6)}`;
}

/** ⭐ (D-H23) the step's samples and halvings: a crossing placed to 1 / (6 × 256) of the step (≤ 0.02° at 26°) */
const FAR_JUMP_SAMPLES = 6;
const FAR_JUMP_BISECT = 8;

/**
 * ⭐⭐⭐ (2026-11-22 evening, `CAMERA_FOLLOWS_GIZMO.md` §20, D-H23 — `followJumpAtPlace`) THE FAR JUMP READ AT ONE PLACE, at the rig's angles `yaw`, `v`
 * (after `farJumpRead`): where the calm's SOURCE changed between last frame's place shown and this one, the crossing found on the map between the two
 * (`placeCrossings`), the calm asked of the source left and of the source entered built THERE (`calmAskedAt`), both read at THIS frame's angles
 * (`farAsked`) — `asmJumpAt`; the same source: `[]` (no jump — the share's ramp is the calm's own motion, the spring pays it); `null` (the jump as built):
 * the switch 0, off the far rule, no place kept, the map changed (a zone, a tilt), the tilt close in. Then this frame's place kept. The MODEL's space.
 */
export function farJumpAtRead(st: SceneState, yaw: number, v: number): void {
  if (!farTopDecided(st) || st.cfg.followJumpAtPlace !== 1) { st.asmJumpAt = null; st.asmJumpWas = null; return; }
  const sh = st.asmShown;
  const map = sh === null ? null : faceMapOf(st);
  const was = st.asmJumpWas;
  const key = calmSourceKey(st.asmAskCalm);
  st.asmJumpAt = null;
  if (sh !== null && map !== null && was !== null && was.map === map && st.asmTilt === null) {
    if (key === was.key) st.asmJumpAt = [];
    else {
      const o = mapOpts(st);
      const dY = Math.atan2(Math.sin(sh.yaw - was.yaw), Math.cos(sh.yaw - was.yaw));
      const dP = sh.pitch - was.pitch;
      const at = (s: number): { t: MapTarget; yaw: number; pitch: number } => {
        const y = was.yaw + s * dY;
        const q = was.pitch + s * dP;
        return { t: mapTarget(map, y, q, o), yaw: y, pitch: q };
      };
      const cross = placeCrossings((s) => calmSourceKey(calmAskedAt(st, at(s))), FAR_JUMP_SAMPLES, FAR_JUMP_BISECT);
      st.asmJumpAt = cross.map((x) => [farAsked(st, yaw, v, calmAskedAt(st, at(x.lo))), farAsked(st, yaw, v, calmAskedAt(st, at(x.hi)))] as const);
    }
  }
  st.asmJumpWas = sh === null || map === null ? null : { yaw: sh.yaw, pitch: sh.pitch, map, key };
}

/** ⭐⭐⭐ (H2) THE GIZMO'S FACET NORMAL in the world — the face map's facet at the map's place (`asmShown`), turned out of its frame; the MODEL's (never a drawn mesh). `null`: no place. */
export function gizmoFacetW(st: SceneState): Vec3 | null {
  const sh = st.asmShown;
  const fm = sh === null ? null : faceMapOf(st);
  const f = fm === null || sh === null ? undefined : fm.facets[sh.t.stack];
  return f === undefined ? null : tiltDir(mapFrame(st), f.n);
}

/** ⭐⭐⭐ (2026-11-15, §12 2.4c) the direction the piece is DRAWN along now (the spring's angles — `greenBoxFrame`'s `shownOffset`): a change of frame's start. */
function drawnDir(st: SceneState): Vec3 {
  const q = st.boxOrbit ?? st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  return dirAt(st, q.yaw, q.v);
}

/**
 * ⭐⭐⭐ (2026-11-15, §12 2.4c) THE ONE CAMERA TURN of a change of frame under the charts' layout, from the pose SHOWN (`asmZoneMix`, as a zone's switch
 * starts it; none before the first camera frame): `paced` — the automatic tilt made with the camera pending (its swing's pace, `seamTurnPace`).
 */
function seamTurnStart(st: SceneState, paced: boolean): void {
  st.asmZoneMix = st.asmCamLogic === null ? null : { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null, rule: 0, keep: null, done: 0, ...(paced ? { byMm: true } : {}) };
}

/**
 * ⭐⭐⭐ (2026-11-15, §12 2.4c, the auditor's find) THE WHOLE ANGLE A TURN'S CLOCK RUNS OVER: the camera's own (`rad`) or the piece's shown direction's
 * gap eased on it (`asmDirEase`, this turn's) added (`seamWholeRad`) — never the camera's alone (the gap's rest handed over in one frame). No ease
 * (always before the charts — the game before them deleted at step 2.5): the camera's, as ever.
 */
function turnWhole(st: SceneState, zm: NonNullable<SceneState["asmZoneMix"]>): number {
  const e = st.asmDirEase;
  return seamWholeRad(zm.rad, e !== null && e.mix === zm ? e.angle : 0);
}

/**
 * ⭐⭐⭐ (2026-11-15, §12 2.4c) ONE FRAME OF A PACED TURN (the automatic tilt's entry made pending — `byMm`), after the finger's travel is counted
 * (`asmBlend.mm`): held while the camera is pending, by the finger's travel while the blend runs, then by time (`seamTurnPace`, `seamTurnStep`); whole:
 * none. ⭐ Every other turn: `zoneStep`'s clock, as ever.
 */
function seamTurnFrame(st: SceneState, dtMs: number): void {
  const zm = st.asmZoneMix;
  if (zm === null || zm.byMm !== true) return;
  const bl = st.asmBlend;
  const pace = seamTurnPace(true, st.asmTiltPending, bl !== null);
  const r = seamTurnStep({ k: zm.k, done: zm.done, rad: turnWhole(st, zm), axisKnown: zm.axis !== null }, pace, bl === null ? 1 : blendShare(bl.mm, st.cfg.tiltBlendMm), dtMs, st.cfg.tiltRollDegS);
  zm.k = r.k;
  zm.done = r.done;
  if (zm.k >= 1) st.asmZoneMix = null;
}

/**
 * ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §8, step C3 — D-T1) THE WAY OUT OF CLOSE IN, BLENDED: the tilt left by distance (`seamOutPaced`) — the same
 * one turn from the pose shown (`seamTurnStart`, by time), carrying its progress (`out`): paced by the finger instead (`seamOutFrame`), the gizmo free.
 */
function seamOutStart(st: SceneState): void {
  seamTurnStart(st, false);
  if (st.asmZoneMix !== null) st.asmZoneMix.out = { p: 0, outMm: 0, orbitMm: 0 };
}

/** ⭐ A camera turn asked by a change of frame (`turnBegin`). */
interface TurnAsk {
  /** the way out of close in paced by the finger (`seamOutStart`) */
  readonly paced: boolean;
  /** the tilt's entry made pending (`seamTurnStart`'s `paced`) */
  readonly byMm: boolean;
  /** the direction drawn before the change (the piece's ease starts from it, `seamEase`), or the ease running carried onto the turn (`carry`) */
  readonly uWas: Vec3 | null;
  readonly carry: boolean;
  /** a tilt's turn (its kind stays) */
  readonly tilt: boolean;
  readonly stopCoast: boolean;
  /** the sign that crossed (`holdAtCrossing`); absent: the hold left as it is */
  readonly hold?: 1 | -1 | 0;
}

/**
 * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB1 — the rebuild) THE ONE PLACE A CHANGE OF FRAME STARTS ITS CAMERA TURN — every starter calls it (`crossTurn`,
 * `tiltOn`, `zoneSwitch`, `freeFaceFrame`; a source test): NOTHING is created here — the change is ASKED (`changeAsk`) and resolved ONCE at the camera's
 * stage (`changeApply`, from `changeResolve`), where its angle and the weights are known: the turn's angle is the logic's pose last frame to this frame's,
 * built only there. The coast stops (a change stops it, timed or not). ⛔ (2026-11-22, `PICTURE_REBUILD.md` §8.6 — R6) law U off (`uprightPicture` 0,
 * `freeTurnMaxDeg` 0: the turn created here, `seamEase`, `easeCarry`, the hold written here) deleted: the game no longer took it with the defaults.
 */
function turnBegin(st: SceneState, a: TurnAsk): void {
  changeAsk(st, a);
  if (a.stopCoast) st.orbitInertia.stop();
}

/**
 * ⭐⭐⭐ (RB1) A CHANGE ASKED under law U: the piece's shown direction's ease set NOW on the change's own clock (`tok`, its share 0 until resolved — the piece
 * drawn where it was), from the direction drawn before (`uWas`) or carried by its rest from the change asked before or the turn running (`carry`); a change
 * asked twice before the camera's stage: the later's kind, the earlier's hold unless the later has one.
 */
function changeAsk(st: SceneState, a: TurnAsk): void {
  const was = st.asmChange;
  const tok: object = {};
  const e = st.asmDirEase;
  if (a.uWas !== null) {
    const gap = st.asmCamLogic === null ? null : dirGap(a.uWas, drawnDir(st));
    st.asmDirEase = gap === null ? null : { axis: gap.axis, angle: gap.angle, mix: tok };
  } else if (a.carry && e !== null && e.own === undefined) {
    const k = was !== null && e.mix === was.tok ? 0 : st.asmZoneMix !== null && e.mix === st.asmZoneMix ? st.asmZoneMix.k : null;
    if (k !== null) {
      const rest = easeRest(e, k);
      st.asmDirEase = rest === null ? null : { axis: rest.axis, angle: rest.angle, mix: tok };
    }
  }
  const hold = a.hold !== undefined ? a.hold : was?.hold;
  st.asmChange = { tok, paced: a.paced, byMm: a.byMm, tilt: a.tilt, ...(hold !== undefined ? { hold } : {}) };
}

/** a token: the piece's shown direction's ease no turn carries (`asmDirEase.own`) */
const OWN_EASE: object = Object.freeze({ own: true });

/**
 * ⭐⭐⭐ (RB1) THE CHANGE ASKED, RESOLVED ONCE at the camera's stage (`rollPictureFrame`, law U), by `changeSeen`'s answer (`timed`): a timed turn from the pose
 * shown (the way out paced, the tilt's paced entry, a tilt's kind kept), the ease handed to it — or applied at once: no turn, nothing "turning" for any
 * reader, the ease on a clock of its own; `hold` the hold written (absent: left as it is). No camera frame yet: no turn.
 */
export function changeApply(st: SceneState, c: NonNullable<SceneState["asmChange"]>, timed: boolean, hold: EdgeHold | null | undefined): void {
  st.asmChange = null;
  const e = st.asmDirEase;
  const mine = e !== null && e.mix === c.tok;
  if (timed && st.asmCamLogic !== null) {
    if (c.paced) seamOutStart(st);
    else seamTurnStart(st, c.byMm);
    if (c.tilt && st.asmZoneMix !== null) st.asmZoneMix.tilt = true;
    if (mine) st.asmDirEase = st.asmZoneMix === null ? null : { axis: e.axis, angle: e.angle, mix: st.asmZoneMix };
  } else if (mine) st.asmDirEase = timed ? null : { axis: e.axis, angle: e.angle, mix: OWN_EASE, own: { gap: e.angle, speed: 0 } };
  if (hold !== undefined) st.asmEdgeHold = hold;
}

/**
 * ⭐⭐⭐ (step C3) THE WAY OUT'S FINGERS, counted ONLY WHILE ITS TURN IS ALIVE (`asmZoneMix.out`; none: nothing): the approach finger's travel outward
 * (`approachInput`), the orbit finger's (`orbitDragStep`) — mm on the glass.
 */
export function seamOutFeed(st: SceneState, outMm: number, orbitMm: number): void {
  const o = st.asmZoneMix?.out;
  if (o === undefined) return;
  o.outMm += outMm;
  o.orbitMm += orbitMm;
}

/**
 * ⭐⭐⭐ (step C3) ONE FRAME OF THE WAY OUT'S TURN: its target from the fingers' travels and whether any finger is down (`seamOutTarget`, the router's
 * pointers — none: the gesture over, the turn completes), the progress toward it at the tilts' one speed over the turn's whole angle (`seamOutStep`,
 * `turnWhole`), the share shown its smoothstep (`seamOutShare` — `zoneMixPose` and the piece's direction's ease read it); whole: none.
 */
function seamOutFrame(st: SceneState, dtMs: number): void {
  const zm = st.asmZoneMix;
  if (zm === null || zm.out === undefined) return;
  const o = zm.out;
  const whole = turnWhole(st, zm);
  const target = seamOutTarget(o.outMm, o.orbitMm, st.cfg.tiltOutBlendMm, st.cfg.tiltBlendMm, st.router.all().length > 0);
  o.p = seamOutStep(o.p, target, dtMs, whole, st.cfg.tiltRollDegS, zm.axis !== null);
  zm.k = seamOutShare(o.p);
  zm.done = zm.k * whole;
  if (o.p >= 1) st.asmZoneMix = null;
}

/** ⭐⭐⭐ (2026-11-10, §9.4) the orbit's DIRECTIONS' frame (F → world; ⛔ the press's swing deleted at step 2.5: the tilt's `map`) — `null`: the world's. */
export function dirFrame(st: SceneState): Mat3 | null {
  return st.asmTilt === null ? baseFrame(st) : st.asmTilt.map;
}

/**
 * ⭐⭐⭐ (2026-11-13, `POLAR_ZONES.md` §4.2) THE ORBIT'S BASE FRAME: the polar zone's F (F → world) while the orbit is in a zone whose axis is not the world's
 * vertical — `null`: the world's (no zone, or an upright zone on the vertical: the restriction alone, no frame).
 */
export function baseFrame(st: SceneState): Mat3 | null {
  const z = st.asmZone;
  if (z === null) return null;
  const R = z.zone.frame;
  return R[0][0] === 1 && R[1][1] === 1 && R[2][2] === 1 ? null : R;
}

/** ⭐⭐⭐ (§9.4) the face map's frame (F → world) — `null`: the world's. */
function mapFrame(st: SceneState): Mat3 | null {
  return st.asmTilt === null ? baseFrame(st) : st.asmTilt.map;
}

/**
 * ⭐⭐⭐ (58d86ff's `spanShownDir`, ported) THE PIECE'S SHOWN DIRECTION for the orbit's direction `u`: its angles off the gizmo's face's normal shown at the
 * eased shares (`st.asmCalm`) — ⭐⭐⭐ the SAME at every distance (the owner: *"modify the scope Q3: same calm at every distance"* — ⛔ 58d86ff's distance gate,
 * whole within 3.6 m and none from 5.4 m: an A + dy approach through it turned the piece's direction, the approach curved); faded only toward ±90° of pitch.
 */
function calmDir(st: SceneState, u: Vec3): Vec3 {
  // ⭐⭐⭐ (2026-11-09, §8 — F7b) the rule in `input/orbit_calm.ts` (`calmShown`): the eased facet's own frame, faded toward its poles
  const c = st.asmCalm;
  // ⭐⭐⭐ (2026-11-10, the owner's back-and-forth) …and by the calm's whole share by POSITION (`asmCalmWhole`): never eased, so never behind a fast finger
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) the vertical share alone toward a top / bottom edge (`asmCalmWholeV`)
  // ⛔ (2026-11-16, step 2.5) the roll back's share off a tilted facet (`asmTilt.k`) deleted with the roll back: the charts' one transition has none
  const kH = Math.max(0, st.asmCalmWhole);
  const kV = Math.max(0, st.asmCalmWhole, st.asmCalmWholeV);
  // ⭐ (2026-11-15, step 2.3) the fade by the pitch carried (`poleFade`; absent: no key, today's)
  const base =
    c !== null && (kH > 0 || kV > 0)
      ? calmShown(u, { n: c.n, sH: 1 - (1 - c.sH) * (1 - kH), sV: 1 - (1 - c.sV) * (1 - kV), wA: c.wA ?? 0, ...(c.poleFade !== undefined ? { poleFade: c.poleFade } : {}) })
      : calmShown(u, c);
  // ⭐⭐⭐ (2026-11-10, `1.0.120b-`) THE SQUARE CAMERA close in: the gizmo's face's normal (turned at one speed through every edge), over the calm by `q`
  const sq = st.asmSquare;
  if (sq.n === null || !(sq.q > 0)) return base;
  const m: Vec3 = [base[0] * (1 - sq.q) + sq.n[0] * sq.q, base[1] * (1 - sq.q) + sq.n[1] * sq.q, base[2] * (1 - sq.q) + sq.n[2] * sq.q];
  const l = Math.hypot(m[0], m[1], m[2]);
  return l > 1e-9 ? [m[0] / l, m[1] / l, m[2] / l] : base;
}

/**
 * ⭐⭐⭐ (2026-11-10, `1.0.120b-`) THE SQUARE CAMERA'S FRAME: its target the normal of the gizmo's face in the map's frame (a side facet, or the tilted one —
 * none over a cap of the world's frame: the automatic tilt comes next), its direction turned there at the tilts' one speed (`squareTurn`), its share in
 * with the automatic tilt (`q`, eased over 125 ms).
 */
function squareFrame(st: SceneState, dtMs: number): void {
  const sq = st.asmSquare;
  const sh = st.asmShown;
  const tl = st.asmTilt;
  // ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §3.4, step C4 — N1, `freeFaceSquare` 1) ON A SPIT'S FREE FACE THE CAMERA SQUARE TO IT at every distance:
  // the target the face's normal (the map's frame), the share whole by its own ease; off it, back. ⛔ With the switch 0 (N2): none
  const freeSq = st.cfg.freeFaceSquare === 1 && st.asmFree !== null ? st.asmFree.map.facets[st.asmFree.facet] : undefined;
  // ⭐⭐⭐ (2026-11-16, `ORBIT_CHARTS.md` §10.2, §12 2.4d) THE BANDED FACET (`asmFaceBand`, read once a frame in `assemblyFrame`):
  // the target its normal in the map's frame, its band (SIDE / cap) its `kind` — what `sh.t` gives on that facet (a place's band IS its facet's kind) —
  // ⛔ the place's own facet (`sh.t.normal`) unbanded: its noise across an edge flipped the target (measured, `Scene_1` close in: 20 flips, 600° of view;
  // deleted with the game before the charts, step 2.5). Set with every place shown (`assemblyFrame`; afresh where a change of frame re-reads the place:
  // `tiltOff`, `poleCross`); none: the target kept
  const fb = sh === null ? null : st.asmFaceBand;
  const bf = fb === null ? undefined : fb.map.facets[fb.facet];
  const onCapB = fb !== null && bf !== undefined && bf.kind !== "SIDE" && (tl === null || fb.facet !== tl.facet);
  sq.target = bf === undefined || onCapB ? sq.target : bf.n;
  if (freeSq !== undefined) sq.target = freeSq.n;
  if (sq.n === null) sq.n = sq.target;
  if (sq.n !== null) {
    const { t } = facetFrame(sq.n);
    sq.n = squareTurn(sq.n, sq.target, dtMs, st.cfg.tiltRollDegS, t);
  }
  // ⭐⭐⭐ (2026-11-11) pending: held (the camera keeps its orientation while the approach goes on); then by the finger's travel (`blendShare`), never by time
  if (st.asmTiltPending) return;
  if (st.asmTiltAuto && st.asmBlend !== null) sq.q = Math.max(sq.q, blendShare(st.asmBlend.mm, st.cfg.tiltBlendMm));
  else sq.q = wholeShareStep(sq.q, st.asmTiltAuto || freeSq !== undefined ? 1 : 0, dtMs, rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS));
}

/**
 * ⭐⭐⭐ (2026-11-04, `1.0.95-`) THE CALM's targets, each frame — ⭐⭐⭐ (Step 4c-bis) from the FACE MAP's place (`st.asmShown.t`): on a SIDE the side the yaw
 * is in (its axis — the calm's normal), the place across it in the box's span (dx's run) and its height in the placed parts' box (dy's run) — `edgeShare`
 * of each (58d86ff's); over a top / under a bottom the orbit's whole angle (58d86ff: a face too thin for two zones). ⭐ The shares and the normal EASED
 * toward them (`easeToward`, `easeNormal`).
 */
/** ⭐ (§8) The facets' normals just beyond the map's column at its two slice ends, at the map's pitch — the calm's frame there (`calmTarget`'s `across`). */
function acrossNormals(st: SceneState, map: FaceMap | null, sh: { readonly t: MapTarget; readonly pitch: number } | null): { lo: Vec3 | null; hi: Vec3 | null } | undefined {
  if (map === null || sh === null) return undefined;
  const col = map.columns[sh.t.side];
  if (col === undefined) return undefined;
  const o = mapOpts(st);
  const EPS = 1e-6;
  return { lo: mapTarget(map, col.mid - col.hw - EPS, sh.pitch, o).normal, hi: mapTarget(map, col.mid + col.hw + EPS, sh.pitch, o).normal };
}

/** ⭐⭐⭐ (F1) the calm's TARGET this frame as `calmTargets` hands it to the ease (`calmStep` below) — `calmFrame` clears it, then reads it once */
let calmAsked: CalmAskTarget | null = null;

/** ⭐⭐⭐ (F1) the calm's ease (`input/orbit_calm.ts`), its target kept for `calmFrame` (`calmAsked`) — the result unchanged */
function calmStep(prev: CalmState | null, tg: CalmAskTarget, dtMs: number): CalmState | null {
  calmAsked = tg;
  return calmStepEase(prev, tg, dtMs);
}

function calmFrame(st: SceneState, dtMs: number): void {
  // ⭐⭐⭐ (2026-11-10, the owner's shake at a crossing — the root: two time laws in one rig) the whole share's TARGET by position (`calmTargets`), the
  // share itself on the rig's own lag (`wholeShareStep`, `gizmoEaseMs` — the gizmo's, which the piece and the camera's look follow)
  const prev = st.asmCalmWhole;
  const prevV = st.asmCalmWholeV;
  calmAsked = null;
  calmTargets(st, dtMs);
  // ⭐⭐⭐ (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §13 — F1) THE CALM ASKED: this frame's target before its ease, the whole shares by position (before
  // `wholeShareStep`) folded in (`askedCalm`) — read by `askedDir` only; nothing drawn reads it
  st.asmAskCalm = calmAsked === null ? null : askedCalm(calmAsked, st.asmCalmWhole, st.asmCalmWholeV);
  squareFrame(st, dtMs);
  st.asmCalmWhole = wholeShareStep(prev, st.asmCalmWhole, dtMs, st.cfg.gizmoEaseMs);
  st.asmCalmWholeV = wholeShareStep(prevV, st.asmCalmWholeV, dtMs, st.cfg.gizmoEaseMs);
  // ⭐⭐⭐ (2026-11-13, `ORBIT_ANY_SHAPE.md` §9) the world camera's calm heading offset: the level reading's, HELD while the view looks down (`heldOffsetStep`)
  // — no roll at the zenith's hit, an even spin there by a dx; none under the tilted pole (its own frame)
  if (st.asmTilt !== null || baseFrame(st) !== null) {
    st.asmHeadO = null;
    st.asmHeadW = 1;
    st.asmHeadYaw = null;
    return;
  }
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  // ⭐⭐⭐ (2026-11-17, `LEVEL_FACE_ENTRY.md` §3, LF1 (A)) the level reading takes the square camera's share: close in the face's own heading
  const tgt = calmLevelHeading(q.yaw, st.asmCalm, st.asmCalmWhole, squareShareShown(st)) - q.yaw;
  const w = poleWeight(Math.sin(Math.abs(pitchOfV(q.v))));
  const dYaw = st.asmHeadYaw === null ? 0 : Math.atan2(Math.sin(q.yaw - st.asmHeadYaw), Math.cos(q.yaw - st.asmHeadYaw));
  st.asmHeadO = heldOffsetStep(st.asmHeadO, tgt, w, st.asmHeadW, dYaw);
  st.asmHeadW = w;
  st.asmHeadYaw = q.yaw;
}

/** ⭐⭐⭐ (2026-11-13, §9) the world camera's level heading at `yaw`: the held offset (`asmHeadO`), else the level reading now. */
function levelHeadingOf(st: SceneState, yaw: number): number {
  return st.asmHeadO !== null ? yaw + st.asmHeadO : calmLevelHeading(yaw, st.asmCalm, st.asmCalmWhole, squareShareShown(st));
}

/**
 * ⭐⭐⭐ (2026-11-17, `LEVEL_FACE_ENTRY.md` §3, LF1 (A)) the square camera's share AS SHOWN — the one `calmDir` blends the direction by (none without a
 * normal): what the level reading (`calmLevelHeading`) takes away from the calm's. Far out 0: the reading as before, to the bit.
 */
function squareShareShown(st: SceneState): number {
  const sq = st.asmSquare;
  return sq.n === null || !(sq.q > 0) ? 0 : sq.q;
}

/** ⭐ The calm's eased state (`st.asmCalm`) and its whole share's TARGET by position (left in `st.asmCalmWhole` for `calmFrame` to ease). */
function calmTargets(st: SceneState, dtMs: number): void {
  // ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — F7b) the rule in `input/orbit_calm.ts` (`calmTarget`, `calmStep`): every SIDE facet, slanted ones
  // included, in its own frame; the caps none
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §5.1, step 2.3; the only calm since step 2.5, 2026-11-16) THE CALM ON EVERY SIDE FACE: the shares continuous on a
  // narrow run (`edgeShareSmooth`), every side facet on its own run (step 2.4e), a polar zone's own facets (a fan's) calmed as any side facet, a side
  // facet's reading not faded by the pitch. ⛔ Deleted with the switches (`chartLayout`, `chartCalm`): the old calm — no calm on a polar
  // zone's own facets and whole toward them (`zoneFacetOf`), a vertical facet's share on the box's height (the bounce's rule), `edgeShare`'s step
  const sh = st.asmShown;
  const map = sh === null ? null : faceMapOf(st);
  const cfg = st.cfg;
  const tg = sh === null || map === null ? { n: null, sH: 1, sV: 1 } : calmTarget(sh.t, map.facets[sh.t.stack]!, calmKnobs(st), acrossNormals(st, map, sh));
  // ⭐⭐⭐ (2026-11-10, §9.4) on the TILTED facet every edge is a frame change: whole toward them over the calm's own edge zones (`tiltCalmWholeHV`) —
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) both shares toward an edge ACROSS, the vertical one alone toward a
  // `b` end (a turn about the edge's own line: the horizontal calm carried over — `shownDirAcross`)
  const tl = st.asmTilt;
  st.asmCalmWhole = 0;
  st.asmCalmWholeV = 0;
  if (tl !== null && sh !== null && map !== null && tg.n !== null && sh.t.stack === tl.facet) {
    const p = tiltCalmWholeHV(sh.t, map.facets[sh.t.stack]!, { zoneHPct: cfg.faceSpanZoneHPct, zoneMinHM: cfg.faceSpanZoneMinHCm / 100, zoneVPct: cfg.faceSpanZoneVPct, zoneMinVM: cfg.faceSpanZoneMinVCm / 100 });
    const pV = Math.max(p.h, p.v);
    // ⭐⭐⭐ (2026-11-15, step 2.3) a side facet's reading: no fade by the pitch
    st.asmCalm = calmStep(st.asmCalm, { n: tg.n, sH: 1 - (1 - tg.sH) * (1 - p.h), sV: 1 - (1 - tg.sV) * (1 - pV), wA: tg.wA, poleFade: false }, dtMs);
    // ⭐⭐⭐ (2026-11-10) the same share on the SHOWN direction too (by position — the eased state lags a fast finger); ⭐ at every distance (the owner's
    // shake: far out the 120 ms calm alone fell behind, then caught up on the cap)
    st.asmCalmWhole = p.h;
    st.asmCalmWholeV = pV;
    return;
  }
  // ⭐⭐⭐ (2026-11-10, the owner's back-and-forth) close in (the automatic tilt on), the world's frame: a side facet whose top / bottom borders a face holding a
  // pole is whole toward it by POSITION (`poleEdgeWhole`) — the crossing, and the tilt there, with the shown direction the orbit's own
  // ⭐⭐⭐ …and ON a face holding a pole (no calm there by rule): whole at once — ⛔ the eased state's stale share applied there for the one frame before the
  // automatic tilt (the piece thrown back 6°, then forth at the tilt: the owner's back-and-forth)
  // ⭐ at every distance (2026-11-10, the shake: close in only before — far out the eased calm fell behind the finger and caught up on the cap)
  // ⭐⭐⭐ (2026-11-11, the owner: *"the camera yaw exist when the yaw angle of the camera vs. vertical face is not the same at exit vs. entrance"*) ON A CAP:
  // the calm of the side it would be left by at the orbit's yaw (`capEdgePitch` — the side's facet at the cap's edge, its share and reading there), the
  // vertical share whole, and by the pitch as before (`poleWeight`) — one reading with the side's after the exit, whatever the entry. ⛔ The entry side's
  // calm KEPT, released by a dx and carried over the edge (432631d): the camera turned at every exit at another yaw against the face
  if (tl === null && sh !== null && sh.t.band !== "SIDE") {
    st.asmCalmWholeV = 1;
    const o = mapOpts(st);
    const pE = map === null ? null : capEdgePitch(sh.pitch, (p) => mapTarget(map, sh.yaw, p, o).band === "SIDE");
    if (map === null || pE === null) {
      st.asmCalm = calmStep(st.asmCalm, tg, dtMs);
      return;
    }
    const tS = mapTarget(map, sh.yaw, pE, o);
    const gS = calmTarget(tS, map.facets[tS.stack]!, calmKnobs(st), acrossNormals(st, map, { t: tS, pitch: pE }));
    st.asmCalm = calmStep(st.asmCalm, { n: gS.n, sH: gS.sH, sV: 1, wA: gS.wA }, dtMs);
    return;
  }
  if (tl === null && sh !== null && map !== null && sh.t.band === "SIDE") {
    const col = map.columns[sh.t.side];
    // ⭐⭐⭐ (2026-11-10) the VERTICAL share alone (the horizontal calm carried over the edge)
    // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 step 2.4e) toward BOTH of the facet's own ends: every side face alike — the eased share's target is whole
    // there, and the eased state lags a moving finger (⛔ the column's outer ends alone, deleted at step 2.5 with `wholeEnds`)
    if (col !== undefined && col.facets.indexOf(sh.t.stack) >= 0)
      st.asmCalmWholeV = poleEdgeWhole(sh.t.surface, map.facets[sh.t.stack]!, true, true, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100);
  }
  // ⭐⭐⭐ (2026-11-15, step 2.3) a side facet's reading (a normal): no fade by the pitch; a cap's none (`n` null)
  st.asmCalm = calmStep(st.asmCalm, tg.n !== null ? { ...tg, poleFade: false } : tg, dtMs);
}

/** ⭐ (2026-11-15, step 2.3) the calm's knobs from the sliders — both `calmTarget` calls */
function calmKnobs(st: SceneState): CalmKnobs {
  const cfg = st.cfg;
  return {
    shareH: cfg.faceSpanShareH,
    zoneHPct: cfg.faceSpanZoneHPct,
    zoneMinHM: cfg.faceSpanZoneMinHCm / 100,
    vOn: cfg.faceSpanShareVOn === 1,
    shareV: cfg.faceSpanShareV,
    zoneVPct: cfg.faceSpanZoneVPct,
    zoneMinVM: cfg.faceSpanZoneMinVCm / 100,
  };
}

/**
 * ⭐ The gizmo a query of the piece's place reads: this frame's (`st.asmG`, the face map's); none yet, the map's at the
 * orbit's angles.
 */
function gizmoFor(st: SceneState): Vec3 {
  if (st.asmG !== null) return st.asmG;
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const m = mapGizmo(st, q.yaw, pitchOfV(q.v));
  if (m !== null) return withGOff(st, m.hit.point);
  const g = st.asmGizmo ?? st.centreBlend.targetM;
  return [g[0], g[1], g[2]];
}

/** ⭐⭐⭐ (2026-11-04, Step 2) The shell's box (`input/orbit_shell.ts`) — the placed parts' extent, per placed set. */
function shellOf(st: SceneState): ShellBox | null {
  const parts = placedParts(st);
  if (st.asmShell !== null && st.asmShell.key === parts.key) return st.asmShell.box;
  const box = shellBox(parts.parts);
  st.asmShell = { key: parts.key, box };
  return box;
}

/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 2) THE GIZMO'S FOOT (`shellAnchor`) — the orbit's centre the piece and the camera read: on the
 * smooth shell round the placed parts' box beyond `orbitShellOffsetMm`, onto the gizmo within it. A protrusion, a recess, a notch moves the gizmo, never
 * the foot.
 */
function footOf(st: SceneState, g: Vec3, u: Vec3, d: number): Vec3 {
  // ⭐⭐⭐ (2026-11-12, CLOSE_IN_CONTACT.md §6) THE FOOTPRINT SUPPORT: the gizmo raised to the top of the part under the piece's whole footprint
  // (`levelRaise`) — off a proud part's edge the piece keeps its height until it has cleared it (⛔ it dropped with the gizmo, into the part: a wall)
  // ⭐⭐ its LEVEL as shown (`st.asmSupportLevel`: a drop eased, a rise at once) along the SURFACE's normal it was read on (the gizmo's face) — ⛔ along the
  // piece's direction (the calm's, 14° off a face): a support read on a slant, the approach run in against it, the raise lost as the direction turned — inside
  // ⭐⭐⭐ (2026-11-12, the slide's rebuild) a level applies ON THE FACE IT WAS READ ON only (`levelOn`) — ⛔ kept along another face's normal: the front's
  // level (−z) went on raising along −z with the gizmo already in the left notch toward the back — the piece held ~0.5 m in front of its gizmo for seconds,
  // then let go: 524 mm in a frame, through `Piece23` (the walk `close_top_I14`)
  const lv = levelOn(st.asmSupportLevel, st.gizmoNormal ?? null);
  const r = levelRaise(lv, g);
  const gs: Vec3 = r > 0 ? [g[0] + lv!.n[0] * r, g[1] + lv!.n[1] * r, g[2] + lv!.n[2] * r] : g;
  const f = shellAnchor(gs, u, d, st.cfg.orbitShellOffsetMm / 1000, shellOf(st), reachOf(st, u));
  // ⭐⭐⭐ (2026-11-12, the slide's rebuild) THE PIECE RESTS ON ITS SUPPORT (`restRaise`): its own lowest point along the support's normal kept the gap (and a
  // hair) above the support's level, whatever the shown direction does to its lift — ⛔ at a fixed approach a dx turned the direction and the piece sank onto
  // the face it was over (the channel's floor: 10 mm in 18 frames), scraped along it, and the relocation moved it (the teleport). Not for the approach's own
  // check (`asmRestOff`): the approach stops at the contact as before
  if (lv === null || st.asmRestOff) return f;
  const k = restRaise(lv, f, u, d, liftOf(st, lv.n), pieceSolveOptions(st).gapM + REST_SPARE_M);
  return k > 0 ? [f[0] + lv.n[0] * k, f[1] + lv.n[1] * k, f[2] + lv.n[2] * k] : f;
}


/**
 * ⭐⭐⭐ (2026-11-12, CLOSE_IN_CONTACT.md §6) EACH FRAME, BEFORE THE SOLVE: the piece's support chosen from where it IS (`footprintSupport`: the highest placed
 * part under its whole footprint along the gizmo's face normal, not above its bottom) — every query of the frame reads it fixed.
 */
/**
 * ⭐⭐⭐ (2026-11-13, the slide's rebuild) THE DRAWN PIECE RESTS ON ITS SUPPORT TOO: the drawn piece hangs along the orbit SPRING's direction, which lags the
 * solved one — the rest was made for the solved direction, so the drawn piece could sit a hair lower: into the heptagon's slanted face while the solved
 * place kept 2.8 mm (walked: `h_ridge`, `h_bottom`). The drawn anchor `pp` raised along the support's normal so its lowest point keeps the gap; none: as is.
 */
export function restDrawn(st: SceneState, pp: Vec3): Vec3 {
  const lv = levelOn(st.asmSupportLevel, st.gizmoNormal ?? null);
  if (lv === null || st.asmRestOff) return pp;
  const k = restRaise(lv, pp, lv.n, 0, liftOf(st, lv.n), pieceSolveOptions(st).gapM + REST_SPARE_M);
  return k > 0 ? [pp[0] + lv.n[0] * k, pp[1] + lv.n[1] * k, pp[2] + lv.n[2] * k] : pp;
}

/** ⭐⭐⭐ (2026-11-12, the slide's rebuild) the support's level when it was read along the gizmo's face normal `n` (within ~2.6°), else none. */
function levelOn(lv: { readonly n: Vec3; readonly h: number } | null, n: Vec3 | null): { readonly n: Vec3; readonly h: number } | null {
  return lv !== null && n !== null && lv.n[0] * n[0] + lv.n[1] * n[1] + lv.n[2] * n[2] > 0.999 ? lv : null;
}
/** ⭐⭐ (2026-11-12, the slide's rebuild) the most frame time the support's drop eases by (ms): two frames at 60 fps. */
const SUPPORT_EASE_DT_MAX_MS = 33;
function supportFrame(st: SceneState, dtMs: number): void {
  const id = st.greenBox?.name;
  const local = id === undefined ? undefined : st.world.objects.get(id)?.shape?.points;
  const place = id === undefined ? null : worldPlacementOf(st.world, id);
  const rc = st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingCentre;
  if (local === undefined || place === null || rc === undefined || st.pieceQ === null || st.orbitPiecePlaced) {
    st.asmSupport = null;
    st.asmSupportLevel = null;
    return;
  }
  // ⭐⭐ at its SOLVED place (`pieceQ`, the level as last read) — ⛔ its drawn pose: on the spring's lag a high part read as under its bottom, the piece
  // raised by the whole lag (197 mm in a frame, the walks)
  const anchor = ringAnchorAt(st, st.pieceQ);
  const at = placeByFaceCentre(anchor, place.orientation, rc);
  const piece = local.map((p) => {
    const w = qRotate(place.orientation, p);
    return [at[0] + w[0], at[1] + w[1], at[2] + w[2]] as Vec3;
  });
  const parts = placedParts(st);
  // ⭐⭐ along the gizmo's FACE normal — the surface the piece rests over (none yet: no support)
  const u = st.gizmoNormal ?? null;
  if (u === null) {
    st.asmSupport = null;
    st.asmSupportLevel = null;
    return;
  }
  // ⭐⭐ only a part within the shell's offset under the piece (`orbitShellOffsetMm`: where the piece hangs from the gizmo itself) — far out, none
  // ⭐⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.3) read on P2 from the piece's reference (`landingDrives` ≥ 1) — the same rule as the gizmo's
  const win = st.cfg.orbitShellOffsetMm / 1000;
  const ps = supportOf(st, piece, anchor, parts, u, win);
  st.asmSupport = ps === null ? null : { key: parts.key, index: ps.index };
  // ⭐⭐ the level: the support's top; none — a level left by a support eases down to the gizmo's own (last frame's) and then clears; never one made from
  // the gizmo alone (⛔ it was: far out, with no support, the piece held at last frame's gizmo height whenever the gizmo went down — the walks)
  const g = st.asmG;
  const lv = st.asmSupportLevel;
  const gl = g !== null && lv !== null ? g[0] * u[0] + g[1] * u[1] + g[2] * u[2] : null;
  let target = ps !== null ? ps.top : gl !== null && lv!.h > gl + 1e-4 ? gl : null;
  const same = lv !== null && u[0] * lv.n[0] + u[1] * lv.n[1] + u[2] * lv.n[2] > 0.999;
  // ⭐⭐⭐ (2026-11-12, the slide's rebuild) A DROP WAITS FOR THE DRAWN PIECE TOO: the drawn piece lags the solved one (the orbit's spring) — dropped as soon as
  // the SOLVED footprint cleared a part, the drawn one, still over its edge, came down through its corner (walked: `Piece31` beside the channel, `Piece45`
  // on the front, 32 – 41 mm). The drawn footprint's support only HOLDS a drop (never above the level held: ⛔ read alone it raised the piece by the whole
  // lag, 197 mm in a frame — the trial's walks)
  if (target !== null && lv !== null && same && target < lv.h) {
    const drawn = local.map((p) => {
      const w = qRotate(place.orientation, p);
      return [place.position[0] + w[0], place.position[1] + w[1], place.position[2] + w[2]] as Vec3;
    });
    const rd = qRotate(place.orientation, rc);
    const js = supportOf(st, drawn, [place.position[0] + rd[0], place.position[1] + rd[1], place.position[2] + rd[2]], parts, u, win);
    if (js !== null) target = Math.min(lv.h, Math.max(target, js.top));
  }
  // ⭐⭐ (the rebuild) the drop's ease on at most 33 ms a frame — ⛔ the whole frame's time: at a low frame rate (the headless walks, ~200 ms) the τ = 40 ms ease
  // was one step, 41 mm in a frame
  const next = target === null ? null : { n: u, h: same ? supportLevelStep(lv!.h, target, Math.min(dtMs, SUPPORT_EASE_DT_MAX_MS)) : target };
  // ⭐⭐ (2026-11-12, the walk `vclose_top_front`: the piece came down INTO `Piece22`, the top's channel, and stayed — its footprint cleared the parts' visible
  // cores, not their contours, 1.5 mm out) A DROP ONLY WHERE THE PIECE FITS: a lowered level, or a level read on another face's normal (an edge crossed), is
  // asked of the solver's own gap at the piece's place (one query, in the frame's budget); not free at the gap kept — the support holds the piece where it is
  // (an open void it cannot enter is surface, §7)
  // ⭐⭐⭐ (2026-11-12, the slide's rebuild) on the SAME face only — another face's level is taken at once (⛔ refused there, the old face's level was kept,
  // and raised the piece along the old normal: held 0.5 m off its gizmo, then 524 mm in a frame); the ring's hold keeps the piece out of every part
  if (lv !== null && same && (next === null || next.h < lv.h) && st.pieceQ !== null) {
    st.asmSupportLevel = next;
    st.pieceQueries += 1; // ⭐ (F5) charged to this frame's ledger (reset just before `assemblyFrame`)
    if (pieceSolverEnv(st).gap(st.pieceQ) < pieceSolveOptions(st).gapM) {
      st.asmSupportLevel = lv;
      return;
    }
  }
  st.asmSupportLevel = next;
}

/**
 * ⭐⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.3) THE SUPPORT under the piece (its world points `piece`, its reference point `ref`) along `u`: P2
 * read from `ref` (`driveSupport`: the part first touched within the window, its level the contact's plane; a part above the piece a wall) — or, where
 * P2 does not drive or reads the piece inside a part, `footprintSupport` and the part's top as built. Its index in `parts` and its level.
 */
function supportOf(st: SceneState, piece: readonly Vec3[], ref: Vec3, parts: PlacedParts, u: Vec3, win: number): { readonly index: number; readonly top: number } | null {
  const d = driveSupport(st, u, ref, win);
  if (d !== null && d.kind !== "today") return d.kind === "none" ? null : { index: parts.ids.indexOf(d.part), top: d.level };
  const i = footprintSupport(piece, parts.parts, u, undefined, win);
  return i === null ? null : { index: i, top: supportTop(parts.parts[i]!, u) };
}

/** ⭐⭐⭐ (2026-11-05) The piece's lift along `u` (`faceLift`): its hull past its resting face's centre toward the gizmo, at its pose; none: 0. */
function liftOf(st: SceneState, u: Vec3): number {
  const id = st.greenBox?.name;
  const pts = id === undefined ? undefined : st.world.objects.get(id)?.shape?.points;
  const place = id === undefined ? null : worldPlacementOf(st.world, id);
  const rc = st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingCentre;
  return pts === undefined || place === null || rc === undefined ? 0 : faceLift(pts, place.orientation, rc, u);
}

/** ⭐ The piece's reach toward the gizmo along `−u` (`pieceReach`, its hull at its pose); none: 0. */
function reachOf(st: SceneState, u: Vec3): number {
  const id = st.greenBox?.name;
  const pts = id === undefined ? undefined : st.world.objects.get(id)?.shape?.points;
  const place = id === undefined ? null : worldPlacementOf(st.world, id);
  return pts === undefined || place === null ? 0 : pieceReach(pts, place.orientation, u);
}

/**
 * ⭐ The placed parts' world vertices on their MODEL pose (each a convex body — a box, a frustum) and each mesh's model-space box, cached for the placed set
 * (they do not move). ⭐ (2026-11-04, the audit) the set's KEY read once a frame (`placedKey`) — ⛔ rebuilt (every mesh, sorted, joined) on every call:
 * ~1300 times a drag frame (every solver query's foot, every section sample). ⭐ (2026-11-22, S2 — `ORBIT_SURFACE_READOUT.md` §3) each body's part id
 * beside it (`ids`, parallel to `parts`, the same key): the readout's `ConvexPiece`s.
 */
function placedParts(st: SceneState): PlacedParts {
  const { key, meshes } = placedKey(st);
  if (st.asmParts !== null && st.asmParts.key === key) return st.asmParts;
  const parts: Vec3[][] = [];
  const ids: string[] = [];
  const boxes = new Map<AbstractMesh, Box3>();
  for (const m of meshes) {
    const pos = m.getVerticesData(VertexBuffer.PositionKind);
    if (pos === null) continue;
    const w = m.computeWorldMatrix(true);
    const seen = new Set<string>();
    const vs: Vec3[] = [];
    for (let i = 0; i + 2 < pos.length; i += 3) {
      const w0 = Vector3.TransformCoordinates(new Vector3(pos[i]!, pos[i + 1]!, pos[i + 2]!), w);
      // ⭐⭐⭐ (2026-11-01) on the part's MODEL pose (`modelHit`) — ⛔ cached from the swaying mesh, a hull read mid-sway stayed turned
      const v = modelHit(st, m, [w0.x, w0.y, w0.z], null).point;
      const k = `${v[0].toFixed(6)},${v[1].toFixed(6)},${v[2].toFixed(6)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      vs.push(v);
    }
    if (vs.length === 0) continue;
    parts.push(vs);
    ids.push(st.idOf.get(m) ?? m.name);
    const b = boxOf(vs);
    if (b !== null) boxes.set(m, b);
  }
  st.asmParts = { key, parts, ids, boxes };
  return st.asmParts;
}

type PlacedParts = NonNullable<SceneState["asmParts"]>;

/** ⭐ (2026-11-04, the audit) the placed set's key and meshes, once a frame (`st.frames`, the world, the placed count). */
function placedKey(st: SceneState): { readonly key: string; readonly meshes: readonly AbstractMesh[] } {
  const k = st.asmKey;
  if (k !== null && k.frame === st.frames && k.world === st.world && k.count === st.goalCommit.count) return k;
  const ids: string[] = [];
  const meshes: AbstractMesh[] = [];
  for (const [mesh, id] of st.idOf) {
    if (!goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) || !mesh.isEnabled()) continue;
    ids.push(`${id}/${mesh.name}`);
    meshes.push(mesh);
  }
  st.asmKey = { frame: st.frames, world: st.world, count: st.goalCommit.count, key: ids.sort().join("|"), meshes };
  return st.asmKey;
}

/**
 * ⭐⭐⭐ (2026-11-22, S2 — `ORBIT_SURFACE_READOUT.md` §3) WHAT THE READOUT READS FROM HERE (`render/landing_readout.ts`, which this file imports): the frame's
 * face map and its frame, the placed bodies on their model pose with their ids — each a cache already filled by the frame's gizmo (`rawGizmo`).
 */
const READOUT_SOURCE: ReadoutSource = {
  map: (st) => faceMapOf(st),
  frame: (st) => mapFrame(st),
  placed: (st) => placedParts(st),
};

/** ⭐ (2026-11-10) the face map's knobs: no slow stretch through an edge (the owner: *"remove it"*). */
const MAP_OPTS: MapOpts = { edgeMm: 0, edgeDeg: 0 };
/** ⭐⭐⭐ (Step 4c-bis) the face map's knobs: the slow stretch through an edge (mm on each face) and the yaw / pitch it is crossed in (deg). */
function mapOpts(st: SceneState): MapOpts {
  // ⛔ (2026-11-10, the owner: *"remove it"*) the slow stretch through an edge (and the blend it carried) deleted: the gizmo goes through an edge as the map
  // puts it (`faceEdgeSlideMm` / `faceEdgeSlideDeg`, 10 mm / 10° since 2026-11-04, gone)
  void st;
  return MAP_OPTS;
}

/**
 * ⭐⭐⭐ (Step 4c-bis) THE FACE MAP (`input/face_map.ts`) — the placed parts' faces on their MODEL pose (the slide's own: `faceWorld`,
 * `faceTrianglesWorld`), per placed set; `null` with no box. ⭐⭐⭐ (Step 5) on the FACES CONTOUR — its two knobs (D5) sliders, in the cache's key.
 */
function faceMapOf(st: SceneState): FaceMap | null {
  const R = mapFrame(st);
  if (R === null) return worldFaceMap(st);
  const parts = placedParts(st);
  const box = shellOf(st);
  if (box === null) return null;
  // ⭐⭐⭐ (2026-11-10, §9.4) under the tilted pole the map is BUILT IN F (`tiltFaces`, `tiltBox`): the pressed cap a side — cached per tilt
  // ⭐⭐⭐ (2026-11-13, POLAR_ZONES.md) …or in the polar zone's frame (`baseFrame`) — cached per zone switch
  const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}${st.asmTilt !== null ? `#T${st.asmTilt.id}` : `#Z${st.asmZone?.id ?? 0}`}`;
  if (st.asmFaceMap !== null && st.asmFaceMap.key === key) return st.asmFaceMap.map;
  // ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §16 — C2W, W7) in the parts' own box READ IN F (`frameBox`) — ⛔ the world box's corners turned (`tiltBox`,
  // the box of the game before the charts, deleted here at step 2.5): loose for a frame off the world's axes (a cap turned 30°)
  const map = buildFaceMap(tiltFaces(placedFaces(st), R), frameBox(box, R, parts.parts), { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare, ...CHART_MAP_OPTS });
  st.asmFaceMap = { key, map };
  return map;
}

/** ⭐⭐⭐ (§9.4) THE WORLD'S FACE MAP, whatever the frame (the press reads the cap there; the exit puts the map's angles there). */
function worldFaceMap(st: SceneState): FaceMap | null {
  const parts = placedParts(st);
  const box = shellOf(st);
  if (box === null) return null;
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §2.2 / §5.2, step 2.2) the charts' layout in the call (`CHART_MAP_OPTS`)
  const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}`;
  if (st.asmWorldMap !== null && st.asmWorldMap.key === key) return st.asmWorldMap.map;
  const map = buildFaceMap(placedFaces(st), box, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare, ...CHART_MAP_OPTS });
  st.asmWorldMap = { key, map };
  if (mapFrame(st) === null) st.asmFaceMap = { key, map };
  return map;
}

/**
 * ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §2.2 / §5.2, step 2.2) THE CHARTS' LAYOUT: both face maps built as the COLUMNS chart, the pole the shape's top /
 * bottom set and the pitch scale read from the faces' normals. ⛔ (2026-11-16, step 2.5) its switch (`chartLayout`) deleted with the maps as built before.
 */
// (2026-11-24, S7) its one home is now `input/face_map.ts` (`CHART_MAP_OPTS`): B5's reading of the face map offline builds it the same way

/** ⭐ The placed parts' faces on their model pose (the slide's own: `faceWorld`, `faceTrianglesWorld`), in the world. */
function placedFaces(st: SceneState): MapFace[] {
  const faces: MapFace[] = [];
  for (const [id, obj] of st.world.objects) {
    if (obj.orbited === true || obj.frozen === true || !goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1)) continue;
    const mesh = st.meshOf.get(id);
    if (mesh === undefined || !mesh.isEnabled()) continue;
    for (const f of obj.faces) {
      const w = faceWorld(st.world, id, f.id);
      const tris = faceTrianglesWorld(st, id, f.id);
      if (w === null || tris === null || tris.length === 0) continue;
      faces.push({ normal: w.normal, centre: w.centre, tris, part: id }); // ⭐⭐⭐ (2026-11-09, R1) the part: a glued face is not a surface
    }
  }
  return faces;
}

/**
 * ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §7) THE HELD PIECE'S FOOTPRINT — its two smallest sizes (m, its own box × its scale, any way round): an open
 * void narrower than it is surface (`stackDepthAt`). `undefined` with no piece held.
 */
function heldFoot(st: SceneState): readonly [number, number] | undefined {
  const m = st.greenBox;
  if (m === null) return undefined;
  const e = m.getBoundingInfo().boundingBox.extendSize;
  const s = m.absoluteScaling;
  const d = [2 * Math.abs(e.x * s.x), 2 * Math.abs(e.y * s.y), 2 * Math.abs(e.z * s.z)].sort((a, b) => a - b);
  return [d[0]!, d[1]!];
}

/**
 * ⭐⭐⭐ (2026-11-04, STEP 4c-bis) THE GIZMO FOR THE ORBIT'S ANGLES — no carrier, no state: the angles' place (`mapTarget`), the FRONTMOST closed region
 * there (`stackDepthAt`; none: the nearest group's plane, beside the real face); inside a region, the ray along the normal from outside the box
 * (`modelCast` — the parts at rest) for the real surface. The point keeps the place's two other coordinates EXACTLY: the green's and the red's planes, by
 * construction. ⭐⭐⭐ (Step 5) on the FACES CONTOUR — the facet's stack, its normal, its frame (`t`, `b`); ⭐⭐⭐ (D3) the ray's hit taken WHATEVER its depth:
 * over an empty slot (a hole the region closes) the gizmo at its BOTTOM — the region still chooses the face and keeps the gizmo continuous across the rim,
 * only the depth is the real one; a slot through the whole assembly (no hit): the region's plane. The piece and the camera ride the shell (Step 2).
 * ⭐⭐⭐ (2026-11-05, the owner) D3 AMENDED — a void CLOSED on the green's or the red's travel (`stackDepthAt`'s `bridged`): the gizmo straight through on
 * the facet's plane, the lines with it; a void open on both keeps its depth until the frame turn (Steps 6–7). ⭐⭐⭐ (2026-11-09, the owner) AGAIN: only
 * a closed void with NO floor under the point is bridged; one with a floor is `inside` here — the cast lands on its floor (the top's channel: the red along
 * its floor, the green down and across it) — unless the held piece cannot enter it.
 */
function rawGizmo(st: SceneState, yaw: number, pitch: number): MapGizmo | null {
  return driveGizmo(st, rawGizmoToday(st, yaw, pitch));
}

/**
 * ⭐⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.1) P2 DRIVES THE GIZMO'S DEPTH (`landingDrives` 2, `Scene_1`, a piece held): today's gizmo `here`
 * (the rule as built — its normal, host and mouth kept) put on the level P2 reads at its place from where the piece is (`driveLevel`: a landing less
 * the piece's reach — the contact; nothing → the facet's plane; a wall beside the piece → today's), the place's two other coordinates kept. In the
 * map's frame (a turn keeps the dot: the world's depth is the frame's level). Not driving: `here` itself.
 */
function driveGizmo(st: SceneState, here: MapGizmo | null): MapGizmo | null {
  if (here === null) return null;
  const R = mapFrame(st);
  const n = here.t.normal;
  const sf = here.t.surface;
  const d = driveGizmoLanding(st, R === null ? n : mulM(R, n), R === null ? sf : mulM(R, sf));
  if (d === null) return here;
  const level = (q: Vec3): number => q[0] * n[0] + q[1] * n[1] + q[2] * n[2];
  const today = level(here.hit.point);
  const to = driveLevel(d.landing, d.reach, level(sf), today);
  if (to === today) return here;
  const k = to - level(sf);
  const p: Vec3 = [sf[0] + n[0] * k, sf[1] + n[1] * k, sf[2] + n[2] * k];
  return { ...here, hit: { point: p, normal: here.hit.normal, host: here.hit.host } };
}

/** ⭐ (2026-11-23, S4) THE GIZMO AS BUILT — the rule below, before P2 drives it (`driveGizmo`); the readout's "today". */
function rawGizmoToday(st: SceneState, yaw: number, pitch: number): MapGizmo | null {
  const map = faceMapOf(st);
  if (map === null) return null;
  const t = mapTarget(map, yaw, pitch, mapOpts(st));
  const f = map.facets[t.stack]!;
  const n = t.normal;
  const sf = t.surface;
  const at = stackDepthAt(f, sf[0] * f.t[0] + sf[1] * f.t[1] + sf[2] * f.t[2], sf[0] * f.b[0] + sf[1] * f.b[1] + sf[2] * f.b[2], heldFoot(st));
  if (at === null) return { hit: { point: sf, normal: n, host: null }, t };
  const level = (q: Vec3): number => q[0] * n[0] + q[1] * n[1] + q[2] * n[2];
  // along the normal onto the group's plane — the place's two other coordinates kept
  const onto = (d: number): Vec3 => {
    const k = d - level(sf);
    return [sf[0] + n[0] * k, sf[1] + n[1] * k, sf[2] + n[2] * k];
  };
  const p = onto(at.depth);
  // ⭐⭐⭐ (2026-11-05) over a void closed on a travel (`at.bridged`): straight through on the facet's plane — the cast kept only for what stands IN FRONT of
  // it (a part rising out of the void), never for its bottom
  if (at.inside || at.bridged === true) {
    const b = map.box;
    const sup = (sg: 1 | -1): number => sg * (Math.max(sg * b.lo[0] * n[0], sg * b.hi[0] * n[0]) + Math.max(sg * b.lo[1] * n[1], sg * b.hi[1] * n[1]) + Math.max(sg * b.lo[2] * n[2], sg * b.hi[2] * n[2]));
    const out = sup(1) + MAP_OUT_M;
    // ⭐⭐⭐ (2026-11-09, R3 (c)) the ray from just inside the facet (`castPoint`) — never on its rim, in the neighbour's plane (a grazing ray, a 127 mm spike)
    const pc = castPoint(f, p);
    const o: Vec3 = [pc[0] + n[0] * (out - level(pc)), pc[1] + n[1] * (out - level(pc)), pc[2] + n[2] * (out - level(pc))];
    const h = frameCast(st, o, [-n[0], -n[1], -n[2]], out - sup(-1) + MAP_OUT_M);
    if (h !== null && (at.bridged !== true || level(h.point) > at.depth + MAP_BRIDGE_FRONT_M)) return { hit: { point: onto(level(h.point)), normal: h.normal ?? n, host: h.host }, t };
  }
  // ⭐⭐⭐ (2026-11-10, *"build b"*) a void's MOUTH (open up the facet): the plane's bridge, and which end it opens to (`mouthHold`)
  return at.mouth !== undefined ? { hit: { point: p, normal: n, host: null }, t, mouth: at.mouth } : { hit: { point: p, normal: n, host: null }, t };
}

/**
 * ⭐⭐⭐ (Step 4c-bis) THE GIZMO, THROUGH AN EDGE WITHOUT A JUMP: in an edge band, the facet's gizmo (`rawGizmo`) blended toward the next facet's first one —
 * ⭐ (Step 5) the rule in `input/face_map.ts` (`blendThroughEdges`, `edgeBlend`), vectored on a non-box contour. Its normal, host and place: the facet's own.
 */
export function mapGizmo(st: SceneState, yaw: number, pitch: number): MapGizmo | null {
  return gizmoOf(st, yaw, pitch, rawGizmo(st, yaw, pitch));
}

/** ⭐ A gizmo of the map: its hit (point, normal, host), its place (`t`), a void's mouth. */
type MapGizmo = { readonly hit: GizmoHit; readonly t: MapTarget; readonly mouth?: { readonly lo: boolean; readonly hi: boolean } };

/**
 * ⭐ `mapGizmo`'s body on `rawGizmo`'s result `here` (the edge blend, the map's frame) — ⭐ (2026-11-22, S2) split out so the frame's own call keeps
 * `rawGizmo`'s point for the readout (`landingReadoutFrame`: today's level, before the blend); the same operations in the same order, nothing else.
 */
function gizmoOf(st: SceneState, yaw: number, pitch: number, here: MapGizmo | null): MapGizmo | null {
  const map = faceMapOf(st);
  if (here === null || map === null) return null;
  const p = blendThroughEdges(map, yaw, pitch, mapOpts(st), here.hit.point, (y, q) => rawGizmo(st, y, q)?.hit.point ?? null, (q, nb, reach) => blendCast(st, q, nb, reach));
  // ⭐⭐⭐ (2026-11-10, §9.4) the map works in its frame; its point and normal are given in the WORLD (`t` stays the map's: the calm, the lines' angles)
  const R = mapFrame(st);
  const n = here.hit.normal;
  const mo = here.mouth === undefined ? {} : { mouth: here.mouth };
  if (R === null) return p === here.hit.point ? here : { hit: { point: p, normal: n, host: here.hit.host }, t: here.t, ...mo };
  return { hit: { point: mulM(R, p), normal: n === null ? null : mulM(R, n), host: here.hit.host }, t: here.t, ...mo };
}

/**
 * ⭐⭐⭐ (2026-11-05) A BLENDED PLACE'S DEPTH (`blendThroughEdges`' `cast`): the ray along the blended normal `nb` from `reach` in front of the place `q`
 * onto it (`modelCast` — the parts at rest); its hit, or none. Only a surface in front of `q` is met (the ray stops at it).
 */
function blendCast(st: SceneState, q: Vec3, nb: Vec3, reach: number): Vec3 | null {
  const h = frameCast(st, [q[0] + nb[0] * reach, q[1] + nb[1] * reach, q[2] + nb[2] * reach], [-nb[0], -nb[1], -nb[2]], reach);
  return h === null ? null : h.point;
}

/** ⭐⭐⭐ (2026-11-10, §9.4) A CAST IN THE MAP'S FRAME: the ray turned into the world (`modelCast` — the parts at rest), its hit turned back. */
function frameCast(st: SceneState, origin: Vec3, dir: Vec3, length: number): GizmoHit | null {
  const R = mapFrame(st);
  if (R === null) return modelCast(st, origin, dir, length);
  const h = modelCast(st, mulM(R, origin), mulM(R, dir), length);
  return h === null ? null : { point: mulT(R, h.point), normal: h.normal === null ? null : mulT(R, h.normal), host: h.host };
}

/**
 * ⭐⭐ THE PIECE'S PLACE from the orbit's centre (the shown gizmo) at an orbit place — `ringPlaceNow`'s in this mode, the solver's queries included: its
 * own gizmo for that direction + the direction × the approach's distance (`approach`: the state's by default).
 */
export function placeOffset(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const d = approachDistance(st.cfg, approach);
  // ⭐⭐⭐ (2026-11-04, Step 2) from the gizmo's FOOT on the shell — ⭐⭐⭐ (2026-11-05) the gizmo AT THESE ANGLES (`placeAtAngles`, `gizmoAtAngles`): ⛔ the
  // frame's gizmo, read from the last frame's angles — the solver's world moved with its own result (the back-and-forth on the phone)
  // ⭐⭐⭐ (2026-11-05) the piece's SUPPORT at the gizmo (`liftOf`, `faceLift`) — ⛔ its resting face's centre: round an edge the face went into the part
  const p = placeAtAngles({ yaw, v }, (q) => gizmoAtAngles(st, q.yaw, q.v), (q) => dirAt(st, q.yaw, q.v), (g, u, dd) => footOf(st, g, u, dd), d, (u) => liftOf(st, u));
  const c = st.orbitCentreM;
  return [p[0] - c.x, p[1] - c.y, p[2] - c.z];
}

/**
 * ⭐⭐⭐ (2026-11-05) THE GIZMO AT THE ORBIT'S ANGLES `yaw`, `v` (`mapGizmo`) — out of step after the slide by the frame's own lag (`st.asmMapQ` against
 * `st.asmPrevQ`, `syncAngle`); at the frame's own angles exactly the frame's gizmo (`st.asmG`). Memoised for the frame
 * (the solver asks the same angles several times).
 */
function gizmoAtAngles(st: SceneState, yaw: number, v: number): Vec3 {
  const q0 = st.asmPrevQ;
  const mq = st.asmMapQ;
  if (q0 === null || mq === null) return gizmoFor(st);
  if (yaw === q0.yaw && v === q0.v && st.asmG !== null) return st.asmG;
  let memo = GIZMO_MEMO.get(st);
  // ⭐⭐ (2026-11-23, S4 — §9bis 1) valid for one frame AND one snapshot of the drive (`driveStamp`: a query between frames read the stored one)
  if (memo === undefined || memo.frame !== st.frames || memo.drive !== driveStamp(st)) {
    memo = { frame: st.frames, drive: driveStamp(st), at: new Map() };
    GIZMO_MEMO.set(st, memo);
  }
  const key = `${yaw}|${v}`;
  const known = memo.at.get(key);
  if (known !== undefined) return known;
  const m = mapGizmo(st, yaw + Math.atan2(Math.sin(mq.yaw - q0.yaw), Math.cos(mq.yaw - q0.yaw)), pitchOfV(v) + (mq.pitch - pitchOfV(q0.v)));
  // ⭐⭐⭐ (2026-11-10, §9.4) the relocation's offset at EVERY angle the solver asks (⛔ at the frame's own only: a step in the ring under the solver)
  const g = m === null ? gizmoFor(st) : withGOff(st, m.hit.point);
  if (memo.at.size < 512) memo.at.set(key, g);
  return g;
}
const GIZMO_MEMO = new WeakMap<SceneState, { frame: number; drive: number; at: Map<string, Vec3> }>();

/** ⭐ The DRAWN piece's place from the shown gizmo: along its direction at the approach's distance (the gizmo's ease carries it — never a jump). */
export function shownOffset(st: SceneState, yaw: number, v: number): Vec3 {
  const u = dirAt(st, yaw, v);
  const d = approachDistance(st.cfg, st.approach) + liftOf(st, u);
  return [u[0] * d, u[1] * d, u[2] * d];
}

/**
 * ⭐ The gizmo face's edge margin (m): `gizmoEdgeMarginMm` in the WORLD — an edge is a place on the assembly, not on the glass (⛔ on the glass at the
 * camera's 7.5 m it was 26 cm: wider than the assembly's half — the face never switched).
 */
function edgeMarginM(st: SceneState): number {
  return st.cfg.gizmoEdgeMarginMm / 1000;
}

/**
 * ⭐⭐⭐ (2026-11-16, `ORBIT_CHARTS.md` §10.2, §12 2.4d) THE BANDED FACET under the gizmo, read once a frame at the map's place `t`
 * (`assemblyFrame`, where `asmShown` is set): the facet kept while the place is on it or within `edgeMarginM` of it (`bandedFacet`, `distanceToFacets` —
 * the map's own frame, the MODEL's coordinates: never a drawn mesh, a world matrix or the camera), else the place's. A reading of another map (a change
 * of frame, a seat) is none: taken afresh at the place's facet. The tilt's exit reads the same distance to the same facet with the same band (`tiltFrame`).
 */
function faceBandRead(st: SceneState, t: MapTarget): void {
  const map = faceMapOf(st);
  if (map === null) {
    st.asmFaceBand = null;
    return;
  }
  const b = st.asmFaceBand;
  const cur = b !== null && b.map === map ? b.facet : null;
  const d = cur === null || cur === t.stack ? 0 : distanceToFacets(map, [cur], t.surface);
  st.asmFaceBand = { map, facet: bandedFacet(cur, t.stack, d, edgeMarginM(st)) };
}

/**
 * ⭐⭐ EVERY FRAME (before the piece is placed): the lock, the gizmo (its point eased, its face by the edge rule — the quads follow), the centre the orbit
 * reads set to it, the look point eased; the approach's coast.
 */
export function assemblyFrame(st: SceneState, dtMs: number): void {
  // ⭐⭐⭐ (2026-11-12, F4) the elevation asked past a pole, read EVERY frame (never piled up while the assembly's orbit is off — a jump later)
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4b) consumed by a pole's crossing (`poleCross`): the map's step must not also push past the pole
  let beyondV = st.orbit.takeBeyond();
  // ⭐⭐⭐ (2026-11-18, `FAST_ORBIT.md` §14 — FO3 S1, O3) the piece's shown direction's rest on its own clock (a change made free), stepped before it is read
  const de = st.asmDirEase;
  if (de !== null && de.own !== undefined) {
    const r = gapStep(de.own, dtMs, st.cfg.rollFollowMs);
    st.asmDirEase = r.gap === 0 && r.speed === 0 ? null : { ...de, own: r };
  }
  // ⭐⭐⭐ (2026-11-18, ES) the spit's picture of the frame before (a free face's entry continues it); this frame's is set by the camera's frame
  st.asmSpitPicWas = st.asmSpitPic;
  st.asmSpitPic = null;
  // ⭐⭐⭐ (2026-11-12, §8) the dy hold released once the gizmo is deep enough in the face beyond — or the assembly's orbit off
  // ⭐⭐⭐ (2026-11-14) its release is the FINGER's (`edgeHoldFinger`, in the pointer's step) — here only with the assembly's orbit gone
  if (st.asmEdgeHold !== null && (!assemblyOn(st) || st.asmG === null)) st.asmEdgeHold = null;
  if (!assemblyOn(st) || st.greenBox === null) {
    if (st.asmZoneMesh !== null) st.asmZoneMesh.mesh.isVisible = false; // ⭐ (POLAR_ZONES.md) the zones' fuchsia with the assembly's orbit only
    st.asmHeadO = null; // ⭐ (2026-11-13, §9) read afresh when the assembly's orbit is back
    st.asmHeadW = 1;
    st.asmHeadYaw = null;
    return;
  }
  ensureAssembly(st);
  // ⭐⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.2, §9bis 1) P2 DRIVING: the held piece's sums and `F` (last frame's solved anchor) — FIRST, before
  // the coast, the support or anything that reads the gizmo, so every query of the frame reads one `F` (a new stamp: the gizmo's memo emptied)
  landingDriveFrame(st, READOUT_SOURCE);
  const a = st.asm!;
  // ⭐ the approach's coast — ⭐⭐ (2026-11-01) under the slide mode too: a flick out leaves it
  if (st.approachInertia.coasting) {
    const s = st.approachInertia.step(dtMs, st.cfg.boxSmoothMs * 4);
    approachMove(st, s.dV);
  }
  // ⭐⭐⭐ (2026-11-12, CLOSE_IN_CONTACT.md §6) the footprint support, from where the piece is — before anything reads the foot
  supportFrame(st, dtMs);
  // ⭐⭐⭐ (2026-11-10, §9.4) the tilted facet left last frame: the WORLD's frame from this one (`tiltOff` — the angles turned, the gizmo kept)
  if (st.asmTilt !== null && st.asmTilt.exit) tiltOff(st);
  // ⭐⭐⭐ (2026-11-13, POLAR_ZONES.md) the polar zone the gizmo is in (last frame's place, the exit's hysteresis): a change turns every angle into its frame
  zoneStep(st, dtMs);
  //  ⭐ (2026-11-14) the spit's side itself at the camera's place, in the camera stage (`spitStep`)
  if (spitZone(st) === null) {
    st.asmSpitSide = 0;
    st.asmSpitU = null;
  }
  zoneHighlightFrame(st);
  // ⭐⭐⭐ (2026-11-10, the owner: *"at close distance … it toggles on automatically therefore the tilt occurs each time the gizmo crosses a face's edge"*) —
  // within `tiltAutoM` of the gizmo (`tiltAutoLatch`, its hysteresis) the gizmo on a FACE HOLDING A POLE (the owner's term) tilts the orbit by itself
  // (`tiltOn`, last frame's place); the other faces need none (their lines square already); far out: the press only (⛔ 2026-11-15, the owner: *"cancel my
  // rule and remove the press action on the orbit"* — far out: none, the tilt close in only). ⚠ The tilt is a quarter turn: exact
  // for a LEVEL face holding a pole (the cube's); a slanted one (a horizontally extruded hexagon) is left short of square, a pole held by an edge never tilts
  // ⭐⭐⭐ (the owner: *"if the piece crosses the hysteresis threshold, the tilt automatically triggers on or off"*) out past it: a tilt under way turns off
  const autoWas = st.asmTiltAuto;
  st.asmTiltAuto = tiltAutoLatch(st.asmTiltAuto, approachDistance(st.cfg, st.approach), st.cfg.tiltAutoM);
  if (autoWas && !st.asmTiltAuto && st.asmTilt !== null && !st.asmTilt.off) {
    st.asmTilt.off = true;
    st.lastVerdict = "orbit: out past the automatic tilt's threshold — the tilt turns off";
  }
  // ⭐⭐⭐ (2026-11-10, the owner: *"with fast dy the transition … happens not at the edge but somewhere inside the horizontal face"*) ON THE CROSSING'S FRAME,
  // whatever the gizmo's eased offset — ⛔ `asmGOff === null` stood for "no frame change under way" until the glide of the depth (§9.8 – §9.9) set it at
  // every depth step: an edge with a step held the tilt back 125 ms a step, the orbit going on in the world's frame (probed: 43 mm onto the top). Not
  // needed: a tilt under way holds the gizmo (`tiltUnderWay`) and leaves only once whole (`tiltExits`); the gizmo SHOWN (`asmG`, its glide in it) is kept
  // ⭐⭐⭐ (2026-11-11, the owner: *"keep the camera orientation when the tilted-pole-orbit toggles on as long as the approach continue, then the camera blends
  // with the new alignment with the delta position mm when the orbit at close in starts"*) PENDING until the orbit's first millimetre (`tiltPendingStep`):
  // no tilt, the square camera's share held; then the BLEND by the finger's travel (`asmBlend`, `blendShare`) — every face
  const fingerMm = st.asmOrbitMm;
  st.asmOrbitMm = 0;
  st.asmFrameMm = fingerMm; // ⭐⭐⭐ (H3, F-2) this frame's finger travel: the follower turn's pace far out (`followFrame`)
  const pendWas = st.asmTiltPending;
  st.asmTiltPending = tiltPendingStep(pendWas, autoWas, st.asmTiltAuto, fingerMm);
  if (!st.asmTiltAuto) st.asmBlend = null;
  else if ((pendWas || !autoWas) && !st.asmTiltPending) st.asmBlend = { mm: 0, tiltId: null, target: null };
  if (st.asmBlend !== null) st.asmBlend.mm += fingerMm;
  // ⭐⭐⭐ (2026-11-11, the owner: *"the red-green sections automatically switches to orthogonal when the automatic tilted pole is toggled on but the camera
  // view waits"*) the tilt made at once — only the CAMERA pending (its swing, the square camera's share)
  // ⭐⭐⭐ (2026-11-14, the owner: *"a block … especially if there has been some dx during the travel and the gizmo arrives at the zenith edge at another
  // point"*) AT THE MAP'S POLE (its pitch at ±90°: a column run to a VIRTUAL pole — the heptagon's end cap at the ridge's end) the face holding that
  // pole is the CAP (`tiltOn`'s virtual pole, as at a void's mouth): the tilt made there. ⛔ The column's own face (the end cap, a side): no tilt, the
  // polar orbit at its limit — a dy up did nothing, for ever (the walks: 6 presses, the gizmo at the corner)
  const mqP = st.asmMapQ;
  const atPole = mqP === null || !(Math.abs(mqP.pitch) >= ORBIT_PITCH_MAX_RAD - 1e-9) ? null : mqP.pitch > 0;
  if (st.asmTiltAuto && st.asmTilt === null) tiltOn(st, st.asmMouth !== null ? st.asmMouth.hi : atPole);
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4b) A POLE HELD BY AN EDGE OR A POINT (gravity's chart's end: `Scene_0`'s ridge, an apex) CROSSED BY THE ONE
  // TRANSITION, close in, in the world's frame (`poleCrossingDue`: the map's angles at the pole, the finger asking beyond it) — the gizmo kept, the far
  // face's angles read there, every angle state set to them, one camera turn, the dy hold (`poleCross`); the beyond consumed. ⛔ Far out: the polar orbit's
  // limit (D-C6); a cap: the tilt's (above). Only after the tilt's making: a frame that tilted never crosses
  {
    const atl = atlasOf(st);
    const due = poleCrossingDue({
      tilted: st.asmTilt !== null,
      zoned: st.asmZone !== null,
      closeIn: st.asmTiltAuto,
      turning: st.asmZoneMix !== null,
      mouth: st.asmMouth !== null,
      atPole,
      shown: st.asmShown !== null && st.asmG !== null,
      beyondV,
      topKind: atl?.assign.gravity.top.kind ?? null,
      bottomKind: atl?.assign.gravity.bottom.kind ?? null,
    });
    if (due !== null && poleCross(st)) beyondV = 0;
  }
  // ⭐⭐⭐ (2026-11-15, §12 2.4c) the automatic tilt's ONE camera turn at its swing's pace (held while pending, by the finger's travel counted above, then by
  // time) — after the tilt's making, so a turn started this frame takes this frame's travel (as the swing did in `tiltFrame`)
  seamTurnFrame(st, dtMs);
  // ⭐⭐⭐ (2026-11-16, step C3) the way out of close in, paced by the fingers (`seamOutFrame` — a turn started by `seamOutStart` only)
  seamOutFrame(st, dtMs);
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const d = approachDistance(st.cfg, st.approach);
  // ⭐⭐⭐ (2026-11-04, STEP 4c-bis) THE GIZMO FROM THE FACE MAP at the orbit's angles (`mapGizmo`) — ⛔ the carrier on the sections' hulls, moved by the
  // angles' steps (2026-10-29 … Step 4c): it could wait, be held, drift and jump. The map's angles ARE the orbit's — out of step only after the slide (put
  // where the slide left the gizmo), then closing on the orbit's with its own steps (`syncAngle`: never against the finger, never a jump)
  const prev = st.asmPrevQ ?? q;
  st.asmPrevQ = { yaw: q.yaw, v: q.v };
  let hit: GizmoHit | null = null;
  {
    const pitch = pitchOfV(q.v);
    const m0 = st.asmMapQ ?? { yaw: q.yaw, pitch };
    // ⭐⭐⭐ (2026-11-09) the catch-up held where it alone would move the gizmo across a jump (`mapAnglesStep`) — the ring stays a function of the angles
    // ⭐⭐⭐ (2026-11-12, F4) the pitch the finger asked past a pole joins the map's step (`poleBeyondPitch`) — the face reached even with the orbit there
    const beyond = poleBeyondPitch(q.v, beyondV, ORBIT_PITCH_MAX_RAD);
    const mqs = mapAnglesStep(m0, { yaw: q.yaw, pitch }, { yaw: Math.atan2(Math.sin(q.yaw - prev.yaw), Math.cos(q.yaw - prev.yaw)), pitch: pitch - pitchOfV(prev.v) + beyond }, MAP_CATCH_UP, (y, p) => mapGizmo(st, y, p)?.hit.point ?? null);
    const mq = { yaw: mqs.yaw, pitch: Math.max(-ORBIT_PITCH_MAX_RAD, Math.min(ORBIT_PITCH_MAX_RAD, mqs.pitch)) };
    st.asmMapQ = mq;
    // ⭐⭐⭐ (2026-11-22, S2) the frame's gizmo as `mapGizmo` makes it (`rawGizmo`, then `gizmoOf`), `rawGizmo`'s own result kept for the readout
    // ⭐⭐⭐ (2026-11-23, S4) today's gizmo kept beside the driven one: the readout compares P2 with the rule as built (its Δ, S3's answer unchanged)
    const mrT = rawGizmoToday(st, mq.yaw, mq.pitch);
    const mr0 = driveGizmo(st, mrT);
    const m0g = gizmoOf(st, mq.yaw, mq.pitch, mr0);
    // ⭐⭐⭐ (2026-11-22, `ORBIT_SURFACE_READOUT.md` §4 — S2) THE READOUT, ONCE A FRAME, for the frame's own gizmo only (⛔ never in the sections' samples, the
    // edge blend's or the solver's queries): P2 beside today's depth — ⛔ NOTHING READS IT BACK (the gizmo, the piece, the calm, the camera untouched);
    // at `landingReadout` 0 it returns before any computation — ⭐⭐ (2026-11-23, S3) unless the mouth's hold asks P2 at a mouth (`mouthHoldDomain` 2)
    // ⭐ (S4) fed today's point, and — where P2 moved it and the readout runs (§9bis 6) — today's blend (its `band` flag: the blend's far end is the next
    // face's driven point, the flag only)
    const askHold = st.cfg.mouthHoldDomain === 2 && m0g !== null && m0g.mouth !== undefined;
    landingReadoutFrame(st, mrT, mr0 === mrT || (st.cfg.landingReadout !== 1 && !askHold) ? m0g : gizmoOf(st, mq.yaw, mq.pitch, mrT), READOUT_SOURCE, askHold);
    if (m0g !== null) {
      // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt shall happen when the red section reaches the edge at the bottom of the mouth"* → *"build b"*) A VOID'S MOUTH:
      // a dy toward its open end HOLDS the gizmo where it last was — the void's floor edge, the red's end there (`mouthHold`) — and hands over: the automatic
      // tilt from there (close in), the next facet's first place once the angles reach it (far out); a dx lets it go onto the plane's bridge (§8.3)
      const sh0 = st.asmShown;
      // ⭐⭐⭐ (2026-11-16, step C4) the band read last frame — the map the previous place (`sh0`) indexes (a free face's entry reads where the place was)
      const fbWas = st.asmFaceBand;
      const dP = sh0 === null ? 0 : mq.pitch - sh0.pitch;
      const dY = sh0 === null ? 0 : Math.atan2(Math.sin(mq.yaw - sh0.yaw), Math.cos(mq.yaw - sh0.yaw));
      const wasHeld = st.asmMouth !== null;
      // ⭐⭐⭐ (2026-11-23, S3 — `ORBIT_SURFACE_MOUTH_HOLD.md` §4, his Q4 (a)) THE HOLD'S DOMAIN: never on a cap (H1), only over a void P2 leaves open for
      // the held piece (H2) — outside it no mouth is passed, and the hold lets go; at `mouthHoldDomain` 0 the mouth as built
      const mouthIn = m0g.mouth !== undefined && mouthHoldDomain(st.cfg.mouthHoldDomain, m0g.t.band, mouthP2(st)) ? m0g.mouth : null;
      const holdNow = mouthHold(wasHeld, mouthIn, dP, dY);
      if (holdNow && st.asmMouth === null && st.asmRawPrev !== null) st.asmMouth = { point: st.asmRawPrev, hi: dP > 0 };
      if (!holdNow) st.asmMouth = null;
      const m = st.asmMouth === null ? m0g : { ...m0g, hit: { ...m0g.hit, point: st.asmMouth.point } };
      st.asmRawPrev = m.hit.point;
      hit = m.hit;
      // ⭐⭐⭐ (2026-11-10, the owner: *"Build 2"*, *"Apply the glide to those steps as well"*) THE GLIDE OF THE GIZMO'S DEPTH: the shown gizmo keeps the map's
      // own travel (the contour's place) and every step of the REAL depth beyond it is eased out by time (`gizmoGlide`, `asmGOff` — the piece's ring with
      // it) over 45°'s time at the tilt speed (125 ms at 360°/s): a notch along an edge (the switch kept AT the edge), a notch's wall inside a face, a void's
      // rim. ⛔ The stretch's blend (removed, §9.7) glided only edges, over 10°. A frame change has its own relocation (`asmShown` null then: none here)
      const R = mapFrame(st);
      // ⭐ (2026-11-10) held at a mouth: no travel of its own (the map's place moves on, the gizmo stays)
      // ⭐ let go: from the held place straight (the map's place moved on meanwhile — its travel is not the gizmo's)
      const s1 = tiltDir(R, m.t.surface);
      const glide = st.asmMouth !== null ? null : gizmoGlide(st.asmG, st.asmShown === null ? null : wasHeld ? s1 : tiltDir(R, st.asmShown.t.surface), s1, m.hit.point);
      if (glide !== null) st.asmGOff = { v: glide, left: 1, timeMs: 0, durMs: rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS) };
      st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch };
      // ⭐⭐⭐ (2026-11-16, `ORBIT_CHARTS.md` §12 2.4d) the BANDED FACET read once a frame, at the place just set (in the map's own frame)
      faceBandRead(st, m.t);
      // ⭐⭐⭐ (2026-11-10, §9.4) the tilted pole's frame this frame: the press's swing, the share of the way off the facet (the roll back), the exit
      tiltFrame(st, m.t.stack, m.t.surface);
      // ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §3.4, step C4) a spit's level face: the heading carried — in at the edge, out one band past it
      // ⭐⭐⭐ (2026-11-16, §16 — C2W) the place before this one kept (`asmPlaceWas`): the tilt is made NEXT frame (`tiltOn` reads the place shown), its entry
      // edge the face this one came from
      const placeWas = sh0 !== null && fbWas !== null ? { map: fbWas.map, stack: sh0.t.stack } : null;
      st.asmPlaceWas = placeWas;
      freeFaceFrame(st, m.t, placeWas);
      // ⭐⭐⭐ (§9.4) a frame change that moves the gizmo: its relocation, eased (`asmGOff`)
      gOffStep(st, dtMs);
      hit = { ...hit, point: withGOff(st, hit.point) };
      st.asmG = hit.point;
    }
  }
  calmFrame(st, dtMs);
  const g0 = st.asmG ?? st.asmGizmo ?? a.centre;
  // ⭐ the face by the edge rule (the quads read it)
  if (hit !== null && hit.normal !== null && faceSwitches(st.gizmoNormal ?? null, st.asmFacePoint, hit.normal, hit.point, edgeMarginM(st))) {
    if ((st.gizmoHost ?? null) !== hit.host) {
      st.gizmoHost = hit.host;
      st.orientDirty = true;
    }
    const n0 = st.gizmoNormal ?? null;
    if (n0 === null || n0[0] * hit.normal[0] + n0[1] * hit.normal[1] + n0[2] * hit.normal[2] < Math.cos(Math.PI / 180)) st.orientDirty = true;
    st.gizmoNormal = hit.normal;
    st.asmFacePoint = hit.point;
  } else if (hit !== null && st.asmFacePoint === null) st.asmFacePoint = hit.point;
  // ⭐ the orbit's centre eased to the gizmo's FOOT (⭐⭐⭐ 2026-11-04, Step 2 — the shell: a step of the gizmo in depth moves neither the piece nor the
  // camera); the ring at the gizmo itself, on the real surface
  const target = g0;
  // ⭐⭐⭐ (2026-11-11, the owner's shake at an exit — the gap between the piece and the gizmo) the foot along the SHOWN direction (`dirAt`: the calm's, the
  // square camera's), the one the piece hangs along (`shownOffset`) and the solver places it by (`placeAtAngles`) — ⛔ along the ORBIT's: where the two part
  // (21° after a dx along the tilted top, the square camera) the base slid e·sin of that off the gizmo's line (29 mm, ~1° on the screen, kept until the exit)
  const us = dirAt(st, q.yaw, q.v);
  const foot = footOf(st, target, us, d + liftOf(st, us));
  st.asmGizmo = st.asmGizmo === null ? [foot[0], foot[1], foot[2]] : easePoint(st.asmGizmo, foot, dtMs, st.cfg.gizmoEaseMs); // ⭐⭐ (2026-11-04) a slider (the former GIZMO_TAU_MS, 90 ms)
  st.asmGizmoAt = [target[0], target[1], target[2]]; // ⭐⭐⭐ (2026-11-02) where the ring is drawn: the vertex both lines go through (`gizmoShownAt`)
  // ⭐⭐⭐ (2026-11-11, the owner's jitter of the gizmo) the ring and its sections drawn at the base's lag along the face (`gizmoLag`) — the rig's one ease
  st.asmGizmoLag = gizmoLag(st.asmGizmo, foot, st.gizmoNormal ?? null);
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // ⭐ the look point: the centre far out, the gizmo close in (a share of the distance — it frames the view, it switches nothing)
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM);
  const g = st.asmGizmo;
  const lt: Vec3 = [a.centre[0] + (g[0] - a.centre[0]) * w, a.centre[1] + (g[1] - a.centre[1]) * w, a.centre[2] + (g[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  sectionLinesFrame(st);
  // ⭐⭐⭐ (2026-11-11) the blend whole: by the finger's travel, or at the FIRST EDGE CROSSED (`blendCrossed` — the owner: *"otherwise, it may carry over a
  // tilted view on another face"*; its rest then at the crossing's own speed)
  const bl = st.asmBlend;
  if (bl !== null) {
    const tid = st.asmTilt?.id ?? 0;
    if (bl.tiltId === null) {
      bl.tiltId = tid;
      bl.target = st.asmSquare.target;
    } else if (blendCrossed(bl.tiltId, tid, bl.target, st.asmSquare.target)) st.asmBlend = null;
    else if (bl.target === null) bl.target = st.asmSquare.target;
    if (st.asmBlend !== null && blendShare(st.asmBlend.mm, st.cfg.tiltBlendMm) >= 1) st.asmBlend = null;
  }
  // ⭐⭐⭐ (2026-11-11) the sections at the gizmo's lag too: the ring stays their intersection (*"the gizmo is always at the intersection"*)
  const sl = st.asmSectionLines;
  const lg = st.asmGizmoLag;
  if (sl !== null) sl.position.set(lg?.[0] ?? 0, lg?.[1] ?? 0, lg?.[2] ?? 0);
}

/**
 * ⭐⭐ (the optional) THE SECTIONS DRAWN — the paths the gizmo takes. ⭐⭐⭐ (2026-11-04, STEP 4c-bis) FROM THE FACE MAP ITSELF (`mapGizmo`): the GREEN, the
 * gizmo at every yaw at the map's pitch (round the assembly — on a side at its height, over a top / under a bottom round the centre); the RED, at every
 * pitch at the map's yaw (bottom centre → top centre, on a side in the world's vertical plane square to it). So the lines are the gizmo's own paths, and
 * the gizmo's EXACT point is a vertex of both (`insertIndex`) — by construction. Each line's samples computed once per line (a dx reshapes the red only, a
 * dy the green only); a step between two neighbours far beyond the box's own step there (a depth step: a protrusion, a recess) breaks the line. ⭐ ONE
 * mesh of a fixed vertex count, updated in place (a segment not drawn: collapsed). Hidden under the slide, or off.
 */
/** ⭐ The section lines' samples (the green round the yaw, the red along the pitch — the gizmo's vertex added to each). */
const GREEN_SAMPLES = 96;
const RED_SAMPLES = 64;
/** ⭐ (2026-11-09, I17) the mesh's fixed segment counts: the base samples + the refinement's budget (`refineStep`) + the gizmo's vertex — unused collapsed */
const GREEN_SEGS = GREEN_SAMPLES + LINE_REFINE_BUDGET + 1;
const RED_SEGS = RED_SAMPLES + LINE_REFINE_BUDGET;
/**
 * ⭐ The lines lifted off the surface (m) — never in it. ⭐⭐⭐ (2026-11-09, §8.7) along the REAL surface's own normal (the gizmo's hit), ⛔ the big face's:
 * on Piece42's slanted sides (15° from the +x face's plane) the lift along +x left the line 0.53 mm off the face.
 */
const SECTION_LIFT_M = 0.002;
/** ⭐ (§8.7) a line's sample: its drawn point (lifted), its place on the facet, the real face under it (part, normal, the unlifted point) */
type LineVal = LineSample;
/** ⭐ (§8.7) two samples on the SAME real face — one part, one normal, one plane: their path continuous (no verification) */
function sameFace(a: LineVal, b: LineVal): boolean {
  if (a.h !== b.h) return false;
  if (a.n[0] * b.n[0] + a.n[1] * b.n[1] + a.n[2] * b.n[2] < 0.9999) return false;
  return Math.abs((a.q[0] - b.q[0]) * a.n[0] + (a.q[1] - b.q[1]) * a.n[1] + (a.q[2] - b.q[2]) * a.n[2]) < 0.001;
}

function sectionLinesFrame(st: SceneState): void {
  const sh = st.asmShown;
  const g = st.asmG;
  const show = st.cfg.sectionLines === 1 && g !== null && sh !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const parts = `${st.asmParts?.key ?? ""}#T${st.asmTilt?.id ?? 0}#Z${st.asmZone?.id ?? 0}`; // ⭐ (§9.4) a frame's lines are its own
  const o = mapOpts(st);
  // ⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.6) + the drive's signature: where P2 reads from the piece, a part becoming a wall re-samples the lines
  const optKey = `${o.edgeMm}|${o.edgeDeg}|${driveKey(st)}`;
  // ⭐⭐⭐ (2026-11-09, I17) the samples REFINED where the line leaves its chord by more than 1 mm (`refineStart`, `refineStep`): a narrow face (Piece42's
  // slanted sides, 6.5° of yaw against a sample every 3.75°) is drawn on its surface, never as a chord through the part — drawing only.
  // ⭐⭐⭐ (§8.7) THE JOINS: an interval is drawn only where the gizmo's path is CONTINUOUS — the same real face at both ends at once, a face change once
  // verified (`joinStep`, `pathJoins`); unverified, broken — never a chord across a jump. A new line (its key changed: the line being dragged across) is
  // drawn from its base samples; each frame a line spends `LINE_REFINE_PER_FRAME` evaluations — its joins first, then its refinement
  const valOf = (yw: number, pt: number): LineVal | null => {
    const m = mapGizmo(st, yw, pt);
    if (m === null) return null;
    const n = m.hit.normal ?? tiltDir(mapFrame(st), m.t.normal);
    const q = m.hit.point;
    return { p: [q[0] + n[0] * SECTION_LIFT_M, q[1] + n[1] * SECTION_LIFT_M, q[2] + n[2] * SECTION_LIFT_M], s: m.t.surface, h: m.hit.host, n, q };
  };
  const pos = (v: LineVal): Vec3 => v.p;
  const drawn = (ref: RefineState<LineVal>) => {
    const r = refineNow(ref);
    return { params: r.params, vals: r.vals, joins: r.joins, pts: r.vals.map((v) => (v === null ? null : new Vector3(v.p[0], v.p[1], v.p[2]))) };
  };
  const line = (cache: SceneState["asmRedCache"], key: string, at: (x: number) => readonly [number, number], base: readonly number[], closed: boolean, period: number) => {
    const ev = (x: number): LineVal | null => valOf(...at(x));
    if (cache === null || cache.key !== key) {
      const ref = refineStart(base, closed, period, ev, sameFace);
      joinStep(ref, ev, pos);
      return { key, ref, ...drawn(ref) };
    }
    const v0 = cache.ref.ver;
    if (!joinsKnown(cache.ref)) joinStep(cache.ref, ev, pos);
    else if (!cache.ref.done) refineStep(cache.ref, ev, pos);
    if (cache.ref.ver !== v0) Object.assign(cache, drawn(cache.ref));
    return cache;
  };
  // the red's samples (per the map's yaw): the pitch from −90° to +90°
  const rKey = `${parts}#R#${sh.yaw.toFixed(7)}#${optKey}`;
  st.asmRedCache = line(st.asmRedCache, rKey, (x) => [sh.yaw, x - Math.PI / 2], sectionFixed(Math.PI, RED_SAMPLES - 1, false), false, Math.PI);
  // the green's samples (per the map's pitch): the yaw round the circle
  const gKey = `${parts}#G#${sh.pitch.toFixed(7)}#${optKey}`;
  st.asmGreenCache = line(st.asmGreenCache, gKey, (x) => [x, sh.pitch], sectionFixed(2 * Math.PI, GREEN_SAMPLES, true), true, 2 * Math.PI);
  // ⭐⭐⭐ the gizmo's EXACT point inserted in both: the ring is a vertex of each line, at every frame — lifted along its own surface's normal (§8.7)
  const gval = valOf(sh.yaw, sh.pitch);
  const gn = gval?.n ?? tiltDir(mapFrame(st), sh.t.normal);
  const gv = new Vector3(g[0] + gn[0] * SECTION_LIFT_M, g[1] + gn[1] * SECTION_LIFT_M, g[2] + gn[2] * SECTION_LIFT_M);
  const key = `${rKey}|${gKey}|${st.asmRedCache.ref.ver}|${st.asmGreenCache.ref.ver}|${gv.x.toFixed(6)},${gv.y.toFixed(6)},${gv.z.toFixed(6)}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const rest = gv;
  const lines: Vector3[][] = [];
  /**
   * ⭐ one line drawn with the gizmo's vertex inserted at `gi`: a segment between two samples by their interval's join; the gizmo's two by the interval
   * it splits (continuous: both), else each by the same face — at least the nearer one (`gizmoJoins`: the ring always on a drawn line)
   */
  const draw = (c: NonNullable<SceneState["asmRedCache"]>, gi: number, closed: boolean, segs: number): void => {
    const N = c.pts.length;
    const pts = [...c.pts];
    pts.splice(gi, 0, gv);
    const n = pts.length;
    const prevB = closed ? (gi - 1 + N) % N : gi - 1; // the sample before the gizmo (its interval holds the gizmo)
    const nextB = closed ? gi % N : gi; // the sample after it
    const split = prevB >= 0 ? (c.joins[prevB] ?? null) : null;
    const pv = prevB >= 0 ? (c.vals[prevB] ?? null) : null;
    const nv = nextB < N ? (c.vals[nextB] ?? null) : null;
    const d = (p: Vector3 | null): number => (p === null ? Infinity : Vector3.Distance(gv, p));
    const ja = pv !== null && (split === true || (gval !== null && sameFace(pv, gval)));
    const jb = nv !== null && (split === true || (gval !== null && sameFace(gval, nv)));
    const gj = gizmoJoins(ja, jb, d(prevB >= 0 ? (c.pts[prevB] ?? null) : null), d(nextB < N ? (c.pts[nextB] ?? null) : null));
    const last = closed ? n : n - 1;
    for (let k = 0; k < segs; k++) {
      if (k >= last) {
        lines.push([rest, rest]); // ⭐ (I17) beyond this line's samples: collapsed
        continue;
      }
      const k1 = (k + 1) % n;
      const p0 = pts[k] ?? null;
      const p1 = pts[k1] ?? null;
      const joined = k1 === gi ? gj[0] && pv !== null : k === gi ? gj[1] && nv !== null : c.joins[k < gi ? k : k - 1] === true;
      lines.push(p0 !== null && p1 !== null && joined ? [p0, p1] : [rest, rest]);
    }
  };
  // green: a closed loop through the gizmo (its parameter the map's yaw)
  const gc = st.asmGreenCache;
  draw(gc, insertIndex(gc.params, ((sh.yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)), true, GREEN_SEGS);
  // red: bottom centre → top centre through the gizmo (its parameter the map's pitch + 90°)
  const rc = st.asmRedCache;
  draw(rc, insertIndex(rc.params, sh.pitch + Math.PI / 2), false, RED_SEGS);
  if (st.asmSectionLines === null) {
    const colours = lines.map((_, i) => (i < GREEN_SEGS ? [new Color4(0.35, 0.8, 0.35, 1), new Color4(0.35, 0.8, 0.35, 1)] : [new Color4(0.9, 0.25, 0.2, 1), new Color4(0.9, 0.25, 0.2, 1)]));
    st.asmSectionLines = CreateLineSystem("asmSections", { lines, colors: colours, updatable: true }, st.scene);
    st.asmSectionLines.isPickable = false;
    st.asmSectionLines.alwaysSelectAsActiveMesh = true;
    // ⭐ in the TRANSPARENT pass, after the pieces' see-through contours (⛔ opaque, the contours drawn over them washed them out); hidden behind solid parts
    st.asmSectionLines.alpha = 0.99;
    st.asmSectionLines.alphaIndex = 1000;
  } else CreateLineSystem("asmSections", { lines, instance: st.asmSectionLines });
  st.asmSectionLines.isVisible = true;
}

/**
 * ⭐⭐ THE APPROACH MOVED by `da` (the coordinate; down: in): ⭐⭐⭐ (2026-11-01) in AND out only as far as the parts allow (`approachStepFree`) — the piece's gap kept at its resting gap
 * (`pieceGapMm`), the largest free share found by halving. Returns the move taken.
 */
export function approachMove(st: SceneState, da: number): number {
  if (da === 0) return 0;
  const a0 = st.approach;
  const want = approachStep(a0, da, 1, st.cfg);
  if (want === a0) return 0;
  const out = want > a0;
  if (st.pieceQ === null || st.greenBox === null) {
    st.approach = want;
    return want - a0;
  }
  const q = st.pieceQ;
  const gapM = pieceSolveOptions(st).gapM;
  const envAt = (cand: number) =>
    pieceSolverEnv(st, (qq) => {
      const keep = st.approach;
      st.approach = cand;
      // ⭐⭐ (2026-11-12, the slide's rebuild) the piece where the approach alone puts it — the rest on the support left out (`asmRestOff`): ⛔ with it, an
      // approach in past the contact read as free (the rest held the piece up), and the excess was a dead band on the way out
      const restWas = st.asmRestOff;
      st.asmRestOff = true;
      const p = ringAnchorAt(st, qq);
      st.asmRestOff = restWas;
      st.approach = keep;
      return p;
    });
  const gapAt = (cand: number): number => envAt(cand).gap(q);
  // ⭐⭐⭐ (2026-11-01, *"the collision detection shall apply also when moving the piece away from a face"*) — out checked too (`approachStepFree`); blocked, the
  // player finds the way out (the orbit; ⭐ 2026-11-12 the way out's check KEPT with the slide removed — the owner: *"we still need a collision check at way out"*)
  const gapNow = out ? gapAt(a0) : gapM;
  const free = (cand: number): boolean => approachStepFree(gapAt(cand), gapNow, gapM, out);
  if (free(want)) {
    st.approach = want;
    return want - a0;
  }
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 6; i++) {
    const m = (lo + hi) / 2;
    if (free(a0 + (want - a0) * m)) lo = m;
    else hi = m;
  }
  st.approach = a0 + (want - a0) * lo;
  if (lo < 1) st.approachInertia.stop();
  if (out && lo < 1) {
    const blocker = envAt(a0 + (want - a0) * hi).blocker?.(q) ?? null; // the part met at the step refused
    st.lastVerdict = `orbit: the way out is blocked by ${blocker ?? "a part"} — slide or orbit to find a way out`;
    st.hudDirty = true;
  }
  return st.approach - a0;
}

/**
 * ⭐⭐⭐ (2026-11-21, `PICTURE_REBUILD.md` §4.2 — R3a) THE BAND'S SHARE at the approach's PLACE (`w`, D-P3 (a)): 1 at and inside the unlatch (0.65 m), a
 * smoothstep down to 0 over his last `pictureBandMm` of approach finger beyond it (`approachOutMm`, `bandShare`) — the logic's own place, read by the picture
 * and by a turn's rule at its birth (`zoneMixPose`: the way out born at w > 0 turned about the piece, §4.4).
 */
export function approachBand(st: SceneState): number {
  return bandShare(approachOutMm(st.cfg, st.approach, orbitDvPerMm(st)), st.cfg.pictureBandMm);
}

/** ⭐ An approach input: `dyMm` of finger (UP brings the piece IN), at the orbit dy's pace on the curve's coordinate; recorded for the coast. */
export function approachInput(st: SceneState, dyMm: number): void {
  const da = dyMm * orbitDvPerMm(st);
  // ⭐⭐⭐ (2026-11-16, step C3) the finger's travel OUTWARD (the coordinate up) counted for the way out's turn, while it is alive (`seamOutFeed`)
  if (da > 0) seamOutFeed(st, Math.abs(dyMm), 0);
  const taken = approachMove(st, da);
  st.approachInertia.record(performance.now(), 0, taken);
  st.hudDirty = true;
}

/** ⭐ The approach's input ends: its coast starts. */
export function approachRelease(st: SceneState): void {
  st.approachInertia.release(performance.now());
}

/** ⭐ THE CAMERA'S FRAME: behind the piece along its direction (locked, the cone's), the owner's world offsets as ever, its up upright. */
export function assemblyCameraFrame(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset, dtMs?: number): RigCameraFrame {
  const f = assemblyCameraFrameRaw(st, cam, off, dtMs);
  // ⭐⭐⭐ (2026-11-14) a zone's switch / the spit's crossing turns the camera ABOUT THE PIECE, on its pose (`zoneMixPose`, the camera's stage) — the frame
  // here is the one turned to. ⛔ (2026-11-13) its up turned about the view here: the piece went round the glass's centre, after a jump to the opposite corner
  // ⭐⭐⭐ (2026-11-21, `PICTURE_REBUILD.md` §4.4 — R3b) THE LOGIC'S OWN FRAME, its one writer (`asmCamLogic`; the frame drawn is the picture's: `asmCamDrawn`)
  st.asmCamLogic = { dir: f.dir, up: f.up };
  return f;
}

/**
 * ⭐⭐⭐ (2026-11-14, the owner: *"the piece still snaps 180 degrees diagonally before the camera realignment brings the piece back to its position … I don't
 * like this snap jump"*) THE CAMERA'S POSE DURING A ZONE'S TURN (`asmZoneMix`): from the pose on the glass at the switch to this frame's (`eye`, `look`,
 * `up` — the camera's stage builds them from the frame turned to), turned ABOUT THE PIECE (`poseAboutPiece`): the piece holds its place on the glass, the
 * assembly turns behind it; the turn's angle sets its time (`zoneStep`), its axis kept frame to frame. No turn: the pose as given. Measured (Scene_0bis,
 * the zenith edge, far out): the piece leapt from (−0.27, −0.06) of the half-glass to (0.27, 0.76) — the offsets turned with the heading — then went round.
 */
export function zoneMixPose(st: SceneState, piece: Vec3, eye: Vec3, look: Vec3, up: Vec3): CamPose {
  const zm = st.asmZoneMix;
  const to: CamPose = { eye, look, up };
  st.asmPieceDrawn = [piece[0], piece[1], piece[2]]; // ⭐ where the piece is drawn this frame: a turn starting next frame starts from it
  if (zm === null) return to;
  // ⭐⭐⭐ (2026-11-14, the owner: *"Is there a way for the camera to realign without the piece nor the assembly/scene to sometimes fly off the screen view
  // (especially at far distance)?"*) THE TWO FRAMED — the piece and the camera's aim (the assembly far out), each carried straight on the glass
  // (`poseFramingTwo`, toric space): neither leaves it; degenerate (the two on one ray, close in where the aim is the gizmo by the piece): about the
  // piece alone, as above. ⛔ About the piece alone everywhere: far out the assembly swung round the piece (4.5° at 7.7 m — off a narrow glass)
  // ⭐ the rule chosen at the turn's first frame and kept (`zm.rule` 2: about the piece) — never switched mid-turn (a jump between the two poses); the
  // two's angles carried frame to frame (`zm.keep`, `FramingKeep`)
  // ⭐⭐⭐ (2026-11-21, `PICTURE_REBUILD.md` D-P2 — packet R2, `pictureOne` 1) a turn born CLOSE IN (the automatic tilt latched) about the piece for its whole
  // life (`turnPose` → `turnFraming`, the one rule): the approach brought the piece along the view onto its aim — the solve swung, then had none (32 – 48°)
  // ⭐⭐⭐ (R3a, §4.4) …and the way out, born in the band (w > 0: at the unlatch w is whole), about the piece too
  const d = turnPose(zm.from, to, piece, zm.k, zm, zm.axis, st.asmTiltAuto || approachBand(st) > 0);
  const r = d.about;
  zm.axis = r.axis ?? zm.axis ?? [0, 1, 0]; // ⭐ the angle read (a turn of nothing has no axis of its own: done at once — never held for ever)
  zm.rad = r.angle;
  zm.rule = d.rule;
  zm.keep = d.keep;
  // ⭐⭐⭐ (R3b) its camera frame no longer written here: the drawer hands it back (`zoneMixCam`), the picture publishes it (`asmCamDrawn`)
  return d.pose;
}

/** ⭐⭐⭐ (R3b) The camera frame of a zone's turn's pose (`zoneMixPose`'s, while a turn runs) — the drawer's `cam`, published by the picture. */
export function zoneMixCam(pose: CamPose): CamFrame {
  return { dir: norm3([pose.eye[0] - pose.look[0], pose.eye[1] - pose.look[1], pose.eye[2] - pose.look[2]]), up: pose.up };
}

/**
 * ⭐⭐⭐ (2026-11-21, `PICTURE_REBUILD.md` §4.4 — R3b, D-P6) THE FACTS THE PICTURE PUBLISHES for the logic's holds, this frame: far out the follower's own turn
 * started and its dy hold (D-H8), close in the carried up's change applied at once (C6). ⛔ (2026-11-22, R6) law U's own half turn (`lawHalf`, RB3)
 * deleted with law U.
 */
export interface PictureEvents {
  readonly followStarted?: boolean;
  readonly followHold?: 1 | -1 | 0;
  readonly carried?: { readonly halfStart: number; readonly crossed: 1 | -1 | 0 };
}

/** ⭐⭐⭐ (H3, F-3 = D-H11) a turn started far out sets every angle state to the map's place at the gizmo (the map's place shown; ⛔ R6: `followTurnRebase` deleted) */
export function followRebaseAsked(st: SceneState, started: boolean): boolean {
  return started && st.asmShown !== null;
}

/**
 * ⭐⭐⭐ (R3b, D-P6) THE LOGIC READS THE PICTURE'S FACTS and writes its own state (moved from the drawers, at the same moment of the frame — right after the
 * picture, before anything reads them): the dy hold at the follower's crossing (`holdAtCrossing`; it replaces any older one), then every angle state set
 * at its turn's start (`seamRebase`, F-3); the carried up's hold at a change applied at once (`carriedHold`). ⛔ (R6) law U's (`lawHalf`) deleted.
 */
export function pictureEventsRead(st: SceneState, ev: PictureEvents): void {
  if (ev.followHold !== undefined) st.asmEdgeHold = holdAtCrossing(ev.followHold);
  if (followRebaseAsked(st, ev.followStarted === true)) {
    const sh = st.asmShown!;
    seamRebase(st, { yaw: sh.yaw, pitch: sh.pitch });
  }
  if (ev.carried !== undefined) st.asmEdgeHold = carriedHold(ev.carried.halfStart, ev.carried.crossed, st.asmDxSign);
}

/** ⭐ The pose on the glass now (the camera drawn last frame) — a zone's turn starts from it. */
function poseShown(st: SceneState): CamPose {
  // ⭐⭐⭐ (2026-11-21 night, `PICTURE_REBUILD.md` §4.3a rule 3 — R3-FIX) under the one picture a turn started AT THE LATCH starts from the pose DRAWN: last frame
  // drawn by the far path (not latched), the latch on now — after a frame the follower drew through a logic turn the record below is the close drawer's
  // (the logic's pose), not the one on the glass. Every other turn as before (its start the logic's, its angle and its clock unchanged)
  if (st.asmTiltAuto && st.asmPicture?.far === true) return drawnPose(st);
  // ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md`) the carried up: a turn (close in) starts from the logic's last pose — the picture is that pose turned by φ
  // (⛔ R6: law U's own line, the same, deleted with it)
  const sh = st.asmRollShadow;
  if (sh !== null && sh.one !== undefined) return { eye: sh.ghost.eye, look: sh.ghost.look, up: sh.ghost.up, piece: st.asmPieceDrawn };
  return drawnPose(st);
}

/** ⭐ The camera drawn last frame, with the piece where it was drawn. */
function drawnPose(st: SceneState): CamPose {
  const c = st.camera;
  const t = c.getTarget();
  return { eye: [c.position.x, c.position.y, c.position.z], look: [t.x, t.y, t.z], up: [c.upVector.x, c.upVector.y, c.upVector.z], piece: st.asmPieceDrawn };
}

function norm3(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-12 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 1];
}

function assemblyCameraFrameRaw(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset, dtMs?: number): RigCameraFrame {
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  // ⭐⭐⭐ (2026-11-13, POLAR_ZONES.md §3.5) IN A POLAR ZONE'S FRAME (no tilt there): S1 the camera upright IN F (its up the axis on the glass, as the tilted
  // pole's); S2 THE SPIT — upright in the WORLD (the axis across the glass): a dy turns the assembly about it; its heading the SIDE of the axis it is on
  // (`spitHeading`, ⛔ its own direction's: it spun at the vertical), the side changed at the crossing by one timed turn (`spitStep`, as `Scene_0`'s)
  const B = st.asmTilt === null ? baseFrame(st) : null;
  if (B !== null) {
    const uF = orbitDir(cam.yaw, cam.v);
    const sF = calmDir(st, uF);
    if (st.asmZone!.zone.orientation === "UPRIGHT") {
      const fF = offsetFrame(sF, calmHeading(cam.yaw, uF, sF), o.yawRad, o.pitchRad);
      return { dir: mulM(B, fF.dir), up: mulM(B, fF.up) };
    }
    const uW = mulM(B, sF);
    // ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §3.4, step C4) ON A FREE FACE (a level face of the spit): the camera's up the heading CARRIED in at the entry
    // (`freeHeadingAngle`) — ⛔ the side's heading (`spitCameraHeading`): it turned the picture in the middle of the face
    const side = st.asmSpitSide !== 0 ? st.asmSpitSide : spitSide(uW, st.asmZone!.zone.axis, 0);
    // ⭐⭐⭐ (2026-11-18, ES — the silent entry) the heading SHOWN: entered over an edge, the picture the bound face's camera would show kept, turned to the
    // layout by the face's middle at most the tilts' one speed a frame (`freeShownHeading`)
    const hS = st.asmFree !== null ? freeHeadingAngle(freeShownHeading(st, uW, side, dtMs), uW) : spitCameraHeading(uW, st.asmZone!.zone.axis, side);
    st.asmSpitPic = { u: uW, up: offsetFrame(uW, hS, 0, 0).up }; // ⭐ (ES) this frame's picture before the offsets (the next entry continues it)
    return offsetFrame(uW, hS, o.yawRad, o.pitchRad);
  }
  // ⭐⭐⭐ (2026-11-10, §9.4) THE TILTED POLE: the camera upright IN F (the pressed cap a side), turned into the world
  // ⭐⭐⭐ (2026-11-15, §12 2.4c) no roll back inside F: the camera upright in F to the exit, then ONE turn (`asmZoneMix`) — ⛔ (step 2.5, 2026-11-16) the
  // roll back of the game before the charts deleted (`frameMix` toward the world's upright by the exit's share, `nextTiltHeading`, `headingFrom`)
  const tl = st.asmTilt;
  if (tl !== null) {
    const uF = orbitDir(cam.yaw, cam.v);
    const sF = calmDir(st, uF);
    const fF = offsetFrame(sF, calmHeading(cam.yaw, uF, sF), o.yawRad, o.pitchRad);
    return { dir: mulM(tl.map, fF.dir), up: mulM(tl.map, fF.up) };
  }
  const u = dirAt(st, cam.yaw, cam.v);
  // ⭐⭐ (2026-10-28) the offsets in the camera's own frame, never faded — the same whichever face hosts the gizmo (`offsetFrame`)
  // ⭐ (2026-10-29) its heading the ORBIT's yaw, always (⛔ the direction's own — locked and turned into the cone at −90° it switched from the yaw to the
  // face's heading at once: the scene jump-rotated; and at ±90° it has none)
  // ⭐⭐⭐ (2026-11-04, `1.0.95-`) under the CALM the heading turned as the direction was (`calmHeading`) — ⛔ the orbit's yaw with the calm's direction:
  // the up built from another heading than the direction's own, the camera ROLLED on a wall (probed: 222 frames over 5° on one close-in dx leg)
  // ⭐⭐⭐ (2026-11-13, the owner's roll at the zenith) toward the poles the heading of the calm read LEVEL (`cameraHeading`, `calmLevelHeading`) — a dy
  // alone never turns a camera looking down (⛔ `calmHeading` alone: back to the bare yaw as the calm faded, and at the vertical — a roll by the yaw's side)
  return offsetFrame(u, cameraHeading(cam.yaw, orbitDir(cam.yaw, cam.v), u, levelHeadingOf(st, cam.yaw)), o.yawRad, o.pitchRad);
}

/* ⭐⭐⭐ (2026-11-10, POLAR_ORBIT_CLEANUP.md §9.4 — the owner's TILTED POLE; the rules in `input/orbit_tilt.ts`) ------------------------------------------ */

let TILT_SEQ = 0;

/** ⭐ The gizmo with its relocation's offset (`asmGOff`) — none: as it is. */
function withGOff(st: SceneState, p: Vec3): Vec3 {
  const o = st.asmGOff;
  return o === null || !(o.left > 0) ? p : [p[0] + o.v[0] * o.left, p[1] + o.v[1] * o.left, p[2] + o.v[2] * o.left];
}

/**
 * ⭐⭐⭐ THE RELOCATION'S SHARE LEFT, one frame: after a press over the swing's time (as the camera, 1 (c)); after an exit by the finger's travel over the
 * edge's slow stretch (`faceEdgeSlideDeg`, 3 (a)). Done: none. ⛔ (2026-11-15, the owner: *"cancel my rule and remove the press action on the orbit"*)
 * no press tilts now: the swing's time is an automatic tilt's.
 */
function gOffStep(st: SceneState, dtMs: number): void {
  const o = st.asmGOff;
  if (o === null) return;
  // ⭐ (2026-11-10, the rebuild) always by time — with a tilt's swing (its duration), after an exit a short ease (`RELOCATE_MS_ANGLE`'s time at the speed)
  o.timeMs += dtMs;
  o.left = o.durMs > 0 ? 1 - swingEase(o.timeMs / o.durMs) : 0;
  if (!(o.left > 1e-4)) st.asmGOff = null;
}
/** ⭐ (2026-11-10) a relocation after an exit (or a tilt with no swing): over this angle's time at `tiltRollDegS` — 45°: 125 ms at 360°/s */
const RELOCATE_ANGLE = Math.PI / 4;

/**
 * ⭐⭐⭐ ONE FRAME OF THE TILTED POLE, after the map's place (`stack`, the place `surface` in F): is the gizmo still on the tilted facet — else (or the tilt
 * turned off) the exit asked, made at the next frame's start (`tiltOff`). ⛔ (2026-11-15, the owner: *"cancel my rule and remove the press action on the
 * orbit"*) no press tilts. ⛔ (2026-11-16, step 2.5) the press's swing (`swingDir`) and the roll back off the facet (`rollStep`, `tiltExits`) of the game
 * before the charts deleted: the charts' one transition (`tiltOff`, `crossTurn`) is the only way out.
 */
function tiltFrame(st: SceneState, stack: number, surface: Vec3): void {
  const tl = st.asmTilt;
  if (tl === null) return;
  // ⭐⭐⭐ (2026-11-15) ON THE TILTED FACET'S BORDER IS ON IT (`onTiltedFacet`: the place `surface`, in F, near the tilted facet) — ⛔ the stack alone: a
  // press with the gizmo on `Scene_0`'s ridge left the tilt at once (the place read on the neighbour), and the exit at the world's pole then rolled the view
  // 157° in one frame (`tiltOff`)
  const fmB = stack === tl.facet ? null : faceMapOf(st);
  const borderM = stack === tl.facet ? 0 : fmB === null ? Infinity : distanceToFacets(fmB, [tl.facet], surface);
  // ⭐⭐⭐ (2026-11-16, `ORBIT_CHARTS.md` §12 2.4d) IN AT THE EDGE, OUT ONE BAND PAST IT: on the tilted facet within `edgeMarginM` of its border (the banded
  // facet's own band and distance: the exit and its change on the same frame) — ⛔ the tie alone (a micrometre, deleted at step 2.5): a place wobbling ±3 mm
  // across the entry edge made and left the tilt 21 times in 240 frames (measured, `Scene_1` close in: 1188° of view)
  const onFacet = onTiltedFacet(stack, tl.facet, borderM, edgeMarginM(st));
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4c) THE EXIT ASKED AT ONCE (`tiltLeavesNow`: off the tilted facet, or the tilt turned off) and made at the
  // next frame's start (`tiltOff`: the one transition — its camera turn from the pose shown); the gizmo held until then (`tiltClampStep`). ⛔ The roll back
  // inside F first (`finishing`, `k`, `frameMix`, `tiltExits`' wait): a second camera turn, by another code — deleted at step 2.5
  if (!tl.exit && tiltLeavesNow(onFacet, tl.off)) {
    if (!onFacet) tl.exitAcross = (st.asmCalm?.wA ?? 0) > 0.5; // ⭐ over a `b` end: the calm carried out as today (`tiltOff`)
    tl.exit = true;
  }
}

/**
 * ⭐⭐⭐ (2026-11-10, the rebuild — the owner: *"1-b"*) AN ORBIT STEP WHILE A TILT IS UNDER WAY (its exit asked, not yet made; a camera turn) — REFUSED:
 * the gizmo held where the crossing left it until the tilt completes; then the finger has the orbit again. Returns whether it refused the step.
 */
/** ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` C1) THE ORBIT'S POLE AXIS in the world: the tilt's, a polar zone's (its F's pole), else the vertical — the axis its yaw turns about */
export function orbitPoleAxis(st: SceneState): Vec3 {
  if (st.asmTilt !== null) return mulM(st.asmTilt.map, [0, 1, 0]);
  const B = baseFrame(st);
  return B !== null ? mulM(B, [0, 1, 0]) : [0, 1, 0];
}

export function tiltClampStep(st: SceneState, yaw0: number, v0: number): boolean {
  const tl = st.asmTilt;
  // ⭐⭐⭐ (`1.0.120b-`) …and while the square camera turns through an edge (`squareTurning`): every edge a frame change
  const turning = squareTurning(st.asmSquare.n, st.asmSquare.target, st.asmSquare.q);
  // ⭐⭐⭐ (2026-11-13, POLAR_ZONES.md D-Z7) …and while the camera turns into (or out of) a polar zone's frame: the gizmo held
  // ⭐⭐⭐ (2026-11-15, §12 2.4c) …a PACED turn (the automatic tilt's entry made pending, `byMm`) as its swing was: never while pending
  // or by the finger (`seamTurnHolds`); any other turn while short of whole, as ever
  const zm = st.asmZoneMix;
  // ⭐⭐⭐ (2026-11-16, step C3) …the way out paced by the finger (`out`) never (`turnHoldsGizmo`)
  // ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB3) …and while law U closes its own half turn (`lawHalfTurn`: a turn the player sees, as any other)
  // ⭐⭐⭐ (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §15 — H2, R3) …and while the follower's own turn at an edge runs far out (`followTurnHoldsGizmo`: close in's T5)
  const zoneTurning = (zm !== null && turnHoldsGizmo(zm.out !== undefined, zm.byMm === true, st.asmTiltPending, st.asmBlend !== null, zm.k)) || lawHalfTurn(st.asmRollShadow?.one?.state) || followTurnHoldsGizmo(st.asmFollow?.top?.turn ?? null);
  if (zoneTurning && (st.orbit.yaw !== yaw0 || st.orbit.elevation !== v0)) {
    st.orbit.reset(yaw0, v0);
    return true;
  }
  // ⭐⭐⭐ (2026-11-15, §12 2.4c) no swing and no roll back (⛔ deleted at step 2.5 with `tiltUnderWay`): the tilt holds the gizmo only from its exit asked to
  // its exit made (`exit`, `off` — the next frame's start), a finger event between the two frames never a step the transition then discards
  if (!turning && (tl === null || !(tl.exit || tl.off))) return false;
  if (st.orbit.yaw === yaw0 && st.orbit.elevation === v0) return false;
  st.orbit.reset(yaw0, v0);
  return true;
}

/**
 * ⭐⭐⭐ EVERY ORBIT ANGLE TURNED INTO ANOTHER FRAME (`turn`: a direction from the old frame to the new): the orbit's, the solved piece's, the spring's (at
 * rest), the camera's as shown (its leash state rebuilt from the piece), the gizmo's last; the yaws kept together (one hint). The coast stopped.
 */
function turnAngles(st: SceneState, turn: (d: Vec3) => Vec3, poleYaw = 0): void {
  const conv = (yaw: number, v: number, hint: number): { yaw: number; v: number } => anglesOfDir(turn(orbitDir(yaw, v)), hint);
  // ⭐⭐⭐ (2026-11-10, the owner: *"why is there a back-and-forth jump of the scene when the gizmo crosses an edge"*) a RATE turned too — the place a
  // little along it, turned, differenced (⛔ zeroed: mid-drag the piece's spring stalled at the tilt, then caught up — forth and back)
  const convRate = (yaw: number, v: number, ry: number, rv: number, at: { yaw: number; v: number }): [number, number] => {
    const m = Math.hypot(ry, rv);
    if (!(m > 0)) return [0, 0];
    const e = 1e-4 / m;
    const b = conv(yaw + ry * e, v + rv * e, at.yaw);
    return [(b.yaw - at.yaw) / e, (b.v - at.v) / e];
  };
  // ⭐⭐⭐ (2026-11-15) at a pole of the NEW frame the orbit's direction has no heading: the caller's (`poleYaw` — the heading shown; none handed: 0, as
  // before); the others take the orbit's (their hint)
  const o = anglesOfDir(turn(orbitDir(st.orbit.yaw, st.orbit.elevation)), 0, poleYaw);
  st.orbit.reset(o.yaw, o.v);
  // the solver's own memory of the target (the ring height kept, last frame's target) in the new frame — ⛔ left in the old one, the solver read a
  // whole frame's difference as the finger's step (the first probe: the pitch thrown to −90° at the press)
  st.orbitUserV = o.v;
  st.orbitRawPrev = { yaw: o.yaw, v: o.v };
  if (st.pieceQ !== null) st.pieceQ = { ...st.pieceQ, ...conv(st.pieceQ.yaw, st.pieceQ.v, o.yaw) };
  if (st.boxSpring !== null) {
    const sp = st.boxSpring;
    const a = conv(sp.at.yaw, sp.at.v, o.yaw);
    const [vy, vv] = convRate(sp.at.yaw, sp.at.v, sp.velYaw, sp.velV, a);
    st.boxSpring = { at: { ...sp.at, yaw: a.yaw, v: a.v }, velYaw: vy, velV: vv, velLnZoom: sp.velLnZoom };
    st.boxOrbit = st.boxSpring.at;
  } else if (st.boxOrbit !== null) st.boxOrbit = { ...st.boxOrbit, ...conv(st.boxOrbit.yaw, st.boxOrbit.v, o.yaw) };
  if (st.cameraLagged !== null) st.cameraLagged = conv(st.cameraLagged.yaw, st.cameraLagged.v, o.yaw);
  // ⭐⭐⭐ (2026-11-10, the same report) THE CAMERA'S FOLLOW STATE TURNED, not rebuilt — its place, the leash's last driver and box, its rates (⛔ set to none:
  // a camera lagging behind the piece mid-drag snapped onto it at the tilt — 240 mm in a frame against 100 — then trailed again)
  const co = st.cameraOrbit;
  if (co !== null) {
    const cam = conv(co.cam.yaw, co.cam.v, o.yaw);
    const drv = conv(co.yaw.lastDriver, co.pitch.lastDriver, o.yaw);
    const box = conv(co.yaw.lastBox, co.pitch.lastBox, o.yaw);
    const [ay, av] = convRate(co.cam.yaw, co.cam.v, co.yaw.vel, co.pitch.vel, cam);
    const [cy, cv] = convRate(co.cam.yaw, co.cam.v, co.yawVel, co.pitchVel / Math.PI, cam);
    st.cameraOrbit = {
      ...co,
      cam: { ...co.cam, yaw: cam.yaw, v: cam.v },
      yaw: { ...co.yaw, lastDriver: drv.yaw, lastBox: box.yaw, vel: ay },
      pitch: { ...co.pitch, lastDriver: drv.v, lastBox: box.v, vel: av },
      yawVel: cy,
      pitchVel: cv * Math.PI,
    };
  }
  if (st.asmPrevQ !== null) st.asmPrevQ = conv(st.asmPrevQ.yaw, st.asmPrevQ.v, o.yaw);
  if (st.asmCalm !== null) st.asmCalm = { ...st.asmCalm, n: turn(st.asmCalm.n) };
  st.orbitInertia.stop();
}

/**
 * ⭐⭐⭐ (§9.4, 1 (c)) A PRESS FOR ORBITING ON A CAP (the gizmo on the world's top / bottom, a real facet; the world's frame; no slide): the tilt about the
 * world horizontal axis square to the SNAPPED heading (`capTilt`) — the cap a side in F; the camera's heading swung square to it over `tiltSwingMs`
 * (`swingDir`: at the press exactly where it was); ⭐ the gizmo at its EXACT point — the map's angles taken there in F (`mapAngles`), the lines recomputed
 * from there; where F's rules place it elsewhere (a void read on the new lines' travels), its relocation eased over the same swing (`asmGOff`).
 * ⭐⭐⭐ (§9.4; 2026-11-10 automatic too) the tilt made — at a press (`tiltOnPress`) or by itself close in (`assemblyFrame`, `tiltAutoLatch`).
 * ⛔⛔⛔ (2026-11-15, the owner: *"cancel my rule and remove the press action on the orbit"*, `ORBIT_CHARTS.md` §11.1) the press no longer tilts —
 * `tiltOnPress` and its `why` deleted: close in only, by itself (`assemblyFrame`, `tiltAutoLatch`); the verdict the automatic tilt's, as before.
 */
function tiltOn(st: SceneState, mouthHi: boolean | null = null): void {
  if (!assemblyOn(st) || st.cfg.tiltedPole !== 1 || st.asmTilt !== null || st.greenBox === null) return;
  // ⭐⭐⭐ (2026-11-13, POLAR_ZONES.md §4.2 1.) A RESTRICTION: in a polar zone the tilted-pole orbit never fires — the polar orbit about the zone's axis
  if (st.asmZone !== null) return;
  const sh = st.asmShown;
  const g = st.asmG;
  const wm = worldFaceMap(st);
  if (sh === null || g === null || wm === null) return;
  // ⭐⭐⭐ (2026-11-10, *"build b"*) held at a void's mouth (`asmMouth`): the face holding the pole it opens toward — the red has reached the floor's edge
  const capStack = mouthHi === null ? sh.t.stack : mouthHi ? wm.top : wm.bottom;
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4a) THE ATLAS DECIDES: a face tilts only if it is a CAP with a square layout (`capTiltHeading`), its heading
  // one of the layouts' — ⛔ `holdsPole` (a side beyond 45°: `Scene_0`'s two top faces, D-C4; deleted at step 2.5 with the game before the charts) and the
  // virtual cap of a pole held by an edge (not on the contour: no tilt — 2.4b gives that pole its own crossing)
  const at = atlasOf(st);
  const cap = wm.facets[capStack];
  if (at === null || cap === undefined) return;
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  // ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §16 — C2W, W5) ON A FREE FACE THE HEADING CARRIED IN BY ITS ENTRY EDGE (`freeEntry`, C4's own entry on
  // the world's map: the side shared with the place before the one shown; no edge — the gizmo already on the cap — the layout nearest the up shown) —
  // ⛔ the snapped yaw's nearest alone: a quarter off on a cap turned off the world's axes (§15 F2). A pole held at a mouth (the gizmo not on the cap,
  // W9): the yaw's, as before — the study before step B
  const en = capStack === sh.t.stack && isFreeFace(cap.n, WORLD_UP) ? freeEntry(st, wm, IDENTITY3, at, capStack, st.asmPlaceWas) : null;
  const hs = capTiltHeading(at.assign, at.contour, capStack, cap.n, q.yaw, en?.heading ?? null);
  if (hs === null) return;
  const top = cap.n[1] > 0;
  const delta = Math.atan2(Math.sin(hs - q.yaw), Math.cos(hs - q.yaw));
  const R1 = capTilt(hs, cap.n);
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) THE CAMERA SWINGS FROM THE HEADING SHOWN: the calm carried over the
  // edge (`shownDirAcross`) shows the piece at the calmed heading, not the orbit's — the camera's swing turns THAT to square (the directions' frame by
  // `deltaShown`); the orbit's angles are turned by their own (`D0`, `delta`: the gizmo and the solver exact). ⛔ By the orbit's `delta`: 20° off square, the
  // heading shown −83.7°, the swing started from the orbit's −70° (probed: −101.4°, then back to −90° over 20 frames)
  const sw = dirAt(st, q.yaw, q.v);
  // ⭐⭐⭐ (2026-11-14) …the heading ON THE GLASS (`shownHeading`, the camera drawn last frame) — ⛔ the direction's own horizontal part: steep (a ridge, 66° –
  // 86°) it leans back toward the face just left, 180° from the camera shown after the roll back — the new tilt flipped the picture in one frame
  const hSh = shownHeading(st, sw);
  const deltaShown = hSh !== null ? Math.atan2(Math.sin(hs - hSh), Math.cos(hs - hSh)) : Math.hypot(sw[0], sw[2]) > 1e-3 ? Math.atan2(Math.sin(hs - Math.atan2(sw[2], sw[0])), Math.cos(hs - Math.atan2(sw[2], sw[0]))) : delta;
  // ⭐ (2026-11-10, *"one speed for every tilt"*) the swing's duration: its angle at `tiltRollDegS`
  const swingDurMs = rollDurationMs(deltaShown, st.cfg.tiltRollDegS);
  // ⭐⭐⭐ (2026-11-11) made as the automatic tilt switched on (the camera pending): the camera turn held, then by the finger's travel (`seamTurnStart`)
  const byMm = st.asmTiltPending;
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4c) THE ONE TRANSITION: the direction drawn before the change (the piece's ease starts from it), read before
  // anything moves
  const uWas = drawnDir(st);
  // ⭐⭐⭐ (§12 2.4c) 1. the frame set AT ONCE — `R1` from its first frame, no swing (the heading's swing is part of the one camera turn, below). ⛔ (step
  // 2.5) the swing's state of the game before the charts (`dir` turned by `swingDir`, its clock, share and duration; the roll back's) deleted
  st.asmTilt = { id: ++TILT_SEQ, map: R1, facet: -1, off: false, exit: false, exitAcross: false, heading: hs };
  const map = faceMapOf(st);
  if (map === null) {
    st.asmTilt = null;
    return;
  }
  const gF = mulT(R1, g);
  const fi = facetOfNormal(map, mulT(R1, cap.n), gF);
  st.asmTilt.facet = fi;
  if (st.asmCalm !== null) st.asmCalm = { ...st.asmCalm, n: mulT(R1, st.asmCalm.n) }; // ⭐ (2.4c) the calm's normal into F, as `turnAngles` turned it
  // ⭐⭐⭐ (`1.0.120b-`) the square camera into F (the directions' frame): turned there from where it is, never jumped
  const sqB = st.asmSquare;
  if (sqB.n !== null) sqB.n = mulT(st.asmTilt.map, sqB.n);
  if (sqB.target !== null) sqB.target = mulT(st.asmTilt.map, sqB.target);
  const mq = mapAngles(map, gF, fi, mapOpts(st));
  // ⭐⭐⭐ (§12 2.4c) 2. – 3. the gizmo KEPT, F's angles read at its exact place — EVERY angle state SET to them (`seamRebase`; ⛔ each turned as a direction)
  seamRebase(st, mq);
  const m = mapGizmo(st, mq.yaw, mq.pitch);
  st.asmGOff = null;
  if (m !== null) {
    if (m.t.stack !== fi) st.asmTilt.facet = m.t.stack;
    const v: Vec3 = [g[0] - m.hit.point[0], g[1] - m.hit.point[1], g[2] - m.hit.point[2]];
    if (Math.hypot(v[0], v[1], v[2]) > 1e-6) st.asmGOff = { v, left: 1, timeMs: 0, durMs: Math.max(swingDurMs, rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS)) };
  }
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) THE CALM CARRIED INTO F: the tilted facet's normal at once, the
  // vertical share whole, the horizontal one KEPT — the tilt turns the frame about the edge's own line, which the reading toward it keeps (`shownDirAcross`)
  // ⭐ (the facet the gizmo is on, once `tiltOn` has settled it — ⛔ the provisional `fi` first: a slanted facet's normal, eased across for 20 frames)
  const tf = st.asmTilt.facet;
  if (st.asmCalm !== null && tf >= 0 && map.facets[tf] !== undefined) st.asmCalm = { n: map.facets[tf]!.n, sH: st.asmCalm.sH, sV: 1, wA: 1 };
  st.asmShown = null;
  st.asmFaceBand = null; // ⭐⭐⭐ (2026-11-16, §12 2.4d) a change of frame: the banded facet read afresh at the place's facet in the new map (never held by the band)
  st.asmFree = null; // ⭐⭐⭐ (2026-11-16, step C4) a tilt: no free face carried (never in a zone — `tiltOn` refuses one), no turn of its own
  // ⭐⭐⭐ (§12 2.4c) 4. the picture carried from the pose SHOWN by ONE camera turn, paced as the swing was (made pending: `byMm` — held, then by the finger,
  // then by time; else by time, the gizmo held), and the piece's shown direction eased on the same clock
  // ⭐⭐⭐ (2026-11-18, FO3 S1, §13.7 (d)) a tilt's turn stays today's, by its kind — (2026-11-19, §12 RB1) through the one starter (`turnBegin`)
  turnBegin(st, { paced: false, byMm, uWas, carry: false, tilt: true, stopCoast: false });
  st.lastVerdict = `orbit: the tilted pole (automatic) — the face holding the ${top ? "top" : "bottom"} pole is a side (heading ${Math.round((hs * 180) / Math.PI)}°, swing ${Math.round((delta * 180) / Math.PI)}°)`;
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ (2026-11-14) THE HEADING ON THE GLASS: the world camera's heading read off the frame drawn last (`st.cameraPrev`) — its upright up (the pitch
 * offset taken off: `offsetFrame`'s up0 = cos p·up + sin p·dir) with the direction `u`: H = cos e·u_h − sin e·up0_h (exact for an upright frame, steep or
 * level). `null`: no frame drawn yet.
 */
function shownHeading(st: SceneState, u: Vec3): number | null {
  const cp = st.cameraPrev;
  if (cp === null || cp === undefined) return null;
  const p = (st.cfg.cameraPitchOffsetDeg * Math.PI) / 180;
  const c = Math.cos(p);
  const s = Math.sin(p);
  const u0: Vec3 = [c * cp.up[0] + s * cp.dir[0], c * cp.up[1] + s * cp.dir[1], c * cp.up[2] + s * cp.dir[2]];
  const e = Math.asin(Math.max(-1, Math.min(1, u[1])));
  const hx = Math.cos(e) * u[0] - Math.sin(e) * u0[0];
  const hz = Math.cos(e) * u[2] - Math.sin(e) * u0[2];
  return Math.hypot(hx, hz) > 1e-6 ? Math.atan2(hz, hx) : null;
}

/** ⭐⭐⭐ (2026-11-11) the normal of the face the gizmo is on, out of the tilted frame (off the tilted facet: the face it exits onto) — none: no tilt / no place. */
function exitNormal(st: SceneState): Vec3 | null {
  const tl = st.asmTilt;
  const fm = faceMapOf(st);
  const sh = st.asmShown;
  return tl !== null && fm !== null && sh !== null ? mulM(tl.map, fm.facets[sh.t.stack]!.n) : null;
}

/**
 * ⭐⭐⭐ (§9.4) OFF THE TILTED FACET: the world's frame again — every orbit angle turned into it (the camera already at the world's upright: the exit's
 * share is whole at the edge); the gizmo kept — the world map's angles put at it (`mapAngles`), a relocation there eased by the finger's travel.
 */
function tiltOff(st: SceneState): void {
  const tl = st.asmTilt;
  if (tl === null) return;
  const D = tl.map;
  const byTime = tl.off; // ⭐ (2026-11-10) turned off by distance: the relocation eased by time
  const g = st.asmG;
  const nW = exitNormal(st);
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4c) THE ONE TRANSITION (a place to keep and the world's map there): the direction drawn before the change
  // read before anything moves (the piece's ease starts from it)
  const seam = g !== null && worldFaceMap(st) !== null;
  const uWas = seam ? drawnDir(st) : null;
  // ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §8 — the owner: *"just give an hysteresis of the dy"*) left over the edge AWAY from the tilt's heading (the camera
  // turns round): the dy that crossed held until the gizmo is `edgeHoldMm` deep in the face beyond — the cube's far edges, the heptagon's ridge
  const fmT = faceMapOf(st);
  const nT = fmT !== null && fmT.facets[tl.facet] !== undefined ? mulM(tl.map, fmT.facets[tl.facet]!.n) : null;
  // ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §13, step C5) THE ONE EVENT's hold (`crossingEvent`): the up shown the tilt's own (upright in the tilted
  // frame: `map · y`), the dy that pushed the gizmo out over the edge AND would bring it back — set with the turn (`crossTurn`). ⛔ (step 2.5) the old
  // hold by the tilt's heading (`edgeHoldAt`) deleted with the game before the charts
  const held: 1 | -1 | 0 = !byTime && nW !== null && nT !== null && g !== null ? crossingEvent(mulM(tl.map, [0, 1, 0]), nT, nW, WORLD_UP, st.asmDySign).hold : 0;
  // ⭐⭐⭐ (2026-11-15) LEFT WITH THE ORBIT AT THE WORLD'S POLE (straight above or below: no heading in its direction) its yaw is the heading the camera
  // SHOWS (`shownHeading`; none drawn yet: the tilt's own) — ⛔ none handed: yaw 0, the view rolled there in ONE frame (probed: 90° on `Scene_1`'s top —
  // the automatic tilt on, then off, by the approach; 157° on `Scene_0`'s ridge)
  const hP = shownHeading(st, mulM(D, orbitDir(st.orbit.yaw, st.orbit.elevation))) ?? tl.heading;
  if (!seam) turnAngles(st, (d) => mulM(D, d), Math.atan2(Math.sin(hP), Math.cos(hP)));
  else if (st.asmCalm !== null) st.asmCalm = { ...st.asmCalm, n: mulM(D, st.asmCalm.n) }; // ⭐ (2.4c) the calm's normal out of F, as `turnAngles` turned it
  // ⭐⭐⭐ (`1.0.120b-`) the square camera out of F, as it is
  const sqO = st.asmSquare;
  if (sqO.n !== null) sqO.n = mulM(D, sqO.n);
  if (sqO.target !== null) sqO.target = mulM(D, sqO.target);
  // ⭐⭐⭐ (2026-11-10, the owner: *"Build that one alone"*) THE TURN'S TARGET AT THE CROSSING ITSELF: the face the gizmo crossed onto (`nW`) — so the hold
  // (`squareTurning`) covers the turn from its first frame. ⛔ Left to the next frame's map (the place cleared here): the target stale for a frame, the
  // turn not yet seen — the next finger events moved the gizmo while the camera turned (walked: 11 + 23 mm at the top → side crossing)
  if (nW !== null) sqO.target = nW;
  // ⭐⭐⭐ (2026-11-10) THE CALM CARRIED OUT OF F: over a `b` end (a turn about the edge's line) the new side's normal at once, the horizontal share kept;
  // across, both whole (⛔ both whole always: the calmed yaw released at every exit, then calmed again — a swing there and back)
  if (st.asmCalm !== null) st.asmCalm = tl.exitAcross && nW !== null ? { n: nW, sH: st.asmCalm.sH, sV: 1, wA: 1 } : { ...st.asmCalm, sH: 1, sV: 1 };
  st.asmTilt = null;
  st.asmShown = null;
  st.asmFaceBand = null; // ⭐⭐⭐ (2026-11-16, §12 2.4d) a change of frame: the banded facet read afresh at the place's facet in the new map (never held by the band)
  st.asmGOff = null;
  const wm = faceMapOf(st);
  // ⭐⭐⭐ (§12 2.4c) the gizmo KEPT, the world's angles read at its exact place — at a pole of the world's map (a cap's centre: any yaw) the yaw keeping the
  // heading SHOWN (`poleYawKept`, `hP`) — and EVERY angle state SET to them, the place shown there AT ONCE (`crossTurn`; ⛔ `turnAngles`, each state turned
  // as a direction). ⭐⭐⭐ (2026-11-14, the same flash) the map's place at once: a tilt that follows the exit (a ridge's far face, close in) is made THIS
  // frame (`tiltOn` reads the place) — ⛔ left none: one frame of the world's camera between the two tilts (probed after a dx: −18° then +19.5° back)
  const mq0 = wm !== null && g !== null ? mapAngles(wm, g, facetOfNormal(wm, nW, g), mapOpts(st)) : null;
  const paced = seamOutPaced(tl.off, st.asmTiltAuto, st.cfg.tiltOutBlendMm);
  if (seam && mq0 !== null && g !== null) {
    // ⭐⭐⭐ (2026-11-16, §13, step C5) THE ONE EVENT (`crossTurn`): the rebase, ONE camera turn from the pose shown — ⭐⭐⭐ (§8, step C3, D-T1) LEFT BY
    // DISTANCE (`off`, `seamOutPaced`) with `tiltOutBlendMm` over 0 paced by the approach finger's travel outward, the gizmo free; an edge's exit, a
    // zone's, or 0: timed, the gizmo held — the piece's shown direction eased from the one drawn, the coast stopped, the hold
    crossTurn(st, { at: { mq: poleYawKept(mq0, ORBIT_PITCH_MAX_RAD, hP), g }, uWas, carry: false, paced, hold: held, tilt: true });
  } else {
    if (mq0 !== null && g !== null) {
      st.asmMapQ = mq0;
      const m = mapGizmo(st, mq0.yaw, mq0.pitch);
      if (m !== null) {
        const v: Vec3 = [g[0] - m.hit.point[0], g[1] - m.hit.point[1], g[2] - m.hit.point[2]];
        if (Math.hypot(v[0], v[1], v[2]) > 1e-6) st.asmGOff = { v, left: 1, timeMs: 0, durMs: rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS) };
        st.asmShown = { t: m.t, yaw: mq0.yaw, pitch: mq0.pitch };
        faceBandRead(st, m.t); // ⭐⭐⭐ (2026-11-16, §12 2.4d) the banded facet afresh in the world's map (cleared above)
      }
    } else st.asmMapQ = null;
    // ⭐ (no place to keep — unreachable while a tilt holds one: the turn alone, the angles turned as today)
    crossTurn(st, { at: null, uWas, carry: false, paced, hold: held, tilt: true });
  }
  // ⭐⭐⭐ (2026-11-18, FO3 S1, §13.7 (d)) a tilt's exit stays today's turn, by its kind (`crossTurn`'s `tilt`, 2026-11-19 RB1)
  st.lastVerdict = byTime ? "orbit: the tilt off (out past the threshold) — the world's frame again" : "orbit: off the tilted face — the world's frame again";
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §11 1., §12 "THE ONE TRANSITION" 3.) ONE STATE: EVERY ANGLE STATE SET TO THE CHART'S ANGLES `mq` (a yaw and a pitch in
 * the frame the orbit is in, whatever the chart — the caller has read them at the gizmo's exact place, `mapAngles`): the orbit's, the solver's memory (the
 * ring height, last frame's target), the solved piece's, the spring's at rest, the camera's follow state (its place, its last driver and box, its rates
 * and glides none — a glide is a move still to come, in the old angles), the previous angles — exactly the states `turnAngles` turns — and the map's (`asmMapQ`); the coast stopped. ⛔ Never each state turned as a
 * direction by a rigid rotation with the map's angles left to catch up (`turnAngles`, the root cause: the orbit's place stored twice). The views (the
 * calm, the square camera, the heading held) are the caller's.
 */
export function seamRebase(st: SceneState, mq: { readonly yaw: number; readonly pitch: number }): void {
  const yaw = mq.yaw;
  const v = vOfPitch(mq.pitch);
  st.orbit.reset(yaw, v);
  st.orbitUserV = v;
  st.orbitRawPrev = { yaw, v };
  if (st.pieceQ !== null) st.pieceQ = { ...st.pieceQ, yaw, v };
  if (st.boxSpring !== null) {
    const sp = st.boxSpring;
    st.boxSpring = { at: { ...sp.at, yaw, v }, velYaw: 0, velV: 0, velLnZoom: sp.velLnZoom };
    st.boxOrbit = st.boxSpring.at;
  } else if (st.boxOrbit !== null) st.boxOrbit = { ...st.boxOrbit, yaw, v };
  if (st.cameraLagged !== null) st.cameraLagged = { yaw, v };
  const co = st.cameraOrbit;
  if (co !== null) {
    st.cameraOrbit = {
      ...co,
      cam: { ...co.cam, yaw, v },
      yaw: { ...co.yaw, lastDriver: yaw, lastBox: yaw, vel: 0, glide: null },
      pitch: { ...co.pitch, lastDriver: v, lastBox: v, vel: 0, glide: null },
      yawVel: 0,
      pitchVel: 0,
    };
  }
  st.asmPrevQ = { yaw, v };
  st.asmMapQ = { yaw: mq.yaw, pitch: mq.pitch };
  st.orbitInertia.stop();
}

/**
 * ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §13 — step C5) **THE ONE HALF-TURN EVENT** — the wiring every crossing that turns the
 * camera calls (the tilt's exit, the ridge crossed close in, the spit's change of side, a free face's exit); the site keeps its trigger, its frame and its
 * views (the calm, the square camera, the held heading, the spit's side, the free face's state), and hands:
 * * `at` — the chart's angles read at the gizmo `g` kept (a change of frame; none: the frame unchanged): EVERY angle state set to them (`seamRebase`), the
 *   place shown there at once with its relocation eased if the map's place is not the gizmo, the band read afresh (`faceBandRead`);
 * * ONE camera turn from the pose SHOWN (`asmZoneMix`; none before the first camera frame) — `paced`: the way out of close in paced by the finger
 *   (`seamOutStart`, step C3), else timed at the tilts' one speed, the gizmo held meanwhile (`tiltClampStep`);
 * * the piece's shown direction eased on that turn from the one drawn before the change (`uWas`, `seamEase`) — or, the frame unchanged, the ease running
 *   carried onto it by its rest (`carry`, `easeCarry`);
 * * the coast stopped; `hold` — the dy held (`crossingEvent`, `exitHoldSign`: the one rule; the spit's side: `crossingHold`, §13.3), 0: none — ⭐⭐⭐ (2026-11-18,
 *   `DY_HOLD_REVERSAL.md` §5.3) a hold still on ended too (`holdAtCrossing`: the hold guards the LAST edge crossed; ⛔ left as it was).
 * ⭐ Everything in the MODEL's space (the map, `g`); the camera's pose read only to start the turn from the picture on the glass.
 */
function crossTurn(st: SceneState, c: { readonly at: { readonly mq: { readonly yaw: number; readonly pitch: number }; readonly g: Vec3 } | null; readonly uWas: Vec3 | null; readonly carry: boolean; readonly paced: boolean; readonly hold: 1 | -1 | 0; readonly tilt?: boolean }): void {
  if (c.at !== null) {
    const { mq, g } = c.at;
    seamRebase(st, mq);
    st.asmShown = null;
    st.asmFaceBand = null; // ⭐⭐⭐ (2026-11-16, §12 2.4d) a change of frame: the banded facet read afresh at the place's facet in the new map (never held by the band)
    st.asmGOff = null;
    const m = mapGizmo(st, mq.yaw, mq.pitch);
    if (m !== null) {
      const v: Vec3 = [g[0] - m.hit.point[0], g[1] - m.hit.point[1], g[2] - m.hit.point[2]];
      if (Math.hypot(v[0], v[1], v[2]) > 1e-6) st.asmGOff = { v, left: 1, timeMs: 0, durMs: rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS) };
      st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch };
      faceBandRead(st, m.t);
    }
  }
  // ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB1) the turn, the ease, the coast, the hold (it REPLACES any hold still on — ⛔ a 0 left the last edge's on,
  // `DY_HOLD_REVERSAL.md` §5.3): through the one starter (`turnBegin`)
  turnBegin(st, { paced: c.paced, byMm: false, uWas: c.uWas, carry: c.carry, tilt: c.tilt === true, stopCoast: true, hold: c.hold });
}

/**
 * ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4b, §4.1, §1 "the top and the bottom") OVER A POLE HELD BY AN EDGE OR A POINT — THE ONE TRANSITION, in the
 * world's frame (the trigger `poleCrossingDue`, in `assemblyFrame`): 1. the gizmo KEPT (`asmG`); 2. the far facet at the map's place on the pole
 * (`farFacetAt` — none: no crossing, the orbit stops there as before); 3. the far chart coordinates read there (`poleSeam`, `mapAngles`); 4. every angle state set to
 * them (`seamRebase`); 5. the place shown at them, a relocation eased if the map's place there is not the gizmo; 6. the views — the world camera's held
 * zenith heading read afresh, the calm carried over the edge (`tiltOff`'s: the far face's normal, the vertical share whole, the horizontal one kept), the
 * square camera's target the far face; 7. ONE camera turn from the pose shown (`asmZoneMix`, as `spitStep` starts it — the gizmo held meanwhile by
 * `tiltClampStep`); 8. the dy that crossed held (`edgeHoldAt`, a half turn). ⭐ Everything in the MODEL's space (the world face map, `asmG`, `asmShown`);
 * the camera's pose shown read only to start the turn from the picture on the glass. Returns whether it crossed.
 */
function poleCross(st: SceneState): boolean {
  const wm = worldFaceMap(st);
  const sh = st.asmShown;
  const P = st.asmG;
  if (wm === null || sh === null || P === null) return false;
  const cur = sh.t.stack;
  const n0 = wm.facets[cur]?.n;
  // ⭐ the map's own place on the pole (the contour's, `asmShown.t.surface`: the world's — no tilt, no zone) — ⛔ the gizmo with its real depth or its
  // glide: off the contour's polygons, the far facet not found
  const S = sh.t.surface;
  const seam = poleSeam(wm, cur, S, mapOpts(st));
  if (n0 === undefined || seam === null) return false;
  const nFar = wm.facets[seam.far]!.n;
  const uWas = drawnDir(st); // ⭐ (2.4c) the direction drawn before the crossing: the piece's ease starts from it
  // ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §13, step C5) the hold by the one rule (`crossingEvent`): the up shown the face left's own (a bound face is
  // upright on the glass) — ⛔ `edgeHoldAt` (the far face's level normal over 120° from the yaw, the finger's last dy sign whatever it was)
  const upL = faceOwnUp(n0, WORLD_UP);
  const hold = upL === null ? 0 : crossingEvent(upL, n0, nFar, WORLD_UP, st.asmDySign).hold;
  // the views, the far face's: the world camera's held zenith heading read afresh, the calm carried over the edge, the square camera's target
  st.asmHeadO = null;
  st.asmHeadW = 1;
  st.asmHeadYaw = null;
  const c = st.asmCalm;
  if (c !== null) st.asmCalm = { n: nFar, sH: c.sH, sV: 1, wA: 1, ...(c.poleFade !== undefined ? { poleFade: c.poleFade } : {}) };
  st.asmSquare.target = nFar;
  // THE ONE EVENT: every angle state set to the far face's (the gizmo kept), one camera turn from the pose shown, the piece's direction eased on it (here
  // the gap ~0), the hold
  crossTurn(st, { at: { mq: { yaw: seam.yaw, pitch: seam.pitch }, g: P }, uWas, carry: false, paced: false, hold });
  st.lastVerdict = "orbit: over the pole's edge — the camera turned to the far side (the gizmo held until it completes), then the dy that crossed held";
  st.hudDirty = true;
  return true;
}

/* ⭐⭐⭐ (2026-11-13, `Claude/40_RENDER_SCENE/spec/POLAR_ZONES.md` — the owner's decisions D-Z1 – D-Z7; the rules in `input/polar_zone.ts`) ------------ */

let ZONE_SEQ = 0;

/** ⭐⭐⭐ (D-Z1) THE PLACED SET'S ZONES — on the WORLD's face map, recomputed when the placed set (or a knob) changes: the assembly as it stands. */
function zonesOf(st: SceneState): readonly PolarZone[] {
  const wm = worldFaceMap(st);
  if (wm === null || st.cfg.zoneOn !== 1) return [];
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4a) the zones are the frames the ATLAS takes (`chartZones`, §3 3. – 4.) — ⛔ `polarZones`' detectors
  // (deleted at step 2.5, 2026-11-16, with the game before the charts); the key the atlas's
  const at = atlasOf(st);
  if (at === null) return [];
  const keyA = `atlas#${at.key}`;
  if (st.asmZones !== null && st.asmZones.key === keyA) return st.asmZones.zones;
  const zonesA = chartZones(at.assign, at.contour);
  st.asmZones = { key: keyA, zones: zonesA };
  return zonesA;
}

/**
 * ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §3, §12 2.4a) THE PLACED SET'S ATLAS: the WORLD face map's contour
 * (`chartContour` — the map is built from the parts' MODEL poses, `placedFaces`: never the swayed meshes) and its assignment (`assignCharts`, the
 * defaults with the three zone knobs from the sliders, as `zoneOptsOf`), cached per the world map's key and those knobs — ⭐ computed once per placed set
 * or knob change, never per frame (≈ 10 ms on `Scene_0bis`). `null`: no map.
 */
function atlasOf(st: SceneState): { readonly key: string; readonly contour: readonly ChartFace[]; readonly assign: ChartAssignment } | null {
  const wm = worldFaceMap(st);
  if (wm === null) return null;
  const c = st.cfg;
  const key = `${st.asmWorldMap?.key ?? ""}#${c.zoneUprightMaxDeg}#${c.zoneSpitMinDeg}#${c.zoneWholeShare}`;
  if (st.asmAtlas !== null && st.asmAtlas.key === key) return st.asmAtlas;
  const contour = chartContour(wm);
  const assign = assignCharts(contour, { ...DEFAULT_CHART_OPTS, uprightMaxDeg: c.zoneUprightMaxDeg, spitMinDeg: c.zoneSpitMinDeg, wholeShare: c.zoneWholeShare });
  st.asmAtlas = { key, contour, assign };
  return st.asmAtlas;
}

/** ⭐ Two zones the same (a recomputed set keeps the zone the orbit is in when its facets and axis are unchanged). */
function sameZone(a: PolarZone, b: PolarZone): boolean {
  return a.orientation === b.orientation && a.whole === b.whole && a.axis.every((x, i) => Math.abs(x - b.axis[i]!) < 1e-9) && a.facets.length === b.facets.length && a.facets.every((x, i) => x === b.facets[i]);
}

/**
 * ⭐⭐⭐ (§3.3 5., D-Z5, D-Z7) ONE FRAME OF THE ZONES, before the gizmo: the zone the gizmo is in (`zoneAt` — its world facet, the way past the rim of the
 * zone it was in), a change made when no tilt is under way (one under way is turned off first: a zone has none); the camera's turn advanced.
 */
function zoneStep(st: SceneState, dtMs: number): void {
  const zm = st.asmZoneMix;
  // ⭐ (2026-11-14) from the frame its angle is known (`zoneMixPose` read it: its axis) — ⛔ by the placeholder's 90° first: 20° in the first frame, then 8.5°
  // ⭐⭐⭐ (2026-11-14, the owner's play recording: one-frame rolls of 60 – 100° inside the turns, very fast input) THE TURN BY ANGLE at the tilts' one speed:
  // the angle turned so far (`done`) over the turn's whole angle as it is NOW — ⛔ a share stepped by the angle of the moment: the first frame read 17°, the
  // share leapt to 0.49, the next frame the turn was 167° — 80° in one frame. If the whole grows, the camera keeps its speed toward the new whole
  // ⭐⭐⭐ (2026-11-15, §12 2.4c) a PACED turn (the automatic tilt's entry made pending) advances in `seamTurnFrame`, by its own pace
  // ⭐⭐⭐ (2026-11-16, step C3) …and the way out paced by the fingers (`out`) in `seamOutFrame`
  if (zm !== null && zm.axis !== null && zm.byMm !== true && zm.out === undefined) {
    const degS = st.cfg.tiltRollDegS;
    // ⭐⭐⭐ (2026-11-15, §12 2.4c, the auditor's find) over the transition's WHOLE angle (`turnWhole`: the camera's plus the piece's direction's gap
    // eased on this turn; no ease: the camera's own, as ever)
    const whole = turnWhole(st, zm);
    zm.done = degS > 0 ? Math.min(whole, zm.done + (degS * Math.PI / 180) * (dtMs / 1000)) : whole;
    zm.k = whole > 1e-9 ? Math.min(1, zm.done / whole) : 1;
    if (zm.k >= 1) st.asmZoneMix = null;
  }
  const zones = zonesOf(st);
  const cur = st.asmZone;
  // the zone the orbit is in, from the recomputed set (a seat may have changed it)
  const prev = cur === null ? null : (zones.find((z) => sameZone(z, cur.zone)) ?? null);
  let next: PolarZone | null;
  const wm = worldFaceMap(st);
  const g = st.asmG;
  if (zones.length === 0) next = null;
  else if (wm === null || g === null) next = zones.find((z) => z.whole) ?? prev;
  else {
    const fi = facetOfNormal(wm, st.gizmoNormal ?? null, g);
    const past = prev === null ? Infinity : distanceToFacets(wm, prev.facets, g) * 1000;
    next = zoneAt(zones, fi, prev, past, st.cfg.zoneExitMm);
  }
  if (next === null && cur === null) return;
  if (next !== null && cur !== null && (next === prev || sameZone(next, cur.zone))) {
    if (next !== cur.zone) st.asmZone = { id: cur.id, zone: next };
    return;
  }
  // a tilt under way ends first (its own roll back), the switch the frame after
  if (st.asmTilt !== null) {
    if (!st.asmTilt.off) st.asmTilt.off = true;
    return;
  }
  zoneSwitch(st, next);
}

/**
 * ⭐⭐⭐ (D-Z7) INTO A ZONE'S FRAME (or out to the world's): every orbit angle turned into the new frame (`turnAngles` — the tilt's own), the gizmo KEPT (the
 * new map's angles put at it, `mapAngles`; a relocation there eased), the camera turned from the frame shown at the tilts' one speed (`asmZoneMix`).
 */
function zoneSwitch(st: SceneState, next: PolarZone | null): void {
  const B0 = baseFrame(st);
  const g = st.asmG;
  const n0 = st.gizmoNormal ?? null;
  // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4c) WITH A PLACE SHOWN, THE ONE TRANSITION: the direction drawn before the change read before anything
  // moves (the piece's ease starts from it). ⛔ No place yet (the first frame: `Scene_0bis`'s whole zone entered before any gizmo): the angles turned
  // (`turnAngles`) — there is no second state to disagree with
  const chart = g !== null;
  const uWas = chart ? drawnDir(st) : null;
  const hW = uWas === null ? null : shownHeading(st, uWas);
  st.asmZone = next === null ? null : { id: ++ZONE_SEQ, zone: next };
  const B1 = baseFrame(st);
  const toWorld = (d: Vec3): Vec3 => tiltDir(B0, d);
  const turn = (d: Vec3): Vec3 => (B1 === null ? toWorld(d) : mulT(B1, toWorld(d)));
  const seam = chart && faceMapOf(st) !== null;
  if (!seam) turnAngles(st, turn);
  else if (st.asmCalm !== null) st.asmCalm = { ...st.asmCalm, n: turn(st.asmCalm.n) }; // ⭐ (2.4c) the calm's normal into the new frame, as `turnAngles` turned it
  const sq = st.asmSquare;
  if (sq.n !== null) sq.n = turn(sq.n);
  if (sq.target !== null) sq.target = turn(sq.target);
  st.asmSpitSide = 0;
  st.asmSpitU = null;
  st.asmShown = null;
  st.asmFaceBand = null; // ⭐⭐⭐ (2026-11-16, §12 2.4d) a change of frame: the banded facet read afresh at the place's facet in the new map (never held by the band)
  st.asmFree = null; // ⭐⭐⭐ (2026-11-16, step C4) a zone's switch: no free face carried, no turn of its own (the switch's is the one)
  st.asmGOff = null;
  const map = faceMapOf(st);
  if (map !== null && g !== null) {
    const gF = B1 === null ? g : mulT(B1, g);
    const nF = n0 === null ? null : B1 === null ? n0 : mulT(B1, n0);
    const mq0 = mapAngles(map, gF, facetOfNormal(map, nF, gF), mapOpts(st));
    // ⭐⭐⭐ (§12 2.4c) the gizmo KEPT, the new map's angles read at its exact place — at a pole of the WORLD's map the yaw keeping the heading shown
    // (`poleYawKept`; a zone's own frame: its angles as read) — and EVERY angle state SET to them (`seamRebase`; ⛔ `turnAngles`)
    const mq = seam && B1 === null ? poleYawKept(mq0, ORBIT_PITCH_MAX_RAD, hW) : mq0;
    if (seam) seamRebase(st, mq);
    else st.asmMapQ = mq;
    const m = mapGizmo(st, mq.yaw, mq.pitch);
    if (m !== null) {
      const v: Vec3 = [g[0] - m.hit.point[0], g[1] - m.hit.point[1], g[2] - m.hit.point[2]];
      if (Math.hypot(v[0], v[1], v[2]) > 1e-6) st.asmGOff = { v, left: 1, timeMs: 0, durMs: rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS) };
    }
  } else st.asmMapQ = null;
  // the camera's turn from the frame it shows now (none before the first frame: at once)
  // ⭐⭐⭐ (§12 2.4c) …and the piece's shown direction eased on it — (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB1) through the one starter (`turnBegin`)
  turnBegin(st, { paced: false, byMm: false, uWas: seam ? uWas : null, carry: false, tilt: false, stopCoast: false });
  st.lastVerdict =
    next === null
      ? "orbit: out of the polar zone — the world's frame again"
      : `orbit: polar zone (${next.orientation === "SPIT" ? "spit" : "upright"}${next.whole ? ", the whole assembly" : ""}) — about its axis [${next.axis.map((x) => x.toFixed(2)).join(", ")}], ${next.poles.length} pole${next.poles.length > 1 ? "s" : ""}`;
  st.hudDirty = true;
}

/** ⭐ The spit's zone the orbit is in with its frame (S2 — `null`: none). */
export function spitZone(st: SceneState): PolarZone | null {
  const z = st.asmZone;
  return z !== null && z.zone.orientation === "SPIT" && st.asmTilt === null && baseFrame(st) !== null ? z.zone : null;
}

/** ⭐ (step C4) a spit's holding up: the WORLD's vertical — the camera upright in the world (`TILTED_POLE_CLOSE_IN.md` §3.2) */
const WORLD_UP: Vec3 = [0, 1, 0];

/**
 * ⭐⭐⭐ (2026-11-16, step C4) A FACE MAP'S FACET ON THE ATLAS'S CONTOUR: the facet `fi` of `map` (built in the zone's frame, `B` F → world) — its normal and
 * its polygon's centroid turned into the world, found on the contour (`contourFaceAt`; the MODEL's coordinates, never a drawn mesh). −1: none (no such
 * facet, not a real one).
 */
function contourOfFacet(map: FaceMap, B: Mat3, contour: readonly ChartFace[], fi: number): number {
  const f = map.facets[fi];
  if (f === undefined || !f.real || f.poly.length < 3) return -1;
  let c: Vec3 = [0, 0, 0];
  for (const p of f.poly) c = [c[0] + p[0], c[1] + p[1], c[2] + p[2]];
  const k = 1 / f.poly.length;
  return contourFaceAt(contour, mulM(B, f.n), mulM(B, [c[0] * k, c[1] * k, c[2] * k]));
}

/** ⭐ (C2W) the identity: the world's map turned into the world (`contourOfFacet` on it turns nothing) */
const IDENTITY3: Mat3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/**
 * ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §16 — package C2W: ONE rule for a free face whatever its zone) THE ENTRY ONTO A FREE FACE — the facet
 * `stack` of `map` (built in the frame `B` → world: a spit zone's, or the world's own, `IDENTITY3`) found on the atlas's contour (`contourOfFacet`), and
 * the heading carried in: over the side shared with the place before (`prev`, the map it indexed — another map: none) (`freeEntryHeading` →
 * `entryHeading`: the picture does not turn), else the layout nearest the up SHOWN (the camera drawn last; none drawn: the face's normal — nothing in its
 * plane, the first layout). null: not on the contour, or no layout. Read by a spit's free face (`freeFaceFrame`) and gravity's cap (`tiltOn`). ⭐ The
 * MODEL's coordinates — the maps' facets, the contour; never a drawn mesh.
 */
function freeEntry(st: SceneState, map: FaceMap, B: Mat3, at: { readonly contour: readonly ChartFace[] }, stack: number, prev: { readonly map: FaceMap; readonly stack: number } | null): { readonly ci: number; readonly from: number; readonly heading: Vec3 } | null {
  const ci = contourOfFacet(map, B, at.contour, stack);
  const F = at.contour[ci];
  if (F === undefined) return null;
  const from = prev !== null && prev.map === map ? contourOfFacet(map, B, at.contour, prev.stack) : -1;
  const heading = freeEntryHeading(freeEdges(at.contour, ci, WORLD_UP), from, st.asmCamDrawn?.up ?? F.n, F.n);
  return heading === null ? null : { ci, from, heading };
}

/**
 * ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §3.4 — the owner's D-T2: *"a spit's level faces follow the same rule — no turn in the middle of the bottom
 * face, the half turn at its far edge, the picture unchanged when coming in from a tip"*; step C4) ONE FRAME OF A SPIT'S FREE FACE,
 * at the map's place `t` just set (`assemblyFrame`, after the band's reading), `prev` the place of the frame before with the map it indexed:
 * * no spit zone (none, upright, a tilt): none carried;
 * * a map of another identity (a seat): none, no turn of its own;
 * * ON the free face (its place on it, or within `edgeMarginM` of it — `distanceToFacets`, `onTiltedFacet`'s band, as the tilt's exit): kept — the heading
 *   carried, nothing else;
 * * OFF it — OUT ONE BAND PAST THE EDGE: the exit (`freeFaceExit`);
 * * none carried and the place's own facet FREE (`isFreeFace`, its normal in the world along the vertical) — IN AT THE EDGE: the heading of the side shared
 *   with the previous place's face (`freeEntryHeading` → `entryHeading`: the picture does not turn), else the layout nearest the up SHOWN (the camera drawn
 *   last — the ONE place the camera is read: to continue the picture); ONE camera turn from the pose shown, as `spitStep` starts its own (by the rule close
 *   to nothing; it carries whatever the side's heading had already turned), the gizmo held meanwhile (`tiltClampStep`). No dy hold at an entry. No layout
 *   at all: no entry.
 * ⭐ Everything decided in the MODEL's coordinates — the zone's map (the facets, `t.surface`) turned into the world by `baseFrame`, the atlas's contour.
 */
function freeFaceFrame(st: SceneState, t: MapTarget, prev: { readonly map: FaceMap; readonly stack: number } | null): void {
  const z = spitZone(st);
  const map = z === null ? null : faceMapOf(st);
  const B = baseFrame(st);
  const at = map === null ? null : atlasOf(st);
  if (z === null || map === null || B === null || at === null) {
    st.asmFree = null;
    return;
  }
  if (st.asmFree !== null && st.asmFree.map !== map) {
    // a seat (another map): none carried, no turn of its own — the side read afresh (as at the exit), never a "crossing" against the side before the entry
    st.asmFree = null;
    st.asmSpitSide = 0;
    st.asmSpitU = null;
  }
  const fr = st.asmFree;
  if (fr !== null) {
    const d = t.stack === fr.facet ? 0 : distanceToFacets(map, [fr.facet], t.surface);
    if (onTiltedFacet(t.stack, fr.facet, d, edgeMarginM(st))) {
      // ⭐⭐⭐ (2026-11-18, ES) the gizmo's depth from the entry edge, re-read at its place — the MODEL's (`t.surface` through `B`)
      if (fr.entry !== null) st.asmFree = { ...fr, depth: entryDepth(fr.entry, mulM(B, t.surface)) };
      return;
    }
    freeFaceExit(st, fr, at.contour, contourOfFacet(map, B, at.contour, t.stack));
    return;
  }
  const f = map.facets[t.stack];
  if (f === undefined || !isFreeFace(mulM(B, f.n), WORLD_UP)) return;
  const en = freeEntry(st, map, B, at, t.stack, prev);
  if (en === null) return;
  const { ci, from, heading } = en;
  // ⭐⭐⭐ (2026-11-18, `LEVEL_FACE_ENTRY.md` §15, §16 — ES, the switch `freeEntryUpright`) entered over an edge: the picture kept there, the layout by the
  // face's middle (the camera's frame, `freeShownHeading`); 0, or no edge: the layout at once (as before). Any free face, any outline, any edge
  const entry = st.cfg.freeEntryUpright === 1 ? entryEdgeOf(at.contour, ci, from, WORLD_UP) : null;
  st.asmFree = { map, facet: t.stack, ci, heading, layout: heading, entry, depth: entry === null ? 0 : entryDepth(entry, mulM(B, t.surface)), offset: null, side: 0, turning: false };
  // ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB1) the turn and the ease carried: through the one starter (`turnBegin`)
  turnBegin(st, { paced: false, byMm: false, uWas: null, carry: true, tilt: false, stopCoast: false });
  st.lastVerdict = `orbit: onto the spit's level face — the heading carried in ${from >= 0 && from !== ci ? "over its edge" : "from the picture shown"}`;
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ (2026-11-18, `LEVEL_FACE_ENTRY.md` §15, §16 — package ES, the silent entry) THE HEADING SHOWN on the free face, read by the camera's frame for its
 * direction `uW` (centre → camera, BEFORE the owner's camera offsets), `dtMs` the frame's time: its TARGET `entryBlendHeading` of `uW`'s level part
 * turned by the picture's offset read ONCE at the entry frame (`pictureOffset` of the picture of the frame before carried to this view, `transportUp`
 * — so the entry continues the picture shown, not rolled; none recorded: the layout's), the layout, the gizmo's depth and (cure (a)) the
 * square camera's share SHOWN (`squareShareShown`: close in the layout exactly, far out the blend whole); the heading shown turned toward it so that the
 * picture turns by at most the tilts' one speed a frame (cure (b), `headingStep`) — at the entry frame the blend's value at the entry EDGE (the
 * picture's own far out: the entry silent, a fast finger already deep included); no frame time: the target. Kept in `asmFree.heading` for the exit's turn. No entry edge (the switch 0, or no edge): the heading carried, as before — the step never
 * called. ⛔ (`069682a`) faded by the view's elevation, unbounded a frame: 21° in one frame far out (§10.3). ⛔ The level part of the camera drawn last
 * (as prototyped): the owner's camera offsets (2.5°, 2°) and the side bias made a 3° – 4° turn of the entry. ⛔ The bound camera's picture read every
 * frame: close in its side bias swung the heading across the axis (24° in a frame).
 */
function freeShownHeading(st: SceneState, uW: Vec3, side: number, dtMs: number | undefined): Vec3 {
  const fr = st.asmFree;
  if (fr === null) return [1, 0, 0];
  if (fr.entry === null) return fr.heading;
  const share = squareShareShown(st);
  // ⭐ the side the bound face's camera stood on at the entry, kept for the face (⛔ the side read each frame: it flips across the axis)
  const side0 = fr.offset === null ? side : fr.side;
  // the TARGET: the picture the ENTRY side's bound camera shows HERE (its offset read THIS frame — an exit back over the entry edge, anywhere along it,
  // meets it), the layout by the face's middle
  const offB = pictureOffset(uW, offsetFrame(uW, spitCameraHeading(uW, st.asmZone!.zone.axis, side0), 0, 0).up);
  const target = entryBlendHeading(viewLevelTurned(uW, offB), fr.layout, fr.depth, fr.entry.centreDepth, share, st.cfg.freeEntryUpright);
  let h: Vec3;
  if (fr.offset === null) {
    // ⭐ the entry's first frame: the picture SHOWN the frame before, carried to this view (`transportUp` — not rolled), at the entry EDGE's blend
    const was = st.asmSpitPicWas;
    const offP = was !== null ? pictureOffset(uW, transportUp(was.u, was.up, uW)) : offB;
    h = entryBlendHeading(viewLevelTurned(uW, offP), fr.layout, Math.min(0, fr.depth), fr.entry.centreDepth, share, st.cfg.freeEntryUpright);
  } else if (st.asmZoneMix !== null || fr.turning) {
    // ⭐ a camera turn under way (the entry's own, from the pose shown), or ending this frame: the heading HELD — the turn draws toward a still picture
    // (⛔ stepped meanwhile: the turn's target moved 7° a frame and its first frame showed 9.1°, the 4 px corner loop; ⛔ stepped on the frame the turn
    // lands: its last share and the step in one frame, 9.8°); the step starts the frame after
    h = fr.heading;
  } else h = dtMs === undefined ? target : headingStep(fr.heading, target, dtMs, st.cfg.tiltRollDegS, uW);
  st.asmFree = { ...fr, heading: h, offset: offB, side: side0, turning: st.asmZoneMix !== null };
  return h;
}

/**
 * ⭐⭐⭐ (2026-11-16, step C4) OFF A SPIT'S FREE FACE onto the contour's face `to` (−1: not found): the turn (`exitTurnRad`: the heading carried against
 * that side's layout — 0 back over the entry side, a quarter at a side, a half at the far side; null — not a neighbour: no turn known, it still leaves);
 * ONE camera turn from the pose shown (`asmZoneMix`, at `tiltRollDegS`, the gizmo held meanwhile by `tiltClampStep`) to the spit's own upright camera
 * beyond, the coast stopped; the spit's side read AFRESH there (`asmSpitSide` 0, `asmSpitU` none: `spitStep` reads the camera's side as with `prev` 0 —
 * never a "crossing" on the next frame); the dy held when the turn is over a quarter AND the finger's dy is the one that pushed the gizmo out over that
 * side (`exitHoldSign`, §10 — D-T4; `crossingHold`, its side the face beyond's); none carried.
 */
function freeFaceExit(st: SceneState, fr: NonNullable<SceneState["asmFree"]>, contour: readonly ChartFace[], to: number): void {
  const edges = freeEdges(contour, fr.ci, WORLD_UP);
  const turn = exitTurnRad(fr.heading, edges, to);
  // ⭐⭐⭐ (`TILTED_POLE_CLOSE_IN.md` §10, D-T4) the dy held: the finger's, only if it is the one that pushed the gizmo out over this side (`exitHoldSign`)
  // ⭐⭐⭐ (step C5, §13) through the one rule (`crossingHoldSign`) — over a free face's level side exactly §10's; the gizmo placed (none: no hold, as before)
  const held = st.asmG === null ? 0 : exitHoldSign(fr.heading, edges, to, contour[fr.ci]?.c ?? [0, 0, 0], st.asmDySign);
  st.asmFree = null;
  st.asmSpitSide = 0;
  st.asmSpitU = null;
  // THE ONE EVENT (`crossTurn`): the frame unchanged, one camera turn from the pose shown, the ease running carried, the coast stopped, the hold
  crossTurn(st, { at: null, uWas: null, carry: true, paced: false, hold: held });
  st.lastVerdict = `orbit: off the spit's level face — the camera turned ${turn === null ? "(no layout known)" : `${Math.round((turn * 180) / Math.PI)}°`} (the gizmo held until it completes)`;
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ (§3.5) THE FINGER IN A SPIT (the pointer's `dx`, `fdy` in px — `fdy` up positive; the §8 hold after a crossing already applied): the move read in
 * F's upright screen (`fingerInFrame`: a dx pole to pole, a dy round the axis — the way it goes on the glass). Elsewhere as it is.
 */
export function zoneFinger(st: SceneState, dx: number, fdy: number): { readonly dx: number; readonly fdy: number } {
  const z = spitZone(st);
  // ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §8 UD8b) the finger is on the logic's glass (⛔ R6: `fingerAtEntry` deleted with law U): outside a spit as it is; in a spit read
  // on the frame DRAWN last frame (`asmCamDrawn` — ⭐ R3b: the record `asmCamLast` held it at this moment), as in `1.0.147-` — ⛔ (fix round 1) turned off the
  // picture HERE, after the hold had read the raw glass's dy
  if (z === null) return { dx, fdy };
  const dy = fdy;
  const cf = st.asmCamDrawn;
  if (cf === null) return { dx, fdy: dy };
  // ⭐ F's up on the glass from the orbit's own angles (`cos θ·a − sin θ·d`: the way toward the pole — at the pole itself the way OFF it at the yaw, so a
  // drag that way leaves it; ⛔ the axis projected: undefined there, the last angle kept — the finger turned the yaw unseen, the gizmo stalled at the apex)
  const B = baseFrame(st)!;
  const th = pitchOfV(st.orbit.elevation);
  const yw = st.orbit.yaw;
  const fUp = mulM(B, [-Math.sin(th) * Math.cos(yw), Math.cos(th), -Math.sin(th) * Math.sin(yw)]);
  // ⭐ the camera's view: toward the centre (`dir` is the centre → camera direction) — the glass's right `up × view` (Babylon's left-handed axes)
  const r = fingerInFrame(dx, dy, [-cf.dir[0], -cf.dir[1], -cf.dir[2]], cf.up, fUp, st.asmZoneAlpha);
  st.asmZoneAlpha = r.alpha;
  // ⭐⭐⭐ (2026-11-16, step C4) on a free face the carried heading puts the axis exactly up or across the glass: `fingerInFrame`'s own answer at every pitch
  // — ⛔ the swap (`fingerSwapped`, written for the axis ACROSS the glass): coming in from a tip it sent the dy sideways, across the face's middle
  if (st.asmFree !== null) return { dx: r.dx, fdy: r.dy };
  // ⭐⭐⭐ looking down (from `SPIT_CROSSING_PITCH_RAD`): the swap itself, one finger axis to one of F's (`fingerSwapped`) — a dx never back over the edge
  const uC = cf.dir;
  if (Math.asin(Math.min(1, Math.abs(uC[1]) / Math.max(1e-12, Math.hypot(uC[0], uC[1], uC[2])))) >= SPIT_CROSSING_PITCH_RAD) {
    const sw = fingerSwapped(dx, dy, r.alpha);
    return { dx: sw.dx, fdy: sw.dy };
  }
  return { dx: r.dx, fdy: r.dy };
}

/**
 * ⭐⭐⭐ (2026-11-13, the owner: *"the dy hold happens after the crossing, not before the crossing … replicate the behavior of scene 0 when crossing the
 * zenith edge"*) ONE FRAME OF THE SPIT'S SIDE, before the gizmo: the side of the axis the SHOWN direction is on (`spitSide`); changed — the camera has
 * passed over the axis (the zenith edge, the bottom face's, any): ONE timed turn from the frame shown to the new side's upright one at the tilts' one
 * speed (`asmZoneMix`, `frameMix` — one axis: over a ridge, the ridge's own line), the gizmo held meanwhile (`tiltClampStep`), the coast stopped; and
 * `Scene_0`'s §8 HOLD AFTER THE CROSSING: the dy that crossed held until the gizmo is `edgeHoldMm` deep in the face beyond (`crossingHold`), dx and the
 * other dy free. ⛔ The hold before it (`zoneViewCheck`, the view held at 80°, 2026-11-13 earlier): the gizmo stopped on the ridge, never across.
 */
export function spitStep(st: SceneState, cp: OrbitAt): void {
  const z = spitZone(st);
  if (z === null) {
    st.asmSpitSide = 0;
    st.asmSpitU = null;
    return;
  }
  // ⭐⭐⭐ (2026-11-16, step C4) on a free face no side: no side change, no crossing, no hold in the middle of the face — its exit is the turn
  // (`freeFaceFrame`, which reads the side afresh there)
  if (st.asmFree !== null) return;
  // ⭐⭐⭐ (2026-11-14, the owner: *"dy or dx when the gizmo hit the zenith edge or the middle of the bottom face create hard-to-control movements"*) the
  // side of the axis the camera's direction is on — the SHOWN rule (`dirAt`: the calm's, the square camera's — the camera's heading and the finger's
  // mapping are read off it) at the ORBIT's own angles, the finger's: ⛔ at the piece's (`pieceQ`, its spring): a frame late, the gizmo 14 – 30 mm past the
  // ridge far out; ⛔ the orbit's bare direction (the same day): close in the square camera turned the view over the ridge while the orbit stood 0.17°
  // past it — no side change, no turn, no hold, the next dy mapped back on the turned view: the gizmo bounced between the ridge's two faces every frame
  // ⭐⭐⭐ (2026-11-14, the owner's play recording) …at the CAMERA's own place (`cameraLagged`: the one its heading is built from — `assemblyCameraFrameRaw`):
  // ⛔ at the orbit's (the finger's), a fast finger flipped the side while the camera still looked from the old one — the heading summed the new side's bias
  // with the old side's direction, passed through nothing and flipped: 99 – 102° in one frame mid-turn
  // ⭐⭐⭐ (2026-11-14, the owner's records 1 – 10: "a jump … toward the end of each recording") …at THIS frame's camera place (`cp`: the camera stage calls
  // this just before it builds the frame, `green_box_wiring.ts`) — ⛔ called from the assembly's step, before the camera's orbit step: last frame's place;
  // the camera passed over the axis in the frame, was drawn with the old side's heading (137 – 171° in ONE frame), and the turn began a frame later
  const u = mulM(baseFrame(st)!, calmDir(st, orbitDir(cp.yaw, cp.v)));
  const prev = st.asmSpitSide;
  const side = spitSide(u, z.axis, prev);
  const u0 = st.asmSpitU;
  st.asmSpitSide = side;
  st.asmSpitU = u;
  if (prev === 0 || side === prev) return;
  // ⭐⭐⭐ (2026-11-14) a CROSSING only where the orbit passes OVER or UNDER the axis (`overAxisPitch`, the part of its direction square to the axis steep:
  // the zenith edge, the bottom face's middle); round a tip the side changes silently — and a crossing's hold ends there (it held the way back over an edge
  // the gizmo has now left round the body: the finger's mapping turned with the side)
  // ⭐⭐⭐ (2026-11-14, the owner's records) read on the camera's PATH this frame (`crossingPitch`) — ⛔ at its end alone: a fast finger passed straight under
  // the body and was read 70° beyond, "round a tip" — the side flipped with no turn: 100 – 170° in one frame
  if (crossingPitch(u0, u, z.axis) < SPIT_CROSSING_PITCH_RAD) {
    st.asmEdgeHold = null;
    return;
  }
  const g = st.asmG;
  // §8's hold: the dy that crossed — the finger's last sign (`crossingHold`). ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §13.3, step C5) KEPT under the
  // charts' layout too: the one rule needs the next up the picture turns to, and the side's turn is read off the CAMERA's place, not an edge — the mirror
  // view as that up (built, measured, withdrawn): arrived along the top ridge from a tip the picture turns ~110°, not a mirror; the dy that crossed was
  // judged not to push, was not held, and brought the gizmo straight back over the ridge — a second half turn (the view 124° → 343° in the drag)
  const hold = g === null ? null : crossingHold(st.gizmoNormal ?? null, z.axis, side, st.asmDySign);
  // ⭐⭐⭐ (step C5) THE ONE EVENT (`crossTurn`): the frame unchanged, one camera turn from the pose shown, the ease running carried, the coast stopped, the
  // hold. ⛔ (step 2.5) the old turn and hold of the game before the charts deleted
  crossTurn(st, { at: null, uWas: null, carry: true, paced: false, hold: hold === null ? 0 : hold.sign });
  st.lastVerdict = "orbit: the spit over the edge — the camera turned to the other side (the gizmo held until it completes), then the dy that crossed held";
  st.hudDirty = true;
}

/** ⭐⭐⭐ (2026-11-13, the owner: *"highlight the zone in fuchsia during the runtime so I can always check what it is"*) the zones' colour and its share seen */
const ZONE_FUCHSIA = new Color3(1, 0, 1);
const ZONE_ALPHA = 0.45;
/** ⭐ the fuchsia lifted off the faces (m) — never in them, under the sections' 2 mm */
const ZONE_LIFT_M = 0.0012;

/**
 * ⭐⭐⭐ (the owner: *"highlight the zone in fuchsia during the runtime"*) THE ZONES DRAWN: every zone's facets (the world map's contour polygons, lifted
 * along their normals) in one fuchsia, see-through mesh — rebuilt when the zones change (a seat, a slider), hidden with none or the assembly's orbit off.
 */
function zoneHighlightFrame(st: SceneState): void {
  const zones = zonesOf(st);
  const wm = worldFaceMap(st);
  const key = st.asmZones?.key ?? "";
  if (zones.length === 0 || wm === null) {
    if (st.asmZoneMesh !== null) st.asmZoneMesh.mesh.isVisible = false;
    return;
  }
  if (st.asmZoneMesh !== null && st.asmZoneMesh.key === key) {
    st.asmZoneMesh.mesh.isVisible = true;
    return;
  }
  if (st.asmZoneMesh !== null) {
    st.asmZoneMesh.mesh.material?.dispose();
    st.asmZoneMesh.mesh.dispose();
  }
  const positions: number[] = [];
  const indices: number[] = [];
  for (const z of zones)
    for (const fi of z.facets) {
      const f = wm.facets[fi];
      if (f === undefined || f.poly.length < 3) continue;
      const base = positions.length / 3;
      for (const p of f.poly) positions.push(p[0] + f.n[0] * ZONE_LIFT_M, p[1] + f.n[1] * ZONE_LIFT_M, p[2] + f.n[2] * ZONE_LIFT_M);
      for (let k = 1; k + 1 < f.poly.length; k++) indices.push(base, base + k, base + k + 1);
    }
  const mesh = new Mesh("polar-zones", st.scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.applyToMesh(mesh);
  const mat = new StandardMaterial("polar-zones-mat", st.scene);
  mat.diffuseColor = ZONE_FUCHSIA.clone();
  mat.emissiveColor = ZONE_FUCHSIA.scale(0.6);
  mat.alpha = ZONE_ALPHA;
  mat.backFaceCulling = false;
  mesh.material = mat;
  mesh.isPickable = false;
  st.asmZoneMesh = { key, mesh };
}
