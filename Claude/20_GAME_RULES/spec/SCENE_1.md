# SCENE_1 — the painting

> **STATUS** · ✅ built 2026-09-27 (`D117`), ⛔ unjudged by a hand · **OWNS** · what `Scene_1` is, how
> the owner's Unity values were read, and the scene switch
> **READ IF** · you are changing `Scene_1`, adding a scene, or comparing it with the Unity original

> *"Create a Scene_1 as below: It is built from 42 flat 3D boxes standing upright in the XGravity
> plane, facing the camera (camera looks along depth), lit by two spot lights and one directional
> light."* · *"make the structure modular so that I can toggle with a slider between Scene_0 and
> Scene_1. When the slider is toggled, the corresponding scene boot from beginning."* — the owner

## 1. Where it lives

| piece | file |
|---|---|
| the data — the owner's table row for row, the lights, the floor, the palette | `src/content/scene_1.ts` |
| the registry — every scene by index | `src/content/scenes.ts` (`SCENES`, `sceneAt`) |
| the light arithmetic — Unity Euler → direction, Kelvin × filter → colour, URP falloff → illuminance | `src/core/lighting.ts` (engine-free, vectored) |
| the lights, background and shadows, built | `src/render/lighting.ts` |
| the level view (`bootView: "LEVEL"`) | `input/orbit.ts` `levelElevation` |
| the switch | the **SCENE** section at the top of the tuning menu; `?sceneIndex=N` on the URL |
| the level | `World_0 / Level_1` in `content/worlds.ts` (the `?flow=1` shell lists it) |

## 2. ⭐⭐ The scene switch — modular by construction

* A scene is **data** (`SceneDescriptor`), and `SCENES` lists them. ⛔ Nothing in `src/render` names a
  scene: a new one is one data file and one registry entry.
* `sceneIndex` is a validated tunable (a whole number ≥ 0; out of range boots `Scene_0`).
* ⭐ **The slider RELOADS the page** on `?sceneIndex=N` — the one way that guarantees *"boot from
  beginning"*: bodies, lights, seats, the undo history, the episode count and the clock all start
  fresh. Checked in headless Chrome: 0 → 1 boots 42 bodies, 1 → 0 boots 4.

## 3. How the owner's values were read

* ⭐ **Every number is the owner's, unchanged, in the owner's units.** `unitM = 0.1` (metres per
  authored unit) is applied at load to positions, sizes and light positions: the 4.9-unit painting
  stands 0.49 m wide, as `Scene_0`'s parts are 8 cm — so the camera rig, the zoom limits and every
  mm-on-the-glass threshold work unchanged. ⛔ Change `unitM`, never a table value.
* **Axes**: Unity and Babylon are both left-handed, `+y` up, `+z` forward — positions transfer as
  they are; the boot camera looks along `+z` from the orbit centre's height (the LEVEL view).
* **Light directions**: Unity applies Euler Z, X, Y; a light shines along its `+z`, so only X and Y
  matter. ⭐ Checked against the owner's own sentence — both spots' rays pass within a unit of
  `(0, 2.5, 0)` (a vector; any other reading misses by metres).
* **Intensity** is read as URP's: a spot delivers `I / d²` windowed by its range, a directional light
  `I`. The renderer is given the illuminance AT THE PAINTING (left spot ≈ 0.29, rear spot ≈ 0.16,
  directional 1.0) — Babylon's standard material has no inverse-square falloff.
* **Colour**: Kelvin → RGB (Tanner Helland's fit), times the filter colour.
* **Shadows**: soft (PCF), strength 0.4 → Babylon darkness 0.6, one 1024 map per light; every piece
  casts and receives, the floor receives.
* **Floor**: Unity's Plane is 10 × 10 units, so scale 4.79 is 47.9 × 47.9 units — ⭐ **halved, then
  80 %, 107 %, then 103 % of that: 21.116236 × 21.116236** (`D122`, the owner). A plane has no thickness, so it is a 0.05-unit
  slab whose TOP is `y = −2.3`. Frozen; seen from below it turns see-through (`D121`).

## 4. ⚠⚠ What the brief and the table disagree on — built as the TABLE says

| the brief | the table | built |
|---|---|---|
| *"42 flat 3D boxes"* | **41** rows (Piece13, 18, 35 absent; one blank row) | 41 pieces + the floor |
| `MAT_B` = *"24 pieces"* | **23** (Piece11 + 22 bars) | 23 |
| *"z = −0.33333"* | every row `−0.34` | `−0.34` |

⭐ The renaming, applied in order: Piece42 → **Piece13**, Piece43 → **Piece18**, Piece44 → **Piece35**.

## 5. ⚠ What is NOT the Unity scene yet — stated

* **Materials**: the flat diffuse path, as asked; the RGB values of *white, black, yellow, red, blue,
  sand yellow* are mine (a Mondrian palette). Real materials wait for the glTF path.
* **An ambient FILL (0.35)** stands in for Unity's environment (skybox) lighting, which the brief does
  not list; without it every face turned from the three lights is black. ⚠ *Bounce intensity* (GI)
  is not modelled.
* **No tone mapping**: the sand floor, lit almost straight down by the directional light, saturates;
  the whites read slightly warm. An exposure / tone-mapping pass is the fix when it matters.
* **The painting's pieces are tightly packed** (gaps down to 0.01 units = 1 mm, some bars crossing):
  under `3D6`'s collision a piece blocked in the plane moves freely out of it first (checked: the red
  Piece12 moved in depth, then sideways; a bar that met it slid).
* ⛔ **No goal** — `Scene_1` has no final configuration yet (`GM1`).
