# `IN4` — rules 4–6 (two touchpoints)

**Status: partial. Rule 4 ✅ (`IN9`). Rule 6 ✅✅ CLOSED 2026-09-15 — tuned by finger over
five device passes and then confirmed by the owner in ORDINARY PLAY, which is what the row
was holding out for. Rules 6bis / 6ter / 6quater wait on `3D1`, so the ROW stays partial.**
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

⛔⛔ **AND CRITICAL DAMPING WAS STILL NOT IT.** The owner, next pass: *"it still feels
inauthentic. It needs probably more acceleration catch-up after the inertia is overcome.
Check how Unity is doing rigid body translation with force and reapply the same if this
is not patented or licensed."* They set `translateInertiaMs` to **10 ms** — which is
almost off. ⭐ That is the diagnosis: at ζ=1 the follower takes the SLOWEST path that
never overshoots, so every millisecond of τ reads as lag and the only way to stop it
feeling wrong is to turn it off.

### What Unity does, and whether we may use it

✅ **PhysX — Unity's 3D physics — has been open source under BSD-3-Clause since 4.0
(December 2018)**, later extended to the GPU source, with no patent asserted. ⛔ No code
was taken and none needed to be: the model is Newton. From `DyBodyCoreIntegrator.h`:

```
v += (F/m)·dt ;  v *= max(0, 1 − linearDamping·dt) ;  x += v·dt
```

⚠ **That damping term is TIMESTEP-DEPENDENT** — `(1 − c·dt)` is the first two terms of
`e^(−c·dt)`, so the same drag decays differently at 30 Hz and 120 Hz and clamps to a dead
stop at `dt > 1/c`. It was raised upstream as a flaw. Unity survives it by running
physics at a **fixed 0.02 s timestep**. ⛔ We integrate on a render frame that stutters,
so we cannot.

⭐⭐ **So: Unity's MODEL, not Unity's ARITHMETIC.** Same mass-spring-damper
(`ẍ = −ω²(x−target) − 2ζωẋ`, which is `AddForce` with `linearDamping`), integrated by
its exact analytic solution in all three damping regimes. ⭐ A vector **measures** the two
at Unity's own 0.02 s step rather than asserting they agree — and shows the gap is
PhysX's discretisation error by watching it vanish as its timestep shrinks. Copying
PhysX's arithmetic verbatim fails seven vectors.

### ζ is the knob that was missing

Dragged at a steady rate, a follower trails by `2·ζ·τ·rate`. At ζ=1 that trail is
permanent — the object never catches up, it just keeps its distance, which is exactly
"inauthentic". **Below 1 the object accelerates THROUGH the gap**, trails half as far at
ζ=0.5, and arrives with a small overshoot. That is what a mass on a spring does.
⚠ Far below 1 it rings, and ringing reads as a bug rather than as weight.

⚠ **The two numbers must be judged TOGETHER.** At τ=10 ms the motion is over in ~30 ms
and ζ has nothing to act on. The owner's 10 ms was chosen under a model where τ could
only add lag; with ζ available, τ becomes usable again. ⭐ **Try τ ≈ 60–90 ms with
ζ ≈ 0.5** before concluding the inertia should stay near zero.

### ✅ THE SHIPPED SET — five device passes, 2026-09-14

| tunable | value | slider |
|---|---|---|
| `gainTranslateScreen` | **1.17** | 0.1–3, step 0.05 |
| `translateInertiaMs` (τ) | **7.6** | 1–20, step 0.2 |
| `translateDampingRatio` (ζ) | **0.2** | 0.1–0.5, step 0.05 |
| `translateLeadMs` | **0.2** | 0–1.5, step 0.1 |

Measured against a simulated drag — ramp to speed, hold, stop dead. ⚠ The column is
**peak deviation**, not "trail": with a lead the object can be AHEAD of the finger, so
signing it as a trail would be the wrong quantity.

| drag speed | peak deviation | overshoot on stop | settles |
|---|---|---|---|
| 50 mm/s | ~0.13 mm | ~0.27 mm | ~17 ms |
| 100 mm/s | ~0.27 mm | ~0.54 mm | ~42 ms |
| 300 mm/s | ~0.81 mm | ~1.63 mm | ~92 ms |

⭐ At ordinary drag speeds both numbers sit at or under the MEASURED pointer noise
(`pointerNoiseMm` 0.761 mm): the weight is felt in the acceleration, not seen as a gap,
and only shows on a fast flick — which is where a real object's momentum would show
anyway. ⛔ **The whole of the feel lives in the OVERSHOOT, not in any gap.** Worth not
breaking by accident when `3D1` adds connectors that want to snap.

⚠ **The τ floor**: 7.6 ms is not free to lower. Below roughly one pointer interval the
mass stops smoothing the staircase the target arrives in, and the pointer/frame beat
becomes visible — see the YOU-ARE-HERE block in `QUEUE.md`.

### ⛔ REVERTED, AND RECORDED SO IT IS NOT REBUILT

* **`targetVelocity` in `follow.ts`** — makes the trail frame-rate exact, makes the
  object visibly jitter, and the thing it fixes is under the noise floor. The parameter
  and its vectors survive in `follow.ts`; **both call sites pass nothing.** Full
  measurement in `QUEUE.md`'s YOU-ARE-HERE block.
* **Rotation inertia + phantom slerp** (`src/input/spin.ts`) — built, 12 vectors green,
  rejected by the owner on the device. Rotation stays direct.

### ⛔⛔ THE COMPUTED LANDMARK MARKED THE WRONG END OF THE RANGE

The phantom has a distinguished value: the follower trails `2·ζ·τ·rate`, the phantom
leads `lead·rate`, so at **`lead = 2·ζ·τ`** they cancel exactly and the object sits ON
the finger at every drag speed. For the shipped pair that is **3.2 ms**.

⭐ **The owner chose 0.5 ms — under a sixth of it** — and narrowed the slider twice
(60 → 5 ms) to get at the bottom of the range. So the answer to *"should the object sit
exactly on the finger during a steady drag?"* is **no**.

⛔ This is the fourth time on this project that a computed or simulated number has been
moved by a hand, and it is the sharpest: the lead was the one figure here that looked
like it did not need a device, because it falls out of the algebra rather than out of a
preference. It was still the wrong end of the range — for a reason the algebra could not
know, that at τ=8 ms there was no perceptible gap left for it to cancel.
⭐ **A landmark tells you where a range's zero is. It does not tell you where to stand.**

### The phantom, and why it is not a stiffer spring

