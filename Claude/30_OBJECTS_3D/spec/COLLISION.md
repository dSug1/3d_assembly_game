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
⛔ *(Before `3D6`:)* their only readers were the white capture contour and the sway. **Nothing in the move path asked
whether a body may go somewhere** — a part passed through another, and through the frozen plate.
✅ *Since:* the white contour is deleted (`D120`), and the move path asks `core/collision.ts` (`3D6`).

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
⭐⭐ **What the Blender shapes and boxes must be, and what the loader must do with them** →
[`BLENDER_COLLISION_AUTHORING.md`](BLENDER_COLLISION_AUTHORING.md).

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
| **snapping** (the lerp in flight) | **exempt** — the two faces are MEANT to meet at gap 0 | ⭐ `D182`: a snap STARTS only if its straight flight is clear (`snapPathBlockedBy`) — a blocked one waits; if a step still penetrates a third body (something moved in), the snap is **cancelled** and nothing is held (⛔ the hold-off until leaving the radius is the unsnap's alone) | a snap must never push through a neighbour |
| **seated** | **exempt**, the whole assembly among itself — a hull cannot represent the fit (`3D8` revisits this) | the **assembly is ONE compound**: a translation of any member moves the root (`D102`) and is tested as the union of the members' parts; a seated member's own **twist** about its face normal is tested against every body OUTSIDE its assembly, clamped on that axis (§4) | the seat is a rigid relationship; its members cannot collide with each other by definition |
| **just unsnapped** | ⭐ `D182`: **ordinary** — `D136` lets a pair in contact leave; ⛔ the grace (exempt until separated) is deleted: pushed together, it never ended, and a Follower sank 14 mm into its Pioneer | ordinary | it starts at gap 0, which `D136` allows |

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
| the composition seam (`SHAPES`, `BOUNDS` — the one line `3D8`/`3D9` change), the skin, the snapping exemption (⛔ the unsnap grace is deleted, `D182`) | `src/render/collision_wiring.ts` |
| the guard: every gesture pose write (`setModelPose`) is resolved first | `src/render/bodies.ts` |
| the snap lerp cancelled when a third body is in the way, the couple held off | `src/render/seat_wiring.ts` |

* ⭐ **Checked ALONG THE PATH**, not at the end: a step is cut into substeps no longer than the skin
  (the furthest any point moves, `|Δp| + θ·R`, capped at 64) — a fast drag cannot TUNNEL through a
  thin body. ⛔ An endpoint-only test was the first build and its vectors went red.
* ⭐ **The skin** is `collisionSkinMm` (0.3 mm on the glass, slider in OBJECT TRANSLATION) — GJK reads
  touching and overlapping alike as 0, so a pair is kept at the skin, and a pair already INSIDE it
  may only move apart. ⛔⛔ **At 0 → 0 it reads the OVERLAP DEPTH** (`D125`): GJK answers ~1e-16, not
  0, at contact (measured), and a pair that STARTS touching — every `Scene_1` piece, since the
  contour — read 0 however deep it was pushed, so a piece walked through its neighbour. Below 1 nm is
  contact; there, the depth along the separating axes (`overlapAlong`: both bodies' face normals and
  their cross products — exact for boxes) may not grow, and the slide takes its normal from it. ⭐ So
  a body the alignment turn left overlapping really can only move OUT.
* ⛔⛔ **THE SNAPPING COUPLE IS NAMED BY THE SNAP'S OWN WRITE**, never inferred from `seatSnaps.has`
  — defect 72: `advance` drops a snap before its landing step, so every snap was cancelled against
  its own Pioneer until 2026-09-27.
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
  members colliding, the turn not clamped — each turns vectors red. ⭐ + 6 for contact at 0 (`D125`):
  a push in, a slide along, a diagonal, a digging turn, the depth measure — RED against the old rule,
  and against `> 0` for contact, no depth test, and no depth normal.


## 9. ⭐⭐⭐ `D136` — CONTACT IS ALLOWED; ONLY PENETRATION IS REFUSED (2026-09-28)

> *"I cannot get the blue object to snap as per attached picture. Snap gets immediately cancelled"*
> (HUD: `snap: Piece10 CANCELLED — Piece31 is in the way`) — then, offered three fixes, *"Allow
> touching"*, and *"Make a slider for this skin margin allowance"* — the owner, 2026-09-28

⛔⛔ **The cause was a contradiction between two rules, not a bug in either.** `D125` made
`Scene_1`'s neighbouring contours touch at exactly 0, so every slot has **zero clearance**; §3's
skin kept every pair **at least `skinM` apart**. ✅ Measured on the goal layout: `Piece10` pushed
straight back into its slot from 5 cm out stopped **33 mm short** (its own depth — its back face could
not pass its neighbours' front faces), blocked by `Piece27`; and a snap landing flush on a THIRD body
(here `Piece31`, beside the Pioneer `Piece4`) had its last step refused.

⭐ **The rule now** (`poseFree`, `core/collision.ts`):

| the pair | verdict |
|---|---|
| apart (GJK gap > 1 nm) | free, however close it comes |
| touching or overlapping, depth ≤ `skinM` | free — contact, and the tolerance |
| deeper than `skinM`, and it was ALREADY in contact, no deeper than before | free — leaving is always possible |
| deeper than `skinM` otherwise | **refused** — penetration |

* **`collisionSkinMm` keeps its name and its 0.3 mm on the glass**, with a new meaning: **how far a
  body may sink into another** — the margin a hand has to line a piece up within to slide it into a
  zero-clearance slot — and still the path check's substep, so a move cannot tunnel. ⭐ Its slider,
  OBJECT TRANSLATION › *collision allowance*, is relabelled; 0.05–3 mm.
* ⚠ **The depth measure is exact for boxes** (it tests the bodies' own axes and their crosses). For a
  slanted hull it over-reads, so such a pair stops at first contact — safe, never sinking. ⛔ A first
  build let the *"may leave if not deeper"* allowance apply to a pair that had been APART, and two equal
  over-reads passed a cube straight into a hull's notch — caught by §8's notch vector; the allowance
  now needs the pair to have been in contact.
* ⚠ **Cost, stated**: a body stops sunk up to one allowance into what it hits, instead of one skin
  short of it — under a millimetre of scene at ordinary zoom, inside a transparent contour.
* ✅ Vectors (`tests/d136.test.ts`, on the real goal layout): the slot re-entered (RED: 33 mm short);
  lined up within the allowance it slides in, beyond it it is refused; the slider's 3 mm takes a 2 mm
  misalignment; arriving flush on a third body from apart is allowed (RED: *"is in the way"*). §3's and
  §5's vectors restated to the new rule. ⛔ Unjudged by a hand.

## 10. ⭐⭐⭐ `3D7` — THE PLAY VOLUME (`D181`, 2026-09-30)

> *"Build 3D7"* — the owner, 2026-09-30 (the playability program's build #3, `D116`)

`PLAYABILITY` §3: *"Nothing keeps a part inside the scene today … A volume per level clamps translation (the same
stop-and-slide as `3D6`, against the volume's walls); a lost part is recoverable."*

* ⭐ **Data**: a level declares `playVolume: { aboveFloor }` — a box STANDING ON ITS FLOOR (the largest frozen body): the
  floor's footprint, from its top up `aboveFloor` authored units (`core/play_volume.ts` `playVolumeOf`, world metres).
  **`Scene_1`: 2 m × 2 m, 1 m high** (twice the painting's height). ⛔ A scene that declares none is unbounded — `Scene_0`,
  the workbench, whose parts start off its small plate. The JSON seam carries it and refuses a height ≤ 0.
* ⭐⭐ **The rule is `3D6`'s, with the walls as one more blocker** (`CollisionSetup.volume`, `blockedBy === PLAY_VOLUME`):
  * `poseFree`: a subtree whose furthest point is OUT by more than `skinM` is refused — checked along the path in
    `skinM` substeps, so one big step cannot tunnel through a wall;
  * ⭐ **recoverable**: a body already out (a changed tolerance, a level that boots one there) may move back in or along,
    never further out;
  * `resolveMove`: a TRANSLATION stopped by a wall SLIDES — the component into every wall the body is at is removed (a
    corner removes two or three), the rest re-checked along the path; ⛔ a ROTATION clamps on its own axis, never slid.
* The HUD's collision line names it: `Piece1⟂the play volume 73%`.
* ⚠ It clamps the GESTURES (every write through `guardMove`). The alignment turn, the snap's lerp and the demo's replay do
  not collide, as before (§4); an undo restores a pose that was inside.
* ✅ 11 vectors (`tests/d181.test.ts`): stop at a wall, no tunnelling, the slide, a corner, a rotation clamped about its
  own axis, the way back in, unbounded without a volume, `Scene_1`'s box, every boot pose and every demo start inside it,
  the JSON seam. ⛔ Three mutants RED: no walls (6), no way back in (1), no slide (1).
* ✅ The real wiring on the dev server (`Level 1`, through `guardMove`): `Piece1` pushed 5 m sideways stops at x 0.938 m
  (its turned corner on the 1 m edge), `Piece41` pushed 5 m toward the camera at z −0.985 m, `Piece17` lifted 3 m is
  stopped by `Piece2` above it — the walls and the bodies in one rule.
* ✅✅ **Closed by a device look** — the owner, 2026-09-30, build `18584ed`: *"Tested OK"*.

## 10bis. ⭐⭐ `D195` — NO DEPTH CEILING INSIDE A PLAY VOLUME (2026-10-01, ⛔ unjudged by a hand)

* ⛔ *"I am trying to push the piece 1 … or the piece 17 … but the pieces do not translate further"* — the HUD read
  `depth=3.00m [0.02–3.0] ⛔MAX`. Not a body, not a wall: `A5`'s DEPTH CEILING (`depthLimits`, `clampDepthRange`) caps a
  piece's distance from the CAMERA, along the push, at the orbit's maximum radius (3 m) — *"beyond it the object cannot be
  brought back into view"*. A piece behind the painting, with the camera zoomed out (or held 1.5 m behind the double-orbit
  prototype's box), was refused any push AWAY in the middle of the floor.
* ✅ The ceiling's reason is answered by §10: the play volume keeps every piece on the floor the camera orbits and looks
  at. So a scene WITH a volume has no ceiling; a scene without one (`Scene_0`) keeps it; the FLOOR (twice the near plane —
  a body through it is *a black page*) binds everywhere. The HUD prints `[0.02–∞]`.
* ✅ 2 vectors (`tests/depth_translate.test.ts`): a piece 3.55 m from the camera goes away untouched, the near bound still
  binds, no volume keeps 3 m; and the wiring passes the scene's volume. Both RED on the old code (clamped back to 3 m).

## 11. ⭐⭐⭐ THE ORBITED PIECE COLLIDES (prototype, 2026-10-13, `1.0.72-`, ✅ judged by a hand: *"Ok. Working."*)

> *"Now we need to work on the collision of the green-turquoise piece with the other parts. Propose something, reusing what we have done for
> the other parts (collision detection on next move, sliding, etc) and adapting it for the piece specific orbit movement. Also, i ontend to
> provide translation movement to the piece later on so the collision shall take that also into account."* → *"Rotation Blocked by piece : in
> such case, highlight the quad in red instead of yellow and back to yellow when rotation is allowed again. The translation will be done by
> sliding along the face of the placed part the resting face is touching (therefore not a pure world move): take that into account. I agree
> with all the rest of your recommendations. Build"* — the owner.

* **The rule is §3–§9's, unchanged** — `resolveMove`: the path checked in substeps no longer than the skin, contact allowed, only
  penetration refused (`D136`). Before, nothing guarded the piece (the orbit placed it every frame; `candidates` skips orbited bodies).
  ⭐ The piece's own SETUP (`pieceCollisionSetup`): the placed and loose parts only — ⛔ never the FROZEN bodies (the floor: the 3rd and 4th
  rings pass under it) nor the PLAY VOLUME (2 × 2 × 1 m against a 6 m orbit); the other (hidden) orbited piece is never an obstacle, and the
  orbited piece is never another body's obstacle (it is skipped as one, as before).
* ⭐⭐ **THE ORBIT STEP SLIDES IN THE ORBIT'S OWN COORDINATES** (`input/piece_collision.ts`, `guardOrbitStep`) — a world slide (§3) would push
  the piece off its ring. Each frame, after the orbit's spring: the whole step (yaw, ring position); else the YAW alone; else the RING
  POSITION alone (`orbitStepCandidates`); else the fraction of the whole step its path reaches (`lerpOrbit`). ⭐ **The excess is DISCARDED**
  (§3's rule): the refused axes' spring velocity zeroed, the orbit's target pulled back to the stop (`refusedAxes`, `st.orbit.reset`), the coast
  stopped — **the camera stops with the piece** (the owner's choice: it frames the piece), and reversing the finger moves it back at once.
  ⚠ When even that stop is blocked (the GIZMO moved under the piece — a tap on a placed part), the piece stays where its own path stops (a world
  stop and slide, off its ring point) until it is free.
* ⭐⭐ **A TURN IS CHECKED WHOLE BEFORE IT STARTS** (`pieceTurnBlocker`, in `alignRestingFace` and `rollRestingFace`) — the snap's `D182`
  pattern, not §4's clamp: a turn cut short would leave the resting face misaligned. Blocked: REFUSED — *"orbit: the turn (the roll) is blocked
  by PieceN — refused"*, nothing changes, no episode (`D158`). ⚠ It covers every turn: a quad tap, a tap on empty space (first or second
  touch), a tap on a face of the piece (its new resting face).
* ⭐⭐ **THE YELLOW QUAD TURNS RED** while the turn its tap would make is blocked (the owner: *"highlight the quad in red instead of yellow and
  back to yellow when rotation is allowed again"*) — the turn (`restingPreview`: aligned to its direction, or the roll when already aligned
  there) checked whole by the same rule, again when the yellow quad, the piece's pose or its alignment changed, at most every 100 ms.
* ⭐⭐ **THE TRANSLATION TO COME** — the owner: *"The translation will be done by sliding along the face of the placed part the resting face is
  touching (therefore not a pure world move)"*. ⭐ It goes through the same guard: the move is a step along the TOUCHED FACE'S PLANE (its two
  in-plane axes, from the finger), so its stop-and-slide is §3's with the touched face's normal as one more constraint — the slide keeps the
  in-plane remainder, never the component into the face; a blocker met along the plane stops it and the remainder slides along that blocker
  within the plane (the intersection of the two planes: a line). ⚠ Open, to decide when it is built: whether the piece then keeps an OFFSET from
  its ring point the orbit carries, or the gizmo moves with it.
* ⚠ **WHAT IT EXPOSES**: the ring's waist (0.09 m round the gizmo) runs through the painting wherever the gizmo sits among the parts — the piece
  now stops there (measured headless: going down at the boot yaw + 2 rad, stopped by `Piece4` at ring position 0.597 of an asked 0.55; a yaw
  sweep stopped by `Piece10`, then `Piece13`, sliding). ⚠ The guard costs ~0.06 ms per move (measured); the slower frames near the painting
  are the rendering, the camera close.
* ✅ 10 vectors (`tests/piece_collision.test.ts`): the orbit's slide order, the stop, the refused axes; the moving orbited piece stopped by a
  part, never by the frozen floor, never another body's obstacle; the wiring of the step, the turn checks and the red quad.
* Headless (desktop): the piece stopped by `Piece4` → the yellow quad RED (`quadTurnCheck.blockedBy`: Piece4) → a tap on empty space:
  *"orbit: the roll is blocked by Piece4 — refused"*; slid on along the yaw, the quad yellow again. ⛔ No device look yet.
* ✅✅ **CLOSED BY A DEVICE LOOK** (2026-10-13, the owner: *"Ok. Working."*) — tested against `Piece2` placed for the test on the orbit's 1st ring at
  5.6 m, 30° of yaw from the boot (*"Place the red non-seated part somewhere on the 1st ring at 5.6m so i can test the quads response to
  collision"*); then put back on the floor by the painting (*"Put back the red piece"*).

## 11bis. ⭐⭐⭐ THE PIECE'S SLIDE, SMOOTH — collide and slide in the orbit's coordinates (2026-10-13, `1.0.73-`, ⛔ unjudged by a hand)

> *"When the piece collides, sometimes (not always) there is some jitter as the input goes into the direction of collision instead of smooth
> sliding. Check state-of-the-art patent-free and license-free literature if we can improve that … Do the root cause analysis and Propose
> before anything is built."* → *"I agree with your recommendation. Before building, will this make the game more heavy and slower to run?"* →
> *"Build"* — the owner.

* ⛔⛔ **THE ROOT CAUSE, MEASURED** (headless: the piece pushed diagonally into `Piece4`, every frame recorded): a STICK-SLIP, not a slide —
  `9.98  0.73  0.72  0.75  0.73  9.69  0.67 …` mm per frame: three frames creeping sideways with the ring position FROZEN, then a ~10 mm drop.
  1. **The slide was axis by axis** (§11: the whole step, else the yaw alone, else the ring position alone) — on a surface oblique to the orbit's
     axes it stair-steps: the yaw slides until a gap opens, then the whole step is free at once (the artefact of axis-separated response).
  2. **The discard killed the smoothing** — the refused axis's spring velocity zeroed and the orbit's target pulled back to the stop on every
     blocked frame, so that axis moved only when the next POINTER EVENT arrived, as one raw step: the drops came at the event rate.
  3. The stop's depth floated inside the skin (a bisection) and 4. the skin itself followed the camera's distance (it moves while orbiting).
* ⭐ **THE LITERATURE** (published techniques; permissive-licence implementations; none copied): COLLIDE AND SLIDE — Fauerby, *Improved
  Collision Detection and Response* (2003); Nettle (2000): project the remaining motion onto the contact plane, iterate (a second plane: the
  crease), keep a "very close distance"; Linahan (arXiv 1211.0059): its jitter is numerical robustness; Bullet's kinematic character
  controller (zlib): the motion split along and against the contact, a contact margin; Box2D / Catto (GDC 2006, 2013): a small fixed slop,
  positions corrected last; robotics: a motion driven by joint coordinates is constrained through its JACOBIAN (least squares).
* ✅ **THE BUILD** (`input/piece_collision.ts`, `guardOrbitStep`):
  1. **The step PROJECTED onto the contact in the orbit's coordinates** (`projectStep`): the ring's Jacobian at the piece (how far the anchor
     moves per radian of yaw and per unit of ring parameter, by finite differences), the contact's normal (`contactNormal`, factored out of
     `resolveMove`); the component into the contact removed with the least change in the ring's own metric `JᵀJ` — so BOTH coordinates move
     along the surface, every frame, and the piece stays on its ring. Re-checked up to 3 times (a second contact: the crease; two contacts the
     two coordinates cannot follow: zero). ⚠ A push straight into an OBLIQUE surface therefore slides along it (as collide-and-slide does);
     head-on into a surface square to it, it rests still.
  2. **A REST GAP**: when no projected step is free, the whole step's stop is pulled back half the skin (`backOff`) — the next frame starts apart.
  3. **Only the input INTO the contact is discarded**: the orbit's target and the spring's velocity projected the same way (`slide`) — the
     slide keeps its pace at the frame rate; reversing the finger still moves the piece back at once.
  4. **The skin HELD for the contact's length** and 5. **the normals remembered** (`rememberNormal`, ≤ 3, near-duplicates merged) while the
     contact lasts (200 ms after it was last met).
* ✅ **MEASURED AFTER** (the same push): the piece moves on EVERY frame along the contact — no frozen frames, no drops: the step's variation
  (sd / mean) 0.26–0.38, against 0.10 for the same push in free space and ~1.3 for the stair-step before. The guard's cost while sliding
  0.2–0.5 ms a frame (smoothed; the HUD's `camera` line now prints `guard …ms`), against a 16.7 ms frame at 60 fps.
* ✅ Vectors (`tests/piece_collision.test.ts`): the projection along an oblique wall moves BOTH coordinates and nothing into it; away or along:
  untouched; head-on: zero; the ring's metric; a crease: zero; the rest gap; the normals remembered; the wiring (the target and the velocity
  projected, the skin held, `contactNormal` shared with `resolveMove`) — RED against the axis-by-axis build. ⛔ No device look yet.

## 11ter. The piece: sliding or blocking, and where it can get STUCK (2026-10-13, the owner's two questions — ⛔ NOTHING BUILT)

* ⭐ **SLIDE OR BLOCK — the discriminant** (*"What is the discriminant between sliding or blocking?"*): no threshold, no friction — geometry.
  The step (yaw, ring position) becomes a world motion through the ring's Jacobian; its part INTO the contact (along the normal) is removed;
  what is left is mapped back to the ring's two coordinates (`projectStep`). Anything left: it SLIDES by exactly that (a push at 45° slides at
  ~70 % of its speed; a nearly head-on push creeps). Nothing left: it BLOCKS, a rest gap short — when the push is exactly along the normal, or
  when two contacts leave the ring's two coordinates no common direction. The slide itself is re-checked (up to 3 times, a new contact each
  time); none free: it stops. ⏸ Offered, not built: a FRICTION CONE (block within an angle of the normal, e.g. 20°, slide beyond it).
* ⭐ **REVERSIBLE?** (*"Is the path of the piece always revertable or can the piece get stuck without a way out in some cases? Which cases?"*) —
  a way out nearly always; the path itself is NOT reversible: a slide depends on its history, so reversing the finger moves the piece straight
  back from where it slid to, not along the slide. Why there is a way out: a step AWAY from a contact is never touched by the projection, a pair
  in contact may always get shallower (`D136`), and a blocked turn never starts.
* ⛔⛔ **WHERE IT CAN BE TRAPPED** (from reading the code; ⛔ not reproduced on purpose):
  1. **Pinched in both coordinates** — parts on both sides in yaw AND along the ring: every step goes into a contact. Hard to reach by orbiting
     (the way in stays free), possible once something else changed.
  2. **The gizmo moved under it** (a tap on a placed part moves the ring): its new ring point inside or between parts — it is held where its
     own path stopped, off its ring; with the new ring through parts on every side, nothing frees it until the gizmo moves again.
  3. **A part moved INTO it** — the orbited piece is no obstacle for the other bodies (`candidates` skips orbited bodies), so a dragged,
     snapped or goal-pulled part can end up overlapping it; it may then only reduce that overlap, and overlapping parts on opposite sides,
     every move deepens one: frozen.
  4. **Spawned inside something** — the green ↔ turquoise switch respawns it at the boot pose (unlikely in `Scene_1` today).
  5. Partial, not traps: at the ring's ends (0 or 1) a contact on the inner side leaves only the yaw; the ring's waist runs through the painting
     at some yaws (go round); in a cramped spot every turn is refused (the red quad) until it orbits away.
* ⏸ **THE FIXES OFFERED** (not built; the owner's answer awaited): (3) the orbited piece an OBSTACLE for the other parts — nothing pushed into
  it; (2) a gizmo move refused when the piece's new ring point is blocked (named on the HUD), or the piece carried out along the contact normal
  first; (1–4) a PUSH-OUT — overlapping with no move free, the piece pushed out along the contact normal over a few frames, then on (Bullet's
  `recoverFromPenetration`); last resort: the piece switch's respawn. ⭐ Cases 2 and 3 to be reproduced headless first.

## 11quater. Case 3 built — the piece an OBSTACLE; the STUCK piece respawned by a double tap (2026-10-13, `1.0.73-`, ⛔ unjudged by a hand)

> *"Build case 3. Then build a piece-switch respawn which activates if any delta position input (orbiting or translation) and any rotation by
> quad is blocked: in such case, if the user double tap/click on the piece, the piece respawns at its initial spawn transform. Mark in the md
> file to count a malus for episode count in this case (we will work on episode counts later on)."* — the owner.

* ✅ **CASE 3 (§11ter) CLOSED IN CODE: THE ORBITED PIECE IS AN OBSTACLE** — `candidates` no longer skips orbited bodies; the HIDDEN one (the
  green ↔ turquoise switch shows one) is exempted by both setups (`hiddenOrbited` in `collisionSetup` and `pieceCollisionSetup`). A part
  dragged, snapped or pulled to its goal now stops at the piece — nothing can be pushed into it. Headless: `Piece3` moved onto the piece's
  position, every other body exempt — stopped by `green-box` at 75 % of its path; the turquoise piece (hidden) exempt.
* ✅ **THE STUCK PIECE'S RESPAWN** — **armed only when BOTH are blocked** (`pieceRespawnArmed`): its last POSITION input (an orbit step met a
  contact, and no free move since — `st.pieceMoveBlocked`; the translation to come will set it the same way) AND the turn its YELLOW QUAD
  would make (the quad RED — `quadTurnCheck`). Then a **DOUBLE TAP / CLICK ON THE PIECE** (its own tap history, `st.pieceTaps`) respawns it
  (`respawnStuckPiece`): as the piece switch does (`spawnOrbitPiece`: the boot orientation, the boot orbit, aligned to the frozen body at the
  next frame), and the orbit centre back where it booted (`bootCentreM` — the spawn transform is on the boot ring). The HUD's collision slot
  reads *stuck → respawned* for 2 s. Not stuck, a double tap is two taps on the piece (its resting face), as before.
  Headless: not stuck — no respawn; stuck (both halves FORCED: no real both-blocked spot was found in `Scene_1`, the turn being free at the rest
  gap where the piece stopped) — back to the boot yaw at 3.0 m.
* ⭐⭐ **THE RED POP-UP** (the owner: *"In such case the piece is blocked, Add a pop up message (same kind as the pop up when a part reach its
  goal) in red (instead of green) with written “Part is blocked. Double-click the part to restart” in desktop or “Part is blocked. Double-tap the
  part to restart” in mobile."*) — the goal pop-up's toast (`ui-toast`) in the theme's new DANGER pair (`ui-toast--danger`; both themes'
  red readable ≥ 4.5 : 1), its own element (a goal pop-up never replaces it), SHOWN while the piece is stuck (the respawn's two halves) and
  hidden as soon as it is not (a free move, or the respawn). The words by the device (`blockedMessage`): a coarse pointer *Double-tap*, else
  *Double-click*. Headless (stuck forced): shown — *"Part is blocked. Double-click the part to restart"* — then hidden after the double click.
* ⛔⛔ **EPISODE MALUS OWED** (the owner: *"Mark in the md file to count a malus for episode count in this case (we will work on episode counts
  later on)"*) — **a respawn of a stuck piece must cost the player a MALUS on the episode count** (`SCORE.md`). ⏸ NOT counted yet: today the
  respawn changes the scene without a scored episode. To decide with the episode counts: how many episodes it costs, and whether its two taps
  count too.
* ✅ Vectors (`tests/piece_collision.test.ts`, `tests/proto_orbited_model.test.ts`): a part moved into the orbited piece STOPS (the old vector
  asserted it passed — reversed), the hidden piece exempt by the setup; the respawn armed only with both halves; the wiring.

## 11quinquies. The orbit's TARGET guarded, as a part's input step is; the red message only when EVERYTHING is blocked (2026-10-13, `1.0.73-`, ⛔ unjudged by a hand)

> *"the red message shall appear if all delta position and quad rotations are blocked · there is still some jitter. For example going upwards
> and blocked in the attached configuration. Check what is done for the translation of the parts because there the slide and block is smoother
> than for the piece orbit."* → *"The pushing up is only one example, easy to show. Jitter appears everywhere"* — the owner, from the phone
> (build `38c9ae7`: the red pop-up shown while the piece could still move; the jitter at the waist, the gizmo near the floor).

* ⛔⛔ **WHY A PART IS SMOOTH AND THE PIECE WAS NOT — the architecture, not the slide.** A part's translation guards the INPUT STEP itself (one
  `resolveMove` per pointer event); the result is what is shown, nothing downstream fights it. The piece let the raw input into the orbit's
  TARGET unguarded; a spring chased that target and the guard cut the SPRING's output every frame. Pushing into a part, each event drove the
  target into it again, the spring accelerated toward it, the guard cut the spring, rewrote its velocity, pulled the target back — every frame
  — and **the camera followed the UNGUARDED target** (`rig`, read before the guard), leaning into the refused input and coming back.
* ✅ **THE FIX — guard the target, not the follower**: each step of the orbit's target (a finger, the coast) goes through the guard
  (`guardOrbitStep`, the projected slide of §11bis) from where the guarded target was (the piece placed there, `setWorldPlacement`) — BEFORE
  the spring (`st.orbitTargetGuarded`). The spring only ever eases toward a collision-free target, and the camera's driver IS that target. The
  per-frame guard stays a SAFETY NET only (the spring's own path cutting a corner, the gizmo moved under the piece): it projects the spring and
  its velocity, and no longer touches the target. A respawn starts a new guarded target.
* ⚠ Measured headless (the diagonal push into `Piece4`, the orbit's target written at the event rate): the slide's step variation (sd / mean)
  0.19–0.31, from 0.26–0.38 (§11bis) and ~1.3 before §11bis; 0.10 in free space. ⚠ A real finger's drag into a contact could not be produced
  headless (the synthesised drags slid past); the device is the judge.
* ✅ **THE RED MESSAGE (and the respawn) ONLY WHEN EVERY MOVE IS BLOCKED** (`pieceStuckFrame`, at most every 250 ms, only while the INPUT is in
  contact): every POSITION step — a 3 mm probe each way along the ring's two coordinates (yaw ±, ring position ±), all blocked (a ring end counts
  as blocked that way) — AND every QUAD TURN — each direction's tap (aligned to it, or its roll when already aligned there), all blocked. It
  showed before as soon as the last input met a contact and the yellow quad was red, while the piece could still move away. "Position blocked"
  (`pieceMoveBlocked`) is now set by the TARGET's guard (the input met a contact) and cleared only by a free input step. Headless: at the
  `Piece4` contact, the piece holding and able to back away — no message.
* ✅ Vectors (`tests/piece_collision.test.ts`): the target guarded before the spring, the camera following it, the per-frame guard no longer
  pulling the target; a respawn's new target; the all-blocked check's probes and turns.

## 11sexies. A large orbit step checked ALONG THE RING, not its chord; the stuck probes from the piece as it is (2026-10-13, `1.0.73-`, ⛔ unjudged by a hand)

> *"Still some spring effect with large dx orbit. Check that the collision check holds at large orbit dx. Also, a red flag popped up when there
> was no blocking to revert the orbit during this large dx orbit. See attachments (gizmo was on the bottom face of the bottom part)"* — the owner,
> from the phone (build `c64fe33`: the red pop-up shown, `⟂ green-box⟂Piece9 0%`, the gizmo at the floor).

* ⛔⛔ **THE CAUSE — a CHORD for an ARC.** The collision rule checks a straight path between two poses (`resolveMove`, `blendPlacement`'s
  lerp), but the piece travels the ring's ARC (the spring eases the yaw). A small step: the two coincide. A LARGE dx step (a big yaw jump in one
  event): the chord cuts inside the arc — the TARGET's guard passed a step whose arc hits a part; the per-frame safety net then stopped the
  spring mid-path (the SPRING EFFECT); and where even its stop was blocked, the piece was HELD OFF its ring — and the stuck probes, started from
  the RING point, crossed the part every way: all "blocked", a FALSE RED FLAG. (A chord can also refuse a step whose arc is free.)
* ✅ **THE FIX**: (1) an orbit step is walked ALONG THE RING (`guardOrbitPath`): cut into sub-steps of ≤ 2° of yaw and ≤ 2 cm of travel
  (`orbitSubsteps`, at most 48), each guarded in turn from where the last ended; a sub-step that meets a contact slides, and the REST of the step
  is projected onto that contact before it goes on — in both guards (the target's and the per-frame net). (2) The stuck probes start from the
  piece AS IT IS (its actual pose + the ring's step `J·dq`), never from its ring point.
* ✅ Measured headless (the gizmo at the floor as on the phone, the piece at the waist, 0.25 rad of yaw per event, there and back, three ring
  positions): **0 frames** with the stuck flag up (no false red); the piece in contact on many frames, sliding (`Piece18`, `Piece13`,
  `Piece12`). ⚠ The check measured CONTACT (GJK gap 0), not depth — contact within the skin is allowed (`D136`); the device is the judge of the
  spring effect.
* ✅ Vectors: the sub-step count (2° / 2 cm / ≤ 48), why (a 60° step's chord 13 cm inside a 1 m arc; each sub-step's within 1 mm), the wiring
  (both guards walk the ring, the rest projected, the probes from the actual pose).
* ⭐ **AND LARGE DY SWEEPS** (the owner: *"Check if some fix is also needed for large dy orbit sweeps"* → *"Do it"*): measured on `Scene_1`'s rings, a dy
  step a finger can make in one event keeps each sub-step within ~1 mm of the ring's path (0.55 → 0.40: 1.1 mm; 0.62 → 0.52 through the waist:
  0.6 mm); only the whole ring in ONE event (1 → 0) reaches 5.9 mm, the skin — and `resolveMove's` own skin-sized path check rules out
  tunnelling anyway. ⭐ Hardened all the same: the sub-step count is taken from the PATH's length along the ring (8 samples,
  `ORBIT_PATH_SAMPLES`), not the chord between its ends — through the waist the path is up to ~1.5× its chord (0.70 → 0.30: 2.26 m vs 1.48 m),
  so each sub-step keeps to ≤ 2 cm of travel as specified (still at most 48).

## 11septies. The guards never freeze a frame — a time budget, cheaper slides, the checks spread (2026-10-13, `1.0.73-`, ⛔ unjudged by a hand)

> *"When i do large orbit dx sweeps which collide, sometimes the scene freezes or the orbit slows down when the piece approaches the collision
> part. Check what can be improved"* → *"Build, update the md files, deploy"* — the owner.

* ⛔ **THE COST, MEASURED** (headless, the gizmo at the floor, 0.25 rad of yaw per event into the parts): the guards' work a frame — mean
  0.7–1.6 ms, **peaks of 7.3 ms** on a desktop CPU (×3–5 on a phone: 20–35 ms in one frame — a hitch; several together, a freeze). Three things
  stacked exactly at the contact: (1) a large step cut into up to 48 sub-steps, each one after the contact SLIDING again — up to ~6 collision
  checks each, each with its own skin-length substeps and a 14-round stop bisection — on every event while the finger pushes; (2) the stuck
  check every 250 ms: 4 probes + a whole-turn check per direction (6), at once; (3) the yellow quad's turn check every 100 ms, mid-sweep.
* ✅ **THE FIX**:
  1. **A TIME BUDGET** — the guards get **4 ms a frame** (`GUARD_BUDGET_MS`, `st.pieceGuardDeadline`): past it the sub-step walk stops where
     it has checked (one sub-step always taken) and the unchecked REST of the input is KEPT — the orbit's target untouched, the guarded target
     where it got to — and goes on next frame (`deferred`); only a step judged whole discards its excess. A heavy moment slows the orbit over a
     few frames, never freezes one.
  2. **Cheaper slides** — after a contact the projected rest of the step is walked ANEW with its own count (`pathSubsteps`), not re-slid every
     2 cm (head-on, nothing is left: done); the stop's bisection 8 rounds for the piece (`CollisionSetup.bisectIterations`; 14 for the parts:
     ~0.02 mm on a skin-long substep).
  3. **The stuck check spread** — only once the piece has RESTED 150 ms under the push (a true block is only met at rest), and ONE check a frame
     in turn (the 4 probes, then each direction's turn); a free one ends it at once.
  4. **The quad's turn check paused** while the piece moves more than 3 mm a frame — checked again as soon as it slows.
* ✅ Measured after (same sweeps): the guards' work a frame — mean 0.5–1.1 ms, **peak 5.0–5.5 ms** (the 4 ms budget plus one sub-step's
  overrun; the budget is wall-clock, so a slower device keeps to it and walks the step over more frames). The rest of the frame headless is the
  rendering. ⭐ The HUD's `guard` reading now gives both guards' cost a frame — its mean and the PEAK of the last 2 s (`guard 0.7ms (peak 5)`):
  on the device, a freeze with a low peak is the rendering, a high peak the guards.
