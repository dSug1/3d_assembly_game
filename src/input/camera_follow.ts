/**
 * ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` — the owner: *"keep the camera movement as a simple polar orbit and find the
 * function which links it to the orbit of the gizmo smoothly"*) THE CAMERA FOLLOWER — pure rules, no engine.
 *
 * F2 (the second part): THE FOLLOWER — one ease on the sphere, the pose drawn far out (⛔ R6: the pole's detour by place and the polar camera deleted).
 *
 * F1 (this file's first part): THE DIRECTION ASKED — the calm's target as `calmTargets` hands it to its ease, with the whole shares by position folded in
 * (`askedCalm`): the calm WITHOUT its 120 ms ease (D-F6: the follower's one ease replaces it). Read at the rig's solved angles by `askedDir` (the wiring).
 *
 * H2 (the file's end, `CAMERA_FOLLOWS_GIZMO.md` §15 – §16; ⛔ R6: its switch `followTop` deleted): THE TOP AND BOTTOM FAR OUT — the heading the calm's LEVELLED reading (carried
 * where it has none), the height capped; at a facet change the follower's own turn by close in's functions, the gizmo waiting, the dy hold after a half turn.
 */
import type { Vec3 } from "../core/vec";
import { calmLevelHeading, calmShown, LEVEL_HEADING_BLEND_RAD, LEVEL_HEADING_FROM_RAD, type CalmState } from "./orbit_calm";
import { offsetFrame, orbitDir } from "./assembly_orbit";
import { mulT, rollDurationMs, tiltDir, type Mat3 } from "./orbit_tilt";
import { crossingEvent, FREE_EXIT_HOLD_FROM_RAD, isFreeFace, turnHolds } from "./free_face";
import { turnHoldsGizmo } from "./seam_turn";

/** ⭐ The calm's target as `calmStep` takes it (`calmTarget`'s answer, or a cap's `n: null`). */
export interface CalmAskTarget {
  readonly n: Vec3 | null;
  readonly sH: number;
  readonly sV: number;
  readonly wA?: number;
  readonly poleFade?: boolean;
}

/**
 * ⭐⭐⭐ (F1) THE CALM ASKED: the target itself as a calm state (no ease: its shares and normal as given), the whole shares by position folded in exactly as
 * `calmDir` folds the eased ones (`kH` on both, `kV` on the vertical — `max(0, kH, kV)`). `null` over a cap (`n` null): the orbit's own direction.
 */
export function askedCalm(tg: CalmAskTarget, kH: number, kV: number): CalmState | null {
  if (tg.n === null) return null;
  const h = Math.max(0, kH);
  const v = Math.max(0, kH, kV);
  return {
    n: tg.n,
    sH: 1 - (1 - tg.sH) * (1 - h),
    sV: 1 - (1 - tg.sV) * (1 - v),
    wA: tg.wA ?? 0,
    ...(tg.poleFade !== undefined ? { poleFade: tg.poleFade } : {}),
  };
}

/* ⭐⭐⭐ F2 — THE FOLLOWER: one ease on the sphere, the pole's detour by place, the polar camera (world up), the pose. ---------------------------------- */

/* ⛔ (2026-11-22, `PICTURE_REBUILD.md` §8.6 — R6) the detour's knobs (`FollowKnobs`: `followFromDeg`, `followMaxDegS`) and its cap deleted with it. */

/** ⭐ The detour's one remembered bit (O7) and its frame: on near a pole, which pole, the azimuth it came in at, the side it goes round — ⛔ (R6) the detour
 *  deleted; kept as the follower's record reads it (`asmFollow.rec`: `side`, `det`), at `followStart`'s rest. */
export interface FollowDetour {
  readonly on: boolean;
  readonly pole: 1 | -1;
  readonly phiIn: number;
  readonly side: 1 | -1;
  /** the followed direction's azimuth last frame (its lateral drift at the entry) — `null`: none yet */
  readonly phiWas: number | null;
}

/** ⭐ The follower's state: the spring (`d`, its tangent speed `v`), his pace, the detour, the camera's yaw (drawn `psi`, asked `psiT` unwrapped), the output. */
export interface FollowState {
  readonly d: Vec3;
  readonly v: Vec3;
  readonly tWas: Vec3;
  readonly pace: number;
  readonly det: FollowDetour;
  readonly psi: number;
  readonly psiT: number;
  readonly azWas: number | null;
  readonly psiStep: number;
  /** the followed direction drawn: the camera's and the piece's (unit) */
  readonly dir: Vec3;
}

const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scale3 = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const len3 = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a: Vec3): Vec3 => {
  const l = len3(a);
  return l > 1e-12 ? scale3(a, 1 / l) : [0, 0, 1];
};
const clampN = (x: number, a: number, b: number): number => Math.max(a, Math.min(b, x));
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const angleOf = (a: Vec3, b: Vec3): number => Math.acos(clampN(dot3(a, b), -1, 1));
const DEG = Math.PI / 180;

/** ⭐ The tangent at `f` toward `t` (its length the angle) — the sphere's log. */
function logAt(f: Vec3, t: Vec3): Vec3 {
  const th = angleOf(f, t);
  if (th < 1e-12) return [0, 0, 0];
  let p: Vec3 = add3(t, scale3(f, -dot3(f, t)));
  if (len3(p) < 1e-12) p = unit3(Math.abs(f[1]) < 0.9 ? cross3(f, [0, 1, 0]) : cross3(f, [1, 0, 0]));
  return scale3(unit3(p), th);
}

/** ⭐ `f` moved along the tangent `s` (its length the angle) — the sphere's exp. */
function expAt(f: Vec3, s: Vec3): Vec3 {
  const th = len3(s);
  return th < 1e-12 ? f : unit3(add3(scale3(f, Math.cos(th)), scale3(unit3(s), Math.sin(th))));
}

