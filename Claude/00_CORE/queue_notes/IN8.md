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
