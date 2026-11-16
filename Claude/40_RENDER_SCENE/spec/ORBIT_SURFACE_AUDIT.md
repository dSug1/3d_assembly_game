# THE ORBIT'S SURFACE — the audit of what is built, the errata, the prior art (companion of ORBIT_SURFACE.md, 2026-11-16)

> ⛔⛔ **PROPOSED, FOR THE OWNER'S REVIEW. NOTHING BUILT, NO CODE CHANGED.** Moved out of [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §7 and §9 at its
> second revision (2026-11-16, the owner's feedback), so that the specification stays under its line budget. The weaknesses WS1 – WS25 keep
> their numbers; the specification cites them. Code references are `file:line` on `1190db2` (the first version's reading).

## 1. THE WEAKNESSES OF WHAT IS BUILT (WS1 – WS25)

Read, not run (the PC is busy; nothing here was reproduced). PLAUSIBLE = a conflict the code allows, no scene shown to hit it.

| # | weakness | where | kind |
|---|---|---|---|
| **WS1** | **Four notions of surface, never reconciled**: the contour (layout), the stacks (depth classes), the cast (real depth), the convex support and collision. The atlas knows nothing of voids: a chart can call a place "surface" where the cast finds a floor far below | `orbit_charts.ts:121`; `face_map.ts:967`; `assembly_wiring.ts:208`; `footprint.ts:25` | several notions |
| **WS2** | **Proxy vs collision**: the face map, cast, shell and support read the `UFM_` proxy; collision reads `UCX_`. No check that they agree | `model_bodies_wiring.ts:111-130`; `core/collision.ts:59` | several notions (PLAUSIBLE on `Scene_2`) |
| **WS3** | **The support fills slots**: each part's proxy is ONE convex hull for the piece's support, so over a concave part's slot the support is the hull's top while `stackDepthAt` sends the gizmo to the slot floor | `footprint.ts:25-33`; `assembly_wiring.ts:808` | several notions (PLAUSIBLE, concave parts) |
| **WS4** | **A gap open both ways with no floor**: neither bridged nor entered — the gizmo goes to the nearest group's depth, `inside: false`, no cast: in the air beside the face | `face_map.ts:1003-1010` | fallback loophole (islands, C9) |
| **WS5** | **The piece-fit rule only with a floor**: a closed void with no floor is bridged whatever its width — a gap a piece could pass through is bridged; a void with a floor the piece fits is entered. The asymmetry is the owner's S7, but its reason is not stated for wide floorless gaps | `face_map.ts:991, 999` | rule gap |
| **WS6** | **Three answers for a hole a part goes into** (S5 real floor, S13 ghost at the mouth, approach to contact); ghosts are drawn only, no rule reads them | `model_import.ts:10`; `PART_AUTHORING.md` §3 | rule conflict, latent |
| **WS7** | **Regions are bounding rectangles**: triangles and slanted outlines over-fill, so a hole in one face (C19) and a non-rectangular face's "real" area are wrong; the same limit in the contact readout | `face_map.ts:482-486`; `src/input/contact.ts:197` | blind spot (every part a box today) |
| **WS8** | **Duplicated tolerances** (rule 3): `COPLANAR_M` and `OUTLINE_GROW_M` copy `MAP_COPLANAR_M` and `MAP_GROW_M`; six "coplanar" angles (20°, 1°, ≈ 1.15°, 2°, 2.6°, 0.5°); the merge angle itself twice — `MAP_AXIS_DEG = 20` and the slider default `facetMergeDeg: 20` | `contact_wiring.ts:68, 174`; `face_map.ts:30, 32, 34`; `gestureConfig.ts:888` | rule 3 |
| **WS9** | **`MAP_GROW_M` is Scene_1's construction gap** (3 mm joints) inside the general definition: a scene with 4 mm joints sees grooves | `face_map.ts:34` | scene constant in the rule |
| **WS10** | **The held footprint is the drawn mesh's own box** (two smallest sizes, any way round), not the resting face's footprint in the facet's axes: a piece turned on the surface is judged by its smallest sizes | `assembly_wiring.ts:926-933` | approximation |
| **WS11** | **The contact readout includes loose parts**: `coplanarFaces` skips orbited and frozen bodies but not unplaced ones, while the face map keeps only goal-locked parts. Display only | `contact_wiring.ts:69-72` vs `assembly_wiring.ts:909` | several notions (display) |
| **WS12** | **The mouth's hold is path-dependent** — the one place the gizmo is not a function of the place | `assembly_wiring.ts:1213-1215`; `orbit_tilt.ts:290` | patch beside S18 (W9) |
| **WS13** | **The concave edge is not an edge**: excluded from the crossing event, folded as a depth step — a gap at the mouth (O11); at `Scene_1`'s notches it is the owner's decision (D-S12) | `free_face.ts:240` | rule gap at the mouth (O11) |
| **WS14** | **The map is rebuilt mid-orbit, and the frames' maps may differ**: at every automatic tilt and every polar-zone switch, `faceMapOf` re-runs `buildFaceMap` on the turned faces and box, keyed `#T<tilt>` / `#Z<zone>` — while the finger orbits. A looser box, other seeds, other D5 survivors can give a different contour than the world's; the atlas assumes the same one; nothing checks it | `assembly_wiring.ts:868-880`; `orbit_tilt.ts:201`; `orbit_charts.ts:118-119` | several notions (PLAUSIBLE) — S19 (ii) |
| **WS15** | **Tie-breaks by order**: seeds by area first-wins, the main group's tie to the frontmost | `face_map.ts:536, 629-630` | determinism risk |
| **WS16** | **`placedBox` reads the drawn meshes** (the centre, the radius) — the one exception to S3, the owner's open decision (inventory F.10) | `ORBIT_CHARTS.md` §4.5 | S3 exception |
| **WS17** | **Dead and legacy paths**: dead — the edge blend (`MAP_OPTS` 0 / 0), the ring chart (not wired); legacy — the zone detectors under `chartLayout 0`, still reachable from the slider and the replay's bit-for-bit reference since both switches went ON by default (`RND5.md`, 2026-11-16) | `assembly_wiring.ts:855`; `ring_chart.ts:3` | to delete at step 2.5 |
| **WS18** | **No non-convex test shape**: every chart vector is a convex solid; `void_sim` covers a plate without solver, band or offset piece | `tests/helpers/chart_shapes.ts:2`; `scripts/probes/void_sim.ts` | coverage |
| **WS19** *(review)* | **"Exposed" is "not glued"**: only a coplanar opposite face removes a face; a face buried in another part's material (C27), or shut in a sealed cavity (C26), stays in the map — in the shares, the seeds, the facets | `face_map.ts:488-496` (the covers: another part's face, opposite, within `MAP_COPLANAR_M`), `:515-534` (`exposedRects`); `:474`, `:627-630` (every fed face in the stacks and the seeds) | rule gap |
| **WS20** *(review)* | **No ruler for what stands out**: a void has the piece as its ruler (S8); a protrusion of any width is climbed (C11, C33) | `face_map.ts:980` (the void rules skipped where a group in front holds the point), `:1003` (the frontmost group, no size test); `pieceEnters` read only for a void with a floor (`:999`) | asymmetric rule |
| **WS21** *(review)* | **The keep rule before the piece's closing**: D5's share reads the MAIN group's region — grown 1.6 mm, its enclosed holes closed whatever their size — not the real area, and not the piece's closing (S8): an open-ended porous face the piece treats as solid (a comb, studs: C34) can lose its facet, while a hole inside a frame the piece could enter counts as face | `face_map.ts:644-651` (the D5 keep), `:537-543` (`mainOf`), `:312-317` (`regionArea`, the filled cells), `:173-224` (`filledRegion`) | order of rules |
| **WS22** *(review)* | **A floor is a group within 20° of the facet, at its centre's level**: an inclined floor within 20° is a floor and the cast reads its slope; beyond 20° it is no floor — a closed void over it is bridged, an open one falls to the nearest plane with no cast (C31); the fit is read at the plane only, never per level | `face_map.ts:474-478`, `:988`, `:991`, `:1004-1010`, `:1021` | blind spot |
| **WS23** *(review)* | **No depth ruler**: between the coplanar 0.5 mm and the glide's 5 mm a step is a jump with no event (C36) | `face_map.ts:32`; `orbit_tilt.ts:642` | missing constant |
| **WS24** *(review)* | **Nothing checks the purpose**: no list of the faces that are no place, no check that each goal is reachable at each stage (S21, S24) | — | missing check |
| **WS25** *(review)* | **An empty placed set** (C42): handled by default, not by a rule — no box, no map, the gizmo held or at the boot centre; no scene boots empty today, the set is empty only with `lockPlacedPieces` at 0 | `orbit_shell.ts:26-33`; `assembly_wiring.ts:94-96, 873, 949, 1242`; `goal_lock.ts:22` | blind spot |

The patches beside a rule, as their own comments record them (each became a sentence of a rule later; the risk is the ones still standing alone):
R1 glued faces (`face_map.ts:512`), the rims' 1.6 mm (`:176`), R2's clip (`:584`), R3's grazing cast (`:1086`), the map's catch-up hold
(`:415`), the ridge tie and the cap rule (`:654-664`), D3 amended twice (`:956-1000`), the mouth's "build b" (`:989`), the support's
"a drop only where the piece fits" (`assembly_wiring.ts:769`).

## 2. ERRATA — what the first version of ORBIT_SURFACE.md said wrong (found by the code reader of the second revision, `1.0.146-Orbit-charts`)

1. **The slide was named as a live way** (§1.2, S21, the S21 tension, C25, C45, OS13, OS16, D-S15). The slide was REMOVED (`CLOSE_IN_CONTACT.md`
   §1, §4, §10). A piece is seated by the orbit close in (the goal capture runs during the orbit, `LEVEL_END.md` §5quater), by the approach
   (A + dy), or by the plunge (specified, not built). Fixed in the revision.
2. **"The 60 mm shell"** (§1.3): the shell lies at `max(d, 60 mm)` round the placed parts' bounding BOX; 60 mm is the offset inside which the foot
   comes down onto the gizmo (`orbit_shell.ts:7-11, 84-88`). Fixed.
3. **"The approach stops on contact" over a bridged void** (the S7 / S8 tension): over a hole wider than the piece the approach stops AT the gizmo
   (distance 0, `assembly_orbit.ts:108-113`) — the piece rests in the air at the mouth's plane. Fixed (P2's "nothing to land on").
