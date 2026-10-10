# Resting-face alignment of the orbited piece — specification (prototype)

> **Status:** ✅ BUILT 2026-10-05 (⛔ unjudged by a hand) — `core/resting_face.ts` (`faceLongAxes`, `restAlignToFace`),
> `input/orbit_tap.ts`, `render/pointer_wiring.ts` (`orbitTapped`, `orbitRightTap`), `render/green_box_wiring.ts` (`alignRestingFace`,
> `alignFaceOf`, `restAlignFrame`, `counterYawFrame`), the mouse model's right tap. Built on `1.0.59p-from1.0.59m-`; priority 1 rewritten
> twice on `1.0.59q-` (§2); carried to **`1.0.59r-`** (2026-10-05).
> **Builds on:** [`RESTING_FACE.md`](RESTING_FACE.md) (the selector: which face, and its group).
> **Scope:** the orbited piece — the green frustum or the turquoise prism, whichever the SCENE switch names.
> ⭐ **Since 2026-10-06 the same first tap also starts THE ORBIT AROUND THE PIECE — an action of its own since 2026-10-07 (`1.0.59v-`)**
> → [`PIECE_ORBIT.md`](PIECE_ORBIT.md) §1bis. ⛔ **Since 2026-10-08 the tap only ALIGNS** — the white sphere starts and ends the orbit
> around the piece (`PIECE_ORBIT.md` §9).
> ⭐⭐ **Since 2026-10-09 (`1.0.59z-Rotation-of-resting-face`) a tap on a piece already aligned ROLLS it to the next edge** (§11) —
> ⭐⭐ **since 2026-10-10 (`1.0.61-from1.0.59z-`) to the next COUPLE of symmetry axes** (§12). ⭐ And: a first-touch / left-click TAP on the
> piece makes the face it hit the resting face, the rolls carried over (§13); a second-touch tap on a PLACED piece moves the pink face (§14);
> the piece turns about its resting face's centre (`PIECE_ORBIT.md` §10).
> ⭐⭐ **2026-10-10**: outside the sphere the orbit's **dx rolls** the piece too (§15); a NEW pink face no longer forces an alignment — the
> rolls go on, aligning to it takes a press on the piece (§16); the piece **boots aligned to the frozen floor**, the roll active at once (§16).

---

## 1. The gesture

While the **first touch** (or the **left button**) is down and **orbiting** — pressed outside any seated piece, as today — the
**second-touch TAPS ON THE ORBITED PIECE** (or **right-button taps anywhere**) are **counted**.
⭐⭐ **AMENDED 2026-10-06** (the owner: *"Zoom is triggered by second touch outside the piece, resting face alignment triggered by second
touch tap on the piece. For desktop, no change (right click anywhere while left click is held)"*): a second touch ON the piece is the tap
candidate — it never zooms, the first finger orbiting on; a second touch OFF the piece is a PINCH from the moment it lands. ⛔ It
replaces *"anywhere on the glass"*: a second finger anywhere had to be held back as a possible tap, so the first finger went on orbiting
during a pinch's start — the piece **jumped** forward or back along the rings before the zoom took over (reproduced headless: the
elevation 1.00 → 0.96, the piece 0.29 m nearer, before the first zoom step). ⚠ Cost: a pinch begun with its second finger ON the piece
does not zoom.

| tap | what it does |
|---|---|
| the piece **not aligned** — ⛔ never since 2026-10-10: it boots aligned to the floor (§16) | the **resting-face alignment** (§2) |
| the piece **aligned** — ⭐ to whichever face, the pink face changed since or not (§16) | the **ROLL to the next couple of symmetry axes** (§12; was the next edge, §11) |

⭐ Two more taps (2026-10-09):

| tap | what it does |
|---|---|
| the **first touch / left button** tapped ON the orbited piece (nothing else down) | the face it hit becomes the **resting face** and the piece **aligns** it — the rolls carried over if the pink face is unchanged (§13) |
| a **second touch** tapped on a **PLACED** piece while the first one orbits | the **pink face** (and the yellow target) move there (§14) |

