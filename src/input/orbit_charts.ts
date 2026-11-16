/**
 * ⭐⭐⭐ (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §2.3, §2.5, §3 — step 1.2; the owner: *"Charts approved. … Proceed with execution."*)
 * **THE ASSIGNMENT OF THE CONTOUR'S FACES TO CHARTS**, engine-free, not wired yet (step 2.1 wires it):
 *
 * 1. **The contour** (`chartContour`): the real facets of the WORLD face map, each polygon cleaned (repeated points and points on a straight side dropped).
 *    Everything below reads the contour only — never the parts' faces, never `buildFaceMap` per frame: the assignment runs at each seat and stays cheap.
 * 2. **A face's kind in the COLUMNS chart of an axis** (`columnsChart`, §2.3): CELL, FAN, BENT, CAP or BROKEN — the test that replaces the detectors; the
 *    chart's two ends the shape's top / bottom SET along the axis (a level face, an edge, a point). The frame is `zoneFrame`'s.
 * 3. **The candidate frames** (`candidateAxes`, §3 2.): every direction square to two of the contour's edges; for every face, the direction in its plane
 *    square to each of its edges — the vertical left out (gravity's own).
 * 4. **How a frame is held** (§2.5): AXIS (the camera's up the axis) or WORLD (the turntable camera) — `modesOf`; what it costs on a face (`costOn`); the
 *    camera's turn at a seam between two charts (`seamTurn`).
 * 5. **The assignment** (`assignCharts`, §3): gravity's chart, the frames taken greedily (the fans, the tilted rectangles), the rings, the whole rule, each
 *    cap's square layouts.
 * 6. **Where a frame changes** (step 2.4a, §12): a cap's tilt heading from its square layouts (`capTiltHeading`), the zones from
 *    the frames taken (`chartZones`) — ⛔ `holdsPole`, `polarZones`' detectors.
 * ⭐ The reference this module is checked against, exactly, on 35 shapes: `scripts/probes/chart_lib.ts` (`scripts/probes/chart_assign_check.ts`).
 * ⛔ ENGINE-FREE. Plane geometry, a greedy cover — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";
import { CHART_CAP_DEG, CHART_HEADING_DEG, CHART_LEVEL_M, facetFrame, type FaceMap } from "./face_map";
import { CORNER_TOL_M, DEFAULT_ZONE_OPTS, zoneFrame, type PolarZone } from "./polar_zone";
import { capTilt, tiltHeading, type Mat3 } from "./orbit_tilt";

const D = Math.PI / 180;
const TAU = 2 * Math.PI;
const Y: Vec3 = [0, 1, 0];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => {
  const l = len(a);
  return l > 1e-15 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0];
};
const dist = (a: Vec3, b: Vec3): number => len(sub(a, b));
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const angDeg = (a: Vec3, b: Vec3): number => Math.acos(clamp(dot(a, b) / (len(a) * len(b)), -1, 1)) / D;
const lerp = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** the points merged within `CORNER_TOL_M`, the first of each kept */
const distinct = (pts: readonly Vec3[]): Vec3[] => {
  const o: Vec3[] = [];
  for (const p of pts) if (!o.some((q) => dist(p, q) < CORNER_TOL_M)) o.push(p);
  return o;
};

/** ⭐ The contour's cleaning: two consecutive corners within this (m) are one. */
const CHART_REPEAT_M = 1e-7;
/** ⭐ The contour's cleaning: a corner whose two sides are opposite within this (1 + their cosine) is on a straight side. */
const CHART_STRAIGHT_COS = 1e-9;
/** ⭐ A side face is a RECTANGLE when each corner is on its extents' sides along the facet's `t` and `b` within this (m). */
const CHART_RECT_M = 1e-6;
/** ⭐ Two of the contour's edge directions are one within this (deg) — the candidate frames' first list. */
const CHART_EDGE_DIR_DEG = 0.25;
/** ⭐ Two candidate axes are one within this (deg); an axis within this of the vertical is gravity's, not a candidate. */
const CHART_AXIS_DEG = 0.5;
/** ⭐ A frame is SQUARE to a cap (one of its layouts) when its axis's component along the cap's normal is at most this (≈ 1.15°). */
const CHART_SQUARE_COS = 0.02;
/** ⭐ `costOn`: a frame's axis laid in the face's plane shorter than this (the axis near the face's normal) gives no section — the cost 180°. */
const CHART_NO_SECTION = 0.05;
/** ⭐ `upAt`: an up laid square to the view shorter than this (the view near the up) gives any heading — no up. */
const CHART_NO_UP = 0.1;
/** ⭐ The whole rule: a face is a CELL at NO cost in a frame (the same sections as under gravity, or a level face) at this cost or less (deg). */
const CHART_FREE_DEG = 1;
/** ⭐ The greedy pick: two gains within this share are a tie… */
const CHART_GAIN_TIE = 1e-6;
/** ⭐ …and a tie is broken by a cost lower by more than this (deg); else the first frame in the candidates' order keeps it. */
const CHART_ROLL_TIE_DEG = 0.5;

