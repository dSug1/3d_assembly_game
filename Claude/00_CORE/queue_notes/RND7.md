# RND7 — The orbit's surface: where the gizmo travels

> **STATUS** · 🔧 **S2 (the readout) BUILT AND GATED** (2026-11-22 night, the owner asleep; `ORBIT_SURFACE_READOUT.md` §13 – §14), ⭐ **DEPLOYED 2026-11-23** (LIVE main `ff41fc3` = `5d30edf5`); 🔧 **S3 (the mouth's hold restricted) BUILT AND GATED** 2026-11-23 (`d4b6c222`, `ORBIT_SURFACE_MOUTH_HOLD.md`), ⭐ **DEPLOYED 2026-11-23** (LIVE main `e80a7b0` = `1bc13f70`); 🔧 **S4 (P2 drives the gizmo) BUILT AND GATED** 2026-11-23 (`ORBIT_SURFACE_DRIVE.md`), ⭐ **DEPLOYED 2026-11-23** (LIVE main `86a0e53` = `664f9c53`); S4b (the stutter) ⭐ **DEPLOYED 2026-11-24** (LIVE main `6a2da88` = `bd5e69b4`) — the workfront: branch `1.0.158from1.0.157-Orbit_surface` (pushed), the
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
* **2026-11-23, later** — his *"I agree with your recommendations. Capture, proceed"*: the proxy and collision rules DECIDED (w 10 mm, every
  cylinder a hexagon face up, every cavity deeper than wide and every undercut capped, no fixed count of pieces); S6 packet 1 BUILT
  (`checkProxyFaces`: R7, R3, R4, R2; his three shapes clean reference parts; 9 mutants red); ⛔ a second correction of S5's record — the resting
  proxies are VIRTUAL by design (`ORBIT_SURFACE_PART_CHECKS.md` §12). Packets 2 (coverage, caps) and 3 (collision pieces) owed. Local.
* **2026-11-23, later** — his question *how are the part checks run, and linked with the automated building?* answered (by hand at the export
  gate and in `npm run verify`, never at play); his word *"capture what is missing for that loop … other loops to automatize the other checks as
  well"* → `SCENE_WORKFLOW.md` §11 (OWED: one command per scene, the build script calling it and stopping on a FAIL, a generator applying the
  rules; the construction, landing and headless loops). Then packet 2.
* **2026-11-23, night** — his word *"Continue building the orbit's surface pipeline without stopping and without asking me questions. Commit
  regularly, update the md files with the lessons learned"* (he went to bed). S6 packet 2 BUILT: `checkProxyCover` (`proxy_cover.ts`) — R1 the
  outer surface at the ρ-closing covered, R1b every cavity deeper than wide / undercut capped (amber information), R2 closed, a cap's rim flush;
  17 vectors, 15 mutants red; `Scene_2`: every proxy open (the plinth 58.6 % not covered), the pistons a resting face only, E02 / E13 / E14 cavities
  uncapped (ledger rows 17 – 18). Seven lessons of measuring (`PROXY_AND_COLLISION_RULES.md` §9.3). D7 answered by D8. Local.
* **2026-11-23, night (later)** — S6 packet 3 BUILT: `checkCollisionPieces` (`collision_cover.ts`) — C-R2 (a) the render inside its pieces within
  tau_c (strict), (b) no piece sticking out past tau_c (a ring's facet: its GEOMETRIC sagitta exempt), the resting candidates (decision 5);
  14 vectors (a tube's bore lined by six / three slabs; a slab pushed 5 mm), 10 of 11 mutants red (the 11th a pure speed shortcut); `Scene_2`:
  render outside pieces (E04 42 mm, pistons 29 mm), pieces sticking out (crank webs, piston skirts), 12 parts without a resting candidate
  (ledger 19 – 20). Six lessons (`PROXY_AND_COLLISION_RULES.md` §9.5). The S6 checks complete: packets 1 – 3. Local.
* **2026-11-23, night (later)** — the pipeline's first loop piece: THE ONE COMMAND `scripts/surface/check_scene.ts` (SCENE_WORKFLOW.md
  §9.3 – §11.2 item 1; on the proposal, his word owed — reversible): each check its own process, one verdict, exit 0 / 1 / 2; `SELF=1` its controls
  (red on a mutant); `Scene_2`: reach PASS, parts FAIL → FAIL. Local.
* **2026-11-23, night (later)** — R2's fidelity against the rho-closing (the audit's §7.1 row 4, owed since packet 1) BUILT: a failing face
  re-read with its samples skipped where the render is far and the closing lies under (`insideClosing`); the primitives moved to `voxels.ts`,
  `tri_geom.ts`. Local.
