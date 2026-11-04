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
import { angleTo, lockCone, approachDistance, approachStep, coneClamp, easePoint, faceSwitches, farDistance, approachStepFree, lookShare, offsetFrame, modelNormal, orbitDir, pitchOfV, rayOffsets, unswayHit, vOfPitch } from "../input/assembly_orbit";
import { chainAt, chainStep, redPace, syncStep, dropRay, edgeKind, edgeNormal, faceTurnedAway, facingChain, joins, nearestOfKind, fromPlane, greenDrop, greenNormal, greenPoints, hull2, loopOf, nearestOnChain, redHeading, redOrigin, gizmoJoins, insertIndex, sectionFixed, sectionGreenKey, sectionPoints, sectionRedKey, toPlane, turnAbout, type EdgeKind, type SectionChain, type SectionRay } from "../input/section_hull";
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
import { hoverWayInStep, slideWayOutRebase } from "./hover_wiring";
import { slideArmedAfter } from "../input/hover";
import type { Vec3 } from "../core/vec";
import { worldPlacementOf } from "../core/object_model";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/** ⭐ The ray's beside-rays' distance (m): a gap between parts narrower than this is bridged (the painting's cores sit 3 mm apart). */
const RAY_COVER_M = 0.004;
/** ⭐ The shown gizmo's ease to a new point (ms) — a step in depth eased, never a jump; the look point's. */
const GIZMO_TAU_MS = 90;
/** ⭐ (2026-11-04, Step 4) how far a dy's plane re-taken over a top may move the carrier (m) */
const RETAKE_M = 0.01;
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
  const u = orbitDir(yaw, v);
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
  const hit = st.scene.pickWithRay(new Ray(new Vector3(...r.origin), new Vector3(...r.dir), r.length), (m) => {
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

/** ⭐ The facing half of the hull of the RED section — the vertical plane at `yaw` through `origin` (`redOrigin`) — cached for the plane and the placed set; `null`: none. */
function chainFor(st: SceneState, yaw: number, origin: Vec3): SectionChain | null {
  const parts = placedParts(st);
  const key = `${parts.key}#${yaw.toFixed(9)}#${origin[0].toFixed(7)},${origin[2].toFixed(7)}`;
  if (st.asmChain !== null && st.asmChain.key === key) return st.asmChain.chain;
  const chain = facingChain(hull2(sectionPoints(parts.parts, origin, yaw)));
  st.asmChain = { key, chain };
  return chain;
}

/** ⭐ The GREEN loop — the hull of the horizontal cut at height `y` (`greenPoints`, `loopOf`) — cached for the height and the placed set; `null`: none. */
function loopFor(st: SceneState, y: number): SectionChain | null {
  const parts = placedParts(st);
  const key = `${parts.key}#${y.toFixed(7)}`;
  if (st.asmLoop !== null && st.asmLoop.key === key) return st.asmLoop.loop;
  const loop = loopOf(hull2(greenPoints(parts.parts, y)));
  st.asmLoop = { key, loop };
  return loop;
}

type Carrier = NonNullable<SceneState["asmCarrier"]>;

/** ⭐ The carrier at arc length `s` of the red `chain` (the plane at `yaw` through `origin`): its point, its edge's kind, its drop. */
function redAt(st: SceneState, heading: number, chain: SectionChain, origin: Vec3, s: number, want?: EdgeKind): Carrier {
  const at = chainAt(chain, s);
  let kind = edgeKind(edgeNormal(chain, at.edge));
  // ⭐ at a corner shared with an edge of the kind asked for (a top's edge, its side below it), that kind (⛔ the corner read as the side's: off the top)
  if (want !== undefined && kind !== want && at.edge + 1 < chain.pts.length - 1 && Math.abs(s - chain.cum[at.edge + 1]!) < 1e-9 && edgeKind(edgeNormal(chain, at.edge + 1)) === want) kind = want;
  return { w: fromPlane(at.p, origin, heading), kind, s: Math.min(chain.total, Math.max(0, s)), chain, origin, heading, drop: dropRay(at.p, kind, origin, heading, st.asm!.radius * 2 + 1) };
}

/**
 * ⭐ The point `w` brought onto the RED section through it (the vertical plane at `heading` through `w` — ⭐⭐⭐ Step 4: a WORLD plane, `redHeading`) — onto
 * its edges of `kind` when given (a top kept on a top); `null`: no section there.
 */
function onRed(st: SceneState, heading: number, w: Vec3, kind?: EdgeKind): Carrier | null {
  const origin = redOrigin(w, st.asm!.centre, heading);
  const chain = chainFor(st, heading, origin);
  if (chain === null) return null;
  const p = toPlane(w, origin, heading);
  return redAt(st, heading, chain, origin, kind === undefined ? nearestOnChain(chain, p) : nearestOfKind(chain, p, kind), kind);
}

/**
 * ⭐⭐ (2026-11-04, Step 4) `onRed` — and when the plane through `w` grazes the parts (a point on a thin top's very edge: the painting's top strip is 33 mm
 * deep), through `w` moved toward the assembly's axis by 2, 5, 10 mm; still nothing: `null`. `inFirst`: 10 mm in FIRST (a plane taken once, at a heading's
 * change: ⛔ through the point itself it grazed the painting's back edge, 0.5 mm outside, and cut only a part behind it) — never for a step taken every frame
 * (the plane would creep to the axis).
 */
function onRedNear(st: SceneState, heading: number, w: Vec3, kind?: EdgeKind, inFirst = false): Carrier | null {
  const c = st.asm!.centre;
  const r = Math.hypot(c[0] - w[0], c[2] - w[2]);
  for (const k of inFirst ? [0.01, 0.005, 0.002, 0] : [0, 0.002, 0.005, 0.01]) {
    const t = r > 0 ? Math.min(1, k / r) : 0;
    const out = onRed(st, heading, [w[0] + (c[0] - w[0]) * t, w[1], w[2] + (c[2] - w[2]) * t], kind);
    if (out !== null) return out;
  }
  return null;
}

/**
 * ⭐ The carrier carried round the GREEN loop at its height by the yaw's step, its red section the plane through it. ⭐⭐⭐ (2026-11-04, `1.0.95-`)
 * SYNCHRONIZED WITH THE ORBIT: its place is the yaw's own (`loopAtYaw` — each edge a slice of the turn), reached without a jump when out of step
 * (`syncStep`) — ⛔ by distance (`loopStep`, `greenPace`), it ran ahead of or behind the yaw, waited at corners, and a rounding step short of one ran onto
 * a face turned away.
 */
function onGreen(st: SceneState, c: Carrier, yaw: number, dYaw: number): Carrier | null {
  const loop = loopFor(st, c.w[1]);
  if (loop === null) return null;
  const s0 = nearestOnChain(loop, [c.w[0], c.w[2]]);
  const s1 = syncStep(loop, s0, yaw, dYaw);
  const at = chainAt(loop, s1);
  const w: Vec3 = [at.p[0], c.w[1], at.p[1]];
  // ⭐⭐⭐ (2026-11-04, Step 4) the red plane square to the face's level axis there (round a vertical edge it turns with the face: the plane carried over)
  const red = onRed(st, redHeading(greenNormal(loop, at.edge), yaw), w);
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
    c = onRed(st, redHeading(st.asmG !== null ? (st.gizmoNormal ?? null) : (castGizmo(st, u)?.normal ?? null), yaw), from);
    if (c === null) return castGizmo(st, u);
  }
  let green = false;
  if (dYaw !== 0 && st.asmCarrier !== null) {
    const next = c.kind === "SIDE" ? onGreen(st, c, yaw, dYaw) : onRedNear(st, redHeading(null, yaw), turnAbout(c.w, a.centre, dYaw), c.kind);
    green = next !== null && c.kind === "SIDE";
    c = next ?? c;
  }
  if (dPitch !== 0) {
    // ⭐⭐⭐ (2026-11-04, Step 4) over a top / under a bottom, the dy's plane the yaw's world plane (`redHeading`) — ⛔ a plane kept from an earlier heading took
    // the gizmo down a face the piece did not look at (the front, the piece at −x: every drop turned away, held)
    // — taken only where it keeps the carrier within 10 mm (⛔ the new plane through a thin top's edge, past gaps, put it on another part 68 mm off: the
    // gizmo jumped 270 mm; the polar turn that led there is Step 5's)
    if (c.kind !== "SIDE" && redHeading(null, yaw) !== c.heading) {
      const r = onRedNear(st, redHeading(null, yaw), c.w, c.kind, true);
      if (r !== null && Math.hypot(r.w[0] - c.w[0], r.w[1] - c.w[1], r.w[2] - c.w[2]) <= RETAKE_M) c = r;
    }
    c = redAt(st, c.heading, c.chain, c.origin, chainStep(c.chain, c.s, redPace(c.chain, c.s, pitch - dPitch, dPitch), pitch)); // ⭐⭐⭐ (2026-11-04, Step 3) the loop's pace
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
    const red = onRed(st, c.heading, h.point);
    if (red !== null) st.asmCarrier = { ...c, chain: red.chain, origin: red.origin, s: red.s, heading: red.heading };
  }
  return h;
}

/**
 * ⭐⭐ THE PIECE'S PLACE from the orbit's centre (the shown gizmo) at an orbit place — `ringPlaceNow`'s in this mode, the solver's queries included: its
 * own gizmo for that direction + the direction × the approach's distance (`approach`: the state's by default).
 */
export function placeOffset(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const u = dirAt(st, yaw, v);
  const d = approachDistance(st.cfg, approach);
  const g = footOf(st, gizmoFor(st, u), u, d); // ⭐⭐⭐ (2026-11-04, Step 2) from the gizmo's FOOT on the shell
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
    st.asmLock = { point: [t[0], t[1], t[2]], normal: n, host: st.gizmoHost ?? null, cone: n === null ? null : lockCone(st.asmLock?.cone ?? null, angleTo(orbitDir(q0.yaw, q0.v), n)) };
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmGizmoAt = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    return;
  }
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = orbitDir(q.yaw, q.v);
  const d = approachDistance(st.cfg, st.approach);
  // ⭐⭐⭐ (2026-10-29) the gizmo from its CARRIER on the sections' hulls (`carrierFrame`): the yaw's and the pitch's steps since the last frame
  const prev = st.asmPrevQ ?? q;
  st.asmPrevQ = { yaw: q.yaw, v: q.v };
  let hit: GizmoHit | null = null;
  if (!st.asmLocked) {
    hit = carrierFrame(st, q.yaw, q.v, Math.atan2(Math.sin(q.yaw - prev.yaw), Math.cos(q.yaw - prev.yaw)), pitchOfV(q.v) - pitchOfV(prev.v), u);
    if (hit !== null) {
      st.asmG = hit.point;
      // ⭐⭐⭐ (2026-11-02) the lines are drawn from the carrier of this ACCEPTED drop — a held one holds them with the gizmo (⛔ they went on with the carrier)
      st.asmShown = st.asmCarrier === null ? null : { c: st.asmCarrier, yaw: q.yaw };
    }
  }
  const g0 = st.asmLocked && st.asmLock !== null ? st.asmLock.point : (st.asmG ?? st.asmGizmo ?? a.centre);
  // ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 1 (a); the owner: *"deleting the lock at step 1 is cleaner"*) — THE CLOSE-IN LOCK DELETED: the
  // carrier runs at EVERY distance (⛔ the old lock: within 30 cm of the gizmo, or inside the assembly's sphere, the gizmo and its face were held — one
  // behaviour far out, another close in). `st.asmLocked` is now the SLIDE's hold only (set under a hover, above).
  const was = st.asmLocked;
  st.asmLocked = false;
  if (was) {
    // ⭐ off the slide: the carrier found again from the slide's gizmo, projected into the yaw plane (⛔ 2026-10-28 carried on from the held point — off the
    // yaw plane by the slide: the gizmo off the red section from then on)
    st.asmG = st.asmLock !== null ? st.asmLock.point : st.asmG;
    st.asmCarrier = null;
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
  st.asmGizmo = st.asmGizmo === null ? [foot[0], foot[1], foot[2]] : easePoint(st.asmGizmo, foot, dtMs, GIZMO_TAU_MS);
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
  const parts = st.asmParts?.key ?? "";
  const reach = a.radius * 2 + 1;
  const drop = (r: SectionRay): Vector3 | null => {
    const h = castRay(st, r);
    return h === null ? null : new Vector3(h.point[0] - r.dir[0] * SECTION_LIFT_M, h.point[1] - r.dir[1] * SECTION_LIFT_M, h.point[2] - r.dir[2] * SECTION_LIFT_M);
  };
  // the red's fixed samples (per yaw and origin)
  const ch = c.chain;
  const rKey = sectionRedKey(parts, c.heading, c.origin);
  if (st.asmRedCache === null || st.asmRedCache.key !== rKey) {
    const params = sectionFixed(ch.total, RED_SAMPLES - 1, false);
    st.asmRedCache = { key: rKey, params, pts: params.map((x) => drop(redAt(st, c.heading, ch, c.origin, x).drop)) };
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
      st.asmGreenCache = { key: gKey, params, pts: params.map((th) => { const r = onRed(st, redHeading(null, th), turnAbout(c.w, a.centre, th - yaw), c.kind); return r === null ? null : drop(r.drop); }) };
    } else st.asmGreenCache = { key: gKey, params: [], pts: [] };
  }
  // ⭐⭐⭐ the gizmo's EXACT point — the accepted drop — inserted in both: the ring is a vertex of each line, at every frame
  const gv = new Vector3(g[0] - c.drop.dir[0] * SECTION_LIFT_M, g[1] - c.drop.dir[1] * SECTION_LIFT_M, g[2] - c.drop.dir[2] * SECTION_LIFT_M);
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
  // ⭐⭐ (2026-10-28) the offsets in the camera's own frame, never faded — the same whichever face hosts the gizmo (`offsetFrame`)
  // ⭐ (2026-10-29) its heading the ORBIT's yaw, always (⛔ the direction's own — locked and turned into the cone at −90° it switched from the yaw to the
  // face's heading at once: the scene jump-rotated; and at ±90° it has none)
  return offsetFrame(u, cam.yaw, o.yawRad, o.pitchRad);
}

/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const a1 = angleTo(orbitDir(yaw1, v1), n);
  return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(orbitDir(yaw0, v0), n);
}
