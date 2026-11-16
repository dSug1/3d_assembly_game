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
 *   90°, §4 W6). ⭐⭐⭐ (step C5, §13) the crossings that turn the camera at an EDGE read ONE rule (`crossingHoldSign`, `crossingEvent`).
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

/* ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §3.4 — step C4: a spit zone's level faces on the carried heading, wired under `chartLayout` 1) ------------ */

/**
 * ⭐⭐⭐ (`TILTED_POLE_CLOSE_IN.md` §10 — D-T4, the owner 2026-11-16: *"i have no particular opinion. Weigh the pros and the cons and build what is best"*)
 * THE DY HOLD AT A FREE FACE'S EXIT is set from this turn (rad): any turn OVER a quarter — past it the face beyond stands upright on the glass with the
 * edge just crossed in the finger's way. ⛔ 120° (the tilt's far edge, `edgeHoldAt`; C4 as first built): an edge 10 – 30° off the finger's way (a
 * triangle's, a heptagon's) was crossed by a dy that then brought the gizmo straight back over it.
 */
export const FREE_EXIT_HOLD_FROM_RAD = Math.PI / 2;

/**
 * ⭐⭐⭐ (§10, D-T4) THE DY AN EXIT'S TURN HOLDS — the sign held (`dySign`'s), or 0 for none. After the exit's turn ONE finger direction undoes the
 * crossing (up the face hanging under a top face, down the one standing over a bottom face); it is held only when the finger was pushing THAT way —
 * when the dy at the crossing is the one that carried the gizmo out over the side:
 * * the turn over `FREE_EXIT_HOLD_FROM_RAD` (`turnHolds`), and
 * * the finger's dy moving the gizmo OUT through that side: on a free face "up" on the glass is the heading carried, so a dy of sign `s` moves the gizmo
 *   along `s × heading` — out through the side when that has a part along the side's outward direction (from the face's centre `centre`).
 * ⛔ The finger's last dy sign whatever it was (as built first): a side crossed sideways by a dx held a dy that had crossed nothing — a direction blocked
 * for no reason. On a rectangle: its far side crossed by its dy, as before. 0: no such side, a level neighbour, no dy.
 */
export function exitHoldSign(heading: Vec3, edges: readonly FreeEdge[], to: number, centre: Vec3, dySign: number): 1 | -1 | 0 {
  const e = edges.find((x) => x.to === to);
  if (e === undefined || e.heading === null || !(dySign > 0 || dySign < 0)) return 0;
  if (!turnHolds(Math.atan2(len(cross(heading, e.heading)), dot(heading, e.heading)), FREE_EXIT_HOLD_FROM_RAD)) return 0;
  const d = unit(sub(e.b, e.a));
  const m = sub(mul(add(e.a, e.b), 0.5), centre);
  const out = sub(m, mul(d, dot(m, d)));
  // ⭐⭐⭐ (step C5, §13) the one rule (`crossingHoldSign`): over a free face's level side the face beyond's up unfolded is ∓ `out`, so "it brings the
  // gizmo back" IS the turn over a quarter (checked above) — the pushed dy alone decides here, as before
  return crossingHoldSign(heading, e.heading, unit(out), dySign);
}

/* ⭐⭐⭐ (2026-11-16, `TILTED_POLE_CLOSE_IN.md` §13 — step C5: ONE HALF-TURN EVENT, the rule every crossing that turns the camera reads) ------------- */

/** ⭐ `crossingHoldSign`: a dy's part along the edge's outward direction must exceed this (of a unit up) to count — a dy sliding along the edge pushes nothing. */
export const CROSSING_PUSH_MIN = 1e-9;

/**
 * ⭐⭐⭐ (§13.2, D-T4 made exact) THE DY HOLD AT A CROSSING THAT TURNS THE CAMERA — the sign held, or 0. On the glass the finger's dy of sign `s` moves the
 * gizmo along the up SHOWN (`upShown`, `T`) before the turn and along the next face's up (`upNext`, `U`, unfolded into the face left's plane) after it;
 * `out` the direction from the face left toward the edge, in its plane. The dy is held when it PUSHED the gizmo out over the edge (`s·T·out > 0`) AND
 * the same dy would bring it straight back after the turn (`s·U·out < 0`) — the finger must reverse. ⭐ Over a free face's level side `U` is `−out` into a
 * top face, `+out` out of a bottom one: the pair is §10's rule (the turn over a quarter and the dy that pushed). ⛔ The turn over 120° and the finger's
 * LAST dy sign (`edgeHoldAt`, before C5): an exit turning 90° – 120° left the dy that pushed free to bring the gizmo straight back; a dy that crossed
 * nothing (an old or opposite sign, the edge crossed by a dx) was held. No dy, no next up: 0.
 */
