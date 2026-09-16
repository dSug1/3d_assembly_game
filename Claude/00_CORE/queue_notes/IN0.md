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

---

# ⛔⛔ AND THE BAND WAS TAXING THE DRAG — found by finger, 2026-09-15

> *"Does your deadband impact the sway and the damping: the object translation is less
> fluid than when we had no depth translation built in?"*

⭐ **Yes, and the answer is a measurement rather than an opinion:**

| | dead travel | lag at 50 mm/s | at 200 mm/s |
|---|---|---|---|
| entering a drag | 1 band = **2.5 mm** | 48 ms | 16 ms |
| ⛔⛔ at a **REVERSAL** | 2 bands = **5.0 mm** | **88 ms** | 24 ms |

⛔⛔ **The anchor trails one radius BEHIND the finger, so reversing means crossing the whole
dead circle** — the far side, not the near one. ⚠ Rule 6's follower is τ = 7.6 ms with a
0.2 ms lead, tuned over five device passes; the band was putting **more than ten times
that** in front of it as pure dead time. ⭐ Dead time is not lag — nothing downstream can
absorb it, which is exactly why a hand reports it as *fluidity* rather than as slowness.

⚠ **Worst where it hurts most**: a fixed distance costs more time the slower you move, so
the careful slow adjustment that assembly is made of paid the largest penalty.

⭐ **It desynchronised the sway**, too: the sway reads the raw sample stream for direction
and speed, gated by the motion state — which stays `MOVING` through a reversal. So the
scene kicked on the turn while the held object had not moved yet.

## The fix is a distinction, not a number

⭐⭐ **A finger that has already PROVEN it is moving needs no further proof.** The band
exists to reject the jitter of a finger at REST, so it gates the way OUT of rest — paid once
per gesture — and once out, travel passes through undiminished.

⛔ The state machine is untouched, which is what makes this safe: rest is still found by the
same trailing anchor and the same `restConfirmMs`, so A10's depth gate reads what it read
before. A reversal now costs **one sample**, at every speed.

## ⭐⭐ The carried lesson

> **A threshold that guards a TRANSITION must not also tax the STEADY STATE.**

⚠ And the tell is worth knowing: the complaint was about **fluidity**, not about speed or
distance. Dead time feels different from lag, and it points at a threshold being re-charged
somewhere it should not be.

⭐ This is the fifth thing §1.1 has been wrong about, and the first that was a *design*
distinction rather than a quantity or a clock. The file is worth reading end to end before
touching `motion.ts`.

---

# ⛔⛔ TWO MORE, 2026-09-16 — a tracker that outlived its finger, and the band's own boundary

## 1. A stale tracker made a NEW finger read as `MOVING`

> *"Two touchpoints on respective objects && both delta positions → translation of both
> objects → OK. Then I release the second touchpoint and press it outside any object while
> the first touchpoint remains pressed → this should control immediately rotation of the
> first object. However, I see that the first object continues translation and then switch
> to rotation. What is wrong?"*

⭐⭐ **The cause**: a `MotionTracker` keeps an anchor POSITION, and the scene kept one per
touchpoint in a map **keyed by pointer id** — which **browsers reuse after a release**. A new
finger landing on a reused id inherited the previous finger's tracker, measured its
displacement from an anchor somewhere else entirely, and read `MOVING` at once.

⛔ Under `A13` that is decisive: a second finger judged to be MOVING means the holder keeps
**translating**, and it flips to **rotation** only once the new finger settles —
*"continues translation and then switch to rotation"*, exactly.

⭐⭐ **THE SAME TRAP, ONE LAYER UP.** `router.ts` already guards it and says why:

> *"Browsers do reuse ids, but only AFTER a release — so treat this as a fresh press and
> drop the stale latch."*
>
> *"`seq` … the ONLY ordering anyone gets, and it is explicit: `Map` iteration order is
> insertion order and would LOOK like press order right up until an id is reused."*

⚠ I copied the map and not the guard. **The fix is structural, not a cleanup to remember**:
the trackers are now keyed by the router's `seq`, which is monotone for the life of the
router and never reused. ⭐ Entries are also dropped on release, at all four release sites,
so the map cannot grow — but that is belt to the structural brace, not the fix itself.

⛔ **Stated plainly: no vector catches the WIRING.** `scene.ts` is behind the engine
boundary — keying by `id` again reddens nothing. What *is* pinned is the **mechanism**: a
far-away sample fed into an existing tracker reads `MOVING` instantly, while a fresh tracker
calls the identical landing `STATIONARY`.

## 2. A finger stopping DEAD rested exactly ON the band boundary — and never settled

⚠ Found by the owner raising `motionDeadbandMm` from 2.3 mm to 3.5 mm: a vector that had
passed for a day went red, **and it was not the fixture**.

