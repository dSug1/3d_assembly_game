/**
 * ⭐⭐⭐ (2026-11-06, THE REBUILD — `TILTED_ORBIT_REBUILD_SCOPE.md` §22) **THE ORBIT AROUND THE ASSEMBLY, WIRED** — on while `orbitMode` is 0. No rule here:
 * the travel is `input/loop_travel.ts` (T1 – T6), the piece's direction `input/loop_calm.ts` (P2), the camera's up `input/loop_camera.ts` (C2 – C3), the
 * cut `input/plane_cut.ts`, G1 `input/face_map.ts`. This file holds the state and the calls:
 * * G1 — the face map's facets of the placed parts (their planes at the parts' support); the travel's place on it (`st.loop`), moved ONLY by the finger
 *   and its coast (`loopFinger` — T6); the shown place and direction eased toward it every frame (`assemblyFrame`).
 * * P1 — the piece outside G1 along its direction at the approach's distance (`shownOffset` / `placeOffset`: the same function) — the orbit cannot touch a
 *   part, no solver (`green_box_wiring.ts` skips it in this mode).
 * * C1 – C3 — the camera along the shown direction with the owner's offsets, its up toward the face's target at the camera's pace, never past a cap's zenith.
 * * Gz0 – Gz3 — the gizmo SHOWN on the real parts (`gizmoFor`): on a face the cast along its normal (a void closed along the line travelled: straight
 *   across on the face's plane); beyond (or a void open along it) the parts' nearest point; the lines the gizmo's paths along the two loops.
 * * A1 – A2 — the approach: above G1 along the direction, below it straight toward the gizmo, collision-checked; below G1 the slide owns the drag (its arm
 *   the depth alone).
 * ⛔ The frame turns, the face map's angle grid as the travel, the shell, the calm's state, §20's up from the view — deleted (scope §22.7).
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { approachAt, approachDistance, approachStep, approachStepFree, easePoint, farDistance, lookShare, modelNormal, offsetWithUp, orbitDir, swayRay, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { buildFaceMap, type FaceMap, type MapFace } from "../input/face_map";
import { gizmoCase, mainGroup } from "../input/gizmo_rule";
import type { RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { orbitDegPerMm, springPoint } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { faceLift, shellBox, type ShellBox } from "../input/orbit_shell";
import { syncCentre } from "./camera_rig";
import { greenDragGains, pieceSolveOptions, pieceSolverEnv, ringAnchorAt, orbitDvPerMm } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import { faceTrianglesWorld, hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { calmDir, calmFacets, type CalmFacet, type CalmOpts } from "../input/loop_calm";
import { capCameraClamp, nextCarried, paceUp, upTarget, viewAllowed } from "../input/loop_camera";
import { HOLD_FREE, isCapNormal, travelAt, travelLoops, travelStep, type Travel, type TravelFacet, type TravelOpts } from "../input/loop_travel";
import { loopArc, loopLength, loopPoint, type CutLoop } from "../input/plane_cut";
import { separationBetween } from "../core/collision_shape";
import { dot, normalize, type Vec3 } from "../core/vec";
import { faceWorld, worldPlacementOf } from "../core/object_model";
import { boxOf, rayMeetsBox, type Box3 } from "../input/ray_box";

/** ⭐ The look point's ease (ms). */
const LOOK_TAU_MS = 120;
/** ⭐ A cast for the real surface starts this far outside the parts' box (m). */
const CAST_OUT_M = 0.05;
/** ⭐ The lines' samples along a loop (m) and their lift off the surface (m). */
const LINE_STEP_M = 0.012;
const LINE_MAX = 700;
const SECTION_LIFT_M = 0.002;
/** ⭐ The HUD's word for T5's hold. */
const VIEW_HELD = "orbit: held — beyond, the view would be slanted or upside down (travel back; the far faces by dx round the walls)";
const BELOW_G1 = "orbit: brought in — a drag takes the piece back out to orbit (the slide where the resting face looks at the face)";

/** ⭐ Is the orbit the one around the assembly? */
export function assemblyOn(st: SceneState): boolean {
  return st.cfg.orbitMode === 0;
}

