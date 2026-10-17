/**
 * ⭐⭐⭐ prototype — **THE SLIDE VIEW'S ANGLE BETWEEN RINGS 2 AND 3, THE CAMERA ALWAYS ON THE GIZMO** (2026-10-17, the owner: *"Modify the 2D curve as well
 * as the position of the rings so that during the travel between the 2nd ring and the 3rd ring the camera positions itself so that the view is nearly
 * isometric (i.e. same nearest-corner-with-gravity-direction-aligned-with-screen-vertical-direction isometric view as during the slide,)"* → after two
 * builds: *"The camera should be focused on the gizmo during the ring 1 and ring 4 travel"* → *"camera always aims at the gizmo, position the ring 2 and
 * ring 3 so that the camera ends up in the semi-isometric view during the travel of the piece between ring 2 and ring 3. Avoid S-shape travels of the
 * piece during the whole travel. The key is positioning the ring 2 and ring 3 to match the semi-isometric view during the waist travel."*).
 *
 * ⭐ The camera stays the orbit's everywhere — behind the piece, aimed at the GIZMO. Rings 2 and 3 stand at the slide view's tilt: their height
 * `±r·√2` (`isoWaistHeightM`), so the direction to them from the gizmo is 54.7° off the face's normal — 35.3° off the face, the isometric corner's tilt
 * (`Scene_1`: ±0.127 m at r 0.09). Arriving at ring 2 the camera behind the piece is already at that angle — no arc. BETWEEN rings 2 and 3, with the gizmo
 * on a face, it HOLDS the angle and turns from ring 2's direction to ring 3's about the face's normal (`waistTurn`, smoothstep), still aimed at the gizmo:
 * the turn starts and ends exactly on the camera's own directions at the rings — continuous, no S; the piece drifts ≤ 3.3° on the screen (computed), its
 * sideways part being the camera's yaw offset (semi-isometric: the tilt is the corner's, not its 45° across). ⛔ Deleted: the slide view latched all along
 * the curve aimed at the PIECE (the assembly off the screen far out, a jump at max distance), its 12 mm arc (an S), the keep-corner slider.
 * ⭐ Since: the hold only BEYOND A CONE of the face's normal (`waistConeWeight`), on the PIECE'S side of the face (`waistHoldDirection`), turned the way
 * the camera's own path turns (`waistTurn`'s `path`), evaluated on each end of a gizmo change and blended (`input/camera_frame.ts`).
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";
import { fourRingLayout } from "./orbit";
import type { Vec3 } from "../core/vec";

const unit = (a: Vec3): Vec3 | null => {
  const n = Math.hypot(a[0], a[1], a[2]);
  return n > 1e-12 ? [a[0] / n, a[1] / n, a[2] / n] : null;
};
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** ⭐ The smoothstep on [0, 1] (clamped) — the one home of the orbit rig's and the waist's easing. */
export function smoothstep01(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}
const smooth = smoothstep01;
/** ⭐ The great-circle step from unit `a` toward unit `b` by `t` (opposite: `b` past halfway). */
const slerpUnit = (a: Vec3, b: Vec3, t: number): Vec3 => {
  const th = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  const sa = Math.sin(th);
  if (sa < 1e-9) return t < 0.5 ? a : b;
  const w1 = Math.sin(th * (1 - t)) / sa;
  const w2 = Math.sin(th * t) / sa;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2];
};

/** ⭐ The height of rings 2 and 3 for a ring radius `r`: `r·√2` — the direction to them 54.7° off the face's normal, the isometric corner's tilt. */
export function isoWaistHeightM(r: number): number {
  return r * Math.SQRT2;
}

/** ⭐ The ring parameters of rings 2 (higher `v`) and 3 (numbered from the top). */
export function waistRings(cfg: GestureConfig): { v2: number; v3: number } {
  if (cfg.orbitLowerRingOn !== 1) return { v2: 0.5, v3: 0 };
  const f = fourRingLayout(cfg);
  return { v2: f.knots[2]! / f.total, v3: f.knots[1]! / f.total };
}

/** ⭐ How far between rings 2 and 3 the ring parameter `v` is (0 at ring 2, 1 at ring 3, smoothstep); `null` outside them. */
export function waistShare(cfg: GestureConfig, v: number): number | null {
  const { v2, v3 } = waistRings(cfg);
  if (!(v <= v2 && v >= v3) || !(v2 > v3)) return null;
  return smooth((v2 - v) / (v2 - v3));
}

/**
 * ⭐⭐⭐ The camera's direction between rings 2 and 3: from `d2` (its direction at ring 2) to `d3` (at ring 3), its TILT off the face (normal `n`) blended
 * and its heading round the normal turned the way the camera's own PATH turns (`path`: its directions from ring 2 to ring 3, `d2` first, `d3` last —
 * the turn summed step by step), else the short way — half a round the way `prefer` lies (the camera's yaw offset side). At `share` 0 exactly `d2`,
 * at 1 exactly `d3`. ⛔ (2026-10-17, the Fable audit's A3) the short way only: on a face tilted 22°–35° the ends lie half a round apart with dx behind the
 * face, and the way flipped with the offsets' residual — 110° of camera in one 0.05° step of dx.
 */
