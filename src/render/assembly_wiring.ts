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
import { blendThroughEdges, buildFaceMap, facetOfNormal, mapAngles, mapTarget, stackDepthAt, syncAngle, type FaceMap, type MapFace, type MapOpts, type MapTarget } from "../input/face_map";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { faceLift, pieceReach, placeAtAngles, shellAnchor, shellBox, type ShellBox } from "../input/orbit_shell";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import { faceTrianglesWorld, hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { slideArmedAfter } from "../input/hover";
import { alignedShare, calmHeading, poleWeight, easeNormal, easeToward, edgeShare, sharesShowing, shownDir } from "../input/orbit_calm";
import { qFromAxisAngle, qRotate, type Vec3 } from "../core/vec";
import { FRAME_BACK_MARGIN_RAD, frameClamp, frameStep, rebaseAngles, rollOwed, rollStep, toFrame, toWorld, type OrbitFrame } from "../input/orbit_frame";
import { cameraOrbitAt } from "../input/follow_camera";
import { faceWorld, worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { boxOf, rayMeetsBox, type Box3 } from "../input/ray_box";

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
  // ⭐⭐⭐ (2026-11-05, STEP 6) the orbit's angles read in ITS FRAME (`st.orbitFrame`: upright, or turned onto a top / a bottom)
  const u = toWorld(st.orbitFrame, orbitDir(yaw, v));
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
function calmDir(st: SceneState, uw: Vec3): Vec3 {
  const k = st.asmCalm;
  if (k === null) return uw;
  // ⭐⭐⭐ (Step 6) in the orbit's frame: its up, its level normal (`k.n` is the frame's)
  const F = st.orbitFrame;
  const u = toFrame(F, uw);
  const w = poleWeight(u[1]);
  if (!(w > 0)) return uw;
  return toWorld(F, shownDir(u, k.n, [-k.n[2], 0, k.n[0]], [0, 1, 0], 1 - (1 - k.sH) * w, 1 - (1 - k.sV) * w));
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
    // ⭐⭐⭐ (Step 4c-bis) the SIDE's axis, never a hit's normal (a groove's wall, a slanted block) — ⭐⭐⭐ (Step 5) the FACET's normal, read level (the
    // calm's frame turns about the world's up: a facet sloping up a column, its heading)
    const h = Math.hypot(t.normal[0], t.normal[2]);
    n = h > 1e-9 ? [t.normal[0] / h, 0, t.normal[2] / h] : t.normal;
    const L = t.across;
    sH = edgeShare(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm / 100);
    // ⭐⭐⭐ dy's run: the gizmo's place UP ITS FACET (`b`) within the facet's span — the same span on every side of a contour of one height, so a pure dx
    // never changes it (⛔ the wall under the gizmo: its top differed from the front to the side at the same height — the owner's bounce, probed)
    // ⭐⭐⭐ (2026-11-05, Step 6) ⛔ the placed parts' BOX: `Scene_1`'s parts rise 41 mm above the top face, so at the front's top EDGE — where the frame turns —
    // the calm still held the piece 8° under the orbit (share 0.82); the turn restarted it whole: the piece jumped 2.8 m far out (probed). The facet's span
    // is whole at its edges: the calm whole at every crossing, on both sides of it
    const fv = cfg.faceSpanShareVOn === 1 ? (faceMapOf(st)?.facets[t.stack] ?? null) : null;
    const b = fv === null ? 0 : t.surface[0] * fv.b[0] + t.surface[1] * fv.b[1] + t.surface[2] * fv.b[2];
    sV = fv === null ? 1 : edgeShare(Math.min(b - fv.bLo, fv.bHi - b), fv.bHi - fv.bLo, cfg.faceSpanShareV, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100);
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
 * `faceTrianglesWorld`), per placed set; `null` with no box. ⭐⭐⭐ (Step 5) on the FACES CONTOUR — its two knobs (D5) sliders, in the cache's key.
 */
function faceMapOf(st: SceneState): FaceMap | null {
  const parts = placedParts(st);
  const box = shellOf(st);
  if (box === null) return null;
  const F = st.orbitFrame;
  const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}#${F.key}`;
  if (st.asmFaceMap !== null && st.asmFaceMap.key === key) return st.asmFaceMap.map;
  const memo = FACE_MAPS.get(st)?.get(key);
  if (memo !== undefined) {
    st.asmFaceMap = { key, map: memo };
    return memo;
  }
  const faces: MapFace[] = [];
  for (const [id, obj] of st.world.objects) {
    if (obj.orbited === true || obj.frozen === true || !goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1)) continue;
    const mesh = st.meshOf.get(id);
    if (mesh === undefined || !mesh.isEnabled()) continue;
    for (const f of obj.faces) {
      const w = faceWorld(st.world, id, f.id);
      const tris = faceTrianglesWorld(st, id, f.id);
      if (w === null || tris === null || tris.length === 0) continue;
      // ⭐⭐⭐ (Step 6) the faces read in the orbit's frame
      faces.push(F.cap === null ? { normal: w.normal, centre: w.centre, tris } : { normal: toFrame(F, w.normal), centre: toFrame(F, w.centre), tris: tris.map((tr) => [toFrame(F, tr[0]), toFrame(F, tr[1]), toFrame(F, tr[2])] as const) });
    }
  }
  // ⭐⭐⭐ (Step 6) the parts' box in the frame (upright: the shell's)
  const boxF = F.cap === null ? box : (shellBox(parts.parts.map((vs) => vs.map((v) => toFrame(F, v)))) ?? box);
  const map = buildFaceMap(faces, boxF, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare });
  st.asmFaceMap = { key, map };
  // ⭐ (Step 6) a few maps kept (upright and the frames turned onto): a turn and back rebuilds none
  let m = FACE_MAPS.get(st);
  if (m === undefined || m.size > 8) {
    m = new Map();
    FACE_MAPS.set(st, m);
  }
  m.set(key, map);
  return map;
}
const FACE_MAPS = new WeakMap<SceneState, Map<string, FaceMap>>();

