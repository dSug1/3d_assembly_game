# `IN0` — units, motion states, the flick test

> **Dossier.** Full history of this row. Its one-line status is in
> [`../QUEUE.md`](../QUEUE.md) — update **both** when it changes.
>
> **STATUS** · ✅ built 2026-09-13 · **SUB** · IN · **KIND** · feature

Design of record: [`../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md) §1.1–§1.3.

## 2026-09-13 — built, and the first golden vectors found a defect in the SPEC

✅ `src/core/units.ts`, `src/input/motion.ts`, `src/input/flick.ts`, with 37 vectors
across the six suites.

### ⛔⛔ §1.1's "accumulated travel" is unusable as written

The spec enters `MOVING` when *"accumulated travel since the last STATIONARY frame
exceeds `moveEnterDistance`"*. Taken literally that is **path length**, and the path
length of a resting finger is a **random walk: it grows without bound**. So every
stationary touchpoint eventually reads `MOVING`, and every rule that depends on "the
other touchpoint is still" silently stops working after a few seconds of contact.

⭐ **Measured on the first test run**: a finger oscillating ±0.5 px crossed the
5.7 px (1.5 mm) threshold in **under half a second**.

✅ **The build uses NET DISPLACEMENT FROM AN ANCHOR** — the point where the finger
last came to rest. Jitter is bounded; a real drag grows. The tracker re-anchors each
time it returns to `STATIONARY`.

⚠ **Both halves are pinned**: ten seconds of jitter stays `STATIONARY`, and a slow
deliberate drag still becomes `MOVING`. A first version of the second test drifted at
~2 px/s — **below `stillSpeed`** — and was rightly reported stationary; the test
premise was wrong, not the tracker. Recorded because it is the same class of error
the predecessor's `METHOD` warns about.

### ⚠ What this row does NOT close

⛔ **Not one config default is measured.** They are starting points so the build
runs. `IN5` is the row that measures them, and it needs a real device.
⛔ `moveExitDistance` is **declared but unused**: the exit path currently keys on
`stillSpeed` + `stillTime` only. Either wire it or delete it — an unused tunable is a
lie in the config. Carried into `IN1`.