// ── 1. the contour ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ A face of the contour: the facet's index in the world face map, its outward normal, its cleaned polygon (world), its area (m²) and its centroid. */
export interface ChartFace {
  readonly index: number;
  readonly n: Vec3;
  readonly pts: readonly Vec3[];
  readonly area: number;
  readonly c: Vec3;
}

/** the polygon cleaned: repeated corners dropped (`CHART_REPEAT_M`), then each corner on a straight side (`CHART_STRAIGHT_COS`), one at a time */
function cleanPolygon(P: readonly Vec3[]): Vec3[] {
  let Q = P.filter((p, k) => dist(p, P[(k + 1) % P.length]!) > CHART_REPEAT_M);
  for (let again = true; again && Q.length > 3; ) {
    again = false;
    for (let k = 0; k < Q.length; k++) {
      const u = sub(Q[(k - 1 + Q.length) % Q.length]!, Q[k]!);
      const w = sub(Q[(k + 1) % Q.length]!, Q[k]!);
      if (dot(u, w) / (len(u) * len(w)) < -1 + CHART_STRAIGHT_COS) {
        Q = Q.filter((_, i) => i !== k);
        again = true;
        break;
      }
    }
  }
  return Q;
}
function areaOf(P: readonly Vec3[]): number {
  let s: Vec3 = [0, 0, 0];
  for (let k = 1; k + 1 < P.length; k++) s = add(s, cross(sub(P[k]!, P[0]!), sub(P[k + 1]!, P[0]!)));
  return len(s) / 2;
}
function centroidOf(P: readonly Vec3[]): Vec3 {
  let a = 0;
  let s: Vec3 = [0, 0, 0];
  for (let k = 1; k + 1 < P.length; k++) {
    const w = len(cross(sub(P[k]!, P[0]!), sub(P[k + 1]!, P[0]!))) / 2;
    a += w;
    s = add(s, mul(add(add(P[0]!, P[k]!), P[k + 1]!), w / 3));
  }
  return a > 1e-15 ? mul(s, 1 / a) : mul(P.reduce<Vec3>((t, v) => add(t, v), [0, 0, 0]), 1 / P.length);
}

/**
 * ⭐⭐⭐ (§3, step 1.2) THE CONTOUR the assignment reads: the world face map's REAL facets whose cleaned polygon keeps at least three corners — the same
 * contour in every frame on a simple shape, so no frame needs its own map.
 */
export function chartContour(map: FaceMap): ChartFace[] {
  const out: ChartFace[] = [];
  map.facets.forEach((f, index) => {
    if (!f.real || f.poly.length < 3) return;
    const pts = cleanPolygon(f.poly);
    if (pts.length < 3) return;
    out.push({ index, n: f.n, pts, area: areaOf(pts), c: centroidOf(pts) });
  });
  return out;
}

// ── 2. a COLUMNS chart's kinds ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ A face's kind in a COLUMNS chart (§2.3). */
export type ColumnKind = "CELL" | "FAN" | "BENT" | "CAP" | "BROKEN";
/** ⭐ A face's kind in its home: a COLUMNS chart's, or in the RINGS chart a side face SKEW (straight, not square — §2.4), a cap CAP. */
export type HomeKind = ColumnKind | "SKEW";

/** ⭐ A chart's end along its axis: a level FACE (`cap` its contour index), an EDGE or a POINT (`cap` −1); its centre in the WORLD; its height `y` in the frame. */
export interface ChartEnd {
  readonly kind: "FACE" | "EDGE" | "POINT";
  readonly cap: number;
  readonly centre: Vec3;
  readonly y: number;
}

/** ⭐ The COLUMNS chart of an axis, as the assignment reads it: the axis (unit), the frame (F → world by rows, `zoneFrame`'s), each face's kind, the ends. */
export interface ColumnsChart {
  readonly axis: Vec3;
  readonly frame: Mat3;
  readonly kinds: readonly ColumnKind[];
  readonly top: ChartEnd;
  readonly bottom: ChartEnd;
}

interface Side {
  readonly i: number;
  readonly pts: readonly Vec3[];
  readonly rect: boolean;
  readonly yLo: number;
  readonly yHi: number;
  readonly h: number;
}

/**
 * ⭐⭐⭐ (§2.2, §2.3) WHAT EACH FACE IS IN THE COLUMNS CHART OF THE AXIS `a` (F's vertical; F's x the world axis most square to it — `zoneFrame`):
 * * the ENDS — the shape's top / bottom SET along the axis: the first face level within `CHART_CAP_DEG` there (a cap), else the corners within
 *   `CHART_LEVEL_M` of the end height: two or more an EDGE (the two farthest apart, its middle), one a POINT;
 * * the COLUMNS — the other faces by heading (within `CHART_HEADING_DEG` of the first of a group, the last group joining the first across 0), each
 *   column's faces bottom → top;
 * * a side face's kind: BROKEN unless its top is a level edge (two corners there) or the pole (an end that is not a face), and its bottom the same; then a
 *   CELL if it is its extents' rectangle in its own frame (`facetFrame`), a FAN if a triangle standing on a level edge, else BENT;
 * * a cap is CAP only when EVERY column ends on it along a level edge — else BROKEN (its quarters do not meet).
 */
