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
import { holdAtCrossing, poseAboutPiece, poseFramingTwo, rotateAbout, type CamPose, type EdgeHold, type FramingKeep } from "./orbit_tilt";
import { fingerOnLogic, poseAxes, poseRolled, turnIsFree, twistAbout, type FramedLine } from "./roll_follow";

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

/* ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/UPRIGHT_CARRIED_UP.md` — packet E, `uprightCarried` 1) ONE CARRIED UP: the picture's up turned only by what the
 * finger ASKS. The logic computes its pose `G` (its heading from the eye's direction); the picture is `G` turned by `φ` about the framed line, and `φ` takes
 * back every twist of `G` the finger did not ask (C2) — so near the vertical the logic's heading rules no longer roll the picture (packet A: 172° a second
 * on his play, `1.0.147-` 25). Three things alone move `φ` toward its target: a dx (near the vertical), time (far out), the ONE half turn at the logic's
 * crossing. ⛔ One pose (`1.0.148d-`): the target followed exactly — near the vertical the target IS the logic's pose, computed from the eye's direction:
 * every turn of its heading rules shown. ------------------------------------------------------------------------------------------------------------ */

/** ⭐ (C3) the correction toward upright fades out between these angles of the logic's pose from upright (deg): never a half-turn blend */
export const ONE_FADE_FROM_DEG = 90;
export const ONE_FADE_TO_DEG = 150;
/** ⭐ (C1) the turn asked: the turntable's within this of the vertical (deg) … */
export const ASKED_TURNTABLE_DEG = 15;
/** ⭐ … the upright camera's from this one (deg), a smoothstep of the view between */
export const ASKED_UPRIGHT_DEG = 30;
/** ⭐ (C5) a half turn within this of 180° (deg) takes the way the picture rolled last … */
export const CARRIED_SENSE_DEG = 30;
/** ⭐ … if it rolled this much or more (deg) over the last `CARRIED_ROLL_MEMORY_MS` */
export const CARRIED_SENSE_MIN_DEG = 2;
export const CARRIED_ROLL_MEMORY_MS = 100;
/** ⭐ (C4) the alignment a dx pays near the vertical: degrees of the picture's turn per mm of the finger's dx — the slider `uprightAlignDegPerMm` */
export const UPRIGHT_ALIGN_DEG_PER_MM = 3;

/** ⭐ The carried up's state: `phi` the picture's turn off the logic's pose about the framed line (rad); `gp` the logic's pose last frame; `g` what is left of
 *  a half turn (rad, signed, closing toward 0); `hs` a half turn under way; `half` while it holds the gizmo (T5's one reader); `rr` the picture's own roll
 *  over the last ~100 ms (rad: the half turn's sense) */
export interface CarriedState {
  readonly phi: number;
  readonly gp?: CamPose;
  readonly g?: number;
  readonly hs?: boolean;
  readonly half?: boolean;
  readonly rr?: number;
}
export const CARRIED_REST: CarriedState = Object.freeze({ phi: 0 });

export interface CarriedKnobs {
  readonly fromDeg: number;
  readonly fullDeg: number;
  /** the half turn's pace and far out the alignment's, deg a second (0 or less: at once) */
  readonly maxDegS: number;
  /** the alignment a dx pays (deg per mm of the finger's dx) */
  readonly alignDegPerMm: number;
  /** the gizmo held for the whole half turn (`uprightHalfHold` 1); false: never held by it */
  readonly halfHold: boolean;
}

export interface CarriedFrame {
  readonly state: CarriedState;
  readonly phi: number;
  readonly w: number;
  readonly nu: number;
  readonly alpha: number | null;
  /** this frame a half turn OPENED: its size (rad); 0: none */
  readonly halfStart: number;
  /** a half turn under way after this frame, and `halfHold`: the gizmo held */
  readonly holding: boolean;
}

const smooth01 = (x: number): number => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const turnedPose = (p: CamPose, axis: Vec3, th: number): CamPose => ({ eye: rotateAbout(p.eye, axis, th), look: rotateAbout(p.look, axis, th), up: rotateAbout(p.up, axis, th) });
const uprightOf = (p: CamPose): CamPose => ({ eye: p.eye, look: p.look, up: Y });

