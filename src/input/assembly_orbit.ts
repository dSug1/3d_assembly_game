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

// ⛔ (2026-10-29) the gizmo CARRIED along the sections (`yawAbout`, `pitchSlide`, `sectionRay`, `radialRay`) is deleted — its carrier rides the section's
// hull now (`input/section_hull.ts`, with `faceTurnedAway` and the drawn sections' samples).
