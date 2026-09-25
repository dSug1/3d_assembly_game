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

⛔⛔ **NONE OF THEM IS ADDED TO THE `BY FINGER` TOTAL, WHICH STANDS AT 50** — 49 by finger, one by
composing a measurement with a threshold. That number means
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


---

## 51 — ⭐⭐⭐ THE AXIS MAPPING LOST THE COSINE, AND ONLY THE GRAVITY CHANNEL KEPT UP

**2026-09-23, the first device look at the object axes (`D76`).** The report came in three pieces:

> *"the dx continues to move on the x world axis and dy on the world depth axis, which feels strange
> for the user as the input axis and movements axis seem inverted."*
> *"the gain drops for dx and dy due to projection of input on world axis and as a consequence the
> input seems very weak and not the same as the gravity axis input which is right."*
> *"The holder's dy is dead at a level camera."*

⛔⛔ **ONE DEFECT, AND THE OTHER TWO ARE THE LOOP WORKING — the distinction is the ledger's own
rule.** The defect is the middle one: a translation rule on this project is supposed to put the body
**under the finger** (`gainTranslateScreen` = 1 means exactly that, and it is the one COMPUTED number
here), and this mapping multiplied each input **by** the axis's screen foreshortening instead of
dividing by it. ⭐ So the gravity channel — whose axis is nearly square to the view — kept up, and the
other two silently did not. ⚠ *"Not the same as the gravity axis"* is the tell, and it is an
**inconsistency between two channels of one rule**, which is a correctness claim rather than a taste.

⚠ The other two are **stated costs that a hand rejected**, which this ledger does not count: the
pairing was the dictation implemented literally, and the dead `dy` was written down as *inherent, not
tunable* the day it shipped. ⭐ A design I shipped with its cost named, and an owner who declined the
cost, is the loop doing its job — `QUEUE.md`: *tuning judgements are NOT defects.*

⭐⭐⭐ **WHAT MAKES IT INSTRUCTIVE IS THAT I OFFERED THE RIGHT ANSWER AND TALKED HIM OUT OF IT.** The
choice was put to the owner on 2026-09-22 as *stable projection* against *Blender-exact tracking*, and
the second was described as needing *"a refusal threshold (a guessed number)"* — true, but it is
**5°, and it is Blender's, published and unguessed**. ⚠ The owner chose from my description, and the
description was the weak part. ⭐ `METHOD` gains a line: *when an option is rejected for a cost, check
whether the cost is actually paid by prior art before letting the rejection stand.*

✅ **FIXED**: the finger's delta is SOLVED onto both horizontal axes (exact tracking, one gain across
all three channels), with Blender's 5° cone falling back to `depthTranslate`'s judged fixed rate
instead of Blender's near-stop. 38 vectors, six mutants caught → [`IN4.md`](IN4.md).


---

## 52 — ⭐⭐⭐ `D68` DESCRIBED A GUARD IT DID NOT HAVE, TWICE OVER

**2026-09-23, by finger.** *"When i double tap on the pioneer to change followerface, the
translation/rotation mode also toggles."*

⛔⛔ **THE RULE WAS RIGHT AND HALF OF IT WAS NOT WIRED — and it was wrong in two independent
ways, either of which alone leaves the session one toggle out.**

**One: the flag the revert reads had TWO writers, and the Pioneer takes the one that forgot.**
`D68` undoes the first tap's toggle when a press completes the pair, but only *"if the first tap
actually toggled"* — a fact the caller carries. ⚠ Two places flip the mode: `noteTap`, for a
touchpoint routed `OUTSIDE` or `SECOND`, which set the flag; and the OBJECT release, which did
not. ⭐ A double tap on the **Pioneer** is a tap on an object by definition, so it took the path
that never armed the revert, and the revert silently did nothing. ⛔ Every double tap tried
before this went through `noteTap`, which is why `D68` looked correct on the glass for two days.

**Two: the *release is spent* half was a `Set` that was written and never read.** `pairReverted`
had a doc comment saying *"their own release must add nothing, or a full double tap would end up
flipped by one"*, and nothing in 5,000 lines consulted it. ⚠ So a **completed** double tap went
toggle → revert → **toggle**.

⭐⭐⭐ **BOTH ARE THE SAME SHAPE, AND IT IS NOT A MISSING LINE.** A rule whose STATE lives in the
render layer has as many writers as someone remembers to update, and a guard nothing reads is
indistinguishable from a guard that works — *an absent readout cannot be caught by looking at
the screen*, one level down. ⛔ The fix is structural: `tapReleaseToggles` joins
`pairPressRevertsToggle` in `mode_toggle.ts`, both halves of `D68` are predicates over facts
rather than bookkeeping, and `scene.ts` has **one** function that flips the mode.

⚠⚠ **AND THE VECTORS COULD NOT HAVE CAUGHT IT, WHICH IS THE PART TO CARRY.** `pairPressRevertsToggle`
had green vectors for every combination of its two arguments. What nobody had written down was
the **sequence** — *tap, press that pairs, release* — and what it must come to. ⭐ The new vectors
state the net mode after a whole gesture, which is the only thing a hand can see; they are a model
of the wiring and say so, because the alternative was no statement at all.


---

## 53 — ⭐⭐ THE SWING NEVER SAW A VERTICAL APPROACH: ONE ACCUMULATOR, TWO WRITERS, ONE FED IT

**2026-09-23, by finger.** *"The swing of camera [is] missing at offset radius zone enter
sometimes when the follower approaches the pioneer from the gravity axis direction."*

⛔⛔ **THE RULE WAS NEVER WRONG — IT WAS NEVER FED.** `swingSignFor(right, up)` has always
answered `1` for a purely vertical travel, with a comment saying so: *"a translation with no
horizontal component: the swing is earned, the aim is symmetric."* ⚠ What it received was
`swingSignFor(0, 0)`, which is `null`.

