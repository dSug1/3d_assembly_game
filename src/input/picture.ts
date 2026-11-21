/**
 * ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.1 – §4.3 — packet R3a, switch `pictureOne`) THE ONE PICTURE — pure rules, no engine.
 *
 * ONE picture at every distance (D-P1), its state never dropped: far out the follower's pose, close in the logic's pose G (close in's own turns, square
 * camera, carried up and J — read, never reopened). Between them a change of TARGET by the approach's PLACE (D-P3 (a)): the band, the last
 * `pictureBandMm` of his approach finger before the unlatch (0.65 m) — `w` 0 outside it (the follower exactly), 1 at and inside it (G exactly), so the
 * latch (0.6 m) and the unlatch (0.65 m) both happen at w = 1 and draw nothing new.
 *
 * THE UP (D-P5): not latched (far, the band, the way out) the TURNTABLE's — world up, or near the vertical the meridian of a CARRIED heading ψ, never the
 * view's residue; latched G's. At each change between the two the up drawn is HELD (an offset about the view, set bumpless from the up drawn last frame)
 * and handed over by his finger only: latched the square camera's own share (`blendShare`, his orbit mm), the way out its share (his out mm), else his
 * finger's mm over `pictureBandMm`. ψ is set from the drawn up while latched, so the way out starts from it (Åström & Hägglund's bumpless transfer).
 *
 * ⭐⭐⭐ (2026-11-21 night, §4.3a — R3-FIX) ONE HEADING OWNER: the drawn direction a HEADING and an ELEVATION, each with one owner. Not latched the heading is the
 * follower's and the band blends the ELEVATION only (⛔ R3's slerp toward `us`: on a spit the two headings nearly opposite, the blend went over the vertical);
 * latched G. At each change of owner ONE hand-over holds the pose drawn — its heading, its elevation (the owner's pose turned about the world vertical, then
 * about the horizontal axis square to the heading: never a slerp across the vertical) and its up's φ — closed by one share, his finger only.
 */
import type { Vec3 } from "../core/vec";
import type { GestureConfig } from "./gestureConfig";
import { approachDistance, approachRange } from "./assembly_orbit";
import { dirAtHeading, followPose, headingOf } from "./camera_follow";
import { rotateAbout, TILT_AUTO_HYST_M } from "./orbit_tilt";

/**
 * ⭐ The turntable's cone round the vertical (deg): outside it the up is the world's (the view's own heading); in its inner half the up's heading is the
 * CARRIED ψ whole; between, blended by place. 20°: the far cap (60°, `followPoleDeg` 30, with the owner's 2° pitch offset 62°) stays 8° outside it — far
 * out bit for bit — and a near-vertical view (the f480 case: 3.4° off it) is in its inner half, its residue's heading never read; on the approach
 * cycle the up's step through the cone stays under 3° at 0.5 mm a frame (10° wide: 6.7°). ⚠ The detour (`followTop` 0, to 80°) enters it.
 */
export const PICTURE_CONE_DEG = 20;
/** ⭐ The world's up — far out the turntable's up outside the cone, as the follower drew it (`followPose`). */
export const WORLD_UP: Vec3 = [0, 1, 0];

const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a: Vec3): Vec3 => {
  const l = len3(a);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 1];
};
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const DEG = Math.PI / 180;

/** `u` squared to the view `d` (unit): its part across `d`, unit — `null`: along it. */
function squared(u: Vec3, d: Vec3): Vec3 | null {
  const k = dot3(u, d);
  const p: Vec3 = [u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]];
  const l = len3(p);
  return l > 1e-12 ? [p[0] / l, p[1] / l, p[2] / l] : null;
}

/* ⭐⭐⭐ THE BAND — w by the approach's PLACE (D-P3 (a)) ------------------------------------------------------------------------------------------------ */