* ✅ Vectors: the budget and the rest kept, the spring held to what was checked, the rest walked anew, the 8-round bisection for the piece,
  the stuck check's rest and turn-taking, the quad's pause, the HUD's peak.

## 11octies. The cheap approach, the ring height kept, the UNLOCK of a head-on block (2026-10-13, `1.0.73-`, ⛔ unjudged by a hand)

> *"On large orbit dx sweeps, the behavior is now : initial rapid orbit, the slow down, then rapid orbit again until parts collide. Then,
> sometimes the piece seem magnet stuck to the collided part. Can both be improved ?"* · *"in attached configuration (gizmo under the bottom face
> of the bottom part, dx towards left), the scene is frozen"* · *"Build it but do not increase the ms budget (i am testing on iphone)"* ·
> *"Without 3, a head-on block stays a hard stop. But find a way to unlock so the user can go backwards"* · *"Do not build detour. Instead,
> propose a way to unlock the head-on block when the user reverses the delta position direction"* → *"Finish, update the md files and deploy"*
> — the owner (iPhone, build `aad3cd7`).

* ⭐ **THE "FREEZE", REPRODUCED** (the gizmo at `(−0.10, 0.02, −0.05)` as on the phone): the yaw to the left stops after 0.2–0.3 rad against the
  painting (`Piece17`, `Piece13`, `Piece9`) — a HEAD-ON block, not a frozen scene (frames run, dy still moves it): the ring at that height runs
  through the painting, a sideways push holds no up/down to slide on. ⛔ The DETOUR (over or under the part) was proposed and REFUSED — a head-on
  block stays a hard stop.
