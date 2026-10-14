/**
 * ⭐⭐⭐ prototype — **THE HOVER, WIRED** (2026-10-14; `input/hover.ts`, `HOVER.md`). A drag that starts ON the orbited piece slides it (and, by
 * default, the yellow gizmo) in the plane of the part face its resting face lies against — only while the two are anti-parallel and in contact;
 * each step solved by the orbit's own clearance rule (the other faces stop and slide it). The camera eases toward the HOVER VIEW with the drag's
 * travel, and back as the orbit comes back. ⛔ No rule here: the decisions are `input/hover.ts`'s and the solver's.
 */
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { SceneState } from "./scene_state";
import type { Sample } from "../input";
import { mmToPx } from "../core/units";
import { qRotate, type Quat, type Vec3 } from "../core/vec";
import { bodiesBehindPlane, bodiesWithin, type CollisionSetup } from "../core/collision";
import { faceWorld } from "../core/object_model";
import { pieceCollisionSetup } from "./collision_wiring";
import { AT_CONTACT_M, solveOrbitStep, type OrbitQ } from "../input/piece_orbit_solver";
import {
  HOVER_SPAN_M,
  clampDisc,
  hoverIsoDirection,
  hoverViewDistanceM,
  HOVER_ALIGN_DEG,
  hoverFaceContact,
  projectOntoPlane,
  settleDepth,
  settleShare,
  hoverContactM,
  hoverPlane,
  hoverViewProgress,
  hoverViewWeight,
  planeStepFromScreen,
  hoverDrawLag,
  hoverWayInLeft,
  startHoverWayIn,
  hoverEndsOn,
  hoverViewRetargets,
  retargetShare,
  behindToleranceM,
  hoverPendingAfter,
  hoverQueryBudget,
} from "../input/hover";
import { RESTING_COLOUR, pieceShownAtRest, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import { syncCentre } from "./camera_rig";
import { MotionTracker, SwayWatcher, impulseForPeak, swayScale } from "../input";
import { advanceFollow } from "../input/follow";
import { exponentialSmooth, phantomTarget } from "../input/lead";
import { smoothTravel } from "../input/piece_orbit";
import { ORBIT_SWAY_MIN_DEG, orbitSwingAxis, placedBarycentre } from "../input/green_box";
import { hoverSwayDeg } from "../input/hover";
import { swingBlock } from "./sway_pass";
import { worldPlacementOf } from "../core/object_model";

/** ⭐ how far the hover looks for a part's face, to name the nearest when it refuses (m) */
const HOVER_LOOK_M = 0.01;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const lerp3 = (a: Vec3, b: Vec3, w: number): Vec3 => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];

/** ⭐ A first touch (or left press) on the orbited piece: noted — the drag that follows hovers if the piece may (decided past the tap's slop). */
export function hoverPressNote(st: SceneState, pointerId: number, s: Sample): void {
  st.hoverPress = { pointerId, x: s.x, y: s.y };
  // ⭐⭐ (2026-10-14, *"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value (i don't know what this value shall be) when hover translation"*) the finger's (or the mouse's) own DEADBAND — the orbit drag's band (`orbitDeadbandMm`, its pause, its tremor rule)
  const band = new MotionTracker({ ...st.cfg, motionDeadbandMm: st.cfg.orbitDeadbandMm }, st.cfg.orbitBandRestMs, true);
  band.push(s);
  st.hoverBand = { pointerId, band, sway: new SwayWatcher(st.cfg.swayTurnDeg, st.cfg.pointerNoiseMm) };
}

/** ⭐ The finger lifted: the hover ends (the camera stays in the hover view until the orbit comes back). */
export function hoverRelease(st: SceneState, pointerId: number): void {
  if (st.hover?.pointerId === pointerId) {
    st.hover = null;
    st.hudDirty = true;
  }
  if (st.hoverPress?.pointerId === pointerId) st.hoverPress = null;
  if (st.hoverBand?.pointerId === pointerId) st.hoverBand = null;
  if (st.hoverSpent === pointerId) st.hoverSpent = null;
}

