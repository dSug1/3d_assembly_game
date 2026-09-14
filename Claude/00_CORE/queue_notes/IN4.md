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

## ⚠ And one reading of rule 6 that had to be chosen

Rule 6's wording is a **per-frame** condition: *the touchpoint outside any object is
`STATIONARY`*. Read literally, the object would flip between TRANSLATING and ROTATING
every time the resting thumb twitched — the exact failure §4's role latch exists to
prevent, one level up. ⭐ So `STATIONARY` is honoured where it is meaningful, as the
**entry** condition: the mode is decided once, at the moment the gesture commits, and
latched for the rest of it (`Held.mode` in `scene.ts`, printed on the HUD).
⛔ **This is a judgement, and the device look is where it gets confirmed or overturned.**

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
3. ⛔ **The latched mode**: start a drag with a thumb resting outside the object, then
   twitch that thumb. The object must keep translating, not flip to rotating. The HUD
   prints `TRANSLATE` / `ROTATE` so the latch is visible.
4. ⚠ Rotation must still work with **no** anchor down, and the anchor must not start an
   orbit while an object is held.
