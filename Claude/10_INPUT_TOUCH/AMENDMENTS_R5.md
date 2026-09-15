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
