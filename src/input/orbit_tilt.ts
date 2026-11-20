/**
 * ⭐⭐⭐ (2026-11-10, POLAR_ORBIT_CLEANUP.md §9.4 — the owner's TILTED POLE: *"when the left click or finger is pressed for orbiting, the orbit tilts so the
 * face currently holding the gizmo becomes the one with the red and green sections which are perpendicular"*; the decisions 1 (c), 2 (a), 3 (a), 4 the
 * "no camera roll" rule removed) — **THE ORBIT'S FRAME**: one rotation between the orbit's angles and the world.
 *
 * * The orbit's angles (yaw, pitch) and the face map live in a frame F; `map` turns F into the world (the face map is BUILT in F: the faces turned by its
 *   transpose, `tiltFaces`) and the orbit's DIRECTIONS (the piece, the camera). ⛔ (2026-11-16, step 2.5) the press's swing (`swingDir`, a `dir` of its
 *   own) deleted with the game before the charts: the heading's turn is the charts' one camera turn (`seam_turn.ts`).
 * * **At a press on a cap** (`capTilt`): the tilt about the world horizontal axis square to the SNAPPED heading (`snapHeading`, 1 (c)), 90°, the cap's
 *   normal turned onto that heading in F — the cap is a SIDE there (the red straight away from the viewer, the green straight across). A tilt about an axis
 *   square to the heading never rolls the view (`offsetFrame` is the same in both frames — vectored).
 * * **Off the face**: the world's frame again at once, the camera turned by the charts' one transition at `tiltRollDegS` (`rollDurationMs`) — ⛔ (step 2.5)
 *   the roll back of the game before the charts (`rollStep`, `tiltUnderWay`, `tiltExits`, the camera's frame by `frameMix`) deleted. ONE speed for every
 *   turn.
 * ⛔⛔⛔ (2026-11-15, the owner: *"cancel my rule and remove the press action on the orbit"*, `ORBIT_CHARTS.md` §11.1) a press no longer tilts: the tilt
 *   is made close in only, by itself (the automatic tilt, `tiltAutoLatch`) — every function here still serves it (`capTilt`, `snapHeading`).
 * ⛔ ENGINE-FREE. Rotation matrices, Rodrigues' formula, a smoothstep — textbook; no licence, no patent.
 */
import { cross, dot, type Vec3 } from "../core/vec";
import type { MapFace } from "./face_map";
import type { ShellBox } from "./orbit_shell";
import { vOfPitch } from "./assembly_orbit";
import { edgeShare } from "./orbit_calm";

/** ⭐ A 3 × 3 rotation, by ROWS: `mulM(R, v)` turns `v`. */
export type Mat3 = readonly [Vec3, Vec3, Vec3];

/** ⭐ `R · v` */
export function mulM(R: Mat3, v: Vec3): Vec3 {
  return [dot(R[0], v), dot(R[1], v), dot(R[2], v)];
}

/** ⭐ `Rᵀ · v` (the inverse turn) */
export function mulT(R: Mat3, v: Vec3): Vec3 {
  return [R[0][0] * v[0] + R[1][0] * v[1] + R[2][0] * v[2], R[0][1] * v[0] + R[1][1] * v[1] + R[2][1] * v[2], R[0][2] * v[0] + R[1][2] * v[1] + R[2][2] * v[2]];
}

/** ⭐ `A · B` */
/** ⭐ The turn by `th` about the unit axis `a` (Rodrigues). */
export function axisAngle(a: Vec3, th: number): Mat3 {
  const l = Math.hypot(a[0], a[1], a[2]);
  const [x, y, z] = l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0];
  const c = Math.cos(th);
  const s = Math.sin(th);
  const C = 1 - c;
  return [
    [c + x * x * C, x * y * C - z * s, x * z * C + y * s],
    [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
    [z * x * C - y * s, z * y * C + x * s, c + z * z * C],
  ];
}

/** ⭐ `v` turned by `th` about the unit axis `a` (Rodrigues). */
export function rotateAbout(v: Vec3, a: Vec3, th: number): Vec3 {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const k = dot(a, v) * (1 - c);
  const x = cross(a, v);
  return [v[0] * c + x[0] * s + a[0] * k, v[1] * c + x[1] * s + a[1] * k, v[2] * c + x[2] * s + a[2] * k];
}

