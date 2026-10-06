/**
 * ⭐⭐⭐ prototype — **THE ORBIT AROUND THE PIECE** (the owner, 2026-10-06: *"when resting face is aligned, the orbit center moves to the
 * piece, the rest orbit around the piece"*; then: the piece *"still pushed by dy"*; dx / dy drive the *"camera on rings"* — dx turns it
 * around the piece, dy moves it through the rings' pitches — *"dy also pushes"* the piece toward the pink gizmo; the move *"the same as
 * when the orbit center is moved in the scene (camera catches up while orbiting, etc.)"*; the pink ring *"stays at the old centre"*; back
 * *"never automatically"*).
 *
 * From the resting-face alignment on:
 * - the PIECE is pushed along a STRAIGHT LINE through the orbit centre (the pink gizmo) — the direction it had at the alignment, frozen —
 *   at the distance the rings give it at the rig's ring parameter (`orbitOffset`'s length, as today): dy moves it exactly as fast as
 *   before, dx no longer moves it;
 * - the CAMERA's orbit centre glides from the old centre to the piece, by FINGER TRAVEL over `orbitBlendDistanceMm` (eased — the scene's
 *   own centre move, `OrbitCentreBlend`), and then follows the piece; the camera orbits it at the rings' angles (dx yaw, dy pitch) and
 *   looks at it.
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ The mode's state: the frozen push direction (unit, from the orbit centre out to the piece), where the camera's centre glides from,
 * the finger travel fed to that glide so far, and — at the alignment — the camera's distance from the piece (`gap0M`) and the piece's
 * distance from the centre (`ring0M`), the gap's reference (`scaledGap`). */
export interface PieceOrbit {
  readonly dir: Vec3;
  readonly fromM: Vec3;
  readonly travelledMm: number;
  readonly gap0M: number;
  readonly ring0M: number;
}

/** ⭐ At the alignment: the push direction from the orbit centre to the piece (`fallbackDir` when the piece sits ON the centre), the
 * glide starting at the orbit centre itself — so nothing moves on the frame it starts — and the camera's distance from the piece then. */
export function startPieceOrbit(centre: Vec3, piece: Vec3, fallbackDir: Vec3, camera: Vec3): PieceOrbit {
  const v: Vec3 = [piece[0] - centre[0], piece[1] - centre[1], piece[2] - centre[2]];
  const n = Math.hypot(v[0], v[1], v[2]);
  const dir: Vec3 = n > 1e-9 ? [v[0] / n, v[1] / n, v[2] / n] : fallbackDir;
  const gap0M = Math.hypot(camera[0] - piece[0], camera[1] - piece[1], camera[2] - piece[2]);
  return { dir, fromM: centre, travelledMm: 0, gap0M, ring0M: n };
}

/** ⭐ One step of finger travel, millimetres (the drag that drives the orbit). */
export function advancePieceOrbit(p: PieceOrbit, travelMm: number): PieceOrbit {
  return travelMm > 0 ? { ...p, travelledMm: p.travelledMm + travelMm } : p;
}

/** ⭐ The glide's share, eased in and out (smoothstep, as `OrbitCentreBlend`); a budget of zero is no glide. */
export function pieceOrbitProgress(p: PieceOrbit, budgetMm: number): number {
  if (budgetMm <= 0) return 1;
  const t = Math.min(1, p.travelledMm / budgetMm);
  return t * t * (3 - 2 * t);
}

/** ⭐ The piece: on the frozen line through the orbit centre, at `distM` from it. */
export function pushedPiece(centre: Vec3, dir: Vec3, distM: number): Vec3 {
  return [centre[0] + dir[0] * distM, centre[1] + dir[1] * distM, centre[2] + dir[2] * distM];
}

/** ⭐ The camera's orbit centre: from where the glide started to the piece AS IT IS NOW — so once there it follows the piece. */
export function cameraCentre(p: PieceOrbit, piece: Vec3, budgetMm: number): Vec3 {
  const t = pieceOrbitProgress(p, budgetMm);
  return [p.fromM[0] + (piece[0] - p.fromM[0]) * t, p.fromM[1] + (piece[1] - p.fromM[1]) * t, p.fromM[2] + (piece[2] - p.fromM[2]) * t];
}

/**
 * ⭐⭐ prototype — **THE GAP AROUND THE PIECE SCALES AS THE PIECE COMES IN** (the owner, 2026-10-06: *"only the gap scales from the camera
 * distance from the green box at the moment of resting face alignment to x% of this value (create a slider)"*): the camera's gap from the
 * piece is `gap0M` (its distance at the alignment) with the piece where it was then (`ring0M` from the centre), `minPct` % of it with the
 * piece at the rings' CLOSEST (`minRingM`), linear in the piece's distance between — so dy brings the camera toward the piece as it pushes
 * the piece in. ⛔ Pushed back out beyond where it was aligned, the gap stays `gap0M`.
 */
