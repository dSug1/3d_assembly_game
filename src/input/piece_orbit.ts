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
 * - ⭐⭐ THE WAY IN (`PieceEntry`, 2026-10-08) mirrors the way out: the fingers keep the centre orbit while one progress brings the camera
 *   to the piece orbit's pose and its view from the gizmo to the piece; then the camera orbits the piece at the rings' angles, its
 *   distance the one it had, scaled as the piece comes in (`scaledGap`).
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ The orbit around the piece, once IN (`PieceEntry` is the way in): the frozen push direction (unit, from the orbit centre out to the
 * piece), the camera's distance from the piece (`gap0M`) and the piece's from the centre (`ring0M`) then — the gap's reference
 * (`scaledGap`) — and the piece's distance from the pink gizmo at the TAP (`pink0M`, `pieceOrbitEnds`). */
export interface PieceOrbit {
  readonly dir: Vec3;
  readonly gap0M: number;
  readonly ring0M: number;
  /** ⭐ The piece's distance from the PINK GIZMO when it started (the old end rule; kept for the record). */
  readonly pink0M: number;
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
 * ⭐ The orbit around the piece starts — at the END of the way in (`PieceEntry`): the push direction from the orbit centre to the piece
 * (`fallbackDir` when the piece sits ON the centre), the camera's distance from the piece, and the start distance to the pink gizmo carried
 * from the tap. The camera is then exactly where the piece orbit puts it (the way in brought it there).
 */
export function startPieceOrbit(centre: Vec3, piece: Vec3, fallbackDir: Vec3, camera: Vec3, pink0M: number): PieceOrbit {
  const v: Vec3 = [piece[0] - centre[0], piece[1] - centre[1], piece[2] - centre[2]];
  const n = Math.hypot(v[0], v[1], v[2]);
  const dir: Vec3 = n > 1e-9 ? [v[0] / n, v[1] / n, v[2] / n] : fallbackDir;
  const gap0M = Math.hypot(camera[0] - piece[0], camera[1] - piece[1], camera[2] - piece[2]);
  return { dir, gap0M, ring0M: n, pink0M };
}

/**
 * ⭐⭐⭐ prototype — **THE WAY IN, THE WAY OUT MIRRORED** (the owner, 2026-10-08: *"Start again from a5947c3 … Apply whatever of the way out
 * you can but making it simpler so the piece and gizmo stay in the view"* → the proposal agreed: *"Build the new way in"*). From the tap,
 * the fingers KEEP the centre orbit — dx carries the piece and the camera round the gizmo, dy moves the piece along the rings — so the
 * camera never gets round to the gizmo's side of the piece; meanwhile, ONE progress (finger travel over `enterMm`, eased, smoothed as the
 * orbit) blends the camera from where the centre orbit puts it to where the piece orbit will (the same angles, about the PIECE, at the
 * camera's distance from it at the tap — `entryCamera`), and aims its view at a point sliding from the gizmo to the piece (`entryLook`).
 * Done, the orbit around the piece starts (`startPieceOrbit`) with the camera already in its place. ⛔ The orbit around the piece used to
 * start AT the tap, dx swinging the camera round the piece during the transition (`802a498`, reverted: big sweeps with neither in view).
 */
export interface PieceEntry {
  /** ⭐ The camera's distance from the piece at the tap — its distance around the piece once in. */
  readonly gap0M: number;
  /** ⭐ The piece's distance from the pink gizmo at the tap (for the record: the end is measured from the piece orbit's start). */
  readonly pink0M: number;
  /** ⭐ The camera's angles round the piece at the tap MINUS the rings' (the yaw and pitch offsets' small shift) — they fade out. */
  readonly dAzRad: number;
  readonly dElRad: number;
  /**
   * ⭐⭐ THE PIVOT, HANDED OVER GRADUALLY (the owner, 2026-10-08: *"On the way in, when I input dx, the scene seems to continue to rotate
   * around the gizmo until one frame when the scene starts to really be pushed left or right by the dx. This is not what happens on the
   * way out"*): the piece's heading round the gizmo, carried by the orbit's yaw by the share LEFT of the way in (`carryHeading`) — all of
   * it at the tap (the centre orbit), none at the end (the piece orbit) — while the camera turns round the piece with all of it.
   */
  readonly headingRad: number;
  /** ⭐ The orbit's yaw last frame (`carryHeading` reads its change). */
  readonly lastYawRad: number;
  /** ⭐ Where it looked at the tap, as a TURN off the direction to the orbit centre (axis, angle) — it fades out. */
  readonly lookAxis: Vec3;
  readonly lookAngleRad: number;
  readonly travelledMm: number;
  readonly rawMm: number;
  readonly velMm: number;
}

/** ⭐ At the tap: the camera (`camera`, looking along `look0`) round the piece against the rings' angles (`ring`), the piece's distances,
 * and its heading round the gizmo — the orbit's yaw then (`yawRad`). */
export function startPieceEntry(centre: Vec3, piece: Vec3, camera: Vec3, look0: Vec3, pink: Vec3, ring: AroundAngles, yawRad: number): PieceEntry {
  const tw = turnBetween(unitOf([centre[0] - camera[0], centre[1] - camera[1], centre[2] - camera[2]]), unitOf(look0));
  const a = anglesOf([camera[0] - piece[0], camera[1] - piece[1], camera[2] - piece[2]]);
  return {
    gap0M: Math.hypot(camera[0] - piece[0], camera[1] - piece[1], camera[2] - piece[2]),
    pink0M: Math.hypot(piece[0] - pink[0], piece[1] - pink[1], piece[2] - pink[2]),
    dAzRad: wrap(a.az - ring.az),
    dElRad: a.el - ring.el,
    headingRad: yawRad,
    lastYawRad: yawRad,
    lookAxis: tw.axis,
    lookAngleRad: tw.angle,
    travelledMm: 0,
    rawMm: 0,
    velMm: 0,
  };
}

/** ⭐⭐ Each frame: the orbit's yaw changed by Δ since the last frame — the piece's heading round the gizmo moves by Δ × (1 − progress): with
 * the orbit at the tap, by less and less, not at all at the end (`headingRad`). */
export function carryHeading(e: PieceEntry, yawRad: number, enterMm: number): PieceEntry {
  const t = entryProgress(e, enterMm);
  return { ...e, headingRad: e.headingRad + wrap(yawRad - e.lastYawRad) * (1 - t), lastYawRad: yawRad };
}

/** ⭐ One step of finger travel, millimetres — into the raw count (`smoothTravel` eases what is read). */
export function advancePieceEntry(e: PieceEntry, travelMm: number): PieceEntry {
  return travelMm > 0 ? { ...e, rawMm: e.rawMm + travelMm } : e;
}

/** ⭐ The way in's ONE progress: the travel over `enterMm`, eased (smoothstep); a budget of zero is at once. */
export function entryProgress(e: PieceEntry, enterMm: number): number {
  if (enterMm <= 0) return 1;
  const t = Math.min(1, e.travelledMm / enterMm);
  return t * t * (3 - 2 * t);
}

/** ⭐⭐ The camera on the way in: ROUND THE PIECE as it is (carried round the gizmo by the share left, `carryHeading`), at the rings' angles
 * (`ring` — so dx turns it round the piece with all of the yaw) plus what is left of the tap's small shift (`dAzRad`, `dElRad`), `gap0M`
 * from it. At the tap exactly where it was; at the end exactly the piece orbit's pose. */
export function entryCamera(e: PieceEntry, piece: Vec3, ring: AroundAngles, enterMm: number): Vec3 {
  const left = 1 - entryProgress(e, enterMm);
  const lim = (89 * Math.PI) / 180;
  const d = dirOf({ az: ring.az + e.dAzRad * left, el: Math.max(-lim, Math.min(lim, ring.el + e.dElRad * left)) });
  return [piece[0] + d[0] * e.gap0M, piece[1] + d[1] * e.gap0M, piece[2] + d[2] * e.gap0M];
}

/**
 * ⭐⭐ Its view on the way in, TIED to the move: STRAIGHT AT a point sliding from the orbit centre to the piece, turned off it by what is
 * left of the tap's own turn. ⭐ The owner, 2026-10-08: *"you previously identified the visible turn therefore goes roughly as t² … I think
 * I want to retain the sliding point"* → *"build option A"* (look straight at it — the second blend, which squared the turn, removed) →
 * *"build option B without Option A"*: the point slides at the pace that TURNS THE VIEW EVENLY (\`evenSlide\`) — where its direction from the
 * camera has turned the eased share of the whole angle, so the turn no longer gathers toward the piece end as the point nears the camera.
 */
export function entryLook(e: PieceEntry, camera: Vec3, centre: Vec3, piece: Vec3, enterMm: number): Vec3 {
  const t = entryProgress(e, enterMm);
  const s = evenSlide(camera, centre, piece, t);
  const aim: Vec3 = [centre[0] + (piece[0] - centre[0]) * s, centre[1] + (piece[1] - centre[1]) * s, centre[2] + (piece[2] - centre[2]) * s];
  const b = unitOf([aim[0] - camera[0], aim[1] - camera[1], aim[2] - camera[2]]);
  return unitOf(rotateAbout(b, e.lookAxis, e.lookAngleRad * (1 - t)));
}

/**
 * ⭐⭐ prototype — **OPTION B: THE SLIDE PACED TO TURN THE VIEW EVENLY** (2026-10-08): the fraction \`s\` of the way from the orbit centre
 * (\`centre\`) to the piece at which the point's direction from the camera has turned \`t\` × the whole angle between the two. The sine rule
 * in the triangle camera–centre–point: |centre→point| = |camera→centre| · sin(t·θ) / sin(t·θ + α), α the angle at the centre between the
 * camera and the piece. Far from the camera the point slides fast, near it slowly — the view turns at one pace. ⛔ A degenerate triangle
 * (the three in a line): \`t\` itself.
 */
export function evenSlide(camera: Vec3, centre: Vec3, piece: Vec3, t: number): number {
  const k = Math.min(1, Math.max(0, t));
  const pc: Vec3 = [centre[0] - camera[0], centre[1] - camera[1], centre[2] - camera[2]];
  const cq: Vec3 = [piece[0] - centre[0], piece[1] - centre[1], piece[2] - centre[2]];
  const lpc = Math.hypot(pc[0], pc[1], pc[2]);
  const lcq = Math.hypot(cq[0], cq[1], cq[2]);
  if (!(lpc > 1e-9) || !(lcq > 1e-9)) return k;
  const toC = unitOf(pc);
  const toQ = unitOf([piece[0] - camera[0], piece[1] - camera[1], piece[2] - camera[2]]);
  const theta = Math.acos(Math.max(-1, Math.min(1, toC[0] * toQ[0] + toC[1] * toQ[1] + toC[2] * toQ[2])));
  // α: at the centre, between the camera (−pc) and the piece (cq)
  const alpha = Math.acos(Math.max(-1, Math.min(1, -(pc[0] * cq[0] + pc[1] * cq[1] + pc[2] * cq[2]) / (lpc * lcq))));
  const den = Math.sin(k * theta + alpha);
  if (!(theta > 1e-9) || !(Math.abs(den) > 1e-9)) return k;
  return Math.min(1, Math.max(0, (lpc * Math.sin(k * theta)) / den / lcq));
}

/** ⭐ The turn taking unit `from` onto unit `to`: its unit axis and angle (a vertical axis when there is none). */
function turnBetween(from: Vec3, to: Vec3): { readonly axis: Vec3; readonly angle: number } {
  const ax: Vec3 = [from[1] * to[2] - from[2] * to[1], from[2] * to[0] - from[0] * to[2], from[0] * to[1] - from[1] * to[0]];
  const s = Math.hypot(ax[0], ax[1], ax[2]);
  const c = from[0] * to[0] + from[1] * to[1] + from[2] * to[2];
  return { axis: s > 1e-9 ? [ax[0] / s, ax[1] / s, ax[2] / s] : [0, 1, 0], angle: Math.atan2(s, c) };
}

/**
 * ⭐⭐⭐ prototype — **THE TRANSITIONS EASE EVERY FRAME, AS THE ORBIT DOES** (the owner, 2026-10-07: *"Smooth the movement of the camera at
 * start and end of piece orbit"* — *"why … the movement of the camera with delta position input is much less smooth than during standard
 * orbit?"*). The finger's travel arrives once per pointer EVENT (47–68 ms apart on the tablet, `D86`) and the transitions read it raw, so
 * they jumped at the event rate — a 10 mm slerp 20–30 % per event — while the orbit itself eases every frame on its spring. Now the travel
 * they read (`travelledMm`) follows the raw count (`rawMm`) on the SAME critically damped spring as the orbit (τ = `boxSmoothMs` / 2,
 * `springOrbit`'s): continuous position and speed, no event steps. τ 0: the raw count at once.
 */
export function smoothTravel<T extends { readonly travelledMm: number; readonly rawMm: number; readonly velMm: number }>(p: T, dtMs: number, tauMs: number): T {
  if (!(tauMs > 0) || !(dtMs > 0)) return p.travelledMm === p.rawMm && p.velMm === 0 ? p : { ...p, travelledMm: p.rawMm, velMm: 0 };
  const w = 1 / tauMs;
  const e = Math.exp(-w * dtMs);
  const d = p.travelledMm - p.rawMm;
  let x = p.rawMm + (d + (p.velMm + w * d) * dtMs) * e;
  let v = (p.velMm - w * (p.velMm + w * d) * dtMs) * e;
  // ⭐ settled: exactly the raw count (a spring only approaches it), and never past it (the travel only grows)
  if (Math.abs(p.rawMm - x) < 1e-3 && Math.abs(v) < 1e-4) {
    x = p.rawMm;
    v = 0;
  }
  if (x > p.rawMm) {
    x = p.rawMm;
    v = 0;
  }
  return { ...p, travelledMm: Math.max(p.travelledMm, x), velMm: v };
}

/** ⭐ The piece: on the frozen line through the orbit centre, at `distM` from it. */
export function pushedPiece(centre: Vec3, dir: Vec3, distM: number): Vec3 {
  return [centre[0] + dir[0] * distM, centre[1] + dir[1] * distM, centre[2] + dir[2] * distM];
}

/** ⭐⭐ The camera around the piece: at the rings' angles (`ring` — the rig's yaw and ring pitch, the offsets), `gapM` from it. ⛔ The
 * elevation held inside ±89° (as `cameraOffset`). */
export function pieceCamera(piece: Vec3, ring: AroundAngles, gapM: number): Vec3 {
  const lim = (89 * Math.PI) / 180;
  const d = dirOf({ az: ring.az, el: Math.max(-lim, Math.min(lim, ring.el)) });
  return [piece[0] + d[0] * gapM, piece[1] + d[1] * gapM, piece[2] + d[2] * gapM];
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
 * ⭐⭐⭐ prototype — **THE SPHERE ROUND THE PINK GIZMO DRIVES THE WAYS IN AND OUT** (the owner, 2026-10-08: *"Create a sphere radius x centered on
 * pink gizmo, slider for x, default = 1m, translucent white. When the piece enters the sphere, automatically trigger way out. When the piece
 * exits the sphere, automatically trigger way in. place an hysteresis of 10% on the crossing … The way in and way out are therefore
 * disconnected from resting face"* — the band ±10 %, a way in at boot when outside). Whether the piece is OUTSIDE the sphere (the orbit
 * around the piece) now: it goes inside only below (1 − 10 %) × the radius, outside only beyond (1 + 10 %) × — no flicker on the surface.
 * `wasOutside` `null` (boot, a respawn): the plain side of the radius. ⛔ It replaced the end at x % of the start distance plus a clear push.
 */
export const SPHERE_HYSTERESIS = 0.1;

export function outsideSphere(distM: number, radiusM: number, wasOutside: boolean | null): boolean {
  if (wasOutside === null) return distM > radiusM;
  return wasOutside ? !(distM < radiusM * (1 - SPHERE_HYSTERESIS)) : distM > radiusM * (1 + SPHERE_HYSTERESIS);
}

/**
 * ⭐⭐⭐ prototype — **THE WAY BACK TO THE ORBIT AROUND THE CENTRE** (the owner, 2026-10-07: *"When it ends (in this case or at respawn), the
 * camera orbit transition to center orbit is the same reverse as when it transitions from center orbit to piece orbit"* — then, the piece
 * lost from view on the way back when the camera started between it and the gizmo: *"both together"* — moving AROUND THE PIECE, the view
 * TIED to the move — *"with 10mm and 60mm merged into one single value"*, 60 mm).
 * On the frame it ends NOTHING MOVES — the camera where it was, looking where it looked. Then ONE progress, by finger travel over
 * `returnMm` (eased), drives everything:
 * - the CAMERA moves AROUND THE PIECE — its angles around the piece and its distance from it (`dAzRad`, `dElRad`, `dRM`, against the centre
 *   orbit's home camera seen from the piece) fading out — so it keeps its distance from the piece and never swings round the gizmo;
 * - its VIEW aims at a point sliding from the PIECE to the ORBIT CENTRE (the pink gizmo) at that same progress — it reaches the gizmo only
 *   when the camera is home, the piece in view all the way;
 * - the PIECE's difference from where the rings put it (`pieceOff`; zero at a respawn, which puts it back at boot) fades out with it.
 * ⛔ It moved around the CENTRE, its view on the gizmo after 10 mm and its place after 60 — the piece behind the camera in between.
 */
export interface CentreReturn {
  readonly look0: Vec3;
  /** ⭐ The view's start as a TURN off the direction to the piece (axis, angle) — it fades out, so it follows the camera as it moves. */
  readonly lookAxis: Vec3;
  readonly lookAngleRad: number;
  readonly dAzRad: number;
  readonly dElRad: number;
  readonly dRM: number;
  readonly pieceOff: Vec3;
  readonly travelledMm: number;
  readonly rawMm: number;
  readonly velMm: number;
}

/** ⭐ At the end: the camera as it is (`camera`, looking along `look0`) seen from the piece (`piece`), against the centre orbit's home camera
 * seen from the piece (`homeRel`), and the piece as it is against where the rings put it (`pieceOff`). */
export function startCentreReturn(piece: Vec3, camera: Vec3, look0: Vec3, homeRel: Vec3, pieceOff: Vec3): CentreReturn {
  const rel: Vec3 = [camera[0] - piece[0], camera[1] - piece[1], camera[2] - piece[2]];
  const a = anglesOf(rel);
  const h = anglesOf(homeRel);
  // ⭐ where it looked, as a turn off the direction to the piece — never a fixed world direction (it went stale as dx carried the camera)
  const u = unitOf([piece[0] - camera[0], piece[1] - camera[1], piece[2] - camera[2]]);
  const ax: Vec3 = [u[1] * look0[2] - u[2] * look0[1], u[2] * look0[0] - u[0] * look0[2], u[0] * look0[1] - u[1] * look0[0]];
  const sinA = Math.hypot(ax[0], ax[1], ax[2]);
  const cosA = u[0] * look0[0] + u[1] * look0[1] + u[2] * look0[2];
  return {
    look0,
    lookAxis: sinA > 1e-9 ? [ax[0] / sinA, ax[1] / sinA, ax[2] / sinA] : [0, 1, 0],
    lookAngleRad: Math.atan2(sinA, cosA),
    dAzRad: wrap(a.az - h.az),
    dElRad: a.el - h.el,
    dRM: Math.hypot(rel[0], rel[1], rel[2]) - Math.hypot(homeRel[0], homeRel[1], homeRel[2]),
    pieceOff,
    travelledMm: 0,
    rawMm: 0,
    velMm: 0,
  };
}

/** ⭐ One step of finger travel, millimetres — into the raw count (`smoothTravel` eases what is read). */
export function advanceCentreReturn(r: CentreReturn, travelMm: number): CentreReturn {
  return travelMm > 0 ? { ...r, rawMm: r.rawMm + travelMm } : r;
}

/** ⭐ The ONE progress of the way back: the travel over `returnMm`, eased (smoothstep); a budget of zero is at once. */
export function returnProgress(r: CentreReturn, returnMm: number): number {
  if (returnMm <= 0) return 1;
  const t = Math.min(1, r.travelledMm / returnMm);
  return t * t * (3 - 2 * t);
}

/** ⭐⭐ The camera on its way back, AROUND THE PIECE: the home camera seen from the piece (`homeRel`) plus the difference still left. ⛔ ±89°. */
export function returnCamera(r: CentreReturn, piece: Vec3, homeRel: Vec3, returnMm: number): Vec3 {
  const left = 1 - returnProgress(r, returnMm);
  const h = anglesOf(homeRel);
  const lim = (89 * Math.PI) / 180;
  const d = dirOf({ az: h.az + r.dAzRad * left, el: Math.max(-lim, Math.min(lim, h.el + r.dElRad * left)) });
  const dist = Math.hypot(homeRel[0], homeRel[1], homeRel[2]) + r.dRM * left;
  return [piece[0] + d[0] * dist, piece[1] + d[1] * dist, piece[2] + d[2] * dist];
}

/**
 * ⭐⭐ Its view, TIED TO THE MOVE: toward a point sliding from the piece to the orbit centre at the same progress `t`, turned off it by what
 * is LEFT of the start's turn (`lookAxis`, `lookAngleRad` × (1 − `t`)) — so at the start it looks exactly where it looked, and the turn
 * follows the camera wherever dx carries it (⛔ a slerp from the fixed world direction `look0` pointed off the scene after a long drag).
 * At `t` 1 it looks at the centre, the camera home.
 */
export function returnLook(r: CentreReturn, camera: Vec3, piece: Vec3, centre: Vec3, returnMm: number): Vec3 {
  const t = returnProgress(r, returnMm);
  const aim: Vec3 = [piece[0] + (centre[0] - piece[0]) * t, piece[1] + (centre[1] - piece[1]) * t, piece[2] + (centre[2] - piece[2]) * t];
  // ⭐ from the LIVE direction to the piece toward that point by `t` too — the piece kept nearer the middle of the view on the way
  const toPiece = unitOf([piece[0] - camera[0], piece[1] - camera[1], piece[2] - camera[2]]);
  const b = slerpDir(toPiece, unitOf([aim[0] - camera[0], aim[1] - camera[1], aim[2] - camera[2]]), t);
  return unitOf(rotateAbout(b, r.lookAxis, r.lookAngleRad * (1 - t)));
}

/** ⭐ A unit vector (a zero one stays zero). */
function unitOf(v: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

/** ⭐ `v` turned about the unit `axis` by `angle` (Rodrigues). */
function rotateAbout(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const d = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
  const x: Vec3 = [axis[1] * v[2] - axis[2] * v[1], axis[2] * v[0] - axis[0] * v[2], axis[0] * v[1] - axis[1] * v[0]];
  return [v[0] * c + x[0] * s + axis[0] * d * (1 - c), v[1] * c + x[1] * s + axis[1] * d * (1 - c), v[2] * c + x[2] * s + axis[2] * d * (1 - c)];
}

/** ⭐ The piece's difference from the rings, still left. */
export function returnPieceOffset(r: CentreReturn, returnMm: number): Vec3 {
  const left = 1 - returnProgress(r, returnMm);
  return [r.pieceOff[0] * left, r.pieceOff[1] * left, r.pieceOff[2] * left];
}
