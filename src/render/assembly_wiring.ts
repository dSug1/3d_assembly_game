/**
 * ⭐⭐⭐ prototype — **THE ORBIT AROUND THE ASSEMBLY, WIRED** (2026-10-28; the rules are `input/assembly_orbit.ts`'s and, since 2026-11-02,
 * `input/orbit_shell.ts`'s). On while `orbitMode` is 0 (1: the gizmo's 2D curve as built to 2026-10-25, kept whole).
 * ⭐⭐⭐ (2026-11-02, *"Build the shell"*) — **THE PIECE RIDES A SMOOTH SHELL**: on the ray from the assembly's fixed CENTRE (`st.asm`) along its direction
 * (the orbit's angles in the orbit's own frame, `st.asmOrbit` — re-tilted before a pole), at the radius of the shell at the approach's distance + the
 * shell's offset, blended within the offset to the real surface under its footprint (`placeOffset`, read by `ringPlaceNow` — the solver's queries too).
 * The geometry changes that radius only: the way the piece moves is the finger's. The GIZMO is a READOUT — where the ray from the centre through the
 * piece meets the placed parts (`castGizmo`), eased; the orbit's centre the rest reads (`orbitCentreM` — the quads, the hover, the markers) IS it; the
 * lines drawn are the gizmo's paths under dx and dy (`sectionLinesFrame`). The approach (two fingers' dy, A + drag's) checked against the parts
 * (`approachMove`), with its own coast. The camera's frame (`assemblyCameraFrame`: from the centre far out, along the shell's normal close in; its up
 * carried with the motion, levelled at rest), its look point (`st.asmLook`). ⛔ No rule here.
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { approachDistance, approachStep, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, offsetAbout, modelNormal, orbitDir, rayOffsets, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { gizmoJoins, insertIndex, joins } from "../input/section_lines";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import { cameraOrbitAt, type CameraAngleOffset, type OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolveRuns, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import { hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { slideArmedAfter } from "../input/hover";
import { cross, dot, normalize, qRotate, qSlerp, qAngle, IDENTITY, type Quat, type Vec3 } from "../core/vec";
import { worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { antiPoleQuat, tiltAngles, tiltDirO, tiltDirW } from "../input/orbit_tilt";
import { alongSurface, baseLevel, basePoint, carryUp, chartInverse, easeUp, footprintHeight, groundAfter, groundDepth, levelUp, placeAlong, shellBox, shellNormal, type ShellBox } from "../input/orbit_shell";

/** ⭐ The ray's beside-rays' distance (m): a gap between parts narrower than this is bridged (the painting's cores sit 3 mm apart). */
const RAY_COVER_M = 0.004;
/** ⭐ The shown gizmo's ease to a new point (ms) — a step in depth eased, never a jump; the look point's. */
const GIZMO_TAU_MS = 90;
const LOOK_TAU_MS = 120;
/** ⭐⭐⭐ (2026-11-02) the finger's travel (mm) over which a slide's carry is taken into the orbit's angles, and the way out's camera turn undone. */
export const SHELL_ABSORB_MM = 40;

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

/** ⭐ A ray from `from` along the unit `dir`, `len` long: its first hit on a placed part — how far along, the point, the normal (on its MODEL pose), the part; `null`: none. */
function castFrom(st: SceneState, from: Vec3, dir: Vec3, len: number): { along: number; point: Vec3; normal: Vec3 | null; host: string | null } | null {
  const r = st.scene.pickWithRay(new Ray(new Vector3(from[0], from[1], from[2]), new Vector3(dir[0], dir[1], dir[2]), len), (m) => {
    const id = st.idOf.get(m);
    return id !== undefined && goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) && m.isPickable && m.isEnabled();
  });
  if (!r?.hit || r.pickedPoint === null) return null;
  // ⭐⭐⭐ (2026-11-01) on the part's MODEL pose, not its swaying mesh (`modelHit`)
  const nn = r.getNormal(true);
  const ln = r.getNormal(false, false);
  const m = modelHit(st, r.pickedMesh, [r.pickedPoint.x, r.pickedPoint.y, r.pickedPoint.z], nn ? [nn.x, nn.y, nn.z] : null, ln ? [ln.x, ln.y, ln.z] : null);
  const along = (m.point[0] - from[0]) * dir[0] + (m.point[1] - from[1]) * dir[1] + (m.point[2] - from[2]) * dir[2];
  return { along, point: m.point, normal: m.normal, host: r.pickedMesh ? (st.idOf.get(r.pickedMesh) ?? null) : null };
}

/** ⭐⭐⭐ (2026-11-02) How far past the piece's own radius its footprint looks (m): a protrusion lifts it BEFORE its side meets it (⛔ within its radius only,
 * the side met `Piece44`'s overhang first — the orbit then held there, the ground never seen). */
const FOOT_AHEAD_M = 0.03;
/** ⭐⭐⭐ (2026-11-02) How deep under the shell's offset a ray down its normal looks (m): a recess deeper than this is not under the piece. */
const GROUND_REACH_M = 0.1;