const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** ⭐ A heading (the orbit's convention: x = cos, z = sin) snapped onto the nearest world axis — a multiple of 90° (1 (c)). */
export function snapHeading(h: number): number {
  return Math.round(h / (Math.PI / 2)) * (Math.PI / 2);
}

/**
 * ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §5 RC2, F2c) THE TILT'S HEADING for a face of normal `n` holding a pole, the orbit at `yaw`: a SLANTED face (its
 * normal with a horizontal part) its OWN heading, snapped — tilted by its own angle toward it, never past the vertical; a LEVEL one (no heading) the
 * orbit's, snapped (1 (c), as before). ⛔ Always the orbit's: from the heptagon's front its back top face, leaning away, needed 116° — the view upside down.
 */
export function tiltHeading(n: Vec3, yaw: number): number {
  return Math.hypot(n[0], n[2]) > TILT_SLANT_MIN ? snapHeading(Math.atan2(n[2], n[0])) : snapHeading(yaw);
}
/** ⭐ (F2c) a normal's horizontal part beyond this (sin ≈ 0.06°) is a slanted face's heading — below it the face is level (a box's cap: exactly 0). */
export const TILT_SLANT_MIN = 1e-3;

/**
 * ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §8 — the owner: *"just give an hysteresis of the dy: the dy upwards is blocked until a certain band is reached in
 * the face beyond but dx and dy downwards are allowed (the reverse for dy if the pole-holding edge was at the nadir). This will also be OK in case of the
 * cube of scene 1"*) **THE HOLD AFTER A POLE-HOLDING FACE'S FAR EDGE**: the dy SIGN that crossed (`sign`, the finger's) is held until the finger has gone
 * `band` mm the other way (`edgeHoldFinger`; ⛔ 2026-11-14 the gizmo's depth in the face beyond) — dx and the other dy free. ⛔ Without it a finger still
 * pushing the same way went straight back over the edge in the turned frame: the heptagon's ridge bounced the gizmo between its two top faces (60
 * back-and-forths in the walks). Set by the one event (`crossTurn`'s hold: `crossingEvent`, `crossingHold`) — ⛔ (2026-11-16, step 2.5) `edgeHoldAt` (left
 * over the edge away from the tilt's snapped heading) deleted with the game before the charts.
 */
export interface EdgeHold {
  /** the dy sign held (the finger's that crossed) — ⛔ (2026-11-16, step C5) `g0` (where it crossed) and `d` (into the face beyond) deleted: read by nothing */
  readonly sign: 1 | -1;
  /**
   * ⭐⭐⭐ (2026-11-18, `DY_HOLD_REVERSAL.md` §5 – §6) how far the finger is BACK the other way from the farthest point it reached the held way (mm) — the
   * hold ends at `edgeHoldMm` of it (`edgeHoldFinger`). ⛔ (2026-11-14) the finger's travel the other way SUMMED: a wobble added up (±2.5 mm → 21 mm in
   * 6 swings, the finger never reversed)
   */
  readonly back: number;
  /**
   * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB2) THE PUSH HELD AS THE PLAYER SEES IT: a unit direction on the glass he sees (`[right, up]`, the raw
   * finger's, before any conversion) — the logic's `sign` (`[0, sign]` on the logic's glass) as the picture drew it when it crossed. Absent: `[0, sign]`
   * (law U off: the picture is the logic's pose — today's dy hold, bit for bit).
   */
  readonly dir?: readonly [number, number];
}
/**
 * ⭐⭐⭐ (2026-11-19, `UPRIGHT_PICTURE.md` §12 RB2) THE HOLD APPLIED ON THE RAW FINGER, before the finger is turned onto the logic's glass: the part of the move
 * along the held direction (`dir`; absent: the dy of its sign — `edgeHoldDy`, bit for bit) blocked, the rest passes. None: the move as it is.
 */
export function edgeHoldGlass(h: EdgeHold | null, dx: number, fdy: number): { readonly dx: number; readonly fdy: number } {
  if (h === null) return { dx, fdy };
  const d = h.dir;
  if (d === undefined) return { dx, fdy: edgeHoldDy(h, fdy) };
  const a = dx * d[0] + fdy * d[1];
  return a > 0 ? { dx: dx - a * d[0], fdy: fdy - a * d[1] } : { dx, fdy };
}
/** ⭐⭐⭐ (RB2) the raw finger's move along the hold, signed as `edgeHoldFinger` reads it (the held way of the hold's `sign`): no `dir` — the dy itself. */
export function edgeHoldAlong(h: EdgeHold, dx: number, fdy: number): number {
  const d = h.dir;
  return d === undefined ? fdy : h.sign * (dx * d[0] + fdy * d[1]);
}
/** ⛔ (2026-11-14) `edgeHoldDepth` (the release by the gizmo's depth on the SURFACE) deleted — the release is the finger's (`edgeHoldFinger`). */
/**
 * ⭐⭐⭐ (2026-11-14, the owner: *"the dy in the same direction is hold until the dy in the opposite direction hits the hysteresis threshold"*) THE HOLD'S
 * HYSTERESIS ON THE FINGER: a finger dy of `dyMm` (mm, signed as the hold's `sign`). ⭐⭐⭐ (2026-11-18, `DY_HOLD_REVERSAL.md` §6) a TRUE hysteresis on the
 * finger's place along its dy: the other way moves it back (`back` grows), the held way moves it forward again (`back` shrinks, never under 0); at
 * `bandMm` back from its farthest point the hold ends (`null`) — a clear reversal, the same at every distance; a wobble swinging less than the band never
 * ends it. ⛔ (2026-11-14) the other way only, summed, the forward pushes changing nothing: a wobble released it. ⛔ The gizmo's depth in the face beyond
 * (`edgeHoldDepth`, 2026-11-12): the same as the finger only close in — far out a finger mm is 13 – 21 mm of surface.
 */
export function edgeHoldFinger(h: EdgeHold, dyMm: number, bandMm: number): EdgeHold | null {
  if (!(dyMm !== 0)) return h;
  if (Math.sign(dyMm) === h.sign) return h.back > 0 ? { ...h, back: Math.max(0, h.back - Math.abs(dyMm)) } : h;
  const back = h.back + Math.abs(dyMm);
  return back >= bandMm ? null : { ...h, back };
}
/**
 * ⭐⭐⭐ (2026-11-18, `DY_HOLD_REVERSAL.md` §5.2, §5.3) THE DY THAT PUSHES NOW (`asmDySign`, the sign a crossing may hold — D-T4: only the dy that pushed the
 * gizmo over the edge): a finger step with a dy — its sign; a step with a dx and no dy (the per-axis deadband: a sideways move) — none; a still step —
 * unchanged (a finger resting keeps pushing). The gesture's end sets none (`gestureOver`): with no finger down nothing pushes. ⛔ The finger's LAST dy
 * sign, kept for ever: a crossing made by a dx round a tip, by the coast, or read at the camera's place a frame after the lift held that old dy.
 */
export function dySignPushing(prev: number, dx: number, dy: number): number {
  if (dy !== 0) return Math.sign(dy);
  if (dx !== 0) return 0;
  return prev;
}
/**
 * ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` C6 — packet E) THE DX THAT PUSHES NOW, on the glass he sees (the raw finger): a step with a dx — its sign; a step
 * with a dy and no dx — none; a still step — unchanged. The gesture's end sets none. Read only where a crossing made by a dx opens a half turn (`carriedHold`).
 */
export function dxSignPushing(prev: number, dx: number, dy: number): number {
  if (dx !== 0) return Math.sign(dx);
  if (dy !== 0) return 0;
  return prev;
}
/**
 * ⭐⭐⭐ (2026-11-18, `DY_HOLD_REVERSAL.md` §5.3) THE HOLD AFTER A HALF-TURN EVENT (`crossTurn`): the event's own (`hold`: the sign that crossed, 0: none) —
 * it REPLACES any hold still on: the hold guards the way back over the LAST edge crossed. ⛔ A hold of 0 left the older hold on: round a tip (a crossing
 * made by the finger's dx) the zenith's hold went on blocking the dy on the tip's triangle.
 */
export function holdAtCrossing(hold: 1 | -1 | 0): EdgeHold | null {
  return hold === 0 ? null : { sign: hold, back: 0 };
}
/** ⭐⭐⭐ (§8) the finger's dy under the hold: its held sign none, the other whole. */
export function edgeHoldDy(h: EdgeHold | null, dy: number): number {
  return h !== null && Math.sign(dy) === h.sign ? 0 : dy;
}

/**
 * ⭐⭐⭐ THE TILT ON A FACE HOLDING A POLE (1 (c)): F → world, about the world's horizontal axis square to the heading `hs` (snapped) — ⭐ no roll, whatever
 * the angle (vectored) — by the angle that lays the face's normal `n` HORIZONTAL in F, toward `hs`: the face a SIDE facing the camera. ⭐⭐ (2026-11-10, the
 * owner: *"fix the gap"* — *"there will be cases where poles are held by edges or slanted faces"*) the face's OWN angle: 90° a level top (−90° a level
 * bottom), 60° a horizontally extruded hexagon's slanted face toward the camera, 120° one slanting away (⛔ a quarter turn always: a slanted face holding a
 * pole was left 30° short of square). `n` off the heading's vertical plane: its part in that plane laid horizontal — still a side in F.
 */
export function capTilt(hs: number, n: Vec3): Mat3 {
  const hh: Vec3 = [Math.cos(hs), 0, Math.sin(hs)];
  const y: Vec3 = [0, 1, 0];
  // R·hh = cos θ·hh + sin θ·y about a = hh × y (a × hh = y): θ the angle of `n` from `hh` in the plane of hh and y ⇒ Rᵀ·n horizontal, along hh
  return axisAngle(cross(hh, y), Math.atan2(n[1], dot(n, hh)));
}

/** ⭐ The swing's ease over its time share (smoothstep): starting and ending at rest — the gizmo's relocation's (`gOffStep`). */
export function swingEase(s: number): number {
  const x = Math.min(1, Math.max(0, s));
  return x * x * (3 - 2 * x);
}

/**
 * ⭐ A direction's orbit angles (yaw, ring parameter `v`) — straight above / below (no heading to read) the yaw is `poleYaw` (absent: `yawHint`).
 * ⭐⭐⭐ (2026-11-15) `poleYaw`, the heading the camera SHOWS — ⛔ the hint: a tilt left with the orbit exactly at the world's pole took the orbit's own
 * hint, 0, and the view rolled to yaw 0 in ONE frame (probed in the app: 90° on `Scene_1`'s top, the automatic tilt switched off by the approach; 157°
 * on `Scene_0`'s ridge under the charts' layout).
 */
export function anglesOfDir(d: Vec3, yawHint: number, poleYaw: number = yawHint): { readonly yaw: number; readonly v: number } {
  const l = Math.hypot(d[0], d[1], d[2]);
  const u: Vec3 = l > 1e-12 ? [d[0] / l, d[1] / l, d[2] / l] : [1, 0, 0];
  const flat = Math.hypot(u[0], u[2]);
  const yaw = flat > 1e-9 ? yawHint + wrapPi(Math.atan2(u[2], u[0]) - yawHint) : poleYaw;
  return { yaw, v: vOfPitch(Math.asin(Math.max(-1, Math.min(1, u[1])))) };
}

/** ⭐ A frame's direction in the world (`null`: the world's own). */
export function tiltDir(R: Mat3 | null, v: Vec3): Vec3 {
  return R === null ? v : mulM(R, v);
}

/** ⭐ A face in F: its normal, centre and triangles turned by `Rᵀ` (`R`: F → world). */
export function tiltFaces(faces: readonly MapFace[], R: Mat3): MapFace[] {
  return faces.map((f) => ({
    ...f,
    normal: mulT(R, f.normal),
    centre: mulT(R, f.centre),
    tris: f.tris.map((t) => [mulT(R, t[0]), mulT(R, t[1]), mulT(R, t[2])] as const),
  }));
}

/** ⭐ A box in F: the bounds of its eight corners turned by `Rᵀ`. */
export function tiltBox(b: ShellBox, R: Mat3): ShellBox {
  const lo: [number, number, number] = [Infinity, Infinity, Infinity];
  const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const x of [b.lo[0], b.hi[0]])
    for (const y of [b.lo[1], b.hi[1]])
      for (const z of [b.lo[2], b.hi[2]]) {
        const p = mulT(R, [x, y, z]);
        for (const k of [0, 1, 2] as const) {
          lo[k] = Math.min(lo[k], p[k]);
          hi[k] = Math.max(hi[k], p[k]);
        }
      }
  return { lo, hi };
}