/**
 * ⭐⭐⭐ (2026-11-04, STEP 4c-bis) THE GIZMO FOR THE ORBIT'S ANGLES — no carrier, no state: the angles' place (`mapTarget`), the FRONTMOST closed region
 * there (`stackDepthAt`; none: the nearest group's plane, beside the real face); inside a region, the ray along the normal from outside the box
 * (`modelCast` — the parts at rest) for the real surface. The point keeps the place's two other coordinates EXACTLY: the green's and the red's planes, by
 * construction. ⭐⭐⭐ (Step 5) on the FACES CONTOUR — the facet's stack, its normal, its frame (`t`, `b`); ⭐⭐⭐ (D3) the ray's hit taken WHATEVER its depth:
 * over an empty slot (a hole the region closes) the gizmo at its BOTTOM — the region still chooses the face and keeps the gizmo continuous across the rim,
 * only the depth is the real one; a slot through the whole assembly (no hit): the region's plane. The piece and the camera ride the shell (Step 2).
 * ⭐⭐⭐ (2026-11-05, the owner) D3 AMENDED — a void CLOSED on the green's or the red's travel (`stackDepthAt`'s `bridged`): the gizmo straight through on
 * the facet's plane, the lines with it; a void open on both keeps its depth until the frame turn (Steps 6–7).
 */
function rawGizmo(st: SceneState, yaw: number, pitch: number): { readonly hit: GizmoHit; readonly t: MapTarget } | null {
  // ⭐⭐⭐ (Step 6) everything here in the ORBIT FRAME's coordinates — the map's; a cast goes out to the world and back (`frameCast`)
  const map = faceMapOf(st);
  if (map === null) return null;
  const t = mapTarget(map, yaw, pitch, mapOpts(st));
  const f = map.facets[t.stack]!;
  const n = t.normal;
  const sf = t.surface;
  const at = stackDepthAt(f, sf[0] * f.t[0] + sf[1] * f.t[1] + sf[2] * f.t[2], sf[0] * f.b[0] + sf[1] * f.b[1] + sf[2] * f.b[2]);
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
    const o: Vec3 = [p[0] + n[0] * (out - level(p)), p[1] + n[1] * (out - level(p)), p[2] + n[2] * (out - level(p))];
    const h = frameCast(st, o, [-n[0], -n[1], -n[2]], out - sup(-1) + MAP_OUT_M);
    if (h !== null && (at.bridged !== true || level(h.point) > at.depth + MAP_BRIDGE_FRONT_M)) return { hit: { point: onto(level(h.point)), normal: h.normal ?? n, host: h.host }, t };
  }
  return { hit: { point: p, normal: n, host: null }, t };
}

