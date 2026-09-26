# 20 — GAME RULES · how the game behaves, in plain language

> **STATUS** · ⭐ **THE SCORE IS SPECIFIED, NOT BUILT** (2026-09-26) · **OWNS** · the behavioural record
> **LAST VERIFIED** · 2026-09-26

⭐ [`spec/SCORE.md`](spec/SCORE.md) — the score (`D99`–`D101`): **touchpoint episodes** against a
**solved optimum**, plus **elapsed time**; the snap is automatic and not an episode, unsnap is; a
seated Pioneer carries its followers; **Free Flow mode** escapes the score. Its §6 is the build
list, mirrored as `GM1`–`GM5` in `QUEUE.md`. ⛔ Nothing of it is built.
⭐ [`spec/GAME_STRUCTURE.md`](spec/GAME_STRUCTURE.md) — the scaffold (`D105`): intro → menu →
worlds → levels → play, `Scene_0` as data, the JSON seam; `?flow=1` shows it. ⛔ Empty by design:
`GM6`–`GM8` populate it.

⭐ [`CONCEPT_ASSESSMENT_2026-09-26.md`](CONCEPT_ASSESSMENT_2026-09-26.md) — what is missing
between the build and a game, in the order to tackle it. ⛔ An assessment, not a queue.

⚠ This folder describes **behaviour**, not mechanism: *"an object released inside another's
capture radius seats into it"*, not *"`testMate` returns `withinRadius`"*. When the two disagree,
the record is the requirement and the code is the bug — or the record is out of date, which is
itself the finding.
