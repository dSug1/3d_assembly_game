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

⭐⭐⭐⭐ **2026-11-22 evening (his word): THE BEST IMPLEMENTATION OF THE ORBIT SO FAR — branch `1.0.156-Orbits_with_camera_follow_final`, LIVE main `3b7a479` = `2cd1be34`.** The orbit on charts and the camera follower (closed this afternoon: LIVE `40b8095`, branch `1.0.155-Orbits_with_camera_follow_1`) + the evening's D-H23 (the far jump read at ONE place) and D-H24 (the taut leash at his finger's pace) → [`CAMERA_FOLLOWS_GIZMO.md`](Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20 — the reference that must never regress ([`UPRIGHT_LESSONS.md`](Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) §3). **2321 vectors.** (Renamed on his word: `1.0.155-Orbits-finalized` → `1.0.155-Orbits_with_camera_follow_1`, `1.0.156-Orbit-surface` → `1.0.156-Orbits_with_camera_follow_final`.)
⭐⭐⭐ **NOW: THE ORBIT SURFACE WORK** on branch `1.0.158from1.0.157-Orbit_surface` (pushed) in the worktree `../orbit_surface` (from `1.0.157-Orbit_surface`; the main folder stays on it) → [`ORBIT_SURFACE.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE.md), [`ORBIT_SURFACE_BUILD.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) — its §8 questions answered 2026-11-22 (`ORBIT_SURFACE_BUILD.md` §2bis); ⭐ the READOUT (S2) BUILT and GATED the same night, ⭐ DEPLOYED 2026-11-23 on his word (LIVE main `ff41fc3` = `5d30edf5`); the side facets AS HELD (his word); ⭐ S3, the mouth's hold restricted, BUILT, gated and ⭐ DEPLOYED 2026-11-23 (LIVE main `e80a7b0` = `1bc13f70`) → [`ORBIT_SURFACE_MOUTH_HOLD.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_MOUTH_HOLD.md); ⭐ S4, P2 DRIVES THE GIZMO (item 4, his word *"Do as per your recommendation"*), BUILT, gated and ⭐ DEPLOYED 2026-11-23 (LIVE main `86a0e53` = `664f9c53`) → [`ORBIT_SURFACE_DRIVE.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_DRIVE.md); ⭐ S4b (the alignment's stutter) DEPLOYED 2026-11-24, then ⭐ S7 – S13 (LIVE main `19c7f88` = `16f3c845`: in the game only S13, the import's B1 warning; the checks offline; S11 DEPLOYED (LIVE `df5426a`: the one cap, Piece41's tunnel, behind `surfaceL1`; the floor is not a part); ⭐ S14 (behind `landingEngine`) and the white ring DEPLOYED (LIVE `6f03b65`, 2026-11-25); his camera jitters: FIVE FIXES built, gated, ported to `1.0.156-` / `1.0.157-` (at 1 there too, his word) and ⭐ DEPLOYED ON (LIVE `870078b`, his *"Deploy with all sliders at 1"*) — `APPROACH_CAMERA_JITTER.md` §7.9, his look owed; S14's cast the default (`dfb158a8`, his look given; D9 withdrawn; not deployed yet); his stale grip on the iPhone (the pinch's lifted finger kept) diagnosed and PARKED as a future improvement — `IN2.md` 2026-11-25) → `ORBIT_SURFACE_BUILD.md` §10; his look owed → [`ORBIT_SURFACE_READOUT.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_READOUT.md) §14. Then RND6 (the iPhone's black screen).
The earlier status moved → [`Claude/00_CORE/history/2026-11-22_claude_md_status_moved_evening.md`](Claude/00_CORE/history/2026-11-22_claude_md_status_moved_evening.md), [`Claude/00_CORE/history/2026-11-22_claude_md_status_moved.md`](Claude/00_CORE/history/2026-11-22_claude_md_status_moved.md), [`Claude/00_CORE/history/2026-11-20_claude_md_status_moved.md`](Claude/00_CORE/history/2026-11-20_claude_md_status_moved.md), [`Claude/00_CORE/history/2026-11-18_queue_status_moved.md`](Claude/00_CORE/history/2026-11-18_queue_status_moved.md).

**Read first:** ⭐ [`Claude/00_CORE/queue_notes/HANDOVER_2026-11-22_orbit_surface.md`](Claude/00_CORE/queue_notes/HANDOVER_2026-11-22_orbit_surface.md) —
the orbit closed, the workfront, the reading order for the surface work, his words owed; the working rules, the kit and the archived lines →
[`HANDOVER_2026-11-22.md`](Claude/00_CORE/queue_notes/HANDOVER_2026-11-22.md) §3 – §4.

| the subject | where |
|---|---|
| ⭐ NEXT — the orbit's surface: the specification, the build ledger, the landing map (built, not wired) | [`Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE.md), [`Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md`](Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) |
| ⭐ THE BEST SO FAR — the camera follower far out (`3b7a479`: D-H20 §19, D-H23 + D-H24 §20); the picture's rebuild; the lessons of the upright builds | [`Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md`](Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md), [`Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md`](Claude/40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) |
| the orbit on charts: the rules, the model, the seams | [`Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md`](Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md) |
| the tilted pole close in (the rules T1 – T12) | [`Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md`](Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md) |
| a level face's entry; the silent entry (§15 – §17) | [`Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md`](Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md) |
| the dy held after a half turn | [`Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md`](Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md) |
| the fast orbit: why three builds failed (§11), FO3 (§12 — closed with the orbit, no longer owed) | [`Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md`](Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md) |
| the orbit's dossier (dated entries, the decisions to review) | [`Claude/00_CORE/queue_notes/RND5.md`](Claude/00_CORE/queue_notes/RND5.md) |
| the headless gates' runbook | `scripts/probes/ORBIT_GATES.md` |
| the sliders | [`Claude/40_RENDER_SCENE/spec/TUNING_MENU.md`](Claude/40_RENDER_SCENE/spec/TUNING_MENU.md) |
| the pick-up of parts (`Scene_2`) | [`Claude/20_GAME_RULES/spec/PICK_AND_PLACE.md`](Claude/20_GAME_RULES/spec/PICK_AND_PLACE.md) §12 |
| how any new scene is made; what a part carries; ⭐ every lesson of the surface work → a rule (construction, drawing) + a check (§10, §9) | [`Claude/20_GAME_RULES/spec/SCENE_WORKFLOW.md`](Claude/20_GAME_RULES/spec/SCENE_WORKFLOW.md), [`Claude/30_OBJECTS_3D/spec/PART_AUTHORING.md`](Claude/30_OBJECTS_3D/spec/PART_AUTHORING.md) |
| every input, both devices | [`Claude/10_INPUT_TOUCH/spec/INPUTS_TABLE.md`](Claude/10_INPUT_TOUCH/spec/INPUTS_TABLE.md) |

* **Not in the game** (built, measured, reverted — their records stay): package A, R1, the timing rule, the fast orbit's three builds of 2026-11-17.
* ⛔ `Scene_2` was never run with the charts. ⛔ The iPhone's black screen (RND6) is diagnosed, not fixed (branch `1.0.146b-`).
* ⛔ The solver's budget stays at 24 queries a frame; patent-free methods only; never a 3D orientation widget.
* **The record** (every status line of 2026-09 to 2026-11-16, unrewritten): [`CLAUDE_RECORD.md`](CLAUDE_RECORD.md).