/** ⭐⭐⭐ (Step 6) A cast in the orbit frame's coordinates: out to the world (`modelCast`), its hit back in the frame. */
function frameCast(st: SceneState, origin: Vec3, dir: Vec3, length: number): GizmoHit | null {
  const F = st.orbitFrame;
  if (F.cap === null) return modelCast(st, origin, dir, length);
  const h = modelCast(st, toWorld(F, origin), toWorld(F, dir), length);
  return h === null ? null : { point: toFrame(F, h.point), normal: h.normal === null ? null : toFrame(F, h.normal), host: h.host };
}

/**
 * ⭐⭐⭐ (Step 6) THE GIZMO AT THE ORBIT FRAME'S ANGLES, in the WORLD: `mapGizmoF`'s point, normal and place turned out of the frame (the probes, the lines and the
 * solver's places read it); the frame's own result for the calm (`st.asmShown`).
 */
export function mapGizmo(st: SceneState, yaw: number, pitch: number): { readonly hit: GizmoHit; readonly t: MapTarget } | null {
  const m = mapGizmoF(st, yaw, pitch);
  const F = st.orbitFrame;
  if (m === null || F.cap === null) return m;
  return { hit: worldHit(F, m.hit), t: { ...m.t, normal: toWorld(F, m.t.normal), surface: toWorld(F, m.t.surface) } };
}
const worldHit = (F: OrbitFrame, h: GizmoHit): GizmoHit => (F.cap === null ? h : { point: toWorld(F, h.point), normal: h.normal === null ? null : toWorld(F, h.normal), host: h.host });

/**
 * ⭐⭐⭐ (Step 4c-bis) THE GIZMO, THROUGH AN EDGE WITHOUT A JUMP: in an edge band, the facet's gizmo (`rawGizmo`) blended toward the next facet's first one —
 * ⭐ (Step 5) the rule in `input/face_map.ts` (`blendThroughEdges`, `edgeBlend`), vectored on a non-box contour. Its normal, host and place: the facet's own.
 */
function mapGizmoF(st: SceneState, yaw: number, pitch: number): { readonly hit: GizmoHit; readonly t: MapTarget } | null {
  const here = rawGizmo(st, yaw, pitch);
  const map = faceMapOf(st);
  if (here === null || map === null) return null;
  const p = blendThroughEdges(map, yaw, pitch, mapOpts(st), here.hit.point, (y, q) => rawGizmo(st, y, q)?.hit.point ?? null, (q, nb, reach) => blendCast(st, q, nb, reach));
  return p === here.hit.point ? here : { hit: { point: p, normal: here.hit.normal, host: here.hit.host }, t: here.t };
}

/**
 * ⭐⭐⭐ (2026-11-05) A BLENDED PLACE'S DEPTH (`blendThroughEdges`' `cast`): the ray along the blended normal `nb` from `reach` in front of the place `q`
 * onto it (`modelCast` — the parts at rest); its hit, or none. Only a surface in front of `q` is met (the ray stops at it).
 */
function blendCast(st: SceneState, q: Vec3, nb: Vec3, reach: number): Vec3 | null {
  const h = frameCast(st, [q[0] + nb[0] * reach, q[1] + nb[1] * reach, q[2] + nb[2] * reach], [-nb[0], -nb[1], -nb[2]], reach);
  return h === null ? null : h.point;
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
 * `st.asmPrevQ`, `syncAngle`); at the frame's own angles exactly the frame's gizmo (`st.asmG`). Under the slide: its held gizmo. Memoised for the frame
 * (the solver asks the same angles several times).
 */
