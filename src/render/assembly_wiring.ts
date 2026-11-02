/**
 * ⭐⭐⭐ prototype — **THE ORBIT AROUND THE ASSEMBLY, WIRED** (2026-10-28; the rules are `input/assembly_orbit.ts`'s). On while `orbitMode` is 0 (1: the
 * gizmo's 2D curve as built to 2026-10-25, kept whole). The centre the rest of the orbit reads (`orbitCentreM` — the quads, the hover, the markers) IS the
 * GIZMO, moved here every frame: a CARRIER on the convex hull of the yaw plane's section, DROPPED onto the real surface (`carrierFrame`, the rules
 * `input/section_hull.ts`'s; first placed from where the ray from the piece toward the fixed CENTRE, `st.asm`, meets a placed part — `castGizmo` — and
 * again after a lock or a hover), eased over a step; LOCKED close in; the sections drawn (`sectionLinesFrame`: one mesh, updated in place). The piece's place from it (`placeOffset`, read by `ringPlaceNow` — the solver's queries too) is its direction × the
 * approach's distance; the approach (two fingers' dy, Shift + drag's) checked against the parts (`approachMove`), with its own coast. The camera's frame
 * (`assemblyCameraFrame`), its look point (`st.asmLook`: the centre far out, the gizmo close in). ⛔ No rule here.
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { angleTo, lockCone, approachDistance, approachStep, coneClamp, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, nextLock, offsetAbout, offsetFrame, approachOfDistance, gizmoDepthStep, modelNormal, orbitDir, pitchOfV, rayOffsets, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { chainAt, chainStep, dropRay, edgeKind, edgeNormal, faceTurnedAway, facingChain, joins, nearestOfKind, fromPlane, greenDrop, greenFaces, greenNormal, greenPace, greenPoints, hull2, loopOf, loopStep, nearestOnChain, redOrigin, gizmoJoins, insertIndex, sectionFixed, sectionGreenKey, sectionPoints, sectionRedKey, toPlane, turnAbout, type EdgeKind, type SectionChain, type SectionRay } from "../input/section_hull";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import { cameraOrbitAt, type CameraAngleOffset, type OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import { hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { slideArmedAfter } from "../input/hover";
import type { Vec3 } from "../core/vec";
import { worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { antiPoleQuat, orbitDirSteps, screenUpTarget, TILT_HOLD_SHARE, UP_FLIP_RAD, upTurn, tiltAngles, tiltDirO, tiltDirW, tiltSignAfter, tiltPointO, tiltPointW, tiltQuat, tiltRollShare, tiltRollUp, tiltWanted, type TiltKind } from "../input/orbit_tilt";

/** ⭐ The ray's beside-rays' distance (m): a gap between parts narrower than this is bridged (the painting's cores sit 3 mm apart). */
const RAY_COVER_M = 0.004;
/** ⭐ The shown gizmo's ease to a new point (ms) — a step in depth eased, never a jump; the look point's. */
const GIZMO_TAU_MS = 90;
/** ⭐⭐⭐ (2026-11-02) a gizmo's step along the piece's direction over this in one frame is a DISCONTINUITY (m) — taken into the approach (`gizmoDepthStep`). */
const GIZMO_DEPTH_STEP_M = 0.005;
const LOOK_TAU_MS = 120;

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

/** ⭐ Where the ray from outside along `−u` toward the centre first meets a placed part — the outermost of the five (`rayOffsets`); `null`: nothing. */
function castGizmo(st: SceneState, u: Vec3): GizmoHit | null {
  const a = st.asm!;
  const key = `${u[0].toFixed(7)},${u[1].toFixed(7)},${u[2].toFixed(7)}`;
  const cached = st.asmRayCache.get(key);
  if (cached !== undefined) return cached;
  const out = a.radius * 2 + 1;
  let best: { d: number; hit: GizmoHit } | null = null;
  for (const o of rayOffsets(u, RAY_COVER_M)) {
    const from = new Vector3(a.centre[0] + u[0] * out + o[0], a.centre[1] + u[1] * out + o[1], a.centre[2] + u[2] * out + o[2]);
    const r = st.scene.pickWithRay(new Ray(from, new Vector3(-u[0], -u[1], -u[2]), out + a.radius * 2), (m) => {
      const id = st.idOf.get(m);
      return id !== undefined && goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) && m.isPickable && m.isEnabled();
    });
    if (r?.hit && r.pickedPoint !== null) {
      // ⭐⭐⭐ (2026-11-01) on the part's MODEL pose, not its swaying mesh (`modelHit`)
      const nn = r.getNormal(true);
      const ln = r.getNormal(false, false);
      const m = modelHit(st, r.pickedMesh, [r.pickedPoint.x, r.pickedPoint.y, r.pickedPoint.z], nn ? [nn.x, nn.y, nn.z] : null, ln ? [ln.x, ln.y, ln.z] : null);
      // ⭐ the centre ray's own point (on the ray); a beside-ray only says how far out the surface is there
      const along = (from.x - m.point[0]) * u[0] + (from.y - m.point[1]) * u[1] + (from.z - m.point[2]) * u[2];
      if (best === null || along < best.d) {
        const point: Vec3 = [a.centre[0] + u[0] * (out - along), a.centre[1] + u[1] * (out - along), a.centre[2] + u[2] * (out - along)];
        best = { d: along, hit: { point, normal: m.normal, host: r.pickedMesh ? (st.idOf.get(r.pickedMesh) ?? null) : null } };
      }
    }
  }
  const hit = best?.hit ?? null;
  if (st.asmRayCache.size > 512) st.asmRayCache.clear();
  st.asmRayCache.set(key, hit);
  return hit;
}