/** ⭐ `v` turned by the least turn taking `a` to `b` (a tangent carried along). */
function carried(v: Vec3, a: Vec3, b: Vec3): Vec3 {
  const ax = cross3(a, b);
  const s = len3(ax);
  if (s < 1e-12) return v;
  const k = scale3(ax, 1 / s);
  const th = Math.atan2(s, dot3(a, b));
  const c = Math.cos(th);
  const sn = Math.sin(th);
  return add3(add3(scale3(v, c), scale3(cross3(k, v), sn)), scale3(k, dot3(k, v) * (1 - c)));
}

/**
 * ⭐⭐⭐ (F2) THE ONE EASE: a critically damped spring ON THE SPHERE (Lowe, *Game Programming Gems 4*, 2004: exact for a still target) — the direction
 * `d` and its tangent speed `v` (rad a second) toward `t` over `dtS`; no overshoot from rest. ⛔ Yaw and pitch filtered as two numbers wrap and stall at
 * the vertical (`CAMERA_FOLLOWS_GIZMO.md` §5.3).
 */
export function sphereSpring(d: Vec3, v: Vec3, t: Vec3, dtS: number, tauS: number): { readonly d: Vec3; readonly v: Vec3 } {
  if (!(tauS > 0) || !(dtS > 0)) return { d: t, v: [0, 0, 0] };
  const e = logAt(d, t);
  const om = 2 / tauS;
  const x = scale3(e, -1);
  const tmp = scale3(add3(v, scale3(x, om)), dtS);
  const ex = Math.exp(-om * dtS);
  const v1 = scale3(add3(v, scale3(tmp, -om)), ex);
  const x1 = scale3(add3(x, tmp), ex);
  const d1 = expAt(d, add3(e, x1));
  return { d: d1, v: carried(v1, d, d1) };
}

/* ⛔ (2026-11-22, `PICTURE_REBUILD.md` §8.6 — R6) THE DETOUR (`followTop` 0, `de4a10e`'s far heading): `poleDetour`, `followCeiling`, `polarStep` deleted. */

/** ⭐ The follower started on `t` (at rest): the first frame, or back from close in on the direction the piece is drawn along. */
export function followStart(t: Vec3): FollowState {
  const az = Math.hypot(t[0], t[2]) > 1e-5 ? Math.atan2(t[0], t[2]) : 0;
  return { d: t, v: [0, 0, 0], tWas: t, pace: 0, det: { on: false, pole: 1, phiIn: 0, side: 1, phiWas: null }, psi: az, psiT: az, azWas: null, psiStep: 0, dir: t };
}

/* ⛔ (R6) `followStep` (the detour's frame) deleted with it. */

/**
 * ⭐⭐⭐ (F2, D-F3, D-F5) THE POSE DRAWN FAR OUT: the piece hung along the followed direction `dir` from the gizmo's foot `foot` (`hangM`: the logic's own
 * hang); the camera on the polar orbit about the look point `look` — its direction `dir` turned by the owner's camera offsets in the WORLD-UP frame
 * (`offsetFrame` at `dir`'s own heading), `gapM` behind the piece's distance; the up the world's. One owner: nothing else turns it.
 */
export function followPose(dir: Vec3, look: Vec3, foot: Vec3, hangM: number, gapM: number, offYawRad: number, offPitchRad: number): { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3; readonly piece: Vec3 } {
  const piece = add3(foot, scale3(dir, hangM));
  const f = offsetFrame(dir, Math.atan2(dir[2], dir[0]), offYawRad, offPitchRad);
  const r = len3(add3(piece, scale3(look, -1))) + Math.max(0, gapM);
  return { eye: add3(look, scale3(f.dir, r)), look, up: [0, 1, 0], piece };
}

/* ⭐⭐⭐ H2 (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §15 – §16, the owner's D-H1 – D-H8) THE TOP AND BOTTOM FAR OUT (⛔ R6: its switch `followTop` deleted) ------
 * The camera's HEADING target is the calm's LEVELLED reading (its horizontal reading only — a dy cannot move it, a dx moves it with the red section by the
 * calm's share, D-H7); where it has none (a level face, or no calm near the vertical) the heading is CARRIED. Its HEIGHT is the asked direction's, capped
 * 90° − `followPoleDeg` off the horizon (the detour replaced: D-H1). No region, no threshold, no time. The only joins are the EDGES: at a facet change of the
 * gizmo (the logic's own crossing, model space) a gap over `followTurnMinDeg` is the follower's own TURN — its duration by its angle (`rollDurationMs`), at
 * least his own pace (D-H6), the gizmo WAITING meanwhile (`turnHoldsGizmo`, read by `tiltClampStep`), the turn owning the heading and the spring the height;
 * a turn over 90° made by the dy that crossed holds that dy after it (`crossingEvent`, `turnHolds` — D-T4's two conditions, D-H8). One owner per thing. */

/** ⭐ A facet change: the gizmo's facet normal (world, the MODEL's) turned more than this since the frame before. */
export const FOLLOW_FACET_CHANGE_RAD = (0.5 * Math.PI) / 180;
/** ⭐ A level part shorter than this has no heading. */
const LEVEL_EPS = 1e-6;
const UP: Vec3 = [0, 1, 0];

/** ⭐ The follower's heading of a direction (its convention: `atan2(x, z)`) — `null`: no level part. */
export function headingOf(d: Vec3): number | null {
  return Math.hypot(d[0], d[2]) > LEVEL_EPS ? Math.atan2(d[0], d[2]) : null;
}

/** ⭐ The direction at the heading `psi` and the elevation `el` (rad). */
export function dirAtHeading(psi: number, el: number): Vec3 {
  return [Math.cos(el) * Math.sin(psi), Math.sin(el), Math.cos(el) * Math.cos(psi)];
}