function gizmoAtAngles(st: SceneState, yaw: number, v: number): Vec3 {
  if (st.asmLocked && st.asmLock !== null) return st.asmLock.point;
  const q0 = st.asmPrevQ;
  const mq = st.asmMapQ;
  if (q0 === null || mq === null) return gizmoFor(st);
  if (yaw === q0.yaw && v === q0.v && st.asmG !== null) return st.asmG;
  let memo = GIZMO_MEMO.get(st);
  if (memo === undefined || memo.frame !== st.frames) {
    memo = { frame: st.frames, at: new Map() };
    GIZMO_MEMO.set(st, memo);
  }
  const key = `${yaw}|${v}`;
  const known = memo.at.get(key);
  if (known !== undefined) return known;
  const m = mapGizmo(st, yaw + Math.atan2(Math.sin(mq.yaw - q0.yaw), Math.cos(mq.yaw - q0.yaw)), pitchOfV(v) + (mq.pitch - pitchOfV(q0.v)));
  const g = m === null ? gizmoFor(st) : m.hit.point;
  if (memo.at.size < 512) memo.at.set(key, g);
  return g;
}
const GIZMO_MEMO = new WeakMap<SceneState, { frame: number; at: Map<string, Vec3> }>();

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
    st.asmLock = { point: [t[0], t[1], t[2]], normal: n, host: st.gizmoHost ?? null, cone: n === null ? null : lockCone(st.asmLock?.cone ?? null, angleTo(toWorld(st.orbitFrame, orbitDir(q0.yaw, q0.v)), n)) };
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    return;
  }
  // ⭐⭐⭐ (2026-11-05, STEP 6) THE FRAME: its turn at a crossing, the roll owed taken over the input's travel, Step 6's clamps (`input/orbit_frame.ts`)
  orbitFrameStep(st);
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = toWorld(st.orbitFrame, orbitDir(q.yaw, q.v));
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
    const m = mapGizmoF(st, mq.yaw, mq.pitch);
    if (m !== null) {
      hit = worldHit(st.orbitFrame, m.hit); // ⭐ (Step 6) the world's point; the frame's place kept for the calm
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
    const gF = st.asmG === null ? null : toFrame(st.orbitFrame, st.asmG);
    const nF = st.gizmoNormal == null ? null : toFrame(st.orbitFrame, st.gizmoNormal);
    st.asmMapQ = map !== null && gF !== null ? mapAngles(map, gF, facetOfNormal(map, nF, gF), mapOpts(st)) : null;
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
  const foot = footOf(st, target, u, d + liftOf(st, u));
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
  const parts = `${st.asmParts?.key ?? ""}#${st.orbitFrame.key}`; // ⭐ (Step 6) a line per frame
  const o = mapOpts(st);
  const tN = toWorld(st.orbitFrame, sh.t.normal); // ⭐ (Step 6) the shown place's normal and point in the world (the frame's in `asmShown`)
  const tS = toWorld(st.orbitFrame, sh.t.surface);
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
  const gv = lift(g, tN);
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
  gSurf.splice(gi, 0, tS);
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
  rSurf.splice(ri, 0, tS);
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
  // ⭐⭐⭐ (2026-11-05, STEP 6) built in the ORBIT'S FRAME (its up the frame's), turned out to the world; the roll still owed at a turn off square applied
  // about the view (`st.orbitRoll` — the old frame's up shown, taken off over the input's travel)
  const F = st.orbitFrame;
  const fr = assemblyCameraFrameIn(st, F, cam, off);
  const r = st.orbitRoll;
  if (r === null || r.left === 0) return fr;
  return { dir: fr.dir, up: qRotate(qFromAxisAngle(fr.dir, -r.left), fr.up) };
}

function assemblyCameraFrameIn(st: SceneState, F: OrbitFrame, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  const u = toFrame(F, dirAt(st, cam.yaw, cam.v));
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  // ⭐⭐ (2026-10-28) the offsets in the camera's own frame, never faded — the same whichever face hosts the gizmo (`offsetFrame`)
  // ⭐ (2026-10-29) its heading the ORBIT's yaw, always (⛔ the direction's own — locked and turned into the cone at −90° it switched from the yaw to the
  // face's heading at once: the scene jump-rotated; and at ±90° it has none)
  // ⭐⭐⭐ (2026-11-04, `1.0.95-`) under the CALM the heading turned as the direction was (`calmHeading`) — ⛔ the orbit's yaw with the calm's direction:
  // the up built from another heading than the direction's own, the camera ROLLED on a wall (probed: 222 frames over 5° on one close-in dx leg)
  const c = offsetFrame(u, st.asmLocked ? cam.yaw : calmHeading(cam.yaw, orbitDir(cam.yaw, cam.v), u), o.yawRad, o.pitchRad);
  return F.cap === null ? c : { dir: toWorld(F, c.dir), up: toWorld(F, c.up) };
}

