# INPUT SYSTEM — revision 5 (the owner's specification)

> **STATUS** · ⭐ live — the DESIGN OF RECORD for the touch input system, **and the
> inventory of what of it is built**
> **OWNS** · every gesture rule, the terms the rest of the project uses for them, and the
> build status of each
> **READ IF** · you are building or changing anything a finger touches
> **SOURCED FROM** · the owner's `input-system-v5.md`, supplied 2026-09-13
> **LAST VERIFIED** · 2026-09-15, against 480 passing vectors

⛔⛔ **THE OWNER'S REVISION-5 TEXT IS REPRODUCED IN FULL AND UNALTERED**, apart from
repairing mojibake from the original file's encoding (`â` → `—`, `Â§` → `§`). Not one of
its sentences has been rewritten, reordered or removed.

⚠ **What HAS been added, on the owner's authorisation of 2026-09-14**, is build status:
**BUILD STATUS** below, an inventory by touchpoint configuration, and **ADDED AFTER
REVISION 5** at the end, the behaviours that exist with no clause in this document behind
them. ⭐ Three further sections were added 2026-09-15 on the owner's instruction —
**ADOPTED FROM THE TECHNIQUE CATALOG**, which records what of §4.1 snap-dragging applies
here; **PROVENANCE**, pointing at the per-rule prior-art register; and the **AMENDMENTS**
table below, pointing at [`../AMENDMENTS_R5.md`](../AMENDMENTS_R5.md).
⛔ **All of them sit OUTSIDE the specification text and are headed as such**, so the owner's
words and the build's claims never blur. ⚠ **Read the amendments first** — where they
conflict with the text below, they win, and the superseded clause is left standing because
it explains why the current one exists.
⛔ This file previously carried `VERBATIM` markers forbidding any edit; they were removed
under that same authorisation, and the paragraph above replaces the guarantee they gave.

⚠ Section numbers (`§1.3`, `§6quater`, …) are referenced throughout the code and the
queue. They are stable; do not renumber.

---

# BUILD STATUS — what of this specification exists *(added 2026-09-14, not the owner's text)*

## The configurations a hand can actually make

⭐ **Roles are latched at PRESS** (§4, `src/input/router.ts`), so this table is written
against what each touchpoint was latched as, not where it is now. ⛔ One exception since
`A15`: a holder whose object is no longer **under** it gives the selection up at the next
input event.

⛔⛔⛔ **“FORK” MEANS THE ANCHOR-RULE FORK IN THIS FILE, AND NOTHING ELSE — read this before
the tables.** The word has labelled two different flags on this project, six days apart, and
confusing them would have a session test one thing believing it tested another:

| | the flag | A / B / C | status |
|---|---|---|---|
| ⛔ **GONE** | `touchpointAssignment` (`D26`, `1.0.5`–`1.0.7`) | which touchpoint translates, which rotates | **deleted** by `D28` — one input model, the tap toggle |
| ✅ **LIVE** | `anchorRules` (`D29`) | **A** = no constraints at all (the default) · **B** = `IN3`, flick-to-align · **C** = the owner's **tap-to-align** (`D37`) | A closed by a hand; B parked by the owner; C stage-1 built, no device look |

⭐ Where the text below says *fork* without qualification it means `anchorRules`. Sentences
about the deleted assignment flag are marked **(assignment fork, deleted)**.

⛔⛔ **ONE MODEL SINCE `D28` (2026-09-16).** From `1.0.5` to `1.0.7` a flag carried three
readings of §2/§4 so a hand could compare them; the owner chose the **tap toggle** and the
other two assignment readings are deleted. ⭐ A held object's drag translates *or* rotates, **any single tap
anywhere** flips between the two, and the mode is one latch for the session — it survives a
release. ⚠ The comparison's record is in
[`../../00_CORE/queue_notes/IN13.md`](../../00_CORE/queue_notes/IN13.md).

### ⛔ What the MODE decides

