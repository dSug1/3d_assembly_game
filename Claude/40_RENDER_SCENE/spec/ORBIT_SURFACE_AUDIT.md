# THE ORBIT'S SURFACE — the audit of what is built, the errata, the prior art (companion of ORBIT_SURFACE.md, 2026-11-16)

> ⛔⛔ **PROPOSED, FOR THE OWNER'S REVIEW. NOTHING BUILT, NO CODE CHANGED.** Moved out of [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §7 and §9 at its
> second revision (2026-11-16, the owner's feedback), so that the specification stays under its line budget. The weaknesses WS1 – WS25 keep
> their numbers; the specification cites them. Code references are `file:line` on `1190db2` (the first version's reading).
> *(alignment, 2026-11-16)* §5 (new) holds what the specification withdrew on the owner's two comments of 2026-11-16 (its §0ter): notes handed to
> the orbit's documents, NOT part of the specification.
> *(decisions, 2026-11-16)* §6 (new) holds the record of the specification's revisions; §7 (new) the questions as they were asked before the owner
> decided them (the specification §8, §0quater), the alternatives not taken, and the workflow as it stood. ⚠ **A word changed that day**: what these
> texts call "close in" in the sense *where the piece can collide* is now **CONTACT RANGE**; "close in" names only the orbit ↔ tilted orbit transition
> (0.6 m in, 0.65 m out) — the specification §1.4. The texts kept as a record (§5 – §7) keep their words.

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
   §1, §4, §10). A piece is seated by the orbit in contact range (the goal capture runs during the orbit, `LEVEL_END.md` §5quater), by the approach
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
6. **"Close in" was never defined** (now: contact range, the specification §1.4): the depth reaches the piece only inside the shell's 60 mm offset; the tilt and the full gain act from 0.6 m
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

## 4. THE CANDIDATE WAYS, restated by the principles (moved from ORBIT_SURFACE.md §6 at its third step, 2026-11-16, unchanged)

**What is built today is one end of the family**: the layout on a convex contour (P1's contour), the piece and the camera on the box's shell
(P1's shell), the gizmo's depth a POINT read plus a piece-fit test at the facet's plane, and a second footprint read in contact range.

**A — Classified features on today's contour** (first version's recommendation): one classification of voids, mouths, protrusions with one
ruler; prior art CAD defeaturing and virtual topology. ⚠ Under the owner's *"no ad hoc rule per geometry"* a classification is still a table of
cases. **Superseded by A′.**

**A′ — First contact on today's contour (P2).** Keep the contour, the charts and the shell; replace the stacks' per-case depth rules by ONE
landing map per facet direction (L2), the GJK the arbiter; the footprint support becomes the same map read with the drop started at the piece
(P2 ⑤) — its "never a step up" kept, so in contact range a proud part stays a wall; ⭐ under Q10 (2026-11-16) the piece keeps its level over a slot it fits. Prior art: drop cutter, Z-map, C-space.

**B — An authored surface.** Proxies and ghosts built and checked in Blender (`PART_AUTHORING.md`); the game reads them. Prior art: game
collision proxies, navigation meshes. Needed where no flat rule exists (C15, C38, C45).

**C — The surface accessible to the piece, computed** (the union closed by the piece; faces by planar segmentation, VSA). Its runtime is the
cousin of the dropped shell + cast (`TILTED_ORBIT_REBUILD_SCOPE.md` §22 – §29): **offline only** — the Blender checks B2, B3, B5.

| | A′ — first contact | B — authored | C — computed, offline |
|---|---|---|---|
| solves | every void, groove, gap, pin, stud by one operation; the gizmo and the piece on one depth | curves, cavities, goal entries | "reachable from outside", the faces that are no place, the goals not reachable |
| costs | a rewrite of `stackDepthAt`'s depth; `footprintSupport` re-expressed on the map, its wall kept; maps per pick-up and turn | authoring every scene | per scene, in Blender (§7bis costs) |
| leaves open | treads (OS3); the mouth's green (§2.4); overhang undersides | consistency with the rules — B's checks | nothing at runtime |
| patents | textbook; ⚠ dexel machining patents (scopes not checked) | none | ⚠ US 10,699,492 B2 (cavity removal, scope not checked); closing textbook |

⚠ **What was already tried.** 2026-11-13: *"your proposals A, B and C have already been tried … It all fails because there is no bijection
possible between the orbit and the faces of the assembly"*. A′ is no new orbit → surface mapping: the face map's angles stay; only the depth
rule (P2) changes (the crossing at a mouth, P3, is withdrawn: §5). §31.4's bijection argument stands; OS3's fallbacks stay stated. *(alignment)* The
owner, 2026-11-16: *"Do not reopen this point."*

## 5. NOTES HANDED TO THE ORBIT'S DOCUMENTS — NOT PART OF THIS SPECIFICATION

Moved here from [ORBIT_SURFACE.md](ORBIT_SURFACE.md) at its alignment with the owner's two comments of 2026-11-16 (quoted whole in its §0ter). His
comment 2: *"The purpose of this orbit's surface specification is to define where the gizmo travels, not what governs the piece and camera orbit
(unless you specifically see that the gizmo travel shall impact the piece and camera orbit, for example during collision)."* What follows is about
what governs the piece, the camera or the layout: kept as the record, for the orbit's own documents to take or leave; nothing here is proposed
by the specification. The text is as it stood at `8e70263`; its "§", "Q" and "(i) / (ii)" references are to the specification as it was then.

### 5.1 P1's former bullets — the far foot's mechanism (withdrawn, comment 2) and "two boundaries" (withdrawn, comment 1)

P1's sentence stays in the specification as a boundary condition, with the owner's boundary (where the piece can collide). Its measurements
stay there as findings handed to the orbit's queue (F17, F7, the mouth). Withdrawn: the bullet "The mechanism proposed" (how the shell reads the
gizmo governs the piece and the camera) and the reviewer's "Two boundaries" (it tied the camera's side to the tilt's 0.6 m, which the owner rules
out). Before the alignment:

* **Corrected after the critic *(study, F7, F17)*.** The consolidation first reworded P1 as "a function of the box and the contour" and called it
  built ("no bump along one assembly"): measured only with the direction along the facet's normal, where a depth step cannot move the foot. The game
  calls `shellAnchor(gizmo, u, …)` with `u` the orbit's direction (`assembly_wiring.ts:686`), and the calm leaves `u` oblique toward a face's
  edges: from a gizmo stepped down by h the ray reaches the shell h × tan θ further along — the far piece and the camera bump. Sweep, at 20°: 684 of
  1596 cells today, 673 under P2; a 6 mm step 2.2 / 6 mm at 20° / 45°, a 40 mm one 14.6 / 40 mm; near the box's edge more (L12's 60 mm step: 82 /
  171). That departs from his words and from the rebuild's own aim 4 and I2: *"A step in the assembly's depth may move the GIZMO (a break), never
  the piece nor the camera"* (`TILTED_ORBIT_REBUILD_SCOPE.md` §1 item 4, §2 I2, approved 2026-11-04). Between assemblies (F7): 612 of 760
  protrusion cells move the far foot by exactly the box's growth (a pin 40 mm, the slab 100), 9 of 836 voids; L24, L48, L50 through the contour
  (189 – 360 mm) — at a seat, an event.
* **The mechanism proposed [PROPOSED], for the class (every depth step under the gizmo).** Far and medium the shell is fed the gizmo's point ON
  ITS CONTOUR FACET (the map's surface point, its depth left out); within the offset the real gizmo, by the same `gizmoShare` blend that brings the
  foot down onto it today. The foot is then a function of the angles, the box and the contour by construction; the calm and its oblique direction
  are kept. ⛔ Not the rule reverted on 2026-11-02 (`orbit_shell.ts` header: the piece on the shell by the direction from the centre, the gizmo a
  readout): the piece still stands off the gizmo's place along `u`; only the depth is read on the contour. Not measured in the game: a replay of
  `Scene_1` far out (a dx across `Piece44`, a dy over the channel) first.
* **Built that way along the face's normal only.** Beyond the shell's offset (`orbitShellOffsetMm`, 60 mm) the piece's foot is on the shell, and *"a gizmo that
  steps in DEPTH (a protrusion's edge, a recess, a notch) leaves the piece and the camera where they are"* (`orbit_shell.ts:7-11`); the camera's
  look reads that foot (`assembly_wiring.ts:1268-1272`). The owner's own reason for the shell: *"it was good to filter out the bumps due to
  protrusions or holes on the section contours"* (2026-11-04, `TILTED_ORBIT_REBUILD_SCOPE.md` §10). Inside the offset the foot comes down onto
  the gizmo, and the footprint support, the solver and the ring's hold decide.
* ⚠ **Not for the camera's FRAME at a mouth.** The automatic tilt acts within `tiltAutoM` (0.6 m, `gestureConfig.ts:887`), and at a mouth the
  hold starts it: `tiltOn(st, st.asmMouth !== null ? st.asmMouth.hi : atPole)` (`assembly_wiring.ts:1157`; the hold set at `:1211-1215` by
  `mouthHold`, `orbit_tilt.ts:290`), the cap taken the one the mouth opens toward (`assembly_wiring.ts:1805`). So between 60 mm and 0.6 m a
  feature of the REAL surface — `Scene_1`'s channel lip at 466 mm, the contour's edge being at 498.5 mm — decides where the camera's frame turns:
  the one place where today's code does not keep his S17 spirit at medium distance (*(review)* with "close in" = 0.6 m: none, next point). Two readings, his choice (§8 Q1): **(i)** P1 strict —
  beyond 60 mm the tilt at the contour's edge (the map's angles reaching the top facet, as the hold already hands over far out), the real lip
  only within 60 mm; **(ii)** the mouth a labelled exception up to 0.6 m — his S10 came with *"when i cross at close in"* on 2026-11-10, the day
  `tiltAutoM` was set to 0.6 m, so his "close in" then was the tilt's distance. **P3 against P1**: far and medium a crossing is at the
  CONTOUR's edge (P1), close in at the REAL edge (P3); they agree only if the hand-over between the two is ONE event at the regime's boundary,
  never two crossing places on one travel. (ii) has no such switch; (i) needs it. Recommendation: (ii) until Q4's measurement.
* *(review)* **Two boundaries, not one exception.** "Close in" has two distances in the game, both his: the shell's offset (60 mm), where the
  collision takes over the PATH; and the tilt's distance (0.6 m in, 0.65 m out), where the camera's FRAME goes square to the face — *"the tilted
  pole orbit is reserved for close in"*, *"The close in square is for fine placement of the piece, not for scene view"* (2026-11-16, his answer to
  D-T1, `TILTED_POLE_CLOSE_IN.md` §5, §8). Read so, P1 binds the PATH beyond 60 mm and the FRAME beyond 0.6 m; the mouth's tilt starts only inside
  0.6 m (`tiltAutoLatch`; the hold places the gizmo, not the frame): a close-in rule by his own words — reading (ii), without the word "exception". What then departs from P1 is F17 (and F7, at a seat).
