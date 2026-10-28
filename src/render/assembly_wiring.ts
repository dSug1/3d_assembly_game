/**
 * ⭐⭐⭐ prototype — **THE ORBIT AROUND THE ASSEMBLY, WIRED** (2026-10-28; the rules are `input/assembly_orbit.ts`'s). On while `orbitMode` is 0 (1: the
 * gizmo's 2D curve as built to 2026-10-25, kept whole). The centre the rest of the orbit reads (`orbitCentreM` — the quads, the hover, the markers) IS the
 * GIZMO, moved here every frame: CARRIED along the assembly's sections by the orbit's steps (`carryGizmo`; first found where the ray from the piece toward
 * the fixed CENTRE, `st.asm`, meets a placed part — `castGizmo` — and again if its face turns away from the piece), eased over a step; LOCKED close in; the
 * sections drawn (`sectionLinesFrame`). The piece's place from it (`placeOffset`, read by `ringPlaceNow` — the solver's queries too) is its direction × the
 * approach's distance; the approach (two fingers' dy, Shift + drag's) checked against the parts (`approachMove`), with its own coast. The camera's frame
 * (`assemblyCameraFrame`), its look point (`st.asmLook`: the centre far out, the gizmo close in). ⛔ No rule here.
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { angleTo, approachDistance, approachStep, coneClamp, easePoint, faceSwitches, faceTurnedAway, farDistance, greenSectionDirs, lookShare, nextLock, offsetFrame, orbitDir, pitchSlide, pitchOfV, radialRay, rayOffsets, redSectionDirs, sectionRay, vOfPitch, yawAbout, type SectionRay } from "../input/assembly_orbit";
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

/** ⭐ The piece's direction at the orbit place — locked, kept in the face's cone (`coneClamp`). */
function dirAt(st: SceneState, yaw: number, v: number): Vec3 {
  const u = orbitDir(yaw, v);
  const n = st.asmLocked && st.asmLock !== null ? st.asmLock.normal : null;
  return n === null ? u : coneClamp(u, n);
}

/**
 * ⭐ The gizmo a query of the piece's place reads: locked, the locked point; else the gizmo CARRIED along the sections (`st.asmG`, moved once a frame by the
 * orbit's steps — ⛔ 2026-10-28 the ray toward the centre for each direction); none yet, the ray's.
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

/**
 * ⭐⭐⭐ THE GIZMO CARRIED ALONG THE SECTIONS by one orbit step (`dYaw`, `dPitch`, at `yaw`): turned about the assembly's axes and dropped back onto the surface
 * (`sectionRay`: the yaw at constant height — the green section — or onto a top face; the pitch along the face's normal — the red section); a miss, the radial
 * ray through the turned point (the section's next face, past an edge); still nothing, the gizmo stays. Returns the hit (`null`: unchanged).
 */