⚠ The mode starts at `TRANSLATE` and flips on **every** tap of any touchpoint, anywhere,
immediately — including with nothing carried, since it is what the next grab inherits.
⛔ **In fork C the session starts in `ROTATE`** (`D37`, the owner's *"default start: rotation
mode"*) — and **fork C is the default fork** since `D38`, so that is the shipped start.
⛔⛔ **SUPERSEDED BY `D71` (2026-09-22)**: the shipped start is `TRANSLATE` again — *"Set the
default to translation mode at scene boot."* ⚠ The sentence above is kept as the record.
⭐ Note that the line before it — *"the mode starts at `TRANSLATE`"* — is true once more. ⚠ A tap
on **another object's face while one is held** aligns and is **consumed**: the mode does NOT
change (`D38` retired that clause). Everywhere else the tap keeps exactly this meaning.

| touchpoints | on what, and what moves | what happens | spec |
|---|---|---|---|
| 1 | an object, **moving** | **translate** (x horizontal, y **gravity**) or **rotate** (yaw about the world vertical, pitch about horizontal x) — per the mode | §4 rule 6 / §2 rule 2bis · `A7`, `A16`, `A17` |
| 2 | an object **moving** + a second one down | ✅ **BOTH RUN (`D43`)**: the holder's drag AND the second finger's axis, summed. ⚠ It was *"unchanged by the second finger being there"* until 2026-09-17 | `A16`, `A17` |
| 2 | an object held + a second moving in **x** | **ROLL** about the flattened view direction — ⛔ only while the mode is `ROTATE`. ✅ **The holder need not be still (`D43`)**: its own drag runs at the same time and the two sum | §2 2quinte · `A12`, `A16` |
| 2 | an object held + a second moving in **y** | **DEPTH** along the flattened view direction, height unchanged — ⛔ only while the mode is `TRANSLATE`. ✅ **Simultaneous with the holder's own translation** (`D43`) | `A10` · `A16` |
| 2 | an object held + a second moving **diagonally** | ⛔ **exactly one axis** — the mode decides, and switching needs a tap. ⚠ `A12`'s both-at-once is unreachable since `A17` | `A12` · `A16` |
| any | a **TAP**, anywhere — empty space, the carried object, or a second finger | ⭐⭐ **flips the mode**, immediately | `A16` |
| any | a **DOUBLE tap**, anywhere | ⭐ flips **twice** (a net nothing) **and** flies the camera home — accepted, in the owner's words | `A16` |

### ✅ Configurations the mode does not touch

| touchpoints | on what | what happens | spec | status |
|---|---|---|---|---|
| 1 | an object | select, and the §1.3 state machine: commit point, provisional motion, tap / double-tap / hold, flick test, release-time priority | §1.3, §2 rule 2 | ✅ `IN1` · ⛔ its **ROLLBACK is retired** (`D36`) — a flick keeps the rotation it was made with, except where fork C's own reset applies |
| 1 | an object | double-tap → **fly the camera home** over `cameraResetMs` | ⛔ **no clause** | ✅ ⭐ collision resolved 2026-09-15 — eviction moved to a quick back-and-forth (`A1`→`A4`) |
| 1 | empty space | **orbit the camera** about the barycentre nearest the finger's ray | §2 rule 1 | ✅ `IN9` · ⚠ amended: delta position, NOT device tilt |
| 1 | empty space | double-tap → **fly the camera home** | ⛔ **no clause** | ✅ — ⚠ it flips the mode twice on the way (a net nothing), the owner's accepted trade |
| 2 | both empty space | **pinch zoom** | §4 rule 4 | ✅ `IN9` |
| 2 | both the SAME object | rule 6 is reachable — the FIRST touchpoint (whose raycast hit) drives; the second is presence only | `A10` supersedes `A6`/`A5`/`D10` | ✅ ⭐⭐ the small-object hole is CLOSED: the depth anchor may be anywhere |
| 2 | two DIFFERENT objects | select both objects and both faces | §4 rule 5 | ⛔ needs `IN3`'s face selection · ✅ `3D1` is built |
| 2 | a second touchpoint **released**, holder no longer under its object | ⭐ the selection is dropped at the **next input event** and the configuration re-resolves | `A15` | ✅✅ closed 2026-09-16 — ⚠ by a general *"everything is working ok"* |
| 3+ | any | the third touchpoint and beyond are **ignored**; the rest keep their latched roles | — · `A5` moved this trigger | ⚠ by construction, not measured — palm contact untested |

### ⭐⭐⭐ FORK C (`?anchorRules=2`) — the owner's TAP-TO-ALIGN set (`D37`)

⭐ Rules, conflict check and the open questions: [`ALIGNMENT_RULES.md`](ALIGNMENT_RULES.md).
⛔ **Everything not listed here behaves as fork A**, which is what *"fork C branches from
fork A"* means. ⛔ **NO HAND HAS TOUCHED ANY OF IT** — rule 5 is unpaid for this whole column.

| touchpoints | configuration | what happens | status |
|---|---|---|---|
| 1 | an object, no alignment | rotate or translate per the mode — fork A's rules, ⚠ starting in `ROTATE`, and **fork C is the DEFAULT fork** since 2026-09-16 | ✅ built (inherited) |
| 1 | an object, **ALIGNED**, mode `ROTATE` | ⭐⭐ **TWIST about the aligned normal** — the one surviving DOF (`anchor_rotate.ts`, reused from `A3`). ⛔ REFUSES where that normal points at the camera | ✅ built |
| 1 | an object, **ALIGNED**, mode `TRANSLATE` | fork A's screen-plane drag — ⚠ assumed, not dictated | ✅ built |
| 1 | an object, **FLICK** | ⭐⭐ **ROTATION RESET** to the press orientation. The alignment is **conserved** if it predates the press, **dropped** if it was made during the gesture | ✅ built (`D37`; `D36` deleted this globally, fork C alone reinstates it) |
| 1 | an object, **SHAKE** (a quick back-and-forth) | releases the alignment and both highlights — ⛔ in **either** mode, unlike `D32`'s fork B rule, and **at any moment in a gesture** (defect 45) | ✅ built · ⚠ the owner may drop it once the re-tap is judged |
| 2 | holding an aligned obj 1 + **TAP the SAME PioneerFace again** | ⭐⭐ **UNALIGN** — the alignment and both highlights go. A toggle, not a second command to remember | ✅ built (`ROTATE` only) |
| 2 | holding obj 1 + **TAP on another object's face** | ⭐⭐⭐ **ALIGN**: obj 1 makes the **minimal** turn so its held face's normal is **PARALLEL** to the tapped face's (the CAD *align* sense, the owner's choice over a mate); the FollowerFace is **filled** and the PioneerFace gets a **contour**, both until the alignment breaks; ⛔ **the mode does NOT change** — the tap is CONSUMED, which overrides `D28` for this one gesture | ✅ built |
| 2 | holding obj 1 + a tap on the SAME object, or on empty space | plain mode toggle, exactly as `D28` | ✅ built |
| 2 | holding obj 1 + a tap while **two or more** other objects are held | ⛔ refuses and toggles — *which* object is the Follower has no trustworthy answer | ✅ built, reported on the HUD |
| 2 | two holders, obj 1 **NOT** aligned | each finger moves its own object, per the mode (owner's answer) | ✅ built (inherited) |
| 2 | holding an **ALIGNED** obj 1 + **press** on obj 2 | `TargetPosition` at the raycast hit + a **cross-quad gizmo** oriented to that face | ⛔ **NOT BUILT** |
| 2 | … then mode `ROTATE` | obj 1 **orbits** about `TargetPosition` (gravity axis + horizontal x) while maintaining its alignment | ⛔ **NOT BUILT** — ⚠ position-only orbit is my reading, §7.9 |
| 2 | … then mode `TRANSLATE` | obj 1 approaches/retreats along centre→target by its own delta's projection; obj 2 likewise, reversed | ⛔ **NOT BUILT** — ⛔⛔ the mapping **degenerates at contact** and when the line faces the camera, §7.10 |
| 2 | the second touchpoint **releases** while a target is live | the gizmo and `TargetPosition` are nullified | ⛔ **NOT BUILT** — ⚠ the same event fires `A15`'s orphan raycast, §7.7 |
| 2 | a second touchpoint **outside any object** while obj 1 is aligned | ⚠⚠ **UNDEFINED** — fork A's roll/depth, or nothing? §7.6 | ⛔ undecided |
| any | a **DOUBLE tap** | unchanged: flips the mode twice and flies the camera home | ✅ |

⚠ **(assignment fork, deleted)** Readings A and B reached their mode by PRESENCE, re-read
every frame — not by a latched mode, and not by the second finger's `STATIONARY` state as
rule 6's wording implies. That was an owner correction of a build that latched it, recorded
twice: [`../../00_CORE/queue_notes/IN4.md`](../../00_CORE/queue_notes/IN4.md).
⛔⛔ **Reading C reached it by a discrete TAP instead** — which is what `D28` kept, and why
the HUD prints the mode: no finger position reveals it.


## ⚠ What "rule 2bis is applied unconditionally" means

⭐ **The free rotation WORKS, and is not a placeholder.** The gesture, the world-frame axes
latched at press, the gain in radians per millimetre chosen on the device, the provisional
motion and its rollback are all real and carry vectors (`src/input/screen_rotate.ts`).

⛔ **What is missing is its PRECONDITION.** Rule 2bis reads *"one selected object with an
empty constraint stack"* — and §1.4's constraint stack does not exist yet, because there
is no object model (`3D1`). So the rule cannot ask whether the stack is empty, and
proceeds as though it always were. ⚠ The day constraints exist, an anchored object would
still rotate freely and silently break its own anchor unless `IN3` adds that test.

⚠ It also drives a Babylon **mesh** directly rather than a modelled object's placement, so
`IN3` rewires it. ⛔ **`IN3` does not delete the rotation maths** — that stays; it attaches
it to the object model and gives it the precondition it is missing.

## Rules specified and NOT built

| rule | what it is | blocked on |
|---|---|---|
| §2 **2ter** | vertical flick → `GRAVITY_ALIGN` onto the constraint stack | `3D1` (faces), `IN3` |
| §2 **2quater** | horizontal flick → `WORLD_AXIS_ALIGN` | `3D1`, `IN3` |
| §2 **2sexte** | constrained rotation about the remaining free DOF | `3D1`, `IN3` · ✅ **BUILT 2026-09-16** in forks B and C |
| ⛔ **fork C's approach** | `TargetPosition`, the cross-quad gizmo, the orbit about it, and the two-object approach along centre→target | ⚠ **not in revision 5 at all** — the owner's own rules, [`ALIGNMENT_RULES.md`](ALIGNMENT_RULES.md) §2. Four owner decisions gate them (§7.6–§7.10) |
| §2 **2septies** | ⭐ **SUPERSEDED by amendment A1** — eviction is a full **360° roll**, not a double-tap | `IN3` · ✅ the camera-reset collision is resolved; ⛔ A1 also amends **2quinte**, shares a context with **2sexte**, and leaves ONE open owner question: does a full turn break MATES too? |
| §3 **3** | release unselects object and face, stack preserved | `3D1` |
| §4 **5** | two objects and two faces selected | `3D1` |
| §4 **6bis** | translate along `AxisBtwFaces` / its orthogonal | `3D1` (face centres) |
| §4 **6ter** | both objects translate toward each other | `3D1` |
| §4 **6quater** | mate flick | `3D1` |
| §5 | landmark registration, contact / capture / seat, longest-axis alignment | deferred by the spec itself |
| §6 | haptics | `IN7` · ⛔ iOS Safari has no Vibration API at all |

⚠ **Every threshold is in `src/input/gestureConfig.ts`, in millimetres on the physical
screen**, and all are placeholders except the six orbit ring values, the four gains, rule
6's four feel numbers and the two sway sets — all chosen by finger — plus `pointerNoiseMm`
= **0.761 mm**, the one number actually MEASURED. ⭐ Any of them can be overridden from the
URL (`?motionDeadbandMm=3.5`) or moved on the on-screen menu, without a rebuild.

---

# ⭐⭐ AMENDMENTS — READ BEFORE THE TEXT BELOW

⛔ **The owner's later decisions SUPERSEDE clauses of revision 5**, and they live in
[`../AMENDMENTS_R5.md`](../AMENDMENTS_R5.md) — moved out of this file on 2026-09-15 when it
reached its 800-line cap. `METHOD`: *when two sections conflict, the later one wins.*

| | supersedes | in force |
|---|---|---|
| **A1** | ✅✅ **WIRED 2026-09-16** (`D32`) — §1.4 / 2septies' double-tap eviction | the double-tap evicts nothing; it is purely the camera fly. ⚠ Its 360° roll trigger is itself superseded by **A4** |
| **A4** | A1's trigger | eviction is a **quick back-and-forth**, one touchpoint, ≥2 reversals in a window. ⛔ The flick test is skipped once one reversal is seen, or an abandoned shake ADDS a constraint |
| **A1 §4** (`D13`) | §1.4's *"clears its constraint stack"*, for mates | eviction **spares `MATE` entries** — one gesture, one intention |
| **A2** | §0's *"two objects"* | the scene holds **three** |
| **A5** | `D10`, and §5's *"two touchpoints on the same object — undefined and reachable"* | two fingers on ONE object are a **depth pinch**, and ⛔ *depth is HORIZONTAL* — the view axis flattened onto the ground plane, so **the object's height never changes**. The gain is **computed**, and `IN2`'s `IGNORED` role moves to the THIRD touchpoint |
| **A6** | ⚠ **ITS TRIGGER SUPERSEDED BY A10** — it superseded A5's | depth is a **COMMON VERTICAL DRAG** — one finger on the object, one ANYWHERE, both travelling in y together. ⛔ It shares rule 6's configuration: **common mode is depth, differential mode is rule 6** |
| **A7** | 2bis, 2quinte and rule 6's *"screen view plane"* | every object gesture stands on a **GRAVITY FRAME** — yaw about the vertical, pitch about the horizontal screen-x, roll and depth about the flattened view direction. ⛔ The argument is **orthogonality**: about the camera's axes, roll stops being independent of yaw as the camera tilts |
| **A8** | ⛔⛔ **RETIRED BY A12, THEN DELETED BY `D31`** — it amended §1.3's provisional motion | a roll **REBASES** to the start of its circle: the yaw/pitch applied before 60° of arc is undone. ⛔ To the FIT WINDOW's start, **not to the press** — a straight drag that precedes a circle was asked for and survives. ⚠ The object jumps at the commit, by exactly the unasked-for rotation it replaces |
| **A9** | ✅ **ABSORBED INTO A11**, which put the deadband in §1.1 itself | a **DEADBAND** on `dx`/`dy`, **per axis**, with a slider. ⛔⛔ A *hard* deadband is a jump traded for a jump; the **residual-accumulator** form is the one to build, and the vector asserts CONTINUITY. ⚠ Not applied to roll (1€-filtered) or to A6's driver (its own hold window) — a decision, not an oversight. Row `IN12` |
| **A10** | A6's trigger, and §1.1's speed estimate — ⛔ **and `D43` (2026-09-17) then deleted its GATE: both fingers integrate simultaneously** | depth is **a STILL HOLDER and a MOVING ANCHOR**: no window, no ratio, no tolerance. ⛔ The holder wins every tie, so rule 6 and depth PARTITION the two-finger configuration. ⭐ Rule 6's second touchpoint may be outside **or on the same object**. ⛔⛔ It exposed §1.1 estimating speed over ONE SAMPLE PAIR — ~95 mm/s at rest against a 6 mm/s threshold — so **STATIONARY was unreachable**; fixed to a windowed estimate, with four §1.1 numbers re-sized — all since replaced by `A11`'s deadband and **closed by a device look 2026-09-16** |
| **A12** | 2quinte's circular roll, and **A8** entirely — ⛔ and `D31` then **deleted** both | roll moves to the **SECOND touchpoint's x** while the holder is still; its y stays depth. ⛔ Retires the circle fit, `rollAngle`'s commit threshold, the provisional yaw/pitch, A8's rebase and **the jump** — yaw/pitch and roll are no longer the same hand shape, so nothing has to tell them apart |
| **A13** | 2bis's and rule 6's touchpoint assignments — it SWAPS them | **one touchpoint TRANSLATES**; a second one held **STILL** turns the same drag into a **ROTATION**. ⭐ Whichever finger moves acts; the other one's state picks the rule. ⚠ Both moving = translate |
| **A11** | ⛔⛔ **§1.1 ENTIRELY** — its motion states, and every threshold they name | `STATIONARY`/`MOVING` is a **PER-AXIS POSITION DEADBAND**: an anchor trails each axis by one band; inside it the axis is still and emits **nothing**, crossing it emits the **excess only**, and once moving travel passes through undiminished. ⛔ `stillSpeed`, `stillTime`, `moveEnterDistance` and `moveExitDistance` are **deleted**; one `motionDeadbandMm` replaces all four, plus `restConfirmMs` to confirm the way back to rest. ⭐ It also **absorbs A9** — the deadband is applied once, at the source, so no rule consumes a raw delta. ⚠ **§1.1's text below is superseded in full** |
| **A14** | A13's *"second absent → translate"* | a **lift-and-replace** of the second touchpoint is **ONE gesture**: it stays HELD for `secondTouchGraceMs` after it lifts. ⛔ Without it the interval between the lift and the press has one touchpoint down, so A13 translated through the middle of a swap. ⚠ THE COST: returning to one-touchpoint translation is delayed by the grace |
| **A3** | ✅✅ **WIRED 2026-09-16** (`D34`) — 2quinte's *"on a constrained object the circular gesture is ignored"* **and** 2sexte's undefined behaviour when its axis projects to a point | ⛔ roll **DRIVES the free DOF** of an anchored object, about the CONSTRAINT axis; **2sexte suppresses** where it is degenerate. **ONE handover constant with hysteresis**, latched at press |

---

# THE SPECIFICATION — the owner's text, unaltered

⚠⚠ **MUCH OF THE TEXT BELOW IS SUPERSEDED** — see the amendment table above, and read it
first. The largest are:

* ⛔⛔ **§1.1 ENTIRELY** (`A11`): the motion states are a **per-axis position deadband**, and
  `stillSpeed`, `stillTime`, `moveEnterDistance` and `moveExitDistance` **no longer exist**.
  ⭐ One `motionDeadbandMm` replaces all four. The state table and Config line in §1.1 below
  describe a formulation that broke on a real pointer three times — `queue_notes/IN0.md`.
* ⛔⛔ **2quinte's circular roll** (`A12`, then DELETED 2026-09-16): roll is the SECOND
  touchpoint's `x` while the finger on the object is still. The circle fit, `rollAngle`, the
  60° commit, the 1€ smoother, `A8`'s rebase and §1.3's *"once roll is committed the flick
  test is skipped"* **no longer exist in the build**. ⛔ The skip's removal is why §1.3's
  purity ratio is now the only thing standing between a curved rotation drag and an
  alignment — see defect 40 in `queue_notes/IN3.md`.
* ⛔⛔ **§1.3's PROVISIONAL-MOTION ROLLBACK** (`D36`, owner 2026-09-16): a flick no longer
  restores the press pose. The snapshot is still taken, for §6's undo.
* ⛔ **2bis's and rule 6's touchpoint assignments are SWAPPED** (`A13`): one touchpoint
  TRANSLATES, and a second one held DOWN turns the same drag into a rotation.
* §1.4 / 2septies' double-tap eviction (eviction is now a quick **back-and-forth**),
  §1.4's *"clears its constraint stack"* where a `MATE` is concerned (eviction spares mates),
  2quinte's ban on roll for a constrained object (roll DRIVES its free DOF, and 2sexte
  suppresses where it degenerates), and §0's "two objects" (the scene has three).

