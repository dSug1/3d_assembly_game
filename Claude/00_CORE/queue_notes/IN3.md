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

> 🔨 **IN PROGRESS.** ✅ **The eviction shake is BUILT** (2026-09-15, `src/input/shake.ts`, 15 vectors, engine-free, not yet wired). ⭐⭐ Its non-obvious decision: **a circle projects to a back-and-forth on every axis**, so the detector is defined as oscillation ALONG AN AXIS — without that, spinning an anchored part to look at it would evict, which `A3` made reachable. ⭐ Falsified before trusted: removing straightness reddens the circle vector, removing the leg hysteresis reddens the nudge. ⭐ `suppressesFlick` arms on the FIRST reversal, which is the flick guard A4 demands. ✅ **2sexte + A3's handover BUILT** (`src/input/anchor_rotate.ts`, 25 vectors): every rotation is about the CONSTRAINT axis, and *the anchor survives* is asserted directly — with rotating about the VIEW axis as the counter-example, swinging the normal >30° off target. ⭐⭐ **A finding for `anchorHandoverCos`**: the near side's excursion is `r·sin α`, so a rad/mm gain turns the object at the same rate while the motion FADES — the drag goes quiet over a range *before* it becomes undefined, so the handover must happen while it is still visible. ⚠ **Three of my own fixtures were wrong in that one file**, each looking like a code defect (mistake shape 5); all caught by deriving the geometry independently. ✅ **`scene.ts` WIRED to the object model** — see the `3D1` row. ⭐⭐ Also landed `src/input/display_pose.ts`: the chain `SWAY ∘ FOLLOW ∘ model` as ONE expression, engine-free and vectored, written BEFORE the rewiring as the `3D1` row demanded. Its RIGIDITY vector had never existed — both half-implementations pass a pairwise-distance test, so only an orientation assertion separates a block from a crowd. ✅✅ **`A7` AND `A8` LANDED 2026-09-15 and both are on the glass**: every object gesture now stands on a **GRAVITY FRAME** (`src/input/gravity_frame.ts` — yaw about the world vertical, pitch about the horizontal, roll about the view direction flattened onto the ground), and a roll **REBASES** to the start of its circle instead of keeping the yaw/pitch swept before the 60° commit. ⭐ `A7`'s composition is vectored END TO END in `tests/a7_wiring.test.ts` at four camera tilts — ⛔ which is what settled a report that the gravity frame had regressed: it had not, and the owner withdrew it. ⛔ **`A9`/`IN12` is the live defect instead**: no deadband on `dx`/`dy`, so a still finger turns a held object. ⛔ Still to do: 2bis's precondition, **face selection from the picked NORMAL** (not `faceId` — triangle ordering is an engine detail), 2ter/2quater + the flick skip, wiring the shake to eviction, the two handover tunables with sliders, and ⛔ **the device pass that closes both `IN3` and `3D1`**. ⛔ **It also CLOSES `3D1`**, which has no visible behaviour of its own. Three things it owns: rule 2bis's missing PRECONDITION (*an empty constraint stack* — an anchored object currently rotates freely and would silently break its own anchor), the triangle→`FaceId` mapping at the render seam, and the eviction gesture. ✅ **Four owner decisions landed 2026-09-15 and the row is fully unblocked** — `D12`/`D15` eviction is a **quick back-and-forth** (it left the double-tap, then left the roll channel too), `D13` it **spares MATEs**, `D14` **roll drives an anchored object's free DOF while 2sexte suppresses where it degenerates**, on ONE handover constant with hysteresis. ⛔ Non-negotiable: **skip the flick test once one reversal is seen**, or an abandoned shake ADDS a constraint. Amendments A1–A4 → [`./IN3.md`](./IN3.md)


---

## 🔨 2026-09-16 — THE FORK, AND `IN3`'s FIRST RULE IS WIRED

⭐ `D29`: three anchor-rule sets behind `anchorRules` (`?anchorRules=1`, or the menu's
`⭐ ANCHOR RULES` slider), so today's behaviour and `IN3` can be driven in one session.

| flag | fork | what it does |
|---|---|---|
| `0` | **A — `NONE`** | the behaviour `1.0.4`–`1.0.7` shipped. No constraint created, consulted or cleared. ⚠ **Was the default until 2026-09-16** |
| `1` | **B — `IN3`** | §2 rules 1–3, flick-to-align. ⚠ **Parked by the owner**; what is wired is below |
| `2` | **C — `FORK_C`** | ✅ the owner's tap-to-align set (`D37`–`D39`) — **and the shipped DEFAULT** since 2026-09-16. ⛔ It was `OWNER_TBD` and *inert* while unspecified; a name that says *to be defined* while the thing runs rules is a lie the compiler cannot catch |

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

### ✅ BUILT: 2ter / 2quater — a flick pushes an alignment, in `ROTATE` only (`D30`)

`src/input/align_flick.ts` · `tests/align_flick.test.ts` · **10 vectors**, engine-free.

⭐ A **vertical** flick pushes `GRAVITY_ALIGN`, a **horizontal** one `WORLD_AXIS_ALIGN`; the
release then pushes, **re-solves per §1.4**, applies the solver's rotation and unselects.
⭐⭐ **The sign reads the way a hand expects**: screen y grows downward, so a flick UP aligns
the face with `-g` — *you flick the face the way you want it to face*.

