/**
 * ⭐⭐⭐ (2026-11-18, `Claude/40_RENDER_SCENE/spec/UPRIGHT_PICTURE.md` §2 step 2 — U0) THE UPRIGHT PICTURE, the pure parts (law U).
 *
 * The owner: *"I want to avoid the roll of the scene in the screen view"* (§0). Per frame, at the camera's stage:
 * * `G` the logic's pose (the ghost, or a timed turn's pose where a turn stays); `L` the framed line (piece → look point, `framedLine`).
 * * `ν` (`viewFromVertical`): the angle between `G`'s view and the world's vertical (rad, [0, π/2]).
 * * `α` (`uprightAngle`): the turn about `L` that puts world-down on the glass's down — closed form (below), the root nearest 0.
 * * `w` (`uprightWeight`): `smoothstep((ν − from)/(full − from))` — 0 within `from` of the vertical (where gravity has no direction on the glass), 1 from
 *   `full`; times the square camera's complement at the call (UD3).
 * * `φ = w·ᾱ` (`uprightStep`): `ᾱ` = `α` unwrapped while `0 < w < 1` (continuous across ±180°), wrapped at `w = 1` (a turn of 2π is the same pose), none at
 *   `w = 0` (`maxDegS` 0: at once — law U as first built). ⭐ Fix round 1 (§6, UD6b): with `maxDegS` > 0 the law in time (`uprightPaced`). The picture `P = poseRolled(G, L, φ)` —
 *   the piece and the look point keep their places on the glass (a turn about the line through both); `φ = 0`: `G` itself, the same object.
 *
 * THE CLOSED FORM. A turn by `a` about the unit `k` turns the camera's axes rigidly (the eye about the line, the look point on it). With `s`, `u` the
 * glass's right and up, `Y` the world's up, gravity is on the glass's vertical when `Y·R(a)s = 0` and `Y·R(a)u > 0`. `Y·R(a)s = A cos a + B sin a + C` with
 * `A = Y·s − (k·Y)(k·s)`, `B = −(k×Y)·s`, `C = (k·Y)(k·s)`: the two roots `atan2(B, A) ± acos(−C / hypot(A, B))`; the one with the glass's up toward the
 * sky, nearest 0. ⛔ NO ROOT (`null`) when `|C| > hypot(A, B)` (the line too near the vertical for any turn about it to level the glass's right) or when
 * neither root has the up toward the sky — the caller holds its last `ᾱ`.
 *
 * ⛔ ENGINE-FREE. Prior art, old and free: the world-up look-at camera (gluLookAt, early 1990s), a smoothstep; no patent, no orientation widget.
 */
import { cross, dot, type Vec3 } from "../core/vec";
import type { CamPose, EdgeHold } from "./orbit_tilt";
import { fingerOnLogic, poseAxes, turnIsFree, twistAbout, type FramedLine } from "./roll_follow";

/** ⭐ within this of the vertical (deg) the picture is the logic's pose (`w` 0) — the slider `uprightFromDeg` */
export const UPRIGHT_FROM_DEG = 15; // ⭐ (2026-11-19, the owner's trial: "Changing both together is much better") — 5° before
/** ⭐ from this off the vertical (deg) the picture is fully upright (`w` 1) — the slider `uprightFullDeg` */
export const UPRIGHT_FULL_DEG = 50; // ⭐ (2026-11-19, the owner's trial) — 25° before
/** ⭐⭐⭐ (2026-11-18, `UPRIGHT_PICTURE.md` §6 UD6b — fix round 1) the pace of THE REST, everywhere (deg a second; 0 = at once: law U as first built,
 *  bit for bit) — the slider `uprightMaxDegS` */
export const UPRIGHT_MAX_DEG_S = 720; // ⭐ (2026-11-19, the owner's trial with the band 15 – 50°: "much better for scene 1 arrival at pole jitter resolution and it calms the 180 degree realignment") — 1 800 before; ⭐ (fix round 3, UD6c, measured on his ten stretches: 1 440 left gravity over 20° 9.6 % and its roll 69.5° a metre, over round 2 + 2 points / 5°; 1 800: 7.8 %, 58.8°, 47 frames of 45 – 90°, none over 90; 2 160: 6.3 %, 58.3°, but 97 frames of 45 – 90°) — ⭐ (fix round 1, measured: 1 440 the faster of 720 / 1 440 with no frame turning the camera over 90° on his hand; 720 left one)