/**
 * ⭐⭐⭐ (C1) THE TURN THE FINGER ASKED this frame, as a twist about `dir` (rad, `twistAbout`'s sense): the twist of the camera an honest orbit makes for the eye's
 * motion from `prev` to `pose` — away from the vertical the UPRIGHT camera's (an upright orbit's own roll is asked), near it the TURNTABLE's: the drawn
 * orbit's yaw step `dYaw` (rad) about its pole axis `pole` (unit; its sign read off the eye's motion), blended by a smoothstep of the view between
 * `ASKED_TURNTABLE_DEG` and `ASKED_UPRIGHT_DEG`. A weight on an INCREMENT: it never steps the picture. A view too near the vertical for an upright camera:
 * the turntable's alone. Pure.
 */
export function askedTwist(prev: CamPose, pose: CamPose, dir: Vec3, pole: Vec3, dYaw: number): number {
  const nu = (viewFromVertical(pose) * 180) / Math.PI;
  const nu0 = (viewFromVertical(prev) * 180) / Math.PI;
  const s = smooth01((Math.min(nu, nu0) - ASKED_TURNTABLE_DEG) / (ASKED_UPRIGHT_DEG - ASKED_TURNTABLE_DEG));
  let tt = 0;
  if (s < 1 && Number.isFinite(dYaw) && dYaw !== 0) {
    const [f0] = poseAxes(prev);
    const [f1] = poseAxes(pose);
    const fp = rotateAbout(f0, pole, dYaw);
    const fm = rotateAbout(f0, pole, -dYaw);
    const th = dot(fp, f1) >= dot(fm, f1) ? dYaw : -dYaw;
    tt = twistAbout(prev, turnedPose(prev, pole, th), dir);
  }
  const tu = s > 0 && Math.min(nu, nu0) > 0.5 ? twistAbout(uprightOf(prev), uprightOf(pose), dir) : 0;
  const t = (1 - s) * tt + s * tu;
  return Number.isFinite(t) ? t : 0;
}

/**
 * ⭐⭐⭐ ONE FRAME OF THE CARRIED UP (`UPRIGHT_CARRIED_UP.md` §4.2): the logic's pose `pose` about `line`; `kappa` the square camera's complement (1 far out, 0 close
 * in); `change` a logic change applied at once this frame (the moment); `asked` the turn the finger asked (C1); `dxMm` the finger's dx this frame (mm).
 * * C2 THE CARRY: `φc = φ − (τ − asked)` — the logic's twist the finger did not ask taken back (a change's jump whole: `asked` ignored there).
 * * C3 THE TARGET `w · h · α` (one pose's OP3): the logic's pose inside the band, upright beyond, never a half-turn blend.
 * * C4 THE ALIGNMENT, PAID: toward the target by at most `alignDegPerMm · dxMm`, and beyond the band (`w` 1) by `maxDegS` a second too — never by itself near
 *   the vertical: a dy never rolls the picture there. Close in (`kappa` < 1): the target itself (the square camera owns the roll; `kappa` 0: the logic's pose).
 * * C5 THE HALF TURN: at a change, `|φc − target| ≥ 90°` opens it — within `CARRIED_SENSE_DEG` of 180° the way the picture rolled last (`rr`), else the short
 *   way; it closes in time at `maxDegS`, whatever the view does; `holding` while under way (`halfHold`).
 */
