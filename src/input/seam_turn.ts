/**
 * ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4c, "THE ONE TRANSITION" 4.) **THE ONE TRANSITION'S TURN** — the pure rules a change of frame needs under the
 * charts' layout (the wiring in `render/assembly_wiring.ts`):
 *
 * * **The piece's shown direction eased on the camera turn's clock** (`dirGap`, `easedDir`): a change of frame SETS every angle state to the new chart's
 *   angles at the gizmo (`seamRebase`), and the direction the piece hangs along steps from the one DRAWN before to the new chart's own — by the gap between
 *   the two conventions. ⛔ A step (rule 2, Continuity): ONE rotation (axis, angle) fixed at the transition, taking the new direction back onto the one
 *   shown; while the camera's turn runs the direction shown is the new chart's turned back by the REST of it (`1 − share`): at the start exactly the one
 *   drawn before, at the end exactly the new one.
 * * **The turn's pace** (`seamTurnPace`, `seamTurnHolds`, `seamTurnStep`): the automatic tilt's turn made while the camera is PENDING (the approach still
 *   going) is held at its start, then goes by the FINGER's travel (`blendShare`), the gizmo free; with the blend over (or none) by TIME at `tiltRollDegS`,
 *   the gizmo held — today's swing rule (`tiltFrame`'s `byMm`, `tiltClampStep`'s `swingTimed`), on the one camera turn. Any other turn: by time, held.
 * * **A place with no unique angles** (`poleYawKept`): at a pole of a chart (a cap's centre: any yaw) the yaw that keeps the heading SHOWN.
 * * **The exit asked at once** (`tiltLeavesNow`): off the tilted facet, or the tilt turned off — no roll back inside F first.
 * ⛔ ENGINE-FREE. Rodrigues' formula, a linear clock — textbook; no licence, no patent.
 */
import { cross, dot, type Vec3 } from "../core/vec";
import { rotateAbout } from "./orbit_tilt";

/** ⭐ The gap between two shown directions: the ONE rotation (unit `axis`, `angle` in rad, 0 … π) taking the new direction onto the one shown before. */
export interface DirEase {
  readonly axis: Vec3;
  readonly angle: number;
}

/** ⭐ under this angle (rad) two directions are one: no ease */
export const DIR_GAP_MIN_RAD = 1e-12;

const unit = (v: Vec3): Vec3 | null => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-15 ? [v[0] / l, v[1] / l, v[2] / l] : null;
};

/**
 * ⭐⭐⭐ THE GAP from the direction `next` (the new chart's own, just after the transition) back to `shown` (the one drawn before it): the least rotation
 * taking `next` onto `shown` (its axis `next × shown`). `null`: no gap (the two within `DIR_GAP_MIN_RAD`, or either of zero length) — the new direction at
 * every share. ⭐ ANTIPARALLEL (`next × shown` vanishes, the angle π): every axis square to `next` is a least rotation — the one taken is square to `next`
 * and to the WORLD AXIS most square to it (x, y, z in that order of preference on a tie): deterministic, never a zero axis.
 */
export function dirGap(shown: Vec3, next: Vec3): DirEase | null {
  const a = unit(shown);
  const b = unit(next);
  if (a === null || b === null) return null;
  const c = cross(b, a);
  const s = Math.hypot(c[0], c[1], c[2]);
  const angle = Math.atan2(s, dot(b, a));
  if (!(angle > DIR_GAP_MIN_RAD)) return null;
  if (s > 1e-12) return { axis: [c[0] / s, c[1] / s, c[2] / s], angle };
  // antiparallel: the world axis most square to `next`, made square to it
  const ax: readonly Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let w = ax[0]!;
  for (const e of ax) if (Math.abs(dot(e, b)) < Math.abs(dot(w, b)) - 1e-15) w = e;
  const d = dot(w, b);
  const p = unit([w[0] - b[0] * d, w[1] - b[1] * d, w[2] - b[2] * d])!;
  return { axis: p, angle };
}

