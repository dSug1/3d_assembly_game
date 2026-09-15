# THE FULL TEXT OF TWO AMENDMENTS WHOSE TRIGGERS WERE SUPERSEDED

> **STATUS** · record · **OWNS** · the original argument for `A1` and `A5`, moved here
> **READ IF** · you want to know *why* eviction and depth ended up where they did
> **LAST VERIFIED** · 2026-09-15

⛔⛔ **THIS IS NOT THE DESIGN OF RECORD.** What is in force lives in
[`../AMENDMENTS_R5.md`](../AMENDMENTS_R5.md), which carries a short entry for each of
these pointing here. `A1`'s trigger was superseded by `A4`; `A5`'s by `A6`.

⭐ Moved out of `AMENDMENTS_R5.md` on 2026-09-15 when that file passed its 800-line cap.
`README.md` rule 3: *hitting the cap is the signal to push narrative down a tier, not to
keep appending*, and rule 2: *nothing is rewritten to save space*. Both sections below are
**verbatim** as they stood.

⚠ Retractions are kept on purpose — a superseded clause explains why the current one
exists, and both of these were superseded by **a hand on the glass**, not by an argument.

---
## A1 — ⚠ SUPERSEDED IN PART BY A4 — constraint eviction leaves the double-tap *(owner, 2026-09-15)*

> ⛔ **ITS TRIGGER IS OBSOLETE: eviction is no longer a 360° roll — see A4.** The roll was
> chosen while roll was FORBIDDEN on a constrained object; **A3 gave that channel back to a
> real control**, so the gesture had to move off it.
> ⭐ **Everything else here stands and is why A4 looks the way it does**: the double-tap is
> purely the camera fly, `D13` spares mates, and the flick-test hazard in §3 below carries
> over unchanged. `METHOD`: *retractions are kept on purpose.*

### The original decision, kept as the record

**Supersedes** §1.4's *"a double-tap on an object clears its constraint stack"* and §2's
**2septies**.

> **A double-tap no longer evicts anything.** It is now exclusively the camera-home fly.
> **To clear a selected object's constraint stack, roll it through a FULL 360°** — the §2
> 2quinte circular gesture, accumulated to a complete turn.

### Why this, and why it closes the collision completely

⛔ The collision was real and unresolvable as specified: since 2026-09-14 a double-tap
flies the camera home **anywhere on the glass, including on an object** — deliberately, for
reachability, because when the camera is stuck close in every tap lands on something. With
2septies as written, straightening the view would silently destroy a constraint the user had
established on purpose.

⭐⭐ **The two gestures are now in different MODALITIES** — a discrete pair of taps against a
continuous swept circle. That is a far wider separation than two same-shaped gestures
distinguished only by where they land, and it is why this resolves the collision rather than
relocating it.

⭐⭐ **And the size of the gesture now matches the size of the consequence.** Eviction
destroys deliberate work. §1.4's eviction clause exists *because* a 2 mm accidental drag used
to wipe an anchor — so the replacement must be a gesture **nobody performs by accident**, and
a full turn cannot be. A double-tap can.

---

### ⛔⛔ THE CONFLICT AUDIT — what else this gesture now touches

⚠ **A1 removes an exclusivity that revision 5 relied on.** Under revision 5 a constrained
object IGNORED circular gestures, so **2sexte owned every drag on a constrained object**
unambiguously. A1 makes a circle meaningful there, and four things follow. ⭐ They are
listed because *a decision must be decided, not discovered* — not because the decision is
in doubt.

| # | what it touches | severity | resolution |
|---|---|---|---|
| 1 | **2quinte** — restricted to an EMPTY stack | ⛔ **blocking** | amended below: a constrained object TRACKS the circle without rolling |
| 2 | **2sexte** — shares the exact same touchpoint configuration | ⚠ **real** | both run; the roll detector separates them. See below |
| 3 | **the flick test at release** — an under-rotated attempt | ⚠ **real** | see below; an abandoned eviction must not PUSH a constraint |
| 4 | **MATE entries on the stack** | ✅ **decided** (`D13`) | eviction **spares mates** — one gesture, one intention. A mate-only stack must REFUSE audibly |

#### 1. ⛔ 2quinte must be amended, or the new gesture is unreachable

2quinte restricts the circular gesture to an object with an **empty** constraint stack: *"On
a constrained object the circular gesture is ignored (double-tap to clear first)."*
⛔ Eviction is now exactly a circular gesture on a **constrained** object, so read literally
the new gesture could never fire on the only objects it applies to.