/** ⭐ A world point on the screen, in the samples' CSS pixels. */
function screenOf(st: SceneState, p: Vec3): [number, number] {
  const w = st.engine.getRenderWidth();
  const v = Vector3.Project(new Vector3(p[0], p[1], p[2]), Matrix.Identity(), st.scene.getTransformMatrix(), st.camera.viewport.toGlobal(w, st.engine.getRenderHeight()));
  const k = w > 0 ? st.canvas.clientWidth / w : 1;
  return [v.x * k, v.y * k];
}

/** ⭐ The parts within `reachM` of the piece, each with its faces in the world (their ids kept, their triangles — `hoverFaceContact`'s overlap test). */
function hoverCandidates(st: SceneState, reachM: number, setup: CollisionSetup) {
  const b = st.greenBox!;
  return bodiesWithin(st.world, b.name, setup, reachM).map((x) => {
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
function faceTrianglesWorld(st: SceneState, partId: string, faceId: string): [Vec3, Vec3, Vec3][] | null {
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

/**
 * ⭐ May the drag hover? The resting face looking at a part's face, anti-parallel, within reach, over it (`hoverFaceContact`); then the hover
 * starts. `"wait"`: the shown piece is still easing onto its solved place — the drag does nothing yet and asks again.
 */
function hoverStart(st: SceneState, pointerId: number): boolean | "wait" {
  const b = st.greenBox;
  const p = st.orbitPieces.find((o) => o.mesh === b);
  // ⭐ (2026-10-14, *"I can't hover translate in the attached configuration. Make sure the threshold distance is between resting face and collision face. Or check what else is bugging. The green piece should hover translate on the blue part's vertical face."*) every refusal SAYS why on the HUD's `last` line
  const refuse = (why: string): false => {
    st.lastVerdict = `hover: ${why} — the drag orbits`;
    st.hudDirty = true;
    return false;
  };
  if (b === null || p === undefined || p.restingFace === null || st.pieceAnchor === null) return refuse("no orbited piece with a resting face");
  if (st.orbitPiecePlaced) return refuse("the piece is placed in its goal");
  const q = st.pieceQ;
  if (q === null) return refuse("the piece is not on its ring (the way in or out round a piece)");
  if (st.pieceOrbit !== null || st.pieceEntry !== null || st.centreReturn !== null) return refuse("the orbit round the piece is on");
  if (st.hold !== null) return refuse("a second touch is held");
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
  const found = hoverFaceContact(anchor, restingW, hoverCandidates(st, Math.max(reach, HOVER_LOOK_M), setup), reach);
  const c = found.contact;
  if (c === null) {
    const nr = found.nearest;
    return refuse(
      nr === null
        ? `the resting face faces no part within ${HOVER_LOOK_M * 1000} mm`
        : !nr.overFace
          ? `the resting face is not over ${nr.id}'s face (beside it)`
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
  st.hover = { pointerId, n: c.normal, e1: plane.e1, e2: plane.e2, origin: settled, centre0, offset0: st.hoverOffset ?? [0, 0, 0], u: 0, v: 0, pending: [0, 0], partId: c.id, behind };
  // ⭐ the drawn offset FOLLOWS the solved one, as a translated part's mesh follows its model (`render_loop`'s follower)
  st.hoverFollow = { e1: plane.e1, e2: plane.e2, n: c.normal, settleM, settleT0: performance.now(), centre0, offset0: st.hoverOffset ?? [0, 0, 0], gizmo: st.cfg.hoverGizmoMove === 1, u: 0, v: 0, fu: { x: 0, v: 0 }, fv: { x: 0, v: 0 }, vu: 0, vv: 0, lu: 0, lv: 0, du: 0, dv: 0 };
  applyHoverModel(st, st.hoverFollow, scale(c.normal, -settleM));
  st.hoverDraw = scale(c.normal, settleM);
  st.hoverWayIn = null; // a new hover takes the offset as it stands
  // ⭐⭐ (2026-10-14, the hover's audit) a hover on ANOTHER face retargets the view, eased from the one it leaves (`hoverViewRetargets`)
  // ⭐⭐ (2026-10-14, *"modify the offset and distance of the camera during hover so that it's view direction projects equally to the three orthogonal planes horizontal, gravity and the third orthogonal and the cyan highlight can be viewed from top right towards bottom left. Distance of camera to object equals the distance of camera to object at boot with same zoom."*) the ISOMETRIC view: above and right of the face, looking down-left at it
  const cam = st.camera.position;
  const iso = hoverIsoDirection(c.normal, [right.x, right.y, right.z], [cam.x - anchor[0], cam.y - anchor[1], cam.z - anchor[2]]);
  const hv0 = st.hoverView;
  if (hv0 === null) st.hoverView = { progress: 0, target: [anchor[0], anchor[1], anchor[2]], n: c.normal, e1: plane.e1, e2: plane.e2, iso, from: null };
  else if (hoverViewRetargets(hv0.n, c.normal))
    st.hoverView = { progress: hv0.progress, target: [anchor[0], anchor[1], anchor[2]], n: c.normal, e1: plane.e1, e2: plane.e2, iso, from: { target: hv0.target, iso: hv0.iso, t0: performance.now() } };
  st.lastVerdict = `hover: on ${c.id}'s face (${(c.gapM * 1000).toFixed(1)} mm${settleM > 0 ? `, settled ${(settleM * 1000).toFixed(1)} mm onto it` : ""}) — the drag slides the ${st.cfg.hoverGizmoMove === 1 ? "gizmo and the piece" : "piece"}`;
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐ One move of a finger that pressed on the orbited piece: `true` when the hover took it (or it is still a possible tap, or the piece is
 * still easing — nothing moves), `false` to let the orbit have it. ⭐⭐ (2026-10-14, the hover's second audit) the step is ADDED to the hover's pending target — solved once a
 * frame by `hoverFrame`, inside the frame's budget.
 */
export function hoverDragStep(st: SceneState, pointerId: number, s: Sample, prev: Sample): boolean {
  void prev;
  // ⭐⭐ (2026-10-14, the hover's second audit) a hover that ended in a CAPTURE spends its finger: it moves nothing more until it lifts (`D139`: a snap stops the drag that made it)
  if (st.hoverSpent === pointerId) return true;
  const hb = st.hoverBand?.pointerId === pointerId ? st.hoverBand : null;
  if (hb !== null) hb.band.push(s);
  if (st.hover?.pointerId !== pointerId) {
    const hp = st.hoverPress;
    if (hp === null || hp.pointerId !== pointerId) return false;
    if (Math.hypot(s.x - hp.x, s.y - hp.y) < mmToPx(st.cfg.doubleTapSlop)) return true; // still a possible tap: nothing moves
    const ok = hoverStart(st, pointerId);
    if (ok === "wait") return true; // the piece still easing: asked again on the next move
    st.hoverPress = null;
    if (!ok) {
      st.hoverBand = null;
      return false;
    }
  }
  const h = st.hover!;
  if (st.greenBox === null) return false;
  // ⭐⭐ through the DEADBAND: a wobble on the axis the finger is not moving emits nothing
  const step = hb !== null ? hb.band.step : { dx: 0, dy: 0 };
  const dx = step.dx;
  const dy = step.dy;
  if (dx === 0 && dy === 0) return true;
  // the finger's step on the plane (each axis's screen shadow, per metre)
  const at = add(h.origin, add(scale(h.e1, h.pending[0]), scale(h.e2, h.pending[1])));
  const s0 = screenOf(st, at);
  const s1 = screenOf(st, add(at, scale(h.e1, 0.01)));
  const s2 = screenOf(st, add(at, scale(h.e2, 0.01)));
  const a1: [number, number] = [(s1[0] - s0[0]) / 0.01, (s1[1] - s0[1]) / 0.01];
  const a2: [number, number] = [(s2[0] - s0[0]) / 0.01, (s2[1] - s0[1]) / 0.01];
  const [du, dv] = planeStepFromScreen(dx, dy, a1, a2, st.cfg.hoverGain);
  const [tu, tv] = clampDisc(h.pending[0] + du, h.pending[1] + dv, st.cfg.hoverAmplitudeMm);
  const asked = add(scale(h.e1, tu - h.pending[0]), scale(h.e2, tv - h.pending[1]));
  h.pending = [tu, tv];
  // ⭐⭐ (*"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value (i don't know what this value shall be) when hover translation"*) the other parts SWAY at the least angle — a hover is a slide along a part (`hoverSwayDeg`), about the placed parts
  if (hb !== null) hoverSway(st, hb.sway, s, asked, Math.hypot(dx, dy));
  // the camera eases toward the hover view with the finger's travel
  const hv = st.hoverView;
  if (hv !== null) hv.progress = hoverViewProgress(hv.progress, Math.hypot(dx, dy) / mmToPx(1), st.cfg.hoverCameraGain, true);
  st.hudDirty = true;
  return true;
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
  // ⭐⭐ (2026-10-14, the hover's audit) a held second touch, or the capture: the hover ends now, at its solved place
  if ((st.hover !== null || st.hoverFollow !== null) && hoverEndsOn(st.hold !== null, st.orbitPiecePlaced)) {
    hoverEndNow(st);
    return;
  }
  const h = st.hover;
  const hf = st.hoverFollow;
  if (h !== null && hf !== null && Math.abs(h.pending[0] - h.u) + Math.abs(h.pending[1] - h.v) > 1e-12) hoverSolve(st, h, hf);
  if (hf === null || !(dtSec > 0)) return;
  const tau = st.cfg.translateInertiaMs / 1000;
  const zeta = st.cfg.translateDampingRatio;
  const lead = st.cfg.translateLeadMs / 1000;
  hf.vu = exponentialSmooth(hf.vu, (hf.u - hf.lu) / dtSec, tau, dtSec);
  hf.vv = exponentialSmooth(hf.vv, (hf.v - hf.lv) / dtSec, tau, dtSec);
  hf.lu = hf.u;
  hf.lv = hf.v;
  hf.fu = advanceFollow(hf.fu, phantomTarget(hf.u, hf.vu, lead), tau, zeta, dtSec);
  hf.fv = advanceFollow(hf.fv, phantomTarget(hf.v, hf.vv, lead), tau, zeta, dtSec);
  // ⭐⭐ the DRAWN lag behind the model: the follower's (behind the last solved step), and the settle still to show (above the settled place —
  // ⭐ (2026-10-14, the hover's second audit) ⛔ the MODEL eased down while the steps were solved at the settled depth: an unchecked pose)
  const [lu, lv] = hoverDrawLag(hf.fu.x - hf.u, hf.fv.x - hf.v, hf.du, hf.dv);
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
 * ⭐⭐⭐ (2026-10-14, the hover's second audit) The hover's pending target solved ONCE this frame, with what the frame's work cap has left (`hoverQueryBudget`) — the orbit
 * solves nothing under a hover, so the cap is the hover's; a solve the cap cut keeps its target (`hoverPendingAfter`).
 */
function hoverSolve(st: SceneState, h: NonNullable<SceneState["hover"]>, hf: NonNullable<SceneState["hoverFollow"]>): void {
  const budget = hoverQueryBudget(st.cfg.pieceSolverQueries, st.pieceQueries);
  if (budget === 0) {
    st.pieceDeferred = true;
    return;
  }
  // ⭐ solved by the orbit's clearance rule, its two coordinates the plane's (the second offset into the solver's 0 … 1)
  const base = pieceCollisionSetup(st);
  const setup: CollisionSetup = { ...base, exempt: (x, y) => (base.exempt?.(x, y) ?? false) || h.behind.has(x) || h.behind.has(y) };
  const env = pieceSolverEnv(st, (q) => add(h.origin, add(scale(h.e1, q.yaw), scale(h.e2, (q.v - 0.5) * HOVER_SPAN_M))), setup);
  const r = solveOrbitStep({ yaw: h.u, v: 0.5 + h.v / HOVER_SPAN_M, zoom: 1 }, [h.pending[0] - h.u, (h.pending[1] - h.v) / HOVER_SPAN_M], env, { ...pieceSolveOptions(st), maxQueries: budget });
  st.pieceQueries += r.queries;
  st.pieceMoveBlocked = r.blocked;
  if (r.deferred) st.pieceDeferred = true;
  const nu = r.q.yaw;
  const nv = (r.q.v - 0.5) * HOVER_SPAN_M;
  h.pending = hoverPendingAfter([nu, nv], r.deferred, h.pending);
  if (Math.abs(nu - h.u) + Math.abs(nv - h.v) > 1e-12) {
    hf.du = nu - h.u;
    hf.dv = nv - h.v;
  }
  h.u = nu;
  h.v = nv;
  hf.u = nu;
  hf.v = nv;
  // ⭐⭐⭐ (2026-10-14, the hover's audit) the MODEL: the solved offset
  applyHoverModel(st, hf, add(scale(hf.n, -hf.settleM), add(scale(hf.e1, hf.u), scale(hf.e2, hf.v))));
}

function applyHoverModel(st: SceneState, hf: NonNullable<SceneState["hoverFollow"]>, w: Vec3): void {
  if (hf.gizmo) {
    st.centreBlend.snapTo(add(hf.centre0, w));
    syncCentre(st);
  } else st.hoverOffset = add(hf.offset0, w);
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
  // ⭐⭐ (2026-10-14, *"After a hover which has moved the piece, the orbit shall way in smoothly (same as the previous way in way out of the piece orbit) so the piece does not jump. The gizmo position shall not be changed by a toggle from hover to orbit."*) the piece ways in by this travel — the gizmo untouched
  if (st.hoverOffset !== null) {
    const w = st.hoverWayIn ?? startHoverWayIn(st.hoverOffset);
    st.hoverWayIn = { ...w, rawMm: w.rawMm + travelMm };
  }
  const hv = st.hoverView;
  if (hv !== null) {
    hv.progress = hoverViewProgress(hv.progress, travelMm, st.cfg.hoverCameraGain, false);
    if (hv.progress <= 0) st.hoverView = null;
  }
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
  if (Math.abs(want - w.share) < 1e-9) return;
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
    st.hoverWayIn = { ...w, share };
  }
}

/** ⭐ The camera blended toward the hover view by its progress — ISOMETRIC, at the boot distance for the zoom of the moment. */
export function hoverCameraBlend(st: SceneState, camAt: Vec3, lookAt: Vec3): { camAt: Vec3; lookAt: Vec3 } {
  const hv = st.hoverView;
  if (hv === null) return { camAt, lookAt };
  const w = hoverViewWeight(hv.progress);
  if (w <= 0) return { camAt, lookAt };
  // ⭐⭐ (2026-10-14, *"modify the offset and distance of the camera during hover so that it's view direction projects equally to the three orthogonal planes horizontal, gravity and the third orthogonal and the cyan highlight can be viewed from top right towards bottom left. Distance of camera to object equals the distance of camera to object at boot with same zoom."*) the distance the camera had to the piece at boot, at the zoom of the moment
  const dist =
    st.bootCamGeom !== null
      ? hoverViewDistanceM(st.cfg, st.bootCamGeom, st.zoom)
      : (st.bootCamPieceDistM ?? Math.hypot(camAt[0] - hv.target[0], camAt[1] - hv.target[1], camAt[2] - hv.target[2]));
  const viewOf = (v: { target: Vec3; iso: Vec3 }): Vec3 => add(v.target, scale(v.iso, dist));
  let pos = viewOf(hv);
  let target = hv.target;
  // ⭐⭐ (2026-10-14, the hover's audit) retargeted to another face: eased from the view it left
  if (hv.from !== null) {
    const s = retargetShare(performance.now() - hv.from.t0);
    if (s >= 1) hv.from = null;
    else {
      pos = lerp3(viewOf(hv.from), pos, s);
      target = lerp3(hv.from.target, target, s);
    }
  }
  return { camAt: lerp3(camAt, pos, w), lookAt: lerp3(lookAt, target, w) };
}

// ⭐ (2026-10-14, the owner: *"change the cyan highlight color to this green color as attached"*) — #D8FDD2 (216, 253, 210), sampled from the owner's swatch
const READY_COLOUR = Color3.FromInts(216, 253, 210);
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
    const f = hoverFaceContact(st.pieceAnchor, restingW, hoverCandidates(st, reach, pieceCollisionSetup(st)), reach).contact;
    ready = f === null || f.faceId === null ? null : { id: f.id, faceId: f.faceId, normal: f.normal, centre: f.centre };
  }
  st.hoverReady = ready;
  // the resting face's contour: cyan while a hover is available
  // ⭐ (2026-10-14, the hover's audit) set only when it CHANGES (a new fill, or ready ↔ not) — ⛔ it cloned a colour per contour line every frame
  const fill = p?.restingFill ?? null;
  if (fill !== null && (st.hoverTint === null || st.hoverTint.fill !== fill || st.hoverTint.ready !== (ready !== null))) {
    for (const c of fill.getChildMeshes(true)) if ("color" in c) (c as LinesMesh).color = (ready !== null ? READY_COLOUR : RESTING_COLOUR).clone();
    st.hoverTint = { fill, ready: ready !== null };
  }
  // the contact shadow
  if (ready === null || b === null || p === undefined) {
    st.hoverShadow?.setEnabled(false);
    st.hoverFaceFill?.setEnabled(false);
    return;
  }
  const r = b.rotationQuaternion ?? Quaternion.Identity();
  const rot: Quat = [r.w, r.x, r.y, r.z];
  const at: Vec3 = [b.position.x, b.position.y, b.position.z];
  const lift = scale(ready.normal, 0.0004);
  const lines = p.restingEdges.map((e) =>
    e.map((q) => {
      const w = add(at, qRotate(rot, q));
      const s = add(projectOntoPlane(w, ready.normal, ready.centre), lift);
      return new Vector3(s[0], s[1], s[2]);
    }),
  );
  if (st.hoverShadow === null || st.hoverShadowCount !== lines.length) {
    st.hoverShadow?.dispose();
    st.hoverShadow = CreateLineSystem("hover-shadow", { lines, updatable: true }, st.scene);
    st.hoverShadow.color = SHADOW_COLOUR.clone();
    st.hoverShadow.isPickable = false;
    st.hoverShadowCount = lines.length;
  } else CreateLineSystem("hover-shadow", { lines, instance: st.hoverShadow }, st.scene);
  st.hoverShadow.setEnabled(true);
  // the face that will host the hover: a faint fill (rebuilt when the face changes)
  const key = `${ready.id}|${ready.faceId}|${ready.centre.map((x) => x.toFixed(4)).join(",")}`;
  if (st.hoverFaceKey !== key) {
    st.hoverFaceKey = key;
    st.hoverFaceFill?.dispose(false, true); // ⭐ (2026-10-14, the hover's audit) its own material with it (it leaked one per face)
    st.hoverFaceFill = buildFaceFill(st, ready.id, ready.faceId, lift);
  }
  st.hoverFaceFill?.setEnabled(true);
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
  for (const i of used) {
    const w = add(add(place.position, qRotate(place.orientation, topo.positions[i]!)), lift);
    positions.push(w[0], w[1], w[2]);
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
  return fill;
}
