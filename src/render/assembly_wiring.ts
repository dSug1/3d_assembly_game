/**
 * ⭐⭐⭐ (2026-11-08, `TILTED_ORBIT_REBUILD_SCOPE.md` §32, rebuilt from `d926b88` — `1.0.105-`'s travel, view, piece and camera, §29's ropes deleted)
 * **THE ORBIT AROUND THE ASSEMBLY, WIRED** — on while `orbitMode` is 0. No rule here: the travel is `input/loop_travel.ts` (T1 – T6), the view
 * `input/loop_view.ts` (V1 – V6, T5's test), the close-in chart `input/close_in_chart.ts` (K1 – K8, C1 – C4), the cut `input/plane_cut.ts`, G1
 * `input/face_map.ts`. This file holds the state and the calls:
 * * G1 — the face map's facets of the placed parts (their planes at the parts' support — the shell); the travel's place on it (`st.loop`), moved ONLY by the
 *   finger and its coast (`loopFinger` — T6), a face crossed only where the view is continuous (T5); the shown place and view eased toward it every frame.
 * * P1 — the piece outside G1 along the shown view at the approach's distance (`shownOffset` / `placeOffset`: the same function) — no solver; close in
 *   (C4) its direction turned onto the chart's normal as it nears the shell, so A + dy lands on the gizmo.
 * * V5 — the camera along the shown view (world yaw and pitch, never roll), the owner's offsets, never past the zenith.
 * * §32 CLOSE IN (C1): within `closeInMm` of the shell ONE chart is anchored on the facet the place is on (K5) and frozen; the gizmo is the place carried
 *   straight in along the facet's normal onto the parts (K1 – K4: the region continuous by construction); the place is held inside the region (K6 — the HUD
 *   names it; A + dy out and back in anchors anew); the lines short (K7), the region's outline drawn (K8). Far out: no gizmo, no lines.
 * * A1 – A2 — the approach: above G1 along the piece's direction, below it straight toward the gizmo, collision-checked; below G1 the slide owns the drag.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { approachAt, approachDistance, approachStep, approachStepFree, farDistance, lookShare, modelNormal, orbitDir, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { buildFaceMap, shellExit, type FaceMap, type MapFace } from "../input/face_map";
import { CASTS_PER_FILL, allowedShare, anchorChart, chartAllows, chartEdgeDistance, chartFilled, chartGizmo, chartLines, chartRing, chartUV, closeInDir, closeInNext, facetAccept, facetGrid, fillChart, fillGrid, gridDone, hullParts, type Chart, type FacetAccept, type FacetGrid, type HullPart } from "../input/close_in_chart";
import type { RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { orbitDegPerMm } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { faceLift, shellBox, type ShellBox } from "../input/orbit_shell";
import { syncCentre } from "./camera_rig";
import { greenDragGains, pieceSolveOptions, pieceSolverEnv, ringAnchorAt, orbitDvPerMm } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import { faceTrianglesWorld, hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { calmShare, cameraView, sameView, viewAt, viewDir, viewFacets, type View, type ViewFacet, type ViewOpts } from "../input/loop_view";
import { HOLD_FREE, isCapNormal, travelAt, travelStep, type CrossOk, type Travel, type TravelFacet, type TravelOpts } from "../input/loop_travel";
import { dot, type Vec3 } from "../core/vec";
import { faceWorld, worldPlacementOf } from "../core/object_model";
import { boxOf, type Box3 } from "../input/ray_box";

/** ⭐⭐ (§32 K7) the lines' reach each side of the gizmo (m — "limited to a small surface locally"), their segments' cap, their lift off the surface (m). */
const LINE_HALF_M = 0.05;
const LINE_MAX = 48;
const SECTION_LIFT_M = 0.002;
/** ⭐ (§32 K8) the outline's lift (m), its redraw interval while the fill grows (frames), the edge's nearness that brightens it (m). */
const OUTLINE_LIFT_M = 0.0015;
const RING_MAX = 1024;
const OUTLINE_NEAR_M = 0.02;
/** ⭐ (§32) the gizmo's fade in (ms). */
const GIZMO_FADE_MS = 150;