| the selected object | what a circular gesture does |
|---|---|
| **empty stack** | rolls, per 2quinte, unchanged. ⭐ A full turn returns it where it started and there is nothing to clear — harmless, and not special-cased |
| **non-empty stack** | ⛔ **does NOT roll the object** — revision 5's reason stands, roll about the view axis cannot preserve an alignment — but the angle **IS accumulated**. At a full turn, the stack clears |

⚠ The restriction changes from *"ignore the gesture"* to *"track it without applying it"*.
The object stays still under a partial circle, and nothing is lost if the user stops.

#### 2. ⚠ 2sexte and eviction now share a context — and BOTH must run

One finger, on a selected object, non-empty stack, `COMMITTED_CONTINUOUS`: that is 2sexte's
definition **and** eviction's. They are separated only by the path's shape, through the
existing roll detector — signed angle about a fitted centre, a radius band of
`[rollRadiusMin, rollRadiusMax]` = 5–60 mm, and the sagitta criterion.

⛔ **The resolution is that they are not exclusive: 2sexte keeps driving the constrained
rotation while the circle accumulates in parallel.** Suppressing 2sexte the moment a path
looked curved would make the constrained rotation stutter whenever a hand arced slightly —
and a hand arcs constantly, because fingers pivot about a knuckle.

⚠ **Open for `IN3` to specify, and to check on the device**: when eviction fires at the full
turn, is the 2sexte rotation performed during that circle **kept or rolled back**? ⭐ Kept is
the better default — the user rotated deliberately and the recognizer's rollback exists for
flicks, not for this — but it is a judgement, so it ships with the rest of `IN3` for a look.

⭐ The margin is wide: `rollAngle` commits at **60°** and eviction needs **360°**, six times
further, with the radius band and sagitta guard rejecting non-circular paths throughout.

#### 3. ⚠ An ABANDONED eviction must not push a constraint

§1.3 skips the flick test once roll has committed. ⛔ But a user who starts a circle, gets
part way, and releases **with speed** has not committed to roll — so the flick test runs, and
on a selected object a vertical or horizontal flick pushes `GRAVITY_ALIGN` or
`WORLD_AXIS_ALIGN`. **The user reaching to REMOVE a constraint would add one** — and with
two already on the stack, entry 3 is rejected or evicts the oldest, either of which is a
surprise.

⭐ Resolution: **once the roll detector has committed to tracking a circle — at
`rollAngle`, not at `rollEvictDeg` — the flick test is skipped for that touchpoint**,
exactly as it already is for an applied roll. A tracked circle is a circle whether or not it
turns the object.

#### 4. ✅ DECIDED — a full turn does NOT break mates *(owner, 2026-09-15, `D13`)*

> *"Clearing an alignment and detaching an assembly are different intentions so they can't
> be done by the same gesture."*

⛔⛔ **EVICTION SPARES `MATE` ENTRIES.** The eviction gesture — whichever it is; see A4, and
this clause is deliberately written to outlive it — clears `GRAVITY_ALIGN` and
`WORLD_AXIS_ALIGN` from the stack and leaves every `MATE` in place. This supersedes §1.4's
*"clears its constraint stack"* for mates specifically.

⭐ The reasoning is a principle worth keeping beyond this rule: **one gesture, one
intention.** A gesture that serves two different intentions cannot be aimed — the user has
no way to express *"I meant the smaller one"*, and the cost of the misread is the whole
assembly.

**Consequences `IN3` must implement:**

* ⭐ After eviction, a surviving `MATE` becomes the **oldest** entry and therefore **HARD**
  under §1.4's solver — which is the correct outcome: the joint is the thing that must stay
  exact, and the alignments the user just cleared were the softer intent.
* ⛔⛔ **A full turn on a MATE-ONLY stack must REFUSE AUDIBLY, not sit silent.** With nothing
  evictable the gesture has no effect, and a user who sweeps a full circle and sees nothing
  concludes the gesture is broken and repeats it. §6 already specifies *a short negative
  pattern on a rejected gesture* — this is one. ⚠ Silence is the failure mode here, not the
  refusal.
* ⚠ **Un-snap stays OPEN**, and `3D3` still waits on it. ⭐ Reading (a) would have closed it
  for free; (b) is the owner's judgement that the free answer was the wrong one.

---

### What is left to `IN3`, deliberately

