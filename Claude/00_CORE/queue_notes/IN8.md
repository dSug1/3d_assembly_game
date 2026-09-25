# `IN8` — two touchpoints on the SAME object

**Status: ✅ DECIDED 2026-09-14 by the owner. Unblocks `IN2`.**
Spec reference: [`SPEC_INPUT_SYSTEM_R5.md`](../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md) §5.

## The question

§5 lists it among the deferred gaps, *"currently undefined and reachable"*, and offers
exactly two readings:

1. **Ignore the second hit.**
2. **Use the segment between the fingers to specify a rotation axis.**

⚠ It is reachable, not theoretical: rule 6 asks for one finger on the object and one
*outside* it, and the natural way to steady a grip is to put the second thumb down on
the part itself. Without a decision the second press falls into whichever branch of
§4's role latching it happens to match — which is the definition of undefined.

## The decision

⭐ **Reading 1 — IGNORE THE SECOND HIT — for the moment.**

The second touchpoint is **not** given a role, does not become an anchor, and does not
start a second recognizer. The gesture in progress continues as though it had not
happened.

⚠ *"For the moment"* is the owner's wording and is kept: reading 2 is not rejected on
its merits, it is deferred. Revisit it if a rotation axis by two fingers is wanted
later — it is additive, and nothing here forecloses it.

## What this binds in `IN2`

⛔ **The role latch (§4) must be able to say NOTHING.** Today a press is either *on an
object* or *outside any object*; this decision adds a third outcome — **ignored** — and
it must be latched at press like the other two, for the lifetime of that touchpoint.
A touchpoint that is ignored at press must stay ignored even if the finger later slides
off the object, exactly as an anchor stays an anchor when it slides onto one.

⛔ **Its release must not end the gesture either.** Lifting an ignored touchpoint is not
a release of anything, and must not run the §1.3 release verdict, the flick test, or
the tap history. ⚠ This is where the shape is easy to get wrong: the pinch code already
had to learn that *lifting one of two fingers ends the pinch*, and the opposite is true
here.

⭐ **Both properties are vectors, and they are the ones to write first** — an ignored
touchpoint that silently re-enters the state machine is precisely the kind of defect
that has only ever been found by finger on this project.

## Not decided here

The **count**. Three or more touchpoints on one object follow the same rule by
construction (every hit after the first on an already-held object is ignored), but
nothing has been measured about palm contact, which is the realistic source of a third
point. ⚠ `IN5`'s territory, and only observable on glass.

---

## ⚠ SUPERSEDED 2026-09-15 — the second touchpoint now PARTICIPATES (`D16`, amendment A5)

⛔ **`D10`'s "ignore the second hit" is obsolete.** Two touchpoints on the same object are a
**depth pinch**: pinch in to push the object away, pinch out to bring it closer.

⭐ **Reading 2 was recorded here as *deferred, not rejected*, and this is that re-opening** —
though it did not arrive the way this dossier expected. Reading 2 was *a rotation axis
between the fingers*; what a hand actually reached for was depth.

⚠ **The accepted behaviour goes with the decision.** *"Lift the holding finger with a second
finger still on the same part and the part stops responding"* was judged on the glass and
accepted — as the least-bad consequence of ignoring the second hit. ⭐ A5 removes the dead
end rather than accepting it: the configuration now means something, and lifting one finger
returns to one-touchpoint rotation.

⛔ **What `IN2` must change.** `IGNORED` survives, but its trigger moves: the **second**
touchpoint on an object participates, the **third and beyond** are ignored. `activeCount`
and the 22 router vectors are written against the old rule.