⛔⛔ **ONLY WHILE THE MODE IS `ROTATE`** — the owner's call, and the reasoning is in `D30`.
Read literally the spec would anchor after a brisk **translate**, moving a part and then
spinning it. ⚠ The alternative was moving anchoring to its own channel (a HOLD, hold-then-
drag, a two-finger flick); gating on the mode costs no new gesture, which is why it won.

⛔⛔ **THE WORLD VECTOR IS RESOLVED AT THE SNAP**, from the gravity frame latched at press —
never stored as a screen axis. §1.4 is explicit: storing the screen axis let a camera orbit
silently redefine the constraint. ⭐ A vector asserts that two identical flicks from two
camera poses produce **different** constraints, which is what *world-absolute* means.

⚠ **A REFUSAL IS REPORTED, NOT SILENT.** A third constraint leaves no free rotational DOF,
so the solver rejects and the readout says `REFUSED — stack full`. §1.4 asks for a negative
haptic there; `IN7` owes it, and iOS Safari has no Vibration API at all — so until then the
readout is the whole of the feedback, and a gesture that did nothing silently would read as a
broken control and get repeated.

⛔⛔ **OWED, AND IT MUST NOT BE FORGOTTEN WHEN `shake.ts` IS WIRED**: §1.3's flick test has to
be SKIPPED once one reversal is seen. A shake is two flicks in opposite directions, so a hand
shaking to EVICT a constraint would **add** one — after which two constraints leave zero free
rotational DOF and the part stops responding to drags. ⭐ Nothing to skip today, because
eviction is not wired; the guard lands with it.

⭐ **`config_debt` caught a stale entry the moment this landed**: `matePriorityOverAnchor` was
on the pending list and is now READ by the push. ⚠ Removed — and the note records that *"nobody
reads it"* and *"nobody has judged it"* are different debts, only the first belonging there.

### ⛔⛔ DEFECT, FOUND BY FINGER THE SAME HOUR — the marker's roll

> *"In fork 1, the highlighted face does not rotate as the cube's face: consequently, there
> is a growing mismatch between their respective quaternion. Not sure how the quaternion of
> the highlighted face is computed."*

⛔ It was computed as `shortestArc([0,0,1], worldNormal)` — the minimal rotation taking the
marker's facing onto the face's world normal. ⭐ That is **correct about where the marker
points and silent about its spin**: the shortest arc fixes ONE axis and leaves the roll about
it free. ⚠ So turning the object about that face's own normal left the normal unchanged, the
marker unmoved, and the face rotating underneath it — the mismatch growing exactly as
reported.

⭐⭐⭐ **A DIRECTION TEST CANNOT SEE A ROLL.** It is the same family as `METHOD`'s *a sign is
not tested by any amount of testing the magnitude*: the quantity I had reasoned about — *does
the marker face the right way?* — was true in every frame, while the quantity that mattered
— *is it oriented like the face?* — drifted without bound.

✅ **The fix is not to derive an orientation at all**: the marker **inherits the object's**
and adds the ONE constant rotation taking its `+z` onto that face's LOCAL normal. Constant
per face, so nothing can drift. `faceMarkerOrientation` in `core/face_pick.ts`.
⭐ **4 vectors, and the mutant is the shipped defect itself**: restoring it reddens *in-plane
axes follow the object* and *after forty spins*, and leaves both direction vectors green —
which is the lesson stated as a test result rather than as a claim.
⚠ It also explains why no vector caught it first: the marker's orientation was wiring in
`src/render`, where none reach — the same class as `3D1`'s follower defect.

### ⛔⛔⛔ DEFECT 40, AND IT IS THE MOST INSTRUCTIVE ONE ON THIS ROW — a retired gesture that still owned a verdict

> *"the face does not point up at rotation flick"* — then, unprompted, *"also, there is no
> reduction of DOF after a flick"*, then *"correction: there seems to be no DOF reduction at
> the first flick but the second flick completely freezes the rotation."*

⭐⭐ **THE FIRST THING I DID WAS THE RIGHT THING AND IT PROVED THE OPPOSITE OF WHAT I
EXPECTED.** `tests/in3_align_wiring.test.ts` walks the exact chain `scene.ts` runs — build
the constraint → push → re-solve → apply → read the face's world normal — at five
orientations including every face of a rotated cube. It was **5/5 green**, before and after
the report. ⛔ So the composition was not the defect, and *a composition is a thing to
MEASURE* had already paid for itself: it told me where NOT to look.

⛔⛔ **The veto sat one stage EARLIER than the chain the test starts at.** `Recognizer.release`
ran, in priority order:

1. `if (this.roll.committed) return { kind: "ROLL_KEPT", ... }`
2. the flick test

⚠ `A12` had moved roll to the second touchpoint's `x` and the one-touchpoint circle detector
was left **fed** — `this.roll.push(s)` on every move — and described in the code as *"unused,
exactly as `roll.ts` is: the machinery is correct and vectored."* **It was not unused.** It
still owned the top rung of the release ladder. A hand rotating a cube sweeps arcs, so it
committed routinely, and every commit **pre-empted the flick test**: no `FLICK`, no
`alignFromFlick`, no constraint, no alignment.

