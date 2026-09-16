# `IN3` — rules 1–3 (one touchpoint)

**Status: NEXT, and UNBLOCKED** — `3D1` landed 2026-09-15, so the object model, the face
centres and the constraint stack all exist. ⛔ **`IN3` also CLOSES `3D1`**, which has no
visible behaviour of its own and therefore cannot be closed by a device look alone.

✅ The collision this dossier was opened for is **RESOLVED**, and so is the question it
raised: **eviction spares `MATE` entries** (`D13`). See the end.

## ⛔⛔ THE DOUBLE-TAP COLLISION — decide this before writing rule 2septies

**The spec (§1.4) makes a double-tap the ONLY way a constraint is ever evicted.**

**But since 2026-09-14 a double-tap ALSO resets the camera orbit**, anywhere on the
glass — on an object or not. That is the owner's call, and the reason is reachability:
the orbit can get stuck close in with an object filling the view, and in that state every
tap lands ON something. A reset that only listened to empty space would be unreachable
exactly when it is wanted.

⚠ So when `IN3` builds constraint eviction, one of the two has to give:

* the same double-tap does **both** — evict the constraint *and* reset the camera; or
* the reset moves to a gesture of its own (a triple tap, a two-finger double-tap, a
  button); or
* eviction moves instead.

⛔ **It must be decided, not discovered.** Today the reset fires on every `DOUBLE_TAP`
verdict in `scene.ts`, so whichever way it goes, the change is one branch — but if
eviction is written without looking here, the two will silently both fire and the user
will lose a constraint every time they straighten the view.

⭐ Note also that the tap history is **shared across every touchpoint** (`TapHistory` in
`recognizer.ts`, one instance in `scene.ts`). It was briefly split so object taps and
empty-space taps could not fuse; the owner overruled that — *"no discrimination inside or
outside any object"* — so a double-tap that straddles an object's edge counts as one
gesture, which is what a hand means by it.

---

## ✅✅ DECIDED 2026-09-15 — eviction is a FULL 360° ROLL *(owner, `D12`)*

> *"Replace double-tap in §1.4 by doing a full 360 degree roll rotation on the selected
> object."*

