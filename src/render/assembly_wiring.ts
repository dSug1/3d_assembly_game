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
import { angleTo, approachDir, approachDistance, approachStep, coneClamp, easePoint, faceSwitches, farDistance, lookShare, nextLock, offsetFrame, orbitDir, pitchOfV, rayOffsets, vOfPitch } from "../input/assembly_orbit";
import { chainAt, chainStep, dropRay, edgeKind, edgeNormal, faceTurnedAway, facingChain, greenYaws, hull2, nearestOnChain, redSamples, remapOnChain, sectionPoints, toPlane, type EdgeKind, type P2, type SectionChain, type SectionRay } from "../input/section_hull";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { rigPlace, type RigCameraFrame } from "../input/orbit_rig";
import type { CameraAngleOffset, OrbitAt } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { syncCentre } from "./camera_rig";
import { orbitDvPerMm, pieceSolveOptions, pieceSolverEnv, ringAnchorAt } from "./green_box_wiring";
import type { SceneState } from "./scene_state";
import type { Vec3 } from "../core/vec";

/** ⭐ The ray's beside-rays' distance (m): a gap between parts narrower than this is bridged (the painting's cores sit 3 mm apart). */
const RAY_COVER_M = 0.004;
/** ⭐ The shown gizmo's ease to a new point (ms) — a step in depth eased, never a jump; the look point's. */
const GIZMO_TAU_MS = 90;
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
    if (r?.hit && r.pickedPoint !== null && (best === null || r.distance < best.d)) {
      // ⭐ the centre ray's own point (on the ray); a beside-ray only says how far out the surface is there
      const along = r.distance;
      const point: Vec3 = [a.centre[0] + u[0] * (out - along), a.centre[1] + u[1] * (out - along), a.centre[2] + u[2] * (out - along)];
      const nn = r.getNormal(true);
      best = { d: along, hit: { point, normal: nn ? [nn.x, nn.y, nn.z] : null, host: r.pickedMesh ? (st.idOf.get(r.pickedMesh) ?? null) : null } };
    }
  }
  const hit = best?.hit ?? null;
  if (st.asmRayCache.size > 512) st.asmRayCache.clear();
  st.asmRayCache.set(key, hit);
  return hit;
}

/**
 * ⭐ The piece's direction at the orbit place and the approach `approach` — locked, kept in the face's cone (`coneClamp`) and, inside the lock's distance,
 * onto the OLD 2D CURVE (`approachDir`, 2026-10-29; ⛔ straight in along the orbit's direction).
 */
function dirAt(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const u = orbitDir(yaw, v);
  const n = st.asmLocked && st.asmLock !== null ? st.asmLock.normal : null;
  return n === null ? u : approachDir(coneClamp(u, n), yaw, n, st.cfg, approach, st.cfg.assemblyLockDistM);
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
  return { point: [hit.pickedPoint.x, hit.pickedPoint.y, hit.pickedPoint.z], normal: nn ? [nn.x, nn.y, nn.z] : null, host: hit.pickedMesh ? (st.idOf.get(hit.pickedMesh) ?? null) : null };
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
      const v = Vector3.TransformCoordinates(new Vector3(pos[i]!, pos[i + 1]!, pos[i + 2]!), w);
      const k = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      vs.push([v.x, v.y, v.z]);
    }
    if (vs.length > 0) parts.push(vs);
  }
  st.asmParts = { key, parts };
  return st.asmParts;
}

/** ⭐ The facing half of the hull of the yaw plane's section at `yaw` (`input/section_hull.ts`), cached for the yaw and the placed set; `null`: none. */
function chainFor(st: SceneState, yaw: number): SectionChain | null {
  const parts = placedParts(st);
  const key = `${parts.key}#${yaw.toFixed(9)}`;
  if (st.asmChain !== null && st.asmChain.key === key) return st.asmChain.chain;
  const chain = facingChain(hull2(sectionPoints(parts.parts, st.asm!.centre, yaw)));
  st.asmChain = { key, chain };
  return chain;
}

