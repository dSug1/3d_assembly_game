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
* ⭐⭐ **ZOOM 1.00, THE SAME SCENE** (the owner, 2026-10-02: *"I want to set the zoom at 1.00 but the scene shall be exactly the
  same: therefore, update all the values"*): the green piece sits at rings × zoom, and every other zoom reader (the wheel's and
  the pinch's limits, the camera reset) is relative to the rings — so the rings ×1.5 and `bootZoom` 1.5 → **1.00** move nothing:
  top **2.55 / +1.575 m**, middle **0.375 / 0 m**, bottom **2.55 / −1.575 m**. The camera's radius offset (1250 mm) and its 3 m
  limit are absolute, unchanged. The CAMERA ORBIT height sliders now reach ±3 m. A vector checks the green piece's position at
  zoom 1.00 on the new rings against zoom 1.5 on the old, all over the surface.
* ⭐⭐ **THE BOOT ORBIT CENTRE IS THE BLUE PIECE'S FACE TOWARD THE GREEN PIECE** (the owner, 2026-10-02: *"at boot, place the orbit
  center to center of the face of the blue piece which faces the green piece"*): Piece10 (the one blue body); of its faces, the
  one whose normal points most toward the green piece's boot direction (`faceToward`, `bootTargetOnBlueFace`) — at boot (top
  ring, boot yaw) that direction is (0, 0.53, −0.85), so it is Piece10's FRONT face (−z), its centre ≈ (0.104, 0.279, −0.05) m.
  (It was the scene's boot centre, (0, 0.23, 0) — behind the painting's panel.) No blue piece: the scene's own boot centre.
