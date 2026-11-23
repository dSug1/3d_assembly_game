# THE PARTS' CHECKS, THE GAME'S SIDE — B1 solids, B2 exposed per stage (package S5, designed 2026-11-23)

> **STATUS** · ⭐ **DESIGNED 2026-11-23** on his word *"Game side first"* (the build list's item 3, `ORBIT_SURFACE.md` §6 (3), §7bis; asked because the
> Blender build scripts — `Assets/Blender/scripts/build_<scene>.py`, `PART_AUTHORING.md` §4.1 — are not in this repository). The checks are his of
> 2026-11-16 (Q7, `ORBIT_SURFACE.md` §7bis.3, `PART_AUTHORING.md` §6); the choices they leave open are made in §6 and may be reversed on his look.
> ⭐ **His word during the design (2026-11-23):** *"i already know there is an issue with the plinth in scene 2 as the proxy face is not complete. Make
> sure the same is detected by your scripts."* → B1h (§2): a proxy face COMPLETE on the solid face it lies on — the plinth its control on the real file.
> **OWNS** · S5: the game's re-verification of B1 and B2 on a scene's exported `.glb` — what each tests, its numbers, its controls, where it runs.
> **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §7bis.3 – §7bis.5; [`PART_AUTHORING.md`](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) §4.2, §6;
> [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §8 (the ledger). Code read on `89be87bb`.

## 1. In one paragraph

The specification runs B1 – B6 in Blender at each build step (painted, a verdict line, the run failed) and RE-VERIFIES them in the game. The Blender
side waits for the build scripts; this package builds the game's side for the two checks that need no Blender: **B1** (each part's solids — its
collision pieces convex, closed, with volume, within the simplicity budget; its face proxy planar, on its solids, facing out) as a pure `src/core`
function on the parsed `.glb`, and **B2** (per stage of the plan, which proxy faces the outside reaches — the others glued, buried or sealed) as a
pure function on a coarse grid. Each runs as a VECTOR on `Scene_2`'s committed `.glb`, each shown failing on a planted defect first. **B4** exists
already as an offline tool (S0: `scripts/surface/check_parts_reach_their_seat.ts`, `ORBIT_SURFACE_SCENE2_ENTRIES.md`): not rebuilt here.

## 2. B1 — the solids (S25 restated)

