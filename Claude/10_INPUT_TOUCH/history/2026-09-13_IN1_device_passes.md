# `IN1` DEVICE PASSES — the narrative, 2026-09-13 / 14

> **STATUS** · ✅ record · **OWNS** · the story of how the recognizer was found wrong
> four times by a finger, and what each pass changed
> **READ IF** · you want to know WHY the input system has the shape it does, or you
> are about to make one of the same four mistakes
> **LAST VERIFIED** · 2026-09-14

⛔ **THIS IS NARRATIVE, NOT STATE.** What the input system IS now lives in
[`../INDEX.md`](../INDEX.md); the row's own dossier is
[`../../00_CORE/queue_notes/IN1.md`](../../00_CORE/queue_notes/IN1.md). Nothing here
is rewritten — it is moved verbatim out of the INDEX, which had grown four
chronological sections deep and two contradictory summaries, exactly the drift the
router warns about.

⚠ Some passages below are **SUPERSEDED** and are kept on purpose: the third pass
adopted a 1€ filter that the fourth pass measured and reverted, and the first pass
adopted a turning-angle estimator that the fourth pass replaced with a circle fit.
`METHOD`: *a claim that was overturned is more useful than one silently deleted.*
⭐ The **current** position on both is in [`../INDEX.md`](../INDEX.md).

---

## ⭐⭐ What the FIRST DEVICE PASS found (2026-09-13, Lenovo TB-X606F)

Commit, tap-vs-hold and double-tap passed as designed. The other three did not, and
**not one of them was visible to 81 passing vectors.** Full record:
[`../00_CORE/queue_notes/IN1.md`](../00_CORE/queue_notes/IN1.md).

**1. ⛔⛔ Rollback was inconsistent — and it was the INSTRUMENT.** `detectFlick`
measured terminal speed from the **last sample pair**. A browser emits `pointerup`
wherever and whenever it likes and **very commonly repeats the last `pointermove`
coordinates**; the estimator then read zero displacement, computed a lift speed of
**zero**, and discarded a 400 mm/s flick. Nothing the user can feel or control —
hence identical gestures judged differently.
⛔ **No value of `flickLiftSpeed` could have fixed it**: the measurement was zero.
Retuning would have chased a threshold to explain an instrument fault.
✅ Lift speed is now averaged over a stated window, `flickLiftWindow` (40 ms,
placeholder). `METHOD` said this in advance: *print the aggregation, not just the
value* — a single sample pair is the noisiest possible estimator of a speed.

**2. ⛔⛔ Yaw and pitch ran backwards, and in two different frames.** Owner: *"if the
finger moves to the right the cube yaw rotates towards the left"*, and *"the yaw is in
the world coordinates while the pitch is in the object coordinates."* One cause for
both: `mesh.rotation.set(...)` — **Euler components apply in a fixed order, so the
second angle acts inside the frame the first one just made.**
✅ New `src/input/screen_rotate.ts`, engine-free and vector-covered: both rotations
are built about the camera's **world-space screen axes** and left-multiplied onto the
pose, per frame, as increments. ⭐ The axes are latched **at press** — rule 1's orbit
must not redefine them mid-gesture, which is §1.4's `WORLD_AXIS_ALIGN` lesson again.
⭐ The world-frame claim is asserted the only way that means it: **the delta applied
is independent of the pose it is applied to.**

**3. ⛔ Roll detected but never rolled.** `RollDetector` latched on commit and stopped
accumulating — but 2quinte rotates the object BY that angle, so it would have rolled
60° and stopped dead while the finger kept circling. ✅ Only the **decision** latches;
the angle keeps growing, and **holds** rather than zeroing when the path leaves the
radius band, so a stray finger cannot snap the object back mid-gesture.

⭐ **And the readout now prints the measured lift speed whether or not it passed**
(`lift 412/250mm/s`). Without it, *"the flick did not fire"* is **unfalsifiable on a
device**: a finger that was too slow and an estimator reading zero look identical.

---

## ⭐⭐ What the THIRD device pass found (2026-09-13) — and the literature answer

Full record: [`../00_CORE/queue_notes/IN1.md`](../00_CORE/queue_notes/IN1.md).

**⛔⛔ A SLOW circular sweep never committed at all — 300° swept, 0.0° read.** Worse
than the jitter it was found while chasing, and it explains why the device reported
*fast* swirl as fine and *slow* roll as bad.

⭐ **The physics is the SAGITTA.** A chord of length `L` across a circle of radius `R`
bows from the straight line by `L²/(8R)`, and that bow **is** the curvature signal. At
a 3 mm baseline on a 15 mm circle it is **0.075 mm against ~0.15 mm of pointer
noise** — so the radius estimate was noise and the in-band test was a coin toss. A
*single* out-of-band reading then zeroed the accumulator, and a slow sweep produces
far more evaluations per degree, so far more chances to be unlucky.

✅ **`validateGestureConfig` now enforces the sagitta criterion and THROWS** on a
config whose curvature signal sits under the noise floor — it would have caught this
before it ever reached a device. New field `pointerNoiseMm` makes the assumption
explicit and measurable instead of buried. ✅ The band is hysteretic before commit
too, mirroring §1.1's `STATIONARY`/`MOVING`.

