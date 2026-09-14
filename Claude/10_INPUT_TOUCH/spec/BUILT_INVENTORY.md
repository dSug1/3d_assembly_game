# WHAT IS ACTUALLY BUILT — the input system by touchpoint configuration

> **STATUS** · ⭐ live — regenerate whenever a rule lands or a behaviour is added
> **OWNS** · the map between the owner's spec and the code that exists
> **READ IF** · you are about to build an input rule, or you want to know what a finger
> can currently do
> **LAST VERIFIED** · 2026-09-14, against 307 passing vectors

⛔ **The spec itself is [`SPEC_INPUT_SYSTEM_R5.md`](SPEC_INPUT_SYSTEM_R5.md) and it is
VERBATIM — it is never edited.** This file is the other half: what of it exists, what
does not, and what exists that the spec never asked for. ⚠ Two of the entries below are
NOT in the spec at all; they are marked, because a behaviour with no clause behind it is
the one nobody can look up.

---

## The configurations a hand can actually make

⭐ **Roles are latched at PRESS and never revisited** (§4, `src/input/router.ts`). The
table is written against what each touchpoint was latched as, not where it is now.

| touchpoints | what they are on | what happens | spec | status |
|---|---|---|---|---|
| 1 | an object | select, and the §1.3 state machine runs: commit point, provisional motion, rollback, tap / double-tap / hold, flick test, release-time priority | §1.3, §2 rule 2 | ✅ `IN1` |
| 1 | an object | **free rotation** — yaw/pitch about the screen axes | §2 rule 2bis | ⚠ **diagnostic stand-in**; `IN3` replaces it |
| 1 | an object | **roll** about the view axis, from a circular gesture | §2 rule 2quinte | ✅ `IN1` |
| 1 | an object | double-tap → **reset the camera orbit** | ⛔ **not in the spec** | ✅ 2026-09-14 · ⚠ collides with 2septies, see below |
| 1 | empty space | **orbit the camera** about the barycentre nearest the finger's ray | §2 rule 1 | ✅ `IN9` · ⚠ **amended**: driven by delta position, NOT device tilt |
| 1 | empty space | double-tap → **reset the camera orbit** | ⛔ **not in the spec** | ✅ 2026-09-14 |
| 2 | both empty space | **pinch zoom** | §4 rule 4 | ✅ `IN9` |
| 2 | one object + one empty space | **translate in the screen plane** | §4 rule 6 | ✅ `IN4` (partial) |
| 2 | both the SAME object | the second is **IGNORED**, for its lifetime | §5 (was undefined) | ✅ `IN8` decided, `IN2` built |
| 2 | two DIFFERENT objects | select both objects and both faces | §4 rule 5 | ⛔ needs `3D1` |
| 3+ | any | every hit on an already-held object is ignored; the rest keep their latched roles | — | ⚠ by construction, not measured — palm contact is untested |

⚠ **Rule 6 is reached by PRESENCE, re-read every frame** — not by a latched mode and not
by the anchor's `STATIONARY` state. A second finger outside any object means translate,
whatever it has done since it went down. That is an owner correction of a build that
latched it; see [`../../00_CORE/queue_notes/IN4.md`](../../00_CORE/queue_notes/IN4.md).

## Rules specified and NOT built

| rule | what it is | blocked on |
|---|---|---|
| §2 **2ter** | vertical flick → `GRAVITY_ALIGN` onto the constraint stack | `3D1` (faces), `IN3` |
| §2 **2quater** | horizontal flick → `WORLD_AXIS_ALIGN` | `3D1`, `IN3` |
| §2 **2sexte** | constrained rotation about the remaining free DOF | `3D1`, `IN3` |
| §2 **2septies** | double-tap → clear the object's constraint stack | `3D1`, `IN3` · ⚠ **collides with the camera reset** |
| §3 **3** | release unselects the object and the face, stack preserved | `3D1` |
| §4 **5** | two objects and two faces selected | `3D1` |
| §4 **6bis** | translate along `AxisBtwFaces` / its orthogonal | `3D1` (face centres) |
| §4 **6ter** | both objects translate toward each other | `3D1` |
| §4 **6quater** | mate flick | `3D1` |
| §5 | landmark registration, contact/capture/seat, longest-axis alignment | deferred by the spec itself |
| §6 | haptics | `IN7` · ⛔ iOS Safari has no Vibration API at all |

## ⛔⛔ Built, and NOT in the spec

Two behaviours exist that no clause asks for. ⭐ They are listed here because the spec is
the first place anyone will look for them, and they are not in it.

### 1. Double-tap resets the camera orbit — anywhere on the glass

⚠ **It collides with §2 rule 2septies**, which makes a double-tap on an object the ONLY
way a constraint is ever evicted. Both cannot silently fire. The decision is queued in
[`../../00_CORE/queue_notes/IN3.md`](../../00_CORE/queue_notes/IN3.md) and must be taken
before eviction is written.

⭐ The reason it listens on objects too: the orbit can get stuck close in with an object
filling the view, and then every tap lands on something. A reset that only listened to
empty space would be unreachable exactly when it is needed.

### 2. The sympathetic sway — the scene reacts to what the held object does

When the held object starts, resumes, or **turns**, everything else moves a little and
springs back. ⛔ It is decoration and it is kept OUT of everything that means something:
the barycentre reads home positions with the sway subtracted, so the orbit centre cannot
depend on whether the scene happened to be mid-wobble.

* **Translation** — the others drift the SAME way, `translateSwayMm` at
  `swayReferenceSpeedMmPerS`, scaled ×0.3…×4.5 by how fast the object set off.
* **Rotation** — the others swing as a rigid BLOCK about the held object's centre, on the
  axis it is turning about: each one orbits the pivot AND spins by the same angle.

⚠ Both re-trigger on a **change of direction**, which is the part that was missing first
time round: `motionState` does not fall back to `STATIONARY` until 150 ms below 6 mm/s, so
a hand reversing at speed never goes still.

## What a finger cannot do yet

⛔ **Nothing touches an OBJECT for real.** The rotation is a diagnostic stand-in, there is
no object model, no faces, no connectors, no constraint stack and no mates — so no part of
§1.4 exists. `3D1` is the row that starts it.

## Where the numbers are

⚠ Every threshold is in `src/input/gestureConfig.ts`, in **millimetres on the physical
screen**, and all of them are placeholders except: the six orbit ring values, the four
gains, rule 6's four feel numbers, and the sway sets — all chosen by finger — plus
`pointerNoiseMm` = **0.761 mm**, the one number actually MEASURED.
⭐ Every one of them can be overridden from the URL (`?rollAngle=45`) or moved on the
on-screen menu, without a rebuild.
