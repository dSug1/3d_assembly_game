# THE APPROACH SWING — a trial on branch `1.0.18-`

> **STATUS** · trial, unjudged · **OWNS** · the camera lean during a Follower's approach
> **READ IF** · you are judging this branch, or deciding whether to keep or discard it
> **LAST VERIFIED** · 2026-09-20 — the swing's DIRECTION re-reported from Pages and fixed at its
> source (the sign was read from a travel that was never reset); ⚠ the fix itself is **unjudged**,
> and so is the FEEL (amplitude, whether it helps at all)

⚠⚠ **THIS IS A TRIAL AND IT IS MEANT TO BE DISCARDABLE.** The owner: *"Let's try a fork of the
build here … If the trial is not successful, I will just discard the branch later on."*
⛔ It is **not a flag** — `D28` and `D40` deleted the last of those, and a dormant fork is a trap.
**The branch is the fork.**

## The owner's dictation, verbatim

> *"From the case where the Pioneer object is pinned:*
> * *Setup boot scene: 2 of the 3 non-frozen objects are aligned on the gravity axis and on the
>   depth axis of the camera at boot. There is one Pioneer (on the left) and one Follower (on the
>   right). Set that up at boot for this fork.*
> * *The user will bring them close to each other by translating the Follower on the camera x
>   horizontal axis.*
> * *When the offset radius is crossed (= white highlights toggle on), the following occurs:*
>   * *A — a snapshot is done of camera transform … because we will orbit the camera during the
>     further move of the object*
>   * *B — while the translation of the Follower continues with the same user dx delta position
>     movement, the camera orbits opposite to the dx movement. The dx delta position movement
>     continues to translate the Follower on the same original axis (i.e. the axis is not updated
>     by the camera orbit). When the offset is half what it initially was, the camera orbit
>     reverses so the camera aims at coming back to its original orbit. When the offset is null
>     (contact of both objects), the camera shall be back to its original position when the offset
>     was initially triggered."*

## ⭐⭐ One requirement needed no work at all

⛔ *"the axis is not updated by the camera orbit"* — **already true, by construction.** Rule 6
translates along `grip.frame`, which is latched at the PRESS, and `scene.ts` says so in the line
above the code: *"an orbit that happens mid-drag cannot redefine which way `right` is."*
⭐ Worth stating, because it is the requirement that would have been hardest to add and the one a
reader would assume was the new work.

## ⛔⛔⛔ The one deliberate departure: an OFFSET, not a snapshot-and-restore

The owner described **A** as a snapshot of the camera, restored at contact. ⚠ What is built is an
**additive yaw offset** that is zero at `p = 0` and zero at `p = 1`. Three reasons:

* a restore **fights the hand** — orbit the camera yourself mid-approach and it would be yanked
  back to where it was before you did;
* a restore **has to run**, so a dropped frame, an early release or a body that never reaches
  contact each leave the camera somewhere nobody chose;
* an offset that is zero at both ends **cannot** leave it anywhere.

⭐ `LESSONS_CARRIED`'s own shape: *make the bad state unrepresentable rather than guarded.*
⚠⚠ **THE COST, STATED**: if the hand orbits during the approach, contact returns the camera to
**its own orbit**, not to the snapshot. That is a real difference from the dictation and it is
**the first thing to judge**.

## What the swing is

`swingYawRad = sign × amplitude × sin(π · p)`, where `p = clamp((g0 − gap) / g0, 0, 1)` and `g0` is
the surface gap **latched** at the trigger.

* ⭐ **A half sine, not a triangle.** Both peak at half and end at zero; the sine's angular
  *velocity* is continuous at the reversal, where a triangle knocks exactly as the hand
  concentrates on the last millimetres. ⚠ A hand may disagree — it is one line, and a vector
  measures the slope so the two cannot be confused again.
* ⛔ **Exactly zero at both ends.** `Math.sin(Math.PI)` is `1.2246e-16`, and *"back to its original
  position"* deserves to be a fact rather than a near-miss.