/**
 * ⭐⭐⭐ THE DIRECTION SHOWN at the turn's `share` (0 … 1, clamped): `u` (the new chart's direction, whatever the angles asked — the piece, its solver, the
 * foot alike) turned back by the REST of the gap, `(1 − share)·angle` about its axis. `share` 1 or no gap: `u` itself, exactly.
 */
export function easedDir(u: Vec3, ease: DirEase | null, share: number): Vec3 {
  if (ease === null) return u;
  const s = Number.isFinite(share) ? Math.min(1, Math.max(0, share)) : 1;
  const rest = (1 - s) * ease.angle;
  if (!(rest > 0)) return u;
  return rotateAbout(u, ease.axis, rest);
}

/**
 * ⭐⭐⭐ THE REST OF A GAP at the share `share` of its turn — the ease carried onto ANOTHER turn started from the pose shown (the spit's crossing during it):
 * the same axis, `(1 − share)·angle`, so the direction shown is the same on both sides of the restart (then dissolved on the new turn's share). `null`: none
 * left.
 */
export function easeRest(ease: DirEase | null, share: number): DirEase | null {
  if (ease === null) return null;
  const s = Number.isFinite(share) ? Math.min(1, Math.max(0, share)) : 1;
  const angle = (1 - s) * ease.angle;
  return angle > DIR_GAP_MIN_RAD ? { axis: ease.axis, angle } : null;
}

/** ⭐ How a camera turn advances this frame: held at its start, by the finger's travel, or by time. */
/**
 * ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §12 2.4c — the auditor's find, measured in the app on `Scene_1`'s top, close in) THE TRANSITION'S WHOLE ANGLE: the
 * SUM of its two parts — the camera's turn (`turnRad`, the pose's own angle as it is now) and the piece's shown direction's gap (`easeRad`, `dirGap`'s;
 * none: 0) — the ONE clock both run on, so the two TOGETHER never turn the view faster than the tilts' one speed (the owner, 2026-11-10: *"one speed
 * for every tilt"*). ⛔ The camera's turn alone: the two angles are unrelated (the camera's pose 1.2° from the one shown, the piece's direction 7.7° —
 * the spring's lag behind a fast finger); the turn was whole in one frame and the rest of the gap was handed over in the next: the view turned 9.1° in
 * ONE frame at the tilts' 6° a frame. ⛔ The LONGER of the two (the first fix): each part within the speed, the two adding — 8.9° in a frame, measured.
 */
export function seamWholeRad(turnRad: number, easeRad: number): number {
  const t = Number.isFinite(turnRad) && turnRad > 0 ? turnRad : 0;
  const e = Number.isFinite(easeRad) && easeRad > 0 ? easeRad : 0;
  return t + e;
}

/**
 * ⭐⭐⭐ (2026-11-16 night, `TILTED_POLE_CLOSE_IN.md` §18, package A) ONE FRAME'S STEP ON THE TRANSITION'S CLOCK (rad, over `seamWholeRad`'s whole): the one
 * speed's step `stepRad`, less what the camera's own angle (`turnRad`, read last frame) GROWS in the frame — where the camera follows the eased direction
 * (the world's frame: `dirAt`) its target moves with the ease, by up to `easeRad` × the share's step, so the whole the clock reads is a frame late. The
 * share's step `x` solves `x·(turnRad + easeRad) + x²·easeRad = stepRad`: the picture's turn in the frame at most `stepRad`. No ease: `stepRad` itself,
 * exactly (as before). ⛔ The step on the whole read last frame: 6.19° in the first frame of `Scene_1`'s exit by an edge (the square camera inside it).
 */
export function seamStepRad(stepRad: number, turnRad: number, easeRad: number): number {
  const t = Number.isFinite(turnRad) && turnRad > 0 ? turnRad : 0;
  const e = Number.isFinite(easeRad) && easeRad > 0 ? easeRad : 0;
  const w = t + e;
  if (!(e > 1e-12) || !(stepRad > 0)) return stepRad;
  const x = (-w + Math.sqrt(w * w + 4 * e * stepRad)) / (2 * e);
  return x * w;
}

