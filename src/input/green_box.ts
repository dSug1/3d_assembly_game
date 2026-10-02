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
import { cross, dot, length, qmul, qRotate, shortestArc, sub, type Quat, type Vec3 } from "../core/vec";

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

/**
 * ⭐ prototype (green box) — **IS THE GREEN PIECE OUTSIDE THE GUIDE SPHERE?** (the owner, 2026-10-02: *"when the green piece is
 * outside of this sphere, highlight its contour in white"*): its CENTRE farther from the yellow target than the sphere's radius.
 */
export function outsideSphere(piece: Vec3, centre: Vec3, radiusM: number): boolean {
  return Math.hypot(piece[0] - centre[0], piece[1] - centre[1], piece[2] - centre[2]) > radiusM;
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

/**
 * ⭐⭐ prototype (green box) — **THE FACES OF A PIECE OUTSIDE THE GUIDE SPHERE ARE TRACKED** (the owner, 2026-10-02: *"when a piece
 * goes outside the white sphere, compute its number of faces and track them. This is valid for the green piece or any other piece
 * which will later be orbited"* — *"also at boot, if any piece is outside the white sphere"*). What one frame does for one orbited
 * piece, from whether it was outside last frame (`null` = never seen: the boot) and whether it is now:
 * * `START` — it crossed outward, or it is outside at its first frame: compute its faces;
 * * `KEEP` — still outside: update them;
 * * `STOP` — back inside: drop them (the next exit computes them again);
 * * `NONE` — inside, and was.
 */
export type FaceTracking = "START" | "KEEP" | "STOP" | "NONE";
export function faceTracking(wasOutside: boolean | null, isOutside: boolean): FaceTracking {
  if (isOutside) return wasOutside === true ? "KEEP" : "START";
  return wasOutside === true ? "STOP" : "NONE";
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

/** ⭐ `DegreesYawPerFace` — the yaw face alignment span shared among the piece's faces (the owner, 2026-10-02). 0 with no face. */
export function degreesYawPerFace(spanDeg: number, faceCount: number): number {
  return faceCount > 0 ? spanDeg / faceCount : 0;
}

/** ⭐ `DeltaXYawPerFace` — the finger's dx (mm) that orbits one `DegreesYawPerFace`, at the yaw rate (`orbitDegPerMm`). */
export function deltaXYawPerFace(degPerFace: number, yawDegPerMm: number): number {
  return yawDegPerMm > 0 ? degPerFace / yawDegPerMm : Infinity;
}

/**
 * ⭐ The dx accumulated since the faces were taken (`START`), and the face steps this frame's dx makes. The face is the accumulated
 * dx ROUNDED to whole `DeltaXYawPerFace`s — so the face anti-aligned at `START` holds for half a step either way, every boundary
 * sits at a fixed yaw, orbiting the whole span one way makes exactly one step per face, and orbiting back retraces them at the
 * same places. ⛔ Not a remainder carried from step to step: that put the way back a whole step farther than the way forward.
 */
export function accumulateFaceSteps(accMm: number, dxMm: number, stepMm: number): { readonly accMm: number; readonly steps: number } {
  if (!(stepMm > 0) || !Number.isFinite(stepMm)) return { accMm: 0, steps: 0 };
  const a = accMm + dxMm;
  const face = (x: number): number => Math.floor(x / stepMm + 0.5);
  return { accMm: a, steps: face(a) - face(accMm) };
}

/** ⭐ The index of the face whose WORLD normal (under `q`) most anti-aligns with `target` — the lowest dot. -1 with no face. */
export function mostAntiAligned(faces: readonly PieceFace[], q: Quat, target: Vec3): number {
  let best = -1;
  let bestDot = Infinity;
  for (let i = 0; i < faces.length; i++) {
    const d = dot(qRotate(q, faces[i]!.normal), target);
    if (d < bestDot) {
      bestDot = d;
      best = i;
    }
  }
  return best;
}

/**
 * ⭐⭐ **THE ORDER THE FACES ARE ANTI-ALIGNED IN** (the owner, 2026-10-02: *"if the piece has more than 4 faces, select an order to
 * anti-align the faces. all the faces should be anti-aligned once if the piece orbits in yaw over the full yaw face alignment
 * span"*). A chain of SMALLEST TURNS: from `start` (the face anti-aligned now), each next face is the unused one whose normal is
 * closest to the current one's (the least turn), ties to the lower index — every face exactly once. One rule for any count.
 */
export function faceOrder(faces: readonly PieceFace[], start: number): number[] {
  if (start < 0 || start >= faces.length) return [];
  const order = [start];
  const used = new Set(order);
  while (order.length < faces.length) {
    const cur = faces[order[order.length - 1]!]!.normal;
    let best = -1;
    let bestDot = -Infinity;
    for (let i = 0; i < faces.length; i++) {
      if (used.has(i)) continue;
      const d = dot(cur, faces[i]!.normal);
      if (d > bestDot + 1e-9) {
        bestDot = d;
        best = i;
      }
    }
    order.push(best);
    used.add(best);
  }
  return order;
}

/**
 * ⭐ The orientation that turns face `faceIndex` (under `q`) exactly ANTI-PARALLEL to `target` by the MINIMAL turn (`shortestArc`,
 * applied on the world side), so nothing turns that need not. A face already anti-parallel returns `q`.
 */
export function antiAlignedOrientation(faces: readonly PieceFace[], faceIndex: number, q: Quat, target: Vec3): Quat {
  const f = faces[faceIndex];
  if (f === undefined) return q;
  return qmul(shortestArc(qRotate(q, f.normal), [-target[0], -target[1], -target[2]]), q);
}