/**
 * ⭐⭐⭐ HIS APPROACH FINGER'S mm BEYOND THE UNLATCH (`tiltAutoM` + `TILT_AUTO_HYST_M`, 0.65 m) at the approach coordinate `a` (`st.approach`; linear in his
 * finger: `approachInput`, da = mm × `dvPerMm`): ≤ 0 at and inside it. `Infinity` with no latch (`tiltAutoM` 0): no close in, no band.
 */
export function approachOutMm(cfg: GestureConfig, a: number, dvPerMm: number): number {
  if (!(cfg.tiltAutoM > 0) || !(dvPerMm > 0)) return Infinity;
  const thr = cfg.tiltAutoM + TILT_AUTO_HYST_M;
  if (approachDistance(cfg, a) <= thr) return 0;
  const r = approachRange(cfg);
  let lo = r.min;
  let hi = Math.min(r.max, a);
  if (approachDistance(cfg, lo) > thr) return Infinity; // the unlatch unreachable: no band
  for (let i = 0; i < 48; i++) {
    const m = 0.5 * (lo + hi);
    if (approachDistance(cfg, m) <= thr) lo = m;
    else hi = m;
  }
  return (a - lo) / dvPerMm;
}

/** ⭐⭐⭐ THE BAND'S SHARE `w`: 1 at and inside the unlatch, a smoothstep down to exactly 0 at `bandMm` beyond it (`pictureBandMm`; 0: no band, 0 outside). */
export function bandShare(outMm: number, bandMm: number): number {
  if (!(outMm > 0)) return 1;
  if (!(bandMm > 0) || outMm >= bandMm) return 0;
  const x = outMm / bandMm;
  return 1 - x * x * (3 - 2 * x);
}

/**
 * ⛔ (R3-FIX, §4.3a) `bandDir` (the follower's direction slerped toward `us` by w) and `bandEye` (the residual toward G's eye by w) DELETED: both carried the
 * logic's heading by place — on a spit nearly opposite to the follower's, the slerp passed over the vertical. The band moves the elevation only
 * (`pictureStep`); G's eye is reached by the hand-over at the latch, or by G's own turn started from the pose drawn.
 */

/* ⭐⭐⭐ THE TURNTABLE'S UP — world up, near the vertical a carried heading ψ (D-P5) ------------------------------------------------------------------------ */

/** ⭐ The turntable's state: the carried heading `psi` (the camera's, the follower's convention `atan2(x, z)`), the view's heading unwrapped in the cone. */
export interface TurntableState {
  readonly psi: number;
  readonly psiV: number;
  readonly inCone: boolean;
}

/** ⭐ The heading ψ whose meridian is the up `up` at the camera direction `c` (look → eye): the up's level part points away from the camera. */
export function psiFromUp(c: Vec3, up: Vec3): number {
  const sg = c[1] >= 0 ? 1 : -1;
  return Math.atan2(-up[0] * sg, -up[2] * sg);
}

/** ⭐ The meridian's up at the heading `psi` and the camera direction `c`'s elevation (the turntable's up). */
export function meridianUp(c: Vec3, psi: number): Vec3 {
  const el = Math.asin(Math.max(-1, Math.min(1, c[1])));
  return [-Math.sin(el) * Math.sin(psi), Math.cos(el), -Math.sin(el) * Math.cos(psi)];
}

/**
 * ⭐⭐⭐ THE TURNTABLE'S UP at the camera direction `c` (unit, look → eye): outside the cone (`coneDeg` round the vertical) the WORLD's up exactly (the follower's
 * far picture, bit for bit) and ψ the view's own heading; inside it the meridian of a heading moved from the view's own (at the cone's edge) to the CARRIED
 * ψ (whole in the cone's inner half) by a smoothstep of the place — continuous both ways, and at a near-vertical view never the residue's heading.
 */