export type TurnPace = "HELD" | "FINGER" | "TIME";

/**
 * ⭐⭐⭐ THE TURN'S PACE — today's swing rule on the one camera turn: a turn made as the automatic tilt switched on (`paced`: the camera pending then — today's
 * `byMm`) is HELD while the camera is still pending (`pending`, the approach going on), then by the FINGER while the blend runs (`blendActive`), then by
 * TIME (the blend whole at a crossing, or none). Any other turn (`paced` false: a zone's, the spit's, an exit's, a pole's): by TIME, as ever.
 */
export function seamTurnPace(paced: boolean, pending: boolean, blendActive: boolean): TurnPace {
  if (!paced) return "TIME";
  if (pending) return "HELD";
  return blendActive ? "FINGER" : "TIME";
}

/**
 * ⭐⭐⭐ IS THE GIZMO HELD by the turn (`k` its share, short of whole): only while it runs by TIME — `tiltClampStep`'s `swingTimed` (a swing paced by the
 * finger, or pending, never holds the gizmo: it moves from the first millimetre). A turn not `paced`: held while `k` < 1, as `asmZoneMix` always was.
 */
export function seamTurnHolds(paced: boolean, pending: boolean, blendActive: boolean, k: number): boolean {
  return k < 1 && seamTurnPace(paced, pending, blendActive) === "TIME";
}

/**
 * ⭐⭐⭐ ONE FRAME OF A TURN, `t` its state (`k` the share, `done` the angle turned so far, `rad` the whole turn's angle as read now, `axisKnown`: the
 * camera's stage has read it): HELD — as it is; FINGER — the share the finger's (`share`, never back: today's `max`), `done` its angle; TIME — from the
 * frame its angle is known, `done` on at `degS` °/s toward `rad` (the zones' own clock, `zoneStep`), `k` its share. `degS` 0: whole at once.
 */
export function seamTurnStep(
  t: { readonly k: number; readonly done: number; readonly rad: number; readonly axisKnown: boolean },
  pace: TurnPace,
  share: number,
  dtMs: number,
  degS: number,
  easeRad = 0,
): { readonly k: number; readonly done: number } {
  if (pace === "HELD") return { k: t.k, done: t.done };
  if (pace === "FINGER") {
    // ⭐⭐⭐ (2026-11-16 night, `TILTED_POLE_CLOSE_IN.md` §18, package A — the owner: *"1- A"*) THE SHARE SHOWN NEVER OVER THE ONE SPEED: the finger's
    // share, but at most `degS`'s step a frame over the turn's whole angle — and only once that angle is read (as the timed clock). ⛔ The finger's share at
    // once: a fast finger turned the picture as fast as it went (the path the W11 auditor named, unmeasured)
    if (!t.axisKnown) return { k: t.k, done: t.done };
    const want = Math.min(1, Math.max(t.k, share));
    const k = degS > 0 && t.rad > 1e-9 ? Math.min(want, t.k + seamStepRad(((degS * Math.PI) / 180) * (Math.max(0, dtMs) / 1000), t.rad - easeRad, easeRad) / t.rad) : want;
    return { k, done: k * t.rad };
  }
  if (!t.axisKnown) return { k: t.k, done: t.done };
  const done = degS > 0 ? Math.min(t.rad, t.done + seamStepRad(((degS * Math.PI) / 180) * (Math.max(0, dtMs) / 1000), t.rad - easeRad, easeRad)) : t.rad;
  return { k: t.rad > 1e-9 ? Math.min(1, done / t.rad) : 1, done };
}