* ✅ **THE UNLOCK** — **a step AWAY from the part the piece is TOUCHING is never refused by that part** (it is still judged against every other
  body): touching (gap ≤ the skin), the step's world motion against the contact normal (`contactNormal`) → checked again with that part exempt;
  free → taken. ⭐ Why it can lock BOTH ways otherwise: the penetration rule (`D136`) lets a pair in contact only get SHALLOWER, and its depth is
  measured along the bodies' own axes — exact for boxes, an OVER-READ for a slanted hull such as the piece: a step that really backs away could
  read "deeper" and be refused. Headless (the configuration above): after each yaw-left block, the reverse got out (+2.6 to +3 rad). The HUD
  shows `U` the frame it lets a step through.
* ✅ **THE APPROACH MADE CHEAP — CONSERVATIVE ADVANCEMENT** (Mirtich 1996): the walk measures the piece's CLEARANCE to the nearest part
  (`clearance`, within 0.5 m) and lets that many sub-steps through unchecked (× 0.8; the piece only translates on the ring, so no point moves
  further than the anchor's path) — the checks are left for the last centimetres before a contact, so the approach no longer spends the 4 ms
  budget (the "fast → slow → fast" on the iPhone). ⛔ The budget is NOT raised (the owner). Headless: the median frame of the sweep 32 → 22 ms.
* ✅ **THE RING HEIGHT KEPT (the "magnet")** — the height the FINGER set is remembered apart from where the piece is (`orbitUserV`): only the
  input's own dy moves it, and a dy of its own pushed into a part is discarded there. A slide that carried the piece up or down a part no longer
  leaves it there: each frame with no contact, the piece RETURNS to that height — guarded, and only when the way back is free; blocked (still over
  the part), it WAITS — it never creeps along a part on its own. ⚠ My earlier headless "drift to 0.65" was my own test's dy (+0.15), not a slide:
  the magnet is diagnosed from the code (a slide moves BOTH coordinates, and the whole excess used to be discarded), not reproduced headless —
  the device is the judge.
* ✅ The HUD's `guard` reading carries flags: `d` (the budget cut a step short), `H` (the piece held off its ring), `U` (the unlock fired).
* ✅ Vectors: the clearance (and a pair's gap), the walk trusting it, the budget kept at 4 ms, the unlock's three conditions, the height kept and
  its waiting return, the HUD's flags.

## 11nonies. A DRAG from a placed part no longer moves the gizmo; the guard starts from the piece as it is (2026-10-13, `1.0.73-`, ⛔ unjudged by a hand)

> *"Piece still locked onto the collided part without possibility to go backwards"* (iPhone, build `042651c`; the HUD: `first Piece18`, the
> gizmo at `(−0.08, 0.02, −0.04)`) → *"Build, update the md files."* — the owner.

* ⛔⛔ **THE SUSPECT, FOUND WITH REAL TOUCHES** (the lock itself was not reproduced headless — with the gizmo fixed, every reverse got out): near the
  painting almost any touch lands on a PLACED part, and **a first PRESS on a placed part moved the gizmo there** (the 2026-10-01 rule) — so every
  drag that started on a part moved the gizmo, and the whole ring with it: six drags carried it from `(−0.08, 0.02, −0.04)` to `(−0.19, 0.50,
  −0.05)`. The piece's place on the ring then jumped against or into the part it touched; every step started from inside it, where the
  penetration rule's over-reading depth could refuse every direction and the unlock (§11octies) find no "away" — and each re-press moved it again.
* ✅ **THE GIZMO MOVES ON A TAP ONLY** — the press on a placed part NOTES where (`orbitTargetOnPress`, `st.pendingPartCentre`); the release moves
  it there only if it is a TAP (`orbitTargetOnRelease`). A drag from a part ORBITS and leaves the gizmo where it is. ⚠ This narrows the
  owner's 2026-10-01 rule (*"when first touch or left button is pressed and hold on a placed piece, the yellow orbit target moves"*) to the TAP
  of 2026-10-12 (*"Second touch tap on seated / placed part now sets the pink gizmo (same as first touch tap on seated / placed part)"*).
* ✅ **THE GUARD STARTS FROM THE PIECE AS IT IS** when the guarded target's place on the ring is in or against a part (`clearance` ≤ 0 there):
  the target's step then starts from the piece's actual pose, never from inside a part.
* ✅ Measured headless with real touches, each drag starting ON a placed part (the gizmo at the phone's place): the gizmo stays at
  `(−0.08, 0.02, −0.04)` through six drags; the piece goes left to `Piece9` and back right to `Piece10`, round after round — never locked. A TAP
  on `Piece13` moves the gizmo there (⚠ headless only with `?tapMaxDuration=400`: the software renderer makes a quick tap last ~280 ms).
* ✅ Vectors: `orbitTargetOnRelease` (a tap moves, a drag does not); the press only notes; the release's wiring; the guard's start from the actual
  piece.

## 12. THE ORBITED PIECE REBUILT — one solver, one authority, a 1 mm gap (2026-10-13, `1.0.74-`, ⛔ unjudged by a hand)

> *"Audit what we have built since commit b37be04 … Identify where the logic is weak or the code implementation is not robust … propose a way to
> re-build everything with a clean logic and robust coding"* → the audit's three questions answered: *"1- ok 2- the gizmo is on the face hit by
> raycast. It cannot be inside a part 3- i have no opinion. Do what you recommend. Build"* — the owner.

⛔⛔ **§11bis–§11nonies's guard layers are REPLACED, not amended** (their text stays as the record): the target guard, the spring's safety net,
the held anchor (a pose off the ring), the unlock, the 4 ms clock budget, the held skin, `projectStep`/`backOff`/`rememberNormal`
(`input/piece_collision.ts`, deleted) and `pairGap`.

* ⭐⭐⭐ **WHY A REBUILD** — the audit's root causes, every one of them structural: the rest pose sat INSIDE the part at skin depth, so whether a
  step was allowed depended on the piece's HISTORY (the lock, the unlock that could not find "away"); TWO pose authorities (the guarded target and
  the spring, plus a held anchor off the ring that could never be left cleanly); the skin followed the CAMERA; the inertia stopped at every
  contact event; a clock budget cut steps mid-way; the turn's playback was unchecked; the stuck probes disagreed with the guard; and the respawn
  read one flag twice (`pieceRespawnArmed(st.pieceStuck.all, st.pieceStuck.all)`).
* ⭐⭐⭐ **ONE AUTHORITY**: the piece's place on its ring, `q = (yaw, v)` (`st.pieceQ`). Its world pose is a function of `q` — there is no pose
  off the ring. The camera is driven by it.
* ⭐⭐⭐ **ONE RULE — A CLEARANCE, NOT A PENETRATION**: a pose is admissible iff the piece's surface gap to every part (`nearestObstacle`, GJK; the
  floor and the hidden piece exempt) is at least **half the gap kept**; the piece RESTS at the gap kept — `pieceGapMm`, **1 mm in the WORLD**
  (the owner's *"1- ok"*), never scaled by the camera. Admissibility reads the pose alone, so **any free path is free backwards** and a step
  that opens the gap is always taken: reversible by construction — no depth, no "only shallower", no unlock.
* ⭐⭐⭐ **ONE SOLVER, ONCE A FRAME** (`input/piece_orbit_solver.ts`, pure): from `q` toward the orbit's target (the finger, the coast) —
  CONSERVATIVE ADVANCEMENT along the ARC (Mirtich 1996: never further than the measured gap minus the gap kept; big strides in open air, so no
  slow-down approaching a part); at the gap kept, the rest PROJECTED onto the contacts in the ring's metric (`projectExact`: an exact active
  set — the sequential projection it replaces depended on the order the contacts were met) and slid in checked sub-steps of ≤ 4 mm; a corner
  the projection did not know of is LEARNED and the step projected again (never crept into by halving); nothing left: BLOCKED — what pushed in
  is discarded (the target set to where the piece is), and the coast stops only if nothing moved.
* ⭐⭐ **A WORK CAP, NOT A CLOCK**: `pieceSolverQueries` (24) gap queries a frame — the same on every device and in every test; a step cut short
  keeps its PROJECTED rest for the next frame (never dropped). ⛔ Not raised (*"do not increase the ms budget (i am testing on iphone)"*).
* ⭐⭐ **THE RING MOVED UNDER THE PIECE** (a TAP moved the gizmo, a part moved — the owner: *"the gizmo … cannot be inside a part"*, but the
  piece's place on the new ring can be): the piece goes to the ring's **nearest free place** (`nearestFree`: 1 cm strides, both coordinates
  and the diagonals, up to 40 cm), the orbit's target with it.
* ⭐⭐ **A TURN BY THE SAME RULE**: the quad's turn and the roll are swept along the very slerp the alignment plays (`turnSweepFree`,
  conservative advancement in angle), refused where the gap falls under half the gap kept; a turn starting inside that margin may not take it
  closer.
* ⭐⭐ **STUCK FROM THE SAME SOLVER**: its own probes (`stuckProbe`: 3 mm each way along both ring coordinates — stuck only if none moves the
  piece a quarter of that), then every direction's turn, one check a frame, once the input was blocked and the shown piece has caught up; the red
  pop-up and the double-tap respawn read **the position AND the turns** (`pieceRespawnArmed(position, turns)`).
* ⭐ Kept: the ring height the finger set (§11octies — a slide carries the piece up a part, it goes back when the way is FREE); the piece as
  another body's obstacle (case 3); the gizmo moving on a TAP only (§11nonies); the pop-up's words; the respawn.
* ⭐ **Sliders** (OBJECT TRANSLATION): *piece gap* (`pieceGapMm`, 0.2–5 mm) and *piece solver — gap checks per frame* (`pieceSolverQueries`,
  8–96). **HUD**: `solver <mean>ms (peak) q<queries> d b` — `d` the work cap reached, `b` the input blocked.
* ✅ Measured headless with real touches (desktop, ⚠ not the iPhone): twelve large sweeps into the parts and back — the true gap never under
  0.9 mm, every reverse got out, no false pop-up; ~1.1–1.5 ms a frame in contact. Vectors: the eight of the audit (the rest gap, pose-only
  admissibility, reversibility, an admissible path, the arc not the chord, stuck = the solver, the work cap, the gap in the world), each shown
  RED against the old behaviour where a pure equivalent existed (the chord, the sequential projection, the creep, the double-read flag).

### 12bis. The eye: the orbit's spring toward the SOLVED place; a slide never goes against the finger (2026-10-13, `1.0.74-`, ⛔ unjudged by a hand)

> *"the travel during orbit is extremely jittery: your built introduced this new issue."* · *"also, at the moment the piece collides, there is a
> jittery shake."* · *"when the piece orbit anywhere (not necessarily close to collision, but for example above 3m - this is an example), the piece
> jitters, and so do the quads. there is nothing close to collide with."* — the owner, on the first §12 build (`f9faa78`).

* ⛔⛔ **THE FIRST §12 BUILD DREW THE PIECE ALONG THE SOLVER'S PATH** (`followPath` on a spring on the length left), so that no shown pose could
  cut a corner the solver went round. Two defects, both mine, both measured headless against the build before the rebuild (`518ed37`):
  * the path holds **every wobble of the finger's dy**: the piece followed it faithfully and shook, the quads with it — **112 direction
    reversals** on a drag with a finger's dy noise, where the old per-coordinate spring had **0**;
  * measured in the ANCHOR's metres, a large yaw near the waist moves the anchor a few millimetres while the camera swings with it: the yaw was
    spent in ONE frame (0.094 rad, traced) — the camera jerked at the pointer-event rhythm.
* ✅ **THE EYE IS THE ORBIT'S SPRING AGAIN** (`springOrbit`, τ = `boxSmoothMs` / 2, per coordinate) — aimed at the SOLVED place, which is always
  admissible, so it never chases a refused target (the pull-back of §11–§11quinquies). The path follower is deleted. ⚠ The cost, named: on a
  slide the shown piece may cut a corner of the solved path for ~τ (sub-millimetre at contact speeds). Measured: 0 reversals in open air, the
  yaw's and the camera's ripple equal to the old build's.
* ⛔⛔ **AND THE SHAKE AT THE CONTACT**: the finger's dy wobble pressing DOWN onto a sloped part made the exact slide run BACK along the yaw it was
  asked to go, and the next wobble let it forward again — a rocking at the event rhythm (traced: the target and the piece reversing in yaw).
  ✅ **A SLIDE NEVER GOES AGAINST THE FINGER** (`keepSense`): a coordinate of the slide opposite to the input is dropped (one the input left at
  zero may move — a yaw push into a slope still rides up or down it); what is left must still honour every contact, else the piece stops.
  Measured at the contact: **0** yaw reversals of the solved and shown piece (11 a pass before), the gap ≥ 1.1 mm. ⚠ What still moves at a
  contact is the ring height, as much as the finger's own dy asks.
* ✅ Vectors, each RED against the code that shipped: the spring smooths a dy wobble to under a third; a yaw near the waist then a ring-height
  step is eased, not spent in one frame (the anchor metric measured failing); a slide never goes against the finger (red with the solver
  unguarded).

### 12ter. The second audit's fixes — the orbit drag deadbanded, the stuck check scheduled, "inside" a verdict, the turn held, the relocation straight out, the frame decided in `input/` (2026-10-13, `1.0.74-`, ⛔ unjudged by a hand)

> *"before I fix the sway, let's do another audit by Fable of what we have built with the last two commits. Same objectives as the previous
> audit."* → *"build everything, update the md files, deploy"* — the owner. The audit found the architecture sound and eight local findings.

* ⛔⛔ **A SLOPED SLIDE STUTTERED** (§12bis's `keepSense` traded the shake for it — confirmed with the real solver: a ±0.2 mm dy wobble made the
  yaw advance 0 / 2.2 / 0 / 2.4 mrad, every other event). ⭐ The cause one layer down: the orbit drag fed RAW pixel deltas to `st.orbit.drag` —
  the only input that bypassed §1.1. ✅ **The orbit drag now reads the tracker's per-axis DEADBANDED step** (`st.orbitMotion.tracker.step`,
  `motionDeadbandMm`): a wobble on the axis the finger is not moving emits nothing; `keepSense` stays, and now only meets a real opposing input.
  ⚠ Cost: one band (3.5 mm) of dead travel when an axis ENTERS motion, once per drag — a feel change of the orbit drag itself, to judge by hand.
  Measured headless on a wobbling drag into a part: **0** direction reversals at the contact (129–149 before).
