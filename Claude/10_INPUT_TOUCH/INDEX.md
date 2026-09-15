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

**433 golden vectors, all passing** (37 → 433).

✅✅ **`IN2` is CLOSED** (2026-09-14, 22 vectors, `src/input/router.ts`, confirmed by
finger): three roles — `OBJECT` / `OUTSIDE` / `IGNORED` — each **latched at press for the
touchpoint's lifetime** (§4), bindings keyed by pointer id so §0's order-independence
holds in both release orders, and `activeCount` excludes ignored touchpoints because
that is the count the §4 rule table is written against.
✅ **Its visible consequence was judged by finger and accepted**: lift the finger holding a
part while a second finger rests on that same part and **the part stops responding** —
the second was ignored at press and stays ignored until it lifts. The HUD prints the
latched roles (`#1OBJ #2IGN  active=1`) so that is distinguishable from a bug.
→ [`../00_CORE/queue_notes/IN2.md`](../00_CORE/queue_notes/IN2.md)

🔨 **`IN3` IS IN PROGRESS**, 40 vectors of logic standing ahead of any renderer.
⭐ **2sexte + A3's handover BUILT** (`src/input/anchor_rotate.ts`, 25 vectors) — every
rotation is about the CONSTRAINT axis and *the anchor survives* is asserted directly, with
rotating about the VIEW axis kept as the counter-example. ⭐⭐ The near side's excursion is
`r·sin α`, so the drag **goes quiet over a range before it becomes undefined** — which is
where `anchorHandoverCos` has to hand over, and a device question.
⭐ **The eviction shake detector is BUILT** (`src/input/shake.ts`,
15 vectors) — ⛔ defined as oscillation ALONG AN AXIS, because **a circle projects to a
back-and-forth on every axis** and `A3` made circles legal on constrained objects.
⭐ `suppressesFlick` arms on the first reversal, which is A4's mandatory flick guard.
⛔ Not built: the rest of `IN3` (2bis's precondition, 2sexte + A3's handover, roll on an
anchored object, 2ter/2quater, the triangle→`FaceId` mapping, the `scene.ts` wiring that
CLOSES `3D1`) and `IN4`'s **6bis / 6ter / 6quater**.
⭐⭐ **BOTH ARE NOW UNBLOCKED** — `3D1` was built 2026-09-15, so the object model, the face
centres 6bis needs, and the constraint stack rule 2bis must consult all exist.
⭐ **`IN3` is NEXT**, and it also CLOSES `3D1`, which cannot be closed on its own.
⚠ `IN4`'s **rule 6 is CLOSED** (2026-09-15, confirmed in ordinary play); it is the rest of
that row that waits. `IN5` (measurement), `IN6` undo, `IN7` haptics.
⭐ `IN11` (is 2bis path-dependent?) is unblocked too and needs no device.

⛔⛔ **THE OWNER'S LATER DECISIONS SUPERSEDE THE SPEC, AND THEY LIVE IN
[`AMENDMENTS_R5.md`](AMENDMENTS_R5.md)** — read it BEFORE the spec. ⭐ **A1 → A4**: constraint
eviction left the double-tap (which is now purely the camera fly) and, after `D14` gave the
roll channel back to a real control, left the roll too — it is a **quick BACK-AND-FORTH**,
one touchpoint, ≥2 reversals in a window, reusing the sway's MEASURED reversal detector.
⛔ The flick test must be skipped once one reversal is seen, or an abandoned shake ADDS a
constraint instead of removing one. ⭐ **A1 §4 (`D13`)**: eviction **spares `MATE` entries** — *one gesture, one
intention*. ⭐ **A2**: the scene holds THREE objects, not two. ⭐⭐ **A5 (`D16`)**: **two touchpoints on
the SAME object are a DEPTH PINCH** — it supersedes `D10`, closes §5's last undefined
configuration, and came from a HAND rather than a document. ⛔⛔ **Depth is HORIZONTAL** —
the view axis flattened onto the ground plane — so **an object's height never changes**:
gravity is the primary constraint here, and a camera looking down makes the camera ray point
into the floor. Its gain is **computed**, and `IN2`'s `IGNORED` role moves to the THIRD
touchpoint. ⛔⛔ **A3**: roll **drives the free DOF of
an ANCHORED object** — the spec forbade it on a reason that is conditional on camera pose
and false when the camera looks along the constraint axis, which is exactly where 2sexte's
own screen mapping DEGENERATES. The two are complementary charts over one DOF, not rivals.
⚠ A3 puts the **eviction gesture back under review**: roll is now a legitimate control on
precisely the objects eviction applies to.

⭐⭐ **EVERY GESTURE IS NOW TAGGED WITH ITS PROVENANCE** (2026-09-15, `D11`,
`CONSTRAINTS` §10) — prior art with a dated citation, an internal composition, or ⚠ novel
to this project. Register: [`PROVENANCE.md`](PROVENANCE.md). ⛔ Three rules came out **NOVEL
COMPOSITE** — §4's **6bis, 6ter and 6quater** — which is the catalog's caution zone and the
reason `SEC4` exists. ⭐ It also records what was DECLINED and why, so a later session does
not re-derive the assessment.