/**
 * ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §8, step C3 — D-T1, the owner: *"Find a way to blend properly the camera movement on the way out"*) THE WAY
 * OUT OF CLOSE IN, BLENDED: is the turn after the tilt's exit PACED BY THE FINGER — the tilt left BY DISTANCE
 * (`off`: turned off, and `closeIn` false: the automatic tilt's latch is off — ⛔ a tilt turned off by a zone's switch keeps the latch on), with the span
 * over 0 (`outBlendMm`, `tiltOutBlendMm`). Otherwise (an edge's exit, a zone's, the span 0): the timed turn, the gizmo held — as built.
 */
export function seamOutPaced(off: boolean, closeIn: boolean, outBlendMm: number): boolean {
  return off && !closeIn && outBlendMm > 0;
}

/**
 * ⭐⭐⭐ (step C3) THE WAY OUT'S TARGET PROGRESS (0 … 1): the larger of the approach finger's travel OUTWARD since the turn started over `outSpanMm`
 * (`tiltOutBlendMm`) and the orbit finger's travel since then over `orbitSpanMm` (`tiltBlendMm` — the way in's own blend: an orbit started before the turn
 * is whole finishes it over its first millimetres), each clamped to 1 (a span 0: whole at the first millimetre); 1 outright once NO finger is down
 * (`fingerDown` false — the gesture over: never left half done).
 */
export function seamOutTarget(outMm: number, orbitMm: number, outSpanMm: number, orbitSpanMm: number, fingerDown: boolean): number {
  if (!fingerDown) return 1;
  const share = (mm: number, span: number): number => {
    const m = Number.isFinite(mm) && mm > 0 ? mm : 0;
    if (!(span > 0)) return m > 0 ? 1 : 0;
    return Math.min(1, m / span);
  };
  return Math.max(share(outMm, outSpanMm), share(orbitMm, orbitSpanMm));
}

/**
 * ⭐⭐⭐ (step C3) ONE FRAME OF THE WAY OUT'S PROGRESS `p`: toward `target`, NEVER BACK (a smaller target holds it), by at most the tilts' one speed
 * (`degS` °/s over the turn's whole angle `wholeRad`, `turnWhole`'s) ON THE SHARE SHOWN — a fast finger never flips the picture in a frame. Held
 * until the camera's stage has read the turn's angle (`axisKnown`, as the timed clock). A turn of no angle, or `degS` 0: the target at once (no angle: whole).
 */
export function seamOutStep(p: number, target: number, dtMs: number, wholeRad: number, degS: number, axisKnown: boolean): number {
  const p0 = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  if (!axisKnown) return p0;
  if (!(wholeRad > 1e-9)) return 1;
  const t = Number.isFinite(target) ? Math.min(1, Math.max(0, target)) : 1;
  if (!(t > p0)) return p0;
  if (!(degS > 0)) return t;
  const r = (((degS * Math.PI) / 180) * (Math.max(0, dtMs) / 1000)) / wholeRad;
  // ⭐⭐⭐ (the auditor, 2026-11-16 — T5, the owner: *"one speed for every tilt"*) THE ONE SPEED IS THE PICTURE'S: what is shown is the smooth share of `p`
  // (`seamOutShare`, its slope up to 1.5 in the middle), so the progress's step is the speed's step over the steepest slope the step can meet — the
  // SHOWN share never moves faster than `degS`; slower at both ends (the smooth start and end). ⛔ The speed's step on `p` itself: 540°/s in the middle
  const slope = (x: number): number => 6 * x * (1 - x);
  const p1 = Math.min(1, p0 + r);
  const steepest = Math.max(1, slope(p0), slope(p1), p0 < 0.5 && p1 > 0.5 ? 1.5 : 0);
  return Math.min(t, p0 + r / steepest);
}

