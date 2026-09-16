# THE BUILD QUEUE — one list, every subsystem

> **STATUS** · live · **OWNS** · what gets built next, for the whole project
> **READ IF** · you are starting any build, or wondering where an item stands
> **LAST VERIFIED** · 2026-09-16

⛔ **THIS IS THE ONLY QUEUE.** Do not start a second list, in a subsystem folder or
anywhere else. Do not reorder it to be helpful.

⭐ Each row's full history goes in `queue_notes/<ID>.md`. The `Notes` column is a
pointer, not the record. **A status changes in BOTH places or neither.**

`Sub`: `IN` = 10_INPUT_TOUCH · `GAME` = 20_GAME_RULES · `3D` = 30_OBJECTS_3D ·
`RND` = 40_RENDER_SCENE · `DEP` = 50_BUILD_DEPLOY · `SEC` = 60_SECURITY_COMPLIANCE ·
`CORE` = cross-cutting.

---

## ⭐⭐⭐ YOU ARE HERE (2026-09-16) — the input layer is done bar `IN3`

✅ TypeScript + Babylon + Vite; `npm run verify` = typecheck + **607 golden vectors,
all passing** (37 → 607). ✅ The engine boundary is enforced by a test.
✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/ (`DEP1d`), gated on
`npm run verify`.

### What works, by finger, on a real device

✅ **`IN1` CLOSED** — the recognizer: commit point, provisional motion with rollback,
tap / double-tap / hold, the release-time priority ladder, screen-plane yaw/pitch, and
roll. ✅✅ **`IN9` CLOSED** — both camera rules, pinch zoom and orbit, working by
finger. ✅✅ **`IN2` CLOSED** — the three latched roles.

✅✅ **AND THE WHOLE TWO-TOUCHPOINT SET IS CLOSED BY A DEVICE LOOK (2026-09-16)** —
*"everything is working"*: **`A10`** depth (still holder, moving anchor), **`A11`** §1.1 as
a per-axis position deadband, **`A12`** roll on the second touchpoint's x, **`A13`** one
touchpoint translates and a second held still rotates, **`A14`** a lift-and-replace is one
gesture. ⭐ That is what `1.0.4` is: **translation with one finger.**

⛔ **`A15` IS BUILT AND ITS DEVICE LOOK IS OWED** — a holder that is no longer *under* its
object gives the selection up: a raycast at the second touchpoint's lift, and the unselect
**deferred** to the next input event. ⚠ It is the first exception to `IN2`'s latch, and the
ray, the deferral and the re-resolution are all in `src/render` where no vector reaches
them. → [`queue_notes/IN8.md`](queue_notes/IN8.md).

### ⭐⭐⭐ `1.0.5` — THREE FORKS FROM ONE BUILD, and what each owes a hand

⭐ The owner is A/B-ing three readings of §2/§4 and will judge them **holistically**, once
the input system can be felt as a whole (`D26`, `D27`, row `IN13`). ⛔ **All three run from
one build**, so every later row lands in all of them:

| flag | fork | one touchpoint | second touchpoint |
|---|---|---|---|
| `0` | **A** — `A13`. ⚠ Was the default until 2026-09-16, and still the only fork closed by a device look of its own | translates | held still → rotate |
| `1` | **B** — the **spec's** own assignment | rotates | → translate |
| `2` | **C** — `A16`. ⛔⛔ **THE DEFAULT SINCE 2026-09-16** | translates until a tap says rotate, and the mode **survives a release** | **tap** → toggle, immediately; **press** → depth *or* roll |

