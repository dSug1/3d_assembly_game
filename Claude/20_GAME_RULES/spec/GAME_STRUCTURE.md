# THE GAME'S STRUCTURE — intro, menu, worlds, levels, scenes (a scaffold)

> **STATUS** · ⭐ **SCAFFOLD BUILT 2026-09-26, EMPTY BY DESIGN** · **OWNS** · the screens, the content model, `Scene_0`
> **READ IF** · you are adding a level, a world, a screen, or the save/load of a scene
> **LAST VERIFIED** · 2026-09-28

> *"Create the scaffold by which the future game can have an intro, a menu, worlds and levels, etc.
> We will later populate them (mark that down in the md files). Name our current scene as
> 'Scene_0'."* — the owner, 2026-09-26

⛔ **The build queue is [`../../00_CORE/QUEUE.md`](../../00_CORE/QUEUE.md)**; the population rows
are `GM6`–`GM8` there, and this file is their dossier.

---

## 1. What exists

| piece | where | state |
|---|---|---|
| **the flow** — `INTRO → MENU → WORLDS → LEVELS → PLAY`, `back()`, the menu's *Free Flow* | `core/game_structure.ts` `GameFlow` | ✅ built, 5 vectors; refuses unknown ids |
| **the content model** — `GameContent › WorldSpec › LevelSpec › SceneDescriptor › BodySpec` | `core/game_structure.ts` | ✅ built |
| **`Scene_0`** — the workbench (`D93`), as DATA: four `BodySpec`s replacing four `make(...)` calls | `content/scene_0.ts` | ✅ built, vectored against the boot's facts |
| **the content** — `World_0` › `Level_0` › `Scene_0` | `content/worlds.ts` | ✅ built — ⛔ **a placeholder catalogue** · ⭐ `D144`: the ONE scene list — the slider's index is derived from it (§4) |
| **the shell** — the screens as a DOM overlay; PLAY starts the scene once | `render/screens.ts` | ✅ built — ⛔ **no art, no settings, no back from PLAY** · ⭐ `D144`: PLAY now LOADS the level's URL, and the ⏸ pause menu is the way back (§4) |
| **the JSON seam** — `parseSceneDescriptor` (every bad field NAMED) / `serializeSceneDescriptor` | `core/game_structure.ts` | ✅ built, round-trip vectored |
| **the boot from data** — `scene.ts` iterates `st.sceneSpec.bodies` | `render/scene.ts` | ✅ built |

⭐ **`?flow=1` shows the shell.** The default boot goes straight to `Scene_0`, because the device
loop that judges every gesture would otherwise pay three taps per reload; flipping the default is
one line in `main.ts` and the owner's call. ⭐ **`D144`: the default is `Scene_1` now** (§4).

## 2. What is EMPTY, on purpose — the population list

| row | what to populate | needs |
|---|---|---|
| `GM6` | **the screens**: art, a settings screen, ~~a result screen~~ (✅ `D180`), ~~*back* from PLAY~~ (✅ `D144`, by reload — §4; the in-page switch is §5) | a visual language (`CONCEPT_ASSESSMENT` §5) |
| `GM7` | **worlds and levels**: more `SceneDescriptor`s, a difficulty order, a theme (`CONCEPT_ASSESSMENT` §6) | `GM1`'s final configuration per scene |
| `GM8` | **save/load in Free Flow**: serialise the current scene (boot layout, final layout, cursor positions) to a local JSON file and load one — ⛔ no network egress (`CONSTRAINTS` §5) | the seam above; a *final layout* needs `GM1` |

## 3. Two rules the scaffold already binds

* ⛔ **A scene is data, and `scene_dims.ts` stays the one home of the dimensions** (defect 66):
  `Scene_0` imports them; a JSON scene carries the numbers. A body a scene cannot describe is a
  new `BodySpec` field with a vector, never a special case in `scene.ts`.
* ⛔ **`SceneDescriptor.final` is `null`** until `GM1` authors the final configuration and its
  detector; the parser refuses a non-null one loudly rather than carrying a shape nothing reads.

## ⭐ `Scene_1` (2026-09-27)

`World_0 / Level_1` plays **`Scene_1`, the painting**; any scene can be booted from the level menu
or `?sceneIndex=N` (⛔ the **SCENE** slider is deleted, `D186`) (the registry is `content/scenes.ts`) → [`SCENE_1.md`](SCENE_1.md).
⭐ `D170`/`D171`: `World_0 / Level1_demo` plays **`Scene1_demo`** — `Scene_1` assembling itself in 150 moves (`?sceneIndex=2`); ⭐ `D173`: a level may carry a `demoPlan` loader, fetched only when it is played → [`DEMO_SCENE.md`](DEMO_SCENE.md).

## 4. ⭐⭐ `D144` — the way out of a level, one scene list, `Scene_1` by default (2026-09-28)