⭐ Full reasoning, the computed gain, and what was deliberately left undecided:
[`../../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../../10_INPUT_TOUCH/AMENDMENTS_R5.md) A5.

---

## 🔌 WIRED 2026-09-15 — A5 is reachable by a finger

`IN2`'s router learned the `PINCH` role and `scene.ts` runs the rule. ⭐ **This is the
first thing since the `3D1` device pass that a finger can judge.**

### ⭐ Why a NEW role rather than a second `OBJECT`

Making the partner `OBJECT` would put two entries in `objects()` for ONE object — and
rules 5, 6bis and 6ter all read that list as *two DIFFERENT objects*. They would fire on a
single pinched part, **silently**. ⛔ A vector asserts `objects()` stays at one while
`pinches()` reports the partner.

### What the roles mean now

| touchpoint | role | why |
|---|---|---|
| first on an object | `OBJECT` | holds it, runs the §1.3 recognizer |
| **second on the SAME object** | ⭐ `PINCH` | A5's partner. **Carries the object** — the rule must find the pair |
| third and beyond | `IGNORED` | no meaning, and must not turn a two-touchpoint rule into a three-touchpoint one |

⭐ `activeCount` **counts the partner** (a rule can see it) and still excludes `IGNORED`.
⚠ That is what keeps the eviction shake off during a pinch — A4 is gated on
`activeCount === 1`.

### ⛔⛔ The trap the wiring had to avoid: A RATIO IS NOT AN INCREMENT

`PinchTracker.scale` returns a ratio against the gesture's **START**. Applying it to the
object's **current** position each frame would COMPOUND it, and a pinch out and back would
not return. ⭐ So the object's position, the view axis and the tracker are all captured at
the pinch's start — the same discipline `pinch.ts` uses for the camera's
`zoomAtPinchStart`. ⚠ The view axis is latched for §4's reason too: a camera that moves
mid-gesture must not redefine which way *"away"* is under a finger already down.

### ⭐ One implementation, two triggers

`applyDepthPinch(mesh)` is called from the holder's move **and** from the partner's. A
partner has no recognizer, so without its own branch its motion would do nothing at all —
and the holder's branch alone would make the gesture work only while the *first* finger
moved.

⛔ **It takes precedence over rotate and translate.** A part that spun while being pushed
away would be two rules answering one hand.

⭐ And the readout says `DEPTH` even when it is the PARTNER that moved: a mode saying
`ROTATE` while a pinch drove the object would send the next debugging session to the wrong
rule.

### ⚠ Known gaps, recorded rather than silently changed

* **No sympathetic sway during a depth pinch.** The sway is told whether it is
  *translating* from the latched mode, which is `ROTATE` while a pinch runs. ⚠ Decoration
  only.
* **No visible partner indicator.** §6 asks for a ring on the anchored object — `RND3`.
* ⛔ **The gesture reaches a wall**, and sooner than feels natural — see the tight ceiling
  in `src/input/depth_pinch.ts`.

---

## 🔧 TUNED 2026-09-15 — the slider, the sway, and the ceiling made VISIBLE

Owner, after the first device look at A5: *"the rest is OK."*

* ⭐ **`gainPinchDepth` has a slider**, in **OBJECT TRANSLATION** as asked (0.25–3, step
  0.05). ⚠ It is an EXPONENT on a ratio, not a multiplier on a distance, so the useful
  range is narrow and centred on 1 — and 1 is the COMPUTED value, so the slider exists to
  **disprove** it rather than to find it.
* ⭐⭐ **The sympathetic sway now answers a push as well as a drag**, and it is the SAME
  implementation: `nudgeOthersWorld` took the world direction out of `nudgeOthers`, which
  now converts its screen heading and hands it over. ⛔ **No new slider** — amplitude,
  softness, re-trigger and reference speed are the four the drag already uses, per the
  owner's instruction. A second copy would let the scene lean one way for a drag and
  another for a pinch.
* ⭐⭐ **The trigger is `SwayWatcher` fed the FINGER SEPARATION**, and the units are why
  that is a reuse rather than a hack: a separation is a pointer-space distance, so the
  MEASURED `pointerNoiseMm` means the same thing to it. ⛔ A new detector would have needed
  its own noise floor, and 0.761 mm was paid for once — it is not transferable by
  assumption.

### ⚠ "I can't see the object hitting any wall. Not sure about your ceiling."

⭐⭐ **So the ceiling is now ON THE HUD** — `depth=1.42m [0.02–3.0]`, with `⛔MAX` or
`⛔MIN` when it is actually pinned. ⛔ `METHOD`: *a claim a device cannot check is an
assertion, not a finding*, and "there is a tight ceiling" was mine, unverified, from a
vector rather than a hand.

⚠ **If it never reads `⛔MAX` in ordinary use, the warning in `depth_pinch.ts` is the thing
to correct**, not the ceiling. The reading settles it either way, which is the point.

### ⛔ A REAL LIMITATION, REPORTED BY FINGER — a small object cannot be pinched

> *"When the object is small, it is not possible to pinch it out to send it backwards
> because two fingers cannot sit on the small object."*

⚠ **This is a genuine hole in A5, not a tuning matter**, and it gets worse exactly where it
hurts: the further away a part is, the smaller it is on screen, and pushing it further away
is the gesture that shrinks the target for its own next use. ⭐ A gesture that destroys its
own affordance as it succeeds.

⛔ **NOTHING IS BUILT FOR THIS, on the owner's instruction — a proposal is owed.** The owner
named a direction: *"we will need to fix this by using the touch and pinch on two objects
(provided a second object is visible on the screen)"*, which is the configuration §4 rule
**6ter** already occupies. ⚠ That is recorded as the owner's thought, **not** as a design:
whether the fix is 6ter, a minimum touch target, or something else is the proposal that has
not been made yet.

---

# ⭐⭐ THE PINCH IS GONE — `A6`/`D17`, and what the five failed models taught

**2026-09-15.** Everything above describes the **pinch** (`A5`/`D16`). Its geometry stands
— depth is HORIZONTAL, the view direction flattened onto the ground, so height never
changes — but ⛔ **its TRIGGER is superseded**, on the owner's instruction:

> *"Instead of a pinch on one (or, later, two) objects, the translation in depth shall be
> controlled by one touchpoint on the object && one touchpoint anywhere && both touchpoints
> delta position on y by the same amount (within a threshold): this will solve the hole in
> A5 and be closer to the current translation mechanism."*

⭐ It answers the hole a hand found: **two fingers will not fit on a small object**, and
pushing a part away shrinks it — the pinch destroyed its own affordance as it succeeded.

## ⛔⛔ FIVE MODELS, FOUR OF THEM REJECTED BY A HAND

This row is the most expensive thing in the project so far, and none of the cost was in the
geometry. It was all in **how two fingers are combined**:

| # | model | what a hand said |
|---|---|---|
| 1 | the MEAN of the two travels | *"a finger which is outside any object can move the object on depth"* — halves sum to the average, so a lone finger still moved it |
| 2 | a gate re-decided every frame against a travel floor | *"it blends into a translation along gravity axis"*, *"the object drifts"* — a hand that SLOWS or REVERSES drops out of depth into rule 6 |
| 3 | a latch with a **windowed** divergence exit | *"if I stop moving the second finger… the depth translation continues"* — a windowed rate is RATE-DEPENDENT; an idle finger never exits below ~100 mm/s |
| 4 | the SHARED travel (min-with-sign), cumulative exit | *"this is worse than before… it jumps erratically"* — `min` over alternating events stalls then double-steps, and the sign test flips near zero |
| 5 | a coupled FADE of the accumulated total | caught by my own vectors before the glass: fading a cumulative total **yanks the object backwards** |
| 6 | ⭐⭐ **DRIVER and VALIDATOR** — the owner's | *"that's the correct formulation of what I have in mind"* |

⭐⭐ **THE TRANSFERABLE PART: A BLEND HAS SEAMS.** Models 1–5 all mixed the two fingers'
travel into one number. Every one of them was discontinuous somewhere — at a reversal, at a
slow patch, at an alternating event order — and a hand found the seam within minutes each
time. ⛔ **The fix was not a better blend; it was to stop blending.** One finger drives and
the other votes, so there is nothing to be discontinuous.

⚠ **And I proposed four of the five.** The owner's correction was not a preference between
options I offered — it was a different shape entirely:

> *"There is a flaw in your logic: the depth translation shall not be done with a continuous
> coupling. The depth translation shall follow the delta position y of the finger which
> touchpoints the object provided that the other finger follows the same delta position y
> within a certain percentage ratio."*

## ⭐ The two ambiguities, named by the owner BEFORE any code

Both are moments when the ratio is **undefined**, not moments when it is wrong:

1. **At a reversal**, both travels pass through zero — *"maybe one before the other"* — so
   the ratio is jitter ÷ jitter. ⛔ Deciding on it leaked vertical translation at every
   turnaround, and the leaks ratcheted into a drift.
2. **At a late start**, the validator is still idle while the driver moves — which is
   *exactly* what rule 6 looks like.

⭐ Both are answered by **HOLDING**: below `MIN_TRAVEL_NOISE_MULTIPLE × pointerNoiseMm` the
verdict does not change, and a disagreement must persist **two** windows before it decides
`SEPARATE`. ⛔ A single disagreeing window may not decide anything.

## ⛔ The vector that could not have been written by me

My first reversal fixture had both fingers agreeing **exactly** — no noise — so it kept a
well-behaved ratio even at zero travel and **passed with the hold window removed**. ⚠ That
is mistake shape 3 (an idealised fixture) and shape 5 (my own fixture) at once. The fixture
now carries the **measured** 0.761 mm on both fingers, and the hand DWELLS at the turn for
25 samples — well past the two windows a `SEPARATE` decision needs — which is what makes
the garbage persist long enough to be decided on.

## What rule 6 had to give up for this

⛔⛔ **Rule 6 now WITHHOLDS the vertical while the verdict is `PENDING`.** A6 and rule 6
share a touchpoint configuration and are told apart by what the fingers DO, which takes a
window to see — and `A7` made rule 6's `dy` the gravity axis, so every ambiguous frame used
to leak a little vertical. ⭐ *Acting is irreversible; not knowing is not a reason to act.*

⚠ **The cost, stated**: the first window of vertical travel is **discarded**, not released
in one step. Releasing it is precisely the jump being complained about. A two-finger
vertical gesture therefore starts from where it was RECOGNISED, not from where it began.

## The numbers, and what a hand set

* `gainTranslateDepth` — ⭐ **0.5–5, default 3.0**, the range widened on the owner's
  instruction after the first slider (0.25–3) proved too narrow at the top.
* `depthFollowRatio` — the percentage band, a placeholder with a slider.
* `depthCommonWindowMs` — the window the ratio is judged over, a placeholder.
* ⭐ The **sympathetic sway answers a depth push** through the same implementation and the
  same four tunables, on the owner's instruction to avoid new sliders.
* ⭐ The ceiling is printed on the HUD (`depth=… [min–max] ⛔MAX`), because *"I can't see
  the object hitting any wall"* — a claim a device cannot check is an assertion.

⛔ **Still owed, and nothing is built**: how a SMALL object is reached at all. The owner's
thought is to use TWO objects, which is 6ter's configuration.

---

# ⭐⭐ AND THE COMMON DRAG IS GONE TOO — `A10`/`D20`, the same day

> *"I don't like the conflict generated by the control of depth translation by two
> fingers. Remove the current implementation with two finger synchronized delta position
> (including the 2 windows lag during which it waits to choose between gravity axis or
> horizontal depth axis) and replace by the following: depth axis is controlled by the
> touchpoint on object is still && the touchpoint outside the object has delta position
> y."*

## ⭐⭐ THE FAULT WAS IN THE QUESTION, AND THAT IS THE LESSON

A6 was the sixth model of this gesture and the first the owner accepted on paper. It
still failed on the glass — and **not because the answer was computed badly**. Every
earlier failure had been an implementation fault (a blend with a seam, a rate over the
wrong baseline, a latch with no hysteresis). This one was different:

> *"Are these two travels equal, within a ratio, over a window?"* has **no answer** at a
> reversal (both pass through zero) or at a late start (one has not moved yet) — and both
> happen in **every single gesture**.

⛔ A6 dealt with that by WAITING two windows and WITHHOLDING rule 6's vertical meanwhile,
which is the hesitation a hand felt at each end of every drag. ⭐ **A10 changes the
question**: *is that finger still?* is answerable at every instant, including those two.
No window, no ratio, no tolerance, no hold.

⭐⭐ **The transferable part, beside *a blend has seams*: WHEN A RULE NEEDS A WINDOW TO
DECIDE, SUSPECT THE QUESTION.** A window is how you buy an answer to a question that has
none at this instant — and the cheaper move is usually to ask a different question.

## The partition

| the finger ON the object | the other finger | rule |
|---|---|---|
| **MOVING** | anything | **rule 6** — translate; the holder drives |
| **STATIONARY** | MOVING in y, **outside** | ⭐ **A10** — depth; the anchor drives |
| STATIONARY | STATIONARY | nothing |

⛔ **The holder wins every tie**, so the two rules cannot both fire — the property A6
never had. ⭐ And the roles swap with the intent: the finger that is *doing something*
drives.

## ⭐⭐ THE SMALL-OBJECT HOLE IS CLOSED — owed since A5

The depth anchor may be **anywhere on the glass**, so an object's size on screen stops
mattering. ⚠ A5's pinch destroyed its own affordance as it succeeded (pushing a part away
shrinks it); A6 half-fixed it; A10 removes it. ⛔ The proposal that was owed is no longer
owed — the gesture itself answers it.

⚠ A `SECOND` touchpoint on the same object is deliberately **not** a depth anchor: the
owner said *outside the object*, and a finger resting on a small part has nowhere to
travel. It makes rule 6 reachable instead, which was the owner's other instruction.

## ⛔ One conflict with §1.3, and it is handled

A depth push holds the finger on the object STILL — character for character §1.3's
precondition for a **TAP** and a **HOLD**. ⛔⛔ Two quick pushes would be a **DOUBLE_TAP**,
which `resolveDiscreteRule` maps to **2septies eviction**: a gesture that destroys the
user's constraint work, fired by a gesture that never touched a constraint.

⭐ `Recognizer.consumeAsMotion()` marks the holder's gesture as one another rule supplied
the motion for, so it releases as `HOLD` and the tap history is reset. ⚠ It does **not**
commit the recognizer — the finger may still drag, roll or flick afterwards. ⭐ Four
vectors, including the counter-example (the identical press, unconsumed, IS a tap) and a
falsification run with the guard removed.

## ⛔⛔ What it cost: a defect in §1.1

A10 is the first rule that asks whether a finger is still, and §1.1 could not answer.
→ [`IN0.md`](IN0.md).

---

## ⭐⭐⭐ A15 / `D25`, 2026-09-16 — the holder that was no longer under its object

**Owner's modification, on depth translation:** when the second touchpoint is released, the
first fires a **raycast**. Same object → everything continues as wired. Nothing, or another
object → *"the previously selected object is no longer under the finger which used to
control it"*, and **at the next input event** the object is unselected and the state becomes
whatever the new configuration is.

### ⛔⛔ Why this row owns it, and why it was unreachable before

`A10` is depth: **the holder holds still and the anchor supplies the travel.** So the object
slides along the view axis under a finger that never moved — and past some distance it is
simply **not under that finger any more**. ⛔ §4 latches a role at press for the touchpoint's
lifetime, so the holder went on carrying an object the hand had visibly left behind, and
every later rule read a selection that was already dead.

⭐ It is the third defect this row has produced that **only depth could produce**: the
others were §1.1's unreachable rest and the settle asymmetry (→ [`IN0.md`](IN0.md)). Depth
keeps finding them because it is the one rule whose *whole point* is that the finger does
not move.

### ⭐⭐ The two decisions inside it

1. **The test is a RAYCAST at a LIFT.** ⛔ Not a test per frame: re-deciding a role
   continuously is what `IN2`'s latch exists to prevent, and this project has shipped that
   defect twice (`D23`, and `IN4` on 2026-09-14). A lift is **presence** — discrete,
   deliberate, visible — the same class of evidence `A14`'s grace uses.
   ⚠ It fires on **every** second-touchpoint release while something is held, not only after
   a depth drag: the ray is the whole test and answers `BOUND` for every other rule, and a
   *"was that depth?"* flag would be a second, weaker way of asking the same question.
2. **The consequence is DEFERRED.** ⭐ The binding is marked dead and nothing happens — no
   jump, no deselect, no camera move. Only the next input event drops the selection,
   re-latches every live touchpoint from what is under it now, and lets the §4 table decide.
   ⛔ `METHOD`: *acting is irreversible; not knowing is not a reason to act* — at the lift the
   user has given no new instruction, so a visible change would be the program's idea.

### ⭐ What it composes with

| | |
|---|---|
| **`A14`** | ⭐⭐ they **partition**, they do not fight: holder still on its object → the grace, unchanged; holder off it → there is no gesture left to preserve, because the finger A14 protects is not touching the thing it was moving |
| **`IN2`'s latch** | ⛔ the **first and only** exception — `router.relatchOnOrphan`, callable on a discrete event only. The header's *"never revisited"* was reworded rather than deleted, because what the latch protects against is a role recomputed from a CONTINUOUS reading |
| **§2 rule 1** | ⛔⛔ the orbit centre **does not move**: *"same as previous yellow point"* (owner, 2026-09-16, overruling what I built the same hour — I had it retarget through `orbitCentreGraceMs` on the grounds that rule 1 picks its centre when an orbit STARTS). ⭐ The owner's rule is `resetCamera`'s: *home is the last yellow target* — the centre is what the user has been orbiting, and **a gesture that ends must not retarget the camera** |
| **§1.3** | ⛔ an orphaned holder's lift runs **no release verdict**: a flick-to-align or a double-tap belongs to a finger that was still on its object |

### Built

`src/input/holder_binding.ts` — pure, engine-free, generic over the object handle,
**8 vectors**. `router.relatchOnOrphan` + `decideRole` shared with `press` — **8 vectors**.
Wired in `src/render/scene.ts`: the ray at both second-touchpoint release sites (`SECOND`
and `OUTSIDE`, since A10's anchor may be either), the collection before dispatch on a PRESS
or a MOVE, and the verdict-free drop on the holder's own lift.

⭐ **Falsified on purpose**: removing the delete-before-decide in `relatchOnOrphan` reddens
exactly one vector — the holder re-latching onto its own object would otherwise read as
`SECOND` on it, and the gesture would go dead with one finger on the glass and nothing to
say why.

⭐ **No new tunable.** A raycast has no threshold, so `IN5` inherits nothing from this.

### ⛔ Owed

**A DEVICE LOOK.** 563 vectors are green and none of them can reach the ray, the deferral
or the re-resolution — all three are in `src/render`, on the far side of the boundary.
⚠ What to look for, in the owner's own cases: push an object away in depth until the finger
is off it, lift the second touchpoint, then (a) drag the remaining finger — the camera
should orbit, not the object; (b) press a second finger on another object — that object's
gesture should start; (c) lift the remaining finger — nothing should align or evict.
⭐ The HUD prints `⛔ORPHANED(next input unselects)` while the binding is dead, so the
deferral is visible rather than inferred.


---

## ⭐ CARRIED FROM THE QUEUE ROW, 2026-09-16 — verbatim

⚠ `QUEUE.md` is a front door and this cell had grown to an essay inside a table. ⛔ Distilled there to state + one lesson + this pointer; the full text is below, unrewritten, per `README.md` rule 2.

> 🔧 **AND NOW IT CARRIES BOTH ROLL AND DEPTH (`D22`, amendment `A12`, 2026-09-15).** The second touchpoint — **inside or outside any object** — drives the object while the holder is held still: its **x is ROLL**, its **y is DEPTH**. ⭐⭐ It retires 2quinte's circular roll, `rollAngle`'s commit threshold, the provisional yaw/pitch, `A8`'s rebase and **the jump**, because yaw/pitch (one touchpoint) and roll (two) are no longer the same hand shape and nothing has to tell them apart. ⭐ **The second time `METHOD`'s *when a rule needs a window to decide, suspect the question* has paid on this row.** ⚠ It only works because A11's deadband is PER AXIS. Previously (`D20`, `A10`): depth is a STILL HOLDER and a MOVING ANCHOR. The finger on the object holds still; the finger **outside** supplies the travel. ⛔ No window, no ratio, no tolerance — *"I don't like the conflict generated by the control of depth translation by two fingers."* ⭐⭐ **The fault was in A6's QUESTION**: *are these two travels equal?* has no answer at a reversal or a late start, and both happen every gesture. *Is that finger still?* is answerable at every instant. ⭐ **The holder wins every tie**, so rule 6 and depth PARTITION the configuration instead of competing for it — and rule 6's vertical is no longer withheld, so the hesitation at each end of every drag is gone. ⭐⭐ Rule 6's second touchpoint may now be OUTSIDE **or on the same object** (the first drives), and since the depth anchor may be ANYWHERE, **the small-object hole owed since A5 is CLOSED**. ⛔⛔ **It cost a defect in §1.1 that nothing else could have found** — see the `IN0` row. ⚠ **Device pass owed**: the feel of all four §1.1 numbers changed. Previously, as driver/validator (`A6`): One finger on the object supplies ALL the motion; a second finger **anywhere** only authorises it by following the same `dy` within a percentage ratio. ⛔⛔ **FIVE MODELS WERE BUILT AND A HAND REJECTED FOUR** — a mean, a latch, a cumulative exit, a shared minimum, a faded blend — before the owner supplied the sixth, which is the one that shipped. ⭐⭐ **The transferable part: A BLEND HAS SEAMS.** Every version that mixed the two fingers' travel had a discontinuity somewhere and *"it jumps erratically"* came back within minutes. Nothing is mixed now, so there is no seam. ⭐ The owner named both ambiguities before any code — **at a reversal both travels pass through zero**, and **a validator that starts late is not a different gesture** — and both are answered by HOLDING the last verdict rather than deciding on garbage. ⛔ A three-state verdict (`PENDING`/`COMMON`/`SEPARATE`) also forced rule 6 to **withhold the vertical while undecided**, which fixed three separate reports at once: a lurch at the start, a lurch at the end, and a cumulative vertical drift. ⚠ The stated cost: the first window of vertical travel is DISCARDED rather than released in one step — releasing it IS the jump. `gainTranslateDepth` **0.5–5, default 3.0**, by the owner's hand. Previously, as a pinch: `gainPinchDepth` had a slider, the sympathetic sway answers a push through the SAME implementation and the SAME four tunables, and the ceiling is now printed on the HUD (`depth=… [min–max] ⛔MAX`) because *"I can't see the object hitting any wall"* — a claim a device cannot check is an assertion, not a finding. ⛔⛔ **A REAL HOLE, REPORTED BY FINGER: a SMALL object cannot be pinched** — two fingers will not fit, and it worsens exactly where it hurts, since pushing a part away shrinks the target for its own next use. ⚠ **A proposal is owed and nothing is built** (owner's instruction); the owner's thought is to use two objects, which is 6ter's configuration → [`./IN8.md`](./IN8.md). Previously: ⭐⭐ **RE-DECIDED 2026-09-15 (`D16`, amendment A5): they are a DEPTH PINCH** on that object — pinch in pushes it away. It came from a HAND, as a fourth answer the `3D1` watch item did not offer, and it declines §3.2 DS3. ⭐ It removes `D10`'s dead end (lifting one finger now returns to rotation instead of leaving the part unresponsive). ⛔ The gain is **computed**, not guessed. ⚠ `IN2`'s `IGNORED` role survives with its trigger moved to the THIRD touchpoint, so the 22 router vectors need revisiting. Previously: ✅ **DECIDED 2026-09-14: IGNORE THE SECOND HIT**, for the moment (reading 2, a rotation axis between the fingers, is deferred not rejected). ⛔ **`IN2` is unblocked.** It binds `IN2`'s role latch: *ignored* becomes a THIRD latched outcome beside on-object and outside, and lifting an ignored touchpoint must NOT run the release verdict, flick test or tap history → [`./IN8.md`](./IN8.md)


---

## ✅✅ `A15` CLOSED ON THE GLASS, 2026-09-16 — and the caveat is part of the record

The owner, on a build carrying `A15` since it deployed: *"everything is working ok."*

⚠ **THE CLOSE IS ONLY AS STRONG AS THE PHRASE THAT GAVE IT.** That sentence was **general**,
and this dossier had listed three specific cases to try — push an object away in depth until
the finger is off it, then (a) drag the remaining finger and expect an orbit about the
existing yellow centre, (b) press a second finger on another object, (c) lift and expect
nothing to align or evict. ⛔ None was reported on individually.
⭐ So `A15` is recorded as CLOSED, because that is this project's rule — a device look closes
a change, and the owner has driven the build — **and** the weakness of the evidence is
written down rather than rounded up. ⚠ If a later session finds a defect on one of those
three paths, this note is why it will not be a surprise.

---

## ⛔⛔⛔ `D43` — THE GATE IS DELETED, AND THE PARTITION WITH IT *(2026-09-17)*

> *"When the second touchpoint provides input for depth or roll, it does not integrate
> simultaneously with the x and y inputs of the first touchpoint (each touchpoint have to wait
> that the other idle for its input to get integrated). I want everything simultaneous."*

⚠⚠ **THE OWNER REJECTED THE PARTITION ITSELF, WHICH IS NOT THE SAME AS REJECTING ITS
IMPLEMENTATION** — and that distinction is why this row's whole history stands: `A10`'s gate
was the SIXTH model of depth and the first that a hand accepted, precisely because it replaced
`A6`'s unanswerable question (*are these two travels equal?*, which has no answer at a
reversal or a late start) with one answerable at every instant (*is that finger still?*).

⭐⭐ What replaces it is simpler than either: **each finger owns its own channel** — the
holder's x/y, the second finger's single axis — and the two SUM, exactly as the holder's own x
and y already sum. ⛔ There is nothing left to discriminate, so there is no question to get
wrong. That is a better answer than either of mine, and it took a hand to see it.

⚠ What it trades away, stated so nobody rediscovers it as a defect: **a hand can no longer
move one finger and be certain only one rule ran.** The gate's whole value was that guarantee.
⛔ And `A11`'s per-axis deadband is now the ONLY thing stopping a resting second finger from
rolling the object with its jitter — which is why *simultaneous* is safe at all, and why
`motionDeadbandMm` matters more today than it did yesterday.

✅ Deleted with it: `depthGate`, `DepthVerdict`, the `holder` parameter of
`secondFingerDrive`, and eight vectors — including the one that compared the gate against the
naive *both-fingers-moving* test. ⛔ A vector whose subject cannot occur certifies nothing.

---

## ⛔⛔ OPEN — `D51` OPENED A DOOR `A15` DOES NOT WATCH (noted 2026-09-18)

⚠ **NOT FIXED. Captured because it is the hole `A15` exists to close, re-entering through a
door that did not exist when `A15` was written.**

⭐ `A15`'s question is *is the object still UNDER the finger carrying it?*, asked by a raycast
at **the second touchpoint's release**, with the consequence deferred to the next input event.
⛔ It is wired from exactly two release paths — the `SECOND` role (`A12`'s roll/depth finger)
and the `OUTSIDE` role (`A10`'s depth anchor, the case that motivated the amendment).

⛔⛔ **`D51`'s PINNED PIONEER IS NEITHER.** With `pioneerTranslates = 0` the finger on the
Pioneer drives the **Follower's depth** — so the Follower slides along the view axis and can
leave the finger that holds it, which is precisely `A15`'s geometry. ⚠ But both touchpoints are
latched `OBJECT` holders, and `evaluateBindings()` is not called from the OBJECT release path.

⭐ **The reproduction, for whoever picks this up**: pin a Pioneer, push the Follower away in
depth until it is no longer under its holder, then lift the **Pioneer's** finger. The holder
keeps carrying an object it is not touching, and `A15` never asks.

### ⚠ Why it is recorded rather than fixed

⛔ The fix is one line — call `evaluateBindings()` on the OBJECT release path too — and that is
exactly why it should not be written blind. ⚠ `evaluateBindings` loops **every** holder and
re-reads its binding; calling it whenever any object finger lifts changes behaviour for the
ordinary two-holder case as well, which a hand has already closed. ⭐ So it wants either a
condition (*was this release a pinned Pioneer?*) or a device pass over both configurations —
and `D51` itself has not been judged by a hand yet.

⚠⚠ **AND IT IS THE SECOND TIME THIS SHAPE HAS APPEARED IN A WEEK**: a rule whose trigger
enumerates the CONFIGURATIONS that could cause it, rather than asking the STATE. ⭐ `A17.5` chose
the other way on purpose — *a Pioneer can be turned by a drag, a twist, a reset, a slerp or
another alignment's `FOLLOW`, and comparing poses catches every one of them without enumerating
any.* ⛔ `A15` enumerates, so every new way to move an object off its finger is a new hole. The
durable fix is to ask *is the object under the holder* at every **discrete** input, not to add a
third release path.

---

## ✅✅ `D54` — THE ORPHAN RULE IS DELETED, AND THE GAP ABOVE IS CLOSED BY CONSTRUCTION

> *"Until first touch is released: 1a- first touch can continue controlling the object (rotation
> or translation), and 1b- second touchpoint can be pressed again and thus control again the
> object."* — the owner, 2026-09-18

⛔⛔ **`A15`/`D25` IS REVERSED.** A holder now keeps its object for the touchpoint's **lifetime**,
which is `IN2`'s §4 latch with no exceptions left. ⭐ Deleted, not disabled:
`input/holder_binding.ts`, `router.relatchOnOrphan`, `evaluateBindings`, `collectOrphans`,
`objectUnder`, the HUD's `⛔ORPHANED` line and **16 vectors**.

⚠⚠ **WHAT IS BEING REVERSED IS A VERDICT, NOT A FACT.** The geometry `A15` was written for has
not changed: depth pushes an object along the view axis while the holder need not move, so the
object still leaves the finger — the owner's own words in 2026-09-16 were *"the previously
selected object is no longer under the finger which used to control it."* ⭐ What changed is what
should FOLLOW from that: **keeping control beats re-resolving**, because a hand that pushed a
part away still means to be holding it. ⛔ If the original complaint ever returns, it returns as
a complaint about *this* decision, and the answer is not to re-add the unselect without asking.

⭐ **Requirement 1b needed no code.** With nothing deleting the grip, a second touchpoint pressed
again finds `router.objects()[0]` and drives the same body exactly as the first one did — it was
only ever unreachable because the grip had been thrown away.

### ⭐⭐ AND IT ANSWERS THE OPEN GAP RECORDED ABOVE, FROM THE OTHER DIRECTION

⛔ The `D51` note above said a pinned Pioneer could slide the Follower off its holder through a
release path `A15` never watched, and asked for the durable fix to be *ask the state at every
discrete input* rather than *add a third release path*. ✅ **There is now no unselect at all**, so
the hole is unreachable by construction — the strongest version of that fix, and it arrived by
deleting the rule rather than by extending it.
⚠ The note above is kept unrewritten: it is the record of a real gap, and of the reasoning that
said enumerating configurations was the wrong shape.

---

## ⭐ STATUS TEXT MOVED DOWN FROM `QUEUE.md`, 2026-09-25 (second pass)

🔧 **ANSWERED THREE TIMES AND BUILT.** ⭐ The second touchpoint — inside **or** outside any object — drives **roll by its x** and **depth by its y** (`D22`/`A12`, `A10`). ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16**, which also closed the small-object hole owed since `A5`. ⛔⛔ **`A15`/`D25`'s orphan unselect is DELETED** (`D54`) (this file)
