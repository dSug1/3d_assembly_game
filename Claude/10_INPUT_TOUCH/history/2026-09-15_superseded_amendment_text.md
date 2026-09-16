# THE FULL TEXT OF SUPERSEDED AMENDMENTS

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


---

## A8, in full — the rebase A12 retired

**Amends** §1.3's provisional motion, which applied rollback only at RELEASE.

> *"When the circular finger movement is started, the roll is not immediately triggered: the
> rotation starts with a yaw or pitch and then switches to a roll, but the switch is done
> when the yaw or pitch have already rotated the object from its original quaternion. This
> is misleading because the user should want a roll from the initial quaternion, especially
> to maintain the alignment on an axis."*

### The defect

A circle does not read as a roll until `rollAngle` (60°) of arc has been swept. Until then
§1.3 applies the continuous rule **provisionally** — and that rule is 2bis, yaw and pitch.
⛔ So the roll began from a pose the user never asked for, and the result was **not a pure
roll of the original orientation**. ⚠ Which matters most precisely when it matters at all:
a user rolling to preserve an alignment got an alignment quietly broken first.

### ⭐ The mechanism was already in the spec

§1.3 defines provisional motion **with rollback** — it simply only ran it at release, for
the flick test. A roll committing mid-drag is the same situation one transition earlier, and
it takes the same answer: **restore, then apply.**

### ⛔⛔ It rebases to the FIT WINDOW's start, NOT to the press

A hand may drag in a straight line and only then begin to circle. That drag is a yaw the
user asked for, it is **not part of the evidence** for a circle, and undoing it would be a
second defect wearing the first one's clothes. ⭐ `RollDetector.fitWindowStart` publishes
where the evidence begins, and the recognizer keeps a short pose history — bounded by AGE,
because the fit window is sized in PATH LENGTH and a slow circle spans more samples than a
fast one.

⚠ **The object jumps at the commit**, by the whole swept angle. That is not a glitch: it
replaces exactly as much unasked-for yaw/pitch with the roll the finger actually drew.

⭐ A vector pins the distinction: a straight run followed by a circle rebases to the
circle, and the straight run's rotation **survives**.

---

---

## A10, in full — the still-holder rule, before A12 and A13 built on it

⚠ A10's DEPTH rule is still IN FORCE; what is here is the ARGUMENT, including the §1.1
defect it exposed. The binding clauses are in the live file.

## A10 — ⭐⭐ DEPTH IS A **STILL HOLDER AND A MOVING ANCHOR** *(owner, 2026-09-15)*

**Supersedes A6's trigger.** A5's GEOMETRY is untouched by both: depth is horizontal, the
view direction flattened onto the ground, and **height never changes**.

> *"I don't like the conflict generated by the control of depth translation by two fingers.
> Remove the current implementation with two finger synchronized delta position (including
> the 2 windows lag during which it waits to choose between gravity axis or horizontal depth
> axis) and replace by the following: depth axis is controlled by the touchpoint on object
> is still && the touchpoint outside the object has delta position y."*

> *"Also, modify the logic of translation so that the second touchpoint can be either
> outside any object or on the same object as the first touchpoint which raycast hit the
> object (this first touchpoint controls the movement)."*

### ⭐⭐ THE FAULT WAS IN THE QUESTION, NOT IN THE ANSWER

A6 asked *"are these two travels equal, within a ratio, over a window?"* ⛔ That question
has **no answer** at two moments which occur in every single gesture:

* **at a reversal**, both travels pass through zero — the ratio is jitter ÷ jitter;
* **at the start**, one finger has not moved yet — which is exactly rule 6's shape.

A6 answered both by **waiting** (two windows) and by **withholding** rule 6's vertical
meanwhile, so the first window of travel was discarded and a hand felt a hesitation at each
end of every drag. ⭐ A10 asks *"is that finger still?"*, which is answerable at every
instant, **including those two**. There is no window, no ratio, no tolerance and no hold.

⭐ It is also §1.1's own vocabulary: *"every 'delta position' in the spec means MOVING; every
'no delta position' means STATIONARY."* ⛔ So the gate reads the hysteretic motion state,
never a speed invented for it.

### The partition

| the finger ON the object | the other finger | rule |
|---|---|---|
| **MOVING** | anything | **rule 6** — translate; the holder drives |
| **STATIONARY** | MOVING in y, and **outside** | ⭐ **A10** — depth; the anchor drives |
| STATIONARY | STATIONARY | nothing |