⭐ The reset did NOT move; **eviction** did. A double-tap now means exactly one thing — fly
the camera home — and the tap history stays shared across every touchpoint, as the owner
required. Spec amendment **A1**, at the top of
[`../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

### Why it is a good answer, in two sentences

⭐⭐ The gestures are now in different **modalities** — a discrete pair of taps against a
continuous swept circle — which is a far wider separation than two same-shaped gestures told
apart by where they land. ⭐⭐ And the **size of the gesture matches the size of the
consequence**: eviction destroys deliberate work, §1.4's eviction clause exists precisely
because a 2 mm accidental drag used to wipe an anchor, and a full turn cannot be performed by
accident — where a double-tap plainly can.

### ⛔ What `IN3` must implement, because A1 removed an exclusivity

Revision 5 had a constrained object IGNORE circles, so **2sexte owned every drag on a
constrained object**. It no longer does. Three consequences, all resolved in A1, plus one
that is not:

1. **2quinte is amended** — a constrained object **tracks** the circle without rolling.
   Ignoring it, as revision 5 says, would make the new gesture unreachable on the only
   objects it applies to.
2. **2sexte and eviction run in PARALLEL.** Both are one finger on a constrained object.
   Suppressing 2sexte whenever a path looked curved would make constrained rotation stutter,
   because fingers pivot about a knuckle and a hand arcs constantly. ⭐ The margin is wide:
   the detector commits at `rollAngle` = **60°** and eviction needs **360°**.
   ⚠ Open for the device: is the 2sexte rotation performed *during* the circle kept or
   rolled back when eviction fires? **Kept** is the better default.
3. ⛔ **The flick test must be skipped once a circle is TRACKED**, not only once a roll is
   applied. Otherwise a user who starts a circle, gets part way and releases with speed runs
   the flick test — and a flick on a selected object **pushes** `GRAVITY_ALIGN` or
   `WORLD_AXIS_ALIGN`. The hand reaching to REMOVE a constraint would add one.

### ⛔⛔ AND ONE QUESTION THAT IS STILL THE OWNER'S — it blocks writing eviction

**Does a full turn break MATES too?** §1.4 clears *the constraint stack*, and a `MATE` is a
stack entry, so as written the eviction gesture would disassemble every joint on that
object.

⭐ That may be exactly right and free: `DECISIONS.md` carries *"un-snap: what breaks a mate
on a touchscreen?"* as open, the predecessor's answer was *"un-snapping needs two hands"* —
**deliberately hard** — and a full turn is deliberately hard. ⛔ Or it is too much: clearing
an alignment and detaching an assembly are different intentions, and one gesture doing both
means a user tidying an alignment loses their assembly.

* **(a) one gesture, whole stack** — and the un-snap question closes with it;
* **(b) eviction spares `MATE` entries** — alignments only, and `3D3` keeps waiting.

⚠ It is recorded in [`../DECISIONS.md`](../DECISIONS.md) under *still the owner's to make*,
and `IN3` must not guess it.

### The tunable

`rollEvictDeg`, default **360**, **signed** accumulation so a reversal unwinds rather than
adds. ⛔ It lands WITH the code that reads it (`config_debt` refuses an orphan) and **with a
slider** — `IN5`: a guessed number has been wrong every time.

---

## ⚠ SUPERSEDED THE SAME DAY — eviction is a BACK-AND-FORTH, not a roll (`D15`, amendment A4)

⛔ **The 360° roll above is obsolete.** It was chosen while roll was FORBIDDEN on a
constrained object, so that channel was free and a full turn there could mean nothing else.
⭐ **`D14` reversed that**: the owner found the spec wrong — an object anchored on gravity
must still take roll when the camera has orbited to look **along** the gravity axis, because
there rolling about the view axis **IS** twisting about the anchor, and it is exactly the one
free DOF 2sexte exists to drive.

⭐⭐ **And 2sexte is DEGENERATE in that same pose**: its axis projects to a point, so *"the
delta component perpendicular to the axis as projected on screen"* has no value — every
screen direction is equally perpendicular, and the rule would turn the object by an arbitrary
amount in an arbitrary direction. The two inputs are **complementary charts over one DOF**,
each well-conditioned where the other fails, handed over on **ONE constant with hysteresis,
latched at press**. ⛔ Two independent thresholds would give either a dead band where the DOF
has no driver at all, or an overlap where it has two and the object turns twice as fast as
either rule intends.

⛔ With roll now carrying a real control, eviction had to leave that channel. ⚠ **720° was
considered and rejected**: a bigger number widens a margin without changing the KIND of
conflict, and pays for it with a fatiguing gesture during which the object visibly spins two
full turns. ⭐ *A different channel is the resolution; a bigger number is not.*

### What `IN3` implements for eviction

**A quick back-and-forth** — one touchpoint on the object, **≥ 2 reversals** inside a window,
each leg well above the measured **0.761 mm** noise floor. ⭐ It reuses the **sway's reversal
detector**, the only one on this project with a MEASURED false-positive rate: a per-sample
direction is noise, a still finger once fired 272 false kicks in 3 s, and it now reads
displacement over 60 ms and needs 3× the noise to claim a heading.

⛔⛔ **THE ONE THING THAT MUST NOT BE FORGOTTEN: skip the flick test once ONE reversal is
seen.** A shake is literally two flicks in opposite directions, so every leg matches the
flick signature by construction. Without the guard, a user shaking to REMOVE a constraint
gets 2ter or 2quater at release and **ADDS** one — after which two constraints leave zero
free rotational DOF and the part stops responding to drags entirely.

⚠ **Refuse audibly on a MATE-ONLY stack** (`D13`) — the gesture was aimed at something and
did nothing, and silence reads as a broken control that gets repeated. ⭐ **Stay silent on an
EMPTY stack**: nothing was aimed at, and a buzz for every shake of a free object is noise.

⛔ **Gate on `activeCount === 1`.** With a second finger down, rule 6 is translating the
object and a back-and-forth there is an ordinary drag.

⚠ Three tunables — `evictShakeReversals` (2), `evictShakeWindowMs`, `evictShakeLegMm` —
land WITH the code that reads them and **each ships with a slider**. ⭐ The whole safety of
this gesture is the gap between a shake and a corrective nudge, and that is a hand's
judgement, not a simulation's.

⭐ Full text: [`../../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../../10_INPUT_TOUCH/AMENDMENTS_R5.md), A3 and A4.

---

## 🔨 IN PROGRESS — the eviction shake detector is BUILT (2026-09-15, 15 vectors)

`src/input/shake.ts` · `tests/shake.test.ts` · engine-free, and **not yet wired to
anything**.

⭐ Built first because it is the newest thing in `IN3`, the most self-contained, and a hard
prerequisite: nothing can evict until something can recognise the gesture.

### ⛔⛔ The design decision that is NOT obvious: a circle is a back-and-forth

