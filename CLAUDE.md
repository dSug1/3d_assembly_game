# 3d_assembly_game — start here

A touchscreen 3D game in which objects are picked up, oriented and **assembled** by
joining **mate connectors**.

⭐⭐⭐ **THE DOCUMENTATION ENTRY POINT IS [`Claude/README.md`](Claude/README.md), and
it is a ROUTER.** It carries load recipes — which folder to read for which kind of
work — so a session does not pull the whole tree. Read it before anything else.

⭐ **New to the project? Read [`Claude/00_CORE/LESSONS_CARRIED.md`](Claude/00_CORE/LESSONS_CARRIED.md).**
It is the distilled experience of the predecessor project (`vision_pipeline_python`,
nine months, abandoned at its input layer 2026-09-13) and it will save you a week.

---

## The five rules that bind every change

1. ⛔ **`src/core` and `src/input` import no engine.** Enforced by
   `tests/boundary.test.ts`, not by prose. The predecessor made the same claim in a
   document and it silently became false.
2. ⛔ **Golden vectors land with the code**, in the same change — and a new vector
   must be shown to **FAIL against the old code** before it is trusted.
3. ⛔ **Thresholds are millimetres on the physical screen, never pixels**
   (`src/core/units.ts`). One constant lives in exactly one place.
4. ⛔ **A mate is ANTI-PARALLEL, and breaking reads the RESIDUAL, never the observed
   gap** — the gap is zero by construction. See `Claude/30_OBJECTS_3D/INDEX.md`.
5. ⛔ **A look on a REAL DEVICE closes a change. Nothing else does.** Green suites
   are necessary and not sufficient, and touch cannot be tested with a mouse.

⛔ **The build queue is `Claude/00_CORE/QUEUE.md` and nowhere else.** Never start a
second list. A row's status changes in the queue **and** its `queue_notes/<ID>.md`
dossier, or neither.

⚠ **Preserve the tiered doc architecture** (`Claude/README.md`, bottom): state in
`INDEX.md`, narrative in `history/`, never append to a front door, never edit inside
`VERBATIM` markers.

## Commands

```bash
npm run verify      # ⭐ typecheck + golden vectors. The gate before any commit
npm run dev:usb     # dev server on 127.0.0.1 for USB port forwarding
npm run dev:lan     # dev server on the LAN (⚠ read 50_BUILD_DEPLOY first)
npm run build       # production bundle into dist/
```

## Where it stands (2026-11-22)