* ⭐ **The threshold is a tunable, not a constant**: `rollEvictDeg`, default **360**. ⛔ It
  cannot land before the code that reads it — `tests/config_debt.test.ts` refuses a tunable
  nothing reads — and it **ships with a slider**, per `IN5`'s standing lesson that a guessed
  number has been wrong every time.
* ⭐ **The accumulation is SIGNED**, matching `roll.ts`'s existing detector: a reversal
  unwinds progress rather than adding to it, so a hand wobbling back and forth never reaches
  a turn. ⚠ Stated so it is not re-derived differently.
* ⚠ **A second finger landing mid-circle** switches to rule 6 (translate). Whether the
  accumulated angle survives that or resets must be chosen; **reset is the safer default**,
  since the gesture is destructive and the user's attention has visibly moved.
* ⚠ **A distinct haptic on eviction** belongs with §6 / `IN7`, and `IN6` should push an undo
  snapshot before the stack is cleared — eviction destroys more than a drag does.
* ⛔ **Reachability holds**: the touchpoint is captured at press, so the swept circle may
  leave the object's silhouette. A small object on screen is not a problem.

### ⚠ The provenance tag changes with the gesture

2septies was **prior art** as a double-tap-to-reset. A full-360°-roll-to-evict is
⚠ **NOVEL COMPOSITE** — no publication describes it — and it is retagged in
[`../PROVENANCE.md`](../PROVENANCE.md). ⭐ The discipline adopted on 2026-09-15 caught its
first new gesture the same day.

---

## A5 — ⚠ ITS TRIGGER IS SUPERSEDED BY A6 — the depth GEOMETRY stands *(owner, 2026-09-15)*

> ⛔ **The pinch is gone**: a hand found that two fingers will not fit on a small object,
> and that pushing a part away shrinks it — so the gesture destroyed its own affordance as
> it succeeded. **A6 replaced the trigger with a common vertical drag.**
> ⭐ **Everything geometric here still stands and is still the design of record**: depth is
> HORIZONTAL, height never changes, the across-view offset is untouched, and both clamps are
> derived. `METHOD`: *retractions are kept on purpose.*

### The original decision, kept as the record

**Supersedes `D10`** (`IN8`, 2026-09-14: *ignore the second touchpoint*) and closes §5's
*"two touchpoints on the same object — currently undefined and reachable"*.

> **Two fingers on one object, pinching, move THAT OBJECT in depth** — pinch in to push it
> away, pinch out to bring it closer. One finger on each of two objects is §4 rule **6ter**,
> already specified.

### ⭐⭐ It came from a hand, not from a document

The `3D1` device pass carried a watch item asking whether a hand gets depth by ORBITING or
by PUSHING with rule 6's anchor finger. ⛔ It did neither:

> *"Depth obtained by two fingers touchpoint on one object or two objects and pinch movement
> to zoom the one or two objects out."*

⭐ **A fourth outcome the question did not offer** — which is the argument for watch items
over A/Bs: an A/B can only return one of the options you thought of. §3.2 **DS3 is declined**
as a result; giving the anchor finger a depth channel is not what a hand reaches for.

### Why it is a strong rule and not merely a preference

1. ⭐⭐ **The metaphor already transfers.** Pinching the camera out makes everything smaller;
   pushing an object away makes *it* smaller. The visual result is nearly identical, so
   there is nothing to learn — it is the gesture the user already has for *"put this further
   away"*.
2. ⭐ **No new discriminator.** §4 already branches on *did the touchpoints hit an object*.
   Pinch on nothing zooms the camera (rule 4); pinch on an object moves the object. Same
   test, one more branch.
3. ⭐ **It removes a dead end.** `D10`'s accepted consequence was that lifting the holding
   finger with a second still on the part left the part **unresponsive**. Under A5 the
   configuration means something, and lifting one finger simply returns to one-touchpoint
   rotation.
4. ⭐ **The two-object half is already §4 rule 6ter**, which the spec flagged as *"the
   hardest case to control"* and offered to drop if it measured poorly. **A hand reached for
   it unprompted, before it was built.**

### ⛔⛔ THE GAIN IS COMPUTABLE — compute it BEFORE writing it

Apparent size goes as `1/distance`, so keeping the object under the two fingers fixes the
mapping exactly: **the object's distance from the camera scales by the INVERSE of the finger
separation ratio.**

```
  distance' = distance × (separation₀ / separation₁)
```

