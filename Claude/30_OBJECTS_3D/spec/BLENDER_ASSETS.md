# BLENDER ASSETS — the `.blend` files, how they were made, and what an import must know

> **STATUS** · live · **OWNS** · `Assets/Blender/`: every `.blend`, the scripts that build it, and the
> conventions between a Blender file and a game scene
> **READ IF** · you are opening, editing or regenerating a `.blend`, or importing one into a scene
> **LAST VERIFIED** · 2026-09-28

⭐ The import itself — the glTF loader, `BodySpec.source`, the material policy — is row `3D4` and its
dossier [`MATERIALS_AND_IMPORT.md`](MATERIALS_AND_IMPORT.md); ⛔ **not built**. Collision shapes authored
in Blender are [`BLENDER_COLLISION_AUTHORING.md`](BLENDER_COLLISION_AUTHORING.md) (`3D8`/`3D9`). This file
is the ASSETS: what exists and how it was made.

## 1. What is there

| file | what |
|---|---|
| `Assets/Blender/scene_2.blend` | ⭐ `Scene_1`'s painting rebuilt in Blender — the goal table, the frozen floor, the three lights (§2) |
| `Assets/Blender/scripts/build_painting.py` | builds the painting and the floor from `src/content/scene_1.ts` (idempotent) |
| `Assets/Blender/scripts/scene_1_lights.ts` | prints `Scene_1`'s lights as JSON, computed by the game's own `core/lighting.ts` |
| `Assets/Blender/scripts/add_lights.py` | adds the lights, the world fill and background, from that JSON (idempotent) |
| `Assets/Blender/scripts/calibrate_lights.py` | measures the two constants `add_lights.py` uses (§4) |

⚠ `.blend` is the SOURCE the owner edits; the game will load a `.glb` exported from it (`3D4`). A browser
cannot read a `.blend`.

## 2. ⭐⭐ `scene_2.blend` — `Scene_1` rebuilt, to be imported as `Scene_2`

> *"instead of the two cubes, reproduce in the blender file the scene_1 painting. Remember that we
> created rectangular pieces, and inside those pieces there was a smaller part which rendered the part"*
> · *"don't forget the frozen plate as well as the lights"* · *"rename to scene_2.blend. Indeed, I will
> later create a scene_2 and import this, and test if it matches scene_1."* — the owner, 2026-09-28

⭐ **The purpose is a comparison**: a `Scene_2` built by IMPORTING this file must look and behave like
`Scene_1`, which is built from data. Every number here therefore comes FROM `scene_1.ts` (parsed by the
script, never retyped), so a difference in the comparison is the import's, not the asset's.

* **The layout is the GOAL** — the table, square (`D129`). ⚠ Not the boot: the five pieces `Scene_1`
  boots out of place are data on the scene (`BOOT_MOVES`), not in the asset.
* **A piece is TWO objects** (`D125`): `PieceN` is the **transparent contour** — the table size + 0.015
  on EVERY side (all three axes, as `contourDims`), material `Mat_<Colour>_Contour`, alpha 0.1, alpha
  blend, no shadow; its child `PieceN_core` is the **coloured core** at the table's size,
  `Mat_<Colour>`. ⭐ So neighbouring contours touch and the cores keep the painting's 0.03 gap.
* Every object's **scale is 1** — the size is baked into the mesh, and a box is centred on its origin.
* **Materials**: `Mat_White`, `Mat_Black`, `Mat_Yellow`, `Mat_Red`, `Mat_Blue` (the owner's names,
  `SCENE_1.md` §4), `Mat_Sand` for the floor, each core colour with a `…_Contour` twin. RGB = the game's
  palette (`SCENE_1_PALETTE`, linear), roughness 0.6. Base Color AND Viewport Display set (§6).
* **The frozen plate**: `Floor`, 20 × 0.05 × 20 (2.000 m × 5 mm × 2.000 m at `unitM` 0.1), its TOP centred on the origin (`D169`; it was 21.116236 wide, topped at −2.3), custom
  property **`frozen = true`** — the game's flag. ⚠ A `.glb` export carries it only with *Include →
  Custom Properties* ticked (glTF `extras`).