export function turntableUp(c: Vec3, s: TurntableState | null, coneDeg: number, psiD?: number): { readonly up: Vec3; readonly s: TurntableState } {
  const h = Math.hypot(c[0], c[2]);
  const h0 = Math.sin(Math.max(0, coneDeg) * DEG);
  const hv = h > 1e-9 ? Math.atan2(c[0], c[2]) : s !== null ? s.psiV : (psiD ?? 0);
  if (h >= h0) return { up: WORLD_UP, s: { psi: hv, psiV: hv, inCone: false } };
  // ⭐⭐⭐ (R3-FIX, §4.3a rule 6) the heading DRAWN when known (`psiD`: not latched, the follower's plus the hand-over's offset left) — else the carried ψ
  const psi = psiD ?? (s !== null ? s.psi : hv);
  const psiV = s !== null ? s.psiV + wrapPi(hv - s.psiV) : hv;
  const x = Math.max(0, 2 * (h / h0) - 1);
  const k = 1 - x * x * (3 - 2 * x);
  return { up: meridianUp(c, psiV + wrapPi(psi - psiV) * k), s: { psi, psiV, inCone: true } };
}

/** ⭐ The turntable's state SET from the up drawn (`up`) at `c` — ψ from the drawn up (O-3: never the view's residue); outside the cone the view's heading. */
export function turntableFromDrawn(c: Vec3, up: Vec3, coneDeg: number): TurntableState {
  const h = Math.hypot(c[0], c[2]);
  const hv = h > 1e-9 ? Math.atan2(c[0], c[2]) : psiFromUp(c, up);
  if (h >= Math.sin(Math.max(0, coneDeg) * DEG)) return { psi: hv, psiV: hv, inCone: false };
  const psi = psiFromUp(c, up);
  return { psi, psiV: psi + wrapPi(hv - psi), inCone: true };
}

/* ⭐⭐⭐ THE PICTURE — one function at every distance ---------------------------------------------------------------------------------------------------- */

/** ⭐ A pose drawn: the camera's eye, look point and up, and where the piece is drawn. */
export interface PicturePose {
  readonly eye: Vec3;
  readonly look: Vec3;
  readonly up: Vec3;
  readonly piece: Vec3;
}

/**
 * ⭐ The hand-over: whose pose is the owner (`latched`: G's; else the follower's rule), the offsets held at the change — the up's `phi0` (rad, about the
 * view) and (R3-FIX) the view's heading `dh` and elevation `de` (rad) — and the share left `r` (one share closes all three).
 */
export interface UpHand {
  readonly latched: boolean;
  readonly phi0: number;
  readonly r: number;
  readonly dh?: number;
  readonly de?: number;
}

/** ⭐ The picture's state — never dropped: the turntable, the hand-over, the up drawn last frame (squared to its view), the view drawn's heading and elevation (R3-FIX). */
export interface PictureState {
  readonly tt: TurntableState | null;
  readonly hand: UpHand | null;
  readonly up: Vec3 | null;
  readonly dir?: { readonly psi: number; readonly el: number } | null;
}

export const PICTURE_REST: PictureState = { tt: null, hand: null, up: null, dir: null };

/** ⭐ (R3-FIX) The hand-over keeps a view's elevation within this of the vertical (rad): a turn by an elevation offset never crosses it. */
export const PICTURE_EL_MAX_RAD = 89.5 * DEG;

/**
 * ⭐ (R3-FIX) A view's HEADING and ELEVATION (`c` unit, look → eye): its own heading — exactly vertical, its up's (`psiFromUp`). ⛔ The up's heading within the
 * cone: a view whose up is not its meridian (G rolled) read 100° off its own heading, and the hand-over then turned the view by that (4.6° at 87°).
 */
export function viewHeadEl(c: Vec3, up: Vec3): { readonly psi: number; readonly el: number } {
  return { psi: Math.hypot(c[0], c[2]) > 1e-9 ? Math.atan2(c[0], c[2]) : psiFromUp(c, up), el: Math.asin(Math.max(-1, Math.min(1, c[1]))) };
}

/**
 * ⭐⭐⭐ (R3-FIX, §4.3a rule 5) A POSE TURNED by a heading offset `dh` about the world vertical, then by an elevation offset `de` about the horizontal axis square
 * to its new heading (`psi` + `dh`: `psi`, `el` its view's turntable heading and elevation), the view's elevation kept within ±`PICTURE_EL_MAX_RAD` — the eye
 * and the up about the look point, the piece about the foot. Never a slerp across the vertical. Both 0: the pose itself.
 */
