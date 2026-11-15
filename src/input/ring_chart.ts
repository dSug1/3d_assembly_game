/**
 * ⭐⭐⭐ (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §2.4, §3 5. — step 1.3; the owner: *"Charts approved. … Proceed with execution."*)
 * **THE RINGS CHART — the orbit's last fallback**, engine-free, not wired yet (step 2.1 wires it): for the faces no COLUMNS chart serves, the gizmo's
 * place for (yaw, pitch) is where the LEVEL RING at the pitch's height meets the half-plane of that azimuth about the SPINE (the bottom end's centre → the
 * top end's centre). Straight on every face, one-to-one on any convex shape, never blocked; not square (§2.4).
 *
 * 1. **The chart** (`buildRingChart`, built once per face map): the two ends along the map's vertical (`columnsChart`'s — a level face a cap, an edge or a
 *    point the pole), the spine, the LEVELS (every side corner's height and the two ends), each level's pitch from the rings' mean elevations just below
 *    and just above (the repair: every interval keeps a quarter of its share by the height), and per height band the side faces that reach it.
 * 2. **The place** (`ringTarget`): `mapTarget`'s result shape — the band, the facet (`stack`), its normal, the point, `across`.
 * 3. **The way back** (`ringAngles`): the angles whose place is a given point of a given facet.
 * It works in the map's own coordinates, its vertical the map's y — the game hands it the WORLD face map (gravity's chart; §3 5.).
 * ⭐ The reference this module is checked against, on 35 shapes: `scripts/probes/chart_lib.ts` (`buildChart(…, true)`, `ringHit`, `target`, `anglesOf`) —
 * `scripts/probes/ring_chart_check.ts`.
 * ⛔ ENGINE-FREE. Plane cuts of a convex polygon, a ray against a segment, piecewise-linear maps — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";
import { CHART_LEVEL_M, chordAt, type FaceMap, type MapTarget } from "./face_map";
import { columnsChart, type ChartEnd, type ChartFace } from "./orbit_charts";

const H = Math.PI / 2;
const Y: Vec3 = [0, 1, 0];

/** ⭐ A level's pitch is read from the rings this share of the chart's height below and above it (§2.4: "just below and just above"). */
const RING_MEAN_SHARE = 1e-4;
/** ⭐ The repair: every interval between two levels keeps at least this share of its pitch by the height (§2.2's — two levels never at one pitch). */
const RING_GAP_SHARE = 0.25;
/** ⭐ A cap's rim is read on the ring this far (m) inside the cap's height — the side faces' outline just below a top (above a bottom), never the cap's. */
const RING_RIM_M = 1e-6;
/** ⭐ A side place's height is held this far (m) inside the two ends — the ring there still cuts the side faces (a pole has no ring). */
const RING_INSIDE_M = 1e-7;
/** ⭐ A meridian meets a face's chord within this share past either end of it (the chord's shared corners: the neighbour's hit is as good). */
const RING_ON_CHORD = 1e-9;
/** ⭐ Rounding: a corner this close (m) to the ring's height is on it; a pitch this close (rad) to a band's end is in the band; a face reaches a height this close. */
const RING_ROUND = 1e-12;
/** ⭐ Rounding: a meridian this near parallel to a chord (the 2D cross product, m) does not cut it. */
const RING_PARALLEL = 1e-15;
/** ⭐ The way back: a cap point this close (m) to the cap's centre is the pole (any yaw). */
const RING_POLE_M = 1e-9;
/** ⭐ The way back on a cap: the yaw is solved when its rim's direction from the centre is the point's within this (rad)… */
const RING_YAW_RAD = 1e-14;
/** ⭐ …or after this many steps (each one closes the gap by the spine's offset from the centre against the rim's radius: 1e-6 on the shed). */
const RING_YAW_STEPS = 8;

/** a side face of the rings chart: its contour index, its height extent, its corners flat (x, y, z …) */
interface RingSide {
  readonly i: number;
  readonly yLo: number;
  readonly yHi: number;
  readonly xyz: Float64Array;
}

/**
 * ⭐⭐⭐ The RINGS chart of a face map (§2.4): its contour, its two ends (`columnsChart`'s — the contour index of a cap in `cap`, the centre in the map's
 * coordinates), its levels (`y` every side corner's height and the ends, `p` each one's pitch), and what makes the place cheap — the side faces, flat,
 * listed per height band.
 */
