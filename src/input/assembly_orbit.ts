/**
 * ⭐⭐⭐ prototype (2026-10-28, the owner: *"the piece orbit on dx yaw and dy pitch inputs. The yaw is a full circle, the pitch is half a circle from -90
 * degrees to + 90 degrees … The double finger or shift + click dy brings the piece towards the gizmo … The gizmo is only used for the approach … The orbit
 * is done around the center of the assembly … The gizmo is positioned at the intersection of the sections of the assembly created by the pitch plane and
 * yaw plane at the actual position of the piece orbit … The approach of the piece towards the gizmo is the same as currently built (2D curves …)"* → the
 * answers: the gizmo on the ray toward the centre, wherever the piece is; straight in, the along-the-curve path kept; to the contact, in and back; the
 * gizmo and its face LOCKED when close; pitch ±85° (⭐ ±90° since 2026-10-29); the camera looking at the centre far out, at the gizmo as the approach goes in; two fingers' dx and
 * Shift + dx nothing; the inertia on the orbit and the approach) — **THE ORBIT AROUND THE ASSEMBLY**:
 * * dx turns the YAW (the full circle), dy the PITCH (`pitchOfV`: the orbit's ring parameter `v` read as −90° … +90°);
 * * the piece's direction `u` (`orbitDir`) from the assembly's CENTRE (fixed at the boot); the GIZMO where the ray from the piece toward the centre first
 *   meets the assembly (the render casts it); the piece ON that ray, at the APPROACH's distance from the gizmo (`approachDistance`: the 2D curve's distance
 *   from ring 1 to the waist, then straight to the contact) — so far out it orbits the centre, close in it hugs the assembly's shape;
 * * CLOSE IN (`nextLock`) the gizmo and its face LOCK: the piece then turns about the locked gizmo (the same formula, the gizmo held — continuous at the
 *   lock), kept within `LOCK_CONE_RAD` of the face's normal (`coneClamp`);
 * * the gizmo's FACE switches at an edge only once the ray lands past it by a margin (`faceSwitches`), so the quads do not flicker on an edge.
 * ⛔ ENGINE-FREE. Spherical angles, a ray, hysteresis — textbook; no licence, no patent.
 */
import type { GestureConfig } from "./gestureConfig";
import { orbitOffset } from "./orbit";
import { waistV } from "./orbit_rig";
import { smoothstep01 as smooth } from "./waist_view";
import { cross, dot, normalize, qFromAxisAngle, qRotate, type Vec3 } from "../core/vec";

/**
 * ⭐ The pitch's reach either side of the horizon — ±90° (the owner, 2026-10-29: *"can you increase the pitch to -90 +90 degrees ?"* → *"build it with the
 * clamp and ±90°"*; ⛔ ±85°: never the vertical): straight above / under the centre at the ends, the camera's heading the orbit's yaw there, never over.
 */
export const ORBIT_PITCH_MAX_RAD = Math.PI / 2;

/** ⭐ The orbit's ring parameter `v` (0 … 1) read as the PITCH: −90° at 0, level at ½, +90° at 1. */
export function pitchOfV(v: number): number {
  return (2 * Math.min(1, Math.max(0, v)) - 1) * ORBIT_PITCH_MAX_RAD;
}

/** ⭐ …and back. */
export function vOfPitch(p: number): number {
  return Math.min(1, Math.max(0, (p / ORBIT_PITCH_MAX_RAD + 1) / 2));
}

/** ⭐ The piece's direction from the centre at the orbit's `yaw` and `v` (the orbit's own azimuth convention: x = cos, z = sin). */
export function orbitDir(yaw: number, v: number): Vec3 {
  const p = pitchOfV(v);
  return [Math.cos(p) * Math.cos(yaw), Math.sin(p), Math.cos(p) * Math.sin(yaw)];
}

/** ⭐ The approach coordinate's floor: the CONTACT — below the waist (`waistV`) by this much, the last stretch straight to it. */
export const APPROACH_CONTACT_SPAN = 0.05;

/** ⭐ The approach coordinate's range: 1 far out (ring 1's distance), `waistV` at the waist, the floor at the contact. */
export function approachRange(cfg: GestureConfig): { readonly min: number; readonly waist: number; readonly max: number } {
  const w = waistV(cfg);
  return { min: w - APPROACH_CONTACT_SPAN, waist: w, max: 1 };
}