export function columnsChart(faces: readonly ChartFace[], a: Vec3): ColumnsChart {
  const R = zoneFrame(a);
  const ex: Vec3 = [R[0][0], R[1][0], R[2][0]];
  const ey: Vec3 = [R[0][1], R[1][1], R[2][1]];
  const ez: Vec3 = [R[0][2], R[1][2], R[2][2]];
  const toF = (p: Vec3): Vec3 => [dot(p, ex), dot(p, ey), dot(p, ez)];
  const fromF = (q: Vec3): Vec3 => [ex[0] * q[0] + ey[0] * q[1] + ez[0] * q[2], ex[1] * q[0] + ey[1] * q[1] + ez[1] * q[2], ex[2] * q[0] + ey[2] * q[1] + ez[2] * q[2]];
  const FF = faces.map((f) => ({ n: toF(f.n), pts: f.pts.map(toF) }));
  let HI = -Infinity;
  let LO = Infinity;
  for (const f of FF)
    for (const p of f.pts) {
      if (p[1] > HI) HI = p[1];
      if (p[1] < LO) LO = p[1];
    }
  const cosCap = Math.cos(CHART_CAP_DEG * D);
  const endOf = (up: boolean): ChartEnd => {
    const y = up ? HI : LO;
    const cap = FF.findIndex((f) => (up ? f.n[1] : -f.n[1]) > cosCap);
    if (cap >= 0) return { kind: "FACE", cap, centre: fromF(centroidOf(FF[cap]!.pts)), y };
    const pts = distinct(FF.flatMap((f) => f.pts.filter((p) => (up ? p[1] > HI - CHART_LEVEL_M : p[1] < LO + CHART_LEVEL_M))));
    if (pts.length >= 2) {
      let pair: [Vec3, Vec3] = [pts[0]!, pts[1]!];
      for (const p of pts) for (const q of pts) if (dist(p, q) > dist(pair[0], pair[1])) pair = [p, q];
      return { kind: "EDGE", cap: -1, centre: fromF(lerp(pair[0], pair[1], 0.5)), y };
    }
    return { kind: "POINT", cap: -1, centre: fromF(pts[0] ?? [0, y, 0]), y };
  };
  const top = endOf(true);
  const bottom = endOf(false);
  const sides: Side[] = [];
  FF.forEach((f, i) => {
    if (i === top.cap || i === bottom.cap) return;
    const { t, b } = facetFrame(f.n);
    const tb = f.pts.map((p) => [dot(p, t), dot(p, b)] as const);
    const tLo = Math.min(...tb.map((q) => q[0]));
    const tHi = Math.max(...tb.map((q) => q[0]));
    const bLo = Math.min(...tb.map((q) => q[1]));
    const bHi = Math.max(...tb.map((q) => q[1]));
    const on = (x: number, lo: number, hi: number): boolean => Math.abs(x - lo) < CHART_RECT_M || Math.abs(x - hi) < CHART_RECT_M;
    let h = Math.atan2(f.n[2], f.n[0]);
    if (h < 0) h += TAU;
    sides.push({
      i,
      pts: f.pts,
      rect: tb.every(([x, y]) => on(x, tLo, tHi) && on(y, bLo, bHi)),
      yLo: Math.min(...f.pts.map((p) => p[1])),
      yHi: Math.max(...f.pts.map((p) => p[1])),
      h,
    });
  });
  // the columns: the side faces by heading, each column's faces bottom → top
  const order = sides.map((_, k) => k).sort((x, y) => sides[x]!.h - sides[y]!.h);
  const groups: { h: number; f: number[] }[] = [];
  for (const k of order) {
    const g = groups[groups.length - 1];
    if (g !== undefined && Math.abs(wrapPi(sides[k]!.h - g.h)) < CHART_HEADING_DEG * D) g.f.push(k);
    else groups.push({ h: sides[k]!.h, f: [k] });
  }
  if (groups.length > 1 && Math.abs(wrapPi(groups[0]!.h - groups[groups.length - 1]!.h)) < CHART_HEADING_DEG * D) groups[0]!.f.push(...groups.pop()!.f);
  const cols = groups.map((g) => [...g.f].sort((x, y) => sides[x]!.yLo + sides[x]!.yHi - (sides[y]!.yLo + sides[y]!.yHi)));
  // each face's kind
  const kinds: ColumnKind[] = faces.map(() => "BROKEN");
  if (top.cap >= 0) kinds[top.cap] = "CAP";
  if (bottom.cap >= 0) kinds[bottom.cap] = "CAP";
  for (const s of sides) {
    const nTop = distinct(s.pts.filter((p) => p[1] > s.yHi - CHART_LEVEL_M)).length;
    const nBot = distinct(s.pts.filter((p) => p[1] < s.yLo + CHART_LEVEL_M)).length;
    const topOk = nTop >= 2 || (s.yHi > HI - CHART_LEVEL_M && top.kind !== "FACE");
    const botOk = nBot >= 2 || (s.yLo < LO + CHART_LEVEL_M && bottom.kind !== "FACE");
    kinds[s.i] = !(topOk && botOk) ? "BROKEN" : s.rect ? "CELL" : s.pts.length === 3 && nTop + nBot === 3 ? "FAN" : "BENT";
  }
  // a cap is the columns' own only when EVERY column ends on it along a level edge
  for (const up of [true, false]) {
    const end = up ? top : bottom;
    if (end.cap < 0) continue;
    const ok = cols.every((col) => {
      const s = sides[up ? col[col.length - 1]! : col[0]!]!;
      return distinct(s.pts.filter((p) => Math.abs(p[1] - end.y) < CHART_LEVEL_M)).length >= 2;
    });
    if (!ok) kinds[end.cap] = "BROKEN";
  }
  return { axis: ey, frame: R, kinds, top, bottom };
}