export interface RingChart {
  readonly map: FaceMap;
  readonly faces: readonly ChartFace[];
  readonly top: ChartEnd;
  readonly bottom: ChartEnd;
  readonly levels: { readonly y: readonly number[]; readonly p: readonly number[] };
  /** per map facet, its contour index (−1: not in the contour) */
  readonly contourIndex: Int32Array;
  readonly sides: readonly RingSide[];
  /** per band between two levels (`levels.y[k]` … `[k + 1]`), the sides reaching it */
  readonly bands: readonly (readonly RingSide[])[];
  /** the ring's cut of one face, reused by every call (at most a face's corners) */
  readonly scratch: Float64Array;
}

/** the ring's mean elevation at the height `y`: the side faces it cuts strictly (a corner on it does not count), each by its chord's length */
function ringMean(sides: readonly ChartFace[], y: number): number {
  let w = 0;
  let e = 0;
  for (const f of sides) {
    let yLo = Infinity;
    let yHi = -Infinity;
    for (const p of f.pts) {
      if (p[1] < yLo) yLo = p[1];
      if (p[1] > yHi) yHi = p[1];
    }
    if (y < yLo || y > yHi) continue;
    const X: Vec3[] = [];
    for (let k = 0; k < f.pts.length; k++) {
      const p = f.pts[k]!;
      const q = f.pts[(k + 1) % f.pts.length]!;
      const dp = p[1] - y;
      const dq = q[1] - y;
      if (dp * dq < 0) {
        const t = dp / (dp - dq);
        X.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]);
      }
    }
    if (X.length >= 2) {
      const a = X[0]!;
      const b = X[1]!;
      const l = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      w += l;
      e += l * Math.asin(Math.max(-1, Math.min(1, f.n[1])));
    }
  }
  return w > 0 ? e / w : 0;
}

/**
 * ⭐⭐⭐ (§2.4, step 1.3) THE RINGS CHART OF A FACE MAP, built once per map — `contour` MUST be `chartContour(map)` (the wiring computes it once at each
 * seat, for the assignment and for this chart):
 * * the ENDS along the map's vertical — `columnsChart`'s about the map's y: a level face (within `CHART_CAP_DEG`) a CAP, else the corners within
 *   `CHART_LEVEL_M` of the end height an EDGE (its middle) or a POINT; the SPINE from the bottom end's centre to the top end's;
 * * the LEVELS — every side face's corner height and the two ends, merged within `CHART_LEVEL_M` (the first and last set to the ends exactly);
 * * each level's PITCH — a pole end ∓90°; else the mean of the ring's mean elevation (`ringMean`, the faces by their chords) `RING_MEAN_SHARE` of the
 *   height below and above it, a cap's side counting ∓90°; THE REPAIR (§2.2's) — upward then downward, every interval keeps at least `RING_GAP_SHARE`
 *   of its share of the pitch range by the height: two levels never at one pitch.
 */
export function buildRingChart(map: FaceMap, contour: readonly ChartFace[]): RingChart {
  const ends = columnsChart(contour, Y);
  const { top, bottom } = ends;
  const LO = bottom.y;
  const HI = top.y;
  const sideFaces = contour.filter((_, i) => i !== top.cap && i !== bottom.cap);
  const contourIndex = new Int32Array(map.facets.length).fill(-1);
  contour.forEach((f, i) => {
    contourIndex[f.index] = i;
  });
  let most = 3;
  const sides: RingSide[] = [];
  contour.forEach((f, i) => {
    if (i === top.cap || i === bottom.cap) return;
    const xyz = new Float64Array(3 * f.pts.length);
    let yLo = Infinity;
    let yHi = -Infinity;
    f.pts.forEach((p, k) => {
      xyz[3 * k] = p[0];
      xyz[3 * k + 1] = p[1];
      xyz[3 * k + 2] = p[2];
      if (p[1] < yLo) yLo = p[1];
      if (p[1] > yHi) yHi = p[1];
    });
    most = Math.max(most, f.pts.length);
    sides.push({ i, yLo, yHi, xyz });
  });
  // the levels: every side corner's height and the ends
  const raw: number[] = [LO, HI];
  for (const f of sideFaces) for (const p of f.pts) raw.push(p[1]);
  raw.sort((a, b) => a - b);
  const ys: number[] = [];
  for (const y of raw) if (ys.length === 0 || y - ys[ys.length - 1]! > CHART_LEVEL_M) ys.push(y);
  ys[0] = LO;
  ys[ys.length - 1] = HI;
  const eps = RING_MEAN_SHARE * (HI - LO);
  const ps = ys.map((y, k) => {
    const first = k === 0;
    const last = k === ys.length - 1;
    if (first && bottom.kind !== "FACE") return -H;
    if (last && top.kind !== "FACE") return H;
    return ((first ? -H : ringMean(sideFaces, y - eps)) + (last ? H : ringMean(sideFaces, y + eps))) / 2;
  });
  // the repair
  const n = ps.length;
  const gap = (k: number): number => (RING_GAP_SHARE * (ys[k]! - ys[k - 1]!) * (ps[n - 1]! - ps[0]!)) / (HI - LO);
  for (let k = 1; k < n - 1; k++) ps[k] = Math.max(ps[k]!, ps[k - 1]! + gap(k));
  for (let k = n - 2; k >= 1; k--) ps[k] = Math.min(ps[k]!, ps[k + 1]! - gap(k + 1));
  // per height band, the sides reaching it
  const bands: RingSide[][] = [];
  for (let k = 0; k + 1 < ys.length; k++) bands.push(sides.filter((s) => s.yLo - RING_ROUND <= ys[k + 1]! && s.yHi + RING_ROUND >= ys[k]!));
  if (bands.length === 0) bands.push([...sides]);
  return { map, faces: contour, top, bottom, levels: { y: ys, p: ps }, contourIndex, sides, bands, scratch: new Float64Array(3 * most) };
}

