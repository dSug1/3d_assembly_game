/**
 * ⭐⭐⭐ (2026-11-02, branch `1.0.90-`) **THE FACE-SPAN GIZMO, WIRED** — the rules are `input/face_span.ts`'s; this file holds the state and the calls
 * (`FACE_SPAN_2026-11-02.md`). Within the engage distance (`faceSpanEngageM`) the gizmo is a point on the hosting face's plane; ⭐⭐⭐ (the owner, second pass:
 * *"I want to keep what was done for commit ff2fca2 in terms of gizmo leading … Tilting the face and face-span should not impact the behavior of the gizmo
 * and the behavior of the piece and the camera relative to the gizmo"*) the ORBIT runs as it always did — its target from the finger, its place solved, the
 * piece on its direction from the gizmo, the camera behind it with its leash and lag — and the face-span decides only WHERE the gizmo is: moved by the
 * orbit's SOLVED step (as ff2fca2's carrier read `pieceQ`) × the assembly's radius — ⭐⭐⭐ (2026-11-03, branch `1.0.91-`) as the assembly's SHADOW on one of
 * its box's six bases, close in and far out alike (`input/face_span.ts`): straight lines on the base, a step in depth a jump (the piece and the camera read its
 * foot, `spanAnchor`), round the outline onto the next base at 90° after a catch, the base's normal the orbit frame's (`spanTiltNormal`: no tilt). Over
 * a top / bottom the roll of branch 1.0.83 at the zenith (`spanZenithStep`). The finger's sense read off the screen whenever the picture is settled (the
 * owner: *"screen direction shall win"*). ⛔ No rule here.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import type { Vec3 } from "../core/vec";
import { faceWorld } from "../core/object_model";
import { goalLocked } from "../input/goal_lock";
import { frameSteps, fromFrame, holdToScreen, rollSense, screenDir, signOnScreen } from "../input/orbit_frame";
import { orbitDegPerMm } from "../input/follow_camera";
import { pitchOfV } from "../input/assembly_orbit";
import {
  boxDirs,
  fromP2,
  isWall,
  nearestCovered,
  onPlane,
  shadowAt,
  shadowDist,
  shadowMap,
  shadowRun,
  snapDir,
  SPAN_LINE_LIFT_M,
  SPAN_ZENITH_CONE_RAD,
  spanMmOf,
  spanMove,
  spanPolyline,
  axisSense,
  calmWeight,
  edgeShare,
  faceAxes,
  shownDir,
  greenPaceOf,
  spanAxisStep,
  toP2,
  toPlaneDir,
  zenithCrossing,
  zenithRollStep,
  type P2,
  type ShadowMap,
  type SpanFace,
  type SpanMotion,
  type SpanPlane,
  type Tri,
} from "../input/face_span";
import { gizmoShare } from "../input/orbit_shell";
import { faceTrianglesWorld } from "./hover_wiring";
import type { SceneState } from "./scene_state";

/** ⭐ The top face's roll at the zenith (branch 1.0.83's pause): the crossing axis `e` (in the plane — its `+` side rolled), the roll's share, the screen's up
 * at its start (`from`) and its way round (`sense`). */
export interface SpanZenith {
  e: Vec3;
  share: number;
  from: Vec3;
  sense: 1 | -1;
  /** ⭐⭐⭐ (2026-11-03) a roll ended at its other end in this drag: the step back over the zenith is held until the finger lifts — the screen's sense
   * reversed by the half turn, the same finger going on would roll it straight back (and again: the picture rocking) */
  block: boolean;
  /** the end (0 / 1) the roll under way started from */
  start: number;
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
  /** ⭐⭐⭐ (2026-11-03) the BASE: one of the assembly's box's six directions (`dirs`), its plane at the parts' outermost extent, the shadow on it */
  plane: SpanPlane;
  map: ShadowMap;
  dirs: readonly Vec3[];
  /** the part under the gizmo (the shadow's triangle there; kept across a bridged gap) */
  host: string;
  motion: SpanMotion;
  /** the shadow's height at the gizmo (m in front of the plane, ≤ 0) — a step in it a jump */
  h: number;
  /** the piece's SOLVED direction last frame (world) — a crossing reads it */
  uPrev: Vec3 | null;
  /** ⭐⭐⭐ (2026-11-03) the orbit's steps the FINGER gave since the last frame (the drag's, the coast's — what the target took: the governor's, the cone's and
   * the zenith's cuts in), in the orbit's frame they were read in (a re-base moves nothing: none read across it) */
  input: { yaw: number; pitch: number; frame: string };
  /** the base's level axes (`faceAxes`), their senses for the orbit's yaw and pitch steps, and ff2fca2's paces (m/rad) */
  eH: Vec3;
  eV: Vec3;
  sh: 1 | -1;
  sv: 1 | -1;
  paceH: number;
  /** this frame: the gizmo (world, on the shadow), its FOOT (on the base's plane — the piece and the camera are read from it, `spanAnchor`), the finger's
   * travel the orbit's step was worth (mm), the lines' axes */
  g: Vec3;
  foot: Vec3;
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
}

