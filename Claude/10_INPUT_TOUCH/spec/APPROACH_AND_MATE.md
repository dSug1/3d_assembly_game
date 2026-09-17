# APPROACH & MATE — the owner's mechanism

> **STATUS** · 🔨 **`A16`–`A21` BUILT AND ON THE GLASS** — the highlights, the alignment tracking, the scene and `frozen`; ⛔ the approach, snap and mate are NOT built (2026-09-17, branch `1.0.11-Approach-and-Mate-v0`)
> **OWNS** · how a held object approaches another and joins it
> **READ IF** · you are building or judging the approach, the snap, or the mate
> **LAST VERIFIED** · 2026-09-17

⛔ **§2 below is the owner's text**; everything after it is analysis, and ⚠ **§1's numbers have
all been amended since** — read §1 before trusting any figure quoted later.
⭐⭐ **WHAT IS ACTUALLY BUILT IS §12–§18**: `A16` the white contours, `A17` the alignment
readouts and the pioneer/follower tracking, §14 a stale-highlight bug worth reading, `A18` the
no-cycle rule, `A19` the workbench scene, `A20` the `frozen` attribute, `A21` nearest-wins.
⛔ The approach, the hold-off, `SnapIsAuthorized`, the snap, the mate and the break are **not
built**; §§3–11 remain design. ⚠ Each built section ends with an ordered list of what to look
for on the glass, and what would falsify each item.

⭐⭐ **IT ANSWERS THE BLOCKER THAT STOPPED THE PREVIOUS DESIGN.** The earlier approach
(`ALIGNMENT_RULES.md` §2, the `TargetPosition` half) mapped a finger onto the screen
projection of *object centre → a point ON the other object's face*, and that direction
**shrinks to noise exactly at contact** — the instant precision matters. ⭐ This design uses
**centre → centre**, and the two centres can never meet: `MinDistanceBeforeSnapIsConfirmed`
holds them a cube-length apart until the snap fires. **The degenerate case is removed by
construction rather than handled.** ⚠ One degeneracy remains — §5.1.

---

## 1. The numbers, and what they mean on this scene

