/**
 * The 3-vector and quaternion arithmetic the core needs. ⛔ Plain data, no engine
 * types — this file is why `src/core` can be tested headlessly and ported.
 *
 * ⛔⛔ EVERY QUATERNION LEAVING THIS MODULE IS CANONICALISED TO `w >= 0`.
 * `q` and `-q` are the SAME rotation, and the previous project lost a day to that:
 * a least-squares fit returned whichever sign its eigenvector carried, a 15° turn
 * read as −345°, and a correction ran at full strength on gestures that must
 * receive none. It survived every suite because the suite's own helper knew about
 * the double cover and never fed one IN.
 */

export type Vec3 = readonly [number, number, number];
/** `[w, x, y, z]`. */
export type Quat = readonly [number, number, number, number];

export const IDENTITY: Quat = [1, 0, 0, 0];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const length = (a: Vec3): number => Math.sqrt(dot(a, a));

/** `null` when the vector is too short to have a direction. Never a silent zero. */
export function normalize(a: Vec3): Vec3 | null {
  const n = length(a);
  if (n < 1e-12) return null;
  return [a[0] / n, a[1] / n, a[2] / n];
}

/** ⛔ `w >= 0`. See the module header: this is load-bearing, not cosmetic. */
export function canon(q: Quat): Quat {
  return q[0] >= 0 ? q : [-q[0], -q[1], -q[2], -q[3]];
}

/** Apply `a`, then `b`. ⚠ Left-multiplication: both are world-frame rotations. */
export function qmul(b: Quat, a: Quat): Quat {
  const [w1, x1, y1, z1] = b;
  const [w2, x2, y2, z2] = a;
  return canon([
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
  ]);
}

export const qconj = (q: Quat): Quat => [q[0], -q[1], -q[2], -q[3]];

export function qFromAxisAngle(axis: Vec3, radians: number): Quat {
  const u = normalize(axis);
  if (!u) return IDENTITY;
  const h = radians / 2;
  const s = Math.sin(h);
  return canon([Math.cos(h), u[0] * s, u[1] * s, u[2] * s]);
}

export function qRotate(q: Quat, v: Vec3): Vec3 {
  const [w, x, y, z] = q;
  const u: Vec3 = [x, y, z];
  const uv = cross(u, v);
  const uuv = cross(u, uv);
  return add(v, add(scale(uv, 2 * w), scale(uuv, 2)));
}

/** Total rotation magnitude in radians. Stable near identity. */
export function qAngle(q: Quat): number {
  const [w, x, y, z] = canon(q);
  return 2 * Math.atan2(Math.sqrt(x * x + y * y + z * z), w);
}

/**
 * The minimal (SWING) rotation taking `from` onto `to`.
 *
 * ⚠ The antiparallel case is a real input, not an edge case to ignore: a mate is
 * anti-parallel by definition, so this runs on nearly-opposite vectors constantly.
 * Any perpendicular axis is correct there, and one is chosen deterministically so
 * the result does not flicker between frames.
 */
export function shortestArc(from: Vec3, to: Vec3): Quat {
  const a = normalize(from);
  const b = normalize(to);
  if (!a || !b) return IDENTITY;
  const d = Math.max(-1, Math.min(1, dot(a, b)));
  if (d > 1 - 1e-9) return IDENTITY;
  if (d < -1 + 1e-9) {
    // Antiparallel: pick the most stable perpendicular, deterministically.
    const seed: Vec3 = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const axis = normalize(cross(a, seed)) ?? ([0, 1, 0] as Vec3);
    return qFromAxisAngle(axis, Math.PI);
  }
  const axis = cross(a, b);
  return qFromAxisAngle(axis, Math.acos(d));
}
