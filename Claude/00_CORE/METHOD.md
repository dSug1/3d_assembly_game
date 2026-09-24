# METHOD — how anything gets decided here

> **STATUS** · live · **OWNS** · the evidence discipline, and the instrument traps
> **READ IF** · you are about to claim something works
> **LAST VERIFIED** · 2026-09-16

Carried from the predecessor project, where every rule below was bought with a
failure. [`LESSONS_CARRIED.md`](LESSONS_CARRIED.md) tells the stories; this is the
operating rule set.

## The rules

1. ⭐⭐ **Measure or revert.** A change must show a **measured** improvement on
   identical recorded input, or be reverted. A null result is *recorded*, not shipped
   hopefully.
2. **A metric must not share an expression with the thing it judges.** A metric built
   from its own subject measures nothing.
3. **Golden vectors before the port exists**, and a new vector must be shown to fail
   against the old code.
4. **One constant, one place.**
5. **Check the licence before proposing any library**, and state it.
6. **Thresholds in millimetres.**
7. **A pair of axes covers for a foreshortened member; a single axis cannot.** Ask what a
   finger's pair SPANS and how a lone axis LOOKS on the glass, not which axis it *should*
   drive. Measured, 2026-09-23 - [`queue_notes/IN4.md`](queue_notes/IN4.md).

## No heuristic pile-up

If something misbehaves, the fix is **better data covering that failure as its own
case**, or **a reconsidered model with literature backing** — *never* a special-case
rule bolted onto the output to patch one observed failure.

⭐ The corollary the predecessor kept re-learning: **a trigger cannot enforce an
invariant.** Two trigger-shaped fixes were built and reverted before a positional
clamp shipped.

⭐⭐ **A COMPOSITION IS A THING TO MEASURE, NOT AN EMERGENT PROPERTY.** The
predecessor's rotation stack was defensible at every layer and a **reflection** as a
whole, because nobody had ever computed the composite. **Ask what the whole chain
does, in one expression, and check it.**

⛔⛔ **AND IT CUTS BOTH WAYS — an unmeasured composition indicts CORRECT work too.** *(2026-09-15:
a report that the gravity frame had regressed.)* Every part had green vectors, ⚠ none of which is the
same claim as *a horizontal drag yaws about gravity* — which is what a hand judges. Composing the
frame with the rotation at four camera tilts showed it was right, and separated the real defect
beside it from the impression. ⭐ **Write the composite check even when you believe the pieces.**

## ⭐⭐ A BLEND HAS SEAMS

*(2026-09-15, from five rejected models of one gesture.)* When two noisy inputs must
produce one output, the tempting move is to **combine** them — a mean, a minimum, a
weighted fade, a coupling that tightens with agreement. ⛔ **Every one of those has a
discontinuity somewhere**, and a hand finds it within minutes: a `min` over alternating
events stalls then double-steps; a sign test flips near zero; fading an accumulated total
yanks the object backwards; a gate re-decided each frame drops out when the hand slows.

⭐ **The answer is usually not a better blend — it is to stop blending.** Make one input
the **DRIVER** and the other a **VALIDATOR**: the driver supplies all the motion, the
validator only authorises it by agreeing within a ratio. Nothing is mixed, so nothing can
be discontinuous.

⭐ And where the validator's agreement is **undefined** — at a reversal, at a late start — **HOLD the
last verdict**: a ratio of two numbers passing through zero is garbage however carefully computed.

## ⭐⭐ A GESTURE spans the moments between its touchpoints

*(2026-09-16.)* A rule table maps *what is down right now* to *what happens*. ⛔ A hand does
not work that way: **lifting a finger and putting it down again is one intention**, and for
the 150–300 ms in between, the literal truth is a configuration the user never asked for.

⚠ The instance: a rule table said *one touchpoint translates, two rotate*. Swap the second finger from
one place to another and the object translated through the middle of the swap — correctly by the
table, wrongly by any account of what the hand was doing.

⭐⭐ **The tell was the owner's own observation**: two cases that *"differ by timing of the input"*.
When two runs of one gesture differ only by WHEN the user moved, the rule is reading a momentary state
the gesture spans. ⚠ Same shape as *a mode keyed on motion*, one level up: there the state was noisy,
here it is briefly and genuinely wrong.

⭐ The fix is a grace on the DISCRETE event — a lift — never on a continuous reading. ⛔ And
it has a real cost that must be stated rather than hidden: going back to the one-touchpoint
rule is delayed by the grace, so a deliberate lift feels slower. Ship it as a slider with
`0` restoring the old behaviour, so a hand can weigh the two.

