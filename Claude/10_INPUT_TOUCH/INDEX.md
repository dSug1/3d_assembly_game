# 10 — TOUCH INPUT · gestures, the recognizer, constraints

> **STATUS** · ⭐ active · **OWNS** · everything a finger touches, up to the point an
> object's transform changes
> **READ IF** · you are building or debugging any gesture
> **LAST VERIFIED** · 2026-09-13

⭐⭐ **Design of record → [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md)**,
the owner's revision-5 specification, reproduced verbatim. ⛔ Never edit inside its
`VERBATIM` markers; findings ABOUT it go here.

## Where it stands

✅ **`IN0` built** — units (mm→px), the hysteretic motion state, and the flick test.
**37 golden vectors, all passing.**
⛔ **`IN1` is next and it is the spine**: the recognizer state machine. Until it
exists there is no commit point, so no rule can be provisional and nothing can roll
back. §1.3 calls it *"the central change"* and it is.
⛔ **Nothing has been touched by a finger.** Every threshold is a placeholder.

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