* ⛔ **`g0` is latched.** `captureOffsetM` is recomputed every frame from the camera distance
  (`D49`) and the swing is about to move the camera — a live offset would make the progress depend
  on the swing the progress drives. ⚠ A yaw-only lean keeps the orbit radius constant so it would
  not drift *today*; the latch keeps that true if the swing ever gains a radial component.
* ⚠ **Backing off past the trigger returns to zero and stays there** rather than swinging the
  other way.

## The boot scene

⭐ `objectA` (left) is the **Pioneer**, `objectB` (right) the **Follower**, aligned at boot in
`SNAPSHOT` — confirmed on the tablet: amber outline left, cyan right.
⛔ **Both bodies boot SQUARE**: `bootRotations[0]` and `[1]` are no longer applied, because two
arbitrarily turned bodies have no parallel faces and the pair could not start aligned.
⛔ The aligned faces are both `+x`, chosen **by normal and never by face id** (`D50`), and chosen
as the *already-parallel* pair so the boot pose is not disturbed — the facing pair (`+x` / `−x`)
would have spun the Follower 180° on frame one, which is §5.2's consequence of parallel-over-mate.

## ⛔⛔⛔ THE FIRST BUILD DID NOTHING, AND THE REASON IS THE LESSON

> *"not working. the camera does not orbit."* — the owner, minutes after it shipped

⚠⚠ **THE LAW WAS RIGHT AND THE WIRING WAS ABSENT.** `applyCamera()` is called by **camera**
events only — the reset, startup, a pinch, a slider and the orbit drag. ⛔ An approach is a finger
translating an OBJECT, during which not one of them fires. So `swingYawNow()` was recomputed every
frame, correctly, and never written to the glass.

⭐⭐ `METHOD`: *a rule that is never called is indistinguishable from a rule that is wrong* — and
only the glass can tell them apart. `approach_swing.ts` had eleven green vectors throughout, and
every one of them still passed, because `scene.ts` is the render layer and nothing vectors it.
✅ Fixed by driving it from the render loop, comparing against the last APPLIED value so the camera
is written only on frames where the lean actually changed.
⚠ Skipped while the camera reset is flying home: that animation writes the whole pose every frame
and two writers would fight, with the reset winning by arriving second.

## ✅ MEASURED ON THE TABLET (a synthesised drag over CDP)

| | camera |
|---|---|
| trigger, `gap=162/172mm` | on its own orbit — plate a symmetric trapezoid |
| half, `gap=76mm` | **visibly swung** — plate seen from an angle, both bodies showing their sides |
| capture lost | **exactly back** — frame indistinguishable from the trigger |

⭐ Done with `?captureOffsetMm=40`, because at the default the trigger is more than a screen-width
of finger away on this scene — worth knowing before judging by hand.

## ⭐⭐⭐ THE PITCH HALF — added 2026-09-19

> *"add a swing of the camera in the other orthogonal directions … also add a pitch swing of the
> same value. The idea is that the swing of the camera helps the user visualize the alignment in
> the directions orthogonal to the translation approach."* — the owner

⛔ **ONE ANGLE, SPENT TWICE.** Both halves are the same `sin(π p)` with the same sign, so the
camera leaves on a diagonal and comes back along it — one motion, and both halves reach zero
together, which is what keeps *"back to its original position"* true on both axes.

⛔⛔ **THE YAW IS RADIANS; THE ELEVATION IS NOT.** `v ∈ [0, 1]` runs along a monotone cubic
through three tuned rings, so *"the same value"* has to be converted before it means anything —
`pitchOffsetV` divides by the rings' angular span. ⚠ The conversion is linear and the surface is
not, so equal steps in `v` are equal angles only near the middle ring. Stated, not corrected: the
amplitude is a slider a hand sets by feel.

⛔⛔⛔ **AND IT MUST STAY IN `v`.** Pitching the camera off the ring surface would let it approach
the pole, where `requireGestureFrame()` **throws** because `A7`'s basis does not exist. ⚠ That
throw would land on the next PRESS, so the crash would look like it came from the finger rather
than from the camera. ⭐ `orbitOffset` clamps `v` itself, so saturating against a ring is the worst
this can do.

### ⚠⚠ IT ALSO CHANGES THE VIEWING DISTANCE, AND THAT IS INHERENT TO THE RIG