* **Amended.** The first wording called the orbit's layer "the surface closed at the orbit's scale, today's convex contour being its end"
  (morphological closing; r-hulls, alpha shapes). The code reader showed this wrong twice: the shell is the offset of the parts' BOX, and the
  contour is a set of facets each at its main group's plane, with protrusions standing in front of it. So P1 names TWO layers, neither a
  closing: the **shell** carries the piece and the camera; the **contour** carries the layout. Closing at a scale r survives only as a
  MEASURE — each feature's scale is the r at which it closes (used offline, §2.6, §7bis). ⛔ An intermediate r AT RUNTIME (a rounded layer the
  piece rides) is the dropped shell + cast family (`TILTED_ORBIT_REBUILD_SCOPE.md` §22 – §29): not proposed.
* **It stops** where the piece is inside the offset: P2, P3, P5 then. **Patent**: not checked (a shell and a box are textbook).

And §2.4's "Proposed" bullet, as it stood:

* **Proposed.** For the SURFACE, "close in" = the piece within the shell's offset (60 mm) of it; "far or medium" = beyond. The 0.3 m and 0.6 m
  rules are camera rules on the CONTOUR (the facet under the gizmo, its poles) — ⚠ except at a MOUTH, where the hold hands the real lip to the
  automatic tilt from up to 0.6 m (§2.2 P1, its second point): a surface singularity moving the camera's frame at medium distance today (*(review)*: a close-in rule if "close in" is the tilt's 0.6 m, §2.2 P1). His
  choice between (i) the tilt at the real lip only within 60 mm and (ii) the mouth a labelled exception to 0.6 m is §8 Q1.
  ⚠ Not verified: whether the camera's frame (`free_face.ts`) reads the contour's facet or the real face under the gizmo far out — if the real
  face, a protrusion's side could still turn the camera there; to check before P1 is called built.


### 5.2 P3 — each real face in the frame that faces it (withdrawn: the camera's frame at a crossing)

**P3 — EACH REAL FACE IN THE FRAME THAT FACES IT.** *Where a facet's direction finds nothing to land on and a neighbouring facet's direction finds
a real face, the place is that facet's: the crossing is at the real edge.*
* **Name.** A per-face atlas (PolyCube maps, Tarini 2004); in machining, the faces one direction sees are its visibility map (Woo 1994) and
  its accessibility cone (Spyridi, Requicha 1990); a walk across real edges by their dihedral (straightest geodesics — not verified).
* **Already there in part.** The facet frames turn at an edge by its dihedral (the owner, 2026-11-04, §16.1 D1); the code's own comment at the
  mouth says *"the red's travel there is the next facet's, not this plane's"* (`face_map.ts:990`).
* **Its condition reopened *(study, F5)*.** "Finds nothing" is not the mouth's class: L07's channel, closed 340 mm behind its mouth, finds its
  far wall (no mouth today; under P2 a 340 mm landing at the lip — C49), while Q02's, right through, finds nothing. Measured with Q4.
* **What it is for.** `Scene_1`'s mouth (§2.4): the red reaches the side face's real lip at the floor's level and crosses there — his *"the tilt
  shall happen when the red section reaches the edge at the bottom of the mouth"*, with no hold.
