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

### ✅ THE OWNER'S ANSWERS TO THE FIRST ANALYSIS — verbatim, 2026-09-17

> - *A mate is a second stack entry ("while maintaining the alignment"): record that for
>   resolving this issue later on when we start building more complex geometries. For the
>   moment, we proceed with cubes so it is OK.*
> - *D13: break of mate can be done only if two fingers are touching the respective two objects
>   to be un-mated && two finger opposite movements aligned within an angle threshold with the
>   direction of the centers of the mated objects (= same as zooming out but zooming out
>   movement shall be aligned with the centers direction within a tolerance) && movement
>   amplitude shall be bigger than a BreakThreshold (subject to slider for manual tuning of
>   this threshold)*
> - *Geometry, not code: anti-aligning a second pair of normals while keeping the first
>   alignment needs two DOF and there is one: same as first line.*
> - *Inside condition B the movement mode stops deciding: that's OK, and user shall expect that
>   since the objects are highlighted in write, correct?*
> - *camera axis degeneracy: fair enough, but I expect the user will not want to mate two
>   objects which are aligned with the vision axis (a child would not do it anyway) because of
>   occlusion*
> - *earlier TargetPosition + gizmo + orbit half: indeed, this is superseded.*

⭐ So: §8 is the **break** gesture, §9 the **reset conditions**, §10 what is **deferred to
complex geometry**, and §6 keeps only what is still open — which is now two things.

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
| **M2′ / M3′ — two-handed** | the same, with a finger on **each** object | ⭐ the **fine approach**: each object follows its own finger along the line, and the pair docks when they meet. ⛔ The same gesture with the signs reversed is §8's **break** |

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

### 4.2 ⛔⛔ THE MATE MAKES A **SECOND** STACK ENTRY — ⚠ AND THE TWO HALVES HAVE DIFFERENT FATES