/**
 * ⭐⭐ THE APPROACH'S DISTANCE from the gizmo at the approach coordinate `a`: from 1 (ring 1's distance — the far orbit) down to the waist, the 2D curve's
 * own distance from the gizmo (`orbitOffset` — the same for a vertical face's curve and a horizontal face's, a rotation); below the waist, straight to 0
 * (the contact). The piece goes STRAIGHT IN along its ray (the owner: *"make it straight in"*).
 */
export function approachDistance(cfg: GestureConfig, a: number): number {
  const r = approachRange(cfg);
  const x = Math.min(r.max, Math.max(r.min, a));
  const dist = (v: number): number => orbitOffset(cfg, 0, v, 1).radiusM;
  if (x >= r.waist) return dist(x);
  return (dist(r.waist) * (x - r.min)) / (r.waist - r.min);
}

/** ⭐ The far orbit's distance from the gizmo (ring 1's — one value for both curves, the owner's 5). */
export function farDistance(cfg: GestureConfig): number {
  return approachDistance(cfg, 1);
}

/**
 * ⭐⭐ THE LOCK: on when the piece comes inside the assembly's bounding sphere (closer to the centre than `assemblyRadiusM`, half its largest dimension —
 * the orbit circle smaller than the assembly) or within `lockDistM` of the gizmo; off only past both by a margin (×1.25 the distance, ×1.05 the radius).
 */
export function nextLock(locked: boolean, toCentreM: number, toGizmoM: number, assemblyRadiusM: number, lockDistM: number): boolean {
  if (!locked) return toCentreM < assemblyRadiusM || toGizmoM < lockDistM;
  return !(toCentreM > assemblyRadiusM * 1.05 && toGizmoM > lockDistM * 1.25);
}

/** ⭐ Locked, the piece's direction from the gizmo kept within this of the face's normal (it never goes behind the face, into the assembly). */
export const LOCK_CONE_RAD = (80 * Math.PI) / 180;

/** ⭐ `u` turned toward `n` (both unit) until within `maxRad` of it; within already, `u` itself. */
export function coneClamp(u: Vec3, n: Vec3, maxRad: number = LOCK_CONE_RAD): Vec3 {
  const c = Math.max(-1, Math.min(1, dot(u, n)));
  const a = Math.acos(c);
  if (a <= maxRad) return u;
  const axis = normalize(cross(n, u)) ?? normalize(cross(n, [0, 1, 0])) ?? [1, 0, 0];
  return qRotate(qFromAxisAngle(axis, maxRad), n);
}

/** ⭐ The angle between `u` and `n` (unit). */
export function angleTo(u: Vec3, n: Vec3): number {
  return Math.acos(Math.max(-1, Math.min(1, dot(u, n))));
}

/**
 * ⭐⭐ THE FACE AT AN EDGE: does the gizmo take the face the ray now hits (`hitNormal`, at `hitPoint`) over the one it has (`curNormal`, through `curPoint`)?
 * The same direction (within 1° — a coplanar neighbour): at once; another: only once the hit lies `marginM` off the current face's plane — past the edge by
 * that much (a step in depth: at once, it is far off the plane). None yet: at once.
 */
export function faceSwitches(curNormal: Vec3 | null, curPoint: Vec3 | null, hitNormal: Vec3, hitPoint: Vec3, marginM: number): boolean {
  if (curNormal === null || curPoint === null) return true;
  if (dot(curNormal, hitNormal) > Math.cos(Math.PI / 180)) return true;
  const off = [hitPoint[0] - curPoint[0], hitPoint[1] - curPoint[1], hitPoint[2] - curPoint[2]] as Vec3;
  return Math.abs(dot(off, curNormal)) > marginM;
}

/**
 * ⭐ The rays that find the gizmo: the one along `−u` and four beside it `coverM` away (square to it) — the outermost hit wins, so a gap narrower than that
 * between the parts (the painting's cores) is bridged: the surface reads continuous.
 */
export function rayOffsets(u: Vec3, coverM: number): Vec3[] {
  const a = normalize(cross(u, [0, 1, 0])) ?? normalize(cross(u, [1, 0, 0])) ?? [1, 0, 0];
  const b = normalize(cross(u, a)) ?? [0, 0, 1];
  return [
    [0, 0, 0],
    [a[0] * coverM, a[1] * coverM, a[2] * coverM],
    [-a[0] * coverM, -a[1] * coverM, -a[2] * coverM],
    [b[0] * coverM, b[1] * coverM, b[2] * coverM],
    [-b[0] * coverM, -b[1] * coverM, -b[2] * coverM],
  ];
}