⭐ **The accumulator had two writers and only one fed it.** `frameTravelRightM/UpM` were
incremented in the HOLDER's translate branch; the **second touchpoint's channel — which is the
gravity axis, i.e. exactly the approach the owner described** — applied its displacement and
recorded nothing. ⛔ *"Sometimes"* is the tell and it is precise: the swing armed whenever the
holder happened to be moving on the same frame, and not otherwise.

⭐⭐⭐ **IT IS DEFECT 52's SHAPE IN ANOTHER FILE**: *one fact, two writers, one of which forgot*.
⚠ Twice in one day makes it a pattern rather than an accident, and both times the missing line
was the symptom while the duplication was the cause.

✅ **FIXED STRUCTURALLY**: `applyWorldStep` is the one function that applies a translation to a
body, and it moves the body, feeds the swing's direction and records the travel direction the
LeadingFace ray is fired along — all three, or none. ⛔ A third channel cannot be added without
them. ⭐ 2 vectors compose the chain the scene threads and carry the counter-example the product
actually shipped.

⚠⚠ **THIS FIX SHIPPED ONCE BEFORE AND WAS REVERTED WITH WORK AROUND IT** (2026-09-23): it rode
in beside the zone decoupling and the `dy` swap, both of which the owner cancelled after a device
look. ⭐ The fix itself was never implicated — the regressions were an erratic swing (a pitch sign
read from the live elevation, which the swing moves) and a body freezing at the white contour (a
degenerate holder plane suppressing its channels) — so it is re-applied alone, which is what
reverting a BUNDLE of changes is supposed to make possible.


---

## 54 — ⭐⭐ THE GIZMO CHATTERED BETWEEN TWO FACES: A DIRECTION READ FROM ONE FRAME'S STEP

**2026-09-23, by finger, with two screenshots one drag apart.** *"In this situation (ongoing
translation = dx towards left) the gizmo keeps swapping between the face and the center of the
object."*

⛔⛔ **THE LEADING FACE WAS RE-CHOSEN FROM SCRATCH EVERY FRAME, FROM THE DIRECTION OF ONE FRAME'S
APPLIED STEP** — which is `QUEUE.md`'s **mistake shape 1**, *a rate estimated over the shortest
available baseline*, in its purest form. ⚠ `A11`'s deadband is **per axis**, so a slow, straight
drag emits the excess on one axis and nothing on the other: the step's magnitude is honest and its
**direction** alternates. ⭐ Two faces whose exit distances are close then swap the gizmo back and
forth, which is exactly what the two screenshots show.

⭐⭐ **THE CURE IS THE ONE THIS PROJECT HAS ALREADY USED TWICE** — the flick's travel (`D33`) and
the shake's axis (defect 45) were both fixed by reading over a **window** rather than by moving a
threshold. ⛔ Here a window is unnecessary: *a face the body is still advancing on stays the
leading one*, and `n·d > 0` is the whole test — a geometric boundary rather than a tuned one, so
there is no number to guess and no slider to ship.

⚠ **What it costs, stated**: after a direction change the gizmo can sit on a face that is no
longer the NEAREST exit until the body stops advancing on it. ⭐ That is still a face the body is
genuinely advancing on, which is all the gizmo claims.


---

## 55 — ⭐⭐⭐ A RULE KEYED ON A **NAME**: `"DEPTH"` IS A TRANSLATION, AND THE SWING DID NOT KNOW

**2026-09-23, by finger, the third report of one gesture.** *"Still no swing of camera when
follower enters offset radius zone from translation along gravity axis towards bottom."*

⛔⛔⛔ **ONE REPORT, TWO DIFFERENT CAUSES, TOLD APART BY ONE NUMBER ON THE HUD.** The owner sent
three screenshots and they arrived in the right order:

* `arm=(0.0,0.0)mm  sign⛔?` — the travel was never fed. That is **defect 53**, and fixing it
  changed the readout;
* `arm=(0.0,-11.6)mm  sign+  p=0.00  yaw=0.0°` — the travel **is** fed, a sign **is** derived, and
  the progress is frozen. ⭐ A different defect wearing the same symptom, and nothing but the
  instrument could have separated them.

⛔⛔ **THE CAUSE**: `swingDriverIndex` asked *is any grip's mode `"TRANSLATE"`*, and `scene.ts`
sets a holder's mode to **`"DEPTH"`** the instant the SECOND touchpoint drives its axis — which is
exactly the gesture reported. ⚠ So pushing a body along gravity **renamed the grip the swing was
looking for**: the driver came back `-1`, the swing took its *not driven* branch, froze the
progress, and **rebased `gapAtTriggerM` to the live gap every frame** — which is why `g0` on the
HUD tracked the approach down (64 mm, 102 mm, 148 mm) while `p` never left `0.00`.

⭐⭐⭐ **THE TRANSFERABLE SHAPE: *a rule keyed on a NAME inherits every later meaning of that
name.*** `"DEPTH"` did not exist as a mode when that test was written — `A10` added it — and it
quietly took a translation out of the set the swing accepts. ⚠ The rule was never edited and never
wrong on the day it was written, which is what makes this class invisible to review.

✅ **FIXED**: the driver is *a grip translating by **either** channel* — `"TRANSLATE"` or
`"DEPTH"` — with `"ROTATE"` and `null` still excluded, which is what keeps the 2026-09-19 report
(*a turn of the Pioneer orbited the camera*) fixed. ⛔ Written as a SET of the motions that
translate, so a channel added later is a decision rather than a silent omission.

⚠⚠ **AND A VECTOR ASSERTED THE DEFECT.** `swingDriverIndex(["DEPTH", null, "TRANSLATE"])` was
pinned to `2` — the `DEPTH` grip in slot 0 deliberately skipped. ⭐ It is inverted now and carries
its own retraction: *a green suite defended this for four days.*




---

## 56 — ⭐⭐⭐ **THE SWING'S AMPLITUDE READ THE HOLDER'S SPEED WHILE THE OTHER FINGER PUSHED**