export function scaledGap(gap0M: number, ringDistM: number, ring0M: number, minRingM: number, minPct: number): number {
  const span = ring0M - minRingM;
  const s = span > 1e-9 ? Math.min(1, Math.max(0, (ringDistM - minRingM) / span)) : 1;
  const k = minPct / 100;
  return gap0M * (k + (1 - k) * s);
}

/** ⭐ The rings' closest and farthest distance from the centre (`radiusOf(v)` sampled over the whole rig). */
export function ringDistanceRange(radiusOf: (v: number) => number, samples = 64): { readonly minM: number; readonly maxM: number } {
  let minM = Infinity;
  let maxM = 0;
  for (let i = 0; i <= samples; i++) {
    const r = radiusOf(i / samples);
    minM = Math.min(minM, r);
    maxM = Math.max(maxM, r);
  }
  return { minM, maxM };
}

/** ⭐ A world point's place on the screen as two angles off the view axis (radians; across, up), the camera at `cam` looking at `look` —
 * `null` BEHIND the camera (not on the screen: its angle means nothing there). */
function screenAngles(cam: Vec3, look: Vec3, p: Vec3): readonly [number, number] | null {
  const f0: Vec3 = [look[0] - cam[0], look[1] - cam[1], look[2] - cam[2]];
  const fn = Math.hypot(f0[0], f0[1], f0[2]) || 1;
  const f: Vec3 = [f0[0] / fn, f0[1] / fn, f0[2] / fn];
  const r0: Vec3 = [f[2], 0, -f[0]]; // up × forward
  const rn = Math.hypot(r0[0], r0[2]) || 1;
  const r: Vec3 = [r0[0] / rn, 0, r0[2] / rn];
  const u: Vec3 = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
  const q: Vec3 = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
  const z = q[0] * f[0] + q[1] * f[1] + q[2] * f[2];
  if (!(z > 0.05)) return null;
  return [Math.atan2(q[0] * r[0] + q[1] * r[1] + q[2] * r[2], z), Math.atan2(q[0] * u[0] + q[1] * u[1] + q[2] * u[2], z)];
}

/** ⭐ The scene's mean sweep across the screen for a small turn: each point's screen move between two camera poses, averaged over the points
 * IN FRONT of the camera in both (⛔ a point behind it swings through ±90° and would read as a huge slide). 0 with none. */
export function meanSweep(a: { readonly cam: Vec3; readonly look: Vec3 }, b: { readonly cam: Vec3; readonly look: Vec3 }, points: readonly Vec3[]): number {
  if (points.length === 0) return 0;
  let sum = 0;
  let n = 0;
  for (const p of points) {
    const s = screenAngles(a.cam, a.look, p);
    const t = screenAngles(b.cam, b.look, p);
    if (s === null || t === null) continue;
    sum += Math.hypot(t[0] - s[0], t[1] - s[1]);
    n++;
  }
  return n > 0 ? sum / n : 0;
}

/**
 * ⭐⭐⭐ prototype — **THE YAW GAIN AROUND THE PIECE, COMPUTED** (the owner, 2026-10-06: *"lower gain while orbiting. Compute the lower gain
 * based on the geometry and the parameters already set by slider (camera position, etc.)"*). Orbiting the PIECE, close to the camera, the
 * rest of the scene SLIDES across the screen, two to three times what it did turning in place about the centre — the same smoothing, so
 * larger steps per frame. The gain is the ratio of the scene's mean sweep for one small yaw step about the CENTRE (the camera where the
 * rings and its sliders put it: the piece's distance + the full gap, the yaw and pitch offsets) to that same step about the PIECE (the
 * camera at its own gap) — so a millimetre of finger slides the scene as far as it did. `pose(mode, yaw)` gives each camera; ⛔ never above
 * 1 (it only LOWERS), never below `floor`.
 */
export function pieceYawGain(
  pose: (aroundPiece: boolean, yaw: number) => { readonly cam: Vec3; readonly look: Vec3 },
  yaw: number,
  points: readonly Vec3[],
  floor = 0.1,
): number {
  const dy = 1e-3;
  const centre = meanSweep(pose(false, yaw), pose(false, yaw + dy), points);
  const piece = meanSweep(pose(true, yaw), pose(true, yaw + dy), points);
  if (!(piece > 1e-12) || !(centre > 1e-12)) return 1; // nothing in view to compare: no change
  return Math.min(1, Math.max(floor, centre / piece));
}
