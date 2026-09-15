# 10 — TOUCH INPUT · gestures, the recognizer, constraints

> **STATUS** · ⭐ active · **OWNS** · everything a finger touches, up to the point an
> object's transform changes
> **READ IF** · you are building or debugging any gesture
> **LAST VERIFIED** · 2026-09-15

⭐⭐ **Design of record → [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md)**,
the owner's revision-5 specification. ⛔⛔ **READ [`AMENDMENTS_R5.md`](AMENDMENTS_R5.md)
FIRST** — `A1`–`A9` are the owner's later decisions and **they supersede the spec's text**
where the two conflict. The spec is left standing and unaltered, because a superseded
clause explains why the current one exists.

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

**518 golden vectors, all passing** (37 → 518).

### ⭐⭐ The amendments, and what of them is on the glass

| # | what it decided | built? |
|---|---|---|
| `A1`–`A4` | eviction: off the double-tap, off the roll channel, spares `MATE`s, and is a **quick back-and-forth** | ⚠ `shake.ts` built + 15 vectors, **NOT WIRED** |
| `A3` | **roll drives an anchored object's free DOF**, 2sexte suppressed where it degenerates | ⚠ `anchor_rotate.ts` built + 25 vectors, **NOT WIRED** |
| `A5` → `A6` → `A10` | **depth**, decided three times: a pinch, then a common vertical drag, now a **STILL HOLDER and a MOVING ANCHOR** | ✅ wired — ⚠ device pass owed |
| `A7` | ⭐⭐ every object gesture stands on a **GRAVITY FRAME** | ✅ wired, and vectored end to end |
| `A8` | ⛔ **RETIRED BY A12** — a roll rebased to the start of its circle | ⚠ unwired, kept callable |
| `A12` | ⭐⭐⭐ **roll moves to the SECOND touchpoint's x**; its y stays depth. Retires the circle fit, the commit threshold and **the jump** | ✅ wired — ⚠ device pass owed |
| `A13` | ⭐⭐⭐ **one touchpoint TRANSLATES; a second held STILL ROTATES**. Whichever finger moves acts; the other one's state picks the rule | ✅ wired — ⚠ device pass owed |
| `A9` → `A11` | ⭐⭐⭐ **§1.1 IS A POSITION DEADBAND** — an anchor trailing at one dead radius, emitting the excess only. Time-free, exact, and it absorbs A9 | ✅ built — ⚠ device pass owed |
| `A10` | ⭐⭐ depth is a **still holder and a moving anchor**; rule 6's second touchpoint may be on the object | ✅ wired — ⚠ device pass owed |

⛔⛔ **DEPTH COST SIX MODELS AND A DEVICE PASS EACH** — a mean, a latch, a cumulative exit,
a shared minimum, a faded blend, then A6's driver/validator. ⭐⭐ **Two transferable
lessons came out of it:**

1. **A BLEND HAS SEAMS.** Every version that mixed the two fingers' travel into one number
   had a discontinuity somewhere, and *"it jumps erratically"* came back within minutes.
2. ⭐⭐ **WHEN A RULE NEEDS A WINDOW TO DECIDE, SUSPECT THE QUESTION.** A6 was correctly
   implemented and still failed: *"are these two travels equal?"* has **no answer** at a
   reversal (both pass through zero) or at a late start (one has not moved), and both
   happen in every gesture. A window is how you buy an answer to a question that has none
   at this instant — and the cheaper move is to ask a different question. ⛔ `A10` asks
   *"is that finger still?"*, which is answerable at every instant, and needs no window,
   ratio, tolerance or hold.

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
intention*. ⭐ **A2**: the scene holds THREE objects, not two. ⭐⭐ **A7 (`D18`)**: **every object gesture stands on a GRAVITY FRAME** —
yaw about the world vertical, pitch about the horizontal screen-x, roll and depth about the
flattened view direction, and translation's dy is a true vertical. ⛔ The argument is
**orthogonality**: about the camera's axes, roll stops being independent of yaw as the
camera tilts, and no gain fixes a basis that is not a basis. ⭐ One basis for translation
AND rotation.
⭐⭐ **A6 (`D17`)**: **depth is a COMMON VERTICAL DRAG** — one finger on the object, one
ANYWHERE, both travelling in y together. ⛔ It replaced A5’s pinch because a hand found the
hole: two fingers will not fit on a SMALL object, and pushing a part away shrinks it, so the
pinch **destroyed its own affordance as it succeeded**. ⭐⭐ It shares rule 6’s configuration:
**common mode is depth, differential mode is rule 6**.
⚠ **A5 (`D16`)**, its geometry still standing: **two touchpoints on
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

## ⭐ Amendments the OWNER made on the device, 2026-09-14

⭐ **Five decisions, with their reasons, are in**
[`history/2026-09-14_owner_device_decisions.md`](history/2026-09-14_owner_device_decisions.md)
— moved there 2026-09-15 when this file reached its 400-line cap. In force, in one line each:

* **§2 rule 1 is DRAG-ORBIT, not tilt-orbit** — driven by delta position; `DeviceOrientation`
  left the critical path entirely and `tiltDeadband` was deleted.
