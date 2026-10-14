/**
 * ⭐⭐⭐ prototype — **THE HOVER, WIRED** (2026-10-14; `input/hover.ts`, `HOVER.md`). A drag that starts ON the orbited piece slides it (and, by
 * default, the yellow gizmo) in the plane of the part face its resting face lies against — only while the two are anti-parallel and in contact;
 * each step solved by the orbit's own clearance rule (the other faces stop and slide it). The camera eases toward the HOVER VIEW with the drag's
 * travel, and back as the orbit comes back. ⛔ No rule here: the decisions are `input/hover.ts`'s and the solver's.
 */
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { SceneState } from "./scene_state";
import type { Sample } from "../input";
import { mmToPx } from "../core/units";
import { qRotate, type Quat, type Vec3 } from "../core/vec";
import { bodiesBehindPlane, bodiesWithin, contactNormal, type CollisionSetup } from "../core/collision";
import { pieceCollisionSetup } from "./collision_wiring";
import { AT_CONTACT_M, solveOrbitStep } from "../input/piece_orbit_solver";
import {
  HOVER_SPAN_M,
  clampDisc,
  hoverCameraPosition,
  hoverContact,
  hoverContactM,
  hoverPlane,
  hoverViewProgress,
  hoverViewWeight,
  planeStepFromScreen,
} from "../input/hover";
import { pieceSolveOptions, pieceSolverEnv } from "./green_box_wiring";
import { syncCentre } from "./camera_rig";
import { MotionTracker, SwayWatcher, impulseForPeak, swayScale } from "../input";
import { advanceFollow } from "../input/follow";
import { exponentialSmooth, phantomTarget } from "../input/lead";
import { ORBIT_SWAY_MIN_DEG, orbitSwingAxis, placedBarycentre } from "../input/green_box";
import { hoverSwayDeg } from "../input/hover";
import { swingBlock } from "./sway_pass";
import { worldPlacementOf } from "../core/object_model";

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
}

/** ⭐ A world point on the screen, in the samples' CSS pixels. */
function screenOf(st: SceneState, p: Vec3): [number, number] {
  const w = st.engine.getRenderWidth();
  const v = Vector3.Project(new Vector3(p[0], p[1], p[2]), Matrix.Identity(), st.scene.getTransformMatrix(), st.camera.viewport.toGlobal(w, st.engine.getRenderHeight()));
  const k = w > 0 ? st.canvas.clientWidth / w : 1;
  return [v.x * k, v.y * k];
}