⚠ **ALL FLAGGED FOR FINE-TUNING** (the owner's words: *"to be finetuned later"*).

### ⭐⭐⭐ THE SCENE, AS OF 2026-09-17

⛔⛔ **IT IS NO LONGER THREE CUBES.** The owner: *"instead of three cubes, make the scene with
three rectangles, each with dimensions L, 2L, 3L"*, *"set the cube three lengths apart at the
scene boot"*, *"move the brown cube by two lengths away from the camera"*, *"set capture radius
at 4L"*.

| | value | in mm (`L` = 80 mm) |
|---|---|---|
| base module `L` | `OBJECT_SIZE_M` | **80 mm** |
| body dimensions | `L × 2L × 3L` | **80 × 160 × 240 mm** |
| boot separation | `3L`, **all three pairs** | **240 mm** between centres |
| brown body's depth offset | `2L` away from the camera (`+z`) | **160 mm** |
| `SnapIsPossibleRadius` | **`4L`**, absolute | **320 mm** between centres |
| `MinDistanceBeforeSnapIsConfirmed` | `1.1 ×` — ⚠ **NOT BUILT, NOT WIRED** | 88 mm |

⭐⭐ **AND CUBOIDS ARE A BETTER TEST SCENE THAN CUBES**, which is worth saying because it was
not the reason for the change but it is a real benefit. ⛔ Two rules here are **invisible with
cubes**: a face marker's SHAPE, and — while the radius was per-object — *largest extent* versus
*mean*. ⚠ A cube also hides every sign error in a face pair, because it has an opposite face
for every face. That is what made two of my own vectors hollow, both caught by mutants and not
by a hand.

### ⚠⚠ THE RADIUS'S HISTORY, BECAUSE EVERY STEP OF IT TAUGHT SOMETHING

1. **1.25 × the candidate's span** — the original.
2. **1.0 ×** — *"easier to see at debug"*. ⛔ **Withdrawn**: 1.0 × an 80 mm cube is 80 mm, which
   is exactly where two cubes **touch**, and it would have put the 1.1 × hold-off **outside**
   the capture band — an object forbidden closer than 88 mm while only captured at 80 mm, so
   nothing could ever dock. ⭐ **The two numbers are coupled and a radius cannot be chosen
   without looking at the hold-off.**
3. **2.0 × span** — *"it should be two lengths"*, which cleared the hold-off.
4. **`4L`, absolute** — *"set capture radius at 4L"*.

⛔⛔ **STEP 4 GAVE UP SCALE-FREEDOM, DELIBERATELY.** A per-object radius meant a bigger part
captured from further away with no second rule. ⚠ `4L` is one distance for the whole scene, so
that is gone. ⭐ In exchange, every number in the scene is a multiple of one module a hand can
compare by eye: bodies `L × 2L × 3L`, spacing `3L`, radius `4L`. ⛔ `objectSpan` and
`captureDistance` were **deleted with the rule they served**, and their two vectors with them —
a vector for a rule that no longer exists is worse than none, because it passes while describing
the wrong product.

⚠⚠ **A CONSEQUENCE TO KNOW BEFORE JUDGING ANYTHING**: `4L` (320 mm) is **larger** than the
`3L` (240 mm) boot separation, so **every pair is in range at rest**. ✅ Nothing is highlighted
anyway — `A16` also needs an alignment and a translation — but it means **the distance is not
what will block a highlight in this scene**. ⛔ To judge the threshold at all, a body has to be
dragged well clear of the other two.

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
| **M1 — condition A** | a `TargetObject` is within the radius | ⛔ **NOTHING VISIBLE AND NOTHING CHANGED** — `A16` moved the contours to the triple condition below. A is a purely internal precursor |
| **M2 — condition B** | A, **and** the held object is aligned to one of the TargetObject's face normals, **and** it is being TRANSLATED (`A16`) | ⭐ **both objects outlined in WHITE.** ⚠ The angle partition is NOT built — see `A16`, which is highlights only |
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
| **white contours** | exactly while **all three** of `A16`'s conditions hold | when any one of them stops | ⛔ They ARE the state, drawn; no separate lifetime. ⚠ **NOT** merely while a target exists — see `A16` |
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

---

## 12. ⭐⭐⭐ `A16` — THE WHITE CONTOURS: **TWO** CONDITIONS (owner, 2026-09-17)

> *"two highlights possible only when the first object is aligned && translation by one
> touchpoint or two touchpoints and distance below threshold"*
>
> then, the same day:
>
> *"modify the rule: the white contour does not necessitate the object to be aligned to toggle
> on and off. I want to remove the 'object is aligned' from the approach logic (we will see how
> to handle the alignment for the mate logic later on)"*

### ✅ THE RULE AS IT STANDS — both conditions required

| # | condition | why it is there |
|---|---|---|
| 1 | the body is being **TRANSLATED** — by **one** touchpoint (in translation mode) **or two** (one on each body, which translate in either mode) | ⭐ the approach is a translation, so the readout must not appear where no approach is possible |
| 2 | centre-to-centre **distance below `SnapIsPossibleRadius`** (**`4L`** = 320 mm) | ⭐ condition A of the owner's original §2 |

⭐⭐ **WHAT WHITE MEANS, IN ONE SENTENCE**: *these two bodies are close enough to approach, and
the drag in progress could move them.* ⛔ The alignment is **not** part of it.

### ⛔⛔ THE ALIGNMENT CONDITION WAS ADDED AND REMOVED WITHIN THE DAY — and that is the entry worth reading

1. The first build hung the contours on **proximity alone**, in any movement mode.
2. A hand rejected it: *"the two touchpoint can translate (which is OK) and highlight both
   objects even if they are not aligned: this is NOK"*, then *"correction: that's also the case
   with single object translation: white contours cannot appear if objects are not aligned."*
3. I read that as **require the alignment**, recorded it as `D48`, and it did fix the symptom.
4. ⭐⭐ The owner then **removed the alignment and kept the translation condition**.

⛔⛔ **WHICH MEANS MY READING OF STEP 2 WAS PROBABLY WRONG ALL ALONG.** The complaint was made
against a build that had **no translation condition at all**, so *"the contours appear while
unaligned"* and *"the contours appear while rotating"* were **indistinguishable in the
evidence** — and the owner's own correction in step 2 named the alignment because that is what
was visible to him, not because it was the mechanism at fault.
⭐⭐⭐ `METHOD`, and this is a **new shape to carry**: *when two readings fit one device report,
say so and name both.* ⚠ I picked the stronger reading silently, and a whole rule plus a
decision id (`D48`) was built on it before the owner unpicked it. The cost was small only
because he caught it in hours.

⚠ `D48` is therefore **retired as a rule** and kept as a record. The white contours no longer
consult the alignment at all.

### ⚠ What condition 1 rests on, which was already true of the build

⭐ `scene.ts` sets the movement mode with `translatesOnDrag(objectsHeld, sessionMode)`:

* **one** touchpoint on a body translates it **only when the session mode is `TRANSLATE`**;
* **two** touchpoints on **two** bodies translate their respective bodies in **either** mode.

⛔ That function is now the **single** home of the rule — `scene.ts` and `highlight.ts` both
call it, where a second copy would have been two implementations free to disagree.
⚠ Two fingers on the **same** body are a holder plus a `SECOND` (roll/depth), not a pair.

### ⚠⚠ ONE CONSEQUENCE OF DROPPING THE ALIGNMENT, RECORDED BEFORE IT BITES

⛔ The alignment was the only thing that made a held **pair asymmetric** — it told the build
which body was *"the first object"*. Without it the subject is simply the first-pressed body.
✅ Harmless for the white contours, which outline **both** bodies either way. ⛔⛔ **It stops
being harmless the moment the approach does something directional with the subject** — slice
3's snap moves *the first object* toward the other. ⭐ At that point the pair needs an asymmetry
again, and the alignment is the obvious candidate, which is very likely what the owner meant by
*"we will see how to handle the alignment for the mate logic later on."*

### ⛔ WHAT THIS SLICE DELIBERATELY DOES NOT BUILD

⚠ **Highlights only.** No approach, no angle partition, no hold-off, no `SnapIsAuthorized`, no
snap, no mate, no break. ⭐ The previous attempt built two slices deep before a hand saw any of
it, and the first device look overturned a rule in the first slice.

### ⭐⭐ HOW TO JUDGE IT ON THE GLASS — and what falsifies each

⛔ The HUD prints the verdict and its reasons: `◆TR objectA↔objectB` when drawn, `◇tR` /
`◇Tr` when not. **T**ranslating, **R**ange; upper case = satisfied. ⚠ Two flags, not three —
the `A` for *aligned* was removed with the condition, because a flag for something that no
longer gates the contour is a readout that lies.

1. **Two bodies brought within 4L in TRANSLATION mode** ⇒ ✅ both outlined white, no alignment
   needed. ⛔ Falsified if nothing appears — that was `D48`'s behaviour.
2. **The same, in ROTATION mode, one finger** ⇒ ⛔ **no white.** ⭐ This is the one condition
   that survived, and the one that separates this build from the rejected one.
3. **Two fingers, one on each body, in ROTATION mode** ⇒ ✅ **white**, because two held bodies
   translate by construction.
4. **Release** ⇒ white goes. ⚠ A readout must not outlive the gesture.
5. **Carry one body away past 4L** ⇒ white goes, and returns on the way back in. ⛔ Falsified if
   it flickers at the boundary — that would mean the threshold wants hysteresis, which is a real
   finding and not a bug to paper over.
6. ⚠ **Which body is outlined when three are in range**: the target is the **nearest**, which is
   my choice and not the owner's (§6.1). Say if it picks the wrong one.

---

## 13. ⭐⭐⭐ `A17` — THE ALIGNMENT READOUTS, AND WHO IS ALIGNED TO WHOM (owner, 2026-09-17)

⚠ **This section is about the ALIGNMENT, not the approach.** It arrived alongside `A16` and is
kept separate because the two no longer share a condition — §12's white contours do not consult
the alignment at all.

### ⭐⭐ `A17.1` — EVERY ALIGNED BODY KEEPS ITS FOLLOWERFACE

> *"when an object is aligned, always maintain its FollowerFace highlighted (even if the
> touchpoints later select other objects) until its alignment is broken. This will help keep
> track of which objects are aligned even though the two touchpoints are on other objects"*

