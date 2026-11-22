# RND7 — The orbit's surface: where the gizmo travels

> **STATUS** · ⏸ **NEXT** (2026-11-22 evening) — the workfront: branch `1.0.157-Orbit_surface` (from `1.0.156-Orbits_with_camera_follow_final`, local), the
> main folder. Built OFFLINE before the merge (2026-11-17): S0 (the entry sets on `Scene_2`'s real collision pieces) and S1 (the landing map,
> `src/core/landing_map.ts` — NOT wired: nothing calls it). Nothing else built.
> **NEXT** · ask the owner `ORBIT_SURFACE.md` §8's end again — his words still owed — before building anything.
> **LAST VERIFIED** · 2026-11-22, on `c0e40f85` (docs) = LIVE `3b7a479`'s code

## Start here
* [`HANDOVER_2026-11-22_orbit_surface.md`](HANDOVER_2026-11-22_orbit_surface.md) — the reading order and the rules.
* The specification [`ORBIT_SURFACE.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE.md) (its header's 2026-11-22 evening block first: what changed since it
  was written) and the ledger [`ORBIT_SURFACE_BUILD.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) (§9: the terms the closed orbit sets for the
  wiring).

## The terms (the orbit is CLOSED — RND5)
* Never reopen what drives the gizmo's and the piece's orbit, nor the camera ([`ORBIT_SURFACE.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE.md) §0's scope).
  The reference that must never regress: LIVE `3b7a479`
  ([`UPRIGHT_LESSONS.md`](../../40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) §3); every wired step behind its own switch, 0 = it frame for frame.
* The gates: his PC play records replayed headless (the kit's `walk_r.mjs` — [`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md)
  §20); every finding about a scene becomes a check in the scene workflow
  ([`SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §8 – §9).
* ⚠ Before the charts' step B is wired (the normal with its edges rounded — part of this work): D-H23 keys the calm's source on its normal, so a
  continuous normal runs its crossing search every frame — re-key the source or bound the search first
  ([`ORBIT_SURFACE_BUILD.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) §9,
  [`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20.12).
* Its handed findings (F17, the mouth's lip, the drop into a slot): [`RND8.md`](RND8.md).

## Dated entries
* **2026-11-16 – 11-17** — the specification and the offline packages on `1.0.146s-Orbit-surface-spec` (its own worktree, removed).
* **2026-11-22** — merged into `1.0.154-` with the charts; the orbit CLOSED; the best so far `3b7a479` (D-H23, D-H24 on `1.0.156-`).
* **2026-11-22 evening** — this row written (the surface work had none); the workfront `1.0.157-Orbit_surface`.
