# THE GAME'S STRUCTURE — intro, menu, worlds, levels, scenes (a scaffold)

> **STATUS** · ⭐ **SCAFFOLD BUILT 2026-09-26, EMPTY BY DESIGN** · **OWNS** · the screens, the content model, `Scene_0`
> **READ IF** · you are adding a level, a world, a screen, or the save/load of a scene
> **LAST VERIFIED** · 2026-09-26

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
| **the content** — `World_0` › `Level_0` › `Scene_0` | `content/worlds.ts` | ✅ built — ⛔ **a placeholder catalogue** |
| **the shell** — the screens as a DOM overlay; PLAY starts the scene once | `render/screens.ts` | ✅ built — ⛔ **no art, no settings, no back from PLAY** |
| **the JSON seam** — `parseSceneDescriptor` (every bad field NAMED) / `serializeSceneDescriptor` | `core/game_structure.ts` | ✅ built, round-trip vectored |
| **the boot from data** — `scene.ts` iterates `st.sceneSpec.bodies` | `render/scene.ts` | ✅ built |

⭐ **`?flow=1` shows the shell.** The default boot goes straight to `Scene_0`, because the device
loop that judges every gesture would otherwise pay three taps per reload; flipping the default is
one line in `main.ts` and the owner's call.

## 2. What is EMPTY, on purpose — the population list

| row | what to populate | needs |
|---|---|---|
| `GM6` | **the screens**: art, a settings screen, a result screen, *back* from PLAY (a second `createScene` on one canvas is not designed) | a visual language (`CONCEPT_ASSESSMENT` §5) |
| `GM7` | **worlds and levels**: more `SceneDescriptor`s, a difficulty order, a theme (`CONCEPT_ASSESSMENT` §6) | `GM1`'s final configuration per scene |
| `GM8` | **save/load in Free Flow**: serialise the current scene (boot layout, final layout, cursor positions) to a local JSON file and load one — ⛔ no network egress (`CONSTRAINTS` §5) | the seam above; a *final layout* needs `GM1` |

## 3. Two rules the scaffold already binds

* ⛔ **A scene is data, and `scene_dims.ts` stays the one home of the dimensions** (defect 66):
  `Scene_0` imports them; a JSON scene carries the numbers. A body a scene cannot describe is a
  new `BodySpec` field with a vector, never a special case in `scene.ts`.
* ⛔ **`SceneDescriptor.final` is `null`** until `GM1` authors the final configuration and its
  detector; the parser refuses a non-null one loudly rather than carrying a shape nothing reads.