/**
 * ⭐ How far the camera looks at the gizmo rather than the centre (0 … 1): 0 far out (at ring 1's distance), 1 at the lock's distance (smoothstep between);
 * locked, 1.
 */
export function lookShare(distM: number, farM: number, lockDistM: number, locked: boolean): number {
  if (locked) return 1;
  if (!(farM > lockDistM)) return 1;
  return smooth((farM - distM) / (farM - lockDistM));
}

/** ⭐ The approach step a millimetre of the two fingers' (or Shift + drag's) dy buys: finger UP brings the piece IN (the coordinate down). */
export function approachStep(a: number, dyMm: number, perMm: number, cfg: GestureConfig): number {
  const r = approachRange(cfg);
  return Math.min(r.max, Math.max(r.min, a + dyMm * perMm));
}

/** ⭐ One frame of an ease of a point toward another (`1 − exp(−dt/τ)`), landing on it within 0.1 mm. */
export function easePoint(cur: Vec3, target: Vec3, dtMs: number, tauMs: number): Vec3 {
  const k = tauMs > 0 && dtMs > 0 ? 1 - Math.exp(-dtMs / tauMs) : 1;
  const next: Vec3 = [cur[0] + (target[0] - cur[0]) * k, cur[1] + (target[1] - cur[1]) * k, cur[2] + (target[2] - cur[2]) * k];
  return Math.hypot(target[0] - next[0], target[1] - next[1], target[2] - next[2]) < 1e-4 ? target : next;
}

/** ⭐ The two fingers' kind (from each finger's travel since the SECOND landed, mm): their COMMON motion — the approach; their RELATIVE — the pinch. */
export function twoFingerKind(d1: readonly [number, number], d2: readonly [number, number], deadbandMm: number): "APPROACH" | "ZOOM" | null {
  const common = Math.hypot((d1[0] + d2[0]) / 2, (d1[1] + d2[1]) / 2);
  const rel = Math.hypot(d2[0] - d1[0], d2[1] - d1[1]);
  if (!(Math.max(common, rel) > deadbandMm)) return null;
  return common >= rel ? "APPROACH" : "ZOOM";
}

/**
 * ⭐⭐ (2026-10-28, the owner: *"the camera offset is different depending on the face hosting the gizmo. This is not what i want. I want the offset to be
 * the same whichever the hosting face"*) — THE CAMERA'S FRAME around the assembly: behind the piece along `u`, upright at the heading `h`, the owner's
 * offsets (`yawRad`, `pitchRad`) turned in the CAMERA'S OWN frame — the pitch about its right (toward its up), the yaw about its upright up — the same at
 * every pitch. ⛔ In the world's frame and faded from 60° of pitch (`frameAtHeading` — the top roll's rule): a top face, approached steeply, lost them.
 */
export function offsetFrame(u: Vec3, h: number, yawRad: number, pitchRad: number): { readonly dir: Vec3; readonly up: Vec3 } {
  const e = Math.asin(Math.max(-1, Math.min(1, u[1])));
  const heading: Vec3 = [Math.cos(h), 0, Math.sin(h)];
  const raw: Vec3 = [-Math.sin(e) * heading[0], Math.cos(e), -Math.sin(e) * heading[2]];
  const k = dot(raw, u);
  const up0 = normalize([raw[0] - k * u[0], raw[1] - k * u[1], raw[2] - k * u[2]]) ?? ([0, 1, 0] as Vec3);
  const c = Math.cos(pitchRad);
  const sn = Math.sin(pitchRad);
  const d1: Vec3 = [c * u[0] + sn * up0[0], c * u[1] + sn * up0[1], c * u[2] + sn * up0[2]];
  const u1: Vec3 = [c * up0[0] - sn * u[0], c * up0[1] - sn * u[1], c * up0[2] - sn * u[2]];
  const t = qFromAxisAngle(up0, -yawRad);
  return { dir: qRotate(t, d1), up: qRotate(t, u1) };
}

/** ⭐ The old 2D curve's ELEVATION at the approach coordinate `a` (ring 1 … the waist): its height over its radius (`orbitOffset` — 31.7° at ring 1 in
 * `Scene_1`, rising to ~57° near ring 2, 0 at the waist); below the waist, 0 (straight in). */
