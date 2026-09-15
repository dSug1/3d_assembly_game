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

## A5 — ⭐⭐ TWO TOUCHPOINTS ON THE SAME OBJECT ARE A **DEPTH PINCH** *(owner, 2026-09-15)*

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

* **Does the pinch also translate in the screen plane** when its centroid moves, or is that
  rule 6's job alone? The owner specified depth. ⭐ Leaving it out is the smaller rule and
  the easier one to add later; guessing it in would be a second meaning nobody asked for.
* **What it does to a MATED object**, whose depth may be constrained. `3D2`/`3D3`.

### No collision with anything built

Rule 4 needs both touchpoints on **nothing**; rule 6 needs exactly **one** outside; the
eviction shake (A4) is gated on `activeCount === 1`; every §2 rule is one touchpoint. Two on
one object is disjoint from all of them.

### ⚠ Provenance — the closest this project has come to the litigated ground

⛔ The catalogue's caution zone names **Apple's pinch/scroll family** specifically. A pinch
that moves an object in DEPTH is not that claim — and the nearest published relatives,
Z-technique (3DUI 2010) and DS3 (TVCG 2012), separate depth onto a *second finger's relative
motion*, not a pinch. ⭐ But it is the nearest approach so far, so it is tagged ⚠ **NOVEL
COMPOSITE** and marked for `SEC4` **at the moment of adoption**, which is the whole point of
the discipline.