**Diagnosed 2026-09-23 by finger** on `1.0.24-Swapped-inputs-Discarded` (*"the swing of the camera
at entrance of offset radius zone is not happening correctly"*, with two HUD shots reading
`motion STATIONARY`), **confirmed by reading on this branch, and ported here.**

⛔⛔⛔ `swingAmplitudeRad` was fed **`grip.rec.speedMmPerS` — the HOLDER's finger** — while the body
could be translated by the SECOND touchpoint. ⚠ The holder is then genuinely still, so the law read
`speed = 0`, **which it answers with the widest look**: `0` is its documented maximum, and correct
for a stopped hand. ⭐ So a second-finger approach swung at **full amplitude whatever the push**,
and the two dials the owner tuned on the glass on 2026-09-19 — the 67 mm/s knee and the 1.7
exponent — **never ran at all** for that gesture.

⚠⚠ **IT DOES NOT DEPEND ON THE `dy` SWAP**, which is why it is here: the second touchpoint drives a
TRANSLATION channel in either mapping (gravity here, depth there), and `grip.mode` becomes
`"DEPTH"` either way, so the swing finds its driver and then misreads its speed.

⭐⭐ **THE SHAPE IS DEFECT 55's, ONE LEVEL OVER**: *a rule that names ONE finger inherits every later
arrangement in which a different finger does the work.* `A10` gave the second touchpoint a
translation channel after this law was written, and nobody re-read the law.

✅ **FIXED**: `approachSpeedMmPerS` — the fastest finger driving this body — in `approach_swing.ts`
with the decision, not in the render file. ⚠ `max` and not a sum: the channels do sum (`D43`), but
the knee was tuned against *a finger's* speed and summing would double the reading when two fingers
move together.

⚠⚠ **AND THE SECOND TOUCHPOINT HAD NO SPEED TO READ**, which is why the wrong one was read: only a
holder grip carries a `Recognizer`. ⭐ `MotionTracker` now exposes `speedMmPerS` by **calling the
same `terminalSpeedPxPerS(trimBuffer(…))`** the Recognizer and the flick use — *one definition of
how fast is this finger*, and §1.1's unreachable `STATIONARY` is the scar from the alternative.
⛔ The RAW sample feeds that window, not the deadbanded travel, or the same finger would read
slower here than on a Recognizer.


---

## 57 — ⭐⭐⭐ **THE SWING'S DIRECTION WAS A ONE-FRAME LOTTERY, AND A LOST FRAME KILLED IT**

**Diagnosed 2026-09-23 by finger** on the discarded branch (`sign⛔? p=0.33 yaw=0.0°
arm=(0.0,0.0)mm`), **structural, and present here unchanged.**

⛔⛔⛔ `frameTravelRightM/UpM` are **consumed every frame**, so the arming edge sees only the travel
applied since the previous frame. ⚠ Cross the capture threshold on a frame that carried none — no
pointer event landed in that interval, or the deadband emitted nothing — and `swingSignFor` answers
`null`, correctly. ⭐⭐ **But that answer was latched for the whole approach**: the progress climbed
while the yaw stayed at `0.0°`. The swing ran, and pointed nowhere.

✅ **FIXED**: a `null` sign is **provisional**. The first frame that carries travel while the swing
is armed fills it in — `acquireSwingSign`. ⛔⛔ **AND IT RE-BASES THE TRIGGER GAP**, which is the
half that keeps it honest: the gap has closed meanwhile, so adopting the sign alone would jump the
camera to `yaw(p)`, and *"the camera shall not jump"* is a device report already paid for.
⚠ Cost, stated: a swing that finds its direction late completes its out-and-back in less distance,
so it is faster. That beats a jump, and it beats no swing.
⛔ It never re-signs a swing that HAS a direction — latching that is what fixed *"sometimes the yaw
is to the left bottom, sometimes to the right up for the same delta position x"* (2026-09-20).

⭐⭐ The 2026-09-20 rule was not wrong, it was **answering a different question**: *no travel, no
swing* is right for *"is there a direction?"*, and it was being asked *"was there one at that
instant?"* — which a 16 ms window decides by luck.

⚠ **AND IT NEEDED A THIRD TRAVEL COMPONENT TO BE EFFECTIVE.** `right` and `up` span the SCREEN, so
a body pushed along the gravity frame's own **depth** leaves no trace in either — which is exactly
what the holder's `dy` does at a **level camera**, where its plane is edge-on and `depthTranslate`'s
judged fixed rate drives. ⛔ There the backfill would wait for a travel that never arrives, so
`swingSignFor` now takes the along-view component too and answers `1` for it, on the same argument
as the vertical case: the swing is earned and the aim is symmetric.


---

## 58 — ⭐⭐⭐ **A SPEED THAT NEVER DECAYED — "I NEED TO WAIT A LITTLE AND THEN IT WORKS AGAIN"**

**Diagnosed 2026-09-23 by finger** on the discarded branch, **and the sentence is the diagnosis.**

⛔⛔⛔ `trimBuffer` ends the speed window at the **last sample**, not at now — so a finger that stops
emitting events keeps reporting the speed of a burst that has **already finished**, indefinitely.
⚠ Harmless where it was written: the flick asks at the release, where *now* and the last sample are
the same instant.

⭐⭐ The approach swing asks **mid-gesture**, and the amplitude law turns a stale-high reading into
nothing:

| finger speed | swing |
|---|---|
| 0–67 mm/s | 30° (the maximum) |
| 120 mm/s | 11° |
| 200 mm/s | **4.6°** |
| 350 mm/s | **1.8°** |

⭐ So an immediate second push inherits the first one's speed and barely swings; pause longer than
one window and the reading is honest again — which is precisely what the owner described.

✅ **FIXED**: `trimBuffer` takes an optional `nowMs`, and `speedMmPerSAt(now)` is what the swing
asks. ⛔ The default is unchanged, so the flick's release-time reading is exactly what it always was
— a window that ends at the last sample is right there and wrong here.
⭐ `METHOD`: *an estimator is only as fresh as the question's clock.* §1.1 learned the same thing
about `STATIONARY`, which is why `MotionTracker.tick()` exists — the SPEED was never given the same
treatment.

