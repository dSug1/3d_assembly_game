/**
 * ⭐⭐⭐ prototype — **THE HOVER, WIRED** (2026-10-14; `input/hover.ts`, `HOVER.md`). A drag that starts ON the orbited piece slides it (and, by
 * default, the yellow gizmo) in the plane of the part face its resting face lies against — only while the two are anti-parallel and in contact;
 * each step solved by the orbit's own clearance rule (the other faces stop and slide it). The camera eases toward the HOVER VIEW with the drag's
 * travel, and back as the orbit comes back. ⛔ No rule here: the decisions are `input/hover.ts`'s and the solver's.
 */
import { toFrame, toWorld } from "../input/orbit_frame";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { RESTING_FACE_COLOUR } from "./colours";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { SceneState } from "./scene_state";
import type { Sample } from "../input";
import { mmToPx } from "../core/units";
import { qRotate, type Quat, type Vec3 } from "../core/vec";
import { bodiesBehindPlane, bodiesWithin, type CollisionSetup } from "../core/collision";
import { composePlacement, faceWorld, invertPlacement } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { pieceCollisionSetup } from "./collision_wiring";
import { AT_CONTACT_M, solveOrbitStep, type OrbitQ } from "../input/piece_orbit_solver";
import {
  HOVER_SPAN_M,
  clampDisc,
  hoverCornerDirection,
  hoverCameraSwing,
  rayPlaneCoords,
  slerpDir,
  planeAxes,
  type Rect2,
  boundStep,
  holdOffBound,
  wayInDue,
  rectsDistance,
  rectComponent,
  rectsBoundary,
  hoverViewEnds,
  HOVER_ALIGN_DEG,
  hoverFaceContact,
  projectOntoPlane,
  settleDepth,
  settleShare,
  hoverContactM,
  hoverPlane,
  hoverViewProgress,
  hoverViewWeight,
  hoverDrawLag,
  hoverWayInLeft,
  startHoverWayIn,
  hoverEndsOn,
  hoverViewRetargets,
  retargetShare,
  behindToleranceM,
  hoverPendingAfter,
  hoverQueryBudget,
  hoverFrictionScale,
  HOVER_FRICTION_SPEED_TAU_S,
  HOVER_OVERSHOOT_M,
  hoverOffered,
  hoverSlidAfterLook,
  slideExits,
  slideHoldsOrbit,
  slideLatches,
  slideRefusedAfter,
  slideViewProgress,
} from "../input/hover";
import { pieceRingRangeM, pieceShownAtRest, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import { syncCentre } from "./camera_rig";
import { angleTo, orbitDir, orbitForCameraDir } from "../input/assembly_orbit";
import { MotionTracker, SwayWatcher, impulseForPeak, swayScale } from "../input";
import { advanceFollow } from "../input/follow";
import { exponentialSmooth, phantomTarget } from "../input/lead";
import { smoothTravel } from "../input/piece_orbit";
import { ORBIT_SWAY_MIN_DEG, orbitSwayDegAt, orbitSwingAxis, placedBarycentre } from "../input/green_box";
import { hoverSwayDeg, slideAlong, slideBlockedVerdict, orbitBandSpent, slideCameraShift, slideOrbitDirOf, SLIDE_WAY_OUT_MIN_RAD, slideOrbitStart, slideOrbitStep, slideOrbitTurnOf } from "../input/hover";
import { swingBlock } from "./sway_pass";
import { worldPlacementOf } from "../core/object_model";
import { goalLocked } from "../input/goal_lock";

/** ⭐ how far the hover looks for a part's face, to name the nearest when it refuses (m) */
const HOVER_LOOK_M = 0.01;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dotv = (p: Vec3, q: Vec3): number => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const lerp3 = (a: Vec3, b: Vec3, w: number): Vec3 => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"sliding is entered directly if the contours highlight (no need to press the piece). A + dy or double finger continues to drive the approach so that the user can exit the sliding mode by moving away the piece"*) — **THE SLIDE MODE** is the orbit around the assembly's (`orbitMode` 0): the slide latches by itself
 * (`slideFrame`), stays on when the finger lifts, every one-finger drag slides; the approach leaves it. ⛔ The gizmo's 2D curve (`orbitMode` 1) keeps the
 * press on the piece.
 */
export function slideModeOn(st: SceneState): boolean {
  return st.cfg.orbitMode === 0;
}

/** ⭐ A first touch (or left press) on the orbited piece: noted — the drag that follows hovers if the piece may (decided past the tap's slop). */
export function hoverPressNote(st: SceneState, pointerId: number, s: Sample): void {
  st.hoverPress = { pointerId, x: s.x, y: s.y };
  // ⭐⭐ (2026-10-16, the owner: *"if the next press is on the piece itself, the sliding setup toggles back on (highlights, sliding mode, etc.)"*) — a press ON the
  // piece after a slide sets it up again: the spent slide cleared, the readiness looked for again at once (a press elsewhere leaves it spent: the drag orbits)
  if (st.hoverSlid) {
    st.hoverSlid = false;
    st.hoverReadyWorld = null;
    st.hoverReadyAt = -Infinity;
  }
  // ⭐⭐ (2026-10-14, *"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value (i don't know what this value shall be) when hover translation"*) the finger's (or the mouse's) own DEADBAND — the orbit drag's band (`orbitDeadbandMm`, its pause, its tremor rule)
  const band = new MotionTracker({ ...st.cfg, motionDeadbandMm: st.cfg.orbitDeadbandMm }, st.cfg.orbitBandRestMs, true);
  band.push(s);
  st.hoverBand = { pointerId, band, sway: new SwayWatcher(st.cfg.swayTurnDeg, st.cfg.pointerNoiseMm) };
}

/** ⭐ The finger lifted: the hover ends (the camera stays in the hover view until the orbit comes back). */
export function hoverRelease(st: SceneState, pointerId: number): void {
  if (st.hover?.pointerId === pointerId && slideModeOn(st)) {
    // ⭐⭐⭐ (2026-11-01) THE SLIDE MODE stays on: the finger let go of it (the piece where it was solved); the next one-finger drag slides again
    st.hover.pointerId = null;
  } else if (st.hover?.pointerId === pointerId) {
    st.hover = null;
    // ⭐⭐⭐ (2026-10-16, *"After a slide, when the press is released, the slide and highlights shall immediately stop. The next press then drives the orbit."*) — the
    // piece drawn where it was SOLVED at once (⛔ it eased on after the lift), and no hover offered until the orbit moved it (`hoverOffered`)
    st.hoverFollow = null;
    st.hoverDraw = null;
    st.hoverSlid = true;
    st.hudDirty = true;
  }
  if (st.hoverPress?.pointerId === pointerId) st.hoverPress = null;
  if (st.hoverBand?.pointerId === pointerId) st.hoverBand = null;
  if (st.hoverSpent === pointerId) st.hoverSpent = null;
}

/** ⭐ The parts within `reachM` of the piece, each with its faces in the world (their ids kept, their triangles — `hoverFaceContact`'s overlap test). */
function hoverCandidates(st: SceneState, reachM: number, setup: CollisionSetup) {
  const b = st.greenBox!;
  // ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 1 (b); the owner: *"slide shall latch only on placed parts"*, Q4) — PLACED parts only (`goalLocked`):
  // ⛔ any body — a loose piece beside the painting lit the contours far from the assembly. Sliding along the placed parts' contours: unchanged.
  return bodiesWithin(st.world, b.name, setup, reachM).filter((x) => goalLocked(x.id, st.goalCommit, true)).map((x) => {
    const obj = st.world.objects.get(x.id);
    const faces = (obj?.faces ?? []).flatMap((f) => {
      const w = faceWorld(st.world, x.id, f.id);
      if (w === null) return [];
      const triangles = faceTrianglesWorld(st, x.id, f.id);
      return [{ faceId: f.id, centre: w.centre, normal: w.normal, ...(triangles === null ? {} : { triangles }) }];
    });
    return { id: x.id, bodyGapM: x.gapM, faces };
  });
}

/** ⭐ (2026-10-14, the hover's second audit) A part's face as triangles in the world (its mesh's topology); `null` with none. */
export function faceTrianglesWorld(st: SceneState, partId: string, faceId: string): [Vec3, Vec3, Vec3][] | null {
  const mesh = st.meshOf.get(partId);
  const place = worldPlacementOf(st.world, partId);
  if (mesh === undefined || place === null) return null;
  const topo = st.topoOf.get(mesh.name) ?? null;
  const face = topo?.faces.find((f) => f.id === faceId);
  if (topo === null || face === undefined) return null;
  const w = (i: number): Vec3 => add(place.position, qRotate(place.orientation, topo.positions[i]!));
  const out: [Vec3, Vec3, Vec3][] = [];
  for (let k = 0; k + 2 < face.triangles.length; k += 3) out.push([w(face.triangles[k]!), w(face.triangles[k + 1]!), w(face.triangles[k + 2]!)]);
  return out;
}

/** ⭐⭐ (2026-10-14) The resting face's outline in the world with its centre at `anchor`, the piece turned `rot`. */
function restingPolyWorld(st: SceneState, anchor: Vec3, rot: Quat): Vec3[] {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined) return [];
  return p.restingEdges.flatMap((e) => e.map((q) => add(anchor, qRotate(rot, [q[0] - p.restingCentre[0], q[1] - p.restingCentre[1], q[2] - p.restingCentre[2]]))));
}

