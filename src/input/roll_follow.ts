/**
 * ⭐⭐⭐ (2026-11-18, `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §12, package FO3) THE PICTURE A FOLLOWER OF THE LOGIC — the pure parts.
 *
 * * **The ghost**: the camera's pose the logic asks for this frame (every change of frame applied at once).
 * * **The framed line** (`framedLine`): through the piece and the camera's look point. A camera turned about it keeps both where they are on the glass
 *   (plain geometry: the only freedom left once two points are held on the glass). The two closer than `ROLL_LINE_MIN_M`: the view's own direction
 *   through the piece (O4).
 * * **The ghost's twist** (`twistAbout`): the rotation from last frame's ghost to this frame's, split in two about this frame's line (swing and twist —
 *   Shoemake, Graphics Gems IV, 1994): the SWING (about an axis square to the line: the orbit itself, shown at once); the TWIST, a turn about the line,
 *   signed, the short way.
 * * **The gap** (`gapTake`, `gapStep`): how far the picture is rolled back from the ghost. A twist adds to it (`gap − twist`, the short way); it closes to 0
 *   by the critically damped ease (its state the gap and its speed; its time `followMs`: ω = 2 / time — the closed form, exact at any frame rate; Game
 *   Programming Gems 4, 2004). Under `GAP_REST_DEG` and slower than `GAP_REST_DEG_S`: exactly 0.
 * * **The picture** (`poseRolled`): the ghost turned about the framed line by the gap. Gap 0: the ghost itself, the same object.
 *
 * ⛔ ENGINE-FREE. Rodrigues' formula, a quaternion's swing and twist, a critically damped spring — textbook, decades old; no licence, no patent.
 * ⚠ S0 (the shadow): computed and recorded, never drawn. The two defaults below become the sliders `rollFollowMs` and `freeTurnMaxDeg` at S1.
 */
import { cross, dot, type Vec3 } from "../core/vec";
import { rotateAbout, type CamPose } from "./orbit_tilt";

/** ⭐ the piece and the look point closer than this (m): the framed line is the view's own direction through the piece (O4) */
export const ROLL_LINE_MIN_M = 0.003;
/** ⭐ the follower's time (ms) — S0's default; S1's slider `rollFollowMs` (§12.4: 200) */
export const ROLL_FOLLOW_MS = 200;
/** ⭐ a change whose twist is this or more is today's timed turn (deg) — S0's default; S1's slider `freeTurnMaxDeg` (§12.4: 90) */
export const FREE_TURN_MAX_DEG = 90;
/** ⭐ the gap at rest: under this (deg) and slower than `GAP_REST_DEG_S` (deg a second) it is exactly 0 (R5) */
export const GAP_REST_DEG = 0.01;
export const GAP_REST_DEG_S = 0.01;

const DEG = Math.PI / 180;
const wrapPi = (a: number): number => {
  const w = Math.atan2(Math.sin(a), Math.cos(a));
  return w === -Math.PI ? Math.PI : w;
};
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3, fb: Vec3): Vec3 => {
  const l = len(a);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : fb;
};

/** ⭐ The framed line: through `at` (the piece), along `dir` (unit, pointing away from the eye); `throughLook`: the look point is on it. */
export interface FramedLine {
  readonly at: Vec3;
  readonly dir: Vec3;
  readonly throughLook: boolean;
}

/** ⭐ The line through the piece and the pose's look point (O4: the two closer than `ROLL_LINE_MIN_M` — the view's direction through the piece). */
export function framedLine(pose: CamPose, piece: Vec3): FramedLine {
  const view = unit(sub(pose.look, pose.eye), [0, 0, 1]);
  const d = sub(piece, pose.look);
  if (len(d) < ROLL_LINE_MIN_M) return { at: piece, dir: view, throughLook: false };
  const u = unit(d, view);
  return { at: piece, dir: dot(u, view) < 0 ? [-u[0], -u[1], -u[2]] : u, throughLook: true };
}