✅ **DEFERRED (the owner's call): the GEOMETRY.** *"Record that for resolving this issue later
on when we start building more complex geometries. For the moment, we proceed with cubes so it
is OK."* ⭐ Correct for cubes — see §5.2: the anti-align is EXACT when the mating faces are
perpendicular to the alignment axis, which is every side face of an axis-aligned cube. §10.

⛔⛔ **NOT DEFERRABLE: the CODE.** The same sentence hides a second problem that cube-ness does
not fix — today's twist rule reads `stack.length === 1` and **otherwise falls through to FREE
rotation**. ⚠ So the moment a cube is mated (align + mate = two entries) a drag would rotate it
freely and break both constraints, on the most ordinary gesture there is. ⭐ It is one line when
the mate is built: **two entries ⇒ zero free DOF ⇒ the drag is refused**, and the escape is
§8's break rather than a fall-through. ⛔ Recorded here because the fix belongs to the day the
mate lands, and because *"it is OK for cubes"* is true of the geometry and false of this.

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

## 6. ✅ DECIDED, AND ⚠ WHAT IS STILL OPEN

### ✅ Answered by the owner or adopted with their agreement

| | decision |
|---|---|
| the mode inside condition B | ✅ **it stops deciding** — *"that's OK"*. ⚠ See §6.1: the SIGNAL for it needs one word of care |
| the camera-axis degeneracy | ✅ **accepted as unlikely** — *"a child would not mate two objects aligned with the vision axis because of occlusion"*. ⛔ Behaviour still has to be deterministic: **treat every delta as outside the angle**, so it rotates. A silent approach along an axis the hand cannot see is the alternative |
| the old `TargetPosition` half | ✅ **superseded** — the owner's word. ⛔ `ALIGNMENT_RULES.md` §2's last four bullets are marked, not deleted: they are the owner's text and the record of why this design exists |
| undoing a mate | ✅ **§8's two-handed pull** |
| the second stack entry, and the anti-align's missing DOF | ✅ **deferred to complex geometry** (§10) — ⚠ except the CODE half of the first, which cannot wait (§4.2) |
| two candidates in range | ✅ nearest centre, re-evaluated per frame, ties keep the current target |
| *closest face* | ✅ the face whose CENTRE is nearest the other object's centre |
| `SnapIsAuthorized` | ✅ a **derived reading**, never a remembered toggle (§9) |
| is the mate's motion animated | ✅ yes — `D45`'s slerp for the rotation, the same eased ratio for the translation |
| the thresholds | ✅ docking angle **±30°**, faces anti-parallel **> 150°**, both URL-overridable; `BreakThreshold` gets a **slider**, at the owner's request |

### ✅ 6.1 ONE WHITE FOR BOTH STATES — answered: *"make the white contours not differ for the moment"*

⭐ The contours come up at **condition A** (proximity) and the drag only changes meaning at
**condition B** (A *and* aligned), so for a moment the hand sees white while the movement mode
still decides. ⛔ The owner's call: **do not distinguish them yet.**

✅ **AND THE STATES ARE STILL TELLABLE APART WITHOUT A SECOND COLOUR**, which is why the call
is cheap: condition B needs an alignment, and an alignment is **already drawn** — the
Follower's fill and the Pioneer's contour. So *white alone* reads as **captured**, and *white
plus a face highlight* as **docking**. ⚠ That is a legend of sorts, and a device pass may find
it too subtle; §11 keeps the improvement on the record rather than in the build.

### ✅ 6.2 THE SECOND FINGER IN CONDITION B — ANSWERED, and my question was the wrong one

> *"I am not clear on the second finger: I expect the second finger will be on the second
> object at one point to drive the fine approach and dock both objects."*

⭐⭐ **THAT SETTLES IT, AND IT DISSOLVES THE PROBLEM I RAISED.** A finger landing on the
**TargetObject** is not the *second touchpoint* of `A10`/`A12` at all — `IN2`'s router latches
it as a second **`OBJECT`**, a holder of its own. ⛔ Roll and depth belong to the `SECOND` role
(a finger on the object someone else is already holding) or to `OUTSIDE`. ⭐ So in the
configuration the owner expects — **one finger on each object** — depth and roll are not in
play, and there was never a channel to suspend. The roles had already separated the two cases.

⭐⭐⭐ **AND IT COMPLETES THE MECHANISM'S SYMMETRY**, which is the part worth seeing:

| fingers | motion along the centre→centre line | what it is |
|---|---|---|
| **one**, on the held object | toward / away | §4b.1's coarse approach |
| **two**, one on each object | **toward each other** | ⭐ the **fine approach**, and the dock |
| **two**, one on each object | **apart**, past `BreakThreshold` | §8's **break** |

⛔ The dock and the break are the same gesture with opposite signs — which is why a hand will
not have to learn the second one.

#### ⚠ What the build still has to decide about the two-finger case

1. **Is the second holder's drag ALSO partitioned by the angle?** ⭐ Recommend **yes**, for
   symmetry: within the angle each object moves along the line, outside it each rotates its own
   object. ⚠ Otherwise the target could be dragged sideways while the held object docks into
   where it used to be.
2. **What maps a finger's travel to the gap?** ⭐ Recommend **each object follows its OWN
   finger's projected travel**, through rule 6's existing tracking factor — so a millimetre of
   finger is a millimetre of object at that zoom, and the gap closes by the sum. ⛔ That makes
   *fine* mean **two hands sharing the work**, not a second gain to tune.
3. **Does the hold-off still apply?** ⭐ Yes, and see below — it stops being a rule inside the
   approach and becomes a property of the placement.

#### ✅ AND THE CLAMP MOVES — which is a better answer than my *"suspend depth"*

⛔⛔ I recommended suspending depth because it moves the object along a **different** axis and
so bypasses 4b.1's *"cannot be closer than `MinDistanceBeforeSnapIsConfirmed`"*. ⭐⭐ The
honest fix is not to forbid a rule, it is to stop writing the clamp inside one: **the hold-off
is a property of the object's PLACEMENT while a target is captured and the snap is not
authorised**, enforced wherever the placement is written — the approach, depth, rule 6, the
second holder, anything later.
⭐ `METHOD`'s shape: *a constraint enforced by every rule that could violate it is a rule; a
constraint enforced at the one place the quantity is stored is an invariant.* ⚠ And it means
no gesture has to be disabled to keep the guarantee — which is what made the suspension
proposal feel wrong even as I wrote it.

### ⚠ 6.3 AFTER THE MATE — still unstated

⛔ The owner's 4a says the white contours go when the two objects mate, *"this condition to be
defined later on"*. ⭐ What else the seat implies is open: is the part still **selected**, does
its **alignment** survive, and does the pair now **move together** when either is dragged?
⚠ The last one is `3D2`'s *seat* and §8 depends on it — see the gap named there.

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

---

## 8. ⭐⭐⭐ BREAKING A MATE — the owner's gesture (2026-09-17)

> *"Break of mate can be done only if two fingers are touching the respective two objects to be
> un-mated && two finger opposite movements aligned within an angle threshold with the direction
> of the centers of the mated objects (= same as zooming out but zooming out movement shall be
> aligned with the centers direction within a tolerance) && movement amplitude shall be bigger
> than a BreakThreshold (subject to slider for manual tuning of this threshold)."*

⭐⭐ **IT ANSWERS THE WORST THING IN THE FIRST ANALYSIS.** `D13` makes eviction spare mates, so
neither the shake nor the re-tap could unseat a part — a mate was **permanent**, which is worse
than a dead end. ✅ Now it has an undo, and the undo is *the physical gesture*: take one part in
each hand and pull.

### The three conditions, and what each one is for

| | condition | what it rules out |
|---|---|---|
| 1 | **one finger on each of the two mated objects** | a one-handed drag, and any gesture that does not name BOTH parts |
| 2 | the two travels are **opposite** and within an angle of the **centre→centre** direction | a pinch that happens to be near the parts, and a two-handed rotation |
| 3 | the amplitude exceeds **`BreakThreshold`** | a nudge, a grip adjustment, and the jitter of two resting fingers |

⭐⭐ **AND IT IS THE DOCK, REVERSED** (§6.2): one finger on each object moving **together**
along the line is the fine approach; moving **apart** past the threshold is this. ⛔ One
gesture, two signs — so the break costs a hand nothing to learn.

⭐ *"Same as zooming out"* is the right analogy and the right warning: **rule 4's pinch is
exactly this gesture with both fingers OUTSIDE any object.** ⛔ The two cannot collide — the
router latches roles at press, and a pinch requires two `OUTSIDE` touchpoints while this
requires two `OBJECT` ones — but they are the same hand shape, so the readout must name which
one fired or a device report will not be attributable.

### ⚠⚠ WHAT THIS EXPOSES, AND IT IS A REAL GAP

⛔⛔ **A MATE DOES NOT HOLD POSITION TODAY.** §1.4's constraint stack solves **orientation**:
a `MATE` entry carries a normal and a target direction, and `solve` returns a rotation. ⭐ So
two mated cubes are held *facing* each other and **nothing stops either one being translated
away by an ordinary one-finger drag** — which means *breaking* would be indistinguishable from
*moving*, and this gesture would have nothing to undo.

✅ That is `3D2`'s *seat*: the mate has to bind the pair's relative **placement**, not just
their facings. ⛔ Until it does, §8 cannot be judged — so the build order is **seat first,
break second**, and the break's vectors will assert that an ordinary drag does NOT separate a
seated pair.

### The numbers

* **`BreakThreshold`** — the owner asked for a **slider**, so it gets one (the standing *no new
  sliders* rule is set aside where a hand says it wants to tune). ⚠ It is an **amplitude**, so
  millimetres on the glass, and it must clear `A11`'s deadband by a margin or a resting pair of
  fingers could break a seat.
* **The angle tolerance** — ⭐ recommend **reusing §4b.1's docking angle** rather than adding a
  second one: both ask *"is this travel along the centre→centre line?"*, and two numbers for
  one question drift apart.

---

## 9. ⭐⭐⭐ RESET CONDITIONS — what each piece of state is, and exactly when it goes

⛔ The owner asked for this to be precise. ⭐ Every row is a rule the build has to implement;
where a cell says *derived*, there is **no state at all**, which is the safest kind.

| state | set when | cleared when | note |
|---|---|---|---|
| **`TargetObject`** | a held object comes within `SnapIsPossibleRadius` of another — **the nearest** one | the distance exceeds the radius · **the holder is released** · the pair mates · the object is deleted | ⭐ Re-evaluated **every frame**, so the target follows the hand. ⚠ On a tie, the current target is kept — hysteresis by memory rather than a second threshold |
| **white contours** | exactly while `TargetObject` exists | with it | ⛔ They ARE the state, drawn; no separate lifetime |
| **condition B** | `TargetObject` **and** the held object's alignment normal matches one of its face normals | *derived* | ⚠ Not stored — it is a test, and a stored copy could disagree with the stack after any tap |
| **`FirstClosestFace` / `TargetClosestFace`** | *derived* while B holds | — | ⭐ Recomputed per frame: the face whose CENTRE is nearest the other object's centre. ⚠ They are named because the readout and the mate both need to say WHICH faces |
| **`SnapIsAuthorized`** | *derived* from §4c's angle, per frame | — | ⛔ **Not a toggle with memory**: it authorises a destructive move, and a remembered `true` would survive a rotation that made it false |
| **the alignment** | a tap (`D37`–`D42`) | shake · re-tap · rotation reset made in the same gesture · the Pioneer turns in `SNAPSHOT` mode | unchanged by this file |
| **the MATE** | §4b.1.bis fires | ⛔ **only §8's two-handed pull** — `D13` spares mates from eviction | ⚠ Until §8 exists, a mate cannot be undone at all |
| **`alignAnim` / any snap animation** | the mate's move | on completion · cancelled by a release of the alignment | `D45`'s rule: a release **stops** a snap, it does not finish it |

⚠⚠ **THE ONE RESET THAT IS A JUDGEMENT, NOT A MECHANISM**: the holder's release clearing
`TargetObject`. ⭐ The objects are still near each other, so *capture* is arguably a property of
the SCENE rather than of the gesture. ⛔ Recommend clearing it: white contours with nothing
held would advertise a docking state no finger is in, and this project has paid for readouts
that describe something other than what is happening.

---

## 10. ⚠ DEFERRED TO COMPLEX GEOMETRY — the owner's call, recorded so it is not lost

⭐ Both are true for **cubes** and both come back the day a part is not one:

1. **A mate is a second stack entry**, so a mated + aligned part has **zero** free rotational
   DOF. ⛔ Correct for a seated cube; for a part that wants to pivot in its seat (a hinge, a
   sliding mate) §1.4 needs kinds of constraint it does not have.
2. **The anti-align needs two DOF and has one** (§5.2). ⛔ Exact while the mating faces are
   perpendicular to the alignment axis — every side face of an axis-aligned cube — and
   best-effort otherwise, leaving a residual tilt.

⛔⛔ **WHAT MUST HAPPEN ANYWAY, AND SOON**: the day the build meets a part where either bites,
the residual is the quantity to REPORT — `3D3` already reads it to decide when a mate breaks.
⭐ So the deferral is *do not solve it yet*, not *do not measure it*.

---

## 11. ⭐ CAPTURED, NOT CHOSEN — improvements the owner parked

⚠ Neither is a defect and neither blocks the build. ⛔ They are here so that a later session
finds a **decision** rather than an omission — the difference between *we thought about it* and
*nobody noticed*.

1. **A second white for the docking state** (§6.1, 2026-09-17). Today one white marks both
   *captured* and *docking*, and the presence of a face highlight is what separates them.
   ⭐ If a hand finds that too subtle, the fix is a **brighter or thicker white in condition
   B** — one line, because both contours already run through one code path.
   ⚠ The thing to watch for on the glass: a drag that stops translating the way the mode says,
   with nothing on screen having visibly changed at that instant.
2. **Distances and directions by FACE rather than by CENTRE** (the owner's own note in §2 and
   4b.1). ⛔ Centres are what makes the approach direction stable at contact (§5.1's degeneracy
   is gone *because* of them), so this is not a straight upgrade: **face distances reintroduce
   the quantity that collapses.** ⭐ Whatever replaces it will need the hold-off to keep the
   direction alive, exactly as the centres do now.