**⛔ Roll now RELEASES when the path stops being circular.** ⚠ **Spec amendment,
owner's to ratify.** §1.3 reads as a latch, so a straight drag after a circle was
still roll — and the turn from the circle's tangent onto the new line is a large
*genuine* direction change applied in one step, felt as *"an erratic movement which
jitters and snaps with big amplitude"*. 2quinte's own condition is *"circular
movement"*, so when the movement stops being circular the rule stops applying.
`rollReleaseDistance` is the exit hysteresis to the commit's entry hysteresis.

**⭐ And roll cannot be made as smooth as yaw/pitch by tuning.** They are different
measurements: yaw/pitch is a *displacement* scaled by a small gain (±0.23° of noise);
roll is an *angle differentiated from positions*, whose noise is `σ / lever-arm`.
Lengthening the baseline was measured at ~25–30% for a linear cost in responsiveness;
a least-squares circle fit at ~25%, because the fitted centre's own noise eats the
radius lever-arm. **Neither is the lever.**

✅ **The 1€ filter is** (Casiez, Roussel & Vogel, CHI 2012). Its premise is exactly
the reported asymmetry — jitter matters at low speed, lag at high speed, and a fixed
low-pass cannot serve both — so its cutoff rises with the signal's own speed. Applied
to the **displayed** angle only; the commit threshold reads the raw one, because
lagging a threshold crossing makes a gesture feel late. Measured: **1.95° → 1.20°**
slow, **1.43° → 0.86°** medium. Licence and the rejected alternatives (Kalman,
LaViola DES) are in [`../../THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

## ⛔⛔ The pattern across all three passes — it binds `IN3` and `IN4`

Every single defect found by finger has been **the same mistake**: *a rate estimated
over the shortest available baseline.* Flick lift speed (last sample pair), roll
direction (consecutive samples), roll curvature (a sagitta under the noise floor).
⛔ **None was visible to a green suite, and none was a threshold that needed tuning.**
⭐ `IN3` and `IN4` each need a velocity. **State the window, and check the signal
clears the noise, BEFORE writing the threshold.**

---

## ⭐⭐ The FOURTH device pass (2026-09-14): the wrong quantity, and a revert

Full record: [`../00_CORE/queue_notes/IN1.md`](../00_CORE/queue_notes/IN1.md).

**⛔⛔ Roll reversal jumped, and it was not tuning — it was the wrong QUANTITY.** For
three passes the build accumulated the **turning angle of the tangent**. Retrace an
arc backwards and the tangent flips **180° at the cusp**. Measured on a 200° sweep
reversed: the angle **froze for twelve samples**, jumped **+150° in one step**, and
finished **180° from where it started**.

⭐⭐ **§1.3 asked for the *"angle accumulated about the centroid"* all along, and the
QUANTITY was right — only the estimator was wrong.** Rejecting the centroid was
correct (an arc's centroid sits at 0.955 R, essentially on the path); replacing it
with the tangent's turning **silently changed what was being measured**.

✅ Now a **closed-form least-squares circle fit** (Kåsa 1976 — textbook, no licence,
no patent) over the trailing path, and the roll is the angle about that centre.
Retracing the same arc fits the **same circle**, so the angle runs smoothly back down
through zero. Worst single step **150° → 5.0°**.

⭐ Two further defects the vectors caught in the new estimator: **a fit with no
residual is not a test** (Kåsa returns *a* circle for any points, so a wiggle
committed as a roll and a straight drag took 35 mm to release instead of 12) — the RMS
residual is now judged against `rollFitResidualSigmas × pointerNoiseMm`; and the span
was measured as a **chord**, which *shrinks* on a reversal while the fitted arc grows,
releasing the roll at exactly the wrong moment. It is measured along the **path** now.

## ⛔ The 1€ filter was measured and REVERTED

Added one pass earlier on a literature check, and correctly chosen for the
jitter-vs-lag trade. Against the **new** estimator: **5.80°→5.78°, 3.03°→2.91°, and
3.54°→4.70° — worse — on a wide circle.** `METHOD`: *measure or revert; a null result
is recorded, not shipped hopefully.* Removed, and recorded in
[`../../THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md) as
evaluated-and-reverted rather than quietly deleted.

⭐⭐ **The lesson generalises: the filter had been compensating for a bad ESTIMATOR.**
Fixing the estimator removed the need for it, and a filter that measures nothing is
pure lag. **Reach for the estimator before the filter.**

## ⛔⛔ The pattern after four passes — it binds `IN3` and `IN4`

Passes 1–3 were all **a rate estimated over the shortest available baseline** (flick
lift speed, roll direction, roll curvature): *state the window, and check the signal
clears the noise, before writing the threshold.*
⭐ Pass 4 is a worse shape: **measuring a DIFFERENT QUANTITY than the one asked for**,
invisible until the input where the two diverge. **When an estimator is hard, check
whether you have replaced the quantity rather than improved the estimate of it.**
