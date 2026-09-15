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

---

# ⛔⛔ REOPENED 2026-09-15 — §1.1 COULD NOT SEE A FINGER COME TO REST

**Found by building `A10`**, whose depth gate is the first rule on this project that asks
*"is that finger still?"*. ⛔ The answer was **no, for any real finger, for ever**.

## The two causes

**1. ⛔⛔ The speed was estimated over ONE SAMPLE PAIR — mistake shape 1, in the file that
defines *moving*.**

```
0.761 mm of measured noise / 8 ms between samples = ~95 mm/s of apparent speed AT REST
                                                    against a stillSpeed of 6 mm/s
```

⛔ Sixteen times over, from jitter alone — so the `else` branch cleared settle candidacy
on essentially every sample and the state machine could never accumulate `stillTime`.

**2. The settle-excursion bound sat BELOW the noise floor.** `moveExitDistance` was
0.8 mm against a 0.761 mm RMS floor. ⚠ A bound the noise cannot fit inside is a bound a
**resting finger can never satisfy** — and every sample across the whole `stillTime` has
to fit, not the average one.

## ⭐⭐ Measured, both ways — not argued

| | before | after |
|---|---|---|
| a finger held still for 4 s after a drag | **never** returned to STATIONARY | returns in **< 1 s** |

⭐ Both are golden vectors now, and **the old per-pair estimate is kept as a
counter-example** — re-implemented inside the test, asserting that it does *not* come
back. A fix with no pinned defect beside it can be quietly undone.

## ⭐ The fix was already written down, in another file

`flick.ts`'s header: *"Lift speed over a **window**, never the last sample pair."* ⛔ The
same defect, the same fix, one file away — and §1.1 is where the project's own definition
of *moving* lives. Speed is now net displacement across a trailing window bounded by
`stillTime`, so noise does not accumulate: a resting finger reads a few mm/s, not ninety.

⭐ And a `validateGestureConfig` rule closes the other side: `moveExitDistance` must
exceed `SETTLE_NOISE_MULTIPLE × pointerNoiseMm`. ⭐⭐ The bound is now **sandwiched** — the
existing rule says it must be REACHABLE from above (`stillSpeed × stillTime` exceeds it),
the new one that it must be SATISFIABLE from below. One threshold, two walls.

## ⚠ Why eight device passes never showed it

⛔⛔ **Nothing shipped depended on RE-ENTERING STATIONARY.** The commit threshold reads
the MOVING *transition*; rule 6 reads presence; the flick test reads lift speed; the sway
has its own watcher. The state machine's return path was dead code that looked alive.

⭐⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent property.* The
threshold was defensible and the measurement was correct; only their composition was
wrong. ⚠ And it had been wrong since 2026-09-14, the day `pointerNoiseMm` was measured —
**the second threshold that measurement invalidated**, after the sagitta guard. ⭐ The
carried lesson: *when a number stops being a guess, re-check every threshold sized against
the guess* — one sweep, the same day.

## ⚠ THE FEEL CHANGED, AND A DEVICE MUST JUDGE IT

| | was | now | why |
|---|---|---|---|
| `moveExitDistance` | 0.8 mm | **2.4 mm** | ≈3× the 0.761 mm floor |
| `moveEnterDistance` | 1.5 mm | **3.2 mm** | must exceed the exit bound, or the state chatters |
| `stillTime` | 150 ms | **450 ms** | `stillSpeed × stillTime` must exceed the exit bound; the speed window is this long |
| `stillSpeed` | 6 mm/s | **6 mm/s** | ⛔ unchanged, deliberately |

⛔⛔ **RAISING `stillSpeed` TO 18 WAS TRIED FIRST AND TWO EXISTING VECTORS CAUGHT IT**: a
deliberate 12 mm/s drag would become a settle candidate, cover 1.8 mm in 150 ms, and
**latch STATIONARY** — which under A10 means a real slow drag would read as a request for
depth. ⭐ The discrimination matters more than the latency, so the cost was taken in
latency.

⚠ **What a hand will notice**: a drag commits after 3.2 mm instead of 1.5 mm, and after
the holder has moved, STATIONARY takes ~0.9 s to return. ⭐ A finger placed and not moved
starts STATIONARY and waits for nothing — the ordinary way into a depth push. ⛔ All four
have sliders, in the tuning menu and on the URL.

⚠ **Two fixtures had to be re-based**, and both were stale rather than wrong: they held a
finger still for a literal 600 ms, sized against `stillTime` = 150. They now derive the
duration from the config, so the next re-size cannot silently break them.

---

# ⭐⭐⭐ AND THEN THE OWNER REPLACED THE WHOLE THING — `A11`, the same day