⭐ **Nothing below is edited.** `METHOD`: *when two sections conflict, the later one wins*,
and a superseded clause explains why the current one exists.

# Input System — Revision 5

Revision of the last proposed input system, integrating the fixes raised in review.
The rule numbering, ordering and wording of revision 4 are preserved wherever possible.
Changes are marked `[CHANGED]`, `[NEW]` or `[CLARIFIED]`; everything unmarked is unchanged.

All tunables live in `gestureConfig.js` as plain data (no engine types), consistent with the
existing engine-agnostic boundary.

---

## 0. Scene and tracking

The scene assumes there are two objects. In the future, there can be more.

For all the cases when raycast hits an object, the objects and touchpoints shall be tracked so
that when a touchpoint is released, the other touchpoint keeps tracking the other object
independently of the order in which the touchpoints were being pressed.

The selected objects, selected faces, and the **constraint stack** of each object shall all be
tracked. `[CHANGED — replaces "faces aligned with x or gravity axis and orientations of the
faces alignment"; see §2]`

Deadbands to be config fields for all delta positions. `[CLARIFIED — see §1.1: deadbands are
expressed in millimetres and are hysteretic]`

All delta position values shall be subject to different gains for each of the enumerated cases
below and those respective gains shall be config fields. `[CLARIFIED — translation gains are
additionally scaled by camera distance; see §1.2]`