/**
 * ⭐ (C2W, W7) `frameBox`: a bound of the parts' own box in F within this (m) of the turned world box's is the same bound — float noise of the turn (a
 * 90° tilt's cosine is 6e-17, not 0), kept at the turned box's number so an axis-aligned shape's map is built bit for bit as before.
 */
export const FRAME_BOX_NOISE_M = 1e-9;

/**
 * ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §16 — package C2W, W7) THE BOX A FRAME'S MAP IS BUILT IN: the placed parts' own box READ IN F — the world
 * map's rule (the parts' box, `shellBox`) in the frame's own axes: the bounds of every part's vertex turned by `Rᵀ`; a bound within `FRAME_BOX_NOISE_M`
 * of the turned world box's (`tiltBox`) that number exactly. ⛔ `tiltBox` alone (the world box's eight corners turned): for a frame off the world's
 * axes (a cap turned 30°, 45°) a box looser than the shape — the map's share test read its faces against planes the shape does not reach. ⚠ The parts'
 * vertices, never the contour's corners: the contour is the main planes' polytope and leaves a proud part outside. No vertex: `tiltBox`.
 */
export function frameBox(b: ShellBox, R: Mat3, parts: readonly (readonly Vec3[])[]): ShellBox {
  const t = tiltBox(b, R);
  const lo: [number, number, number] = [Infinity, Infinity, Infinity];
  const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const vs of parts)
    for (const v of vs) {
      const p = mulT(R, v);
      for (const k of [0, 1, 2] as const) {
        lo[k] = Math.min(lo[k], p[k]);
        hi[k] = Math.max(hi[k], p[k]);
      }
    }
  if (!(lo[0] <= hi[0])) return t;
  for (const k of [0, 1, 2] as const) {
    if (lo[k] - t.lo[k] <= FRAME_BOX_NOISE_M) lo[k] = t.lo[k];
    if (t.hi[k] - hi[k] <= FRAME_BOX_NOISE_M) hi[k] = t.hi[k];
  }
  return { lo, hi };
}


/**
 * ⭐⭐⭐ THE CALM WHOLE TOWARD THE TILTED FACET'S EDGES (its every edge is a frame change: off it the world's frame): the shares (0 … 1) over the calm's own
 * edge zones (`edgeShare` with no interior: `zoneHPct` along `t`, `zoneVPct` along `b`). ⛔ Forced only by the exit's share (the 10° band): the piece caught
 * up its calmed angle in two or three input steps (the probe: 957 mm in a frame). ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm
 * prevented"*) in TWO parts (⛔ their larger, for both shares: the horizontal calm released toward the `b` ends too): `h` toward the edges ACROSS (a turn
 * about the facet's `b` — off it to a world's side: both shares whole), `v` toward its `b` ends (a turn about its `h`, the edge's own line — the vertical
 * share alone whole: the horizontal calm carried over, `shownDirAcross`).
 */