⚠⚠ **AND THE DAMPING LAW ITSELF IS WORTH A HAND'S JUDGEMENT, unchanged here**: the knee is
`1/gain` = 67 mm/s and an ordinary drag is several hundred, so the shipped dials put most real
approaches at **1–5°** of swing whatever the staleness does. ⭐ `?approachSwingSpeedGain=0` removes
the damping and pins the swing at `approachSwingDeg` — **one URL parameter, and it discriminates**
code from tuning.



---

## 59 — ⭐⭐ **THE GIZMO FLARED: A LENGTH TIED TO AN EXIT DISTANCE THAT GOES TO INFINITY**

**2026-09-23, by finger.** *"why do the gizmo sometimes flare to big dimensions and then goes back
to normal dimensions?"*

⛔⛔ The axis lines were `1.5 ×` the body's **exit distance** to its leading face, and that distance
is `t = (centre − origin)·n / (n·d)`. ⭐ As the travel direction `d` turns **parallel** to the face,
`n·d → 0` and `t → ∞`. ⚠ `D54` made the leading face **sticky** — it is kept for as long as the
body advances on it AT ALL — so a grazing direction holds a face whose exit distance is enormous,
and the snap back is the instant `n·d` finally crosses zero and another face takes over.

⭐ For the NON-sticky path this cannot happen: for a convex body the nearest exit is bounded by its
own extent. **The stickiness is what made an unbounded quantity reachable**, and sizing a visual
from it is what made that visible.

✅ **FIXED by removing the coupling**, which the owner's own change asked for anyway: the lines are
now sized from the **camera distance** and span the screen. ⭐ The gizmo's job is to point; its
length was never information. ⚠ `distanceM` still exists and is still reported on the HUD — it is
the measurement, and it is honest. Nothing else read it.


---

## 60 — ⭐⭐⭐ **A MODE NAMED AFTER AN AXIS: `"DEPTH"` HAD BEEN LYING SINCE `D75`**

**2026-09-23, by finger, and the owner named the cause himself.** *"Make sure the delta position on
the second touch triggers the gizmo in the same way as the delta positions of the first touch on
the object. It seems sometimes the gizmo does not show when the second touch is driving the
translation."* … *"the second finger should not set mode to depth since it is driving the
translation along gravity axis, not depth"* … *"or the name of the mode 'depth' is ill chosen."*

⛔ `refreshAxisGizmo` skipped every grip whose mode was not literally `"TRANSLATE"`, so the gizmo
vanished for exactly as long as the second finger was moving the body — **the moment a hand most
wants to see which way it is going**.

⭐⭐⭐ **AND THE NAME IS THE ROOT.** `"DEPTH"` was minted by `A10`, when that finger DID drive the
depth axis. `D75` moved it to **gravity** and the name stayed — so the mode announced the wrong
axis on the HUD and in every rule that read it, for a day. ⚠ It is the same root as **defect 55**
(the swing hunting for `"TRANSLATE"` and never finding a driver): *a rule keyed on a NAME inherits
every later meaning of that name*, and a name that states an AXIS goes stale the moment the
channels move.

✅ **FIXED twice over**: the mode is `"TRANSLATE_2ND"` — named for what it IS, a translation driven
by the second touchpoint, so it cannot go stale the next time the channels move — and the SET of
translating modes lives once in `src/input/grip_mode.ts`, which both the gizmo and the swing read.
⛔ A mode added later is now a decision in that file rather than a silent omission in two others.


---

## ⭐⭐ AND THE GIZMO NOW ANSWERS THE QUESTION A HAND IS ASKING (2026-09-23, the owner)

> *"the directions show full screen"* … *"the direction is shown only if the delta position
> triggers a translation in this direction. Therefore, for example, for a pure translation in the
> gravity axis only the green line would show. For a translation in the horizontal plane, both blue
> and red lines would show but not the green line."*

⭐ It used to draw all three axes always, which says *here is the basis* when the question is
**where will this push go**. ⛔ `displayedAxes` (in `src/input`) answers the second, and it keeps
the last non-empty answer so that a pause — or `A11`'s deadband emitting nothing on one axis —
does not blank the gizmo.

⛔⛔⛔ **AND THE FIRST BUILD OF IT READ THE WRONG END OF THE RULE**, which the owner caught within
the hour:

> *"on first touch, if there is only dx or only dy, the other gizmo line should not appear. Both
> red and blue gizmo lines should appear only if both dx and dy are not null."*

⚠⚠ It read the **travel** — and under `PLANE` a pure `dx` genuinely produces travel on BOTH
horizontal axes, because that is how the 2×2 solve keeps the body under the finger. ⭐ So a
single-axis drag lit red *and* blue, correctly by the arithmetic and wrongly by the question a hand
is asking. ⛔ It now reads the **channel that was pushed**, computed where the channel map is
applied (`AxisTravel.driven`) so that the map keeps ONE home and the readout cannot drift from it.
⭐ `METHOD`: *a readout that derives its own answer is a second implementation* — and here the two
implementations were both right about different quantities.



---

## 61 — ⭐⭐⭐ **A LATCH THAT NEVER LET GO: A FRUSTUM'S SIDES FACE AN UPWARD PUSH**

**2026-09-23, by finger, with a screenshot.** *"How is it possible that the green axis passes
through this face, instead of the blue face? I thought the delta direction would be taken from the
center of the object to identify the leading face and place the gizmo on the leading face: a
vertical translation along gravity axis should immediately select the blue face, not the left
face."*

⛔⛔⛔ **THE EXPECTATION WAS RIGHT AND THE RULE HAD A LATCH IN IT.** `D54` made the leading face
**sticky**: it was RETURNED whenever `n·d > 0` — any positive value, however grazing. ⭐ And
`objectB` is a **frustum** (`D72`): its sides lean inward going up, so their outward normals have an
UPWARD component. ⚠ An upward push therefore *"advances on"* a side face by a hair **for ever**, and
the gizmo stayed on the left side while the body rose.

