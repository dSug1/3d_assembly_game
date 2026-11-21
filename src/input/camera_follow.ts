/**
 * ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` — the owner: *"keep the camera movement as a simple polar orbit and find the
 * function which links it to the orbit of the gizmo smoothly"*) THE CAMERA FOLLOWER — pure rules, no engine.
 *
 * F2 (the second part): THE FOLLOWER — one ease on the sphere, the pole's detour by place, the polar camera (world up), the pose drawn far out.
 *
 * F1 (this file's first part): THE DIRECTION ASKED — the calm's target as `calmTargets` hands it to its ease, with the whole shares by position folded in
 * (`askedCalm`): the calm WITHOUT its 120 ms ease (D-F6: the follower's one ease replaces it). Read at the rig's solved angles by `askedDir` (the wiring).
 *
 * H2 (the file's end, `CAMERA_FOLLOWS_GIZMO.md` §15 – §16, switch `followTop`): THE TOP AND BOTTOM FAR OUT — the heading the calm's LEVELLED reading (carried
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

/** ⭐ The follower's knobs (the sliders of CAMERA FOLLOWER). */
export interface FollowKnobs {
  /** the ONE ease: the critically damped spring's time on the sphere (ms) — `followMs` (D-F6) */
  readonly tauMs: number;
  /** the pole: the camera goes ROUND the vertical this far from it (deg; 0 = no detour) — `followPoleDeg` (D-F1) */
  readonly poleDeg: number;
  /** the detour starts this far from the vertical (deg) — `followFromDeg` */
  readonly fromDeg: number;
  /** the yaw's last-resort ceiling (deg a second), never under his own pace (`followCeiling`); 0 = none — `followMaxDegS` (D-F2 (a)) */
  readonly maxDegS: number;
}

/** ⭐ The camera never nearer the vertical than this (deg): the detour's one bad point (a path curling back round its far side) held there. */
export const FOLLOW_CAP_DEG = 10;

/** ⭐ The detour's one remembered bit (O7) and its frame: on near a pole, which pole, the azimuth it came in at, the side it goes round. */
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

/**
 * ⭐⭐⭐ (F2, D-F1, D-F2 (a)) THE POLE'S DETOUR, BY PLACE: within `fromDeg` of the vertical the followed direction is pushed SIDEWAYS (in the azimuthal map
 * about the pole, axis the azimuth it came in at) by `poleDeg·(1 − (θ/θ0)²)²`, on the side it was drifting to as it came in — the one remembered bit (O7),
 * kept until it leaves. So the camera goes ROUND the vertical at `poleDeg` instead of over it; its yaw is a function of WHERE the gizmo is: it runs with his
 * finger and back if he goes back. No clock, no moment, nothing held. Outside, or `poleDeg` 0: `d` exactly.
 */
export function poleDetour(d: Vec3, det: FollowDetour, poleDeg: number, fromDeg: number): { readonly dir: Vec3; readonly det: FollowDetour } {
  const ps: 1 | -1 = d[1] < 0 ? -1 : 1;
  const th = Math.acos(clampN(Math.abs(d[1]), 0, 1));
  const ph = Math.atan2(d[0], d[2]);
  const t0 = fromDeg * DEG;
  if (!(poleDeg > 0) || !(t0 > 0) || th >= t0) return { dir: d, det: { on: false, pole: det.pole, phiIn: det.phiIn, side: det.side, phiWas: ph } };
  let on = det.on;
  let pole = det.pole;
  let phiIn = det.phiIn;
  let side = det.side;
  if (!on || pole !== ps) {
    on = true;
    pole = ps;
    phiIn = ph;
    const lat = det.phiWas === null ? 0 : wrapPi(ph - det.phiWas) * Math.sin(th);
    if (Math.abs(lat) > 1e-4) side = lat < 0 ? -1 : 1;
  }
  const x = th * Math.cos(ph - phiIn);
  const y = th * Math.sin(ph - phiIn);
  const k = 1 - (th / t0) * (th / t0);
  const y1 = y + side * poleDeg * DEG * k * k;
  const th1 = Math.hypot(x, y1);
  const ph1 = phiIn + Math.atan2(y1, x);
  return { dir: [Math.sin(th1) * Math.sin(ph1), ps * Math.cos(th1), Math.sin(th1) * Math.cos(ph1)], det: { on, pole, phiIn, side, phiWas: ph } };
}

