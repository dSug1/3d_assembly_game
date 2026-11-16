/**
 * ⭐⭐⭐ (2026-11-16, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §2.1, §3 — step C2, the pure part) **THE GEOMETRY OF A FREE FACE**, engine-free,
 * not wired yet:
 *
 * * **A face is FREE** when its normal is the holding "up" (`up`): the world's vertical for gravity's chart and for a zone held by the world (a spit),
 *   a zone's axis for a zone held by its axis (§3.2). Square to such a face the camera looks along that up, so EVERY heading on it is upright — the
 *   upright rule does not bind there and a layout must be CHOSEN (the faces holding the poles: a cube's top and bottom, a lying prism's bottom, …).
 *   Every other face is BOUND: gravity's layout is already straight and square on it, nothing to choose (§2.1).
 * * **A free face's layouts — one per side of its polygon** (§3.2): the layout in which that side is level, its heading the NEIGHBOUR's own "up"
 *   (the uphill direction in the neighbour's plane) UNFOLDED across the shared side into this face's plane — the rotation about the side's own line that
 *   brings the neighbour's normal onto this face's. Coming in over that side the picture does not turn (§3.3, the first row): the square camera pitches
 *   over the edge as at any edge. The heading lies square to its side, INTO a top face (over a side's top edge: away from that side) and OUT of a
 *   bottom one (back toward the side just left).
 * * **The memory is one heading** — the layout taken at the entry (`entryHeading`, or `nearestHeading` for an entry with no edge, §2.2 O4) and carried
 *   across the face; **the exit pays the difference as ONE camera turn** (`exitTurnRad`): 0 back over the entry side, a quarter at a side of a rectangle,
 *   a half at the far side, any angle on another polygon (§2.2 O2, O6) — computed from the edge, never tabulated. ⭐ A concave edge falls out of the
 *   same computation (O11): a wall RISING from a level floor unfolds the other way, so the far wall costs 0.
 * * **The dy hold** (`turnHolds`): a turn over a threshold the CALLER chooses (§3.3, the third row — the owner has not decided between today's 120° and
 *   90°, §4 W6).
 * ⭐ Everything in the MODEL's coordinates — the contour's polygons (`orbit_charts.ts`'s `ChartFace`); nothing here reads a mesh or the camera.
 * ⭐ The reference this module is checked against, on the 35 shapes: `scripts/probes/free_face_study.ts` (`isFree`, `unfoldedUp`, `edgesOf`, Part A).
 * ⛔ ENGINE-FREE. Plane geometry — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";
import { CHART_CAP_DEG } from "./face_map";
import { CORNER_TOL_M } from "./polar_zone";
import type { ChartFace } from "./orbit_charts";

const D = Math.PI / 180;
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
/** `v` turned about the unit axis `k` by `th` (Rodrigues) */
const rot = (v: Vec3, k: Vec3, th: number): Vec3 => add(add(mul(v, Math.cos(th)), mul(cross(k, v), Math.sin(th))), mul(k, dot(k, v) * (1 - Math.cos(th))));

/**
 * ⭐ A neighbour whose "up" laid in its own plane is shorter than this is ITSELF level (its normal along the up): it has no uphill direction, so its side
 * gives no layout (`FreeEdge.heading` null).
 */
export const FREE_NO_UPHILL = 1e-6;
/** ⭐ Two headings are equally near the direction shown when their cosines to it differ by at most this — a tie, the first side in order keeps it. */
export const FREE_HEADING_TIE = 1e-9;
/** ⭐ `turnHolds`: a turn must be over its threshold by more than this (rad), so exactly 90° is not over 90° whatever the rounding. */
export const FREE_TURN_TOL_RAD = 1e-9;

/**
 * ⭐⭐⭐ (§3.2) A face is FREE when its normal is within `capDeg` of ±`up` — the cap's own tolerance by default (`CHART_CAP_DEG`, the level face holding
 * the pole of a COLUMNS chart): a top (along `up`) or a bottom (against it).
 */
export function isFreeFace(n: Vec3, up: Vec3, capDeg: number = CHART_CAP_DEG): boolean {
  return Math.abs(dot(n, unit(up))) >= Math.cos(capDeg * D);
}

/** ⭐⭐⭐ (§3.2) the positions in `faces` of the FREE ones under the holding `up` — the list that replaces "the cap of gravity's chart" */
export function freeFaces(faces: readonly ChartFace[], up: Vec3, capDeg: number = CHART_CAP_DEG): number[] {
  const out: number[] = [];
  faces.forEach((f, i) => {
    if (isFreeFace(f.n, up, capDeg)) out.push(i);
  });
  return out;
}

/**
 * ⭐ A side of a free face's polygon: its corners `a` → `b` (the polygon's order), `to` the position in `faces` of the face sharing it (-1: none), and
 * `heading` the layout that side gives — the neighbour's own "up" unfolded into this face's plane (null: no neighbour, or the neighbour is level).
 */
export interface FreeEdge {
  readonly a: Vec3;
  readonly b: Vec3;
  readonly to: number;
  readonly heading: Vec3 | null;
}