⭐ That is exactly the reported shape: *intermittent*. A straight-enough flick got through;
a curved one silently did nothing. ⚠ And it explains the sequence of reports — *"no DOF
reduction at the first flick"* is the same defect as *"the face does not point up"*, seen from
the other side.

⭐⭐⭐ **A RETIRED GESTURE THAT STILL OWNS A VERDICT IS NOT INERT.** This project met the
same shape three times in one day and this was the third: a HUD line printing a retired
quantity (misinformed), `secondTouchGraceMs` decayed into a slider that changed nothing
(misinformed) — and this one, which **changed behaviour**. ⛔ The difference is the verb: the
first two were *read*, this one was *obeyed*.

✅ **The fix is a DELETION, at the owner's instruction** — *"clean the roll also for the fork
A."* `roll.ts`, `one_euro.ts`, their 58 vectors, `rebaseOnRollCommit`, the pose history, the
`ROLL_KEPT` union member, ~16 tunables and the sagitta guard are gone. ⚠ The count dropped
632 → 574 and that is the healthy direction: a vector certifying a module nothing calls is
what kept this alive.

⚠⚠ **AND THE DELETION HAS A COST I OWE ON THE RECORD.** §1.3's skip carried a comment
saying a circular path *"fails the purity ratio anyway"* and that the explicit skip removed
the edge case *"rather than relying on that happening to hold."* ⛔ We now rely on exactly
that. ⭐ So it is **measured, not assumed**: a vector replays a 70 px swept circle followed by
a fast straight run and asserts the `FLICK` — a curved drag that ends fast and straight
**does** align now, stated rather than discovered. ⚠ A device question stands: is an
accidental alignment reachable that way? `A4`'s eviction shake carries `suppressesFlick` for
the reversal case and lands with its wiring.

---

### ⛔⛔ DEFECT 41 — *"the second flick completely freezes the rotation"*, and it is not a bug in a rule

⭐ The behaviour is `dragRule` returning `ROTATE_REFUSED`: two entries fill §1.4's hard
capacity, and 2sexte — the rule that *drives a constrained object* — is **not wired**, nor is
eviction. So the object is correct, the readout is correct, and **a hand has no gesture that
recovers.**

⛔⛔ **SHIPPING ONE HALF OF A PAIR IS NOT A PARTIAL FEATURE, IT IS A TRAP.** One constraint is
reversible — flick again and it re-solves. Two is terminal until the app is reloaded.
⭐ The lesson is about **release granularity**, not about the rules: 2ter/2quater were wired
because they were finished, and finished-and-live is not the same as safe-to-reach.
⚠ What closes it is below — either 2sexte's wiring or eviction, and eviction is the smaller
of the two and needs no decision from the owner.

---

### ⛔⛔⛔ THREE DEVICE REPORTS IN ONE MESSAGE, and the third retracted a guard one hour old

> *"in fork B: keep the face highlighted when the object is aligned, until the shaking
> releases the alignment. — a flick immediately remove two DOF now and I cannot rotate the
> aligned object around the alignment axis. — the flick should be triggerable during an
> ongoing rotation (it seems the flick only triggers if the touchpoint presses and directly
> do a flick)."*

#### 1. The highlight is the alignment's only visible state (`D35`)

§3 rule 3 says *"release unselects object and face"*, and it was written before a face could
be ANCHORED. ⭐⭐ A constrained object looks exactly like a free one: the stack is invisible,
2sexte's single DOF feels like a dead control, and *which* face is anchored is unknowable.
✅ So the marker now outlives the gesture and **dies with the constraint** — eviction clears
it, a surviving mate keeps it (`D13`). ⛔ Not the other way round: a highlight that outlived
the stack would report something untrue, which is worse than reporting nothing.

#### 2. 2sexte, and the blocker that was not one (`D34`)

⛔ *"A flick immediately remove two DOF"* is correct and is §1.4 working: entry 1 is HARD and
consumes two of three. ⛔ *"I cannot rotate the aligned object around the alignment axis"* is
the defect — the third DOF had no driver, because `anchor_rotate.ts` sat built and unwired.

⭐⭐⭐ **AND THE ROW HAD BEEN BLOCKED ON A DECISION THAT NO LONGER EXISTED.** `A3` framed the
drag and the roll as two charts over one circle, well-conditioned in opposite geometries, to
be selected by one constant (`anchorHandoverCos`) with hysteresis — and warned that two
independently chosen thresholds give either a dead band or an overlap. ✅ `A12` had already
removed the choice by moving roll to the SECOND touchpoint: the charts are two **channels**,
both live, each reached by a different hand shape. ⭐ *A handover between rules became a
handover between fingers, and stopped being a decision.* The constant is never written.

⚠ What each channel does at its own degeneracy is REFUSE: the drag returns `null` where the
axis projects to a point (every screen direction is equally perpendicular), the roll returns
`null` square to the axis. ⛔ And a FULL stack refuses both — otherwise the second touchpoint
would be a way to break an anchor the one-finger rule correctly protects.

⭐⭐ **THREE COMPOSITION VECTORS, AND THEY CATCH WHAT 25 UNIT VECTORS DO NOT**: applying the
twist in the object's LOCAL frame (`qmul(base, q)` — the classic order slip) leaves
`anchor_rotate.test.ts` entirely green and reddens both of mine, because the anchor breaking
is only visible in the composition *align → twist → read the face's world normal*. ⭐ Mistake
shape 4, pre-empted for once rather than paid for.