/**
 * ⭐ The ray down the shell's normal `n` from the base point `bW` (world — on the shell at the offset, outside every part), shifted by `o` (square to `n`),
 * `GROUND_REACH_M` below the offset: its first hit, `along` from the base point; `null`: none. ⛔ (built first) from far out along the normal: beyond an
 * edge of the box, where no part fills its corner, it ran on and met a part 20 cm off.
 */
function castDown(st: SceneState, bW: Vec3, n: Vec3, o: Vec3): ReturnType<typeof castFrom> {
  return castFrom(st, [bW[0] + o[0], bW[1] + o[1], bW[2] + o[2]], [-n[0], -n[1], -n[2]], offsetM(st) + GROUND_REACH_M);
}

/**
 * ⭐⭐⭐ (2026-11-02, the shell) THE GIZMO, a readout: where the ray down the shell's normal through the piece's base point first meets a placed part — the
 * outermost of five (`rayOffsets`: a gap narrower than `RAY_COVER_M` bridged), the point on the axis; `null`: nothing under it.
 */
function castGizmo(st: SceneState, bW: Vec3, n: Vec3): GizmoHit | null {
  const key = `${bW.map((x) => x.toFixed(6)).join(",")}|${n.map((x) => x.toFixed(6)).join(",")}`;
  const cached = st.asmRayCache.get(key);
  if (cached !== undefined) return cached;
  let best: { d: number; hit: GizmoHit } | null = null;
  for (const o of rayOffsets(n, RAY_COVER_M)) {
    const h = castDown(st, bW, n, o);
    // ⭐ the centre ray's own point (on the axis); a beside-ray only says how far out the surface is there
    if (h !== null && (best === null || h.along < best.d)) {
      const k = -h.along;
      best = { d: h.along, hit: { point: [bW[0] + n[0] * k, bW[1] + n[1] * k, bW[2] + n[2] * k], normal: h.normal, host: h.host } };
    }
  }
  const hit = best?.hit ?? null;
  if (st.asmRayCache.size > 512) st.asmRayCache.clear();
  st.asmRayCache.set(key, hit);
  return hit;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE SURFACE UNDER THE PIECE'S FOOTPRINT (`footprintHeight`): the outermost part along the shell's normal within the piece's own radius +
 * `FOOT_AHEAD_M` of the base point `bW` — a plane square to the normal (from the centre). A protrusion under any part of the piece, or just ahead of it,
 * lifts it: it rises over it before its side meets it (⛔ the no-man's-land: the orbit stopped against a protrusion's side and the slide could not latch).
 */
function castFootprint(st: SceneState, bW: Vec3, n: Vec3): { p: Vec3; m: Vec3 } | null {
  const a = st.asm!;
  const b = st.greenBox;
  const r0 = b === null ? 0 : b.getBoundingInfo().boundingSphere.radiusWorld;
  const h = footprintHeight(placedParts(st).parts, bW, n, r0 + FOOT_AHEAD_M);
  if (h === null) return null;
  return { p: [bW[0] + n[0] * h - a.centre[0], bW[1] + n[1] * h - a.centre[1], bW[2] + n[2] * h - a.centre[2]], m: n };
}

/** ⭐ The orbit's direction at the orbit place — in the orbit's own frame (re-tilted before a pole: `antiPoleQuat`). */
function dirAt(st: SceneState, yaw: number, v: number): Vec3 {
  return tiltDirW(st.asmOrbit, orbitDir(yaw, v));
}

/** ⭐ The placed parts' world vertices (each a convex body — a box, a frustum), cached for the placed set (they do not move). */
function placedParts(st: SceneState): { readonly key: string; readonly parts: readonly (readonly Vec3[])[] } {
  const ids: string[] = [];
  const meshes: AbstractMesh[] = [];
  for (const [mesh, id] of st.idOf) {
    if (!goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) || !mesh.isEnabled()) continue;
    ids.push(`${id}/${mesh.name}`);
    meshes.push(mesh);
  }
  const key = ids.sort().join("|");
  if (st.asmParts !== null && st.asmParts.key === key) return st.asmParts;
  const parts: Vec3[][] = [];
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
    if (vs.length > 0) parts.push(vs);
  }
  st.asmParts = { key, parts };
  return st.asmParts;
}