// ── 3. the candidate frames ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * ⭐⭐⭐ (§3 2.) THE CANDIDATE FRAMES of a contour, in this order (it decides the assignment's ties): the contour's edge directions (one within
 * `CHART_EDGE_DIR_DEG`); every direction square to two of them; then, face by face, edge by edge, the direction in the face's plane square to the edge —
 * each kept when it is no other within `CHART_AXIS_DEG`; the ones within `CHART_AXIS_DEG` of the vertical left out (gravity's chart). Unit axes.
 */
export function candidateAxes(faces: readonly ChartFace[]): Vec3[] {
  const dirs: Vec3[] = [];
  const push = (list: Vec3[], v: Vec3, cosTol: number): void => {
    if (len(v) < 1e-9) return;
    const u = unit(v);
    if (!list.some((w) => Math.abs(dot(u, w)) > cosTol)) list.push(u);
  };
  const cosDir = Math.cos(CHART_EDGE_DIR_DEG * D);
  const cosAxis = Math.cos(CHART_AXIS_DEG * D);
  for (const f of faces) for (let k = 0; k < f.pts.length; k++) push(dirs, sub(f.pts[(k + 1) % f.pts.length]!, f.pts[k]!), cosDir);
  const axes: Vec3[] = [];
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++) push(axes, cross(dirs[i]!, dirs[j]!), cosAxis);
  for (const f of faces) for (let k = 0; k < f.pts.length; k++) push(axes, cross(f.n, sub(f.pts[(k + 1) % f.pts.length]!, f.pts[k]!)), cosAxis);
  return axes.filter((a) => Math.abs(a[1]) < cosAxis);
}

// ── 4. how a frame is held, what it costs ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ How the camera holds a frame (§2.5): AXIS+ / AXIS- — its up the frame's axis (its side up / down); WORLD — the world's turntable camera. */
export type ChartMode = "AXIS+" | "AXIS-" | "WORLD";

/**
 * ⭐ A face's HOME: the chart that serves it — `frame` −1 gravity's (`rings` true: the RINGS chart about gravity, else the COLUMNS chart), else the index
 * of the candidate frame (`ChartAssignment.frames`) — its axis and how it is held.
 */
export interface ChartHome {
  readonly frame: number;
  readonly rings: boolean;
  readonly axis: Vec3;
  readonly mode: ChartMode;
}

/** ⭐ The assignment's bounds (§3) — parameters with defaults, not tunables yet (the sliders come with the wiring, step 2.1). */
export interface ChartOpts {
  /** the most a frame may cost on a tilted rectangle it takes (deg) — `ROLL_OK`, POLAR_ZONES D-Z6's milder roll */
  readonly costMaxDeg: number;
  /** the most camera turn at a frame's border for a face to be taken (deg) — `SEAM_OK`, POLAR_ZONES §3.5's upright bound */
  readonly seamMaxDeg: number;
  /** a face within this of level has no cost (deg): every heading is upright looking straight down */
  readonly flatDeg: number;
  /** an axis within this of the vertical is held AXIS (deg) — the zones' */
  readonly uprightMaxDeg: number;
  /** an axis this far or more from the vertical is held WORLD (deg) — the zones' */
  readonly spitMinDeg: number;
  /** the whole rule: a frame serves its alike faces too when it covers more than this share of the contour's area — the zones' */
  readonly wholeShare: number;
}
export const DEFAULT_CHART_OPTS: ChartOpts = {
  costMaxDeg: 45,
  seamMaxDeg: 30,
  flatDeg: 15,
  uprightMaxDeg: DEFAULT_ZONE_OPTS.uprightMaxDeg,
  spitMinDeg: DEFAULT_ZONE_OPTS.spitMinDeg,
  wholeShare: DEFAULT_ZONE_OPTS.wholeShare,
};