Measured on the tablet: the camera radius went **1.500 m → 3.000 m** at the peak of a 25° swing.
⛔ The orbit rig's radius VARIES WITH ELEVATION — that is what the three rings are — so a pitch
is never a pure angular lean here; it dollies as well. ⭐ Arguably that helps: pulling back while
leaning shows more of both bodies. ⚠ But it is not what *"a pitch swing"* implies, and a hand
should decide. A constant-distance pitch would mean leaving the ring surface, which is what the
paragraph above forbids.

### ⛔⛔ AND IT FORCED THE CAPTURE THRESHOLD TO BE FROZEN

`D49` scales the capture offset by camera distance. ⚠ A yaw-only swing kept that distance
constant; the pitch does not — the printed threshold went **`172mm → 345mm` mid-approach**.
⛔⛔ **The failure mode is not cosmetic**: where the swing moves the camera CLOSER the threshold
shrinks, and if it shrinks past the current gap the capture **drops** → the swing disarms → the
camera snaps back → the threshold is restored → it re-captures. A feedback loop in which the
camera's own motion decides whether the rule moving it still applies.
✅ `offsetAtTriggerM` is latched with the gap, and the threshold now holds at `172` throughout.
⭐ That is also what `D49` MEANT: the offset tracks *the hand's* zoom, and during an approach the
camera is being driven by the game.

## ⭐⭐⭐ THE AMPLITUDE IS DIVIDED BY THE FINGER'S SPEED — added 2026-09-19

> *"I want to set the maximum approach swing with the slider, and divide it by the speed of the
> delta position so that there is not a very big camera orbit jump when the delta position is
> fast."* — the owner

⭐⭐⭐ **AND THE ARITHMETIC SAYS WHY THAT IS EXACTLY RIGHT.** The lean is `θ = A·sin(πp)`, so

```
dθ/dt = A · π · cos(πp) · dp/dt        and        dp/dt ∝ the finger's speed
```

⛔ With a FIXED `A` the camera's angular velocity is proportional to how fast the hand moves —
which is the *"very big camera orbit jump"*, named precisely. ⭐ Setting `A ∝ 1/speed` **cancels
the term**, and the camera sweeps at the same rate whatever the hand does. The owner asked for it
by feel; it falls out as the one choice that removes `dp/dt`. A vector measures the cancellation
across a 4× spread of hand speed (within 1%; a fixed amplitude differs by exactly 4×).

⚠ The slider is therefore a **maximum**, reached when the hand is slow. `min(1, ref/speed)`.
⛔ The upper clamp is not decoration: `ref/speed` diverges as the finger slows, and without it a
nearly-still finger asks for an unbounded lean.

⛔⛔ **THE REFERENCE IS `swayReferenceSpeedMmPerS`** — *"the drag speed at which you get the full
amplitude"* for the sympathetic sway, the same question already tuned on a device at 120 mm/s.
`D45`: *"use the available sliders so we do not inflate the numbers of tuning parameters sliders."*
⚠ **Cost**: two unrelated rules share one number, so moving the sway's reference moves the
swing's. `D45` accepted the identical trade for the slerp's duration; splitting them later is one
field and one line.

⚠⚠ **WHAT TO WATCH: DECELERATING NOW WIDENS THE SWING.** `A` rises as the hand slows, so easing
off mid-approach drifts the camera further out though the gap has barely changed. ⛔ A drift, not
a jump — the estimate is windowed — but a motion the gap did not ask for. ⭐ One-line alternative
if a hand dislikes it: latch `A` at the trigger from the speed at that instant.

### ⛔⛔⛔ AND IT ALMOST SHIPPED WITH MISTAKE SHAPE 1 IN IT

The new `Recognizer.speedMmPerS` reuses `terminalSpeedPxPerS` — the flick's **windowed**
estimator — so there is one definition of *how fast is this finger*. ⚠ But nothing vectored it,
and replacing it with a **one-sample-pair** rate left all 932 vectors green.