* **2026-11-23, night (later)** — C4's check (the ledger's row 10): the format admits only convex kinds (box, frustum, prism ± tips) and
  refuses the rest; its guard `tests/data_parts_convex.test.ts` (95 bodies in 5 scenes; a new kind fails it until proved convex). Local.
* **2026-11-23, night (later)** — the loop's items 2 and 4 (SCENE_WORKFLOW.md §11.2): `scene_gate.py` (a build script's call to the gate;
  not yet in `build_engine.py`) and the rules' constants as JSON for the Blender side (`rules_constants.json`, its staleness vector). Local.
* **2026-11-23, night (later)** — `ORBIT_SURFACE.md` §5.3's missing shapes added to the landing map's vectors (a round hole through and blind,
  a 12-sided cylinder, a dome, a thin bar, an oblique facet — against the brute force); M7 now 2 red; the brute's bound includes a corner's √2. Local.
* **2026-11-23, night (later)** — B3 / B5 STUDIED, not built (`ORBIT_SURFACE_PART_CHECKS.md` §14): the definitions proposed (the stage's held piece
  as held, its resting face against each exposed face, both turns; landable within the fit; B5's reasons), information until the playability
  brief exists; three questions for his word. Local.
* **2026-11-24** — his word *"do 1, 2 and 3 and 5 as you recommend. Scene 2 need a separate work in a separate worktree. Then finish the orbit's
  surface work"*: B3 / B5's three questions, the one command and the resting share ¼ DECIDED (`bd5e69b4`); `Scene_2`'s findings → `GM13` (its own
  worktree); S4b DEPLOYED (LIVE main `6a2da88` = `bd5e69b4`; his phone look owed: the alignment tap); the rest of the surface work planned → `ORBIT_SURFACE_BUILD.md` §10.
* **2026-11-24** — S7 BUILT: B3 + B5 (`src/core/landing_per_stage.ts`, `src/input/face_map_membership.ts`; the check
  `check_where_each_part_lands.ts`, the third in the one command, information); 10 vectors, 11 mutants red; `Scene_2` 77 s: four parts NO
  ORIENTATION, the plinth's top NO PLACE in the game (the face map skips a frozen part — ledger row 21, his word with GM13). Local.
* **2026-11-24** — S8 BUILT: B4's second half — does a part's way in start at a place? (a real facet of the stage's face map within 20° of
  its withdrawal, over its seat; PROPOSED reading, information); the way in shared with the reach check (its `Scene_2` report identical); V10,
  3 mutants red; `Scene_2`: ten ways in start at no place (E02 the frozen plinth, E06 after E05, the pistons and heads 4.6 mm short) —
  ledger row 22, rule C5 PROPOSED. Local.
* **2026-11-24** — S9 BUILT: B6's margins (a face the piece fits or is held out of by less than 2 mm; a facet within 0.05 of the face
  map's share — both PROPOSED, information); B3's samples start at each face's centroid; V11, V12, 5 mutants red; `Scene_2`: no face at the
  size margin, the TOP facet just above the share from stage 7 (ledger row 23); the landing check 134 s. Local.
* **2026-11-24** — S10 BUILT: C2, the landing map's cost per stage (`sumsSize`, `check_landing_cost.ts` — the fourth check in the one
  command; budget PROPOSED: no stage larger than `Scene_1`'s); `Scene_2` up to 3 203 × `Scene_1`'s half-spaces, a turn frame 318 – 694 ms
  on this PC at stages 13 – 16: P2 cannot drive `Scene_2` as drawn (ledger row 7; D9 PROPOSED; the ways for his word). Local.
* **2026-11-24** — S11 STUDIED, not built (`ORBIT_SURFACE_L1.md`): measured — no sealed or buried face in today's data scenes (that half of
  L1: `Scene_2` only); the caps between parts WOULD change `Scene_1` (R1b on its boxes: 4 places deeper than wide — not trusted until every
  body is in the set); the design (precomputed per placed set, behind `surfaceL1`); three questions for his word. Local.
* **2026-11-24** — S12 BUILT: `void_sim`'s nine families in the landing map's vectors (against the brute force; the map's M3, M5 turn 3
  each red; a 1 mm touching mutant and a coarse normal key stay green — boxes test no slanted contact); ties, defective input, every order and
  a rigid motion were S1's; the frames across a tilt or zone switch, the relocation at a seat, F17's bump handed to `RND8` (the orbit's). Local.
* **2026-11-24** — S13 BUILT and WIRED: B1's cheap subset re-verified when a `.glb` loads (`checkSolidsAtImport`, `checkSolids`' own
  code; `render/model_import.ts` after the boot is placed, ≈ 50 ms on the PC for `Scene_2`, a HUD warning — never a refusal); V2b, 3 mutants
  red; `Scene_2` none (its HUD unchanged). The packets S7 – S13 done (S11 a study for his word). Local.