⛔ **THE HOLDER WINS EVERY TIE**, so the two rules cannot both fire. That is the property
A6 never had. ⭐ And the roles swap with the intent: the finger that is *doing something*
drives. Rule 6's anchor was always a mode selector contributing no motion; here it
contributes the motion and the object's own finger becomes the selector.

### ⭐ Rule 6's second touchpoint may now be ON the object

The owner's second instruction. `IN2` already latches that role as `SECOND` and makes it
carry the object, so nothing in the plumbing changed — only which rule looks for it.
⚠ **It is deliberately NOT a depth anchor**: A10 says *the touchpoint outside the object*,
and a finger resting on a small part has nowhere to travel. Depth needs the anchor outside,
where the whole screen is available.

⭐⭐ **AND THAT CLOSES THE SMALL-OBJECT HOLE OWED SINCE A5.** The anchor may be anywhere on
the glass, so an object's size on screen stops mattering — which is what A5 could not do
and A6 only half did.

### ⛔⛔ WHAT IT COST: A DEFECT IN §1.1 THAT HAD BEEN THERE SINCE THE NOISE WAS MEASURED

A10 is the **first rule that asks whether a finger is still**. The answer was **no, for any
real finger, for ever** — and two separate things were wrong:

1. ⛔⛔ **The speed was estimated over ONE SAMPLE PAIR** — mistake shape 1, in the file that
   defines *moving*. `0.761 mm ÷ 8 ms = ~95 mm/s` of apparent speed **at rest**, against a
   `stillSpeed` of 6 mm/s. Settle candidacy was destroyed on essentially every sample.
   ⭐ Fixed the way `flick.ts` already says: **speed over a stated window, never the last
   pair.** Noise does not accumulate over a window.
2. ⛔ **The settle-excursion bound was below the noise** — `moveExitDistance` 0.8 mm against
   a 0.761 mm RMS floor. A bound the noise cannot fit inside is one a resting finger can
   never satisfy. ⭐ Now validated: it must exceed `SETTLE_NOISE_MULTIPLE × pointerNoiseMm`.

⚠ **MEASURED, not argued**: before, a finger held still for four seconds after a drag never
returned to STATIONARY. After, it returns in under a second. Both are golden vectors, and
the old estimate is kept as a counter-example.

⭐⭐ **Why eight device passes never saw it**: nothing shipped depended on **re-entering**
STATIONARY. The commit threshold reads the MOVING *transition*, rule 6 reads presence, the
flick test reads lift speed. ⭐ `METHOD`: *a composition is a thing to MEASURE* — the
threshold and the measurement were each fine and their composition was not.

### ⚠ THE FEEL CHANGES, AND A DEVICE MUST JUDGE IT

Four §1.1 numbers were re-sized against the measured floor:

| | was | now | why |
|---|---|---|---|
| `moveExitDistance` | 0.8 mm | **2.4 mm** | ≈3× the 0.761 mm floor — every sample across `stillTime` must fit inside it |
| `moveEnterDistance` | 1.5 mm | **3.2 mm** | must exceed the exit bound, or the state chatters |
| `stillTime` | 150 ms | **450 ms** | `stillSpeed × stillTime` must exceed the exit bound — and the speed window is this long |
| `stillSpeed` | 6 mm/s | **6 mm/s** | ⛔ UNCHANGED, deliberately |

⛔⛔ **RAISING `stillSpeed` INSTEAD WAS TRIED FIRST AND TWO EXISTING VECTORS CAUGHT IT.** At
18 mm/s a deliberate 12 mm/s drag becomes a settle candidate and covers only 1.8 mm in
150 ms — so **a real slow drag would latch STATIONARY**, which under A10 means it would read
as a request for depth. ⭐ The discrimination matters more than the latency, so the cost was
taken in latency.

⚠ **THE COST, STATED**: a drag now commits after **3.2 mm** instead of 1.5 mm, and after the
holder has moved, STATIONARY takes **~0.9 s** to return — so depth is available about a
second after a drag ends. ⭐ A finger that is placed and *not* moved starts STATIONARY and
waits for nothing, which is the ordinary way into the gesture. ⛔ All four have sliders.

### ⛔ ONE CONFLICT WITH §1.3, AND IT IS HANDLED

A depth push holds the finger on the object **still** — which is, character for character,
§1.3's precondition for a **TAP** and a **HOLD**. ⛔⛔ Two quick pushes would therefore be a
**DOUBLE_TAP**, which `resolveDiscreteRule` maps to **2septies eviction**: a gesture that
destroys the user's constraint work, fired by a gesture that never touched a constraint.