⛔⛔ That is not a hypothetical: §1.1 estimated speed over one sample pair, so with the measured
0.761 mm of pointer noise a RESTING finger read ~95 mm/s and `STATIONARY` was unreachable for any
real finger, silently, for weeks. ⚠ Here the same arithmetic would make a resting hand look fast
and **collapse the swing to nothing exactly when a hand holds still to look at the join** — since
the amplitude now divides by this number.
✅ Three vectors close it: a still finger jittering by the full measured noise reads under
40 mm/s, a 100 mm/s drag reads 80–120, and the mutant is now 1 red.

### ✅ MEASURED ON THE TABLET

Same gesture, same gap, only the hand speed differs — camera radius at the half point:

| drag | at `p = 0.5` |
|---|---|
| slow (12 px/step) | **r = 3.000 m** — full swing |
| fast (45 px/step) | **r = 2.381 m** — visibly damped |

### ⚠⚠ AND IT EXPOSED ONE THING A HAND SHOULD RULE ON: RELEASING MID-APPROACH

⛔ The lean is a function of the GAP, so letting go mid-approach freezes it — the camera stays
leaning until the object is picked up again, reaches contact, or is pulled out of range.
⚠⚠ **And the speed division makes that louder**: on release the speed falls to zero, so the
amplitude rises to its maximum and the camera **swings further out as the finger lifts**.
Measured: a slow drag stopped mid-approach ended at `r = 3.000 m` and stayed there.

⭐ Three defensible answers, and it is the owner's call:
1. **Leave it** — an approach in progress is a real state, and resuming continues it.
2. **Return to zero on release** — the camera comes home whenever no finger is carrying the body.
3. **Hold the amplitude at its last moving value** — removes the lift-swings-out effect without
   moving the camera at all on release.

### ⛔⛔⛔ THE JITTER, AND WHAT MEASURING IT FOUND — 2026-09-19

> *"when I increase the swing speed gain or the swing speed exponent, the orbit of the camera
> becomes jittery: there seems to be steps in the orbit and it goes back and forth during the
> delta position movement. especially the swing speed exponent."* — *"although the delta position
> movement is quite regular."* — the owner

⭐⭐⭐ **THAT SECOND SENTENCE IS THE DIAGNOSIS.** A steady hand with a stepping camera means the
steps are in the **estimator**, not the input. `terminalSpeedPxPerS` measures over whatever samples
fall inside a 40 ms window, so as the boundary crosses a sample the baseline jumps (32 ms ↔ 40 ms)
and the reading changes **±11% for an input with no variation at all**. ⛔ And
`dA/A = −n · dspeed/speed` multiplies that by the exponent before it reaches the camera — which
is *"especially the swing speed exponent"*, named exactly.

✅ **FIXED BY SMOOTHING `A`** with a one-pole filter, `τ = 120 ms` (three estimator windows — the
standard rule of thumb for swallowing a step of that period, and about a tenth of an approach).
⛔ It smooths the AMPLITUDE and never the speed: three other rules read that number and there is
one definition of *how fast is this finger*.
⚠ Frame-rate independent (`1 − e^(−dt/τ)`), and it **cannot move the endpoints** — `θ = A·sin(πp)`
is exactly zero at `p = 0` and `p = 1` for any `A`.

Measured steady-state ripple, as a fraction of the maximum swing:

| setting | τ = 0 | τ = 120 |
|---|---|---|
| gain 0.02, exp 1 | 16.7% | **1.1%** |
| gain 0.02, exp 2 | 25.0% | **1.7%** |
| at or below the knee | 0% | 0% — the clamp holds `A`, which is why the defaults felt fine |

### ⛔⛔⛔ AND THE MEASUREMENT FOUND A SECOND, LARGER FAULT: THE EXPONENT DIAL DID NOT TUNE

⚠⚠ Written as dictated, `gain × speed^exponent`, the knee sits at `(1/gain)^(1/exponent)` — so
raising the exponent **drags the knee down**: at `gain = 0.0083` from 120 mm/s to **11** at
`exp = 2` and **5** at `exp = 3`. Every real drag is then far past it and the swing collapses to
**1–3% of the slider**. ⛔ The dial annihilated the effect instead of tuning it, and near that
knee is precisely where the noise amplification is steepest — so the two faults had one cause.