/**
 * ⭐⭐⭐ (F2, the ledger's row 6) THE YAW'S CEILING (rad a second): `maxDegS` as the last resort, but NEVER under the yaw his own pace needs at the camera's
 * latitude (`pace / cos λ`, λ no nearer the vertical than the detour's `poleDeg` — else the cap's) — so a fast dx of his is never capped; only the
 * detour's own speed-up near the vertical is. `maxDegS` 0: none.
 */
export function followCeiling(maxDegS: number, paceRadS: number, latRad: number, poleDeg: number): number {
  if (!(maxDegS > 0)) return Infinity;
  const latC = Math.min(Math.abs(latRad), Math.PI / 2 - (poleDeg > 0 ? poleDeg : FOLLOW_CAP_DEG) * DEG);
  return Math.max(maxDegS * DEG, Math.max(0, paceRadS) / Math.max(1e-3, Math.cos(latC)));
}

/** ⭐ The followed direction's camera on the polar orbit: its yaw drawn (`psi`) toward the asked one (`psiT`, unwrapped) at most `ceil` a second. */
export function polarStep(
  s: { readonly psi: number; readonly psiT: number; readonly azWas: number | null; readonly psiStep: number },
  dd: Vec3,
  ceilRadS: number,
  dtS: number,
): { readonly psi: number; readonly psiT: number; readonly azWas: number | null; readonly psiStep: number; readonly dir: Vec3 } {
  const capR = FOLLOW_CAP_DEG * DEG;
  const h = Math.hypot(dd[0], dd[2]);
  const az = h > 1e-5 ? Math.atan2(dd[0], dd[2]) : s.azWas;
  let psiT = s.psiT;
  let psi = s.psi;
  if (az !== null && s.azWas !== null) {
    let st = wrapPi(az - s.azWas);
    // ⭐ at the half turn's ambiguity, on the way it was already going
    if (Math.abs(st) > (170 * Math.PI) / 180 && s.psiStep !== 0 && Math.sign(st) !== Math.sign(s.psiStep)) st -= Math.sign(st) * 2 * Math.PI;
    psiT += st;
  } else if (az !== null) psiT = psi = az;
  // ⭐ within the cap (the detour's bad point only) the yaw slows to a stop at the vertical
  const w = clampN(h / Math.sin(capR), 0, 1);
  const c = ceilRadS * w * w;
  let err = psiT - psi;
  while (err > 1.5 * Math.PI) {
    psi += 2 * Math.PI;
    err -= 2 * Math.PI;
  }
  while (err < -1.5 * Math.PI) {
    psi -= 2 * Math.PI;
    err += 2 * Math.PI;
  }
  const step = Number.isFinite(c) ? clampN(err, -c * dtS, c * dtS) : err;
  psi += step;
  const el = clampN(Math.asin(clampN(dd[1], -1, 1)), -(Math.PI / 2 - capR), Math.PI / 2 - capR);
  return { psi, psiT, azWas: az, psiStep: step !== 0 ? step : s.psiStep, dir: [Math.cos(el) * Math.sin(psi), Math.sin(el), Math.cos(el) * Math.cos(psi)] };
}

/** ⭐ The follower started on `t` (at rest): the first frame, or back from close in on the direction the piece is drawn along. */
export function followStart(t: Vec3): FollowState {
  const az = Math.hypot(t[0], t[2]) > 1e-5 ? Math.atan2(t[0], t[2]) : 0;
  return { d: t, v: [0, 0, 0], tWas: t, pace: 0, det: { on: false, pole: 1, phiIn: 0, side: 1, phiWas: null }, psi: az, psiT: az, azWas: null, psiStep: 0, dir: t };
}