/** ⭐ The placed parts' faces (normal, triangles on the model pose) and owners, the parts as closed triangle sets, the box's six directions — per placed set. */
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
  const by = new Map<string, Tri[]>();
  faces.forEach((f, i) => {
    const id = owners[i]!.id;
    const a = by.get(id) ?? [];
    a.push(...f.tris);
    by.set(id, a);
  });
  const partIds = [...by.keys()];
  const parts = partIds.map((id) => by.get(id)!);
  st.spanFaces = { key, faces, owners, partIds, parts, dirs: boxDirs(parts.flatMap((t) => t.flatMap((x) => [...x]))) };
  st.spanShadows.clear();
  return st.spanFaces;
}

/** ⭐ The shadow on the base `n` (one of the box's), per placed set and bridge (`shadowBridgeMm`); `null`: no parts. */
function shadowOf(st: SceneState, n: Vec3): ShadowMap | null {
  const sf = spanFacesOf(st);
  const key = `${n.map((x) => x.toFixed(6)).join(",")}|${st.cfg.shadowBridgeMm}`;
  if (st.spanShadows.has(key)) return st.spanShadows.get(key)!;
  const m = shadowMap(n, sf.parts, st.cfg.shadowBridgeMm / 1000);
  st.spanShadows.set(key, m);
  return m;
}

/**
 * ⭐⭐⭐ (2026-11-03) WHERE THE PIECE AND THE CAMERA ARE READ FROM (the owner: *"the gizmo jumps but nothing happens to the piece nor the camera (they follow the
 * orbit)"*): the gizmo's FOOT on the base's plane — so a jump of the shadow moves neither — brought onto the gizmo itself within the shell's offset
 * (`gizmoShare`: at the contact the piece is on the real surface). `d`: the approach's distance.
 */
export function spanAnchor(sp: SpanState, d: number, offsetM: number): Vec3 {
  const w = gizmoShare(d, offsetM);
  return [sp.foot[0] + (sp.g[0] - sp.foot[0]) * w, sp.foot[1] + (sp.g[1] - sp.foot[1]) * w, sp.foot[2] + (sp.g[2] - sp.foot[2]) * w];
}

/** ⭐ The camera's right and up as last drawn, and `dir` — from the look point TOWARD the camera (the frame's) (null: none yet) — the orbit's own convention (`framesFrame`'s). */
function screenAxes(st: SceneState): { right: Vec3; up: Vec3; dir: Vec3 } | null {
  const cp = st.cameraPrev;
  if (cp === null || cp === undefined) return null;
  const d = cp.dir;
  const u = cp.up;
  return { right: [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], up: u, dir: d };
}

/** ⭐ A zenith roll under way (the piece waits, the camera rolls). */
function zenithRolling(st: SceneState): boolean {
  const z = st.span?.zen ?? null;
  return z !== null && z.share > 0 && z.share < 1;
}

/**
 * ⭐⭐⭐ (2026-11-03) EACH FRAME, THE GIZMO'S AXES AS THE SCREEN SHOWS THEM (`screenDir`, `fingerOnAxes`): its steps for a +yaw and a +pitch — the face-span's
 * along the face's level axes in their senses, far out the orbit's steps laid on the gizmo's face — on the picture shown, so the finger follows the picture
 * through every roll (the screen's up's, a frame switch's). ⭐ HELD through a ZENITH roll: the piece waits there, nothing to follow on the screen, and the
 * roll's drive is the finger as it was (⛔ turned with the picture, a dy stalled the roll at a quarter turn). An axis seen end-on keeps the one before.
 */
