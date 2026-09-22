# THE DEFECT LEDGER — every defect, and what its cause turned out to be

> **STATUS** · live · **OWNS** · the account of each defect counted in `QUEUE.md`'s ledger
> **READ IF** · you are about to build anything in the input or render layers
> **LAST VERIFIED** — 2026-09-17

⭐⭐ **WHY THIS FILE EXISTS.** `QUEUE.md` keeps the ledger's **counts**, so the number has one
home and stops drifting. ⛔ The *stories* grew to 7 KB inside a front door with a byte budget,
and they are what a session actually needs to read before building — not a total.

⚠ **A row's count changes in `QUEUE.md` AND here, or in neither.** That is the same rule the
queue applies to its own rows and their dossiers.

⭐⭐⭐ **THEY ARE FIVE SHAPES, NOT N PROBLEMS**, and the shapes are in `QUEUE.md`'s
YOU-ARE-HERE block. ⛔ Two of them keep recurring in new clothes: a quantity measured over
the wrong baseline (the flick's travel, the shake's axis, §1.1's speed) and a **substituted
quantity** — a question that is easy to ask standing in for the one that matters.

---

## The rows, as `QUEUE.md` had them — unrewritten

| row | defects found BY FINGER | record |
|---|---|---|
| `IN1` — the recognizer | **14**, over seven device passes | [`./IN1.md`](./IN1.md) |
| `IN9` — rule 1, orbit | **3** | [`./IN9.md`](./IN9.md) |
| `IN9` — rule 4, pinch zoom | **0** — five device checks, all passed | [`./IN9.md`](./IN9.md) |
| `IN2` — pointer plumbing | **0** — the `IN8` consequence was judged and ACCEPTED, which is a verdict, not a defect | [`./IN2.md`](./IN2.md) |
| `IN4` — rule 6, translate | **1** — a `STATIONARY` latch, overturned first try | [`./IN4.md`](./IN4.md) |
| the sympathetic sway | **1** — no re-trigger on a change of DIRECTION | [`../../40_RENDER_SCENE/INDEX.md`](../../40_RENDER_SCENE/INDEX.md) |
| `3D1` — the model wiring | **1** — the render loop drew only objects that HAPPENED to have a follower, so a translated object locked, then jumped | [`./3D1.md`](./3D1.md) |
| **A8** — the roll's start | **1** — a circle is not a roll until `rollAngle` of arc, and the yaw/pitch applied meanwhile was never undone | [`../../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../../10_INPUT_TOUCH/AMENDMENTS_R5.md) |
| **A8** — the roll's commit | **1** — the rebase undid the swept yaw/pitch and the scene then applied ONE frame of roll, dropping ~60° | [`./IN3.md`](./IN3.md) |
| **A6** — depth, from below | **1** — *"chaotic on the bottom ring"*: "away" RISES seen from above and SINKS from below, and the rule hard-coded the first | [`../../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../../10_INPUT_TOUCH/AMENDMENTS_R5.md) |
| **A6** — the gate | **3** — re-decided every frame against a speed floor, so a hand slowing or reversing dropped into rule 6; then a windowed divergence that was rate-dependent; then a shared travel that summed to the average | same |
| **A9** — the rotation jitters | **1** — rules integrated the RAW per-event delta against 0.761 mm of measured noise | [`./IN12.md`](./IN12.md) |
| **A10/A11** — §1.1, four times | **5** — ⛔ speed over ONE sample pair (STATIONARY unreachable for any real finger); the settle asymmetry; a still finger emits no events so the clock never advanced; the band taxing every reversal; rest ON the band boundary, via a float round trip | [`./IN0.md`](./IN0.md) |
| **A13** — a tracker outlived its finger | **1** — keyed by POINTER ID, and browsers reuse ids after a release | [`./IN0.md`](./IN0.md) |
| **A13** — a mode keyed on MOTION | **1** — a finger placed QUICKLY skids as it lands, so the mode followed the landing. ⛔⛔ `IN4` had recorded the identical verdict two days earlier | [`./IN4.md`](./IN4.md) |
| **A14** — the gap inside a lift-and-replace | **1** — between a lift and the replacing press there is genuinely ONE touchpoint down. ⭐⭐ The RULE was right and the GESTURE MODEL was wrong | [`./IN4.md`](./IN4.md) |
| **A16** — fork C's three formulations | **3** — a double tap toggled TWICE so the gesture could never form; a 300 ms lag I had stated as a cost and shipped anyway; the mode reset on every release. ⚠ Only the first is a defect in the strict sense — the other two correct MY READING of the owner's words, which is a different failure and arguably worse | [`./IN13.md`](./IN13.md) |
| **`IN3`** — the face marker's roll | **1** — *"the highlighted face does not rotate as the cube's face: consequently, there is a growing mismatch between their respective quaternion."* ⛔⛔ The marker aligned its facing with the face's world **normal**, which fixes ONE axis and leaves the spin about it free — so turning the object about that face's own normal moved the face and not the marker. ⭐⭐ **A DIRECTION TEST CANNOT SEE A ROLL**, the same family as *a sign is not tested by testing the magnitude*: the quantity I checked stayed true while the one that mattered drifted. ⭐ Fixed by INHERITING the object's orientation plus one constant per-face offset | [`./IN3.md`](./IN3.md) |
| **`IN3`** — a RETIRED gesture still owning a verdict | **1** — *"the face does not point up at rotation flick"*, *"no DOF reduction at the first flick"*, intermittently. ⛔⛔ `A12` moved roll to the second touchpoint and left the detector **fed**; `release` still returned `ROLL_KEPT`, which **pre-empts the flick test**, so a hand whose rotation drag happened to curve enough pushed no alignment at all. ⭐⭐ **A RETIRED GESTURE THAT STILL OWNS A VERDICT IS NOT INERT** — the third dead instrument in one day, and the only one that changed behaviour instead of merely misinforming. ⭐ The composition test (`in3_align_wiring.test.ts`) was **green throughout**: it walks the chain from `alignFromFlick` onward, and the veto sat one stage EARLIER | [`./IN3.md`](./IN3.md) |
| **`IN3`** — a mode with no way out | **1** — *"the second flick completely freezes the rotation."* ⛔ 2ter pushes constraints while 2sexte (their driver) and `A4`'s eviction are both **unwired**, so the second constraint makes `dragRule` return `ROTATE_REFUSED` and a hand has **no gesture that recovers**. ⭐⭐ Shipping one half of a pair is not a partial feature, it is a **trap**: entry 1 alone stays reversible by flicking again, entry 2 is terminal | [`./IN3.md`](./IN3.md) |
| **`IN3`** — 2sexte had no driver | **1** — *"a flick immediately remove two DOF now and I cannot rotate the aligned object around the alignment axis."* ⛔ The first half is §1.4 working; the second is `anchor_rotate.ts` built and unwired. ⭐⭐⭐ **THE REPORT DISSOLVED THE DECISION THE ROW WAS BLOCKED ON** — `A3`'s handover constant is unnecessary once `A12` has split drag and roll into two CHANNELS | [`./IN3.md`](./IN3.md) |
| **`IN3`** — the flick's BASELINE | **1** — *"the flick should be triggerable during an ongoing rotation."* ⛔⛔ Travel and purity were measured from the oldest sample inside `flickWindow`, so a flick REVERSING the drag cancelled to ≈ 0. ⭐ Mistake shape 1 with the sign reversed: a DISPLACEMENT over a baseline holding another gesture's motion. ⚠ My first fixture did not reproduce it (shape 5) | [`./IN3.md`](./IN3.md) |
| **fork C** — the highlight, wiped one event later | **1** — *"the aligned face shall continue to be highlighted... or if you built it, I can't see it."* ⛔⛔ It WAS built; the release handler destroyed it immediately, because its persistence test asked *"is the object being RELEASED the highlighted one?"* — and in fork C it never is: the highlight names the **Follower** while the release is the **Pioneer's** tap. ⭐ Mistake shape 2: a condition about the GESTURE standing in for a fact about the MODEL | [`./IN3.md`](./IN3.md) |
| **fork C** — the shake's stale axis | **1** — *"triggered only if the touchpoint is pressed and the shake immediately follows... not working in translation mode."* ⛔⛔ ONE defect, not two: the detector claimed its axis **once**, from the gesture's first leg, so a shake after any other motion was measured against an axis pointing elsewhere — and an alignment takes time, so no post-alignment shake could ever fire. ⭐⭐ **`D33`'s mistake in a second gesture the same week**: a quantity measured from the OLDEST sample instead of the recent motion. Fixed the same way — a trailing window, longest sub-window first | [`./IN3.md`](./IN3.md) |
| | **= 45** | |

---

## 46 — the face markers lagged the faces by one frame *(2026-09-17)*

> *"The highlighted quads always lag the movements of the faces they highlight. This is not
> nice to see."*

⛔⛔ **NOT THE ARITHMETIC — THE ORDER, AND A CACHE.** The render loop wrote every mesh's pose
and then placed the markers from `mesh.getWorldMatrix()`. ⭐ That call returns Babylon's
**cached** matrix, which is recomputed inside `scene.render()` — i.e. *after* the block that
read it. So each marker was placed from the pose its object had **last** frame, every frame.

⚠ And the halves disagreed, which is why it read as a *slide* rather than as a delay: the
POSITION came from the stale matrix while the ORIENTATION came from `rotationQuaternion`,
which was current.

✅ **FIXED BY PARENTING the markers to the object mesh.** A child's world transform is
composed from its parent's at render time, so there is no matrix to read and no ordering to
get right. ⛔ `computeWorldMatrix(true)` would also have worked and would have left the next
writer one reordering away from the same defect. ⭐ `METHOD`: *prefer the structure that
cannot express the defect.*

⚠⚠ **THE COST, STATED**: *the marker turns with its face* is now the scene graph's doing, and
no golden vector reaches `src/render`. `face_pick.test.ts` pins the composition the graph
performs — the constant per-face offset under the object's orientation — which is the closest
a vector gets. ⛔ The same blind spot as `3D1`'s follower, the marker's roll, and the flick's
veto: **this layer has now produced four of the project's defects.**

---

## 47 — an ALIGNED object's rotation lost the sympathetic sway *(2026-09-17)*

> *"When the object is aligned and rotates, you lost the sway in the other objects."*

⭐ Exactly right, and the cause is one word: **`return`**. The aligned twist (2sexte) applied
its rotation and returned from the pointer handler, so the sway block at the END of the rotate
branch never ran. ⛔ Free rotation kept its sway by falling through to it, which is why only
ALIGNED objects lost it — and why nothing looked broken until an alignment existed.

⚠⚠ **THE SHAPE: a rule added later took a shortcut past a consequence an earlier rule reached
by falling through.** ⛔ It is the render layer again (five of the project's defects now), and
it is invisible to vectors for the same reason as the others.

✅ Fixed by making the consequence a **named function** — `noteSpin` — called by all three
paths that turn a held object: free rotation, the aligned twist, and the second finger's roll.
⭐ A fourth path is likely (a mate), and it cannot forget what it has to call by name.

---

## 48 — the twist killed the alignment snap, so `ROTATE` looked unwired *(2026-09-17)*

> *"There is no slerp during rotation: did you wire it?"*

⭐ Wired, in both modes — and killed by a line I wrote in the same commit. The twist path
called `settleAlignAnim()` before turning, on the reasoning that *the hand wins over an
animation it has overtaken*. ⛔ So the first finger movement past the deadband landed the snap
instantly, and since `TRANSLATE` writes only POSITION, the animation survived there. **One
feature, visible in one mode, invisible in the other, for one line.**

⚠⚠ THE SHAPE: *a guard written for a conflict that was not real.* The twist and the snap do
not actually fight — both are world rotations, so they COMPOSE. ✅ The twist now rides along
(compose onto both ends of the animation), exactly as C2's follow already did, and
`settleAlignAnim` is deleted because nothing needs to land a snap early any more.

⭐ Worth carrying: when two rules seem to need arbitration, check whether they compose first.
The arbitration I reached for cost a visible feature and hid it in a way that looked like it
had never been built.

---

## ⛔⛔ THE AUDIT OF 2026-09-17 IS A SEPARATE COLUMN, AND DELIBERATELY SO

⭐ Twenty-one defects and fragilities were found on 2026-09-17 by **reading the source**, not by
a finger: the full account is [`AUDIT_2026-09-17.md`](AUDIT_2026-09-17.md).

⛔⛔ **NONE OF THEM IS ADDED TO THE `BY FINGER` TOTAL, WHICH STAYS AT 48.** That number means
something precise — *found by a hand, invisible to a green suite* — and it is the whole of this
project's argument for spending sessions on the glass. ⚠ Diluting it with findings of a
different KIND would destroy the only statistic that argument rests on.

⭐⭐ **AND THE TWO KINDS ARE GENUINELY DIFFERENT, which is the more useful observation.** Every
audit finding was *latent, silent, or armed for later* — a count that would fall through on the
first mate, a frame mismatch that fires on the first assembly, a boot mode contradicted by every
document. ⚠ Not one is something a hand would have reported that day. ⛔ So the two methods do
not compete: **the device finds what is wrong now; a read finds what is wrong on the day
something else changes.** ⭐ Ten vectors that *could not fail* were the audit's largest single
class, and no device pass can ever find those.

## 49 — the twist's `dx` ran BACKWARDS for half of all alignments *(2026-09-22)*

> *"there are some cases where the dx delta position and the yaw rotation direction are
> inverted."* — the owner

⛔⛔⛔ **THE REPORT NAMED THE WRONG RULE, AND MEASURING BOTH IS WHAT FOUND THE RIGHT ONE.**
*Yaw* is the one-finger horizontal drag, so the free rotation was the obvious suspect. It was
swept over **408 camera positions** — every azimuth, every elevation the orbit rings reach — by
rotating a probe on the body's camera-facing side and projecting its motion onto the camera's
own right. ⭐ **Zero inversions.** A yaw turns about the world vertical, and that cannot reverse
with the camera.

⭐⭐ **THE CULPRIT WAS THE TWIST ON AN *ALIGNED* BODY**, which is also a one-finger horizontal
drag and so indistinguishable from the yaw in a report. The same sweep over alignment
orientations found it inverted at **12 of 24** — exactly the half a cosine predicts.
⚠ *"Same symptom" never means "same cause."*

⛔⛔ **AND THE CAUSE WAS A FIX THAT HAD ALREADY BEEN MADE, ON THE OTHER CHANNEL.**
`constrainedDragAngle` projected the finger's travel onto the **near-side screen direction**,
whose `x` component reverses as the alignment axis swings past horizontal-on-screen. ⭐ `D57`
had deleted exactly that projection from the SECOND touchpoint on 2026-09-19, in the owner's own
words — *"If there are cos or sin projections on axis based on orientation, remove those
projections"* — and the FIRST touchpoint kept it. The scene's own comment even explained why the
first touchpoint was fine: *"it passes `dx` AND `dy` and can always drag along the near-side
direction whatever its screen orientation."* ⚠ True about **losing** control, and silent about
**inverting** it.

⭐⭐⭐ `METHOD`: *when a rule has two channels, the correction belongs to the RULE.* This is the
second time that shape has been recorded — the first was the ride-along landing on the
one-finger twist and not on the second touchpoint's roll (defect 48, the entry above).

⚠⚠ **WHAT THE FIX COSTS, AND IT IS NOT CLOSED**: `dy` no longer contributes to the twist, so a
vertical drag on an aligned body does nothing. That is the trade `D57` already made once, but no
finger has judged it here. `constrainedDragAngle` is declared in `unwired_debt` rather than
deleted for exactly that reason — the device pass either confirms the trade, and it goes with
its ~25 vectors, or reverses it, and it is wired back.

⛔ **THE VECTOR THAT WOULD HAVE CAUGHT IT DID NOT, AND THE REASON IS IN ITS OWN FILE.**
`tests/a7_wiring.test.ts` composes the frame with the rotation at four camera tilts and asserts
`Math.abs(dot(axis, UP))` — *up to sign*. ⭐ So every vector in the file written to measure this
composition would still have passed with the direction reversed. *A sign is not tested by any
amount of testing the magnitude*, inside the guard built for it. ✅ A direction sweep is now
there, and the old mapping's inversion is kept as a counter-example in `anchor_rotate.test.ts`.

## 50 — a restarted ease stalled, so MORE increments moved the body LESS *(2026-09-22)*

> *"when I set increment to 45 degree and I rotate by one increment, the sway of other objects
> is bigger than if I move by two or more increments. why?"* — the owner

⭐⭐⭐ **THE REPORT WAS ABOUT THE SWAY AND THE SWAY WAS CORRECT** — which is the whole value of
the entry. The sympathetic sway scales with the held body's measured °/s, so it was reporting,
accurately, that the body turns **slower when it crosses several detents than when it crosses
one**. ⚠ Nothing in the sway's own tunables was wrong, and a session that went looking there
would have found nothing and tuned something that was right.

⛔⛔ **THE CAUSE: AN EASED ANIMATION THAT IS RESTARTED NEVER DELIVERS ITS MIDDLE.** The
increment step was an `easeInOut` over a fixed window — `t²(3−2t)`, whose velocity `6t(1−t)` is
**zero at both ends** and peaks at 1.5× the average halfway through. Every newly crossed
increment called `AlignSnaps.start`, which replaces the flight and resets `t0`. ⭐ So:

* **one 45° increment, then a stop** — the curve ran to completion: average 350°/s, peak
  ≈ **525°/s** against a 90°/s sway reference, so the sway saturated;
* **two or more in quick succession** — each crossing re-entered the curve at `t = 0`, where the
  velocity is **zero**, so the body was relaunched from a standstill over and over and never
  reached the fast middle.

✅ **FIXED BY REMOVING THE CLOCK.** `RotationFollower` is an exponential approach —
`slerp(pose, target, 1 − exp(−dt/τ))` — whose speed depends only on how far the target is. There
is no curve to re-enter and no `t0` to reset, so retargeting mid-flight costs nothing and a
target four increments away is covered about four times as fast. ⚠ τ is the alignment snap's own
window over three, borrowed rather than added: an exponential covers 95% in 3τ.

⭐⭐ `METHOD`: *a second symptom that contradicts your theory is worth more than a third that
confirms it.* The rotation itself looked right to me, and it was the SWAY — a decorative rule
three steps downstream — that carried the measurement proving it was not.

⚠⚠ **AND THE FIX ALMOST SHIPPED AS A SILENT FREEZE.** The first wiring declared its own
`lastFrameMs` in the render loop, which already had one and had already advanced it earlier in
the same frame — so `now - lastFrameMs` would have been **zero every frame** and the follower
would never have moved at all. ⭐ Caught by the compiler refusing the redeclaration, not by
anything looking at the screen: *one clock, `performance.now()`, as everywhere else in the file.*