* **2026-11-24** — S7 – S13 DEPLOYED on his word *"Deploy"*: LIVE main `19c7f88` = `16f3c845` (2026-11-24 10:48Z); in the game only S13's import warning.
  His questions answered: the landing map's cost is paid at every frame of a TURN and once per new direction, a plain frame ≈ 0.1 ms
  (`ORBIT_SURFACE_PART_CHECKS.md` §19); S11 in plain words (`ORBIT_SURFACE_L1.md` §7).
* **2026-11-24** — his *"S11: you can proceed as you recommend"*: Q1 with `GM13`, Q2 the caps measured with every body then a build behind
  `surfaceL1` on `Scene_1`, Q3 precomputed (`ORBIT_SURFACE_L1.md` §8). And *"The landing cost: i do not accept these costs. You need to find another
  solution"* — the study first (a query-time exact cast, no sums prepared), then S11.
* **2026-11-24** — S14 PROPOSED (`ORBIT_SURFACE_LANDING_CAST.md`): the landing map's cost rooted (every pair's obstacle built eagerly, every
  turn frame) and an engine that builds none (the near pairs cast exactly at query time — GJK's ray cast, a broad phase, a bound); the prototype
  (kit `fo3/surface/cast/`): 32 000 queries, 0 kinds or parts different, depths within 0.1 µm; `Scene_2`'s turn frame 698 → 0.2 ms. His word owed.
* **2026-11-24** — S11's measurement (the caps with every body; by an agent, `l1_data_scenes.ts` extended — frusta, prisms, turned bodies
  checked against the game's shapes) found a DEFECT in the R1b check: `Math.min(...values)` over a place's voxels overflowed the stack on
  `Scene_1`'s gap under the cube (~1.6e5 voxels) — fixed `ca4eeb0a` (`minOver`, V18 red first; verify 199 / 2484). Lesson: a check meant for a
  whole assembly never spreads an array into arguments. First reading (loose pieces wrongly in the set): the largest place is the 15.5 mm gap
  under the cube, a real hollow under Piece45's overhang; the measure rerun on the placed set only (FINISHED and START states).
* **2026-11-24** — S11's caps MEASURED with every body, two states (`ORBIT_SURFACE_L1.md` §9): `Scene_1`'s caps = the 15.5 mm gap under the
  cube (the authored bottom row's float; ≈ 500 000 mm², its slit ≈ 1 946 mm) + the hollow under Piece45's overhang (1 534 mm²); no goal slot; sealed /
  buried 0 everywhere. His word owed on the gap: the game caps it, the data lowers the cube, or no hollow by rule.
* **2026-11-24** — ⛔ CORRECTED on his word (*"the floor shall not count as a part … it is like a UI inside the game scene"* — repeated): the
  measure had kept the frozen floor; rerun without it (`ORBIT_SURFACE_L1.md` §9): `Scene_1` has ONE cap — the 13 mm tunnel behind Piece41's goal,
  open along the cube's underside and at its back; the gap under the cube and Piece45's overhang were the floor's doing; `Scene1_demo` none. The
  build designed (§10 there: a virtual filler glued to the walls, precomputed, `surfaceL1`).
* **2026-11-24** — S11 BUILT (`1d4cee3c`, behind `surfaceL1`, 0 = LIVE; `ORBIT_SURFACE_L1.md` §10.5): `Scene_1`'s one filler (the tunnel behind Piece41's goal, x 103.5 … 116.5, y 15.5 … 73.5, z −17.5 … 432.5 mm; walls Piece19 / 20 / 39, Piece41 a goal) written offline (`scripts/surface/l1_caps.ts`, accepted glued / flush / goal), its faces in the face map at 1 — the tunnel's walls gone, the underside one group, the contour unchanged; 22 vectors red first; G1 on his records and his look owed.
* **2026-11-24** — S11 GATED (`ORBIT_SURFACE_L1.md` §10.6): G1 bit for bit on his two `Scene_1` records at `surfaceL1` 0; at 1 identical too
  (the filler in the live map — the key's `#L1…` read — but his records never go under the cube). His look owed (under the cube, 0 and 1).
* **2026-11-24** — S14 BUILT (`defb1195`, behind `landingEngine`, 0 = LIVE; `ORBIT_SURFACE_LANDING_CAST.md` §9): P2 cast at query time (`src/core/landing_cast.ts`, GJK on the pairs' support mappings, the merge and the read shared) — at 1 no sum built (`heldSumsOn` never runs: a spy); 48 000 queries the sums' answers (`Scene_1` to 8.3e-16 m, `Scene_2` to 5.4e-8 m — where they differ, an exact check puts the cast the closer); `Scene_2` stage 16's turn frame 1 160 → 0.19 ms; one deviation (the facet's own plane at a hit: the prototype's stop read 1.8e-9 m off on `Scene_1`); S1 / S12 on both engines + 13 vectors, each red first. G1, k and his look owed; D9 kept.
* **2026-11-24** — his word *"make the white ring show what the gizmo uses"*: BUILT `cfc5e325` (`ORBIT_SURFACE_READOUT.md` §15) — where P2 drives the
  gizmo the ring and the HUD line are the driven gizmo's own point and the drive's landing; `mouthP2` unchanged. G1 and his look owed.
* **2026-11-24** — S14 and the ring GATED (`ORBIT_SURFACE_LANDING_CAST.md` §10): G1 bit for bit at the defaults on his two `Scene_1` records;
  `landingEngine` 1 within 3.6e-15 m; verify 2557 / 2557 on a quiet PC. The jitter's diagnosis committed (`APPROACH_CAMERA_JITTER.md`, `ab17666d`).
* **2026-11-25** — S14 and the ring DEPLOYED on his word *"deploy"* (LIVE main `6f03b65` = `c6a4ffa5`, 2026-11-25 02:12Z). His look owed: S14 at 1, the ring.
* **2026-11-25** — his camera jitters, packet 1 BUILT and GATED (`APPROACH_CAMERA_JITTER.md` §7.1 – §7.2; his word *"A1-a and A2-a as you recommend"*):
  A1-a `a3d7446d` (`pictureHandWhole`: the unlatch's hand-over holds the whole pose), A2-a `e591a9d2` (`pictureBandWayIn`: the band the way in's
  rule only), each 0 = LIVE frame for frame (G1 bit for bit on `09fv_r01`); at 1 the unlatch's jump gone on all 10 unlatches of `09fv_r01`, `r03`,
  `n2b8_r01` (0 mm, 0°), `09fv_r01`'s swing 10 – 14° → 0.6 – 4.1°, the turn after the lift under 1°, the way in unchanged; ⚠ 4 of 10 still over the 2° swing
  — measured: the follower PARKED on the camera's heading while latched (1.7 – 6.4° off its direction's; the study's A3 attribution contradicted),
  outside the packet, for his word. verify 2574. Not deployed; his look owed.
* **2026-11-25** — his camera jitters, packet 2a BUILT and GATED (`APPROACH_CAMERA_JITTER.md` §7.4 – §7.5; his *"proceed as you recommend"*, D-J4,
  D-J5): A3-p `caac1b3b` (`followParkOwn`: the follower parked in its own convention — the turntable's ψ turned by the owner's offsets at the parked
  elevation), D-J5 `b6cf50c1` (the way out's end read on the frame its turn ends, under `pictureHandWhole`); 0 = LIVE frame for frame (G1 bit for bit
  on the three records, the way in bit for bit); all three at 1: all 10 unlatches PASS (steps 0, view 0.00°, swing 0.00°, lift ≤ 0.57°). A3-a not
  built: refuted as stated (the asked step at the tilt-off never comes back); a residual of 0.86° of elevation at `n2b8_r01` f3380 recorded for the
  lead. verify 2588. Not deployed; his look owed.
* **2026-11-25** — his camera jitters, packet 2b BUILT and GATED (`APPROACH_CAMERA_JITTER.md` §7.6 – §7.7; his *"proceed as you recommend"*, §4.4
  B-a, §4.5 C-a): B-a `307338dd` (+ `e4c096a6`, comment) (`framedLineGlass`: the carried up's framed line decided on the glass — the view's within 5 mm,
  the line through both from 15 mm, measured first: far ≥ 77.8 mm, mid ≥ 19.9 mm, B's floor jumps 0.5 – 7.9 mm), C-a `020b139b` (`gizmoLagTravel`:
  the approach's share of the base's lag taken out of the ring's); each 0 = LIVE frame for frame (G1 bit for bit). At 1: family B at the floor 0
  frames over 1° / 30 mm (today up to 11.1°), the ring still on `n2b8_r04` (today 39.7 mm); all five at 1 family A bit for bit with 2a but the ring's
  lag, the way in and his far hand bit for bit. verify 2601. Not deployed; his look owed; the port next.
* **2026-11-25** — S14's look given (the iPhone, `Scene_1`: no difference, 59 fps at 0 and 1); on his *"do what is best for game playability"*: `landingEngine` **1 by default**
  (`dfb158a8`, verify 2601; 0 = the sums), D9 WITHDRAWN (`PART_AUTHORING.md`). Not deployed yet.
