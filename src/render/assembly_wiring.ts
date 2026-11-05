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
import { angleTo, lockCone, approachDistance, approachStep, coneClamp, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, offsetWithUp, modelNormal, ORBIT_PITCH_MAX_RAD, orbitDir, pitchOfV, swayRay, unswayHit, vOfPitch } from "../input/assembly_orbit";
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
import { alignedShare, capEdgeEnd, edgeShareTo, poleWeight, easeNormal, easeToward, sharesShowing, shownDir } from "../input/orbit_calm";
import { cross, type Vec3 } from "../core/vec";
import { cutLoop, insidePlane, planeThrough, type Plane } from "../input/plane_cut";
import { HOLD_NONE, holdAtCrossing, rolesFor, stepsFor, throughHold, type Roles } from "../input/input_roles";
import { CROSS_EPS_RAD, UPRIGHT, frameStep, rebaseAngles, stepToBoundary, toFrame, toWorld, type OrbitFrame } from "../input/orbit_frame";
import { capAxis, isCap, onScreen, paceUp, upTarget } from "../input/camera_up";
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
  // ⭐⭐⭐ (2026-11-05, the redesign §20) PAST A COLUMN'S BAND — onto a cap's quarter (in a turned frame: the 3° before a crossing back) — the calm of the
  // column's facet whose edge the place has just passed: its normal, its across-share, the vertical whole (as at its edge) — ⛔ none (both shares whole):
  // the targets FLIPPED at the band's edge; a contact sliding the place across it (−44° ↔ −45°) swung the camera 100–127 mm every few frames (probed)
  const capBand = t !== null && t.band !== "SIDE";
  const colFacet = capBand ? (() => {
    const map = faceMapOf(st);
    const col = map?.columns[t.side];
    return map === null || col === undefined ? null : map.facets[t.band === "TOP" ? col.facets[col.facets.length - 1]! : col.facets[0]!]!;
  })() : null;
  if (t !== null && (t.band === "SIDE" || colFacet !== null)) {
    const map = faceMapOf(st)!;
    const F = st.orbitFrame;
    // ⭐⭐⭐ (Step 4c-bis) the SIDE's axis, never a hit's normal (a groove's wall, a slanted block) — ⭐⭐⭐ (Step 5) the FACET's normal, read level (the
    // calm's frame turns about the frame's up: a facet sloping up a column, its heading)
    const nf = colFacet === null ? t.normal : colFacet.n;
    const h = Math.hypot(nf[0], nf[2]);
    n = h > 1e-9 ? [nf[0] / h, 0, nf[2] / h] : nf;
    const angle = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    // ⭐⭐⭐ (2026-11-05, §21.5 F3, the owner: *"as you recommend"*) ON A CAP the camera SQUARE to it — both shares 0 (the cap's normal)
    if (isCap(toWorld(F, nf))) {
      sH = 0;
      sV = 0;
    } else {
      // ⭐⭐⭐ (§21.5 F3) toward an edge onto a CAP the share rises past 1 to the one showing the cap's normal at the edge (`capEdgeEnd`, `edgeShareTo`) —
      // the view passes the zenith at the cap's edge (⛔ mid-cap: upside down from the middle to the far edge, §21.5 cause 2)
      const capTo = (fi: number | undefined): Vec3 | null => {
        const g = fi === undefined ? undefined : map.facets[fi];
        return g === undefined || !isCap(toWorld(F, g.n)) ? null : g.n;
      };
      const L = t.across;
      const col = map.columns[t.side];
      const off = col === undefined || st.asmShown === null ? 0 : Math.atan2(Math.sin(st.asmShown.yaw - col.mid), Math.cos(st.asmShown.yaw - col.mid));
      const sgn = off >= 0 ? 1 : -1;
      let endH = 1;
      if (col !== undefined && st.asmShown !== null) {
        const beyond = mapTarget(map, col.mid + sgn * (col.hw + 1e-3), st.asmShown.pitch, mapOpts(st));
        const cn = capTo(beyond.stack);
        const heading = Math.atan2(nf[2], nf[0]);
        const edge = col.mid + sgn * col.hw;
        endH = capEdgeEnd(cn === null ? null : angle(nf, cn), Math.atan2(Math.sin(edge - heading), Math.cos(edge - heading)));
      }
      sH = edgeShareTo(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm / 100, endH);
      // ⭐⭐⭐ dy's run: the gizmo's place UP ITS FACET (`b`) within the facet's span — the same span on every side of a contour of one height, so a pure dx
      // never changes it (⛔ the wall under the gizmo: its top differed from the front to the side at the same height — the owner's bounce, probed);
      // ⛔ the placed parts' BOX (Step 6: the piece jumped 2.8 m at a crossing). Past the band (transient): whole, as at its edge
      const fv = !capBand ? (map.facets[t.stack] ?? null) : null;
      if (fv === null || col === undefined) sV = 1;
      else {
        const b = t.surface[0] * fv.b[0] + t.surface[1] * fv.b[1] + t.surface[2] * fv.b[2];
        const i = col.facets.indexOf(t.stack);
        const upper = fv.bHi - b < b - fv.bLo;
        const pitchN = Math.asin(Math.max(-1, Math.min(1, nf[1])));
        const nb = upper ? (i + 1 < col.facets.length ? col.facets[i + 1] : map.top) : i > 0 ? col.facets[i - 1] : map.bottom;
        const cn = capTo(nb);
        const edgeP = upper ? col.bounds[i + 1] : col.bounds[i];
        const endV = edgeP === undefined ? 1 : capEdgeEnd(cn === null ? null : angle(nf, cn), edgeP - pitchN);
        const interior = cfg.faceSpanShareVOn === 1 ? cfg.faceSpanShareV : 1;
        sV = edgeShareTo(Math.min(b - fv.bLo, fv.bHi - b), fv.bHi - fv.bLo, interior, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100, endV);
      }
    }
  }
  const k = st.asmCalm;
  if (k === null) {
    // ⭐ from none: the shares come in from 1 (the orbit's whole angle) — never a jump at the start
    if (n !== null) st.asmCalm = { n, sH: easeToward(1, sH, dtMs), sV: easeToward(1, sV, dtMs) };
    return;
  }
  // ⭐⭐⭐ (§21.5 F3) A FACE CHANGE WITHOUT A TURN (a dx over a vertical edge): the calm carried as at a turn — its normal the new face's, its shares the ones
  // showing the piece's direction now (`sharesShowing`) — ⛔ the cap's 0 shares kept about a wall's normal: the direction swung 90°, 4 m far out (probed)
  if (n !== null && Math.abs(n[0] - k.n[0]) + Math.abs(n[2] - k.n[2]) > 1e-3 && st.boxOrbit !== null) {
    const F = st.orbitFrame;
    const uW = toWorld(F, orbitDir(st.boxOrbit.yaw, st.boxOrbit.v));
    const shown = toFrame(F, calmDir(st, uW));
    const u = toFrame(F, uW);
    const sh = sharesShowing(u, shown, n, [-n[2], 0, n[0]], [0, 1, 0], poleWeight(u[1]));
    k.n = n;
    k.sH = sh.sH;
    k.sV = sh.sV;
  }
  if (n !== null) {
    // ⭐ the horizontal share whole: the normal changes nothing (the pitch is the world's up's, the heading the orbit's own) — taken at once (⛔ eased from
    // a stale face 175° away while the shares fell: a 271 mm camera jump)
    k.n = Math.abs(k.sH - 1) < 1e-3 ? n : easeNormal(k.n, n, dtMs);
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
function faceMapOf(st: SceneState, frame?: OrbitFrame): FaceMap | null {
  const parts = placedParts(st);
  const box = shellOf(st);
  if (box === null) return null;
  const F = frame ?? st.orbitFrame;
  const mine = frame === undefined; // the orbit's own frame: kept on the state (the probes read it)
  const upright = F.q[0] > 1 - 1e-12;
  const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}#${upright ? "U" : F.key}`;
  if (mine && st.asmFaceMap !== null && st.asmFaceMap.key === key) return st.asmFaceMap.map;
  const memo = FACE_MAPS.get(st)?.get(key);
  if (memo !== undefined) {
    if (mine) st.asmFaceMap = { key, map: memo };
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
      faces.push(upright ? { normal: w.normal, centre: w.centre, tris } : { normal: toFrame(F, w.normal), centre: toFrame(F, w.centre), tris: tris.map((tr) => [toFrame(F, tr[0]), toFrame(F, tr[1]), toFrame(F, tr[2])] as const) });
    }
  }
  // ⭐⭐⭐ (Step 6) the parts' box in the frame (upright: the shell's)
  const boxF = upright ? box : (shellBox(parts.parts.map((vs) => vs.map((v) => toFrame(F, v)))) ?? box);
  const map = buildFaceMap(faces, boxF, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare });
  if (mine) st.asmFaceMap = { key, map };
  // ⭐ (Step 6) a few maps kept (upright and the frames turned onto): a turn and back rebuilds none
  let m = FACE_MAPS.get(st);
  if (m === undefined || m.size > 32) {
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
  return { hit: realAt(st, map, map.facets[t.stack]!, t.surface, t.normal, (o, d, l) => frameCast(st, o, d, l)), t };
}

