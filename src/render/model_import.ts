/**
 * ⭐⭐ **A SCENE'S `.glb` IN THE GAME** (W4 – the final stage, `20_GAME_RULES/spec/SCENE_WORKFLOW.md` §6.4; the owner, 2026-11-13: *"have a look at the
 * scene in its final stage because that's the goal the player has to achieve. That will settle dimensions and scales, lighting, background"*).
 *
 * The file is READ first by `core/model_catalog.ts` (the conventions checked — ⛔ a refused file is NOT drawn, its refusals named on the HUD and the
 * console), then its meshes made by Babylon's glTF reader (`@babylonjs/loaders`, Apache-2.0 — `THIRD_PARTY_NOTICES.md`). The parts stand at their
 * GOAL (the file is authored assembled — `PART_AUTHORING.md` §3 item 5), the model's reference units scaled by its `unitM` onto the floor's top
 * (the world origin, `D169`).
 *
 * ⭐ What is drawn: the render meshes. Hidden unless the `modelLayers` slider asks (RENDERING): the collision pieces (`UCX_`, red), the face proxies
 * (`UFM_`, cyan) and their ghosts (yellow). ⛔ Nothing here is pickable or a body yet — the final stage is to be LOOKED at; the playable slice makes
 * the parts bodies (W5).
 */
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import {
  catalogSlice,
  glbJson,
  layerOf,
  layersShown,
  readModelCatalog,
  type ModelCatalog,
  type ModelLayer as Layer,
} from "../core/model_catalog";
import { type SceneState } from "./scene_state";

/**
 * ⭐ Loads `st.sceneSpec.model` (if any) and keeps it in view. Never throws: a failure is a HUD line (`st.modelStatus`) and a console error — the
 * rest of the level still boots.
 */
export async function importSceneModel(st: SceneState): Promise<void> {
  const spec = st.sceneSpec.model;
  if (spec === undefined) return;
  st.modelStatus = "model: loading…";
  try {
    const res = await fetch(spec.url);
    if (!res.ok) throw new Error(`${spec.url}: HTTP ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const parsed = glbJson(bytes);
    if ("refusal" in parsed) throw new Error(parsed.refusal);
    const read = readModelCatalog(parsed.json);
    const slice = read.catalog === null ? null : spec.parts === undefined ? { parts: read.catalog.parts, refusals: [] } : catalogSlice(read.catalog, spec.parts);
    const refusals = [...read.refusals, ...(slice?.refusals ?? [])];
    if (read.catalog === null || slice === null || refusals.length > 0) {
      console.error("⛔ the scene's model is REFUSED:\n" + refusals.join("\n"));
      st.modelStatus = `⛔MODEL REFUSED ×${refusals.length}: ${refusals[0] ?? "?"}`;
      return;
    }
    await place(st, bytes, read.catalog, new Set(slice.parts.map((p) => p.node)));
    st.modelStatus = `model ${slice.parts.length} parts`;
  } catch (e) {
    console.error("⛔ the scene's model did not load:", e);
    st.modelStatus = `⛔MODEL ${(e as Error).message}`;
  }
}

async function place(st: SceneState, bytes: Uint8Array, catalog: ModelCatalog, keep: ReadonlySet<string>): Promise<void> {
  const scene = st.scene;
  const result = await SceneLoader.ImportMeshAsync("", "", bytes, scene, undefined, ".glb");
  const gltfRoot = result.meshes.find((m) => m.name === "__root__");
  if (gltfRoot === undefined) throw new Error("the glTF reader made no __root__");

  // ⭐ Reference units → metres, standing on the floor's top (the world origin).
  const holder = new TransformNode("sceneModel", scene);
  holder.scaling.setAll(catalog.unitM);
  gltfRoot.parent = holder;

  // ⭐ Only the level's parts (the slice): the others disposed with their subtrees.
  for (const p of catalog.parts) {
    if (keep.has(p.node)) continue;
    scene.getTransformNodeByName(p.node)?.dispose(false, true);
  }

  const ghosts = new Set(catalog.parts.flatMap((p) => p.ghosts.map((g) => g.node)));
  const debugMat = (name: string, c: Color3, alpha: number): StandardMaterial => {
    const m = new StandardMaterial(name, scene);
    m.diffuseColor = c;
    m.emissiveColor = c.scale(0.5);
    m.alpha = alpha;
    m.backFaceCulling = false;
    return m;
  };
  const mats: Record<Exclude<Layer, "render">, StandardMaterial> = {
    ucx: debugMat("model.ucx", new Color3(0.9, 0.2, 0.2), 0.35),
    face: debugMat("model.face", new Color3(0.2, 0.8, 0.9), 0.35),
    ghost: debugMat("model.ghost", new Color3(0.95, 0.85, 0.2), 0.5),
  };

  const byLayer = new Map<Layer, AbstractMesh[]>([["render", []], ["ucx", []], ["face", []], ["ghost", []]]);
  for (const m of holder.getChildMeshes(false)) {
    if (m.getTotalVertices() === 0) continue;
    m.isPickable = false;
    const layer = layerOf(m.name, ghosts);
    if (layer !== "render") m.material = mats[layer];
    byLayer.get(layer)!.push(m);
  }

  // ⭐ Shadows: every render mesh casts and receives; the per-light caster lists the shadow level re-applies (`applyShadowLevel`) grow with them.
  const render = byLayer.get("render")!;
  st.shadowGens.forEach((g, i) => {
    for (const m of render) g.addShadowCaster(m, false);
    st.shadowFull[i]?.push(...render);
  });
  for (const m of render) m.receiveShadows = true;
  st.shadowLevelSeen = null;

  // ⭐ The debug layers follow the slider, applied on change only.
  let seen = -1;
  const apply = (): void => {
    const v = st.cfg.modelLayers;
    if (v === seen) return;
    seen = v;
    const shown = layersShown(v);
    for (const [layer, ms] of byLayer) for (const m of ms) m.isVisible = shown.has(layer);
  };
  apply();
  scene.onBeforeRenderObservable.add(apply);
}