⭐ `Recognizer.consumeAsMotion()` marks the holder's gesture as one another rule supplied
motion for, so it releases as `HOLD` and resets the tap history. ⚠ It does **not** commit
the recognizer: the finger may still go on to drag, roll or flick normally.

---

---

## A9, in full — the per-rule deadband A11 absorbed

⚠ A9's REQUIREMENT is in force; what is here is the argument, including the three
deadband forms and the one place it reasoned wrongly (per-axis, which the owner later
restored for a better reason). The binding statement is in the live file.

## A9 — ✅ ABSORBED INTO A11 — a DEADBAND on the pointer delta *(owner, 2026-09-15)*

⭐⭐ **BUILT, but not where this section put it.** A9 asked for a deadband on `dx`/`dy` per
rule; **A11 made §1.1 itself a position deadband**, so the excess-only travel is computed
ONCE and every rule reads the same side of it. ⛔ Nothing consumes a raw delta any more.
⛔⛔ **AND THE ONE THING I SAID A9 GOT WRONG, IT DID NOT.** This paragraph used to read
*"per axis would have been a mistake, the deadband is RADIAL"* — arguing that a square band
makes a diagonal drag travel 1.41× further. ⭐ The arithmetic was right and the conclusion
was wrong: the owner restored per-axis for a reason I had not considered, **axis purity**,
and a radial band cannot provide it at any radius. See A11. ⭐ Everything else here —
especially the three forms and why the hard one is a jump traded for a jump — stands, and
A11 implements the residual form it recommended. Row `IN12` is closed by A11, not built.

**Amends** §1.3 and §4's rule 6 — both consume the raw per-event delta.

> *"It's alright: the logic is right: we just need a deadband on x and y delta position."*
> *"Implement a deadband for x and y and a slider to manually finetune it."*

### ⭐ What this settles, and what it does NOT

⛔⛔ **A7 IS NOT THE FAULT, and that is now a measured claim rather than a defence.** The
report *"you destroyed the rotation around the gravity axis... it came back to the axis of
the screen view plane"* is **withdrawn by the owner**. `tests/a7_wiring.test.ts` composes
the gravity frame with the rotation end to end and asserts the axis that comes out: yaw is
the world vertical to nine places at level, 45° down, 72° down and on the bottom ring; pitch
and roll are horizontal at all four. ⭐ The counter-example in the same file shows the
**camera's** up is 0.4 or less against the vertical at 72°, so *"it came back to the screen
axes"* is a thing that can be told apart from *"it did not"*.

⭐ `METHOD`, again: *a composition is a thing to measure, not an emergent property.* Every
part of A7 had its own green vectors and the composition still had none.

### The defect that IS there

Every object gesture reads `s.x - grip.prev.x` and `s.y - grip.prev.y` **raw**, per pointer
event, and integrates them. ⛔ **`pointerNoiseMm` is 0.761 mm, MEASURED** — a finger held
still emits a delta on every event, so a held object turns while nobody is moving, and a
slow drag arrives as a stagger rather than a glide. That is the *"jumps in the rotation"*.

### ⛔ PER AXIS, not on the magnitude

The rules are axis-separated: `dx` yaws about **gravity**, `dy` pitches about the
**horizontal**. A deadband on the vector's LENGTH would pass a 3 mm horizontal drag intact
and let the 0.7 mm of vertical noise riding on it pitch the object — the very cross-talk the
band exists to stop. ⭐ One band, **applied to each axis independently**.

⚠ **ONE constant, not two** — the owner said *a* slider. x and y are the same finger on the
same glass; a band that differs between them would be a claim about the hardware nobody has
measured.

### ⛔⛔ A HARD DEADBAND IS ITSELF A JUMP — this is the trap in this row

Zeroing everything below `b` and passing everything above it **unchanged** inserts a step of
exactly `b` at the moment the band is crossed. That is a jump traded for a jump, and it is
what a naive deadband always does. Two forms do not:

| form | slow travel | leaving zero | cost |
|---|---|---|---|
| ⛔ hard — zero below `b`, pass above | **lost entirely** | discontinuous, by `b` | the defect, renamed |
| ⭐ soft — pass `d − b·sign(d)` | **lost entirely** | continuous | every delta shrinks by `b` |
| ⭐⭐ residual — accumulate, emit and subtract when `|acc| > b` | **exact** | continuous | ≤ `b` of latency |

⭐ **Build the RESIDUAL form and A/B it against the soft one on the slider.** It is the only
one that does not tax a slow drag: a hand moving 0.3 mm per event still covers its full
distance, three events later. ⚠ Its cost is a quantised step — state it and watch for it.