4. **"The mouth's hold is the one exception" to S18**: also path or time state — the gizmo read at the piece's SOLVED angles
   (`assembly_wiring.ts:1184`), the map's catch-up hold (`MAP_SYNC_HOLD_M`, `:1198`), the depth glide in time (`asmGOff`, `:1226-1237`), the maps
   per tilt and per zone (`:876`) and the tilt's hold, the support level eased per face (`:713-716`). Fixed (P4).
5. **C43 "left to the contact"** omitted the footprint support and `levelRaise`, which part the gizmo and the piece by design
   (`assembly_wiring.ts:675-694`). Fixed.
6. **"Close in" was never defined**: the depth reaches the piece only inside the shell's 60 mm offset; the tilt and the full gain act from 0.6 m
   (off beyond 0.65 m); the look moves onto the gizmo within 0.3 m; the mouth's hold and the glide act at every distance. Fixed (P1).
7. **S20 called the mouth a concave edge.** On `Scene_1` the edge at the bottom of the mouth is CONVEX: the side face's top lip, at the channel's
   floor (≈ 466 mm), against the floor going back. S20 removed (§2.4 of the specification).
8. **§5.4 left out "the piece's footprint-swept support"** (`HOVER.md` §0 item 21): moot with the slide removed, and a footprint support IS built
   (`footprint.ts`). Fixed.
