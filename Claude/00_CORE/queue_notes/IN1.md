# `IN1` — the gesture recognizer state machine

> **Dossier.** Full history of this row. Its one-line status is in
> [`../QUEUE.md`](../QUEUE.md) — update **both** when it changes.
>
> **STATUS** · ⚠ built and green — **NOT CLOSED, no device look yet** · **SUB** · IN
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
   radius. Pinned by a vector that reads 60.000° off a 12 × 5° arc.

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

## ⚠ What this row does NOT close

⛔⛔ **NO DEVICE LOOK YET. THIS ROW IS NOT CLOSED.** Green suites are necessary and
not sufficient, and touch cannot be tested with a mouse. What must be checked by
finger, on the Lenovo TB-X606F, over `npm run dev:usb` + `adb reverse`:

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
