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
import { angleTo, lockCone, approachDistance, approachStep, coneClamp, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, offsetFrame, offsetFrameUp, uprightUp, modelNormal, orbitDir, pitchOfV, swayRay, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { gizmoJoins, insertIndex, joinsKnown, joinStep, LINE_REFINE_BUDGET, refineNow, refineStart, refineStep, sectionFixed, type RefineState } from "../input/section_hull";
import { blendThroughEdges, buildFaceMap, castPoint, mapAnglesStep, facetOfNormal, mapAngles, mapTarget, stackDepthAt, type FaceMap, type MapFace, type MapOpts, type MapTarget } from "../input/face_map";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { faceLift, pieceReach, placeAtAngles, shellAnchor, shellBox, type ShellBox } from "../input/orbit_shell";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import type { LineSample, SceneState } from "./scene_state";
import { faceTrianglesWorld, hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { slideArmedAfter } from "../input/hover";
import { calmHeading, calmShown, calmStep, calmTarget } from "../input/orbit_calm";
import type { Vec3 } from "../core/vec";
import { faceWorld, worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { boxOf, rayMeetsBox, type Box3 } from "../input/ray_box";
import { anglesOfDir, capTilt, capYawRelease, carryUp, frameMix, gizmoGlide, mouthHold, tiltCalmWholeHV, wholeShareStep, mulM, mulT, poleEdgeWhole, rollDurationMs, rollStep, tiltUnderWay, snapHeading, swingDir, swingEase, tiltAutoLatch, tiltBox, tiltDir, tiltExits, tiltFaces, untiltDir, type Mat3 } from "../input/orbit_tilt";

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
  // ⭐⭐⭐ (2026-11-10, §9.4) the orbit's angles in its FRAME (the tilted pole's F, `dirFrame`), turned into the world here — the calm in F
  const R = dirFrame(st);
  const u = orbitDir(yaw, v);
  const n = st.asmLocked && st.asmLock !== null ? st.asmLock.normal : null;
  // ⭐⭐⭐ (2026-11-04, `1.0.95-`, the owner: *"i am referring to this calm behavior of commit 58d86ff… It shall stay"*) the piece and the camera on the SHOWN
  // direction — the orbit's angle calm in the middle of a face, whole at its edges (`calmDir`); the gizmo is still moved by the orbit's own `u`
  return n === null ? tiltDir(R, calmDir(st, u)) : coneClamp(tiltDir(R, u), n, st.asmLock!.cone ?? undefined);
}

/** ⭐⭐⭐ (2026-11-10, §9.4) the orbit's DIRECTIONS' frame (F → world; the press's swing included) — `null`: the world's. */
export function dirFrame(st: SceneState): Mat3 | null {
  return st.asmTilt === null ? null : st.asmTilt.dir;
}

/** ⭐⭐⭐ (§9.4) the face map's frame (F → world) — `null`: the world's. */
function mapFrame(st: SceneState): Mat3 | null {
  return st.asmTilt === null ? null : st.asmTilt.map;
}

/**
 * ⭐⭐⭐ (58d86ff's `spanShownDir`, ported) THE PIECE'S SHOWN DIRECTION for the orbit's direction `u`: its angles off the gizmo's face's normal shown at the
 * eased shares (`st.asmCalm`) — ⭐⭐⭐ the SAME at every distance (the owner: *"modify the scope Q3: same calm at every distance"* — ⛔ 58d86ff's distance gate,
 * whole within 3.6 m and none from 5.4 m: an A + dy approach through it turned the piece's direction, the approach curved); faded only toward ±90° of pitch.
 */
function calmDir(st: SceneState, u: Vec3): Vec3 {
  // ⭐⭐⭐ (2026-11-09, §8 — F7b) the rule in `input/orbit_calm.ts` (`calmShown`): the eased facet's own frame, faded toward its poles
  // ⭐⭐⭐ (2026-11-10, §9.4) off a tilted facet both shares whole by the exit's share (`k`): at the edge the shown direction is the orbit's own in both frames
  const c = st.asmCalm;
  // ⭐⭐⭐ (2026-11-10, the owner's back-and-forth) …and by the calm's whole share by POSITION (`asmCalmWhole`): never eased, so never behind a fast finger
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) the vertical share alone toward a top / bottom edge (`asmCalmWholeV`);
  // the roll back off a tilted facet over a `b` end keeps the horizontal calm too (`exitAcross` — a turn about the edge's own line)
  const tl = st.asmTilt;
  const kH = Math.max(tl !== null && !tl.exitAcross ? tl.k : 0, st.asmCalmWhole);
  const kV = Math.max(tl?.k ?? 0, st.asmCalmWhole, st.asmCalmWholeV);
  if (c !== null && (kH > 0 || kV > 0)) return calmShown(u, { n: c.n, sH: 1 - (1 - c.sH) * (1 - kH), sV: 1 - (1 - c.sV) * (1 - kV), wA: c.wA ?? 0 });
  return calmShown(u, c);
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

function calmFrame(st: SceneState, dtMs: number): void {
  // ⭐⭐⭐ (2026-11-10, the owner's shake at a crossing — the root: two time laws in one rig) the whole share's TARGET by position (`calmTargets`), the
  // share itself on the rig's own lag (`wholeShareStep`, `gizmoEaseMs` — the gizmo's, which the piece and the camera's look follow)
  const prev = st.asmCalmWhole;
  const prevV = st.asmCalmWholeV;
  calmTargets(st, dtMs);
  st.asmCalmWhole = wholeShareStep(prev, st.asmCalmWhole, dtMs, st.cfg.gizmoEaseMs);
  st.asmCalmWholeV = wholeShareStep(prevV, st.asmCalmWholeV, dtMs, st.cfg.gizmoEaseMs);
}

/** ⭐ The calm's eased state (`st.asmCalm`) and its whole share's TARGET by position (left in `st.asmCalmWhole` for `calmFrame` to ease). */
function calmTargets(st: SceneState, dtMs: number): void {
  // ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — F7b) the rule in `input/orbit_calm.ts` (`calmTarget`, `calmStep`): every SIDE facet, slanted ones
  // included, in its own frame; the caps none
  const sh = st.asmShown;
  const map = sh === null ? null : faceMapOf(st);
  const cfg = st.cfg;
  const tg =
    sh === null || map === null
      ? { n: null, sH: 1, sV: 1 }
      : calmTarget(sh.t, map.facets[sh.t.stack]!, cfg.faceSpanShareVOn === 1 ? map.box : null, {
          shareH: cfg.faceSpanShareH,
          zoneHPct: cfg.faceSpanZoneHPct,
          zoneMinHM: cfg.faceSpanZoneMinHCm / 100,
          vOn: cfg.faceSpanShareVOn === 1,
          shareV: cfg.faceSpanShareV,
          zoneVPct: cfg.faceSpanZoneVPct,
          zoneMinVM: cfg.faceSpanZoneMinVCm / 100,
        }, acrossNormals(st, map, sh));
  // ⭐⭐⭐ (2026-11-10, §9.4) on the TILTED facet every edge is a frame change: whole toward them over the calm's own edge zones (`tiltCalmWholeHV`) —
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) both shares toward an edge ACROSS, the vertical one alone toward a
  // `b` end (a turn about the edge's own line: the horizontal calm carried over — `shownDirAcross`)
  const tl = st.asmTilt;
  st.asmCalmWhole = 0;
  st.asmCalmWholeV = 0;
  if (sh === null || sh.t.band === "SIDE" || tl !== null) st.asmCapYaw0 = null;
  if (tl !== null && sh !== null && map !== null && tg.n !== null && sh.t.stack === tl.facet) {
    const p = tiltCalmWholeHV(sh.t, map.facets[sh.t.stack]!, { zoneHPct: cfg.faceSpanZoneHPct, zoneMinHM: cfg.faceSpanZoneMinHCm / 100, zoneVPct: cfg.faceSpanZoneVPct, zoneMinVM: cfg.faceSpanZoneMinVCm / 100 });
    const pV = Math.max(p.h, p.v);
    st.asmCalm = calmStep(st.asmCalm, { n: tg.n, sH: 1 - (1 - tg.sH) * (1 - p.h), sV: 1 - (1 - tg.sV) * (1 - pV), wA: tg.wA }, dtMs);
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
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) ON A CAP: the vertical share whole, the side's horizontal calm KEPT
  // (`shownDirAcross` carries it over the edge), released only as a dx turns the orbit away from where it came over (`capYawRelease`) and by the pitch
  // (`poleWeight`) — ⛔ both whole at once: the yaw withheld through the dx released at the edge
  if (tl === null && sh !== null && sh.t.band !== "SIDE") {
    const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
    if (st.asmCapYaw0 === null) st.asmCapYaw0 = q.yaw;
    st.asmCalmWholeV = 1;
    st.asmCalmWhole = capYawRelease(q.yaw - st.asmCapYaw0);
    st.asmCalm = calmStep(st.asmCalm, st.asmCalm === null ? tg : { n: null, sH: st.asmCalm.sH, sV: 1, wA: 1 }, dtMs);
    return;
  }
  if (tl === null && sh !== null && map !== null && sh.t.band === "SIDE") {
    const col = map.columns[sh.t.side];
    if (col !== undefined) {
      const i = col.facets.indexOf(sh.t.stack);
      // ⭐⭐⭐ (2026-11-10) the VERTICAL share alone (the horizontal calm carried over the edge)
      if (i >= 0) st.asmCalmWholeV = poleEdgeWhole(sh.t.surface, map.facets[sh.t.stack]!, i === 0, i === col.facets.length - 1, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100);
    }
  }
  st.asmCalm = calmStep(st.asmCalm, tg, dtMs);
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
  const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}#T${st.asmTilt!.id}`;
  if (st.asmFaceMap !== null && st.asmFaceMap.key === key) return st.asmFaceMap.map;
  const map = buildFaceMap(tiltFaces(placedFaces(st), R), tiltBox(box, R), { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare });
  st.asmFaceMap = { key, map };
  return map;
}