Per part (`readModelCatalog` + `partGeometry` / `partFaces`, `glb_geometry.ts` — the game's own readers), in the part's frame, in MILLIMETRES (the
reference's units × `unitM`):

| test | how | fails when |
|---|---|---|
| **B1a convex** | each `UCX_` piece's points against its own hull (`convexHull3`): every point on the hull within `B1_TOL_MM` | a point inside its hull by more (a dent — the piece is not its hull) |
| **B1b closed** | the piece's triangles (the mesh's indices): every edge shared by exactly two triangles | a boundary edge or a non-manifold edge |
| **B1c volume** | its hull's volume | ≤ the volume of a `B1_TOL_MM` cube (a flat or degenerate piece) |
| **B1d simple** | its vertices, its triangles | > 24 vertices or > 48 triangles (`PART_AUTHORING.md` §4.2, COLLISION SIMPLICITY — the constants' one home: `part_checks.ts`) |
| **B1e on its solids** | each proxy (`UFM_`) triangle's corners and centroid: their distance to the SURFACE of the union of the part's pieces (the nearest hull face of the piece containing it, or outside all) | farther than the fit tolerance (§6 D2), unless the part's `extras.fit_tol` says more (the bores — `PART_AUTHORING.md` §6) |
| **B1f outward** | each proxy triangle's centroid moved `B1_TOL_MM` along its normal: outside every piece; moved back: inside or on one | the front point inside a piece (the face looks into its solid) |
| ~~B1g planar~~ | ⛔ DROPPED at the first run: a `UFM_` node is a SET of faces (`UFM_E02_outer` a whole outer surface, "bent" 180°), and a triangle export has no non-planar face to find | — |
| ⭐ **B1h complete** (his word, the plinth) | a proxy is PARTIAL by design (a piston's is its resting face, the plinth's its top): each hull face of the solids the proxy LIES ON (a sample under a proxy triangle of the same normal, within 1°) sampled — along its edges every 2 mm, inside on a grid — and every sample under the proxy, within the fit | samples not under it: reported apart as a STRIP along the face's edges and a HOLE inside it, each with its box |

The ghosts' rims (B1's last clause) are S0's and B4's: not here (§7).

## 3. B2 — exposed per stage (S22)

Per stage of the plan (the order the `.glb` gives — `step`, then the id; a frozen part placed from the start, as S0 reads it): the placed parts'
pieces at their goals (`partGeometry`'s `goal`) voxelized on a grid of step `B2_STEP_MM` over their box grown by two cells; the OUTSIDE flooded from
the box's border (6-neighbour) through the empty cells; each placed part's proxy face, sampled (its triangles' centroids and corners, set back
`B2_STEP_MM` / 2 along its normal), read as:
* **exposed** — a sample's cell is flooded outside;
* **glued** — its samples' cells are inside ANOTHER part's piece (a face pressed on a neighbour: S22's "glued");
* **buried / sealed** — neither: the cells empty but not reached (a cavity the parts close: sealed), or inside its own part's other piece (buried).
The output is a MAP (the spec's pass rule: none — *"it replaces 'exposed = not glued' in the plan's rule 4"*): counts per stage and per part, and a
list of the faces that change state at a stage (a seat that seals a face — S19's relocation, C46). The vector pins `Scene_2`'s map (golden) and its
controls.

## 4. Where it runs

* **`src/core/part_checks.ts`** (new, engine-free): `checkSolids(json, bin, catalog) → B1Report`, `exposedPerStage(json, bin, catalog, opts) →
  B2Map`. Pure.
* **The vectors** `tests/part_checks.test.ts`: on `Scene_2`'s `.glb` (`Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb`): B1's report
  (its findings, named) and B2's map pinned; each test's CONTROL a planted defect in a copy of the parsed file (a piece dented, a triangle removed, a
  flattened piece, a dense piece, a proxy moved off by 2 × the tolerance, a proxy flipped, a proxy bent; for B2 a face glued, a cavity sealed) —
  each must read red, *"a check never seen failing is not trusted"*.
* **At load** (`model_import.ts`, beside `readModelCatalog`): B1 run and its findings PRINTED (the console, named) — ⛔ NOT a refusal in this package
  (§6 D1). B2 never at load (the spec: a vector).

## 5. Obstacles

| obstacle | the answer |
|---|---|
| `Scene_2` may FAIL B1 today (the bores' fit, a piece over budget) | the vector pins its report as found; each finding goes to the ledger for his word — the file is fixed in Blender, or an exemption is written per piece |
| B2's grid: fine enough for `Scene_2`'s gaps, cheap enough for a vector | the step measured on the file (its box, the cost of one stage's flood) before it is fixed; a gap under a step reads closed — said in the map |
| the frame: a `.glb` is in reference units, the tolerances in mm | `unitM` read from the catalog; every threshold in mm, converted once |
| B4 already exists | reused, not rebuilt; its own vector stays the S0 tool's self-checks (owed: the ledger) |

## 6. Decisions made here (reversible on his look)

* **D1** at load B1 PRINTS, never refuses — until `Scene_2` passes or its findings are answered (a refusal would stop his scene loading).
* **D2** the fit tolerance **0.5 mm** (`SURFACE_STEP_MIN_MM`, Q6's step — the noise family's first member), a part's `extras.fit_tol` (mm) above it.
* **D3** `B1_TOL_MM` = 0.01 mm (the geometric noise of an export; the hull's own tolerance).
* **D4** B2's step: measured first (§5), proposed 2 mm.

## 7. Not in this package

The Blender side (painting, verdict lines, the failed run — the build scripts); B3, B5, B6; the ghosts' rims; B4's vector at W4 / W5 (S0's tool
exists); `Scene_1` and `Scene_0bis` (their parts are data, not a `.glb`: their convexity is C4 — the ledger's row 10, its own check).

## 8. As built — B1 (2026-11-23; B2 next)

**The files.** `src/core/part_checks.ts` (new): `readPartSolids` (each part's `UCX_` pieces and `UFM_` proxy nodes, node by node, in the part's frame,
in mm — the same walk as `glb_geometry.ts`, checked against the game's own readers on E01, E03, E07: identical boxes), `checkSolids` (B1a – B1f,
B1h), the budget and tolerances' one home; `glb_geometry.ts` exports `nodePlacement`. `tests/part_checks.test.ts` (12). `unwired_debt.test.ts`:
`checkSolids`, `readPartSolids` declared (vectors; at load owed — D1). **5 s** for `Scene_2`'s 17 parts on this PC (B1h the heavy part).

**Departures.** (1) B1g dropped (§2: a `UFM_` node is a set of faces). (2) B1h redefined at the first run: the first version read "the proxy covers
its solids" and flagged every part — a proxy is PARTIAL by design; B1h reads only the solid faces the proxy lies on. (3) The coverage's inside
samples a 40 × 40 grid a face, its edges every 2 mm; a face is "lain on" if one sample in five is under the proxy.

**⭐ `Scene_2`'s report — 21 findings, each for his word** (the file fixed in Blender, an exemption written per piece, or the rule changed):

| part | finding | what it says |
|---|---|---|
| ⭐ **E01 the plinth** | **B1h** 12.8 % of its top not under its proxy — **a HOLE**: the proxy is a rounded rectangle on a square collision top, its four corners cut (~24 × 32 mm each), set in ~2 mm all round; **B1e** its proxy 1.42 mm off the collision top | ⭐ **his known issue — DETECTED** (his word: *"Make sure the same is detected"*) |
| E02, E04, E05, E06 | **B1e** the outer proxies off their collision pieces: up to 2.7 mm (E02), 12.3 mm (E05, E06), 42 mm (E04) — the median 0 – 12 mm | the collision pieces do not follow the drawn surface (the ledger's row 3, S0's finding 3: *"the collision pieces follow the drawn part"*) |
| E03, E07 – E14 | **B1e** each resting face's proxy 16.6 – 36.8 mm off its collision pieces | the same family: the resting face above / beside the pieces |
| E03, E13, E14 | **B1h** a hole inside the face the proxy lies on (E03 its nose, 0.2 %; E13, E14 3.4 %) | small proxies' gaps |
| E17 | **B1f** 22 of its 44 proxy triangles face INTO its solid; **B1e** 2.1 mm off; **B1h** 5 % | half its proxy turned inward (a doubled, flipped copy?) |
| all | B1a – B1d: none | the collision pieces are convex, closed, with volume, within the budget |

**The vectors**, each RED on its mutant first (one at a time, the file run, reverted): B1h skipped (*"the plinth's incomplete proxy must be found:
expected undefined to be defined"*); B1h's hole read as a strip (*"expected '1627 of 12668 …' to match /INSIDE the faces/"*); B1a, B1b, B1d blind
(*"expected [] to deeply equal [ 'B1a' ]"* …); B1e at any distance; B1f on the wrong side. The controls (V2): a clean part passes; a dent, a missing
triangle, a flat piece, a dense piece, a lifted proxy, a flipped proxy, a cut corner (a hole), a set-in proxy (a strip) — each exactly its check.
**G0** `npm run verify`: 193 files / 2392 tests.

**His reading of the plinth, checked (2026-11-23):** *"I believe the issue is that the proxy is not a closed mesh but a quad: check that."* —
CONFIRMED: `UFM_E01_top` is ONE open flat face (36 vertices, 34 triangles, one normal, 36 boundary edges — a rounded 36-sided outline), its top
only: no side, no bottom. ⚠ No proxy of `Scene_2` is closed: each is a SET of the part's faces by the convention so far (a piston's its resting
quad — its sides end inside its cylinder; E02's its outer surface). What the plinth lacks is its four SIDES, which the outside reaches. ⭐ The rule
proposed (D7, `PART_AUTHORING.md` §6.4): the proxy covers every face of the part the outside reaches at some stage — B2's map tells which; its check
B1i = B2 × B1h, built with B2. **The lessons** → D4 – D7 (`PART_AUTHORING.md` §6.4), the Blender build's per-run table (§4.2), `SCENE_WORKFLOW.md`
§7.3 (B1 built; the check script) and §9.1 (a check calibrated on the real file and the owner's known defect), the ledger's rows 14 – 16.
**The check script**: `npx vite-node scripts/surface/check_part_solids.ts -- <scene.glb>` (exit 0 PASS, 1 findings) — `Scene_2`: FAIL, 21.