/** ⭐ The carrier at arc length `s` of `chain`: its point, its edge's kind. */
function carrierAt(chain: SectionChain, s: number): { readonly s: number; readonly p: P2; readonly kind: EdgeKind; readonly chain: SectionChain } {
  const at = chainAt(chain, s);
  return { s: Math.min(chain.total, Math.max(0, s)), p: at.p, kind: edgeKind(edgeNormal(chain, at.edge)), chain };
}

/**
 * ⭐⭐⭐ (2026-10-29) THE CARRIER'S FRAME (unlocked): the carrier found again on this yaw plane's chain (a yaw step: `remapOnChain`; the start, or after a
 * lock or a hover: from the gizmo as it was, projected into the plane), slid by the pitch's step (`chainStep` — the assembly's half-size per radian,
 * clamped at the bottom and top centres, never into an edge turned away from the piece), then DROPPED onto the real surface (`dropRay`). A drop that
 * misses or lands on a face turned away from the piece leaves the gizmo where it was (the carrier goes on). Returns the hit (`null`: the gizmo held).
 */
function carrierFrame(st: SceneState, yaw: number, v: number, dPitch: number, u: Vec3): GizmoHit | null {
  const a = st.asm!;
  const chain = chainFor(st, yaw);
  if (chain === null) return castGizmo(st, u);
  let c = st.asmCarrier;
  if (c === null) {
    const from = st.asmG ?? castGizmo(st, u)?.point ?? null;
    c = carrierAt(chain, from === null ? chain.total / 2 : nearestOnChain(chain, toPlane(from, a.centre, yaw)));
  } else if (c.chain !== chain) c = carrierAt(chain, remapOnChain(chain, c.p, c.kind));
  if (dPitch !== 0) c = carrierAt(chain, chainStep(chain, c.s, a.radius * dPitch, pitchOfV(v)));
  st.asmCarrier = c;
  const h = castRay(st, dropRay(c.p, c.kind, a.centre, yaw, a.radius * 2 + 1));
  if (h === null) return null;
  if (faceTurnedAway(h.normal, u)) {
    st.lastVerdict = "orbit: the gizmo's drop lands on a face turned away from the piece — held";
    return null;
  }
  return h;
}

/**
 * ⭐⭐ THE PIECE'S PLACE from the orbit's centre (the shown gizmo) at an orbit place — `ringPlaceNow`'s in this mode, the solver's queries included: its
 * own gizmo for that direction + the direction × the approach's distance (`approach`: the state's by default).
 */