**A circle projects to an oscillation on EVERY axis.** A detector that counted reversals
would fire on a finger sweeping a circle — which is precisely the gesture `A3`/`D14` just
made legal on the objects eviction applies to. Spinning an anchored part to look at it would
destroy the alignment the user set.

⭐ So the detector is defined as **oscillation ALONG AN AXIS**, and how far the path strays
off that axis is part of what the word means — not a guard bolted onto an observed failure
(`METHOD`: *no heuristic pile-up*). The axis comes from the user's own first leg, so
"whichever the direction" holds.

### ⭐⭐ Falsified before it was trusted

The counter-examples are the point, and both guards were **shown to fail**:

| guard removed | what went red |
|---|---|
| straightness | ⛔ *a circle does not evict* and *a bowed back-and-forth is refused* |
| leg hysteresis | ⛔ *a corrective nudge does not evict* |

⭐ Seven of the fifteen vectors are things that must **NOT** fire — a circle, a corrective
nudge, a single stroke, one reversal, a slow fidget, a bowed path, and **ten seconds of a
still finger at the measured 0.761 mm noise floor**. That last one is `sway.ts`'s lesson
paid forward: a per-sample direction is noise, and a still finger once produced 272 false
kicks in 3 s.

### What it exposes, and the one thing that must not be forgotten

`suppressesFlick` goes true on the **FIRST** reversal, not on the completed shake — and a
vector asserts it arms **before the path ends**. ⛔ A shake is two flicks in opposite
directions, so a user who abandons one mid-way releases at speed, the flick test passes, and
2ter or 2quater **pushes** a constraint instead of removing one. The recognizer must read
this.

### Four tunables, all placeholders, all needing a slider

`evictShakeReversals` (2) · `evictShakeWindowMs` (600) · `evictShakeLegMm` (8) ·
`evictShakeStraightness` (0.4). `validateGestureConfig` refuses a leg that does not clear
3× the MEASURED `pointerNoiseMm`, a reversal count below 2, and a straightness of 1 or more
— at 1 a circle passes, and the guard would be decorative.

⛔ **None is measured.** The whole safety of this gesture is the gap between a shake and a
corrective nudge, and `IN5`'s record is three-for-three that a guessed number is wrong.

### ⛔ What remains in `IN3` — this is one piece of it

1. **Rule 2bis's missing PRECONDITION** — *an empty constraint stack*. The object model now
   exists, so the rule can finally ask.
2. **2sexte**, constrained rotation about the remaining DOF, with **A3's handover** —
   `anchorHandoverCos` plus hysteresis, latched at press, and 2sexte SUPPRESSING where its
   axis projects to a point.
3. **Roll driving an anchored object's free DOF** (A3), about the CONSTRAINT axis.
4. **2ter / 2quater** pushing constraints on a flick, and **the flick skip** above.
5. **The triangle → `FaceId` mapping** at the render seam.
6. **Wiring `scene.ts` to the object model** — which is what CLOSES `3D1`.

---

## 🔨 IN PROGRESS — 2sexte and A3's handover are BUILT (2026-09-15, 25 vectors)

`src/input/anchor_rotate.ts` · `tests/anchor_rotate.test.ts` · engine-free, **not yet
wired**. With `shake.ts` that is 40 vectors of `IN3` logic standing ahead of any renderer.

### ⭐⭐ The composite property: THE ANCHOR SURVIVES

Every rotation this file produces is about the **constraint axis**, never the camera's, and
the vectors assert the consequence directly: a normal that starts ON its target axis is
still on it afterwards — after one drag, after **forty** (so it is not a small-angle
accident), and after a roll.

⛔⛔ **And it carries the counter-example A3's wording exists to prevent**: rotating about
the VIEW axis instead — what free rotation and 2quinte both do — is asserted to swing the
anchored normal **more than 30°** off target with the camera at the front. ⚠ The very next
vector asserts the *same* naive rotation is **harmless** looking down the axis, which is
precisely why revision 5's blanket ban was wrong and `D14` corrected it.

### ⭐ The mapping carries its own degeneracy test, derived rather than detected

The near side moves along `axis × (−viewAxis)`, whose length is `sin α`. ⛔ That vanishes
**exactly** when the axis points at the camera — so "2sexte is undefined" and "this returns
`null`" are the *same case*, falling out of one expression instead of being caught by a
separate guard that could disagree with it.

### ⭐⭐ A FINDING THE VECTORS PRODUCED, and it bears on `anchorHandoverCos`

The near side's screen excursion per radian is `r·sin α`. §2 2sexte specifies a **gain in
rad/mm**, not a tracking factor — so the drag turns the object at the *same rate* whatever
the camera does, while the motion that rate produces **fades to nothing** as the axis swings
toward the camera.

