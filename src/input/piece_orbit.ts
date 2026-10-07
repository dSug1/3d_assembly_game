/**
 * ⭐⭐⭐ prototype — **THE ORBIT AROUND THE PIECE** (the owner, 2026-10-06: *"when resting face is aligned, the orbit center moves to the
 * piece, the rest orbit around the piece"*; then: the piece *"still pushed by dy"*; dx / dy drive the *"camera on rings"* — dx turns it
 * around the piece, dy moves it through the rings' pitches — *"dy also pushes"* the piece toward the pink gizmo; the pink ring *"stays at
 * the old centre"*; back *"never automatically"*).
 *
 * From the resting-face alignment on:
 * - the PIECE is pushed along a STRAIGHT LINE through the orbit centre (the pink gizmo) — the direction it had at the alignment, frozen —
 *   at the distance the rings give it at the rig's ring parameter (`orbitOffset`'s length, as today): dy moves it exactly as fast as
 *   before, dx no longer moves it;
 * - ⭐⭐ the CAMERA DOES NOT MOVE at the alignment (the owner: *"Why not simply slerp rotating the view axis of the camera to align with the
 *   piece and catch the orbit from there?"*): its VIEW AXIS slerps from the orbit centre to the piece, by FINGER TRAVEL over
 *   `pieceOrbitSlerpMm` (*"the view-axis slerp runs with finger travel like the centre move"* — then *"make the camera slerp faster (put
 *   a slider)"*: its own travel, 10 mm; it shared the centre move's 30 mm); it orbits
 *   the piece FROM WHERE IT IS — its angles around the piece the rings' (dx yaw, dy pitch, the offsets) plus the difference it had at the
 *   alignment, that difference FADING OUT with finger travel over `fadeMm` (*"fade out the starting angle offset"*); its distance the one
 *   it had, scaled as the piece comes in (`scaledGap`).
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ The mode's state: the frozen push direction (unit, from the orbit centre out to the piece), the finger travel since the alignment,
 * and — at the alignment — the camera's distance from the piece (`gap0M`), the piece's distance from the centre (`ring0M`), and the
 * camera's angles around the piece MINUS the rings' (`dAzRad`, `dElRad`: the starting offset that fades out). */
export interface PieceOrbit {
  readonly dir: Vec3;
  readonly travelledMm: number;
  readonly gap0M: number;
  readonly ring0M: number;
  /** ⭐ The piece's distance from the PINK GIZMO when it started (`pieceOrbitEnds`). */
  readonly pink0M: number;
  readonly dAzRad: number;
  readonly dElRad: number;
}

/** ⭐ Angles around a point of a direction from it — azimuth in the x–z plane (`cameraOffset`'s convention: x = cos az, z = sin az) and
 * elevation. */
export interface AroundAngles {
  readonly az: number;
  readonly el: number;
}

/** ⭐ A direction's angles (it need not be unit). */
export function anglesOf(d: Vec3): AroundAngles {
  const n = Math.hypot(d[0], d[1], d[2]) || 1;
  return { az: Math.atan2(d[2], d[0]), el: Math.asin(Math.max(-1, Math.min(1, d[1] / n))) };
}

/** ⭐ …and back: the unit direction at those angles. */
export function dirOf(a: AroundAngles): Vec3 {
  const c = Math.cos(a.el);
  return [c * Math.cos(a.az), Math.sin(a.el), c * Math.sin(a.az)];
}

const wrap = (a: number): number => {
  const w = a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
  return w <= -Math.PI ? w + 2 * Math.PI : w;
};

/**
 * ⭐ At the alignment: the push direction from the orbit centre to the piece (`fallbackDir` when the piece sits ON the centre); the camera's
 * distance from the piece; and its angles around the piece against the rings' (`ring`) — so the camera is EXACTLY where it was on the
 * frame the mode starts.
 */