export function waistTurn(n0: Vec3, d2: Vec3, d3: Vec3, share: number, prefer: Vec3 | null, midTilt?: number, path?: readonly Vec3[]): Vec3 {
  const n = unit(n0);
  const a = unit(d2);
  const b = unit(d3);
  if (n === null || a === null || b === null) return d2;
  const flat = (d: Vec3): Vec3 | null => {
    const k = dot(d, n);
    return unit([d[0] - k * n[0], d[1] - k * n[1], d[2] - k * n[2]]);
  };
  const u = flat(a);
  const fb = flat(b);
  // ⛔ (the Fable audit's A7) a hard switch at share 0.5 when a ring direction lay along the normal
  if (u === null || fb === null) return slerpUnit(a, b, Math.min(1, Math.max(0, share)));
  const w = cross(n, u);
  const tA = Math.asin(Math.max(-1, Math.min(1, dot(a, n))));
  const tB = Math.asin(Math.max(-1, Math.min(1, dot(b, n))));
  let az = Math.atan2(dot(fb, w), dot(fb, u));
  const along = path === undefined ? null : pathTurn(path, flat, n);
  if (along !== null) az = along;
  else if (Math.abs(Math.abs(az) - Math.PI) < 1e-6) {
    const p = prefer === null ? null : flat(prefer);
    az = p !== null && dot(p, w) < 0 ? -Math.PI : Math.PI;
  }
  const s = Math.min(1, Math.max(0, share));
  // ⭐ (2026-10-17) with `midTilt`, the tilt reaches it halfway (a bump, nothing at either ring — so still exactly `d2` and `d3` there)
  const lin = tA + (tB - tA) * s;
  const t = midTilt === undefined ? lin : lin + (midTilt - lin) * 4 * s * (1 - s);
  const z = az * s;
  const c = Math.cos(t);
  return [Math.sin(t) * n[0] + c * (Math.cos(z) * u[0] + Math.sin(z) * w[0]), Math.sin(t) * n[1] + c * (Math.cos(z) * u[1] + Math.sin(z) * w[1]), Math.sin(t) * n[2] + c * (Math.cos(z) * u[2] + Math.sin(z) * w[2])];
}

/** ⭐ The turn about `n` along `path` (flattened by `flat`), summed step by step; `null` if a step passes too near the normal (no heading to read). */
function pathTurn(path: readonly Vec3[], flat: (d: Vec3) => Vec3 | null, n: Vec3): number | null {
  if (path.length < 2) return null;
  let prev: Vec3 | null = null;
  let sum = 0;
  for (const d of path) {
    if (Math.hypot(d[0], d[1], d[2]) < 1e-12 || Math.abs(dot(unit(d)!, n)) > 0.995) return null;
    const f = flat(d);
    if (f === null) return null;
    if (prev !== null) sum += Math.atan2(dot(cross(prev, f), n), dot(prev, f));
    prev = f;
  }
  return sum;
}

/**
 * ⭐⭐ (2026-10-17, the Fable audit's A3) the hold's weight by how far ring 2's and ring 3's directions (`d2`, `d3`) stand off the face's normal `n`
 * (either way): full beyond ~26° (`|n·d|` ≤ 0.9), none within ~14° (0.97) — at the normal the turn about it has no heading to read, and the camera
 * already sees the face square there (⛔ on a face tilted 22°–35°, ring 3 fell on the normal with dx behind the face: 110° of camera in one 0.05° of dx).
 */
export function waistPoleFade(n0: Vec3, d2: Vec3, d3: Vec3): number {
  const n = unit(n0);
  const a = unit(d2);
  const b = unit(d3);
  if (n === null || a === null || b === null) return 0;
  return smooth((POLE_NONE - Math.max(Math.abs(dot(a, n)), Math.abs(dot(b, n)))) / (POLE_NONE - POLE_FULL));
}
const POLE_FULL = 0.9;
const POLE_NONE = 0.97;

/** ⭐ (2026-10-17) the side `waistTurn` falls back to: the camera's yaw-offset side of the rings' heading at the orbit's yaw (`beta`: the rig's). */
export function waistPrefer(cfg: GestureConfig, yaw: number, beta: number): Vec3 {
  const side = (cfg.cameraYawOffsetDeg >= 0 ? 1 : -1) * (Math.PI / 2);
  return [Math.cos(yaw + beta + side), 0, Math.sin(yaw + beta + side)];
}

/** ⭐ The isometric corner's tilt off the face: 35.26° (`asin(1/√3)`). */
export const ISO_TILT_RAD = Math.asin(1 / Math.sqrt(3));

/** ⭐ The band past the cone over which the hold blends in (°). */
export const WAIST_CONE_BAND_DEG = 10;

