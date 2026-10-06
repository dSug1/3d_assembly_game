/**
 * ⭐⭐⭐ prototype — **THE CAMERA'S APPROACH PATH** (`Claude/40_RENDER_SCENE/spec/CAMERA_APPROACH_PATH.md`; the owner, 2026-10-06, agreed).
 * Once latched (the resting-face alignment beyond the band's start), while the orbited piece is inside the band — 2.7 → 2.4 → 2.1 → 1.8 m
 * from the orbit centre — the camera leaves its normal pose: up ABOVE the piece, then to its RIGHT, then back, **as a function of the
 * piece's distance alone** (so reversing `dy` reverses it exactly). It keeps its distance to the piece and always looks at the orbit centre;
 * the angles are clamped to what keeps the piece in the frame (§4).
 *
 * ⛔ ENGINE-FREE.
 */
import { add, cross, dot, length, normalize, scale, sub, type Vec3 } from "../core/vec";

/** ⭐ The band's four distances, metres: the start, ABOVE, RIGHT, the end (decreasing). */
export interface PathBand {
  readonly startM: number;
  readonly aboveM: number;
  readonly rightM: number;
  readonly endM: number;
}

/**
 * ⭐ Where the piece's distance `d` puts the path: `t` from 0 (the start) through 1 (ABOVE) and 2 (RIGHT) to 3 (the end), each segment
 * linear in `d`. `null` outside the band — the camera is today's there.
 */
export function pathParam(d: number, b: PathBand): number | null {
  if (!(d <= b.startM && d >= b.endM)) return null;
  if (d >= b.aboveM) return (b.startM - d) / Math.max(1e-9, b.startM - b.aboveM);
  if (d >= b.rightM) return 1 + (b.aboveM - d) / Math.max(1e-9, b.aboveM - b.rightM);
  return 2 + (b.rightM - d) / Math.max(1e-9, b.rightM - b.endM);
}

/** ⭐ A uniform Catmull-Rom curve through four key values at t = 0, 1, 2, 3 (the ends repeated) — smooth, and never at rest at a key. */
export function catmullRom4(k: readonly [number, number, number, number], t: number): number {
  const u = Math.min(3, Math.max(0, t));
  const i = Math.min(2, Math.floor(u));
  const s = u - i;
  const p = (j: number): number => k[Math.min(3, Math.max(0, j))]!;
  const p0 = p(i - 1);
  const p1 = p(i);
  const p2 = p(i + 1);
  const p3 = p(i + 2);
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s);
}

/**
 * ⭐⭐ The path at `t`: the rise ABOVE the normal pose (degrees of elevation around the piece), the swing to the RIGHT (degrees of azimuth),
 * and `w` — how far the base pose has gone from the LIVE normal one (its leash, its yaw and pitch offsets) to the IDEAL one (straight behind
 * the piece, no offsets): 0 at the band's ends, 1 at ABOVE and RIGHT (*"If the camera is not on the existing rings, the yaw and pitch
 * offsets are ignored"* — faded, never switched).
 */
export function pathAngles(t: number, aboveDeg: number, rightDeg: number): { readonly upDeg: number; readonly rightDeg: number; readonly w: number } {
  return {
    upDeg: catmullRom4([0, aboveDeg, 0, 0], t),
    rightDeg: catmullRom4([0, 0, rightDeg, 0], t),
    w: Math.min(1, Math.max(0, catmullRom4([0, 1, 1, 0], t))),
  };
}

/** ⭐ A point AROUND the piece: its elevation and azimuth (radians) and its distance, in the frame `behind` / `right` / `up`. */
export interface AroundPiece {
  readonly elev: number;
  readonly azim: number;
  readonly r: number;
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
 * ⭐ Is the piece in the frame of a camera at `cam` LOOKING AT `centre`? — its direction inside `margin` of the half fields of view
 * (vertical `halfVRad`; horizontal from the aspect).
 */
export function pieceInFrame(cam: Vec3, centre: Vec3, piece: Vec3, halfVRad: number, aspect: number, margin: number, up: Vec3 = [0, 1, 0]): boolean {
  const f = normalize(sub(centre, cam));
  const q = normalize(sub(piece, cam));
  if (f === null || q === null) return false;
  const x = normalize(cross(f, up));
  if (x === null) return false;
  const u = cross(x, f);
  const fz = dot(q, f);
  if (fz <= 0) return false;
  const halfH = Math.atan(Math.tan(halfVRad) * aspect);
  return Math.abs(Math.atan2(dot(q, u), fz)) <= halfVRad * margin && Math.abs(Math.atan2(dot(q, x), fz)) <= halfH * margin;
}

/**
 * ⭐⭐ The path's camera position (Q3: *"clamp the angles to the reach at the current zoom"*): from the `base` angles, the rise and the swing
 * (degrees) applied, then scaled back toward the base — the largest share (to 1/64) keeping the piece in the frame. Returns the position
 * and the share applied.
 */
export function pathCamera(
  base: AroundPiece,
  upDeg: number,
  rightDeg: number,
  piece: Vec3,
  centre: Vec3,
  frame: { readonly behind: Vec3; readonly right: Vec3; readonly up: Vec3 },
  view: { readonly halfVRad: number; readonly aspect: number; readonly margin: number },
): { readonly at: Vec3; readonly share: number } {
  const D = Math.PI / 180;
  const at = (k: number): Vec3 => fromAround({ elev: base.elev + k * upDeg * D, azim: base.azim + k * rightDeg * D, r: base.r }, piece, frame);
  const ok = (k: number): boolean => pieceInFrame(at(k), centre, piece, view.halfVRad, view.aspect, view.margin, frame.up);
  if (ok(1)) return { at: at(1), share: 1 };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 6; i++) {
    const m = (lo + hi) / 2;
    if (ok(m)) lo = m;
    else hi = m;
  }
  return { at: at(lo), share: lo };
}