### Start

For both objects: constraint stack is empty. `[CHANGED — replaces the three booleans and the
null face/orientation fields]`

---

## 1. Foundations

These four sections are new infrastructure. They do not add gestures; they define the terms the
gesture rules below rely on.

### 1.1 Units and deadbands `[NEW]`

All spatial thresholds are expressed in **millimetres on the physical screen**, converted to
pixels at runtime from device DPI. No threshold is authored in pixels: a pixel threshold behaves
differently on a phone and a tablet, and the whole gesture set is threshold-driven.

A touchpoint is in one of two motion states, with **hysteresis** — a resting finger jitters, so
`delta position == 0` is never evaluated literally:

| State | Entered when |
|---|---|
| `STATIONARY` | speed stays below `stillSpeed` for at least `stillTime` |
| `MOVING` | accumulated travel since the last `STATIONARY` frame exceeds `moveEnterDistance` |

`moveEnterDistance > moveExitDistance` is required. Every occurrence of "delta position" in the
rules below means `MOVING`; every occurrence of "no delta position" / "delta position ==
vector2.zero" means `STATIONARY`. `[CHANGED — applies to rules 6, 6bis, 6ter, 6quater]`

Config: `stillSpeed`, `stillTime`, `moveEnterDistance`, `moveExitDistance`.