/** ⭐ May the drag hover? The resting face against a part's face, anti-parallel and in contact (`hoverContact`); then the hover starts. */
function hoverStart(st: SceneState, pointerId: number): boolean {
  const b = st.greenBox;
  const p = st.orbitPieces.find((o) => o.mesh === b);
  const anchor = st.pieceAnchor;
  if (b === null || p === undefined || p.restingFace === null || anchor === null || st.pieceQ === null || st.orbitPiecePlaced) return false;
  if (st.pieceOrbit !== null || st.pieceEntry !== null || st.centreReturn !== null || st.hold !== null || st.restAlign !== null) return false;
  const r = b.rotationQuaternion ?? Quaternion.Identity();
  const rot: Quat = [r.w, r.x, r.y, r.z];
  const restingW = qRotate(rot, p.restingFace.normal);
  const opt = pieceSolveOptions(st);
  const maxGap = hoverContactM(opt.gapM, AT_CONTACT_M);
  const setup = pieceCollisionSetup(st);
  const contacts = bodiesWithin(st.world, b.name, setup, maxGap).map((c) => ({ ...c, normal: contactNormal(st.world, b.name, c.id, setup) }));
  const c = hoverContact(restingW, contacts, maxGap);
  if (c === null) {
    st.lastVerdict = "hover: the resting face is not against a part's face (anti-parallel, in contact) — the drag orbits";
    st.hudDirty = true;
    return false;
  }
  const right = st.camera.getDirection(new Vector3(1, 0, 0));
  const plane = hoverPlane(c.normal, [right.x, right.y, right.z]);
  if (plane === null) return false;
  const centre0: Vec3 = [st.orbitCentreM.x, st.orbitCentreM.y, st.orbitCentreM.z];
  // ⭐⭐ (*"make sure that if collision faces are coplanar, the hover can continue over several parts' collision faces, provided within the max hover distance … the piece should be able to slide over the two white and one black parts"*) the parts lying wholly behind the contact face's plane are out of the hover's checks: the piece slides across coplanar faces
  const level = c.normal[0] * anchor[0] + c.normal[1] * anchor[1] + c.normal[2] * anchor[2] - c.gapM;
  const behind = bodiesBehindPlane(st.world, setup, c.normal, level, opt.gapM / 2);
  behind.delete(b.name);
  st.hover = { pointerId, n: c.normal, e1: plane.e1, e2: plane.e2, origin: [anchor[0], anchor[1], anchor[2]], centre0, offset0: st.hoverOffset ?? [0, 0, 0], u: 0, v: 0, partId: c.id, behind };
  // ⭐ the drawn offset FOLLOWS the solved one, as a translated part's mesh follows its model (`render_loop`'s follower)
  st.hoverFollow = { e1: plane.e1, e2: plane.e2, centre0, offset0: st.hoverOffset ?? [0, 0, 0], gizmo: st.cfg.hoverGizmoMove === 1, u: 0, v: 0, fu: { x: 0, v: 0 }, fv: { x: 0, v: 0 }, vu: 0, vv: 0, lu: 0, lv: 0 };
  st.hoverOffsetFading = false;
  if (st.hoverView === null) st.hoverView = { progress: 0, target: [anchor[0], anchor[1], anchor[2]], n: c.normal, e1: plane.e1, e2: plane.e2 };
  st.lastVerdict = `hover: on ${c.id}'s face — the drag slides the ${st.cfg.hoverGizmoMove === 1 ? "gizmo and the piece" : "piece"}`;
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐ One move of a finger that pressed on the orbited piece: `true` when the hover took it (or it is still a possible tap — nothing moves),
 * `false` to let the orbit have it.
 */
export function hoverDragStep(st: SceneState, pointerId: number, s: Sample, prev: Sample): boolean {
  void prev;
  const hb = st.hoverBand?.pointerId === pointerId ? st.hoverBand : null;
  if (hb !== null) hb.band.push(s);
  if (st.hover?.pointerId !== pointerId) {
    const hp = st.hoverPress;
    if (hp === null || hp.pointerId !== pointerId) return false;
    if (Math.hypot(s.x - hp.x, s.y - hp.y) < mmToPx(st.cfg.doubleTapSlop)) return true; // still a possible tap: nothing moves
    st.hoverPress = null;
    if (!hoverStart(st, pointerId)) {
      st.hoverBand = null;
      return false;
    }
  }
  const h = st.hover!;
  const b = st.greenBox;
  if (b === null) return false;
  // ⭐⭐ through the DEADBAND: a wobble on the axis the finger is not moving emits nothing
  const step = hb !== null ? hb.band.step : { dx: 0, dy: 0 };
  const dx = step.dx;
  const dy = step.dy;
  if (dx === 0 && dy === 0) return true;
  // the finger's step on the plane (each axis's screen shadow, per metre)
  const at = add(h.origin, add(scale(h.e1, h.u), scale(h.e2, h.v)));
  const s0 = screenOf(st, at);
  const s1 = screenOf(st, add(at, scale(h.e1, 0.01)));
  const s2 = screenOf(st, add(at, scale(h.e2, 0.01)));
  const a1: [number, number] = [(s1[0] - s0[0]) / 0.01, (s1[1] - s0[1]) / 0.01];
  const a2: [number, number] = [(s2[0] - s0[0]) / 0.01, (s2[1] - s0[1]) / 0.01];
  const [du, dv] = planeStepFromScreen(dx, dy, a1, a2, st.cfg.hoverGain);
  const [tu, tv] = clampDisc(h.u + du, h.v + dv, st.cfg.hoverAmplitudeMm);
  // ⭐ solved by the orbit's clearance rule, its two coordinates the plane's (the second offset into the solver's 0 … 1)
  const base = pieceCollisionSetup(st);
  const setup: CollisionSetup = { ...base, exempt: (x, y) => (base.exempt?.(x, y) ?? false) || h.behind.has(x) || h.behind.has(y) };
  const env = pieceSolverEnv(st, (q) => add(h.origin, add(scale(h.e1, q.yaw), scale(h.e2, (q.v - 0.5) * HOVER_SPAN_M))), setup);
  const r = solveOrbitStep({ yaw: h.u, v: 0.5 + h.v / HOVER_SPAN_M, zoom: 1 }, [tu - h.u, (tv - h.v) / HOVER_SPAN_M], env, pieceSolveOptions(st));
  st.pieceQueries += r.queries;
  st.pieceMoveBlocked = r.blocked;
  const moved = add(scale(h.e1, r.q.yaw - h.u), scale(h.e2, (r.q.v - 0.5) * HOVER_SPAN_M - h.v));
  h.u = r.q.yaw;
  h.v = (r.q.v - 0.5) * HOVER_SPAN_M;
  // ⭐⭐ the SOLVED offset is the follower's target — drawn by `hoverFrame`, as a translated part's mesh follows its model
  const hf = st.hoverFollow;
  if (hf !== null) {
    hf.u = h.u;
    hf.v = h.v;
  }
  // ⭐⭐ (*"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value (i don't know what this value shall be) when hover translation"*) the other parts SWAY at the least angle — a hover is a slide along a part (`hoverSwayDeg`), about the placed parts
  if (hb !== null) hoverSway(st, hb.sway, s, moved, Math.hypot(dx, dy));
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
 * ⭐⭐ Each frame: the hover's drawn offset FOLLOWS the solved one — the part translation's own follower (`translateInertiaMs`,
 * `translateDampingRatio`, the phantom lead `translateLeadMs`), per plane axis — and is applied: the gizmo moved (the piece riding it) or the
 * piece alone. Once the finger lifted and the drawn offset settled, it ends. The hover finger's deadband ticked (a still finger sends no event).
 */
export function hoverFrame(st: SceneState, now: number, dtSec: number): void {
  if (st.hoverBand !== null) st.hoverBand.band.tick(now);
  const hf = st.hoverFollow;
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
  const w = add(scale(hf.e1, hf.fu.x), scale(hf.e2, hf.fv.x));
  if (hf.gizmo) {
    st.centreBlend.snapTo(add(hf.centre0, w));
    syncCentre(st);
  } else st.hoverOffset = add(hf.offset0, w);
  // settled after the release: the drawn offset IS the solved one
  const settled = Math.abs(hf.fu.x - hf.u) + Math.abs(hf.fv.x - hf.v) < 1e-6 && Math.abs(hf.fu.v) + Math.abs(hf.fv.v) < 1e-5;
  if (st.hover === null && settled) {
    const end = add(scale(hf.e1, hf.u), scale(hf.e2, hf.v));
    if (hf.gizmo) {
      st.centreBlend.snapTo(add(hf.centre0, end));
      syncCentre(st);
    } else st.hoverOffset = add(hf.offset0, end);
    st.hoverFollow = null;
  }
}

/**
 * ⭐ An orbit drag's step (`travelMm` of finger): the piece-only offset is dropped (*"Cleared on orbit"* — eased out over the next frames), and
 * the camera leaves the hover view with the orbit's travel (the way out).
 */
export function hoverOrbitStep(st: SceneState, travelMm: number): void {
  if (travelMm <= 0) return;
  if (st.hoverOffset !== null) st.hoverOffsetFading = true;
  const hv = st.hoverView;
  if (hv !== null) {
    hv.progress = hoverViewProgress(hv.progress, travelMm, st.cfg.hoverCameraGain, false);
    if (hv.progress <= 0) st.hoverView = null;
  }
}

/** ⭐ Each frame: a dropped piece-only offset eased out (τ = `boxSmoothMs` / 2). */
export function hoverOffsetFrame(st: SceneState, dtMs: number): void {
  const o = st.hoverOffset;
  if (o === null || !st.hoverOffsetFading) return;
  const k = Math.exp(-dtMs / Math.max(1, st.cfg.boxSmoothMs / 2));
  const n = scale(o, k);
  if (Math.hypot(n[0], n[1], n[2]) < 1e-4) {
    st.hoverOffset = null;
    st.hoverOffsetFading = false;
  } else st.hoverOffset = n;
}

/** ⭐ The camera blended toward the hover view by its progress (the boot distance and the CAMERA OFFSET's angles). */
export function hoverCameraBlend(st: SceneState, camAt: Vec3, lookAt: Vec3): { camAt: Vec3; lookAt: Vec3 } {
  const hv = st.hoverView;
  if (hv === null) return { camAt, lookAt };
  const w = hoverViewWeight(hv.progress);
  if (w <= 0) return { camAt, lookAt };
  const dist = st.bootCamPieceDistM ?? Math.hypot(camAt[0] - hv.target[0], camAt[1] - hv.target[1], camAt[2] - hv.target[2]);
  const pos = hoverCameraPosition(
    hv.target,
    hv.n,
    hv.e1,
    hv.e2,
    dist,
    (st.cfg.cameraYawOffsetDeg * Math.PI) / 180,
    (st.cfg.cameraPitchOffsetDeg * Math.PI) / 180,
    [camAt[0] - hv.target[0], camAt[1] - hv.target[1], camAt[2] - hv.target[2]],
  );
  return { camAt: lerp3(camAt, pos, w), lookAt: lerp3(lookAt, hv.target, w) };
}
