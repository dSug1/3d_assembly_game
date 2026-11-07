/**
 * ⭐⭐⭐ (2026-11-06, THE SECOND REBUILD — `TILTED_ORBIT_REBUILD_SCOPE.md` §26, on §22) **THE ORBIT AROUND THE ASSEMBLY, WIRED** — on while `orbitMode` is 0.
 * No rule here: the travel is `input/loop_travel.ts` (T1 – T6), the view `input/loop_view.ts` (V1 – V6, T5's test), what a face is for a line
 * `input/rope.ts` (§29 the ropes), the cut `input/plane_cut.ts`, G1 `input/face_map.ts`. This file holds the state and the calls:
 * * G1 — the face map's facets of the placed parts (their planes at the parts' support); the travel's place on it (`st.loop`), moved ONLY by the finger
 *   and its coast (`loopFinger` — T6), a face crossed only where the view is continuous (T5); the shown place and view eased toward it every frame.
 * * P1 — the piece outside G1 along the shown view at the approach's distance (`shownOffset` / `placeOffset`: the same function) — no solver.
 * * V5 — the camera along the shown view (world yaw and pitch, never roll), the owner's offsets, never past the zenith.
 * * §29 THE ROPE (`input/rope.ts`) — G1 is the shell (each facet at the parts' outermost point); along each loop through the shown place every place
 *   casts straight in, its landing the first real surface; the rope joins the landings (a step drawn along the normal, a void spanned straight); the
 *   gizmo ON the rope of the line last travelled at the shown place — it never waits; the lines the two ropes, each only as far as the travel reaches.
 * * A1 – A2 — the approach: above G1 along the view, below it straight toward the gizmo, collision-checked; below G1 the slide owns the drag.
 * ⛔ `1.0.103-`'s calm direction, the camera's cone and carried up, the view's hold, the nearest-point gizmo, the lines as the gizmo's paths (§26.5).
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { approachAt, approachDistance, approachStep, approachStepFree, easePoint, farDistance, lookShare, modelNormal, orbitDir, swayRay, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { buildFaceMap, shellExit, type FaceMap, type MapFace } from "../input/face_map";
import { buildRope, ropeAt, ropeDrawn, type Landing, type Rope, type RopePlace } from "../input/rope";
import type { RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { orbitDegPerMm, springPoint } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { faceLift, shellBox, type ShellBox } from "../input/orbit_shell";
import { syncCentre } from "./camera_rig";
import { greenDragGains, pieceSolveOptions, pieceSolverEnv, ringAnchorAt, orbitDvPerMm } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import { faceTrianglesWorld, hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { cameraView, sameView, viewAt, viewDir, viewFacets, type View, type ViewFacet, type ViewOpts } from "../input/loop_view";
import { HOLD_FREE, isCapNormal, travelAt, travelReach, travelStep, type CrossOk, type Travel, type TravelFacet, type TravelOpts } from "../input/loop_travel";
import { loopLength, loopPoint, onContour, planeThrough } from "../input/plane_cut";
import { cross, dot, normalize, type Vec3 } from "../core/vec";
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
/** ⭐ The HUD's word for T5's stop. */
const EDGE_HELD = "orbit: held at the edge — the face beyond is not reachable this way (its view would roll or turn over); the far faces by dx round the walls";
const BELOW_G1 = "orbit: brought in — a drag takes the piece back out to orbit (the slide where the resting face looks at the face)";

/** ⭐ Is the orbit the one around the assembly? */
export function assemblyOn(st: SceneState): boolean {
  return st.cfg.orbitMode === 0;
}

/** ⭐ The gizmo shown (Gz1): its point on the real parts, the face's normal there, its part, and the travel at its own place (the lines' — Gz2). */
interface GizmoShown {
  readonly point: Vec3;
  readonly normal: Vec3 | null;
  readonly host: string | null;
  readonly travel: Travel;
}