export function startPieceOrbit(centre: Vec3, piece: Vec3, fallbackDir: Vec3, camera: Vec3, ring: AroundAngles, pink: Vec3 = centre): PieceOrbit {
  const v: Vec3 = [piece[0] - centre[0], piece[1] - centre[1], piece[2] - centre[2]];
  const n = Math.hypot(v[0], v[1], v[2]);
  const dir: Vec3 = n > 1e-9 ? [v[0] / n, v[1] / n, v[2] / n] : fallbackDir;
  const rel: Vec3 = [camera[0] - piece[0], camera[1] - piece[1], camera[2] - piece[2]];
  const gap0M = Math.hypot(rel[0], rel[1], rel[2]);
  const a = anglesOf(rel);
  const pink0M = Math.hypot(piece[0] - pink[0], piece[1] - pink[1], piece[2] - pink[2]);
  return { dir, travelledMm: 0, gap0M, ring0M: n, dAzRad: wrap(a.az - ring.az), dElRad: a.el - ring.el, pink0M };
}

/** ⭐ One step of finger travel, millimetres (the drag that drives the orbit). */
export function advancePieceOrbit(p: PieceOrbit, travelMm: number): PieceOrbit {
  return travelMm > 0 ? { ...p, travelledMm: p.travelledMm + travelMm } : p;
}

/** ⭐ A share of finger travel over `budgetMm`, eased in and out (smoothstep, as `OrbitCentreBlend`); a budget of zero is all at once. */
export function pieceOrbitProgress(p: PieceOrbit, budgetMm: number): number {
  if (budgetMm <= 0) return 1;
  const t = Math.min(1, p.travelledMm / budgetMm);
  return t * t * (3 - 2 * t);
}

/** ⭐ The piece: on the frozen line through the orbit centre, at `distM` from it. */
export function pushedPiece(centre: Vec3, dir: Vec3, distM: number): Vec3 {
  return [centre[0] + dir[0] * distM, centre[1] + dir[1] * distM, centre[2] + dir[2] * distM];
}

/** ⭐⭐ The camera around the piece: at the rings' angles plus the starting offset still left (it fades out over `fadeMm` of finger
 * travel), `gapM` from it. ⛔ The elevation held inside ±89° (as `cameraOffset`). */
export function pieceCamera(p: PieceOrbit, piece: Vec3, ring: AroundAngles, gapM: number, fadeMm: number): Vec3 {
  const left = 1 - pieceOrbitProgress(p, fadeMm);
  const lim = (89 * Math.PI) / 180;
  const d = dirOf({ az: ring.az + p.dAzRad * left, el: Math.max(-lim, Math.min(lim, ring.el + p.dElRad * left)) });
  return [piece[0] + d[0] * gapM, piece[1] + d[1] * gapM, piece[2] + d[2] * gapM];
}

/** ⭐⭐ The camera's VIEW AXIS: slerped from toward the orbit centre (`t` 0) to toward the piece (`t` 1), from where the camera is — a unit
 * direction. */