⭐⭐ While an axis moves, its band centre is dragged to trail by **exactly one band**. So the
instant the finger stops, its displacement is **exactly** the band — the `<=` boundary, on
every sample. ⛔ Land on the wrong side of that comparison and the axis never becomes
`STATIONARY` at all: `restingSinceMs` is never set, so the rest timer never starts.

⛔⛔ **And it did land on the wrong side.** Storing the centre as `p − band` and then
re-deriving `p − centre` is a **round trip through floating point**: at `p ≈ 400 px` it comes
back about `1e-14` too large. ⚠ Whether that bites depends on the MAGNITUDE of the
coordinate and the SIZE of the band — which is why it was invisible at 2.3 mm and appeared
at 3.5 mm.

⭐ **The fix removes the round trip**: the axis now carries the signed **offset** and
accumulates it by `+= (p − prev)`, clamping to `±band`. A still finger adds exactly zero, so
the offset stays exactly on the boundary and rest is reached at **every** coordinate and
**every** band. Both are swept in the vectors — five positions and five band sizes — because
a fixture at one convenient `x` would have passed while the product failed.

⭐⭐ **The carried lesson**: *a threshold the state machine PARKS ON is a threshold that will
be compared at its exact value, for ever.* Never compute that value by a round trip; carry
the quantity the comparison is about.

⚠ And the tell that it was a defect rather than a stale fixture: the failure depended on the
BAND SIZE, which is a tuning value. A fixture goes stale against a number it hard-codes; a
defect changes behaviour when a number the PRODUCT uses moves.


---

## ⭐ MOVED HERE 2026-09-16 FROM `AMENDMENTS_R5.md` — A11's fluidity report

⚠ The amendments file reached its 800-line cap, and this is NARRATIVE: the measurement
that produced A11's *gates entry, not motion* clause. ⛔ Nothing is rewritten — it is moved
whole, and the amendment keeps the decision plus a pointer here. `Claude/README.md`: *state
in INDEX/amendments, narrative in the dossier.*

### ⛔⛔⛔ THE BAND GATES **ENTRY INTO MOTION**, NOT THE MOTION ITSELF

> *"Does your deadband impact the sway and the damping: the object translation is less
> fluid than when we had no depth translation built in?"*

⭐ **It did, and the cost was MEASURED before it was fixed:**

| | dead travel | lag at 50 mm/s | lag at 200 mm/s |
|---|---|---|---|
| entering a drag | 1 band = **2.5 mm** | 48 ms | 16 ms |
| ⛔⛔ at a **REVERSAL** | 2 bands = **5.0 mm** | **88 ms** | 24 ms |

⛔⛔ **THE ANCHOR TRAILS ONE RADIUS *BEHIND*, SO REVERSING MEANS CROSSING THE WHOLE DEAD
CIRCLE** — the far side, not the near one. ⚠ Against rule 6's tuned follower
(τ = 7.6 ms, ζ = 0.2, lead = 0.2 ms) that is **more than ten times the entire time
constant**, as pure dead time, in front of it. ⭐ No damping value can absorb dead time,
which is why it reads as *"less fluid"* rather than as *"too slow"*.

⚠ **And it was worst exactly where it hurts most**: a fixed distance costs more time the
slower you move, so a careful, slow adjustment — the kind assembly is made of — paid the
biggest penalty.

⭐ **It desynchronised the sway, too.** The sympathetic sway reads the raw sample stream for
its direction and speed, gated by the motion state — which stays `MOVING` through a
reversal. So the scene kicked on the turn while the held object had not moved yet.

### ⭐⭐ The distinction the first version missed

**A finger that has already PROVEN it is moving needs no further proof.** The band exists to
reject the jitter of a finger at **rest** — so it gates the way *out* of rest, paid once per
gesture, and once out, travel passes through undiminished.

| | before | after |
|---|---|---|
| entering a drag | 1 band | **1 band** — unchanged, and it is the whole point |
| at a reversal | 2 bands | ⭐ **one sample**, at every speed |
| a still finger | emits nothing | **emits nothing** |
| total travel | true − 1 band | **true − 1 band** |

⛔ The STATE machine is untouched, which is what makes this safe: rest is still found by the
same trailing anchor and the same `restConfirmMs`, so A10's depth gate reads exactly what it
read before.

⭐ `METHOD`: *a threshold that guards a transition must not also tax the steady state.*


---

## ⭐ MOVED HERE 2026-09-16 FROM `AMENDMENTS_R5.md` — two more of A11's narratives

⚠ Same reason as the block above: the amendments file passed its cap when `A15` landed, and
both of these are RECORD rather than decision — §1.1's sequence is what this dossier owns.
⛔ Moved whole, not rewritten; the amendment keeps its clause and points here.

### ⛔⛔⛔ AND REST MUST BE REACHABLE WITHOUT FURTHER EVENTS

⚠ **The device report survived A10's fix AND A11's, and the owner was right that neither
explained it:**