/**
 * ⭐⭐⭐ (2026-11-05, STEP 6 — `TILTED_ORBIT_REBUILD_SCOPE.md` §19) THE ORBIT'S FRAME, EACH FRAME (before the solve reads the target):
 * * a ROLL OWED under way: the orbit's target held (the piece waits, a dx held too), the input's pitch travel taking the roll off (`rollStep` — linear,
 *   reversible; back past its start, the frame turns back);
 * * else the frame's step for the SOLVED place (`frameStep`): past a column's top / bottom bound the frame turned onto the cap; back past the cap's band,
 *   upright (`orbitFrameTurn` — nothing moves);
 * * Step 6's CLAMPS on the target in a turned frame (`frameClamp`): the far edge, the side edges.
 */
function orbitFrameStep(st: SceneState): void {
  const r = st.orbitRoll;
  if (r !== null) {
    // ⭐ the travel AWAY from the edge just crossed (⛔ read as the frame's own sense: a turn back down off a top took the travel up — the roll undone
    // at once, the camera rolled 53° in a frame, probed)
    const travel = (pitchOfV(st.orbit.elevation) - pitchOfV(r.held.v)) * r.dir;
    const s = rollStep(r.owed, r.left, travel);
    if (s.back) {
      st.orbitRoll = null;
      orbitFrameTurn(st, r.back); // ⭐ back past the roll's start: the frame it came from (⛔ always upright)
      return;
    }
    r.left = s.left;
    if (r.left === 0) st.orbitRoll = null;
    st.orbit.reset(r.held.yaw, r.held.v);
    st.hudDirty = true;
    return;
  }
  const map = faceMapOf(st);
  const q = st.pieceQ;
  if (map !== null && q !== null) {
    const next = frameStep(st.orbitFrame, map, q.yaw, pitchOfV(q.v), FRAME_BACK_MARGIN_RAD);
    if (next !== null) orbitFrameTurn(st, next);
  }
  const F = st.orbitFrame;
  const map2 = F.cap === null ? null : faceMapOf(st);
  if (map2 !== null) {
    const c = frameClamp(F, map2, st.orbit.yaw, pitchOfV(st.orbit.elevation));
    if (c.held) {
      st.orbit.reset(c.yaw, vOfPitch(c.pitch));
      st.orbitInertia.stop();
    }
  }
}

/**
 * ⭐⭐⭐ (STEP 6) THE TURN — NOTHING MOVES: every angle of the orbit re-read in the new frame as the same direction (`rebaseAngles` — the target, the solved
 * place, the eye's spring, the camera's leash and lag, the solver's last raw input and height kept, the gizmo's sync); the face map's angles put where the
 * gizmo is (`mapAngles` — as after the slide; `syncAngle` closes on the orbit's); the calm restarted whole (at an edge it is whole). The camera's upright up
 * in the two frames compared (`rollOwed`): off square, the difference is owed and taken over the input's travel (`st.orbitRoll`).
 */
