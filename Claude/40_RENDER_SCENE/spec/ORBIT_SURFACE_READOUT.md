# THE READOUT — the landing map beside today's depth on `Scene_1` (package S2, designed 2026-11-22)

> **STATUS** · ⭐ **DESIGNED 2026-11-22; his word *"proceed"* (2026-11-22): §10's three choices as proposed — BUILT 2026-11-22 (P1 `dfeb7ef9`,
> P2 `fafbde6b`, P2b `d21a4826`, §13; the audit's fix round 1 `e91d3e82`, §13.7); ⭐ GATED 2026-11-22 night (§14: G1 bit for bit; G2 3 – 7 ms
> a facet on this PC; G3 met on the top, ONE FINDING on the side facets — ✅ his word 2026-11-23: (a) AS HELD); ⭐ DEPLOYED 2026-11-23 on his word (LIVE main `ff41fc3` = `5d30edf5`); his look OWED** (branch `1.0.158from1.0.157-Orbit_surface`, worktree `../orbit_surface`).
> **OWNS** · S2's design: what the readout shows, what it reads, where it hooks, its switch, its cost readout, its vectors and gates.
> **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §2.2 P2 and §6 (the build list, item 1); [ORBIT_SURFACE_LANDING_MAP.md](ORBIT_SURFACE_LANDING_MAP.md)
> §10.6 (what the wiring must know), §10.9 (the representation); [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §2bis (his answers), §9 (the terms
> the closed orbit sets). Code read on `ea807c7f`.

## 1. In one paragraph

The specification's first build item (§6, decided 2026-11-16 with Q2): the landing map — P2, *the gizmo's depth is where the held piece, moved along
the face's normal, first touches the placed parts* — computed every frame at the gizmo's place and SHOWN beside today's depth on `Scene_1`, driving
nothing, so the owner sees on the glass where the two disagree before P2 is allowed to drive the gizmo. It uses the exact evaluation at each query,
no grid, and prints its own cost on the HUD (his answer of 2026-11-22: his first look on the phone is the measurement §10.9 asked for). Behind one
switch; at 0, `3b7a479` frame for frame.

## 2. What the owner sees

* **On the glass: a second ring** at P2's landing — the gizmo's place on its facet (the place's two other coordinates kept), at P2's depth:
  **white** = *land* (a placed part first touched), **magenta** = *nothing to land on*, drawn on the facet's plane (§5.2's word; magenta is B3's
  colour for it, `PART_AUTHORING.md` §6.1). Where the two depths agree it sits on the gizmo; where they disagree it stands apart along the normal.
  Drawn in rendering group 2, as the gizmo (*an instrument must not be occludable by the thing it describes*), and by the gizmo ring's own drawing
  path, so it follows whatever the drawn gizmo follows.
* **On the HUD: one line**, `landing`, e.g. `landing  P2 Δ+20.4 mm  land Piece44 · prep 7.6 ms (worst 12.1) · query 4.3 µs · facets 4`:
  Δ = P2's level − today's level along the facet's normal, signed (+ = P2 farther out of the assembly); the part touched; the preparation's cost
  (the last, the worst over 2 s), the query's (a mean over 30 frames), the facets prepared. Held as the `solver` field is (a mean and a 2 s
  peak), because the HUD repaints only when dirty or once a second.

## 3. What it reads — the MODEL's coordinates only (never the swaying meshes)

| input | from | note |
|---|---|---|
| **the placed parts** | `placedParts(st)` (`assembly_wiring.ts`) — the goal-locked parts' vertices on their MODEL pose, the very set the footprint support reads — extended with each body's id (a parallel array under the same cache key) → `ConvexPiece { id, points }` | `Scene_1`: each part one convex body (a box, a frustum: the contour mesh, `D125`). A `.glb` scene's `UCX_` pieces: later, with `Scene_2` |
| **the held piece, AS HELD** | the green piece's convex points (`st.world.objects.get(id).shape.points`, local), turned by its model orientation (`worldPlacementOf(...).orientation`), relative to its resting face's centre (`restingCentre`): `qRotate(q, p − rc)` | as `supportFrame` poses it (`placeByFaceCentre`); the reference point is the point the gizmo stands for (`ORBIT_SURFACE_LANDING_MAP.md` §3) |
| **the facet** | the gizmo's facet (`mapTarget`'s `t.stack`), its normal `n` and its plane's axes `t`, `b`; turned into the world by `mapFrame` when tilted or zoned | the map's facets, as `rawGizmo` reads them |
| **the place** | `(u, v) = (sf·t, sf·b)` — the place `stackDepthAt` reads | the facet's own place: in an edge band the drawn gizmo is the blend (`blendThroughEdges`); the readout keeps the facet's place and says `band` |
| **today's level** | `rawGizmo`'s point, along the same `n` | the depth before the edge blend |