function carryGizmo(st: SceneState, g: Vec3, n: Vec3, yaw: number, dYaw: number, dPitch: number): GizmoHit | null {
  const a = st.asm!;
  const reach = a.radius * 2 + 1;
  let p = g;
  let face = n;
  let last: GizmoHit | null = null;
  if (dYaw !== 0) {
    const turned = yawAbout(p, a.centre, dYaw);
    const h = castRay(st, sectionRay("YAW", turned, face, a.centre, reach)) ?? castRay(st, radialRay(turned, a.centre, reach));
    if (h !== null) {
      last = h;
      p = h.point;
      if (h.normal !== null) face = h.normal;
    }
  }
  if (dPitch !== 0) {
    const turned = pitchSlide(p, face, yaw, dPitch, a.radius);
    const h = castRay(st, sectionRay("PITCH", turned, face, a.centre, reach)) ?? castRay(st, radialRay(turned, a.centre, reach));
    if (h !== null) last = h;
  }
  return last;
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
  if (st.hover !== null) {
    const t = st.centreBlend.targetM;
    st.asmLocked = true;
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
  // ⭐⭐⭐ (2026-10-28) the gizmo CARRIED along the sections by the orbit's step since the last frame (`carryGizmo`); the first frame, and the safety resync
  // (its face turned away from the piece — `faceTurnedAway`), the ray toward the centre
  const prev = st.asmPrevQ ?? q;
  st.asmPrevQ = { yaw: q.yaw, v: q.v };
  let hit: GizmoHit | null = null;
  if (!st.asmLocked) {
    const dYaw = Math.atan2(Math.sin(q.yaw - prev.yaw), Math.cos(q.yaw - prev.yaw));
    const dPitch = pitchOfV(q.v) - pitchOfV(prev.v);
    if (st.asmG === null || st.gizmoNormal === null || st.gizmoNormal === undefined) hit = castGizmo(st, u);
    else if (dYaw !== 0 || dPitch !== 0) hit = carryGizmo(st, st.asmG, st.gizmoNormal, q.yaw, dYaw, dPitch);
    if (hit !== null && faceTurnedAway(hit.normal, u)) {
      hit = castGizmo(st, u) ?? hit;
      st.lastVerdict = "orbit: the gizmo's face turned away from the piece — found again on the ray toward the centre";
    }
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
    st.lastVerdict = "orbit: close in — the gizmo and its face locked";
  } else if (!st.asmLocked && was) {
    // ⭐ unlocked: carried on from where it was locked
    st.asmG = st.asmLock !== null ? st.asmLock.point : st.asmG;
    st.asmLock = null;
    st.lastVerdict = "orbit: back out — the gizmo carried along the sections again";
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

/** ⭐ The section lines' samples a section, and how often they are recast (ms). */
const SECTION_SAMPLES = 96;
const SECTION_EVERY_MS = 100;
/** ⭐ The lines lifted off the surface toward their ray's origin (m) — never in it. */
const SECTION_LIFT_M = 0.002;

/**
 * ⭐⭐ (the optional) THE SECTIONS DRAWN — the GREEN one (the horizontal plane at the gizmo's height; just under a top face's, just over a bottom's) and the
 * RED one (the yaw plane through the centre): `SECTION_SAMPLES` rays each from outside toward the axis / the centre, their first hits joined; recast every
 * `SECTION_EVERY_MS` while unlocked (`sectionLines` 1), hidden locked, under a hover, or off.
 */
function sectionLinesFrame(st: SceneState, yaw: number): void {
  const show = st.cfg.sectionLines === 1 && !st.asmLocked && st.hover === null && st.asmG !== null;
  if (!show) {
    if (st.asmSectionLines !== null) st.asmSectionLines.isVisible = false;
    return;
  }
  const now = performance.now();
  if (st.asmSectionLines !== null && now - st.asmSectionAt < SECTION_EVERY_MS) {
    st.asmSectionLines.isVisible = true;
    return;
  }
  st.asmSectionAt = now;
  const a = st.asm!;
  const g = st.asmG!;
  const n = st.gizmoNormal ?? null;
  const reach = a.radius * 2 + 1;
  const y = n !== null && Math.abs(n[1]) > Math.SQRT1_2 ? g[1] - Math.sign(n[1]) * 0.002 : g[1];
  const loop = (pts: (Vec3 | null)[]): Vector3[][] => {
    // ⭐ consecutive hits joined; a miss breaks the line (a section that does not close round the assembly)
    const out: Vector3[][] = [];
    let run: Vector3[] = [];
    for (const p of [...pts, pts[0] ?? null]) {
      if (p === null) {
        if (run.length > 1) out.push(run);
        run = [];
      } else run.push(new Vector3(p[0], p[1], p[2]));
    }
    if (run.length > 1) out.push(run);
    return out;
  };
  const green = greenSectionDirs(SECTION_SAMPLES).map((h) => {
    const r: SectionRay = { origin: [a.centre[0] + h[0] * reach, y, a.centre[2] + h[2] * reach], dir: [-h[0], 0, -h[2]], length: reach * 2 };
    const hit = castRay(st, r);
    return hit === null ? null : ([hit.point[0] + h[0] * SECTION_LIFT_M, hit.point[1], hit.point[2] + h[2] * SECTION_LIFT_M] as Vec3);
  });
  const red = redSectionDirs(yaw, SECTION_SAMPLES).map((dd) => {
    const hit = castRay(st, { origin: [a.centre[0] + dd[0] * reach, a.centre[1] + dd[1] * reach, a.centre[2] + dd[2] * reach], dir: [-dd[0], -dd[1], -dd[2]], length: reach * 2 });
    return hit === null ? null : ([hit.point[0] + dd[0] * SECTION_LIFT_M, hit.point[1] + dd[1] * SECTION_LIFT_M, hit.point[2] + dd[2] * SECTION_LIFT_M] as Vec3);
  });
  const lines = [...loop(green), ...loop(red)];
  const colours = [...loop(green).map((l) => l.map(() => new Color4(0.35, 0.8, 0.35, 1))), ...loop(red).map((l) => l.map(() => new Color4(0.9, 0.25, 0.2, 1)))];
  st.asmSectionLines?.dispose();
  st.asmSectionLines = lines.length === 0 ? null : CreateLineSystem("asmSections", { lines, colors: colours }, st.scene);
  if (st.asmSectionLines !== null) {
    st.asmSectionLines.isPickable = false;
    st.asmSectionLines.isVisible = true;
    // ⭐ in the TRANSPARENT pass, after the pieces' see-through contours (⛔ opaque, the contours drawn over them washed them out); hidden behind solid parts
    st.asmSectionLines.alpha = 0.99;
    st.asmSectionLines.alphaIndex = 1000;
  }
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
  return offsetFrame(u, Math.atan2(u[2], u[0]), o.yawRad, o.pitchRad);
}

/** ⭐ Locked: does an orbit step from (`yaw0`, `v0`) to (`yaw1`, `v1`) leave the face's cone further? (it is then refused) */
export function leavesCone(st: SceneState, yaw0: number, v0: number, yaw1: number, v1: number): boolean {
  if (!st.asmLocked || st.asmLock === null || st.asmLock.normal === null) return false;
  const n = st.asmLock.normal;
  const a1 = angleTo(orbitDir(yaw1, v1), n);
  return a1 > (80 * Math.PI) / 180 && a1 > angleTo(orbitDir(yaw0, v0), n);
}
