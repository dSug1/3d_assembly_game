/**
 * ⭐⭐ A scene's lights, built — the numbers are `core/lighting.ts`'s; this only makes Babylon
 * objects of them. ⛔ A scene without `lighting` keeps `Scene_0`'s one hemispheric light.
 */
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { illuminanceAt, lightColour, unityForward, type Triple } from "../core/lighting";
import type { SceneState } from "./scene_state";

/** The default: `Scene_0`'s light and background, exactly as they were. */
function defaultLighting(st: SceneState): void {
  st.scene.clearColor = new Color4(0.078, 0.086, 0.102, 1);
  st.light = new HemisphericLight("light", new Vector3(0.3, 1, 0.2), st.scene);
  st.light.intensity = 0.95;
}

/**
 * ⭐ Builds the scene's lights. `target` is where the scene's illuminance is measured — the mean of
 * its bodies, in AUTHORED units. The shadow generators are returned so the bodies can join them.
 */
export function buildLighting(st: SceneState, target: Triple): ShadowGenerator[] {
  const spec = st.sceneSpec.lighting;
  if (spec === undefined) {
    defaultLighting(st);
    return [];
  }
  // ⭐ (2026-10-10) the lights' own unit when the scene gives one — the objects doubled, the lights kept where they were
  const u = st.sceneSpec.lightUnitM ?? st.sceneSpec.unitM ?? 1;
  const bg = spec.background;
  st.scene.clearColor = new Color4(bg[0], bg[1], bg[2], 1);
  // ⚠ The ambient FILL, standing in for Unity's environment lighting (see `LightingSpec.ambient`).
  st.light = new HemisphericLight("ambient-fill", new Vector3(0, 1, 0), st.scene);
  st.light.intensity = spec.ambient;
  st.light.groundColor = new Color3(0.25, 0.25, 0.28);

  const gens: ShadowGenerator[] = [];
  for (const l of spec.lights) {
    const fwd = unityForward(l.eulerDeg);
    const dir = new Vector3(fwd[0], fwd[1], fwd[2]);
    const pos = new Vector3(l.position[0] * u, l.position[1] * u, l.position[2] * u);
    const c = lightColour(l);
    const colour = new Color3(c[0], c[1], c[2]);
    // ⭐ The illuminance AT THE SCENE, measured in authored units — URP's falloff, not Babylon's.
    const e = illuminanceAt(l, target);
    if (l.type === "SPOT") {
      const outer = ((l.spotOuterDeg ?? 45) * Math.PI) / 180;
      const s = new SpotLight(l.name, pos, dir, outer, 1, st.scene);
      s.innerAngle = ((l.spotInnerDeg ?? l.spotOuterDeg ?? 45) * Math.PI) / 180;
      s.intensity = e;
      s.diffuse = colour;
      s.specular = colour;
      gens.push(shadowFor(s, spec.shadowStrength));
    } else {
      const d = new DirectionalLight(l.name, dir, st.scene);
      d.position = pos;
      d.intensity = e;
      d.diffuse = colour;
      d.specular = colour;
      gens.push(shadowFor(d, spec.shadowStrength));
    }
  }
  return gens;
}

/** ⭐ Soft shadows (PCF) at Unity's strength: Babylon's `darkness` is `1 − strength`. */
function shadowFor(light: SpotLight | DirectionalLight, strength: number): ShadowGenerator {
  const g = new ShadowGenerator(1024, light);
  g.usePercentageCloserFiltering = true;
  g.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  g.setDarkness(1 - Math.min(1, Math.max(0, strength)));
  g.bias = 0.0005;
  return g;
}

/**
 * Every body casts and receives — the frozen floor only receives. ⭐ `D125`: `drawn` names the mesh
 * that is actually SEEN (a body's coloured core, inside its transparent contour).
 */
export function attachShadows(
  gens: readonly ShadowGenerator[],
  bodies: readonly AbstractMesh[],
  frozen: (m: AbstractMesh) => boolean,
  drawn: (m: AbstractMesh) => AbstractMesh,
): void {
  if (gens.length === 0) return;
  for (const m of bodies) {
    const d = drawn(m);
    d.receiveShadows = true;
    if (!frozen(m)) for (const g of gens) g.addShadowCaster(d, false);
  }
}
