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
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { topFaceOutline } from "../core/underside";
import { contactFactors, positionKey, readContactFile, type ContactFile } from "../core/model_contact";
import { bootWithRetries, type BootLayout, type BootPose } from "../core/boot_heaps";
import { bootAnimator, type BootAnimator } from "./boot_anim_wiring"; // ANIMATION MODULE: boot
import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration";
import { SSAO2RenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import "@babylonjs/core/Rendering/geometryBufferRendererSceneComponent";
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";
import { type Quat, type Vec3 } from "../core/vec";
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
  applyStudio(st);
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
    // ⭐ the boot is READY when its other work is done (the contact file below): the boot animation's clock waits for it (ANIMATION MODULE: boot)
    let markReady = (): void => undefined;
    const bootReady = new Promise<void>((r) => (markReady = r));
    const stage = await place(st, bytes, read.catalog, new Set(slice.parts.map((p) => p.node)), slice.parts.map((p) => p.id), bootReady);
    try {
      st.modelStatus = `model ${slice.parts.length} parts${st.modelBootNote}${st.modelAnimNote}`;
      // ⭐⭐ the CONTACT SHADOWS per pair (`SCENE_SETUP.md` §6.3): the final stage seats every part of the slice at load
      if (spec.contact !== undefined) {
        const cr = await fetch(spec.contact);
        if (!cr.ok) throw new Error(`${spec.contact}: HTTP ${cr.status}`);
        const cf = readContactFile(await cr.json(), new Set(read.catalog.parts.map((p) => p.id)));
        if (cf.file === null) {
          console.error("⛔ the contact shadows are REFUSED:\n" + cf.refusals.join("\n"));
          st.modelStatus += `  ⛔CONTACT REFUSED ×${cf.refusals.length}`;
        } else {
          st.modelContact = prepareContact(st, cf.file);
          stage(true); // ⭐ the stage's seated set: at boot the anchors only, at the final every part
          st.modelStatus += ` · contact ${cf.file.terms.length} terms`;
        }
      }
    } finally {
      markReady();
    }
  } catch (e) {
    console.error("⛔ the scene's model did not load:", e);
    st.modelStatus = `⛔MODEL ${(e as Error).message}`;
  }
}