/** ⭐ The rebuild's state: G1 (its key, facets, the view's facets and knobs), the travel, the shown place and view (and their spring velocities), the gizmo. */
export interface LoopState {
  readonly key: string;
  readonly map: FaceMap;
  readonly facets: readonly TravelFacet[];
  readonly view: { readonly facets: readonly ViewFacet[]; readonly opts: ViewOpts };
  travel: Travel;
  last: "x" | "y";
  p: Vec3;
  pVel: Vec3;
  shown: View;
  shownVel: Vec3;
  /** the shown view's direction (the piece's offset and the approach read it) */
  u: Vec3;
  dtMs: number;
  gz: GizmoShown | null;
  /** ⭐ §29 the two ropes through the gizmo's own place (the green `x`, the red `y`), for that place's key */
  ropes: { readonly key: string; readonly x: Rope | null; readonly y: Rope | null } | null;
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
  const view = {
    facets: viewFacets(map.facets),
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
  const shown = L !== null ? L.shown : viewAt(view.facets, fi, p, travel.entry, view.opts);
  st.loop = { key, map, facets, view, travel, last: "x", p, pVel: [0, 0, 0], shown, shownVel: [0, 0, 0], u: viewDir(shown), dtMs: 16, gz: null, ropes: null };
  return st.loop;
}

/** ⭐ V3 – V4 — the view at a travel's place (a cap's from its entry wall). */
function viewOf(L: LoopState, t: Travel): View {
  return viewAt(L.view.facets, t.facet, t.p, t.entry, L.view.opts);
}

/** ⭐⭐⭐ T5 — a crossing taken only where the view just before the edge is the view just after it (`sameView`). */
function crossOkOf(L: LoopState): CrossOk {
  return (from, to) => sameView(viewOf(L, from), viewOf(L, to));
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
  // ⭐⭐⭐ T5 — a face crossed only where the view is continuous
  const crossOk = crossOkOf(L);
  for (const [comp, mm] of [["x", fx], ["y", fy]] as const) {
    if (mm === 0) continue;
    const r = travelStep(L.facets, L.travel, comp, mm, o, crossOk);
    if (r.travel !== L.travel) moved = true;
    L.travel = r.travel;
    L.last = comp;
    if (r.held === "EDGE" && st.lastVerdict !== EDGE_HELD) {
      st.lastVerdict = EDGE_HELD;
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
  // ⭐⭐⭐ (§27.2 G1s) P1 — from the track's place along the view out to where the SHELL is left, then the approach's distance
  const t0 = shellExit(L.map.facets, L.p, u);
  if (d >= 0) return [u[0] * (t0 + d + lift), u[1] * (t0 + d + lift), u[2] * (t0 + d + lift)];
  // A1 — below the shell: from where the view leaves it straight toward the gizmo, as far in as `−d`
  const g = st.asmGizmoAt ?? L.p;
  const v: Vec3 = [g[0] - L.p[0] - u[0] * t0, g[1] - L.p[1] - u[1] * t0, g[2] - L.p[2] - u[2] * t0];
  const lv = Math.hypot(v[0], v[1], v[2]);
  const k = lv > 1e-9 ? Math.min(1, -d / lv) : 0;
  return [u[0] * (t0 + lift) + v[0] * k, u[1] * (t0 + lift) + v[1] * k, u[2] * (t0 + lift) + v[2] * k];
}

/** ⭐ The piece's place from the orbit's centre (the shown place on G1) — the solver's and the approach's queries (the angles unused: P1). */
export function placeOffset(st: SceneState, _yaw: number, _v: number, approach: number = st.approach): Vec3 {
  return offsetAt(st, approach);
}

/** ⭐ The DRAWN piece's place from the shown place. */
export function shownOffset(st: SceneState, _yaw: number, _v: number): Vec3 {
  return offsetAt(st, st.approach);
}

/** ⭐⭐⭐ §29 R1 — A PLACE's LANDING: the first real surface straight in along its facet's normal (any surface, at any depth); none: `null` (a void). */
function landingOf(st: SceneState, q: RopePlace): Landing | null {
  const b = shellOf(st);
  if (b === null) return null;
  const h = realAlong(st, q.p, q.n, b);
  return h === null ? null : { point: h.point, host: h.host };
}

/**
 * ⭐⭐⭐ §29 THE TWO ROPES through the gizmo's own place `gt` — each along its loop as far as the travel reaches (`travelReach`: T5's edges, R4's stops; the
 * whole loop when nothing stops it), the place at arc 0. Kept while the place and its planes do not move.
 */
function ropesOf(st: SceneState, L: LoopState, gt: Travel): { readonly x: Rope | null; readonly y: Rope | null } {
  const pl = gt.planes;
  const key = `${gt.facet}|${gt.p.map((v) => v.toFixed(6)).join(",")}|${pl[0].n.map((v) => v.toFixed(5)).join(",")}|${pl[1].n.map((v) => v.toFixed(5)).join(",")}`;
  if (L.ropes !== null && L.ropes.key === key) return L.ropes;
  const o = travelOpts(st);
  const crossOk = crossOkOf(L);
  const one = (comp: "x" | "y"): Rope | null => {
    const r = travelReach(L.facets, gt, comp, o, crossOk);
    if (r === null) return null;
    const total = loopLength(r.loop);
    const closed = r.fwd + r.back >= total - 1e-6;
    const from = closed ? -total / 2 : -r.back;
    const to = closed ? total / 2 : r.fwd;
    const at = (s: number): RopePlace => {
      const q = loopPoint(r.loop, r.s0 + s);
      return { p: q.p, facet: q.facet, n: L.facets[q.facet]!.n };
    };
    return buildRope(at, (q) => landingOf(st, q), from, to, LINE_STEP_M, total);
  };
  L.ropes = { key, x: one("x"), y: one("y") };
  return L.ropes;
}

/** ⭐ The frontmost real surface along `−n` through `p` (a ray from outside the parts' box); none: `null`. */
function realAlong(st: SceneState, p: Vec3, n: Vec3, b: ShellBox): GizmoHit | null {
  const level = dot(p, n);
  const sup = (sg: 1 | -1): number => sg * (Math.max(sg * b.lo[0] * n[0], sg * b.hi[0] * n[0]) + Math.max(sg * b.lo[1] * n[1], sg * b.hi[1] * n[1]) + Math.max(sg * b.lo[2] * n[2], sg * b.hi[2] * n[2]));
  const out = sup(1) + CAST_OUT_M;
  const k = out - level;
  return modelCast(st, [p[0] + n[0] * k, p[1] + n[1] * k, p[2] + n[2] * k], [-n[0], -n[1], -n[2]], out - sup(-1) + CAST_OUT_M);
}

/**
 * ⭐⭐⭐ Gz1 – Gz2 — THE GIZMO'S OWN PLACE: the shown place moved along the two cutting planes' common line onto G1 (`onContour`) — both planes pass through
 * it, so the gizmo is a vertex of both lines in every frame (⛔ the notch: the lines cut through the travel's target). Its travel: the target's, at that
 * place, the planes through it.
 */
function gizmoTravel(L: LoopState): Travel {
  const t = L.travel;
  const n0 = t.planes[0].n;
  const n1 = t.planes[1].n;
  let d = normalize(cross(n0, n1)) ?? L.facets[t.facet]!.n;
  const fn = L.facets[t.facet]!.n;
  if (dot(d, fn) < 0) d = [-d[0], -d[1], -d[2]];
  const c = onContour(L.map.facets, L.p, d);
  if (c === null) return t;
  return { ...t, p: c.p, facet: c.facet, planes: [planeThrough(c.p, n0), planeThrough(c.p, n1)] };
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
    // its depth below the SHELL (§27.2 G1s: the approach is measured from the shell)
    const depth = dot([pieceNow.x - p[0], pieceNow.y - p[1], pieceNow.z - p[2]], mf.n) - Math.max(0, liftOf(st, mf.n)) - (mf.es - mf.e);
    L.travel = travelAt(L.facets, p, fi);
    L.p = p;
    st.approach = approachAt(st.cfg, depth);
    st.asmLock = null;
    st.lastVerdict = "orbit: off the slide — the travel from where the slide left the piece";
  }
  if (st.router.size === 0 && !st.orbitInertia.coasting && (L.travel.hold.x !== 0 || L.travel.hold.y !== 0)) L.travel = { ...L.travel, hold: HOLD_FREE };
  // V6 — the shown place and view follow the travel's on the orbit's critically damped spring (no speed jump at a pointer event)
  const tau = st.cfg.orbitSpringMs;
  const vT = viewOf(L, L.travel);
  const sp = springPoint(L.p, L.pVel, L.travel.p, dtMs, tau);
  L.p = sp.at;
  L.pVel = sp.vel;
  const hT = L.shown.h + Math.atan2(Math.sin(vT.h - L.shown.h), Math.cos(vT.h - L.shown.h));
  const sv = springPoint([L.shown.h, L.shown.e, 0], L.shownVel, [hT, vT.e, 0], dtMs, tau);
  L.shown = { h: Math.atan2(Math.sin(sv.at[0]), Math.cos(sv.at[0])), e: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, sv.at[1])) };
  L.shownVel = sv.vel;
  L.u = viewDir(L.shown);
  // the orbit's angles ARE the shown view (the HUD, the probes, the slide's way out read them)
  st.orbit.reset(L.shown.h, vOfPitch(L.shown.e));
  // ⭐⭐⭐ §29 R5 — the gizmo ON THE ROPE of the line last travelled, at its own place (arc 0): a landing, over a void, round an edge — it never waits
  const gt = gizmoTravel(L);
  const R = ropesOf(st, L, gt);
  const own = R[L.last] ?? R[L.last === "x" ? "y" : "x"];
  const on = own === null ? null : ropeAt(own, 0);
  L.gz = on === null ? { point: gt.p, normal: null, host: null, travel: gt } : { point: on.p, normal: on.overVoid ? null : on.n, host: on.host, travel: gt };
  const g = L.gz;
  const fN = L.facets[g.travel.facet]!.n;
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
  sectionLinesFrame(st, L, g);
}

