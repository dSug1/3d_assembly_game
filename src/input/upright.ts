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
export const UPRIGHT_MAX_DEG_S = 520; // ⭐ (2026-11-20, the owner on one pose: "set it by default to 520") — 720 before; ⭐ (2026-11-19, the owner's trial with the band 15 – 50°: "much better for scene 1 arrival at pole jitter resolution and it calms the 180 degree realignment") — 1 800 before; ⭐ (fix round 3, UD6c, measured on his ten stretches: 1 440 left gravity over 20° 9.6 % and its roll 69.5° a metre, over round 2 + 2 points / 5°; 1 800: 7.8 %, 58.8°, 47 frames of 45 – 90°, none over 90; 2 160: 6.3 %, 58.3°, but 97 frames of 45 – 90°) — ⭐ (fix round 1, measured: 1 440 the faster of 720 / 1 440 with no frame turning the camera over 90° on his hand; 720 left one)

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
}
export const UPRIGHT_REST: UprightState = Object.freeze({ au: null, phi: 0, ap: null });

export interface UprightKnobs {
  readonly fromDeg: number;
  readonly fullDeg: number;
  /** THE REST's pace, deg a second; 0 (or less): at once (law U as first built) */
  readonly maxDegS: number;
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
}

/**
 * ⭐⭐⭐ ONE FRAME OF LAW U: `φ` for the logic's pose `pose` about `line` (`scale` in [0, 1] multiplies `w` — the square camera's complement, UD3).
 * `w` 0: `φ` exactly 0 (no cap) and the state at rest. `w` 1: `φ = α` exactly. Between: `w·ᾱ`, its change capped at `maxDegS` × `dtMs` if `maxDegS` > 0
 * (the carry `w·Δα` first, so a rigid roll of the logic is followed exactly).
 */