export function tiltCalmWholeHV(
  t: { readonly surface: Vec3; readonly across: { readonly L: number; readonly lo: number; readonly hi: number } },
  f: { readonly b: Vec3; readonly bLo: number; readonly bHi: number },
  z: { readonly zoneHPct: number; readonly zoneMinHM: number; readonly zoneVPct: number; readonly zoneMinVM: number },
): { readonly h: number; readonly v: number } {
  const L = t.across;
  const h = edgeShare(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, 0, z.zoneHPct, z.zoneMinHM);
  const sb = dot(t.surface, f.b);
  const v = edgeShare(Math.min(sb - f.bLo, f.bHi - sb), f.bHi - f.bLo, 0, z.zoneVPct, z.zoneMinVM);
  return { h, v };
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"why is there a back-and-forth jump of the scene when the gizmo crosses an edge"*) THE CALM WHOLE TOWARD A FACE HOLDING A
 * POLE, close in (the automatic tilt on): on a side facet, the share (0 … 1) bringing both of the calm's shares to 1 toward its `b` end(s) that border a
 * face holding a pole (`lo`, `hi`) — the calm's own vertical edge zone (`edgeShare`, no interior). ⭐ Applied to the SHOWN direction, by position, never
 * eased: ⛔ the calm's eased shares lagged a fast finger (0.78 at the edge), released in time on the face holding the pole (the piece surged, 116 mm a
 * frame against 40), then the tilted face's calm took hold again (20 mm) — forth and back at every crossing.
 */