/** ⭐⭐⭐ (§9.4) THE WORLD'S FACE MAP, whatever the frame (the press reads the cap there; the exit puts the map's angles there). */
function worldFaceMap(st: SceneState): FaceMap | null {
  const parts = placedParts(st);
  const box = shellOf(st);
  if (box === null) return null;
  const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}`;
  if (st.asmWorldMap !== null && st.asmWorldMap.key === key) return st.asmWorldMap.map;
  const map = buildFaceMap(placedFaces(st), box, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare });
  st.asmWorldMap = { key, map };
  if (mapFrame(st) === null) st.asmFaceMap = { key, map };
  return map;
}

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
function rawGizmo(st: SceneState, yaw: number, pitch: number): { readonly hit: GizmoHit; readonly t: MapTarget; readonly mouth?: { readonly lo: boolean; readonly hi: boolean } } | null {
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
export function mapGizmo(st: SceneState, yaw: number, pitch: number): { readonly hit: GizmoHit; readonly t: MapTarget; readonly mouth?: { readonly lo: boolean; readonly hi: boolean } } | null {
  const here = rawGizmo(st, yaw, pitch);
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
  // ⭐⭐⭐ (2026-11-10, §9.4) the relocation's offset at EVERY angle the solver asks (⛔ at the frame's own only: a step in the ring under the solver)
  const g = m === null ? gizmoFor(st) : withGOff(st, m.hit.point);
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
    st.asmLock = { point: [t[0], t[1], t[2]], normal: n, host: st.gizmoHost ?? null, cone: n === null ? null : lockCone(st.asmLock?.cone ?? null, angleTo(tiltDir(dirFrame(st), orbitDir(q0.yaw, q0.v)), n)) }; // ⭐ (§9.4) the orbit's direction in the world (⛔ F's angles read as the world's: under a slide on the tilted top the cone was wrong — the camera jumped 23 – 34 mm, back and forth, the walks)
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    return;
  }
  // ⭐⭐⭐ (2026-11-10, §9.4) the tilted facet left last frame: the WORLD's frame from this one (`tiltOff` — the angles turned, the gizmo kept)
  if (st.asmTilt !== null && st.asmTilt.exit) tiltOff(st);
  // ⭐⭐⭐ (2026-11-10, the owner: *"at close distance … it toggles on automatically therefore the tilt occurs each time the gizmo crosses a face's edge"*) —
  // within `tiltAutoM` of the gizmo (`tiltAutoLatch`, its hysteresis) the gizmo on a FACE HOLDING A POLE (the owner's term) tilts the orbit by itself
  // (`tiltOn`, last frame's place); the other faces need none (their lines square already); far out: the press only. ⚠ The tilt is a quarter turn: exact
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
  if (st.asmTiltAuto && st.asmTilt === null) tiltOn(st, "auto", st.asmMouth === null ? null : st.asmMouth.hi);
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = tiltDir(dirFrame(st), orbitDir(q.yaw, q.v));
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
    // ⭐⭐⭐ (2026-11-09) the catch-up held where it alone would move the gizmo across a jump (`mapAnglesStep`) — the ring stays a function of the angles
    const mq = mapAnglesStep(m0, { yaw: q.yaw, pitch }, { yaw: Math.atan2(Math.sin(q.yaw - prev.yaw), Math.cos(q.yaw - prev.yaw)), pitch: pitch - pitchOfV(prev.v) }, MAP_CATCH_UP, (y, p) => mapGizmo(st, y, p)?.hit.point ?? null);
    st.asmMapQ = mq;
    const m0g = mapGizmo(st, mq.yaw, mq.pitch);
    if (m0g !== null) {
      // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt shall happen when the red section reaches the edge at the bottom of the mouth"* → *"build b"*) A VOID'S MOUTH:
      // a dy toward its open end HOLDS the gizmo where it last was — the void's floor edge, the red's end there (`mouthHold`) — and hands over: the automatic
      // tilt from there (close in), the next facet's first place once the angles reach it (far out); a dx lets it go onto the plane's bridge (§8.3)
      const sh0 = st.asmShown;
      const dP = sh0 === null ? 0 : mq.pitch - sh0.pitch;
      const dY = sh0 === null ? 0 : Math.atan2(Math.sin(mq.yaw - sh0.yaw), Math.cos(mq.yaw - sh0.yaw));
      const wasHeld = st.asmMouth !== null;
      const holdNow = mouthHold(wasHeld, m0g.mouth, dP, dY);
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
      // ⭐⭐⭐ (2026-11-10, §9.4) the tilted pole's frame this frame: the press's swing, the share of the way off the facet (the roll back), the exit
      tiltFrame(st, dtMs, m.t.stack);
      // ⭐⭐⭐ (§9.4) a frame change that moves the gizmo: its relocation, eased (`asmGOff`)
      gOffStep(st, dtMs);
      hit = { ...hit, point: withGOff(st, hit.point) };
      st.asmG = hit.point;
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
    // ⭐⭐⭐ (2026-11-10, §9.4) in the map's frame (the tilted pole's F)
    const gM = st.asmG === null ? null : untiltDir(mapFrame(st), st.asmG);
    const nM = st.gizmoNormal === null || st.gizmoNormal === undefined ? null : untiltDir(mapFrame(st), st.gizmoNormal);
    st.asmMapQ = map !== null && gM !== null ? mapAngles(map, gM, facetOfNormal(map, nM, gM), mapOpts(st)) : null;
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
  const show = st.cfg.sectionLines === 1 && !st.asmLocked && st.hover === null && g !== null && sh !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const parts = `${st.asmParts?.key ?? ""}#T${st.asmTilt?.id ?? 0}`; // ⭐ (§9.4) a frame's lines are its own
  const o = mapOpts(st);
  const optKey = `${o.edgeMm}|${o.edgeDeg}`;
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
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  // ⭐⭐⭐ (2026-11-10, §9.4) THE TILTED POLE: the camera upright IN F (the pressed cap a side), turned into the world; off the facet the frame turned toward
  // the world's upright by the exit's share (`frameMix` — the roll back, paced by the finger, reversible; the far edge's half turn about one kept axis)
  const tl = st.asmTilt;
  if (tl !== null) {
    const uF = orbitDir(cam.yaw, cam.v);
    const lockN = st.asmLocked && st.asmLock !== null ? st.asmLock.normal : null;
    const sF = lockN === null ? calmDir(st, uF) : untiltDir(tl.dir, coneClamp(tiltDir(tl.dir, uF), lockN, st.asmLock!.cone ?? undefined));
    const fF = offsetFrame(sF, st.asmLocked ? cam.yaw : calmHeading(cam.yaw, uF, sF), o.yawRad, o.pitchRad);
    let f = { dir: mulM(tl.dir, fF.dir), up: mulM(tl.dir, fF.up) };
    const uW = mulM(tl.dir, sF);
    const flat = Math.hypot(uW[0], uW[2]);
    const hW = flat > 1e-3 ? Math.atan2(uW[2], uW[0]) : Math.atan2(-f.up[2], -f.up[0]);
    // ⭐⭐⭐ (2026-11-10, `1.0.120c-`) THE CAMERA NEVER REALIGNED: from the crossing the world camera's own up (`uprightUp`, as the world's branch built it),
    // then carried frame to frame (`carryUp`) — no roll of its own; the roll back to upright at the exit as before (`frameMix` below)
    if (tl.carry) {
      const up0 = tl.up0 === null ? uprightUp(uW, hW) : (carryUp(tl.up0, uW) ?? uprightUp(uW, hW));
      tl.up0 = up0;
      f = offsetFrameUp(uW, up0, o.yawRad, o.pitchRad);
    }
    const mix = frameMix(f, offsetFrame(uW, hW, o.yawRad, o.pitchRad), tl.k, tl.axis);
    tl.rollRad = mix.angle; // ⭐ (2026-11-10) the roll's whole angle — its duration at `tiltRollDegS`
    if (!(tl.k > 0)) return f;
    tl.axis = mix.axis;
    return mix.frame;
  }
  const u = dirAt(st, cam.yaw, cam.v);
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
  const R = dirFrame(st);
  const a1 = angleTo(tiltDir(R, orbitDir(yaw1, v1)), n);
  return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(tiltDir(R, orbitDir(yaw0, v0)), n);
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
 * edge's slow stretch (`faceEdgeSlideDeg`, 3 (a)). Done: none.
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
 * ⭐⭐⭐ ONE FRAME OF THE TILTED POLE, after the map's place (`stack` at the map's angles `mq`): the press's swing advanced (`swingDir`); the share of the way
 * off the tilted facet (`exitShare` — the camera's roll back and the calm's shares whole by it); off the facet: whole, and the world's frame next frame.
 */
