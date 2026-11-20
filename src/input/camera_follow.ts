/**
 * ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` — the owner: *"keep the camera movement as a simple polar orbit and find the
 * function which links it to the orbit of the gizmo smoothly"*) THE CAMERA FOLLOWER — pure rules, no engine.
 *
 * F1 (this file's first part): THE DIRECTION ASKED — the calm's target as `calmTargets` hands it to its ease, with the whole shares by position folded in
 * (`askedCalm`): the calm WITHOUT its 120 ms ease (D-F6: the follower's one ease replaces it). Read at the rig's solved angles by `askedDir` (the wiring).
 */
import type { Vec3 } from "../core/vec";
import type { CalmState } from "./orbit_calm";

/** ⭐ The calm's target as `calmStep` takes it (`calmTarget`'s answer, or a cap's `n: null`). */
export interface CalmAskTarget {
  readonly n: Vec3 | null;
  readonly sH: number;
  readonly sV: number;
  readonly wA?: number;
  readonly poleFade?: boolean;
}

/**
 * ⭐⭐⭐ (F1) THE CALM ASKED: the target itself as a calm state (no ease: its shares and normal as given), the whole shares by position folded in exactly as
 * `calmDir` folds the eased ones (`kH` on both, `kV` on the vertical — `max(0, kH, kV)`). `null` over a cap (`n` null): the orbit's own direction.
 */
export function askedCalm(tg: CalmAskTarget, kH: number, kV: number): CalmState | null {
  if (tg.n === null) return null;
  const h = Math.max(0, kH);
  const v = Math.max(0, kH, kV);
  return {
    n: tg.n,
    sH: 1 - (1 - tg.sH) * (1 - h),
    sV: 1 - (1 - tg.sV) * (1 - v),
    wA: tg.wA ?? 0,
    ...(tg.poleFade !== undefined ? { poleFade: tg.poleFade } : {}),
  };
}