⚠ The cheap version of a lead derives it from the GAP — `phantom = target + k·(target − x)`
— which is `(1+k)·(target − x)`: algebraically a spring with different `ω` and `ζ`, i.e.
the two knobs we already had, wearing a hat. ⭐ A real lead needs an INDEPENDENT signal,
and that is the target's **own velocity** — feed-forward, not more feedback. A vector
fails if the lead is derived from the gap.

⛔⛔ **And the velocity is SMOOTHED, over the object's own time constant.**
⚠ Mistake shape 1 — *a rate estimated over the shortest available baseline* — has cost
this project three defects, and a two-sample difference here would have been the fourth:
it is noise divided by a few milliseconds, and the lead MULTIPLIES it into where the
object is drawn. Measured: the raw difference injects **1.2 mm** of pure jitter into the
position at ±0.5 mm of pointer noise; smoothed, **0.43 mm** — under the pointer's own
floor. ⭐ Using the object's own τ also means no second slider: the lead is estimated at
the only timescale that can matter to it.

⚠ **Three reference settings are now off the sliders** — `translateInertiaMs = 0` (exact
tracking, the only setting checkable against rule 6's tracking factor), `ζ = 1` (critical
damping, what every overshoot vector is written against) and the neutral lead. All three
stay reachable from the URL:
`?translateInertiaMs=0&translateDampingRatio=1&translateLeadMs=3.2`.
⛔ A slider that cannot reach a reference is fine; a reference nobody can reach at all
is not.

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
4. ✅ **The feel** — gain, inertia, damping ratio and lead were tuned by finger over
   three device passes and are settled. ⚠ What is NOT settled is whether the design
   survives contact with the rest of the game: the whole of the feel is in the overshoot
   now, and `3D1` is about to put connectors on these objects that will want to snap.
4. ⚠ Rotation must still work with **no** anchor down, and the anchor must not start an
   orbit while an object is held.

---

## ✅✅ RULE 6 CLOSED — 2026-09-15, by the owner, in ordinary play

*"Rule 6 is working OK on device."*

⭐ **That is the verdict this dossier was explicitly holding out for**, and it is the one
thing no suite could have supplied. The row withheld closure because the four numbers had
been judged in a *tuning session* — a bench, where a hand is hunting for the difference
between two settings — and not in ordinary play, where a hand is trying to do something
else and the mapping either disappears or annoys. It disappeared. ⭐ So the claim that
`gainTranslateScreen` = 1.0 is a **computed** value rather than a preferred one has now
survived contact with a hand that was not auditing it.

⛔ **What this does NOT close.** `IN4` stays **partial**: 6bis, 6ter and 6quater are
defined on `AxisBtwFaces` — the axis between two selected FACE centres — and a face centre
is exactly what `3D1` owns. The row cannot close before the object model exists.

⚠ **And it closes at the moment something is about to pull on it.** The whole of the feel
now lives in the OVERSHOOT — 0.3–1.8 mm of follow-through, against a measured 0.761 mm
pointer noise floor — and `3D1` is about to put connectors on these objects that will want
to snap. ⭐ **A capture radius near that scale will fire on the follow-through rather than
on the intent.** That is a number to compute against this measurement BEFORE it is
written, not to discover on a device afterwards: the capture radius has no measured floor
today, and it was the predecessor's last unmeasured constant too.

⭐ The shipped set is unchanged by this closure, and `gestureConfig.ts` is the one copy:
gain **1.17**, τ **7.6 ms**, ζ **0.2**, lead **0.2 ms**.

⚠ **One figure above is a snapshot, and is left standing as the record**: the landmark
section says the owner chose **0.5 ms**, which was true of the pass that wrote it. The
slider went lower afterwards and **0.2 ms shipped** — a *fifteenth* of the 3.2 ms landmark
rather than a sixth, which makes that section's point more sharply, not less.

---

## ⚠ A CANDIDATE EXTENSION TO RULE 6, deferred to a device QUESTION — §3.2 DS3

Raised 2026-09-15 from the owner's `TECHNIQUE_CATALOG.md` §3.2 (Z-technique, 3DUI 2010;
DS3, IEEE TVCG 2012 — published prior art). ⛔ **Not queued and not planned.** It is
recorded here because rule 6 is the thing it would change, and in
[`3D1.md`](3D1.md) because that is where the evidence gets collected.

**The observation.** Rule 6 is **two DOF** — `screenTranslation` returns `rightM` and
`upM`, nothing more — and depth arrives only through 6bis, which needs a second object with
a selected face under a second finger. ⭐ Meanwhile rule 6's anchor finger carries **no
information at all**: since the device overturned the `STATIONARY` latch it is read as
PRESENCE, so it is down or it is not. DS3 says that finger's *relative* motion should carry
depth — a change to what an existing finger MEANS, not a new gesture.

⛔ **But a free orbit already solves depth** by turning it into an in-plane motion, and this
row closed on the glass with its whole feel in the overshoot. Adding a push to a finger that
currently does nothing would change a settled feel to solve a problem the camera may not
have.

⭐⭐ **So it is an `IN5`-shaped question and the answer is behavioural**: mid-assembly, does
a hand ORBIT for depth or PUSH at the glass? ⛔ Unanswerable until `3D1` exists. The watch
item, with what each observation means, is in [`3D1.md`](3D1.md) — **on the first device
pass, before the hand learns a workaround.**

---

## ⭐⭐ DEPTH: THE HAND REACHED FOR A PINCH ON THE OBJECT (2026-09-15)

The `3D1` device pass carried a watch item asking whether a hand orbits for depth or pushes
with the anchor finger. ⛔ **Neither.** The owner:

> *"Depth obtained by two fingers touchpoint on one object or two objects and pinch movement
> to zoom the one or two objects out."*

### ⛔ §3.2 DS3 is DECLINED

Not because the camera solved it — the hand did not orbit. It reached for a different
gesture entirely. ⭐ Giving rule 6's anchor finger a depth channel was a reasonable idea with
published evaluation behind it, and it is simply not what a hand wants. Marked declined in
[`../../10_INPUT_TOUCH/PROVENANCE.md`](../../10_INPUT_TOUCH/PROVENANCE.md).

### ⭐⭐ Why the instinct is a STRONG answer, not merely the owner's preference

1. ⭐⭐ **The metaphor already transfers exactly.** Pinching the camera out makes everything
   smaller; pushing an object away makes *it* smaller. The visual result is nearly the same,
   so the gesture does not have to be learned — it is the one the user already has for
   *"put this further away"*.
2. ⭐ **It needs NO new discriminator.** §4 already separates rule 4 from everything else by
   *did the touchpoints hit an object*. Pinch on nothing zooms the camera; pinch on an object
   moves the object. Same test, one more branch.
