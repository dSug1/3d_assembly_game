/**
 * ⭐⭐ **THE GREEN BOX** (prototype (green box), the owner, 2026-09-30: *"add a green box in the scene. same dimensions as the smallest
 * yellow box. the green box shall always be positioned midway between the yellow target and the camera"*).
 *
 * ⭐ The *yellow target* is the orbit-centre marker (the barycentre the camera orbits, `camera_rig.ts`'s `syncCentre`); the
 * box sits at the MIDPOINT of that marker and the camera, every frame, whatever moved either. ⭐ Its size is the smallest
 * yellow body's own `dims` (the coloured core, not its transparent contour), by volume — read from the scene's data, so a
 * scene with no yellow body has no box. ⛔ A display object: not a piece, no collision, not in the goal — and since
 * 2026-10-01 SOLID to the finger: a press on it is EMPTY SPACE (⛔ 2026-11-02 every press is, `d8134eb`).
 *
 * ⛔ ENGINE-FREE.
 */
import type { BodySpec, Triple } from "../core/game_structure";
import { cross, length, qFromAxisAngle, qmul, sub, type Quat, type Vec3 } from "../core/vec";
import type { GestureConfig } from "./gestureConfig";

/** ⭐ The smallest body of `colour` (by volume) — `null` when the scene has none. Frozen bodies are not candidates. */
export function smallestOfColour(bodies: readonly BodySpec[], colour: readonly [number, number, number]): BodySpec | null {
  let best: BodySpec | null = null;
  let bestVolume = Infinity;
  for (const b of bodies) {
    if (b.frozen || !b.colour.every((c, i) => c === colour[i])) continue;
    const v = b.dims[0] * b.dims[1] * b.dims[2];
    if (v < bestVolume) {
      best = b;
      bestVolume = v;
    }
  }
  return best;
}

/** The box's size in metres — the body's authored `dims` × the scene's `unitM`. */
export function sizeM(dims: Triple, unitM: number): Vec3 {
  return [dims[0] * unitM, dims[1] * unitM, dims[2] * unitM];
}

/**
 * ⭐ prototype (green box) — **THE GREEN PYRAMID'S SOURCE** (the owner, 2026-10-02: *"replace the green box by a green trapezoidal
 * pyramid (same type as the one in scene 0). Dimensions = 150 % dimensions of the piece 17"*): the body named `id`, or `null`
 * when the scene has none (then there is no green piece at all).
 */
export function bodyNamed(bodies: readonly BodySpec[], id: string): BodySpec | null {
  return bodies.find((b) => b.id === id) ?? null;
}

/**
 * ⭐ The green pyramid's size, metres: the body's core `dims` × `unitM` × 150 % on every side (the owner, 2026-10-02), then
 * the HEIGHT halved (*"divide the height of the green piece by 2"*, the same day) — so the height is × 0.75 — and the LENGTH
 * (its longest side, the width) cut by 25 % (*"reduce the length of the green piece by 25%"*) — so the width is × 1.125.
 */
export function greenPyramidSizeM(dims: Triple, unitM: number): Vec3 {
  const [w, h, d] = sizeM(dims, unitM);
  return [w * 1.5 * 0.75, (h * 1.5) / 2, d * 1.5];
}

/**
 * ⭐⭐ prototype (green box) — **THE PAINTING SWINGS WHEN THE GREEN PIECE ORBITS** (the owner, 2026-10-02: *"apply the sway to other
 * objects when the green piece orbits"*, then *"I can't see any sway … I want the same effect when I orbit the green piece as when
 * I translate the piece 17"* → *"build 1-3"*). ⛔ A PUSH along the green piece's heading was invisible: with the leash at 0 the
 * camera turns with the green piece, the whole view sweeps at the orbit's speed (~5° per mm of finger), and a sub-millimetre
 * push in the direction the view is already sliding cannot be seen. ⭐ So the scene SWINGS instead, as a block, about the yellow
 * target, in the SAME sense the green piece is orbiting (carried along, as a dragged piece's sway carries the scene) — the floor
 * is frozen and does not swing, so the painting visibly turns against it even while the view rotates.
 * The axis: the rotation that carries the green piece from where it is toward where the rig now puts it (it eases after the
 * rig), about the target — `(box − centre) × (rig − box)`, normalised. A yaw orbit gives the vertical; an elevation orbit a
 * horizontal axis. `null` when it is not moving, or sits on the centre.
 */