The windowed-speed fix above **worked and was still wrong**, and a hand said so within
minutes:

> *"Most of the times, when I switch from x/y to depth translation, even if I make ample
> movement with the second touchpoint finger, there is no depth translation for a while
> and then suddenly the depth translation is triggered. On the opposite, if I switch from
> depth to x/y translation, the switch is immediate and the object immediately follows the
> first touchpoint finger. I don't understand why."*

⭐ **The asymmetry was structural.** Entering `MOVING` was a DISTANCE test — instant.
Returning to `STATIONARY` was a DURATION test, and the windowed-speed fix had made it
worse: the window had to FILL (450 ms) before the settle timer could even start (450 ms
more). ⛔ **Two durations in series, ~900 ms**, sitting in front of the one transition
A10's depth gate depends on.

## The owner's model

> *"Stationary should mean a deadband around the touchpoint position (independently of the
> time). Check how Unity defines deadband on delta position and how it catches up once
> delta position crosses the deadband."*

⭐⭐ An anchor trails the finger at one dead radius. Inside it, the finger is still and
emits nothing; outside, it emits the **excess only** and drags the anchor up. ⛔ Time-free,
exact, and it keeps slow travel — see `A11` for the full argument and
[`IN12.md`](IN12.md) for why the per-axis form this project had specified was wrong.

## ⚠ So what is the status of everything above?

✅ **The DEFECT above was real and is the reason A11 exists.** ⭐ But its FIX — a windowed
speed estimate, a re-sized four-threshold set, a reachability rule — lived for about an
hour. `stillSpeed`, `stillTime`, `moveEnterDistance` and `moveExitDistance` are all gone.

⭐⭐ **The carried lesson is the sequence, not either fix**: §1.1 has now had FOUR
formulations, and the first three were each a threshold chosen to sit above a
measurement — accumulated travel, instantaneous speed, windowed speed. ⛔ Every one of
them broke on a real pointer, in a different way, and each fix made the *number* better
without making the *shape* right. ⭐ A displacement deadband needs no such choice.

⚠ **What survived from the fix above**: `SETTLE_NOISE_MULTIPLE`, and the validator rule
that the dead radius must clear the measured noise. That was the half that was missing,
and it is the only consistency rule §1.1 has left.

---

# ⛔⛔⛔ AND THE REAL CAUSE WAS THE CLOCK, NOT THE THRESHOLD

**The same report came back a third time**, after the windowed-speed fix and after A11's
deadband:

> *"I still experience issue passing from x/y translation to depth translation (sometimes,
> it is blocked) while passing from depth translation to x/y translation is smooth and
> instantaneous: there is something wrong you did not explain nor check. I want the same
> smooth on both transitions, and your time and deadband does not explain this issue."*

⭐ **Correct on every count.** Both previous fixes were to the THRESHOLD. Neither checked
whether the thing that clears it can run.

## The cause

⛔⛔ **`MotionTracker` is advanced only by `push`, and `push` is called only from a
`pointermove` handler. A finger resting on glass emits no `pointermove` events — that is
what resting IS.** So the tracker froze at whatever it last was, and what it last was is
`MOVING`.

| transition | driven by |
|---|---|
| → `MOVING` | an event that **necessarily exists** — the finger moved |
| → `STATIONARY` | an event that **by definition may not arrive** |

⭐⭐ That is the asymmetry the owner described, stated exactly. And it explains
*"sometimes"*: the only thing that thawed the tracker was a stray jitter sample crossing
the digitizer's own threshold, arriving at random — blocked for a while, then suddenly
triggered.

## The fix

`MotionTracker.tick(now)`, driven by the render loop every frame for every live
touchpoint, and again at the moment an anchor event asks the question.

⭐⭐ **The quantity is the right one, not a fallback: elapsed time with NO sample is the
strongest evidence of stillness there is** — stronger than samples inside the dead radius,
because a sample inside the radius is still a report of motion and silence is not.
⛔ A tick decides a STATE and emits no travel: caught by its own vector, which found
`step` still holding the previous push's delta after a tick.

## ⭐⭐ THE CARRIED LESSON, AND IT IS THE POINT OF THIS WHOLE FILE

§1.1 has now been wrong four times about the QUANTITY and once about the CLOCK, and the
last one cost three device reports because I kept re-deriving the number:

> **A threshold is only half a rule. The other half is what advances the clock — and if
> the state machine is driven by the very signal whose ABSENCE it is trying to detect,
> no threshold can ever be right.**

⚠ The tell was in the report from the first day and I read past it three times: the
transition that worked was the one whose evidence always exists.