/** the height band holding `y` (its index among `levels.y`'s intervals; outside: the nearest) */
function bandOf(ys: readonly number[], y: number): number {
  let lo = 0;
  let hi = ys.length - 2;
  if (hi <= 0) return 0;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (ys[m]! <= y) lo = m;
    else hi = m - 1;
  }
  return lo;
}
/** the height at the pitch `p` on the levels — linear between two, held beyond the ends */
function heightAt(lv: RingChart["levels"], p: number): number {
  const P = lv.p;
  const n = P.length;
  if (p <= P[0]!) return lv.y[0]!;
  if (p >= P[n - 1]!) return lv.y[n - 1]!;
  let k = 0;
  while (k < n - 2 && p > P[k + 1]!) k++;
  return lv.y[k]! + ((p - P[k]!) / (P[k + 1]! - P[k]!)) * (lv.y[k + 1]! - lv.y[k]!);
}
/** …and back: the pitch at the height `y` */
function pitchAt(lv: RingChart["levels"], y: number): number {
  const Ys = lv.y;
  const n = Ys.length;
  if (y <= Ys[0]!) return lv.p[0]!;
  if (y >= Ys[n - 1]!) return lv.p[n - 1]!;
  let k = 0;
  while (k < n - 2 && y > Ys[k + 1]!) k++;
  return lv.p[k]! + ((y - Ys[k]!) / (Ys[k + 1]! - Ys[k]!)) * (lv.p[k + 1]! - lv.p[k]!);
}

/** the squared distance between the points `i` and `j` of a flat list */
function d2(X: Float64Array, i: number, j: number): number {
  const ex = X[3 * j]! - X[3 * i]!;
  const ey = X[3 * j + 1]! - X[3 * i + 1]!;
  const ez = X[3 * j + 2]! - X[3 * i + 2]!;
  return ex * ex + ey * ey + ez * ez;
}

/** the last `ringHit`'s answer: the contour index of the face, the point's x and z (its y the ring's) — no allocation per call */
let hitFace = -1;
let hitX = 0;
let hitZ = 0;

/**
 * where the level ring at the height `y` meets the meridian of azimuth `yaw` about the spine: of the side faces the ring cuts (a corner on it counts), the
 * one whose cut (its two farthest points) the ray from the spine leaves the farthest — the outline on a convex shape. Writes `hitFace` / `hitX` / `hitZ`;
 * false: none.
 */
