/**
 * ⭐⭐⭐ prototype — **THE CAMERA'S APPROACH PATH** (`Claude/40_RENDER_SCENE/spec/CAMERA_APPROACH_PATH.md`; the owner, 2026-10-06).
 * Once latched (the resting-face alignment beyond the band's start), while the orbited piece comes IN toward the orbit centre through the
 * band — 2.7 → 2.2 → 1.7 → 1.2 m — the camera leaves its normal pose: to ABOVE the piece (a PLATEAU of 0.3 m around 2.2, the camera fixed
 * relative to the piece), to its RIGHT (a plateau around 1.7), and back. On the plateaus it LOOKS AT THE PIECE; at the band's ends, at the
 * orbit centre — the look point blends between the two with the pose. The camera keeps its distance to the piece. Pushed AWAY, the path
 * unlatches and the camera eases back to its normal pose (the caller's state; `pathFade`).
 * ⭐ ABOVE and RIGHT are the NORMAL camera's own poses relative to the piece (`ringRelativePose`) — ABOVE as when the piece enters the 2nd
 * ring, RIGHT as when it is between the 2nd and 3rd rings, swung 90° about the vertical to the latched side.
 * ⭐⭐ AMENDED 2026-10-06 (the owner: *"the camera movements are too abrupt. I want a curve transition which is as smooth as the transition
 * between the 1st and 2nd ring … Go 30 degrees from the vertical for the above and 30 degrees to the right for the right"*): the pose is the
 * RINGS' OWN CURVE through its keys — their monotone cubic (Fritsch–Carlson, `hermiteAt`) over the piece's distance, passing THROUGH ABOVE
 * and RIGHT without stopping (flat only where a number turns back), each transition spread over the whole gap (`pathCurve`); the owner:
 * *"the same type of transition as between 1st and 2 rings, with camera going above and to the right of the piece before resuming the normal
 * orbit course, starting from piece at 2.7 m"*. ABOVE 30° from the vertical, RIGHT 30° to the right.
 *
 * ⛔ ENGINE-FREE.
 */
import { add, cross, dot, length, normalize, scale, sub, type Vec3 } from "../core/vec";
import { cameraOffset, type CameraAngleOffset } from "./follow_camera";
import { hermiteAt, orbitOffset } from "./orbit";
import type { GestureConfig } from "./gestureConfig";

/** ⭐ The band: its start, the ABOVE and RIGHT milestones, its end (metres, decreasing), and the plateau's width around each milestone. */
export interface PathBand {
  readonly startM: number;
  readonly aboveM: number;
  readonly rightM: number;
  readonly endM: number;
  readonly plateauM: number;
}

/** ⭐ An ease in and out (smootherstep: zero speed AND zero acceleration at both ends — a plateau is entered and left without a kink). */
export function easeInOut(x: number): number {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
}

/**
 * ⭐ Where the piece's distance `d` is in the band — the HUD's stage: `t` from 0 (the band's start) to 1 (ABOVE), 2 (RIGHT), 3 (the end),
 * **exactly 1 on the ABOVE hold and exactly 2 on the RIGHT one**, linear in `d` between. `null` outside the band. ⛔ The camera's pose does
 * not read it (`pathCurve` does, from `d`).
 */
export function pathParam(d: number, b: PathBand): number | null {
  if (!(d <= b.startM && d >= b.endM)) return null;
  const h = b.plateauM / 2;
  const a1 = b.aboveM + h;
  const a2 = b.aboveM - h;
  const r1 = b.rightM + h;
  const r2 = b.rightM - h;
  const lin = (x: number): number => Math.min(1, Math.max(0, x));
  const eps = 1e-9;
  if (d >= a1 + eps) return lin((b.startM - d) / Math.max(1e-9, b.startM - a1));
  if (d >= a2 - eps) return 1;
  if (d >= r1 + eps) return 1 + lin((a2 - d) / Math.max(1e-9, a2 - r1));
  if (d >= r2 - eps) return 2;
  return 2 + lin((r2 - d) / Math.max(1e-9, r2 - b.endM));
}

/**
 * ⭐⭐ Fritsch–Carlson tangents for UNEVENLY spaced knots — the rings' rule (`orbit.ts`'s `evenTangents`) where the spacing differs: an
 * interior tangent is ZERO where the number turns back or stays (an extremum AT a key, a hold — never an overshoot between keys), else the
 * weighted harmonic mean of its two secants (Fritsch–Butland: never more than 3 × the shallower). ⭐ The END tangents are ZERO — the path
 * leaves the normal camera and rejoins it without a kink.
 */