/**
 * ⭐⭐ (§2.5, POLAR_ZONES D-Z6) HOW A FRAME OF AXIS `a` MAY BE HELD: within `uprightMaxDeg` of the vertical AXIS (its up side up: AXIS+, else AXIS-);
 * `spitMinDeg` and more WORLD; between, both (the assignment takes the cheaper), AXIS first.
 */
export function modesOf(a: Vec3, o: ChartOpts = DEFAULT_CHART_OPTS): ChartMode[] {
  const tilt = Math.acos(Math.min(1, Math.abs(a[1]))) / D;
  const axis: ChartMode = a[1] >= 0 ? "AXIS+" : "AXIS-";
  return tilt <= o.uprightMaxDeg ? [axis] : tilt >= o.spitMinDeg ? ["WORLD"] : [axis, "WORLD"];
}

/** the camera's up seen from `m` (out of the surface): AXIS — the axis laid square to the view; WORLD — the world's up (`null`: along the view, any heading) */
function upAt(h: ChartHome, m: Vec3): Vec3 | null {
  const v = h.mode === "WORLD" ? Y : h.mode === "AXIS+" ? h.axis : mul(h.axis, -1);
  const u = sub(v, mul(m, dot(v, m)));
  return len(u) < CHART_NO_UP ? null : unit(u);
}

/**
 * ⭐⭐ (§2.5) WHAT HOLDING A FRAME COSTS ON A FACE of normal `n` (deg), seen square to it: AXIS+ — the camera's ROLL (the axis laid in the face against the
 * world's up laid in it), AXIS- the same upside down; WORLD — how far the sections are turned from the horizontal and the vertical on the glass (0 … 45°).
 * A face within `flatDeg` of level: 0; the axis along the normal (no section): 180.
 */
export function costOn(n: Vec3, h: ChartHome, o: ChartOpts = DEFAULT_CHART_OPTS): number {
  const w = sub(Y, mul(n, n[1]));
  if (len(w) < Math.sin(o.flatDeg * D)) return 0;
  const r = sub(h.axis, mul(n, dot(h.axis, n)));
  if (len(r) < CHART_NO_SECTION) return 180;
  const x = angDeg(r, w);
  if (h.mode === "AXIS+") return x;
  if (h.mode === "AXIS-") return 180 - x;
  const y = x % 90;
  return Math.min(y, 90 - y);
}

/**
 * ⭐⭐ (§3 3., §3 6.) THE CAMERA'S TURN (deg) crossing from a face of normal `nf` (its home `hf`) to its neighbour of normal `ng` (`hg`): the two ups seen
 * along the edge's own view (the two normals' mean). None between two WORLD holds, nor within one chart held one way; none when either up is undefined there.
 */
export function seamTurn(nf: Vec3, hf: ChartHome, ng: Vec3, hg: ChartHome): number {
  if (hf.mode === "WORLD" && hg.mode === "WORLD") return 0;
  if (hf.frame === hg.frame && hf.rings === hg.rings && hf.mode === hg.mode) return 0;
  const m = unit(add(nf, ng));
  const u1 = upAt(hf, m);
  const u2 = upAt(hg, m);
  return u1 === null || u2 === null ? 0 : angDeg(u1, u2);
}

// ── 5. the assignment ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ The assignment of a contour (§3). */
export interface ChartAssignment {
  /** gravity's COLUMNS chart */
  readonly gravity: ColumnsChart;
  /** the candidate frames' COLUMNS charts, in the candidates' order (`candidateAxes`) — a `ChartHome.frame` indexes them */
  readonly frames: readonly ColumnsChart[];
  /** per contour face, its home */
  readonly home: readonly ChartHome[];
  /** per contour face, its kind in its home */
  readonly kind: readonly HomeKind[];
  /** the frames taken, in the order taken (one entry per frame and mode), with the faces each serves (the whole rule's appended) — ⭐ (step 2.4a) `own`
   *  the frame's OWN faces, those it took before the whole rule (`faces`' first ones: the zone's facets, `chartZones`) */
  readonly used: readonly { readonly home: ChartHome; readonly faces: readonly number[]; readonly own: readonly number[] }[];
  /** per cap face (a face whose home kind is CAP), its square layouts: the frames square to it in which it is a CELL, each AXIS+ then AXIS- */
  readonly layouts: ReadonlyMap<number, readonly ChartHome[]>;
  /** how many faces gravity's COLUMNS chart breaks */
  readonly brokenByGravity: number;
}