function ringHit(c: RingChart, y: number, yaw: number): boolean {
  const u = (y - c.bottom.y) / (c.top.y - c.bottom.y);
  const cx = c.bottom.centre[0] + u * (c.top.centre[0] - c.bottom.centre[0]);
  const cz = c.bottom.centre[2] + u * (c.top.centre[2] - c.bottom.centre[2]);
  const dx = Math.cos(yaw);
  const dz = Math.sin(yaw);
  const X = c.scratch;
  let bu = 0;
  hitFace = -1;
  for (const s of c.bands[bandOf(c.levels.y, y)]!) {
    if (y < s.yLo - RING_ROUND || y > s.yHi + RING_ROUND) continue;
    const P = s.xyz;
    const m = P.length / 3;
    let nx = 0;
    for (let k = 0; k < m; k++) {
      const j = k + 1 < m ? k + 1 : 0;
      const px = P[3 * k]!;
      const py = P[3 * k + 1]!;
      const pz = P[3 * k + 2]!;
      const dp = py - y;
      const dq = P[3 * j + 1]! - y;
      if (Math.abs(dp) <= RING_ROUND) {
        X[3 * nx] = px;
        X[3 * nx + 1] = py;
        X[3 * nx + 2] = pz;
        nx++;
      } else if (dp * dq < 0 && Math.abs(dq) > RING_ROUND) {
        const t = dp / (dp - dq);
        X[3 * nx] = px + t * (P[3 * j]! - px);
        X[3 * nx + 1] = y;
        X[3 * nx + 2] = pz + t * (P[3 * j + 2]! - pz);
        nx++;
      }
    }
    if (nx < 2) continue;
    // the cut's two farthest points (the first pair kept on a tie)
    let a = 0;
    let b = 1;
    let best = d2(X, 0, 1);
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nx; j++) {
        const d = d2(X, i, j);
        if (d > best) {
          a = i;
          b = j;
          best = d;
        }
      }
    const Ax = X[3 * a]!;
    const Az = X[3 * a + 2]!;
    const ex = X[3 * b]! - Ax;
    const ez = X[3 * b + 2]! - Az;
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < RING_PARALLEL) continue;
    const ax = Ax - cx;
    const az = Az - cz;
    const uu = (ax * ez - az * ex) / den;
    const v = (ax * dz - az * dx) / den;
    if (uu > RING_ROUND && v >= -RING_ON_CHORD && v <= 1 + RING_ON_CHORD && uu > bu) {
      bu = uu;
      hitFace = s.i;
      hitX = cx + uu * dx;
      hitZ = cz + uu * dz;
    }
  }
  return hitFace >= 0;
}

/** the place's result: the facet `fi`'s normal and `across` (the point along its `t`, its chord at the point's `b`) */
function placeOn(c: RingChart, band: MapTarget["band"], fi: number, surface: Vec3): MapTarget {
  const f = c.map.facets[fi];
  if (f === undefined) return { band, side: -1, stack: -1, normal: Y, surface, across: { L: 0, lo: 0, hi: 0 } };
  const ch = chordAt(f, f.b[0] * surface[0] + f.b[1] * surface[1] + f.b[2] * surface[2]);
  return { band, side: -1, stack: fi, normal: f.n, surface, across: { L: f.t[0] * surface[0] + f.t[1] * surface[1] + f.t[2] * surface[2], lo: ch.lo, hi: ch.hi } };
}

/**
 * ⭐⭐⭐ (§2.4, step 1.3) THE RINGS PLACE for the orbit's `yaw` and `pitch` (the orbit's convention: x = cos, z = sin; pitch up +), in `mapTarget`'s shape so
 * the code after the map takes either:
 * * between the end levels' pitches — band SIDE: the height at the pitch on the levels (held `RING_INSIDE_M` inside the ends), the ring there met by the
 *   meridian of the yaw about the spine (`ringHit`): that face and that point;
 * * beyond a cap's level (a top / bottom FACE) — band TOP / BOTTOM: from the cap's RIM (where the meridian of that azimuth leaves the side faces, on the ring
 *   `RING_RIM_M` inside the cap's height, set at the cap's height) to the cap's CENTRE (its centroid), by the share of the pitch from that level to ±90°.
 * `stack` the facet's index in the map, `normal` its outward normal, `surface` the point, `across` the point along the facet's `t` and the facet's chord at
 * the point's `b` (`chordAt`). ⚠ `side` is −1 ALWAYS: the rings have no column — the yaw is an azimuth about the spine, not a slice — and every reader of
 * `map.columns[side]` already branches on `undefined`. ⚠ No face on the ring (never on a convex shape): `stack` −1, the end's centre nearer the pitch.
 */
