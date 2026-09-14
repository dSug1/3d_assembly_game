# `IN4` — rules 4–6 (two touchpoints)

**Status: partial. Rule 4 ✅ (`IN9`). Rule 6 built 2026-09-14, ⛔ NOT CLOSED — needs a
device look. Rules 6bis / 6ter / 6quater wait on `3D1`.**
`src/input/translate.ts` · `tests/translate.test.ts` · wired in `src/render/scene.ts`.

## ⭐⭐ Why rule 6 came before `3D1`

`IN4`'s dependency on the object model **is not uniform**. Rule 6 is defined on *the
selected object* plus a screen frame — no faces, no connectors, no assembly tree. Rules
**6bis / 6ter / 6quater** are defined on `AxisBtwFaces`, the axis between the centres of
two selected FACES, and a face centre is exactly what `3D1` owns. ⭐ Same reasoning that
let `IN9` ship ahead of `3D1`: ask what a rule actually READS, not which phase it is
filed under.

## ⛔⛔ The gain was COMPUTED BEFORE IT WAS WRITTEN

Rule 6 is `translate × zoom × orbit`, which is mistake shape 4's exact territory, so the
composition was computed first. World displacement per millimetre of finger, for the
object to stay under that finger:

```
                   d=0.15 m   d=0.37 m   d=0.6 m   d=1.14 m   d=3 m
 viewport  640 px    0.75 mm    1.85 mm   3.00 mm    5.69 mm   14.98 mm
 viewport  800 px    0.60 mm    1.48 mm   2.40 mm    4.55 mm   11.98 mm
 viewport 1024 px    0.47 mm    1.15 mm   1.87 mm    3.56 mm    9.36 mm
```

⛔ **A 20× range across the zoom clamp alone** (0.15 m → 3 m), and another **1.6× across
plausible screen sizes**. A fixed metres-per-millimetre gain cannot serve both ends:
tuned where it feels right zoomed out, the object barely creeps zoomed in. ⚠ The orbit
surface moves the distance too, and asymmetrically — 1.14 m at the top ring against
0.71 m at the bottom — so the same drag would behave differently looking down than up.

⭐⭐ **So the gain is a MULTIPLIER on a computed factor, not a number.**
`trackingMetresPerPx(distance, fov, viewportHeightPx)` returns the exact displacement
that keeps the object under the finger; `gainTranslateScreen` scales it, and **1.0 is
the correct value, not a preferred one.** ⛔ It is the first gain on this project with a
right answer — every other one is taste, and three of those were guessed too slow (×3.4,
×2.3, ×2). The slider exists so the claim can be **disproved by finger**, not because
the number is unknown.

## ⚠ Two deviations from the spec, both deliberate

1. **It supersedes §1.2's `cameraDistance / referenceCameraDistance` for rule 6.** The
   ratio form is right in SHAPE — proportional to distance is what keeps the object
   under the finger — but it is only CORRECT on the one screen it was tuned on. The
   computed factor removes the device dependence and the reference constant with it.
   ⚠ `referenceCameraDistance` survives in `config_debt`'s pending list for
   6bis/6ter/6quater; if those compute their factors the same way it should be
   **deleted**, not kept.
2. **§1.2's stated rationale is backwards and was not followed.** It says the scaling
   exists *"so that one millimetre of finger travel maps to a constant world displacement
   regardless of zoom."* Scaling by distance does the opposite — the WORLD displacement
   grows with distance and the SCREEN displacement is what stays constant. The formula is
   the useful one; the sentence explaining it is not.

## ⛔⛔ THE READING I CHOSE WAS WRONG, AND THE DEVICE OVERTURNED IT

**What I built first.** Rule 6's wording is a per-frame condition — *the touchpoint
outside any object is `STATIONARY`* — so, reasoning from §4, I honoured it as an ENTRY
condition and **latched** the answer at the moment the drag committed. The argument was
that a per-frame read would flip the object between translating and rotating every time
a resting thumb twitched.

**What the owner found, first try (2026-09-14).** *"When the second finger outside the
object moves then becomes still, there is no translation by the first finger on the
object: the object rotates as if there were no 2nd finger."* A plain bug. The latch also
locked out the case where the anchor goes down AFTER the drag has begun.

**The decision.** *"A second finger outside any object, whatever it has done previously,
if still on the screen, should trigger translation."* Rule 6 now reads **PRESENCE**, every
frame. No motion state, no latch.