⛔ **So the drag does not fail suddenly at α = 0; it goes quiet over a range before it.**
The honest tracking mapping would be `1/(r·sin α)` rad/mm, which DIVERGES there — a much
stronger statement of the degeneracy than *"the projection is a point"*.
⚠ **`anchorHandoverCos` must hand over while the drag still produces VISIBLE motion**, not
at the point where it becomes undefined. ⭐ That is a device question of exactly the kind
this project has lost three times to a guess.

### ⛔⛔ THREE FIXTURES OF MINE WERE WRONG, IN ONE FILE, AND EACH LOOKED LIKE A CODE DEFECT

⚠ **Mistake shape 5 again** — *my own fixtures*. Recorded in full because the shape is the
finding, not the three mistakes:

| what I asserted | why it was wrong |
|---|---|
| the drag angle shrinks as the axis turns toward the camera | `sin α` scales the near side's **excursion**, not the **angle**. The spec's gain is rad/mm |
| the sign reverses when the camera orbits to the back | from behind, "screen right" is the opposite WORLD direction **and** the near side is the opposite FACE — the two reversals cancel |
| a marker at `[0,0,1]` shows the `sin α` fade | that point sits on the axis's EQUATOR, radius 1 whatever the camera does. The **near point** is what has radius `r·sin α` |

⭐ And a fourth, smaller: the `sin α` law is **infinitesimal**, so a finite 0.2 rad test
angle reported 0.502 against 0.500 — the chord's second-order term. ⭐ *State the limit a
law holds in, and test it there.*

⭐⭐ **Each was caught by deriving the geometry independently of the product code**, never
by adjusting an expectation until it went green. ⛔ That distinction is the whole of
`METHOD`'s *the instrument is a suspect* — and twice here the "failing" test was the
instrument, with a correct implementation one keystroke from being "fixed".

### ⭐⭐ And one property worth keeping for its own sake

**The same world rotation results from the front and from the back**, so the control
**survives an orbit instead of inverting** — like a real turntable, where pushing the near
edge to your right spins it the same way wherever you stand. ⚠ A user would notice
immediately if that were missing, and no magnitude test would.

### ⛔ No tunable was added, deliberately

`anchor_rotate.ts` holds none, following `screen_rotate.ts`'s precedent — *one constant,
one place*; the caller passes the gain. ⚠ `anchorHandoverCos` and
`anchorHandoverHysteresis` land **with the wiring that reads them**, or
`config_debt` would be carrying two numbers that change nothing.

### ⛔ What remains in `IN3`

1. Rule **2bis's PRECONDITION** — *an empty constraint stack*;
2. **2ter / 2quater** pushing constraints on a flick, with the flick skip wired to
   `ShakeDetector.suppressesFlick`;
3. the **triangle → `FaceId`** mapping at the render seam;
4. **wiring `scene.ts` to the object model** — which is what CLOSES `3D1`;
5. the two handover tunables, **each with a slider**.

---

## 🔌 `scene.ts` WIRED TO THE MODEL (2026-09-15) — and what that leaves

⭐ The wiring is recorded in [`3D1.md`](3D1.md), since it is `3D1` that it closes. In
`IN3`'s terms: **the render layer now writes the object model**, which is the prerequisite
for every remaining rule in this row.

⭐⭐ It also landed [`src/input/display_pose.ts`](../../../src/input/display_pose.ts) — the
whole chain `SWAY ∘ FOLLOW ∘ model` as ONE expression, engine-free and vectored, which is
what the `3D1` row asked for **before** the rewiring rather than after. Its RIGIDITY vector
had never existed: the sway claimed in prose that the block *"both orbits and spins"*, and
both half-implementations pass a pairwise-distance test, so only an orientation assertion
separates a block from a crowd.

### ⛔ Still to do in `IN3`

1. **Rule 2bis's PRECONDITION** — *an empty constraint stack*. ⭐ Now askable: the stack is
   on the object.
2. **Face selection** — the triangle → `FaceId` mapping at the render seam. ⚠ Do it from
   the picked **normal**, not from `pickResult.faceId`: the triangle ordering is an engine
   detail, the normal is geometry. The six faces already exist on every box.
3. **2ter / 2quater** pushing constraints on a flick, with the flick skip wired to
   `ShakeDetector.suppressesFlick`.
4. **Eviction** — wire `ShakeDetector`, sparing `MATE` entries (`D13`), refusing audibly on
   a mate-only stack.
5. **2sexte and the A3 handover** — `anchor_rotate.ts` exists; it needs
   `anchorHandoverCos` + `anchorHandoverHysteresis`, **each with a slider**, latched at
   press.