⛔⛔ **THE DEFECT WAS NOT THE LIFETIME — IT WAS THE CARDINALITY.** The highlight was already
tied to the alignment rather than to the press (defect 44 fixed that). ⚠ But there was exactly
**one** `selectedFace` record and **one** quad, so aligning a second body silently wiped the
first body's highlight — defeating the precise purpose the owner wants it for: *"which objects
are aligned"*, **plural**.

✅ **Now derived from the model, per body.** `alignedFaceOf(world, id)` reads the `FACE_ALIGN`'s
stored `localNormal` and recovers the face. ⭐ So there is **no lifetime to manage and no
cleanup path to forget**: the instant a shake, a re-tap, a rotation reset or an eviction drops
the constraint, the marker has nothing to draw.
⚠ `SIGNED`, not `|dot|`: `+x` and `-x` are one axis but two faces, and an `|dot|` test would
light the face on the far side of the body from the finger that made it, about half the time.

### ⭐⭐ `A17.2` — AND THE WHOLE BODY IS OUTLINED IN THE ALIGNMENT'S COLOUR

> *"when an object is aligned, on top of the blue or orange face, highlight the full contour
> with blue or orange"*

⭐ So an aligned body reads two ways at once: the **face** says *which face carries the
alignment*, the **body outline** says *this whole thing is aligned* — visible from any angle,
including one where the aligned face is turned away from the camera. ⚠ With `L × 2L × 3L` bodies
at arbitrary orientations that happens constantly, and the face quad alone can be invisible
while the body is still aligned.