export function crossingHoldSign(upShown: Vec3, upNext: Vec3 | null, out: Vec3, dySign: number): 1 | -1 | 0 {
  if (upNext === null || !(dySign > 0 || dySign < 0)) return 0;
  const s = dySign > 0 ? 1 : -1;
  return s * dot(upShown, out) > CROSSING_PUSH_MIN && s * dot(upNext, out) < -CROSSING_PUSH_MIN ? s : 0;
}

/** ⭐⭐ (§13.2) a face's own "up": the holding `up` laid in its plane (normal `n`) — upright on the glass on a BOUND face; null on a level (free) face. */
export function faceOwnUp(n: Vec3, up: Vec3): Vec3 | null {
  const w = sub(up, mul(n, dot(n, up)));
  return len(w) < FREE_NO_UPHILL ? null : unit(w);
}

/**
 * ⭐⭐ (§13.2) a direction `v` of the face beyond (normal `nTo`) UNFOLDED across the edge onto the face left's plane (normal `nFrom`): turned about the
 * edge's own line (`nFrom × nTo`) by the angle that brings `nTo` onto `nFrom` — `freeEdges`' unfolding, the edge read from the two normals. The two
 * faces coplanar (no edge): `v` as it is.
 */
export function unfoldAcross(v: Vec3, nFrom: Vec3, nTo: Vec3): Vec3 {
  const e = cross(nFrom, nTo);
  if (len(e) < 1e-12) return v;
  const d = unit(e);
  return rot(v, d, Math.atan2(dot(d, cross(nTo, nFrom)), dot(nTo, nFrom)));
}

/**
 * ⭐⭐ (§13.2) THE OUTWARD DIRECTION of a convex edge in the face left's plane (normal `nFrom`): the face beyond's normal laid in that plane (a convex
 * edge leans the face beyond's normal outward). ⛔ A concave edge (a mouth, W9) is the study before step B's. Coplanar: none.
 */
export function edgeOut(nFrom: Vec3, nTo: Vec3): Vec3 | null {
  const w = sub(nTo, mul(nFrom, dot(nFrom, nTo)));
  return len(w) < 1e-12 ? null : unit(w);
}

/**
 * ⭐⭐⭐ (§13.2) THE ONE HALF-TURN EVENT's numbers at a crossing from the face of normal `nFrom` onto the face of normal `nTo` (world, the MODEL's), the up
 * shown on the face left `upShown` (the site's own: a tilt's frame, a bound face's own up, a free face's carried heading), the holding `up`: the TURN —
 * the angle between the up shown and the next face's own up unfolded across the edge (0 … π; null: the face beyond is level — it takes the entry's
 * layout, no turn known here) — and the dy HELD (`crossingHoldSign`, its `out` the edge's own, `edgeOut`).
 */
export function crossingEvent(upShown: Vec3, nFrom: Vec3, nTo: Vec3, up: Vec3, dySign: number): { readonly turnRad: number | null; readonly hold: 1 | -1 | 0 } {
  const own = faceOwnUp(nTo, up);
  const out = edgeOut(nFrom, nTo);
  if (own === null || out === null) return { turnRad: own === null ? null : 0, hold: 0 };
  const U = unfoldAcross(own, nFrom, nTo);
  const t = sub(upShown, mul(nFrom, dot(nFrom, upShown)));
  if (len(t) < FREE_NO_UPHILL) return { turnRad: null, hold: 0 }; // the up shown along the face's normal: nothing shown in its plane
  const T = unit(t);
  return { turnRad: Math.atan2(len(cross(T, U)), dot(T, U)), hold: crossingHoldSign(T, U, out, dySign) };
}

/**
 * ⭐ `contourFaceAt`: a face's normal within this of the contour face's (deg). The contour's normals ARE the face map's (`chartContour`), here turned into a
 * zone's frame and back — rounding only; well under the cap's 1° (`CHART_CAP_DEG`), so a face 2° off is another face.
 */
export const FREE_CONTOUR_DEG = 0.5;

/** the distance from `p` to the polygon `P` (normal `n`): in its plane inside it the distance to the plane, else to its nearest side */
function polyDistance(P: readonly Vec3[], n: Vec3, p: Vec3): number {
  const h = dot(sub(p, P[0]!), n);
  const q = sub(p, mul(n, h));
  let sg = 0;
  let inside = true;
  for (let k = 0; k < P.length; k++) {
    const s = dot(cross(sub(P[(k + 1) % P.length]!, P[k]!), sub(q, P[k]!)), n);
    if (Math.abs(s) < 1e-15) continue;
    if (sg === 0) sg = Math.sign(s);
    else if (Math.sign(s) !== sg) {
      inside = false;
      break;
    }
  }
  if (inside) return Math.abs(h);
  let best = Infinity;
  for (let k = 0; k < P.length; k++) {
    const a = P[k]!;
    const e = sub(P[(k + 1) % P.length]!, a);
    const t = Math.max(0, Math.min(1, dot(sub(p, a), e) / Math.max(1e-18, dot(e, e))));
    best = Math.min(best, dist(p, add(a, mul(e, t))));
  }
  return best;
}

