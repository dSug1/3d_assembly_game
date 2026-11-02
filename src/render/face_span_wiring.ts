/**
 * ⭐⭐⭐ (2026-11-02, branch `1.0.90-`) **THE FACE-SPAN GIZMO, WIRED** — the rules are `input/face_span.ts`'s; this file holds the state and the calls
 * (`FACE_SPAN_2026-11-02.md`). Within the engage distance (`faceSpanEngageM`) the gizmo is a point on the hosting face's plane, moved by the ORBIT's own
 * step (the finger's and the coast's — read here each frame and the orbit put back: its place is held, `green_box_wiring.ts`), the piece straight out
 * along the face's normal, the camera behind it (square to the face, a wall's verticals the world's), the red and green lines across the coplanar faces.
 * At an edge: the catch, then the wrap onto the face across, turned by the finger's travel. ⛔ No rule here.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import type { Vec3 } from "../core/vec";
import { faceWorld } from "../core/object_model";
import { goalLocked } from "../input/goal_lock";
import { frameSteps, fromFrame, signAfter, frameAngles, toFrame } from "../input/orbit_frame";
import { pitchOfV } from "../input/assembly_orbit";
import { orbitDegPerMm } from "../input/follow_camera";
import {
  axisOnScreen,
  coveredTop,
  fromP2,
  heightOf,
  intoRegion,
  isWall,
  levelAxes,
  onPlane,
  regionArea,
  regionDistance,
  regionInside,
  regionRun,
  rideStep,
  SPAN_LINE_LIFT_M,
  SPAN_RIDE_SLAB_M,
  spanAxes,
  spanDirection,
  spanMmOf,
  spanMove,
  spanPlane,
  spanPolyline,
  spanRegion,
  spanShareAfter,
  spanSolids,
  spanStepOf,
  spanUp,
  toP2,
  toPlaneDir,
  turnVec,
  wrapCandidate,
  wrapTurn,
  type P2,
  type SpanFace,
  type SpanMotion,
  type SpanPlane,
  type SpanRegion,
  type SpanSolid,
  type Tri,
} from "../input/face_span";
import { faceTrianglesWorld } from "./hover_wiring";
import type { SceneState } from "./scene_state";

/** ⭐ The face-span's state (`st.span`). */
export interface SpanState {
  plane: SpanPlane;
  region: SpanRegion;
  solids: SpanSolid[];
  /** the face it was seeded on (an index into `st.spanFaces`) and its part */
  face: number;
  host: string;
  /** the finger's axes on the face (world, unit): where a +yaw and a +pitch of the orbit move the gizmo */
  eYaw: Vec3;
  ePitch: Vec3;
  /** the screen's up carried in (a top's, a bottom's — a wall's is the world's) */
  upRef: Vec3;
  motion: SpanMotion;
  /** the wrap's turn about the edge, under way */
  turn: { readonly axis: Vec3; readonly angle: number } | null;
  /** the ridden height shown (m in front of the plane) */
  ride: number;
  /** the far orbit's direction at the engage, and the engage's blend (0 … 1) */
  u0: Vec3 | null;
  engage: number;
  /** this frame: the piece's direction, the screen's up, the gizmo (world), the finger's travel the orbit's step was worth (mm) */
  w: Vec3;
  up: Vec3;
  g: Vec3;
  stepMm: number;
  /** a slide took the gizmo meanwhile (found again on its return) */
  slid: boolean;
}

/** ⭐ The placed parts' faces (normal, triangles on the model pose) and owners — per placed set. */
export function spanFacesOf(st: SceneState): NonNullable<SceneState["spanFaces"]> {
  const ids: string[] = [];
  for (const [mesh, id] of st.idOf) if (goalLocked(id, st.goalCommit, true) && mesh.isEnabled()) ids.push(id);
  const key = [...new Set(ids)].sort().join("|");
  if (st.spanFaces !== null && st.spanFaces.key === key) return st.spanFaces;
  const faces: SpanFace[] = [];
  const owners: { id: string; faceId: string }[] = [];
  for (const id of [...new Set(ids)].sort()) {
    const obj = st.world.objects.get(id);
    if (obj === undefined || obj.orbited === true || obj.frozen === true) continue;
    for (const f of obj.faces) {
      const w = faceWorld(st.world, id, f.id);
      const tris = faceTrianglesWorld(st, id, f.id);
      if (w === null || tris === null || tris.length === 0) continue;
      faces.push({ normal: w.normal, tris });
      owners.push({ id, faceId: f.id });
    }
  }
  st.spanFaces = { key, faces, owners };
  return st.spanFaces;
}