⛔⛔ **IT IS DRAWN LARGER THAN §12's WHITE CAPTURE CONTOUR, ON PURPOSE.** Both are box outlines
on the same body, and a body can be aligned **and** captured at once. ⚠ At equal scale the two
would z-fight into a dashed mess and neither colour would be legible. ⭐ **1.06** for the
alignment against **1.02** for the white: they nest, and both read.

⚠ The colour is per body (`SNAPSHOT` cyan, `FOLLOW` amber), so a body aligned in `FOLLOW`
earlier keeps reporting `FOLLOW` after the fingers move on. ⛔ The **mode** is the one thing
that has to be remembered rather than derived — the constraint records *which face onto which
world direction*, never *by which gesture*.

### ⭐⭐⭐ `A17.3` — A SHAKE ON A PIONEER RELEASES **EVERY** FOLLOWER

> *"for each aligned object, track its pioneer object. If the said pioneer object is later
> shaken, the alignment of the aligned object shall be released … in case I have aligned one
> object and then another object to the same pioneer object: when I shake the pioneer object it
> shall release all the follower objects"*

⛔⛔ **TWO LIMITATIONS WERE REMOVED, AND NEITHER WAS A DESIGN CHOICE.**

1. ⚠ The old rule was gated on `alignMode === "FOLLOW"`, on the argument that `SNAPSHOT` got the
   same outcome for free — shaking while rotating turns the body, and a turned Pioneer releases
   a `SNAPSHOT`. ⛔ **That argument had a hole this file already admitted**: in `SNAPSHOT` with
   the mode on `TRANSLATE`, a shake turns nothing, so it released nothing. ✅ The rule is now
   unconditional and the hole is closed.
2. ⚠ It compared **one** `pioneerFace.objectId` against **one** `selectedFace`, so at most a
   single follower was ever released. ✅ The index is many-to-one, so all of them go.

### ⭐⭐⭐ `A17.4` — AND THE TRACKING IS BUILT TO SCALE

> *"make sure the tracking of pioneer and follower objects can be later scaled when there are
> several objects in the scene"*, and *"the pioneerFaces and FollowerFaces tracking shall be
> scalable"*

✅ `src/core/alignment_links.ts` — a **two-way index**, engine-free, 17 vectors.

| question | cost |
|---|---|
| *what is this follower aligned to, and on which face?* | O(1) |
| *which followers does this Pioneer own?* | O(followers of **that** Pioneer) |
| *which bodies are aligned at all?* | O(aligned), **not** O(scene) |
| *which Pioneer faces must be outlined?* | O(aligned), de-duplicated |

⛔⛔ **THE RENDER PASS IS THE ONE THAT MATTERED.** The highlight loop first walked
`world.objects.keys()` — every body in the scene, sixty times a second, to find the two that
were aligned. ⭐ `alignedObjects()` makes that cost the aligned set instead, and `prune` returns
what it dropped so retiring a released body's markers needs no second sweep either.

⭐⭐ **WHAT IS REMEMBERED AND WHAT IS DERIVED, because the asymmetry is the whole design:**

| fact | where it lives | why |
|---|---|---|
| the **FollowerFace** | ⭐ DERIVED from the constraint's `localNormal` | it is in the model; storing it would be a second source of truth |
| the **Pioneer's identity** | ⚠ remembered | a `FACE_ALIGN` stores a frozen world DIRECTION, not a reference to a body — deliberately, so an alignment survives the Pioneer moving away |
| the **PioneerFace** | ⚠ remembered | same reason; nothing in the constraint records which face was tapped |
| the **align MODE** | ⚠ remembered | the constraint records the geometry, never the gesture |