/**
 * ⭐⭐⭐ (§3) THE ASSIGNMENT OF THE CONTOUR'S FACES TO CHARTS:
 * 1. gravity's COLUMNS chart (held WORLD) serves every face it does not break; a face it breaks that is a level END goes to the RINGS chart's cap;
 * 2. of the rest, the candidate frames, greedily — the frame and mode serving the most area first (a tie: the lower cost by more than
 *    `CHART_ROLL_TIE_DEG`, else the first in the candidates' order), until none serves anything. A frame and mode serves:
 *    * THE FANS — every face round a pole of the frame that is a corner (an end POINT), when the star has three faces or more and ALL of them are still
 *      to serve and are FANS or CELLS in the frame;
 *    * THE TILTED RECTANGLES — the faces still to serve that are CELLS in it at a cost ≤ `costMaxDeg`, peeled one at a time where the camera's turn to a
 *      neighbour outside the set (in its home, gravity's if it has none yet) exceeds `seamMaxDeg` (a fan face is never peeled);
 * 3. what is left: the RINGS chart about gravity;
 * 4. THE WHOLE RULE (D-Z5), the frames by their area, largest first: a frame whose faces, with the faces at home under gravity (columns or rings) that are
 *    CELLS in it at no cost (≤ `CHART_FREE_DEG`), cover more than `wholeShare` of the contour serves those too;
 * 5. each cap's SQUARE LAYOUTS: the candidate frames square to it (`CHART_SQUARE_COS`) in which it is a CELL, each held AXIS+ and AXIS-.
 */
export function assignCharts(faces: readonly ChartFace[], o: ChartOpts = DEFAULT_CHART_OPTS): ChartAssignment {
  const N = faces.length;
  const adj: number[][] = faces.map(() => []);
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const g = faces[j]!;
      if (distinct(faces[i]!.pts.filter((p) => g.pts.some((q) => dist(p, q) < CORNER_TOL_M))).length >= 2) adj[i]!.push(j);
    }
  const W = columnsChart(faces, Y);
  const homeW: ChartHome = { frame: -1, rings: false, axis: Y, mode: "WORLD" };
  const homeR: ChartHome = { frame: -1, rings: true, axis: Y, mode: "WORLD" };
  const home: (ChartHome | undefined)[] = faces.map(() => undefined);
  const todo = new Set<number>();
  const isEnd = (i: number): boolean => i === W.top.cap || i === W.bottom.cap;
  for (let i = 0; i < N; i++) {
    if (W.kinds[i] !== "BROKEN") home[i] = homeW;
    else if (isEnd(i)) home[i] = homeR;
    else todo.add(i);
  }
  const brokenByGravity = W.kinds.filter((k) => k === "BROKEN").length;
  const frames = candidateAxes(faces).map((a) => columnsChart(faces, a));
  const used: { home: ChartHome; faces: number[]; own: number[] }[] = [];
  while (todo.size > 0) {
    let pick: { h: ChartHome; S: number[]; gain: number; roll: number } | null = null;
    for (let k = 0; k < frames.length; k++) {
      const c = frames[k]!;
      for (const mode of modesOf(c.axis, o)) {
        const h: ChartHome = { frame: k, rings: false, axis: c.axis, mode };
        // the fans: the faces round a pole of the frame (a corner), all of them still to serve and FANS or CELLS in the frame
        const fan = new Set<number>();
        for (const end of [c.top, c.bottom]) {
          if (end.kind !== "POINT") continue;
          const star: number[] = [];
          for (let i = 0; i < N; i++) if (faces[i]!.pts.some((q) => dist(q, end.centre) < CORNER_TOL_M)) star.push(i);
          if (star.length >= 3 && star.every((i) => todo.has(i) && (c.kinds[i] === "FAN" || c.kinds[i] === "CELL"))) for (const i of star) fan.add(i);
        }
        let S = [...todo].filter((i) => fan.has(i) || (c.kinds[i] === "CELL" && costOn(faces[i]!.n, h, o) <= o.costMaxDeg));
        let inS = new Set(S);
        for (let peel = true; peel && S.length > 0; ) {
          peel = false;
          for (const i of S) {
            const bad = !fan.has(i) && adj[i]!.some((g) => !inS.has(g) && seamTurn(faces[i]!.n, h, faces[g]!.n, home[g] ?? homeW) > o.seamMaxDeg);
            if (bad) {
              S = S.filter((x) => x !== i);
              inS = new Set(S);
              peel = true;
              break;
            }
          }
        }
        const gain = S.reduce((s, i) => s + faces[i]!.area, 0);
        const roll = S.length ? Math.max(...S.map((i) => costOn(faces[i]!.n, h, o))) : 0;
        if (gain > 1e-9 && (pick === null || gain > pick.gain * (1 + CHART_GAIN_TIE) || (gain > pick.gain * (1 - CHART_GAIN_TIE) && roll < pick.roll - CHART_ROLL_TIE_DEG)))
          pick = { h, S, gain, roll };
      }
    }
    if (pick === null) break;
    const p = pick;
    for (const i of p.S) {
      home[i] = p.h;
      todo.delete(i);
    }
    const prev = used.find((u) => u.home.frame === p.h.frame && u.home.mode === p.h.mode);
    if (prev !== undefined) {
      prev.faces.push(...p.S);
      prev.own.push(...p.S);
    } else used.push({ home: p.h, faces: [...p.S], own: [...p.S] });
  }
  // what is left: the rings about gravity
  for (const i of todo) home[i] = homeR;
  // the whole rule (D-Z5)
  const total = faces.reduce((t, f) => t + f.area, 0);
  const areaOfSet = (S: readonly number[]): number => S.reduce((t, i) => t + faces[i]!.area, 0);
  for (const u of [...used].sort((x, y) => areaOfSet(y.faces) - areaOfSet(x.faces))) {
    const c = frames[u.home.frame]!;
    const alike: number[] = [];
    for (let i = 0; i < N; i++) if (home[i]!.frame === -1 && c.kinds[i] === "CELL" && costOn(faces[i]!.n, u.home, o) <= CHART_FREE_DEG) alike.push(i);
    if (areaOfSet([...u.faces, ...alike]) > o.wholeShare * total) {
      for (const i of alike) home[i] = u.home;
      u.faces.push(...alike);
    }
  }
  const homes = home as ChartHome[];
  const kind: HomeKind[] = homes.map((h, i) => (h.frame >= 0 ? frames[h.frame]!.kinds[i]! : h.rings ? (isEnd(i) ? "CAP" : "SKEW") : W.kinds[i]!));
  // each cap's square layouts (the tilted pole, generalised)
  const layouts = new Map<number, ChartHome[]>();
  for (let i = 0; i < N; i++) {
    if (kind[i] !== "CAP") continue;
    const list: ChartHome[] = [];
    frames.forEach((c, k) => {
      if (Math.abs(dot(c.axis, faces[i]!.n)) > CHART_SQUARE_COS) return;
      if (c.kinds[i] === "CELL") {
        list.push({ frame: k, rings: false, axis: c.axis, mode: "AXIS+" });
        list.push({ frame: k, rings: false, axis: c.axis, mode: "AXIS-" });
      }
    });
    layouts.set(i, list);
  }
  return { gravity: W, frames, home: homes, kind, used, layouts, brokenByGravity };
}

