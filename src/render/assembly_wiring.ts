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
import { angleTo, lockCone, approachDistance, approachStep, coneClamp, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, offsetFrame, modelNormal, orbitDir, pitchOfV, swayRay, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { gizmoJoins, insertIndex, sectionFixed } from "../input/section_hull";
import { buildFaceMap, edgeBlend, mapAngles, mapTarget, planeAxes, stackDepthAt, stackOfNormal, syncAngle, type FaceMap, type MapFace, type MapOpts, type MapTarget } from "../input/face_map";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { pieceReach, shellAnchor, shellBox, type ShellBox } from "../input/orbit_shell";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import { faceTrianglesWorld, hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { slideArmedAfter } from "../input/hover";
import { alignedShare, calmHeading, poleWeight, easeNormal, easeToward, edgeShare, shownDir } from "../input/orbit_calm";
import type { Vec3 } from "../core/vec";
import { faceWorld, worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { boxOf, rayMeetsBox, type Box3 } from "../input/ray_box";

/** ⭐ The look point's ease (ms). */
const LOOK_TAU_MS = 120;
/** ⭐⭐⭐ (Step 4c-bis) the ray along the axis is taken for the exact surface within this of its group's plane (m) — a slanted block; else the plane. */
const MAP_REFINE_M = 0.025;
/** ⭐ …cast from this far outside the box (m). */
const MAP_OUT_M = 0.05;
/** ⭐ (Step 4c-bis) out of step after the slide: the map's angles close on the orbit's at 1 ± this of the orbit's step (`syncAngle`). */
const MAP_CATCH_UP = 0.5;

/** ⭐ Is the orbit the one around the assembly? */
export function assemblyOn(st: SceneState): boolean {
  return st.cfg.orbitMode === 0;
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

/** ⭐ The piece's direction at the orbit place — locked, kept in the face's cone (`coneClamp`). */
function dirAt(st: SceneState, yaw: number, v: number): Vec3 {
  const u = orbitDir(yaw, v);
  const n = st.asmLocked && st.asmLock !== null ? st.asmLock.normal : null;
  // ⭐⭐⭐ (2026-11-04, `1.0.95-`, the owner: *"i am referring to this calm behavior of commit 58d86ff… It shall stay"*) the piece and the camera on the SHOWN
  // direction — the orbit's angle calm in the middle of a face, whole at its edges (`calmDir`); the gizmo is still moved by the orbit's own `u`
  return n === null ? calmDir(st, u) : coneClamp(u, n, st.asmLock!.cone ?? undefined);
}

/**
 * ⭐⭐⭐ (58d86ff's `spanShownDir`, ported) THE PIECE'S SHOWN DIRECTION for the orbit's direction `u`: its angles off the gizmo's face's normal shown at the
 * eased shares (`st.asmCalm`) — ⭐⭐⭐ the SAME at every distance (the owner: *"modify the scope Q3: same calm at every distance"* — ⛔ 58d86ff's distance gate,
 * whole within 3.6 m and none from 5.4 m: an A + dy approach through it turned the piece's direction, the approach curved); faded only toward ±90° of pitch.
 */
function calmDir(st: SceneState, u: Vec3): Vec3 {
  const k = st.asmCalm;
  if (k === null) return u;
  const w = poleWeight(u[1]);
  if (!(w > 0)) return u;
  return shownDir(u, k.n, [-k.n[2], 0, k.n[0]], [0, 1, 0], 1 - (1 - k.sH) * w, 1 - (1 - k.sV) * w);
}

/**
 * ⭐⭐⭐ (2026-11-04, `1.0.95-`) THE CALM's targets, each frame — ⭐⭐⭐ (Step 4c-bis) from the FACE MAP's place (`st.asmShown.t`): on a SIDE the side the yaw
 * is in (its axis — the calm's normal), the place across it in the box's span (dx's run) and its height in the placed parts' box (dy's run) — `edgeShare`
 * of each (58d86ff's); over a top / under a bottom the orbit's whole angle (58d86ff: a face too thin for two zones). ⭐ The shares and the normal EASED
 * toward them (`easeToward`, `easeNormal`).
 */
function calmFrame(st: SceneState, dtMs: number): void {
  const t = st.asmShown?.t ?? null;
  const cfg = st.cfg;
  let n: Vec3 | null = null;
  let sH = 1;
  let sV = 1;
  if (t !== null && t.band === "SIDE") {
    // ⭐⭐⭐ (Step 4c-bis) the SIDE's axis, never a hit's normal (a groove's wall, a slanted block)
    n = t.normal;
    const L = t.across;
    sH = edgeShare(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm / 100);
    // ⭐⭐⭐ dy's run: the gizmo's HEIGHT within the placed parts' box — the same top and bottom on every face, so a pure dx never changes it (⛔ the
    // wall under the gizmo: its top differed from the front to the side at the same height — the owner's bounce, probed)
    const box = cfg.faceSpanShareVOn === 1 ? shellOf(st) : null;
    const y = t.surface[1];
    sV = box === null ? 1 : edgeShare(Math.min(y - box.lo[1], box.hi[1] - y), box.hi[1] - box.lo[1], cfg.faceSpanShareV, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100);
  }
  const k = st.asmCalm;
  if (k === null) {
    // ⭐ from none: the shares come in from 1 (the orbit's whole angle) — never a jump at the start
    if (n !== null) st.asmCalm = { n, sH: easeToward(1, sH, dtMs), sV: easeToward(1, sV, dtMs) };
    return;
  }
  if (n !== null) {
    // ⭐ the horizontal share whole: the normal changes nothing (the pitch is the world's up's, the heading the orbit's own) — taken at once (⛔ eased from
    // a stale face 175° away while the shares fell: a 271 mm camera jump)
    k.n = k.sH > 0.999 ? n : easeNormal(k.n, n, dtMs);
    // ⭐ the HORIZONTAL calm only as far as the normal has caught up with the face's — the vertical one never waits on it (⛔ both released at every corner:
    // the pitch swung up and the camera back under a pure dx — the owner's bounce, probed)
    sH = alignedShare(sH, k.n[0] * n[0] + k.n[2] * n[2]);
  }
  k.sH = easeToward(k.sH, sH, dtMs);
  k.sV = easeToward(k.sV, sV, dtMs);
}

/**
 * ⭐ The gizmo a query of the piece's place reads: locked, the locked point; else this frame's (`st.asmG`, the face map's); none yet, the map's at the
 * orbit's angles.
 */
function gizmoFor(st: SceneState): Vec3 {
  if (st.asmLocked && st.asmLock !== null) return st.asmLock.point;
  if (st.asmG !== null) return st.asmG;
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const m = mapGizmo(st, q.yaw, pitchOfV(q.v));
  if (m !== null) return m.hit.point;
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
 * the foot. Under the slide: the slide's gizmo itself (the slide unchanged).
 */
function footOf(st: SceneState, g: Vec3, u: Vec3, d: number): Vec3 {
  if (st.asmLocked) return g;
  return shellAnchor(g, u, d, st.cfg.orbitShellOffsetMm / 1000, shellOf(st), reachOf(st, u));
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
 * ~1300 times a drag frame (every solver query's foot, every section sample).
 */
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
      // ⭐⭐⭐ (2026-11-01) on the part's MODEL pose (`modelHit`) — ⛔ cached from the swaying mesh, a hull read mid-sway stayed turned
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

/** ⭐⭐⭐ (Step 4c-bis) the face map's knobs: the slow stretch through an edge (mm on each face) and the yaw / pitch it is crossed in (deg). */
function mapOpts(st: SceneState): MapOpts {
  return { edgeMm: st.cfg.faceEdgeSlideMm, edgeDeg: st.cfg.faceEdgeSlideDeg };
}

/**
 * ⭐⭐⭐ (Step 4c-bis) THE FACE MAP (`input/face_map.ts`) — the placed parts' faces on their MODEL pose (the slide's own: `faceWorld`,
 * `faceTrianglesWorld`), per placed set; `null` with no box.
 */
function faceMapOf(st: SceneState): FaceMap | null {
  const parts = placedParts(st);
  const box = shellOf(st);
  if (box === null) return null;
  if (st.asmFaceMap !== null && st.asmFaceMap.key === parts.key) return st.asmFaceMap.map;
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
  const map = buildFaceMap(faces, box);
  st.asmFaceMap = { key: parts.key, map };
  return map;
}

/**
 * ⭐⭐⭐ (2026-11-04, STEP 4c-bis) THE GIZMO FOR THE ORBIT'S ANGLES — no carrier, no state: the angles' place on the box (`mapTarget`), the stack its face
 * looks along, the FRONTMOST closed region there (`stackDepthAt`; none: the nearest group's plane, beside the real face); inside a region, the ray along
 * the axis from outside the box for the exact surface (`modelCast` — the parts at rest), taken within `MAP_REFINE_M` of the region's plane. The point keeps
 * the place's two other coordinates EXACTLY: on a side the green's height and the red's plane, by construction.
 */
function rawGizmo(st: SceneState, yaw: number, pitch: number): { readonly hit: GizmoHit; readonly t: MapTarget } | null {
  const map = faceMapOf(st);
  if (map === null) return null;
  const t = mapTarget(map.core, yaw, pitch, mapOpts(st));
  const s = map.stacks[t.stack]!;
  const [i0, i1] = planeAxes(s.axis);
  const at = stackDepthAt(s, t.surface[i0]!, t.surface[i1]!);
  const n = t.normal;
  if (at === null) return { hit: { point: t.surface, normal: n, host: null }, t };
  const p: [number, number, number] = [t.surface[0], t.surface[1], t.surface[2]];
  p[s.axis] = at.depth * s.sign;
  if (at.inside) {
    const face = s.sign > 0 ? map.box.hi[s.axis] : map.box.lo[s.axis];
    const o: [number, number, number] = [p[0], p[1], p[2]];
    o[s.axis] = face + s.sign * MAP_OUT_M;
    const h = modelCast(st, o, [-n[0], -n[1], -n[2]], map.box.hi[s.axis] - map.box.lo[s.axis] + 2 * MAP_OUT_M);
    if (h !== null && Math.abs(h.point[s.axis] * s.sign - at.depth) <= MAP_REFINE_M) {
      p[s.axis] = h.point[s.axis];
      return { hit: { point: p, normal: h.normal ?? n, host: h.host }, t };
    }
  }
  return { hit: { point: p, normal: n, host: null }, t };
}

/**
 * ⭐⭐⭐ (Step 4c-bis) THE GIZMO, THROUGH AN EDGE WITHOUT A JUMP (`edgeBlend`): in an edge band, the face's gizmo (`rawGizmo`) blended toward the next face's
 * first one — up / down a side (`v`) and across a side's end (`h`, of the up / down blends at both yaws) — to their middle at the slice's end. Its normal,
 * host and place: the face's own.
 */
function mapGizmo(st: SceneState, yaw: number, pitch: number): { readonly hit: GizmoHit; readonly t: MapTarget } | null {
  const here = rawGizmo(st, yaw, pitch);
  if (here === null) return null;
  const eb = edgeBlend(yaw, pitch, mapOpts(st));
  if (eb.h === null && eb.v === null) return here;
  const mix = (a: Vec3, b: Vec3, w: number): Vec3 => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
  const upDown = (yw: number, at: Vec3): Vec3 => {
    if (eb.v === null) return at;
    const o = rawGizmo(st, yw, eb.v.pitchThere);
    return o === null ? at : mix(at, o.hit.point, eb.v.w);
  };
  let p = upDown(yaw, here.hit.point);
  if (eb.h !== null) {
    const o = rawGizmo(st, eb.h.yawThere, pitch);
    if (o !== null) p = mix(p, upDown(eb.h.yawThere, o.hit.point), eb.h.w);
  }
  return { hit: { point: p, normal: here.hit.normal, host: here.hit.host }, t: here.t };
}

/**
 * ⭐⭐ THE PIECE'S PLACE from the orbit's centre (the shown gizmo) at an orbit place — `ringPlaceNow`'s in this mode, the solver's queries included: its
 * own gizmo for that direction + the direction × the approach's distance (`approach`: the state's by default).
 */
export function placeOffset(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const u = dirAt(st, yaw, v);
  const d = approachDistance(st.cfg, approach);
  const g = footOf(st, gizmoFor(st), u, d); // ⭐⭐⭐ (2026-11-04, Step 2) from the gizmo's FOOT on the shell
  const c = st.orbitCentreM;
  return [g[0] + u[0] * d - c.x, g[1] + u[1] * d - c.y, g[2] + u[2] * d - c.z];
}

/** ⭐ The DRAWN piece's place from the shown gizmo: along its direction at the approach's distance (the gizmo's ease carries it — never a jump). */
export function shownOffset(st: SceneState, yaw: number, v: number): Vec3 {
  const u = dirAt(st, yaw, v);
  const d = approachDistance(st.cfg, st.approach);
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
 * ⭐⭐ EVERY FRAME (before the piece is placed): the lock, the gizmo (its point eased, its face by the edge rule — the quads follow), the centre the orbit
 * reads set to it, the look point eased; the approach's coast. Under a HOVER the hover owns the gizmo: it is taken as the locked one.
 */
export function assemblyFrame(st: SceneState, dtMs: number): void {
  if (!assemblyOn(st) || st.greenBox === null) return;
  ensureAssembly(st);
  const a = st.asm!;
  // ⭐ the approach's coast — ⭐⭐ (2026-11-01) under the slide mode too: a flick out leaves it
  if (st.approachInertia.coasting) {
    const s = st.approachInertia.step(dtMs, st.cfg.boxSmoothMs * 4);
    approachMove(st, s.dV);
  }
  if (st.hover !== null) {
    const t = st.centreBlend.targetM;
    st.asmLocked = true;
    st.asmShown = null; // ⭐ (Step 4c-bis) back out: the map's angles put where the slide leaves the gizmo
    const n = st.gizmoNormal ?? null;
    const q0 = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
    st.asmLock = { point: [t[0], t[1], t[2]], normal: n, host: st.gizmoHost ?? null, cone: n === null ? null : lockCone(st.asmLock?.cone ?? null, angleTo(orbitDir(q0.yaw, q0.v), n)) };
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    return;
  }
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = orbitDir(q.yaw, q.v);
  const d = approachDistance(st.cfg, st.approach);
  // ⭐⭐⭐ (2026-11-04, STEP 4c-bis) THE GIZMO FROM THE FACE MAP at the orbit's angles (`mapGizmo`) — ⛔ the carrier on the sections' hulls, moved by the
  // angles' steps (2026-10-29 … Step 4c): it could wait, be held, drift and jump. The map's angles ARE the orbit's — out of step only after the slide (put
  // where the slide left the gizmo), then closing on the orbit's with its own steps (`syncAngle`: never against the finger, never a jump)
  const prev = st.asmPrevQ ?? q;
  st.asmPrevQ = { yaw: q.yaw, v: q.v };
  let hit: GizmoHit | null = null;
  if (!st.asmLocked) {
    const pitch = pitchOfV(q.v);
    const m0 = st.asmMapQ ?? { yaw: q.yaw, pitch };
    const mq = {
      yaw: syncAngle(m0.yaw, q.yaw, Math.atan2(Math.sin(q.yaw - prev.yaw), Math.cos(q.yaw - prev.yaw)), MAP_CATCH_UP, true),
      pitch: syncAngle(m0.pitch, pitch, pitch - pitchOfV(prev.v), MAP_CATCH_UP, false),
    };
    st.asmMapQ = mq;
    const m = mapGizmo(st, mq.yaw, mq.pitch);
    if (m !== null) {
      hit = m.hit;
      st.asmG = hit.point;
      st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch };
    }
  }
  calmFrame(st, dtMs);
  const g0 = st.asmLocked && st.asmLock !== null ? st.asmLock.point : (st.asmG ?? st.asmGizmo ?? a.centre);
  // ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 1 (a); the owner: *"deleting the lock at step 1 is cleaner"*) — THE CLOSE-IN LOCK DELETED: the
  // carrier runs at EVERY distance (⛔ the old lock: within 30 cm of the gizmo, or inside the assembly's sphere, the gizmo and its face were held — one
  // behaviour far out, another close in). `st.asmLocked` is now the SLIDE's hold only (set under a hover, above).
  const was = st.asmLocked;
  st.asmLocked = false;
  if (was) {
    // ⭐ off the slide: the map's angles put at the slide's gizmo (`mapAngles`) — before Step 4c-bis the carrier found again, projected into the yaw plane (⛔ 2026-10-28 carried on from the held point — off the
    // yaw plane by the slide: the gizmo off the red section from then on)
    st.asmG = st.asmLock !== null ? st.asmLock.point : st.asmG;
    // ⭐⭐⭐ (Step 4c-bis) the map's angles put where the slide leaves the gizmo (`mapAngles`, its face's stack), then closing on the orbit's (`syncAngle`)
    const map = faceMapOf(st);
    st.asmMapQ = map !== null && st.asmG !== null ? mapAngles(map.core, st.asmG, stackOfNormal(st.gizmoNormal ?? null, st.asmG, map.core), mapOpts(st)) : null;
    st.asmShown = null;
    st.asmLock = null;
    st.lastVerdict = "orbit: off the slide — the gizmo on the sections again";
  }
  // ⭐ unlocked: the face by the edge rule (the quads read it)
  if (!st.asmLocked && hit !== null && hit.normal !== null && faceSwitches(st.gizmoNormal ?? null, st.asmFacePoint, hit.normal, hit.point, edgeMarginM(st))) {
    if ((st.gizmoHost ?? null) !== hit.host) {
      st.gizmoHost = hit.host;
      st.orientDirty = true;
    }
    const n0 = st.gizmoNormal ?? null;
    if (n0 === null || n0[0] * hit.normal[0] + n0[1] * hit.normal[1] + n0[2] * hit.normal[2] < Math.cos(Math.PI / 180)) st.orientDirty = true;
    st.gizmoNormal = hit.normal;
    st.asmFacePoint = hit.point;
  } else if (!st.asmLocked && hit !== null && st.asmFacePoint === null) st.asmFacePoint = hit.point;
  // ⭐ the orbit's centre eased to the gizmo's FOOT (⭐⭐⭐ 2026-11-04, Step 2 — the shell: a step of the gizmo in depth moves neither the piece nor the
  // camera); the ring at the gizmo itself, on the real surface
  const target = g0;
  const foot = footOf(st, target, u, d);
  st.asmGizmo = st.asmGizmo === null ? [foot[0], foot[1], foot[2]] : easePoint(st.asmGizmo, foot, dtMs, st.cfg.gizmoEaseMs); // ⭐⭐ (2026-11-04) a slider (the former GIZMO_TAU_MS, 90 ms)
  st.asmGizmoAt = [target[0], target[1], target[2]]; // ⭐⭐⭐ (2026-11-02) where the ring is drawn: the vertex both lines go through (`gizmoShownAt`)
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // ⭐ the look point: the centre far out, the gizmo close in (a share of the distance — it frames the view, it switches nothing; the slide: the gizmo)
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM, st.asmLocked);
  const g = st.asmGizmo;
  const lt: Vec3 = [a.centre[0] + (g[0] - a.centre[0]) * w, a.centre[1] + (g[1] - a.centre[1]) * w, a.centre[2] + (g[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  sectionLinesFrame(st);
}

/**
 * ⭐⭐ (the optional) THE SECTIONS DRAWN — the paths the gizmo takes. ⭐⭐⭐ (2026-11-04, STEP 4c-bis) FROM THE FACE MAP ITSELF (`mapGizmo`): the GREEN, the
 * gizmo at every yaw at the map's pitch (round the assembly — on a side at its height, over a top / under a bottom round the centre); the RED, at every
 * pitch at the map's yaw (bottom centre → top centre, on a side in the world's vertical plane square to it). So the lines are the gizmo's own paths, and
 * the gizmo's EXACT point is a vertex of both (`insertIndex`) — by construction. Each line's samples computed once per line (a dx reshapes the red only, a
 * dy the green only); a step between two neighbours far beyond the box's own step there (a depth step: a protrusion, a recess) breaks the line. ⭐ ONE
 * mesh of a fixed vertex count, updated in place (a segment not drawn: collapsed). Hidden under the slide, or off.
 */
/** ⭐ (2026-11-02) the gizmo's vertex `i` joined to its neighbours `prev` / `next` (`gizmoJoins`: the nearer one at least). */
function around(pts: readonly (Vector3 | null)[], surf: readonly (Vec3 | null)[], i: number, prev: number, next: number): [boolean, boolean] {
  const g = pts[i];
  if (g === null || g === undefined) return [false, false];
  const a = prev >= 0 ? (pts[prev] ?? null) : null;
  const b = next < pts.length ? (pts[next] ?? null) : null;
  const d = (p: Vector3 | null): number => (p === null ? Infinity : Vector3.Distance(g, p));
  const ja = a !== null && sampleJoins(pts, surf, prev, i);
  const jb = b !== null && sampleJoins(pts, surf, i, next);
  const j = gizmoJoins(ja, jb, d(a), d(b));
  return [j[0] && a !== null, j[1] && b !== null];
}

/** ⭐ (Step 4c-bis) two neighbouring samples joined: their step no more than 2.5 × the box's own step between their places (+ 2 mm) — a depth step breaks it. */
function sampleJoins(pts: readonly (Vector3 | null)[], surf: readonly (Vec3 | null)[], i: number, j: number): boolean {
  const a = pts[i] ?? null;
  const b = pts[j] ?? null;
  const sa = surf[i] ?? null;
  const sb = surf[j] ?? null;
  if (a === null || b === null || sa === null || sb === null) return false;
  const box = Math.hypot(sb[0] - sa[0], sb[1] - sa[1], sb[2] - sa[2]);
  return Vector3.Distance(a, b) <= 2.5 * box + 0.002;
}

/** ⭐ The section lines' samples (the green round the yaw, the red along the pitch — the gizmo's vertex added to each). */
const GREEN_SAMPLES = 96;
const RED_SAMPLES = 64;
/** ⭐ The lines lifted off the surface along its face's axis (m) — never in it. */
const SECTION_LIFT_M = 0.002;

function sectionLinesFrame(st: SceneState): void {
  const sh = st.asmShown;
  const g = st.asmG;
  const show = st.cfg.sectionLines === 1 && !st.asmLocked && st.hover === null && g !== null && sh !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const parts = st.asmParts?.key ?? "";
  const o = mapOpts(st);
  const optKey = `${o.edgeMm}|${o.edgeDeg}`;
  const lift = (q: Vec3, n: Vec3): Vector3 => new Vector3(q[0] + n[0] * SECTION_LIFT_M, q[1] + n[1] * SECTION_LIFT_M, q[2] + n[2] * SECTION_LIFT_M);
  const samples = (at: (x: number) => readonly [number, number], params: readonly number[]) => {
    const pts: (Vector3 | null)[] = [];
    const surf: (Vec3 | null)[] = [];
    for (const x of params) {
      const [yw, pt] = at(x);
      const m = mapGizmo(st, yw, pt);
      pts.push(m === null ? null : lift(m.hit.point, m.t.normal));
      surf.push(m === null ? null : m.t.surface);
    }
    return { pts, surf };
  };
  // the red's samples (per the map's yaw): the pitch from −90° to +90°
  const rKey = `${parts}#R#${sh.yaw.toFixed(7)}#${optKey}`;
  if (st.asmRedCache === null || st.asmRedCache.key !== rKey) {
    const params = sectionFixed(Math.PI, RED_SAMPLES - 1, false);
    st.asmRedCache = { key: rKey, params, ...samples((x) => [sh.yaw, x - Math.PI / 2], params) };
  }
  // the green's samples (per the map's pitch): the yaw round the circle
  const gKey = `${parts}#G#${sh.pitch.toFixed(7)}#${optKey}`;
  if (st.asmGreenCache === null || st.asmGreenCache.key !== gKey) {
    const params = sectionFixed(2 * Math.PI, GREEN_SAMPLES, true);
    st.asmGreenCache = { key: gKey, params, ...samples((x) => [x, sh.pitch], params) };
  }
  // ⭐⭐⭐ the gizmo's EXACT point inserted in both: the ring is a vertex of each line, at every frame
  const gv = lift(g, sh.t.normal);
  const key = `${rKey}|${gKey}|${gv.x.toFixed(6)},${gv.y.toFixed(6)},${gv.z.toFixed(6)}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const rest = gv;
  const lines: Vector3[][] = [];
  // green: a closed loop through the gizmo (its parameter the map's yaw)
  const gc = st.asmGreenCache;
  const gParam = ((sh.yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const green = [...gc.pts];
  const gSurf = [...gc.surf];
  const gi = insertIndex(gc.params, gParam);
  green.splice(gi, 0, gv);
  gSurf.splice(gi, 0, sh.t.surface);
  const n = green.length;
  const gJoin = around(green, gSurf, gi, (gi - 1 + n) % n, (gi + 1) % n);
  for (let k = 0; k <= GREEN_SAMPLES; k++) {
    const p0 = green[k] ?? null;
    const p1 = green[(k + 1) % n] ?? null;
    const forced = (k + 1) % n === gi ? gJoin[0] : k === gi ? gJoin[1] : null;
    lines.push(p0 !== null && p1 !== null && (forced ?? sampleJoins(green, gSurf, k, (k + 1) % n)) ? [p0, p1] : [rest, rest]);
  }
  // red: bottom centre → top centre through the gizmo (its parameter the map's pitch + 90°)
  const rc = st.asmRedCache;
  const red = [...rc.pts];
  const rSurf = [...rc.surf];
  const ri = insertIndex(rc.params, sh.pitch + Math.PI / 2);
  red.splice(ri, 0, gv);
  rSurf.splice(ri, 0, sh.t.surface);
  const rJoin = around(red, rSurf, ri, ri - 1, ri + 1);
  for (let k = 0; k < RED_SAMPLES - 1; k++) {
    const p0 = red[k] ?? null;
    const p1 = red[k + 1] ?? null;
    const forced = k + 1 === ri ? rJoin[0] : k === ri ? rJoin[1] : null;
    lines.push(p0 !== null && p1 !== null && (forced ?? sampleJoins(red, rSurf, k, k + 1)) ? [p0, p1] : [rest, rest]);
  }
  if (st.asmSectionLines === null) {
    const colours = lines.map((_, i) => (i <= GREEN_SAMPLES ? [new Color4(0.35, 0.8, 0.35, 1), new Color4(0.35, 0.8, 0.35, 1)] : [new Color4(0.9, 0.25, 0.2, 1), new Color4(0.9, 0.25, 0.2, 1)]));
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
  const taken = approachMoveTaken(st, da);
  // ⭐⭐⭐ (2026-11-01) a step IN arms the slide mode again (`slideArmedAfter`) — a step out never: its coast cannot latch it at the reach
  st.slideArmed = slideArmedAfter(st.slideArmed, taken, 0);
  return taken;
}

function approachMoveTaken(st: SceneState, da: number): number {
  if (da === 0) return 0;
  const a0 = st.approach;
  const want = approachStep(a0, da, 1, st.cfg);
  if (want === a0) return 0;
  const out = want > a0;
  // ⭐⭐⭐ (2026-11-01, *"build A"*) a step OUT of a slide: the orbit goes on from the slide's view (`slideWayOutRebase`)
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
  // ⭐⭐⭐ (2026-11-01, *"the collision detection shall apply also when moving the piece away from a face"*) — out checked too (`approachStepFree`); blocked, the
  // player finds the way out (a slide, the orbit)
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

/** ⭐ An approach input: `dyMm` of finger (UP brings the piece IN), at the orbit dy's pace on the curve's coordinate; recorded for the coast. */
export function approachInput(st: SceneState, dyMm: number): void {
  const taken = approachMove(st, dyMm * orbitDvPerMm(st));
  st.approachInertia.record(performance.now(), 0, taken);
  // ⭐ (2026-11-01) the slide mode left: the piece's own offset (the slide's settle) ways in by the approach's travel
  if (st.hover === null) hoverWayInStep(st, Math.abs(dyMm));
  st.hudDirty = true;
}

/** ⭐ The approach's input ends: its coast starts. */
export function approachRelease(st: SceneState): void {
  st.approachInertia.release(performance.now());
}

/** ⭐ THE CAMERA'S FRAME: behind the piece along its direction (locked, the cone's), the owner's world offsets as ever, its up upright. */
export function assemblyCameraFrame(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  const u = dirAt(st, cam.yaw, cam.v);
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  // ⭐⭐ (2026-10-28) the offsets in the camera's own frame, never faded — the same whichever face hosts the gizmo (`offsetFrame`)
  // ⭐ (2026-10-29) its heading the ORBIT's yaw, always (⛔ the direction's own — locked and turned into the cone at −90° it switched from the yaw to the
  // face's heading at once: the scene jump-rotated; and at ±90° it has none)
  // ⭐⭐⭐ (2026-11-04, `1.0.95-`) under the CALM the heading turned as the direction was (`calmHeading`) — ⛔ the orbit's yaw with the calm's direction:
  // the up built from another heading than the direction's own, the camera ROLLED on a wall (probed: 222 frames over 5° on one close-in dx leg)
  return offsetFrame(u, st.asmLocked ? cam.yaw : calmHeading(cam.yaw, orbitDir(cam.yaw, cam.v), u), o.yawRad, o.pitchRad);
}

/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const a1 = angleTo(orbitDir(yaw1, v1), n);
  return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(orbitDir(yaw0, v0), n);
}
