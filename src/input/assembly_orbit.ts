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
 * * ⛔ (2026-11-04, Step 1 of the rebuild) the CLOSE-IN LOCK is deleted (`nextLock`): the gizmo is the same at every distance (Step 4c-bis: the face map, `input/face_map.ts`); under the SLIDE the
 *   gizmo is held, the piece kept within its cone of the face's normal (`lockCone`, `coneClamp`);
 * * the gizmo's FACE switches at an edge only once the ray lands past it by a margin (`faceSwitches`), so the quads do not flicker on an edge.
 * ⛔ ENGINE-FREE. Spherical angles, a ray, hysteresis — textbook; no licence, no patent.
 */
import type { GestureConfig } from "./gestureConfig";
import { orbitOffset } from "./orbit";
import { waistV } from "./orbit_rig";
import { smoothstep01 as smooth } from "./waist_view";
import { add, dot, normalize, qconj, qFromAxisAngle, qmul, qRotate, sub, type Quat, type Vec3 } from "../core/vec";

/**
 * ⭐ The pitch's reach either side of the horizon — ±90° (the owner, 2026-10-29: *"can you increase the pitch to -90 +90 degrees ?"* → *"build it with the
 * clamp and ±90°"*; ⛔ ±85°: never the vertical): straight above / under the centre at the ends, the camera's heading the orbit's yaw there, never over.
 */
export const ORBIT_PITCH_MAX_RAD = Math.PI / 2;

/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 0 — the owner: *"same direction of gizmo and delta position input"*, *"same direction as the input
 * wins"*) THE FINGER'S dy ON THE ORBIT AROUND THE ASSEMBLY: finger DOWN (`dyPx` > 0, screen coordinates) → the pitch DOWN → the gizmo down the face, the way
 * the finger goes (`TILTED_ORBIT_REBUILD_SCOPE.md` I5). ⛔ The 2026-10-04 rule (*"invert the sense of the delta position y input"*, finger down raised the
 * piece) stood around the assembly: the probe measured the gizmo against the finger in 29 of 30 moving frames. Elsewhere (the rings) unchanged.
 */
export function orbitDy(dyPx: number, aroundAssembly: boolean): number {
  return aroundAssembly ? -dyPx : dyPx;
}

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

/**
 * ⭐⭐⭐ (2026-11-02, *"the gizmo is always at the intersection of the green and red sections"*) — **WHERE THE RING IS DRAWN**: the gizmo's EXACT point this
 * frame (`exact` — the accepted drop the two lines are drawn through; locked, the lock's point), else the eased one. The orbit's centre (the piece, the
 * camera) keeps its ease: a drop that changes surface does not jump the piece. ⛔ The ring at the eased point trailed the lines by 90 ms.
 */
export function gizmoShownAt(exact: Vec3 | null, eased: Vec3): Vec3 {
  return exact ?? eased;
}

/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"the collision detection shall apply also when moving the piece away from a face (if the collision prevents the moving away
 * of the piece, the user shall find a way out himself as part of the game)"*) — **MAY THE APPROACH TAKE THIS STEP?** In (`out` false): the piece's gap at
 * the step (`gapStep`) at least the gap kept (`gapM`). Out: the same — or, a piece already inside it (still against the face it slid on, `gapNow` < `gapM`),
 * no CLOSER to any part than it is. ⛔ Out was never checked: leaving a top under `Piece44`'s overhang ran the piece into it, the solver's relocation
 * then pulled it back down — a jump.
 */
/** ⭐ (2026-11-01) the rounding a step out may lose against a part it moves along (m) — 0.01 mm: a slide against a stopper, then out parallel to it. */
export const APPROACH_OUT_TOL_M = 1e-5;
export function approachStepFree(gapStep: number, gapNow: number, gapM: number, out: boolean): boolean {
  return gapStep >= (out ? Math.min(gapM, gapNow) - APPROACH_OUT_TOL_M : gapM);
}

/** ⭐ The approach coordinate's floor: the CONTACT — below the waist (`waistV`) by this much, the last stretch straight to it. */
export const APPROACH_CONTACT_SPAN = 0.05;

/**
 * ⭐⭐⭐ (2026-11-06, scope §22, the owner: *"(a) close in"*) THE APPROACH BELOW THE CONTOUR: past the contact on the contour (the coordinate's `min`, the
 * distance 0) the approach goes on IN along the piece's ray, at the last stretch's pace, up to this deep (m) — into a slot, onto a face below the contour
 * (the parts' collision stops it at the real contact). The orbit then keeps that depth: a dx / dy close in never reads the real surface.
 */
export const APPROACH_SINK_M = 0.3;