* ⛔⛔ **THE STUCK CHECK RAN EVERY FRAME FOR EVER** once an input was blocked, finger lifted or not — one turn sweep alone took ~61 gap queries at the
  gap kept, ~60–90 a frame, 3–4× the cap, outside the HUD's timer. ✅ **Scheduled** (`stuckNext`/`stuckRecord`): one check every 100 ms, in
  turn; a round that ends (a free check, or every one blocked) is the VERDICT for its key — the piece's place, its turn, the gizmo, the parts —
  and nothing runs again until the key changes. ✅ A turn sweep takes at most `pieceSolverQueries`. ✅ The stuck and turn checks' time and
  queries are added to the HUD's `solver` figures (a frame late). ⚠ A frame that runs a check may exceed the cap (38 queries measured).
* ⛔ **A PIECE INSIDE A PART WAS SILENTLY LOCKED** — no red quad, no pop-up, no respawn (`turnSweepFree` read "never below the gap it starts
  with", which a gap of 0 everywhere passes). ✅ A turn starting inside the margin is allowed only if it OPENS the gap; and the stuck check runs
  when the piece is inside the margin, blocked input or not — so the pop-up and the respawn arm.
* ⚠ **THE TURN IN FLIGHT WAS NOT RE-CHECKED** while the orbit moved the piece (the quad tap with the second touch while the first orbits, the
  common mobile gesture). ✅ Each frame of the 125 ms slerp checks its next increment at the piece's place NOW (`turnStepHeld`): under the
  margin and closer, the slerp WAITS (never aborts — the resting face would be left misaligned) and resumes once the way opens.
* ⚠ **A RELOCATION HOPPED ≥ 1 cm IN A FIXED ORDER**. ✅ `nearestFree` first tries straight out of the contact (the ring step closest to the contact
  normal) at 1, 2, 4 … gaps kept — a 0.6 mm intrusion moves ~2 mm — then the 1 cm grid.
* ✅ **THE FRAME IS DECIDED IN `input/`** (`orbitFrame`): the relocation, the solve, the target's reset, the work cap's rest, the ring height
  kept; the render applies it. ⛔ Moving it found a defect: on a relocation the height kept was shifted TWICE (once explicitly, once through the
  input's own height change, which already held the shift) — now once. Its source-string pins are replaced by behavioural vectors.
* ⚠ Not changed, by the audit's own reading: the drawn piece may cut a corner of the solved path by up to a few mm for ~τ (30 ms) on a FAST slide
  (§12bis said sub-millimetre — corrected here); the return to the height kept (§11octies) may read as a pull-back; a piece resting flat on a
  part shows 5 of 6 quads red — correct (only the roll is free).
* ✅ Vectors (10), each RED against the code before: one frame free / blocked / capped / relocated (the height shifted once) / the height's
  return and its wait; the slope stutter with a raw wobble against none; the deadband wired; the stuck schedule (7 checks then nothing, a free
  check ends the round, a new key a new round); deep inside — stuck AND turns refused; a turn under the cap; the turn hold; the straight-out
  relocation (red with the normal stride removed).

### 12quater. The third audit's fixes — the directional stride, the backlog dropped on a reversal, the relocation capped, the stuck verdict kept, the double tap, the orbit drag's own band (2026-10-13, `1.0.74-`, ⛔ unjudged by a hand)

> *"let's do another audit by Fable of what we have built with the last three commits"* → *"build, update the md files, deploy. then perform the
> fable audit once again on the last four commits."* — the owner. The audit: the architecture sound; two HIGH findings, quantitative.

* ⛔⛔ **§12's "no slow-down approaching a part" WAS FALSE FOR A PASS ALONGSIDE ONE** — conservative advancement strode by the SCALAR gap whatever
  the direction: 1 rad asked along a wall 2 mm away went 22 mrad in a frame, 4 mrad at 1.2 mm (measured). ✅ **THE DIRECTIONAL STRIDE**: the gap
  to the NEAREST part under a straight translation is CONVEX and its slope is the contact normal's, so it cannot close faster than `approach`
  (−n · the step's direction) per metre — the stride is the spare air ÷ `approach`; every OTHER part is held to its own gap
  (`nearestObstacle`'s `secondGapM`), so nothing thin is tunnelled. The ring's arc is not a straight line: near a part only, ≤ 5 cm
  (`DIRECTIONAL_MAX_M`), its landing (≥ the gap kept) and its midpoint (≥ half) checked, two tries at most and only for more than twice the
  scalar stride (a curved part refusing it over and over cost the cap: 75 deferred frames of 88, measured, before that limit).
* ⛔⛔ **A FINGER REVERSING AFTER A CAPPED SWIPE SAW THE PIECE GO ON FORWARD FOR 4 FRAMES** (the backlog — the target the cap left ahead — the
  drag then added to). ✅ `orbitFrame` reads the input as the target minus the last frame's (`prevRaw`): a coordinate of it OPPOSING the
  backlog drops that backlog — the reversal takes effect at once.
* ⛔⛔ **THE RELOCATION WAS UNCAPPED AND RAN EVERY FRAME** — ~280 gap queries a frame while nothing was free within 40 cm (the iPhone freeze
  candidate). ✅ `nearestFree` takes the frame's cap and RESUMES where it was cut (`st.relocateCursor`, keyed by the piece's place, the gizmo and
  the scene); a place searched to the end is not searched again until the key changes.
* ⛔ **THE STUCK SCHEDULE RE-RAN CHECK 0 EVERY FRAME UNDER A CHURNING KEY** (a turn playing, a part dragged, the sway) and the pop-up blinked off
  for ≥ 600 ms. ✅ A changed key restarts the round but keeps the PACE and the last verdict, provisional until a check disagrees. ✅ The key —
  shared with the red quad — is the scene's SIGNATURE (`sceneSignature`: every body's position and ORIENTATION, hashed): a part turned in place
  was never seen, a weighted sum could cancel, and the red quad did not react to parts at all (a refused tap under a yellow quad, a red quad
  after the part left).
* ⛔ **THE DOUBLE-TAP RESPAWN COULD NOT FIRE FROM ANOTHER FACE**: the first tap changed the resting face, the verdict dropped, the second tap found
  it unarmed. ✅ `pieceTapAction`: while the red pop-up shows, a single tap on the piece is CONSUMED.
* ✅ **THE ORBIT DRAG'S OWN DEADBAND** (`orbitDeadbandMm`, 2.3 mm, a slider in OBJECT TRANSLATION), in its own tracker (the camera's MOVING read
  keeps `motionDeadbandMm`): §12ter's "once per drag" was wrong — the band is paid again after every pause ≥ the rest window (~150 ms on the
  tablet, 50 ms with a mouse). ⛔ The audit's 1 mm was REFUSED: under 3× the measured pointer noise (0.761 mm) a resting finger leaks out of
  the band — the very wobble it exists to stop (the validator's own rule since `A10`).
* ✅ The turn HELD shows its quad RED. ✅ A pin that could not fail (an `indexOf` of a line that no longer existed, −1) now asserts the line.
* ⚠ Measured headless (desktop): the smallest gap 0.935 mm; 0 reversals on a wobbling drag; ~2 gap queries a frame at rest; a frame that also
  runs a stuck or quad check reaches ~26–51 queries (the cap is per solve, the checks are paced but not inside it).
* ✅ Vectors (7), each RED against the code before (two by mutant): a parallel swipe 2 mm off a floor goes > 0.2 rad (22 mrad before); the
  directional stride never tunnels a thin part; a reversal after a capped swipe moves back at once; the relocation ≤ the cap per frame,
  resumed, ending; the schedule's pace and verdict across a churning key; the tap decision; the orbit drag's band and its floor.

### 12quinquies. The fourth audit's fixes — the long slide at the gap kept, the second gap per convex part, the plane bound, the band ticked (2026-10-13, `1.0.74-`, ⛔ unjudged by a hand)

> *"build all the fixes, update the md files, deploy. then perform the fable audit once again on the last five commits."* — the owner. The
> fourth audit: the architecture sound, the third audit's fixes correct, no regression; one MEDIUM finding left in the feel.

* ⭐⭐ **THE BOUND IS BETTER THAN §12quater STATED** (the audit, on the real GJK: 2610 random translations of turned boxes, the least slack −7e-16):
  the gap to the nearest convex part under ANY displacement δ of the piece is at least `g + n·δ` — its supporting plane — not only along a
  straight line. ✅ So the path of a long stride is checked by that PLANE BOUND at four points of the ring's arc, with ANCHORS only (no
  collision query): the free-air stride's midpoint query is gone (one query fewer per try), and the miscounted `secondGap` read too.
