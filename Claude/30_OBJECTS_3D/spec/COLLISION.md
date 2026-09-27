# COLLISION — bodies must not penetrate each other (`3D6`, `D116`)

> **STATUS** · ✅ **BUILT 2026-09-27**, ⛔ **unjudged by a hand** (§8 lists what differs from this spec) — the FIRST row of the build program
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
5. **Rotation increments** (`D73`): ⚠ AS BUILT, the increment's approach is clamped like any turn,
   so a blocked detent stops at contact BETWEEN two detents. The all-or-nothing reading proposed
   here is not built (§8).
6. ⚠⚠ **THE HONEST LIMIT**: clamping DROPS part of the input, so bringing the finger back to where
   it started returns the body step by step but **not necessarily to its starting pose** — the
   dropped pieces were about different axes. ⭐ The exact way back is the **undo** (`D111`), which
   restores the pose from before the gesture.
7. ✅ **CLAMP — the owner, 2026-09-27** (*"clamp"*), over refusing the whole frame step.

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

## 8. ✅ AS BUILT (2026-09-27) — and where it differs from the above

| piece | where |
|---|---|
| the rule: `resolveMove`, `poseFree`, `blendPlacement` (same-axis partial turn), `slideAlong`, `subtreeOf` / `rootOf` | `src/core/collision.ts` |
| the seams: `CollisionShapeSource` (`hullAtSpawn`, a list of ONE part), `BoundsSource` (`boundsFromShapes`) | `src/core/collision.ts` |
| the separation vector (the slide's normal) — the SAME GJK as `gapBetween`, which is now its length | `src/core/collision_shape.ts` `separationBetween` |
| the composition seam (`SHAPES`, `BOUNDS` — the one line `3D8`/`3D9` change), the skin, the snapping / unsnap-grace exemptions | `src/render/collision_wiring.ts` |
| the guard: every gesture pose write (`setModelPose`) is resolved first | `src/render/bodies.ts` |
| the snap lerp cancelled when a third body is in the way, the couple held off | `src/render/seat_wiring.ts` |

* ⭐ **Checked ALONG THE PATH**, not at the end: a step is cut into substeps no longer than the skin
  (the furthest any point moves, `|Δp| + θ·R`, capped at 64) — a fast drag cannot TUNNEL through a
  thin body. ⛔ An endpoint-only test was the first build and its vectors went red.
* ⭐ **The skin** is `collisionSkinMm` (0.3 mm on the glass, slider in OBJECT TRANSLATION) — GJK reads
  touching and overlapping alike as 0, so a pair is kept at the skin, and a pair already INSIDE it
  may only move apart. ⚠ A pair at exactly 0 (only an exempt couple reaches it) may move while it
  stays at 0: the escape hatch for a state the rule did not make.
* ⚠ **The ALIGNMENT turn does not collide** (`setModelPose(…, collide = false)`): it is the
  constraint being satisfied, not a gesture. A body it turns into a neighbour can only move OUT.
* ⚠ **Increments**: see §4.5.
* ⚠ **Feedback is the HUD only** (`⟂ A⟂B 42% slid` on the first line for two seconds). The contact
  flash, the vibration and the sound of §6 are `GM9`'s.
* ⚠ The broad phase re-derives each body's box per query from the shape source — cheap at today's
  body count; a cached box per body is the first optimisation when the count grows.
* ⭐ 17 vectors (`tests/collision.test.ts`): stop, slide, no tunnelling, leave-but-not-press, the
  frozen plate, exemption, the SAME-AXIS clamp (asserted on the axis, and for an arbitrary turn), the
  compound, the sibling exemption, and ⭐⭐ **the seam**: an L-shape whose notch the hull fills blocks
  a cube, and the SAME rule with a two-part source lets it in. Mutants: endpoint-only, no slide,
  members colliding, the turn not clamped — each turns vectors red.

