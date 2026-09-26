# Essays moved out of `INDEX.md` on 2026-09-26 — to pay for the module map

⛔ Each is still true; the index kept its state and this file keeps the narrative.

⛔⛔ **The defect that taught this, found by finger**: the loop used to draw only the
objects that HAPPENED to have a follower, so a translated object was **LOCKED** until
something else created one — and then **JUMPED** to where it should have been all along.
⭐ *Draw from the model, never from whatever bookkeeping a rule left behind.*

⚠ **Still a stand-in**: rule 2bis runs without its PRECONDITION (§1.4's empty constraint stack),
which `IN3` adds. The gesture, its axes and its gain are real.


⭐⭐ **`requireGestureFrame()` THROWS rather than guessing.** `A7`'s frame is undefined looking exactly
along gravity, and a silent fallback would turn *"the axes are wrong at the pole"* into a defect a hand
has to find. ⚠ The orbit rings make the pole unreachable, so it guards an invariant.

---

## ⭐⭐ FORK C's WIRING — what `scene.ts` owns of `D37` (2026-09-16)

⚠ Here because **`IN3`'s last three defects were all in this layer**, where no vector reaches.

* **`forkCAlign`** — the alignment, reached from a **second holder's `TAP`**. ⛔ Not a press,
  and not the `SECOND` role: a finger on ANOTHER object is routed `OBJECT`, so *"tap on second
  object's hit face"* arrives as that grip's own tap and the Follower is the OTHER grip.
  ⭐ Exactly one other holder or it refuses — with two, which one is the Follower has no
  trustworthy answer.
* **`Held.pressFace`** — per grip: the trigger names **two** faces on two objects at once,
  which one `selectedFace` cannot express. **`Held.alignmentTouched`** — *made during THIS
  gesture?*, which no look at the state can answer.
* ⛔⛔ **THE MARKERS ARE PARENTED TO THE OBJECT** (defect 46): positioned from the CACHED
  `getWorldMatrix()` (recomputed inside `scene.render()`, after the read), every marker drew
  last frame's pose. ⭐ Parenting makes the lag **unreachable**, not corrected.
  ⛔⛔ **EXCEPT A BILLBOARD** (defect 71): Babylon drops a billboarded child's parent ROTATION,
  so the face rings drew off their faces on a turned body. They are placed in world space each
  frame from `computeWorldMatrix(true)`, as the gizmo rings always were.
* The highlight is raised **at the alignment**, not at the press (`D35`), and ⛔ **every
  refusal is printed**: this gesture's failure mode is *nothing visibly happened*.
* **TWO markers since `D39`** — a filled quad on the Follower (what moved) and a **line
  contour** on the Pioneer (what it was aimed at), both through **one** `placeFaceMarker`:
  a second copy of that geometry is a second implementation that can silently disagree.
  ⛔ The pair is **atomic** — the contour may not outlive the fill, or it claims a
  relationship that is gone. ⚠ `CreateLines` is one pixel wide by WebGL's rule, not by
  choice; if a hand finds it faint the answer is `GreasedLine`, not a thicker hack.
