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

## 56 — ⭐⭐⭐ **A CLIFF AT THE CONE: "BLOCKED" AND "ERRATIC" WERE THE TWO SIDES OF ONE NUMBER**

**2026-09-23, by finger, with a HUD.** *"There are still issues with blocking at white highlight
and erratic movement. **Debug better**, For example here"* — `PLANE track=0.00× ⛔EDGE-ON`, at
**one pointer**.

⛔⛔⛔ **THE TWO SYMPTOMS ARE ONE QUANTITY.** Exact tracking on a plane solves a 2×2 system, so the
body's world travel per unit of finger travel is **`1/|det|`** of the two axes' screen shadows. At
the shipped 5° cone that is **11.5× the finger** just outside the boundary — *erratic* — and the
degenerate branch below it projected the drag onto the two axes of a plane that is edge-on, which
returns ≈0 — *blocked*. ⚠ And the white contour is where `D74` **switches the basis**, so it is
precisely where a drag crosses the boundary: the two reports even shared a location.

⭐⭐⭐ **THE INSTRUMENT WAS THE DEFECT'S ACCOMPLICE.** `⛔EDGE-ON` was one boolean for two
different fallbacks, and `track=` measured only the two channels the *healthy* branch uses — so
the branch that had actually run reported `0.00×` while the body was being moved. ⚠ `METHOD`: *a
readout that reports a VERDICT and not the QUANTITY makes the next report unfalsifiable.* The HUD
now prints the branch by name, `|det|` **against the threshold it is compared to**, and the depth
channel's fallback separately.

⛔⛔ **AND I HAD ASSERTED THE CONDITIONING INSTEAD OF MEASURING IT.** The `D79` swap moved the
holder onto the `{x, gravity}` plane and I justified it in the commit message with *"a vertical
plane faces the camera at every ordinary pose"*. It does not: with `worldAxisB` the axes are frozen
at **boot**, so a quarter turn of orbit puts `x` along the view and `|det|` → 0 at a perfectly
ordinary camera — the pose in the owner's screenshot. ⭐ One sweep of `|det|` over azimuth would
have refused that sentence the day it was written. **A claim about conditioning is a measurement.**

✅ **FIXED, and the fix is that the degenerate branch stops being a different KIND of answer.**
Two builds tried to answer an edge-on plane while staying inside it — suppress the foreshortened
axis, then project onto both axes — and both froze the body, because a drag *across* an edge-on
plane has almost no component *in* it. ⭐⭐ When the plane cannot represent the drag, the body
**leaves it**: the screen-plane travel is decomposed onto all **three** object axes, which are
orthonormal, so the sum reproduces it exactly and the body follows the finger with a gain of 1.
⛔ Nothing suppressed (cannot block), nothing divided (cannot run away) — and it is **rule 6**,
closed by a device look on 2026-09-15, so the fallback is the best-attested rule in the product.
⚠ Its cost, stated: while that branch runs the holder moves the body along the second finger's
axis. Unavoidable — that is the component the plane cannot hold.

⭐ **`axisTrackingConeDeg` is 5 → 20**, and it is re-read as a **leverage bound**: `1/sin(cone)` is
the most the body may outrun the finger, 2.9× at 20°. ⛔⛔ 5° was **Blender's** number, adopted
with its question attached: Blender's cone protects a division from `NaN`, this one protects a
hand from a body that leaps. *Same mechanism, different question — and the number belongs to the
question.* ⚠ It is a judgement, it has a slider, and **no hand has judged it yet**.


---

## 57 — ⭐⭐⭐ **A DEAD FINGER WITH EVERY GUARD SATISFIED: THE TEST WAS ON THE WRONG QUANTITY**

**2026-09-23, by finger, build `dbca35d`.** *"The second touch is losing its input."*

⛔⛔⛔ Exact tracking along one axis is `travel = |m| · cosθ / |s|`, where `s` is the axis's screen
shadow and `θ` the angle between it and the finger's direction. **It fails in two directions:**

* `|s| → 0` — the axis points at the camera, and the travel **explodes** (defect 56);
* `cosθ → 0` — the finger's travel is square to the axis's screen line, and it **vanishes**.

