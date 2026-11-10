/**
 * ⭐⭐⭐ (2026-11-10, POLAR_ORBIT_CLEANUP.md §9.4 — the owner's TILTED POLE: *"when the left click or finger is pressed for orbiting, the orbit tilts so the
 * face currently holding the gizmo becomes the one with the red and green sections which are perpendicular"*; the decisions 1 (c), 2 (a), 3 (a), 4 the
 * "no camera roll" rule removed) — **THE ORBIT'S FRAME**: one rotation between the orbit's angles and the world.
 *
 * * The orbit's angles (yaw, pitch) and the face map live in a frame F; `map` turns F into the world (the face map is BUILT in F: the faces turned by its
 *   transpose, `tiltFaces`), `dir` turns the orbit's DIRECTIONS (the piece, the camera) — `map` once the press's swing is over (`swingDir`).
 * * **At a press on a cap** (`capTilt`): the tilt about the world horizontal axis square to the SNAPPED heading (`snapHeading`, 1 (c)), 90°, the cap's
 *   normal turned onto that heading in F — the cap is a SIDE there (the red straight away from the viewer, the green straight across). A tilt about an axis
 *   square to the heading never rolls the view (`offsetFrame` is the same in both frames — vectored). The heading's swing to the snapped one (≤ 45° about
 *   the vertical, no roll) is the directions' frame turning from `headingTurn(−Δ)·map` to `map` (`swingDir`) — the camera at the press exactly where it was.
 * * **Off the face** (`exitShare`): the share of the way through the tilted facet's edge band toward ANOTHER facet (0 … 1, 1 at the edge) — the camera's
 *   frame turned from F's upright to the world's by that share (`frameMix`): the roll back paced by the finger, reversible (3 (a)); at the edge the frame
 *   is the world's again (the face exited polar again).
 * ⛔ ENGINE-FREE. Rotation matrices, Rodrigues' formula, a smoothstep — textbook; no licence, no patent.
 */
import { cross, dot, type Vec3 } from "../core/vec";
import { edgeBlend, mapTarget, type FaceMap, type MapFace, type MapOpts } from "./face_map";
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
export function matMul(A: Mat3, B: Mat3): Mat3 {
  const col = (j: 0 | 1 | 2): Vec3 => [B[0][j], B[1][j], B[2][j]];
  const c0 = col(0);
  const c1 = col(1);
  const c2 = col(2);
  return [
    [dot(A[0], c0), dot(A[0], c1), dot(A[0], c2)],
    [dot(A[1], c0), dot(A[1], c1), dot(A[1], c2)],
    [dot(A[2], c0), dot(A[2], c1), dot(A[2], c2)],
  ];
}

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

/** ⭐ The turn about the world's vertical that adds `d` to every heading (the orbit's convention) — the press's swing. */
export function headingTurn(d: number): Mat3 {
  const c = Math.cos(d);
  const s = Math.sin(d);
  return [
    [c, 0, -s],
    [0, 1, 0],
    [s, 0, c],
  ];
}

/**
 * ⭐⭐⭐ THE TILT AT A PRESS ON A CAP (1 (c)): F → world, 90° about the world's horizontal axis square to the heading `hs` (snapped), so the cap's normal
 * (`top`: up; else down) is `hs`'s direction in F — the cap a SIDE facing the camera. ⭐ The axis square to the heading: no roll (vectored).
 */
export function capTilt(hs: number, top: boolean): Mat3 {
  const hh: Vec3 = [Math.cos(hs), 0, Math.sin(hs)];
  const y: Vec3 = [0, 1, 0];
  // R·hh = ±y with R a quarter turn about a ⟂ hh: a × hh = ±y ⇒ a = hh × y (top), y × hh (bottom)
  const a = top ? cross(hh, y) : cross(y, hh);
  return axisAngle(a, Math.PI / 2);
}

/** ⭐ The directions' frame during the press's swing: `headingTurn(−Δ·(1 − e))·map` — at the press (`e` 0) the camera where it was, at its end (`e` 1) `map`. */
export function swingDir(map: Mat3, delta: number, e: number): Mat3 {
  return matMul(headingTurn(-delta * (1 - e)), map);
}

/** ⭐ The swing's ease over its time share (smoothstep): starting and ending at rest. */
export function swingEase(s: number): number {
  const x = Math.min(1, Math.max(0, s));
  return x * x * (3 - 2 * x);
}

/** ⭐ A direction's orbit angles (yaw, ring parameter `v`) — the yaw kept `yawHint` straight above / below (no heading to read). */
export function anglesOfDir(d: Vec3, yawHint: number): { readonly yaw: number; readonly v: number } {
  const l = Math.hypot(d[0], d[1], d[2]);
  const u: Vec3 = l > 1e-12 ? [d[0] / l, d[1] / l, d[2] / l] : [1, 0, 0];
  const flat = Math.hypot(u[0], u[2]);
  const yaw = flat > 1e-9 ? yawHint + wrapPi(Math.atan2(u[2], u[0]) - yawHint) : yawHint;
  return { yaw, v: vOfPitch(Math.asin(Math.max(-1, Math.min(1, u[1])))) };
}

/** ⭐ A frame's direction in the world (`null`: the world's own). */
export function tiltDir(R: Mat3 | null, v: Vec3): Vec3 {
  return R === null ? v : mulM(R, v);
}