export function viewAxis(camera: Vec3, centre: Vec3, piece: Vec3, t: number): Vec3 {
  const unit = (v: Vec3): Vec3 => {
    const n = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / n, v[1] / n, v[2] / n];
  };
  const a = unit([centre[0] - camera[0], centre[1] - camera[1], centre[2] - camera[2]]);
  const b = unit([piece[0] - camera[0], piece[1] - camera[1], piece[2] - camera[2]]);
  const k = Math.min(1, Math.max(0, t));
  const cos = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(cos);
  if (om < 1e-6) return b;
  const s = Math.sin(om);
  const wa = Math.sin((1 - k) * om) / s;
  const wb = Math.sin(k * om) / s;
  return unit([a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb]);
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
 * ⭐⭐⭐ prototype — **THE YAW GAIN AROUND THE PIECE, ONE FOR THE WHOLE GAME** (the owner, 2026-10-06: *"lower gain while orbiting. Compute the
 * lower gain based on the geometry and the parameters already set by slider (camera position, etc.)"* — then *"the gain shall be unique
 * during the whole game, and computed based on the camera position dictated by the sliders values"*). Orbiting the PIECE, close to the
 * camera, the rest of the scene SLIDES across the screen, two to three times what it did turning in place about the centre — the same
 * smoothing, so larger steps per frame. The gain is the ratio of the scene's sweep (`points`, the play volume) for one small yaw step about
 * the CENTRE — the camera where the rings and the sliders put it (`gapM`: the radius offset at the boot zoom; the yaw and pitch offsets in
 * `camOffset`) — to that step about the PIECE at the gap the sliders give it there (`scaledGap`: `gapM` aligned at the rings' farthest,
 * `minPct` % at their closest), SUMMED over `vSamples` positions along the whole ring path and `yawSamples` yaws of a full turn. ⭐ It reads
 * no live state — recomputed only when a slider it depends on changes. ⛔ Never above 1 (it only LOWERS), never below `floor`.
 */
export function referenceYawGain(p: {
  readonly centre: Vec3;
  readonly ring: (yaw: number, v: number) => { readonly offsetM: Vec3; readonly radiusM: number };
  readonly camOffset: (yaw: number, v: number, rel: Vec3, gapM: number) => Vec3;
  readonly gapM: number;
  readonly minPct: number;
  readonly points: readonly Vec3[];
  readonly vSamples?: number;
  readonly yawSamples?: number;
  readonly floor?: number;
}): number {
  const nv = p.vSamples ?? 33;
  const ny = p.yawSamples ?? 8;
  const range = ringDistanceRange((v) => p.ring(0, v).radiusM, 64);
  const c = p.centre;
  const step = 1e-3;
  let aroundCentre = 0;
  let aroundPiece = 0;
  for (let j = 0; j < ny; j++) {
    const yaw = (2 * Math.PI * j) / ny;
    for (let i = 0; i < nv; i++) {
      const v = i / (nv - 1);
      const r = p.ring(yaw, v);
      const piece: Vec3 = [c[0] + r.offsetM[0], c[1] + r.offsetM[1], c[2] + r.offsetM[2]];
      const gapP = scaledGap(p.gapM, r.radiusM, range.maxM, range.minM, p.minPct);
      const centrePose = (y: number) => {
        const o = p.camOffset(y, v, p.ring(y, v).offsetM, p.gapM);
        return { cam: [c[0] + o[0], c[1] + o[1], c[2] + o[2]] as Vec3, look: c };
      };
      const piecePose = (y: number) => {
        const o = p.camOffset(y, v, [0, 0, 0], gapP);
        return { cam: [piece[0] + o[0], piece[1] + o[1], piece[2] + o[2]] as Vec3, look: piece };
      };
      aroundCentre += meanSweep(centrePose(yaw), centrePose(yaw + step), p.points);
      aroundPiece += meanSweep(piecePose(yaw), piecePose(yaw + step), p.points);
    }
  }
  if (!(aroundPiece > 1e-12) || !(aroundCentre > 1e-12)) return 1; // nothing in view to compare: no change
  return Math.min(1, Math.max(p.floor ?? 0.1, aroundCentre / aroundPiece));
}

/** ⭐ A slerp between two unit directions (`t` 0 → `a`, 1 → `b`). */
export function slerpDir(a: Vec3, b: Vec3, t: number): Vec3 {
  const k = Math.min(1, Math.max(0, t));
  const cos = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(cos);
  if (om < 1e-6) return k < 1 ? a : b;
  const s = Math.sin(om);
  const wa = Math.sin((1 - k) * om) / s;
  const wb = Math.sin(k * om) / s;
  const v: Vec3 = [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

/**
 * ⭐⭐ prototype — **THE ORBIT AROUND THE PIECE ENDS BY ITSELF** (the owner, 2026-10-07: *"Track the initial distance of the piece to pink
 * gizmo when orbit around the piece is triggered. Automatically end it when the distance crosses initial distance * x%"*): the piece now
 * closer to the pink gizmo than `endPct` % of its distance then (`pink0M`). ⛔ A start distance of zero never ends it.
 */
export function pieceOrbitEnds(pieceToPinkM: number, pink0M: number, endPct: number): boolean {
  return pink0M > 0 && pieceToPinkM < (pink0M * endPct) / 100;
}

/**
 * ⭐⭐⭐ prototype — **THE WAY BACK TO THE ORBIT AROUND THE CENTRE, THE WAY IN REVERSED** (the owner, 2026-10-07: *"When it ends (in this
 * case or at respawn), the camera orbit transition to center orbit is the same reverse as when it transitions from center orbit to piece
 * orbit"*). As the way in: on the frame it ends NOTHING MOVES — the camera where it was, looking where it looked; then, with FINGER TRAVEL,
 * its VIEW AXIS slerps from where it looked (`look0`) to the orbit centre (over the way in's `slerpMm`), and its difference from the centre
 * orbit's own pose — angles around the centre and distance from it (`dAzRad`, `dElRad`, `dRM`) — fades out (over the way in's `fadeMm`);
 * the PIECE likewise, its difference from where the rings put it (`pieceOff`; zero at a respawn, which puts it back at boot).
 */
export interface CentreReturn {
  readonly look0: Vec3;
  readonly dAzRad: number;
  readonly dElRad: number;
  readonly dRM: number;
  readonly pieceOff: Vec3;
  readonly travelledMm: number;
}

/** ⭐ At the end: from the camera as it is (`camera`, looking along `look0`) against the centre orbit's camera (`ringCam`, an offset from
 * the centre), and the piece as it is against where the rings put it. */
export function startCentreReturn(centre: Vec3, camera: Vec3, look0: Vec3, ringCam: Vec3, pieceOff: Vec3): CentreReturn {
  const rel: Vec3 = [camera[0] - centre[0], camera[1] - centre[1], camera[2] - centre[2]];
  const a = anglesOf(rel);
  const r = anglesOf(ringCam);
  return {
    look0,
    dAzRad: wrap(a.az - r.az),
    dElRad: a.el - r.el,
    dRM: Math.hypot(rel[0], rel[1], rel[2]) - Math.hypot(ringCam[0], ringCam[1], ringCam[2]),
    pieceOff,
    travelledMm: 0,
  };
}

/** ⭐ One step of finger travel, millimetres. */
export function advanceCentreReturn(r: CentreReturn, travelMm: number): CentreReturn {
  return travelMm > 0 ? { ...r, travelledMm: r.travelledMm + travelMm } : r;
}

/** ⭐ A share of finger travel over `budgetMm`, eased (smoothstep, as the way in); a budget of zero is at once. */
export function returnProgress(r: CentreReturn, budgetMm: number): number {
  if (budgetMm <= 0) return 1;
  const t = Math.min(1, r.travelledMm / budgetMm);
  return t * t * (3 - 2 * t);
}

/** ⭐⭐ The camera on its way back: the centre orbit's camera (`ringCam`, from the centre) plus the difference still left. ⛔ ±89°. */
export function returnCamera(r: CentreReturn, centre: Vec3, ringCam: Vec3, fadeMm: number): Vec3 {
  const left = 1 - returnProgress(r, fadeMm);
  const a = anglesOf(ringCam);
  const lim = (89 * Math.PI) / 180;
  const d = dirOf({ az: a.az + r.dAzRad * left, el: Math.max(-lim, Math.min(lim, a.el + r.dElRad * left)) });
  const dist = Math.hypot(ringCam[0], ringCam[1], ringCam[2]) + r.dRM * left;
  return [centre[0] + d[0] * dist, centre[1] + d[1] * dist, centre[2] + d[2] * dist];
}

/** ⭐⭐ Its view axis: from where it looked (`look0`) to the orbit centre, from where the camera is. */
export function returnLook(r: CentreReturn, camera: Vec3, centre: Vec3, slerpMm: number): Vec3 {
  const b: Vec3 = [centre[0] - camera[0], centre[1] - camera[1], centre[2] - camera[2]];
  const n = Math.hypot(b[0], b[1], b[2]) || 1;
  return slerpDir(r.look0, [b[0] / n, b[1] / n, b[2] / n], returnProgress(r, slerpMm));
}

/** ⭐ The piece's difference from the rings, still left. */
export function returnPieceOffset(r: CentreReturn, fadeMm: number): Vec3 {
  const left = 1 - returnProgress(r, fadeMm);
  return [r.pieceOff[0] * left, r.pieceOff[1] * left, r.pieceOff[2] * left];
}