## ⭐⭐⭐ A MODE may be keyed on PRESENCE; never on MOTION

*(2026-09-14, and again on 2026-09-16 when I did it anyway.)* Two signals come off a
touchpoint and they are not interchangeable:

* **whether it is DOWN** — discrete, deliberate, visible to the user, and it changes only
  when a person decides it does;
* **whether it is MOVING** — noisy and continuous, and true or false by degrees no matter
  how good the filter underneath it is.

⛔ **A MODE must be keyed on the first.** A mode keyed on the second inherits every artefact
of the sensor: this project shipped it twice, and both times a hand found it within minutes.

⚠ The second time, the tell was a **timing signature**: *"if I transition quickly there is a
translation then a rotation, if I transition slowly there is directly a rotation."* ⭐⭐ **A behaviour
that depends on how BRISKLY a finger arrives is not about the gesture at all** — a finger placed
quickly skids as it lands, the centroid sliding while the contact area grows.

⭐ The motion state is still the right input for deciding **what a moving finger drives**.
It is the wrong input for deciding **which rule is running**.

⚠⚠ And a note on process: the amendment that shipped this defect **had already flagged the
resemblance** to the 2026-09-14 verdict. ⛔ Naming a risk is not the same as not taking it — if the
reasoning for a choice has to explain away a verdict a hand already gave, the verdict wins.

## ⭐⭐⭐ AN INSTRUMENT READS STATE, NEVER THE ARRIVAL OF AN EVENT

*(2026-09-23, the gizmo: seven device reports, one shape.)* A readout keyed on a per-frame
quantity inherits its noise — ⛔ *the absence of an event is not the absence of the gesture.*
⛔⛔ **MEMORY IS NOT THE FIX**: it trades a false negative for a false positive that lasts longer —
two further reports, a line that would not go out and one that outlived the finger driving it.
⭐ Read the state machine that already decides the fact, and keep nothing. ⚠ Emission has one
property a state lacks — *a channel that drives nothing emits nothing* — so moving to state needs an
explicit membership rule, which is where the regression came from.
→ [`queue_notes/DEFECT_LEDGER.md`](queue_notes/DEFECT_LEDGER.md)

## ⭐⭐ A threshold the state machine PARKS ON will be compared at its exact value

*(2026-09-16.)* Hysteresis usually leaves a system somewhere in the middle of its band. ⛔ A
**trailing** band does not: it drags its centre so the moving thing sits exactly ON the
edge, and the instant that thing stops, the comparison is made at the boundary value — on
every sample, for as long as it rests.

⚠ So never compute that value by a **round trip**: storing a centre as `p − band` and re-deriving
`p − centre` returns about `1e-14` too much at ordinary screen coordinates, on the wrong side of `<=`.
⭐ Carry the quantity the comparison is about — the signed offset, accumulated and clamped — so a
still input adds exactly zero.

⭐⭐ **And the tell that separates a defect from a stale fixture**: a fixture goes stale against a
number it HARD-CODES; a defect changes behaviour when a number the PRODUCT uses moves. ⚠ Sweep the
magnitudes a defect could hide behind — here five screen positions and five band sizes — because a
fixture at one convenient coordinate passes while the product fails.

## ⭐⭐ A threshold has a SHAPE as well as a size

*(2026-09-15.)* A deadband, a gate, a tolerance — each is usually defended on **one** axis of
reasoning, the one that prompted it. ⛔ But its shape decides other things, and those
decisions are made whether or not anyone noticed making them.

⚠ The instance: a position deadband, argued as **radial** because a circle is the natural shape for
rejecting isotropic noise — which it is. ⛔⛔ Nobody asked what else the shape chooses: a **square**
band gives a corridor along each axis in which the other emits *nothing*, so a nearly-axial drag
becomes a *purely* axial one, which no radius can provide. The owner asked for per-axis and named
that reason.

⭐ **Ask what else a threshold is choosing before defending it on the axis you happened to
be thinking about** — and notice that the cost I had raised against the square (a diagonal
drag travels 1.41× further) was real, small, and about entry only.

## ⭐ A threshold that guards a TRANSITION must not also tax the STEADY STATE

*(2026-09-15.)* A deadband, a hysteresis band, a commit threshold — each exists to answer
*"has this started?"*. ⛔ If the same band is charged again on every direction change
mid-gesture, it stops being a guard and becomes a tax, and what it costs is **dead time**,
which no gain or damping value downstream can hide.

