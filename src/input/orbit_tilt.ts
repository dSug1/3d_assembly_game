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
 * * **Off the face** (2026-11-10, the rebuild): the roll back starts as the gizmo CROSSES the edge and completes on its own clock at `tiltRollDegS`
 *   (`rollStep`, `rollDurationMs`) — the gizmo held meanwhile (`tiltUnderWay`); the camera's frame turned from F's upright to the world's (`frameMix`);
 *   whole, the world's frame again (the face exited polar again). The swing at the same speed: ONE speed for every tilt.
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
 * ⭐⭐⭐ (2026-11-10) OVER A CAP OF THE WORLD'S FRAME (no tilt — far out, or the one frame before the automatic one): the calm brought from the side KEPT, its
 * horizontal share released only as a dx turns the orbit away from where it came over (`yawFromEntry`, a smoothstep to whole at 45°) — and by the pitch as
 * before (`poleWeight`, 60° → 85°). ⛔ Whole at once on the cap: the withheld yaw released at the edge.
 */
/**
 * ⭐⭐⭐ (2026-11-11, the owner: *"in polar orbit at far distance, if you enter the face holding the pole with dy, then orbit the gizmo with dx and then exit the
 * face holding the pole (be it towards the same initial face or another face), the camera rolls the moment the gizmo crosses the edge at exit"*) THE CAP'S
 * RELEASE CARRIED OVER THE EDGE: on the side below (above) a cap, the calm's horizontal whole share the cap's release had at the exit (`carried`), faded
 * by POSITION over the calm's own edge zone (`edgeWhole`: `poleEdgeWhole`, 1 at the edge, 0 past the zone) — the shown direction continuous through the
 * crossing, the calm taking hold as the gizmo goes down the side (and given back going up). ⛔ Dropped at once: after a dx on the cap (21°: half
 * released) the shown heading jumped 7° toward the side's normal at the exit, eased over three frames (−4°, −2°, −0.7°) — the roll.
 */
export function capReleaseCarried(carried: number, edgeWhole: number): number {
  return Math.max(0, Math.min(1, carried)) * Math.max(0, Math.min(1, edgeWhole));
}

export function capYawRelease(yawFromEntry: number): number {
  const x = Math.min(1, Math.abs(Math.atan2(Math.sin(yawFromEntry), Math.cos(yawFromEntry))) / (Math.PI / 4));
  return x * x * (3 - 2 * x);
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



/** ⭐⭐⭐ …and the frame back to the world's only once the tilt's swing is OVER and the roll shown is whole (the owner's hysteresis), off the facet — or out past the threshold (`off`). */
/**
 * ⭐⭐⭐ (2026-11-11, the owner: *"there is still a shake at crossing the edge at a different location (the shake is a roll of the piece back and forth while
 * the piece is still on the horizontal face)"*) THE DIRECTION A CAMERA'S HEADING IS READ FROM (`calmHeading`): its own (`u`), or — a view straight down
 * or up (no heading of its own) — the face it turns toward next (`toward`: the face the gizmo exits onto; the square camera's turn goes there). ⛔ A
 * vertical view's heading fell back to the ORBIT's yaw — over the tilted top that followed the gizmo along it (18° after 8 finger steps): the roll back's
 * target rolled the camera by it on the edge's frame, the world's camera (its view already turning toward the next face) rolled it back the next.
 */
export function headingFrom(u: Vec3, toward: Vec3 | null): Vec3 {
  if (Math.hypot(u[0], u[2]) >= 1e-3 || toward === null || !(Math.hypot(toward[0], toward[2]) >= 1e-3)) return u;
  return toward;
}

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
 * alignment of the camera … this does not blend with the approach. I would like to keep the camera orientation when the tilted-pole-orbit toggles on as
 * long as the approach continue, then the camera blends with the new alignment with the delta position mm when the orbit at close in starts"*, *"gizmo
 * moving from first millimeter and also the same for all the faces"*) THE AUTOMATIC TILT PENDING: from the frame the automatic tilt switches on (`autoWas` → `autoNow`, the approach crossing its
 * distance) until the orbit's first millimetre of finger (`fingerMm`) — meanwhile NOTHING turns (no tilt made, the square camera's share held): the
 * camera keeps its orientation while the approach goes on. Off (out past the threshold): not pending. ⛔ The tilt made and swung at once on a face holding a
 * pole (the heading snapped square, the camera turned straight down — by time, the approach still running: a snap the approach did not explain).
 */
export function tiltPendingStep(pending: boolean, autoWas: boolean, autoNow: boolean, fingerMm: number): boolean {
  return autoNow && (pending || !autoWas) && !(fingerMm > 0);
}

/**
 * ⭐⭐⭐ (2026-11-11) THE BLEND INTO THE CLOSE-IN ALIGNMENT BY THE FINGER'S TRAVEL: the share (0 … 1, a smoothstep) after `mm` of the orbit's finger since it
 * started, over `spanMm` (`tiltBlendMm`; 0: at once) — the square camera's share on every face, the swing of the tilt made on a face holding a pole; no
 * clock, the gizmo moving from the first millimetre.
 */
export function blendShare(mm: number, spanMm: number): number {
  if (!(spanMm > 0)) return 1;
  const x = Math.min(1, Math.max(0, mm / spanMm));
  return x * x * (3 - 2 * x);
}

export function tiltUnderWay(swinging: boolean, rolling: boolean, k: number): boolean {
  return swinging || (rolling && k < 1);
}



function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-12 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 1, 0];
}