> ⛔⛔ **SUPERSEDED IN FULL BY `A11`.** None of those four config fields exists any more, and
> the state table above describes a formulation that broke on a real pointer three separate
> ways. ⭐ What ships is a **per-axis position deadband** with one `motionDeadbandMm`. See the
> amendment table, and [`../../00_CORE/queue_notes/IN0.md`](../../00_CORE/queue_notes/IN0.md)
> for all four formulations and how each one failed.

### 1.2 Gains `[CLARIFIED]`

Each rule carries its own gain, as specified. In addition, all **translation** gains are scaled
by `cameraDistance / referenceCameraDistance`, so that one millimetre of finger travel maps to a
constant world displacement regardless of zoom. Rotation gains are not distance-scaled.

Config: `referenceCameraDistance`, plus one gain per rule (`gainRotateFree`,
`gainRotateConstrained`, `gainRoll`, `gainTranslateScreen`, `gainTranslateAxis`,
`gainTranslateDepth`, `gainTranslateMutual`).

### 1.3 Gesture recognizer `[NEW — this is the central change]`

Rules 2bis / 2ter / 2quater / 2quinte / 6bis / 6quater are no longer independent per-frame
predicates. They are outcomes of **one recognizer per touchpoint**, with an explicit state
machine and a single commit point. This is what makes the drag rules and the flick rules
separable — previously every drag ended in a release, so every drag could satisfy a flick rule.

**Motion buffer.** Each touchpoint keeps a ring buffer of `(position, timestamp)` over the last
`flickWindow` ms.

**States.**

```
PRESSED  -> (travel > moveEnterDistance) -> COMMITTED_CONTINUOUS -> RELEASED
PRESSED  -> (release before moveEnterDistance) -> TAP
```

**Provisional motion and rollback.** On `PRESSED`, the object's pose is snapshotted. While
`COMMITTED_CONTINUOUS`, the continuous rule (2bis / 2sexte / 2quinte / 6 / 6bis / 6ter) is
applied live and **provisionally**. At release, the flick test runs. If it passes, the pose is
restored to the snapshot and the discrete rule (2ter / 2quater / 6quater) is applied instead.
If it fails, the provisional motion is kept and becomes final.

This preserves the original intent — a drag rotates, a flick snaps — without the two competing.

**Flick test** (evaluated at release, over the motion buffer):

1. terminal speed at lift `>= flickLiftSpeed` — a drag that decelerates to a stop and lifts is
   never a flick;
2. travel within `flickWindow` `>= flickDistance`;
3. direction purity `max(|dx|,|dy|) / (min(|dx|,|dy|) + epsilon) >= flickPurity` — a single
   ratio, replacing the two independent thresholds of the form
   `vector2(threshold close to 0, |y| > |ythreshold|)`, which left a large undefined wedge
   between them.

**Roll detection** (2quinte) runs inside `COMMITTED_CONTINUOUS`: signed angle accumulated about
the running centroid of the path. Commit to roll when `|accumulated angle| >= rollAngle` while
the path radius stays within `[rollRadiusMin, rollRadiusMax]`. Once roll is committed, the flick
test is skipped for that touchpoint (a circular path fails the purity test anyway, but the
explicit skip removes the edge case).

**Release-time priority.** Exactly one discrete rule may fire:

```
6quater  (mate flick, two-object context)
  > 2ter / 2quater  (axis flick, single-object context)
  > none  (keep provisional continuous motion)
```

Config: `flickWindow`, `flickLiftSpeed`, `flickDistance`, `flickPurity`, `rollAngle`,
`rollRadiusMin`, `rollRadiusMax`.

### 1.4 Constraint stack `[NEW — replaces the three booleans]`

Each object carries an **ordered list** of constraints, oldest first. This replaces
`faceAlignedWithGravity`, `faceAlignedWithXAxis`, `faceAlignedWithOtherObject` and the
associated face/orientation tracking, and it replaces the hand-written case branches inside
2ter, 2quater and 6quater.

**Constraint types.**

| Type | Stored data |
|---|---|
| `GRAVITY_ALIGN` | selected face, sign (`+g` / `-g`) |
| `WORLD_AXIS_ALIGN` | selected face, **world-space direction vector** |
| `MATE` | selected face, other object, other object's selected face |

`WORLD_AXIS_ALIGN` is the former `faceAlignedWithXAxis`. Critical: the screen-X direction is
resolved into a **world vector at the moment the snap fires**, and that vector is what is
stored. The gesture stays view-relative; the resulting constraint is world-absolute. Storing a
screen axis meant that rule 1's camera orbit invalidated the constraint, and the next snap would
silently re-solve against a different axis and rotate the object. `[CHANGED]`

**Solver** (run whenever the stack changes; consumes rotational DOF in list order):

- **Entry 1 — hard, 2 DOF.** Minimal (swing) rotation bringing the face normal onto its target
  axis, with the stated sign.
- **Entry 2 — soft, 1 DOF.** Twist about entry 1's axis chosen to maximise the projection of
  entry 2's face normal onto its target direction. This is exactly the "projects maximally to"
  language of the original 2ter / 2quater / 6quater.
- **Entry 3 — 0 DOF remaining.** Rejected by default (gesture ignored, short negative haptic).
  If `constraintEvictOnOverflow` is true, the oldest entry is evicted and the stack re-solved.
  The `GRAVITY + WORLD_AXIS` combination, which had no defined case in the original 2ter/2quater,
  falls here. `[CHANGED]`

**Ordering, and the priority question in 6quater.** By default a new constraint is appended, so
an existing gravity anchor is older and therefore hard, and a new mate best-fits the remaining
twist. This is the reading of revision 4's "maintaining to the maximum extent the alignment of
the aligned faces, if any, with priority to the face aligned with gravity". The opposite reading
— mate exact, anchor degraded — is available as `matePriorityOverAnchor` for A/B, but it should
not be the default: the user established the anchor deliberately, and a later gesture should not
silently break it.

**Eviction is explicit.** `[CHANGED]` A **double-tap on an object clears its constraint stack.**
No drag clears constraints. Previously 2bis and 2quinte reset all three booleans on any delta,
so a 2 mm accidental drag destroyed a deliberate anchor.