/**
 * ⭐⭐⭐ (F2) ONE FRAME OF THE FOLLOWER: the target `t` (the direction asked — `askedDir`) → the ONE ease on the sphere (`sphereSpring`, `tauMs`) → the
 * pole's detour by place (`poleDetour`) → the polar camera (`polarStep`: world up, the yaw at most the ceiling — `followCeiling` — the latitude off the
 * vertical by the cap). `null`: started on `t`.
 */
export function followStep(s: FollowState | null, t: Vec3, dtMs: number, k: FollowKnobs): FollowState {
  const s0 = s ?? followStart(t);
  const dtS = Math.max(0, dtMs) / 1000;
  const sp = sphereSpring(s0.d, s0.v, t, dtS, k.tauMs / 1000);
  // ⭐ his pace: the EASED direction's own speed — this frame's travel or its spring's speed, the larger (a step of the target at a change of frame is not
  // his pace — the 1€ filter's weakness, §5.4); ⛔ a mean over 50 ms lagged his acceleration, the end speed alone under-read a frame's travel: the ceiling
  // bit a fast dx (a vector)
  const pace = Math.max(len3(sp.v), dtS > 0 ? angleOf(s0.d, sp.d) / dtS : 0);
  const dt = poleDetour(sp.d, s0.det, k.poleDeg, k.fromDeg);
  const lat = Math.asin(clampN(dt.dir[1], -1, 1));
  const p = polarStep(s0, dt.dir, followCeiling(k.maxDegS, pace, lat, k.poleDeg), dtS);
  return { d: sp.d, v: sp.v, tWas: t, pace, det: dt.det, psi: p.psi, psiT: p.psiT, azWas: p.azWas, psiStep: p.psiStep, dir: p.dir };
}

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