const Y: Vec3 = [0, 1, 0];
const wrapPi = (a: number): number => {
  const w = Math.atan2(Math.sin(a), Math.cos(a));
  return w === -Math.PI ? Math.PI : w;
};

/** ⭐ `ν`: the pose's view from the world's vertical (rad, [0, π/2]) — up or down alike. */
export function viewFromVertical(pose: CamPose): number {
  const [f] = poseAxes(pose);
  return Math.acos(Math.min(1, Math.abs(f[1])));
}

/** ⭐ `w`: 0 within `fromDeg` of the vertical, 1 from `fullDeg`, a smoothstep between (`fullDeg ≤ fromDeg`: a step at `fromDeg`). */
export function uprightWeight(nuRad: number, fromDeg: number, fullDeg: number): number {
  const nu = (nuRad * 180) / Math.PI;
  if (!(fullDeg > fromDeg)) return nu >= fromDeg ? 1 : 0;
  const t = Math.min(1, Math.max(0, (nu - fromDeg) / (fullDeg - fromDeg)));
  return t * t * (3 - 2 * t);
}

/** ⭐ Gravity's tilt on the glass (rad, (−π, π]): world-down projected on the glass against the glass's down; `null` the view vertical. */
export function gravityTilt(pose: CamPose): number | null {
  const [f, u, s] = poseAxes(pose);
  const k = -f[1];
  const dp: Vec3 = [-f[0] * k, -1 - f[1] * k, -f[2] * k];
  if (Math.hypot(dp[0], dp[1], dp[2]) < 1e-12) return null;
  return Math.atan2(dot(dp, s), -dot(dp, u));
}

/** ⭐⭐⭐ `α`: the turn about `line` (rad, (−π, π]) that puts gravity on the glass's vertical, the glass's up to the sky — the root nearest 0; `null` none. */
export function uprightAngle(pose: CamPose, line: FramedLine): number | null {
  const [, u, s] = poseAxes(pose);
  const k = line.dir;
  const kY = k[1];
  const kxY = cross(k, Y);
  const A = s[1] - kY * dot(k, s);
  const B = -dot(kxY, s);
  const C = kY * dot(k, s);
  const R = Math.hypot(A, B);
  if (!(R > 1e-12) || Math.abs(C) > R) return null;
  const a0 = Math.atan2(B, A);
  const d = Math.acos(Math.min(1, Math.max(-1, -C / R)));
  // the glass's up at a root: Y·R(a)u = cos a (Y·u − (k·Y)(k·u)) − sin a ((k×Y)·u) + (k·Y)(k·u)
  const Au = u[1] - kY * dot(k, u);
  const Bu = -dot(kxY, u);
  const Cu = kY * dot(k, u);
  let best: number | null = null;
  for (const r of [a0 + d, a0 - d]) {
    const a = wrapPi(r);
    if (!(Au * Math.cos(a) + Bu * Math.sin(a) + Cu > 1e-12)) continue;
    if (best === null || Math.abs(a) < Math.abs(best)) best = a;
  }
  return best;
}

