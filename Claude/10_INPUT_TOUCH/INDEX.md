# 10 — TOUCH INPUT · gestures, the recognizer, constraints

> **STATUS** · ⭐ active · **OWNS** · everything a finger touches, up to the point an
> object's transform changes
> **READ IF** · you are building or debugging any gesture
> **LAST VERIFIED** · 2026-09-13

⭐⭐ **Design of record → [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md)**,
the owner's revision-5 specification, reproduced verbatim. ⛔ Never edit inside its
`VERBATIM` markers; findings ABOUT it go here.

## Where it stands

✅ **`IN0`** — units (mm→px), the hysteretic motion state, the flick test.

✅✅ **`IN1` CLOSED (2026-09-14)** — the recognizer state machine
(`recognizer.ts`): commit point, provisional motion with **rollback**, the
release-time priority ladder, tap / double-tap / hold, roll detection (`roll.ts`), and
the screen-plane rotation mapping (`screen_rotate.ts`).
⛔ **Seven device passes found 14 defects, not one visible to a green suite.**

✅✅ **`IN9` CLOSED (2026-09-14)** — the two CAMERA-ONLY rules, which needed no object
model and so did not wait on `3D1`:
* **rule 4, pinch zoom** (`pinch.ts`) — all five device checks passed.
* **rule 1, orbit** (`orbit.ts`, `barycentre.ts`) — three defects found by finger and
  fixed, including a **composition nobody had computed**.

**226 golden vectors, all passing** (37 → 219).

⛔ **Not built**: `IN2` (pointer roles, blocked behind the `IN8` decision below),
`IN3`/`IN4` (the object rules, blocked on `3D1`), `IN5` (measurement), `IN6` undo,
`IN7` haptics.

⭐⭐ **`IN5` IS NOW PRACTICAL.** Tunables override from the **URL**
(`?rollAngle=45&rollFilterBeta=0`) and the orbit rings have an on-screen **tuning
menu**, so a placeholder can be A/B'd by finger without a rebuild.
⛔ **Every threshold is still a placeholder** — except the six orbit ring values, which
the owner chose on the device on 2026-09-14 and are the first *judgements* in the file.
⭐ Measure **`pointerNoiseMm` first** — **the instrument exists** since 2026-09-14:
`src/input/noise_meter.ts`, reported on the HUD as `noise floor=… now=… n=… cfg=…`. Hold
one finger still for a few seconds; `floor` is the answer. The sagitta criterion and
several other thresholds are only defensible relative to it.

⛔⛔ **THE STATISTIC IS THE POINT, AND IT IS EASY TO MEASURE THE WRONG ONE.** A resting
finger produces sensor noise (high frequency — what `pointerNoiseMm` *means*) **and**
hand tremor and drift (low frequency, often larger, and not a property of the digitiser
at all). So deviation is taken from a **short trailing mean** (32 samples), as a distance
from the mean **point** rather than per-axis — the sagitta is a bow in the plane, and a
per-axis figure would be wrong by √2 with nothing to notice. ⭐ And the answer is the
**minimum** window seen, not the average: movement can only raise a reading above the
sensor’s floor, so the quietest window during a hold is the best estimate and a finger
that shifts half-way cannot spoil it. ⛔ It reports `NaN`, never `0`, before it has
enough samples — a zero would read as a perfect sensor and wave every config through.

⛔ **A guard now refuses dead tunables.** `tests/config_debt.test.ts` requires every
config field to be **read by the code or declared as debt with the row that will wire
it** — after three orphans: `moveExitDistance` (dead through all of `IN0`),
`tiltDeadband` (orphaned by the rule-1 amendment, deleted) and `gainRoll` (since
wired). ⭐ It proved itself the same day: wiring `gainRoll` made the allowlist stale,
and the guard failed until the entry was removed — the second direction it checks.

