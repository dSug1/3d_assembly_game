/**
 * ⭐⭐ **THE GREEN BOX** (prototype (green box), the owner, 2026-09-30: *"add a green box in the scene. same dimensions as the smallest
 * yellow box. the green box shall always be positioned midway between the yellow target and the camera"*).
 *
 * ⭐ The *yellow target* is the orbit-centre marker (the barycentre the camera orbits, `camera_rig.ts`'s `syncCentre`); the
 * box sits at the MIDPOINT of that marker and the camera, every frame, whatever moved either. ⭐ Its size is the smallest
 * yellow body's own `dims` (the coloured core, not its transparent contour), by volume — read from the scene's data, so a
 * scene with no yellow body has no box. ⛔ A display object: not a piece, no collision, not in the goal — and since
 * 2026-10-01 SOLID to the finger: a press on it is EMPTY SPACE (`throughGreenBox`).
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
 * ⭐⭐ prototype (green box) — **A PRESS ON THE GREEN BOX IS EMPTY SPACE** (the owner, 2026-10-01: *"when I click on the green
 * box, the raycast hits the piece behind"* → *"option 1: implement"*). ⛔ The box was unpickable, so the ray went THROUGH it
 * and grabbed the piece behind. ✅ It is pickable now, so the ray STOPS there — and this turns that hit into a MISS before
 * any rule reads it: the finger orbits, as on empty space, and the box is never held, aligned or steered like a piece.
 */