/** ⭐⭐⭐ (2026-11-02) The shell's box (`shellBox`), cached for the placed set. */
function shellH(st: SceneState): ShellBox {
  const w = placedParts(st);
  if (st.asmShell !== null && st.asmShell.key === w.key) return st.asmShell.box;
  st.asmShell = { key: w.key, box: shellBox(w.parts, st.asm!.centre) };
  return st.asmShell.box;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE PIECE'S DISTANCE from the shell's surfaces at the approach coordinate `approach`: the approach's (`approachDistance`) + how far the
 * piece's BODY reaches past its resting face's centre toward the parts (`st.asmBodyDepth`, along the shell's normal) — the approach is the body's
 * clearance, whatever way the piece is turned (⛔ the resting face's centre's: a piece turned on its side came 2.5 cm closer than measured, and under
 * `Piece44`'s overhang its side met it — the orbit blocked, the slide not lit).
 */
function pieceDist(st: SceneState, approach: number = st.approach): number {
  return approachDistance(st.cfg, approach) + st.asmBodyDepth;
}

/** ⭐⭐⭐ (2026-11-02) How far the piece's body reaches past its resting face's centre (`anchor`) along `−n` (m, ≥ 0) — its bounding box's corners. */
function bodyDepth(st: SceneState, n: Vec3): number {
  const b = st.greenBox;
  const a = st.pieceAnchor;
  if (b === null || a === null) return 0;
  let e = 0;
  for (const v of b.getBoundingInfo().boundingBox.vectorsWorld) e = Math.max(e, (a[0] - v.x) * n[0] + (a[1] - v.y) * n[1] + (a[2] - v.z) * n[2]);
  return e;
}

/** ⭐⭐⭐ (2026-11-02) The shell's offset (m). */
function offsetM(st: SceneState): number {
  return st.cfg.orbitShellOffsetMm / 1000;
}

/** ⭐⭐⭐ (2026-11-02) The base point (from the centre) and the shell's normal at the orbit's direction `u` and the approach's distance `d` (`basePoint` at `baseLevel`). */
function baseAt(st: SceneState, u: Vec3, d: number = pieceDist(st)): { readonly p: Vec3; readonly n: Vec3 } {
  return basePoint(u, shellH(st), baseLevel(d, offsetM(st)), offsetM(st));
}

/** ⭐⭐⭐ (2026-11-02) How far along the normal from the base point the piece is at the approach's distance `d` (`placeAlong`, the ground `g`'s depth). */
function alongAt(st: SceneState, base: { readonly p: Vec3; readonly n: Vec3 }, d: number, g: SceneState["asmGround"] = st.asmGround): number {
  return placeAlong(d, offsetM(st), g === null ? null : groundDepth(base.p, base.n, g));
}

/** ⭐⭐⭐ (2026-11-02) The piece's place from the centre at the orbit's direction `u` (the carry not included). */
function shellPoint(st: SceneState, u: Vec3, d: number, g: SceneState["asmGround"] = st.asmGround): { readonly x: Vec3; readonly n: Vec3 } {
  const b = baseAt(st, u, d);
  const t = alongAt(st, b, d, g);
  return { x: [b.p[0] + b.n[0] * t, b.p[1] + b.n[1] * t, b.p[2] + b.n[2] * t], n: b.n };
}

/**
 * ⭐⭐⭐ (2026-11-02) The orbit's angles whose shell point is `x` (from the centre) — the base point under it found twice (its normal from the first), the
 * yaw kept nearest `yaw0`; `null`: none.
 */
function anglesFor(st: SceneState, x: Vec3, t: number, n0: Vec3, yaw0: number, d: number = pieceDist(st)): { yaw: number; v: number } | null {
  const h = shellH(st);
  const lv = baseLevel(d, offsetM(st));
  let n = n0;
  let u: Vec3 | null = null;
  for (let k = 0; k < (t === 0 ? 1 : 2); k++) {
    const w = normalize([x[0] - n[0] * t, x[1] - n[1] * t, x[2] - n[2] * t]);
    if (w === null) return null;
    u = chartInverse(w, h, offsetM(st));
    n = basePoint(u, h, lv, offsetM(st)).n;
  }
  return u === null ? null : tiltAngles(tiltDirO(st.asmOrbit, u), yaw0);
}

/** ⭐⭐⭐ (2026-11-02) The piece's place in the WORLD at an orbit place: on the shell (`shellPoint`) + a slide's carry still to be taken in (`st.asmCarry`). */
function worldPlace(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const a = st.asm!;
  const p = shellPoint(st, dirAt(st, yaw, v), pieceDist(st, approach)).x;
  const k = st.asmCarry ?? [0, 0, 0];
  return [a.centre[0] + p[0] + k[0], a.centre[1] + p[1] + k[1], a.centre[2] + p[2] + k[2]];
}

/**
 * ⭐⭐ THE PIECE'S PLACE from the orbit's centre (the shown gizmo) at an orbit place — `ringPlaceNow`'s in this mode, the solver's queries included
 * (`approach`: the state's by default). ⭐⭐⭐ (2026-11-02) On the shell (`worldPlace`) — the gizmo no longer places it.
 */
export function placeOffset(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  ensureAssembly(st);
  const p = worldPlace(st, yaw, v, approach);
  const c = st.orbitCentreM;
  return [p[0] - c.x, p[1] - c.y, p[2] - c.z];
}

/** ⭐ The DRAWN piece's place from the shown gizmo (the eye's spring's angles) — on the shell as the solved one (`placeOffset`). */
export function shownOffset(st: SceneState, yaw: number, v: number): Vec3 {
  return placeOffset(st, yaw, v);
}

/**
 * ⭐ The gizmo face's edge margin (m): `gizmoEdgeMarginMm` in the WORLD — an edge is a place on the assembly, not on the glass (⛔ on the glass at the
 * camera's 7.5 m it was 26 cm: wider than the assembly's half — the face never switched).
 */
function edgeMarginM(st: SceneState): number {
  return st.cfg.gizmoEdgeMarginMm / 1000;
}

/** ⭐⭐⭐ (2026-11-02) Nothing moves the orbit: no finger, no coast, no slide. */
function orbitIdle(st: SceneState): boolean {
  return st.router.size === 0 && !st.orbitInertia.coasting && !st.approachInertia.coasting && st.hover === null;
}

/**
 * ⭐⭐ EVERY FRAME (before the piece is placed): the ground under the piece, the gizmo (its point eased, its face by the edge rule — the quads follow),
 * the centre the orbit reads set to it, the look point eased; the approach's coast; at rest the orbit's frame laid on the screen and the finger's signs
 * read off it; the pace. Under a HOVER the hover owns the gizmo.
 */
export function assemblyFrame(st: SceneState, dtMs: number): void {
  if (!assemblyOn(st) || st.greenBox === null) return;
  ensureAssembly(st);
  st.asmRayCache.clear();
  const a = st.asm!;
  // ⭐ the approach's coast — ⭐⭐ (2026-11-01) under the slide mode too: a flick out leaves it
  if (st.approachInertia.coasting) {
    const s = st.approachInertia.step(dtMs, st.cfg.boxSmoothMs * 4);
    approachMove(st, s.dV);
  }
  if (st.hover !== null) {
    const t = st.centreBlend.targetM;
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = dirAt(st, q.yaw, q.v);
  const d = pieceDist(st);
  const base = baseAt(st, u, d);
  // ⭐ the gizmo and the ground read under the base point at the OFFSET — where the approach lands (far out too)
  const baseR = baseAt(st, u, 0);
  const k0 = st.asmCarry ?? [0, 0, 0];
  const bW: Vec3 = [a.centre[0] + baseR.p[0] + k0[0], a.centre[1] + baseR.p[1] + k0[1], a.centre[2] + baseR.p[2] + k0[2]];
  // ⭐⭐⭐ (2026-11-02) the surface under the piece's footprint, as a plane (`groundAfter`: a change eased, never a jump) — none: the box's own face (the
  // shell alone)
  const g0w = st.asmGround;
  const off = offsetM(st);
  const foot = castFootprint(st, bW, baseR.n) ?? { p: [baseR.p[0] - baseR.n[0] * off, baseR.p[1] - baseR.n[1] * off, baseR.p[2] - baseR.n[2] * off] as Vec3, m: baseR.n };
  const g1w = groundAfter(g0w, foot, baseR.p, baseR.n, dtMs);
  st.asmGround = g1w;
  // ⭐ a ground that takes the piece IN (a recess eased toward): only where the parts allow it — one query (⛔ unchecked, the piece eased into a face
  // it stood against: the orbit then blocked inside the gap kept)
  if (g0w !== null && g1w !== null && st.pieceQ !== null && pieceSolveRuns(st) && alongAt(st, base, d, g1w) < alongAt(st, base, d, g0w) - 1e-6) {
    st.pieceQueries++;
    if (pieceSolverEnv(st).gap(st.pieceQ) < pieceSolveOptions(st).gapM) st.asmGround = g0w;
  }
  // ⭐⭐⭐ (2026-11-02) the GIZMO, a readout: where the ray down the shell's normal under the piece meets the parts
  const hit = castGizmo(st, bW, baseR.n);
  // ⭐ nothing under the piece (beyond an edge of the box, where no part fills its corner): the box's own face under it — the face kept
  st.asmG = hit !== null ? hit.point : [bW[0] - baseR.n[0] * off, bW[1] - baseR.n[1] * off, bW[2] - baseR.n[2] * off];
  // ⭐ the face by the edge rule (the quads read it)
  if (hit !== null && hit.normal !== null && faceSwitches(st.gizmoNormal ?? null, st.asmFacePoint, hit.normal, hit.point, edgeMarginM(st))) {
    if ((st.gizmoHost ?? null) !== hit.host) {
      st.gizmoHost = hit.host;
      st.orientDirty = true;
    }
    const n0 = st.gizmoNormal ?? null;
    if (n0 === null || n0[0] * hit.normal[0] + n0[1] * hit.normal[1] + n0[2] * hit.normal[2] < Math.cos(Math.PI / 180)) st.orientDirty = true;
    st.gizmoNormal = hit.normal;
    st.asmFacePoint = hit.point;
  } else if (hit !== null && st.asmFacePoint === null) st.asmFacePoint = hit.point;
  // ⭐⭐⭐ (2026-11-02, *"avoid gimbal lock"*) the orbit's own frame re-tilted before a pole (`antiPoleQuat`): the angles never reach one
  const pq = st.pieceQ;
  const aq = pq === null ? null : antiPoleQuat(st.asmOrbit, pq.yaw, pq.v);
  if (aq !== null) rebaseOrbit(st, aq);
  const g0 = st.asmG ?? st.asmGizmo ?? a.centre;
  // ⭐ the shown gizmo eased to its point; the orbit's centre IS it
  st.asmGizmo = st.asmGizmo === null ? [g0[0], g0[1], g0[2]] : easePoint(st.asmGizmo, g0, dtMs, GIZMO_TAU_MS);
  st.asmGizmoAt = [g0[0], g0[1], g0[2]]; // ⭐⭐⭐ (2026-11-02) where the ring is drawn: the vertex both lines go through (`gizmoShownAt`)
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // ⭐ the look point: the centre far out, the gizmo close in
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM, false);
  const g = st.asmGizmo;
  const lt: Vec3 = [a.centre[0] + (g[0] - a.centre[0]) * w, a.centre[1] + (g[1] - a.centre[1]) * w, a.centre[2] + (g[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  // ⭐ the body's reach along this frame's normal — the next frame's placement reads it (`pieceDist`)
  st.asmBodyDepth = bodyDepth(st, baseR.n);
  sectionLinesFrame(st, baseR.n);
}

/**
 * ⭐⭐⭐ (2026-11-02, *"Build the shell"*) — **A DRAG'S STEP ON THE SHELL**: the finger's `dxMm` along the screen's right, its `dyMm` (down the glass) along
 * its up — the camera's as last drawn — at `radPerMm` × (the assembly's half-size + the approach's distance) a millimetre, laid along the shell at the
 * piece (its normal's part dropped); the orbit's angles solved for the point reached (the ray from the centre through it). The input decides the way the
 * piece goes; the geometry only how far out it is. `null`: no camera yet.
 */
export function asmDragStep(st: SceneState, dxMm: number, dyMm: number, radPerMm: number): { dYaw: number; dV: number } | null {
  const cp = st.cameraPrev;
  if (cp === null || cp === undefined || st.asm === null || (dxMm === 0 && dyMm === 0)) return null;
  const q = { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const d = pieceDist(st);
  const b = baseAt(st, dirAt(st, q.yaw, q.v), d);
  const t = alongAt(st, b, d);
  const right = normalize(cross(cp.dir, cp.up));
  if (right === null) return null;
  const k = radPerMm * (st.asm.radius + d);
  const step = alongSurface([(right[0] * dxMm + cp.up[0] * dyMm) * k, (right[1] * dxMm + cp.up[1] * dyMm) * k, (right[2] * dxMm + cp.up[2] * dyMm) * k], b.n);
  const x: Vec3 = [b.p[0] + b.n[0] * t + step[0], b.p[1] + b.n[1] * t + step[1], b.p[2] + b.n[2] * t + step[2]];
  const to = anglesFor(st, x, t, b.n, q.yaw);
  return to === null ? null : { dYaw: to.yaw - q.yaw, dV: to.v - q.v };
}

/**
 * ⭐⭐⭐ (2026-11-02) A FINGER'S TRAVEL (`travelMm`, an orbit's or the approach's): a slide's carry taken into the orbit's angles by its share
 * (`SHELL_ABSORB_MM`) — the piece stays where it is, its base point (the camera's view) comes under it; what is left along the shell's normal eased out —
 * and the way out's camera turn undone by the same share.
 */
export function asmTravelStep(st: SceneState, travelMm: number): void {
  if (!assemblyOn(st) || !(travelMm > 0) || st.hover !== null) return;
  const k = Math.min(1, travelMm / SHELL_ABSORB_MM);
  const tn = st.asmCamTurn;
  if (tn !== null) {
    const n = qSlerp(tn, IDENTITY, k);
    st.asmCamTurn = qAngle(n) < 1e-4 ? null : n;
  }
  const carry = st.asmCarry;
  const q = st.pieceQ;
  if (carry === null || q === null || st.asm === null) return;
  const d = pieceDist(st);
  const s0 = shellPoint(st, dirAt(st, q.yaw, q.v), d);
  const b0 = baseAt(st, dirAt(st, q.yaw, q.v), d);
  const p: Vec3 = [s0.x[0] + carry[0], s0.x[1] + carry[1], s0.x[2] + carry[2]];
  const x: Vec3 = [s0.x[0] + carry[0] * k, s0.x[1] + carry[1] * k, s0.x[2] + carry[2] * k];
  const t1 = anglesFor(st, x, alongAt(st, b0, d), s0.n, q.yaw);
  if (t1 === null) return;
  shiftOrbit(st, t1.yaw - q.yaw, t1.v - q.v);
  const s1 = shellPoint(st, dirAt(st, t1.yaw, t1.v), d);
  // what is left (the piece where it was): its part along the normal eased out by the share
  const left: Vec3 = [p[0] - s1.x[0], p[1] - s1.x[1], p[2] - s1.x[2]];
  const along = dot(left, s1.n);
  const rest: Vec3 = [left[0] - s1.n[0] * along * k, left[1] - s1.n[1] * along * k, left[2] - s1.n[2] * along * k];
  st.asmCarry = Math.hypot(rest[0], rest[1], rest[2]) < 1e-4 ? null : rest;
}

/** ⭐ The orbit's angles shifted by (`dYaw`, `dV`) — its target, the solved place, the eye's spring with them (the camera follows on its own lag). */
function shiftOrbit(st: SceneState, dYaw: number, dV: number): void {
  const q = st.pieceQ;
  if (q !== null) st.pieceQ = { ...q, yaw: q.yaw + dYaw, v: q.v + dV };
  st.orbit.reset(st.orbit.yaw + dYaw, st.orbit.elevation + dV);
  if (st.orbitRawPrev !== null) st.orbitRawPrev = { yaw: st.orbitRawPrev.yaw + dYaw, v: st.orbitRawPrev.v + dV };
  if (st.orbitUserV !== null) st.orbitUserV += dV;
  const sp = st.boxSpring;
  if (sp !== null) st.boxSpring = { ...sp, at: { ...sp.at, yaw: sp.at.yaw + dYaw, v: sp.at.v + dV } };
}

/** ⭐ The lines' samples each side of the gizmo, and how far the gizmo moves across a line before it is recast (m). */
const LINE_HALF = 32;
const LINE_RECAST_M = 0.002;
/** ⭐ The lines lifted off the surface toward their ray's origin (m) — never in it. */
const SECTION_LIFT_M = 0.002;

/** ⭐ (2026-11-02) the gizmo's vertex `i` joined to its neighbours `prev` / `next` (`gizmoJoins`: the nearer one at least). */
function around(pts: readonly (Vector3 | null)[], i: number, prev: number, next: number, spacing: number): [boolean, boolean] {
  const g = pts[i];
  const a = prev >= 0 ? (pts[prev] ?? null) : null;
  const b = next < pts.length ? (pts[next] ?? null) : null;
  if (g === null || g === undefined) return [false, false];
  const d = (p: Vector3 | null): number => (p === null ? Infinity : Vector3.Distance(g, p));
  const v = (p: Vector3): Vec3 => [p.x, p.y, p.z];
  const j = gizmoJoins(a !== null && joins(v(g), v(a), spacing), b !== null && joins(v(g), v(b), spacing), d(a), d(b));
  return [j[0] && a !== null, j[1] && b !== null];
}

/** ⭐ A line's samples: from the base point `p0` (from the centre) along `axis` both ways on the shell, `step` apart — each dropped down the normal. */
function lineSamples(st: SceneState, p0: Vec3, axis: Vec3, step: number): { params: number[]; pts: (Vector3 | null)[] } {
  const a = st.asm!;
  const h = shellH(st);
  const off = offsetM(st);
  const params: number[] = [];
  const pts: (Vector3 | null)[] = [];
  const drop = (p: Vec3, n: Vec3): Vector3 | null => {
    const bW: Vec3 = [a.centre[0] + p[0], a.centre[1] + p[1], a.centre[2] + p[2]];
    const hh = castDown(st, bW, n, [0, 0, 0]);
    if (hh === null) return null;
    return new Vector3(hh.point[0] + n[0] * SECTION_LIFT_M, hh.point[1] + n[1] * SECTION_LIFT_M, hh.point[2] + n[2] * SECTION_LIFT_M);
  };
  const side = (sg: 1 | -1): { params: number[]; pts: (Vector3 | null)[] } => {
    const out = { params: [] as number[], pts: [] as (Vector3 | null)[] };
    let p = p0;
    let n = shellNormal(p, h) ?? normalize(p) ?? [0, 0, 1];
    for (let k = 1; k <= LINE_HALF; k++) {
      const dir = normalize(alongSurface([axis[0] * sg, axis[1] * sg, axis[2] * sg], n));
      if (dir === null) break;
      const w = normalize([p[0] + dir[0] * step, p[1] + dir[1] * step, p[2] + dir[2] * step]);
      if (w === null) break;
      const b = basePoint(chartInverse(w, h, off), h, off);
      p = b.p;
      n = b.n;
      out.params.push(sg * k * step);
      out.pts.push(drop(p, n));
    }
    return out;
  };
  const back = side(-1);
  const fwd = side(1);
  for (let k = back.params.length - 1; k >= 0; k--) {
    params.push(back.params[k]!);
    pts.push(back.pts[k]!);
  }
  params.push(0);
  pts.push(drop(p0, shellNormal(p0, h) ?? normalize(p0) ?? [0, 0, 1]));
  for (let k = 0; k < fwd.params.length; k++) {
    params.push(fwd.params[k]!);
    pts.push(fwd.pts[k]!);
  }
  return { params, pts };
}

/**
 * ⭐⭐ (the optional) THE LINES DRAWN — ⭐⭐⭐ (2026-11-02, the shell) the gizmo's PATHS, a readout: the RED one where a dy takes it (along the screen's up
 * on the shell), the GREEN one where a dx does (along its right) — marched from the gizmo's base point both ways, each sample dropped down the shell's
 * normal onto the parts; the gizmo's exact point a vertex of both, every frame. A line recast only when the gizmo moves ACROSS it (`LINE_RECAST_M`: the red
 * by a dx, the green by a dy) or the screen's axes turn. ONE mesh of a fixed vertex count, updated in place (a segment not drawn: collapsed). Hidden
 * under a hover, or off.
 */
function sectionLinesFrame(st: SceneState, n: Vec3): void {
  const g = st.asmG;
  const cp = st.cameraPrev;
  const q = st.pieceQ;
  const show = st.cfg.sectionLines === 1 && st.hover === null && g !== null && cp !== null && cp !== undefined && q !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const h = shellH(st);
  const k0 = st.asmCarry ?? [0, 0, 0];
  const b0 = baseAt(st, dirAt(st, q.yaw, q.v), 0).p; // on the shell at the offset — the lines are marched there
  const p0: Vec3 = [b0[0] + k0[0], b0[1] + k0[1], b0[2] + k0[2]];
  const up = normalize(alongSurface(cp.up, n)) ?? cp.up;
  const right = normalize(alongSurface(cross(cp.dir, cp.up), n)) ?? cross(cp.dir, cp.up);
  const parts = placedParts(st).key;
  const step = (2 * Math.PI * (Math.max(-h.lo[0], h.hi[0], -h.lo[1], h.hi[1], -h.lo[2], h.hi[2]) + offsetM(st))) / (2 * LINE_HALF);
  const stale = (c: SceneState["asmRedCache"], axis: Vec3, across: Vec3): boolean => {
    if (c === null || c.key !== parts) return true;
    const o = c.origin;
    if (dot(c.axis, axis) < Math.cos((0.5 * Math.PI) / 180)) return true;
    return Math.abs((p0[0] - o[0]) * across[0] + (p0[1] - o[1]) * across[1] + (p0[2] - o[2]) * across[2]) > LINE_RECAST_M;
  };
  if (stale(st.asmRedCache, up, right)) st.asmRedCache = { key: parts, origin: p0, axis: up, ...lineSamples(st, p0, up, step) };
  if (stale(st.asmGreenCache, right, up)) st.asmGreenCache = { key: parts, origin: p0, axis: right, ...lineSamples(st, p0, right, step) };
  // ⭐⭐⭐ the gizmo's EXACT point — inserted in both: the ring is a vertex of each line, at every frame
  const gv = new Vector3(g[0] + n[0] * SECTION_LIFT_M, g[1] + n[1] * SECTION_LIFT_M, g[2] + n[2] * SECTION_LIFT_M);
  const red = st.asmRedCache!;
  const green = st.asmGreenCache!;
  const key = `${parts}|${red.origin.join(",")}|${green.origin.join(",")}|${gv.x.toFixed(6)},${gv.y.toFixed(6)},${gv.z.toFixed(6)}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const v3 = (p: Vector3): Vec3 => [p.x, p.y, p.z];
  const lines: Vector3[][] = [];
  const open = (c: NonNullable<SceneState["asmRedCache"]>): void => {
    const pts: (Vector3 | null)[] = [...c.pts];
    const param = (p0[0] - c.origin[0]) * c.axis[0] + (p0[1] - c.origin[1]) * c.axis[1] + (p0[2] - c.origin[2]) * c.axis[2];
    const i = insertIndex(c.params, param);
    pts.splice(i, 0, gv);
    const j = around(pts, i, i - 1, i + 1, step);
    for (let k = 0; k < 2 * LINE_HALF + 1; k++) {
      const q0 = pts[k] ?? null;
      const q1 = pts[k + 1] ?? null;
      const forced = k + 1 === i ? j[0] : k === i ? j[1] : null;
      lines.push(q0 !== null && q1 !== null && (forced ?? joins(v3(q0), v3(q1), step)) ? [q0, q1] : [gv, gv]);
    }
  };
  open(green);
  open(red);
  if (st.asmSectionLines === null) {
    const colours = lines.map((_, i) => (i < 2 * LINE_HALF + 1 ? [new Color4(0.35, 0.8, 0.35, 1), new Color4(0.35, 0.8, 0.35, 1)] : [new Color4(0.9, 0.25, 0.2, 1), new Color4(0.9, 0.25, 0.2, 1)]));
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
  asmTravelStep(st, Math.abs(dyMm)); // ⭐⭐⭐ (2026-11-02) a slide's carry and the way out's turn taken in with the travel
  st.hudDirty = true;
}

/** ⭐ The approach's input ends: its coast starts. */
export function approachRelease(st: SceneState): void {
  st.approachInertia.release(performance.now());
}

/**
 * ⭐ THE CAMERA'S FRAME — ⭐⭐⭐ (2026-11-02, the shell) its direction from the centre along the piece's (far out) turned to the shell's NORMAL there
 * (close in, by the look's share — the camera square to the face it looks at, never grazing it); its up CARRIED from the last frame with the view
 * (`carryUp` — no roll while anything moves: over the top the view goes on as a loop), levelled to gravity at rest (`levelUp`, `easeUp`); the owner's
 * offsets about that up (`offsetAbout`); a way out's turn still left on it (`st.asmCamTurn`).
 */
export function assemblyCameraFrame(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset, dtMs: number = 0): RigCameraFrame {
  ensureAssembly(st);
  const u = dirAt(st, cam.yaw, cam.v);
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  const d = pieceDist(st);
  // ⭐ far out from the centre to the piece; close in the shell's normal — the camera square to the face it looks at, never grazing it
  const sp = shellPoint(st, u, d);
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM, false);
  const dir0 = slerpDir(normalize(sp.x) ?? sp.n, sp.n, w);
  const pu = st.asmBaseUp;
  const pd = st.asmBaseDir;
  let base = pu !== null && pd !== null ? carryUp(pu, pd, dir0) : (levelUp(dir0) ?? carryUp([0, 0, 1], [0, 1, 0], dir0));
  const lv = levelUp(dir0);
  if (lv !== null && dtMs > 0 && orbitIdle(st)) base = easeUp(base, lv, dir0, dtMs);
  const f = offsetAbout(dir0, base, o.yawRad, o.pitchRad);
  // ⭐ the way out's turn by the look's share: whole while the camera looks at the piece, none far out (⛔ whole, the camera looked at the centre from the
  // slide's direction: the piece off the screen)
  const t: Quat = st.asmCamTurn === null ? IDENTITY : qSlerp(IDENTITY, st.asmCamTurn, w);
  return { dir: qRotate(t, f.dir), up: qRotate(t, f.up), base, baseDir: dir0 };
}

/** ⭐ The unit `a` turned toward the unit `b` by `w` (0 … 1) of the angle between them. */
function slerpDir(a: Vec3, b: Vec3, w: number): Vec3 {
  const c = Math.max(-1, Math.min(1, dot(a, b)));
  const ang = Math.acos(c);
  if (ang < 1e-6 || w <= 0) return a;
  if (w >= 1) return b;
  const s = Math.sin(ang);
  const k0 = Math.sin((1 - w) * ang) / s;
  const k1 = Math.sin(w * ang) / s;
  return normalize([a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1]) ?? a;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE ORBIT'S OWN FRAME RE-BASED (`qNew` — turned before a pole): its angles re-solved on the piece's direction as it is
 * (`tiltAngles` — nothing moves), the eye's spring, the camera's lag and its leash each on its OWN direction (⛔ snapped to the solved one, the drawn
 * piece jumped by the eye's lag — 0.9 m far out; the leash dropped, the camera — 436 px).
 */
function rebaseOrbit(st: SceneState, qNew: Quat): void {
  const p = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation, zoom: 1 };
  const qOld = st.asmOrbit;
  const uW = tiltDirW(qOld, orbitDir(p.yaw, p.v));
  const carry = (y: number, v: number): { yaw: number; v: number } | null => tiltAngles(tiltDirO(qNew, tiltDirW(qOld, orbitDir(y, v))), y);
  // a velocity carried by two nearby places (⛔ zeroed, the eye's spring stopped dead: the drawn piece fell behind — 40 px, measured)
  const carryVel = (y: number, v: number, vy: number, vv: number): { vy: number; vv: number } => {
    const h = 1e-3;
    const a = carry(y, v);
    const b = carry(y + vy * h, v + vv * h);
    if (a === null || b === null) return { vy: 0, vv: 0 };
    return { vy: Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw)) / h, vv: (b.v - a.v) / h };
  };
  const t = tiltAngles(tiltDirO(qNew, uW), p.yaw);
  const sp = st.boxSpring;
  const spT = sp === null ? null : carry(sp.at.yaw, sp.at.v);
  const lag = st.cameraLagged;
  const lagT = lag === null ? null : carry(lag.yaw, lag.v);
  const co = st.cameraOrbit;
  const coT = co === null ? null : carry(co.cam.yaw, co.cam.v);
  st.asmOrbit = qNew;
  if (t === null) return;
  st.pieceQ = { ...p, yaw: t.yaw, v: t.v };
  st.orbit.reset(t.yaw, t.v);
  st.orbitInertia.stop();
  st.orbitUserV = t.v;
  st.orbitRawPrev = { yaw: t.yaw, v: t.v };
  if (sp !== null && spT !== null) {
    const vel = carryVel(sp.at.yaw, sp.at.v, sp.velYaw, sp.velV);
    st.boxSpring = { at: { yaw: spT.yaw, v: spT.v, zoom: sp.at.zoom }, velYaw: vel.vy, velV: vel.vv, velLnZoom: sp.velLnZoom };
  }
  st.cameraOrbit = co === null || coT === null ? null : cameraOrbitAt({ ...co.cam, yaw: coT.yaw, v: coT.v }, performance.now(), st.cfg);
  st.cameraLagged = lagT;
}