/**
 * ⭐⭐⭐ (H2, §15.4) THE CALM'S LEVELLED READING — the heading TARGET far out (rad, the follower's convention), or `null`: carried. The calm asked `c` (its
 * normal in the orbit's frame F; `R`: F → world, `null` the world's) read LEVEL at the orbit's `yaw` (`calmLevelHeading`: its horizontal share of the yaw's
 * angle off the face's own heading, whatever the pitch — the reading the world camera's level heading already takes), that level direction of F turned into
 * the world: its heading. ⭐ Made exact in the build (§16): ⛔ `calmShown` with its vertical share 0 (§15.4 as written) — on a cap the calm reads ACROSS
 * (`wA` ≈ 1 at a side's top edge: the latitude toward the face's axis), which shrinks to nothing at the pole: a pure dy turned the heading back to the face's
 * normal; the level reading is the angle ROUND the vertical, unchanged by a dy. And the reading KEPT ON ITS FACE'S SIDE of the vertical (its level part against
 * the facet normal's): the calm is whole at an edge, so over a ridge it passed the vertical where the orbit did, not where the facet changes — kept, the half
 * turn sits exactly on the edge. `null` (carried): the calm's facet LEVEL (`isFreeFace` in the world — a spit's bottom), no level part at all; no calm: the
 * orbit's own heading, carried within `poleDeg` of the vertical.
 */
export function levelledHeading(yaw: number, v: number, c: CalmState | null, R: Mat3 | null, poleDeg: number): number | null {
  if (c === null) {
    const w = tiltDir(R, orbitDir(yaw, v));
    if (Math.abs(w[1]) >= Math.cos(Math.max(0, poleDeg) * DEG)) return null;
    return headingOf(w);
  }
  const n = tiltDir(R, c.n);
  if (isFreeFace(n, UP)) return null;
  const y = calmLevelHeading(yaw, c);
  const r = tiltDir(R, [Math.cos(y), 0, Math.sin(y)]);
  const nh = Math.hypot(n[0], n[2]);
  if (Math.hypot(r[0], r[2]) > LEVEL_EPS && (nh <= LEVEL_EPS || r[0] * n[0] + r[2] * n[2] > 0)) return Math.atan2(r[0], r[2]);
  return headingOf(n);
}

/**
 * ⭐⭐⭐ (2026-11-21, `TOP_BOTTOM_STUDY.md` §3, §9, D-H19 — packet R5, `pictureOne` 1) THE BAND'S SHARE of the calm asked's own heading in the far reading:
 * `cameraHeading`'s own band (`LEVEL_HEADING_BLEND_RAD` 50°, `LEVEL_HEADING_FROM_RAD` 60°, a smoothstep) read on the ORBIT's direction in the WORLD (`orbitW`,
 * his finger's place) — 1 below 50° of its world elevation, 0 from 60°. ⛔ F's pitch: on a spit F's pitch is a world YAW (the root of A, B and point 2, §8).
 */
