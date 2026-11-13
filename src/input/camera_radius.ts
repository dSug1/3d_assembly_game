/**
 * THE CAMERA'S RADIUS, HELD TO ITS RANGE — what was left of `pinch.ts` when the zoom was deleted (2026-11-13, the owner: *"Set the zoom at 1 and then
 * remove the zoom function entirely. With the approach of the piece, there is no need for zoom"*): the pinch zoom (`PinchTracker`, a ratio of the
 * fingers' separations) and its gate (`pinchAllowed`) went with it.
 *
 * ⛔⛔ CLAMPED, AND THE CLAMP IS LOAD-BEARING. The scene is in METRES and Babylon's near plane is a per-camera property: `render/scene.ts` sets
 * `minZ = 0.01` precisely because the default of 1 put the whole scene inside the near plane and produced a black page with no error at all. A radius
 * below the near plane reintroduces exactly that failure, silently.
 */
import type { GestureConfig } from "./gestureConfig";

export function clampCameraRadiusM(radiusM: number, cfg: GestureConfig): number {
  return Math.min(cfg.cameraRadiusMaxM, Math.max(cfg.cameraRadiusMinM, radiusM));
}
