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
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture";
import SKY_HDR from "../../Assets/Environment/sky_sand.hdr?url";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { topFaceOutline } from "../core/underside";
import { type Vec3 } from "../core/vec";
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

  // ⭐⭐ THE ENVIRONMENT the metal reflects (the owner, 2026-11-13: *"the chrome is good in blender, but is a black color in the scene render"*):
  // a metallic material shows only what it reflects — with no environment texture, black. Blender's viewport lit it with its studio image.
  // Ours is generated (`scripts/gen_sky_hdr.mjs`: sky, sun, sand — no third-party image, no network), prefiltered on load for the roughness.
  // ⚠ It lights the glTF's PBR materials only (the floor and Scene_1's pieces are StandardMaterials); not drawn as a background.
  scene.environmentTexture = new HDRCubeTexture(SKY_HDR, scene, 256, false, true, false, true);

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

  // ⭐⭐ THE SCENE'S FLOOR (designed in its Blender file — `SCENE_WORKFLOW.md` §6.3): drawn instead of the level's floor body, the body's rules on it
  const floorMesh = catalog.floor === null ? undefined : holder.getChildMeshes(false).find((m) => m.name === catalog.floor);
  if (floorMesh !== undefined) placeFloor(st, floorMesh);

  const byLayer = new Map<Layer, AbstractMesh[]>([["render", []], ["ucx", []], ["face", []], ["ghost", []]]);
  for (const m of holder.getChildMeshes(false)) {
    if (m.getTotalVertices() === 0 || m === floorMesh) continue;
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
    scene.environmentIntensity = st.cfg.envIntensity;
    const v = st.cfg.modelLayers;
    if (v === seen) return;
    seen = v;
    const shown = layersShown(v);
    for (const [layer, ms] of byLayer) for (const m of ms) m.isVisible = shown.has(layer);
  };
  apply();
  scene.onBeforeRenderObservable.add(apply);
}

/**
 * ⭐⭐ The scene's floor from its `.glb`: it RECEIVES shadows (the floor only receives), is never picked, and takes the level's floor rules — the
 * frozen body it replaces (the largest frozen one: the play volume's floor) is no longer drawn, its collision kept; `D128` hides this mesh when the
 * camera sees its underside, `D196` then shows its top face's contour in its own colour (the render loop, `st.modelFloor`). ⚠ The contour is read
 * from the mesh's OWN vertices (the top ring — its rounded corners), built once: the floor never moves.
 */
function placeFloor(st: SceneState, mesh: AbstractMesh): void {
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  mesh.computeWorldMatrix(true);
  const wm = mesh.getWorldMatrix();
  const pos = mesh.getVerticesData(VertexBuffer.PositionKind) ?? [];
  const pts: Vec3[] = [];
  for (let i = 0; i + 2 < pos.length; i += 3) {
    const v = Vector3.TransformCoordinates(new Vector3(pos[i]!, pos[i + 1]!, pos[i + 2]!), wm);
    pts.push([v.x, v.y, v.z]);
  }
  const ring = topFaceOutline(pts, { position: [0, 0, 0], orientation: [1, 0, 0, 0] }, 1e-5);
  if (ring === null) throw new Error(`the floor ${mesh.name} has no top face`);
  const top = ring[0]![1];
  const outline = CreateLines(`top-outline-${mesh.name}`, { points: ring.map((p) => new Vector3(p[0], p[1], p[2])) }, st.scene);
  const albedo = (mesh.material as { albedoColor?: Color3 } | null)?.albedoColor;
  outline.color = albedo?.clone() ?? new Color3(0.84, 0.74, 0.52);
  outline.isPickable = false;
  outline.metadata = { orbitCandidate: false };
  outline.isVisible = false;
  const frozen = st.sceneSpec.bodies.filter((b) => b.frozen).sort((a, b) => b.dims[0] * b.dims[2] - a.dims[0] * a.dims[2]);
  st.modelFloor = { mesh, outline, bottom: { centre: [0, top, 0], normal: [0, -1, 0] }, replaces: frozen[0]?.id ?? null };
}