/** ⭐ The piece's direction at the orbit place — locked, kept in the face's cone (`coneClamp`). */
function dirAt(st: SceneState, yaw: number, v: number): Vec3 {
  const u = tiltDirW(st.asmOrbit, orbitDir(yaw, v)); // ⭐⭐⭐ (2026-11-02) the orbit's own frame (the face's at a switch, re-tilted before a pole — `input/orbit_tilt.ts`)
  const n = st.asmLocked && st.asmLock !== null ? st.asmLock.normal : null;
  return n === null ? u : coneClamp(u, n, st.asmLock!.cone ?? undefined);
}

/**
 * ⭐ The gizmo a query of the piece's place reads: locked, the locked point; else the CARRIER's (`st.asmG`, moved once a frame — ⛔ 2026-10-28 the ray
 * toward the centre for each direction); none yet, the ray's.
 */
function gizmoFor(st: SceneState, u: Vec3): Vec3 {
  if (st.asmLocked && st.asmLock !== null) return st.asmLock.point;
  if (st.asmG !== null) return st.asmG;
  const h = castGizmo(st, u);
  if (h !== null) return h.point;
  const g = st.asmGizmo ?? st.centreBlend.targetM;
  return [g[0], g[1], g[2]];
}

/** ⭐ A ray cast against the PLACED parts: its first hit — point, normal, part — or `null`. */
function castRay(st: SceneState, r: SectionRay | null): GizmoHit | null {
  if (r === null) return null;
  // ⭐⭐⭐ (2026-11-02) the ray is the orbit frame's (the sections'): into the world first
  const o = tiltPointW(st.asmTilt.q, st.asm!.centre, r.origin);
  const d = tiltDirW(st.asmTilt.q, r.dir);
  const hit = st.scene.pickWithRay(new Ray(new Vector3(...o), new Vector3(...d), r.length), (m) => {
    const id = st.idOf.get(m);
    return id !== undefined && goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) && m.isPickable && m.isEnabled();
  });
  if (!hit?.hit || hit.pickedPoint === null) return null;
  const nn = hit.getNormal(true);
  const ln = hit.getNormal(false, false);
  // ⭐⭐⭐ (2026-11-01) on the part's MODEL pose, not its swaying mesh (`modelHit`)
  const m = modelHit(st, hit.pickedMesh, [hit.pickedPoint.x, hit.pickedPoint.y, hit.pickedPoint.z], nn ? [nn.x, nn.y, nn.z] : null, ln ? [ln.x, ln.y, ln.z] : null);
  return { point: m.point, normal: m.normal, host: hit.pickedMesh ? (st.idOf.get(hit.pickedMesh) ?? null) : null };
}