/** ⭐ The placed parts as closed triangle sets (their faces' triangles, grouped by owner). */
function partsOf(sf: NonNullable<SceneState["spanFaces"]>): Tri[][] {
  const by = new Map<string, Tri[]>();
  sf.faces.forEach((f, i) => {
    const id = sf.owners[i]!.id;
    const a = by.get(id) ?? [];
    a.push(...f.tris);
    by.set(id, a);
  });
  return [...by.values()];
}

/**
 * ⭐ The BASE face under the far gizmo `g`: a placed face turned like `n` (or toward the piece, `u`) whose plane lies at `g` or behind it within the ride's
 * slab, `g` over its region — the LARGEST region (the owner: *"Gizmo shall pass over the protruding part"* — a gizmo found on a protrusion's front, Piece45's,
 * is on the painting's face, riding over it). A tie: the nearer plane.
 */
function faceUnder(sf: NonNullable<SceneState["spanFaces"]>, g: Vec3, n: Vec3 | null, u: Vec3): number {
  let best = -1;
  let bestArea = -1;
  let bestH = Infinity;
  const seen = new Set<string>();
  sf.faces.forEach((f, i) => {
    const m = f.normal;
    if (n !== null ? m[0] * n[0] + m[1] * n[1] + m[2] * n[2] < 0.999 : m[0] * u[0] + m[1] * u[1] + m[2] * u[2] <= 0.05) return;
    const pl = spanPlane(m, f.tris[0]![0]);
    const h = heightOf(pl, g);
    if (h < -0.004 || h > SPAN_RIDE_SLAB_M) return;
    const r = spanRegion([f], 0, pl);
    if (r === null || regionDistance(r, toP2(pl, g)) > 0.03) return;
    const plane = spanPlane(m, [g[0] - m[0] * h, g[1] - m[1] * h, g[2] - m[2] * h]);
    const reg = spanRegion(sf.faces, i, plane);
    if (reg === null) return;
    const key = reg.members.join(",");
    if (seen.has(key)) return;
    seen.add(key);
    if (regionDistance(reg, toP2(plane, g)) > 0.006) return;
    const area = regionArea(reg);
    if (area > bestArea * 1.0001 || (Math.abs(area - bestArea) <= bestArea * 1e-4 && Math.abs(h) < bestH)) {
      best = i;
      bestArea = area;
      bestH = Math.abs(h);
    }
  });
  return best;
}

/** ⭐ The camera's right and up as last drawn (null: none yet). */
function screenAxes(st: SceneState): { right: Vec3; up: Vec3 } | null {
  const cp = st.cameraPrev;
  if (cp === null || cp === undefined) return null;
  const d = cp.dir;
  const u = cp.up;
  return { right: [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], up: u };
}

/**
 * ⭐⭐⭐ ENGAGE: the far gizmo `g` (on the face `n` of part `host`) becomes the face-span's — its plane, its region, its tops; the finger's axes where the orbit
 * moved it at the far direction `u` (`spanAxes`); the screen's up carried in; the piece's direction to be turned from `u` onto the normal by the engage's
 * blend. `false`: no placed face found there (the far orbit goes on).
 */
