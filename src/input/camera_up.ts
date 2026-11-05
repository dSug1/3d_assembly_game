/**
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R2 / R3) **THE CAMERA'S UP FROM THE PLACE** — the scene upside up, the red's line up the screen:
 * * on a WALL (a facet more than 45° from horizontal) the up is GRAVITY's on the screen (R2);
 * * on a CAP (a top, a bottom) the up is the cap's AXIS — the cap's line square to the edge the gizmo came over (on a box the red's line there), so the red
 *   runs up the screen and the crossing is square (§20.1's choice (b) by construction);
 * * within `rollM` (`cameraRollMm`) of an edge between a cap and a wall the up is ROLLED — on the cap, the axis turned in the cap's plane toward the edge's
 *   own up `t` (the wall's gravity carried back over the edge: none at the edge it came over, a HALF turn at the far edge, a QUARTER at a side edge) and
 *   COMMITTED at the edge (the axis is `t` from then on — so going back the roll is not undone: the far edge sends the finger kept on back across the cap,
 *   never into a trap); on the wall, gravity's up turned toward `t`'s on the screen (the off-square view's roll spread over the last `rollM`). Continuous
 *   at the edge: both sides show `t`.
 * ⛔ §20's view rule (gravity beyond 45° of the vertical, carried within 35°, rolled between) and Step 6's frame up — replaced.
 * ⛔ ENGINE-FREE. Projections, rotations — textbook.
 */
import { cross, dot, normalize, qFromAxisAngle, qRotate, type Vec3 } from "../core/vec";

/** ⭐ An edge of the facet under the gizmo to a facet of the other kind (cap ↔ wall): the gizmo's distance to it (m) and its up `t` (unit, in the cap's plane). */
export interface UpEdge {
  readonly dist: number;
  readonly t: Vec3;
}

/** ⭐ Where the gizmo is, as the up reads it: on a cap (its normal) or a wall; the cap ↔ wall edges of its facet. */
export interface UpPlace {
  readonly cap: Vec3 | null;
  readonly edges: readonly UpEdge[];
}

/** ⭐ What the rule carries: the cap's axis (`null` off a cap). */
export interface UpState {
  readonly axis: Vec3 | null;
}
export const UP_FRESH: UpState = { axis: null };

/** ⭐ Within this of an edge (m) a roll is committed. */
export const UP_COMMIT_M = 0.0005;
/** ⭐ Two ups closer than this (rad) need no roll. */
const UP_SAME_RAD = (2 * Math.PI) / 180;

/** ⭐ `r` made square to the view `u` (unit); `null` along it. */
export function onScreen(r: Vec3, u: Vec3): Vec3 | null {
  const k = dot(r, u);
  return normalize([r[0] - k * u[0], r[1] - k * u[1], r[2] - k * u[2]]);
}

/** ⭐ The signed angle from `a` to `b` about `axis` (rad); a half turn read as +π. */
function angleAbout(a: Vec3, b: Vec3, axis: Vec3): number {
  const s = dot(cross(a, b), axis);
  const c = dot(a, b);
  const t = Math.atan2(s, c);
  return Math.abs(Math.abs(t) - Math.PI) < 1e-6 ? Math.PI : t;
}

const smooth = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/**
 * ⭐⭐⭐ THE UP for the view along `u` (unit — the piece's direction from the gizmo) at `place`: see the module's header. `band`: a roll under way (the finger's
 * roles held for it — `input_roles.ts`). `next` is what to carry (only the frame's own camera commits it).
 */
export function placeUp(u: Vec3, place: UpPlace, state: UpState, rollM: number): { readonly up: Vec3; readonly next: UpState; readonly band: boolean } {
  const near = place.edges.length === 0 ? null : place.edges.reduce((a, b) => (b.dist < a.dist ? b : a));
  const inBand = near !== null && rollM > 0 && near.dist < rollM;
  const w = near === null || !(rollM > 0) ? 0 : smooth(1 - near.dist / rollM);
  const fallback = (): Vec3 => onScreen([0, 1, 0], u) ?? onScreen([0, 0, 1], u) ?? [0, 1, 0];
  if (place.cap === null) {
    const g = onScreen([0, 1, 0], u) ?? fallback();
    if (!inBand) return { up: g, next: UP_FRESH, band: false };
    const tc = onScreen(near!.t, u);
    if (tc === null) return { up: g, next: UP_FRESH, band: false };
    const a = angleAbout(g, tc, u);
    if (Math.abs(a) < UP_SAME_RAD) return { up: g, next: UP_FRESH, band: false };
    return { up: qRotate(qFromAxisAngle(u, w * a), g), next: UP_FRESH, band: true };
  }
  const n = place.cap;
  // entering a cap: its axis the up of the edge it came over (the nearest)
  const axis = state.axis ?? near?.t ?? onScreen([0, 0, 1], n) ?? [1, 0, 0];
  if (inBand) {
    const a = angleAbout(axis, near!.t, n);
    if (Math.abs(a) >= UP_SAME_RAD) {
      if (near!.dist <= UP_COMMIT_M) {
        const up = onScreen(near!.t, u) ?? fallback();
        return { up, next: { axis: near!.t }, band: false };
      }
      const ref = qRotate(qFromAxisAngle(n, w * a), axis);
      return { up: onScreen(ref, u) ?? fallback(), next: { axis }, band: true };
    }
  }
  return { up: onScreen(axis, u) ?? fallback(), next: { axis }, band: false };
}