⚠ The guard only ever asked about `|s|`. At the owner's camera the **depth axis lies horizontal on
the glass** while the second finger's travel is purely **vertical**: shadow length **1.000**, so
the cone passed without complaint, and the channel returned **exactly zero**. ⭐ The screenshot
carries the proof — the gizmo's blue axis runs across the screen and the red one is a stub.

⭐⭐⭐ **THE FIX IS ONE TEST FOR BOTH FAILURES**, because `|s · m̂| = |s|·cosθ` is small in either
case. It bounds the channel's gain from **both** sides: at most `1/sin(cone)` and at least
`sin(cone)` — *a channel may be weak; it may never be dead.*

⭐⭐ **THE SHAPE, AND IT IS THE SECOND TIME IN ONE DAY**: defect 56 guarded `|det|` when the
quantity that divides was the plane's conditioning; this guarded `|s|` when the quantity that
divides was the projection. ⚠ `METHOD`: **guard the quantity that is actually DIVIDED, not the one
that is easy to name.** ⛔ Both survived a green suite because every fixture happened to drag along
an axis that was well presented — mistake shape 5 again, from the other side: *a fixture chosen to
exercise the rule is usually chosen where the rule works.*



---

## 58 — ⭐⭐⭐ **AN INPUT KEEPS ITS AXIS: DEFECT 56's ANSWER, RETRACTED THE SAME DAY**

**2026-09-23, by finger, build `dbca35d`.** *"back and forth with dx translates in depth."*

⛔⛔ Defect 56 answered a frozen body by decomposing the finger's **screen** travel onto all
three object axes: the body followed the finger exactly, and paid for it by spending that travel
on **depth** — an axis the holder does not own. ⭐ The owner read it off the gizmo within the hour.

⭐⭐⭐ **AND HIS OWN EARLIER SENTENCE DECIDED IT, HOURS BEFORE I WROTE THE WRONG ANSWER.** Report
3, the same day: *"I would expect the object to continue translating with dy input (that should
translate the object **towards or away from the camera**, if the first point above is coherent)."*
⛔ A channel whose axis points at the camera is expected to push the body **along that axis** — not
to be re-pointed at a more photogenic one so the image keeps up with the finger. ⚠ I had read that
sentence as *"do not let it go dead"* and stopped there; it also says **which axis**.

✅ **FIXED**: a degenerate plane stops being a plane. Each channel falls back to **its own dictated
axis**, tracking where the axis is presented well enough to track and a fixed rate where it is not
— the same shape as the second finger's depth channel, which a device look closed on 2026-09-16.
⛔ `CHANNELS` got the fixed rates too; it could return 0 for a foreshortened axis, which is
precisely the dead channel report 3 rejected.

⚠⚠ **THE `x` CONVENTION IS AN AMBIGUITY, NOT A CHOICE I AM DUCKING**: an axis pointing at the
camera has no left or right on the glass. *Finger right = away* is continuous with the depth
channel's *fingers-up = away* — and **its sense reverses as the axis swings through edge-on**,
which no convention can bridge, because the two sides are mirror images. ⭐ A vector pins the part
that must hold anyway: within one pose, a back-and-forth drag returns the body exactly.

⛔ **What is given up, stated: in that pose the body no longer stays under the finger.** It cannot
— the finger is asking for a travel the dictated axes cannot show.

⭐⭐ **THE SHAPE WORTH CARRYING: I ANSWERED THE SYMPTOM THE OWNER NAMED AND NOT THE RULE HE HAD
ALREADY GIVEN.** *"Blocked"* has two fixes — *make it move* and *make it move where he said* — and
only the second survives contact with a hand. ⚠ It is the third time in two days that a sentence
already in the transcript would have settled a question I answered from first principles.



---

## 59 — ⭐⭐⭐ **THE ZONE'S APPROACH AXIS WAS ON THE WRONG CHANNEL, AND A SWAP MADE IT VISIBLE**

**2026-09-23, by finger.** *"There are still issues when the follower enters the offset radius
zone. In attached situation, the translation is blocked. I do not understand why a simple swap of
inputs has created so many issues."*

