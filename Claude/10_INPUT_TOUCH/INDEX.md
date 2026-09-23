# 10 — TOUCH INPUT · gestures, the recognizer, constraints

> **STATUS** · ⭐ active · **OWNS** · everything a finger touches, up to the point an
> object's transform changes
> **READ IF** · you are building or debugging any gesture
> **LAST VERIFIED** · 2026-09-22

✅✅ **ROTATION INCREMENTS ARE JUDGED AND ACCEPTED** (`D73`, 2026-09-22) — above zero a held body is
**always on an increment**; four formulations, three rejected by a hand, defects **49**–**50** with it.
⚠ Not covered: **`dy` no longer twists**, and which increment should be the DEFAULT —
`rotationIncrementDeg` ships at **0** → [`../00_CORE/queue_notes/IN3.md`](../00_CORE/queue_notes/IN3.md).

⛔⛔⛔ **THE OBJECT AXES, AND THEIR FIRST DEVICE LOOK** (`D74`–`D76`, 2026-09-22/23). A body is
translated along **its own axes**: the boot camera's, **frozen for the scene** (`worldAxisB=1`, the
default) — or the live camera's at `0` — and inside the capture zone the **LeadingFace normal, gravity
and their orthogonal**, re-decided on the zone's **EDGE**. ⛔⛔ The first mapping scaled each input BY
its axis's foreshortening and a hand rejected all of it: *inverted*, *very weak*, *dead at a level
camera*. ⭐⭐ **Blender answers all three, and says NO to the pairing** — it never binds screen-x to a
world axis. ✅ The finger's delta is now **solved onto both horizontal axes** (exact tracking, one gain
for all three channels), with **Blender's 5° cone** handing the edge-on case to `depthTranslate`'s
judged rate. ⚠⚠ **The solve makes the in-zone basis INERT — an owner decision is owed.** ⭐ A
**LeadingFace** gizmo marks the exit face along the direction the body actually goes
→ [`../00_CORE/queue_notes/IN4.md`](../00_CORE/queue_notes/IN4.md).

⚠⚠ **A TRIAL IS LIVE**: the **approach swing** (`D63`). ✅ **FEEL ACCEPTED** (2026-09-21); ⚠ whether
it HELPS is unjudged. ⛔ [`spec/APPROACH_SWING_TRIAL.md`](spec/APPROACH_SWING_TRIAL.md) carries its
delete list.

⭐⭐ **Design of record → [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md)**,
the owner's revision-5 specification. ⛔⛔ **READ [`AMENDMENTS_R5.md`](AMENDMENTS_R5.md)
FIRST** — `A1`–`A9` are the owner's later decisions and **they supersede the spec's text**
where the two conflict. The spec is left standing and unaltered, because a superseded
clause explains why the current one exists.

## Where it stands

✅ **`IN0`** — units (mm→px), the hysteretic motion state, the flick test.