* **Where it stops.** The green at the same height crosses the same region: strictly applied, a dx over the mouth would cross onto the top and
  back — the *"too many back and forth"* he refused at the notches (`POLAR_ORBIT_CLEANUP.md` §8.1). Two travels, one point: §2.4 gives three
  candidates, to be measured. P3 is NOT applied to the notches: a notch has a floor along the facet's direction (its set-back riser), so
  nothing is missing there and P2 alone answers (*"Stays as it is"*, §6 (a)).
* **Already in the record.** §18-C4 (`TILTED_ORBIT_REBUILD_SCOPE.md` §18, 2026-11-05, Step 7's gate): *"a crossing at a REAL edge, not only at the
  contour's"*, for a void open on a travel (his attachment 1: *"the orbit tilt shall take over once it is built"*). What became of it: on
  `1.0.107-Close-in-atlas` it was folded into §27.2's Gz0 (a gap — the orbit tilts on — or a deported face), part of the dropped track + shell
  family; on the main line it was built at ONE place, the mouth's hold (*"build b"*, 2026-11-10). P3 is §18-C4 on today's face map, read per
  facet direction — no track, no deported face.
* ⚠ **Patent.** A camera that turns to face each new real face close in comes close to the HoverCam family (US 8,044,953; US 7,042,449). The
  difference to keep: the gizmo is driven by the finger's dx / dy on charts and is never the point nearest the camera; the camera reads the
  facet's frame. Scope not checked.

### 5.3 The mouth's three place-functions (§2.4 before the alignment)

The gizmo's side stays in the specification (the hold, its domain restricted, Q4). Whether a general crossing rule replaces the hold:

**Can it go? Three place-functions for the mouth, to measure on `Scene_1`** (the literature cannot settle it — the readers agree):
* **(a) P3 strict** — the mouth's region of the side's chart belongs to the top's facet. The red: crosses at the real lip (466 mm), the tilt
  there — his rule, no hold. The green at the same height: crosses into the top inside the channel's span and back out (a back-and-forth).
* **(b) the chart on the real outline** — the side's chart covers the side's REAL face (its top edge at 466 mm inside the channel's span, at
  498.5 mm outside). The red ends at the lip and crosses; the green at a fixed height dips by up to 32 mm as it passes the span — an in-plane
  step, glided like a depth step. ⚠ It resembles the travel on the true outline of §28.4 (not adopted: *"a dx walking up every step's side"*);
  the difference: only where the facet's direction finds nothing, not at every step.
* **(c) the hold, as built** — the one labelled path exception.
* **Recommendation**: measure (a) and (b) in `void_sim` and a headless replay on the channel (dy up, dx across at three heights, close in and
  far out) against (c); keep (c) until one of them gives his red with no back-and-forth (§8 Q4).

### 5.4 P6 — the layout's own singular points (withdrawn: a rule of the atlas)

**P6 — THE LAYOUT'S OWN SINGULAR POINTS.** *Where the contour's curvature is gathered on faces too small to work on, the layout treats the place
as one singular point — a polar zone.* A rule of the atlas, not of the surface.
* **Name.** Cone singularities in surface parametrization: the curvature (the angle defect) concentrated at a few points (Kharevych et al.
  2006; Ben-Chen et al. 2008; Myles, Zorin 2012; Soliman, Slepčev, Crane 2018 — the placement by sparsity, one weight).
* **Already built twice.** The charts' FANS — the faces round a corner pole with at least three faces taken as one frame, by topology, no size
  ruler (`orbit_charts.ts:396-447`); the legacy polar zones by a size share (`valenceMin` 5, `facetMinRatio` 0.22), under `chartLayout` 0 only.
* **Guarantees** the turn budget exactly (the cones' angles sum to Gauss – Bonnet's total). **Stops**: fewer cones mean more distortion — a
  trade-off with one weight, not a threshold-free choice. Nothing changes on `Scene_1` (no fan) nor on `Scene_0bis` (the fans already do it).
* **Patent.** Not checked; academic work.

### 5.5 D5's share after a closing (§2.6 before the alignment: the layout's facets)

A finding for the orbit's layout (WS21): D5 reads the main group's region, so a porous face could lose its facet — not reproduced by the study
(L38, L39, Q08). What §2.6 recommended:

**D5's quarter share** stays the layout's one ruler, measured after a
closing that does NOT depend on the held piece: the placed parts closed at the level's SMALLEST piece's half-width (a level constant, read from
the catalogue), so a comb or a field of studs keeps its facet (the former D-S19) while the contour and the charts stay a function of the placed
set alone (S19: rebuilt at a seat, never at a pick-up or a turn). ⛔ Not after P2's own closing: that is per held piece and per turn, and would
make the layout move with the piece.

## 6. THE RECORD OF THE SPECIFICATION'S REVISIONS (moved from its header and §0ter, 2026-11-16, the fourth exchange)

### 6.1 The header's account of the revisions, as it stood at `356acd0`

> **First review (2026-11-16)**, at his request (*"do a review yourself … and amend as necessary"*): §3.0, C25 – C47, S21 – S25, OS13 – OS16,
> marked *(review)*.
>
> ⭐⭐ **SECOND REVISION (2026-11-16), opened by the owner's feedback:** *"My feedback of the review: …"* — his nine points are quoted whole in §0bis,
> each with what was done. His thread through them: no ad hoc rule per geometry; check the literature for patent-free proposals; put what can be
> checked into the Blender workflow. So: §2 is rebuilt on six PRINCIPLES (P1 – P6) with a table of the ad hoc rules they replace; §2.5 and §2.6 give
> the advice asked on S13 and S16; §3 – §6 say which principle answers each class; §7bis (new) proposes the Blender workflow's amendments; §8 asks
> nine questions. The audit table (WS1 – WS25), the errata of the first version and the prior art moved to [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md).
> New code references are on the tip of `1.0.146-Orbit-charts` (`30f7bb3`, read 2026-11-16, nothing run); the first version's are on `1190db2`.
>
> ⭐⭐⭐ **THIRD STEP (2026-11-16): THE SHAPES AND THE CONSOLIDATION**, at his request: *"I suggest you complement this set of rules by doing like you
> did for the orbit charts: you elaborate some basic geometries or topologies with surface singularities and you consolidate the rules you have
> drafted, or amend them, or add rules which are missing to cover cases we did not consider."* (and *"Make sure you manage the load on my
> computer"*). 63 shapes and a 1596-cell sweep, read by today's functions and by the principles (`scripts/probes/surface_study/`, `903e50d`, about a
> minute of one core). Consolidated: P1 and P2 ③ amended, P3's condition reopened, the mouth's hold given a domain, S26 – S29 added, S5's order
> asked, Q3 merged into Q2 — each marked *(study, F…)*. Shapes, results, findings, the consolidation table and the catalogue's moved §3.1b – §3.2:
> [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md). ⭐ **Corrected after a critic's review (2026-11-16):** P1 is NOT built off a face's middle — the
> far foot bumps along ONE assembly when the orbit's direction is oblique (F17, measured): P1 keeps his words (the mechanism then proposed is
> withdrawn at the alignment below); the "L19 lid on the tray's floor" evidence withdrawn (a fault of the study's goal check, fixed and rerun).
>
> ⭐⭐⭐ **ALIGNMENT WITH THE OWNER'S TWO COMMENTS (2026-11-16)** — on P1 and on the scope, quoted whole in §0ter, and his request: *"Confirm that
> the specification is in line with both points."* It was not fully. Now: the scope is stated (§0, §1.3: WHERE THE GIZMO TRAVELS); P1 is a boundary
> condition with his boundary; the "two boundaries" reading and the proposed far-foot mechanism are withdrawn; F17, F7 and the mouth are findings
> handed to the orbit's queue; P3 and P6 are withdrawn (their text: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §5); Q1 and Q4 re-worded.

### 6.2 What was out of line before each of the owner's two comments (the specification §0ter)

Before comment 1:
* **Out of line.** §0, §2.2, §2.4 and Q1 set "close in" at the shell's 60 mm for the piece's PATH, and the reviewer added a second boundary at the
  tilt's 0.6 m for the camera's FRAME ("two boundaries"): the camera's side of P1 tied to the 0.6 – 0.65 m transition, which he rules out.

Before comment 2:
* **Out of line.** The document proposed changes to what governs the piece and the camera: the shell fed the gizmo's contour point (P1's
  "mechanism", Q1 (a), §6 (1b)); the camera's frame at a crossing (P3, §2.4's place-functions); the layout's singular points (P6); D5's share
  after a closing (the layout's facets, §2.6, Q6).

### 6.3 S18 — where the mouth's hold comes from (the specification §2.4, as it stood)

**S18 — where the mouth's hold comes from.** 2026-11-10 (`POLAR_ORBIT_CLEANUP.md` §9.10): *"when i cross the edge … there seems to be a sort of
shake of the scene"* — *"when i cross at close in"*. Seen from a side, `Scene_1`'s top channel runs through (no floor along the side's normal),
so §8.3's rule bridged it on the side's plane: a dy climbed the mouth to the box's corner (487 mm over a 466 mm floor), then the tilt dropped it
onto the floor. Asked, he ruled: *"i think the tilt shall happen when the red section reaches the edge at the bottom of the mouth, therefore the
green section should not be an issue"* → *"build b"*. Built: `stackDepthAt` returns `mouth` (`face_map.ts:989-994`); `mouthHold`
(`orbit_tilt.ts:290`): a dy toward the open end HOLDS the gizmo at the floor's edge, a dx releases it onto the bridge. Flagged at once as
*"path-dependent, the map's first exception since 2026-11-04"*. Its roots: §15's *"close the holes for the moment"* → D3's real depth → a void
closed on a travel bridged (§18) → bridged only with no floor (§8.3): the mouth is where "closed across" and "open along the red" disagree.
⚠ One more record bears on it: on `1.0.105-` (2026-11-07, decision 3) he asked that the gizmo *"shall not wait … it looks like a bug for the user if the gizmo
waits"* — the hold is a wait, though a short one at an edge.

## 7. THE QUESTIONS AS THEY WERE ASKED — moved from the specification §8 at the owner's decisions of 2026-11-16

The owner answered them on 2026-11-16 (verbatim in the specification §0quater; the decisions table its §8): Q1 settled by the new word, its second
half and Q2, Q4, Q6 – Q9 accepted as recommended (*"I agree with the recommendations, although they shall be later tested and could be reversed if
the testing shows they need to be reversed"*), Q5 accepted with his amendment (a goal's ENTRY SET), Q10 decided (b) — not the recommendation.

### 7.1 §8 as it stood at `356acd0`

**§8. THE DECISIONS FOR THE OWNER** (as it stood)

Nine questions, each answerable in one line. [PROPOSED] recommendations; nothing is his decision until he says so. *(study)* Q3 merged into Q2, Q4
reworded, Q10 added; the numbers kept. *(review, 2026-11-16)* Q6's recommendation amended by the reviewer. *(alignment, §0ter)* Q1 is no longer
a design choice: his boundary confirmed, and today's departures recorded or accepted; Q4 keeps only the gizmo's side (the hold's domain); each
question checked against the scope — Q2, Q5 – Q9 are about where the gizmo is or how the parts are authored, Q10 is the contact (in scope).

| # | question | options | recommendation |
|---|---|---|---|
| **Q1** | P1 is a boundary condition this specification respects, not a design of it. (1) Confirm P1's sentence with HIS boundary: "close in" = where the piece can collide (during the approach, during the orbit) — in today's code inside the shell's offset (`orbitShellOffsetMm`, 60 mm); not the 0.6 – 0.65 m of the tilted orbit's transition; parts not seated are no surface (S2), the collision handles them. (2) Today's code departs from it in two measured places — F17 (where the orbit's direction is oblique, a depth step h under the gizmo shifts the far piece and the camera by h × tan θ: a 40 mm slot, 15 mm at 20°, 40 mm at 45°) and the mouth (the gizmo's hold lets the real lip decide where the tilted orbit starts, at up to 0.6 m); F7 (a box grown at a seat) is an event at a seat, consistent with his sentence. Are the two departures RECORDED as defects in the orbit's queue (nothing designed here), or accepted? | (1) (a) yes; (b) another wording. (2) (a) recorded in the orbit's queue; (b) accepted as they are | (1) (a); (2) (a) — both depart from his comment 1 and F17 from the rebuild's aim 4 and I2; any remedy is the orbit's |
| **Q2** | P2: the gizmo's depth = the first contact of the held piece AS HELD (its map rebuilt at a turn; Q3 merged) — reversing his decision 2 of 2026-11-07 (`1.0.105-`: *"gizmo is a point, not the piece's footprint"*)? Close in a proud part stays a WALL (his Q1 (b), *"Proceed"*); far the marker climbs half a piece early, S5's real depth then in the central band only (L03: 19 mm) | (a) yes, first as a readout beside today's depth, then driving; (b) no, the point stays | (a) — the study: today's marker stands where the piece cannot rest on 41 of 62 shapes (far out the piece rides the shell, close in the collision refuses it); its two-smallest-sizes ruler judges B 80 × 80 as 40 × 80 and the bar 20 × 20 (130 places across the keyed slot); P2 never, by construction |
| **Q3** | → merged into Q2 (the piece as held) | — | — |
| **Q4** | The mouth's hold — the gizmo's side of S10 — fires on the cap, along island gaps, in a V (F5, the study's emulation). Restrict it to where it hands over to the automatic tilt (a side facet, toward a cap's edge): never on a cap — now; over a void P2 leaves open for the held piece — once the landing map exists (L2's readout, §6 (1))? | (a) yes; (b) keep the hold as built; (c) delete it now | (a) |
| **Q5** | S13 and S28: every goal carries its entry direction; a set-down is a landing (P2), any other entry a guarded move from the pre-insertion pose computed by withdrawal (the drawn ghost checked against it), the plunge one of them (§2.5 (3) + (4))? | (a) yes; (b) drawn ghosts only | (a) |
| **Q6** | S16: the piece (P2) + one noise family in `units.ts` with S26 (one depth tolerance, no unnamed step) and S27 (tolerances join, never erase); persistence offline only (§2.6 (2))? (D5's share, the layout's ruler, is the orbit's: §2.6) ⚠ With P5, S26 makes a step of 0.5 mm or more a WALL close in — a seat 1 mm proud included (C36; 99 / 76 of the study's protrusion traps); his Q1 (b) was ruled on `Piece44`, 41 mm proud | (a) yes, every step ≥ 0.5 mm a wall; (b) a ruler per question; (c) (a) with a CLIMB height in the noise family under which a close-in step is not a wall | *(review)* (a) — today's rule (a seat is set exactly on its goal, `LEVEL_END.md` §5quinquies: a proud seat exists only where a part is drawn so); (c) only when a level's parts need it, the height then chosen on the device |
| **Q7** | The Blender workflow: the playability brief, B1 – B6 failing the run, painted, re-verified at import, and the checklist (§7bis) — written into `SCENE_WORKFLOW.md` and `PART_AUTHORING.md`? | (a) yes, B1, B2, B4 first; B3, B5 once L2 exists; (b) some of them | (a) |
| **Q8** | S25 restated on the `UCX_` union with the proxy on it, and S22 (exposed = reachable from outside)? | (a) yes; (b) as worded before / as today | (a) |
| **Q9** | The first round's open points: the rebuild events (D-S4 (a)); a tread a place of the facet that faces it, not of the side's travel (D-S7, re-worded by the study: L12, L13); render faces for box scenes, proxies where authored (D-S9 (a)); the first build on `Scene_0`, `0bis`, `1` and the study's shapes (D-S11 (a)); a strongly non-convex assembly measured by B5's coverage and warned (D-S20 (a)); a level boots with a placed part (S29) | (a) all as recommended; (b) say which not | (a) |
| **Q10** | *(study, F8)* S5 close in: the piece in contact crossing a slot it fits — (a) drops in and rests (today's footprint support, P2 ⑤ — built: the piece RESTS on its support, `CLOSE_IN_CONTACT.md` §10; the drop into a slot never judged on its own), the far wall a P5 wall, out by the approach; S5's *"the piece shall not go in"* then binds far and medium, where the shell keeps it by construction — this REVERSES his D3 (*"the piece shall not go in (it shall continue its orbit)"*) close in; (b) the orbit close in never lowers the piece — only A + dy does (a new rule in the contact) | (a); (b) | (a) — it is what the contact does today (built, never judged on its own); it reverses D3 close in, his call |

**The first round's decisions, now answered by a principle if he accepts it** (their numbers kept): D-S1 withdrawn (unchanged);
D-S2 → Q6; D-S3 → P1 (Q1) and P2 ① (holes closed or "nothing to land on"); D-S5 → P2 (the real floor by first contact where no ghost is
authored) and §2.5; D-S6 → Q4; D-S8 → P2 ① (a gap with no floor: nothing to land on, marked); D-S10 → P5 (blocked by collision; the
glide not close in); D-S12 → P2 + P5 (the notches as he ruled); D-S13 → Q2; D-S14 → P2 (the pin's top where the piece touches it first);
D-S15 → P2 + S13 (inner walls approached or plunged; no slide); D-S16 → Q7 (B4, B5); D-S17 → Q8; D-S18 → Q6 (the depth in the noise
family); D-S19 → Q6; D-S21 → Q8.

### 7.2 The alternatives weighed — S13 (the specification §2.5 before Q5) and S16 (§2.6 before Q6); S28 as he answered it

S13, before Q5 (*"His rule stands: the ghost is aligned with the face where the hole exits. The question is how it is MADE and how the plunge
starts."*):

His rule stands: the ghost is aligned with the face where the hole exits. The question is how it is MADE and how the plunge starts.

| alternative | what it is | for | against |
|---|---|---|---|
| **(1) drawn ghost** (today's spec) | the author draws the ghost floor at the mouth; `plunge_axis`, `plunge`, `plunge_to` on it | in use for `Scene_2` | two homes for the entry fact — the script's `INSERTIONS` (the direction a part comes FROM) and the ghost's `plunge_axis` (INTO the hole), opposite by convention; nothing checks they agree; nothing checks it is where the part clears |
| **(2) ghost at the goal's depth** | superseded 2026-11-13 (`PART_AUTHORING.md` §3 item 3) | A + dy alone inserts | the pistons floated off their bank, the crank lay recessed: refused |
| **(3) computed ghost** — assembly by disassembly | the part withdrawn from its goal along its entry direction until it first clears the placed set (a swept test, not a local one): that pose IS the pre-insertion pose; the ghost is its resting face's plane (Wilson, Latombe 1994; Halperin, Latombe, Wilson 2000) | one source of truth: the goal pose + its entry direction; finds a blocked entry at the build (B4) | a computation per part and per stage (offline: cheap) |
| **(4) approach then insert** (peg in hole) | the plunge a guarded move along the entry axis, started when the piece is inside a capture region at the mouth (preimages, Lozano-Pérez, Mason, Taylor 1984; chamfers, Whitney 1982 — not verified) | the goal margins (10 mm, 3°, `orbitGoalMm` / `orbitGoalDeg`) are already a capture funnel; the 3 mm of play needs aiming help | the capture *"held on the bore's axis … eased in"* (`SCENE_2_ASSEMBLY.md` §2.9 item 3) is a time state: an EVENT like a seat, never a place rule (P4) |
| **(5) no ghost: P2 alone** | where the entry is ALONG the host face's normal and the part fits, its first contact is its seat | no authored face at all | needs an aim within the play (1.5 mm each side for a piston); a ghost's flat rest is gone |

**Recommendation [PROPOSED]:** (3) + (4). The goal carries its **entry direction** (one home, exported); the ghost is COMPUTED from it, and a
drawn ghost is CHECKED against it (B4); the plunge starts when the piece rests on the ghost inside the capture region (the goal margins lifted to
the pre-insertion pose), as an event. (5) stays the rule where no ghost is authored (the former D-S5: the real floor, by P2).

S28 as it stood (rewritten on Q5 — the specification §2.5, §2.7):

| S28 | **A goal's entry is stated; only a set-down is a landing**: a goal entered along its host facet's normal is reached by P2 (B4: its first contact is its seat); any other entry — slid, plunged, hooked — is a guarded move along the entry direction from the pre-insertion pose B4 computes, ENDED by the goal capture (the goal margins, `LEVEL_END.md` §5quater) — alone it would end at first contact, past the seat (§2.5 (3) + (4) for every such entry) | [PROPOSED] *(study, F13: L05's block, slid in, lands at the back wall −100 against its seat at 120, today and under P2)* |

S16, before Q6 — the table of the alternatives (the recommendation (2), with (3) offline, accepted):

| alternative | ruler | for | against |
|---|---|---|---|
| **(1) a ruler per question** (first review's S16) | the piece, a share, the camera, each named | each question honest | three constants that can disagree on one feature |
| **(2) the piece + one layout share + noise tolerances** | P2's first contact (no threshold: the piece's own geometry), D5's share for "is it a facet", one tolerance family (coplanar distance and angle, the joint growth, a depth for "flush") for modelling noise only | the fewest constants; "small for use" needs none | the share remains one number |
| **(3) persistence** — a feature's scale is the radius at which it closes (nested closings make it monotone) | one measure per feature, no threshold to classify | ruler-free; gives every feature its margin from any threshold | a global count of holes by scale is NOT monotone for general inputs: use it per feature; offline cost |
| **(4) CAD defeaturing** (one "defeature size", virtual topology) | one size | industry practice | one size is a threshold per geometry in disguise |

### 7.3 The Blender workflow as it stood (the specification §7bis.1, read on `1.0.146-Orbit-charts` before the amendments were written)

**§7bis.1 The workflow as it stands** (read on `1.0.146-Orbit-charts`; both files say "PROPOSED … NOT APPROVED" and are in use)

1. **W0** the brief (object, reference, scale ≈ `Scene_1`'s cube) → **W1** the assembly plan (parts, steps, host, seat, approach axis, route),
   nine rules checked ON PAPER (`SCENE_WORKFLOW.md` §2.3; rule 4 "the route's faces exposed" = not glued) → the owner's approval.
2. **W2** the geometry sheet per part (look, `UCX_`, `UFM_` proxy and ghosts, `MC_` markers, goal) → **W3** `build_<scene>.py --step N`, one
   step at a time, the owner's look between steps.
3. Each run prints checks (`PART_AUTHORING.md` §4.2): size, seats (`SEAT_PAIRS`), the way in (`INSERTIONS`: `UCX_` swept 0.8 units back
   against earlier steps by `BVHTree` overlap, with a control), proxy sanity ①–⑩, simplicity, the crank turned. **None fails the build** (exit
   0; Claude reads the report); only internal `assert`s stop it.
4. Before the export (§4.3): the geometry review (inside-out — ⚠ open meshes SKIPPED silently), the motion run, and the owner's PROXY REVIEW
   (`review_proxies.py`: faces coloured by risk per build step; no pass rule, no control; its thresholds RETYPED from the game).
5. **W4** the `.glb`, read back; the game's `readModelCatalog` refuses conventions by name — and checks NOTHING geometric (no convexity, no
   closure, no seat pairing, no ghost flushness, no way in). **W5** level data; **W6** headless probes; **W7** the device look closes.
6. ⚠ Gaps: the plan's order (`after`), entries and seat pairs live in the script and the markdown, not in the file; the build's 10 integer
   steps are not the plan's 16 stages (six pistons share step 6); the proxy is an OPEN surface by design; the render meshes are opened by the
   finish pass; `UCX_` budgets have two homes (24 / 48 in `PART_AUTHORING.md`, 64 / 16 in `BLENDER_COLLISION_AUTHORING.md` — `Scene_2`'s upper
   case already has 19 pieces).