export function unevenTangents(knots: readonly number[], ys: readonly number[]): number[] {
  const n = ys.length - 1;
  const h = Array.from({ length: n }, (_, k) => knots[k + 1]! - knots[k]!);
  const s = h.map((hk, k) => (ys[k + 1]! - ys[k]!) / hk);
  return ys.map((_, k) => {
    if (k === 0 || k === n) return 0;
    const a = s[k - 1]!;
    const b = s[k]!;
    if (!(a * b > 0)) return 0;
    const h0 = h[k - 1]!;
    const h1 = h[k]!;
    return (3 * (h0 + h1)) / ((2 * h1 + h0) / a + (h1 + 2 * h0) / b);
  });
}

/**
 * ⭐⭐⭐ THE PATH'S POSE at the piece's distance `d` (the owner, 2026-10-06: *"a curve transition which is as smooth as the transition between
 * the 1st and 2nd ring"*): each of the pose's four numbers on the rings' monotone cubic over `d` through its keys — the LIVE normal pose at
 * the band's start, ABOVE held over its plateau (if any), RIGHT held over its own, the live normal pose at the end — Fritsch–Carlson
 * (`unevenTangents`): with no plateau (the default) the camera passes THROUGH each key without stopping, flat only where a number turns
 * back (the climb at ABOVE, the swing to the right at RIGHT), and never beyond a key. `null` outside.
 */
export function pathCurve(d: number, b: PathBand, normal: PathPose, above: PathPose, right: PathPose): PathPose | null {
  if (!(d <= b.startM && d >= b.endM)) return null;
  const h = b.plateauM / 2;
  // ⭐ in INCREASING distance (the end first); a plateau of zero width is one knot, not two
  const keys: { x: number; p: PathPose }[] = [{ x: b.endM, p: normal }];
  const put = (x: number, p: PathPose): void => {
    if (x > keys[keys.length - 1]!.x + 1e-9) keys.push({ x, p });
  };
  put(b.rightM - h, right);
  put(b.rightM + h, right);
  put(b.aboveM - h, above);
  put(b.aboveM + h, above);
  put(b.startM, normal);
  // ⭐ exactly the key ON a hold — a plateau is CONSTANT, not the key plus a rounding
  for (let k = 0; k + 1 < keys.length; k++) if (keys[k]!.p === keys[k + 1]!.p && d >= keys[k]!.x && d <= keys[k + 1]!.x) return keys[k]!.p;
  const xs = keys.map((k) => k.x);
  const at = (f: (p: PathPose) => number): number => {
    const ys = keys.map((k) => f(k.p));
    return hermiteAt(xs, ys, unevenTangents(xs, ys), d);
  };
  return { elev: at((p) => p.elev), azim: at((p) => p.azim), r: at((p) => p.r), look: at((p) => p.look) };
}

/** ⭐ A camera pose relative to the piece: elevation and azimuth around it (radians, the piece's frame), its distance, and its LOOK — 0 the
 * orbit centre, 1 the piece. */
export interface AroundPiece {
  readonly elev: number;
  readonly azim: number;
  readonly r: number;
}
export interface PathPose extends AroundPiece {
  readonly look: number;
}

/** ⭐ The frame at the piece: `behind` (horizontal, from the centre out through the piece), `right` (the latched side), `up`. */
export function pieceFrame(centre: Vec3, piece: Vec3, side: 1 | -1, up: Vec3 = [0, 1, 0]): { readonly behind: Vec3; readonly right: Vec3; readonly up: Vec3 } | null {
  const v = sub(piece, centre);
  const behind = normalize(sub(v, scale(up, dot(v, up))));
  if (behind === null) return null;
  return { behind, right: scale(normalize(cross(up, behind))!, side), up };
}

/** ⭐ A camera position as angles around the piece. */
export function toAround(cam: Vec3, piece: Vec3, f: { readonly behind: Vec3; readonly right: Vec3; readonly up: Vec3 }): AroundPiece {
  const v = sub(cam, piece);
  const h = sub(v, scale(f.up, dot(v, f.up)));
  return { elev: Math.atan2(dot(v, f.up), length(h)), azim: Math.atan2(dot(h, f.right), dot(h, f.behind)), r: length(v) };
}

/** ⭐ …and back. */
export function fromAround(a: AroundPiece, piece: Vec3, f: { readonly behind: Vec3; readonly right: Vec3; readonly up: Vec3 }): Vec3 {
  const horiz = add(scale(f.behind, Math.cos(a.azim)), scale(f.right, Math.sin(a.azim)));
  return add(piece, scale(add(scale(horiz, Math.cos(a.elev)), scale(f.up, Math.sin(a.elev))), a.r));
}

