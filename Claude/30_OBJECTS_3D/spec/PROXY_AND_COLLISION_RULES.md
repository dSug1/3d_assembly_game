# THE PROXY AND COLLISION RULES — universal, for any part (a study, 2026-11-23)

> **STATUS** · ⭐ **A STUDY — HIS FIVE DECISIONS GIVEN 2026-11-23 (§8)**, written into §3 and §3bis; the patent-free methods surveyed (§5); ⭐ **AUDITED
> 2026-11-23 (§7): two blockers and seven should-fix, ADOPTED where they apply a recorded rule; four questions back to him (§7.2)** — ✅ **ANSWERED 2026-11-23: *"I agree with your recommendations. Capture, proceed"*** (§7.3): the RULES DECIDED;
> the checks being built (§9: packet 1 BUILT — R7, R3, R4, R2; packet 2 BUILT — R1 coverage, R1b caps, R2 closed; packet 3 BUILT — C-R2 both ways, the resting candidates). The four-part method (`orbit-design-method`):
> the rules (§1 – §3), the obstacles and fallbacks (§4), a systematic design from patent-free prior art (§5), an audit (§7) — before any check.
> **OWNS** · what a part's FACE PROXY (`UFM_`) and its COLLISION PIECES (`UCX_`) must be, for ANY shape — so that a generator (the Blender build
> scripts, an automated workflow) delivers them right and a check proves it.
> **READ WITH** · [`PART_AUTHORING.md`](PART_AUTHORING.md) §3 item 3 (the proxy's principle of 2026-11-13 and its sanity checks), §4.2, §6.4 (D1 – D7);
> [`../../40_RENDER_SCENE/spec/ORBIT_SURFACE_PART_CHECKS.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_PART_CHECKS.md) §8 – §11 (`Scene_2`'s findings,
> why the checks missed the plinth); [`../../40_RENDER_SCENE/spec/ORBIT_SURFACE.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE.md) §3 (the surface's
> classes C1 – C49), §2.6 – §2.7 (the noise family S26, S27).

## 0. His words (2026-11-23)

*"We will not rebuild the parts of scene 2 in this orbit's surface worktree, however we shall capture those lessons learned and build the proper
check so that the future automated workflows deliver proper parts and proxies. Note that the proxies shall be simplified otherwise the gizmo
movements will be very complex: we will need to define proper rules for the proxies (and maybe also for the collision surfaces)."* — *"The rules
shall be universal for parts which shapes can be much diverse: the camshaft (thin cylindrical with bends, the case with hollow where the crankshaft
will seat, etc.). Check literature for patent-free methods. Proceed."*

## 1. What reads them — the requirements come from the readers

| reader | reads | what it needs |
|---|---|---|
| **the face map** (`input/face_map.ts`, `buildFaceMap`) | each placed part's proxy faces (normal, triangles) | faces within **20°** of a facet's normal merge into it (`facetMergeDeg`), a facet kept with **¼** of its polygon real (`facetMinShare`); every proxy face at a clear angle to its neighbours becomes a facet / region boundary — the gizmo's crossings, its turns |
| **the gizmo's depth** (`stackDepthAt`, P2 — S4) | the facet's regions; the collision pieces (P2's first contact) | a proxy and collision pieces that AGREE (the gizmo's surface where the piece lands) — S5's B1e: `Scene_2`'s disagree by up to 42 mm |
| **the section lines, the solver's ring jumps** (`RING_JUMP_M` 5 mm) | the gizmo along the angles | few steps: a depth step ≥ 5 mm is a JUMP the solver handles; many small faces = many jumps |
| **the resting-face quads** (`PICK_AND_PLACE.md` §5) | the picked part's proxy faces | few, large candidates (the 11-13 warning: *"a part with MANY proxy faces would get too many candidates"*) |
| **the ghosts, the plunge** (§3 item 3) | a goal's mouth | the opening a part enters BRIDGED, flush at the mouth |
| **the solver** (GJK, **24 queries a frame**) | each pair of collision pieces | convex pieces, ≤ 24 vertices, ≤ 48 triangles (COLLISION SIMPLICITY), FEW per part |
| **the landing map** (P2 — S1, S4) | every pair (placed piece, held piece) | its preparation grows with the pieces (C2: a budget per scene, owed) |

## 2. What exists — and where it breaks for diverse shapes

* **The principle** (his, 2026-11-13): *"surfaces which support gizmo shall be as close to the real surfaces as possible while simplifying their
  geometries … no false gaps, discontinuities between faces, faces floating in the air, small unreachable faces"* → a proxy is the part's REAL
  OUTER SURFACE, SIMPLIFIED; the PROXY SANITY (① fidelity, ② coverage, ③ continuity, ④ islands, ⑤ reachability, ⑥ simplicity) and the mistakes
  met ⓐ – ⓖ (`PART_AUTHORING.md` §3 item 3). The COLLISION SIMPLICITY budget (§4.2). D1 – D7 (§6.4).
* ⛔ **Where it breaks:**
  1. **"Outer" = within 0.006 of the part's CONVEX HULL** (② as built): true for a box; ⛔ FALSE for a bent shaft (most of its surface is far from
     its hull, all of it outer), an L-bracket, a case with a hollow — the hull covers air. **"Outer" must be what the outside REACHES**, at a stated
     scale (§3 R1).
  2. **No scale is stated** for what is "small", "narrow", "simple": ⑤ reachability ≈ 7 mm and the 0.005-unit tolerances are absolute, written for
     `Scene_2`; a universal rule states each in mm, its one home (`units.ts`), and WHY (the reader it serves).
  3. **Simplicity is "coplanar merged" + a face budget**: nothing bounds a curve's facet count, a thin feature's, a face's narrowness.
  4. **The proxy and the collision pieces are drawn apart** (ⓐ, S5's B1e): nothing says they come from ONE simplified shape.
  5. **The checks tested one way** (S5 §11): the proxy on the solids, never the solids' outer surface covered.
  6. **Hollows**: ② excluded *"an open cavity"*; the ghost bridges a GOAL's mouth — a hollow that is not a goal, wider than the piece, has no rule.

## 3. The rules — PROPOSED (universal; each with its reader, its scale, its check)

**R0 — THE SCALES, one home each (`units.ts`), all in mm of the MODEL** (✅ his decisions 1 – 2): **ρ = 3.5 mm**, a CONSTANT — the probe: an
opening narrower than 2ρ is bridged; ρ also bounds the wrap's rounding of a concave corner (a 90° corner filled by ρ(√2 − 1) ≈ 1.4 mm ≤ τ);
**τ = 1.5 mm** the proxy's tolerance to the real surface, **τc = 1.5 mm** the collision pieces' (his *"as proposed"*: 1 – 2 mm — the middle;
the audit may move them); **w = 2ρ = 7 mm** the narrowest face or facet (⑤'s ≈ 7 mm, now derived); **θ** the face map's merge angle (20°, read from
`gestureConfig.ts` — never retyped).

**The proxy:**
* **R1 — WHAT IS OUTER.** The part's surface a ball of radius ρ reaches from outside, the part ALONE (an alpha-wrap at α = ρ, §5: an opening
  narrower than ρ's ball closed, a wider one open) — computed, never "near the hull". The floor's contact apart. ⭐ A GOAL's mouth (another part's seat)
  is BRIDGED by its ghost, flush (the 11-13 rule kept). ✅ **(his decision 3, 2026-11-23: *"bridged if this is in line with rules we have set for
  hollows already"* — it is: the 11-13 coverage ② *"an open cavity … is no route"*; C25 *"P2 (its floor); inner walls approached"*; C6 the ghost at
  the mouth)** **R1b — EVERY HOLLOW BRIDGED:** a cavity the outside reaches only through a MOUTH (narrower than what lies behind it) is CAPPED
  flush at its mouth — a planar cap on the mouth's rim, as a goal's ghost without its plunge; the gizmo's DEPTH over the cap still reads P2 on the
  collision pieces (which keep the hollow open, C-R2): its floor shows where the held piece fits (C25, Q10); its inner walls are approached (A + dy,
  the plunge), never travelled. ⏳ **The test that tells a hollow from an open concavity** (an L's inner corner, a shaft's bend — followed, never
  capped), for the audit: the region between the ρ-wrap and its cap is DEEPER than the cap is wide, or its inner surface ≥ 2 × the cap's area —
  a borderline case flagged for the author.
* **R2 — CLOSED, BOTH WAYS.** Every outer point within τ of the proxy (coverage), every proxy point within τ of the outer surface (fidelity — a
  ghost exempt); the proxy a closed surface over the outer surface (every edge shared, or on the floor's contact, or a ghost's rim). ⚠ **(audit 1, 4)**
  a PLANAR real face's proxy ON it (≤ 0.25 mm); τ for a curve's facets only; a CAP and a ghost exempt; fidelity read against the ρ-closing.
* **R3 — PLANAR, NO FACE SMALLER THAN w.** Planar faces only; two adjacent faces either one face (under θ) or clearly apart (over θ + a margin —
  B6's conformance). ✅ **(his decision 4: *"I would not set a limit in number of faces per proxy but rather a minimum size per face or facets since
  large parts may require more than 16 faces if their geometry is complex (for example the hull of a car)"*)** — NO face count: EVERY proxy face,
  and every FACET of the assembly's face map at every stage (§3bis), at least **w** across (its inscribed width) — a thin feature's facets too
  (R5: n lowered, 4 at least); a feature under w even as a square is below the gizmo's scale: absorbed by its neighbour or bridged, and flagged.
* **R4 — A CURVE AS FEW FLATS.** ⚠ **(audit 2: an ANGLE rule, §7.2 Q2)** a curved surface becomes flat facets stepping by a fixed angle whatever its
  radius, their sagitta recorded (exempt from R2 / R6: the depth is P2's); a doubly curved one, planar regions (§5: VSA's partition) under the
  same angles. (First written as the smallest n with a sagitta ≤ τ: no answer past R ≈ 44 mm.)
* **R5 — A THIN FEATURE AS A PRISM ON ITS AXIS.** A feature narrower than 2w (a shaft, a rib, a pipe): an n-gon prism (n from R4, ≥ 4, each face ≥ w) along each
  straight segment of its axis; a bend a short joint facet; a lobe its own prism. So the camshaft is a few long prisms the gizmo rolls round in
  n steps, its layout the face map's spits / charts (C22).
* **R6 — ONE OUTLINE.** The proxy and the collision pieces come from the SAME simplified shape: every proxy point within **D4's 0.5 mm** of the
  collision pieces' union surface (B1e, D4 — audit 1), facing out (B1f, D5); a curve's facets and a cap exempt (audit 2, 4).
* **R7 — EACH PROXY FACE ITS OWN NODE** (audit 10): in the export, one `UFM_` node per face (or a face id per triangle) — the per-face rules (planar,
  its width, the resting candidates) cannot be checked once the faces are merged into one mesh.

**The collision pieces:**
* **C-R1 — CONVEX, SIMPLE** (as built): closed, volume > 0, ≤ 24 vertices, ≤ 48 triangles (B1a – B1d).
* **C-R2 — TRUE TO THE PART, BOTH WAYS:** the union within τc of the real shape (no visible part outside it, no gap the eye reads as contact); a
  cavity a part ENTERS left open (its walls pieces of their own).
* **C-R3 — A BUDGET PER PART**, from the solver's 24 queries and the landing map's cost (C2): proposed 16 (`Scene_2`'s most) — ⏳ his decision 4
  spoke of the proxy's faces; the pieces' budget is for the audit and C2's figures on the phone.
* **C-R4 — A THIN FEATURE**, one convex piece per straight segment (a prism ≤ 24 vertices: a 12-gon at most), its lobes apart.

## 3bis. ✅ THE ASSEMBLY'S SURFACE AS IT GROWS — how the faces are appended (his decision 4's question)

The rules for it are written already — S2, S22 (*"exposed means reachable from outside, on the parts taken together"*), S19 (*"rebuilt at two kinds of
event: the placed set changes …"*), C18 / C26 / C27 / C46 (`../../40_RENDER_SCENE/spec/ORBIT_SURFACE.md` §2.7, §3, §5.1 L1) — and the per-part rules fit them:

1. **A part's proxy is authored ALONE**, closed over its own outer surface (R1 – R2) — whatever is placed around it, so it never changes when the
   assembly grows.
2. **The assembly's surface at a stage** = the union of the placed parts' proxies, **LESS** every face not exposed at that stage (S22: GLUED —
   pressed on another part within the fit; BURIED — inside another part; SEALED — in a cavity the parts close), **PLUS** the CAP of every hollow the
   stage forms BETWEEN parts (a cavity whose mouth spans two parts — R1b at the stage).
3. **Appending a part (a SEAT)** — the one event that changes it (S19): its proxy's faces enter as authored; the faces it covers on the parts
   already placed leave; a face PARTLY covered keeps its exposed part, SPLIT at the cover's edge — each piece at least w (R3), a smaller one dropped
   (no sliver); two parts' coplanar faces meeting under θ merge into one facet of the face map (the contour, L3); the seat's ghost leaves with its
   goal filled; the gizmo relocated once (C23, C46).
4. **Where it is computed**: OFFLINE per stage by B2 (`exposedPerStage` — built: each proxy face exposed / glued / buried / sealed) — the generator's
   check that EVERY stage's surface keeps R3 (every facet ≥ w, no sliver); IN THE GAME at each seat by L1 (§5.1: *"the faces reachable from
   outside … rebuilt at a seat"*) — ⚠ today only GLUED, on each face's rectangle (`exposedRects`, R1 of 2026-11-09); SEALED, BURIED and the stage's
   caps are OWED in the game (S22 is computed in Blender only).

## 4. The obstacles and the fallbacks

| obstacle | where | the fallback |
|---|---|---|
| a thin shaft's facets narrower than w (R3 against R5) | the camshaft (ø 20 mm: an octagon's face 8 mm) | R5 wins for a thin feature: its facets are exempt from w, n lowered toward 4 |
| an opening narrower than 2ρ in a wall | a vent, a slot | closed by R1 (the proxy bridges it); its collision pieces still leave it (C-R2) — a part does not enter it |
| a hollow that is a GOAL | the case's crankshaft seat | the ghost at its mouth (the 11-13 rule); its walls' pieces open (C-R2) |
| a hollow wider than the piece, no goal | a recess, a pocket | ⏳ his word (R1): route, or bridged |
| a face near θ | a chamfer, a draft | B6 flags it at authoring; the generator snaps it (merged, or pushed past θ + margin) |
| the budget overflows | a complex casting | coarser n (R4), pieces merged (C-R3), then said — never silently dropped |
| a part's faces are many but each fine | a ribbed cover | the face map's facets merge under θ; the RESTING-FACE quads need a rule of their own (§8) |

## 5. The methods — patent-free prior art (a literature and patent search, 2026-11-23)

⚠ **Not legal advice.** Patent status read on Google Patents (its status is *"an assumption, not a legal conclusion"*); *"no patent found"* means the
searches run found none — a freedom-to-operate review belongs to whoever ships. The search's queries and every source: the session's research
report, summarized here.

| method | reference | patent | an open implementation | its use here |
|---|---|---|---|---|
| **3D Alpha Wrapping** | Portaneri, Rouxel-Labbé, Hemmer, Cohen-Steiner, Alliez, SIGGRAPH 2022 | none found | CGAL `Alpha_wrap_3` (GPL / commercial); `alecjacobson/alpha-wrap` (MIT, clean-room) | ⭐ **R1 – R2's first step**: a watertight, 2-manifold surface enclosing the part at an offset; it enters a gap only wider than α — **α is ρ** |
| **Variational Shape Approximation** | Cohen-Steiner, Alliez, Desbrun, SIGGRAPH 2004 | none found (⚠ Adobe US 9,520,001 B2, active ~2034, claims near-planar grouping PLUS a deformation that sharpens angles — NOT used) | CGAL `Surface_mesh_approximation` (GPL / commercial) — or written here (Lloyd clustering of faces on the L2,1 metric) | ⭐ **R3 – R4**: the wrap partitioned into FEW PLANAR regions within τ; its output not guaranteed manifold — validated after |
| **Ramer–Douglas–Peucker** | Ramer 1972; Douglas & Peucker 1973 | none (any expired) | `simplify-js` (BSD-2) | ⭐ **R5**: a thin feature's AXIS simplified to a polyline within τ, then an n-gon swept along it |
| **Simplification Envelopes** / its check | Cohen et al., SIGGRAPH 1996; fast-envelope, Wang et al. 2020 | none found | `fast-envelope` (MIT) | ⭐ **the check, fidelity**: the proxy inside the part's τ-envelope |
| **Minimum-volume oriented box** | O'Rourke 1985; OBBTree, Gottschalk et al. 1996 | none found | `ApproxMVBB` (MPL-2.0) | **C-R**: a plate, the plinth, a piston's body — ONE 8-vertex piece |
| **Swept-sphere volumes / capsule chains** | Larsen et al. 1999 / 2000; sphere-meshes, Thiery et al. 2013 | none found (Sandia US 6,099,573 expired 2018) | FCL (BSD-3) | **C-R4, an option**: a bent shaft as capsules — ⚠ the game's GJK reads point sets: a capsule needs its support function in the solver; until then an n-gon prism (≤ 24 vertices: a 12-gon) |
| **Marching Cubes / Dual Contouring** | Lorensen & Cline 1987 (GE US 4,710,876 **expired 2005**); Ju et al. 2002, Schaefer et al. 2007 | MC expired; DC none found | scikit-image (BSD-3); libfive (MPL-2.0) | a voxel route to a closed surface (thousands of faces: VSA after) — the wrap is preferred |
| **QEM decimation** | Garland & Heckbert 1997 | core none found (related Microsoft, Intel patents EXPIRED 2019, 2023) | meshoptimizer (MIT); OpenMesh (BSD-3) | a clean-up only — it does not aim at planar faces; aggressive modes close bores, pinch shafts |
| **PolyFit** | Nan & Wonka, ICCV 2017 | none found | GPL-3+ | plates, the plinth, a case's outside — fails on round shafts, needs a MIP solver |
| **Approximate convex decomposition** — V-HACD (Mamou), CoACD (Wei et al. 2022) | ICIP 2009, GEG 3 2016; SIGGRAPH 2022 | none by their authors — ⚠ **Apple US 12,293,463 B2, active ~2042**: concavity-ordered clusters, a hierarchical cut-plane search, collision from the hulls — an overlap NOT analysed | V-HACD (BSD-3), CoACD (MIT) | ⚠ **C-R2 for concave parts only after a freedom-to-operate review**; strictly patent-free: the concave part SPLIT BY ITS AUTHOR into named convex pieces, each hulled (`PART_AUTHORING.md` §4's `UCX_` as today) |
| ⛔ **Low-poly meshing** (Gao et al. 2022; Chen et al. 2023) | SIGGRAPH | ⛔ **Tencent US 11,900,544, 12,094,060, 12,333,653, 12,505,621 — active ~2042 – 2044** | executable only | **AVOID** |
| ⛔ **Planar-section occluders** (Umbra) | Silvennoinen et al. | ⛔ **US 9,691,177 B2, active ~2035**: voxelize, candidate planes, slice into polygons, select under a budget | — | **AVOID building a proxy by slicing voxels along planes** |
| Recast navigation meshes; Progressive Meshes | Mononen 2009; Hoppe 1996 (Microsoft patents EXPIRED 2016 – 2017) | — | zlib; BSD-3 | no fit: Recast works on 2.5D walkable height fields; progressive meshes only stream levels of detail |

**The pipeline, patent-free** (offline — the build script, or a node tool on the exported `.glb`; GPL tools allowed OFFLINE, their output
meshes not bound by it — ⏳ to confirm):
1. **The proxy:** the part's render mesh **alpha-wrapped** at α = ρ, its offset within τ (R1, R2) → a **VSA** partition into planar regions
   within τ, under R3's angles and widths (merged under θ, pushed past θ + margin) → each region a planar polygon; a **thin feature** (R5): its
   axis by **RDP**, an n-gon swept along it (n from R4); a GOAL's mouth: its ghost, flush (the 11-13 rule). Validated: closed, 2-manifold, outward.
2. **The collision pieces:** a plate, a slab, a body — one **minimum-volume box**; a thin feature — one n-gon prism per segment of its RDP axis (a
   capsule once the solver reads one); a concave part — **split by its author** into convex pieces (strictly patent-free), each hulled and
   reduced to ≤ 24 vertices; ⚠ an automatic decomposition only after the review above.
3. **The checks** (§6): the proxy inside the τ-envelope of the part (fidelity, `fast-envelope`'s idea) AND the outer surface sampled within τ of
   the proxy (coverage) — both ways; closed, 2-manifold, outward; R3's angles, widths, counts; the collision pieces' union within τc both ways.

## 6. The checks — each rule tested both ways, each with its control

| rule | check | its control | `Scene_2` (not rebuilt here — the expected findings) |
|---|---|---|---|
| R1, R2 | coverage of the outer surface (B1i, with R1's ρ-closing instead of the floods' 4 mm grid) AND fidelity (B1e) | a side without proxy; a proxy floating | the plinth's sides; every proxy a selection of faces |
| R3 | faces planar; EVERY face ≥ w (its inscribed width); angles off θ; per STAGE every facet ≥ w (B2 + the facets' sizes) | a sliver; a 19° pair; a cover that leaves a sliver | ⏳ |
| R4, R5 | a curve's facets within τ; a thin feature's prism | a 32-gon; a shaft as a 3-gon | ⏳ |
| R6 | B1e / B1f (as built) | a lifted / flipped proxy | the pistons' resting faces 17 – 37 mm off |
| C-R1 – C-R4 | B1a – B1d (as built); the union within τc both ways; a cavity entered left open; the budget | a dent, a dense piece; a cavity filled | ⏳ |

## 7. The audit (independent, read only, 2026-11-23) — and what it changes

Its claims checked before use: the flush tolerance (`MAP_COPLANAR_M` 0.5 mm, `face_map.ts:32`), *"the 7 mm goes"* (`ORBIT_SURFACE.md` §3.3, decided
2026-11-16 with Q6), B6's 30° (`SCENE_WORKFLOW.md` §4) — all three as it says.

### 7.1 Adopted — each a recorded rule's consequence (the rules above read with these amendments and §7.3's answers)

| # | the finding | the amendment |
|---|---|---|
| 1 ⛔ | τ = 1.5 mm is three times the FLUSH tolerance (`MAP_COPLANAR_M`, S26's 0.5 mm, D4's fit): two flush faces 3 mm apart — a seat's glued face kept, a coplanar front split, a false step | **R2, R6: a PLANAR real face's proxy lies ON it** (≤ 0.25 mm, half the coplanar tolerance); **τ applies only to a curve's facets** (their sagitta, recorded); R6 keeps D4's 0.5 mm |
| 2 ⛔ | a curve wider than R ≈ 44 mm has no answer: R4's sagitta and R3's angles cannot both hold (a car's body, a case's fillets); under θ the face map makes a staircase | **R4 becomes an ANGLE rule**: a curve's facets step by a fixed angle whatever its radius (§7.2 Q2), their sagitta RECORDED and exempt from R2 / R6; the depth over them is P2's on the collision pieces (within τc) |
| 4 | caps, bridges and ghosts mixed: R1b's cap "for every hollow" vs the 11-13 ghost for ONE part (`for_part`); R2 exempts only ghosts; a non-planar mouth | **A CAP class**: virtual, for EVERY held piece, its rim on real proxy edges, flush (⑩), exempt from R2's fidelity and R6; the GHOST stays a goal's, per part; fidelity measured against the part's ρ-closing; a non-planar mouth capped by a wrap at a larger α |
| 5 | R1's *"the part ALONE"* silently answers D7's question (every part's proxy closed); the floor's contact depends on the pose | **Said**: the universal rules choose D7's option 2 — every part's proxy closed over its outer surface (his *"universal"*, the future workflows); authored CLOSED, the floor-glued face dropped by B2 / L1 at its stage (as `exposedPerStage` does) |
| 7 | §3bis against the code: rectangles only (`exposedRects`), slivers dropped at 1.6 mm, cracks of 3 – 7 mm, sub-w risers, caps on a phone, a seated goal's cap, put-downs | **§3bis amended**: polygons from the triangles, exact clipping (Greiner – Hormann 1998, Vatti 1992); a small remnant MERGED into its neighbour, never dropped (no false gap); the ρ-closing per stage absorbs `MAP_GROW_M`; near-flush offsets between parts are SCENE authoring's (§6.3 item 5), "every facet ≥ w" a REPORTED check (L3); stage caps PRECOMPUTED per placed set offline and shipped (no wrap on the phone); a cap leaves with its goal seated; L1 rebuilt at a seat, a put-down, an undo |
| 8 | the collision budget against τc: a ø40 bore within 1.5 mm needs 9 pieces — a 4-bore case 36+; a car shell hundreds | **C-R3**: no fixed count (as his decision 4 for the faces) — a concave wall a ring of convex pieces by an ANGLE rule (as R4); the cost measured per scene (C2); the 11-13 overlap at bends (half a radius) and *"circumscribed"* restored in C-R4 |
| 9 | the numbers: B2's 4 mm cannot resolve 2ρ; a prism's ROLL makes 45° faces; the charts' thresholds uncited; lobes 5 – 8 mm make ring jumps | B2's step ≤ ρ / 2 in the check script (the vector keeps 4 mm on `Scene_2`, said); a horizontal prism lies FACE UP (B6: no face within 15° of 45°); `CHART_CAP_DEG`, `CHART_HEADING_DEG` cited; a lobe's step an S26 event |
| 10 | the checks: per-face tests need the face partition (lost in the `.glb` — why B1g was dropped); no rows for R1 / R1b; "θ + margin" unnumbered; R from what; no PASSING control; decision 5 on a car | **R7 (new) — each proxy FACE its own node** (or a face-id per triangle) in the export; R1 / R1b rows with controls (slots 6.9 / 7.1 mm; an undercut against an L, a V, a U); the margin = B6's 30°; R4 reads its angle, not R; the three shapes he named as CLEAN reference parts (passing controls); decision 5: the candidates the proxy's faces ON ITS CONVEX HULL, the largest first |

### 7.2 Back to him — four questions the audit opens

* **Q1 — the minimum face size w.** He retired *"≈ 7 mm too narrow to stand on"* on 2026-11-16 (P2 now judges what the piece can stand on);
  the minimum his decision 4 asks for is for SIMPLICITY, and binds only the faces the gizmo travels (a riser is an S26 step, not a face). A value
  of its own — proposed **10 mm** — or none (the face map's merge and ¼ share only)?
* **Q2 — a curve's facets** (the angle rule): proposed a **HEXAGON, a face up, for every cylinder** (60° steps: no face near 45°, none near the
  30° threshold, few crossings round a shaft; the sagitta 13 % of the radius — the depth P2's); a doubly curved surface (a car's body): planar
  regions whose normals stay within 20° (merged), neighbours ≥ 30° apart.
* **Q3 — what is capped** (R1b): **(a)** every cavity DEEPER than its mouth is wide, and every UNDERCUT (a region no straight direction through its
  mouth can see — mould visibility, Chen, Chou & Woo 1993; Woo 1994: B4's own sweep with a ρ-ball) — in line with his *"an open cavity is no
  route"*; over-capping a V-notch or the gap between two lobes costs nothing (P2 still dives where the piece fits) — ⭐ proposed; or **(b)** only the
  undercuts (a straight bore, a pocket, a slot followed by the proxy: their walls become faces).
* **Q4 — the collision pieces' count**: none fixed (as the faces'), a concave wall a ring by the angle rule, the cost measured per scene (C2)?

### 7.3 ✅ His answers (2026-11-23: *"I agree with your recommendations. Capture, proceed"*) — THE RULES AS DECIDED

* **Q1 — w = 10 mm**, a constant of its own (SIMPLICITY — not the retired *"too narrow to stand on"*): every proxy face the gizmo TRAVELS at least
  10 mm across (its inscribed width); a RISER — a narrow face joining two faces between which it is a step — is an S26 depth event, reported,
  not a travelled face; a thin feature's faces under w: its prism a 4-gon at least, flagged.
* **Q2 — every cylinder a HEXAGON, a face up** (60° steps), whatever its radius: no face within 15° of 45° of elevation, none near the 30° threshold;
  its sagitta (13 % of the radius) recorded, exempt from R2 / R6 — the depth P2's. A doubly curved surface: planar regions whose normals stay within
  20° (θ, merged), neighbours at least 30° apart (B6).
* **Q3 — (a) CAPPED**: every cavity DEEPER than its mouth is wide, and every UNDERCUT (no straight direction through its mouth sees it — mould
  visibility; B4's sweep with a ρ-ball): a flush CAP (§7.1 row 4), the depth below it P2's; a borderline ratio flagged amber for the author.
* **Q4 — no fixed count of collision pieces**: a concave wall a ring of convex pieces by the angle rule (a bore's wall six slabs, as its hexagon);
  the cost measured per scene (C2).

**The constants** (`units.ts`, one home, mm of the model): ρ 3.5 (`PROXY_PROBE_MM`); w 10 (`PROXY_FACE_MIN_MM`); the flush fidelity of a planar
face 0.25 (`PROXY_FLUSH_MM`, half `MAP_COPLANAR_M`); τ 1.5 for a curve's facets — the hexagon's sagitta recorded beside it; τc 1.5; the cylinder's
step 60° and B6's 30° apart, read where they live.

## 8. His decisions (2026-11-23)

1. **ρ — a CONSTANT**: 3.5 mm (§3 R0; w = 2ρ = 7 mm).
2. **τ, τc — as proposed** (1 – 2 mm): 1.5 mm each, the audit may move them.
3. **A wide hollow that is no goal — BRIDGED**, *"if this is in line with rules we have set for hollows already"*: it is (R1b).
4. **No face count — a MINIMUM SIZE per face and facet** (*"large parts may require more than 16 faces … the hull of a car"*), and *"clarify what
   happens as the assembly gets assembled: how the proxy surface of the assembly evolves and how to append the faces"* → §3bis.
5. **The resting-face candidates — the LARGEST faces**: the proxy's faces of at least a quarter of its largest face's area (the share ¼ as the face map's, a constant
   of its own — ✅ DECIDED 2026-11-24, his *"do 1, 2 and 3 and 5 as you recommend"*).

## 9. The checks — as built

### 9.1 Packet 1 (2026-11-23) — the proxy's own rules: R7, R3, R4, R2

**`checkProxyFaces`** (`src/core/part_checks.ts`; the reader `readPartSolids` now reads each part's RENDER meshes too — the real surface — a
label's mesh apart), the scales in `units.ts` (`PROXY_PROBE_MM`, `PROXY_FACE_MIN_MM`, `PROXY_FLUSH_MM`, `PROXY_CURVE_TOL_MM`, `COLLISION_TOL_MM`):
* **R7** — each `UFM_` node ONE planar face (its triangles within 1°); two coplanar neighbouring nodes: one face split.
* **R3** — each face's INSCRIBED width (twice the largest distance from a point of it to its boundary) at least 10 mm; a RISER (narrow, between two
  faces parallel to each other and square to it) reported as INFORMATION — an S26 step, not a travelled face.
* **R4** — neighbours one face or ≥ 30° apart (B6); at the goal, no face within 15° of 45° of elevation (a face at exactly 30° or 60° passes).
* **R2** — the real surface UNDER each sample of the face: a sample ON a real face of its own normal within the flush (0.25 mm) is flat-on;
  else the render met ALONG the face's normal (either side — never the nearest triangle: a thin wall's underside, a side at an edge); a FLAT real
  face: the proxy within 0.25 mm of it; else a curve: its facet turns at most ±30° from it (the hexagon's half step), its sagitta exempt; no real
  surface within τ either way: a face floating. Sampled over the WHOLE face, to within 2 % of its edges (a facet's span is read at its edges).
* ⭐ **A VIRTUAL face** (`isVirtualProxy`: a RESTING PROXY `…_rest` — one flat face square to the part's approach axis, by design off the real
  surface (the 11-13 principle, `SCENE_2_ASSEMBLY.md` §6.1) — and a CAP `…_cap…`) exempt from R2, R3, from the pair rules with a real face, and
  from B1e / B1h / B1i's covering; its orientation and its one face still read.

**The vectors** (`tests/proxy_rules.test.ts`, 13): ⭐ his three shapes as CLEAN reference parts — a SHAFT (a hexagon, a face up, over a round
24-gon render: its facets within ±30°, its faces at 30° of elevation pass), a HOLLOW CASE (its pocket CAPPED, the cap flush with the ring of the top),
a CHAMFERED HULL (faces 30° and 60° apart, chamfers at 60° of elevation) — every rule passes on them; one planted defect each reads exactly its rule
(two faces in one node; a face split in two; a 6 mm chamfer; a 5 mm riser — information; a 19° pair; a face at 45°; a proxy 0.5 mm off its flat face;
a SQUARE over a round shaft — ±45°; a lifted cap and a floating resting proxy — none). Each RED on its mutant first: R7 blind (*"expected [] to deeply
equal [ 'R7' ]"*), the split blind, a riser never told (*"expected [ 'R3' ] to deeply equal [ 'R3(info)' ]"*), R3 blind, R4's 30° blind, the
elevation blind, R2 flat blind, R2's curve blind (*"expected [] to deeply equal [ 'R2', 'R2', 'R2', 'R2' ]"*), no virtual face (*"expected
[ 'R7', 'R2' ] to deeply equal []"*). **G0** `npm run verify`: 194 files / 2412 tests. 3 s on `Scene_2`.

**Calibrated on the real file, by ASKING what each reading means** (the lesson of S5 §11): the first run flagged every resting proxy — they are
VIRTUAL by design (the 11-13 rule): the exemption, not a narrowing; *"spans ±180°"* came from the NEAREST triangle (a wall's underside) — the cast
along the normal; round rims' tessellations (a 16-gon proxy over a 32-gon render) read as floating — a rim within τ is the rim; the crankshaft's
NOSE disc kept: its render has NO end disc at x 192.5 mm (a ring of 32 points only) — the proxy lies over an open end: a real finding, its message
made to say so.

**`Scene_2`'s report** (pinned — not rebuilt here; findings for the future workflows): **R7** E02, E04, E05, E06 — each `…_outer` node a whole
surface of many faces (R7: one node a face); **R2** E03's nose disc over its render's open end (±89°); E17's proxy half turned inward (±180°).
The check script (`check_part_solids.ts`) counts them in its verdict (a riser apart).

### 9.2 Packet 2 (2026-11-23) — COVERAGE, CLOSURE, CAPS: R1, R1b, R2 the other way

**`checkProxyCover`** (`src/core/proxy_cover.ts`; per part ALONE, in mm; the step ρ / 2 = 1.75 mm — §7.1 row 9):
* **R1 — the OUTER SURFACE**: the render voxelized, the part's solid by a flood of the outside, CLOSED at ρ — the ball's centres are the outside
  points farther than ρ from the REAL surface (exact, the render's triangles), the solid what lies farther than ρ from every centre (two exact distance
  transforms — Felzenszwalb & Huttenlocher 2012): an opening under 2ρ bridged (resolved to about one step), an inner void filled.
* **R1b — what must be CAPPED**: each point of that surface reads its SKY — the straight directions that leave the part (rays on a Fibonacci sphere of
  800, refined at 2° where the reading straddles the amber line): NONE — an UNDERCUT; the widest free cone under **22.5°** — a cavity DEEPER than its
  mouth is wide (a wall's foot sees (90° − atan(depth / width)) / 2: 22.5° at a ratio of 1); **22.5° – 26.6°** (atan ½) — AMBER, information. Every
  such point must lie behind a CAP: the outside, flooded with the caps (`…_cap…`) as walls, never reaches it. ⛔ **A point FAILS only when SURELY deep**
  (its reading's upper bound under 22.5°); one near the line reads amber — a failure is never a reading's error.
* **R2 the other way — COVERAGE**: every point of the outer surface the outside reaches (the caps as walls; an uncapped deep cavity reported once, by
  R1b) within τ of a proxy face — judged at the REAL surface's point nearest it (exact), or at the voxel over a bridged opening (+ its error, 1.87
  steps); a face accepted by ITS OWN tolerance (any face, not only the nearest): τ, or for a TRUE curve's facet (one planar face, its real surface
  within ±30° — R7, R2) its recorded sagitta + τ.
* **R2 — CLOSED**: every edge of the proxy's faces (real and caps; a resting proxy apart) has a face on its other side within the flush, read every
  2 mm (a T-junction shared).
* **R1b — a CAP ON its mouth**: its rim on the real proxy's edges within the flush.
* A part whose proxy is ONLY virtual (a resting face) is REPORTED (R1: 100 % not covered) — never skipped (§7.1 row 5: every proxy closed).
* **The findings, one line per rule and part** (R1: the area, its share, the largest region; R1b: the places, their area, the largest and its narrowest
  sky; R2: the open length, the places) — every place counted, the largest named.

**The vectors** (`tests/proxy_cover.test.ts`, 17; the shapes shared with packet 1 in `tests/helpers/proxy_shapes.ts`): PASSING — his three shapes; an
L's inner corner, a 90° V, a pocket shallower than wide; a 5 mm slot bridged; a 9 mm slot capped; a pocket 0.6 as deep as wide clean (its foot ±29.5°,
by hand); 0.75 never deep (±26.6°, the amber line exactly). DEFECTS — the case's pocket followed, not capped (R1b); a 30° V 60 deep (R1b); a 44° V
(1.05 as deep as wide after the closing) DEEP and a 50° V (0.93) amber; a T-slot's chamber (R1b, UNDERCUT); a pocket 0.9 (amber); a 9 mm slot under a
real face (R1b + R1); his plinth's defect, a box with its top proxy only (R1 + R2); the hull without its top (R1 + R2); a resting face only (R1); the
case's cap lifted 1 mm (R2 + its rim). **15 mutants, each RED**: no ρ-closing; the dilation from the voxel surface; caps not walls; the sky blind; an
undercut read as deep; no refinement at the amber line; rays from the voxel centre; rays against the voxels' staircase; a sample failing when only maybe
deep; no curve allowance; coverage by the nearest face only; coverage blind; closure blind; the cap's rim blind; a virtual-only proxy skipped.

**`Scene_2`** (`check_part_solids.ts`, ≈ 58 s; the vector pins its quick parts — E02, E05, E06 take 4 – 23 s each and stay in the script): every part
FAILS R1 (its proxy a selection of faces — the convention so far): the plinth **E01 58.6 % of its outer surface not covered** (its sides and bottom —
his issue, at its root) and its proxy open (1432 mm of edges); E02 52.1 %, E03 98.9 % (its nose disc only), E04 43.9 %, E05 / E06 35.5 %, E13 / E14
66.8 %, E17 42.1 %; **the pistons E07 – E12 and E15 / E16 carry a resting face only** (100 %); **cavities deeper than wide, uncapped**: E02 (3 places,
≈ 66 300 mm² — its crank chamber), E13 / E14 (8 places each — ports and pockets of the heads); amber: E02, E13, E14. 32 findings; with B1 and packet 1:
FAIL, 47.

### 9.3 ⭐ Lessons of packet 2 (how to MEASURE a part — each found on a control before the vectors were written)

1. **A voxel surface is thick**: rasterized by its voxels' centres (within half a voxel's diagonal), it narrowed every opening by ≈ 3 mm — a 9 mm slot
   read bridged. Distances that decide a rule are measured to the REAL surface (the triangles), the voxels only carry the topology.
2. **A tolerance borrowed from a measure that failed its own rule hides defects**: the "sagitta" of a node holding a whole surface (E02 / E04 / E05 /
   E06's `…_outer`) or of a face over an opening (E03's nose) was hundreds of mm — every gap near it read covered, and every query was slow. Only a
   face that PASSES its rule (one planar face, within ±30° of the curve) carries an exemption.
3. **A grid's staircase biases angles toward "deeper"**: rays tested against voxel cubes and started beside them lost ≈ 3° of sky (a 40° V's floor
   read ±21° for ±23.6°) — a false FAILURE. Rays test the SMOOTH closing (its exact distance field, interpolated) and start one step off the surface.
4. **Judge a reading by the rule's own words**: the Vs' "truth" first computed with the rectangular cavity's yardstick was wrong — after the ρ-closing
   lifts a V's floor, its depth against its mouth's width (1.30 – 0.86 for 36° – 54°) is what the readings follow (deep, deep, deep, amber, amber, clean).
5. **A vector must fail on the mutant of the path it names**: two did not (the refinement's vector passed without the refinement — the region-level
   step saved it); they were replaced by shapes where only that path decides. A path no shape could show (the region-level refinement) was REMOVED,
   and the rule made simpler: fail only when surely deep.
6. **A part skipped is a finding hidden**: a part with no real proxy face was first passed over; it is reported (100 % not covered).
7. **Cost**: measured per part before optimizing (counters): coverage's queries bounded by the corrected tolerance (lesson 2), the sky read on a
   sub-lattice of the shell (samples 2 steps apart, each point its sample's class), rays sphere-traced on the solid's distance field — `Scene_2` 5 min →
   58 s; never at load.

### 9.4 Packet 3 (2026-11-23) — THE COLLISION PIECES (C-R2 – C-R4) AND THE RESTING CANDIDATES (decision 5)

**`checkCollisionPieces`** (`src/core/collision_cover.ts`; per part, in mm; τc = `COLLISION_TOL_MM` 1.5):
* **C-R2 (a) — no visible part OUTSIDE its pieces**: every point of the render (area-proportional samples, ≈ one per 4 mm²; its vertices and edges'
  midpoints) inside a piece or within τc of the union — STRICT, curves too: a thin feature's prism CIRCUMSCRIBES it (C-R4), a ring's slabs lie behind
  a bore's wall.
* **C-R2 (b) — no false contact**: where a piece's surface lies OUTSIDE the render's solid (the outside's voxels — packet 2's flood) farther than τc
  from the render, it sticks out — unless it lies in a RING facet's SAGITTA BAND: a face of the piece judged over its WHOLE extent as over a curve
  within ±30° (the angle rule, §7.3 Q4: a bore's wall six slabs, as its hexagon), its sagitta GEOMETRIC — (w / 2)·tan(span / 2), w its narrowest
  width — plus τc; the band reaches the facet's lens at the piece's ends. Faces between pieces, inside the part, are never read.
* **The resting candidates** (`restingCandidates`, decision 5 + §7.1 row 10): the real planar proxy faces on a supporting plane of the proxy's hull
  (within the flush), each ≥ `RESTING_MIN_SHARE` (¼ — ✅ DECIDED 2026-11-24, his word; a constant of its own) of the largest, the largest first. None: a finding (REST);
  the list: information.

**The vectors** (`tests/collision_cover.test.ts`, 14; the shapes in `tests/helpers/proxy_shapes.ts` — `boxPiece`, `ngonPiece`, `tube`): PASSING — his
case as five slabs (its pocket open, the slabs face to face), the shaft in a circumscribed 12-gon, the hull as its own hull, ⭐ a tube's bore lined by
a ring of SIX slabs (each chord 2.7 mm off the bore — exempt). DEFECTS — the case as ONE box (it fills the pocket: (b)); the shaft in an inscribed
hexagon ((a): 2.7 mm outside); the bottom slab inset 3 mm ((a)); no piece; ⭐ a ring of THREE slabs (±60°, 9.9 mm: (b)); ⭐ one slab of six pushed 5 mm
into the bore (its span still ±30° — past its geometric sagitta); a resting face only (REST); the candidates — the hull's six faces ≥ ¼ (its 6 mm
chamfers out), the case's pocket faces (followed) off the hull. **11 mutants: 10 RED** ((a) blind, (b) blind, no ring exemption, the sagitta measured,
a rim read by its nearest triangle only, samples inside the part judged, a facet judged on its outside samples only, no candidate unreported, no share
filter, faces off the hull kept); the 11th — the inside-a-piece shortcut removed — GREEN by construction: a pure speed shortcut (the distance to a
piece is negative inside it), no vector can see it.

**`Scene_2`** (`check_part_solids.ts`, ≈ 26 s; the vector pins E01, E03, E07, E17): **(a) the render outside its pieces** — E04 22 % up to **42 mm**
(the 42 mm S5 found between its proxy and its pieces), E05 / E06 29 % up to 12.4 mm, the pistons E07 – E12 9 % up to 29.4 mm, the heads E13 / E14 13 %
up to 16.6 mm, the plinth 1.9 % (3.5 mm), E15 / E16 ≈ 3 % (3.7 mm), E02 0.1 %, E17 0.7 %; **(b) pieces sticking out** — the crankshaft's 13 web
pieces 3.1 – 5.6 mm (hulls round its webs), each piston's two pieces 9 – 15 mm (its skirt filled), E15 / E16 four each 4.2 – 8.6 mm, E17 4.2 mm;
**no resting candidate** — E02, E04, E05, E06 (their `…_outer` node not one planar face, R7) and every part with a resting face only (E07 – E12,
E15, E16). With B1 and packets 1 – 2: FAIL, 109.

### 9.5 ⭐ Lessons of packet 3 (how to MEASURE a part — each found on a control or the real file before the vectors were written)

1. **Judge only what the rule's reader meets**: the first (b) read every piece face — the faces BETWEEN pieces, inside the part, cast onto the far side
   of the part and read *"turning ±180°"* on every piece of `Scene_2` (a check flagging everything: the measure, not the files). A false contact can
   only be where the union sticks OUT of the part.
2. **"Curved" is a property of a whole face, never of one point** — a chord's middle over a smooth arc sees its own normal; and of the WHOLE face, not
   its samples outside the part (its ends, nearest the curve, turn the most: judged without them, a ring's span read 7.5° for 22.5°).
3. **An exemption's size is geometric, never measured**: a "sagitta" measured under a facet carries any offset — a slab pushed 5 mm into the bore
   passed. (w / 2)·tan(span / 2).
4. **At an edge the nearest point is shared**: a rim's nearest triangle may be the flat end, not the curve — read every triangle at that distance.
5. **Grid queries search cubes; samples follow area**: a 256 mm reach searched 262 000 cells a sample (13.5 s → 0.4 s once capped and grown outward);
   samples by the longest edge put 1891 on a sliver (by area: a part 20 s → 1.4 s).
6. **A pure speed shortcut has no vector** (C11): recorded as such — its behaviour unchanged by construction, never a path a shape decides.

### 9.6 Owed

* ✅ **R2's fidelity against the ρ-closing** (§7.1 row 4) — BUILT 2026-11-23 night: a face failing against the render is re-read with its samples
  skipped where the render is FAR along its normal (none within a step + τ) while the render CLOSED at ρ lies right under it (`insideClosing`,
  `voxels.ts`): one face over a 5 mm slot passes, over a 9 mm slot still R2 (vectors in `proxy_rules.test.ts`; mutants RED: no re-read; skipped
  wherever the closing lies under — the lifted hull's 0.5 mm and the square's ±45° vanished —; skipped wherever the render is far). ⚠ Its first
  form (the closing's FILL: closed, outside the render's solid) found nothing in a 5 mm slot — the voxel surface, thickened half a voxel's
  diagonal a side, leaves it no flooded air: lesson 1 of §9.3 again. The voxel and triangle primitives moved to `voxels.ts` and `tri_geom.ts`
  (shared by packets 1 – 3 without a cycle); packet 2's closing mutants re-run there, RED.
* ⏳ **The loop** (his word, 2026-11-23): these checks run by hand today — the loop that runs them after every export and stops on a FAIL, and the
  other loops owed: `../../20_GAME_RULES/spec/SCENE_WORKFLOW.md` §11.