export function poleEdgeWhole(
  surface: Vec3,
  f: { readonly b: Vec3; readonly bLo: number; readonly bHi: number },
  lo: boolean,
  hi: boolean,
  zoneVPct: number,
  zoneMinVM: number,
): number {
  if (!lo && !hi) return 0;
  const s = dot(surface, f.b);
  const d = Math.min(lo ? s - f.bLo : Infinity, hi ? f.bHi - s : Infinity);
  return edgeShare(Math.max(0, d), f.bHi - f.bLo, 0, zoneVPct, zoneMinVM);
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"when i cross the edge … a sort of shake of the scene"* — *"make sure those fixes address deep root causes"*) THE CALM'S
 * WHOLE SHARE ON THE RIG'S OWN TIME LAW: the share by position (`target`: `poleEdgeWhole`, `tiltCalmWholeHV`, a cap's 1) eased by the SAME lag as the gizmo
 * the piece and the camera's look follow (`tauMs`, `gizmoEaseMs`). ⛔ Applied at once (§9.6) the camera's DIRECTION answered a finger event in its frame
 * while its look target followed 45 ms behind — in the edge zone, where the share's slope turns a mm of gizmo into ~4× the camera's angle, the image
 * leapt forward then slipped back on every event (probed: 4.5 – 7.7° in one frame, then 0.1° back); ⛔ eased by the calm's own 120 ms (far out, before),
 * it fell behind the finger and caught up on the cap (the camera's pitch rate doubled at the edge). `tauMs` 0: the target.
 */
export function wholeShareStep(prev: number, target: number, dtMs: number, tauMs: number): number {
  if (!(tauMs > 0)) return target;
  return prev + (target - prev) * (1 - Math.exp(-Math.max(0, dtMs) / tauMs));
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"the tilt shall happen when the red section reaches the edge at the bottom of the mouth, therefore the green section should
 * not be an issue"* → *"build b"*) THE MOUTH'S HAND-OVER: a void open up the facet to its edge (`mouth` — the top's channel seen from the front) is the NEXT
 * facet's on the red's travel, the plane's on the green's. So the gizmo is HELD at its last place before the mouth while a dy carries it toward the open
 * end (`dPitch` toward `hi` / `lo`, the larger of the two steps) — there the red has reached the void's floor edge: the hand-over (the automatic tilt);
 * a dx (the yaw's step the larger) lets it go — on the bridge, the green straight across (§8.3). No step: as it was. ⛔ The plane's bridge on a dy too: the
 * red climbed the mouth to the box's corner (487 mm over a 466 mm floor), then dropped onto the floor at the tilt.
 */
export function mouthHold(wasHeld: boolean, mouth: { readonly lo: boolean; readonly hi: boolean } | null | undefined, dPitch: number, dYaw: number): boolean {
  if (mouth === null || mouth === undefined) return false;
  if (dPitch === 0 && dYaw === 0) return wasHeld;
  if (Math.abs(dYaw) > Math.abs(dPitch)) return false;
  return (mouth.hi && dPitch > 0) || (mouth.lo && dPitch < 0);
}

/**
 * ⭐⭐⭐ (2026-11-10, branch `1.0.120b-`, the owner: *"do we need a calm when the automatic tilt is toggled on? … on orthogonal red-green sections, we already
 * have a mechanism to cross the edges"* → *"build the square camera close in"*) THE SQUARE CAMERA'S TURN, one frame: the camera's direction `n` turned
 * toward the gizmo's face's normal `target` at ONE SPEED (`degS`, the tilts' — 90° in 0.25 s at 360°/s), about their common perpendicular (`fallback`
 * when they are opposite). Every edge is then a frame change: a vertical edge a 90° turn, a top / bottom edge the tilt's (the camera square already: no
 * swing). `null` target: as it is.
 */
export function squareTurn(n: Vec3, target: Vec3 | null, dtMs: number, degS: number, fallback: Vec3): Vec3 {
  if (target === null) return n;
  const c = Math.max(-1, Math.min(1, dot(n, target)));
  const ang = Math.acos(c);
  if (ang < 1e-9) return target;
  const step = degS > 0 ? Math.min(ang, (degS * Math.PI) / 180 * (Math.max(0, dtMs) / 1000)) : ang;
  if (step >= ang - 1e-12) return target;
  let ax = cross(n, target);
  let l = Math.hypot(ax[0], ax[1], ax[2]);
  if (l < 1e-9) {
    ax = fallback;
    l = Math.hypot(ax[0], ax[1], ax[2]);
  }
  return rotateAbout(n, [ax[0] / l, ax[1] / l, ax[2] / l], step);
}

/** ⭐ (`1.0.120b-`) the square camera still turning: more than half a degree from its face's normal — the gizmo held meanwhile (as a tilt's). */
export function squareTurning(n: Vec3 | null, target: Vec3 | null, q: number): boolean {
  if (n === null || target === null || !(q > 0.5)) return false;
  return dot(n, target) < Math.cos((0.5 * Math.PI) / 180);
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"at far distance it is disabled, at close distance (… make a slider) it toggles on automatically"* — then *"instead Percent
 * use m for the slider … and set the default to 0.3 m"*) THE AUTOMATIC TILT'S LATCH: on within `thresholdM` of the gizmo (the piece's distance, m), off
 * only beyond it + `TILT_AUTO_HYST_M` (an approach coasting round the threshold never flickers it); `thresholdM` 0: never. ⛔ A percentage of the far
 * distance (20 % — 1.2 m on `Scene_1`, off beyond 25 %).
 */
export const TILT_AUTO_HYST_M = 0.05;
export function tiltAutoLatch(on: boolean, distM: number, thresholdM: number): boolean {
  if (!(thresholdM > 0)) return false;
  return on ? distM <= thresholdM + TILT_AUTO_HYST_M : distM <= thresholdM;
}



/**
 * ⭐⭐⭐ (2026-11-15) IS THE GIZMO ON THE TILTED FACET — the map's place on its stack (`stack` = `facet`), or on the neighbour's but within `tolM` of the
 * tilted facet itself (`borderM`: the place's distance to it): its border. ⛔ The stack alone: under the charts' layout the levels are the faces'
 * bisectors — a press with the gizmo on `Scene_0`'s ridge made the tilt with the gizmo EXACTLY on the tilted facet's border, the place there was read on
 * the neighbour, and the tilt left at once ("over the edge", the roll back, the exit — four frames after the press).
 * ⭐⭐⭐ (2026-11-16, `ORBIT_CHARTS.md` §12 2.4d) `tolM`: how near the border is still on it — the wiring hands the one band (`gizmoEdgeMarginMm`): IN AT
 * THE EDGE (the tilt's entry, unchanged), OUT ONE BAND PAST IT — a place wobbling a few millimetres across the entry edge makes the tilt once and never
 * leaves it (as `zoneAt`'s exit, `zoneExitMm`). ⛔ (step 2.5) the tie of the game before the charts (`TILT_TIE_M`, a micrometre, the default) deleted.
 */
export function onTiltedFacet(stack: number, facet: number, borderM: number, tolM: number): boolean {
  return stack === facet || borderM <= tolM;
}

/** ⭐ A camera's frame: the direction (from what it looks at, toward it) and its up. */
export interface CamFrame {
  readonly dir: Vec3;
  readonly up: Vec3;
}

/**
 * ⭐⭐⭐ THE CAMERA'S FRAME `k` OF THE WAY FROM `a` TO `b` — one turn about one axis (the turn taking `a`'s basis onto `b`'s), `k` of its angle. A half turn
 * (the far edge's 180° roll, 2 (a)) has two axes: the one nearer `hint` (the last frame's) — never flipping mid-way. Returns the frame and the axis used.
 */
export function frameMix(a: CamFrame, b: CamFrame, k: number, hint: Vec3 | null): { readonly frame: CamFrame; readonly axis: Vec3 | null; readonly angle: number } {
  const basis = (f: CamFrame): Mat3 => {
    const d = norm(f.dir);
    const r = norm(cross(f.up, d));
    const u = cross(d, r);
    return [r, u, d]; // rows: the frame's axes in the world
  };
  const A = basis(a);
  const B = basis(b);
  // M = Bᵀ·A … as a turn of the world: M·A_i = B_i  ⇒  M = Σ B_i A_iᵀ
  const M: number[][] = [0, 1, 2].map((r) => [0, 1, 2].map((c) => A[0][c]! * B[0][r]! + A[1][c]! * B[1][r]! + A[2][c]! * B[2][r]!));
  const tr = M[0]![0]! + M[1]![1]! + M[2]![2]!;
  const th = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
  // ⭐ (2026-11-10) the whole turn's angle returned at every share (the roll's speed in °/s reads it — `rollDurationMs`)
  if (!(k > 0)) return { frame: a, axis: hint, angle: th };
  if (th < 1e-9) return { frame: k >= 1 ? b : a, axis: hint, angle: th };
  let axis: Vec3;
  const s = Math.sin(th);
  if (s > 1e-4) {
    axis = norm([(M[2]![1]! - M[1]![2]!) / (2 * s), (M[0]![2]! - M[2]![0]!) / (2 * s), (M[1]![0]! - M[0]![1]!) / (2 * s)]);
  } else {
    // a half turn: M = 2aaᵀ − I — the axis from the largest diagonal, its signs from that row
    const d = [M[0]![0]!, M[1]![1]!, M[2]![2]!];
    const i = d[0]! >= d[1]! && d[0]! >= d[2]! ? 0 : d[1]! >= d[2]! ? 1 : 2;
    const ai = Math.sqrt(Math.max(0, (d[i]! + 1) / 2));
    const v: [number, number, number] = [0, 0, 0];
    for (const j of [0, 1, 2]) v[j] = j === i ? ai : (M[i]![j]! + M[j]![i]!) / (4 * ai);
    axis = norm(v);
    if (hint !== null && dot(axis, hint) < 0) axis = [-axis[0], -axis[1], -axis[2]];
  }
  // the axis nearer the hint (a turn by θ about a = by 2π − θ about −a: only a half turn is ambiguous; keep its sign)
  const t = Math.min(1, k) * th;
  return { frame: { dir: rotateAbout(a.dir, axis, t), up: rotateAbout(a.up, axis, t) }, axis, angle: th };
}

/** ⭐ A camera's pose: where it is, what it looks at, its up — and where the piece was drawn with it (`piece`; none: the piece given with the turn). */
export interface CamPose {
  readonly eye: Vec3;
  readonly look: Vec3;
  readonly up: Vec3;
  readonly piece?: Vec3 | null;
}

/**
 * ⭐⭐⭐ (2026-11-14, the owner: *"the piece still snaps 180 degrees diagonally before the camera realignment brings the piece back to its position"*) THE
 * CAMERA TURNED ABOUT THE PIECE, `k` of the way from the pose `a` (the one on the glass when the turn began) to `b` (this frame's): its axes by ONE turn
 * (`frameMix`'s, the half turn's way kept by `hint` — and past it, never back the short way round), the piece's place in the camera's frame carried
 * straight from `a`'s (with the piece where `a` drew it, `a.piece`) to `b`'s, the eye put where that place holds for the piece NOW (it may still move: its
 * spring catching up, far out 1.7 m through a half turn — the camera follows it as ever) — so the piece stays on the glass where it was (or glides straight to where `b` puts
 * it) and the assembly turns behind it; the look's distance blended. ⛔ The camera turned about the glass's centre (its up about its view): the piece, off
 * the centre far out, went round the glass — and, the view's offsets turned with the heading, first jumped to the opposite corner.
 */
export function poseAboutPiece(a: CamPose, b: CamPose, piece: Vec3, k: number, hint: Vec3 | null): { readonly pose: CamPose; readonly axis: Vec3 | null; readonly angle: number } {
  const frameOf = (p: CamPose): CamFrame => ({ dir: norm([p.eye[0] - p.look[0], p.eye[1] - p.look[1], p.eye[2] - p.look[2]]), up: p.up });
  const fa = frameOf(a);
  const fb = frameOf(b);
  const m = frameMix(fa, fb, 1, hint);
  let axis = m.axis;
  let angle = m.angle;
  // ⭐ past the half turn the shortest way flips: kept the way it began (the angle grows beyond 180°, never a jump back)
  if (axis !== null && hint !== null && dot(axis, hint) < 0 && angle > Math.PI / 2) {
    axis = [-axis[0], -axis[1], -axis[2]];
    angle = 2 * Math.PI - angle;
  }
  const s = Math.min(1, Math.max(0, k));
  const basis = (f: CamFrame): { r: Vec3; u: Vec3; f: Vec3 } => {
    const d = norm(f.dir);
    const r = norm(cross(f.up, d));
    const u = cross(d, r);
    return { r, u, f: [-d[0], -d[1], -d[2]] };
  };
  const coords = (p: CamPose, B: { r: Vec3; u: Vec3; f: Vec3 }, q: Vec3): Vec3 => {
    const v: Vec3 = [q[0] - p.eye[0], q[1] - p.eye[1], q[2] - p.eye[2]];
    return [dot(v, B.r), dot(v, B.u), dot(v, B.f)];
  };
  const ca = coords(a, basis(fa), a.piece ?? piece);
  const cb = coords(b, basis(fb), piece);
  const t = s * angle;
  const ft: CamFrame = axis === null || !(angle > 1e-9) ? (s >= 1 ? fb : fa) : { dir: rotateAbout(fa.dir, axis, t), up: rotateAbout(fa.up, axis, t) };
  const Bt = basis(ft);
  const c: Vec3 = [ca[0] + (cb[0] - ca[0]) * s, ca[1] + (cb[1] - ca[1]) * s, ca[2] + (cb[2] - ca[2]) * s];
  const eye: Vec3 = [
    piece[0] - (Bt.r[0] * c[0] + Bt.u[0] * c[1] + Bt.f[0] * c[2]),
    piece[1] - (Bt.r[1] * c[0] + Bt.u[1] * c[1] + Bt.f[1] * c[2]),
    piece[2] - (Bt.r[2] * c[0] + Bt.u[2] * c[1] + Bt.f[2] * c[2]),
  ];
  const la = Math.hypot(a.look[0] - a.eye[0], a.look[1] - a.eye[1], a.look[2] - a.eye[2]);
  const lb = Math.hypot(b.look[0] - b.eye[0], b.look[1] - b.eye[1], b.look[2] - b.eye[2]);
  const l = la + (lb - la) * s;
  const look: Vec3 = [eye[0] + Bt.f[0] * l, eye[1] + Bt.f[1] * l, eye[2] + Bt.f[2] * l];
  return { pose: { eye, look, up: Bt.u }, axis, angle };
}

/**
 * ⭐⭐⭐ (2026-11-14, the owner: *"Is there a way for the camera to realign without the piece nor the assembly/scene to sometimes fly off the screen view
 * (especially at far distance)?"*) THE TURN FRAMING TWO TARGETS — the piece `A` and the camera's aim `B` (its look point: the assembly far out) — after
 * Lino & Christie's TORIC SPACE (*Efficient composition for virtual camera control*, SCA 2012; *Intuitive and efficient camera control with the toric
 * space*, SIGGRAPH 2015) and Gleicher & Witkin's *through-the-lens* control (1992): the camera solved, each frame, from WHERE THE TWO ARE ON THE GLASS.
 * Their places on the glass (tangent coordinates) carried STRAIGHT from the pose `a` (on the glass at the turn's start, `a.piece` the piece then, `a.look`
 * its aim) to `b`'s — a straight line between two points of the glass stays on it (a rectangle is convex): neither can leave it, whatever the glass's
 * shape. The angle the two make at the camera follows (α), with the piece's distance carried (rA) the camera lies on the toric surface of A and B; its
 * place round the line A → B (φ) carried from `a`'s to `b`'s the way it began (`sgn`, kept past the half turn) — the half turn is a turn ABOUT THE LINE
 * THROUGH BOTH (both stay put); the camera's axes the one turn putting A and B where they go. ⭐⭐⭐ (2026-11-14, the owner's records) THE PIECE's place
 * carried straight, the AIM's as the piece's plus their SEPARATION carried round (its angle turned one way — `way`, kept from the first frame — its length
 * blended): the two never meet on the glass on the way, so the camera's roll (the separation's angle) never spins. ⛔ Both straight (2026-11-14): their
 * paths often passed within a few hundredths (the piece sits 0.1 – 0.3 of the glass from the aim) — the roll spun there, and the guard against it
 * (`FRAMING_TWO_MIN`, deleted) handed most turns to the piece alone: far out the assembly swung off the glass. `null`: degenerate (the two at one place
 * on the glass at an end, or behind the camera) — the caller turns about the piece alone (`poseAboutPiece`). k 0: `a`; k 1: `b`.
 */
/**
 * ⭐⭐⭐ (2026-11-14) THE TWO-TARGET TURN'S TWO ANGLES as last carried (unwrapped, rad): the camera's way round the piece → aim line (`dphi`) and the
 * separation's on the glass (`dq`) — each frame the branch (± 2π) NEAREST its last: one continuous turn, whatever the target does. ⛔ A sign kept from the
 * first frame (a full turn added whenever the shortest way pointed the other way past 90°): the angle wandered to the other sign, then past 90° — the turn
 * leapt by k × 360° (112 – 161° in ONE frame, the owner's records replayed). `null`: the turn's first frame — the shortest ways.
 */
export interface FramingKeep {
  readonly dphi: number;
  readonly dq: number;
}
/** ⭐ the branch of the angle `x` (± 2π) nearest `near` (none: `x` itself, in (−π, π]) */
function nearestTurn(x: number, near: number | null): number {
  const w = Math.atan2(Math.sin(x), Math.cos(x));
  return near === null ? w : w + 2 * Math.PI * Math.round((near - w) / (2 * Math.PI));
}

export function poseFramingTwo(a: CamPose, b: CamPose, A: Vec3, k: number, keep: FramingKeep | null): { readonly pose: CamPose; readonly keep: FramingKeep } | null {
  const A0 = a.piece ?? A;
  const B0 = a.look;
  const B = b.look;
  const sub = (p: Vec3, q: Vec3): Vec3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const len = (v: Vec3): number => Math.hypot(v[0], v[1], v[2]);
  const basis = (p: CamPose): { r: Vec3; u: Vec3; f: Vec3 } => {
    const d = norm(sub(p.eye, p.look));
    const r = norm(cross(p.up, d));
    const u = cross(d, r);
    return { r, u, f: [-d[0], -d[1], -d[2]] };
  };
  // a point's tangent coordinates on the glass (right / forward, up / forward) — `null` behind the camera
  const tangent = (p: CamPose, Bs: { r: Vec3; u: Vec3; f: Vec3 }, q: Vec3): [number, number] | null => {
    const v = sub(q, p.eye);
    const z = dot(v, Bs.f);
    return z > 1e-9 ? [dot(v, Bs.r) / z, dot(v, Bs.u) / z] : null;
  };
  const Ba = basis(a);
  const Bb = basis(b);
  const ta0 = tangent(a, Ba, A0);
  const tb0 = tangent(a, Ba, B0);
  const ta1 = tangent(b, Bb, A);
  const tb1 = tangent(b, Bb, B);
  if (ta0 === null || tb0 === null || ta1 === null || tb1 === null) return null;
  const s = Math.min(1, Math.max(0, k));
  const lerp = (x: number, y: number): number => x + (y - x) * s;
  const ta: [number, number] = [lerp(ta0[0], ta1[0]), lerp(ta0[1], ta1[1])];
  // the separation A → B on the glass at each end, carried round: its angle the shorter way at the first frame, then continuous (`keep.dq`)
  const r0 = Math.hypot(tb0[0] - ta0[0], tb0[1] - ta0[1]);
  const r1 = Math.hypot(tb1[0] - ta1[0], tb1[1] - ta1[1]);
  if (!(r0 > FRAMING_SEP_MIN) || !(r1 > FRAMING_SEP_MIN)) return null;
  const q0 = Math.atan2(tb0[1] - ta0[1], tb0[0] - ta0[0]);
  const dq = nearestTurn(Math.atan2(tb1[1] - ta1[1], tb1[0] - ta1[0]) - q0, keep?.dq ?? null);
  const qs = q0 + s * dq;
  const rs = lerp(r0, r1);
  const tb: [number, number] = [ta[0] + rs * Math.cos(qs), ta[1] + rs * Math.sin(qs)];
  // the two directions in the camera's coordinates (right, up, forward)
  const dA = norm([ta[0], ta[1], 1]);
  const dB = norm([tb[0], tb[1], 1]);
  const ca = Math.max(-1, Math.min(1, dot(dA, dB)));
  const alpha = Math.acos(ca);
  if (!(alpha > (0.5 * Math.PI) / 180)) return null;
  const AB = sub(B, A);
  const L = len(AB);
  const rA = lerp(len(sub(A0, a.eye)), len(sub(A, b.eye)));
  if (!(L > 1e-6) || !(rA > 1e-6)) return null;
  const uAB: Vec3 = [AB[0] / L, AB[1] / L, AB[2] / L];
  // the triangle A, B, camera: the angle α at the camera, the side to A rA — the side to B (the root nearer the one carried), then the angle at A
  const sa = Math.sin(alpha);
  const disc = L * L - rA * rA * sa * sa;
  if (!(disc >= 0)) return null;
  const rB0 = lerp(len(sub(B0, a.eye)), len(sub(B, b.eye)));
  const roots = [rA * ca + Math.sqrt(disc), rA * ca - Math.sqrt(disc)].filter((x) => x > 1e-9);
  if (roots.length === 0) return null;
  const rB = roots.reduce((p, q) => (Math.abs(q - rB0) < Math.abs(p - rB0) ? q : p));
  const cb = Math.max(-1, Math.min(1, (rA * rA + L * L - rB * rB) / (2 * rA * L)));
  const sb = Math.sqrt(1 - cb * cb);
  const L0 = len(sub(B0, A0));
  if (!(L0 > 1e-6)) return null;
  const u0: Vec3 = norm(sub(B0, A0));
  // the place round the line A → B: an angle from ONE reference for the whole turn — laid square to the line at the start (the start camera's axis most
  // square to it), then CARRIED WITH THE LINE (the least turn taking the start's line onto the line now — parallel transport): it never meets the line.
  // ⛔ (2026-11-14) the world's up, else x past 0.95: the reference switched mid-turn — a 61° roll in ONE frame. ⛔ (the same day) one world axis laid
  // square to the line NOW (`wRef`): the piece's spring swung the line 50 – 90° round the assembly in a turn's first frames (a fast finger, far out),
  // the line came by that axis, its square flipped — 140 – 174° rolls in ONE frame (the owner's records, replayed)
  const w0: Vec3 = [Ba.r, Ba.u, Ba.f].reduce((p, q) => (Math.abs(dot(q, u0)) < Math.abs(dot(p, u0)) ? q : p));
  const e10 = norm(sub(w0, [u0[0] * dot(w0, u0), u0[1] * dot(w0, u0), u0[2] * dot(w0, u0)]));
  const ref = (u: Vec3): { e1: Vec3; e2: Vec3 } => {
    // the least turn u0 → u applied to e10 (square to u0): v − ((u·v) / (1 + u0·u)) (u0 + u); the line reversed (u0·u → −1): none — kept, laid square
    const c = dot(u0, u);
    const t = c > -1 + 1e-6 ? dot(u, e10) / (1 + c) : 0;
    const v: Vec3 = [e10[0] - t * (u0[0] + u[0]), e10[1] - t * (u0[1] + u[1]), e10[2] - t * (u0[2] + u[2])];
    const e1 = norm(sub(v, [u[0] * dot(v, u), u[1] * dot(v, u), u[2] * dot(v, u)]));
    return { e1, e2: cross(u, e1) };
  };
  const phiOf = (E: Vec3, P: Vec3, u: Vec3): number => {
    const { e1, e2 } = ref(u);
    const v = sub(E, P);
    return Math.atan2(dot(v, e2), dot(v, e1));
  };
  const phi0 = phiOf(a.eye, A0, u0);
  const phi1 = phiOf(b.eye, A, uAB);
  const dphi = nearestTurn(phi1 - phi0, keep?.dphi ?? null);
  const phi = phi0 + s * dphi;
  const { e1, e2 } = ref(uAB);
  const w: Vec3 = [Math.cos(phi) * e1[0] + Math.sin(phi) * e2[0], Math.cos(phi) * e1[1] + Math.sin(phi) * e2[1], Math.cos(phi) * e1[2] + Math.sin(phi) * e2[2]];
  const eye: Vec3 = [A[0] + rA * (cb * uAB[0] + sb * w[0]), A[1] + rA * (cb * uAB[1] + sb * w[1]), A[2] + rA * (cb * uAB[2] + sb * w[2])];
  // the camera's axes: the one turn taking the two directions (camera's coordinates) onto the two seen from `eye` (world) — the coordinates are
  // left-handed (right = up × back, Babylon's), so the third axis of the world's triad is reversed
  const wA = norm(sub(A, eye));
  const wB = norm(sub(B, eye));
  const x2 = norm(sub(dB, [dA[0] * ca, dA[1] * ca, dA[2] * ca]));
  const x3 = cross(dA, x2);
  const kw = dot(wB, wA);
  const y2 = norm(sub(wB, [wA[0] * kw, wA[1] * kw, wA[2] * kw]));
  const y3n = cross(wA, y2);
  const y3: Vec3 = [-y3n[0], -y3n[1], -y3n[2]];
  const axis = (j: 0 | 1 | 2): Vec3 => [dA[j]! * wA[0] + x2[j]! * y2[0] + x3[j]! * y3[0], dA[j]! * wA[1] + x2[j]! * y2[1] + x3[j]! * y3[1], dA[j]! * wA[2] + x2[j]! * y2[2] + x3[j]! * y3[2]];
  const up = axis(1);
  const fwd = axis(2);
  const l = lerp(len(sub(a.look, a.eye)), len(sub(b.look, b.eye)));
  return { pose: { eye, look: [eye[0] + fwd[0] * l, eye[1] + fwd[1] * l, eye[2] + fwd[2] * l], up }, keep: { dphi, dq } };
}
/** ⭐ (2026-11-14) the separation of the two on the glass (tangent units) under which, at an end, they are one place — the turn about the piece alone */
export const FRAMING_SEP_MIN = 1e-3;

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"limit the speed of the scene tilt at crossing"* → *"yes"* to a speed in °/s) THE ROLL'S DURATION (ms) at most `degS` °/s for
 * a roll of `rad` (the whole turn, `frameMix`'s angle) — the same angular speed for every roll: 360°/s, a far edge's half turn 0.5 s, a side's 63° 0.18 s
 * (⛔ a whole roll in 250 ms whatever its size: the half turn 2.9 × faster than the side's). `degS` 0: at once.
 */
export function rollDurationMs(rad: number, degS: number): number {
  if (!(degS > 0)) return 0;
  return (Math.abs(rad) / ((degS * Math.PI) / 180)) * 1000;
}

/**
 * ⭐⭐⭐ (2026-11-10, the rebuild — the owner: *"once the tilt starts, it cannot be rolled back … and shall complete"*, *"keep the edge, and not use any
 * stretch"*, *"1-b"*: the gizmo HELD until the tilt completes) — IS A TILT UNDER WAY: its swing (a tilt just made: the camera's heading turned square), its
 * roll back to upright (started as the gizmo CROSSED the edge, or out past the automatic tilt's threshold), not yet whole. While it is, every orbit step is
 * refused (the gizmo held where the crossing left it) — the tilt completes on its own clock, then the finger has the orbit again; the next tilt only after
 * (the owner's hysteresis: *"the time required for the camera to align"*).
 * ⛔ (the same day, replaced) the roll started in the edge's stretch by the finger's share, reversible, then committed, finished on a rest, carried, clamped.
 */
/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"Build 2"*, then *"Apply the glide to those steps as well"*) THE GLIDE OF THE GIZMO'S DEPTH: the shown gizmo keeps the
 * face map's own travel (`surf` − `prevSurf`: the contour's place, continuous — across an edge too) and every step of the REAL depth beyond it is eased
 * out by time — the offset from the new point (`raw`) back to where the travel alone would have shown it (`prevShown` + the travel); `null` under `minM`.
 * One rule for every jump of the real surface under the gizmo: a notch cut along an EDGE (each facet's ray on another wall — 110 mm at the cube's bottom
 * edge, 85 mm at its top), a notch's own WALL inside a face (90 mm on the top, 62 mm on the bottom), a void's rim, a proud part's side. ⛔ (the same day)
 * at a facet change only — the walls inside a face still jumped.
 */
export const GLIDE_MIN_M = 0.005;
export function gizmoGlide(prevShown: Vec3 | null, prevSurf: Vec3 | null, surf: Vec3, raw: Vec3, minM: number = GLIDE_MIN_M): Vec3 | null {
  if (prevShown === null || prevSurf === null) return null;
  const v: Vec3 = [prevShown[0] + surf[0] - prevSurf[0] - raw[0], prevShown[1] + surf[1] - prevSurf[1] - raw[1], prevShown[2] + surf[2] - prevSurf[2] - raw[2]];
  return Math.hypot(v[0], v[1], v[2]) > minM ? v : null;
}

/**
 * ⭐⭐⭐ (2026-11-11, the owner: *"during the approach … if the gizmo is on a face holding the pole … when the tilted-pole-orbit toggles on there is an immediate
 * alignment of the camera … this does not blend with the approach"* → *"the red-green sections automatically switches to orthogonal when the automatic
 * tilted pole is toggled on but the camera view waits through the approach … then the camera view resolves with the mm when the close in orbit starts …
 * or it completely resolves when the first edge is crossed"*) THE CAMERA PENDING: from the frame the automatic tilt switches on (`autoWas` → `autoNow`, the
 * approach crossing its distance) until the orbit's first millimetre of finger (`fingerMm`) the CAMERA keeps its orientation (the tilt's swing and the
 * square camera's share held) — the tilt itself made at once (the sections orthogonal). Off (out past the threshold): not pending. ⛔ The camera swung and
 * squared at once (by time, the approach still running): a snap the approach did not explain; ⛔ (the first build) the tilt itself held too — the sections
 * polar until the orbit started.
 */
export function tiltPendingStep(pending: boolean, autoWas: boolean, autoNow: boolean, fingerMm: number): boolean {
  return autoNow && (pending || !autoWas) && !(fingerMm > 0);
}

/**
 * ⭐⭐⭐ (2026-11-11) THE BLEND INTO THE CLOSE-IN ALIGNMENT BY THE FINGER'S TRAVEL: the share (0 … 1, a smoothstep) after `mm` of the orbit's finger since it
 * started, over `spanMm` (`tiltBlendMm`, 10 mm; 0: at once) — the square camera's share on every face, the swing of the tilt made as it switched on; no
 * clock, the gizmo moving from the first millimetre. ⭐ Whole at the first edge crossed (`blendCrossed`): never carried, part-way, onto another face.
 */
export function blendShare(mm: number, spanMm: number): number {
  if (!(spanMm > 0)) return 1;
  const x = Math.min(1, Math.max(0, mm / spanMm));
  return x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ (2026-11-11, the owner: *"or it completely resolves when the first edge is crossed (otherwise, it may carry over a tilted view on another face)"*) HAS THE
 * GIZMO CROSSED AN EDGE SINCE THE BLEND STARTED: another tilt (`tiltId`: one off, or a new one), or the square camera's target another face (its normals
 * more than 1° apart). ⛔ (2026-11-16, step 2.5) the roll back under way (`finishing`) deleted with the roll back. ⭐ The blend is then whole — its rest resolved at the crossing's own speed, the gizmo held as at every
 * crossing.
 */
export function blendCrossed(tiltId0: number, tiltId: number, target0: Vec3 | null, target: Vec3 | null): boolean {
  if (tiltId !== tiltId0) return true;
  if (target0 === null || target === null) return false;
  return dot(target0, target) < Math.cos(Math.PI / 180);
}




function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-12 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 1, 0];
}
