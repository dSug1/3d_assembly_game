# THE PROXY AND COLLISION RULES — universal, for any part (a study, 2026-11-23)

> **STATUS** · ⭐ **A STUDY — HIS FIVE DECISIONS GIVEN 2026-11-23 (§8)**, written into §3 and §3bis; the patent-free methods surveyed (§5); the audit next
> (§7), then the checks — nothing built from it yet. The four-part method (`orbit-design-method`):
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
  ghost exempt); the proxy a closed surface over the outer surface (every edge shared, or on the floor's contact, or a ghost's rim).
* **R3 — PLANAR, NO FACE SMALLER THAN w.** Planar faces only; two adjacent faces either one face (under θ) or clearly apart (over θ + a margin —
  B6's conformance). ✅ **(his decision 4: *"I would not set a limit in number of faces per proxy but rather a minimum size per face or facets since
  large parts may require more than 16 faces if their geometry is complex (for example the hull of a car)"*)** — NO face count: EVERY proxy face,
  and every FACET of the assembly's face map at every stage (§3bis), at least **w** across (its inscribed width) — a thin feature's facets too
  (R5: n lowered, 4 at least); a feature under w even as a square is below the gizmo's scale: absorbed by its neighbour or bridged, and flagged.
* **R4 — A CURVE AS FEW FLATS.** A curved surface of radius R becomes n flat facets, the smallest n whose sagitta R(1 − cos(π/n)) ≤ τ, n kept
  within [4, 12]; a doubly curved one, a polyhedron of planar regions within τ (§5: VSA's partition).
* **R5 — A THIN FEATURE AS A PRISM ON ITS AXIS.** A feature narrower than 2w (a shaft, a rib, a pipe): an n-gon prism (n from R4, ≥ 4, each face ≥ w) along each
  straight segment of its axis; a bend a short joint facet; a lobe its own prism. So the camshaft is a few long prisms the gizmo rolls round in
  n steps, its layout the face map's spits / charts (C22).
* **R6 — ONE OUTLINE.** The proxy and the collision pieces come from the SAME simplified shape: every proxy point within τ of the collision pieces'
  union surface (B1e, D4), facing out (B1f, D5).

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

## 7. The audit — owed (after his decisions, before any build)

## 8. His decisions (2026-11-23)

1. **ρ — a CONSTANT**: 3.5 mm (§3 R0; w = 2ρ = 7 mm).
2. **τ, τc — as proposed** (1 – 2 mm): 1.5 mm each, the audit may move them.
3. **A wide hollow that is no goal — BRIDGED**, *"if this is in line with rules we have set for hollows already"*: it is (R1b).
4. **No face count — a MINIMUM SIZE per face and facet** (*"large parts may require more than 16 faces … the hull of a car"*), and *"clarify what
   happens as the assembly gets assembled: how the proxy surface of the assembly evolves and how to append the faces"* → §3bis.
5. **The resting-face candidates — the LARGEST faces**: the proxy's faces of at least a quarter of its largest face's area (⏳ the share, proposed
   ¼ as the face map's, a constant of its own — for the audit).