export function orbitSlideDirection(box: Vec3, rig: Vec3): Vec3 | null {
  const d: Vec3 = [rig[0] - box[0], rig[1] - box[1], rig[2] - box[2]];
  const l = Math.hypot(d[0], d[1], d[2]);
  return l > 1e-12 ? [d[0] / l, d[1] / l, d[2] / l] : null;
}

/**
 * ⭐ prototype (green box) — WHICH orbit sway (`orbitSwayKind`): `0` the SWING (option 1), `1` the SLIDE (option 2 — the pieces
 * translate the way the green piece is heading, `orbitSlideDirection`, by `orbitSlideMm` on the glass; the owner, 2026-10-02:
 * *"build also option 2"*), `2` both.
 */
export function orbitSwayKinds(kind: number): { swing: boolean; slide: boolean } {
  return { swing: kind === 0 || kind === 2, slide: kind === 1 || kind === 2 };
}

/** ⭐ (2026-10-14) the orbit sway's least angle — at the rings' closest distance, or while the piece slides on a part (°). */
export const ORBIT_SWAY_MIN_DEG = 0.1;

/**
 * ⭐⭐ (2026-10-14, the owner: *"Orbit sway: make the sway in degree decrease linearly with the distance of the piece to the gizmo, from the orbit sway value of the slider (at maximum distance) to 0.1 degree (at minimum distance). If the piece is sliding on a part, set to minimum. Also, modify so that the center of the sway is not the gizmo but the barycenter of the placed"* → *"All placed parts"*) — THE SWAY'S ANGLE BY DISTANCE: linear in the piece's distance to the gizmo, from `ORBIT_SWAY_MIN_DEG` at the
 * rings' closest distance (`minM`) to the slider's `orbitSwayDeg` at their farthest (`maxM`), clamped between; the least angle while the piece
 * SLIDES on a part. A slider under the least angle is taken as it is (no sway grows from it); 0 is no sway.
 */
export function orbitSwayDegAt(sliderDeg: number, distM: number, minM: number, maxM: number, sliding: boolean): number {
  if (!(sliderDeg > 0)) return 0;
  const lo = Math.min(ORBIT_SWAY_MIN_DEG, sliderDeg);
  if (sliding) return lo;
  const u = maxM - minM > 1e-9 ? Math.min(1, Math.max(0, (distM - minM) / (maxM - minM))) : 1;
  return lo + (sliderDeg - lo) * u;
}

/**
 * ⭐⭐ (2026-10-14, the owner: *"Orbit sway: make the sway in degree decrease linearly with the distance of the piece to the gizmo, from the orbit sway value of the slider (at maximum distance) to 0.1 degree (at minimum distance). If the piece is sliding on a part, set to minimum. Also, modify so that the center of the sway is not the gizmo but the barycenter of the placed"* → *"All placed parts"*) — THE SWAY'S PIVOT: the barycentre of the parts PLACED in their goal (their centres); `null` with none
 * placed (the caller keeps the gizmo).
 */
export function placedBarycentre(centres: readonly Vec3[]): Vec3 | null {
  if (centres.length === 0) return null;
  const s: [number, number, number] = [0, 0, 0];
  for (const c of centres) {
    s[0] += c[0];
    s[1] += c[1];
    s[2] += c[2];
  }
  return [s[0] / centres.length, s[1] / centres.length, s[2] / centres.length];
}

export function orbitSwingAxis(centre: Vec3, box: Vec3, rig: Vec3): Vec3 | null {
  const r: Vec3 = [box[0] - centre[0], box[1] - centre[1], box[2] - centre[2]];
  const h: Vec3 = [rig[0] - box[0], rig[1] - box[1], rig[2] - box[2]];
  const a: Vec3 = [r[1] * h[2] - r[2] * h[1], r[2] * h[0] - r[0] * h[2], r[0] * h[1] - r[1] * h[0]];
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
}