⭐ This is rule 6's lesson applied before the fact rather than after: `gainPinchDepth` is a
**multiplier on a computed factor, and 1.0 is the correct value, not a preferred one**. ⛔ Do
not tune a metres-per-millimetre constant here — it cannot serve both ends of a 20× zoom
clamp, which is exactly what rule 6 proved.

⚠ **It is a RATIO, not a difference**, so it is scale-free and needs no reference distance.

### What `IN2`'s role latch must become

⛔ `IGNORED` does not disappear — its trigger moves. The **second** touchpoint on an object
now PARTICIPATES; the **third and beyond** are still ignored. §4's `activeCount` and the 22
router vectors are written against the old rule and must be revisited with it.

### ⚠ Deliberately NOT decided here

* ✅ **Which way "depth" points was decided the same day** — see the section below. It is
  NOT the camera ray.
* **What it does to a MATED object**, whose depth may be constrained. `3D2`/`3D3`.

### No collision with anything built

Rule 4 needs both touchpoints on **nothing**; rule 6 needs exactly **one** outside; the
eviction shake (A4) is gated on `activeCount === 1`; every §2 rule is one touchpoint. Two on
one object is disjoint from all of them.

### ⛔⛔ "DEPTH" IS HORIZONTAL — along the view axis FLATTENED ONTO THE GROUND PLANE

*(owner, 2026-09-15, resolving what A5 first left open)*

> *"I do not want the pinch on object(s) to move in the direction of the depth of the camera
> view: I want to move in the direction of the projection of the camera view depth axis
> orthogonal to the gravity direction … the gravity direction is an immutable direction and
> I want the depth to be always orthogonal to it, whichever the camera orbit position is.
> That will give better user feeling than pushing an object on the camera view axis (which,
> except of scaling the object, does not provide much visual feedback)."*

⭐ **The stated reason is right** — along the view axis an object only changes apparent
SIZE, and size is the hardest change for an eye to judge. Flattened onto the ground it also
climbs toward the horizon on screen, so the gesture has movement to show for itself.

⭐⭐ **AND THERE IS A STRONGER REASON UNDERNEATH IT.** Gravity is the **primary constraint
in this game**: §2 rule 2ter anchors a face to it, 2sexte rotates about it, and parts are
assembled standing on a working plane. A camera looking down — the ordinary way to look at a
build — makes "along the view axis" point into the FLOOR. ⛔ **A gesture meaning *"put this
further away"* must not silently change an object's HEIGHT**, and the ray version did.

**So the rule keeps three quantities separate**, and each is asserted:

| quantity | what the pinch does to it |
|---|---|
| the object's **height** | ⛔ **never changes** — the push direction is perpendicular to gravity by construction, so there is no height term to get wrong |
| its offset **across** the view | unchanged |
| its **horizontal depth** | ⭐ scales by the pinch ratio — the only thing that moves |

⚠ **The gain's meaning shifts slightly and it is worth stating.** Horizontal depth is not
distance-from-camera, so `gainPinchDepth` = 1.0 tracks the fingers *exactly* only for an
object at the camera's own height. A steeply tilted camera trades a little tracking to keep
the part on its plane — **the right trade in an assembly game**, and the kind of choice that
should be recorded rather than discovered.

⚠⚠ **It goes quiet as the camera climbs, and the mechanism is easy to get backwards.**
Flattening does not TURN the view direction — a camera tilted 10° or 80° about the same
heading flattens to the same direction. What shrinks is the **horizontal distance** from
camera to object as the camera moves overhead, and that is what the ratio scales. ⭐ So a
pinch near the top ring moves the object barely at all: geometry, not a bug. **Second
occurrence of the "goes quiet before it fails" shape** after A3's handover — worth expecting
a third.

### ⚠ Provenance — the closest this project has come to the litigated ground

⛔ The catalogue's caution zone names **Apple's pinch/scroll family** specifically. A pinch
that moves an object in DEPTH is not that claim — and the nearest published relatives,
Z-technique (3DUI 2010) and DS3 (TVCG 2012), separate depth onto a *second finger's relative
motion*, not a pinch. ⭐ But it is the nearest approach so far, so it is tagged ⚠ **NOVEL
COMPOSITE** and marked for `SEC4` **at the moment of adoption**, which is the whole point of
the discipline.

---


---

## A6 — ⚠ ITS TRIGGER IS SUPERSEDED BY A10 — depth was a COMMON VERTICAL DRAG *(owner, 2026-09-15)*