⭐⭐ **IT IS ALSO DEFECT 59's CAUSE, ONE LAYER DOWN.** The exit distance the latch reported is
`(centre − origin)·n / (n·d)`, which is metres when `n·d` is a hair — that is what made the gizmo
FLARE before its lines were sized from the camera. ⛔ One latch, two device reports.

✅ **FIXED IN TWO PLACES, AND THE SECOND IS THE REAL ONE:**

* **the held face is a SEED, not a latch** — it is entered into the nearest-exit search, so it wins
  an exact TIE and loses to anything strictly nearer. ⭐ No threshold: `<` does the whole job.
* **the DIRECTION is accumulated over a window instead of read from one frame.** ⛔⛔ That was
  `D54`'s actual cause, and I had treated the symptom: `A11`'s per-axis deadband emits the excess on
  one axis and nothing on the other, so a straight drag produces a step whose DIRECTION alternates.
  ⭐ `accumulateTravel` sums the recent steps and `decayTravel` fades them with `τ = flickWindow` —
  this project's existing definition of *the recent past*, reused rather than invented.

⭐⭐⭐ **THE SHAPE, AND IT IS WORTH THE WHOLE ENTRY**: *when a rule reads a noisy quantity, the
fix belongs to the QUANTITY and not to the rule.* ⚠ Latching the face made the noise unobservable
instead of absent, and the hidden cost was a face that could never be given up — which is exactly
the report above. ⛔ `QUEUE.md`'s **mistake shape 1** (*a rate estimated over the shortest available
baseline*) is what a direction read from one frame IS, and the ledger named it in `D54`'s own entry
without acting on it.

⚠ Two vectors of `D54`'s are RETRACTED here, with their retraction on them: they pinned *"a face
the body is still advancing on is kept, even when another is a nearer exit"*, which is the sentence
the owner rejected.

---

# ⭐⭐⭐ 62 — **THE GIZMO JITTER: §1.1's REST WINDOW WAS SHORTER THAN THE DEVICE'S EVENT INTERVAL**

