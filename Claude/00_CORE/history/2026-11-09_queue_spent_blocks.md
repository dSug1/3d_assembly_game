# QUEUE.md's spent blocks, moved 2026-11-09

> Moved unrewritten from `QUEUE.md` (its byte budget) when the polar orbit's walks and root causes were recorded. The record, not the state.

## (the record) YOU ARE HERE (2026-09-30)

⭐ The `D181`–`D196` line moved → [`2026-10-14_queue_spent_blocks.md`](2026-10-14_queue_spent_blocks.md).

⭐⭐⭐ **2026-09-30, `1.0.56-`: `D180` — THE LEVEL END** (`GM1`'s last item): complete = the goal met AND the scene at rest
(played, or a demo done); the clock and the count stop; a results card (moves · time · pieces; *Next level* · *Retry* ·
*Level select*) as a bottom sheet; every screen now styled by a swappable UI THEME (`night`, `paper`, `?uiTheme=`) →
[`LEVEL_END.md`](../../20_GAME_RULES/spec/LEVEL_END.md). ✅✅ Closed by a device look (*"Tested, ok"*, `a796ac0`). ⭐ The owner closed the device look on
everything since `D106` (2026-09-30) and kept the demo's portrait start as it is.

⭐ The 2026-09-28 – `1.0.52-` lines (`D129`–`D148`) moved → [`2026-10-14_queue_spent_blocks.md`](2026-10-14_queue_spent_blocks.md).
⏸ **PAUSED for `Scene_1`** → [`SCENE_1.md`](../../20_GAME_RULES/spec/SCENE_1.md). ⛔⛔⛔ **THE PLAYABILITY PROGRAM**: **`3D6`
collision** → **`GM1` a goal + the mate + completion** → **`3D7` play volume** → **`3D2` the
approach** → **`GM9` the player layer** → [`../queue_notes/PLAYABILITY_2026-09-27.md`](../queue_notes/PLAYABILITY_2026-09-27.md).
⭐ Collision: translation stops + slides; rotation CLAMPS on its own axis, never slides or switches
axis; shapes and bounds behind replaceable seams (Blender-authored later, `3D8`/`3D9`) →
[`COLLISION.md`](../../30_OBJECTS_3D/spec/COLLISION.md).

✅ TypeScript + Babylon + Vite; `npm run verify` = typecheck + **1619 golden vectors,
all passing** (37 → … → 1614 → **1619**, `D196`: + 5, `D127`–`D134`, the frame meter, `D136`–`D148`, `D153`–`D183`, the 0.1 mm highlight lift; ⭐ each DROP has a `D` row: `D106`–`D110`, `D120`, the audit). ⛔⛔ **A COUNT RESTATED IN TWO PLACES GOES STALE.**
⛔⛔⛔ **THE 2026-09-19 LESSON, BINDING ON EVERY ROW**: *a rule written in `scene.ts` is a rule nothing can interrogate* — **seven** mutants survived the whole suite in one day, all found by a hand. ⭐ **Decisions in `src/input/`.** ✅ The boundary test walks the import **graph**, since direct imports alone let `src/core → ../main → @render/scene` pass.
⛔⛔⛔ **THE OBJECT AXES** (`D74`–`D76`, 2026-09-22/23): a body translates along **its own axes**, the boot
camera's, frozen for the scene — the only frame since `D109` deleted `worldAxisB=0`. ⭐⭐ Blender says NO to
the pairing: the delta is **solved onto both horizontal axes** (the `CHANNELS` alternative, `depthTranslate`
and the in-zone basis are deleted, `D82`/`D109`).
⭐⭐⭐ **`D86` — §1.1's REST WINDOW IS DERIVED FROM THE DEVICE**, ✅✅ judged: 30 ms was below the measured per-pointer dispatch interval (47–87 ms), so a moving finger read as STOPPED. ⛔ Nine wrong analyses first; the owner found it in the HUD. ⭐ `D77`: **no gizmo on a frozen body** — ⚠ lapsed with `leading_face.ts`, now a guard → [`../queue_notes/IN4.md`](../queue_notes/IN4.md)
⭐⭐⭐ **THE INPUTS ARE SIMPLIFIED** (`D106`–`D109`, 2026-09-27) — `FOLLOW`, both shakes, the re-press undo, the pinned Pioneer, three rule selectors and the fuchsia offer are deleted; an aligned body is mode-less; the tablet toggles on one tap, the desktop not at all (Ctrl rotates). ⭐ Then `D110`–`D112`: **no flick** (nor `D103`'s flick-unsnap), a **double tap on a body undoes** the last action, and the HUD's first line is the **episode count and timer**. ⛔ Unjudged → [`INPUTS_TABLE.md`](../../10_INPUT_TOUCH/spec/INPUTS_TABLE.md). ⭐ `D87`'s inversion (first touch the Follower) stands; its four defects are in history.
⭐ The HUD has a `jump` line (`input/jump_watch.ts`) — a standing readout, not an open defect.
⚠ The hollow cylinder (`D92`) was made and removed the same day — defect 68 is what it taught.
⭐⭐ **THE SCENE BOOTS UNALIGNED, IN `TRANSLATE`, THE TWO PARTS TILTED 30°** (`D93`, 2026-09-25) — `bootAlignment` deleted (state only), `D63`'s jig gone with it, roll about world `z` then pitch about world `x`. ⚠ Parts' mutual gap 280 → 216 mm → `D93` in `DECISIONS.md` and its history.
⭐⭐ **A MOUSE IS A TWO-TOUCH DEVICE** (`D94`): left drag = the first touch (translates; a **Shift tap** toggles rotation, `D167`), **Shift + left drag = the second** (gravity + roll); **right-press and hold = the HitFace**, then **left-click the Pioneer face** to align — ⭐ or **Space + click** each (`D154`), or Space during a left hold (`D155`); Space + click the Follower then empty space unaligns (`D156`). ⛔ The right button moves nothing.
⭐⭐ **`scene.ts` IS SPLIT** (`D104`) → `40_RENDER_SCENE/INDEX.md`. ⛔ Unjudged.
⭐ **A PIONEERFACECURSOR PER ALIGNMENT** (`D96`): an amber ring, dragged on its face (drag ships OFF). ⛔ Unjudged by a hand.
✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/, gated on `npm run verify`.