/** ⭐⭐⭐ (§32 C1) Is the gizmo shown (around the assembly: close in only), and its opacity (its fade in)? Elsewhere always, opaque. */
export function gizmoShowing(st: SceneState, nowMs: number): number {
  if (!assemblyOn(st)) return 1;
  if (!st.asmGizmoOn) return 0;
  return Math.max(0.05, Math.min(1, (nowMs - st.asmGizmoSince) / GIZMO_FADE_MS));
}
/** ⭐ The HUD's word for T5's stop. */
const EDGE_HELD = "orbit: held at the edge — the face beyond is not reachable this way (its view would roll or turn over); the far faces by dx round the walls";
const BELOW_G1 = "orbit: brought in — a drag takes the piece back out to orbit (the slide where the resting face looks at the face)";
/** ⭐ (§32 K6) The HUD's word for the close-in area's stop. */
const AREA_HELD = "orbit: the edge of the close-in area — bring the piece out (A + dy) and back in to move on";

/** ⭐ Is the orbit the one around the assembly? */
export function assemblyOn(st: SceneState): boolean {
  return st.cfg.orbitMode === 0;
}

/** ⭐ The gizmo shown (§32): its point on the real parts, the face's normal there (`null` over a bridge), its part, its chart coordinates. */
interface GizmoShown {
  readonly point: Vec3;
  readonly normal: Vec3 | null;
  readonly host: string | null;
  readonly uv: readonly [number, number];
}

/** ⭐ The rebuild's state: G1 (its key, facets, the view's facets and knobs), the travel, the shown place and view (and their spring velocities), the gizmo. */
export interface LoopState {
  readonly key: string;
  readonly map: FaceMap;
  readonly facets: readonly TravelFacet[];
  readonly view: { readonly facets: readonly ViewFacet[]; readonly opts: ViewOpts };
  /** ⭐⭐⭐ §32.12 the view's knobs NOW: the calm's shares faded by the piece's distance (`calmShare` — none at the farthest, the sliders' at close in) */
  calm: ViewOpts;
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
  /** ⭐⭐⭐ §32 K1 — the placed parts' convex hulls (the casts), K2 — each facet's accepted landings (the boot pass, per placed set) */
  readonly hulls: readonly HullPart[];
  readonly accept: readonly FacetAccept[];
  /** ⭐⭐⭐ §32 C1 — close in, and its chart (anchored on entering, frozen until left) */
  closeIn: boolean;
  chart: Chart | null;
  /** ⭐⭐⭐ §32.10 THE ATLAS: each facet's grid of landings, cast in the background after the boot pass (: the facet has no accepted landing) */
  readonly grids: readonly (FacetGrid | null)[];
  /** ⭐⭐⭐ §32.9 — under the slide, the gizmo's offset from the orbit's centre at the latch (the gizmo rides the slide); `null` off the slide */
  slideG: Vec3 | null;
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
  const ids: (string | null)[] = [];
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
    ids.push(st.idOf.get(m) ?? null);
    const b = boxOf(vs);
    if (b !== null) boxes.set(m, b);
  }
  st.asmParts = { key, parts, ids, boxes };
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
  // ⭐⭐⭐ §32 K1 – K2 — the hulls the chart casts against, and THE BOOT PASS: each facet's accepted landings (per placed set — rerun when a piece is placed)
  const pp = placedParts(st);
  const hulls = hullParts(pp.parts, pp.ids);
  const accept = map.facets.map((mf) => facetAccept(hulls, mf));
  const grids = map.facets.map((mf, i) => (Number.isFinite(accept[i]!.maxDepth) ? facetGrid(hulls, mf) : null));
  st.loop = { key, map, facets, view, travel, last: "x", p, pVel: [0, 0, 0], shown, shownVel: [0, 0, 0], u: viewDir(shown), dtMs: 16, gz: null, hulls, accept, closeIn: false, chart: null, grids, slideG: null, calm: view.opts };
  return st.loop;
}

/** ⭐ V3 – V4 — the view at a travel's place (a cap's from its entry wall). */
function viewOf(L: LoopState, t: Travel): View {
  return viewAt(L.view.facets, t.facet, t.p, t.entry, L.calm);
}

