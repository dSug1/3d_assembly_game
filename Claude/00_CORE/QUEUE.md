# THE BUILD QUEUE — one list, every subsystem

> **STATUS** · live · **OWNS** · what gets built next, for the whole project
> **READ IF** · you are starting any build, or wondering where an item stands
> **LAST VERIFIED** · 2026-09-15

⛔ **THIS IS THE ONLY QUEUE.** Do not start a second list, in a subsystem folder or
anywhere else. Do not reorder it to be helpful.

⭐ Each row's full history goes in `queue_notes/<ID>.md`. The `Notes` column is a
pointer, not the record. **A status changes in BOTH places or neither.**

`Sub`: `IN` = 10_INPUT_TOUCH · `GAME` = 20_GAME_RULES · `3D` = 30_OBJECTS_3D ·
`RND` = 40_RENDER_SCENE · `DEP` = 50_BUILD_DEPLOY · `SEC` = 60_SECURITY_COMPLIANCE ·
`CORE` = cross-cutting.

---

## ⭐⭐⭐ YOU ARE HERE (2026-09-15) — the input layer is done bar `IN3`

✅ TypeScript + Babylon + Vite; `npm run verify` = typecheck + **480 golden vectors,
all passing** (37 → 480). ✅ The engine boundary is enforced by a test.
✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/ (`DEP1d`), gated on
`npm run verify`.

### What works, by finger, on a real device

✅ **`IN1` CLOSED** — the recognizer: commit point, provisional motion with rollback,
tap / double-tap / hold, the release-time priority ladder, screen-plane yaw/pitch, and
roll. ✅✅ **`IN9` CLOSED** — both camera rules, pinch zoom and orbit, working by
finger.

⛔ **Nothing yet touches an OBJECT for real.** The rotation in `scene.ts` is a
diagnostic stand-in; `IN3` builds rule 2bis and deletes it.

### ⛔⛔ THE FIVE MISTAKES THIS PROJECT KEEPS MAKING — they bind `IN3`/`IN4`

Thirty-one defects have been found **by finger** (thirty of them; one by composing a measurement with a threshold), and **not one was visible to a green
suite**. They are **five** shapes, not twenty-six problems — the fifth is below, and it is
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
| | **= 31** | |

⭐⭐ **AND ONE REPORT THAT DID NOT SURVIVE INVESTIGATION, kept because it is the more useful
entry.** *"You destroyed the rotation around the gravity axis... it came back to the axis of
the screen view plane"* — withdrawn by the owner (*"it's alright: the logic is right"*) after
`tests/a7_wiring.test.ts` composed the gravity frame with the rotation and asserted the axis
that comes out, at four tilts including the bottom ring. ⛔ Every part of A7 already had
green vectors and **the composition had none** — mistake shape 4 pointing the other way, at a
correct piece of work. ⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent
property* — and measuring it is what separated a real defect from an impression, in both
directions at once.

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

Tunables override from the **URL** (`?rollAngle=45&rollFilterBeta=0`), and the orbit
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
⭐⭐ **`IN12` IS SMALLER THAN EITHER AND CAN GO FIRST** — the deadband on `dx`/`dy` (`A9`),
which is the live defect a hand is feeling right now.

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

**`A9`/`IN12` — and one report that DID NOT SURVIVE.** *"You destroyed the rotation around
the gravity axis… it came back to the axis of the screen view plane"*, withdrawn by the
owner once `tests/a7_wiring.test.ts` composed the frame with the rotation and asserted the
axis that comes out, at four tilts including the bottom ring. ⛔ Every part of `A7` had
green vectors and **the composition had none** — mistake shape 4 aimed at a CORRECT piece
of work. ⭐⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent property*, and
measuring it is what separated a real defect (no deadband) from an impression.


### ⭐⭐ THE SYMPATHETIC SWAY — built 2026-09-14, and NOT in the spec

The scene reacts to what the held object does instead of standing frozen around it. ⛔ It
is **decoration, and it is kept out of everything that MEANS something**: the barycentre
reads home positions with the sway subtracted, so the orbit centre cannot depend on
whether the objects happened to be mid-wobble when a finger landed.

* **Translation** — the other objects drift the SAME way and spring home
  (`translateSwayMm` 0.8 mm, 180 ms, re-trigger 50°, reference 120 mm/s).
