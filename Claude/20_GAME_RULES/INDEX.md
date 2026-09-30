# 20 — GAME RULES · how the game behaves, in plain language

> **STATUS** · 🔨 **THE SCORE IS PARTLY BUILT** · **OWNS** · the behavioural record
> **LAST VERIFIED** · 2026-09-27

⭐ [`spec/SCORE.md`](spec/SCORE.md) — the score (`D99`–`D101`): **episodes** against a **solved
optimum**, plus **time**; **Free Flow** escapes it. §6 is the build list (`GM1`–`GM5`). ✅ Built:
snap/seat/unsnap (`D100`), the ledger (`src/input/episode_ledger.ts`) and the HUD's episodes +
timer line (`D112`/`D115`). ⛔ Not built: the solver, the score.
⭐ [`spec/GAME_STRUCTURE.md`](spec/GAME_STRUCTURE.md) — the scaffold (`D105`), `?flow=1`; ⛔ empty
until `GM6`–`GM8`. ⭐ `D144`: a ⏸ pause menu leaves a level by reload; one scene list; §5 = later.
⭐ `D158`: a gesture that changes nothing costs zero episodes → `SCORE.md` §3.2.
⭐ [`spec/SCENE_1.md`](spec/SCENE_1.md) — `Scene_1` (`D117`).
⭐ [`spec/DEMO_SCENE.md`](spec/DEMO_SCENE.md) — a level assembling itself (`D170`–`D179`), from heaps (`D191`).
⭐ [`spec/LEVEL_END.md`](spec/LEVEL_END.md) — the level end, results, UI theme (`D180`).

⭐ [`CONCEPT_ASSESSMENT_2026-09-26.md`](CONCEPT_ASSESSMENT_2026-09-26.md) — what is missing
between the build and a game. ⛔ An assessment, not a queue.

⚠ This folder describes **behaviour**, not mechanism. When the two disagree, the record is the
requirement and the code is the bug — or the record is out of date, which is itself the finding.
