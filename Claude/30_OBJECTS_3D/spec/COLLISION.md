# COLLISION — bodies must not penetrate each other (`3D6`, `D116`)

> **STATUS** · ⛔ specified 2026-09-27, **NOT BUILT** — the FIRST row of the build program
> ([`../../00_CORE/queue_notes/PLAYABILITY_2026-09-27.md`](../../00_CORE/queue_notes/PLAYABILITY_2026-09-27.md))
> **OWNS** · non-penetration: the shapes, the broad phase, the narrow phase, and what a blocked
> translation, rotation, snap and seat do
> **READ IF** · you are about to move a body, change a shape, or import one

> *"The main one i can think of is collision detection and forbid the objects to penetrate each
> others."* · *"collision during rotation: … i do not want to switch rotation axis if there is a
> collision because quaternion are not commutable and the user cannot go back"* · *"Kinematic stop
> and slide: ok for translation, not ok for rotation"* — the owner, 2026-09-27

## 1. What exists, and what is missing

✅ Every body carries a **convex hull computed at spawn** from its mesh vertices
(`src/core/collision_shape.ts`, `SceneObject.shape`), and `proximity.surfaceGap` is the **GJK
distance** between two hulls (`0` when they touch or overlap). Both are vectored, including GJK's
deep branches (`D49`).
⛔ Their only readers are the white capture contour and the sway. **Nothing in the move path asks
whether a body may go somewhere** — a part passes through another, and through the frozen plate.

## 2. ⭐⭐⭐ MODULAR BY CONSTRUCTION — two sources that WILL be replaced

The owner, 2026-09-27: *"for the moment, continue to implement [the hull at spawn and the GJK
gap]. Make sure it is modular, and can be later replaced by the collision shapes authored in
Blender"* · *"Cheap bounding box: OK. Implementation shall be modular so i can replace later it
with blender authored bounding box (same principle as for collision shapes)."*

| seam | interface (engine-free, `src/core`) | TODAY | LATER (`3D8`, `3D9`) |
|---|---|---|---|
| **shape source** | `CollisionShapeSource.partsOf(id) → ConvexPart[] \| null` — a body is a **LIST of convex parts**, local frame | ONE part: the hull of the mesh vertices at spawn (`shapeFromVertices`) | the `UCX_<mesh>_NN` convex pieces exported with the mesh from Blender — several per body, so a hole, a slot or an L-shape is representable |
| **bounds source** | `BoundsSource.boundsOf(id) → Aabb` — local frame, transformed per query | derived from the shape's points at spawn | a bounding box authored in Blender (a named empty or a `UBX_` box), exported with the `.glb` |
| **narrow phase** | `gapBetweenParts(a[], b[]) → number` — the min GJK gap over part pairs | GJK over the one-part lists | unchanged — it already takes lists |
| **broad phase** | `candidatePairs(moving, others, boundsOf) → id[]` — world AABB overlap, inflated by the step | O(n) AABB test per moving body | unchanged — only its source changes |

⛔⛔ **THE RULES READ ONLY THE INTERFACES**, never `SceneObject.shape` or a mesh directly: the day
the Blender source lands, it is ONE new implementation and ONE line at the composition root
(`scene.ts`), and every vector of §3–§6 must pass unchanged. ⭐ The list-of-parts shape is taken
NOW, with a list of one, precisely so that change is not a signature change.
⚠ A concave body with today's source is its **hull**: a hole is filled, so insertion cannot work
until `3D8`. Stated, and accepted by the owner as the interim.

## 3. TRANSLATION — kinematic STOP and SLIDE (✅ the owner: *"ok for translation"*)

Every translation already goes through ONE writer (`applyWorldStep`), so the rule sits there.

1. **Stop.** For a step `d`, find the largest `t ∈ [0, 1]` such that the moved body's gap to every
   candidate stays `≥ −ε` (conservative advancement on the GJK gap: bisect `t`).
2. **Slide.** The unused part `(1 − t)·d` is projected onto the contact plane (the separating
   direction from the GJK witness points) and applied once more under the same stop test — so a
   body pressed against the plate glides along it instead of sticking.
3. **The excess is DISCARDED**, never stored: reversing the finger moves the body back at once.
4. **One pass per frame.** No iteration to a fixed point, no pushing: a blocked body stops; the
   other body never moves. ⛔ Physics pushing (Havok) was rejected — it would fight the
   model-authoritative architecture and make the solver's optimum ill-defined.
5. The **frozen plate** blocks exactly like any body.

## 4. ⭐⭐⭐ ROTATION — CLAMP ON THE SAME AXIS, NEVER SLIDE, NEVER SWITCH AXIS

⛔ The owner's constraint: a blocked rotation must not turn the body about a DIFFERENT axis —
quaternions do not commute, and a hand cannot retrace a turn the product invented.

