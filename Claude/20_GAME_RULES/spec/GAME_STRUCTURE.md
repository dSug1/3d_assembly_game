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
| `GM6` | **the screens**: art, a settings screen, a result screen, ~~*back* from PLAY~~ (✅ `D144`, by reload — §4; the in-page switch is §5) | a visual language (`CONCEPT_ASSESSMENT` §5) |
| `GM7` | **worlds and levels**: more `SceneDescriptor`s, a difficulty order, a theme (`CONCEPT_ASSESSMENT` §6) | `GM1`'s final configuration per scene |
| `GM8` | **save/load in Free Flow**: serialise the current scene (boot layout, final layout, cursor positions) to a local JSON file and load one — ⛔ no network egress (`CONSTRAINTS` §5) | the seam above; a *final layout* needs `GM1` |

## 3. Two rules the scaffold already binds

* ⛔ **A scene is data, and `scene_dims.ts` stays the one home of the dimensions** (defect 66):
  `Scene_0` imports them; a JSON scene carries the numbers. A body a scene cannot describe is a
  new `BodySpec` field with a vector, never a special case in `scene.ts`.
* ⛔ **`SceneDescriptor.final` is `null`** until `GM1` authors the final configuration and its
  detector; the parser refuses a non-null one loudly rather than carrying a shape nothing reads.

## ⭐ `Scene_1` (2026-09-27)

`World_0 / Level_1` plays **`Scene_1`, the painting**; any scene can be booted with the **SCENE** slider
or `?sceneIndex=N` (the registry is `content/scenes.ts`) → [`SCENE_1.md`](SCENE_1.md).

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
| 2 | **A results screen** — *Next* · *Retry* · *Level select*, the score and time | `GM1`'s level end, `GM5`'s score |
| 3 | **A settings screen**, from the menu AND the pause menu — audio, haptics, left-handed layout (⏸ mirrored), reset progress | the menu's *Settings — later* button is its slot |
| 4 | **Pause freezes the clock** — the episode timer stops while the overlay is up | `GM3`/`GM5`; the timer is wall-clock today |
| 5 | **The system back and backgrounding open the pause menu** — Android back, the browser's back, `visibilitychange` | `DEP2`'s Capacitor back-button event; ⚠ the browser's back needs a history entry per level |
| 6 | **Progress kept on the device** — unlocked levels, best episodes/time, stars — `localStorage` | ⛔ `SEC1` before any store: no egress, but per-device data (`60_SECURITY_COMPLIANCE`) |
| 7 | **A confirmation on *Quit* / *Restart*** once a level's progress is worth protecting | after `GM5` gives it a score |
| 8 | **Art, transitions, sound, a world map, level thumbnails** — thumbnails RENDERED from the scene data, so a Blender scene needs no hand-made icon | `GM6`/`GM7`, a visual language |
| 9 | **Carry Free Flow in the URL** (`&freeFlow=1`) | only once something reads it — `D101`'s score |
| 10 | **Boot on the menu by default** in the shipped build, keeping the direct boot for the device loop | the owner's call; one line in `main.ts` |

