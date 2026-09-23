# THE BUILD QUEUE — one list, every subsystem

> **STATUS** · live · **OWNS** · what gets built next, for the whole project
> **READ IF** · you are starting any build, or wondering where an item stands
> **LAST VERIFIED** · 2026-09-22

⛔ **THIS IS THE ONLY QUEUE.** Do not start a second list anywhere else, and do not reorder it.

⭐ Each row's full history goes in `queue_notes/<ID>.md`; the `Notes` column is a pointer, not the
record. **A status changes in BOTH places or neither.**

`Sub`: `IN` = 10_INPUT_TOUCH · `GAME` = 20_GAME_RULES · `3D` = 30_OBJECTS_3D · `RND` =
40_RENDER_SCENE · `DEP` = 50_BUILD_DEPLOY · `SEC` = 60_SECURITY_COMPLIANCE · `CORE` = cross-cutting.

---

## ⭐⭐⭐ YOU ARE HERE (2026-09-22) — the input layer is done bar `IN3`

✅ TypeScript + Babylon + Vite; `npm run verify` = typecheck + **1091 golden vectors,
all passing** (37 → … → 1069 → 1081 → **1091**; ⭐ the DROPS are `D54`, the roll channel, forks A and B, and **`D82`'s in-zone basis**). ⛔⛔ **A COUNT RESTATED IN TWO PLACES GOES STALE** — `974`, then `978`: *amend the ledger, never a bare number written somewhere else.*
⛔⛔⛔ **THE 2026-09-19 LESSON, BINDING ON EVERY ROW**: *a rule written in `scene.ts` is a rule nothing can interrogate* — **seven** mutants survived the whole suite in one day, all found by a hand. ⭐ **Decisions in `src/input/`.** ✅ The boundary test walks the import **graph**, since direct imports alone let `src/core → ../main → @render/scene` pass.
⛔⛔ **THE `D66`–`D70` PASS (2026-09-21) REACHED `DECISIONS.md` AND THE SPEC, NEVER THIS QUEUE** → the [alignment spec](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.13–§5.17.
✅✅ **ROTATION INCREMENTS ARE CLOSED BY A DEVICE LOOK (`D73`, 2026-09-22)** — *"the build is working ok"*, after four formulations, three rejected by a hand (lagging, going forward, reversing). ⭐ The fourth never leaves an increment; its step is an **exponential approach**. ⚠ It ships at **0**, and **`dy` no longer twists** is a cost not reported on → [`queue_notes/IN3.md`](queue_notes/IN3.md)
⛔⛔⛔ **THE OBJECT AXES SHIPPED AND CAME BACK WITH THREE REPORTS IN ONE LOOK** (`D74`–`D76`, 2026-09-22/23):
a body translates along **its own axes**, the boot camera's, frozen (`worldAxisB=1`). ⛔ The first mapping
lost the cosine and a hand felt all of it: *inverted*, *very weak*, *dead at a level camera*.
⭐⭐ **Blender answers all three and says NO to the pairing** — it never binds screen-x to a world axis.
Now the delta is **solved onto both horizontal axes** (`translatePairing=1`), with **Blender's 5° cone**
falling back to `depthTranslate`'s judged rate. ⚠ `D74`'s in-zone basis is **deleted** (`D82`).
⭐ 38 vectors, six mutants. ⭐ `D77`: **no gizmo on a frozen body**, and **a second touch on one is a MISS** so it can drive another → [`queue_notes/IN4.md`](queue_notes/IN4.md)
✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/, gated on `npm run verify`.

### ⭐⭐⭐ WHAT IS OWED NEXT, IN ORDER (2026-09-17)

1. ⛔⛔ **APPROACH & MATE — THE HIGHLIGHTS AND THE ALIGNMENT TRACKING ARE BUILT; THE APPROACH IS NOT** (`D46`–`D48`, `A16`–`A21`, 2026-09-17). ✅ On the glass: white capture contours on a near pair (**translating + within `4L`**), every aligned body keeping its FollowerFace **and** a coloured body outline, a shake on a Pioneer releasing **all** its followers, a turned Pioneer releasing its cyan followers and rotating its orange ones **down a chain**, no cycles, and a **frozen** base plate. ⛔ NOT built: the approach, the hold-off, `SnapIsAuthorized`, the snap, the mate, the break.
   ⭐ New engine-free modules: `core/proximity.ts`, `core/alignment_links.ts`, `core/random_pose.ts`, `input/highlight.ts`, `input/pioneer_cascade.ts`, plus `frozen` in `core/object_model.ts`.
   ⛔⛔ **THREE DEVICE REPORTS, EACH FINDING SOMETHING NO TEST HERE COULD**, and `METHOD` gained a shape from each: *a fix that lands beside the defect leaves a green suite and a broken product*; *when two readings fit one device report, name both*; *a second symptom that contradicts your theory is worth more than a third that confirms it.* → spec §14 and [`../10_INPUT_TOUCH/INDEX.md`](../10_INPUT_TOUCH/INDEX.md).
   ✅✅ **THE CAPTURE IS A SURFACE GAP** (`D49`/`D50`, 2026-09-18): white is decided by the gap between the bodies' **surfaces**, from geometry **computed at spawn**; the threshold is **millimetres on the glass** scaled by camera distance, on a slider; and every outline and face marker is built from the **mesh topology**, not a bounding box. ⛔ The approach DIRECTION stays on centres — face-to-face collapses at contact → spec §19–§20.
   ⭐ Scene: three `L × 2L × 3L` parts `5L` apart at seeded random orientations (`?sceneSeed=N`), a **frozen** `6L × 0.3L × 9L` base plate `3L` below, camera at half max zoom-out. Ordered device lists: §12–§18 of [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md).
   ⛔ **Next**: the approach itself (4b.1), then `3D2`'s seat + the mate, then `D47`'s break. ✅✅ **THE LATENT DEFECT THAT WOULD HAVE ARMED WITH THE FIRST MATE IS CLOSED** (audit, 2026-09-17): three guards read `stack.length === 1`, meant *"is this body aligned?"*, and fell through to FREE rotation for any other count — so a seated body would have broken its mate and its alignment together. ⭐ `rotationChannel` now answers `FREE` / `TWIST` / **`REFUSED`**, and what a drag does to a seated body is `3D2`'s decision to make rather than a length test's.
2. ⛔⛔ **A DEVICE LOOK ON THE ALIGNMENT MODEL** — the ONLY model (`D40`), and **no hand has judged
   any of it**. The ordered list, with what falsifies each item, is §10 of
   [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md).
   ⭐ One of its questions is **answered**: *parallel* was not the sense a hand expected, and `D78`
   made it anti-parallel. ⚠ Still open: **can an ordinary reposition shake an alignment away?**
3. ⭐ **The verdict between the two undos** — the shake and `D39`'s re-tap do the same thing,
   and the owner expects to drop one: *"this is a complicated movement to execute by the
   user."*
4. ✅ **THE APPROACH IS RE-SPECIFIED** (`D46`) and the old second half may be retired with it —
   §6.0 of [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md) asks. ⛔⛔ **STAGE 2 — the OLD reading — was the second half of the
   owner's earlier rules** — `TargetPosition`, its
   cross-quad gizmo, the orbit about it and the two-object approach (`§2`). **Four owner
   decisions gate it** (`§7`), and one is a real design problem rather than a preference: the
   approach mapping has **no direction** when the centre→target line faces the camera and
   **shrinks to noise at contact**, with roll and depth displaced in that state so nothing can
   take over. ⭐ Nothing else in `IN3` is unbuilt.
5. ⚠ **THE MATE IS STILL UNREACHABLE — but the ORIENTATION is now a mate's** (`D78`,
   2026-09-23): the two faces point **at** each other. ⛔ Nothing is SEATED, and §4's `6quater`,
   the only rule that pushes a `MATE`, is flick-based, which this model does not have. ⭐ So what
   is left between here and `3D2` is a **position and a gesture**, no longer the geometry.

### ⛔⛔⛔ THE 2026-09-17 AUDIT — the first defects found by READING, and a device look is owed

⭐⭐ The whole record, with what is **not** fixed and why: [`queue_notes/AUDIT_2026-09-17.md`](queue_notes/AUDIT_2026-09-17.md).
⛔⛔ **THE ONE TO KNOW: the game booted in `TRANSLATE` while every document said `ROTATE`** — and `git log -S` finds no commit that ever returned `ROTATE`. Nothing regressed; the owner's decision never reached the code, and the vector asserted the value the function RETURNED rather than the decision made. ⭐ `METHOD`: *a vector written from the code it tests cannot contradict that code.* ✅ Owner re-confirmed and fixed.
✅ **Its finding 3 is now CLOSED by `D49`** — the `4L` centre radius *"cannot be right for the base plate"*, and the fix was the face-distance rule the owner had already named.
⚠ Also live on the glass: §1.1 **destroyed up to 7 mm** of travel on the one sample that confirmed rest; the re-tap undo worked only on the most recent alignment in the scene; a roll during a snap was discarded; the frozen plate wobbled; a bad URL tunable threw on **every press** with a silent HUD.
⭐⭐ **`frozen` AND THE TREE — the owner's call: PARENT YES, CHILD NEVER.** `attach`/`reroot` were uncovered, so attaching the plate under a part and moving that part put the plate at `[5, −1, 0]` with nothing ever writing its placement.
⛔⛔ **TEN VECTORS COULD NOT FAIL**, including the cascade's composition ORDER, `towardGravity`'s sign, `bestTwist` (both a sign flip and `return IDENTITY` survived) and `worldPose`'s tangent (caught by nothing). ⭐ One shape: *a fixture chosen because it is easy to reason about is usually chosen from the set where the quantity under test is ZERO.*
⛔ **NOT fixed, deliberately**: "millimetres" are CSS-reference mm, not physical (rule 3 is not what is computed — needs an owner calibration); the roll's sign flips at full rate across square (feel, a hand decides); the `4L` capture radius is centre-to-centre and wrong for a `6L×9L` plate — at boot the plate is **312.4 mm** from two parts against a 320 mm radius, so `scene.ts`'s *"at 5L nothing is in range"* was false.
⛔⛔ **A DEVICE LOOK IS OWED.** Rule 5 is not suspended because the findings came from a read: the boot mode, the twist and roll channels, the deadband's emission and the render order all changed.

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

Fifty-five defects, **fifty-four by finger** (the other by composing a measurement with a threshold),
and **not one visible to a green suite**. ⚠⚠ **TWICE IN ONE DAY THE CAUSE WAS *ONE FACT, TWO WRITERS,
ONE OF WHICH FORGOT*** — defects 52 and 53. They are **five** shapes — the fifth is below, and it
costs a correct implementation rather than a broken one:

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
| the twist killed the alignment snap | **1** |
| ⛔ **`IN3`** — the twist's `dx` SIGN, inverted at half of all alignments | **1** |
| ⛔ **`D73`** — a restarted ease stalled, so MORE increments moved the body LESS | **1** |
| ⛔ **`D76`** — the axis mapping lost the cosine; only the gravity channel kept up | **1** |
| ⛔⛔ **`D68`** — its guard was WRITTEN AND NEVER READ, and its flag had two writers | **1** |
| ⛔⛔ **the swing** — a vertical approach fed it no travel to sign from | **1** |
| ⛔⛔ **the gizmo** — a leading face re-chosen from one frame's step | **1** |
| ⛔⛔⛔ **the swing** — a driver test keyed on a mode NAME | **1** |
| ⭐⭐ **THE TOTAL** | **= 55** |

⛔⛔ **THE NARRATIVES MOVED OUT, THE COUNTS DID NOT**: the accounts are in
[`queue_notes/DEFECT_LEDGER.md`](queue_notes/DEFECT_LEDGER.md); a count changes in both places
or in neither.

⭐⭐ **AND ONE REPORT THAT DID NOT SURVIVE INVESTIGATION**: *"you destroyed the rotation around the
gravity axis"*, withdrawn after `tests/a7_wiring.test.ts` measured the composition at four tilts.
⛔ Every part of `A7` had green vectors and **the composition had none**.

⭐⭐ **AND A SECOND ONE, 2026-09-16 — A REPORT AGAINST A BUILD THE DEVICE WAS NOT RUNNING.**
The code was **identical on both surfaces**; the tablet held a cached `index.html` pointing at a
superseded bundle. ⭐⭐ The withdrawn-`A7` shape one layer lower: truthful report, sound
reasoning, and the unchecked premise was *"both surfaces run the same code"*.
⚠ **Not counted as a gesture defect**, but a real one of the **deploy surface**, fixed in the
product rather than in a procedure (`src/core/build_gate.ts`, 16 vectors, plus a build stamp on
the HUD) — ✅✅ closed on the glass the same day. ⚠ It exposed a second thing that was never a
report at all: the HUD's **overridden-tunables line had never been rendered**, for the whole
life of the file. ⭐ Both lessons are in `METHOD`; the account is
[`queue_notes/DEP1d.md`](queue_notes/DEP1d.md).

⛔ **Amend the ledger, never a bare number elsewhere**: `README.md` once said *seventeen*.
⚠ **Tuning judgements are NOT counted**: a raised gain, a rejected inertia, or a declined cost
that shipped named, is the loop working.

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

⭐ And **three times** a **device judgement overturned a confident synthetic measurement**; when they
disagree, suspect the metric. ⛔ The third: measuring `pointerNoiseMm` (0.15 → **0.761 mm**) made the
sagitta guard reject a configuration seven device passes had accepted.

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
⛔ ⭐ **The meter's own vectors found a hole in the meter's own vectors** — a window that only
ever GROWS passed every counter-example, because the minimum is taken while the window is still
short. Mistake shape 1 again → [`queue_notes/IN5.md`](queue_notes/IN5.md).
⛔ `tests/config_debt.test.ts` now refuses any tunable nothing reads — after three
orphans (`moveExitDistance`, `tiltDeadband`, `gainRoll`).

⛔⛔ **`3D1` IS BUILT AND CLOSED (2026-09-15) AND NEXT IS `IN3`.** The object model is
`src/core/object_model.ts`, 42 vectors, and every gesture on the glass now drives it.
⭐ `IN3` has everything it needs: the constraint stack is attached to an object, so rule
2bis can finally ask *"is the stack empty"* — the precondition it has been missing.
⚠ `IN11` is also unblocked and needs no device: is 2bis's free rotation path-dependent?
✅✅ **`IN12` IS CLOSED** — `A11` put the deadband in §1.1 itself rather than in each rule,
so every rule reads the same side of it and none consumes a raw delta.

### ⭐ THE FOUR AMENDMENTS OF 2026-09-15

⭐ `A7` the gravity frame, `A8` the roll's rebase, `A6`/`A10` depth, `A9`/`A11` §1.1 as a position
deadband — each accounted for in [`../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../10_INPUT_TOUCH/AMENDMENTS_R5.md).

### ⭐ THE SYMPATHETIC SWAY and the CAMERA GUARDS

⭐ Decoration and camera policy, not queue state → [`../40_RENDER_SCENE/INDEX.md`](../40_RENDER_SCENE/INDEX.md).
⛔ Since 2026-09-17 neither moves a **frozen** body — the model was frozen and the picture was not.

### ⛔⛔ THREE THINGS A NEW SESSION MUST NOT REBUILD

⚠ **Rotation inertia** (`src/input/spin.ts`) and **`targetVelocity`** in the follower were both
built, measured and **rejected by a hand** — the account, with the measurements, is in
[`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md).

⛔⛔⛔ **AND THE `dy` SWAP** (holder `dy`→gravity, second touch `dy`→depth) — built with vectors on
`1.0.24-Swapped-inputs-Discarded`, **measured over a sweep of camera poses, and discarded**.
⭐⭐ *A PAIR of axes covers for a foreshortened member; a SINGLE axis cannot*: the kept holder owns
the whole ground plane, the swapped one a vertical slice falling to **a fifth of the finger** at
ordinary poses. ⚠ It also blinds the swing → [`queue_notes/IN4.md`](queue_notes/IN4.md).

### ⭐ THE BUILD ORDER — spent, and moved down a tier

✅ **`IN2` → rule 6 translate → `3D1` → 6bis onward**, all of it up to 6bis DONE. ⛔⛔ **The live
warning survives**: translation is a **composition** — `translate × zoom × orbit` — and `D49` hung the
capture offset on the same camera factor, so *compute what one millimetre of finger does at BOTH zoom
extremes* binds a second rule. ⭐ Unrewritten: [`queue_notes/IN4.md`](queue_notes/IN4.md).

## Phase IN — the touch input system

Design of record: [`../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| IN0 | Units, motion states, flick test | IN | feature | ✅ **CLOSED**, and §1.1 has had **FOUR formulations** — the first three all broke on a real pointer. ⭐ Now a **per-axis position deadband** (`A11`): time-free, exact, and robust by construction rather than by a threshold above a measurement. ⚠ `motionDeadbandMm` is the most load-bearing number in the input layer. ⭐⭐ **The most instructive file in the project** → [`queue_notes/IN0.md`](queue_notes/IN0.md) | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ✅ **CLOSED 2026-09-14.** 109 new vectors. **7 device passes, 14 defects none of which a green suite could see.** ⛔⛔ Its rule **2quinte** roll detector, *"built early and hardened"*, is **DELETED** (`D31`) — it had had no channel since `A12` and its retired verdict vetoed `IN3`'s flick. → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | ✅✅ **CLOSED 2026-09-14**, 22 + 8 vectors, confirmed by finger — `src/input/router.ts`, engine-free and generic over an opaque object handle. Three roles latched at press for the touchpoint's lifetime; §0 order-independence keyed by pointer id. ⭐⭐ **ITS LATCH HAS NO EXCEPTIONS AGAIN** since `D54` deleted `A15`'s orphan unselect. ⭐ **A second touch on a FROZEN body is filtered to a MISS before the latch** (`input/frozen_pick.ts`, 2026-09-23) — the router still knows nothing about the model, and the finger becomes a working `OUTSIDE` touchpoint. ⛔⛔ **OPEN RISK, 2026-09-18**: a **stale grip** kills orbit AND zoom together — tell: *both camera rules dead, `active=` non-zero, no finger down*. ⚠ Unfixed, reload clears it → [`queue_notes/IN2.md`](queue_notes/IN2.md) | IN1, IN8 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | ✅✅ **THE ALIGNMENT MODEL IS CLOSED BY A DEVICE LOOK (2026-09-17)** — *"device pass ok, except these modifications"*, and all five modifications are built (`D43`–`D45`, defects 47–48). ⭐ Tap-to-align (**anti-parallel** since `D78`, capped at one, `SNAPSHOT` or `FOLLOW` by single/double tap), both faces marked, the twist about the aligned normal, shake **and** re-tap as undos, the rotation reset, and an eased **slerp** into place. ⚠ **The corrections themselves have not been re-judged** — only the slerp's speed, which a hand tuned three times. ⛔ **NOT built**: `TargetPosition`, its gizmo, the orbit and the approach — `1.0.22`. ✅✅ **AND `D73`'s ROTATION INCREMENTS ARE CLOSED BY A DEVICE LOOK (2026-09-22)**, shipping at **0** → [`queue_notes/IN3.md`](queue_notes/IN3.md) | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | ✅✅ **RULE 6 CLOSED 2026-09-15** — by finger, its gain **computed**. ⛔⛔ **ITS SCREEN-PLANE FORM IS SUPERSEDED** (`D75`/`D76`): a body translates along **its own axes**, the finger's delta **solved onto both horizontal ones** so it tracks exactly, with Blender's 5° cone at the edge-on case. ⚠ One device look, three reports, three fixes — **unjudged again**, and `screenTranslation`/`depthTranslate` stay as declared debt. ⛔ 6bis/6ter/6quater still wait on face centres → [`queue_notes/IN4.md`](queue_notes/IN4.md) | IN2, 3D1 (6bis onward only) |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued, and ⭐⭐ **practical without a rebuild**: every tunable overrides from the URL and the menu validates refusals. ✅ `pointerNoiseMm` = **0.761 mm** is the one number MEASURED (2026-09-14) — and measuring it exposed a defect eight device passes had accepted. ⛔⛔ **A TRAP TO READ BEFORE BOOKING A SESSION**: several tunables are still READ but sit OFF the gesture path, so `config_debt` sees them used while they change nothing → [`queue_notes/IN5.md`](queue_notes/IN5.md) | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued. ⭐ `IN1`'s rollback snapshot is the same object — `PosePort<P>` in `recognizer.ts` is the seam | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — was undefined and reachable (§5) | IN | decision | 🔧 **ANSWERED THREE TIMES AND BUILT.** ⭐ The second touchpoint — inside **or** outside any object — drives **roll by its x** and **depth by its y** while the holder is still (`D22`/`A12`, `A10`). ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16**, which also closed the small-object hole owed since `A5`. ⛔ `A15`/`D25` then added: **a holder no longer UNDER its object gives the selection up** — a raycast at the second touchpoint's lift, the unselect deferred to the next input event, the previous yellow orbit centre kept (owner's call). 16 vectors, no new tunable. ⚠ **A DEVICE LOOK IS OWED on `A15` specifically** → [`queue_notes/IN8.md`](queue_notes/IN8.md) | IN2 |
| IN9 | ⭐ **CAMERA-ONLY rules: 4 (pinch zoom) and 1 (orbit)** — ⛔ needed NO object model, so it did not wait on `3D1` | IN | feature | ✅✅ **CLOSED 2026-09-14**, both rules working by finger. 56 vectors. Rule 1 cost **three** defects no green suite could see — including a **composition nobody had computed** (three rings gave three monotone segments) and a scheme **reversed on measurement** when the owner's ring shape overshot. ⭐ *"Three rigs, therefore two transitions"* is now enforced by `validateGestureConfig`. → [`queue_notes/IN9.md`](queue_notes/IN9.md) | IN1 |
| IN10 | Orbit about the point under the finger, not the barycentre | IN | feature | queued — ⛔ **deliberately behind `3D5`**, not behind a date: the scene holds **three** small objects and the barycentre is still the thing being worked on, while the catalog's case is explicitly about a model large enough that it is not. ⚠ Reopens a CLOSED row (`IN9`), and collides with three things: the yellow marker is where double-tap flies home to, pivot popping needs easing, and the orbit centre is already suppressed while an object is held. Prior art: conventional DCC/CAD, pre-1995 → [`queue_notes/IN10.md`](queue_notes/IN10.md) | IN9, 3D1, 3D5 |
| IN11 | ⭐ **Is rule 2bis's free rotation PATH-DEPENDENT?** — a debugging row | IN | defect? | queued, and ⭐⭐ **UNBLOCKED — it needs no object model**. 2bis is applied as a per-frame increment about two fixed axes, which do not commute, so out-and-back by a DIFFERENT route may not return the object. ⚠ Retracing the SAME path does close, which is why a tuning session would never show it. ⭐ **Write the square-path vector FIRST and confirm it FAILS against today's code**; the answer is a curve against drag angle, not a yes/no, and the fix (pure function of total displacement) has its own cost — A/B it. ⛔ Must not undo the world-frame axis composition or the axes latched at press → [`queue_notes/IN11.md`](queue_notes/IN11.md) | IN1 |
| IN12 | ⭐ **A DEADBAND on the pointer delta** | IN | defect | ✅✅ **CLOSED 2026-09-15 BY `A11`, AND NOT THE WAY THIS ROW SPECIFIED IT** — the owner made §1.1 *itself* a position deadband, so the excess-only travel is computed ONCE and every rule reads the same side of it. ⭐⭐ **A threshold has a SHAPE as well as a size**: the per-axis band I argued against (a diagonal travels 1.41× further) buys **axis purity** — a corridor along each axis in which the other emits nothing, which no radius can give. ⛔ Still owed: a device pass — `motionDeadbandMm` is the commit threshold, the rest test and the jitter deadband at once, and no hand has judged it → [`queue_notes/IN12.md`](queue_notes/IN12.md) | IN1, IN4 |
| IN13 | ⭐⭐ **WHICH TOUCHPOINT ASSIGNMENT SHIPS** | IN | decision | ✅✅ **ANSWERED AND CLOSED 2026-09-16 (`D28`)** — the tap toggle, after a hand drove three readings from one build over three versions. ⛔ Forks A and B are **deleted**, along with the flag, its latch, the slider and 44 vectors; `A14` and `A12` are retired **by construction**. ⭐ The comparison cost one boolean instead of two branches, which is what `D26` bought → [`queue_notes/IN13.md`](queue_notes/IN13.md) | IN4, IN8 |

## Phase 3D — objects and assembly

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| 3D0 | Mate connectors + residual; constraint stack + solver | 3D | feature | ✅ **built 2026-09-13**, carried and covered | — |
| 3D1 | The object model: id, placement, connectors, assembly tree (parent ≠ root) | 3D | feature | ✅✅ **CLOSED 2026-09-15** — *"locked/jumping fix is working"*. `src/core/object_model.ts`, 42 vectors, engine-free: placement, faces, connectors, the assembly tree and the constraint stack. ⭐⭐ The vectors were written FIRST and **falsified on purpose** — breaking the composition turns 14 of 42 red. ⭐ `reroot` implements **parent ≠ root** and moves nothing. ⛔ The pass found one wiring defect: the render loop drew only objects that HAPPENED to have a follower → [`queue_notes/3D1.md`](queue_notes/3D1.md) | 3D0 |
| 3D2 | Snap transform + capture radius + seat | 3D | feature | 🔨 **NEXT — and its CAPTURE half is BUILT** (`D49`, 2026-09-18): surface-to-surface, shapes computed at spawn, offset in mm on the glass scaled by camera distance, on a slider. ⛔ Still owed: the snap, the seat and the mate. ⭐ **`1.0.22`, and the mechanism is SPECIFIED** (`D46`, [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md)): capture radius **1.25×** the object, hold-off **1.1×**, white contours, docking by ANGLE, then anti-align + translate-snap. ⛔⛔ **The game cannot assemble anything today**: nothing is SEATED (the ORIENTATION is a mate's since `D78`), and §4's `6quater` — the only rule that pushes a `MATE` — is flick-based, which this model does not have. ⚠ **Blocked on ONE owner decision: which gesture asserts a mate.** ⭐ `core/mate_connector.ts` is built and vectored (`testMate`, `mateResidual`), so what is missing is the gesture and the wiring, not the geometry | 3D1 |
| 3D3 | Break on residual, and re-arm on exit | 3D | feature | ⭐⭐ **THE BREAK GESTURE IS SPECIFIED** (`D47`): two fingers, one on each mated object, pulling **apart along the centre→centre direction** past a `BreakThreshold` (slider). ⛔⛔ It needs `3D2`'s **seat** first — §1.4's stack solves orientation only, so a mate does not hold POSITION today and *breaking* would be indistinguishable from *moving* → [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md) §8 | 3D2 |
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
