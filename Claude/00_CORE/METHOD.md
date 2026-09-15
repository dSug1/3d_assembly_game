# METHOD — how anything gets decided here

> **STATUS** · live · **OWNS** · the evidence discipline, and the instrument traps
> **READ IF** · you are about to claim something works
> **LAST VERIFIED** · 2026-09-13

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

⛔⛔ **AND IT CUTS BOTH WAYS — an unmeasured composition indicts CORRECT work too.**
*(2026-09-15.)* A gravity-referenced rotation was reported from the device as having
regressed to the screen axes. Every part of it had green vectors — the frame is
orthonormal, its `up` is the world vertical, the wiring compiled — and ⚠ **none of that
is the same claim as *a horizontal drag yaws about gravity***, which is what a hand
judges. Fourteen vectors composing the frame with the rotation, at four camera tilts,
showed the composition was right; the report was withdrawn, and the real defect beside it
(a missing deadband) became separable from the impression. ⭐ **Write the composite check
even when you believe the pieces — especially then**: it is the only thing that can tell
a defect from an impression, in either direction.

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

⭐ And where the validator's agreement is **undefined** — at a reversal both travels pass
through zero; at a late start one has not moved yet — **HOLD the last verdict**. A ratio
of two numbers passing through zero is garbage however carefully it is computed.

## ⭐⭐ When a rule needs a WINDOW to decide, suspect the QUESTION

*(2026-09-15, from the sixth model of one gesture.)* A window, a ratio, a tolerance and a
hold are how you buy an answer to a question that **has no answer at this instant**. ⛔ When
a rule needs them, the cheapest fix is usually not a better window — it is a **different
question**.

⚠ The instance: *"are these two fingers travelling by the same amount?"* is undefined at a
reversal (both travels pass through zero) and at a late start (one has not moved yet), and
both happen in **every** gesture. So the rule waited two windows and withheld a whole axis
meanwhile, and a hand felt the hesitation at each end of every drag. ⭐ Replacing it with
*"is that finger still?"* — answerable at every instant, including those two — removed the
window, the ratio, the tolerance and the hold **together**.

⛔ The tell: a correctly implemented rule that still feels wrong, and a tuning parameter
whose value nobody can defend. ⭐ Ask what question the parameter is buying an answer to.

## ⭐ Acting is irreversible; not knowing is not a reason to act

When a gesture is genuinely ambiguous for a window, the choice is not *"which rule"* but
*"whether to move at all"*. ⛔ Apply the unambiguous part and **withhold** the rest until
the verdict arrives. ⚠ **State the cost**: the withheld travel is DISCARDED, not released
in one step — releasing it is exactly the jump being complained about.

## ⛔⛔ The instrument is a suspect, always

**This is the most expensive lesson carried over.** In one session, four harnesses
reported CLEAN on takes the owner had just watched fail. Every time, the instrument
was wrong and the owner was right.

* **Record the value the product ACTUALLY USED**, never a harness recomputing it. A
  recomputation is a second implementation that can silently disagree.
* **Print the aggregation, not just the value.** Two harnesses aggregating
  differently under one name reported an axis as broken when it was fine.
* ⭐⭐⭐ **A SIGN IS NOT TESTED BY ANY AMOUNT OF TESTING THE MAGNITUDE.** Four defects
  in one day shared that shape and not one was caught by a suite. Assert signs
  against declared truth.
* ⭐⭐⭐ **AN INVARIANT TESTED ON ONE AXIS IS NOT TESTED.** A suite checked
  chirality-evenness on the one axis that never had the problem, and certified the
  two that did.
* ⭐⭐⭐ **A GOLDEN VECTOR'S FIXTURE MUST BE A SPECIMEN THE PRODUCT WOULD ACCEPT.** A
  suite built its synthetic input in an idealised form the real code rightly refuses,
  so every vector exercised a case that cannot occur.
* ⭐⭐⭐ **A SKIPPED CHECK MUST BE ANNOUNCED.** A suite fed the wrong-shaped data to a
  loader, got nothing, skipped on a `continue`, and printed ALL CHECKS PASSED. A
  guard that turns missing data into silence is worse than a failure.
* ⭐⭐ **A test that cannot FAIL is not a test.** Keep an explicit counter-example
  beside each guard, and check the guard fires on it.
* ⭐⭐ **Independence has to be ARGUED, not inferred from numbers agreeing.** Three
  measures derived from the same source degrade together and agree on a wrong answer.
* ⚠ **A statistic pooled across a region cannot answer a question about that
  region.**

⚠ **Automated green is necessary, not sufficient. A look on a REAL DEVICE is what
closes a change** — nothing else does. ⛔ And touch gestures cannot be honestly
tested with a mouse: one pointer, no DPI, no tilt, no haptics.

⛔ If a baseline does not reproduce before you change anything, **stop**.

## Rules for reading the record

* **Retractions are kept on purpose.** A claim that was overturned is more useful
  than one silently deleted.
* **When two sections conflict, the later one wins.**
* **A negative result that cannot be re-run is an assertion, not a finding.**
* ⭐ **A constant borrowed from another row's derivation inherits that row's
  QUESTION, not just its number.**
* ⚠ **"Same symptom" never means "same cause."**
