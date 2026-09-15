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