/** ⭐⭐ (2026-10-14) Every part's face lying in the hosting face's plane (normal `n`, the contour's `level`), with its coloured triangles. */
const COPLANAR_M = 0.0005;
function coplanarFaces(st: SceneState, n: Vec3, level: number): { id: string; faceId: string; tris: [Vec3, Vec3, Vec3][] }[] {
  const out: { id: string; faceId: string; tris: [Vec3, Vec3, Vec3][] }[] = [];
  for (const [id, obj] of st.world.objects) {
    if (obj.orbited === true || obj.frozen === true) continue;
    for (const f of obj.faces) {
      const w = faceWorld(st.world, id, f.id);
      if (w === null || w.normal[0] * n[0] + w.normal[1] * n[1] + w.normal[2] * n[2] < 0.9998) continue;
      if (Math.abs(w.normal[0] * w.centre[0] + w.normal[1] * w.centre[1] + w.normal[2] * w.centre[2] - level) > COPLANAR_M) continue;
      const tris = faceTrianglesWorld(st, id, f.id);
      if (tris !== null && tris.length > 0) out.push({ id, faceId: f.id, tris });
    }
  }
  return out;
}

/**
 * ⭐ May the drag hover? The resting face looking at a part's face, anti-parallel, within reach, over it (`hoverFaceContact`); then the hover
 * starts. `"wait"`: the shown piece is still easing onto its solved place — the drag does nothing yet and asks again.
 */