/** ⭐ The law's state: `ᾱ` unwrapped (null: none — `w` 0; law U at once only), the last `φ`, the last `α` read and the last `w` (the carry's). */
export interface UprightState {
  readonly au: number | null;
  readonly phi: number;
  readonly ap: number | null;
  readonly wp?: number;
  /** ⭐ (fix round 3, UD6c) the logic's pose last frame — the carry is its twist about the framed line over this frame (`twistAbout`) */
  readonly gp?: CamPose;
  /** ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB3) THE LAW'S OWN HALF TURN UNDER WAY: a rest of 90° or more opened and not yet closed (`lawHalfTurn`) */
  readonly half?: boolean;
  /** ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §15 V1 — `keep`) the square camera's complement last frame (the carry's weight is the smaller of it and this one) */
  readonly sp?: number;
  /** ⭐⭐⭐ (V1) THE ROLL KEPT, `ψ` (rad, far out — before the square camera's share): upright where `k` is 1; carried as the picture is (the logic's twist
   *  undone); HELD while `k` falls (toward the vertical: the roll the picture arrives with); turned toward upright as `k` rises */
  readonly psi?: number;
  /** ⭐⭐⭐ (V1) upright against `ψ`, unwrapped while `0 < k < 1` (continuous in time; the side of the half turn chosen once, where `k` leaves 0); none at `k` 0 */
  readonly dk?: number;
  /** ⭐ (V1) `k` last frame (the weight before the square camera's share) */
  readonly kp?: number;
}
export const UPRIGHT_REST: UprightState = Object.freeze({ au: null, phi: 0, ap: null });

export interface UprightKnobs {
  readonly fromDeg: number;
  readonly fullDeg: number;
  /** THE REST's pace, deg a second; 0 (or less): at once (law U as first built) */
  readonly maxDegS: number;
  /** ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §15 V1 — the slider `uprightKeepRoll`) near the vertical the picture KEEPS THE ROLL IT ARRIVES WITH (with a pace
   *  over 0 only); absent or false: the law of the defaults commit `74a247e`, bit for bit */
  readonly keep?: boolean;
}

export interface UprightFrame {
  readonly state: UprightState;
  /** the turn about the framed line drawn (rad); exactly 0 where `w` is 0 */
  readonly phi: number;
  readonly w: number;
  readonly nu: number;
  readonly alpha: number | null;
  /** ⭐ (fix round 2, UD11) nothing left to close: `phi` is this frame's target (the rest closed, or no pace) */
  readonly closed: boolean;
  /** ⭐⭐⭐ (RB3) this frame the rest the law has to close reached 90° or more (not under way before): a turn the player SEES — its size (rad); 0: none */
  readonly halfStart: number;
  /** ⭐ the square camera's complement this frame (`scale`, clamped): V1's carry weight and its share seen (`changeWeight`) */
  readonly sc: number;
}

/**
 * ⭐⭐⭐ ONE FRAME OF LAW U: `φ` for the logic's pose `pose` about `line` (`scale` in [0, 1] multiplies `w` — the square camera's complement, UD3).
 * `w` 0: `φ` exactly 0 (no cap) and the state at rest. `w` 1: `φ = α` exactly. Between: `w·ᾱ`, its change capped at `maxDegS` × `dtMs` if `maxDegS` > 0
 * (the carry `w·Δα` first, so a rigid roll of the logic is followed exactly).
 */
export function uprightStep(s: UprightState, pose: CamPose, line: FramedLine, dtMs: number, knobs: UprightKnobs, scale = 1, whole = false): UprightFrame {
  const nu = viewFromVertical(pose);
  const sc = Math.min(1, Math.max(0, Number.isFinite(scale) ? scale : 0));
  const k = uprightWeight(nu, knobs.fromDeg, knobs.fullDeg);
  const w = k * sc;
  if (knobs.maxDegS > 0) return knobs.keep === true ? uprightKept(s, pose, line, dtMs, knobs.maxDegS, k, sc, nu, whole) : uprightPaced(s, pose, line, dtMs, knobs.maxDegS, w, nu, whole, sc);
  const alpha = w > 0 ? uprightAngle(pose, line) : null;
  let au: number | null;
  if (!(w > 0)) au = null;
  else if (alpha === null) au = s.au;
  else if (s.au === null || w >= 1) au = wrapPi(alpha);
  else au = s.au + wrapPi(alpha - s.au);
  const phi = au === null ? 0 : w * au;
  const state: UprightState = phi === 0 && au === null ? UPRIGHT_REST : { au, phi, ap: w > 0 ? alpha : null };
  return { state, phi, w, nu, alpha, closed: true, halfStart: 0, sc };
}