/**
 * ⭐⭐⭐ (2026-11-05, §21 — `rawGizmo`'s body, shared with the plane-cut lines) THE REAL SURFACE at the contour's point `sf` on facet `f` (its normal `n`, the
 * map's coordinates; `cast` a ray in them): the facet's stack there (`stackDepthAt` — the frontmost group, a bridged void), the ray along the normal for the
 * real depth (D3); the place's two other coordinates kept.
 */
function realAt(st: SceneState, map: FaceMap, f: FaceMap["facets"][number], sf: Vec3, n: Vec3, cast: (o: Vec3, d: Vec3, l: number) => GizmoHit | null): GizmoHit {
  void st;
  const at = stackDepthAt(f, sf[0] * f.t[0] + sf[1] * f.t[1] + sf[2] * f.t[2], sf[0] * f.b[0] + sf[1] * f.b[1] + sf[2] * f.b[2]);
  if (at === null) return { point: sf, normal: n, host: null };
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
    const h = cast(o, [-n[0], -n[1], -n[2]], out - sup(-1) + MAP_OUT_M);
    if (h !== null && (at.bridged !== true || level(h.point) > at.depth + MAP_BRIDGE_FRONT_M)) return { point: onto(level(h.point)), normal: h.normal ?? n, host: h.host };
  }
  return { point: p, normal: n, host: null };
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
  if (st.router.size === 0 && !st.orbitInertia.coasting) st.asmHold = HOLD_NONE; // ⭐ (§21.5 F1) a drag's hold ends with it
  frameAtTarget(st);
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
 * ⭐⭐⭐ (2026-11-05, §21) THE SECTIONS DRAWN AS PLANE CUTS — each line the faces contour (the world's facets, `faceMapOf(st, UPRIGHT)`) cut by a plane
 * through the gizmo's place (`cutLoop`): the one square to the orbit frame's up (the frame's dx loop) and the one through that up and the facet's normal
 * (its dy loop) — on a box world planes, ONE CLOSED LOOP each by construction (a plane through a convex solid; 1 mm inside any facet it is parallel to —
 * `insidePlane`), never thrown off by a pole or a slanted face. The gizmo travels exactly them (the face map's columns in the frame ARE these cuts); each
 * drawn on the REAL surface (`realAt`: the stack, the bridged void, the cast along the facet's normal), broken at a depth step; the gizmo's exact point a
 * vertex of both. COLOURED BY THE SCREEN (§21.4 R1): the line the dx drives green, the dy's red (`asmInputRoles`) — a line may change colour after a roll.
 * Each line recomputed only when its plane moves (under a pure dx the frame's dx loop is fixed). ⭐ ONE mesh of a fixed vertex count, updated in place.
 * ⛔ The sweeps of the face map (2026-11-04 … §20): straight only on the frame's own columns, re-drawn at every frame turn, paths no input follows.
 */
const LINE_MAX = 700;
const LINE_STEP_M = 0.015;
/** ⭐ The lines lifted off the surface along its face's axis (m) — never in it. */
const SECTION_LIFT_M = 0.002;

/** ⭐ One plane's line: its points (lifted, the real surface) and which consecutive pairs join; cached by its plane. */
function cutLine(st: SceneState, plane: Plane): { readonly pts: readonly Vec3[]; readonly joins: readonly boolean[] } {
  const map = faceMapOf(st, UPRIGHT);
  const parts = st.asmParts?.key ?? "";
  const key = `${parts}#${plane.n.map((x) => x.toFixed(5)).join(",")}#${plane.d.toFixed(4)}`;
  const cache = LINE_CACHE.get(st) ?? new Map<string, { pts: Vec3[]; joins: boolean[] }>();
  LINE_CACHE.set(st, cache);
  const known = cache.get(key);
  if (known !== undefined) return known;
  const pts: Vec3[] = [];
  const joins: boolean[] = [];
  if (map !== null) {
    const facets = map.facets.map((f) => ({ n: f.n, poly: f.poly }));
    const loop = cutLoop(facets, insidePlane(plane, facets));
    if (loop !== null) {
      let prevC: Vec3 | null = null;
      let prevR: Vec3 | null = null;
      const N = loop.pts.length;
      for (let i = 0; i < N; i++) {
        const A = loop.pts[i]!;
        const B = loop.pts[(i + 1) % N]!;
        const fi = loop.facet[i]!;
        const f = map.facets[fi]!;
        const L = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
        const k = Math.max(1, Math.ceil(L / LINE_STEP_M));
        for (let j = 0; j <= k; j++) {
          const s = j / k;
          const c: Vec3 = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, A[2] + (B[2] - A[2]) * s];
          const r = realAt(st, map, f, c, f.n, (o, d, l) => modelCast(st, o, d, l)).point;
          const lifted: Vec3 = [r[0] + f.n[0] * SECTION_LIFT_M, r[1] + f.n[1] * SECTION_LIFT_M, r[2] + f.n[2] * SECTION_LIFT_M];
          // a depth step breaks the line: the real step far beyond the contour's (2.5 × + 2 mm)
          const join =
            prevC !== null && prevR !== null && Math.hypot(r[0] - prevR[0], r[1] - prevR[1], r[2] - prevR[2]) <= 2.5 * Math.hypot(c[0] - prevC[0], c[1] - prevC[1], c[2] - prevC[2]) + 0.002;
          if (pts.length > 0) joins.push(join);
          pts.push(lifted);
          prevC = c;
          prevR = r;
        }
      }
      // closed: the last joined to the first
      if (pts.length > 1) joins.push(true);
    }
  }
  const out = { pts, joins };
  if (cache.size > 64) cache.clear();
  cache.set(key, out);
  return out;
}
const LINE_CACHE = new WeakMap<SceneState, Map<string, { pts: Vec3[]; joins: boolean[] }>>();

/** ⭐ (§21) The two cutting planes at the gizmo's place: the frame's dx loop (square to its up) and its dy loop (through its up and the facet's normal). */
function cutPlanes(st: SceneState): { readonly a: Plane; readonly b: Plane | null } | null {
  const sh = st.asmShown;
  if (sh === null) return null;
  const F = st.orbitFrame;
  const c = toWorld(F, sh.t.surface);
  const n = toWorld(F, sh.t.normal);
  const up = toWorld(F, [0, 1, 0]);
  const r = cross(up, n);
  return { a: planeThrough(c, up), b: Math.hypot(r[0], r[1], r[2]) > 1e-6 ? planeThrough(c, r) : null };
}

function sectionLinesFrame(st: SceneState): void {
  const sh = st.asmShown;
  const g = st.asmG;
  const show = st.cfg.sectionLines === 1 && !st.asmLocked && st.hover === null && g !== null && sh !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const cp = cutPlanes(st);
  if (cp === null) return;
  const A = cutLine(st, cp.a);
  const B = cp.b === null ? { pts: [] as Vec3[], joins: [] as boolean[] } : cutLine(st, cp.b);
  // the colours by the screen (R1): the line the dx drives green — the frame's yaw is axis 0, its dx loop line A
  const roles = asmFaceRoles(st);
  const aGreen = roles === null || roles.xAxis === 0;
  const tN = toWorld(st.orbitFrame, sh.t.normal);
  const gv: Vec3 = [g[0] + tN[0] * SECTION_LIFT_M, g[1] + tN[1] * SECTION_LIFT_M, g[2] + tN[2] * SECTION_LIFT_M];
  const key = `${cp.a.n.join(",")}|${cp.a.d.toFixed(5)}|${cp.b === null ? "-" : `${cp.b.n.join(",")}|${cp.b.d.toFixed(5)}`}|${aGreen}|${gv.map((x) => x.toFixed(5)).join(",")}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const rest = new Vector3(gv[0], gv[1], gv[2]);
  const segs = (line: { readonly pts: readonly Vec3[]; readonly joins: readonly boolean[] }): Vector3[][] => {
    const out: Vector3[][] = [];
    const P = line.pts;
    // ⭐ the gizmo's exact point a vertex of the line: the sample nearest it replaced by it
    let near = -1;
    let best = Infinity;
    P.forEach((p, i) => {
      const d = Math.hypot(p[0] - gv[0], p[1] - gv[1], p[2] - gv[2]);
      if (d < best) {
        best = d;
        near = i;
      }
    });
    const at = (i: number): Vector3 => {
      const p = i === near && best < 0.03 ? gv : P[i]!;
      return new Vector3(p[0], p[1], p[2]);
    };
    for (let i = 0; i < P.length && out.length < LINE_MAX; i++) {
      const j = (i + 1) % P.length;
      out.push(line.joins[i] ? [at(i), at(j)] : [rest, rest]);
    }
    while (out.length < LINE_MAX) out.push([rest, rest]);
    return out;
  };
  const green = segs(aGreen ? A : B);
  const red = segs(aGreen ? B : A);
  const lines = [...green, ...red];
  if (st.asmSectionLines === null) {
    const colours = lines.map((_, i) => (i < LINE_MAX ? [new Color4(0.35, 0.8, 0.35, 1), new Color4(0.35, 0.8, 0.35, 1)] : [new Color4(0.9, 0.25, 0.2, 1), new Color4(0.9, 0.25, 0.2, 1)]));
    st.asmSectionLines = CreateLineSystem("asmSections", { lines, colors: colours, updatable: true }, st.scene);
    st.asmSectionLines.isPickable = false;
    st.asmSectionLines.alwaysSelectAsActiveMesh = true;
    // ⭐ in the TRANSPARENT pass, after the pieces' see-through contours (⛔ opaque, the contours drawn over them washed them out); hidden behind solid parts
    st.asmSectionLines.alpha = 0.99;
    st.asmSectionLines.alphaIndex = 1000;
  } else CreateLineSystem("asmSections", { lines, instance: st.asmSectionLines });
  st.asmSectionLines.isVisible = true;
}

/** ⭐ The face the TRAVEL is on: the face map's place at the orbit's TARGET (where the finger drives), its world normal, a cap or a wall, a key. */
interface TravelFace {
  readonly key: string;
  readonly n: Vec3;
  readonly cap: boolean;
  /** a cap's carried axis (world, in its plane); a wall: `null` */
  readonly axis: Vec3 | null;
  /** the finger's roles on this face (F4) */
  readonly roles: Roles;
  /** the gizmo's travel per radian of each orbit axis on this face (m) */
  readonly mPerRad: readonly [number, number];
  /** the next face on the finger's way within `cameraRollMm` (its world normal), else `null` */
  readonly ahead: Vec3 | null;
}

/**
 * ⭐⭐⭐ (§21.5 F2) THE NEXT FACE ON THE WAY: the travel's place advanced `cameraRollMm` along the way the finger last travelled (`st.asmTravelDir`, by the
 * face's metres per radian) — its world normal when it is another face, else `null`.
 */
function aheadNormal(st: SceneState, map: FaceMap, n: Vec3, yaw: number, pitch: number): Vec3 | null {
  const d = st.asmTravelDir;
  const ahead = st.cfg.cameraRollMm / 1000;
  const m = st.asmFace?.mPerRad ?? null;
  if (d === null || m === null || !(ahead > 0) || st.asmLocked) return null;
  const l = Math.hypot(d[0] * m[0], d[1] * m[1]);
  if (!(l > 1e-12)) return null;
  const k = ahead / l;
  const t = mapTarget(map, yaw + d[0] * k, pitch + d[1] * k, mapOpts(st));
  const na = toWorld(st.orbitFrame, t.normal);
  return na[0] * n[0] + na[1] * n[1] + na[2] * n[2] > 0.999 ? null : [Math.round(na[0] * 1e3) / 1e3, Math.round(na[1] * 1e3) / 1e3, Math.round(na[2] * 1e3) / 1e3];
}

/** ⭐⭐⭐ (§21.5 F2) THE UP for the view `u` on a face (normal `n`, a cap's `axis`) with the next face `nAhead` on the way: onto a wall, ITS up (the roll
 * starts); onto a cap or none, the face's own (`upTarget`). One rule for the camera and the roles. */
function upFor(u: Vec3, n: Vec3, axis: Vec3 | null, nAhead: Vec3 | null): Vec3 {
  return nAhead !== null && !isCap(nAhead) ? upTarget(u, nAhead, null) : upTarget(u, n, axis);
}

/**
 * ⭐⭐⭐ (2026-11-05, §21.5 F4) THE TRAVEL'S FACE AND ITS ROLES — read once per face (the key: the frame, the column, the facet): each orbit axis's step on
 * the face (`mapTarget`'s place on the contour, a small step each, out of the frame) seen SQUARE to the face, with the face's own up — a wall's gravity
 * (`upTarget` along its normal), a cap's carried axis (`capAxis`: the camera's shown up laid in it, set on arriving) → `rolesFor`. ⛔ The rolling camera's
 * view, every frame (§21.5 cause 5: a step into a face seen edge-on stopped the finger for good). `changed`: a new face this call.
 */
function travelFace(st: SceneState): { readonly face: TravelFace | null; readonly changed: boolean } {
  const map = faceMapOf(st);
  if (map === null) return { face: null, changed: false };
  const F = st.orbitFrame;
  const yaw = st.orbit.yaw;
  const pitch = pitchOfV(st.orbit.elevation);
  const o = mapOpts(st);
  const t = mapTarget(map, yaw, pitch, o);
  const n = toWorld(F, t.normal);
  const nAhead = aheadNormal(st, map, n, yaw, pitch);
  const key = `${F.key}|${t.band}|${t.side}|${t.stack}|${nAhead === null ? "-" : nAhead.map((x) => x.toFixed(3)).join(",")}`;
  const f0 = st.asmFace;
  if (f0 !== null && f0.key === key) return { face: f0, changed: false };
  const cap = isCap(n);
  // a cap's axis: kept on the same cap (a key change on it — a column, a frame turn), else the wall's up turned over the edge crossed (`capAxis`)
  const sameFace = f0 !== null && f0.n[0] * n[0] + f0.n[1] * n[1] + f0.n[2] * n[2] > 0.999;
  const sameCap = sameFace && f0!.cap;
  const axis = !cap ? null : sameCap ? f0!.axis : capAxis(n, f0 === null || f0.cap ? null : f0.n, st.asmUpShown ?? st.cameraPrev?.up ?? [0, 0, 1]);
  const mPerRad0 = sameFace ? f0!.mPerRad : null;
  const H = 1e-3;
  const g0 = toWorld(F, t.surface);
  const gy = toWorld(F, mapTarget(map, yaw + H, pitch, o).surface);
  const gp = toWorld(F, mapTarget(map, yaw, pitch + H, o).surface);
  const f: Vec3 = [-n[0], -n[1], -n[2]];
  // ⭐⭐⭐ (§21.5 F1 / F4) read with the up the camera is turning to — the next face's when within `cameraRollMm` of it on the way (`upFor`): the roles
  // and the camera's roll agree, and the roles' change there is an R4 event like a crossing
  const up = upFor(n, n, axis, nAhead);
  const right = cross(up, f);
  const on = (p: Vec3): [number, number] => {
    const d: Vec3 = [p[0] - g0[0], p[1] - g0[1], p[2] - g0[2]];
    return [d[0] * right[0] + d[1] * right[1] + d[2] * right[2], d[0] * up[0] + d[1] * up[1] + d[2] * up[2]];
  };
  const len = (p: Vec3): number => Math.hypot(p[0] - g0[0], p[1] - g0[1], p[2] - g0[2]) / H;
  const face: TravelFace = { key, n, cap, axis, roles: rolesFor(on(gy), on(gp)), mPerRad: mPerRad0 ?? [len(gy), len(gp)], ahead: nAhead };
  st.asmFace = face;
  return { face, changed: true };
}

/** ⭐ The finger's roles on the travel's face (the lines' colours read them); none yet: `null`. */
export function asmFaceRoles(st: SceneState): Roles | null {
  return travelFace(st).face?.roles ?? null;
}

/**
 * ⭐⭐⭐ (2026-11-05, §21.5 F1) THE FINGER'S TRAVEL — ONE CROSSING EVENT: the finger (`fx` right, `fy` up, mm; `rate` rad per mm) through R4's hold
 * (`throughHold`), mapped by the face's roles (`stepsFor`) onto the orbit's target, the step SPLIT at the first face change on its way
 * (`stepToBoundary`): there, once and in this order — the frame turned if it is a cap's bound (`frameAtTarget`), the new face's roles read (`travelFace`),
 * R4 (`holdAtCrossing`: a component now driven the opposite way or onto the other axis HELD, the owner: *"this overrules anything else"*) — and the rest
 * of the finger re-mapped. Under the slide (locked): no crossing. The orbit steps taken (rad) returned (the coast records them).
 */
export function asmFingerTravel(st: SceneState, fx: number, fy: number, rate: number): { readonly dYaw: number; readonly dPitch: number } {
  let sy = 0;
  let sp = 0;
  const h0 = throughHold(st.asmHold, fx, fy);
  st.asmHold = h0.h;
  let rx = h0.fx;
  let ry = h0.fy;
  for (let k = 0; k < 6 && (rx !== 0 || ry !== 0); k++) {
    const face = travelFace(st).face;
    const map = faceMapOf(st);
    if (face === null || map === null) break;
    const [a, b] = stepsFor(face.roles, rx, ry);
    const dYaw = a * rate;
    const dPitch = b * rate;
    if (dYaw === 0 && dPitch === 0) break;
    const s = st.asmLocked ? { t: 1, crossing: false } : stepToBoundary(map, st.orbit.yaw, pitchOfV(st.orbit.elevation), dYaw, dPitch);
    st.orbit.nudge(dYaw * s.t, (dPitch * s.t) / (2 * ORBIT_PITCH_MAX_RAD));
    sy += dYaw * s.t;
    sp += dPitch * s.t;
    st.asmTravelDir = [dYaw, dPitch];
    if (s.crossing) frameAtTarget(st);
    const next = travelFace(st).face;
    if (next !== null && next.key !== face.key) st.asmHold = holdAtCrossing(face.roles, next.roles, rx, ry, st.asmHold);
    if (!s.crossing) break;
    const h = throughHold(st.asmHold, rx * (1 - s.t), ry * (1 - s.t));
    st.asmHold = h.h;
    // ⭐⭐⭐ (§21.5 F1) a crossing is COMPLETED only by motion onto the new face: everything held (R4) — the travel stays AT the edge on the face it
    // came from, the frame turned back (⛔ left a hair over: the gizmo shown on the old face in the new frame's cap quarter, a dx then swept it round the
    // quarter's centre — 620 mm camera jumps, probed)
    if (h.fx === 0 && h.fy === 0 && next !== null && next.key !== face.key) {
      st.orbit.nudge(-Math.sign(dYaw) * CROSS_EPS_RAD * (dYaw !== 0 ? 2 : 0), (-Math.sign(dPitch) * CROSS_EPS_RAD * (dPitch !== 0 ? 2 : 0)) / (2 * ORBIT_PITCH_MAX_RAD));
      frameAtTarget(st);
      travelFace(st);
      break;
    }
    rx = h.fx;
    ry = h.fy;
  }
  return { dYaw: sy, dPitch: sp };
}

/** ⭐ (§21.5 F1) The coast's travel (orbit steps, rad): split at each face change as the finger's is, the frame turned there; no roles, no hold. */
export function asmAxesTravel(st: SceneState, dYaw: number, dPitch: number): void {
  let ry = dYaw;
  let rp = dPitch;
  for (let k = 0; k < 6 && (ry !== 0 || rp !== 0); k++) {
    const map = faceMapOf(st);
    const s = map === null || st.asmLocked ? { t: 1, crossing: false } : stepToBoundary(map, st.orbit.yaw, pitchOfV(st.orbit.elevation), ry, rp);
    st.orbit.nudge(ry * s.t, (rp * s.t) / (2 * ORBIT_PITCH_MAX_RAD));
    if (!s.crossing) break;
    frameAtTarget(st);
    ry *= 1 - s.t;
    rp *= 1 - s.t;
  }
}

/** ⭐⭐⭐ (§21.5 F2) THE CAMERA'S TARGET UP for the view `u`: the travel face's (`upFor` — the roles read with the same). */
function upTargetNow(st: SceneState, u: Vec3): Vec3 {
  const face = travelFace(st).face;
  return face === null ? upTarget(u, [0, 0, -1], null) : upFor(u, face.n, face.axis, face.ahead);
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

/**
 * ⭐ THE CAMERA'S FRAME: behind the piece along its direction, the owner's offsets about it (`offsetWithUp`) — ⭐⭐⭐ (2026-11-05, §21.4 R2 / R3, §21.5 F2)
 * its UP turned toward the travel's face's target (`upTargetNow`) at most `cameraRollDegPerS` (`paceUp`) — a roll is never a step. `dtMs`: the frame's
 * own camera, which carries the shown up to the next frame (`st.asmUpShown`); the others read it.
 */
export function assemblyCameraFrame(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset, dtMs?: number): RigCameraFrame {
  const u = dirAt(st, cam.yaw, cam.v);
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  const target = upTargetNow(st, u);
  let up: Vec3;
  if (dtMs !== undefined) {
    const r = paceUp(st.asmUpShown, target, u, ((st.cfg.cameraRollDegPerS * Math.PI) / 180) * (Math.max(0, dtMs) / 1000));
    st.asmUpShown = r.up;
    st.asmUpBand = r.rolling;
    up = r.up;
  } else up = (st.asmUpShown === null ? null : onScreen(st.asmUpShown, u)) ?? target;
  return offsetWithUp(u, up, o.yawRad, o.pitchRad);
}

/**
 * ⭐⭐⭐ (§21.5 F1) THE FRAME AT THE TARGET: the orbit's target (the finger's place) past its column's top / bottom bound — the frame turned there
 * (`frameStep`, `orbitFrameTurn`: nothing moves). Called at the crossing by the travel itself; each frame too, for a target moved otherwise (the slide's
 * way out, a rebase). ⛔ §21's first build: the SOLVED place, 3° past the bound — the frame turned out of step with the roll and the roles (cause 4).
 */
function frameAtTarget(st: SceneState): void {
  const map = faceMapOf(st);
  if (map === null || st.asmLocked) return;
  const next = frameStep(st.orbitFrame, map, st.orbit.yaw, pitchOfV(st.orbit.elevation));
  if (next !== null) orbitFrameTurn(st, next);
}

/**
 * ⭐⭐⭐ (STEP 6) THE TURN — NOTHING MOVES: every angle of the orbit re-read in the new frame as the same direction (`rebaseAngles` — the target, the solved
 * place, the eye's spring, the camera's leash and lag, the solver's last raw input and height kept, the gizmo's sync); the face map's angles put on the
 * gizmo (`gizmoAnglesAt`); the calm carried (its normal the facet now faced, its shares the ones showing the same direction — `sharesShowing`). The camera
 * needs nothing: its up is the view's (§20).
 */
function orbitFrameTurn(st: SceneState, to: OrbitFrame): void {
  const from = st.orbitFrame;
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
  // ⭐ the calm carried through: its normal the facet now faced, read level in the new frame — onto a cap the cap, back upright the wall it is on
  const k = st.asmCalm;
  const nn = to.cap !== null ? (to.capN === null ? null : toFrame(to, to.capN)) : nW;
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
  st.lastVerdict =
    to.q[0] > 1 - 1e-12 ? "orbit: the frame upright" : `orbit: the frame turned over an edge (${to.cap === "TOP" ? "up" : "down"})`;
  st.hudDirty = true;
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


/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const F = st.orbitFrame;
  const a1 = angleTo(toWorld(F, orbitDir(yaw1, v1)), n);
  return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(toWorld(F, orbitDir(yaw0, v0)), n);
}
