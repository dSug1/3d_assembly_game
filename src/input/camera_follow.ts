/**
 * ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` — the owner: *"keep the camera movement as a simple polar orbit and find the
 * function which links it to the orbit of the gizmo smoothly"*) THE CAMERA FOLLOWER — pure rules, no engine.
 *
 * F2 (the second part): THE FOLLOWER — one ease on the sphere, the pole's detour by place, the polar camera (world up), the pose drawn far out.
 *
 * F1 (this file's first part): THE DIRECTION ASKED — the calm's target as `calmTargets` hands it to its ease, with the whole shares by position folded in
 * (`askedCalm`): the calm WITHOUT its 120 ms ease (D-F6: the follower's one ease replaces it). Read at the rig's solved angles by `askedDir` (the wiring).
 */
import type { Vec3 } from "../core/vec";
import type { CalmState } from "./orbit_calm";
import { offsetFrame } from "./assembly_orbit";

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