/**
 * ⭐⭐ prototype (green box) — **THE BOOT ORBIT CENTRE: THE BLUE PIECE'S FACE TOWARD THE GREEN PIECE** (the owner, 2026-10-02: *"at
 * boot, place the orbit center to center of the face of the blue piece which faces the green piece"*). Of the blue piece's
 * faces (world centres and outward normals), the one whose normal points most along `towardGreen` — the green piece's boot
 * direction from the orbit (it sits metres away, so its direction from the face is the same to within a degree or two).
 * `null` with no face.
 */
export function faceToward(
  faces: readonly { readonly centre: Vec3; readonly normal: Vec3 }[],
  towardGreen: Vec3,
): { readonly centre: Vec3; readonly normal: Vec3 } | null {
  let best: { readonly centre: Vec3; readonly normal: Vec3 } | null = null;
  let bestDot = -Infinity;
  for (const f of faces) {
    const d = f.normal[0] * towardGreen[0] + f.normal[1] * towardGreen[1] + f.normal[2] * towardGreen[2];
    if (d > bestDot) {
      bestDot = d;
      best = f;
    }
  }
  return best;
}

/* ⛔⛔ (2026-11-13, the owner: *"Set the zoom at 1 and then remove the zoom function entirely. With the approach of the piece, there is no need for
 * zoom"*) THE ZOOM DELETED — it scaled the camera's distance behind the green piece (2026-10-02: `cameraRadiusOffsetMm × zoom`, 0.1 – 2), from the
 * wheel, the pinch and the boot; with it its range (`GREEN_ZOOM_MIN` / `GREEN_ZOOM_MAX`, `clampGreenZoom`) and its keep-on-screen floor
 * (`minGreenZoom`). The camera sits the radius offset behind the piece. */
/** ⭐ The green piece's orbit is the rings as configured — never scaled by the zoom any more. */
export const GREEN_PIECE_ORBIT_ZOOM = 1;

/**
 * ⭐⭐ prototype — **THE ORBITED PIECE'S OWN MINIMUM DISTANCE TO THE ORBIT CENTRE: ZERO** (the owner, 2026-10-09: *"we shall get the piece its
 * own minimum. later on, we will implement collision like the other parts in the scene have … give the piece its minimum at zero. no
 * slider"*). It rode the CAMERA's near-plane guard (`cameraRadiusMinM`, 0.15 m) — a floor that made it glide on a 0.15 m ball through the
 * waist; now the rings alone decide (`Scene_1`'s waist: 0.09 m — a ring's radius is always positive, so never the centre itself), and
 * collision will be the only thing to stop it near another part. ⚠ Until then it passes THROUGH the painting at the waist. The camera keeps
 * its own minimum. ⭐ (2026-10-12, *"so that the piece can go up to 6 m away from the yellow gizmo"*) — the far end is its OWN maximum too
 * (`pieceRadiusMaxM`, 6 m; it was the camera's `cameraRadiusMaxM`, 3 m).
 */
export const PIECE_MIN_DISTANCE_M = 0;

/** ⭐ The piece's distance from the orbit centre, held to its own range: [`PIECE_MIN_DISTANCE_M`, `pieceRadiusMaxM`]. */
export function clampPieceRadiusM(radiusM: number, cfg: GestureConfig): number {
  return Math.min(cfg.pieceRadiusMaxM, Math.max(PIECE_MIN_DISTANCE_M, radiusM));
}



/** ⭐ The camera's distance behind the green piece, metres: the radius offset × `scale` (⭐ 2026-11-13 no zoom: 1, but for the demo's camera). */
export function cameraGapM(radiusOffsetM: number, scale = 1): number {
  return Math.max(0, radiusOffsetM) * Math.max(0, Number.isFinite(scale) ? scale : 1);
}


/** ⭐ One face of a piece, in its own frame: outward normal, area centroid, area. */
export interface PieceFace {
  readonly normal: Vec3;
  readonly centre: Vec3;
  readonly areaM2: number;
}

/** ⭐ A face's area from its triangles (welded positions, 3 indices per triangle). */
export function faceAreaM2(positions: readonly Vec3[], triangles: readonly number[]): number {
  let a = 0;
  for (let i = 0; i + 2 < triangles.length; i += 3) {
    const p0 = positions[triangles[i]!]!;
    a += length(cross(sub(positions[triangles[i + 1]!]!, p0), sub(positions[triangles[i + 2]!]!, p0))) / 2;
  }
  return a;
}