export function uprightStep(s: UprightState, pose: CamPose, line: FramedLine, dtMs: number, knobs: UprightKnobs, scale = 1, whole = false): UprightFrame {
  const nu = viewFromVertical(pose);
  const sc = Math.min(1, Math.max(0, Number.isFinite(scale) ? scale : 0));
  const w = uprightWeight(nu, knobs.fromDeg, knobs.fullDeg) * sc;
  if (knobs.maxDegS > 0) return uprightPaced(s, pose, line, dtMs, knobs.maxDegS, w, nu, whole);
  const alpha = w > 0 ? uprightAngle(pose, line) : null;
  let au: number | null;
  if (!(w > 0)) au = null;
  else if (alpha === null) au = s.au;
  else if (s.au === null || w >= 1) au = wrapPi(alpha);
  else au = s.au + wrapPi(alpha - s.au);
  const phi = au === null ? 0 : w * au;
  const state: UprightState = phi === 0 && au === null ? UPRIGHT_REST : { au, phi, ap: w > 0 ? alpha : null };
  return { state, phi, w, nu, alpha, closed: true, halfStart: 0 };
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
export function lawHalfTurn(s: { readonly half?: boolean } | undefined): boolean {
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
function uprightPaced(s: UprightState, pose: CamPose, line: FramedLine, dtMs: number, maxDegS: number, w: number, nu: number, whole: boolean): UprightFrame {
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
  return { state, phi, w, nu, alpha, closed: phi === target, halfStart: big && s.half !== true ? Math.abs(e) : 0 };
}

/* ⭐⭐⭐ (2026-11-19, `Claude/40_RENDER_SCENE/spec/UPRIGHT_ONE_POSE.md` — packet D, `uprightOnePose` 1) ONE POSE: the picture IS the logic's pose and ONE
 * function owns how its up moves. The logic says what the up should be (its heading rules inside the band) and WHEN its frame changes (`change`); far out
 * it never turns the camera itself (OP2, `changeSeen` read with the square camera's complement). ⭐⭐⭐ (fix round 1, §12 — F1, F2; the lead's §8) THE
 * PICTURE = ITS TARGET + A GAP: the target followed EXACTLY, the gap opened only by a logic change and closed at one pace. ⛔ (P2, §11) the whole picture
 * paced (the logic's twist carried whole every frame): a yaw the finger asks at a pole capped at 720° a second, 70 – 80° behind (§11.3); the dead band
 * (OP6) measured useless — DELETED with its slider `uprightDeadDeg`. ------------------------------------------------------------------------------- */

/** ⭐ (OP3) the correction toward upright fades out between these angles of the logic's pose from upright (deg): never a half-turn blend (L2) */
export const ONE_FADE_FROM_DEG = 90;
export const ONE_FADE_TO_DEG = 150;

/** ⭐ One pose's state: `phi` the picture's turn off the logic's pose about the framed line (rad); the logic's pose last frame (`gp`: a change's carry);
 *  the GAP `g` (rad, signed: what is left of the turn a logic change opened, closing toward 0); the last target `tp` (held where `α` has no root); `hs`
 *  a half turn under way (its gap opened at 90° or more); `half` while it holds the gizmo (T5's one reader, `lawHalfTurn`) */
export interface OneState {
  readonly phi: number;
  readonly gp?: CamPose;
  readonly g?: number;
  readonly tp?: number;
  readonly hs?: boolean;
  readonly half?: boolean;
}
export const ONE_REST: OneState = Object.freeze({ phi: 0 });

export interface OneKnobs {
  readonly fromDeg: number;
  readonly fullDeg: number;
  /** the gap's pace, deg a second (0 or less: at once) */
  readonly maxDegS: number;
  /** the gizmo held for the WHOLE half turn (`uprightHalfHold` 1); 0: never held by it */
  readonly halfHold: boolean;
}

export interface OneFrame {
  readonly state: OneState;
  readonly phi: number;
  readonly w: number;
  readonly nu: number;
  readonly alpha: number | null;
  /** this frame a half turn OPENED (a logic change's gap of 90° or more): its size (rad); 0: none */
  readonly halfStart: number;
  /** a half turn under way after this frame, and `halfHold`: the gizmo held */
  readonly holding: boolean;
}

/**
 * ⭐⭐⭐ ONE FRAME OF THE ONE POSE (`UPRIGHT_ONE_POSE.md` §5.2, §12): `φ = target + g` for the logic's pose `pose` about `line`; `kappa` the square camera's
 * complement (who owns the roll: 1 far out, 0 close in); `change` a logic change applied at once this frame (the moment).
 * * OP3 THE TARGET, followed EXACTLY (F1): `w · h · α` — `w` the band's weight times `κ`, `α` the turn to upright, `h` 1 up to 90° from upright fading to 0 at
 *   150°: inside the band the logic's own pose (its continuous motion, a yaw the finger asks at a pole, shown 1:1), beyond it upright exactly.
 * * THE GAP (F1): on a change's frame the picture's last up carried to the new view (the logic's twist undone, `twistAbout`) against the new target, the
 *   shortest way (A1: re-decided at every change); on every frame it closes toward 0 at `maxDegS`, its sense kept (a number, never re-read off the poses).
 *   A half turn = a gap of 90° or more at its opening: so a half turn opens ONLY at a logic change.
 * * F2 (T5 as written): the gizmo held for the whole half turn (`halfHold`).
 */
export function upOne(s: OneState, pose: CamPose, line: FramedLine, dtMs: number, k: OneKnobs, kappa = 1, change = false): OneFrame {
  const nu = viewFromVertical(pose);
  const kap = Math.min(1, Math.max(0, Number.isFinite(kappa) ? kappa : 0));
  const w = uprightWeight(nu, k.fromDeg, k.fullDeg) * kap;
  const alpha = w > 0 ? uprightAngle(pose, line) : null;
  let target = 0;
  if (w > 0) {
    if (alpha === null) target = s.tp ?? 0;
    else {
      const x = Math.min(1, Math.max(0, ((Math.abs(alpha) * 180) / Math.PI - ONE_FADE_FROM_DEG) / (ONE_FADE_TO_DEG - ONE_FADE_FROM_DEG)));
      target = w * (1 - x * x * (3 - 2 * x)) * alpha;
    }
  }
  let g = s.g ?? 0;
  let hs = s.hs === true;
  let halfStart = 0;
  if (change) {
    const tau = s.gp !== undefined ? twistAbout(s.gp, pose, line.dir) : 0;
    const pc = Number.isFinite(tau) ? wrapPi(s.phi - tau) : s.phi;
    g = wrapPi(pc - target);
    hs = Math.abs(g) >= Math.PI / 2;
    if (hs) halfStart = Math.abs(g);
  }
  const cap = !(k.maxDegS > 0) ? Infinity : dtMs > 0 ? ((k.maxDegS * Math.PI) / 180) * (dtMs / 1000) : 0;
  g = Math.sign(g) * Math.max(0, Math.abs(g) - cap);
  if (g === 0) hs = false;
  const phi = wrapPi(target + g);
  const holding = hs && k.halfHold;
  const state: OneState = { phi, gp: pose, g, tp: target, ...(hs ? { hs: true } : {}), ...(holding ? { half: true } : {}) };
  return { state, phi, w, nu, alpha, halfStart, holding };
}