export function farReadingShare(orbitW: Vec3): number {
  const p = Math.asin(clampN(Math.abs(orbitW[1]), 0, 1));
  const x = clampN((LEVEL_HEADING_FROM_RAD - p) / (LEVEL_HEADING_FROM_RAD - LEVEL_HEADING_BLEND_RAD), 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ (2026-11-21, `TOP_BOTTOM_STUDY.md` §3, §9, D-H19 — packet R5, `pictureOne` 1) THE FAR READING: the heading the far follower aims at (rad, the
 * follower's convention), or `null`: carried. The calm asked `c` (its normal in F; `R`: F → world) at the orbit's `yaw`, `v`: below 50° of the orbit's
 * WORLD elevation (`orbitW`) the calm asked's own world heading (`de4a10e`'s calm — the direction asked, `askedDir`'s), from 60° H2's level reading
 * (`levelledHeading`: no yaw on a pure dy near the vertical, the half turn at the zenith edge), a smoothstep between (`farReadingShare`); a LEVEL face
 * (`isFreeFace` in the world) carried at every elevation. One rule for every frame. ⛔ H2's reading at every elevation: in a spit F's level is the
 * vertical plane square to the axis — the calm toward a tip dropped (A), the bottom triangle's reading flipping on a 1e-9 residue (B), a turn along the
 * apex edges (point 2).
 */
export function farReading(yaw: number, v: number, c: CalmState | null, R: Mat3 | null, poleDeg: number, orbitW: Vec3): number | null {
  if (c !== null && isFreeFace(tiltDir(R, c.n), UP)) return null;
  const L = levelledHeading(yaw, v, c, R, poleDeg);
  const s = farReadingShare(orbitW);
  if (!(s > 0)) return L;
  const own = headingOf(tiltDir(R, calmShown(orbitDir(yaw, v), c)));
  if (own === null) return L;
  if (L === null || s >= 1) return own;
  return wrapPi(L + s * wrapPi(own - L));
}

/** ⭐⭐⭐ (H2, D-H1) THE SPRING'S TARGET: the heading `psi`, the asked direction's elevation capped at 90° − `poleDeg` (60°) either way. */
export function followTopTarget(psi: number, ask: Vec3, poleDeg: number): Vec3 {
  const cap = Math.PI / 2 - Math.max(0, poleDeg) * DEG;
  return dirAtHeading(psi, clampN(Math.asin(clampN(ask[1], -1, 1)), -cap, cap));
}

/**
 * ⭐⭐⭐ (H2, D-H6 — the owner: *"Your pace + a slider"*) THE TURN'S SPEED (deg a second): close in's (`rollDegS`, `tiltRollDegS`) raised toward his own orbit
 * pace at the crossing (`paceRadS`) by `share` — 1 (the default) his pace whenever it is faster, never slower than close in's; 0 close in's speed.
 */
export function followTurnDegS(paceRadS: number, rollDegS: number, share: number, maxDegS = 0): number {
  const base = Math.max(0, rollDegS);
  const v = base + clampN(share, 0, 1) * Math.max(0, Math.max(0, paceRadS) / DEG - base);
  // ⭐⭐⭐ (H3, F-2 — the owner: *"let's clamp the realignment speed (slider)"*) never over `maxDegS` (`followTurnMaxDegS`; 0: no clamp) — over close in's floor too
  return maxDegS > 0 ? Math.min(v, maxDegS) : v;
}

/**
 * ⭐⭐⭐ (H3, F-2 = D-H10) HIS FINGER'S PACE on the glass (rad a second): the finger's deadbanded travel this frame (`mm`, as the orbit reads it) a second × the
 * orbit's own degrees per mm far out (`degPerMm`: `orbitDegPerMm`'s yaw — the dy's too far out) — ⛔ the orbit's direction's speed (2 500 – 6 500°/s near
 * `Scene_0bis`'s bottom while the finger moved at his pace: root (b), `CAMERA_FOLLOWS_GIZMO.md` §16.4).
 */
export function followFingerPace(mm: number, dtS: number, degPerMm: number): number {
  return dtS > 0 ? (Math.max(0, mm) / dtS) * Math.max(0, degPerMm) * DEG : 0;
}

/** ⭐⭐⭐ (H2) The follower's own turn: from the heading `psi0` by `delta` (rad, signed) over `durMs`, `tMs` run, its share `k` (1: whole). */
export interface FollowTurn {
  readonly psi0: number;
  readonly delta: number;
  readonly durMs: number;
  readonly tMs: number;
  readonly k: number;
}

/**
 * ⭐⭐⭐ (H2, §15.5) THE TURN'S ANGLE: the heading drawn `psiDrawn` to the levelled reading beyond the edge `psiTo` (O2, computed — none, a quarter, a half by
 * the edge left), the half turn's tie broken the way the heading was going (`step`, `polarStep`'s rule).
 */
export function followTurnDelta(psiDrawn: number, psiTo: number, step: number): number {
  let d = wrapPi(psiTo - psiDrawn);
  if (Math.abs(d) > 170 * DEG && step !== 0 && Math.sign(d) !== Math.sign(step)) d -= Math.sign(d) * 2 * Math.PI;
  return d;
}

/** ⭐⭐⭐ (H2, §15.5) A TURN STARTED at an edge: none under `minDeg` (the spring pays it); its duration by its angle at `degS` (close in's `rollDurationMs`). */
export function followTurnStart(psi0: number, delta: number, minDeg: number, degS: number): FollowTurn | null {
  if (!(Math.abs(delta) >= Math.max(0, minDeg) * DEG) || !(Math.abs(delta) > 0)) return null;
  const durMs = rollDurationMs(delta, degS);
  return { psi0, delta, durMs, tMs: 0, k: durMs > 0 ? 0 : 1 };
}

/** ⭐⭐⭐ (H2) ONE FRAME OF THE TURN: its clock by time (close in's), its share `k` the time run over its duration. */
export function followTurnStep(t: FollowTurn, dtMs: number): FollowTurn {
  const tMs = t.tMs + Math.max(0, dtMs);
  return { ...t, tMs, k: t.durMs > 0 ? Math.min(1, tMs / t.durMs) : 1 };
}

/** ⭐⭐⭐ (H2, R3 — close in's T5) THE GIZMO WAITS while the follower's turn runs: `turnHoldsGizmo`'s timed case (held while short of whole). */
export function followTurnHoldsGizmo(t: FollowTurn | null): boolean {
  return t !== null && turnHoldsGizmo(false, false, false, false, t.k);
}

/** ⭐⭐⭐ (H2, D-H8 = D-T4) THE DY HELD AFTER THE TURN: only a turn over 90° (`turnHolds`, `FREE_EXIT_HOLD_FROM_RAD`) with the crossing's own hold (`crossingEvent`). */
export function followTurnHold(delta: number, crossingHold: 1 | -1 | 0): 1 | -1 | 0 {
  return turnHolds(Math.abs(delta), FREE_EXIT_HOLD_FROM_RAD) ? crossingHold : 0;
}

/** ⭐⭐⭐ (H2) The follower's top state: the heading target (`psiT`, carried), the gizmo's facet normal last frame (`nW`), the turn, the heading's last step, the orbit's direction last frame and his pace (its speed, a peak decaying on the follower's ease). */
export interface FollowTop {
  readonly psiT: number;
  readonly nW: Vec3 | null;
  readonly turn: FollowTurn | null;
  readonly step: number;
  readonly orbitWas: Vec3;
  readonly pace: number;
  /** ⭐⭐⭐ (R5, D-H13) the far follower's two angles (`followFarStep`; absent: started at rest on the drawn direction) — `turn` then runs in its offset */
  readonly hd?: FollowHead;
}

/** ⭐ The top's knobs: the spring's time, the height's cap, the band under which the spring pays, close in's speed, the pace share (D-H6). */
export interface FollowTopKnobs {
  readonly tauMs: number;
  readonly poleDeg: number;
  readonly minDeg: number;
  readonly rollDegS: number;
  readonly paceShare: number;
  /* ⛔ (2026-11-22, `PICTURE_REBUILD.md` §8.6 — R6) `onJump`, `finger` (H3's switches `followTurnOnJump`, `followTurnFinger`) deleted with their 0 (H2's): the
   * turn only where the reading itself jumps (F-1, D-H9), his pace read on his FINGER (F-2, D-H10: `fingerMm` × `degPerMm`), always */
  /** ⭐ (H3, F-2) the orbit's own degrees per mm far out (`orbitDegPerMm`'s yaw) */
  readonly degPerMm?: number;
  /** ⭐ (H3, F-2) the turn's top speed (deg a second; 0 / absent: no clamp) */
  readonly maxDegS?: number;
  /** ⭐⭐⭐ (2026-11-22 evening, `CAMERA_FOLLOWS_GIZMO.md` §20.8, D-H24 — `followLeashPace`) the taut leash at HIS FINGER's pace (never under the clamp); absent /
   *  false: at the reading's pace (as built in R5 — its spikes copied) */
  readonly leashPace?: boolean;
}

/**
 * ⭐ One frame's readings: the direction asked, the orbit's own direction in the world (the finger's place — his pace: ⛔ the asked direction's speed, a
 * step of it at a change read as his pace), the levelled reading (`null`: carried), the gizmo's facet normal, the glass's up drawn, the dy pushing.
 */
export interface FollowTopIn {
  readonly ask: Vec3;
  readonly orbit: Vec3;
  readonly psiL: number | null;
  readonly nW: Vec3 | null;
  readonly upShown: Vec3 | null;
  readonly dySign: number;
  /** ⭐ (H3, F-2) the finger's deadbanded travel this frame (mm, the orbit's — `asmOrbitMm` as `assemblyFrame` took it); absent: 0 */
  readonly fingerMm?: number;
}

/** `v` kept along the meridian at the heading `psi`, elevation `el` (the turn owns the heading: the spring keeps the height). */
function meridional(v: Vec3, psi: number, el: number): Vec3 {
  const e: Vec3 = [-Math.sin(el) * Math.sin(psi), Math.cos(el), -Math.sin(el) * Math.cos(psi)];
  return scale3(e, dot3(v, e));
}

/**
 * ⭐⭐⭐ (H2) ONE FRAME OF THE FOLLOWER WITH THE TOP'S RULE: at a facet change (the gizmo's facet normal turned) the turn's angle from the heading drawn to the
 * levelled reading (`followTurnDelta`), a turn over the band started at his pace (`followTurnStart`, `followTurnDegS`), the dy hold decided (`hold`, written by
 * the wiring through `holdAtCrossing`: it replaces any older one, a 0 writes none); while a turn runs it owns the heading (the spring's direction laid on its
 * meridian), the spring keeps the height; else the spring toward the heading target and the capped height. `s` / `top` `null`: started on the direction asked.
 * ⭐⭐⭐ (H3, `CAMERA_FOLLOWS_GIZMO.md` §17.3) F-1: the turn only on the reading's own jump; F-2: his finger's pace, `k.maxDegS` its clamp (⛔ R6: H2's
 * rules, the switches 0, deleted); `started`: a turn started this frame (F-3: the wiring sets every angle state to the map's place then — `seamRebase`).
 */
export function followTopStep(
  s: FollowState | null,
  top: FollowTop | null,
  inp: FollowTopIn,
  dtMs: number,
  k: FollowTopKnobs,
): { readonly s: FollowState; readonly top: FollowTop; readonly hold?: 1 | -1 | 0; readonly delta: number | null; readonly started: boolean } {
  const s0 = s ?? followStart(inp.ask);
  const dtS = Math.max(0, dtMs) / 1000;
  const psiD = headingOf(s0.d) ?? s0.psi;
  const t0: FollowTop = top ?? { psiT: psiD, nW: inp.nW, turn: null, step: 0, orbitWas: inp.orbit, pace: 0 };
  // his pace: ⭐⭐⭐ (H3, F-2) his FINGER's on the glass (`followFingerPace`), a peak decaying on the follower's ease (⛔ R6: H2's, the orbit's direction's, deleted)
  const paceNow = followFingerPace(inp.fingerMm ?? 0, dtS, k.degPerMm ?? 0);
  const pace = Math.max(paceNow, k.tauMs > 0 ? t0.pace * Math.exp(-Math.max(0, dtMs) / k.tauMs) : 0);
  const psiL = inp.psiL ?? t0.psiT;
  let turn = t0.turn;
  let hold: 1 | -1 | 0 | undefined;
  let delta: number | null = null;
  let started = false;
  if (t0.nW !== null && inp.nW !== null && angleOf(t0.nW, inp.nW) > FOLLOW_FACET_CHANGE_RAD) {
    const degS = followTurnDegS(pace, k.rollDegS, k.paceShare, k.maxDegS ?? 0);
    const crossHold = inp.upShown === null ? 0 : crossingEvent(inp.upShown, t0.nW, inp.nW, UP, inp.dySign).hold;
    // ⭐⭐⭐ (H3, F-1 = D-H9) THE READING'S OWN JUMP across the edge: the reading after the change − the reading the frame before (or the heading carried),
    // the half turn's tie the way the heading was going — ⛔ measured from the heading DRAWN (root (a): the spring's lag behind his dx paid as a turn at
    // every facet change, a vertical edge too — his point 1; ⛔ R6: that H2 rule deleted). From the band a turn of that jump applied from the heading drawn
    // (the lag before the edge kept, left to the spring), a running turn's rest carried into it; under it nothing: no turn (a running one goes on), no wait,
    // no hold
    const jump = followTurnDelta(t0.psiT, psiL, t0.step);
    delta = jump;
    if (Math.abs(jump) >= Math.max(0, k.minDeg) * DEG && Math.abs(jump) > 0) {
      const from = turn !== null ? turn.psi0 + turn.k * turn.delta : psiD;
      const rest = turn !== null ? (1 - turn.k) * turn.delta : 0;
      turn = followTurnStart(from, rest + jump, 0, degS);
      started = turn !== null;
    }
    hold = followTurnHold(jump, crossHold);
  }
  let sp: { readonly d: Vec3; readonly v: Vec3 };
  let tg: Vec3;
  if (turn !== null) {
    turn = followTurnStep(turn, dtMs);
    const psi = turn.psi0 + turn.k * turn.delta;
    const el0 = Math.asin(clampN(s0.d[1], -1, 1));
    tg = followTopTarget(psi, inp.ask, k.poleDeg);
    const r = sphereSpring(dirAtHeading(psi, el0), meridional(s0.v, psi, el0), tg, dtS, k.tauMs / 1000);
    const el1 = Math.asin(clampN(r.d[1], -1, 1));
    sp = { d: dirAtHeading(psi, el1), v: meridional(r.v, psi, el1) };
    if (turn.k >= 1) turn = null;
  } else {
    tg = followTopTarget(psiL, inp.ask, k.poleDeg);
    sp = sphereSpring(s0.d, s0.v, tg, dtS, k.tauMs / 1000);
  }
  const psiN = headingOf(sp.d) ?? psiD;
  const stp = wrapPi(psiN - psiD);
  const step = Math.abs(stp) > 1e-9 ? stp : t0.step;
  const paceS = Math.max(len3(sp.v), dtS > 0 ? angleOf(s0.d, sp.d) / dtS : 0);
  return {
    s: { d: sp.d, v: sp.v, tWas: tg, pace: paceS, det: s0.det, psi: psiN, psiT: psiL, azWas: s0.azWas, psiStep: step, dir: sp.d },
    top: { psiT: psiL, nW: inp.nW ?? t0.nW, turn, step, orbitWas: inp.orbit, pace },
    ...(hold !== undefined ? { hold } : {}),
    delta,
    started,
  };
}

/* ⭐⭐⭐ R5 — THE FAR TARGET'S TOP RULE AS DECIDED (2026-11-21, `PICTURE_REBUILD.md` §4.7, `TOP_BOTTOM_STUDY.md` §3, §6: D-H13 – D-H19), `pictureOne` 1 ---- */

/** ⭐ (R5, D-H15) a calm asked carried into the WORLD (`R`: F → world) — kept a frame, so it is read again at the next frame's angles in that frame's F. */
export function calmWorld(c: CalmState | null, R: Mat3 | null): CalmState | null {
  return c === null || R === null ? c : { ...c, n: tiltDir(R, c.n) };
}

/** ⭐ (R5, D-H15) a calm kept in the WORLD read in the frame `R` (F → world): its normal turned by `Rᵀ`. */
export function calmInFrame(cW: CalmState | null, R: Mat3 | null): CalmState | null {
  return cW === null || R === null ? cW : { ...cW, n: mulT(R, cW.n) };
}

/**
 * ⭐⭐⭐ (R5, D-H15 — `TOP_BOTTOM_STUDY.md` §3 H-3) THE READING'S JUMP, BY GEOMETRY: this frame's far reading `psiL` minus LAST frame's calm's read at THIS
 * frame's angles `psiLWas` — so the reading's own motion (his finger's) is never a jump, at any pace; a carried one (a level face, `null`) is the heading
 * carried `psiT`; `psiLWas` absent (no calm kept): none. ⛔ A frame's difference (F-1, O-a): at 1 620°/s the reading moves 27° a frame — a "jump" at a
 * vertical edge (his point 1).
 */
export function farJump(psiL: number | null, psiLWas: number | null | undefined, psiT: number): number {
  if (psiLWas === undefined) return 0;
  return wrapPi((psiL ?? psiT) - (psiLWas ?? psiT));
}

/**
 * ⭐⭐⭐ (2026-11-22 evening, `CAMERA_FOLLOWS_GIZMO.md` §20, D-H23) THE FAR JUMP READ AT ONE PLACE: for each crossing of the calm's SOURCE this frame, the
 * far readings either side of it, both at THIS frame's angles (`[left, entered]`; `null`: a level face, the heading carried `psiT`) — their differences
 * summed, wrapped; no crossing: 0. ⛔ D-H15 as built (`farJump`): last frame's calm — last frame's PLACE — so the calm's share ramp crossed in one big step
 * read as a jump (10 – 40° on his records), a pace threshold (§18.4's Root 1 again). At one place a vertical edge reads 0 at any pace (the bounce's
 * lesson: a side's normal cancels out with its horizontal share whole at its edge; step 2.4e: every face's share whole at its own edges).
 */
export function farJumpAcross(pairs: readonly (readonly [number | null, number | null])[], psiT: number): number {
  let j = 0;
  for (const [a, b] of pairs) j += wrapPi((b ?? psiT) - (a ?? psiT));
  return wrapPi(j);
}

/**
 * ⭐⭐⭐ (2026-11-22 evening, §20, D-H23) WHERE A STEP CROSSES A CHANGE OF SOURCE: `id(s)` the source at the fraction `s` of the step (0 last frame's place, 1
 * this frame's), sampled `samples` times; each change bracketed by `bisect` halvings (`lo` still the source before, `hi` the one after). Two changes
 * between neighbouring samples are read as one (the first source left, the one found after). Pure: no engine, no clock.
 */
export function placeCrossings(id: (s: number) => string, samples: number, bisect: number): readonly { readonly lo: number; readonly hi: number }[] {
  const n = Math.max(1, Math.floor(samples));
  const out: { lo: number; hi: number }[] = [];
  let s0 = 0;
  let k0 = id(0);
  for (let i = 1; i <= n; i++) {
    const s1 = i / n;
    const k1 = id(s1);
    if (k1 !== k0) {
      let lo = s0;
      let hi = s1;
      for (let j = 0; j < Math.max(0, Math.floor(bisect)); j++) {
        const m = (lo + hi) / 2;
        if (id(m) === k0) lo = m;
        else hi = m;
      }
      out.push({ lo, hi });
    }
    s0 = s1;
    k0 = k1;
  }
  return out;
}

/** ⭐ (R5) One frame's readings far out: the top's (`FollowTopIn`, `psiL` the far reading — `farReading`) and last frame's calm's at this frame's angles. */
export interface FollowFarIn extends FollowTopIn {
  /** ⭐ (D-H15) last frame's calm asked read at THIS frame's angles (`farReading`): `null` carried (a level face); absent: none kept (no jump read) */
  readonly psiLWas?: number | null;
  /**
   * ⭐⭐⭐ (2026-11-22, `CAMERA_FOLLOWS_GIZMO.md` §19, D-H20 — `followTurnAtGizmo`) the far reading AT THE PLACE THE GIZMO WILL WAIT if a turn starts this
   * frame (F-3's place: the map's place shown, this frame's calm asked): the turn is aimed there and it is the reading carried. Absent or `null`: `psiL`.
   */
  readonly psiLAt?: number | null;
  /**
   * ⭐⭐⭐ (2026-11-22 evening, `CAMERA_FOLLOWS_GIZMO.md` §20, D-H23 — `followJumpAtPlace`) THE JUMP READ AT ONE PLACE: the far readings either side of each
   * crossing of the calm's source this frame, at this frame's angles (`farJumpAcross`); empty: none crossed, no jump. Absent: the jump as built (`psiLWas`).
   */
  readonly jumpAt?: readonly (readonly [number | null, number | null])[];
}

/**
 * ⭐⭐⭐ (R5, D-H13 — `TOP_BOTTOM_STUDY.md` §3 H-2, E-1) THE FAR FOLLOWER'S TWO ANGLES: the heading and the elevation as two 1-D followers. `c` the continuous
 * reading (UNWRAPPED: each frame's own motion of the reading, the jumps a turn took removed), `h` / `hv` the heading's follower on it, `e` / `ev` the
 * elevation's, `off` the turns' offset paid (the heading drawn `h + off`; a running turn pays its own share of it, `FollowTop.turn` in this offset).
 */
export interface FollowHead {
  readonly c: number;
  readonly h: number;
  readonly hv: number;
  readonly e: number;
  readonly ev: number;
  readonly off: number;
}

/** ⭐ (R5, D-H13) the ONE EASE on one angle: `sphereSpring`'s critically damped spring (Lowe, 2004) on a number — `x`, its speed `v`, toward `t`. */
export function spring1(x: number, v: number, t: number, dtS: number, tauS: number): { readonly x: number; readonly v: number } {
  if (!(tauS > 0) || !(dtS > 0)) return { x: t, v: 0 };
  const om = 2 / tauS;
  const e = x - t;
  const tmp = (v + om * e) * dtS;
  const ex = Math.exp(-om * dtS);
  return { x: t + (e + tmp) * ex, v: (v - om * tmp) * ex };
}

/**
 * ⭐⭐⭐ (R5, D-H14) THE LEASH (rad): the lag this spring has behind a heading moving at his clamp — lag = pace × τ (a ramp's steady lag for ω = 2 / τ), so
 * `followTurnMaxDegS` × `followMs` (520°/s × 200 ms = 104°). DERIVED: below his clamp the leash is never taut (the plain follower); above it the camera turns
 * with his finger, and after he stops it settles at most at the clamp. 0 (no clamp, or no ease): none.
 */
export function followLeashRad(maxDegS: number, tauMs: number): number {
  return maxDegS > 0 && tauMs > 0 ? maxDegS * DEG * (tauMs / 1000) : 0;
}

/** ⭐ (R5) the two followers started at rest on the drawn direction (its speed carried, split onto the heading and the height), the reading `psiT` beside the heading. */
function headStart(s0: FollowState, psiT: number): FollowHead {
  const h = headingOf(s0.d) ?? s0.psi;
  const e = Math.asin(clampN(s0.d[1], -1, 1));
  const ce = Math.cos(e);
  const hv = ce > 1e-6 ? dot3(s0.v, [Math.cos(h), 0, -Math.sin(h)]) / ce : 0;
  const ev = dot3(s0.v, [-Math.sin(e) * Math.sin(h), Math.cos(e), -Math.sin(e) * Math.cos(h)]);
  return { c: h + wrapPi(psiT - h), h, hv, e, ev, off: 0 };
}

/**
 * ⭐⭐⭐ (R5) ONE FRAME OF THE FAR FOLLOWER UNDER THE TOP'S RULE AS DECIDED — D-H15: a turn only where the far reading jumps by GEOMETRY (`farJump`) over the
 * band (`minDeg`, 10°), at any frame; its angle the WHOLE gap from the heading drawn to the reading beyond (`followTurnDelta`: the lag + the jump, the
 * half turn's tie the way the heading went), at his finger's pace clamped (`followTurnDegS`, F-2); the gizmo waits while it runs (`top.turn`). The dy hold
 * decided at the gizmo's facet change as H2 / H3 (`followTurnHold` on the jump: over 90° the crossing's own, `crossingEvent` on `upShown`; it replaces any
 * older one). ⭐⭐⭐ D-H13 / D-H14: the heading and the elevation as TWO 1-D followers (`spring1`, τ `tauMs`): the heading on the continuous reading
 * `c` UNWRAPPED (no short way after a fast dx), never more than the leash behind (`followLeashRad`: his clamp × τ, derived — taut it moves at his finger's
 * pace, after he stops it settles at most at his clamp); the elevation toward the asked height capped at 90° − `poleDeg`, never drawn past the cap. A turn
 * pays the offset `off` while the follower rests on `c` (the gizmo waits, so `c` is still). ⛔ The sphere spring here: its great circle cuts toward the
 * pole over the top (86.5° for 55° asked at 1 620°/s) and turns the short way once its lag passes 180°. `s` / `top` `null`: started on the direction asked.
 */
export function followFarStep(
  s: FollowState | null,
  top: FollowTop | null,
  inp: FollowFarIn,
  dtMs: number,
  k: FollowTopKnobs,
): { readonly s: FollowState; readonly top: FollowTop; readonly hold?: 1 | -1 | 0; readonly delta: number | null; readonly started: boolean } {
  const s0 = s ?? followStart(inp.ask);
  const dtS = Math.max(0, dtMs) / 1000;
  const tauS = k.tauMs / 1000;
  const t0: FollowTop = top ?? { psiT: headingOf(s0.d) ?? s0.psi, nW: inp.nW, turn: null, step: 0, orbitWas: inp.orbit, pace: 0 };
  const paceNow = followFingerPace(inp.fingerMm ?? 0, dtS, k.degPerMm ?? 0);
  const pace = Math.max(paceNow, k.tauMs > 0 ? t0.pace * Math.exp(-Math.max(0, dtMs) / k.tauMs) : 0);
  const psiL = inp.psiL ?? t0.psiT;
  // ⭐⭐⭐ (2026-11-22 evening, §20, D-H23) the jump read at ONE place when handed (`jumpAt`); else as built (two places — a pace threshold)
  const jump = inp.jumpAt !== undefined ? farJumpAcross(inp.jumpAt, t0.psiT) : farJump(inp.psiL, inp.psiLWas, t0.psiT);
  // D-H13: the two followers — started at rest on the drawn direction where none (a start; the follower parked close in), a turn of another rule not carried
  const hd0 = t0.hd ?? headStart(s0, t0.psiT);
  let turn = t0.hd !== undefined ? t0.turn : null;
  let off = turn !== null ? turn.psi0 + turn.k * turn.delta : hd0.off;
  const drawn = hd0.h + off;
  let hold: 1 | -1 | 0 | undefined;
  let started = false;
  if (t0.nW !== null && inp.nW !== null && angleOf(t0.nW, inp.nW) > FOLLOW_FACET_CHANGE_RAD) {
    const crossHold = inp.upShown === null ? 0 : crossingEvent(inp.upShown, t0.nW, inp.nW, UP, inp.dySign).hold;
    hold = followTurnHold(jump, crossHold);
  }
  const big = Math.abs(jump) >= Math.max(0, k.minDeg) * DEG && Math.abs(jump) > 0;
  // the reading carried to the next frame: this frame's (as before), or where the gizmo waits when a turn starts aimed there (D-H20)
  let psiCarry = psiL;
  // the continuous reading: the reading's own motion this frame, unwrapped (a jump a turn takes removed; under the band the follower pays it)
  const c = hd0.c + wrapPi(psiL - (big ? jump : 0) - t0.psiT);
  let h = hd0.h;
  let hv = hd0.hv;
  if (big) {
    // D-H15: the turn takes the WHOLE gap from the heading drawn to the reading beyond; the follower set AT REST on `c` (bumpless: the heading drawn kept in
    // the offset), so when the gizmo moves on it takes over with no lag and no speed to lose
    off = drawn - c;
    h = c;
    hv = 0;
    // ⭐⭐⭐ (2026-11-22, `CAMERA_FOLLOWS_GIZMO.md` §19, D-H20) AIMED WHERE THE GIZMO WAITS: F-3 sets the gizmo's angles to the map's place shown right after
    // this step, so the reading there is the one the next frames read — the turn planned once on it, and carried (⛔ aimed at the finger's reading: the
    // turn landed past the reading by the gap between the two places, 5 – 15° at his pace, and the spring took the camera back — his back and forth)
    const aim = inp.psiLAt ?? psiL;
    turn = followTurnStart(off, followTurnDelta(drawn, aim, t0.step), 0, followTurnDegS(pace, k.rollDegS, k.paceShare, k.maxDegS ?? 0));
    started = turn !== null;
    if (started) psiCarry = aim;
  }
  // D-H13 / D-H14: the heading's follower on `c`, never more than the leash behind — taut, it moves with `c` (his finger's pace), at the leash's speed
  let f = spring1(h, hv, c, dtS, tauS);
  const leash = followLeashRad(k.maxDegS ?? 0, k.tauMs);
  if (leash > 0 && Math.abs(c - f.x) > leash) {
    const sg = Math.sign(c - f.x);
    if (k.leashPace === true) {
      // ⭐⭐⭐ (2026-11-22 evening, `CAMERA_FOLLOWS_GIZMO.md` §20.8, D-H24 — `followLeashPace`) TAUT AT HIS FINGER'S PACE, as D-H14 was decided: toward the leash's
      // place by at most max(his pace, his clamp) × the frame's time, never behind the spring's own step; its speed carried at most the leash's (from that
      // speed a critically damped spring never passes its target). ⛔ At the READING's pace the taut leash copied its spikes — 23.9° in one frame at 60
      // frames a second at his mean pace (the share's ramp at an edge), 43.9° on `Scene_1`'s top spin (the reading near the pole)
      const xt = c - sg * leash;
      const vMax = Math.max(pace, Math.max(0, k.maxDegS ?? 0) * DEG);
      const xl = h + sg * Math.min(Math.max(0, sg * (xt - h)), vMax * dtS);
      const x = sg > 0 ? Math.max(f.x, xl) : Math.min(f.x, xl);
      f = { x, v: sg * Math.min(dtS > 0 ? Math.abs(x - h) / dtS : 0, leash / tauS) };
    } else f = { x: c - sg * leash, v: (sg * leash) / tauS };
  }
  if (turn !== null) {
    turn = followTurnStep(turn, dtMs);
    off = turn.psi0 + turn.k * turn.delta;
    if (turn.k >= 1) turn = null;
  }
  // D-H13: the elevation's follower toward the asked height capped (90° − `poleDeg`), never drawn past the cap (nor further past it than it was, at a start)
  const cap = Math.PI / 2 - Math.max(0, k.poleDeg) * DEG;
  const eT = clampN(Math.asin(clampN(inp.ask[1], -1, 1)), -cap, cap);
  const g = spring1(hd0.e, hd0.ev, eT, dtS, tauS);
  const lim = Math.max(cap, Math.abs(hd0.e));
  const e = clampN(g.x, -lim, lim);
  const ev = e === g.x ? g.v : 0;
  const psi = f.x + off;
  const dir = dirAtHeading(psi, e);
  const ce = Math.cos(e);
  const v = add3(scale3([Math.cos(psi), 0, -Math.sin(psi)], f.v * ce), scale3([-Math.sin(e) * Math.sin(psi), ce, -Math.sin(e) * Math.cos(psi)], ev));
  const stp = psi - drawn;
  const step = Math.abs(stp) > 1e-9 ? stp : t0.step;
  const paceS = Math.max(len3(v), dtS > 0 ? angleOf(s0.d, dir) / dtS : 0);
  const tg = dirAtHeading(c + (turn !== null ? turn.psi0 + turn.delta : off), eT);
  return {
    s: { d: dir, v, tWas: tg, pace: paceS, det: s0.det, psi: wrapPi(psi), psiT: psiCarry, azWas: s0.azWas, psiStep: step, dir },
    top: { psiT: psiCarry, nW: inp.nW ?? t0.nW, turn, step, orbitWas: inp.orbit, pace, hd: { c, h: f.x, hv: f.v, e, ev, off } },
    ...(hold !== undefined ? { hold } : {}),
    // the geometric jump every frame it is read (the record's `x`; `null`: none kept)
    delta: inp.psiLWas === undefined && inp.jumpAt === undefined ? null : jump,
    started,
  };
}