3. ⭐⭐ **THE GAIN IS COMPUTABLE, NOT GUESSABLE** — like rule 6's, and for the same reason.
   The object should stay under the two fingers, so the ratio of finger separation fixes the
   ratio of camera distance exactly. ⛔ **Compute it before writing it**, and expect **1.0 to
   be the correct value rather than a preferred one**.
4. ⭐ **The two-object half is ALREADY SPECIFIED.** One finger on each of two objects,
   pinched together, is §4 rule **6ter** — *"both selected objects translate oppositely
   towards each other on `AxisBtwFaces`"*. ⚠ The spec flagged 6ter as *"the hardest case to
   control"* and offered to drop it if it measured poorly. **A hand reached for it
   unprompted, before it was built.** That is the strongest evidence a queued rule has had.

### ⛔⛔ AND IT COLLIDES WITH `D10` — A DECISION THE OWNER TOOK, WHICH MUST BE RE-TAKEN

**Two touchpoints on the SAME object currently means: ignore the second** (`IN8`, `D10`,
2026-09-14) — and its consequence was *judged on the glass and accepted*: lift the holding
finger with a second still on the part, and the part stops responding.

⛔ The one-object half of this instinct needs that configuration to MEAN something:

* **it is a re-opening, not a new rule** — `IN8`'s dossier anticipated one, recording
  reading 2 as **deferred, not rejected**;
* ⚠ **the accepted `IN8` behaviour would change**, and the *"part stops responding"*
  behaviour goes with it;
* ⛔ **it is the owner's call**, because it reverses a decision taken after a device look.
  Open in [`../DECISIONS.md`](../DECISIONS.md).

⚠ **No collision with rule 4 or rule 6.** Rule 4 needs both touchpoints on nothing; rule 6
needs exactly one outside. Two on an object is disjoint from both.

### ⚠ Provenance — this one sits nearest the litigated ground

⛔ The catalogue's caution zone names **Apple's pinch/scroll family** specifically. A pinch
that moves an object in depth rather than scaling or zooming is not that claim, and the
nearest published relatives — Z-technique (3DUI 2010) and DS3 (TVCG 2012) — separate depth
onto a *second finger's relative motion*, not a pinch. ⭐ But it is the closest any gesture
here has come to the ground the catalogue flags, so it is tagged ⚠ **NOVEL COMPOSITE** and
marked for `SEC4` **at the moment of adoption** rather than after.

---

# ⚠ RULE 6 UNDER `A7` AND `A6` — what changed after this row closed *(2026-09-15)*

This row closed on the device, and then two amendments changed what its two numbers MEAN.
⛔ Neither reopens it; both are recorded here so the closure is not read as covering them.

**`A7` — `dy` is now the GRAVITY axis, not the screen's up.** Rule 6 translates along
`frame.right` and `frame.up`, and `frame.up` is the world vertical. ⭐ At a level camera
nothing changed; as the camera tilts, a vertical drag now raises the object rather than
sliding it along the screen. ⚠ **The stated cost**: vertical motion goes quiet looking
straight down — the same *"goes quiet"* shape as `A3`'s handover, and for the same reason.

**`A6` — the vertical is WITHHELD while the gesture is undecided.** Depth shares rule 6's
touchpoint configuration, and the two are told apart by what the fingers DO, which takes a
window to see. ⛔ Until the verdict, rule 6 applies the horizontal only:

```ts
const pending = depthAnchorFor(grip) !== null && grip.depth.verdict === "PENDING";
const t = screenTranslation(s.x - grip.prev.x, pending ? 0 : s.y - grip.prev.y, …);
```

⭐ **One line, three reports fixed**: a lurch at the START of a drag, a lurch at the END,
and a cumulative VERTICAL DRIFT over repeated back-and-forths. The old code read `PENDING`
as *"not a depth drag"* and translated vertically, so every ambiguous frame at each end of
every gesture leaked a little, and the leaks accumulated.

⭐ *Acting is irreversible; not knowing is not a reason to act.* The horizontal is
unambiguous and always applies.

⚠ **THE COST, STATED**: the first window of vertical travel is **discarded**, not released
in one step — releasing it IS the jump being complained about. A two-finger vertical
gesture starts from where it was RECOGNISED, not from where it began.

⛔ **And rule 6 has no DEADBAND either** (`A9`/`IN12`) — it integrates the same raw delta
rule 2bis does. Its follower and phantom lead mask the jitter better than the rotation does,
which is why it was reported on the rotation first.

---

# ⛔⛔⛔ THE SAME VERDICT, A SECOND TIME — 2026-09-16

This dossier already records a hand overturning a mode keyed on the anchor's `STATIONARY`
state, on 2026-09-14, first try. ⭐ **`A13` did it again**, and the device answered again:

> *"If I transition quickly there is a translation then a rotation, if I transition slowly
> there is directly a rotation."*

⭐⭐ **The timing signature is the whole diagnosis.** A finger PLACED QUICKLY skids as it
lands — the reported centroid slides while the contact area grows — so it read `MOVING` for
the length of the landing, and the mode followed it. Placed slowly it never left its band.
⛔ **Nothing about the gesture differed; only the landing did.**

⚠ **And the cell was mine.** The owner's four rules never named *both fingers moving*; I
resolved it as `TRANSLATE` on the reasoning that *the holder wins every tie*. It is now
**`ROTATE`** — presence alone decides the mode, and the motion state is used only where it
belongs, deciding what a moving second finger DRIVES (`A12`).

⛔⛔ **A13 had FLAGGED the resemblance to this dossier before shipping it**, and told the
device pass to look for mode flicker. ⭐ *Naming a risk is not the same as not taking it.*

⭐⭐ The rule now in `METHOD`: **a MODE may be keyed on PRESENCE; never on MOTION** — and if
the reasoning for a choice has to explain away a verdict a hand already gave, the verdict is
the stronger evidence.


---

## ⭐ MOVED HERE 2026-09-16 FROM `AMENDMENTS_R5.md` — A13's instrument note

⚠ The amendments file passed its 800-line cap when `A16` (fork C) landed, and this is
narrative about an INSTRUMENT rather than a decision. ⛔ Moved whole, not rewritten.

### ⭐⭐ And the instrument that should have answered this

⛔ Three device reports on this rule were diagnosed by *reasoning about code*, because the
HUD could not answer *"what does the build think is down right now?"* — and `METHOD` is
explicit that an instrument is judged against the question it exists to answer. ⭐ The depth
readout now prints the mode, the touchpoint counts, and how much grace is left:

```
  depth=1.42m [0.02–3.0]  ROTATE obj=1 out=1 2nd  ready X→roll
  depth=1.42m [0.02–3.0]  ROTATE obj=1 out=0 2nd~180ms
```


---