/* ⭐⭐⭐ H2 (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §15 – §16, the owner's D-H1 – D-H8) THE TOP AND BOTTOM FAR OUT, behind `followTop` ------------------------
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
  /** ⭐⭐⭐ (H3, F-1 = D-H9, `followTurnOnJump`) a turn only where the levelled reading ITSELF jumps across the edge (absent / false: H2's, from the heading drawn) */
  readonly onJump?: boolean;
  /** ⭐⭐⭐ (H3, F-2 = D-H10, `followTurnFinger`) his pace read on his FINGER (`fingerMm` × `degPerMm`); absent / false: the orbit's direction's (H2's) */
  readonly finger?: boolean;
  /** ⭐ (H3, F-2) the orbit's own degrees per mm far out (`orbitDegPerMm`'s yaw) */
  readonly degPerMm?: number;
  /** ⭐ (H3, F-2) the turn's top speed (deg a second; 0 / absent: no clamp) */
  readonly maxDegS?: number;
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
 * ⭐⭐⭐ (H3, `CAMERA_FOLLOWS_GIZMO.md` §17.3) `k.onJump` (F-1): the turn only on the reading's own jump; `k.finger` (F-2): his finger's pace, `k.maxDegS` its
 * clamp; `started`: a turn started this frame (F-3: the wiring sets every angle state to the map's place then — `seamRebase`).
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
  // his pace: the orbit's own direction's speed (the finger's place, continuous through a change of frame), a peak decaying on the follower's ease —
  // ⭐⭐⭐ (H3, F-2) or his FINGER's on the glass (`followFingerPace`), the same peak
  const paceNow = k.finger === true ? followFingerPace(inp.fingerMm ?? 0, dtS, k.degPerMm ?? 0) : dtS > 0 ? angleOf(t0.orbitWas, inp.orbit) / dtS : 0;
  const pace = Math.max(paceNow, k.tauMs > 0 ? t0.pace * Math.exp(-Math.max(0, dtMs) / k.tauMs) : 0);
  const psiL = inp.psiL ?? t0.psiT;
  let turn = t0.turn;
  let hold: 1 | -1 | 0 | undefined;
  let delta: number | null = null;
  let started = false;
  if (t0.nW !== null && inp.nW !== null && angleOf(t0.nW, inp.nW) > FOLLOW_FACET_CHANGE_RAD) {
    const degS = followTurnDegS(pace, k.rollDegS, k.paceShare, k.maxDegS ?? 0);
    const crossHold = inp.upShown === null ? 0 : crossingEvent(inp.upShown, t0.nW, inp.nW, UP, inp.dySign).hold;
    if (k.onJump === true) {
      // ⭐⭐⭐ (H3, F-1 = D-H9) THE READING'S OWN JUMP across the edge: the reading after the change − the reading the frame before (or the heading carried),
      // the half turn's tie the way the heading was going — ⛔ measured from the heading DRAWN (root (a): the spring's lag behind his dx paid as a turn at
      // every facet change, a vertical edge too — his point 1). From the band a turn of that jump applied from the heading drawn (the lag before the edge kept,
      // left to the spring), a running turn's rest carried into it; under it nothing: no turn (a running one goes on), no wait, no hold
      const jump = followTurnDelta(t0.psiT, psiL, t0.step);
      delta = jump;
      if (Math.abs(jump) >= Math.max(0, k.minDeg) * DEG && Math.abs(jump) > 0) {
        const from = turn !== null ? turn.psi0 + turn.k * turn.delta : psiD;
        const rest = turn !== null ? (1 - turn.k) * turn.delta : 0;
        turn = followTurnStart(from, rest + jump, 0, degS);
        started = turn !== null;
      }
      hold = followTurnHold(jump, crossHold);
    } else {
      const from = turn !== null ? turn.psi0 + turn.k * turn.delta : psiD;
      delta = followTurnDelta(from, psiL, t0.step);
      turn = followTurnStart(from, delta, k.minDeg, degS);
      started = turn !== null;
      hold = followTurnHold(delta, crossHold);
    }
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

/** ⭐ (R5) One frame's readings far out: the top's (`FollowTopIn`, `psiL` the far reading — `farReading`) and last frame's calm's at this frame's angles. */
export interface FollowFarIn extends FollowTopIn {
  /** ⭐ (D-H15) last frame's calm asked read at THIS frame's angles (`farReading`): `null` carried (a level face); absent: none kept (no jump read) */
  readonly psiLWas?: number | null;
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
  const paceNow = k.finger === true ? followFingerPace(inp.fingerMm ?? 0, dtS, k.degPerMm ?? 0) : dtS > 0 ? angleOf(t0.orbitWas, inp.orbit) / dtS : 0;
  const pace = Math.max(paceNow, k.tauMs > 0 ? t0.pace * Math.exp(-Math.max(0, dtMs) / k.tauMs) : 0);
  const psiL = inp.psiL ?? t0.psiT;
  const jump = farJump(inp.psiL, inp.psiLWas, t0.psiT);
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
    turn = followTurnStart(off, followTurnDelta(drawn, psiL, t0.step), 0, followTurnDegS(pace, k.rollDegS, k.paceShare, k.maxDegS ?? 0));
    started = turn !== null;
  }
  // D-H13 / D-H14: the heading's follower on `c`, never more than the leash behind — taut, it moves with `c` (his finger's pace), at the leash's speed
  let f = spring1(h, hv, c, dtS, tauS);
  const leash = followLeashRad(k.maxDegS ?? 0, k.tauMs);
  if (leash > 0 && Math.abs(c - f.x) > leash) {
    const sg = Math.sign(c - f.x);
    f = { x: c - sg * leash, v: (sg * leash) / tauS };
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
    s: { d: dir, v, tWas: tg, pace: paceS, det: s0.det, psi: wrapPi(psi), psiT: psiL, azWas: s0.azWas, psiStep: step, dir },
    top: { psiT: psiL, nW: inp.nW ?? t0.nW, turn, step, orbitWas: inp.orbit, pace, hd: { c, h: f.x, hv: f.v, e, ev, off } },
    ...(hold !== undefined ? { hold } : {}),
    // the geometric jump every frame it is read (the record's `x`; `null`: none kept)
    delta: inp.psiLWas === undefined ? null : jump,
    started,
  };
}