⛔⛔ **SUPERSEDED THE SAME DAY IT SHIPPED, BY A HAND**: *"I don't like the conflict
generated by the control of depth translation by two fingers."* ⭐ What stands is the
configuration — one finger on the object, one **anywhere** — and A5's geometry. What is
gone is the common-travel test, its ratio, its window and the two-window wait. See **A10**,
which also records what that wait cost. ⚠ Kept in full below, because it is the reason A10
is shaped the way it is.

**Supersedes A5's TRIGGER.** ⭐ A5's *geometry* stands unchanged and is the reason this
amendment is short: depth is still horizontal, the height still never changes, and the
bounds are still derived. **Only what starts the gesture has moved.**

> **One touchpoint on the object, one touchpoint anywhere, and BOTH travelling in y by the
> same amount** (within a threshold) — the object translates in horizontal depth.

### ⛔⛔ WHY THE PINCH HAD TO GO — a hole a hand found, not a preference

> *"When the object is small, it is not possible to pinch it out to send it backwards
> because two fingers cannot sit on the small object."*

⭐⭐ **And it failed exactly where it hurts.** Pushing a part away SHRINKS it on screen — so
the pinch **destroyed its own affordance as it succeeded**: the further you got, the harder
it became to go further. A gesture whose reliability decreases with its own use is not a
gesture that can be tuned into working.

⭐ A6's second touchpoint goes **anywhere**, so the object's size on screen stops mattering.
⚠ And it is the same hand shape rule 6 already uses — one finger on the part, one beside it
— so **depth becomes a variation of translation rather than a separate idea**, which is
what the owner asked for: *"closer to the current translation mechanism."*

### ⛔⛔ IT SHARES A CONFIGURATION WITH RULE 6, AND THE DISCRIMINATOR IS THE WHOLE DESIGN

Rule 6 is *one touchpoint on an object && one outside*; A6 is a **superset** of it. So they
cannot be told apart by WHERE the fingers are — only by WHAT THEY DO:

| the two fingers | rule |
|---|---|
| the anchor is **still**, the object finger drags | **rule 6** — translate in the screen plane |
| both **travel in y together**, within a tolerance | ⭐ **A6** — translate in depth |

⭐⭐ **COMMON MODE IS DEPTH; DIFFERENTIAL MODE IS RULE 6.** That is the sentence worth
remembering, and it is why the tolerance is on the **difference** of the two travels rather
than on either one. ⛔ Rule 6's anchor is *deliberately still* — that is what keeps the two
apart, and the gate requires **both** fingers to clear the measured noise before it will
call anything common.

⚠ **A6 takes precedence while it holds**: the object must not also translate across the
screen or rotate, or two rules would be answering one hand.

### ⛔⛔ DETECTION NEEDS A BASELINE; APPLICATION NEEDS AN INCREMENT

Mistake shape 1 — *a rate estimated over the shortest available baseline* — has cost this
project three defects, so *"are these two fingers moving together?"* is decided over a
**stated window** against the **measured** `pointerNoiseMm`.

⛔ But the displacement applied is **this frame's**, not the window's: re-applying an
overlapping window every frame would compound it, which is the trap A5's ratio had in its
own way. ⭐ **The window GATES and the frame MOVES** — two questions, two baselines, and
neither borrows the other's.

⭐ And each finger's move event applies **half** its own delta. That is arithmetic, not
caution: the common travel is the AVERAGE of the two, and both fingers deliver events, so
halves sum to exactly the common travel. Applying the whole of each would move the object
twice as far as the hand asked.

### ⭐ THE GAIN IS RULE 6's, REDIRECTED — and `gainTranslateDepth` already existed

The displacement uses `trackingMetresPerPx`, the same computed factor rule 6 uses, so
**one hand's-worth of finger travel moves the object the same distance whichever direction
it is going** — across the screen or into the scene. ⛔ Not a metres-per-millimetre
constant: rule 6 proved that cannot serve both ends of a 20× zoom clamp.

⭐ `gainTranslateDepth` was already declared, as debt owed to 6bis, so **no new gain was
invented** — it is wired and off `config_debt`'s pending list. `gainPinchDepth` is deleted
with the gesture it was named for.

⚠ **1.0 means CONSISTENT, not tracking.** "The object stays under the finger" is not
available here: that mapping diverges as the camera levels out, because an object pushed
along the ground barely moves on screen when you are looking at it horizontally. ⭐
Consistency with rule 6 holds at *every* camera elevation; tracking does not. **The trade is
recorded rather than discovered.**

