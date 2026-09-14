# 10 — TOUCH INPUT · gestures, the recognizer, constraints

> **STATUS** · ⭐ active · **OWNS** · everything a finger touches, up to the point an
> object's transform changes
> **READ IF** · you are building or debugging any gesture
> **LAST VERIFIED** · 2026-09-13

⭐⭐ **Design of record → [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md)**,
the owner's revision-5 specification, reproduced verbatim. ⛔ Never edit inside its
`VERBATIM` markers; findings ABOUT it go here.

## Where it stands

✅ **`IN0` built** — units (mm→px), the hysteretic motion state, the flick test.
✅ **`IN1` BUILT** — the recognizer state machine (`src/input/recognizer.ts`):
commit point, provisional motion with **rollback**, the release-time priority ladder,
tap / double-tap / hold, roll detection (`roll.ts`), and the screen-plane rotation
mapping (`screen_rotate.ts`). **124 golden vectors, all passing** (37 → 124).

⛔⛔ **`IN1` IS NOT CLOSED. FIVE DEVICE PASSES HAVE EACH FOUND DEFECTS — TWELVE IN
TOTAL — AND NOT ONE WAS VISIBLE TO A GREEN SUITE.** A sixth pass is owed.
⛔⛔⛔ **The fifth is the one to learn from: roll had DISAPPEARED from the deployed
page while every vector passed, because every roll fixture was a mathematically
PERFECT CIRCLE — a specimen no hand produces.** `tests/roll.test.ts` now carries six
deliberately imperfect swirls and three negatives as the primary guard, and any change
to the roll geometry must keep all six rolling and none of the three.
⭐ The story of all four — including the two changes that were **measured and
reverted** — is
[`history/2026-09-13_IN1_device_passes.md`](history/2026-09-13_IN1_device_passes.md).
The row's dossier is [`../00_CORE/queue_notes/IN1.md`](../00_CORE/queue_notes/IN1.md).

⛔ **Not built**: `IN2` (pointer roles, blocked behind the `IN8` decision below),
`IN3`/`IN4` (the rules themselves, blocked on `3D1`), `IN6` undo, `IN7` haptics.
⛔ **Every threshold is a placeholder.** `IN1` added seven, and `pointerNoiseMm` is
the one to measure **first** — several others are only defensible relative to it.

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
closed-form least-squares CIRCLE FIT** (Kasa 1976; textbook, no licence, no patent)
over the trailing path. Retracing the same arc fits the **same circle**, so the centre
holds still and the angle reverses smoothly through zero. Worst step **150° → 5.0°**.

⭐ So the amendment is narrower than it first looked: **§1.3's quantity stands; only
its estimator is replaced.** The centroid becomes a circle fit, and nothing else about
the rule changes.

⛔ Two things the fit needs that are easy to omit: a **residual** test (Kasa returns
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
| change a tunable | `src/input/gestureConfig.ts` — ⛔ **one constant, one place** |
| know what is built | [`../00_CORE/QUEUE.md`](../00_CORE/QUEUE.md), phase `IN` |

---
