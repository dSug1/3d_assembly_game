# THE APPROACH SWING — a trial on branch `1.0.18-`

> **STATUS** · trial, unjudged · **OWNS** · the camera lean during a Follower's approach
> **READ IF** · you are judging this branch, or deciding whether to keep or discard it
> **LAST VERIFIED** · 2026-09-19 — boot scene AND the swing confirmed on the tablet by a synthesised
> drag; ⚠ the FEEL (amplitude, whether it helps) has had no finger

⚠⚠ **THIS IS A TRIAL AND IT IS MEANT TO BE DISCARDABLE.** The owner: *"Let's try a fork of the
build here … If the trial is not successful, I will just discard the branch later on."*
⛔ It is **not a flag** — `D28` and `D40` deleted the last of those, and a dormant fork is a trap.
**The branch is the fork.**

## The owner's dictation, verbatim

> *"From the case where the Pioneer object is pinned:*
> * *Setup boot scene: 2 of the 3 non-frozen objects are aligned on the gravity axis and on the
>   depth axis of the camera at boot. There is one Pioneer (on the left) and one Follower (on the
>   right). Set that up at boot for this fork.*
> * *The user will bring them close to each other by translating the Follower on the camera x
>   horizontal axis.*
> * *When the offset radius is crossed (= white highlights toggle on), the following occurs:*
>   * *A — a snapshot is done of camera transform … because we will orbit the camera during the
>     further move of the object*
>   * *B — while the translation of the Follower continues with the same user dx delta position
>     movement, the camera orbits opposite to the dx movement. The dx delta position movement
>     continues to translate the Follower on the same original axis (i.e. the axis is not updated
>     by the camera orbit). When the offset is half what it initially was, the camera orbit
>     reverses so the camera aims at coming back to its original orbit. When the offset is null
>     (contact of both objects), the camera shall be back to its original position when the offset
>     was initially triggered."*

## ⭐⭐ One requirement needed no work at all

⛔ *"the axis is not updated by the camera orbit"* — **already true, by construction.** Rule 6
translates along `grip.frame`, which is latched at the PRESS, and `scene.ts` says so in the line
above the code: *"an orbit that happens mid-drag cannot redefine which way `right` is."*
⭐ Worth stating, because it is the requirement that would have been hardest to add and the one a
reader would assume was the new work.

## ⛔⛔⛔ The one deliberate departure: an OFFSET, not a snapshot-and-restore

The owner described **A** as a snapshot of the camera, restored at contact. ⚠ What is built is an
**additive yaw offset** that is zero at `p = 0` and zero at `p = 1`. Three reasons:

* a restore **fights the hand** — orbit the camera yourself mid-approach and it would be yanked
  back to where it was before you did;
* a restore **has to run**, so a dropped frame, an early release or a body that never reaches
  contact each leave the camera somewhere nobody chose;
* an offset that is zero at both ends **cannot** leave it anywhere.

⭐ `LESSONS_CARRIED`'s own shape: *make the bad state unrepresentable rather than guarded.*
⚠⚠ **THE COST, STATED**: if the hand orbits during the approach, contact returns the camera to
**its own orbit**, not to the snapshot. That is a real difference from the dictation and it is
**the first thing to judge**.

## What the swing is

`swingYawRad = sign × amplitude × sin(π · p)`, where `p = clamp((g0 − gap) / g0, 0, 1)` and `g0` is
the surface gap **latched** at the trigger.

* ⭐ **A half sine, not a triangle.** Both peak at half and end at zero; the sine's angular
  *velocity* is continuous at the reversal, where a triangle knocks exactly as the hand
  concentrates on the last millimetres. ⚠ A hand may disagree — it is one line, and a vector
  measures the slope so the two cannot be confused again.
* ⛔ **Exactly zero at both ends.** `Math.sin(Math.PI)` is `1.2246e-16`, and *"back to its original
  position"* deserves to be a fact rather than a near-miss.
* ⛔ **`g0` is latched.** `captureOffsetM` is recomputed every frame from the camera distance
  (`D49`) and the swing is about to move the camera — a live offset would make the progress depend
  on the swing the progress drives. ⚠ A yaw-only lean keeps the orbit radius constant so it would
  not drift *today*; the latch keeps that true if the swing ever gains a radial component.
* ⚠ **Backing off past the trigger returns to zero and stays there** rather than swinging the
  other way.

## The boot scene

⭐ `objectA` (left) is the **Pioneer**, `objectB` (right) the **Follower**, aligned at boot in
`SNAPSHOT` — confirmed on the tablet: amber outline left, cyan right.
⛔ **Both bodies boot SQUARE**: `bootRotations[0]` and `[1]` are no longer applied, because two
arbitrarily turned bodies have no parallel faces and the pair could not start aligned.
⛔ The aligned faces are both `+x`, chosen **by normal and never by face id** (`D50`), and chosen
as the *already-parallel* pair so the boot pose is not disturbed — the facing pair (`+x` / `−x`)
would have spun the Follower 180° on frame one, which is §5.2's consequence of parallel-over-mate.

## ⛔⛔⛔ THE FIRST BUILD DID NOTHING, AND THE REASON IS THE LESSON

> *"not working. the camera does not orbit."* — the owner, minutes after it shipped

⚠⚠ **THE LAW WAS RIGHT AND THE WIRING WAS ABSENT.** `applyCamera()` is called by **camera**
events only — the reset, startup, a pinch, a slider and the orbit drag. ⛔ An approach is a finger
translating an OBJECT, during which not one of them fires. So `swingYawNow()` was recomputed every
frame, correctly, and never written to the glass.

⭐⭐ `METHOD`: *a rule that is never called is indistinguishable from a rule that is wrong* — and
only the glass can tell them apart. `approach_swing.ts` had eleven green vectors throughout, and
every one of them still passed, because `scene.ts` is the render layer and nothing vectors it.
✅ Fixed by driving it from the render loop, comparing against the last APPLIED value so the camera
is written only on frames where the lean actually changed.
⚠ Skipped while the camera reset is flying home: that animation writes the whole pose every frame
and two writers would fight, with the reset winning by arriving second.

## ✅ MEASURED ON THE TABLET (a synthesised drag over CDP)

| | camera |
|---|---|
| trigger, `gap=162/172mm` | on its own orbit — plate a symmetric trapezoid |
| half, `gap=76mm` | **visibly swung** — plate seen from an angle, both bodies showing their sides |
| capture lost | **exactly back** — frame indistinguishable from the trigger |

⭐ Done with `?captureOffsetMm=40`, because at the default the trigger is more than a screen-width
of finger away on this scene — worth knowing before judging by hand.

## ⚠ What has NOT been judged

⛔⛔ **The swing has had no finger on it.** The boot scene is confirmed by screenshot; the lean
itself, its amplitude and its feel are entirely unjudged. `approachSwingDeg` defaults to **25°**
and that is a **guess** — in this project a guessed number has been wrong every single time.
✅ **`0` on the slider disables the whole mechanism**, which is how to A/B it by finger in the same
minute on the same scene — the comparison that settled `D28` and `IN13`.

## To discard the trial

Delete `src/input/approach_swing.ts` and `tests/approach_swing.test.ts`, restore the two
`bootRotations` arguments in `scene.ts`, delete `bootAlignment` and its one call, the `swing` /
`lastTranslateRightPx` declarations, `swingYawNow`, the arming block in `refreshHighlight`, the
`approachSwingDeg` tunable and its slider, and the `yawOffsetRad` parameter on `OrbitController.pose`.
⭐ Nothing else depends on any of it.