#### 3. The flick's baseline, and a guard that outlived its reading (`D33`)

⛔⛔ The flick test measured travel and purity **from the oldest sample still inside
`flickWindow`**. On a press-and-flick that sample is the flick's own start; at the end of an
ongoing rotation it is mid-rotation — and a flick that REVERSES the drag (which is what
flicking a face up after turning an object looks like) cancels to almost zero net travel.
⭐ So the report was exact: *"only if the touchpoint presses and directly do a flick."*

✅ `flickWindow` is now the LONGEST tail a flick may be read over rather than a fixed
baseline, and the longest passing tail wins — longest, because a short tail is the easiest
thing in the world to make look pure. ⚠ With a MINIMUM span of `flickLiftWindow`, so the
displacement is never measured over a shorter baseline than the speed already is: one
coalesced pointer jump is not a flick.

⚠⚠ **MY FIRST FIXTURE FOR THIS DID NOT REPRODUCE IT** — mistake shape 5, caught by the
mutant rather than by me: a slow rotation plus a fast run in another direction passes the
OLD test too. The reproduction needs the reversal, and the vector now asserts the
cancellation (net travel under the 6 mm bar) before asserting the fix.

⛔⛔ **AND IT RETRACTED `A4`'s FLICK SKIP, WIRED ONE HOUR EARLIER.** The skip keyed on the
first reversal — on `A4`'s own wording — which suppresses exactly this gesture. ⭐⭐ It had
looked free when `A4` asked for it, because with a whole-window reading a reversal made a
flick undetectable anyway: **the guard was sized against a reading of the signal that `D33`
then changed.** ✅ Narrowed to *the shake has FIRED*, the case with a concrete harm (the hand
has just cleared its alignments and the release would push a new one).
⚠ The exposure left, stated: an ABANDONED shake can still end in a flick and push an
alignment. It is reversible — one constraint rotates, and a shake removes it — while
suppressing every post-reversal flick was recoverable by nothing.

---

### ✅✅ THE FIRST DEVICE PASS CLOSED THE ALIGNMENT MODEL — 2026-09-17

> *"1- device pass ok, except these modifications to be done … 4- keep both shake and re-tap"*

⭐ Five corrections, all built the same day: **everything simultaneous** (`D43`, which deleted
`A10`'s gate — six models of depth behind it), **the tap aligning in either movement mode**
(`D44`, which overturned a condition I had called load-bearing), **the sway restored** on an
aligned rotation (defect 47, an early `return`), **the snap played as a slerp** (`D45`), and
**the twist no longer killing that slerp** (defect 48, a guard for a conflict that was not
real). ⚠ Both undos kept, so the shake's four tunables still matter.

⚠⚠ **WHAT THE CLOSE DOES NOT COVER**: the corrections have not themselves been re-judged,
except the slerp's SPEED — tuned three times in a few minutes (twice faster → 1/3 → 2/7 of the
camera reset). ⭐ That sweeping is the argument for a URL-overridable field, offered and not
taken; the ratio stays a constant until it moves again.

⛔ **WHAT REMAINS IS NOT IN THIS ROW'S CONTROL**: stage 2 and the mate, each blocked on one
owner decision — the approach mapping at contact, and which gesture asserts a mate.

---

### ✅ THE PIONEER-TURN RULE, AND A FLAG THAT LIVED FOUR HOURS — `D41` → `D42`, 2026-09-17

⛔⛔ **THE CASE HAD NO RULE AND ITS ABSENCE WAS INVISIBLE**: an alignment stores a FROZEN world
direction (§1.4, deliberately, so a camera orbit cannot redefine it), so turning the object
that direction was READ FROM leaves the Follower obeying a target nothing on the glass matches
— with both highlights still claiming the relationship holds.

⭐ Built first as a flag (`D41`, C1 = release, C2 = follow), then **merged into the gesture**
four hours later (`D42`): a **single tap** makes a `SNAPSHOT`, a **double tap** a `FOLLOW`.

⭐⭐ **WHY THE SECOND SHAPE IS BETTER, AND IT GENERALISES**: a flag is one answer for a whole
session; a gesture is an answer **per alignment**, and it can be SEEN — two colours for a
snapshot, one for a relationship. ⛔ The same argument retired `D26`'s assignment flag and
`D29`'s anchor flag: *a flag is how you COMPARE two rules; it is not how you ship one.*

⚠ What the merge cost, stated: each gesture is its own toggle, so leaving `FOLLOW` with
single taps takes two — one to switch, one to release. And because `D27` makes every tap act
immediately, a double tap on a face that is already a `SNAPSHOT` releases on the first tap and
re-aligns as `FOLLOW` on the second: the end state is right, with one frame between.

⚠ A naming lesson paid for by a failing vector: the MODE is `SNAPSHOT`/`FOLLOW` and the
VERDICT is `RELEASE`/`FOLLOW`/`NONE`. A blanket rename swept one vector into asserting the mode
where it meant the verdict. ⭐ **Name a decision and its consequence differently.**

---

### ✅✅ FORKS A AND B DELETED, AND THE SANITY SWEEP THAT CAME WITH IT — `D40`, 2026-09-17

