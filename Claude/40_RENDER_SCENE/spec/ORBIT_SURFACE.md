# THE ORBIT'S SURFACE — what it aims at, its rules, its singularities, its obstacles, what the rebuild must specify (2026-11-16)

> ⛔⛔ **PROPOSED, FOR THE OWNER'S REVIEW. NOTHING BUILT, NO CODE CHANGED.** Written 2026-11-16 on branch `1.0.146s-Orbit-surface-spec` (from
> `1.0.146-Orbit-charts`, `1190db2`). Every rule marked **[OWNER]** quotes the owner, with its file, section and date; every rule marked
> **[PROPOSED]** is a reading of this study and is NOT his decision until he says so.
>
> **The owner's request (2026-11-16, verbatim):** *"In the meantime, write the specifications for my review regarding the surface definition. What
> does the surface aim at. What are the rules. What geometries, topologies, singularities shall be considered. What obstacles to overcome. What to
> specify for the rebuild?"* — and earlier the same day (`RND5.md`, `TILTED_POLE_CLOSE_IN.md` §6): *"Also, before step B, we will need to work on the
> surface definition and the singularities (voids, channels, mouths, protrusions, small faces): just capture that in your to do list for the
> moment."*
>
> **How to read it.** §0 is the whole thing on one page. §1 – §5 answer his five questions in his order. §6 compares three ways to build it,
> §7 audits the code as it stands, §8 lists the decisions he can answer in a line. Code references are `file:line` on `1190db2`. "Not verified"
> marks what this study could not check in the sources. ⚠ It un-parks a scope that `ORBIT_CHARTS.md` §4.4 and `RND5.md` still call PARKED; the
> front doors are not updated by this file.
>
> **Reviewed and amended 2026-11-16.** The owner: *"Before you submit the ORBIT_SURFACE.md specifications for my review, do a review yourself
> (you Fable) and amend as necessary (since all singularities and geometries and topologies may not be covered by what we already faced in our
> pipeline) and then submit for my review."* The review added §3.0 (how the catalogue is derived, so that it does not rest on the shapes met so
> far), the classes C25 – C47 (§3.1b), the rules S21 – S25, the obstacles OS13 – OS16, §5.1b, the weaknesses WS19 – WS25 and the decisions
> D-S13 – D-S21; D-S1 is withdrawn. Everything it added is marked *(review)*.

---

## 0. ONE PAGE

**What the surface is for.** The finger moves the gizmo over the assembly; the gizmo is where the piece will land; the piece stands off it and the
camera stands behind the piece. So "the surface" is the answer to one question asked many times a frame: *for this place of the orbit, where on the
assembly is the gizmo?* Everything else — the green and red lines, the charts, the calm, the tilt, the approach, the contact — reads that answer.

**What it is today.** Not one thing, but four that were grown patch by patch: (1) a **convex contour** of big flat facets, on which the charts lay
out the orbit; (2) under each facet a **stack of depths**, where holes are closed, protrusions stand in front, and voids are bridged or entered by
rules written one case at a time; (3) a **ray cast** into the real parts, which gives the final depth; (4) separate **convex hulls** for the
collision and for the piece's support. They mostly agree on the boxes of `Scene_0`, `Scene_0bis` and `Scene_1`. Nothing checks that they agree.

**The idea this study proposes (not decided).** State the surface as **"what the held piece can reach"**: a void the piece cannot enter is
surface; a void it can enter keeps its real depth; a hole through the assembly is closed at its mouth for the orbit and entered only by the
approach (A + dy). Measure "small" with **a named ruler per question** — the held piece for *can the piece use it*, a share of the polygon for
*is it a face of the layout*, the camera for *can the finger reach it* — each one constant, in millimetres of the model where it is a length.
Then build it in clear layers — the parts as
authored → the exposed faces → the features classified against the piece → the convex contour → the charts → the per-frame depth — each with its
input, output, invariants, thresholds and when it is rebuilt — at a change of the placed set, and (already today) at a change of the orbit's
frame (an automatic tilt, a polar-zone switch), with the rule that the frame changes the layout, never the classification.

**What cannot be avoided (mathematics).** A direction field over a surface you can walk around like a ball must have singular points whose
indices add up to 2 (the hairy-ball theorem); gravity's up makes them two poles. Given those two poles, a hole through the assembly adds
singular points of the opposite kind (saddles). A depth read along one direction is a *height field*: it cannot see the underside of an overhang, it
gives zero room to a face parallel to the ray (a tread between two risers), and it jumps at every wall. These are not bugs; each needs a stated
fallback, as the polar zone is for the poles.