⭐ The narrative of every device pass is in
[`history/2026-09-13_IN1_device_passes.md`](history/2026-09-13_IN1_device_passes.md);
the rows' dossiers are [`../00_CORE/queue_notes/IN1.md`](../00_CORE/queue_notes/IN1.md)
and [`../00_CORE/queue_notes/IN9.md`](../00_CORE/queue_notes/IN9.md).

## ⛔⛔ Where the build already had to DEPART from the spec

**§1.1's `MOVING` condition is unusable as written.** The spec enters `MOVING` when
*"accumulated travel since the last `STATIONARY` frame exceeds `moveEnterDistance`"*.
Accumulated travel is **path length**, and the path length of a resting finger is a
**random walk: it grows without bound.** Every stationary touchpoint therefore reads
`MOVING` after a few seconds, and every rule keyed on *"the other touchpoint is
still"* — 6, 6bis, 6ter, 6quater — silently stops working.

⭐ **Measured on the first test run**: ±0.5 px of jitter crossed the 1.5 mm threshold
in **under half a second**.

✅ **The build uses NET DISPLACEMENT FROM AN ANCHOR** (the point where the finger last
came to rest), re-anchored on each return to `STATIONARY`. Jitter is bounded; a real
drag is not. Both halves are pinned by vectors. → [`../00_CORE/queue_notes/IN0.md`](../00_CORE/queue_notes/IN0.md)

⚠ **This is a spec amendment and it is the owner's to ratify.** It is recorded here
rather than edited into the spec, per the tiered rules.

---

**§1.3's state machine has no DOUBLE-TAP, and §1.4 cannot work without one.**
`IN1`, 2026-09-13.

§1.4 and rule 2septies make a **double-tap the ONLY way a constraint is ever
evicted** — `clearStack` in `core/constraint_stack.ts` exists for exactly that, and
no drag clears constraints by design. But §1.3's state machine stops at `TAP`, and
`gestureConfig.ts` carried **no tap tunable at all**. So the constraint stack was
write-only: a user who anchored a face wrongly had no way back.

✅ Added, and they are placeholders like everything else: `tapMaxDuration`,
`doubleTapWindow`, `doubleTapSlop`.

⭐ **And `TAP` needed a time bound it did not have.** §1.3 reads
`PRESSED -> (release before moveEnterDistance) -> TAP`, with no duration. Taken
literally, a finger resting for ten seconds and lifted without moving is a `TAP`, and
two of those clear a constraint stack the user spent a gesture building. The build
adds a **`HOLD`** outcome — commits to nothing, fires no rule — for a press held
longer than `tapMaxDuration`. ⚠ `HOLD` is deliberately inert; if it should do
something, that is a new rule and the owner's to write.

⛔ **Double-tap memory cannot live in the per-touchpoint recognizer.** Two taps are
two different pointer ids, so the recognizer that saw the first is already gone when
the second presses. It lives in a `TapHistory` shared across touchpoints.

---

**§1.3's roll detection "about the running centroid" cannot fire at `rollAngle`.**
`IN1`, 2026-09-13.

§1.3 commits to roll on *"signed angle accumulated about the running centroid of the
path"*. ⛔ **The centroid of an ARC is not its centre.** For a uniform arc of total
angle `2α` at radius `R`, the centroid sits at `R·sin(α)/α` from the true centre — so
at the 60° `rollAngle` wants to commit at, **the running centroid is at 0.955 R:
essentially ON the path, not at its centre.** The angle measured about it is not the
swept angle at all, and only becomes one as the gesture approaches a **full** turn
(at 360° the centroid finally reaches the centre). Committing at a sixth of a turn,
about a centroid sitting on the arc, measures noise.

⛔⛔ **AND ACCUMULATING THE PATH'S TURNING ANGLE INSTEAD IS ALSO WRONG — it changes
the QUANTITY.** The build did that for three device passes. Retrace an arc backwards
and the **tangent flips 180° at the cusp**, while the angle about the centre simply
runs back down. Measured on a 200° sweep reversed: the angle froze for twelve
samples, jumped **+150° in one step**, and finished 180° from where it started.