*(2026-09-24. Found by the owner's HUD reading, after NINE wrong analyses of mine.)*

> *"the motion keeps toggling back and forth very rapidly between MOVING and STATIONARY … When the
> jitter does not happen, the motion is stable at MOVING."* — the owner

## ⛔⛔⛔ THE CAUSE, IN ONE LINE

`AxisBand` declares an axis at rest after `restConfirmMs` of **silence**. Browsers dispatch pointer
input **once per frame per pointer** — which is why `getCoalescedEvents()` exists in the W3C
Pointer Events spec. ⚠ So the interval between a pointer's events IS the frame interval, and a rest
timeout shorter than it declares a **steadily moving finger STOPPED**, over and over.

⭐ Measured on the owner's tablet, PRODUCTION build:

```
  one finger   47–68 ms between that pointer's events
  two fingers  57–87 ms          (a 120 Hz phone would be ~8 ms)
```

⛔ The shipped **30 ms was below even the one-finger gap.** Every axis had been toggling mid-drag
since the day it was set; it only became visible when both fingers moved on straight diagonals, so
each finger's `x` and `y` reversed together and both axes stopped at the same instant.

## ✅ THE FIX: THE WINDOW IS DERIVED FROM THE DEVICE

```
restMs(pointer) = clamp(restGapFactor × median(that pointer's recent event intervals), floor, 250)
```

⭐⭐ **The MEDIAN, not the worst gap** — the longest gaps are REVERSALS, where the finger genuinely
stops and the browser dispatches nothing; feeding those in would inflate the window and defeat it.
⚠ `restConfirmMs` is now the **floor and the seed** (50 ms), never the threshold. Tablet → ~150 ms;
120 Hz phone → floors at 50 ms. Same meaning everywhere, timing following the hardware.
✅ 10 vectors, four mutants, judged on the glass: *"working well."*

## ⛔⛔⛔ NINE WRONG ANALYSES — READ THIS BEFORE PROPOSING A TENTH

The gizmo's marker position, its existence gate, its channel set, a memory, a bounded hold, the
device's event rate read as a channel decay, the anchor's orbit under rotation, sideways noise
waking the roll, and press order. ⚠ **Every one was reasoned from the code and every one died to a
single sentence of device evidence.** Several were shipped.

⭐⭐ **THE TWO LESSONS, AND THEY COST A WEEK:**

1. ⛔ *When a defect resists several correct-looking analyses, stop modelling the code and ask what
   the HAND is doing — and ask which HUD FIELD moves.* The owner's *"motion keeps toggling"* named
   the mechanism in one line after nine of my hypotheses had missed it. I was modelling the layer
   that DISPLAYED the defect instead of measuring the layer that produced it.
2. ⛔ *A threshold in milliseconds is a claim about the hardware.* 30 ms sat 3 ms below two frames
   at 60 Hz — it was never safe on any device that drops a frame, and no amount of reasoning about
   the rules above it could have been right.

⚠ **Everything the earlier attempts produced is DELETED**, not archived: the case-A-vs-case-B
distinction (false — both jitter), the noise-floor theory, the press-order theory, the
roll-riding-on-translation rule, the leading-face ray and its memory, and the bounded hold. ⛔ They
were wrong, and a wrong analysis kept "for the record" is a trap for the next reader.

---

## 63 — ⭐⭐⭐ **TWO FACE NAMESPACES, AND A NO-OP THAT BROKE AN ALIGNMENT** (2026-09-25, the owner)

> *"I hitface face1, I align face1 with pioneerface (OK), I hit face2, I align face2 with
> pioneerface (OK), I hit face1 again, I align face1 with pioneerface → in this last case, instead
> of aligning, it disengages the alignment and it goes back to face1 fuchsia highlight. Why? I
> would expect to continue the alignment logic instead."*

⭐ **The report is three presses long, and only the third misbehaves** — which is what makes it
worth reading twice. Nothing about the third press is different in kind; what differs is the
*state* the first two left behind.

### ⛔⛔⛔ THE CAUSE

`pressMeaning` has exactly one configuration that deliberately does **nothing**: *this held body
already follows this pressed body, on this very face.* The press does nothing, and the RELEASE
undoes the alignment (`D39`) — so a hand that presses and holds has not silently lost the
alignment it is looking at.

⛔ Under `D67` that test's two terms named faces of the **same** body. `D87` inverted the roles and
the test was carried over unchanged, so it then compared

* `alignedFaceOfHeld` — a face of the **held/Follower** body, against
* `pressedFace` — a face of the **pressed/Pioneer** body.

⚠ Face ids are generated **per body** (`f0…fN`, `mesh_topology.ts`), so `objectA/f4` and
`objectB/f4` are different faces carrying the same string. The third press hit the collision,
returned `NOTHING`, fell through to `D39`'s release — and **broke** the alignment the hand had
just made. ⭐ The fuchsia highlight coming back is the *symptom of the break*, not a second bug:
`hitFaceNow` refuses an aligned body, so the offer reappears the instant the alignment goes.

### ✅ THE FIX

⭐ The no-op now requires **three** terms, none of them compared across a namespace: same Pioneer
**body**, same Pioneer **face**, and the same **HitFace** on the held body. ⛔ `PressContext`
gained `pioneerFaceOfHeld` and `heldPressFace` to carry the two halves separately — the fix is
in the *shape of the question*, not in a guard added beside it.

### ⭐⭐ THE SHAPE, AND IT IS A NEW ONE

*An identifier that is unique only within a scope becomes a defect the moment a rule reaches
across scopes — and the reach is invisible, because both sides are typed `string`.*

⚠ This is what made it survive the inversion's own vectors: every fixture used distinct face ids,
so the collision was **unreachable by the suite** while being ordinary on the glass. ⭐ The vector
that pins it now sets the two ids **equal on purpose**, which is the same discipline the
2026-09-17 audit asked for — *a fixture chosen because it is easy to reason about is usually
chosen from the set where the quantity under test is ZERO.*

---

## 64 — ⭐⭐⭐ **THE UNDO DIED BECAUSE A LINE KEPT NAMING THE FINGER IT USED TO MEAN** (2026-09-25, the owner)

> *"Re-press the same pair on the same faces … this does not work: if I press again a followerFace
> and its pioneerface, the follower simply rotates to send the followerface 180 degrees out."*

### ⛔⛔⛔ THE CAUSE

`alignFollowerToPioneer` ends by wiping `pressFace` on the grip that is about to lift — *a
transient grip must not leave a stale face behind*, which is a good rule. ⛔ Under `D67` the
transient finger was the **Follower's** second touch, so the line read `followerGrip.pressFace =
null`. ⚠⚠ `D87` made the Follower the **held** body, and the line went on clearing it: the one
finger that has to keep its face for the whole hold.

⭐ Downstream, `pressMeaning` compared a live `alignedFaceOfHeld` against a `heldPressFace` that
was now always `null`, so *this body already follows this face* could never be true and `D39`'s
re-press had nothing to fire. The **next** press on the same hold then died earlier still, at
`align: press resolved no face`.

### ⭐⭐ THE COMMENT ABOVE THE LINE HAD ALREADY WARNED ABOUT IT, AIMED THE OTHER WAY

> *"Clearing the held grip's face instead would make the second Follower fail with no resolved
> PioneerFace — the same line, aimed at the wrong finger."*

⛔⛔ **An inversion does not have to touch a line to break it; it only has to change which finger
the line names.** ⚠ That is the same shape as defect 63 one layer up, and the same shape as `D89`
one layer down — three in one day, all from `D87`, none of them able to go red.

### ✅ THE FIX

⭐ The transient grip is an **argument** now, because the two call sites genuinely disagree: on a
PRESS the Pioneer's touch is the new one, on a RELEASE the follower's is the one lifting. ⛔ A
fixed answer is wrong for one of them whichever way it points. `METHOD`: *when two callers
disagree about a fact, the fact is an argument, not a constant.*

⚠ **Still open, and reported with the fix**: the RELEASE path's `tapMeaning` is still written in
`D67`'s direction, so the undo arrives through the cycle guard and the HUD says *"would cycle —
broke X's own alignment instead"*. Right outcome, lying readout.

⚠⚠ **And a second reading of the report survives**: if the holder is LIFTED and re-pressed before
the PioneerFace is pressed, what happens is a genuine re-point — after `D78` the FollowerFace
points **at** the Pioneer, so the face a finger can reach is usually the opposite one, and aligning
that one swings the body ~180°. ⭐ *When two readings fit one device report, name both* — the
2026-09-17 lesson, applied to the same file that earned it.

---

## 65 — ⭐⭐ **A FIXTURE SET WHERE THE QUANTITY UNDER TEST WAS ZERO, CAUGHT BY A MUTANT** (2026-09-25)

⭐ Not a device defect — a **vector** defect, found while proving `D90`'s new rule could fail.

`cycleBreaker` answers *whose alignment must be released for this link to be legal*. A mutant that
**deleted its cycle test entirely** — `if (false) return null` — stayed green against the whole
first fixture set.

⛔⛔ The reason is the 2026-09-17 audit's own shape. Every *legal link* fixture happened to use a
prospective Pioneer with **no Pioneer of its own**, so the mutant's fallback (`does this body have
an outgoing link?`) was `null` in all of them. ⚠ The quantity that separated the real rule from the
mutant was **zero in every case chosen to be easy to reason about**.

✅ The vector added is the ordinary assembly chain — `a→b→c`, then aligning `d` to `b`, which closes
nothing and must not cost `b` its link. ⭐ *A fixture chosen because it is easy to reason about is
usually chosen from the set where the quantity under test is ZERO* — and the only reliable way to
find out is to run the mutant.

---

## 66 — ⭐⭐⭐ **THE PRODUCT CHANGED SHAPE AND 1125 VECTORS STAYED GREEN** (2026-09-25)

⭐ Found by changing something, not by a finger — and the change was the owner's, so the vector
that should have caught it was under a hand at the time.

The owner scaled the pyramid. `render/scene.ts` owned `PYRAMID_DIMS_M`, and
`tests/highlight.test.ts` and `tests/frustum.test.ts` each kept **their own retyped copy**:

```ts
const PYRAMID: [number, number, number] = [1.5 * SIZE, 2 * SIZE, 3 * SIZE];
```

⛔⛔ So the product's body moved and the fixtures' body did not. The whole suite passed, including
the vector whose entire stated job is to guard the boot clearance — *"a fixture that had kept 320
would have gone on certifying a scene the product no longer builds"*, which is a sentence that was
sitting inside the very test that then did exactly that.

### ⭐⭐⭐ THE SHAPE

*A fixture that mirrors a constant is a second implementation of that constant, and it disagrees
exactly when the constant is the thing being changed* — the one moment the vector existed to
cover. ⚠ It is this project's own *shadow copy* scar (`frozenIds`, the `Map<name, dims>`, the
three globals the 2026-09-17 audit found) aimed one layer out, at the suite instead of the code.

⛔ **The tell is not visible in a review**, because both copies are correct on the day they are
written. It becomes visible only when one of them is edited, and then it presents as *everything
is green*, which is the one signal nobody investigates.

### ✅ THE FIX

`src/core/scene_dims.ts` — one home, engine-free, read by `scene.ts` and by both suites. ⭐ Three
assertions went **red the moment they were wired to it**, which is the proof they can.

⚠ And the numbers themselves are now stated as relations rather than literals wherever the
instruction was a relation: the pyramid's top face is asserted equal to `OBJECT_DIMS_M`, not to
`0.08`, so a fixture cannot be satisfied by retyping the answer.

---

## 67 — ⚠ **FOUR FIXTURE ERRORS IN ONE FILE, AND TWO WERE THE SAME OLD ONE** (2026-09-25)

⭐ Not product defects — `tests/ring.test.ts`'s first draft, kept because `METHOD`'s fifth shape is
*my own fixtures* and this is what it looks like in practice.

* **Two float32 traps.** Positions are a `Float32Array` all the way to the collision hull, so
  `0.32` is held as `0.31999999`. ⚠ `toBeCloseTo(…, 9)` demands `5e-10` of a representation whose
  own step there is `3e-8`. ⛔ `tests/frustum.test.ts` **already documents this exact trap**, and
  I walked into it again in a file written an hour later.
* **A flat quad's centroid is on the chord, not the arc** — `radius · cos(π/n)`, 0.9914 of the
  radius at 24 segments. The vector asserted the radius and failed by 1.4 mm.
* **An edge count guessed at `4N` when it is `6N`.** Counted afterwards: each annulus gives its
  outer rim and its hole's rim, and each wall's axial edges are boundary edges of two different
  logical faces. ⭐ Same shape `frustum.test.ts` records: *a vector written from an assumption
  about the code is not a vector about the code.*

⛔ All four looked exactly like real defects for as long as it took to read them.

---

## 68 — ⭐⭐⭐ **A CORRECT MESH THAT LOOKED LIKE A TORUS** (2026-09-25, the owner)

> *"you did not do a cylinder, you did a doughnut. add bevels on the sharp edges to keep them
> sharp. reduce both radius by half."*

⛔⛔ **THE GEOMETRY WAS RIGHT.** A hollow cylinder, flat annular ends, correct outward normals, ten
green vectors including one that asserts every face looks the way the profile says. ⚠ What was
wrong was the **shading**: the wall and the end face **share their rim vertices**, so
`VertexData.ComputeNormals` averaged across the rim and blended one surface into the other over the
whole face.

⭐⭐⭐ *A hard edge shaded as a soft one is a torus to the eye, whatever the vertices say.*

### ⭐⭐ THE OWNER NAMED THE FIX, AND IT IS THE MODELLER'S ONE

*Add bevels on the sharp edges to keep them sharp* sounds self-contradictory and is not: a narrow
chamfer confines the whole normal transition to a band a millimetre wide, so the rim reads as a
crisp line **and the curved wall stays smooth**. ⛔ The fix I would have reached for — splitting the
rim vertices so each face carries its own normal — keeps the rim sharp by facetting the cylinder
into 24 visible flats, which is a second defect.

### ⛔ WHAT IT COST, STATED

`146` logical faces on one body, against a cuboid's 6: four chamfer bands at `N` faces each, on top
of the two walls. ⚠ Every one is separately tappable, highlightable and mate-able.

### ⭐ THE SHAPE

*A vector suite that reads the geometry cannot see the shading, and the shading is what a hand
judges.* ⛔ Ten vectors passed on a body the owner rejected on sight — and they were not weak
vectors, they were vectors about the wrong layer. ⚠ This is rule 5 doing the only job it can do.

---

## 69 — ⚠ **A MUTANT FOUND AN ARM NOTHING COULD ENTER** (2026-09-25)

`addQuad` took the direction a face **looks** and derived the corner order from it — a guard that
reads as careful. ⛔ A mutant that deleted the derivation entirely left the mesh **byte-identical**:
all eight bands hand their corners over in the same rotational order, so one arm was never taken.

⚠ *A branch nothing can enter is the dormant-fork shape* `D28` and `D40` refused, and a safety net
nothing can fall into is not a safety net. ✅ Deleted.

⭐⭐ **AND TWO MORE MUTANTS HAD SURVIVED FOR A DEEPER REASON**: inverting the profile normal, and
ignoring the stated outward, both flip the winding **globally** — and `meshTopology` decides outward
by **signed volume**, so it silently corrects them and every normal assertion passes. ⛔ What it
cannot correct is the RENDERER: a globally reversed mesh is culled inside-out on the glass, with a
green suite. ✅ The suite now pins the **sign of the signed volume** as well, which is the half the
topology layer cannot recover — `mesh_topology`'s own *"no outline of any sort"* scar, aimed at the
other layer.

---

## 70 — ⛔⛔⛔ **A GUARD THAT HID DEBT, BECAUSE IT COUNTED NAMES AND NOT BINDINGS** (2026-09-25)

⭐ Not a product defect — a defect in `tests/unwired_debt.test.ts`, which is worse in one specific
way: it is the file whose whole job is to notice things nobody calls.

`productionRefs(name)` counts matches of `\bname\b` across `src`. ⛔ So a **local variable**
anywhere in the tree that happens to share a declared export's identifier reads as a use of it.

⚠ The instance: `render/desktop_input.ts` gained a local `const detach = () => {…}` for its
teardown. `core/object_model.ts` exports an assembly-tree `detach(world, id)` which is **declared
debt** — pending the row that will use it. The local made the word appear in production code, the
counter went non-zero, and the guard concluded the core export was now **wired**. ✅ Renamed to
`teardown`.

### ⭐⭐⭐ THE DIRECTION IS WHAT MAKES IT WORTH AN ENTRY

It does not invent debt, it **hides** it — a real unwired export drops off the list because
something unrelated borrowed its name. ⛔ A guard whose failure mode is silence is the shape
`METHOD` already names twice: *a skipped check must be announced*, and *an absent readout cannot be
caught by looking at the screen*.

⭐⭐ **AND IT SURFACED ONLY BECAUSE THE LIST IS ASSERTED IN BOTH DIRECTIONS.** `expect(unwired)
.toEqual(Object.keys(PENDING).sort())` fails when an entry *leaves* the set as well as when one
joins it. ⚠ A one-way check — *nothing unwired is undeclared* — would have passed in silence, and
the debt would have been quietly discharged by a rename. ⭐ *A test that can only fail in one
direction is half a test.*

⛔ **NOT FIXED, DELIBERATELY**: making the counter binding-aware means parsing TypeScript, which is
a great deal of machinery for a guard that works. ⚠ The weakness is written into the test's own
header instead, so the next reader meets it before it costs anything.

---

## 71 — ⛔⛔⛔ **A LAYER THAT REPLACED A WORKING STREAM INSTEAD OF ADDING TO IT** (2026-09-25, the owner)

> *"Not working. Delta position not working."* … *"In the commit `6a28e62` the desktop was working:
> left click of mouse was working as first touch and translation and rotation was possible. In the
> current commit, everything is almost frozen (for example, the camera orbits by one increment as
> if delta does not accumulate, no rotation or translation)."*

⛔⛔ **THE PREMISE I NEVER CHECKED WAS THAT DESKTOP DID NOT WORK.** Nothing in this project filters
on `pointerType`, and a move for a pointer that never pressed is already dropped — so a mouse had
been touchpoint #1 all along. ⚠ `D94` was written to *add* the second touchpoint and instead
**intercepted every mouse event and replaced it**, which took the working one away.

### ⭐⭐⭐ WHAT FOUND IT, AND IT WAS NOT AN ANALYSIS

Four causes were plausible and three died to a read (the deadband is ~13 px; `sampleOf` takes
`clientX/clientY`, which the synthetic events carry; Babylon falls back to `maxTouchPoints || 2`).
⭐ What settled it was the owner naming **a commit where it worked** — and a gap analysis showing
this layer was the **only functional change** between the two: `scene.ts` +22 lines, everything
else new files.

⚠⚠ `METHOD` already has the sentence and I did not apply it: *a device report is evidence about the
code the device was running.* ⛔ **Its converse is the one this cost**: a report that something is
broken is evidence about a CHANGE, and the fastest question is not *why is it broken* but *what did
it work at last*.

### ✅ THE FIX, AND THE RULE IT LEAVES BEHIND

**Pass through by default, intercept by exception.** The mapping now returns a `suppress` flag with
every verdict, and only three things are taken: the right button, `Shift`+drag, and the wheel.
⭐ Every other mouse event reaches the rules exactly as it did before the file existed.

⭐⭐⭐ **THE BLAST RADIUS OF A LAYER IS THE SET OF EVENTS IT SWALLOWS**, and it belongs in the
vectors. ⚠ The suite now asserts `suppress` on every path — a mutant that intercepts the left
button, which is precisely what shipped, goes **RED**.

⛔ And the readout that was built to diagnose this stays: `seen → sent → got` on the HUD, counted at
opposite ends of the chain.

### ⚠⚠ AND THE SECOND TOUCHPOINT STILL DID NOT ARRIVE — a second cause, on the same report

> *"Right click as second touch is not working: I cannot toggle the vertical translation - roll, I
> cannot select pioneerface."*

⭐⭐ **THAT IS AN A/B INSIDE ONE BUILD, AND IT IS WORTH MORE THAN ANY ANALYSIS.** With the left
button passing through and working, and the right button — the only synthetic one — producing
nothing at all, the broken link is named without a theory: **the real stream arrives and the
synthetic one does not.**

⛔ The first version dispatched synthetic `PointerEvent`s on the canvas and let Babylon's
`WebDeviceInputSystem` raise the notification. ⚠ I could not name the mechanism that swallowed
them, and three plausible ones had already been killed by reading — so the fix **removes the
dependency instead of guessing at it**: the synthetic pointer now goes straight to
`scene.onPointerObservable.notifyObservers`, with the pick computed by `scene.pick`.

⭐ Safe here for a stated reason, not a hopeful one: `scene.ts` calls **`camera.detachControl()`**,
so the scene's own handler is the only consumer of that observable and nothing can react twice.

⚠⚠ **THE MECHANISM IS STILL UNKNOWN**, and that is recorded rather than dressed up. ⭐ What the
change buys is that it no longer matters: one fewer layer between the mapping and the rule. ⛔ And
the readout still earns its keep — `got` must now rise by construction, so if the second touchpoint
is *still* inert, the fault is the rules refusing it and not delivery.
