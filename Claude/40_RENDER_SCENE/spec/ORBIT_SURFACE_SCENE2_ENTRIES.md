# THE ORBIT'S SURFACE — S0: THE ENTRY SETS OF `Scene_2`'s GOALS, ON THE REAL COLLISION PIECES (2026-11-17)

> **STATUS** · ✅ **MEASURED 2026-11-17** (package S0, an Opus builder; ✅ **AUDITED 2026-11-17** by an independent Opus auditor: PASS, §8) — a study, offline. **NO GAME CODE, NOTHING
> WIRED, NO EXISTING FILE CHANGED** but this branch's own record. **OWNS** · the entry sets of `Scene_2`'s sixteen goals at their stages, how
> they were computed, what they say against the assembly plan and the authored ghosts. **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §2.5
> (the definition, S28) and §7bis (B4), [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) §3.3 (the same check on boxes),
> [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §5 (S0 as briefed), [SCENE_2_ASSEMBLY.md](../../30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md) §2.3 (the plan).
> **The owner's answer behind it** (2026-11-17, `ORBIT_SURFACE_BUILD.md` §2, item 3): the entry-set check runs on `Scene_2`'s real parts before the
> first surface build — until now it had run on boxes only.

## 1. The result first

* **No goal is shut.** All sixteen goals have a free way in at their stage, and the plan's own way in is free for every one of them.
* **Six goals are NARROW: the six pistons.** Each enters along its bore's axis only: no sampled direction is free (0 % of the 642), the free set is
  a thin cone round the axis: its OPENING (the angle from the axis to the nearest blocked direction) is **2.7°** for four pistons and **1.9°** for
  the two seated deepest (E08, E12). This is what the plan says (§2.6: *"ONE axis"*).
* **Ten goals are open**: the lower case (50 % of the sphere — a part resting on an open plinth, as on the boxes), the crankshaft (8.9 %, a cone of
  about 30° round the vertical), the upper case (9.0 %, about 28°), the banks (43 %), the heads (51 %), the exhausts (27 %), the pulley (38 %).
* **The authored ghosts: close, but not equal — and the whole difference is ONE thing.** The six pistons' ghosts are **10 mm deeper** than the
  computed mouth (191 mm against 181 mm; 220 against 210 for E08 and E12); the crankshaft's ghost is **2 mm shallower** (25 against 27); the two
  heads' ghosts (`UFM_E0x_GHOST_valves`) ask a **17 mm** plunge where the collision pieces need none (the head's set is half the sphere). In every
  case the difference equals, to 0.1 mm, how far the part's own SEAT MARKER lies beyond its `UCX_` pieces along the way in (pistons 10.1 / 9.8 mm,
  heads 16.6 mm, crankshaft −2.1 mm): the ghosts agree with the markers; **the collision pieces do not reach the markers**.
* **Two pistons touch nothing at their seat** (E07, E10): their big end does not reach its pin within the contact tolerance.
* Every figure below is MEASURED by the script of §5, twice, identical.

## 2. The method, in plain words

**The question** (§2.5 of the specification): which directions can the part be pulled out of its seat along, in a straight line, without sinking
into a part already placed? Read the other way, those are the directions it can be pushed IN along.

