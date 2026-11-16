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
approach (A + dy). Measure "small" with **one ruler — the held piece**, in millimetres of the model. Then build it in clear layers — the parts as
authored → the exposed faces → the features classified against the piece → the convex contour → the charts → the per-frame depth — each with its
input, output, invariants, thresholds and when it is rebuilt.

**What cannot be avoided (mathematics).** A surface you can walk around like a ball forces at least two poles (the hairy-ball theorem); a hole
through it adds more, of the opposite kind. A depth read along one direction is a *height field*: it cannot see the underside of an overhang, it
gives zero room to a face parallel to the ray (a tread between two risers), and it jumps at every wall. These are not bugs; each needs a stated
fallback, as the polar zone is for the poles.

**What the owner is asked (§8).** Eleven one-line decisions: what "step B" means; one ruler or several; whether the surface depends on the held
piece; ghost-at-the-mouth versus computed depth for a hole a part goes into; whether the mouth becomes an ordinary concave edge; and how far the
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
| **S14** | A singularity that would cause a jump is **excluded** from the close-in surface, reached by going out and back in: *"If a jump/back-and-forth/etc. would occur within the limited surface, the limited surface shall exclude this singularity (and the singularity shall be reached by going out of the close in and back in)"* | [OWNER] 2026-11-07, `TILTED_ORBIT_REBUILD_SCOPE.md` §32, branch `1.0.107-Close-in-atlas` only (the close-in atlas it framed was superseded; whether the principle stands is D-S10) |
| **S15** | No **local patch**: *"analyze the deep root cause, don't patch with fix which may conflict with other rules"* | [OWNER] 2026-11-15, `RND5.md` |
| S16 | **One ruler for "small"**: every size test on the surface (enter a void, keep a face, merge a sliver, see a protrusion) compares to the **held piece's footprint** in model millimetres, with one constant in `units.ts` for each tolerance | [PROPOSED] (D-S2) |
| S17 | **The orbit's layer is sphere-like** (genus 0): every hole through the assembly is closed at its mouth for the layout; depth below the contour is a **height field** over each facet, read by the cast | [PROPOSED] — it states what the code already does (§3 C3, C4) and makes it a rule (D-S3) |
| S18 | **A function of the place**: the gizmo, the face and the depth are functions of the orbit's angles and of the held piece only — never of the path. The mouth's hold is the one exception today | [PROPOSED] — the principle is `TILTED_ORBIT_REBUILD_SCOPE.md` §15's (the face map, *"a function of the orbit's angles"*); the exception is W9 (D-S6) |
| S19 | **Rebuilt only at an event**: at a pick-up, a put-down and a seat — never while a finger orbits | [PROPOSED] (D-S4) |
| S20 | **Every concave edge is a crossing like a convex one**: a floor meeting a rising wall is an edge between two faces, with its own turn (0° for a rising wall) | [PROPOSED] — `TILTED_POLE_CLOSE_IN.md` O11 (D-S6) |

### 2.2 The tensions between the rules

