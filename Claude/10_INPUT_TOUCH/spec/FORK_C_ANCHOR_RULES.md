# FORK C — the owner's anchor and alignment rules

> **STATUS** · 🔨 **BEING SPECIFIED** (opened 2026-09-16, branch `1.0.8-`) · **OWNS** · the
> rule set behind `?anchorRules=2`
> **READ IF** · you are building or judging fork C
> **LAST VERIFIED** · 2026-09-16

⛔ **NOTHING IS BUILT.** `anchorForkOf(2)` returns `OWNER_TBD`, `runsIn3` answers **false**,
and the HUD prints `anchor=TBD(inert)`. The fork is visibly inert on purpose — *inert must
mean nothing happens, not something plausible happens* — so specifying it changes no shipped
behaviour and carries no risk.

⭐ **The owner's rules go in §2 below, in the owner's words.** Everything outside §2 is
mine: the record of why fork B's trigger was abandoned, and the seams a new rule set meets.

---

## 1. Why fork B's trigger was abandoned — the owner's report, verbatim

> *"I will leave fork B for the moment, as I am not satisfied with the flick mechanism."*

Asked what specifically dissatisfied, the owner named **two faults**:

> *"difficult for user to implement, and releases the finger from the object it is
> tracking"*

⛔⛔ **BOTH FAULTS ARE PROPERTIES OF A RELEASE-TIME TRIGGER, NOT OF THIS FLICK.** §1.3's
flick is a verdict computed *at the lift*, from the motion buffer. That single fact produces
both complaints by construction:

* **The release IS the trigger**, so the finger must leave the glass for the alignment to
  happen at all — and §2's 2ter/2quater then unselect the object. The hand loses what it was
  holding in order to act on it.
* **It must be distinguishable from an ordinary drag**, so it has to be fast, straight and
  far enough to clear three thresholds. That is what *difficult to implement* means: the
  gesture is not chosen, it is *performed to a specification*.

⭐⭐ **SO THE CONSTRAINT ON FORK C IS STRUCTURAL, AND IT IS THE FIRST THING ANY RULE HERE MUST
SATISFY: the alignment completes MID-GESTURE, with the object still held.** A trigger read
from a release cannot satisfy it, however it is tuned. ⚠ This is recorded as a constraint
rather than a design: what the trigger *is* is the owner's to state in §2.

⭐ Two channels in the build already fire mid-gesture, and are named here as evidence that
the constraint is reachable — not as a proposal: `ShakeDetector` (a back-and-forth, judged
while the drag continues) and the tap channel (`isTapRelease`, which flips the movement mode
without disturbing the finger that is holding an object).

---

## 2. THE RULES — ⚠ THE OWNER'S TEXT, to be dictated

*(Empty. Nothing is assumed, and nothing below this line is mine to write.)*

---

## 3. The eight questions a rule set answers — fork C's column, for reference

⭐ Fork B's answers are recorded so fork C can be specified *by contrast* where that is
shorter than stating it afresh. ⛔ An empty cell means **undefined**, never *"as fork B"*.

| # | the question | fork B (`=1`) | fork C (`=2`) |
|---|---|---|---|
| 1 | what CREATES an alignment | a flick at release, mode `ROTATE` | ⚠ owner — must complete mid-gesture (§1) |
| 2 | what is ALIGNED | the face picked at press, from the picked normal | ⚠ owner |
| 3 | onto WHAT | world up/down, or a world axis resolved from screen x at the snap | ⚠ owner |
| 4 | how much FREEDOM it takes | entry 1 hard (2 DOF), entry 2 soft (1), entry 3 refused | ⚠ owner |
| 5 | what drives what is LEFT | drag about the axis; second touchpoint's x rolls about it | ⚠ owner |
| 6 | how it is UNDONE | a back-and-forth shake; alignments go, mates stay | ⚠ owner |
| 7 | what is VISIBLE while it holds | the face highlight, until eviction | ⚠ owner |
| 8 | when NONE of it applies | mode `TRANSLATE`, no selection, or fork `NONE` | ⚠ owner |

## 4. What a rule set costs to build, by row

⚠ Stated so the specification can be made with the price visible — **not to steer it.**

* **Rows 4, 5, 6 are already built and engine-free** — `core/constraint_stack.ts` (the DOF
  budget and the solver), `input/anchor_rotate.ts` (twist about a constraint axis, both
  charts), `input/shake.ts` + `evict` (the undo). A fork that keeps them wires them.
* **Rows 1 and 3 are the cheapest to replace**: `input/align_flick.ts` builds the constraint
  and one block in `src/render/scene.ts` fires it. A new trigger is a new small module plus
  that block.
* **Row 4 is the deepest**: changing how much freedom an alignment takes means the solver,
  which 42 + 16 vectors stand on.
* **Row 2 is `core/face_pick.ts`** — a face from a picked normal, and the marker's
  orientation. Independent of the trigger.

⛔ **AND THE EXPIRY IS NAMED NOW, per `D28`'s precedent**: the day one fork is chosen the
others are **deleted** — flag, slider, vectors and all. A dormant fork is a trap.