**What the review added (2026-11-16, at the owner's request).** The first catalogue held what the scenes and the probes had met. §3.0 now
derives the classes from a grid — the local element; a departure from the facet's plane (a void or a protrusion), its footprint, its profile,
its size; the whole; time; the input — and §3.1b adds the 23 classes the pipeline has NOT met: open cavities and their inner walls, sealed
cavities, buried faces, parts that only touch, arches and legs, bent tunnels, tapered / stepped / undercut voids and inclined floors,
ring-shaped voids, pins and ribs, arrays and grilles, "void or face?", shallow steps, edges by their angle, domes, faces at a threshold,
strongly non-convex assemblies, a singularity on a singularity, the empty assembly, the piece's body against the gizmo's point, the piece
turned, how a piece enters its goal, the topology changing at a seat, defective input. Three ideas follow: the surface is the boundary of the
parts taken TOGETHER that the outside can reach (S22); what is missing and what stands out get the SAME ruler (S23); and the surface is judged
by its purpose — every goal reachable, nothing unreachable silently (S21, S24).

**What the owner is asked (§8).** Twenty one-line decisions: one ruler or several; when the surface is rebuilt; the
depth for a hole a part goes into where no ghost is authored; whether the mouth becomes an ordinary concave edge (and confirming that
`Scene_1`'s notches stay as he left them); and how far the
first build goes (box scenes only, or `Scene_2`'s authored proxies too). The recommendation (§6): keep today's contour and stacks, rewrite them
as **one classified-feature rule** with the piece as the ruler; read authored proxies where a scene has them; use a heavy "accessible surface"
computation only offline, as a checker.

---

## 1. WHAT THE SURFACE AIMS AT

### 1.1 Who reads it, and for what

| reader | what it asks of the surface | where today |
|---|---|---|
| **the gizmo** | the point under the orbit's angles: the place the piece will land | `mapTarget` → `stackDepthAt` → `modelCast` (`face_map.ts`, `assembly_wiring.ts:947`) |
| **the sections** (green, red) | the line the gizmo travels for dx and for dy, drawn on the faces | `assembly_wiring.ts:1297`, `section_hull.ts` |
| **the layout** — charts, columns, levels, poles | which faces exist, their normals, edges and corners: the frame the finger's axes live in | `buildFaceMap` (`face_map.ts:623`), `orbit_charts.ts` |
| **the camera's frame** | the face under the gizmo: its normal, its heading, the turn at a crossing | `free_face.ts`, the carried heading (`TILTED_POLE_CLOSE_IN.md` §3) |
| **the calm** | the face's extent along the run, so the camera looks square in its middle | `orbit_calm.ts` |
| **the tilt, close in** | a face holding a pole; the edge where the tilt starts and ends | `orbit_tilt.ts`, `face_band.ts` |
| **the approach** (A + dy) | the depth the piece may go down to: *"center of the orbit = gizmo"* | `placeOffset` |
| **the contact and the support** | where the piece rests, what it touches | `footprint.ts`, the gap (GJK) |
| **step B** (later) | the normal of the shape with its edges rounded, at the gizmo's place | `ORBIT_CHARTS.md` §5.3 |

### 1.2 What the player must feel

* The gizmo is **where the piece lands** — never in the air, never inside a part ([OWNER] the landing rule, `ORBIT_CHARTS.md` §1 rule 1).
* It **moves with the finger** and **never jumps** (rules 2, 4, 7 there).
* It **runs on the faces he can see and use**: a slot the piece fits is reachable; a crack, a groove too narrow, a sliver is not in the way.
* The camera **looks square** at the face he works on and **stays upright** (rules 3, 6; the calm).
* *(review)* **Every piece can be brought to its goal** from the surface, by the orbit then the approach, the slide or the plunge — at every
  stage of the level; and no face is out of reach without the level's author knowing it (S21, S24).

### 1.3 What it is NOT

* **Not the drawn mesh.** The assembly sways on the glass; everything is read in the model's coordinates ([OWNER] 2026-11-15, `ORBIT_CHARTS.md`
  §4.5: *"in the past we made sure to use the model coordinates, not the swayed assembly coordinates"*).
* **Not the collision shape.** Collision reads `UCX_` convex pieces or the hull at spawn (`core/collision.ts:59`); the surface reads the face
  proxy (`UFM_`) or the render faces (`model_bodies_wiring.ts:111-129`). They answer different questions — *may the piece be here* against
  *where does the gizmo go* — and §7 WS2 shows where they can disagree.
* **Not the shell.** The 60 mm shell round the parts' box carries the piece's and camera's FOOT (`orbit_shell.ts`); the gizmo is on the real
  surface (`TILTED_ORBIT_REBUILD_SCOPE.md` §10).
* **Not a closest-point surface.** Nothing follows the nearest point of the surface each frame (the HoverCam family, US 8,044,953 — excluded).

---

## 2. THE RULES

### 2.1 The rules, numbered

| # | rule | status, source |
|---|---|---|
| **S1** | The surface is the parts' **real outer surface, simplified**: *"surfaces which support gizmo shall be as close to the real surfaces as possible while simplifying their geometries. Sanity check shall be done so there are no false gaps, discontinuities between faces, faces floating in the air, small unreachable faces"* | [OWNER] 2026-11-13, `PART_AUTHORING.md` §3 item 3 |
| **S2** | Only **placed** parts count, and only their **exposed** faces: a face pressed against another part's face is not a surface (R1) | built 2026-11-09 (R1, `POLAR_ORBIT_CLEANUP.md` §6); a rule of the code, no owner sentence found for it |
| **S3** | Everything is computed in the **model's coordinates** | [OWNER] 2026-11-15, `ORBIT_CHARTS.md` §4.5 |
| **S4** | The **bottom** is a face like the others; the floor is crossed by the camera: *"the bottom is a face to orbit as the others (remember that the floor can be crossed by the camera and is invisible from below)"* | [OWNER] 2026-11-04, `TILTED_ORBIT_REBUILD_SCOPE.md` §16.1 (D2) |
| **S5** | **The real depth**, and the piece does not dive by itself: *"Approach into an empty slot: the gizmo shall read the real depth under the gizmo, but the piece shall not go in (it shall continue its orbit). However, the A + dy shall be able to bring the piece inside the depth up to where it collides or where it meets the center of the orbit"* → *"center of the orbit = gizmo"* | [OWNER] 2026-11-04, §16.1 (D3) |
| **S6** | **Holes are closed** at the contour: *"close the holes for the moment"* | [OWNER] 2026-11-04, `TILTED_ORBIT_REBUILD_SCOPE.md` §15 |
| **S7** | **A closed void with no floor is bridged; with a floor, its real depth**: *"a void that is closed on either line's travel (faces of that plane on both sides of it along the green's travel or along the red's) and has no bottom (there is no bottom of the void where the gizmo can project) is bridged"* | [OWNER] 2026-11-09, `POLAR_ORBIT_CLEANUP.md` §8.3 |
| **S8** | **A void the held piece cannot enter is surface**, open or closed | built at the owner's *"Build"* (§7) and *"Yes"* for closed voids (§8.3), 2026-11-09 |
| **S9** | A **protrusion**: the gizmo on the frontmost part under the point; a close-in block against it is normal: *"it is normal the orbit gets blocked if the piece collides with the protruding part at close in"* | [OWNER] 2026-11-09, `POLAR_ORBIT_CLEANUP.md` §6 (d) |
| **S10** | A **mouth**: *"the tilt shall happen when the red section reaches the edge at the bottom of the mouth"* | [OWNER] 2026-11-10, `POLAR_ORBIT_CLEANUP.md` §9.10 (built as `mouthHold`) |
| **S11** | **Small faces converging** go polar: *"if the faces contour is small and many faces converge to a singularity, polar orbit shall be the only way"* | [OWNER] 2026-11-13, `POLAR_ZONES.md` header |
| **S12** | The surface **changes as the game goes on**: *"it cannot be at boot: the assembly will change as the game progress"* | [OWNER] 2026-11-13, `POLAR_ZONES.md` header |
| **S13** | A part going INTO a hole rests on a **ghost at the mouth**, then a **plunge**: *"the ghost face shall always be a face aligned with the assembly face where the hole exits"*; ghosts are *"connected to real surfaces"* | [OWNER] 2026-11-13, `PART_AUTHORING.md` §3 item 3 (ghost read by the game: NOT built; plunge: NOT built) |
| **S14** | A singularity that would cause a jump is **excluded** from the close-in surface, reached by going out and back in: *"If a jump/back-and-forth/etc. would occur within the limited surface, the limited surface shall exclude this singularity (and the singularity shall be reached by going out of the close in and back in)"* | [OWNER] 2026-11-08, `TILTED_ORBIT_REBUILD_SCOPE.md` §32, branch `1.0.107-Close-in-atlas` only (the close-in atlas it framed was superseded; whether the principle stands is D-S10) |
| **S15** | No **local patch**: *"analyze the deep root cause, don't patch with fix which may conflict with other rules"* | [OWNER] 2026-11-15, `RND5.md` |
| S16 | **A named ruler per question for "small"**: every size test on the surface names its ruler — the **held piece's footprint** for *can the piece use it* (enter a void, stand on a face); a **share of the polygon** for *is it a face of the layout* (keep a facet, merge a sliver); the **camera** for *can the finger reach it* — never the surface's. One constant each, in `units.ts`, with its unit (§3.3) | [PROPOSED] (D-S2) |
| S17 | **The orbit's layer is sphere-like** (genus 0): every hole through the assembly is closed at its mouth for the layout; depth below the contour is a **height field** over each facet, read by the cast | [PROPOSED] — it states what the code already does (§3 C3, C4) and makes it a rule (D-S3) |
| S18 | **A function of the place**: the gizmo, the face and the depth are functions of the orbit's angles and of the held piece only — never of the path. The mouth's hold is the one exception today | [PROPOSED] — the principle is `TILTED_ORBIT_REBUILD_SCOPE.md` §15's (the face map, *"a function of the orbit's angles"*); the exception is W9 (D-S6) |
| S19 | **Rebuilt at two kinds of event, each with its invariant**: (i) the **placed set** changes — a pick-up, a put-down, a seat: the exposed faces and their classes (L1, L2) are rebuilt; (ii) the **orbit's frame** changes — an automatic tilt or a polar-zone switch, both built, approved and happening while the finger orbits: only the layout (L3, L4) is rebuilt in the new frame, and the classification of every face and feature is **the same in every frame** | [PROPOSED] (D-S4). Today (ii) re-runs the whole `buildFaceMap` on the turned faces, keyed per tilt and per zone (`faceMapOf`, `assembly_wiring.ts:868-880`), and nothing checks (ii)'s invariant (WS14) |
| S20 | **A mouth's concave edge is a crossing like a convex one** (C7(a) only): the channel's floor meeting the rising end of the facet is an edge between two faces, with its own turn (0° for a rising wall). ⛔ Not the other concave edges: `Scene_1`'s notches stay as the owner left them (D-S12) | [PROPOSED] — `TILTED_POLE_CLOSE_IN.md` O11 (D-S6) |
| S21 | **Every goal is reachable** *(review)*: at every stage of a level, the goal of each piece still to place is reached from a place of the surface by the orbit, then the approach, the slide or the plunge. The surface exists for that; it is checked when the level is built, not discovered by the player | [PROPOSED] (D-S16) — the purpose behind S1's *"no … small unreachable faces"* |
| S22 | **"Exposed" means reachable from outside** *(review)*: the surface is the boundary of the placed parts taken TOGETHER (their union) that the outside can reach. A face glued to another (S2), buried inside another part's material, or shut in a cavity that a cover has sealed is not surface | [PROPOSED] (D-S17) — S2 generalised (C26, C27) |
| S23 | **The same ruler for what is missing and for what stands out** *(review)*: the surface under the gizmo is where the piece's resting face can come to rest. A void the piece cannot enter is closed (S8); by the same ruler a protrusion the piece cannot stand on is not a place — the piece is blocked by it (S9's second half); a field of such protrusions (studs, teeth, ribs) is surface at their tops | [PROPOSED] (D-S14) — departs from S9's first half as built, for protrusions narrower than the piece only |
| S24 | **Nothing is unreachable silently** *(review)*: for each scene and each stage, the build lists the exposed faces that are no place of the orbit, each with its class and the reason (parallel to the cast, under an overhang, too small, inside a cavity) | [PROPOSED] (D-S16) |
| S25 | **A part is a closed solid** *(review)*: a part with open edges, flipped faces or self-crossings is refused when the scene is built (or stands behind its proxy); parts that overlap are read through S22 | [PROPOSED] (D-S21) |

### 2.2 The tensions between the rules

| between | the tension | today's answer |
|---|---|---|
| S1 *close to the real* vs S6 / S7 / S8 *closed, bridged* | a bridged void is NOT the real surface | the owner's own order: real where the piece can use it, bridged where not |
| S5 *real depth* vs S13 *ghost at the mouth* | three answers for "a hole a part goes into": the real floor (S5, S7), the mouth plane (S13), the approach to contact (S5's second half) | none: ghosts are not read yet (§7 WS6). D-S5 |
| S7 / S8 vs landing (rule 1) | a bridged void puts the gizmo where the piece **cannot** land (in the air over the hole) | accepted: the gizmo marks the plane, the approach stops on contact |
| S8 vs the layout | the depth depends on the held piece; the layout (contour, charts) does not | the layout ignores voids entirely (`ORBIT_CHARTS.md` §4.4) |
| S10 vs S18 | the mouth's hold depends on how the gizmo got there | `TILTED_POLE_CLOSE_IN.md` W9 — open |
| continuity (rule 2) vs S5 *real depth* | a height field jumps at every wall: the gizmo either jumps or glides | the glide (`gizmoGlide`): a depth step over 5 mm (`GLIDE_MIN_M`, `orbit_tilt.ts:642`) is glided over time (~125 ms, `POLAR_ORBIT_CLEANUP.md` §9.9) — a time patch over a space jump |
| S20 *a concave edge a crossing* vs the owner's notch decisions | read for every concave edge, S20 would change `Scene_1`'s notches, which the owner ruled on: *"I don't see the current implementation as an issue … The gizmo and piece movements are normal, even with small jumps"*, then, asked whether to bridge it, *"Stays as it is"* (2026-11-09, `POLAR_ORBIT_CLEANUP.md` §6 (a)); and the step walk (F8) and the line joins (F6) were NOT ported for his *"too many back and forth of the red and green sections"* at the notches (§8.1) | S20 limited to the mouth (C7(a)); the notches as built — D-S12 |
| S12 / S19 *the frame's map* vs one classification | the tilted pole and the polar zones rebuild the map in their frame mid-orbit; a looser box or other seeds there can keep or drop a different facet than the world's map | not checked (WS14) — S19 (ii)'s invariant, D-S4 |
| S11 *small faces polar* vs D5 *small faces merged* | two answers for a small face, with two different rulers | S11 for fans round an apex; D5 (¼ of its polygon) elsewhere — not reconciled |
| S12 *changes in play* vs determinism | the surface at a seat must be the same whatever order the player took | the face map is a function of the placed set (`placedKey`) — deterministic per set, not checked across orders |
| S23 vs S9 *(review)* | S9's first half, as built, puts the gizmo on the frontmost part under the point whatever its width; S23 keeps the gizmo on the base beside a pin or a rib the piece cannot stand on | D-S14 — the owner's sentence in S9 is about a protruding PART as large as the held piece |
| S21 *every goal reachable* vs S17 / OS3 *(review)* | a goal against an inner wall, under an overhang or down a bore is no place of a ball-like height field | such a goal is reached by the approach, the slide or the plunge, or carries an authored ghost (S13) — D-S15; the check of D-S16 says which goals need it |
| S8 / S23 *the piece is the ruler* vs the piece being TURNED *(review)* | an oblong piece fits a slot one way only: the classes would change under the player's own turn of the piece | today the two smallest sizes whichever way (WS10) — D-S13 |
| D5 *a facet kept by its share* vs S8 *a void the piece cannot enter is surface* *(review)* | a comb, a field of studs, a grille open to the facet's edge is surface for the piece and may cover less than ¼ — today's share closes only the main group's ENCLOSED holes, whatever their size against the piece (`face_map.ts:537-543, 173-224`) | the share measured after the piece's closing — D-S19 |

---

## 3. THE GEOMETRIES, TOPOLOGIES AND SINGULARITIES TO CONSIDER

**Words.** *Geometry* = a size or an angle: a threshold can decide it. *Topology* = how the surface is connected (a hole through, an island,
a face that wraps round): no threshold makes it go away; it can only be closed, cut or given a fallback. *Facet* = one flat face of the convex
contour. *Stack* = the depths found under a facet (its own plane, parts in front of it, floors behind it). *Travel* = the line the gizmo follows
for dx (the green) or for dy (the red).

Sizes (from `scene_*.ts`, `SCENE_2_ASSEMBLY.md`): every scene is held near the cube's 490 × 483 × 483 mm; the held pieces' footprints are
41.3 × 45 mm (green frustum) and 44.8 × 51.8 mm (turquoise prism); `Scene_2`'s parts go down to 2.8 mm flanges and 0.6 mm chamfers.

### 3.0 How the catalogue is derived — so that it does not rest on the shapes met so far *(review)*

[PROPOSED] The classes C1 – C24 of §3.1 are the ones the scenes and the probes have met. To cover what they have not, every feature of a
surface is read on the grid below; a class is one cell of it, and a shape nobody has drawn yet falls in a cell too. §3.1b lists the cells
the pipeline has not met.

| axis | its values |
|---|---|
| **1. the local element** | a face (flat; inclined; curved one way; curved both ways) · an edge (convex or concave; by its turn: shallow — under the merge angle —, ordinary, acute — near 180°) · a corner (convex, concave, saddle, a fan; a pinch where two solids only touch) |
| **2. a departure from the facet's plane — its sign** | a void (material missing) · a protrusion (material added): the same questions are asked of both |
| **3. … its footprint on the facet** | an island (closed all round) · a strip (open at one end, at both) · a ring (a boss in a pocket, a moat) · many (an array) — and where it sits: inside the facet, on one edge, on a corner, cutting the facet in two, on a pole or a seam of the layout |
| **4. … its profile along the depth** | straight walls · narrowing (a countersink, a V) · widening (an undercut: a dovetail, a cavity, a mushroom) · stepped or nested (a counterbore, a slot in a slot) · right through (a tunnel, a handle) — and its floor (or its top): flat and parallel to the facet, inclined, curved, none |
| **5. … its size against a ruler** | its width against the held piece, as the piece is turned · its depth or height against a depth ruler · its share of the facet · its spacing against the piece (arrays) |
| **6. the whole** | one solid or several islands · holes through (the genus) · sealed cavities · how far from convex · parts overlapping, or only touching · nothing placed |
| **7. time** | the placed set changes (a seat, an undo) · the held piece changes · the held piece is turned |
| **8. the input** | a closed solid, or not (open edges, flipped faces, self-crossings) |

### 3.1 The catalogue

In one line each, for a small screen: C1 – C3 are the faces and edges themselves (convex, odd-shaped, concave); C4 – C9 are the voids (holes
through, channels, blind slots, mouths, grooves, gaps between islands); C10 – C14 are what stands out or is too thin or small (overhangs,
protrusions, treads, fins, slivers); C15 – C16 are curves and apexes; C17 – C19 are how faces combine (coplanar, glued, holed); C20 – C24 are
the floor, ties, long shapes, the surface changing in play, and the held piece's own size.
C25 – C47 (§3.1b) are the classes the pipeline has NOT met, added by the review from §3.0's grid.

| # | class | plain definition | G / T | where | today's code | "small" against |
|---|---|---|---|---|---|---|
| **C1** | convex faces, edges, corners | flat faces meeting outward | G (angles); T for the sum at corners | everywhere | facets within 20° (`MAP_AXIS_DEG`, `face_map.ts:30`), D5 ¼ share, charts | the polygon (D5) |
| **C2** | non-rectangular faces | triangles, pentagons, a heptagon's ends, a fan's triangles | G | `Scene_0`, `Scene_0bis`, the 35 test shapes | F1: placed on the polygon (`ORBIT_ANY_SHAPE.md` §2) | — |
| **C3** | **concave edges and corners** — a step, an L, a wall rising from a floor | the surface folds inward | G for the angle; T for "the contour is no longer convex" | Scene_1's notches, the channel walls, the anchor and frusta meeting their hosts | folded INTO the stack: a depth step, not an edge; no turn, no event (`free_face.ts:240`: *"a concave edge … is the study before step B's"*); `Scene_1`'s notches kept so by the owner (*"Stays as it is"*, `POLAR_ORBIT_CLEANUP.md` §6 (a)) | — |
| **C4** | **through holes, tunnels** (genus > 0) | a hole you could pass a string through | **T** | none placed today; `Scene_2`'s bores into the hollow case | closed on the facet's plane (`stackDepthAt`, `face_map.ts:991`) | none: closed whatever its size |
| **C5** | **channels** — a groove open at one or both ends | a long void, a floor, two walls | G (width) + T (open ends) | `Scene_1`'s five boot slots (480 mm long), the top's black channel (130 × 32 mm) | the floor followed if the piece fits (S7, S8); the ends seen from the front are mouths (C7) | the piece's footprint |
| **C6** | **blind holes, pockets, slots**, a goal slot waiting | a void with a floor, closed on all sides | G (enterable) + T (a boundary) | `Scene_1` before placing; `Scene_2`'s bores before the plunge; `void_sim` | real depth if the piece fits, else bridged (`face_map.ts:999`) | the piece's footprint (`heldFoot`, 0.5 mm) |
| **C7** | **mouths** — ⚠ two meanings in the record | (a) **code**: a void closed across but open up the facet toward its edge — the top channel seen from the front; (b) **cavity**: an opening narrower than the room behind it — a bore into a hollow case | (a) T (path); (b) G/T | (a) Scene_1's channel ends; (b) `Scene_2` only, `void_sim`'s undercut | (a) bridged + `mouthHold` + the automatic tilt (`orbit_tilt.ts:290`); (b) measured by its opening at the plane (`voidOpening`, `face_map.ts:1021`) | (b) the piece, at the mouth |
| **C8** | **grooves, narrow gaps between parts** | a crack between two parts | G | the 3 mm core joints, the bottom groove (x 103.5 – 116.5, i.e. 13 mm, in `POLAR_ORBIT_CLEANUP.md` §7; called "10 mm" in its §8.3 — not reconciled), the 47 – 50 mm notch, the 90 mm rebate | joints < 3.2 mm closed by growth (`MAP_GROW_M` 1.6 mm, `face_map.ts:34`); wider: the void rules | **two rulers**: `MAP_GROW_M` (a Scene_1 constant) and the piece |
| **C9** | **islands** — placed parts not touching | the surface in several pieces | **T** | none placed today | one contour over all; a closed gap with no floor bridged whatever its width; non-coplanar → the nearest group's plane, `inside: false`, no cast (`face_map.ts:1003-1010`) — the gizmo hangs in air | none |
| **C10** | **overhangs, undercuts** | a part sticking out above another, its underside facing down | G (depth, angle); T-like for a height field (two surfaces on one ray) | Piece44 (upside down on the top), Piece45 (front), `Scene_2`'s cases | nothing specific: the cast hits the overhang first; its underside only from the bottom cap; the support's convex hull fills the space under it (`footprint.ts:25`) | — |
| **C11** | **protrusions** — a boss, a pin, a part standing proud | a part in front of the facet's plane | G | Piece42, Piece43, `Scene_0`'s anchor, the tips of `Scene_0bis`; **each piece once placed** | the gizmo on the frontmost group (`face_map.ts:1003`); a jump of 41 – 49 mm onto and off it, glided | nothing: any height climbed |
| **C12** | **faces parallel to the cast** — a tread between two risers, the side of a proud part | zero width seen along the facet's normal | **T for a height field** | Scene_1's step treads (I10), every protrusion's sides | never a place (I10 open; F8 *"walk the step"* not ported) | — |
| **C13** | **thin plates, fins, blades** | thinner than the piece or the shell | G | Scene_1's 10 mm slabs (edges only), `Scene_2`'s 2.8 mm flanges | nothing: a fin vanishes in the shell's box; step B worse on a blade (`ORBIT_CHARTS.md` §5.3) | not stated |
| **C14** | **small faces, chamfers, slivers** | a face too small to work on | G | frusta's sides, `Scene_2`'s 1.4 mm bevels | D5 ¼ share; a chamfer beyond 20° kept as its own thin facet; authoring flags ≈ 7 mm | **six rulers** in the record (§3.3) |
| **C15** | **curved runs** — cylinders, discs, bores, tori | many small faces round a curve | G (facet count vs 20°); T if closed round | `Scene_2` only; the barrel test shape | quantised into facets of ≥ 20°; authoring answers with flat proxies (`PART_AUTHORING.md` §1) | the merge angle |
| **C16** | **fans and apexes** | faces converging on one point | G (size) + T (the apex's angle defect) | `Scene_0bis`'s tips, test shapes | the charts' FAN kind; polar (S11) | the polar zone's size |
| **C17** | **coplanar faces of different parts / at different depths** | one plane made of many parts | G | `Scene_1`'s front (~36 parts) | grouped by plane (0.5 mm) and contact (grown 1.6 mm) | `MAP_COPLANAR_M` |
| **C18** | **glued / internal faces** | a face pressed against another part's | T (which side is outside) | 240 faces in `Scene_1` | removed (`exposedRects`, `face_map.ts:515`), coplanar opposite within 0.5 mm; on the **bounding rectangle** of each face | — |
| **C19** | **a hole inside ONE face** | a round hole cut in a plate | T | none (every part a box); `Scene_2`'s holed strips | ⛔ **invisible** to the stacks — a face is its bounding rectangle (`face_map.ts:482-486`); only the cast finds it (`POLAR_ORBIT_CLEANUP.md` §7, last lines) | — |
| **C20** | **the floor and what touches it** | the frozen floor; a face resting on it | T (occlusion) | `Scene_0` flush on the floor; `Scene_1` 15.5 mm above; Piece43 sunk 26 mm | the floor excluded (`assembly_wiring.ts:909`); the bottom a virtual cap at the box; no rule for a face in contact with the floor | — |
| **C21** | **no level face; tied pole candidates; symmetry** | a ridge, a vertex up, equal faces | T for ties; G for the tie tolerance | `Scene_0`'s zenith ridge; test shapes | charts' top set within 1° (`CHART_CAP_DEG`, `face_map.ts:810`) | 1° |
| **C22** | **very long, very flat shapes** | aspect ratio far from 1 | G | `Scene_0bis` (730 × 483 mm), `Scene_2`'s plinth | spit zones | — |
| **C23** | **the surface changing in play** | a seat adds a protrusion, fills a slot; `Scene_2` grows from a slab | T (the surface's identity changes) | every scene at each seat | face map rebuilt per placed set (`placedKey`, `assembly_wiring.ts:840`); never measured across a seat | — |
| **C24** | **the held piece's own size** | a piece as big as the assembly, or bigger than the voids | G | `Scene_2`'s cases and banks | `heldFoot` = the two smallest sizes of the drawn mesh's own box (`assembly_wiring.ts:926`) | — |

### 3.1b The classes the pipeline has not met *(review)*

[PROPOSED] From §3.0's grid. "Today's code" is what the rules as described in this study would do there — expected, not run; the cells that
cite a `file:line` were read in the code on `1190db2` (2026-11-16), the others are inferences from the rules of §2 and §3.1.

| # | class | plain definition | G / T | where it occurs, or will | today's code (expected) | "small" against |
|---|---|---|---|---|---|---|
| **C25** | **open cavities the piece can enter** — a tray, an open box, a cup, a U | a void so large that the piece works INSIDE it: a floor, and inner walls | T for a height field: the inner walls face no facet of the contour | `Scene_2`'s lower case; any box built wall by wall | the floor is a void's floor (entered, S7 / S8); the inner walls are faces parallel to the cast (C12): never a place | the piece |
| **C26** | **sealed cavities, enclosed parts** | a space closed on all sides once a cover is placed, and whatever is inside it | T (a second, inner boundary) | `Scene_2` when a case closes over the crank | its faces stay "exposed" (they are not glued): only a coplanar opposite face of another part removes a face (`face_map.ts:488-496`, `exposedRects` `:515-534`); every face fed seeds a candidate facet (`:627-630`) and joins its stack (`:474`), so it can be a stack's main group and carry the D5 share (`:537-543`); no cast from outside reaches it — the cover is met first (`assembly_wiring.ts:972`) | — |
| **C27** | **buried faces** — parts overlapping in volume | a face, or a part of one, inside another part's material (a press fit, a part sunk into another) | T (the surface is that of the parts taken together) | Piece43 sunk 26 mm (into the floor, which is not surface); none designed in `Scene_2` — its rod's big end was left OPEN so as not to overlap the crank pin, the overlap refused (`SCENE_2_ASSEMBLY.md` §2.6); a press fit in a later scene | only a coplanar opposite face of another part removes a face (C18; `face_map.ts:488-496`, `:515-534`): a buried face stays, whole | — |
| **C28** | **parts that only touch** — along an edge, at a point | two solids sharing a line or a point: the surface pinches there | T (not a proper surface at that line) | boxes set diagonally; a wedge's edge on a face | no rule: the contour spans it; beside it a void narrowing to zero | the coplanar tolerance |
| **C29** | **handles, arches, bridges, legs** | a hole through whose axis runs ALONG the facet: a lintel on two posts, a table on its legs, a handle | T (genus) + an overhang (C10) | a part bridging two others; an assembly raised on feet | from the facet above: an overhang; from the side: a void, open toward the floor (a mouth (a) turned down) or closed (C4) | the piece |
| **C30** | **bent and branching tunnels** | an elbow (its two mouths on two facets), a T of channels, a tunnel opening on the bottom | T | channels meeting at a corner; `Scene_2`'s ports | each mouth is judged alone, on its own facet; nothing ties the two ends | the piece, at each mouth |
| **C31** | **voids with a profile** | narrowing (a countersink, a V groove, a funnel); stepped or nested (a counterbore, a slot in a slot's floor); with a floor that is inclined or curved (a ramp, the valley between two banks, a bowl) | G + T: "the floor" is no longer one plane parallel to the facet | `Scene_2` (counterbores; the V between the cylinder banks) | a floor is a deeper group of the facet's stack (`face_map.ts:988`): faces within the merge angle (20°) of the facet's normal, each at the level of its CENTRE (`stackOf`, `:474-478`). An inclined floor within 20° is a floor at its centre's level, and the cast reads its real slope (`assembly_wiring.ts:965-973`); a curved floor is many such groups, one per level. ⚠ Beyond 20° it is in no group of that stack — a closed void over it is bridged as if it had no floor (`face_map.ts:991`), an open one falls to the nearest group's plane with no cast (`:1004-1010`, WS4). The fit is read only at the plane (`voidOpening`, `:1021`), never level by level | the piece, at each depth |
| **C32** | **ring-shaped voids, things inside pockets** | a moat round a boss, a pin standing in a hole, a tube (a hole in a protrusion) | T (the footprint is a ring) | `Scene_2`'s bores and their pins | the fit test reads two runs through the point, along the facet's `t` and `b`, each to the PLANE's first real face (`voidOpening`, `face_map.ts:1021-1058`), the piece either way round (`pieceEnters`, `:1061-1064`): in a moat one run is the ring's width, the other runs along it. A boss whose top is flush with the plane cuts the runs; a boss standing proud or sunk is on another plane and does not — the opening read is the whole pocket's, and the boss itself is climbed (`:1003`) | the piece against the ring's width |
| **C33** | **protrusions by their own size and profile** | a plateau the piece can stand on; a pin, a rib, a lip, a rim it cannot; a mushroom, a flange, a hook (a protrusion with its own overhang) | G (+ T for the overhang) | each seated piece (a plateau); `Scene_2`'s 2.8 mm flanges, its pins | any height is climbed whatever the width (C11): no ruler for a protrusion | the piece (proposed, S23) |
| **C34** | **arrays and porous faces** | many features, each too small for the piece, together most of the face: a grille, a perforated plate, a comb, a row of fins, studs, teeth, threads | G (their spacing) | `Scene_2` (fins, bolt circles) | each void bridged (S8) — but the facet's keep rule (D5) reads the area of the stack's MAIN group only, grown 1.6 mm and with its ENCLOSED holes closed whatever their size (`mainOf` → `regionArea` → `filledRegion`, `face_map.ts:537-543, 312-317, 173-224`): a grille's holes inside a frame count, a comb's slots open to the facet's edge and the studs' tops (another plane) do not — a comb or a field of studs may lose its facet (D5 against S8); studs: the gizmo climbs each one (`:1003`) | the piece against the spacing |
| **C35** | **void or face?** | a void that takes most of its facet (a frame, the rim of a tray), a rebate open on two sides, a missing corner (a notch across three facets) | G (a share) — a continuum: pocket → rebate → step → another face | `Scene_1`'s 90 mm rebate; any assembly half built | decided by D5's share and by which plane is the facet's main region: an implicit rule | the facet's share |
| **C36** | **shallow features** | a recess or a step of about a millimetre; a seated piece a little proud or a little low; faces a degree apart | G (a depth, an angle) | every seat (a fit is never exactly flush) | under 0.5 mm: coplanar; over 5 mm: a glide; between the two: a small jump with no event | a DEPTH ruler — missing today |
| **C37** | **edges by their angle** | a shallow edge merged under 20° (the facet's normal then up to 20° off the real face's); an acute edge, a knife ridge (a turn near 180°); a dished face (shallow, concave) | G | frusta, wedges, chamfered parts | merged or kept by `MAP_AXIS_DEG`; the acute ones are the half turns of `TILTED_POLE_CLOSE_IN.md` | the merge angle |
| **C38** | **doubly curved and free-form parts** | a dome, a ball, a cone, a fillet as large as the piece, an organic shape | T for a ball (all pole); G elsewhere | none today | quantised into facets (C15); no stable flat face, nowhere flat for the piece to rest | the merge angle; authored proxies |
| **C39** | **faces at a threshold** | nearly level (the cap's 1°), at the 20° merge, leaning outward and down (an inverted frustum) | G | `Scene_0bis`'s tips; any tilted frame (WS14) | a class may differ between the world's map and a tilted frame's | each tolerance |
| **C40** | **strongly non-convex assemblies** | an L, a U, a C, a cross, a ring, two towers and a bridge; the orbit's centre in the air | T / G: the convex contour is far from the solid | assemblies half built; the early stages of `Scene_2` | the contour's facets are mostly void; floors hundreds of mm down, glided in ~125 ms; inner faces out of reach (C25) | how much of the contour is real |
| **C41** | **a singularity on a singularity** | a void or a protrusion at a pole, on a seam, across a chart's edge; a mouth at a pole's edge; two features closer than the piece, or than the 5 mm band | T (a coincidence) | a channel on a face that holds a pole (`Scene_1`'s top) | each rule is written alone; their meeting is not specified (OS9's last line) | — |
| **C42** | **empty and nearly empty assemblies** | nothing placed yet; one part smaller than the held piece; the first seat | T (no surface at all) | the start of `Scene_2` (a slab); a level's first move | no surface at all: with nothing placed the shell's box is `null` (`shellBox`, `orbit_shell.ts:26-33`), so is the face map (`assembly_wiring.ts:873, 887`) and the map's gizmo (`:949`); the gizmo stays where it was, else the orbit's centre — the boot target, radius 0.5 m (`ensureAssembly`, `:94-96`; `:1242`, `:657`). Every scene boots with a placed part — `Scene_0`'s heptagon (`scene_0.ts:13-14`), `Scene_1`'s pieces at their goals, `Scene_2`'s anchors (`model_import.ts:87, 281`); the set is empty when `lockPlacedPieces` is 0 (`goal_lock.ts:22`). One small part: the map is built on it like any other | — |
| **C43** | **the piece's BODY against the gizmo's POINT** | a place where the point is on the surface but the body does not fit: beside a wall, a protrusion, a void's rim; the piece hanging over a facet's edge; a face narrower than the piece | G (the piece's half-width) | everywhere, close in | left to the contact (the solver, the ring's hold): the gizmo and the piece part there | the piece's half-width |
| **C44** | **the piece turned** | an oblong piece enters a slot one way only (a keyed slot); the ruler changes when the player turns the piece | G + time | `Scene_1`'s bars; the piece's eight orientations | the footprint is the two smallest sizes, whichever way the piece is turned (WS10) | the piece as it is turned |
| **C45** | **how a piece ENTERS its goal** | set down on a face; slid along a channel from its open end; plunged along a bore; hooked under an overhang; pushed between two parts | the purpose, not a shape | every level's assembly plan (`SCENE_WORKFLOW.md`, W1) | the first by the orbit; the plunge specified, not built; the others by the approach and the slide where they happen to work | — |
| **C46** | **the topology changing in play** | a seat seals a cavity, completes an arch (a new hole through), joins two islands, fills a slot flush or nearly; an undo reverses it | T + time | every level | the map is rebuilt for the new placed set (C23); what happens to a gizmo standing on a face that has just gone is not stated | — |
| **C47** | **defective input** | a part that is not a closed solid: open edges, flipped faces, self-crossings, duplicate or zero-area faces | the input | an imported `.glb` | the proxy's sanity checks ①–⑩ for model parts, at the Blender build only; the game checks nothing — a proxy goes straight into a mesh (`model_bodies_wiring.ts:111-117`; no closed-solid test anywhere in `src`); a scene written as data is made of boxes, frusta and prisms, closed by construction | — |

### 3.2 Sketches (cross-sections; `#` = material, `.` = air, `G` = where the gizmo goes today)

```
C5 channel, seen across its length          C7(a) the same channel seen from its end: a "mouth"
  G G G G . . . . . G G G G   <- plane        front face  |######|   G held on the plane, then the tilt
  #######.........#######                                 |######|   hands it to the top's facet
  #######_G_G_G_G_#######   <- floor                      |##  ..|<- the channel's end, open up
  (the piece fits: the red runs on the floor)             |##  ..|
                                                          
C4 through hole (no floor)                  C10 overhang: the cast from above meets the top first
  G G G G G G G G G G G G    <- bridged       G G G G G
  #######.......#######                       #########          <- the overhang
  #######.......#######                       ...........        <- its underside: never a place from above
  #######.......#######                       ####.........####  <- the host face, hidden under it

C12 a step: the tread is parallel to the cast of the side facet
  facet's normal -->   |####       the red, driven by pitch, casts horizontally: it meets the riser,
                       |####       then the next riser; the TREAD between them is zero width
                  _____|####       on that height field: never a place (I10)
                 |#########
```

### 3.3 "Small" — measured against what

Six rulers stand in the record, none named as THE one (rule 3: *one constant in one place* is broken):

| ruler | where | its space |
|---|---|---|
| the held piece's two smallest sizes (+ 0.5 mm) | voids (S8) | model mm |
| ¼ of its own polygon (D5, `facetMinShare`) | facets | an area ratio |
| ≈ 7 mm "too narrow to stand on" | authoring check ⑤ | ⚠ ambiguous: "on the glass" in `PART_AUTHORING.md` §4.3, no unit in item ⑤ (authoring only) |
| 0.22 × the placed box's smallest side (T3) | polar zones, `chartLayout 0` only | model mm, relative |
| the finger: a 37 mm face is 0.34 mm of finger far out (I17) | the reach on the glass | finger mm, depends on distance |
| `MAP_GROW_M` 1.6 mm | joints | model mm — a Scene_1 construction gap |
| *(review)* the coplanar 0.5 mm and the glide's 5 mm | depths: under the first, two faces are one; over the second, a step is glided; between them a step is a small jump with no event (C36) | model mm — two numbers, no named DEPTH ruler |
| *(review)* the piece AS IT IS TURNED | a keyed slot (C44) | model mm — today the two smallest sizes whichever way (WS10) |
| *(review)* a spacing | arrays (C34): studs, fins, a grille | model mm, against the piece — not measured today |

[PROPOSED] Three of them answer three different questions and can stay apart **if named**: (1) *can the piece use it?* — the piece; (2) *is it
a face of the layout?* — a share of the polygon, or the piece; (3) *can the finger reach it?* — a camera matter (close in reaches anything),
not a property of the surface. The joint growth is a tolerance of the scene's construction and belongs with the coplanar tolerance, not with
"small".

---

## 4. THE OBSTACLES

Each: why it is fundamental (plain words first, then the mathematics), where it can be overcome, where it cannot and the fallback.

| # | obstacle | why fundamental | can be overcome where / how | cannot where → fallback |
|---|---|---|---|---|
| **OS1** | **The turn budget** — the orbit's cross (green, red) cannot be carried round a closed shape without turning | carry a small cross round a corner without turning it and it comes back turned by the corner's *angle defect* (2π minus its face angles); over a closed ball-like surface they sum to 720° (Gauss–Bonnet), and any direction field has singular points whose indices sum to 2 (Poincaré–Hopf, the hairy-ball theorem) | on flat faces (none of it lives there): the turn is paid on edges and at chosen points — the charts do this (`ORBIT_CHARTS.md` §1) | at the poles and fans → **the polar zone**. ⭐ The surface's singularities ADD to it: a notch's inner corner (+90°), a saddle where a re-entrant edge meets a top (−90°) — each a place the charts must pay for, unseen today because the contour is convex (and `Scene_1`'s notches left so by the owner, D-S12) |
| **OS2** | **Holes through** (genus) | a hole through changes the count: 720° becomes 720° × (1 − g), and — given the two poles gravity imposes — each handle forces saddle-type singularities a columns chart cannot hold (a torus alone admits a field with none; it is the poles that force them). A smooth orbit over a ball cannot map one-to-one onto a ring-shaped surface | close it: at the mouth plane the hole is filled (S6, S7) — the orbit's layer stays ball-like (S17) | a hole the piece must go through or into → **not orbited, approached**: the approach (A + dy) or the plunge (S5, S13). The layer never contains it |
| **OS3** | **A height field cannot see everything** | a depth read along one direction is one number per place: it cannot hold the underside of an overhang (two surfaces on one ray), gives zero width to a face parallel to the ray (the tread), and steps at every wall (`TILTED_ORBIT_REBUILD_SCOPE.md` §31.4: occlusion, topology, sharp edges — *"no bijection possible"*) | where the faces are front-facing along their facet's normal: everything on the boxes' outer faces | an overhang's underside → reached from the facet that faces it (the bottom cap) or not at all; a tread → **a stated choice** (D-S7): unreachable, or its own facet; a wall's step → the **glide**, named as the one depth event |
| **OS4** | **Jumps at depth steps** | the height field is discontinuous at every wall and protrusion: landing (the real depth) and continuity cannot both hold there | the glide smooths the gizmo in time (a depth step over 5 mm glided over ~125 ms) | ⛔ a time smoothing is a patch over a space jump; S14's exclusion (the singularity reached by going out and back) is the systematic fallback for close in — D-S10 |
| **OS5** | **"Small" has no single size** | the piece, the polygon, the finger and the scene's joints measure different things; the finger's ruler changes with distance, so no model-mm threshold makes a face reachable at every distance | §3.3's three questions, each with its ruler, each one constant | the finger's reach far out → **close in** (the camera), never the surface |
| **OS6** | **The surface depends on the held piece, on time and on the frame** | S8 makes the depth a function of the piece; S12 makes the faces a function of the placed set; the tilted pole and the polar zones rebuild the layout in their own frame mid-orbit; continuity across a pick-up or a seat cannot be promised | rebuild the faces and their classes only when the placed set changes (S19 (i)), where the gizmo is relocated anyway; in a new frame rebuild only the layout, the classification held the same (S19 (ii)) | a seat that changes the face under the gizmo → **a relocation event**, stated once (the gizmo to the nearest place on the new surface), never a jump mid-gesture |
| **OS7** | **Sharp edges have no normal** (step B) | a polyhedron's normal jumps at every edge; "the shape with its edges rounded" needs a radius, and a face smaller than the radius disappears into its edges | a rounding radius tied to the ruler (S16) | fins and blades thinner than the radius (C13): the normal flips side → step B's own fallback (`ORBIT_CHARTS.md` §5.3: worse on a blade) |
| **OS8** | **Numbers that are almost equal** | coplanar within 0.5 mm, joints of 3 mm, a clip at 1e-9 that dropped a whole facet (R2): floating-point and modelling tolerance decide topology | one family of tolerances, each a named constant with its unit; tests on shapes AT the tolerance | none if every tolerance is explicit; the record's six coplanar angles (§7 WS8) are the risk |
| **OS9** | **Path dependence at a mouth** | at a void open toward an edge the same angles can mean the floor or the next facet: two sheets over one place | treat the mouth's concave edge as an ordinary crossing (S20, O11): the floor's far edge against a rising wall turns 0° | if a mouth is also a pole's edge, the tilt and the crossing must be one event (step 2.4's one transition) — not verified on any scene |
| **OS10** | **Curved parts** | a curve made of many small flat faces either merges into slivers or splits into many tiny facets | authored flat proxies (`PART_AUTHORING.md` §1, §3); or a planar segmentation (VSA, §6) | a fan round an apex → **polar** (S11) |
| **OS11** | **Islands** | a convex contour spans the gap between two islands; the depth under it is empty | bridge a gap the piece cannot pass (S8 extended to "no floor") | a gap the piece can pass, with nothing under it → **the gizmo stays on the contour plane** (bridged) — today it hangs at the nearest plane instead (WS4) |
| **OS12** | **Several geometries for one part** | the proxy, the collision pieces, the convex support and the render faces are authored or computed apart | a build-time check that they agree within a tolerance | none if the check exists; today it does not (WS2) |
| **OS13** | **The convex contour is an assumption** *(review)* | the layout stands on a convex envelope of big flat facets. It is a fair picture only while the assembly fills most of that envelope: on an L, a U, a tray, a ring, two towers, the envelope's facets are mostly void, and the faces that look INWARD face no facet at all | while each void is a feature IN a facet (most of the facet real): the classes of §3 | a strongly non-convex assembly → **a stated limit**: a measure of how much of the contour is real, checked per level and per stage (D-S20); beyond it, the inner faces are reached by the approach and the slide only (D-S15 (a)), or the assembly is split into lobes with a contour each — a new design (prior art: approximate convex decomposition), not proposed here |
| **OS14** | **The gizmo is a point, the piece is a body** *(review)* | where a POINT may stand and where a BODY fits differ by the body's half-width along every wall, rim and protrusion (configuration space: the obstacles grown by the piece). A point-wise surface cannot be both "where the gizmo is" and "where the piece lands" there | classify with the piece's footprint (S8, S23): voids closed, pins no places; beside a wall the contact's solver parts the piece from the gizmo, as today | exactness for a piece that is not a box, and for its orientation (C44) → a conservative footprint, stated (D-S13) |
| **OS15** | **The classes form a continuum** *(review)* | a pocket widens into a rebate, a rebate into a step, a step into another face; holes multiply into a grille; a boss thins into a pin. Somewhere a threshold decides, and a shape AT the threshold can fall either way — in the world's frame and in a tilted one (C39) | one ordered list of tests with named rulers (S16), the same list in every frame (S19 (ii)) | a shape at a threshold → **refused at authoring** by a margin (a feature must be clearly of one class: a stated factor away from each ruler), as `PART_AUTHORING.md`'s checks do for the proxies |
| **OS16** | **Some goals are not places** *(review)* | S17 keeps the orbit's layer ball-like and OS3 hides what no facet faces; but a level may ask for a piece inside a cavity, under an overhang, down a bore, between two parts | the approach (A + dy), the slide, the plunge; an authored ghost at the entry (S13) | a goal none of these reaches → **the level's plan changes** (the order of assembly, W1 of `SCENE_WORKFLOW.md`) — found by the check of S21 (D-S16), never by the player |

---

## 5. WHAT TO SPECIFY FOR THE REBUILD

### 5.1 The layers

[PROPOSED] Six layers, each a pure function in `src/core` or `src/input`, in model coordinates, deterministic (same input → same output,
ties broken by a stated key, never by array order). In one line each: L0 what the parts carry; L1 which faces are outside; L2 what each
void, step or bump is for THIS piece; L3 the convex contour; L4 the charts on it; L5 the gizmo each frame. L0 – L2 do not depend on the orbit's
frame; L3 – L4 are built in it.

| layer | input | output | invariants | thresholds (unit, home) | rebuilt when | cost |
|---|---|---|---|---|---|---|
| **L0 — the parts as authored** | render mesh, `UFM_` face proxy, `UCX_` collision pieces, ghost faces (`for_part`) | per part: its route faces (proxy, else render faces), its collision pieces, its ghosts | proxy sanity ①–⑩ (`PART_AUTHORING.md` §3); **new**: proxy and collision agree within a tolerance (OS12); every face outward | fidelity 0.7 mm (authoring) | at import | once |
| **L1 — the exposed faces** | the placed set (goal-locked, not frozen, not orbited); L0's route faces on their model poses | the exposed faces: each a polygon, its normal, its part; glued portions removed | a glued face never present; regions from the **triangles**, not the bounding rectangle (C19); every point of a face in exactly one face | coplanar distance and angle (ONE pair, `units.ts`) | at a seat, a put-down | O(faces²) per plane |
| **L2 — the features, classified against the piece** | L1 + the held piece's footprint | per facet: its features — void (closed / open / mouth), floor or none, enterable or not; protrusion; step; tread; island gap | each feature has ONE class and ONE rule (§5.2); the class is stable under a change below the tolerance; a void's opening measured in the facet's plane against the footprint's resting face | the ruler (S16): the piece's footprint + one tolerance | at a pick-up and a seat | per facet, cell grid |
| **L3 — the contour** | L1 (and L2's closures) | the convex facets: polygons, normals, edges, corners; caps | closed; convex; no self-crossing; every exposed face assigned to one facet; D5's keep rule stated with its ruler; **the same facets in every frame**, up to the frame's turn (S19 (ii)) | merge angle (20°), keep share (¼) | at a seat; and in the orbit's frame at an automatic tilt or a polar-zone switch (built today: `faceMapOf`, `assembly_wiring.ts:868-880`) | the heaviest build today |
| **L4 — the atlas** | L3 | charts, poles, frames (`ORBIT_CHARTS.md`) | as `ORBIT_CHARTS.md` §1 — **plus**: the mouths' concave edges (S20) counted in the turn budget (OS1); the notches as decided (D-S12) | as there | as L3 | ≈ 10 ms (Scene_0bis) |
| **L5 — per frame** | the orbit's angles, L3 – L4, L2 for the place | the gizmo's point, its face, its normal, the depth, the events (crossing, glide, relocation) | a function of the angles and the piece (S18); no path state except the gesture's own hold; within the 24-query budget | — | every frame | the cast; memo ≤ 512 |

### 5.1b What the review adds to the layers *(review)*

[PROPOSED] By layer, what C25 – C47 and S21 – S25 ask beyond the table above:

* **L0** — each part is a closed solid, checked (S25); a part's goal carries its **entry** (set down, slid, plunged — C45) where it is not a
  plain set-down.
* **L1** — "exposed" computed as **reachable from outside** on the parts taken together (S22): buried faces (C27) and the faces of a sealed
  cavity (C26) leave; parts that only touch along an edge or at a point (C28) are joined or parted by the ONE coplanar tolerance, never left
  pinched.
* **L2** — ONE classification for both signs, voids and protrusions (S23), written on §3.0's grid: the footprint (island, strip, ring, many),
  the profile (straight, narrowing, widening, stepped — read level by level, down to a stated number of levels), the floor (flat, inclined,
  none); with the lateral ruler (the piece, by D-S13's policy), a named DEPTH ruler (D-S18) and the spacing for arrays. The ORDER of the tests
  is part of the rule (OS15).
* **L3** — the keep rule (D5) measured AFTER L2's closures (D-S19); a measure of how much of the contour is real (OS13), with its limit.
* **L5** — what happens to the gizmo when the face under it goes or appears at a seat or an undo (C46): the relocation, stated once.
* **A check beside the layers** (offline, per level and per stage of its plan) — the faces that are no place (S24) and the goals not reachable
  (S21). Way C of §6 is its natural second implementation.

### 5.2 The table SINGULARITY → RULE → EVENT

[PROPOSED] — the classes of §3 with the rule each gets and what happens when the gizmo crosses its border. "Bridged" = the gizmo on the facet's
plane over it. "Entered" = the real depth. "Approached" = reached only by A + dy or a plunge. "Fallback" = a zone of its own.

| class | rule | event at its border |
|---|---|---|
| C1 convex faces, edges, corners | facets of the contour (L3), laid out by the charts | a crossing, its turn |
| C2 non-rectangular face | placed on its polygon (F1) | a crossing at each of its edges |
| C3 concave edge other than a mouth (a notch, a step) | a depth step, as built — the owner's notches (D-S12) | a glide |
| C4 through hole | bridged at the mouth plane, always | none (the plane continues) |
| C5 channel, piece fits | entered (its floor) | a **glide** at each wall; at an open end, a **crossing** (C7) |
| C5 / C6 / C8 void, piece does not fit | bridged | none |
| C6 blind hole, piece fits | the ghost at the mouth where the part is authored to plunge (S13, decided); entered elsewhere (D-S5) | a glide |
| C7(a) mouth | a concave edge: an ordinary crossing (S20) — replaces the hold (D-S6) | the crossing's camera turn (0° for a rising wall) |
| C7(b) cavity behind a narrow opening | measured at the opening; behind it: approached only | — |
| C9 island gap | bridged on the contour plane | none |
| C10 overhang underside | not a place from above; from the facet facing it | — |
| C11 protrusion | entered (its top) | a glide (or excluded close in, S14 — D-S10) |
| C12 tread | D-S7: unreachable (stated), or a facet of its own | — |
| C13 fin, C33 pin / rib / flange narrower than the piece *(review)* | D-S14: not a place — the gizmo on the base, the piece blocked by contact (S23); or climbed, as today | none / a glide |
| C14 small face | below the keep rule: part of its neighbours (O9) | none |
| C15 curve | authored proxies, or planar segmentation | crossings between its facets |
| C16 fan | polar (S11) | the polar zone's entry |
| C17 coplanar faces of several parts | one face per plane and contact (L1), one coplanar tolerance pair | none inside it |
| C18 glued faces | removed (L1) | — |
| C19 a hole in one face | ⏳ open until L1 reads regions from triangles; then it is a C4 or C6 by its size | as C4 / C6 |
| C20 face on the floor | not a place | — |
| C21 ties, symmetry | broken by a stated key, never by array order (§5.1) | — |
| C22 very long, flat shapes | ⏳ open — no surface rule; the spit zones handle the layout (`ORBIT_CHARTS.md`) | the spit's entry |
| C23 a seat | L1 – L4 rebuilt | a **relocation** (OS6), once |
| C24 a piece as big as the assembly | ⏳ open — the piece's ruler then bridges every void (S8); no rule for a piece wider than the facet it stands on | — |
| a frame change (tilt, polar zone) | L3 – L4 rebuilt in the frame; classes unchanged (S19 (ii)) | the tilt's or the zone's own transition |
| C25 open cavity the piece enters *(review)* | its floor entered; its inner walls no places — reached by the approach and the slide (D-S15) | a glide at the rim |
| C26 sealed cavity, C27 buried face *(review)* | not surface (S22) | at the seat that seals it: a relocation if the gizmo stood there (C46) |
| C28 parts that only touch *(review)* | joined or parted by the coplanar tolerance | — |
| C29 handle, arch, legs *(review)* | from above an overhang (C10); from the side a void by S7 / S8 | as C4 – C7 |
| C30 bent or branching tunnel *(review)* | each mouth by its own facet's rule; behind it: approached only | — |
| C31 void with a profile *(review)* | read level by level: entered down to the last level the piece fits; an inclined floor ⏳ open (a depth by the cast, or a facet of its own if large) | a glide per level |
| C32 ring-shaped void *(review)* | by the ring's width against the piece | a glide |
| C33 plateau the piece can stand on *(review)* | entered (its top), as C11 | a glide |
| C34 array, porous face *(review)* | voids the piece cannot enter closed; studs it cannot go between: surface at their tops (S23); the keep rule after the closing (D-S19) | none |
| C35 void or face? *(review)* | by the order of the tests (OS15): a void open on two sides, or holding most of the facet, is a step or a face — ⏳ the share to state | a crossing if a face, a glide if a step |
| C36 shallow step *(review)* | under the depth ruler: flush (D-S18) | none |
| C37 shallow edge, merged *(review)* | the facet's plane for the layout; the real face's normal for the piece's rest — ⏳ to state | none |
| C38 doubly curved, free-form *(review)* | authored flat proxies only (D-S9); else not supported, and said so | — |
| C39 face at a threshold *(review)* | refused at authoring by a margin (OS15) | — |
| C40 strongly non-convex assembly *(review)* | D-S20: the measure and its limit; beyond it, lobes (not designed) | — |
| C41 a singularity on a singularity *(review)* | ⏳ open — each pair to state (a void at a pole: the pole on the bridged plane; a mouth at a pole's edge: one event) | one event, never two |
| C42 empty or nearly empty *(review)* | ⏳ open — today no map and no gizmo of its own (WS25); the rule to state | — |
| C43 the body against the point *(review)* | the contact's solver, as today (OS14) | — |
| C44 the piece turned *(review)* | D-S13 | a relocation if the classes change |
| C45 goal entries *(review)* | each goal's entry authored where it is not a set-down; checked (S21) | — |
| C46 topology changing at a seat *(review)* | L1 – L4 rebuilt; the gizmo relocated once (OS6) | a relocation |
| C47 defective input *(review)* | refused at the build (S25) | — |

### 5.3 The vectors and the test shapes that would prove it

* **Synthetic shapes, each NON-convex** (the chart helpers are all convex today, `tests/helpers/chart_shapes.ts:2`): a plate with `void_sim`'s
  nine families; an L-shaped top; a single step and a staircase (the tread, C12); a channel open at one end, at both ends; a T overhang; two
  islands at three gaps (narrower, equal to, wider than the piece); a round hole in one face of a non-box part (C19); a 12-sided cylinder; a fin
  10 mm thick; a glued joint at 3 mm and at 5 mm.
* **Per shape**: the L2 class of every feature for two pieces (41 × 45 and 80 × 80 mm); the L5 gizmo on a 1 mm sweep — no jump above the glide
  outside a named event; the same result after the shape is moved and turned (model coordinates); the same result for every order of placing
  its parts (S12 determinism); the same classes and the same facets in the world's frame and in each tilted or polar-zone frame (S19 (ii)).
* *(review)* **Shapes for the classes not met**: an open tray and a cup (C25); a box closed by a lid, in two steps (C26); two boxes
  overlapping, touching along an edge, at a corner (C27, C28); a table on four legs, an arch (C29); an elbow tunnel (C30); a countersink, a
  V groove, a counterbore, a dovetail, a ramp in a slot (C31); a boss in a pocket, a tube (C32); a plateau, a pin, a rib, a mushroom (C33); a
  grille and a field of studs at three spacings (C34); a frame, a rebate on two sides, a missing corner (C35); steps of 0.3, 1 and 6 mm (C36);
  two faces 15° and 25° apart, a knife wedge (C37); a dome and a cone, tessellated (C38); an L, a U, a ring, two towers and a bridge (C40); a
  void at a pole and across a chart's edge (C41); nothing placed, one small part (C42); an oblong piece at a keyed slot, both ways round (C44)
  — each with the class expected for two pieces, and the faces expected to be no place.
* **The scenes**: `Scene_1`'s replay (grooves, channel, mouth), `Scene_0`, `Scene_0bis` unchanged where their features are unchanged.
* Each new vector shown **failing against today's code** before it is trusted (`CLAUDE.md` rule 2).

### 5.4 Deliberately left out

* `Scene_2`'s proxies and ghosts — the owner reviews them himself (2026-11-15).
* The plunge snap; step B itself; the collision's construction; the piece's footprint-swept support (`HOVER.md` §0 item 21, "Step 8").
* *(review)* Sub-assemblies that MOVE once placed (a hinge, a crank that turns): the surface is that of the parts at rest in their goal poses.
* The finger's reach far out (I17, closed *"not applicable"*): a camera matter, not the surface's.

---

## 6. THE CANDIDATE WAYS (from the prior art)

Not designs: three coherent ways to make the definition systematic.

**A — Classified features on today's contour.** Keep the convex contour and the stacks; rewrite the void, mouth, protrusion and step rules as
ONE classification (L2) with ONE ruler; regions from triangles; one tolerance family. Prior art: CAD **defeaturing and virtual topology** (small
faces grouped into composite faces by a "defeature size", COMSOL / Ansys); its formal name for what D5 does.

**B — An authored surface.** Every scene carries face proxies and ghosts, built and checked in Blender (`PART_AUTHORING.md`), and the game
reads them; computation only checks. Prior art: game collision proxies (`UCX_`), navigation meshes authored beside render meshes.

**C — The surface accessible to the held piece, computed.** The placed parts' union **closed** by the piece's footprint (morphological closing:
grow by the piece, shrink back — every void the piece cannot enter fills in) and, if wanted, **opened** (thin protrusions removed), at each
pick-up and seat; faces then extracted by planar segmentation (Variational Shape Approximation, Cohen-Steiner et al. 2004). Prior art: the
solvent-accessible surface (a probe rolled over a molecule), configuration-space obstacles (Lozano-Pérez 1983), alpha wrapping (CGAL 2022).

| | A — classified features | B — authored | C — accessible, computed |
|---|---|---|---|
| solves | C4 – C9, C11, C14, C17, C18 with one rule; C19 once regions read triangles | C15 curves, C13 fins, C7(b) cavities, C19 — whatever the author draws | every void, groove, mouth and gap by ONE operation; the ruler is the piece by construction |
| costs | a rewrite of `stackDepthAt` and its callers; new vectors on non-convex shapes | authoring every scene; the box scenes need proxies generated; the game must read ghosts (`for_part`) | a voxel or mesh closing per pick-up in the browser (64³ – 128³: a few hundred ms, not measured); rounds concave edges (the slot's real floor corner lost) — conflicts S5; non-deterministic seeding in VSA unless fixed |
| leaves open | curved parts; overhang undersides; treads (OS3) | consistency between author and rule; scenes nobody authored | the piece is not a ball (an oblong piece fits a slot a ball does not); overhangs; it is the shell + cast family's cousin (`TILTED_ORBIT_REBUILD_SCOPE.md` §22 – §29: dropped) |
| patents | none known (textbook) | none | ⚠ US 10,699,492 B2 (cavity removal) — scope not checked; closing itself is textbook (Serra); CGAL is GPL |

⚠ **What was already tried.** On 2026-11-13 the owner answered three proposals — (A) patching the face map, (B) a simplified shape + cast,
(C) gizmo-driven plane cuts: *"your proposals A, B and C have already been tried when we tried to build the tilted orbits the first time. It
all fails because there is no bijection possible between the orbit and the faces of the assembly"* (the record of designs tried). What differs
here: way A is not a new orbit → surface mapping nor a patch of the face map's mapping; it rewrites the per-case void, mouth and protrusion
rules into ONE classification of the surface the existing mapping reads, and keeps OS3's non-bijection as stated fallbacks. Way C's computed
surface is the cousin of the dropped shell + cast; it is kept OFFLINE, as a checker, never as the orbit's runtime.

*(review)* **Against the classes not met (C25 – C47).** A covers them only if L2 is written on §3.0's grid (the sign, the footprint, the
profile, the ruler) instead of case by case — otherwise each new shape brings a new patch, which is how today's rules grew. B is the natural
answer where no flat rule exists: doubly curved parts (C38), goal entries (C45), the places inside a cavity (C25). C, offline, is what computes
"reachable from outside" (S22), the faces that are no place (S24) and the goals not reachable (S21) — a flood from outside with the piece's
footprint: the check, never the runtime.

**Recommendation [PROPOSED]: A as the game's rule, B where a scene authors proxies, C offline only as a checker.** A keeps what the owner has
approved and replaces the patches by one rule; B is already adopted for `Scene_2`; C, run in a probe (never per frame), says whether A's
classification matches "what the piece can reach" on every test shape — a second implementation to falsify the first, not a runtime.

---

## 7. THE AUDIT OF WHAT IS BUILT

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

---

## 8. THE DECISIONS FOR THE OWNER

| # | question | options | recommendation |
|---|---|---|---|
| ~~D-S1~~ | *(review)* withdrawn: step B is *the view read from the place* (`ORBIT_CHARTS.md` §5.3, `RND5.md`); the other reading came from a wording error in this study's brief, not from the owner | — | — |
| **D-S2** | One ruler for "small"? | (a) the held piece's footprint for every size test; (b) a ruler per question, each named (§3.3) | (b) with three named rulers: the piece (use), the polygon share (layout), the camera (reach) |
| **D-S3** | The orbit's layer always ball-like (S17)? | (a) yes: holes closed at the mouth, depth as a height field, holes entered by the approach only; (b) holes orbited through | (a) |
| **D-S4** | When is the surface rebuilt? | (a) S19: faces and classes (L1, L2) at pick-up, put-down and seat; the layout (L3, L4) also at a tilt and a polar-zone switch, with the classification the same in every frame (checked by a vector); (b) as today: the whole map re-run in every frame, unchecked (WS14); (c) the frame's map a pure turn of one world build | (a) — (c) is simpler but a frame's caps and sides are not a turn of the world's |
| **D-S5** | A hole a part goes into, where **no ghost is authored** (where one is, the owner decided: *"the ghost face shall always be a face aligned with the assembly face where the hole exits"*, S13) | (a) the real floor; (b) the mouth plane | (a), as S5 says |
| **D-S6** | The mouth | (a) its concave edge an ordinary crossing (S20, O11) — the hold deleted; (b) keep the hold | (a), measured first on `Scene_1`'s channel |
| **D-S7** | A tread between risers (I10) | (a) unreachable, stated; (b) a facet of its own | (a) until a scene needs it |
| **D-S8** | A gap open both ways with no floor (WS4, islands) | (a) bridged on the contour plane; (b) as today | (a) |
| **D-S9** | Where the definition comes from | (a) computed from render faces for box scenes, proxies where authored (§6 A + B); (b) proxies for every scene | (a) |
| **D-S10** | Does S14 stand (exclude a singularity close in, reach it by going out and back)? | (a) yes, as the fallback for a protrusion's or a wall's jump close in; (b) no, the glide stays | (b) until a scene shows a jump the glide cannot hide — then (a), which was his rule on a superseded design |
| **D-S11** | The first build's reach | (a) `Scene_0`, `0bis`, `1` and synthetic shapes; (b) with `Scene_2` | (a), `Scene_2` when the owner has reviewed its proxies |
| **D-S12** | The concave edges other than a mouth (`Scene_1`'s notches, steps) | (a) as built — a depth step, neither bridged nor followed, as the owner ruled (*"Stays as it is"*, 2026-11-09, `POLAR_ORBIT_CLEANUP.md` §6 (a); F8 and F6 not ported, §8.1); (b) crossings like the mouth | (a); reopened only if a device look shows a defect there |
| **D-S13** *(review)* | The piece as the ruler, when the player turns it (C44) | (a) the piece as it is turned now — the classes change at a turn (a relocation); (b) its two smallest sizes whichever way (today); (c) its largest footprint (nothing entered that might not fit) | (b) for the first build: stable under a turn, the contact refuses what does not fit; (a) only when a keyed slot needs it |
| **D-S14** *(review)* | A protrusion the piece cannot stand on — a pin, a rib, a flange (C13, C33) | (a) not a place: the gizmo stays on the base, the piece is blocked by contact; (b) climbed, as today | (a) — the same ruler as for the voids (S23) |
| **D-S15** *(review)* | The inner walls of an open cavity (a tray), the underside of an overhang (C25, C10) | (a) no places of the orbit: reached by the approach and the slide, or by an authored ghost; (b) a zone of their own (an orbit inside the cavity) | (a) now; (b) only if a level's plan needs a piece set against an inner wall with no other way |
| **D-S16** *(review)* | A check, when a level is built, that every goal is reachable at every stage, with the list of the faces that are no place (S21, S24) | (a) yes, as an offline probe; (b) no | (a) |
| **D-S17** *(review)* | "Exposed" = reachable from outside, on the parts taken together (S22) — replacing "not glued" | (a) yes; (b) as today | (a) |
| **D-S18** *(review)* | A depth ruler: under which height is a step "flush", with no event (C36) | (a) ONE named constant, a slider, starting at the coplanar tolerance; (b) as today (0.5 mm and 5 mm, unnamed) | (a) — the number chosen on the device, not here |
| **D-S19** *(review)* | A facet's keep rule (D5) measured after the voids the piece cannot enter are closed (C34, a grille) | (a) yes; (b) as today: the main group's region with its enclosed holes closed whatever their size, open voids not closed (WS21) | (a) |
| **D-S20** *(review)* | Strongly non-convex assemblies (C40, OS13) | (a) accepted: one convex contour, deep floors, and a stated measure that warns when a level goes beyond it; (b) split into lobes, each with its own contour | (a) with the measure; (b) is a new design, only when a level needs it |
| **D-S21** *(review)* | Parts that are not closed solids (C47) | (a) refused when the scene is built (a check); (b) tolerated | (a) |

---

## 9. SOURCES

In this tree (`1190db2`):
* [ORBIT_CHARTS.md](ORBIT_CHARTS.md) §1, §4.4, §4.5, §5.3 — the rules, the specificities, the sway, step B.
* [TILTED_POLE_CLOSE_IN.md](TILTED_POLE_CLOSE_IN.md) §2.2 (O7, O9, O11), §4.2 (W8, W9), §6 — the obstacles' method, the mouth.
* [POLAR_ORBIT_CLEANUP.md](POLAR_ORBIT_CLEANUP.md) §6, §7, §8.1, §8.3, §9.4, §9.9, §9.10 — R1 and the notches, the void study, F8 / F6 not
  ported, the void rule, the tilted map, the glide, the mouth.
* [TILTED_ORBIT_REBUILD_SCOPE.md](TILTED_ORBIT_REBUILD_SCOPE.md) §10, §15, §16.1, §17, §18 — the shell, the face map, D2 / D3, D5.
* [ORBIT_ANY_SHAPE.md](ORBIT_ANY_SHAPE.md) §2, §3 — F1, F2b.
* [POLAR_ZONES.md](POLAR_ZONES.md) header — the owner's polar rules (⚠ its header still says "NOTHING BUILT"; `polar_zone.ts` is built — not reconciled here).
* [PART_AUTHORING.md](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) §1, §3 — proxies, ghosts, sanity checks.
* [SCENE_2_ASSEMBLY.md](../../30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md) — the bores, the plunge.
* [RND5.md](../../00_CORE/queue_notes/RND5.md) — the rebuild's dossier, the to-do before step B.
* Code: `src/input/face_map.ts`, `src/input/orbit_charts.ts`, `src/input/free_face.ts`, `src/input/footprint.ts`, `src/input/orbit_tilt.ts`,
  `src/input/orbit_shell.ts`, `src/render/assembly_wiring.ts`, `src/render/contact_wiring.ts`, `src/render/model_bodies_wiring.ts`,
  `src/core/collision.ts`, `tests/helpers/chart_shapes.ts`, `scripts/probes/void_sim.ts`.

Outside this tree: `TILTED_ORBIT_REBUILD_SCOPE.md` §31.4 – §32 on branch `1.0.107-Close-in-atlas` (the bijection, the limited surface); the
session's record of the orbit designs already tried (the owner's 2026-11-13 answer on proposals A, B, C).

Prior art (generic; patent scopes NOT checked unless said):
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