export function spanEngage(st: SceneState, g: Vec3, n: Vec3 | null, host: string | null, u: Vec3, q: { readonly yaw: number; readonly v: number }): boolean {
  const sf = spanFacesOf(st);
  const i = faceUnder(sf, g, n, u);
  void host;
  if (i < 0) return false;
  const f = sf.faces[i]!;
  const m = f.normal;
  const v0 = f.tris[0]![0];
  const k = m[0] * (g[0] - v0[0]) + m[1] * (g[1] - v0[1]) + m[2] * (g[2] - v0[2]);
  const pl = spanPlane(m, [g[0] - m[0] * k, g[1] - m[1] * k, g[2] - m[2] * k]);
  const region = spanRegion(sf.faces, i, pl);
  if (region === null) return false;
  const at = intoRegion(region, toP2(pl, g), regionInside(region));
  const steps = frameSteps(q.yaw, q.v);
  const scr = screenAxes(st) ?? { right: [1, 0, 0] as Vec3, up: [0, 1, 0] as Vec3 };
  const ax = spanAxes(m, fromFrame(st.asmOrbit, steps.yaw), fromFrame(st.asmOrbit, steps.pitch), scr.right, scr.up);
  const upIn = st.asmUp ?? scr.up;
  const upRef = onPlane(upIn, m) ?? ax.ePitch;
  const solids = spanSolids(pl, partsOf(sf));
  const ride = coveredTop(solids, at);
  const cosA = u[0] * m[0] + u[1] * m[1] + u[2] * m[2];
  st.span = {
    plane: pl,
    region,
    solids,
    face: i,
    host: sf.owners[i]!.id,
    eYaw: ax.eYaw,
    ePitch: ax.ePitch,
    upRef,
    motion: { at, overMm: 0, wrap: null },
    turn: null,
    ride,
    u0: u,
    engage: cosA > Math.cos(Math.PI / 180) ? 1 : 0,
    w: u,
    up: spanUp(m, upRef),
    g: fromP2(pl, at, ride),
    stepMm: 0,
    slid: false,
  };
  setGizmoFace(st, m, sf.owners[i]!.id);
  st.lastVerdict = `face-span: on ${sf.owners[i]!.id}'s face — the gizmo moves on its coplanar faces (${region.members.length})`;
  st.hudDirty = true;
  return true;
}

function setGizmoFace(st: SceneState, n: Vec3, host: string): void {
  if ((st.gizmoHost ?? null) !== host) {
    st.gizmoHost = host;
    st.orientDirty = true;
  }
  const n0 = st.gizmoNormal ?? null;
  if (n0 === null || n0[0] * n[0] + n0[1] * n[1] + n0[2] * n[2] < Math.cos(Math.PI / 180)) st.orientDirty = true;
  st.gizmoNormal = n;
}

/**
 * ⭐⭐⭐ ONE FRAME of the face-span: the orbit's step since the last frame (the finger's, the coast's) read and the orbit put back on its held place; the
 * step moved onto the gizmo (`spanStepOf`, × the assembly's radius), checked against the parts for the piece (`gapAt` — the queries the caller counts:
 * never closer to a part than the gap kept), clamped by the region, caught at the edge, wrapped across it; the tops ridden; the piece's direction and
 * the screen's up; at rest, the finger's axes read off the screen.
 */