export function turnedPose(P: PicturePose, foot: Vec3, psi: number, el: number, dh: number, de: number): PicturePose {
  if (dh === 0 && de === 0) return P;
  const elT = Math.max(-PICTURE_EL_MAX_RAD, Math.min(PICTURE_EL_MAX_RAD, el + de));
  const th = de === 0 ? 0 : elT - el;
  const h = psi + dh;
  const ax: Vec3 = [-Math.cos(h), 0, Math.sin(h)]; // square to the heading h: a positive turn about it raises a direction there
  const rot = (v: Vec3): Vec3 => {
    const a = dh !== 0 ? rotateAbout(v, WORLD_UP, dh) : v;
    return th !== 0 ? rotateAbout(a, ax, th) : a;
  };
  const e = rot(sub3(P.eye, P.look));
  const p = rot(sub3(P.piece, foot));
  return { eye: [P.look[0] + e[0], P.look[1] + e[1], P.look[2] + e[2]], look: P.look, up: rot(P.up), piece: [foot[0] + p[0], foot[1] + p[1], foot[2] + p[2]] };
}

const viewOf = (P: PicturePose): Vec3 => unit3(sub3(P.eye, P.look));

/** ⭐ One frame's readings (read-only: the logic's, last computed this frame; the follower's, far out). */
export interface PictureIn {
  /** the band's share (`bandShare`, by place) */
  readonly w: number;
  /** the follower's own direction (far its step's; close parked at rest on its target) and its pose there (`followPose` — `null`: computed here) */
  readonly dFar: Vec3;
  readonly F: PicturePose | null;
  /** the logic's shown direction: the piece from the gizmo's foot */
  readonly us: Vec3;
  /** the follower's pose inputs (`followPose`) */
  readonly look: Vec3;
  readonly foot: Vec3;
  readonly hang: number;
  readonly gapM: number;
  readonly offYawRad: number;
  readonly offPitchRad: number;
  /** the logic's pose: where the follower draws its own (the ghost: eye, look, up, its piece); elsewhere the close drawer's (its turns — the way out's —, square camera, carried up, J) */
  readonly G: PicturePose;
  /** the automatic tilt latched (`asmTiltAuto`): G's up is the target */
  readonly latched: boolean;
  /** the hand-over's share by his finger (latched: the square camera's `blendShare`; the way out: its share) — `null`: by his mm below */
  readonly share: number | null;
  /** his finger's mm this frame (the orbit's, the approach's outward) and the span they close the held up over (`pictureBandMm`) */
  readonly mm: number;
  readonly spanMm: number;
  readonly coneDeg: number;
}

/**
 * ⭐⭐⭐ (R3a, §4.1 – §4.3; ⛔ amended by R3-FIX, §4.3a) ONE FRAME OF THE PICTURE.
 * 1. THE OWNER'S POSE — latched G's; else the FOLLOWER's rule: its heading (`headingOf(dFar)`, never blended by place) at the elevation lerp(el(`dFar`),
 *    el(`us`), w) — w 0 the follower's own pose objects (`F`), far out bit for bit — through the band, between it and the latch (w 1) and the way out alike.
 * 2. THE HAND-OVER — at each change of owner the view drawn last frame (its heading and elevation) and its up are held as offsets from the new
 *    owner's (`dh`, `de`, `phi0`), closed by one share: latched the square camera's (`share`), the way out its own (`share`), else his mm over `spanMm`.
 * 3. THE POSE DRAWN — the owner's turned by the offsets left (`turnedPose`); the up the target (latched G's turned; else the turntable's of the DRAWN heading,
 *    the follower's plus the offset left) turned by φ left about the view. Latched, ψ is set from the drawn up every frame (the follower parks on it).
 */
