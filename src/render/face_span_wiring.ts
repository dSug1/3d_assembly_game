/**
 * ⭐⭐⭐ (2026-11-02, branch `1.0.90-`) **THE FACE-SPAN GIZMO, WIRED** — the rules are `input/face_span.ts`'s; this file holds the state and the calls
 * (`FACE_SPAN_2026-11-02.md`). Within the engage distance (`faceSpanEngageM`) the gizmo is a point on the hosting face's plane; ⭐⭐⭐ (the owner, second pass:
 * *"I want to keep what was done for commit ff2fca2 in terms of gizmo leading … Tilting the face and face-span should not impact the behavior of the gizmo
 * and the behavior of the piece and the camera relative to the gizmo"*) the ORBIT runs as it always did — its target from the finger, its place solved, the
 * piece on its direction from the gizmo, the camera behind it with its leash and lag — and the face-span decides only WHERE the gizmo is: moved by the
 * orbit's SOLVED step (as ff2fca2's carrier read `pieceQ`) × the assembly's radius, on the coplanar faces, over the tops, across an edge after a catch. Over
 * a top / bottom the roll of branch 1.0.83 at the zenith (`spanZenithStep`). The finger's sense read off the screen whenever the picture is settled (the
 * owner: *"screen direction shall win"*). ⛔ No rule here.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import type { Vec3 } from "../core/vec";
import { faceWorld } from "../core/object_model";
import { goalLocked } from "../input/goal_lock";
import { frameSteps, fromFrame, rollSense, signOnScreen } from "../input/orbit_frame";
import { orbitDegPerMm } from "../input/follow_camera";
import { pitchOfV } from "../input/assembly_orbit";
import {
  coveredTop,
  fromP2,
  gluedPartners,
  heightOf,
  hiddenGlued,
  intoRegion,
  isWall,
  onPlane,
  regionArea,
  regionDistance,
  regionInside,
  regionRun,
  rideStep,
  SPAN_LINE_LIFT_M,
  SPAN_RIDE_SLAB_M,
  SPAN_ZENITH_CONE_RAD,
  spanMmOf,
  spanMove,
  spanPlane,
  spanPolyline,
  spanRegion,
  spanSolids,
  axisSense,
  calmWeight,
  edgeShare,
  faceAxes,
  shownDir,
  greenPaceOf,
  spanAxisStep,
  toP2,
  toPlaneDir,
  wrapCandidate,
  zenithCrossing,
  zenithRollStep,
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

/** ⭐ The top face's roll at the zenith (branch 1.0.83's pause): the crossing axis `e` (in the plane — its `+` side rolled), the roll's share, the screen's up
 * at its start (`from`) and its way round (`sense`). */
export interface SpanZenith {
  e: Vec3;
  share: number;
  from: Vec3;
  sense: 1 | -1;
}

/** ⭐⭐⭐ (fourth pass) The calm of the shares comes in over this much travel after the engage (mm), or this long at rest (ms) — the far orbit's direction never jumps. */
const CALM_RAMP_MM = 20;
const CALM_REST_MS = 300;

/**
 * ⭐⭐⭐ (fourth pass) THE PIECE'S SHOWN DIRECTION in the face-span for the orbit's direction `u` (`shownDir`): the shares of its angles off the face's normal
 * — calm in the middle of a face, whole at its edges and across them — weighted by the engage's ramp and the distance (whole at the release: no jump either
 * way). `distM`: the approach's distance; `engageM`: the face-span's.
 */
export function spanShownDir(sp: SpanState, u: Vec3, distM: number, engageM: number, releaseFactor: number): Vec3 {
  const w = calmWeight(sp.calmRamp, distM, engageM, releaseFactor);
  if (!(w > 0)) return u;
  return shownDir(u, sp.plane.n, sp.eH, sp.eV, 1 - (1 - sp.shareH) * w, 1 - (1 - sp.shareV) * w);
}

