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

's router learned the  role and  runs the rule. ⭐ **This is the
first thing since the  pass that a device can judge.**

### ⭐ Why a NEW role rather than a second 
Making the partner  would put two entries in  for ONE object — and
rules 5, 6bis and 6ter all read that list as *two DIFFERENT objects*. They would fire on a
single pinched part, silently. ⛔ A vector asserts  stays at one and
 reports the partner.

### What the roles mean now

| touchpoint | role | why |
|---|---|---|
| first on an object |  | holds it, runs the §1.3 recognizer |
| **second on the SAME object** | ⭐  | A5's partner. **Carries the object** — the rule must find the pair |
| third and beyond |  | no meaning; must not turn a two-touchpoint rule into a three-touchpoint one |

⭐  **counts the partner** (a rule can see it) and still excludes .
⚠ That is what keeps the eviction shake off during a pinch — A4 is gated on
.

### ⛔⛔ The trap the wiring had to avoid: a ratio is not an increment

 returns a ratio against the gesture's START. Applying it to the
object's CURRENT position each frame would **compound** it, and a pinch out and back would
not return. ⭐ So the object's position, the view axis and the tracker are all captured at
the pinch's start — the same discipline  uses for the camera's
.

### ⭐ One implementation, two triggers

 is called from the holder's move AND from the partner's. A partner
has no recognizer, so without its own branch its motion would do nothing at all — and the
holder's branch alone would make the gesture work only while the *first* finger moved.

⛔ **It takes precedence over rotate and translate.** A part that spun while being pushed
away would be two rules answering one hand.

### ⚠ Known gaps, for the device pass

* **No sympathetic sway during a depth pinch.** The sway is told  from the
  latched mode, which is  while a pinch runs. ⚠ Decoration only, and recorded
  rather than silently changed.
* **No visible partner indicator.** §6 asks for a ring on the anchored object; .
* ⛔ **The gesture reaches a wall** — see the tight ceiling in .