⭐⭐ **AND THE LESSON IS THE DISTINCTION BETWEEN THE TWO SIGNALS**, which is worth more
than the fix. §4 latches roles because `MOVING`/`STATIONARY` is a **noisy, continuous**
reading: a resting thumb crosses the threshold on its own, so anything keyed to it
flickers. Whether a finger is **down** is neither noisy nor continuous — it is discrete,
deliberate, changes only when a person decides it does, and is the one piece of state
they can actually see. Latching *that* hides state instead of protecting it.
⛔ **Do not generalise "latch at press" to every input.** I generalised a rule past the
property that justified it, and no vector could catch that because the vectors encoded
the same wrong idea.

⚠ Two anchors and one object is not in §4's table either; it translates, because that
surprises nobody. Pinch and orbit both require NOTHING held, so neither can collide.

## ⭐ INERTIA — the object has mass

The owner, same pass: *"the translation movement … feels inauthentic. There should be
some acceleration and deceleration (a bit like physics applying a force to the object
with some inertia)."*

⛔⛔ **That is a SECOND-ORDER system, and the distinction is the whole point.** A
smoothing filter (first-order lag) also arrives late, but it has **no momentum**: it
leaves at its fastest and slows down monotonically. A mass leaves at ZERO speed, builds
up, and eases in. The vectors separate the two — a first-order lag fails the
"it ACCELERATES" vector.

`src/input/follow.ts` is **critically damped**: the fastest approach with **no
overshoot**. ⚠ Under-damping wobbles, which in a manipulation tool reads as *"it slid
past where I put it"* rather than as weight; over-damping is just lag.

⛔ **The step is the exact analytic solution**, not an Euler integration — textbook
mathematics (the repeated-root case of a linear second-order ODE), so no licence
question (`N13`). It is used because it is **unconditionally stable and frame-rate
independent**: an Euler step diverges for `dt > 2τ`, and a dropped frame on a tablet is
exactly when that happens. ⚠ Two 8 ms frames must land where one 16 ms frame does, or the
feel of the drag becomes a function of the frame rate — a composition nobody would think
to check.

⭐ **The follower is keyed by MESH and outlives the release.** That tail *is* the
deceleration; a follower torn down with the gesture would stop the object dead the
instant the finger left, which is the teleporting feel the inertia exists to remove.
⛔ It is advanced in the **render loop**, because pointer events stop arriving the moment
the finger stops and a system with momentum has to keep integrating after its input goes
quiet.

⚠ `translateInertiaMs` defaults to **90 ms and that is a GUESS** — this project is three
for three on guessed numbers being wrong. It ships with a slider, and `0` disables it
exactly, which is the only setting that can be checked against the tracking factor.

## What the five wrong implementations did, and which vector caught each

| naive implementation | caught by |
|---|---|
| §1.2's ratio with a hand-tuned constant | the round trip, the zoom-extremes property, the CSS-pixel vector, the linearity vector |
| no distance term at all (a fixed gain) | the round trip + the zoom-extremes property |
| screen-y sign not flipped | the round trip + the direction vector |
| degenerate viewport allowed through | the zero-height vector |
| horizontal field of view instead of vertical | the round trip + three others |

⭐ The first vector is the COMPOSITION, written as a **round trip**: move the object by
what the rule says, project it back onto the screen with arithmetic derived
independently, and check it landed under the finger — at all six camera distances the
zoom clamp and the orbit rings can actually produce.

## What to judge on the device

1. ⭐ **Does the object sit under the finger** at full zoom-in and full zoom-out? That is
   the claim gain 1.0 makes, and it is the one thing a suite cannot confirm.
2. ⚠ **Does 1.0 feel right**, or does direct manipulation want a little lead or lag?
3. ⛔ **The trigger**: put the second finger down mid-drag, move it, let it settle, move
   it again — the object must translate throughout. Lift it and rotation must come back.
   The HUD prints `TRANSLATE` / `ROTATE`.
4. ⭐ **The inertia at 0 ms vs 90 ms vs 400 ms.** At 0 the object must be pinned to the
   fingertip exactly; the question is where between weight and lag the right answer sits.
4. ⚠ Rotation must still work with **no** anchor down, and the anchor must not start an
   orbit while an object is held.