## ⭐ MOVED HERE 2026-09-16 FROM `AMENDMENTS_R5.md` — A13's resemblance and its correction

⚠ The amendments file passed its cap again when `A16` landed. Both blocks below are
NARRATIVE — a risk that was named before it was taken, and the device correction that
followed — and this dossier is where `IN4`'s device history lives. ⛔ Moved whole.
⭐⭐ The transferable rule they produced is in `METHOD`: *a mode may be keyed on
PRESENCE; never on MOTION* — and *naming a risk is not the same as not taking it.*

### ⚠⚠ A RESEMBLANCE THAT MUST BE WATCHED ON THE GLASS

⛔ **`IN4` records a device verdict that looks like this rule and is not.** A `STATIONARY`
latch **taken at press** was overturned by a hand, first try:

> *"Move the second finger, let it settle, and the object ROTATED as though the finger were
> not there."*

⭐ The lesson recorded then was the distinction between the signals: whether a finger is
DOWN is discrete, deliberate and visible; whether it is MOVING was *"a noisy, continuous
reading"*. ⛔ **A13 keys a mode on exactly that noisy reading** — deliberately, on the
owner's instruction, and with two things that were not true in September's build:

* it is read **live, every frame**, never latched; and
* `MOVING`/`STATIONARY` is now a **position deadband** (A11), not a speed test — the
  formulation that made `STATIONARY` unreachable is gone.

⚠ **The device pass must look for MODE FLICKER directly**: hold a part, rest a second finger,
drag — and watch whether it ever slips from rotate into translate. `restConfirmMs` (30 ms)
is the number that absorbs it, and `motionDeadbandMm` the one that sets how much wobble a
resting finger is allowed.

### ⛔⛔⛔ CORRECTION — IT READS **PRESENCE ALONE**, AND THE DEVICE SAID SO TWICE

> *"The issue is still here: if I transition quickly there is a translation then a rotation,
> if I transition slowly there is directly a rotation."*

⭐⭐ **THE TIMING SIGNATURE IS THE WHOLE DIAGNOSIS.** A finger **placed quickly skids as it
lands** — the reported centroid slides while the contact area grows — so it read `MOVING`
for as long as the landing took, and the mode followed it. Placed **slowly** it never left
its band, so the mode was right at once. ⛔ **Nothing about the gesture differed; only the
landing did**, and a mode must not depend on how briskly a finger arrives.

⛔⛔ **THE CELL WAS MINE, NOT THE OWNER'S.** The four rules do not name *both fingers
moving*; the section above resolved it as `TRANSLATE` — *the holder wins every tie* — and
that was the defect. It is now **`ROTATE`**: a second touchpoint being **DOWN** is the whole
input, whatever it is doing.

⛔⛔⛔ **AND `IN4` RECORDED THIS VERDICT ALREADY, ON 2026-09-14**, when a mode keyed on the
anchor's `STATIONARY` state was overturned by a hand, first try. The lesson written then is
the one that applies now:

> *`MOVING`/`STATIONARY` is a NOISY, CONTINUOUS reading … whether a finger is DOWN is
> neither: it is discrete and deliberate, it changes only when a person decides it does, and
> it is the one thing they can see.*

⚠ **The section above FLAGGED this resemblance as the thing to watch** — *"the device pass
must look for mode flicker directly"* — and then shipped the version that had it. ⭐ Naming
a risk is not the same as not taking it.



---

## ⭐ MOVED HERE 2026-09-16 FROM `AMENDMENTS_R5.md` — A14's diagnosis

⚠ The amendments file passed its cap as fork C grew. A14 is CLOSED and device-confirmed,
and this is its narrative — the three cases, the timing signature, and why the rule was
right while the gesture model was wrong. ⛔ Moved whole, not rewritten; the amendment keeps
the decision, the owner's quote and the stated cost.

### ⭐⭐ THE DIAGNOSIS: THE MODE LOGIC WAS NEVER WRONG

Between the lift and the press there is genuinely **one touchpoint down**, and `A13` says one
touchpoint TRANSLATES. ⛔ So the object translates for exactly as long as the swap takes —
and a lift and a replace is **150–300 ms of hand**, which is very visible.

| case | during the swap | what is seen |
|---|---|---|
| **1** — no lift at all | no interval exists | correct |
| **2** — the holder WAITS | interval exists, holder still | nothing to see |
| **3** — the holder KEEPS MOVING | interval exists, holder moving | ⛔ **it translates** |

⭐⭐ Cases 2 and 3 differ **only** by whether the holder happens to be moving during that
interval — which is precisely the owner's *"cases 2 and 3 differ by timing of the input"*,
and it is the observation that located the defect.

### ⭐⭐⭐ So the RULE was right and the GESTURE MODEL was wrong

**A lift-and-replace is ONE intention.** Dropping to one-touchpoint behaviour in the middle
of it is the artefact. ⛔ A second touchpoint therefore stays **HELD** for
`secondTouchGraceMs` after it lifts, and a replacement inside that window is continuous.

⭐ **The grace is keyed on a LIFT** — discrete, deliberate and visible — and never on a
motion state. ⚠ That is the rule the previous round of this defect cost us
(*a MODE may be keyed on PRESENCE; never on MOTION*), and it is honoured here rather than
quietly re-broken.

⚠ **It counts a lift of ANY other touchpoint**, whatever role it held: outside every object,
on the same object, or **on a different object** — which is the owner's case 3, where the
second finger was holding a second part.



---

## ⭐ CARRIED FROM THE QUEUE ROW, 2026-09-16 — verbatim

⚠ `QUEUE.md` is a front door and this cell had grown to an essay inside a table. ⛔ Distilled there to state + one lesson + this pointer; the full text is below, unrewritten, per `README.md` rule 2.

