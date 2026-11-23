# RND7 — The orbit's surface: where the gizmo travels

> **STATUS** · 🔧 **S2 (the readout) BUILT AND GATED** (2026-11-22 night, the owner asleep; `ORBIT_SURFACE_READOUT.md` §13 – §14), ⭐ **DEPLOYED 2026-11-23** (LIVE main `ff41fc3` = `5d30edf5`); 🔧 **S3 (the mouth's hold restricted) BUILT AND GATED** 2026-11-23 (`d4b6c222`, `ORBIT_SURFACE_MOUTH_HOLD.md`) — the workfront: branch `1.0.158from1.0.157-Orbit_surface` (pushed), the
> worktree `../orbit_surface`. Built OFFLINE before the merge (2026-11-17): S0 (the entry sets on `Scene_2`'s real collision pieces) and S1 (the landing map,
> `src/core/landing_map.ts` — NOT wired: nothing calls it). Nothing else built.
> **NEXT** · his look (the readout deployed; S3 local) and his word on S3's finding (`ORBIT_SURFACE_MOUTH_HOLD.md` §7: keep `mouthHoldDomain` 2 and
> build item 4 next — recommended — or 1 until item 4); then the build list's item 4 (P2 driving) or 3 (the Blender checks). ✅ The side facets: AS HELD (his word). Before: the READOUT designed for his look, then
> built. ✅ §8's end asked again 2026-11-22, all four answered (`ORBIT_SURFACE_BUILD.md` §2bis).
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
* ⛔ Every lesson of this work → a RULE of construction or drawing written for a script, then its check, then its ledger row (the owner, 2026-11-22:
  [`SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §10, §9; [`PART_AUTHORING.md`](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) §6.4).

## Dated entries
* **2026-11-16 – 11-17** — the specification and the offline packages on `1.0.146s-Orbit-surface-spec` (its own worktree, removed).
* **2026-11-22** — merged into `1.0.154-` with the charts; the orbit CLOSED; the best so far `3b7a479` (D-H23, D-H24 on `1.0.156-`).
* **2026-11-22 evening** — this row written (the surface work had none); the workfront `1.0.157-Orbit_surface`.
* **2026-11-22 evening, later** — `1.0.157-Orbit_surface` pushed; the work moved to the worktree `../orbit_surface` (`1.0.158from1.0.157-Orbit_surface`). The owed
  questions asked again, his four answers: the catalogue's grid and §5.2's two words ACCEPTED (to be tested); NARROW / BESIDE decided with B4; the readout with
  no grid, timed on the HUD; `Scene_2`'s two questions later, with `Scene_2` → `ORBIT_SURFACE_BUILD.md` §2bis. Next: the readout's design.
  His rule: every lesson of this work a RULE of construction or drawing for a script (`SCENE_WORKFLOW.md` §10, `PART_AUTHORING.md` §6.4), seeded C1 – C3, D1 – D3.
  The readout DESIGNED (S2, nothing built) → [`ORBIT_SURFACE_READOUT.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_READOUT.md); its build waits for his look.
  His word *"proceed"*: the design's three choices as proposed — the build starts (packets §12 there).
* **2026-11-22 night (the owner asleep: *"proceed with the build without asking me questions … record [decisions] in the md files. Commit regularly"*)** — S2 BUILT
  (P1 `dfeb7ef9`, P2 `fafbde6b`, P2b `d21a4826` Scene_1 only; decisions D1 – D6 in `ORBIT_SURFACE_READOUT.md` §13.4), an independent audit (one defect: the
  resting centre missing from the cache key; the tilted path unvectored; the per-facet entry keyed on its normal) fixed in `e91d3e82`; verify 2346. GATED
  (§14): G1 bit for bit on his four records at 1 and 0; G2 offline 2.5 – 6.6 ms a preparation, 2 – 4 a record; G3 met on the top (+41.3 mm round
  `Piece44`, +73.3 mm over the recess beside it), ONE FINDING on the side facets (P2 as held stands half the piece out until he aligns) — his word owed.
  Lessons → rules: C4 (a data part is convex). Nothing pushed or deployed.
* **2026-11-23** — his word *"deploy"*: the branch pushed at `5d30edf5`, merged into main with no working tree touched (main's tree = the branch's): LIVE main `ff41fc3` = `5d30edf5`.
  His look and his word on the side facets owed.
* **2026-11-23, later** — his word *"Keep as held. Continue build"*: the side facets AS HELD (its golden vector, `ORBIT_SURFACE_READOUT.md` §14); the build
  list's item 2, S3 — the mouth's hold restricted (Q4 (a): never on a cap, only over a void P2 leaves open for the held piece) — designed and built
  (`d4b6c222`; `mouthHoldDomain`, default 2; 0 = `3b7a479`); measured first: his four records never meet the hold; `Scene_1`'s scan: no cap mouth,
  H2 removes the hold at the 10 mm bottom slots and within half a piece of the top channel's walls (there the top's depth, not yet P2's, brings back
  the drop at the tilt: ledger row 11, his word); G1 IDENTICAL to `3b7a479` at the defaults; an independent audit: no defect (its nits fixed). Local.
