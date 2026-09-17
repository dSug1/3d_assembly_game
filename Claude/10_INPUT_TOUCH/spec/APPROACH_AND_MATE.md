# APPROACH & MATE — the owner's mechanism

> **STATUS** · 🔨 **SPECIFIED, NOT BUILT** (dictated 2026-09-17, branch `1.0.11-Approach-and-Mate-v0`)
> **OWNS** · how a held object approaches another and joins it
> **READ IF** · you are building or judging the approach, the snap, or the mate
> **LAST VERIFIED** · 2026-09-17

⛔ **NOTHING IS BUILT.** §2 below is the owner's text; everything after it is analysis, and
§6 is the list of things that must be decided before a line is written.

⭐⭐ **IT ANSWERS THE BLOCKER THAT STOPPED THE PREVIOUS DESIGN.** The earlier approach
(`ALIGNMENT_RULES.md` §2, the `TargetPosition` half) mapped a finger onto the screen
projection of *object centre → a point ON the other object's face*, and that direction
**shrinks to noise exactly at contact** — the instant precision matters. ⭐ This design uses
**centre → centre**, and the two centres can never meet: `MinDistanceBeforeSnapIsConfirmed`
holds them a cube-length apart until the snap fires. **The degenerate case is removed by
construction rather than handled.** ⚠ One degeneracy remains — §5.1.

---

## 1. The numbers, and what they mean on this scene