⛔ Everything remembered is **reconciled against the model every frame** (`links.prune`), so no
remembered fact can outlive the constraint that justifies it. ⭐ `METHOD`: *prefer the structure
that cannot express the defect.*

⛔⛔ **AND A TWO-WAY INDEX IS EXACTLY WHERE A LEAK HIDES.** The forward map is trivial; the
reverse set is what a re-align forgets to update. ⚠ The vector that matters most in that file is
*"re-aligning moves the link — the old Pioneer must LOSE it"*: without it, shaking a body a
follower is **no longer** aligned to would silently evict a live alignment. ⭐ The empty-set
cleanup is the other one — left out, the reverse index grows one entry per body that has *ever*
been a Pioneer.

### ⚠ WHAT TO LOOK FOR ON THE GLASS

1. **Align A to P, then B to P** ⇒ ✅ **both** A and B keep a coloured face **and** a coloured
   body outline, with the fingers anywhere. ⛔ Falsified if aligning B clears A.
2. **Shake P** ⇒ ✅ **both** A and B lose their alignment at once, in either mode. ⛔ Falsified
   if only the most recent one releases, or if it only works after a double tap.
3. **Align A to P, then re-align A to Q, then shake P** ⇒ ⛔ **A must NOT be released** — it is
   aligned to Q now. ⚠ This is the reverse-index leak, and it is the one a hand can actually
   feel as *"it un-aligned for no reason"*.
4. **Two bodies aligned to different faces of P** ⇒ two Pioneer contours. **To the same face**
   ⇒ one.
5. ⚠ **`SNAPSHOT` vs `FOLLOW` colours** should stay with their own bodies once the fingers move
   on — cyan and amber side by side if one of each.

### ⭐⭐⭐ `A17.5` — A TURNED PIONEER ACTS ON **ALL** ITS FOLLOWERS, INCLUDING THROUGH A CHAIN

> *"while the initial follower object is blue, if the pioneer object is rotated because it is
> aligned with another object, the alignment of the initial follower object shall be released"*
>
> *"the tracking shall enable a pioneer object to rotate all its follower objects which are
> orange"*

⛔⛔ **THESE TWO ARE ONE GENERALISATION, NOT TWO RULES.** `pioneerTurned` already returns
`RELEASE` for a **cyan** (`SNAPSHOT`) follower and `FOLLOW` for an **orange** one — it was being
asked **once**, about the single active alignment, against a single stored baseline. ⭐ Asked
**per link** it covers every follower of every Pioneer, and the chain falls out for free:

| step | what happens |
|---|---|
| Q turns | — |
| P is **orange** on Q | ⭐ P takes Q's rotation (`A17.5`, second clause) |
| F is **cyan** on P | ⭐ F's baseline for P breaks ⇒ **F releases** (first clause) |

⭐⭐ **AND THE BASELINE IS WHY IT IS CAUSE-AGNOSTIC.** Each link remembers the Pioneer's pose as
it last saw it. A Pioneer can be turned by a drag, a twist, a rotation reset, a slerp, or
another alignment's `FOLLOW` — comparing poses catches every one of them **without enumerating
any**. ⛔ `A15`'s discipline: *ask the state, not the gesture.*

⚠⚠ **ONE FRAME OF LAG IS POSSIBLE IN A CHAIN AND IS ACCEPTED.** Links are visited in insertion
order, so a follower visited before its Pioneer rotates sees the turn on the next frame instead.
⛔ It cannot be **missed**, because a link's baseline is only re-set *after* its verdict has been
acted on — which is precisely why this compares against a remembered pose rather than a
per-frame delta.

