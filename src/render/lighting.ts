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
import { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { illuminanceAt, lightColour, unityForward, type Triple } from "../core/lighting";
import { casterSignature, keyLightIndex } from "../core/auto_shadow";
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
  const u = st.sceneSpec.unitM ?? 1;
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
      const g = shadowFor(d, spec.shadowStrength);
      // ⭐ (2026-11-13, `Scene_2`'s studio) a light with a SIZE casts SOFT shadows — contact-hardening (PCSS): sharp where an object touches, wider
      // away from it, as under the reference's soft box. ⚠ The light's size as a share of its shadow map: tan(softness / 2), clamped.
      if (l.softnessDeg !== undefined) {
        g.useContactHardeningShadow = true;
        g.contactHardeningLightSizeUVRatio = Math.min(0.5, Math.max(0.01, Math.tan((l.softnessDeg * Math.PI) / 360)));
      }
      gens.push(g);
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
  // ⭐⭐ (2026-10-15) the orbited piece is drawn in the TRANSPARENT pass (its yellow face seen through it): a transparent-pass mesh casts only with this
  g.transparencyShadow = true;
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

/**
 * ⭐⭐⭐ (2026-10-15, the owner: *"make the green - turquoise piece project shadows, even on low fps device"*) — the ORBITED pieces cast (⛔ they were not
 * casters at all) and receive; each generator's FULL caster list kept, and the light that draws the piece's shadow alone (`keyLightIndex`).
 */
export function attachOrbitedShadows(st: SceneState): void {
  const gens = st.shadowGens;
  if (gens.length === 0) return;
  for (const o of st.orbitPieces) {
    o.mesh.receiveShadows = true;
    for (const g of gens) g.addShadowCaster(o.mesh, false);
  }
  st.shadowFull = gens.map((g) => (g.getShadowMap()?.renderList ?? []).slice());
  st.shadowKey = keyLightIndex(gens.map((g) => g.getLight().intensity));
  st.shadowLevelSeen = null;
}

/**
 * ⭐⭐ The shadow LEVEL applied (`shadowLevel`), on change only: `FULL` — every light, every caster; `PIECE` — the key light alone, the orbited pieces
 * alone (the others' shadows off: no map drawn, none sampled).
 */
export function applyShadowLevel(st: SceneState, level: "FULL" | "PIECE"): void {
  const gens = st.shadowGens;
  if (gens.length === 0 || st.shadowLevelSeen === level) return;
  st.shadowLevelSeen = level;
  st.scene.shadowsEnabled = true;
  gens.forEach((g, i) => {
    const map = g.getShadowMap();
    const key = i === st.shadowKey;
    g.getLight().shadowEnabled = level === "FULL" || key;
    if (map === null) return;
    map.renderList = level === "FULL" ? (st.shadowFull[i] ?? []).slice() : key ? st.orbitPieces.map((o) => o.mesh as AbstractMesh) : [];
  });
}

/**
 * ⭐⭐ (2026-11-13, `SCENE_SETUP.md` §6.2 item 1) THE SHADOW MAPS DRAWN ON EVENTS ONLY: each map renders once, then again only when its casters
 * change — one moved (its world matrix recomputed: `updateFlag`), appeared or vanished (visible / enabled), or the list itself changed (the shadow
 * level, a model loaded). A still scene costs no shadow pass; a part in the hand redraws it every frame it moves (iPhone: shadows 1 – 4 ms).
 * ⚠ Called just before `scene.render()`; `computeWorldMatrix()` is cached for an unchanged mesh, so a move made this frame is seen this frame.
 */
const shadowSignature = new WeakMap<RenderTargetTexture, number>();
export function shadowsOnDemand(st: SceneState): void {
  for (const g of st.shadowGens) {
    const map = g.getShadowMap();
    if (map === null) continue;
    if (map.refreshRate !== RenderTargetTexture.REFRESHRATE_RENDER_ONCE) map.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    const list = map.renderList ?? [];
    const h = casterSignature(
      list.map((m) => ({ flag: m.computeWorldMatrix().updateFlag, visible: m.isVisible, enabled: m.isEnabled() })),
      g.getLight().shadowEnabled,
    );
    if (shadowSignature.get(map) !== h) {
      shadowSignature.set(map, h);
      map.resetRefreshCounter();
    }
  }
}