* ⭐ **The pink ring occludes from boot** (the owner, 2026-10-02: *"the pink ring shall occlude already from boot because it sits
  on the blue piece face"*): the boot exemption (translucent behind pieces until a placed-piece press) is switched off — the
  boot target is on Piece10's face now, so the one rule applies from the first frame. `pinkRingVisibility`'s `bootTarget`
  parameter stays (`true` restores it); `targetSetByPress` is deleted.
* ⭐⭐ **THE ZOOM MOVES THE CAMERA, NOT THE GREEN PIECE** (the owner, 2026-10-02: *"the zoom shall bring the camera closer to or
  further away from the green piece. zoom from 0.1 to 2, with 1.00 corresponding to the current distance"*). ⛔ It scaled the
  RINGS — the green piece's own orbit. Now the green piece rides the rings as they are (`GREEN_PIECE_ORBIT_ZOOM` = 1, also for
  the orbit swing's axis and the boot face), and the zoom scales the camera's distance BEHIND it: `cameraRadiusOffsetMm ×
  zoom` (`cameraGapM`; 1.00 = 1.25 m, 0.1 = 0.125 m, 2 = 2.5 m), held to **0.1–2** every frame (`clampGreenZoom`). The wheel uses
  that range with a green piece; the pinch's factor is clamped the next frame; the *boot zoom* slider (CAMERA OFFSET) is now
  that zoom, 0.1–2 step 0.05. Spreading two fingers still brings the camera closer, as before.
* ⭐⭐ **THE ZOOM NEVER BRINGS THE CAMERA SO CLOSE THE GREEN PIECE LEAVES THE SCREEN** (the owner, 2026-10-02: *"make sure that given
  the yaw and pitch offset, a close zoom cannot result in the green piece being out of the screen"* → option A, *"not recomputed
  at each frame"*). The camera sits δ (an offset) off the green piece's direction and looks at the target, so seen from it the
  piece is `atan(d·sin δ / (g + d·(1 − cos δ)))` off-centre — 90° as the gap g → 0. `minGreenZoom` gives the closest zoom that
  keeps it inside `greenKeepInViewMargin` (**0.8** of the half-view; CAMERA OFFSET slider 0.3–1): the yaw offset against the
  HORIZONTAL half-angle (`tan(h/2) = tan(v/2) × aspect` — ±15.1° in portrait, the binding one), the pitch against the vertical
  (±22.9°, Babylon's default 0.8 rad). ⭐ For the FARTHEST the piece can be (the outer rings, capped at the 3 m limit) — the worst
  case, so it holds on every ring and is recomputed only when an offset, the margin, the radius offset, the rings, the field of
  view or the screen's shape changes (a key compared each frame), never while orbiting or zooming. The zoom (and the wheel) is
  held to it: with 3° / 2° it is **0.55 in portrait, 0.26 in landscape**; the HUD's camera line shows it (`zoom=1.00(≥0.55)`).
  ⚠ The cost: on the middle ring the camera could come closer; the limit is the outer rings'. ⚠ An offset so large it needs
  more than zoom 2 (12° in portrait needs 2.33) is capped at 2, and the piece then sits outside the margin.
* ⭐ **A GUIDE SPHERE on the yellow target — for prototyping only** (the owner, 2026-10-02: *"draw a sphere of 75% of the top ring
  radius, centered on the yellow orbit center. it shall be almost translucent so I can see through. This is for prototyping
  purpose and will not be shown in the final game"*): radius `GUIDE_SPHERE_SHARE` (0.75) × the top ring's (1.91 m today),
  following the target and the slider each frame (`guideSphereFrame`); unlit, both faces drawn, `guideSphereAlpha` **0** — hidden by default (the owner, 2026-10-02; was 0.08)
  (CAMERA › RENDERING › *guide sphere opacity*, 0 = hidden). Not pickable, not an orbit candidate: it blocks no press, no
  occlusion ray, and never sways. ⛔ Not for the final game — remove with the rest of the prototype.
* ⭐ **The green piece's WHITE CONTOUR outside the guide sphere** (the owner, 2026-10-02: *"when the green piece is outside of this
  sphere, highlight its contour in white"* — *"(same offset of contour highlights as the rest of the pioneer / follower parts)"*):
  its crease edges (`topologyFromMesh`, `edgeLines` — the part outlines' own machinery), lifted off its faces by
  `highlightLiftMm` at the camera's distance (`highlightLiftM`, rebuilt when `outlineOffsetStale`), parented to the piece, shown
  while its CENTRE is farther from the yellow target than the sphere's radius (`outsideSphere`).
* ⛔⛔ **The keep-in-view limit is EXACT now** (the owner, 2026-10-02: *"in portrait, the min zoom can go further low than today's
  limit 0.72 on my tablet. there is still a lot of margin"* — *"same for landscape"*). The closed form treated the yaw offset as if
  the camera were LEVEL; on the top ring (~32° up) a 3° yaw about the vertical is only ~3° × cos 32° across the glass. Now the
  piece's centre is projected as `cameraOffset` places the camera, at 33 positions along the rings (the box's 3 m clamp
  included), and the limit is the worst of them — still recomputed only when its key changes (a turn portrait ↔ landscape
  included). With 3° / 2°: portrait (0.53) **0.70 → 0.60**; landscape stays **~0.25**, bound by the 2° PITCH offset, which is
  vertical on every ring. ⛔ A piece-size term built the same day raised both (portrait 0.83, landscape 0.40) and was removed.
  ⚠ Still the worst ring: between the rings the exact limit is far lower (0.28 at 1.4 m, 0.09 at the waist) — a limit from the
  CURRENT ring position would release it, at the cost of the zoom being pushed out while orbiting outward.
* ⭐ **Keep-in-view margin 0.9** (the owner, 2026-10-02; was 0.8): portrait (0.53) **0.60 → 0.53**, landscape **0.25 → 0.22**.
* ⭐ **Orbit degrees per millimetre of finger** (the owner, 2026-10-02: *"compute somewhere the delta yaw and pitch orbit degrees that
  a delta x or delta y position input provides"* — *"we will use that in the code"*): `orbitDegPerMm(cfg, v, gains)` in
  `input/follow_camera.ts`, on the HUD's `green` line (`orbit 5.11°/mm dx, …°/mm dy`). YAW = `gainOrbitYaw × boxGainYaw` — **5.11°/mm**
  anywhere on the rings. PITCH = the slope of `pitchOf` at the ring position × `gainOrbitElevation × boxGainPitch` (0.01 of `v` per
  mm), SIGNED, per mm of finger down: `Scene_1` **4.81°/mm at the waist**, 1.11 at v = 0.4 / 0.6, ~0.1 near the outer rings.
  ⚠⚠ **The pitch is NOT monotone along `Scene_1`'s rings**: it peaks at ±33.5° near v = 0.25 / 0.75 and comes back to ±31.7° at
  the outer rings, so past the peak a finger the same way turns the pitch back (the rate's sign flips). The inside-leash `gains`
  (`boxDragGains`) scale both; with no leash they are 1. Checked against `OrbitController.drag` itself, `tests/proto_orbit_rates.test.ts`.
* ⭐⭐ **An orbited piece's faces are tracked outside the guide sphere** (the owner, 2026-10-02: *"when a piece goes outside the white
  sphere, compute its number of faces and track them. This is valid for the green piece or any other piece which will later be
  orbited"* — *"also at boot, if any piece is outside the white sphere"*). The orbited pieces are a list (`orbitedPieces`, the green
  piece today). Each frame (`trackOrbitedFaces`, deciding by `faceTracking`): on an outward crossing — or outside at its first
  frame, the boot — its LOGICAL faces are read off its mesh (`topologyFromMesh`, `pieceFaces`: normal, centre, area — a box's six,
  not its twelve triangles); while it stays outside their world normals and centres follow it (rotation + position only: the
  topology already carries the mesh's scale); back inside they are dropped. The HUD's `green` line: `faces 6 tracked` / `faces —`.
  `tests/proto_face_tracking.test.ts`.
* ⭐⭐ **AN ORBITED PIECE STEPS THROUGH ITS FACES AS IT ORBITS IN YAW** (the owner, 2026-10-02: *"set the yaw face alignment span to 180
  degrees … divide [it] by the number of faces … DegreesYawPerFace … compute the delta x position required (DeltaXYawPerFace) based
  on the yaw rate … every time delta x position accumulates beyond DeltaXYawPerFace, rotate the piece so that the next face is
  anti-aligned with the normal of the face holding the pink gizmo. If the pink gizmo face normal changes, slerp the piece … all the
  faces should be anti-aligned once if the piece orbits in yaw over the full yaw face alignment span … inside the white sphere, the
  anti-aligned face shall be maintained and no rotation shall take place"*). `yawFaceAlignSpanDeg` **180** (CAMERA › FACE ALIGNMENT
  IN YAW, 30–720). On `START` (out of the sphere, or outside at boot): `DegreesYawPerFace` = span ÷ faces (the green piece: 6 →
  **30°**), `DeltaXYawPerFace` = that ÷ the yaw rate (**5.88 mm** of dx at 5.11°/mm), and the face most anti-aligned with the pink
  ring's face (`pinkFaceNormal`: the blue piece's face at boot, then the face a press moved the target to) is turned exactly
  anti-parallel — the first of the ORDER, a chain of smallest turns (`faceOrder`: each next face the unused one closest to the
  current; every face once). The orbit's yaw each frame, as finger mm (a drag's dx; the inertia coast's equivalent, so the faces
  stay in step with the yaw), accumulates from `START`; ROUNDED to whole `DeltaXYawPerFace`s it names the face
  (`accumulateFaceSteps`) — the START face holds ±½ step, the boundaries sit at fixed yaws, and orbiting back retraces them at the
  same places (⛔ a remainder carried from step to step put the way back a whole step farther). A change of the pink face's normal
  slerps the current face onto it. Every turn is the minimal one (`antiAlignedOrientation`), eased over an alignment's time
  (`cameraResetMs × ALIGN_SNAP_FRACTION`, smoothstep). ⛔ Inside the sphere nothing turns (a turn already in flight lands); the
  next exit starts again from the face anti-aligned then. HUD `green`: `faces 6 tracked, 30.0°/face = 5.88 mm dx, face 1/6 (dx … mm)`.
  `tests/proto_face_steps.test.ts`.
* ⭐ **The yaw orbit is slower outside the guide sphere** (the owner, 2026-10-02: *"when the green piece is outside the white sphere:
  reduce the green box yaw orbit gain to 40% of its value"*): `boxGainYawOutsideShare` **0.4** (CAMERA, beside the yaw gain), applied
  by `outsideYawShare` on the face tracking's own outside state. ⭐ ONE home for the drag's gains, `greenDragGains` (the leash factors
  and this share): the drag, the face stepping's yaw rate and the HUD read it — so outside, the yaw rate is **2.04°/mm** and
  `DeltaXYawPerFace` **14.7 mm** of dx (5.88 inside the rate). The pitch is unchanged.
* ⭐⭐ **`Scene_1`'s middle ring: 0.09 m at 0.15 m** (the owner, 2026-10-02: *"set the default middle ring radius to 0.09 and middle
  ring height to 0.15"*; was 0.375 m at 0). ⚠⚠ What it does to the vertical orbit, measured: the pitch swings **−33.4° (v = 0.4) →
  −4.3° (0.45) → +59.0° (0.5) → +65.8° (0.55)**, then comes back DOWN to the top ring's 31.7° — ~100° of pitch in ~15 mm of finger,
  **~13°/mm at v = 0.45**; above the middle ring the camera looks down more steeply than from the top ring. The green piece passes
  within 0.14 m of the target, THROUGH the painting (0.375 m cleared its 0.30 m; it has no collision). The rings' speed ratio is 2.37
  (was < 2.2) — still far smoother than the stair. The vectors that pinned the old ring now say so (`proto_green_box`,
  `proto_orbit_rates`, `goal.test.ts`'s rig).
* ⭐⭐ **A FOURTH ORBIT RING** (the owner, 2026-10-02: *"add a fourth ring between the middle ring and the bottom ring, with radius
  same as middle ring and height the negative opposite of middle ring's height"*): `Scene_1` **0.09 m at −0.15 m** (`OrbitRig.lowerRadiusM`
  / `lowerHeightM`, optional — a scene without them keeps its three rings exactly; `Scene_0` = the defaults). Config
  `orbitLowerRingOn` / `orbitLowerRadiusM` / `orbitLowerHeightM`, sliders in CAMERA › CAMERA ORBIT; validated (between the bottom and
  the middle, a positive radius). The monotone cubic now runs through N rings evenly spaced in `v` (`throughKnots`; three rings = exactly
  `throughThree` as it was): bottom 0, fourth ⅓, middle ⅔, top 1. Measured: a symmetric waist — pitch −31.7° → −61° → 0° (v = ½, the
  piece 0.09 m from the target) → +61° → +31.7°, at most **5.3°/mm** (v = 0.4 / 0.6; 13°/mm with the middle ring alone); the distance
  turns once. ⚠⚠ **A slow PLATEAU in the waist**: evenly spaced knots leave the short waist segment almost flat in the middle — the
  piece climbs ~7 cm between v = 0.4 and 0.6, the rings' speed ratio ~190 (2.37 before). The fix on offer: space the rings in `v` by
  their distance apart. `tests/proto_fourth_ring.test.ts`.
* ⭐⭐ **THE RINGS ARE NAMED 1st, 2nd, 3rd, 4th FROM THE TOP** (the owner, 2026-10-02): 1st = top (`orbitTop…`), 2nd = middle
  (`orbitMiddle…`), 3rd = the fourth ring added (`orbitLower…`), 4th = bottom (`orbitBottom…`) — in the menu and these notes; the
  config keys keep their names (`Scene_0` and the URL overrides read them).
* ⭐⭐ **THE WAIST WITHOUT ITS PLATEAU, THE OUTER TRANSITIONS KEPT** (the owner, 2026-10-02: *"do it. However, maintain the relationship
  between top ring and middle ring and between fourth ring and bottom ring as I like the camera move at the transitions"*):
  `fourRingLayout` keeps the 1st ↔ 2nd and 3rd ↔ 4th segments EXACTLY (their spans and the tangents at all four rings — the same curves),
  and gives only the WAIST (2nd ↔ 3rd) a new span: its height step ÷ the mean of its end tangents (0.30 m ÷ 2.59 = 0.116 of the old ⅓
  spans), so it climbs at the speed it is entered at (linear in height, no plateau). `v` = that parameter ÷ its total (⅔ + 0.116 =
  0.783), and the drag's elevation gain is ÷ the same total (`elevationGainScale`, read by `OrbitController.drag` and `orbitDegPerMm`):
  **a millimetre of dy moves the outer segments exactly as before** (checked against an independent re-implementation of the even
  layout). The 3rd ring now sits at v = 0.426, the 2nd at 0.574. Speed ratio **4.24** (≈190 evenly spaced). ⚠ The cost, measured: the
  waist is short, so the camera's pitch sweeps −59° → +59° in ~12 mm of dy, **~16.5°/mm at its centre**.
* ⭐⭐ **A YAW CYCLE, THEN A PITCH CYCLE** (the owner, 2026-10-03: *"on start, order the logical faces as a chain of yaw turns starting
  from the face that points most against the pink normal and when the cycle of yaw turns has finished (once the initial face came
  back) switch to a cycle of pitch turns, and when the cycle of pitch turns has finished, go back to yaw turns, etc."*). Replaces the
  smallest-turn chain (`faceOrder`, deleted). Axes (`turnAxes`): YAW about the world vertical made perpendicular to the pink normal,
  PITCH about the horizontal across it (a vertical pink normal: the camera's view stands in). At START the start face is anti-aligned;
  each face then goes by the piece's OWN axis it mostly faces (so the START tilt moves no face between cycles): along the yaw axis →
  the pitch cycle only (top, bottom); along the pitch axis → yaw only (sides); along the pink normal → both (the start face and its
  opposite). Each cycle runs by angle about its axis (`faceCycles`). The frustum: **yaw = start, a side, the opposite face, the other
  side; pitch = start, the top, the opposite face, the bottom.** Steps go through the yaw cycle until the start face is back, then the
  pitch cycle, then yaw again; the other way retraces (`cycleStep`). ⭐ Every face's orientation is computed ONCE at START from the
  START pose — a turn about its cycle's axis, then the small correction to exact anti-parallel (`turnAbout`, `cycleTargets`) — so a
  half-turn goes about the cycle's axis (⛔ the smallest turn picks any perpendicular), and every lap comes back exactly (⛔ step upon
  step, a slanted side's correction tilted the piece and the next yaw ran on it: an axis moved 66° in one step). The turn on screen is
  the slerp from where the piece is to the step's orientation. A pink face change STARTS the cycles again from the face anti-aligned
  then. DegreesYawPerFace is unchanged (span ÷ faces, 30°): one yaw + pitch period is 8 steps = 240°. HUD `yaw 2/4` / `pitch 1/4`.
* ⭐ **The span covers ONE yaw + pitch period** (the owner, 2026-10-03: *"span to cover one full period"*): DegreesYawPerFace = the span ÷
  the period's steps (`cycles.yaw.length + cycles.pitch.length`) — the frustum 180° ÷ 8 = **22.5° per step**, so 180° of orbit runs the
  whole yaw cycle and the whole pitch cycle and lands on the start face. Outside the sphere (2.04°/mm): **11.0 mm of dx per step**.
  HUD `…°/step`.
* ⭐ **OBJECT ROTATION has two submenus** (the owner, 2026-10-03): *ROTATION IN WORLD COORDINATES* (every slider it had, unchanged) and
  *DOUBLE ORBIT MODE* with the toggle **`FacesRotateByIncrement`** (`facesRotateByIncrement`, **1** by default): on = the current rule
  (the yaw / pitch cycles stepped by increments of the yaw orbit); off = no dx counted and no face stepped — the owner's rule for it is
  to come. Either way the START anti-alignment and the pink face's change (the face anti-aligned now turned onto the new normal, the
  cycles started again) still apply.
* ⭐⭐ **`FacesRotateByIncrement` OFF: dx turns the green piece CONTINUOUSLY — yaw 360°, a smooth blend, pitch 360°, a blend, yaw again**
  (the owner, 2026-10-03, the proposal accepted: *"build"*). `staircaseOrientation`: the orientation is a FUNCTION of the accumulated
  rotation `s` (dx as the orbit's yaw in finger mm — the coast included — × `greenRotateGainDegPerMm`, **4°/mm**, `gainRotateFree`'s
  0.07 rad/mm): `Pitch(β) · Yaw(α) · q0`, yaw about the world vertical, pitch about the horizontal across the pink normal (frozen at
  START). In the (α, β) plane the path is a staircase whose corners are rounded over `greenRotateBlendDeg` (**60°** of `s`): there the
  speed is shared cos θ / sin θ, θ easing 0 → 90° on Perlin's smootherstep — constant turn speed, a gliding axis (linear segments with
  smooth blends, Craig's *Introduction to Robotics*; CNC corner rounding). Each pure segment is shortened by what the windows give its
  angle (289.4° pure, a lap 698.8° of `s` = **175 mm of dx**), so **every lap adds exactly 360° to both and the piece comes back to its
  START pose**; dx back retraces exactly. ⛔ Blending the turning axis frame by frame — the obvious way — drifted 14.7° a lap (60°
  window). START (an exit, the switch, a new pink face) takes the pose as it is: no snap, `s` = 0, pure yaw first. Inside the sphere
  nothing turns. Sliders: OBJECT ROTATION › GREEN PIECE ROTATION. HUD `turning yaw …° pitch …°`. `tests/proto_green_rotation.test.ts`.
* ⭐ **Defaults** (the owner, 2026-10-03): `FacesRotateByIncrement` **0** — the continuous turn ships, the face cycles are the switch's
  other side — and the yaw ↔ pitch blend **0**: a hard switch, 360° of yaw then 360° of pitch, a lap of 720° of `s` (180 mm of dx at
  4°/mm). Both sliders as before.
* ⛔⛔ **No pitch in the yaw** (the owner, 2026-10-03: *"make sure that there is no pitch mixed with yaw when rotation is on yaw. It looks
  like one axis pollutes the other"*). The rule was pure (mid-yaw, the turn is about the vertical alone); the WIRING was not: the
  continuous turn restarted at every exit from the pose as it was, so a piece that left the sphere part-pitched — or came from the face
  cycles — yawed TILTED about the vertical, its own up circling the vertical (a 23° tilt: the up moves > 0.5 across a half-turn). ⭐ Now
  the turn's state is kept for the session (`freeTurns`: it pauses inside the sphere, the next exit continues it) and starts from a
  LEVEL pose with the piece's heading (`levelHeading`) — every yaw phase is an upright piece about the vertical. A pose that differs
  (the face cycles, the first level-out) is eased onto the turn like an alignment. ⚠ The pitch axis is frozen with the first START: a
  later pink face no longer moves it.
* ⭐ **The continuous turn is set in ORBIT YAW** (the owner, 2026-10-03: *"green piece rotation gain: instead of deg per input mm, do it
  in orbit rotation yaw angle required to complete the full cycle (yaw and pitch 360 degree rotation of the green piece)"*):
  `greenRotateCycleOrbitYawDeg` **360°** (OBJECT ROTATION › GREEN PIECE ROTATION, *full yaw + pitch cycle (deg of orbit yaw)*, 45–1440) —
  the orbit's own yaw (a drag's, a coast's) feeds the turn at one lap of the staircase per that angle (`staircasePerOrbitDeg`: 720° of
  turn per 360° of orbit with no blend), so it no longer reads the dx gain or the 40 % outside share. With a hard switch: the first
  180° of orbit yaw is the piece's 360° yaw, the next 180° its 360° pitch. (Was `greenRotateGainDegPerMm` 4°/mm ≈ 368° of orbit.)
* ⭐⭐ **The green piece's turn SNAPS to its face increments** (the owner, 2026-10-03: *"identify the number of primary faces which scroll
  during a 360 degree yaw and … during a 360 degree pitch, and divide 360 degree by these two … snap the green piece yaw and pitch
  rotations onto these angle increments during the yaw orbit, so the rotation of the green piece is not continuous but incremented"*).
  Counted ONCE when the continuous turn starts (at boot), from its level pose, by the face cycles' own rule (`scrollIncrements` over
  `faceCycles`: a face mostly along the yaw axis never comes round in a yaw, one along the pitch axis never in a pitch). The frustum: **4
  and 4 → 90° and 90°**. Each frame the staircase's yaw and pitch angles are snapped to the NEAREST increment (`snapAngle`) and each new
  increment is eased in like an alignment (~129 ms). With the cycle at 360° of orbit and no blend: a face step every 45° of orbit yaw.
  Slider *snap to face increments* (`greenRotateSnap`, **1**) in OBJECT ROTATION › GREEN PIECE ROTATION; 0 = the continuous turn. HUD
  `· steps 90° (4 faces) / 90° (4)`.
* ⭐ **The full yaw + pitch cycle: 70° of orbit yaw** (the owner, 2026-10-03; was 360°). Snapped at 90° / 90°: a face step every **8.75°
  of orbit yaw** — ~4.3 mm of dx outside the sphere (2.04°/mm).
* ⭐⭐ **Outside the guide sphere, one orbit axis moving widens the other's deadband** (the owner, 2026-10-03: *"when dx is outside the
  deadband, increase the deadband for dy. Revert back when dx is inside the deadband. When dy is outside the deadband, increase the
  deadband for dx …"* — *"make a toggle slider and a slider for this increase of deadband from 100 % (current) to 1000 %"*). The orbit
  finger's tracker (§1.1's per-axis position deadband, `motionDeadbandMm` 3.5 mm) takes a per-axis band factor (`MotionTracker.push`'s
  `bandScale`): × `orbitCrossDeadbandFactor` on y while x is MOVING, on x while y is MOVING, back to 1 when the other rests
  (`crossDeadbandScales`). It is pushed BEFORE the orbit is driven, and outside the sphere the orbit reads its DEADBANDED travel
  (⚠ it read the raw travel before: the band would have changed nothing) — so the first 3.5 mm of each axis's start is eaten, as for a
  held piece. A yaw swipe drifting 6 mm up: pitch leaks 2.5 mm at 100 %, none at 300 %. Inside the sphere or switched off: the raw
  travel, as ever. CAMERA › GREEN PIECE ORBIT: the toggle (`orbitCrossDeadbandOn`, **1**) and the factor (`orbitCrossDeadbandFactor`,
  **3** = 300 %, a first guess; 1–10). `tests/proto_cross_deadband.test.ts`.
* ⭐ **The full yaw + pitch cycle: 75° of orbit yaw** (the owner, 2026-10-03; was 70°): a face step every **9.4°** of orbit yaw (~4.6 mm of dx).
* ⭐ **The guide sphere's radius has a slider** (the owner, 2026-10-03: *"make one from 1% to 100% with 5% increments"*): `guideSphereShare`
  (CAMERA › RENDERING, *guide sphere radius (share of the 1st ring)*), **0.75**, 5 %–100 % in 5 % steps (from 1 % the 5 % grid would
  miss 75 % and 100 %). It replaces the constant `GUIDE_SPHERE_SHARE`; the one radius every "outside the sphere" reads — the white
  contour, the face tracking, and through it the outside yaw share, the cross deadband, the green piece's turn.
* ⭐ **Guide sphere radius 97 %, in 1 % steps from 1 %** (the owner, 2026-10-03; was 75 %, 5 % steps): 2.47 m with the 2.55 m 1st ring.
* ⭐⭐ **The snapped turn FREEZES when dx is too fast for its snaps** (the owner, 2026-10-03: *"when the dx is too high, the rotation is too
  fast for the snap to have the time to happens … compute the maximum dx speed in this configuration at boot time and then if dx exceeds
  this value, the rotation is frozen in the last snap until dx goes down to 50 % of this value (hysteresis) : when it reaches this value,
  the rotation snaps to the value it should have been based on the accumulated dx"* — *"recompute if the full yaw + pitch cycle angle
  slider value changes but not every frame"*). The limit (`maxSnapDxMmPerS`): the dx between the two closest snaps (cycle ÷ (2 × the
  larger face count) of orbit yaw, at the outside yaw rate) over one snap's ease (`cameraResetMs × ALIGN_SNAP_FRACTION`) — today 75° ÷ 8
  ÷ 2.04°/mm = 4.6 mm in 129 ms ≈ **36 mm/s**. Computed once when the turn starts (boot), again only when the cycle slider's value differs
  from the one it was computed from (the faces, the rate and the ease stay the boot's). The dx speed is the orbit's yaw as dx, smoothed
  over 120 ms (the rig steps per pointer event). Above the limit: frozen on the last snap (`snapFrozen`), the dx still accumulating;
  at or below half of it: released, eased straight to the snap the accumulated dx calls for. HUD `· dx 12/36 mm/s ⏸FROZEN`.
  `tests/proto_snap_freeze.test.ts`.
* ⭐ **…and the too-fast dx is IGNORED, not caught up** (the owner, 2026-10-03: *"let's not snap at the end and simply ignore the rotation
  when dx is too fast"*): while frozen (snapping on), the orbit's yaw is not accumulated at all, so on release the piece simply resumes
  from the snap it froze on. ⚠ So a fast swipe turns the orbit but not the piece: the piece's face no longer follows the orbit 1:1.
* ⭐ **The snap freeze's limit is in DEGREES OF THE PIECE'S ROTATION per second** (the owner, 2026-10-03: *"it should not be in mm/s of
  input, but it should be in degrees of rotation / sec. Because this shall include the influence of yaw gain share outside the guide
  sphere. with a very small yaw gain share, the piece has time to snap even if the dx translation is fast"*): `maxSnapTurnDegPerS` = the
  smaller increment per snap's ease — 90° / 128.6 ms ≈ **700°/s**, computed once at boot (it reads no gain and no cycle, so no
  recompute). The MEASURED rate is the piece's own turn — the orbit's yaw (the outside yaw gain share in it) × the cycle's turn per orbit
  degree — smoothed over 120 ms. A 50 mm/s finger freezes it at the 40 % share, not at 10 %. HUD `· turn 120/700°/s ⏸FROZEN`.
* ⭐ **Orbit sway 4.5°, softness 70 ms** (the owner, 2026-10-03; were 8° and 65 ms).
* ⭐⭐ **The snap has its OWN duration, 60 ms** (the owner, 2026-10-03: *"recompute and speed up the snap movement so that i can increase
  yaw gain share outside the guide sphere to 0.2 and reduce yaw face alignment span to 75"*): `greenSnapEaseMs` (OBJECT ROTATION › GREEN
  PIECE ROTATION, *snap duration (ms)*, 10–300) — it was an alignment's 128.6 ms (`cameraResetMs × ALIGN_SNAP_FRACTION`), which held the
  limit at 700°/s. Sized for a 0.2 share and a 75° span: the piece turns ~9.8° per mm of dx, a brisk 150 mm/s swipe ~1470°/s, so a 90°
  snap must land in ~61 ms → 60 ms, a limit of **1500°/s**. The limit is recomputed only when that slider changes. Other piece turns (the
  face cycles, an ease onto the turn) keep the alignment's time.
* ⭐⭐ **ONE span for both modes** (the owner, 2026-10-03: *"make sure that yaw face alignment span also applies in this current case"*):
  the continuous (snapped) turn's full yaw + pitch cycle IS `yawFaceAlignSpanDeg` now — the separate `greenRotateCycleOrbitYawDeg` and
  its slider are deleted. Default **75°** (the turn's cycle as it was; the face cycles' span was 180°). Slider: CAMERA › FACE ALIGNMENT
  IN YAW, *yaw face alignment span (deg of orbit yaw: one full yaw + pitch period)*.
* ⭐ **Snap duration 90 ms** (the owner, 2026-10-03: *"recompute everything for snap in 90 ms"*; 60 ms before): the limit is **1000°/s** of
  the piece's turn. With the 75° span the piece turns ~9.8° per mm of dx at a 0.2 yaw share (the fastest finger ~**102 mm/s**) and ~19.6°
  per mm at the 0.4 default (~**51 mm/s**); release below half of it.
* ⭐ **Snap duration 125 ms** (the owner, 2026-10-03: *"recompute everything so the snap is 125 ms"*; 90 ms before): the limit is **720°/s**
  of the piece's turn — the fastest finger ~**73 mm/s** at a 0.2 yaw share, ~**37 mm/s** at the 0.4 default (75° span); release below
  360°/s. (Almost the alignment's own 128.6 ms again.)
* ⭐ **The snap relatches at 85 % of the limit** (the owner, 2026-10-03: *"instead of 50%, set the reset to 85% for the snap to relatch"*):
  `snapFrozen`'s release — with the 125 ms snap, frozen above 720°/s, relatched at or below **612°/s**.
* ⭐ **Yaw gain share outside the sphere: 0.2** (the owner, 2026-10-03; was 0.4): outside, the orbit yaws **1.02°/mm** of dx and the piece
  turns ~9.8°/mm (75° span) — the 720°/s snap limit is reached at ~**73 mm/s** of finger, relatched at ~62 mm/s.
* ⭐⭐ **The snapped turn is CAPPED, not frozen** (the owner, 2026-10-03: *"when the angle speed of the rotation becomes too high, cap the
  rotation speed (maintaining the snap duration) instead of freezing the rotation and restarting it at 85%. Consequently, this will get rid
  of the yaw face alignment span for this configuration (it stays for the other configuration where FacesRotateByIncrement is on)"*).
  `capTurn`: the frame's turn joins what waits; at most the limit × dt is applied (one snap per snap duration — 720°/s with 125 ms); what
  is left waits at most 120 ms of the limit (the orbit moves in bursts, one per pointer event, so a burst under the limit is spread, not
  clipped), the rest DISCARDED (never caught up). The freeze, its 85 % relatch and `snapFrozen` are deleted. ⚠ Above the limit a span of
  orbit no longer completes a cycle in this mode — below it the span still sets the turn per orbit degree; the face cycles keep it exact.
  HUD `· turn …/720°/s ⏩CAPPED`.
* ⭐ **Yaw gain share outside the sphere back to 0.4** (the owner, 2026-10-03; 0.2 for a while): outside, the orbit yaws **2.04°/mm** and the
  piece turns ~19.6°/mm (75° span) — the 720°/s cap is reached at ~37 mm/s of finger.
* ⭐⭐⭐ **"OUTSIDE THE SPHERE" IS NOW "THE GREEN PIECE HELD FOR ORBIT", WHEREVER IT IS** (the owner, 2026-10-03, branch `1.0.59j-`: *"where
  ever the green piece is, the orbit remains with the same parameters values as if the green piece was inside the white sphere … unless:
  if the green piece is pressed and hold for orbit (wherever the green piece is): in this case, the orbit is as if the green piece was
  outside the white sphere (yaw gain share, rotation snaps, highlight of contours, etc.)"*). `greenHeldForOrbit`: the pointer that pressed
  the green piece (`greenOrbitPointer`, set at the press, cleared at that finger's lift) — read by the white contour, the face tracking
  and the snapped turn on it, the outside yaw share and the cross deadband. ⭐ The finger is LATCHED: drifting off the piece keeps it held
  (*"this is still OK and the green piece snapped rotation continues"*). The guide sphere only DRAWS now; `outsideSphere` is deleted. A
  coast after the lift is not held: full gain, no turn. ⭐ At the press, the piece's distance to the pink ring (the yellow target) is kept
  (`greenPressRadialM`, *"we will use this radial distance at press later on"*); HUD `· held, r at press 2.947 m`.
  `tests/proto_green_held.test.ts`.
