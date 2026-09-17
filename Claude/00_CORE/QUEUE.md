# THE BUILD QUEUE — one list, every subsystem

> **STATUS** · live · **OWNS** · what gets built next, for the whole project
> **READ IF** · you are starting any build, or wondering where an item stands
> **LAST VERIFIED** · 2026-09-16

⛔ **THIS IS THE ONLY QUEUE.** Do not start a second list, in a subsystem folder or
anywhere else. Do not reorder it to be helpful.

⭐ Each row's full history goes in `queue_notes/<ID>.md`. The `Notes` column is a
pointer, not the record. **A status changes in BOTH places or neither.**

`Sub`: `IN` = 10_INPUT_TOUCH · `GAME` = 20_GAME_RULES · `3D` = 30_OBJECTS_3D ·
`RND` = 40_RENDER_SCENE · `DEP` = 50_BUILD_DEPLOY · `SEC` = 60_SECURITY_COMPLIANCE ·
`CORE` = cross-cutting.

---

## ⭐⭐⭐ YOU ARE HERE (2026-09-16) — the input layer is done bar `IN3`

✅ TypeScript + Babylon + Vite; `npm run verify` = typecheck + **572 golden vectors,
all passing** (37 → 632 → **574** — ⭐ 58 DELETED with the roll channel — → 619 → **568** — ⭐ the drop being forks A and B deleted — → 575 → 567 → 572, ⭐ the drop being `A10`'s gate suite, deleted with the gate). ✅ The engine boundary is enforced by a test.
✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/ (`DEP1d`), gated on
`npm run verify`.

### ⭐⭐⭐ WHAT IS OWED NEXT, IN ORDER (2026-09-17)

1. ⛔⛔ **A DEVICE LOOK ON THE ALIGNMENT MODEL** — it is now the ONLY model (`D40`) and **no
   hand has judged any of it**. The ordered list, with what would falsify each item, is §10 of
   [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md).
   ⭐ Two questions in it are the owner's to answer by hand and cannot be answered here:
   **is *parallel* the sense a hand expects**, and **can an ordinary reposition shake an
   alignment away by accident**.
2. ⭐ **The verdict between the two undos** — the shake and `D39`'s re-tap do the same thing,
   and the owner expects to drop one: *"this is a complicated movement to execute by the
   user."*
3. ⛔⛔ **STAGE 2 IS THE WHOLE SECOND HALF OF THE OWNER'S RULES** — `TargetPosition`, its
   cross-quad gizmo, the orbit about it and the two-object approach (`§2`). **Four owner
   decisions gate it** (`§7`), and one is a real design problem rather than a preference: the
   approach mapping has **no direction** when the centre→target line faces the camera and
   **shrinks to noise at contact**, with roll and depth displaced in that state so nothing can
   take over. ⭐ Nothing else in `IN3` is unbuilt.
4. ⚠ **THE MATE IS STILL UNREACHABLE.** The alignment is **parallel** (`D37`) — an orienting
   rule, not a joining one — and §4's `6quater`, the only rule that pushes a `MATE`, is
   flick-based, which this model does not have. ⛔ So the game can orient parts and bring them
   close, and **cannot assemble them**. That is the gap between here and `3D2`.

### What works, by finger, on a real device

✅ **`IN1` CLOSED** — the recognizer: commit point, provisional motion with rollback,
tap / double-tap / hold, the release-time priority ladder, and screen-plane yaw/pitch.
⛔ Its **provisional-motion ROLLBACK is retired** (`D36`): a flick now keeps the rotation the hand made with it.
⛔ Its **one-touchpoint roll is deleted** (2026-09-16) — `A12` had moved roll to the second
touchpoint's x and the detector was left running, *"unused"*, where it vetoed `IN3`'s flick
(defect 40). ✅✅ **`IN9` CLOSED** — both camera rules, pinch zoom and orbit, working by
finger. ✅✅ **`IN2` CLOSED** — the three latched roles.

✅✅ **AND THE WHOLE TWO-TOUCHPOINT SET IS CLOSED BY A DEVICE LOOK (2026-09-16)** —
*"everything is working"*: **`A10`** depth (⚠ its still-holder GATE is deleted, `D43`), **`A11`** §1.1 as
a per-axis position deadband, **`A12`** roll on the second touchpoint's x, **`A13`** one
touchpoint translates and a second held still rotates, **`A14`** a lift-and-replace is one
gesture. ⭐ That is what `1.0.4` is: **translation with one finger.**

✅✅ **`A15` CLOSED BY THE SAME LOOK** — a holder no longer *under* its object gives the
selection up (a raycast at the second touchpoint's lift; the unselect deferred to the next
input event). ⚠ **The close is only as strong as the phrase that gave it**: *"everything is
working ok"* was general, and the three cases this row listed were not reported on
individually → [`queue_notes/IN8.md`](queue_notes/IN8.md).

### ⭐⭐⭐ THE INPUT MODEL, AND IT IS NOW SINGULAR (`D28`, 2026-09-16)

✅✅ **`IN13` IS ANSWERED AND CLOSED.** One build carried **three** readings of §2/§4 from
`1.0.5` to `1.0.7` — fork A (one touchpoint translates), fork B (the spec's inversion) and
the tap toggle — so a hand could compare them in the same minute on the same scene. ⭐ The
owner drove all three and chose the toggle: *"remove the forks A and B. I am satisfied with
fork C."*

| what a finger does | what happens |
|---|---|
| one touchpoint drags an object | **translates** it, or **rotates** it — whichever the mode says |
| **any single tap, anywhere** | flips the mode, immediately. ⚠ A double tap flips twice **and** flies the camera home |
| a second touchpoint **pressed** | **roll** by its x *or* **depth** by its y — the mode picks one, never both. ✅ **SIMULTANEOUS with the holder's own drag** since `D43`: each finger owns a channel and they sum |
| a second touchpoint released, holder off its object | the selection drops at the next input event (`A15`) |

⛔⛔ **DELETED, NOT DISABLED**: `holderDrive`, the flag, its latch, the menu slider,
`assignment.ts` (→ `mode_toggle.ts`) and **44 vectors**. ⭐ A dormant fork is a trap, and a
tunable nothing reads is what `config_debt.test.ts` refuses.
⛔⛔ **AND IT RETIRED `A14` AND `A12` BY CONSTRUCTION** — the grace existed only because the
mode read second-touchpoint presence, and two-axes-at-once is unreachable once the mode picks
one axis. ⚠ Both texts stand as the record of defects that can no longer occur.
⭐ The whole comparison, and the three formulations the toggle went through, are in
[`queue_notes/IN13.md`](queue_notes/IN13.md).


### ⛔⛔ THE FIVE MISTAKES THIS PROJECT KEEPS MAKING — they bind `IN3`/`IN4`

Forty-seven defects have been found **by finger** (forty-six of them; one by composing a measurement with a threshold), and **not one was visible to a green
suite**. They are **five** shapes, not forty-seven problems — the fifth is below, and it is
the one that costs a correct implementation rather than a broken one:

⭐⭐ **THE LEDGER, so the number stops drifting.** It is one count, kept HERE, and it is
the sum of the rows' dossiers — not a figure anyone restates from memory:

| row | defects BY FINGER |
|---|---|
| `IN1` — the recognizer | **14** |
| `IN9` — rule 1, orbit | **3** |
| `IN9` — rule 4, pinch zoom | **0** |
| `IN2` — pointer plumbing | **0** |
| `IN4` — rule 6, translate | **1** |
| the sympathetic sway | **1** |
| `3D1` — the model wiring | **1** |
| **A8** — the roll's start | **1** |
| **A8** — the roll's commit | **1** |
| **A6** — depth, from below | **1** |
| **A6** — the gate | **3** |
| **A9** — the rotation jitters | **1** |
| **A10/A11** — §1.1, four times | **5** |
| **A13** — a tracker outlived its finger | **1** |
| **A13** — a mode keyed on MOTION | **1** |
| **A14** — the gap inside a lift-and-replace | **1** |
| **A16** — fork C's three formulations | **3** |
| **`IN3`** — the face marker's roll | **1** |
| **`IN3`** — a RETIRED gesture still owning a verdict | **1** |
| **`IN3`** — a mode with no way out | **1** |
| **`IN3`** — 2sexte had no driver | **1** |
| **`IN3`** — the flick's BASELINE | **1** |
| **fork C** — the highlight, wiped one event later | **1** |
| **fork C** — the shake's stale axis | **1** |
| the face markers lagged a frame | **1** |
| an aligned object's turn lost the sway | **1** |
| ⭐⭐ **THE TOTAL** | **= 47** |

⛔⛔ **THE NARRATIVES MOVED OUT, THE COUNTS DID NOT** (2026-09-16). Each defect's account —
what was reported, what the cause turned out to be, which mistake shape it was — is in
[`queue_notes/DEFECT_LEDGER.md`](queue_notes/DEFECT_LEDGER.md), unrewritten. ⭐ The table above
stays HERE because the doctrine's point is that the NUMBER has one home; a 7 KB table of
stories in a front door was never that number's requirement. ⚠ A row's count changes here
**and** in that file, or in neither.

⭐⭐ **AND ONE REPORT THAT DID NOT SURVIVE INVESTIGATION, kept because it is the more useful
entry.** *"You destroyed the rotation around the gravity axis... it came back to the axis of
the screen view plane"* — withdrawn by the owner (*"it's alright: the logic is right"*) after
`tests/a7_wiring.test.ts` composed the gravity frame with the rotation and asserted the axis
that comes out, at four tilts including the bottom ring. ⛔ Every part of A7 already had
green vectors and **the composition had none** — mistake shape 4 pointing the other way, at a
correct piece of work. ⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent
property* — and measuring it is what separated a real defect from an impression, in both
directions at once.

⭐⭐ **AND A SECOND ONE, 2026-09-16 — A REPORT AGAINST A BUILD THE DEVICE WAS NOT RUNNING.**
*"When I test it on github page, I still see the issue with transition from translation to
rotation lagging"*, hours after the fix for it had been confirmed by finger over USB.
⛔ The gesture code was **identical on both surfaces**: the Actions history shows the fix
deployed at 05:28, two minutes *before* the USB session, and there is no dev/prod gating
anywhere in `src/`. ⭐ The tablet was running an **old bundle** — Pages serves `index.html`
with `Cache-Control: max-age=600` and the assets are content-hashed, so a cached index keeps
loading a superseded hash *indefinitely*. ⭐⭐ **So it is the withdrawn-`A7` shape one layer
lower**: the report was truthful, the reasoning from it was sound, and the unchecked premise
was *"both surfaces run the same code"*. ⚠ **Not counted as a gesture defect** — `A13`/`A14`
were right — but it is a real defect of the **deploy surface**, and it is fixed in the
product rather than in a procedure: `src/core/build_gate.ts` (16 vectors) plus a build stamp
on the HUD — ✅✅ **closed on the glass the same day** (*"working on device"*), and the full
account is [`queue_notes/DEP1d.md`](queue_notes/DEP1d.md). ⭐ `METHOD`: *a device report is evidence about the code the device was running.*
⚠ It also exposed a second thing, and this one was never a report at all: the HUD's
**overridden-tunables line has never been rendered**, for the whole life of the file, while
`40_RENDER_SCENE/INDEX.md` said it was. ⛔ An absent readout cannot be caught by looking at
the screen. Both are in `METHOD` now.

⛔ **Amend the ledger, never a bare number written somewhere else.** That is exactly how
this drifted: `README.md` said *seventeen* (the total before rule 6 and the sway) and
`40_RENDER_SCENE/INDEX.md` said *sixteen*, both frozen snapshots of a number that had
moved on. Both now point here instead of carrying a count of their own.
⚠ **Tuning judgements are NOT defects and are not counted** — the owner raising a gain, or
rejecting rotation inertia, is the loop working, not a fault found.

1. **A rate estimated over the shortest available baseline.** Flick lift speed, roll
   direction, roll curvature. ⭐ *State the window, and check the signal clears the
   noise, BEFORE writing the threshold.*
   ⛔⛔ **AND ITS MIRROR IMAGE, TWICE IN ONE WEEK**: a quantity measured from the OLDEST
   sample of a gesture instead of from the recent motion — the flick's travel and purity
   (`D33`) and the shake's axis (defect 45). ⭐ Both fixed by reading a **trailing window**,
   neither by a threshold. *The window is the longest extent a gesture may be read over, not
   the baseline it is measured on.*
2. **Measuring a DIFFERENT QUANTITY than the one asked for.** The tangent's turning
   instead of the angle about a centre — invisible until a finger reversed. ⭐ *When an
   estimator is hard, ask whether you replaced the quantity rather than improved it.*
   ⛔⛔ **AND THE SHAPE GOT INTO A GUARD WRITTEN TO CATCH IT** — the sagitta criterion
   read a span the product never fits, at the radius where it never binds, wrong in
   *quantity and direction* for eight device passes. ⭐ Deleted with the roll (`D31`);
   the working is in [`../10_INPUT_TOUCH/INDEX.md`](../10_INPUT_TOUCH/INDEX.md).
3. **IDEALISED FIXTURES.** Roll vanished from the deployed page with every vector
   green, because every fixture was a perfect circle. ⭐ *Build the imperfect specimen
   and the negative first.*
4. **A COMPOSITION NOBODY COMPUTED.** Radius and height were each interpolated
   correctly; their `hypot` was never checked, and gave three segments from three
   rings. ⭐ *`METHOD` already says this — ask what the whole chain does, in one
   expression.*

⭐⭐ **AND A FIFTH SHAPE EMERGED ON 2026-09-14: MY OWN FIXTURES.** Four false alarms in one session, every one of them a measurement bug rather than a code bug — comparing the object AFTER a step against the finger BEFORE it; a float loop taking one extra step; a window opened before two transients had finished; two frame rates given unequal total durations. ⚠ Each looked exactly like a real defect and one of them nearly got a correct implementation "fixed". ⭐ *State the instant each quantity is evaluated at, and step fixtures with integers.* ⛔ The tell for an unfinished transient versus a discretisation error: halve the timestep. Discretisation shrinks; a transient does not.

⭐ And **three times** a **device judgement overturned a confident synthetic
measurement**. When they disagree, suspect the metric. ⛔ The third: measuring
`pointerNoiseMm` (0.15 → **0.761 mm**) made the sagitta guard reject a configuration
seven device passes had already accepted. The finger was right and the guard was wrong.

### ⭐⭐ `IN5` is now practical, and mostly unblocked

Tunables override from the **URL** (`?motionDeadbandMm=3.5&gainRollDrag=3`), and the orbit
rings have an on-screen **tuning menu** that validates and explains refusals — so a
placeholder can be A/B'd by finger without a rebuild.
⭐ Measure **`pointerNoiseMm` FIRST**: the instrument is **built and on the HUD** as of
2026-09-14 (`src/input/noise_meter.ts`, line `noise floor=… now=… n=… cfg=…`). Hold one
finger still for a few seconds and read `floor`. The sagitta criterion and several other
thresholds are only defensible relative to it. ⛔ **Reading it is the owner's step** —
nothing in a suite can hold a finger on glass. ✅ **DONE 2026-09-14: 0.761 mm**, five
times the placeholder. ⚠ A resting-finger floor is not gameplay; it is used for the
sagitta rule only, where over-estimating is the safe direction.
⛔ ⭐ **The meter's own vectors found a hole in the meter's own vectors.** Three of four
naive alternatives failed as designed; the fourth — a window that only ever GROWS —
passed everything, because the minimum is taken while the window is still short. It
would have pinned the answer in the first 0.3 s, so a finger still settling as it lands
could never improve its reading. A fifth vector now covers it. ⚠ Mistake shape 1 again:
a statistic taken over the shortest available baseline.
⛔ `tests/config_debt.test.ts` now refuses any tunable nothing reads — after three
orphans (`moveExitDistance`, `tiltDeadband`, `gainRoll`).

⛔⛔ **`3D1` IS BUILT AND CLOSED (2026-09-15) AND NEXT IS `IN3`.** The object model is
`src/core/object_model.ts`, 42 vectors, and every gesture on the glass now drives it.
⭐ `IN3` has everything it needs: the constraint stack is attached to an object, so rule
2bis can finally ask *"is the stack empty"* — the precondition it has been missing.
⚠ `IN11` is also unblocked and needs no device: is 2bis's free rotation path-dependent?
✅✅ **`IN12` IS CLOSED** — `A11` put the deadband in §1.1 itself rather than in each rule,
so every rule reads the same side of it and none consumes a raw delta.

### ⭐⭐ WHAT THE 2026-09-15 SESSION SETTLED, beyond the rows

⭐ Four amendments, each now carrying its own account: **`A7`** every object gesture stands
on a **gravity frame** (the argument is orthogonality, not tidiness); **`A8`** a roll rebases
to the start of its circle; **`A6`/`A10`** depth is a **driver and a validator**, after five
models a hand rejected — *a blend has seams*, and *when a rule needs a WINDOW to decide,
suspect the QUESTION*; **`A9`/`A11`** §1.1 becomes a position deadband.
⛔ Full text in [`../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../10_INPUT_TOUCH/AMENDMENTS_R5.md),
the device narratives in the dossiers each one names. ⚠ Moved out of this file 2026-09-16:
it is narrative, and this is a front door.

### ⭐⭐ THE SYMPATHETIC SWAY and the CAMERA GUARDS — built 2026-09-14

⭐ The scene reacts to what the held object does instead of standing frozen around it, and
the camera has three guards (a deferred orbit centre, suppression while an object is held, a
double-tap fly home). ⛔ Both are **decoration and camera policy rather than queue state**,
and both are kept out of everything that MEANS something — the barycentre reads home
positions with the sway subtracted.
⭐⭐ **Moved to [`../40_RENDER_SCENE/INDEX.md`](../40_RENDER_SCENE/INDEX.md) on 2026-09-16**,
with their tunables and the measured false-kick rates, when this file passed its cap. ⚠ The
sway's re-trigger on a CHANGE OF DIRECTION was found by finger and is counted in the ledger
above.

### ⛔⛔ TWO THINGS A NEW SESSION MUST NOT REBUILD

Both were built, MEASURED, and taken out. They are recorded because the ideas are
attractive and will occur to anyone reading this code.

1. **Inertia and a phantom lead on the object's ROTATION.** Built 2026-09-14 as
   `src/input/spin.ts` — a critically/under-damped follower on the rotation vector of the
   error, with the branch cut handled and 12 vectors green. ⛔ **The owner rejected it on
   the device: *"I did not like the rotation inertia and slerp implementation."*** Rotation
   stays direct. ⚠ Do not re-derive it because translation has it: they were judged
   separately and came out differently.
2. **Telling the follower how fast the TARGET is moving** (`targetVelocity` in
   `follow.ts`). Arithmetically right — it makes a dragged object's trail frame-rate
   exact, 0.32 mm instead of 0.74 mm at 120 Hz. ⛔ **It made everything visibly jitter and
   was reverted.** Pointer events and render frames are not locked, so the per-frame target
   delta alternates (a frame with no event sees 0, the next sees double) and the lag term
   writes that beat into the position: frame-to-frame step change went from 1.12 mm to
   3.25 mm at 90 Hz pointer / 60 Hz frame, and 1.63 → 4.58 at 60/120.
   ⚠ **Mistake shape 1, committed in the file that warns about it.** Smoothing the
   estimate does not rescue it — the estimate is not the problem, the BEAT is. And the
   thing it bought was invisible: both trails are under the measured 0.761 mm pointer
   noise. ⭐ *An invisible 0.4 mm of trail is not worth a visible 2 mm of jitter.*

### ⭐ AND A NUMBER THAT CAME OUT OF THAT: the inertia has a FLOOR

The target only moves when a pointer event lands, so it arrives as a staircase of about
`speed ÷ pointer rate` — ~1.1 mm at 100 mm/s. **The mass is what smooths it**, which
means `translateInertiaMs` must be at least about one pointer interval (**8–12 ms**) or
the beat between the pointer clock and the frame clock is visible as jitter, whatever
else is tuned. Measured: 1.0–1.6 mm of wobble at τ = 1 ms against 0.43–0.69 mm at τ = 8 ms.
⚠ That is why the shipped τ is 7.6 ms and not lower.

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

## Phase IN — the touch input system

Design of record: [`../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| IN0 | Units, motion states, flick test | IN | feature | ✅ **CLOSED**, and §1.1 has had **FOUR formulations** — the first three all broke on a real pointer. ⭐ Now a **per-axis position deadband** (`A11`): time-free, exact, and robust by construction rather than by a threshold above a measurement. ⚠ `motionDeadbandMm` is the most load-bearing number in the input layer. ⭐⭐ **The most instructive file in the project** → [`queue_notes/IN0.md`](queue_notes/IN0.md) | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ✅ **CLOSED 2026-09-14.** 109 new vectors. **7 device passes, 14 defects none of which a green suite could see.** ⛔⛔ Its rule **2quinte** roll detector, *"built early and hardened"*, is **DELETED** (`D31`) — it had had no channel since `A12` and its retired verdict vetoed `IN3`'s flick. → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | ✅✅ **CLOSED 2026-09-14**, 22 + 8 vectors, confirmed by finger — `src/input/router.ts`, engine-free and generic over an opaque object handle. Three roles latched at press for the touchpoint's lifetime; §0 order-independence keyed by pointer id. ⛔⛔ **ITS LATCH HAS EXACTLY ONE EXCEPTION** (`A15`/`D25`): `relatchOnOrphan`, on a **discrete** event only. ⭐ What the latch protects against is a role recomputed from a CONTINUOUS reading, frame after frame — so the header was REWORDED, not deleted. ⭐ A vector pass found **two vectors that could not fail** → [`queue_notes/IN2.md`](queue_notes/IN2.md) | IN1, IN8 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | 🔨 **ONE MODEL SINCE `D40`** — forks A and B deleted with the flag, the slider and 41 vectors. ✅ **BUILT**: face selection from the picked NORMAL, **tap-to-align** (parallel, capped at one), both faces marked, the twist about the aligned normal, the shake **and** a re-tap as the two undos, and the rotation reset. ⛔ **NOT built**: `TargetPosition`, its gizmo, the orbit and the approach — **four owner decisions gate them**, one a real problem (the approach mapping degenerates AT CONTACT). ⛔⛔ **NO DEVICE LOOK YET** — ordered test list in §10 of [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) → [`queue_notes/IN3.md`](queue_notes/IN3.md) | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | ✅✅ **RULE 6 CLOSED 2026-09-15** — confirmed by finger in ordinary play, not only in a tuning session. ⭐ It has mass: a critically/under-damped follower plus a phantom lead, and its gain was **computed** (1.0 puts the object exactly under the finger). ⛔ **6bis / 6ter / 6quater wait on face centres** — now unblocked by `3D1`. ⚠ Rotation has **no inertia**: built and rejected on the device → [`queue_notes/IN4.md`](queue_notes/IN4.md) | IN2, 3D1 (6bis onward only) |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued, and ⭐⭐ **practical without a rebuild**: every tunable overrides from the URL and the menu validates refusals. ✅ `pointerNoiseMm` = **0.761 mm** is the one number MEASURED (2026-09-14) — and measuring it exposed a defect eight device passes had accepted. ⛔⛔ **A TRAP TO READ BEFORE BOOKING A SESSION**: several tunables are still READ but sit OFF the gesture path, so `config_debt` sees them used while they change nothing → [`queue_notes/IN5.md`](queue_notes/IN5.md) | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued. ⭐ `IN1`'s rollback snapshot is the same object — `PosePort<P>` in `recognizer.ts` is the seam | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — was undefined and reachable (§5) | IN | decision | 🔧 **ANSWERED THREE TIMES AND BUILT.** ⭐ The second touchpoint — inside **or** outside any object — drives **roll by its x** and **depth by its y** while the holder is still (`D22`/`A12`, `A10`). ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16**, which also closed the small-object hole owed since `A5`. ⛔ `A15`/`D25` then added: **a holder no longer UNDER its object gives the selection up** — a raycast at the second touchpoint's lift, the unselect deferred to the next input event, the previous yellow orbit centre kept (owner's call). 16 vectors, no new tunable. ⚠ **A DEVICE LOOK IS OWED on `A15` specifically** → [`queue_notes/IN8.md`](queue_notes/IN8.md) | IN2 |
| IN9 | ⭐ **CAMERA-ONLY rules: 4 (pinch zoom) and 1 (orbit)** — ⛔ needed NO object model, so it did not wait on `3D1` | IN | feature | ✅✅ **CLOSED 2026-09-14**, both rules working by finger. 56 vectors. Rule 1 cost **three** defects no green suite could see — including a **composition nobody had computed** (three rings gave three monotone segments) and a scheme **reversed on measurement** when the owner's ring shape overshot. ⭐ *"Three rigs, therefore two transitions"* is now enforced by `validateGestureConfig`. → [`queue_notes/IN9.md`](queue_notes/IN9.md) | IN1 |
| IN10 | Orbit about the point under the finger, not the barycentre | IN | feature | queued — ⛔ **deliberately behind `3D5`**, not behind a date: the scene holds **three** small objects and the barycentre is still the thing being worked on, while the catalog's case is explicitly about a model large enough that it is not. ⚠ Reopens a CLOSED row (`IN9`), and collides with three things: the yellow marker is where double-tap flies home to, pivot popping needs easing, and the orbit centre is already suppressed while an object is held. Prior art: conventional DCC/CAD, pre-1995 → [`queue_notes/IN10.md`](queue_notes/IN10.md) | IN9, 3D1, 3D5 |
| IN11 | ⭐ **Is rule 2bis's free rotation PATH-DEPENDENT?** — a debugging row | IN | defect? | queued, and ⭐⭐ **UNBLOCKED — it needs no object model**. 2bis is applied as a per-frame increment about two fixed axes, which do not commute, so out-and-back by a DIFFERENT route may not return the object. ⚠ Retracing the SAME path does close, which is why a tuning session would never show it. ⭐ **Write the square-path vector FIRST and confirm it FAILS against today's code**; the answer is a curve against drag angle, not a yes/no, and the fix (pure function of total displacement) has its own cost — A/B it. ⛔ Must not undo the world-frame axis composition or the axes latched at press → [`queue_notes/IN11.md`](queue_notes/IN11.md) | IN1 |
| IN12 | ⭐ **A DEADBAND on the pointer delta** | IN | defect | ✅✅ **CLOSED 2026-09-15 BY `A11`, AND NOT THE WAY THIS ROW SPECIFIED IT.** The owner made §1.1 *itself* a position deadband, so the excess-only travel is computed ONCE and every rule reads the same side of it — rather than each rule deadbanding its own `dx`/`dy`. ⭐ The **residual/catch-up form** this row recommended is what shipped, and its continuity vector is the one that separates it from the two broken forms. ⛔⛔ **AND THE ONE THING I SAID THIS ROW GOT WRONG, IT DID NOT.** I argued per-axis was a mistake because a square band makes a diagonal drag travel 1.41× further. ⭐ The owner restored it for a reason I never considered — **axis purity**: a square band gives a CORRIDOR along each axis in which the other emits nothing, so a nearly-horizontal drag is purely horizontal. A radial band cannot do that at any radius. ⭐⭐ **A threshold has a SHAPE as well as a size, and the shape decides things the size cannot.** Measured after the change: reversal cost is still one sample, so the corridor was bought for nothing. ⛔ Still owed: a device pass — `motionDeadbandMm` is now the commit threshold, the rest test and the jitter deadband at once, and nobody has judged it by finger → [`queue_notes/IN12.md`](queue_notes/IN12.md) | IN1, IN4 |
| IN13 | ⭐⭐ **WHICH TOUCHPOINT ASSIGNMENT SHIPS** | IN | decision | ✅✅ **ANSWERED AND CLOSED 2026-09-16 (`D28`)** — the tap toggle, after a hand drove three readings from one build over three versions. ⛔ Forks A and B are **deleted**, along with the flag, its latch, the slider and 44 vectors; `A14` and `A12` are retired **by construction**. ⭐ The comparison cost one boolean instead of two branches, which is what `D26` bought → [`queue_notes/IN13.md`](queue_notes/IN13.md) | IN4, IN8 |

## Phase 3D — objects and assembly

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| 3D0 | Mate connectors + residual; constraint stack + solver | 3D | feature | ✅ **built 2026-09-13**, carried and covered | — |
| 3D1 | The object model: id, placement, connectors, assembly tree (parent ≠ root) | 3D | feature | ✅✅ **CLOSED 2026-09-15** — *"locked/jumping fix is working"*. `src/core/object_model.ts`, 42 vectors, engine-free: placement, faces, connectors, the assembly tree and the constraint stack. ⭐⭐ The vectors were written FIRST and **falsified on purpose** — breaking the composition turns 14 of 42 red. ⭐ `reroot` implements **parent ≠ root** and moves nothing. ⛔ The pass found one wiring defect: the render loop drew only objects that HAPPENED to have a follower → [`queue_notes/3D1.md`](queue_notes/3D1.md) | 3D0 |
| 3D2 | Snap transform + capture radius + seat | 3D | feature | queued | 3D1 |
| 3D3 | Break on residual, and re-arm on exit | 3D | feature | queued | 3D2 |
| 3D4 | Real 3D file import (glTF) | 3D | feature | queued | 3D1 |
| 3D5 | ⚠ The tree has never held more than two objects | 3D | risk | carried, unclosed | 3D1 |

## Phase RND — scene and rendering

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| RND0 | Scene stub: camera, **three boxes**, face picking | RND | feature | ✅ built 2026-09-13 — diagnostic only. ⚠ **Three, not two** (`objectA`/`B`/`C`), and the third is deliberately **off-axis and off-plane**: three collinear objects put every barycentre on one line where the ray cannot tell them apart, so §2 rule 1 would look tested while exercising nothing. `2³ − 3 − 1 = 4` candidates | — |
| RND1 | Constraint visibility: per-entry glyphs, hard vs soft (§6) | RND | render | queued | 3D1 |
| RND2 | Mate preview: ghost + drop line | RND | render | queued | 3D2 |
| RND3 | Anchor ring during two-touchpoint gestures (§4) | RND | render | queued | IN2 |
| RND4 | Off-screen target indication — Halo / Wedge | RND | render | queued. ⭐ Not general polish: **6ter and 6quater need BOTH objects selected**, and at close zoom the partner is routinely off-frame, so the gesture becomes unreachable with nothing to say why. Curvature (Halo) or a tapered wedge encodes direction AND distance without a camera snap. ⚠ Audience includes youth — cap the indicator count. Prior art: Baudisch & Rosenholtz CHI 2003; Gustafson et al. CHI 2008 | 3D1, IN4 |

## Phase DEP — build and deployment

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| DEP0 | Vite + TS + vitest, `npm run verify` | DEP | infra | ✅ built 2026-09-13 | — |
| DEP1a | ⭐⭐ **Device loop over USB (Android)** — `adb reverse`. No network exposure AND `localhost` is a SECURE CONTEXT, so tilt + sensors work | DEP | infra | ✅✅ **WORKING 2026-09-13** on the Lenovo TB-X606F — two cubes confirmed on the device. ⭐ `adb reverse`, NOT Chrome port forwarding; the fix for the stuck handshake was the REAL `adb`. Procedure + 3 traps: `50_BUILD_DEPLOY/DEVICE_TESTING_USB.md` | DEP0 |
| DEP1b | Device loop over LAN — for iOS, or a second device. ⚠ needs a Private network + a scoped firewall rule (`scripts/allow-lan-dev.ps1`) | DEP | infra | queued | DEP0 |
| DEP1c | ⭐ **HTTPS on the LAN** (`@vitejs/plugin-basic-ssl`) — the only way to get a secure context on iOS over Wi-Fi | DEP | infra | queued — needed before rule 1 (tilt) can be tested on iPhone | DEP1b |
| DEP1d | GitHub Pages via Actions — real HTTPS anywhere, ⚠ slow loop | DEP | infra | ✅ **LIVE 2026-09-13** — https://dsug1.github.io/3d_assembly_game/ . Procedure: `50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md`. ⛔⛔ **AND IT SERVED A STALE BUILD FOR A MORNING (2026-09-16)**: `max-age=600` on `index.html` plus content-hashed assets means a cached index loads a superseded bundle **indefinitely**, and a confirmed gesture fix was reported broken on a tablet that had never fetched it. ✅✅ **FIXED AND CLOSED BY A DEVICE LOOK 2026-09-16** — *"working on device"*. The page checks `version.json` on boot and replaces itself once (`src/core/build_gate.ts`, 16 vectors), and the HUD prints the build id. ⭐ The plain URL is trustworthy again; a `?v=` is the refresh's marker, not something to type. → [`queue_notes/DEP1d.md`](queue_notes/DEP1d.md) | DEP0 |
| DEP2 | Capacitor shells for iOS/Android | DEP | platform | queued | DEP1 |
| DEP3 | Desktop shell (Tauri) | DEP | platform | queued | DEP2 |
| DEP4 | CI: typecheck + vectors on every push | DEP | infra | ✅ **rides in `pages.yml`** — the deploy is gated on `npm run verify` | DEP1d |

## Phase SEC — privacy, stores, compliance

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| SEC0 | THIRD_PARTY_NOTICES seeded, ships with the binary | SEC | governance | ✅ 2026-09-13 | — |
| SEC1 | Privacy policy + store disclosures for a youth audience | SEC | governance | open — before any submission | — |
| SEC2 | Shipping-build hygiene: compile-time-disable any capture | SEC | shipping | open — at package time | DEP2 |
| SEC3 | Dependency tree pinned by hash | SEC | infra | queued | DEP4 |
| SEC4 | ⭐ **Freedom-to-operate review of the GESTURE SET** | SEC | governance | open — before any commercial release (`D3`). ⭐ Its input exists as of 2026-09-15: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md) tags every rule prior-art / internal-composition / ⚠ novel-composite, so a review reads a table instead of a codebase. ⛔ **Three rules are marked NOVEL COMPOSITE** — §4's 6bis, 6ter and 6quater. ⚠ The camera mathematics does **not** need this review; the catalog is explicit that the litigated territory is multi-finger gesture composition | — |

## Phase GAME — the game proper

Nothing scheduled. ⭐ When it starts, rows go **here** with the right `Sub` tag —
never in a second queue in that folder.