> *"Remove the fork A and the Fork B and set the fork C as the unique default. Remove the
> slider for the forks accordingly. Clean the code, and do a sanity check for stale, orphan,
> skeleton parts of script following all the changes which occurred so far."*

⛔ **DELETED, NOT DISABLED** (`D28`'s precedent, and its reason: *a dormant fork is a trap*):
`anchor_fork.ts`, `align_flick.ts` (fork B's flick-to-align), `drag_rule.ts`, the `anchorRules`
flag, its validator rule, the menu slider, the HUD's fork line, and **41 vectors**.

⭐⭐ **AND A WHOLE CLASS OF CODE WENT WITH THEM, WHICH IS THE INTERESTING PART.** The cap of
one alignment makes `ROTATE_REFUSED` unreachable — so `dragRule`'s third and fourth cases
cannot occur, and eviction's *escape from a full stack* vectors describe a state that can no
longer exist. ⚠ They are deleted rather than kept green: **a vector whose subject cannot occur
is a claim about a world that is gone.** What protects against the freeze now is the cap's own
vectors, and they protect against it being BUILT rather than survived.

#### ⭐ THE SWEEP — what a scan found that reading had not

⚠ Written as a script (`orphans2.py`, in the session scratchpad) rather than by eye, and
**its first version was wrong in two ways worth naming**: a function's own DEFINITION matched
the call pattern, so every orphan looked used; and `new Foo<T>()` did not match it, so a used
class looked dead. ⛔ A scanner that cannot fail is worse than no scanner.

| found | what it was | done |
|---|---|---|
| `resolveAnchorDriver`, `viewAxisAlignment`, `AnchorDriver` | `A3`'s handover constant — machinery for a decision **`D34` retired** when `A12` made the drag and the roll two CHANNELS | deleted, with 15 vectors |
| `gainAnchorDrag` **and** `gainRotateConstrained` | ⛔⛔ **ONE NUMBER UNDER TWO NAMES for a day** — the spec's own name sat unread in `config_debt`'s PENDING list while I wired one I had invented | merged; the SPEC's name wins |
| `meaningfulPose` | a **skeleton**: `(p) => p`, no test, no caller | deleted |
| `depthPushDirection` | a second computation of the view axis flattened onto the ground, while the scene reads `frame.depth` | deleted — and the depth vectors now use `gravityFrame`, so they exercise the mapping the product uses |
| `verticalVisibility` | measured how the vertical weakens as the camera tilts; **nothing called it** | deleted, ⭐ its LESSON carried into `gravity_frame.ts`'s header with the numbers |
| `isSettled` | a leftover predicate from the follower work | deleted |
| `matePriorityOverAnchor` | became unread the moment fork B's 2ter went | ⭐ declared PENDING with the row that will wire it (`3D2`/`6quater`) — **not fake-wired**: the cap makes the ordering irrelevant, so reading it would change nothing, which is the slider-that-does-nothing shape |
| `fork_c.ts` | a name that says *fork* when there are no forks | renamed `alignment.ts`; the HUD's `forkC:` prefix became `align:` |

⚠⚠ **WHAT THE SCAN LEAVES, AND WHY IT IS NOT THE SAME THING**: seven exported functions of
`3D1`'s object model (`attach`, `detach`, `reroot`, `connectorWorldPose`, `testMate`,
`mateResidual`, `qAngle`) are called by nothing and **kept**. ⭐ The distinction this project
paid for: *kept is safe when nothing CALLS it; dangerous when something still OBEYS it.* The
roll detector was fed and its verdict was honoured (defect 40); these are pure functions built
ahead of `3D2`, with vectors, that cannot veto anything. ⛔ If `3D2` is abandoned they go.

---

### ✅ FORK C's AMENDMENT — both faces marked, and a second undo (`D39`, 2026-09-16)

⭐ *"When an object is aligned, the FollowerFace shall be highlighted and the PioneerFace
contour shall be highlighted, until the alignment is broken"*, and *"the alignment can be
toggled off by taping another time to the same PioneerFace."*

⛔⛔ **BOTH RETIRE THE OWNER'S OWN *"the PioneerFace resets as null"***: its identity has to
survive, because the contour is drawn on it and the re-tap must recognise it. ⭐ What does NOT
change is the **constraint** — still a frozen world direction, so moving the Pioneer's object
afterwards still does not drag the alignment with it. ⚠ What IS still discarded is the tapping
grip's own `pressFace`: a stale face on a dead grip is what a later rule picks up by accident.

⭐⭐ **A FILL FOR WHAT MOVED, A CONTOUR FOR WHAT IT WAS AIMED AT** — the two faces are not
the same kind of thing, and that difference should not need a legend. ⛔ Both go through ONE
`placeFaceMarker`: a second copy of that geometry would be a second implementation of it,
which `METHOD` warns can silently disagree while both look right. ⚠ And the pair is
**atomic** — a contour without its fill would claim a relationship that is gone.

⭐ The re-tap is a `ROTATE` gesture (a tap in `TRANSLATE` keeps `D28`'s toggle), so the shake
remains the only undo while translating — which is exactly why the owner keeps it *for the
moment*. ⚠⚠ **That comparison is now the most useful thing a device pass can produce.**

---

### ✅ FORK C's FIVE CORRECTIONS — the first device pass, 2026-09-16

⭐ The owner drove stage 1 and sent five corrections; *"the rest is working good."* ⛔ Two of
the five were **defects of mine**, and both are the kind no vector could have caught because
they live in the wiring or in a baseline:

1. **The highlight was built and wiped one event later.** *"You completely disregarded the
   highlight rule — or if you built it, I can't see it."* ⛔⛔ The release handler's
   persistence test asked *"is the object being RELEASED the highlighted one?"* — and in fork
   C it never is: the highlight names the **Follower** while the release that follows an
   alignment is the **Pioneer's** tap. ⭐ Mistake shape 2 in a new place: a condition about the
   GESTURE standing in for a fact about the MODEL. ✅ The test now asks the question the
   highlight answers — *is the highlighted object still aligned?* — whichever grip is going up.
2. **The shake only fired if it began at the press** (and so *"not working in translation
   mode"*, which was the same defect wearing a mode). ⛔⛔ The detector claimed its axis ONCE,
   from the gesture's first leg, and accumulated reversals, amplitude and perpendicular
   excursion from that origin for as long as the finger stayed down. ⭐⭐ **THE SAME MISTAKE
   `D33` HAD JUST FIXED IN THE FLICK**: a quantity measured from the oldest sample of the
   gesture instead of from the recent motion. ✅ Rewritten as a **windowed reading** — the
   principal axis of the trailing window, scanned over sub-windows longest-first, exactly as
   the flick now reads its tail. ⚠ And my first vector for it failed against my own fix, which
   is how the sub-window scan got written: a 480 ms drag plus a 240 ms shake leaves the window
   mostly drag, so the whole-window reading refused the very gesture the report asked for.

⛔ The other three corrections were rules: fork C becomes the **default fork**, it starts in
**`ROTATE`**, and the automatic switch to translation after an alignment is **retired** — a
rule the owner had dictated himself, withdrawn because *"it makes the game too complicated"*
and because it blocked testing the reset after an alignment. ⭐⭐ That last one cost an argument
I had liked: the tap's two meanings *coincided* while the alignment ended in `TRANSLATE`.
They no longer do — **the alignment consumes the tap**, overriding `D28` for that one
gesture, and that is now stated rather than dressed up as a happy accident.

---

### ✅✅ FORK C IS SPECIFIED AND STAGE 1 IS BUILT — `D37`, 2026-09-16

⛔⛔ **THE OWNER PARKED FORK B FIRST, AND THE REASON IS THE DESIGN INPUT FOR FORK C**: *"I am
not satisfied with the flick mechanism — difficult for user to implement, and releases the
finger from the object it is tracking."* ⭐ Both faults belong to a **release-time trigger**
rather than to this flick: the release IS the trigger, so the finger must leave, and the
gesture must be performed to a threshold specification instead of simply chosen.

⭐⭐⭐ **SO FORK C's TRIGGER COMPLETES MID-GESTURE: hold one object, TAP a face on another.**
The held object makes the minimal turn that points its own face **the same way** as the
tapped one. Rules, conflict check, transitions and the open questions are in
[`../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md);
what follows is only what a session needs about the BUILD.

#### What is built (15 vectors, 3 mutants, no device look)

`src/input/fork_c.ts` — one file for the whole fork, on `D28`'s precedent: the day a fork is
chosen the others are **deleted**, and the last deletion cost 44 vectors spread over four
modules. ⭐ One file per fork makes that a `rm`.

* `faceAlignConstraint` — the **parallel** align, target frozen to a world direction at the tap;
* `tapMeaning` — the tap's two meanings (align / toggle);
* `flickResetPlan` — the reset, scoped by *when* the alignment happened;
* `singleAlignment` in `core/constraint_stack.ts` — the **cap of one**, refusing over a `MATE`;
* wired in `scene.ts`: the alignment, the highlight, the mode switch, the shake, the reset,
  and the twist about the aligned normal.

#### ⭐⭐ THREE THINGS WORTH CARRYING, beyond the rules themselves

1. **The owner's arithmetic and the geometry differed by one, and the geometry won without
   changing the intent.** *"One alignment axis (therefore one DOF reduction). I do not want to
   have 2 DOF removed."* ⛔ A normal-onto-direction alignment fixes **two** rotational DOF;
   the survivor is the spin about that normal. There is no alignment that costs one. ✅ So it
   is built as **at most one entry on the stack, replaced by the next tap** — which delivers
   exactly what was asked, because fork B's zero-DOF freeze becomes unreachable by
   construction rather than by care. ⭐ *When a request cannot be built literally, look for
   the reading that keeps its PURPOSE.*
2. **The owner re-framed a question I had framed wrongly.** I asked what the reset should do
   *while an alignment holds* — a property of the STATE — and offered three answers. The reply
   was a property of the **GESTURE**: *"if the object was already aligned when the rotation was
   started... the alignment is conserved. If the alignment occurred during the rotation...
   this looses the alignment."* ⭐⭐ The state cannot separate those cases; the gesture can, and
   the recogniser's snapshot is already the right reference. ⛔ And the first case then costs
   **nothing**: a snapshot taken while aligned already satisfies the constraint.
3. **A vector of mine could not fail, and reading it caught it** — not a mutant. It built the
   swing axis as `before × after` and asserted that axis was perpendicular to `after`, which a
   cross product is by construction. ✅ Replaced by the honest test of *minimal*: the
   rotation's **ANGLE** equals the arc between the normals, which any added twist exceeds.
   ⚠ Mistake shape 5 again, and the cheapest catch of it so far.

#### ⚠⚠ THREE DELIBERATE DIVERGENCES from decisions already taken

⛔ Each is written at its site in the code as well as here, because a divergence nobody can
find is indistinguishable from a bug:

| | fork B / today | fork C | why |
|---|---|---|---|
| the shake's mode gate | `ROTATE` only (`D32`) | **either mode** | fork C's alignment ENDS in `TRANSLATE`, so a mode gate would force a toggle before the hand could undo — and the owner's sentence has no mode condition. ⚠ Cost: a vigorous reposition can evict |
| the rotation reset | deleted globally (`D36`) | **reinstated, fork C only** | `D36` removed it because it fought fork B's flick-to-align; fork C has no flick alignment, so the conflict does not exist here. Fork A shipped without it and still does |
| the session's start mode | `TRANSLATE` | **`ROTATE`** | the owner's *"default start: rotation mode"* — applied inside fork C alone, because fork A's default has been closed by a hand. ⚠ The FLAG's default stays fork A until fork C is closed too |

#### ⛔ What is NOT built, and what blocks it

⭐ The whole second half of the owner's rules — `TargetPosition`, the cross-quad gizmo, the
orbit about it, and the two-object approach. ⚠ Four owner decisions gate them, and one is a
real design problem rather than a preference:

1. ⛔⛔ **The approach mapping degenerates exactly where it matters most.** It projects a screen
   delta onto the screen projection of `centre → TargetPosition`; that line **has no direction**
   when it faces the camera (2sexte's documented degeneracy, where the honest tracking mapping
   `1/(r·sin α)` diverges) and **shrinks to noise at contact**, which is the instant precision
   is wanted. ⚠ And fork C has no channel to hand over to, because its target state displaces
   roll and depth.
2. **`A15` will drop the selection mid-approach** — it exists because depth slides an object out
   from under its finger, and fork C's approach does that deliberately. The owner's rules
   simultaneously keep the FollowerFace highlighted *until a shake*.
3. **A second touchpoint outside any object while aligned** is undefined.
4. **The orbit's reading**: position-only about the target (my reading, which maintains the
   alignment for free) or reorient-and-re-solve.

⚠⚠ **AND THE MATE QUESTION IS STILL OPEN**: fork C's align is **parallel**, so it orients
without joining. §4's `6quater` is the only rule that pushes a `MATE` and it is **flick-based**
— which fork C does not have. ⛔ So as dictated, fork C brings faces close and never joins
them; whether a joining rule is owed is the owner's call.

---

### ⛔ What remains in fork B

1. ✅✅ **DONE — THE ESCAPE (`D32`, 2026-09-16).** `shake.ts` is wired: a back-and-forth
   while the mode is `ROTATE` evicts the object's alignments and **keeps its mates** (`D13`),
   through `evict` / `evictObjectConstraints` in core. ⭐⭐ Two things make it the fix rather
   than a feature: it is fed **before** `dragRule`'s refusal, so it works in the one state
   where nothing else does; and it pays `A4`'s owed half, suppressing the flick test from the
   **first reversal** — a shake is two flicks by construction, so without that the escape
   would push the very constraint it is clearing. ⚠ An empty or mate-only take **refuses out
   loud** in the readout (`IN7` owes the haptic), because *it did not work* and *there was
   nothing to undo* are opposite situations with identical silence. ⚠⚠ **A DEVICE LOOK IS
   OWED, and it is a SAFETY look**: the four tunables are guesses with sliders, and the whole
   question is whether a corrective nudge during fine positioning can evict by accident.
2. **Wiring `anchor_rotate.ts`** (2sexte + `A3`'s handover) — ⚠ blocked on a decision: `A12`
   moved roll to the second touchpoint, so `A3`'s handover now spans two touchpoint
   configurations rather than one channel. ⛔ Until then a constrained object does not rotate
   and the readout names the rule that would have run.
2. **Wiring `shake.ts`** for eviction, with its four tunables and their sliders — **and the
   flick skip with it**, which is now load-bearing rather than theoretical: 2ter/2quater are
   live, so a shake that is not suppressed ADDS a constraint.
3. **The negative haptic** on a refusal (`IN7`).
4. ⭐ **A device look**, which is now worth having: with 2ter/2quater wired, fork B finally
   does something a finger can judge — flick a face up and it should end up pointing up.

---

## ⭐⭐⭐ ROTATION INCREMENTS — `D73`, a trial, 2026-09-22

⚠ Recorded here because a queue row's status changes in TWO places or neither.

**What ships**: one slider, `rotationIncrementDeg` (0–45 step 5), **0 = the current build**.
Above zero the held body is **always on an increment** — it advances a whole one when the drag
crosses a boundary and otherwise holds, so a weak input simply stops it.

⛔⛔⛔ **FOUR FORMULATIONS, AND THE FIRST THREE WERE EACH REJECTED BY A HAND.** They are kept
because the shape of the answer is only visible against them:

1. **Quantise the turn as it happens**, playing every increment as its own slerped step.
   ⛔ The body could only move as fast as the queue drained — *"it creates too much lag in the
   rotation vs. the finger movement"*.
2. **Rotate freely; round to the nearest multiple at the RELEASE.** ⛔ Rounding carried the body
   FORWARD, past where the finger ever took it.
3. **Rotate freely; truncate back to the last increment when the finger rests.** ⛔ *"The object
   rotates then rotates back in the reverse direction"* — a correction is a reversal.
4. ✅ **Never leave an increment in the first place.**

⭐⭐ **THE INSIGHT IS THAT 1–3 ALL LET THE BODY REACH A POSE IT WAS NOT ALLOWED TO HOLD**, then
argued about how to get it back. Quantise the pose at every instant and there is nothing to get
back from. ⚠ It is NOT formulation 1 again: that one queued the increments, this one asks
*which increment is the finger in NOW* and goes straight there, so a backlog is unrepresentable.

⚠ **The cost, inherent and not tunable**: the body advances in visible steps rather than
tracking the finger. That is what a detent is.

✅ **Two defects came out of the same pass**, both by finger, both in the ledger:

* **49** — *"the dx delta position and the yaw rotation direction are inverted"*. The report
  named the wrong rule: the free yaw was swept over 400+ camera positions and inverted at NONE,
  while the **twist on an aligned body** inverted at 12 of 24 alignment orientations. `D57`'s
  flat, latched sign had been applied to the second touchpoint and not to the first.
  ⚠ Cost: `dy` no longer twists, and no finger has judged that trade.
* **50** — *"the sway of other objects is bigger [for] one increment than … two or more"*. The
  sway was right: a restarted `easeInOut` re-enters at zero velocity, so crossing several
  detents relaunched the body from a standstill. ✅ Replaced by an exponential approach.

⛔ ~~**A DEVICE LOOK IS OWED ON ALL OF IT.**~~ ✅✅ **CLOSED BY A DEVICE LOOK, 2026-09-22** —
*"the build is working ok now"*, the owner, on the branch that carries the fourth formulation
and both fixes. ⭐ It is the fourth formulation, defect **49**'s latched sign and defect
**50**'s exponential step that a hand has now judged together.

⭐⭐ **AND THE INCREMENTS THEMSELVES WERE NAMED**, asked for and given: *"the rotation increments
are judged and this is ok"*. ⛔ That matters because this project has been caught by a general
phrase before — `A15` was closed by *"everything is working ok"* and its three specific cases
were never reported on individually. Here the feature under trial is named in the verdict.

⚠ **TWO THINGS THE LOOK STILL DOES NOT COVER**, kept so nobody reads more into it than it says:

* **`dy` no longer twists** — the channel the fourth formulation took away (defect 49's cost),
  not reported on by name;
* **which increment should be the DEFAULT.** `rotationIncrementDeg` still ships at **0**, so the
  detents are reachable only from the slider or the URL. ⭐ A judged-good feature that is off by
  default is a decision nobody has made yet, not a closed one — it is the owner's.


---

## 2026-09-23 — ⭐⭐⭐ THE ALIGNMENT IS ANTI-PARALLEL (`D78`)

> *"Modify the rule: when the user aligns a follower object, the direction of the FollowerFace shall
> be anti-normal to the direction of the PioneerFace"*

⛔⛔ **IT REVERSES `D37`, WHICH CHOSE PARALLEL AND ARGUED FOR IT.** *"The CAD *align* sense, chosen
over a mate"* — and the consequence was written down and carried for a week: the held body presented
its **opposite** side toward the tapped face, which made the rule an orienting one that could never
join anything. ⭐ Both texts stand; the old one explains why the code had the sign it had.

⭐⭐ **THE WHOLE CHANGE IS ONE FUNCTION, AND THAT IS THE POINT.** `alignTargetFor` negates, and the
two entry points — `faceAlignConstraint` at the tap, `retargetAlignment` in the `FOLLOW` cascade —
both take **the Pioneer's own normal** and call it. ⛔ Neither can be handed a ready-made target any
more, which is `CONSTRAINTS` §7 (*one place knows that sign*) applied to a second sign.
⚠⚠ **The hazard was real before the change**: `retargetAlignment` took a `targetWorld`, so a
`FOLLOW` cascade would have re-aligned its followers **parallel** one frame after a tap aligned them
anti-parallel — a sign error with no symptom until the Pioneer moved, which is `METHOD`'s favourite
shape.

⭐ **Nine vectors moved with the rule, and they are the evidence it is real.** They asserted the
parallel sense, including one whose title was *"PARALLEL, NOT ANTI-PARALLEL — the owner's choice,
pinned as a SIGN"* and whose comment said it existed to fail *"if anyone corrects fork C into a
mate"*. ⚠ That is exactly what was asked for, and the vector now points the other way with its own
retraction in place. ⛔ A mutant that drops the negation turns all nine red.

⚠ **One fixture followed the product**: the approach-swing trial's boot scene aligned bottom face to
bottom face, which under the new sense would stand the second part on its head. It uses the
follower's **top** face now — `anti(−y)` is `+y`, the same physical scene the trial has always had.

⛔ **What it does NOT do**: it does not make a mate. Nothing is seated, a body can still be dragged
through its partner, and §4's `6quater` is still the only rule that would push a `MATE`. ⭐ What it
buys is that the ORIENTATION a mate needs is now the one the alignment produces, so the gap to `3D2`
is a **position and a gesture** rather than geometry → `ALIGNMENT_RULES.md` §5.18.

