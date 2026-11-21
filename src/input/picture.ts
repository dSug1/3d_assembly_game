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
 */
import type { Vec3 } from "../core/vec";
import type { GestureConfig } from "./gestureConfig";
import { approachDistance, approachRange } from "./assembly_orbit";
import { followPose } from "./camera_follow";
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

/** ⭐ The direction drawn in the band: the follower's `dFar` turned toward the logic's `us` by `w` (slerp; 0 and 1 the ends themselves). */
export function bandDir(dFar: Vec3, us: Vec3, w: number): Vec3 {
  if (!(w > 0)) return dFar;
  if (w >= 1) return us;
  const c = Math.max(-1, Math.min(1, dot3(dFar, us)));
  const th = Math.acos(c);
  if (th < 1e-9) return dFar;
  const s = Math.sin(th);
  const a = Math.sin((1 - w) * th) / s;
  const b = Math.sin(w * th) / s;
  return unit3([dFar[0] * a + us[0] * b, dFar[1] * a + us[1] * b, dFar[2] * a + us[2] * b]);
}

/**
 * ⭐ The eye in the band: the follower's eye at the blended direction (`eyeD`), turned about the look point by `w` of the residual between the follower's
 * pose at the logic's direction (`eyeU`) and the logic's own eye (`eyeG`: its camera's 120 ms catch-up, the offsets' heading), its distance likewise —
 * so the piece stays on the view's line and w 1 is G's eye.
 */
export function bandEye(eyeD: Vec3, eyeU: Vec3, eyeG: Vec3, look: Vec3, w: number): Vec3 {
  if (!(w > 0)) return eyeD;
  if (w >= 1) return eyeG;
  const a = sub3(eyeU, look);
  const b = sub3(eyeG, look);
  const la = len3(a);
  const lb = len3(b);
  const e = sub3(eyeD, look);
  const le = len3(e);
  if (!(la > 1e-12) || !(lb > 1e-12) || !(le > 1e-12)) return eyeD;
  const ax = cross3(a, b);
  const s = len3(ax);
  const th = Math.atan2(s, dot3(a, b));
  const ed = s > 1e-12 ? rotateAbout([e[0] / le, e[1] / le, e[2] / le], [ax[0] / s, ax[1] / s, ax[2] / s], w * th) : [e[0] / le, e[1] / le, e[2] / le];
  const r = le + w * (lb - la);
  return [look[0] + ed[0] * r, look[1] + ed[1] * r, look[2] + ed[2] * r];
}

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
export function turntableUp(c: Vec3, s: TurntableState | null, coneDeg: number): { readonly up: Vec3; readonly s: TurntableState } {
  const h = Math.hypot(c[0], c[2]);
  const h0 = Math.sin(Math.max(0, coneDeg) * DEG);
  const hv = h > 1e-9 ? Math.atan2(c[0], c[2]) : s !== null ? s.psiV : 0;
  if (h >= h0) return { up: WORLD_UP, s: { psi: hv, psiV: hv, inCone: false } };
  const psi = s !== null ? s.psi : hv;
  const psiV = s !== null ? s.psiV + wrapPi(hv - s.psiV) : hv;
  const x = Math.max(0, 2 * (h / h0) - 1);
  const k = 1 - x * x * (3 - 2 * x);
  return { up: meridianUp(c, psiV + (psi - psiV) * k), s: { psi, psiV, inCone: true } };
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

/** ⭐ The up's hand-over: whose up is the target (`latched`: G's; else the turntable's), the offset held at the change (rad, about the view), its share left. */
export interface UpHand {
  readonly latched: boolean;
  readonly phi0: number;
  readonly r: number;
}

/** ⭐ The picture's state — never dropped: the turntable, the up's hand-over, the up drawn last frame (squared to its view). */
export interface PictureState {
  readonly tt: TurntableState | null;
  readonly hand: UpHand | null;
  readonly up: Vec3 | null;
}

export const PICTURE_REST: PictureState = { tt: null, hand: null, up: null };

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
 * ⭐⭐⭐ (R3a, §4.1 – §4.3) ONE FRAME OF THE PICTURE. The pose: latched G's; else by the band — w 0 the follower's (`F` itself), w 1 G's eye, look and piece
 * exactly, between the follower's direction toward `us` by `w` and the residual to G's eye by `w` — far out and through the way out alike (its turn is G). The up: the target (latched G's, else the turntable's), plus the offset held
 * at each change of target (bumpless), closed by his finger only. Latched, ψ is set from the drawn up every frame (the way out starts from it).
 */
export function pictureStep(s: PictureState, inp: PictureIn): { readonly pose: PicturePose; readonly state: PictureState } {
  let eye: Vec3;
  let look: Vec3;
  let piece: Vec3;
  if (inp.latched || inp.w >= 1) {
    eye = inp.G.eye;
    look = inp.G.look;
    piece = inp.G.piece;
  } else if (!(inp.w > 0)) {
    const F = inp.F ?? followPose(inp.dFar, inp.look, inp.foot, inp.hang, inp.gapM, inp.offYawRad, inp.offPitchRad);
    eye = F.eye;
    look = F.look;
    piece = F.piece;
  } else {
    const Fd = followPose(bandDir(inp.dFar, inp.us, inp.w), inp.look, inp.foot, inp.hang, inp.gapM, inp.offYawRad, inp.offPitchRad);
    const Fu = followPose(inp.us, inp.look, inp.foot, inp.hang, inp.gapM, inp.offYawRad, inp.offPitchRad);
    eye = bandEye(Fd.eye, Fu.eye, inp.G.eye, inp.look, inp.w);
    look = inp.look;
    piece = Fd.piece;
  }
  const v = sub3(look, eye);
  const lv = len3(v);
  const vd: Vec3 = lv > 1e-12 ? [v[0] / lv, v[1] / lv, v[2] / lv] : [0, 0, -1];
  const c: Vec3 = [-vd[0], -vd[1], -vd[2]];
  const t = turntableUp(c, s.tt, inp.coneDeg);
  const target = inp.latched ? inp.G.up : t.up;
  // the hand-over: a change of target holds the up drawn (bumpless), his finger closes it
  let hand = s.hand ?? { latched: inp.latched, phi0: 0, r: 0 };
  if (hand.latched !== inp.latched) {
    const A = squared(target, vd);
    const B = s.up === null ? null : squared(s.up, vd);
    const phi0 = A === null || B === null ? 0 : Math.atan2(dot3(vd, cross3(A, B)), dot3(A, B));
    hand = { latched: inp.latched, phi0, r: phi0 !== 0 ? 1 : 0 };
  }
  if (hand.r > 0) {
    const r = inp.share !== null ? Math.min(hand.r, clamp01(1 - inp.share)) : inp.spanMm > 0 ? Math.max(0, hand.r - Math.max(0, inp.mm) / inp.spanMm) : 0;
    hand = { latched: hand.latched, phi0: hand.phi0, r };
  }
  const ang = hand.phi0 * hand.r;
  const tq = ang !== 0 ? squared(target, vd) : null;
  const up = tq === null ? target : rotateAbout(tq, vd, ang);
  const upSq = squared(up, vd) ?? up;
  const tt = inp.latched ? turntableFromDrawn(c, upSq, inp.coneDeg) : t.s;
  return { pose: { eye, look, up, piece }, state: { tt, hand, up: upSq } };
}