export function fingerAxesFrame(st: SceneState): void {
  if (zenithRolling(st)) return;
  const scr = screenAxes(st);
  if (scr === null) return;
  const sp = st.span;
  let yawW: Vec3;
  let pitchW: Vec3;
  if (sp !== null) {
    yawW = [sp.eH[0] * sp.sh, sp.eH[1] * sp.sh, sp.eH[2] * sp.sh];
    pitchW = [sp.eV[0] * sp.sv, sp.eV[1] * sp.sv, sp.eV[2] * sp.sv];
  } else {
    const g = gizmoSteps(st, st.gizmoNormal ?? [0, 1, 0]);
    yawW = g.yaw ?? g.yawW;
    pitchW = g.pitch ?? g.pitchW;
  }
  const was = st.asmAxes;
  // ⭐⭐⭐ (2026-11-03) each held to the screen's axis it drives (`holdToScreen`): a dx a straight level line, a dy a straight vertical, however obliquely the
  // face is seen; a roll swings them on
  const ys = screenDir(yawW, scr.right, scr.up);
  const ps = screenDir(pitchW, scr.right, scr.up);
  const yh = ys === null ? null : holdToScreen(ys, was?.yawC ?? null);
  let ph = ps === null ? null : holdToScreen(ps, was?.pitchC ?? null);
  // the two never on one screen axis (⛔ both receding alike: a dx drove both, a dy nothing) — the pitch's the one square to the yaw's, on its side
  if (yh !== null && ph !== null && yh.c % 2 === ph.c % 2) {
    const c = (yh.c + (ps![0] * -Math.sin((yh.c * Math.PI) / 2) + ps![1] * Math.cos((yh.c * Math.PI) / 2) >= 0 ? 1 : 3)) % 4;
    ph = { dir: [Math.round(Math.cos((c * Math.PI) / 2)), Math.round(Math.sin((c * Math.PI) / 2))], c };
  }
  const y = yh?.dir ?? was?.yaw ?? null;
  const p = ph?.dir ?? was?.pitch ?? null;
  st.asmAxes = y !== null && p !== null ? { yaw: y, pitch: p, yawC: yh?.c ?? was?.yawC ?? null, pitchC: ph?.c ?? was?.pitchC ?? null } : was;
}

/**
 * ⭐⭐⭐ ENGAGE: the gizmo found at `g` (its face `n`, else the piece's direction `u`) becomes the shadow gizmo's — on the box's base nearest that face (a
 * slanted face its projection), the nearest point of its shadow. `false`: no shadow there (the far carrier goes on).
 */
export function spanEngage(st: SceneState, g: Vec3, n: Vec3 | null, u: Vec3): boolean {
  const sf = spanFacesOf(st);
  const base = snapDir(n ?? u, sf.dirs);
  if (base === null) return false;
  const map = shadowOf(st, base);
  if (map === null) return false;
  const pl = map.plane;
  const at = nearestCovered(map, toP2(pl, g));
  if (at === null) return false;
  const hit = shadowAt(map, at)!;
  const ax = faceAxes(pl.n, screenAxes(st)?.right ?? [1, 0, 0]);
  const paceH = greenPaceOf(sf.faces.flatMap((f) => f.tris.flatMap((t) => [...t])));
  st.span = { plane: pl, map, dirs: sf.dirs, host: st.gizmoHost ?? "", motion: { at, overMm: 0 }, h: hit.h, uPrev: u, input: { yaw: 0, pitch: 0, frame: "" }, eH: ax.h, eV: ax.v, sh: 1, sv: 1, paceH, g: fromP2(pl, at, hit.h), foot: fromP2(pl, at, 0), stepMm: 0, eYaw: ax.h, ePitch: ax.v, zen: null, shareH: 1, shareV: 1, calmRamp: 0, slid: false };
  spanSenses(st, st.span);
  spanHitFace(st, st.span, hit.tri);
  st.lastVerdict = `face-span: the gizmo's shadow on the assembly's ${baseName(pl.n)}`;
  st.hudDirty = true;
  return true;
}