* **Rotation** — they swing as a rigid BLOCK about the held object's centre, on the axis
  it is turning about: each orbits the pivot AND spins by the same angle
  (`rotateSwayDeg` 0.3°, 180 ms, re-trigger 60°, reference 90°/s).
* **Both scale with how fast the object set off**, ×0.3…×4.5 — one proportionality gives
  both halves of *"slow translation, slow spring; rapid translation, rapid spring"*,
  because a bigger excursion still peaks at the same τ and so covers that ground faster.

⛔ **Both re-trigger on a CHANGE OF DIRECTION, and that is the part that was missing.**
The first build fired only when the finger started moving — but `motionState` does not
fall back to `STATIONARY` until 150 ms below 6 mm/s, so a hand reversing at speed never
goes still and the scene sat frozen through an entire shake. ⚠ Found by finger.

⭐ **Both direction tests are measured over a stated window, and both floors came from
the MEASURED pointer noise.** A per-sample direction is noise: at 8 ms between samples,
0.761 mm of jitter IS ±95 mm/s, and a still finger fired **272 false kicks in 3 s**.
Translation now reads displacement over 60 ms and needs 3× the noise to claim a heading;
rotation reads the NET rotation over 100 ms and needs 3× the noise seen through
`gainRotateFree` (≈ 3.05° per sample), which is 0 false kicks and a floor of 92°/s.

### ⭐ CAMERA GUARDS, built 2026-09-14

* **The orbit centre is DEFERRED by `orbitCentreGraceMs`** (120 ms). Two fingers outside
  is a PINCH, not an orbit, and they never land in the same instant — committing on the
  first one moved the marker and retargeted the camera for a gesture meant as a zoom.
* **And it is suppressed entirely while an object is held**: a touchpoint outside while a
  finger is on a part is rule 6's ANCHOR, and that gesture will never orbit.