async function place(
  st: SceneState,
  bytes: Uint8Array,
  catalog: ModelCatalog,
  keep: ReadonlySet<string>,
  sliceIds: readonly string[],
  bootReady: Promise<void>,
): Promise<(force?: boolean) => void> {
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

  // ⭐⭐ (2026-11-13) BROWSING: a tap on a drawn part or the floor moves the orbit's centre there (`browseTargetOnPress`, `pointer_wiring.ts`)
  for (const m of byLayer.get("render")!) st.modelBrowse.add(m);
  if (floorMesh !== undefined) st.modelBrowse.add(floorMesh);

  // ⭐ Shadows: every render mesh casts and receives; the per-light caster lists the shadow level re-applies (`applyShadowLevel`) grow with them.
  const render = byLayer.get("render")!;
  st.shadowGens.forEach((g, i) => {
    for (const m of render) g.addShadowCaster(m, false);
    st.shadowFull[i]?.push(...render);
  });
  for (const m of render) m.receiveShadows = true;
  // ⭐ (2026-11-13, the owner's look: the glass a WHITE sheet, render C's clear) a TRANSPARENT PBR material's reflections fade with its opacity, as
  // Blender's alpha blend does — Babylon keeps them whole by default ("specular / radiance over alpha"): metallic glass in a bright room = opaque white
  for (const m of render) {
    const mat = m.material as { alpha?: number; useSpecularOverAlpha?: boolean; useRadianceOverAlpha?: boolean } | null;
    if (mat !== null && mat.alpha !== undefined && mat.alpha < 1 && mat.useRadianceOverAlpha !== undefined) {
      mat.useSpecularOverAlpha = false;
      mat.useRadianceOverAlpha = false;
    }
  }
  st.shadowLevelSeen = null;

  // ⭐⭐ (2026-11-13, `SCENE_SETUP.md` §6.2 item 4) THE FINAL STAGE DOES NOT MOVE: every mesh's world matrix frozen (no recomputation per frame;
  // the shadow map, drawn on events, then never redrawn for it). ⚠ W5 unfreezes a part when the player picks it up.
  holder.freezeWorldMatrix();
  for (const m of holder.getChildMeshes(false)) m.freezeWorldMatrix();

  // ⭐⭐ (2026-11-13) THE STAGE: the BOOT (the parts in their heaps — where a level starts) or the FINAL (every part at its goal); the LEVEL slider
  // `modelStage`. ⭐⭐ The boot layout is DRAWN NOW, a new seed every game (the owner: *"randomly distribute the parts within assigned areas …
  // otherwise the parts will always be the same order game after game"*) — `?bootSeed=N` replays one; the seed on the HUD. A boot placement is
  // in the scene frame (the file's root maps into it): the part's node takes root⁻¹ ∘ boot.
  const spec = st.sceneSpec.model!;
  let poses: Readonly<Record<string, BootPose>> | null = null;
  let layout: BootLayout | null = null;
  let yawOrigin = 0;
  let bootSeed = 1;
  if (spec.boot !== undefined) {
    const asked = Number(new URLSearchParams(globalThis.location?.search ?? "").get("bootSeed"));
    const seed = Number.isInteger(asked) && asked > 0 ? asked : 1 + Math.floor(Math.random() * 2147483646);
    // ⭐⭐ THE YAW ORIGIN = the model's FRONT as built (the owner: "this is the camera viewing the front of the assembly … if anything is not in
    // line, everything has to be yaw rotated so it matches this") — the camera boots facing it; the heaps in the half toward it. The camera's own
    // direction (the model's frame: Babylon's glTF reader mirrors x) is shown beside it, a check that the two agree.
    const d = st.camera.position.subtract(st.orbitCentreM);
    const cameraDeg = Math.hypot(d.x, d.z) > 1e-6 ? (Math.atan2(d.z, -d.x) * 180) / Math.PI : NaN;
    const yawOriginDeg = spec.frontDeg ?? (Number.isFinite(cameraDeg) ? cameraDeg : 270);
    try {
      const t0 = performance.now();
      const parsed = glbJson(bytes);
      let used = seed;
      if ("json" in parsed) {
        const r = bootWithRetries(bytes, parsed.json, catalog, spec.boot, seed, yawOriginDeg);
        poses = r.layout.poses;
        layout = r.layout;
        yawOrigin = yawOriginDeg;
        bootSeed = r.seed;
        used = r.seed;
      }
      st.modelBootNote = ` · boot seed ${used}, front ${Math.round(yawOriginDeg)}° camera ${Math.round(cameraDeg)}° (${Math.round(performance.now() - t0)} ms)`;
    } catch (e) {
      console.error(`⛔ the boot layout (seed ${seed}) failed — the parts shown at their goals:`, e);
      st.modelBootNote = ` · ⛔BOOT seed ${seed}: ${(e as Error).message}`;
    }
  }
  const root = scene.getTransformNodeByName(catalog.root);
  const rootQ = root?.rotationQuaternion ?? Quaternion.Identity();
  const rootP = root?.position ?? Vector3.Zero();
  const rootInv = Quaternion.Inverse(rootQ);
  const goals = new Map(
    catalog.parts
      .filter((p) => keep.has(p.node))
      .map((p) => {
        const n = scene.getTransformNodeByName(p.node);
        return [
          p.id,
          n === null ? null : { node: n, pos: n.position.clone(), rot: (n.rotationQuaternion ?? Quaternion.Identity()).clone(), scl: n.scaling.clone() },
        ] as const;
      }),
  );
  /** A placement in the scene frame onto a part's node (the file's root mapped out: root⁻¹ ∘ placement), its scaling × `s`. */
  const toNode = (id: string, P: { readonly position: Vec3; readonly rotation: Quat }, s = 1): void => {
    const g = goals.get(id);
    if (g === undefined || g === null) return;
    const q = new Quaternion(P.rotation[1], P.rotation[2], P.rotation[3], P.rotation[0]);
    g.node.rotationQuaternion = rootInv.multiply(q);
    const rel = new Vector3(P.position[0] - rootP.x, P.position[1] - rootP.y, P.position[2] - rootP.z);
    g.node.position.copyFrom(rel.applyRotationQuaternion(rootInv));
    g.node.scaling.copyFrom(g.scl).scaleInPlace(s);
  };

  // ANIMATION MODULE: boot — the POP AND TUMBLE (`boot_anim_wiring.ts`): removable with the lines marked so
  let stageSeen = -1;
  const boot: BootAnimator | null =
    layout === null
      ? null
      : bootAnimator({
          st,
          holder,
          layout,
          yawOriginDeg: yawOrigin,
          seed: bootSeed,
          ready: bootReady,
          node: (id) => goals.get(id)?.node ?? null,
          place: toNode,
          restoreAnchor: (id) => {
            const g = goals.get(id);
            if (g === undefined || g === null) return;
            g.node.position.copyFrom(g.pos);
            g.node.rotationQuaternion = g.rot.clone();
            g.node.scaling.copyFrom(g.scl);
          },
          clearContact: () => applyContactShadows(st, new Set()),
          finish: () => applyStage(true),
          replay: () => {
            if (stageSeen !== 0) return;
            stageSeen = -1;
            applyStage();
          },
        });
  const applyStage = (force = false): void => {
    const v = poses === null ? 1 : st.cfg.modelStage;
    if (v === stageSeen && !force) return;
    // ANIMATION MODULE: boot — running at the boot stage, its end applies the stage (a forced call — the contact file arriving — waits for it)
    if (boot?.running() === true && v === 0) return;
    boot?.stop();
    const entering = v !== stageSeen;
    stageSeen = v;
    // ⭐ the SEATED set: the final every part of the slice; the boot the parts without a boot place (the anchors)
    const seated = new Set(v === 1 ? sliceIds : sliceIds.filter((id) => poses?.[id] === undefined));
    // ⭐ a piece that APPEARS WHEN SEATED (the rods' caps — `PART_AUTHORING.md` §3bis) is enabled only while its part is seated — ⚠ set BEFORE the
    // boot animation starts (2026-11-14: it returned first, the six caps shown on the falling pistons and hidden only at its end — the owner: "the
    // shadows of the end connectors of the piston rods lag")
    for (const p of catalog.parts)
      for (const r of p.renders)
        if (r.appearsWhenSeated) scene.getMeshByName(r.node)?.setEnabled(seated.has(p.id));
    if (v === 0 && entering && boot?.start() === true) return; // ANIMATION MODULE: boot
    holder.unfreezeWorldMatrix();
    for (const m of holder.getChildMeshes(false)) m.unfreezeWorldMatrix();
    for (const [id, g] of goals) {
      if (g === null) continue;
      const b = v === 0 ? poses?.[id] : undefined;
      if (b === undefined) {
        g.node.position.copyFrom(g.pos);
        g.node.rotationQuaternion = g.rot.clone();
        continue;
      }
      const q = new Quaternion(b.rotation[1], b.rotation[2], b.rotation[3], b.rotation[0]);
      g.node.rotationQuaternion = rootInv.multiply(q);
      const rel = new Vector3(b.position[0] - rootP.x, b.position[1] - rootP.y, b.position[2] - rootP.z);
      g.node.position.copyFrom(rel.applyRotationQuaternion(rootInv));
    }
    holder.freezeWorldMatrix();
    for (const m of holder.getChildMeshes(false)) m.freezeWorldMatrix();
    // ⭐ the contact shadows follow the SEATED set
    applyContactShadows(st, seated);
  };
  applyStage(true);
  scene.onBeforeRenderObservable.add(() => {
    applyStage();
    boot?.step(); // ANIMATION MODULE: boot
  });

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
  return applyStage;
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

/**
 * ⭐⭐ THE SCENE SETUP a model needs (`SCENE_SETUP.md`; the scene's `lighting`, `core/lighting.ts` `LightingStudio`) — applied before the file
 * loads (its own module, loaded for a level with a model only: the other levels' bundle unchanged):
 * - ⭐ THE ENVIRONMENT the metal reflects (the owner, 2026-11-13: *"the chrome is good in blender, but is a black color in the scene render"*): a
 *   metallic material shows only what it reflects — with none, black. The scene's panorama (`lighting.environment`; else the generated sky),
 *   prefiltered on load for the roughness; its strength the `envIntensity` slider. ⚠ It lights PBR materials (the `.glb`'s) only; not drawn.
 * - TONE MAPPING (ACES, `lighting.toneMapping`): the high-key, low-contrast look of the studio.
 * - CONTACT SHADOWS (`lighting.ambientOcclusion`: SSAO2, half resolution) — ⚠ a cost per frame: the `aoOn` slider switches it, for the device's
 *   measurement.
 */
function applyStudio(st: SceneState): void {
  const scene = st.scene;
  const L = st.sceneSpec.lighting;
  scene.environmentTexture = new HDRCubeTexture(L?.environment ?? SKY_HDR, scene, 256, false, true, false, true);
  if (L?.toneMapping !== undefined) {
    const ip = scene.imageProcessingConfiguration;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = L.toneMapping.exposure;
    ip.contrast = L.toneMapping.contrast;
  }
  if (L?.ambientOcclusion === true) {
    const ao = new SSAO2RenderingPipeline("contactShadows", scene, 0.5, [st.camera], true);
    ao.radius = 0.06; // metres: a part's contact, not the room's
    ao.totalStrength = 1.0;
    // ⚠ (2026-11-13, the owner: "on my gpu computer, the frame rate has gone down to 59 fps") the cheap settings: 8 samples, the plain blur
    ao.samples = 8;
    ao.maxZ = 20;
    ao.expensiveBlur = false;
    st.aoAvailable = true;
    let seen = -1;
    scene.onBeforeRenderObservable.add(() => {
      // ⭐ the slider AND the quality ladder (`autoAo` false: dropped on a slow device — `SCENE_SETUP.md` §6.2 item 7)
      const v = st.cfg.aoOn === 1 && st.autoAo !== false ? 1 : 0;
      if (v === seen) return;
      seen = v;
      if (v === 1) scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("contactShadows", st.camera);
      else scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("contactShadows", st.camera);
    });
  }
}

/**
 * ⭐⭐ THE CONTACT SHADOWS' RECEIVERS, prepared once: each baked mesh's own colours (its part's own occlusion, `COLOR_0`) and its vertices' position
 * keys. A glTF mesh with several materials is several Babylon meshes (`<name>_primitive<i>`): each found by its node's name.
 */
function prepareContact(st: SceneState, file: ContactFile): NonNullable<SceneState["modelContact"]> {
  const names = new Set(file.terms.map((t) => t.mesh));
  const meshes: { term: string; mesh: AbstractMesh; base: Float32Array; keys: string[] }[] = [];
  for (const m of st.scene.meshes) {
    const term = names.has(m.name) ? m.name : [...names].find((n) => m.name.startsWith(`${n}_primitive`));
    if (term === undefined) continue;
    const col = m.getVerticesData(VertexBuffer.ColorKind);
    const pos = m.getVerticesData(VertexBuffer.PositionKind);
    if (col === null || pos === null) continue;
    const keys: string[] = [];
    for (let i = 0; i + 2 < pos.length; i += 3) keys.push(positionKey(pos[i]!, pos[i + 1]!, pos[i + 2]!));
    meshes.push({ term, mesh: m, base: Float32Array.from(col), keys });
  }
  return { file, meshes };
}

/**
 * ⭐⭐ THE CONTACT SHADOWS FOR A SET OF SEATED PARTS (`core/model_contact.ts`): every receiver's colours recomputed from its baked own occlusion
 * × the product of the terms whose two parts are seated — on a seating, an unseating, an undo, a reset (W5 calls it with the new set); any order
 * gives the same picture. Nothing per frame. Returns the vertices darkened.
 */
export function applyContactShadows(st: SceneState, seated: ReadonlySet<string>): number {
  const c = st.modelContact;
  if (c === null) return 0;
  const factors = contactFactors(c.file, seated);
  let n = 0;
  for (const r of c.meshes) {
    const f = factors.get(r.term);
    const out = Float32Array.from(r.base);
    if (f !== undefined) {
      const stride = out.length / r.keys.length;
      r.keys.forEach((k, i) => {
        const v = f.get(k);
        if (v === undefined) return;
        n++;
        for (let ch = 0; ch < Math.min(3, stride); ch++) out[i * stride + ch]! *= v;
      });
    }
    r.mesh.setVerticesData(VertexBuffer.ColorKind, out, true, out.length / r.keys.length);
  }
  return n;
}