export function placeOffset(st: SceneState, yaw: number, v: number, approach: number = st.approach): Vec3 {
  const u = dirAt(st, yaw, v, approach);
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
  if (st.hover !== null) {
    const t = st.centreBlend.targetM;
    st.asmLocked = true;
    st.asmCarrier = null; // ⭐ (2026-10-29) back out, the carrier found again from the gizmo, in the yaw plane as it is then
    st.asmLock = { point: [t[0], t[1], t[2]], normal: st.gizmoNormal ?? null, host: st.gizmoHost ?? null };
    st.asmGizmo = [t[0], t[1], t[2]];
    st.asmLook = [t[0], t[1], t[2]];
    return;
  }
  if (st.approachInertia.coasting) {
    const s = st.approachInertia.step(dtMs, st.cfg.boxSmoothMs * 4);
    approachMove(st, s.dV);
  }
  const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const u = orbitDir(q.yaw, q.v);
  const d = approachDistance(st.cfg, st.approach);
  // ⭐⭐⭐ (2026-10-29) the gizmo from its CARRIER on the section's hull (`carrierFrame`): the yaw plane's chain, the pitch's step since the last frame
  const prev = st.asmPrevQ ?? q;
  st.asmPrevQ = { yaw: q.yaw, v: q.v };
  let hit: GizmoHit | null = null;
  if (!st.asmLocked) {
    hit = carrierFrame(st, q.yaw, q.v, pitchOfV(q.v) - pitchOfV(prev.v), u);
    if (hit !== null) st.asmG = hit.point;
  }
  const g0 = st.asmLocked && st.asmLock !== null ? st.asmLock.point : (st.asmG ?? st.asmGizmo ?? a.centre);
  const piece: Vec3 = [g0[0] + u[0] * d, g0[1] + u[1] * d, g0[2] + u[2] * d];
  const toCentre = Math.hypot(piece[0] - a.centre[0], piece[1] - a.centre[1], piece[2] - a.centre[2]);
  const was = st.asmLocked;
  st.asmLocked = nextLock(was, toCentre, d, a.radius, st.cfg.assemblyLockDistM);
  if (st.asmLocked && !was) {
    // ⭐ the lock: the gizmo where it is now, its face the one it has
    st.asmLock = { point: [g0[0], g0[1], g0[2]], normal: st.gizmoNormal ?? hit?.normal ?? null, host: st.gizmoHost ?? hit?.host ?? null };
    st.asmCarrier = null; // ⭐ (2026-10-29) the piece turns about the locked gizmo: back out, the carrier found again in the yaw plane as it is then
    st.lastVerdict = "orbit: close in — the gizmo and its face locked";
  } else if (!st.asmLocked && was) {
    // ⭐ unlocked: the carrier found again from the locked gizmo, projected into the yaw plane (⛔ 2026-10-28 carried on from the locked point — off the
    // yaw plane by the locked orbit's turn, or by the hover's slide: the gizmo off the red section from then on)
    st.asmG = st.asmLock !== null ? st.asmLock.point : st.asmG;
    st.asmCarrier = null;
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
  // ⭐ the shown gizmo eased to its point; the orbit's centre IS it
  const target = st.asmLocked && st.asmLock !== null ? st.asmLock.point : g0;
  st.asmGizmo = st.asmGizmo === null ? [target[0], target[1], target[2]] : easePoint(st.asmGizmo, target, dtMs, GIZMO_TAU_MS);
  st.centreBlend.snapTo(st.asmGizmo);
  syncCentre(st);
  // ⭐ the look point: the centre far out, the gizmo close in
  const w = lookShare(d, farDistance(st.cfg), st.cfg.assemblyLockDistM, st.asmLocked);
  const g = st.asmGizmo;
  const lt: Vec3 = [a.centre[0] + (g[0] - a.centre[0]) * w, a.centre[1] + (g[1] - a.centre[1]) * w, a.centre[2] + (g[2] - a.centre[2]) * w];
  st.asmLook = st.asmLook === null ? lt : easePoint(st.asmLook, lt, dtMs, LOOK_TAU_MS);
  sectionLinesFrame(st, q.yaw);
}

/** ⭐ The section lines' samples (the green round the circle, the red along the chain), and how often they may be recast (ms). */
const GREEN_SAMPLES = 96;
const RED_SAMPLES = 64;
const SECTION_EVERY_MS = 100;
/** ⭐ The lines lifted off the surface toward their ray's origin (m) — never in it. */
const SECTION_LIFT_M = 0.002;

/**
 * ⭐⭐ (the optional) THE SECTIONS DRAWN — the paths the gizmo takes (`redSamples`, `greenYaws`): the RED one, the carrier's chain dropped onto the surface
 * (bottom centre → top centre — the half the gizmo can travel); the GREEN one, the gizmo's own drop at every yaw (on a side at its height, on a top / bottom
 * at its distance from the axis) — so the gizmo lies on both lines. Recast only when the yaw, the carrier or the placed set changed (at most every
 * `SECTION_EVERY_MS`); hidden locked, under a hover, or off. ⭐ ONE mesh of a fixed vertex count, updated in place (a segment not drawn: collapsed) —
 * ⛔ (2026-10-29) rebuilt every 100 ms, its new material was not ready for its first frames: the lines missing from 27 of 106 frames, *"flickering all the
 * time"*.
 */
function sectionLinesFrame(st: SceneState, yaw: number): void {
  const c = st.asmCarrier;
  const show = st.cfg.sectionLines === 1 && !st.asmLocked && st.hover === null && st.asmG !== null && c !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const key = `${st.asmParts?.key ?? ""}#${yaw.toFixed(6)}#${c.s.toFixed(6)}#${c.kind}#${st.asmG![1].toFixed(5)}`;
  const now = performance.now();
  if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = true;
  if (st.asmSectionLines !== null && (key === st.asmSectionKey || now - st.asmSectionAt < SECTION_EVERY_MS)) return;
  st.asmSectionAt = now;
  st.asmSectionKey = key;
  const a = st.asm!;
  const reach = a.radius * 2 + 1;
  const drop = (r: SectionRay): Vector3 | null => {
    const h = castRay(st, r);
    return h === null ? null : new Vector3(h.point[0] - r.dir[0] * SECTION_LIFT_M, h.point[1] - r.dir[1] * SECTION_LIFT_M, h.point[2] - r.dir[2] * SECTION_LIFT_M);
  };
  const g = st.asmG!;
  const rest = new Vector3(g[0], g[1], g[2]);
  const lines: Vector3[][] = [];
  // ⭐ green: the gizmo's drop at every yaw (a side: at its height; a top / bottom: at its distance from the axis), a closed loop
  const at: P2 = c.kind === "SIDE" ? [0, c.p[1]] : [c.p[0], 0];
  const green = greenYaws(yaw, GREEN_SAMPLES).map((y) => drop(dropRay(at, c.kind, a.centre, y, reach)));
  for (let k = 0; k < GREEN_SAMPLES; k++) {
    const p0 = green[k] ?? null;
    const p1 = green[(k + 1) % GREEN_SAMPLES] ?? null;
    lines.push(p0 !== null && p1 !== null ? [p0, p1] : [rest, rest]);
  }
  // ⭐ red: the chain's carriers dropped; a step in depth (a hidden stretch skipped) breaks the line
  const ch = c.chain;
  const step = ch.total / (RED_SAMPLES - 1);
  const red = redSamples(ch.total, c.s, RED_SAMPLES).map((s) => {
    const k = carrierAt(ch, s);
    return drop(dropRay(k.p, k.kind, a.centre, yaw, reach));
  });
  for (let k = 0; k < RED_SAMPLES - 1; k++) {
    const p0 = red[k] ?? null;
    const p1 = red[k + 1] ?? null;
    lines.push(p0 !== null && p1 !== null && Vector3.Distance(p0, p1) <= 2.5 * step + 0.002 ? [p0, p1] : [rest, rest]);
  }
  if (st.asmSectionLines === null) {
    const colours = lines.map((_, i) => (i < GREEN_SAMPLES ? [new Color4(0.35, 0.8, 0.35, 1), new Color4(0.35, 0.8, 0.35, 1)] : [new Color4(0.9, 0.25, 0.2, 1), new Color4(0.9, 0.25, 0.2, 1)]));
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
 * ⭐⭐ THE APPROACH MOVED by `da` (the coordinate; down: in): out freely; in only as far as the parts allow — the piece's gap kept at its resting gap
 * (`pieceGapMm`), the largest free share found by halving. Returns the move taken.
 */
export function approachMove(st: SceneState, da: number): number {
  if (da === 0) return 0;
  const a0 = st.approach;
  const want = approachStep(a0, da, 1, st.cfg);
  if (want >= a0 || st.pieceQ === null || st.greenBox === null) {
    st.approach = want;
    return want - a0;
  }
  const q = st.pieceQ;
  const gapM = pieceSolveOptions(st).gapM;
  const free = (cand: number): boolean => {
    const env = pieceSolverEnv(st, (qq) => {
      const keep = st.approach;
      st.approach = cand;
      const p = ringAnchorAt(st, qq);
      st.approach = keep;
      return p;
    });
    return env.gap(q) >= gapM;
  };
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
  return st.approach - a0;
}

/** ⭐ An approach input: `dyMm` of finger (UP brings the piece IN), at the orbit dy's pace on the curve's coordinate; recorded for the coast. */
export function approachInput(st: SceneState, dyMm: number): void {
  const taken = approachMove(st, dyMm * orbitDvPerMm(st));
  st.approachInertia.record(performance.now(), 0, taken);
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
  // ⭐ (2026-10-29) at ±90° the direction has no heading of its own: the orbit's yaw
  return offsetFrame(u, Math.hypot(u[0], u[2]) > 1e-6 ? Math.atan2(u[2], u[0]) : cam.yaw, o.yawRad, o.pitchRad);
}

/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const a1 = angleTo(orbitDir(yaw1, v1), n);
  return a1 > (80 * Math.PI) / 180 && a1 > angleTo(orbitDir(yaw0, v0), n);
}