⛔⛔⛔ **THE DICTATION, AND I BUILT IT BACKWARDS.** *"object axis shall be aligned with LeadingFace
normal direction, gravity direction and direction orthogonal to LeadingFace normal & gravity
directions."* ⭐ Three directions, in the order `(x, gravity, depth)` this project names them in
everywhere else — so **x is the normal**. `axesFromLeadingFace` returned the normal as `depth` and
the orthogonal as `x`.

⭐⭐⭐ **AND THAT ANSWERS THE OWNER'S QUESTION, WHICH IS THE MORE USEFUL PART.** Until the `dy`
swap the holder owned `{x, depth}` — the WHOLE horizontal plane — and the 2×2 solve mixed the two
axes, so which of them was the normal **could not be observed**: no gesture, no vector and no
reading of the product could tell the two assignments apart. ⚠ The swap split that plane into
`{x, gravity}`, `x` became the body's only horizontal channel, and it was the one that does not
approach anything. ⛔ With the approach on the second finger, a one-finger drag inside the zone
could not close the gap at all — and `x` pointing at the camera in the broadside view a hand
orbits to made `det` read **0.000**, so what was left did nothing visible either. *Blocked.*

⭐⭐ `METHOD`: **a rule that COMPOSES two things cannot see a mistake about which of them is
which — and the day something stops composing them, every such mistake surfaces at once.** ⚠ That
is the honest answer to *"why has a simple swap created so many issues"*: it created almost none.
It **separated** two axes that had been travelling together, and the separation is what made a
day-old mis-assignment observable.

✅ **FIXED** in the definition, not at the point of use: `x` is the flattened normal, `depth` the
orthogonal, and the handedness invariant `x = up × depth` is KEPT (`g × (approach × g) = approach`)
so nothing reverses at the zone edge. ⭐ Inside the zone the holder's `dx` now drives the approach,
and the solved pair is `{approach, gravity}` — well presented in exactly the view a hand judges a
join from, so the degeneracy goes away by construction rather than by a fallback.

⚠ Four vectors were RED and the CODE is what changed; they are rewritten with the retraction on
them, plus one new property: *the approach lies entirely on the holder's `dx` channel.*


---

## 60 — ⛔⛔ **`"DEPTH"` IS A TRANSLATION — THE THIRD TIME, AND NOW IT IS A SET**

**2026-09-23, found by reading**, during the audit the owner asked for after defect 59.

⛔ The axis gizmo hid itself whenever `grip.mode !== "TRANSLATE"` — and `scene.ts` sets a holder's
mode to `"DEPTH"` the instant the second touchpoint drives its axis. ⭐ So the LeadingFace marker
vanished for exactly as long as the second finger was advancing the body, which is when a hand
most wants to see which face is leading. ⚠ The sway asks the same question one line after the
mode has been re-decided, and is therefore right **by an accident of ordering**.

⭐⭐ **SAME SHAPE AS DEFECT 55, IN A SECOND PLACE** — *a rule keyed on a NAME inherits every later
meaning of that name.* `"DEPTH"` did not exist as a mode when either test was written; `A10` added
it and quietly took a translation out of every set that had been spelled out by hand.

✅ **FIXED**: `src/input/grip_mode.ts` holds the set ONCE, as data, and both callers read it.
⛔ A mode added later is now a decision taken in that file rather than a silent omission in three
others. ⚠ It is in `src/input` and not in the render file for the reason defect 55 proved with a
mutant: *a rule in `scene.ts` is a rule nothing can interrogate.*


---

## 61 — ⭐⭐⭐ **THE BUILD LINE LIED ON THE USB LOOP — THE INSTRUMENT RULE 5 LEANS ON**

**2026-09-23**, on the device report for defect 59: the HUD read `build 9b2b049 2026-09-22 13:48Z`
— a commit from the previous day — while Vite was hot-serving the current source.

⛔⛔ `BUILD_ID` and `BUILT_AT` are computed **once, when the dev server starts**, and the dev
middleware serves that same frozen constant. ⭐ So both halves agree, nothing reloads, and both are
wrong after the first edit. ⚠ The code WAS current — the HUD printed `PLANE-PER-AXIS`, a string
that did not exist in `9b2b049` — which is the only reason the report was still usable.

