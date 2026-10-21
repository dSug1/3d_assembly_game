/**
 * ⭐⭐⭐ prototype (2026-10-21, the owner: *"when hosting face is horizontal, on a dy travel, the piece travel is paused when it crosses the gizmo (when it is
 * exactly midway between ring 2 and ring 3), the camera does the half round turn around the gizmo while the piece travel is paused (it maintains its original
 * travel on the 4 ring 2D curve outside this pause of the piece and orbit on the mid-ring during the pause of the piece). If the dy reverse at any time, the
 * travel of the camera or piece is reversed."* → *"what is the mm between ring 2 and ring 3 in case the hosting face is vertical ? use that for the pause
 * length. build"*) — **THE TOP FACE PAUSE**: over a horizontal face one TRAVEL `u` runs ring 4 → the middle → THE PAUSE → the middle → ring 1. Off the
 * pause it IS the ring parameter `v` (shifted by the pause past it); through the pause `v` holds at the middle (`mid`, halfway between rings 3 and 2 — the
 * piece straight above the gizmo) while the PAUSE SHARE goes 0 → 1 (the camera's half round, `topFaceFrame`). The pause's span is the waist's own in `v`
 * (`pauseSpan`: rings 3 → 2), so a millimetre of dy buys as much of it as of a vertical face's waist (`Scene_1`: 11.1 mm). A function of `u` alone: dy
 * reversed anywhere retraces it — the piece back, or the camera back while the piece waits.
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";
import { waistRings } from "./waist_view";

/** ⭐ A place on the travel: the ring parameter and the pause share (0: the camera on the lower-`v` side's ring, 1: the higher's). */
export interface PausePlace {
  readonly v: number;
  readonly pause: number;
}

/** ⭐ `v` this close to the middle IS the middle (a drag lands there through floating sums). */
export const PAUSE_AT_MID = 1e-9;

/** ⭐ The pause's span in the ring parameter: the waist's (rings 3 → 2) — a vertical face's ring 2 → 3 travel. */
export function pauseSpan(cfg: GestureConfig): number {
  const { v2, v3 } = waistRings(cfg);
  return Math.abs(v2 - v3);
}

/** ⭐ The pause's place in the ring parameter: halfway between rings 3 and 2 (the piece straight above the gizmo). */
export function pauseMid(cfg: GestureConfig): number {
  const { v2, v3 } = waistRings(cfg);
  return (v2 + v3) / 2;
}

/** ⭐ The travel at a place (`span` 0: no pause — the travel is `v`). */
export function travelOf(v: number, pause: number, mid: number, span: number): number {
  if (v < mid - PAUSE_AT_MID) return v;
  if (v > mid + PAUSE_AT_MID) return v + span;
  return mid + Math.min(1, Math.max(0, pause)) * span;
}

/** ⭐ The place at a travel, `u` held to [0, 1 + `span`]. */
export function placeOf(u: number, mid: number, span: number): PausePlace {
  const w = Math.min(1 + span, Math.max(0, u));
  if (w <= mid) return { v: w, pause: 0 };
  if (w >= mid + span) return { v: w >= 1 + span ? 1 : w - span, pause: 1 }; // ⭐ the top end exactly ring 1
  return { v: mid, pause: span > 0 ? (w - mid) / span : 1 };
}

/** ⭐ The pause share a place off the middle must have: 0 below it, 1 above; at the middle the one it has. */
export function settledPause(v: number, pause: number, mid: number): number {
  if (v < mid - PAUSE_AT_MID) return 0;
  if (v > mid + PAUSE_AT_MID) return 1;
  return Math.min(1, Math.max(0, pause));
}