function orbitFrameTurn(st: SceneState, to: OrbitFrame): void {
  const from = st.orbitFrame;
  const camBefore = st.cameraLagged ?? st.boxOrbit;
  const before = camBefore === null ? null : assemblyCameraFrame(st, camBefore);
  const rb = <T extends { readonly yaw: number; readonly v: number }>(a: T): T => {
    const r = rebaseAngles(from, to, a.yaw, pitchOfV(a.v));
    return { ...a, yaw: r.yaw, v: vOfPitch(r.pitch) };
  };
  // the piece's SHOWN direction now (the calm in the old frame) — kept through the turn
  const shownAt = st.boxOrbit;
  const uOld = shownAt === null ? null : toWorld(from, orbitDir(shownAt.yaw, shownAt.v));
  const shownOld = uOld === null ? null : calmDir(st, uOld);
  const target = rb({ yaw: st.orbit.yaw, v: st.orbit.elevation });
  st.orbit.reset(target.yaw, target.v);
  if (st.pieceQ !== null) {
    if (st.orbitUserV !== null) st.orbitUserV = rb({ yaw: st.pieceQ.yaw, v: st.orbitUserV }).v;
    st.pieceQ = rb(st.pieceQ);
  }
  const sp = st.boxSpring;
  if (sp !== null) st.boxSpring = { at: rb(sp.at), velYaw: 0, velV: 0, velLnZoom: sp.velLnZoom };
  if (st.boxOrbit !== null) st.boxOrbit = st.boxSpring?.at ?? rb(st.boxOrbit);
  if (st.cameraOrbit !== null) st.cameraOrbit = cameraOrbitAt(rb(st.cameraOrbit.cam), performance.now(), st.cfg);
  if (st.cameraLagged !== null) st.cameraLagged = rb(st.cameraLagged);
  if (st.orbitRawPrev !== null) st.orbitRawPrev = rb(st.orbitRawPrev);
  if (st.asmPrevQ !== null) st.asmPrevQ = rb(st.asmPrevQ);
  // the gizmo where it is: the facet it is on (the shown place's, out of the old frame) read in the new frame's map
  const nW = st.asmShown === null ? (st.gizmoNormal ?? null) : toWorld(from, st.asmShown.t.normal);
  st.orbitFrame = to;
  // ⭐ the calm carried through (whole at the crossing's edge — `calmFrame`): its normal the facet now faced, read level in the new frame (⛔ restarted
  // whole: a calm still at work jumped off)
  const k = st.asmCalm;
  const nn = to.cap !== null ? (to.capN === null ? null : toFrame(to, to.capN)) : from.fromN;
  const nh = nn === null ? 0 : Math.hypot(nn[0], nn[2]);
  if (k !== null && nn !== null && nh > 1e-9) {
    k.n = [nn[0] / nh, 0, nn[2] / nh];
    // ⭐ the shares that show the same direction about the new normal (`sharesShowing`) — they ease to their targets from there (⛔ kept: off square the
    // angles read in the new axes differ — the piece stepped 35 mm)
    if (uOld !== null && shownOld !== null) {
      const u = toFrame(to, uOld);
      const sh = sharesShowing(u, toFrame(to, shownOld), k.n, [-k.n[2], 0, k.n[0]], [0, 1, 0], poleWeight(u[1]));
      k.sH = sh.sH;
      k.sV = sh.sV;
    }
  }
  st.asmShown = null;
  const map = faceMapOf(st);
  if (map !== null && st.asmG !== null) {
    const gF = toFrame(to, st.asmG);
    st.asmMapQ = gizmoAnglesAt(st, gF, mapAngles(map, gF, facetOfNormal(map, nW === null ? null : toFrame(to, nW), gF), mapOpts(st)));
  }
  // the roll owed: the camera's up in the old frame (any roll still shown) against the new frame's upright one
  st.orbitRoll = null;
  const camAfter = st.cameraLagged ?? st.boxOrbit;
  if (before !== null && camAfter !== null) {
    const after = assemblyCameraFrameIn(st, to, camAfter);
    const owed = rollOwed(after.dir, before.up, after.up);
    // the sense away from the edge: onto a cap, toward its far edge; back upright, on down (up) the side left from the top (bottom)
    const dir: 1 | -1 = to.cap !== null ? (to.backLow ? 1 : -1) : from.backLow ? -1 : 1;
    if (Math.abs(owed) > ROLL_MIN_RAD) st.orbitRoll = { owed, left: owed, held: { yaw: target.yaw, v: target.v }, dir, back: from };
  }
  st.lastVerdict = to.cap === null ? "orbit: back upright — the frame turned back" : `orbit: the frame turned onto the ${to.cap === "TOP" ? "top" : "bottom"}${st.orbitRoll !== null ? ` — the camera rolls ${((Math.abs(st.orbitRoll.owed) * 180) / Math.PI).toFixed(0)}° with the input, the piece waits` : ""}`;
  st.hudDirty = true;
}
/**
 * ⭐⭐⭐ (STEP 6) THE FRAME'S EDGES BOUND THE SOLVED PLACE (`frameClamp`): a solve that went past a clamp (a slide along a part carries the yaw — the
 * coordinate the input pushes least) is held at it — there if the piece is free there (one gap query), else where the frame started. Inside: unchanged.
 */
