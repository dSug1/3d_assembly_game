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

## ⛔⛔⛔ **THE LEADING FACE FOLLOWS THE INPUT — and the memory I proposed was REJECTED**

> *"when I transition fast from horizontal movement to vertical movement, there is a slight moment
> when the green line passes through the left face and then relocate to the blue face. This is
> annoying. Is that due to the inertia and lerp we have added to the translation movement?"*
>
> *"I am not satisfied by your solution, so I discarded the commit. **You can lag the travel, but
> the input itself has no lag. The gizmo repositioning should match the input, not the travel and
> its lag.**"* — the owner, 2026-09-23

⭐⭐ **THE QUESTION HAD A MEASURABLE ANSWER AND IT WAS NO**: `translateInertiaMs` is **7.6 ms**,
half a frame, critically damped. ⛔ The lag was the **direction memory I had added an hour earlier**
(defect 61) — `flickWindow` at 120 ms, reused because it was to hand rather than measured. After a
change of direction the old travel fades as `e^(−t/τ)` while the new grows, so the face flips at
roughly `τ/2`: 3–4 frames.

⛔⛔ **AND MY FIRST ANSWER TO THAT WAS A DIAL, WHICH THE OWNER REFUSED.** Making the memory tunable
kept the lag and handed the trade to a hand. ⭐ His correction is a rule, not a number: *the gizmo
follows the INPUT*, which cannot lag. ⚠ `leadingFaceMemoryMs`, `accumulateTravel` and `decayTravel`
are **deleted** with their vectors.

✅ **SO THE RAY IS AIMED BY WHAT THE CHANNELS ASK FOR ON THE FRAME THEY ASK IT** — the mapped
input, summed over both fingers, consumed every frame. ⛔ No accumulator, no time constant, and a
change of direction moves the face on the very frame the hand changes it.
⚠⚠ **WHAT IT GIVES UP, STATED**: `D54`'s chatter had two answers — the latch (defect 61 removed it)
and the memory (this removes it). ⭐ What is left against chatter is the SEED: the held face wins an
exact tie. If the gizmo flickers between two nearly-tied faces on a slow drag, that is this trade,
and by the owner's own rule the fix belongs to the direction rather than to a latch.

⭐⭐⭐ `METHOD`, twice over: *a number borrowed because it was to hand is a guess wearing another
rule's authority* — and *when a hand rejects a solution, the useful part is which PROPERTY it
violated.* Here it was **latency**, and no value of a time constant could have satisfied it.

✅ **AND THE MARKER IS A CIRCLE, NOT A DISC** — *"I asked you to insert a white circle at the
center of the gizmo, not a white disc."* ⚠ The first build was a small SPHERE, which reads as a
filled disc from every angle. ⭐ It is now a 48-segment OUTLINE, **billboarded** so it stays a
circle rather than foreshortening to a line edge-on — which is exactly the pose a hand judges an
approach from — sized in pixels through rule 6's tracking factor, and in the gizmo's own rendering
group so the body cannot occlude it.



---

## ⭐⭐⭐ **THE GIZMO'S RAY: THREE RULES, TWO REJECTED BY A HAND, AND ONE QUANTITY TO BLAME**

**2026-09-23, three device reports in a row**, each rejecting the rule that answered the one before:

1. *"there is a slight moment when the green line passes through the left face and then relocate
   to the blue face"* — against a direction with **120 ms of memory**;
2. *"still, there is a slight lag for the repositioning of the green line to the leadingface"* —
   against the memory-free **vector SUM** of the channels;
3. *"when I translate any object with a combination of dx on first touch and dy on second touch
   (both not zero), the gizmo jitters position between faces. This occurs for rectangle as well as
   for pyramid."* — against the **dominant channel**.

⛔⛔⛔ **ALL THREE FAILURES ARE ONE QUANTITY: A PER-FRAME MAGNITUDE.** `A11`'s deadband emits an
axis's travel in **bursts** — the excess over a dead radius, on whichever axis has crossed it — so
under a perfectly steady two-finger push the channels take turns being the larger. ⭐ A sum built
from those magnitudes wobbles; a winner chosen from them alternates; a memory that smooths them
lags. ⚠ Each rule failed differently and none of them was about geometry.

