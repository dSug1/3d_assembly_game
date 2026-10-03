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
import { cross, dot, length, normalize, qFromAxisAngle, qmul, qRotate, shortestArc, sub, type Quat, type Vec3 } from "../core/vec";

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
 * ⭐⭐ prototype (green box) — **THE TWO AXES THE FACES ARE TURNED ABOUT** (the owner, 2026-10-03: *"order the logical faces as a chain
 * of yaw turns … when the cycle of yaw turns has finished … switch to a cycle of pitch turns"*). With the pink normal `n`: YAW about
 * the world vertical (made exactly perpendicular to `n`), PITCH about the horizontal axis across `n` (`n × yaw`). Both are
 * perpendicular to `n`, so a turn about either brings another face to face it. A vertical `n` (the pink ring on a top face) has
 * no vertical to yaw about: `fallback` (the camera's view) stands in. `null` only when both are along `n`.
 */
export function turnAxes(n: Vec3, up: Vec3, fallback: Vec3): { readonly yaw: Vec3; readonly pitch: Vec3 } | null {
  const perp = (v: Vec3): Vec3 | null => normalize(sub(v, [n[0] * dot(v, n), n[1] * dot(v, n), n[2] * dot(v, n)]));
  const yaw = perp(up) ?? perp(fallback);
  if (yaw === null) return null;
  const pitch = normalize(cross(n, yaw));
  return pitch === null ? null : { yaw, pitch };
}

/** ⭐ The two cycles of faces, each starting with the face anti-aligned at START: `yaw` (turned about the vertical) and `pitch`. */
export interface FaceCycles {
  readonly yaw: readonly number[];
  readonly pitch: readonly number[];
}

/**
 * ⭐⭐ prototype (green box) — **WHICH FACES A YAW TURN AND A PITCH TURN REACH, AND IN WHAT ORDER** (the owner, 2026-10-03). At START,
 * with face `start` anti-aligned (orientation `q`), each face is put by the piece's OWN axis it mostly faces — so a START turn that
 * tilts the piece does not move a face from one cycle to the other: the piece's axis nearest the yaw axis, the one nearest `n` (of
 * the two left), and the last (the pitch's). A face mostly along the YAW axis (a top, a bottom) is reached only by pitching; one along
 * the PITCH axis (a side) only by yawing; one along `n` — `start` and the face opposite it — by both. Each cycle runs in the order
 * of its faces' angle about its axis from `start`'s (one sense of turn), `start` first. ⭐ The frustum: yaw = start, a side, the
 * opposite face, the other side; pitch = start, the top, the opposite face, the bottom.
 */
export function faceCycles(
  faces: readonly PieceFace[],
  q: Quat,
  start: number,
  n: Vec3,
  axes: { readonly yaw: Vec3; readonly pitch: Vec3 },
): FaceCycles {
  if (faces[start] === undefined) return { yaw: [], pitch: [] };
  const E: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const argmax = (ks: readonly number[], f: (k: number) => number): number => ks.reduce((b, k) => (f(k) > f(b) ? k : b), ks[0]!);
  const yawLocal = argmax([0, 1, 2], (k) => Math.abs(dot(qRotate(q, E[k]!), axes.yaw)));
  const rest = [0, 1, 2].filter((k) => k !== yawLocal);
  const nLocal = argmax(rest, (k) => Math.abs(dot(qRotate(q, E[k]!), n)));
  const pitchLocal = rest.find((k) => k !== nLocal)!;
  const mostly = (i: number): number => argmax([0, 1, 2], (k) => Math.abs(faces[i]!.normal[k]!));
  const down: Vec3 = [-n[0], -n[1], -n[2]];
  const cycle = (axis: Vec3, excluded: number): number[] => {
    const angle = (i: number): number | null => {
      const w = qRotate(q, faces[i]!.normal);
      const p = sub(w, [axis[0] * dot(w, axis), axis[1] * dot(w, axis), axis[2] * dot(w, axis)]);
      if (length(p) < 1e-6) return null;
      const a = Math.atan2(dot(axis, cross(down, p)), dot(down, p));
      return a < -1e-9 ? a + 2 * Math.PI : Math.max(0, a);
    };
    const members: { i: number; a: number }[] = [];
    for (let i = 0; i < faces.length; i++) {
      if (i === start || mostly(i) === excluded) continue;
      const a = angle(i);
      if (a !== null) members.push({ i, a: a < 1e-9 ? 2 * Math.PI : a });
    }
    members.sort((x, y) => x.a - y.a || x.i - y.i);
    return [start, ...members.map((m) => m.i)];
  };
  return { yaw: cycle(axes.yaw, yawLocal), pitch: cycle(axes.pitch, pitchLocal) };
}

/**
 * ⭐ Where step `s` (whole steps from START, either sign) stands: the yaw cycle until `start` comes back, then the pitch cycle until it
 * comes back, then yaw again — period `yaw.length + pitch.length`.
 */
export function cycleStep(c: FaceCycles, s: number): { readonly face: number; readonly cycle: "YAW" | "PITCH"; readonly index: number } {
  const m = c.yaw.length;
  const P = m + c.pitch.length;
  if (P === 0) return { face: -1, cycle: "YAW", index: 0 };
  const r = ((s % P) + P) % P;
  return r < m ? { face: c.yaw[r]!, cycle: "YAW", index: r } : { face: c.pitch[r - m]!, cycle: "PITCH", index: r - m };
}

/** ⭐ The orientation for each face of each cycle, index 0 the START pose itself (`cycleTargets`). */
export interface CycleTargets {
  readonly yaw: readonly Quat[];
  readonly pitch: readonly Quat[];
}

/**
 * ⭐⭐ **EVERY FACE'S ORIENTATION, COMPUTED ONCE AT START FROM THE START POSE** (`q0`): a yaw-cycle face is `q0` turned about the yaw
 * axis, a pitch-cycle face `q0` turned about the pitch axis (`turnAbout`). ⛔ Not step upon step: a slanted face's correction tilts the
 * piece, and the next yaw turn about the vertical then ran on a tilted piece — the corrections piled up (an axis moved 66° in one
 * step) and the cycle did not come back. From `q0`, nothing compounds: the start face's orientation IS `q0`, exactly, every lap.
 */
export function cycleTargets(
  faces: readonly PieceFace[],
  q0: Quat,
  n: Vec3,
  axes: { readonly yaw: Vec3; readonly pitch: Vec3 },
  c: FaceCycles,
): CycleTargets {
  const along = (cycle: readonly number[], axis: Vec3): Quat[] => cycle.map((f, k) => (k === 0 ? q0 : turnAbout(faces, f, q0, n, axis, true)));
  return { yaw: along(c.yaw, axes.yaw), pitch: along(c.pitch, axes.pitch) };
}

/** ⭐ The orientation step `s` stands at (`cycleStep`'s face, from `cycleTargets`) — `null` with no cycle. */
export function targetAtStep(c: FaceCycles, t: CycleTargets, s: number): Quat | null {
  const at = cycleStep(c, s);
  if (at.face < 0) return null;
  return (at.cycle === "YAW" ? t.yaw[at.index] : t.pitch[at.index]) ?? null;
}

/**
 * ⭐⭐ **ONE FACE'S TURN FROM `q`** (the START pose, `cycleTargets`): about `axis` (the yaw's or the pitch's), by the angle that brings face `faceIndex`'s normal (its part across
 * the axis) onto `−n` — `forward` in the cycles' sense, else back — then the small correction that makes it EXACTLY anti-parallel
 * (`antiAlignedOrientation`; a face tilted off the axis's plane). ⛔ Not the minimal turn alone: a half-turn's minimal axis is any
 * perpendicular, which would flip the piece about the wrong one.
 */
export function turnAbout(faces: readonly PieceFace[], faceIndex: number, q: Quat, n: Vec3, axis: Vec3, forward: boolean): Quat {
  const f = faces[faceIndex];
  if (f === undefined) return q;
  const w = qRotate(q, f.normal);
  const p = sub(w, [axis[0] * dot(w, axis), axis[1] * dot(w, axis), axis[2] * dot(w, axis)]);
  if (length(p) < 1e-9) return antiAlignedOrientation(faces, faceIndex, q, n);
  const down: Vec3 = [-n[0], -n[1], -n[2]];
  const phi = Math.atan2(dot(axis, cross(down, p)), dot(down, p));
  const twoPi = 2 * Math.PI;
  const fwd = ((phi % twoPi) + twoPi) % twoPi;
  const ahead = fwd < 1e-9 ? 0 : forward ? fwd : fwd - twoPi;
  return antiAlignedOrientation(faces, faceIndex, qmul(qFromAxisAngle(axis, -ahead), q), n);
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

/**
 * ⭐ prototype (green box) — **THE YAW ORBIT IS SLOWER OUTSIDE THE GUIDE SPHERE** (the owner, 2026-10-02: *"when the green piece is
 * outside the white sphere: reduce the green box yaw orbit gain to 40% of its value"*): the factor on the yaw gain — `share` outside,
 * 1 inside. ⭐ It is part of the yaw RATE, so `DeltaXYawPerFace` grows with it (more dx per face outside).
 */
export function outsideYawShare(outside: boolean, share: number): number {
  return outside ? share : 1;
}

/** ⭐ Perlin's smootherstep (2002, public domain): 0 → 1 over [0, 1] with zero first AND second derivative at both ends. */
function smootherstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (6 * x - 15) + 10);
}

/** ⭐ ∫₀ᵗ f(π/2 · smootherstep(u)) du by Simpson's rule — the share of a blend window one angle receives. */
function blendIntegral(f: (a: number) => number, t: number): number {
  const n = 32;
  const h = Math.min(1, Math.max(0, t)) / n;
  if (!(h > 0)) return 0;
  let sum = 0;
  for (let i = 0; i <= n; i++) sum += (i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2) * f((Math.PI / 2) * smootherstep(i * h));
  return (sum * h) / 3;
}

/**
 * ⭐⭐ prototype (green box) — **THE STAIRCASE IN THE (YAW, PITCH) PLANE, ITS CORNERS ROUNDED** (the owner, 2026-10-03: *"Dx rotates the
 * green piece around yaw in world axis and then, once the yaw has done 360 degrees, transitions to rotation in pitch and then, once
 * pitch has done 360 degrees, transitions to rotation in yaw again … The transitions shall be done as per a 2D curve … so that there is
 * a smooth blend between yaw / pitch rotations"* — the proposal accepted: *"build"*). `sDeg` is the accumulated rotation; the yaw
 * angle α and the pitch angle β run a staircase — pure yaw, a blend, pure pitch, a blend — and in each blend window of `blendDeg` of
 * `s` the speed is shared cos θ to the outgoing angle and sin θ to the incoming one, θ easing 0 → 90° on a smootherstep: the total
 * turn speed is constant and the turning axis glides with continuous speed and acceleration. (Linear segments with smooth blends —
 * Craig, *Introduction to Robotics*; CNC corner rounding — with α and β as the two joints.) ⭐ Each pure segment is shortened by
 * exactly what the two windows give its angle (`L = 360 − 2·W·C`, C = the window's share), so EACH LAP ADDS EXACTLY 360° TO BOTH:
 * the piece comes back to its START pose every period, and `s` going back retraces it exactly. `s = 0` starts the pure yaw.
 */
export function staircaseAngles(sDeg: number, blendDeg: number): { readonly yawDeg: number; readonly pitchDeg: number } {
  const { C, W, L, P } = staircaseLap(blendDeg);
  const k = Math.floor(sDeg / P);
  const m = sDeg - k * P;
  const lap = 360 * k;
  if (m < L) return { yawDeg: lap + m, pitchDeg: lap };
  if (m < L + W) {
    const t = (m - L) / W;
    return { yawDeg: lap + L + W * blendIntegral(Math.cos, t), pitchDeg: lap + W * blendIntegral(Math.sin, t) };
  }
  if (m < 2 * L + W) return { yawDeg: lap + L + W * C, pitchDeg: lap + W * C + (m - L - W) };
  const t = (m - 2 * L - W) / W;
  return { yawDeg: lap + L + W * C + W * blendIntegral(Math.sin, t), pitchDeg: lap + W * C + L + W * blendIntegral(Math.cos, t) };
}

/** ⭐ The staircase's lap: the window's share `C`, the window `W`, the pure segment `L` and the lap `P` = 2L + 2W (all in `s`). */
function staircaseLap(blendDeg: number): { readonly C: number; readonly W: number; readonly L: number; readonly P: number } {
  const C = blendIntegral(Math.cos, 1); // = the sin share too: smootherstep is symmetric
  const W = Math.min(Math.max(0, blendDeg), 180 / C); // the pure segments never go negative
  const L = 360 - 2 * W * C;
  return { C, W, L, P: 2 * L + 2 * W };
}

/**
 * ⭐ prototype (green box) — **THE TURN PER DEGREE OF ORBIT YAW** (the owner, 2026-10-03: *"green piece rotation gain: instead of deg per
 * input mm, do it in orbit rotation yaw angle required to complete the full cycle (yaw and pitch 360 degree rotation of the green
 * piece)"*): one lap of the staircase (`2L + 2W` of `s`: 720 with no blend) over `cycleOrbitYawDeg` of orbit yaw.
 */
export function staircasePerOrbitDeg(blendDeg: number, cycleOrbitYawDeg: number): number {
  return cycleOrbitYawDeg > 0 ? staircaseLap(blendDeg).P / cycleOrbitYawDeg : 0;
}

/**
 * ⭐ The orientation at `sDeg`: `Pitch(β) · Yaw(α) · q0` — yaw about `yawAxis` (the world vertical) applied first, the pitch about
 * `pitchAxis` after. In a pure segment the other angle sits on a whole number of turns, so the motion is pure world yaw or pure pitch.
 */
export function staircaseOrientation(q0: Quat, sDeg: number, blendDeg: number, yawAxis: Vec3, pitchAxis: Vec3): Quat {
  const a = staircaseAngles(sDeg, blendDeg);
  return orientationAt(q0, a.yawDeg, a.pitchDeg, yawAxis, pitchAxis);
}

/** ⭐ `Pitch(β) · Yaw(α) · q0` — the yaw first, about `yawAxis`; the pitch after, about `pitchAxis`. Degrees. */
export function orientationAt(q0: Quat, yawDeg: number, pitchDeg: number, yawAxis: Vec3, pitchAxis: Vec3): Quat {
  const D = Math.PI / 180;
  return qmul(qFromAxisAngle(pitchAxis, pitchDeg * D), qmul(qFromAxisAngle(yawAxis, yawDeg * D), q0));
}

/**
 * ⭐⭐ prototype (green box) — **HOW MANY PRIMARY FACES SCROLL PAST IN A 360° YAW, AND IN A 360° PITCH** (the owner, 2026-10-03: *"based
 * on the numbers of primary faces computed at boot for the green piece, identify the number of primary faces which scroll during a 360
 * degree yaw and the number … during a 360 degree pitch, and divide 360 degree by these two: this gives the angle increment for yaw and
 * the angle increment for pitch"*). From the level start pose `q0`, the face cycles' own rule (`faceCycles`): a face mostly along the
 * yaw axis (a top, a bottom) never comes round in a yaw, one mostly along the pitch axis never in a pitch. The face toward the pink side
 * (`n`, across both axes) starts both. The frustum: 4 and 4 → 90° and 90°. 0 faces → a whole turn.
 */
export function scrollIncrements(
  faces: readonly PieceFace[],
  q0: Quat,
  yawAxis: Vec3,
  pitchAxis: Vec3,
): { readonly yawFaces: number; readonly pitchFaces: number; readonly yawStepDeg: number; readonly pitchStepDeg: number } {
  const n = normalize(cross(yawAxis, pitchAxis));
  if (faces.length === 0 || n === null) return { yawFaces: 0, pitchFaces: 0, yawStepDeg: 360, pitchStepDeg: 360 };
  const c = faceCycles(faces, q0, mostAntiAligned(faces, q0, n), n, { yaw: yawAxis, pitch: pitchAxis });
  const step = (k: number): number => (k > 0 ? 360 / k : 360);
  return { yawFaces: c.yaw.length, pitchFaces: c.pitch.length, yawStepDeg: step(c.yaw.length), pitchStepDeg: step(c.pitch.length) };
}

/** ⭐ An angle snapped to the NEAREST whole increment (degrees) — the same going and coming back. */
export function snapAngle(deg: number, stepDeg: number): number {
  return stepDeg > 0 ? Math.round(deg / stepDeg) * stepDeg : deg;
}

/**
 * ⭐ prototype (green box) — **THE LEVEL POSE WITH `q`'s HEADING** (the owner, 2026-10-03: *"no pitch mixed with yaw when rotation is on
 * yaw"*): a turn about the world vertical only, by the heading of the piece's own x axis (its z when x stands vertical) — the rest pose
 * (identity, the piece upright) turned to face where `q` faces. The continuous turn starts from it, so a yaw is never a tilted spin.
 */
export function levelHeading(q: Quat): Quat {
  const x = qRotate(q, [1, 0, 0]);
  const z = qRotate(q, [0, 0, 1]);
  const psi = Math.hypot(x[0], x[2]) > 1e-6 ? Math.atan2(-x[2], x[0]) : Math.atan2(z[0], z[2]);
  return qFromAxisAngle([0, 1, 0], psi);
}

/**
 * ⭐⭐ prototype (green box) — **ONE ORBIT AXIS MOVING WIDENS THE OTHER'S DEADBAND** (the owner, 2026-10-03: *"when the green piece is
 * outside the white sphere: when dx is outside the deadband, increase the deadband for dy. Revert back when dx is inside the deadband.
 * When dy is outside the deadband, increase the deadband for dx …"*). The factor on each axis's dead radius for the next sample: `factor`
 * on y while x is MOVING, on x while y is MOVING, else 1 — and 1 on both unless `active` (outside the sphere, the switch on).
 */
export function crossDeadbandScales(
  xMoving: boolean,
  yMoving: boolean,
  active: boolean,
  factor: number,
): { readonly x: number; readonly y: number } {
  const f = active && factor > 1 ? factor : 1;
  return { x: yMoving ? f : 1, y: xMoving ? f : 1 };
}
