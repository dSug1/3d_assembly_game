# `IN5`

**Status: see [`../QUEUE.md`](../QUEUE.md).** ⭐ This dossier was created
2026-09-16 when the row's status cell was distilled, so the record had somewhere to
live that is not a front door.


---

## ⭐ CARRIED FROM THE QUEUE ROW, 2026-09-16 — verbatim

⚠ `QUEUE.md` is a front door and this cell had grown to an essay inside a table. ⛔ Distilled there to state + one lesson + this pointer; the full text is below, unrewritten, per `README.md` rule 2.

> queued. ⛔⛔ **A TRAP NO TEST CAN CATCH, READ IT BEFORE BOOKING A SESSION: six tunables are still READ but are OFF THE GESTURE PATH** — `rollAngle`, `gainRoll`, `rollStepDistance`, `rollReleaseDistance`, `rollFilterMinCutoff`, `rollFilterBeta`. `A12` moved roll to the second touchpoint's `x`, and `roll.ts` is kept unwired with its 40 vectors, so `config_debt.test.ts` still sees them as used. ⭐ **Measuring them would change nothing a hand can feel.** Do not spend a session on them unless the circular roll comes back. ⭐⭐ **MEASURE FIRST INSTEAD**: `motionDeadbandMm` — it is the commit threshold, the rest test AND the jitter deadband at once, and it was set by feel at 3.5 mm without ever being measured. ⛔⛔ **A GUESSED GAIN IS RELIABLY TOO SLOW — THREE FOR THREE**: every gain a hand has set was raised from my guess, by ×3.4, ×2.3 and ×2 (`gainRotateFree`, `gainOrbitYaw`, `gainOrbitElevation` — the last one on 2026-09-14, and its row had already *predicted* it was slow without that being worth anything until a finger moved the slider). `IN3`/`IN4` add seven more — **give each a slider when it is wired**, not after a session is spent disliking it. ⭐⭐ **Now practical: tunables override from the URL** (`?motionDeadbandMm=3.5&gainRollDrag=3`), so a value can be A/B'd by finger without a rebuild — `src/input/config_override.ts`. ⭐⭐ **`pointerNoiseMm` FIRST** — ⭐ **instrument BUILT 2026-09-14** (`src/input/noise_meter.ts`, on the HUD as `noise floor=…`): hold one finger still and read `floor`; the sagitta criterion and several thresholds are only defensible relative to it. ✅ **READ 2026-09-14: 0.761 mm**, five times the placeholder — and measuring it exposed a defect in the sagitta guard (see the YOU-ARE-HERE block). ⚠ Then the 1€ pair by the paper's procedure (`beta`=0, lower `minCutoff` until slow jitter is acceptable, then raise `beta` until fast motion stops lagging). ⚠ `IN1` added four more (`tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`, and a moved `stillTime`) and found `stillSpeed`/`stillTime`/`moveExitDistance` are **not independent** — measure them together