> ✅✅ **RULE 6 CLOSED 2026-09-15** — 8 vectors, and confirmed by finger in ORDINARY PLAY, not only in a tuning session (`src/input/translate.ts`). ⭐⭐ **The gain was COMPUTED before it was written**: the honest value spans **20x across the zoom clamp** and another 1.6x across screen sizes, so it is a MULTIPLIER on a computed tracking factor and **1.0 means the object sits exactly under the finger** — the first gain on this project with a correct value rather than a preferred one. ⚠ It **supersedes §1.2's `referenceCameraDistance` ratio** for this rule, and §1.2's stated rationale is backwards (scaling by distance holds the SCREEN displacement constant, not the world one). ⛔⛔ **THE `STATIONARY` LATCH I BUILT WAS WRONG AND THE DEVICE OVERTURNED IT, FIRST TRY**: rule 6 now reads **PRESENCE**, every frame — a second finger outside any object means translate, whatever it has done since it went down. ⭐ The lesson is the distinction between the signals: `MOVING`/`STATIONARY` is noisy and continuous, so §4 latches roles keyed to it; whether a finger is DOWN is discrete, deliberate and VISIBLE, and latching that hides state instead of protecting it. **Do not generalise "latch at press" to every input.** ⭐ Rule 6 also has **INERTIA** now (`src/input/follow.ts`, critically damped, exact analytic step so it is frame-rate independent and cannot diverge on a dropped frame) — `translateInertiaMs`, ⚠ the owner set it to 10 ms because at critical damping every millisecond reads as LAG. ⭐⭐ **So the model now carries a DAMPING RATIO** — Unity's `linearDamping`, dimensionless: below 1 the object **accelerates through the gap** instead of keeping a permanent distance, which is what "catch-up" means. ✅ PhysX (Unity's physics) is **BSD-3 since 4.0**, so `N13` is clear — but only its MODEL is reused, not its arithmetic: PhysX damps by `(1−c·dt)`, which is timestep-DEPENDENT and survivable only behind Unity's fixed 0.02 s step. A vector measures ours against PhysX's at that step and shows the gap is PhysX's discretisation error. ⭐ **TUNED BY FINGER OVER FIVE PASSES AND SETTLED**: gain **1.17**, τ **7.6 ms**, ζ **0.2**, phantom lead **0.2 ms** — ⚠ quote these from `gestureConfig.ts`, which is the one copy; this row carried a stale set (1.15 / 8 ms / 0.5 ms) until 2026-09-15. The object now deviates &lt;0.45 mm from the finger at 300 mm/s — under the measured pointer noise — so the entire feel lives in the **overshoot** (0.3–1.8 mm of follow-through), not in any gap. ⭐⭐ The owner also added a **PHANTOM TARGET** (`src/input/lead.ts`): the object chases a point projected ahead of the finger along the finger's own SMOOTHED velocity — feed-forward, not more feedback, and a vector fails if it is derived from the gap instead (that is just a stiffer spring). ⛔⛔ **Its computed landmark marked the WRONG END of the range**: `lead = 2·ζ·τ` (3.2 ms) makes a steady drag leave no gap at all, and the hand **shipped 0.2 ms — a FIFTEENTH of it** — after narrowing the slider twice to reach the bottom (0.5 ms was an intermediate pass, and the dossier records it as such). **A landmark tells you where a range's zero is; it does not tell you where to stand** → [`./IN4.md`](./IN4.md). Rule 4 ✅ via `IN9`. 6bis onward wait on `3D1`. ⭐⭐ **THE `3D1` DEPENDENCY IS NOT UNIFORM — rule 6 did NOT need it**, which is why it shipped first: rule 6 reads *the selected object* and a screen frame, while 6bis/6ter/6quater are defined on `AxisBtwFaces`, the axis between two selected FACE centres — exactly what `3D1` owns. ✅ The composition was computed BEFORE the gain, as this row demanded.

---

## ⛔⛔ DISTILLED OUT OF `QUEUE.md` ON 2026-09-18 — the build ORDER, now spent

⭐ It explained why `3D1` was sequenced after rule 6, and the reasoning was right and is now
**executed**: `3D1` closed 2026-09-15 and rule 6 closed the same day. ⚠ A front door carries
STATE, and a sequencing argument whose sequence has happened is narrative.
⛔ Moved rather than deleted, unrewritten, because its second half is a live warning about
rule 6 being a COMPOSITION — and `D49` has just added a third factor to that composition, so
it is about to matter again.

### ⭐⭐ THE ORDER, and why `3D1` is not next after all

**`IN2` → rule 6 translate → `3D1` → 6bis onward.**

⭐ **`IN4`'s dependency on `3D1` IS NOT UNIFORM, and that is what reorders the queue.**
Rule 6 (screen-plane translate) is defined on *the selected object* plus a screen
frame — no faces, no connectors, no assembly tree. Rules **6bis / 6ter / 6quater** are
defined on `AxisBtwFaces`, *the axis between the centres of the two selected FACES*,
and a face centre is exactly what `3D1` owns. ⭐ Same reason `IN9` shipped ahead of
`3D1`: ask what a rule actually reads, not which phase it is filed under.
⛔ So translation goes as far as rule 6 **and must stop there**.

⛔⛔ **AND RULE 6 IS A COMPOSITION — mistake shape 4's exact territory.** §1.2 scales
translation gains by `cameraDistance / referenceCameraDistance`, so rule 6 is
`translate × zoom × orbit`: one millimetre of finger means a different world
displacement at every camera distance, and the orbit surface now makes that distance
**asymmetric** (1.14 m at the top ring against 0.71 m at the bottom).
⭐ **Compute what ONE MILLIMETRE of finger does at both zoom extremes BEFORE writing
the gain.** Not after a device session is spent disliking it — and not as a check
bolted on afterwards, which is how the orbit surface got three segments from three
rings.

⚠ `3D1` remains the last thing between here and actual assembly, and it is where
mistake shape 4 is most likely to recur: an assembly tree composes transforms through
parent-child chains, which is what cost the predecessor a week. ⭐ Write the composite
check BEFORE the code, not after.

---

## 2026-09-22 — ⭐⭐⭐ THE OBJECT AXES (`D74`) AND THE CHANNEL REMAP (`D75`)

⚠⚠ **THIS REOPENS A ROW THAT WAS CLOSED BY A DEVICE LOOK.** Rule 6 was closed 2026-09-15 —
*"confirmed by finger in ordinary play"* — and its screen-plane form is now off the call path. ⛔ The
row's status says so in both directions, because a closed row that quietly changed is the worst kind
of stale: the next reader would trust a verdict that was given about different code.

### What the owner asked for, in three parts

**A — a flag.** `WorldAxisB` (default **1**): the world x / gravity / depth axes are built **at scene
boot from the boot camera and fixed forever for this scene**. At `0` they follow the camera, which is
the build up to today. ⭐ At boot, every body's axes are the boot camera's either way.

**B — the channels move onto those axes.** The holder's `dx` drives the body's **x**, its `dy` drives
the body's **depth**, and the SECOND touchpoint's `dy` drives its **gravity** — each input projected
onto its axis, *"same as what Blender does"*. ⛔ So one finger slides a body about its own horizontal
plane and a second finger lifts it: `dy` and the second finger swapped jobs. ⭐ While a body is
moving, a ray from its centre along the direction it is **actually going** names the **LeadingFace**,
which carries a 3-axis gizmo.

**C — the capture zone overrides the basis.** Inside the offset radius the axes are the LeadingFace
normal, gravity, and their orthogonal — *"therefore the translation direction differs when the object
is inside the offset radius zone"*.