9. **The orbited piece's goal margins** are 10 mm / 3° (`orbitGoalMm`, `orbitGoalDeg`, `gestureConfig.ts:766-769`); `PICK_AND_PLACE.md` §7 item 1
   and `LEVEL_END.md` §5quater still say 5 mm — not fixed there (those files are not this study's).

## 3. PRIOR ART (generic; patent scopes NOT checked unless said)

* HoverCam (Khan et al. 2005) — excluded: US 8,044,953 B2, US 7,042,449 B2.
* Configuration-space obstacles, Lozano-Pérez 1983 (Minkowski sums).
* Solvent-accessible / solvent-excluded surfaces (MSMS).
* Morphological closing and opening (Serra); surface-only closing, Jacobson et al. 2020; ⚠ US 10,699,492 B2.
* Alpha wrapping, Portaneri et al. 2022 (CGAL `alpha_wrap_3`, GPL).
* CAD defeaturing and virtual topology (COMSOL, Ansys Meshing).
* Variational Shape Approximation, Cohen-Steiner, Alliez, Desbrun 2004.
* Local feature size and the medial axis, Amenta–Bern.
* PolyCube maps, Tarini et al. 2004.
* Gauss–Bonnet on polyhedra, Poincaré–Hopf (direction-field design surveys, Vaxman et al. 2016).
* Convex decomposition V-HACD, CoACD (as a classifier only; a hull as the surface was dropped, Step 4c).
* *(second revision)* Morphological closing (Matheron 1975, Serra 1982); r-hulls and alpha shapes (Edelsbrunner, Kirkpatrick, Seidel 1983;
  Edelsbrunner, Mücke 1994); solvent-accessible surfaces (Richards 1977; Connolly 1983); exact distance transforms (Maurer 2003; Felzenszwalb,
  Huttenlocher 2004).
* *(second revision)* The drop cutter and the Z-map of CAM (the cutter location; OpenCAMLib, LGPL); grey-scale dilation by the tool's height
  function; dexels / the extended z-buffer (Van Hook 1986 — year not verified), tri-dexels, layered depth images (Shade et al. 1998 — not
  verified), depth peeling (Everitt 2001). ⚠ Patents claim dexel-based MACHINING SIMULATION and collision detection (e.g. US 9,117,300,
  US 10,140,395) — scopes NOT checked; keep the representation a plain per-direction depth list.
* *(second revision)* The movement surface from the whole area of overlap, not a single contact point (Oh, Stuerzlinger, GI 2005 — cited by
  `footprint.ts`'s header as the footprint support's source).
* *(second revision)* Visibility maps and accessibility cones (Woo 1994; Spyridi, Requicha 1990 – 1991; Spitz, Spyridi, Requicha 1999);
  straightest geodesics on polyhedra (Polthier, Schmies 1998 — not verified).
* *(second revision)* The god-object / proxy of haptic rendering (Zilles, Salisbury 1995; Ruspini et al. 1997); fine-motion strategies,
  preimages and backprojections (Lozano-Pérez, Mason, Taylor 1984; Erdmann 1986).
* *(second revision)* Cone singularities in parametrization (Kharevych, Springborn, Schröder 2006; Ben-Chen, Gotsman, Bunin 2008; Myles, Zorin
  2012; Soliman, Slepčev, Crane 2018).
* *(second revision)* Peg-in-hole, jamming and wedging, chamfers (Whitney 1982 — not verified); capture regions (Kriegman 1997 — not verified);
  assembly by disassembly, blocking graphs (Wilson 1992; Wilson, Latombe 1994; Halperin, Latombe, Wilson 2000).
* *(second revision)* Persistence (Edelsbrunner, Letscher, Zomorodian 2002 — not verified); local feature size (Amenta, Bern 1999); CAD
  defeaturing by persistent homology (2025, arXiv 2502.10609).
* *(second revision)* Design for assembly (Boothroyd, Dewhurst, Knight): one insertion direction, preferably from above; lead-in chamfers;
  symmetry or obvious asymmetry; no insertion that needs holding or a turn mid-path. Its tables not reached online (not verified).
* *(second revision)* Blender: `bmesh` (`is_manifold`, `is_boundary`, `recalc_face_normals`), the 3D-Print Toolbox (Solid, Intersections,
  Thickness, Overhang), `mathutils.bvhtree` (`ray_cast`, `find_nearest`, `overlap` — check that `overlap` exists in the version used), the Boolean
  modifier's Exact solver (overlapping input). numpy is bundled, scipy is not.