* **Collections**: `Painting` (41 contours + 41 cores), `Environment` (`Floor`, the lights, `Camera`).
* `Camera` faces the painting (Front view) for previews only — the game uses its own camera.

## 3. ⛔⛔ The conventions an import must honour

| | the asset | the import must |
|---|---|---|
| **units** | the owner's Unity units, **1 unit = 1 Blender metre**, exactly `scene_1.ts`'s numbers | set **`unitM: 0.1`**, as `Scene_1` — without it the painting is ten times too large |
| **axes** | Unity/Babylon `(x, y up, z depth)` → Blender `(x, z, y)`: upright in Blender's **Front** view, depth along Blender `+y` | export glTF with **+Y up** (the default); Babylon's loader should then give back the game's axes — ⚠ REASONED, not yet tested: the first import is the test. ⭐ The swap is a reflection, which is what left-handed ↔ right-handed needs |
| **the frozen flag** | `Floor["frozen"]` | read it from the node's `extras` |
| **the core** | a child object | keep it unpicked and let it cast the shadows, as `bodies.ts` does |
| **the contour's alpha** | 0.1, alpha blend | map to the game's `pieceContourAlpha` (a slider) — or let the material carry it; one source, never both |
| **lights** | three, in `Environment` | ⛔ **the loader DROPS them** (`MATERIALS_AND_IMPORT` §3): `Scene_2` needs its own `lighting` data, as `Scene_1` — copy it |

## 4. ⭐ The lights — the game's arithmetic, then a MEASURED conversion

* **Positions, directions and colours** are `core/lighting.ts`'s own (`unityForward`, `lightColour`,
  `illuminanceAt`), run by `scene_1_lights.ts` — ⛔ not re-derived in Python (`METHOD`: a recomputation is
  a second implementation). Blender lights shine along `−Z`; the direction is set by `to_track_quat`.
* ⭐ **Checked against `SCENE_1.md` §3's own sentence**: both spots' rays pass within a unit of
  `(0, 2.5, 0)` — 0.86 (left) and 0.36 (rear).
* **Brightness keeps the game's RATIOS at the painting** — left spot 0.299, rear 0.162, directional 1.0
  (URP illuminance at the mean of the bodies, as `render/lighting.ts`). ⭐ Blender's units are not the
  game's, so the conversion was **measured, not assumed** (`calibrate_lights.py`, Blender 3.4 Eevee,
  Standard view): a sun of strength 1 renders a surface at **0.874 ×** its albedo, so `K = 1/0.874` makes
  the directional light render as the game's 1.0 (Babylon shows `albedo × intensity`); one spot watt at
  1 m lights **`F = 0.0889`** sun-strength units. So sun strength **1.14**, spot power
  `e · K · d² / F` ≈ **9,544 W** (left) and **9,170 W** (rear). ⚠ Re-measure on another Blender version.
* **Cone**: `spot_size` = Unity's outer angle, `spot_blend` = (outer − inner) / outer; the range is the
  light's custom cutoff distance. Shadow radius 1 unit (spots), sun angle 2°, soft shadows, 1024 maps.
* **Background and fill**: the world shows the game's background blue to the CAMERA only (*Is Camera
  Ray*) and lights the scene with white at the ambient **0.35 × 0.5 × K** — ⚠ Babylon's hemispheric fill
  lights a vertical face at half strength, and the painting's faces are vertical.
* **View transform `Standard`**, not Filmic: the game has no tone mapping (`SCENE_1.md` §5).
* ⭐ The owner's Unity values ride on each light as custom properties (`unity_intensity`, `unity_range`,
  `unity_spotOuterDeg`, `unity_spotInnerDeg`, `unity_kelvin`, `unity_eulerDeg`, `unity_filter`).