/** ⭐ The camera's axes (rows): its view, its up squared to the view, their cross — any handedness, the same for every pose. */
export function poseAxes(pose: CamPose): readonly [Vec3, Vec3, Vec3] {
  const f = unit(sub(pose.look, pose.eye), [0, 0, 1]);
  const k = dot(pose.up, f);
  const uRaw: Vec3 = [pose.up[0] - k * f[0], pose.up[1] - k * f[1], pose.up[2] - k * f[2]];
  const u = unit(uRaw, Math.abs(f[1]) < 0.9 ? unit(sub([0, 1, 0], [f[0] * f[1], f[1] * f[1], f[2] * f[1]]), [1, 0, 0]) : [1, 0, 0]);
  return [f, u, cross(f, u)];
}

type M3 = readonly [Vec3, Vec3, Vec3];
/** R = Σ b1ᵢ ⊗ b0ᵢ: the rotation taking the axes `b0` onto `b1` (rows of the result) */
function relRot(b0: M3, b1: M3): M3 {
  const r = (i: 0 | 1 | 2, j: 0 | 1 | 2): number => b1[0][i] * b0[0][j] + b1[1][i] * b0[1][j] + b1[2][i] * b0[2][j];
  return [
    [r(0, 0), r(0, 1), r(0, 2)],
    [r(1, 0), r(1, 1), r(1, 2)],
    [r(2, 0), r(2, 1), r(2, 2)],
  ];
}
/** a rotation's quaternion [w, x, y, z] (Shepperd's method) */
function quatOf(R: M3): readonly [number, number, number, number] {
  const t = R[0][0] + R[1][1] + R[2][2];
  if (t > 0) {
    const s = Math.sqrt(t + 1) * 2;
    return [0.25 * s, (R[2][1] - R[1][2]) / s, (R[0][2] - R[2][0]) / s, (R[1][0] - R[0][1]) / s];
  }
  if (R[0][0] > R[1][1] && R[0][0] > R[2][2]) {
    const s = Math.sqrt(1 + R[0][0] - R[1][1] - R[2][2]) * 2;
    return [(R[2][1] - R[1][2]) / s, 0.25 * s, (R[0][1] + R[1][0]) / s, (R[0][2] + R[2][0]) / s];
  }
  if (R[1][1] > R[2][2]) {
    const s = Math.sqrt(1 + R[1][1] - R[0][0] - R[2][2]) * 2;
    return [(R[0][2] - R[2][0]) / s, (R[0][1] + R[1][0]) / s, 0.25 * s, (R[1][2] + R[2][1]) / s];
  }
  const s = Math.sqrt(1 + R[2][2] - R[0][0] - R[1][1]) * 2;
  return [(R[1][0] - R[0][1]) / s, (R[0][2] + R[2][0]) / s, (R[1][2] + R[2][1]) / s, 0.25 * s];
}

/**
 * ⭐⭐⭐ THE GHOST'S TWIST between two poses (rad, (−π, π], the short way): the camera's rotation from `prev` to `next` split about this frame's line
 * `dir` (Shoemake's swing and twist: the rotation = the twist about `dir` · a swing about an axis square to `dir`) — the twist; a turn of the camera about
 * the line by +τ: `poseRolled(…, τ)`. Rolled back by it, the picture keeps no turn about the line (vectored). ⚠ (FO3 S0, `FAST_ORBIT.md` §13) not the
 * minimal rotation of last frame's line onto this one's first: the two agree when the line is fixed in the camera, and differ when the look point slides
 * on the glass (0.26° in a 5.7° turn) — that way left the picture a turn about the line.
 */
export function twistAbout(prev: CamPose, next: CamPose, dir: Vec3): number {
  const q = quatOf(relRot(poseAxes(prev), poseAxes(next)));
  const p = q[1] * dir[0] + q[2] * dir[1] + q[3] * dir[2];
  if (Math.abs(p) < 1e-15 && Math.abs(q[0]) < 1e-15) return 0;
  return wrapPi(2 * Math.atan2(p, q[0]));
}