⛔ A vector must assert the **continuity**: total emitted travel over a long slow drag equals
the input travel to within one band. A deadband whose only vector is *"small deltas do
nothing"* passes in all three rows above, including the broken one.

### Scope, stated so its edges are a decision and not an oversight

- ✅ Rule **2bis** yaw/pitch, and rule **6** translate — the two that read `dx`/`dy`.
- ⛔ **NOT** 2quinte's roll: its angle already goes through the 1€ filter.
- ⛔ **NOT** A6's depth driver: `CommonDragDetector` already holds below
  `MIN_TRAVEL_NOISE_MULTIPLE × pointerNoiseMm`, and a second band there would fight it.
  ⚠ If the device still shows depth jitter after this lands, that is the same idea needing
  the same fix, and it belongs in A6, not here.

### The number

⛔ **Millimetres, rule 3** — `deadbandMm`, in `gestureConfig.ts`, with a slider, because
`IN5` says the slider ships **with** the rule. ⭐ Its natural landmark is the measured noise
floor, **0.761 mm** — the first tunable on this project with a landmark that was measured
rather than guessed. ⚠ And `IN4` is the standing warning about landmarks: the phantom lead's
computed landmark marked the wrong end of its range and the hand shipped a fifteenth of it.
**A landmark tells you where a range's zero is; it does not tell you where to stand.**

---


---

# ADDED 2026-09-16 — `A13` AND `A14`, RETIRED BY `A17`/`D28`

⛔⛔ **NOT THE DESIGN OF RECORD.** What is in force is in
[`../AMENDMENTS_R5.md`](../AMENDMENTS_R5.md), which carries a short stub for each of these
pointing here. ⭐ Moved when the forks were deleted and the amendments file passed its cap
again; both sections below are **verbatim** as they stood.

## Why `A13` is here

Its assignment WAS fork A, and `A17`/`D28` deleted it.

## A13 — ⭐⭐⭐ ONE TOUCHPOINT **TRANSLATES**; A SECOND ONE HELD STILL **ROTATES** *(owner, 2026-09-16)*

**Supersedes** §2 rule 2bis's and §4 rule 6's touchpoint assignments — it swaps them.

⭐⭐⭐ **AND SINCE `1.0.5` / `D26` THE SWAP IS A FLAG, NOT A FORK**: the spec's assignment
is still reachable (`?touchpointAssignment=1`, or the menu toggle), because the whole
difference is **one inversion in `holderDrive`** and everything since — `A14`, `A15`, the
gravity frame, `A11` — is assignment-agnostic. ⛔ It latches **only while nothing touches
the glass**. ⚠ A13 stays the DEFAULT; which one ships is row `IN13`, not due until the
input system can be judged whole.

> *"One touchpoint on object && delta position x or y → horizontal x or gravity axis
> translation. One touchpoint on object idle && second touchpoint anywhere with delta
> position y → horizontal depth translation. One touchpoint on object with delta position x
> or y && second touchpoint idle anywhere → rotation on yaw along gravity axis or pitch
> along horizontal x axis. One touchpoint on object idle && second touchpoint anywhere with
> delta position x → roll rotation along horizontal depth axis."*

### ⭐⭐ THE SHAPE OF IT

**Whichever finger MOVES is the one that acts, and the OTHER one's state says which rule.**

| | second absent | second **IDLE** | second **MOVING** |
|---|---|---|---|
| **holder MOVING** | **translate** — x along the horizontal screen axis, y along **gravity** | ⭐ **ROTATE** — yaw about **gravity**, pitch about the **horizontal** | translate ⚠ |
| **holder IDLE** | — | — | ⭐ **x → ROLL** about the horizontal depth axis · **y → DEPTH** |

⭐ Four cells, no overlap, **nothing to arbitrate over time**. Every gesture in the object
layer is now selected by *which finger is moving* and *whether the other one is still* —
both read live, every frame, from the same §1.1 deadband.

⭐⭐ **A second finger held still is a MODIFIER.** It contributes no motion whatsoever;
holding it still *is* the input. That is the cleanest form the two-finger rules have taken:
the previous assignment had one finger rotating and two translating, which put the
*commonest* gesture (translate) on the *harder* hand shape.

### ⛔⛔ One cell the owner's four rules do not name

**Both fingers moving.** It resolves to **TRANSLATE** — the holder wins every tie, as it has
since A10, and it is what the build already did. ⚠ The alternative, *wait until one of them
settles*, reintroduces exactly the decision lag A12 was written to delete.