6. ⛔ **The device pass**, which closes both `IN3` and `3D1`.

---

# ⭐⭐ THE ROTATION GOT A FRAME, A REBASE, AND ONE DEFECT STILL OPEN *(2026-09-15)*

Three changes landed on rule 2bis and 2quinte in one session, all from the glass. ⚠ None
of them is the PRECONDITION this row still owes (§1.4's empty constraint stack).

## `A7`/`D18` — every object gesture stands on a GRAVITY FRAME

> *"A delta position on x shall rotate the object on yaw along the gravity direction, a
> delta position on y shall rotate the object on pitch along the x axis, a roll shall rotate
> the object on roll along the projection of the camera depth axis orthogonal to the gravity
> direction."*

⭐ `src/input/gravity_frame.ts` builds `{right, up, depth, towardGravity}` from the view
axis and gravity, and `screen_rotate.ts` now takes it instead of a `ScreenFrame`.
⛔ **The two are deliberately DISTINCT TYPES**, so the compiler stops them being
interchanged — `anchor_rotate.ts` still wants the TRUE view axis, and will not accept the
flattened one by accident.

⛔⛔ **The argument is ORTHOGONALITY, not tidiness.** About the camera's own axes the view
axis gains a vertical component as the camera tilts, so roll stops being independent of yaw
and **no gain can separate them**. ⭐ One basis then serves rotation, translation and depth
at once: *the axis you push along is the axis you can turn about.*

⚠ **An owner correction worth keeping.** I claimed the roll would *"no longer follow the
finger's circle when the camera is tilted"*. The owner: *"I don't think it is quite true: we
do not project the delta position so the input is still a circular movement, we only modify
the axis of rotation."* ⭐ Correct — the gesture is unchanged; only the PICTURE changes.

⛔ One sign defect, caught by a vector rather than a finger: `cross(depth, up)` gives a
NEGATED right. It is `cross(up, depth)`, and the vector that caught it compares against the
camera's own right.

## `A8` — a roll REBASES to the start of its circle

A circle is not read as a roll until `rollAngle` (60°) of arc. Until then §1.3 applies the
continuous rule **provisionally**, and that rule is 2bis — yaw and pitch. ⛔ So the roll
began from a pose nobody asked for, which matters most precisely when it matters at all: a
user rolling to preserve an alignment got the alignment quietly broken first.

⭐ **The mechanism was already in the spec.** §1.3 defines provisional motion *with
rollback*; it simply only ran it at release, for the flick test. A roll committing mid-drag
is the same situation one transition earlier, and takes the same answer: **restore, then
apply.**

⛔⛔ **It rebases to the FIT WINDOW's start, not to the press.** A hand may drag in a
straight line and only then begin to circle; that drag is a yaw the user asked for, it is
not part of the evidence for a circle, and undoing it would be a second defect wearing the
first one's clothes. `RollDetector.fitWindowStart` publishes where the evidence begins, and
the recognizer keeps a pose history bounded by AGE — because the fit window is sized in
PATH LENGTH, and a slow circle spans more samples than a fast one.

⚠ **The object jumps at the commit**, by the whole swept angle. That is the trade, not a
glitch: it replaces exactly as much unasked-for yaw/pitch with the roll the finger drew.

## ⛔ `A9`/`IN12` — still open: there is no DEADBAND

Rule 2bis integrates the RAW per-event delta and `pointerNoiseMm` is **0.761 mm measured**,
so a still finger turns a held object. ⭐ Queued as its own row with the trap written down:
a *hard* deadband is a jump traded for a jump. → [`IN12.md`](IN12.md)

## ⭐⭐ And one report that DID NOT SURVIVE — the most useful entry in this dossier

*"You destroyed the rotation around the gravity axis and orthogonal to gravity: the rotation
came back to the axis of the screen view plane."* ⛔ It had not. Every part of `A7` already
had green vectors — the frame is orthonormal, `up` is the world vertical, the wiring
compiled — and ⚠ **none of that is the same claim as *a horizontal drag yaws about
gravity***, which is what a hand judges.

`tests/a7_wiring.test.ts` composes the frame with the rotation and asserts the axis that
comes out the far end, at level / 45° down / 72° down / bottom ring, with counter-examples
so the claim is distinguishable from its opposite. The owner withdrew the report:
*"it's alright: the logic is right."*

⭐⭐ **Mistake shape 4 — *a composition nobody computed* — can aim at a CORRECT piece of
work as easily as a broken one**, and it costs the same either way until someone measures
the composition. `METHOD`: *a composition is a thing to MEASURE, not an emergent property.*

---

# ⛔⛔ THE ROLL'S COMMIT DROPPED ITS OWN ANGLE — found by finger, 2026-09-15

> *"In rotation, when I switch from yaw/pitch to roll or from roll to yaw/pitch, there is a
> big jump at one point: is it due to accumulated delta position or quaternion gimbal or
> just the decision being switched from one to another but anchoring on a previous
> quaternion which is now far away?"*

⭐⭐ **The third guess, and it is worth recording that the owner named the cause from the
feel alone.** Not accumulated delta, not gimbal — a re-anchor onto a pose that was by then
far away. ⚠ And worse than `A8` intended.

## What `A8` promised, and what the code did

`A8` rebases the object to the pose it held when the circle's evidence began, so the
yaw/pitch swept before the 60° commit is undone. Its own documentation says the object
*"jumps by the whole swept angle, which 2quinte then applies from the rebased pose"*.

⛔⛔ **2quinte did not apply it.** The scene applies roll as a per-frame INCREMENT:

```ts
screenRollRotation(cur, grip.frame, grip.rec.rollAppliedDeg - grip.lastRollDeg)
```

and `grip.lastRollDeg` had been tracking `rollAppliedDeg` on **every** move, including all
through the uncommitted phase. So at the commit frame the increment was **one frame's**
worth, and roughly 60° of swept roll was silently dropped — while the yaw/pitch it was
supposed to replace had just been undone.

⭐ Net effect on the glass: a large backward snap with nothing put in its place. Exactly
the *"big jump at one point"*.

## The fix

Zero the baseline once, on the commit edge, so the increment is the **full** swept angle
applied from the rebased pose — what the object loses in yaw/pitch it gains in roll.

⚠ **A visible step remains, and it is A8's designed trade**: yaw/pitch through 60° of arc
and roll through the same 60° are different orientations, and the commit chooses the one
the finger actually drew. ⭐ `rollAngle` is the slider that shrinks it — commit earlier and
there is less to replace. ⛔ It is no longer a snap to nowhere.

## ⭐⭐ The shape, for the third time on this row

`roll.ts` already carries a comment about *"big jumps when I switch from roll to yaw/pitch
or when I change roll directions"* — a stale `prevPos`, fixed earlier. The note there
says: **a difference means something only when BOTH ends of it are current.** ⛔ This is
the same defect one layer up: `rollAppliedDeg` was current and `lastRollDeg` was not.


---

## ⭐ CARRIED FROM THE QUEUE ROW, 2026-09-16 — verbatim

⚠ `QUEUE.md` is a front door and this cell had grown to an essay inside a table. ⛔ Distilled there to state + one lesson + this pointer; the full text is below, unrewritten, per `README.md` rule 2.

> 🔨 **IN PROGRESS.** ✅ **The eviction shake is BUILT** (2026-09-15, `src/input/shake.ts`, 15 vectors, engine-free, not yet wired). ⭐⭐ Its non-obvious decision: **a circle projects to a back-and-forth on every axis**, so the detector is defined as oscillation ALONG AN AXIS — without that, spinning an anchored part to look at it would evict, which `A3` made reachable. ⭐ Falsified before trusted: removing straightness reddens the circle vector, removing the leg hysteresis reddens the nudge. ⭐ `suppressesFlick` arms on the FIRST reversal, which is the flick guard A4 demands. ✅ **2sexte + A3's handover BUILT** (`src/input/anchor_rotate.ts`, 25 vectors): every rotation is about the CONSTRAINT axis, and *the anchor survives* is asserted directly — with rotating about the VIEW axis as the counter-example, swinging the normal >30° off target. ⭐⭐ **A finding for `anchorHandoverCos`**: the near side's excursion is `r·sin α`, so a rad/mm gain turns the object at the same rate while the motion FADES — the drag goes quiet over a range *before* it becomes undefined, so the handover must happen while it is still visible. ⚠ **Three of my own fixtures were wrong in that one file**, each looking like a code defect (mistake shape 5); all caught by deriving the geometry independently. ✅ **`scene.ts` WIRED to the object model** — see the `3D1` row. ⭐⭐ Also landed `src/input/display_pose.ts`: the chain `SWAY ∘ FOLLOW ∘ model` as ONE expression, engine-free and vectored, written BEFORE the rewiring as the `3D1` row demanded. Its RIGIDITY vector had never existed — both half-implementations pass a pairwise-distance test, so only an orientation assertion separates a block from a crowd. ✅✅ **`A7` AND `A8` LANDED 2026-09-15 and both are on the glass**: every object gesture now stands on a **GRAVITY FRAME** (`src/input/gravity_frame.ts` — yaw about the world vertical, pitch about the horizontal, roll about the view direction flattened onto the ground), and a roll **REBASES** to the start of its circle instead of keeping the yaw/pitch swept before the 60° commit. ⭐ `A7`'s composition is vectored END TO END in `tests/a7_wiring.test.ts` at four camera tilts — ⛔ which is what settled a report that the gravity frame had regressed: it had not, and the owner withdrew it. ⛔ **`A9`/`IN12` is the live defect instead**: no deadband on `dx`/`dy`, so a still finger turns a held object. ⛔ Still to do: 2bis's precondition, **face selection from the picked NORMAL** (not `faceId` — triangle ordering is an engine detail), 2ter/2quater + the flick skip, wiring the shake to eviction, the two handover tunables with sliders, and ⛔ **the device pass that closes both `IN3` and `3D1`**. ⛔ **It also CLOSES `3D1`**, which has no visible behaviour of its own. Three things it owns: rule 2bis's missing PRECONDITION (*an empty constraint stack* — an anchored object currently rotates freely and would silently break its own anchor), the triangle→`FaceId` mapping at the render seam, and the eviction gesture. ✅ **Four owner decisions landed 2026-09-15 and the row is fully unblocked** — `D12`/`D15` eviction is a **quick back-and-forth** (it left the double-tap, then left the roll channel too), `D13` it **spares MATEs**, `D14` **roll drives an anchored object's free DOF while 2sexte suppresses where it degenerates**, on ONE handover constant with hysteresis. ⛔ Non-negotiable: **skip the flick test once one reversal is seen**, or an abandoned shake ADDS a constraint. Amendments A1–A4 → [`queue_notes/IN3.md`](queue_notes/IN3.md)


---

## 🔨 2026-09-16 — THE FORK, AND `IN3`'s FIRST RULE IS WIRED

⭐ `D29`: three anchor-rule sets behind `anchorRules` (`?anchorRules=1`, or the menu's
`⭐ ANCHOR RULES` slider), so today's behaviour and `IN3` can be driven in one session.

| flag | fork | what it does |
|---|---|---|
| `0` | **A — `NONE`** | today's behaviour. No constraint created, consulted or cleared. ⭐ **The default** |
| `1` | **B — `IN3`** | §2 rules 1–3, under construction. What is wired is below |
| `2` | **C — `OWNER_TBD`** | ⛔ **inert**, and labelled inert on the HUD, until the owner specifies it |

⛔⛔ **IT IS A GATE, NOT AN INVERSION, AND THAT CHANGES THE FAILURE MODE.** `D26`'s flag had
two live paths differing by one inversion; here two of three forks create nothing, so
*"nothing happened"* is the **expected** outcome in both — and indistinguishable from a defect
without a readout. ⭐ So the HUD names the live fork, fork C says `inert` rather than falling
back silently, and the validator refuses anything but 0/1/2.
⚠ `IN3` is **not** the default: an unbuilt rule set as the shipped behaviour would make every
device session judge a moving target.

### ✅ BUILT: rule 2 — face selection, from the picked NORMAL

`src/core/face_pick.ts` · `tests/face_pick.test.ts` · **9 vectors**, engine-free.

⛔⛔ **NOT from `pickInfo.faceId`.** That is a TRIANGLE index: a box face is two of them, an
imported mesh face is arbitrarily many, and the ordering is a detail of however the geometry
was built — `3D4` would break it on the first import. ⭐ The **normal is geometry**, and it is
what the user aimed at: take the hit's surface normal and pick the face whose own outward
normal points most nearly the same way.
⭐ The comparison happens in **one frame**: the pick arrives in world, face normals are
stored local, and the pick is rotated by the object's inverse world orientation to meet them.
⚠ It returns the winning face **and its cosine** — a later rule may want to refuse a grazing
pick, and **nothing refuses one here**: handing back the evidence beats burying a threshold in
a function whose job is *which face*.
⛔ Degenerate inputs return `null`, never a default (`LESSONS_CARRIED` §6).

✅ **AND THE FACE IS DRAWN** — a thin emissive quad on the selected face
(`selected-face` in `scene.ts`). ⛔⛔ Without it rule 2 is **unjudgeable**: selecting a face
changes nothing visible until 2ter/2quater exist, so *"did it pick the face I aimed at?"* has
no answer on the glass, and every rule built on top would inherit that doubt.
⭐⭐ **Placed from the MESH's world matrix, not the model** — what the eye sees is
`displayPose = SWAY ∘ FOLLOW ∘ model`, so a highlight positioned from the model would lag by
the follower's time constant during every drag and by the sway's excursion after it.
⚠ Both guards have precedents in this file: `isPickable = false` (or the highlight would
intercept the picks that select a face) and **not** tagged `orbitCandidate` (or a readout
would move the barycentre it describes). ⭐ Rotated onto the face normal with the model's own
`shortestArc`, not a second Babylon-side definition of *turn this onto that*.

✅ **Also wired**: §3 rule 3 — a release unselects the face. ⭐ The stack is *preserved* by
construction, because it lives on the object; preserving it is not an action.

### ⚠⚠ MISTAKE SHAPE 5 AGAIN — MY OWN FIXTURE, CAUGHT BY A MUTANT

I wrote that the **180°** rotation case was *"the sharpest: the wrong direction gives exactly
the OPPOSITE face rather than a near miss."* ⛔ **It is the one case that proves nothing about
the frame direction**: a half turn is its own inverse, so `q` and `q⁻¹` rotate identically and
the wrong mapping passes it untouched.
⭐ Removing the conjugate reddened the **90°** case and the **arbitrary-angle** case, and left
the 180° one green. Both comments are corrected in place, and the 180° vector is kept for
what it does check — that a half turn maps each pick to the opposite face rather than a
neighbour.
⭐⭐ `METHOD`: *a guard that cannot fail is not a guard* — and the only way to learn which
guard is which is to break the product and watch which vectors notice.

### ✅ BUILT: 2bis's PRECONDITION — and the composition the spec never wrote

`src/input/drag_rule.ts` · `tests/drag_rule.test.ts` · **8 vectors**, engine-free.

⛔⛔ **§2 WRITES 2bis AND 2sexte AGAINST THE STACK, AND SAYS NOTHING ABOUT THE MOVEMENT
MODE** — the mode (`A16`) did not exist when it was written. That gap is now one table, in
one place:

| mode | stack | the drag |
|---|---|---|
| `TRANSLATE` | anything | **translate** |
| `ROTATE` | empty | **free rotation** (2bis) |
| `ROTATE` | one entry | **constrained rotation** (2sexte) |
| `ROTATE` | two or more | ⛔ **refused** — no free rotational DOF |

⚠⚠ **THE `TRANSLATE` ROW IS A CLAIM, NOT AN OMISSION.** An anchored object can still be
carried: §1.4's solver consumes **rotational** DOF, so an anchor says where an object POINTS,
not where it IS. ⭐ If a hand disagrees — if anchoring should pin a part in place — that is a
new decision, and the vector asserting it is what would go red when it is made.

⛔⛔ **AND THE UNWIRED BRANCH DOES NOTHING RATHER THAN THE WRONG THING.** `isDriven` separates
*recognised* from *driveable*: `CONSTRAINED_ROTATE`'s driver is built (`anchor_rotate.ts`, 25
vectors) and not wired, so a constrained object does not rotate and the readout **names the
rule that would have run**. ⭐ A fall-through to free rotation would silently break the anchor
the user set — §1.4's eviction clause exists to stop exactly that, and this is the same defect
arriving by a different door. ⚠ Without the distinction the HUD would say
`CONSTRAINED_ROTATE` while the object sat still, and a device pass would read that as a
defect in 2sexte rather than as work not yet done.

⚠ **It is not observable yet**, and that is worth saying plainly: nothing can PUSH a
constraint until 2ter/2quater exist, so every stack is empty and the table's first two rows
are the only reachable ones. ⭐ That is why 2ter/2quater come next — they are what makes this
rule testable by finger.

### ⛔ What remains in fork B

1. **2bis's precondition** — *is the stack empty?* Now askable, and the mode (`TRANSLATE`/
   `ROTATE`) has to meet it: a constrained object in `ROTATE` should get 2sexte instead.
2. **2ter / 2quater** — a flick pushes `GRAVITY_ALIGN` / `WORLD_AXIS_ALIGN`, then unselects.
   ⚠ And they now have to coexist with the movement mode: a one-touchpoint flick is also a
   translate-or-rotate drag.
3. **The flick skip** — wire `ShakeDetector.suppressesFlick`, or a hand shaking to REMOVE a
   constraint **adds** one.
4. **Wiring `anchor_rotate.ts`** (2sexte + `A3`'s handover) — ⚠ blocked on a decision: `A12`
   moved roll to the second touchpoint, so `A3`'s handover now spans two touchpoint
   configurations rather than one channel.
5. **Wiring `shake.ts`** for eviction, with its four tunables and their sliders.
