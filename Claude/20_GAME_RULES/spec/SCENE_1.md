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
  slab whose TOP is `y = −2.3`. Frozen; seen from below it disappears (`D128`, which replaced `D121`'s see-through).

## 4. ⭐⭐ The second layout — the table that is built

> *"Let's reshuffle the pieces as follows"* — the owner, 2026-09-27, with a new 41-row table.

The second table replaces the first whole: **41 pieces — 13 white, 20 black, 3 yellow, 4 red, 1 blue**,
every one at `z = −0.34` and 0.3 deep, inside the same bounds (x −2.41 → 2.46, gravity −2.13 → 2.67).
Its materials are named `Mat_White`, `Mat_Black`, `Mat_Yellow`, `Mat_Red`, `Mat_Blue` and map onto the
slots `MAT_A`–`MAT_E`. ⭐ **No two pieces overlap** in the picture plane (a vector; the first table's
bars crossed). ⚠ The first table's disagreements with the brief (42 vs 41 pieces, 24 vs 23 black,
`z −0.33333`) and its Piece42–44 → 13 / 18 / 35 renaming went with it — they are in git history.

## 5. ⚠ What is NOT the Unity scene yet — stated

* **Materials**: the flat diffuse path, as asked; the RGB values of *white, black, yellow, red, blue,
  sand yellow* are mine (a Mondrian palette). Real materials wait for the glTF path.
* **An ambient FILL (0.35)** stands in for Unity's environment (skybox) lighting, which the brief does
  not list; without it every face turned from the three lights is black. ⚠ *Bounce intensity* (GI)
  is not modelled.
* **No tone mapping**: the sand floor, lit almost straight down by the directional light, saturates;
  the whites read slightly warm. An exposure / tone-mapping pass is the fix when it matters.
* **The painting's pieces touch face to face** (§6): under `3D6`'s collision a piece blocked in the
  plane can slide along its neighbours' faces and out of the plane (in depth), never into them.
* ⛔ **No goal** — `Scene_1` has no final configuration yet (`GM1`).

## 6. ⭐⭐ The transparent contour (`D125`)

> *"each piece has a transparent contour (the faces which will align and snap) and inside there is the
> colored part … extend the pieces so that their faces touch (no gap between the faces) but maintain a
> transparent margin with the colored core inside so that there is a visual gap maintained between the
> pieces."* — the owner, 2026-09-27

* ⭐ Every gap between two neighbouring pieces in the table is **0.03 units** — 92 pairs, all equal (a
  vector). So each piece gets a **margin of 0.015 on every side** (`SCENE_1_CONTOUR_MARGIN`, the
  `BodySpec.margin` field): the BODY — mesh, collision hull, logical faces, what a touch picks — is the
  table's size + 0.03, and every neighbouring pair **touches** (a vector: gap 0, no overlap).
* ⭐ The **coloured core** is the table's own size, unchanged, a child mesh that is never picked and
  that casts the shadows — so the cores keep their 0.03 visual gap.
* The contour is tinted in the piece's own colour at **opacity 0.1** (the owner), no specular, no
  depth write; the slider is CAMERA › *piece contour opacity* (`pieceContourAlpha`, 0 hides it).
* ⭐ A face that aligns and snaps is the CONTOUR's face, so a snapped pair lands face to face with its
  cores 0.03 apart — the painting's own gap.
* ⛔⛔ **IT EXPOSED A HOLE IN `3D6`** (found by a headless drag, not a hand): a pair that STARTS in
  contact read GJK's `0` before and after any push, so *"may not come closer"* let a piece walk
  through the bar beside it. Fixed in `core/collision.ts` → `COLLISION.md` §8.

## 7. ⭐⭐⭐ The goal and the boot (`D129`)

> *"current configuration of parts is 'level completed configuration', therefore the target the user
> has to achieve in minimum touchpoint episodes and time · scene boot configuration: reproduce the
> pieces transforms as in the snapshot (just change the transform of the couple of pieces which have
> changed, the rest and the camera stay unchanged)"* — the owner, 2026-09-28, with a phone snapshot