function tiltFrame(st: SceneState, dtMs: number, stack: number): void {
  const tl = st.asmTilt;
  if (tl === null) return;
  if (tl.swingMs !== null) {
    tl.swingMs += dtMs;
    const e = tl.swingDurMs > 0 ? swingEase(tl.swingMs / tl.swingDurMs) : 1;
    tl.dir = swingDir(tl.map, tl.delta, e);
    if (e >= 1) tl.swingMs = null;
  }
  // ⭐⭐⭐ (2026-11-10, THE REBUILD — the owner: *"once the tilt starts, it cannot be rolled back … and shall complete"*, *"keep the edge, and not use any
  // stretch"*, *"1-b"*, *"one speed for every tilt"*) THE ROLL BACK STARTS AS THE GIZMO CROSSES THE EDGE (off the tilted facet) — or out past the
  // automatic tilt's threshold — and runs to the end on its own clock at `tiltRollDegS` (`rollDurationMs` of the turn's own angle); the gizmo HELD
  // meanwhile (`tiltClampStep`, `tiltUnderWay`); whole: the world's frame (`tiltExits`, the swing over too)
  const onFacet = stack === tl.facet;
  if (!onFacet && !tl.finishing) {
    tl.finishing = true;
    tl.exitAcross = (st.asmCalm?.wA ?? 0) > 0.5; // ⭐ (2026-11-10) over a `b` end: the reading toward the edge's line there
    st.lastVerdict = "orbit: over the edge — the tilt back to upright (the gizmo held until it completes)";
  }
  tl.kT = tl.finishing || tl.off ? 1 : 0;
  tl.k = rollStep(tl.k, tl.kT, dtMs, rollDurationMs(tl.rollRad, st.cfg.tiltRollDegS));
  tl.exit = tiltExits(onFacet, tl.k, tl.swingMs === null, tl.off);
}