⭐⭐ **Fork C is not an inversion of the other two**, which is why it is a fork and not a
setting: A and B read the mode from **presence**, C from a **discrete tap**. ⚠ Two
consequences worth carrying into the comparison — **C cannot have the defect `A14` fixed**
(no lift-and-replace gap for the mode to fall through), and in C the second finger drives
**one axis, never both**, so a roll and a depth push need a tap between them.
⛔⛔ **Two device corrections on 2026-09-16**: the toggle is **immediate** (a deferral was
built and felt as lag — a double tap now flips twice and also resets the camera, accepted in
the owner's words) and it is a **session MODE**, surviving a release, which retires the
*"rotation costs a tap every time"* cost I had stated against the fork.

⛔ **What fork C owes a hand, specifically**: whether the axis purity beats `A12`'s
two-axes-at-once; and whether a tap on a **different** object should toggle too, which is
deliberately left to rule 5 / 6bis. → [`queue_notes/IN13.md`](queue_notes/IN13.md).
⚠ **The flag latches only while nothing touches the glass**, and the HUD names the live
fork — a device report that does not name it is unattributable.

✅✅ **THE OBJECT MODEL IS AUTHORITATIVE** (`3D1`, closed 2026-09-15): every gesture writes
`src/core/object_model.ts` and the render loop draws `SWAY ∘ FOLLOW ∘ model`.
⚠ **This block said *"nothing yet touches an OBJECT for real"* until 2026-09-16**, and it is
corrected rather than deleted: it was true on day one and stopped being true when `3D1` was
wired. ⛔ What remains true is narrower — rule 2bis runs **without its §1.4 precondition**
(an empty constraint stack), which is what `IN3` adds.

✅✅ **AND THE PAGE NOW KNOWS WHICH BUILD IT IS** (`DEP1d`, closed on the device
2026-09-16). ⛔ A confirmed fix was reported broken from Pages on a tablet running an old
bundle: `index.html` is served `max-age=600` and the assets are content-hashed, so a cached
index loads a superseded hash **indefinitely**. ⭐ The page checks `version.json` on boot and
replaces itself once, and the HUD's last line is `build <sha>[+dirty]  <UTC minute>`.
⚠ **Read it before judging any gesture** → [`queue_notes/DEP1d.md`](queue_notes/DEP1d.md).

### ⛔⛔ THE FIVE MISTAKES THIS PROJECT KEEPS MAKING — they bind `IN3`/`IN4`

Thirty-five defects have been found **by finger** (thirty-four of them; one by composing a measurement with a threshold), and **not one was visible to a green
suite**. They are **five** shapes, not thirty-five problems — the fifth is below, and it is
the one that costs a correct implementation rather than a broken one:

⭐⭐ **THE LEDGER, so the number stops drifting.** It is one count, kept HERE, and it is
the sum of the rows' dossiers — not a figure anyone restates from memory:

| row | defects found BY FINGER | record |
|---|---|---|
| `IN1` — the recognizer | **14**, over seven device passes | [`queue_notes/IN1.md`](queue_notes/IN1.md) |
| `IN9` — rule 1, orbit | **3** | [`queue_notes/IN9.md`](queue_notes/IN9.md) |
| `IN9` — rule 4, pinch zoom | **0** — five device checks, all passed | [`queue_notes/IN9.md`](queue_notes/IN9.md) |
| `IN2` — pointer plumbing | **0** — the `IN8` consequence was judged on the glass and ACCEPTED, which is a verdict, not a defect | [`queue_notes/IN2.md`](queue_notes/IN2.md) |
| `IN4` — rule 6, translate | **1** — the `STATIONARY` latch, overturned first try | [`queue_notes/IN4.md`](queue_notes/IN4.md) |
| the sympathetic sway | **1** — re-trigger on a CHANGE OF DIRECTION, missing | this block, below |
| `3D1` — the model wiring | **1** — the render loop drew only objects that HAPPENED to have a follower, so a translated object was LOCKED until something else created one, then JUMPED | [`queue_notes/3D1.md`](queue_notes/3D1.md) |
| **A8** — the roll's start | **1** — a circle does not read as a roll until `rollAngle` of arc, and the yaw/pitch applied meanwhile was never undone, so the roll began from a pose nobody asked for | [`../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../10_INPUT_TOUCH/AMENDMENTS_R5.md) A8 |
| **A6** — depth, from below | **1** — *"chaotic on the bottom ring"*: "away" RISES on screen seen from above and SINKS seen from below, and the rule hard-coded the first | [`../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../10_INPUT_TOUCH/AMENDMENTS_R5.md) A6 |
| **A6** — the gate | **1** — it re-decided every frame against a speed floor, so a hand SLOWING or REVERSING dropped into rule 6, whose dy is now gravity: *"blends into a translation along gravity"* and *"drifts along the gravity axis"*. **Two reports, one cause** | same |
| **A6** — the gate, again | **2** — the latch I added exited on a **windowed** divergence, which is RATE-DEPENDENT: an idle anchor never exited below ~100 mm/s, and a turnaround skew spiked it so reversals still leaked. And a finger moving ALONE still moved the object, because the displacement was half of each finger's own delta and halves sum to the AVERAGE. ⭐ Both fixed by changing the QUANTITY: divergence measured cumulatively from the latch, and the object driven by the SHARED travel | [`../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../10_INPUT_TOUCH/AMENDMENTS_R5.md) A6 |
| **A9** — the rotation jitters | **1** — 2bis and rule 6 integrate the RAW per-event delta, and the pointer noise is 0.761 mm MEASURED, so a still finger turns a held object: *"there are some jumps in the rotation"*. ⭐ A **deadband**, queued as `IN12` | [`queue_notes/IN12.md`](queue_notes/IN12.md) |
| **A10** — §1.1 cannot see rest | **1** — ⛔⛔ **the speed was a rate over ONE SAMPLE PAIR**, so with the measured 0.761 mm of noise a resting finger read ~95 mm/s and **STATIONARY was unreachable**; the settle bound also sat below the noise. ⚠ Found by BUILDING the first rule that asks, not by a finger — and invisible to eight device passes because nothing else depended on re-entering STATIONARY | [`queue_notes/IN0.md`](queue_notes/IN0.md) |
| **A11** — the settle asymmetry | **1** — *"when I switch from x/y to depth translation… there is no depth translation for a while and then suddenly it is triggered"*, while the other direction was instant. ⛔ Entering MOVING was a DISTANCE test; returning to STATIONARY was TWO durations in series (~900 ms). ⭐ Fixed by the owner's model: §1.1 is a position deadband and the settle timer is gone | [`queue_notes/IN0.md`](queue_notes/IN0.md) |
| **A8** — the roll's commit dropped its own angle | **1** — *"in rotation, when I switch from yaw/pitch to roll… there is a big jump at one point."* The rebase undid the swept yaw/pitch, and the scene then applied only ONE FRAME of roll against a `lastRollDeg` that had tracked the uncommitted phase — so ~60° of swept roll was silently dropped. ⭐ The owner's own third guess was right: *"anchoring on a previous quaternion which is now far away"* | [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| **A11** — a still finger emits no events | **1** — ⛔⛔ §1.1 is driven by `pointermove`, and a resting finger sends none — so the tracker froze at `MOVING` and `STATIONARY` was unreachable *for the exact case the rule is about*. ⭐ The asymmetry is structural: MOVING is entered by an event that necessarily exists, STATIONARY by one that by definition may not arrive. ⚠ **It survived two fixes to the THRESHOLD before anyone checked the CLOCK**, and the owner said so: *"there is something wrong you did not explain nor check"* | [`queue_notes/IN0.md`](queue_notes/IN0.md) |
| **A11** — the band taxed the drag | **1** — *"the object translation is less fluid than when we had no depth translation built in."* ⛔⛔ The trailing anchor sits one radius BEHIND, so a REVERSAL had to cross the whole dead circle: **5.0 mm of dead travel, 88 ms at 50 mm/s** — more than ten times rule 6's entire follower time constant, as pure dead time in front of it. ⭐ Fixed by a distinction the first version missed: **the band gates the way OUT of rest, not the motion itself**. A reversal now costs one sample | [`queue_notes/IN0.md`](queue_notes/IN0.md) |
| **A13** — a tracker outlived its finger | **1** — *"I release the second touchpoint and press it outside any object… the first object continues translation and then switch to rotation."* ⛔⛔ Motion trackers were keyed by POINTER ID, and **browsers reuse ids after a release** — so a new finger inherited the old one's anchor position and read `MOVING` at once, which under A13 means the holder keeps translating. ⭐⭐ **The same trap `router.ts` already guards and explains**: I copied the map and not the guard. Fixed structurally — keyed by the router's never-reused `seq` | [`queue_notes/IN0.md`](queue_notes/IN0.md) |
| **A11** — rest ON the band boundary | **1** — a finger stopping DEAD parks at **exactly** one band from the centre, so the `<=` comparison is made at its exact value on every sample — and computing the centre as `p − band` then re-deriving `p − centre` is a **round trip through floating point** that returns ~1e-14 too large. ⛔ The axis then never became `STATIONARY`. ⚠ Invisible at a 2.3 mm band, exposed by the owner raising it to 3.5 mm. ⭐ Fixed by carrying the signed OFFSET instead of a position | [`queue_notes/IN0.md`](queue_notes/IN0.md) |
| **A13** — a mode keyed on MOTION, again | **1** — *"if I transition quickly there is a translation then a rotation, if I transition slowly there is directly a rotation."* ⛔⛔ A finger PLACED QUICKLY skids as it lands, so it read `MOVING` for the length of the landing and the mode followed it. ⭐⭐ **The cell was mine, not the owner's** — the four rules never named *both moving*, and I resolved it as translate. Now **presence alone** decides the mode. ⛔⛔⛔ **`IN4` recorded the identical verdict on 2026-09-14**, and A13 flagged the resemblance before shipping the defect anyway: *naming a risk is not the same as not taking it* | [`queue_notes/IN4.md`](queue_notes/IN4.md) |
| **A14** — the gap inside a lift-and-replace | **1** — *"cases 2 and 3 differ by timing of the input."* ⛔⛔ Between a lift and the replacing press there is genuinely ONE touchpoint down, so `A13` translated through the middle of a 150–300 ms swap — visible whenever the holder happened to be moving at the time, invisible when it was not. ⭐⭐ **The RULE was right and the GESTURE MODEL was wrong**: a lift-and-replace is one intention. ⭐ A grace keyed on the LIFT (discrete, deliberate) rather than on a motion state. ⚠ Found by the owner's own observation that the two cases differed only by WHEN they moved | [`queue_notes/IN4.md`](queue_notes/IN4.md) |
| | **= 35** | |

⭐⭐ **AND ONE REPORT THAT DID NOT SURVIVE INVESTIGATION, kept because it is the more useful
entry.** *"You destroyed the rotation around the gravity axis... it came back to the axis of
the screen view plane"* — withdrawn by the owner (*"it's alright: the logic is right"*) after
`tests/a7_wiring.test.ts` composed the gravity frame with the rotation and asserted the axis
that comes out, at four tilts including the bottom ring. ⛔ Every part of A7 already had
green vectors and **the composition had none** — mistake shape 4 pointing the other way, at a
correct piece of work. ⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent
property* — and measuring it is what separated a real defect from an impression, in both
directions at once.

⭐⭐ **AND A SECOND ONE, 2026-09-16 — A REPORT AGAINST A BUILD THE DEVICE WAS NOT RUNNING.**
*"When I test it on github page, I still see the issue with transition from translation to
rotation lagging"*, hours after the fix for it had been confirmed by finger over USB.
⛔ The gesture code was **identical on both surfaces**: the Actions history shows the fix
deployed at 05:28, two minutes *before* the USB session, and there is no dev/prod gating
anywhere in `src/`. ⭐ The tablet was running an **old bundle** — Pages serves `index.html`
with `Cache-Control: max-age=600` and the assets are content-hashed, so a cached index keeps
loading a superseded hash *indefinitely*. ⭐⭐ **So it is the withdrawn-`A7` shape one layer
lower**: the report was truthful, the reasoning from it was sound, and the unchecked premise
was *"both surfaces run the same code"*. ⚠ **Not counted as a gesture defect** — `A13`/`A14`
were right — but it is a real defect of the **deploy surface**, and it is fixed in the
product rather than in a procedure: `src/core/build_gate.ts` (16 vectors) plus a build stamp
on the HUD — ✅✅ **closed on the glass the same day** (*"working on device"*), and the full
account is [`queue_notes/DEP1d.md`](queue_notes/DEP1d.md). ⭐ `METHOD`: *a device report is evidence about the code the device was running.*
⚠ It also exposed a second thing, and this one was never a report at all: the HUD's
**overridden-tunables line has never been rendered**, for the whole life of the file, while
`40_RENDER_SCENE/INDEX.md` said it was. ⛔ An absent readout cannot be caught by looking at
the screen. Both are in `METHOD` now.

⛔ **Amend the ledger, never a bare number written somewhere else.** That is exactly how
this drifted: `README.md` said *seventeen* (the total before rule 6 and the sway) and
`40_RENDER_SCENE/INDEX.md` said *sixteen*, both frozen snapshots of a number that had
moved on. Both now point here instead of carrying a count of their own.
⚠ **Tuning judgements are NOT defects and are not counted** — the owner raising a gain, or
rejecting rotation inertia, is the loop working, not a fault found.

1. **A rate estimated over the shortest available baseline.** Flick lift speed, roll
   direction, roll curvature. ⭐ *State the window, and check the signal clears the
   noise, BEFORE writing the threshold.*
2. **Measuring a DIFFERENT QUANTITY than the one asked for.** The tangent's turning
   instead of the angle about a centre — invisible until a finger reversed. ⭐ *When an
   estimator is hard, ask whether you replaced the quantity rather than improved it.*
   ⛔⛔ **AND THE SHAPE GOT INTO A GUARD WRITTEN TO CATCH IT.** The sagitta criterion
   computed `rollStepDistance² / (8 × rollRadiusMax)` — a fixed 13 mm chord at the
   LARGEST radius — while `roll.ts` sizes its window as `max(rollStepDistance,
   radius × arc)`. It was reading a span the product never fits, at the radius where
   that span never binds: 0.352 mm claimed against ~3.3 mm real, and the binding case
   is the SMALLEST radius, not the largest. ⭐ Quantity *and* direction wrong, for
   eight device passes, inside the check that exists to prevent exactly this.
3. **IDEALISED FIXTURES.** Roll vanished from the deployed page with every vector
   green, because every fixture was a perfect circle. ⭐ *Build the imperfect specimen
   and the negative first.*
4. **A COMPOSITION NOBODY COMPUTED.** Radius and height were each interpolated
   correctly; their `hypot` was never checked, and gave three segments from three
   rings. ⭐ *`METHOD` already says this — ask what the whole chain does, in one
   expression.*

⭐⭐ **AND A FIFTH SHAPE EMERGED ON 2026-09-14: MY OWN FIXTURES.** Four false alarms in one session, every one of them a measurement bug rather than a code bug — comparing the object AFTER a step against the finger BEFORE it; a float loop taking one extra step; a window opened before two transients had finished; two frame rates given unequal total durations. ⚠ Each looked exactly like a real defect and one of them nearly got a correct implementation "fixed". ⭐ *State the instant each quantity is evaluated at, and step fixtures with integers.* ⛔ The tell for an unfinished transient versus a discretisation error: halve the timestep. Discretisation shrinks; a transient does not.

⭐ And **three times** a **device judgement overturned a confident synthetic
measurement**. When they disagree, suspect the metric. ⛔ The third: measuring
`pointerNoiseMm` (0.15 → **0.761 mm**) made the sagitta guard reject a configuration
seven device passes had already accepted. The finger was right and the guard was wrong.

### ⭐⭐ `IN5` is now practical, and mostly unblocked

Tunables override from the **URL** (`?motionDeadbandMm=3.5&gainRollDrag=3`), and the orbit
rings have an on-screen **tuning menu** that validates and explains refusals — so a
placeholder can be A/B'd by finger without a rebuild.
⭐ Measure **`pointerNoiseMm` FIRST**: the instrument is **built and on the HUD** as of
2026-09-14 (`src/input/noise_meter.ts`, line `noise floor=… now=… n=… cfg=…`). Hold one
finger still for a few seconds and read `floor`. The sagitta criterion and several other
thresholds are only defensible relative to it. ⛔ **Reading it is the owner's step** —
nothing in a suite can hold a finger on glass. ✅ **DONE 2026-09-14: 0.761 mm**, five
times the placeholder. ⚠ A resting-finger floor is not gameplay; it is used for the
sagitta rule only, where over-estimating is the safe direction.
⛔ ⭐ **The meter's own vectors found a hole in the meter's own vectors.** Three of four
naive alternatives failed as designed; the fourth — a window that only ever GROWS —
passed everything, because the minimum is taken while the window is still short. It
would have pinned the answer in the first 0.3 s, so a finger still settling as it lands
could never improve its reading. A fifth vector now covers it. ⚠ Mistake shape 1 again:
a statistic taken over the shortest available baseline.
⛔ `tests/config_debt.test.ts` now refuses any tunable nothing reads — after three
orphans (`moveExitDistance`, `tiltDeadband`, `gainRoll`).

⛔⛔ **`3D1` IS BUILT AND CLOSED (2026-09-15) AND NEXT IS `IN3`.** The object model is
`src/core/object_model.ts`, 42 vectors, and every gesture on the glass now drives it.
⭐ `IN3` has everything it needs: the constraint stack is attached to an object, so rule
2bis can finally ask *"is the stack empty"* — the precondition it has been missing.
⚠ `IN11` is also unblocked and needs no device: is 2bis's free rotation path-dependent?
✅✅ **`IN12` IS CLOSED** — `A11` put the deadband in §1.1 itself rather than in each rule,
so every rule reads the same side of it and none consumes a raw delta.

### ⭐⭐ WHAT THE 2026-09-15 SESSION SETTLED, beyond the rows

**`A7`/`D18` — every object gesture stands on a GRAVITY FRAME.** Yaw about the world
vertical, pitch about the horizontal screen axis, roll and A6's depth about the view
direction **flattened onto the ground**; rule 6's `dy` becomes a true vertical.
⭐ `GravityFrame` and `ScreenFrame` are deliberately **distinct types**, so the compiler
stops the two from being interchanged — `anchor_rotate.ts` still wants the true view axis.

**`A8` — a roll REBASES to the start of its circle.** A circle is not read as a roll until
60° of arc; the yaw/pitch applied meanwhile used to stand, so the roll began from a pose
nobody asked for. It now rewinds to the FIT WINDOW's start — ⛔ **not to the press**, so a
straight drag that precedes a circle survives, because that drag was asked for and is not
part of the evidence for a circle.

**`A6`/`D17` — depth is a DRIVER and a VALIDATOR.** The finger on the object supplies ALL
the motion; the second finger **anywhere** only authorises it by following the same `dy`
within a percentage ratio, with explicit HOLD windows at a reversal and at a late start.
⛔⛔ **Five models were built and a hand rejected four of them** — a mean, a latch, a
cumulative exit, a shared minimum, a faded blend. ⭐ **The transferable part: a BLEND HAS
SEAMS.** Every version that mixed the two fingers' travel produced a discontinuity
somewhere, and *"it jumps erratically"* arrived within minutes each time. The owner's model
— one finger drives, the other votes — has no seam because nothing is mixed.
⭐ And the two ambiguities were named by the owner before any code: **at a reversal both
travels pass through zero**, and **a validator that starts late is not a different
gesture**. Both are answered by HOLDING, not by deciding.

**`A9`/`IN12` (since ABSORBED BY `A11`) — and one report that DID NOT SURVIVE.** *"You destroyed the rotation around
the gravity axis… it came back to the axis of the screen view plane"*, withdrawn by the
owner once `tests/a7_wiring.test.ts` composed the frame with the rotation and asserted the
axis that comes out, at four tilts including the bottom ring. ⛔ Every part of `A7` had
green vectors and **the composition had none** — mistake shape 4 aimed at a CORRECT piece
of work. ⭐⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent property*, and
measuring it is what separated a real defect (no deadband) from an impression.


### ⭐⭐ THE SYMPATHETIC SWAY and the CAMERA GUARDS — built 2026-09-14

⭐ The scene reacts to what the held object does instead of standing frozen around it, and
the camera has three guards (a deferred orbit centre, suppression while an object is held, a
double-tap fly home). ⛔ Both are **decoration and camera policy rather than queue state**,
and both are kept out of everything that MEANS something — the barycentre reads home
positions with the sway subtracted.
⭐⭐ **Moved to [`../40_RENDER_SCENE/INDEX.md`](../40_RENDER_SCENE/INDEX.md) on 2026-09-16**,
with their tunables and the measured false-kick rates, when this file passed its cap. ⚠ The
sway's re-trigger on a CHANGE OF DIRECTION was found by finger and is counted in the ledger
above.

### ⛔⛔ TWO THINGS A NEW SESSION MUST NOT REBUILD

Both were built, MEASURED, and taken out. They are recorded because the ideas are
attractive and will occur to anyone reading this code.

1. **Inertia and a phantom lead on the object's ROTATION.** Built 2026-09-14 as
   `src/input/spin.ts` — a critically/under-damped follower on the rotation vector of the
   error, with the branch cut handled and 12 vectors green. ⛔ **The owner rejected it on
   the device: *"I did not like the rotation inertia and slerp implementation."*** Rotation
   stays direct. ⚠ Do not re-derive it because translation has it: they were judged
   separately and came out differently.
2. **Telling the follower how fast the TARGET is moving** (`targetVelocity` in
   `follow.ts`). Arithmetically right — it makes a dragged object's trail frame-rate
   exact, 0.32 mm instead of 0.74 mm at 120 Hz. ⛔ **It made everything visibly jitter and
   was reverted.** Pointer events and render frames are not locked, so the per-frame target
   delta alternates (a frame with no event sees 0, the next sees double) and the lag term
   writes that beat into the position: frame-to-frame step change went from 1.12 mm to
   3.25 mm at 90 Hz pointer / 60 Hz frame, and 1.63 → 4.58 at 60/120.
   ⚠ **Mistake shape 1, committed in the file that warns about it.** Smoothing the
   estimate does not rescue it — the estimate is not the problem, the BEAT is. And the
   thing it bought was invisible: both trails are under the measured 0.761 mm pointer
   noise. ⭐ *An invisible 0.4 mm of trail is not worth a visible 2 mm of jitter.*

### ⭐ AND A NUMBER THAT CAME OUT OF THAT: the inertia has a FLOOR

The target only moves when a pointer event lands, so it arrives as a staircase of about
`speed ÷ pointer rate` — ~1.1 mm at 100 mm/s. **The mass is what smooths it**, which
means `translateInertiaMs` must be at least about one pointer interval (**8–12 ms**) or
the beat between the pointer clock and the frame clock is visible as jitter, whatever
else is tuned. Measured: 1.0–1.6 mm of wobble at τ = 1 ms against 0.43–0.69 mm at τ = 8 ms.
⚠ That is why the shipped τ is 7.6 ms and not lower.

### ⭐⭐ THE ORDER, and why `3D1` is not next after all

**`IN2` → rule 6 translate → `3D1` → 6bis onward.**

⭐ **`IN4`'s dependency on `3D1` IS NOT UNIFORM, and that is what reorders the queue.**
Rule 6 (screen-plane translate) is defined on *the selected object* plus a screen
frame — no faces, no connectors, no assembly tree. Rules **6bis / 6ter / 6quater** are
defined on `AxisBtwFaces`, *the axis between the centres of the two selected FACES*,
and a face centre is exactly what `3D1` owns. ⭐ Same reason `IN9` shipped ahead of
`3D1`: ask what a rule actually reads, not which phase it is filed under.
⛔ So translation goes as far as rule 6 **and must stop there**.

⛔⛔ **AND RULE 6 IS A COMPOSITION — mistake shape 4's exact territory.** §1.2 scales
translation gains by `cameraDistance / referenceCameraDistance`, so rule 6 is
`translate × zoom × orbit`: one millimetre of finger means a different world
displacement at every camera distance, and the orbit surface now makes that distance
**asymmetric** (1.14 m at the top ring against 0.71 m at the bottom).
⭐ **Compute what ONE MILLIMETRE of finger does at both zoom extremes BEFORE writing
the gain.** Not after a device session is spent disliking it — and not as a check
bolted on afterwards, which is how the orbit surface got three segments from three
rings.

⚠ `3D1` remains the last thing between here and actual assembly, and it is where
mistake shape 4 is most likely to recur: an assembly tree composes transforms through
parent-child chains, which is what cost the predecessor a week. ⭐ Write the composite
check BEFORE the code, not after.

## Phase IN — the touch input system

Design of record: [`../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| IN0 | Units, motion states, flick test | IN | feature | ✅ **CLOSED**, and §1.1 has had **FOUR formulations** — the first three all broke on a real pointer. ⭐ Now a **per-axis position deadband** (`A11`): time-free, exact, and robust by construction rather than by a threshold above a measurement. ⚠ `motionDeadbandMm` is the most load-bearing number in the input layer. ⭐⭐ **The most instructive file in the project** → [`queue_notes/IN0.md`](queue_notes/IN0.md) | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ✅ **CLOSED 2026-09-14.** 109 new vectors. **7 device passes, 14 defects none of which a green suite could see.** ⚠ It also carries rule **2quinte**'s roll detector, built early and hardened — `IN3` inherits it. → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature ⛔⛔ **AND ITS LATCH NOW HAS EXACTLY ONE EXCEPTION** (`A15`/`D25`, 2026-09-16): `relatchOnOrphan`, callable on a **discrete** event only — a second touchpoint's lift, after a raycast shows the holder's object is no longer under it. ⭐ The header's *"never revisited"* was REWORDED rather than deleted: what the latch protects against is a role recomputed from a CONTINUOUS reading, frame after frame. ⚠ 8 more vectors, including the one that proves the holder does not demote itself to `SECOND` on its own object | ✅✅ **CLOSED 2026-09-14**, 22 vectors, confirmed by finger — `src/input/router.ts`, engine-free and generic over an opaque object handle. Three roles: `OBJECT` / `OUTSIDE` / `IGNORED` (`IN8`), each latched at press for the touchpoint's lifetime; §0 order-independence keyed by pointer id, both release orders as vectors. ✅ **Device look done**: the `IN8` consequence — lift the holding finger with a second finger still on the same part and **the part stops responding** — was judged on the glass and accepted, which makes reading 1 an accepted BEHAVIOUR and not merely an accepted decision. ⭐ Pinch and orbit were re-checked too, since the plumbing was replaced underneath them. ⭐ A vector pass found **two vectors that could not fail** and fixed them → [`queue_notes/IN2.md`](queue_notes/IN2.md) | IN1, IN8 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | 🔨 **IN PROGRESS, and the only input row with unbuilt work left.** ✅ Built but **NOT WIRED**: the eviction shake (`shake.ts`, 15 vectors) and 2sexte + `A3`'s handover (`anchor_rotate.ts`, 25 vectors). ⛔ Not built: 2bis's §1.4 precondition, roll on an anchored object, 2ter/2quater, the triangle→`FaceId` mapping. ⭐ Unblocked — `3D1` gives it the constraint stack and the face centres → [`queue_notes/IN3.md`](queue_notes/IN3.md) | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | ✅✅ **RULE 6 CLOSED 2026-09-15** — confirmed by finger in ordinary play, not only in a tuning session. ⭐ It has mass: a critically/under-damped follower plus a phantom lead, and its gain was **computed** (1.0 puts the object exactly under the finger). ⛔ **6bis / 6ter / 6quater wait on face centres** — now unblocked by `3D1`. ⚠ Rotation has **no inertia**: built and rejected on the device → [`queue_notes/IN4.md`](queue_notes/IN4.md) | IN2, 3D1 (6bis onward only) |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued, and ⭐⭐ **practical without a rebuild**: every tunable overrides from the URL and the menu validates refusals. ✅ `pointerNoiseMm` = **0.761 mm** is the one number MEASURED (2026-09-14) — and measuring it exposed a defect eight device passes had accepted. ⛔⛔ **A TRAP TO READ BEFORE BOOKING A SESSION**: several tunables are still READ but sit OFF the gesture path, so `config_debt` sees them used while they change nothing → [`queue_notes/IN5.md`](queue_notes/IN5.md) | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued. ⭐ `IN1`'s rollback snapshot is the same object — `PosePort<P>` in `recognizer.ts` is the seam | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — was undefined and reachable (§5) | IN | decision ⭐⭐⭐ **AND A15 / `D25` (2026-09-16) — A HOLDER THAT IS NO LONGER UNDER ITS OBJECT GIVES THE SELECTION UP.** Depth slides the object along the view axis *while the holder holds still*, so it leaves the finger carrying it — and §4's latch kept that finger holding it anyway. ⭐ A **raycast at the second touchpoint's lift**; if the object is not there, the selection drops **at the next input event** and the §4 table re-resolves (orbit for a finger over empty space — ⛔ keeping the **previous yellow centre**, owner's call). ⭐ First and only exception to `IN2`'s latch, on a discrete event only. 16 vectors, no new tunable. ⛔ **A DEVICE LOOK IS OWED** → [`queue_notes/IN8.md`](queue_notes/IN8.md) | 🔧 **ANSWERED THREE TIMES AND BUILT.** ⭐ The second touchpoint — inside **or** outside any object — drives **roll by its x** and **depth by its y** while the holder is still (`D22`/`A12`, `A10`). ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16.** ⭐⭐ The small-object hole owed since `A5` is closed: the depth anchor may be anywhere. ⛔ `A15` then added: a holder no longer **under** its object gives the selection up — **device look owed** → [`queue_notes/IN8.md`](queue_notes/IN8.md) | IN2 |
| IN9 | ⭐ **CAMERA-ONLY rules: 4 (pinch zoom) and 1 (orbit)** — ⛔ needed NO object model, so it did not wait on `3D1` | IN | feature | ✅✅ **CLOSED 2026-09-14**, both rules working by finger. 56 vectors. Rule 1 cost **three** defects no green suite could see — including a **composition nobody had computed** (three rings gave three monotone segments) and a scheme **reversed on measurement** when the owner's ring shape overshot. ⭐ *"Three rigs, therefore two transitions"* is now enforced by `validateGestureConfig`. → [`queue_notes/IN9.md`](queue_notes/IN9.md) | IN1 |
| IN10 | Orbit about the point under the finger, not the barycentre | IN | feature | queued — ⛔ **deliberately behind `3D5`**, not behind a date: the scene holds **three** small objects and the barycentre is still the thing being worked on, while the catalog's case is explicitly about a model large enough that it is not. ⚠ Reopens a CLOSED row (`IN9`), and collides with three things: the yellow marker is where double-tap flies home to, pivot popping needs easing, and the orbit centre is already suppressed while an object is held. Prior art: conventional DCC/CAD, pre-1995 → [`queue_notes/IN10.md`](queue_notes/IN10.md) | IN9, 3D1, 3D5 |
| IN11 | ⭐ **Is rule 2bis's free rotation PATH-DEPENDENT?** — a debugging row | IN | defect? | queued, and ⭐⭐ **UNBLOCKED — it needs no object model**. 2bis is applied as a per-frame increment about two fixed axes, which do not commute, so out-and-back by a DIFFERENT route may not return the object. ⚠ Retracing the SAME path does close, which is why a tuning session would never show it. ⭐ **Write the square-path vector FIRST and confirm it FAILS against today's code**; the answer is a curve against drag angle, not a yes/no, and the fix (pure function of total displacement) has its own cost — A/B it. ⛔ Must not undo the world-frame axis composition or the axes latched at press → [`queue_notes/IN11.md`](queue_notes/IN11.md) | IN1 |
| IN12 | ⭐ **A DEADBAND on the pointer delta** | IN | defect | ✅✅ **CLOSED 2026-09-15 BY `A11`, AND NOT THE WAY THIS ROW SPECIFIED IT.** The owner made §1.1 *itself* a position deadband, so the excess-only travel is computed ONCE and every rule reads the same side of it — rather than each rule deadbanding its own `dx`/`dy`. ⭐ The **residual/catch-up form** this row recommended is what shipped, and its continuity vector is the one that separates it from the two broken forms. ⛔⛔ **AND THE ONE THING I SAID THIS ROW GOT WRONG, IT DID NOT.** I argued per-axis was a mistake because a square band makes a diagonal drag travel 1.41× further. ⭐ The owner restored it for a reason I never considered — **axis purity**: a square band gives a CORRIDOR along each axis in which the other emits nothing, so a nearly-horizontal drag is purely horizontal. A radial band cannot do that at any radius. ⭐⭐ **A threshold has a SHAPE as well as a size, and the shape decides things the size cannot.** Measured after the change: reversal cost is still one sample, so the corridor was bought for nothing. ⛔ Still owed: a device pass — `motionDeadbandMm` is now the commit threshold, the rest test and the jitter deadband at once, and nobody has judged it by finger → [`queue_notes/IN12.md`](queue_notes/IN12.md) | IN1, IN4 |
| IN13 | ⭐⭐ **WHICH TOUCHPOINT ASSIGNMENT SHIPS** — fork A (`A13`, one-finger translate), fork B (the spec's, two-finger translate) or ⭐ fork C (a second touchpoint TAPPED toggles the ongoing drag; PRESSED it keeps every meaning it has) | IN | decision | 🔧 **OPEN BY DESIGN, and the mechanism is BUILT (2026-09-16, `D26`).** Both readings run from **one build** — `?touchpointAssignment=1` or a menu toggle — because the whole difference is **one inversion in `holderDrive`**: depth, roll, `A14` and `A15` all key on *the holder is still*. ⭐ So the two compare **by the same hand in the same minute on the same scene**, and both forks get every later row for free. ⛔⛔ The flag latches **only while nothing touches the glass** (owner) — the only state in which no gesture can be in flight; a mid-gesture flip is deferred, not dropped, and the HUD says `⛔PENDING`. ⚠ **The verdict is NOT due until the input system can be judged as a whole** — it is a claim about a session of assembly work, not about one drag. ⭐⭐ **FORK C added 2026-09-16 (`D27`/`A16`) and it is NOT an inversion**: A and B compute the mode from presence, C from a discrete TAP — so **C structurally cannot have the defect `A14` fixed**. ⚠ Its trade: rotation costs a tap every time. ⛔ A toggling tap is CONSUMED, or toggling twice would reset the camera. 27 vectors, three mutants caught → [`queue_notes/IN13.md`](queue_notes/IN13.md) | IN4, IN8 |

## Phase 3D — objects and assembly

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| 3D0 | Mate connectors + residual; constraint stack + solver | 3D | feature | ✅ **built 2026-09-13**, carried and covered | — |
| 3D1 | The object model: id, placement, connectors, assembly tree (parent ≠ root) | 3D | feature | ✅✅ **CLOSED 2026-09-15** — *"locked/jumping fix is working"*. `src/core/object_model.ts`, 42 vectors, engine-free: placement, faces, connectors, the assembly tree and the constraint stack. ⭐⭐ The vectors were written FIRST and **falsified on purpose** — breaking the composition turns 14 of 42 red. ⭐ `reroot` implements **parent ≠ root** and moves nothing. ⛔ The pass found one wiring defect: the render loop drew only objects that HAPPENED to have a follower → [`queue_notes/3D1.md`](queue_notes/3D1.md) | 3D0 |
| 3D2 | Snap transform + capture radius + seat | 3D | feature | queued | 3D1 |
| 3D3 | Break on residual, and re-arm on exit | 3D | feature | queued | 3D2 |
| 3D4 | Real 3D file import (glTF) | 3D | feature | queued | 3D1 |
| 3D5 | ⚠ The tree has never held more than two objects | 3D | risk | carried, unclosed | 3D1 |

## Phase RND — scene and rendering

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| RND0 | Scene stub: camera, **three boxes**, face picking | RND | feature | ✅ built 2026-09-13 — diagnostic only. ⚠ **Three, not two** (`objectA`/`B`/`C`), and the third is deliberately **off-axis and off-plane**: three collinear objects put every barycentre on one line where the ray cannot tell them apart, so §2 rule 1 would look tested while exercising nothing. `2³ − 3 − 1 = 4` candidates | — |
| RND1 | Constraint visibility: per-entry glyphs, hard vs soft (§6) | RND | render | queued | 3D1 |
| RND2 | Mate preview: ghost + drop line | RND | render | queued | 3D2 |
| RND3 | Anchor ring during two-touchpoint gestures (§4) | RND | render | queued | IN2 |
| RND4 | Off-screen target indication — Halo / Wedge | RND | render | queued. ⭐ Not general polish: **6ter and 6quater need BOTH objects selected**, and at close zoom the partner is routinely off-frame, so the gesture becomes unreachable with nothing to say why. Curvature (Halo) or a tapered wedge encodes direction AND distance without a camera snap. ⚠ Audience includes youth — cap the indicator count. Prior art: Baudisch & Rosenholtz CHI 2003; Gustafson et al. CHI 2008 | 3D1, IN4 |

## Phase DEP — build and deployment

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| DEP0 | Vite + TS + vitest, `npm run verify` | DEP | infra | ✅ built 2026-09-13 | — |
| DEP1a | ⭐⭐ **Device loop over USB (Android)** — `adb reverse`. No network exposure AND `localhost` is a SECURE CONTEXT, so tilt + sensors work | DEP | infra | ✅✅ **WORKING 2026-09-13** on the Lenovo TB-X606F — two cubes confirmed on the device. ⭐ `adb reverse`, NOT Chrome port forwarding; the fix for the stuck handshake was the REAL `adb`. Procedure + 3 traps: `50_BUILD_DEPLOY/DEVICE_TESTING_USB.md` | DEP0 |
| DEP1b | Device loop over LAN — for iOS, or a second device. ⚠ needs a Private network + a scoped firewall rule (`scripts/allow-lan-dev.ps1`) | DEP | infra | queued | DEP0 |
| DEP1c | ⭐ **HTTPS on the LAN** (`@vitejs/plugin-basic-ssl`) — the only way to get a secure context on iOS over Wi-Fi | DEP | infra | queued — needed before rule 1 (tilt) can be tested on iPhone | DEP1b |
| DEP1d | GitHub Pages via Actions — real HTTPS anywhere, ⚠ slow loop | DEP | infra | ✅ **LIVE 2026-09-13** — https://dsug1.github.io/3d_assembly_game/ . Procedure: `50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md`. ⛔⛔ **AND IT SERVED A STALE BUILD FOR A MORNING (2026-09-16)**: `max-age=600` on `index.html` plus content-hashed assets means a cached index loads a superseded bundle **indefinitely**, and a confirmed gesture fix was reported broken on a tablet that had never fetched it. ✅✅ **FIXED AND CLOSED BY A DEVICE LOOK 2026-09-16** — *"working on device"*. The page checks `version.json` on boot and replaces itself once (`src/core/build_gate.ts`, 16 vectors), and the HUD prints the build id. ⭐ The plain URL is trustworthy again; a `?v=` is the refresh's marker, not something to type. → [`queue_notes/DEP1d.md`](queue_notes/DEP1d.md) | DEP0 |
| DEP2 | Capacitor shells for iOS/Android | DEP | platform | queued | DEP1 |
| DEP3 | Desktop shell (Tauri) | DEP | platform | queued | DEP2 |
| DEP4 | CI: typecheck + vectors on every push | DEP | infra | ✅ **rides in `pages.yml`** — the deploy is gated on `npm run verify` | DEP1d |

## Phase SEC — privacy, stores, compliance

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| SEC0 | THIRD_PARTY_NOTICES seeded, ships with the binary | SEC | governance | ✅ 2026-09-13 | — |
| SEC1 | Privacy policy + store disclosures for a youth audience | SEC | governance | open — before any submission | — |
| SEC2 | Shipping-build hygiene: compile-time-disable any capture | SEC | shipping | open — at package time | DEP2 |
| SEC3 | Dependency tree pinned by hash | SEC | infra | queued | DEP4 |
| SEC4 | ⭐ **Freedom-to-operate review of the GESTURE SET** | SEC | governance | open — before any commercial release (`D3`). ⭐ Its input exists as of 2026-09-15: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md) tags every rule prior-art / internal-composition / ⚠ novel-composite, so a review reads a table instead of a codebase. ⛔ **Three rules are marked NOVEL COMPOSITE** — §4's 6bis, 6ter and 6quater. ⚠ The camera mathematics does **not** need this review; the catalog is explicit that the litigated territory is multi-finger gesture composition | — |

## Phase GAME — the game proper

Nothing scheduled. ⭐ When it starts, rows go **here** with the right `Sub` tag —
never in a second queue in that folder.