⭐⭐⭐ **2026-11-22 (his word): D-H20 DEPLOYED (LIVE main `40b8095` = `b21b667` on `1.0.155-Camera_back_and_forth_at_the_cap_edge`)** — his far camera back and forth at a facet change (`Scene_0bis` body ↔ cap, `Scene_1` near the poles): the far turn aimed where the gizmo waits (`followTurnAtGizmo` 1; 0 = `4dbd704`), gates PASS, **2308 vectors**, ⛔ no device look yet → [`CAMERA_FOLLOWS_GIZMO.md`](Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §19.
⭐⭐⭐ **2026-11-22 (his word): THE MERGE, DEPLOYED (LIVE main `4dbd704` = `10c5426`)** — the main folder on `1.0.154from1.0.145-Merged-with-camera-follow-worktree` (`63a95d4` + `1.0.146s-` the orbit surface spec + `1.0.146b-` RND6's diagnosis; the other worktrees removed, the unmerged lines kept as pushed `archive/*` tags); **2302 vectors**; next the orbit surface work, then RND6; ⛔ D-R1 tried and FAILED, not deployed → [`Claude/40_RENDER_SCENE/spec/TOP_BOTTOM_STUDY.md`](Claude/40_RENDER_SCENE/spec/TOP_BOTTOM_STUDY.md) §10.
⭐⭐⭐ **2026-11-22 (his word on the handover's list): R5 ON, R6 BUILT, DEPLOYED** — `pictureFarTop` **1** by default (0 = `98ac680`'s far top rule; ⚠ its far strokes on `Scene_0bis` pin the gizmo at a pole: not studied); R6 deleted the old picture's paths (12 switches, 144 → 132 sliders, ≈ 750 lines of `src`), bit for bit against `2c8ad70` on 27 recordings; LIVE main `6fc1f5d` = `ba3f4aa`; **2278 vectors**; ⛔ no device look yet (R3-FIX, R5 at 1, R6); D-R1 kept as a FUTURE IMPROVEMENT, not built (`TOP_BOTTOM_STUDY.md` §10); the merge into the main folder PREPARED, for his word → [`PICTURE_REBUILD.md`](Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md) §8.6.
⭐⭐⭐ **THE OWNER (2026-11-21, on the device): `ae456df` (the picture's rebuild R2 + R3) — *"the deploy is very good : this is the best implementation of the orbit so far"*** (it superseded `ba369aa`, `de4a10e`, `12dc4b6`). Then his MAJOR FINDING on `Scene_0bis` (the gizmo stuck on a pole, far and close; camera / piece jumps on a dy travel; close in jittery) → ⭐⭐ **2026-11-22 night (his word: *"Finish everything tonight without asking me further questions … deploy so I can test tomorrow morning"*): R3-FIX rounds 1 + 2 BUILT, gates PASS, DEPLOYED** — one heading owner (the band pays the pitch only, never in a polar zone; the follower draws through every logic turn while unlatched; the spit's latch hand-over at his C4 pace 3°/mm): his `Scene_0bis` strokes in the band identical to the old build, the spit's latch ≤ 3.4° a frame (31.8 before), `Scene_1`'s approach as R3, far out bit for bit. Then open (⭐ answered 2026-11-22, the line above): **D-R1** (the zenith crossing near the tips — the part of the stuck / jerky that is the SAME in the old build) → [`TOP_BOTTOM_STUDY.md`](Claude/40_RENDER_SCENE/spec/TOP_BOTTOM_STUDY.md) §10; **R5** built behind `pictureFarTop` 0 (its far strokes pin the gizmo at a pole: to study); **R6** (the old layers deleted) after his look. The lead's decisions of the night (his rule *"minimize the camera movements while maintaining the key rules"*), each in [`PICTURE_REBUILD.md`](Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md) §4.3a, §4.7, §8: the band 10 mm (40 reverted), R4 closed with nothing built, D-H13 – D-H19, the C4 latch pace, no band in a polar zone, R5's switch 0. **2327 vectors**; why the upright builds failed → [`UPRIGHT_LESSONS.md`](Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md).
⭐ When the orbit charts are completed, everything is merged into the `3d_assembly_game` worktree.
The earlier status moved → [`Claude/00_CORE/history/2026-11-20_claude_md_status_moved.md`](Claude/00_CORE/history/2026-11-20_claude_md_status_moved.md), [`Claude/00_CORE/history/2026-11-18_queue_status_moved.md`](Claude/00_CORE/history/2026-11-18_queue_status_moved.md).

**Read first:** ⭐ [`Claude/00_CORE/queue_notes/HANDOVER_2026-11-22.md`](Claude/00_CORE/queue_notes/HANDOVER_2026-11-22.md) — where the picture's
rebuild stands (LIVE `98ac680`), what is next in the owner's order, where to open a session, the working rules, the kit and the worktrees; the
older [`HANDOVER_2026-11-18.md`](Claude/00_CORE/queue_notes/HANDOVER_2026-11-18.md) (the lean audit's shape, the older kit).

| the subject | where |
|---|---|
| ⭐ the picture's rebuild (the best orbit so far, `ae456df`); the camera follower far out; the lessons of the upright builds | [`Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md`](Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md), [`Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md`](Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) |
| the orbit on charts: the rules, the model, the seams | [`Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md`](Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md) |
| the tilted pole close in (the rules T1 – T12) | [`Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md`](Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) |
| a level face's entry; the silent entry (§15 – §17) | [`Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md`](Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) |
| the dy held after a half turn | [`Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md`](Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md) |
| ⭐ the fast orbit: why three builds failed (§11), FO3 agreed, to be built (§12) | [`Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md`](Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md) |
| the orbit's dossier (dated entries, the decisions to review) | [`Claude/00_CORE/queue_notes/RND5.md`](Claude/00_CORE/queue_notes/RND5.md) |
| the headless gates' runbook | `scripts/probes/ORBIT_GATES.md` |
| the sliders | [`Claude/40_RENDER_SCENE/spec/TUNING_MENU.md`](Claude/40_RENDER_SCENE/spec/TUNING_MENU.md) |
| the pick-up of parts (`Scene_2`) | [`Claude/20_GAME_RULES/spec/PICK_AND_PLACE.md`](Claude/20_GAME_RULES/spec/PICK_AND_PLACE.md) §12 |
| how any new scene is made; what a part carries | [`Claude/20_GAME_RULES/spec/SCENE_WORKFLOW.md`](Claude/20_GAME_RULES/spec/SCENE_WORKFLOW.md), [`Claude/30_OBJECTS_3D/spec/PART_AUTHORING.md`](Claude/30_OBJECTS_3D/spec/PART_AUTHORING.md) |
| every input, both devices | [`Claude/10_INPUT_TOUCH/spec/INPUTS_TABLE.md`](Claude/10_INPUT_TOUCH/spec/INPUTS_TABLE.md) |

* **Not in the game** (built, measured, reverted — their records stay): package A, R1, the timing rule, the fast orbit's three builds of 2026-11-17.
* ⛔ `Scene_2` was never run with the charts. ⛔ The iPhone's black screen (RND6) is diagnosed, not fixed (branch `1.0.146b-`).
* ⛔ The solver's budget stays at 24 queries a frame; patent-free methods only; never a 3D orientation widget.
* **The record** (every status line of 2026-09 to 2026-11-16, unrewritten): [`CLAUDE_RECORD.md`](CLAUDE_RECORD.md).