⛔ Was (until 2026-10-09): the first tap aligned, the later ones were only counted. **The counter resets when the first touch lifts** — it is
the HUD's only now (`taps N`): lifting and pressing the orbit finger again between taps changes nothing (`tapAction`).

---

## 2. The resting-face alignment (the first tap)

**The target orientation**, from the piece's pose at that moment:

⭐⭐⭐ **PRIORITY 1, BY THE PINK FACE** (`1.0.59q-`, the owner, 2026-10-05: *"the resting face goes to anti-align with the normal of the
pink face (if no pink face, anti-align with the normal of the first frozen object) — identify the long axis of the resting face (if more
than one, identify the one which is most aligned with the long axis of the pink face) — identify the long axis of the pink face (if more
than one, identify the one which is most aligned with the long axis of the resting face) — if there is a tie, pick up the long axis which
end vertices are closest — rotate the piece so that the long axis are aligned"* — then *"if there is a tie, pick up the two long axis
which nullify or minimize the rotation"*):

1. **The resting face ANTI-ALIGNED with the pink face** — the smallest turn bringing its outward normal along the pink face's INWARD
   normal (the two faces facing each other). The pink face is the face holding the pink ring (`st.pinkFace`: at boot the blue face toward
   the green piece; then the face a press on a placed piece moves the target to). ⭐ **No pink face:** the FIRST FROZEN body's face that
   points most toward the piece (the floor's top — the resting face then goes DOWN).
2. **The pair of long axes** (§3; one of the resting face's, one of the pink face's), judged with the face anti-aligned (both then lie
   across the pink normal): the pair needing the **SMALLEST turn** to be parallel — the most parallel pair, the same measure (the owner:
   *"which nullify or minimize the rotation"*). ⚠ An EXACT tie (the same angle — two pairs already parallel, or one turn's two senses):
   the pair whose **END points are closest** (where each axis meets its edges), so the answer is never arbitrary.
3. **The turn** — about the pink normal, the SMALLEST (≤ 90°: an axis has no direction of its own), making the two axes parallel.
   Rotation only: the piece stays where the orbit puts it. A face with no long axis: step 1 alone.

⛔ Superseded, the same day, and kept as declared debt until the rule settles (`unwired_debt.test.ts`): ~~the long axis toward the
horizontal direction to the ring~~ (`restAlignTarget`, `1.0.59p-`) and ~~the leading edge parallel to the mating edge~~ (`restAlignToEdge`,
`matingEdgeIndex`, `1.0.59q-` — it settled only after several taps, the turn itself changing which edge was nearest the ring).

**The motion:** ONE rotation, from the pose to the target, eased over **125 ms** (a constant — the snap slider left with the rotation
removal; a slider later if wanted). If the orbit moves during those 125 ms, the turn CHASES the moving target (never lands and then
jumps).

⛔ ~~**Then, until the first touch lifts:** the piece turns with the orbit's yaw, in the same direction, its long axis pointing at the
ring; after the lift it keeps its orientation.~~ — **superseded the same day by §2bis** (built, then replaced before any device look).

## 2bis. The piece turns AGAINST the orbit — in all cases

(the owner, 2026-10-05: *"in all cases, the green piece and the turquoise pieces rotate in yaw in the opposite direction of the orbit yaw
by the same amount. This is valid if the resting face has been aligned or not (therefore, also at boot)"* — *"once the resting face is
aligned, the piece will rotate in yaw around the resting face normal"*)

- Every frame, the piece's heading about the ring changes by `d` (the orbit's yaw, read from the spring — what is drawn); the piece
  turns by **`−d` about the world vertical**, through its own centre (`counterYaw`, `counterYawFrame`).
- **In all cases:** at boot, before and after an alignment, the finger down or lifted, the orbit's coast too. A tumbled piece keeps its
  tilt (only its heading turns). An alignment in flight turns with it (its start and its target), so the 125 ms ease never fights it.
- ⭐ **Once aligned**, the resting face's normal IS the vertical, so the turn is about that normal; both pieces turn about their centre,
  which lies on that normal through the face's centre (a symmetric piece — ⚠ an asymmetric one would need its turn moved to the face).
- ⚠ **A consequence, stated:** the long axis points at the ring only at the moment of the tap. Relative to the direction to the ring the
  piece turns by `−2d` as the orbit goes on (it turned by `0` with the superseded follow).
- The orbit finger's lift only resets the tap count.
- ⛔ **AMENDED the same day — it STOPS once the resting face is aligned** (the owner: *"remove the rotation when the resting piece is
  aligned"* → *"The counter-yaw once aligned"*): from the first tap on, the piece holds its aligned pose while it orbits; before that
  (at boot, no tap yet) it turns against the orbit as above. A respawn (the SCENE switch) clears it. HUD: `aligned (no counter-yaw)`.
- ⛔⛔ **AMENDED 2026-10-06 — before the alignment it turns WITH the orbit, THREE times as far** (the owner, `1.0.59u-from1.0.59s-Orbit-around-piece`:
  *"when in orbit around center, yaw rotate the piece in the other direction"*, then *"rotate twice faster"*, then *"set the default
  piece yaw per orbit yaw to 3"*): the piece turns by **`+k·d`** about the vertical, `k` = **`orbitPieceYawFactor`** (default **3**; the
  slider *piece yaw per orbit yaw (×, − = against)* in CAMERA › GREEN PIECE ORBIT, −3…3; **−1 is the old "against"**, +1 keeps the same
  side toward the camera). Relative to the camera, which goes round with the orbit, it turns by `(k − 1)·d` — 2× the orbit's turn at 3.
  Still stopped once aligned. Vectors: `proto_resting_align.test.ts` (the sign and the factor wired, each failing on its mutant).

---

## 3. The long axis of a face — USED again (the resting face's AND the pink face's)

⛔ ~~*To remove later, for all the parts — not used in this branch*~~ (the owner, 2026-10-05, earlier the same day): **withdrawn** — the
pink-face rule (§2) reads the long axes of both faces. `faceLongAxes` now also returns each axis's two END points (§2's tie-break).

The face's **axes of symmetry that run EDGE TO EDGE, perpendicular to both edges** — the longest of them.

- **Green bottom** (103.5 × 45 mm): two such axes, 103.5 and 45 → its length.
- **Turquoise hexagon end:** three, flat to flat, equal (44.8 mm) — ⛔ never corner to corner. The closest to the ring is taken (§2).
- ⚠ **A face with an ODD number of sides** (a triangle, a pentagon) has none — every mirror axis runs corner to edge. Fallback: its
  longest mirror axis, flagged. Neither of today's pieces has one.

---

## 4. What a TAP is — and the pinch

**A tap** (Unity's definition: a press released within a time, and — for a touch — within a radius):

- **touch:** the second finger pressed and **released within `tapMaxDuration`**, **never moving beyond the deadband**
  (`motionDeadbandMm`, 3.5 mm — millimetres on the glass, not Unity's pixels);
- **mouse:** the right button pressed and released within `tapMaxDuration` — **time only** (the cursor is moving with the orbit; Unity
  applies no radius to a button either).

⭐ **`tapMaxDuration` is set to 200 ms** (Unity's default; it was 250) — **for EVERY tap in the game** (option 1, the owner: one constant,
one place): the double-tap undo, the unalign / mode-toggle tap on empty space, the second-touch align tap (and the tap on the floor),
the desktop's Shift tap. ⚠ A still press released between 200 and 250 ms was a tap and is now a hold. ⭐ **A slider** ships with it
(the tablet judges whether 200 drops real taps). The recognizer vector that used a 200 ms press as its tap moves to 150 ms (it would
sit exactly on the boundary).

**The pinch:** as soon as the second finger moves **beyond the deadband**, it is a pinch — at once, no wait — and that touch can no
longer be a tap. ~~The zoom is measured from the fingers' distance at the second PRESS (the deadband's travel is not lost).~~
⭐⭐ **AMENDED 2026-10-06 — THE ZOOM ONLY WHILE BOTH FINGERS MOVE** (the owner: *"zoom can be triggered only if both delta positions are
outside deadband. If one of the two is inside deadband, no zoom"*), for EVERY pinch (`camera_rig.ts` `updatePinch`): each pinching
finger has its own motion state (`PinchMotion`, `input/pinch_gate.ts` — §1.1's `MotionTracker` per finger: MOVING beyond the deadband,
STATIONARY after the device-derived rest window). Both MOVING: the zoom; one STATIONARY: no zoom, the pinch REBASED (its start where the
fingers are, at the zoom as it is — no jump when both move again). ⛔ Not a per-event test: the browser sends one finger at a time, so
"both moved this step" never holds (found headless — the first build never zoomed). Checked headless: one finger moving → no zoom (0.60);
both spreading → 0.60 → 0.52. `tests/proto_pinch_gate.test.ts`.
⭐⭐ **AMENDED AGAIN 2026-10-06 (`1.0.59s-`) — ONE FINGER MOVING IS ENOUGH** (the owner: *"The zoom can be triggered by only one delta
position outside its deadband (no need for two outside their deadbands as we have removed the uncertainty on the zoom inputs)"*): once the
alignment tap moved ONTO the piece (§1), a second touch OFF it is always a pinch — the both-fingers condition guarded an ambiguity that is
gone. `pinchZooms` is now EITHER finger MOVING; both still → no zoom, the pinch rebased (jitter inside the deadbands never zooms). The
per-finger motion states stay (`PinchMotion`). Checked headless: one finger moving → 0.60 → 0.56.

**The orbit with a second finger down** (2026-10-06): a second finger **ON the piece** — the first finger **keeps orbiting** for as long
as it is down (moving beyond the deadband only makes it no longer a tap — ⛔ never a pinch); a second finger **OFF the piece** — a pinch:
the orbit **stops at once** (no coast while fingers are down), and resumes with the first finger once the second lifts. Checked headless:
a vertical spread off the piece keeps the elevation (0.84) from the second finger's landing — no jump; a tap on the piece aligns (1
episode); the same tap off it does nothing. ~~*While the second finger is inside its deadband, the first finger keeps orbiting … the orbit
pauses only once the pinch starts*~~ (2026-10-05) — superseded: it was the jump.

**A tap counts only** if it starts AND ends while the first touch is down and orbiting; a second finger released after the first has
lifted does nothing.

---

## 5. Pieces under the second touch

- ⛔ **A second touch never GRABS a piece** — confirmed in the code: a second touch landing on a piece while the first finger orbited
  was routed as a holder (`pressSteers` only steers when a body is ALREADY held). Removed: it is empty space (a tap, or a pinch).
  ⚠ Only where the orbited piece exists (`Scene_1`); `Scene_0`, with no green piece, keeps the old routing. When the first finger holds a body,
  nothing changes (a second press on another body already steers it and never grabs it).
- **The right button on a piece** — a plain right click (no left button) still latches the face to align (the HitFace, `D161`),
  unchanged. ⭐ **Left held + right tap** is the alignment ONLY: it does not latch a HitFace.

---

## 6. The score

**The first tap costs ONE episode** (the owner: *"We will later see if we change that rule or not"*) — landed the frame it aligns
(`D187`). The later taps cost nothing (they do nothing yet); the orbit touches cost nothing, as today.
⚠ **The undo cannot take it back:** the orbited piece is not in the model, so the double-tap undo does not reach it — while the tap
cost an episode. Accepted for now; making it undoable means putting the orbited piece into the undo history.

---

## 7. To build — ✅ all built (2026-10-05)

- pure, engine-free: the long axis of a face (§3), the alignment target (§2), the tap classification (§4) — with vectors failing on
  the old code first;
- the orbit + second-finger rule (§4) — ⚠ it changes `§2 rule 4` (the pinch) for two fingers on empty space;
- `tapMaxDuration` 200 ms + its slider;
- the grab removal (§5), the HitFace suppression with the left held, the episode (§6);
- the HUD: the tap counter and the alignment's target.

## 8. As built — checked headless (2026-10-05)

Driven over Chrome's debugging protocol on the real page (synthetic multi-touch and mouse), the HUD read back:
- **orbit + a quick second-finger tap**: `taps 1 · aligned, following the orbit`, the score 1 episode; after the lift the count reset
  and the piece kept its pose (on a screenshot: the green piece standing on its bottom, its length toward the pink ring);
- **orbit + a second finger that spreads**: `+pinch`, the zoom 0.60 → 0.56, no tap, no episode; the orbit resumed once it lifted;
- **left drag + a right click (mouse)**: `taps 1 · aligned`, 1 episode, reset at the left release.
⚠ A synthetic second finger held ~250 ms (the protocol's round trips under software rendering) was correctly NOT a tap — the 200 ms
limit is real: a slow tap on the glass will miss it too (the slider is in SCENE).

## 9. Priority 1 by edges — checked headless (2026-10-05, `1.0.59q-`)

Orbit + a quick second-finger tap on `Scene_1`: *"orbit: tap 1 — aligned: the resting face down, its leading edge e1 parallel to the
mating edge e3 of Piece10/f1"* (Piece10 is the blue piece; f1 the face toward the green piece). Vectors: `proto_resting_edges.test.ts`
(the edges of a face, the mating edge — the flattest within 1°, then the nearest the camera —, the leading edge, the face down and the
edges parallel from a tumbled pose, the yaw never past 90°), each failing on a mutant.

## 10. Priority 1 by the pink face — checked headless (2026-10-05, `1.0.59q-`)

Orbit + a quick second-finger tap on `Scene_1`: *"orbit: tap 1 — aligned: the resting face against Piece10/f1, long axes a0 ∥ a0"* — on
a screenshot the green piece stands with its bottom turned to the painting's blue face. Vectors: `proto_resting_face_align.test.ts` (the
axes' end points; anti-parallel to a vertical pink face from the tumbled boot pose; the floor when there is no pink face; the most
parallel pair and the ends' tie-break; a hexagon end never turned past 30°; the turn never past 90°), each failing on a mutant
(gravity instead of the pink face, the farthest ends, no fold, the largest turn).

## 11. The roll to the next edge (2026-10-09, `1.0.59z-Rotation-of-resting-face`)

> ⛔ **SUPERSEDED 2026-10-10 by §12** — the roll goes to the next couple of symmetry axes; `edgeStops` / `nextEdgeRoll` are deleted. The
> sense (clockwise on the screen, the left-handed check), the "when" (`tapAction`), the feel and the score below still hold.

The owner: *"if (the first touch / left click is held or tapped /clicked again) and second touch on piece / right click is tapped again :
rotation of the piece around the normal of the resting face so the next edge of the resting face takes the alignment with the pink face
long axis … in the green piece, that would be the short axis aligning with the pink face long axis, in the turquoise piece, that would be
the next long axis. If there is no pink face, this shall be defined. Propose something. The idea that a series of second touch/right click
make scroll the edges so there is a snapped roll around the normal of the resting face to choose which edge/axis aligns with the pink face
long axis."* — the proposal agreed: *"Build what you proposed."*

- **When** (`tapAction`, `input/orbit_tap.ts`): a tap ROLLS when the piece is aligned AND to the same target face as now (`restRoll.key`
  against `restTargetKey`); else it ALIGNS (§2). The alignment records what it aligned to: the face, and the long axis it paired
  (`st.restRoll`; a respawn clears it).
- **The stops** (`edgeStops`, `core/resting_face.ts`): ONE PER EDGE of the resting face, in order round it — the in-plane line from the
  face's centre out through that edge, at right angles to it. At stop *k* that line is parallel to the reference.

  | face | edges | roll per tap | the stops |
  |---|---|---|---|
  | green (base 103.5 × 45 mm) | 4 | 90° | long axis ∥ → **short axis ∥** → long axis reversed → short axis reversed → back |
  | turquoise (hexagon) | 6 | 60° | one across-flats long axis to the next, each both ways |
  | any polygon | n | uneven | each edge in turn |

- **The roll** (`nextEdgeRoll`): about the resting face's normal, the smallest turn **CLOCKWISE AS SEEN FROM THE CAMERA** to the next stop —
  the stop already reached is passed over, so a tap always moves; past the last edge, back to the first. From the pose the alignment or the
  last roll left — quick taps ADD UP. ⛔⛔ **The scene is LEFT-HANDED** (Babylon's default: the screen's right is up × forward), so the turn
  is positive about the normal pointing TOWARD the camera; the first build used the axis pointing away and would have turned
  counter-clockwise — caught by a check through Babylon's own projection, now a vector (four cameras, one below).
- **The reference**: the long axis of the face it was aligned to, the one the alignment paired — the pink face's, or with no pink face the
  floor's top (`alignFaceOf`; `Scene_1`'s floor is square: the axis the alignment chose). **No long axis, or no target face at all: the
  screen's horizontal** laid on the face (the camera's right), so the stops are relative to the view.
- **Feel and score**: ONE turn eased over `REST_ALIGN_MS` (125 ms), rotation only — the piece stays where the orbit puts it; **1 episode**
  per roll, as the alignment. HUD: `aligned … · edge k/n`, the verdict *"orbit: tap — roll 90°: edge 2 / 4 ∥ the pink long axis"*.

**Checked headless** (`Scene_1`, an orbit finger + second-finger taps aimed at the piece; the orbit finger lifted and pressed again before
the fourth): green — tap 1 aligned, then **90°** each, edge 2 → 3 → 4 → 1, the fifth tap landing EXACTLY on the aligned pose; turquoise —
aligned, then **60°** each, edge to edge; no error. Vectors: `tests/proto_resting_roll.test.ts` (the stops of the rectangle and the hexagon;
green 90° to its short axis and back in four; turquoise 60° and back in six; the sense flipping with a camera below; clockwise through
Babylon's projection; a tap always moving; ALIGN vs ROLL; the wiring) — the old turn direction fails two.

## 12. The roll to the next COUPLE of symmetry axes (2026-10-10, `1.0.61-from1.0.59z-`)

The owner: *"instead of rolling to the next edge, I believe rolling to the next couple of symetry axis is better: compute all the axis of
symetry of the pink face when selecting it, compute all the axis of symetry of the resting face when selecting it, at the click, instead of
aligning the next edge to the long axis of the pink face, align the next closest couple of resting face - pink face axis. Advise"* → *"build
it with edge-to-edge axes only, keeping the long-axis first alignment"*.

- **The axes** (`faceFlushAxes`, `core/resting_face.ts`): every mirror line of the face that runs EDGE TO EDGE — through its centroid, crossing
  two parallel edges at right angles (`faceLongAxes`'s candidates, all of them; the two share `facePolygon`). ⛔ Never a diagonal or a corner
  to corner line: those poses cannot mate (and *"it cannot be the corner of the hexagone"*, 2026-10-05). A face with none (a triangle, an
  irregular part): its edges' normals (`fallback`). Computed when the face is chosen — the resting face at creation or at a tap
  (`restingFlush`), the pink face when the piece aligns to it (`alignFaceOf`'s `flush`, kept in `restRoll.pinkAxes`).
- **The roll** (`nextCoupleRoll`): of every couple (a resting axis, a pink axis) the smallest turn about the resting face's normal, CLOCKWISE
  ON THE SCREEN, making them parallel — an axis is a line, so each couple lines up every 180°; the couple already aligned is passed over.
  With no pink axis, the screen's horizontal. Quick taps add up; one 125 ms turn; 1 episode.

  | resting face on the blue rectangle (2 axes) | the edge roll (§11) | the couple roll |
  |---|---|---|
  | green base (rectangle, 2 axes) | 90° | **90°** |
  | turquoise end (hexagon, 3 axes) | 60° | **30°** — a flat axis ∥ the pink long axis, then ∥ its short axis |
  | a rectangle on a SQUARE pink face | — | **90°**, never 45° |

- **The first alignment is unchanged**: the two faces' LONG axes paired (§2). The CARRIED rolls of §13 use the couples.
- HUD: `aligned … · a1∥b0 (2 rolls)`; the verdict *"orbit: tap — roll 30°: resting axis a1 ∥ pink axis b1"*. On the green piece both couples
  line up at once (a0∥b0 and a1∥b1): one is named.
- **Checked headless** (`Scene_1`, real second-finger taps): green 90° per tap; turquoise 30° per tap through a2∥b0, a1∥b1, a0∥b0, a2∥b1; the
  orbit finger re-pressed in between changing nothing; no error. Vectors `tests/proto_resting_roll.test.ts` (rewritten): the axes of a
  rectangle, a hexagon, a square (no diagonal) and a triangle (the fallback); 90°/30° and back to the start; one pink axis gives the
  hexagon's 60°; clockwise through Babylon's projection; the face centre held at the anchor; the wiring.

## 13. A tap ON the orbited piece makes the face it hit the resting face (2026-10-09)

The owner: *"when a face of the green piece or the turquoise piece is left button tapped or first touch tapped, the hit face becomes the
resting face and it aligns. the roll to the next edge is then implemented on this new resting face"* — and *"when a new resting face is
selected and no change in the pink face, the numbers of rolls applied to the previous resting face shall immediately apply to the new
resting face"*.

- **The gesture** (`restingFaceTap`, `render/pointer_wiring.ts`): the FIRST touch (or the left button) pressed on the orbited piece — empty
  space to the router, so its drag still orbits — records the face it hit (the model's faces, `faceFromPickedNormal`); released as a TAP
  (§1.3's `isTapRelease`) with nothing else down, that face becomes the resting face. ⛔ Consumed: it is not one of a camera-reset double tap
  (a double tap ON the piece no longer resets the camera).
- **The new resting face** (`restOnTappedFace`): its candidate (`candidateForFace` — the rule's own, or the face alone when the rule had
  discarded it), its long axes, its symmetry axes, its edges and its pink fill rebuilt; the object model's resting face set to it (`TAPPED`).
  The same face as now: nothing rebuilt. Then the piece ALIGNS it (§2), 1 episode.
- **The rolls carried** (`carryRolls`): the pink face unchanged since the last alignment (`restRoll.key`), the same NUMBER of rolls is
  applied to the new face at once, inside the alignment's one turn; the pink face changed, they start again at 0.
- Headless: turquoise — 2 rolls on the hexagon, then a tap made side face f1 (4 edges) the resting face: aligned, the 2 rolls carried; a tap
  on the green piece's current resting face re-aligned it. Vectors `tests/proto_face_tap.test.ts`.

## 14. The pink face by a second-touch TAP on a placed piece (2026-10-09)

The owner: *"user can also change the pink face by second touch on placed piece while the first touch stays pressed"* — *"On a TAP"*
(chosen over the press: the painting covers much of the screen, and a pinch started on it must still zoom).

- While the first touch orbits, a second touch landing on a piece LOCKED in its goal — not the orbited piece — is a candidate
  (`pinkFaceTapCandidate`, `input/goal_lock.ts`): the face and the point it hit. The pinch starts as for any second touch off the piece.
- Released as a TAP (`isOrbitTap`: quick, never moved past the deadband, the orbit finger still down) the yellow target moves to that point
  and the pink face to that face — as the first touch's press on a placed piece does; moved (a pinch) or slow, nothing.
- The pink face having changed, the next tap on the orbited piece ALIGNS to it (`tapAction`), not a roll. ⚠ Touch only: the desktop has no
  such second touch (its right tap is the align / roll tap). Tied to `lockPlacedPieces`, as the first touch's rule.
- Headless: a tap on Piece4 → the pink face `Piece10/f1 → Piece4/f1`; a moved second touch from Piece5 zoomed (1.00 → 1.08) and changed
  nothing; the next tap on the orbited piece aligned to Piece4/f1. Vectors `tests/proto_pink_tap.test.ts`.

## 15. Outside the sphere, the orbit's dx ROLLS the piece (2026-10-10)

The owner: *"when the piece is outside the white sphere, I want the dx to also drive the roll to the next axis. In 45 degree orbit around the
piece I want all the axis to have rolled at least once. direction of the roll : clockwise if dx is to the right, whateve the ring position (1st
or 4th ring)"*.

- **When** (`orbitDragStep`): the piece outside the sphere (the way in or the orbit around the piece) and aligned. ⭐ Over
  `ORBIT_ROLL_SPAN_RAD` (45°) of the orbit's yaw the piece passes every stop of a HALF turn (an axis is a line, so a half turn visits every
  couple): one roll each 45° ÷ `coupleStops` — **green 22.5°, turquoise 7.5°**.
- **The count** (`orbitRollSteps`): the orbit's turn signed by the dx (right +) into whole steps, the rest kept; a turn back goes back
  through zero before it rolls the other way (no flicker on a boundary). ⭐ **A new drag starts it fresh** (`c68965a`; *"there seem to be the
  need for a bigger dx to trigger the first roll than afterwards"* — the leftover of the last drag was kept): every roll, the first included,
  one step from where the drag began. ⚠ The orbit has NO deadband (its yaw moves from the first pixel) — a first answer that blamed the
  3.5 mm motion deadband was wrong, and corrected.
- **The sense** (`nextCoupleRoll`'s `sense`): dx right **clockwise** on the screen, dx left **counter-clockwise**, from any ring. ⭐ The roll count
  is SIGNED (clockwise +1, counter-clockwise −1), so a new resting face carries over the NET rolls in their own sense (§13).
- Each roll is the tap's: one 125 ms turn about the resting face's centre; ⛔ no episode (the orbit is not scored).
- Headless: green rolled at 23.8° and 45.6° of orbit, turquoise every ~7.9° (6 rolls by 45.6°), back the other way on dx left; after a
  completed way in, the first roll one step in (7.96° / 1.85 mm). Vectors `tests/proto_resting_roll.test.ts`.

## 16. A new pink face leaves the piece alone; the piece BOOTS aligned to the floor (2026-10-10)

- ⭐⭐ **A new pink face no longer forces an alignment** (`6593b2f`; *"currently, a change of pink face triggers off the resting face
  alignment. I want the roll to continue even if the pink face has changed but I do not want the change of pink face to modify the alignment
  of the resting face (this shall still require a press)"*): the second-touch / right-click tap and the orbit's dx go on ROLLING, against the
  axes of the face the piece was last aligned to (`tapAction(aligned)`); aligning to the new pink face takes a **press on the piece** — the
  first-touch / left-click tap of §13. The rolls are carried over to it only if the pink face has not changed.
- ⭐⭐ **The piece boots ALIGNED TO THE FROZEN FLOOR** (`6593b2f`; *"at boot, all the pieces (not placed) have their resting face aligned with
  frozen object"* — *"so the roll is immediately active at boot"*): at the first frame after a spawn (the boot, a respawn, the switch between
  the green and the turquoise piece), once the orbit has placed it (`bootRestAlign`): its resting face turned AT ONCE against the floor's face
  toward it (`alignFaceOf(…, frozenOnly)`, the long axes paired — no ease, no episode), the piece counted aligned with the floor's axes as the
  reference. Headless, no tap at all: the HUD *aligned to Floor/f1*, dx rolled at once.
