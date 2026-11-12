/**
 * ⭐⭐⭐ (2026-11-12, `CLOSE_IN_CONTACT.md` §5 – §6; the owner: *"Proceed"* on the footprint support) — **THE FOOTPRINT SUPPORT**: close in the orbited piece
 * hangs from the gizmo, and the gizmo follows the REAL surface (D3) — off a proud part's edge it drops (`Piece44`: 41 mm), the piece's place jumped with it
 * into the part it was still over, the solver refused the landing and read the jump as a WALL: the orbit stopped in free air (probed: 28.8° for 30 px at
 * 0.3 m, 7.9° at 20 mm, the gizmo stopped at the part's edge, nothing touched). Now the piece's height is read from what is under its WHOLE FOOTPRINT, not
 * under the gizmo's point (Oh & Stuerzlinger, GI 2005: the movement surface from the whole area of overlap, not a single contact point):
 * * the SUPPORT (`footprintSupport`) — of the placed parts whose outline, seen along the SURFACE's normal `u` (the gizmo's face), overlaps the piece's own
 *   (at its SOLVED place), the HIGHEST whose top (along `u`) is not above the piece's bottom (within `slackM`). A part rising above the piece's bottom is no support: it is a WALL (the owner's Q1 (b):
 *   the piece, the gizmo and the camera stop at it and go along it) — never a step up onto it;
 * * the RAISE (`levelRaise`) — how far the support's level stands above the gizmo along its normal (0: the gizmo is on it); the foot lifted by it, so off an edge
 *   the piece keeps its height until its footprint has cleared the part, then comes down.
 * ⚠ Chosen each frame from where the piece is SOLVED (the solver's queries in that frame read it fixed: a place is still a function of the angles within a
 *   frame); a drop of its level only where the piece fits (the wiring asks the solver's gap).
 * ⛔ ENGINE-FREE. Separating axes, a convex hull (Andrew's monotone chain) — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";
import { convexHull2D, convexOverlap2D, planeAxes } from "./contact";

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** ⭐ How far a part's top may stand ABOVE the piece's bottom and still be its support (m): the gap kept's rounding — never a step. */
export const SUPPORT_SLACK_M = 0.0005;

/** ⭐ A body's outline seen along `u` (its points on the plane square to `u`, their hull) and its extent along `u`. */
function seen(points: readonly Vec3[], a: Vec3, b: Vec3, u: Vec3): { hull: [number, number][]; lo: number; hi: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of points) {
    const h = dot(p, u);
    if (h < lo) lo = h;
    if (h > hi) hi = h;
  }
  return { hull: convexHull2D(points.map((p) => [dot(p, a), dot(p, b)] as [number, number])), lo, hi };
}

/**
 * ⭐⭐⭐ THE SUPPORT: the index of the part (`parts`, each its world points — a convex body) the piece (`piece`, its world points) rests over along `u` (unit,
 * from the surface toward the piece) — the highest top among the parts whose outline overlaps the piece's and whose top is not above the piece's bottom by
 * more than `slackM`, and not further below it than `windowM` (the piece CLOSE to it: within the shell's offset, where it hangs from the gizmo itself — ⛔
 * unbounded, a piece 6 m out over the front was "supported" by a proud part's front it was nowhere near, its foot pushed 41 mm out, the walks); `null`
 * when none. Touching outlines (an edge on an edge) do not overlap: a piece BESIDE a part is not over it.
 */
export function footprintSupport(piece: readonly Vec3[], parts: readonly (readonly Vec3[])[], u: Vec3, slackM: number = SUPPORT_SLACK_M, windowM: number = Infinity): number | null {
  if (piece.length === 0) return null;
  const [a, b] = planeAxes(u);
  const p = seen(piece, a, b, u);
  let best: number | null = null;
  let bestTop = -Infinity;
  parts.forEach((pts, i) => {
    if (pts.length === 0) return;
    const s = seen(pts, a, b, u);
    if (s.hi > p.lo + slackM || s.hi <= bestTop || s.hi < p.lo - windowM) return;
    if (!convexOverlap2D(p.hull, s.hull)) return;
    best = i;
    bestTop = s.hi;
  });
  return best;
}

/** ⭐ A body's TOP along `u`: the farthest of its points along it (signed — on a face looking down it is negative); none: `-Infinity`. */
export function supportTop(points: readonly Vec3[], u: Vec3): number {
  let hi = -Infinity;
  for (const p of points) hi = Math.max(hi, dot(p, u));
  return hi;
}

/** ⭐⭐ THE RAISE: how far the support's LEVEL (`h` along the surface's normal `n`; `null`: none) stands above the gizmo `g` — 0 with the gizmo on it or above. */
export function levelRaise(level: { readonly n: Vec3; readonly h: number } | null, g: Vec3): number {
  return level === null ? 0 : Math.max(0, level.h - dot(g, level.n));
}

/**
 * ⭐⭐ (2026-11-12) THE SUPPORT'S LEVEL SHOWN — a drop EASED, a rise at once: when the footprint clears a part the piece comes down by time (`tauMs`, a
 * critically quick exponential — 96 % in ~3 τ; ⛔ at once: 15 – 21 mm in one frame, probed), never up by time (a support is never above the piece's bottom:
 * a rise only follows the gizmo). Within a hair (0.1 mm) of its target it is the target. Fixed for the frame: every query reads one place per angle.
 */
export const SUPPORT_DROP_TAU_MS = 40;
export function supportLevelStep(h: number, target: number, dtMs: number, tauMs: number = SUPPORT_DROP_TAU_MS): number {
  if (!(target < h)) return target;
  if (!(tauMs > 0) || !(dtMs > 0)) return dtMs > 0 ? target : h;
  const next = target + (h - target) * Math.exp(-dtMs / tauMs);
  return next - target < 1e-4 ? target : next;
}
