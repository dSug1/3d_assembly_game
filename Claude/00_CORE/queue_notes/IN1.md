# `IN1` — the gesture recognizer state machine

> **Dossier.** Full history of this row. Its one-line status is in
> [`../QUEUE.md`](../QUEUE.md) — update **both** when it changes.
>
> **STATUS** · ⚠ built, green, **first device pass done — 3 defects found and fixed;
> a SECOND pass is owed, so NOT CLOSED** · **SUB** · IN
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
