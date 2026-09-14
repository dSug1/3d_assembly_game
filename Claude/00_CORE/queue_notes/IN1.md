# `IN1` — the gesture recognizer state machine

> **Dossier.** Full history of this row. Its one-line status is in
> [`../QUEUE.md`](../QUEUE.md) — update **both** when it changes.
>
> **STATUS** · ⚠ built, green, **SIX device passes — 14 defects found and fixed; a
> SEVENTH is owed, so NOT CLOSED** · **SUB** · IN
> **KIND** · feature

Design of record: [`../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md) §1.3.
Amendments live in [`../../10_INPUT_TOUCH/INDEX.md`](../../10_INPUT_TOUCH/INDEX.md), never inside the spec's `VERBATIM` block.

## 2026-09-13 — built headlessly. 37 → **81 golden vectors**

✅ `src/input/recognizer.ts` (the state machine, the release-time priority ladder,
`TapHistory`), `src/input/roll.ts` (2quinte), `moveExitDistance` wired into
`src/input/motion.ts`, and `src/render/hud.ts` + a diagnostic wiring in
`src/render/scene.ts` so the machine can be seen on a device.
✅ `npm run verify` green; `npm run build` green.

| suite | vectors |
|---|---|
| `tests/recognizer.test.ts` | 23 |
| `tests/roll.test.ts` | 16 |
| `tests/motion_flick.test.ts` | 9 → 14 |

⭐ **The pose type is a type parameter, not the object model.** Rollback needs
`snapshot()` / `restore()` and nothing else, and `3D1` has not been built. A concrete
pose here would have coupled the recognizer to a half-built model, and
`tests/boundary.test.ts` would **not** have caught it — that guard is about engine
imports, not premature coupling. `PosePort<P>` is the whole dependency.

⭐ **The commit point is `MotionTracker`'s own `MOVING` transition**, not a second
comparison against `moveEnterDistance`. One constant, one place — and further, one
*implementation*: a re-derived commit test is a second opinion that can silently
disagree with the first.

## ⛔⛔ Three defects found in §1.3 while building it

All three are recorded in [`../../10_INPUT_TOUCH/INDEX.md`](../../10_INPUT_TOUCH/INDEX.md)
and are **the owner's to ratify.**

1. **No double-tap exists, and §1.4 cannot work without one.** Rule 2septies is the
   only way a constraint is ever evicted, and §1.3's state machine stops at `TAP`
   with no tap tunable in the config at all. The constraint stack was **write-only**.
   Added `tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`.
2. **`TAP` had no duration bound**, so a finger resting ten seconds and lifting was a
   tap — and two of those would clear a deliberate constraint stack. Added `HOLD`,
   which is deliberately inert.
3. **Roll "about the running centroid" cannot fire at `rollAngle`.** The centroid of
   an **arc** is not its centre: for a uniform arc of total angle `2α` it sits at
   `R·sin(α)/α` from the centre, so at the 60° the config commits at, **the centroid
   is at 0.955 R — essentially on the path.** The build accumulates the **signed
   turning angle** instead, which for a circular arc equals its central angle
   exactly, with the **circumradius of three consecutive samples** as the local
   radius. Pinned by a vector that reads 45.000° off a 9 × 5° arc.

## ⭐ The `moveExitDistance` debt `IN0` handed over, closed

`IN0` left it **declared and unused** — `IN5` would have gone and measured a number
that did nothing. It is now the **excursion bound during settle candidacy**, which
catches what an instantaneous speed test structurally cannot: a **slow persistent
creep**, never at rest yet never above `stillSpeed`.

⛔⛔ **And the shipped defaults made it unreachable in every possible wiring.**
Motion held below `stillSpeed` for `stillTime` cannot cover more than
`stillSpeed × stillTime`; the defaults gave `6 mm/s × 80 ms = 0.48 mm` against a
`0.8 mm` bound. The constructor now **asserts** the consistency, so the next
inconsistent config is a loud failure instead of another dead threshold.
⚠ `stillTime` moved `80 → 150 ms` to satisfy it — **a placeholder moved to make
another placeholder reachable, not a measurement.**

⭐ **The vector was shown to FAIL against the old code, and that proof is permanent**:
`tests/motion_flick.test.ts` carries the pre-`IN1` speed-only exit rule as
`SpeedOnlyExit` and asserts the two implementations **disagree** on a 5.7 mm/s creep.
Revert the excursion term and the suite goes red, with the reason written on it.

## ⛔ Two defects the vectors found in MY OWN code, kept as the record

* **A duplicated pointer sample blanked the next two triples.** `RollDetector.push`
  advanced its three-sample window *before* rejecting the degenerate direction, so a
  stream with a repeat between every real sample — which is what a stalled touch
  digitiser produces — accumulated **exactly nothing** and reported it as "no roll".
  Fixed by dropping a repeat without advancing the window; the redundant second
  guard was removed rather than left as a check that cannot fire.
* **A golden vector of mine was invalid and passed judgement anyway.** The
  "scribble + sweep does not add up" fixture spliced a 2 mm arc onto a 60 mm one, so
  its joint **teleported ~60 mm in one 10 ms sample — about 6000 mm/s.** It committed
  a roll, and the code was right to. `METHOD`: a fixture must be a specimen the
  product would accept. Replaced with a real side-to-side wiggle whose curvature
  genuinely lands **inside** the roll band, so the band alone cannot reject it.

## ⚠ What this row did NOT close, as written on the morning of 2026-09-13

⛔⛔ **NO DEVICE LOOK YET. THIS ROW IS NOT CLOSED.** Green suites are necessary and
not sufficient, and touch cannot be tested with a mouse. What must be checked by
finger, on the Lenovo TB-X606F, over `npm run dev:usb` + `adb reverse`
— ⭐ **all five were run that evening; see the device-pass section below**:

1. **Commit** — the phase flips to `COMMITTED_CONTINUOUS` where the finger actually
   feels committed, not before and not after.
2. **Rollback** — a flick snaps the cube back to the press pose. This is the whole
   row and it is one glance: drag rotates, flick returns.
3. **Tap vs hold** — where `tapMaxDuration` really sits for a thumb.
4. **Double-tap** — whether `300 ms` / `8 mm` are reachable one-handed on a tablet.
5. **Roll** — whether a comfortable swirl lands inside `[4, 40] mm` at all, and
   whether the sign on the glass matches the sign the readout prints.

⚠ **The readout (`src/render/hud.ts`) prints only what the recognizer reported.**
It recomputes nothing, on purpose — `METHOD`'s most expensive carried lesson is that
a harness recomputing a value is a second implementation that can disagree with the
product while showing green.

⚠ **`ReleaseContext` arrives empty from the scene**, so `6quater` cannot win on the
device yet and the readout will only ever show `2ter` / `2quater`. That is a missing
**input** from `IN2`/`IN3`, not a recognizer that ignores its own ladder — the ladder
is covered headlessly.

⚠ **The diagnostic rotation in `scene.ts` is NOT rule 2bis** and its
`DIAGNOSTIC_RAD_PER_PX` is deliberately **not** in `gestureConfig`. `IN3` builds the
real rule and deletes it.

## ⭐ Carried to `IN5`, as measurement questions

* ⛔ **The band in which `moveExitDistance` can bind is 0.67 mm/s wide** with these
  defaults — `(moveExitDistance / stillTime, stillSpeed) = (5.33, 6) mm/s`. That is a
  direct consequence of the config being only *barely* self-consistent
  (`0.9 mm` against a `0.8 mm` bound). Measure `stillSpeed` and `stillTime` together,
  not one at a time: they are not independent.
* **A single sample-triple can contribute up to 180° of turning** and commit a roll
  on its own. The circumradius band is what currently prevents it, since a real
  finger cannot sweep that fast inside the band. ⛔ **Left unguarded on purpose** —
  `METHOD` forbids bolting a special case onto an output to patch a case nobody has
  observed. Watch for it on the device; if it fires, it is a data question.
* `tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop` are three more unmeasured
  placeholders, and they are now on the critical path for **eviction**.

---

## 2026-09-13 (evening) — ⭐⭐ THE FIRST DEVICE PASS. Three defects, all found by finger

Lenovo TB-X606F over `npm run dev:usb` + `adb reverse`. **81 → 100 golden vectors.**

| check | verdict |
|---|---|
| 1. commit | ✅ works as designed |
| 2. **rollback** | ⛔ **INCONSISTENT** — see below |
| 3. tap vs hold | ✅ works as designed |
| 4. double-tap | ✅ works as designed |
| 5. roll detection | ✅ detects — ⛔ but the cube did not ROLL, and yaw/pitch ran BACKWARDS |

⭐⭐ **Every one of the three was invisible to 81 green vectors.** This is the entry
`METHOD` is about: automated green is necessary and not sufficient, and not one of
these could have been found with a mouse.

### ⛔⛔ 1. Rollback was inconsistent — and it was the INSTRUMENT, not the threshold

Owner: *"not sure what makes it inconsistent: the flick, the timing, the amplitude."*
None of those. **`detectFlick` measured terminal speed from the LAST SAMPLE PAIR.**

A browser emits `pointerup` at a position and instant of its own choosing, and **very
commonly repeats the last `pointermove` coordinates**. The estimator then saw zero
displacement across the final pair, computed a lift speed of **zero**, and threw away
a 400 mm/s flick. Whether the browser coalesces that last event is nothing the user
can feel or control — hence "inconsistent" for an identical gesture.

⭐ **Reproduced headlessly before anything was changed**: one 400 mm/s stroke is a
flick; the SAME stroke with a coordinate-repeating `pointerup` appended is not.

⛔ **No value of `flickLiftSpeed` could have fixed this** — the measurement itself was
zero. Retuning would have chased a threshold to explain an instrument fault, which is
precisely the heuristic pile-up `METHOD` forbids.

✅ Lift speed is now averaged over `flickLiftWindow` (40 ms, placeholder). The three
lift variants now agree to within a few percent, and the **spread is asserted, not
just the verdict** — a discriminator whose value swings wildly while happening to stay
one side of a threshold is still fragile.
⭐ The old last-pair estimator is kept in the suite as `lastPairLiftPxPerS` and the
vectors assert it **still loses two of the three**. Revert the window, go red.

### ⛔⛔ 2. Yaw and pitch ran backwards, and in two different frames

Owner, precisely: *"if the finger moves to the right the cube yaw rotates towards the
left"*, and *"the yaw is in the world coordinates while the pitch is in the object
coordinates."*

Both symptoms, one cause: `mesh.rotation.set(...)`. **Euler components are applied in
a fixed order, so the second angle acts inside the frame the first one just made.**

✅ New `src/input/screen_rotate.ts` — engine-free, vector-covered — builds both
rotations about the camera's **world-space screen axes** and LEFT-multiplies them onto
the pose, per frame, as increments. Signs flipped to follow the finger.
⭐ The axes are latched **at press**, not recomputed per frame: rule 1's orbit must not
redefine them mid-gesture. Same lesson as §1.4's `WORLD_AXIS_ALIGN`.

⭐⭐ **The composite is asserted, not assumed.** `METHOD`: *a composition is a thing to
measure.* The vectors rotate a marker and check where it lands, and the world-frame
claim is stated as the only thing that actually means it: **the delta applied is
independent of the pose it is applied to.**

### ⛔ 3. Roll detected but never rolled — the detector froze its own output

`RollDetector` latched on commit and **stopped accumulating**. But 2quinte rotates the
object BY that angle, so the object would have rolled 60° and stopped dead while the
finger kept circling. ✅ Only the **decision** latches now; the angle keeps growing,
and holds (rather than zeroing) when the path leaves the radius band.

### ⛔ Two of MY OWN vectors were wrong, and both are kept

* One asserted a downward drag lowers the viewer-facing point by the **same amount**
  at any yaw. **False** — a rotation about the screen-x axis moves a point by an
  amount depending on its distance FROM that axis, and a point sitting on it does not
  move at all. Correct geometry, wrong premise.
* One built its counter-example by rotating about the object's **transformed** right
  axis. That is the identity `R(q·axis, θ) ⊗ q = q ⊗ R(axis, θ)` — the *same*
  rotation. The "defect" and the fix agreed exactly, so the vector proved nothing.
  ⛔ **A test that cannot fail is not a test.** The real counter-example is
  right-multiplication, which is genuinely the object's frame.

### ⭐ And the readout now prints the measured lift speed, pass or fail

`lift 412/250mm/s`, against the threshold it was judged by. Without it *"the flick did
not fire"* is **unfalsifiable on a device** — a finger that was too slow and an
estimator reading zero look identical. That ambiguity is what made this defect cost a
device session instead of a glance.

## ⚠ Still not closed — a SECOND device pass is owed

All three fixes are vector-covered and **none has been touched by a finger yet.**
Re-check on the tablet: (a) rollback now consistent across many flicks, (b) the cube
follows the finger on both axes and does not tumble when already turned, (c) a swirl
actually rolls, clockwise for clockwise.

---

## 2026-09-13 (later) — ⭐⭐ SECOND DEVICE PASS: roll works, but it JITTERED

Owner: *"the roll is working, however it is not nice: while rolling the cube jitters,
if I pause the circular finger movement and start again, the cube also jitters a
lot."* **100 → 106 golden vectors.**

⭐⭐ **ONE ROOT CAUSE, AND IT IS THE SAME SHAPE AS THE FLICK DEFECT**: direction was
estimated **between consecutive samples** — a baseline of a few pixels, where
digitiser noise dominates the angle. `METHOD` names it exactly: *print the
aggregation, not just the value.* A single sample pair is the noisiest possible
estimator of any rate, and no threshold rescues one.

**Measured, headlessly, before anything was changed:**

| | before | after |
|---|---|---|
| worst per-sample step, clean circle | 5.0° | 5.0° |
| worst per-sample step, ±0.5 px noise | **46.3°** | **10.2°** |
| drift across one pause | **−46.3°** | **0.0°** |
| total angle under noise vs clean | 197° / 225° | **225° / 225°** |

### The fix took THREE attempts, and the two rejected ones are the record

1. **Anchor gate** — emit a direction only once per `rollStepDistance` travelled.
   Killed the noise and the pause drift outright, **but the cube then turned in ~15°
   QUANTISED JUMPS.** Trading jitter for judder is not a fix.
2. **Trailing baseline, re-measured every sample** — smooth again, noise bounded.
   ⛔ But it still drifted **+30.2° across a pause**, and the reason is subtle: a
   direction depends on BOTH ends of its baseline. When the finger stops, the newest
   point holds still while the baseline START keeps creeping along the arc already
   travelled, so the measured direction swings although the path is not turning. The
   accumulated angle counted the baseline's own motion as the finger's.
3. ✅ **Trailing baseline + a PROGRESS GATE.** A new estimate is taken only once the
   newest point has itself advanced `rollUpdateDistance`. Both ends then move
   together, which is the only condition under which the difference of two direction
   estimates is the turning of the path.

⭐⭐ **The two distances are independent and both are needed.** `rollStepDistance` is
the **baseline** and sets how much noise reaches the angle; `rollUpdateDistance` is
the **cadence** and sets how finely the object follows the finger. Collapsing them
into one number is exactly what forced the choice between a jittery roll and a
juddering one.

### ⛔ And the radius band was gating the wrong thing

At a 3 mm baseline, **18% of post-commit samples were HELD** because the noisy
circumradius estimate flickered outside `[rollRadiusMin, rollRadiusMax]` — felt as
stutter, and it cost 28° of the total angle.

✅ **The band is a COMMIT criterion, not a TRACKING one.** It answers *"is this
gesture a roll?"*, and once answered the question is not re-asked every sample.
⭐ No gate is needed afterwards: a straight stretch has no turning, so it accumulates
nothing by itself. Holds went to **0%** and the noisy total became exact.

### ⛔⛔ A latent defect the new vectors caught: COARSE SAMPLING WENT SILENT

Writing the fixtures exposed it. The window pruned itself to two samples whenever the
finger moved **further than `rollStepDistance` between samples** — a fast swirl, or a
60 Hz digitiser — the length check then rejected every evaluation, and **roll
detection stopped working entirely while reporting "no roll".** `METHOD`: a guard
that turns a missing case into silence is worse than a failure. ✅ The window now
never drops below three samples, so a coarse stream simply spans a longer baseline
than asked for, which is the honest reading of the data available. Vectored.

### ⚠ One inherent behaviour, pinned so it is not mistaken for a defect later

A trailing chord **lags the true tangent by half the arc it spans** (~5.8° here), so
straightening out of a roll pays that lag off in **one ~5° step**. It is the price of
measuring direction over a baseline instead of between adjacent samples, which is what
killed the jitter. The vector asserts it stays **one-off** — thirty further straight
samples add nothing.

### ⚠ Another of my own fixtures was invalid, again

The "straight run cannot un-commit a roll" vector **teleported** the finger to a
far-away point to make its straight run — ~6000 mm/s, which no finger does, and the
detector was right to read the jump as a direction change. Replaced with a
**tangential continuation** from where the circle ended. ⛔ That is twice now that a
teleporting fixture has judged correct code wrong.

## ⭐ Carried to `IN5` — the roll tunables are COUPLED, measure them together

* `rollStepDistance` (3 mm) and `rollUpdateDistance` (0.5 mm) are placeholders.
  ⛔ `rollUpdateDistance < rollStepDistance < rollRadiusMin` is **asserted** in
  `validateGestureConfig`, so they cannot be measured independently.
* ⚠ **A longer baseline is quieter but laggier, and it is currently CAPPED by
  `rollRadiusMin`.** Swept headlessly: 8 mm and 12 mm baselines were markedly quieter
  (8.7° and 6.2° worst step) than 3 mm (10.2°) — but a baseline must stay below the
  tightest roll radius the band admits, or the chord cannot lie on such an arc at
  all. **If the device wants a quieter roll, `rollRadiusMin` has to rise first.**
  That coupling is the measurement question, not either number alone.
* ⚠ The startup transient is **one baseline of arc** (~11.5° on a 15 mm circle) — the
  roll does not begin responding until the baseline is established. Vectored as a
  known quantity; judge it by finger.

---

## 2026-09-13 (third pass) — ⭐⭐ THE LITERATURE CHECK, AND WHAT IT UNCOVERED

Device report: roll *"more quiet now, but still has some jitter, which yaw and pitch
do not have"*; pause ✅; fast swirl ✅; and a new one — *"a circular finger movement
followed immediately by a linear finger movement… the linear finger movement instead
control an erratic movement which jitters and snaps with big amplitude."*
**106 → 112 golden vectors.**

⚠ The owner also said *"straightening out: I do not understand what I have to check"*.
That was my failure to explain: it is the same case as their own circle-then-line
report. Their observation was the better-stated version of my check.

### ⛔ Why roll can never be as smooth as yaw/pitch, stated properly

They are not the same kind of measurement, and no tuning closes the gap:

* **Yaw/pitch is a DISPLACEMENT scaled by a small gain.** ±0.5 px of noise × 0.008
  rad/px = **±0.23°**.
* **Roll is an ANGLE differentiated from positions.** Its noise is `σ / lever-arm`,
  and the lever arm was the 3 mm baseline — **≈ 2.5°, about ten times worse.**

⛔ Two structural fixes were measured and **both were rejected on the numbers**:
lengthening the baseline buys only ~25–30% and costs responsiveness linearly; a
least-squares circle fit buys ~25% because the fitted centre's own noise eats the
radius lever-arm it was supposed to provide.

### ⭐⭐ THE SLOW-ROLL DEFECT THE PROBING EXPOSED — worse than the jitter

**A slow circular sweep never committed at all: 300° swept, 0.0° read.**

⭐ **The physics: the SAGITTA.** A chord of length `L` across a circle of radius `R`
bows from the straight line by `L²/(8R)`, and that bow **is** the curvature signal.
At a 3 mm baseline on a 15 mm circle it is **0.075 mm — against ~0.15 mm of pointer
noise.** The radius estimate was noise, so the in-band test was a coin toss.
⛔ And a **single** out-of-band reading zeroed the accumulator. A slow sweep produces
far more evaluations per degree, so far more chances to be unlucky — it was reset
over and over and never reached `rollAngle`. Fast sweeps escaped, which is exactly
why the device reported fast swirl as fine and slow roll as bad.

✅ **Fixed on both sides**, and the second is the more important:
* The band is now **hysteretic before commit too** — zeroing needs sustained
  out-of-band travel, mirroring §1.1's `STATIONARY`/`MOVING` pair.
* ⭐⭐ **`validateGestureConfig` now enforces the sagitta criterion**, so a config
  whose curvature signal sits under the noise floor **throws at construction**. It
  would have caught this before it ever reached a device. New config field
  `pointerNoiseMm` makes the assumption explicit and measurable rather than buried.
* Coupled retune: `rollStepDistance` 3 → 9 mm, `rollRadiusMax` 40 → 30,
  `rollRadiusMin` 4 → 10. ⚠ The binding case is the **largest** radius, not the
  smallest — sagitta shrinks as R grows, so a lazy wide swirl is the hard one.

### ⭐ 1€ FILTER — the state-of-the-art answer, and it fits the reported symptom

Casiez, Roussel & Vogel, CHI 2012 (doi 10.1145/2207676.2208639). ⭐ Its premise is
precisely the asymmetry the owner described: people see **jitter at low speed** and
**lag at high speed**, and a fixed low-pass cannot serve both. Its cutoff rises with
the signal's own speed. In a published comparison it had the smallest standard error
— ahead of LaViola's DES, a moving average, Kalman, and single exponential smoothing.

✅ **Licence, per `N13`**: reference implementations are **BSD**/**MIT** and **no
patent is asserted**. ⚠ Ours is an independent implementation from the paper, so no
licence binds at all; the citation is attribution. Recorded in `THIRD_PARTY_NOTICES`.

⭐ **Applied to the DISPLAYED angle only.** The commit threshold reads the RAW angle,
deliberately — lagging a threshold crossing would make the gesture feel late.
⭐ Measured: noise rms **1.95° → 1.20°** slow, **1.43° → 0.86°** medium.

### ⭐ Roll now RELEASES when the path stops being circular

The commit used to latch for the whole gesture, so a straight drag after a circle was
still read as roll — and the turn from the circle's tangent onto the new line is a
large **genuine** direction change applied in one step. That is the reported snap.
✅ `rollReleaseDistance` is the exit hysteresis; 2quinte's own condition is *"circular
movement"*, so when the movement stops being circular the rule stops applying.
⚠ §1.3 reads as a latch, so this is a **spec amendment, the owner's to ratify.**

## ⛔⛔ THE PATTERN ACROSS ALL THREE DEVICE PASSES — carry this into `IN3`/`IN4`

Every defect found by finger has been **the same mistake**: a rate estimated over the
shortest available baseline. Flick lift speed (last sample pair), then roll direction
(consecutive samples), then roll curvature (a sagitta under the noise floor). None was
visible to a green suite, and none was a threshold that needed tuning.
⭐ `IN3` and `IN4` each need a velocity (translation, mutual approach). **State the
window and check the signal clears the noise before writing the threshold.**

## ⚠ What is still owed

⛔ **A FOURTH device pass.** All of the above is vector-covered and untouched by a
finger. ⚠ And the 1€ parameters are placeholders: the paper's own procedure is to set
`beta` to 0, lower `minCutoff` until slow jitter is acceptable, then raise `beta`
until fast movement stops lagging — **a device procedure, so an `IN5` row.**
⭐ `pointerNoiseMm` should be measured FIRST: hold a finger still and read the spread.
Several thresholds are only defensible relative to it.

---

## 2026-09-14 (fourth pass) — ⭐⭐ THE REVERSAL, AND A REVERT

Device: roll *"much better"*; then — *"when I roll in one direction and then roll in
the other direction, there is a jump of the cube when I change the roll directions."*
**112 → 114 golden vectors.**

### ⛔⛔ It was not tuning. It was the WRONG QUANTITY, and it was mine

For three device passes this file accumulated the **turning angle of the tangent**.
Retrace an arc backwards and the tangent **flips 180° at the cusp**. Measured on a
200° sweep reversed:

| | |
|---|---|
| samples 41–52 | **frozen** — the cube stops responding entirely |
| sample 53 | **+150° in one step** |
| end | **180° off** — 200° out and 200° back should return to ~0 |

⭐⭐ **The owner's §1.3 asked for the "angle accumulated about the centroid" all
along. THE QUANTITY WAS RIGHT; only the estimator was wrong.** My earlier departure
correctly rejected the centroid (an arc's centroid is at 0.955 R, essentially on the
path) — but replacing it with the tangent's turning **silently changed what was being
measured**, and reversals are where the two differ.

✅ **Closed-form least-squares CIRCLE FIT (Kåsa, 1976 — textbook, no licence, no
patent)** over the trailing path, and the roll is the angle swept about that centre.
Retracing the same arc fits the **same circle**, so the centre holds still and the
angle runs smoothly back down through zero. ⭐ Closed form, not a search — a numeric
fit introduces a step size, and a step size is a threshold nobody measured.
⭐ Worst single step: **150° → 5.0°**, which is the true step.

### ⛔ Two defects the vectors then caught in the new estimator

* **A fit with no RESIDUAL is not a test.** Kåsa returns *a* circle for any point set,
  so accepting it on radius alone accepted paths that are not circular: a side-to-side
  **wiggle committed as a roll**, and a straight drag after a circle took **35 mm** to
  release instead of the 12 mm configured. ✅ The RMS residual is now judged against
  `rollFitResidualSigmas × pointerNoiseMm` — tied to the same measurable device
  property as the sagitta criterion, not to a free number.
* **The span was measured as a CHORD from the oldest window point.** On a reversal the
  finger comes back toward where the window began, so the chord **shrinks while the
  fitted arc grows** — the span read as "too short", the roll released mid-gesture and
  zeroed, a **35° jump at exactly the moment the reversal fix was meant to be smooth**.
  ✅ Measured along the **path** now; divided by the radius that IS the angular extent,
  which is what conditions a circle fit, and it cannot be inflated by a resting finger.

### ⛔⛔ AND THE 1€ FILTER WAS REVERTED — the null result, kept

Added one pass ago on a literature check, licence-cleared and correctly chosen for the
jitter-vs-lag trade. Against the **new** estimator it measured:

| | raw | 1€-filtered |
|---|---|---|
| slow, small circle | 5.80° | 5.78° |
| normal | 3.03° | 2.91° |
| wide circle | 3.54° | **4.70° — worse** |

⛔ `METHOD`: *measure or revert; a null result is recorded, not shipped hopefully.*
Removed, along with `src/input/one_euro.ts` and its two config fields, and recorded in
`THIRD_PARTY_NOTICES` as evaluated-and-reverted rather than quietly deleted.

⭐⭐ **THE LESSON, AND IT GENERALISES: THE FILTER HAD BEEN COMPENSATING FOR A BAD
ESTIMATOR.** Fixing the estimator removed the need for it, and a filter that measures
nothing is pure lag. **Reach for the estimator before the filter.**

### ⚠ One inherent behaviour, pinned rather than hidden

Nothing can be read until the fit window spans `rollStepDistance`, so a symmetric
out-and-back does **not** return the object to its starting orientation — the outward
leg starts being measured later than the return leg finishes. Vectored with a bound.
⚠ Judge it by finger; if it reads as wrong rather than as inherent, the lever is
`rollAngle` (the commit threshold), not the estimator.

## ⛔⛔ The pattern, updated after four passes

Passes 1–3 were all **a rate estimated over the shortest available baseline**. Pass 4
is a different and worse shape: **measuring a DIFFERENT QUANTITY than the one asked
for, and only discovering it at the input where the two diverge.** ⭐ The spec said
"angle about the centre"; I substituted "turning of the tangent" because it was easier
to estimate, and the substitution was invisible until a finger reversed.
⛔ **`IN3`/`IN4`: when an estimator is hard, check whether you have replaced the
quantity rather than improved the estimate of it.**

---

## 2026-09-14 (fifth pass) — ⛔⛔⛔ ROLL DISAPPEARED ON THE DEPLOYED PAGE

Device: *"On the github page test, the roll feature has fully disappeared."*
**114 → 124 golden vectors.** ⛔ Every vector was green while roll did not work at all.

### ⛔⛔⛔ THE ROOT CAUSE IS THE PREDECESSOR'S MOST EXPENSIVE LESSON, VERBATIM

`METHOD`: *a golden vector's fixture must be a specimen the product would accept.*
**Every roll fixture in the suite was a MATHEMATICALLY PERFECT CIRCLE.** No hand
produces one. Measured against realistic gestures, the shipped build rolled on:

| gesture | rolled? |
|---|---|
| perfect circle (the fixture) | ✅ |
| ellipse 1.3:1 | ❌ |
| ellipse + wobble + drift | ❌ |
| lazy wide swirl R=35 | ❌ |
| tight swirl R=8 | ❌ |

⭐ **Only a mathematically perfect circle qualified.** The suite certified a case that
cannot occur — the predecessor lost a month to the same shape.

### ⛔ Three causes, and the first is a CATEGORY ERROR

1. ⛔⛔ **The fit residual was judged against `pointerNoiseMm`.** The residual measures
   **how non-circular the HAND'S PATH is** — a shape property, millimetres — while
   pointer noise is a **sensor** property in fractions of a millimetre. At the
   resulting 0.45 mm tolerance nothing a hand can draw qualified.
   ✅ It is now a **fraction of the fitted radius** (`rollFitResidualFraction`):
   dimensionless and scale-free, so one tolerance judges a tight swirl and a lazy one.
2. **The radius band `[10, 30] mm` excluded both ends** of what a finger actually
   does. ✅ Now `[5, 60]`.
3. **`rollAngle` 60° could not tell a swirl from a sloppy S-shaped drag.** One
   half-period of a lazy 8 mm × 90 mm wiggle contains **~67° of genuine arc** at ~25 mm
   radius — indistinguishable by shape. ✅ **120°**; measured, the false positive
   disappears at 90°.

### ⛔ And two more the sweep exposed in the new estimator

* **Both angles must be taken about the SAME centre.** Storing the previous *angle*
  let the fitted centre's own motion accumulate — and on a wiggle the centre jumps
  clean across the path each time the window slides over an inflection. ✅ The previous
  **position** is stored and re-measured about the current centre, so centre motion
  cancels exactly. Same principle as the progress gate: a difference only means
  something when both ends of it move together.
* **The window was bounded by point COUNT**, justified as a proxy for path length.
  Evaluations are spaced by *at least* `rollUpdateDistance`, never exactly it, so a
  fast finger packed **162 mm** of path into a window meant to hold 30 mm. ✅ Bounded
  by **path length**, maintained incrementally.
* ⭐⭐ **And the window is sized by ARC, not by length** (`rollFitArcDeg`). What
  conditions a circle fit is angular extent: 30 mm is 215° of a tight 8 mm swirl and
  only 49° of a lazy 35 mm one, and **no fixed length served both**.

### ⚠ The cost, pinned rather than hidden

⛔ **Release is slow: ~83 mm of straight drag** before a committed roll hands back to
yaw/pitch, against an 18 mm `rollReleaseDistance` — the window must flush before the
fitted radius leaves the band. ⚠ **This is the sluggish handover the owner reported at
the third pass, and it is in direct tension with detecting a lazy wide swirl**, which
is what the long arc buys. Judging the recent path rather than the whole window was
tried and did not move it; the gate is the fitted radius, not the residual.
⛔ **Only a device can settle the trade.** `IN5`.

### ⛔ A validator was deleted with the estimator it belonged to

`rollStepDistance < rollRadiusMin` existed because a long chord "stops being a
tangent". Nothing uses a chord as a tangent any more, and under a circle fit a long
span is **better**. Keeping it would have capped the span at the tightest roll radius
and locked out every lazy wide swirl — the very defect being fixed.

## ⛔⛔⛔ THE LESSON OF THIS ROW, AND IT OUTRANKS THE OTHERS

Four passes taught estimator discipline. **This one taught that a green suite proves
nothing about gestures if its fixtures are idealised.** The realistic-gesture block in
`tests/roll.test.ts` is now the primary guard: any change to the roll geometry must
keep **all six imperfect swirls rolling and none of the three negatives rolling.**
⭐ Every roll number is swept against *synthetic humanity* — ellipses with drifting
centres — which is far better than perfect circles and **still not a hand.** `IN5`.

---

## 2026-09-14 (sixth pass) — ⭐⭐ HYPER replaces KÅSA, and a revert that was made on bad evidence

Device: *"it is now working, but I liked better the results of the 1€ filter than this
new implementation of Kåsa: this new implementation creates big jumps when I switch
from roll to yaw/pitch or when I change roll directions."* **124 → 129 vectors.**
Owner asked for a literature check and advice **before** any change was made.

### ⭐ First, the framing was wrong, and that mattered

**Kåsa and the 1€ filter are not alternatives.** Kåsa is an **estimator** (how the
angle is computed); 1€ is a **smoother** (how the computed signal is cleaned). They
are orthogonal — the real question was never which one, but why the output got worse.
Three independent causes, all now addressed.

### ⛔⛔ 1. Kåsa is the WORST of the standard algebraic circle fits

Chernov's error analysis ranks them: **Kåsa poor, Pratt moderate, Taubin good, Hyper
best** — Hyper having *zero essential bias* and beating even the iterative geometric
fit. ⛔ Kåsa is **severely biased toward small circles on SHORT ARCS**, which is
precisely the regime here: the window holds an arc, never a whole circle. A biased,
high-variance centre is what makes the per-step angle jump, and it makes the radius
estimate wander across the band edges, flapping the gesture in and out.

✅ Replaced with **Hyper** (Al-Sharadqah & Chernov 2009, arXiv:0907.0421). Published
mathematics: no licence, no patent, `N13`-clear.
⭐ **The fit is now pinned directly against circles whose answer is known exactly** —
including a **40° short arc recovered to four decimal places**, which is the case
Kåsa gets wrong. The bias correction is one coefficient
(`a2 = 4·Cov_xy − 3·Mz² − Mzz`), and it is also all that separates Hyper from Taubin,
so a vector guards it.

### ⛔⛔ 2. The reference point went stale — the actual jump mechanism

The out-of-band branch `return`ed **without updating `prevPos`**. An excursion out of
band — which happens transiently at a reversal and at the roll→yaw/pitch handover —
left the reference behind while the finger kept moving, and the **whole excursion was
collected into one step on re-entry**. A jump of arbitrary size, exactly as reported.

⭐⭐ **Third time this row has had the same bug shape**: the baseline creep, the centre
motion, and now this. *A difference is only meaningful when BOTH ends of it are
current.* ✅ Fixed, plus a **chord-consistency guard**: two points on a circle of
radius `r` separated by chord `c` subtend exactly `2·asin(c/2r)`, so the angle is not
free to disagree with the distance the finger actually travelled.

### ⛔⛔⛔ 3. The 1€ revert was made on evidence that was wrong TWICE OVER

I removed it under measure-or-revert. That decision was invalid for **two independent
reasons**, and only one of them was known at the time:

1. The measurements were taken on **perfect-circle fixtures** — the same ones that
   later turned out to be why roll vanished from the device.
2. ⛔⛔ **`beta` was set so high the filter was effectively bypassed.** `beta` scales
   the cutoff with the signal's speed; the roll angle moves at hundreds of deg/s, so
   `beta = 0.05` drove the cutoff to ~30 Hz. **I reverted a filter that had never been
   switched on**, and reported the null result as if it meant something.

✅ Restored and re-measured properly — realistic gestures, the Hyper estimator, and a
full sweep **including LAG**, which the earlier metric could not see at all (both of
its channels were filtered, so lag cancelled).

| `beta` | noise removed | lag added |
|---|---|---|
| 0 | 13% | **~30° per gesture** |
| 0.01 | 0.3% — nothing | ~13° |
| 0.02 | *worse* | ~8.5° |

⛔ **No setting earns its place.** The roll angle is a fast **ramp**, and low-passing a
ramp costs `slope × τ` of lag. Filtering the per-step turn and integrating it instead
was tried and is far worse (6.8° → 17.7° of error): evaluations here are gated by
DISTANCE, so they are irregular in time, and a time-based low-pass over irregular
increments does not preserve their sum — the bias integrates into drift.

⭐⭐ **What actually removed the jitter was the ESTIMATOR, not a filter.** Left wired at
a low-lag default so it can be judged by finger; one config line makes it transparent
(`beta` → 0.05) or maximal (`beta` → 0).

## ⚠ What is owed

⛔ **A SEVENTH device pass.** Specifically: are the jumps gone at a reversal and at the
roll→yaw/pitch handover, and is the 1€ filter worth keeping at all? ⭐ The owner's
device judgement has overturned my synthetic measurements twice on this row; if it
feels better with the filter, the filter stays and my metric is what is wrong.