export function upCarried(s: CarriedState, pose: CamPose, line: FramedLine, dtMs: number, k: CarriedKnobs, kappa = 1, change = false, asked = 0, dxMm = 0): CarriedFrame {
  const nu = viewFromVertical(pose);
  const kap = Math.min(1, Math.max(0, Number.isFinite(kappa) ? kappa : 0));
  const w = uprightWeight(nu, k.fromDeg, k.fullDeg) * kap;
  const alpha = w > 0 ? uprightAngle(pose, line) : null;
  let target = 0;
  if (w > 0 && alpha !== null) {
    const x = Math.min(1, Math.max(0, ((Math.abs(alpha) * 180) / Math.PI - ONE_FADE_FROM_DEG) / (ONE_FADE_TO_DEG - ONE_FADE_FROM_DEG)));
    target = w * (1 - x * x * (3 - 2 * x)) * alpha;
  } else if (w > 0) target = wrapPi(s.phi);
  const tau0 = s.gp !== undefined ? twistAbout(s.gp, pose, line.dir) : 0;
  const tau = Number.isFinite(tau0) ? tau0 : 0;
  const cap = !(k.maxDegS > 0) ? Infinity : dtMs > 0 ? ((k.maxDegS * Math.PI) / 180) * (dtMs / 1000) : 0;
  let g = s.g ?? 0;
  let hs = s.hs === true;
  let halfStart = 0;
  let phi: number;
  if (kap < 1) {
    phi = target;
    g = 0;
    hs = false;
  } else {
    let pc = wrapPi(s.phi - (change ? tau : tau - (Number.isFinite(asked) ? asked : 0)));
    if (change) {
      // ⭐ (C5) RE-DECIDED from the new target at every change: 90° or more — the half turn (re)opens, a turn under way keeps its sense near 180° (its own roll is the last); under
      // 90° — none (a turn under way ENDS: ⛔ first measured, its old gap kept closing toward a target the change had moved — the picture turned on, away)
      let e = wrapPi(pc - target);
      if (Math.abs(e) < Math.PI / 2) {
        g = 0;
        hs = false;
      } else {
        const rr = s.rr ?? 0;
        const pref = Math.abs(rr) >= (CARRIED_SENSE_MIN_DEG * Math.PI) / 180 ? -Math.sign(rr) : 0; // (a turn under way: its own roll, so its sense kept)
        if (pref !== 0 && Math.sign(e) !== pref && Math.abs(e) >= Math.PI - (CARRIED_SENSE_DEG * Math.PI) / 180) e += 2 * Math.PI * pref;
        g = e;
        hs = true;
        halfStart = Math.abs(e);
      }
    }
    if (hs) {
      const step = Math.min(Math.abs(g), cap);
      pc = wrapPi(pc - Math.sign(g) * step);
      g = Math.sign(g) * (Math.abs(g) - step);
      if (g === 0) hs = false;
    } else {
      const beta = (Math.max(0, k.alignDegPerMm) * Math.max(0, Number.isFinite(dxMm) ? dxMm : 0) * Math.PI) / 180 + (w >= 1 ? cap : 0);
      const e = wrapPi(target - pc);
      pc = Math.abs(e) <= beta ? target : wrapPi(pc + Math.sign(e) * beta);
    }
    phi = pc;
  }
  const rollNow = wrapPi(tau + wrapPi(phi - s.phi));
  const rr = (s.rr ?? 0) * Math.exp(-Math.max(0, dtMs) / CARRIED_ROLL_MEMORY_MS) + rollNow;
  const holding = hs && k.halfHold;
  const state: CarriedState = { phi, gp: pose, g, rr, ...(hs ? { hs: true } : {}), ...(holding ? { half: true } : {}) };
  return { state, phi, w, nu, alpha, halfStart, holding };
}

/**
 * ⭐⭐⭐ (C6, E-D4 — the owner: *"the dx shall be hold only if the crossing by dx triggers a camera realignment"*) THE PUSH HELD AT A LOGIC CHANGE, from the same
 * answer as the half turn: none opened (`halfStart` 0) — nothing held (a hold still on ends, OP8); the logic's dy sign that crossed (`crossed`) — OP8's dy
 * hold exactly (`holdAtCrossing`); none, and a dx pushing (`dxSign`) — THE DX HELD: its way on the glass he sees (`dir` `[±1, 0]`), released as the dy's.
 */
export function carriedHold(halfStart: number, crossed: 1 | -1 | 0, dxSign: number): EdgeHold | null {
  if (!(halfStart > 0)) return null;
  if (crossed !== 0) return holdAtCrossing(crossed);
  return dxSign > 0 ? { sign: 1, back: 0, dir: [1, 0] } : dxSign < 0 ? { sign: 1, back: 0, dir: [-1, 0] } : null;
}

/**
 * ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` §8 — packet J, the owner on the live build: *"in polar orbit in scene 1 and in scene 0bis, when I leave or enter
 * a level face or a triangle face close to the level face, there are lots of jumps of camera and piece"*) THE FRAMING CARRIED FROM THE POSE SHOWN. Far out
 * a logic change is applied at once (one pose's OP2) and the carry takes back only its roll about the framed line — a turn about the line through the
 * piece and the look point keeps BOTH where the NEW pose frames them: the logic's camera offsets turn with its heading, so the piece leapt on the glass
 * in one frame (median 103 px, up to 400; the snap the zone's turn cured on 2026-11-14, back since OP2 skipped that turn). Now the drawn pose blends
 * from the pose shown (turned back by the carried φ) to the logic's, by the 2026-11-14 rule (`poseFramingTwo`: the piece and the aim each carried
 * straight on the glass; degenerate, about the piece alone), over the change's own time at the half turn's pace — display only: φ, the half turn, the
 * holds as they were.
 */