// ── 6. the atlas decides where a frame changes (step 2.4a, §12) ───────────────────────────────────────────────────────────────────────────────────

/** ⭐ (2.4a) `capTilt`'s F-vertical lies along a layout's up within this (deg) — the layouts are square to the cap within `CHART_SQUARE_COS` (≈ 1.15°). */
const CHART_TILT_LAYOUT_DEG = 3;
/** ⭐ (2.4a) today's heading (`tiltHeading`) IS one of the layouts' when within this (rad): returned unchanged — a world-aligned cap bit for bit. */
const CHART_TILT_SAME_RAD = 1e-6;
/** ⭐ (C2W, W5) `capTiltHeading`'s `along` laid in the cap's plane shorter than this has no direction there: today's nearest is taken. */
const CHART_ALONG_MIN = 1e-6;
/** ⭐ (C2W, W5) two candidates' cosines to `along` within this are a tie: the first in the layouts' order keeps it. */
const CHART_ALONG_TIE = 1e-9;
/** ⭐ (2.4a) a zone's axis within this (per component) of a world axis is that axis exactly — float noise of the contour's frame, not a snap. */
const CHART_AXIS_CLEAN = 1e-9;

/**
 * ⭐⭐⭐ (§3 6., §12 2.4a; D-C2, D-C4) THE TILT'S HEADING ON A CAP FROM ITS SQUARE LAYOUTS — the atlas's answer to "does this face tilt, toward where":
 * the contour face of the WORLD face-map facet `facet` (`ChartFace.index`) a CAP in its home with at least one square layout (`assign.layouts`); the
 * candidate headings the `hs` for which `capTilt(hs, n)` builds a layout — its F-vertical (F's `[0, 1, 0]` in the world) along the layout's up (`axis`
 * for AXIS+, its opposite for AXIS-), on a rectangle four headings 90° apart along its own edges; the one nearest today's (`tiltHeading(n, yaw)`) —
 * ⭐ today's value ITSELF when it is a candidate within `CHART_TILT_SAME_RAD`, else that candidate unwrapped next to it. `null`: no tilt — a side face
 * however steep (⛔ `holdsPole`'s 45°), a cap that is not a rectangle (D-C2), a facet not on the contour (a virtual cap: a pole held by an edge, D-C6).
 * ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §16 — package C2W, W5) `along`: the heading CARRIED IN by the entry edge (`free_face.ts`'s
 * `freeEntryHeading`, a direction in the cap's plane) — the candidate whose F-vertical lies nearest it is taken (a tie: the first in the layouts' order),
 * still unwrapped next to today's (`tiltHeading`) and today's value itself when it is that candidate. ⛔ The snapped yaw's nearest alone: on a cap turned
 * off the world's axes the yaw over a side snaps up to 45° away and the nearest candidate can be the neighbour side's (a quarter off, §15 F2). `along`
 * null or with nothing in the cap's plane: today's nearest.
 */
