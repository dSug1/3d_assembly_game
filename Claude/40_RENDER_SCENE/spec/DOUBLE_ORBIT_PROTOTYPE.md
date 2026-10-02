# The double-orbit camera — a PROTOTYPE (branch `1.0.58b-` only)

⛔⛔ **THIS FILE EXISTS ON THE PROTOTYPE BRANCHES ONLY.** Today `1.0.58b-` (2026-10-01, from `1.0.58a-` at `40aa812`, itself
from `1.0.58-Trial-with-double-orbit`); never merged into `main` or the fork — the main line is merged INTO it, one way.
⭐ `/proto/` builds the branch the repository variable `PROTO_BRANCH` names (`1.0.58b-` since 2026-10-01); a deploy is
**Run workflow** on `main` (or any push to `main`), never a push to the prototype branch. It is deployed beside the main line at
**https://dsug1.github.io/3d_assembly_game/proto/** (`50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md`, *A second build at /proto/*).
⛔ Its work takes **no `D`-number** (the fork's run on); its vectors are `tests/proto_green_box.test.ts`, its comments say
*prototype (green box)*. ⛔ **Unjudged by a hand except where marked.**

## 1. The idea

The orbit gestures no longer move the camera. They move a **green proxy box** around the orbit centre, and the camera
**follows the box on its own orbit**, a little behind and beside it — so a drag reads as steering something in the scene,
and the camera catches up the way a third-person camera does (Zelda's Z-targeting was the reference the owner named).

## 2. The green box

* **Size** — the smallest YELLOW piece's coloured core by volume (`Scene_1`: `Piece6`, 65 × 37 × 30 mm;
  `input/green_box.ts` `smallestOfColour`, `sizeM`). A scene with no yellow body has no box, and the camera is the rig's as
  before.
* **Placed by the orbit rig** — at the rig's yaw, elevation and zoom (`orbitOffset`, with `clampCameraRadiusM`'s factor).
  `applyCamera` (`render/camera_rig.ts`) writes the box's place and NOT the camera when a box exists.
* **Inverted inputs, per-axis gains** — the orbit drag is `drag(−dx · boxGainYaw, −dy · boxGainPitch)`
  (`render/pointer_wiring.ts`). ⭐ Defaults: **yaw 1.65**, **pitch 0.5** (sliders 0.05–2).
* ⭐ **Slower inside the leash** (2026-10-01: *"reduce the gains while the green box is within the leash zone … but maintain
  the orbit speed when it is beyond"*): per axis, both gains × `leashGain` — `boxGainInsideLeash` (**0.35**, the owner; slider 0.05–1 step
  0.05) with the box right in front of the camera, ramped smoothly (smoothstep) to ×1 at the leash edge and beyond; no step at
  the edge (`input/follow_camera.ts` `boxDragGains`). ⚠ With a 3° leash the slow zone is ~0.6 mm of finger at full gain.
