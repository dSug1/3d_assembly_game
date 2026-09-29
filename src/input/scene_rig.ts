/**
 * ⭐⭐ **EACH SCENE'S OWN ORBIT RIG** (`D131`, the owner, 2026-09-28: *"Make the camera orbit radii and
 * height tunable for each scene"*). The scene's six ring numbers replace the config's defaults, and
 * the URL and the sliders act on the result — so a slider tunes the scene that is booted, and
 * `?orbitTopRadiusM=` still wins over the scene. ⛔ One writer: this is the only place a scene's rig
 * reaches the config. ENGINE-FREE.
 */
import type { OrbitRig } from "../core/game_structure";
import type { GestureConfig } from "./gestureConfig";
import type { Vec3 } from "../core/vec";

export function sceneConfig(base: GestureConfig, rig: OrbitRig | undefined): GestureConfig {
  if (!rig) return base;
  return {
    ...base,
    orbitTopRadiusM: rig.topRadiusM,
    orbitTopHeightM: rig.topHeightM,
    orbitMiddleRadiusM: rig.middleRadiusM,
    orbitMiddleHeightM: rig.middleHeightM,
    orbitBottomRadiusM: rig.bottomRadiusM,
    orbitBottomHeightM: rig.bottomHeightM,
  };
}

/**
 * ⭐ `D169`: the orbit's BOOT centre — the scene's own (`OrbitRig.centreM`), else `fallback` (the world origin).
 * ⭐ `Scene_1` moved up so its floor's top centre is the origin; its rings moved with it through this.
 */
export function bootOrbitCentre(rig: OrbitRig | undefined, fallback: Vec3): Vec3 {
  const c = rig?.centreM;
  return c === undefined ? fallback : [c[0], c[1], c[2]];
}