/**
 * ⭐⭐ The NORMAL camera's pose relative to the piece with the piece at ring parameter `v` (the camera settled on it — no leash, no lag):
 * the piece where the rings put it, the camera where `cameraOffset` puts it (its ring pitch, the yaw and pitch offsets, the zoom's
 * distance), read as angles around the piece in the piece's own frame. ⭐ The frame turns with the yaw, so the pose does not depend on it.
 */
export function ringRelativePose(cfg: GestureConfig, v: number, gapM: number, off: CameraAngleOffset): AroundPiece | null {
  const box = orbitOffset(cfg, 0, v, 1).offsetM;
  const piece: Vec3 = [box[0], box[1], box[2]];
  const cam = cameraOffset(cfg, { yaw: 0, v }, piece, off, gapM);
  const f = pieceFrame([0, 0, 0], piece, 1);
  return f === null ? null : toAround(cam, piece, f);
}

/**
 * ⭐⭐ The ELEVATION around the piece that puts a camera `r` from it at the world height `camY` (the piece at `pieceY`) — the owner,
 * 2026-10-06: *"during the plateau 2, stay at the same height as at start of path"*, *"divide by two the increase of height between start
 * and plateau 1"*. ⛔ Out of reach (more than `r` above or below), held at ±`maxRad`.
 */
export function elevForHeight(camY: number, pieceY: number, r: number, maxRad = (85 * Math.PI) / 180): number {
  if (!(r > 0)) return 0;
  const s = Math.min(Math.sin(maxRad), Math.max(-Math.sin(maxRad), (camY - pieceY) / r));
  return Math.asin(s);
}

/** ⭐ A straight blend of two poses (`k` 0 → `a`, 1 → `b`). */
export function lerpPose(a: PathPose, b: PathPose, k: number): PathPose {
  // ⭐ exactly the key at the ends — a plateau is CONSTANT, not the key plus a rounding
  if (k <= 0) return a;
  if (k >= 1) return b;
  const m = (x: number, y: number): number => x + (y - x) * k;
  return { elev: m(a.elev, b.elev), azim: m(a.azim, b.azim), r: m(a.r, b.r), look: m(a.look, b.look) };
}

/**
 * ⭐ The UNLATCH's ease back (the owner, 2026-10-06: *"confirmed unlatch ease-back"*): from the pose the path had when the piece was pushed
 * away, to the live normal pose, over `ms` — eased in and out. `done` once there.
 */
export function pathFade(from: PathPose, normal: PathPose, elapsedMs: number, ms: number): { readonly pose: PathPose; readonly done: boolean } {
  const u = ms > 0 ? elapsedMs / ms : 1;
  return { pose: lerpPose(from, normal, easeInOut(u)), done: u >= 1 };
}

/** ⭐ Pushed AWAY from the centre: farther than the closest the piece has come since the latch, by more than `epsM` (the spring's noise). */
export function pushedAway(d: number, closestM: number, epsM: number): boolean {
  return d > closestM + epsM;
}

/**
 * ⭐⭐ prototype — **WHERE THE PINK RING IS, WHEN IT IS OFF THE SCREEN** (the owner, 2026-10-06: *"if the pink ring is beyond the screen during
 * the camera path, feature a half ring at the border of the screen in prolongation of which the pink ring would be"*). From the ring's
 * projected point (`px`, `py`, screen pixels; `behind` when it is behind the camera — its projection is then mirrored), the point ON THE
 * SCREEN'S BORDER in its direction from the screen's centre — a ring drawn there is cut by the border into a half ring. `null` when the
 * ring is on the screen.
 */
export function edgeMarker(px: number, py: number, behind: boolean, w: number, h: number): { readonly x: number; readonly y: number } | null {
  const cx = w / 2;
  const cy = h / 2;
  if (!behind && px >= 0 && px <= w && py >= 0 && py <= h) return null;
  let dx = px - cx;
  let dy = py - cy;
  if (behind) {
    dx = -dx;
    dy = -dy;
  }
  if (dx === 0 && dy === 0) dy = h; // straight behind: the bottom edge
  const k = Math.min(dx !== 0 ? cx / Math.abs(dx) : Infinity, dy !== 0 ? cy / Math.abs(dy) : Infinity);
  return { x: cx + dx * k, y: cy + dy * k };
}