/** ⭐ The pose turned by `angle` (rad) about the framed line — the piece and (on the line) the look point keep their places. `angle` 0: `pose` itself. */
export function poseRolled(pose: CamPose, line: FramedLine, angle: number): CamPose {
  if (angle === 0) return pose;
  const a = line.at;
  const k = line.dir;
  const eye = add(a, rotateAbout(sub(pose.eye, a), k, angle));
  const look = line.throughLook ? pose.look : add(a, rotateAbout(sub(pose.look, a), k, angle));
  return { eye, look, up: rotateAbout(pose.up, k, angle) };
}

/** ⭐ The follower's state: the gap (rad: how far the picture is rolled back from the ghost) and its speed (rad a second). */
export interface RollGap {
  readonly gap: number;
  readonly speed: number;
}
export const GAP_ZERO: RollGap = { gap: 0, speed: 0 };

/** ⭐ A twist taken by the gap: the picture holds, the gap grows by it the other way (the short way round); its speed kept (the newest target wins). */
export function gapTake(g: RollGap, twist: number): RollGap {
  if (twist === 0) return g;
  return { gap: wrapPi(g.gap - twist), speed: g.speed };
}

/** ⭐ One step of the gap toward 0 by the critically damped ease (exact over `dtMs`; ω = 2 / `followMs`); at rest (R5): exactly 0. */
export function gapStep(g: RollGap, dtMs: number, followMs: number): RollGap {
  if (g.gap === 0 && g.speed === 0) return g;
  if (!(dtMs > 0)) return g;
  if (!(followMs > 0)) return GAP_ZERO;
  const w = 2000 / followMs;
  const t = dtMs / 1000;
  const e = Math.exp(-w * t);
  const c = g.speed + w * g.gap;
  const gap = (g.gap + c * t) * e;
  const speed = (g.speed - w * c * t) * e;
  if (Math.abs(gap) < GAP_REST_DEG * DEG && Math.abs(speed) < GAP_REST_DEG_S * DEG) return GAP_ZERO;
  return { gap, speed };
}

/** ⭐ What a frame does to the gap: `TAKE` the ghost's twist (the gizmo free), `SKIP` it (a turn that stays draws the picture — a gap open goes on
 *  closing), `ZERO` (a turn that stays starts from the pose shown, or a reset: the gap 0, the follower idle — O5, O11). */
export type FollowMode = "TAKE" | "SKIP" | "ZERO";

/** ⭐ One frame of the follower: the gap stepped over `dtMs`, then this frame's twist taken (the newest target wins) — or skipped, or zeroed. */
export function followStep(g: RollGap, twist: number, dtMs: number, followMs: number, mode: FollowMode): RollGap {
  if (mode === "ZERO") return GAP_ZERO;
  const s = gapStep(g, dtMs, followMs);
  if (mode !== "TAKE") return s;
  const t = gapTake(s, twist);
  // ⭐ (FO3 S0, measured: the ghost at rest still reads a twist of 1e-16 – 1e-7 rad a frame, its own rounding) at rest after the take too: exactly 0 (R5)
  return Math.abs(t.gap) < GAP_REST_DEG * DEG && Math.abs(t.speed) < GAP_REST_DEG_S * DEG ? GAP_ZERO : t;
}

/** ⭐ A point's place on the glass (x, y in half-glasses, the centre 0) seen from a pose: `fovY` the vertical field (rad), `aspect` width / height. */
export function onGlass(pose: CamPose, p: Vec3, fovY: number, aspect: number): readonly [number, number] {
  const [f, u, s] = poseAxes(pose);
  const d = sub(p, pose.eye);
  const z = dot(d, f);
  const t = Math.tan(fovY / 2);
  return [dot(d, s) / (z * t * aspect), dot(d, u) / (z * t)];
}