**The parts and the stages.** The `.glb` is read with the game's own engine-free readers (`model_catalog.ts`, `glb_geometry.ts`): each part's
`UCX_` collision pieces, put at the part's goal (its authored pose). The order is the plan's main order (§2.3: E02 … E17, the plinth E01 pre-placed;
it equals the file's `step` order). The plan allows other orders (the two banks independent after step 3, the pulley any time after step 3): only
the main one was run. A part's placed set = every part before it in that order.

**Each direction.** 642 directions spread evenly over the sphere (the study's golden spiral, `ENTRY_SPHERE_N`, about 8° apart), PLUS, exactly,
every face normal (both senses) of the part's and of the placed parts' collision pieces, the plan's way in, and each ghost's plunge axis: a tight
slot's set is a single direction each way, which an even sampling misses. *(the audit)* **The plan's way in, as a direction** = MINUS the
part's own seat marker's normal (the marker carries the plan's wording); it is tested exactly, like a face normal.

**Exact, with no time step.** For two convex pieces, the moving one meets the still one exactly when its displacement lies inside one convex
shape, their Minkowski difference (the textbook configuration-space obstacle: Lozano-Pérez 1983; van den Bergen 2003, ch. 4). Pulling the part out
along a direction is a straight ray from its seat; how deep it sinks at each point of the ray is the distance to that shape's nearest face — so
"does it ever sink too deep, however far it goes?" is an exact test on a line, not a sampling of the path. A part is free along a direction when
none of its pieces against none of the placed pieces is blocked.

**The touch at the seat** (the first thing a naive test gets wrong: at the seat the parts TOUCH, so every direction looks blocked, or a part
slides through the face it rests on). The rule used is the game's own (`collision.ts` `poseFree`): contact is allowed, only sinking deeper than
the SKIN is refused, and a pair already deeper than the skin may only get shallower. So a part resting on a face may slide along it and leave it,
never push into it. *(the audit)* The game applies this step by step; this check uses ONE threshold for the whole ray, `max(skin, the depth
at the seat)` — looser only for a pair deeper than the skin at its seat, and `Scene_2` has none (to re-read before the check runs on another
scene). ⭐ **The skin has ONE home**: `collisionSkinMm` in `gestureConfig.ts`, **0.3 mm on the glass**. It becomes a world length only
through a camera (`collision_wiring.ts` `skinM`): with a camera 1 m away, Babylon's 0.8 rad field of view and a phone's 844 px high view it is
**1.14 mm** in the world — the value used. Run again at 0.3 m (**0.34 mm**) and 3 m (**3.41 mm**): §4.

**The opening of a free direction**: the angle from it to the nearest blocked direction (bisected along the arcs toward the six nearest blocked
samples; it can only read too WIDE, by about half the samples' spacing, 4° — an estimate, not measured). A **region** = free directions joined to each other. **NARROW** = the widest
opening under **10°** — the study's threshold, NOT a decided game constant (B4 names a "small set" without a figure: the owner's word is owed).

**The pre-insertion pose** (where the set is narrow; §2.5: *"the part withdrawn along it until it first clears the placed set"*): along the free
direction, the placed pieces the part passes BESIDE (within **10 mm** of its swept volume — the study's figure, larger than the fits here, smaller
than a part), and the travel after which the part lies wholly beyond every one of them. That travel is compared with each ghost's authored
`plunge` (the depth from the ghost at the mouth to the seat).

## 3. The table, per part (skin 1.14 mm)

`share`: the 642 samples that are free. `widest`: the widest opening. `mouth`: the travel to the pre-insertion pose along the plan's way in.

| part | stage · placed | share | widest | flag | the plan's way in (withdrawal) | free? | mouth | ghost: authored plunge → computed |
|---|---|---|---|---|---|---|---|---|
| E02 lower case | 1 · E01 | 50.16 % | 90.1° | open | step 1, down onto the plinth (+y) | free, opening 90.1° | 0 mm | — |
| E03 crankshaft | 2 · E01–E02 | 8.88 % | 30.5° | open | step 2, straight down into the saddles (+y) | free, 22.2° | 27.1 mm | `UFM_E02_GHOST_crank` 25.1 → 27.1 (**+2.1**) |
| E04 upper case | 3 · E01–E03 | 9.03 % | 27.6° | open | step 3, straight down (+y) | free, 22.2° | 27.1 mm | — |
| E05 bank A | 4 · E01–E04 | 43.46 % | 75.5° | open | along the bank's axis (0, 0.5, −0.866) | free, 64.1° | 0 mm | slope ghost: a bridge, no plunge |
| E06 bank B | 5 · E01–E05 | 43.46 % | 75.6° | open | along the bank's axis (0, 0.5, 0.866) | free, 64.1° | 0 mm | slope ghost: a bridge, no plunge |
| E07 piston A1 | 6 · E01–E06 | **0 %** | **2.7°** | **NARROW** | down its bore (0, 0.5, −0.866) | free, 2.7° | 180.9 mm | `UFM_E05_GHOST_A1` 191.0 → 180.9 (**−10.1**) |
| E08 piston A2 | 7 · E01–E07 | **0 %** | **1.9°** | **NARROW** | down its bore | free, 1.9° | 209.9 mm | `UFM_E05_GHOST_A2` 219.7 → 209.9 (**−9.8**) |
| E09 piston A3 | 8 · E01–E08 | **0 %** | **2.7°** | **NARROW** | down its bore | free, 2.7° | 180.9 mm | `UFM_E05_GHOST_A3` 191.0 → 180.9 (**−10.1**) |
| E10 piston B1 | 9 · E01–E09 | **0 %** | **2.7°** | **NARROW** | down its bore (0, 0.5, 0.866) | free, 2.7° | 180.9 mm | `UFM_E06_GHOST_B1` 191.0 → 180.9 (**−10.1**) |
| E11 piston B2 | 10 · E01–E10 | **0 %** | **2.7°** | **NARROW** | down its bore | free, 2.7° | 180.9 mm | `UFM_E06_GHOST_B2` 191.0 → 180.9 (**−10.1**) |
| E12 piston B3 | 11 · E01–E11 | **0 %** | **1.9°** | **NARROW** | down its bore | free, 1.9° | 209.9 mm | `UFM_E06_GHOST_B3` 219.7 → 209.9 (**−9.8**) |
| E13 head A | 12 · E01–E12 | 50.62 % | 90.2° | open | along the bank's axis, onto the deck | free, 90.2° | 0 mm | `UFM_E05_GHOST_valves` 16.6 → **0** (nothing beside it) |
| E14 head B | 13 · E01–E13 | 50.62 % | 90.2° | open | along the bank's axis, onto the deck | free, 90.2° | 0 mm | `UFM_E06_GHOST_valves` 16.6 → **0** |
| E15 exhaust A | 14 · E01–E14 | 27.57 % | 37.8° | open | straight down onto the head's top face | free, **7.5°** | 37.6 mm | — |
| E16 exhaust B | 15 · E01–E15 | 26.79 % | 36.7° | open | straight down onto the head's top face | free, **7.5°** | 37.6 mm | — |
| E17 pulley | 16 · E01–E16 | 38.32 % | 65.3° | open | along the crank's axis, from the front (+x) | free, 43.0° | 0 mm | — |

Each set is ONE region (no part has two separate ways in at this skin), so its narrowest opening is its widest. The pistons' pre-insertion poses (the part's origin, scene frame,
reference units): E07 (−0.900, 2.316, −1.983), E08 (−0.100, 2.311, −1.976), E09 (0.700, 2.316, −1.983), E10 (−0.700, 2.316, 1.983),
E11 (0.100, 2.316, 1.983), E12 (0.900, 2.311, 1.976) — each beyond its bank's collision pieces.

## 4. The checks behind the figures

**Self-checks (14, all passed; the script exits 1 if one fails; run at a 0.3 mm world skin, the study's).** Known answers: a cube resting on a plate — **50.0 %**, free +x +y +z −x −z,
blocked −y, its pre-insertion along +y 0 mm and along +x 550 mm (off the plate's edge); a block in a zero-clearance channel — 0.0 % and exactly +y,
+z, −z (at the skin, a free region's centre leans at most asin(skin / 10 mm) off the channel's plane); the walls overlapping it by half the skin —
the same; by twice the skin — the same directions, the 2 overlaps REPORTED; a tile 0.5 mm thick withdrawn up past a 0.5 mm slab 2.1 m above — blocked (a time step of 2 mm
jumps it); the slab 0.1 mm aside — free; a tile lying on a 30° ramp (a slanted hull, not a box) — 45–55 % of the sphere, its normal and the slope's two
directions free, into the ramp blocked. ⭐ **The study's own answers, by the study's code (`goalCheck`, boxes) and by this one, on the same
samples**: **L05 0.8 % and +y, +z exactly; L03 0 % and +y alone (its mouth 40.0 mm: the pocket's depth); Q07 EMPTY; L19 50 %** — identical.

**A second implementation, on the real pieces.** Each pair's obstacle built again by the separating-axis construction (the pieces' face normals
and the cross products of their edges: Gottschalk, Lin, Manocha 1996) instead of a hull: 1 243 of the 7 859 pairs (every pair in contact at a seat,
and one in seven of the others) × 60 directions × 4 points along each — **0 verdicts differ**, 0 points inside one shape and outside the other; inside both, the depths
agree to **0.0001 mm** (8.8e-5 mm). The game's own GJK (`collision_shape.ts` `gapBetween`) against this code on
"apart / touching" at every seat: **0 disagreements**.

**Mutants of `entry_geom.ts`, each turned RED by the self-checks** (run with `SELF=1`; the runner was a scratch file): the seat's own depth
ignored (1 red), no contact tolerance (10), the withdrawal tested at its end only (11), a time-stepped sweep of 5 mm (1) and of 2 mm (1), the
pre-insertion read from the part's front (2), the facet test's sign swapped (11). ⚠ Both time-stepped sweeps first SURVIVED: the part
withdrawn was a 100 mm cube (so the obstacle on its path was 100.5 mm long, not 0.5), then the slab sat at a multiple of the step; with a tile
0.5 mm thick and the slab at 2 101.3 mm both went red.

**Two runs, byte-identical** (the JSON and the text, with the three skins). **Time, measured**: one skin 84 s (cross-checks 50 s, the run 33 s);
the three skins 148 s and 171 s — ⚠ close to the 3-minute bound of this PC's load rule; one process, while another chain's tests ran.

**The skin's sensitivity** (the verdicts at the three skins — NONE changes: no goal shut, the plan's way in free for all, the same six NARROW):

| part | camera 0.3 m · skin 0.34 mm | camera 1 m · skin 1.14 mm (above) | camera 3 m · skin 3.41 mm |
|---|---|---|---|
| E02 | 50.0 % · 90.0° | 50.2 % · 90.1° | 50.3 % · 90.4° |
| E03 / E04 | 6.7 / 6.9 % · 23.6 / 22.9° | 8.9 / 9.0 % · 30.5 / 27.6° | 16.7 / 16.7 % · 38.2 / 37.7° |
| E05 / E06 | 43.3 / 43.2 % · 75° | 43.5 / 43.5 % · 75.5° | 44.2 / 44.6 % · 76° |
| pistons (4 / E08, E12) | 0 % · 2.0° / 1.4° | 0 % · 2.7° / 1.9° | 0 – 0.3 % · 3.9 – 4.1° / 3.2 – 3.3° |
| E13 / E14 | 50.3 % · 90.1° | 50.6 % · 90.2° | 51.7 / 51.6 % · 90.6° |
| E15 / E16 | 26.0 / 25.4 % · 36.4 / 35.4° | 27.6 / 26.8 % · 37.8 / 36.7° | 29.9 / 30.7 % · 41.1 / 40.6° |
| E17 | 37.2 % · 64.5° | 38.3 % · 65.3° | 40.0 % · 67.2° |

The crankshaft's and the upper case's sets grow most with the skin (6.7 % → 16.7 %): their fit in the saddles and half-holes is within a few
millimetres, so how much sinking the game tolerates decides how far off the vertical they may come in.

## 5. How to rerun

```
npx vite-node scripts/surface/scene2_entries.ts                        # one skin (camera 1 m), about 85 s
SENS=1 OUT=<folder> npx vite-node scripts/surface/scene2_entries.ts     # + the skins at 0.3 m and 3 m, 150 – 170 s
SELF=1 npx vite-node scripts/surface/scene2_entries.ts                 # the self-checks alone, a few seconds
```

`OUT` defaults to the system's temp folder (`scene2_entries/`): `scene2_entries.json` (everything) and `scene2_entries.txt` (the table, each
part's detail). `CAM_M=<metres>` changes the camera the skin is read at. The code: `scripts/surface/entry_geom.ts` (the geometry),
`entry_selfcheck.ts` (the self-checks), `scene2_entries.ts` (the run). It imports the study's sphere size, its shapes and its `goalCheck` from
`scripts/probes/surface_study/` (imports only: nothing there is run by path).

## 6. THE FINDINGS FOR THE OWNER

1. **Every goal can be reached at its stage, along the way the plan says.** None is shut (no EMPTY set), and the plan's straight way in is free for
   every one (a way in that needs a turn is not looked at, §7). The answer of 2026-11-17 (*"the entry-set check on Scene_2's real parts before the first surface build"*) is: it passes.
2. **The narrow goals are exactly the six pistons** — 1.9° to 2.7° round their bore's axis, nothing else free. That is the plan's ONE axis (§2.6).
   They are the goals that need the ghost and the plunge (§2.5), as authored. The ten others are wide: the gizmo's landing, the approach and the
   goal capture can place them from a broad cone of directions.
3. **The ghosts and the collision pieces disagree by the gap between each part's seat marker and its collision pieces** (pistons 10 mm, heads
   17 mm, crankshaft 2 mm). Which one is right is a question for the owner, NOT answered here: either the `UCX_` pieces stop short of what the
   part really is (the pistons' big-end tips, the heads' valve heads below the slab — §6.2 of the plan gives the heads' collision as "the slab, and
   ONE piece per valve ABOVE it"), or the markers and ghosts are deeper than the solid. ⚠ Not inspected: the render meshes were not read.
   Consequence either way: the plunge's depth (from the ghost) and the collision's own contact (from the `UCX_`) end 10 to 17 mm apart.
4. **Two pistons touch nothing at their seat** (E07, E10: their nearest placed piece 1.4 mm away, the skin 1.14 mm) — the other four touch the
   crankshaft. Whether the big end should rest on its pin is the plan's (§2.6: *"lands on its pin like a fork on a bar"*); here it does not, by
   1.4 mm, for two of six. It does not close any way in.
5. **The exhausts' plan direction is near the EDGE of their set**: straight down the head's normal is free, but only 7.5° from a blocked
   direction; the set's most open direction (37.8° of opening) is (0.42, −0.21, −0.88) for E15 — sideways off the head, a little down. A player coming from above at a slant may be
   stopped where one coming from the side is not. Nothing to fix by itself — a fact for the landing map (S1, B3) to read.
6. **The crankshaft and the upper case have the smallest wide sets** (8.9 % and 9.0 %, about 28°–30° round the vertical): the saddles and the
   half-holes. Not narrow by the 10° threshold; a player must come from near above.
7. **The thresholds used are the study's, not the game's**: NARROW < 10° and BESIDE 10 mm. Both want the owner's word before B4 is built (B4
   names a "small set" without a figure).

## 7. What this check cannot see

* **Whether the union of the `UCX_` pieces is faithful to the drawn mesh** — finding 3 is the first sign it may not be; B1 (§7bis) is the check
  for it, not built.
* **Ways in that need a TURN** — the set is of straight translations only, with the part kept at its goal's orientation.
* **Whether the GIZMO can bring the piece to where a free slide starts** — the owner's answer 2 (2026-11-17): not now; it needs the landing map
  (S1, B3).
* **Parts that move once placed** (the crankshaft's turn at the level's end, the rods on their hinge): each part is taken at its goal pose.
* **Other orders of the plan** — only its main order (E02 … E17) was run; the two banks' sides swapped, or the pulley earlier, are not checked.
* **The floor and the play volume** — only placed parts block; the scene's floor (under the plinth) and the play volume's walls are not in the
  placed set. ⚠ Not checked in the live game: on this branch's code the ORBITED piece's collision exempts every FROZEN body
  (`collision_wiring.ts` `pieceCollisionSetup`), and the plinth E01 is frozen.
* **Directions between the samples** are read only through the opening's bisection (at most about 4° off); the exact directions are the face
  normals, the plan's and the ghosts' — an edge direction of a slot that is no face normal would be missed.

## 8. The audit (2026-11-17, an independent Opus auditor — PASS, no blocker)

* **Rerun**: the self-checks 14 / 14; the full run's JSON byte-identical to the builder's.
* **A brute force of its own** (written apart: each obstacle's faces by enumerating triplets of points, its own ray test, its own skin arithmetic —
  1.136 mm): E02 322 / 642 = 50.16 % and E03 57 / 642 = 8.88 %, sample for sample; the pistons E07 and E08 free at 0 of 642 samples and 0 of 3 000
  random directions, their bore free, openings 2.67° and 1.87° (above: 2.7°, 1.9°); the markers 10.07, 9.80 and −2.06 mm beyond the `UCX_` pieces
  (above: 10.1, 9.8, −2.1); the crankshaft's opening at least 22.10° over 72 azimuths (above: 22.2°). A sweep in steps of 0.02 mm to 260 mm along
  each plan direction never came within the skin of a block.
* **Three mutants of its own**, each red, each undone. The new-files-only rule kept; no process left.
* **Its remarks** (none blocks): the two notes marked *(the audit)* in §2; the skin's world length rests on an assumed camera (1 m; no field-of-view
  override found in `src/render`; the game's camera distance in contact range is not established — §4's three skins change no verdict); nothing in
  the gate covers `scripts/surface/` (it is outside `tsconfig`: the typecheck and the mutant runner were scratch files); the builder once ran two of
  its own processes together for about 2 minutes, against the one-process rule.

## 9. The review (Fable, 2026-11-17) — how the findings are handled

* **Findings 1, 2**: the answer to the owner's question — the check passes; the pistons are the goals that need the ghost and the PLUNGE.
* **Findings 3, 4** (the ghosts and markers against the collision pieces: 10, 17, 2 mm; two pistons 1.4 mm off their pin): NOT a blocker for the
  surface. ⚠ A reading, NOT measured: the heads' 17 mm follows the plan as quoted in finding 3 (the valve heads below the slab are left out of the
  collision, the ghost clears them). What settles it is ONE measurement — each marker against the drawn mesh and the `UCX_` pieces along the way in
  (B1, or offline from the `.glb`'s render meshes) — to make BEFORE the plunge is built (`QUEUE.md`: owed).
* **Finding 7** (NARROW under 10°, BESIDE 10 mm): the owner's word is owed with B4, not before.
* ⚠ **§7's last-but-one point, read in the code and not in the game**: the orbited piece's collision exempts every FROZEN body
  (`collision_wiring.ts` `pieceCollisionSetup` — the owner's choice of 2026-10-13, made for the floor the rings pass under). `Scene_2`'s plinth is
  frozen: whether a held part passes through it in the pick-up flow is to be checked there.
