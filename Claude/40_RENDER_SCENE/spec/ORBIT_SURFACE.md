# THE ORBIT'S SURFACE — what it aims at, its rules and principles, its singularities, its obstacles, what the rebuild must specify (2026-11-16, third step)

> ⛔⛔ **PROPOSED, FOR THE OWNER'S REVIEW. NOTHING BUILT, NO CODE CHANGED.** Written 2026-11-16 on branch `1.0.146s-Orbit-surface-spec` (from
> `1.0.146-Orbit-charts`, `1190db2`). Every rule marked **[OWNER]** quotes the owner, with its file, section and date; every rule or principle
> marked **[PROPOSED]** is a reading of this study and is NOT his decision until he says so.
>
> **The owner's request (2026-11-16, verbatim):** *"In the meantime, write the specifications for my review regarding the surface definition. What
> does the surface aim at. What are the rules. What geometries, topologies, singularities shall be considered. What obstacles to overcome. What to
> specify for the rebuild?"* — and earlier the same day (`RND5.md`, `TILTED_POLE_CLOSE_IN.md` §6): *"Also, before step B, we will need to work on the
> surface definition and the singularities (voids, channels, mouths, protrusions, small faces): just capture that in your to do list for the
> moment."*
>
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
> far foot bumps along ONE assembly when the orbit's direction is oblique (F17, measured): P1 keeps his words, with a mechanism proposed (§2.2, Q1);
> the "L19 lid on the tray's floor" evidence withdrawn (a fault of the study's goal check, fixed and rerun: today lands it on its seat too).

---

## 0. ONE PAGE

**What the surface is for.** The finger moves the gizmo over the assembly; the gizmo is where the piece will land; the piece stands off it on a
smooth shell and the camera stands behind the piece. So "the surface" answers one question many times a frame: *for this place of the orbit,
where is the gizmo?* The lines, the charts, the calm, the tilt, the approach and the contact all read that answer.

**What it is today.** Four things grown patch by patch: a **convex contour** of big facets (the layout); under each facet a **stack of depths**
where holes, voids, mouths and protrusions get one rule each; a **ray cast**; separate **convex hulls** for the collision and the support. The
gizmo's void test and the piece's footprint support answer nearly the same question twice, and disagree near every wall (§2.2 P2).

**What is proposed (not decided).** Six principles instead of one rule per shape; P1, P2, P4 and P5 (in a contact model) tested on 63 shapes and
1596 cells, P3 and P6 not *(study)*:
* **P1 — two regimes.** Far and medium (the piece more than the shell's 60 mm from the surface), no singularity under the gizmo moves the piece
  or the camera — his words kept. ⚠ *(study, F17)* Today's code keeps it only along the face's normal: the shell is read from the REAL-depth gizmo
  along the orbit's direction, which the calm leaves oblique toward a face's edges, so a depth step h bumps the far piece by h × tan(angle) (a 40 mm
  slot: 15 mm at 20°, 40 mm at 45°). Proposed: far and medium the shell reads the gizmo's point on its CONTOUR facet. A part that grows the box
  moves the far path at its seat (F7, S19), never along a travel. Close in, the real surface and the collision govern. ⚠ "Close in" = 60 mm HERE;
  0.6 – 0.65 m for the tilt and the gain; at `Scene_1`'s mouth the hold starts the tilt at the REAL lip from up to 0.6 m (§2.4, Q1).
* **P2 — the landing is a first contact.** The gizmo's depth is where the HELD PIECE, moved along the face's normal, first touches the placed
  parts: one operation, the piece as the only ruler, "nothing to land on" the one case with no answer. Far and medium the drop starts outside the
  parts; close in WHERE THE PIECE IS, so a proud part stays a wall (his Q1 (b), kept). *(study)* Today's point marks a place where the piece
  cannot rest (set there, it would enter a part) on 41 of 62 shapes — the marker only: far out the piece rides the shell, close in the collision
  refuses it; P2 never, by construction. Close in P2 IS today's footprint support in 1398 of 1596 cells.
* **P3 — each real face in the frame that faces it** (the mouth's hand-over as a rule): its condition is reopened *(study, F5)* — to be measured.
* **P4 — a function of the place**; **P5 — close in, blocked, not jumped**; **P6 — the layout's own singular points** (polar zones).
* **Rules added *(study)*:** S26 no unnamed depth step; S27 tolerances join, never erase; S28 a goal's entry stated, only a set-down is a
  landing; S29 an empty placed set out of reach (§2.7).

**And the Blender side (§7bis).** What these rules need of a scene's parts is checked when they are built, painted for the owner's look and
re-checked at import: closed collision solids with the proxy on them (S25), what is exposed per stage, the landing map per held piece, every
goal reachable by withdrawal along its entry (S21), the faces that are no place (S24); and a design-for-playability checklist.

**What cannot be avoided (§4).** A direction field round a closed shape has singular points (the poles; a hole through adds saddles); a depth
read along one direction cannot see under an overhang, gives zero width to a face parallel to it, and steps at every wall. Each has a fallback.

**What the owner is asked (§8).** Nine questions, each answerable in a line: P1 (his words kept by a new foot rule; the mouth's tilt distance); P2 with the piece as held (it reverses
his *"gizmo is a point, not the piece's footprint"* of 2026-11-07); the mouth's hold restricted and P3 measured; the ghost computed and every entry
stated; one ruler and the noise rules; the Blender checks; S25 / S22; the open points; and S5 close in (Q10).

---

## 0bis. THE OWNER'S FEEDBACK OF 2026-11-16 AND WHAT WAS DONE WITH EACH POINT

| his point (verbatim) | the answer | where |
|---|---|---|
| *"S6 - Holes are closed at the contour: "close the holes for the moment".-> i am not sure if this decision is correct. It was a temporary fix at the time i took the decision. Amend if geometry or topology requires a better decision."* | Amended. S6 becomes a CONSEQUENCE of P2: a hole narrower than the held piece is closed because the piece rests on its rims; a blind hole the piece fits gives its floor; a hole right through and wider than the piece gives no contact — "nothing to land on", stated, the gizmo on the facet's plane and marked. On the glass, through holes look as today; the change is that it is no longer a blanket rule | §2.2 P2, §2.3 |
| *"S7, S8 , S9, S10, S11, S14, S23: these decisions was taken ad hoc to simplify. If they conflict with other decisions or if geometry or topology requires a better decisions, propose it. Check literature for better patent-free proposals."* | S7, S8, S9, S23 → P2 (the drop cutter / configuration-space first contact: textbook, patent-free); S10 → P3, to be measured first; S11 → P6 (cone singularities; the charts' fans already do it by topology); S14 → P5 (the haptic proxy and backing off). Literature in §2.2 and the audit file | §2.2, §2.3 |
| *"S13, S16: there may be better alternatives: review literature for patent-free proposals and advise."* | S13: keep his ghost at the mouth, but COMPUTE it from the goal and its entry direction (assembly by disassembly) and check the drawn ghost against it; the plunge a guarded move started inside a capture region. S16: the piece as the one ruler for use, one share for the layout, tolerances for noise only | §2.5, §2.6 |
| *"S17: the spirit is that at far or medium distance, a singularity at the surface does not impact the orbit of the piece - camera. Refine the rule if needed. At close in, this rule is overruled by collision rule, etc."* | Restated in his words as P1. "Far or medium" = the piece more than the shell's offset (60 mm) from the surface; "close in" = inside it. The 0.3 m and 0.6 m rules read the contour — except at a mouth: there the hold starts the automatic tilt at the real lip from up to 0.6 m, a surface singularity moving the camera at medium distance. Named as the one place P1 does not hold today; his choice in Q1 | §2.2 P1, §2.4 |
| *"S18: I don’t recall where the mouth hold comes from but it may be revisited if other rules apply"* | Its history: his *"build b"* of 2026-11-10 for the shake at the channel's mouth. P3 would replace it by a general rule; until measured on `Scene_1`, it stays the one labelled exception to P4 | §2.4 |
| *"S20: do not propose ad hoc rule for each geometry, therefore check if this case is already covered by other rules and if you can remove this rule. Otherwise, keep it."* | Removed. Its premise was wrong: on `Scene_1` the edge at the bottom of the mouth is CONVEX (the side face's lip at the floor's level), not concave. The case is already covered by S10 and the mouth's hold as built (`face_map.ts:989-994`, `orbit_tilt.ts:290`); P3 is only their possible replacement, to be measured (Q4) | §2.4 |
| *"S21: the slide is removed; an orbit at close in can seat a piece as well; “it is checked when the level is built, not discovered by the player”: I think we need to modify the workflow of the blender object building to check that when we build in blender (the proxy surface, the collision surface, the ghost surface). Propose something. Also, we shall amend the blender object building workflow to make sure that any surface built in blender is built with consideration of the playability of the game, therefore in consideration with the rules we are specifying here."* | Reworded (no slide: seated by the orbit close in, the approach or the plunge). The checks B1 – B6 run in Blender, painted on the meshes, re-verified at import; a PLAYABILITY BRIEF per part from the plan; a design-for-playability checklist traced to this document's rules | §7bis |
| *"S24: this should be taken care at the blender building stage and included in the workflow, however i don’t know how. Propose something."* | B5, the coverage report: per stage, every exposed face that is no place, painted with its reason, for him to accept or change | §7bis B5 |
| *"S25: i don’t know where it comes from. If it conflicts with other rules, this needs to be amended. It should be taken care by the blender workflow, not the scene build, and reverified during scene build."* | It came from the first review: every rule here assumes inside and outside are defined. As worded it conflicts with `PART_AUTHORING.md` (proxies are open by design; the finish pass opens render meshes). Restated on the union of a part's `UCX_` pieces, the proxy lying on it; checked in Blender (B1), re-verified at import | §7bis B1 |

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
| **the approach** (A + dy) | the depth the piece may go down to: *"center of the orbit = gizmo"* — at `r.min` the distance is 0 (`assembly_orbit.ts:108-113`) | `placeOffset` |
| **the contact and the support** | where the piece rests, what it touches | `footprint.ts`, the gap (GJK) |
| **step B** (later) | the normal of the shape with its edges rounded, at the gizmo's place | `ORBIT_CHARTS.md` §5.3 |

### 1.2 What the player must feel

* The gizmo is **where the piece lands** — never in the air, never inside a part ([OWNER] the landing rule, `ORBIT_CHARTS.md` §1 rule 1).
* It **moves with the finger** and **never jumps** (rules 2, 4, 7 there).
* It **runs on the faces he can see and use**: a slot the piece fits is reachable; a crack, a groove too narrow, a sliver is not in the way.
* The camera **looks square** at the face he works on and **stays upright** (rules 3, 6; the calm).
* **Every piece can be brought to its goal** — seated by the orbit close in (the goal capture runs during the orbit, `LEVEL_END.md` §5quater), by
  the approach, or by the plunge (specified, not built) — at every stage of the level; no face is out of reach without the author knowing it
  (S21, S24).

### 1.3 What it is NOT

* **Not the drawn mesh.** The assembly sways on the glass; everything is read in the model's coordinates ([OWNER] 2026-11-15, `ORBIT_CHARTS.md`
  §4.5: *"in the past we made sure to use the model coordinates, not the swayed assembly coordinates"*).
* **Not the collision shape.** Collision reads `UCX_` convex pieces or the hull at spawn (`core/collision.ts:59`); the surface reads the face
  proxy (`UFM_`) or the render faces (`model_bodies_wiring.ts:111-129`). P2 would read the collision pieces for the CONTACT and the proxy for the
  FACES (§2.2).
* **Not the shell.** The shell lies at `max(d, 60 mm)` round the placed parts' bounding BOX and carries the piece's and the camera's FOOT; within
  the 60 mm offset the foot comes down onto the gizmo (`orbit_shell.ts:7-11, 84-88`); the gizmo is on the real surface
  (`TILTED_ORBIT_REBUILD_SCOPE.md` §10).
* **Not a closest-point surface.** Nothing follows the nearest point of the surface each frame (the HoverCam family, US 8,044,953 — excluded).

---

## 2. THE RULES AND THE PRINCIPLES

### 2.1 The owner's rules that stay as they are

| # | rule | source |
|---|---|---|
| **S1** | The surface is the parts' **real outer surface, simplified**: *"surfaces which support gizmo shall be as close to the real surfaces as possible while simplifying their geometries. Sanity check shall be done so there are no false gaps, discontinuities between faces, faces floating in the air, small unreachable faces"* | [OWNER] 2026-11-13, `PART_AUTHORING.md` §3 item 3 |
| **S2** | Only **placed** parts count, and only their **exposed** faces: a face pressed against another part's face is not a surface (R1) | built 2026-11-09 (R1, `POLAR_ORBIT_CLEANUP.md` §6); a rule of the code — generalised by S22 |
| **S3** | Everything is computed in the **model's coordinates** | [OWNER] 2026-11-15, `ORBIT_CHARTS.md` §4.5 |
| **S4** | The **bottom** is a face like the others: *"the bottom is a face to orbit as the others (remember that the floor can be crossed by the camera and is invisible from below)"* | [OWNER] 2026-11-04, `TILTED_ORBIT_REBUILD_SCOPE.md` §16.1 (D2) |
| **S5** | **The real depth**, and the piece does not dive by itself: *"Approach into an empty slot: the gizmo shall read the real depth under the gizmo, but the piece shall not go in (it shall continue its orbit). However, the A + dy shall be able to bring the piece inside the depth up to where it collides or where it meets the center of the orbit"* → *"center of the orbit = gizmo"* | [OWNER] 2026-11-04, §16.1 (D3). *(study, F8)* close in the contact drops the piece into every slot it fits: its order → §8 Q10 |
| **S12** | The surface **changes as the game goes on**: *"it cannot be at boot: the assembly will change as the game progress"* | [OWNER] 2026-11-13, `POLAR_ZONES.md` header |
| **S13** | A part going INTO a hole rests on a **ghost at the mouth**, then a **plunge**: *"the ghost face shall always be a face aligned with the assembly face where the hole exits"*; ghosts are *"connected to real surfaces"* — the advice he asked is §2.5 | [OWNER] 2026-11-13, `PART_AUTHORING.md` §3 item 3 (ghost read by the game: NOT built; plunge: NOT built) |
| **S15** | No **local patch**: *"analyze the deep root cause, don't patch with fix which may conflict with other rules"*; and 2026-11-16: *"do not propose ad hoc rule for each geometry"* | [OWNER] 2026-11-15, `RND5.md`; 2026-11-16 (§0bis) |

### 2.2 The principles [PROPOSED]

Each: in plain words; its established name and reference; what it guarantees; where it stops and the fallback there; its patent note. They
were tested against the code and the record by three readers (literature, code, Blender, 2026-11-16); where a reader showed a principle wrong
as first written, it is amended here and the amendment is said. References in full: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §3.

**P1 — TWO REGIMES.** *Far and medium, no singularity of the surface under the gizmo changes the path of the piece and the camera: their path is
a function of the orbit's angles, the placed parts' BOX (the shell) and the CONTOUR (the layout) only; a part that grows the box or changes the
contour changes it at the seat that places it (S19), never along a travel. Close in, the real surface and the collision govern and overrule.*
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
  the one place where today's code does not keep his S17 spirit at medium distance. Two readings, his choice (§8 Q1): **(i)** P1 strict —
  beyond 60 mm the tilt at the contour's edge (the map's angles reaching the top facet, as the hold already hands over far out), the real lip
  only within 60 mm; **(ii)** the mouth a labelled exception up to 0.6 m — his S10 came with *"when i cross at close in"* on 2026-11-10, the day
  `tiltAutoM` was set to 0.6 m, so his "close in" then was the tilt's distance. **P3 against P1**: far and medium a crossing is at the
  CONTOUR's edge (P1), close in at the REAL edge (P3); they agree only if the hand-over between the two is ONE event at the regime's boundary,
  never two crossing places on one travel. (ii) has no such switch; (i) needs it. Recommendation: (ii) until Q4's measurement.
* **Amended.** The first wording called the orbit's layer "the surface closed at the orbit's scale, today's convex contour being its end"
  (morphological closing; r-hulls, alpha shapes). The code reader showed this wrong twice: the shell is the offset of the parts' BOX, and the
  contour is a set of facets each at its main group's plane, with protrusions standing in front of it. So P1 names TWO layers, neither a
  closing: the **shell** carries the piece and the camera; the **contour** carries the layout. Closing at a scale r survives only as a
  MEASURE — each feature's scale is the r at which it closes (used offline, §2.6, §7bis). ⛔ An intermediate r AT RUNTIME (a rounded layer the
  piece rides) is the dropped shell + cast family (`TILTED_ORBIT_REBUILD_SCOPE.md` §22 – §29): not proposed.
* **It stops** where the piece is inside the offset: P2, P3, P5 then. **Patent**: not checked (a shell and a box are textbook).

**P2 — THE LANDING IS A FIRST CONTACT.** *The gizmo's depth is where the held piece, moved along the face's normal, first touches the placed
parts.*
* **Name.** The configuration-space obstacle of a translating piece (a Minkowski sum, Lozano-Pérez 1983); along one direction it is CAM's "drop
  cutter": drop the tool at a place until it touches; on a height field, a grey-scale dilation by the tool's own height function. Under it, a
  LAYERED depth per facet direction (dexels, layered depth images) holds overhangs and cavities. `footprint.ts` already cites the same idea for
  the support: the movement surface *"from the whole area of overlap, not a single contact point"* (Oh, Stuerzlinger, GI 2005).
* **What it replaces.** Today two implementations answer nearly this question and disagree: (a) the gizmo's `stackDepthAt` + `voidOpening` /
  `pieceEnters` — a POINT, the opening measured on the facet's plane only, the piece as its two smallest sizes either way round, at every
  distance, protrusions climbed whatever their width (`face_map.ts:980-1065`, `assembly_wiring.ts:922-933`); (b) the footprint support — the
  piece's real outline as held, each part a convex body, only within 60 mm, never a step up (a WALL) (`footprint.ts:25-65`). Close in they part
  the gizmo and the piece (`levelRaise`). P2 makes (a) = (b) and keeps (c), the GJK gap, as the arbiter of contact.
* **Guarantees.** Exact first contact for a rigid piece at a fixed orientation, any shape, from its `UCX_` pieces (the union of convex
  Minkowski sums is exact). One operation for voids and protrusions alike: a void narrower than the piece is closed (it rests on the rims); a
  wider one gives its floor, half a piece from each wall; a pin or a stud is touched first; a field of studs is surface at their tops.
* **Where it stops, the fallbacks.** ① *Nothing to land on* — a hole right through and wider than the piece: the gizmo on the facet's plane,
  MARKED; the approach stops there (it stops at the gizmo, distance 0): the piece cannot go through by A + dy — that is S13's plunge.
  ② *Orientation* — one map per orientation of the piece: rebuilt at a turn (§8 Q2, Q3 merged). ③ *First contact is not rest* — a piece dropped on one
  pin touches it and would tip: the gizmo still shows the touch (it is where A + dy stops); *(study, F9)* the same for every partial support — a
  footprint partly past an edge or beside a hole lands where it first touches (198 cells, e.g. a rebate narrower than the piece, open on the
  edge's side); a stability test (the centre of mass over the support) is NOT proposed now. ④ *Steps remain* — a flat piece over a wall still steps, moved outward by half its width: far out the step
  moves only the marker (P1); close in the collision decides (P5). ⑤ *A tall part beside the gizmo — WHERE THE DROP STARTS*: far and medium
  the piece is dropped from outside the parts (from the shell), so the marker climbs half a piece before a proud part. Close in the drop starts
  WHERE THE PIECE IS (a guarded move from its current pose, as the drop cutter descends from the tool's own height): a part whose top stands
  above the piece's bottom is not under the piece but BESIDE it — a WALL that stops the piece, the gizmo and the camera (the owner's Q1 (b),
  *"Proceed"*, `CLOSE_IN_CONTACT.md` §1, §5 – §6; `footprint.ts`: *"never a step up onto it"*) — P5. That is today's footprint support
  exactly (the highest part under the footprint whose top is not above the piece's bottom, `footprint.ts:25-30`): P2 started at the piece
  REPRODUCES it, it does not replace its step rule. ⛔ A drop started from outside at every distance would lift a piece in contact with
  `Piece44` (41 mm proud) onto its top half a piece before the edge — a step up he refused.
* **What it changes on the glass, against S5** (*"the gizmo shall read the real depth under the gizmo"*). Over wide voids (the floor) and
  narrow ones (the rims' plane, as S8 already does): the same. Within half a piece of every wall and rim the depth changes there, not at the
  wall: off `Piece44` (41 mm proud) the gizmo stays up ~20 mm past its edge — as the piece already does; the channel's floor is a landing only
  in its central band (130 − 41.3 ≈ 89 mm for the green piece); a notch's floor only where the piece fits beside the riser; the goal slot
  beside `Piece44` (6.75 mm gap) shows `Piece44`'s top unless the piece is turned to clear it — far and medium only: close in (⑤) nothing
  changes, the proud part stays a wall and the piece still comes down only once its footprint has cleared it. Cost: one height map per facet
  direction at a pick-up and a turn (≈ 10 – 20 directions; a sample step of 4 mm — ≈ 128² over the 0.5 m assembly —, one constant in
  `units.ts`; not measured); each frame a lookup; the 24-query budget untouched. ⚠ A turn happens MID-GESTURE: rebuilding 10 – 20 maps in one
  frame may hitch on an iPhone — build them for the piece's orientations at the pick-up, or spread the rebuild over frames (the old map kept
  meanwhile); to be measured before it drives anything.
* ⚠ **It reverses an owner's decision.** On branch `1.0.105-` (2026-11-07, `TILTED_ORBIT_REBUILD_SCOPE.md` §29 as kept on `1.0.107-Close-in-atlas`, decision 2):
  *"gizmo is a point, not the piece's footprint"*. Since then he took the piece as the ruler for voids (*"Build"*, *"Yes"*,
  `POLAR_ORBIT_CLEANUP.md` §7, §8.3) and for the support (*"Proceed"*, `CLOSE_IN_CONTACT.md` §5 – §6). P2 extends that to the gizmo's depth; it is
  his call (§8 Q2). It also resembles §18-C1 (2026-11-05, never built: the boxes inflated by the piece, sphere-traced) — the difference: no
  sphere tracing, no rounded layer, the exact piece, a lookup per frame.
* **Patent.** Drop cutter, Z-maps, Minkowski sums: textbook. ⚠ Patents claim dexel-based machining simulation and collision detection
  (US 9,117,300; US 10,140,395) — scopes NOT checked; keep the representation a plain per-direction depth list.
* **Confirmed by the study** (F1 – F4, F11, F15): never into a part nor unmarked over nothing, and invariant to order and to a turn — BY
  CONSTRUCTION (its level is the highest top under the footprint; it holds no state): the evidence is today's column — 1102 of 1596 cells mark
  a place where the piece cannot rest; each step moved half a piece out (median 21 mm), not removed; exact on slopes (L30: today 38.7 mm in; L31:
  bridged 54.9 mm above).

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

**P4 — A FUNCTION OF THE PLACE.** *The gizmo's target is a function of the orbit's angles and the held piece only, never of the path.*
* **Name.** A memoryless atlas map; its usual alternative, hysteresis, is path-dependent by design. The face map's principle since
  2026-11-04 — the gizmo a function of the orbit's angles (`TILTED_ORBIT_REBUILD_SCOPE.md` §15's title), derived, not carried (§16.2, A7) —
  written to answer the owner's request: *"propose another way to construct the gizmo so it truly reflects the dy and dx inputs"*
  (`DOUBLE_ORBIT_PROTOTYPE.md`, Step 4c-bis).
* **Guarantees** reversibility: the same angles give the same gizmo, so a back-and-forth is impossible by construction.
* **Amended.** The first version said the mouth's hold is the one exception. The code reader found more state: the gizmo read at the piece's
  SOLVED angles (`assembly_wiring.ts:1184` — the owner's Q1 (b): the gizmo stops with a blocked piece), the map's catch-up hold
  (`MAP_SYNC_HOLD_M`), the depth glide in time, the maps per tilt and per zone, the support level eased per face. P4 separates them: the
  TARGET (where the gizmo should be) is a function of the place; the SHOWN gizmo may lag in time (an ease, a glide) and the solved angles are
  the place close in (P5). The mouth's hold is the one rule that changes the TARGET by the path — labelled in §2.3. *(study, F15)* Under P2 no
  place depends on the way in (by construction: no state); today's code breaks P4 only by the hold (F5) and the plane's first-face level (F6, S27).
* **Patent.** Not checked (a memoryless map is textbook).

**P5 — CLOSE IN, BLOCKED, NOT JUMPED.** *A step the piece in contact cannot pass blocks the orbit by collision, and is passed by going out and back in.*
* **Name.** The god-object / proxy of haptic rendering (Zilles, Salisbury 1995; Ruspini et al. 1997): a proxy kept outside the surface, which
  slides and cannot pass a step it touches; backing off is a fine-motion strategy (Lozano-Pérez, Mason, Taylor 1984).
* **Already built.** The owner's Q1 (b) (the piece, the gizmo and the camera stop at a wall), R4 (a jump whose landing is refused is a WALL),
  the ring's hold, *"backing out frees it"* (`CLOSE_IN_CONTACT.md` §10.4); S9's second half and S14 are this one principle.
* **Confirmed *(study, F8)*, in a contact model (the piece at contact, no solver slide):** the travels stopped at a proud part (565 / 532 cells:
  40 mm 228, 6 mm 228, 1 mm 99 / 76, 0.3 mm 10 / 0) are his Q1 (b) — ruled on `Piece44`, 41 mm proud; a 1 mm seat a wall: asked (Q6, S26);
  those stopped after a drop into a slot → Q10.
* **What would change.** The depth glide also acts inside 60 mm today, where the solver decides anyway: close in it would stop gliding.
* **Where it stops.** A step that blocks the only way to a goal is a level-design fact: B4 (§7bis) finds it, not the player.
* **Patent.** The 1995 – 1997 papers are expired art; later refinements not checked.

**P6 — THE LAYOUT'S OWN SINGULAR POINTS.** *Where the contour's curvature is gathered on faces too small to work on, the layout treats the place
as one singular point — a polar zone.* A rule of the atlas, not of the surface.
* **Name.** Cone singularities in surface parametrization: the curvature (the angle defect) concentrated at a few points (Kharevych et al.
  2006; Ben-Chen et al. 2008; Myles, Zorin 2012; Soliman, Slepčev, Crane 2018 — the placement by sparsity, one weight).
* **Already built twice.** The charts' FANS — the faces round a corner pole with at least three faces taken as one frame, by topology, no size
  ruler (`orbit_charts.ts:396-447`); the legacy polar zones by a size share (`valenceMin` 5, `facetMinRatio` 0.22), under `chartLayout` 0 only.
* **Guarantees** the turn budget exactly (the cones' angles sum to Gauss – Bonnet's total). **Stops**: fewer cones mean more distortion — a
  trade-off with one weight, not a threshold-free choice. Nothing changes on `Scene_1` (no fan) nor on `Scene_0bis` (the fans already do it).
* **Patent.** Not checked; academic work.

### 2.3 The ad hoc rules → what replaces them → what changes on the glass

Each earlier rule keeps its number. Marks: **consequence** of a principle (named) · **kept** (what was looked for) · **replaced** by a better
proposal · **removed**. No rule that exists for one geometry stays without that label and its reason.

| # | the earlier rule | mark | what replaces it | what changes on the glass |
|---|---|---|---|---|
| **S6** | [OWNER] holes closed at the contour, *"for the moment"* | consequence — P2 | a hole narrower than the piece closed by its rims; one it fits: its floor; through and wider: "nothing to land on", the plane, marked | through holes: as today, now marked; a blind hole narrower than the piece: as today (S8) *(study: L01, L02, L04, Q01)* |
| **S7** | [OWNER] a closed void with no floor bridged, with a floor its real depth | consequence — P2 | the same outcomes from one operation; the asymmetry WS5 (the piece-fit test only with a floor) disappears | none on `Scene_1`'s known voids |
| **S8** | built: a void the piece cannot enter is surface | consequence — P2, improved | the piece's real `UCX_` outline as held, not its two smallest sizes; read at every level, not only at the plane (C31) | the steps move half a piece inward (§2.2 P2) — *(study, F3)* and the piece as held: B 80 × 80 no longer judged 40 × 80 |
| **S9** | [OWNER] a protrusion: the frontmost part under the point; a close-in block normal | consequence — first half P2 (frontmost under the FOOTPRINT), second half P5 | — | far and medium: the marker climbs half a piece before a proud part and comes down half a piece after it; close in: none (the drop starts at the piece: a wall, as today) |
| **S10** | [OWNER] the tilt at the edge at the bottom of the mouth | kept as his rule; its mechanism → P3 if the measurement agrees (§2.4); its distance (60 mm or 0.6 m) → Q1; *(study, F5)* the hold's domain → Q4 | the crossing at the real lip | none expected for the red; the green to measure; with Q1 (i), beyond 60 mm the tilt at the contour's edge |
| **S11** | [OWNER] small faces converging go polar | consequence — P6 | the charts' fans (topology); a sparse cone placement later, if a shape needs it | none (built) |
| **S14** | [OWNER] a jump's singularity excluded close in, reached by going out and back in | consequence — P5 | blocked by collision, not by a region bound (the close-in atlas he wrote it for was superseded) | none (built) |
| **S16** | [PROPOSED] a ruler per question | replaced — §2.6 | the piece for use (P2), one share for the layout, tolerances for noise | none by itself |
| **S17** | [PROPOSED] the layer ball-like, holes closed | replaced — P1 in his words (§2.4) | far / medium: no surface singularity moves piece or camera; close in: collision | none for the piece (built); the camera at the mouth: Q1 |
| **S18** | [PROPOSED] a function of the place, the hold the one exception | replaced — P4 as amended | target vs shown gizmo separated; the mouth's hold the one target exception, labelled until P3 is measured | none until the hold goes |
| **S20** | [PROPOSED] a mouth's concave edge a crossing | **removed** — wrong premise (the edge is convex); the case is covered today by S10 + the mouth's hold (`face_map.ts:989-994`, `orbit_tilt.ts:290`); P3 its possible replacement (Q4) | — | — |
| **S23** | [PROPOSED] the same ruler for what is missing and what stands out | consequence — P2 (by construction) | — | pins and ribs: the marker on their top where the piece touches them first |

### 2.4 S17, S18, S20 — the three the owner singled out

**S17 restated, in his words of 2026-11-16** — [PROPOSED] P1: *"at far or medium distance, a singularity at the surface does not impact the
orbit of the piece - camera … At close in, this rule is overruled by collision rule, etc."*
* **"Close in" in millimetres today.** Three distances stand in the code (none was named for the surface): **60 mm** — the shell's offset
  (`orbitShellOffsetMm`, `gestureConfig.ts:867`): only inside it does the gizmo's depth reach the piece (`orbit_shell.ts:84-99`), and the footprint
  support acts only there (`footprint.ts`, its window); **0.3 m** — the look moves onto the foot (`assemblyLockDistM`, `:866`); **0.6 m** — the
  automatic tilt and the full gain (`tiltAutoM`, `orbitGainFullM`, `:883, :887`; off beyond 0.65 m).
* **Proposed.** For the SURFACE, "close in" = the piece within the shell's offset (60 mm) of it; "far or medium" = beyond. The 0.3 m and 0.6 m
  rules are camera rules on the CONTOUR (the facet under the gizmo, its poles) — ⚠ except at a MOUTH, where the hold hands the real lip to the
  automatic tilt from up to 0.6 m (§2.2 P1, its second point): a surface singularity moving the camera's frame at medium distance today. His
  choice between (i) the tilt at the real lip only within 60 mm and (ii) the mouth a labelled exception to 0.6 m is §8 Q1.
  ⚠ Not verified: whether the camera's frame (`free_face.ts`) reads the contour's facet or the real face under the gizmo far out — if the real
  face, a protrusion's side could still turn the camera there; to check before P1 is called built.

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

**S20 — removed.** It said the mouth's edge is concave (from `TILTED_POLE_CLOSE_IN.md` O11: *"a level floor meeting a wall that rises from
it"*). On `Scene_1` the edge at the bottom of the mouth is the side face's lip against the channel's floor going back: CONVEX. An ordinary
convex crossing at a real edge. It is covered today by S10 and the hold as built (`face_map.ts:989-994`, `orbit_tilt.ts:290`); P3 is only
their possible replacement, after Q4's measurement. Nothing is left for S20. The other concave edges (the notches, the steps) stay as he ruled
(P2 + P5).

### 2.5 S13 — the ghost at the mouth, then the plunge: the alternatives (the advice asked)

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

### 2.6 S16 — the rulers: the alternatives (the advice asked)

Today six rulers stand for "small" (§3.3). The alternatives found:

| alternative | ruler | for | against |
|---|---|---|---|
| **(1) a ruler per question** (first review's S16) | the piece, a share, the camera, each named | each question honest | three constants that can disagree on one feature |
| **(2) the piece + one layout share + noise tolerances** | P2's first contact (no threshold: the piece's own geometry), D5's share for "is it a facet", one tolerance family (coplanar distance and angle, the joint growth, a depth for "flush") for modelling noise only | the fewest constants; "small for use" needs none | the share remains one number |
| **(3) persistence** — a feature's scale is the radius at which it closes (nested closings make it monotone) | one measure per feature, no threshold to classify | ruler-free; gives every feature its margin from any threshold | a global count of holes by scale is NOT monotone for general inputs: use it per feature; offline cost |
| **(4) CAD defeaturing** (one "defeature size", virtual topology) | one size | industry practice | one size is a threshold per geometry in disguise |

**Recommendation [PROPOSED]: (2), with (3) offline** in the Blender checks (B6: a feature whose closing radius is near the piece's size, or a
facet near the share, is painted as "at a threshold" for the owner). **D5's quarter share** stays the layout's one ruler, measured after a
closing that does NOT depend on the held piece: the placed parts closed at the level's SMALLEST piece's half-width (a level constant, read from
the catalogue), so a comb or a field of studs keeps its facet (the former D-S19) while the contour and the charts stay a function of the placed
set alone (S19: rebuilt at a seat, never at a pick-up or a turn). ⛔ Not after P2's own closing: that is per held piece and per turn, and would
make the layout move with the piece. The camera's reach is not a ruler of the surface (close in reaches
anything; I17 closed *"not applicable"*). `MAP_GROW_M` (1.6 mm, `Scene_1`'s 3 mm joints) joins the noise family with the coplanar 0.5 mm, in
`units.ts`. *(study, F6, F10)* The noise family decides NOISE only: S26 (one depth tolerance, no unnamed step) and S27 (tolerances join, never
erase) are its two rules (§2.7); the study found today's tolerance erasing a real cap (76 cells) and 1 mm steps jumping with no event (238).

### 2.7 The other proposed rules, kept

| # | rule | status |
|---|---|---|
| S19 | **Rebuilt at two kinds of event**: (i) the placed set changes — the exposed faces and their classes; (ii) the orbit's frame changes (an automatic tilt, a polar-zone switch) — only the layout, the classification the same in every frame | [PROPOSED] (former D-S4); today (ii) re-runs the whole `buildFaceMap` per tilt and per zone, unchecked (WS14). Under P2 add (iii): the held piece is picked or turned — its landing maps |
| S21 | **Every goal is reachable**: at every stage, each piece still to place is seated from a place of the surface — by the orbit close in (the goal capture), the approach or the plunge — checked when the level is BUILT (in Blender, B4), re-verified at import | [PROPOSED] — the purpose behind S1's *"no … small unreachable faces"*; reworded (the slide is removed) |
| S22 | **"Exposed" means reachable from outside**, on the parts taken together (their union): a face glued, buried in another part, or sealed in a cavity is not surface | [PROPOSED] — S2 generalised; computed in Blender (B2) |
| S24 | **Nothing unreachable silently**: per scene and stage, the exposed faces that are no place, each with its reason | [PROPOSED] — the Blender coverage report (B5) |
| S25 | **Each part's collision pieces are closed convex solids, and its proxy lies on their union, facing out** (restated, §7bis B1) | [PROPOSED] — from the first review; checked in Blender, re-verified at import |
| S26 | **No unnamed depth step**: one depth tolerance (the noise family's "flush", 0.5 mm today) splits every depth change — under it the same face, at or above it the named depth event (glided far and medium, P5 close in); the glide's own 5 mm goes | [PROPOSED] *(study, F10: 238 cells, up to 3 mm; L43)* — not built |
| S27 | **Tolerances join, never erase**: (a) the planes found independently of order — the faces' OWN levels clustered as connected components at the tolerance (single linkage; a greedy join against a running mean still depends on order), each plane at its component's area-weighted mean; (b) a face, or part of one, is removed only where another part's material covers it (S22), never by pairing with an opposite face on either side; (c) a part thinner than, or two parts overlapping by less than, the noise tolerance are refused at authoring (B1, C48) — out of the surface's reach otherwise | [PROPOSED] *(study, F6: 76 cells lose the top cap — the far foot up to 256.5 mm, the facet 90°; 32 a false mouth; F15: L42's order 0.3 mm)* — today's code breaks (a) and (b) |
| S28 | **A goal's entry is stated; only a set-down is a landing**: a goal entered along its host facet's normal is reached by P2 (B4: its first contact is its seat); any other entry — slid, plunged, hooked — is a guarded move along the entry direction from the pre-insertion pose B4 computes, ENDED by the goal capture (the goal margins, `LEVEL_END.md` §5quater) — alone it would end at first contact, past the seat (§2.5 (3) + (4) for every such entry) | [PROPOSED] *(study, F13: L05's block, slid in, lands at the back wall −100 against its seat at 120, today and under P2)* |
| S29 | **An empty placed set is out of the surface's reach**: every level boots with a placed part (W1 states it, B4 checks it); with none (only `lockPlacedPieces` 0, a debug setting) the gizmo holds, as today; one part smaller than the piece: P2 ① | [PROPOSED] *(study, F16: L51, L52)* — built in effect (every scene boots with one) |

### 2.8 The tensions that remain

| between | the tension | answer |
|---|---|---|
| S1 *real* vs P2 *closed by the piece* | a void the piece cannot use is not shown as a void | the owner's own order (S8): real where the piece can use it |
| S5 *the real depth under the gizmo* vs P2 | far and medium the depth changes half a piece from each wall, not at it | §8 Q2 — it reverses his decision 2 of 2026-11-07 |
| P1 vs the shell along a travel *(study, F17)* | an oblique direction lets a depth step bump the far piece and camera (h × tan θ) | §8 Q1 (a): the shell fed the contour point |
| P1 vs S10 at the mouth | the hold starts the tilt at the real lip from up to 0.6 m | §8 Q1 (i) or (ii) |
| P2 ① *nothing to land on* vs the landing rule | over a wide through hole the gizmo is in the air, marked | stated; the plunge (S13) is the way in |
| P3 vs the notches' rulings | P3 everywhere would make crossings at every concave step | P3 only where the facet's direction finds nothing (a mouth); the notches have a floor |
| S10 / the hold vs P4 | the target depends on the path at one place | labelled; §2.4's measurement decides |
| S12 / S19 (ii) vs one classification | the frame's maps may keep other facets (WS14) | a vector across frames, S19 (ii) |
| S12 vs determinism | the surface at a seat must not depend on the order of play | a function of the placed set (`placedKey`); a vector across orders |
| P2 ② vs a turn of the piece | an oblong piece fits a slot one way only: the map changes at a turn | §8 Q2 (Q3 merged) |
| S21 vs OS3 | a goal inside a cavity or under an overhang is no place of a height field | the approach, the plunge, a ghost (S13); B4 says which goals need one; S28 |
| S5 vs P2 ⑤ *(study, F8)* | close in the contact drops the piece into every slot it fits (367 / 432 cells), then a dx is trapped at the far wall | §8 Q10 — proposed: S5's "shall not go in" far and medium, P2 ⑤ + P5 close in |
| the hold vs its purpose *(study, F5)* | it fires on the cap, along island gaps, in a V (32 cells, up to 479 mm — in the study's emulation, a dy as a travel along the facet's b); not at a channel closed far behind (L07) | §8 Q4 — its domain restricted until P3 is measured |

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

C1 – C3 faces and edges; C4 – C9 voids; C10 – C14 what stands out or is thin or small; C15 – C16 curves and apexes; C17 – C19 how faces
combine; C20 – C24 the floor, ties, long shapes, change in play, the piece's size; C25 – C47 (§3.1b) the classes not met. The last column now
names the principle that answers each class (§5.2 in full); ⏳ = still open. "Today's code" is unchanged: it records what is built.

| # | class | plain definition | G / T | where | today's code | "small" against → answered by (§2.2, §5.2) |
|---|---|---|---|---|---|---|
| **C1** | convex faces, edges, corners | flat faces meeting outward | G (angles); T for the sum at corners | everywhere | facets within 20° (`MAP_AXIS_DEG`, `face_map.ts:30`), D5 ¼ share, charts | the polygon (D5) → **P1 (the contour)** |
| **C2** | non-rectangular faces | triangles, pentagons, a heptagon's ends, a fan's triangles | G | `Scene_0`, `Scene_0bis`, the 35 test shapes | F1: placed on the polygon (`ORBIT_ANY_SHAPE.md` §2) | — → **the charts (F1)** |
| **C3** | **concave edges and corners** — a step, an L, a wall rising from a floor | the surface folds inward | G for the angle; T for "the contour is no longer convex" | Scene_1's notches, the channel walls, the anchor and frusta meeting their hosts | folded INTO the stack: a depth step, not an edge; no turn, no event (`free_face.ts:240`: *"a concave edge … is the study before step B's"*); `Scene_1`'s notches kept so by the owner (*"Stays as it is"*, `POLAR_ORBIT_CLEANUP.md` §6 (a)) | — → **P2 + P5** |
| **C4** | **through holes, tunnels** (genus > 0) | a hole you could pass a string through | **T** | none placed today; `Scene_2`'s bores into the hollow case | closed on the facet's plane (`stackDepthAt`, `face_map.ts:991`) | none: closed whatever its size → **P2** |
| **C5** | **channels** — a groove open at one or both ends | a long void, a floor, two walls | G (width) + T (open ends) | `Scene_1`'s five boot slots (480 mm long), the top's black channel (130 × 32 mm) | the floor followed if the piece fits (S7, S8); the ends seen from the front are mouths (C7) | the piece's footprint → **P2 (+ P3 at an open end)** |
| **C6** | **blind holes, pockets, slots**, a goal slot waiting | a void with a floor, closed on all sides | G (enterable) + T (a boundary) | `Scene_1` before placing; `Scene_2`'s bores before the plunge; `void_sim` | real depth if the piece fits, else bridged (`face_map.ts:999`) | the piece's footprint (`heldFoot`, 0.5 mm) → **P2; S13 where authored** |
| **C7** | **mouths** — ⚠ two meanings in the record | (a) **code**: a void closed across but open up the facet toward its edge — the top channel seen from the front; (b) **cavity**: an opening narrower than the room behind it — a bore into a hollow case | (a) T (path); (b) G/T | (a) Scene_1's channel ends; (b) `Scene_2` only, `void_sim`'s undercut | (a) bridged + `mouthHold` + the automatic tilt (`orbit_tilt.ts:290`); (b) measured by its opening at the plane (`voidOpening`, `face_map.ts:1021`) | (b) the piece, at the mouth → **(a) S10, P3 measured; (b) P2 + S13** |
| **C8** | **grooves, narrow gaps between parts** | a crack between two parts | G | the 3 mm core joints, the bottom groove (x 103.5 – 116.5, i.e. 13 mm, in `POLAR_ORBIT_CLEANUP.md` §7; called "10 mm" in its §8.3 — not reconciled), the 47 – 50 mm notch, the 90 mm rebate | joints < 3.2 mm closed by growth (`MAP_GROW_M` 1.6 mm, `face_map.ts:34`); wider: the void rules | **two rulers**: `MAP_GROW_M` (a Scene_1 constant) and the piece → **P2; joints: the noise family** |
| **C9** | **islands** — placed parts not touching | the surface in several pieces | **T** | none placed today | one contour over all; a closed gap with no floor bridged whatever its width; non-coplanar → the nearest group's plane, `inside: false`, no cast (`face_map.ts:1003-1010`) — the gizmo hangs in air | none → **P2 (nothing to land on)** |
| **C10** | **overhangs, undercuts** | a part sticking out above another, its underside facing down | G (depth, angle); T-like for a height field (two surfaces on one ray) | Piece44 (upside down on the top), Piece45 (front), `Scene_2`'s cases | nothing specific: the cast hits the overhang first; its underside only from the bottom cap; the support's convex hull fills the space under it (`footprint.ts:25`) | — → **OS3: the facet facing it** |
| **C11** | **protrusions** — a boss, a pin, a part standing proud | a part in front of the facet's plane | G | Piece42, Piece43, `Scene_0`'s anchor, the tips of `Scene_0bis`; **each piece once placed** | the gizmo on the frontmost group (`face_map.ts:1003`); a jump of 41 – 49 mm onto and off it, glided | nothing: any height climbed → **P2 + P5** |
| **C12** | **faces parallel to the cast** — a tread between two risers, the side of a proud part | zero width seen along the facet's normal | **T for a height field** | Scene_1's step treads (I10), every protrusion's sides | never a place (I10 open; F8 *"walk the step"* not ported) | — → **OS3: a place of the facet that faces it** *(study: L12, L13 covered 100 % from the top)* |
| **C13** | **thin plates, fins, blades** | thinner than the piece or the shell | G | Scene_1's 10 mm slabs (edges only), `Scene_2`'s 2.8 mm flanges | nothing: a fin vanishes in the shell's box; step B worse on a blade (`ORBIT_CHARTS.md` §5.3) | not stated → **P2** |
| **C14** | **small faces, chamfers, slivers** | a face too small to work on | G | frusta's sides, `Scene_2`'s 1.4 mm bevels | D5 ¼ share; a chamfer beyond 20° kept as its own thin facet; authoring flags ≈ 7 mm | **six rulers** in the record (§3.3) → **D5 after the closing (§2.6)** |
| **C15** | **curved runs** — cylinders, discs, bores, tori | many small faces round a curve | G (facet count vs 20°); T if closed round | `Scene_2` only; the barrel test shape | quantised into facets of ≥ 20°; authoring answers with flat proxies (`PART_AUTHORING.md` §1) | the merge angle → **authored proxies** |
| **C16** | **fans and apexes** | faces converging on one point | G (size) + T (the apex's angle defect) | `Scene_0bis`'s tips, test shapes | the charts' FAN kind; polar (S11) | the polar zone's size → **P6** |
| **C17** | **coplanar faces of different parts / at different depths** | one plane made of many parts | G | `Scene_1`'s front (~36 parts) | grouped by plane (0.5 mm) and contact (grown 1.6 mm) | `MAP_COPLANAR_M` → **the noise family** |
| **C18** | **glued / internal faces** | a face pressed against another part's | T (which side is outside) | 240 faces in `Scene_1` | removed (`exposedRects`, `face_map.ts:515`), coplanar opposite within 0.5 mm; on the **bounding rectangle** of each face | — → **S22** |
| **C19** | **a hole inside ONE face** | a round hole cut in a plate | T | none (every part a box); `Scene_2`'s holed strips | ⛔ **invisible** to the stacks — a face is its bounding rectangle (`face_map.ts:482-486`); only the cast finds it (`POLAR_ORBIT_CLEANUP.md` §7, last lines) | — → **L1 from triangles, then P2** |
| **C20** | **the floor and what touches it** | the frozen floor; a face resting on it | T (occlusion) | `Scene_0` flush on the floor; `Scene_1` 15.5 mm above; Piece43 sunk 26 mm | the floor excluded (`assembly_wiring.ts:909`); the bottom a virtual cap at the box; no rule for a face in contact with the floor | — → **as built** |
| **C21** | **no level face; tied pole candidates; symmetry** | a ridge, a vertex up, equal faces | T for ties; G for the tie tolerance | `Scene_0`'s zenith ridge; test shapes | charts' top set within 1° (`CHART_CAP_DEG`, `face_map.ts:810`) | 1° → **a stated key** |
| **C22** | **very long, very flat shapes** | aspect ratio far from 1 | G | `Scene_0bis` (730 × 483 mm), `Scene_2`'s plinth | spit zones | — → **⏳ open** |
| **C23** | **the surface changing in play** | a seat adds a protrusion, fills a slot; `Scene_2` grows from a slab | T (the surface's identity changes) | every scene at each seat | face map rebuilt per placed set (`placedKey`, `assembly_wiring.ts:840`); never measured across a seat | — → **S19** |
| **C24** | **the held piece's own size** | a piece as big as the assembly, or bigger than the voids | G | `Scene_2`'s cases and banks | `heldFoot` = the two smallest sizes of the drawn mesh's own box (`assembly_wiring.ts:926`) | — → **P2 (⏳ wider than its facet)** |

### 3.1b The classes the pipeline has not met *(review)*, and the two the study added — moved

The table of C25 – C47 (open, sealed and buried cavities; parts that only touch; arches; bent tunnels; voids with a profile; rings; protrusions by
their size; arrays; void or face; shallow features; edges by their angle; free-form; faces at a threshold; strongly non-convex; a singularity on a
singularity; empty assemblies; the body against the point; the piece turned; goal entries; the topology changing; defective input), unchanged,
each with the study's shape, and the classes the study showed missing — **C48** sub-tolerance layers and shallow overlaps (F6), **C49** a void
whose far end decides what it is (F5, L07 against Q02) — are in [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) §7. *(study)* The classes it
showed to be the same case: C12 → OS3 (the tread a place of the facet facing it: L12, L13); C28 → C11 (L21, L22); C29 → C10 + P2 ① (L23, L24);
C32 → C6 + C11 (L32, L33, Q09); C35 → P2 + D5 by layers (L15, L16, L40, L41); C41 → its parts, for the landing (Q01, Q05, Q08).

### 3.2 Sketches — moved

The cross-sections of C5, C7(a), C4, C10, C12 are in [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) §8, the study's twelve in its §2.2.

### 3.3 "Small" — measured against what

Six rulers stand in the record (rule 3, *one constant in one place*, is broken). §2.6 proposes to keep two and a noise family:

| ruler | where | under §2.6 (2) |
|---|---|---|
| the held piece's two smallest sizes (+ 0.5 mm) | voids (S8) | → the piece as held, its `UCX_` outline (P2) |
| ¼ of its own polygon (D5, `facetMinShare`) | facets | kept: the layout's one ruler, measured after a closing at the level's smallest piece (not the held one) |
| ≈ 7 mm "too narrow to stand on" | authoring check ⑤ (reference units: per scene) | → B6 paints what P2 closes for each piece; the 7 mm goes |
| 0.22 × the placed box's smallest side (T3) | polar zones, `chartLayout 0` only | → goes with the legacy zones (step 2.5); P6's fans need none |
| the finger: a 37 mm face is 0.34 mm of finger far out (I17) | the reach on the glass | not a ruler of the surface (close in reaches anything) |
| `MAP_GROW_M` 1.6 mm; the coplanar 0.5 mm; the glide's 5 mm | joints; flush faces; depth steps | → ONE noise family in `units.ts`, with a named depth for "flush" (former D-S18); the glide's 5 mm goes (S26) |
| the piece AS IT IS TURNED; a spacing (arrays) | a keyed slot (C44); studs, fins (C34) | → answered by P2 itself (§8 Q2 for the turn) |

---

## 4. THE OBSTACLES

Each: why it is fundamental (plain words first, then the mathematics), where it can be overcome, where it cannot and the fallback — which
principle answers it.

| # | obstacle | why fundamental | can be overcome where / how | cannot where → fallback |
|---|---|---|---|---|
| **OS1** | **The turn budget** — the orbit's cross (green, red) cannot be carried round a closed shape without turning | carry a small cross round a corner without turning it and it comes back turned by the corner's *angle defect* (2π minus its face angles); over a closed ball-like surface they sum to 720° (Gauss–Bonnet), and any direction field has singular points whose indices sum to 2 (Poincaré–Hopf, the hairy-ball theorem) | on flat faces (none of it lives there): the turn is paid on edges and at chosen points — the charts do this (`ORBIT_CHARTS.md` §1) | at the poles and fans → **the polar zone**. ⭐ The surface's singularities ADD to it: a notch's inner corner (+90°), a saddle where a re-entrant edge meets a top (−90°) — each a place the charts must pay for, unseen today because the contour is convex (and `Scene_1`'s notches left so by the owner, D-S12) |
| **OS2** | **Holes through** (genus) | a hole through changes the count: 720° becomes 720° × (1 − g), and — given the two poles gravity imposes — each handle forces saddle-type singularities a columns chart cannot hold. A smooth orbit over a ball cannot map one-to-one onto a ring-shaped surface | the layout (the contour) never contains a hole (P1); the depth: P2 — narrower than the piece, closed by its rims | wider than the piece → **nothing to land on**, marked; the way through or in is the approach or the plunge (S5, S13) |
| **OS3** | **A height field cannot see everything** | a depth read along one direction is one number per place: it cannot hold the underside of an overhang (two surfaces on one ray), gives zero width to a face parallel to the ray (the tread), and steps at every wall (`TILTED_ORBIT_REBUILD_SCOPE.md` §31.4: occlusion, topology, sharp edges — *"no bijection possible"*) | where the faces are front-facing along their facet's normal: everything on the boxes' outer faces | an overhang's underside → reached from the facet that faces it (the bottom cap) or not at all; a tread → **a stated choice** (D-S7): unreachable, or its own facet; a wall's step → the **glide**, named as the one depth event |
| **OS4** | **Jumps at depth steps** | the height field is discontinuous at every wall and protrusion: landing (the real depth) and continuity cannot both hold there; P2 moves the step outward by half a piece, it does not remove it | far and medium: the step moves only the gizmo's marker, glided (P1) | close in: the collision blocks the piece and the gizmo with it (P5) — the glide not used there; the step passed by going out and back in (S14) |
| **OS5** | **"Small" has no single size** | the piece, the polygon, the finger and the scene's joints measure different things; the finger's ruler changes with distance, so no model-mm threshold makes a face reachable at every distance | §3.3's three questions, each with its ruler, each one constant | the finger's reach far out → **close in** (the camera), never the surface |
| **OS6** | **The surface depends on the held piece, on time and on the frame** | S8 makes the depth a function of the piece; S12 makes the faces a function of the placed set; the tilted pole and the polar zones rebuild the layout in their own frame mid-orbit; continuity across a pick-up or a seat cannot be promised | rebuild the faces and their classes only when the placed set changes (S19 (i)), where the gizmo is relocated anyway; in a new frame rebuild only the layout, the classification held the same (S19 (ii)) | a seat that changes the face under the gizmo → **a relocation event**, stated once (the gizmo to the nearest place on the new surface), never a jump mid-gesture |
| **OS7** | **Sharp edges have no normal** (step B) | a polyhedron's normal jumps at every edge; "the shape with its edges rounded" needs a radius, and a face smaller than the radius disappears into its edges | a rounding radius tied to the ruler (S16) | fins and blades thinner than the radius (C13): the normal flips side → step B's own fallback (`ORBIT_CHARTS.md` §5.3: worse on a blade) |
| **OS8** | **Numbers that are almost equal** | coplanar within 0.5 mm, joints of 3 mm, a clip at 1e-9 that dropped a whole facet (R2): floating-point and modelling tolerance decide topology | one family of tolerances, each a named constant with its unit; tests on shapes AT the tolerance | none if every tolerance is explicit; the record's six coplanar angles (§7 WS8) are the risk; *(study, F6)* a layer under the tolerance erased a real cap → S27 |
| **OS9** | **Path dependence at a mouth** | at a void open toward an edge the same angles can mean the floor's edge (the red) or the bridge (the green): two travels, one point | P3: the crossing at the real lip (convex on `Scene_1`) — §2.4's place-functions, measured first | the hold, labelled (S18 / P4), until measured; a mouth at a pole's edge: the tilt and the crossing one event |
| **OS10** | **Curved parts** | a curve made of many small flat faces either merges into slivers or splits into many tiny facets | authored flat proxies (`PART_AUTHORING.md` §1, §3); or a planar segmentation (VSA, §6) | a fan round an apex → **polar** (S11) |
| **OS11** | **Islands** | a convex contour spans the gap between two islands; the depth under it is empty | P2: a gap narrower than the piece, closed by its rims | a wider gap with nothing under it → **nothing to land on**, on the contour plane, marked — today it hangs at the nearest plane instead (WS4) |
| **OS12** | **Several geometries for one part** | the proxy, the collision pieces, the convex support and the render faces are authored or computed apart | a build-time check that they agree within a tolerance | none if the check exists; today it does not (WS2) |
| **OS13** | **The convex contour is an assumption** *(review)* | the layout stands on a convex envelope of big flat facets: a fair picture only while the assembly fills most of it; on an L, a U, a tray, a ring the facets are mostly void and the inward faces face no facet | while each void is a feature IN a facet: P2 | beyond it → **a stated limit** (a measure per level and stage, Q9); inner faces by the approach or the plunge, checked by B4; lobes (convex decomposition) a new design, not proposed |
| **OS14** | **The gizmo is a point, the piece is a body** *(review)* | where a POINT may stand and where a BODY fits differ by the body's half-width along every wall, rim and protrusion (configuration space) | P2: the gizmo's depth IS the body's first contact; its place stays the orbit's point | close in beside a wall: P5 (the collision); the piece's orientation: Q2 |
| **OS15** | **The classes form a continuum** *(review)* | a pocket widens into a rebate, a rebate into a step, a step into another face; holes multiply into a grille; a boss thins into a pin | P2 needs no class for use: the piece decides; only the layout's share and the noise tolerances remain thresholds (§2.6) | a feature AT a threshold → **flagged at authoring** by its margin (B6, persistence §2.6 (3)) |
| **OS16** | **Some goals are not places** *(review)* | the layout is ball-like and OS3 hides what no facet faces; a level may ask for a piece inside a cavity, under an overhang, down a bore | the orbit close in (the goal capture), the approach (A + dy), the plunge from a ghost at the entry (S13) | a goal none of these reaches → **the level's plan changes** (W1) — found in Blender by B4 (S21), never by the player |

---

## 5. WHAT TO SPECIFY FOR THE REBUILD

### 5.1 The layers

[PROPOSED] Six layers, each a pure function in `src/core` or `src/input`, in model coordinates, deterministic (ties broken by a stated key,
never by array order). L0 – L1 depend neither on the orbit's frame nor on the held piece; L3 – L4 are built in the frame from L1 alone; L2
depends on the held piece (P2) and takes L3's facet directions — so the order is L1 → L3 → L2, with no loop.

| layer | input | output | invariants | thresholds (unit, home) | rebuilt when |
|---|---|---|---|---|---|
| **L0 — the parts as authored** | render mesh, `UFM_` proxy, `UCX_` pieces, ghosts, the goal's entry direction | per part: route faces, collision pieces, ghosts, entry | the Blender checks B1 passed, re-verified at import (§7bis) | the fit tolerance (authoring) | at import |
| **L1 — the exposed faces** | the placed set; L0 on its model poses | the faces reachable from outside (S22): polygons from the TRIANGLES, normals, parts | a glued, buried or sealed face never present; every point in one face | the noise family (`units.ts`) | at a seat, a put-down, an undo |
| **L2 — the landing maps** (P2) | L1's collision pieces + L3's facet directions + the held piece's `UCX_` outline as held | per facet direction: a LAYERED depth (each ray's entries and exits), and the first-contact depth of the piece over it | one operation for voids and protrusions; "nothing to land on" a stated value | none for use — the piece; the grid's step (4 mm, `units.ts`) | at a pick-up, a turn of the piece, a seat, a frame change |
| **L3 — the contour** | L1, closed at the level's smallest piece for D5's share (§2.6; never L2) | the convex facets: polygons, normals, edges, corners; caps | the same facets in every frame up to its turn (S19 (ii)) | the merge angle (20°), the share (¼) | at a seat; in the frame at a tilt or a zone switch |
| **L4 — the atlas** | L3 | charts, poles, fans (P6), frames | `ORBIT_CHARTS.md` §1; the turn budget (OS1) | as there | as L3 |
| **L5 — per frame** | the angles, L3 – L4, L2 at the place | the gizmo's target and shown point, its face, the depth, the events | the target a function of the angles and the piece (P4); within the 24-query budget (L2 is a lookup) | — | every frame |

Under L2, per facet direction, the depth is a short list per sample — the surfaces a ray meets — not one number: an overhang's underside, a
cavity's floor and a tunnel's two mouths are then present and the rules can name them (OS3 is not removed: a translation along one direction
still reaches only the first). Where a scene's parts are boxes, frusta and prisms (written as data), their collision pieces are the hulls at spawn.

### 5.2 The table SINGULARITY → PRINCIPLE → EVENT

[PROPOSED] "Nothing to land on" = no contact along the facet's direction: the gizmo on the facet's plane, marked. "Approached" = reached by
A + dy or a plunge. "⏳ open" = no principle answers it yet.

| class | answered by | what it gives | event at its border |
|---|---|---|---|
| C1 convex faces, edges, corners; C2 non-rectangular | P1 (the contour), the charts (F1) | facets | a crossing, its turn |
| C3 concave edge (a notch, a step) | P2 + P5 (the owner's notches as ruled) | a depth step, half a piece out | far: the marker glides; close in: blocked |
| C4 through hole; C9 island gap | P2 | narrower than the piece: closed; wider: nothing to land on | none (the plane continues) |
| C5 channel; C6 blind hole; C8 groove | P2 | its floor where the piece fits, else closed | as C3 |
| C6 hole with an authored ghost | S13 (§2.5) | the ghost at the mouth, then the plunge | the plunge, an event |
| C7(a) mouth; C49 a void whose far end decides *(study)* | S10 kept; the hold within its domain, P3 measured (§2.4, Q4) | the hold today | the tilt at the lip |
| C7(b) cavity behind a narrow opening; C30 bent tunnel | P2 at the opening; behind it approached (S13) | — | — |
| C10 overhang; C29 arch, legs | OS3: P2's first layer from the facet that faces it | the underside only from the bottom cap | — |
| C11 protrusion; C13 fin; C33 pin, rib, plateau | P2 (+ P5 close in) | the top where the piece first touches it | as C3 |
| C12 tread between risers | OS3: the facet that faces it *(study: L12, L13)* | a place of the top, not of the side's travel | a crossing |
| C14 small face; C37 shallow edge | P1's merge + D5's share after the level's closing (§2.6) | part of its neighbours | none |
| C15 curve; C38 doubly curved | authored flat proxies (B); else not supported, said | — | crossings between its facets |
| C16 fan | P6 | a polar zone (the charts' fans) | the zone's entry |
| C17 coplanar; C36 shallow step; C48 sub-tolerance layer *(study)* | the noise family: S26, S27 (§2.6, §2.7); C48 refused at authoring | one face, or a named step | the depth event at or above the tolerance |
| C18 glued; C26 sealed; C27 buried | S22 (B2) | not surface | at the seat that seals: a relocation (C46) |
| C19 a hole in one face | L1 from triangles, then P2 | as C4 / C6 | as C4 / C6 |
| C20 face on the floor | as built | not a place | — |
| C21 ties, symmetry | a stated key | — | — |
| C22 very long, flat shapes | ⏳ open — the spits handle the layout | — | the spit's entry |
| C23 a seat; C46 topology changing | S19 | L1 – L4 rebuilt; the gizmo relocated once | a relocation |
| C24 a piece as big as the assembly; C43 the body against the point | P2 (the body is the ruler) + P5; P2 ③ past an edge *(study, F9)* | ⏳ a piece wider than its facet: open | — |
| C25 open cavity | P2 (its floor); inner walls approached (S13), B4 says which goals need it | — | as C3 |
| C31 void with a profile; C32 ring-shaped; C34 array; C28 touching *(study: as C11)* | P2 on the layered depth, level by level | exact for the piece *(study: L26 – L39)* | as C3 |
| C35 void or face? | P2 + D5 by layers: L3 the facet, L2 the use *(study: L15, L16, L40, L41)* | no order of tests needed | a crossing if a face |
| C39 face at a threshold | B6 — refused or flagged at authoring, by its margin (§2.6 (3)) | — | — |
| C40 strongly non-convex | measured by B5's coverage, warned *(study: L48 43 %, L50 32 %)*; lobes not designed | — | the far path moves with the contour, at a seat (P1) |
| C41 a singularity on a singularity | its parts, for the landing *(study: Q01, Q05, Q08)*; a mouth at a pole: Q4 (Q02); ⏳ the layout's events at a pole, not studied | — | one event, never two |
| C42 empty or nearly empty | S29 *(study: L51, L52)* | out of reach: a placed part at boot; round one small part P2 ① | — |
| C44 the piece turned | P2 ② (§8 Q2) *(study: L53)* | the map of the piece as held | a depth change at the turn |
| C45 goal entries | S13 + B4 + S28 *(study: L05, Q07)* | each goal's entry authored, checked; a set-down a landing, any other a guarded move | the entry, an event |
| C47 defective input | S25 (B1) | refused at the build | — |
| a frame change (tilt, polar zone) | S19 (ii) | L3 – L4 in the frame; classes unchanged | the tilt's or the zone's transition |

### 5.3 The vectors and the test shapes that would prove it

* **The shapes exist** *(study)*: the library L01 – L53, the pairs Q01 – Q10 and the 1596-cell sweep of §3.0's grid
  ([ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) §2), with today's reading and P2's — each becomes a vector of `tests/helpers/` shapes (the
  chart helpers are all convex, `tests/helpers/chart_shapes.ts:2`), P2's offline reading the brute-force second implementation. Still to add:
  `void_sim`'s families, a round hole in one face (C19), a 12-sided cylinder and a dome (C15, C38), fans and apexes (C16), the floor (C20), ties
  (C21), long flat shapes (C22), defective input (C47), a narrowing profile in the sweep, facets other than the top and the front, tilted frames and
  zone switches (P6), the relocation at a seat (C46), P3's place-functions, and the far bump through `mapTarget`'s angles with the calm (the study
  tilts `u` by a fixed 20° / 45°).
* **Per shape, for two pieces** (41 × 45 and 80 × 80 mm): L2's landing depth against a brute-force drop of the piece's `UCX_` (the second
  implementation that falsifies the first); the L5 gizmo on a 1 mm sweep — no jump outside a named event; the same after the shape is moved
  and turned; the same for every order of placing its parts; the same classes in every frame (S19 (ii)).
* **The scenes**: `Scene_1`'s replay (grooves, channel, mouth — §2.4's three candidates), `Scene_0`, `Scene_0bis` unchanged where their features
  are unchanged.
* Each new vector shown **failing against today's code** before it is trusted (`CLAUDE.md` rule 2) — the study already shows which do (§4 there).

### 5.4 Deliberately left out

`Scene_2`'s proxies and ghosts as authored (the owner reviews them himself; §7bis proposes checks, not proxies); the plunge snap itself; step B;
the collision's construction; parts that MOVE once placed (the surface is that at rest in the goal poses); the finger's reach far out (I17).

---

## 6. THE CANDIDATE WAYS (from the prior art), restated by the principles

The ways the prior art offers — **A** classified features on today's contour (superseded), **A′** first contact on today's contour (P2: the
contour, charts and shell kept, ONE landing map per facet direction replacing the stacks' depth rules), **B** an authored surface (Blender proxies
and ghosts: curves, cavities, goal entries), **C** the surface accessible to the piece computed OFFLINE only (the Blender checks) — with their
table, and the owner's 2026-11-13 *"your proposals A, B and C have already been tried … no bijection possible"* (A′ is no new orbit → surface
mapping: only the depth rule changes) → [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §4 (moved at the third step).

**Recommendation [PROPOSED]. Build first:** (1) L2, the landing map (P2), as one pure function, its vectors against a brute-force drop, wired
first as a READOUT beside today's depth on `Scene_1` (so the owner sees the difference before it drives anything) — the study's P reading is
its second implementation; (1b) the shell fed the contour point far and medium (P1, F17), a replay of `Scene_1` far out against today's; (2) the mouth's hold restricted and §2.4's measurement (Q4); (3) the Blender checks B1, B2, B4 (§7bis); then (4) L2 driving the gizmo, the footprint support re-expressed on it with its wall kept
(a replay of `Scene_1` close in against `Piece44`: unchanged).

---

## 7. THE AUDIT OF WHAT IS BUILT

The 25 weaknesses (WS1 – WS25), the patches standing beside a rule, and the errata of this study's first version are in
[ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md). In one line each, by what answers them:
* **P2 answers** WS3 (the support fills slots), WS4 (a gap with no floor: nothing to land on), WS5 (the fit only with a floor), WS10 (the
  footprint the two smallest sizes), WS20 (no ruler for what stands out), WS22 (a floor within 20°, the fit at the plane only).
* **§2.6 answers** WS8, WS9, WS21, WS23 (the rulers and tolerances); **S22 / B2** WS19 (exposed = not glued); **B1 / B6** WS2 (proxy vs
  collision); **B4 / B5** WS24 (nothing checks the purpose).
* **P4 / §2.4** WS12 (the mouth's hold); WS13 (the concave edge at the mouth — the edge is convex; S10 + the hold cover it, P3 to measure);
  **S19** WS14 (the frames' maps).
* **Still open**: WS1 (four notions: A′ removes one), WS6 (§2.5), WS7 (regions from triangles), WS11, WS15 (S27 (a)), WS16, WS17 (step 2.5).
* *(study)* MEASURED: WS4, WS5, WS10, WS12, WS19, WS22, WS23 (F4, F3, F5, F12, F11, F10); WS18 answered by its library, WS25 by S29. One more found:
  a plane's level is its FIRST face's and R1 pairs an opposite face on either side — a sub-0.5 mm layer erases a real cap (F6 → S27).

---

## 7bis. THE BLENDER WORKFLOW — PROPOSED AMENDMENTS (S21, S24, S25)

[PROPOSED] The owner: *"we shall amend the blender object building workflow to make sure that any surface built in blender is built with
consideration of the playability of the game, therefore in consideration with the rules we are specifying here."* ⛔ `SCENE_WORKFLOW.md` and
`PART_AUTHORING.md` are NOT edited by this study: the lines to amend are listed (§7bis.5), for after his approval.

### 7bis.1 The workflow as it stands (read on `1.0.146-Orbit-charts`; both files say "PROPOSED … NOT APPROVED" and are in use)

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

### 7bis.2 The PLAYABILITY BRIEF a part carries from the plan (W1 → exported as `extras`)

Per part, written at W1, ONE home, exported so that both Blender and the game read the same facts: its **stage** (`after`: the parts placed
before it — the partial order, each placement its own stage); its **entry** (`entry_dir`, and `entry_kind`: set down / slid / plunged — the
ghost's `plunge_axis` then derived from it or checked equal); its **seat pairs** (`mates_with` on each `MC_` marker); the **held piece's faces
that rest** (its resting proxy); and the **faces later parts need as places** (the routes of later steps over it) — the faces B3 and B5 must
find landable.

### 7bis.3 The checks B1 – B6

Each runs in Blender at W3 (per build step, every run), PAINTS its result as a colour attribute on the faces (green a place, amber at a
threshold, red no place / not reachable) in the review `.blend`, prints a **verdict line** and **fails the run** (exit ≠ 0) when its pass rule
fails, with a planted **control** in `CHECK_CONTROLS` (*"a check never seen failing is not trusted"*). Each is re-verified cheaply at import.

| check | what it tests | how in Blender's Python | painted | pass rule | re-verified in the game | hooks |
|---|---|---|---|---|---|---|
| **B1 solids** (S25 restated) | each `UCX_` convex, closed, volume > 0, in ONE budget; the part's `UFM_` proxy lies ON the union of its `UCX_` within a fit tolerance, facing OUT of it; each ghost's rim on a real proxy face | `bmesh`: `edge.is_manifold`, `is_boundary`, the hull's vertices; `mathutils.bvhtree.BVHTree`: `find_nearest` (proxy samples → `UCX_`), `overlap` (self-crossings); a point-in-convex test for "outward" | red: a proxy face off its solid or facing in; amber: within 2× the tolerance | all green, or an exemption written per piece (`fit_tol`: the squared bores) | a pure `src/core` function on the parsed `.glb` (the geometry from `glb_geometry.ts`): convex / closed / budget, proxy planar and outward; a vector on each scene's file | W3 every run; W4 import |
| **B2 exposed per stage** (S22) | per stage, which proxy faces are on the boundary of the placed parts' union that the outside reaches | the union (Boolean, Exact solver — overlapping input) or a voxel grid of the `UCX_` pieces; a flood of the outside (numpy, 6-neighbour); each proxy face sampled against the flooded cells | grey: glued / buried / sealed | none — it is a map; it replaces "exposed = not glued" in the plan's rule 4 | the same on the game's data in a vector (a coarse grid), not at load | W3 per stage; W1 rule 4 made a script |
| **B3 landing map** (P2) | per stage, per held piece, per facet direction: where the piece first touches | ⛔ NOT re-implemented in Python: a node script runs the GAME's own L2 function on the provisional `.glb` and writes `<scene>_landing.json`; `review_proxies.py` paints it | green landable; red closed for that piece; magenta "nothing to land on" | ⏳ pending until L2 exists: every face a later step needs as a place (7bis.2) is landable for the piece that needs it | it IS the game's function (one implementation) | W3 before the export; W5 |
| **B4 goal reachable** (S21) | per part at its stage: withdrawn from its goal along `entry_dir` until it CLEARS the placed set (not a fixed 0.8); the pre-insertion pose; its entry point a landing of B3; the drawn ghost at the computed pose | `BVHTree.overlap` of the part's `UCX_` against the placed set's, stepped then bisected (the way-in sweep extended); the ghost compared within the fit tolerance | red: blocked (the blocking parts named); amber: the ghost off the computed pose | clear, reachable, ghost agrees | the same sweep with the game's GJK over the `UCX_` pairs, in a vector at W4 / W5; seat pairs re-checked from `mates_with` | W1 (on the reference's numbers, as rule 2), W3, W5 |
| **B5 coverage** (S24) | per stage, every exposed face (B2) that is no place, with its reason: parallel to the cast, under an overhang, closed for the piece (B3), inside a cavity, below the share | from B2 and B3 (⏳ the reason "closed for the piece" pending until L2 exists) | each face by its reason; a text list | none — the owner accepts each class or changes the part | the list in the level's data; a vector that it does not grow unseen | W3 before the export: the owner's proxy review (§4.3 item 3) gets these colours |
| **B6 conformance** | features near a threshold: a facet's elevation within 15° of 45°, two route faces within 30°, a feature whose closing radius is near the piece's size (§2.6 (3)), a facet near the share | the thresholds READ from the game's files (never retyped — as the lights are); numpy on the proxy's faces | amber: at a threshold, with its margin | no route or seat face at a threshold without a written acceptance | the same thresholds in the game: the vector reads one constant | W2 (sheet), W3 |

### 7bis.4 The DESIGN-FOR-PLAYABILITY checklist (for whoever draws a part; each line traced to a rule here)

1. One clear entry per part, along its host face's normal where possible, from above if it can be (S21, B4; design for assembly).
2. A lead-in: a chamfer or a ghost at the mouth, so the plunge starts from a capture region (S13, §2.5).
3. Every face a later part rests on is wider than that part's footprint, or a ghost bridges it (P2, B3).
4. No route or seat face within 15° of 45° of elevation; faces to be told apart ≥ 30° apart (B6).
5. No gap, groove or step at a threshold: clearly narrower than the noise tolerance, or clearly wider than the piece (§2.6).
6. Collision pieces convex, closed, few; the proxy on them, facing out (S25, B1).
7. Round parts as flat proxies; no doubly curved place (C15, C38).
8. Symmetric, or obviously not: a look-alike turn declared in the catalogue (`SCENE_WORKFLOW.md` §2.3 rule 7).
9. Nothing placed inside what is already closed; no step that needs a turn mid-path (B4).
10. Each exposed face is a place, or listed with its reason (S24, B5).

### 7bis.5 Where it hooks, and the lines to amend LATER (after his approval; on `1.0.146-Orbit-charts`)

* `SCENE_WORKFLOW.md` §1 (lines 21 – 29): W1 exports the playability brief; W3's gate adds B1 – B6's verdicts; W5's vectors re-verify B1, B3, B4.
  §2.3 (lines 83 – 101): rule 2 (access) and rule 4 (the route exposed) become B4 and B2 run as scripts; "exposed" = reachable from outside.
  §4 (lines 131 – 137): the face map's thresholds bind the ROUTE and SEAT faces (the contour's facets), not every real face — B6.
* `PART_AUTHORING.md` §1 (line 16): "built from the EXPOSED faces" → reachable from outside (S22). §3 item 3 (lines 66 – 71): the paragraph on
  the ghost AT THE DEPTH, already superseded, removed (WS6); (lines 137 – 147): the ghost computed from the entry and checked (§2.5).
  §4.2 (lines 240 – 241, "Not yet in the report"): B1. §4.3 item 3 (lines 268 – 276): the review gets B3 – B6's colours and pass rules.
* The game: a `src/core` checker beside `readModelCatalog` (B1's subset at load; the rest in vectors on each scene's `.glb`).

**What it costs per scene** (estimates, not measured): B1, B4 — seconds per run; B2 — a voxel flood per stage (a 128³ grid in numpy: about a
second each); B3 — the game's L2 per stage × held piece × facet direction, in node (tens of seconds per scene); B5, B6 — negligible. Authoring:
the brief's fields per part at W1, and a `fit_tol` where a proxy departs from its collision on purpose.

---

## 8. THE DECISIONS FOR THE OWNER

Nine questions, each answerable in one line. [PROPOSED] recommendations; nothing is his decision until he says so. *(study)* Q3 merged into Q2, Q4
reworded, Q10 added; the numbers kept.

| # | question | options | recommendation |
|---|---|---|---|
| **Q1** | P1 in his words: far and medium no singularity of the surface under the gizmo moves the piece or the camera; close in the collision governs ("close in" = within the shell's 60 mm offset)? ⚠ Today's code departs from his words in three places: along a travel where the orbit's direction is oblique (F17: a depth step h bumps the far piece by h × tan θ — a 40 mm slot 15 mm at 20°, 40 mm at 45°); between stages, where a placed part grows the box (F7: at its seat); at the mouth (the hold starts the tilt at the real lip from up to 0.6 m) | (a) his words kept: the shell fed the gizmo's CONTOUR point far and medium (§2.2 P1), a box grown at a seat a stated event; (b) the wording amended to today's code ("a function of the box and the contour"), F17's bumps accepted; (c) another boundary (0.3 m, 0.6 m). The mouth: (i) the real lip only within 60 mm; (ii) a labelled exception to 0.6 m | (a) — it keeps his words and the rebuild's I2; (ii) for the mouth until Q4 — his S10 was given at the tilt's distance |
| **Q2** | P2: the gizmo's depth = the first contact of the held piece AS HELD (its map rebuilt at a turn; Q3 merged) — reversing his decision 2 of 2026-11-07 (`1.0.105-`: *"gizmo is a point, not the piece's footprint"*)? Close in a proud part stays a WALL (his Q1 (b), *"Proceed"*); far the marker climbs half a piece early, S5's real depth then in the central band only (L03: 19 mm) | (a) yes, first as a readout beside today's depth, then driving; (b) no, the point stays | (a) — the study: today's marker stands where the piece cannot rest on 41 of 62 shapes (far out the piece rides the shell, close in the collision refuses it); its two-smallest-sizes ruler judges B 80 × 80 as 40 × 80 and the bar 20 × 20 (130 places across the keyed slot); P2 never, by construction |
| **Q3** | → merged into Q2 (the piece as held) | — | — |
| **Q4** | The mouth's hold fires on the cap, along island gaps, in a V (F5, the study's emulation): restrict it to where it hands over to the automatic tilt (a side facet, toward a cap's edge, over a void P2 leaves open for the held piece; never on a cap) — "a void P2 leaves open" needs L2, so the full restriction waits for L2's readout (§6 (1)), "never on a cap" now — and measure P3's place-functions (§2.4 (a), (b)) on `Scene_1`'s channel and Q02, L07, L10, L11? | (a) yes; (b) keep the hold as built; (c) delete it now | (a) |
| **Q5** | S13 and S28: every goal carries its entry direction; a set-down is a landing (P2), any other entry a guarded move from the pre-insertion pose computed by withdrawal (the drawn ghost checked against it), the plunge one of them (§2.5 (3) + (4))? | (a) yes; (b) drawn ghosts only | (a) |
| **Q6** | S16: the piece (P2) + D5's share after a closing at the level's smallest piece (not the held one) + one noise family in `units.ts` with S26 (one depth tolerance, no unnamed step) and S27 (tolerances join, never erase); persistence offline only (§2.6 (2))? ⚠ With P5, S26 makes a step of 0.5 mm or more a WALL close in — a seat 1 mm proud included (C36; 99 / 76 of the study's protrusion traps); his Q1 (b) was ruled on `Piece44`, 41 mm proud | (a) yes, every step ≥ 0.5 mm a wall; (b) a ruler per question; (c) (a) with a CLIMB height in the noise family under which a close-in step is not a wall | (a) or (c): the climb height is his call |
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

---

## 9. SOURCES

In this tree (`1190db2`), and read on `1.0.146-Orbit-charts` (`30f7bb3`) for this revision:
* [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) — the weaknesses WS1 – WS25, the errata of the first version, the prior art in full.
* [ORBIT_CHARTS.md](ORBIT_CHARTS.md) §1, §4.4, §4.5, §5.3 — the rules, the specificities, the sway, step B.
* [TILTED_POLE_CLOSE_IN.md](TILTED_POLE_CLOSE_IN.md) §2.2 (O7, O9, O11), §4.2 (W8, W9), §6 — the obstacles' method, the mouth.
* [POLAR_ORBIT_CLEANUP.md](POLAR_ORBIT_CLEANUP.md) §6, §7, §8.1, §8.3, §9.4, §9.9, §9.10 — R1 and the notches, the void study, F8 / F6 not
  ported, the void rule, the tilted map, the glide, the mouth's report and *"build b"*.
* [TILTED_ORBIT_REBUILD_SCOPE.md](TILTED_ORBIT_REBUILD_SCOPE.md) §10, §15, §16.1, §17, §18 — the shell, the face map, D2 / D3, D5.
* [CLOSE_IN_CONTACT.md](CLOSE_IN_CONTACT.md) §1, §5 – §6, §8 – §10 — Q1 (b), the footprint support, the gain, the margins, the slide removed.
* [ORBIT_ANY_SHAPE.md](ORBIT_ANY_SHAPE.md) §2, §3 — F1, F2b. [POLAR_ZONES.md](POLAR_ZONES.md) header — the owner's polar rules.
* [PART_AUTHORING.md](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) §1, §3, §4 and [SCENE_WORKFLOW.md](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md)
  §1, §2.3, §4, §6 — proxies, ghosts, the checks; the stages, the plan's rules, the limits, the playbook.
* [SCENE_2_ASSEMBLY.md](../../30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md) §2.9, §2.10, §6 (the bores, the plunge); [LEVEL_END.md](../../20_GAME_RULES/spec/LEVEL_END.md)
  §5quater (the goal capture during the orbit); [RND5.md](../../00_CORE/queue_notes/RND5.md) (the rebuild's dossier).
* Code: `src/input/{face_map,orbit_charts,free_face,footprint,orbit_tilt,orbit_shell,assembly_orbit,ring_hold,polar_zone}.ts`,
  `src/input/gestureConfig.ts`, `src/render/{assembly_wiring,contact_wiring,model_bodies_wiring,model_import}.ts`, `src/core/{collision,
  model_catalog}.ts`, `tests/helpers/chart_shapes.ts`, `scripts/probes/void_sim.ts`; `Assets/Blender/scripts/{build_engine,review_proxies}.py`.

Outside this tree: `TILTED_ORBIT_REBUILD_SCOPE.md` §29 – §32 on branch `1.0.107-Close-in-atlas` (decisions 2 and 3, the bijection, the limited
surface); the session's record of the orbit designs already tried (the owner's 2026-11-13 answer on proposals A, B, C).
