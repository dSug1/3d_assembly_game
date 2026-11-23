# THE ORBIT'S SURFACE — THE BUILD, STARTED IN PARALLEL (2026-11-17)

> ⭐⭐⭐ **2026-11-22:** §4's merges DONE (the charts and this branch merged into `1.0.154-`, `1.0.146b-` too); the orbit charts and the camera follower
> CLOSED (his word; LIVE `3b7a479`, the best so far); the surface work starts on `1.0.157-Orbit_surface` — S0 and S1 built offline, the landing map NOT wired yet.
> ⭐⭐⭐ **2026-11-22 evening — THE OWED QUESTIONS ASKED, ALL FOUR ANSWERED (§2bis).** The work moves to the worktree `../orbit_surface`, branch
> `1.0.158from1.0.157-Orbit_surface`. Next: the READOUT (the specification's §6, item 1), its design written for his look before it is built.

> **STATUS** · ⭐ **S0 and S1 LAUNCHED 2026-11-17** (Opus agents, a builder then an independent auditor each; local commits; **nothing wired, no existing
> game file changed**). **OWNS** · the record of the surface build: the owner's words, the parallel rule, the merge order, each package as briefed and
> as built, the notes for the merges, ⭐ the ledger FINDINGS → CHECKS (§8). **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) (the specification — its decisions are PROVISIONAL, to be
> tested), [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) (the shapes study), [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md).

## 1. The owner's words (2026-11-17), and what they amend

**He asked:** *"In parallel, can we start working on the orbit's surface in the other worktree, keeping in mind that all three worktrees will have to
merge at different times into the 3d_assembly_game worktree?"* It amends his sentence of 2026-11-16 (`ORBIT_SURFACE.md` §0, end: no rebuild work on
the surface before `orbit_charts` is merged).

**The answer given to him:** yes for the OFFLINE part, under the rule of §3; everything wired waits for the merge; three questions the specification
kept for this moment were asked again (§2). **His reply:** *"Agree on all three. Proceed with the"* — the message ends there; it is read as: proceed
with what was proposed to him (this record, then the landing map launched as an Opus builder followed by an Opus auditor).

## 2. The three answers (*"Agree on all three."*)

| # | the question (`ORBIT_SURFACE.md` §8, end) | the recommendation he agreed with |
|---|---|---|
| 1 | The six layers L0 – L5 (§5.1) were still only proposed: accepted? | **ACCEPTED — to be tested**, like the other decisions. Still owed: his word on the catalogue's grid (§3.0) and on §5.2's two words ("nothing to land on", "approached") |
| 2 | A goal's way in: is *"a free direction into the seat exists"* enough, or must the check also prove that the player can bring the piece to where that slide starts? | **The first test is enough for now**; the second once the landing map exists (it needs B3 and B5) |
| 3 | The entry-set check was run on boxes only: run it on `Scene_2`'s real collision pieces before the first surface build? | **Yes** — package S0, before S1 |

## 2bis. The four answers of 2026-11-22 (the surface work starts)

Asked again: `ORBIT_SURFACE.md` §8 (its end) and the handover's *words still owed*, kept for this moment. He took each recommendation.

| # | the question | his answer |
|---|---|---|
| 1 | The catalogue's grid (`ORBIT_SURFACE.md` §3.0) and §5.2's two words: *nothing to land on* (no contact along the facet's direction — the gizmo on the facet's plane, marked), *approached* (reached only by A + dy or a plunge) | **ACCEPTED — to be tested**, all three |
| 2 | The reach check's thresholds NARROW (under 10°) and BESIDE (10 mm): decided now, or with B4? | **With B4.** Until then they stay the check's own provisional values: a warning, never a failure (§8 rows 2, 5) |
| 3 | The readout's representation (`ORBIT_SURFACE_LANDING_MAP.md` §10.9: no grid, or the 4 mm grid as built) | **No grid, timed on the HUD**: the readout evaluates exactly at each query and prints its preparation and per-frame cost, so his first look on the phone is the measurement §10.9 asked for; the grid serves the vectors and the offline comparison |
| 4 | `Scene_2`'s two questions: the ghosts and markers against the collision pieces (2 – 17 mm); the frozen plinth in the pick-up flow | **Later, with `Scene_2`**: before the plunge is built, or when `Scene_2` next runs with the charts (§8 rows 3, 6) |