* **The orbit CENTRE migrates over finger travel**, not wall-clock, so it cannot drift on
  after the finger lifts.
* **The orbit STOPS SHORT, on a three-ring surface** — ⭐⭐ there is no pole to gimbal at,
  because the poles are not reachable. *Three rigs, therefore two transitions*, enforced by
  `validateGestureConfig`.
* **Orbit directions are INVERTED** — the finger pushes the world. ⛔ Both readings are
  internally consistent, so no sign-checking can tell you which a hand expects.
* **Roll smoothing ships ENGAGED, against the measurement** — ⭐ the metric was what was
  wrong: an error-against-ground-truth metric cannot score *"feels steady"*.

⚠ **Licence note for the three-ring orbit**, since it is the same idea as Unity
Cinemachine's FreeLook: ✅ no patent found, but ⛔ **Cinemachine's CODE is under the Unity
Companion License**, usable only in Unity-engine-dependent applications. Ours is written
from the geometry. See [`../../THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

## ⚠ Open questions the spec itself flags

* ✅✅ **`IN8` — two touchpoints on the same object: ANSWERED TWICE AND NOW BUILT.**
  `D10` ignored the second hit; `D16`/`A5` made it a depth **pinch**; `D17`/`A6` replaced
  the pinch's TRIGGER with a **common vertical drag** and kept its geometry. ⛔⛔ A hand
  found the hole that forced the second change: **two fingers will not fit on a SMALL
  object, and pushing a part away shrinks it** — the pinch destroyed its own affordance as
  it succeeded. ⚠ `IGNORED` survives with its trigger moved to the THIRD touchpoint.
  ⛔ **Still owed**: a proposal for reaching a small object at all (the owner's thought is
  to use TWO objects, which is 6ter's configuration) — asked for, and nothing built.
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
| **the OWNER's later decisions** | ⭐⭐ [`AMENDMENTS_R5.md`](AMENDMENTS_R5.md), `A1`–`A9`. ⛔ They supersede the spec |
| why eviction and depth ended where they did | [`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md) — `A1`'s and `A5`'s full original text, moved out when the amendments file passed its 800-line cap |

### The source, and what each file owns

| file | owns |
|---|---|
| `gestureConfig.ts` | every tunable, **and every cross-tunable rule** in `validateGestureConfig` — the checks that catch a config which is individually plausible and jointly impossible |
| `config_override.ts` | `?name=value` overrides, so `IN5` can A/B by finger. ⛔ Refusals are reported, never ignored |
| `motion.ts` | ⭐⭐⭐ §1.1 as a **POSITION DEADBAND** (`A11`): an anchor trails the finger at one dead radius; inside it the finger is `STATIONARY` and emits nothing, outside it emits the **excess only**. ⛔ Every continuous rule consumes `step`, never a raw delta. ⚠ Four formulations of §1.1 have now failed on a real pointer — see `queue_notes/IN0.md`, it is the most instructive file in the project |
| `flick.ts` | §1.3's flick test. ⚠ Lift speed over a **window**, never the last sample pair |
| `roll.ts` | rule 2quinte. The **Hyper** circle fit; roll is the angle about a fitted centre |
| `one_euro.ts` | the 1€ filter, smoothing the displayed roll angle |
| `screen_rotate.ts` | rule 2bis's yaw/pitch and 2quinte's roll, ⭐ **about the GRAVITY FRAME** (`A7`) — yaw about the world vertical, pitch about the horizontal, roll about the view direction flattened onto the ground |
| `gravity_frame.ts` | ⭐⭐ `A7`'s frame itself: `{right, up, depth, towardGravity}` from a view axis and gravity. ⛔ A **distinct type** from `ScreenFrame`, so the compiler stops the two being interchanged — and `towardGravity` is what makes depth behave on the **bottom ring**, where "away" SINKS on screen instead of rising |
| `depth_translate.ts` | `A10`'s depth: `depthGate` (the holder's stillness, and nothing else), the push direction, and the world-space step |
| `translate.ts`, `follow.ts`, `lead.ts` | rule 6: the computed gain, the critically-damped follower, and the phantom target that leads along the finger's own smoothed velocity |
| `shake.ts` | `A4`'s eviction detector — oscillation **along an axis**, because a circle projects to a back-and-forth on every axis. ⚠ Built, not wired |
| `anchor_rotate.ts` | 2sexte and `A3`'s handover, about the CONSTRAINT axis. ⚠ Built, not wired — and it wants the TRUE view axis, not the gravity frame |
| `display_pose.ts` | `SWAY ∘ FOLLOW ∘ model` as ONE expression — what the eye sees, never where the object IS |
| `router.ts` | §4's roles, latched at press: `OBJECT` / `OUTSIDE` / `SECOND` / `IGNORED` |
| `noise_meter.ts` | the instrument behind the only measured number on this project |
| `pinch.ts` | rule 4. A **ratio** of separations, never a rate |
| `orbit.ts` | rule 1's three-ring surface, monotone and bounded by the rings |
| `barycentre.ts` | rule 1's orbit **centre** — what the camera orbits around |
| `recognizer.ts` | §1.3 itself: the state machine, rollback, and the release-time priority ladder |

---