⭐⭐ **`IN5` IS NOW PRACTICAL.** Tunables override from the **URL**
(`?rollAngle=45&rollFilterBeta=0`) and the orbit rings have an on-screen **tuning
menu**, so a placeholder can be A/B'd by finger without a rebuild.
⛔ **Every threshold is still a placeholder** — except the six orbit ring values
(⚠ the top ring was reopened to **1.0 m / 0.55 m** on 2026-09-14, making the surface
**asymmetric**: 1.14 m of eye distance at the top against 0.71 m at the bottom, so a
top-down view frames far wider than a bottom-up one) and the
four gains (`gainRotateFree` 0.07, `gainRoll` 1, `gainOrbitYaw` 0.054,
`gainOrbitElevation` 0.02), which the owner chose on the device on 2026-09-14 and are
the first *judgements* in the file, plus `pointerNoiseMm`, the first *measurement*.
⛔⛔ **A GUESSED GAIN IS RELIABLY TOO SLOW — THREE FOR THREE.** Every gain a hand has
touched was raised from my guess: ×3.4, ×2.3, and ×2 for the elevation gain, whose row
had already *predicted* it was slow — which was worth nothing until a finger moved the
slider. ⭐ Ship the slider WITH the rule, not after a session is spent disliking it.
⭐ Measure **`pointerNoiseMm` first** — **the instrument exists** since 2026-09-14:
`src/input/noise_meter.ts`, reported on the HUD as `noise floor=… now=… n=… cfg=…`. Hold
one finger still for a few seconds; `floor` is the answer. The sagitta criterion and
several other thresholds are only defensible relative to it.

⭐ **Rule 6's four numbers were chosen on the device over FIVE passes, 2026-09-14**:
`gainTranslateScreen` **1.17**, `translateInertiaMs` **7.6**, `translateDampingRatio` **0.2**,
`translateLeadMs` **0.2**. ⚠ τ has a FLOOR of roughly one pointer interval (8–12 ms): below
it the mass stops smoothing the staircase the target arrives in and the pointer/frame beat
is visible as jitter. ⛔ **Rotation has NO inertia** — it was built and rejected on the
device; see `QUEUE.md`'s YOU-ARE-HERE block before rebuilding it. Every one ended up well away from what the simulation argued for
(I proposed 30 ms at ζ 0.65, and a lead of 3.2 ms). ⚠ **A simulation narrows the range; it
does not pick the number** — and a *computed landmark* does not either: the lead has an
exact value at which a steady drag leaves no gap, and the hand chose a sixth of it.
⭐ The object now deviates &lt;0.45 mm from the finger at 300 mm/s, under the measured pointer
noise, so the whole of the feel is in the **overshoot** rather than in any gap.

⭐⭐ **MEASURED 2026-09-14: `pointerNoiseMm` = 0.761 mm** — five times the 0.15 mm
placeholder it replaced. ⚠ **It is a RESTING-FINGER floor, and gameplay is not a
resting finger**: a moving contact patch is a different regime, and nothing is retuned
around this number as though it described one. It feeds exactly one rule — the sagitta
criterion — where an over-estimate is the safe direction, since it can only raise the
bar.
⛔⛔ **AND IT IMMEDIATELY EXPOSED A DEFECT IN THAT RULE.** With the real noise the guard
rejected the configuration seven device passes had accepted. The guard was wrong: it
computed `rollStepDistance² / (8 × rollRadiusMax)`, a fixed 13 mm chord at the largest
radius (0.352 mm), while `roll.ts` spans `max(rollStepDistance, radius × arc)` — at a
60 mm radius that is 136 mm of path bowing 32 mm. ⭐ It now scans the achievable radius
range using the window the code actually spans; the binding case is the **smallest**
radius, and the knob it protects is **`rollTrackArcDeg`** — the one a person is tempted
to shrink, because it is release lag. 130° ships; below ~45° it is refused.

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

* ✅ **`IN8` — two touchpoints on the same object: DECIDED 2026-09-14 — IGNORE THE
  SECOND HIT**, for the moment. Reading 2 (the segment between the fingers as a
  rotation axis) is deferred, not rejected. ⛔ It binds `IN2`: *ignored* is a THIRD
  latched role beside on-object and outside, and lifting an ignored touchpoint must NOT
  run the release verdict, the flick test or the tap history — the opposite of the
  pinch, where lifting one of two fingers ends the gesture.
  → [`../00_CORE/queue_notes/IN8.md`](../00_CORE/queue_notes/IN8.md)
* **`axisMappingMode`** `rotated` vs `direct` (§6bis) — build both, A/B on a device.
* **`matePriorityOverAnchor`** (§1.4) — default is anchor-wins; the flag exists for
  the comparison.
* **6ter** (both touchpoints moving) is flagged by the spec itself as the hardest
  case to control and the one rule breaking the asymmetric-hands invariant.

## What to read, for what

| you want to… | read |
|---|---|
| **what a finger can ALREADY do** | ⭐ [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md)'s **BUILD STATUS** section — the inventory by touchpoint configuration, what is built, what is blocked, and the two behaviours with no clause behind them |
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