✅ **Grouped to `(gain × speed)^exponent`**, the knee is `1/gain` for **every** exponent:
**gain chooses WHERE damping starts, exponent chooses HOW SHARPLY it bites.** Measured:

| gain 0.0083 (knee 120) | 60 mm/s | 120 | 240 |
|---|---|---|---|
| exp 1 | 100% | 100% | 50% |
| exp 2 | 100% | 100% | 25% |
| exp 3 | 100% | 100% | 13% |

⚠ **It departs from the literal dictation** (`1/(gain × speed^expon)`) and is reported as such;
one character of difference, and it is what *"so I can finetune the effect"* asks for.

⚠ **AND MY OWN INSTRUMENT LIED TWICE ON THE WAY** — recorded because it nearly set the τ wrong:
a synthesised drag with two CDP round-trips between moves is not a regular drag, and a ripple
measured over the whole series reads the filter's own **transient** (8.9%) instead of its ripple
(1.1%). ⭐ A settling filter has to be allowed to settle before it is judged.

### ⛔⛔⛔ A ROTATION MUST NOT ORBIT THE CAMERA — device-reported, 2026-09-19

> *"when the follower is orange and the mode is rotation and pioneer and follower objects are
> within the offset radius, a rotation of the pioneer controls the rotation of the follower (which
> is normal) but also controls the camera to orbit which is not wanted."*

⭐⭐⭐ **THE CAUSE: `p` IS A FUNCTION OF THE SURFACE GAP, AND ROTATION CHANGES THE GAP.** Turning
two boxes moves their closest points, so `gapBetween` returns something different and the swing
advances although **nothing approached**. ⚠ In `FOLLOW` both bodies turn, which is why the report
names orange. ⛔ The owner's spec is explicit: the swing accompanies *"the translation of the
Follower"*.

✅ **THE SWING NOW FREEZES UNLESS A TRANSLATING GRIP DRIVES IT.** It holds where it is rather
than springing home — springing home is also a motion the hand did not ask for.

⚠⚠ **AND FREEZING ALONE WAS NOT ENOUGH.** While frozen, a rotation can move the gap a long way,
so resuming the drag would **jump** the camera to whatever the new gap implies — trading a
continuous unwanted orbit for a discontinuous one. ⭐ Cured by re-basing the trigger gap:
`g0' = gap / (1 − p)` is the `g0` that makes the new geometry mean the angle already on screen, so
the resumption is exactly continuous.

⛔⛔ **AND THAT RE-BASE FAILED SILENTLY THE FIRST TIME.** Computing `p` from the LIVE gap makes
it the **identity** — `gap/(1−(g0−gap)/g0) = g0` — so the fix did nothing while looking correct
and keeping the suite green. ⭐ The frozen progress must be captured **once**, on the frame the
translation stopped; a vector pins both halves.

### ⚠⚠ AND THE FOURTH RENDER-FILE MUTANT OF THE DAY

Written as a `.find()` and an `if` inside `scene.ts`, **both** fixes could be deleted with the
whole suite still green — including the deletion that reinstates the exact reported defect.
✅ `swingDriverIndex` and `freezeProgress` are now in `approach_swing.ts` with vectors.
⛔⛔ *A RULE IN A RENDER FILE IS A RULE NOTHING CAN INTERROGATE* — four times in one day
(the TDZ crash, the missing `applyCamera`, the Pioneer capture lookup, and this). ⚠ The standing
lesson for this branch: **write the decision in `src/input/`, and let `scene.ts` hold only the
state and the call.**

### ✅ RELEASING MID-APPROACH NO LONGER JUMPS — device-reported, 2026-09-19

> *"if the follower object's touch is released during a translation within the offset radius, the
> camera shall not jump back to its transform when the pioneer-follower entered the offset radius
> (this creates an unwanted jump): instead the camera shall keep its current transform."*

⛔⛔ **THE CAUSE**: the capture verdict is computed from the **held** bodies (`refreshHighlight`
builds its ids from `router.objects()`), so a release empties it, `inRange` goes false, the latch
drops — and the offset the camera was leaning on vanishes in a single frame.