function hideLines(st: SceneState): void {
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
}

/**
 * ⭐⭐⭐ §29 THE LINES — THE TWO ROPES (`input/rope.ts`): the green the dx loop's, the red the dy loop's, through the gizmo's own place, each drawn only as far
 * as the travel reaches; a step drawn along the normal, a void spanned straight (across it, or round the edge). The gizmo a vertex of both: on the rope
 * it travels by construction, the other rope taken through it at arc 0. Rebuilt only when the gizmo or its planes move. ONE mesh, updated in place.
 */
function sectionLinesFrame(st: SceneState, L: LoopState, g: GizmoShown): void {
  if (st.cfg.sectionLines !== 1) {
    hideLines(st);
    return;
  }
  const gp = g.point;
  const pl = g.travel.planes;
  const key = `${pl[0].n.map((x) => x.toFixed(5)).join(",")}|${pl[0].d.toFixed(5)}|${pl[1].n.map((x) => x.toFixed(5)).join(",")}|${pl[1].d.toFixed(5)}|${gp.map((x) => x.toFixed(5)).join(",")}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const gv = new Vector3(gp[0], gp[1], gp[2]);
  const R = ropesOf(st, L, g.travel);
  const lift = (p: Vec3, n: Vec3): Vector3 => new Vector3(p[0] + n[0] * SECTION_LIFT_M, p[1] + n[1] * SECTION_LIFT_M, p[2] + n[2] * SECTION_LIFT_M);
  const path = (comp: "x" | "y"): Vector3[][] => {
    const r = R[comp];
    if (r === null) return [];
    const pts = ropeDrawn(r);
    const vs: Vector3[] = [];
    let passed = false;
    for (const q of pts) {
      // the gizmo a vertex of the line at arc 0
      if (!passed && q.s >= 0) {
        vs.push(gv);
        passed = true;
        if (Math.abs(q.s) < 1e-9) continue;
      }
      vs.push(lift(q.p, q.n));
    }
    if (!passed) vs.push(gv);
    const out: Vector3[][] = [];
    for (let k = 1; k < vs.length; k++) out.push([vs[k - 1]!, vs[k]!]);
    return out;
  };
  const pad = (segs: Vector3[][]): Vector3[][] => {
    const s = segs.slice(0, LINE_MAX);
    while (s.length < LINE_MAX) s.push([gv, gv]);
    return s;
  };
  const lines = [...pad(path("x")), ...pad(path("y"))];
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
 * ⭐⭐⭐ V5 — THE CAMERA'S FRAME: along the SHOWN view (world yaw and pitch — never a roll), the owner's offsets in its own frame, the pitch never past ±90°
 * (never past the zenith) — `cameraView`. No state: the up is the view's own (V2).
 */
export function assemblyCameraFrame(st: SceneState, _cam: OrbitAt, off?: CameraAngleOffset, _commit: boolean = false): RigCameraFrame {
  const L = st.loop;
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  return cameraView(L === null ? { h: -Math.PI / 2, e: 0 } : L.shown, o.yawRad, o.pitchRad);
}

/** ⭐ The slide's cone (the slide's own): never a constraint on the orbit — the orbit's angles are the travel's. */
export function leavesCone(_st: SceneState, _yaw0: number, _v0: number, _yaw1: number, _v1: number): boolean {
  return false;
}
