/**
 * ⭐⭐ prototype — **RINGS 2 AND 3 AT THE SLIDE VIEW'S TILT** (2026-10-17): their height `±r·√2` (`isoWaistHeightM`), so the direction to them from the
 * gizmo is 54.7° off the face's normal — 35.3° off the face, the isometric corner's tilt (`Scene_1`: ±0.127 m at r 0.09); `waistRings` names their ring
 * parameters; `smoothstep01` is the rig's and the waist's easing.
 * ⛔⛔ (2026-10-19, the owner: *"remove the semi-isometric function as well as its slider entirely. I don't need it any longer."*) — the semi-isometric
 * HOLD between rings 2 and 3 is DELETED (`waistHoldDirection`, `waistTurn`, `waistConeWeight`, `keepInFront`, `waistPoleFade`, `waistPrefer`, the cone
 * slider `waistIsoConeDeg`): it lifted the camera ~35° over a face seen near edge-on, halfway between the rings — a bump where a waist was expected.
 * The rings keep their height.
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";
import { fourRingLayout } from "./orbit";

/** ⭐ The smoothstep on [0, 1] (clamped) — the one home of the orbit rig's and the waist's easing. */
export function smoothstep01(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

/** ⭐ The height of rings 2 and 3 for a ring radius `r`: `r·√2` — the direction to them 54.7° off the face's normal, the isometric corner's tilt. */
export function isoWaistHeightM(r: number): number {
  return r * Math.SQRT2;
}

/** ⭐ The ring parameters of rings 2 (higher `v`) and 3 (numbered from the top). */
export function waistRings(cfg: GestureConfig): { v2: number; v3: number } {
  if (cfg.orbitLowerRingOn !== 1) return { v2: 0.5, v3: 0 };
  const f = fourRingLayout(cfg);
  return { v2: f.knots[2]! / f.total, v3: f.knots[1]! / f.total };
}