/** ⭐ The base's name for the HUD. */
function baseName(n: Vec3): string {
  return n[1] > 0.7 ? "top" : n[1] < -0.7 ? "bottom" : "side";
}

/**
 * ⭐⭐ The face the quads and the slide read (`gizmoNormal`, `gizmoHost`): the REAL face under the gizmo (the shadow's triangle) — the piece lands on it;
 * across a bridged gap the one before. The orbit's frame reads the BASE (`spanTiltNormal`): no tilt.
 */
function spanHitFace(st: SceneState, sp: SpanState, tri: number): void {
  if (tri < 0) return;
  const t = sp.map.tris[tri]!;
  const host = spanFacesOf(st).partIds[t.owner] ?? sp.host;
  sp.host = host;
  setGizmoFace(st, t.n, host);
}

/** ⭐⭐⭐ (2026-11-03) The normal the orbit's FACE FRAME reads (`tiltWanted`): in the face-span the base's — a slanted face never tilts the orbit nor rolls the camera. */
export function spanTiltNormal(st: SceneState): Vec3 | null {
  return st.span !== null ? st.span.plane.n : (st.gizmoNormal ?? null);
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

/** ⭐ The orbit's frame as a key (its steps are read in it). */
function orbitFrameKey(st: SceneState): string {
  return st.asmOrbit.map((x) => x.toFixed(9)).join(",");
}

/**
 * ⭐⭐⭐ (2026-11-03) THE FINGER'S ORBIT STEP, gathered for the gizmo: the orbit's target from (`yaw0`, `v0`) to where the drag or the coast left it (its cuts in).
 * A re-base of the orbit's frame since drops what was gathered.
 */
export function spanInputAdd(st: SceneState, yaw0: number, v0: number): void {
  const sp = st.span;
  if (sp === null) return;
  const frame = orbitFrameKey(st);
  if (sp.input.frame !== frame) sp.input = { yaw: 0, pitch: 0, frame };
  sp.input.yaw += Math.atan2(Math.sin(st.orbit.yaw - yaw0), Math.cos(st.orbit.yaw - yaw0));
  sp.input.pitch += pitchOfV(st.orbit.elevation) - pitchOfV(v0);
}

/**
 * ⭐⭐⭐ ONE FRAME of the shadow gizmo: moved by the FINGER's orbit steps since the last frame along the base's level axes (`spanAxisStep` —
 * ff2fca2's relation), in straight lines; checked against the parts for the piece (`gapAt` — the queries the caller counts: never closer to a part than the
 * gap kept), clamped to the shadow's outline, caught there, then onto the next base at 90°; its depth the shadow's at once (a jump — the piece and the camera
 * read its foot); the zenith's roll kept (its cone); the finger's signs off the screen.
 */
export function spanFrame(st: SceneState, dtMs: number, gapM: number, gapAt: (g: Vec3, foot: Vec3) => number, dirOf: (yaw: number, v: number) => Vec3): void {
  const sp = st.span;
  const q = st.pieceQ;
  if (sp === null || q === null || st.asm === null) return;
  const u1 = dirOf(q.yaw, q.v);
  sp.uPrev = u1;
  // ⭐⭐⭐ (third pass) ff2fca2's relation: the orbit's YAW and PITCH steps since the last frame — ⭐⭐⭐ (2026-11-03, the owner: *"a straight horizontal or
  // vertical line (which I expect if the gizmo would faithfully follow the dy and dx orbit inputs)"*) the FINGER's (`spanInputAdd`), ⛔ the SOLVED ones: a piece
  // touching a part slid down it under a pure dx and the gizmo went 16 cm down with it; none across a re-base of the orbit's frame
  const frame = orbitFrameKey(st);
  const dYaw = sp.input.frame === frame ? sp.input.yaw : 0;
  const dPitch = sp.input.frame === frame ? sp.input.pitch : 0;
  sp.input = { yaw: 0, pitch: 0, frame };
  spanSenses(st, sp);
  // ⭐ the zenith's cone kept BEFORE the step (⛔ after it: a thin top is crossed in a frame or two — its far edge's wait came a frame too late)
  spanZenithKeep(st, sp, dirOf(st.orbit.yaw, st.orbit.elevation));
  const degPerMm = Math.abs(orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm);
  const mm = spanMmOf(dYaw, dPitch, degPerMm);
  sp.stepMm = mm;
  const atRest = st.router.size === 0 && !st.orbitInertia.coasting && !st.approachInertia.coasting;
  const travel = Math.max(st.asmTravelFrameMm, mm);
  const cfg = st.cfg;
  const pl = sp.plane;
  const n = pl.n;
  const map = sp.map;
  const step = toPlaneDir(pl, spanAxisStep(dYaw, dPitch, sp.paceH, st.asm.radius, sp.eH, sp.eV, sp.sh, sp.sv));
  const findNext = (_at: P2, out: P2): { normal: Vec3 } | null => {
    const D: Vec3 = [pl.a[0] * out[0] + pl.b[0] * out[1], pl.a[1] * out[0] + pl.b[1] * out[1], pl.a[2] * out[0] + pl.b[2] * out[1]];
    // ⭐⭐ over a top, its far edge waits for the orbit to cross the zenith toward it (the roll first, then down the far side — ⛔ off the thin top before
    // the zenith, the orbit still rising pushed the gizmo back up the far face: back and forth over the top)
    const z = sp.zen;
    if (z !== null && Math.sign(D[0] * z.e[0] + D[1] * z.e[1] + D[2] * z.e[2]) !== Math.sign(u1[0] * z.e[0] + u1[1] * z.e[1] + u1[2] * z.e[2])) return null;
    // ⭐⭐⭐ (2026-11-03) the next base: the box's direction along the push — at 90°, never a slanted face's
    const next = snapDir(D, sp.dirs, n);
    return next === null ? null : { normal: next };
  };
  const dist = shadowDist(map);
  const moveBy = (k: number) => spanMove(sp.motion, [step[0] * k, step[1] * k], mm * k, dist, cfg.faceSpanCatchMm, findNext);
  let res = moveBy(1);
  // ⭐ the piece moved with the gizmo along the face: never closer to a part than the gap kept (or than it is, already inside it) — the step halved
  const moved = res.next === null && Math.hypot(res.motion.at[0] - sp.motion.at[0], res.motion.at[1] - sp.motion.at[1]) > 1e-7;
  if (moved) {
    const gapOf = (at: P2): number => gapAt(fromP2(pl, at, shadowAt(map, at)?.h ?? sp.h), fromP2(pl, at, 0));
    const g1 = gapOf(res.motion.at);
    if (g1 < gapM) {
      const g0 = gapOf(sp.motion.at);
      const ok = (g: number): boolean => g >= Math.min(gapM, g0) - 1e-5;
      if (!ok(g1)) {
        let found = false;
        for (const k of [0.5, 0.25, 0.125]) {
          const r = moveBy(k);
          if (ok(gapOf(r.motion.at))) {
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
    st.lastVerdict = "face-span: the outline — nothing across it";
    st.hudDirty = true;
  }
  sp.motion = res.motion;
  if (res.next !== null) spanCommit(st, sp, res.next.normal);
  else if (u1[0] * n[0] + u1[1] * n[1] + u1[2] * n[2] <= SPAN_BEHIND_COS) {
    // ⭐⭐ the piece no longer in front of the base (the orbit gone over its edge — a thin assembly's side is crossed by the orbit faster than its radius ×
    // angle): the gizmo carried to that outline and across at once (no catch)
    const toward = onPlane(u1, n);
    if (toward !== null) {
      const far = toPlaneDir(pl, toward);
      const r2 = spanMove(sp.motion, [far[0] * 2, far[1] * 2], 1e6, dist, 0, findNext);
      if (r2.next !== null) {
        sp.motion = r2.motion;
        spanCommit(st, sp, r2.next.normal);
      }
    }
  }
  // ⭐⭐⭐ (2026-11-03) the shadow at the gizmo: its depth AT ONCE (the owner: *"the gizmo shall behave like a shadow (ie jumping over the discontinuity)"*),
  // its real face for the quads; the foot on the base's plane
  const hit = shadowAt(sp.map, sp.motion.at);
  if (hit !== null) {
    sp.h = hit.h;
    spanHitFace(st, sp, hit.tri);
  }
  sp.g = fromP2(sp.plane, sp.motion.at, sp.h);
  sp.foot = fromP2(sp.plane, sp.motion.at, 0);
  // ⭐ the lines' axes: the base's level axes (green the level line, red the vertical on a side)
  sp.eYaw = sp.eH;
  sp.ePitch = sp.eV;
  // ⭐⭐⭐ (fourth pass) the shares of the orbit's angle shown, from the gizmo's place on its runs (the nearer end); the calm ramped in from the engage
  const shareOf = (e: Vec3, interior: number, zonePct: number, zoneMinCm: number): number => {
    const d0 = toPlaneDir(sp.plane, e);
    const l = Math.hypot(d0[0], d0[1]);
    if (!(l > 1e-9)) return 1;
    const run = shadowRun(sp.map, sp.motion.at, [d0[0] / l, d0[1] / l]);
    return edgeShare(Math.min(-run[0], run[1]), run[1] - run[0], interior, zonePct, zoneMinCm / 100);
  };
  sp.shareH = shareOf(sp.eH, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm);
  sp.shareV = cfg.faceSpanShareVOn === 1 ? shareOf(sp.eV, cfg.faceSpanShareV, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm) : 1;
  sp.calmRamp = Math.min(1, sp.calmRamp + travel / CALM_RAMP_MM + (atRest ? dtMs / CALM_REST_MS : 0));
  // ⭐⭐⭐ the screen wins — on a settled picture (no roll under way), the camera facing the base (⛔ grazing it, from over the top, its up the face's
  // turned over: the signs flipped mid-drag, back and forth); ⭐⭐⭐ (2026-11-03) mid-drag too, inside the zenith's cone too, a roll just ended at once — ⛔ held
  // until the lift: after the roll under a bottom the piece came out on the far side with a dy reversed on the screen. Whatever the signs,
  // the finger is laid on the gizmo's axes as shown (`fingerAxesFrame`)
  const scr = screenAxes(st);
  const facing = scr !== null && scr.dir[0] * sp.plane.n[0] + scr.dir[1] * sp.plane.n[1] + scr.dir[2] * sp.plane.n[2] >= SPAN_FACING_COS; // `dir`: from the look point toward the camera
  if (st.router.size === 0 && sp.zen !== null) sp.zen.block = false;
  if (!zenithRolling(st) && st.asmRoll === null && facing) spanScreenSigns(st, sp.plane.n);
}

/**
 * ⭐⭐⭐ (2026-11-03) ROUND THE OUTLINE onto the next base (`n2`, one of the box's, at 90°): its shadow; the gizmo where it stood, a hair inside the base it
 * leaves, laid on it (the nearest point of its shadow); its level axes and their senses read again.
 */
function spanCommit(st: SceneState, sp: SpanState, n2: Vec3): void {
  const map = shadowOf(st, n2);
  if (map === null) return;
  const n0 = sp.plane.n;
  const inside: Vec3 = [sp.g[0] - n0[0] * 0.002, sp.g[1] - n0[1] * 0.002, sp.g[2] - n0[2] * 0.002];
  const at = nearestCovered(map, toP2(map.plane, inside));
  if (at === null) return;
  const hit = shadowAt(map, at)!;
  sp.plane = map.plane;
  sp.map = map;
  sp.motion = { at, overMm: 0 };
  sp.h = hit.h;
  sp.g = fromP2(map.plane, at, hit.h);
  sp.foot = fromP2(map.plane, at, 0);
  sp.zen = null;
  if (sp.uPrev !== null) spanZenithKeep(st, sp, sp.uPrev); // ⭐ a top entered: its cone at once
  // ⭐⭐⭐ (third pass) the new base's level axes (a top's latched off the screen now), their senses read again
  const ax = faceAxes(map.plane.n, screenAxes(st)?.right ?? sp.eH);
  sp.eH = ax.h;
  sp.eV = ax.v;
  spanSenses(st, sp);
  spanHitFace(st, sp, hit.tri);
  st.lastVerdict = `face-span: round the outline onto the assembly's ${baseName(map.plane.n)}`;
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
    sp.zen = { e, share: 0, from, sense: rollSense(from, neg, scr?.dir ?? [-n[0], -n[1], -n[2]]), block: false, start: 0 };
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
    z.share = zenithRollStep(z.share, along, rollMm).share;
    rollEnded(st, z);
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
  st.orbitInertia.stop();
  st.hudDirty = true;
  // ⭐⭐⭐ (2026-11-03) a roll ended in this drag: no roll straight back — held at the zenith (the finger the other way goes on; lifted, it may roll back)
  if (z.block && st.router.size > 0) {
    st.lastVerdict = "face-span: rolled — drag the other way on the screen to go on (lift, then back over the top to unroll)";
    return;
  }
  z.start = z.share;
  z.share = zenithRollStep(z.share, along * (1 - k), rollMm).share;
  rollEnded(st, z);
  st.lastVerdict = "face-span: over the top — the piece waits, the camera rolls (back to unroll)";
}

/** ⭐⭐⭐ (2026-11-03) A zenith roll ended at its OTHER end with a finger on the glass: the step back held until the lift (`SpanZenith.block`). */
function rollEnded(st: SceneState, z: SpanZenith): void {
  if ((z.share === 0 || z.share === 1) && z.share !== z.start && st.router.size > 0) z.block = true;
}

/** ⭐ The screen's up the zenith's roll shows (`null`: no roll latched). */
export function spanZenithUp(st: SceneState): { from: Vec3; to: Vec3; share: number; sense: 1 | -1 } | null {
  const z = st.span?.zen ?? null;
  if (z === null) return null;
  return { from: z.from, to: [-z.from[0], -z.from[1], -z.from[2]], share: z.share, sense: z.sense };
}

/** ⭐ Back from a slide: the shadow gizmo found again where the slide left it (its real face snapped to the box, else the piece's direction); the calm kept. */
export function spanAfterSlide(st: SceneState, at: Vec3, u: Vec3): void {
  const sp = st.span;
  if (sp === null) return;
  sp.slid = false;
  sp.uPrev = null;
  sp.input = { yaw: 0, pitch: 0, frame: "" };
  if (!spanEngage(st, at, st.gizmoNormal ?? null, u)) {
    st.span = sp;
    return;
  }
  st.span!.calmRamp = sp.calmRamp;
}

/** ⭐ The lines' points per line (a fixed vertex count — the mesh updated in place). */
const SPAN_LINE_PTS = 256;
const GREEN = new Color4(0.35, 0.8, 0.35, 1);
const RED = new Color4(0.9, 0.25, 0.2, 1);

/**
 * ⭐⭐⭐ THE RED AND GREEN LINES: ⭐⭐⭐ (2026-11-03) each the SHADOW's profile through the gizmo in ONE plane — green the level plane along the base's level
 * axis, red the vertical plane along its vertical (a top: the two vertical planes at 90°) — across its run on the outline (`shadowRun`), a step drawn as its
 * connector in the plane (`spanPolyline`; the gizmo itself jumps it), lifted 2 mm. Hidden with the sections' slider, under a slide.
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
  const key = `${p.n.map((x) => x.toFixed(4)).join(",")}|${st.cfg.shadowBridgeMm}|${at[0].toFixed(5)},${at[1].toFixed(5)}|${sp.eYaw.map((x) => x.toFixed(3)).join(",")}|${sp.ePitch.map((x) => x.toFixed(3)).join(",")}`;
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
    const run = shadowRun(sp.map, at, d);
    const h = (t: number): number => shadowAt(sp.map, [at[0] + d[0] * t, at[1] + d[1] * t])?.h ?? sp.h;
    const pts = spanPolyline(h, run[0], run[1], Math.max(0.004, (run[1] - run[0]) / 120), 0.001, SPAN_LINE_PTS);
    return pts.map(([t, hh]) => {
      const w = fromP2(p, [at[0] + d[0] * t, at[1] + d[1] * t], hh + SPAN_LINE_LIFT_M);
      return new Vector3(w[0], w[1], w[2]);
    });
  };
  const pad = (pts: Vector3[]): Vector3[] => {
    const g = fromP2(p, at, sp.h + SPAN_LINE_LIFT_M);
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