✅ **THE BUILD NOW MEASURES §1.3's OWN QUANTITY — the angle about the centre — with a
least-squares CIRCLE FIT** (**Hyper**; Al-Sharadqah & Chernov 2009, no licence, no patent)
over the trailing path. Retracing the same arc fits the **same circle**, so the centre
holds still and the angle reverses smoothly through zero. Worst step **150° → 5.0°**.

⭐ So the amendment is narrower than it first looked: **§1.3's quantity stands; only
its estimator is replaced.** The centroid becomes a circle fit, and nothing else about
the rule changes.

⛔ Two things the fit needs that are easy to omit: a **residual** test (any algebraic fit returns
*a* circle for any point set, so without it a side-to-side wiggle commits as a roll),
judged against `rollFitResidualSigmas × pointerNoiseMm`; and a span measured **along
the path**, never as a chord — on a reversal the chord *shrinks* while the fitted arc
grows.

⚠ Same standing: an amendment, recorded here, the owner's to ratify.

---

**`moveExitDistance` is now wired — and the shipped defaults made it unreachable.**
`IN1`, 2026-09-13. Carried from `IN0`, which left it declared and unused.

✅ It is now the **excursion bound during settle candidacy**: when speed drops below
`stillSpeed` the position at that moment becomes a candidate rest point, and
`STATIONARY` latches only if the finger stayed within `moveExitDistance` of it for
the whole `stillTime`. This catches what instantaneous speed structurally cannot —
a **slow persistent creep**, which is never at rest yet never exceeds `stillSpeed`.

⛔⛔ **But the exit distance can only ever bind if `stillSpeed × stillTime >
moveExitDistance`** — sustained sub-`stillSpeed` motion cannot cover more ground than
that, under any wiring. The shipped defaults gave `6 mm/s × 80 ms = 0.48 mm` against
a `0.8 mm` bound. **The tunable could not have been anything but decorative.**

✅ **The constructor now asserts it**, beside the existing anti-chatter assertion, so
an inconsistent config is a loud failure and not a silently dead threshold.
⚠ `stillTime` moved `80 → 150 ms` to satisfy it. **That is a placeholder moved to
make another placeholder reachable, not a measurement.** Both belong to `IN5`.

## ⭐⭐ Amendments the OWNER made, 2026-09-14

⚠ These are different in kind from the departures above. Those are places the build
**could not** follow the spec and reported why. These are places the owner **chose**
something else, on the device, with the alternative in front of them.

**§2 rule 1 is DRAG-ORBIT, not tilt-orbit.** The spec orbits *"by the value of yaw
and pitch of the **device tilt**"* and states that *"the touch delta gates this rule
but its value is unused: touch acts as a clutch for tilt-orbit."*
⛔ **The orbit is now driven by the DELTA POSITION** of one touchpoint that hits no
object. ⭐ Consequences, so they are not rediscovered: `DeviceOrientation` leaves the
critical path entirely (no iOS permission prompt, no platform axis conventions, no
gimbal behaviour near vertical), and `tiltDeadband` was orphaned and **deleted**.
⚠ The barycentre selection is unaffected: it still chooses what the camera orbits
*around*.

**The orbit CENTRE migrates, it does not teleport.** Rule 1 re-chooses a barycentre on
every press, so aiming at a different pair of objects jumped the camera. ⭐ The centre
now blends over `orbitBlendDistanceMm` of **finger travel** — not wall-clock, so it
cannot drift on after the finger lifts — and blending the centre carries the position
and the orientation together.

**The orbit STOPS SHORT, on a three-ring surface.** Owner: *"we should define height
and radius of top and bottom rigs and not exceed these."* The camera rides a surface
defined by TOP / MIDDLE / BOTTOM rings, each with a radius **and** a height, and the
elevation parameter is clamped.
⭐⭐ **There is no pole to gimbal at, because the poles are not reachable** — the
classic orbit-camera failure cannot occur, rather than being patched where it occurs.
⭐ And *"three rigs, therefore two transitions"* is now **enforced by
`validateGestureConfig`**, which refuses any ring set whose camera distance changes
direction more than once — so the tuning menu explains a bad shape instead of leaving
it to be found by finger, which is how it was found the first time.