* **Double-tap FLIES the camera home** — anywhere on the glass, eased over
  `cameraResetMs` (450 ms). ⭐ Home is the **last yellow target**, not the origin: only the
  angles and the zoom go back to their launch values, because the centre is the thing the
  user has been orbiting. ⭐ It eases the ORBIT PARAMETERS, not the camera transform, so
  the camera stays on the orbit surface the whole way — yaw takes the short way round and
  zoom interpolates geometrically, neither of which is a lerp.
  ✅✅ **The collision with §2 rule 2septies is RESOLVED** (`D12`→`D15`, 2026-09-15): eviction
  moved to a **quick back-and-forth**, so a double-tap now means one thing only. ⭐ The reset
  never moved — eviction did, twice: off the double-tap, then off the roll channel once
  `D14` gave that channel back to a real control.

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
| IN0 | Units, motion states, flick test | IN | feature | ⛔⛔ **REOPENED AND FIXED 2026-09-15 — §1.1 COULD NOT SEE A FINGER COME TO REST.** A10's depth gate is the first rule that asks *"is that finger still?"*, and the answer was **no, for any real finger, for ever**. Two causes, both found by composing the MEASURED noise with the thresholds: (1) ⛔⛔ **the speed was estimated over ONE SAMPLE PAIR — mistake shape 1, in the file that defines *moving***: `0.761 mm / 8 ms = ~95 mm/s` of apparent speed AT REST against a 6 mm/s threshold, so settle candidacy was destroyed on essentially every sample; (2) the settle-excursion bound (0.8 mm) sat BELOW the noise floor (0.761 mm RMS), and a bound the noise cannot fit inside is one a resting finger can never satisfy. ⭐ Fixed the way `flick.ts` already prescribes — **speed over a stated window, never the last pair** — plus a validator rule (`SETTLE_NOISE_MULTIPLE`) and four re-sized numbers. ⭐⭐ **MEASURED both ways**: four seconds of rest never came back before; under a second after. The old estimate is kept as a counter-example vector. ⚠ **Why eight device passes missed it: nothing shipped depended on RE-ENTERING STATIONARY** — the commit threshold reads the MOVING *transition*, rule 6 reads presence, the flick test reads lift speed. ⭐ `METHOD`: *a composition is a thing to MEASURE* — the threshold and the measurement were each fine and their composition was not. ⚠ **A device pass is owed**: a drag now commits at 3.2 mm instead of 1.5 mm, and STATIONARY takes ~0.9 s to return. Previously: ✅ **built 2026-09-13**, 37 vectors. ⚠ §1.1's "accumulated travel" replaced by net displacement — see the dossier. ✅ its `moveExitDistance` debt closed by `IN1` | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ✅ **CLOSED 2026-09-14.** 109 new vectors. **7 device passes, 14 defects none of which a green suite could see.** ⚠ It also carries rule **2quinte**'s roll detector, built early and hardened — `IN3` inherits it. → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | ✅✅ **CLOSED 2026-09-14**, 22 vectors, confirmed by finger — `src/input/router.ts`, engine-free and generic over an opaque object handle. Three roles: `OBJECT` / `OUTSIDE` / `IGNORED` (`IN8`), each latched at press for the touchpoint's lifetime; §0 order-independence keyed by pointer id, both release orders as vectors. ✅ **Device look done**: the `IN8` consequence — lift the holding finger with a second finger still on the same part and **the part stops responding** — was judged on the glass and accepted, which makes reading 1 an accepted BEHAVIOUR and not merely an accepted decision. ⭐ Pinch and orbit were re-checked too, since the plumbing was replaced underneath them. ⭐ A vector pass found **two vectors that could not fail** and fixed them → [`queue_notes/IN2.md`](queue_notes/IN2.md) | IN1, IN8 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | 🔨 **IN PROGRESS.** ✅ **The eviction shake is BUILT** (2026-09-15, `src/input/shake.ts`, 15 vectors, engine-free, not yet wired). ⭐⭐ Its non-obvious decision: **a circle projects to a back-and-forth on every axis**, so the detector is defined as oscillation ALONG AN AXIS — without that, spinning an anchored part to look at it would evict, which `A3` made reachable. ⭐ Falsified before trusted: removing straightness reddens the circle vector, removing the leg hysteresis reddens the nudge. ⭐ `suppressesFlick` arms on the FIRST reversal, which is the flick guard A4 demands. ✅ **2sexte + A3's handover BUILT** (`src/input/anchor_rotate.ts`, 25 vectors): every rotation is about the CONSTRAINT axis, and *the anchor survives* is asserted directly — with rotating about the VIEW axis as the counter-example, swinging the normal >30° off target. ⭐⭐ **A finding for `anchorHandoverCos`**: the near side's excursion is `r·sin α`, so a rad/mm gain turns the object at the same rate while the motion FADES — the drag goes quiet over a range *before* it becomes undefined, so the handover must happen while it is still visible. ⚠ **Three of my own fixtures were wrong in that one file**, each looking like a code defect (mistake shape 5); all caught by deriving the geometry independently. ✅ **`scene.ts` WIRED to the object model** — see the `3D1` row. ⭐⭐ Also landed `src/input/display_pose.ts`: the chain `SWAY ∘ FOLLOW ∘ model` as ONE expression, engine-free and vectored, written BEFORE the rewiring as the `3D1` row demanded. Its RIGIDITY vector had never existed — both half-implementations pass a pairwise-distance test, so only an orientation assertion separates a block from a crowd. ✅✅ **`A7` AND `A8` LANDED 2026-09-15 and both are on the glass**: every object gesture now stands on a **GRAVITY FRAME** (`src/input/gravity_frame.ts` — yaw about the world vertical, pitch about the horizontal, roll about the view direction flattened onto the ground), and a roll **REBASES** to the start of its circle instead of keeping the yaw/pitch swept before the 60° commit. ⭐ `A7`'s composition is vectored END TO END in `tests/a7_wiring.test.ts` at four camera tilts — ⛔ which is what settled a report that the gravity frame had regressed: it had not, and the owner withdrew it. ⛔ **`A9`/`IN12` is the live defect instead**: no deadband on `dx`/`dy`, so a still finger turns a held object. ⛔ Still to do: 2bis's precondition, **face selection from the picked NORMAL** (not `faceId` — triangle ordering is an engine detail), 2ter/2quater + the flick skip, wiring the shake to eviction, the two handover tunables with sliders, and ⛔ **the device pass that closes both `IN3` and `3D1`**. ⛔ **It also CLOSES `3D1`**, which has no visible behaviour of its own. Three things it owns: rule 2bis's missing PRECONDITION (*an empty constraint stack* — an anchored object currently rotates freely and would silently break its own anchor), the triangle→`FaceId` mapping at the render seam, and the eviction gesture. ✅ **Four owner decisions landed 2026-09-15 and the row is fully unblocked** — `D12`/`D15` eviction is a **quick back-and-forth** (it left the double-tap, then left the roll channel too), `D13` it **spares MATEs**, `D14` **roll drives an anchored object's free DOF while 2sexte suppresses where it degenerates**, on ONE handover constant with hysteresis. ⛔ Non-negotiable: **skip the flick test once one reversal is seen**, or an abandoned shake ADDS a constraint. Amendments A1–A4 → [`queue_notes/IN3.md`](queue_notes/IN3.md) | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | ✅✅ **RULE 6 CLOSED 2026-09-15** — 8 vectors, and confirmed by finger in ORDINARY PLAY, not only in a tuning session (`src/input/translate.ts`). ⭐⭐ **The gain was COMPUTED before it was written**: the honest value spans **20x across the zoom clamp** and another 1.6x across screen sizes, so it is a MULTIPLIER on a computed tracking factor and **1.0 means the object sits exactly under the finger** — the first gain on this project with a correct value rather than a preferred one. ⚠ It **supersedes §1.2's `referenceCameraDistance` ratio** for this rule, and §1.2's stated rationale is backwards (scaling by distance holds the SCREEN displacement constant, not the world one). ⛔⛔ **THE `STATIONARY` LATCH I BUILT WAS WRONG AND THE DEVICE OVERTURNED IT, FIRST TRY**: rule 6 now reads **PRESENCE**, every frame — a second finger outside any object means translate, whatever it has done since it went down. ⭐ The lesson is the distinction between the signals: `MOVING`/`STATIONARY` is noisy and continuous, so §4 latches roles keyed to it; whether a finger is DOWN is discrete, deliberate and VISIBLE, and latching that hides state instead of protecting it. **Do not generalise "latch at press" to every input.** ⭐ Rule 6 also has **INERTIA** now (`src/input/follow.ts`, critically damped, exact analytic step so it is frame-rate independent and cannot diverge on a dropped frame) — `translateInertiaMs`, ⚠ the owner set it to 10 ms because at critical damping every millisecond reads as LAG. ⭐⭐ **So the model now carries a DAMPING RATIO** — Unity's `linearDamping`, dimensionless: below 1 the object **accelerates through the gap** instead of keeping a permanent distance, which is what "catch-up" means. ✅ PhysX (Unity's physics) is **BSD-3 since 4.0**, so `N13` is clear — but only its MODEL is reused, not its arithmetic: PhysX damps by `(1−c·dt)`, which is timestep-DEPENDENT and survivable only behind Unity's fixed 0.02 s step. A vector measures ours against PhysX's at that step and shows the gap is PhysX's discretisation error. ⭐ **TUNED BY FINGER OVER FIVE PASSES AND SETTLED**: gain **1.17**, τ **7.6 ms**, ζ **0.2**, phantom lead **0.2 ms** — ⚠ quote these from `gestureConfig.ts`, which is the one copy; this row carried a stale set (1.15 / 8 ms / 0.5 ms) until 2026-09-15. The object now deviates &lt;0.45 mm from the finger at 300 mm/s — under the measured pointer noise — so the entire feel lives in the **overshoot** (0.3–1.8 mm of follow-through), not in any gap. ⭐⭐ The owner also added a **PHANTOM TARGET** (`src/input/lead.ts`): the object chases a point projected ahead of the finger along the finger's own SMOOTHED velocity — feed-forward, not more feedback, and a vector fails if it is derived from the gap instead (that is just a stiffer spring). ⛔⛔ **Its computed landmark marked the WRONG END of the range**: `lead = 2·ζ·τ` (3.2 ms) makes a steady drag leave no gap at all, and the hand **shipped 0.2 ms — a FIFTEENTH of it** — after narrowing the slider twice to reach the bottom (0.5 ms was an intermediate pass, and the dossier records it as such). **A landmark tells you where a range's zero is; it does not tell you where to stand** → [`queue_notes/IN4.md`](queue_notes/IN4.md). Rule 4 ✅ via `IN9`. 6bis onward wait on `3D1`. ⭐⭐ **THE `3D1` DEPENDENCY IS NOT UNIFORM — rule 6 did NOT need it**, which is why it shipped first: rule 6 reads *the selected object* and a screen frame, while 6bis/6ter/6quater are defined on `AxisBtwFaces`, the axis between two selected FACE centres — exactly what `3D1` owns. ✅ The composition was computed BEFORE the gain, as this row demanded. | IN2, 3D1 (6bis onward only) |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued. ⛔⛔ **A GUESSED GAIN IS RELIABLY TOO SLOW — THREE FOR THREE**: every gain a hand has set was raised from my guess, by ×3.4, ×2.3 and ×2 (`gainRotateFree`, `gainOrbitYaw`, `gainOrbitElevation` — the last one on 2026-09-14, and its row had already *predicted* it was slow without that being worth anything until a finger moved the slider). `IN3`/`IN4` add seven more — **give each a slider when it is wired**, not after a session is spent disliking it. ⭐⭐ **Now practical: tunables override from the URL** (`?rollAngle=45&rollFilterBeta=0`), so a value can be A/B'd by finger without a rebuild — `src/input/config_override.ts`. ⭐⭐ **`pointerNoiseMm` FIRST** — ⭐ **instrument BUILT 2026-09-14** (`src/input/noise_meter.ts`, on the HUD as `noise floor=…`): hold one finger still and read `floor`; the sagitta criterion and several thresholds are only defensible relative to it. ✅ **READ 2026-09-14: 0.761 mm**, five times the placeholder — and measuring it exposed a defect in the sagitta guard (see the YOU-ARE-HERE block). ⚠ Then the 1€ pair by the paper's procedure (`beta`=0, lower `minCutoff` until slow jitter is acceptable, then raise `beta` until fast motion stops lagging). ⚠ `IN1` added four more (`tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`, and a moved `stillTime`) and found `stillSpeed`/`stillTime`/`moveExitDistance` are **not independent** — measure them together | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued. ⭐ `IN1`'s rollback snapshot is the same object — `PosePort<P>` in `recognizer.ts` is the seam | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — was undefined and reachable (§5) | IN | decision | 🔧 **AND NOW IT CARRIES BOTH ROLL AND DEPTH (`D22`, amendment `A12`, 2026-09-15).** The second touchpoint — **inside or outside any object** — drives the object while the holder is held still: its **x is ROLL**, its **y is DEPTH**. ⭐⭐ It retires 2quinte's circular roll, `rollAngle`'s commit threshold, the provisional yaw/pitch, `A8`'s rebase and **the jump**, because yaw/pitch (one touchpoint) and roll (two) are no longer the same hand shape and nothing has to tell them apart. ⭐ **The second time `METHOD`'s *when a rule needs a window to decide, suspect the question* has paid on this row.** ⚠ It only works because A11's deadband is PER AXIS. Previously (`D20`, `A10`): depth is a STILL HOLDER and a MOVING ANCHOR. The finger on the object holds still; the finger **outside** supplies the travel. ⛔ No window, no ratio, no tolerance — *"I don't like the conflict generated by the control of depth translation by two fingers."* ⭐⭐ **The fault was in A6's QUESTION**: *are these two travels equal?* has no answer at a reversal or a late start, and both happen every gesture. *Is that finger still?* is answerable at every instant. ⭐ **The holder wins every tie**, so rule 6 and depth PARTITION the configuration instead of competing for it — and rule 6's vertical is no longer withheld, so the hesitation at each end of every drag is gone. ⭐⭐ Rule 6's second touchpoint may now be OUTSIDE **or on the same object** (the first drives), and since the depth anchor may be ANYWHERE, **the small-object hole owed since A5 is CLOSED**. ⛔⛔ **It cost a defect in §1.1 that nothing else could have found** — see the `IN0` row. ⚠ **Device pass owed**: the feel of all four §1.1 numbers changed. Previously, as driver/validator (`A6`): One finger on the object supplies ALL the motion; a second finger **anywhere** only authorises it by following the same `dy` within a percentage ratio. ⛔⛔ **FIVE MODELS WERE BUILT AND A HAND REJECTED FOUR** — a mean, a latch, a cumulative exit, a shared minimum, a faded blend — before the owner supplied the sixth, which is the one that shipped. ⭐⭐ **The transferable part: A BLEND HAS SEAMS.** Every version that mixed the two fingers' travel had a discontinuity somewhere and *"it jumps erratically"* came back within minutes. Nothing is mixed now, so there is no seam. ⭐ The owner named both ambiguities before any code — **at a reversal both travels pass through zero**, and **a validator that starts late is not a different gesture** — and both are answered by HOLDING the last verdict rather than deciding on garbage. ⛔ A three-state verdict (`PENDING`/`COMMON`/`SEPARATE`) also forced rule 6 to **withhold the vertical while undecided**, which fixed three separate reports at once: a lurch at the start, a lurch at the end, and a cumulative vertical drift. ⚠ The stated cost: the first window of vertical travel is DISCARDED rather than released in one step — releasing it IS the jump. `gainTranslateDepth` **0.5–5, default 3.0**, by the owner's hand. Previously, as a pinch: `gainPinchDepth` had a slider, the sympathetic sway answers a push through the SAME implementation and the SAME four tunables, and the ceiling is now printed on the HUD (`depth=… [min–max] ⛔MAX`) because *"I can't see the object hitting any wall"* — a claim a device cannot check is an assertion, not a finding. ⛔⛔ **A REAL HOLE, REPORTED BY FINGER: a SMALL object cannot be pinched** — two fingers will not fit, and it worsens exactly where it hurts, since pushing a part away shrinks the target for its own next use. ⚠ **A proposal is owed and nothing is built** (owner's instruction); the owner's thought is to use two objects, which is 6ter's configuration → [`queue_notes/IN8.md`](queue_notes/IN8.md). Previously: ⭐⭐ **RE-DECIDED 2026-09-15 (`D16`, amendment A5): they are a DEPTH PINCH** on that object — pinch in pushes it away. It came from a HAND, as a fourth answer the `3D1` watch item did not offer, and it declines §3.2 DS3. ⭐ It removes `D10`'s dead end (lifting one finger now returns to rotation instead of leaving the part unresponsive). ⛔ The gain is **computed**, not guessed. ⚠ `IN2`'s `IGNORED` role survives with its trigger moved to the THIRD touchpoint, so the 22 router vectors need revisiting. Previously: ✅ **DECIDED 2026-09-14: IGNORE THE SECOND HIT**, for the moment (reading 2, a rotation axis between the fingers, is deferred not rejected). ⛔ **`IN2` is unblocked.** It binds `IN2`'s role latch: *ignored* becomes a THIRD latched outcome beside on-object and outside, and lifting an ignored touchpoint must NOT run the release verdict, flick test or tap history → [`queue_notes/IN8.md`](queue_notes/IN8.md) | IN2 |
| IN9 | ⭐ **CAMERA-ONLY rules: 4 (pinch zoom) and 1 (orbit)** — ⛔ needed NO object model, so it did not wait on `3D1` | IN | feature | ✅✅ **CLOSED 2026-09-14**, both rules working by finger. 56 vectors. Rule 1 cost **three** defects no green suite could see — including a **composition nobody had computed** (three rings gave three monotone segments) and a scheme **reversed on measurement** when the owner's ring shape overshot. ⭐ *"Three rigs, therefore two transitions"* is now enforced by `validateGestureConfig`. → [`queue_notes/IN9.md`](queue_notes/IN9.md) | IN1 |
| IN10 | Orbit about the point under the finger, not the barycentre | IN | feature | queued — ⛔ **deliberately behind `3D5`**, not behind a date: the scene holds **three** small objects and the barycentre is still the thing being worked on, while the catalog's case is explicitly about a model large enough that it is not. ⚠ Reopens a CLOSED row (`IN9`), and collides with three things: the yellow marker is where double-tap flies home to, pivot popping needs easing, and the orbit centre is already suppressed while an object is held. Prior art: conventional DCC/CAD, pre-1995 → [`queue_notes/IN10.md`](queue_notes/IN10.md) | IN9, 3D1, 3D5 |
| IN11 | ⭐ **Is rule 2bis's free rotation PATH-DEPENDENT?** — a debugging row | IN | defect? | queued, and ⭐⭐ **UNBLOCKED — it needs no object model**. 2bis is applied as a per-frame increment about two fixed axes, which do not commute, so out-and-back by a DIFFERENT route may not return the object. ⚠ Retracing the SAME path does close, which is why a tuning session would never show it. ⭐ **Write the square-path vector FIRST and confirm it FAILS against today's code**; the answer is a curve against drag angle, not a yes/no, and the fix (pure function of total displacement) has its own cost — A/B it. ⛔ Must not undo the world-frame axis composition or the axes latched at press → [`queue_notes/IN11.md`](queue_notes/IN11.md) | IN1 |
| IN12 | ⭐ **A DEADBAND on the pointer delta** | IN | defect | ✅✅ **CLOSED 2026-09-15 BY `A11`, AND NOT THE WAY THIS ROW SPECIFIED IT.** The owner made §1.1 *itself* a position deadband, so the excess-only travel is computed ONCE and every rule reads the same side of it — rather than each rule deadbanding its own `dx`/`dy`. ⭐ The **residual/catch-up form** this row recommended is what shipped, and its continuity vector is the one that separates it from the two broken forms. ⛔⛔ **AND THE ONE THING I SAID THIS ROW GOT WRONG, IT DID NOT.** I argued per-axis was a mistake because a square band makes a diagonal drag travel 1.41× further. ⭐ The owner restored it for a reason I never considered — **axis purity**: a square band gives a CORRIDOR along each axis in which the other emits nothing, so a nearly-horizontal drag is purely horizontal. A radial band cannot do that at any radius. ⭐⭐ **A threshold has a SHAPE as well as a size, and the shape decides things the size cannot.** Measured after the change: reversal cost is still one sample, so the corridor was bought for nothing. ⛔ Still owed: a device pass — `motionDeadbandMm` is now the commit threshold, the rest test and the jitter deadband at once, and nobody has judged it by finger → [`queue_notes/IN12.md`](queue_notes/IN12.md) | IN1, IN4 |