> *"I believe what a game has is a menu page where the user can navigate between worlds or scenes,
> setup, etc. and when the scene is selected there should be a back or menu button on the scene to
> go back to the menu. Advise what is the best practice adopted by the game industry … let's keep it
> simple and note for later what improvement we can do."* — then *"Build 1 to 3. Default screen boot
> = scene_1 for the moment."* — the owner, 2026-09-28

⭐ **The industry's pattern, and what is copied of it.** A screen state machine separating the FRONT
END (title → menu → world select → level select, settings) from GAMEPLAY; inside a level, a **pause
button** opening an overlay (*Resume* · *Restart* · *Settings* · *Quit to menu*) is the one way out —
never a bare *back*, which a touch screen hits by accident; a finished level ends on a **results
screen** (*Next* · *Retry* · *Level select*); leaving a level **unloads it whole** (Unity unloads the
scene, Unreal loads a new map); and every studio keeps a **debug deep-link** past the menus.
✅ Copied now: the state machine (`GameFlow`, since `D105`), the pause menu without *Settings*, the
whole-level unload, the deep-link. ⛔ Later: §5.

| what | how | where |
|---|---|---|
| **leaving a level is a page RELOAD on a new URL** | `?sceneIndex=N` plays a level; `?flow=1&screen=MENU\|WORLDS\|LEVELS[&world=W]` shows the shell; every other parameter (tunables, the build gate's `v`) is carried. ⭐ The one unload that cannot leak: `createScene` builds its own engine and installs the HUD, the menu and every pointer listener, and none has a teardown — the scene slider has reloaded since `D117`. ⚠ Cost: ~1 s per transition | `core/game_route.ts` (engine-free, vectored) |
| **the ⏸ pause menu** | bottom-left, 10 mm (the HUD holds top-left, the tuning menu top-right): *Resume* · *Restart level* (the same scene from its boot) · *Quit to menu* (**that world's** level list — `GameFlow.back()`'s step up). ⛔ DOM buttons: a touch on them never reaches Babylon, the router or the episode ledger — **not an episode**. ⚠ The scene is not frozen and the HUD's timer keeps counting | `render/screens.ts` `installPauseMenu`, `pauseTarget` |
| **the shell's PLAY loads the level** | it navigates to the level's `?sceneIndex=`; the shell never starts a scene in the page. ⚠ `freeFlow` is not carried — nothing ever read it | `playIndexOf`, `flowAt` |
| **ONE scene list** | `content/scenes.ts`'s `SCENES` is **derived** from `content/worlds.ts`, levels in reading order (world by world). ⛔ It was a second hand-written list — *one fact, two writers*, defects 52–53's shape, waiting for `Scene_2`. ⭐ **A new scene = one data file + one level in `worlds.ts`** | `scenesOf`, `levelRefs` |
| **`Scene_1` boots by default** | `sceneIndex` defaults to `1`; `?sceneIndex=0` boots the workbench | `gestureConfig.ts` |

⭐ 15 vectors (`tests/game_route.test.ts`) over a TWO-world fixture on purpose — with one world, an
index restarting per world passes everything. ⛔ Four mutants, each RED: the default at `0`, *Quit*
to the first world, a level found by its id alone, `playHref` keeping the shell's parameters.
⭐ A headless Chrome drove boot → ⏸ → Resume → ⏸ → Quit → level list → Level 0 → Restart → Back,
no page exception. ⛔ **Rule 5: a hand on the tablet is owed.**

## 5. ⭐ Improvements for later — the owner's *"note for later"*, in rough order

| # | improvement | why / what it needs |
|---|---|---|
| 1 | **Switch levels without a reload** — one engine, `scene.dispose()`, the next `createScene`, behind a loading screen | ⛔ a teardown audit first: every render module installs DOM, observers and listeners with no dispose. Removes the ~1 s reload |
| 2 | ✅ **A results screen** — *Next* · *Retry* · *Level select*, moves, time and pieces — **built** (`D180`, `LEVEL_END.md`); the SCORE waits on `GM5` | `GM5`'s score |
| 3 | **A settings screen**, from the menu AND the pause menu — audio, haptics, left-handed layout (⏸ mirrored), reset progress, ⭐ the UI theme (`D180`) | the menu's *Settings — later* button is its slot |
| 4 | **Pause freezes the clock** — the episode timer stops while the overlay is up | `GM3`/`GM5`; the timer is wall-clock today |
| 5 | **The system back and backgrounding open the pause menu** — Android back, the browser's back, `visibilitychange` | `DEP2`'s Capacitor back-button event; ⚠ the browser's back needs a history entry per level |
| 6 | **Progress kept on the device** — unlocked levels, best episodes/time, stars — `localStorage` | ⛔ `SEC1` before any store: no egress, but per-device data (`60_SECURITY_COMPLIANCE`) |
| 7 | **A confirmation on *Quit* / *Restart*** once a level's progress is worth protecting | after `GM5` gives it a score |
| 8 | **Art, transitions, sound, a world map, level thumbnails** — thumbnails RENDERED from the scene data, so a Blender scene needs no hand-made icon | `GM6`/`GM7`, a visual language |
| 9 | **Carry Free Flow in the URL** (`&freeFlow=1`) | only once something reads it — `D101`'s score |
| 10 | **Boot on the menu by default** in the shipped build, keeping the direct boot for the device loop | the owner's call; one line in `main.ts` |


## 6. ⭐ Memory, garbage collection, and the other scaffolding issues (2026-09-28)

> *"shall we take care of garbage collection and what other issues when we scaffold the game ?"* —
> the owner, 2026-09-28. ⭐ Advice recorded, ⛔ nothing built.

### 6.1 Garbage collection — ⭐ nothing to do while a level is left by RELOAD (§4)

⭐ JavaScript's collector frees plain objects by itself. ⛔ It does NOT free three things, and a page
reload frees all three — the second reason (besides simplicity) the reload was the right first step:

* **GPU memory** — meshes, materials, textures, shadow maps stay allocated until `dispose()`.
* **Listeners and timers** on `window` — each keeps its closure, and the level's state, alive.
* **Babylon observers and render loops** — one left running draws a scene nobody sees.

✅ **Inside a level it reads healthy** (a read of the source, 2026-09-28): the gizmo updates its lines IN
PLACE (`instance:` in `render/gizmo.ts`), face markers are made once per face and hidden or shown (bounded,
~250 in `Scene_1`), PioneerFaceCursors are disposed (`render/markers.ts`).
⚠ **What could cost a level is collection PAUSES, not leaks**: the core maths returns a new `[x, y, z]`
per operation and the gizmo makes a few `new Vector3` per frame. ⛔ Probably not the tablet's slowness —
shadows alone halved its frame rate (`D138`), which points at the GPU. ⭐ **Measure before changing
anything**: USB + `chrome://inspect` → a Performance trace while dragging → count the *Minor GC* blocks;
the HUD's `frame` p95 is the number to watch.
⛔ **Owed the day §5 #1 (the in-page switch) is built — a TEARDOWN CONTRACT**: every `install*` returns a
`dispose()`, and `createScene`'s handle gets one that runs them all, then `scene.dispose()`. Today five
`window` listeners (`render/mouse_adapter.ts`), a `resize` listener (`render/scene.ts`) and the goal
pop-up's timer are never removed. ⭐ Its test: switch levels ten times, take a heap snapshot, and exactly
ONE Babylon `Scene` remains.

### 6.2 The other issues, most urgent first

| # | issue | what to do | when |
|---|---|---|---|
| 1 | **Loading Blender assets** (`3D4`, branch `1.0.50-Blender_assets`) | a `.glb` loads asynchronously: a loading state, and a missing file reported on the page (`showError` covers crashes, not a failed fetch). An imported mesh goes through the same checks as `parseSceneDescriptor` — never a unit cube in its place. ⚠ Draco / KTX2 compression shrinks files a lot; both Apache-2.0, recorded in `THIRD_PARTY_NOTICES.md` first (`N13`) | ⭐ before `Scene_2` |
| 2 | **A performance budget per level** | the tablet runs `Scene_1` at 10–20 fps, and its 41 pieces are each a mesh plus a contour — ~100 draw calls. Set triangles, draw calls, lights and texture sizes BEFORE authoring `Scene_2` in Blender. Cheap wins later: `freezeWorldMatrix()` on frozen bodies, `material.freeze()`, merging or instancing identical pieces | ⭐ before `Scene_2` |
| 3 | **Download size** | the build already warns about chunk size (Babylon). Load each level's assets on demand; it matters more once Capacitor ships them offline (`DEP2`) | with #1 |
| 4 | **WebGL context loss** | a backgrounded phone can lose its GPU context; the scene must come back on restore. Pairs with §5 #5: pause on `visibilitychange` and stop rendering while hidden (battery too) | with §5 #5 |
| 5 | **Data that survives a reload** (progress, settings) | a VERSION number in the saved format from day one, so an update still reads old saves. `localStorage` can throw (private browsing): wrap every access, as the tuning menu does. ⛔ `SEC1` first | with §5 #6 |
| 6 | **Pause in the middle of a gesture** | a finger holding a body while another taps ⏸ has no defined behaviour. Simple rule: opening the pause menu CANCELS any active gesture | with the next pause change |
| 7 | **Sound** | iOS plays audio only after a user gesture — the intro's *tap to start* is the standard place to unlock it | when sound arrives (`GM9`) |

⭐ **Recommended order**: nothing on garbage collection now; #1 and #2 before `Scene_2`, because they
shape how Blender levels are authored; the teardown contract only when the reload is dropped.