* **Eased after the rig** — the box approaches the rig's pose exponentially (`easeOrbit`, `boxSmoothMs` **60 ms**): the
  pointer events come every 47–68 ms on the tablet against 16–40 ms frames, so a box written straight from the rig moved in
  steps while the camera, smoothed, did not (*"why is the camera fluid and the box jerky?"*).
  ⭐⭐ **Now on a critically damped SPRING** (2026-10-02: *"the camera lag at 30 ms create jitter in the green box
  visualization"*): one exponential gave the box a speed that JUMPS at every pointer event, so its speed pulsed at the event
  rhythm; with a camera time lag the gap box − camera is that speed × the lag, and the box wobbled on the glass. A spring has
  no speed jump (`springOrbit`, τ = `boxSmoothMs` / 2 — the same response time). Simulated, steady drag, an event every 3–4
  frames: the gap's ripple drops ~2.5–3× at every lag; a smoother CAMERA made it slightly worse. `easeOrbit` is kept, unwired.
* ~~Billboarded~~ — ⛔ **no longer billboarded** (2026-10-02, §6: *"remove the billboarding"*); no parent.
* ⭐ **Solid to the finger** (2026-10-01): *"when I click on the green box, the raycast hits the piece behind"* — it was
  unpickable, so the ray went through it. Now it is PICKABLE, so the ray stops on it, and `throughGreenBox`
  (`input/green_box.ts`) turns that hit into a MISS at every pick the router reads: a press on the box is empty space —
  it orbits — and the box is never held, aligned or steered.

## 3. The camera's orbit

* ⭐⭐ **`Scene_1`'s rings on this branch — a symmetric WAIST** (the owner, 2026-10-02: *"the shape shall be a waist: top ring =
  1.7 m radius, … middle ring = smallest possible radius, height = 0, bottom ring = 1.7 m radius … propose the three missing
  parameters so that the 2D curve through the three ring points can be smooth"* → *"apply"*): top **1.7 / +1.05 m**, middle
  **0.25 / 0 m**, bottom **1.7 / −1.05 m** (radius / height) — pitch ±31.7° at the outer rings.
  * ⛔ **Why the old rings made a STAIR** (top 1.7 / 0.5, middle 0.2 / 0, bottom 0.9 / −0.4): the path left the middle ring
    straight UP, turned ~65° within a tenth of the climb, then ran out on a shallow straight ramp — and 4.5× faster. The waist
    forces a vertical tangent at the middle ring (the radius turns there), and a 1.5 m radius change over 0.5 m of height
    leaves no room to turn gently. No ellipse can pass through a waist (on an ellipse the radius never dips in the middle).
  * ⭐ **0.25 m** — the smallest that keeps the green piece out of the painting at boot zoom 1.5 (1.5 × 0.25 = 0.375 m from the
    axis; the painting reaches 0.30 m, the piece ~0.06 m more). ⭐ **±1.05 m** — smoothness comes almost all from the HEIGHTS
    (a taller waist turns more gently), and 1.05 is the tallest under the 3 m camera clamp at zoom 1.5 (√(1.7² + 1.05²) = 2.00 m
    × 1.5): a clamped ring would be a corner of its own. Symmetric, so the height runs evenly through the middle.
  * Measured: the tightest turn has a curvature radius ~0.19 m (0.04 m before), the speed varies ~2.1× along the path (4.2×
    before). ⚠ ±1.45 m would turn twice as gently but needs the boot zoom ≤ 1.34. ⚠ The bottom ring at zoom 1.5 is 1.6 m below
    the centre — far below the floor (hidden; `D196`'s contour). Vectors in `tests/proto_green_box.test.ts`.
* ⭐ **It BOOTS on the TOP ring** (`bootView: "TOP"`, *"boot scene 1 on the top ring"*) **at zoom 1.5** (`bootZoom`, slider
  *boot zoom* at the top of CAMERA, 0.5–10 step 0.1 — applied at once, and the camera reset's view; `0` restores the derived
  half-radius rule, which made ×7.5 with these rings and capped the box at 3 m over most of its travel).
* **The box's distance from the centre** at zoom 1.5: **3.00 m** on the top and bottom rings, **0.375 m** on the middle (with
  the waist; it was 1.55 / 0.30 / 1.48 m). A zoom scales the whole surface, and the box is always kept within **0.15–3 m** (`clampCameraRadiusM`); each
  ring can reach both ends, but not under one zoom (out fully on the top ring is ×2.9 — the middle ring then 0.58 m).
* **Its own angles** (`input/follow_camera.ts`, `CameraOrbitState`), stepped every frame before the draw
  (`render/green_box_wiring.ts` `greenBoxFrame`).
* **Its distance = the box's CURRENT distance + `cameraRadiusOffsetMm`** (**1250 mm**, the owner 2026-10-01; slider 100–2000 step 50). ⛔ It was
  twice the box's ring point, then twice the box's distance: lagging in pitch, the box could come near the camera and leave
  the screen.
* **Offset angles** — the camera sits at its own angles **plus** `cameraYawOffsetDeg` **3°** and `cameraPitchOffsetDeg`
  **2°** (sliders −45..45, −30..30), so the box does not hide the yellow target. Pitch is clamped to ±89°.
* **It LOOKS AT the orbit centre** — the yellow marker — never at the box (`setTarget(orbitCentre)`).
* ⛔ The yellow marker is placed at BOOT on the orbit centre (it sat at the origin until the first orbit, since `D169`).

## 4. How the camera follows — per axis, yaw and pitch alike

1. **While the input MOVES: the LEASH** (`cameraLeashDeg`, **0°** — the owner, 2026-10-02: 1.5°, then 0.5°, 0°, 0.05°, back to 0°; was 3°; slider 0–60 step 0.05).
   ⚠ At 0 the camera is pinned straight behind the box while the input moves: the box never drifts on the glass, the
   inside-leash gain has no zone to act in (×1), and only the glide after a stop and the release catch-up remain.
   ⭐⭐ **AND A TIME LAG ON TOP** (the owner, 2026-10-02: *"lag the camera orbit behind the green piece orbit in whichever orbit
   direction … create time lag with slider on top of leash"*): the leash (and the glide, the catch-up) says where the camera
   SHOULD be; the camera EASES toward that, exponentially (`cameraLag`, `input/follow_camera.ts`; CAMERA › *camera time lag
   behind the green box*, `cameraFollowMs`, **0** by default — the owner, 2026-10-02, was 150 ms; 0–1000, 0 = none). A faster orbit opens a wider gap, in whichever
   direction, and it closes by itself once the orbit stops. Inside it the camera does not turn; past
   it, it is dragged along exactly the leash behind the box.
2. ⭐⭐ **"Moving" is the FINGER's own verdict**, per axis — the orbit finger's `MotionTracker` (§1.1's deadband and the
   device-derived rest window, `D86`): its x drives yaw, its y pitch. ⛔ Read per frame from the rig's change, every frame
   between two pointer events looked like a STOP: the camera glided toward the box, the next event put it back on the leash,
   and at some drag speeds **the box jittered** (the owner, 2026-10-01). With no finger (a reset, the demo, a pinch) the
   rig's own change is read.
   ⛔⛔ **And a change of the rig counts too**, held for the finger's rest window: the rig turns on the RAW finger (~5° of
   yaw per mm), the verdict is deadbanded (3.5 mm), so inside the band the camera stood still while the box turned ~18°,
   then the leash pulled it ~15° in one frame — *"a big jump and the green box recenters horizontally"* (the owner,
   2026-10-01, at the top and bottom rings, where the box's radius is largest and nothing else moves).
   ✅✅ Judged on the device — the owner, 2026-10-01, build `ffe66d6`: *"deadband fix is tested and OK"*.
3. **Inside the leash, a camera still carrying speed SHEDS it** (`COAST_MS` 80 ms, exponential) and never passes the box —
   the polish: an interrupted glide does not stop dead.
4. **When the input STOPS: the glide** — the camera continues the speed it had and brakes **exponentially** onto where the
   box ends, `τ = D / v₀` (so the starting speed is exactly the camera's). ⛔ The fixed settle time and its slider were
   removed (*"the time to settle should not be fixed"*); `cameraSettleDelayMs` stays at **0**.
5. ⭐ **A camera AT REST inside the leash STAYS** after a stop (the owner: *"when the box is still inside the leash, do not
   rotate the camera"*) — except at a release:
6. ⭐⭐ **THE RELEASE CATCH-UP** (2026-10-01): *"when the input touch/click is released, the camera shall catch up to the
   original offset even if the green box is inside the camera leash range."* When the orbit finger lifts (or a second finger
   ends the orbit), both axes realign. A camera already moving keeps its glide (step 4); a camera AT REST starts from zero
   speed on a critically damped spring, `s = D(1 − (1 + u)e^(−u))`, `u = t / τ`, `τ = cameraCatchUpMs` (**120 ms**, ~0.5 s
   to arrive; slider *camera catch-up after release, from rest*, 20–1000) — no jump in speed, no overshoot. A new input ends
   the realignment.
7. Yaw is compared the short way round.

## 5. Known gaps

* ⏳ **COMBINE THE FOUR GAINS — later** (the owner, 2026-10-01: *"write in the md files to combine the four gains later on"*).
  The box's yaw is `gainOrbitYaw` (CAMERA, 0.054 rad/mm) × `boxGainYaw` (1.65), its elevation `gainOrbitElevation` (0.02/mm,
  along the ring surface) × `boxGainPitch` (0.5): two sliders per axis that do ONE job, and the camera has no gain of its own
  (it follows the box). ⭐ To do: one gain per axis for the box — yaw in °/mm (today 5.1), pitch in °/mm of ANGLE rather than
  of the ring surface (a pitch per `v` that varies with the rings: on `D131`'s rings v 0.7 → 0.95 was only 15.8° → 16.5°) — and the
  main-line orbit gains left to the main line. `boxGainInsideLeash` stays a multiplier on top.
* ⛔ **The demo's camera path drives the BOX, not the camera** — `20_GAME_RULES/spec/DEMO_SCENE.md` §7 and its fixes §9.
* ⚠ Every default above is a guess with a slider unless the owner set it: the owner set the yaw gain, both angle offsets,
  the radius offset (1250 mm), the leash, the settle delay, the inside-leash gain (0.35), the rings, the boot ring and zoom;
  the pitch gain, the box smoothing, `COAST_MS` and the catch-up are mine.
* ⭐ **Judged on the device**: the deadband fix only (`ffe66d6`). Built and deployed, ⛔ unjudged: the release catch-up, the
  box solid to the finger, the inside-leash gain, the rings, the boot ring and zoom (`/proto/` at `40aa812`, 2026-10-01).
* ⭐ The main line's `D195` (no depth ceiling inside a play volume) is merged in — it mattered more here, where the camera
  sits the radius offset behind the box and a piece behind the painting was beyond 3 m.

## 6. Game rules tried on this branch only

* ⭐⭐⭐ **A PIECE IN ITS GOAL CANNOT BE MOVED** (the owner, 2026-10-01: *"any piece which is in its goal transform cannot be
  moved (translation or rotation) … don't delete the methods, just disable them, as we may re-enable them later on"*;
  ⛔ unjudged by a hand). "In its goal" is the COMMITTED status (`D189`'s `GoalCommit`, the `goal n/41` the player reads):
  a piece dragged into its goal is free until its action completes, then locked — so in `Scene_1` the 36 pieces placed at
  boot are locked from the start. ⭐ The owner's answers:
  * a drag ON it — first finger, second finger, steering, mouse — moves and turns nothing (`pointer_wiring.ts`'s holder
    gate, `drive.ts`'s `applyDepthDrag`); the HUD says `PieceN is in its goal — locked`; no model change, so no episode;
  * ⛔ it cannot be a FOLLOWER (`alignment_wiring.ts`) — the turn would take it out; it stays a PIONEER;
  * it can still be pressed (a HitFace, a Pioneer) and undone (a double tap may take it out — then it is free again);
  * it is still CARRIED by its seated assembly when another member is dragged — only a drag on it is refused.
  ⭐ The rule is `input/goal_lock.ts` (`goalLocked`); **OBJECT TRANSLATION › *lock pieces in their goal*** (`lockPlacedPieces`,
  1 / 0) re-enables every gated method. Vectors: `tests/proto_goal_lock.test.ts`.
* ⭐⭐ **WHERE A PRESS PUTS THE YELLOW ORBIT TARGET** (the owner, 2026-10-01; ⛔ unjudged by a hand) — vectors
  `tests/proto_orbit_target.test.ts`:
  * **First touch or LEFT button on a piece locked in its goal** → the target jumps to the point where the ray hits it
    (`orbitTargetOnPress`, `input/goal_lock.ts`). ⛔ Not the right button (the mouse's HitFace — the adapter's own re-issued
    press, `isTrusted` false), not a second touch, not a free piece; tied to the lock (`lockPlacedPieces = 0`: it drags).
  * ~~On empty space or a frozen body → the midpoint of the two piece centres nearest the ray (`nearestPairCentre`)~~ —
    ⛔ **switched OFF 2026-10-02** (*"a press on empty space or frozen object or green piece does not change the yellow orbit
    center position. Only a press on placed object changes the yellow orbit center position."*): `EMPTY_PRESS_MOVES_TARGET =
    false` (`input/goal_lock.ts`) — the code stays, `true` restores it. Such a press still orbits.
  * ⭐ **The pink ring at the BOOT target** (*"display the pink ring at the boot"*, 2026-10-02): the boot target sits behind the
    painting's panel, so pieces in front hid it. Until a press on a placed piece first sets the target (`targetSetByPress`),
    a piece in front makes it TRANSLUCENT instead of hiding it (`pinkRingVisibility`'s `bootTarget`).
  * As before, the marker JUMPS and the camera MIGRATES to it by the orbit finger's travel (`OrbitCentreBlend`).
* ⭐ **And a drag from a piece locked in its goal ORBITS** (*"allow the orbit to occur when first touch or left click is
  pressed and hold on placed piece"*): the one finger on it drives the orbit exactly as on empty space (`orbitDragStep`,
  shared by both); the piece stays pressed (a HitFace, a Pioneer, an undo). The green box's camera hears that finger as
  the orbit finger (`green_box_wiring.ts`), or every frame would read as a release.
* ⭐ **The yellow target is always visible** (*"not occluded by any object"*): drawn in rendering group 2 — after the
  bodies, the depth cleared, as the cursor rings are.
* ⭐ **The HitFace's fuchsia contour is toggled OFF** (the owner, 2026-10-01: *"toggle off the fuchsia highlight (hitface) -
  don't delete the method"*): `showHitFaceContour` ships **0**; **FACE ALIGNMENT › FOLLOWERFACE › *HitFace fuchsia contour***
  (1 / 0) draws it again. Only the DRAWING is gated (`render_loop.ts`) — the HitFace itself, its alignment and the HUD's
  readout are unchanged.
* ⭐⭐ **THE PINK RING AT THE YELLOW TARGET** (the owner, 2026-10-02; ⛔ unjudged by a hand): billboarded, the amber gizmo
  ring's size on the glass (`GIZMO_RING_PX`), at the target (`pinkRingFrame`, `render/green_box_wiring.ts`). Drawn on top, and
  WHAT hides it is decided each frame by the camera's ray to the target (`pinkRingVisibility`, `input/green_box.ts`): a piece
  in front HIDES it, only the green piece in front makes it TRANSLUCENT (alpha 0.35), frozen bodies never count, and the piece
  the target sits on (met within 2 mm of it) does not hide it. ⚠ All or nothing — a piece covering half the ring hides or
  shows it whole, by its centre.
* ⭐⭐ **THE GREEN PIECE IS A PYRAMID** (the owner, 2026-10-02: *"replace the green box by a green trapezoidal pyramid (same
  type as the one in scene 0). Dimensions = 150 % dimensions of the piece 17"*, then *"divide the height of the green piece by
  2"*, then *"reduce the length of the green piece by 25%"* — read as its longest side, the width): Piece17's core
  (92 × 55 × 30 mm) × 1.5, the height halved, the length −25 % → **103.5 × 41.25 × 45 mm**, its top tapered to half
  (`OBJECT_TOP_SCALE`, `taperMesh` — `Scene_0`'s pyramid; `greenPyramidSizeM`). ⭐ **Not billboarded** (*"remove the
  billboarding"*, 2026-10-02): it keeps the world's axes — width along x, the tapered height up y, depth along z. Still a
  press on it is empty space. A scene with no Piece17 has none. ⛔ `smallestOfColour` (the first box) is declared unwired.
* ⭐ **The HUD's `green` line**, right after `motion` (the owner, 2026-10-02): the green piece's distance to the YELLOW target
  (the marker — where the centre is going, not the blend in progress), `greenReadout`.
* ⭐ **The yellow orbit centre is HIDDEN** (the owner, 2026-10-02: *"hide the yellow orbit center"*) — the pink ring marks
  the target. Only hidden: it still moves to every new target, and the target itself is unchanged.
* Vectors: `tests/proto_pink_ring.test.ts`.
* ⭐⭐ **THE PAINTING SWINGS WHEN THE GREEN PIECE ORBITS** (the owner, 2026-10-02: *"apply the sway to other objects when the
  green piece orbits"*, then *"I can't see any sway … I want the same effect … as when I translate the piece 17"* → *"build
  1-3"*; ⛔ unjudged by a hand). ⛔ The first build PUSHED the pieces along the green piece's heading, with the dragged piece's
  0.8 mm: with the leash at 0 the camera turns with the green piece, the whole view sweeps at the orbit's speed (~5° per mm of
  finger), and that push — in the direction the view already slides — could not be seen. ⭐ Now the scene SWINGS as a block
  about the yellow target (`swingBlock`, split out of the rotation sway's `spinOthers`), in the sense the green piece orbits
  (`orbitSwingAxis`: a yaw orbit about the vertical, an elevation orbit about a horizontal axis) — the frozen floor does not
  swing, so the painting turns visibly against it. TRIGGER: the held body's own (`SwayWatcher` on the orbit finger — it starts
  or resumes moving, or its drag turns by `swayTurnDeg`). AMPLITUDE: `orbitSwayDeg` (**8°** — the owner, 2026-10-02, was 2°; CAMERA › *orbit sway*,
  0–10, 0 = none) × the finger's speed / `swayReferenceSpeedMmPerS` (×0.3–×4.5), on ITS OWN spring: `orbitSwayTauMs`
  (**65 ms** — the owner, 2026-10-02, was 60; CAMERA › *orbit sway softness*, 10–300) — *"I want the sway to resolve quickly"*: the same angle, peaking 3×
  sooner and settled in ~0.3 s instead of ~1 s (a held piece's turn keeps `rotateSwayTauMs`, 180 ms). ⚠ Each body's swing now
  springs back on the τ its kick was sized with (`Follow.swayRotTauMs`); before, every swing sprang back on the TRANSLATION
  softness while `spinOthers` sized it with the rotation one — equal by default, so nothing changed for a held piece.
  The usual exclusions hold: frozen bodies, a pressed piece, assemblies. ⭐ The HUD's `camera` line counts the kicks
  (`orbitSway×N`) — it must climb at each start, resume or turn of an orbit drag.
  ⭐ **In pitch too** (the owner, 2026-10-02: *"make sure the sway also applies in pitch when green piece orbits in pitch"*):
  the axis is the rotation that carries the green piece toward the rig, so an elevation orbit swings the painting about a
  HORIZONTAL axis across the view — vectored on `Scene_1`'s own rings at three yaws, up and down; a yaw-only mutant goes red.
  ⚠ Pinned on the top or bottom ring, a dy drag moves nothing, so nothing swings.
  ⭐⭐ **OPTION 2, THE SLIDE** (the owner, 2026-10-02: *"build also option 2"*): the pieces TRANSLATE the way the green piece
  is heading (`orbitSlideDirection`, from where it is to where the rig puts it), `orbitSlideMm` (**5 mm** on the glass, a guess;
  CAMERA › *orbit slide*, 0–20) × the finger's speed factor, on the same quick softness (`orbitSwayTauMs`) — the dragged
  piece's push (`nudgeOthersWorld`), ~6× larger and quicker. ⭐ CAMERA › *orbit sway kind*: **0 the swing** (the default),
  1 the slide, 2 both (`orbitSwayKinds`). ⭐ Each body's slide springs back on the softness its kick was sized with
  (`Follow.swayTransTauMs`), as the swing does — a dragged piece keeps `translateSwayTauMs`.
* ⭐⭐ **THE GREEN PIECE'S ORBIT HAS INERTIA** (the owner, 2026-10-02: *"give some inertia to the orbit based on the piece overall
  volume. add a slider for orbit inertia gain"* — asked which: *"the green piece's orbit"*; ⛔ unjudged by a hand). Each orbit
  step of the finger is recorded (`OrbitInertia`, `input/orbit_inertia.ts`); when the finger LIFTS, the orbit goes on at its
  rate over the last 80 ms (`RELEASE_WINDOW_MS` — a finger that had stopped carries nothing) and slows exponentially with
  **τ = `orbitInertiaGain` × the green piece's volume** (the frustum's, `frustumVolumeM3` — ~187 cm³ for 103.5 × 41.25 × 45 mm at a
  half top): a heavier piece coasts further, `v₀·τ` in all, at any frame rate. CAMERA › *orbit inertia gain (ms per cm³)*, 0–10,
  **1** by default (a guess: τ ≈ 190 ms, a ~1 s coast); 0 = none. Any new touch stops it at once; the elevation stops at its
  rings (`OrbitController.nudge` clamps), the yaw coasts on. The box and the camera follow it as they follow a drag.
  ⚠ The first build counted the window's samples at BOTH ends — 6 steps (96 ms of motion) into 80 ms, a coast 20 % too fast —
  caught by its own vector; the window is now strictly `(t − 80, t]`. Vectors: `tests/proto_orbit_inertia.test.ts`.
  ⭐ Default gain **0.15** (the owner, 2026-10-02; 1, then 0.45, then 0.15): τ ≈ 28 ms for the green piece.
  ⛔⛔ **AND A JUMP AT THE LIFT, FIXED** (*"sometimes, when the inertia is big and there is a large orbit, there is a jump of the
  green piece back and forth at one point of the orbit"*): the lift reached the camera at once while the orbit coasted, so for
  that one frame the camera ran its "input stopped" rule — a glide toward the coasting rig, ahead of the eased piece — and the
  next frame the leash pinned it back: ~0.15–0.36° on the glass and back, at the point where the finger lifted. ✅ A coasting
  orbit is a MOVING input to the camera, and the release is held until the coast ends (`cameraRelease`). Replayed in the real
  frame order: the old way jumps > 0.1°, the new < 0.01°.
* ⭐ **The pink ring is thicker and brighter** (the owner, 2026-10-02: *"make the pink ring slightly thicker and brighter so I can
  see it better"*): WebGL draws a line one pixel wide whatever is asked, so it is five concentric loops ±1 px around the ring,
  half a pixel apart (`PINK_RING_LOOPS`, one line system — a ~3 px band), in a brighter pink (1, 0.6, 0.9; was 1, 0.42, 0.78).
  Its occlusion and translucency are unchanged.
* ⭐ **The CAMERA menu has subsections** (*"there are too many rows directly under CAMERA menu"*): only the edge band sits
  directly under it; GREEN PIECE ORBIT, CAMERA OFFSET, CAMERA FOLLOW, ORBIT SWAY, RENDERING, CAMERA ORBIT.
* ⛔⛔ **THE STAIR BETWEEN THE RINGS WAS THE CAMERA, NOT ONLY THE RINGS** (the owner, 2026-10-02, after the waist: *"there is still
  a 'stair' effect at the transitions between rings"*). The camera's pitch axis ran on the pitch ANGLE and turned it back into a
  ring position with `vForPitch`, a search that assumes the angle rises monotonically from the bottom ring to the top. ⛔ It does
  not: on the waist the angle climbs to **34.06° at v = 0.70, then falls back to 31.5°** (the top ring is 31.7°). The camera could
  not reach any pitch above the top ring's, clamped there, lagged the green piece by **up to 2.4° even at leash 0**, then snapped
  back — the stair (the old rings had a smaller hump, the same flaw). ✅ The pitch axis now runs on the ring position `v`, which
  always moves one way (`cameraOrbitStep`); the leash stays an angle, converted to `v` exactly on the stretch between the camera
  and the box (`leashInV`, bisection). At leash 0 the camera now sits exactly on the green piece's pitch (error < 0.01°; 2.41°
  before — the vector). `vForPitch` is kept, declared unwired. ⚠ What remains is the waist's own shape: near the middle ring the
  view angle changes fast (0 → 31° over the first fifth of the climb), then hardly at all — that is the geometry, not a jump.