/** ⭐ The change of frame as the decision reads it (RB1). */
export interface ChangeIn {
  /** a kind that stays a timed turn whatever its angle: the square camera's, paced `byMm`, the way out `out`, a tilt's (its entry, its exit), a turn still
   *  drawn last frame (the new one replaces it from the pose shown), no picture drawn yet */
  readonly stays: boolean;
  /** `w` on the picture drawn last frame (before the change) and on the logic's pose after it (the square camera's complement included) */
  readonly wBefore: number;
  readonly wAfter: number;
  /** the logic's whole turn at the change (`poseTurnAngle`: last frame's logic pose to this frame's, rad); not finite: unknown */
  readonly turnRad: number;
  /** `freeTurnMaxDeg` (deg) */
  readonly freeMaxDeg: number;
}
/** ⭐ The decision: `timed` — a timed turn (the gizmo held while it runs, T5); else applied at once, its roll carried whole by the law; `seenRad` — the share
 *  of the turn the player sees, `(1 − min(w before, w after))` × the turn (rad; `Infinity` unknown). */
export interface ChangeSeen {
  readonly timed: boolean;
  readonly seenRad: number;
}
/**
 * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB1 — the rebuild) A CHANGE OF FRAME AS THE PLAYER SEES IT, decided ONCE, before anything is created: a timed
 * turn when its kind stays, or when the share of it he sees — `(1 − min(w before, w after))` × the logic's whole turn: where the picture is upright the law
 * hides the turn's roll — is `freeTurnMaxDeg` or more (FO3's tolerance, `turnIsFree`); else applied at once. An unknown angle: timed. ⛔ (fix rounds 0 – 3)
 * `uprightFrees`: the timed turn made in the logic's step, then DELETED at the camera's stage behind three switches — two owners of the turn.
 */
export function changeSeen(c: ChangeIn): ChangeSeen {
  const w0 = Math.min(1, Math.max(0, Number.isFinite(c.wBefore) ? c.wBefore : 0));
  const w1 = Math.min(1, Math.max(0, Number.isFinite(c.wAfter) ? c.wAfter : 0));
  const seenRad = Number.isFinite(c.turnRad) ? (1 - Math.min(w0, w1)) * Math.abs(c.turnRad) : Infinity;
  return { timed: c.stays || !turnIsFree(seenRad, c.freeMaxDeg), seenRad };
}

/**
 * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB3 — the lead's) IS THE LAW'S OWN HALF TURN UNDER WAY? A turn the player sees, read by the ONE reader of "a turn
 * the player sees is under way" (T5's, `tiltClampStep`): the gizmo held while it closes. No state (law U off): no.
 */
export function lawHalfTurn(s: UprightState | undefined): boolean {
  return s !== undefined && s.half === true;
}

/** ⭐ A turn seen of this much or more holds the push that made it (deg) — his "90°" (R6, T9). */
export const SEEN_HOLD_DEG = 90;

/**
 * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB2) THE PUSH HELD, AS THE PLAYER SEES IT: THE DY OF THE GLASS HE SEES, of the sign the logic's dy of `sign`
 * takes there (`[0, sign]` on the logic's glass `ghost` turned onto the glass of the picture drawn with it, `picture` — its up or its down). The picture the
 * logic's pose: `[0, sign]` exactly (today's dy hold). ⛔ (first build, measured on the hold walks: `z_far` s1 held 2 frames where `1.0.147-` held 104,
 * the gizmo 37 mm along the axis) the logic's dy axis itself turned onto his glass: on a picture rolled from the logic's pose his straight push had a part
 * across that axis, which passed — the gizmo slid along the edge.
 */
export function holdOnPicture(sign: 1 | -1, picture: CamPose, ghost: CamPose): readonly [number, number] {
  const m = fingerOnLogic(0, sign, ghost, picture);
  return [0, m.fdy > 0 ? 1 : m.fdy < 0 ? -1 : sign];
}