/**
 * ⭐⭐⭐ (step C4) A FACE MAP'S FACET ON THE CONTOUR: the position in `faces` (the atlas's contour, the WORLD's coordinates) of the face whose normal is
 * `nWorld` (within `deg`) and whose plane holds `pWorld` (within `planeM` — the contour's corner tolerance); several (coplanar faces sharing a normal): the
 * one whose polygon is nearest `pWorld`, the first on a tie. −1: none. The caller turns a map's facet (a zone's map is built in the zone's frame F: its
 * indices are not the contour's) into the world — its normal and one of its points; never a drawn mesh.
 */
export function contourFaceAt(faces: readonly ChartFace[], nWorld: Vec3, pWorld: Vec3, deg: number = FREE_CONTOUR_DEG, planeM: number = CORNER_TOL_M): number {
  const n = unit(nWorld);
  const c = Math.cos(deg * D);
  let best = -1;
  let bestD = Infinity;
  faces.forEach((f, i) => {
    if (dot(n, f.n) < c) return;
    if (Math.abs(dot(f.n, sub(pWorld, f.c))) > planeM) return;
    const d = f.pts.length >= 3 ? polyDistance(f.pts, f.n, pWorld) : dist(pWorld, f.c);
    if (d < bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

/**
 * ⭐⭐⭐ (step C4, §3.3 the first and fourth rows) THE HEADING TAKEN AT AN ENTRY onto a free face: over the side shared with the face the place was on
 * before (`from`, the contour's position — `entryHeading`: the picture does not turn); else — no previous place, not a neighbour, a pick-up with the gizmo
 * already on the face — the layout nearest the up SHOWN (`nearestHeading`, `shown` the up of the camera drawn last; `n` the face's normal). null: the face
 * has no layout at all (no entry).
 */
export function freeEntryHeading(edges: readonly FreeEdge[], from: number, shown: Vec3, n: Vec3): Vec3 | null {
  return entryHeading(edges, from) ?? nearestHeading(edges, shown, n);
}

/**
 * ⭐⭐⭐ (step C4) THE CAMERA'S HEADING ON A FREE FACE for `assembly_orbit.ts`'s `offsetFrame(u, h, …)`: the `h` whose up is the carried `heading` laid
 * square to the camera's direction `u` (centre → camera), EXACTLY — not only straight above or below. `offsetFrame`'s up is `raw` = [−sin e·cos h, cos e,
 * −sin e·sin h] (e the view's elevation) laid square to `u`: straight below (`u[1]` < 0) +[cos h, 0, sin h], straight above its opposite; off the vertical
 * `raw` also leans on the world's vertical, so the `h` is solved: `raw` in the plane of `u` and the heading (`raw · (u × heading)` = 0), its side the
 * heading's. A view too near level for an exact answer (`|cos e·m_y| > |sin e|·|m_xz|`, under 45° of elevation for a level heading): the nearest. The
 * heading along `u` (nothing square to it): the heading's own, read from below.
 */
export function freeHeadingAngle(heading: Vec3, u: Vec3): number {
  const uu = unit(u);
  const T = heading;
  const se = Math.max(-1, Math.min(1, uu[1]));
  const ce = Math.sqrt(Math.max(0, 1 - se * se));
  const M = cross(uu, T);
  const A = Math.hypot(M[0], M[2]);
  const own = Math.atan2(T[2], T[0]);
  if (!(A > 1e-12) || !(Math.abs(se) > 1e-12)) return se > 0 ? Math.atan2(-T[2], -T[0]) : own;
  // −sin e·(cos h·m_x + sin h·m_z) + cos e·m_y = 0  ⇔  cos(h − φ) = cos e·m_y / (sin e·A)
  const phi = Math.atan2(M[2], M[0]);
  const r = Math.max(-1, Math.min(1, (ce * M[1]) / (se * A)));
  const w = Math.acos(r);
  const Tp = sub(T, mul(uu, dot(T, uu)));
  const side = (h: number): number => {
    const raw: Vec3 = [-se * Math.cos(h), ce, -se * Math.sin(h)];
    return dot(raw, Tp);
  };
  const h1 = phi + w;
  const h2 = phi - w;
  return side(h1) >= side(h2) ? h1 : h2;
}