/** ⭐ A piece's faces from its mesh topology (the logical faces — a box's six, not its twelve triangles). */
export function pieceFaces(
  positions: readonly Vec3[],
  faces: readonly { readonly normal: Vec3; readonly centre: Vec3; readonly triangles: readonly number[] }[],
): PieceFace[] {
  return faces.map((f) => ({ normal: f.normal, centre: f.centre, areaM2: faceAreaM2(positions, f.triangles) }));
}

/**
 * ⭐ prototype (green box) — **THE GREEN PIECE'S BOOT ORIENTATION, PER SCENE** (the owner, 2026-10-04: *"For this specific scene, make the
 * quaternion (1,2,3,4) at boot"*). (w, x, y, z) as given, NORMALIZED (its length is √30): ≈ (0.183, 0.365, 0.548, 0.730), a turn of ~159°
 * about (2, 3, 4). Any other scene: the identity.
 */
// ⭐ (2026-11-12) `Scene_0` (the heptagon) boots its green piece as `Scene_1`'s (*"same as the green piece of scene 1"*)
// ⭐ (2026-11-12) `Scene_0bis` (a copy of `Scene_0`, its heptagon tipped) the same
const GREEN_BOOT_QUAT: Readonly<Record<string, Quat>> = { Scene_1: [1, 2, 3, 4], Scene_0: [1, 2, 3, 4], Scene_0bis: [1, 2, 3, 4] };
export function greenBootOrientation(sceneId: string): Quat {
  const q = GREEN_BOOT_QUAT[sceneId];
  if (q === undefined) return [1, 0, 0, 0];
  const n = Math.hypot(q[0], q[1], q[2], q[3]);
  return n > 0 ? [q[0] / n, q[1] / n, q[2] / n, q[3] / n] : [1, 0, 0, 0];
}

/**
 * ⭐⭐ prototype — **THE TURQUOISE PIECE'S SIZE** (the owner, 2026-10-04: *"create an hexagone — extrude the hexagone by twice its diameter —
 * height shall be the same as the longest dimension of the green piece"*): a hexagonal prism whose length (the extrusion, its "height")
 * is the green piece's longest side, and whose hexagon is half that across its CORNERS (the circumscribed diameter — a hexagon's usual
 * diameter, and what Babylon's 6-sided cylinder takes).
 */
export function turquoiseSizeM(greenSizeM: Vec3): { readonly diameterM: number; readonly lengthM: number } {
  const lengthM = Math.max(greenSizeM[0], greenSizeM[1], greenSizeM[2]);
  return { diameterM: lengthM / 2, lengthM };
}

/** ⭐ A hexagonal prism's volume, m³: the regular hexagon of circumradius `diameterM / 2` (area 3√3/2 · r²) × its length. */
export function hexPrismVolumeM3(diameterM: number, lengthM: number): number {
  const r = diameterM / 2;
  return ((3 * Math.sqrt(3)) / 2) * r * r * lengthM;
}

/** ⭐ An angle wrapped into (−π, π] — a heading's change across the ±π seam is the short way round. */
export function wrapAngle(a: number): number {
  const w = a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
  return w <= -Math.PI ? w + 2 * Math.PI : w;
}

/**
 * ⭐⭐ prototype — **THE ORBITED PIECE TURNS AGAINST THE ORBIT** (`RESTING_FACE_ALIGNMENT.md` §2bis; the owner, 2026-10-05: *"in all cases,
 * the green piece and the turquoise pieces rotate in yaw in the opposite direction of the orbit yaw by the same amount. This is valid if
 * the resting face has been aligned or not (therefore, also at boot)"* — *"once the resting face is aligned, the piece will rotate in yaw
 * around the resting face normal"*). The orbit moved the piece's heading about the ring by `dHeading` (about +y); the piece turns by
 * `−dHeading` about the world vertical, through its own centre. ⭐ Once aligned, its resting face's normal IS the vertical — the same
 * turn, about that normal.
 */
export function counterYaw(q: Quat, dHeading: number): Quat {
  return qmul(qFromAxisAngle([0, 1, 0], -dHeading), q);
}
