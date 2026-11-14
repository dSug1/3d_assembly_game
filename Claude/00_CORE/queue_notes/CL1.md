# CL1 — The clean-up before the pick-up flow

> **STATUS** · queued, FIRST · **OWNS** · removing the code no live caller reaches
> **LAST VERIFIED** · 2026-11-14

## 2026-11-14 — queued (the owner: *"Clear the dead and parked code first, with a bit-for-bit check on Scene_1, as was done for the slider clean-up"*)

* **Remove**: the DEAD code (~1 700 lines — the old way in / out round the piece and its state, most of `input/piece_orbit.ts`, the parked hold
  decisions, the `Recognizer` class, `core/constraint_stack.ts`, `testMate` / `mateResidual`, the router's OBJECT / SECOND roles) and the PARKED
  code (~170 — `EMPTY_PRESS_MOVES_TARGET`, the pending centre, the barycentre centre); the config keys only they read; the tests only they feed;
  their lines in `tests/unwired_debt.test.ts`. The inventory, with its callers and traps: [`../../20_GAME_RULES/history/2026-11-14_pick_and_place_decisions.md`](../../20_GAME_RULES/history/2026-11-14_pick_and_place_decisions.md).
* **Kept**: the LEGACY `orbitMode` 1; `Scene_1`'s green / turquoise pieces, the piece switch, the stuck respawn, the demo (migrated later).
* **The check**: a recorded `Scene_1` run (seeded frames: drags, lifts, releases) reproduced BIT FOR BIT after the removal, kept as a vector — as
  `TUNING_MENU.md` §2 did for the sliders. ⚠ The run is heavy: on the owner's go.
* Then: the piece orbit freed from its `st.greenBox !== null` gate → `GM10`.