⚠ It reads FROM OUTSIDE at every distance. P2 ⑤ (in contact range, read from where the piece is) belongs to the step that drives (§9 below).

## 4. Where it hooks — once a frame, and nothing reads it back

* **Logic in `src/core`** (the engine boundary): `landing_map.ts` gains `prepareLanding(placed, held, frame) → { landingAt(u, v, from?), refused }` —
  the sums as `buildLandingMap` prepares them, with no grid; `buildLandingMap` calls it, so the two cannot drift (one implementation). A pure
  `readoutAt(...)` gives the kind, Δ and the part; a pure `readoutKey(...)` gives the cache key.
* **State and call in a new render module**, `src/render/landing_readout.ts`: called in `assemblyFrame` right after `mapGizmo` for the frame's own
  gizmo — ⛔ never inside the section samples, the edge blend's samples or the solver's 24 queries.
* **The cache**: one preparation per facet (⭐ and normal — §13.4 D6), keyed by the map's identity and frame, the placed set's key, the held piece's
  id, points, orientation and ⭐ resting face's centre — rebuilt at a pick-up, a turn of the piece, ⭐ a change of resting face (a tapped face moves
  the reference point with no turn — §13.7, the audit's finding 1), a seat, a frame change (`ORBIT_SURFACE_LANDING_MAP.md` §10.6). At most ONE preparation a frame: a
  turn mid-gesture prepares the current facet first, the others as the gizmo reaches them (the specification's warning: rebuilding 10 – 20 maps
  in one frame may hitch an iPhone).
* ⛔ **Nothing in the frame reads its result.** The gizmo, the piece, the calm and the camera are untouched — none of §9's chain (`asmShown` →
  `calmTargets` → `asmAskCalm` → `farAsked` → `followFarStep`, `gizmoFacetW`) sees it. The orbit stays closed.
* `LANDING_STEP_MM` moves to `src/core/units.ts` and the `PENDING` line of `buildLandingMap` leaves `tests/unwired_debt.test.ts`
  (`ORBIT_SURFACE_BUILD.md` §6; that test then demands it).

## 5. The switch

`landingReadout` — **0**: nothing computed, nothing drawn, no HUD line: `3b7a479` frame for frame. **1**: the readout. ⭐ **Default 1 on this
branch** (his look needs it; gate G1 proves that 1 moves nothing). Validated 0 / 1 (`validateGestureConfig`); in the menu's GIZMO & SECTIONS
(7 → 8 sliders; 135 → 136, `tests/menu_layout.test.ts`); its own switch test, as `tests/follow_jump_at_place.test.ts`.

## 6. The cost, timed (his answer 3)

Prepared per facet: the last and the worst over 2 s, in ms; the query: a mean over 30 frames, in µs; the facets prepared. On this PC first (G2),
then on his phone. ⭐ That figure decides `ORBIT_SURFACE_LANDING_MAP.md` §10.9 (no grid kept, or a tile round the gizmo) and gives the
construction rule C2 its budget (`SCENE_WORKFLOW.md` §10.3).

## 7. The vectors — each shown red on a mutant first (`CLAUDE.md` rule 2)

| # | what | red on |
|---|---|---|
| V1 | `prepareLanding`'s `landingAt` = `buildLandingMap`'s, bit for bit, on the study's shapes, both pieces | one piece's sums dropped |
| V2 | `readoutAt`'s SIGN and size: a piece on a plate — Δ 0 at its centre; within half a piece of a proud block — Δ = the block's height; over a slot narrower than the piece — the rims' level; over a hole right through, wider — `nothing` | the normal flipped; the held piece not centred on its resting face; the held piece not turned |
| V3 | `readoutKey`: a turn of the piece, a seat, a frame change each change the key; an unchanged frame does not | the orientation left out of the key |
| V4 | the switch: 0 / 1 only; read (`config_debt`); the menu's layout and count; at 0 the module returns before any computation | — |

## 8. The gates — before his look

* **G0** — `npm run verify` green.
* **G1 — identity**: his six play records of 2026-11-22 (`.recordings/`) replayed headless (the kit's `walk_r.mjs`, its `REPO` pointed at
  `../orbit_surface`), at `landingReadout` 0 AND 1: every frame's piece, gizmo and camera pose identical to `3b7a479`'s replays, bit for bit.
  One headless job at a time.