export function capTiltHeading(assign: ChartAssignment, faces: readonly ChartFace[], facet: number, n: Vec3, yaw: number, along: Vec3 | null = null): number | null {
  const ci = faces.findIndex((f) => f.index === facet);
  if (ci < 0 || assign.kind[ci] !== "CAP") return null;
  const lay = assign.layouts.get(ci);
  if (lay === undefined || lay.length === 0) return null;
  const cosOk = Math.cos(CHART_TILT_LAYOUT_DEG * D);
  const cands: number[] = [];
  for (const h of lay) {
    const up = h.mode === "AXIS-" ? mul(h.axis, -1) : h.axis;
    if (!(Math.hypot(up[0], up[2]) > 1e-9)) continue;
    const h0 = Math.atan2(up[2], up[0]);
    for (const hs of [h0, h0 + Math.PI]) {
      const R = capTilt(hs, n);
      if (dot([R[0][1], R[1][1], R[2][1]], unit(up)) >= cosOk) cands.push(hs);
    }
  }
  if (cands.length === 0) return null;
  const t = tiltHeading(n, yaw);
  let best = cands[0]!;
  const a = along === null ? null : sub(along, mul(unit(n), dot(along, unit(n))));
  if (a !== null && Math.hypot(a[0], a[1], a[2]) > CHART_ALONG_MIN) {
    let bestCos = -Infinity;
    for (const c of cands) {
      const R = capTilt(c, n);
      const k = dot([R[0][1], R[1][1], R[2][1]], a);
      if (k > bestCos + CHART_ALONG_TIE) {
        best = c;
        bestCos = k;
      }
    }
  } else for (const c of cands) if (Math.abs(wrapPi(c - t)) < Math.abs(wrapPi(best - t))) best = c;
  const d = wrapPi(best - t);
  return Math.abs(d) < CHART_TILT_SAME_RAD ? t : t + d;
}

/** the axis with each component within `CHART_AXIS_CLEAN` of ±1 laid exactly on that world axis */
function cleanAxis(a: Vec3): Vec3 {
  for (let k = 0; k < 3; k++)
    if (Math.abs(1 - Math.abs(a[k]!)) < CHART_AXIS_CLEAN) {
      // ⭐ the world axis negated as `snapToWorldAxis` negates it (its zeros −0): the zone's numbers `polarZones`' own
      const e: Vec3 = [k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0];
      return a[k]! > 0 ? e : [-e[0], -e[1], -e[2]];
    }
  return a;
}

/**
 * ⭐⭐⭐ (§3 3. – 4., §12 2.4a) THE ZONES FROM THE ATLAS — the frames it TOOK (`assign.used`, a home off gravity's), in the shape the wiring consumes
 * (`PolarZone`, ⛔ `polarZones`' detectors): `orientation` SPIT for a WORLD hold, UPRIGHT for AXIS±; `poles` the frame's ends that are points — each the
 * contour's own corner, in the contour's order (facets by index, corners along each polygon: `contourCorners`' order); `axis` as `polarZones` orients it —
 * UPRIGHT its up (the AXIS- frame's opposite), SPIT from the first pole to the second (one pole: toward it; none: the frame's own), laid exactly on a
 * world axis within `CHART_AXIS_CLEAN`; `frame` `zoneFrame(axis)`; `facets` the frame's OWN faces' world indices (`own`, sorted — ⛔ the whole rule's
 * adopted faces: they make it `whole`, as `polarZones`' alike faces do); `whole` it serves every contour face; `reason` empty.
 */
export function chartZones(assign: ChartAssignment, faces: readonly ChartFace[]): PolarZone[] {
  const out: PolarZone[] = [];
  for (const u of assign.used) {
    if (u.home.frame < 0) continue;
    const c = assign.frames[u.home.frame]!;
    const orientation = u.home.mode === "WORLD" ? "SPIT" : "UPRIGHT";
    // the poles, each at the first corner of the contour (in its order) on the end
    const ends: { p: Vec3; at: number; top: boolean }[] = [];
    for (const [end, top] of [[c.top, true], [c.bottom, false]] as const) {
      if (end.kind !== "POINT") continue;
      let at = 0;
      let p: Vec3 | null = null;
      for (const f of faces) {
        for (const q of f.pts) {
          if (dist(q, end.centre) < CORNER_TOL_M) {
            p = q;
            break;
          }
          at++;
        }
        if (p !== null) break;
      }
      if (p !== null) ends.push({ p, at, top });
    }
    ends.sort((x, y) => x.at - y.at);
    let a: Vec3 = c.axis;
    if (orientation === "UPRIGHT") a = u.home.mode === "AXIS-" ? mul(c.axis, -1) : c.axis;
    else if (ends.length >= 2) a = dot(c.axis, sub(ends[ends.length - 1]!.p, ends[0]!.p)) >= 0 ? c.axis : mul(c.axis, -1);
    else if (ends.length === 1) a = ends[0]!.top ? c.axis : mul(c.axis, -1);
    a = cleanAxis(a);
    out.push({
      facets: [...new Set(u.own.map((i) => faces[i]!.index))].sort((x, y) => x - y),
      poles: ends.map((e) => e.p),
      axis: a,
      frame: zoneFrame(a),
      orientation,
      whole: new Set(u.faces).size === faces.length,
      reason: { pole: [], t2: [], t3: [] },
    });
  }
  return out;
}