⚠ The instance: a position deadband whose anchor trails one radius behind. Entering a drag cost one
radius, correctly; **reversing cost two** — 5.0 mm and 88 ms, against a follower whose whole time
constant is 7.6 ms. ⭐ The fix is a distinction, not a number: *a finger that has already proven it is
moving needs no further proof.*

⭐⭐ **The tell is a complaint about FLUIDITY rather than about speed or distance.** Dead
time feels different from lag, and it points at a threshold being re-charged somewhere it
should not be.

## ⭐⭐ A threshold is only half a rule — the other half is what advances the clock

*(2026-09-15, after three device reports of one defect.)* A state machine that waits for a
condition must be **driven by something that runs when the condition holds**. ⛔ If it is
driven by the very signal whose ABSENCE it is trying to detect, no threshold can ever be
right, and every fix will look like a tuning problem.

⚠ The instance: *"is this finger still?"* was answered by a tracker advanced only by `pointermove`.
A still finger emits none, so the tracker froze at MOVING, reachable only by a stray jitter sample.
⭐ Two rounds of fixing the THRESHOLD changed nothing: the threshold was never the problem.

⭐⭐ **The tell, and it was in the first report**: one direction of the transition was
instant and the other was erratic. **An asymmetry between two directions of the same test
is about the EVIDENCE, not the threshold** — entering MOVING is witnessed by an event that
necessarily exists; leaving it is not.

⭐ And the fix's quantity was the better one all along: *elapsed time with no sample* is
stronger evidence of stillness than any sample inside a dead radius, because a sample is
still a report of motion and silence is not.

## ⭐⭐ When a rule needs a WINDOW to decide, suspect the QUESTION

*(2026-09-15, from the sixth model of one gesture.)* A window, a ratio, a tolerance and a
hold are how you buy an answer to a question that **has no answer at this instant**. ⛔ When
a rule needs them, the cheapest fix is usually not a better window — it is a **different
question**.

⚠ The instance: *"are these two fingers travelling by the same amount?"* is undefined at a reversal
and at a late start, both of which happen in **every** gesture — so the rule waited two windows,
withheld a whole axis meanwhile, and a hand felt the hesitation at each end of every drag.
⭐ Replacing it with *"is that finger still?"* removed the window, the ratio, the tolerance and the
hold **together**.

⛔ The tell: a correctly implemented rule that still feels wrong, and a tuning parameter
whose value nobody can defend. ⭐ Ask what question the parameter is buying an answer to.

## ⭐⭐ AN OPTION REJECTED FOR A COST — CHECK WHO PAYS IT FIRST

*(2026-09-23.)* When a choice is put to the owner, the DESCRIPTION of each option is evidence, and a
wrong one decides the choice as surely as a wrong measurement.

⚠ The instance: *stable projection* against *Blender-exact tracking*, the second described as needing
**"a refusal threshold (a guessed number)"** — true, and false where it mattered: the threshold is
**5°, Blender's, and published**. ⛔ The cost that decided the rejection was already paid by prior
art, and the mapping that shipped instead produced three device reports in one look.

⭐⭐ **Before offering a cost as a reason to reject something, ask whether the field has already paid
it.** *A guessed number has been wrong every single time here* — but a number with a citation is not
a guess, and treating the two alike throws away the option that has the answer.

## ⭐ Acting is irreversible; not knowing is not a reason to act

When a gesture is genuinely ambiguous for a window, the choice is not *"which rule"* but
*"whether to move at all"*. ⛔ Apply the unambiguous part and **withhold** the rest until
the verdict arrives. ⚠ **State the cost**: the withheld travel is DISCARDED, not released
in one step — releasing it is exactly the jump being complained about.

## ⭐⭐⭐ A DEVICE REPORT IS EVIDENCE ABOUT THE CODE THE DEVICE WAS RUNNING

*(2026-09-16.)* `METHOD` closes a change on a look at a real device. ⛔ That makes the
**identity of the build under the finger** part of every verdict this project records — and
for three days nothing on the glass could name it.

⚠ The instance: a gesture fix was judged correct over USB and **wrong on GitHub Pages**, and the
natural reading was that the fix was incomplete. The code was identical. ⭐ What differed was the
bundle the tablet had: Pages serves `index.html` with `max-age=600` and the assets are
**content-hashed**, so a cached index loads an old bundle *indefinitely* — stale until something
replaces the index, not for ten minutes.