/** ⭐ The piece no longer in front of its hosting face below this (cos of its direction from the face's normal): the gizmo goes across the edge. */
const SPAN_BEHIND_COS = 0.05;
/** ⭐ The finger's signs read off the screen only with the camera within 75° of facing the hosting face. */
const SPAN_FACING_COS = Math.cos((75 * Math.PI) / 180);

/** ⭐ The face-span's state (`st.span`). */
export interface SpanState {
  plane: SpanPlane;
  region: SpanRegion;
  solids: SpanSolid[];
  /** the face it was seeded on (an index into `st.spanFaces`) and its part */
  face: number;
  host: string;
  motion: SpanMotion;
  /** the ridden height shown (m in front of the plane) */
  ride: number;
  /** the piece's SOLVED direction last frame (world) — a crossing reads it */
  uPrev: Vec3 | null;
  /** ⭐⭐⭐ (third pass) the orbit's solved place last frame and the orbit's frame it was read in (a re-base moves nothing: no step read across it) */
  qPrev: { readonly yaw: number; readonly v: number; readonly frame: string } | null;
  /** the face's level axes (`faceAxes`), their senses for the orbit's yaw and pitch steps, and ff2fca2's paces (m/rad) */
  eH: Vec3;
  eV: Vec3;
  sh: 1 | -1;
  sv: 1 | -1;
  paceH: number;
  /** this frame: the gizmo (world), the finger's travel the orbit's step was worth (mm), the lines' axes (the orbit's yaw and pitch steps laid on the face) */
  g: Vec3;
  stepMm: number;
  eYaw: Vec3;
  ePitch: Vec3;
  /** over a top / bottom within the zenith's cone: its roll */
  zen: SpanZenith | null;
  /** ⭐⭐⭐ (fourth pass) the orbit's angle's shares shown along h and v (`edgeShare`), and the engage's ramp of their calm (0 → 1 by travel) */
  shareH: number;
  shareV: number;
  calmRamp: number;
  /** a slide took the gizmo meanwhile (found again on its return) */
  slid: boolean;
  /** a drag that went over a top through its roll keeps its sense until the finger lifts (⚠ else the screen's rule sends it straight back over the top) */
  signHold: boolean;
}

/** ⭐ The placed parts' faces (normal, triangles on the model pose), owners and glued partners — per placed set. */
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
  const partner = gluedPartners(faces, owners.map((o) => o.id));
  // ⭐ a glued face whose coplanar region is the smaller is hidden: never a host (no triangles for the regions)
  const areas = new Map<number, number>();
  const regionAreaOf = (i: number): number => {
    const known = areas.get(i);
    if (known !== undefined) return known;
    const f = faces[i]!;
    const r = spanRegion(faces, i, spanPlane(f.normal, f.tris[0]![0]));
    const a = r === null ? 0 : regionArea(r);
    areas.set(i, a);
    return a;
  };
  const hidden = hiddenGlued(partner, regionAreaOf);
  const hostable = faces.map((f, i) => (hidden[i] ? { normal: f.normal, tris: [] } : f));
  // ⭐ a step onto a hidden face lands on its partner; onto a kept one, on itself
  for (let i = 0; i < partner.length; i++) if (!hidden[i]) partner[i] = -1;
  st.spanFaces = { key, faces, hostable, owners, partner };
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
 * ⭐ The BASE face under the far gizmo `g`: a placed, hostable face turned like `n` (or toward the piece, `u`) whose plane lies at `g` or behind it within the
 * ride's slab, `g` over its region — the LARGEST region (a gizmo found on a protrusion's front, Piece45's, is on the painting's face, riding over it). A tie:
 * the nearer plane.
 */