export function ringTarget(c: RingChart, yaw: number, pitch: number): MapTarget {
  const P = Math.max(-H, Math.min(H, pitch));
  const lv = c.levels;
  const pm = lv.p[lv.p.length - 1]!;
  const p0 = lv.p[0]!;
  const up = P > pm + RING_ROUND;
  const dn = P < p0 - RING_ROUND;
  if (up || dn) {
    const end = up ? c.top : c.bottom;
    const span = up ? H - pm : p0 + H;
    const g = span > RING_ROUND ? (up ? P - pm : p0 - P) / span : 1;
    const C = end.centre;
    const hit = ringHit(c, up ? end.y - RING_RIM_M : end.y + RING_RIM_M, yaw);
    const rx = hit ? hitX : C[0];
    const ry = hit ? end.y : C[1];
    const rz = hit ? hitZ : C[2];
    const k = 1 - g;
    return placeOn(c, up ? "TOP" : "BOTTOM", c.faces[end.cap]?.index ?? -1, [C[0] + (rx - C[0]) * k, C[1] + (ry - C[1]) * k, C[2] + (rz - C[2]) * k]);
  }
  const y = Math.max(c.bottom.y + RING_INSIDE_M, Math.min(c.top.y - RING_INSIDE_M, heightAt(lv, P)));
  if (!ringHit(c, y, yaw)) {
    const C = P > 0 ? c.top.centre : c.bottom.centre;
    return placeOn(c, "SIDE", -1, [C[0], C[1], C[2]]);
  }
  return placeOn(c, "SIDE", c.faces[hitFace]!.index, [hitX, y, hitZ]);
}

/**
 * ⭐⭐⭐ (§2.4, step 1.3) …AND BACK: the angles whose rings place is the point `p` of the map's facet `fi` (a seam: the rings put where the gizmo is).
 * A cap of the chart: the yaw whose RIM (`ringTarget`'s — the meridian about the spine `RING_RIM_M` inside the cap) lies along the point's direction from
 * the cap's centre (solved by steps, `RING_YAW_RAD` / `RING_YAW_STEPS`: a slanted spine meets the rim's ring off the centre), the pitch by the point's share
 * of the way from that rim to the centre — the centre itself (within `RING_POLE_M`) ±90° at yaw 0; any other facet: the yaw the point's azimuth about the
 * spine at its height, the pitch the levels' at its height. ⚠ The prototype's `anglesOf` takes the azimuth about the centre (no steps): 0.2 µm off on the
 * shed's bottom (its spine slanted), the same elsewhere.
 */
export function ringAngles(c: RingChart, p: Vec3, fi: number): { readonly yaw: number; readonly pitch: number } {
  const ci = fi >= 0 && fi < c.contourIndex.length ? c.contourIndex[fi]! : -1;
  const lv = c.levels;
  if (ci >= 0 && (ci === c.top.cap || ci === c.bottom.cap)) {
    const upc = ci === c.top.cap;
    const end = upc ? c.top : c.bottom;
    const edge = upc ? lv.p[lv.p.length - 1]! : lv.p[0]!;
    const span = upc ? H - edge : edge + H;
    const vx = p[0] - end.centre[0];
    const vz = p[2] - end.centre[2];
    const r = Math.hypot(vx, vz);
    if (r < RING_POLE_M) return { yaw: 0, pitch: upc ? H : -H };
    // the yaw whose rim lies along the point's direction from the centre — the rim's meridian is about the SPINE at the rim's height, which a slanted spine
    // sets off the cap's centre (the shed: 0.2 µm): solved by steps (the turn between the two directions), exact where the spine meets the centre
    const yRim = upc ? end.y - RING_RIM_M : end.y + RING_RIM_M;
    const toward = Math.atan2(vz, vx);
    let yaw = toward;
    let R = 1;
    for (let k = 0; ; k++) {
      if (!ringHit(c, yRim, yaw)) {
        R = 1;
        break;
      }
      const wx = hitX - end.centre[0];
      const wz = hitZ - end.centre[2];
      R = Math.hypot(wx, wz);
      const e = Math.atan2(Math.sin(toward - Math.atan2(wz, wx)), Math.cos(toward - Math.atan2(wz, wx)));
      if (Math.abs(e) <= RING_YAW_RAD || k >= RING_YAW_STEPS) break;
      yaw += e;
    }
    const g = 1 - r / R;
    return { yaw, pitch: upc ? edge + g * span : edge - g * span };
  }
  const u = (p[1] - c.bottom.y) / (c.top.y - c.bottom.y);
  const cx = c.bottom.centre[0] + u * (c.top.centre[0] - c.bottom.centre[0]);
  const cz = c.bottom.centre[2] + u * (c.top.centre[2] - c.bottom.centre[2]);
  return { yaw: Math.atan2(p[2] - cz, p[0] - cx), pitch: pitchAt(lv, p[1]) };
}
