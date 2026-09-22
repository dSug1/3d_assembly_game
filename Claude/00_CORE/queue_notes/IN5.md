# `IN5`

**Status: see [`../QUEUE.md`](../QUEUE.md).** ⭐ This dossier was created
2026-09-16 when the row's status cell was distilled, so the record had somewhere to
live that is not a front door.


✅✅ **THE TRAP BELOW IS GONE, 2026-09-16 — and by deletion, not by discipline.** The six
tunables this dossier warned a session about — `rollAngle`, `gainRoll`, `rollStepDistance`,
`rollReleaseDistance`, `rollFilterMinCutoff`, `rollFilterBeta` — **no longer exist**, with
~10 more and the circle-fit channel they served (owner: *"clean the roll also for the fork
A"*). ⭐ `config_debt.test.ts` now has nothing off-path to find, which is the only kind of
proof that claim can have. ⚠ One number they warned about SURVIVES and still wants a hand:
**`gainRollDrag`**, `A12`'s °/mm on the second touchpoint's x — a guess, with a slider.
⛔ The text below is kept unrewritten: it is the record of *how* six tunables came to be read
by nothing, which is a shape that will recur.

⭐⭐ **THREE MORE NUMBERS LEFT THE PLACEHOLDER COLUMN ON 2026-09-17** — the owner set the
shake's window to **300 ms**, its leg to **6 mm** and its straightness to **0.45** (mine were
600 / 8 / 0.4). ⚠ Chosen from the rules rather than from a hand on the glass — the device
pass that judges them is §10 of
[`../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md)
— so they are **owner's judgements, not measurements**, and the fourth (`reversals` = 2) is
still mine. ⛔ `evictShakeLegMm` still clears the validator's floor of 3× the measured noise.

---

## ⭐ CARRIED FROM THE QUEUE ROW, 2026-09-16 — verbatim

⚠ `QUEUE.md` is a front door and this cell had grown to an essay inside a table. ⛔ Distilled there to state + one lesson + this pointer; the full text is below, unrewritten, per `README.md` rule 2.

> queued. ⛔⛔ **A TRAP NO TEST CAN CATCH, READ IT BEFORE BOOKING A SESSION: six tunables are still READ but are OFF THE GESTURE PATH** — `rollAngle`, `gainRoll`, `rollStepDistance`, `rollReleaseDistance`, `rollFilterMinCutoff`, `rollFilterBeta`. `A12` moved roll to the second touchpoint's `x`, and `roll.ts` is kept unwired with its 40 vectors, so `config_debt.test.ts` still sees them as used. ⭐ **Measuring them would change nothing a hand can feel.** Do not spend a session on them unless the circular roll comes back. ⭐⭐ **MEASURE FIRST INSTEAD**: `motionDeadbandMm` — it is the commit threshold, the rest test AND the jitter deadband at once, and it was set by feel at 3.5 mm without ever being measured. ⛔⛔ **A GUESSED GAIN IS RELIABLY TOO SLOW — THREE FOR THREE**: every gain a hand has set was raised from my guess, by ×3.4, ×2.3 and ×2 (`gainRotateFree`, `gainOrbitYaw`, `gainOrbitElevation` — the last one on 2026-09-14, and its row had already *predicted* it was slow without that being worth anything until a finger moved the slider). `IN3`/`IN4` add seven more — **give each a slider when it is wired**, not after a session is spent disliking it. ⭐⭐ **Now practical: tunables override from the URL** (`?motionDeadbandMm=3.5&gainRollDrag=3`), so a value can be A/B'd by finger without a rebuild — `src/input/config_override.ts`. ⭐⭐ **`pointerNoiseMm` FIRST** — ⭐ **instrument BUILT 2026-09-14** (`src/input/noise_meter.ts`, on the HUD as `noise floor=…`): hold one finger still and read `floor`; the sagitta criterion and several thresholds are only defensible relative to it. ✅ **READ 2026-09-14: 0.761 mm**, five times the placeholder — and measuring it exposed a defect in the sagitta guard (see the YOU-ARE-HERE block). ⚠ Then the 1€ pair by the paper's procedure (`beta`=0, lower `minCutoff` until slow jitter is acceptable, then raise `beta` until fast motion stops lagging). ⚠ `IN1` added four more (`tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`, and a moved `stillTime`) and found `stillSpeed`/`stillTime`/`moveExitDistance` are **not independent** — measure them together

---

## ⭐ MOVED HERE 2026-09-16 FROM `10_INPUT_TOUCH/INDEX.md` — unrewritten

⚠ A front door states what is TRUE and points at where it is explained; this is the
explanation. ⛔ It moved because the INDEX reached its byte budget with 88 bytes to spare, and
shaving a sentence would only have postponed the same edit. Per `README.md` rule 2 the text is
not rewritten.

⭐⭐ **`IN5` IS NOW PRACTICAL.** Tunables override from the **URL**
(`?motionDeadbandMm=3.5&gainRollDrag=3`) and the orbit rings have an on-screen **tuning
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
[`../../10_INPUT_TOUCH/history/2026-09-13_IN1_device_passes.md`](../../10_INPUT_TOUCH/history/2026-09-13_IN1_device_passes.md);
the rows' dossiers are [`./IN1.md`](./IN1.md)
and [`./IN9.md`](./IN9.md).