### The three questions the dictation did not settle, and the owner's answers

| question | answer, 2026-09-22 | why it mattered |
|---|---|---|
| the in-zone triple is not orthogonal on a sloped face | **orthogonalise** — gravity exact, the normal flattened | `A7`'s argument again: *there is no gain that fixes a basis that is not a basis*, and depth/gravity would otherwise overlap by `cos(slope)` |
| which direction does the LeadingFace ray follow | **where the body actually goes**, after projection | the finger's own direction names a face the body never advances on the moment the axes stop matching the screen — which is what this whole change does |
| Blender divides by the axis's screen foreshortening | **do not divide** | dividing tracks the finger exactly and goes to infinity as an axis turns to face the camera, so it needs a cutoff — *a guessed number has been wrong every single time here*. Not dividing makes a foreshortened axis go QUIET |

### ⭐⭐ What came out of it that was not asked for

⛔⛔ **THE DEPTH SIGN STOPPED BEING A RULE AND BECAME ARITHMETIC.** `depthTranslate` needs
`awaySign = sign(towardGravity)` because *fingers-up means away* is true looking down on the scene and
**backwards from the bottom ring** — a defect found by finger (*"the depth translation is chaotic"*).
⭐ In the projection that sign is `dot(depthAxis, cameraUp)`: positive looking down, negative looking
up, **zero at a level camera**. The same three answers, none of them asserted. ⚠ One fewer quantity
that can be wrong, and the degenerate case is the quiet one rather than the reversed one.

### ⚠ What it costs, stated rather than discovered

* **The holder's `dy` is dead at a level camera.** A depth change produces no screen motion there, so
  there is nothing for the finger to follow — the **sixth** appearance of *goes quiet before it
  fails* on this project. ⛔ Inherent to the mapping, not tunable, and on the HUD.
* **A closed rule's feel is unjudged.** `gainTranslateScreen` = 1.17 was tuned for a screen-plane
  drag; nothing says it is right for two horizontal channels.
* **`screenTranslation` and `depthTranslate` are unwired**, declared in `tests/unwired_debt.test.ts`
  rather than deleted — six models and five device passes are behind the second one, and rule 5 has
  not judged what replaced it.
* **`cameraOffsetZoneEnterSetupB` gates a method that does not exist.** It ships at `0`, the hook is
  named and empty, and the HUD says `(no-op)` when it is on.

### The build