⛔⛔ **AND `pioneerOrientation` WAS DELETED, NOT LEFT BEHIND.** The single global baseline is
gone the same hour its replacement landed. ⚠ This file has paid for the other choice twice in
one day: defect 40 (`A12`'s retired roll detector, still fed, still holding a veto) and the
`faceExtent` bug (a corrected function written **beside** the broken one, which stayed wired).
⭐ *Deleted, not disabled.*

#### ⚠ What to look for on the glass

1. **Align F to P (single tap, cyan). Align P to Q (double tap, orange). Turn Q.** ⇒ P should
   rotate with Q, and **F should release** — losing both its face and its body outline.
   ⛔ Falsified if F keeps its alignment, or if F rotates too.
2. **Align two orange followers to one Pioneer, then turn it.** ⇒ ✅ **both** should rotate.
   ⛔ Falsified if only the most recent one moves — that was the old behaviour.
3. **Mix cyan and orange followers on one Pioneer, then turn it.** ⇒ the orange ones rotate, the
   cyan ones release, in the same instant.

---

## 14. ⛔⛔⛔ THE STALE-HIGHLIGHT BUG — one leak, two false reports (2026-09-17)

> *"the rotation of the pioneer currently removes the highlight of the pioneer but does not
> release the alignment of the cyan follower object. The bug is still here."*
>
> then, the clue that cracked it:
>
> *"if the highlight of the pioneer is toggled off, the shake on the cyan follower is not
> working any longer"*
>
> and *"the highlight bug also applies to the orange highlights"*

### ⭐⭐⭐ THE RELEASE WAS WORKING THE WHOLE TIME

⛔ The constraint **was** evicted, the link **was** removed, the Pioneer's contour **did** clear.
⚠ What failed is that the follower's own markers were never **hidden** — so the body still
*looked* aligned, and a shake on it then answered *"nothing to release"*, because it already
had been. ⭐⭐ **One stale quad produced two separate defect reports** and sent me hunting a rule
that was correct.

⭐⭐⭐ **AND THE SECOND REPORT IS WHAT SOLVED THE FIRST.** *"The shake stopped working"* is only
explicable if the alignment was already gone — which inverted the diagnosis in one sentence.
⚠ `METHOD`, worth carrying: **a second symptom that contradicts your theory is worth more than
a third that confirms it.**

### ⛔⛔ THE CAUSE WAS THE SHAPE OF ONE LOOP

```ts
for (const id of links.prune(...)) { hide markers }   // ⛔ only what prune dropped
```

⚠ `releaseAlignmentOf` **unlinks directly**, so `prune` never saw the body and nothing hid its
markers. ⛔ That affected **every** release that goes through it: the shake sweep, the re-tap,
the rotation reset, a turned Pioneer, and the new cycle guard.

✅ Now it hides by **set membership** — anything not in `alignedObjects()` this frame, whatever
removed the link:

```ts
const alignedNow = new Set(links.alignedObjects());
for (const [id, q] of followerQuads) {
  if (alignedNow.has(id)) continue;
  q.mesh.isVisible = false;
  q.contour.isVisible = false;
}
```

⭐⭐ `METHOD`: *prefer the structure that cannot express the defect.* Hiding what is no longer
wanted is correct without any cooperation from the paths that stop wanting it.

⛔⛔ **AND THE ASYMMETRY THE OWNER OBSERVED IS THE MOST DAMNING PART: I used the CORRECT pattern
for the Pioneer contours twenty lines below, and the wrong one for the follower quads, in the
same edit.** ⚠ That is exactly why the Pioneer's highlight cleared and the follower's did not.
⭐ One pool holds both cyan and orange followers, so the single fix covers both colours —
*"the highlight bug also applies to the orange highlights"* needed no separate change.

### ⭐⭐ WHAT THE HUNT LEFT BEHIND, AND IT IS WORTH MORE THAN THE FIX

⛔⛔ **THE RULE WAS A LOOP INSIDE `render/scene.ts`, SO NOTHING COULD INTERROGATE IT.** When the
report came there was no way to ask the code what it believed — only to re-read it, which I did
twice, wrongly. ✅ It is now `src/input/pioneer_cascade.ts`, engine-free, with **14 vectors**,
plus `tests/pioneer_release_wiring.test.ts` — **7 more** that compose the *real* model, the
*real* alignment construction, the resolver and the eviction, and assert the alignment is gone.
⚠⚠ **Both suites were green while the bug was live**, which is how the rule was cleared of
suspicion and the plumbing convicted. ⭐ `A7`'s gravity frame is the same story: every part
green, the composition untested.

✅ **AND THE HUD NOW PRINTS THE LINK TABLE**: `⭭ objectB>objectA/+x:C` —
`follower>pioneer/face`, `:C` cyan or `:F` orange. ⛔ With that line the report would have been
one look: *the link is gone and the highlight is still there.* ⚠ Four different causes — never
linked, pruned early, mode read as `FOLLOW`, turn under the epsilon — had produced the same
observation, *nothing happens*.

---

## 15. ⭐⭐ `A18` — NO CYCLES, AND THE TAP UNDOES INSTEAD (owner, 2026-09-17)

> *"a follower cannot become the pioneer of its own pioneer. in such case, the tap triggering
> this configuration shall instead break the initial alignment"*

⭐ `AlignmentLinks.wouldCycle(follower, pioneer)` walks the **whole** pioneer chain.
⚠ The owner named the two-body case — `F → P`, then `P → F` — which is what a hand reaches by
accident. ⛔ But `F → P1 → P2` then `P2 → F` is the same defect one link further out, and a
one-step check would wave it through.

⛔⛔ **A CYCLE IS NOT COSMETIC.** `resolvePioneerTurns` is a fixed point over these links, so a
ring of orange bodies would each take the other's rotation for ever. ⚠ Its cap exists to stop
that FREEZING THE GLASS — the worst failure this project can ship, because the screen simply
stops with no error. ⭐ `wouldCycle` makes the state unrepresentable; the cap stays as defence
in depth, and the guard's own walk is cycle-safe because it cannot assume the invariant it
exists to maintain.

⭐⭐ **BREAKING BEATS REFUSING, AND THE OWNER CHOSE IT.** A tap that did nothing would leave a
hand pressing the same face repeatedly with no feedback — `A15`'s orphaned-binding shape.
⛔ The tap is **CONSUMED**: letting it fall through would also flip translate/rotate, giving one
gesture two consequences, which is what the owner rejected when the automatic mode switch was
removed.

---

## 16. ⭐⭐⭐ `A19` — THE SCENE IS NOW A WORKBENCH (owner, 2026-09-17)

| body | position | dimensions | notes |
|---|---|---|---|
| grey `objectA` | (−200, 0, 0) mm | `L × 2L × 3L` | seeded rotation |
| blue `objectB` | (200, 0, 0) mm | `L × 2L × 3L` | seeded rotation |
| **orange `objectC`** | (0, **−240**, 0) mm | **`6L × 0.3L × 9L`** | ⛔ the **base plate**, square with the world, **FROZEN** |
| **pink `objectD`** | (0, 307, 160) mm | `L × 2L × 3L` | seeded rotation; took the position the plate vacated |

⭐ The three **parts** remain exactly **5L (400 mm)** apart pairwise. Plate footprint
480 × 720 mm, 24 mm thick, top face at −228 mm — a 148 mm clear gap under the parts.

### ⚠⚠ THE PLATE'S AXES: THE OWNER'S SENTENCE NAMED `Y` TWICE

> *"dimensions: 6L, 9L, 0.3L … respectively in the world X, Y and gravity axis"*

⛔ `WORLD_DOWN` is `[0, −1, 0]`, so **the gravity axis IS world Y**. ⭐ Only one reading yields a
*base plate*: `0.3L` is the THICKNESS and must lie along gravity, leaving the `6L × 9L`
footprint on the two HORIZONTAL axes — **X and Z**. ⚠ Taken literally it would be a 9L-tall wall
0.3L deep. ⛔ Flagged rather than silently chosen; the wall is one line away if that was meant.

### ⚠ TWO CONSEQUENCES OF THE NEW SCENE, RECORDED BEFORE THEY SURPRISE ANYONE

1. **The plate is in capture range of `objectA` and `objectB` at rest** — 312 mm centre to
   centre against the `4L` (320 mm) radius. ⭐ So picking either part up in translation mode
   shows white contours against the plate immediately. ⚠ That may be exactly right for docking
   onto a base, but it undoes the *"nothing in range at rest"* property the 5L spacing bought.
2. **Four bodies means 11 barycentre candidates** (`2⁴ − 4 − 1`) against a
   `maxBarycenterCandidates` cap of **8**, so the orbit-centre candidate set is now truncated.
   ⛔ It does not throw; the camera may simply pick a centre a hand would not expect.
   ⚠ `?maxBarycenterCandidates=16` to see them all.

### ⭐⭐ DIMENSIONS ARE NOW PER BODY, WHICH THE PLATE FORCED

⛔ They were one shared constant, and **five** things read a body's size: the mesh, its faces,
the white capture contour, the alignment contour, and the face-marker extents. ⚠ A single
constant would have drawn all five of the plate's markers at a part's size, on a body seventy
times the volume. ⭐ The two **shared** capture contours are scaled when they are PARENTED, not
at creation — they move between bodies of different sizes, and a size baked in at construction
is the same bug in its second form.

---

## 17. ⭐⭐⭐ `A20` — `frozen`: THE TRANSFORM CANNOT CHANGE AND THE BODY CANNOT BE A FOLLOWER

> *"create an attribute frozen which means that the object transform cannot be modified and the
> object cannot be a follower and apply this attribute to the orange base plate"*

✅ `SceneObject.frozen?: boolean`, in `core/object_model.ts`, with **6 vectors**.

### ⛔⛔ IT IS AN INVARIANT AT THE TWO WRITERS, NOT A RULE AT THE CALL SITES

| writer | behaviour when frozen |
|---|---|
| `setWorldPlacement` | ⛔ returns the world **unchanged** |
| `pushObjectConstraint` | ⛔ returns the world **unchanged** |

⚠ **A DOZEN THINGS MOVE AN OBJECT HERE** — rule 6, depth, the approach, a snap, the sway, an
alignment slerp, a `FOLLOW` cascade — and asking each to check a flag means **the next one added
will not**. ⭐ `METHOD`: *a constraint enforced at the one place the quantity is stored is an
invariant.* The hold-off learned this the hard way earlier the same day.

⭐⭐ **WHY BOTH HALVES ARE ONE ATTRIBUTE AND NOT TWO FEATURES**: a plate that could be aligned to
something would be **moved by that alignment's solve**. ⛔ So *"cannot be a follower"* is the
same guarantee reached through the constraint stack instead of through a placement — which is
why the refusal belongs at `pushObjectConstraint` and not at the tap.

⭐ **Refused, not thrown.** This runs inside a render loop; a throw would take the scene down
for a finger resting on the base plate.

⚠ **A frozen body is still a perfectly good PIONEER.** That is the whole point of a base plate:
everything aligns *to* it, and nothing aligns it. ⛔ The tap path also checks and reports
(`"objectC is FROZEN — it cannot be a follower"`) — **not** for the guarantee, which the model
already holds, but so the HUD can SAY so. ⚠ A tap that silently did nothing is the shape this
file has been burned by twice in one day.

⚠ `frozen` is **optional**, and absent means free. ⛔ It was added to a live model with 40+
green vectors; if absence had read as frozen, every body in the game would have stopped at once.

### ⚠ WHAT TO LOOK FOR ON THE GLASS

1. **Drag the plate** ⇒ ⛔ it does not move, in either mode, with one finger or two.
2. **Hold a part, tap the plate's top face** ⇒ ✅ the part aligns to the plate (it is a Pioneer).
3. **Hold the plate, tap a part's face** ⇒ ⛔ no alignment, and the HUD says `FROZEN`.
4. **Shake the plate** ⇒ ✅ it still releases every follower aligned to it — a frozen body owns
   followers like any other Pioneer.
5. ⚠ **Depth and roll on the plate with a second finger** ⇒ ⛔ nothing, for the same reason: they
   reach a placement through the same writer.

---

## 18. ✅ `A21` — THE NEAREST OBJECT WINS, AND IT IS NOW THE OWNER'S RULE

> *"when an object is in the distance of two other objects the highlight shall be towards the
> object which is closest (mark in the md files that this will be later modified with distances
> between faces)"* — the owner, 2026-09-17

⭐⭐ **THIS PROMOTES A DECISION OF MINE INTO A RULE OF HIS, AND THAT MATTERS.** §6.1 recorded
*nearest* as **my** choice with the owner's answer outstanding — so any device report about the
wrong body being highlighted would have been ambiguous between *a bug* and *a design I picked
without asking*. ✅ It is now decided, and `nearestCapture` already implements it.

⚠⚠ **`CENTRES-FOR-NOW` — MARKED, AS ASKED.** *"this will be later modified with distances
between faces."* ⛔ Every place that would change carries that exact word, so the switch is one
search: `core/proximity.ts`'s header, `centreDistance`, and `nearestCapture`.

⛔⛔ **AND IT IS NOT A FREE UPGRADE — the note is worth more than the marker.** Face distances
reintroduce a quantity that **collapses at contact**: the direction between two faces shrinks to
noise exactly where precision matters most, which is the whole reason `D46` replaced the earlier
`TargetPosition` design with centre-to-centre (§1, §5.1). ⭐ So whatever replaces this will need
the hold-off to keep its direction alive. ⚠ The base plate makes the case concrete and urgent: a
`6L × 0.3L × 9L` body has its centre 3L from its own top face, so **by centres it reads as far
away while a part is resting on it** — measured face to face it would read as touching. ⛔ That
is the strongest argument yet for the migration, and it arrived with the plate.

### ⭐ The tie rule stands, and costs nothing

⚠ Two bodies at the same distance keep the **incumbent** — hysteresis by memory rather than a
second threshold, so no tunable and one sentence of rule. ⛔ Without it the target would swap
every frame as the last bit of a float wobbled, and the target drives a highlight.