## Phase 3D — objects and assembly

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| 3D0 | Mate connectors + residual; constraint stack + solver | 3D | feature | ✅ **built 2026-09-13**, carried and covered | — |
| 3D1 | The object model: id, placement, connectors, assembly tree (parent ≠ root) | 3D | feature | ✅✅ **CLOSED 2026-09-15** — *"locked/jumping fix is working"*. The model is built, wired, exercised by every gesture on the glass, and judged by finger; the pass also **re-confirmed rule 6** after the wiring rewired its path. ⚠ `3D5` stays open: three LOOSE boxes, so the parent chain is still unexercised. ⭐ The watch item paid — DS3 declined, and amendment **A5** came out of it. Previously: ⛔ **the device pass found a defect (mine), now fixed.** The render loop walked the FOLLOWER MAP, which was populated lazily by the sway and the rotation rule; when the model became authoritative that implicit invariant died silently, and a translated object was **locked** until something else created its entry, then **jumped**. ⭐ Rotation masked it, which is why the first sweep came back clean. ⛔ 409 vectors passed before AND after the fix — the iteration set lives on the far side of the boundary. ✅ Everything else on the pass was clean, which **re-confirms rule 6** after its rewiring. ✅ **BUILT + 🔌 WIRED 2026-09-15** — `scene.ts` builds a `World` and **every rule now writes the model**; the render loop is the SINGLE writer of a mesh transform. ⭐⭐ Before this, an object's real state was `(follower.target, follower.qHome)` — living *inside a display filter*, so a finger wrote the filter and the filter WAS the truth. ⭐ Two things fell out: the held-mesh exception disappeared (one writer), and the barycentre's sway subtraction went with it (the decoration never enters the model). ⛔ No silent fallback to the mesh — `requirePose` throws. ⚠⚠ **It rewired RULE 6, which is CLOSED: the arithmetic is identical but its feel is owed a re-look.** ✅ **BUILT 2026-09-15** — `src/core/object_model.ts`, **42 vectors**, engine-free. ⭐⭐ **The test file was written BEFORE the implementation** and carries the three natural wrong compositions as counter-examples; **falsified on purpose before being trusted — breaking `composePlacement` turns 14 of the 42 red.** ⭐ `reroot` re-points the chain onto the held object moving NOTHING, and the invariant is asserted over every object including an off-path sibling. Every fixture is THREE deep. ⛔⛔ **NOT CLOSED: it has no visible behaviour, so a device look is impossible — it closes with `IN3`, which wires it.** ⛔ No snapping (`3D2`), no scene wiring (`IN3`), no triangle→face mapping (engine-side), no new tunable. ⭐ Original instruction, kept: **write the composite check BEFORE the code** — the chain in one expression, a THREE-deep fixture on day one (or `3D5` stays open by construction), and re-rooting. ⭐⭐ **It carries a DEVICE-PASS WATCH ITEM that can only be collected once**: on the first pass, does a hand ORBIT for depth or PUSH at the glass? That answer decides §3.2 DS3 and nothing else can supply it → [`queue_notes/3D1.md`](queue_notes/3D1.md) | 3D0 |
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
| DEP1d | GitHub Pages via Actions — real HTTPS anywhere, ⚠ slow loop | DEP | infra | ✅ **LIVE 2026-09-13** — https://dsug1.github.io/3d_assembly_game/ . Procedure: `50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md` | DEP0 |
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