/**
 * ⭐⭐⭐ (RB2) THE HOLD A CHANGE SETS — ONLY a turn the player sees of `SEEN_HOLD_DEG` or more (`changeSeen`'s answer: timed, and its share seen): the sign that
 * crossed (`crossingEvent`, `exitHoldSign`, `crossingHold`: the logic's geometry), held as the push he made (`holdOnPicture`, last frame's picture and
 * logic's pose — the conversion the finger used when it crossed). Any other change: none (it replaces a hold still on, as every crossing does).
 * ⛔ (fix rounds 2 – 3) `uprightHoldKept`: the hold set at every crossing, then DROPPED at the camera's stage when the change was freed.
 */
export function holdSeen(seen: ChangeSeen, sign: 1 | -1 | 0, picture: CamPose | null, ghost: CamPose | null): EdgeHold | null {
  if (sign === 0 || !seen.timed || !(seen.seenRad >= (SEEN_HOLD_DEG * Math.PI) / 180)) return null;
  return { sign, back: 0, dir: picture === null || ghost === null ? [0, sign] : holdOnPicture(sign, picture, ghost) };
}

/**
 * ⭐⭐⭐ (2026-11-18, `UPRIGHT_PICTURE.md` §6 — UD6b, UD4b; fix round 1) LAW U IN TIME: `φ` moves in two parts each frame.
 * (1) THE CARRY, at once — ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §10 UD6c, fix round 3) the logic's TWIST UNDONE: `φ − c·τ`, `τ` the twist of the
 *     logic's pose about the framed line over this frame (`twistAbout`, defined everywhere), `c = min(w, w_prev)`; `c` 1 (`whole`) on a freed frame
 *     and on a timed turn's first frame (round 1's F2 and F3 as one rule). A rigid roll of the logic is undone exactly; the upright's OWN swing (the
 *     view passing near the vertical) is left to the rest, so it goes through the cap. ⛔ (fix rounds 1 – 2) `φ + c·wrap(α − α_prev)`: `α` has no
 *     meaning at the vertical, so a `Δα` read across a frame where the view crosses the band was not a roll — the 98° frame (`ilmj_39s` f629).
 * (2) THE REST: what is left to the target `w·α` (`α` the root nearest 0; none: held), the short way, closed at `maxDegS` × `dtMs` at most. No unwrap.
 * At the vertical with nothing open: `φ` exactly 0 (the picture is the logic's pose) — the logic's own continuous spin there opens no rest.
 */
function uprightPaced(s: UprightState, pose: CamPose, line: FramedLine, dtMs: number, maxDegS: number, w: number, nu: number, whole: boolean, sc: number): UprightFrame {
  const alpha = w > 0 ? uprightAngle(pose, line) : null;
  const c = whole ? 1 : Math.min(w, s.wp ?? 0);
  const tau = s.gp !== undefined ? twistAbout(s.gp, pose, line.dir) : 0;
  const pc = c > 0 && Number.isFinite(tau) && tau !== 0 ? wrapPi(s.phi - c * tau) : s.phi;
  const target = !(w > 0) ? 0 : alpha !== null ? w * alpha : pc;
  const e = wrapPi(target - pc);
  const cap = dtMs > 0 ? ((maxDegS * Math.PI) / 180) * (dtMs / 1000) : 0;
  const phi = Math.abs(e) <= cap ? target : wrapPi(pc + Math.sign(e) * cap);
  // ⭐⭐⭐ (2026-11-19, §12 RB3) THE LAW'S OWN HALF TURN: a rest of 90° or more (after a pass over the vertical) is a turn the player sees — under way
  // until it closes (`half`: the gizmo held meanwhile, T5's one reader); its start reported (`halfStart`: the push that was on held after it, RB2)
  const big = Math.abs(e) >= Math.PI / 2;
  const half = (big || s.half === true) && phi !== target;
  const state: UprightState = { au: null, phi, ap: alpha, wp: w, gp: pose, ...(half ? { half: true } : {}) };
  return { state, phi, w, nu, alpha, closed: phi === target, halfStart: big && s.half !== true ? Math.abs(e) : 0, sc };
}

/**
 * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §15 — V1) THE WEIGHT A CHANGE OF FRAME IS SEEN THROUGH (`changeSeen`'s `wBefore`, `wAfter`): with V1 (`keep`) the
 * carry's own weight — the square camera's complement `sc` alone: the law undoes the logic's twist whole at every view, so far out no change is seen,
 * near the vertical included; without it (or `sc` unknown) `w`, the defaults commit's rule.
 */