export function spanFrame(st: SceneState, dtMs: number, gapM: number, gapAt: (g: Vec3, w: Vec3) => number): void {
  const sp = st.span;
  const q = st.pieceQ;
  if (sp === null || q === null || st.asm === null) return;
  const dYaw = Math.atan2(Math.sin(st.orbit.yaw - q.yaw), Math.cos(st.orbit.yaw - q.yaw));
  const dPitch = pitchOfV(st.orbit.elevation) - pitchOfV(q.v);
  st.orbit.reset(q.yaw, q.v);
  const degPerMm = Math.abs(orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm);
  const mm = spanMmOf(dYaw, dPitch, degPerMm);
  sp.stepMm = mm;
  const atRest = st.router.size === 0 && !st.orbitInertia.coasting && !st.approachInertia.coasting;
  const travel = Math.max(st.asmTravelFrameMm, mm);
  const cfg = st.cfg;
  sp.engage = spanShareAfter(sp.engage, travel, cfg.faceSpanTurnMm, dtMs, atRest);
  if (sp.engage >= 1) sp.u0 = null;
  const sf = spanFacesOf(st);
  const pl = sp.plane;
  const n = pl.n;
  const stepW = spanStepOf(dYaw, dPitch, st.asm.radius, sp.eYaw, sp.ePitch);
  const step = toPlaneDir(pl, stepW);
  const exclude = new Set(sp.region.members);
  const findNext = (at: P2, out: P2) => wrapCandidate(sf.faces, exclude, fromP2(pl, at), n, [pl.a[0] * out[0] + pl.b[0] * out[1], pl.a[1] * out[0] + pl.b[1] * out[1], pl.a[2] * out[0] + pl.b[2] * out[1]]);
  const dist = (p: P2) => regionDistance(sp.region, p);
  const moveBy = (k: number) => spanMove(sp.motion, [step[0] * k, step[1] * k], mm * k, dist, cfg.faceSpanCatchMm, cfg.faceSpanTurnMm, findNext);
  let res = moveBy(1);
  // ⭐ the piece moved with the gizmo along the face: never closer to a part than the gap kept (or than it is, already inside it) — the step halved
  const moved = res.motion.wrap === null && sp.motion.wrap === null && Math.hypot(res.motion.at[0] - sp.motion.at[0], res.motion.at[1] - sp.motion.at[1]) > 1e-7;
  if (moved) {
    const gOf = (at: P2): Vec3 => fromP2(pl, at, Math.max(sp.ride, coveredTop(sp.solids, at)));
    const g1 = gapAt(gOf(res.motion.at), sp.w);
    if (g1 < gapM) {
      const g0 = gapAt(gOf(sp.motion.at), sp.w);
      const ok = (g: number): boolean => g >= Math.min(gapM, g0) - 1e-5;
      if (!ok(g1)) {
        let found = false;
        for (const k of [0.5, 0.25, 0.125]) {
          const r = moveBy(k);
          if (ok(gapAt(gOf(r.motion.at), sp.w))) {
            res = r;
            found = true;
            break;
          }
        }
        if (!found) res = { motion: { ...sp.motion, overMm: 0 }, commit: false, held: true };
        st.lastVerdict = "face-span: the piece meets a part — the gizmo held";
      }
    }
  }
  if (res.held && res.motion.wrap === null && sp.motion.overMm < cfg.faceSpanCatchMm && res.motion.overMm >= cfg.faceSpanCatchMm) {
    st.lastVerdict = "face-span: the edge — nothing across it";
    st.hudDirty = true;
  }
  sp.motion = res.motion;
  // ⭐ a wrap begins: its turn about the edge (the face's normal onto the next one's)
  if (sp.motion.wrap !== null && sp.turn === null) {
    sp.turn = wrapTurn(n, sp.motion.wrap.to.normal);
    if (sp.turn === null) sp.motion = { ...sp.motion, wrap: null };
    else {
      st.lastVerdict = `face-span: across the edge (${sp.motion.wrap!.to.kind.toLowerCase()}) onto ${sf.owners[sp.motion.wrap!.to.index]!.id} — push on to turn, back to return`;
      st.hudDirty = true;
    }
  }
  if (sp.motion.wrap === null) sp.turn = null;
  if (res.commit && sp.motion.wrap !== null && sp.turn !== null) spanCommit(st, sp, sf);
  // ⭐ the tops ridden, eased by the travel
  sp.ride = rideStep(sp.ride, coveredTop(sp.solids, sp.motion.at), travel, cfg.faceSpanRideMm, dtMs, atRest);
  const p = sp.plane;
  sp.g = fromP2(p, sp.motion.at, sp.ride);
  const wrap = sp.motion.wrap !== null && sp.turn !== null ? { axis: sp.turn.axis, angle: sp.turn.angle, share: sp.motion.wrap.share } : null;
  sp.w = spanDirection(p.n, wrap, sp.u0, sp.engage);
  const up0 = spanUp(p.n, sp.upRef);
  sp.up = wrap === null ? up0 : turnVec(up0, wrap.axis, wrap.angle * wrap.share);
  // ⭐ at rest (no roll under way, no wrap): the finger's axes read off the screen — the orbit's own rule (`signOnScreen`)
  const scr = screenAxes(st);
  if (atRest && st.asmRoll === null && wrap === null && scr !== null) {
    sp.eYaw = axisOnScreen(sp.eYaw, st.asmSign.yaw, scr.right);
    sp.ePitch = axisOnScreen(sp.ePitch, st.asmSign.v, scr.up);
  }
}

