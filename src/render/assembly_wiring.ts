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
import { angleTo, lockCone, approachDistance, approachOfDistance, approachStep, coneClamp, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, nextLock, offsetAbout, modelNormal, orbitDir, pitchOfV, rayOffsets, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { antiPoleQuat, ANTI_POLE_RAD, faceHeading, frameAngles, frameSteps, frameTurn, fromFrame, fromFramePoint, gizmoStepCap, ROLL_REST_MS, ROLL_START_RAD, rollSense, rollShare, rollUp, screenUpTarget, signAfter, signOnScreen, SWITCH_HOLD_SHARE, tiltQuat, tiltWanted, toFrame, toFramePoint, upAngle, viewTurnScale, type TiltKind } from "../input/orbit_frame";
import { alongToDistance, pieceAlong, shellBox, type ShellBox } from "../input/orbit_shell";
import { chainAt, chainStep, dropRay, edgeKind, edgeNormal, faceTurnedAway, facingChain, joins, nearestOfKind, fromPlane, greenDrop, greenFaces, greenNormal, greenPace, greenPoints, hull2, loopOf, loopStep, nearestOnChain, redOrigin, gizmoJoins, insertIndex, sectionFixed, sectionGreenKey, sectionPoints, sectionRedKey, toPlane, turnAbout, type EdgeKind, type SectionChain, type SectionRay } from "../input/section_hull";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import { type CameraAngleOffset, type OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import { orbitDegPerMm } from "../input/follow_camera";
import type { SceneState } from "./scene_state";
import { hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { slideArmedAfter } from "../input/hover";
import type { Quat, Vec3 } from "../core/vec";
import { worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { spanEngaged, spanEngageM } from "../input/face_span";
import { spanAfterSlide, spanEngage, spanFrame, spanLinesFrame, spanRelease, spanZenithStep, spanZenithUp } from "./face_span_wiring";

/** ⭐ The ray's beside-rays' distance (m): a gap between parts narrower than this is bridged (the painting's cores sit 3 mm apart). */
const RAY_COVER_M = 0.004;
/** ⭐ The shown gizmo's ease to a new point (ms) — a step in depth eased, never a jump; the look point's. */
const GIZMO_TAU_MS = 90;
/** ⭐ (2026-11-02) the shown gizmo's walk with no finger travel (m/s): a gizmo left behind still arrives (`gizmoStepCap`). */
const GIZMO_REST_MPS = 0.5;
const LOOK_TAU_MS = 120;
/** ⭐⭐⭐ (2026-11-02) a gizmo's step along the piece's direction over this in one frame is a step IN DEPTH (m) — the piece kept where it is. */
const GIZMO_DEPTH_STEP_M = 0.005;

/** ⭐ Is the orbit the one around the assembly? */
export function assemblyOn(st: SceneState): boolean {
  return st.cfg.orbitMode === 0;
}

/** ⭐ The placed parts' world bounding box, `null` with none. */
function placedBox(st: SceneState): { lo: Vec3; hi: Vec3 } | null {
  let lo: Vec3 | null = null;
  let hi: Vec3 | null = null;
  for (const [mesh, id] of st.idOf) {
    if (!goalLocked(id, st.goalCommit, true)) continue;
    const b = mesh.getBoundingInfo().boundingBox;
    const a = b.minimumWorld;
    const c = b.maximumWorld;
    lo = lo === null ? [a.x, a.y, a.z] : [Math.min(lo[0], a.x), Math.min(lo[1], a.y), Math.min(lo[2], a.z)];
    hi = hi === null ? [c.x, c.y, c.z] : [Math.max(hi[0], c.x), Math.max(hi[1], c.y), Math.max(hi[2], c.z)];
  }
  return lo === null || hi === null ? null : { lo, hi };
}

/** ⭐⭐⭐ (2026-11-02) The placed parts' box from their vertices on the model poses (`placedParts`), `null` with none. */
function placedVertexBox(st: SceneState): { lo: Vec3; hi: Vec3 } | null {
  const vs = placedParts(st).parts.flat();
  if (vs.length === 0) return null;
  const lo: Vec3 = [Math.min(...vs.map((v) => v[0])), Math.min(...vs.map((v) => v[1])), Math.min(...vs.map((v) => v[2]))];
  const hi: Vec3 = [Math.max(...vs.map((v) => v[0])), Math.max(...vs.map((v) => v[1])), Math.max(...vs.map((v) => v[2]))];
  return { lo, hi };
}

/**
 * ⭐ THE ASSEMBLY, once: its centre (the placed parts' box's — inside the assembly; fixed for the scene, the owner: *"put the center at the center inside the
 * assembly at boot and don't change it"*), its radius (half its largest dimension); and the boot's pitch the piece had on the rings.
 */
export function ensureAssembly(st: SceneState): void {
  if (st.asm !== null) return;
  // ⭐⭐⭐ (2026-11-02) from the placed parts' vertices on their MODEL poses (`placedParts`, world matrices computed) — ⛔ the meshes' bounding boxes were read
  // before their world matrices existed: the centre (0, 0, 0), the radius 0.2415 (≈ (0.023, 0.257, −0.037), 0.283 in truth)
  const box = placedVertexBox(st) ?? placedBox(st);
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
    st.asmPicks++;
    const from = new Vector3(a.centre[0] + u[0] * out + o[0], a.centre[1] + u[1] * out + o[1], a.centre[2] + u[2] * out + o[2]);
    const r = st.scene.pickWithRay(new Ray(from, new Vector3(-u[0], -u[1], -u[2]), out + a.radius * 2), (m) => {
      const id = st.idOf.get(m);
      return id !== undefined && goalLocked(id, st.goalCommit, true) && m.isPickable && m.isEnabled();
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

/** ⭐⭐⭐ (2026-11-02) The orbit's direction in the WORLD at an orbit place — its angles are its own frame's (`st.asmOrbit`). */
export function orbitDirWorld(st: SceneState, yaw: number, v: number): Vec3 {
  return fromFrame(st.asmOrbit, orbitDir(yaw, v));
}

/** ⭐ The piece's direction at the orbit place (the world's) — locked, kept in the face's cone (`coneClamp`; `clamp` false: not — the way out's solve). */
function dirAt(st: SceneState, yaw: number, v: number, clamp = true): Vec3 {
  // ⭐⭐⭐ (2026-11-02, second pass, the owner: *"I want to keep what was done for commit ff2fca2 in terms of gizmo leading"*) in the face-span too the piece is
  // on the ORBIT's direction from its gizmo (⛔ straight out along the face's normal, the orbit held: the gizmo read as trailing the piece)
  const u = orbitDirWorld(st, yaw, v);
  const n = clamp && st.asmLocked && st.asmLock !== null ? st.asmLock.normal : null;
  return n === null ? u : coneClamp(u, n, st.asmLock!.cone ?? undefined);
}

/**
 * ⭐ The gizmo a query of the piece's place reads: locked, the locked point; else the CARRIER's (`st.asmG`, moved once a frame — ⛔ 2026-10-28 the ray
 * toward the centre for each direction); none yet, the ray's.
 */
function gizmoFor(st: SceneState, u: Vec3): Vec3 {
  if (st.span !== null) return st.span.g;
  if (st.asmLocked && st.asmLock !== null) return st.asmLock.point;
  if (st.asmG !== null) return st.asmG;
  const h = castGizmo(st, u);
  if (h !== null) return h.point;
  const g = st.asmGizmo ?? st.centreBlend.targetM;
  return [g[0], g[1], g[2]];
}

/** ⭐ A ray cast against the PLACED parts — given in the FACE's frame (the sections'), cast in the world: its first hit (the world's) — or `null`. */
function castRay(st: SceneState, r: SectionRay | null): GizmoHit | null {
  if (r === null) return null;
  st.asmPicks++;
  const o = fromFramePoint(st.asmFace.q, st.asm!.centre, r.origin);
  const d = fromFrame(st.asmFace.q, r.dir);
  const hit = st.scene.pickWithRay(new Ray(new Vector3(...o), new Vector3(...d), r.length), (m) => {
    const id = st.idOf.get(m);
    return id !== undefined && goalLocked(id, st.goalCommit, true) && m.isPickable && m.isEnabled();
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
    if (!goalLocked(id, st.goalCommit, true) || !mesh.isEnabled()) continue;
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

/**
 * ⭐⭐⭐ (2026-11-02) The gizmo's DROP: the ray and four beside it `RAY_COVER_M` away (`rayOffsets`) — the outermost hit wins, its point on the ray (the
 * nearest of the five along it), so a gap between two cores narrower than that is bridged as `castGizmo` bridges it. ⛔ One ray: over the painting's
 * narrow top it fell through between the cores onto a part at the bottom, the gizmo 47 cm down, then back.
 */
function castCovered(st: SceneState, r: SectionRay): GizmoHit | null {
  const dw = fromFrame(st.asmFace.q, r.dir);
  const o0 = fromFramePoint(st.asmFace.q, st.asm!.centre, r.origin);
  let best: { t: number; hit: GizmoHit } | null = null;
  for (const o of rayOffsets(dw, RAY_COVER_M)) {
    const h = castRay(st, { ...r, origin: toFramePoint(st.asmFace.q, st.asm!.centre, [o0[0] + o[0], o0[1] + o[1], o0[2] + o[2]]) });
    if (h === null) continue;
    const t = (h.point[0] - o0[0]) * dw[0] + (h.point[1] - o0[1]) * dw[1] + (h.point[2] - o0[2]) * dw[2];
    if (best === null || t < best.t) best = { t, hit: { ...h, point: [o0[0] + dw[0] * t, o0[1] + dw[1] * t, o0[2] + dw[2] * t] } };
  }
  return best?.hit ?? null;
}

/**
 * ⭐⭐⭐ (2026-11-02) The placed parts' vertices IN THE FACE'S FRAME (about the assembly's centre) — what the sections read; the section code itself is the
 * upright one, untouched: a tilted top reads to it as a side. Cached per placed set and frame.
 */
function faceParts(st: SceneState): { readonly key: string; readonly parts: readonly (readonly Vec3[])[] } {
  const w = placedParts(st);
  const q = st.asmFace.q;
  const key = `${w.key}@${q.map((x) => x.toFixed(9)).join(",")}`;
  if (st.asmFaceParts !== null && st.asmFaceParts.key === key) return st.asmFaceParts;
  const c = st.asm!.centre;
  st.asmFaceParts = { key, parts: st.asmFace.kind === 0 ? w.parts : w.parts.map((vs) => vs.map((v) => toFramePoint(q, c, v))) };
  return st.asmFaceParts;
}

/** ⭐⭐⭐ (2026-11-02) The shell's box (`input/orbit_shell.ts`), per placed set. */
function shellOf(st: SceneState): ShellBox | null {
  const w = placedParts(st);
  if (st.asmShell === null || st.asmShell.key !== w.key) st.asmShell = { key: w.key, box: shellBox(w.parts) };
  return st.asmShell.box;
}

/** ⭐⭐⭐ (2026-11-02) How far along `u` from the gizmo `g` the piece stands at the approach's distance `d` (`pieceAlong`: the shell's). */
function along(st: SceneState, g: Vec3, u: Vec3, d: number): number {
  return pieceAlong(g, u, d, st.cfg.orbitShellOffsetMm / 1000, shellOf(st));
}

/** ⭐ The facing half of the hull of the RED section — the vertical plane at `yaw` through `origin` (`redOrigin`) — cached for the plane and the placed set; `null`: none. */
function chainFor(st: SceneState, yaw: number, origin: Vec3, from = 0): SectionChain | null {
  const parts = faceParts(st);
  const f = Math.min(0, from);
  const key = `${parts.key}#${yaw.toFixed(9)}#${origin[0].toFixed(7)},${origin[2].toFixed(7)}#${f.toFixed(5)}`;
  if (st.asmChain !== null && st.asmChain.key === key) return st.asmChain.chain;
  const chain = facingChain(hull2(sectionPoints(parts.parts, origin, yaw)), f);
  st.asmChain = { key, chain };
  return chain;
}

/** ⭐ The GREEN loop — the hull of the horizontal cut at height `y` (`greenPoints`, `loopOf`) — cached for the height and the placed set; `null`: none. */
function loopFor(st: SceneState, y: number): SectionChain | null {
  const parts = faceParts(st);
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
  // ⭐ (2026-11-02, A5) the chain reaches the point itself, behind the axis too (`facingChain`'s `from`)
  const p = toPlane(w, origin, yaw);
  const chain = chainFor(st, yaw, origin, p[0]);
  if (chain === null) return null;
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
  // ⭐⭐⭐ (2026-11-02) `yaw`, `v` and the steps the FACE's frame's (the sections'); `u` and the hit the world's
  const a = st.asm!;
  const pitch = pitchOfV(v);
  let c = st.asmCarrier;
  if (c === null) {
    const from = st.asmG ?? castGizmo(st, u)?.point ?? null;
    if (from === null) return null;
    c = onRed(st, yaw, toFramePoint(st.asmFace.q, a.centre, from)); // ⭐ (2026-11-02) into the face's frame
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
  const h = castCovered(st, c.drop); // ⭐⭐⭐ (2026-11-02) the gap between two cores bridged, as the ray toward the centre's (⛔ one ray: it fell through to a part 25 cm deep)
  if (h === null) return null;
  if (faceTurnedAway(h.normal, u)) { // (both the world's)
    st.lastVerdict = "orbit: the gizmo's drop lands on a face turned away from the piece — held";
    return null;
  }
  // ⭐ after a dx on a side, the red section through where the gizmo LANDED (⛔ through the carrier: at a corner the green drop lands aside of it — 10 mm off
  // the red plane, measured); the carrier itself stays on the green loop
  if (green) {
    const red = onRed(st, yaw, toFramePoint(st.asmFace.q, a.centre, h.point));
    if (red !== null) st.asmCarrier = { ...c, chain: red.chain, origin: red.origin, s: red.s };
  }
  return h;
}

/**
 * ⭐⭐ THE PIECE'S PLACE from the orbit's centre (the shown gizmo) at an orbit place — `ringPlaceNow`'s in this mode, the solver's queries included: its
 * own gizmo for that direction + the direction × how far along it the SHELL puts the piece at the approach's distance (`along`; `approach`: the state's
 * by default).
 */
export function placeOffset(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const u = dirAt(st, yaw, v);
  const g = gizmoFor(st, u);
  const t = along(st, g, u, approachDistance(st.cfg, approach));
  const c = st.orbitCentreM;
  return [g[0] + u[0] * t - c.x, g[1] + u[1] * t - c.y, g[2] + u[2] * t - c.z];
}

/** ⭐ The DRAWN piece's place from the shown gizmo: along its direction, as far as the shell puts it from there (the gizmo's ease carries it — never a jump). */
export function shownOffset(st: SceneState, yaw: number, v: number): Vec3 {
  const u = dirAt(st, yaw, v);
  const c = st.orbitCentreM;
  const t = along(st, [c.x, c.y, c.z], u, approachDistance(st.cfg, st.approach));
  return [u[0] * t, u[1] * t, u[2] * t];
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
  st.asmPicks = 0;
  const a = st.asm!;
  // ⭐⭐ (2026-11-02, the third audit's A4 / B4) the frame's ONE approach step: the finger's dy gathered since the last frame (`approachInput`)
  st.approachQueries = 0;
  approachFrame(st);
  // ⭐ the approach's coast — ⭐⭐ (2026-11-01) under the slide mode too: a flick out leaves it
  if (st.approachInertia.coasting) {
    const s = st.approachInertia.step(dtMs, st.cfg.boxSmoothMs * 4);
    approachMove(st, s.dV);
  }
  if (st.hover !== null) {
    const t = st.centreBlend.targetM;
    if (st.span !== null) st.span.slid = true; // ⭐⭐⭐ (2026-11-02) the slide owns the gizmo: the face-span takes it back after
    st.asmLocked = true;
    st.asmCarrier = null; // ⭐ (2026-10-29) back out, the carrier found again from the gizmo, in the yaw plane as it is then
    st.asmShown = null;
    const n = st.gizmoNormal ?? null;
    const q0 = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
    st.asmLock = { point: [t[0], t[1], t[2]], normal: n, host: st.gizmoHost ?? null, cone: n === null ? null : lockCone(st.asmLock?.cone ?? null, angleTo(orbitDirWorld(st, q0.yaw, q0.v), n)) };
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    return;
  }
  let d = approachDistance(st.cfg, st.approach);
  // ⭐⭐⭐ (2026-11-02) THE FACE-SPAN (`face_span_wiring.ts`): back from a slide, the gizmo where it left it; out past the engage's hysteresis (never mid-wrap),
  // the far orbit from the piece's direction now; in within the engage distance, the far gizmo's face taken
  if (st.span !== null && st.span.slid) {
    const t = st.centreBlend.targetM;
    st.asmLocked = false;
    st.asmLock = null;
    const q0 = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
    spanAfterSlide(st, [t[0], t[1], t[2]], orbitDirWorld(st, q0.yaw, q0.v));
  }
  const engageM = spanEngageM(st.cfg.faceSpanEngageM, farDistance(st.cfg));
  if (st.span !== null && !spanEngaged(true, d, engageM)) spanRelease(st);
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = orbitDirWorld(st, q.yaw, q.v);
  if (st.span === null && !st.asmLocked && spanEngaged(false, d, engageM) && st.asmG !== null && st.pieceQ !== null) {
    if (spanEngage(st, st.asmG, st.gizmoNormal ?? null, u)) {
      st.asmCarrier = null;
      st.asmShown = null;
      st.asmPrevQ = null;
    }
  }
  if (st.span !== null) {
    spanTail(st, dtMs, d);
    return;
  }
  // ⭐⭐⭐ (2026-10-29) the gizmo from its CARRIER on the sections' hulls (`carrierFrame`): the yaw's and the pitch's steps since the last frame — ⭐⭐⭐
  // (2026-11-02) read in the FACE's frame from the piece's direction (the orbit's own may be another); a turn of more than a quarter in a frame is a
  // pole crossed: no yaw step
  const sAng = frameAngles(toFrame(st.asmFace.q, u), st.asmPrevQ?.yaw ?? q.yaw) ?? { yaw: q.yaw, v: q.v };
  const prev = st.asmPrevQ ?? sAng;
  st.asmPrevQ = { yaw: sAng.yaw, v: sAng.v };
  const dYaw = Math.atan2(Math.sin(sAng.yaw - prev.yaw), Math.cos(sAng.yaw - prev.yaw));
  let hit: GizmoHit | null = null;
  if (!st.asmLocked) {
    const g0 = st.asmG;
    // ⭐ (2026-11-02, the third audit's A7) a pole crossed: the carrier found again in the new yaw plane (⛔ the old chain read at the new yaw — the front's
    // profile mirrored onto the back until the next dx)
    const pole = Math.abs(dYaw) > Math.PI / 2;
    if (pole) {
      st.asmCarrier = null;
      st.asmShown = null;
    }
    hit = carrierFrame(st, sAng.yaw, sAng.v, pole ? 0 : dYaw, pole ? 0 : pitchOfV(sAng.v) - pitchOfV(prev.v), u);
    if (hit !== null) {
      // ⭐⭐⭐ (2026-11-02, *"the piece jumps when the gizmo travels the section"* over an overhang) a gizmo's step IN DEPTH: the piece kept where it is — far
      // out the shell already keeps it (the ray from the new gizmo reaches the same shell), close in the approach takes the rest (`alongToDistance`,
      // `approachOfDistance` on the stretch it is on); the shown gizmo stepped with it
      const step = g0 === null ? 0 : (hit.point[0] - g0[0]) * u[0] + (hit.point[1] - g0[1]) * u[1] + (hit.point[2] - g0[2]) * u[2];
      if (Math.abs(step) > GIZMO_DEPTH_STEP_M) {
        const keep = along(st, g0!, u, d) - step;
        const d1 = alongToDistance(hit.point, u, keep, st.cfg.orbitShellOffsetMm / 1000, shellOf(st), farDistance(st.cfg));
        st.approach = approachOfDistance(st.cfg, d1, st.approach);
        d = approachDistance(st.cfg, st.approach);
        if (st.asmGizmo !== null) st.asmGizmo = [st.asmGizmo[0] + u[0] * step, st.asmGizmo[1] + u[1] * step, st.asmGizmo[2] + u[2] * step];
      }
      st.asmG = hit.point;
      // ⭐⭐⭐ (2026-11-02) the lines are drawn from the carrier of this ACCEPTED drop — a held one holds them with the gizmo (⛔ they went on with the carrier)
      st.asmShown = st.asmCarrier === null ? null : { c: st.asmCarrier, yaw: sAng.yaw };
    }
  }
  const g0 = st.asmLocked && st.asmLock !== null ? st.asmLock.point : (st.asmG ?? st.asmGizmo ?? a.centre);
  // ⭐ (2026-11-02, the third audit's A9) the piece where the SHELL puts it (`along`) — ⛔ `g + u·d`: over an edge the piece is farther, the lock came early
  const dAlong = along(st, g0, u, d);
  const piece: Vec3 = [g0[0] + u[0] * dAlong, g0[1] + u[1] * dAlong, g0[2] + u[2] * dAlong];
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
  framesFrame(st, u);
  // ⭐ the shown gizmo eased to its point; the orbit's centre IS it
  const target = st.asmLocked && st.asmLock !== null ? st.asmLock.point : g0;
  st.asmGizmo = st.asmGizmo === null ? [target[0], target[1], target[2]] : capStep(st.asmGizmo, easePoint(st.asmGizmo, target, dtMs, GIZMO_TAU_MS), gizmoStepCap(st.asmTravelFrameMm, dtMs, st.cfg.gizmoMmPerMm, GIZMO_REST_MPS));
  st.asmTravelFrameMm = 0;
  st.asmGizmoAt = [target[0], target[1], target[2]]; // ⭐⭐⭐ (2026-11-02) where the ring is drawn: the vertex both lines go through (`gizmoShownAt`)
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // ⭐ the look point: the centre far out, the gizmo close in
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM, st.asmLocked);
  const g = st.asmGizmo;
  const lt: Vec3 = [a.centre[0] + (g[0] - a.centre[0]) * w, a.centre[1] + (g[1] - a.centre[1]) * w, a.centre[2] + (g[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  screenUpFrame(st, dtMs);
  sectionLinesFrame(st);
  spanLinesFrame(st); // ⭐⭐⭐ (2026-11-02) hidden out of the face-span
}

/** ⭐⭐⭐ (2026-11-02) The piece's gap to the parts with the face-span's gizmo at `g` — one gap query, counted in the frame's cap (`approachQueries`). */
function spanGapAt(st: SceneState, g: Vec3): number {
  const sp = st.span!;
  const q = st.pieceQ!;
  const keep = sp.g;
  sp.g = g;
  const anchor = ringAnchorAt(st, q);
  sp.g = keep;
  st.approachQueries++;
  return pieceSolverEnv(st, () => anchor).gap(q);
}

/**
 * ⭐⭐⭐ (2026-11-02) THE FACE-SPAN'S FRAME (`spanFrame`): the gizmo moved on the face by the orbit's step, the piece and the camera from it; the shown gizmo
 * eased (held to the finger's travel, as the far one), the ring at the exact point, the look point as far out, the screen's up (a roll by travel), the lines.
 */
function spanTail(st: SceneState, dtMs: number, d: number): void {
  const a = st.asm!;
  spanFrame(st, dtMs, pieceSolveOptions(st).gapM, (g) => spanGapAt(st, g), (y, v) => orbitDirWorld(st, y, v));
  const sp = st.span!;
  st.asmG = sp.g;
  st.asmLocked = false;
  st.asmLock = null;
  st.asmCarrier = null;
  st.asmShown = null;
  st.asmPrevQ = null;
  const target = sp.g;
  const travel = Math.max(st.asmTravelFrameMm, sp.stepMm);
  st.asmGizmo = st.asmGizmo === null ? [target[0], target[1], target[2]] : capStep(st.asmGizmo, easePoint(st.asmGizmo, target, dtMs, GIZMO_TAU_MS), gizmoStepCap(travel, dtMs, st.cfg.gizmoMmPerMm, GIZMO_REST_MPS));
  st.asmTravelFrameMm = 0;
  st.asmGizmoAt = [target[0], target[1], target[2]];
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM, false);
  const g = st.asmGizmo;
  const lt: Vec3 = [a.centre[0] + (g[0] - a.centre[0]) * w, a.centre[1] + (g[1] - a.centre[1]) * w, a.centre[2] + (g[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  // ⭐⭐⭐ (second pass) the orbit's own frames as far out (the anti-pole re-tilt, the face's frame) — its signs are the face-span's (`spanScreenSigns`)
  const q = st.pieceQ;
  if (q !== null) framesFrame(st, orbitDirWorld(st, q.yaw, q.v), false);
  screenUpFrame(st, dtMs);
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
  spanLinesFrame(st);
}

/**
 * ⭐ The screen's up wanted along the view `u`: the far orbit's rule (`screenUpTarget` — gravity's, the face's frame's looking steeply) in the face-span too —
 * ⭐⭐⭐ (second pass) except within a top's zenith cone: there the roll of branch 1.0.83 (`spanZenithUp` — from the up at the cone, half a turn by its share).
 */
function upTarget(st: SceneState, u: Vec3, prev: Vec3 | null): Vec3 {
  const z = spanZenithUp(st);
  if (z !== null) return rollUp(z.from, z.to, u, z.share, z.sense);
  return screenUpTarget(u, fromFrame(st.asmFace.q, [0, 1, 0]), prev);
}

/**
 * ⭐⭐⭐ (2026-11-02, second pass) After an orbit step from (`yaw0`, `v0`) worth `travelMm` of finger (the drag's, the coast's): over a top in the face-span, the
 * zenith's roll of branch 1.0.83 (`spanZenithStep` — the step held at the zenith while it rolls the camera).
 */
export function orbitZenithStep(st: SceneState, yaw0: number, v0: number, travelMm: number): void {
  if (st.span === null) return;
  spanZenithStep(st, yaw0, v0, travelMm, (y, v) => orbitDirWorld(st, y, v));
}

/** ⭐ …the coast's step: its travel read off the step itself at the orbit's pace. */
export function orbitZenithCoast(st: SceneState, yaw0: number, v0: number): void {
  if (st.span === null) return;
  const dy = Math.atan2(Math.sin(st.orbit.yaw - yaw0), Math.cos(st.orbit.yaw - yaw0));
  const dp = pitchOfV(st.orbit.elevation) - pitchOfV(v0);
  const degPerMm = Math.abs(orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm);
  orbitZenithStep(st, yaw0, v0, degPerMm > 0 ? Math.hypot(dy, dp) / ((degPerMm * Math.PI) / 180) : 0);
}

/** ⭐ `to` from `from`, the step at most `capM` long. */
function capStep(from: Vec3, to: Vec3, capM: number): Vec3 {
  const d: Vec3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const n = Math.hypot(d[0], d[1], d[2]);
  if (!(n > capM)) return to;
  const k = capM / n;
  return [from[0] + d[0] * k, from[1] + d[1] * k, from[2] + d[2] * k];
}

/** ⭐⭐⭐ (2026-11-02) Nothing moves the orbit: no finger, no coast. */
function orbitAtRest(st: SceneState): boolean {
  return st.router.size === 0 && !st.orbitInertia.coasting && !st.approachInertia.coasting;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE TWO FRAMES, each frame (unlocked): the FACE's switched where the gizmo's face asks for it (`tiltWanted`) — not before half the
 * roll's travel since the last switch (`SWITCH_HOLD_SHARE`: no ping-pong at an edge); the ORBIT's own re-tilted past 60° of pitch (`antiPoleQuat`: no pole),
 * and back on the face's once at rest within it (so dx goes round at its height again on a vertical face). Every re-base moves nothing (`rebaseOrbit`).
 */
function framesFrame(st: SceneState, u: Vec3, signs = true): void {
  if (st.asmLocked) return;
  const want = tiltWanted(st.gizmoNormal ?? null, st.asmFace.kind);
  // ⭐ (2026-11-02, the third audit's A8) …or at rest (no ping-pong to fear): ⛔ at the boot over a top, or after a coast, the switch waited for the next drag
  if (want !== st.asmFace.kind && (st.asmSwitchMm >= st.cfg.orbitTiltBlendMm * SWITCH_HOLD_SHARE || orbitAtRest(st))) switchFace(st, want);
  const pq = st.pieceQ;
  if (pq === null) return;
  const aq = antiPoleQuat(st.asmOrbit, pq.yaw, pq.v);
  if (aq !== null) rebaseOrbit(st, aq);
  else if (orbitAtRest(st) && !sameQuat(st.asmOrbit, st.asmFace.q)) {
    const f = frameAngles(toFrame(st.asmFace.q, u), 0);
    if (f !== null && Math.abs(pitchOfV(f.v)) < ANTI_POLE_RAD) rebaseOrbit(st, st.asmFace.q);
  }
  // ⭐ at rest, the screen upright again (no roll under way): the finger's signs read off the screen — dx its right, dy its up (`signOnScreen`)
  const cp = st.cameraPrev;
  if (signs && orbitAtRest(st) && st.asmRoll === null && cp !== null && cp !== undefined) {
    const q = st.pieceQ ?? pq;
    const steps = frameSteps(q.yaw, q.v);
    const right: Vec3 = [cp.dir[1] * cp.up[2] - cp.dir[2] * cp.up[1], cp.dir[2] * cp.up[0] - cp.dir[0] * cp.up[2], cp.dir[0] * cp.up[1] - cp.dir[1] * cp.up[0]];
    st.asmSign = { yaw: signOnScreen(st.asmSign.yaw, fromFrame(st.asmOrbit, steps.yaw), right), v: signOnScreen(st.asmSign.v, fromFrame(st.asmOrbit, steps.pitch), cp.up) };
  }
}

function sameQuat(a: Quat, b: Quat): boolean {
  return Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]) > 1 - 1e-12;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE FACE'S FRAME SWITCHED (`tiltQuat`): its heading the camera's view laid on the ground — its forward plus its up over a top (looking
 * down the up is the way away), minus it under a bottom (`faceHeading`; ⛔ read from the camera's place, near straight above it came out 29° off); the orbit re-based on it (`rebaseOrbit` — nothing
 * moves, only the axes the next dx and dy follow change); the carrier found again in the new frame.
 */
function switchFace(st: SceneState, kind: TiltKind): void {
  const f = st.camera.getDirection(new Vector3(0, 0, 1));
  const up = st.camera.upVector;
  const q = tiltQuat(kind, faceHeading(kind, [f.x, f.y, f.z], [up.x, up.y, up.z])); // ⭐ (2026-11-02, A1) under a bottom forward MINUS up
  st.asmFace = { kind, q };
  rebaseOrbit(st, q);
  st.asmCarrier = null;
  st.asmShown = null;
  st.asmPrevQ = null;
  st.asmSwitchMm = 0;
  st.lastVerdict = kind === 0 ? "orbit: on a vertical face — the orbit upright" : `orbit: on a ${kind === 1 ? "top" : "bottom"} — the orbit tilted onto it (dx across, dy toward / away)`;
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE ORBIT'S OWN FRAME RE-BASED on `qNew`: every orbit place — the solved one, the eye's spring WITH its velocity, the camera's lag, its
 * leash — re-read in the new frame on its OWN direction (`frameAngles`: ⛔ snapped to the solved one, the drawn piece jumped by the eye's lag, 0.9 m far
 * out; the leash dropped, the camera 436 px); the finger's axes kept (`signAfter`). Nothing moves.
 */
function rebaseOrbit(st: SceneState, qNew: Quat): void {
  const qOld = st.asmOrbit;
  const p = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation, zoom: 1 };
  const reread = (y: number, v: number): { yaw: number; v: number } | null => frameAngles(toFrame(qNew, fromFrame(qOld, orbitDir(y, v))), y);
  const t = reread(p.yaw, p.v);
  if (t === null) return;
  const sp = st.boxSpring;
  const spT = sp === null ? null : reread(sp.at.yaw, sp.at.v);
  const spV = sp === null || spT === null ? null : reread(sp.at.yaw + sp.velYaw * 1e-3, sp.at.v + sp.velV * 1e-3);
  const lag = st.cameraLagged;
  const lagT = lag === null ? null : reread(lag.yaw, lag.v);
  const co = st.cameraOrbit;
  const coT = co === null ? null : reread(co.cam.yaw, co.cam.v);
  const so = frameSteps(p.yaw, p.v);
  const sn = frameSteps(t.yaw, t.v);
  st.asmSign = {
    yaw: signAfter(st.asmSign.yaw, fromFrame(qOld, so.yaw), fromFrame(qNew, sn.yaw)),
    v: signAfter(st.asmSign.v, fromFrame(qOld, so.pitch), fromFrame(qNew, sn.pitch)),
  };
  // ⭐ (2026-11-02, the third audit's A6) the orbit's TARGET re-read on its own direction — ⛔ reset onto the solved place: the solver's backlog (the target
  // ahead of the piece) dropped at every switch
  const o = reread(st.orbit.yaw, st.orbit.elevation) ?? t;
  st.asmOrbit = qNew;
  st.pieceQ = { ...p, yaw: t.yaw, v: t.v };
  st.orbit.reset(o.yaw, o.v);
  st.orbitUserV = o.v;
  st.orbitRawPrev = { yaw: o.yaw, v: o.v };
  if (sp !== null && spT !== null) {
    const vel = spV === null ? { vy: 0, vv: 0 } : { vy: Math.atan2(Math.sin(spV.yaw - spT.yaw), Math.cos(spV.yaw - spT.yaw)) / 1e-3, vv: (spV.v - spT.v) / 1e-3 };
    st.boxSpring = { at: { yaw: spT.yaw, v: spT.v, zoom: sp.at.zoom }, velYaw: vel.vy, velV: vel.vv, velLnZoom: sp.velLnZoom };
  }
  // ⭐ (2026-11-02, A6) the leash re-read IN PLACE — its speeds and glides kept (⛔ `cameraOrbitAt`: a release right after a switch had no glide)
  if (co === null || coT === null) st.cameraOrbit = null;
  else {
    const box = reread(co.yaw.lastBox, co.pitch.lastBox) ?? { yaw: co.yaw.lastBox, v: co.pitch.lastBox };
    const drv = reread(co.yaw.lastDriver, co.pitch.lastDriver) ?? { yaw: co.yaw.lastDriver, v: co.pitch.lastDriver };
    st.cameraOrbit = { ...co, cam: { ...co.cam, yaw: coT.yaw, v: coT.v }, yaw: { ...co.yaw, lastBox: box.yaw, lastDriver: drv.yaw }, pitch: { ...co.pitch, lastBox: box.v, lastDriver: drv.v } };
  }
  st.cameraLagged = lagT;
}

/**
 * ⭐⭐⭐ (2026-11-02) THE SCREEN'S UP, each frame: where the up the camera's frame wants (`screenUpTarget`, from the camera's own place) turns from the one
 * shown last by more than `ROLL_START_RAD` — a switch looking steeply at a face, the view over the top — a ROLL starts from the one shown; it goes on with
 * the finger's travel (`orbitTravelMm`), by time with no finger (`ROLL_REST_MS`), and ends whole.
 */
function screenUpFrame(st: SceneState, dtMs: number): void {
  const shown = st.asmUp;
  const cam = st.cameraLagged ?? st.pieceQ;
  if (shown === null || cam === null) return;
  const u = orbitDirWorld(st, cam.yaw, cam.v);
  if (spanZenithUp(st) !== null) {
    st.asmRoll = null; // ⭐⭐⭐ (second pass) the zenith's roll owns the up there
    return;
  }
  if (st.asmRoll === null) {
    const to = upTarget(st, u, shown);
    // ⭐⭐ (2026-11-02) its way round latched at its start (`rollSense`): ⛔ a half turn's sign was the rounding's, the up flipped 177° in one frame
    if (upAngle(shown, to, u) > ROLL_START_RAD) st.asmRoll = { from: shown, share: 0, sense: rollSense(shown, to, u) };
    return;
  }
  // ⭐⭐⭐ (2026-11-02, second pass) …and by time while the finger is held STILL too (⛔ only with no finger on the glass: a finger resting left the view tilted —
  // on a frustum's small faces the travel never came to finish it)
  const om = st.orbitMotion;
  const still = st.router.size === 0 || (om !== null && om.tracker.axes.x !== "MOVING" && om.tracker.axes.y !== "MOVING");
  if (still) st.asmRoll = { ...st.asmRoll, share: st.asmRoll.share + dtMs / ROLL_REST_MS };
  if (st.asmRoll.share >= 1) st.asmRoll = null;
}

/** ⭐⭐⭐ (2026-11-02) The view's turn per mm of finger allowed (rad/mm): the dx yaw's own pace (`orbitDegPerMm`) × `orbitViewTurnCap` — on every face. */
export function viewTurnCapRadPerMm(st: SceneState): number {
  return (orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm * st.cfg.orbitViewTurnCap * Math.PI) / 180;
}

/**
 * ⭐⭐⭐ (2026-11-02) The finger's travel on the orbit (`travelMm`): it counts toward the next switch's wait; a ROLL under way goes on WITH it over
 * `orbitTiltBlendMm` (`rollShare`) — ⭐⭐⭐ (2026-11-02, later, the owner: *"Roll freeze: I liked what was implemented in 65a691a"*) the orbit goes on too:
 * ⛔ the roll no longer takes the travel first (`rollTakes` — the piece waited, *"the roll freeze"*). Returns the travel left for the orbit's own step: all of it.
 */
export function orbitTravelMm(st: SceneState, travelMm: number): number {
  if (!(travelMm > 0)) return 0;
  st.asmSwitchMm += travelMm;
  st.asmTravelFrameMm += travelMm;
  const r = st.asmRoll;
  if (r === null) return travelMm;
  const share = rollShare(r.share, travelMm, st.cfg.orbitTiltBlendMm);
  st.asmRoll = share >= 1 ? null : { ...r, share };
  return travelMm;
}

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"clamping the angular travel per mm input for any face"*) — **THE VIEW'S TURN GOVERNED**: an orbit step from (`yaw0`,
 * `v0`) to (`yaw1`, `v1`) for `travelMm` of finger — the share of it let through so the picture (the camera's look and its up, `frameTurn`) turns at most
 * the cap per mm (`viewTurnCapRadPerMm`). A yaw at any pitch is its own angle (a vertical face: never cut); straight above a top, a dx spinning the picture
 * and a dy tipping it over the edge are held to it. A jump of the up (a roll) is the roll's (`orbitTravelMm`), not counted here.
 */
export function viewTurnGoverned(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number, travelMm: number): number {
  if (!assemblyOn(st) || st.asmUp === null) return 1;
  const fu = fromFrame(st.asmFace.q, [0, 1, 0]);
  const u0 = orbitDirWorld(st, yaw0, v0);
  const u1 = orbitDirWorld(st, yaw1, v1);
  const up0 = screenUpTarget(u0, fu, st.asmUp);
  let up1 = screenUpTarget(u1, fu, up0);
  if (upAngle(up0, up1, u1) > ROLL_START_RAD) up1 = up0; // a roll's, not the step's
  const turn = frameTurn(u0, up0, u1, up1);
  if (turn === null) return 1;
  return viewTurnScale(turn, viewTurnCapRadPerMm(st) * Math.max(0, travelMm) + 1e-9);
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
  // ⭐ (2026-11-02) the forced join no longer than twice a join's reach (`gizmoJoins`' `maxForced`)
  const j = gizmoJoins(a !== null && joins(v(g), v(a), spacing), b !== null && joins(v(g), v(b), spacing), d(a), d(b), 2 * (2.5 * spacing + 0.002));
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
  const parts = faceParts(st).key;
  const reach = a.radius * 2 + 1;
  const fq = st.asmFace.q;
  // a drop's point lifted back up its ray (the ray the face's frame's, the point the world's)
  const drop = (r: SectionRay): Vector3 | null => {
    // ⭐⭐⭐ (2026-11-02) bridged as the gizmo's drop (`castCovered`): ⛔ one ray fell between two cores onto a part behind — a line through the joint
    const h = castCovered(st, r);
    const dw = fromFrame(fq, r.dir);
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
  const gd = fromFrame(fq, c.drop.dir);
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
  // ⭐ (2026-11-02, A4 / B4) every gap query counted into the frame's cap (`approachQueries`, taken off the orbit solver's share)
  const gapAt = (cand: number): number => {
    st.approachQueries++;
    return envAt(cand).gap(q);
  };
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
    st.approachQueries++;
    const blocker = envAt(a0 + (want - a0) * hi).blocker?.(q) ?? null; // the part met at the step refused
    st.lastVerdict = `orbit: the way out is blocked by ${blocker ?? "a part"} — slide or orbit to find a way out`;
    st.hudDirty = true;
  }
  return st.approach - a0;
}

/**
 * ⭐ An approach input: `dyMm` of finger (UP brings the piece IN), at the orbit dy's pace on the curve's coordinate. ⭐⭐ (2026-11-02, the third audit's A4 /
 * B4) GATHERED, taken once a frame (`approachFrame`) — ⛔ checked against the parts at every pointer event: two fingers or a 250 Hz mouse ran 16–32 gap
 * queries a frame outside the solver's cap of 24 (the iPhone's budget).
 */
export function approachInput(st: SceneState, dyMm: number): void {
  st.approachPendingMm += dyMm;
  st.asmTravelFrameMm += Math.abs(dyMm); // ⭐ (2026-11-02) the gizmo's walk is the finger's (`gizmoStepCap`)
  // ⭐ (2026-11-02, A5 / A8) the approach's travel counts toward the face frame's switch as the orbit's does
  st.asmSwitchMm += Math.abs(dyMm);
  // ⭐ (2026-11-01) the slide mode left: the piece's own offset (the slide's settle) ways in by the approach's travel
  if (st.hover === null) hoverWayInStep(st, Math.abs(dyMm));
  st.hudDirty = true;
}

/** ⭐ (2026-11-02) The approach gathered since the last frame, moved once and recorded for the coast. */
export function approachFrame(st: SceneState): void {
  const mm = st.approachPendingMm;
  if (mm === 0) return;
  st.approachPendingMm = 0;
  const taken = approachMove(st, mm * orbitDvPerMm(st));
  st.approachInertia.record(performance.now(), 0, taken);
}

/** ⭐ The approach's input ends: its coast starts (what is still gathered taken first). */
export function approachRelease(st: SceneState): void {
  approachFrame(st);
  st.approachInertia.release(performance.now());
}

/**
 * ⭐ THE CAMERA'S FRAME: behind the piece along its direction (locked, the cone's), the owner's offsets in its own frame (⭐⭐ 2026-10-28: never faded,
 * the same whichever face hosts the gizmo) — ⭐⭐⭐ (2026-11-02) about THE SCREEN'S UP (`offsetAbout`): VERTICALS KEPT — gravity's, the face's frame's
 * looking steeply (`screenUpTarget`), a jump of it rolled (`st.asmRoll`). Its `base`, the up before the offsets — the next frame's reference.
 */
export function assemblyCameraFrame(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset, clamp = true): RigCameraFrame {
  const u = dirAt(st, cam.yaw, cam.v, clamp);
  const o = off ?? { yawRad: 0, pitchRad: 0 };
  const target = upTarget(st, u, st.asmUp);
  // ⭐⭐⭐ (2026-11-02, second pass) the zenith's roll IS the roll there: no second one chasing it
  if (spanZenithUp(st) !== null) st.asmRoll = null;
  // ⭐⭐ (2026-11-02) the camera's own frame (not a solve's): a jump of the up from the one shown starts the roll HERE — ⛔ checked only before the camera
  // moved in the frame (`screenUpFrame`), a flip arriving with the move was shown whole: 179° in one frame over the top
  if (clamp && spanZenithUp(st) === null && st.asmRoll === null && st.asmUp !== null && upAngle(st.asmUp, target, u) > ROLL_START_RAD) st.asmRoll = { from: st.asmUp, share: 0, sense: rollSense(st.asmUp, target, u) };
  const base = st.asmRoll === null ? target : rollUp(st.asmRoll.from, target, u, st.asmRoll.share, st.asmRoll.sense);
  const f = offsetAbout(u, base, o.yawRad, o.pitchRad);
  return { dir: f.dir, up: f.up, base };
}

/**
 * ⭐⭐⭐ (2026-11-02) The orbit camera's direction at an orbit place, in the orbit's own frame (the cfg's offsets) — the way out of a slide solves on it.
 * ⭐⭐ (2026-11-02, the third audit's A3) UNCLAMPED by the lock's cone — the cone is opened to the answer after (⛔ solved through the clamp, the solve
 * converged on the cone's edge: once opened, the camera missed the slide's view by 3–5°, up to 23° with wider offsets — a second, curved move).
 */
export function cameraDirInOrbit(st: SceneState, yaw: number, v: number): Vec3 {
  const off = { yawRad: (st.cfg.cameraYawOffsetDeg * Math.PI) / 180, pitchRad: (st.cfg.cameraPitchOffsetDeg * Math.PI) / 180 };
  return toFrame(st.asmOrbit, assemblyCameraFrame(st, { yaw, v } as OrbitAt, off, false).dir);
}

/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const a1 = angleTo(orbitDirWorld(st, yaw1, v1), n);
  return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(orbitDirWorld(st, yaw0, v0), n);
}