* **G2 — the cost** on those records: the preparations (count, worst), the query per frame, against the 50 ms line.
* **G3 — the predicted differences** (`ORBIT_SURFACE.md` §2.2 P2, *what it changes on the glass*) seen at their places on `Scene_1`, in screenshots:
  off `Piece44`'s edge (41 mm proud) the ring stays up for about half a piece past the edge; the channel's floor a landing only in its central
  band (≈ 89 mm for the green piece); the goal slot beside `Piece44` (6.75 mm gap) reads `Piece44`'s top. A prediction not met is a FINDING
  (`ORBIT_SURFACE_BUILD.md` §8), never tuned away.
* Then **his look on the phone** (rule 5): the ring at those places, the HUD's figures read.

## 9. What it does NOT do

Drive the gizmo (the build list's item 4 — after his look and the representation's choice); P2 ⑤, the reading from the piece in contact range
(with the driving step); the mouth's hold restricted (item 2); the charts' step B (D-H23's source key first, `ORBIT_SURFACE_BUILD.md` §9);
`Scene_2` and its `UCX_` pieces (his answer 4); the drop into a slot (the contact's queue, `RND8`).

## 10. For his look — three choices this design makes (his word welcome before the build)

✅ **2026-11-22, his word *"proceed"*: all three as proposed.**


1. **The marker**: a white ring (land) and a magenta ring (nothing to land on), the gizmo's size × 0.7.
2. **Default 1 on this branch** (0 restores `3b7a479`).
3. **In an edge band** the readout reads the facet's own place, not the blend, and says `band`.

## 11. Lessons → rules (the owner, 2026-11-22)

The brief ends with the rule of [SCENE_WORKFLOW.md](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §10: *what did this teach about how a scene must be
built or a part drawn? → its rule, its check, its control, its ledger row.* Expected: C2's budget from G2 and the phone; every prediction of G3
that fails, if it is about a scene's shape.

## 12. How it is built

Lean packets (the working rules, `HANDOVER_2026-11-22.md` §3): (1) `src/core` — `prepareLanding`, `readoutAt`, `readoutKey` and V1 – V3, each red
first; (2) the render module, the switch, the HUD line, the marker, V4; (3) G0 – G3, then an independent auditor's read of the diff against this
design. Commits by path on this branch; nothing pushed or deployed before his word.

## 13. As built (2026-11-22, the builder — G1 – G3, the auditor's read and his look OWED)

### 13.1 The files

**P1 — `dfeb7ef9`, the pure part.** `src/core/units.ts`: `LANDING_STEP_MM`, its one home (`landing_map.ts` re-exports the same binding).
`src/core/landing_map.ts`: `prepareLanding(placed, held, axes) → { frame, refused, landingAt }` — the sums with no grid; it and `buildLandingMap` share
ONE preparation (`prepareSums`) and ONE exact evaluation (`exactOf`), so they cannot drift; `readoutAt(prep, place, today)` → `land` (P2's level, Δ,
the part, the point at P2's level) or `nothing` (no depth; its point the place, on the facet's plane); `readoutKey(...)`; and two helpers so the
design's mutants have a pure place to bite — `landingAxes(n, t, b, R)` (the facet turned into the world, origin 0) and `heldPiece(points, q, rc)`
(`qRotate(q, p − rc)`). `tests/landing_readout.test.ts`: V1 – V3, 12 tests. ⭐ **Δ is in METRES** in `src/core` (`Readout.delta`), in millimetres to
0.1 on the HUD.

**P2 — `fafbde6b`, the wiring.** `src/render/landing_readout.ts` (new): the state `st.landing`, the call `landingReadoutFrame`, the ring
`landingMarkerFrame`, the line `landingLine`. `src/render/assembly_wiring.ts`: `mapGizmo` split into `rawGizmo` + `gizmoOf` (the same operations in
the same order) so the frame's own call keeps `rawGizmo`'s point (today's level, before the blend); the hook right after it; `READOUT_SOURCE` (the
face map, its frame, the placed bodies — the module cannot import this file, which imports it); `placedParts` keeps each body's part id (`ids`,
parallel, the same key). `src/render/green_box_wiring.ts`: the ring's frame at the end of `greenBoxFrame`. `src/render/hud.ts`, `hud_paint.ts`: the
`landing` line after `green`, none at 0. `src/render/scene_state.ts`, `scene.ts`: `landing`, `landingMarker`, `asmParts.ids`.
`src/input/gestureConfig.ts`, `src/render/tuning_menu.ts`: `landingReadout` (0 / 1, default 1, validated; GIZMO & SECTIONS 7 → 8, the menu 135 → 136).
Tests: `tests/landing_readout_switch.test.ts` (V4, V4b — 9 tests, with D1's), `tests/menu_layout.test.ts`, `tests/unwired_debt.test.ts`.

**What it reads, frame by frame** (at 1): the facet `map.facets[t.stack]` (its `t`, `b`) with `rawGizmo`'s `t.normal`, turned by `mapFrame`
(`landingAxes`); the place `R·t.surface`; today's point `R·rawGizmo.point`; the held piece's `shape.points`, its MODEL orientation
(`worldPlacementOf`), its `restingCentre`; the placed bodies of `placedParts` (MODEL pose) with their part ids. The cache's key: a number per face
map object (a `WeakMap`), the map's frame, `placedParts`' key, the held piece's id, ⭐ its points' identity, its orientation and ⭐ its resting face's
centre (fix round 1, §13.7) — every number exact. Each facet's entry: its index and ⭐ the exact normal it was prepared for (D6). Only the frame's
facet is prepared, when the gizmo reaches it: at most one preparation a frame by construction. On `Scene_1` only (§13.4 D1).

### 13.2 The vectors, each RED on its mutant first (`CLAUDE.md` rule 2) — one mutant at a time on the built code, the file run, reverted

| # | the vector | the mutant | its red line |
|---|---|---|---|
| V1 | `prepareLanding`'s `landingAt` = the map's samples (its own `gather` loop) and its `landingAt`, bit for bit (`Object.is`): L01 – Q10, every studied facet, pieces A and B — 65 300 places; and a two-piece held body read from five depths — 2 420 | one piece's sums dropped from the exact evaluation (`exactOf`: `pieceSums.slice(1)`) | `20267 of 65300 differ` (and 4 of V2's tests red) |
| V2 | `readoutAt`, a piece turned 90° about x (100 × 20 × 40 mm, its reference its resting face's centre): a plate — Δ 0; within half a piece of a 41 mm block — Δ 41, past it 0, the sign (−41 from the block's top beside it); a 15 mm slot across its 20 mm — the rims (Δ +20 from the floor), a 30 mm slot its floor; a hole right through, 120 × 40 — `nothing`, no depth; the whole scene turned by R — the same Δ to 1e-12 m | the normal flipped (`landingAxes`: −R·n) | `(0, 0): expected 80 to be +0` (5 of 5 red) |
| | | the piece not centred on its resting face (`qRotate(q, p)`) | `expected 20 to be +0`, `expected 61 to be 41` (5 red) |
| | | the piece not turned (`p − rc` as is) | `expected 10 to be +0`; the hole: `expected { kind: 'land', level: 0.05, … } to deeply equal { kind: 'nothing', … }` (5 red) |
| | | (of its own) Δ's sign (`level − depth`) | `expected -41 to be 41` (3 red) |
| | | (of its own) the map's frame transposed (`Rᵀ`) | `x 0: expected 0.10070755957602062 to be less than 1e-12` (1 red) |
| V3 | `readoutKey`: the same inputs rebuilt → the same key; a turn (even 1e-9 rad), a seat, another map, another piece, a frame change → another | the orientation left out of the key | `expected 'm3…' not to be 'm3…'` (the turn's test) |
| V4 | the switch: 1 by default, 0 / 1 only; ⛔ at 0 nothing of the state, the gizmo or the source read (a state that throws at any read but `cfg`) — not vacuous: at 1 the same state IS read; the three entry points read the switch first; the hook once, right after the frame's gizmo; in GIZMO & SECTIONS; ⛔ no module but its own touches `st.landing` | the switch read after the state is made | `expected [Function] to not throw an error but 'Error: st.landing read' was thrown` (2 red) |
| V4b | at 1 on a stub frame: Δ +41 and the part at the gizmo's place, `band` when the drawn gizmo is off today's point, the HUD line in §2's form; the cache — the same key keeps the preparation, another facet a second one, a turn of the piece clears them | the cache not cleared on a new key | `expected 2 to be 1` |
| | | the band never set | `expected false to be true` |
| | (§13.4 D1) on another scene at 1: nothing prepared, no readout, the line `— (Scene_1 only)` | the scene gate removed from the frame | `expected { frame: 7, readout: { …(5) }, …(2) } to be null` |

`tests/landing_map.test.ts` passes UNCHANGED (24 tests).

### 13.3 Departures from the design — each where its intent was unambiguous

1. ⚠ **`buildLandingMap`'s `PENDING` line STAYS in `tests/unwired_debt.test.ts`, its reason rewritten** (§4 said it leaves). The readout calls
   `prepareLanding` (no grid — his answer, `ORBIT_SURFACE_BUILD.md` §2bis), so nothing in the product calls the GRID; the test asserts its list exact
   both ways, and deleting the line turns it red. Its reason now says why the grid is unwired (`ORBIT_SURFACE_LANDING_MAP.md` §10.9).
2. `buildLandingMap` does not call the exported `prepareLanding`: both call one internal preparation and one exact evaluation (the map needs the
   parts' polytopes for its own layers, which `prepareLanding` does not expose). One code, as §4 asks; V1 proves it at every sample.
3. Two pure helpers beyond the three named (`landingAxes`, `heldPiece`): §7 names V2's mutants (the normal, the centring, the turn), not where they
   live — in `src/core`, so the vectors reach them.
4. `readoutAt` takes points (the facet's place, today's point), both in the world: (u, v) = the place's (§3: `sf·t`, `sf·b`), today's level =
   today's point along n — §3 written as points.
5. The ring's frame is the LAST line of `greenBoxFrame`, not the line after `pinkRingFrame`: a vector (`proto_resting_face.test.ts`) pins the lines
   after `pinkRingFrame`; nothing between them moves the camera or the gizmo's lag.

### 13.4 Decisions made during the build (owner asleep, 2026-11-22)

His word of the evening, relayed: *proceed without questions, every decision in the md files*. Where the design left a choice open, the most
conservative one that keeps its intent (⛔ nothing in the frame reads the readout; 0 = `3b7a479` frame for frame) — each for his review:

* **D1 — `Scene_1` ONLY** (`READOUT_SCENE`, `render/landing_readout.ts`). §1 shows the readout on `Scene_1` and §9 leaves `Scene_2` out, but the
  switch alone would have run it on every scene: on `Scene_2` `placedParts` hulls whole meshes (not its `UCX_` pieces), so its Δ would not be P2's,
  at an unmeasured preparation cost on a phone. Elsewhere at 1: nothing prepared, no ring, the line `— (Scene_1 only)` (vectored, V4b).
  To undo: one constant.
* **D2 — the ring follows the gizmo's drawing path, its LAG** (`gizmoShownAt`), not the gizmo's depth glide (`asmGOff`) nor a mouth's hold: those
  move the gizmo's own point, not its drawing; P2 is shown where it is. During a glide the ring may stand apart from the drawn gizmo by the glide's
  rest where the depths agree — read the HUD's Δ, not the gap on the glass, in those 125 ms.
* **D3 — no readout while the piece is placed** (`orbitPiecePlaced`, as `supportFrame`): the design reads the held piece AS HELD; a seated piece
  is not held.
* **D4 — the cache key is EXACT on the orientation** (no rounding): never a preparation for a pose the piece no longer has. Its price — a piece
  whose model orientation changes every frame is prepared every frame — is visible on the HUD (`prep` moving, `facets 1`), never hidden.
* **D5 — the line names a piece left out for no volume** (` · ⛔refused …`, `ORBIT_SURFACE_LANDING_MAP.md` §10.6 *"look at it"*), and reads `—`
  when the readout did not run the frame before (no piece held, no map): an absent readout is said, never left stale.
* **D6 — one preparation per facet AND NORMAL** (the coordinator's decision in fix round 1, §13.7): the per-facet entry is keyed `stack:n0,n1,n2` on
  the exact normal the sums were prepared for (`rawGizmo`'s `t.normal`) — never switched to the facet's `f.n` (a cap's normal may differ from its
  facet's), so the entry and its preparation cannot disagree by construction.

### 13.5 Not done, not checked, known limits

* **G1 – G3 NOT run** (one heavy job at a time: they run after the build), no auditor's read, no device look (rule 5).
* ⚠ **The query's µs on a phone**: `performance.now()` is coarsened in browsers (Safari: about a millisecond) — a 4 µs query reads 0 most frames and
  a whole tick rarely; the 30-frame mean is unbiased but noisy there. The preparation's milliseconds are reliable.
* `Scene_2` and every scene but `Scene_1`: no readout (D1) — the `UCX_` pieces' reading is later (§9).
* The key is exact on the orientation: a piece whose model orientation changes every frame (a turn under way) is prepared every frame — the HUD shows
  it (`prep` moving, `facets 1`).

### 13.6 The gate G0

`npm run verify` once at the end of the build (on `d21a4826`, the code as committed; this document after it): ✅ **190 files, 2342 tests, green**, the typecheck clean. The base (`35d407ea`): 2321 vectors — + 12 (V1 – V3) + 9 (V4, V4b).

### 13.7 Audit (independent, 2026-11-22) and fix round 1

An independent auditor read the diff `35d407ea..d21a4826`. Its four findings, and what was done (the owner asleep: no questions; commit `e91d3e82`,
code only — nothing outside the readout's own state changed):

1. ⚠ **CONFIRMED defect — the cache key left out the held piece's reference point.** `readoutKey` held the map, its frame, the placed key, the held
   id and orientation, but the preparation reads `heldPiece(local, q, rc)`. A tapped face (`selectRestingFace` → `restOnTappedFace`) replaces the
   orbit piece's `restingCentre` before `alignRestingFace`, which may leave the orientation as it was (a turn refused — `blockedBy` — or no target):
   the old preparations survived with the old reference point, Δ off by tens of mm. **Fixed**: `ReadoutKeyOf` gains `restingCentre` and `shape`
   (the held points' identity — a respawned shape is a new key); §4's list of rebuild events and `ORBIT_SURFACE_LANDING_MAP.md` §10.6 gain *a change
   of resting face*. Vectors: V3 *"a change of resting face with the same orientation changes the key; a new shape changes it"*; V4b *"a change of
   resting face with the same orientation → prepared anew"* (the piece's −z face up: P2 read from it, Δ +40).
   RED on the resting centre left out of the key: V3 `expected 'm3|Rworld|PPiece1/Piece1|Piece44/Piec…' not to be …`, V4b
   `expected { frame: { …(4) }, refused: [], …(1) } not to be …` (the old preparation reused).
2. **Not vectored — the tilted / zoned path in the module** (V4b's stub had `frame: () => null`). Vector V4b *"the map's frame, R a real rotation"*:
   the parts and the held piece turned by R in the world, the facets not; Δ 41 and the point `R·(11, 81, 0)` mm as unturned; today's point higher on
   the same line → Δ 21; another R under the same map object and placed key → prepared anew, its result a fresh state's. RED on each mutant:
   `mulM(R, …)` dropped on the place — `point 0: expected 0.015909010135892056 to be less than 1e-12`; dropped on today's point —
   `expected 12.031016775371135 to be less than 1e-9`; `null` passed to `landingAxes` instead of R — `expected 8.277061413626058 to be less than
   1e-9`; R left out of the key — `expected { frame: { …(4) }, refused: [], …(1) } not to be …` (the R1 preparation reused under R2).
3. **Fragile — the per-facet entry keyed by `t.stack`, prepared with `t.normal`.** Decision D6 (§13.4): the entry keyed on the stack AND the exact
   normal. Vector V4b *"one preparation per facet and normal: the same stack with another normal prepares anew, its result a fresh state's"*. RED on
   the normal left out of the entry: `expected 1 to be 2`.
4. **G2 cannot be measured on the virtual-clock replays**: answered by an offline script — the coordinator's part (§14).

G1 – G3: see §14.

`npm run verify` after the fix round (on `e91d3e82`): ✅ **190 files, 2346 tests, green**, the typecheck clean (+ 4: one in V3, three in V4b).

### 13.8 Lessons → rules (§11)

Nothing measured yet that teaches a rule: C2's budget waits for G2 and his phone. One candidate from the build itself, for his word: the readout
(and the footprint support) read each placed part's mesh as ONE convex body — true on `Scene_1`, false for a non-convex part; a scene check *"every
placed body the orbit reads is convex (its hull's volume = its mesh's)"* would make that assumption a check (`SCENE_WORKFLOW.md` §10, not written).

## 14. The gates (2026-11-22 night, the owner asleep — run by the session that briefed the build)

* **G0** — `npm run verify`: 190 files, 2346 tests, on `e91d3e82` (after fix round 1).
* **G1 — identity: PASSED, bit for bit.** His four records of 2026-11-22 replayed headless from this worktree against the `3b7a479` code's replays
  (`follow/cap/runs_r/L1_*`: D-H23 and D-H24 on) — the kit's `fo3/surface/` (`drv_rs.sh`, `run_g1.sh`, `run_g1b.sh`; the walker `walk_rs.mjs` =
  `walk_r.mjs` + each frame's readout, read only; `cmp_id.mjs`: the camera's position, target and up, and the gizmo). On `d21a4826`, at
  `landingReadout` 1 AND 0, all four (`Scene_1` back 2 916 frames, front 6 034; `Scene_0bis` back 5 011, front 8 381): the largest difference
  **0** on every frame. On `e91d3e82`, `Scene_1` back and front at 1: **0** again. No probe profile left in %TEMP%.
* **G2 — the cost.** ⚠ Not measurable on the replays (the audit's finding 4: their clock stands still within a frame — which is also what makes G1
  bit for bit). Offline instead — `scripts/surface/readout_cost.ts`, one process, the PC otherwise idle: on `Scene_1`'s 36 placed boxes (its four
  frusta left out: ~10 % more pieces in the game), the study's two pieces, the six directions — **a preparation 2.5 – 3.5 ms (the median), 6.6 ms
  the worst cold; a readout 1.1 – 2.7 µs (the worst batch 3.0 µs)**, far under the 50 ms line. **His records: 2 preparations (back) and 4 (front)
  over the whole record** (the key changed once — the pick-up — then one per facet reached). ⭐ So on this PC the readout costs one 3 – 7 ms frame
  when the gizmo first reaches a facet, and ~3 µs a frame after. The phone's figures (the HUD's `landing` line) are owed: they decide
  `ORBIT_SURFACE_LANDING_MAP.md` §10.9 (no grid kept, or a tile) and C2's budget.
* **G3 — the predicted differences, read on his own records** (rather than screenshots: each frame's readout, the kit's `rd_g3.mjs`, grouped by the
  facet's normal; the front record crossed the top round `Piece44`, both records the sides):
  * **The top (normal +y) — the predictions MET.** Δ 0 over the open top (1 786 frames); **+41.3 mm round `Piece44`** (41 mm proud: P2 touches its
    top within about half a piece of its edges — today's point at x −5 … 73 mm for a part centred at x 23 mm, P2 at its top, y 539.8 mm) — *"off
    `Piece44`'s edge the ring stays up for about half a piece past the edge"*; **+73.3 mm over the recess just left of `Piece44`** (32 mm deep:
    today's point on its floor, the piece first touching `Piece44`'s top) — a slot beside a proud part reading the part's top, as predicted for the
    goal slot. The channel's central band was not crossed in these records: not seen.
  * ⛔ **The side facets (normals ±x, ±z) — NOT as the predictions assume: a FINDING.** Δ is a CONSTANT there: **+22.5 mm** across the piece's
    45 mm (±z) and **+51.8 mm** along its 103.5 mm (±x) — half the piece's size along the normal — on every frame (the back record: not one frame
    agrees). The root: P2 reads the piece **AS HELD** (his Q2), and in his records the piece is never turned in the orbit (the key changed once): it
    stays resting face down, so against a side facet its SIDE touches first and its resting face's centre — the point the gizmo stands for —
    stops half a piece out. The game turns the piece onto a facet only on the PLAYER's tap (the resting-face alignment, `green_box_wiring.ts`
    `alignRestingFace`, `RESTING_FACE_ALIGNMENT.md` §2: the resting face anti-aligned with the gizmo's face); his records hold none. The
    specification's predictions (`ORBIT_SURFACE.md` §2.2 P2, *what it changes on the glass*) assume the resting face toward the facet. Nothing is
    wrong in the readout (V2 holds; the top agrees): the question is the rule's.
  * **For his look — the question** (nothing changed: the readout drives nothing). On a side facet, which piece does P2 read? **(a) as held** (his
    Q2, as built): until he aligns the piece, a side's gizmo would stand half a piece out once P2 drives — the true place its reference stops if
    the piece is not turned; after the alignment tap the key changes, the facet is prepared anew and Δ falls to 0 except at walls and rims (V2, V4b;
    not yet seen on a record). **(b) as it would land** (turned onto the facet, its resting face against it — the alignment's target): Δ 0 on a flat
    side whatever the player did; one preparation per facet AND its landing orientation. **(c)** both on the HUD. ⭐ Recommended: **(a)** — it is
    what the game does (the turn is the player's), and the readout shows him the cost of not aligning; his look: on a side facet, the HUD's Δ
    before and after the alignment tap. The ledger: `ORBIT_SURFACE_BUILD.md` §8 row 9.
  * ✅ **His word (2026-11-23):** *"Keep as held. Continue build"* — **(a) AS HELD**, the rule as built. Its golden vector (`SCENE_WORKFLOW.md` §9.2: a game rule's):
    `tests/landing_readout.test.ts` V2 *on a side facet the piece AS HELD* — a 100 × 20 × 40 mm piece against a wall facing +x: Δ +50 mm along its
    length, +10 after a quarter turn about the vertical; shown RED on the mutant (b) (the held piece turned so its resting face faces the facet,
    in `prepareLanding`: *"expected +0 to be 50"*; built with S3 in `d4b6c222`, `ORBIT_SURFACE_MOUTH_HOLD.md` §10).
  * ⚠ **A CORRECTION (2026-11-23, S4's design — [ORBIT_SURFACE_DRIVE.md](ORBIT_SURFACE_DRIVE.md) §2).** The consequence put to him with (a) — *"a side's gizmo
    would stand half a piece out once P2 drives"* — does not hold: the game's gizmo marks the CONTACT (the piece hangs from it by its lift, `faceLift`,
    which along the facet's normal is P2's reach), so P2 drives the gizmo at its level LESS the reach: on a flat side, aligned or not, today's level.
    The side's constant Δ here is the reach itself. This ring keeps marking the piece's reference point.
* **Lessons → rules** (§11, `SCENE_WORKFLOW.md` §10). The side-facet finding is a GAME rule's (P2's orientation: golden vectors once decided —
  `SCENE_WORKFLOW.md` §9.2), not a scene's: no scene rule. The builder's candidate (§13.8) IS a construction rule — **C4**: a part authored as data
  is convex (a box, a prism, a frustum — `PART_AUTHORING.md` §2), because the readout and the footprint support read each placed part as ONE convex
  body; its check OWED (the ledger's row 10).
* **How he looks** (rule 5): `npm run dev:usb` from `../orbit_surface` with `adb reverse` (`50_BUILD_DEPLOY/DEVICE_TESTING_USB.md`), `Scene_1`; or his
  word to deploy (⭐ done 2026-11-23: LIVE main `ff41fc3` = `5d30edf5`). The ring and the HUD's `landing` line; the slider `landingReadout` (GIZMO & SECTIONS): 0 =
  `3b7a479`.

## 15. ✅ BUILT (`cfc5e325`) — THE RING SHOWS WHAT THE GIZMO USES (his word 2026-11-24: *"make the white ring show what the gizmo uses"*) — the design, before the build

**Why.** His question (2026-11-24, a screenshot: `P2 Δ+51.8 mm land Piece21`, the white ring above the yellow): *"why the white gizmo and the yellow
gizmo do not coincide?"* Since S4 (`landingDrives` 2, `ORBIT_SURFACE_DRIVE.md` §3) P2 places the gizmo — read FROM WHERE THE PIECE IS (`F`, the face
the piece is over: `landing_drive.ts` `fromAlong`) and marking the CONTACT (the landing less the piece's reach: `landing_map.ts` `driveLevel`). The
ring still answered S2's question — read FROM OUTSIDE at the gizmo's place, at the piece's REFERENCE (`readoutAt`): two answers to two questions,
the rings apart wherever the piece is already below a rim or does not rest on its resting face. Two options were offered; he chose this one.

**The rule.**
* Where P2 DRIVES the gizmo (`landingDrives` 2, `Scene_1`, a piece held: `driveGizmoLanding` not null) the ring and the HUD's `landing` line show
  THE DRIVE'S OWN READING for the frame's gizmo: the same call (`driveGizmoLanding` at the gizmo's facet normal and place), the same level
  (`driveLevel`: `land` → the depth less the reach; `nothing` → the facet's plane; `inside` / `uncovered` → today's) — so the white ring sits on the
  yellow one by construction, and ⛔ a gap between them is a DEFECT, never a reading. The HUD: `P2 Δ` = the drive's level − today's (what P2 changes),
  the part, `nothing` (magenta, as before), `inside` / `uncovered` named (the gizmo kept as built there).
* Where P2 does NOT drive (`landingDrives` 0 or 1, another scene): the readout as built (§2 — from outside), S2's instrument against the gizmo as built.
* ONE OWNER: the ring calls the drive's functions, never a copy of them. ⛔ `mouthP2` (S3's hold domain, `ORBIT_SURFACE_MOUTH_HOLD.md` §4 H2) keeps
  its own evaluation from outside at a mouth, unchanged: its question is another (*is the mouth open to the piece from outside?*).
* Nothing else moves: the gizmo, the piece, the camera and the hold are the same at every setting (G1: his records bit for bit on `g`, `c`, `t`, `p`);
  only the ring's place and the HUD line change.
* ⚠ In an edge band the drawn gizmo is BLENDED between two facets (`band`): the ring follows the driven point before the blend, with the gizmo's lag
  (`gizmoShownAt`) as today — a small gap there is the blend's, named on the HUD (`band`).

**Vectors** (red first against the readout as built): the ring's point equals the driven gizmo's point for `land` (resting face and a side: the reach),
`nothing`, `inside` and `uncovered`; read from `F` below a rim (his case: the from-outside point on the rim, the driven one below it).

**When.** After S14 lands (`ORBIT_SURFACE_LANDING_CAST.md` — it edits `landing_readout.ts` now). Then the gates (G1) and his look.

**As built (2026-11-24, `cfc5e325`).** `landing_readout.ts`: the source's `drive` (= `driveGizmoLanding`), `DriveShown`, `shown.drive` (the
driven gizmo `mr0` handed in as the readout's last argument — its point taken, never recomputed), `ringOf` (the ring's place and colour); the HUD line
from `drive` where P2 drives, as built elsewhere (its text unchanged). `tests/landing_ring_drive.test.ts` (6), each RED first on a mutant: the ring on
the readout always (4 red), the line ignoring the drive (4), the drive's point taken as today's (1). `npm run verify`: 2556 of 2557 — the one red
`boot_heaps`' 3 s wall-clock cap under load (a headless replay ran beside it), 9 / 9 alone; on a quiet PC 2557 / 2557. ✅ G1 (2026-11-24, with S14's — `ORBIT_SURFACE_LANDING_CAST.md` §10): his two `Scene_1` records,
`g`, `c`, `t`, `p` identical to the defaults' replays of 2026-11-23 on every frame. His look owed.
