# Resting-face alignment of the orbited piece — specification (prototype)

> **Status:** ✅ BUILT 2026-10-05 (⛔ unjudged by a hand) — `core/resting_face.ts` (`faceLongAxes`, `restAlignToFace`),
> `input/orbit_tap.ts`, `render/pointer_wiring.ts` (`orbitTapped`, `orbitRightTap`), `render/green_box_wiring.ts` (`alignRestingFace`,
> `alignFaceOf`, `restAlignFrame`, `counterYawFrame`), the mouse model's right tap. Built on `1.0.59p-from1.0.59m-`; priority 1 rewritten
> twice on `1.0.59q-` (§2); carried to **`1.0.59r-`** (2026-10-05).
> **Builds on:** [`RESTING_FACE.md`](RESTING_FACE.md) (the selector: which face, and its group).
> **Scope:** the orbited piece — the green frustum or the turquoise prism, whichever the SCENE switch names.

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
| **first** | the **resting-face alignment** (§2) |
| second, third, … | counted, nothing else — ⏳ to be defined later |

**The counter resets when the first touch lifts.**

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