function hoverStart(st: SceneState, pointerId: number | null): boolean | "wait" {
  const b = st.greenBox;
  const p = st.orbitPieces.find((o) => o.mesh === b);
  // ⭐ (2026-10-14, *"I can't hover translate in the attached configuration. Make sure the threshold distance is between resting face and collision face. Or check what else is bugging. The green piece should hover translate on the blue part's vertical face."*) every refusal SAYS why on the HUD's `last` line
  const refuse = (why: string): false => {
    st.lastVerdict = `hover: ${why} — the drag orbits`;
    st.hudDirty = true;
    return false;
  };
  if (b === null || p === undefined || p.restingFace === null || st.pieceAnchor === null) return refuse("no orbited piece with a resting face");
  if (!slideModeOn(st) && !hoverOffered(st.hoverSlid)) return refuse("the slide just ended");
  if (st.orbitPiecePlaced) return refuse("the piece is placed in its goal");
  const q = st.pieceQ;
  if (q === null) return refuse("the piece is not on its ring (the way in or out round a piece)");
  if (st.pieceOrbit !== null || st.pieceEntry !== null || st.centreReturn !== null) return refuse("the orbit round the piece is on");
  // ⭐ (2026-11-01) in the slide mode a held second touch is the approach: the slide may latch under it
  if (st.hold !== null && !slideModeOn(st)) return refuse("a second touch is held");
  if (st.restAlign !== null) return refuse("a turn is playing");
  // ⭐⭐ (2026-10-14, the hover's second audit) the shown piece AT REST on its solved place — the hover starts from where the piece IS (still easing: wait)
  if (!pieceShownAtRest(st, q)) {
    st.lastVerdict = "hover: waiting for the piece to come to rest";
    st.hudDirty = true;
    return "wait";
  }
  const anchor = ringAnchorAt(st, q);
  const r = b.rotationQuaternion ?? Quaternion.Identity();
  const rot: Quat = [r.w, r.x, r.y, r.z];
  const restingW = qRotate(rot, p.restingFace.normal);
  const opt = pieceSolveOptions(st);
  const maxGap = hoverContactM(opt.gapM, AT_CONTACT_M);
  const setup = pieceCollisionSetup(st);
  // ⭐⭐ the resting face against a part's FACE: their own planes, their own distance (`hoverFaceContact`) — the parts within 10 mm looked at
  // ⭐⭐ (*"I think the contact check is too strict. It is difficult for the user to judge the contact depending on the camera view. Also, it may be difficult to achieve the contact based only on orbit movement. Propose something to ease the contact and its perception by the user"* → *"Build A&B"*) A — within the hover's REACH, not only touching: the piece will SETTLE onto the face first
  const reach = Math.max(maxGap, st.cfg.hoverApproachMm / 1000);
  const found = hoverFaceContact(anchor, restingW, hoverCandidates(st, Math.max(reach, HOVER_LOOK_M), setup), reach, HOVER_ALIGN_DEG, restingPolyWorld(st, anchor, rot));
  const c = found.contact;
  if (c === null) {
    const nr = found.nearest;
    return refuse(
      nr === null
        ? `the resting face faces no part within ${HOVER_LOOK_M * 1000} mm`
        : !nr.overFace
          ? `no part of the resting face is over ${nr.id}'s face (beside it)`
          : `the resting face is ${(nr.planeGapM * 1000).toFixed(1)} mm from ${nr.id}'s face, ${nr.angleDeg.toFixed(1)}° off anti-parallel (needs ≤ ${(reach * 1000).toFixed(0)} mm and ≤ ${HOVER_ALIGN_DEG}°)`,
    );
  }
  const right = st.camera.getDirection(new Vector3(1, 0, 0));
  const plane = hoverPlane(c.normal, [right.x, right.y, right.z]);
  if (plane === null) return refuse("the face is edge-on to the screen");
  // ⭐⭐⭐ (2026-10-14, the hover's second audit) the orbit's backlog DROPPED: its target, its height and its coast are the piece's place (the orbit holds still under the hover)
  st.orbit.reset(q.yaw, q.v);
  st.orbitInertia.stop();
  st.orbitUserV = q.v;
  st.orbitRawPrev = { yaw: q.yaw, v: q.v };
  const centre0: Vec3 = [st.orbitCentreM.x, st.orbitCentreM.y, st.orbitCentreM.z];
  // ⭐⭐ A — THE SETTLE: not yet in contact, the piece goes down the face's normal to the gap kept — SOLVED (the face's own part, and every
  // other, stops it); ⭐ (2026-10-14, the hover's second audit) the MODEL settled at once, the mesh drawn easing down over HOVER_SETTLE_MS (`hoverFrame`); its queries counted
  let settleM = 0;
  if (c.gapM > maxGap) {
    const down = (x: OrbitQ): Vec3 => add(anchor, scale(c.normal, -x.yaw));
    const s = solveOrbitStep({ yaw: 0, v: 0.5, zoom: 1 }, [settleDepth(c.gapM, opt.gapM), 0], pieceSolverEnv(st, down, setup), opt);
    st.pieceQueriesCarry += s.queries;
    settleM = Math.max(0, s.q.yaw);
  }
  const settled: Vec3 = add(anchor, scale(c.normal, -settleM));
  // ⭐⭐ (*"make sure that if collision faces are coplanar, the hover can continue over several parts' collision faces, provided within the max hover distance … the piece should be able to slide over the two white and one black parts"*) the parts lying wholly behind the contact face's plane are out of the hover's checks: the piece slides across coplanar faces
  // ⭐⭐ (2026-10-14, the hover's second audit) "behind" within what the piece's own height above the plane allows (`behindToleranceM`)
  const level = c.normal[0] * c.centre[0] + c.normal[1] * c.centre[1] + c.normal[2] * c.centre[2]; // the FACE's own plane
  const behind = bodiesBehindPlane(st.world, setup, c.normal, level, behindToleranceM(c.gapM - settleM, opt.gapM / 2));
  behind.delete(b.name);
  st.hover = { pointerId, level, approach0: st.approach, n: c.normal, e1: plane.e1, e2: plane.e2, origin: settled, u: 0, v: 0, pending: [0, 0], finger: [0, 0], speedMmS: 0, behind, bound: coplanarBoundary(st, c.normal, c.centre, c.id, c.faceId) };
  // ⭐ the drawn offset FOLLOWS the solved one, as a translated part's mesh follows its model (`render_loop`'s follower)
  // ⭐⭐⭐ (2026-11-01, the owner: *"gizmo moves with the sliding so the exit of the sliding mode shall be from the new gizmo position"*) — in the slide mode the
  // gizmo always rides the slide (`hoverGizmoMove` 1); the approach and the orbit go on from where it left it
  st.hoverFollow = { view0: null, e1: plane.e1, e2: plane.e2, n: c.normal, settleM, settleT0: performance.now(), centre0, offset0: st.hoverOffset ?? [0, 0, 0], gizmo: slideModeOn(st) || st.cfg.hoverGizmoMove === 1, u: 0, v: 0, fu: { x: 0, v: 0 }, fv: { x: 0, v: 0 }, vu: 0, vv: 0, lu: 0, lv: 0, du: 0, dv: 0 };
  applyHoverModel(st, st.hoverFollow, scale(c.normal, -settleM), [0, 0, 0]);
  st.hoverDraw = scale(c.normal, settleM);
  st.hoverWayIn = null; // a new hover takes the offset as it stands
  // ⭐⭐ (2026-10-14, the hover's audit) a hover on ANOTHER face retargets the view, eased from the one it leaves (`hoverViewRetargets`)
  // ⭐⭐⭐ (2026-10-14, *"I am not satisfied with the camera movements when toggling back and forth between hover and orbit. There is too much mismatch between the camera position in hover and the rings and as a consequence when toggling into hover the piece flies away from the press and when toggling into orbit the camera has a very complex move. Disregard the requirement of camera placement during hover. I want to implement a camera position during hover which provides a good isometric view of the piece and sliding surface with minimum movement from the orbit ring (therefore during hover the camera can be on the left or the right of the piece, on the bottom or on the top of the piece) and also which can simply smoothly easily blend back into orbit rings."*) the NEAREST ISOMETRIC CORNER of the hosting face, on the side the camera already is
  const cam = st.camera.position;
  const hv0 = st.hoverView;
  const toCam: Vec3 = [cam.x - anchor[0], cam.y - anchor[1], cam.z - anchor[2]];
  const corner = hoverCornerDirection(c.normal, [right.x, right.y, right.z], toCam, hv0?.signs ?? null);
  if (corner !== null) {
    // ⭐⭐⭐ (2026-11-01) THE SLIDE MODE: no frozen corner — the LIMITED ORBIT begun where the camera is (`slideOrbitStart`), turned by the slide (`slideOrbitMove`)
    const orbit = slideModeOn(st) ? slideOrbitStart(c.normal, plane.e1, plane.e2, toCam) : null;
    // ⭐⭐⭐ (2026-11-01, *"option A"*) over a horizontal face by the orbit's own yaw and pitch (`SlideTop`) — ⛔ near straight above the picture spun
    const iso = orbit !== null ? slideOrbitDirOf(orbit, c.normal, plane.e1, plane.e2, orbit.a) : corner.dir;
    const orbitShown: [number, number] = orbit !== null ? [orbit.a[0], orbit.a[1]] : [0, 0];
    if (hv0 === null) st.hoverView = { progress: 0, shown: 0, shownVel: 0, at: performance.now(), target: [anchor[0], anchor[1], anchor[2]], n: c.normal, e1: plane.e1, e2: plane.e2, iso, signs: corner.signs, from: null, orbit, orbitShown };
    else if (hoverViewRetargets(hv0.n, c.normal, hv0.target, [anchor[0], anchor[1], anchor[2]]))
      st.hoverView = { progress: hv0.progress, shown: hv0.shown, shownVel: hv0.shownVel, at: hv0.at, target: [anchor[0], anchor[1], anchor[2]], n: c.normal, e1: plane.e1, e2: plane.e2, iso, signs: corner.signs, from: { target: hv0.target, iso: shownDir(hv0), t0: performance.now() }, orbit, orbitShown };
  }
  st.hoverFollow.view0 = st.hoverView === null ? null : [st.hoverView.target[0], st.hoverView.target[1], st.hoverView.target[2]];
  st.lastVerdict = `${pointerId === null ? "slide: on — latched" : "hover:"} on ${c.id}'s face (${(c.gapM * 1000).toFixed(1)} mm${settleM > 0 ? `, settled ${(settleM * 1000).toFixed(1)} mm onto it` : ""}) — the drag slides the ${st.hoverFollow.gizmo ? "gizmo and the piece" : "piece"}`;
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐ One move of a finger that pressed on the orbited piece: `true` when the hover took it (or it is still a possible tap, or the piece is
 * still easing — nothing moves), `false` to let the orbit have it. ⭐⭐ (2026-10-14, the hover's second audit) the step is ADDED to the hover's pending target — solved once a
 * frame by `hoverFrame`, inside the frame's budget.
 */
export function hoverDragStep(st: SceneState, pointerId: number, s: Sample, prev: Sample): boolean {
  const took = hoverDragTake(st, pointerId, s, prev);
  // ⭐⭐⭐ (2026-11-01, *"A is pressed again: the piece flies away"*) a move the slide took spends the orbit's band for this pointer (`orbitBandSpent`)
  if (orbitBandSpent(took, st.orbitMotion?.pointerId ?? null, pointerId)) st.orbitMotion = null;
  return took;
}

function hoverDragTake(st: SceneState, pointerId: number, s: Sample, prev: Sample): boolean {
  // ⭐⭐ (2026-10-14, the hover's second audit) a hover that ended in a CAPTURE spends its finger: it moves nothing more until it lifts (`D139`: a snap stops the drag that made it)
  if (st.hoverSpent === pointerId) return true;
  // ⭐⭐⭐ (2026-11-01) the lit contours HOLD the orbit (`slideHoldsOrbit`): the finger's orbit step dropped until the slide latches (it takes this finger then)
  if (slideModeOn(st) && slideHoldsOrbit(st.hoverReady !== null, st.slideArmed, st.orbitPiecePlaced, st.hover !== null, st.slideRefused, st.orbitShift)) {
    slideHoldOrbit(st);
    return true;
  }
  const slide = slideModeOn(st) && st.hover !== null;
  // ⭐⭐⭐ (2026-11-01) in the slide mode A + drag is the approach: the finger off the slide, the drag to the orbit's (its dy the approach)
  if (slide && st.orbitShift) {
    if (st.hover!.pointerId === pointerId) slideDetach(st);
    if (st.hoverPress?.pointerId === pointerId) st.hoverPress = null;
    return false;
  }
  // ⭐⭐⭐ (2026-11-01) THE SLIDE MODE ON with no finger on it: ANY one-finger drag takes it (pressed on the piece or not) — its deadband from here
  if (slide && st.hover!.pointerId === null && st.hoverPress?.pointerId !== pointerId) {
    hoverPressNote(st, pointerId, s);
    return true;
  }
  const hb = st.hoverBand?.pointerId === pointerId ? st.hoverBand : null;
  if (hb !== null) hb.band.push(s);
  if (st.hover?.pointerId !== pointerId) {
    const hp = st.hoverPress;
    if (hp === null || hp.pointerId !== pointerId) return false;
    if (slide && st.hover!.pointerId === null) {
      // ⭐⭐⭐ (2026-11-01) the slide mode's finger: the slide as it stands, the PRESS's place the base (the band's deadband counts from it)
      // ⭐⭐ (2026-11-01, the owner: *"sometimes, the slide is stuck"* → *"a"*) taken at its FIRST move, this move sliding already — ⛔ held as a possible
      // tap for 8 mm (`doubleTapSlop`): every slide drag began 8 mm late, and a short careful one (under ~30 px on a desktop) moved nothing
      const h0 = st.hover!;
      h0.pointerId = pointerId;
      h0.finger = [hp.x, hp.y];
      h0.speedMmS = 0;
      st.hoverPress = null;
    } else {
      if (Math.hypot(s.x - hp.x, s.y - hp.y) < mmToPx(st.cfg.doubleTapSlop)) return true; // still a possible tap: nothing moves
      const ok = hoverStart(st, pointerId);
      if (ok === "wait") return true; // the piece still easing: asked again on the next move
      st.hoverPress = null;
      if (!ok) {
        st.hoverBand = null;
        return false;
      }
      // ⭐⭐ (2026-10-14) the finger's place when the hover began: its ray's point on the plane is the base
      st.hover!.finger = [s.x, s.y];
      return true;
    }
  }
  const h = st.hover!;
  if (st.greenBox === null) return false;
  // ⭐⭐ through the DEADBAND: a wobble on the axis the finger is not moving emits nothing
  const step = hb !== null ? hb.band.step : { dx: 0, dy: 0 };
  const dx = step.dx;
  const dy = step.dy;
  // ⭐⭐ (2026-10-16, the friction) the finger's glass speed (mm/s), smoothed — read even on a still step, so it decays when the finger rests
  const dtS = (s.t - prev.t) / 1000;
  if (dtS > 0) h.speedMmS = exponentialSmooth(h.speedMmS, Math.hypot(dx, dy) / mmToPx(1) / dtS, HOVER_FRICTION_SPEED_TAU_S, dtS);
  if (dx === 0 && dy === 0) return true;
  // ⭐⭐⭐ (2026-10-14, *"I am not satisfied with the camera movements when toggling back and forth between hover and orbit. There is too much mismatch between the camera position in hover and the rings and as a consequence when toggling into hover the piece flies away from the press and when toggling into orbit the camera has a very complex move. Disregard the requirement of camera placement during hover. I want to implement a camera position during hover which provides a good isometric view of the piece and sliding surface with minimum movement from the orbit ring (therefore during hover the camera can be on the left or the right of the piece, on the bottom or on the top of the piece) and also which can simply smoothly easily blend back into orbit rings."*) the finger's RAY on the hover's plane: the piece moves by what that point moved (× `hoverGain`), so it stays
  // under the finger while the camera turns; the finger's place on the glass is its deadbanded one
  const from: [number, number] = [h.finger[0], h.finger[1]];
  h.finger = [h.finger[0] + dx, h.finger[1] + dy];
  const was: [number, number] = [h.pending[0], h.pending[1]];
  // ⭐ the ray grazing the plane (a face seen nearly edge-on): the piece waits — the camera still turns toward the corner below, which sees the
  // face at 35°, and the next good point is the new base
  const onPlane = hoverFingerStep(st, h, from);
  const asked = add(scale(h.e1, h.pending[0] - was[0]), scale(h.e2, h.pending[1] - was[1]));
  // ⭐⭐ (*"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value (i don't know what this value shall be) when hover translation"*) the other parts SWAY at the least angle — a hover is a slide along a part (`hoverSwayDeg`), about the placed parts
  // ⭐⭐⭐ (2026-11-01, the owner: *"When I slide, i want to remove the translation sway of the assembly and the camera position freeze and replace that with a limited orbit of the camera"*) — in the slide
  // mode the step turns the camera's limited orbit, and the assembly sways as for the orbit (`slideOrbitMove`)
  if (hb !== null && onPlane) {
    if (slideModeOn(st)) slideOrbitMove(st, hb.sway, s, asked, Math.hypot(dx, dy));
    else hoverSway(st, hb.sway, s, asked, Math.hypot(dx, dy));
  }
  // the camera eases toward the hover view with the finger's travel
  // ⭐ (2026-11-01) in the slide mode by time (`slideFrame`)
  const hv = st.hoverView;
  if (hv !== null && !slideModeOn(st)) hv.progress = hoverViewProgress(hv.progress, Math.hypot(dx, dy) / mmToPx(1), 1 / Math.max(1e-6, st.cfg.pieceOrbitEnterMm), true);
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐ (2026-10-14) The finger's STEP on the hover's plane: the rays through where it was (`from`) and where it is now, both cast from the camera
 * AS IT IS (`rayPlaneCoords`) — the plane distance between their two points, × `hoverGain`, added to the pending target and held in the
 * amplitude's disc. So only the FINGER moves the piece (a camera turning while the finger rests moves nothing — ⛔ an absolute "point under the
 * finger" swept the piece 0.23 m across the plane as the camera turned, headless), and the step is the exact one under the finger for the
 * camera of the moment. Either ray grazing the plane (or behind the camera): `false`, nothing.
 */
function hoverFingerStep(st: SceneState, h: NonNullable<SceneState["hover"]>, from: readonly [number, number]): boolean {
  const at = (x: number, y: number) => {
    const ray = st.scene.createPickingRay(x, y, null, st.camera);
    return rayPlaneCoords([ray.origin.x, ray.origin.y, ray.origin.z], [ray.direction.x, ray.direction.y, ray.direction.z], h.origin, h.n, h.e1, h.e2);
  };
  let a = at(from[0], from[1]);
  let b = at(h.finger[0], h.finger[1]);
  if ((a === null || b === null) && slideModeOn(st)) {
    // ⭐⭐⭐ (2026-11-01, the owner: *"although the slide contours are highlighted, the slide is blocked. fix it."*) — the finger's rays grazing the face
    // (a finger far off the piece on a steep view): the same step taken at the SCREEN'S CENTRE, where the slide view looks (at the face from its corner
    // at most, `slideOrbitStart`) — ⛔ nothing moved, and nothing turned the view
    const cv = st.scene.getEngine().getRenderingCanvas();
    const cx = (cv?.clientWidth ?? 0) / 2;
    const cy = (cv?.clientHeight ?? 0) / 2;
    a = at(cx, cy);
    b = at(cx + h.finger[0] - from[0], cy + h.finger[1] - from[1]);
  }
  if (a === null || b === null) return false;
  const g = st.cfg.hoverGain;
  // ⭐⭐ (2026-10-16, the owner: *"can you also add some friction ? (different from inertia)"* → *"Kinetic (drag)"*) — the step scaled by the kinetic
  // friction of the finger's speed: the piece falls behind a slow finger (the finger keeps its own place, so the ray stays exact)
  const k = hoverFrictionScale(h.speedMmS, st.cfg.hoverFrictionMmS);
  h.pending = clampDisc(h.pending[0] + k * g * (b[0] - a[0]), h.pending[1] + k * g * (b[1] - a[1]), st.cfg.hoverAmplitudeMm);
  return true;
}

/**
 * ⭐⭐⭐ (2026-11-01) THE SLIDE'S LIMITED ORBIT, one step: the camera's angles turned the way the piece went (`slideOrbitTurn`, `slideOrbitDegPerMm` per mm of
 * finger), clamped at the isometric corner (`slideOrbitStep`); while the camera turns, the assembly SWAYS AS FOR THE ORBIT (*"apply the orbit sway of the
 * assembly as for the normal orbit (i think there is an attenuation gain based on the distance of the piece from the gizmo)"*): the orbit's trigger,
 * its angle by the piece's distance to the gizmo (`orbitSwayDegAt`), about the placed parts' barycentre, in the sense the camera goes round.
 */
function slideOrbitMove(st: SceneState, watcher: SwayWatcher, s: Sample, moved: Vec3, travelPx: number): void {
  const hv = st.hoverView;
  const kick = watcher.push(s, travelPx > 0, true);
  if (hv === null || hv.orbit === null) return;
  const before = hv.iso;
  hv.orbit = slideOrbitStep(hv.orbit, slideOrbitTurnOf(hv.orbit, moved, hv.e1, hv.e2, travelPx / mmToPx(1), st.cfg.slideOrbitDegPerMm));
  hv.iso = slideOrbitDirOf(hv.orbit, hv.n, hv.e1, hv.e2, hv.orbit.a);
  const b = st.greenBox;
  if (!kick || b === null || !(st.cfg.orbitSwayDeg > 0) || Math.hypot(hv.iso[0] - before[0], hv.iso[1] - before[1], hv.iso[2] - before[2]) < 1e-9) return;
  const c = st.orbitCentreM;
  const a = st.pieceAnchor ?? [b.position.x, b.position.y, b.position.z];
  const range = pieceRingRangeM(st);
  const deg = orbitSwayDegAt(st.cfg.orbitSwayDeg, Math.hypot(a[0] - c.x, a[1] - c.y, a[2] - c.z), range.minM, range.maxM, false);
  const placed: Vec3[] = [];
  for (const id of st.world.objects.keys()) {
    if (!st.goalCommit.has(id)) continue;
    const w = worldPlacementOf(st.world, id);
    if (w !== null) placed.push(w.position);
  }
  const pivot = placedBarycentre(placed) ?? st.centreBlend.targetM;
  const cam = st.camera.position;
  const d = Math.hypot(cam.x - hv.target[0], cam.y - hv.target[1], cam.z - hv.target[2]);
  const axis = orbitSwingAxis(pivot, add(hv.target, scale(before, d)), add(hv.target, scale(hv.iso, d)));
  const impulse = impulseForPeak(((deg * Math.PI) / 180) * swayScale(kick.speedMmPerS, st.cfg.swayReferenceSpeedMmPerS), st.cfg.orbitSwayTauMs / 1000);
  if (axis === null || impulse <= 0) return;
  swingBlock(st, b, { x: pivot[0], y: pivot[1], z: pivot[2] }, axis, impulse, st.cfg.orbitSwayTauMs);
  st.orbitSwayKicks++;
}

/** ⭐ (2026-11-01) The view's direction as SHOWN: the slide's limited orbit at its shown angles, else the corner. */
function shownDir(hv: NonNullable<SceneState["hoverView"]>): Vec3 {
  return hv.orbit !== null ? slideOrbitDirOf(hv.orbit, hv.n, hv.e1, hv.e2, hv.orbitShown) : hv.iso;
}

/** ⭐ The hover's sway kick: the held body's own trigger on the hover finger, the swing at `hoverSwayDeg`, carried the way the piece moves. */
function hoverSway(st: SceneState, watcher: SwayWatcher, s: Sample, moved: Vec3, travelPx: number): void {
  const b = st.greenBox;
  const deg = hoverSwayDeg(st.cfg.orbitSwayDeg, ORBIT_SWAY_MIN_DEG);
  if (b === null || deg <= 0 || Math.hypot(moved[0], moved[1], moved[2]) < 1e-9) return;
  const kick = watcher.push(s, travelPx > 0, true);
  if (!kick) return;
  const placed: Vec3[] = [];
  for (const id of st.world.objects.keys()) {
    if (!st.goalCommit.has(id)) continue;
    const w = worldPlacementOf(st.world, id);
    if (w !== null) placed.push(w.position);
  }
  const c = st.centreBlend.targetM;
  const pivot = placedBarycentre(placed) ?? c;
  const box: Vec3 = [b.position.x, b.position.y, b.position.z];
  const axis = orbitSwingAxis(pivot, box, add(box, moved));
  const impulse = impulseForPeak(((deg * Math.PI) / 180) * swayScale(kick.speedMmPerS, st.cfg.swayReferenceSpeedMmPerS), st.cfg.orbitSwayTauMs / 1000);
  if (axis === null || impulse <= 0) return;
  swingBlock(st, b, { x: pivot[0], y: pivot[1], z: pivot[2] }, axis, impulse, st.cfg.orbitSwayTauMs);
  st.orbitSwayKicks++;
}

/**
 * ⭐⭐ Each frame: the hover's pending target SOLVED once (`hoverSolve`, inside the frame's budget) — the MODEL its solved offset, the gizmo
 * moved (the piece riding it) or the piece alone; the part translation's follower (`translateInertiaMs`, `translateDampingRatio`, the phantom
 * lead `translateLeadMs`) only DRAWS it, its lag kept behind the solved place (`hoverDrawLag`), the settle drawn easing down
 * (`st.hoverDraw`). Once the finger lifted and the drawn lag is gone, it ends. A held second touch or a capture ends it at once
 * (`hoverEndsOn`). The hover finger's deadband ticked (a still finger sends no event).
 */
export function hoverFrame(st: SceneState, now: number, dtSec: number): void {
  if (st.hoverBand !== null) st.hoverBand.band.tick(now);
  if (slideModeOn(st)) slideFrame(st, now, dtSec);
  // ⭐⭐ (2026-10-14, the hover's audit) a held second touch, or the capture: the hover ends now, at its solved place (⭐ 2026-11-01 in the slide mode the capture only)
  if ((st.hover !== null || st.hoverFollow !== null) && hoverEndsOn(st.hold !== null, st.orbitPiecePlaced, slideModeOn(st))) {
    hoverEndNow(st);
    return;
  }
  const h = st.hover;
  const hf = st.hoverFollow;
  if (h !== null && hf !== null && Math.abs(h.pending[0] - h.u) + Math.abs(h.pending[1] - h.v) > 1e-12) hoverSolve(st, h, hf);
  if (hf === null || !(dtSec > 0)) return;
  // ⭐⭐ (2026-10-14, the owner: *"When the piece hovers in desktop, the slide is not smooth but jittery. Also, when toggling back to orbit, the initial movement of the piece is jittery (while it is still close to the hosting face) and comes back very smooth when the piece is far from the hosting face in orbit."*) — the DRAWN piece eases after the solved one on the ORBIT's own spring (critically damped,
  // τ = `boxSmoothMs` / 2), no lead: ⛔ the part translation's follower (τ 7.6 ms, ζ 0.2, a phantom lead) passed the solve's per-frame steps
  // straight through — a mouse's events beat against the frames (125 Hz against 143 fps measured on the HUD) — and its overshoot, clipped by
  // `hoverDrawLag`, stuck and slipped
  // ⭐⭐⭐ (2026-10-16, the owner: *"Add some inertia when sliding the green – turquoise piece. Propose to reapply what we did for translation of a part in world
  // translation."* → *"build the inertia"*) — the PART TRANSLATION'S FOLLOWER on the drawn piece: a spring of its own inertia and damping (`hoverInertiaMs`,
  // `hoverDampingRatio`) toward a phantom target leading the solved place by its smoothed velocity (`hoverLeadMs`); the model stays the solved place (the
  // collision and the boundary exact), the drawn piece may run ahead of it by `HOVER_OVERSHOOT_M` at most. ⛔ (10-14) a critically damped spring at the
  // orbit's τ, the part ahead dropped
  const tauI = Math.max(1e-4, st.cfg.hoverInertiaMs / 1000);
  const leadS = st.cfg.hoverLeadMs / 1000;
  hf.vu = exponentialSmooth(hf.vu, (hf.u - hf.lu) / dtSec, tauI, dtSec);
  hf.vv = exponentialSmooth(hf.vv, (hf.v - hf.lv) / dtSec, tauI, dtSec);
  hf.lu = hf.u;
  hf.lv = hf.v;
  hf.fu = advanceFollow(hf.fu, phantomTarget(hf.u, hf.vu, leadS), tauI, st.cfg.hoverDampingRatio, dtSec);
  hf.fv = advanceFollow(hf.fv, phantomTarget(hf.v, hf.vv, leadS), tauI, st.cfg.hoverDampingRatio, dtSec);
  // ⭐⭐ the DRAWN lag behind the model: the follower's (behind the last solved step), and the settle still to show (above the settled place —
  // ⭐ (2026-10-14, the hover's second audit) ⛔ the MODEL eased down while the steps were solved at the settled depth: an unchecked pose)
  const [lu, lv] = hoverDrawLag(hf.fu.x - hf.u, hf.fv.x - hf.v, hf.du, hf.dv, HOVER_OVERSHOOT_M);
  const settleLeft = hf.settleM * (1 - settleShare(now - hf.settleT0));
  st.hoverDraw = add(scale(hf.n, settleLeft), add(scale(hf.e1, lu), scale(hf.e2, lv)));
  // settled after the release: nothing drawn apart
  const settled = Math.abs(hf.fu.x - hf.u) + Math.abs(hf.fv.x - hf.v) < 1e-6 && Math.abs(hf.fu.v) + Math.abs(hf.fv.v) < 1e-5;
  if (st.hover === null && settled && settleLeft <= 0) {
    st.hoverFollow = null;
    st.hoverDraw = null;
  }
}

/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"sliding is entered directly if the contours highlight (no need to press the piece). A + dy or double finger continues to drive the approach so that the user can exit the sliding mode by moving away the piece"*) — **THE SLIDE MODE, EACH FRAME**: the slide view's share by time (`slideViewProgress`); off, it LATCHES as
 * soon as the contours light (`slideLatches` — `hoverStart` with no finger, at most every 100 ms while refused); on, a held second touch or A takes the
 * finger off it, and the APPROACH that carries the resting face beyond the reach from the hosting face's plane leaves it (`slideExits`).
 */
function slideFrame(st: SceneState, now: number, dtSec: number): void {
  const hv = st.hoverView;
  if (hv !== null && dtSec > 0) hv.progress = slideViewProgress(hv.progress, dtSec * 1000, st.hover !== null);
  const h = st.hover;
  if (h === null) {
    if (st.hoverReady === null) {
      st.slideRefused = false;
      st.slideWaitSince = 0;
    }
    // ⭐⭐⭐ (2026-11-01) the lit contours HOLD the orbit (`slideHoldsOrbit`): its coast stopped where the piece is, so it comes to rest and latches
    // (⛔ the latch waited for the piece at rest while a finger or the coast carried it through the lit contours and away)
    if (slideHoldsOrbit(st.hoverReady !== null, st.slideArmed, st.orbitPiecePlaced, false, st.slideRefused, st.orbitShift)) slideHoldOrbit(st);
    if (!slideLatches(st.hoverReady !== null, st.slideArmed, st.orbitPiecePlaced, false) || now - st.slideTryAt < READY_EVERY_MS) return;
    st.slideTryAt = now;
    const r = hoverStart(st, null);
    if (r === "wait" && st.slideWaitSince === 0) st.slideWaitSince = now;
    st.slideRefused = slideRefusedAfter(r, r === "wait" ? now - st.slideWaitSince : 0);
    if (r !== "wait") st.slideWaitSince = 0;
    if (r === true) st.slideTryAt = 0;
    return;
  }
  if (h.pointerId !== null && (st.hold !== null || st.orbitShift)) slideDetach(st);
  const q = st.pieceQ;
  if (q !== null && slideExits(dotv(ringAnchorAt(st, q), h.n) - h.level, st.cfg.hoverApproachMm / 1000)) {
    st.hover = null;
    st.hoverPress = null;
    st.hoverBand = null;
    st.slideArmed = false;
    st.lastVerdict = "slide: off — the approach took the piece away; the approach and the orbit go on from the gizmo where the slide left it";
    st.hudDirty = true;
  }
}

/**
 * ⭐⭐⭐ (2026-11-01, *"build A"*) THE WAY OUT GOES ON FROM THE SLIDE VIEW — called by the approach's step OUT while the slide is on: the orbit's yaw and
 * pitch re-based so the orbit's CAMERA stands where the slide view's is (`orbitForCameraDir`), the piece's place unchanged (the curve's difference taken into its own offset, which
 * ways in with the approach's travel); the gizmo where the slide left it. ⛔ The orbit kept its angles from the approach in: the piece flew back to
 * that curve.
 */
export function slideWayOutRebase(st: SceneState): void {
  const hv = st.hoverView;
  const q = st.pieceQ;
  if (!slideModeOn(st) || st.hover === null || hv === null || q === null) return;
  // ⭐⭐⭐ (2026-11-01, *"build A"*) the orbit whose CAMERA — its offsets included — stands where the slide's is (`orbitForCameraDir`): nothing for the camera
  // to take back after the blend (⛔ the piece's direction on the slide's: the camera then swung to its offset — a second, curved move on the screen)
  // ⭐⭐⭐ (2026-11-05, Step 6) the view read in the ORBIT'S FRAME — its angles are the frame's
  const t = orbitForCameraDir(toFrame(st.orbitFrame, hv.iso), q.yaw, (st.cfg.cameraYawOffsetDeg * Math.PI) / 180, (st.cfg.cameraPitchOffsetDeg * Math.PI) / 180);
  if (t === null) return;
  const u0 = orbitDir(q.yaw, q.v);
  const u1 = orbitDir(t.yaw, t.v);
  if (Math.acos(Math.min(1, dotv(u0, u1))) <= SLIDE_WAY_OUT_MIN_RAD) return;
  const nq: OrbitQ = { ...q, yaw: t.yaw, v: t.v };
  // ⭐⭐ (2026-11-01) the lock's cone opened to the new direction (`lockCone` only tightens): ⛔ clamped into it, the piece and the camera were turned off the
  // slide's view after all — the camera's swing back (a slide on a top, the gizmo's face a side's)
  const lk = st.asmLock;
  if (lk !== null && lk.normal !== null) st.asmLock = { ...lk, cone: Math.max(lk.cone ?? 0, angleTo(toWorld(st.orbitFrame, orbitDir(nq.yaw, nq.v)), lk.normal)) };
  const before = ringAnchorAt(st, q);
  const after = ringAnchorAt(st, nq);
  const keep: Vec3 = [before[0] - after[0], before[1] - after[1], before[2] - after[2]];
  st.hoverOffset = add(st.hoverOffset ?? [0, 0, 0], keep);
  if (st.hoverFollow !== null) st.hoverFollow.offset0 = add(st.hoverFollow.offset0, keep);
  st.pieceQ = nq;
  // ⭐⭐⭐ (2026-11-01, the owner: *"for a short moment the piece flies away from the camera screen … makes some wide curve before catching back the 2D curve
  // from the gizmo"*) — the eye's spring and the camera's lag RE-BASED with it (the place is kept by the offset): ⛔ they eased from the old angles
  // over ~150 ms while a fast A + drag carried the piece metres out — the piece swept a wide arc from the old direction to the new
  const sp = st.boxSpring;
  if (sp !== null) st.boxSpring = { at: { yaw: nq.yaw, v: nq.v, zoom: sp.at.zoom }, velYaw: 0, velV: 0, velLnZoom: sp.velLnZoom };
  st.cameraOrbit = null;
  st.cameraLagged = null;
  st.orbit.reset(nq.yaw, nq.v);
  st.orbitInertia.stop();
  st.orbitUserV = nq.v;
  st.orbitRawPrev = { yaw: nq.yaw, v: nq.v };
  st.lastVerdict = "slide: the way out — the orbit goes on from the slide's view";
  st.hudDirty = true;
}

/** ⭐ (2026-11-01) The orbit held where the piece is solved — its target there, its coast stopped (the lit contours waiting for the latch). */
function slideHoldOrbit(st: SceneState): void {
  const q = st.pieceQ;
  if (q === null) return;
  st.orbit.reset(q.yaw, q.v);
  st.orbitInertia.stop();
  st.orbitUserV = q.v;
}

/** ⭐ (2026-11-01) The slide mode's finger taken off it (a held second touch, A): the mode stays on, the piece where it was solved. */
function slideDetach(st: SceneState): void {
  if (st.hover !== null) st.hover.pointerId = null;
  st.hoverBand = null;
  st.hoverPress = null;
}

/**
 * ⭐⭐⭐ (2026-10-14, the hover's second audit) The hover's pending target solved ONCE this frame, with what the frame's work cap has left (`hoverQueryBudget`) — the orbit
 * solves nothing under a hover, so the cap is the hover's; a solve the cap cut keeps its target (`hoverPendingAfter`).
 */
/** ⭐ Two solver places the same (a blocked step that moved nothing). */
const sameAt = (a: OrbitQ, b: OrbitQ): boolean => Math.abs(a.yaw - b.yaw) + Math.abs(a.v - b.v) < 1e-12;

function hoverSolve(st: SceneState, h: NonNullable<SceneState["hover"]>, hf: NonNullable<SceneState["hoverFollow"]>): void {
  const budget = hoverQueryBudget(st.cfg.pieceSolverQueries, st.pieceQueries);
  if (budget === 0) {
    st.pieceDeferred = true;
    return;
  }
  // ⭐⭐⭐ (2026-10-14, the owner: *"modify: when there is not any portion of the resting face in contact with a hosting face (i.e. on its full surface, the resting face faces empty) the hover translation shall stop and be bounded by the hosting face contour and the user shall be able to bring back the hovering piece inside the boundary by reversing the delta position input. No more automatic transition to orbit."*) — the target held where some portion of the resting face stays over a coplanar hosting face
  // (`boundStep`: the whole step, else along one axis — sliding on the boundary — else as far as it goes); the finger's excess dropped, so its
  // reversal brings the piece back at once
  // ⭐⭐⭐ (2026-10-15, the owner: *"No bridging. The boundary is drawn when sliding is allowed. Clamp the sliding so that the center of the resting face remains within the boundary."*) — the resting face's CENTRE within the
  // drawn boundary (`insideRects`, the outline's own rectangles) — ⛔ the edge margin (an overlap of its outline) is deleted
  // ⭐⭐⭐ (2026-10-15) the centre's DISTANCE to the boundary, never to grow (`boundStep`, `holdOffBound`) — ⛔ an in/out test left a hover starting outside free
  // ⭐⭐ (2026-11-01) in the slide mode the origin carried by the approach since the slide began (the piece taken in or out along its direction)
  let origin = h.origin;
  const q0 = st.pieceQ;
  if (slideModeOn(st) && q0 !== null && st.approach !== h.approach0) {
    const keep = st.approach;
    st.approach = h.approach0;
    const a0 = ringAnchorAt(st, q0);
    st.approach = keep;
    origin = add(h.origin, sub(ringAnchorAt(st, q0), a0));
  }
  const dist = (u: number, v: number): number => {
    if (h.bound === null) return 0;
    const p = add(origin, add(scale(h.e1, u), scale(h.e2, v)));
    return rectsDistance(h.bound.rects, dotv(p, h.bound.a), dotv(p, h.bound.b));
  };
  h.pending = boundStep([h.u, h.v], h.pending, dist);
  if (Math.abs(h.pending[0] - h.u) + Math.abs(h.pending[1] - h.v) <= 1e-12) {
    st.lastVerdict = "hover: at the edge of the hosting faces — reverse to come back";
    st.hudDirty = true;
    return;
  }
  // ⭐ solved by the orbit's clearance rule, its two coordinates the plane's (the second offset into the solver's 0 … 1)
  const base = pieceCollisionSetup(st);
  const setup: CollisionSetup = { ...base, exempt: (x, y) => (base.exempt?.(x, y) ?? false) || h.behind.has(x) || h.behind.has(y) };
  const env = pieceSolverEnv(st, (q) => add(origin, add(scale(h.e1, q.yaw), scale(h.e2, (q.v - 0.5) * HOVER_SPAN_M))), setup);
  const qs: OrbitQ = { yaw: h.u, v: 0.5 + h.v / HOVER_SPAN_M, zoom: 1 };
  let r = solveOrbitStep(qs, [h.pending[0] - h.u, (h.pending[1] - h.v) / HOVER_SPAN_M], env, { ...pieceSolveOptions(st), maxQueries: budget });
  let spent = r.queries;
  // ⭐⭐ (2026-11-01, the owner: *"sometimes, the slide is stuck"* → *"a to c"*) c — blocked where it stood: the step ALONG what blocks it (`slideAlong`), solved
  // again with what the frame has left (⛔ a drag into a part's corner, slanted to both coordinates, moved nothing: the solver keeps each coordinate's sense)
  if (r.blocked && sameAt(r.q, qs) && budget - spent > 1) {
    const nn = env.normal(qs);
    spent++;
    const along = nn === null ? null : slideAlong([h.pending[0] - h.u, h.pending[1] - h.v], [dotv(nn, h.e1), dotv(nn, h.e2)]);
    if (along !== null) {
      const r2 = solveOrbitStep(qs, [along[0], along[1] / HOVER_SPAN_M], env, { ...pieceSolveOptions(st), maxQueries: budget - spent });
      spent += r2.queries;
      if (!sameAt(r2.q, qs)) r = { ...r2, blocked: true };
    }
  }
  st.pieceQueries += spent;
  st.pieceSolveQueries += spent; // ⭐⭐ (2026-10-15, the Fable audit) the quads' turn check reads it: ⛔ under a hover it read 0 and spent the 24 again
  st.pieceMoveBlocked = r.blocked;
  // ⭐⭐ (2026-11-01) b — a slide that moved nothing SAYS WHY on the HUD (`slideBlockedVerdict`): the part it pushes into (one query, inside the cap)
  if (r.blocked && sameAt(r.q, qs)) {
    const named = budget - spent > 0;
    if (named) st.pieceQueries++;
    st.lastVerdict = slideBlockedVerdict(named ? (env.blocker?.(qs) ?? null) : null);
    st.hudDirty = true;
  }
  if (r.deferred) st.pieceDeferred = true;
  let nu = r.q.yaw;
  let nv = (r.q.v - 0.5) * HOVER_SPAN_M;
  h.pending = hoverPendingAfter([nu, nv], r.deferred, h.pending);
  // ⭐⭐ a slide that carried the centre off the boundary: held where it was — ⭐⭐⭐ (2026-10-15, the Fable audit) only a step from INSIDE (`holdOffBound`)
  const was: [number, number] = [nu, nv];
  [nu, nv] = holdOffBound([h.u, h.v], [nu, nv], dist);
  if (nu !== was[0] || nv !== was[1]) h.pending = [h.u, h.v];
  if (Math.abs(nu - h.u) + Math.abs(nv - h.v) > 1e-12) {
    hf.du = nu - h.u;
    hf.dv = nv - h.v;
  }
  h.u = nu;
  h.v = nv;
  hf.u = nu;
  hf.v = nv;
  // ⭐⭐⭐ (2026-10-14, the hover's audit) the MODEL: the solved offset
  applyHoverModel(st, hf, scale(hf.n, -hf.settleM), add(scale(hf.e1, hf.u), scale(hf.e2, hf.v)));
}

/** ⭐ (2026-10-14) the hover's and the way in's drawn ease: the orbit's spring (s). */
function hoverDrawTau(st: SceneState): number {
  return Math.max(1, st.cfg.boxSmoothMs / 2) / 1000;
}

/**
 * ⭐⭐ (2026-10-14, the owner: *"When the piece hovers in desktop, the slide is not smooth but jittery. Also, when toggling back to orbit, the initial movement of the piece is jittery (while it is still close to the hosting face) and comes back very smooth when the piece is far from the hosting face in orbit."*) — **THE WAY IN, DRAWN ON THE SPRING**: while the orbit takes the piece-only offset back, the DRAWN offset
 * eases after the solved one (critically damped, the orbit's τ) — the difference added to the mesh only (`st.hoverDraw`). ⛔ Near the hosting
 * face the solved share advanced in bursts (a part held it, the travel freed it) and the piece showed each one.
 */
export function wayInDrawFrame(st: SceneState, dtMs: number): void {
  if (st.hoverFollow !== null || st.orbitPiecePlaced) {
    st.wayInDrawn = null;
    return;
  }
  const o: Vec3 = st.hoverOffset ?? [0, 0, 0];
  let d = st.wayInDrawn;
  if (d === null) {
    if (st.hoverWayIn === null) return;
    d = { x: [o[0], o[1], o[2]], v: [0, 0, 0] };
  }
  const tau = hoverDrawTau(st);
  const dt = dtMs / 1000;
  const next = [0, 1, 2].map((k) => advanceFollow({ x: d!.x[k]!, v: d!.v[k]! }, o[k]!, tau, 1, dt));
  d = { x: [next[0]!.x, next[1]!.x, next[2]!.x], v: [next[0]!.v, next[1]!.v, next[2]!.v] };
  const lag: Vec3 = [d.x[0] - o[0], d.x[1] - o[1], d.x[2] - o[2]];
  if (st.hoverWayIn === null && Math.hypot(...lag) < 1e-5 && Math.hypot(...d.v) < 1e-4) {
    st.wayInDrawn = null;
    st.hoverDraw = null;
    return;
  }
  st.wayInDrawn = d;
  st.hoverDraw = lag;
}

/**
 * ⭐ The hover's MODEL: the settle (down the face's normal) and the slide (in its plane). The gizmo riding the slide (`hf.gizmo`): the slide moves the
 * centre — ⭐⭐ (2026-11-01) and the slide view's target with it; the settle the piece's own (⛔ the gizmo sunk up to 20 mm into the face with it).
 */
function applyHoverModel(st: SceneState, hf: NonNullable<SceneState["hoverFollow"]>, settle: Vec3, slide: Vec3): void {
  if (hf.gizmo) {
    st.centreBlend.snapTo(add(hf.centre0, slide));
    syncCentre(st);
    st.hoverOffset = add(hf.offset0, settle);
    if (hf.view0 !== null && st.hoverView !== null) st.hoverView.target = add(hf.view0, slide);
  } else st.hoverOffset = add(hf.offset0, add(settle, slide));
}

/**
 * ⭐ (2026-10-14, the hover's audit) The hover ended at once (a held second touch, the capture): the model at its solved place, nothing drawn
 * apart. A held second touch hands the finger back; ⭐⭐ (2026-10-14, the hover's second audit) a CAPTURE spends it until it lifts (`st.hoverSpent`).
 */
function hoverEndNow(st: SceneState): void {
  if (st.hover !== null && st.orbitPiecePlaced) st.hoverSpent = st.hover.pointerId;
  st.hover = null;
  st.hoverPress = null;
  st.hoverBand = null;
  st.hoverFollow = null;
  st.hoverDraw = null;
  st.hudDirty = true;
}

/**
 * ⭐ An orbit drag's step (`travelMm` of finger): the piece-only offset is dropped (*"Cleared on orbit"* — eased out over the next frames), and
 * the camera leaves the hover view with the orbit's travel (the way out).
 */
export function hoverOrbitStep(st: SceneState, travelMm: number): void {
  if (travelMm <= 0) return;
  // ⭐⭐⭐ (2026-11-01) in the slide mode: nothing under it (the drag is the approach's); off, the piece's own offset ways in — A + drag's way in is the
  // approach's (`approachInput`); the view by time (`slideFrame`)
  if (slideModeOn(st)) {
    if (st.hover === null && !st.orbitShift) hoverWayInStep(st, travelMm);
    return;
  }
  // ⛔⛔ (2026-10-16) the orbit no longer clears the spent slide: the piece, still against the face, re-latched at once (`hoverSlidAfterLook`)
  hoverWayInStep(st, travelMm);
  const hv = st.hoverView;
  if (hv !== null) {
    hv.progress = hoverViewProgress(hv.progress, travelMm, 1 / Math.max(1e-6, st.cfg.pieceOrbitEnterMm), false);
    // ⭐ (2026-10-14) the view itself ends once its SHOWN share is back to 0 (`hoverCameraBlend`) — ⛔ dropped at once, it jumped
  }
}

/**
 * ⭐⭐ (2026-10-14, *"After a hover which has moved the piece, the orbit shall way in smoothly (same as the previous way in way out of the piece orbit) so the piece does not jump. The gizmo position shall not be changed by a toggle from hover to orbit."*) the piece's own offset ways in by
 * this travel (mm) — the gizmo untouched. ⭐ (2026-11-01) the approach's travel too, once the slide mode is left (`approachInput`).
 */
export function hoverWayInStep(st: SceneState, travelMm: number): void {
  if (travelMm <= 0 || st.hoverOffset === null) return;
  const w = st.hoverWayIn ?? startHoverWayIn(st.hoverOffset);
  st.hoverWayIn = { ...w, rawMm: w.rawMm + travelMm };
}

/**
 * ⭐⭐ Each frame (2026-10-14, *"After a hover which has moved the piece, the orbit shall way in smoothly (same as the previous way in way out of the piece orbit) so the piece does not jump. The gizmo position shall not be changed by a toggle from hover to orbit."*): the piece WAYS IN from where the hover left it to its ring place, by the orbit drag's travel read on the
 * orbit's spring (`smoothTravel`) — the share left `hoverWayInLeft(travel, pieceOrbitEnterMm)`, the way in's own. SOLVED (the second audit):
 * the share is the solver's one coordinate, inside what the frame's cap has left; a part in the way holds the piece where it stands until the
 * finger's travel opens it.
 */
export function hoverOffsetFrame(st: SceneState, dtMs: number): void {
  const o = st.hoverOffset;
  let w = st.hoverWayIn;
  if (o === null || w === null || st.orbitPiecePlaced) return;
  w = smoothTravel(w, dtMs, st.cfg.boxSmoothMs / 2);
  st.hoverWayIn = w;
  const want = hoverWayInLeft(w.travelledMm, st.cfg.pieceOrbitEnterMm);
  if (!wayInDue(w, want)) return;
  let share = want;
  const q = st.pieceQ;
  if (q !== null && st.greenBox !== null) {
    // ⭐⭐ (2026-10-14, the hover's second audit) inside what the frame's work cap has left (none: it waits a frame)
    const budget = hoverQueryBudget(st.cfg.pieceSolverQueries, st.pieceQueries);
    if (budget === 0) return;
    const ring = ringAnchorAt(st, q); // the hover offset included
    const base: Vec3 = [ring[0] - o[0], ring[1] - o[1], ring[2] - o[2]];
    const env = pieceSolverEnv(st, (x) => add(base, scale(w!.pieceOff, x.yaw)));
    const r = solveOrbitStep({ yaw: w.share, v: 0.5, zoom: 1 }, [want - w.share, 0], env, { ...pieceSolveOptions(st), maxQueries: budget });
    st.pieceQueries += r.queries;
    share = Math.min(1, Math.max(0, r.q.yaw));
  }
  if (share < 1e-6) {
    st.hoverOffset = null;
    st.hoverWayIn = null;
  } else {
    st.hoverOffset = scale(w.pieceOff, share);
    // ⭐ (2026-10-15) held short by a part at this travel: not solved again until the travel moves on (`wayInDue`)
    st.hoverWayIn = { ...w, share, heldAtMm: Math.abs(share - want) > 1e-9 ? w.travelledMm : null };
  }
}

/**
 * ⭐⭐⭐ (2026-10-14, *"I am not satisfied with the camera movements when toggling back and forth between hover and orbit. There is too much mismatch between the camera position in hover and the rings and as a consequence when toggling into hover the piece flies away from the press and when toggling into orbit the camera has a very complex move. Disregard the requirement of camera placement during hover. I want to implement a camera position during hover which provides a good isometric view of the piece and sliding surface with minimum movement from the orbit ring (therefore during hover the camera can be on the left or the right of the piece, on the bottom or on the top of the piece) and also which can simply smoothly easily blend back into orbit rings."*) The camera turned toward the hover view by its progress, ON AN ARC about the target from where the orbit's camera
 * is (`hoverCameraSwing`), its distance kept — at progress 0 exactly the rings' camera. A retarget (another face) turns the corner from the
 * old one over `HOVER_VIEW_RETARGET_MS`.
 */
export function hoverCameraBlend(st: SceneState, camAt0: Vec3, lookAt0: Vec3): { camAt: Vec3; lookAt: Vec3; w: number } {
  // ⭐⭐⭐ (2026-11-01, *"a succession of very rapid and small jumps when I slide with my mouse"*) the whole rig rides the piece AS DRAWN (`slideCameraShift`)
  const shift = slideCameraShift(slideModeOn(st), st.hoverFollow?.gizmo === true, st.hoverDraw);
  const camAt = add(camAt0, shift);
  const lookAt = add(lookAt0, shift);
  const hv = st.hoverView;
  if (hv === null) return { camAt, lookAt, w: 0 };
  // ⭐⭐ (2026-10-14, the owner: *"When the piece hovers in desktop, the slide is not smooth but jittery. Also, when toggling back to orbit, the initial movement of the piece is jittery (while it is still close to the hosting face) and comes back very smooth when the piece is far from the hosting face in orbit."*) — the share SHOWN eases after the finger's (critically damped, the orbit's τ): ⛔ it stepped at each
  // pointer event while the orbit's own camera eased every frame
  const now = performance.now();
  const dt = Math.min(0.1, Math.max(0, (now - hv.at) / 1000));
  hv.at = now;
  const f = advanceFollow({ x: hv.shown, v: hv.shownVel }, hv.progress, hoverDrawTau(st), 1, dt);
  hv.shown = Math.min(1, Math.max(0, f.x));
  hv.shownVel = f.v;
  if (hoverViewEnds(hv.progress, hv.shown, st.hover !== null)) {
    st.hoverView = null;
    return { camAt, lookAt, w: 0 };
  }
  // ⭐ (2026-11-01) the limited orbit's angles SHOWN, eased after the slide's (the orbit's τ)
  if (hv.orbit !== null) {
    const k = 1 - Math.exp(-dt / hoverDrawTau(st));
    hv.orbitShown = [hv.orbitShown[0] + (hv.orbit.a[0] - hv.orbitShown[0]) * k, hv.orbitShown[1] + (hv.orbit.a[1] - hv.orbitShown[1]) * k];
  }
  const w = hoverViewWeight(hv.shown);
  if (w <= 0) return { camAt, lookAt, w: 0 };
  let dir = shownDir(hv);
  let target = add(hv.target, shift);
  if (hv.from !== null) {
    const s = retargetShare(performance.now() - hv.from.t0);
    if (s >= 1) hv.from = null;
    else {
      dir = slerpDir(hv.from.iso, dir, s);
      target = lerp3(hv.from.target, target, s);
    }
  }
  // ⭐ (2026-10-16) with its weight: the camera's up rolls to upright by it (`uprightBlend`)
  return { ...hoverCameraSwing(camAt, lookAt, target, dir, w), w };
}

// ⭐ (2026-10-14, the owner: *"change the cyan highlight color to this green color as attached"*) — #D8FDD2 (216, 253, 210), sampled from the owner's swatch
// ⭐ (2026-10-15) the resting face's own colour now (`RESTING_FACE_COLOUR`): one colour, one place
const READY_COLOUR = RESTING_FACE_COLOUR;
const SHADOW_COLOUR = Color3.FromInts(216, 253, 210);
/** ⭐ How often the "may it hover?" look runs when no hover is on (ms). */
const READY_EVERY_MS = 100;

/**
 * ⭐⭐⭐ (2026-10-14, *"I think the contact check is too strict. It is difficult for the user to judge the contact depending on the camera view. Also, it may be difficult to achieve the contact based only on orbit movement. Propose something to ease the contact and its perception by the user"* → *"Build A&B"*) — **B. CONTACT, MADE VISIBLE**: while the resting face LOOKS AT a part's face within the hover's reach (the same test as
 * the hover's start, every `READY_EVERY_MS`), or a hover is on: the CONTACT SHADOW (the resting face's outline laid on that face), a faint FILL
 * on the face that will host the hover, and the resting face's contour turned CYAN — "press the piece and drag".
 */
export function hoverVisualFrame(st: SceneState, now: number): void {
  const b = st.greenBox;
  const p = st.orbitPieces.find((o) => o.mesh === b);
  let ready = st.hoverReady;
  if (b === null || p === undefined || p.restingFace === null || st.orbitPiecePlaced || st.pieceAnchor === null) ready = null;
  else if (st.hover !== null) ready = st.hoverReady; // on: kept as the hover began
  else if (now - st.hoverReadyAt >= READY_EVERY_MS && (st.hoverReadyWorld !== st.world || st.hoverReadyReachMm !== st.cfg.hoverApproachMm)) {
    // ⭐ (2026-10-14, the hover's second audit) looked again only when the world moved (the piece, a part) or the reach did — at rest it costs nothing
    st.hoverReadyAt = now;
    st.hoverReadyWorld = st.world;
    st.hoverReadyReachMm = st.cfg.hoverApproachMm;
    const r = b.rotationQuaternion ?? Quaternion.Identity();
    const restingW = qRotate([r.w, r.x, r.y, r.z], p.restingFace.normal);
    const reach = st.cfg.hoverApproachMm / 1000;
    const f = hoverFaceContact(st.pieceAnchor, restingW, hoverCandidates(st, reach, pieceCollisionSetup(st)), reach, HOVER_ALIGN_DEG, restingPolyWorld(st, st.pieceAnchor, [r.w, r.x, r.y, r.z])).contact;
    const found = f === null || f.faceId === null ? null : { id: f.id, faceId: f.faceId, normal: f.normal, centre: f.centre };
    // ⛔⛔ (2026-10-16) a spent slide stays spent while the piece is against a face, and clears once it is out of every contact
    st.hoverSlid = hoverSlidAfterLook(st.hoverSlid, found !== null);
    ready = hoverOffered(st.hoverSlid) ? found : null;
  } else if (!hoverOffered(st.hoverSlid)) ready = null;
  st.hoverReady = ready;
  // the contact shadow
  if (ready === null || b === null || p === undefined) {
    st.hoverShadow?.setEnabled(false);
    st.hoverFaceFill?.setEnabled(false);
    st.hoverOutline?.setEnabled(false);
    return;
  }
  const r = b.rotationQuaternion ?? Quaternion.Identity();
  const rot: Quat = [r.w, r.x, r.y, r.z];
  const at: Vec3 = [b.position.x, b.position.y, b.position.z];
  const lift = scale(ready.normal, 0.0004);
  const host = hostFrame(st, ready.id);
  const lines = p.restingEdges.map((e) =>
    e.map((q) => {
      const w = add(at, qRotate(rot, q));
      const s = add(projectOntoPlane(w, ready.normal, ready.centre), lift);
      return host === null ? new Vector3(s[0], s[1], s[2]) : host.local(s);
    }),
  );
  if (st.hoverShadow === null || st.hoverShadowCount !== lines.length) {
    st.hoverShadow?.dispose();
    st.hoverShadow = CreateLineSystem("hover-shadow", { lines, updatable: true }, st.scene);
    st.hoverShadow.color = SHADOW_COLOUR.clone();
    st.hoverShadow.isPickable = false;
    st.hoverShadowCount = lines.length;
  } else CreateLineSystem("hover-shadow", { lines, instance: st.hoverShadow }, st.scene);
  // ⭐⭐ (2026-10-16) in the hosting part's frame, riding its sway
  if (host !== null) {
    if (st.hoverShadow.parent !== host.mesh) st.hoverShadow.parent = host.mesh;
  } else st.hoverShadow.parent = null;
  st.hoverShadow.setEnabled(true);
  // the face that will host the hover: a faint fill (rebuilt when the face changes)
  const key = `${ready.id}|${ready.faceId}|${ready.centre.map((x) => x.toFixed(4)).join(",")}`;
  if (st.hoverFaceKey !== key) {
    st.hoverFaceKey = key;
    st.hoverFaceFill?.dispose(false, true); // ⭐ (2026-10-14, the hover's audit) its own material with it (it leaked one per face)
    st.hoverFaceFill = buildFaceFill(st, ready.id, ready.faceId, lift);
  }
  st.hoverFaceFill?.setEnabled(true);
  // ⭐⭐ (2026-10-14, the owner: *"Display also a green highlight over the biggest boundary of coplanar hosting faces so the user can visually couple it with the green highlight of the resting face (similar to yellow highlight for resting face and quad)."*) — the OUTLINE of the coplanar hosting faces joined to this one, green (rebuilt when the face changes)
  if (st.hoverOutlineKey !== key) {
    st.hoverOutlineKey = key;
    st.hoverOutline?.dispose();
    st.hoverOutline = buildCoplanarOutline(st, ready);
  }
  st.hoverOutline?.setEnabled(true);
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"Make sure the highlights follow the parts when they sway … the boundary highlight shall follow the sway of the assembly"*) —
 * **THE HOSTING PART'S FRAME**: a world point carried into the part's own frame by its MODEL pose; a highlight drawn there and parented to the part's mesh
 * rides the mesh's drawn pose — its sway included. ⛔ Built in the world, the boundary, the face's fill and the contact shadow stood still while the parts swayed.
 */
function hostFrame(st: SceneState, partId: string): { mesh: AbstractMesh; local: (p: Vec3) => Vector3 } | null {
  const mesh = st.meshOf.get(partId);
  const place = worldPlacementOf(st.world, partId);
  if (mesh === undefined || place === null) return null;
  const inv = invertPlacement(place);
  return { mesh, local: (p) => { const q = composePlacement(inv, { position: p, orientation: [1, 0, 0, 0] }).position; return new Vector3(q[0], q[1], q[2]); } };
}

/** ⭐ The faces' joints are bridged: the coloured cores of two touching parts stand 3 mm apart (their contours meet). */
const OUTLINE_GROW_M = 0.0016;
/**
 * ⭐⭐⭐ (2026-10-15) THE BOUNDARY — the one the outline draws and the slide's clamp reads (`insideRects`): the coplanar faces joined to the hosting
 * face, by their extents, grown by `OUTLINE_GROW_M`; `null` with no hosting face found among them.
 * ⭐⭐ (2026-10-14, the owner: *"Display also a green highlight over the biggest boundary of coplanar hosting faces so the user can visually couple it with the green highlight of the resting face (similar to yellow highlight for resting face and quad)."*) — the coplanar faces of the hosting face's plane, each by its extent on the plane's axes (the world's, for a
 * face square to them), the ones joined to the hosting face, their union's BOUNDARY (`rectsBoundary` of `rectComponent`) drawn green on the coloured faces.
 */
export function coplanarBoundary(st: SceneState, n: Vec3, centre: Vec3, id: string, faceId: string | null): { a: Vec3; b: Vec3; onFace: number; rects: Rect2[] } | null {
  const level = n[0] * centre[0] + n[1] * centre[1] + n[2] * centre[2];
  const faces = coplanarFaces(st, n, level);
  const seed = faces.findIndex((f) => f.id === id && f.faceId === faceId);
  if (seed < 0) return null;
  // the plane's axes: the world's when the face is square to them (exact extents), else any
  const ax = [0, 1, 2].findIndex((i) => Math.abs(n[i]!) > 0.999);
  const [a, b]: [Vec3, Vec3] =
    ax === 0 ? [[0, 1, 0], [0, 0, 1]] : ax === 1 ? [[1, 0, 0], [0, 0, 1]] : ax === 2 ? [[1, 0, 0], [0, 1, 0]] : planeAxes(n);
  const rects: Rect2[] = faces.map((f) => {
    const xs = f.tris.flatMap((t) => t.map((p) => dotv(p, a)));
    const ys = f.tris.flatMap((t) => t.map((p) => dotv(p, b)));
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const comp = rectComponent(rects, seed, OUTLINE_GROW_M);
  if (comp.length === 0) return null;
  return { a, b, onFace: dotv(faces[seed]!.tris[0]![0], n), rects: comp };
}

function buildCoplanarOutline(st: SceneState, ready: NonNullable<SceneState["hoverReady"]>): LinesMesh | null {
  const n = ready.normal;
  const bd = coplanarBoundary(st, n, ready.centre, ready.id, ready.faceId);
  if (bd === null) return null;
  const segs = rectsBoundary(bd.rects);
  if (segs.length === 0) return null;
  const { a, b } = bd;
  const onFace = bd.onFace + 0.0004; // the coloured face's plane, lifted
  // ⭐⭐ (2026-10-16) drawn in the hosting part's frame, parented to its mesh: it follows the sway (`hostFrame`)
  const host = hostFrame(st, ready.id);
  const P3 = (x: number, y: number) => {
    const w: Vec3 = [a[0] * x + b[0] * y + n[0] * onFace, a[1] * x + b[1] * y + n[1] * onFace, a[2] * x + b[2] * y + n[2] * onFace];
    return host === null ? new Vector3(w[0], w[1], w[2]) : host.local(w);
  };
  const lines = CreateLineSystem("hover-outline", { lines: segs.map(([p, q]) => [P3(p[0], p[1]), P3(q[0], q[1])]) }, st.scene);
  lines.color = READY_COLOUR.clone();
  lines.isPickable = false;
  if (host !== null) lines.parent = host.mesh;
  return lines;
}

/** ⭐ A part's face as a faint fill in the world, lifted off it (`lift`); `null` with no topology. */
function buildFaceFill(st: SceneState, partId: string, faceId: string, lift: Vec3): Mesh | null {
  const mesh = st.meshOf.get(partId);
  const place = worldPlacementOf(st.world, partId);
  if (mesh === undefined || place === null) return null;
  const topo = st.topoOf.get(mesh.name) ?? null;
  const face = topo?.faces.find((f) => f.id === faceId);
  if (topo === null || face === undefined) return null;
  const used = [...new Set(face.triangles)];
  const at = new Map(used.map((i, k) => [i, k] as const));
  const positions: number[] = [];
  // ⭐⭐ (2026-10-16) in the hosting part's frame, parented to its mesh: it follows the sway (`hostFrame`)
  const host = hostFrame(st, partId);
  for (const i of used) {
    const w = add(add(place.position, qRotate(place.orientation, topo.positions[i]!)), lift);
    const l = host === null ? new Vector3(w[0], w[1], w[2]) : host.local(w);
    positions.push(l.x, l.y, l.z);
  }
  const fill = new Mesh("hover-face", st.scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = face.triangles.map((i) => at.get(i)!);
  data.applyToMesh(fill);
  const mat = new StandardMaterial("hover-face-mat", st.scene);
  mat.diffuseColor = READY_COLOUR.clone();
  mat.emissiveColor = READY_COLOUR.scale(0.6);
  mat.alpha = st.cfg.faceHighlightAlpha;
  mat.backFaceCulling = false;
  fill.material = mat;
  fill.isPickable = false;
  if (host !== null) fill.parent = host.mesh;
  return fill;
}