* ⛔⛔ **A PIECE RESTING ON A PART STILL CRAWLED ALONG IT** — the slide at the gap kept went by 4 mm sub-steps: 0.048 rad a frame (measured) against
  0.27 a millimetre higher; §12quater's long stride only began above 1.2 mm. *Push it onto a part and swipe along it: it lagged the finger and
  slid on after it stopped.* ✅ **THE LONG SLIDE**: after the projection, the sub-step is as long as the plane bound of the nearest part and the
  gap to every other allow (≤ 5 cm), its landing checked once — else the 4 mm sub-step as before.
* ⚠ **THE STRIDE ASSUMED ONE CONVEX PART A BODY** — `secondGapM` excluded every part of the nearest BODY, so a body of several (a U; the `UCX_`
  compounds `3D8` will bring) left its other parts unbounded and could be tunnelled. ✅ `nearestObstacle` keeps the second gap per convex
  PART; the nearest is one part, everything else — the same body's other parts included — bounds the stride.
* ⚠ **§12quater's "paid again after every pause" WAS FALSE**: the orbit drag's own band was pushed but never TICKED, so a silent pause never
  re-rested it (it was "once per drag", and a wobble leaked for ~150 ms after a pause). ✅ Ticked with the camera's tracker — now true.
* ✅ The scene signature (`worldSignature`, now pure in `input/`) leaves the ORBITED pieces out — their easing pose restarted the relocation's
  capped search every frame (the keys carry the solved place and the turn). (⚠ §12quater named the sway among the churners: the sway never
  writes the world — wrong, harmless.)
* ✅ An ARMED stuck verdict (the pop-up up) gets ONE check at once on its first key change — a freed piece hides the pop-up within a frame
  instead of up to ~0.7 s, a single tap no longer swallowed in that window; once, so a churning key keeps the pace.
* ✅ The stuck probe's four solves share the cap (each had all of it — 96 in theory). ✅ `pieceTurnBlocker`'s comment names `turnSweepFree`.
* ⚠ Kept, by the audit's own reading: leaving the inside of a part takes the step whole (it may cross a second part on the way out — the
  reversibility rule wins); ~10 source-string pins of the wiring remain in `piece_collision.test.ts`.
* ⚠ Measured headless (desktop): the smallest gap 0.843 mm; 0 reversals on a wobbling drag; ~2 queries a frame at rest; the worst frame 37
  queries (51 before).
* ✅ Vectors (6), each RED against the code before (two by mutant): resting on a part, a 1 rad swipe goes > 0.2 rad in a capped frame; the
  thin part of another body is never tunnelled (the fixture fails with the bound removed — the old one did not); the second gap per part (a
  U-shaped body: 0.06 m, not the look distance); the stuck probe under the cap; the armed verdict's one quick check; the signature without
  the orbited pieces, with the parts' turns; the band ticked.