1. **One frame's rotation is one quaternion `Δ`, and it has ONE axis** — whatever the gesture
   composed (yaw + pitch of a diagonal drag, a roll, an aligned body's twist about its normal).
2. **Clamp along that same axis**: apply `Δᵗ` (slerp from identity toward `Δ`) with the largest
   `t ∈ [0, 1]` that keeps every gap `≥ −ε`. ⭐ `Δᵗ` has **the same axis as `Δ`** by construction,
   so a clamp shortens the turn, it never bends it. No slide.
3. **The excess is DISCARDED.** Reversing the finger turns the body back at once, about the axis
   it is now given.
4. **A body in contact may turn AWAY**: a step is refused only if it makes the penetration worse
   than `−ε`, so a part resting on the plate is never locked.
5. **Rotation increments** (`D73`): an increment is all-or-nothing — if the next detent does not
   fit, the body holds on the current one.
6. ⚠⚠ **THE HONEST LIMIT**: clamping DROPS part of the input, so bringing the finger back to where
   it started returns the body step by step but **not necessarily to its starting pose** — the
   dropped pieces were about different axes. ⭐ The exact way back is the **undo** (`D111`), which
   restores the pose from before the gesture.
7. ⛔ **Owner to confirm**: *clamp* (turn until contact) vs *refuse the whole frame step* (stop up
   to one step short of contact, never partial). Both keep the axis; clamp touches, refuse is
   simpler. **Recommended: clamp.**

## 5. ⭐⭐ ALIGNED, SNAPPING, SEATED — three states, three collision rules

⭐ The words, as the code uses them (`D100`): **aligned** = a FACE_ALIGN constraint, the body is
otherwise free; **snapping** = the ~60 ms magnet lerp (`seatSnaps`) that starts when the snap
condition is met; **seated** = the lerp has LANDED — the Follower is a CHILD of its Pioneer
(`attach`) and `links.isSeated` is true. *Snapped* = *seated*; *snapping* is the transition.

| state | vs its own Pioneer | vs every other body | why |
|---|---|---|---|
| **aligned** (not snapped) | ⭐ **collides** like any body — translation stops at the Pioneer's face and SLIDES along it | collides | ⭐ the slide is what makes the snap reachable: gliding along the PioneerFace brings the FollowerFace centre to the cursor, and the snap fires |
| **snapping** (the lerp in flight) | **exempt** — the two faces are MEANT to meet at gap 0 | if the lerp's next step would penetrate a third body, the snap is **cancelled**: the Follower stays where it is and the couple is held off until it leaves the radius (`SnapArming`, re-arm on exit) | a snap must never push through a neighbour |
| **seated** | **exempt**, the whole assembly among itself — a hull cannot represent the fit (`3D8` revisits this) | the **assembly is ONE compound**: a translation of any member moves the root (`D102`) and is tested as the union of the members' parts; a seated member's own **twist** about its face normal is tested against every body OUTSIDE its assembly, clamped on that axis (§4) | the seat is a rigid relationship; its members cannot collide with each other by definition |
| **just unsnapped** | exempt until the couple's gap exceeds `ε` once, then ordinary | ordinary | it starts at gap 0 — a strict test would call the release a penetration |

⚠ A **Pioneer that is turned** carries its seated followers (the tree) — the compound is tested
as in the seated row; its **unseated** followers let go (`D106`) and are ordinary bodies.

## 6. Feedback, broad phase, costs

* **A blocked body must SAY so**, or a stop reads as a bug: a brief contact flash on the touching
  faces, a short `navigator.vibrate` on Android, a sound (`GM9`). ⭐ And a HUD line: *blocked by
  `<id>`* and the clamp fraction.
* **Broad phase first** (§2): the world AABBs, inflated by the step, filter the pairs; GJK runs
  only on candidates. ⭐ 3 bodies need none; 20 do.
* **The sway is render-only** (a follower offset on the drawn mesh): it can make meshes APPEAR to
  touch without the model penetrating. ⚠ Accepted; the model is the truth.
* `ε` is a **length on the glass** converted by the camera's tracking factor (rule 3), with a
  slider — like every threshold here.

## 7. What would falsify it (the vectors to write FIRST, each shown RED against today)

1. A part driven into the plate stops at gap `0 ± ε` and slides along it.
2. A diagonal drag into a corner: the stopped part's travel is the projection, never a jump.
3. A rotation step into contact: the applied turn has **the same axis** as the asked one
   (`angle(axis(Δᵗ), axis(Δ)) = 0`), and `t < 1`.
4. Reversing a clamped rotation's input turns the body back at once.
5. A snapping lerp aimed through a third body is cancelled, not completed.
6. A seated assembly moved into a body stops as a whole; its members never test each other.
7. Swapping the shape source for a two-part stub changes no rule vector (the seam is real).
8. A body without a shape (`⛔NOSHAPE`) is never moved into — it blocks as its bounds, never as
   nothing.
