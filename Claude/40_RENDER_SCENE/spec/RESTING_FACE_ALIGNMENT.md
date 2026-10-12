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

> ⛔ **The sphere is deleted (2026-10-11, §20)**: the dx roll runs on the held second touch's way in and round the piece; its 45° span, its step and its clamp stand.

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

## 17. The tap does nothing to the piece; every piece is aligned AT ITS SPAWN (2026-10-10, `1.0.63-`)

- ⛔⛔ **The second-touch tap and the mouse's right tap (while the left button orbits) no longer ROLL** (the owner: *"remove the increment
  of the roll by right button tap / second touch tap: this is superfluous as we have a roll movement already controlled by dx drag"*) **nor
  ALIGN** (*"The tap also aligns a piece that isn't aligned yet: remove that as the existing pieces are aligned at boot"*). `tapAction` is
  deleted; `orbitTapped` only counts the tap for the HUD (`taps N`) and consumes it — a second touch on the piece still never pinches — and it
  costs no episode. ⛔ So §2's *"the first tap is the resting-face alignment"*, §11's roll by a tap and §16's *"the tap goes on ROLLING"* are
  superseded. What is left: the roll is the orbit's dx (§15); a new resting face is a first-touch / left-click tap ON the piece (§13); a new
  pink face is a second-touch tap on a placed piece (§14).