* **The goal** is the table of §4, square: `SCENE_1_FINAL`, the scene's `final` (`GM1`'s data; the
  floor is frozen and has no pose to reach). ⛔ Its detector is not built.
* **The boot** moves five pieces out of it, read off the snapshot; the other 36 and the camera boot
  as before:

| piece | boot position (units) | yaw | reprojection |
|---|---|---|---|
| Piece1 (white bar) | (−1.992, 2.525, 1.287) | 32.4° | 1.2 px |
| Piece2 (red) | (−2.116, 2.26, −1.591) | −5.0° | 1.6 px |
| Piece17 (yellow) | (−2.17, −1.855, −1.313) | 9.3° | 1.5 px |
| Piece23 (black) | (−2.864, 2.26, 0.587) | 0 (unreadable) | 1.8 px |
| Piece41 (black) | (1.323, −1.855, −1.412) | 0 (unreadable) | 0.4 px |

⭐ **How, since nothing on the device prints a pose**: the camera was solved from four unmoved pieces'
core corners (0.97 px rms; it reproduced the phone canvas's height at Babylon's 0.8 rad fov), then
each moved piece's x, z and yaw from its corners at its known size, its height held. ⭐ The height is
evidence, not an assumption: a one-finger drag is horizontal, and Piece41 and Piece23 fitted with y
FREE land on their table heights (0.001 and 0.03 units). ⚠ A black bar's silhouette runs from its
top face's BACK edge to its bottom face's FRONT edge — reading it centre to centre put Piece41 in the
air. ⚠ `{ yawDeg }` is a new boot orientation, in the engine's left-handed sense (+x → −z at +90°).
✅ Answered by `D130` (§8): RELATIVE — the painting whole, anywhere.

## 8. ⭐⭐⭐ When the goal is met, and the scene's own rig (`D130`, `D131`)

> *"for the 5 changed pieces, their respective goal can be achieved by two way: face aligned or
> opposite face aligned as there is no way to distinguish two opposite faces for these geometries ·
> goal completed when parts sit correctly relative to each other (modulo the point above), painting
> can sit anywhere for this Scene_01 · change the rig radius of the camera orbit: top=1.8m, middle =
> 1 m, bottom = 1.5 m"* · *"Make the camera orbit radii and height tunable for each scene"* — the
> owner, 2026-09-28

* **`frame: "RELATIVE"`** — `core/goal.ts` fits the rigid motion carrying the goal's centres onto the
  current ones (Horn 1987, closed form), refined on the pieces already in place so the misplaced
  ones cannot drag it (without that, the boot's five outliers made every piece read out: 0/41). Each
  piece is then judged against its goal carried by that motion. ⚠ A full rotation, not only a yaw —
  *relative to each other* taken literally.
* **`symmetry: "halfTurns"`** — a plain box looks the same after a half-turn about any of its own
  three axes: each face may stand where its opposite was, and a rectangle face shows no 180° spin, so
  four orientations are accepted. ⚠ Given to ALL 41 pieces, not only the five that boot away: every
  piece is such a box, so one a player moves and puts back flipped looks right and must count.
* **Tolerances** — `goalPositionTolM` 5 mm (world) and `goalAngleTolDeg` 5°, guesses with sliders in
  SCENE. ⭐ The HUD's score line reads `goal ✅`, or `goal 36/41 (Piece1 208mm/32°)` — the count in
  place and the piece furthest out. ⛔ Level end (clock and count frozen, result shown) is not built.
* **The rig** — every scene may carry `orbit` (three rings' radius and height); it replaces the
  config's defaults at boot, before the URL, so the sliders tune the booted scene. `Scene_1`: radii
  **1.8 / 1.0 / 1.5 m** (top / middle / bottom), heights 0.55 / 0.1 / −0.5 m (unchanged). `Scene_0`
  states the 2026-09-14 rig it always had (1.0 / 0.36 / 0.5). ⭐ The boot view does not move: the
  camera still boots 1.5 m out and the zoom multiplier absorbs the new rings.