## 3. The parallel rule — what keeps the merges clean

* **Measured 2026-11-17:** this branch (`1.0.146s-Orbit-surface-spec`, from `1190db2`) and the charts' branch (`1.0.147-`) touch NO file in common, and
  a trial merge of the two (`git merge-tree`) is clean. This branch so far: its three documents, `scripts/probes/surface_study/` (new), and two
  workflow documents edited (`SCENE_WORKFLOW.md`, `PART_AUTHORING.md`).
* ⛔ **THE RULE: until `orbit_charts` is merged into `3d_assembly_game`, this branch ADDS NEW FILES ONLY.** ✅ **LIFTED 2026-11-22** (the merges
  done, §4): the wiring may now edit existing files — on the terms of §9. It edits no existing file but its own
  documents (`ORBIT_SURFACE*.md`). Where a test demands a one-line registration in an existing file, that line is the only exception, and it is
  listed in §6.
* ⭐ **One exception, asked by the owner (2026-11-17)**: the check *can every part reach its seat?* kept as a permanent script and written into
  the scene workflow — `SCENE_WORKFLOW.md` and `PART_AUTHORING.md` edited (§6, §7). Measured before the edit: the charts' branch has changed
  neither file since the fork.
* **The PC carries one heavy job at a time** and the charts' chain is running its headless gates: here no headless run, no dev server, no Blender
  run; single-process offline scripts (`npx vite-node`, under 3 minutes) and single test files; `npm run verify` once per package.
