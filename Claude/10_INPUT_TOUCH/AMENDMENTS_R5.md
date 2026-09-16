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

⭐⭐ **BUILT, but not where this amendment put it.** A9 asked for a deadband on each rule's
`dx`/`dy`; **`A11` made §1.1 itself a per-axis position deadband**, so the excess-only
travel is computed ONCE and every rule reads the same side of it. ⛔ Nothing consumes a raw
delta any more.

⭐ **What A9 got right, and it is why A11 is shaped as it is**: the three forms, and the
trap. A *hard* deadband is a jump traded for a jump; a *soft* one taxes every sample; only
the **residual** form — accumulate against a fixed anchor, emit the excess, charge the band
ONCE — keeps a slow drag intact. ⛔ And the vector that separates them asserts **continuity**,
because *"small deltas do nothing"* passes for the broken forms too.

⚠ **One thing A9 reasoned wrongly and the owner later corrected**: it argued FOR per-axis on
the grounds of cross-talk, then `IN12`'s dossier argued AGAINST it on the grounds that a
square band makes a diagonal drag travel 1.41× further. ⭐ The owner restored per-axis for a
reason neither had considered — **axis purity**, a corridor a radial band cannot give at any
radius. See `A11`.

⭐ **The full original text** is kept verbatim in
[`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md).

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

### ⚠ What per-axis costs, where it applies, and what it DELETED

⚠ The cost of a square band is that a **diagonal** drag travels 1.41× further before it
breaks out — real, small, and about ENTRY only. ⭐ It is applied in `motion.ts`, ONCE, so
every rule reads the same excess-only travel and nothing consumes a raw delta.
⛔ It **deleted** `stillSpeed`, `stillTime`, `moveEnterDistance`, `moveExitDistance`, the
reachability validator rule and `A9`'s separate band — four thresholds chosen to sit above a
measurement, replaced by one radius.
⭐⭐ **The three tables — the costs, the application points and the deletions with their
reasons — are in [`../../00_CORE/queue_notes/IN0.md`](../../00_CORE/queue_notes/IN0.md)**,
moved 2026-09-16.

### ⛔⛔⛔ THE BAND GATES **ENTRY INTO MOTION**, NOT THE MOTION ITSELF

⛔ A trailing anchor sits one radius BEHIND, so a **reversal** had to cross the whole dead
circle: measured at **5.0 mm and 88 ms** at 50 mm/s, against a follower whose entire time
constant is 7.6 ms — pure dead time, which no gain downstream can hide. ⭐ The fix is a
distinction, not a number: **a finger that has already proven it is moving needs no further
proof**, so the band gates the way *out of rest*, paid once per gesture, and a reversal now
costs one sample. ⛔ The STATE machine is untouched, so A10's depth gate reads what it read
before.
⭐ `METHOD`: *a threshold that guards a transition must not also tax the steady state.*
⭐⭐ **The report, the measurements and the before/after tables are in
[`../../00_CORE/queue_notes/IN0.md`](../../00_CORE/queue_notes/IN0.md)** — moved there
2026-09-16 when this file hit its cap. ⚠ The tell was a complaint about **fluidity** rather
than about speed or distance.

### ⛔⛔⛔ AND REST MUST BE REACHABLE WITHOUT FURTHER EVENTS

⛔⛔ §1.1 was driven by `pointermove`, and **a still finger emits none** — so the tracker
froze wherever the last event left it and `STATIONARY` was unreachable for the exact case the
rule is about. ⭐ A **tick** now advances the state machine from the render loop: a tick
decides a STATE and emits no travel, ever, or a dropped frame could move an object.
⭐ `METHOD`: *a threshold is only half a rule — the other half is what advances the clock*,
and *an asymmetry between two directions of the same test is about the EVIDENCE.*
⭐⭐ **The three device reports, the two wrong fixes that preceded it, and the boundary
round-trip defect are in
[`../../00_CORE/queue_notes/IN0.md`](../../00_CORE/queue_notes/IN0.md)** — moved 2026-09-16.

### ⚠ The one time term that survives, and exactly why

⛔⛔ **A pure position deadband chatters at its own boundary**, structurally: while the
finger moves, the anchor is dragged to sit **exactly on** the radius — so when the finger
stops it is resting ON the line, and the measured 0.761 mm of noise straddles it. Roughly
half of all samples would read *outside*. ⚠ A bigger radius does not help; the anchor
follows it out.

⭐ So `restConfirmMs` confirms **only the transition back to `STATIONARY`**. It is not a
settle timer, it is not on the path the owner complained about, and the deadbanded delta
never waits for it.

### ⭐⭐ The carried lesson

⛔⛔ **This is the FOURTH formulation of §1.1 and the first three all broke on a real
pointer** — accumulated travel (a random walk), instantaneous speed (blind to a creep), and
speed over one sample pair (~95 mm/s at rest, so STATIONARY was unreachable). ⭐ Each fix
made the NUMBER better without making the SHAPE right; a displacement deadband needs no
threshold chosen above a measurement.
⭐⭐ **The full table and the sequence are in
[`../../00_CORE/queue_notes/IN0.md`](../../00_CORE/queue_notes/IN0.md)**, which is the most
instructive file in the project.

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

---

## A15 — ⭐⭐⭐ A HOLDER THAT IS NO LONGER **UNDER ITS OBJECT** GIVES THE SELECTION UP *(owner, 2026-09-16)*

**Amends** §4's role latch — first time, and on a **discrete** event only.

> *"On depth translation, when the second touchpoint is released, the first touchpoint
> should fire a raycast: if the raycast hits the same selected object, translation of the
> selected object continues as currently wired, if the raycast hits nothing or another
> object (it means the previously selected object is no longer under the finger which used
> to control it), at the next input event (delta position of one only touchpoint or second
> touchpoint pressed, etc.) the object shall be unselected and the state shall switch to
> whatever the new input configuration is: for example orbit of camera if the touchpoint is
> outside any object and delta position is the new event, rotation of the new object if the
> second touchpoint is pressed on a new object as the new event, etc."*

### ⛔⛔ The hole is GEOMETRIC, not accidental

`A10` moves the object **along the view direction while the holder holds still** — that is
the rule, not a side effect — so past some distance **the object is simply not under the
holder any more**. ⛔ §4 latches a role for the touchpoint's lifetime, so that finger went
on carrying an object it was visibly no longer touching.

### ⭐⭐ Why a RAYCAST at a LIFT, and not a test per frame

⛔ Re-deciding a role continuously is what `IN2`'s latch exists to prevent, and this project
has shipped that defect **twice** — `METHOD`: *a mode may be keyed on PRESENCE; never on
MOTION.* ⭐ A lift is presence: discrete, deliberate, visible, and the same class of evidence
`A14`'s grace uses. One ray, one moment, at the second touchpoint's release.

⚠ It fires on **every** second-touchpoint release while something is held, not only after a
depth drag: the ray is the whole test and answers `BOUND` for every other rule. ⛔ A *"was
that depth?"* flag can be wrong where a ray cannot.

### ⭐⭐⭐ The consequence is DEFERRED, and that is the owner's second requirement

The binding is marked dead and **nothing happens**: no jump, no deselect, no camera move.
⛔ Only at the **next input event** does the selection drop, every live touchpoint re-latch
from what is under it now, and the configuration re-resolve. ⭐ `METHOD`: *acting is
irreversible.* At the lift the user has given no new instruction.

| the next event is… | what happens |
|---|---|
| a delta position, finger over empty space | selection dropped → the finger is `OUTSIDE` → **§2 rule 1, orbit** |
| a delta position, finger over another object | selection dropped → it carries **that** object |
| a second touchpoint pressed on a new object | selection dropped → the new pair resolves by the §4 table |
| the orphaned holder lifts | dropped ⛔ **with no §1.3 verdict** — see below |

⛔ **The lift runs NO release verdict**, and the exclusion is the point: a flick-to-align or
a double-tap belongs to a finger that was still on its object. Running one here would align
— or evict a constraint on — an object the user stopped touching and never aimed at.

### ⭐⭐ How it meets A14, and why they cannot fight

`A14` keeps a second touchpoint *held* for `secondTouchGraceMs` after it lifts. ⭐⭐ The
raycast **partitions** the two: holder still on its object → A14's grace, unchanged; holder
no longer on it → there is no gesture left to preserve, because the finger A14 protects is
not touching the thing it was moving. ⚠ Same shape as `A10` and rule 6 partitioning on the
holder's stillness — nothing to arbitrate over time.

### ⛔⛔ AND THE ORBIT CENTRE DOES **NOT** MOVE — owner, on the spot

> *"Orbit center: same as previous yellow point."*

⚠ I had built the opposite and it was overruled the same hour. My reasoning: a touchpoint
that pressed on an object never let rule 1 pick a barycentre, and rule 1 chooses its centre
from the ray of the finger that STARTS the orbit — which, here, is starting now. So the
collection retargeted through the same `orbitCentreGraceMs` deferral a real press uses.

⭐⭐ **The owner's rule is the one `resetCamera` already states**: *home is the last yellow
target, not the origin.* The centre is **the thing the user has been orbiting**, and it does
not change because a selection ended — a gesture that ENDS must not retarget the camera.
⛔ There is deliberately no centre code in the collection. The marker does not move.

### What it costs, stated

⚠ **A selection can now end without the user lifting the finger that made it** — the intent,
but a new way for a gesture to end, so the HUD prints `⛔ORPHANED(next input unselects)`.
⛔ No new tunable: a raycast has no threshold.
⭐ **What was built, what it composes with, and the two mutants it was falsified against are
in [`../00_CORE/queue_notes/IN8.md`](../00_CORE/queue_notes/IN8.md).**
**⛔ A DEVICE LOOK IS OWED.**


---

## A16 — ⭐⭐⭐ FORK C: A SECOND TOUCHPOINT **TAPPED** TOGGLES THE ONGOING DRAG *(owner, 2026-09-16)*

**Adds** a third reading of §2/§4 to `D26`'s flag — it amends no clause, forks A and B are
untouched, and it is reachable as `?touchpointAssignment=2`.

> *"Second touchpoint tapped anywhere: toggle between the behaviors of fork A and fork B …
> it does not change the fork … for one single ongoing touchpoint. Second touchpoint pressed
> (not tapped): same behavior as current (depth translation, roll, two touchpoints on two
> objects translate their respective objects, etc.)."*

⛔⛔ **IT IS NOT AN INVERSION, WHICH IS WHY IT IS A FORK AND NOT A SETTING**: A and B compute
the mode from **presence**, C from a **discrete tap** — which leaves a held second finger
free to mean only what it already means. ⭐⭐ So **fork C cannot have the defect `A14`
fixed**: there is no lift-and-replace gap for the mode to fall through.
⭐ The toggle lives on the **grip** and dies with the gesture — a *second* touchpoint
presupposes a first — which is *"for one single ongoing touchpoint"* read literally.
⚠ **THE TRADE**: a gesture starts as `TRANSLATE`, so **rotation costs a tap every time**.

⛔⛔ **A DOUBLE TAP IS NOT TWO SINGLE TAPS, AND THE DISCRIMINATOR IS THE TIME BETWEEN THEM**
*(owner, 2026-09-16, correcting the first build the same day)*. It toggled on **every** tap
as it landed, so a double tap toggled **twice** and the double-tap gesture could never form.
⭐⭐ A single tap is now **held for `doubleTapWindow` and cancelled if a second arrives** —
the classic single-vs-double-click answer, fired from the render loop because what is awaited
is the *absence* of a second tap.
⭐ **Unity was checked at the owner's instruction**: its parameter is the inter-tap delay,
which this project already had — but its own `Tap` fires immediately and does **not** wait,
so the deferral is the application's to add. ⚠ The comparison table and the citation are in
[`../00_CORE/queue_notes/IN13.md`](../00_CORE/queue_notes/IN13.md) and `PROVENANCE.md`.
⭐⭐ **AND IT RETIRED A RULE RATHER THAN ADDING ONE**: the first build had to *consume* a
toggling tap so two toggles could not reset the camera. Once a double tap is not a toggle at
all, the gestures stop overlapping and a double tap keeps its forks-A-and-B meaning.
⚠ **THE COST**: the toggle lands `doubleTapWindow` (300 ms) after the tap, with a slider.
⛔ ONE constant, shared with §1.3 — two would leave a tap that is neither single nor double.

⛔⛔ **AND THE TOGGLE PICKS THE SECOND FINGER'S AXIS TOO — DEPTH *OR* ROLL, NEVER BOTH**
*(owner, 2026-09-16)*: *"depending on which is toggled, the second touchpoint shall only
control depth translation by delta position y or roll by delta position x (not both).
Switching between the two shall indeed require the tap."*

⭐⭐ **THE PAIRING IS BY KIND, AND IT IS WHAT MAKES ONE TOGGLE ENOUGH.** `TRANSLATE` pairs
the holder's screen-plane drag with the second finger's **depth** — both translations — and
`ROTATE` pairs yaw/pitch with **roll**. So the tap answers a single question, *am I
translating or rotating?*, and both fingers follow the same answer.
⛔ Forks A and B keep `A12` exactly: x and y live at once, kept independent by `A11`'s
per-axis bands. The narrowing is fork C's alone, and a vector asserts that containment.
⚠ **WHAT IT COSTS**: in fork C a roll and a depth push cannot be interleaved without a tap
between them. ⭐ That is the point — no diagonal can do half of each by accident — and it is
what a hand has to weigh against `A12`'s two-axes-at-once.

⚠ **One case is left open on purpose** — a tap on a *different* object, already rule 5 /
6bis's configuration and `IN3`'s selection to define.
⭐ `modeFor` is the ONE place a held object's mode is decided, for all three forks, so the
branch is not in the wiring — `D23`: *breaking the mode selection in `scene.ts` reddens
nothing.* **⛔ A DEVICE LOOK IS OWED**, and the readout is the only way to see the toggle,
since in fork C no finger position reveals it →
[`../00_CORE/queue_notes/IN13.md`](../00_CORE/queue_notes/IN13.md).