export function frameClampSolved<Q extends { readonly yaw: number; readonly v: number }>(st: SceneState, q0: Q, q: Q, env: { gap(q: Q): number }, gapM: number): Q {
  const F = st.orbitFrame;
  const map = F.cap === null ? null : faceMapOf(st);
  if (map === null) return q;
  const c = frameClamp(F, map, q.yaw, pitchOfV(q.v));
  if (!c.held) return q;
  const at: Q = { ...q, yaw: c.yaw, v: vOfPitch(c.pitch) };
  const held = env.gap(at) >= gapM / 2 ? at : q0;
  // ⭐ the place held IS the solver's state: its target and its height kept there (⛔ the target alone: the way back to the height kept slid along a part
  // and carried the yaw back off the edge, the input out again — the camera back and forth every frame, probed)
  st.orbit.reset(held.yaw, held.v);
  st.orbitUserV = held.v;
  return held;
}

/**
 * ⭐⭐⭐ (STEP 6) THE MAP'S ANGLES WHOSE GIZMO IS `gF` (the frame's coordinates) — from `a0` (`mapAngles`: exact on a facet's own surface), refined by
 * Gauss–Newton on the two angles (`mapGizmoF`, finite differences): an edge's gizmo is a BLEND of two facets' points, never on either plane, so the
 * projection alone left it 24 mm off at an off-square turn (probed). Stops within 0.05 mm, eight steps at most, each step backtracked.
 */
function gizmoAnglesAt(st: SceneState, gF: Vec3, a0: { readonly yaw: number; readonly pitch: number }): { readonly yaw: number; readonly pitch: number } {
  let a = a0;
  const res = (y: number, p: number): Vec3 | null => {
    const m = mapGizmoF(st, y, p);
    return m === null ? null : [m.hit.point[0] - gF[0], m.hit.point[1] - gF[1], m.hit.point[2] - gF[2]];
  };
  const H = 1e-4;
  for (let k = 0; k < 8; k++) {
    const r = res(a.yaw, a.pitch);
    if (r === null || Math.hypot(r[0], r[1], r[2]) < 5e-5) break;
    const ry = res(a.yaw + H, a.pitch);
    const rp = res(a.yaw, a.pitch + H);
    if (ry === null || rp === null) break;
    const j0: Vec3 = [(ry[0] - r[0]) / H, (ry[1] - r[1]) / H, (ry[2] - r[2]) / H];
    const j1: Vec3 = [(rp[0] - r[0]) / H, (rp[1] - r[1]) / H, (rp[2] - r[2]) / H];
    const d = (u: Vec3, w: Vec3): number => u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
    const a11 = d(j0, j0);
    const a12 = d(j0, j1);
    const a22 = d(j1, j1);
    const det = a11 * a22 - a12 * a12;
    if (!(det > 1e-18)) break;
    const b0 = -d(j0, r);
    const b1 = -d(j1, r);
    // ⭐ backtracking (halved up to 8 times): a full step from inside an edge's blend band overshoots — ⛔ stopped at the first improving step, the gizmo
    // stayed 24 mm off (probed)
    const dy = (a22 * b0 - a12 * b1) / det;
    const dp = (a11 * b1 - a12 * b0) / det;
    const r0 = Math.hypot(r[0], r[1], r[2]);
    let step = 1;
    let moved = false;
    for (let h = 0; h < 9; h++, step /= 2) {
      const next = { yaw: a.yaw + dy * step, pitch: a.pitch + dp * step };
      const rn = res(next.yaw, next.pitch);
      if (rn !== null && Math.hypot(rn[0], rn[1], rn[2]) < r0) {
        a = next;
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
  return a;
}

/** ⭐ (Step 6) a roll owed below this (rad) is not taken — square enough. */
const ROLL_MIN_RAD = (0.5 * Math.PI) / 180;

/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const F = st.orbitFrame;
  const a1 = angleTo(toWorld(F, orbitDir(yaw1, v1)), n);
  return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(toWorld(F, orbitDir(yaw0, v0)), n);
}