### ⛔⛔⛔ IT READS **PRESENCE ALONE**, AND THE DEVICE SAID SO TWICE

⚠ A13 first keyed the mode on the second finger's **motion state**, and a hand overturned
it: *"if I transition quickly there is a translation then a rotation, if I transition slowly
there is directly a rotation."* ⭐⭐ A finger placed QUICKLY skids as it lands — the reported
centroid slides while the contact area grows — so it read `MOVING` for the length of the
landing and the mode followed it. Nothing about the gesture differed; only the landing did.
⛔⛔ And `IN4` had recorded the identical verdict on 2026-09-14, which this amendment had
already FLAGGED as a resemblance to watch — *naming a risk is not the same as not taking it.*
⭐⭐ **Both blocks, with the reasoning as it stood before and after, are in
[`../00_CORE/queue_notes/IN4.md`](../00_CORE/queue_notes/IN4.md)**, moved there 2026-09-16.
`METHOD` carries the rule: *a mode may be keyed on PRESENCE; never on MOTION.*

### ⭐ Two rules, two signals

| signal | what it may decide |
|---|---|
| a touchpoint is **DOWN** | ⭐ the **MODE** — discrete, deliberate, visible |
| a touchpoint is **MOVING** | the **MOTION** it supplies, once the mode is settled |

⛔ The motion state is still exactly right where `A12` uses it — deciding whether the second
finger's own travel drives roll or depth while the holder is still. It is never again used
to pick a mode.

### ⛔ What is NOT covered by a vector, stated plainly

`holderDrive` is pure and has seven vectors, including the unnamed both-moving cell.
⛔⛔ **The WIRING is not**: `scene.ts` is behind the engine boundary, and breaking the mode
selection there reddens **nothing** in the suite — checked, deliberately, rather than
assumed. ⭐ `METHOD`: a look on a real device closes this change, and nothing else does.

## Why `A14` is here

The grace it added is retired **by construction** — the mode no longer reads second-touchpoint presence, so the gap it patched cannot occur.

## A14 — ⭐⭐⭐ A **LIFT-AND-REPLACE** OF THE SECOND TOUCHPOINT IS ONE GESTURE *(owner, 2026-09-16)*

**Amends** `A13`'s *"second absent → translate"*, which was correct and incomplete.

> *"1 — one touchpoint on object → it translates → second touchpoint pressed on screen
> outside any object → object immediately rotates → everything is OK.
> 2 — …second touchpoint is released then pressed on screen outside any object and I **wait**
> to input delta position the first touchpoint → first object rotates → everything seems OK.
> 3 — …and I **immediately** input delta position the first touchpoint → first object
> continues to translate for a while then rotates → this is the issue, and cases 2 and 3
> differ by timing of the input."*

### ⭐⭐ THE DIAGNOSIS, IN ONE LINE

⛔⛔ **The mode logic was never wrong.** Between a lift and the replacing press there is
genuinely **one touchpoint down**, and `A13` says one touchpoint translates — so the object
translated for exactly as long as the swap took, 150-300 ms of hand. ⭐⭐ That is why the
owner's three cases *differed only by timing*: the interval exists in all of them and is only
VISIBLE when the holder happens to be moving through it.
⭐⭐⭐ **So the RULE was right and the GESTURE MODEL was wrong**: a lift-and-replace is ONE
intention, and dropping to one-touchpoint behaviour mid-swap is the artefact.
⭐ The three cases, the timing signature and the full reasoning are in
[`../00_CORE/queue_notes/IN4.md`](../00_CORE/queue_notes/IN4.md), moved there 2026-09-16.

### ⚠ THE COST, STATED

Returning to one-touchpoint translation is **delayed by the grace**. Lift the second finger
and keep dragging with one, and the object keeps ROTATING for up to
`secondTouchGraceMs` before it starts translating. ⛔ That is a real delay on a deliberate
act, and it is the trade this amendment makes.

⭐ **`0` restores the old behaviour exactly**, so the two can be A/B'd on the glass without a
rebuild. Default **250 ms** — a guess, with a slider.

### ⭐⭐ And the instrument that should have answered this

⛔ Three device reports on this rule were diagnosed by *reasoning about code*, because the
HUD could not answer *"what does the build think is down right now?"* — and `METHOD` is
explicit that an instrument is judged against the question it exists to answer. ⭐ The depth
readout now prints the mode, the touchpoint counts and the grace remaining; the examples are
in [`../00_CORE/queue_notes/IN4.md`](../00_CORE/queue_notes/IN4.md), moved there 2026-09-16.