**Orbit directions are INVERTED** — *"if fingers move up and right, camera orbits down
and left."* The grab-the-**world** convention: the finger pushes the scene and the
camera swings the other way.
⛔ Recorded as a decision, not a detail: the two readings are exact opposites and both
internally consistent, so no sign-checking can tell you which a hand expects. `IN1`
shipped yaw **and** pitch inverted for precisely that reason.

**Roll smoothing ships ENGAGED, against the measurement.** A device A/B chose the
1€-filtered roll; the metric had scored it as a bad trade. ⭐ The metric was what was
wrong — its synthetic swirl rolled at twice a hand's speed, inflating the predicted
lag, and an error-against-ground-truth metric cannot score *"feels steady"*.

⚠ **Licence note for the three-ring orbit**, since it is the same idea as Unity
Cinemachine's FreeLook: ✅ no patent found, but ⛔ **Cinemachine's CODE is under the
Unity Companion License**, usable only in Unity-engine-dependent applications. Ours is
written from the geometry. See [`../../THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

## ⚠ Open questions the spec itself flags

* **`IN8` — two touchpoints on the same object** is *undefined and reachable*. Decide
  before `IN2` ships (§5).
* **`axisMappingMode`** `rotated` vs `direct` (§6bis) — build both, A/B on a device.
* **`matePriorityOverAnchor`** (§1.4) — default is anchor-wins; the flag exists for
  the comparison.
* **6ter** (both touchpoints moving) is flagged by the spec itself as the hardest
  case to control and the one rule breaking the asymmetric-hands invariant.

## What to read, for what

| you want to… | read |
|---|---|
| **any gesture rule** | [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md) — and mind the section numbers, they are referenced from code |
| know why a threshold is in mm | [`../00_CORE/CONSTRAINTS.md`](../00_CORE/CONSTRAINTS.md) §6 |
| change a tunable | `src/input/gestureConfig.ts` — ⛔ **one constant, one place**. ⭐ To try one *without a rebuild*: `?rollAngle=45` on the URL, or the on-screen menu for the orbit rings |
| know what is built | [`../00_CORE/QUEUE.md`](../00_CORE/QUEUE.md), phase `IN` |
| **why the input code looks the way it does** | [`history/2026-09-13_IN1_device_passes.md`](history/2026-09-13_IN1_device_passes.md) — every defect found by finger, including the ones that were measured and reverted |

### The source, and what each file owns

| file | owns |
|---|---|
| `gestureConfig.ts` | every tunable, **and every cross-tunable rule** in `validateGestureConfig` — the checks that catch a config which is individually plausible and jointly impossible |
| `config_override.ts` | `?name=value` overrides, so `IN5` can A/B by finger. ⛔ Refusals are reported, never ignored |
| `motion.ts` | §1.1 hysteretic `STATIONARY`/`MOVING` |
| `flick.ts` | §1.3's flick test. ⚠ Lift speed over a **window**, never the last sample pair |
| `roll.ts` | rule 2quinte. The **Hyper** circle fit; roll is the angle about a fitted centre |
| `one_euro.ts` | the 1€ filter, smoothing the displayed roll angle |
| `screen_rotate.ts` | rule 2bis's world-frame yaw/pitch, and 2quinte's roll about the view axis |
| `pinch.ts` | rule 4. A **ratio** of separations, never a rate |
| `orbit.ts` | rule 1's three-ring surface, monotone and bounded by the rings |
| `barycentre.ts` | rule 1's orbit **centre** — what the camera orbits around |
| `recognizer.ts` | §1.3 itself: the state machine, rollback, and the release-time priority ladder |

---