/** ⭐⭐⭐ (step C3) THE SHARE SHOWN at the progress `p` (the turn's `k`): a smoothstep — no abrupt first or last frame; 0 at 0, ½ at ½, 1 at 1. */
export function seamOutShare(p: number): number {
  const x = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 1;
  return x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ (step C3) DOES A CAMERA TURN HOLD THE GIZMO (`tiltClampStep`): the way out paced by the finger (`out`) — NEVER (an orbit step honoured while it
 * runs, as a turn paced by the finger on the way in); the automatic tilt's entry made pending (`paced`) — `seamTurnHolds`; any other — while short of whole.
 */
export function turnHoldsGizmo(out: boolean, paced: boolean, pending: boolean, blendActive: boolean, k: number): boolean {
  if (out) return false;
  return paced ? seamTurnHolds(true, pending, blendActive, k) : k < 1;
}

/**
 * ⭐⭐⭐ A PLACE WITH NO UNIQUE ANGLES: at a pole of a chart (the map's pitch at ±`maxPitch` — a cap's centre: any yaw puts the gizmo there) the yaw that
 * keeps the HEADING SHOWN (`yawShown`; none: the map's own). Off a pole: the map's angles, untouched.
 */
export function poleYawKept(mq: { readonly yaw: number; readonly pitch: number }, maxPitch: number, yawShown: number | null): { readonly yaw: number; readonly pitch: number } {
  if (yawShown === null || !Number.isFinite(yawShown) || !(Math.abs(mq.pitch) >= maxPitch - 1e-9)) return mq;
  return { yaw: Math.atan2(Math.sin(yawShown), Math.cos(yawShown)), pitch: mq.pitch };
}

/**
 * ⭐⭐⭐ (2026-11-16 night, `TILTED_POLE_CLOSE_IN.md` §18, package A) THE SQUARE CAMERA'S MIX, as an angle: the direction `calmDir` shows is the normalised
 * mix `(1 − q)·b + q·n` of the calm's direction `b` and the square normal `n`, `thetaRad` apart — its angle from `b` at the share `q` (0 at 0, θ at 1).
 */
export function nlerpAngle(q: number, thetaRad: number): number {
  return Math.atan2(q * Math.sin(thetaRad), 1 - q + q * Math.cos(thetaRad));
}

/**
 * ⭐⭐⭐ (package A — the owner's *"1- A"*: the picture never faster than the tilts' one speed, *"the square camera's own share included"*) ONE FRAME OF THE
 * SQUARE CAMERA'S OWN SHARE (no transition running): from `q0` toward `qWant`, the direction shown (`nlerpAngle`) turned by at most `maxRad` — exactly
 * that while short (the share at that angle: `sin a / (sin a + sin(θ − a))`), the share asked once within it. No angle, no limit (`Infinity`: no speed),
 * or the two directions opposite (no arc): the share asked. ⛔ Its own ease (`wholeShareStep` over 125 ms, or the finger's blend) uncapped: 11° and more
 * in a frame at a quarter turn.
 */
export function squareShareStep(q0: number, qWant: number, thetaRad: number, maxRad: number): number {
  const a = Number.isFinite(q0) ? Math.min(1, Math.max(0, q0)) : 0;
  const w = Number.isFinite(qWant) ? Math.min(1, Math.max(0, qWant)) : a;
  if (!Number.isFinite(maxRad) || !(thetaRad > 1e-9) || thetaRad > Math.PI - 1e-6) return w;
  const m = Math.max(0, maxRad);
  const a0 = nlerpAngle(a, thetaRad);
  const aw = nlerpAngle(w, thetaRad);
  if (Math.abs(aw - a0) <= m) return w;
  const a1 = aw > a0 ? a0 + m : a0 - m;
  const s = Math.sin(a1);
  return s / (s + Math.sin(thetaRad - a1));
}

/**
 * ⭐⭐⭐ (package A, the audit's blocker — 2026-11-17) THE PICTURE'S TURN between two camera poses (rad, 0 … π): the one rotation taking the first pose's
 * axes (its look `look − eye`, its up made square to it, their right) onto the second's — what the eye sees turn, the look and the roll together (the
 * gates' own measure). A degenerate pose (no look, an up along it): 0.
 */
export function poseTurnRad(a: { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3 }, b: { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3 }): number {
  const axes = (p: { readonly eye: Vec3; readonly look: Vec3; readonly up: Vec3 }): { l: Vec3; u: Vec3; r: Vec3 } | null => {
    const l = unit([p.look[0] - p.eye[0], p.look[1] - p.eye[1], p.look[2] - p.eye[2]]);
    if (l === null) return null;
    const k = dot(p.up, l);
    const u = unit([p.up[0] - k * l[0], p.up[1] - k * l[1], p.up[2] - k * l[2]]);
    if (u === null) return null;
    return { l, u, r: cross(u, l) };
  };
  const A = axes(a);
  const B = axes(b);
  if (A === null || B === null) return 0;
  const tr = dot(A.l, B.l) + dot(A.u, B.u) + dot(A.r, B.r);
  return Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
}

/**
 * ⭐⭐⭐ (package A, the audit's blocker — 2026-11-17, the owner's *"1- A"*: the picture never faster than the tilts' one speed, in any path) THE SHARE
 * DRAWN THIS FRAME: the clock's share `kWant`, unless the picture would turn more than `maxRad` from the pose drawn last frame (`turnAt(k)`: the picture's
 * turn at the share `k`, `poseTurnRad`) — then the largest share from `k0` (the one drawn last frame) that keeps it within (bisected; the turn's picture
 * grows with its share). ⭐ What the clock cannot count: the turn's END pose itself still moving under the rig's own lags (the camera's leash catching up
 * on the orbit, the calm's ease) while the turn runs — measured on `Scene_0bis`'s free-face exit, 6.66° in the frame after a drag. Even `k0` over it (the
 * end pose alone moving more): `k0` — the turn adds nothing that frame. `maxRad` not finite or not over 0 (no speed), or `kWant` not over `k0`: `kWant`.
 */
export function shownShareCap(k0: number, kWant: number, turnAt: (k: number) => number, maxRad: number): number {
  if (!(Number.isFinite(maxRad) && maxRad > 0) || !(kWant > k0)) return kWant;
  if (!(turnAt(kWant) > maxRad)) return kWant;
  if (turnAt(k0) > maxRad) return k0;
  let lo = k0;
  let hi = kWant;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (turnAt(m) > maxRad) hi = m;
    else lo = m;
  }
  return lo;
}