/** ⭐⭐⭐ §32.12 THE CALM BY DISTANCE: the view's shares at the piece's distance now (the farthest: none; the close-in distance and nearer: the sliders'). */
function calmNow(st: SceneState, L: LoopState): void {
  const o = L.view.opts;
  const d = approachDistance(st.cfg, st.approach);
  const inM = Math.max(1e-3, st.cfg.closeInMm / 1000);
  const far = farDistance(st.cfg);
  L.calm = { ...o, shareH: calmShare(o.shareH, d, inM, far), shareV: calmShare(o.shareV, d, inM, far) };
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
  calmNow(st, L);
  const o = travelOpts(st);
  let moved = false;
  // ⭐⭐⭐ T5 — a face crossed only where the view is continuous
  const crossOk = crossOkOf(L);
  const C = L.chart;
  // ⭐⭐⭐ §32 K6 — close in, the place stays inside the chart's region (and on its facet): a step cut back to the region's edge, named on the HUD
  const inArea = (t: Travel): boolean => C === null || (t.facet === C.facet && chartAllows(C, ...chartUV(C, t.p)));
  for (const [comp, mm] of [["x", fx], ["y", fy]] as const) {
    if (mm === 0) continue;
    let r = travelStep(L.facets, L.travel, comp, mm, o, crossOk);
    if (C !== null && !inArea(r.travel)) {
      const k = allowedShare((m) => inArea(travelStep(L.facets, L.travel, comp, mm * m, o, crossOk).travel));
      r = k > 0 ? travelStep(L.facets, L.travel, comp, mm * k, o, crossOk) : { travel: L.travel, held: null, crossed: 0 };
      if (st.lastVerdict !== AREA_HELD) {
        st.lastVerdict = AREA_HELD;
        st.hudDirty = true;
      }
    }
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
  const d = approachDistance(st.cfg, approach);
  // ⭐⭐⭐ §32 C4 — close in, the piece's direction turns from the view onto the chart's normal as it nears the shell, and its foot from the place onto the
  // shifted place (K5) — so at the shell it stands straight above the gizmo and A + dy goes straight in onto it; continuous at the close-in distance
  const C = L.chart;
  const inM = Math.max(1e-3, st.cfg.closeInMm / 1000);
  const s = C === null ? 1 : Math.max(0, Math.min(1, d / inM));
  const u = C === null ? L.u : closeInDir(L.u, C.f.n, s);
  const w = 1 - s * s * (3 - 2 * s);
  const base: Vec3 = C === null ? L.p : [L.p[0] + (C.f.t[0] * C.shift[0] + C.f.b[0] * C.shift[1]) * w, L.p[1] + (C.f.t[1] * C.shift[0] + C.f.b[1] * C.shift[1]) * w, L.p[2] + (C.f.t[2] * C.shift[0] + C.f.b[2] * C.shift[1]) * w];
  const o: Vec3 = [base[0] - L.p[0], base[1] - L.p[1], base[2] - L.p[2]];
  const lift = Math.max(0, liftOf(st, u));
  // ⭐⭐⭐ (§27.2 G1s) P1 — from the foot along the direction out to where the SHELL is left, then the approach's distance
  const t0 = shellExit(L.map.facets, base, u);
  if (d >= 0) return [o[0] + u[0] * (t0 + d + lift), o[1] + u[1] * (t0 + d + lift), o[2] + u[2] * (t0 + d + lift)];
  // A1 — below the shell: from where the direction leaves it straight toward the gizmo, as far in as `−d`
  const g = st.asmGizmoAt ?? base;
  const v: Vec3 = [g[0] - base[0] - u[0] * t0, g[1] - base[1] - u[1] * t0, g[2] - base[2] - u[2] * t0];
  const lv = Math.hypot(v[0], v[1], v[2]);
  const k = lv > 1e-9 ? Math.min(1, -d / lv) : 0;
  return [o[0] + u[0] * (t0 + lift) + v[0] * k, o[1] + u[1] * (t0 + lift) + v[1] * k, o[2] + u[2] * (t0 + lift) + v[2] * k];
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
  calmNow(st, L);
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
    // ⭐⭐⭐ (2026-11-08, scope §32.9) the gizmo RIDES THE SLIDE at its offset from the centre at the latch — below the shell the piece's offset aims at it
    // (`offsetAt`). ⛔ Set to the centre (the shell's place): on a face 40 mm below the shell the piece jumped back up to the shell at the latch, the slide
    // read it as taken away and let go, the way out re-derived the approach above the shell, A + dy brought it in again — a latch loop every 10 frames
    // (`d926b88` too: 12 reversals on seed 22, 18 on `16b38c4`; 0 with the fix)
    if (L.slideG === null) {
      const g0 = st.asmGizmoAt ?? t;
      L.slideG = [g0[0] - t[0], g0[1] - t[1], g0[2] - t[2]];
    }
    st.asmGizmoAt = [t[0] + L.slideG[0], t[1] + L.slideG[1], t[2] + L.slideG[2]];
    st.asmLook = [t[0], t[1], t[2]];
    st.asmGizmoOn = false;
    hideLines(st);
    // §32.10 the ring hidden with the gizmo and its lines while the slide holds the piece
    if (st.asmOutline !== null) st.asmOutline.isVisible = false;
    return;
  }
  L.slideG = null;
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
    // §32 — a new chart from where the slide left the piece
    L.chart = null;
    L.closeIn = false;
    st.lastVerdict = "orbit: off the slide — the travel from where the slide left the piece";
  }
  if (st.router.size === 0 && !st.orbitInertia.coasting && (L.travel.hold.x !== 0 || L.travel.hold.y !== 0)) L.travel = { ...L.travel, hold: HOLD_FREE };
  // ⭐⭐⭐ V6 (2026-11-08, §32.11 — the owner: *"i don't like the way the piece movement springs during the orbit … Now that the gizmo is not used for
  // orbit, i think a spring is unwarranted. There was no such spring in the finalized polar orbit movement"*) the shown place and view ARE the travel's,
  // at once — the piece and the camera with them. ⛔ The critically damped spring (`orbitSpringMs`, 30 ms): the piece trailed the travel 40 – 50 mm while
  // moving and caught up ~200 ms after the finger stopped — a rubber band.
  const vT = viewOf(L, L.travel);
  L.p = [L.travel.p[0], L.travel.p[1], L.travel.p[2]];
  L.pVel = [0, 0, 0];
  L.shown = vT;
  L.shownVel = [0, 0, 0];
  L.u = viewDir(L.shown);
  // the orbit's angles ARE the shown view (the HUD, the probes, the slide's way out read them)
  st.orbit.reset(L.shown.h, vOfPitch(L.shown.e));
  // ⭐⭐⭐ §32 C1 — CLOSE IN (the piece within `closeInMm` of the shell, left 30 mm further out): a chart anchored on the facet the place is on (K5), frozen
  // until close in is left; filled a budget of casts a frame (K3 – K4). Far out: no chart, no gizmo, no lines.
  const inM = Math.max(1e-3, st.cfg.closeInMm / 1000);
  L.closeIn = closeInNext(L.closeIn, d, inM);
  if (!L.closeIn) L.chart = null;
  else if (L.chart === null) {
    const fi = L.travel.facet;
    L.chart = anchorChart(L.hulls, fi, L.map.facets[fi]!, L.accept[fi]!, L.travel.p, pieceWidth(st), L.grids[fi] ?? null, Math.max(0.001, st.cfg.closeInRingMm / 1000));
  }
  const C = L.chart;
  if (C !== null && !chartFilled(C)) fillChart(C, L.hulls);
  // ⭐⭐⭐ §32.10 THE ATLAS in the background: the facet the place is on first, then the others — a budget of casts a frame, none once all are cast
  else {
    const order = [L.travel.facet, ...L.grids.map((_, i) => i).filter((i) => i !== L.travel.facet)];
    let budget = CASTS_PER_FILL;
    for (const i of order) {
      const G = L.grids[i];
      if (G === null || G === undefined || gridDone(G)) continue;
      budget -= fillGrid(G, L.hulls, budget);
      if (budget <= 0) break;
    }
  }
  // the gizmo: the shown place carried in (K1 – K3), else the travel's own place, else where it last was (the shown place trailing outside the region)
  let gz: GizmoShown | null = null;
  if (C !== null)
    for (const at of [L.p, L.travel.p]) {
      const uv = chartUV(C, at);
      const q = chartGizmo(C, uv[0], uv[1]);
      if (q !== null) {
        gz = { ...q, uv };
        break;
      }
    }
  if (gz === null && C !== null && L.gz !== null) gz = L.gz;
  L.gz = C === null ? null : gz;
  const g = L.gz;
  if (g !== null && !st.asmGizmoOn) st.asmGizmoSince = performance.now();
  st.asmGizmoOn = g !== null;
  const fN = L.facets[L.travel.facet]!.n;
  if (st.gizmoNormal === null || st.gizmoNormal === undefined || dot(st.gizmoNormal, fN) < Math.cos(Math.PI / 180)) {
    st.gizmoNormal = fN;
    st.orientDirty = true;
  }
  if (g !== null && g.host !== null && g.normal !== null && dot(g.normal, fN) > Math.cos(Math.PI / 180) && (st.gizmoHost ?? null) !== g.host) {
    st.gizmoHost = g.host;
    st.orientDirty = true;
  }
  st.asmG = [L.travel.p[0], L.travel.p[1], L.travel.p[2]];
  st.asmGizmoAt = g === null ? null : [g.point[0], g.point[1], g.point[2]];
  st.asmGizmo = [L.p[0], L.p[1], L.p[2]];
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // the look point: the assembly's centre far out, the shown place close in
  const w = lookShare(Math.max(0, d), farDistance(st.cfg), st.cfg.assemblyLockDistM, false);
  const lt: Vec3 = [a.centre[0] + (L.p[0] - a.centre[0]) * w, a.centre[1] + (L.p[1] - a.centre[1]) * w, a.centre[2] + (L.p[2] - a.centre[2]) * w];
  // ⭐⭐⭐ (§32.12) NOT EASED: the camera tied to the piece at every distance, as far out (⛔ eased 120 ms while the piece is not: at a middle distance the look
  // trailed the place 85 – 100 mm — the piece sawed −3° … −5° on the screen at each event and slid back 4.4° over ~200 ms after the release)
  st.asmLook = lt;
  sectionLinesFrame(st, L, g);
  outlineFrame(st, L, g);
}