export function curveElevation(cfg: GestureConfig, a: number): number {
  const r = approachRange(cfg);
  if (a <= r.waist) return 0;
  const o = orbitOffset(cfg, 0, Math.min(r.max, a), 1).offsetM;
  return Math.atan2(o[1], Math.hypot(o[0], o[2]));
}

/** ⭐ The unit direction `share` of the way from `a` to `b` along their great circle (both unit). */
export function slerpDir(a: Vec3, b: Vec3, share: number): Vec3 {
  const c = Math.max(-1, Math.min(1, dot(a, b)));
  const w = Math.acos(c);
  if (w < 1e-9) return b;
  const s = Math.sin(w);
  if (s < 1e-6) return normalize([a[0] + (b[0] - a[0]) * share, a[1] + (b[1] - a[1]) * share, a[2] + (b[2] - a[2]) * share]) ?? b;
  const ka = Math.sin((1 - share) * w) / s;
  const kb = Math.sin(share * w) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

/**
 * ⭐⭐⭐ (2026-10-29, the owner: *"instead of the straight in, can I reinstate the old 2D curves ? would that create jumps (of the camera vs. piece) at max
 * distance if the gizmo changes position ?"* → *"these 2D curves would serve only the dy approach (the dx is not used for approach)"* → *"build it"*) —
 * **THE OLD 2D CURVE, CLOSE IN**: the piece's direction from the gizmo at the approach coordinate `a`. Far out — beyond the lock's distance `lockDistM` —
 * the orbit's own `u` (dx yaw, dy pitch: a gizmo change far out moves the piece by the gizmo's step only, never turns it). LOCKED (the face `n` held, so
 * it cannot jump), from the lock's distance in to the waist the direction turns from `u` onto the old curve (smoothly — at the waist wholly on it) — its
 * elevation (`curveElevation`, scaled by the piece's own angle off the curve's base against ring 1's: the full curve at ring 1's angle, straight in when
 * level, the lower half — rings 3 and 4 — below the horizon) in the old curve's own plane: over a VERTICAL face from the horizontal at the orbit's `yaw` toward up (it
 * rises over the face, then comes down level at the waist), over a HORIZONTAL face (within 45° of up or down — the curve's face snapped by gravity) the
 * vertical face's curve turned 90°: from the face's vertical toward the piece's side at `yaw` (straight over the face at the waist); from the waist,
 * straight in along that last direction to the contact. Kept in the lock's cone of `n`. `n` `null` (unlocked): `u`.
 */
export function approachDir(u: Vec3, yaw: number, n: Vec3 | null, cfg: GestureConfig, a: number, lockDistM: number): Vec3 {
  if (n === null) return u;
  const d = approachDistance(cfg, a);
  if (!(d < lockDistM)) return u;
  // ⭐ the turn onto the curve spread from the lock's distance down to the WAIST (⛔ to the curve's peak: ~23° of camera turn in 4 % of the approach)
  const waist = approachDistance(cfg, approachRange(cfg).waist);
  const end = lockDistM > waist ? waist : lockDistM / 2;
  const share = smooth((lockDistM - d) / (lockDistM - end));
  const h: Vec3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const flat = Math.abs(n[1]) > Math.SQRT1_2;
  const base: Vec3 = flat ? [0, Math.sign(n[1]), 0] : h;
  const side: Vec3 = flat ? h : [0, 1, 0];
  // ⭐ the curve's rise follows the piece's own angle off the curve's base (its pitch over a vertical face, its angle off the vertical over a horizontal
  // one) against ring 1's: at ring 1's angle the old curve exactly, level straight in, below the horizon the lower half (rings 3 and 4) — continuous in dy
  const off = Math.atan2(dot(u, side), dot(u, base));
  const k = Math.max(-1, Math.min(1, off / curveElevation(cfg, approachRange(cfg).max)));
  const e = curveElevation(cfg, a) * k;
  const c: Vec3 = [base[0] * Math.cos(e) + side[0] * Math.sin(e), base[1] * Math.cos(e) + side[1] * Math.sin(e), base[2] * Math.cos(e) + side[2] * Math.sin(e)];
  return coneClamp(slerpDir(u, c, share), n);
}

// ⛔ (2026-10-29) the gizmo CARRIED along the sections (`yawAbout`, `pitchSlide`, `sectionRay`, `radialRay`) is deleted — its carrier rides the section's
// hull now (`input/section_hull.ts`, with `faceTurnedAway` and the drawn sections' samples).
