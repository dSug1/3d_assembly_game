# AMENDMENTS TO REVISION 5 — the owner's later decisions

> **STATUS** · ⭐ live · **OWNS** · every owner decision that SUPERSEDES a clause of the
> revision-5 specification
> **READ IF** · you are implementing any gesture rule. ⛔ **Read this BEFORE the spec** —
> where the two conflict, an amendment here wins
> **LAST VERIFIED** · 2026-09-15

⛔⛔ **THE SPECIFICATION IS NOT EDITED.** Revision 5's text stands unaltered in
[`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md); this file supersedes it.
`METHOD`: *when two sections conflict, the later one wins*, and *retractions are kept on
purpose* — a superseded clause explains why the current one exists, so nothing is deleted.

⚠ These sections lived at the top of the spec until 2026-09-15 and were moved here when
that file reached its 800-line cap. ⭐ `README.md`: *hitting the cap is the signal to push
narrative down a tier, not to keep appending.*

---

# AMENDMENTS TO REVISION 5 — owner decisions that SUPERSEDE clauses below

⚠ **These are the owner's decisions, taken after revision 5 was written.** Revision 5's
text is left standing and unaltered below; where it conflicts with an amendment here,
**the amendment wins** — `METHOD`, *when two sections conflict, the later one wins*. Nothing
is deleted, because a superseded clause explains why the current one exists.

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
[`../PROVENANCE.md`](PROVENANCE.md). ⭐ The discipline adopted on 2026-09-15 caught its
first new gesture the same day.

---

## A2 — THE SCENE HAS THREE OBJECTS, NOT TWO *(correction of fact, 2026-09-15)*

§0 says *"the scene assumes there are two objects. In the future, there can be more."*
⭐ The future arrived: `src/render/scene.ts` builds **three** — `objectA`, `objectB` and
`objectC`, the third deliberately **off-axis and off-plane** so the barycentre mechanism has
something to choose between. Three collinear objects would put every barycentre on one line,
where the ray cannot distinguish them, and the rule would look tested while exercising
nothing.

⭐ §2 rule 1 already anticipated this exactly — *"with three objects there are four
barycentres possible"* — and `IN9` was built and confirmed by finger against all four
(`2³ − 3 − 1 = 4`: three pairs and the triple). **No rule needs changing; only the sentence
in §0 is out of date.**

⚠ **Not to be confused with `3D5`**, which is a different and still-open risk: *the
assembly TREE has never held more than two objects*. Three unparented objects in a scene is
not a three-deep parent chain, and only the second exercises the composition.

---

## A3 — ⛔⛔ ROLL MUST DRIVE THE FREE DOF OF AN ANCHORED OBJECT *(owner, 2026-09-15)*

**Supersedes** §2's 2quinte restriction — *"restricted to unconstrained objects, since roll
about the view axis cannot preserve an existing alignment. On a constrained object the
circular gesture is ignored"* — and A1's repetition of it.

> *"If an object is anchored on gravity, it still needs to be able to receive roll input in
> case the camera has orbited and views the object from the gravity axis: therefore roll
> shall be able to drive 1 DOF for an anchored object anyway and the spec seems wrong."*

### ⭐ The spec's reason is TRUE IN GENERAL AND FALSE IN THE CASE THAT MATTERS

Roll turns the object about the **view axis**. An anchor's surviving DOF is the twist about
the **constraint axis**. Let **α** be the angle between them:

| α | what a roll does to the anchor |
|---|---|
| **α ≈ 90°** (constraint axis lies across the screen) | roll swings the constrained normal straight off its target. **The spec is right here** |
| **α ≈ 0°** (camera looking ALONG the constraint axis) | the two axes coincide: rolling about the view axis **IS** twisting about gravity. It preserves the anchor **exactly**, and it is precisely the one free DOF 2sexte exists to drive |

⛔ So revision 5 states as unconditional a fact that is **conditional on camera pose**, and
forbids the gesture in the configuration where it is not merely safe but ideal. ⚠ This is a
shape this project has paid for before — a blanket rule standing in for a conditional one.

### ⭐⭐ AND THE TWO INPUTS ARE COMPLEMENTARY, NOT COMPETING — the part that settles it

2sexte is *"driven by the delta component perpendicular to the axis **as projected on
screen**"*. ⛔ **When the camera looks along the constraint axis, that axis projects to a
POINT** — and "perpendicular to a point" is undefined. Every screen direction is equally
perpendicular, so the drag mapping is degenerate exactly at α ≈ 0.

⭐⭐ **So 2sexte degenerates precisely where roll becomes exact, and roll is destructive
precisely where 2sexte is well-conditioned.** They are not two rules competing for one DOF;
they are two charts covering one circle, each valid where the other fails. That is the
argument for admitting roll on an anchored object — stronger than "the user wants it".

### What `IN3` implements

⭐ **On a constrained object, roll drives the SAME single DOF that 2sexte drives** — the
twist about the constraint axis — rather than a rotation about the view axis. The screen
gesture is read as an angle; the axis it is applied about is the CONSTRAINT's, not the
camera's. The anchor then survives by construction rather than by luck.

⛔ **Gated on |cos α|, and SUPPRESSED in the crossover.** Near α = 90° the gesture must do
nothing: a roll there cannot be honoured without breaking the anchor, and honouring it
partially is worse than refusing it. `LESSONS_CARRIED` §6 — *where a quantity is
ill-conditioned, stop using it; do not substitute a plausible value.*

⚠ New tunable, landing with the code that reads it and **with a slider** (`IN5`):
`rollAnchorAlignCos`, the minimum |cos α| at which roll is accepted on a constrained
object. ⛔ It is **not** a number to guess — the honest range is wide and the crossover is
exactly where a hand will tell you something a simulation cannot.

⚠ **Two constraints on the stack ⇒ still nothing.** Zero free rotational DOF means zero,
and roll is not an exception to the DOF budget.

### ⛔⛔ AND 2SEXTE MUST BE CORRECTED TOO — it has no degeneracy handling at all

§2's 2sexte is *"driven by the delta component perpendicular to the axis **as projected on
screen**"* and says nothing about what happens when that projection collapses. ⛔ **At
α ≈ 0° the constraint axis projects to a POINT**, every screen direction is equally
perpendicular to it, and the rule as written produces a value from a quantity that has no
value. That is not a rounding problem — the mapping's sign and magnitude both become
arbitrary, so the object turns by an amount and in a direction nothing chose.

⭐ **So the correction is symmetric, and it is one rule, not two:**

| α, view axis to constraint axis | what drives the free DOF |
|---|---|
| **near 0°** — axis points at the camera | ⭐ **ROLL.** 2sexte is degenerate and must SUPPRESS |
| **near 90°** — axis lies across the screen | ⭐ **2SEXTE.** Roll would break the anchor and must SUPPRESS |

⛔⛔ **ONE CONSTANT GOVERNS THE HANDOVER, NOT TWO.** Two independently chosen thresholds
give either a **dead band** where neither input drives the DOF — the control simply stops
working at some camera angles, which reads as a bug nobody can reproduce — or an
**overlap** where both drive it at once and the object turns twice as fast as either rule
intends. `CONSTRAINTS` §4: *one constant lives in exactly one place.*

⚠ **And the handover needs HYSTERESIS**, for the reason §1.1 gives for
`moveEnterDistance` > `moveExitDistance` and the reason the orbit centre has a grace
period: a bare threshold **chatters**. A camera parked near the crossover would flip the
DOF's driver back and forth between two mappings with different gains, mid-gesture.
⭐ One constant plus a band: `anchorHandoverCos` and `anchorHandoverHysteresis`, both
device-tuned on sliders (`IN5`).

⚠ **The handover is latched at PRESS**, like §4's roles and like the screen axes — a camera
that moves during a gesture must not change which rule is driving the finger already down.

### ⛔ Consequence for A1, and it is not small

A1 made a full 360° roll the eviction gesture. ⚠ **A3 makes roll a legitimate continuous
control on exactly the objects eviction applies to** — so the two now share a channel, and
"spin the part round to look at it" becomes a path to accidental eviction rather than a
hypothetical. ⭐ **The eviction gesture is under review for this reason**; see
[`../00_CORE/queue_notes/IN3.md`](../00_CORE/queue_notes/IN3.md).

---

## A4 — ⭐⭐ EVICTION IS A QUICK BACK-AND-FORTH, NOT A ROLL *(owner, 2026-09-15)*

**Supersedes A1's TRIGGER.** ⭐ Everything else A1 established stands: the double-tap is
still purely the camera-home fly, `D13` still spares `MATE` entries, and A1's conflict
audit is still the reason this rule looks the way it does.

> **To clear a selected object's alignments, shake it** — one touchpoint on the object, a
> quick **back-and-forth** in any direction, reversing within a time threshold.

### ⛔ Why the roll had to go — A3 took its channel away

A1 chose a 360° roll when roll was **forbidden** on a constrained object, so the channel
was free and a full turn there could mean nothing else. ⛔ **A3 reverses that**: roll is now
a legitimate continuous control on precisely the objects eviction applies to. *"Spin the
part round to look at it"* stops being hypothetical and becomes a path to destroying the
user's own work.

⚠ **720° was considered and rejected.** Doubling the threshold widens a margin without
changing the KIND of conflict — it is the same channel carrying a real control either way —
and it buys that with a tedious, fatiguing gesture during which the object visibly spins
two full turns. ⭐ *A bigger number is not a resolution to an ambiguity; a different channel
is.*

### ⭐⭐ Why the back-and-forth is the right channel

1. ⭐ **It is not the roll channel**, so A3's control is left completely free — no threshold
   anywhere near it.
2. ⭐⭐ **The detector already exists and is already MEASURED.** The sympathetic sway
   re-triggers on a change of direction, and that cost real work: a per-sample direction is
   noise — at 8 ms between samples, 0.761 mm of jitter is ±95 mm/s, and **a still finger
   fired 272 false kicks in 3 s**. It now reads displacement over **60 ms** and requires
   **3× the measured noise** to claim a heading. ⛔ This is the only one of the three
   candidates that can reuse a reversal detector with a KNOWN false-positive rate.
3. ⭐ **A symmetric out-and-back nets to ZERO displacement**, so whatever 2bis or 2sexte
   does during the shake cancels itself and the object ends where it started. The same
   property the circle had, kept.
4. ⭐ **Shake-it-loose** matches the destructive intent, which a tap never did.

### ⛔ What must be implemented, because the shake has its own conflicts

* ⛔⛔ **THE FLICK TEST IS SHARPER HERE, NOT MILDER.** A flick is *fast + straight + far*; a
  shake is **literally two flicks in opposite directions**, so each leg matches the flick
  signature by construction. **Once one reversal has been seen, the flick test is skipped
  for that touchpoint.** Without it a user shaking to REMOVE a constraint gets 2ter or
  2quater at release and ADDS one — and with two on the stack the object then has zero free
  rotational DOF and stops responding entirely. ⭐ The discriminator is crisp — zero
  reversals is a flick, one or more is a shake — but it must be written, not assumed.
* ⚠ **Corrective nudges are the accident risk.** *"Left a bit, right a bit"* during fine
  positioning is a genuine back-and-forth, and this risk is higher than a full circle's.
  Managed by requiring **≥ 2 reversals inside a tight window** and a **minimum leg amplitude
  well above the 0.761 mm measured noise floor** — not by hoping.
* ⛔ **Single touchpoint only.** With a second finger down, rule 6 is translating the object
  and a back-and-forth there is an ordinary drag. Gate on `activeCount === 1` (§4's count,
  which already excludes `IN8`-ignored touchpoints).
* ⚠ **Refuse audibly on a MATE-ONLY stack** (`D13`): the gesture was aimed at something and
  did nothing, and silence reads as a broken control that gets repeated. ⭐ **On an EMPTY
  stack, stay silent** — nothing was aimed at, and a buzz for every shake of a free object
  is noise.

### The tunables — all three device-tuned, none guessed

`evictShakeReversals` (2), `evictShakeWindowMs`, `evictShakeLegMm`. ⛔ They land WITH the
code that reads them (`config_debt` refuses an orphan) and **each ships with a slider**.
⭐ `IN5`: a guessed number has been wrong every time on this project, and this gesture's
whole safety rests on the gap between a shake and a nudge — which is a hand's judgement,
not a simulation's.

### ⚠ Provenance

⚠ **NOVEL COMPOSITE**, and flagged for `SEC4`. The nearest widely-known relative is iOS's
*shake to undo* (2009) — but that reads the **accelerometer**, a device motion, not a touch
path, so it is a different input entirely and not a safe prior-art anchor for this. ⭐ The
metaphor is old; **this gesture is not attested anywhere found.** Registered in
[`PROVENANCE.md`](PROVENANCE.md).

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

## A6 — ⭐⭐ DEPTH IS A **COMMON VERTICAL DRAG**, NOT A PINCH *(owner, 2026-09-15)*

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

## A7 — ⭐⭐ EVERY OBJECT GESTURE STANDS ON A **GRAVITY FRAME** *(owner, 2026-09-15)*

**Supersedes** §2 rule 2bis's *"yaw and pitch along the vertical and horizontal axes of the
screen view plane"*, 2quinte's roll *"on the screen view plane"*, and §4 rule 6's
*"translates in x and y in the screen view plane"*.

> Object gestures are expressed in one world basis, not in the camera's:
>
> | finger | translates along | rotates about |
> |---|---|---|
> | **delta x** | `right` — horizontal, across the screen | `up` — **yaw about gravity** |
> | **delta y** | `up` — **the world vertical** | `right` — pitch |
> | **delta y, BOTH fingers** (A6) | `depth` — horizontal, into the scene | — |
> | **a circle** (2quinte) | — | `depth` — **roll about horizontal depth** |

### ⭐ Two of the four changes were already true

**Pitch is already about the screen-x axis**, and **translation's dx is already
horizontal** — because the camera carries no roll, so its right is `worldUp × forward`,
which is horizontal at every elevation. ⭐ That is asserted, not assumed: the whole basis
rests on it.

**The real changes are YAW** (camera-up → gravity) **and ROLL** (view axis → horizontal
depth), plus **translation's dy** (camera-up → the world vertical).

### ⛔⛔ THE ARGUMENT IS ORTHOGONALITY, NOT TIDINESS

Before A7 an object yawed about the CAMERA's up and rolled about the CAMERA's view axis.
⚠ Tilt the camera and the view axis acquires a vertical component — so **roll stops being
independent of yaw about the world vertical**, the two gestures partly do the same thing,
and the overlap grows with the tilt. At the top ring the roll axis is more than 0.9 aligned
with the vertical. ⛔ **There is no gain that fixes that; it is a basis that is not a
basis**, and a vector asserts the overlap directly.

⭐⭐ A7's three axes are **orthonormal at every camera elevation**, and the same basis
serves translation AND rotation: *the axis you push along is the axis you can turn about.*
A hand learns one frame instead of two, and it is the frame the world is built in — §2 rule
2ter anchors a face to gravity and parts are assembled on a working plane, so gravity is
what the user is already reasoning about.

### ⚠ What it costs

1. **Vertical translation goes quiet looking straight down** — gravity projects to a point,
   so a finger moving up and down moves the object toward and away from the camera,
   invisibly. ⭐ `verticalVisibility` publishes the factor (1 level → 0 overhead) so the
   weakening is measurable rather than reported as *"it stopped working"*.
2. **The gesture frame does not exist** at exactly that pose, and `requireGestureFrame`
   **throws** rather than guessing. ⚠ Unreachable by construction — the orbit surface clamps
   elevation to its rings and never reaches a pole.
3. ⚠ **The roll LOOKS different when the camera is tilted — the gesture does not.**
   ⛔ My first statement of this was wrong and the owner corrected it: *"we do not project
   the delta position so the input is still a circular movement, we only modify the axis of
   rotation."* Exactly so. `degClockwise` is a signed angle about a fitted centre, a pure
   screen-space measurement, so the circle is no harder to sweep and the amount of rotation
   is identical. What changes is the picture: the object's points turn in planes
   perpendicular to `depth`, which project to **ellipses squashed by `cos(elevation)`** —
   100% level, ~71% at 45°, ~31% at the top ring.
   ⭐⭐ **And it buys reproducibility**: roll 90°, orbit, roll 90° again — about the view
   axis those are two DIFFERENT world rotations; about `depth` they are the same one. For
   getting a part into a specific orientation that is worth more than screen fidelity.

⭐ Costs 1 and 2 are the *"goes quiet before it fails"* shape for the **third and fourth**
time (after A3's handover and A6's depth). ⚠ It is a pattern now, not a coincidence:
**every rule referenced to a world axis weakens as the camera lines up with that axis.**
Expect it in the next one, and publish the factor rather than waiting for a report.

### ⛔ Two frames, two purposes

`GravityFrame` is **not** interchangeable with `ScreenFrame`. A3's handover asks for the
angle between the **TRUE** view axis and a constraint axis, and a flattened one would answer
a different question. ⚠ The split is deliberate and the types are distinct so it cannot be
undone by accident.

### ⛔ A sign, caught by its own assertion

`right` was first built as `depth × up` and came out **negated** — every horizontal drag
would have run backwards. ⭐ The vector that compares it against the camera's own right
caught it immediately. *A sign is not tested by any amount of testing the magnitude*, and
that is the fifth time on this project.

---

## A8 — ⭐⭐ A ROLL REBASES TO THE START OF ITS CIRCLE *(defect found by finger, 2026-09-15)*

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

## A9 — ⭐⭐ A **DEADBAND** ON THE POINTER DELTA, PER AXIS *(owner, 2026-09-15)*

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