⚠ **FLAGGED FOR FINE-TUNING** (the owner's words: *"to be finetuned later"*). ⛔ They are
**per object**, derived from its size, so a bigger part gets a bigger capture band without a
second rule.

| name | for now | on this scene (cube = 80 mm) |
|---|---|---|
| `SnapIsPossibleRadius` | **1.25 ×** the cube length | **100 mm** between centres |
| `MinDistanceBeforeSnapIsConfirmed` | **1.1 ×** the cube length | **88 mm** between centres |

⭐ What those numbers do, stated in millimetres because that is how a hand meets them:

* two cubes **touching face to face** are **80 mm** apart, centre to centre;
* so an unauthorised approach stops with an **8 mm gap** — visible, and deliberately not zero;
* and the capture band — where the white contours show — is the **20 mm** between 100 and 88.

⚠ The three objects start 140 mm (A↔B) and ~150 mm apart, so nothing is captured at rest.

⛔⛔ **AND THE FACTORS ARE THE THING TO TUNE, NOT THE DISTANCES.** A capture radius written in
metres would be wrong for the first object that is not a cube; a MULTIPLE of the object's own
size is scale-free. ⭐ `IN5`: they ship as **config fields with URL overrides and no menu
slider** — the owner's standing instruction is not to inflate the slider count, and
`?snapRadiusFactor=1.4` needs no menu space.

---

## 2. THE RULES — ⚠ THE OWNER'S TEXT, verbatim

> **Approach & Mate mechanism**
>
> - 1- For each object, define a float SnapIsPossibleRadius and a float
>   MinDistanceBeforeSnapIsConfirmed (for the moment, set those float respective as 1.25x and
>   1.1x the cube length, to be finetuned later: mark the md files for that).
> - 2- in translation mode the first object approaches the second object with the inputs
>   available in the current build. Nothing to be specifically built as everything is available
>   with current build.
> - 3- Compute the distances between the first object center and the center of any other object
>   in the scene (for the moment, we use centers of objects, later in we will use distances
>   between faces: capture that in the md files).
> - 4- If (this is condition A) the first object is within a SnapIsPossibleRadius of any other
>   object (not necessarily the object with PioneerFace), this any other object becomes the
>   TargetObject and:
> - 4a- highlight the TargetObject contour and the first object contour in white. Toggle off the
>   highlights if the first object goes further away beyond SnapIsPossibleRadius or if the two
>   objects mate (this condition to be defined later on)
> - 4b- if condition A && the first object is aligned with one of the faces of the TargetObject
>   (this is condition B):
> - 4b.1- a delta position of first touchpoint within a certain threshold angle of the angle of
>   the direction between the centers of the first object and the TargetObject (for the moment
>   we use centers, later on we will use faces, mark the md files for that) translates the first
>   object towards or away from the TargetObject. If SnapIsAuthorized is false, the first object
>   cannot be closer than MinDistanceBeforeSnapIsConfirmed. Otherwise any input of 4b.1
>   (depending on the sign of the finger movement on this direction):
> - 4b.1.bis: rotates the first object to anti-align the normal of its closest face to the
>   normal of the TargetObject's closest face (we may need to name and track those faces) while
>   maintaining the alignment of first object and translate-snaps the closest face of the first
>   object to the closest face of the TargetObject, or
> - 4b.1.ter: translates away the first object from the TargetObject
> - 4b.2- a delta position of first touchpoint outside the threshold angle rotates the first
>   object by the value (same as current rotation for aligned object as currently wired)
> - 4c- Compute the angle between the normals of the two closest faces of the first object and
>   the TargetObject. If this angle is lower or higher than a threshold, boolean
>   SnapIsAuthorized is toggled.

⚠ **MARKED FOR LATER, as instructed**: distances and directions use **object CENTRES** today
and **faces** later (§3's note and 4b.1's). ⭐ Both places are tagged `CENTRES-FOR-NOW` in the
code so the change is one search.

---

## 3. MY READING — the states, and the quantities behind them

| | what is true | what a drag on the held object does |
|---|---|---|
| **M0** | no object within `SnapIsPossibleRadius` | today's rules: translate or rotate per the movement mode |
| **M1 — condition A** | a `TargetObject` is within the radius | ⭐ **both objects outlined in WHITE**; the drag is unchanged |
| **M2 — condition B** | A, **and** the held object is aligned to one of the TargetObject's face normals | ⛔ the drag is partitioned **by ANGLE, not by mode**: within the threshold of the centre→centre direction it **approaches/retreats**; outside it **twists** |
| **M3 — authorised** | B, **and** the two closest faces are near-anti-parallel (`SnapIsAuthorized`) | a push toward the target **MATES**: anti-align + translate-snap |

⭐ Four quantities the build has to name, because every rule above reads one of them:

1. **`TargetObject`** — the nearest other object within the radius (⚠ §6.1: *nearest* is mine).
2. **`FirstClosestFace` / `TargetClosestFace`** — the owner anticipated this: *"we may need to
   name and track those faces"*. ⚠ §6.2 defines them.
3. **`SnapIsAuthorized`** — from 4c's angle test.
4. **The approach direction** — centre → centre, in WORLD, projected to the screen for 4b.1's
   angle test.

---

## 4. ⛔ CONFLICTS WITH THE INPUT RULES ALREADY IN FORCE

### 4.1 ⛔⛔ INSIDE CONDITION B, THE MOVEMENT MODE STOPS DECIDING

`D28`'s whole model is *one mode, chosen by a tap, decides what a drag does*. ⛔ 4b.1/4b.2
partition the same drag **by the angle of the finger's travel** instead — so in condition B a
drag approaches or twists, and **rule 6's screen-plane translation is unreachable**: you
cannot slide the object sideways while you are near a target and aligned.

⭐ That may be exactly right — it is what a *docking mode* means, and the owner's 4b.2 says the
out-of-angle case rotates, which is the `ROTATE` behaviour, in what §2 calls translation mode.
⚠ But it is a real override of the mode model and it should be intended, not discovered. §6.3.

### 4.2 ⛔⛔ THE MATE MAKES A **SECOND** STACK ENTRY, AND TWO RULES ASSUME THERE IS ONLY ONE

*"while maintaining the alignment of first object"* means the object ends with **`FACE_ALIGN` +
`MATE`** — two constraints. Today:

* `singleAlignment` (the cap) **refuses** to push an alignment when a `MATE` is on the stack —
  correct, and it means the order matters: align first, then mate.
* ⛔⛔ **the twist reads `stack.length === 1` and otherwise falls through to FREE rotation** — so
  a mated object would rotate freely and break both constraints. **That is a defect waiting to
  happen the day the mate lands**, and it is in this file so it does not.
* ⭐ `solve` already handles two entries: entry 1 hard (2 DOF), entry 2 **soft** (the twist that
  best satisfies it), 0 DOF free. That is the right behaviour for a seated part.

### 4.3 ⚠ `A15` WILL DROP THE SELECTION WHEN THE SNAP MOVES THE OBJECT

The mate translates the object to contact. If that carries it out from under the finger, the
orphan raycast drops the selection at the next input event. ⭐ Probably harmless — the gesture
is over — but it decides whether the part stays selected after seating. §6.6.

### 4.4 ⚠ THE SECOND FINGER'S CHANNELS ARE UNSPECIFIED IN CONDITION B

Roll (`ROTATE`) and depth (`TRANSLATE`) still run on a second touchpoint, simultaneously since
`D43`. ⛔ Depth pushes the object along the view axis — which can carry it straight through
the target's capture band while 4b.1 is also moving it. §6.4.

### 4.5 ✅ WHAT DOES **NOT** CONFLICT

* **The tap channels** — align, un-align, switch and the mode toggle are untouched.
* **The shake and the re-tap** still release the alignment; ⚠ what they do to a *mate* is
  `D13`'s rule: eviction **spares mates**. So a shake cannot undo a seating, which is right —
  and it means the mate needs its own undo (`3D3`'s break, or a rule here).
* **The slerp** (`D45`) is exactly the machinery 4b.1.bis's rotation wants (§6.5).
* **`A11`'s deadband** feeds every delta, so a resting finger cannot creep the object into a
  snap.

---

## 5. ⛔ THE GEOMETRY — two things that cannot be built as written

### 5.1 ⚠ THE APPROACH DIRECTION STILL HAS NO ANGLE WHEN IT POINTS AT THE CAMERA

4b.1 compares the finger's travel against *"the angle of the direction between the centers"* —
a **screen** angle, so the world direction must be projected. ⛔ When the centre→centre line
points at or away from the camera, it projects to a **point**: there is no angle, and *within
the threshold* has no answer.

⭐⭐ **THIS IS THE ONLY SURVIVOR OF THE OLD DEGENERACY, AND IT IS THE MILD HALF.** The fatal one
— the direction collapsing *at contact* — is gone, because centres stay a cube-length apart.
⚠ A rule is still needed for the camera-axis case: refuse (treat every delta as 4b.2's
rotation), or fall back to depth. §6.7.

### 5.2 ⛔⛔ THE ANTI-ALIGN IS **NOT ALWAYS POSSIBLE** WHILE THE ALIGNMENT IS MAINTAINED

One alignment leaves exactly **one** free DOF — the spin about its normal. ⛔ Anti-aligning a
second pair of normals generally needs **two**. So *"anti-align … while maintaining the
alignment"* is:

* ⭐ **EXACT** when both mating faces are perpendicular to the alignment axis — the common case
  (two cubes aligned on their tops, meeting on their sides), because the spin sweeps the mating
  normal through exactly the circle the target's normal lies on;
* ⚠ **BEST-EFFORT otherwise** — §1.4's entry 2 finds the twist that *maximises the projection*,
  which leaves a residual tilt.

⛔ It must be **reported, not hidden**: a hand that mates two faces at an angle and gets a
gap-with-a-tilt has met geometry, not a bug. ⭐ And `3D3` reads exactly that residual to decide
when a mate breaks, so the quantity is wanted anyway.

---

## 6. ⚠ WHAT IS MISSING — the decisions the build needs

⭐ Each carries my recommendation, so a *yes* is enough.

1. **Two candidates in range.** Take the **nearest centre**; re-evaluate every frame, so the
   target can change as the hand moves. ⚠ With a tie, keep the current one (hysteresis by
   memory, not by a second threshold).
2. **"Closest face" (both objects).** Define as *the face whose CENTRE is nearest the other
   object's centre*. ⭐ Cheap, stable, and it agrees with intuition on a cube. ⚠ The alternative
   — *the face whose normal most nearly points at the other object* — differs on flat parts,
   and is the one to switch to when faces replace centres (§2's note).
3. **Does the mode really stop deciding inside condition B?** (§4.1) My reading: **yes**, that
   is what docking means. ⚠ Confirm.
4. **The second finger in condition B**: keep roll/depth live, or suspend them while docking?
   ⭐ Recommend **suspend depth** (it fights the approach along a different axis) and **keep
   roll** (it is the twist by another channel).
5. **Is the mate's motion animated?** ⭐ Recommend **yes** — the `D45` slerp for the rotation
   and the same eased ratio for the translation, because the object is being moved by a rule
   rather than by the finger, which is exactly when a jump reads as a glitch.
6. **After the mate**: is the part still selected, still held, still highlighted? ⭐ Recommend
   the white contours go (the owner's 4a already says so), the FollowerFace highlight goes with
   the gesture, and the selection follows `A15` as usual.
7. **The camera-axis case** (§5.1): refuse, or fall back? ⭐ Recommend **refuse** — every delta
   reads as 4b.2's rotation — because the alternative is a silent approach in a direction the
   hand cannot see.
8. **`SnapIsAuthorized`: a toggle or a reading?** The word *toggled* implies memory. ⭐ Recommend
   a **pure reading of the current angle**, re-evaluated per frame: a remembered boolean can
   disagree with the geometry after any rotation, and this one authorises a destructive move.
9. **The threshold angles.** Two are needed: 4b.1's *travel within the approach direction*
   (⭐ recommend **±30°**) and 4c's *faces near-anti-parallel* (⭐ recommend **> 150°** between
   normals). ⚠ Both are guesses and both ship as URL-overridable fields, per `IN5`.
10. **Undoing a mate.** `D13` says eviction spares mates, so neither the shake nor the re-tap
    can unseat a part. ⛔ Either a rule here or `3D3`'s break-on-residual has to give the hand a
    way out — and until one exists, **a mate is permanent**, which is worse than a dead end.

---

## 7. ⭐ IS THE LOGIC SOUND? — the verdict asked for

✅ **Yes, and it is better than the design it replaces**, for one reason worth naming: it
measures between **centres**, which cannot coincide, instead of between a point and a face,
which meet exactly when precision matters most. ⛔ That was the blocker on the old approach and
it is gone by construction.

✅ **The staging is right.** A → highlight, B → docking, authorised → mate is three visible
states with a gesture between each, so a hand always knows which one it is in — and the white
contours make A and B legible without a legend.

⚠ **Two things will bite if they are not decided first**: the mate's **second stack entry**
(§4.2 — today's twist rule would free-rotate a seated part) and the **absence of an undo**
(§6.10 — eviction spares mates by design).

⛔ **And one thing is geometry, not code**: anti-aligning a second pair of normals while
keeping the first alignment is exact only when the mating faces are perpendicular to the
alignment axis (§5.2). ⭐ Everywhere else the build can only do its best, and it must say so.
