# MATERIALS AND IMPORT — how a Blender part gets its look

> **STATUS** · ⭐ **RECOMMENDATION, NOT BUILT** (2026-09-26) · **OWNS** · the material and import policy for `3D4`
> **READ IF** · you are importing a Blender part, adding a material, or changing the scene's lighting
> **LAST VERIFIED** · 2026-09-26

> *"If I create a scene by importing blender object files, how do I import the materials? Shall I
> create new materials directly in the build or can I import the materials from blender? Advise."*
> — the owner, 2026-09-26; then *"write that to capture in the md files."*

⛔ The build queue is [`../../00_CORE/QUEUE.md`](../../00_CORE/QUEUE.md); this is the dossier of
row `3D4` (real 3D file import).

---

## 1. What the build does today

Almost nothing, and that is fine for four boxes:

| | today | where |
|---|---|---|
| a body's material | one Babylon `StandardMaterial` with one flat `diffuseColor` — the RGB triple in `Scene_0` | `render/bodies.ts` `make` |
| the instruments | unlit **emissive** materials (rings, markers, the orbit dot), in their own rendering groups | `render/markers.ts`, `gizmo.ts`, `scene.ts` |
| the lighting | ONE `HemisphericLight`, intensity 0.95 | `render/scene.ts` |
| textures, roughness/metalness, shadows | none | — |
| the glTF loader | ⛔ **not a dependency** — `@babylonjs/loaders` is absent | `package.json` |

## 2. ⭐⭐ The recommendation — import the materials from Blender, through glTF

⛔ **Do not author materials in the build.**

* **glTF is Blender's native export and Babylon's native import**, and its material model — PBR:
  base colour, metallic, roughness, normal, emissive, optional textures — round-trips faithfully.
  Blender's *Principled BSDF* maps onto it directly: what is set in Blender is what the game shows.
* **The build cannot express a material.** `BodySpec.colour` is one RGB triple; authoring materials
  in code would invent a second, poorer material model and a second place to keep in sync with the
  asset — defect 66's shape, *two copies of one fact*.
* **One asset, one look, one source of truth** — the argument the project already made for reading
  the collision shape and the faces off the mesh (`D49`, `D50`) rather than a table.

## 3. ⛔⛔ Two things stay the BUILD's — the rules a material may not break

1. **The instruments are the build's.** The cyan / amber / fuchsia / white / grey outlines, rings
   and markers are game readouts, not part content: they keep their emissive materials and their
   rendering groups, and **no imported material may hide or recolour them**.
2. **The lighting is the scene's, not the asset's.** A PBR material looks right only under an
   environment; today's single hemispheric light will make imported parts flat and dark. ⭐ The scene
   needs **one environment** (a self-hosted HDR, or Babylon's procedural one) applied to every level,
   so parts authored under one Blender lighting look consistent across levels. ⛔ An asset **must not
   ship its own lights**; the loader drops them.

## 4. Practical constraints

| constraint | rule |
|---|---|
| **the format** | **`.glb`** — binary glTF, one file per part, textures EMBEDDED |
| **egress** | self-hosted in the build, never fetched from a CDN — `CONSTRAINTS` §5, the youth audience (`60_SECURITY_COMPLIANCE`) |
| **texture budget** | modest sizes: it runs on a tablet and in a Capacitor webview |
| **the licence** | `@babylonjs/loaders` is Apache-2.0 like Babylon core, so `N13` is satisfied — ⛔ but it goes into `THIRD_PARTY_NOTICES.md` **with the dependency**, and the notice ships with the binary |
| **the engine boundary** | the loader is a `src/render` concern; `src/core` still sees only the mesh's vertices, for topology and shape |
| **split vertices** | a Blender export splits vertices at every UV seam and hard edge; `mesh_topology`'s welding already handles that (`checkVerticesInsteadOfIndices`), so faces, edges and the hull stay mesh-derived |

## 5. The data seam — `BodySpec` gains a `source`

The placeholder boxes and the authored parts live side by side:

```text
source: { kind: "box", colour: [r, g, b] }        // today's Scene_0 bodies, flat diffuse
source: { kind: "glb", file: "parts/gear.glb" }   // an authored part; its material travels inside
```

⭐ The `SceneDescriptor` stays JSON (`20_GAME_RULES/spec/GAME_STRUCTURE.md`), `parseSceneDescriptor`
gains the field with a vector that refuses a missing file loudly, and nothing else in the pipeline
has to know which kind a body is.

## 6. What `3D4` builds, in order

1. `@babylonjs/loaders` as a dependency, with its notice.
2. `BodySpec.source` and its parser vectors.
3. The `.glb` path in `render/bodies.ts`: load, adopt the mesh, read topology and shape off it
   exactly as for a box.
4. One scene environment for every level, and the hemispheric light retired or kept as fill.
5. ⚠ One deliberately ugly real part as the first test asset — curved, hollow or L-shaped — because
   it tests `mesh_topology`, GJK and the seat at once (`CONCEPT_ASSESSMENT` risk 2, `3D5`).

⭐ The first asset exists: `Assets/Blender/scene_2.blend`, `Scene_1` rebuilt for an import to compare
against → [`BLENDER_ASSETS.md`](BLENDER_ASSETS.md).

## ⭐⭐ LATER — collision shapes and bounds authored in Blender (`3D8`, `3D9`, 2026-09-27)

> *"for the moment, continue to implement [the hull at spawn and the GJK gap]. Make sure it is
> modular, and can be later replaced by the collision shapes authored in Blender. Capture this
> future development in the md files."* · the same *"for the bounding box"* — the owner, 2026-09-27

* **`3D8` — collision shapes**: each part exports its convex pieces beside the mesh, named
  `UCX_<mesh>_NN` (the Unreal convention, widely supported by exporters). The loader reads them as
  the body's `ConvexPart[]` and hides them. ⭐ This is what makes a hole, a slot or an L-shape
  collide as it looks — the hull at spawn fills them, so insertion waits for this row.
* **`3D9` — bounds**: an authored box per part (a `UBX_<mesh>` box, or a named empty), read as the
  body's `Aabb` for the broad phase.
* ⭐⭐ **The full specification — naming, convexity, budgets, fit tolerances, the box's containment,
  export settings, the loader's validation and fallback** → [`BLENDER_COLLISION_AUTHORING.md`](BLENDER_COLLISION_AUTHORING.md).
* ⛔ Both drop in behind the `3D6` seams — `CollisionShapeSource` and `BoundsSource`
  ([`COLLISION.md`](COLLISION.md) §2): one new implementation, one line at the composition root,
  and every collision vector unchanged. A part WITHOUT authored pieces keeps the hull at spawn.