function hideLines(st: SceneState): void {
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
}

/**
 * ⭐⭐⭐ §32 K7 — THE LINES, SHORT: the green along the chart's `t`, the red along its `b`, through the gizmo, each in its plane `(t, n)` / `(b, n)` through
 * the gizmo exactly, as far as the region goes, at most `LINE_HALF_M` each side (`chartLines`); the gizmo a vertex of both. ONE mesh, updated in place.
 * Far out (no gizmo): hidden.
 */
function sectionLinesFrame(st: SceneState, L: LoopState, g: GizmoShown | null): void {
  const C = L.chart;
  if (st.cfg.sectionLines !== 1 || g === null || C === null) {
    hideLines(st);
    return;
  }
  const key = `${C.version}|${g.uv[0].toFixed(5)}|${g.uv[1].toFixed(5)}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const n = C.f.n;
  const gv = new Vector3(g.point[0] + n[0] * SECTION_LIFT_M, g.point[1] + n[1] * SECTION_LIFT_M, g.point[2] + n[2] * SECTION_LIFT_M);
  const ls = chartLines(C, g.uv[0], g.uv[1], LINE_HALF_M);
  const segs = (pts: readonly Vec3[]): Vector3[][] => {
    const vs = pts.map((p) => new Vector3(p[0] + n[0] * SECTION_LIFT_M, p[1] + n[1] * SECTION_LIFT_M, p[2] + n[2] * SECTION_LIFT_M));
    const out: Vector3[][] = [];
    for (let k = 1; k < vs.length; k++) out.push([vs[k - 1]!, vs[k]!]);
    return out;
  };
  const pad = (s: Vector3[][]): Vector3[][] => {
    const o = s.slice(0, LINE_MAX);
    while (o.length < LINE_MAX) o.push([gv, gv]);
    return o;
  };
  const lines = [...pad(segs(ls.green)), ...pad(segs(ls.red))];
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

/**
 * ⭐⭐⭐ §32.10 K8 — THE RING (the owner: *"the ring is cast when the piece crosses the offset and is then fixed (until the piece goes back away). The gizmo
 * and red/green sections (and therefore inputs) are constrained within that ring"*): the disk of `closeInRingMm` round the gizmo where close in was
 * entered, inside the region (`chartRing` — a circle, cut by the region's border where the region is smaller), a light neutral line just off the surface,
 * shown at once with the gizmo (its area flooded from the atlas in that frame; until whole, not shown), FIXED until close in is left; brighter when the
 * gizmo is within `OUTLINE_NEAR_M` of its border (the stop is near). Far out: hidden.
 */
function outlineFrame(st: SceneState, L: LoopState, g: GizmoShown | null): void {
  const C = L.chart;
  if (st.cfg.sectionLines !== 1 || g === null || C === null || !chartFilled(C)) {
    if (st.asmOutline !== null) st.asmOutline.isVisible = false;
    return;
  }
  // ⭐⭐⭐ the ring FIXED where close in was entered (its centre and radius the chart's): drawn once, when its area is whole
  const key = `${C.facet}|${C.u0}|${C.v0}|${C.cu}|${C.cv}|${C.ringR}|${C.version}`;
  if (key !== st.asmOutlineKey || st.asmOutline === null) {
    st.asmOutlineKey = key;
    const n = C.f.n;
    const lift = (p: Vec3): Vector3 => new Vector3(p[0] + n[0] * OUTLINE_LIFT_M, p[1] + n[1] * OUTLINE_LIFT_M, p[2] + n[2] * OUTLINE_LIFT_M);
    const segs: Vector3[][] = [];
    for (const loop of chartRing(C, C.cu, C.cv, C.ringR)) for (let k = 0; k < loop.length; k++) segs.push([lift(loop[k]!), lift(loop[(k + 1) % loop.length]!)]);
    const pin = lift(g.point);
    const lines = segs.slice(0, RING_MAX);
    while (lines.length < RING_MAX) lines.push([pin, pin]);
    if (st.asmOutline === null) {
      st.asmOutline = CreateLineSystem("asmOutline", { lines, updatable: true }, st.scene);
      st.asmOutline.isPickable = false;
      st.asmOutline.alwaysSelectAsActiveMesh = true;
      st.asmOutline.alphaIndex = 999;
    } else CreateLineSystem("asmOutline", { lines, instance: st.asmOutline });
  }
  const o = st.asmOutline;
  o.isVisible = true;
  const near = chartEdgeDistance(C, g.uv[0], g.uv[1], OUTLINE_NEAR_M) < OUTLINE_NEAR_M;
  o.color = near ? new Color3(1, 1, 1) : new Color3(0.82, 0.84, 0.88);
  o.alpha = near ? 1 : 0.55;
}

/** ⭐ (§32 K4) the piece's resting face's narrowest width (m): recesses and gaps narrower than this are bridged; none: 45 mm. */
function pieceWidth(st: SceneState): number {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  const pts = p?.restingEdges.flat() ?? [];
  const n = p?.restingFace?.normal;
  if (pts.length < 3 || n === undefined) return 0.045;
  const a = Math.abs(n[0]) < 0.9 ? normalizeOr([0, n[2], -n[1]]) : normalizeOr([-n[2], 0, n[0]]);
  const b: Vec3 = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
  let w = Infinity;
  for (let k = 0; k < 36; k++) {
    const t = (k * Math.PI) / 36;
    const dir: Vec3 = [a[0] * Math.cos(t) + b[0] * Math.sin(t), a[1] * Math.cos(t) + b[1] * Math.sin(t), a[2] * Math.cos(t) + b[2] * Math.sin(t)];
    let lo = Infinity;
    let hi = -Infinity;
    for (const q of pts) {
      const s = dot(q, dir);
      lo = Math.min(lo, s);
      hi = Math.max(hi, s);
    }
    w = Math.min(w, hi - lo);
  }
  return Number.isFinite(w) && w > 1e-4 ? w : 0.045;
}
const normalizeOr = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-12 ? [v[0] / l, v[1] / l, v[2] / l] : [1, 0, 0];
};

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
