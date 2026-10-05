# Resting-face alignment of the orbited piece — specification (prototype)

> **Status:** ✅ BUILT 2026-10-05 (⛔ unjudged by a hand) — `core/resting_face.ts` (`faceLongAxes`, `restAlignTarget`),
> `input/orbit_tap.ts`, `render/pointer_wiring.ts` (`orbitTapped`, `orbitRightTap`), `render/green_box_wiring.ts` (`alignRestingFace`,
> `restAlignFrame`), the mouse model's right tap. Branch `1.0.59p-from1.0.59m-`.
> **Builds on:** [`RESTING_FACE.md`](RESTING_FACE.md) (the selector: which face, and its group).
> **Scope:** the orbited piece — the green frustum or the turquoise prism, whichever the SCENE switch names.

---

## 1. The gesture

While the **first touch** (or the **left button**) is down and **orbiting** — pressed outside any seated piece, as today — the
**second-touch TAPS** (or **right-button taps**) are **counted**, anywhere on the glass.

| tap | what it does |
|---|---|
| **first** | the **resting-face alignment** (§2) |
| second, third, … | counted, nothing else — ⏳ to be defined later |

**The counter resets when the first touch lifts.**

---

## 2. The resting-face alignment (the first tap)

**The target orientation**, from the piece's pose at that moment:

1. **The resting face down** — its outward normal along gravity (the piece sits on it). The face is the selector's
   (`RESTING_FACE.md`), the member of its winning group chosen there.
2. **Its long axis toward the pink ring** — then a turn about the vertical so that the resting face's **long axis** (§3) points along
   the **horizontal direction from the piece toward the pink ring**. Of the candidate axes (each with its two directions), the one
   already **closest** to that direction is taken.
   ⭐ Always defined: the piece is never directly above the ring (the closest it comes horizontally is the waist rings' radius,
   0.09 m in `Scene_1`) — so there is no second priority.

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

## 3. The long axis of the resting face

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
longer be a tap. The zoom is measured from the fingers' distance at the second PRESS (the deadband's travel is not lost).

**The orbit with a second finger down:** ⛔ today the orbit STOPS the moment a second finger lands (two fingers on empty space are handed
to the pinch rule). ✅ Now: while the second finger is inside its deadband, the **first finger keeps orbiting** — no pause for a tap; the
orbit pauses **only once the pinch starts**; when the second finger lifts, the first finger **resumes** orbiting without a new press.

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

## 7. To build (when the owner says so)

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
