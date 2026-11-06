/**
 * ⭐⭐⭐ (2026-11-05, the tilted orbit's rebuild, STEP 6 — `TILTED_ORBIT_REBUILD_SCOPE.md` §4.4, §5, §19) **THE ORBIT'S FRAME, TURNED AT A CROSSING**:
 * the orbit's angles (yaw, pitch) are read in a FRAME — a rotation `q` (world from frame); upright, the world's own. When the orbit passes a column's top
 * (bottom) bound — the edge between a side facet and the top (bottom) cap — the frame TURNS about that edge by the DIHEDRAL between the two facets
 * (`shortestArc`: 90° on a box): the cap is then a facet of the new frame's column at the same heading, orbited as a wall is (a dx along the edge, a dy
 * across toward the far edge — the facet frame's planes: I1, the world's x / z lines on a box). Nothing moves at the turn: the piece's direction is the
 * same vector read in the new frame's angles (`rebaseAngles`).
 ⭐⭐⭐ (2026-11-05, THE REDESIGN — §20; the owner on Step 6: *"jumps, back-and-forth, stuck, camera views upside down, slanted camera views"*): the frame is
 * ONLY the orbit's angles — the camera's up is the view's (`input/camera_up.ts`), never the frame's; a cap is LEFT by any edge past `margin` and every
 * wall is orbited UPRIGHT (`capExit`, `frameStep`) — ⛔ Step 6's clamps at the far and side edges, its roll owed and its waits DELETED; the drag that left
 * a cap over its far edge is held at it (`holdPitch`, §4.2). The way back is the crossing's band edge passed by `margin` (no dithering on a threshold).
 * ⛔ ENGINE-FREE. Rotations, a piecewise test — textbook.
 */
import { qconj, qRotate, type Quat, type Vec3 } from "../core/vec";

/** ⭐ The orbit's frame: its rotation (world from frame); the cap turned onto and the facet crossed from (world normals); which way is back. */
export interface OrbitFrame {
  readonly q: Quat;
  /** the cap faced (`null`: upright) */
  readonly cap: "TOP" | "BOTTOM" | null;
  /** the faced cap's world normal, and the side facet's crossed from */
  readonly capN: Vec3 | null;
  readonly fromN: Vec3 | null;
  /** the way back below the cap's band (onto a top), else above it (onto a bottom) */
  readonly backLow: boolean;
  /** a cache key */
  readonly key: string;
}

export const UPRIGHT: OrbitFrame = { q: [1, 0, 0, 0], cap: null, capN: null, fromN: null, backLow: true, key: "U" };

export const toWorld = (f: OrbitFrame, v: Vec3): Vec3 => qRotate(f.q, v);
export const toFrame = (f: OrbitFrame, v: Vec3): Vec3 => qRotate(qconj(f.q), v);

/** ⭐ A direction's angles in its frame's coordinates (the orbit's convention: x = cos, z = sin, pitch up +), the yaw the turn nearest `yawNear`. */
export function anglesOf(u: Vec3, yawNear: number): { readonly yaw: number; readonly pitch: number } {
  const l = Math.hypot(u[0], u[1], u[2]);
  const pitch = l > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, u[1] / l))) : 0;
  let yaw = Math.hypot(u[0], u[2]) > 1e-12 ? Math.atan2(u[2], u[0]) : yawNear;
  yaw += 2 * Math.PI * Math.round((yawNear - yaw) / (2 * Math.PI));
  return { yaw, pitch };
}

/** ⭐ The direction at (`yaw`, `pitch`) in a frame's coordinates. */
export function dirOf(yaw: number, pitch: number): Vec3 {
  return [Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw)];
}