✅✅ **`IN1` CLOSED (2026-09-14)** — the recognizer state machine
(`recognizer.ts`): commit point, provisional motion with **rollback**, the
release-time priority ladder, tap / double-tap / hold, and the screen-plane rotation
mapping (`screen_rotate.ts`).
⛔⛔ **ITS ROLLBACK IS RETIRED TOO** (`D36`, owner): a flick keeps the rotation it was made
with. ⭐ *A rollback is only honest while the motion it undoes was provisional* — and once
`A16` made rotation a chosen MODE and `D33` made a flick readable at the end of a drag, it
was not. ⚠ The snapshot stays, for `IN6`.
⛔⛔ **ITS ROLL DETECTION IS DELETED** (2026-09-16, owner: *"clean the roll also for the
fork A"*): `roll.ts`, `one_euro.ts`, 58 vectors, the rebase, the pose history, ~16
tunables and the `ROLL_KEPT` verdict. ⭐ `A12` had moved roll to the second touchpoint's x
two days after it was hardened — **the circle fit had had no channel since**.
⛔ **Seven device passes found 14 defects, not one visible to a green suite.**

✅✅ **`IN9` CLOSED (2026-09-14)** — the two CAMERA-ONLY rules, which needed no object
model and so did not wait on `3D1`:
* **rule 4, pinch zoom** (`pinch.ts`) — all five device checks passed.
* **rule 1, orbit** (`orbit.ts`, `barycentre.ts`) — three defects found by finger and
  fixed, including a **composition nobody had computed**.

⚠ **The vector count lives in [`../00_CORE/QUEUE.md`](../00_CORE/QUEUE.md)** — this line said
**656** at a suite of 975, and it goes DOWN whenever a rule is deleted.

⭐⭐ **APPROACH & MATE — THE HIGHLIGHTS ARE BUILT, THE APPROACH IS NOT** (`A16`/`A17`, 2026-09-17):
white capture contours on a near pair (**translating**, and ⚠ the alignment was a condition for a
few hours as `D48` before the owner **removed it**), every aligned body keeping its FollowerFace
**and** a coloured body outline, a shake on a Pioneer releasing **all** its followers through a
two-way index (`core/alignment_links.ts`), a turned Pioneer releasing its cyan followers and
rotating its orange ones **down a chain**, **no cycles**, and **`frozen`**, enforced at
`object_model.ts`'s writers and carried by the base plate.
✅✅ **THE CAPTURE IS A SURFACE GAP SINCE 2026-09-18** (`D49`/`D50`): white is decided by the **gap
between the bodies' surfaces**, not their centres, against a threshold in **millimetres on the glass**
scaled by camera distance, on a slider. ⛔⛔ **AND IT IS DECOUPLED FROM THE ALIGNMENT SINCE `D79`**
(2026-09-23): any body, any other body, **one zone at a time and LOCKED** until it leaves — a pressed
pair outranks every distance, and the **face twins** are reported as the mate's seed. ⚠ It reverses
`D62` and restores `A21`; the lock is what is new → the approach spec §22. ⭐ Geometry is **computed at spawn** — no bounding
boxes, and no second source of truth in Blender. ⛔ The approach DIRECTION stays centre-to-centre,
because face-to-face collapses at contact → spec §19–§20.
⛔⛔ **NOT built**: the approach, the hold-off, `SnapIsAuthorized`, the snap, the mate, the break.
⭐ The design (`D46`), the ten owner answers it settled, and ordered device lists with what
falsifies each: §11–§21 of [`spec/APPROACH_AND_MATE.md`](spec/APPROACH_AND_MATE.md).
⭐⭐ The one to carry here: **the fine approach is TWO-HANDED** — a finger on each object, moving
together along their centre line — which is the break gesture with its sign reversed, and which
makes roll and depth irrelevant while docking, because a finger on the other body is a second
HOLDER and not a `SECOND`. ⛔ The build order is `3D2`'s **seat before the break**: a mate must
hold POSITION, or breaking is just moving.
⛔⛔ **AND THREE DEVICE REPORTS EACH FOUND SOMETHING NO TEST HERE COULD**, all on 2026-09-17 and
all now in `METHOD`; the accounts, unrewritten, are §14 of that spec.

⭐⭐⭐ **ONE INPUT MODEL SINCE `D40` (2026-09-17)**: tap a face on another object to align the
held one **anti-parallel** (`D78`, reversing `D37`), one at a time, undone by a shake **or** a re-tap. ⛔ Forks A and
B are **deleted** — with `anchor_fork.ts`, `align_flick.ts`, `drag_rule.ts`, the flag, the
slider and 41 vectors. ⚠ Everything closed by a hand below was closed under fork A's rules,
which this model inherits everywhere it does not override them. ⛔ **No device look on the
alignment rules yet**; the ordered test list is §10 of
[`spec/ALIGNMENT_RULES.md`](spec/ALIGNMENT_RULES.md).
⭐⭐ **THE COUNT WENT DOWN, AND THAT IS THE POINT**: 58 vectors describing a gesture that no longer
exists were **deleted, not kept green** — a vector whose subject is gone certifies a module nothing
calls, which is how the roll detector survived to cause defect 40.

### ⭐⭐ The amendments, and what of them is on the glass

| # | what it decided | built? |
|---|---|---|
| `A1`–`A4` | eviction: off the double-tap, off the roll channel, spares `MATE`s, and is a **quick back-and-forth** | ✅✅ **WIRED 2026-09-16** (`D32`) — fed **before** the refusal gate, because it is the escape from a full stack; alignments go, mates stay, and an empty take **refuses out loud**. ⚠ Four guessed tunables, four sliders, **no hand yet** |
| `A3` | **roll drives an anchored object's free DOF**, 2sexte suppressed where it degenerates | ✅✅ **WIRED 2026-09-16** (`D34`) — and its handover CONSTANT was never needed: `A12` made the drag and the roll two **channels**, so neither has to be chosen. Each REFUSES at its own degeneracy |
| `A5` → `A6` → `A10` | **depth**, decided three times: a pinch, then a common vertical drag, now a **STILL HOLDER and a MOVING ANCHOR** | ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16** — *"everything is working"* |
| `A7` | ⭐⭐ every object gesture stands on a **GRAVITY FRAME** | ✅ wired, and vectored end to end |
| `A8` | ⛔⛔ **DELETED 2026-09-16** — a roll rebased to the start of its circle. Retired by `A12`, then removed with the whole circle-fit channel | ⛔ gone: `roll.ts`, `rebaseOnRollCommit`, the pose history |
| `A12` | ⭐⭐⭐ **roll moves to the SECOND touchpoint's x**; its y stays depth. Retires the circle fit, the commit threshold and **the jump** | ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16** — *"everything is working"* |
| `A13` | ⭐⭐⭐ **one touchpoint TRANSLATES; a second held STILL ROTATES**. Whichever finger moves acts; the other one's state picks the rule | ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16** — *"everything is working"* |
| `A9` → `A11` | ⭐⭐⭐ **§1.1 IS A POSITION DEADBAND** — an anchor trailing at one dead radius, emitting the excess only. Time-free, exact, and it absorbs A9 | ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16** — *"everything is working"* |
| `A10` | ⭐⭐ depth — ⛔ **its still-holder GATE is DELETED (`D43`)**, so both fingers integrate at once; rule 6's second touchpoint may be on the object | ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16** — *"everything is working"* |
| `A13` ↔ the spec ↔ `A16` | ⭐⭐⭐ **THREE readings now run from ONE BUILD** (`D26`, `1.0.5`): one-finger translate is the default, two-finger is `?touchpointAssignment=1`, and ⭐ **fork C** (`=2`) makes a TAPPED second touchpoint toggle the ongoing drag — ⛔ which also picks the second finger's axis, **depth or roll, never both** | 🔧 ✅✅ **fork C CLOSED and now the DEFAULT** (2026-09-16) after three formulations of its toggle — the **verdict between the forks** is row `IN13`, not due until the input system can be judged whole |
| `A15` | ⚠⚠ **REVERSED BY `D54`** — the orphan unselect, `holder_binding.ts`, `relatchOnOrphan` and 16 vectors are **deleted**; a holder keeps its object for the touchpoint's lifetime and `IN2`'s latch has no exceptions again → [`../00_CORE/queue_notes/IN8.md`](../00_CORE/queue_notes/IN8.md) | ⛔ gone |

⛔⛔ **DEPTH COST SIX MODELS AND A DEVICE PASS EACH.** ⭐⭐ Its two transferable lessons are in
[`../00_CORE/METHOD.md`](../00_CORE/METHOD.md) word for word — *a blend has seams*, and *when a rule
needs a WINDOW to decide, suspect the QUESTION*.

✅✅ **`IN2` is CLOSED** (2026-09-14, 22 vectors, `src/input/router.ts`, confirmed by
finger): three roles — `OBJECT` / `OUTSIDE` / `IGNORED` — each **latched at press for the
touchpoint's lifetime** (§4), bindings keyed by pointer id so §0's order-independence
holds in both release orders, and `activeCount` excludes ignored touchpoints because
that is the count the §4 rule table is written against.
✅ **Judged by finger and accepted**: lift the finger holding a part while a second rests on that same
part and **the part stops responding** — the second was ignored at press, and the HUD says so
(`#1OBJ #2IGN active=1`) → [`../00_CORE/queue_notes/IN2.md`](../00_CORE/queue_notes/IN2.md)

🔨 **`IN3` IS IN PROGRESS**, 40 vectors of logic standing ahead of any renderer.
⭐ **2sexte + A3's handover BUILT** (`src/input/anchor_rotate.ts`, 25 vectors) — every
rotation is about the CONSTRAINT axis and *the anchor survives* is asserted directly, with
rotating about the VIEW axis kept as the counter-example. ⭐⭐ The near side's excursion is
`r·sin α`, so the drag **goes quiet over a range before it becomes undefined** — which is
where `anchorHandoverCos` has to hand over, and a device question.
⭐ **The eviction shake detector is BUILT** (`src/input/shake.ts`,
15 vectors) — ⛔ defined as oscillation ALONG AN AXIS, because **a circle projects to a
back-and-forth on every axis** and `A3` made circles legal on constrained objects.
⭐ `suppressesFlick` arms on the first reversal, which is A4's mandatory flick guard.
⛔ Not built: the rest of `IN3` (2bis's precondition, 2sexte + A3's handover, roll on an
anchored object, 2ter/2quater, the triangle→`FaceId` mapping, the `scene.ts` wiring that
CLOSES `3D1`) and `IN4`'s **6bis / 6ter / 6quater**.
⭐⭐ **BOTH ARE NOW UNBLOCKED** — `3D1` was built 2026-09-15, so the object model, the face
centres 6bis needs, and the constraint stack rule 2bis must consult all exist.
⭐ **`IN3` is NEXT**, and it also CLOSES `3D1`, which cannot be closed on its own.
⚠ `IN4`'s **rule 6 is CLOSED** (2026-09-15, confirmed in ordinary play); it is the rest of
that row that waits. `IN5` (measurement), `IN6` undo, `IN7` haptics.
⭐ `IN11` (is 2bis path-dependent?) is unblocked too and needs no device.

⛔⛔ **THE OWNER'S LATER DECISIONS SUPERSEDE THE SPEC** — [`AMENDMENTS_R5.md`](AMENDMENTS_R5.md),
read BEFORE the spec. ⚠ What follows is only what a later rule gets **wrong** if it is not carried.

* ⭐ **`A4`** — the flick test is **skipped once one reversal is seen**, or an abandoned shake ADDS
  a constraint instead of removing one. ⭐ **`A1` §4 (`D13`)**: eviction **spares `MATE` entries**,
  *one gesture, one intention*. ⭐ **`A2`**: the scene holds THREE objects, not two.
* ⭐⭐ **`A7` (`D18`)** — the gravity frame's argument is **orthogonality**, not tidiness: about the
  camera's own axes roll stops being independent of yaw as it tilts, and **no gain fixes a basis that
  is not a basis**.
* ⛔⛔ **`A5` (`D16`)** — **depth is HORIZONTAL**, the view axis flattened onto the ground, so an
  object's height never changes. ⚠ `IN2`'s `IGNORED` role moved to the THIRD touchpoint here. ⛔ Its
  pinch trigger died because **two fingers will not fit on a SMALL object, and pushing a part away
  shrinks it** — the gesture destroyed its own affordance as it succeeded.
* ⛔⛔ **`A3`** — roll drives the free DOF of an ANCHORED object. The spec forbade it for a reason
  that is false exactly where 2sexte's own screen mapping degenerates: **complementary charts over
  one DOF, not rivals.** ⚠ It puts the eviction gesture back under review, roll now being a
  legitimate control on precisely the objects eviction applies to.

⭐⭐ **EVERY GESTURE IS TAGGED WITH ITS PROVENANCE** (`D11`, `CONSTRAINTS` §10) — prior art with a
dated citation, an internal composition, or ⚠ novel. Register: [`PROVENANCE.md`](PROVENANCE.md).
⛔ Three rules came out **NOVEL COMPOSITE** — §4's **6bis, 6ter and 6quater** — the catalog's caution
zone and the reason `SEC4` exists. ⭐ It records what was DECLINED too.

⭐⭐ **`IN5` IS NOW PRACTICAL** — tunables override from the **URL**
(`?motionDeadbandMm=3.5&gainRollDrag=3`) and an on-screen **menu** carries sliders, so a
placeholder is A/B'd by finger without a rebuild.
⛔ **Every threshold is still a placeholder** except the six orbit ring values, the four
gains, rule 6's four feel numbers and the two sway sets — all chosen by a hand — and
**`pointerNoiseMm` = 0.761 mm, the only MEASURED number** (`src/input/noise_meter.ts`).
⚠ Measuring it immediately exposed a defect in a guard that eight device passes had accepted.
⛔ A guard refuses dead tunables (`tests/config_debt.test.ts`), after three orphans.
⭐ The instrument's design, the measurement, the orphan history and what each number rests on:
[`../00_CORE/queue_notes/IN5.md`](../00_CORE/queue_notes/IN5.md).

## ⛔⛔ Where the build already had to DEPART from the spec

**§1.1's `MOVING` condition is unusable as written.** Accumulated travel is **path length**, and a
resting finger's path length is a **random walk that grows without bound** — so every stationary
touchpoint eventually reads `MOVING` (measured: ±0.5 px of jitter crossed 1.5 mm in under half a
second) and every rule keyed on *"the other touchpoint is still"* silently stops working.
✅ The build uses **NET DISPLACEMENT FROM AN ANCHOR**, re-anchored on each return to `STATIONARY`.
⚠ A spec amendment, the owner's to ratify → [`../00_CORE/queue_notes/IN0.md`](../00_CORE/queue_notes/IN0.md)

---

**§1.3's state machine has no DOUBLE-TAP, and §1.4 cannot work without one.**
`IN1`, 2026-09-13.

§1.4 and rule 2septies make a **double-tap the only way a constraint is evicted**, but §1.3's state
machine stopped at `TAP` and the config carried no tap tunable — so the stack was write-only.
✅ Added as placeholders: `tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`. ⭐ And `TAP` needed a
time bound it did not have: taken literally a ten-second press lifted without moving is a `TAP`, so
the build adds a deliberately inert **`HOLD`** outcome above `tapMaxDuration`.

⛔ **Double-tap memory cannot live in the per-touchpoint recognizer.** Two taps are
two different pointer ids, so the recognizer that saw the first is already gone when
the second presses. It lives in a `TapHistory` shared across touchpoints.

---

**⛔ §1.3's roll detection — the centroid, the turning angle, and the circle fit.**
`IN1`, 2026-09-13. ⭐⭐ **THE LESSON IS MISTAKE SHAPE 2 IN ITS CLEAREST FORM** — three
estimators for one quantity, two of which silently measured a *different* quantity (the
centroid of an arc sits at 0.955 R at 60°, essentially ON the path; the path's turning angle
flips 180° at a cusp). ⛔ The code is **deleted** (`D31`), so the full account moves out of
this front door: [`history/2026-09-13_IN1_device_passes.md`](history/2026-09-13_IN1_device_passes.md).

---

**⛔⛔ `moveExitDistance` — AND EVERY OTHER §1.1 THRESHOLD — IS GONE.** `A11`, 2026-09-15.

⭐ The owner replaced §1.1 with a **per-axis position deadband**, and `stillSpeed`, `stillTime`,
`moveEnterDistance` and `moveExitDistance` went with the rule that related them. ⚠ What replaced the
REASONING, not just the numbers: each was a threshold chosen to sit ABOVE a measurement, and §1.1
broke on a real pointer **three times** that way. A displacement deadband needs no such choice.

⭐⭐ **The full sequence, and it is the most instructive file in the project:**
[`../00_CORE/queue_notes/IN0.md`](../00_CORE/queue_notes/IN0.md).

## ⭐ Amendments the OWNER made on the device, 2026-09-14

⭐ **Five decisions, with their reasons, are in**
[`history/2026-09-14_owner_device_decisions.md`](history/2026-09-14_owner_device_decisions.md)
— moved there 2026-09-15 when this file reached its 400-line cap. In force, in one line each:

* **§2 rule 1 is DRAG-ORBIT, not tilt-orbit** — driven by delta position; `DeviceOrientation`
  left the critical path entirely and `tiltDeadband` was deleted.
* **The orbit CENTRE migrates over finger travel**, not wall-clock, so it cannot drift on
  after the finger lifts.
* **The orbit STOPS SHORT, on a three-ring surface** — ⭐⭐ there is no pole to gimbal at,
  because the poles are not reachable. *Three rigs, therefore two transitions*, enforced by
  `validateGestureConfig`.
* **Orbit directions are INVERTED** — the finger pushes the world. ⛔ Both readings are
  internally consistent, so no sign-checking can tell you which a hand expects.
* **Roll smoothing ships ENGAGED, against the measurement** — ⭐ the metric was what was
  wrong: an error-against-ground-truth metric cannot score *"feels steady"*.

⚠ **Licence note for the three-ring orbit**, since it is the same idea as Unity
Cinemachine's FreeLook: ✅ no patent found, but ⛔ **Cinemachine's CODE is under the Unity
Companion License**, usable only in Unity-engine-dependent applications. Ours is written
from the geometry. See [`../../THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

## ⚠ Open questions the spec itself flags

* ✅✅ **`IN8` — two touchpoints on the same object: ANSWERED TWICE AND NOW BUILT.**
  `D10` ignored the second hit; `D16`/`A5` made it a depth **pinch**; `D17`/`A6` replaced
  the pinch's TRIGGER with a **common vertical drag** and kept its geometry. ⛔⛔ A hand
  found the hole that forced the second change: **two fingers will not fit on a SMALL
  object, and pushing a part away shrinks it** — the pinch destroyed its own affordance as
  it succeeded. ⚠ `IGNORED` survives with its trigger moved to the THIRD touchpoint.
  ⛔ **Still owed**: a proposal for reaching a small object at all (the owner's thought is
  to use TWO objects, which is 6ter's configuration) — asked for, and nothing built.
  → [`../00_CORE/queue_notes/IN8.md`](../00_CORE/queue_notes/IN8.md)
* **`axisMappingMode`** `rotated` vs `direct` (§6bis) — build both, A/B on a device.
* **`matePriorityOverAnchor`** (§1.4) — default is anchor-wins; the flag exists for
  the comparison.
* **6ter** (both touchpoints moving) is flagged by the spec itself as the hardest
  case to control and the one rule breaking the asymmetric-hands invariant.

## What to read, for what

| you want to… | read |
|---|---|
| **what a finger can ALREADY do** | ⭐ [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md)'s **BUILD STATUS** section — the inventory by touchpoint configuration, what is built, what is blocked, and the two behaviours with no clause behind them |
| **any gesture rule** | [`spec/SPEC_INPUT_SYSTEM_R5.md`](spec/SPEC_INPUT_SYSTEM_R5.md) — and mind the section numbers, they are referenced from code |
| know why a threshold is in mm | [`../00_CORE/CONSTRAINTS.md`](../00_CORE/CONSTRAINTS.md) §6 |
| change a tunable | `src/input/gestureConfig.ts` — ⛔ **one constant, one place**. ⭐ To try one *without a rebuild*: `?motionDeadbandMm=3.5` on the URL, or the on-screen menu for the orbit rings |
| know what is built | [`../00_CORE/QUEUE.md`](../00_CORE/QUEUE.md), phase `IN` |
| **why the input code looks the way it does** | [`history/2026-09-13_IN1_device_passes.md`](history/2026-09-13_IN1_device_passes.md) — every defect found by finger, including the ones that were measured and reverted |
| **the OWNER's later decisions** | ⭐⭐ [`AMENDMENTS_R5.md`](AMENDMENTS_R5.md), `A1`–`A9`. ⛔ They supersede the spec |
| why eviction and depth ended where they did | [`history/2026-09-15_superseded_amendment_text.md`](history/2026-09-15_superseded_amendment_text.md) — `A1`'s and `A5`'s full original text, moved out when the amendments file passed its 800-line cap |

### The source, and what each file owns

| file | owns |
|---|---|
| `gestureConfig.ts` | every tunable, **and every cross-tunable rule** in `validateGestureConfig` — the checks that catch a config which is individually plausible and jointly impossible |
| `config_override.ts` | `?name=value` overrides, so `IN5` can A/B by finger. ⛔ Refusals are reported, never ignored |
| `motion.ts` | ⭐⭐⭐ §1.1 as a **POSITION DEADBAND** (`A11`): an anchor trails the finger at one dead radius; inside it the finger is `STATIONARY` and emits nothing, outside it emits the **excess only**. ⛔ Every continuous rule consumes `step`, never a raw delta. ⚠ Four formulations of §1.1 have now failed on a real pointer — see `queue_notes/IN0.md`, it is the most instructive file in the project |
| `flick.ts` | §1.3's flick test. ⚠ Lift speed over a **window**, never the last sample pair |
| ⛔ ~~`roll.ts`~~, ~~`one_euro.ts`~~ | **DELETED 2026-09-16** — the Hyper circle fit and the 1€ filter, with rule 2quinte's one-touchpoint roll. ⚠ Roll itself LIVES, as the second touchpoint's x in `screen_rotate.ts`; what went is the *recogniser* that had had no channel since `A12` |
| `screen_rotate.ts` | rule 2bis's yaw/pitch and 2quinte's roll, ⭐ **about the GRAVITY FRAME** (`A7`) — yaw about the world vertical, pitch about the horizontal, roll about the view direction flattened onto the ground |
| `gravity_frame.ts` | ⭐⭐ `A7`'s frame itself: `{right, up, depth, towardGravity}` from a view axis and gravity. ⛔ A **distinct type** from `ScreenFrame`, so the compiler stops the two being interchanged — and `towardGravity` is what makes depth behave on the **bottom ring**, where "away" SINKS on screen instead of rising |
| `depth_translate.ts` | `A10`'s depth: `depthGate` (the holder's stillness, and nothing else), the push direction, and the world-space step |
| `translate.ts`, `follow.ts`, `lead.ts` | rule 6: the computed gain, the critically-damped follower, and the phantom target that leads along the finger's own smoothed velocity |
| `shake.ts` | `A4`'s eviction detector — oscillation **along an axis**, because a circle projects to a back-and-forth on every axis. ⚠ Built, not wired |
| `anchor_rotate.ts` | 2sexte and `A3`'s handover, about the CONSTRAINT axis. ⚠ Built, not wired — and it wants the TRUE view axis, not the gravity frame |
| `display_pose.ts` | `SWAY ∘ FOLLOW ∘ model` as ONE expression — what the eye sees, never where the object IS |
| `router.ts` | §4's roles, latched at press: `OBJECT` / `OUTSIDE` / `SECOND` / `IGNORED`. ⭐ **No exceptions** since `D54` deleted `A15`'s orphan unselect |
| `frozen_pick.ts` | ⭐⭐ `D77` — **a second touch on a FROZEN body is handed to the router as a MISS**, so the finger becomes a working `OUTSIDE` touchpoint and can drive another body. ⛔ Filtered BEFORE the latch, so the router still knows nothing about the model; the FIRST touch is untouched, because a plate must still be holdable as a Pioneer |
| ⛔ ~~`assignment.ts`~~ → `mode_toggle.ts` | ⭐⭐⭐ `D28` COLLAPSED IT into one input model — the mode flipped by **any single tap**, surviving a release: `initialBehaviour` / `toggleBehaviour` / `isTapRelease`, and nothing else. ⚠ The superseded text, kept as the record of `D26`/`D27`: **which rule table is in force**, as a flag rather than a fork, plus fork C's per-gesture toggle and §1.3's tap test. ⛔ It latches only while **nothing touches the glass**, and a mid-gesture flip is deferred, not dropped |
| `alignment.ts` · ⚠ `core/face_pick.ts` | ⭐⭐ **THE ALIGNMENT RULES, WHOLE** (`D37`–`D40`, and it was `fork_c.ts` until the forks were deleted): the **anti-parallel** face align frozen to a world direction (`D78`; the sign lives in `alignTargetFor` alone), the tap's THREE meanings (align / unalign / toggle), and the rotation reset scoped by *when* the alignment happened. ⭐ Keeping the set in one file is what made deleting the other two forks a `rm` plus a barrel line |
| ⛔ ~~`holder_binding.ts`~~ | **DELETED 2026-09-18** (`D54`) — `A15`'s *is the object still UNDER the finger?* raycast. ⭐ `IN2`'s latch has no exceptions again |
| `align_snap.ts` | `D45`'s eased slerp into the aligned pose — ⛔⛔ **one snap PER BODY**, not one slot for the scene: the audit found a second alignment abandoning the first **mid-arc**, still wearing its constraint and its markers |
| `rotation_increment.ts` | ⭐⭐⭐ `D73` — a held body is **always ON an increment**, jumping several at once so a backlog cannot exist. ⚠ Its step is an **exponential approach**: no clock to restart (defect 50) |
| `object_axes.ts` | ⭐⭐⭐ `D74` — which basis a body is translated along: the boot camera's (frozen), the live camera's, or the LeadingFace's inside the capture zone. ⛔ Re-decided on the zone EDGE, which is what breaks the circularity |
| `axis_translate.ts` | ⭐⭐⭐ `D75`/`D76` — the finger's delta **solved onto the two horizontal axes** so the body tracks it exactly, Blender's 5° cone at the edge-on case, and `A5`'s depth clamp carried over with the channel |
| `pinned_pioneer.ts` | ⭐⭐ `D51` — a held **Pioneer** that steers instead of being carried: at `pioneerTranslates = 0` its finger gives the Follower **both** depth and roll, breaking `A16`'s one-axis rule on purpose |
| `pioneer_cascade.ts` | a turned Pioneer **releases its cyan followers and rotates its orange ones, down a chain** (`D42`/`D70`), with **no cycles**. ⛔ It states this layer's rule: *a RULE in a render file is one nothing can interrogate* |
| `highlight.ts` | the white **capture** contours — the pair's SURFACE gap (`D49`) in mm on the glass, and the shell that IS that threshold, inflated by **half** it so two whites touching means capture |
| `sway.ts` | the sympathetic sway's reversal detector and `receivesSway` — ⛔ **two** exclusions: the body that CAUSED the kick, and (`D53`) any body with a finger on it |
| `approach_swing.ts` | ⚠ **A TRIAL** (`D63`) — the camera leans around the join and returns **by construction**, an offset exactly zero at both ends → [`spec/APPROACH_SWING_TRIAL.md`](spec/APPROACH_SWING_TRIAL.md), which carries its delete list |
| `camera_reset.ts` | the double-tap's flight home, and the clock `align_snap` borrows a fraction of |
| `noise_meter.ts` | the instrument behind the only measured number on this project |
| `pinch.ts` | rule 4. A **ratio** of separations, never a rate |
| `orbit.ts` | rule 1's three-ring surface, monotone and bounded by the rings |
| `barycentre.ts` | rule 1's orbit **centre** — what the camera orbits around |
| `recognizer.ts` | §1.3 itself: the state machine, rollback, and the release-time priority ladder |

---