/** ⭐ (package A, the audit's blocker) the way out's progress whose smooth share (`seamOutShare`) is `k` (0 … 1): the smoothstep's inverse. */
export function seamOutShareInv(k: number): number {
  const y = Number.isFinite(k) ? Math.min(1, Math.max(0, k)) : 1;
  return 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3);
}

/** ⭐ (package A) under this angle two square normals are one (the gizmo's hold's own tie, `squareTurning`'s half degree) */
export const SQUARE_SAME_RAD = (0.5 * Math.PI) / 180;

/**
 * ⭐⭐⭐ (package A) WHILE A TURN RUNS THE SQUARE CAMERA STANDS AT ITS TARGET (normal and share) — the turn's end pose the final one, ONE clock. A change of
 * that target while the turn runs (the gizmo free: the finger-paced entry, the way out — a new face's normal, or the share's target switched) is a change
 * of frame: the turn RESTARTED from the pose shown. Not at a turn just started (`read` false — its ease not read yet: the snap is that turn's own), nor
 * with no square normal yet.
 */
export function squareRestarts(read: boolean, n: Vec3 | null, target: Vec3 | null, q: number, qTarget: number): boolean {
  if (!read || n === null) return false;
  if (Math.abs(q - qTarget) > 1e-9) return true;
  if (target === null) return false;
  return dot(n, target) < Math.cos(SQUARE_SAME_RAD);
}

/** ⭐⭐⭐ THE TILT LEFT AT ONCE: the place off the tilted facet (`onFacet` false) or the tilt turned off (`off`) — ⛔ a roll back inside F first. */
export function tiltLeavesNow(onFacet: boolean, off: boolean): boolean {
  return !onFacet || off;
}