function faceUnder(sf: NonNullable<SceneState["spanFaces"]>, g: Vec3, n: Vec3 | null, u: Vec3): number {
  let best = -1;
  let bestArea = -1;
  let bestH = Infinity;
  const seen = new Set<string>();
  sf.hostable.forEach((f, i) => {
    if (f.tris.length === 0) return;
    const m = f.normal;
    if (n !== null ? m[0] * n[0] + m[1] * n[1] + m[2] * n[2] < 0.999 : m[0] * u[0] + m[1] * u[1] + m[2] * u[2] <= 0.05) return;
    const pl = spanPlane(m, f.tris[0]![0]);
    const h = heightOf(pl, g);
    if (h < -0.004 || h > SPAN_RIDE_SLAB_M) return;
    const r = spanRegion([f], 0, pl);
    if (r === null || regionDistance(r, toP2(pl, g)) > 0.03) return;
    const plane = spanPlane(m, [g[0] - m[0] * h, g[1] - m[1] * h, g[2] - m[2] * h]);
    const reg = spanRegion(sf.hostable, i, plane);
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

/** ⭐ The camera's right and up as last drawn, and `dir` — from the look point TOWARD the camera (the frame's) (null: none yet) — the orbit's own convention (`framesFrame`'s). */
function screenAxes(st: SceneState): { right: Vec3; up: Vec3; dir: Vec3 } | null {
  const cp = st.cameraPrev;
  if (cp === null || cp === undefined) return null;
  const d = cp.dir;
  const u = cp.up;
  return { right: [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], up: u, dir: d };
}

/** ⭐ The plane through face `i` at the point `g` (its own plane, `g` projected onto it). */
function planeAt(sf: NonNullable<SceneState["spanFaces"]>, i: number, g: Vec3): SpanPlane {
  const f = sf.faces[i]!;
  const m = f.normal;
  const v0 = f.tris[0]![0];
  const k = m[0] * (g[0] - v0[0]) + m[1] * (g[1] - v0[1]) + m[2] * (g[2] - v0[2]);
  return spanPlane(m, [g[0] - m[0] * k, g[1] - m[1] * k, g[2] - m[2] * k]);
}

/**
 * ⭐⭐⭐ ENGAGE: the far gizmo `g` (on the face `n`) becomes the face-span's — the base face's plane, its region, its tops; the orbit's solved direction `u`
 * the reference its next step is read from. `false`: no placed face found there (the far orbit goes on).
 */
export function spanEngage(st: SceneState, g: Vec3, n: Vec3 | null, u: Vec3): boolean {
  const sf = spanFacesOf(st);
  const i = faceUnder(sf, g, n, u);
  if (i < 0) return false;
  const pl = planeAt(sf, i, g);
  const region = spanRegion(sf.hostable, i, pl);
  if (region === null) return false;
  const at = intoRegion(region, toP2(pl, g), regionInside(region));
  const solids = spanSolids(pl, partsOf(sf));
  const ride = coveredTop(solids, at);
  const ax = faceAxes(pl.n, screenAxes(st)?.right ?? [1, 0, 0]);
  const paceH = greenPaceOf(sf.faces.flatMap((f) => f.tris.flatMap((t) => [...t])));
  st.span = { plane: pl, region, solids, face: i, host: sf.owners[i]!.id, motion: { at, overMm: 0 }, ride, uPrev: u, qPrev: null, eH: ax.h, eV: ax.v, sh: 1, sv: 1, paceH, g: fromP2(pl, at, ride), stepMm: 0, eYaw: ax.h, ePitch: ax.v, zen: null, shareH: 1, shareV: 1, calmRamp: 0, slid: false, signHold: false };
  spanSenses(st, st.span);
  setGizmoFace(st, pl.n, sf.owners[i]!.id);
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

/** ⭐ The orbit's yaw and pitch steps (world) at the solved place, laid on the face — where a +yaw / +pitch moves the gizmo (null: square to it). */
function gizmoSteps(st: SceneState, n: Vec3): { yaw: Vec3 | null; pitch: Vec3 | null; yawW: Vec3; pitchW: Vec3 } {
  const q = st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };
  const s = frameSteps(q.yaw, q.v);
  const yawW = fromFrame(st.asmOrbit, s.yaw);
  const pitchW = fromFrame(st.asmOrbit, s.pitch);
  return { yaw: onPlane(yawW, n), pitch: onPlane(pitchW, n), yawW, pitchW };
}

/** ⭐⭐⭐ (third pass) The level axes' senses for the orbit's yaw and pitch steps at the solved place (`axisSense`). */
function spanSenses(st: SceneState, sp: SpanState): void {
  const g = gizmoSteps(st, sp.plane.n);
  sp.sh = axisSense(sp.sh, sp.eH, g.yawW);
  sp.sv = axisSense(sp.sv, sp.eV, g.pitchW);
}

/**
 * ⭐⭐⭐ THE SCREEN WINS (the owner: *"screen direction shall win"*): the finger's signs read off the screen — finger right → the gizmo's step to the screen's
 * right, finger down → its step to the screen's up (the 2026-10-04 convention) — with `signOnScreen`'s dead band near square (no flicker). ⚠ Read only on a
 * SETTLED picture: no roll under way, not inside the zenith's cone (looking down a top the screen's axes turn under the gizmo — the roll's own doing).
 */
export function spanScreenSigns(st: SceneState, n: Vec3): void {
  const scr = screenAxes(st);
  if (scr === null) return;
  const sp = st.span;
  if (sp !== null) {
    // ⭐⭐⭐ (third pass) the gizmo's own steps: along its level axes, in their senses
    const yawG: Vec3 = [sp.eH[0] * sp.sh, sp.eH[1] * sp.sh, sp.eH[2] * sp.sh];
    const pitchG: Vec3 = [sp.eV[0] * sp.sv, sp.eV[1] * sp.sv, sp.eV[2] * sp.sv];
    st.asmSign = { yaw: signOnScreen(st.asmSign.yaw, yawG, scr.right), v: signOnScreen(st.asmSign.v, pitchG, scr.up) };
    return;
  }
  const g = gizmoSteps(st, n);
  st.asmSign = { yaw: signOnScreen(st.asmSign.yaw, g.yaw ?? g.yawW, scr.right), v: signOnScreen(st.asmSign.v, g.pitch ?? g.pitchW, scr.up) };
}

/**
 * ⭐⭐⭐ ONE FRAME of the face-span: the gizmo moved by the orbit's SOLVED yaw and pitch steps since the last frame along the face's level axes (`spanAxisStep` — ff2fca2's relation),
 * checked against the parts for the piece (`gapAt` — the queries the caller counts: never closer to a part than the gap kept), clamped by the region, caught
 * at the edge, onto the face across; the tops ridden; the zenith's roll kept (its cone); the finger's signs off the screen.
 */
export function spanFrame(st: SceneState, dtMs: number, gapM: number, gapAt: (g: Vec3) => number, dirOf: (yaw: number, v: number) => Vec3): void {
  const sp = st.span;
  const q = st.pieceQ;
  if (sp === null || q === null || st.asm === null) return;
  const u1 = dirOf(q.yaw, q.v);
  sp.uPrev = u1;
  // ⭐⭐⭐ (third pass) ff2fca2's relation: the orbit's solved YAW and PITCH steps since the last frame (none across a re-base of its frame)
  const frame = st.asmOrbit.map((x) => x.toFixed(9)).join(",");
  const qp = sp.qPrev;
  const dYaw = qp !== null && qp.frame === frame ? Math.atan2(Math.sin(q.yaw - qp.yaw), Math.cos(q.yaw - qp.yaw)) : 0;
  const dPitch = qp !== null && qp.frame === frame ? pitchOfV(q.v) - pitchOfV(qp.v) : 0;
  sp.qPrev = { yaw: q.yaw, v: q.v, frame };
  spanSenses(st, sp);
  // ⭐ the zenith's cone kept BEFORE the step (⛔ after it: a thin top is crossed in a frame or two — its far edge's wait came a frame too late)
  spanZenithKeep(st, sp, dirOf(st.orbit.yaw, st.orbit.elevation));
  const degPerMm = Math.abs(orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm);
  const mm = spanMmOf(dYaw, dPitch, degPerMm);
  sp.stepMm = mm;
  const atRest = st.router.size === 0 && !st.orbitInertia.coasting && !st.approachInertia.coasting;
  const travel = Math.max(st.asmTravelFrameMm, mm);
  const cfg = st.cfg;
  const sf = spanFacesOf(st);
  const pl = sp.plane;
  const n = pl.n;
  const step = toPlaneDir(pl, spanAxisStep(dYaw, dPitch, sp.paceH, st.asm.radius, sp.eH, sp.eV, sp.sh, sp.sv));
  const exclude = new Set(sp.region.members);
  const findNext = (at: P2, out: P2) => {
    const D: Vec3 = [pl.a[0] * out[0] + pl.b[0] * out[1], pl.a[1] * out[0] + pl.b[1] * out[1], pl.a[2] * out[0] + pl.b[2] * out[1]];
    // ⭐⭐ over a top, its far edge waits for the orbit to cross the zenith toward it (the roll first, then down the far side — ⛔ off the thin top before
    // the zenith, the orbit still rising pushed the gizmo back up the far face: back and forth over the top)
    const z = sp.zen;
    if (z !== null && Math.sign(D[0] * z.e[0] + D[1] * z.e[1] + D[2] * z.e[2]) !== Math.sign(u1[0] * z.e[0] + u1[1] * z.e[1] + u1[2] * z.e[2])) return null;
    return wrapCandidate(sf.faces, exclude, fromP2(pl, at), n, D, undefined, sf.partner);
  };
  const dist = (p: P2) => regionDistance(sp.region, p);
  const moveBy = (k: number) => spanMove(sp.motion, [step[0] * k, step[1] * k], mm * k, dist, cfg.faceSpanCatchMm, findNext);
  let res = moveBy(1);
  // ⭐ the piece moved with the gizmo along the face: never closer to a part than the gap kept (or than it is, already inside it) — the step halved
  const moved = res.next === null && Math.hypot(res.motion.at[0] - sp.motion.at[0], res.motion.at[1] - sp.motion.at[1]) > 1e-7;
  if (moved) {
    const gOf = (at: P2): Vec3 => fromP2(pl, at, Math.max(sp.ride, coveredTop(sp.solids, at)));
    const g1 = gapAt(gOf(res.motion.at));
    if (g1 < gapM) {
      const g0 = gapAt(gOf(sp.motion.at));
      const ok = (g: number): boolean => g >= Math.min(gapM, g0) - 1e-5;
      if (!ok(g1)) {
        let found = false;
        for (const k of [0.5, 0.25, 0.125]) {
          const r = moveBy(k);
          if (ok(gapAt(gOf(r.motion.at)))) {
            res = r;
            found = true;
            break;
          }
        }
        if (!found) res = { motion: { ...sp.motion, overMm: 0 }, next: null, held: true };
        st.lastVerdict = "face-span: the piece meets a part — the gizmo held";
      }
    }
  }
  if (res.held && sp.motion.overMm < cfg.faceSpanCatchMm && res.motion.overMm >= cfg.faceSpanCatchMm) {
    st.lastVerdict = "face-span: the edge — nothing across it";
    st.hudDirty = true;
  }
  sp.motion = res.motion;
  if (res.next !== null) spanCommit(st, sp, sf, res.next.index, res.next.kind);
  else if (u1[0] * n[0] + u1[1] * n[1] + u1[2] * n[2] <= SPAN_BEHIND_COS) {
    // ⭐⭐ the piece no longer in front of the hosting face (the orbit gone over its edge — a thin assembly's face is crossed by the orbit faster than its
    // radius × angle): the gizmo carried to that edge and across at once (no catch)
    const toward = onPlane(u1, n);
    if (toward !== null) {
      const far = toPlaneDir(pl, toward);
      const r2 = spanMove(sp.motion, [far[0] * 2, far[1] * 2], 1e6, dist, 0, findNext);
      if (r2.next !== null) {
        sp.motion = r2.motion;
        spanCommit(st, sp, sf, r2.next.index, r2.next.kind);
      }
    }
  }
  // ⭐ the tops ridden, eased by the travel
  sp.ride = rideStep(sp.ride, coveredTop(sp.solids, sp.motion.at), travel, cfg.faceSpanRideMm, dtMs, atRest);
  sp.g = fromP2(sp.plane, sp.motion.at, sp.ride);
  // ⭐ the lines' axes: the face's level axes (green the level line, red the steepest on a wall)
  sp.eYaw = sp.eH;
  sp.ePitch = sp.eV;
  // ⭐⭐⭐ (fourth pass) the shares of the orbit's angle shown, from the gizmo's place on its runs (the nearer end); the calm ramped in from the engage
  const shareOf = (e: Vec3, interior: number, zonePct: number, zoneMinCm: number): number => {
    const d0 = toPlaneDir(sp.plane, e);
    const l = Math.hypot(d0[0], d0[1]);
    if (!(l > 1e-9)) return 1;
    const run = regionRun(sp.region, sp.motion.at, [d0[0] / l, d0[1] / l]);
    return edgeShare(Math.min(-run[0], run[1]), run[1] - run[0], interior, zonePct, zoneMinCm / 100);
  };
  sp.shareH = shareOf(sp.eH, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm);
  sp.shareV = cfg.faceSpanShareVOn === 1 ? shareOf(sp.eV, cfg.faceSpanShareV, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm) : 1;
  sp.calmRamp = Math.min(1, sp.calmRamp + travel / CALM_RAMP_MM + (atRest ? dtMs / CALM_REST_MS : 0));
  // ⭐⭐⭐ the screen wins — on a settled picture, the camera facing the hosting face (⛔ grazing it, from over the top, its up the face's turned over: the signs
  // flipped mid-drag, back and forth)
  const scr = screenAxes(st);
  const facing = scr !== null && scr.dir[0] * sp.plane.n[0] + scr.dir[1] * sp.plane.n[1] + scr.dir[2] * sp.plane.n[2] >= SPAN_FACING_COS; // `dir`: from the look point toward the camera
  if (st.router.size === 0) sp.signHold = false;
  if (sp.zen === null && st.asmRoll === null && facing && !sp.signHold) spanScreenSigns(st, sp.plane.n);
}

/** ⭐⭐ ONTO THE FACE ACROSS: its plane, region and tops; the gizmo where it stood, laid on it. */
function spanCommit(st: SceneState, sp: SpanState, sf: NonNullable<SceneState["spanFaces"]>, i: number, kind: string): void {
  const g = fromP2(sp.plane, sp.motion.at, sp.ride);
  const pl = planeAt(sf, i, g);
  const region = spanRegion(sf.hostable, i, pl);
  if (region === null) return;
  sp.plane = pl;
  sp.region = region;
  sp.solids = spanSolids(pl, partsOf(sf));
  sp.face = i;
  sp.host = sf.owners[i]!.id;
  sp.motion = { at: intoRegion(region, toP2(pl, g), regionInside(region)), overMm: 0 };
  sp.ride = Math.max(0, heightOf(pl, g));
  sp.zen = null;
  if (sp.uPrev !== null) spanZenithKeep(st, sp, sp.uPrev); // ⭐ a top entered: its cone at once
  // ⭐⭐⭐ (third pass) the new face's level axes (a top's latched off the screen now), their senses read again
  const ax = faceAxes(pl.n, screenAxes(st)?.right ?? sp.eH);
  sp.eH = ax.h;
  sp.eV = ax.v;
  spanSenses(st, sp);
  setGizmoFace(st, pl.n, sp.host);
  st.lastVerdict = `face-span: across the edge (${kind.toLowerCase()}) onto ${sp.host}'s face (${region.members.length} coplanar)`;
  st.hudDirty = true;
}

/** ⭐ The zenith's cone left by this much more than it is entered (rad) — no flicker at its rim. */
const ZENITH_EXIT_RAD = (5 * Math.PI) / 180;

/**
 * ⭐⭐ THE ZENITH'S CONE KEPT (over a top / bottom only — walls never roll): entering it (the orbit's direction `u` within 30° of the face's normal) latches
 * the crossing axis (away from the side entered — its far side the rolled one), the screen's up then and the roll's way round; leaving it (5° past, the roll at
 * an end) drops it — the regular up takes over (on the far side the rolled one).
 */
function spanZenithKeep(st: SceneState, sp: SpanState, u: Vec3): void {
  const n = sp.plane.n;
  const c = u[0] * n[0] + u[1] * n[1] + u[2] * n[2];
  if (isWall(n)) {
    sp.zen = null;
    return;
  }
  if (sp.zen === null) {
    if (c < Math.cos(SPAN_ZENITH_CONE_RAD)) return;
    const scr = screenAxes(st);
    const back = onPlane(u, n) ?? (scr === null ? null : onPlane(scr.dir, n));
    const from = st.asmUp ?? scr?.up ?? null;
    if (back === null || from === null) return;
    const e: Vec3 = [-back[0], -back[1], -back[2]];
    const neg: Vec3 = [-from[0], -from[1], -from[2]];
    sp.zen = { e, share: 0, from, sense: rollSense(from, neg, scr?.dir ?? [-n[0], -n[1], -n[2]]) };
    return;
  }
  if (c < Math.cos(SPAN_ZENITH_CONE_RAD + ZENITH_EXIT_RAD) && (sp.zen.share === 0 || sp.zen.share === 1)) sp.zen = null;
}

/**
 * ⭐⭐⭐ (the owner: *"do the roll as it was previously implemented on branch 1.0.83"*) — **THE TOP FACE'S ROLL AT THE ZENITH**, called after every orbit step
 * (the finger's, from `yaw0` / `v0`, `travelMm` of it — or the coast's): over a top / bottom, a step that would carry the orbit across the zenith onto the
 * side whose roll is not yet done is HELD there (the piece waits straight above the gizmo) and its travel along the crossing axis rolls the camera instead —
 * half a turn over `faceSpanRollMm`, linear, reversible anywhere; a dx is held mid-roll (it would spin the picture); the coast stops there.
 */
export function spanZenithStep(st: SceneState, yaw0: number, v0: number, travelMm: number, dirOf: (yaw: number, v: number) => Vec3): void {
  const sp = st.span;
  const z = sp?.zen ?? null;
  if (sp === null || z === null || !(travelMm > 0)) return;
  const u0 = dirOf(yaw0, v0);
  const u1 = dirOf(st.orbit.yaw, st.orbit.elevation);
  const d: Vec3 = [u1[0] - u0[0], u1[1] - u0[1], u1[2] - u0[2]];
  const dl = Math.hypot(d[0], d[1], d[2]);
  if (!(dl > 1e-12)) return;
  const along = (travelMm * (d[0] * z.e[0] + d[1] * z.e[1] + d[2] * z.e[2])) / dl;
  const rollMm = st.cfg.faceSpanRollMm;
  if (z.share > 0 && z.share < 1) {
    // ⭐ mid-roll: the orbit held, the travel along the axis rolls (a dx: nothing)
    st.orbit.reset(yaw0, v0);
    const was = z.share;
    z.share = zenithRollStep(z.share, along, rollMm).share;
    if (z.share !== was) sp.signHold = true;
    st.orbitInertia.stop();
    st.hudDirty = true;
    return;
  }
  const s1 = u1[0] * z.e[0] + u1[1] * z.e[1] + u1[2] * z.e[2];
  const side1 = s1 > 0 ? 1 : s1 < 0 ? -1 : 0;
  if (side1 === 0 || (side1 > 0 ? 1 : 0) === z.share) return;
  // the step goes onto the side whose roll is not done: held where it crosses (at once when it starts on that side or on the zenith itself)
  const cr = zenithCrossing(u0, u1, sp.plane.n, z.e, SPAN_ZENITH_CONE_RAD + ZENITH_EXIT_RAD);
  const k = cr === null ? 0 : cr.k;
  const dy = Math.atan2(Math.sin(st.orbit.yaw - yaw0), Math.cos(st.orbit.yaw - yaw0));
  st.orbit.reset(yaw0 + dy * k, v0 + (st.orbit.elevation - v0) * k);
  const was = z.share;
  z.share = zenithRollStep(z.share, along * (1 - k), rollMm).share;
  if (z.share !== was) sp.signHold = true;
  st.orbitInertia.stop();
  st.lastVerdict = "face-span: over the top — the piece waits, the camera rolls (back to unroll)";
  st.hudDirty = true;
}

/** ⭐ The screen's up the zenith's roll shows (`null`: no roll latched). */
export function spanZenithUp(st: SceneState): { from: Vec3; to: Vec3; share: number; sense: 1 | -1 } | null {
  const z = st.span?.zen ?? null;
  if (z === null) return null;
  return { from: z.from, to: [-z.from[0], -z.from[1], -z.from[2]], share: z.share, sense: z.sense };
}

/**
 * ⭐⭐⭐ RELEASE (the approach out past the engage's hysteresis): the far orbit simply goes on (it never stopped); the far gizmo found again from the
 * face-span's; the finger's signs read off the screen by the far orbit's own rule (⛔ `signAfter`: an inversion carried out of the face-span).
 */
export function spanRelease(st: SceneState): void {
  const sp = st.span;
  st.span = null;
  if (sp === null) return;
  const scr = screenAxes(st);
  if (scr !== null) {
    const g = gizmoSteps(st, sp.plane.n);
    st.asmSign = { yaw: signOnScreen(st.asmSign.yaw, g.yawW, scr.right), v: signOnScreen(st.asmSign.v, g.pitchW, scr.up) };
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
  sp.uPrev = null;
  sp.qPrev = null;
  const n = st.gizmoNormal ?? null;
  const same = n !== null && n[0] * sp.plane.n[0] + n[1] * sp.plane.n[1] + n[2] * sp.plane.n[2] > 0.999 && Math.abs(heightOf(sp.plane, at)) < 0.004;
  if (same) {
    sp.motion = { at: intoRegion(sp.region, toP2(sp.plane, at), regionInside(sp.region)), overMm: 0 };
    sp.ride = 0;
    return;
  }
  if (!spanEngage(st, at, n, u)) st.span = sp;
}

/** ⭐ The lines' points per line (a fixed vertex count — the mesh updated in place). */
const SPAN_LINE_PTS = 256;
const GREEN = new Color4(0.35, 0.8, 0.35, 1);
const RED = new Color4(0.9, 0.25, 0.2, 1);

/**
 * ⭐⭐⭐ THE RED AND GREEN LINES of the face-span: through the gizmo along the orbit's two steps laid on the face (green the yaw's, red the pitch's), across the
 * region's run (`regionRun` — the coplanar faces, never round the assembly), over the tops (`spanPolyline`: a step drawn as its connector), lifted 2 mm.
 * Hidden with the sections' slider, under a slide, out of the face-span.
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
  const key = `${sp.face}|${sp.region.members.length}|${at[0].toFixed(5)},${at[1].toFixed(5)}|${sp.eYaw.map((x) => x.toFixed(3)).join(",")}|${sp.ePitch.map((x) => x.toFixed(3)).join(",")}`;
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