/** ⭐ The approach coordinate's range: 1 far out (ring 1's distance), `waistV` at the waist, the contact on the contour at `min`, the deepest at `floor`. */
export function approachRange(cfg: GestureConfig): { readonly min: number; readonly waist: number; readonly max: number; readonly floor: number } {
  const w = waistV(cfg);
  const min = w - APPROACH_CONTACT_SPAN;
  const perUnit = orbitOffset(cfg, 0, w, 1).radiusM / APPROACH_CONTACT_SPAN; // the last stretch's metres per unit
  return { min, waist: w, max: 1, floor: perUnit > 1e-9 ? min - APPROACH_SINK_M / perUnit : min };
}

/**
 * ⭐⭐ THE APPROACH'S DISTANCE from the gizmo at the approach coordinate `a`: from 1 (ring 1's distance — the far orbit) down to the waist, the 2D curve's
 * own distance from the gizmo (`orbitOffset` — the same for a vertical face's curve and a horizontal face's, a rotation); below the waist, straight to 0
 * (the contact on the contour) — ⭐⭐⭐ (§22) and on below it, NEGATIVE, to `floor` (`APPROACH_SINK_M`). The piece goes STRAIGHT IN along its ray (the
 * owner: *"make it straight in"*).
 */
export function approachDistance(cfg: GestureConfig, a: number): number {
  const r = approachRange(cfg);
  const x = Math.min(r.max, Math.max(r.floor, a));
  const dist = (v: number): number => orbitOffset(cfg, 0, v, 1).radiusM;
  if (x >= r.waist) return dist(x);
  return (dist(r.waist) * (x - r.min)) / (r.waist - r.min);
}

/**
 * ⭐⭐ (§22) The approach coordinate whose distance is `distM` on the STRAIGHT stretch (`approachDistance` inverted below the waist — linear; the curve above
 * it is not monotone): held to `floor` … `waist`. Read at the slide's way out (the depth kept), well inside the stretch.
 */
export function approachAt(cfg: GestureConfig, distM: number): number {
  const r = approachRange(cfg);
  const dw = orbitOffset(cfg, 0, r.waist, 1).radiusM;
  if (!(dw > 1e-12)) return r.min;
  return Math.min(r.waist, Math.max(r.floor, r.min + (distM / dw) * (r.waist - r.min)));
}

/** ⭐ The far orbit's distance from the gizmo (ring 1's — one value for both curves, the owner's 5). */
export function farDistance(cfg: GestureConfig): number {
  return approachDistance(cfg, 1);
}

/** ⭐ The angle between `u` and `n` (unit). */
export function angleTo(u: Vec3, n: Vec3): number {
  return Math.acos(Math.max(-1, Math.min(1, dot(u, n))));
}

/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"The 3° face: check what can interrupt the turn … Check other possibilities."*) — A HIT ON A SWAYING MESH, BROUGHT ONTO
 * ITS BODY'S MODEL POSE: the point and the normal turned by what takes the mesh as drawn (`meshPos`, `meshRot`) to the body as the model places it
 * (`modelPos`, `modelRot`). ⛔ The orbit's sway turns the placed parts' MESHES (4.5°, eased back): a gizmo found on them took the swayed normal — up to
 * 2.4° off the face, measured — and kept it after the sway died; off its host's faces by more than 1°, the quads took it raw (4.4° off, measured), the
 * quads' turn laid the resting face on it, and the slide (2°, read from the model) never lit.
 */
export function unswayHit(point: Vec3, normal: Vec3 | null, meshPos: Vec3, meshRot: Quat, modelPos: Vec3, modelRot: Quat): { point: Vec3; normal: Vec3 | null } {
  const d = qmul(modelRot, qconj(meshRot)); // the mesh undone, then the model
  return { point: add(modelPos, qRotate(d, sub(point, meshPos))), normal: normal === null ? null : qRotate(d, normal) };
}
/** ⛔ (2026-11-07, §30 S1) `swayRay` — a ray moved onto each swaying mesh for the ropes' mesh casts — DELETED with them: the sections are cut from the
 * parts' model-pose vertices. */

/**
 * ⭐⭐⭐ (2026-11-01) A face's normal on its body's MODEL pose from the mesh's own LOCAL facet normal (`localN`) and its scaling (`s`, per axis — the
 * normal scaled by its inverse): exact whatever the mesh was drawn at when it was picked. `null` for a null normal.
 */
export function modelNormal(localN: Vec3, s: Vec3, modelRot: Quat): Vec3 | null {
  const k = normalize([localN[0] / (s[0] || 1), localN[1] / (s[1] || 1), localN[2] / (s[2] || 1)]);
  return k === null ? null : qRotate(modelRot, k);
}

/** ⛔ (2026-11-04, Step 4c-bis) `rayOffsets` — the five rays that found the gizmo toward the centre (`castGizmo`) — DELETED with it: the face map's closed
 * regions bridge the joints (`input/face_map.ts`). */