Locked constraints are rendered persistently on the object (axis glyph per entry, distinct
styling for hard vs. soft), so the stack is never invisible state.

Config: `constraintEvictOnOverflow`, `matePriorityOverAnchor`.

---

## 2. One touchpoint pressed

**1 —** no raycast hit on any object && delta position => compute the barycenters of any
combination of objects present in the scene (if there are fewer than 2 objects in the scene there
is no barycenter and it defaults to the center of the scene; with two objects there is one
barycenter possible; with three objects there are four barycenters possible) and find the
barycenter with the **smallest perpendicular distance to the touchpoint's ray** `[CLARIFIED — with
no hit there is no intersection point, so "closest to the raycast" is undefined]`, then the camera
orbits around this barycenter by the value of yaw and pitch of the device tilt.

- The combination count grows as `2^N - N - 1` (1 at N=2, 4 at N=3, 11 at N=4). Cap the set at
  `maxBarycenterCandidates` and cull candidates outside the viewport before ranking. `[NEW]`
- The touch delta gates this rule but its value is unused: **touch acts as a clutch for
  tilt-orbit.** Stated explicitly so it does not read as an omission. `[CLARIFIED]`
- Deadband on the tilt: `tiltDeadband`, in degrees.

**2 —** one raycast hit on one object => the hit object is selected and the hit face is selected.

**2bis —** one selected object **with an empty constraint stack** && delta position => the
selected object rotates in yaw and pitch along the vertical and horizontal axes of the screen
view plane. `[CHANGED — the constraint-reset clauses are removed (see §1.4); the rule now applies
only to unconstrained objects, with 2sexte taking over when constrained]`

**2ter —** one selected object && **vertical flick per §1.3** && touchpoint released
=> push `GRAVITY_ALIGN(selected face, -g for y<0 / +g for y>0)` onto the constraint stack, re-solve
per §1.4, then the object is unselected. `[CHANGED — the two internal cases are now the solver's
entry-1 / entry-2 behaviour; the flick condition replaces
`vector2(threshold close to 0, |y| > |ythreshold|)` plus "released just thereafter"]`

**2quater —** one selected object && **horizontal flick per §1.3** && touchpoint released
=> resolve the screen +x (for x>0) or -x (for x<0) direction into a **world-space vector**, push
`WORLD_AXIS_ALIGN(selected face, that world vector)` onto the constraint stack, re-solve per §1.4,
then the object is unselected. `[CHANGED — as 2ter, plus world-space resolution per §1.4]`

**2quinte —** one selected object **with an empty constraint stack** && delta position has a
circular movement **per §1.3** => the selected object rotates in roll on the screen view plane.
`[CHANGED — constraint-reset clauses removed; restricted to unconstrained objects, since roll
about the view axis cannot preserve an existing alignment. On a constrained object the circular
gesture is ignored (double-tap to clear first)]`

**2sexte —** one selected object **with a non-empty constraint stack** && delta position
=> the object rotates **about the remaining free DOF only**: `[NEW]`

- one constraint on the stack => rotation about that constraint's axis (e.g. gravity-anchored =>
  yaw-only about gravity), driven by the delta component perpendicular to the axis as projected
  on screen, with gain `gainRotateConstrained`;
- two constraints on the stack => no free rotational DOF; the drag is ignored.

This is the continuous fine rotation the system previously lacked entirely. It is the input
embodiment of recruiting constraints rather than avoiding them: with the anchor set, one finger
controls one DOF, and the anchor survives the motion. It is also the precondition for landmark
registration (§5).

**2septies —** double-tap on an object => clear that object's constraint stack. `[NEW — see §1.4]`

---

## 3. One touchpoint released

**3 —** the object and the face are unselected if they were not null. **The constraint stack is
unchanged and remains tracked.** `[CHANGED — wording only, to match §1.4]`

---

## 4. Two touchpoints pressed

**Anchor role is latched at press time.** `[NEW]` When the second touchpoint goes down, its role
is fixed for the lifetime of the gesture: *on an object* or *outside any object*. This decides
between rule 6 and rule 6bis once, at press, and the anchored object is given a visible ring.
Without this, a user steadying their grip near the second part would silently switch between two
different translation mappings mid-gesture.

**4 —** no raycast hit on any object && pinching => zoom the camera orbit in or out.

**5 —** two raycast hits on two objects => the objects hit are selected and the faces hit are
selected.

**6 —** one touchpoint on object && one touchpoint outside of any object && the touchpoint on the
object is `MOVING` && the touchpoint outside any object is `STATIONARY` => the selected object
translates in x and y in the screen view plane.

**6bis —** one touchpoint on one object && one touchpoint on another object && one touchpoint
`MOVING` && the other `STATIONARY` => the axis (`AxisBtwFaces`) linking the two centers of the
selected faces of the two selected objects is projected onto the screen view plane, and the delta
position values are projected onto this axis and its first orthogonal (`AxisFirstOrthogonal`) in
the screen view plane. Then the selected object whose touchpoint is `MOVING` translates on the z
depth axis and on the `AxisFirstOrthogonal` axis.

- The axis rotation is deliberate. Build both mappings behind
  `axisMappingMode: "rotated" | "direct"` and compare for ease of use. `[CLARIFIED — as
  requested; "direct" = travel along `AxisBtwFaces` translates along `AxisBtwFaces`, travel along
  `AxisFirstOrthogonal` translates in depth]`
- Because in `"rotated"` mode a drag along `AxisBtwFaces` produces depth motion, this rule shares
  both its context and its dominant direction with 6quater. They are separable **only** by the
  flick test of §1.3: decelerate-and-lift is 6bis, still-moving-at-lift is 6quater. `[NEW —
  this collision was previously unresolvable]`

**6ter —** one touchpoint on one object && one touchpoint on another object && **both touchpoints
`MOVING`** => the axis (`AxisBtwFaces`) linking the two centers of the selected faces of the two
selected objects is projected onto the screen view plane, and the delta position values are
projected onto this axis and its first orthogonal in the screen view plane. Then both selected
objects translate oppositely towards each other on `AxisBtwFaces` in world space by their
respective projected delta position values.

- Retained as specified. Flag for playtest: two simultaneously moving objects is the hardest
  case to control, and it is the one rule that breaks the asymmetric-hands invariant that 6, 6bis
  and 6quater all respect. If it measures poorly, 6bis already covers the same approach motion
  with one hand holding the reference frame. `[CLARIFIED]`

**6quater —** two selected objects && **flick per §1.3 directed towards the other selected object
in the screen view plane projection** && touchpoint released && the other touchpoint `STATIONARY`
=> push `MATE(selected face, other object, other selected face)` onto the constraint stack,
re-solve per §1.4 — the selected face normal is brought anti-parallel to the other selected face
normal, maintaining existing alignments to the maximum extent with priority to the older
constraint (gravity anchor first) — then the object is unselected. `[CHANGED — flick condition
per §1.3 replaces "delta position magnitude above threshold ... released just thereafter"; the
priority prose is now the solver's ordering, per §1.4]`

- Directedness uses the same purity ratio as §1.3, measured against the screen projection of
  `AxisBtwFaces`, with threshold `mateDirectionPurity`.

---

## 5. Deferred — not specified here

Listed so the gaps are explicit rather than implicit.

- **Landmark registration (step 8.5).** Selecting the intended discrete overlap and driving a
  reference edge/corner flush. Depends on 2sexte existing: once rotation is constrained,
  in-plane translation is 2 DOF and registration becomes a discrete slide along one of them.
- **Contact search, capture and seat (steps 9–10).** Capture radius on the final mate, snap into
  the seated pose, distinct haptic on lock. On a touchscreen the haptic is the only available
  channel for "it's seated".
- **Longest-axis alignment (step 5) proper.** 6quater aligns a *face normal*, which is the mate
  plus roll disambiguation. True longest-axis alignment operates on the object's principal axis
  and happens before the faces meet; if added, it should accept parallel **or** antiparallel
  without asking the user which, since a symmetric part mates identically either way.
- **Two touchpoints on the same object.** Currently undefined and reachable. Either ignore the
  second hit or use the segment between the fingers to specify a rotation axis — decide
  explicitly.

---

## 6. Cross-cutting requirements `[NEW]`

- **Undo.** Pose snapshot stack per object. Push before every discrete snap (2ter, 2quater,
  6quater) and before every `COMMITTED_CONTINUOUS` drag. Required before landmark registration is
  added: integer offset errors do not fail gracefully, and the correction is a whole-pitch jump
  rather than a nulling motion.
- **Haptics.** Short pulse on constraint lock; distinct pattern on mate lock; short negative
  pattern on a rejected gesture (constraint-stack overflow, roll on a constrained object).
- **Constraint visibility.** Persistent on-object glyphs for stack entries, hard vs. soft styled
  differently; ring on the anchored object during two-touchpoint gestures.

---

## Appendix — changelog against revision 4

| # | Change | Rules touched |
|---|---|---|
| 1 | Single gesture recognizer with commit state, motion buffer, provisional-motion rollback, and release-time priority | 2bis, 2ter, 2quater, 2quinte, 6bis, 6quater |
| 2 | Flick test (lift speed + travel + purity ratio) replaces "delta ... released just thereafter" and the two-independent-threshold form | 2ter, 2quater, 6quater |
| 3 | Hysteretic `STATIONARY` / `MOVING` states replace `delta position == vector2.zero` | 6, 6bis, 6ter, 6quater |
| 4 | Ordered constraint stack + solver replaces three booleans and all hand-written case branches | 2ter, 2quater, 6quater |
| 5 | Screen-X resolved to a world vector at snap time | 2quater, §1.4 |
| 6 | `GRAVITY + WORLD_AXIS` overflow case defined (reject, or evict-oldest behind a flag) | §1.4 |
| 7 | Constraint eviction made explicit (double-tap); drags no longer clear constraints | 2bis, 2quinte, 2septies |
| 8 | Constrained rotation added (yaw-only about the anchor) | 2sexte |
| 9 | Anchor role latched at press, with visible indicator | 6, 6bis |
| 10 | 6bis / 6quater collision resolved via the flick test; `axisMappingMode` A/B flag added | 6bis, 6quater |
| 11 | Thresholds in millimetres; translation gains scaled by camera distance | §1.1, §1.2 |
| 12 | Barycenter = min perpendicular distance to ray; candidate count capped and viewport-culled | 1 |
| 13 | Tilt-orbit touch clutch stated explicitly | 1 |
| 14 | Undo, haptics, constraint visibility | §6 |

---

# ADDED AFTER REVISION 5 — behaviours with no clause above *(not the owner's text)*

⭐ Two behaviours exist that this specification does not ask for. They are recorded here
because this document is the first place anyone will look for them.

## 1. Double-tap flies the camera home — anywhere on the glass

Yaw, elevation and zoom go back to their launch values, **and the centre goes to the last
yellow target** — the barycentre §2 rule 1 last CHOSE, which is what the marker shows and
what the user has been orbiting. ⛔ NOT the world origin: that would reset the camera to a
place it may never have looked at.

⭐ It listens on objects as well as empty space, and the reason is reachability: the orbit
can get stuck close in with an object filling the view, and then every tap lands on
something. A reset that only listened to empty space would be unreachable exactly when it
is wanted.

⭐⭐ **It is ANIMATED, over `cameraResetMs` (450 ms), and it eases the ORBIT PARAMETERS —
not the camera's transform.** Yaw, elevation, zoom and centre are what the orbit surface
is defined on, so easing those keeps the camera ON that surface the whole way: the same
path a finger could have dragged. ⛔ Slerping the camera's quaternion and lerping its
position instead would cut a chord through the middle of the scene — the camera would dive
toward the objects and back out, a movement no rule can produce.

⚠ Three of the four channels are not plain lerps, and each mistake looks fine in a still
frame and awful in motion:

* **yaw takes the SHORT way** — it accumulates without limit, so a straight lerp would
  unwind every revolution the hand had put in;
* **zoom interpolates GEOMETRICALLY** — it is a scale, so halfway between ×0.25 and ×4 is
  ×1, not ×2.125;
* **the curve is eased at both ends**, so the camera neither leaves nor arrives with a
  velocity step.

⛔ A new touch CANCELS a reset in flight: the animation writes the whole pose every frame,
so a drag during one would be overwritten as fast as it was applied. `0` snaps.

✅✅ **THE COLLISION WITH §2 RULE 2SEPTIES IS RESOLVED** (owner, 2026-09-15). It was real:
2septies made a double-tap the ONLY way to evict a constraint, and this reset fires on a
double-tap anywhere including on an object, so straightening the view would have destroyed
deliberate work. ⭐ **Eviction moved, not the reset** — it is now a quick **back-and-forth**
(amendments A1 → A4, in [`../AMENDMENTS_R5.md`](../AMENDMENTS_R5.md)). A double-tap now means
exactly one thing.

## 2. The sympathetic sway — the scene reacts to the held object

When the held object starts, resumes, or **turns**, everything else moves a little and
springs back.

* **Translation** — the others drift the SAME way (0.8 mm at a 120 mm/s reference, 180 ms
  spring).
* **Rotation** — they swing as a rigid **block** about the held object's centre, on the
  axis it is turning about: each orbits the pivot AND spins by the same angle (0.3° at a
  90°/s reference).
* Both scale ×0.3…×4.5 with how fast the object set off, from one proportionality — a
  bigger excursion still peaks at the same time constant, so it also covers that ground
  faster.

⛔ **It is decoration, and it is kept out of everything that MEANS something**: the
barycentre reads home positions with the sway subtracted, so the orbit centre cannot depend
on whether the scene happened to be mid-wobble when a finger landed.

⚠ Both re-trigger on a **change of direction**. `motionState` does not fall back to
`STATIONARY` until 150 ms below 6 mm/s, so a hand reversing at speed never goes still —
without a turn test the scene reacted once and then sat frozen through an entire shake.

---

# ADOPTED FROM THE TECHNIQUE CATALOG — §4.1 snap-dragging *(added 2026-09-15, not the owner's text)*

⭐ Source: the owner's `TECHNIQUE_CATALOG.md` §4.1, *skitters and jacks*.
**Citation, kept at the moment of adoption**: Eric Bier, *Snap-dragging in three
dimensions*, Symposium on Interactive 3D Graphics, 1990; Bier & Stone, *Snap-dragging*,
SIGGRAPH 1986. Published prior art. Full register:
[`../PROVENANCE.md`](../PROVENANCE.md).

⛔ This section sits OUTSIDE the specification text, like BUILD STATUS above and ADDED
AFTER REVISION 5 below. It changes no rule. It binds **`3D2`** (snap transform, capture
radius, seat), which §5 defers, and it is recorded here because §5 is where the next
session will look for it.

## What is adopted, and what is not

⭐⭐ **Most of §4.1 is already this project's design, arrived at independently.** A
*skitter* carries a frame of `{position, normal, tangent}` — that is a `MateConnector`,
field for field. Its alignment step, `frameToFrame(jackA, jackB, flipNormal = true)`, is
our ANTI-PARALLEL mate. ⭐ That is a third independent arrival at `CONSTRAINTS` §7, and it
is worth more as confirmation than it would have been as a source.

**NOT adopted — two things, deliberately:**

* ⛔ **User-placed jacks.** A jack is a frame the user drops at runtime. Our connectors are
  **authored on the asset** (`D5`), so the user never places one; they pick a face that
  already carries one. Adding runtime frame placement would be a second selection model
  beside §2 rule 2.
* ⛔ **The free-sliding skitter cursor.** Rule 2 selects a face *by touching that face*. A
  cursor that slides across surfaces under the finger is a different interaction, and on a
  touchscreen it is worse: the finger occludes exactly the thing the cursor is refining.

## What IS adopted — three rules that bind `3D2`

### 1. ⛔⛔ Snap priority must be a TOTAL order, declared, and deterministic

The catalog's failure mode, verbatim: *"snap priority must be explicit — vertex beats edge
beats face — or the skitter oscillates near corners."*

⭐ Ours is not vertex/edge/face, because our snap targets are connectors. But the shape of
the failure carries exactly: **where two candidates are within tolerance of each other, an
undeclared tie-break makes the choice flip frame to frame**, and a snap that flickers
between two seats is worse than no snap. So:

* the candidate ordering is **declared**, not emergent from iteration order or from
  whichever `Map` happens to enumerate first;
* ties are broken by a stated quantity, and the tie-break is **stable across frames**;
* ⚠ a candidate that wins must keep winning while it stays within tolerance —
  **hysteresis**, the same discipline §1.1 already applies to `STATIONARY`/`MOVING`. A
  boundary without hysteresis chatters; this project has already paid for that lesson once
  in the orbit centre's grace period.

### 2. ⛔⛔ The POINTING tolerance and the SEAT radius are two different constants

The catalog says snap tolerance belongs in screen space *"or the behaviour changes with
zoom"*. ⭐ §1.1 already goes further — millimetres on the physical screen, not NDC. But
applying that rule here exposes a split that is currently invisible:

| | question it answers | units | lives on |
|---|---|---|---|
| **seat / capture radius** | *does the peg physically reach the hole?* | **metres**, world | the connector (`MateConnector.radius`) — a property of the PART |
| **pointing tolerance** | *did the user indicate this connector?* | **millimetres on screen** (§1.1, `D7`) | `gestureConfig`, a property of the GESTURE |

⛔ **They are not the same number and must not be derived from one another.** A world-space
pointing tolerance means the user must be three times as accurate when zoomed out, for no
reason they can see. A screen-space seat radius means a part mates because the camera
happened to be close. ⭐ `METHOD`: *a constant borrowed from another row's derivation
inherits that row's question, not just its number.*

⚠ `MateConnector.radius` exists and is authored in metres; the pointing tolerance **does
not exist yet** and is `3D2`'s to add — with a slider, per `IN5`.

### 3. ⭐ Frame derivation for imported geometry — `3D4`'s recipe, recorded early

The skitter derives its frame from the surface it is on: position from the hit, normal from
the face, **tangent from the dominant edge**. ⚠ That is exactly the problem `3D4` (glTF
import) will face — an imported mesh arrives with triangles, not with connectors, and
`rollOrder` is what makes a mate FASTENED rather than REVOLUTE. Bier's answer is on file
rather than to be re-derived.

⛔ **And it inherits the catalog's own open question** (its §8.3): does the Blender → glTF
export preserve custom extras reliably enough to carry connector descriptors? That needs a
spike before `3D4` commits to authoring connectors in Blender.


---

# PROVENANCE — this specification's gestures are TAGGED *(added 2026-09-15, not the owner's text)*

⭐⭐ Adopted 2026-09-15 (`D11`, `CONSTRAINTS` §10) from the owner's
`TECHNIQUE_CATALOG.md` §0 and §5: **every gesture rule above now carries a provenance tag**
— prior art with a dated citation, an internal composition, or ⚠ **novel to this project**.

⛔ The register is [`../PROVENANCE.md`](../PROVENANCE.md), not this file, because it must
stay readable as one table rather than scattered through the rules.

⚠ **What a reader of this spec should know**: the two-touchpoint rules **6bis, 6ter and
6quater** are marked **NOVEL COMPOSITE** — no publication describes them. That is not a
defect and does not block anything; it is the catalog's caution zone (*"the exposure is not
'two fingers change scale' … it is novel composite gestures"*), and it is why `SEC4` exists.
