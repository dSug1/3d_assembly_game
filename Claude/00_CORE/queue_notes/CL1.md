# CL1 — The clean-up before the pick-up flow

> **STATUS** · ✅ built 2026-11-14 (bit for bit on three scenes) · **OWNS** · removing the code no live caller reaches
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

## 2026-11-14 — BUILT (`1.0.143from1.0.142-Pick-up-of-parts`)

* **Removed** (≈ 2 700 lines with their tests): in `render/green_box_wiring.ts` the way in / out round the piece (`enterPieceOrbit`,
  `returnToCentreOrbit`), the roll step (`orbitRollStepRad`), the frame's dead arms (`pieceEntry`, `pieceAim`, `centreReturn`, `pieceOrbit`) and the
  yaw-gain recompute; `input/piece_orbit.ts` down to `headingAbout` and `ringDistanceRange`; `input/hold_gesture.ts`'s `holdDecision`, `holdSwitch`,
  `trailAnchor` and the `"WAY"` mode; the commented-out way in of `render/hold_wiring.ts` and the hold's dead fields; the always-false `dxOnly` step
  of `orbitDragStep`; the `Recognizer` class (`TapHistory`, `isTapRelease` kept — the put-down's double tap reads `TapHistory`); `core/constraint_stack.ts`
  and the always-empty `SceneObject.constraints`; `EMPTY_PRESS_MOVES_TARGET`, the pending centre, `recomputeOrbitCentre`, the barycentre centre
  (`input/barycentre.ts` keeps `Ray`); `coupleStops`, `rigYawToward`, `neutralLeadSec`; nine config keys (`orbitCentreGraceMs`,
  `maxBarycenterCandidates`, `pieceOrbitEnterMm`, `pieceOrbitReturnMm`, `pieceOrbitGapMinPct`, `evictOnOverflow`, `translateSwayMm`,
  `holdSwitchRestMs`, `matePriorityOverAnchor`).
* ⭐ **DECISIONS taken (to review)**: KEPT — `testMate` / `mateResidual` (`core/mate_connector.ts`: `CLAUDE.md` rule 4 and `CONSTRAINTS.md` §7 – §8 name
  them as the binding mate contract), the router's OBJECT / SECOND roles (`input/router.ts`: `IN2`, closed by a device look, its own vectors; only
  its object branch is unused), the tree operations `attach` / `detach` / `reroot` / `connectorWorldPose` (the assembly tree), `cameraOffset` (the
  reference the turned rig must equal exactly, `orbit_rig.test.ts`) — each in `tests/unwired_debt.test.ts`; the LEGACY `orbitMode` 1; `Scene_1`'s
  pieces and the demo (the owner).
* ⭐ **The bit-for-bit check** — `scripts/probes/replay_probe.mjs`: a VIRTUAL clock (`performance.now`, `requestAnimationFrame` stepped by the probe),
  a seeded script of drags, approaches (A + drag) and taps, every frame's camera, piece and every body's placement at full precision; two runs of the
  same build identical first (⛔ the boot first stepped frames while loading: their count varied, the springs' last bits differed — fixed: no frame
  while loading, then a fixed 240). Before / after the removal: **IDENTICAL, bit for bit** — `Scene_1` (2 095 frames, seed 1; 2 472 frames, seed 3),
  `Scene_0` and `Scene_0bis` (2 033 frames each). %TEMP% clean.
* ⭐ **Found in the tests while updating them**: two regexes with literal BACKSPACES where `` was meant (`proto_hold.test.ts`, `d183.test.ts`) — they
  could never match, so they could never fail: fixed; `proto_pink_ring.test.ts` passed only on a line of the DEAD way in — pointed at the ring's own.
* **Vectors**: 1 877 → **1 787** (the deleted code's own; `recognizer.test.ts`, `proto_piece_orbit.test.ts`, `barycentre.test.ts`,
  `constraint_stack.test.ts` removed; `tap_history.test.ts` and `piece_orbit_left.test.ts` added for what is kept).