⭐⭐ **AND THE GEOMETRY MATTERED ONCE, WHICH IS WHY REPORT 2 WAS NOT TIMING.** Measured for
`objectB` (half-extents `0.75 × 1.0 × 1.5 L`, sides leaning in by `0.1875`), the TOP face is the
nearest exit only within **29.4°** of vertical:

```
 0deg off vertical -> top 1.00L  side 4.00L  => TOP
20deg               -> top 1.06L  side 1.45L  => TOP
29deg               -> top 1.14L  side 1.16L  => TOP
30deg               -> top 1.15L  side 1.13L  => SIDE
45deg               -> top 1.41L  side 0.89L  => SIDE
```

⚠ So any residual horizontal travel above ~56% of the vertical kept the summed ray on the side,
where the side genuinely IS the nearer exit. The gizmo was right and looked wrong.

✅ **THE RULE THAT STANDS: the ray is the sum of the axes BEING SHOWN, each with its own sense and
EQUAL weight.** ⛔ The SET is stable — it is the same `displayedAxes` answer that decides which
lines are drawn, so the face and the lines are one fact — and nothing in the ray depends on how
much either channel emitted this frame. ⭐ One channel aims along its own axis with no lag; two aim
at the diagonal between them and stay there.

⭐⭐⭐ `METHOD`: **when three different rules over one quantity all fail differently, the quantity
is the defect.** ⚠ I answered each report by changing the rule — memory, then sum, then dominance
— and the owner had to report three times before I stopped and asked what they had in common.
⛔ They read a magnitude that `A11` was never going to deliver smoothly.

⚠⚠ **AND TWO OF MY VECTORS COULD NOT FAIL**, caught by running mutants rather than by reading:
one compared channels at a camera where the two candidate rules happen to agree, and one applied
`Math.sign` on both sides of the boundary it was testing, so each half covered for the other.
⭐ The first was fixed by SWEEPING for a camera where the rules disagree; the second by handing
the rule raw magnitudes and demanding the same answer.



---

## ⛔⛔⛔ **THE GIZMO USES THE TRANSLATION'S OWN DEADBAND — and the owner found the fix**

> *"add a slight deadband on the delta position input so that there is no gizmo jitter. I suppose
> there is a deadband for the object translation: **use the same deadband for the gizmo
> repositioning**."* — the owner, 2026-09-23

⭐⭐⭐ **THE DEADBAND WAS ALREADY THERE, AND THE GIZMO WAS READING THE WRONG SIDE OF IT.** `A11`
emits the **excess** over its dead radius, on whichever axis has crossed it — so *"did this channel
emit this frame"* flickers in bursts even while a hand pushes both fingers steadily. ⛔ The gizmo's
set of lines followed those bursts, and the face followed the set.

⭐ The same machine also keeps a per-axis **STATE**: `MOVING` until that axis has rested for
`restConfirmMs`. ⚠ That is the stable form of the same fact — one dead radius, one rest time,
**shared with the translation rather than copied**, which is exactly what the owner asked for.

✅ `activeChannels(holderAxes, secondAxes)` applies the channel map to those states:
the holder's screen `x` → the body's `x`, its screen `y` → `depth`, any second touchpoint's `y` →
`gravity`. ⛔ `Recognizer.motionAxes` is exposed for it rather than a second definition of *moving*
being written, and `AxisTravel.driven` — the per-frame emission test — is **deleted**, because it
had exactly one reader and this replaces it.

⭐⭐ **THE ARC OF THIS ONE IS THE LESSON.** Four rules were tried for the gizmo's direction — a
120 ms memory, the vector sum, the dominant channel, the channel set — and the first three failed
on the same quantity: a per-frame magnitude. ⚠ The fourth held, and its remaining flicker came
from the same place one level down: a per-frame BOOLEAN, *did it emit*. ⛔ The owner named the
answer in one sentence, and it was to reuse a number the product already had.
⭐ `METHOD`: *when a rule needs to know whether an input is active, ask the state machine that
already decides it — do not re-derive it from what the input emitted this frame.*