export function pictureStep(s: PictureState, inp: PictureIn): { readonly pose: PicturePose; readonly state: PictureState } {
  const psiF = headingOf(inp.dFar) ?? s.dir?.psi ?? 0;
  // 1. the owner's pose
  let P: PicturePose;
  if (inp.latched) P = inp.G;
  else if (!(inp.w > 0)) P = inp.F ?? followPose(inp.dFar, inp.look, inp.foot, inp.hang, inp.gapM, inp.offYawRad, inp.offPitchRad);
  else {
    const elF = Math.asin(Math.max(-1, Math.min(1, inp.dFar[1])));
    const elU = Math.asin(Math.max(-1, Math.min(1, inp.us[1])));
    const D = dirAtHeading(psiF, elF + (elU - elF) * Math.min(1, inp.w));
    P = followPose(D, inp.look, inp.foot, inp.hang, inp.gapM, inp.offYawRad, inp.offPitchRad);
  }
  // the owner's own view: its heading and elevation (latched by G's up; else by the turntable's at the follower's heading)
  const own = (): { readonly psi: number; readonly el: number } => {
    const c0 = viewOf(P);
    return viewHeadEl(c0, inp.latched ? P.up : turntableUp(c0, s.tt, inp.coneDeg, psiF).up);
  };
  // 2. the hand-over: a change of owner holds the view drawn (its heading, its elevation) and its up (bumpless), his finger closes them
  let hand: UpHand = s.hand ?? { latched: inp.latched, phi0: 0, r: 0, dh: 0, de: 0 };
  let o: { readonly psi: number; readonly el: number } | null = null;
  if (hand.latched !== inp.latched) {
    o = own();
    const dh = s.dir ? wrapPi(s.dir.psi - o.psi) : 0;
    const de = s.dir ? s.dir.el - o.el : 0;
    const P1 = turnedPose(P, inp.foot, o.psi, o.el, dh, de);
    const v1 = viewOf(P1);
    const vd1: Vec3 = [-v1[0], -v1[1], -v1[2]];
    const target1 = inp.latched ? P1.up : turntableUp(v1, s.tt, inp.coneDeg, psiF + dh).up;
    const A = squared(target1, vd1);
    const B = s.up === null ? null : squared(s.up, vd1);
    const phi0 = A === null || B === null ? 0 : Math.atan2(dot3(vd1, cross3(A, B)), dot3(A, B));
    hand = { latched: inp.latched, phi0, r: phi0 !== 0 || dh !== 0 || de !== 0 ? 1 : 0, dh, de };
  }
  if (hand.r > 0) {
    const r = inp.share !== null ? Math.min(hand.r, clamp01(1 - inp.share)) : inp.spanMm > 0 ? Math.max(0, hand.r - Math.max(0, inp.mm) / inp.spanMm) : 0;
    hand = { ...hand, r };
  }
  // 3. the pose drawn: the owner's turned by the offsets left
  const dhr = (hand.dh ?? 0) * hand.r;
  const der = (hand.de ?? 0) * hand.r;
  if (dhr !== 0 || der !== 0) {
    const ow = o ?? own();
    P = turnedPose(P, inp.foot, ow.psi, ow.el, dhr, der);
  }
  const c = viewOf(P);
  const vd: Vec3 = [-c[0], -c[1], -c[2]];
  const t = turntableUp(c, s.tt, inp.coneDeg, inp.latched ? undefined : psiF + dhr);
  const target = inp.latched ? P.up : t.up;
  const ang = hand.phi0 * hand.r;
  const tq = ang !== 0 ? squared(target, vd) : null;
  const up = tq === null ? target : rotateAbout(tq, vd, ang);
  const upSq = squared(up, vd) ?? up;
  const tt = inp.latched ? turntableFromDrawn(c, upSq, inp.coneDeg) : t.s;
  return { pose: { eye: P.eye, look: P.look, up, piece: P.piece }, state: { tt, hand, up: upSq, dir: viewHeadEl(c, upSq) } };
}