export interface FramingTurn {
  /** the pose the blend starts from, with the piece's place then (`piece`) */
  readonly from: CamPose;
  /** the time done and the turn's whole (ms) */
  readonly doneMs: number;
  readonly wholeMs: number;
  /** the two-target turn's angles carried (`poseFramingTwo`) */
  readonly keep: FramingKeep | null;
  /** 0 its first frame; 1 the two framed; 2 about the piece alone — chosen at its first frame and kept (`zoneMixPose`'s rule) */
  readonly rule: 0 | 1 | 2;
  /** about the piece alone: the turn's axis kept frame to frame */
  readonly axis: Vec3 | null;
}

/**
 * ⭐ ONE FRAME OF THE FRAMING TURN'S CLOCK: a change applied at once (`change`, `shown` the pose shown) opens it — its whole the change's angle (`turnRad`) or
 * the half turn's (`halfRad`), the larger, at `maxDegS`; a change while one runs opens it again from the pose shown; else it runs on by `dtMs` and ends at its
 * whole. None close in (`kappa` < 1: the square camera owns the pose), at a pace of 0 (at once), or for a turn shorter than the frame. Pure.
 */
export function framingStep(f: FramingTurn | null, change: boolean, shown: CamPose | null, turnRad: number, halfRad: number, dtMs: number, maxDegS: number, kappa: number): FramingTurn | null {
  if (!(kappa >= 1) || !(maxDegS > 0)) return null;
  const dt = Number.isFinite(dtMs) ? Math.max(0, dtMs) : 0;
  if (change && shown !== null) {
    const ang = Math.max(Number.isFinite(turnRad) ? Math.abs(turnRad) : 0, Number.isFinite(halfRad) ? Math.abs(halfRad) : 0);
    const wholeMs = (ang / ((maxDegS * Math.PI) / 180)) * 1000;
    return wholeMs > dt ? { from: shown, doneMs: dt, wholeMs, keep: null, rule: 0, axis: null } : null;
  }
  if (f === null) return null;
  const doneMs = f.doneMs + dt;
  return doneMs >= f.wholeMs ? null : { ...f, doneMs };
}

/** ⭐ the framing turn's share shown: the smoothstep of its time done (0: the pose shown; 1: the logic's) */
export function framingShare(f: FramingTurn): number {
  return smooth01(f.wholeMs > 0 ? f.doneMs / f.wholeMs : 1);
}

/**
 * ⭐ THE POSE DRAWN IN A FRAMING TURN, toward `to` (the logic's pose) at its share: the piece (`piece`) and the aim each carried straight on the glass
 * (`poseFramingTwo`); degenerate — about the piece alone (`poseAboutPiece`); the rule chosen at the turn's first frame and kept. Returns the turn with its
 * carried angles. Pure.
 */
export function framedPose(f: FramingTurn, to: CamPose, piece: Vec3): { readonly pose: CamPose; readonly turn: FramingTurn } {
  const k = framingShare(f);
  const t = f.rule === 2 ? null : poseFramingTwo(f.from, to, piece, k, f.keep);
  if (t !== null) return { pose: t.pose, turn: { ...f, keep: t.keep, rule: 1 } };
  const r = poseAboutPiece(f.from, to, piece, k, f.axis);
  return { pose: r.pose, turn: { ...f, rule: f.rule === 0 ? 2 : f.rule, axis: r.axis ?? f.axis } };
}

/**
 * ⭐ THE POSE A FRAMING TURN STARTS FROM: the picture drawn last frame (`picture`, the piece where it was then, `piecePrev`) turned back by this frame's φ
 * about the framed line (`line`) — the WHOLE of it, the piece's place then included: the turn is drawn rolled by φ again, so its first frame is that picture
 * with the piece where it was on the glass. ⛔ (first built, `f33ef5c`) the pose turned and its piece not: at φ ±180° with a moving piece the blend started
 * the piece from its mirror across the line (589 px in one frame at his pace — the vectors had a still piece). Pure.
 */
export function framingFrom(picture: CamPose, piecePrev: Vec3, line: FramedLine, phi: number): CamPose {
  const a = line.at;
  const v = rotateAbout([piecePrev[0] - a[0], piecePrev[1] - a[1], piecePrev[2] - a[2]], line.dir, -phi);
  return { ...poseRolled(picture, line, -phi), piece: [a[0] + v[0], a[1] + v[1], a[2] + v[2]] };
}