export function throughGreenBox<M>(hit: M | null, greenBox: M | null): M | null {
  return hit !== null && greenBox !== null && hit === greenBox ? null : hit;
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

/**
 * ⭐⭐ prototype (green box) — **THE ZOOM MOVES THE CAMERA, NOT THE GREEN PIECE** (the owner, 2026-10-02: *"change the property of the
 * zoom: the zoom shall bring the camera closer to or further away from the green piece. zoom from 0.1 to 2, with 1.00
 * corresponding to the current distance"*). ⛔ The zoom used to scale the RINGS — the green piece's own orbit. Now the green piece
 * rides the rings as they are (`GREEN_PIECE_ORBIT_ZOOM`), and the zoom scales only the camera's distance BEHIND it:
 * `cameraRadiusOffsetMm × zoom` — 1.00 the 1.25 m it was. Wheel, pinch and the boot zoom all write that one zoom, held to
 * `[GREEN_ZOOM_MIN, GREEN_ZOOM_MAX]`.
 */
export const GREEN_ZOOM_MIN = 0.1;
export const GREEN_ZOOM_MAX = 2;
/** ⭐ The green piece's orbit is the rings as configured — never scaled by the zoom any more. */
export const GREEN_PIECE_ORBIT_ZOOM = 1;

/**
 * ⭐⭐ prototype — **THE ORBITED PIECE'S OWN MINIMUM DISTANCE TO THE ORBIT CENTRE: ZERO** (the owner, 2026-10-09: *"we shall get the piece its
 * own minimum. later on, we will implement collision like the other parts in the scene have … give the piece its minimum at zero. no
 * slider"*). It rode the CAMERA's near-plane guard (`cameraRadiusMinM`, 0.15 m) — a floor that made it glide on a 0.15 m ball through the
 * waist; now the rings alone decide (`Scene_1`'s waist: 0.09 m — a ring's radius is always positive, so never the centre itself), and
 * collision will be the only thing to stop it near another part. ⚠ Until then it passes THROUGH the painting at the waist. The camera keeps
 * its own minimum; the far end keeps the camera's maximum (`cameraRadiusMaxM`).
 */
export const PIECE_MIN_DISTANCE_M = 0;

/** ⭐ The piece's distance from the orbit centre, held to its own range: [`PIECE_MIN_DISTANCE_M`, `cameraRadiusMaxM`]. */
export function clampPieceRadiusM(radiusM: number, cfg: GestureConfig): number {
  return Math.min(cfg.cameraRadiusMaxM, Math.max(PIECE_MIN_DISTANCE_M, radiusM));
}

export function clampGreenZoom(zoom: number, lower: number = GREEN_ZOOM_MIN): number {
  return Math.min(GREEN_ZOOM_MAX, Math.max(Math.max(GREEN_ZOOM_MIN, lower), Number.isFinite(zoom) ? zoom : 1));
}

/**
 * ⭐⭐ prototype (green box) — **THE CLOSEST ZOOM THAT KEEPS THE GREEN PIECE ON SCREEN** (the owner, 2026-10-02: *"make sure that
 * given the yaw and pitch offset, a close zoom cannot result in the green piece being out of the screen"* → A, *"not recomputed
 * at each frame"*). The camera sits the yaw / pitch offset off the green piece's direction, `g` behind it, and looks at the
 * TARGET; the piece's centre must stay inside `margin` of each half-view — horizontal (`tan(h/2) = tan(v/2) × aspect`, narrower
 * in portrait) and vertical.
 * ⭐⭐ **EXACT, PER RING POSITION** (the owner, 2026-10-02: *"in portrait the min zoom can go further low than today's limit 0.72
 * … there is still a lot of margin"* — *"same for landscape"*): the piece is PROJECTED from the camera as `cameraOffset` places
 * it — elevated rings included. ⛔ The earlier closed form treated the yaw offset as if the camera were level, while on the top
 * ring (~32° up) a 3° yaw about the vertical is only ~3° × cos 32° across the glass: 0.70 where 0.60 is exact (portrait 0.53).
 * ⛔ A piece-size term tried the same day pushed the limit the wrong way and is gone. ⭐ The worst over `ring` (each sample the
 * piece's distance from the target and its elevation) — so it holds on every ring and is recomputed only when the offsets, the
 * margin, the rings or the screen change, never while orbiting.
 * Returns the zoom (gap ÷ `radiusOffsetM`), never below `GREEN_ZOOM_MIN`, never above `GREEN_ZOOM_MAX`.
 */
export function minGreenZoom(p: {
  readonly yawOffsetRad: number;
  readonly pitchOffsetRad: number;
  readonly ring: readonly { readonly distanceM: number; readonly pitchRad: number }[];
  readonly radiusOffsetM: number;
  readonly fovVerticalRad: number;
  readonly aspect: number;
  readonly margin: number;
}): number {
  if (!(p.radiusOffsetM > 0)) return GREEN_ZOOM_MAX;
  const halfV = p.fovVerticalRad / 2;
  const halfH = Math.atan(Math.tan(halfV) * p.aspect);
  const limH = halfH * p.margin;
  const limV = halfV * p.margin;
  const gMax = GREEN_ZOOM_MAX * p.radiusOffsetM;
  const lim89 = (89 * Math.PI) / 180;
  let need = 0;
  for (const s of p.ring) {
    const d = s.distanceM;
    const box = [d * Math.cos(s.pitchRad), d * Math.sin(s.pitchRad), 0];
    const pitch = Math.max(-lim89, Math.min(lim89, s.pitchRad + p.pitchOffsetRad));
    // the piece's centre, seen from the camera `g` behind it (as `cameraOffset` places it, looking at the target, up = world up)
    const fits = (g: number): boolean => {
      const R = d + g;
      const c = [R * Math.cos(pitch) * Math.cos(p.yawOffsetRad), R * Math.sin(pitch), R * Math.cos(pitch) * Math.sin(p.yawOffsetRad)];
      const f = [-c[0]! / R, -c[1]! / R, -c[2]! / R];
      const rl = Math.hypot(f[0]!, f[2]!);
      const r = [-f[2]! / rl, 0, f[0]! / rl];
      const u = [r[1]! * f[2]! - r[2]! * f[1]!, r[2]! * f[0]! - r[0]! * f[2]!, r[0]! * f[1]! - r[1]! * f[0]!];
      const q = [box[0]! - c[0]!, box[1]! - c[1]!, box[2]! - c[2]!];
      const z = q[0]! * f[0]! + q[1]! * f[1]! + q[2]! * f[2]!;
      if (!(z > 0)) return false;
      const x = (q[0]! * r[0]! + q[1]! * r[1]! + q[2]! * r[2]!) / z;
      const y = (q[0]! * u[0]! + q[1]! * u[1]! + q[2]! * u[2]!) / z;
      return Math.atan(Math.abs(x)) <= limH && Math.atan(Math.abs(y)) <= limV;
    };
    if (fits(0)) continue;
    if (!fits(gMax)) return GREEN_ZOOM_MAX;
    let lo = 0;
    let hi = gMax;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    need = Math.max(need, hi);
  }
  return Math.min(GREEN_ZOOM_MAX, Math.max(GREEN_ZOOM_MIN, need / p.radiusOffsetM));
}

/** ⭐ The camera's distance behind the green piece, metres: the radius offset × the zoom (held to its range). */
export function cameraGapM(radiusOffsetM: number, zoom: number): number {
  return Math.max(0, radiusOffsetM) * clampGreenZoom(zoom);
}


/** One hit along the camera's ray to the yellow target: how far, and whether it is the green piece. */
export interface RingHit {
  readonly distanceM: number;
  readonly isGreenBox: boolean;
}

/**
 * ⭐⭐ prototype (green box) — **THE PINK RING'S OCCLUSION** (the owner, 2026-10-02: *"The pink gizmo ring is occludable by any
 * other object except frozen object. If the green box occludes the pink gizmo ring, the pink gizmo ring becomes slightly
 * translucent (to show that it is masked by the green box but still visible)"*). `hits` are what the camera's ray meets on
 * the way to the target — frozen bodies already left out by the caller. A hit counts only if it is NEARER than the target by
 * more than `epsM`: the piece the target sits ON is met right at it, and must not hide it.
 * * any piece in front → `HIDDEN`; * only the green piece → `TRANSLUCENT`; * nothing → `VISIBLE`.
 */
export function pinkRingVisibility(
  hits: readonly RingHit[],
  targetDistM: number,
  epsM: number,
  /**
   * ⭐ prototype (green box), the owner 2026-10-02: *"display the pink ring at the boot"* — the BOOT target (the scene's orbit
   * centre, behind the painting's panel) has pieces in front from the boot camera, so it was hidden. Until the target is first
   * set by a press on a placed piece, a piece in front makes it TRANSLUCENT instead: it is always displayed at boot.
   */
  bootTarget = false,
): "VISIBLE" | "TRANSLUCENT" | "HIDDEN" {
  let masked = false;
  for (const h of hits) {
    if (!(h.distanceM < targetDistM - epsM)) continue;
    if (!h.isGreenBox && !bootTarget) return "HIDDEN";
    masked = true;
  }
  return masked ? "TRANSLUCENT" : "VISIBLE";
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
const GREEN_BOOT_QUAT: Readonly<Record<string, Quat>> = { Scene_1: [1, 2, 3, 4] };
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