/** ⭐ …and a world direction in the frame. */
export function untiltDir(R: Mat3 | null, v: Vec3): Vec3 {
  return R === null ? v : mulT(R, v);
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
 * ⭐⭐⭐ THE SHARE OF THE WAY OFF THE TILTED FACET (0 … 1): in its edge band (`edgeBlend` — the slow stretch, `faceEdgeSlideMm` / `faceEdgeSlideDeg`)
 * toward ANOTHER facet, twice the blend's weight (½ at the edge: 1 there); 0 in its middle, or in a band toward a facet of its own. The roll back to the
 * world's upright is this share of the way (3 (a): the finger's travel, reversible).
 */
export function exitShare(map: FaceMap, yaw: number, pitch: number, facet: number, opts: MapOpts): number {
  const eb = edgeBlend(map, yaw, pitch, opts);
  let k = 0;
  if (eb.h !== null && mapTarget(map, eb.h.yawThere, pitch, opts).stack !== facet) k = Math.max(k, 2 * eb.h.w);
  if (eb.v !== null && mapTarget(map, yaw, eb.v.pitchThere, opts).stack !== facet) k = Math.max(k, 2 * eb.v.w);
  return Math.min(1, Math.max(0, k));
}

/**
 * ⭐⭐⭐ THE CALM WHOLE TOWARD THE TILTED FACET'S EDGES (its every edge is a frame change: off it the world's frame): the share (0 … 1) that brings both
 * of the calm's shares to 1 — the calm's own edge zones (`edgeShare` with no interior: `zoneHPct` along `t`, `zoneVPct` along `b`), the nearer edge of
 * either. ⛔ Forced only by the exit's share (the 10° band): the piece caught up its calmed angle in two or three input steps (the probe: 957 mm in a frame).
 */
export function tiltCalmWhole(
  t: { readonly surface: Vec3; readonly across: { readonly L: number; readonly lo: number; readonly hi: number } },
  f: { readonly b: Vec3; readonly bLo: number; readonly bHi: number },
  z: { readonly zoneHPct: number; readonly zoneMinHM: number; readonly zoneVPct: number; readonly zoneMinVM: number },
): number {
  const L = t.across;
  const h = edgeShare(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, 0, z.zoneHPct, z.zoneMinHM);
  const sb = dot(t.surface, f.b);
  const v = edgeShare(Math.min(sb - f.bLo, f.bHi - sb), f.bHi - f.bLo, 0, z.zoneVPct, z.zoneMinVM);
  return Math.max(h, v);
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"Make the roll back by finger && minimum of xx ms to smoothen it"*) THE ROLL SHOWN, one frame: toward the finger's share
 * `target` (`exitShare` — reversible) by at most `dtMs / minMs` — a whole roll never in less than `minMs` (⛔ by the finger alone: far out the edge's
 * stretch is ~1.5 mm of finger, the far edge's half turn passed in one or two input events — 105° in a frame, probed). `minMs` 0: the finger's share.
 */
export function rollStep(shown: number, target: number, dtMs: number, minMs: number): number {
  if (!(minMs > 0)) return target;
  const r = Math.max(0, dtMs) / minMs;
  return shown + Math.max(-r, Math.min(r, target - shown));
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"at far distance it is disabled, at close distance (… at xx% of the max distance, make a slider) it toggles on
 * automatically"*) THE AUTOMATIC TILT'S LATCH: on within `pct` % of the far distance, off only beyond `pct` + `TILT_AUTO_HYST_PCT` (an approach coasting
 * round the threshold never flickers it); `pct` 0: never.
 */
export const TILT_AUTO_HYST_PCT = 5;
export function tiltAutoLatch(on: boolean, distM: number, farM: number, pct: number): boolean {
  if (!(pct > 0) || !(farM > 0)) return false;
  const r = (100 * distM) / farM;
  return on ? r <= pct + TILT_AUTO_HYST_PCT : r <= pct;
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"propose a small hysteresis, for example completion of the camera tilt before a tilt back can occur"*) THE FINGER'S SHARE
 * OF THE WAY OFF, with the hysteresis: until the tilt is ARMED (the gizmo once in the facet's middle — its exit share 0) no roll back is asked while it stays
 * on the facet (a tilt made at an edge — every automatic one — would otherwise roll straight back there); off the facet, whole. Returns the share and the
 * arming.
 */
export function tiltExitTarget(armed: boolean, onFacet: boolean, share: number, off = false): { readonly kT: number; readonly armed: boolean } {
  // ⭐⭐⭐ (2026-11-10, the owner: *"if the piece crosses the hysteresis threshold, the tilt automatically triggers on or off"*) out past the threshold
  // (`off`): whole, wherever the gizmo is — the roll back paced by time (`rollStep`), no edge to pace it
  if (!onFacet || off) return { kT: 1, armed };
  const a = armed || share <= 0;
  return { kT: a ? share : 0, armed: a };
}

/** ⭐⭐⭐ …and the frame back to the world's only once the tilt's swing is OVER and the roll shown is whole (the owner's hysteresis), off the facet — or out past the threshold (`off`). */
export function tiltExits(onFacet: boolean, k: number, swingDone: boolean, off = false): boolean {
  return (!onFacet || off) && k >= 1 && swingDone;
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
export function frameMix(a: CamFrame, b: CamFrame, k: number, hint: Vec3 | null): { readonly frame: CamFrame; readonly axis: Vec3 | null } {
  if (!(k > 0)) return { frame: a, axis: hint };
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
  if (th < 1e-9) return { frame: k >= 1 ? b : a, axis: hint };
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
  return { frame: { dir: rotateAbout(a.dir, axis, t), up: rotateAbout(a.up, axis, t) }, axis };
}

function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-12 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 1, 0];
}
