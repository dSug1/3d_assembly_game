# INPUT SYSTEM — revision 5 (the owner's specification)

> **STATUS** · ⭐ live — the DESIGN OF RECORD for the touch input system
> **OWNS** · every gesture rule, and the terms the rest of the project uses for them
> **READ IF** · you are building or changing anything a finger touches
> **SOURCED FROM** · the owner's `input-system-v5.md`, supplied 2026-09-13
> **LAST VERIFIED** · 2026-09-13

⛔⛔ **THIS IS THE OWNER'S DOCUMENT AND IT IS NOT REWRITTEN.** It is reproduced below
between `VERBATIM` markers, unchanged apart from repairing mojibake from the original
file's encoding (`â` → `—`, `Â§` → `§`). Findings ABOUT it — including where the
build already had to depart from it — go in
[`../INDEX.md`](../INDEX.md), never inside the block.

⚠ Section numbers (`§1.3`, `§6quater`, …) are referenced throughout the code and the
queue. They are stable; do not renumber.

<!-- VERBATIM-BEGIN -->
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

<!-- VERBATIM-END -->
