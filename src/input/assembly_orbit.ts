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
export function gizmoShownAt(exact: Vec3 | null, eased: Vec3, lag: Vec3 | null = null): Vec3 {
  if (exact === null) return eased;
  return lag === null ? exact : [exact[0] + lag[0], exact[1] + lag[1], exact[2] + lag[2]];
}

/**
 * ⭐⭐⭐ (2026-11-11, the owner: *"I don't like the way the gizmo moves (it jitters slightly) but I like the smooth movement of the piece and scene"*, *"avoid
 * adding another lerp or spring"*) THE BASE'S LAG ALONG THE SURFACE: how far the rig's eased base (`eased` — the piece and the camera hang from it) is
 * behind its target (`target` — the foot at the gizmo's exact place), its part along the gizmo's face (`n` its normal; none: the whole). The gizmo and its
 * sections are DRAWN by it (`gizmoShownAt`): one time law for the piece, the camera and the gizmo — the rig's own, no second ease. ⛔ The gizmo drawn at its
 * exact place stepped on each finger event (22 mm, then nothing) against a piece now still on the screen: the jitter. Its part along the normal dropped:
 * the drawn gizmo never leaves its surface (the base also moves along the normal when the shown direction turns — a turn of the camera, not the gizmo).
 */
export function gizmoLag(eased: Vec3, target: Vec3, n: Vec3 | null): Vec3 {
  const l: Vec3 = [eased[0] - target[0], eased[1] - target[1], eased[2] - target[2]];
  if (n === null) return l;
  const k = l[0] * n[0] + l[1] * n[1] + l[2] * n[2];
  return [l[0] - n[0] * k, l[1] - n[1] * k, l[2] - n[2] * k];
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

/** ⛔ (2026-11-12, `CLOSE_IN_CONTACT.md`) the slide's lock cone (`LOCK_CONE_RAD`, `lockCone`, `coneClamp`) DELETED with the slide. */

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
/**
 * ⭐⭐⭐ (2026-11-04, Step 4c, the owner: *"make sure the orbit slide (the pieces translate the way the green box orbits) does not pollute the gizmo"*) — A RAY
 * IN THE MODEL'S SPACE, MOVED ONTO A BODY AS DRAWN: `unswayHit`'s inverse (the model undone, then the mesh), for the ray's `origin` and `dir`. Cast against
 * the swaying mesh it meets what the same ray meets on the body at its model pose — the hit, mapped back by `unswayHit`, is where the ray meets the body at
 * rest. ⛔ A ray cast in the world against the swayed meshes, its hit only mapped back: a part swayed across the ray was hit (or missed) where it was
 * drawn — the gizmo off its red plane by the sway, a section sample on the wrong part.
 */
export function swayRay(origin: Vec3, dir: Vec3, meshPos: Vec3, meshRot: Quat, modelPos: Vec3, modelRot: Quat): { origin: Vec3; dir: Vec3 } {
  const d = qmul(meshRot, qconj(modelRot)); // the model undone, then the mesh
  return { origin: add(meshPos, qRotate(d, sub(origin, modelPos))), dir: qRotate(d, dir) };
}

/**
 * ⭐⭐⭐ (2026-11-01) A face's normal on its body's MODEL pose from the mesh's own LOCAL facet normal (`localN`) and its scaling (`s`, per axis — the
 * normal scaled by its inverse): exact whatever the mesh was drawn at when it was picked. `null` for a null normal.
 */
export function modelNormal(localN: Vec3, s: Vec3, modelRot: Quat): Vec3 | null {
  const k = normalize([localN[0] / (s[0] || 1), localN[1] / (s[1] || 1), localN[2] / (s[2] || 1)]);
  return k === null ? null : qRotate(modelRot, k);
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

/** ⛔ (2026-11-04, Step 4c-bis) `rayOffsets` — the five rays that found the gizmo toward the centre (`castGizmo`) — DELETED with it: the face map's closed
 * regions bridge the joints (`input/face_map.ts`). */

/**
 * ⭐ How far the camera looks at the gizmo rather than the centre (0 … 1): 0 far out (at ring 1's distance), 1 at the lock's distance (smoothstep between).
 */
export function lookShare(distM: number, farM: number, lockDistM: number): number {
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
  return Math.min(r.max, Math.max(r.min, a + dyMm * perMm));
}

/** ⭐ One frame of an ease of a point toward another (`1 − exp(−dt/τ)`), landing on it within 0.1 mm. */
export function easePoint(cur: Vec3, target: Vec3, dtMs: number, tauMs: number): Vec3 {
  const k = tauMs > 0 && dtMs > 0 ? 1 - Math.exp(-dtMs / tauMs) : 1;
  const next: Vec3 = [cur[0] + (target[0] - cur[0]) * k, cur[1] + (target[1] - cur[1]) * k, cur[2] + (target[2] - cur[2]) * k];
  return Math.hypot(target[0] - next[0], target[1] - next[1], target[2] - next[2]) < 1e-4 ? target : next;
}

/**
 * ⭐⭐⭐ (2026-11-13, the owner: *"simplify the two finger approach on mobile phone: it is currently difficult to latch the two finger approach: propose
 * something simpler (for example, use the pinch input for the approach on mobile phone)"* → *"build A"*) **THE PINCH IS THE APPROACH**: two fingers
 * spread apart bring the piece IN, pinched together take it OUT — any two fingers, nothing to classify (⛔ `twoFingerKind`: the first move judged once,
 * common motion the approach, relative the pinch — a real two-finger swipe wobbled into the pinch, which then held for the gesture). The fingers'
 * SEPARATION (mm) is the signal: tens of millimetres, far above a finger's jitter.
 * `pinchLatched`: the separation moved past the deadband from where the two fingers landed (`sep0Mm`) — then the approach runs from THERE (re-anchored,
 * so no jump by the deadband at its start).
 */
export function pinchLatched(sep0Mm: number, sepMm: number, deadbandMm: number): boolean {
  return Math.abs(sepMm - sep0Mm) > deadbandMm;
}

/** ⭐ The two fingers' separation (mm) from their places (mm). */
export function separationMm(a: readonly [number, number], b: readonly [number, number]): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/**
 * ⭐ The approach's input for a change of the fingers' separation, as the approach's `dyMm` (finger UP = negative = IN): spread (`sepMm` > `prevMm`)
 * IN, pinched OUT, × `gain` (`approachPinchGain`).
 */
export function pinchApproachDyMm(prevMm: number, sepMm: number, gain: number): number {
  return -(sepMm - prevMm) * gain;
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

/** ⛔ (2026-11-12) `orbitForCameraDir` (the slide's way out from its view) DELETED with the slide. */

// ⛔ (2026-10-29) the gizmo CARRIED along the sections (`yawAbout`, `pitchSlide`, `sectionRay`, `radialRay`) is deleted — and its successor, the carrier on the
// sections' hull, with it (Step 4c-bis): the gizmo is a function of the orbit's angles (`input/face_map.ts`).

/**
 * ⭐⭐⭐ (2026-11-12, `CLOSE_IN_CONTACT.md` step 3; the owner: *"1b"* — the orbit's degrees per mm scaled down continuously as the approach's distance
 * shrinks) — **THE CLOSE-IN GAIN**: the orbit's gain at the piece's distance `dM` from the gizmo, a share of its full gain — 1 from `fullM` out, falling
 * LINEARLY toward the contact (speed proportional to the distance to the surface: Ware & Fleet's context-sensitive flying, 1997), where it is the share that
 * moves the gizmo `contactMmPerMm` mm on the surface per mm of finger (the slide's 1 : 1), read from the full gain (`degPerMm`, °/mm) at the assembly's
 * radius (`radiusM`). ⛔ Unscaled, close in a mm of finger moved the gizmo ~24 mm (probed: 30 px → 186 mm on the cube's top) — a pixel beyond the goal's 5 mm.
 * Never above 1; a degenerate input (no radius, no gain, no distance range): 1 (the orbit as it was).
 */
export function closeInGain(dM: number, fullM: number, contactMmPerMm: number, degPerMm: number, radiusM: number): number {
  const fullMmPerMm = ((degPerMm * Math.PI) / 180) * radiusM * 1000;
  if (!(fullM > 0) || !(fullMmPerMm > 0) || !(contactMmPerMm > 0)) return 1;
  const kMin = Math.min(1, contactMmPerMm / fullMmPerMm);
  const t = Math.min(1, Math.max(0, dM / fullM));
  return kMin + (1 - kMin) * t;
}