/**
 * ⭐⭐⭐ (2026-11-10, the rebuild — the owner: *"1-b"*) AN ORBIT STEP WHILE A TILT IS UNDER WAY (`tiltUnderWay`: its swing, or its roll back not whole) — REFUSED:
 * the gizmo held where the crossing left it until the tilt completes; then the finger has the orbit again. Returns whether it refused the step.
 */
export function tiltClampStep(st: SceneState, yaw0: number, v0: number): boolean {
  const tl = st.asmTilt;
  if (tl === null || !tiltUnderWay(tl.swingMs !== null, tl.finishing || tl.off, tl.k)) return false;
  if (st.orbit.yaw === yaw0 && st.orbit.elevation === v0) return false;
  st.orbit.reset(yaw0, v0);
  return true;
}

/**
 * ⭐⭐⭐ EVERY ORBIT ANGLE TURNED INTO ANOTHER FRAME (`turn`: a direction from the old frame to the new): the orbit's, the solved piece's, the spring's (at
 * rest), the camera's as shown (its leash state rebuilt from the piece), the gizmo's last; the yaws kept together (one hint). The coast stopped.
 */
function turnAngles(st: SceneState, turn: (d: Vec3) => Vec3): void {
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
  const o = conv(st.orbit.yaw, st.orbit.elevation, 0);
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
 */
export function tiltOnPress(st: SceneState): void {
  tiltOn(st, "press");
}

/** ⭐⭐⭐ (§9.4; 2026-11-10 automatic too) the tilt made — at a press (`tiltOnPress`) or by itself close in (`assemblyFrame`, `tiltAutoLatch`). */
function tiltOn(st: SceneState, why: "press" | "auto", mouthHi: boolean | null = null): void {
  if (!assemblyOn(st) || st.cfg.tiltedPole !== 1 || st.asmTilt !== null || st.asmLocked || st.hover !== null || st.greenBox === null) return;
  const sh = st.asmShown;
  const g = st.asmG;
  const wm = worldFaceMap(st);
  if (sh === null || g === null || wm === null) return;
  // ⭐⭐⭐ (2026-11-10, *"build b"*) held at a void's mouth (`asmMouth`): the face holding the pole it opens toward — the red has reached the floor's edge
  const capStack = mouthHi === null ? sh.t.stack : mouthHi ? wm.top : wm.bottom;
  const top = capStack === wm.top;
  if (!top && capStack !== wm.bottom) return;
  // ⭐⭐ (2026-11-10, the owner: *"fix the gap"*) ANY face holding a pole — level, slanted (tilted by its own angle, `capTilt`), or VIRTUAL (the pole held by
  // an edge, no face beyond 45°: tilted as a level one, the gizmo then onto the real face nearest in F, eased) — ⛔ a real one only before
  const cap = wm.facets[capStack]!;
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const hs = snapHeading(q.yaw);
  // ⭐⭐⭐ (2026-11-10, `1.0.120c-`, the owner: *"do not realign the camera view in yaw when a horizontal edge is crossed"*) the automatic tilt: NO SWING — the
  // frame still built square to the edge (`hs`: the sections square to the face), the orbit and the camera turned into it as they are (`delta` 0), the
  // camera's up carried (`carry`); a press as before
  const carry = why === "auto";
  const delta = carry ? 0 : Math.atan2(Math.sin(hs - q.yaw), Math.cos(hs - q.yaw));
  const R1 = capTilt(hs, cap.n);
  const D0 = swingDir(R1, delta, 0);
  // ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) THE CAMERA SWINGS FROM THE HEADING SHOWN: the calm carried over the
  // edge (`shownDirAcross`) shows the piece at the calmed heading, not the orbit's — the camera's swing turns THAT to square (the directions' frame by
  // `deltaShown`); the orbit's angles are turned by their own (`D0`, `delta`: the gizmo and the solver exact). ⛔ By the orbit's `delta`: 20° off square, the
  // heading shown −83.7°, the swing started from the orbit's −70° (probed: −101.4°, then back to −90° over 20 frames)
  const sw = dirAt(st, q.yaw, q.v);
  const deltaShown = carry ? 0 : Math.hypot(sw[0], sw[2]) > 1e-3 ? Math.atan2(Math.sin(hs - Math.atan2(sw[2], sw[0])), Math.cos(hs - Math.atan2(sw[2], sw[0]))) : delta;
  // ⭐ (2026-11-10, *"one speed for every tilt"*) the swing's duration: its angle at `tiltRollDegS`
  const swingDurMs = rollDurationMs(deltaShown, st.cfg.tiltRollDegS);
  st.asmTilt = { id: ++TILT_SEQ, map: R1, dir: swingDir(R1, deltaShown, 0), facet: -1, delta: deltaShown, swingMs: 0, swingDurMs, k: 0, kT: 0, off: false, finishing: false, rollRad: Math.PI, axis: null, exit: false, exitAcross: false, carry, up0: null };
  const map = faceMapOf(st);
  if (map === null) {
    st.asmTilt = null;
    return;
  }
  const gF = mulT(R1, g);
  const fi = facetOfNormal(map, mulT(R1, cap.n), gF);
  st.asmTilt.facet = fi;
  turnAngles(st, (d) => mulT(D0, d));
  const mq = mapAngles(map, gF, fi, mapOpts(st));
  st.asmMapQ = mq;
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
  st.lastVerdict = `orbit: the tilted pole${why === "auto" ? " (automatic)" : ""} — the face holding the ${top ? "top" : "bottom"} pole is a side (heading ${Math.round((hs * 180) / Math.PI)}°, swing ${Math.round((delta * 180) / Math.PI)}°)`;
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ (§9.4) OFF THE TILTED FACET: the world's frame again — every orbit angle turned into it (the camera already at the world's upright: the exit's
 * share is whole at the edge); the gizmo kept — the world map's angles put at it (`mapAngles`), a relocation there eased by the finger's travel.
 */
function tiltOff(st: SceneState): void {
  const tl = st.asmTilt;
  if (tl === null) return;
  const D = tl.dir;
  const byTime = tl.off; // ⭐ (2026-11-10) turned off by distance: the relocation eased by time
  const g = st.asmG;
  const fm = faceMapOf(st);
  const sh = st.asmShown;
  const nW = fm !== null && sh !== null ? mulM(tl.map, fm.facets[sh.t.stack]!.n) : null;
  turnAngles(st, (d) => mulM(D, d));
  // ⭐⭐⭐ (2026-11-10) THE CALM CARRIED OUT OF F: over a `b` end (a turn about the edge's line) the new side's normal at once, the horizontal share kept;
  // across, both whole (⛔ both whole always: the calmed yaw released at every exit, then calmed again — a swing there and back)
  if (st.asmCalm !== null) st.asmCalm = tl.exitAcross && nW !== null ? { n: nW, sH: st.asmCalm.sH, sV: 1, wA: 1 } : { ...st.asmCalm, sH: 1, sV: 1 };
  st.asmTilt = null;
  st.asmShown = null;
  st.asmGOff = null;
  const wm = faceMapOf(st);
  if (wm !== null && g !== null) {
    const mq = mapAngles(wm, g, facetOfNormal(wm, nW, g), mapOpts(st));
    st.asmMapQ = mq;
    const m = mapGizmo(st, mq.yaw, mq.pitch);
    if (m !== null) {
      const v: Vec3 = [g[0] - m.hit.point[0], g[1] - m.hit.point[1], g[2] - m.hit.point[2]];
      if (Math.hypot(v[0], v[1], v[2]) > 1e-6) st.asmGOff = { v, left: 1, timeMs: 0, durMs: rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS) };
    }
  } else st.asmMapQ = null;
  st.lastVerdict = byTime ? "orbit: the tilt off (out past the threshold) — the world's frame again" : "orbit: off the tilted face — the world's frame again";
  st.hudDirty = true;
}