✅ **THE FIX IS TO ABSORB, NOT TO SUPPRESS.** `OrbitController.absorb` folds the live lean into
the orbit's own yaw and elevation, so the pose is **identical** and there is nothing left to
vanish. ⭐ It needs no special case for *which kind of ending this was*: at contact and on a clean
separation the offset is already zero, so absorbing is a no-op there, and a decision not taken
cannot be taken wrongly.
⚠ The elevation is clamped exactly as `orbitOffset` clamps it, so a swing that was saturated
against a ring absorbs to that ring and the pose still does not move — otherwise releasing near a
ring would jump by however far the clamp had been hiding.

### ⚠⚠ THE FIFTH RENDER-FILE MUTANT, AND THIS ONE IS **NOT** CLOSED

`absorb` itself has five vectors and four mutants die on it. ⛔ But **deleting the call** in
`scene.ts` — which reinstates the reported jump exactly — still leaves the whole suite green,
because the call site is wiring in the render file.

⭐⭐ **THE REMEDY, NOT TAKEN HERE**: move the swing's STATE (`swing`, `swingAmp`,
`swingFrozenProgress`, `appliedSwingYaw`) into a small `ApproachSwing` object in `src/input/`,
with `arm`, `advance` and `end` — then `end` cannot forget to absorb, because absorbing is what
`end` *is*, and the whole state machine becomes vectorable. ⚠ It is a refactor on a **trial
branch the owner may discard**, so it is offered rather than done. Five instances so far: the TDZ
crash, the missing `applyCamera`, the Pioneer capture lookup, the freeze/re-base pair (extracted),
and this.

### ⛔⛔⛔ THE SWING SHIPPED **INVERTED** — device-reported, 2026-09-19

> *"I have seen a case where the follower object was within the offset radius and was translating
> delta position x negative and the camera orbited to the left and bottom. how is that possible?
> (i thought delta position x negative would trigger camera orbit to the right and up)."*

⭐⭐⭐ **A DOUBLE NEGATION, AND `orbit.ts` WARNS ABOUT IT BY NAME**: *"`IN1` shipped yaw AND
pitch inverted for exactly that reason, twice."* ⚠ I read *"opposite to the dx movement"* and
negated — without checking which way the yaw axis actually points.

✅ **MEASURED THIS TIME, NOT REASONED.** At the boot pose the camera sits on `+z` looking at the
origin, so `+x` is screen-right:

| | |
|---|---|
| yaw **+30°** | `x = −0.667` — camera **LEFT** |
| yaw **−30°** | `x = +0.667` — camera **RIGHT** |
| `+v` | `y: 0.686 → 1.452` — camera **UP** |
| `drag` with a RIGHTWARD finger | yaw **decreases** → camera toward `+x` — **with** the finger |

⛔ So *"opposite to dx"* is `sign(dx)`, the **identity** — not its negation. `dx < 0` → negative
yaw → camera right, which is what the owner expected.

⚠⚠ **AND THE COMMENT ABOVE `drag` IS WHAT MISLED ME**: *"if fingers move up and right, camera
orbits down and left"* describes the apparent motion of the **scene**, not the camera's position.
✅ Three vectors in `tests/orbit.test.ts` now state the axis convention as a MEASUREMENT, so the
next reader does not have to interpret prose. `METHOD`: *a claim in prose is not a tested claim.*

⭐⭐ **THE PITCH NO LONGER MIRRORS.** It takes the swing angle's MAGNITUDE, so the camera leans
**up** whichever way the part travels — the owner's sentence names one vertical direction for both
axes. ⚠ Sharing the signed angle would show `+x` and `−x` approaches from opposite sides
vertically, and a hand comparing them would be comparing two different views. Mirroring is one
line if that is preferred.

✅ **AND THE SWING IS NOW ON THE HUD** — `sign`, `p`, `yaw`, `g0`, the latched `dx` and
driven/FROZEN. ⛔ A trial rule with three latched quantities and an invented sign is one a hand
cannot debug from outside: this report took two screenshots and a numeric probe to resolve, and
the readout answers it at a glance.

### ⭐⭐⭐ A SELECTOR: `approachRetargetsOrbit` — added 2026-09-19

