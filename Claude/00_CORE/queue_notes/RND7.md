# RND7 — The orbit's surface: where the gizmo travels

> **STATUS** · 🔧 **S2 (the readout) BUILT AND GATED** (2026-11-22 night, the owner asleep; `ORBIT_SURFACE_READOUT.md` §13 – §14), ⭐ **DEPLOYED 2026-11-23** (LIVE main `ff41fc3` = `5d30edf5`); 🔧 **S3 (the mouth's hold restricted) BUILT AND GATED** 2026-11-23 (`d4b6c222`, `ORBIT_SURFACE_MOUTH_HOLD.md`), ⭐ **DEPLOYED 2026-11-23** (LIVE main `e80a7b0` = `1bc13f70`); 🔧 **S4 (P2 drives the gizmo) BUILT AND GATED** 2026-11-23 (`ORBIT_SURFACE_DRIVE.md`), ⭐ **DEPLOYED 2026-11-23** (LIVE main `86a0e53` = `664f9c53`) — the workfront: branch `1.0.158from1.0.157-Orbit_surface` (pushed), the
> worktree `../orbit_surface`. Built OFFLINE before the merge (2026-11-17): S0 (the entry sets on `Scene_2`'s real collision pieces) and S1 (the landing map,
> `src/core/landing_map.ts` — NOT wired: nothing calls it). Nothing else built.
> **NEXT** · ✅ his look 2026-11-23: *"the overall feel is ok"*; the alignment tap: *"a small stutter on the green contour but nothing alarming"* — then the build list continues (his *"continue"*); his look on S4 (deployed) given — the build list's item 4, P2 DRIVING the gizmo, BUILT: `ORBIT_SURFACE_DRIVE.md` (his word 2026-11-23 *"Do as per your recommendation"*: `mouthHoldDomain` stays 2,
> item 4 next — S3's finding, `ORBIT_SURFACE_MOUTH_HOLD.md` §7); his look on the readout and S3 (deployed) owed; then item 3 (the Blender checks). ✅ The side facets: AS HELD (his word). Before: the READOUT designed for his look, then
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
* **2026-11-23, later** — his word *"Deploy"*: the branch pushed at `1bc13f70`, merged into main with no working tree touched (main's tree = the
  branch's): LIVE main `e80a7b0` = `1bc13f70` — S2 and S3 live; his look owed, and his word on S3's finding (`ORBIT_SURFACE_MOUTH_HOLD.md` §7).
* **2026-11-23, later** — his word *"Do as per your recommendation"* on S3's finding: `mouthHoldDomain` stays 2; the build list's item 4 (P2
  driving the gizmo, the footprint support re-expressed on it) is designed and built next.
* **2026-11-23, later** — S4 built (`54e37d03`), audited (two defects: queries between frames read undriven and cached; `F` read on faces the piece is
  not over), fixed (`19fa42bf`); G1 identical at 0 on his four records; his front record at 2: the gizmo moved on the top round `Piece44` only
  (+73.25 mm), the camera ≤ 2.9 mm (F17); the support never active in his records (the contact-range gate: vector V3). Local, not deployed.
* **2026-11-23, later** — his word *"Deploy"*: the branch pushed at `664f9c53`, merged into main with no working tree touched (main's tree = the
  branch's): LIVE main `86a0e53` = `664f9c53` — S4 live (`landingDrives` 2; 0 = `e80a7b0`); his look owed (the phone's turn cost too).
* **2026-11-23, later** — his look 2026-11-23: *"the overall feel is ok"*; the alignment tap: *"a small stutter on the green contour but nothing alarming"*; *"Commit, continue"* (`ORBIT_SURFACE_DRIVE.md` §11: the stutter is L2's).
* **2026-11-23, later** — S4b (`9b028396`, `ORBIT_SURFACE_DRIVE.md` §12): the alignment's stutter at its root — the placed parts' hulls prepared once
  per placed set, one preparation shared by the readout and the drive: a turn frame's sums 2.90 → 0.70 ms on this PC; G1 identical at 0, his `Scene_1`
  records at 2 identical to the fix round's. Local. Next on the build list: item 3, the Blender checks — their scope asked of him.
* **2026-11-23, later** — his word *"Game side first"* on item 3 (the Blender build scripts are not in this repository), then *"the plinth in scene 2 … the
  proxy face is not complete. Make sure the same is detected"*: S5 designed (`ORBIT_SURFACE_PART_CHECKS.md`); B1 built (`part_checks.ts`, 5 s on
  `Scene_2`): ⭐ the plinth's incomplete proxy DETECTED (B1h: its four corners cut, a hole), 20 more findings (proxies off their collision pieces up to
  42 mm, E17's half turned inward) — the ledger's rows 14, 15, his word. B2 next.
* **2026-11-23, later** — his *"Capture those lessons … the plinth: the proxy is not a closed mesh but a quad: check that. Then continue the build"*:
  CHECKED — the plinth's proxy is ONE open face (its top); no `Scene_2` proxy is closed (a selection of faces by convention). Lessons → D4 – D7
  (`PART_AUTHORING.md` §6.4, §4.2), `SCENE_WORKFLOW.md` §7.3, §9.1, the ledger 14 – 16; `check_part_solids.ts`. B2 + B1i built (5 s): the plinth's
  sides uncovered (71.8 %) — but D7 read literally flags every part: his word on the rule (`ORBIT_SURFACE_PART_CHECKS.md` §10). Local.
* **2026-11-23, later** — ⛔ his question *"why your previous check failed to identify this issue and I had to tell you?"*: answered and the
  record CORRECTED (`ORBIT_SURFACE_PART_CHECKS.md` §11) — B1 tested one direction only (no rule said which faces a proxy covers), and the first
  coverage check, flagging all parts, was narrowed until it found the plinth's corners, reported as his issue; it was not (the sides). His word:
  no rebuild of `Scene_2` here; the lessons captured; the RULES for proxies (simplified — the gizmo's moves) and maybe the collision pieces
  defined first, then the proper checks.