| between | the tension | today's answer |
|---|---|---|
| S1 *close to the real* vs S6 / S7 / S8 *closed, bridged* | a bridged void is NOT the real surface | the owner's own order: real where the piece can use it, bridged where not |
| S5 *real depth* vs S13 *ghost at the mouth* | three answers for "a hole a part goes into": the real floor (S5, S7), the mouth plane (S13), the approach to contact (S5's second half) | none: ghosts are not read yet (§7 WS6). D-S5 |
| S7 / S8 vs landing (rule 1) | a bridged void puts the gizmo where the piece **cannot** land (in the air over the hole) | accepted: the gizmo marks the plane, the approach stops on contact |
| S8 vs the layout | the depth depends on the held piece; the layout (contour, charts) does not | the layout ignores voids entirely (`ORBIT_CHARTS.md` §4.4) |
| S10 vs S18 | the mouth's hold depends on how the gizmo got there | `TILTED_POLE_CLOSE_IN.md` W9 — open |
| continuity (rule 2) vs S5 *real depth* | a height field jumps at every wall: the gizmo either jumps or glides | the glide (`gizmoGlide`, 5 mm): a time patch over a space jump |
| S11 *small faces polar* vs D5 *small faces merged* | two answers for a small face, with two different rulers | S11 for fans round an apex; D5 (¼ of its polygon) elsewhere — not reconciled |
| S12 *changes in play* vs determinism | the surface at a seat must be the same whatever order the player took | the face map is a function of the placed set (`placedKey`) — deterministic per set, not checked across orders |

---

## 3. THE GEOMETRIES, TOPOLOGIES AND SINGULARITIES TO CONSIDER

**Words.** *Geometry* = a size or an angle: a threshold can decide it. *Topology* = how the surface is connected (a hole through, an island,
a face that wraps round): no threshold makes it go away; it can only be closed, cut or given a fallback. *Facet* = one flat face of the convex
contour. *Stack* = the depths found under a facet (its own plane, parts in front of it, floors behind it). *Travel* = the line the gizmo follows
for dx (the green) or for dy (the red).

Sizes (from `scene_*.ts`, `SCENE_2_ASSEMBLY.md`): every scene is held near the cube's 490 × 483 × 483 mm; the held pieces' footprints are
41.3 × 45 mm (green frustum) and 44.8 × 51.8 mm (turquoise prism); `Scene_2`'s parts go down to 2.8 mm flanges and 0.6 mm chamfers.

### 3.1 The catalogue

| # | class | plain definition | G / T | where | today's code | "small" against |
|---|---|---|---|---|---|---|
| **C1** | convex faces, edges, corners | flat faces meeting outward | G (angles); T for the sum at corners | everywhere | facets within 20° (`MAP_AXIS_DEG`, `face_map.ts:30`), D5 ¼ share, charts | the polygon (D5) |
| **C2** | non-rectangular faces | triangles, pentagons, a heptagon's ends, a fan's triangles | G | `Scene_0`, `Scene_0bis`, the 35 test shapes | F1: placed on the polygon (`ORBIT_ANY_SHAPE.md` §2) | — |
| **C3** | **concave edges and corners** — a step, an L, a wall rising from a floor | the surface folds inward | G for the angle; T for "the contour is no longer convex" | Scene_1's notches, the channel walls, the anchor and frusta meeting their hosts | folded INTO the stack: a depth step, not an edge; no turn, no event (`free_face.ts:240`: *"a concave edge … is the study before step B's"*) | — |
| **C4** | **through holes, tunnels** (genus > 0) | a hole you could pass a string through | **T** | none placed today; `Scene_2`'s bores into the hollow case | closed on the facet's plane (`stackDepthAt`, `face_map.ts:991`) | none: closed whatever its size |
| **C5** | **channels** — a groove open at one or both ends | a long void, a floor, two walls | G (width) + T (open ends) | `Scene_1`'s five boot slots (480 mm long), the top's black channel (130 × 32 mm) | the floor followed if the piece fits (S7, S8); the ends seen from the front are mouths (C7) | the piece's footprint |
| **C6** | **blind holes, pockets, slots**, a goal slot waiting | a void with a floor, closed on all sides | G (enterable) + T (a boundary) | `Scene_1` before placing; `Scene_2`'s bores before the plunge; `void_sim` | real depth if the piece fits, else bridged (`face_map.ts:999`) | the piece's footprint (`heldFoot`, 0.5 mm) |
| **C7** | **mouths** — ⚠ two meanings in the record | (a) **code**: a void closed across but open up the facet toward its edge — the top channel seen from the front; (b) **cavity**: an opening narrower than the room behind it — a bore into a hollow case | (a) T (path); (b) G/T | (a) Scene_1's channel ends; (b) `Scene_2` only, `void_sim`'s undercut | (a) bridged + `mouthHold` + the automatic tilt (`orbit_tilt.ts:290`); (b) measured by its opening at the plane (`voidOpening`, `face_map.ts:1021`) | (b) the piece, at the mouth |
| **C8** | **grooves, narrow gaps between parts** | a crack between two parts | G | the 3 mm core joints, the 13 mm bottom groove, the 47 – 50 mm notch, the 90 mm rebate | joints < 3.2 mm closed by growth (`MAP_GROW_M` 1.6 mm, `face_map.ts:34`); wider: the void rules | **two rulers**: `MAP_GROW_M` (a Scene_1 constant) and the piece |
| **C9** | **islands** — placed parts not touching | the surface in several pieces | **T** | none placed today | one contour over all; a closed gap with no floor bridged whatever its width; non-coplanar → the nearest group's plane, `inside: false`, no cast (`face_map.ts:1003-1010`) — the gizmo hangs in air | none |
| **C10** | **overhangs, undercuts** | a part sticking out above another, its underside facing down | G (depth, angle); T-like for a height field (two surfaces on one ray) | Piece44 (upside down on the top), Piece45 (front), `Scene_2`'s cases | nothing specific: the cast hits the overhang first; its underside only from the bottom cap; the support's convex hull fills the space under it (`footprint.ts:25`) | — |
| **C11** | **protrusions** — a boss, a pin, a part standing proud | a part in front of the facet's plane | G | Piece42, Piece43, `Scene_0`'s anchor, the tips of `Scene_0bis`; **each piece once placed** | the gizmo on the frontmost group (`face_map.ts:1003`); a jump of 41 – 49 mm onto and off it, glided | nothing: any height climbed |
| **C12** | **faces parallel to the cast** — a tread between two risers, the side of a proud part | zero width seen along the facet's normal | **T for a height field** | Scene_1's step treads (I10), every protrusion's sides | never a place (I10 open; F8 *"walk the step"* not ported) | — |
| **C13** | **thin plates, fins, blades** | thinner than the piece or the shell | G | Scene_1's 10 mm slabs (edges only), `Scene_2`'s 2.8 mm flanges | nothing: a fin vanishes in the shell's box; step B worse on a blade (`ORBIT_CHARTS.md` §5.3) | not stated |
| **C14** | **small faces, chamfers, slivers** | a face too small to work on | G | frusta's sides, `Scene_2`'s 1.4 mm bevels | D5 ¼ share; a chamfer beyond 20° kept as its own thin facet; authoring flags ≈ 7 mm | **four rulers** (§3.3) |
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

Four rulers stand in the record, none named as THE one (rule 3: *one constant in one place* is broken):

| ruler | where | its space |
|---|---|---|
| the held piece's two smallest sizes (+ 0.5 mm) | voids (S8) | model mm |
| ¼ of its own polygon (D5, `facetMinShare`) | facets | an area ratio |
| ≈ 7 mm "too narrow to stand on" | authoring check ⑤ | model mm (authoring only) |
| 0.22 × the placed box's smallest side (T3) | polar zones, `chartLayout 0` only | model mm, relative |
| the finger: a 37 mm face is 0.34 mm of finger far out (I17) | the reach on the glass | finger mm, depends on distance |
| `MAP_GROW_M` 1.6 mm | joints | model mm — a Scene_1 construction gap |

[PROPOSED] Three of them answer three different questions and can stay apart **if named**: (1) *can the piece use it?* — the piece; (2) *is it
a face of the layout?* — a share of the polygon, or the piece; (3) *can the finger reach it?* — a camera matter (close in reaches anything),
not a property of the surface. The joint growth is a tolerance of the scene's construction and belongs with the coplanar tolerance, not with
"small".

---

## 4. THE OBSTACLES

Each: why it is fundamental (plain words first, then the mathematics), where it can be overcome, where it cannot and the fallback.

| # | obstacle | why fundamental | can be overcome where / how | cannot where → fallback |
|---|---|---|---|---|
| **OS1** | **The turn budget** — the orbit's cross (green, red) cannot be carried round a closed shape without turning | carry a small cross round a corner without turning it and it comes back turned by the corner's *angle defect* (2π minus its face angles); over a closed ball-like surface they sum to 720° (Gauss–Bonnet), and any direction field has singular points whose indices sum to 2 (Poincaré–Hopf, the hairy-ball theorem) | on flat faces (none of it lives there): the turn is paid on edges and at chosen points — the charts do this (`ORBIT_CHARTS.md` §1) | at the poles and fans → **the polar zone**. ⭐ The surface's singularities ADD to it: a notch's inner corner (+90°), a saddle where a re-entrant edge meets a top (−90°) — each a place the charts must pay for, unseen today because the contour is convex |
| **OS2** | **Holes through** (genus) | a hole through changes the count: 720° becomes 720° × (1 − g), and each handle forces saddle-type singularities a columns chart cannot hold. A smooth orbit over a ball cannot map one-to-one onto a ring-shaped surface | close it: at the mouth plane the hole is filled (S6, S7) — the orbit's layer stays ball-like (S17) | a hole the piece must go through or into → **not orbited, approached**: the approach (A + dy) or the plunge (S5, S13). The layer never contains it |
| **OS3** | **A height field cannot see everything** | a depth read along one direction is one number per place: it cannot hold the underside of an overhang (two surfaces on one ray), gives zero width to a face parallel to the ray (the tread), and steps at every wall (`TILTED_ORBIT_REBUILD_SCOPE.md` §31.4: occlusion, topology, sharp edges — *"no bijection possible"*) | where the faces are front-facing along their facet's normal: everything on the boxes' outer faces | an overhang's underside → reached from the facet that faces it (the bottom cap) or not at all; a tread → **a stated choice** (D-S7): unreachable, or its own facet; a wall's step → the **glide**, named as the one depth event |
| **OS4** | **Jumps at depth steps** | the height field is discontinuous at every wall and protrusion: landing (the real depth) and continuity cannot both hold there | the glide smooths the gizmo in time (5 mm) | ⛔ a time smoothing is a patch over a space jump; S14's exclusion (the singularity reached by going out and back) is the systematic fallback for close in — D-S10 |
| **OS5** | **"Small" has no single size** | the piece, the polygon, the finger and the scene's joints measure different things; the finger's ruler changes with distance, so no model-mm threshold makes a face reachable at every distance | §3.3's three questions, each with its ruler, each one constant | the finger's reach far out → **close in** (the camera), never the surface |
| **OS6** | **The surface depends on the held piece and on time** | S8 makes the depth a function of the piece; S12 makes the faces a function of the placed set; continuity across a pick-up or a seat cannot be promised | rebuild only at those events (S19), where the gizmo is relocated anyway | a seat that changes the face under the gizmo → **a relocation event**, stated once (the gizmo to the nearest place on the new surface), never a jump mid-gesture |
| **OS7** | **Sharp edges have no normal** (step B) | a polyhedron's normal jumps at every edge; "the shape with its edges rounded" needs a radius, and a face smaller than the radius disappears into its edges | a rounding radius tied to the ruler (S16) | fins and blades thinner than the radius (C13): the normal flips side → step B's own fallback (`ORBIT_CHARTS.md` §5.3: worse on a blade) |
| **OS8** | **Numbers that are almost equal** | coplanar within 0.5 mm, joints of 3 mm, a clip at 1e-9 that dropped a whole facet (R2): floating-point and modelling tolerance decide topology | one family of tolerances, each a named constant with its unit; tests on shapes AT the tolerance | none if every tolerance is explicit; the record's six coplanar angles (§7 WS8) are the risk |
| **OS9** | **Path dependence at a mouth** | at a void open toward an edge the same angles can mean the floor or the next facet: two sheets over one place | treat the concave edge as an ordinary crossing (S20, O11): the floor's far edge against a rising wall turns 0° | if a mouth is also a pole's edge, the tilt and the crossing must be one event (step 2.4's one transition) — not verified on any scene |
| **OS10** | **Curved parts** | a curve made of many small flat faces either merges into slivers or splits into many tiny facets | authored flat proxies (`PART_AUTHORING.md` §1, §3); or a planar segmentation (VSA, §6) | a fan round an apex → **polar** (S11) |
| **OS11** | **Islands** | a convex contour spans the gap between two islands; the depth under it is empty | bridge a gap the piece cannot pass (S8 extended to "no floor") | a gap the piece can pass, with nothing under it → **the gizmo stays on the contour plane** (bridged) — today it hangs at the nearest plane instead (WS4) |
| **OS12** | **Several geometries for one part** | the proxy, the collision pieces, the convex support and the render faces are authored or computed apart | a build-time check that they agree within a tolerance | none if the check exists; today it does not (WS2) |

---

## 5. WHAT TO SPECIFY FOR THE REBUILD

### 5.1 The layers

[PROPOSED] Six layers, each a pure function in `src/core` or `src/input`, in model coordinates, deterministic (same input → same output,
ties broken by a stated key, never by array order).

| layer | input | output | invariants | thresholds (unit, home) | rebuilt when | cost |
|---|---|---|---|---|---|---|
| **L0 — the parts as authored** | render mesh, `UFM_` face proxy, `UCX_` collision pieces, ghost faces (`for_part`) | per part: its route faces (proxy, else render faces), its collision pieces, its ghosts | proxy sanity ①–⑩ (`PART_AUTHORING.md` §3); **new**: proxy and collision agree within a tolerance (OS12); every face outward | fidelity 0.7 mm (authoring) | at import | once |
| **L1 — the exposed faces** | the placed set (goal-locked, not frozen, not orbited); L0's route faces on their model poses | the exposed faces: each a polygon, its normal, its part; glued portions removed | a glued face never present; regions from the **triangles**, not the bounding rectangle (C19); every point of a face in exactly one face | coplanar distance and angle (ONE pair, `units.ts`) | at a seat, a put-down | O(faces²) per plane |
| **L2 — the features, classified against the piece** | L1 + the held piece's footprint | per facet: its features — void (closed / open / mouth), floor or none, enterable or not; protrusion; step; tread; island gap | each feature has ONE class and ONE rule (§5.2); the class is stable under a change below the tolerance; a void's opening measured in the facet's plane against the footprint's resting face | the ruler (S16): the piece's footprint + one tolerance | at a pick-up and a seat | per facet, cell grid |
| **L3 — the contour** | L1 (and L2's closures) | the convex facets: polygons, normals, edges, corners; caps | closed; convex; no self-crossing; every exposed face assigned to one facet; D5's keep rule stated with its ruler | merge angle (20°), keep share (¼) | at a seat | the heaviest build today |
| **L4 — the atlas** | L3 | charts, poles, frames (`ORBIT_CHARTS.md`) | as `ORBIT_CHARTS.md` §1 — **plus**: the concave edges of L2 counted in the turn budget (OS1) | as there | at a seat | ≈ 10 ms (Scene_0bis) |
| **L5 — per frame** | the orbit's angles, L3 – L4, L2 for the place | the gizmo's point, its face, its normal, the depth, the events (crossing, glide, relocation) | a function of the angles and the piece (S18); no path state except the gesture's own hold; within the 24-query budget | — | every frame | the cast; memo ≤ 512 |

### 5.2 The table SINGULARITY → RULE → EVENT

[PROPOSED] — the classes of §3 with the rule each gets and what happens when the gizmo crosses its border. "Bridged" = the gizmo on the facet's
plane over it. "Entered" = the real depth. "Approached" = reached only by A + dy or a plunge. "Fallback" = a zone of its own.

| class | rule | event at its border |
|---|---|---|
| C4 through hole | bridged at the mouth plane, always | none (the plane continues) |
| C5 channel, piece fits | entered (its floor) | a **glide** at each wall; at an open end, a **crossing** (C7) |
| C5 / C6 / C8 void, piece does not fit | bridged | none |
| C6 blind hole, piece fits | entered; or the ghost at the mouth if the part is authored to plunge (D-S5) | a glide |
| C7(a) mouth | a concave edge: an ordinary crossing (S20) — replaces the hold (D-S6) | the crossing's camera turn (0° for a rising wall) |
| C7(b) cavity behind a narrow opening | measured at the opening; behind it: approached only | — |
| C9 island gap | bridged on the contour plane | none |
| C10 overhang underside | not a place from above; from the facet facing it | — |
| C11 protrusion | entered (its top) | a glide (or excluded close in, S14 — D-S10) |
| C12 tread | D-S7: unreachable (stated), or a facet of its own | — |
| C13 fin thinner than the ruler | part of the facet behind it | — |
| C14 small face | below the keep rule: part of its neighbours (O9) | none |
| C15 curve | authored proxies, or planar segmentation | crossings between its facets |
| C16 fan | polar (S11) | the polar zone's entry |
| C20 face on the floor | not a place | — |
| C23 a seat | L1 – L4 rebuilt | a **relocation** (OS6), once |

### 5.3 The vectors and the test shapes that would prove it

* **Synthetic shapes, each NON-convex** (the chart helpers are all convex today, `tests/helpers/chart_shapes.ts:2`): a plate with `void_sim`'s
  nine families; an L-shaped top; a single step and a staircase (the tread, C12); a channel open at one end, at both ends; a T overhang; two
  islands at three gaps (narrower, equal to, wider than the piece); a round hole in one face of a non-box part (C19); a 12-sided cylinder; a fin
  10 mm thick; a glued joint at 3 mm and at 5 mm.
* **Per shape**: the L2 class of every feature for two pieces (41 × 45 and 80 × 80 mm); the L5 gizmo on a 1 mm sweep — no jump above the glide
  outside a named event; the same result after the shape is moved and turned (model coordinates); the same result for every order of placing
  its parts (S12 determinism).
* **The scenes**: `Scene_1`'s replay (grooves, channel, mouth), `Scene_0`, `Scene_0bis` unchanged where their features are unchanged.
* Each new vector shown **failing against today's code** before it is trusted (`CLAUDE.md` rule 2).

### 5.4 Deliberately left out

* `Scene_2`'s proxies and ghosts — the owner reviews them himself (2026-11-15).
* The plunge snap; step B itself; the collision's construction; the piece's footprint-swept support (`HOVER.md` §0 item 21, "Step 8").
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
| **WS7** | **Regions are bounding rectangles**: triangles and slanted outlines over-fill, so a hole in one face (C19) and a non-rectangular face's "real" area are wrong; the same limit in the contact readout | `face_map.ts:482-486`; `contact.ts:197` | blind spot (every part a box today) |
| **WS8** | **Duplicated tolerances** (rule 3): `COPLANAR_M` and `OUTLINE_GROW_M` copy `MAP_COPLANAR_M` and `MAP_GROW_M`; six "coplanar" angles (20°, 1°, ≈ 1.15°, 2°, 2.6°, 0.5°) | `contact_wiring.ts:68, 174`; `face_map.ts:32, 34` | rule 3 |
| **WS9** | **`MAP_GROW_M` is Scene_1's construction gap** (3 mm joints) inside the general definition: a scene with 4 mm joints sees grooves | `face_map.ts:34` | scene constant in the rule |
| **WS10** | **The held footprint is the drawn mesh's own box** (two smallest sizes, any way round), not the resting face's footprint in the facet's axes: a piece turned on the surface is judged by its smallest sizes | `assembly_wiring.ts:926-933` | approximation |
| **WS11** | **The contact readout includes loose parts**: `coplanarFaces` skips orbited and frozen bodies but not unplaced ones, while the face map keeps only goal-locked parts. Display only | `contact_wiring.ts:69-72` vs `assembly_wiring.ts:909` | several notions (display) |
| **WS12** | **The mouth's hold is path-dependent** — the one place the gizmo is not a function of the place | `assembly_wiring.ts:1213-1215`; `orbit_tilt.ts:290` | patch beside S18 (W9) |
| **WS13** | **The concave edge is not an edge**: excluded from the crossing event, folded as a depth step | `free_face.ts:240` | rule gap (O11) |
| **WS14** | **The world map and a tilted frame's map may differ** (a looser box, other seeds, other D5 survivors); the atlas assumes the same contour in every frame | `orbit_tilt.ts:201`; `orbit_charts.ts:118-119` | several notions (PLAUSIBLE) |
| **WS15** | **Tie-breaks by order**: seeds by area first-wins, the main group's tie to the frontmost | `face_map.ts:536, 629-630` | determinism risk |
| **WS16** | **`placedBox` reads the drawn meshes** (the centre, the radius) — the one exception to S3, the owner's open decision (inventory F.10) | `ORBIT_CHARTS.md` §4.5 | S3 exception |
| **WS17** | **Dead paths**: the edge blend (`MAP_OPTS` 0 / 0), the ring chart (not wired), the zone detectors under `chartLayout 0` | `assembly_wiring.ts:855`; `ring_chart.ts:3` | dead code, to delete at step 2.5 |
| **WS18** | **No non-convex test shape**: every chart vector is a convex solid; `void_sim` covers a plate without solver, band or offset piece | `tests/helpers/chart_shapes.ts:2`; `scripts/probes/void_sim.ts` | coverage |

The patches beside a rule, as their own comments record them (each became a sentence of a rule later; the risk is the ones still standing alone):
R1 glued faces (`face_map.ts:512`), the rims' 1.6 mm (`:176`), R2's clip (`:584`), R3's grazing cast (`:1086`), the map's catch-up hold
(`:415`), the ridge tie and the cap rule (`:654-664`), D3 amended twice (`:956-1000`), the mouth's "build b" (`:989`), the support's
"a drop only where the piece fits" (`assembly_wiring.ts:769`).

---

## 8. THE DECISIONS FOR THE OWNER

| # | question | options | recommendation |
|---|---|---|---|
| **D-S1** | What is "step B"? | (a) the view read from the place (`ORBIT_CHARTS.md` §5.3, `RND5.md`); (b) the orbit's layout on any shape | (a), as the documents say — this study is its prerequisite either way |
| **D-S2** | One ruler for "small"? | (a) the held piece's footprint for every size test; (b) a ruler per question, each named (§3.3) | (b) with three named rulers: the piece (use), the polygon share (layout), the camera (reach) |
| **D-S3** | The orbit's layer always ball-like (S17)? | (a) yes: holes closed at the mouth, depth as a height field, holes entered by the approach only; (b) holes orbited through | (a) |
| **D-S4** | When is the surface rebuilt? | (a) at pick-up, put-down and seat only (S19); (b) whenever it changes | (a) |
| **D-S5** | A hole a part goes into | (a) the ghost at the mouth + plunge where authored, the real floor elsewhere; (b) always the real floor; (c) always the mouth plane | (a) |
| **D-S6** | The mouth | (a) a concave edge, an ordinary crossing (S20, O11) — the hold deleted; (b) keep the hold | (a), measured first on `Scene_1`'s channel |
| **D-S7** | A tread between risers (I10) | (a) unreachable, stated; (b) a facet of its own | (a) until a scene needs it |
| **D-S8** | A gap open both ways with no floor (WS4, islands) | (a) bridged on the contour plane; (b) as today | (a) |
| **D-S9** | Where the definition comes from | (a) computed from render faces for box scenes, proxies where authored (§6 A + B); (b) proxies for every scene | (a) |
| **D-S10** | Does S14 stand (exclude a singularity close in, reach it by going out and back)? | (a) yes, as the fallback for a protrusion's or a wall's jump close in; (b) no, the glide stays | the owner's: it was his rule on a superseded design |
| **D-S11** | The first build's reach | (a) `Scene_0`, `0bis`, `1` and synthetic shapes; (b) with `Scene_2` | (a), `Scene_2` when the owner has reviewed its proxies |

---

## 9. SOURCES

In this tree (`1190db2`):
* [ORBIT_CHARTS.md](ORBIT_CHARTS.md) §1, §4.4, §4.5, §5.3 — the rules, the specificities, the sway, step B.
* [TILTED_POLE_CLOSE_IN.md](TILTED_POLE_CLOSE_IN.md) §2.2 (O7, O9, O11), §4.2 (W8, W9), §6 — the obstacles' method, the mouth.
* [POLAR_ORBIT_CLEANUP.md](POLAR_ORBIT_CLEANUP.md) §6, §7, §8.3, §9.10 — R1, the void study, the void rule, the mouth.
* [TILTED_ORBIT_REBUILD_SCOPE.md](TILTED_ORBIT_REBUILD_SCOPE.md) §10, §15, §16.1, §17, §18 — the shell, the face map, D2 / D3, D5.
* [ORBIT_ANY_SHAPE.md](ORBIT_ANY_SHAPE.md) §2, §3 — F1, F2b.
* [POLAR_ZONES.md](POLAR_ZONES.md) header — the owner's polar rules (⚠ its header still says "NOTHING BUILT"; `polar_zone.ts` is built — not reconciled here).
* [PART_AUTHORING.md](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) §1, §3 — proxies, ghosts, sanity checks.
* [SCENE_2_ASSEMBLY.md](../../30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md) — the bores, the plunge.
* [RND5.md](../../00_CORE/queue_notes/RND5.md) — the rebuild's dossier, the to-do before step B.
* Code: `src/input/face_map.ts`, `src/input/orbit_charts.ts`, `src/input/free_face.ts`, `src/input/footprint.ts`, `src/input/orbit_tilt.ts`,
  `src/input/orbit_shell.ts`, `src/render/assembly_wiring.ts`, `src/render/contact_wiring.ts`, `src/render/model_bodies_wiring.ts`,
  `src/core/collision.ts`, `tests/helpers/chart_shapes.ts`, `scripts/probes/void_sim.ts`.

Outside this tree: `TILTED_ORBIT_REBUILD_SCOPE.md` §31.4 – §32 on branch `1.0.107-Close-in-atlas` (the bijection, the limited surface).

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