> *"I still experience issue passing from x/y translation to depth translation (sometimes,
> it is blocked) while passing from depth translation to x/y translation is smooth and
> instantaneous: there is something wrong you did not explain nor check."*

⛔⛔ **THE STATE MACHINE IS DRIVEN BY `push`, AND `push` IS DRIVEN BY `pointermove`. A
finger resting on glass emits no `pointermove` events — that is what resting *is*.** So the
tracker froze at whatever it last was, and what it last was is `MOVING`.

⭐⭐ **The asymmetry was structural, and exactly inverted from what the rules need:**

| transition | driven by |
|---|---|
| → `MOVING` | an event that **necessarily exists** — the finger moved |
| → `STATIONARY` | an event that **by definition may not arrive** |

⚠ And it explains *"sometimes"* precisely: the only thing that thawed the tracker was a
stray jitter sample crossing the digitizer's own threshold, and those arrive at random.
Blocked for a while, then suddenly triggered.

⭐ **`MotionTracker.tick(now)`, driven by the render loop every frame**, for every live
touchpoint — and again at the exact moment an anchor event asks the question, because an
event can arrive between frames.

⭐⭐ **The quantity it reads is not a consolation prize: elapsed time with NO sample is the
strongest evidence of stillness there is** — stronger than samples inside the dead radius,
because a sample inside the radius is still a *report of motion* and silence is not. It
simply has to be asked for. ⛔ A tick decides a STATE and emits no travel, ever: a tick that
produced a delta would let a dropped frame move an object, which its own vector caught.

⚠ **CARRIED**: *a threshold is only half a rule — the other half is what advances the clock.*
Three fixes went into the number before anyone checked that the thing which clears it can
run at all.


### ⭐⭐ The carried lesson

This is the **fourth** formulation of §1.1, and the first three all failed the same way:

| formulation | how a real pointer broke it |
|---|---|
| *accumulated travel* (the spec's own words) | path length of jitter is a random walk — grows without bound, so every resting finger read MOVING |
| instantaneous speed | cannot see a slow persistent creep |
| speed over one sample pair | 0.761 mm / 8 ms = ~95 mm/s **at rest** — STATIONARY unreachable |
| ⭐ **a position deadband** | robust by construction |

⛔⛔ **Every quantity §1.1 names is defined on an IDEAL pointer**, and each fix so far had
been a threshold chosen to sit above a measurement. ⭐ A displacement deadband needs no such
choice: it is the *shape* that is right, not the number.

---


---

## ⭐ MOVED HERE 2026-09-16 — A11's three reference tables

⚠ The last of A11's RECORD, moved when `A15` pushed the amendments file past its cap.
⛔ Moved whole, not rewritten. The amendment keeps the decision and points here.

### What per-axis costs, stated

| | radial | per axis |
|---|---|---|
| entering along one axis | 1 band | **1 band** |
| entering at 45° | 1 band | ⚠ **1 band on each axis** — 1.41× the diagonal travel |
| a reversal | one sample | **one sample** — ⭐ fluidity is unchanged, measured |
| a nearly-axial drag | ⛔ the off-axis wobble reaches the object | ⭐ **the off-axis emits zero** |

⭐ Measured after the change: reversal cost is still **one sample at every speed**, and
entering a drag still costs one band. Going per-axis bought the corridor for nothing.


### ⭐ Where it is applied

⛔ **Every `x`/`y` input of both touchpoints**, on the owner's instruction — rule 2bis's
yaw/pitch, rule 6's translate, and A10's depth. ⚠ **Except the ROLL**, which is an angle
about a fitted centre rather than an axis pair, and already carries its own 1€ filter.

⚠ **One consumer is deliberately still raw: §2 rule 1, the camera orbit.** It is a CLOSED
row (`IN9`) tuned by finger over three device passes, and the owner's instruction named
rotation and translation of an OBJECT. ⭐ It is the same jitter and the same fix if a hand
ever wants it — recorded so it is a decision rather than an omission.

⭐ **Owner's note for a later row**: the second touchpoint's **delta position x** will drive
something (A10 currently reads its `dy`). Not built.


### What A11 deleted

| gone | why |
|---|---|
| `stillSpeed` | a rate; the radius over a duration *is* a rate, with a stated baseline |
| `stillTime` | the settle timer the device complained about |
| `moveEnterDistance` / `moveExitDistance` | one radius, so there is no pair to be inconsistent |
| the *reachability* validator rule | it related a rate to a distance; neither exists now |
| `A9`'s separate `deadbandMm` | ⭐ **the same thing, one tier down** — applied once, for every rule at the same time |

⭐ **`motionDeadbandMm` is now the most load-bearing number in the input layer**: the commit
threshold, the rest test and the jitter deadband are all one radius. ⛔ It has a slider, and
a device must judge it.

