# THE BUILD QUEUE — one list, every subsystem

> **STATUS** · live · **OWNS** · what gets built next, for the whole project
> **READ IF** · you are starting any build, or wondering where an item stands
> **LAST VERIFIED** · 2026-09-28

⛔ **THIS IS THE ONLY QUEUE.** Do not start a second list anywhere else, and do not reorder it.

⭐ Each row's full history goes in `queue_notes/<ID>.md`; the `Notes` column is a pointer, not the
record. **A status changes in BOTH places or neither.**

`Sub`: `IN` = 10_INPUT_TOUCH · `GAME` = 20_GAME_RULES · `3D` = 30_OBJECTS_3D · `RND` =
40_RENDER_SCENE · `DEP` = 50_BUILD_DEPLOY · `SEC` = 60_SECURITY_COMPLIANCE · `CORE` = cross-cutting.

---

## ⭐⭐⭐ YOU ARE HERE (2026-11-12, branch `1.0.122-`, from `1.0.121-two-types-of-orbits-finalized`)

⭐⭐⭐ **THE OWNER (2026-11-12): `12dc4b6` (`1.0.121-two-types-of-orbits-finalized`, = `main`) IS THE BEST IMPLEMENTATION OF THE ORBIT SO FAR** — the reference to come back to (before it `1.0.117-Tilted-polar-orbit`, `6c6da30`); open points closed (`POLAR_ORBIT_CLEANUP.md` §9.16). ⭐⭐⭐ **Now: the slide removed, the contact close in (steps 1 – 3 ✅)** → [`CLOSE_IN_CONTACT.md`](../40_RENDER_SCENE/spec/CLOSE_IN_CONTACT.md).
⭐⭐⭐ **BUILT (branch `1.0.117-Tilted-polar-orbit`, 2026-11-10; *"The build is good"*; the slide under it ⏸ for the slide's own work) — THE TILTED POLE** (`POLAR_ORBIT_CLEANUP.md` §9.4 the rule, §9.5 as built and probed): a press on a cap tilts the orbit so the cap is a side (the heading swung square, the gizmo kept); off it the world's frame, the roll back by the finger with a 250 ms minimum; three sliders (☰ → CAMERA → CAMERA ORBIT AROUND CENTER); `src/input/orbit_tilt.ts`. ⛔ No device close.
⭐⭐⭐ **2026-11-09 — `1.0.114from1.0.112-` (now `…-Polar-orbit-cleaned-with-slide`, live `98ef251`; `POLAR_ORBIT_CLEANUP.md` §8)**: `1.0.112-` renamed `1.0.112-Polar-orbit-Final-with-slide`; `1.0.113-` (the step walk F8, the line joins F6) renamed `1.0.113-not-used` — the owner: *"too many back and forth of the red and green sections"* at the notches; main rolled back to `1.0.112-` + F7b. Built here: **F7b** (the calm on every side facet, slanted ones included), **the lines refined** (I17's drawing: a narrow face drawn on its surface, a slice a frame), **a line broken only where the gizmo jumps** (the joins verified within the frame's budget; the lift along the real surface — §8.7), **a closed void bridged only where it has NO floor** (the owner's amendment of D3; the piece-fit rule for closed voids too — the top's channel: the red along its floor). I17 and §8.5: closed 2026-11-12 (§9.16).
⭐⭐⭐ **THE PROTOTYPE IS THE MAIN LINE** (since 2026-10-10, `1.0.62-`): the orbit moves the ORBITED PIECE round a yellow gizmo, the camera follows;
merged into `main`, served at the site root; no `D`-numbers; the record is `40_RENDER_SCENE/spec/` (`DOUBLE_ORBIT_PROTOTYPE.md` — a dated line per
change) and `30_OBJECTS_3D/spec/COLLISION.md` §11–§12.
⭐⭐⭐ **CURRENT THREAD — THE TILTED ORBIT, REBUILT FROM `ff2fca2`** → [`TILTED_ORBIT_REBUILD_SCOPE.md`](../40_RENDER_SCENE/spec/TILTED_ORBIT_REBUILD_SCOPE.md)
(six invariants, the steps, each step's probes and numbers). ✅ Steps 0–4c-bis and ✅ **Step 5** (2026-11-05: the face map on the FACES CONTOUR, D3's real
depth, D5's two sliders) and ✅ **§18** (`1.0.100-`: the voids bridged, the edges on the surface, the piece by its support; traversal probes) built —
⛔ no device close on any. ⭐⭐⭐ **Now: THE CLEAN-UP** (I1 – I14, F1 – F10, not built; ⚠ `Scene_1` a cube: `SCENE_1.md` §12) → [`POLAR_ORBIT_CLEANUP.md`](../40_RENDER_SCENE/spec/POLAR_ORBIT_CLEANUP.md) §0. ⏸ The hover waits.
⭐⭐⭐ **2026-11-09 — THE WALKS AND THE ROOT CAUSES** (`1.0.110-Polar-orbit-issues`): 23 random-walk scenarios (`scripts/probes/walk_*.mjs`), two new issues (**I15** the seam trap — the solver absorbed at yaw 90° for ever; I16), **seven roots R1 – R7** (⭐ R1: the face map built from GLUED faces — the cube's ±x facets on internal planes) and the build order → [`POLAR_ORBIT_CLEANUP.md`](../40_RENDER_SCENE/spec/POLAR_ORBIT_CLEANUP.md) §4 – §5.
⭐⭐⭐ **2026-11-09 — THE FIXES BUILT** (`1.0.111-Polar-orbit-fixes`): R1 (the exposed faces), R2, R4 (the ring's jump crossed), R3, R6 (the slide lets go at its edge), the calm's branch cut, the map's catch-up hold; the walks re-run: the seam trap 36 → 1, the slide traps 17 → 3; then the void crossing (a narrow groove crossed whole, else BLOCKED — never deferred): the blocked stalls 51 → 21; ✅ the owner closed three open points with nothing built — the left notch (not reproduced on the device), the poles, the close-in block at a protruding part: all normal; ✅ the fourth — a groove too narrow for the piece — studied on synthetic voids and built on `1.0.112-`: the rims where the faces end, an open void the held piece cannot enter is surface (§7); **1682** vectors → [`POLAR_ORBIT_CLEANUP.md`](../40_RENDER_SCENE/spec/POLAR_ORBIT_CLEANUP.md) §6.
⭐ **The owner's rules**: the solver budget stays **24 gap queries** a frame (*"i am testing on iphone"*); patent-free methods only;
md, commits, deploys only when asked; deploy = push the branch, merge `--no-ff` into `main`, push, wait for `version.json`.
⭐⭐⭐ **2026-11-10 — THE AUTOMATIC TILT, THEN THE REBUILD** (`1.0.118-` → `1.0.119-`; `POLAR_ORBIT_CLEANUP.md` §9.6 – §9.7): within 20 % a face holding a pole tilts by itself, by its own angle; the back-and-forth fixed; ⭐ the rebuild — every tilt starts at the EDGE, runs to the end at ONE speed (360°/s), the gizmo HELD meanwhile; the face map's slow stretch removed — its jumps at notched edges (110 mm, 85 mm) GLIDED by time at the edge (§9.8), then EVERY step of the real depth (a notch's wall, a void's rim — §9.9); ⭐ the shake at a crossing — the whole share on the rig's lag, the auto tilt at the edge whatever the glide, a void's mouth handed over at its floor's edge, and the calm CARRIED over a top / bottom edge (§9.10). ⛔ No device close.
⭐⭐⭐ **2026-11-10 — THE WAY FORWARD: `1.0.120b-Orthogonal-tilted-poles`** — close in the camera SQUARE to the gizmo's face, every edge a timed frame change; `1.0.121-`: polar, a cap reads the side's calm at its yaw; the automatic tilt's camera pending, then blended by the finger (§9.11b – §9.15). ⛔ No device close.
✅ `npm run verify`: **1660 golden vectors, all passing** — MEASURED 2026-11-12 on `1.0.122-` (the count's home; 1655, 1646 before steps 3, 2; 1744 on `1.0.121-`; 1738 before §9.14; 1734 before §9.13; 1732 before §9.11b; 1727 before §9.10; 1726 before §9.9; 1724 before §9.8; 1730 before the rebuild §9.7; 1716 before §9.6; 1700 before the tilted pole; 1696 before §8.7, the lines' joins; 1688 with F7b, 1682 before it, §8; 1674 before the voids, §7; 1642 on 2026-11-08, the cube).

⭐ The 2026-09-30 record block (`D180`, the paused playability program, the inputs' simplification) moved → [`history/2026-11-09_queue_spent_blocks.md`](history/2026-11-09_queue_spent_blocks.md).

### ⭐ WHAT IS STILL OWED

1. ⛔⛔ **The playability program above** — `GM1` ✅ (`D180`), `3D7` ✅ (`D181`, the play volume); `3D2` (the approach) next.
2. ✅ **~~A device look on everything since `D106`~~** — *"Checked and all closed"*, the owner, 2026-09-30; ✅ and `D180`'s own (*"Tested, ok"*).
3. ⚠ `D47`'s pull-apart break (`3D3`) and the approach (`3D2`) — specified, not built.
4. ⚠ **Prototype `1.0.58b-`** → `DOUBLE_ORBIT_PROTOTYPE.md`; its demo path drives the box, `DEMO_SCENE.md` §7. ⭐ (2026-10-14) it IS the main line — see the block above.
⭐ The 2026-09-17 version of this list (white contours, shakes, two undos, `FOLLOW`) is spent → [`history/2026-09-27_queue_spent_blocks.md`](history/2026-09-27_queue_spent_blocks.md).

### ⛔⛔⛔ THE 2026-09-17 AUDIT### ⛔⛔⛔ THE 2026-09-17 AUDIT — the first defects found by READING, and a device look is owed

⭐⭐ The whole record, with what is **not** fixed and why: [`queue_notes/AUDIT_2026-09-17.md`](queue_notes/AUDIT_2026-09-17.md); the hygiene audit that followed: [`queue_notes/AUDIT_2026-09-27.md`](queue_notes/AUDIT_2026-09-27.md).
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
⛔ Its **provisional-motion ROLLBACK is retired** (`D36`), and the flick itself is deleted (`D110`).
⛔ Its **one-touchpoint roll is deleted** (2026-09-16) — `A12` had moved roll to the second
touchpoint's x and the detector was left running, *"unused"*, where it vetoed `IN3`'s flick
(defect 40). ✅✅ **`IN9` CLOSED** — both camera rules, pinch zoom and orbit, working by
finger. ✅✅ **`IN2` CLOSED** — the three latched roles.

✅✅ **AND THE WHOLE TWO-TOUCHPOINT SET IS CLOSED BY A DEVICE LOOK (2026-09-16)** —
*"everything is working"*: **`A10`** depth (⚠ its still-holder GATE is deleted, `D43`), **`A11`** §1.1 as
a per-axis position deadband, **`A12`** roll on the second touchpoint's x, **`A13`** one
touchpoint translates and a second held still rotates, **`A14`** a lift-and-replace is one
gesture. ⭐ That is what `1.0.4` is: **translation with one finger.**

⛔ `A15` (closed by the same look) was **deleted by `D54`** → [`history/2026-09-27_queue_spent_blocks.md`](history/2026-09-27_queue_spent_blocks.md).

### ⭐⭐⭐ THE INPUT MODEL, AND IT IS NOW SINGULAR### ⭐⭐⭐ THE INPUT MODEL, AND IT IS NOW SINGULAR (`D28`, 2026-09-16)

✅✅ **`IN13` IS ANSWERED AND CLOSED.** One build carried **three** readings of §2/§4 from
`1.0.5` to `1.0.7` — fork A (one touchpoint translates), fork B (the spec's inversion) and
the tap toggle — so a hand could compare them in the same minute on the same scene. ⭐ The
owner drove all three and chose the toggle: *"remove the forks A and B. I am satisfied with
fork C."*

⭐ Its 2026-09-16 table (any tap flips the mode; a second finger picks roll *or* depth) is spent: the toggle narrowed (`D108`), an aligned body is mode-less, the second finger lifts + spins (`D123`) → [`INPUTS_TABLE.md`](../10_INPUT_TOUCH/spec/INPUTS_TABLE.md).

⛔⛔ **DELETED, NOT DISABLED**: `holderDrive`⛔⛔ **DELETED, NOT DISABLED**: `holderDrive`, the flag, its latch, the menu slider,
`assignment.ts` (→ `mode_toggle.ts`) and **44 vectors**. ⭐ A dormant fork is a trap, and a
tunable nothing reads is what `config_debt.test.ts` refuses.
⛔⛔ **AND IT RETIRED `A14` AND `A12` BY CONSTRUCTION** — the grace existed only because the
mode read second-touchpoint presence, and two-axes-at-once is unreachable once the mode picks
one axis. ⚠ Both texts stand as the record of defects that can no longer occur.
⭐ The whole comparison, and the three formulations the toggle went through, are in
[`queue_notes/IN13.md`](queue_notes/IN13.md).


### ⛔⛔ THE FIVE MISTAKES THIS PROJECT KEEPS MAKING — they bind `IN3`/`IN4`

Sixty-nine defects, **sixty-eight by finger** (the other by composing a measurement with a threshold),
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
| 56–58 **the swing** (deleted `D120`) — amplitude, direction, a speed that never decayed | **3** |
| 59–61 **the gizmo** — a flare, a mode named `"DEPTH"`, a latch that never let go | **3** |
| 62 — §1.1's rest window shorter than the device's event interval | **1** |
| 63–64 — `D87`'s inversion: two face namespaces, a line naming the wrong finger | **2** |
| 68 — a correct mesh shaded as a torus | **1** |
| 70 — four rounds of a desktop input layer | **1** |
| 71 — a billboard parented to a body | **1** |
| 72 — every snap cancelled on its landing step (`3D6`) | **1** |
| 73 — a STALE cursor snapped for one frame after a re-alignment (`D140`) | **1** |
| ⭐⭐ **THE TOTAL** | **= 69** |

⚠ The ledger numbers 74 entries: **65, 66, 67, 69 and 74** were found by a mutant, a change, my own fixtures or a headless measurement — a different kind, not counted here.
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

⭐⭐ **AND A FIFTH SHAPE EMERGED ON 2026-09-14: MY OWN FIXTURES.** Four false alarms in one session, every one a measurement bug, and one nearly got a correct implementation "fixed". ⭐ *State the instant each quantity is evaluated at, and step fixtures with integers.* ⛔ The tell for an unfinished transient versus a discretisation error: halve the timestep.

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

⛔⛔ **`3D1` IS BUILT AND CLOSED (2026-09-15)**, and `IN3` was built on it. The object model is
`src/core/object_model.ts`, 42 vectors, and every gesture on the glass now drives it.
⭐ The constraint stack is attached to an object, so rule 2bis asks *"is the stack empty"*.
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
| IN0 | Units, motion states, flick test (⛔ flick deleted, `D110`) | IN | feature | ✅ **CLOSED**, and §1.1 has had **FOUR formulations** — the first three all broke on a real pointer. ⭐ Now a **per-axis position deadband** (`A11`): time-free, exact, and robust by construction rather than by a threshold above a measurement. ⚠ `motionDeadbandMm` is the most load-bearing number in the input layer. ⭐⭐ **The most instructive file in the project** → [`queue_notes/IN0.md`](queue_notes/IN0.md) | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ✅ **CLOSED 2026-09-14.** **7 device passes, 14 defects none of which a green suite could see** → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | ✅✅ **CLOSED 2026-09-14**, confirmed by finger — `src/input/router.ts`, engine-free and generic over an opaque handle. ⭐⭐ **ITS LATCH HAS NO EXCEPTIONS AGAIN** since `D54`. ⭐ The 2026-09-18 **stale grip** (orbit AND zoom dead): ✅ fixed 2026-11-04 — a lost window releases every pointer (`forgetPointers`, the audit) → [`queue_notes/IN2.md`](queue_notes/IN2.md) | IN1, IN8 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | ✅✅ **THE ALIGNMENT MODEL IS CLOSED BY A DEVICE LOOK (2026-09-17)** — tap-to-align (**anti-parallel** since `D78`, capped at one), both faces marked, the twist, an eased slerp. ⛔ Since judged away: `FOLLOW` (`D106`), both undos (`D107`), the flick (`D110`). ⛔ **NOT built**: `TargetPosition`, its gizmo, the orbit, the approach. ✅✅ `D73`’s increments closed 2026-09-22, shipping at **0**. ⛔ **`D87`/`D90` (the inverted roles, the swap) are BUILT AND UNJUDGED**; the fuchsia offer is deleted (`D109`) — spec §11 → [`queue_notes/IN3.md`](queue_notes/IN3.md) | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | ✅✅ **RULE 6 CLOSED 2026-09-15** — by finger, its gain **computed**. ⛔⛔ **ITS SCREEN-PLANE FORM IS SUPERSEDED** (`D75`/`D76`): a body translates along **its own axes**, the finger’s delta solved onto both horizontal ones. ⛔ `D145`: along the LIVE camera's right and view, flattened. ⚠ Unjudged again; `screenTranslation`/`depthTranslate` are deleted (`D109`). ⛔ 6bis onward still wait on face centres → [`queue_notes/IN4.md`](queue_notes/IN4.md) | IN2, 3D1 (6bis onward only) |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued, ⭐⭐ **practical without a rebuild**: every tunable overrides from the URL. ✅ `pointerNoiseMm` = **0.761 mm** is the one number MEASURED, and measuring it exposed a defect eight device passes had accepted. ⛔⛔ **A TRAP TO READ BEFORE BOOKING A SESSION**: several tunables are READ but sit OFF the gesture path, so `config_debt` sees them used while they change nothing → [`queue_notes/IN5.md`](queue_notes/IN5.md) | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | ✅ **BUILT as one scene history** (`D111`): a double tap undoes the last action — ⭐ only on a body that action MOVED (`D141`) — `core/undo_history.ts`, `render/undo_wiring.ts`. ⛔ Unjudged ⭐ A gesture that changes nothing costs 0 (`D157`/`D158`) → [`queue_notes/IN6.md`](queue_notes/IN6.md) | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — was undefined and reachable (§5) | IN | decision | 🔧 **ANSWERED THREE TIMES AND BUILT.** ⭐ The second touchpoint — inside **or** outside any object — drove roll by its x and depth by its y (`D22`/`A12`, `A10`); ⚠ now it lifts along gravity and spins (`D108`/`D123`), and a press on ANOTHER body steers the held one (`D124`). ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16**, which also closed the small-object hole owed since `A5`. ⛔⛔ **`A15`/`D25`'s orphan unselect is DELETED** (`D54`) → [`queue_notes/IN8.md`](queue_notes/IN8.md) | IN2 |
| IN9 | ⭐ **CAMERA-ONLY rules: 4 (pinch zoom) and 1 (orbit)** — ⛔ needed NO object model | IN | feature | ✅✅ **CLOSED 2026-09-14**, both rules working by finger. Rule 1 cost **three** defects no green suite could see — including a **composition nobody had computed** and a scheme **reversed on measurement**. ⭐ *"Three rigs, therefore two transitions"* is enforced by `validateGestureConfig` → [`queue_notes/IN9.md`](queue_notes/IN9.md) | IN1 |
| IN10 | Orbit about the point under the finger, not the barycentre | IN | feature | queued — ⛔ **deliberately behind `3D5`**, not behind a date: the scene holds **three** small objects and the barycentre is still the thing being worked on, while the catalog's case is explicitly about a model large enough that it is not. ⚠ Reopens a CLOSED row (`IN9`), and collides with three things: the yellow marker is where double-tap flies home to, pivot popping needs easing, and the orbit centre is already suppressed while an object is held. Prior art: conventional DCC/CAD, pre-1995 → [`queue_notes/IN10.md`](queue_notes/IN10.md) | IN9, 3D1, 3D5 |
| IN11 | ⭐ **Is rule 2bis's free rotation PATH-DEPENDENT?** — a debugging row | IN | defect? | queued, ⭐⭐ **UNBLOCKED — it needs no object model**. 2bis is a per-frame increment about two fixed axes, which do not commute, so out-and-back by a DIFFERENT route may not return the object. ⚠ Retracing the SAME path does close, which is why a tuning session would never show it. ⭐ **Write the square-path vector FIRST and confirm it FAILS against today's code**; the answer is a curve against drag angle, not a yes/no. ⛔ Must not undo the world-frame axis composition → [`queue_notes/IN11.md`](queue_notes/IN11.md) | IN1 |
| IN12 | ⭐ **A DEADBAND on the pointer delta** | IN | defect | ✅✅ **CLOSED 2026-09-15 BY `A11`, AND NOT THE WAY THIS ROW SPECIFIED IT** — the owner made §1.1 *itself* a position deadband. ⭐⭐ **A threshold has a SHAPE as well as a size**: the per-axis band buys **axis purity**, which no radius can give. ⛔ Still owed: a device pass — `motionDeadbandMm` is the commit threshold, the rest test and the jitter deadband at once → [`queue_notes/IN12.md`](queue_notes/IN12.md) | IN1, IN4 |
| IN13 | ⭐⭐ **WHICH TOUCHPOINT ASSIGNMENT SHIPS** | IN | decision | ✅✅ **ANSWERED AND CLOSED 2026-09-16 (`D28`)** — the tap toggle, after a hand drove three readings from one build over three versions. ⛔ Forks A and B are **deleted**, along with the flag, its latch, the slider and 44 vectors; `A14` and `A12` are retired **by construction**. ⭐ The comparison cost one boolean instead of two branches, which is what `D26` bought → [`queue_notes/IN13.md`](queue_notes/IN13.md) | IN4, IN8 |

## Phase 3D — objects and assembly

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| 3D0 | Mate connectors + residual; constraint stack + solver | 3D | feature | ✅ **built 2026-09-13**, carried and covered | — |
| 3D1 | The object model: id, placement, connectors, assembly tree (parent ≠ root) | 3D | feature | ✅✅ **CLOSED 2026-09-15** — *"locked/jumping fix is working"*. `core/object_model.ts`, engine-free. ⭐⭐ Its vectors were written FIRST and **falsified on purpose** — breaking the composition turns 14 of 42 red → [`queue_notes/3D1.md`](queue_notes/3D1.md) | 3D0 |
| 3D2 | Snap transform + capture radius + seat | 3D | feature | ✅ **SNAP, SEAT, UNSNAP BUILT 2026-09-26** (`D100`, §11.13), ⛔ unjudged by a hand. ⚠ Owed: the approach and the mate connector → [`queue_notes/3D2.md`](queue_notes/3D2.md) | 3D1 |
| 3D3 | Break on residual, and re-arm on exit | 3D | feature | ⭐⭐ **THE BREAK GESTURE IS SPECIFIED** (`D47`): two fingers, one on each mated object, pulling **apart along the centre→centre direction** past a `BreakThreshold` (slider). ⭐ `3D2`'s **seat** now exists (`D100`), so a mate holds POSITION and a break is no longer *moving*; ⛔ the break itself is not built → [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md) §8 | 3D2 |
| 3D4 | Real 3D file import (glTF) | 3D | feature | queued → `30_OBJECTS_3D/spec/MATERIALS_AND_IMPORT.md` | 3D1 |
| 3D5 | ⚠ The tree has never held more than two objects | 3D | risk | carried, unclosed | 3D1 |
| 3D6 | ⛔⛔⛔ **COLLISION — no penetration** (build #1): stop+slide on translation, same-axis clamp on rotation, snapping/seated rules, broad phase | 3D | feature | ✅ **BUILT 2026-09-27**; defect 72 fixed; ⭐ `D136`: contact allowed, only penetration refused (the slots of `Scene_1` were unreachable); ⛔ unjudged; feedback beyond the HUD is `GM9` → `COLLISION.md` §8–§9 | 3D1 |
| 3D7 | **Play volume** — translation clamped to the level's volume (build #3) | 3D | feature | ✅✅ **BUILT, JUDGED** (`D181`) → `COLLISION.md` §10 | 3D6 |
| 3D8 | LATER: Blender collision shapes (`UCX_`) | 3D | feature | specified → `BLENDER_COLLISION_AUTHORING.md` | 3D6, 3D4 |
| 3D9 | LATER: Blender bounding boxes (`UBX_`) | 3D | feature | specified → same file | 3D6, 3D4 |

## Phase RND — scene and rendering

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| RND0 | Scene stub: camera, **three boxes**, face picking | RND | feature | ✅ built 2026-09-13 — diagnostic only. ⚠ **Three, not two** (`objectA`/`B`/`C`), and the third is deliberately **off-axis and off-plane**: three collinear objects put every barycentre on one line where the ray cannot tell them apart, so §2 rule 1 would look tested while exercising nothing. `2³ − 3 − 1 = 4` candidates | — |
| RND1 | Constraint visibility: per-entry glyphs, hard vs soft (§6) | RND | render | queued | 3D1 |
| RND2 | Mate preview: ghost + drop line | RND | render | queued | 3D2 |
| RND3 | Anchor ring during two-touchpoint gestures (§4) | RND | render | queued | IN2 |
| RND4 | Off-screen target indication — Halo / Wedge | RND | render | queued. ⭐ Not general polish: **6ter needs BOTH objects selected**, and at close zoom the partner is routinely off-frame, so the gesture becomes unreachable with nothing to say why. Curvature (Halo) or a tapered wedge encodes direction AND distance without a camera snap. ⚠ Audience includes youth — cap the indicator count. Prior art: Baudisch & Rosenholtz CHI 2003; Gustafson et al. CHI 2008 | 3D1, IN4 |

## Phase DEP — build and deployment

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| DEP0 | Vite + TS + vitest, `npm run verify` | DEP | infra | ✅ built 2026-09-13 | — |
| DEP1a | ⭐⭐ **Device loop over USB (Android)** — `adb reverse`. No network exposure AND `localhost` is a SECURE CONTEXT, so tilt + sensors work | DEP | infra | ✅✅ **WORKING 2026-09-13** on the Lenovo TB-X606F — two cubes confirmed on the device. ⭐ `adb reverse`, NOT Chrome port forwarding; the fix for the stuck handshake was the REAL `adb`. Procedure + 3 traps: `50_BUILD_DEPLOY/DEVICE_TESTING_USB.md` | DEP0 |
| DEP1b | Device loop over LAN — for iOS, or a second device. ⚠ needs a Private network + a scoped firewall rule (`scripts/allow-lan-dev.ps1`) | DEP | infra | queued | DEP0 |
| DEP1c | ⭐ **HTTPS on the LAN** (`@vitejs/plugin-basic-ssl`) — the only way to get a secure context on iOS over Wi-Fi | DEP | infra | queued — needed before rule 1 (tilt) can be tested on iPhone | DEP1b |
| DEP1d | GitHub Pages via Actions — real HTTPS anywhere, ⚠ slow loop | DEP | infra | ✅ **LIVE 2026-09-13** — https://dsug1.github.io/3d_assembly_game/ . ⛔⛔ **AND IT SERVED A STALE BUILD FOR A MORNING (2026-09-16)** — a cached `index.html` loads a superseded content-hashed bundle indefinitely. ✅✅ **FIXED AND CLOSED BY A DEVICE LOOK**: `core/build_gate.ts` checks `version.json` on boot → [`queue_notes/DEP1d.md`](queue_notes/DEP1d.md) | DEP0 |
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
| SEC4 | ⭐ **Freedom-to-operate review of the GESTURE SET** | SEC | governance | open — before any commercial release (`D3`). ⭐ Its input exists: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md) tags every rule, so a review reads a table instead of a codebase. ⛔ **Three rules are marked NOVEL COMPOSITE** — §4's 6bis, 6ter and 6quater. ⚠ The camera mathematics does **not** need this review; the catalog is explicit that the litigated territory is multi-finger gesture composition | — |

## Phase GAME — the game proper

⭐ The score, specified 2026-09-26 (`D99`–`D101`); the dossier for every row below is
[`../20_GAME_RULES/spec/SCORE.md`](../20_GAME_RULES/spec/SCORE.md) §6.

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| GM1 | Final-configuration data per scene + the MATE check (spin) + its detector + level end (build #2) | GAME | feature | ✅ **BUILT** (`D180`); the DATA and the DETECTOR — `Scene_1`'s goal is its table (`D129`), met relative to each other, a box's face or its opposite (`D130`, HUD); a seated piece in place dissolves its couple, with a pop-up (`D142`), and the MATE sets its spin onto the goal then (`D143`, the whole mate); ✅ **the level end** (`D180`: at rest, clock and count frozen, a results card) → `LEVEL_END.md`, `PLAYABILITY` §2, §2.1. ✅✅ Closed by a device look, 2026-09-30 | 3D6 |
| GM2 | The touch ledger on the HUD | GAME | feature | ✅ built (`D112`, `D115`) ⭐ `D158`: a gesture that changes nothing costs 0 | — |
| GM3 | The timer: first press → detection | GAME | feature | queued | GM1 |
| GM4 | The solver: the absolute least episodes, engine-free, vectored (pictured scene = 6) | GAME | feature | queued | GM1 |
| GM5 | The score: episodes vs optimum + bonus, time; Free Flow voids it | GAME | feature | queued | GM1–GM4 |
| GM6 | Populate the screens: art, settings, result, back from PLAY | GAME | content | scaffold `D105`; 🔧 **back from PLAY built** (`D144`: ⏸ pause menu, by reload; one scene list); ✅✅ **the result screen and a UI theme** (`D180`, judged on the device); the later list is §5 → `20_GAME_RULES/spec/GAME_STRUCTURE.md` §4–§6 | — |
| GM7 | Populate worlds and levels; a theme | GAME | content | `World_0` exists | GM1 |
| GM8 | Save/load a scene as local JSON (Free Flow) | GAME | feature | queued | GM1 |
| GM9 | The player layer: player HUD, cues, hints, sound, haptics, save-in-progress (build #5) | GAME | feature | queued | GM1 |