⭐ Engine-free: `core/leading_face.ts` (the exit face of a convex body, from the LOGICAL faces — no
triangles, no picking), `input/object_axes.ts` (the basis rule and the zone edge), `input/axis_translate.ts`
(the projection, the composition and `A5`'s depth clamp, carried over with the channel).
⛔ `scene.ts` holds **state and calls only** — the 2026-09-19 lesson, seven surviving mutants deep.
✅ **32 vectors**, and three deliberate mutants — a dropped negation on the depth channel, a flipped
in-zone handedness, the FARTHEST exit instead of the nearest — each caught by the vector written for it.
⚠⚠ **MISTAKE SHAPE 5 AGAIN, INSIDE THE HOUR**: the first fixture built the camera's `up` as
`right × view` instead of `view × right`, which inverted two channels and read exactly like a sign
defect in the product. ⭐ The fixture was wrong and the code was right, which is the fifth shape's
whole signature.

⛔⛔ **A DEVICE LOOK IS OWED ON ALL OF IT**, and there is no way around it: nothing here can be judged
headlessly, the default is the NEW rule (the owner's choice), and the one thing a suite cannot answer
is whether a body that moves in its own horizontal plane feels like a body you are pushing.


---

## 2026-09-23 — ⭐⭐⭐ THE FIRST DEVICE LOOK AT THE OBJECT AXES: THREE REPORTS, ONE CAUSE (`D76`)

> 1. *"the dx continues to move on the x world axis and dy on the world depth axis, which feels
>    strange for the user as the input axis and movements axis seem inverted. Is it the way Blender
>    translation is behaving in the same configuration?"*
> 2. *"the gain drops for dx and dy due to projection of input on world axis and as a consequence
>    the input seems very weak and not the same as the gravity axis input which is right."*
> 3. *"The holder's dy is dead at a level camera. … I would expect the object to continue
>    translating with dy input."*

⭐⭐ **THE OWNER NAMED THE COST I HAD WRITTEN DOWN AS ACCEPTABLE, AND HE WAS RIGHT.** All three are
the same arithmetic seen from three sides: the mapping multiplied each input **by** the axis's
screen foreshortening. ⛔ At 45° that is 71% of the finger; at a level camera the depth axis's
shadow is 0 and the channel is dead; and the direction the body takes is the axis's screen line,
which in a skew camera pose is nowhere near the finger's. ⚠ I had chosen that form deliberately
(2026-09-22) as *the stable option*, offered it against Blender's division, and the owner picked
it — **on my description of the alternative as needing a guessed cutoff.** ⭐ `METHOD`: *a
simulation narrows the range; it does not pick the number* — and a description of an alternative
is not the alternative.

### ⭐⭐⭐ WHAT BLENDER ACTUALLY DOES — the question, answered

| | Blender | us, before | us, now |
|---|---|---|---|
| free move (`G`) | follows the mouse **in the view plane**, exactly | — | — |
| axis move (`G X`) | the **whole** mouse delta is mapped onto the chosen axis by intersecting the mouse ray with the axis line — **it tracks the mouse**, no cosine loss | each input **scaled by** its axis's cosine | divided by it |
| who picks the axis | **the user**, by pressing X/Y/Z | a fixed `dx`→x / `dy`→depth pairing | the solve makes the question moot |
| axis pointing at the camera | inside a **5° cone** it abandons the exact mapping for a plain projection, so the object nearly **stops** | dead at exactly 0 | falls back to `depthTranslate`'s **judged** fixed rate |

⛔⛔ **SO THE PAIRING IN REPORT 1 IS OURS, NOT BLENDER'S.** Blender never binds screen-x to a world
axis; the closest thing to what this product needs is its FREE move, with the view plane replaced
by the body's own horizontal plane.

### What is built

⭐ **`PLANE` (`translatePairing=1`, the default)** — the holder's 2D delta is **decomposed onto the
two horizontal axes' screen shadows**, a 2×2 solve, so the body's image follows the finger exactly.
⛔ Solving, not projecting onto each axis in turn: the two shadows are not perpendicular on screen,
and independent projections would double-count the overlap and outrun the finger on a diagonal.
⭐ **`CHANNELS` (`=0`)** — the dictated pairing, each axis now tracking exactly: Blender's `G X`,
twice. ⚠ Kept so a hand can judge report 1 rather than take my word for the fix.
⭐ **Gravity** is unchanged in kind and now tracks exactly too, so all three channels have the
**same** gain — which is report 2's actual complaint, stated as an equality and vectored as one.
⭐ **The cone** (`axisTrackingConeDeg`, **5°, Blender's own number**) bounds the runaway that
exact tracking buys, and inside it the fixed-rate push takes over — ⛔ *not* Blender's near-stop,
because report 3 rejects exactly that. ⚠ Its sign still comes from `towardGravity`, so the
bottom-ring defect cannot come back through the new branch.

### ⛔⛔⛔ THE FINDING NOBODY ASKED FOR, AND IT IS AN OWNER DECISION

**Under `PLANE`, `D74`'s in-zone basis changes NOTHING.** The in-zone axes are *LeadingFace normal,
gravity, orthogonal* — **orthogonalised on the owner's own instruction**, which flattens the normal
onto the ground. ⚠ So both horizontal axes are horizontal, the holder's plane is the same
horizontal plane as outside, and rotating a basis *within* a plane cannot change a rule that reads
only the plane. ⛔ The dictation's *"therefore the translation direction differs when the object is
inside the offset radius zone"* is **inert**, and a vector says so out loud.

⭐⭐ **The two choices interact, and neither of us saw it when they were taken an hour apart.** The
orthogonalisation was chosen because *independent channels* would otherwise overlap — and under
`PLANE` there are no independent channels, so the premise is gone. ⚠ Three ways out were offered:
keep `PLANE` and accept that the zone changes nothing; go back to `CHANNELS`, where the zone basis
bites; or let the in-zone plane **tilt with the face**.

✅✅ **ANSWERED 2026-09-23, AND WITH A FOURTH: DELETE THE RULE** (`D82`). The owner: *"eliminate
this rule: Inside the offset radius the axes are the LeadingFace normal, gravity, and their
orthogonal. Inside shall be the same as outside. I think this is polluting the approach movement."*
⛔ So `axesFromLeadingFace` is gone, `updatedObjectAxes` has no zone input at all, and the per-body
basis map in `scene.ts` went with it — nothing wrote it once the zone stopped.
⭐⭐ **The argument, in one line**: every defect the switch produced was about the MOMENT it took
effect — the zone edge is where the translation directions changed under a moving finger — and *a
rule whose every defect is about the moment it takes effect is a rule about the wrong thing.*
⚠ `leadingFace` and its gizmo survive: the owner asked for the marker in the same dictation and
has not asked for it to go, and the zone edge still names the pair and fires the hook.

⚠ **Still unjudged**: everything above, plus `gainTranslateScreen` = 1.17, which was tuned for a
screen-plane drag and now multiplies an exact-tracking mapping.

⭐ **2026-09-23, same loop**: *"don't show the gizmo for the frozen objects."* ⛔ Refused in
`core/leading_face.ts` by the definition — *the face a body is **advancing on***, and a frozen body
never advances — rather than by a guard in the renderer, which the next reader of that function would
have had to repeat. ⚠ It also removes the in-zone basis for a frozen body, which is right for the same
reason: `object_model.ts` will not move it.

⛔⛔ **2026-09-23 — THE GIZMO WAS INVISIBLE ON EXACTLY THE FACE THAT MATTERS.** *"When the follower
is translating and followerface is the leadingface, the gizmo does not show."* ⭐ Two things drawn on
the SAME face: the marker floats `MARKER_LIFT_M` (1.5 mm) **above** the surface and the gizmo starts
**on** it, both in rendering group 0 — and the axis lengths are `1.5 ×` the body's own reach to that
face, so a gizmo sitting inside a large face was hidden **entirely**, not partly. ⚠ The x-ray twin
(group 1) then made it certain rather than likely. ✅ The gizmo is drawn in **group 2**, above both:
*an instrument that says which way a push will go must not be occludable by the thing it describes.*
⚠ Not counted as a defect: it is the cost of a decoration I added the same day, found within the hour
by the hand it was built for.

⭐ And `followerFaceXrayAlpha` is **0.05** — the owner's number, a tenth of my guess.


---

## ⛔⛔⛔ THE `dy` SWAP — BUILT ON A BRANCH, **MEASURED**, AND REJECTED (2026-09-23)

> *"dx and dy from touch on the object control the translation on object x axis and object gravity
> axis, and dy from second touch control the translation on object depth axis."* — the owner,
> asking for the swap
>
> *"I will discard it. I will stick with 1.0.22- input configuration from now onwards."* — the
> owner, after the comparison below

⚠ Built as `D83` on **`1.0.24-Swapped-inputs-Discarded`**, with vectors and mutants. ⛔ Nothing of
it is in the keeper branch, and the branch is kept so the measurement can be re-run rather than
re-argued.

### The two configurations

| | holder `dx` | holder `dy` | second touch `dy` |
|---|---|---|---|
| **kept** (`D75`) | `x` | `depth` | `gravity` |
| swapped (`D83`) | `x` | `gravity` | `depth` |

### ⭐⭐⭐ THE MEASUREMENT — what 50 px of finger actually MOVES on the glass

⚠ Both rules run from the same fixture: axes frozen at boot (`worldAxisB`, boot camera azimuth 0,
elevation 30°), camera at 1.5 m, `PLANE` pairing, the shipped 5° cone. ⛔ The number is the body's
**screen** travel in pixels — what a hand sees, and what the approach swing reads.

```
az  el │ KEPT   dx→x  dy→depth  2nd→gravity │ SWAPPED  dx→x  dy→gravity  2nd→depth
  0  0 │  50.0     0.0     50.0             │  50.0     50.0      0.0
 45  0 │  50.0    35.4     50.0             │  50.0     50.0     35.4
 90  0 │   0.0    50.0     50.0             │   0.0     50.0     50.0
  0 12 │  50.0    50.0     50.0             │  50.0     50.0     50.0
 45 12 │  50.0    50.0     50.0             │  50.0     50.0     10.2   ←
 90 12 │  50.0    50.0     50.0             │  10.4     50.0     50.0   ←
 45 40 │  50.0    50.0     50.0             │  50.0     50.0     27.0
 90 40 │  50.0    50.0     50.0             │  32.1     50.0     50.0
 45 70 │  50.0    50.0     50.0             │  50.0     50.0     34.2
 90 70 │  50.0    50.0     50.0             │  47.0     50.0     50.0
```

⭐⭐ **The kept configuration is EXACT at every pose except an exactly level camera. The swapped one
degrades across a broad band of ordinary poses** — down to a fifth of the finger at `az 45–135,
el 12`, which is an ordinary place to stand.

### ⭐⭐⭐ WHY — and it is one sentence about pairs

**A PAIR of axes can cover for one of its members; a SINGLE axis cannot.**

* The kept holder owns `x` **and** `depth` — the two horizontal directions, which together span the
  whole ground plane. Whichever way the finger drags, some combination produces exactly that screen
  motion: when `x` turns to face the camera, `depth` takes up the slack. ⛔ They fail only together,
  at an exactly level camera, where the ground plane collapses to the horizon line.
* The swapped holder owns `x` **and** `gravity` — one horizontal, one vertical: a thin vertical
  slice, not a plane. When `x` faces the camera **nothing can cover for it**, because gravity only
  ever moves a body up and down the glass. ⚠ And `worldAxisB` freezes `x` at boot, so a quarter
  turn of orbit reaches that pose deliberately.
* The kept second touch owns **gravity**, which draws a VERTICAL line on the glass at every camera
  angle — perfectly matched to a vertical finger, so it gives its full rate everywhere.
* The swapped second touch owns **depth**, which draws a SLANTED line that turns with the camera. A
  vertical finger only contributes the part of itself lying along that line. ⛔ No partner, no
  compensation, and the response depends on where the camera happens to be.

⚠⚠ **AND THAT WEAKNESS IS A COMPLAINT THE OWNER HAS ALREADY MADE ONCE**: *"the input seems very
weak and not the same as the gravity axis input which is right"* (2026-09-23, `D76`). ⭐ Gravity
felt right **because it is always vertical on the glass** — the swap would have moved that property
off the finger that had it.

### ⚠ The one thing the swap FIXED, and it is real

At an exactly level camera the kept `dy`→`depth` is **dead** (`0.0` in the table) — the cost this
dossier already records as *"the holder's dy is dead at a level camera"*. ⭐ The swapped `dy`→
`gravity` works at every elevation. ⛔ One pose against a band of poses: the trade was refused.

### ⛔⛔ AND A SECOND CONSEQUENCE NOBODY WOULD HAVE PREDICTED FROM THE DICTATION

**The approach swing goes blind.** It decides which way to lean from the body's travel projected
onto the camera's `right` and `up` — the two directions that span the SCREEN. ⭐ `depth` is by
definition the direction that produces the least screen motion, so a body pushed straight away from
the camera fed the swing **exactly zero on both**, every frame, and it never found a direction.
⚠ In the kept configuration that finger drives `gravity`, whose travel is vertical on the glass, so
the case is unreachable. ⛔ `D83` had to add a third travel component to pay for it — visible in
the branch as `swingSignFor`'s third argument.

### ⭐ What a future session should take from this

⛔ **Do not re-derive this by argument.** The comparison took one probe that ran both rules over a
sweep of camera poses and printed what a hand would see; both of my own explanations before that
probe were incomplete, and the second one was wrong about WHERE the degeneracy lies.
⚠ The branch still exists: check it out, copy the old rule beside the new one, and print the table.

---

## ⭐⭐⭐ `D84` — **THE ROTATION BASIS FOLLOWS `worldAxisB` TOO** (2026-09-23)

> *"remind me why for an unaligned object when world axis is toggled on, the translation is done
> along world axis but the rotation is done along screen axis? is it on purpose or was it a miss
> when we built world axis?"* … *"do the change."* — the owner

### ⛔⛔⛔ The answer was NEITHER, and that is the entry worth keeping

`D74`/`D75` dictated three TRANSLATION channels — *x is the holder's `dx`, depth its `dy`, gravity
the second finger's `dy`* — and **nothing in the dictation, and nothing in this dossier, ever reached
the rotation.** ⭐ So rotation went on standing on `A7`'s LIVE gravity frame: not a decision to leave
it there, and not an oversight in implementing what was asked. It was never in scope.

⭐⭐ `METHOD`: *a scope that was never stated is not a scope that was chosen, and the difference is
invisible in the code that results.* ⚠ Both produce the same source. The only way to tell them apart
is to go back to the human sentences and find that none of them mentions the case — which is the
same test `D71` used for the boot mode (*the tell is not the VALUE but whether any human sentence
still asks for the other*).

### ⭐⭐ What actually changes — measured, not assumed

⛔ A `GravityFrame`'s `up` is the **world vertical by definition**, at every camera elevation. So:

| channel | axis | does `worldAxisB` move it? |
|---|---|---|
| yaw | `up` | **no** — it was already world-fixed |
| pitch | `right` (camera's, always horizontal) | **yes** |
| roll | `depth` (view direction flattened) | **yes** |

⚠ The first vector asserts this rather than the prose claiming it: two frames a quarter turn apart
share `up` EXACTLY and are orthogonal in the other two. ⭐ Without that fixture the remaining vectors
would pass against a rule that did nothing.

### ⚠⚠ The cost, stated before a hand meets it

⛔ Frozen, the pitch axis points at the camera after a quarter orbit — a vertical finger sweep there
reads as a **roll** rather than a tip. ⭐ That is precisely the property the owner ASKED FOR on the
translation side (*a push that went "right" before an orbit still goes the same way in the world
afterwards*), carried across to the turn. ⚠ It is the thing to judge by finger, and
`?worldAxisB=0` restores the live frame for **both** at once.

⛔ A **TWIST on an aligned body is untouched**: it turns about the constraint's own axis and never
consulted a camera frame. The owner's question was about the UNALIGNED case, and the change is
scoped to it.

### ⭐ Where it lives

`rotationFrame` in `input/object_axes.ts` — engine-free, beside `updatedObjectAxes` so the two
readings of one flag sit together. ⛔ `scene.ts` supplies the two candidates and nothing else; the
three free-rotation call sites (roll, yaw, pitch) each take the frame **once** and hand it to all
their readers, because the grey gizmo line, the turn itself and the increment tally restate each
other's axes and signs — two lookups could disagree on the frame the flag is toggled.
✅ 5 vectors; the old behaviour (always the live frame) run as a mutant reddens 2 of them.

---

## ⭐ STATUS TEXT MOVED DOWN FROM `QUEUE.md`, 2026-09-25

⛔ The row stays in the queue; only its essay came here.

✅✅ **RULE 6 CLOSED 2026-09-15** — by finger, its gain **computed**. ⛔⛔ **ITS SCREEN-PLANE FORM IS SUPERSEDED** (`D75`/`D76`): a body translates along **its own axes**, the finger's delta **solved onto both horizontal ones** so it tracks exactly, with Blender's 5° cone at the edge-on case. ⚠ One device look, three reports, three fixes — **unjudged again**, and `screenTranslation`/`depthTranslate` stay as declared debt. ⛔ 6bis/6ter/6quater still wait on face centres → [`queue_notes/IN4.md`(this file)