> *"make a flag with slider with two selection positions: case 1: current build, case 2: when the
> pioneer and follower enter the offset radius, the yellow target of the camera orbit shall switch
> to the barycenter of pioneer-follower objects (same as if the switch of barycenter was triggered
> by the user input)."* — the owner

⛔ `0` = **case 1**, the current build. `1` = **case 2**. Defaults to `0`, so what boots is what
was there and case 2 is something a hand turns on to compare — the comparison that settled `D28`
and `IN13`. ⚠ A **rule selector, not a tunable**, exactly like `pioneerTranslates`, and
`validateGestureConfig` refuses anything between the two.

⭐ *"Same as if triggered by the user input"* is taken literally: it calls `centreBlend.retarget`
then `syncCentre` — the same two calls `recomputeOrbitCentre` makes — so the marker jumps at once
and the camera **migrates**. ⛔ Assigning the centre directly would put back the jump the blend
exists to remove. A vector pins that `pairBarycentre` is the **same point** the ray machinery
would have picked for that pair, which is what makes the two paths interchangeable.

⚠⚠ **AND THE FIRST BUILD RETARGETED INVISIBLY.** `centreBlend.advance` is called from the
**orbit-drag branch only**, so during an object translation the target moved and the camera never
migrated to it — measured on the tablet as `→0%` forever, with `c=` frozen at `(0,0,0)`.
✅ The blend is now advanced by the translating finger's own travel, in the same millimetres the
orbit uses, so the centre arrives *as the gesture progresses*. ⚠ Gated on the selector, so case 1
is byte-for-byte what it was.
⭐ Measured after the fix: `(0,0,0) → (−0.10,−0.12,0) → (−0.08, 0.00, 0)` with the blend showing
`→99%` then `→94%` — the centre tracking the pair.

⚠ **TWO RENDER-WIRING MUTANTS SURVIVE HERE TOO** (the selector test, and case 2 firing when the
selector is 0). Sixth and seventh instances — see the `ApproachSwing` remedy above.

### ⛔⛔⛔ THE DIRECTION WAS STILL WRONG, AND THE SIGN WAS NEVER THE PROBLEM — 2026-09-20

> *"I am referring to the previous issue of camera yaw when follower and pioneer cross offset
> radius: sometimes the yaw is to the left bottom, sometimes it is to the right up for the same
> delta position x. We did not solve the issue."* — the owner, against build `001a8a6`

⭐⭐⭐ **THE 2026-09-19 FIX WAS CORRECT AND IT FIXED THE WRONG HALF.** `sign(dx)` *is* the
answer to *"which way is opposite to this travel"*; what was passed into it was **not this
approach's travel**. Two independent faults, both in the render file, both invisible to 974
vectors:

1. ⛔⛔ **`lastTranslateRightPx` was *the last non-zero horizontal travel ever applied*, and
   NOTHING EVER RESET IT** — not a lift, not a release, not a new gesture, not a different body.
   It survived whole gestures.
2. ⛔⛔ **The capture's rising edge needs no motion at all to fire.** `highlightedPair` sets
   `inRange` **before** it ever consults the movement mode, so an approach arms on a **press
   inside the band**, on a **rotation** that moved the closest points, or on a **pinch** that
   rescaled `D49`'s camera-distance threshold. In every one of those the sign came from
   whatever had moved last — possibly the opposite direction, possibly a different object,
   possibly minutes earlier.

⚠ The owner's own test loop is the worst case for it: approach → contact → **lift** → press
again (the pair is still inside the band, so it re-arms **on the press**) → drag. The lean's
direction is then inherited from the previous drag, and the same `dx` leans either way
depending only on how the band happened to be entered.

⭐⭐ **MISTAKE SHAPE 2, EXACTLY** — *measuring a DIFFERENT QUANTITY than the one asked for.*
The question is *which way is this approach travelling*; the answer given was *which way did
anything last travel*. ⚠ And the declared fallback made it worse: `swingSignFor(0)` returned
`+1`, so *"I have no idea"* became a confident 30° lean. `LESSONS_CARRIED` §6: **a degenerate
input returns `null`, never a default.**