⭐⭐ **AND THIS IS THE EXACT TRAP `build_gate` WAS WRITTEN FOR**, one surface over: on 2026-09-16
a stale Pages bundle indicted a correct fix for a morning, and the lesson recorded then was *check
the HUD's build line before judging any gesture*. ⛔ On the USB loop that line was answering a
question it cannot answer — worse than not answering, because it looks like information.

✅ **FIXED**: in `serve` the stamp reads **`dev-server`** and carries no commit id at all —
*suppress, do not guess*. A `build` keeps the real sha, so Pages and the staleness gate are
untouched. ⚠⚠ The decision is asked through Vite's own `command`, never sniffed from
`process.argv`, because the failure is **asymmetric**: stamping `dev-server` into a production
bundle would have `build_gate` compare an id against itself and **never refresh**, reinstating the
very failure it exists to prevent. ⭐ A vector pins that direction.



---

## 62 — ⭐⭐⭐ **THE ZONE EDGE TOOK THE APPROACH OFF THE FINGER THAT WAS DOING IT**

**2026-09-23, by finger.** *"The behavior is absolutely erratic when the follower enters the offset
radius zone with the dy input of the second touch (blocked on white highlight border, change of
directions, inversion of dy input direction, etc.). This is not good. I asked you to do a full
check and you failed."*

⛔⛔⛔ **THE EDGE REPLACED THE BASIS WITHOUT LOOKING AT THE OLD ONE.** `updatedObjectAxes` takes
`previous` and used it only as a REFUSAL — for a missing or horizontal leading face. So at the
crossing the mate basis was adopted in its CANONICAL orientation, and every channel's axis could
turn up to 90°, or reverse, mid-push.

⭐⭐ **AND THE WORST CASE IS THE COMMON ONE.** A hand pushes a body at another one; whichever
channel drives that motion is by definition driving the direction that is about to become the face
normal — and a fixed name-to-axis map hands the normal to whichever channel the DICTATION names,
which is usually the other one. ⛔ The body stops at the white contour because the finger that was
advancing it is now driving sideways. *"Blocked on white highlight border."*

✅ **FIXED**: `nearestOrientation` — the mate GEOMETRY is not negotiable, its ORIENTATION is.
`{approach, sideways}`, their negatives and the two swaps all describe the same pair of lines; the
zone now adopts the one whose `x` is nearest the `x` the body already had, and derives `depth` from
it so the frame stays right-handed. ⭐ No axis turns more than 45° and none reverses, so **the
channel that was doing the approach keeps doing it** — whichever finger that was, which is why it
answers this report AND defect 59's one-finger version of it.
⚠ What it gives up, stated: the in-zone assignment is no longer a fixed map. The same face can put
the approach on `x` for one approach and on `depth` for the next, depending on how the body
arrived. ⭐ That IS the rule: *differs as little as it can.*

⚠⚠ **AND DEFECT 59's PREMISE IS DEMOTED BY THIS.** I read the dictation's ordering — *"LeadingFace
normal direction, gravity direction and direction orthogonal"* — as naming which channel gets
which axis. It names three DIRECTIONS; the assignment was my inference. ⭐ Continuity is a better
rule than either reading, and it makes the canonical order almost irrelevant.


---

## 63 — ⛔⛔ **THE FALLBACK AIMED ITSELF BY A DIFFERENT QUANTITY THAN THE RULE IT REPLACED**

**2026-09-23, by finger**, in the same report: *"inversion of dy input direction."*

⛔ Exact tracking goes where `sign(m · s)` says — the axis's own screen shadow. The fixed rate
aimed itself by **`sign(towardGravity)`**, a camera ELEVATION, for `depth`, and by the axis against
the view direction for `x`. ⚠ Nothing made the three agree, so crossing the cone — which happens
exactly where a basis switches — could **reverse the body for the same finger movement**.