/** ⭐ The rebuild's state: G1 (its key, facets, the calm's facets), the travel, the shown place / direction / up, the gizmo's part (Gz2's tie). */
export interface LoopState {
  readonly key: string;
  readonly map: FaceMap;
  readonly facets: readonly TravelFacet[];
  readonly calm: { readonly facets: readonly CalmFacet[]; readonly opts: CalmOpts };
  travel: Travel;
  last: "x" | "y";
  p: Vec3;
  u: Vec3;
  /** the shown place's and direction's spring velocities */
  pVel: Vec3;
  uVel: Vec3;
  upShown: Vec3 | null;
  /** ⭐⭐⭐ (§22.2 T5, §22.4 C2) the up carried by the view rule — along the travel (the hold's), and along the shown direction (the camera's) */
  viewCarried: Vec3 | null;
  camCarried: Vec3 | null;
  dtMs: number;
  gzPart: number | null;
  lineKey: string;
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

/** ⭐ THE ASSEMBLY, once: its centre (the placed parts' box's — fixed for the scene) and radius. */
export function ensureAssembly(st: SceneState): void {
  if (st.asm !== null) return;
  const box = placedBox(st);
  const t = st.centreBlend.targetM;
  const centre: Vec3 = box === null ? [t[0], t[1], t[2]] : [(box.lo[0] + box.hi[0]) / 2, (box.lo[1] + box.hi[1]) / 2, (box.lo[2] + box.hi[2]) / 2];
  const radius = box === null ? 0.5 : Math.max(box.hi[0] - box.lo[0], box.hi[1] - box.lo[1], box.hi[2] - box.lo[2]) / 2;
  st.asm = { centre, radius };
  st.asmGizmo = null;
  st.asmLook = null;
  st.asmG = null;
}

interface GizmoHit {
  readonly point: Vec3;
  readonly normal: Vec3 | null;
  readonly host: string | null;
}

/** ⭐ A pick on a placed part read on its MODEL pose (`unswayHit`) — never on the mesh as swayed by the orbit. */
function modelHit(st: SceneState, mesh: AbstractMesh | null, point: Vec3, normal: Vec3 | null, localN: Vec3 | null = null): { point: Vec3; normal: Vec3 | null } {
  const id = mesh === null ? undefined : st.idOf.get(mesh);
  const pose = id === undefined ? null : worldPlacementOf(st.world, id);
  if (mesh === null || pose === null) return { point, normal };
  const p = mesh.absolutePosition;
  const r = mesh.absoluteRotationQuaternion;
  const at = unswayHit(point, normal, [p.x, p.y, p.z], [r.w, r.x, r.y, r.z], pose.position, pose.orientation);
  if (localN === null) return at;
  const s = mesh.absoluteScaling;
  return { point: at.point, normal: modelNormal(localN, [s.x, s.y, s.z], pose.orientation) };
}

/** ⭐ A ray cast in the MODEL's space against each placed part (its sway undone — `swayRay`), the nearest hit on its model pose. */
function modelCast(st: SceneState, origin: Vec3, dir: Vec3, length: number): GizmoHit | null {
  let best: { d: number; mesh: AbstractMesh; info: import("@babylonjs/core/Collisions/pickingInfo").PickingInfo } | null = null;
  for (const c of castParts(st)) {
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
const CAST_RAY = new Ray(new Vector3(), new Vector3(0, 0, 1), 1);
const CAST_BOX_MARGIN_M = 0.002;

type CastPart = NonNullable<SceneState["asmCast"]>["parts"][number];

/** ⭐ The parts a cast reads, once a frame: each placed mesh, its model pose, its drawn place and turn, its model-space box. */
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

/** ⭐ The parts' box (the face map's bound). */
function shellOf(st: SceneState): ShellBox | null {
  const parts = placedParts(st);
  if (st.asmShell !== null && st.asmShell.key === parts.key) return st.asmShell.box;
  const box = shellBox(parts.parts);
  st.asmShell = { key: parts.key, box };
  return box;
}

/** ⭐ The piece's lift along `u` (`faceLift`): its hull past its resting face's centre toward the assembly; none: 0. */
function liftOf(st: SceneState, u: Vec3): number {
  const id = st.greenBox?.name;
  const pts = id === undefined ? undefined : st.world.objects.get(id)?.shape?.points;
  const place = id === undefined ? null : worldPlacementOf(st.world, id);
  const rc = st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingCentre;
  return pts === undefined || place === null || rc === undefined ? 0 : faceLift(pts, place.orientation, rc, u);
}

type PlacedParts = NonNullable<SceneState["asmParts"]>;

/** ⭐ The placed parts' world vertices on their MODEL pose (each a convex body) and each mesh's model-space box, per placed set. */
function placedParts(st: SceneState): PlacedParts {
  const { key, meshes } = placedKey(st);
  if (st.asmParts !== null && st.asmParts.key === key) return st.asmParts;
  const parts: Vec3[][] = [];
  const boxes = new Map<AbstractMesh, Box3>();
  for (const m of meshes) {
    const pos = m.getVerticesData(VertexBuffer.PositionKind);
    if (pos === null) continue;
    const w = m.computeWorldMatrix(true);
    const seen = new Set<string>();
    const vs: Vec3[] = [];
    for (let i = 0; i + 2 < pos.length; i += 3) {
      const w0 = Vector3.TransformCoordinates(new Vector3(pos[i]!, pos[i + 1]!, pos[i + 2]!), w);
      const v = modelHit(st, m, [w0.x, w0.y, w0.z], null).point;
      const k = `${v[0].toFixed(6)},${v[1].toFixed(6)},${v[2].toFixed(6)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      vs.push(v);
    }
    if (vs.length === 0) continue;
    parts.push(vs);
    const b = boxOf(vs);
    if (b !== null) boxes.set(m, b);
  }
  st.asmParts = { key, parts, boxes };
  return st.asmParts;
}

/** ⭐ The placed set's key and meshes, once a frame. */
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

/** ⭐ G1 — the face map of the placed parts (upright, the world's), its facets' planes at the parts' support. */
function faceMapOf(st: SceneState): FaceMap | null {
  const parts = placedParts(st);
  const box = shellOf(st);
  if (box === null) return null;
  const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}`;
  if (st.asmFaceMap !== null && st.asmFaceMap.key === key) return st.asmFaceMap.map;
  const faces: MapFace[] = [];
  for (const [id, obj] of st.world.objects) {
    if (obj.orbited === true || obj.frozen === true || !goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1)) continue;
    const mesh = st.meshOf.get(id);
    if (mesh === undefined || !mesh.isEnabled()) continue;
    for (const f of obj.faces) {
      const w = faceWorld(st.world, id, f.id);
      const tris = faceTrianglesWorld(st, id, f.id);
      if (w === null || tris === null || tris.length === 0) continue;
      faces.push({ normal: w.normal, centre: w.centre, tris });
    }
  }
  const map = buildFaceMap(faces, box, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare });
  st.asmFaceMap = { key, map };
  return map;
}

/** ⭐ The travel's knobs from the sliders: the orbit's pace (°/mm of finger), the edge's slow stretch. */
function travelOpts(st: SceneState): TravelOpts {
  return {
    degPerMm: orbitDegPerMm(st.cfg, 0.5, greenDragGains(st)).yawDegPerMm,
    edgeM: Math.max(0, st.cfg.faceEdgeSlideMm) / 1000,
    edgeRad: (Math.max(0, st.cfg.faceEdgeSlideDeg) * Math.PI) / 180,
  };
}

/**
 * ⭐⭐⭐ THE REBUILD's STATE, kept for the placed set: G1 and its facets; the travel — at the boot on the facet facing the piece, at the boot gizmo's place
 * projected onto it; on a new placed set (G1 changed) the place carried onto the new G1's nearest facet. `null`: no assembly.
 */
function loopOf(st: SceneState): LoopState | null {
  const map = faceMapOf(st);
  if (map === null) return null;
  const key = st.asmFaceMap?.key ?? "";
  const L = st.loop;
  if (L !== null && L.key === key) return L;
  const facets: TravelFacet[] = map.facets.map((f) => ({ n: f.n, poly: f.poly, cap: isCapNormal(f.n) }));
  const cfg = st.cfg;
  const calm = {
    facets: calmFacets(map.facets),
    opts: {
      shareH: cfg.faceSpanShareH,
      shareV: cfg.faceSpanShareVOn === 1 ? cfg.faceSpanShareV : 1,
      edgeRad: (Math.max(0, cfg.faceEdgeSlideDeg) * Math.PI) / 180,
      edgeM: Math.max(0, cfg.faceEdgeSlideMm) / 1000,
    },
  };
  // the place: the old one (a new placed set) or the boot gizmo — onto the facet the piece's direction faces most (at the boot the orbit's boot direction —
  // ⛔ the spawned piece's position: far out before the orbit placed it), on its plane
  const from: Vec3 = L !== null ? L.travel.p : [st.centreBlend.targetM[0], st.centreBlend.targetM[1], st.centreBlend.targetM[2]];
  const toward: Vec3 = L !== null ? L.u : orbitDir(st.orbit.yaw, st.orbit.elevation);
  let fi = 0;
  let best = -Infinity;
  facets.forEach((f, i) => {
    const s = dot(f.n, toward);
    if (!f.cap && s > best) {
      best = s;
      fi = i;
    }
  });
  const f = map.facets[fi]!;
  const k = f.e - dot(f.n, from);
  const p: Vec3 = [from[0] + f.n[0] * k, from[1] + f.n[1] * k, from[2] + f.n[2] * k];
  const travel = travelAt(facets, p, fi);
  const u = L !== null ? L.u : calmDir(p, calm.facets, calm.opts, f.n) ?? f.n;
  st.loop = { key, map, facets, calm, travel, last: "x", p, u, pVel: [0, 0, 0], uVel: [0, 0, 0], upShown: L?.upShown ?? null, viewCarried: L?.viewCarried ?? null, camCarried: L?.camCarried ?? null, dtMs: 16, gzPart: null, lineKey: "" };
  return st.loop;
}

/** ⭐ P2 — the piece's direction at a travel's place (the calm's profile; a cap's from its entry wall, a wall's its own normal). */
function dirOf(L: LoopState, t: Travel): Vec3 {
  const f = L.facets[t.facet]!;
  const entry = f.cap ? t.entry : f.n;
  return calmDir(t.p, L.calm.facets, L.calm.opts, entry) ?? f.n;
}

/**
 * ⭐⭐⭐ T6 — THE FINGER'S STEP (and its coast's): `fx` right, `fy` up (mm) through the travel (`travelStep`, dx then dy); its holds named on the HUD. Below
 * G1 (A2) the orbit takes no drag — the slide owns it. Returns whether anything moved.
 */
export function loopFinger(st: SceneState, fx: number, fy: number): boolean {
  const L = loopOf(st);
  if (L === null || st.asmLocked) return false;
  // ⭐⭐⭐ A2 — below G1 the orbit never runs: without a slide (it latches only where the resting face looks at a face) the drag takes the piece back OUT
  // to G1 first, at the drag's own pace (the approach out, checked against the parts), then orbits (⛔ the drag refused: dead at a contact)
  if (approachDistance(st.cfg, st.approach) < 0) {
    approachMove(st, Math.hypot(fx, fy) * orbitDvPerMm(st));
    if (st.lastVerdict !== BELOW_G1) {
      st.lastVerdict = BELOW_G1;
      st.hudDirty = true;
    }
    return true;
  }
  const o = travelOpts(st);
  let moved = false;
  // ⭐⭐⭐ T5 — the view's rule at every place a step reaches (the up carried along the travel so far)
  const allowed = (t: Travel): boolean => viewAllowed(dirOf(L, t), L.viewCarried);
  for (const [comp, mm] of [["x", fx], ["y", fy]] as const) {
    if (mm === 0) continue;
    const r = travelStep(L.facets, L.travel, comp, mm, o, allowed);
    if (r.travel !== L.travel) moved = true;
    L.travel = r.travel;
    L.viewCarried = nextCarried(L.viewCarried, dirOf(L, L.travel));
    L.last = comp;
    if (r.held === "VIEW" && st.lastVerdict !== VIEW_HELD) {
      st.lastVerdict = VIEW_HELD;
      st.hudDirty = true;
    }
    if (r.crossed > 0) {
      st.lastVerdict = `orbit: onto ${L.facets[L.travel.facet]!.cap ? "a cap" : "a wall"}`;
      st.hudDirty = true;
    }
  }
  return moved;
}

/** ⭐ The piece's offset from the shown place (P1, A1) at the approach coordinate `approach`: above G1 along the direction, below it toward the gizmo. */
function offsetAt(st: SceneState, approach: number): Vec3 {
  const L = st.loop;
  if (L === null) return [0, 0, 0];
  const u = L.u;
  const d = approachDistance(st.cfg, approach);
  const lift = Math.max(0, liftOf(st, u));
  if (d >= 0) return [u[0] * (d + lift), u[1] * (d + lift), u[2] * (d + lift)];
  // A1 — below G1: from the contact with G1 straight toward the gizmo (its depth below the place), as far in as `−d`
  const g = st.asmGizmoAt ?? L.p;
  const v: Vec3 = [g[0] - L.p[0], g[1] - L.p[1], g[2] - L.p[2]];
  const lv = Math.hypot(v[0], v[1], v[2]);
  const k = lv > 1e-9 ? Math.min(1, -d / lv) : 0;
  return [u[0] * lift + v[0] * k, u[1] * lift + v[1] * k, u[2] * lift + v[2] * k];
}

/** ⭐ The piece's place from the orbit's centre (the shown place on G1) — the solver's and the approach's queries (the angles unused: P1). */
export function placeOffset(st: SceneState, _yaw: number, _v: number, approach: number = st.approach): Vec3 {
  return offsetAt(st, approach);
}

/** ⭐ The DRAWN piece's place from the shown place. */
export function shownOffset(st: SceneState, _yaw: number, _v: number): Vec3 {
  return offsetAt(st, st.approach);
}

/**
 * ⭐⭐⭐ Gz0 – Gz2 — THE GIZMO SHOWN at a place `p` on G1 (its facet `fi`) for the line `comp` travels: inside the face's closed region on a real face — the
 * frontmost real surface along the face's normal; on a void closed along the line — straight across on the face's plane; a void open along it, or beyond
 * the face — the parts' nearest point (where the piece would land). The host part when on a real face.
 */
function gizmoAt(st: SceneState, L: LoopState, p: Vec3, fi: number, comp: "x" | "y"): GizmoHit {
  const mf = L.map.facets[fi];
  if (mf === undefined) return { point: p, normal: null, host: null };
  const x = dot(p, mf.t);
  const y = dot(p, mf.b);
  const c = gizmoCase(mf.groups, x, y, comp);
  if (c === "REAL") {
    const b = shellOf(st);
    const h = b === null ? null : realAlong(st, p, mf.n, b);
    if (h !== null) return h;
  } else if (c === "BRIDGE") {
    const main = mainGroup(mf.groups)!;
    const k = main.depth - dot(p, mf.n);
    return { point: [p[0] + mf.n[0] * k, p[1] + mf.n[1] * k, p[2] + mf.n[2] * k], normal: mf.n, host: null };
  }
  return nearestPoint(st, L, p);
}

/** ⭐ The frontmost real surface along `−n` through `p` (a ray from outside the parts' box); none: `null`. */
function realAlong(st: SceneState, p: Vec3, n: Vec3, b: ShellBox): GizmoHit | null {
  const level = dot(p, n);
  const sup = (sg: 1 | -1): number => sg * (Math.max(sg * b.lo[0] * n[0], sg * b.hi[0] * n[0]) + Math.max(sg * b.lo[1] * n[1], sg * b.hi[1] * n[1]) + Math.max(sg * b.lo[2] * n[2], sg * b.hi[2] * n[2]));
  const out = sup(1) + CAST_OUT_M;
  const k = out - level;
  return modelCast(st, [p[0] + n[0] * k, p[1] + n[1] * k, p[2] + n[2] * k], [-n[0], -n[1], -n[2]], out - sup(-1) + CAST_OUT_M);
}

/** ⭐ Gz2 — THE PARTS' NEAREST POINT to `p` (GJK: a point against each part's hull); its part kept until another is nearer by the collision skin. */
function nearestPoint(st: SceneState, L: LoopState, p: Vec3): GizmoHit {
  const parts = placedParts(st).parts;
  let best: { i: number; d: number; q: Vec3 } | null = null;
  let kept: { i: number; d: number; q: Vec3 } | null = null;
  parts.forEach((hull, i) => {
    const v = separationBetween([p], hull);
    if (v === null) return;
    const d = Math.hypot(v[0], v[1], v[2]);
    const q: Vec3 = [p[0] - v[0], p[1] - v[1], p[2] - v[2]];
    if (best === null || d < best.d) best = { i, d, q };
    if (i === L.gzPart) kept = { i, d, q };
  });
  const skin = pieceSolveOptions(st).gapM;
  const b = best as { i: number; d: number; q: Vec3 } | null;
  const k = kept as { i: number; d: number; q: Vec3 } | null;
  const pick = k !== null && b !== null && k.d <= b.d + skin ? k : b;
  if (pick === null) return { point: p, normal: null, host: null };
  return { point: pick.q, normal: normalize([p[0] - pick.q[0], p[1] - pick.q[1], p[2] - pick.q[2]]), host: null };
}

/**
 * ⭐⭐ EVERY FRAME (before the piece is placed): the approach's coast; the slide's hold; the R4 hold freed with the drag; the shown place and direction
 * eased toward the travel's; the gizmo (Gz); the face for the quads (P3: G1's facet normal); the centre the orbit reads (the shown place); the look point;
 * the lines.
 */
export function assemblyFrame(st: SceneState, dtMs: number): void {
  if (!assemblyOn(st) || st.greenBox === null) return;
  ensureAssembly(st);
  const L = loopOf(st);
  if (L === null) return;
  L.dtMs = dtMs;
  const a = st.asm!;
  if (st.approachInertia.coasting) {
    const s = st.approachInertia.step(dtMs, st.cfg.boxSmoothMs * 4);
    approachMove(st, s.dV);
  }
  // A2 — the depth decides: below G1 the slide may latch (armed by the depth alone)
  const d = approachDistance(st.cfg, st.approach);
  st.slideArmed = d < 0;
  if (st.hover !== null) {
    const t = st.centreBlend.targetM;
    st.asmLocked = true;
    const n = st.gizmoNormal ?? null;
    st.asmLock = { point: [t[0], t[1], t[2]], normal: n, host: st.gizmoHost ?? null, cone: null };
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    hideLines(st);
    return;
  }
  if (st.asmLocked) {
    // ⭐ off the slide: the travel's place where the slide left the piece — on G1's facet facing it, the approach kept at the piece's depth below G1
    st.asmLocked = false;
    const g = st.asmLock?.point ?? L.p;
    const n = st.asmLock?.normal ?? null;
    let fi = L.travel.facet;
    let bestS = -Infinity;
    if (n !== null)
      L.facets.forEach((f, i) => {
        const s = dot(f.n, n);
        if (s > bestS) {
          bestS = s;
          fi = i;
        }
      });
    const mf = L.map.facets[fi]!;
    const k = mf.e - dot(mf.n, g);
    const p: Vec3 = [g[0] + mf.n[0] * k, g[1] + mf.n[1] * k, g[2] + mf.n[2] * k];
    const pieceNow = st.greenBox.getAbsolutePosition();
    const depth = dot([pieceNow.x - p[0], pieceNow.y - p[1], pieceNow.z - p[2]], mf.n) - Math.max(0, liftOf(st, mf.n));
    L.travel = travelAt(L.facets, p, fi);
    L.p = p;
    st.approach = approachAt(st.cfg, depth);
    st.asmLock = null;
    st.lastVerdict = "orbit: off the slide — the travel from where the slide left the piece";
  }
  if (st.router.size === 0 && !st.orbitInertia.coasting && (L.travel.hold.x !== 0 || L.travel.hold.y !== 0)) L.travel = { ...L.travel, hold: HOLD_FREE };
  // the shown place and direction follow the travel's on the orbit's critically damped spring (no speed jump at a pointer event)
  const tau = st.cfg.orbitSpringMs;
  const uT = dirOf(L, L.travel);
  if (L.viewCarried === null) L.viewCarried = nextCarried(null, uT);
  const sp = springPoint(L.p, L.pVel, L.travel.p, dtMs, tau);
  L.p = sp.at;
  L.pVel = sp.vel;
  const su = springPoint(L.u, L.uVel, uT, dtMs, tau);
  L.u = normalize(su.at) ?? uT;
  L.uVel = su.vel;
  // the orbit's angles follow the shown direction (the HUD, the probes, the slide's way out read them)
  const yaw = Math.atan2(L.u[2], L.u[0]);
  const pitch = Math.asin(Math.max(-1, Math.min(1, L.u[1])));
  st.orbit.reset(yaw, vOfPitch(pitch));
  // the gizmo (Gz) for the line last travelled; the face for the quads: G1's facet (P3), the host the gizmo's part when on that face
  const g = gizmoAt(st, L, L.p, L.travel.facet, L.last);
  const fN = L.facets[L.travel.facet]!.n;
  if (st.gizmoNormal === null || st.gizmoNormal === undefined || dot(st.gizmoNormal, fN) < Math.cos(Math.PI / 180)) {
    st.gizmoNormal = fN;
    st.orientDirty = true;
  }
  if (g.host !== null && g.normal !== null && dot(g.normal, fN) > Math.cos(Math.PI / 180) && (st.gizmoHost ?? null) !== g.host) {
    st.gizmoHost = g.host;
    st.orientDirty = true;
  }
  st.asmG = [L.travel.p[0], L.travel.p[1], L.travel.p[2]];
  st.asmGizmoAt = [g.point[0], g.point[1], g.point[2]];
  st.asmGizmo = [L.p[0], L.p[1], L.p[2]];
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // the look point: the assembly's centre far out, the shown place close in
  const w = lookShare(Math.max(0, d), farDistance(st.cfg), st.cfg.assemblyLockDistM, false);
  const lt: Vec3 = [a.centre[0] + (L.p[0] - a.centre[0]) * w, a.centre[1] + (L.p[1] - a.centre[1]) * w, a.centre[2] + (L.p[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  sectionLinesFrame(st, L, g.point);
}

function hideLines(st: SceneState): void {
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
}

/**
 * ⭐⭐⭐ Gz3 — THE LINES ARE THE GIZMO's PATHS: along each loop through the travel's place (the green the dx's, the red the dy's), at every sample the gizmo
 * for THAT line (`gizmoAt`), solid, the gizmo's exact point a vertex of both. Each line recomputed only when its plane moves. ONE mesh, updated in place.
 */
function sectionLinesFrame(st: SceneState, L: LoopState, gp: Vec3): void {
  if (st.cfg.sectionLines !== 1) {
    hideLines(st);
    return;
  }
  const { green, red } = travelLoops(L.facets, L.travel);
  const pl = L.travel.planes;
  const key = `${pl[0].n.map((x) => x.toFixed(5)).join(",")}|${pl[0].d.toFixed(5)}|${pl[1].n.map((x) => x.toFixed(5)).join(",")}|${pl[1].d.toFixed(5)}|${gp.map((x) => x.toFixed(5)).join(",")}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const gv = new Vector3(gp[0], gp[1], gp[2]);
  const path = (loop: CutLoop | null, comp: "x" | "y"): Vector3[][] => {
    const out: Vector3[][] = [];
    if (loop === null) return out;
    const total = loopLength(loop);
    const n = Math.max(3, Math.min(LINE_MAX - 2, Math.ceil(total / LINE_STEP_M)));
    const s0 = loopArc(loop, L.travel.p);
    const pts: Vector3[] = [];
    for (let k = 0; k <= n; k++) {
      const q = loopPoint(loop, s0 + (k / n) * total);
      const h = k === 0 || k === n ? { point: gp, normal: null } : gizmoAt(st, L, q.p, q.facet, comp);
      const nn = L.facets[q.facet]!.n;
      pts.push(k === 0 || k === n ? gv : new Vector3(h.point[0] + nn[0] * SECTION_LIFT_M, h.point[1] + nn[1] * SECTION_LIFT_M, h.point[2] + nn[2] * SECTION_LIFT_M));
    }
    for (let k = 0; k < pts.length - 1; k++) out.push([pts[k]!, pts[k + 1]!]);
    return out;
  };
  const pad = (segs: Vector3[][]): Vector3[][] => {
    const s = segs.slice(0, LINE_MAX);
    while (s.length < LINE_MAX) s.push([gv, gv]);
    return s;
  };
  const lines = [...pad(path(green, "x")), ...pad(path(red, "y"))];
  if (st.asmSectionLines === null) {
    const colours = lines.map((_, i) => (i < LINE_MAX ? [new Color4(0.35, 0.8, 0.35, 1), new Color4(0.35, 0.8, 0.35, 1)] : [new Color4(0.9, 0.25, 0.2, 1), new Color4(0.9, 0.25, 0.2, 1)]));
    st.asmSectionLines = CreateLineSystem("asmSections", { lines, colors: colours, updatable: true }, st.scene);
    st.asmSectionLines.isPickable = false;
    st.asmSectionLines.alwaysSelectAsActiveMesh = true;
    st.asmSectionLines.alpha = 0.99;
    st.asmSectionLines.alphaIndex = 1000;
  } else CreateLineSystem("asmSections", { lines, instance: st.asmSectionLines });
  st.asmSectionLines.isVisible = true;
}

/** ⭐⭐ THE APPROACH MOVED by `da` (the coordinate; down: in) — in and out only as far as the parts allow (`approachStepFree`). Returns the move taken. */
export function approachMove(st: SceneState, da: number): number {
  if (da === 0) return 0;
  const a0 = st.approach;
  const want = approachStep(a0, da, 1, st.cfg);
  if (want === a0) return 0;
  const out = want > a0;
  if (out) slideWayOutRebase(st);
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
      const p = ringAnchorAt(st, qq);
      st.approach = keep;
      return p;
    });
  const gapAt = (cand: number): number => envAt(cand).gap(q);
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
    const blocker = envAt(a0 + (want - a0) * hi).blocker?.(q) ?? null;
    st.lastVerdict = `orbit: the way out is blocked by ${blocker ?? "a part"} — slide to find a way out`;
    st.hudDirty = true;
  }
  return st.approach - a0;
}

/** ⭐ An approach input: `dyMm` of finger (UP brings the piece IN); recorded for the coast. */
export function approachInput(st: SceneState, dyMm: number): void {
  const taken = approachMove(st, dyMm * orbitDvPerMm(st));
  st.approachInertia.record(performance.now(), 0, taken);
  if (st.hover === null) hoverWayInStep(st, Math.abs(dyMm));
  st.hudDirty = true;
}

/** ⭐ The approach's input ends: its coast starts. */
export function approachRelease(st: SceneState): void {
  st.approachInertia.release(performance.now());
}

/**
 * ⭐⭐⭐ C1 – C3 — THE CAMERA'S FRAME: along the SHOWN direction (the travel's — never the orbit's angles: no pole), the owner's offsets about it; its up
 * toward the face's target (`upTarget`: a wall's gravity, a cap's carried axis) at the camera's pace (`paceUp`); on a cap never past its zenith
 * (`capCameraClamp`). `commit`: the frame's own camera carries its up to the next frame.
 */
export function assemblyCameraFrame(st: SceneState, _cam: OrbitAt, off?: CameraAngleOffset, commit: boolean = false): RigCameraFrame {
  const L = st.loop;
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  if (L === null) return offsetWithUp([0, 0, -1], [0, 1, 0], o.yawRad, o.pitchRad);
  const u = L.u;
  const f = L.facets[L.travel.facet]!;
  const target = upTarget(u, L.camCarried);
  let up = target;
  if (commit) {
    L.camCarried = nextCarried(L.camCarried, u);
    const r = paceUp(L.upShown, target, u, ((st.cfg.cameraRollDegPerS * Math.PI) / 180) * (Math.max(0, L.dtMs) / 1000));
    L.upShown = r.up;
    up = r.up;
  } else if (L.upShown !== null) {
    const k = dot(L.upShown, u);
    up = normalize([L.upShown[0] - k * u[0], L.upShown[1] - k * u[1], L.upShown[2] - k * u[2]]) ?? target;
  }
  const fr = offsetWithUp(u, up, o.yawRad, o.pitchRad);
  return f.cap ? capCameraClamp(fr.dir, fr.up, f.n, L.travel.entry) : fr;
}

/** ⭐ The slide's cone (the slide's own): never a constraint on the orbit — the orbit's angles are the travel's. */
export function leavesCone(_st: SceneState, _yaw0: number, _v0: number, _yaw1: number, _v1: number): boolean {
  return false;
}