export function changeWeight(keep: boolean, w: number, sc: number | undefined): number {
  return keep && sc !== undefined ? sc : w;
}

/**
 * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §15 — V1) LAW U, NEAR THE VERTICAL THE PICTURE KEEPS THE ROLL IT ARRIVES WITH. Two parts each frame, as `uprightPaced`:
 * (1) THE CARRY, the logic's twist undone with the weight `c` = the square camera's complement alone (the smaller of this frame's and last frame's; `whole`:
 *     1) — never `w`: no turn of the logic (a crossing's half turn, a level face's exit or layout, a heading's settle) rolls the picture, at any view. The
 *     roll kept, `ψ`, is carried alike.
 * (2) THE REST toward the target `sc·ψ`, `k` the weight before the square camera's share, `d` upright against `ψ` (unwrapped in the band, none at `k` 0):
 *     at `k` 1 `ψ` upright exactly (the defaults commit's target); while `k` FALLS (toward the vertical) `ψ` is held — the roll kept; while `k` RISES `ψ`
 *     turns toward upright by the share of the way left, `(k − k_prev)/(1 − k_prev)` of `d` (from `k` 0 to `k` with upright still: `ψ + k·d` — §15's
 *     target). Closed at `maxDegS` the short way. Leaving the vertical on the far side upright is up to half a turn from `ψ`: that rest is the law's own half
 *     turn (RB3, `halfStart`, `half`), paid on the way out. ⛔ (first build, measured on his stretches) `ψ + k·d` with `ψ` set only at `k` 1: a pass whose
 *     way out stopped short of `k` 1 left `ψ` half a turn stale, and the next approach rolled the picture back to it — 140° at an ENTRY (`vyah_42s` f39 – 50).
 */
function uprightKept(s: UprightState, pose: CamPose, line: FramedLine, dtMs: number, maxDegS: number, k: number, sc: number, nu: number, whole: boolean): UprightFrame {
  const w = k * sc;
  const alpha = k > 0 ? uprightAngle(pose, line) : null;
  const c = whole ? 1 : Math.min(sc, s.sp ?? 0);
  const tau = s.gp !== undefined ? twistAbout(s.gp, pose, line.dir) : 0;
  const carry = (a: number): number => (c > 0 && Number.isFinite(tau) && tau !== 0 ? wrapPi(a - c * tau) : a);
  const pc = carry(s.phi);
  let psi = carry(s.psi ?? s.phi);
  let dk = s.dk;
  const kp = s.kp ?? k;
  if (!(k > 0)) dk = undefined;
  else if (alpha !== null) {
    if (k >= 1) {
      psi = alpha;
      dk = 0;
    } else {
      dk = dk === undefined ? wrapPi(alpha - psi) : dk + wrapPi(alpha - psi - dk);
      if (k > kp) {
        const share = (k - kp) / (1 - kp);
        psi = wrapPi(psi + share * dk);
        dk *= 1 - share;
      }
    }
  }
  const tf = sc * psi;
  const target = tf === 0 ? 0 : wrapPi(tf); // ⭐ the square camera's share whole: exactly 0, the logic's pose (UD3)
  const e = wrapPi(target - pc);
  const cap = dtMs > 0 ? ((maxDegS * Math.PI) / 180) * (dtMs / 1000) : 0;
  const phi = Math.abs(e) <= cap ? target : wrapPi(pc + Math.sign(e) * cap);
  const big = Math.abs(e) >= Math.PI / 2;
  const half = (big || s.half === true) && phi !== target;
  const state: UprightState = { au: null, phi, ap: alpha, wp: w, gp: pose, sp: sc, psi, kp: k, ...(dk !== undefined ? { dk } : {}), ...(half ? { half: true } : {}) };
  return { state, phi, w, nu, alpha, closed: phi === target, halfStart: big && s.half !== true ? Math.abs(e) : 0, sc };
}
