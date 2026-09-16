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

## A1 — ⚠ ITS TRIGGER IS SUPERSEDED BY A4 — eviction leaves the double-tap *(owner, 2026-09-15)*

**Amends** §1.4 / 2septies' double-tap eviction, and (as `D13`) §1.4's *"clears its
constraint stack"*.

⭐ **IN FORCE:**

1. **The double-tap evicts nothing.** It is purely the camera fly-home, so a double-tap
   means exactly one thing. The two gestures had collided.
2. **Eviction SPARES `MATE` entries** (`D13`) — *"clearing an alignment and detaching an
   assembly are different intentions so they can't be done by the same gesture."*
   ⭐ **One gesture, one intention**: a gesture serving two cannot be aimed, and here the
   cost of the misread is the whole assembly. ⛔ A full turn on a MATE-ONLY stack must
   **refuse audibly** (§6's negative haptic) — silence reads as a broken gesture and gets
   repeated.

⚠ **SUPERSEDED:** its replacement trigger, a full 360° roll. `D14` gave the roll channel
back to a real control, so eviction had to leave it — see **A4**.

⭐ **The full original text**, with the whole argument, is kept verbatim in
[`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md).

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

## A3 — ⛔⛔ ROLL DRIVES THE FREE DOF OF AN ANCHORED OBJECT *(owner, 2026-09-15)*

**Amends** 2quinte's *"on a constrained object the circular gesture is ignored"* **and**
2sexte's undefined behaviour when its axis projects to a point. ⛔ **IN FORCE, NOT BUILT** —
`src/input/anchor_rotate.ts` exists with 25 vectors and is **not wired**.

⭐ **The binding clauses, in full:**

1. **Roll DRIVES the free DOF** of an anchored object, about the **CONSTRAINT axis** — not
   the view axis. The spec forbade it for a reason that is *conditional on camera pose* and
   false when the camera looks along the constraint axis, where rolling about the view axis
   **is** twisting about the anchor.
2. **2sexte SUPPRESSES where it degenerates.** When the constraint axis projects to a point,
   *"perpendicular to the axis as projected on screen"* has no value and the rule would turn
   the object by an arbitrary amount. ⭐ The two are complementary charts over one DOF.
3. ⛔ **ONE handover constant, with hysteresis, latched at press** (`anchorHandoverCos`).
   Two thresholds would give either a dead band where the DOF has no driver, or an overlap
   where it has two.
4. ⭐⭐ **The handover must happen while the motion is still VISIBLE.** The near side's
   excursion is `r·sin α`, so a rad/mm gain turns the object at the same rate while the drag
   goes quiet — it fades over a range *before* it becomes undefined.

⭐ The full argument, the geometry and the three fixtures of mine that were wrong in that
one file are in
[`history/2026-09-15_eviction_and_anchored_roll.md`](history/2026-09-15_eviction_and_anchored_roll.md).

---

## A4 — ⭐⭐ EVICTION IS A QUICK BACK-AND-FORTH, NOT A ROLL *(owner, 2026-09-15)*

**Supersedes A1's trigger.** ⛔ **IN FORCE, NOT BUILT** — `src/input/shake.ts` exists with
15 vectors and is **not wired**.

⭐ **The binding clauses, in full:**

1. Eviction is a **quick back-and-forth**, one touchpoint, **≥ 2 reversals in a window**.
   ⭐ It left the double-tap (`A1`), then left the roll channel too, because `D14`/`A3` gave
   the roll back to a real control — *a bigger number is not a resolution to an ambiguity;
   a different channel is.*
2. ⛔⛔ **The flick test is SKIPPED once ONE reversal is seen.** A shake is literally two
   flicks in opposite directions, and without the guard an abandoned shake **ADDS** a
   constraint instead of removing one. `suppressesFlick` arms on the first reversal.
3. ⭐⭐ The detector is defined as **oscillation ALONG AN AXIS**, because a circle projects
   to a back-and-forth on *every* axis — without that, spinning an anchored part to look at
   it would evict, which `A3` made reachable.
4. **Eviction SPARES `MATE` entries** (`A1 §4` / `D13`), and a full turn on a MATE-only
   stack must **refuse audibly** (§6's negative haptic).

⭐ The full argument, including the 720° alternative that was considered and rejected, is in
[`history/2026-09-15_eviction_and_anchored_roll.md`](history/2026-09-15_eviction_and_anchored_roll.md).

## A5 — ⚠ ITS TRIGGER IS SUPERSEDED BY A6 — the depth GEOMETRY stands *(owner, 2026-09-15)*

**Amends** §5's *"two touchpoints on the same object — undefined and reachable"*, and
supersedes `D10`.

⭐⭐ **IN FORCE — the geometry, which is the part that mattered:**

> *"I do not want the pinch on object(s) to move in the direction of the depth of the
> camera view: I want to move in the direction of the projection of the camera view depth
> axis orthogonal to the gravity direction: the gravity direction is an immutable direction
> and I want the depth to be always orthogonal to the gravity direction, whichever the
> camera orbit position is."*

⛔ **DEPTH IS HORIZONTAL** — the view direction flattened onto the ground plane — so the
object's **height never changes** as it is pushed away. ⭐ The owner's reason is about
feedback, not tidiness: pushing along the camera's own axis only scales the object on
screen, which reads as a zoom rather than as motion.
⛔ **The gain is COMPUTED, not guessed.** ⚠ `IN2`'s `IGNORED` role survives with its
trigger moved to the **THIRD** touchpoint.
⭐ This is the direct ancestor of **A7**: gravity as the one immutable reference.

⚠ **SUPERSEDED:** the **pinch** trigger. ⛔⛔ A hand found the hole — **two fingers will
not fit on a SMALL object**, and pushing a part away shrinks it, so *the pinch destroyed
its own affordance as it succeeded*. See **A6**.

⭐ **The full original text**, including the ceiling, the sway and the device pass, is kept
verbatim in
[`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md).

## A6 — ⚠ ITS TRIGGER IS SUPERSEDED BY A10 — depth was a COMMON VERTICAL DRAG *(owner, 2026-09-15)*

⭐ **IN FORCE**: the CONFIGURATION — one finger on the object, one **anywhere** — and A5's
geometry. A6 is what moved depth off the pinch, and that half stands.

⛔⛔ **SUPERSEDED THE SAME DAY IT SHIPPED, BY A HAND**: *"I don't like the conflict
generated by the control of depth translation by two fingers."* Gone: the common-travel
test, its ratio, its window and the two-window wait.

⭐⭐ **AND IT IS THE MOST INSTRUCTIVE FAILURE IN THIS FILE**, because it was implemented
CORRECTLY and still failed. *"Are these two travels equal?"* has no answer at a reversal or
at a late start, and both happen in every gesture — so the rule had to buy one with a
window. ⭐ See **A10**, and `METHOD`: *when a rule needs a WINDOW to decide, suspect the
QUESTION.*

⭐ **The full original text**, including the five earlier models a hand rejected before it,
is kept verbatim in
[`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md).

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

## A8 — ⛔ RETIRED BY A12 — a roll rebased to the start of its circle *(2026-09-15)*

⛔⛔ **A12 MOVED ROLL TO THE SECOND TOUCHPOINT, SO THERE IS NO PROVISIONAL YAW/PITCH TO
UNDO AND NOTHING TO REBASE TO.** A8 existed because a circle was not recognised until 60°
of arc, and the yaw/pitch applied meanwhile had to be taken back. ⭐ Roll and yaw/pitch are
now different touchpoint configurations, so the 60° of doubt never happens.

⚠ **A8 also carried a defect of its own, found by finger and fixed before it was retired**:
the scene applied roll as an increment against a `lastRollDeg` that had tracked the
UNCOMMITTED phase, so the commit dropped ~60° of swept roll while undoing the yaw/pitch it
was meant to replace — *"a big jump at one point"*. ⭐ The owner named the cause from the
feel alone: *"anchoring on a previous quaternion which is now far away."*

⭐ The mechanism is **kept callable** (`Recognizer.rebaseOnRollCommit`) with its three
vectors driving it explicitly. Kept because retractions are kept on purpose, and because the
day a circular roll comes back, this is what comes back with it. The original text follows.

⭐ **The full original text** is kept verbatim in
[`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md).

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

## A10 — ⭐⭐ DEPTH IS A **STILL HOLDER AND A MOVING ANCHOR** *(owner, 2026-09-15)*

**Supersedes A6's trigger.** A5's GEOMETRY stands: depth is horizontal, and height never
changes. ⛔ **IN FORCE**, and A12/A13 build directly on it.

⭐ **The binding clauses:**

1. Depth runs while the touchpoint **on the object is STILL** and a second touchpoint —
   inside or outside any object (`A12`) — travels in **y**. ⛔ No window, no ratio, no
   tolerance: *"is that finger still?"* is answerable at every instant, which *"are these
   two travels equal?"* is not.
2. ⛔ **The holder wins every tie**, so rule 6 and depth PARTITION the configuration
   instead of competing for it — and rule 6's vertical is never withheld.
3. ⭐ It is §1.1's own vocabulary: *every "delta position" means MOVING*. The gate reads the
   hysteretic motion state, never a speed invented for it.
4. ⭐⭐ The anchor may be **anywhere on the glass**, which closes the small-object hole owed
   since A5.

⛔⛔ **It cost a defect in §1.1 that nothing else could have found** — the motion state
could not see a finger come to rest, because it was driven only by `pointermove` and a still
finger emits none. → [`../00_CORE/queue_notes/IN0.md`](../00_CORE/queue_notes/IN0.md)

⭐ **The full argument**, including the five rejected models that preceded it, is kept
verbatim in
[`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md).

## A11 — ⭐⭐⭐ STATIONARY IS A **POSITION DEADBAND**, NOT A TIMER *(owner, 2026-09-15)*

**Supersedes** §1.1 entirely, and **absorbs A9**. Four tunables become one radius.

> *"I think there is an error in the definition of stationary: stationary should mean a
> deadband around the touchpoint position (independently of the time). Check how Unity
> defines deadband on delta position and how it catches up once delta position crosses the
> deadband."*

### ⭐ The two halves of a deadband, and everyone forgets the second

Unity's stick and axis deadzone processors read input below a dead radius as **zero**, and
beyond it **rescale from zero** rather than passing the value through. ⛔ Without that
second half a deadband inserts a step of exactly one radius at the crossing — *a jump
traded for a jump*, which is the trap `A9`/`IN12` was written to avoid.

### The model

An **anchor trails the finger at exactly one dead radius**. Every sample:

* **inside the radius** → `STATIONARY`, and it emits **nothing**;
* **outside it** → emit the excess `d − band` along the direction of travel, and drag the
  anchor up so it trails at exactly `band` again.

⭐⭐ **Three properties fall out, and each answers a defect this project shipped:**

1. **It is TIME-FREE**, which is what the owner asked for and what the device demanded —
   see the report below.
2. **Emitted travel is EXACT**: the true travel minus one radius, **once** — not a radius
   per sample, and with no step at the crossing. ⭐ This *is* `A9`, so `dx`/`dy` need no
   second deadband; `IN12` is closed by this row rather than built.
3. **A slow drag survives.** Displacement accumulates against a *fixed* anchor, so a finger
   creeping at 0.3 mm per sample covers its full distance a few samples later. ⛔ The
   obvious implementation — re-centre the anchor whenever the finger is inside the radius —
   emits **nothing, for ever**. That is a vector, with the broken form beside it.

### ⛔⛔ THE DEVICE REPORT THAT FORCED IT

> *"Most of the times, when I switch from x/y to depth translation, even if I make ample
> movement with the second touchpoint finger, there is no depth translation for a while and
> then suddenly the depth translation is triggered. On the opposite, if I switch from depth
> to x/y translation, the switch is immediate."*

⭐ **The asymmetry was structural, and it was mine.** Entering `MOVING` was a DISTANCE test
— instant. Returning to `STATIONARY` was a DURATION test, and A10 had made it worse: the
speed window had to FILL (450 ms) before the settle timer could start (450 ms more). **Two
durations in series, ~900 ms**, in front of the one transition A10's depth gate needs.

⛔ Under A11 there is no settle at all. Leaving rest stays instantaneous; returning costs
one `restConfirmMs`, a tenth of what it replaced.

### ⭐⭐⭐ PER AXIS, AND THE REASON IS NOT NOISE — IT IS AXIS PURITY

> *"I would expect a deadband on delta position x and a deadband on delta position y (even
> if both are equal). So I could have a pure movement on x or y by filtering out the delta
> position which does not cross its deadband."*

⛔⛔ **THIS PROJECT ARGUED AGAINST PER-AXIS ONCE — IN `IN12`'s DOSSIER AND IN A9 — AND THE
ARGUMENT WAS ABOUT THE WRONG THING.** It said a square band makes a diagonal drag travel
1.41× further before it starts. ⚠ True, and beside the point: what the square buys is a
**corridor along each axis in which the other axis emits nothing at all**, so a
nearly-horizontal drag is *purely* horizontal.

⭐ **A radial band cannot do that at any radius.** The moment the finger leaves the circle,
both components are live and the wobble reaches the object. **Axis purity is a property of
the SHAPE, not of the size** — there is a vector for exactly that, with the radial form
implemented alongside as the counter-example, showing 1.5 mm+ of wobble reaching the object
over a drag where the per-axis form emits **zero**.

⭐⭐ **And each axis carries its OWN state**, which is what makes the purity *last*: an axis
that has not broken out stays silent for as long as the hand keeps it inside its band — not
merely until the other axis starts moving. ⛔ Shared state would give a corridor that
existed only until the drag began, which is no corridor at all.

⚠ **It is a filter, not a lock.** A deliberate move on the quiet axis breaks it out
normally, and `restConfirmMs` of quiet puts it back — so the corridor is re-enterable
within a gesture.

### What per-axis costs, stated

| | radial | per axis |
|---|---|---|
| entering along one axis | 1 band | **1 band** |
| entering at 45° | 1 band | ⚠ **1 band on each axis** — 1.41× the diagonal travel |
| a reversal | one sample | **one sample** — ⭐ fluidity is unchanged, measured |
| a nearly-axial drag | ⛔ the off-axis wobble reaches the object | ⭐ **the off-axis emits zero** |

⭐ Measured after the change: reversal cost is still **one sample at every speed**, and
entering a drag still costs one band. Going per-axis bought the corridor for nothing.

### ⭐ Where it is applied

⛔ **Every `x`/`y` input of both touchpoints**, on the owner's instruction — rule 2bis's
yaw/pitch, rule 6's translate, and A10's depth. ⚠ **Except the ROLL**, which is an angle
about a fitted centre rather than an axis pair, and already carries its own 1€ filter.

⚠ **One consumer is deliberately still raw: §2 rule 1, the camera orbit.** It is a CLOSED
row (`IN9`) tuned by finger over three device passes, and the owner's instruction named
rotation and translation of an OBJECT. ⭐ It is the same jitter and the same fix if a hand
ever wants it — recorded so it is a decision rather than an omission.

⭐ **Owner's note for a later row**: the second touchpoint's **delta position x** will drive
something (A10 currently reads its `dy`). Not built.

### ⛔⛔⛔ THE BAND GATES **ENTRY INTO MOTION**, NOT THE MOTION ITSELF

> *"Does your deadband impact the sway and the damping: the object translation is less
> fluid than when we had no depth translation built in?"*

⭐ **It did, and the cost was MEASURED before it was fixed:**

| | dead travel | lag at 50 mm/s | lag at 200 mm/s |
|---|---|---|---|
| entering a drag | 1 band = **2.5 mm** | 48 ms | 16 ms |
| ⛔⛔ at a **REVERSAL** | 2 bands = **5.0 mm** | **88 ms** | 24 ms |

⛔⛔ **THE ANCHOR TRAILS ONE RADIUS *BEHIND*, SO REVERSING MEANS CROSSING THE WHOLE DEAD
CIRCLE** — the far side, not the near one. ⚠ Against rule 6's tuned follower
(τ = 7.6 ms, ζ = 0.2, lead = 0.2 ms) that is **more than ten times the entire time
constant**, as pure dead time, in front of it. ⭐ No damping value can absorb dead time,
which is why it reads as *"less fluid"* rather than as *"too slow"*.

⚠ **And it was worst exactly where it hurts most**: a fixed distance costs more time the
slower you move, so a careful, slow adjustment — the kind assembly is made of — paid the
biggest penalty.

⭐ **It desynchronised the sway, too.** The sympathetic sway reads the raw sample stream for
its direction and speed, gated by the motion state — which stays `MOVING` through a
reversal. So the scene kicked on the turn while the held object had not moved yet.

### ⭐⭐ The distinction the first version missed

**A finger that has already PROVEN it is moving needs no further proof.** The band exists to
reject the jitter of a finger at **rest** — so it gates the way *out* of rest, paid once per
gesture, and once out, travel passes through undiminished.

| | before | after |
|---|---|---|
| entering a drag | 1 band | **1 band** — unchanged, and it is the whole point |
| at a reversal | 2 bands | ⭐ **one sample**, at every speed |
| a still finger | emits nothing | **emits nothing** |
| total travel | true − 1 band | **true − 1 band** |

⛔ The STATE machine is untouched, which is what makes this safe: rest is still found by the
same trailing anchor and the same `restConfirmMs`, so A10's depth gate reads exactly what it
read before.

⭐ `METHOD`: *a threshold that guards a transition must not also tax the steady state.*

### ⛔⛔⛔ AND REST MUST BE REACHABLE WITHOUT FURTHER EVENTS

⚠ **The device report survived A10's fix AND A11's, and the owner was right that neither
explained it:**

> *"I still experience issue passing from x/y translation to depth translation (sometimes,
> it is blocked) while passing from depth translation to x/y translation is smooth and
> instantaneous: there is something wrong you did not explain nor check."*

⛔⛔ **THE STATE MACHINE IS DRIVEN BY `push`, AND `push` IS DRIVEN BY `pointermove`. A
finger resting on glass emits no `pointermove` events — that is what resting *is*.** So the
tracker froze at whatever it last was, and what it last was is `MOVING`.

⭐⭐ **The asymmetry was structural, and exactly inverted from what the rules need:**

| transition | driven by |
|---|---|
| → `MOVING` | an event that **necessarily exists** — the finger moved |
| → `STATIONARY` | an event that **by definition may not arrive** |

⚠ And it explains *"sometimes"* precisely: the only thing that thawed the tracker was a
stray jitter sample crossing the digitizer's own threshold, and those arrive at random.
Blocked for a while, then suddenly triggered.

⭐ **`MotionTracker.tick(now)`, driven by the render loop every frame**, for every live
touchpoint — and again at the exact moment an anchor event asks the question, because an
event can arrive between frames.

⭐⭐ **The quantity it reads is not a consolation prize: elapsed time with NO sample is the
strongest evidence of stillness there is** — stronger than samples inside the dead radius,
because a sample inside the radius is still a *report of motion* and silence is not. It
simply has to be asked for. ⛔ A tick decides a STATE and emits no travel, ever: a tick that
produced a delta would let a dropped frame move an object, which its own vector caught.

⚠ **CARRIED**: *a threshold is only half a rule — the other half is what advances the clock.*
Three fixes went into the number before anyone checked that the thing which clears it can
run at all.

### ⚠ The one time term that survives, and exactly why

⛔⛔ **A pure position deadband chatters at its own boundary**, structurally: while the
finger moves, the anchor is dragged to sit **exactly on** the radius — so when the finger
stops it is resting ON the line, and the measured 0.761 mm of noise straddles it. Roughly
half of all samples would read *outside*. ⚠ A bigger radius does not help; the anchor
follows it out.

⭐ So `restConfirmMs` confirms **only the transition back to `STATIONARY`**. It is not a
settle timer, it is not on the path the owner complained about, and the deadbanded delta
never waits for it.

### What A11 deleted

| gone | why |
|---|---|
| `stillSpeed` | a rate; the radius over a duration *is* a rate, with a stated baseline |
| `stillTime` | the settle timer the device complained about |
| `moveEnterDistance` / `moveExitDistance` | one radius, so there is no pair to be inconsistent |
| the *reachability* validator rule | it related a rate to a distance; neither exists now |
| `A9`'s separate `deadbandMm` | ⭐ **the same thing, one tier down** — applied once, for every rule at the same time |

⭐ **`motionDeadbandMm` is now the most load-bearing number in the input layer**: the commit
threshold, the rest test and the jitter deadband are all one radius. ⛔ It has a slider, and
a device must judge it.

### ⭐⭐ The carried lesson

This is the **fourth** formulation of §1.1, and the first three all failed the same way:

| formulation | how a real pointer broke it |
|---|---|
| *accumulated travel* (the spec's own words) | path length of jitter is a random walk — grows without bound, so every resting finger read MOVING |
| instantaneous speed | cannot see a slow persistent creep |
| speed over one sample pair | 0.761 mm / 8 ms = ~95 mm/s **at rest** — STATIONARY unreachable |
| ⭐ **a position deadband** | robust by construction |

⛔⛔ **Every quantity §1.1 names is defined on an IDEAL pointer**, and each fix so far had
been a threshold chosen to sit above a measurement. ⭐ A displacement deadband needs no such
choice: it is the *shape* that is right, not the number.

---

## A12 — ⭐⭐⭐ ROLL MOVES TO THE **SECOND TOUCHPOINT'S x** *(owner, 2026-09-15)*

**Retires** 2quinte's circular roll as a gesture, and with it **A8** entirely.

> *"One touchpoint idle on object && second touchpoint inside or outside any object &&
> delta position y → depth translation control (= no change vs. current build). One
> touchpoint idle on object && second touchpoint inside or outside any object && delta
> position x → roll rotation control. This will remove the conflict and decision lag
> between yaw/pitch and roll and the jump on roll that we have currently due to all being
> controlled by the one touchpoint."*

### ⭐⭐⭐ THE AMBIGUITY IS DISSOLVED BY MOVING THE GESTURE, NOT BY DECIDING BETTER

Yaw/pitch is **one** touchpoint; roll is **two**. They stopped being the same hand shape,
so **nothing has to tell them apart** — and everything that existed to do so is gone:

| retired | why it existed |
|---|---|
| 2quinte's **circle fit** (Hyper) | to recognise a circle among drags |
| `rollAngle`, the 60° **commit threshold** | to decide when the circle was certain |
| the **provisional yaw/pitch** before the commit | because the decision took 60° of arc |
| **A8's rebase** to the circle's start | to undo yaw/pitch the user never asked for |
| the `lastRollDeg` baseline | to turn an absolute swept angle into an increment |
| ⛔⛔ **the JUMP** | the unavoidable cost of all of the above |

⭐⭐ **`METHOD`, and this is the second time it has paid on this exact row**: *when a rule
needs a window to decide, suspect the question.* A6 needed a window to ask *"are these two
travels equal?"*; 2quinte needed 60° of arc to ask *"is this a circle?"*. ⛔ Both were
answered by **changing the gesture** so the question never arises.

### The rules, in full

| touchpoints | the one on the object | the second one | rule |
|---|---|---|---|
| 1 | moving | — | **2bis** yaw/pitch |
| 2 | **moving** | anything | **rule 6** translate — the holder wins every tie |
| 2 | **STILL** | **x** moves | ⭐ **A12 roll**, about the gravity frame's horizontal depth axis |
| 2 | **STILL** | **y** moves | **A10 depth**, unchanged |
| 2 | STILL | neither | nothing |

⭐ The second touchpoint may be **inside or outside any object** — outside every object, or
on the **same** object the holder has. ⚠ A touchpoint on a **DIFFERENT** object is
deliberately excluded: that is §4 rule 5 / 6bis / 6ter's configuration and must stay
reachable.

### ⭐⭐ It only works because the deadband is PER AXIS

A11's bands break out **independently**, so the second finger's mostly-horizontal drag is
**pure roll** and its mostly-vertical drag is **pure depth**. ⛔ With one shared `MOVING`
flag for the whole touchpoint — or with a radial band — a drag that is 95% horizontal would
still carry its 5% of vertical into depth, and the object would creep away while you rolled
it. ⭐ There is a counter-example vector for exactly that.

⚠ **So A11 and A12 are load-bearing for each other**, and neither can be reverted alone.

### The gain

`gainRollDrag` — **degrees of roll per MILLIMETRE** of the second touchpoint's horizontal
travel. ⛔ Millimetres, rule 3. Default **2 °/mm**, so a 45 mm drag rolls the object 90°.
⚠ A guess, with a slider, and on this project's record almost certainly too small.

⚠ **SIGN**: dragging right rolls clockwise on screen. An arbitrary choice between two
self-consistent conventions — exactly like the orbit inversion, where no amount of
sign-checking can tell you which a hand expects.

### ⚠ What is kept, and why it is not deleted

`roll.ts` (the Hyper circle fit, 40 vectors), `Recognizer.rebaseOnRollCommit` and the pose
history are **left in place and unwired** — the same status as `shake.ts` and
`anchor_rotate.ts`. ⭐ `METHOD`: *retractions are kept on purpose*, and deleting tested
machinery to satisfy a lint is how a project loses work it later needs. `rebaseOnRollCommit`
was made **public** so the compiler does not call it dead; A8's three vectors now drive it
explicitly and still prove the mechanism, while no longer claiming the recognizer calls it.

⛔⛔ **A TRAP FOR `IN5`, because no test can express it**: `rollAngle`, `gainRoll`,
`rollStepDistance`, `rollReleaseDistance`, `rollFilterMinCutoff` and `rollFilterBeta` are
still **read by `roll.ts`**, so `config_debt.test.ts` sees them as used — and they are
**off the gesture path**. ⚠ Do not spend a device session measuring them unless the
circular roll comes back.

---

## A13 — ⭐⭐⭐ ONE TOUCHPOINT **TRANSLATES**; A SECOND ONE HELD STILL **ROTATES** *(owner, 2026-09-16)*

**Supersedes** §2 rule 2bis's and §4 rule 6's touchpoint assignments — it swaps them.

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

### ⚠⚠ A RESEMBLANCE THAT MUST BE WATCHED ON THE GLASS

⛔ **`IN4` records a device verdict that looks like this rule and is not.** A `STATIONARY`
latch **taken at press** was overturned by a hand, first try:

> *"Move the second finger, let it settle, and the object ROTATED as though the finger were
> not there."*

⭐ The lesson recorded then was the distinction between the signals: whether a finger is
DOWN is discrete, deliberate and visible; whether it is MOVING was *"a noisy, continuous
reading"*. ⛔ **A13 keys a mode on exactly that noisy reading** — deliberately, on the
owner's instruction, and with two things that were not true in September's build:

* it is read **live, every frame**, never latched; and
* `MOVING`/`STATIONARY` is now a **position deadband** (A11), not a speed test — the
  formulation that made `STATIONARY` unreachable is gone.

⚠ **The device pass must look for MODE FLICKER directly**: hold a part, rest a second finger,
drag — and watch whether it ever slips from rotate into translate. `restConfirmMs` (30 ms)
is the number that absorbs it, and `motionDeadbandMm` the one that sets how much wobble a
resting finger is allowed.

### ⛔⛔⛔ CORRECTION — IT READS **PRESENCE ALONE**, AND THE DEVICE SAID SO TWICE

> *"The issue is still here: if I transition quickly there is a translation then a rotation,
> if I transition slowly there is directly a rotation."*

⭐⭐ **THE TIMING SIGNATURE IS THE WHOLE DIAGNOSIS.** A finger **placed quickly skids as it
lands** — the reported centroid slides while the contact area grows — so it read `MOVING`
for as long as the landing took, and the mode followed it. Placed **slowly** it never left
its band, so the mode was right at once. ⛔ **Nothing about the gesture differed; only the
landing did**, and a mode must not depend on how briskly a finger arrives.

⛔⛔ **THE CELL WAS MINE, NOT THE OWNER'S.** The four rules do not name *both fingers
moving*; the section above resolved it as `TRANSLATE` — *the holder wins every tie* — and
that was the defect. It is now **`ROTATE`**: a second touchpoint being **DOWN** is the whole
input, whatever it is doing.

⛔⛔⛔ **AND `IN4` RECORDED THIS VERDICT ALREADY, ON 2026-09-14**, when a mode keyed on the
anchor's `STATIONARY` state was overturned by a hand, first try. The lesson written then is
the one that applies now:

> *`MOVING`/`STATIONARY` is a NOISY, CONTINUOUS reading … whether a finger is DOWN is
> neither: it is discrete and deliberate, it changes only when a person decides it does, and
> it is the one thing they can see.*

⚠ **The section above FLAGGED this resemblance as the thing to watch** — *"the device pass
must look for mode flicker directly"* — and then shipped the version that had it. ⭐ Naming
a risk is not the same as not taking it.

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

---

## A14 — ⭐⭐⭐ A **LIFT-AND-REPLACE** OF THE SECOND TOUCHPOINT IS ONE GESTURE *(owner, 2026-09-16)*

**Amends** `A13`'s *"second absent → translate"*, which was correct and incomplete.

> *"1 — one touchpoint on object → it translates → second touchpoint pressed on screen
> outside any object → object immediately rotates → everything is OK.
> 2 — …second touchpoint is released then pressed on screen outside any object and I **wait**
> to input delta position the first touchpoint → first object rotates → everything seems OK.
> 3 — …and I **immediately** input delta position the first touchpoint → first object
> continues to translate for a while then rotates → this is the issue, and cases 2 and 3
> differ by timing of the input."*

### ⭐⭐ THE DIAGNOSIS: THE MODE LOGIC WAS NEVER WRONG

Between the lift and the press there is genuinely **one touchpoint down**, and `A13` says one
touchpoint TRANSLATES. ⛔ So the object translates for exactly as long as the swap takes —
and a lift and a replace is **150–300 ms of hand**, which is very visible.

| case | during the swap | what is seen |
|---|---|---|
| **1** — no lift at all | no interval exists | correct |
| **2** — the holder WAITS | interval exists, holder still | nothing to see |
| **3** — the holder KEEPS MOVING | interval exists, holder moving | ⛔ **it translates** |

⭐⭐ Cases 2 and 3 differ **only** by whether the holder happens to be moving during that
interval — which is precisely the owner's *"cases 2 and 3 differ by timing of the input"*,
and it is the observation that located the defect.

### ⭐⭐⭐ So the RULE was right and the GESTURE MODEL was wrong

**A lift-and-replace is ONE intention.** Dropping to one-touchpoint behaviour in the middle
of it is the artefact. ⛔ A second touchpoint therefore stays **HELD** for
`secondTouchGraceMs` after it lifts, and a replacement inside that window is continuous.

⭐ **The grace is keyed on a LIFT** — discrete, deliberate and visible — and never on a
motion state. ⚠ That is the rule the previous round of this defect cost us
(*a MODE may be keyed on PRESENCE; never on MOTION*), and it is honoured here rather than
quietly re-broken.

⚠ **It counts a lift of ANY other touchpoint**, whatever role it held: outside every object,
on the same object, or **on a different object** — which is the owner's case 3, where the
second finger was holding a second part.

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
readout now prints the mode, the touchpoint counts, and how much grace is left:

```
  depth=1.42m [0.02–3.0]  ROTATE obj=1 out=1 2nd  ready X→roll
  depth=1.42m [0.02–3.0]  ROTATE obj=1 out=0 2nd~180ms
```