/**
 * ⭐ How far the camera looks at the gizmo rather than the centre (0 … 1): 0 far out (at ring 1's distance), 1 at the lock's distance (smoothstep between);
 * locked, 1.
 */
export function lookShare(distM: number, farM: number, lockDistM: number, locked: boolean): number {
  if (locked) return 1;
  if (!(farM > lockDistM)) return 1;
  return smooth((farM - distM) / (farM - lockDistM));
}

/**
 * ⭐⭐ (2026-10-29, the owner: *"On desktop, if I keep shift pressed for a long time, the windows sticky keys message pops up … use a key which will not
 * trigger a message from Windows, IOS, Linux, etc. if it is pressed for a long time"* → *"A should replace shift"*) — THE APPROACH KEY on the desktop: A
 * held + drag (⛔ Shift: Windows' Sticky Keys on five presses, Filter Keys on the right Shift held 8 s; macOS and Linux have Shift shortcuts too — a letter
 * has none). By its LABEL (`KeyboardEvent.key`, either case), so it is the A key on an AZERTY keyboard too.
 */
export function isApproachKey(key: string): boolean {
  return key.toLowerCase() === "a";
}

/** ⭐ The approach step a millimetre of the two fingers' (or A + drag's) dy buys: finger UP brings the piece IN (the coordinate down). */
export function approachStep(a: number, dyMm: number, perMm: number, cfg: GestureConfig): number {
  const r = approachRange(cfg);
  return Math.min(r.max, Math.max(r.floor, a + dyMm * perMm));
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
  return offsetWithUp(u, up0, yawRad, pitchRad);
}

/** ⭐ (2026-11-05, §20) The owner's offsets about the piece's direction `u` given the camera's UP for it (`up0`, square to `u`) — `offsetFrame`'s second half. */
export function offsetWithUp(u: Vec3, up0: Vec3, yawRad: number, pitchRad: number): { readonly dir: Vec3; readonly up: Vec3 } {
  const c = Math.cos(pitchRad);
  const sn = Math.sin(pitchRad);
  const d1: Vec3 = [c * u[0] + sn * up0[0], c * u[1] + sn * up0[1], c * u[2] + sn * up0[2]];
  const u1: Vec3 = [c * up0[0] - sn * u[0], c * up0[1] - sn * u[1], c * up0[2] - sn * u[2]];
  const t = qFromAxisAngle(up0, -yawRad);
  return { dir: qRotate(t, d1), up: qRotate(t, u1) };
}

/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"when I move away the piece after slide, the piece goes towards the camera first, then there is a later movement of the
 * piece on the screen due to the camera taking back its offset position"* → *"build A"*) — **THE ORBIT WHOSE CAMERA LOOKS ALONG `want`**: the yaw and pitch
 * whose camera direction — the piece's direction turned by the camera's offsets (`offsetFrame`) — is `want` (unit, from what it looks at to the camera);
 * the yaw kept nearest `yaw0`. Solved by fixed-point on the two angles (the offsets are a near-rigid turn: a few steps); the best found when it cannot
 * meet it (straight above). `null` for no direction.
 */
export function orbitForCameraDir(want: Vec3, yaw0: number, offYawRad: number, offPitchRad: number): { yaw: number; v: number } | null {
  const w = normalize(want);
  if (w === null) return null;
  const LIM = Math.PI / 2 - 1e-4;
  const angles = (d: Vec3): { yaw: number; p: number } => ({ yaw: Math.atan2(d[2], d[0]), p: Math.asin(Math.max(-1, Math.min(1, d[1]))) });
  const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
  const aw = angles(w);
  const flat = Math.hypot(w[0], w[2]) > 1e-9;
  let yaw = yaw0 + (flat ? wrap(aw.yaw - yaw0) : 0);
  let p = aw.p;
  let best = { yaw, p, err: Infinity };
  for (let i = 0; i < 40; i++) {
    const d = offsetFrame(orbitDir(yaw, vOfPitch(p)), yaw, offYawRad, offPitchRad).dir;
    const err = Math.acos(Math.max(-1, Math.min(1, dot(d, w))));
    if (err < best.err) best = { yaw, p, err };
    if (err < 1e-9) break;
    const ad = angles(d);
    if (flat) yaw += wrap(aw.yaw - ad.yaw);
    p = Math.max(-LIM, Math.min(LIM, p + (aw.p - ad.p)));
  }
  return { yaw: best.yaw, v: vOfPitch(best.p) };
}

// ⛔ (2026-10-29) the gizmo CARRIED along the sections (`yawAbout`, `pitchSlide`, `sectionRay`, `radialRay`) is deleted — and its successor, the carrier on the
// sections' hull, with it (Step 4c-bis): the gizmo is a function of the orbit's angles (`input/face_map.ts`).