⭐⭐ `towardGravity` was the right quantity while `depth` **was the camera's own away-axis**. Then
`worldAxisB` froze the axes at boot and `D74` gave the zone a basis of its own, and a camera
elevation stopped saying anything about an arbitrary world direction. ⚠ Nobody re-derived the sign
when the axis stopped being the camera's; the parameter simply stayed.

✅ **FIXED**: the fallback replaces only the **RATE**. Its sense is `sign(m · s)` — the way the
body would have gone had the exact mapping still been trusted — so **it cannot invert at the
boundary, by construction**, because both sides read one quantity. ⛔ `towardGravity` is deleted
from the signature rather than left unread.
⚠ The genuinely ambiguous case keeps a stated convention: an axis EXACTLY at the camera has two
mirror-image answers, and *finger right, or finger up, pushes the body away*.

⭐⭐⭐ **AND A VECTOR ALREADY CLAIMED THIS PROPERTY AND COULD NOT FAIL.** *"the SIGN is continuous
through the cone — the defect that was found by finger"* has stood since the rule shipped — built
on `axesFromFrame(camera(0, 30).gravity)`, the CAMERA's own axes, at the same azimuth as the
cameras it then swept. ⛔ For a camera-derived axis `towardGravity` and the screen shadow agree by
construction, so the vector tested a set in which the two sign sources are the same number.
⚠ **The audit's own shape, the fifth time**: *a fixture chosen because it is easy to reason about
is usually chosen from the set where the quantity under test is ZERO.* ⭐ The replacement sweeps
60 camera poses against a WORLD-fixed basis and asserts the two branches agree — and counts how
many times the fallback actually ran, so a sweep that never reached it cannot pass for free.



---

## ⛔⛔⛔ A NOTE ON 59, 62 AND 63 — **THE RULE THEY FIXED WAS DELETED HOURS LATER** (`D82`)

**2026-09-23, the owner:** *"eliminate this rule: Inside the offset radius the axes are the
LeadingFace normal, gravity, and their orthogonal. Inside shall be the same as outside. I think
this is polluting the approach movement."*

⭐⭐ **THEY ARE KEPT IN FULL, AND NOT ONLY OUT OF TIDINESS.** Three of the four reports that day
were about a basis SWITCH: which channel owned the approach (59), what the crossing did to it
(62), and a fallback sign that did not match the rule it replaced (63). ⛔ Each fix was correct
about its own mechanism and none of them answered the owner's actual objection, which is that the
switch is felt at all.

⚠⚠ **WHAT SURVIVES THE DELETION IS DEFECT 63**, because its subject was never the zone: the
fixed-rate fallback's sense now follows `sign(m · s)` instead of a camera elevation, everywhere.
⛔ 59 and 62 are now unreachable — there is no in-zone basis to assign or to re-orient.

⭐⭐⭐ `METHOD`, and it is the entry worth carrying: **a rule whose every defect is about the
MOMENT it takes effect is a rule about the wrong thing.** ⚠ I fixed three mechanisms in a row
without once asking whether the mechanism should exist — the owner asked on the fourth report.



---

## 64 — ⭐⭐⭐ **THE SWING'S AMPLITUDE READ THE HOLDER'S SPEED WHILE THE OTHER FINGER PUSHED**

**2026-09-23, by finger, with two HUD shots.** *"in this situation (translation with dy second
touch), the swing of the camera at entrance of offset radius zone is not happening correctly."*

⛔⛔⛔ `swingAmplitudeRad` was fed **`grip.rec.speedMmPerS` — the HOLDER's finger** — while the
body was being translated by the SECOND touchpoint's `dy`. ⚠ The holder is then genuinely still
(both screenshots say `motion STATIONARY`), so the law read `speed = 0`, **which it answers with
the widest look** — `0` is its documented maximum, and correct for a stopped hand.

⭐⭐ So a second-finger approach swung at **full amplitude whatever the push**, and the two dials
the owner tuned on the glass on 2026-09-19 — `approachSwingSpeedGain` (the 67 mm/s knee) and
`approachSwingSpeedExponent` — were **bypassed entirely** for that gesture. ⚠ Not a small
mis-scaling: the damping law simply never ran.