⛔⛔ **So a deployment can indict correct work exactly as an unmeasured composition can.**
It is the withdrawn-`A7` shape aimed one layer lower: the report was truthful, the reasoning
from it was sound, and the premise — *"both surfaces are running the same code"* — was the
thing nobody had checked. ⭐ The tell is **the same gesture behaving differently on two
surfaces**: suspect the artefact before the algorithm, because code cannot be
surface-dependent unless something makes it so.

⭐ **The fix is identity, not discipline.** The page now stamps its build id on the HUD and
asks the origin whether it is current, refreshing itself once if not
(`src/core/build_gate.ts`). ⚠ A procedure — *"always hard-reload before judging"* — would
have been a rule a tired hand skips, and it is the one moment nobody should be relying on
memory.

## ⛔⛔ AN ABSENT READOUT CANNOT BE CAUGHT BY LOOKING AT THE SCREEN

*(2026-09-16, found while fixing the above.)* A dead instrument that **prints** a stale
quantity gets caught eventually: someone reads it and it disagrees with the world. ⛔ One
that prints **nothing at all** is invisible by construction — there is no wrong number to
notice, and the documentation describing it reads exactly as it would if it worked.

⚠ The instance: `scene.ts` computed which tunables the URL overrode and handed them to a HUD that
**never rendered them**, for the whole life of the file, while the docs said it did — it would have
cost an `IN5` session an hour measuring a default it believed was an override.

⭐⭐ **So audit an instrument against the QUESTIONS it is supposed to answer, not against the lines
it happens to print**: *for each thing this readout is documented to tell me, point at the code that
emits it.*
⚠ A field passed into a readout and never read is the exact shape `tests/config_debt.test.ts`
already refuses for tunables — and the HUD had no equivalent guard.

## ⛔⛔ The instrument is a suspect, always

**The most expensive lesson carried over.** In one session four harnesses reported CLEAN on takes
the owner had just watched fail — every time the instrument was wrong and the owner was right.

* **Record the value the product ACTUALLY USED**, never a harness recomputing it: a recomputation
  is a second implementation, free to disagree.
* **Print the aggregation, not just the value.** Two harnesses aggregating differently under one
  name reported a sound axis as broken.
* ⭐⭐⭐ **A SIGN IS NOT TESTED BY ANY AMOUNT OF TESTING THE MAGNITUDE.** Four defects
  in one day shared that shape and not one was caught by a suite. Assert signs
  against declared truth.
* ⭐⭐⭐ **AN INVARIANT TESTED ON ONE AXIS IS NOT TESTED.** A suite checked chirality on the one
  axis that never had the problem, certifying the two that did.
* ⭐⭐⭐ **A GOLDEN VECTOR'S FIXTURE MUST BE A SPECIMEN THE PRODUCT WOULD ACCEPT.** A suite built
  its input in an idealised form the real code refuses, so every vector exercised an impossible case.
* ⭐⭐⭐ **A SKIPPED CHECK MUST BE ANNOUNCED.** A suite fed a loader the wrong-shaped data, got
  nothing, skipped on a `continue`, and printed ALL CHECKS PASSED. *A guard that turns missing data
  into silence is worse than a failure.*
* ⭐⭐⭐ **A RETIRED GESTURE THAT STILL OWNS A VERDICT IS NOT INERT.** A detector left **fed**
  after its channel was taken away still held the top rung of the release ladder and vetoed the
  rule that replaced it. ⛔ *Unwired* means **nothing calls it**, not that nothing reads it.
* ⭐⭐ **A test that cannot FAIL is not a test.** Keep an explicit counter-example
  beside each guard, and check the guard fires on it.
* ⭐⭐ **Independence has to be ARGUED, not inferred from agreement.** Measures from one source
  degrade together and agree on a wrong answer.
* ⚠ **A statistic pooled across a region cannot answer a question about it.**

⚠ **Automated green is necessary, not sufficient. A look on a REAL DEVICE closes a change** —
nothing else does, and touch cannot be honestly tested with a mouse: one pointer, no DPI, no tilt.

⛔ If a baseline does not reproduce before you change anything, **stop**.

## Rules for reading the record

* **Retractions are kept on purpose.** A claim that was overturned is more useful
  than one silently deleted.
* **When two sections conflict, the later one wins.**
* **A negative result that cannot be re-run is an assertion, not a finding.**
* ⭐ **A constant borrowed from another row's derivation inherits that row's
  QUESTION, not just its number.**
* ⚠ **"Same symptom" never means "same cause."**
