# THE ORBIT'S SURFACE — what it aims at, its rules and principles, its singularities, its obstacles, what the rebuild must specify (2026-11-16)

> ⭐⭐⭐ **2026-11-22 — THE SURFACE WORK STARTS (his word: *"We will then move to the orbit surface work"*).** The condition below is MET: the orbit
> charts are CLOSED (LIVE `40b8095`, the best so far) and this branch is merged (`1.0.154-`, 2026-11-22). The workfront: `1.0.156-Orbit-surface`.
> First: ask him again what §8 (its end) keeps for this moment → [`HANDOVER_2026-11-22_orbit_surface.md`](../../00_CORE/queue_notes/HANDOVER_2026-11-22_orbit_surface.md).

> ⛔⛔ **THE OWNER'S DECISIONS OF 2026-11-16 ARE RECORDED (§8) — PROVISIONAL: TO BE TESTED, AND MAY BE REVERSED BY THE TESTING. NOTHING BUILT, NO GAME
> CODE CHANGED.** Branch `1.0.146s-Orbit-surface-spec` (from `1.0.146-Orbit-charts`, `1190db2`). **[OWNER]** quotes the owner, with its file, section
> and date; **[DECIDED 2026-11-16]** marks what he decided, or accepted by agreeing with a written recommendation (*"I agree with the recommendations,
> although they shall be later tested and could be reversed if the testing shows they need to be reversed"*); **[PROPOSED]** is this study's reading,
> NOT his decision until he says so. ⛔ **WHAT HAPPENS NEXT (the owner, 2026-11-16): NOTHING HERE IS BUILT before the build chain and the orbit
> charts are finished and `orbit_charts` (`1.0.146-Orbit-charts`) is merged into `3d_assembly_game` (`1.0.145-`); this branch is merged after it**
> — his sentence and the notes for those merges: §0, end; what to ask him again when the surface work starts: §8, end. ⭐ **AMENDED BY HIM 2026-11-17: the OFFLINE part starts in parallel (new files only, nothing wired) → [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md).**
>
> **The owner's request (2026-11-16, verbatim):** *"In the meantime, write the specifications for my review regarding the surface definition. What
> does the surface aim at. What are the rules. What geometries, topologies, singularities shall be considered. What obstacles to overcome. What to
> specify for the rebuild?"* — and earlier the same day (`RND5.md`, `TILTED_POLE_CLOSE_IN.md` §6): *"Also, before step B, we will need to work on the
> surface definition and the singularities (voids, channels, mouths, protrusions, small faces): just capture that in your to do list for the
> moment."*
>
> **Four exchanges with him, 2026-11-16** (the full record of the revisions: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §6): (1) a first review at
> his request — marked *(review)*; (2) his feedback on nine rules → six principles, §2.5 – §2.6, §7bis (§0bis); (3) the shapes study and its
> consolidation ([ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md), `903e50d`) — marked *(study, F…)* —, then his two comments on P1 and on the scope
> (§0ter) — marked *(alignment)*; (4) his answer to §8's nine questions, a new word for the collision regime and a clarification on the entries
> (§0quater) — marked *(decisions)*. Code references: the tip of `1.0.146-Orbit-charts` (`30f7bb3`; the contact's drop read on `9f101a4`), the first
> version's on `1190db2`.

---

## 0. ONE PAGE

**What the surface is for.** The finger moves the gizmo over the assembly; the gizmo is where the piece will land. So "the surface" answers one
question many times a frame: *for this place of the orbit, where is the gizmo — its place and its depth?*

**Its scope (the owner, 2026-11-16, §0ter).** This specification defines WHERE THE GIZMO TRAVELS. What governs the piece's and the camera's orbit
(the orbit's angles, the shell, the charts, the tilted orbit, the calm) is settled in the orbit's own documents and is not reopened here; the one
place where the gizmo's travel acts on the piece and the camera is the collision (P5).

**Two words (§1.4, the owner 2026-11-16).** **Contact range** — where the piece can collide (during the approach, during the orbit); out of it: far
and medium. **Close in** — only the orbit ↔ tilted orbit transition (0.6 m in, 0.65 m out).

**What it is today.** Four things grown patch by patch: a **convex contour** of big facets (the layout); under each facet a **stack of depths**
where holes, voids, mouths and protrusions get one rule each; a **ray cast**; separate **convex hulls** for the collision and the support. The
gizmo's void test and the piece's footprint support answer nearly the same question twice, and disagree near every wall (§2.2 P2).

**What is decided — provisionally, to be tested (§8, the owner 2026-11-16).** Principles instead of one rule per shape, tested on 63 shapes and
1596 cells *(study)*:
* **P1 — his boundary condition.** Out of contact range, no singularity under the gizmo changes the path of the piece and the camera; in contact
  range, the real surface and the collision govern (Q1). Today's two measured departures (F17: an oblique direction shifts the far piece by a depth
  step × tan θ; the mouth: a real lip decides where the tilted orbit starts, up to 0.6 m) are recorded as defects for the orbit's queue.
* **P2 — the landing is a first contact.** The gizmo's depth is where the HELD PIECE, moved along the face's normal, first touches the placed
  parts — first as a readout beside today's depth, then driving (Q2; it reverses his *"gizmo is a point, not the piece's footprint"* of 2026-11-07).
  *(study)* Today's point marks a place where the piece cannot rest on 41 of 62 shapes; P2 never, by construction.
* **THE PIECE SHALL NOT DROP (Q10).** The gizmo reads the real depth at every distance (D3); the piece enters a recess only by the approach
  (A + dy) — *"the kid would need to push the piece"* (§1.2). Today's contact lowers it into every slot it fits: a departure handed to the
  contact's queue (§2.2 P5).
* **A goal has an ENTRY SET (Q5, his amendment).** Every clear path to the seated pose, from any orbit angle: the directions along which the part,
  withdrawn from its goal, touches no placed part — computed, never listed; the ghost only where the set is narrow (S28, §2.5).
* **P4** a function of the place; **P5** in contact range, blocked, not jumped; the mouth's hold restricted (Q4); one ruler and the noise family,
  S26 / S27 (Q6); the Blender checks and the playability brief, now written into the workflow (Q7, §7bis); S25 / S22 (Q8); the first round's open
  points (Q9). **P3, P6** withdrawn (the orbit's matters: audit §5).

**What stays open.** The classes with no rule (⏳ in §5.2: C22 long flat shapes, a piece wider than its facet, C38 free-form, the layout's events
at a pole); the classes the study has no shape for (§5.3); the findings handed over — to the ORBIT's queue (F17, the mouth's lip, F7 an event at a
seat, D5 after a closing WS21, the camera's frame far out), to the CONTACT's queue (the drop, §2.2 P5). Nothing is built.

**What cannot be avoided (§4).** A direction field round a closed shape has singular points (the poles; a hole through adds saddles); a depth
read along one direction cannot see under an overhang, gives zero width to a face parallel to it, and steps at every wall. Each has a fallback.

⛔ **WHAT HAPPENS NEXT (the owner, 2026-11-16).** *"We have three worktrees: 3d_assembly_game on branch 1.0.145-, orbit_charts on branch 1.0.146-,
orbit_surface_spec on branch 1.0.146s-. We will have to merge orbit_charts into 3d_assembly_game and then the work on orbit surface into
3d_assembly_game. Therefore we will finish the work on the build chain and the orbit charts, then merge orbit_charts into 3d_assembly_game, before
any rebuild work on the orbit’s surface is started."* So nothing of this specification is built before the build chain and the orbit charts are
finished and `orbit_charts` (`1.0.146-Orbit-charts`) is merged into `3d_assembly_game` (`1.0.145-`); this branch (`1.0.146s-`) is merged after it.
**For whoever does those merges:** this branch also changes `SCENE_WORKFLOW.md` (§7) and `PART_AUTHORING.md` (§6) (§7bis.5); two findings are handed
to queues with no row yet — F17 and the mouth's lip to the ORBIT's, the drop into a slot in contact range to the CONTACT's (§2.2 P1, P5): their rows
are to be written in `Claude/00_CORE/QUEUE.md` at that merge (that file is at its size budget). What to ask him again then: §8, end. ⭐ **2026-11-17, amended by him:** the offline part (the entry-set check on `Scene_2`'s real pieces, the landing map as a pure function) starts now, in parallel, on new files only; everything wired still waits for that merge → [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md).

---

## 0bis. THE OWNER'S FEEDBACK OF 2026-11-16 AND WHAT WAS DONE WITH EACH POINT

| his point (verbatim) | the answer | where |
|---|---|---|
| *"S6 - Holes are closed at the contour: "close the holes for the moment".-> i am not sure if this decision is correct. It was a temporary fix at the time i took the decision. Amend if geometry or topology requires a better decision."* | Amended. S6 becomes a CONSEQUENCE of P2: a hole narrower than the held piece is closed because the piece rests on its rims; a blind hole the piece fits gives its floor; a hole right through and wider than the piece gives no contact — "nothing to land on", stated, the gizmo on the facet's plane and marked. On the glass, through holes look as today; the change is that it is no longer a blanket rule | §2.2 P2, §2.3 |
| *"S7, S8 , S9, S10, S11, S14, S23: these decisions was taken ad hoc to simplify. If they conflict with other decisions or if geometry or topology requires a better decisions, propose it. Check literature for better patent-free proposals."* | S7, S8, S9, S23 → P2 (the drop cutter / configuration-space first contact: textbook, patent-free); S10 → kept, the gizmo's hold its domain restricted (P3, first proposed, withdrawn at the alignment, §0ter); S11 → the charts' fans (P6 withdrawn: the layout's matter); S14 → P5 (the haptic proxy and backing off). Literature in §2.2 and the audit file | §2.2, §2.3 |
| *"S13, S16: there may be better alternatives: review literature for patent-free proposals and advise."* | S13: keep his ghost at the mouth, but COMPUTE it from the goal and its entry direction (assembly by disassembly) and check the drawn ghost against it; the plunge a guarded move started inside a capture region. S16: the piece as the one ruler for use, one share for the layout, tolerances for noise only | §2.5, §2.6 |
| *"S17: the spirit is that at far or medium distance, a singularity at the surface does not impact the orbit of the piece - camera. Refine the rule if needed. At close in, this rule is overruled by collision rule, etc."* (here: contact range) | Restated in his words as P1. *(alignment, his comment 1, §0ter)* Contact range (§1.4) = where the piece can collide — inside the shell's offset (60 mm) in today's code; not the tilt's 0.6 – 0.65 m. The reviewer's "two boundaries" reading (the camera's frame beyond 0.6 m) is withdrawn. Today's departures (F17; the hold letting the real lip start the tilt from up to 0.6 m) are findings handed to the orbit's queue — Q1 | §0ter, §2.2 P1, §2.4 |
| *"S18: I don’t recall where the mouth hold comes from but it may be revisited if other rules apply"* | Its history: his *"build b"* of 2026-11-10 for the shake at the channel's mouth. It stays, the one labelled exception to P4, its domain restricted (Q4); a general crossing rule to replace it is the orbit's matter (P3 withdrawn, audit §5) | §2.4 |
| *"S20: do not propose ad hoc rule for each geometry, therefore check if this case is already covered by other rules and if you can remove this rule. Otherwise, keep it."* | Removed. Its premise was wrong: on `Scene_1` the edge at the bottom of the mouth is CONVEX (the side face's lip at the floor's level), not concave. The case is already covered by S10 and the mouth's hold as built (`face_map.ts:989-994`, `orbit_tilt.ts:290`); the hold's domain restricted (Q4) | §2.4 |
| *"S21: the slide is removed; an orbit at close in can seat a piece as well (here: contact range); “it is checked when the level is built, not discovered by the player”: I think we need to modify the workflow of the blender object building to check that when we build in blender (the proxy surface, the collision surface, the ghost surface). Propose something. Also, we shall amend the blender object building workflow to make sure that any surface built in blender is built with consideration of the playability of the game, therefore in consideration with the rules we are specifying here."* | Reworded (no slide: seated by the orbit in contact range, the approach or the plunge). The checks B1 – B6 run in Blender, painted on the meshes, re-verified at import; a PLAYABILITY BRIEF per part from the plan; a design-for-playability checklist traced to this document's rules | §7bis |
| *"S24: this should be taken care at the blender building stage and included in the workflow, however i don’t know how. Propose something."* | B5, the coverage report: per stage, every exposed face that is no place, painted with its reason, for him to accept or change | §7bis B5 |
| *"S25: i don’t know where it comes from. If it conflicts with other rules, this needs to be amended. It should be taken care by the blender workflow, not the scene build, and reverified during scene build."* | It came from the first review: every rule here assumes inside and outside are defined. As worded it conflicts with `PART_AUTHORING.md` (proxies are open by design; the finish pass opens render meshes). Restated on the union of a part's `UCX_` pieces, the proxy lying on it; checked in Blender (B1), re-verified at import | §7bis B1 |

---

## 0ter. THE OWNER'S COMMENTS ON P1 AND ON THE SCOPE (2026-11-16) AND WHAT WAS DONE

**Comment 1, on P1's sentence (2026-11-16, verbatim):** *"the transition between far and medium (piece and camera path function of the orbit's
angle) and close in (surface and collision govern) is not related to the 0.6 m - 0.65 m of the orbit <-> tilted orbit transition. The orbit <->
tilted orbit transition threshold is set at 0.6 m - 0.65 m for user's feeling to precisely control the piece close to the surface. surface and
collision govern when the piece can collide (during approach, during orbit). It is clear that at far and medium distance, the piece cannot
collide (except with parts which are not seated) nor shall surface aspects impact the orbit of the piece & camera."*
* **Done.** P1 is his sentence with HIS boundary: contact range (§1.4), where the piece can collide (during the approach, during the orbit) — in today's
  code inside the shell's offset; the tilt's 0.6 – 0.65 m is there for the feel of precise control, not P1's boundary; parts not seated are no
  surface, the collision handles them (§2.2 P1). "Two boundaries" withdrawn everywhere (§0, §0bis, §2.2, §2.4, Q1). Today's measured departures
  (F17; the mouth's lip from up to 0.6 m) are findings handed to the orbit's queue (Q1); F7 is an event at a seat, consistent with his sentence.
  What was out of line before each comment: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §6.2.

**Comment 2, on the scope (2026-11-16, verbatim):** *"in our pipeline, we have solved the problem of the impossible bijection between orbit and
assembly surface after we have experimented several unsuccessful attemps of what drives what (gizmo drives, orbit angle drives, etc.). Do not
reopen this point. The purpose of this orbit's surface specification is to define where the gizmo travels, not what governs the piece and camera
orbit (unless you specifically see that the gizmo travel shall impact the piece and camera orbit, for example during collision)."*
* **Done.** The scope stated once (§0, §1.3). The far-foot mechanism removed: F17, F7 and the mouth handed over as findings (§2.2 P1). P3 and P6
  withdrawn, their numbers kept, their text in [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §5, "notes handed to the orbit's documents". The
  contour and the atlas described as the orbit's layers, read by the gizmo (§5.1); the D5 closing handed over (§2.6); P4 worded as the settled
  design restated. In scope and kept: P2 (the gizmo's depth), P4, P5 (the collision — his *"for example during collision"*), S26 – S29, the
  Blender checks.

---

## 0quater. THE OWNER'S ANSWER TO §8 (2026-11-16, the fourth exchange) AND WHAT WAS DONE

**His answer (verbatim):** *"find another word for "close in" where the piece can collide, in order to distinguish properly from the close in of
the orbit - tilted orbit transition. update the specification accordingly. That settles Q1. Q5: a goal can have multiple entry directions: for
example a goal when a piece rests on a plane can be accessed from all the directions paralel to the plane, unless you call the plane the
"direction". A hole can be entered from both sides. Q10: the piece shall not drop. Remember that we are specifying the movement of the gizmo on the
surface, not the movement of the piece. the piece would enter the recess only following a A + dy approach. Remember that the goal is to mimick the
placement of parts by a kid in an assembly game: the kid would need to push the piece to enter a slot the piece fits in, the piece would not enter
by itself even if it fits in the slot. Other questions: I agree with the recommendations, although they shall be later tested and could be reversed
if the testing shows they need to be reversed."* — **and on Q5's summary** (*"a piece resting on a plane then gets every direction parallel to the
plane plus the set-down"*): *"there are infinite directions for the set down: any clear path towards the goal (=no collision in-between the piece
and the piece as seated in the goal) can be travelled by the piece from any orbit angle: this is not one set-down. I may have misinterpreted your
word, or you may be too restrictive."*
* **The word** → §1.4: CONTACT RANGE; "close in" kept for the tilted orbit's transition; P5 renamed; quotations unchanged.
* **Q5** → S28, §2.5, B4, the playability brief (§7bis.2), the two workflow documents, the study: a goal's ENTRY SET — one definition, computed.
* **Q10** → his reason in §1.2; P2 ⑤, P5, §2.1 S5, §2.3, §2.8, §5.2, the shapes companion aligned; today's drop recorded as a departure (§2.2 P5).
* **The others** → §8, accepted to be tested; §7bis written into `SCENE_WORKFLOW.md` and `PART_AUTHORING.md` (§7bis.5). The questions as they were
  asked, their options and arguments: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §7.

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
* **Every piece can be brought to its goal** — seated by the orbit in contact range (the goal capture runs during the orbit, `LEVEL_END.md`
  §5quater), by the approach, or by the plunge (specified, not built), along any clear path of its entry set (S28) — at every stage of the level;
  no face is out of reach without the author knowing it (S21, S24).
* ⭐ **The piece does not enter by itself — the player PUSHES it in** [DECIDED 2026-11-16, Q10]: *"Remember that the goal is to mimick the placement
  of parts by a kid in an assembly game: the kid would need to push the piece to enter a slot the piece fits in, the piece would not enter by itself
  even if it fits in the slot."* The gizmo shows the slot's depth; only the approach (A + dy) brings the piece down into it.

### 1.3 What it is NOT

* ⭐ **Not what governs the piece and the camera — the scope** (the owner, 2026-11-16, §0ter). This specification defines WHERE THE GIZMO
  TRAVELS: its place and its depth on the assembly. What governs the piece's and the camera's orbit — the finger → the orbit's angles → the gizmo
  → the piece and the camera; the shell; the charts; the tilted orbit; the calm — is SETTLED in the orbit's own documents and is not reopened
  here. The one place where the gizmo's travel acts on the piece and the camera is the collision (P5). The readers of §1.1 beyond the gizmo are
  listed for what they read of it; their rules are the orbit's.
* **Not the drawn mesh.** The assembly sways on the glass; everything is read in the model's coordinates ([OWNER] 2026-11-15, `ORBIT_CHARTS.md`
  §4.5: *"in the past we made sure to use the model coordinates, not the swayed assembly coordinates"*).
* **Not the collision shape.** Collision reads `UCX_` convex pieces or the hull at spawn (`core/collision.ts:59`); the surface reads the face
  proxy (`UFM_`) or the render faces (`model_bodies_wiring.ts:111-129`). P2 would read the collision pieces for the CONTACT and the proxy for the
  FACES (§2.2).
* **Not the shell.** The shell lies at `max(d, 60 mm)` round the placed parts' bounding BOX and carries the piece's and the camera's FOOT; within
  the 60 mm offset the foot comes down onto the gizmo (`orbit_shell.ts:7-11, 84-88`); the gizmo is on the real surface
  (`TILTED_ORBIT_REBUILD_SCOPE.md` §10).
* **Not a closest-point surface.** Nothing follows the nearest point of the surface each frame (the HoverCam family, US 8,044,953 — excluded).

### 1.4 Two words (the owner, 2026-11-16, §0quater)

*"find another word for "close in" where the piece can collide, in order to distinguish properly from the close in of the orbit - tilted orbit
transition."*
* **CONTACT RANGE** — where the piece can collide: during the approach, during the orbit (his comment 1, §0ter). "In contact range"; far and medium =
  "out of contact range". In today's code: inside the shell's offset (`orbitShellOffsetMm`, 60 mm), where the foot comes down onto the gizmo and the
  contact acts — a fact of the code, not a new constant.
* **CLOSE IN** — ONLY the orbit ↔ tilted orbit transition (in at 0.6 m, out at 0.65 m, `tiltAutoM`): *"for user's feeling to precisely control the
  piece close to the surface"*. Quotations keep their words; where one says "close in" for the collision, "(here: contact range)" follows it.

---

## 2. THE RULES AND THE PRINCIPLES

### 2.1 The owner's rules that stay as they are

| # | rule | source |
|---|---|---|
| **S1** | The surface is the parts' **real outer surface, simplified**: *"surfaces which support gizmo shall be as close to the real surfaces as possible while simplifying their geometries. Sanity check shall be done so there are no false gaps, discontinuities between faces, faces floating in the air, small unreachable faces"* | [OWNER] 2026-11-13, `PART_AUTHORING.md` §3 item 3 |
| **S2** | Only **placed** parts count, and only their **exposed** faces: a face pressed against another part's face is not a surface (R1) | built 2026-11-09 (R1, `POLAR_ORBIT_CLEANUP.md` §6); a rule of the code — generalised by S22 |
| **S3** | Everything is computed in the **model's coordinates** | [OWNER] 2026-11-15, `ORBIT_CHARTS.md` §4.5 |
| **S4** | The **bottom** is a face like the others: *"the bottom is a face to orbit as the others (remember that the floor can be crossed by the camera and is invisible from below)"* | [OWNER] 2026-11-04, `TILTED_ORBIT_REBUILD_SCOPE.md` §16.1 (D2) |
| **S5** | **The real depth**, and the piece does not dive by itself: *"Approach into an empty slot: the gizmo shall read the real depth under the gizmo, but the piece shall not go in (it shall continue its orbit). However, the A + dy shall be able to bring the piece inside the depth up to where it collides or where it meets the center of the orbit"* → *"center of the orbit = gizmo"* | [OWNER] 2026-11-04, §16.1 (D3); ⭐ [DECIDED 2026-11-16, Q10] at EVERY distance: *"the piece shall not drop"* — today's contact departs (§2.2 P5) |
| **S12** | The surface **changes as the game goes on**: *"it cannot be at boot: the assembly will change as the game progress"* | [OWNER] 2026-11-13, `POLAR_ZONES.md` header |
| **S13** | A part going INTO a hole rests on a **ghost at the mouth**, then a **plunge**: *"the ghost face shall always be a face aligned with the assembly face where the hole exits"*; ghosts are *"connected to real surfaces"* — the advice he asked is §2.5 | [OWNER] 2026-11-13, `PART_AUTHORING.md` §3 item 3 (ghost read by the game: NOT built; plunge: NOT built) |
| **S15** | No **local patch**: *"analyze the deep root cause, don't patch with fix which may conflict with other rules"*; and 2026-11-16: *"do not propose ad hoc rule for each geometry"* | [OWNER] 2026-11-15, `RND5.md`; 2026-11-16 (§0bis) |

### 2.2 The principles [DECIDED 2026-11-16 — P1, P2, P4, P5 accepted, to be tested]

Each: in plain words; its established name and reference; what it guarantees; where it stops and the fallback there; its patent note. They
were tested against the code and the record by three readers (literature, code, Blender, 2026-11-16); where a reader showed a principle wrong
as first written, it is amended here and the amendment is said. References in full: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §3.
*(alignment, §0ter)* P1 is a boundary condition, not a design; P3 and P6 are withdrawn (their numbers kept); P2, P4 and P5 are in scope.
*(decisions)* P1, P2, P4, P5 [DECIDED 2026-11-16] — accepted, to be tested (§8).

**P1 — A BOUNDARY CONDITION THIS SPECIFICATION MUST RESPECT, IN HIS WORDS (not a design of it).** *Out of contact range (far and medium), no singularity of the
surface under the gizmo changes the path of the piece and the camera: their path is a function of the orbit's angles, the placed parts' BOX (the
shell) and the CONTOUR (the layout) only; a part that grows the box or changes the contour changes it at the seat that places it (S19), never along
a travel. In contact range, the real surface and the collision govern and overrule.*
* **His boundary** (2026-11-16, comment 1, §0ter; named in §1.4). CONTACT RANGE: WHERE THE PIECE CAN COLLIDE — during the approach, during the
  orbit. In today's code that is inside the shell's offset (`orbitShellOffsetMm`, 60 mm, `gestureConfig.ts:867`): there the foot comes down onto
  the gizmo and the contact acts (`orbit_shell.ts:7-11, 84-99`; `footprint.ts`) — a fact of the code, not a new constant. It is NOT the 0.6 –
  0.65 m of the orbit ↔ tilted orbit transition (close in), which is there for the player's feel of precise control near the surface. Far and medium the piece
  can still collide with parts that are NOT seated: those are no surface (S2: placed parts only); the collision rule handles them.
* **What it asks of this specification.** The gizmo may follow the real surface (P2) because, far and medium, the piece's and the camera's path
  does not read its depth; how the shell and the camera read the gizmo is the orbit's settled design (§1.3), not reopened here.
* ⛔ **Withdrawn on his comments** (their text: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §5.1): the reviewer's "two boundaries" reading,
  which tied the camera's side of the rule to the 0.6 m (comment 1); and "the mechanism proposed", the shell fed the gizmo's point on its contour
  facet — how the shell reads the gizmo governs the piece and the camera (comment 2).
* **Findings handed to the orbit's queue — measured, nothing designed here.** **F17**: today, where the orbit's direction is oblique to the face
  (the calm, toward a face's edges), a depth step h under the gizmo shifts the far piece and the camera by h × tan θ (a 40 mm slot: 15 mm at 20°,
  40 mm at 45°; 684 of 1596 cells at 20°) — against his comment 1 and the rebuild's own aim 4 and I2: *"A step in the assembly's depth may move the
  GIZMO (a break), never the piece nor the camera"* (`TILTED_ORBIT_REBUILD_SCOPE.md` §1 item 4, §2 I2, approved 2026-11-04). **F7**: a part that
  grows the box moves the far path at its seat (612 of 760 protrusion cells, by the box's growth; L24, L48, L50 through the contour) — an event at
  a seat, consistent with his sentence. **The mouth**: today the gizmo's hold lets a real lip decide where the tilted orbit starts, at up to 0.6 m
  (`assembly_wiring.ts:1157, 1211-1215`, `orbit_tilt.ts:290`; `Scene_1`'s lip at 466 mm, the contour's edge at 498.5 mm) — a surface aspect acting
  at medium distance. [DECIDED 2026-11-16, Q1] F17 and the mouth RECORDED as defects for the orbit's queue; any remedy is the orbit's.

**P2 — THE LANDING IS A FIRST CONTACT.** *The gizmo's depth is where the held piece, moved along the face's normal, first touches the placed
parts.*
* **In scope: where the gizmo is.** It changes nothing in what drives the piece and the camera; where it speaks of them it only reports — far
  and medium the marker alone moves (the piece rides the shell), in contact range it is read from where the piece is, the collision deciding (P5).
* **Name.** The configuration-space obstacle of a translating piece (a Minkowski sum, Lozano-Pérez 1983); along one direction it is CAM's "drop
  cutter": drop the tool at a place until it touches; on a height field, a grey-scale dilation by the tool's own height function. Under it, a
  LAYERED depth per facet direction (dexels, layered depth images) holds overhangs and cavities. `footprint.ts` already cites the same idea for
  the support: the movement surface *"from the whole area of overlap, not a single contact point"* (Oh, Stuerzlinger, GI 2005).
* **What it replaces.** Today two implementations answer nearly this question and disagree: (a) the gizmo's `stackDepthAt` + `voidOpening` /
  `pieceEnters` — a POINT, the opening measured on the facet's plane only, the piece as its two smallest sizes either way round, at every
  distance, protrusions climbed whatever their width (`face_map.ts:980-1065`, `assembly_wiring.ts:922-933`); (b) the footprint support — the
  piece's real outline as held, each part a convex body, only within 60 mm, never a step up (a WALL) (`footprint.ts:25-65`). In contact range they part
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
  moves only the marker (P1); in contact range the collision decides (P5). ⑤ *A tall part beside the gizmo — where the first contact is read FROM*: out of
  contact range from outside the parts (from the shell), so the marker climbs half a piece before a proud part. In contact range FROM WHERE THE
  PIECE IS (a guarded move from its pose, as the drop cutter descends from the tool's own height): a part whose top stands above the piece's bottom
  is BESIDE it — a WALL that stops the piece, the gizmo and the camera (the owner's Q1 (b), *"Proceed"*, `CLOSE_IN_CONTACT.md` §1, §5 – §6;
  `footprint.ts`: *"never a step up onto it"*) — P5. ⭐ *(decisions, Q10)* The GIZMO's depth still reads the floor of a slot the held piece fits
  (D3, at every distance); the PIECE keeps its level across it — it does not drop — until A + dy pushes it in (§1.2). *(study, F9)* Read from the
  piece, P2's level equals today's footprint support in 1398 of 1596 cells: there the gizmo's depth and the support's level agree on what is under
  the piece; under Q10 that says nothing of what the piece does over a slot (it no longer follows the support down). ⛔ A first contact read from
  outside at every distance would lift a piece in contact with `Piece44` (41 mm proud) onto its top half a piece before the edge — a step up he refused.
* **What it changes on the glass, against S5** (*"the gizmo shall read the real depth under the gizmo"*). Over wide voids (the floor) and
  narrow ones (the rims' plane, as S8 already does): the same. Within half a piece of every wall and rim the depth changes there, not at the
  wall: off `Piece44` (41 mm proud) the gizmo stays up ~20 mm past its edge — as the piece already does; the channel's floor is a landing only
  in its central band (130 − 41.3 ≈ 89 mm for the green piece); a notch's floor only where the piece fits beside the riser; the goal slot
  beside `Piece44` (6.75 mm gap) shows `Piece44`'s top unless the piece is turned to clear it — out of contact range only: in contact range (⑤)
  the proud part stays a wall, and the piece keeps its level past it (Q10). Cost: one height map per facet
  direction at a pick-up and a turn (≈ 10 – 20 directions; a sample step of 4 mm — ≈ 128² over the 0.5 m assembly —, one constant in
  `units.ts`; ⭐ measured 2026-11-17 by S1: 36 – 270 ms a direction on `Scene_1` on this PC by its load, ±x / ±y over the 50 ms line in every run — [ORBIT_SURFACE_LANDING_MAP.md](ORBIT_SURFACE_LANDING_MAP.md) §10.4); each frame a lookup; the 24-query budget untouched. ⚠ A turn happens MID-GESTURE: rebuilding 10 – 20 maps in one
  frame may hitch on an iPhone — build them for the piece's orientations at the pick-up, or spread the rebuild over frames (the old map kept
  meanwhile); to be measured before it drives anything.
* ⚠ **It reverses an owner's decision — [DECIDED 2026-11-16, Q2]: he accepted it, first as a readout beside today's depth, then driving.** On
  branch `1.0.105-` (2026-11-07, `TILTED_ORBIT_REBUILD_SCOPE.md` §29 as kept on `1.0.107-Close-in-atlas`, decision 2): *"gizmo is a point, not the
  piece's footprint"*. Since then he took the piece as the ruler for voids (*"Build"*, *"Yes"*, `POLAR_ORBIT_CLEANUP.md` §7, §8.3) and for the
  support (*"Proceed"*, `CLOSE_IN_CONTACT.md` §5 – §6). It resembles §18-C1 (2026-11-05, never built: the boxes inflated by the piece,
  sphere-traced) — the difference: no sphere tracing, no rounded layer, the exact piece, a lookup per frame.
* **Patent.** Drop cutter, Z-maps, Minkowski sums: textbook. ⚠ Patents claim dexel-based machining simulation and collision detection
  (US 9,117,300; US 10,140,395) — scopes NOT checked; keep the representation a plain per-direction depth list.
* **Confirmed by the study** (F1 – F4, F11, F15): never into a part nor unmarked over nothing, and invariant to order and to a turn — BY
  CONSTRUCTION (its level is the highest top under the footprint; it holds no state): the evidence is today's column — 1102 of 1596 cells mark
  a place where the piece cannot rest; each step moved half a piece out (median 21 mm), not removed; exact on slopes (L30: today 38.7 mm in; L31:
  bridged 54.9 mm above).

**P3 — withdrawn (2026-11-16, his comment 2).** It was "each real face in the frame that faces it": a crossing at a real edge, the camera's
frame turning there — what governs the camera, the orbit's matter. Its text, with §2.4's three place-functions for the mouth: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md)
§5.2 – §5.3, "notes handed to the orbit's documents". What stays here is the gizmo's side of the mouth: his S10 and the gizmo's hold as built
(`mouthHold`, `orbit_tilt.ts:290`), its domain restricted (the study's F5; §2.4, Q4 accepted).

**P4 — A FUNCTION OF THE PLACE (the settled design, restated — not an alternative under discussion).** *The gizmo's target is a function of
the orbit's angles and the held piece only, never of the path.*
* **Name.** A memoryless atlas map; its usual alternative, hysteresis, is path-dependent by design. It RESTATES the face map's principle since
  2026-11-04 — the gizmo a function of the orbit's angles (`TILTED_ORBIT_REBUILD_SCOPE.md` §15's title), derived, not carried (§16.2, A7) —
  written to answer the owner's request: *"propose another way to construct the gizmo so it truly reflects the dy and dx inputs"*
  (`DOUBLE_ORBIT_PROTOTYPE.md`, Step 4c-bis).
* **Guarantees** reversibility: the same angles give the same gizmo, so a back-and-forth is impossible by construction.
* **Amended.** The first version said the mouth's hold is the one exception. The code reader found more state: the gizmo read at the piece's
  SOLVED angles (`assembly_wiring.ts:1184` — the owner's Q1 (b): the gizmo stops with a blocked piece), the map's catch-up hold
  (`MAP_SYNC_HOLD_M`), the depth glide in time, the maps per tilt and per zone, the support level eased per face. P4 separates them: the
  TARGET (where the gizmo should be) is a function of the place; the SHOWN gizmo may lag in time (an ease, a glide) and the solved angles are
  the place in contact range (P5). The mouth's hold is the one rule that changes the TARGET by the path — labelled in §2.3. *(study, F15)* Under P2 no
  place depends on the way in (by construction: no state); today's code breaks P4 only by the hold (F5) and the plane's first-face level (F6, S27).
* **Patent.** Not checked (a memoryless map is textbook).

**P5 — IN CONTACT RANGE, BLOCKED, NOT JUMPED.** *A step the piece in contact cannot pass blocks the orbit by collision, and is passed by going out and back in.*
* **In scope, by his own words** (comment 2, §0ter): *"unless you specifically see that the gizmo travel shall impact the piece and camera
  orbit, for example during collision"* — in contact range the gizmo's place and the piece's contact are one question.
* **Name.** The god-object / proxy of haptic rendering (Zilles, Salisbury 1995; Ruspini et al. 1997): a proxy kept outside the surface, which
  slides and cannot pass a step it touches; backing off is a fine-motion strategy (Lozano-Pérez, Mason, Taylor 1984).
* **Already built.** The owner's Q1 (b) (the piece, the gizmo and the camera stop at a wall), R4 (a jump whose landing is refused is a WALL),
  the ring's hold, *"backing out frees it"* (`CLOSE_IN_CONTACT.md` §10.4); S9's second half and S14 are this one principle.
* ⭐ **The piece does not drop [DECIDED 2026-11-16, Q10].** In contact range the orbit never lowers the piece: over a slot it fits (or off a
  step down — there the test is that the gizmo reaches both sides, §2.8) it keeps its level; only A + dy lowers it, up to the contact or the
  gizmo (D3). *(study, F8, rerun)* In a contact model (the piece at
  contact, no solver slide), kept at its level: drops 0 (367 cells today); travels ending at a wall 728 of 1596 (849 today) — 532 at a proud part,
  his Q1 (b) (40 mm 228, 6 mm 228, 1 mm 76: Q6), 196 that begin where a void opens on the facet's edge, the piece already at its floor; the traps
  after a drop gone (L03's reach 54 % → 100 %).
* ⛔ **TODAY'S CODE DEPARTS — measured by reading (`1.0.146-Orbit-charts` at `9f101a4`, nothing run), a finding HANDED TO THE CONTACT'S QUEUE,
  nothing designed here.** In contact range the support is the highest placed part under the piece's whole footprint within the shell's offset
  (`assembly_wiring.ts:746`); over a slot the piece fits that is the slot's floor part, and the level's target is its top (`:753`); the drop is
  taken wherever the solver's gap says the piece fits (`:768-784`, *"A DROP ONLY WHERE THE PIECE FITS"*), eased (`footprint.ts:77-84`, τ 40 ms),
  and the foot follows it (`assembly_wiring.ts:685-687`; within the offset the foot is on the gizmo, `orbit_shell.ts:84-99`) — the piece goes down
  into the slot by the orbit alone. `CLOSE_IN_CONTACT.md` §10.3 records it as built: *"the piece crosses wall to wall and runs the channel's length
  on its floor"*.
* **What would change.** The depth glide also acts inside 60 mm today, where the solver decides anyway: in contact range it would stop gliding.
* **Where it stops.** A step that blocks the only way to a goal is a level-design fact: B4 (§7bis) finds it, not the player.
* **Patent.** The 1995 – 1997 papers are expired art; later refinements not checked.

**P6 — withdrawn (2026-11-16, his comment 2).** It was "the layout's own singular points" (polar zones, cone singularities): a rule of the
atlas, the orbit's matter. Its text: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §5.4. S11 stays as a pointer to the orbit's charts (the
fans, `orbit_charts.ts:396-447`).

### 2.3 The ad hoc rules → what replaces them → what changes on the glass

Each earlier rule keeps its number. Marks: **consequence** of a principle (named) · **kept** (what was looked for) · **replaced** by a better
proposal · **removed**. No rule that exists for one geometry stays without that label and its reason.

| # | the earlier rule | mark | what replaces it | what changes on the glass |
|---|---|---|---|---|
| **S6** | [OWNER] holes closed at the contour, *"for the moment"* | consequence — P2 | a hole narrower than the piece closed by its rims; one it fits: its floor; through and wider: "nothing to land on", the plane, marked | through holes: as today, now marked; a blind hole narrower than the piece: as today (S8) *(study: L01, L02, L04, Q01)* |
| **S7** | [OWNER] a closed void with no floor bridged, with a floor its real depth | consequence — P2 | the same outcomes from one operation; the asymmetry WS5 (the piece-fit test only with a floor) disappears | none on `Scene_1`'s known voids |
| **S8** | built: a void the piece cannot enter is surface | consequence — P2, improved | the piece's real `UCX_` outline as held, not its two smallest sizes; read at every level, not only at the plane (C31) | the steps move half a piece inward (§2.2 P2) — *(study, F3)* and the piece as held: B 80 × 80 no longer judged 40 × 80 |
| **S9** | [OWNER] a protrusion: the frontmost part under the point; a close-in block normal (here: contact range) | consequence — first half P2 (frontmost under the FOOTPRINT), second half P5 | — | far and medium: the marker climbs half a piece before a proud part and comes down half a piece after it; in contact range: none (read from the piece: a wall, as today) |
| **S10** | [OWNER] the tilt at the edge at the bottom of the mouth | kept as his rule; here only its gizmo's side: the hold as built, *(study, F5)* its domain restricted → Q4; the tilt and the crossing are the orbit's (P3 withdrawn) | — | none for the red; the hold no longer fires on a cap |
| **S11** | [OWNER] small faces converging go polar | kept — a pointer to the orbit's charts (P6 withdrawn: the layout's matter) | the charts' fans (topology), as built | none (built) |
| **S14** | [OWNER] a jump's singularity excluded in contact range, reached by going out and back in | consequence — P5 | blocked by collision, not by a region bound (the close-in atlas he wrote it for was superseded) | none (built) |
| **S16** | [PROPOSED] a ruler per question | replaced — §2.6 | the piece for use (P2), one share for the layout, tolerances for noise | none by itself |
| **S17** | [PROPOSED] the layer ball-like, holes closed | replaced — P1, a boundary condition in his words (§2.2, §0ter) | far / medium: no surface singularity moves piece or camera; in contact range: the collision | none designed here; today's departures (F17, the mouth) recorded for the orbit's queue (Q1) |
| **S18** | [PROPOSED] a function of the place, the hold the one exception | replaced — P4 as amended | target vs shown gizmo separated; the mouth's hold the one target exception, labelled, its domain restricted (Q4) | none on `Scene_1`'s channel |
| **S20** | [PROPOSED] a mouth's concave edge a crossing | **removed** — wrong premise (the edge is convex); the case is covered today by S10 + the mouth's hold (`face_map.ts:989-994`, `orbit_tilt.ts:290`), its domain restricted (Q4) | — | — |
| **S23** | [PROPOSED] the same ruler for what is missing and what stands out | consequence — P2 (by construction) | — | pins and ribs: the marker on their top where the piece touches them first |

### 2.4 S17, S18, S20 — the three the owner singled out

**S17 restated, in his words of 2026-11-16** — P1 [DECIDED, Q1]: *"at far or medium distance, a singularity at the surface does not impact the
orbit of the piece - camera … At close in, this rule is overruled by collision rule, etc."* (here: contact range)
* **Contact range in millimetres today.** Three distances stand in the code (none was named for the surface): **60 mm** — the shell's offset
  (`orbitShellOffsetMm`, `gestureConfig.ts:867`): only inside it does the gizmo's depth reach the piece (`orbit_shell.ts:84-99`), and the footprint
  support acts only there (`footprint.ts`, its window); **0.3 m** — the look moves onto the foot (`assemblyLockDistM`, `:866`); **0.6 m** — the
  automatic tilt and the full gain (`tiltAutoM`, `orbitGainFullM`, `:883, :887`; off beyond 0.65 m).
* **His boundary** (comment 1, §0ter; §1.4): contact range = where the piece can collide — in today's code inside the shell's 60 mm. The 0.3 m
  and 0.6 m are the orbit's camera rules (close in: the tilt's 0.6 – 0.65 m for the feel of precise control), not P1's boundary. *(alignment)* The reviewer's
  reading — the tilt's 0.6 m as a second boundary for the camera's frame — is withdrawn on his comment. The mouth, where the hold lets the real
  lip start the tilt from up to 0.6 m, is a finding recorded for the orbit's queue (§2.2 P1, Q1); so is one check not made: whether the camera's frame
  (`free_face.ts`) reads the contour's facet or the real face under the gizmo far out.

**S18 — where the mouth's hold comes from.** His *"build b"* of 2026-11-10 (`POLAR_ORBIT_CLEANUP.md` §9.10), for the shake at `Scene_1`'s channel
mouth: `mouthHold` (`orbit_tilt.ts:290`) holds the gizmo at the floor's edge on a dy toward the open end, a dx releases it. Its history and roots,
and his *"shall not wait"* of 2026-11-07: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §6.3.

**What stays here: the gizmo's side.** The hold as built, its domain restricted to where it hands over to the automatic tilt — never on a cap
(now); over a void P2 leaves open for the held piece (when the landing map exists) — [DECIDED 2026-11-16, Q4], to be tested. Whether a general crossing rule should replace it
(the former P3's three place-functions for the mouth) is the orbit's matter: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §5.3.

**S20 — removed.** It said the mouth's edge is concave (from `TILTED_POLE_CLOSE_IN.md` O11: *"a level floor meeting a wall that rises from
it"*). On `Scene_1` the edge at the bottom of the mouth is the side face's lip against the channel's floor going back: CONVEX. An ordinary
convex crossing at a real edge. It is covered today by S10 and the hold as built (`face_map.ts:989-994`, `orbit_tilt.ts:290`); a general
replacement is the orbit's (audit §5.3). Nothing is left for S20. The other concave edges (the notches, the steps) stay as he ruled
(P2 + P5).

### 2.5 S13 and S28 — a goal's ENTRY SET, the ghost, the plunge [DECIDED 2026-11-16, Q5 with his amendment — to be tested]

His words (§0quater): *"a goal can have multiple entry directions … A hole can be entered from both sides."* — and *"any clear path towards the
goal (=no collision in-between the piece and the piece as seated in the goal) can be travelled by the piece from any orbit angle: this is not one
set-down."*

**The definition — one, for every goal.** An ENTRY is any clear path to the goal: from wherever the orbit has brought the piece, the move to its
seated pose is allowed when nothing placed lies between the piece and the piece as seated. Read backwards (assembly by disassembly): **the ENTRY SET
of a goal at a stage is the set of directions along which the part, withdrawn from its seated pose, touches no placed part** — a REGION of the
sphere of directions, usually a continuum, never one direction nor a short list. In assembly planning it is the part's set of free (removal)
directions at that stage, the sphere partitioned by the non-directional blocking graph (Wilson, Latombe 1994; Halperin, Latombe, Wilson 2000 — the
exact term there not verified).
* **Computed, not stated.** The check samples the sphere at a named step (`ENTRY_SPHERE_N`: 642 directions, ≈ 9° apart, in the study) PLUS the
  placed parts' and the part's face normals — a tight slot's set is a single direction each way, of zero measure, which a sampling alone misses.
  By default the author states nothing; the playability brief may NARROW the set (how the level means the part to be placed) and MARKS a goal whose
  set is small (a bore, a keyed slot): those are the goals a level can make unreachable.
* **Reachable** at a stage when the set is not empty AND at least one of its directions starts at a place the gizmo reaches (B4 with B3). B4
  reports each set's size (its share of the sphere, its narrowest opening); a small set is a warning for his look, an empty one a failure.
* **What the one definition gives** *(study, rerun 2026-11-16, ORBIT_SURFACE_SHAPES.md §3.3)* — outcomes, not rules: a piece resting on an open
  plane: every direction on the plane's free side, from parallel to it up to its normal — about half the sphere (the lid on the tray, L19: 50 %);
  between two walls: the directions the walls leave (L05's block in a channel open at its end and on top: 0.8 % of the samples, and +y, +z exactly); a
  hole open at both ends: its axis in both senses, a narrow region each side; a blind hole: its axis from the open side (L03: 0 % of the samples,
  +y alone — zero measure); a goal shut in (Q07, under a slab): EMPTY — unreachable at that stage, found by B4, never by the player.
* **How it is played.** Where the set is wide, the gizmo's landing (P2), the approach (A + dy) and the goal capture place the piece from any orbit
  angle inside it: no ghost. A direction whose first contact is the seat itself is a landing (L19 along +y: 120 = its seat); any other is a guarded
  move ENDED by the goal capture (the goal margins, `LEVEL_END.md` §5quater) — alone it would stop at first contact, past the seat (L05 along +z:
  −100 against 120). Where the set is narrow (a hole), the PRE-INSERTION POSE — the ghost — is computed per axis and sense: the part withdrawn along
  it until it first clears the placed set; a drawn ghost is CHECKED against it (B4); the plunge starts when the piece rests on the ghost inside the
  capture region (the goal margins lifted to that pose) — an event, never a place rule (P4). His rule stands where a ghost is used: it lies in the
  plane where the hole exits. The alternatives weighed for S13: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §7.2.

### 2.6 S16 — the rulers: the alternatives (the advice asked)

Today six rulers stand for "small" (§3.3). Four alternatives were weighed (a ruler per question; the piece + one layout share + noise
tolerances; persistence; CAD defeaturing — the table: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §7.2).
**[DECIDED 2026-11-16, Q6 — accepted, to be tested]: (2), with (3) offline** in the Blender checks (B6: a feature whose closing radius is near the piece's size, or a
facet near the share, is painted as "at a threshold" for the owner). **D5's quarter share** is the layout's one ruler — the orbit's, read
here, not specified here. *(alignment)* A finding handed over (WS21): D5 reads the main group's region, so a porous face (a comb, studs) could
lose its facet — not reproduced by the study (L38, L39, Q08); the closing first suggested for it is in the audit companion §5.5. The camera's reach is not a ruler of the surface (close in, the camera reaches
anything; I17 closed *"not applicable"*). `MAP_GROW_M` (1.6 mm, `Scene_1`'s 3 mm joints) joins the noise family with the coplanar 0.5 mm, in
`units.ts`. *(study, F6, F10)* The noise family decides NOISE only: S26 (one depth tolerance, no unnamed step) and S27 (tolerances join, never
erase) are its two rules (§2.7); the study found today's tolerance erasing a real cap (76 cells) and 1 mm steps jumping with no event (238).

### 2.7 The other rules — accepted with §8 (Q7 – Q9), to be tested

| # | rule | status |
|---|---|---|
| S19 | **Rebuilt at two kinds of event**: (i) the placed set changes — the exposed faces and their classes; (ii) the orbit's frame changes (an automatic tilt, a polar-zone switch) — the classification the same in every frame (the layout's rebuild itself is the orbit's) | ACCEPTED (Q9, D-S4) (former D-S4); today (ii) re-runs the whole `buildFaceMap` per tilt and per zone, unchecked (WS14). Under P2 add (iii): the held piece is picked or turned — its landing maps |
| S21 | **Every goal is reachable**: at every stage, each piece still to place is seated from a place of the surface — by the orbit in contact range (the goal capture), the approach or the plunge, along its entry set (S28) — checked when the level is BUILT (in Blender, B4), re-verified at import | ACCEPTED (Q7, B4) — the purpose behind S1's *"no … small unreachable faces"*; reworded (the slide is removed) |
| S22 | **"Exposed" means reachable from outside**, on the parts taken together (their union): a face glued, buried in another part, or sealed in a cavity is not surface | ACCEPTED (Q8) — S2 generalised; computed in Blender (B2) |
| S24 | **Nothing unreachable silently**: per scene and stage, the exposed faces that are no place, each with its reason | ACCEPTED (Q7) — the Blender coverage report (B5) |
| S25 | **Each part's collision pieces are closed convex solids, and its proxy lies on their union, facing out** (restated, §7bis B1) | ACCEPTED (Q8) — from the first review; checked in Blender, re-verified at import |
| S26 | **No unnamed depth step**: one depth tolerance (the noise family's "flush", 0.5 mm today) splits every depth change — under it the same face, at or above it the named depth event (glided out of contact range, P5 in contact range); the glide's own 5 mm goes | ACCEPTED (Q6) *(study, F10: 238 cells, up to 3 mm; L43)* — not built |
| S27 | **Tolerances join, never erase**: (a) the planes found independently of order — the faces' OWN levels clustered as connected components at the tolerance (single linkage; a greedy join against a running mean still depends on order), each plane at its component's area-weighted mean; (b) a face, or part of one, is removed only where another part's material covers it (S22), never by pairing with an opposite face on either side; (c) a part thinner than, or two parts overlapping by less than, the noise tolerance are refused at authoring (B1, C48) — out of the surface's reach otherwise | ACCEPTED (Q6) *(study, F6: 76 cells lose the top cap — the far foot up to 256.5 mm, the facet 90°; 32 a false mouth; F15: L42's order 0.3 mm)* — today's code breaks (a) and (b) |
| S28 | **A goal's ENTRY SET, computed** (§2.5): any clear path to the seated pose, from any orbit angle — the directions along which the part, withdrawn from its goal, touches no placed part; the author may narrow it and marks a small one; a direction whose first contact is the seat is a landing, any other a guarded move ENDED by the goal capture; a ghost (the pre-insertion pose, per axis and sense) only where the set is narrow | [DECIDED 2026-11-16, Q5 with his amendment — to be tested] *(study: L19 50 %, L05 0.8 % + two axes, L03 one axis, Q07 empty)* |
| S29 | **An empty placed set is out of the surface's reach**: every level boots with a placed part (W1 states it, B4 checks it); with none (only `lockPlacedPieces` 0, a debug setting) the gizmo holds, as today; one part smaller than the piece: P2 ① | ACCEPTED (Q9) *(study, F16: L51, L52)* — built in effect (every scene boots with one) |

### 2.8 The tensions that remain

| between | the tension | answer |
|---|---|---|
| S1 *real* vs P2 *closed by the piece* | a void the piece cannot use is not shown as a void | the owner's own order (S8): real where the piece can use it |
| S5 *the real depth under the gizmo* vs P2 | far and medium the depth changes half a piece from each wall, not at it | [DECIDED, Q2] the price accepted; it reverses his decision 2 of 2026-11-07 |
| P1 vs today's shell along a travel *(study, F17)* | an oblique direction lets a depth step shift the far piece and camera (h × tan θ) | [DECIDED, Q1] a defect recorded for the orbit's queue; nothing designed here |
| P1 vs today's hold at the mouth | the hold lets the real lip start the tilt from up to 0.6 m | the same (Q1) |
| P2 ① *nothing to land on* vs the landing rule | over a wide through hole the gizmo is in the air, marked | stated; the plunge (S13) is the way in |
| S10 / the hold vs P4 | the target depends on the path at one place | labelled; its domain restricted [DECIDED, Q4] |
| S12 / S19 (ii) vs one classification | the frame's maps may keep other facets (WS14) | a vector across frames, S19 (ii) |
| S12 vs determinism | the surface at a seat must not depend on the order of play | a function of the placed set (`placedKey`); a vector across orders |
| P2 ② vs a turn of the piece | an oblong piece fits a slot one way only: the map changes at a turn | [DECIDED, Q2]: the map of the piece as held |
| S21 vs OS3 | a goal inside a cavity or under an overhang is no place of a height field | the approach, the plunge, a ghost (S13); B4 says which goals need one; S28 |
| S5 vs today's contact *(study, F8)* | in contact range today's contact drops the piece into every slot it fits (367 cells), then a dx is trapped at the far wall | [DECIDED, Q10] *"the piece shall not drop"*: D3 at every distance; today's drop a departure handed to the contact's queue (§2.2 P5) |
| Q10 vs a step down *(decisions)* | kept at its level off a ledge as over a slot, the piece's gap to the gizmo grows by the step (beyond the shell's 60 mm it leaves contact range) | ⭐ **[DECIDED 2026-11-16, his rule]**: *"A step down under "no drop": what matters is that the gizmo can reach both sides of the ledge (likely one side from one direction from one face and the other side from the other direction from the other face), not that the piece goes out or not of contact range."* — at a ledge the test is THE GIZMO'S TRAVEL (§1.3): it reaches BOTH SIDES — the upper side from the face it belongs to, the lower side from the face that faces it (likely from the other direction); whether the piece leaves contact range is not the test. No rule for one geometry: the catalogue's classes cover it (C3 the step, C12 the tread — a place of the facet that faces it, D-S7), and the coverage check B5 verifies that both sides are places |
| the hold vs its purpose *(study, F5)* | it fires on the cap, along island gaps, in a V (32 cells, up to 479 mm — in the study's emulation, a dy as a travel along the facet's b); not at a channel closed far behind (L07) | [DECIDED, Q4] its domain restricted |

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
| **C1** | convex faces, edges, corners | flat faces meeting outward | G (angles); T for the sum at corners | everywhere | facets within 20° (`MAP_AXIS_DEG`, `face_map.ts:30`), D5 ¼ share, charts | the polygon (D5) → **the orbit's contour (read)** |
| **C2** | non-rectangular faces | triangles, pentagons, a heptagon's ends, a fan's triangles | G | `Scene_0`, `Scene_0bis`, the 35 test shapes | F1: placed on the polygon (`ORBIT_ANY_SHAPE.md` §2) | — → **the charts (F1)** |
| **C3** | **concave edges and corners** — a step, an L, a wall rising from a floor | the surface folds inward | G for the angle; T for "the contour is no longer convex" | Scene_1's notches, the channel walls, the anchor and frusta meeting their hosts | folded INTO the stack: a depth step, not an edge; no turn, no event (`free_face.ts:240`: *"a concave edge … is the study before step B's"*); `Scene_1`'s notches kept so by the owner (*"Stays as it is"*, `POLAR_ORBIT_CLEANUP.md` §6 (a)) | — → **P2 + P5** |
| **C4** | **through holes, tunnels** (genus > 0) | a hole you could pass a string through | **T** | none placed today; `Scene_2`'s bores into the hollow case | closed on the facet's plane (`stackDepthAt`, `face_map.ts:991`) | none: closed whatever its size → **P2** |
| **C5** | **channels** — a groove open at one or both ends | a long void, a floor, two walls | G (width) + T (open ends) | `Scene_1`'s five boot slots (480 mm long), the top's black channel (130 × 32 mm) | the floor followed if the piece fits (S7, S8); the ends seen from the front are mouths (C7) | the piece's footprint → **P2 (+ the hold at an open end)** |
| **C6** | **blind holes, pockets, slots**, a goal slot waiting | a void with a floor, closed on all sides | G (enterable) + T (a boundary) | `Scene_1` before placing; `Scene_2`'s bores before the plunge; `void_sim` | real depth if the piece fits, else bridged (`face_map.ts:999`) | the piece's footprint (`heldFoot`, 0.5 mm) → **P2; S13 where authored** |
| **C7** | **mouths** — ⚠ two meanings in the record | (a) **code**: a void closed across but open up the facet toward its edge — the top channel seen from the front; (b) **cavity**: an opening narrower than the room behind it — a bore into a hollow case | (a) T (path); (b) G/T | (a) Scene_1's channel ends; (b) `Scene_2` only, `void_sim`'s undercut | (a) bridged + `mouthHold` + the automatic tilt (`orbit_tilt.ts:290`); (b) measured by its opening at the plane (`voidOpening`, `face_map.ts:1021`) | (b) the piece, at the mouth → **(a) S10, the hold restricted (Q4); (b) P2 + S13** |
| **C8** | **grooves, narrow gaps between parts** | a crack between two parts | G | the 3 mm core joints, the bottom groove (x 103.5 – 116.5, i.e. 13 mm, in `POLAR_ORBIT_CLEANUP.md` §7; called "10 mm" in its §8.3 — not reconciled), the 47 – 50 mm notch, the 90 mm rebate | joints < 3.2 mm closed by growth (`MAP_GROW_M` 1.6 mm, `face_map.ts:34`); wider: the void rules | **two rulers**: `MAP_GROW_M` (a Scene_1 constant) and the piece → **P2; joints: the noise family** |
| **C9** | **islands** — placed parts not touching | the surface in several pieces | **T** | none placed today | one contour over all; a closed gap with no floor bridged whatever its width; non-coplanar → the nearest group's plane, `inside: false`, no cast (`face_map.ts:1003-1010`) — the gizmo hangs in air | none → **P2 (nothing to land on)** |
| **C10** | **overhangs, undercuts** | a part sticking out above another, its underside facing down | G (depth, angle); T-like for a height field (two surfaces on one ray) | Piece44 (upside down on the top), Piece45 (front), `Scene_2`'s cases | nothing specific: the cast hits the overhang first; its underside only from the bottom cap; the support's convex hull fills the space under it (`footprint.ts:25`) | — → **OS3: the facet facing it** |
| **C11** | **protrusions** — a boss, a pin, a part standing proud | a part in front of the facet's plane | G | Piece42, Piece43, `Scene_0`'s anchor, the tips of `Scene_0bis`; **each piece once placed** | the gizmo on the frontmost group (`face_map.ts:1003`); a jump of 41 – 49 mm onto and off it, glided | nothing: any height climbed → **P2 + P5** |
| **C12** | **faces parallel to the cast** — a tread between two risers, the side of a proud part | zero width seen along the facet's normal | **T for a height field** | Scene_1's step treads (I10), every protrusion's sides | never a place (I10 open; F8 *"walk the step"* not ported) | — → **OS3: a place of the facet that faces it** *(study: L12, L13 covered 100 % from the top)* |
| **C13** | **thin plates, fins, blades** | thinner than the piece or the shell | G | Scene_1's 10 mm slabs (edges only), `Scene_2`'s 2.8 mm flanges | nothing: a fin vanishes in the shell's box; step B worse on a blade (`ORBIT_CHARTS.md` §5.3) | not stated → **P2** |
| **C14** | **small faces, chamfers, slivers** | a face too small to work on | G | frusta's sides, `Scene_2`'s 1.4 mm bevels | D5 ¼ share; a chamfer beyond 20° kept as its own thin facet; authoring flags ≈ 7 mm | **six rulers** in the record (§3.3) → **D5 after the closing (§2.6)** |
| **C15** | **curved runs** — cylinders, discs, bores, tori | many small faces round a curve | G (facet count vs 20°); T if closed round | `Scene_2` only; the barrel test shape | quantised into facets of ≥ 20°; authoring answers with flat proxies (`PART_AUTHORING.md` §1) | the merge angle → **authored proxies** |
| **C16** | **fans and apexes** | faces converging on one point | G (size) + T (the apex's angle defect) | `Scene_0bis`'s tips, test shapes | the charts' FAN kind; polar (S11) | the polar zone's size → **the orbit's charts (fans)** |
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
| ¼ of its own polygon (D5, `facetMinShare`) | facets | the orbit's layout ruler, read here (WS21 handed over, §2.6) |
| ≈ 7 mm "too narrow to stand on" | authoring check ⑤ (reference units: per scene) | → B6 paints what P2 closes for each piece; the 7 mm goes |
| 0.22 × the placed box's smallest side (T3) | polar zones, `chartLayout 0` only | → goes with the legacy zones (step 2.5); the charts' fans need none |
| the finger: a 37 mm face is 0.34 mm of finger far out (I17) | the reach on the glass | not a ruler of the surface (close in, the camera reaches anything) |
| `MAP_GROW_M` 1.6 mm; the coplanar 0.5 mm; the glide's 5 mm | joints; flush faces; depth steps | → ONE noise family in `units.ts`, with a named depth for "flush" (former D-S18); the glide's 5 mm goes (S26) |
| the piece AS IT IS TURNED; a spacing (arrays) | a keyed slot (C44); studs, fins (C34) | → answered by P2 itself (§8 Q2 for the turn) |

---

## 4. THE OBSTACLES

Each: why it is fundamental (plain words first, then the mathematics), where it can be overcome, where it cannot and the fallback — which
principle answers it.

| # | obstacle | why fundamental | can be overcome where / how | cannot where → fallback |
|---|---|---|---|---|
| **OS1** | **The turn budget** — the orbit's cross (green, red) cannot be carried round a closed shape without turning | carry a small cross round a corner without turning it and it comes back turned by the corner's *angle defect* (2π minus its face angles); over a closed ball-like surface they sum to 720° (Gauss–Bonnet), and any direction field has singular points whose indices sum to 2 (Poincaré–Hopf, the hairy-ball theorem) | on flat faces (none of it lives there): the turn is paid on edges and at chosen points — the charts do this (`ORBIT_CHARTS.md` §1) | at the poles and fans → **the polar zone**. ⭐ The surface's singularities ADD to it: a notch's inner corner (+90°), a saddle where a re-entrant edge meets a top (−90°) — each a place the charts must pay for, unseen today because the contour is convex (and `Scene_1`'s notches left so by the owner, D-S12) |
| **OS2** | **Holes through** (genus) | a hole through changes the count: 720° becomes 720° × (1 − g), and — given the two poles gravity imposes — each handle forces saddle-type singularities a columns chart cannot hold. A smooth orbit over a ball cannot map one-to-one onto a ring-shaped surface | the layout (the orbit's contour) never contains a hole; the depth: P2 — narrower than the piece, closed by its rims | wider than the piece → **nothing to land on**, marked; the way through or in is the approach or the plunge (S5, S13) |
| **OS3** | **A height field cannot see everything** | a depth read along one direction is one number per place: it cannot hold the underside of an overhang (two surfaces on one ray), gives zero width to a face parallel to the ray (the tread), and steps at every wall (`TILTED_ORBIT_REBUILD_SCOPE.md` §31.4: occlusion, topology, sharp edges — *"no bijection possible"*) | where the faces are front-facing along their facet's normal: everything on the boxes' outer faces | an overhang's underside → reached from the facet that faces it (the bottom cap) or not at all; a tread → **a stated choice** (D-S7): unreachable, or its own facet; a wall's step → the **glide**, named as the one depth event |
| **OS4** | **Jumps at depth steps** | the height field is discontinuous at every wall and protrusion: landing (the real depth) and continuity cannot both hold there; P2 moves the step outward by half a piece, it does not remove it | far and medium: the step moves only the gizmo's marker, glided (P1) — ⚠ today, along an oblique direction, the far piece too (F17, recorded for the orbit's queue) | in contact range: the collision blocks the piece and the gizmo with it (P5) — the glide not used there; the step passed by going out and back in (S14) |
| **OS5** | **"Small" has no single size** | the piece, the polygon, the finger and the scene's joints measure different things; the finger's ruler changes with distance, so no model-mm threshold makes a face reachable at every distance | §3.3's three questions, each with its ruler, each one constant | the finger's reach far out → **close in** (the camera), never the surface |
| **OS6** | **The surface depends on the held piece, on time and on the frame** | S8 makes the depth a function of the piece; S12 makes the faces a function of the placed set; the tilted pole and the polar zones rebuild the layout in their own frame mid-orbit; continuity across a pick-up or a seat cannot be promised | rebuild the faces and their classes only when the placed set changes (S19 (i)), where the gizmo is relocated anyway; in a new frame rebuild only the layout, the classification held the same (S19 (ii)) | a seat that changes the face under the gizmo → **a relocation event**, stated once (the gizmo to the nearest place on the new surface), never a jump mid-gesture |
| **OS7** | **Sharp edges have no normal** (step B) | a polyhedron's normal jumps at every edge; "the shape with its edges rounded" needs a radius, and a face smaller than the radius disappears into its edges | a rounding radius tied to the ruler (S16) | fins and blades thinner than the radius (C13): the normal flips side → step B's own fallback (`ORBIT_CHARTS.md` §5.3: worse on a blade) |
| **OS8** | **Numbers that are almost equal** | coplanar within 0.5 mm, joints of 3 mm, a clip at 1e-9 that dropped a whole facet (R2): floating-point and modelling tolerance decide topology | one family of tolerances, each a named constant with its unit; tests on shapes AT the tolerance | none if every tolerance is explicit; the record's six coplanar angles (§7 WS8) are the risk; *(study, F6)* a layer under the tolerance erased a real cap → S27 |
| **OS9** | **Path dependence at a mouth** | at a void open toward an edge the same angles can mean the floor's edge (the red) or the bridge (the green): two travels, one point | the gizmo's hold at the real lip (convex on `Scene_1`), its domain restricted (Q4) | the hold, labelled (S18 / P4); a general crossing rule is the orbit's (audit §5.3) |
| **OS10** | **Curved parts** | a curve made of many small flat faces either merges into slivers or splits into many tiny facets | authored flat proxies (`PART_AUTHORING.md` §1, §3); or a planar segmentation (VSA, §6) | a fan round an apex → **polar** (S11) |
| **OS11** | **Islands** | a convex contour spans the gap between two islands; the depth under it is empty | P2: a gap narrower than the piece, closed by its rims | a wider gap with nothing under it → **nothing to land on**, on the contour plane, marked — today it hangs at the nearest plane instead (WS4) |
| **OS12** | **Several geometries for one part** | the proxy, the collision pieces, the convex support and the render faces are authored or computed apart | a build-time check that they agree within a tolerance | none if the check exists; today it does not (WS2) |
| **OS13** | **The convex contour is an assumption** *(review)* | the layout stands on a convex envelope of big flat facets: a fair picture only while the assembly fills most of it; on an L, a U, a tray, a ring the facets are mostly void and the inward faces face no facet | while each void is a feature IN a facet: P2 | beyond it → **a stated limit** (a measure per level and stage, Q9); inner faces by the approach or the plunge, checked by B4; lobes (convex decomposition) a new design, not proposed |
| **OS14** | **The gizmo is a point, the piece is a body** *(review)* | where a POINT may stand and where a BODY fits differ by the body's half-width along every wall, rim and protrusion (configuration space) | P2: the gizmo's depth IS the body's first contact; its place stays the orbit's point | in contact range beside a wall: P5 (the collision); the piece's orientation: Q2 |
| **OS15** | **The classes form a continuum** *(review)* | a pocket widens into a rebate, a rebate into a step, a step into another face; holes multiply into a grille; a boss thins into a pin | P2 needs no class for use: the piece decides; only the layout's share and the noise tolerances remain thresholds (§2.6) | a feature AT a threshold → **flagged at authoring** by its margin (B6, persistence §2.6 (3)) |
| **OS16** | **Some goals are not places** *(review)* | the layout is ball-like and OS3 hides what no facet faces; a level may ask for a piece inside a cavity, under an overhang, down a bore | the orbit in contact range (the goal capture), the approach (A + dy), the plunge from a ghost where the entry set is narrow (S13, S28) | a goal none of these reaches → **the level's plan changes** (W1) — found in Blender by B4 (S21), never by the player |

---

## 5. WHAT TO SPECIFY FOR THE REBUILD

### 5.1 The layers

[ACCEPTED by the owner 2026-11-17 — to be tested] Six layers, each a pure function in `src/core` or `src/input`, in model coordinates, deterministic (ties broken by a stated key,
never by array order). L0 – L1 depend neither on the orbit's frame nor on the held piece; L3 – L4 are built in the frame from L1 alone; L2
depends on the held piece (P2) and takes L3's facet directions — so the order is L1 → L3 → L2, with no loop. *(alignment)* **L3 and L4 are the
ORBIT's layers** (the contour, the atlas): described here only as what the gizmo's travel reads, not specified here (§1.3).

| layer | input | output | invariants | thresholds (unit, home) | rebuilt when |
|---|---|---|---|---|---|
| **L0 — the parts as authored** | render mesh, `UFM_` proxy, `UCX_` pieces, ghosts, the goal's entry direction | per part: route faces, collision pieces, ghosts, entry | the Blender checks B1 passed, re-verified at import (§7bis) | the fit tolerance (authoring) | at import |
| **L1 — the exposed faces** | the placed set; L0 on its model poses | the faces reachable from outside (S22): polygons from the TRIANGLES, normals, parts | a glued, buried or sealed face never present; every point in one face | the noise family (`units.ts`) | at a seat, a put-down, an undo |
| **L2 — the landing maps** (P2) | L1's collision pieces + L3's facet directions + the held piece's `UCX_` outline as held | per facet direction: a LAYERED depth (each ray's entries and exits), and the first-contact depth of the piece over it | one operation for voids and protrusions; "nothing to land on" a stated value | none for use — the piece; the grid's step (4 mm, `units.ts`) | at a pick-up, a turn of the piece, a seat, a frame change |
| **L3 — the contour** (the orbit's) | L1 (never L2) | the convex facets: polygons, normals, edges, corners; caps | the same facets in every frame up to its turn (S19 (ii)) | the merge angle (20°), the share (¼) | at a seat; in the frame at a tilt or a zone switch |
| **L4 — the atlas** (the orbit's) | L3 | charts, poles, fans, frames | `ORBIT_CHARTS.md` §1; the turn budget (OS1) | as there | as L3 |
| **L5 — per frame** | the angles, L3 – L4, L2 at the place | the gizmo's target and shown point, its face, the depth, the events | the target a function of the angles and the piece (P4); within the 24-query budget (L2 is a lookup) | — | every frame |

Under L2, per facet direction, the depth is a short list per sample — the surfaces a ray meets — not one number: an overhang's underside, a
cavity's floor and a tunnel's two mouths are then present and the rules can name them (OS3 is not removed: a translation along one direction
still reaches only the first). Where a scene's parts are boxes, frusta and prisms (written as data), their collision pieces are the hulls at spawn.

### 5.2 The table SINGULARITY → PRINCIPLE → EVENT

[PROPOSED] "Nothing to land on" = no contact along the facet's direction: the gizmo on the facet's plane, marked. "Approached" = reached by
A + dy or a plunge. "⏳ open" = no principle answers it yet.

| class | answered by | what it gives | event at its border |
|---|---|---|---|
| C1 convex faces, edges, corners; C2 non-rectangular | the orbit's contour and charts (F1) — read, not specified here | facets | a crossing, its turn (the orbit's) |
| C3 concave edge (a notch, a step) | P2 + P5 (the owner's notches as ruled) | a depth step, half a piece out | out of contact range: the marker glides; in contact range: blocked |
| C4 through hole; C9 island gap | P2 | narrower than the piece: closed; wider: nothing to land on | none (the plane continues) |
| C5 channel; C6 blind hole; C8 groove | P2 | the gizmo on its floor where the piece fits, else closed; the piece in contact keeps its level over it (Q10) | as C3 |
| C6 hole with a narrow entry set | S13 + S28 (§2.5) | the ghost at the mouth (computed per axis and sense), then the plunge | the plunge, an event |
| C7(a) mouth; C49 a void whose far end decides *(study)* | S10 kept; the hold within its domain (§2.4, Q4) | the hold today | the tilt at the lip |
| C7(b) cavity behind a narrow opening; C30 bent tunnel | P2 at the opening; behind it approached (S13) | — | — |
| C10 overhang; C29 arch, legs | OS3: P2's first layer from the facet that faces it | the underside only from the bottom cap | — |
| C11 protrusion; C13 fin; C33 pin, rib, plateau | P2 (+ P5 in contact range) | the top where the piece first touches it | as C3 |
| C12 tread between risers | OS3: the facet that faces it *(study: L12, L13)* | a place of the top, not of the side's travel; a ledge's two sides each reached from its own face [DECIDED, §2.8] | a crossing |
| C14 small face; C37 shallow edge | the orbit's merge and D5's share (read; §2.6) | part of its neighbours | none |
| C15 curve; C38 doubly curved | authored flat proxies (B); else not supported, said | — | crossings between its facets |
| C16 fan | the orbit's charts (S11; P6 withdrawn) | a polar zone (the charts' fans) | the zone's entry |
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
| C40 strongly non-convex | measured by B5's coverage, warned *(study: L48 43 %, L50 32 %)*; lobes not designed | — | the far path moves with the contour, at a seat (F7, P1) |
| C41 a singularity on a singularity | its parts, for the landing *(study: Q01, Q05, Q08)*; a mouth at a pole: Q4 (Q02); ⏳ the layout's events at a pole, not studied | — | one event, never two |
| C42 empty or nearly empty | S29 *(study: L51, L52)* | out of reach: a placed part at boot; round one small part P2 ① | — |
| C44 the piece turned | P2 ② (§8 Q2) *(study: L53)* | the map of the piece as held | a depth change at the turn |
| C45 goal entries | S13 + B4 + S28 *(study: L05, Q07)* | each goal's entry SET computed (B4), narrowed by the author where wanted; a direction whose first contact is the seat a landing, any other a guarded move | the entry, an event |
| C47 defective input | S25 (B1) | refused at the build | — |
| a frame change (tilt, polar zone) | S19 (ii) | L3 – L4 in the frame; classes unchanged | the tilt's or the zone's transition |

### 5.3 The vectors and the test shapes that would prove it

* **The shapes exist** *(study)*: the library L01 – L53, the pairs Q01 – Q10 and the 1596-cell sweep of §3.0's grid
  ([ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) §2), with today's reading and P2's — each becomes a vector of `tests/helpers/` shapes (the
  chart helpers are all convex, `tests/helpers/chart_shapes.ts:2`), P2's offline reading the brute-force second implementation. Still to add:
  `void_sim`'s families, a round hole in one face (C19), a 12-sided cylinder and a dome (C15, C38), fans and apexes (C16), the floor (C20), ties
  (C21), long flat shapes (C22), defective input (C47), a narrowing profile in the sweep, facets other than the top and the front, tilted frames and
  zone switches (the surface's classes across them, S19 (ii)), the relocation at a seat (C46); for the orbit's queue, the far bump through
  `mapTarget`'s angles with the calm (F17: the study tilts `u` by a fixed 20° / 45°).
* **Per shape, for two pieces** (41 × 45 and 80 × 80 mm): L2's landing depth against a brute-force drop of the piece's `UCX_` (the second
  implementation that falsifies the first); the L5 gizmo on a 1 mm sweep — no jump outside a named event; the same after the shape is moved
  and turned; the same for every order of placing its parts; the same classes in every frame (S19 (ii)).
* **The scenes**: `Scene_1`'s replay (grooves, channel, the mouth's hold restricted), `Scene_0`, `Scene_0bis` unchanged where their features
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

**Build first [DECIDED 2026-11-16 with Q2, Q4, Q7 — to be tested]:** (1) L2, the landing map (P2), as one pure function, its vectors against a brute-force drop, wired
first as a READOUT beside today's depth on `Scene_1` (so the owner sees the difference before it drives anything) — the study's P reading is
its second implementation; (2) the mouth's hold restricted (Q4); (3) the Blender checks B1, B2, B4 (§7bis); then (4) L2 driving the gizmo, the footprint support re-expressed on it with its wall kept
(a replay of `Scene_1` in contact range against `Piece44`: unchanged). The drop removed (Q10) is the contact's queue's, not this list's. *(alignment)* The far-foot step first listed here (the shell fed the contour point)
is withdrawn: F17 and the mouth are defects recorded for the orbit's queue, F7 an event at a seat (§2.2 P1, Q1).

---

## 7. THE AUDIT OF WHAT IS BUILT

The 25 weaknesses (WS1 – WS25), the patches standing beside a rule, and the errata of this study's first version are in
[ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md); each, by what answers it (P2, §2.6, S22 / B2, B1 / B6, B4 / B5, P4, S19), and the ones still
open (WS1, WS6, WS7, WS11, WS15 – WS17): its §8.1 (moved there 2026-11-16, the fifth exchange).

---

## 7bis. THE BLENDER WORKFLOW — THE AMENDMENTS (S21, S24, S25, S28) [DECIDED 2026-11-16, Q7 — to be tested]

The owner: *"we shall amend the blender object building workflow to make sure that any surface built in blender is built with
consideration of the playability of the game, therefore in consideration with the rules we are specifying here."* Accepted with Q7 (§8) and
now WRITTEN into `SCENE_WORKFLOW.md` and `PART_AUTHORING.md` (§7bis.5); the Blender scripts and the game-side checks are SPECIFIED, NOT BUILT.

### 7bis.1 The workflow as it stood — moved: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §7.3 (its gaps, read before the amendments)

### 7bis.2 The PLAYABILITY BRIEF a part carries from the plan (W1 → exported as `extras`)

Per part, written at W1, ONE home, exported so that both Blender and the game read the same facts: its **stage** (`after`: the parts placed
before it — the partial order, each placement its own stage); its **entry set** (S28, §2.5) — by default NOTHING (it is computed); the author
may NARROW it (`entry_narrow`: the directions the level means) and MARKS a goal whose set is small (`entry_small`: a bore, a keyed slot), the
ghost's `plunge_axis` then checked against the computed pose per axis and sense; its **seat pairs** (`mates_with` on each `MC_` marker); the **held piece's faces
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
| **B4 goal reachable** (S21, S28) | per part at its stage: its ENTRY SET — the sphere of directions sampled at a named step plus the parts' face normals, the part withdrawn from its goal along each until it CLEARS the placed set (not a fixed 0.8); the set's share of the sphere and its narrowest opening; at least one direction starting at a landing of B3; where the set is narrow, the pre-insertion pose per axis and sense and the drawn ghost at it | `BVHTree.overlap` of the part's `UCX_` against the placed set's, stepped then bisected (the way-in sweep extended to many directions); the ghost compared within the fit tolerance | red: EMPTY, or no direction starts at a place (the blocking parts named); amber: a SMALL set (a warning for his look), the ghost off the computed pose | not empty and reached; a small set warns, never fails | the same sweep with the game's GJK over the `UCX_` pairs, in a vector at W4 / W5; seat pairs re-checked from `mates_with` | W1 (on the reference's numbers, as rule 2), W3, W5 |
| **B5 coverage** (S24) | per stage, every exposed face (B2) that is no place, with its reason: parallel to the cast, under an overhang, closed for the piece (B3), inside a cavity, below the share | from B2 and B3 (⏳ the reason "closed for the piece" pending until L2 exists) | each face by its reason; a text list | none — the owner accepts each class or changes the part | the list in the level's data; a vector that it does not grow unseen | W3 before the export: the owner's proxy review (§4.3 item 3) gets these colours |
| **B6 conformance** | features near a threshold: a facet's elevation within 15° of 45°, two route faces within 30°, a feature whose closing radius is near the piece's size (§2.6 (3)), a facet near the share | the thresholds READ from the game's files (never retyped — as the lights are); numpy on the proxy's faces | amber: at a threshold, with its margin | no route or seat face at a threshold without a written acceptance | the same thresholds in the game: the vector reads one constant | W2 (sheet), W3 |

### 7bis.4 The DESIGN-FOR-PLAYABILITY checklist (for whoever draws a part; each line traced to a rule here)

1. A wide entry set where the play allows; a narrow one (a bore, a keyed slot) only where the level means it, marked in the brief; along the host
   face's normal and from above where it can be (S21, S28, B4; design for assembly).
2. A lead-in: a chamfer or a ghost at the mouth, so the plunge starts from a capture region (S13, §2.5).
3. Every face a later part rests on is wider than that part's footprint, or a ghost bridges it (P2, B3).
4. No route or seat face within 15° of 45° of elevation; faces to be told apart ≥ 30° apart (B6).
5. No gap, groove or step at a threshold: clearly narrower than the noise tolerance, or clearly wider than the piece (§2.6).
6. Collision pieces convex, closed, few; the proxy on them, facing out (S25, B1).
7. Round parts as flat proxies; no doubly curved place (C15, C38).
8. Symmetric, or obviously not: a look-alike turn declared in the catalogue (`SCENE_WORKFLOW.md` §2.3 rule 7).
9. Nothing placed inside what is already closed; no step that needs a turn mid-path (B4).
10. Each exposed face is a place, or listed with its reason (S24, B5).

### 7bis.5 Where it hooks — DONE (2026-11-16, Q7: written, to be tested; the scripts and the game's checks NOT built)

* [`SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §7 (new): the playability brief at W1, B1 – B6 at W3's gate, the re-verification
  at W4 / W5; pointers at §1, §2.3 rules 2 and 4 (B4, B2: "exposed" = reachable from outside), §4 (B6: the thresholds bind the route and seat faces).
* [`PART_AUTHORING.md`](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) §6 (new): the checks' table, the entry set and the ghost, the checklist; pointers at
  §1 (exposed = reachable from outside, S22), §3 item 3 (the ghost at the depth already superseded; the ghost computed where the entry set is
  narrow), §4.2 (B1 under "not yet in the report"), §4.3 item 3 (the review gets B3 – B6's colours and pass rules).
* The game: a `src/core` checker beside `readModelCatalog` (B1's subset at load; the rest in vectors on each scene's `.glb`) — not built. What it
  costs per scene (estimates): [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §8.2.

---

## 8. THE OWNER'S DECISIONS OF 2026-11-16

His answer is quoted whole in §0quater. For every recommendation he agreed with, his own condition: *"I agree with the recommendations, although
they shall be later tested and could be reversed if the testing shows they need to be reversed."* — so **ACCEPTED** below means **ACCEPTED — to be
tested; may be reversed if the testing shows it**. The questions as they were asked, the options not taken and their arguments, and the first
round's decisions each answered: [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §7.

| # | the question | his decision | status |
|---|---|---|---|
| **Q1** | (1) P1 with his boundary; (2) today's two measured departures from it — recorded or accepted? | (1) settled by the new word (§1.4): P1's boundary is CONTACT RANGE, where the piece can collide (during the approach, during the orbit) — not the 0.6 – 0.65 m; parts not seated are no surface (S2), the collision handles them. (2) the recommendation (a): F17 (an oblique direction shifts the far piece and camera by a depth step × tan θ) and the mouth (a real lip starts the tilted orbit from up to 0.6 m) RECORDED as defects for the orbit's queue — nothing designed here, any remedy the orbit's; F7 an event at a seat | (1) **DECIDED**; (2) **ACCEPTED** |
| **Q2** | P2: the gizmo's depth = the first contact of the held piece AS HELD (its map rebuilt at a turn; Q3 merged)? | (a): yes — first as a READOUT beside today's depth, then driving; it reverses his decision 2 of 2026-11-07 (`1.0.105-`: *"gizmo is a point, not the piece's footprint"*); in contact range a proud part stays a wall | **ACCEPTED** |
| **Q3** | → merged into Q2 | — | — |
| **Q4** | The mouth's hold (the gizmo's side of S10) restricted? | (a): never on a cap — now; over a void P2 leaves open for the held piece — once the landing map exists | **ACCEPTED** |
| **Q5** | How does a piece enter its goal (S13, S28)? | (a) with HIS AMENDMENT and clarification: a goal has an ENTRY SET — every clear path to the seated pose from any orbit angle, the directions along which the part withdrawn from its goal touches no placed part; computed, narrowed by the author where wanted; the ghost computed per axis and sense only where the set is narrow, a drawn one checked (§2.5) | **ACCEPTED WITH HIS AMENDMENT** |
| **Q6** | The rulers (S16)? | (a): the piece (P2) + one noise family in `units.ts` with S26 and S27; persistence offline only; a step ≥ 0.5 mm a wall in contact range; (c) a climb height only when a level's parts need it, chosen on the device | **ACCEPTED** |
| **Q7** | The Blender workflow (§7bis)? | (a): the playability brief; B1, B2, B4 first; B3, B5 once L2 exists; failing the run, painted, re-verified at import; the checklist — written (§7bis.5) | **ACCEPTED** |
| **Q8** | S25 on the `UCX_` union with the proxy on it; S22 (exposed = reachable from outside)? | (a) | **ACCEPTED** |
| **Q9** | The first round's open points? | (a), all as recommended: D-S4 (a) the rebuild events; D-S7 a tread a place of the facet that faces it; D-S9 (a) render faces for box scenes, proxies where authored; D-S11 (a) the first build on `Scene_0`, `0bis`, `1` and the study's shapes; D-S20 (a) a strongly non-convex assembly measured by B5 and warned; S29 | **ACCEPTED** |
| **Q10** | In contact range, crossing a slot it fits — does the piece drop in? | **(b), in his words: *"the piece shall not drop"*** — D3 stands at every distance: the gizmo reads the depth; the piece enters a recess only by A + dy. The recommendation (a) (today's drop) is NOT taken; today's code departs (§2.2 P5) | **DECIDED** |

**TO ASK THE OWNER AGAIN when the surface work starts** (✅ ASKED 2026-11-17: 1, 2 and the layers of 3 answered — *"Agree on all three."* → [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §2) — on the first, his words (2026-11-16): *"Not sure I understand the question. Capture the
question in the md file and ask again when we work on the orbit surface later on."*
1. **A goal's way in: is "a free direction exists" enough, or must the player be able to get there?** Check B4 answers *"can this part slide into its seat along at least one direction without touching a placed part?"* Not yet *"can the player bring the piece to where that slide starts?"* Example: a seat open only from under an overhang — the slide upward is free, but the gizmo may never reach a place under the overhang (no face there is a place of the orbit). Accept a level only when, for every goal, a free direction starts at a place the gizmo reaches (needs the landing map B3 and the coverage B5 first; §2.5 already writes it so) — or is the first test enough for now? ✅ **2026-11-17: the first test is enough for now; the second once the landing map exists.**
2. **The entry-set check was run on boxes only** (the study's shapes): run it on the real parts' collision pieces (`UCX_`, `Scene_2`) before the first surface build? ✅ **2026-11-17: yes — package S0.**
3. Still [PROPOSED], his word owed: §3.0 the catalogue derived from a grid of questions; §5.1 the six layers L0 – L5; §5.2 "nothing to land on" (the gizmo on the facet's plane, marked) and "approached". ✅ **2026-11-17: the six layers ACCEPTED, to be tested; the catalogue's grid and §5.2's two words still owed.**
4. Still ⏳ open (§5.2): C22 very long flat shapes; a piece wider than its facet (C24); C38 free-form; the layout's events at a pole (C41).

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
* The code read, and the sources outside this tree (`1.0.107-Close-in-atlas`): [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md) §8.3.