✅ **THE FIX, AND IT IS ONE LINE OF LIFETIME.** `frameTravelRightM` accumulates the travel rule
6 applies and is **consumed and zeroed by `refreshHighlight` every frame**, so the arming edge
can only ever read *the travel that crossed the threshold*. `swingSignFor` returns
**`1 | -1 | null`**, `swingYawRad(p, A, null)` is **0**, and the HUD prints **`sign⛔?`** with
`dxArm=0.00mm` — so *no direction* is distinguishable on the glass from *the wrong direction*,
which it was not before.
⛔ **NO MAGNITUDE THRESHOLD, and that is `A11` doing its job**: §1.1's deadband emits the excess
only, so a resting finger emits exactly zero and any non-zero travel is motion a hand committed
to. A second threshold here would guard against noise that has already been removed.
⚠ **THE COST, STATED**: an approach that crosses the threshold **without** a horizontal
translation — a depth push, a rotation, a press already inside the band — now gets **no swing at
all**, and a hand has to pull apart past the offset and come back in to arm one. ⭐ That is the
honest reading of the dictation, which is about *"the translation of the Follower … on the
camera x horizontal axis"* and nothing else. ⛔ Deliberately **no late adoption**: adopting a
sign mid-approach would have to re-base `g0` to the remaining gap, and a swing compressed into
the last millimetre is a 30° jolt.

### ⚠⚠ AND A SECOND MECHANISM IS STILL LIVE — IT IS A FEEL DECISION, NOT A DEFECT

⛔ The lean is a function of the **gap** and of a sign latched at the trigger, so **inside the
band it does not care which way the finger is going**:

* easing back from `p = 0.8` to `p = 0.5` **increases** the lean — the camera leans further in
  the same direction while the finger travels the other way;
* **pulling apart from contact** runs the whole half-sine again, out and back, in the direction
  of the approach that armed it.

⚠ Both read exactly like the reported symptom, and neither is fixed by the sign. ⛔ They cannot
both be fixed and the dictation kept: *"the lean is a function of the gap, zero at both ends"*
and *"the lean always opposes the current dx"* are **incompatible** — making the sign live would
mirror the lean through `2A` the instant a finger reverses.

⭐ **The one-line option, if a hand dislikes it**: freeze the progress whenever the gap is
**opening**, exactly as it already freezes when no translation drives it. ✅ Contact still comes
home (`p = 1`), and separating from contact no longer swings the camera at all. ⚠ The cost: a
hand that backs off mid-approach and leaves the band keeps the lean it had, absorbed — the
camera stops coming home on its own. **The owner's call.**

## ⚠ What has NOT been judged

✅ **THE SPEED DIALS HAVE BEEN SET BY A HAND** — the owner, 2026-09-19:
`approachSwingDeg = 30`, `approachSwingSpeedGain = 0.015`, `approachSwingSpeedExponent = 1.7`. ⛔ The knee is `1/gain` =
**67 mm/s**: the full 30° up to about 40 mm/s, half by 100, and under 5° at 200. ⭐ All three replace my guesses (25° / 0.0083 / 1.0) — the first numbers in this file to be
judged rather than reasoned.

⛔⛔ **The swing has had no finger on it.** The boot scene is confirmed by screenshot; the lean
itself, its amplitude and its feel are entirely unjudged. every number in the swing is now the owner's (30° / 0.015 / 1.7), but they were set from the SLIDERS — what is still unjudged is whether the mechanism HELPS — in this project a guessed number has been wrong every single time.
✅ **`0` on the slider disables the whole mechanism**, which is how to A/B it by finger in the same
minute on the same scene — the comparison that settled `D28` and `IN13`.

## To discard the trial

Delete `src/input/approach_swing.ts` and `tests/approach_swing.test.ts`, restore the two
`bootRotations` arguments in `scene.ts`, delete `bootAlignment` and its one call, the `swing` /
`frameTravelRightM` declarations (and the `+=` in rule 6 and the zeroing in `refreshHighlight`),
`swingYawNow`, the arming block in `refreshHighlight`, the
`approachSwingDeg` tunable and its slider, and the `yawOffsetRad` parameter on `OrbitController.pose`.
⭐ Nothing else depends on any of it.