/**
 * the neighbour G's own "up" (the uphill direction in its plane, about `up`) UNFOLDED across the side a → b into F's plane: turned about the side's own
 * line by the angle that brings G's normal onto F's. null: G is level (no uphill direction, `FREE_NO_UPHILL`).
 */
function unfoldedUp(nF: Vec3, nG: Vec3, a: Vec3, b: Vec3, up: Vec3): Vec3 | null {
  const w = sub(up, mul(nG, dot(nG, up)));
  if (len(w) < FREE_NO_UPHILL) return null;
  const d = unit(sub(b, a));
  const th = Math.atan2(dot(d, cross(nG, nF)), dot(nG, nF));
  return unit(rot(unit(w), d, th));
}

/**
 * ⭐⭐⭐ (§3.2, §3.3) THE LAYOUTS OF A FREE FACE — for the face at position `i`, one entry per side of its polygon, in the polygon's order: the face sharing
 * that side (both its corners within `CORNER_TOL_M` of the neighbour's corners — the contour's own corner tolerance; the first such face in `faces`) and
 * the heading that side gives. On a free face's side the heading is square to the side (the side is level, so the neighbour's uphill direction is square
 * to it, and the unfolding turns about it); it points INTO a top face and OUT of a bottom one.
 */
export function freeEdges(faces: readonly ChartFace[], i: number, up: Vec3): FreeEdge[] {
  const F = faces[i];
  if (F === undefined) return [];
  const u = unit(up);
  const out: FreeEdge[] = [];
  for (let k = 0; k < F.pts.length; k++) {
    const a = F.pts[k]!;
    const b = F.pts[(k + 1) % F.pts.length]!;
    const to = faces.findIndex((G, j) => j !== i && G.pts.some((p) => dist(p, a) < CORNER_TOL_M) && G.pts.some((p) => dist(p, b) < CORNER_TOL_M));
    out.push({ a, b, to, heading: to < 0 ? null : unfoldedUp(F.n, faces[to]!.n, a, b, u) });
  }
  return out;
}

/**
 * ⭐⭐⭐ (§3.3, the first row) THE LAYOUT TAKEN AT AN ENTRY over an edge: the gizmo comes onto the free face from the neighbour at position `from` — that
 * side's heading (the picture does not turn). Several sides shared with the same neighbour: the FIRST in the polygon's order. null: no side shared with
 * `from`, or that neighbour is level.
 */
export function entryHeading(edges: readonly FreeEdge[], from: number): Vec3 | null {
  const e = edges.find((x) => x.to === from);
  return e?.heading ?? null;
}

/**
 * ⭐⭐ (§2.2 O4, §3.3 the fourth row) AN ENTRY WITH NO EDGE — the piece brought close in while the gizmo already stands on the free face (a pick-up, a
 * seat): the layout whose heading is nearest the direction `shown` laid into the face's plane (normal `n`) — at most half the angle between two
 * layouts away. A tie (`FREE_HEADING_TIE`): the first side in the polygon's order; `shown` along the normal (nothing in the plane): the first layout.
 * null: the face has no layout at all.
 */
export function nearestHeading(edges: readonly FreeEdge[], shown: Vec3, n: Vec3): Vec3 | null {
  const nn = unit(n);
  const s = sub(shown, mul(nn, dot(shown, nn)));
  const inPlane = len(s) > FREE_NO_UPHILL * Math.max(1, len(shown));
  let best: Vec3 | null = null;
  let bestCos = -Infinity;
  for (const e of edges) {
    if (e.heading === null) continue;
    if (!inPlane) return e.heading;
    const c = dot(e.heading, s) / len(s);
    if (c > bestCos + FREE_HEADING_TIE) {
      best = e.heading;
      bestCos = c;
    }
  }
  return best;
}

/**
 * ⭐⭐⭐ (§2.2 O2, §3.3 the second row) THE TURN AT AN EXIT — the angle (0 … π) between the heading carried across the free face and the layout heading of
 * the side shared with the face `to` (the first such side): the camera's turn on the glass as the gizmo leaves over that side. 0 back over the entry
 * side, a quarter at a side of a rectangle, a half at the far side; any angle on another polygon (a triangle 120°, a pentagon 72° / 144°). null: no side
 * shared with `to`, or that neighbour is level.
 */
export function exitTurnRad(heading: Vec3, edges: readonly FreeEdge[], to: number): number | null {
  const e = edges.find((x) => x.to === to);
  if (e === undefined || e.heading === null) return null;
  return Math.atan2(len(cross(heading, e.heading)), dot(heading, e.heading));
}

/**
 * ⭐⭐ (§3.3 the third row) whether an exit's turn sets THE DY HOLD (the dy that crossed would bring the gizmo back, so the finger must reverse): the turn
 * over `fromRad` by more than `FREE_TURN_TOL_RAD` — exactly 90° is not over 90°. ⛔ No default: the owner has not decided between today's 120° and 90°.
 * NaN: false.
 */
export function turnHolds(turnRad: number, fromRad: number): boolean {
  return turnRad > fromRad + FREE_TURN_TOL_RAD;
}