* **What waits for the merge** (each edits files the charts' work is changing): the READOUT beside today's depth on `Scene_1`; the mouth's hold
  restricted (Q4); the landing map driving the gizmo; the footprint support re-expressed on it; the queue rows for the findings handed over (F17,
  the mouth's lip, the drop in contact range). **Not launched now:** the Blender checks B1, B2, B4 (§7bis of the specification) — to be written
  and RUN together, when a Blender run does not compete with the chain.
* **So the parallel work saves the offline part only**: the first thing the owner can see on the phone (the readout) still comes after the merge.

## 4. The order of the merges

1. `orbit_charts` (`1.0.147-`) into `3d_assembly_game` (`1.0.145-`) — after its build chain, the owner's look and its step 3.
2. This branch brought onto that merged code (that code merged INTO this branch), the wiring built here on it, then this branch into
   `3d_assembly_game`.
3. `1.0.146b-GL-context-recovery` (the dossier RND6) last — today it changes the queue file, its dossier and its own probes.

The throwaway `1.0.146t-Orbit-charts-test-scenes` is never merged.

## 5. The packages as briefed

**S0 — the entry-set check on `Scene_2`'s real collision pieces** (a study with measurements; no game code). For every part of `Scene_2`, at the
stage of the assembly plan where it is placed: the ENTRY SET of its goal (`ORBIT_SURFACE.md` §2.5 — the directions along which the part, withdrawn
from its seated pose, touches no placed part), computed on the `UCX_` pieces read from the `.glb`, not on boxes: its share of the sphere, its narrowest
opening, EMPTY or NARROW flagged; compared with what the assembly plan and the authored ghosts say; what the check cannot see, said. One offline
script beside the study's, one document.

**S1 — the landing map, layer L2 (P2), as a pure function — NOT wired** (`ORBIT_SURFACE.md` §2.2 P2, §5.1, §5.3; the first item of §6's build
list). Per facet direction: the layered depth of the placed parts, and the first contact of the HELD PIECE as held, moved along the facet's normal —
exact from the convex collision pieces, one operation for voids and protrusions, "nothing to land on" a stated value, read from outside or from a
given depth. Its vectors against a second implementation (the study's brute-force reading) on the study's shapes, for two pieces; the same after a
shape is moved and turned, and for every order of its parts; each vector shown red on a mutant. Its cost measured (the time to build a map for a set
like `Scene_1`'s), as a figure for the wiring step. A new file under `src`, a new test file, new helpers; nothing calls it yet.

**S2 — the READOUT** (designed 2026-11-22; his word *"proceed"*: BUILT and GATED the same night — §7) → [ORBIT_SURFACE_READOUT.md](ORBIT_SURFACE_READOUT.md): the landing map at the
gizmo's place every frame, exact (no grid), beside today's depth on `Scene_1` — a second ring and a HUD line with its cost; driving nothing; behind
`landingReadout` (0 = `3b7a479` frame for frame).

**S3 — THE MOUTH'S HOLD RESTRICTED** (the build list's item 2, his Q4 (a); designed and built 2026-11-23 on his *"Continue build"*) → [ORBIT_SURFACE_MOUTH_HOLD.md](ORBIT_SURFACE_MOUTH_HOLD.md):
never on a cap (H1), only over a void P2 leaves open for the held piece (H2); behind `mouthHoldDomain` (0 = `3b7a479`'s hold).

**S5 — THE PARTS' CHECKS, THE GAME'S SIDE** (the build list's item 3; his *"Game side first"*, 2026-11-23) → [ORBIT_SURFACE_PART_CHECKS.md](ORBIT_SURFACE_PART_CHECKS.md):
B1 the solids (convex, closed, volume, budget; the proxy on its solids, outward, ⭐ COMPLETE — the plinth, his word) and B2 exposed per stage, pure
functions in `src/core`, vectors on `Scene_2`'s `.glb`; the Blender side waits for the build scripts. ⭐ Next, on his word (2026-11-23): the
UNIVERSAL proxy and collision rules first — [`PROXY_AND_COLLISION_RULES.md`](../../30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md) (a study) —
then the checks built both ways; `Scene_2` not rebuilt in this worktree.

**S4 — P2 DRIVES THE GIZMO** (the build list's item 4; designed 2026-11-23 on his *"Do as per your recommendation"*) → [ORBIT_SURFACE_DRIVE.md](ORBIT_SURFACE_DRIVE.md):
the gizmo's depth P2's, read from where the piece is (⑤: far = from outside, close in a proud part a wall), at its level LESS the piece's reach (the
gizmo marks the contact — the correction of S2's side-facet consequence); the footprint support re-expressed on the same reading; behind `landingDrives`
(0 = as deployed, `e80a7b0`).

## 6. Notes for the merges (filled by the packages)

* **S1 — the one registration line** (the only existing file this branch's code touches): `tests/unwired_debt.test.ts` gains ONE line in `PENDING`,
  `buildLandingMap` (an export nothing calls yet — that test demands it). At the merge: keep it; when the map is wired (the readout), DELETE it — the
  test then fails until it is gone. ⚠ If the charts' branch edited the same list, the merge may conflict on that line only.
* **S1 — the grid's step**: `LANDING_STEP_MM` (4 mm) lives in `src/core/landing_map.ts` for now; its home becomes `src/core/units.ts` when the map is
  wired (one constant, one place).
* **S1 — a copy of the study for the tests**: `tests/helpers/surface_shapes.ts` copies the study's shapes and its brute-force reading
  (`scripts/probes/surface_study/`) — a test does not import from `scripts/`. `scripts/surface/landing_compare.ts` checks the copy against the study
  bit for bit: rerun it if either changes.
* **The reach check — its three files RENAMED** (`scripts/surface/`, the owner 2026-11-17): `scene2_entries.ts` →
  `check_parts_reach_their_seat.ts`, `entry_geom.ts` → `check_parts_reach_their_seat_geom.ts`, `entry_selfcheck.ts` →
  `check_parts_reach_their_seat_selfcheck.ts`. They import the study's sphere size and shapes from `scripts/probes/surface_study/`: that folder
  stays with them.
* **The reach check — two workflow documents EDITED** (the owner's request, §3): `Claude/20_GAME_RULES/spec/SCENE_WORKFLOW.md` (§8 new; one
  line each in its status, §1's W4 row, §2.3 rule 2, §6.3 item 5, §7's note) and `Claude/30_OBJECTS_3D/spec/PART_AUTHORING.md` (§4.4 item 8,
  §6's note). Both were already edited on this branch (2026-11-16, the playability amendments); the charts' branch touches neither (measured
  2026-11-17). At a merge where another branch edited them: keep both sides.

## 7. As built (filled by the packages)

* **S0 — MEASURED 2026-11-17** (the builder; ✅ audited: PASS) → [ORBIT_SURFACE_SCENE2_ENTRIES.md](ORBIT_SURFACE_SCENE2_ENTRIES.md).
  Files ADDED only: `scripts/surface/scene2_entries.ts` (the run; ⭐ renamed since with the two below — §6), `entry_geom.ts` (exact: a ray against each pair's Minkowski difference, the
  game's contact rule and skin), `entry_selfcheck.ts` (14 known answers, the study's own L05 / L03 / Q07 / L19 among them), and that document.
  **The result: no goal of `Scene_2` is shut; the plan's way in is free for all sixteen; the six pistons are NARROW (1.9° – 2.7° round their bore,
  as the plan's ONE axis); the ghosts differ from the collision pieces by each part's seat marker's offset from its `UCX_` pieces, to 0.1 mm (pistons
  10 mm, heads 17 mm, crankshaft 2 mm) — a question for the owner.** Nothing wired, no game file changed, no registration line needed (§6 unchanged).
* **S1 — THE DESIGN, written before the code** (2026-11-17, the builder) → [ORBIT_SURFACE_LANDING_MAP.md](ORBIT_SURFACE_LANDING_MAP.md): the
  signature, the units and frames, the algorithm (the union of the convex pairs' Minkowski sums as half-spaces, cast along the normal) and why it is
  exact, the tie key, "nothing to land on" a kind with no depth, the lookup and its error.
* **S1 — BUILT 2026-11-17, NOT WIRED** (the builder; ✅ audited: PASS) → [ORBIT_SURFACE_LANDING_MAP.md](ORBIT_SURFACE_LANDING_MAP.md)
  §10. Files ADDED: `src/core/landing_map.ts`, `tests/landing_map.test.ts` (24 vectors, each red on one of 10 mutants), `tests/helpers/surface_shapes.ts`,
  `scripts/surface/landing_compare.ts`, `scripts/surface/landing_cost.ts`; one line in `tests/unwired_debt.test.ts` (§6). `npm run verify`: 163 files,
  2082 tests green (the base, `833c981`: 162 / 2058, green).
  **The comparison with the study's brute force: 1 895 812 places (the library's travels and maps, the 1596-cell sweep), 0 disagreements** — the
  only differences, 20 292 places on slopes, are the brute force's own footprint shrink (1e-4 mm × the slope, at most 5.67e-4 mm). The lookup between
  samples: never lower than the exact value at 33 573 places; higher at 607 (a step within one cell).
  ⚠ **THE COST IS OVER THE BRIEF'S 50 ms LINE**: on `Scene_1`'s 36 placed boxes at 4 mm, one direction takes 36 – 270 ms on this PC by its load (±x, ±y over the line in every run; ±z the
  fastest), the 12 maps (2 pieces × 6 directions) hold 110 MB; a lookup 2.4 µs, an exact evaluation 4.3 – 4.8 µs. Not redesigned: the options,
  measured — no grid (the sums prepared in 7.6 ms a direction, then the exact evaluation at each query); 8 mm (54 – 66 ms) or 16 mm (17 – 20 ms); a
  100 mm tile round the gizmo (13 – 16 ms); the build spread over frames. **The wiring step chooses** (§10.4 there). Nothing measured speaks against
  P2's guarantees.
* **THE AUDITS — both PASS, no blocker (2026-11-17, independent Opus auditors)** → `ORBIT_SURFACE_SCENE2_ENTRIES.md` §8,
  `ORBIT_SURFACE_LANDING_MAP.md` §10.8. Each reran its package and wrote a check of its own (S0: a brute force apart, the same shares sample for
  sample; S1: a first contact on the game's GJK with TURNED held pieces, 61 places of 61). The parallel rule kept: from `f5f5cd3` to `2552f62` the
  diff is additions, this branch's documents, and the one line of §6. Their remarks are written into the two documents (the cost's range corrected
  to 36 – 270 ms by the PC's load).
* **THE REVIEW (Fable, 2026-11-17) — what goes to the owner, what is proposed:** (1) `Scene_2`: no goal shut; the pistons need the ghost and the
  PLUNGE, as authored. (2) The ghosts and markers against the collision pieces (10, 17, 2 mm), two pistons 1.4 mm off their pin: NOT a blocker for
  the surface; settled by one measurement against the drawn meshes (B1, or offline from the `.glb`) BEFORE the plunge is built. (3) The thresholds
  NARROW (10°) and BESIDE (10 mm): his word owed with B4. (4) The map's representation: PROPOSED no grid, the exact evaluation at each query
  (`ORBIT_SURFACE_LANDING_MAP.md` §10.9) — one phone measurement first, at the wiring step. (5) ⚠ Read in the code, not in the game: the orbited
  piece's collision exempts every FROZEN body (the owner's choice of 2026-10-13, for the floor); `Scene_2`'s plinth is frozen — to check in the
  pick-up flow whether a held part passes through it.
* ⚠ **A leftover of the OTHER chain, found when this one ended**: a headless browser of the charts' gates (its profile
  `replay_probe_profile_B1_s0_28168`, started 14:26, the processes that owned it dead) stayed 82 minutes and used 18 700 s of processor time —
  about four cores on average: the TIMES measured by both builders above were taken beside it. Stopped at 15:50, its profile folder removed; the
  charts' own running gate untouched.
* ⭐ **THE REACH CHECK MADE PERMANENT, FOR ANY SCENE (Fable, 2026-11-17, the owner's request)** → `SCENE_WORKFLOW.md` §8. S0's script, renamed
  `check_parts_reach_their_seat.ts` (§6), takes any scene's `.glb`: the order from each part's `step`, the frozen parts pre-placed, each part's
  way in from its seat pair or from the plunge ghost authored for it (no hand-written list; a plan file optional), a VERDICT with an exit code,
  a control per part (pushed past its seat: BLOCKED). **Measured:** on `Scene_2` with no plan file, all 16 rows identical to S0's audited run in
  every figure, the cross-checks and self-checks identical; PASS, 0 failures, 19 warnings, controls 16 of 16, 52 s. The planted failure (a plan
  file placing the head E13 before its bank's pistons): FAIL, exit 1 — E07, E08, E09 SHUT, blocked by E13; the other bank still passes.
  The three files typecheck clean (the project's settings; the only errors reported are two older ones in the study's own
  `scripts/probes/surface_study/shapes.ts`, which they import). ⚠ Built and checked by Fable alone, no second agent's audit; scripts are
  outside `npm run verify`.
* ⭐ **S2 — BUILT 2026-11-22 (P1 `dfeb7ef9`, P2 `fafbde6b`, P2b `d21a4826` — on `Scene_1` only), the gates G1 – G3 OWED** → [ORBIT_SURFACE_READOUT.md](ORBIT_SURFACE_READOUT.md) §13.
* ⭐ **S4 — BUILT AND GATED 2026-11-23 (`54e37d03`, fix round 1 `19fa42bf`)** → [ORBIT_SURFACE_DRIVE.md](ORBIT_SURFACE_DRIVE.md) §9bis – §10: P2 drives the gizmo
  (its level less the piece's reach) and the support, read from where the piece is on the face it is over; G1 identical at 0; his front record: the
  gizmo moved on the top round `Piece44` only (+73.25 mm), the camera ≤ 2.9 mm (F17); the support never active in his records. ⭐ DEPLOYED 2026-11-23 (LIVE main `86a0e53` = `664f9c53`); his look owed.
* ⭐ **S3 — BUILT 2026-11-23 (`d4b6c222`)** → [ORBIT_SURFACE_MOUTH_HOLD.md](ORBIT_SURFACE_MOUTH_HOLD.md) §7, §10: his four records never meet the hold (nothing he played changes); `Scene_1`'s scan: no cap
  mouth; H2 removes the hold at the 10 mm bottom slots (the piece never enters) and within half a piece of the top channel's walls — there the top's
  depth (not yet P2's) brings back the drop at the tilt: §8 row 11, his word. ⭐ DEPLOYED 2026-11-23 (LIVE main `e80a7b0` = `1bc13f70`); his look owed.
* ⭐ **S2 — AUDITED, FIXED (`e91d3e82`), GATED 2026-11-22 night** → [ORBIT_SURFACE_READOUT.md](ORBIT_SURFACE_READOUT.md) §13.7, §14: G1 bit for bit on his four
  records at 1 and 0; G2 offline 2.5 – 6.6 ms a preparation, 2 – 4 preparations a record, ~3 µs a frame; G3 met on the top, ONE FINDING on the side
  facets (P2 as held: half a piece out until the player aligns — his word, §8 row 9). ⭐ DEPLOYED 2026-11-23 (LIVE main `ff41fc3` = `5d30edf5`); his look owed.

## 8. ⛔ FINDINGS → RULES → CHECKS: THE LEDGER (the owner's rules, 2026-11-17 and 2026-11-22)

> *"capture in the md files that any findings we learn from the orbit's surface rebuild needs its check to be integrated in a check script to be
> run as part of the scene workflow. check_parts_reach_their_seat was the check script for the orbit chart to make sure each part reaches its
> seat. we can develop a check script to checks all the findings we will learn from the orbit's surface or use the same script and extend its
> scope."* — the owner, 2026-11-17.

**The rule in full:** [SCENE_WORKFLOW.md](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §9 — every finding about a SCENE gets a check in a
check script, run at the scene workflow's export gate, shown failing once, in the same change as the finding's record, and a row here.
⛔ **It binds every package's brief from now on**: each brief ends with *"what did this teach about how a scene must be drawn, ordered or
marked? → its check, its control, its row in §8"*; a builder with nothing to add says so.
⭐⭐ **WIDENED 2026-11-22 (the owner)** — *"also, make sure that you capture in the md files that any lesson learned in this orbit's surface work is captured for the scene construction workflow or the blender drawing workflow, so that later on I can automate the construction of the scene and the drawing of the parts in blender with rules which have incorporated those lessons learned."* → every lesson first a RULE of construction or drawing
(`SCENE_WORKFLOW.md` §10: the form a script applies; the registers §10.3 and `PART_AUTHORING.md` §6.4), then its check; the column *its rule* below. One script or several: open
(`SCENE_WORKFLOW.md` §9.3).

| # | the finding (where it was learned) | what a scene must satisfy | its rule (`SCENE_WORKFLOW.md` §10) | its check | status |
|---|---|---|---|---|---|
| 1 | A part placed after what closes its seat cannot be placed (S0; the plan's rule 2 — `Scene_2`'s first plan slid the pistons in sideways) | at its stage every goal has a free straight way in, and the way in the scene names is free | **C1** (construction) | `scripts/surface/check_parts_reach_their_seat.ts` — FAIL: SHUT, way in BLOCKED | ✅ built, shown failing (a head before its pistons) |
| 2 | A goal entered along ONE axis needs the ghost and the plunge (S0, finding 2: the six pistons, 1.9° – 2.7°) | every narrow goal has a ghost with a plunge at its opening | **D1** (drawing) | the same — WARN: NARROW, and says when no ghost is authored | ✅ built; the threshold (10°) is the check's own: his word with B4 (§2bis) |
| 3 | Ghosts and seat markers end 2 – 17 mm from the collision pieces (S0, finding 3) | the plunge's depth and the collision pieces agree; the collision pieces follow the drawn part | **D2** (drawing) | the same — WARN: a ghost off by more than 1 mm. ⏳ Against the DRAWN meshes: B1 | ✅ the first half built; ⏳ B1 owed (to run before the plunge is built — later, with `Scene_2`: §2bis) |
| 4 | Two pistons stop 1.4 mm short of their pin (S0, finding 4) | at its goal a part touches what it seats on and sits inside nothing | **D3** (drawing) | the same — WARN: touches no placed part / sits INSIDE a placed piece | ✅ built |
| 5 | A way in free but 7.5° from a blocked direction; the smallest wide sets, 28° – 30° round the vertical (S0, findings 5, 6) | nothing to pass — facts for the owner's look | — facts for his look, no rule | the same — WARN under 10°; each part's share and widest opening printed | ✅ built |
| 6 | The orbited piece's collision ignores every FROZEN body, and `Scene_2`'s plinth is frozen (read in the code at the review; not seen in the game) | ⏳ to decide once seen in the game: the game's rule changes, or a scene's frozen parts other than its floor are reported | **C3** — OWED | none yet | ⏳ owed — first to check in the pick-up flow (later, with `Scene_2`: §2bis) |
| 7 | The landing map's cost grows with the placed parts' convex pieces (S1: 36 – 270 ms a direction on `Scene_1` for a whole map) | ⏳ proposed: a budget per scene, once the wiring has chosen the map's representation | **C2** — OWED | none yet (B3 will run the game's own function on the `.glb`) | ⏳ owed — after the wiring's choice |
| 8 | The specification's own checks, from the shapes study: solids (B1), exposed per stage (B2), where each held piece first touches (B3), coverage (B5), features at a threshold (B6) | `PART_AUTHORING.md` §6.1, each with its pass rule | `PART_AUTHORING.md` §6.3's ten lines, put into §10.2's form when a build script applies them | specified there | ⏳ not built — B1, B2 first; B3, B5 once the landing map is wired |
| 9 | On a side facet P2 (the piece AS HELD, resting face down) stands half the piece's size out: +22.5 mm across it, +51.8 mm along it (S2's G3 on his records, `ORBIT_SURFACE_READOUT.md` §14) | — a GAME rule's (P2's orientation), not a scene's | none — golden vectors once decided (`SCENE_WORKFLOW.md` §9.2) | none (a game rule) — its golden vector: `landing_readout.test.ts` V2 *on a side facet the piece AS HELD* | ✅ his word 2026-11-23: **(a) as held** |
| 10 | The readout and the footprint support read each placed part as ONE convex body (S2's build, `ORBIT_SURFACE_READOUT.md` §13.8) | a part authored as data is convex | **C4** (construction) | ⏳ owed: its hull's volume = its mesh's | ⏳ the check owed |
| 11 | Near the top channel's walls H2 lets the gizmo go (the piece cannot pass: P2 right), and the top's TODAY depth drops it 21 mm onto the channel's floor at the tilt (S3's scan, `ORBIT_SURFACE_MOUTH_HOLD.md` §7) | — a GAME rule's (the top's depth, item 4), not a scene's | none | none (a game rule) | ✅ his word 2026-11-23: keep `mouthHoldDomain` 2, item 4 built next (it resolves the row) — ⭐ S4 built: the top reads the rims there |
| 12 | P2 driving moves the far piece and the camera where the direction is oblique to the face (F17): on his front record the camera ≤ 2.9 mm, the piece ≤ 7.1 mm (S4's G3, `ORBIT_SURFACE_DRIVE.md` §10) | — the ORBIT's (F17, its queue), not a scene's | none | none | recorded — his look |
| 14 | `Scene_2`'s face proxies stand OFF their collision pieces — the resting faces 16.6 – 36.8 mm (E03, E07 – E14), the outer surfaces up to 42 mm (E04); E17's proxy half turned inward (S5's B1, `ORBIT_SURFACE_PART_CHECKS.md` §8) | the proxy ON its solids within the fit, facing out (B1e, B1f) | **D4**, **D5** (drawing, `PART_AUTHORING.md` §6.4) | B1e, B1f (`part_checks.ts`, `check_part_solids.ts`, a vector) | ⏳ his word: the file, or the rule |
| 15 | ⭐ The plinth's top proxy is NOT complete: its four corners cut (a rounded rectangle on a square collision top), set in ~2 mm (his known issue; S5's B1h) | a proxy face complete on the solid face it lies on (B1h) | **D6** (drawing) | B1h (a vector) | the corners found — ⛔ NOT his issue (row 16; `ORBIT_SURFACE_PART_CHECKS.md` §11) |
| 16 | The plinth's proxy is ONE open face (its top), its sides — which the outside reaches — without one (his reading: *"not a closed mesh but a quad"*; checked 2026-11-23: every `Scene_2` proxy is open by convention, the plinth's sides the gap) | the proxy covers every face the outside reaches (⏳ PROPOSED) | **D7** (drawing) | B1i — BUILT (the plinth's sides: 71.8 %; read literally every part 33 – 100 %) | ⏳ his word on the rule (`ORBIT_SURFACE_PART_CHECKS.md` §10) |
| 13 | `Piece44` is an inverted frustum: the support on P2 equals today's where a part's widest extent is at its top; on a slant P2 reads the contact, lower (S4's V3) | — a GAME rule's (P2 is exact), not a scene's | none | V3 (`landing_drive.test.ts`) | ✅ vector |

⭐ Rows are ADDED by each package and by each look of the owner; a row leaves only when its check is built AND has been seen failing.

## 9. THE TERMS THE CLOSED ORBIT SETS FOR THE WIRING (2026-11-22 evening — read before any wiring)

* **The reference**: LIVE `3b7a479` (`1.0.156-Orbits_with_camera_follow_final`), the best implementation of the orbit so far
  ([`UPRIGHT_LESSONS.md`](UPRIGHT_LESSONS.md) §3). Every wired step behind its own switch, 0 = that build frame for frame. The queue: `RND7` (this work),
  `RND8` (the study's handed findings).
* **Where the surface reaches the camera** (the camera is not reopened — [`ORBIT_SURFACE.md`](ORBIT_SURFACE.md) §0's scope): the map's place shown
  (`asmShown`) → the calm's target (`calmTargets`) → the calm asked (`asmAskCalm`) → the far reading (`farAsked`) → the far follower (`followFarStep`);
  and the gizmo's facet (`gizmoFacetW`). A change of the map, of the facets or of the calm's runs changes the camera's path — measured, never assumed.
* ⚠ **D-H23 keys the calm's source on its NORMAL** (`calmSourceKey`, `farJumpAtRead` — [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §20.6): a
  surface whose calm normal varies continuously — the charts' step B ([`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §5.3, the normal of the shape with its edges
  rounded), which belongs to this work ([`ORBIT_SURFACE.md`](ORBIT_SURFACE.md) §1.1) — makes every moving frame a change of source: the crossing search
  (6 samples, 8 halvings, each a `calmTargets` run) every frame. Re-key the source (the facet, the band) or bound the search BEFORE step B is wired.
* **The gates**: his PC play records replayed headless (the kit's `walk_r.mjs` / `drv_r.sh`: his window, his frame times, his events; six records of
  2026-11-22 in `.recordings/`, git-ignored) — the switch at 0 identical to `3b7a479`'s replays (G1), and his symptoms at 1; the method:
  [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §20.1 – §20.9. Every finding about a scene becomes a check (§8).
* **The code references** here and in [`ORBIT_SURFACE.md`](ORBIT_SURFACE.md) were read on `30f7bb3` / `1190db2`: re-read on the branch before building on
  any (step 2.5 deleted the legacy zones and `chartLayout`; R6 twelve picture switches).
