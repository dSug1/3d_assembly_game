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

⭐⭐⭐ **2026-11-22 (his word): THE ORBIT CHARTS AND THE CAMERA FOLLOWER — CLOSED.** *"Record that the orbit charts and camera follow work is closed and this is the best implementation so far."* LIVE main **`40b8095`** = `b21b667` on **`1.0.155-Orbits-finalized`** (its last change D-H20, the far turn aimed where the gizmo waits → [`CAMERA_FOLLOWS_GIZMO.md`](Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §19) — the reference that must never regress ([`UPRIGHT_LESSONS.md`](Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) §3). **2308 vectors.**
⭐⭐⭐ **2026-11-22 evening — his amendment's ROOT, from his PC play records:** the gizmo waiting at the edges at a fast orbit = R5's far jump read between two PLACES (a pace threshold). **D-H23** (the jump read at one place, switch `followJumpAtPlace`) built on `1.0.156-Orbit-surface`, local, not deployed → [`CAMERA_FOLLOWS_GIZMO.md`](Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20.
⭐⭐⭐ **NEXT: THE ORBIT SURFACE WORK** on branch `1.0.156-Orbit-surface` in the main folder (the only worktree) → [`ORBIT_SURFACE.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE.md), [`ORBIT_SURFACE_BUILD.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) — ask him its §8 questions again before building. Then RND6 (the iPhone's black screen).
The earlier status moved → [`Claude/00_CORE/history/2026-11-22_claude_md_status_moved.md`](Claude/00_CORE/history/2026-11-22_claude_md_status_moved.md), [`Claude/00_CORE/history/2026-11-20_claude_md_status_moved.md`](Claude/00_CORE/history/2026-11-20_claude_md_status_moved.md), [`Claude/00_CORE/history/2026-11-18_queue_status_moved.md`](Claude/00_CORE/history/2026-11-18_queue_status_moved.md).

**Read first:** ⭐ [`Claude/00_CORE/queue_notes/HANDOVER_2026-11-22_orbit_surface.md`](Claude/00_CORE/queue_notes/HANDOVER_2026-11-22_orbit_surface.md) —
the orbit closed, the workfront, the reading order for the surface work, his words owed; the working rules, the kit and the archived lines →
[`HANDOVER_2026-11-22.md`](Claude/00_CORE/queue_notes/HANDOVER_2026-11-22.md) §3 – §4.

| the subject | where |
|---|---|
| ⭐ NEXT — the orbit's surface: the specification, the build ledger, the landing map (built, not wired) | [`Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE.md), [`Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) |
| ✅ CLOSED — the camera follower far out (the best so far, `40b8095`; D-H20 §19); the picture's rebuild; the lessons of the upright builds | [`Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md`](Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md), [`Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md`](Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) |
| the orbit on charts: the rules, the model, the seams | [`Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md`](Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md) |
| the tilted pole close in (the rules T1 – T12) | [`Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md`](Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) |
| a level face's entry; the silent entry (§15 – §17) | [`Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md`](Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) |
| the dy held after a half turn | [`Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md`](Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md) |
| the fast orbit: why three builds failed (§11), FO3 (§12 — closed with the orbit, no longer owed) | [`Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md`](Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md) |
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