/** ⭐ The placed parts' world vertices (each a convex body — a box, a frustum), cached for the placed set (they do not move). */
function placedParts(st: SceneState): { readonly key: string; readonly parts: readonly (readonly Vec3[])[] } {
  const ids: string[] = [];
  const meshes: import("@babylonjs/core/Meshes/abstractMesh").AbstractMesh[] = [];
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

/** ⭐⭐⭐ (2026-11-02) The placed parts' vertices IN THE ORBIT'S FRAME (`tiltPointO`), cached per placed set and tilt — what the sections read. */
function partsO(st: SceneState): { readonly key: string; readonly parts: readonly (readonly Vec3[])[] } {
  const w = placedParts(st);
  const q = st.asmTilt.q;
  const key = `${w.key}@${q.map((x) => x.toFixed(9)).join(",")}`;
  if (st.asmPartsO !== null && st.asmPartsO.key === key) return st.asmPartsO;
  const c = st.asm!.centre;
  st.asmPartsO = { key, parts: st.asmTilt.kind === 0 ? w.parts : w.parts.map((vs) => vs.map((v) => tiltPointO(q, c, v))) };
  return st.asmPartsO;
}

/** ⭐ The facing half of the hull of the RED section — the vertical plane at `yaw` through `origin` (`redOrigin`) — cached for the plane and the placed set; `null`: none. */
function chainFor(st: SceneState, yaw: number, origin: Vec3): SectionChain | null {
  const parts = partsO(st);
  const key = `${parts.key}#${yaw.toFixed(9)}#${origin[0].toFixed(7)},${origin[2].toFixed(7)}`;
  if (st.asmChain !== null && st.asmChain.key === key) return st.asmChain.chain;
  const chain = facingChain(hull2(sectionPoints(parts.parts, origin, yaw)));
  st.asmChain = { key, chain };
  return chain;
}

/** ⭐ The GREEN loop — the hull of the horizontal cut at height `y` (`greenPoints`, `loopOf`) — cached for the height and the placed set; `null`: none. */
function loopFor(st: SceneState, y: number): SectionChain | null {
  const parts = partsO(st);
  const key = `${parts.key}#${y.toFixed(7)}`;
  if (st.asmLoop !== null && st.asmLoop.key === key) return st.asmLoop.loop;
  const loop = loopOf(hull2(greenPoints(parts.parts, y)));
  st.asmLoop = { key, loop };
  return loop;
}

type Carrier = NonNullable<SceneState["asmCarrier"]>;

/** ⭐ The carrier at arc length `s` of the red `chain` (the plane at `yaw` through `origin`): its point, its edge's kind, its drop. */
function redAt(st: SceneState, yaw: number, chain: SectionChain, origin: Vec3, s: number, want?: EdgeKind): Carrier {
  const at = chainAt(chain, s);
  let kind = edgeKind(edgeNormal(chain, at.edge));
  // ⭐ at a corner shared with an edge of the kind asked for (a top's edge, its side below it), that kind (⛔ the corner read as the side's: off the top)
  if (want !== undefined && kind !== want && at.edge + 1 < chain.pts.length - 1 && Math.abs(s - chain.cum[at.edge + 1]!) < 1e-9 && edgeKind(edgeNormal(chain, at.edge + 1)) === want) kind = want;
  return { w: fromPlane(at.p, origin, yaw), kind, s: Math.min(chain.total, Math.max(0, s)), chain, origin, drop: dropRay(at.p, kind, origin, yaw, st.asm!.radius * 2 + 1) };
}

/** ⭐ The point `w` brought onto the RED section through it (the plane at `yaw` through `w`) — onto its edges of `kind` when given (a top kept on a top); `null`: no section there. */
function onRed(st: SceneState, yaw: number, w: Vec3, kind?: EdgeKind): Carrier | null {
  const origin = redOrigin(w, st.asm!.centre, yaw);
  const chain = chainFor(st, yaw, origin);
  if (chain === null) return null;
  const p = toPlane(w, origin, yaw);
  return redAt(st, yaw, chain, origin, kind === undefined ? nearestOnChain(chain, p) : nearestOfKind(chain, p, kind), kind);
}

/** ⭐ The carrier carried round the GREEN loop at its height by `dYaw` (`greenPace` per radian, never into an edge turned away), its red section the plane through it. */
function onGreen(st: SceneState, c: Carrier, yaw: number, pitch: number, dYaw: number): Carrier | null {
  const loop = loopFor(st, c.w[1]);
  if (loop === null) return null;
  const s0 = nearestOnChain(loop, [c.w[0], c.w[2]]);
  const s1 = loopStep(loop, s0, greenPace(loop) * dYaw, (i) => greenFaces(greenNormal(loop, i), yaw, pitch));
  const at = chainAt(loop, s1);
  const w: Vec3 = [at.p[0], c.w[1], at.p[1]];
  const red = onRed(st, yaw, w);
  return { ...(red ?? c), w, kind: "SIDE", drop: greenDrop(w, greenNormal(loop, at.edge), st.asm!.radius * 2 + 1) };
}

/**
 * ⭐⭐⭐ (2026-10-29) THE CARRIER'S FRAME (unlocked). The start, or after a lock or a hover: from the gizmo as it was, brought onto the red section through
 * it. dx (`dYaw`) — ⭐ BY DISTANCE (the owner: *"Can't the dx replicate what dy does"*; ⛔ the yaw plane's cut through the centre: 2 cm × tan(yaw) along
 * the painting's face): on a SIDE round the GREEN loop at its height (`onGreen`), on a TOP / BOTTOM turned about the axis at its distance (`turnAbout`)
 * and brought onto the red section there; the RED section is the vertical plane along the heading THROUGH the carrier (`redOrigin`). dy (`dPitch`): slid
 * along that red chain (`chainStep` — the assembly's half-size per radian, clamped at its bottom and top centres, never into an edge turned away). Then
 * DROPPED onto the real surface (the green drop after a dx on a side, the red one else). A drop that misses or lands on a face turned away from the
 * piece leaves the gizmo where it was (the carrier goes on). Returns the hit (`null`: the gizmo held).
 */
function carrierFrame(st: SceneState, yaw: number, v: number, dYaw: number, dPitch: number, u: Vec3): GizmoHit | null {
  const a = st.asm!;
  const pitch = pitchOfV(v);
  let c = st.asmCarrier;
  if (c === null) {
    const from = st.asmG ?? castGizmo(st, u)?.point ?? null;
    if (from === null) return null;
    c = onRed(st, yaw, tiltPointO(st.asmTilt.q, a.centre, from)); // ⭐ (2026-11-02) into the orbit's frame
    if (c === null) return castGizmo(st, u);
  }
  let green = false;
  if (dYaw !== 0 && st.asmCarrier !== null) {
    const next = c.kind === "SIDE" ? onGreen(st, c, yaw, pitch, dYaw) : onRed(st, yaw, turnAbout(c.w, a.centre, dYaw), c.kind);
    green = next !== null && c.kind === "SIDE";
    c = next ?? c;
  }
  if (dPitch !== 0) {
    c = redAt(st, yaw, c.chain, c.origin, chainStep(c.chain, c.s, a.radius * dPitch, pitch));
    green = false;
  }
  st.asmCarrier = c;
  const h = castRay(st, c.drop);
  if (h === null) return null;
  if (faceTurnedAway(h.normal, u)) {
    st.lastVerdict = "orbit: the gizmo's drop lands on a face turned away from the piece — held";
    return null;
  }
  // ⭐ after a dx on a side, the red section through where the gizmo LANDED (⛔ through the carrier: at a corner the green drop lands aside of it — 10 mm off
  // the red plane, measured); the carrier itself stays on the green loop
  if (green) {
    const red = onRed(st, yaw, tiltPointO(st.asmTilt.q, a.centre, h.point));
    if (red !== null) st.asmCarrier = { ...c, chain: red.chain, origin: red.origin, s: red.s };
  }
  return h;
}

/**
 * ⭐⭐ THE PIECE'S PLACE from the orbit's centre (the shown gizmo) at an orbit place — `ringPlaceNow`'s in this mode, the solver's queries included: its
 * own gizmo for that direction + the direction × the approach's distance (`approach`: the state's by default).
 */
export function placeOffset(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const u = dirAt(st, yaw, v);
  const g = gizmoFor(st, u);
  const d = approachDistance(st.cfg, approach);
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
  st.asmRayCache.clear();
  const a = st.asm!;
  // ⭐ the approach's coast — ⭐⭐ (2026-11-01) under the slide mode too: a flick out leaves it
  if (st.approachInertia.coasting) {
    const s = st.approachInertia.step(dtMs, st.cfg.boxSmoothMs * 4);
    approachMove(st, s.dV);
  }
  if (st.hover !== null) {
    const t = st.centreBlend.targetM;
    st.asmLocked = true;
    st.asmCarrier = null; // ⭐ (2026-10-29) back out, the carrier found again from the gizmo, in the yaw plane as it is then
    st.asmShown = null;
    const n = st.gizmoNormal ?? null;
    const q0 = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
    st.asmLock = { point: [t[0], t[1], t[2]], normal: n, host: st.gizmoHost ?? null, cone: n === null ? null : lockCone(st.asmLock?.cone ?? null, angleTo(tiltDirW(st.asmOrbit, orbitDir(q0.yaw, q0.v)), n)) };
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    return;
  }
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = tiltDirW(st.asmOrbit, orbitDir(q.yaw, q.v));
  let d = approachDistance(st.cfg, st.approach);
  // ⭐⭐⭐ (2026-10-29) the gizmo from its CARRIER on the sections' hulls (`carrierFrame`): the yaw's and the pitch's steps since the last frame — ⭐⭐⭐
  // (2026-11-02) read in the FACE's frame (the sections'), from the piece's direction (the orbit's own frame may be another: `asmOrbit`); a turn of more
  // than a quarter in a frame is a pole crossed — no yaw step then
  const sAng = tiltAngles(tiltDirO(st.asmTilt.q, u), (st.asmPrevQ ?? q).yaw) ?? { yaw: q.yaw, v: q.v };
  const prev = st.asmPrevQ ?? sAng;
  st.asmPrevQ = { yaw: sAng.yaw, v: sAng.v };
  const dYawS = Math.atan2(Math.sin(sAng.yaw - prev.yaw), Math.cos(sAng.yaw - prev.yaw));
  let hit: GizmoHit | null = null;
  if (!st.asmLocked) {
    const g0 = st.asmG;
    hit = carrierFrame(st, sAng.yaw, sAng.v, Math.abs(dYawS) > Math.PI / 2 ? 0 : dYawS, pitchOfV(sAng.v) - pitchOfV(prev.v), u);
    if (hit !== null) {
      // ⭐⭐⭐ (2026-11-02, *"the piece jumps when the gizmo travels the section"* over a discontinuity) a step IN DEPTH taken into the approach: the piece stays
      // (`gizmoDepthStep`, `approachOfDistance`), the shown gizmo stepped along with it — ⛔ the piece stepped with the gizmo (an overhang's edge)
      const step = g0 === null ? 0 : gizmoDepthStep(g0, hit.point, u, GIZMO_DEPTH_STEP_M);
      if (step !== 0) {
        st.approach = approachOfDistance(st.cfg, Math.max(0, d - step), st.approach);
        d = approachDistance(st.cfg, st.approach);
        if (st.asmGizmo !== null) st.asmGizmo = [st.asmGizmo[0] + u[0] * step, st.asmGizmo[1] + u[1] * step, st.asmGizmo[2] + u[2] * step];
      }
      st.asmG = hit.point;
      // ⭐⭐⭐ (2026-11-02) the lines are drawn from the carrier of this ACCEPTED drop — a held one holds them with the gizmo (⛔ they went on with the carrier)
      st.asmShown = st.asmCarrier === null ? null : { c: st.asmCarrier, yaw: sAng.yaw };
    }
  }
  const g0 = st.asmLocked && st.asmLock !== null ? st.asmLock.point : (st.asmG ?? st.asmGizmo ?? a.centre);
  const piece: Vec3 = [g0[0] + u[0] * d, g0[1] + u[1] * d, g0[2] + u[2] * d];
  const toCentre = Math.hypot(piece[0] - a.centre[0], piece[1] - a.centre[1], piece[2] - a.centre[2]);
  const was = st.asmLocked;
  st.asmLocked = nextLock(was, toCentre, d, a.radius, st.cfg.assemblyLockDistM);
  if (st.asmLocked && !was) {
    // ⭐ the lock: the gizmo where it is now, its face the one it has
    const n = st.gizmoNormal ?? hit?.normal ?? null;
    // ⭐ (2026-10-29) its cone from where the piece is (`lockCone`) — ⛔ snapped into 80° at once: a jump at the lock
    st.asmLock = { point: [g0[0], g0[1], g0[2]], normal: n, host: st.gizmoHost ?? hit?.host ?? null, cone: n === null ? null : lockCone(null, angleTo(u, n)) };
    st.asmCarrier = null; // ⭐ (2026-10-29) the piece turns about the locked gizmo: back out, the carrier found again in the yaw plane as it is then
    st.asmShown = null;
    st.lastVerdict = "orbit: close in — the gizmo and its face locked";
  } else if (st.asmLocked && st.asmLock !== null && st.asmLock.normal !== null) {
    // ⭐ (2026-10-29) locked: the cone tightened as the piece comes inward
    st.asmLock = { ...st.asmLock, cone: lockCone(st.asmLock.cone ?? null, angleTo(u, st.asmLock.normal)) };
  } else if (!st.asmLocked && was) {
    // ⭐ unlocked: the carrier found again from the locked gizmo, projected into the yaw plane (⛔ 2026-10-28 carried on from the locked point — off the
    // yaw plane by the locked orbit's turn, or by the hover's slide: the gizmo off the red section from then on)
    st.asmG = st.asmLock !== null ? st.asmLock.point : st.asmG;
    st.asmCarrier = null;
    st.asmShown = null;
    st.asmLock = null;
    st.lastVerdict = "orbit: back out — the gizmo on the sections again";
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
  // ⭐⭐⭐ (2026-11-02) THE TILT the gizmo's face asks for (`tiltWanted`: within 40° of horizontal on, back past 50°) — switched here, unlocked
  if (!st.asmLocked) {
    const want = tiltWanted(st.gizmoNormal ?? null, st.asmTilt.kind);
    const held = st.asmTiltRoll !== null && st.asmTiltRoll.share < TILT_HOLD_SHARE; // ⭐ (2026-11-02) no ping-pong at an edge
    if (want !== st.asmTilt.kind && !held) switchTilt(st, want);
    // ⭐⭐⭐ (2026-11-02, *"avoid gimbal lock"*) the orbit's own frame re-tilted before a pole (`antiPoleQuat`): the angles never reach one
    const pq = st.pieceQ;
    const aq = pq === null ? null : antiPoleQuat(st.asmOrbit, pq.yaw, pq.v);
    if (aq !== null) rebaseOrbit(st, aq);
  }
  // ⭐⭐⭐ (2026-11-02) the screen's up REVERSED (the view passed over the top: gravity's up turned over) — rolled over the travel, never in a frame (`UP_FLIP_RAD`)
  if (st.asmTiltRoll === null && st.asmBaseUp !== null) {
    const target = screenUpTarget(u, tiltDirW(st.asmTilt.q, [0, 1, 0]), st.asmBaseUp);
    if (upTurn(st.asmBaseUp, target, u) > UP_FLIP_RAD) st.asmTiltRoll = { fromUp: st.asmBaseUp, share: st.cfg.orbitTiltBlendMm > 0 ? 0 : 1 };
  }
  // ⭐ the shown gizmo eased to its point; the orbit's centre IS it
  const target = st.asmLocked && st.asmLock !== null ? st.asmLock.point : g0;
  st.asmGizmo = st.asmGizmo === null ? [target[0], target[1], target[2]] : easePoint(st.asmGizmo, target, dtMs, GIZMO_TAU_MS);
  st.asmGizmoAt = [target[0], target[1], target[2]]; // ⭐⭐⭐ (2026-11-02) where the ring is drawn: the vertex both lines go through (`gizmoShownAt`)
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // ⭐ the look point: the centre far out, the gizmo close in
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM, st.asmLocked);
  const g = st.asmGizmo;
  const lt: Vec3 = [a.centre[0] + (g[0] - a.centre[0]) * w, a.centre[1] + (g[1] - a.centre[1]) * w, a.centre[2] + (g[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  sectionLinesFrame(st);
}

/** ⭐ The section lines' fixed samples (the green round its loop, the red along its chain — the gizmo's vertex added to each). */
const GREEN_SAMPLES = 96;
const RED_SAMPLES = 64;
/** ⭐ The lines lifted off the surface toward their ray's origin (m) — never in it. */
const SECTION_LIFT_M = 0.002;

/**
 * ⭐⭐ (the optional) THE SECTIONS DRAWN — the paths the gizmo takes: the RED one, the carrier's red chain dropped onto the surface (bottom centre → top
 * centre of the plane through it — the half the gizmo can travel); the GREEN one, where dx takes it — on a side the green loop at its height, dropped
 * (⛔ 2026-10-29 the yaw plane's cut at every yaw), on a top / bottom its turn about the axis, brought onto each red section and dropped (⛔ vertical drops
 * on a circle: off a thin top they landed on the parts below, *"the green section can take strange forms"*). Hidden locked, under a hover, or off.
 * ⭐⭐⭐ (2026-11-02, *"build it (option A, symetric)"*) DRAWN THROUGH THE GIZMO (`sectionFixed`, `insertIndex`): from the carrier of the gizmo's last
 * ACCEPTED drop (`st.asmShown` — a held drop holds the lines with it), each line's fixed samples dropped once per line (the red per yaw and origin, the
 * green per height / distance — a dx reshapes the red only, a dy the green only), the gizmo's EXACT point inserted in both every frame; redrawn at every
 * change (⛔ at most every 100 ms: they held, then jumped). ⭐ ONE mesh of a fixed vertex count, updated in place (a segment not drawn: collapsed) — ⛔
 * (2026-10-29) rebuilt every 100 ms, its new material was not ready for its first frames: the lines missing from 27 of 106 frames.
 */
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

function sectionLinesFrame(st: SceneState): void {
  const sh = st.asmShown;
  const g = st.asmG;
  const show = st.cfg.sectionLines === 1 && !st.asmLocked && st.hover === null && g !== null && sh !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const c = sh.c;
  const yaw = sh.yaw;
  const a = st.asm!;
  const parts = partsO(st).key;
  const reach = a.radius * 2 + 1;
  const tq = st.asmTilt.q;
  const drop = (r: SectionRay): Vector3 | null => {
    const h = castRay(st, r);
    const dw = tiltDirW(tq, r.dir);
    return h === null ? null : new Vector3(h.point[0] - dw[0] * SECTION_LIFT_M, h.point[1] - dw[1] * SECTION_LIFT_M, h.point[2] - dw[2] * SECTION_LIFT_M);
  };
  // the red's fixed samples (per yaw and origin)
  const ch = c.chain;
  const rKey = sectionRedKey(parts, yaw, c.origin);
  if (st.asmRedCache === null || st.asmRedCache.key !== rKey) {
    const params = sectionFixed(ch.total, RED_SAMPLES - 1, false);
    st.asmRedCache = { key: rKey, params, pts: params.map((x) => drop(redAt(st, yaw, ch, c.origin, x).drop)) };
  }
  // the green's fixed samples (per height on a side, per distance from the axis over a top)
  const loop = c.kind === "SIDE" ? loopFor(st, c.w[1]) : null;
  const gKey = sectionGreenKey(parts, c.kind, c.w, a.centre);
  if (st.asmGreenCache === null || st.asmGreenCache.key !== gKey) {
    if (loop !== null) {
      const params = sectionFixed(loop.total, GREEN_SAMPLES, true);
      st.asmGreenCache = { key: gKey, params, pts: params.map((x) => { const at = chainAt(loop, x); return drop(greenDrop([at.p[0], c.w[1], at.p[1]], greenNormal(loop, at.edge), reach)); }) };
    } else if (c.kind !== "SIDE") {
      const params = sectionFixed(2 * Math.PI, GREEN_SAMPLES, true);
      st.asmGreenCache = { key: gKey, params, pts: params.map((th) => { const r = onRed(st, th, turnAbout(c.w, a.centre, th - yaw), c.kind); return r === null ? null : drop(r.drop); }) };
    } else st.asmGreenCache = { key: gKey, params: [], pts: [] };
  }
  // ⭐⭐⭐ the gizmo's EXACT point — the accepted drop — inserted in both: the ring is a vertex of each line, at every frame
  const gd = tiltDirW(tq, c.drop.dir);
  const gv = new Vector3(g[0] - gd[0] * SECTION_LIFT_M, g[1] - gd[1] * SECTION_LIFT_M, g[2] - gd[2] * SECTION_LIFT_M);
  const key = `${rKey}|${gKey}|${gv.x.toFixed(6)},${gv.y.toFixed(6)},${gv.z.toFixed(6)}`;
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && key === st.asmSectionKey) return;
  st.asmSectionKey = key;
  const v3 = (p: Vector3): Vec3 => [p.x, p.y, p.z];
  const rest = gv;
  const lines: Vector3[][] = [];
  // green: a closed loop through the gizmo (its own parameter: the carrier's arc length on a side, the plane's yaw over a top)
  const gc = st.asmGreenCache;
  const gParam = loop !== null ? nearestOnChain(loop, [c.w[0], c.w[2]]) : ((yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const green: (Vector3 | null)[] = gc.pts.length === 0 ? [] : [...gc.pts];
  const gi = insertIndex(gc.params, gParam);
  if (green.length > 0) green.splice(gi, 0, gv);
  // ⭐ (2026-10-29) a jump between two neighbours breaks it (`joins`) — the spacing: the loop's per sample on a side, the turn's arc on a top / bottom
  const greenStep = loop !== null ? loop.total / GREEN_SAMPLES : Math.max(0.005, (2 * Math.PI * Math.hypot(c.w[0] - a.centre[0], c.w[2] - a.centre[2])) / GREEN_SAMPLES);
  const n = green.length;
  const gJoin = n === 0 ? [false, false] : around(green, gi, (gi - 1 + n) % n, (gi + 1) % n, greenStep);
  for (let k = 0; k <= GREEN_SAMPLES; k++) {
    const p0 = green[k] ?? null;
    const p1 = n === 0 ? null : (green[(k + 1) % n] ?? null);
    const forced = n > 0 && ((k + 1) % n === gi ? gJoin[0] : k === gi ? gJoin[1] : null);
    lines.push(p0 !== null && p1 !== null && (forced ?? joins(v3(p0), v3(p1), greenStep)) ? [p0, p1] : [rest, rest]);
  }
  // red: the chain through the gizmo; a step in depth (a hidden stretch skipped) breaks the line
  const rc = st.asmRedCache;
  const red: (Vector3 | null)[] = [...rc.pts];
  const ri = insertIndex(rc.params, c.s);
  red.splice(ri, 0, gv);
  const step = ch.total / (RED_SAMPLES - 2);
  const rJoin = around(red, ri, ri - 1, ri + 1, step);
  for (let k = 0; k < RED_SAMPLES - 1; k++) {
    const p0 = red[k] ?? null;
    const p1 = red[k + 1] ?? null;
    const forced = k + 1 === ri ? rJoin[0] : k === ri ? rJoin[1] : null;
    lines.push(p0 !== null && p1 !== null && (forced ?? joins(v3(p0), v3(p1), step)) ? [p0, p1] : [rest, rest]);
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
  // ⭐⭐⭐ (2026-11-02) the screen's up: gravity's, but looking steeply down or up the FACE's frame up (`screenUpTarget` — ⛔ the tilted frame's everywhere: the
  // view lay slanted); at a switch of the face's frame rolled to it over the drag's travel (`tiltRollUp`); the offsets then about it — in the world
  const own = screenUpTarget(u, tiltDirW(st.asmTilt.q, [0, 1, 0]), st.asmBaseUp);
  const roll = st.asmTiltRoll;
  const base = roll === null ? own : tiltRollUp(roll.fromUp, own, u, roll.share);
  const f = offsetAbout(u, base, o.yawRad, o.pitchRad);
  return { dir: f.dir, up: f.up, base };
  // ⭐⭐ (2026-10-28) the offsets in the camera's own frame, never faded — the same whichever face hosts the gizmo (`offsetFrame`)
  // ⭐ (2026-10-29) its heading the ORBIT's yaw, always (⛔ the direction's own — locked and turned into the cone at −90° it switched from the yaw to the
  // face's heading at once: the scene jump-rotated; and at ±90° it has none)
  return offsetFrame(u, cam.yaw, o.yawRad, o.pitchRad);
}

/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const a1 = angleTo(tiltDirW(st.asmOrbit, orbitDir(yaw1, v1)), n);
  return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(tiltDirW(st.asmOrbit, orbitDir(yaw0, v0)), n);
}

/**
 * ⭐⭐⭐ (2026-11-02) THE ORBIT'S TILT SWITCHED (`input/orbit_tilt.ts`): its new rotation from the camera's heading now (`tiltQuat`); the orbit's angles
 * RE-BASED in the new frame on the piece's direction as it is (`tiltAngles` — nothing swings: the piece and the gizmo stay, only the axes the next dx and dy
 * follow change), the eye's spring and the camera's lag with them; the carrier found again in the new frame; the screen's roll started (`asmTiltRoll`).
 */
function switchTilt(st: SceneState, kind: TiltKind): void {
  const cam = st.camera;
  // ⭐ the heading: the camera's, laid on the ground — its view, and its up (looking down at a top the up is the way away) — ⛔ read from the camera's
  // place, near straight above it was anywhere: 29° off, measured
  const f = cam.getDirection(new Vector3(0, 0, 1));
  const up = cam.upVector;
  const heading: Vec3 = [f.x + up.x, 0, f.z + up.z];
  const qNew = tiltQuat(kind, heading);
  // the roll starts from the up the camera's offsets were last applied about (`base`) — continuous, whatever was under way
  const fromUp: Vec3 = st.asmBaseUp ?? st.cameraPrev?.up ?? [up.x, up.y, up.z];
  st.asmTilt = { kind, q: qNew };
  rebaseOrbit(st, qNew);
  st.asmCarrier = null;
  st.asmShown = null;
  st.asmPrevQ = null;
  st.asmTiltRoll = { fromUp, share: st.cfg.orbitTiltBlendMm > 0 ? 0 : 1 };
  st.lastVerdict = kind === 0 ? "orbit: back on a vertical face — the orbit upright" : `orbit: on a ${kind === 1 ? "top" : "bottom"} — the orbit tilted onto it (dx across, dy toward / away)`;
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE ORBIT'S OWN FRAME RE-BASED (`qNew` — the face's at its switch, or turned before a pole): its angles re-solved on the piece's direction
 * as it is (`tiltAngles` — nothing moves: only the axes the next dx and dy follow change), the eye's spring, the camera's lag and its leash each on its
 * OWN direction (⛔ snapped to the solved one, the drawn piece jumped by the eye's lag — 0.9 m far out; the leash dropped, the camera — 436 px); the
 * finger's axes kept (`tiltSignAfter`: the same finger the same way in the world).
 */
function rebaseOrbit(st: SceneState, qNew: import("../core/vec").Quat): void {
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
  const so = orbitDirSteps(p.yaw, p.v);
  const sn = orbitDirSteps(t.yaw, t.v);
  st.asmSign = {
    yaw: tiltSignAfter(st.asmSign.yaw, tiltDirW(qOld, so.yaw), tiltDirW(qNew, sn.yaw)),
    v: tiltSignAfter(st.asmSign.v, tiltDirW(qOld, so.pitch), tiltDirW(qNew, sn.pitch)),
  };
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

/** ⭐⭐⭐ (2026-11-02) The screen's roll at a tilt's switch, by `travelMm` of the finger (`orbitTiltBlendMm`); done, it ends. */
export function tiltRollStep(st: SceneState, travelMm: number): void {
  const r = st.asmTiltRoll;
  if (r === null || !(travelMm > 0)) return;
  const share = tiltRollShare(r.share, travelMm, st.cfg.orbitTiltBlendMm);
  st.asmTiltRoll = share >= 1 ? null : { ...r, share };
}