/**
 * ⭐⭐⭐ (2026-10-17, the owner: *"I think we need to trigger the semi-isometric view during ring 2 and 3 travel only if the normal of the gizmo-supporting face is beyond a certain cone vs. the orientation of the camera view"* → *"build"*) — **THE HOLD ONLY BEYOND A CONE**: its weight from the angle between the camera's direction halfway between
 * rings 2 and 3 without the hold (`nYaw` — the curve's halfway direction: the face's normal at the yaw the gizmo was set, swung by dx) and the face's
 * normal as TAPPED (`n0`): none within `coneDeg` (the camera looks at the face — no need), full `WAIST_CONE_BAND_DEG` past it (it sees the face nearly
 * edge-on — the hold gives a better view of the face and its coplanars), smoothstep between. Right after a tap (no dx) the halfway direction IS the
 * face's normal: no hold; a level face is turned about by dx: never.
 */
export function waistConeWeight(nYaw: Vec3, n0: Vec3, coneDeg: number): number {
  const a = unit(nYaw);
  const b = unit(n0);
  if (a === null || b === null) return 0;
  // ⭐⭐ (2026-10-17, the owner: *"in case the hosting face is vertical, if I orbit dy to approach from behind the face, there are two discontinuities during the travel"*) — TWO-SIDED: facing the face's back is like facing its front (no hold — nothing of the face to see better)
  const deg = (Math.acos(Math.min(1, Math.abs(dot(a, b)))) * 180) / Math.PI;
  return smooth((deg - coneDeg) / WAIST_CONE_BAND_DEG);
}

/** ⭐ (2026-10-17) the least height over the real face a view direction is kept at (sin ≈ 10°). */
export const FRONT_MIN = 0.17;

/**
 * ⭐⭐⭐ (2026-10-17, the owner: *"if the hosting face is vertical and the travel starts with a camera view close to the edge of the hosting face, the
 * semi-isometric view can push the camera on the other side of the hosting face from the piece"* → *"build 3"*) — a view direction kept IN FRONT of the
 * face as tapped (`n0`): one dipping below `FRONT_MIN` over it is tilted back to it, on the plane of it and `n0`.
 */
export function keepInFront(d: Vec3, n0: Vec3): Vec3 {
  const n = unit(n0);
  if (n === null) return d;
  const k = dot(d, n);
  if (k >= FRONT_MIN) return d;
  const flat = unit([d[0] - k * n[0], d[1] - k * n[1], d[2] - k * n[2]]);
  if (flat === null) return d;
  const c = Math.sqrt(1 - FRONT_MIN * FRONT_MIN);
  return [flat[0] * c + n[0] * FRONT_MIN, flat[1] * c + n[1] * FRONT_MIN, flat[2] * c + n[2] * FRONT_MIN];
}

/** ⭐ How far past edge-on the PIECE'S SIDE of the face counts fully (the side's sign faded over it): sin ≈ 6° (⛔ 17°: the owner's own case — the face
 * edge-on to the view — got no lift at all, 20° at 10° off; the Fable audit's A4, *"narrow it"*). */
export const SIDE_SOFT = 0.1;

/**
 * ⭐⭐⭐ (2026-10-17, the owner: *"in case the hosting face is vertical, if I orbit dy to approach from behind the face, there are two discontinuities during the travel"*) — **THE HOLD'S DIRECTION**: turned from `d2` to `d3` about the face's normal ON THE PIECE'S SIDE (the side
 * the curve's halfway direction `nYaw` is on — ⛔ always the front: a camera behind the face was yanked to the front at ring 2 and let go at ring 3, 24°
 * and 38° of roll), its tilt reaching the slide view's 35.3° halfway, and kept ~10° over the face on that side — both FADED: by the bump `4s(1−s)` (nothing
 * at either ring, so exactly `d2` and `d3` there) and by how clearly the curve is on one side (`SIDE_SOFT` — nothing edge-on, where dx switches the side).
 */
export function waistHoldDirection(nYaw: Vec3, n0: Vec3, d2: Vec3, d3: Vec3, share: number, prefer: Vec3 | null, path?: readonly Vec3[]): Vec3 {
  const a = unit(nYaw);
  const b = unit(n0);
  if (a === null || b === null) return waistTurn(nYaw, d2, d3, share, prefer, undefined, path);
  const k = dot(a, b);
  const sideSign = k >= 0 ? 1 : -1;
  const nS: Vec3 = [b[0] * sideSign, b[1] * sideSign, b[2] * sideSign];
  const soft = Math.min(1, Math.abs(k) / SIDE_SOFT);
  const dir = waistTurn(nS, d2, d3, share, prefer, ISO_TILT_RAD * soft, path);
  const s = Math.min(1, Math.max(0, share));
  const g = 4 * s * (1 - s) * soft;
  if (!(g > 0)) return dir;
  const kept = keepInFront(dir, nS);
  if (kept === dir) return dir;
  // the guard faded in: a great-circle step from the turned direction toward the kept one
  const c = Math.max(-1, Math.min(1, dot(dir, kept)));
  const th = Math.acos(c);
  if (th < 1e-9) return dir;
  const t = th * g;
  const sa = Math.sin(th);
  const w1 = Math.sin(th - t) / sa;
  const w2 = Math.sin(t) / sa;
  return [dir[0] * w1 + kept[0] * w2, dir[1] * w1 + kept[1] * w2, dir[2] * w1 + kept[2] * w2];
}