⭐⭐⭐ **THE SHAPE IS DEFECT 55's, ONE MORE TIME**: *a rule that names ONE finger inherits every
later arrangement in which a different finger does the work.* `A10` gave the second touchpoint a
translation channel after this law was written, and nobody re-read the law. ⛔ 55 was the mode
NAME, this is the finger — the same class, and the third in two days.

✅ **FIXED**: `approachSpeedMmPerS` — the fastest finger driving this body — in `approach_swing.ts`
with the decision, not in the render file. ⚠ `max` and not a sum: the channels do sum (`D43`), but
the knee was tuned against *a finger's* speed, and summing would double the reading whenever two
fingers move together.

⚠⚠ **AND THE SECOND TOUCHPOINT HAD NO SPEED TO READ**, which is why the wrong one was read: only
a holder grip carries a `Recognizer`. ⭐ `MotionTracker` now exposes `speedMmPerS` by **calling the
same `terminalSpeedPxPerS(trimBuffer(…))`** the Recognizer and the flick use — *there is one
definition of how fast is this finger*, and §1.1's unreachable `STATIONARY` is the scar from the
alternative. ⛔ The RAW sample feeds that window, not the deadbanded travel, or the same finger
would read slower here than on a Recognizer.

⚠ **Noticed and NOT changed**: `g0` latches at the first frame inside the zone, so a fast push
can be ~14 mm past the contour before the swing arms (`g0=115mm` against a `129mm` offset in the
owner's shot). ⛔ Frame quantisation, not a rule — recorded because it makes the swing's
parameterisation start slightly inside the zone, and because a future report about *"the swing
starts late"* should find this line rather than re-derive it.



---

## 65 — ⭐⭐⭐ **THE SWING'S DIRECTION WAS A ONE-FRAME LOTTERY, AND A LOST FRAME KILLED IT**

**2026-09-23, by finger.** *"camera swing still not working. do a better job at debugging"* — HUD:
`sign⛔? p=0.33 yaw=0.0° g0=64mm arm=(0.0,0.0)mm driven`.

⛔⛔⛔ `frameTravelRightM/UpM` are **consumed every frame**, so the arming edge sees only the travel
applied since the previous frame. ⚠ Cross on a frame that carried none — no pointer event landed
in that interval — and `swingSignFor` answers `null`, correctly. ⭐⭐ **But that answer was latched
for the whole approach**: `p` climbed to 0.33 while `yaw` stayed at `0.0°`. The swing ran, and
pointed nowhere. ⛔ `g0=64mm` against a `65mm` offset says the crossing itself was clean — the
arming was right and only the direction was missing, which is why the readout mattered.

✅ **FIXED**: a `null` sign is **provisional**. The first frame that carries travel while the swing
is armed fills it in — `acquireSwingSign`, in `approach_swing.ts` with the decision.
⛔⛔ **AND IT RE-BASES THE TRIGGER GAP WHEN IT DOES**, which is the half that keeps it honest: the
gap has closed meanwhile, so adopting the sign alone would jump the camera to `yaw(p)`, and *"the
camera shall not jump"* is a device report already paid for. ⭐ Re-basing restarts the lean at zero
and grows it over whatever gap is left.
⚠ The cost, stated: a swing that finds its direction late completes its out-and-back in less
distance, so it is faster. That beats both alternatives — a jump, or no swing at all.
⛔ It never re-signs a swing that HAS a direction: latching it is what fixed *"sometimes the yaw is
to the left bottom, sometimes to the right up for the same delta position x"* (2026-09-20).

⭐⭐ **THE 2026-09-20 RULE WAS NOT WRONG, IT WAS ANSWERING A DIFFERENT QUESTION.** *No travel, no
swing* is right for *"is there a direction?"*; it was being asked *"was there one at that
instant?"*, which a 16 ms window decides by luck.


---

## 66 — ⚠⚠ **OPEN: A SWING ARMED AT 8 mm WITH A 129 mm OFFSET** (instrumented, not yet fixed)

**2026-09-23, by finger**, third shot of the same session: *"also not working in this
configuration"* — `sign- p=1.00 yaw=0.0° g0=8mm arm=(-37.5,0.0)mm driven`, `gap=0/129mm`.

⛔ The sign is present and the travel is large, so this is **not** defect 65. The swing armed with
**8 mm** of approach left against a **129 mm** capture offset: an out-and-back compressed into
8 mm is over before a hand can see it, and `p=1.00 yaw=0.0°` is the CORRECT reading of a swing
that has already returned to zero.

⚠⚠ **TWO MECHANISMS PRODUCE THAT AND ONE FRAME CANNOT TELL THEM APART**, which is exactly why
this entry exists rather than a fix:

1. **It re-armed mid-approach.** `inRange` flickers → the latch drops on the false frame and takes
   the CURRENT gap on the true one. Anything that moves the verdict does it: the pair lock, the
   alignment partners the verdict is keyed on (`D62`), or the offset itself, which `D49`
   recomputes every frame from the camera distance.
2. **It became true for the first time already deep inside.** The verdict only considers a body's
   ALIGNMENT PARTNERS, so a pair that becomes one late enters the zone at whatever gap it is at —
   and a rotation can collapse the surface gap between two hulls within a frame.

✅ **INSTRUMENTED**: the HUD now prints `arms=8←132 44←46 129←131` — the last three armings, newest
first, each with **the gap on the frame before it**. ⭐ One entry with a clean predecessor is a
normal crossing; a jump is mechanism 2; several entries is mechanism 1, settled at a glance.
⛔ No fix is guessed here: both candidates would take a threshold, and *a guessed number has been
wrong every single time on this project.*



---

## 67 — ⭐⭐⭐ **A HEAD-ON APPROACH FED THE SWING NOTHING — THE CASE IT EXISTS FOR**

**2026-09-23, by finger.** *"camera swing still not working in this configuration"* — HUD:
`sign⛔? p=0.33 yaw=0.0° g0=59mm arm=(0.0,0.0)mm` **while the gap closed from 104 mm to 40 mm**.

⛔⛔⛔ `applyWorldStep` accumulated the body's travel on the gravity frame's **`right` and `up`
only** — and those two span the SCREEN. The second touchpoint's channel is `depth`, which is
orthogonal to both, so a body pushed straight away from the camera reported **exactly zero in
both, every frame**. ⚠ `swingSignFor` answered `null` — correctly, on the evidence it was given —
and defect 65's new backfill could not help, because there was no travel for it to read either.

⭐⭐ **IT IS `D46`'s DEGENERACY, AND THE SWING WAS BUILT FOR IT.** A head-on approach is where a
hand has least depth cue; the parallax swing exists to supply it. ⛔ So the rule was silent
exactly where it was most wanted, for as long as the second finger was the one pushing.

✅ **FIXED**: `frameTravelDepthM` is accumulated beside the other two, and `swingSignFor` takes a
third component — the same answer as the vertical case, `+1`, on the same argument: *the swing is
earned, the aim is symmetric.* ⭐ A real `dx` still decides when there is one, which is the
owner's own wording.

⭐⭐ **AND THE READOUT WAS COMPLICIT, THE THIRD TIME IN TWO DAYS.** `arm=(0.0,0.0)` cannot tell
*nothing moved* from *it moved along the axis I do not measure* — it now prints all three.
⚠ `METHOD`: **a readout that reports only the components the rule uses cannot distinguish "nothing
happened" from "something happened where I do not look."** Defect 56's `track=0.00×` was the same
sentence about a different number.


---

## 68 — ⭐⭐ **THE SWING'S WIDTH FOLLOWED THE FINGER'S SPEED, AND A RETRACTION MADE IT BREATHE**

**2026-09-23, by finger.** *"camera swing jitters and does not work when I retract the follower
from the offset radius area in this configuration (dy with second touch to move the object towards
the right)."*

⛔ `swingAmplitudeRad` reads the driving finger's speed **live, every frame**, and a retraction is
where speed does its worst: the hand slows, stops, reverses. ⚠ The law answers a slow hand with a
WIDE swing — `speed = 0` is its documented maximum — so the lean breathes in and out while the gap
barely moves. ⭐ That is the jitter, and it is not the estimator: it is the law.

⭐⭐⭐ **THE FIX WAS PRE-REGISTERED IN THE FUNCTION IT FIXES.** `swingAmplitudeRad`'s comment has
carried it since 2026-09-19: *"⚠⚠ WHAT TO WATCH ON THE GLASS: DECELERATING WIDENS THE SWING … a
motion the gap did not ask for. ⭐ The one-line alternative if a hand dislikes it: latch `A` at the
trigger."* ⚠ A hand disliked it, four days later. ⛔ `METHOD`: **a cost that is written down is not
thereby paid** — writing it down bought the diagnosis in one read, and nothing else.

✅ **FIXED**: the width is latched once, from the speed at the moment the swing has both a
direction and a driver, and held for the approach. ⛔ After that the GAP alone moves the camera,
which is the owner's own spec.
⚠ Given up, stated: a hand can no longer widen the look by changing pace mid-approach.
⛔ `smoothAmplitude` and `SWING_TAU_MS` are **deleted** with their vectors — they filtered a
fluctuation that no longer exists, and `unwired_debt.test.ts` is what noticed they had become
inert. ⭐ The 2026-09-19 report they answered was real; the wobble is now removed at its source.



---

## 69 — ⚠ **THE SWING SAID NOTHING WHEN IT WAS NOT ARMED** (an instrument, not a rule)

**2026-09-23.** Two device reports — *"camera swing still not working in this configuration"* —
arrived with HUDs taken **out of range** (`gap=85/79mm`, `gap=183/129mm`), where no swing is the
correct behaviour. ⛔ And the readout printed **nothing at all** about the swing, because the whole
line was suppressed while the latch was `null`.

⭐⭐ *"Not working"* and *"not armed yet, and here is the number that decides it"* are different
reports, and only the second can be acted on. ✅ The line now always prints: the reason it is not
armed (out of range with the gap and the offset, not translating, no pair) **and the arming
history**, so an approach that failed to swing can still be read after it has ended.


---

## 70 — ⭐⭐⭐ **A SPEED THAT NEVER DECAYED — "I NEED TO WAIT A LITTLE AND THEN IT WORKS AGAIN"**

**2026-09-23, by finger.** *"sometimes, it seems I need to wait a little before redoing the same
translation movement, and then the camera swing works again."*

⛔⛔⛔ **THAT SENTENCE IS THE DIAGNOSIS, AND IT NAMES A STALE QUANTITY.** `trimBuffer` ends the
speed window at the **last sample**, not at now — so a finger that stops emitting events keeps
reporting the speed of a burst that has **already finished**, indefinitely. ⚠ Harmless where it
was written: the flick asks at the release, where *now* and the last sample are the same instant.

⭐⭐ The swing asks at the **start of an approach** — the moment most likely to sit in the shadow
of the previous push — and since defect 68 it **latches** the answer for the whole approach. ⛔ So
an immediate second push inherits the first one's speed, and the amplitude law turns that into
nothing:

| finger speed | swing |
|---|---|
| 0–67 mm/s | 30° (the maximum) |
| 120 mm/s | 11° |
| 200 mm/s | **4.6°** |
| 350 mm/s | **1.8°** |
| 500 mm/s | 1.0° |

⚠⚠ **SO THE WHOLE DAMPING LAW IS WORTH A SECOND LOOK ON THE GLASS.** The knee is `1/gain` =
67 mm/s and an ordinary drag is several hundred, so the shipped dials put most real approaches
into the 1–5° range whatever the staleness does. ⭐ `?approachSwingSpeedGain=0` removes the
damping entirely and pins the swing at `approachSwingDeg` — **one URL parameter, and it
discriminates**: if the swing then works in every configuration, the law is the remaining problem
and the dials need re-judging, not the code.

✅ **FIXED** (the staleness): `trimBuffer` takes an optional `nowMs`, and `speedMmPerSAt(now)` is
what the swing asks. ⛔ The default is unchanged, so the flick's release-time reading is exactly
what it always was — a window that ends at the last sample is right there and wrong here.
⭐ `METHOD`: *an estimator is only as fresh as the question's clock.* §1.1 learned the same thing
about `STATIONARY`, which is why `MotionTracker.tick()` exists — and the SPEED was never given the
same treatment.