⛔⛔ **AND A HAND RAISED IT TO 3.0 THE SAME DAY — the gap is the finding, not the number.**
Depth is **visually foreshortened**: an object pushed along the ground covers world distance
while its picture barely changes, so a world-consistent gain reads as *sluggish* even though
it is, in metres, exactly as strong as a drag. ⭐ **Equal WORLD motion is not equal PERCEIVED
motion**, and the eye is what is being served.

⚠ The slider range was widened to **0.5–5** in the same breath — the owner wanted room
*above* the old ceiling of 3, so 3.0 may not be where this settles.
⛔ Four gains have now been raised by a hand from a derived or guessed value (×3.4, ×2.3,
×2, and this ×3), and **this is the SECOND time a COMPUTED one has been moved** — the first
was rule 6's phantom lead, cut to a fifteenth of its landmark. ⭐ *A computation tells you
where a meaningful zero is; it does not tell you where a hand wants to stand.*

### What `IN2`'s roles become

⭐ The role A5 added is **renamed `SECOND`**, because it outlived the rule that prompted it:
*a second finger on an object another touchpoint already holds*. ⛔ A role named after its
consumer goes stale the moment the consumer changes, and this one did within a day.

⚠ A6's anchor may be a `SECOND` **or** an `OUTSIDE` touchpoint — *anywhere*, as the owner
specified. ⛔ It may **not** be a finger holding a DIFFERENT object: that configuration is
§4 rules 5/6bis/6ter and must stay reachable.

### ⚠ Two new tunables, both placeholders, both on sliders

`depthCommonToleranceMm` (6) and `depthCommonWindowMs` (60). ⛔ Neither is measured: 6 mm
of slack over 60 ms is a guess at how parallel a hand can hold two fingers, and **a guessed
number has been wrong every time on this project.** ⭐ The tolerance is the whole boundary
between A6 and rule 6, so it is the one to move first if either rule fires when the other
was meant.

### ⛔⛔ TWO DEFECTS FOUND BY FINGER, 2026-09-15 — and the second one names the first

**1. From below, the gesture was BACKWARDS.** *"When the camera position is on the bottom
ring facing upwards, the depth translation is chaotic."*

An object pushed further off along the ground **rises** toward the horizon seen from above
and **sinks** seen from below. A6 hard-coded *fingers-up means away*, which is right on the
top rings and inverted on the bottom one — and a hand correcting a backwards control
produces exactly the chaos reported. ⭐ `GravityFrame.towardGravity` — `dot(viewAxis,
gravityDown)`, +1 looking down, −1 looking up — is the sign, latched with the rest of the
frame. ⚠ At **0**, a level camera, a depth change produces no screen motion at all, so the
gesture goes quiet rather than guessing: the **fifth** appearance of that shape, and the
first with the quiet zone in the MIDDLE of the range.

**2. The gate had no hysteresis.** *"At the start the translation on depth is OK but then it
seems to blend into a translation along gravity axis"*, and *"when I do back and forth of
the two synchronized fingers, the object drifts along the gravity axis."*

⭐⭐ **Two reports, one cause.** Entry needs both fingers to have travelled 3× the measured
noise across the window — and a hand SLOWS as it settles, and STOPS at every reversal. The
gate dropped, control fell through to rule 6, and under **A7** rule 6's dy is the GRAVITY
axis. The first report is that handover happening once; the second is it happening at every
turnaround, which **ratchets the leak into a drift**.

⛔ **A speed below the noise floor means "no new information", not "a different gesture".**
So the gate now LATCHES: entering needs both fingers moving, staying needs only that they
have not demonstrably diverged. ⭐ That is §1.1's `moveEnterDistance > moveExitDistance` and
§1.3's one-way `COMMITTED_CONTINUOUS`, applied to the last mode selector that was still
deciding per frame — and `IN4` had already written the rule down after the `STATIONARY`
latch was overturned: *a noisy continuous signal must not pick a mode every frame.*

⚠ **My vectors for this passed with the fix removed**, because I asserted on the latch FLAG
rather than on what `push()` returns — the thing that actually decides. Caught by breaking
the code and watching. ⭐ *A test that cannot fail is not a test*, and it is not knowable
without trying.

### ⭐ What A5 keeps

Everything geometric: horizontal depth, height preserved by construction, the across-view
offset untouched, both clamps derived, and the sympathetic sway answering a push through
the same implementation and the same four tunables.

---