/** ⭐⭐ A WRAP WHOLE: onto the face across — its plane, region and tops; the gizmo, the finger's axes and the carried up turned with it about the edge. */
function spanCommit(st: SceneState, sp: SpanState, sf: NonNullable<SceneState["spanFaces"]>): void {
  const w = sp.motion.wrap!;
  const t = sp.turn!;
  const i = w.to.index;
  const f = sf.faces[i]!;
  const m = f.normal;
  const g = fromP2(sp.plane, sp.motion.at, sp.ride);
  const v0 = f.tris[0]![0];
  const k = m[0] * (g[0] - v0[0]) + m[1] * (g[1] - v0[1]) + m[2] * (g[2] - v0[2]);
  const pl = spanPlane(m, [g[0] - m[0] * k, g[1] - m[1] * k, g[2] - m[2] * k]);
  const region = spanRegion(sf.faces, i, pl);
  if (region === null) {
    sp.motion = { ...sp.motion, wrap: null, overMm: 0 };
    sp.turn = null;
    return;
  }
  const solids = spanSolids(pl, partsOf(sf));
  const at = intoRegion(region, toP2(pl, g), regionInside(region));
  let eYaw = turnVec(sp.eYaw, t.axis, t.angle);
  let ePitch = turnVec(sp.ePitch, t.axis, t.angle);
  if (isWall(m)) ({ eYaw, ePitch } = levelAxes(m, eYaw, ePitch));
  const upRef = turnVec(spanUp(sp.plane.n, sp.upRef), t.axis, t.angle);
  sp.plane = pl;
  sp.region = region;
  sp.solids = solids;
  sp.face = i;
  sp.host = sf.owners[i]!.id;
  sp.eYaw = eYaw;
  sp.ePitch = ePitch;
  sp.upRef = upRef;
  sp.motion = { at, overMm: 0, wrap: null };
  sp.turn = null;
  sp.ride = Math.max(0, heightOf(pl, g));
  setGizmoFace(st, m, sp.host);
  st.lastVerdict = `face-span: on ${sp.host}'s face (${region.members.length} coplanar)`;
  st.hudDirty = true;
}

/**
 * ⭐⭐⭐ RELEASE (the approach out past the engage's hysteresis): the far orbit goes on from the piece's direction NOW — its angles set to it, the eye's
 * spring and the camera's lag with it, the finger's axes kept the same way in the world (`signAfter`); the far gizmo found again from the face-span's.
 */
export function spanRelease(st: SceneState): void {
  const sp = st.span;
  const q = st.pieceQ;
  st.span = null;
  if (sp === null || q === null) return;
  const t = frameAngles(toFrame(st.asmOrbit, sp.w), q.yaw);
  if (t !== null) {
    const steps = frameSteps(t.yaw, t.v);
    st.asmSign = { yaw: signAfter(st.asmSign.yaw, sp.eYaw, fromFrame(st.asmOrbit, steps.yaw)), v: signAfter(st.asmSign.v, sp.ePitch, fromFrame(st.asmOrbit, steps.pitch)) };
    st.pieceQ = { ...q, yaw: t.yaw, v: t.v };
    st.orbit.reset(t.yaw, t.v);
    st.orbitUserV = t.v;
    st.orbitRawPrev = { yaw: t.yaw, v: t.v };
    st.orbitInertia.stop();
    const sp0 = st.boxSpring;
    if (sp0 !== null) st.boxSpring = { at: { yaw: t.yaw, v: t.v, zoom: sp0.at.zoom }, velYaw: 0, velV: 0, velLnZoom: sp0.velLnZoom };
    st.cameraOrbit = null;
    st.cameraLagged = null;
  }
  st.asmG = sp.g;
  st.asmCarrier = null;
  st.asmShown = null;
  st.asmPrevQ = null;
  st.lastVerdict = "face-span: out — the far orbit around the assembly";
  st.hudDirty = true;
}