- ⭐⭐ **RULE — a newly spawned piece has its resting face aligned AT ITS SPAWN** (the owner: *"write in the md file that for new spawn
  pieces, the resting face alignment shall be done at spawn"*): any piece that enters the orbit — the boot, a respawn, the switch between the
  green and the turquoise piece, and any piece a later level spawns — is aligned on its first frame, before any input (§16's
  `bootRestAlign`, set by the spawn in `green_box_wiring.ts`), so no gesture is ever needed to make a piece aligned. ⚠ A future spawn path
  that bypasses that function must set `st.bootRestAlign = true` itself; `tests/proto_resting_roll.test.ts` pins that the spawn sets it.
- ⭐ **Amended the same day** (§19): the second-touch / right tap ALIGNS again — but only to a NEW pink face.

## 18. The YAW and the PITCH outside the sphere (2026-10-10, `1.0.63-`)

> ⛔⛔ **DELETED 2026-10-11 (§20)** — *"No need for yaw- nor pitch-to-the-next-face. No need for faces paths."* The record below stands as history; the code (`core/tumble.ts`, the trail, the held-touch pause) is gone. ⭐ Kept from it: the pinch's dx gate.

> *"how do you suggest I do to yaw the object so that the next face can be aligned as resting face with a movement similar to the roll to
> the next axis when the piece is outside the white sphere"* → *"yaw the object around gravity axis"* → *"we need a yaw if the resting face is
> vertical and a pitch if the resting face is horizontal"* → *"build the yaw and pitch"* — the owner, 2026-10-10, then four rounds the same day.

**The input** (only outside the sphere, the piece aligned — it is from its spawn, §17):

| | mobile | desktop |
|---|---|---|
| hold | a SECOND touch pressed OFF any placed part (empty space, the floor, the orbited piece) and kept STILL — within the deadband (`motionDeadbandMm`) along x and y | the RIGHT button, pressed while the left one orbits |
| move | the FIRST touch (the orbit finger), dx or dy | the left drag, dx or dy |

- ⛔ The first build's two-finger PARALLEL slide is deleted, with its spacing tolerance and its pair rule (*"the input shall not be two-finger
  dx or two finger dy"*).
- ⛔⛔ **THE HELD TOUCH DRIFTING, AND THE ORBIT THAT CAME BACK** (2026-10-11, the owner on the glass: *"when i swap from dx to dy and back and
  forth, at one point the yaw-pitch stops. I think there is some pollution with forward orbit and the piece crosses the white sphere even if
  the second touch is presses"*). Reproduced headless: the held touch was judged against its PRESS point, so a resting fingertip's creep
  added up; past 3.5 mm the yaw / pitch was DROPPED for the gesture, and the first finger fell through to an older rule — a second touch on
  the orbited piece *keeps the first finger orbiting* — whose dy carried the piece from 3.00 m to 1.29 m, through the white sphere, the
  second touch still pressed. ⭐ Now:
  - the held touch is judged against a TRAILING anchor (`heldStep`, §1.1's model): past it the yaw / pitch PAUSES — the first finger's
    moves count for nothing, its travel reference following it — and once the held touch has been still for 150 ms (`HELD_SETTLE_MS`) it
    RESUMES from where the first finger is, without a jump;
  - both fingers moving ACROSS (the zoom's dx gate, below) hand the gesture to the ZOOM until a finger lifts;
  - ⛔ once armed, NEVER the orbit while both fingers are down — the old *keeps orbiting* rule stands only where no yaw / pitch is armed
    (inside the sphere).
  ⭐ The desktop needs no such fix: with both buttons held the mouse layer swallows every cursor move, so the orbit pointer cannot move, and
  a button cannot drift; releasing the right button hands the drag back to the orbit, by design. Headless after the fix: the same drift
  PAUSES (the piece stays at 3.00 m, outside the sphere), the next dy RESUMES; a pinch from an armed gesture zooms (1 → 0.77).
- ⭐ **The axis** — whichever of dx and dy FIRST passes the deadband: **dy PITCHES; dx YAWS on a vertical resting face** and **ROLLS on a
  horizontal one** (a turn about gravity is the roll there — the owner: *"the two-finger dx should do the same as the roll"*). Back within
  the deadband along it, the choice is UNDONE and the next axis out owns it (*"the selection is reset if the first delta selection comes
  back into its deadband"*).
- ⭐ **The steps** — one face per `tumbleStepMm` (12 mm, CAMERA ORBIT AROUND PIECE, *yaw / pitch: travel per face*), signed (right / up
  forward), back through zero before the other way. Each step is one turn eased over the alignment's 125 ms, then the new face's couple of
  edge-to-edge axes put back on the pink face's by the smallest spin (`nearestCouple`, as the roll keeps it), the roll count started again.
- ⛔⛔ **THE CLAMP** (*"when the dx is too fast, the piece makes strange movements. consider clamping"*): ONE turn in flight — a step only once
  the last one landed, one at most; travel a fast move crosses meanwhile is DROPPED, never queued. ⭐ The cause, found by reading: two
  queued steps were a turn past 180°, and the ease took the SHORTEST way there — about another axis. The orbit's dx roll (§15) has the same
  clamp.
- ⭐ **THE RESET** — the move STOPS (no travel, in any direction, for 250 ms — `TUMBLE_REST_MS`): the axis, the turn and the path start again
  with the next travel (*"then reset when the delta position stops"*). ⚠ A move slower than ~4 mm/s counts as stopped.

**The geometry** (`core/tumble.ts`, engine-free):
- ⭐⭐ **The piece tips over its resting face's EDGES** — the turn axes are its EDGE directions (`edgeDirections`): YAW about the one closest to
  gravity, PITCH about the one most across it (a horizontal face: the one most along the screen). ⛔ The first build turned about the face's
  symmetry axes ACROSS ITS FLATS — on the turquoise's hexagonal end the plane across a flat runs through two opposite CORNERS, meeting the
  side faces only along an edge, so it jumped end to end (*"the turquoise piece does not pass through the lateral faces"*). A rectangle's
  edges run along its symmetry axes: the green piece is unchanged.
- ⭐⭐ **The next face — THE SECTION LOOP** (`nextTumble`): the plane through the resting face's centre, perpendicular to the turn axis, cuts a
  ring of faces — Blender's *bisect* rather than its quad *face loop* (Alt+click, through opposite edges), which breaks at a triangle or a
  pole (a faceted bowl's bottom). Of the faces it cuts — **hull faces only** (a piece rests on its convex hull; a concave piece walks its
  outer ring) — the next is the first the turn reaches in its sense; the step is the angle between the two normals in that plane, and a
  slanted face's leftover tilt is taken out so the new face is exactly where the old one was. Headless: the green piece (a frustum) 105° /
  81°; the turquoise 90° end ↔ side, 60° side ↔ side.
- ⭐⭐ **THE PATHS AND THE SWAP** (*"if the path brings the starting resting face back swap to the other movement … while the delta position
  continues"* → *"make each swap move on to the next edge direction and generalize that in case of a more complex geometry (for example
  multifaceted sphere)"*): a path is WHOLE when it is back on the face it started from with a net count (out and back is no path), or has
  turned a FULL TURN (a faceted sphere's loop need not come back to its face). The same move then goes on about the face's NEXT edge
  direction (`nextEdgeAxis`): a rectangle alternates its two (yaw, pitch, yaw …), a hexagon takes its three in turn, any polygon all of
  them; yaw and pitch alternate as names.
- ⭐⭐ **REVERSED** (*"make sure the faces paths are reversed if the input goes in the other direction"*): the paths of one gesture are a
  TRAIL (`trailBefore` / `trailAfter`). The input reversed walks the faces back — within a path, and ACROSS a swap: back at a path's start,
  the next step back drops it and walks the previous path backwards; going on again re-enters the next edge direction. A path made whole
  going backwards moves on the other way round the edge directions (the order mirrored). Headless, one gesture on the turquoise: up f7 → f5
  → f6 → f2 → f7 ⟶ f3 → f6, then down f6 → f3 → f7 ⟶ f2 → f6 → f5.

**The zoom** (*"zoom can only be done if the two touches move beyond their dx deadbands"*): a pinch zooms only once BOTH fingers have
travelled past the deadband ACROSS the screen (x) since it began (`pinchDxOpen`), then as before — so a second touch held still while the
first moves is never a zoom. Everywhere a pinch zooms.

⚠ No step costs an episode (as the dx roll). `tests/proto_tumble.test.ts`; every rule above falsified on purpose (hull, section plane,
tilt, smallest step, yaw axis, back, next, full turn, unlatch, held still, both dx, the mirrored order).

## 19. The tap aligns to a NEW pink face (2026-10-10, `1.0.63-`)

> ⛔ **Superseded 2026-10-11 (§20)**: the second-touch tap is gone; the held second touch's PRESS on a placed part's face takes the pink face and aligns to it.

> *"previously, there was an alignment triggered by an input when the pink face was changed: what was the input? How could we reinstate
> this alignment now"* → *"build it with old input"* — the owner.

The second-touch tap on the orbited piece (mobile) or the right tap while the left button orbits (desktop) ALIGNS the resting face to the
pink face — the long axes first, no rolls carried (the pink face changed), one episode — when that face is NOT the one it was last
aligned to (`tapAlignsToPink`); the same face: nothing, so the rolls, yaws and pitches made since stay. So a new pink face is two taps — one
on a placed piece to pick it (§14), one on the piece to align — and changing the pink face still aligns nothing by itself (§16). ⚠ At boot
the piece is aligned to the floor while a pink face is already set: the first tap on the piece aligns it to that pink face.

## 20. THE HELD SECOND TOUCH — the way in, round the piece, the way out; the pink face (2026-10-11, `1.0.64-`)

> *"the way in and way out can be done anywhere if the conditions are satisfied … Remove the white sphere and all sliders and all conditions
> associated with white sphere entirely … Second touch on mobile equals right click on desktop … Second touch on any object's face (except
> the green and turquoise pieces themselves) selects the pink face and aligns the resting face with the pink face. This does not trigger a
> change in the center of orbit … Second touch pressed anywhere (except the green and turquoise pieces themselves) && first touch dx drag
> (beyond the deadband) triggers the way in and piece orbit … and controls the roll to the next-axis … Second touch released triggers the
> way out … While second touch is held, first touch release and re-press does nothing (i.e. continuation of previous input) … No need for
> yaw- nor pitch-to-the-next-face"* — the owner, 2026-10-11, then ten points settled before the build.

⛔⛔ **The white sphere is DELETED**, with its rule (`outsideSphere`, its hysteresis), its frame, its mesh, its two sliders and its HUD text;
and the yaw / pitch (§18) with it. At boot the camera orbits the centre; nothing enters the orbit round the piece by itself.

**The roles** (`hold_gesture.ts`, `hold_wiring.ts`):

| | mobile | desktop |
|---|---|---|
| **second touch** | a finger pressed while ONE other is down on empty space | the RIGHT button, with or without the left |
| **first touch** | the other finger — lifted and pressed again while the second is held: the SAME input goes on | the left button |

- ⛔ A second touch ON the orbited piece is no second touch (it can still pinch). Neither touch grabs a part or moves the orbit centre while
  the second is held — a first touch pressed again on a placed part included (*"continuation wins"*).
- ⭐ The desktop's right button is never moved by the cursor and never latched (its old HitFace role, `D94`/`D161`, is the parts game's).

**What it does**:

| | |
|---|---|
| **second touch pressed** on a PLACED part's face | the pink face — ⛔ never a frozen body (the floor: empty space), never the orbited pieces; taken **at the way in, or at the release** if it never pinched (*"option B"*; ⭐ since later the same day: **at the press**, below); the SAME face again: nothing (⭐ later: the highlights shown); a new one: the resting face aligned to it (the long axes first, no rolls carried), one episode, ⛔ the orbit centre unchanged |
| **first touch dx past the deadband**, the second held | decided there (`holdDecision`): the second touch's x travel within HALF the deadband — the **WAY IN**, then the orbit round the piece and the **roll** (dx only, its count from the way in's start, carried across a re-press); past half — a **PINCH** (the zoom, from where it is decided). Latched until the second touch lifts |
| **first touch dy** while the second is held | ignored |
| **first touch lifted and pressed again** | the same input: the roll's count kept, ⛔ no coast, no centre change |
| **first touch TAP on the orbited piece**, the second held or not | the face hit becomes the resting face, aligned (the rolls carried if the pink face is unchanged) — §13 |
| **second touch released** | the **WAY OUT** if the way in had started — from the camera as it is (a way in cut short too), its progress the first touch's NEXT travel (`pieceOrbitReturnMm`, 30 mm), the pink face unchanged; a release before any dx: the pink face taken (above) |

- ⭐ **Finger travel, not time** (*"Continue with finger travel … Way in way out Sliders stay"*): the way in runs on the first touch's dx
  (`pieceOrbitEnterMm`, 12 mm, its view re-aimed by dx), the way out on its next travel. ⚠ So a way out started with no finger moving waits
  for the next drag — releasing both fingers mid-way leaves the camera round the piece until then.
- ⭐ **No jump, no back-and-forth**: each transition starts from the camera as it is — the way out from a way in cut short, a way in again
  from a way out cut short. Headless: an interrupted way in turned back and in again with a largest camera step of 0.089 m per 4 px move; the
  way in itself ramps 0.25 → 0.07 m per move (about 2 m over its 12 mm — the slider is the dial).
- ⭐⭐ **The highlights** (*"Pink face and resting face show pink highlights for a certain time (slider for timer) and then highlights fade
  gradually and rapidly away. Set default timer 750 ms"*): the resting face's fill and the pink face's (a fill on its body) show while the
  input runs, then HOLD **750 ms** (300 ms since the same day), then FADE over **250 ms** (`highlightAlpha`); none at boot; a first-touch tap on the piece shows them
  too. ⭐ ONE slider with TWO cursors (*"Do one slider with two cursors"*): CAMERA ORBIT AROUND PIECE › *pink highlights* — cursor 1 the
  hold's end, cursor 2 the fade's end (moving the hold carries the fade). ⚠ The pink RING stays where it was — at the orbit centre, the
  yellow target: it marks the orbit's centre now, no longer the pink face (the second touch does not move the centre).

Headless (both devices): the way in, the roll, the continuation across a lift and re-press, the way out by travel, an interrupted way in, the
pink face from a press on a part (aligned, rolls reset), the zoom of two fingers apart, the highlights gone 1.3 s after the input; the
mouse with the right button first or second. `tests/proto_hold.test.ts`; each rule falsified on purpose (half deadband, frozen, same
face, fade, a pinch keeping the pink face, the coast, dy).

**Amended the same day (2026-10-11, after the first deploy)**:

- ⛔ **A second-touch tap on empty space lit the highlights** (*"why a second touch tap outside any object still highlights the pink face and
  the resting face? Which pink face is selected in such case? There should not be any action"*): they followed *"the second touch is down"*,
  not an action — no pink face was selected, the current one (and the resting face) were shown. ⭐ Now they show only after an ACTION — the
  pink face taken, the way in started (`hold.shown`), or a resting face tapped; a tap on empty space, an undecided hold or a zoom show nothing.
- ⭐⭐ **A SECOND-touch tap on the orbited piece selects the resting face too** (*"add the possibility of selecting another resting face by
  second touch tap on the green or turquoise piece"*) — as the first touch's (§13): the face it hit, aligned, the rolls carried if the pink
  face is unchanged; on a desktop a right click on the piece. Any touch pressed on the piece is the candidate, decided at its own release as
  a tap (others down or not).
- ⛔⛔ **The piece moved toward −z when the second touch lifted after a roll** (*"At the end of the roll to the next axis, the object
  systematically translates towards the world's negative depth axis when second touch is lifted. Correct that"*): the way out
  (`returnToCentreOrbit`) measured the piece's offset from the rings at the MESH's origin, while the point that rides the rings since
  2026-10-09 is the resting face's centre (the anchor) — so at the release the piece moved by its middle-to-face distance (20.6 mm headless,
  always the same way relative to the resting face); the way in (`enterPieceOrbit`) read the same wrong point. ⭐ Both read the ANCHOR now:
  the release moves it 0 mm; the way in shows no jump (its steps ramp from 0 and back to 0 — the designed hand-over).
- ⭐⭐ **On a desktop the held second touch is ALT or CTRL, no longer the right button** (*"replace anything with right click by left click +
  CTRL. Does that create conflict?"* → *"instead of CTRL, if I use ALT is it better? (for Mac, etc.)"* → *"build with ALT and CTRL and with your
  recommendations"*). ⚠ The conflict: one left button cannot be both touches — so the KEY is the held second touch and the left button stays
  the first: **key held + left drag dx** — the way in, round the piece, the roll; **key released** — the way out; the left released and pressed
  again while the key is held — the same input; **key + left click on a placed part's face** — the pink face (the key points at nothing, so
  the click names the face; no centre change); a left click on the orbited piece — the resting face; ⛔ the RIGHT button does nothing in the orbit now. ⭐ EITHER key: ALT (Option)
  on a Mac, where CTRL + click is the system's right click; CTRL on Linux, where ALT + drag moves the window; both on Windows. The key-made
  second touch sits at the cursor, never picks, is never driven; a key release missed outside the window is caught by the next pointer event
  (or the window's focus loss) and counts as the release. The wheel was already blocked on the canvas (no page zoom with CTRL, no history with
  ALT). The parts game's right-button roles (`D94`/`D161`) are untouched. Headless: CTRL + left drag — the way in; CTRL up — the way out;
  ALT + a click on a part — the pink face at ALT's release; a right click — nothing.
- ⭐⭐ **The desktop's pink face at the CLICK, the key still held** (*"to select a face, the CTRL/ALT has to be released: this is not practical:
  it should be while CTRL/ALT is pressed, left click tap defines the new pink face. Does that asymmetries with mobile input?"*): the key + left
  click TAP on a placed part's face takes the pink face at the click's release (a click that becomes a drag takes it at the way in, as
  before). ⭐ No asymmetry in substance: on a tablet a second finger's tap on a part takes it at that finger's release — the face is taken when
  the touch that NAMED it lifts, on both; the tablet waits for the release only because a second finger on a part may be starting a PINCH
  (option B), and a mouse cannot pinch. Headless: ALT + a click on a part — the pink face at the click, ALT still down.
- ⭐ **The highlights' defaults: hold 300 ms, fade 250 ms** (*"set default hold = 300 ms fade = 250 ms"*; the hold was 750 ms).
- ⛔⛔ **"The same face again: nothing" now means the face the piece is ALIGNED to** (*"when I left click on a new face and then CTRL+left
  click on the same face, the pink face is on this face but the piece's resting face does not align with it. the logic is broken in this
  case. fix it"*): a plain left click on a piece locked in its goal moves the orbit centre AND makes its face the pink face, without aligning;
  the rule compared with the PINK face, so the key + click on that same face read as nothing to do. ⭐ `pinkChanges` compares with the face
  the piece was last aligned to (`restRoll.key`): not aligned to it yet — it aligns; already aligned — nothing, the rolls kept. The same for
  a second finger pressed on a part. Headless on `Piece3`: a plain click — pink `Piece3/f1`, still aligned to the floor; CTRL + click — aligned
  to `Piece3/f1`; again — nothing.
- ⭐⭐ **The pink face AT THE PRESS, both devices** (*"currently, the change of pink face is done when CTRL is held and left button is tapped. I
  want to also be able to do with CTRL held and left button is pressed (immediately when left button is pressed). Same for the mobile input"*):
  the key held + a left PRESS on a placed part's face (the way in started or not; never during a zoom), and a second finger's PRESS on one,
  take the pink face at once — the release-time take is deleted. ⚠ Cost, named and chosen: *option B* is undone — a pinch whose second
  finger lands on a part changes the pink face before the zoom is told apart. Headless: CTRL + a left press on `Piece3` — aligned to
  `Piece3/f1` with the button still down.
- ⭐ **The same face again SHOWS the highlights** (*"if the same pink face is selected again, display the highlights (otherwise, it looks like
  something is not working)"*): nothing is realigned (the rolls kept), but the pink face and the resting face are shown as for a new one; the
  HUD says *"the pink face is already … — shown"*. Headless: after the fade, CTRL + a press on the same face — the highlights back (0 → 0.6).
- ⭐⭐ **The zoom by the SECOND finger alone** (*"zoom: make it possible also if first touch is immobile and second touch dx exit deadband"*):
  the second touch's dx leaving its deadband — the first touch still or moving — is a ZOOM at once (`holdDecision`, judged now at either
  touch's move); and the pinch's own gate opens on the second finger's dx alone (`pinchDxOpen` — both fingers' before). ⛔ The first finger
  moving alone is still never a zoom: it is the way in. Headless: the first finger still, the second apart in x — zoom 1 → 0.883, and back
  1.006; no way in.
- ⭐⭐ **The desktop's key ACTS ON ITS OWN PRESS** (*"modify in desktop mode: instead of CTRL + left click press or tap, the action is triggered
  directly by CTRL being pressed or tapped : this sends a raycast which first hit is the item on which the action is triggered"* — *"CTRL or ALT
  (both are equivalent)"*): pressing ALT or CTRL casts a ray at the cursor — over a **placed part's face**: the pink face, aligned at once (the
  same face: the highlights); over the **orbited piece**: the face hit becomes the resting face, aligned at once; over **empty space** (or the
  floor): nothing more. In every case the key is the held second touch until it is released (a left drag meanwhile: the way in; its release:
  the way out). ⛔ The left click names nothing any more (the key + left press / tap route is deleted). The key-made second touch now PICKS
  (it was anchor-only). Headless: CTRL over `Piece1` — pink `Piece1/f4`, aligned; ALT over the piece — its resting face 5 → 4; ALT held + a
  left drag — the way in; ALT up — the way out.
- ⛔⛔ **A CTRL tap mid-orbit made a way in and a way out at once; a CTRL held could freeze the orbit** (*"why when I tap CTRL during a dx orbit
  around the center, the piece jumps and come back?"* — *"there are times when CTRL while orbiting selects a pink face and while held it completely
  freezes the orbit : this is not happening always"*). The causes: (1) the key pressed during a drag is the held second touch, and the drag's dx
  crossed the deadband within a few pixels — the way in — then the key's release — the way out: the jump and the return; (2) while UNDECIDED
  (the key held, the dx not yet past the deadband) nothing moved, and with dy ignored a drag mostly in dy never decided — frozen for as long as
  the key was held; the follow camera, told the drag had stopped, settled too. ⭐ Now: **a TAP never starts the way in** — the second touch held
  less than the tap time (`tapMaxDuration`, 200 ms) leaves the decision open (`holdDecision`'s `heldMs`); and **undecided, the drag orbits the
  CENTRE** (dx and dy) as before the key, the camera following it — the way in, when decided, starts from there. Both devices. ⚠ A deliberate way
  in begins at the earliest ~200 ms after the second touch's press. Headless: a CTRL tap mid-drag — no way in, the orbit went on; CTRL held
  through a dy drag — the elevation moved (−0.27), no freeze.
- ⛔⛔ **The orbit centre and the pink face are TWO SEPARATE ACTIONS** (*"left click on new face …, then ctrl pressed and held on empty, then
  left click drag on dx while ctrl is still pressed: the new face highlights as pink face but the resting face does not align with it"* → *"no,
  the problem is not the alignment with the current pink face. The problem is that I did not ask to change the pink face"* → *"somewhere during
  the modifications, you forgot that I need to specifically select a new pink face. changing the center of orbit and selecting a new pink face
  are two separate actions, not linked together"*). A plain first touch / left press on a part moved the orbit centre AND made its face the
  pink face — `1.0.59q-`'s *"a press that MOVED the target puts the pink ring on THIS face"*, from before the second touch existed, and kept
  through every change since: so a later way in highlighted a face nobody had picked, the piece not aligned to it. ⭐ Now the plain press moves
  the ORBIT CENTRE only; the pink face is changed ONLY by the second touch (a finger, ALT / CTRL). ⚠ My first reading (align to the current
  pink face at the way in) was wrong and withdrawn before it shipped. Headless: a plain click on a part — the pink face unchanged; CTRL on
  empty space, then a left drag — the way in, the pink face still unchanged.
- ⭐ **The boot pink face is the FLOOR's face the piece is aligned to** (*"the boot pink face could be the floor's face, matching the
  alignment"*): it was the blue piece's face (the boot orbit target's, `bootTargetOnBlueFace`) while the piece was aligned to the floor — a
  way in highlighted one face while the roll lined up with the other. Now `bootRestAlign` makes the floor face the pink face too (at a
  respawn as well); the boot target sets the orbit centre only. ⚠ A frozen face's pink fill is not drawn. Headless: boot — pink `Floor/f1`,
  aligned to `Floor/f1`.
- ⭐ **A switch hides the pink gizmo** (*"add a slider to hide the pink gizmo"*): CAMERA › CAMERA ORBIT AROUND CENTER › *pink gizmo (the orbit
  centre's ring): shown* (`pinkGizmoVisible`; 0 = hidden). ⚠ Hidden by default for a few minutes (*"make the default pink gizmo hidden"*), then ⭐ **shown by default again** (*"set the default : pink gizmo shown"*): it ships at 1.
- ⭐⭐ **The keyboard's older second touches are OFF in the orbit** (*"why space + left click change pink face ? which other keyboard keys are
  active ?"* → *"switch Space (and probably Shift + drag) off in the orbit. leave shift tap for the moment"*). Space + click on a part latched
  `D154`'s HitFace as a made-up second touch, and the orbit read it as its HELD second touch — so it took the pink face; Shift held through a
  drag (`D94`) made one too. ⭐ While a piece is orbited both reach the mouse model as up (`orbitModifiers`, `input/mouse_second_touch.ts`): no
  Space HitFace, no `D155` freeze, no Shift-made second touch — ALT / CTRL is the orbit's one key-made second touch. ⚠ Kept: the Shift TAP
  (`D167`'s translate / rotate toggle), Esc, Space still never scrolls the page, the wheel zooms.
- ⭐⭐ **A first touch held on a PART is the held input's first touch** (*"left click on a face and held then CTRL on the another face and held
  (sets the new pink face->OK) then drag: the drag freezes the scene while the left click and CTRL are held. Why? I think this should enable the
  roll to the next axis"*). Why: a press on a part is an OBJECT pointer, and the held input took its first touch only from the EMPTY-space
  pointers — so the input had none (`first: null`) and the part's own orbit drag stops once a second pointer is down: nothing moved. ⭐ Now a
  first touch on any part (placed in its goal or not; ⛔ never the orbited piece) is taken as the first touch (`partFirst`): its drag decides as
  from empty space — the way in, then the orbit round the piece and its dx roll — and the part itself never moves; its release lifts the first
  touch (the input goes on). A finger the same on a tablet. Headless: left held on a free part → CTRL → drag: `WAY`, the camera turned, `dx →
  roll 90°`; the same from a placed part, and after a left drag from a free part to a placed one.
- ⭐⭐ **The second touch's TAP, the first held, ROLLS to the next axis** (*"left click held + CTRL/ALT tap on empty or on the pink face (=first
  touch held + second touch tap on empty or on the pink face) rolls to the next axis"*): a tap of the second touch (within the tap time, never
  the way in nor a zoom) while the first touch is held, whose press changed NO pink face — empty space, a frozen body, or the current pink face
  — and named no resting face (not over the orbited piece): the piece rolls ONE stop, clockwise as seen from the camera (`rollRestingFace`, the
  same step as the orbit's dx roll), one episode, the highlights shown (`holdTapRolls`, `input/hold_gesture.ts`). A press that took a NEW pink
  face aligns to it and rolls nothing; the next tap on that face rolls. ⚠ A tap with no first touch held does nothing, as before. ⛔ It brings
  back a tap roll (`tapAction`'s, deleted 2026-10-10) only in this form. Headless: left held on empty space + CTRL tap — 1 roll, again — 2;
  CTRL tap alone — none; left held on a part + CTRL tap — the new pink face, aligned; + CTRL tap — 1 roll.
- ⭐⭐ **2026-10-12 — ZOOM ↔ WAY IN + ROLL WITHOUT LIFTING** (*"How does zoom and roll to the next axis work in mobile? … Can we modify so we can
  swap from one to another without releasing any of the two touches?"* → *"Build with the 150ms rest. No change for desktop."*). Before, the first
  decision (`holdDecision`) was LATCHED until the second finger lifted: to swap, lift it (the way out after a way in) and press again. ⭐ Now, once
  decided, **the finger that moves decides again** (`holdSwitch`, `input/hold_gesture.ts`):
  - **way in + roll → zoom**: the SECOND finger's dx past the deadband, measured from where it RESTS (a trailing anchor, `trailAnchor`) — the zoom
    starts from the fingers' distance then, no jump;
  - **zoom → way in + roll**: the second finger at rest for **150 ms** (`holdSwitchRestMs`, a slider in CAMERA › CAMERA ORBIT AROUND CENTER, 0–600)
    AND the FIRST finger's dx past the deadband since it came to rest — the way in made then if it was not yet (else the orbit round the piece and
    its dx roll go on).
  The second finger's lift still ends the input: the way out if the way in was ever made (`wayIn`), from a zoom too. ⚠ Cost, named and chosen: in
  a zoom the first finger alone used to zoom as well (the pinch reads the fingers' distance); once the second has rested 150 ms it rolls instead —
  a pinch with both fingers moving stays a zoom. ⛔ The desktop is unchanged (ALT / CTRL has no position; its zoom is the wheel). Headless (touch):
  first dx — the way in, 2 rolls; second dx — zoom 0.88; a 300 ms rest, first dx — the roll again (4 rolls); second dx — zoom; a 50 ms rest, first
  dx — still a zoom; the second lifted from the zoom — the way out.

## 21. THE ORIENTATION CUBE — the level's set of pink faces, on the glass (2026-10-12, `1.0.67-`)

**Why** (the owner): *"There is some confusion between the pink gizmo and the pink face. Both are not linked because I want to be able to align
the resting face to a pink face which is not systematically the face supporting the pink gizmo: this enables smart decisions how to align the
resting face in few episodes by choosing the best pink face possible. However, the roles of pink gizmo and pink face get confusing. … would it
be possible to provide the pink face - resting face alignment function by the resting face replicating the orientation of something on the
screen … Check literature of state-of-the-art implementation and propose alternatives to our current design."*

**The finding the design rests on**: a pink face gives the alignment ONLY a direction (its outward normal) and its edges' directions (the roll's
axes) — never a position, never which part it belongs to. So the scene's DISTINCT face directions are the whole alphabet of pink faces. In
`Scene_1` every goal pose is `orientation: "identity"`: six directions, a cube — the "smart choice" was a search over 41 parts for a face
that points the right way; it is one tap on a facet.

**Literature and practice weighed** (the proposal of 2026-10-12): the ViewCube (Khan et al., I3D 2008) and Blender's navigation gizmo — a small
faceted proxy you click to pick an orientation, here for the PIECE rather than the camera; World in Miniature (Stoakley et al., CHI 1995) and
Voodoo Dolls (Pierce et al., I3D 1999) — act on a proxy, the object follows; snap-dragging (Bier 1990) and CAD's face-to-face mates — a small
discrete set beats a free turn; constrained multitouch rotation (tBox, Cohé et al. GI 2011; Au et al. EG 2012; Sticky Tools, Hancock et al.
ITS 2009) — a few large fixed targets on a tablet; rotation-matching studies (Hinckley et al. 1997; Bade et al. 2005) — a preview helps.
Four alternatives were proposed: (1) separate the colours of the ring and the pink face, (2) ⭐ an orientation cube fixed in a screen corner,
(3) the cube on the ring (rejected: it links the two again, moves, shrinks and is occluded), (4) a phantom of the orbited piece (the resting
face, with a preview) — later. ⭐ The owner: *"Start with 2, sit against this face."*

**The rule, as built**:
- **The polyhedron** (`core/orientation_set.ts`): the face frames of every **SEATED** part (placed in its goal, the last commit's) and every
  **frozen** body (the floor) — ⛔ never the orbited pieces — clustered within 1° into distinct directions (`distinctDirections`, each with
  the union of its faces' edge axes); the polyhedron is the bounding box `[-1.6, 1.6]³` cut by the plane `n · x = 1` of each direction
  (`facetPolytope`) — one facet per direction; what is left of the box (only when the set does not close the shape) is grey and not a
  direction. `Scene_1`: a cube.
- **Rebuilt** at the boot's goal baseline and at every goal commit — a part seated, or unseated (*"at boot of the scene and also each time a
  part is seated"*): `commitGoal` sets `orientDirty`.
- **The window** (⭐ amended below: it COPIES the host part, and a slider places it): bottom-right, **22 mm** on the glass × **the slider** — the tuning menu, CAMERA › CAMERA ORBIT AROUND CENTER › *orientation cube
  window: size (% — 0 hides it)* (`orientCubeSizePct`, 0–200 %, 100 by default; *"Make a slider 0-200% to increase the size of the cube
  window in the overlay (zero means hiding the window)"*), 4 mm from the edges, a translucent backing. Drawn in the scene in its own
  rendering group (nothing hides it), turned as the world is seen from the camera — corrected to the view through the screen's centre, so the
  corner's perspective does not skew it. Shown only with an orbited piece.
- **Tap a facet** → the resting face **SITS AGAINST** it (*"sit against this face"* — the same anti-parallel alignment as a part's face): the
  facet is a **virtual pink face** (`st.pinkDir`), read FIRST by `alignFaceOf` (its normal, its edge axes as the long axes and the roll's
  axes); the scene's pink face is cleared (its fill goes). One episode; the resting face's highlights shown, then faded.
- **The lit facet** (pink): the direction the piece is aligned to (`pinkTargetNormal`, set by every alignment), whatever gave it — a facet, a
  part's face, the boot's frozen face. **Tap the lit facet** → the roll to the next axis (`rollRestingFace`), one episode.
- A part's face taken by the second touch (`takePink`) and the boot alignment clear the virtual one: the last choice wins.
- **A press inside the window is the cube's**, before the router (`orientCubePointer`): it never orbits, never grabs, never moves the centre;
  a tap on a facet acts at its release; the desktop's ALT / CTRL key-made second touch is not the cube's.
- ⛔ FIXED the same day (below, *"Fix the boot"*). Found while building it: the boot's frozen face (`Floor/f1`) was the floor's **−z side**, not its top — `alignFaceOf`'s fallback
  measures "toward the piece" from the floor's FIRST face's centre (`f0`, its +z side, 1 m away), not from the body's centre, so the boot
  lit facet is −z. Recorded, not changed (it is the boot alignment the owner accepted on 2026-10-11); a one-line fix if it is not meant.
- Headless (desktop and touch): six directions at boot (a cube, two edge axes each); a tap on +x — the resting face against it, 1 move, the
  facet lit; again — a roll, 2 moves; a tap on +y — the piece down on its resting face, the top lit pink; 200 % — the window doubled; 0 % —
  hidden; a drag started in the window — no orbit.

⏭ **A possible later refinement** (the owner): *include the NON-SEATED parts in the possible directions* — their faces would join the set as
they move, which makes the game heavier: the set (and the polyhedron) would have to be read again EVERY FRAME, not at a goal commit.
⏭ Then alternatives (1) and (4) above, if wanted.

**Amended the same day (2026-10-12)**:
- ⭐⭐ **Occlusion and a stronger highlight** (*"cube's face highlight: make it more opaque and occlusion applies on the cube's faces, because at
  the moment, the back face is more visible than the highlighted face in the front and that causes confusion"*). The facets were translucent
  with no culling, so a back facet showed through the front one. ⭐ Now only the facets turned TOWARD the camera are drawn (back-face culled;
  the edges of the others hidden, each frame), the part's copy is solid behind them; a plain facet is faint glass (alpha 0.16), the lit one a
  strong pink (0.85).
- ⭐⭐⭐ **The window is a COPY OF THE SCENE: the part that hosts the pink gizmo, the gizmo on it, the polyhedron over it** (*"Instead of a cube,
  represent the cube overlaid onto the part which hosts the pink gizmo. Also show the pink gizmo in the overlaid part. So the window is a
  replicate of the scene (part and gizmo) on which the cube / polyhedron is overlaid"*).
  - The **host** (`st.centreHost`): the part a press put the orbit centre on (`orbitTargetOnPress`), the blue piece at boot
    (`bootTargetOnBlueFace`); a barycentre (an empty-space press, off in this build) has none — then the polyhedron alone.
  - The **copy**: the host's contour and its core (`clone`, never pickable, never a body), as they stand in the world.
  - ⛔ (reversed below, the same day) The **polyhedron FITTED around it** (`supportOffsets`, `core/orientation_set.ts`): each direction's plane just outside the part's extent
    along it (4 % of its radius) — for a box part and six directions, the part's own box: a tap on the part's face in the window IS that
    direction; a direction no face of the host has cuts an edge or a corner off it.
  - The **pink gizmo's copy**: a pink ring where the scene's ring is (`st.pinkRing`'s position), billboarded and placed in the world each frame
    (⛔ never parented — a billboard drops its parent's rotation), lifted toward the camera so the part's face never hides it; shown with the
    gizmo's own switch (`pinkGizmoVisible`).
  - Rebuilt when the host changes, as well as at every goal commit.
- ⭐⭐ **The boot, fixed** (*"Fix the boot"*): with no pink face, `alignFaceOf` now takes the frozen body's face pointing most UP — the floor's
  TOP (`Floor/f4`), what the owner's *"anti-align with the normal of the first frozen object"* meant. ⚠ Measuring "toward the piece" from the
  body's centre (instead of its first face's) would still have picked a side face for a piece on the outer ring, beyond the floor's edge. The
  piece now boots resting on the floor's top; the boot pink face is `Floor/f4`, the window's top facet lit.
- ⭐⭐ **A two-cursor POSITION slider** (*"Add a slider for the position of the window with two cursors (top-bottom & left-right)"*): CAMERA ›
  CAMERA ORBIT AROUND CENTER › *orientation window: ● left → right · ● top → bottom (%)* (`orientWindowXPct`, `orientWindowYPct`, 0–100 % of
  the room inside the 4 mm margins, `orientWindowCorner`, `input/orient_window.ts`). **At boot** (`orientWindowBoot`): a touch screen
  (`(pointer: coarse)`) **bottom-left** (*"At boot on mobile, set the position of the slider to bottom left"*), a desktop **top-right** (*"At
  boot on desktop, set the slider position to top right"*); a URL value wins.
  - ⭐ **Kept clear of the screen's overlays** (`clearOfOverlays`): the HUD panel and its toggle, the ☰, the ⏸ and the score bar — one in the
    top half it overlaps pushes it below, one in the bottom half above. So on a desktop it sits just under the HUD panel at the right (it rises
    when the HUD is collapsed), and on a phone just above the ⏸. ⚠ The open tuning panel is NOT avoided (it would push the window about while a
    slider is moved).
- Headless: boot — the green piece flat on the floor's top, `Floor/f4` lit; the window copies the blue piece with the pink ring on it and the
  top facet pink, the back facets hidden; a press on a black bar — the window copies the bar, the ring on its front face; desktop boot 100 % /
  0 % (under the HUD), touch boot 0 % / 100 % (above the ⏸).
- ⭐⭐ **The polyhedron is NOT fitted to the part; front and back read; the pink face always visible** (*"The cube/polyhedron shall not match and
  wrap the part : it shall stay a cube / polyhedron centered on the center of the part in the center of the window. Make the cube slightly
  occluding the pink face so it can be understood which face is in front and which is behind. Pink face shall always be visible (not completely
  occluded by the replicated part)"*).
  - **Its own shape** (a cube in `Scene_1`): every plane at ONE distance — the part's radius × 1.04 — so it holds the part, centred on the
    part's centre, in the window's centre. ⛔ `supportOffsets` is deleted with its vector.
  - **Every facet is faint glass** (alpha 0.16, front and back, no culling): the part hides the back facets it covers; the edges of the facets
    turned toward the camera are solid, the others faint (0.25).
  - **The pink face** (the lit facet) is its own layer, drawn **twice**: solid pink (0.85) where nothing is in front of it, and a faint pink
    GHOST (0.35) through everything — so where the part covers it, it still shows, and the part still reads in front of it. Both are drawn
    BEFORE the glass, so a front glass facet veils it a little when it is at the back.
  - Headless: the pink face at the back (+z) — the blue part in front of it, the pink through the ghost and around it; at the front (−z) —
    solid pink, the part faint behind it.
- ⭐⭐⭐ **THE CANDIDATE SUPPORT FACE, THE PIECE'S PREVIEW, AND THE CUBE HELD** (the owner, 2026-10-12):
  - *"the face of the cube which normal is pointing the most to the camera is the candidate support face"* — every frame, of the facets that
    stand for a direction, the one whose normal points most toward the camera from its own centre (`candidateFace`, `input/orient_window.ts`).
  - *"in the window, show the green/turquoise piece in the transform as it would be if it was aligned with the candidate support face, in a
    position in front of the candidate support face (therefore orbiting together with the cube rotation). This green /turquoise piece
    replication fades as the candidate support face changes and a new green/turquoise piece replication appears with the new candidate support
    face"* — a COPY of the orbited piece (green or turquoise), scaled to the polyhedron (its radius 0.55 × the inner radius), its resting face
    on the candidate face's centre a hair outside it, a child of the window's root (it turns with the cube), in the pose `restingPreview`
    gives (`green_box_wiring.ts` — the turn a facet tap would make, from the pose shown; nothing moved). A new pose: the old copy fades out
    and a new one fades in over 250 ms. Drawn last, so the pink face's ghost never tints it.
  - *"if the candidate support face is the pink face, show the green-turquoise piece replication with the next roll to the next axis
    applied"* — then `restingPreview` gives the next roll (`nextCoupleRoll`, from where a turn in flight is heading).
  - *"if the second touch stays pressed on the cube while the first touch delta positions, the pink face moves as the candidate support face
    scrolls and the resting face aligns as per the green-turquoise piece replication's transform accordingly: this provides a continuous
    snapped rotation of the green-turquoise piece"* — a press held in the window HOLDS THE CUBE (`orientHold`); the other touch's drag orbits
    the camera (the router's one-finger orbit — the held press never reaches it), the cube turns, and each time the candidate changes to a
    face that is not the pink face the resting face sits against it (the copy's turn) and that face is the pink face. ⭐ The whole hold is ONE
    episode. A short press is still a tap (align / roll); a hold that scrolled does nothing more at its release.
  - *"For desktop, ctrl-alt pressed while cursor is on the cube and held while the left click delta positions does the same"* — ALT / CTRL
    with the cursor in the window holds the cube (the key-made second touch presses at the cursor); a left press that lands in the window
    while it is held DRIVES the orbit (`orientDriver` → `orbitDragStep`) instead of being the window's; a left press elsewhere orbits as usual.
  - Headless (touch and desktop): at boot the candidate is the front face (−z) with a copy on it, the top (+y) lit; one finger held on the cube
    and the other dragging across — the candidate scrolls −z → +z → +x → −x, the pink face follows each, 1 move in all; the same with CTRL in
    the window and a left drag.
- ⭐⭐⭐ **THE WINDOW REDRAWN: (a) → (b) → (c) INSIDE THE CUBE** (the owner, 2026-10-12, with a sketch — the piece lying flat, a curved red
  arrow, the piece standing):
  - *"remove the pink gizmo and the part which supports it (the blue part) from the window"* — ⛔ the part's copy, the ring's copy and the host
    tracking (`centreHost`) are deleted; the polyhedron is its own shape again (unit planes), alone in the window.
  - *"move the green - turquoise piece inside the cube and instead, display (a) the green-turquoise piece as it is currently, (b) a curved
    arrow towards (c) and (c) the green-turquoise piece as its transform would be if the candidate face was pressed"* — inside the
    polyhedron: (a) a copy of the orbited piece in its LIVE pose (lower-left), (b) a red curved arrow (a tube along a quadratic curve, a cone
    for its head), (c) a copy in the pose the candidate face would give (`restingPreview`; the next roll when the candidate is the pink face;
    fading between poses, upper-right).
  - *"The resting faces of the green-turquoise replicas inside the cube shall be aligned with the candidate face's normal as they would be in
    the scene"* → *"Therefore the attached scheme rotates as currently the replica does"* — the scheme lies in the CANDIDATE face's plane
    through the polyhedron's centre (its in-face axes as near the screen's right and up as the face allows) and turns with the cube; (c)
    STANDS ON ITS RESTING FACE on that plane, against the candidate's normal as in the scene; (a) keeps the piece's true current pose, a
    little in front of the plane.
  - *"fade the highlight of the pink face on the cube (same as in the scene)"* — the lit facet's strength is the scene pink face's
    `highlightAlpha` (shown while an input runs — the held second touch, or a hold of the cube that aligned — then held and faded); the
    "through everything" ghost layer is deleted (no part left to hide it).
  - Headless: at boot the candidate −z, the scheme facing the camera, the pink face already faded; after an orbit the candidate +x, the scheme
    turned into the side plane, (c) standing on +x.
- ⭐⭐ **The window refined, the same day** (each the owner's, in order; ⛔ the (a) → (b) → (c) scheme above is superseded by the last):
  - *"scale the green piece replicas 150% in the cube"*; *"highlight the edges of the candidate face so the user knows which one it is"* — a
    yellow tube along the candidate face's edges, rebuilt when the candidate changes; *"green piece replicas shall be instantly placed in
    their transform. No transitions (except the fade and appear)"* — a copy shows the pose the piece is HEADING for, never a turn in flight,
    and a fading copy makes no move of its own.
  - ⛔ *"Do not fade the pink faces on the green piece in the screen nor on the cube"* — the resting face's fill on the orbited piece and the
    cube's lit facet are ALWAYS shown at full strength (their `highlightAlpha` fade, a few hours old, removed); ⚠ the pink fill on a PART's
    face keeps its fade (not named).
  - ⛔⛔ *"when i orbit, the replica flies outside the window into the scene before appearing back in the window"* (the owner on the phone) —
    a fading copy kept its WORLD place while the window, drawn in front of the camera, moved on with the orbit: it was left in the scene
    for its 250 ms fade (measured headless: 218 cube radii from the window's centre). ⭐ At its death it is attached to the window's root;
    ⚠ placed for THIS frame and both world matrices refreshed first — mid-orbit the window moves ~0.1 m a frame, and a matrix one frame old
    baked that gap into the attachment (still 19 radii). Now it stays at the window's centre.
  - ⭐⭐ **ONE copy, at the centre** (*"Remove the current transform from the two replicas. Remove the red arrow. Place the other replica (the
    one with the resting face aligned with the candidate face) at the center of the cube. Scale it 120%. Make it 30% less opaque and
    highlight (in same yellow as cube highlight) its resting face edges (highlight fully opaque)"*): (a) and the arrow are deleted; the copy
    of the piece as it would be (the candidate's alignment, or the next roll when the candidate is the pink face) sits with its bounding
    centre on the polyhedron's centre, 0.648 of its inner radius (0.36 × 1.5 × 1.2), 70 % opaque; its resting face's edges are yellow tubes
    (the candidate outline's colour and thickness on the glass), fully opaque, drawn over everything.
  - Headless: boot — the copy at the centre on its resting face (the candidate −z outlined), the lit top pink at full strength; an orbit — the
    candidate +x outlined, the copy turned onto it; the copies' worst distance from the window's centre during the orbit ≈ 0.

## 22. THE CUBE ONLY — no pink face from a part (2026-10-12, `1.0.68-`)

The window's copy, refined further (the owner, in order):
- *"Place the center of the highlighted face of the replica in the center of the candidate face of the cube"* — the copy's RESTING face's
  centre on the candidate face's centre; the copy stands out from it, toward the camera.
- *"There shall be no transition in the replica transform. Only a fade and appear. Make sure the replica does not jump outside the window"*
  → the choice *"Ride the cube"*: each copy is placed ONCE at its birth (for that frame, the world matrices refreshed first) and attached
  to the cube — it turns rigidly with it like its own faces and never moves on its own; the window is fitted to hold a copy seated on a
  face (not the cube alone); the preview is computed from the pose the piece is HEADING for. ⚠ Measured headless: a shown copy moved 0
  relative to the cube during an orbit (it drifted 102 px on screen before), 0 px past the window's edge. ⛔ Rejected on the way: a copy
  frozen on the SCREEN (it slid off its face as the cube turned, and out of the window).
- *"the replica move to the next face and then rotates to align the resting face: i do not want to see the intermediate step, directly the
  resting face aligned transform to appear"* — the old copy fading out on the old face while the new one faded in on the next (two copies,
  250 ms) read as one copy moving then turning: ⛔ the old copy now GOES AT ONCE; only the new one fades in, already in its final pose.
  (Logged headless: exactly one copy per candidate change — no two-step pose.)

⛔⛔ **Alignment is the cube's only** (*"Remove the selection of pink face on the seated / placed parts and the resulting alignment of resting
face. Alignment of resting face shall be with the cube only. Second touch tap on seated / placed part now sets the pink gizmo (same as first
touch tap on seated / placed part). Remove the ctrl-alt raycast function in desktop"* → *"Remove 1-4, keep 5"*):
- The second touch takes NO pink face from a part and aligns nothing; its press on a PLACED part (a finger) notes where, and its TAP moves
  the **orbit centre** (the pink gizmo) there — never also a roll (`pressActed`). A tap elsewhere, the first held, still rolls.
- ALT / CTRL looks at nothing (its raycast — the pink face, the resting face over the orbited piece — deleted); it stays the held second
  touch (the way in, the roll, the zoom switch is a finger's, the cube held).
- Deleted with it: the part's pink face (`st.pinkFace`, `takePink`, `pinkChanges`, `pinkCandidate`), its fill in the scene
  (`pinkFillFrame`), the highlights' clock (`highlightAlpha`, `highlightEndedAt`, `hold.shown`) and its two-cursor slider (`highlightHoldMs`
  / `highlightFadeMs`), and `holdTapRolls`' "pink changed" / "over the orbited piece" inputs.
- `alignFaceOf` reads the cube's facet ONLY (`st.pinkDir`); the frozen-body fallback is deleted. ⭐ The BOOT aligns to the cube's +y facet
  (`BOOT_UP`: normal +y, edges along x and z — what the floor's top gave), so the roll is active from the start.
- ⭐ Kept (*"keep 5"*): a first-touch / left tap on the orbited piece makes the face hit the resting face and aligns it (§13) — to the cube's
  facet the piece is aligned to.
- ⏭ Advised, not done: the older part-to-part assembly system (align by HitFace / Pioneer, snap / seat / unsnap, the PioneerFaceCursors, the
  cyan / amber face highlights) still drives the free parts; to remove once the cube's approach replaces it.
- Headless: boot — aligned to `cube (0.00, 1.00, 0.00)`; first finger held + a second-finger tap on a black bar — the orbit centre moved
  there, no roll; on empty space — a roll; CTRL over a part — nothing.

## 23. The window, refined: the clicked face, yellow and pink swapped, the cursor-following window, the turn arrow (2026-10-12, `1.0.68-`)

- ⭐⭐ *"when a cube's face is clicked, the replica shall immediately move to this face and update to the next possible orientation"* — the
  face CLICKED is the one shown (the copy on it, its highlight) until the candidate changes (the camera turned on); the copy appears there at
  ONCE (no fade-in) in the pose the next click would give (the click aligned the piece to that face, so the next roll). Headless: a click on
  the top — the copy there the very next frame, at full strength, rolled; again — the next roll; an orbit — back to the candidate.
- ⭐⭐ *"resting face and cube current aligned face highlighted contours in yellow (no more pink highlight of the resting face nor the cube
  current aligned face) — pink face travels the cube (therefore replaces the current yellow contour highlight of the cube) — no more highlight
  of the face of the replica"*:
  - the scene's RESTING face: a YELLOW CONTOUR along its edges (and a faint twin drawn through the piece); its pink fill hidden;
  - the cube's ALIGNED face (the direction the piece is aligned to): a yellow contour (a tube along its edges); it was a pink fill;
  - the cube's face SHOWN (the candidate, or the face clicked — the one that travels the cube): a PINK fill, before the glass; it was a
    yellow outline;
  - the copy: no outline any more.
- ⭐⭐ *"in desktop mode, when the left click is pressed and held to orbit around the center or around the piece, pin the cube window to a place
  below and to the right of the cursor. when the left click is released, freeze the position of the window. This will enable to have the
  window always close to the cursor without the need to travel the whole screen to reach the window"* — every orbit step of a MOUSE pointer
  (`orbitDragStep`, around the centre or round the piece) moves the window's position sliders so its top-left sits 6 mm below-right of the
  cursor (`orientWindowAtCursor`, clamped inside the margins); the release changes nothing — the window stays there, the sliders show where.
  ⛔ Not while the cube is held (the key drives that orbit), never for a finger. Headless: a drag to (460, 474) — the window at (483, 497);
  released and moved away — it stays.
- ⭐ *"Also in desktop mode, scale the current cube window 175%"* — a desktop boots the window at 175 % (`orientCubeSizePct`; a touch screen
  100 %); a URL value wins.
- ⭐⭐ *"together with the replica in the cube window, add a red arrow (similar to the one we removed previously) with an inclination and
  direction indicating the direction of the rotation required to rotate from the green piece current quaternion to the replica quaternion.
  position the arrow so that the replica is not occluded by the arrow"* — the turn from the piece's pose (the one it is heading for) to the
  copy's (`turnBetween`: axis and angle, the short way): a red ARC in the plane across that axis (its inclination), swept the way the turn goes
  (its direction; as long as the turn, never under 40°), its head at the end; turned with the cube; in the window's corner DIAGONALLY OPPOSITE
  the copy, so the copy is never behind it; hidden with no turn. ⚠ An axis lying across the screen shows the arc edge-on (a straight arrow) —
  true to the turn, less readable.
- **Amended the same day** (each the owner's):
  - *"put the red arrow at the center of the cube, make it slightly less opaque than the replica"* — the arrow at the polyhedron's CENTRE
    (no longer the corner opposite the copy), 0.55 opaque (the copy 0.7).
  - *"lerp the window to its position when it moves to catch the cursor on left click pressed"* — the follow sets a GOAL; each frame the
    position sliders approach it exponentially (90 ms) — the window glides, never jumps (headless: 1101 → 855 → 693 → 613 … px).
  - *"add a bit more horizontal distance between the cursor and the top left corner of the window (half the dimension of the window width)"* —
    its left edge 6 mm + half the window to the right of the cursor (`orientWindowAtCursor`'s `gapX`); 6 mm below.
  - *"in desktop, scale the window 85%"* — 175 % × 0.85 ≈ 149 %: a desktop boots at **150 %** (the slider's step is 10).
  - *"a left click tap shall not move the window (the tap is used to select another position of the pink gizmo)"* — *"(a drag to orbit shall
    be necessary to move the window)"* — the follow starts only once THIS press has travelled past the tap slop, then holds for the rest of it.
  - ⛔⛔ *"when the next quaternion is a roll to the next axis, the red arrow direction is wrong"* — *"(because the red arrow should show a
    clockwise rotation around the normal of the resting face)"*: the arrow showed the turn between the two poses the SHORT way, and a roll is
    up to a half turn with its own sense — at a half turn the short way has none. ⭐ `nextCoupleRoll` now reports its own turn (its axis — the
    normal, the sense the roll's — and its angle); the preview carries it, the arrow uses it. *"make sure the red arrow direction is correct
    also for the other configurations"* — an alignment's arrow keeps the turn between the poses the short way, which IS the way the piece
    turns (`qSlerp`, the short way round): checked over 200 random pose pairs (the arrow's sweep and the piece's first eased step agree).
    ⚠ An alignment of exactly a half turn has no short way (the piece's own ease picks one).
  - ⭐ *"make a on-off cursor in the scene menu to enable or disable the window following the cursor. if the window does not follow the cursor,
    place it where it was before we modified. default: follow is off"* — SCENE › *orientation window follows the cursor (desktop; 0 = off, 1 = on)*
    (`orientWindowFollow`, **0** by default); off, the window stays at its boot position (a desktop top-right, under the HUD; a touch screen
    bottom-left), and switching it off puts it back there. Headless: off — a drag leaves it at (1122, 238); on — it goes to (545, 497); off
    again — back at (1122, 238).