⚠ **What does NOT match `Scene_1`, stated**: Unity's **shadow strength 0.4** has no Eevee equivalent —
the preview's shadows are full; URP's range WINDOW `(1 − (d²/r²)²)²` is a hard cutoff here; the uniform
world fill is not Babylon's sky/ground hemisphere (up- and down-facing faces differ).

## 5. ⭐ Verified in the saved file (2026-09-28)

* 41 contours, 41 cores, every core parented; `Piece10` contour `1.93 × 0.33 × 2.44`, core `1.9 × 0.3 ×
  2.41`, scale 1.
* ⭐ **92 contour pairs touch** face to face in the picture plane — the same 92 as `SCENE_1.md` §6's
  vector — **0 overlap**, and the **core gap is 0.03** at every one of them.
* Floor top at −2.3; the painting's bottom at −2.13, so it stands a little above the floor, as in the game. ⭐ Since `D169` (2026-09-29) everything is 2.3 higher — floor top at 0, painting bottom at 0.17 — and the floor 20 wide.
* Two preview renders: the painting, then lit (blue background, sand floor, soft shadows).
* ⭐ **The scripts reproduce the file**: a copy rebuilt by `build_painting.py` + `add_lights.py` matched
  it object for object (87 objects: names, parents, positions, sizes, rotations, materials, light
  energies, custom properties), and `calibrate_lights.py` reproduced both constants exactly.

## 6. How to regenerate, and how Blender was driven

```bash
B="/c/Program Files/Blender Foundation/Blender 3.4/blender.exe"   # the owner's install
"$B" -b Assets/Blender/scene_2.blend --python Assets/Blender/scripts/build_painting.py
npx vite-node Assets/Blender/scripts/scene_1_lights.ts > "$TEMP/lights.json"
LIGHTS_JSON="$(cygpath -w "$TEMP/lights.json")" "$B" -b Assets/Blender/scene_2.blend --python Assets/Blender/scripts/add_lights.py
```

* Headless (`-b`), and every script sets `save_version = 0` so no `.blend1` is left beside the file.
* ⭐ `build_painting.py` refuses loudly if `scene_1.ts` changed shape (41 rows, six palette slots, the
  0.03/2 margin, the `FLOOR` block) — never a silent partial build.
* ⚠ **The owner's open Blender window does not see an external edit**: *File → Revert* (then the SECOND
  *Revert* in the pop-up under the cursor, or nothing happens), or *File → Open Recent* → *Don't Save*.
  ⛔ Saving the stale window overwrites the edit.

## 7. The record — how the file got here (2026-09-28)

1. The owner added `Assets/Blender/red_cube.blend`: Blender's default scene, a 2 m cube with a red material.
2. A blue cube was added beside it by script. ⭐ **The lesson it left**: in the Layout's Solid view the
   red cube showed GREY — a Blender material has a **Base Color** (render, Material Preview, the `.glb`)
   and a separate **Viewport Display** colour (Solid view only), and only the first had been set. Both
   are set on every material now.
3. Replaced by `Scene_1`'s painting (§2), then the frozen plate's flag and the lights (§4).
4. Renamed `scene_2.blend` (`git mv`) — the owner's `Scene_2` will import it and be compared with `Scene_1`.

## 8. ⭐ `D169` — the floor's top centre is the origin (2026-09-29)

⭐ Edited IN PLACE, not regenerated (so any hand edit survives): the 46 top-level objects (41 contours — their cores follow as children — `Floor`, the three lights, `Camera`) moved **+2.3 in Blender `z`** (the game's gravity), and the `Floor` mesh scaled to **20 × 20** in x/y (thickness 0.05 kept). ⭐ The scripts follow `scene_1.ts`, whose numbers moved the same way (`build_painting.py`'s preview camera too), and a copy rebuilt by `build_painting.py` + `add_lights.py` matched the edited file on all 87 objects (world positions, rotations, sizes, materials, light energies — unchanged, since they are computed relative to the painting — custom properties). → `SCENE_1.md` §9.