/** ⭐ Back from a slide: the gizmo where the slide left it — on this plane, taken in; else the face-span engaged again there. */
export function spanAfterSlide(st: SceneState, at: Vec3, u: Vec3): void {
  const sp = st.span;
  if (sp === null) return;
  sp.slid = false;
  const n = st.gizmoNormal ?? null;
  const same = n !== null && n[0] * sp.plane.n[0] + n[1] * sp.plane.n[1] + n[2] * sp.plane.n[2] > 0.999 && Math.abs(heightOf(sp.plane, at)) < 0.004;
  if (same) {
    sp.motion = { at: intoRegion(sp.region, toP2(sp.plane, at), regionInside(sp.region)), overMm: 0, wrap: null };
    sp.turn = null;
    sp.ride = 0;
    return;
  }
  const keep = { eYaw: sp.eYaw, ePitch: sp.ePitch };
  const q = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  if (!spanEngage(st, at, n, st.gizmoHost ?? null, u, q)) {
    st.span = sp;
    return;
  }
  // the finger's axes kept as they were (laid on the new face)
  const s = st.span!;
  const ey = onPlane(keep.eYaw, s.plane.n);
  const ep = onPlane(keep.ePitch, s.plane.n);
  if (ey !== null && ep !== null) ({ eYaw: s.eYaw, ePitch: s.ePitch } = isWall(s.plane.n) ? levelAxes(s.plane.n, ey, ep) : { eYaw: ey, ePitch: ep });
  s.engage = 1;
  s.u0 = null;
}

/** ⭐ The lines' points per line (a fixed vertex count — the mesh updated in place). */
const SPAN_LINE_PTS = 256;
const GREEN = new Color4(0.35, 0.8, 0.35, 1);
const RED = new Color4(0.9, 0.25, 0.2, 1);

/**
 * ⭐⭐⭐ THE RED AND GREEN LINES of the face-span: through the gizmo along the finger's two axes (green the yaw's, red the pitch's), across the region's run
 * (`regionRun` — the coplanar faces, never round the assembly), over the tops (`spanPolyline`: a step drawn as its connector), lifted 2 mm. Hidden with
 * the sections' slider, under a slide, out of the face-span.
 */
export function spanLinesFrame(st: SceneState): void {
  const sp = st.span;
  const show = sp !== null && st.cfg.sectionLines === 1 && st.hover === null && !sp.slid;
  if (!show) {
    if (st.spanLines !== null) st.spanLines.isVisible = false;
    return;
  }
  const p = sp.plane;
  const at = sp.motion.at;
  const key = `${sp.face}|${sp.region.members.length}|${at[0].toFixed(5)},${at[1].toFixed(5)}|${sp.eYaw.map((x) => x.toFixed(4)).join(",")}|${sp.ePitch.map((x) => x.toFixed(4)).join(",")}`;
  if (st.spanLines !== null && key === st.spanLinesKey) {
    st.spanLines.isVisible = true;
    return;
  }
  st.spanLinesKey = key;
  const line = (e: Vec3): Vector3[] => {
    const d0 = toPlaneDir(p, e);
    const l = Math.hypot(d0[0], d0[1]);
    if (!(l > 1e-9)) return [];
    const d: P2 = [d0[0] / l, d0[1] / l];
    const run = regionRun(sp.region, at, d);
    const pts = spanPolyline(sp.solids, at, d, run[0], run[1], Math.max(0.004, (run[1] - run[0]) / 120), 0.001, SPAN_LINE_PTS);
    return pts.map(([t, h]) => {
      const w = fromP2(p, [at[0] + d[0] * t, at[1] + d[1] * t], h + SPAN_LINE_LIFT_M);
      return new Vector3(w[0], w[1], w[2]);
    });
  };
  const pad = (pts: Vector3[]): Vector3[] => {
    const g = fromP2(p, at, sp.ride + SPAN_LINE_LIFT_M);
    const out = pts.length > 0 ? pts.slice(0, SPAN_LINE_PTS) : [new Vector3(g[0], g[1], g[2])];
    while (out.length < SPAN_LINE_PTS) out.push(out[out.length - 1]!.clone());
    return out;
  };
  const lines = [pad(line(sp.eYaw)), pad(line(sp.ePitch))];
  if (st.spanLines === null) {
    st.spanLines = CreateLineSystem("spanLines", { lines, colors: [lines[0]!.map(() => GREEN), lines[1]!.map(() => RED)], updatable: true }, st.scene);
    st.spanLines.isPickable = false;
    st.spanLines.alwaysSelectAsActiveMesh = true;
    // ⭐ in the TRANSPARENT pass after the pieces' see-through contours (as the sections were); hidden behind solid parts
    st.spanLines.alpha = 0.99;
    st.spanLines.alphaIndex = 1000;
  } else CreateLineSystem("spanLines", { lines, instance: st.spanLines });
  st.spanLines.isVisible = true;
}
