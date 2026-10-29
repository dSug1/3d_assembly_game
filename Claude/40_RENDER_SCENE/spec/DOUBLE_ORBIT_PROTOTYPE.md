# The double-orbit camera — a PROTOTYPE (branch `1.0.58b-` only)

⭐⭐⭐ **TODAY (2026-10-14): `1.0.76-`, the main line** (live `2a54a92`). The dated lines at the end of this file are the change log up to the
HOVER; the hover's own state is [`HOVER.md` §0](HOVER.md). ⛔ The header lines below (`1.0.59w-`, `/proto/`) are the record.

⛔⛔ **THIS FILE EXISTS ON THE PROTOTYPE BRANCHES ONLY.** Today **`1.0.59w-`** (2026-10-08 — the chain since `1.0.58b-` is in §7–§8);
first `1.0.58b-` (2026-10-01, from `1.0.58a-` at `40aa812`, itself from `1.0.58-Trial-with-double-orbit`); never merged into `main` or
the fork — the main line is merged INTO it, one way.
⭐⭐ **2026-10-10: THE PROTOTYPE IS THE MAIN LINE** — *"I want to simplify and retain only the proto from now on. It shall not be a separate webpage https://dsug1.github.io/3d_assembly_game/proto/ any longer but be what the main merge from and serve on https://dsug1.github.io/3d_assembly_game/. There is no need to have repository variables any longer from this 1.0.62- branch onwards"*. `1.0.62-` is merged into `main` and served at
**https://dsug1.github.io/3d_assembly_game/**; `/proto/` and `PROTO_BRANCH` are retired (`50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md`). ⛔ The
lines below ("never merged into `main`", the `/proto/` slot) are the record up to then.
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
  *boot zoom* at the top of CAMERA, 0.5–10 step 0.1 — applied at once, and the camera reset's view (⛔ the reset is deleted, 2026-10-10); `0` restores the derived
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
  ⭐⭐ **BY DISTANCE, ABOUT THE PLACED PARTS** (the owner, 2026-10-14: *"make the sway in degree decrease linearly with the distance of the
  piece to the gizmo, from the orbit sway value of the slider (at maximum distance) to 0.1 degree (at minimum distance). If the piece is
  sliding on a part, set to minimum. Also, modify so that the center of the sway is not the gizmo but the barycenter of the placed"* →
  *"All placed parts"*; ⛔ unjudged by a hand): the swing's angle is LINEAR in the piece's distance to the gizmo — `ORBIT_SWAY_MIN_DEG`
  (**0.1°**) at the rings' closest distance, the slider's `orbitSwayDeg` at their farthest (`pieceRingRangeM`, the piece's own clamp
  applied), clamped between (`orbitSwayDegAt`); **0.1° while the piece slides on a part** (the last orbit solve met one —
  `orbitFrame`'s `touched`, `st.pieceTouching`); a slider under 0.1° is taken as it is, 0 is no sway. ⭐ The swing's PIVOT is the
  barycentre of the parts PLACED in their goal (`placedBarycentre` over `goalCommit`), the gizmo with none placed. ⚠ Its AXIS still
  follows the orbit about the gizmo (`orbitSwingAxis`); the speed factor and the softness are unchanged; the slide (kind 1) is not
  scaled. (The sway moves the meshes only — the collision solver never sees it.)
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
* ⛔⛔ **THREE RINGS, THE 2nd AND 3rd MERGED — TESTED AND REJECTED** (`1.0.59x-`, 2026-10-09; built `5ba6af2`, reverted `f1c0d9a`). The
  owner: *"Make a slider to toggle from 4 to 3 rings in the menu camera orbit around center. When on 3 rings configuration, merge the 2nd
  and 3rd rings of the four ring configuration and make sure the camera 2D curve is smoothed on the 3 rings as well as for the way in and
  way out"*. Built as a CAMERA ORBIT AROUND CENTER slider (`orbitRingCount`, 4 / 3): the merged ring at the 2nd and 3rd rings' MIDPOINT
  (`Scene_1` 0.09 m at 0), the same monotone cubic through bottom, merged, top (C¹, no corner), each outer segment keeping its ⅓ span so
  the waist simply vanished (the elevation gain × 1.5); the way in and the way out read the same curve through `orbitOffset`. ⛔ **Rejected
  on the device: *"transitions are too fast between rings"*.** ⭐ The four rings stay: the waist's own span (above) is what slows the
  camera through the middle, and removing it leaves the outer segments meeting at one ring with nothing between them.
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
* ⭐ **OBJECT ROTATION has two submenus** (the owner, 2026-10-03; ⛔ since 2026-10-10 OBJECT ROTATION sits inside TRANSLATION IN WORLDSPACE,
  with only *ROTATION IN WORLD COORDINATES* left — see the 2026-10-10 chronology): *ROTATION IN WORLD COORDINATES* (every slider it had, unchanged) and
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
* 📝 **Draft spec — the green piece's assembly phases** (the owner, 2026-10-03: *"I am trying to reproduce the way kids assemble a toy"* →
  *"write the short spec. This shall apply to the prototype"*): COARSE → APPROACH (a funnel to a standoff on the insertion axis) →
  STANDOFF (fine yaw) → CONTACT (slide in the face plane) → SEATED, while the green piece is held → `GREEN_PIECE_PHASES.md`. Not built.
* ⭐ **The green piece boots at the scene's quaternion** (the owner, 2026-10-04: *"For this specific scene, make the quaternion (1,2,3,4)
  at boot"*): `greenBootOrientation` — `Scene_1` (w, x, y, z) = (1, 2, 3, 4) normalized ≈ (0.183, 0.365, 0.548, 0.730), ~159° about
  (2, 3, 4); any other scene the identity. ⚠ At the first hold the level-out keeps only its heading (`levelHeading`), so the tilt eases
  away then. `tests/proto_green_boot_quat.test.ts`.
* ⭐⭐ **The level-out is a switch, OFF by default** (the owner, 2026-10-04: *"Make a slider in green piece rotation menu to toggle on or
  off the level-out when the green piece is pressed upon. Set default level-out off, so the tumbled pose survive the hold. The alignment
  on gravity shall be the user's own action, not a game compute"*): `greenLevelOutOn` **0** (OBJECT ROTATION › GREEN PIECE ROTATION,
  *level-out at the first hold*). Off, the snapped turn starts from the pose AS IT IS — `Scene_1`'s tumbled (1,2,3,4) survives the hold.
  ⚠ The cost, chosen: a yaw of a tilted piece is a tilted spin about the vertical (its own up circles the vertical) — the "pitch mixed
  with yaw" the level start pose was made to remove; on (1) brings that back.
* ⭐ **The orbit's dy sense inverted** (the owner, 2026-10-04: *"For the orbit, invert the sense of the delta position y input"*): the green
  piece's orbit drag takes dy with its own sign now (`st.orbit.drag(-dx …, dy …)`; it was `-dy`) — finger DOWN raises the piece on the
  rings, finger UP lowers it (the reverse of before). dx unchanged; the inertia follows the drag.

## 7. `1.0.59p-` → `1.0.59r-` (2026-10-04/05) — the rotation stripped, the turquoise piece, the resting face

⭐ The owner restarted twice from `1.0.59m-` (the approach spec): `1.0.59n-` (approach steps 1–2) and `1.0.59o-` (geometric snap stops)
were set aside (*"not satisfied"*). `1.0.59p-from1.0.59m-` → `1.0.59q-` → **`1.0.59r-`** carry what follows. ⛔ All unjudged by a hand.

* ⛔⛔ **THE ROTATION IS STRIPPED** (the owner, 2026-10-04: *"Remove all the rotation from the green piece … the piece shall not move during
  its orbit, for the moment"*) — and with it what only served it: the snapped yaw/pitch turn and its increments, the face cycles, the face
  tracking, the turn cap and the level-out; the press-and-hold latch (`greenHeldForOrbit`) and its behaviours — the white contour, the
  0.4 yaw share, the cross deadband (and the motion tracker's band scale); the pink face's normal. Their sliders went too (OBJECT ROTATION ›
  DOUBLE ORBIT MODE / GREEN PIECE ROTATION; CAMERA › FACE ALIGNMENT IN YAW; the yaw share and cross-deadband rows). ⛔ So §6's entries on
  *outside the sphere*, the snapped turn, the turn cap, the yaw share, the held latch and the level-out are **SUPERSEDED**.
* ⛔ **THE WHITE GUIDE SPHERE IS REMOVED** (*"Remove the white sphere and whatever it controls"*) — it controlled nothing any more.
* ⭐⭐ **THE TURQUOISE PIECE AND THE SWITCH** — a flat-shaded hexagonal prism, as long as the green piece's longest side (103.5 mm), half
  that across its corners; 8 logical faces. **SCENE › *orbited piece (0 = green, 1 = turquoise)*** (`orbitPieceKind`): the piece in use
  is the one the orbit carries (`st.greenBox`), the other hidden; a switch **respawns it as at boot** — the boot quaternion, the rig back at
  its boot yaw / ring / zoom, the camera and the spring from there (`spawnOrbitPiece`). `tests/proto_turquoise.test.ts`.
* ⭐⭐⭐ **THE RESTING-FACE SELECTOR** → [`RESTING_FACE.md`](RESTING_FACE.md): every part not seated (on a Pioneer, or placed in its goal) gets
  the face it rests on and its principal axis — at boot, and the frame it is unseated; the orbited pieces at creation, their resting face
  **filled pink** (the pink ring's colour since 2026-10-06; yellow before), seen faintly **through its own piece** (never through another —
  draw order, `restingXray`).
* ⭐⭐⭐ **THE RESTING-FACE ALIGNMENT** → [`RESTING_FACE_ALIGNMENT.md`](RESTING_FACE_ALIGNMENT.md): while the first touch / left button
  orbits, a **second-finger tap / right tap** is counted; the FIRST turns the piece in 125 ms — **its resting face against the PINK FACE**
  (or the first frozen body's face toward it), **the two faces' long axes parallel** by the smallest turn (§2, `1.0.59q-`; two earlier
  versions superseded the same day). A second finger that moves beyond the deadband is a **pinch** at once; the orbit pauses only then.
  A second touch never grabs a piece while orbiting. The first tap costs one episode.
* ⭐ **The piece turns AGAINST the orbit** (the same amount, about the vertical) — at boot and until it is aligned; ⛔ **not after**
  (*"remove the rotation when the resting piece is aligned"*). A respawn starts it again. ⛔ **Reversed 2026-10-06** — WITH the orbit,
  ×3 (§8).
* ⭐ **`tapMaxDuration` 200 ms for EVERY tap** (Unity's default; it was 250), with a slider in SCENE.
* ⭐ **The camera's yaw offset 2.5°** (it was 3°; the slider in 0.5° steps).
* ⭐⭐ **A pinch zooms only while BOTH fingers move** (the owner, 2026-10-06: *"zoom can be triggered only if both delta positions are
  outside deadband. If one of the two is inside deadband, no zoom"*): each pinching finger's own motion state (`PinchMotion`,
  `input/pinch_gate.ts`, §1.1's tracker per finger); one still → no zoom, the pinch rebased (no jump on resume). ⛔ A per-event test never
  zooms (the browser sends one finger at a time) — found headless. → `RESTING_FACE_ALIGNMENT.md` §4. Deployed `5fdf351`.
* ⭐⭐ **The alignment tap is a second touch ON the piece; a second touch OFF it zooms** (the owner, 2026-10-06: *"Zoom is triggered by
  second touch outside the piece, resting face alignment triggered by second touch tap on the piece. For desktop, no change"*). It removes
  the jump at a pinch's start (the first finger orbited while a second finger anywhere waited to be judged a tap). A second finger on the
  piece never zooms; the orbit goes on. → `RESTING_FACE_ALIGNMENT.md` §1, §4.
* ⭐ **…and one finger moving is enough to zoom again** (`1.0.59s-`, the owner, 2026-10-06: *"The zoom can be triggered by only one delta
  position outside its deadband (no need for two … as we have removed the uncertainty on the zoom inputs)"*): `pinchZooms` = either finger
  MOVING; both still, no zoom. → `RESTING_FACE_ALIGNMENT.md` §4.

## 8. `1.0.59s-Zoom` → `1.0.59u-from1.0.59s-Orbit-around-piece` (2026-10-06) — the orbit around the piece

⭐ `1.0.59s-Zoom` closed with one finger moving enough to zoom (§7). `1.0.59t-` built a CAMERA APPROACH PATH (the camera above, then to
the right of the piece as it came in; its spec `CAMERA_APPROACH_PATH.md` lives on that branch) — set aside (*"I am not satisfied of this
implementation"*); the owner restarted from `1.0.59s-` on **`1.0.59u-from1.0.59s-Orbit-around-piece`**. ⛔ All unjudged by a hand.

* ⭐⭐⭐ **THE ORBIT AROUND THE PIECE** → [`PIECE_ORBIT.md`](PIECE_ORBIT.md) (`d3e0c07`, `68b4584`, `f98b584`): from the first resting-face
  alignment the camera orbits the PIECE — dx turns the camera around it (the piece stays), dy moves the camera through the rings' pitches
  and pushes the piece on a straight line through the pink gizmo, which stays where it is. At the alignment the camera does not move: its
  view axis slerps to the piece with finger travel (`pieceOrbitSlerpMm`, 10 mm), and the difference from the rings' angles fades out (`pieceOrbitFadeMm`). The gap
  scales from the alignment's distance to x % at the rings' closest (`pieceOrbitGapMinPct`). The yaw is slower by ONE game-wide gain
  computed from the sliders (×0.74 today). ⛔ No way back to the centre yet but a respawn.
* ⭐ **CAMERA › CAMERA ORBIT is renamed CAMERA ORBIT AROUND CENTER**; a new **CAMERA ORBIT AROUND PIECE** holds three sliders: the gap %, the fade-out and the slerp.
* ⭐ The HUD's `camera` line reads `r=… to the piece` in that mode; the `green` line `around the piece, yaw gain ×…`.
* ⭐⭐ **Before the alignment the piece turns WITH the orbit, three times as far** (*"when in orbit around center, yaw rotate the piece in
  the other direction"*, *"rotate twice faster"*, *"set the default piece yaw per orbit yaw to 3"*): carried `d` round the centre, it turns
  `+3d` on itself — `(k − 1)·d` = 2d as seen from the camera. The factor is a slider, CAMERA › GREEN PIECE ORBIT › *piece yaw per orbit
  yaw* (`orbitPieceYawFactor`, −3…3; −1 = the old "against"). Still stopped once aligned → `RESTING_FACE_ALIGNMENT.md` §2bis.

⭐ **`1.0.59v-`** (2026-10-07, from `1.0.59u-from1.0.59s-Orbit-around-piece`):

* ⭐⭐ **The alignment and the orbit around the piece are two independent actions** (`86afd21`; *"Make those two actions independent,
  although triggered by the same input"*) — `alignRestingFace` and `enterPieceOrbit`, both called by the same tap → `PIECE_ORBIT.md` §1bis.
* ⭐⭐ **The orbit around the piece ends by itself** at `pieceOrbitEndPct` % (50) of the piece's start distance to the pink gizmo, and
  **the way back to the centre orbit is the way in reversed** — at that end or at a respawn (`f8beaf5`) → `PIECE_ORBIT.md` §6.
* ⛔ A two-phase way back (`b80111a`) was built and reverted by the owner (`bb0b79b`).
* ⭐⭐ **The start and end transitions ease every frame, as the orbit does** (*"Smooth the movement of the camera at start and end of
  piece orbit"*): they read the finger's travel through the orbit's own spring (`boxSmoothMs`) instead of in steps at each pointer
  event → `PIECE_ORBIT.md` §6bis.
* ⭐⭐ **The way back moves AROUND THE PIECE, its view tied to the move, one value** (`pieceOrbitReturnMm`, 60 mm; the piece was lost from
  view when the camera started between it and the gizmo) → `PIECE_ORBIT.md` §6.

⭐ **2026-10-08** — `1.0.59v-` renamed **`1.0.59v-Way-In-for-Piece-Orbit`**; work goes on on **`1.0.59w-`**:

* ⭐⭐ **The way in rebuilt** (`PIECE_ORBIT.md` §2): one progress, `pieceOrbitEnterMm` **12 mm**; the PIVOT handed over gradually — dx turns
  the camera round the piece while the piece is carried round the gizmo by the share left of the way in; the view straight at a point
  sliding from the gizmo to the piece, paced to turn evenly (option B); one yaw speed through the way in and the orbit; never cancelled.
  ⛔ Tried and dropped the same day: the orbit from the tap (sweeps), the fingers keeping the centre orbit to the end (a sudden slide),
  the per-axis way in (reverted), the view by angle, option A.
* ⭐⭐ **The end and the way out** (§6): **75 %** of the distance at the piece orbit's start **AND a clear push step** (|dy| ≥ 2 |dx|, dy
  outside the deadband); the way out in **30 mm**, keeping its squared turn (*"I prefer the squared turn for the way out"*). ⛔ A forced
  way out (no room before the waist) was built and dropped.
* ⛔ **Three rings (the 2nd and 3rd merged, a 4 / 3 slider) — tested and rejected** (`1.0.59x-`, 2026-10-09, *"transitions are too fast
  between rings"*; `5ba6af2` reverted by `f1c0d9a`): the four rings stay → §6, after *"THE WAIST WITHOUT ITS PLATEAU"*.

⭐ **2026-10-08/09** — `1.0.59x-` renamed **`1.0.59x-Automated-approach-and-min-distance`**, then **`1.0.59y-Zoom-added`**, then
**`1.0.59z-Rotation-of-resting-face`**:

* ⭐⭐⭐ **The WHITE SPHERE round the pink gizmo drives the ways in and out** — inside below 0.9 r the way out, outside beyond 1.1 r the way in
  (`pieceSphereRadiusM`, 1 m); the tap only aligns; the 75 % + push end is deleted → `PIECE_ORBIT.md` §9.
* ⭐⭐ **No jump at either crossing, aligned or not; no spin with the orbit while the sphere is on; the way out's offset measured where the
  piece is drawn (a flick no longer holds it off); the piece's own minimum distance ZERO** (it rode the camera's 0.15 m) → `PIECE_ORBIT.md` §9.
* ⭐⭐ **Every object has a RESTING FACE in the OBJECT MODEL**, tracked with the body — frozen and seated parts included; **the green and
  turquoise pieces are IN the model** (`orbited`: synced from the orbit, nobody's obstacle, no action, empty space to a touch) →
  `RESTING_FACE.md` §11.
* ⭐ **The zoom acts outside the sphere** (`zoomScale`) → `PIECE_ORBIT.md` §9.
* ⭐⭐ **A tap on an aligned piece ROLLS it to the next edge** — clockwise on the screen, 90° on the green piece (long axis → short axis),
  60° on the turquoise one → `RESTING_FACE_ALIGNMENT.md` §11.

⭐ **2026-10-09/10** — on `1.0.59z-Rotation-of-resting-face`, then **`1.0.61-from1.0.59z-`**:

* ⭐⭐ **A second-touch tap on a placed piece moves the pink face** (a pinch from it still zooms) → `RESTING_FACE_ALIGNMENT.md` §14.
* ⭐⭐ **A first-touch / left-click tap on the orbited piece makes the face it hit the resting face**, aligned; the rolls carried over when the
  pink face is unchanged → `RESTING_FACE_ALIGNMENT.md` §13.
* ⛔ The piece pushed ALONG THE RINGS in the orbit round the piece — built and reverted (*"I want the straight line"*) → `PIECE_ORBIT.md` §10.
* ⭐⭐⭐ **The resting face's CENTRE rides the rings** (every turn pivots on it), and **the way out's leftover fades by the further of the travel and
  the progress toward the waist** — pure dy reaches 0.09 m → `PIECE_ORBIT.md` §10.
* ⭐⭐ **The white sphere: in at its radius, out at it once armed within 10 %; 2.3 m** → `PIECE_ORBIT.md` §10.
* ⭐⭐ **The roll goes to the next COUPLE of edge-to-edge symmetry axes** (resting face ↔ pink face): green 90°, turquoise 30° →
  `RESTING_FACE_ALIGNMENT.md` §12.

⭐ **2026-10-10** — `1.0.61-from1.0.59z-`, then **`1.0.62-`** — ⭐⭐⭐ **merged into `main` and served at the site root: the prototype IS the main
line**, `/proto/` and `PROTO_BRANCH` retired → `50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md`:

* ⭐ The white sphere: a show / hide slider, **hidden by default** → `PIECE_ORBIT.md` §11.
* ⭐⭐ The way in re-aims to the piece (and fades the camera's start shift) by **dx alone** — no up-right slide on a pure dy → `PIECE_ORBIT.md` §11.
* ⭐⭐ Outside the sphere the orbit's **dx rolls** the aligned piece — every axis within 45°, clockwise to the right; a fresh count per drag; the
  count signed → `RESTING_FACE_ALIGNMENT.md` §15.
* ⭐⭐ A new pink face leaves the piece alone (the rolls go on; aligning takes a press); the piece **boots aligned to the floor** →
  `RESTING_FACE_ALIGNMENT.md` §16.
* ⛔ Every object twice as big — tried and reverted → `PIECE_ORBIT.md` §11.
* ⭐⭐ **The white sphere: in at its radius, out beyond 1.1 r** — a shallow dip no longer locks the piece in the centre orbit outside it →
  `PIECE_ORBIT.md` §11.
* ⭐⭐ **The tuning menu's last section is TRANSLATION IN WORLDSPACE** (the owner: *"create a submenu TRANSLATION IN WORLDSPACE and move to
  this submenu all the sliders which we do not use in the current movement of the green and turquoise pieces and their effect on the other
  pieces of the scene"* → *"put it at the bottom, with the moved sections nested inside it under their current names. leave the two as they
  are now"*). It holds the sliders read only when a scene PART is grabbed, nested under their old names, keys and values unchanged:
  OBJECT TRANSLATION (collision allowance, screen-plane and depth gains, inertia, damping, phantom lead, roll drag, the translate sway),
  the whole OBJECT ROTATION › ROTATION IN WORLD COORDINATES, and FACE ALIGNMENT (face highlight opacity, PIONEERFACECURSOR,
  FOLLOWERFACE with CAPTURE). ⭐ Left where they were: OBJECT TRANSLATION's *lock pieces in their goal*, the motion deadband, the rest
  floor and gap, the sway re-trigger and reference speed (the orbit finger and the orbit's sway read them); FACE ALIGNMENT's *highlight
  offset* (it lifts the resting-face fill); and, by the owner's choice, *centre grace* and the never-grabbed goal mm / °. A section's
  open / closed memory is keyed by its path, so the two OBJECT TRANSLATIONs and FACE ALIGNMENTs do not share it.
  `tests/proto_menu_worldspace.test.ts`.
* ⛔ **The camera reset is deleted** (the owner: *"what does a double tap of first touch or left click do? is it useful in the current
  build? can this function be removed?"* → *"remove the camera reset"*): a double tap (first touch) or double click (left button) on empty
  space flew the orbit rig home — yaw, elevation, zoom — over `cameraResetMs`, and in this build the rig places the ORBITED PIECE, so it
  threw the piece back to its boot spot on the rings, past the orbit's own smoothing (read from the code, not reproduced). Now such a
  tap is only recorded (§1.3's history) and may still toggle the mode; `resetCamera` is deleted. ⚠ Kept: `CameraResetAnimation` and its
  vectors (no caller now), and `cameraResetMs` (CAMERA ORBIT AROUND CENTER, *reset time*) — it still sets the alignment turn's speed
  (`ALIGN_SNAP_FRACTION`). ⭐ The undo on a double tap on a scene PART (`D111`/`D141`) is untouched. `tests/proto_no_camera_reset.test.ts`.
* ⛔ **The second-touch / right tap no longer ROLLS** (*"superfluous as we have a roll movement already controlled by dx drag"*) **nor
  aligns an unaligned piece** — and ⭐ **every new spawn is aligned AT ITS SPAWN** (the rule written for any piece a later level spawns) →
  `RESTING_FACE_ALIGNMENT.md` §17; ⭐ the tap aligns again to a **NEW pink face** only (*"build it with old input"*) → §19.
* ⭐⭐⭐ **THE YAW AND THE PITCH outside the sphere** — built, then reshaped four times the same day → `RESTING_FACE_ALIGNMENT.md` §18:
  the piece tips over its resting face's EDGES onto the next face of the SECTION LOOP (the turquoise's side faces reachable); dy pitches,
  dx yaws (rolls on a horizontal face); a whole path moves on to the next edge direction (generalised: a full turn counts as whole), and
  the input reversed walks the faces back across the swaps; a stop resets; ⛔ ONE turn in flight (the clamp — fast moves made a turn past
  180° eased the short way, about another axis; the dx roll clamped too). ⭐ **The input** (*"first touch delta position (dx or dy) while
  second touch is pressed outside a placed part and kept held and within delta positon deadbands"*; desktop: left drag with the right
  button held) — ⛔ the two-finger parallel slide is deleted; ⭐ and **a pinch zooms only once BOTH fingers move past the dx deadband**.
  Slider: CAMERA ORBIT AROUND PIECE › *yaw / pitch: travel per face* (12 mm). `tests/proto_tumble.test.ts`.

⭐ **2026-10-11** — on `1.0.63-`:

* ⛔⛔ **The yaw / pitch stopped, and the piece then ORBITED through the white sphere with the second touch pressed** (*"at one point the
  yaw-pitch stops … the piece crosses the white sphere even if the second touch is presses"*): the held touch was judged against its PRESS
  point, its creep dropped the gesture, and the first finger fell back to the old *keeps orbiting while a second touch is on the piece*.
  ⭐ Now a TRAILING anchor: the held touch moving PAUSES the yaw / pitch, still again RESUMES it; both fingers across ZOOM; never the orbit
  while both are down. The desktop has no such path (both buttons held swallow every move) → `RESTING_FACE_ALIGNMENT.md` §18.

⭐ **2026-10-11** — on `1.0.64-` (`1.0.63-` renamed `1.0.63-Resting-face-path`):

* ⛔⛔⛔ **THE WHITE SPHERE IS DELETED, AND THE YAW / PITCH WITH IT** — the way in, the orbit round the piece and the way out are the **HELD
  SECOND TOUCH**'s (the right button on a desktop): held off the orbited pieces + the first touch's dx — the way in, round the piece, the
  roll; released — the way out (both by finger travel, their sliders kept); the first touch lifted and pressed again — the same input; its
  press on a placed part's face — the pink face, aligned (never the floor; taken at the way in or the release, never by a pinch); the
  highlights held 750 ms then faded 250 ms (one slider, two cursors) → `RESTING_FACE_ALIGNMENT.md` §20. `tests/proto_hold.test.ts`.
* ⭐ After the first deploy: the highlights only after an ACTION (a second-touch tap on empty space lit them); a SECOND-touch tap (a right
  click) on the orbited piece selects the resting face too; ⛔ the piece no longer moves toward −z when the second touch lifts — the way out
  and the way in read the resting face's centre (the anchor), not the mesh's origin (20.6 mm headless) → `RESTING_FACE_ALIGNMENT.md` §20.
* ⭐⭐ The desktop's held second touch is **ALT or CTRL** (not the right button, which now does nothing in the orbit): key + left drag — the
  way in; key up — the way out; key + left click on a part — the pink face → `RESTING_FACE_ALIGNMENT.md` §20.
* ⭐ The key + left click tap takes the pink face at the click, the key still held; the highlights default to hold 300 ms, fade 250 ms →
  `RESTING_FACE_ALIGNMENT.md` §20.
* ⛔ A plain left click on a part then the key + click on the same face did not align — "the same face" is now the face the piece is ALIGNED
  to, not the pink face → `RESTING_FACE_ALIGNMENT.md` §20.
* ⭐ The pink face is taken AT THE PRESS (the key + left press; a second finger's press) — option B undone, its pinch cost named; the same face
  again shows the highlights → `RESTING_FACE_ALIGNMENT.md` §20.
* ⭐ The zoom by the second finger alone — its dx past the deadband, the first still → `RESTING_FACE_ALIGNMENT.md` §20.
* ⭐⭐ The desktop's ALT / CTRL acts on its own PRESS — a raycast at the cursor: a part's face — the pink face; the orbited piece — the resting
  face; the left click names nothing → `RESTING_FACE_ALIGNMENT.md` §20. Branch renamed `1.0.64-Simplified-double-orbit`; work goes on on `1.0.65-`.

⭐ **2026-10-11** — on `1.0.65-`:

* ⛔ A CTRL tap mid-orbit no longer makes a way in and a way out (a tap never starts the way in); a CTRL held no longer freezes the orbit
  (undecided, the drag orbits the centre) → `RESTING_FACE_ALIGNMENT.md` §20.
* ⛔⛔ The orbit centre and the pink face are separate: a plain press on a part moves the centre only, the pink face is the second touch's
  alone; the boot pink face is the floor's (the face the piece is aligned to); a switch hides the pink gizmo → `RESTING_FACE_ALIGNMENT.md` §20.
* ⭐ The pink gizmo is HIDDEN by default (`pinkGizmoVisible` 0; *"make the default pink gizmo hidden"*) — its slider shows it → `RESTING_FACE_ALIGNMENT.md` §20.
* ⭐ The pink gizmo SHOWN by default again (*"set the default : pink gizmo shown"*).
* ⭐⭐ Space and Shift + drag OFF in the orbit (`orbitModifiers`) — Space + click took the pink face; ⭐⭐ a first touch held on a part is the held
  input's first touch (the drag froze); ⭐⭐ the second touch's TAP with the first held rolls to the next axis (`holdTapRolls`) →
  `RESTING_FACE_ALIGNMENT.md` §20.

## 2026-10-12 — on 1.0.66-

* ⭐⭐ Zoom ↔ way in + roll WITHOUT LIFTING (mobile; the desktop unchanged): the second finger's dx → zoom; it rests 150 ms + the first finger's
  dx → the roll again (`holdSwitch`, `holdSwitchRestMs`) → `RESTING_FACE_ALIGNMENT.md` §20.

## 2026-10-12 — on 1.0.67-

* ⭐⭐⭐ THE ORIENTATION CUBE — a polyhedron of the level's distinct face directions (seated parts + frozen bodies; a cube in `Scene_1`) in a
  bottom-right window (22 mm × a 0–200 % slider, 0 hides it); tap a facet — the resting face sits against it; tap the lit facet — the roll;
  rebuilt at every goal commit; ⏭ the non-seated parts later (every frame) → `RESTING_FACE_ALIGNMENT.md` §21.
* ⭐⭐ The window COPIES the part that hosts the pink gizmo (and the gizmo), the polyhedron fitted over it, back facets hidden, the lit facet
  strong pink; a two-cursor position slider (boot: a touch screen bottom-left, a desktop top-right, clear of the HUD / ☰ / ⏸); ⛔ the boot
  fixed — the piece rests on the floor's TOP → `RESTING_FACE_ALIGNMENT.md` §21.
* ⭐⭐ The polyhedron NOT fitted: its own shape, centred on the part, holding it; every facet faint glass; the pink face solid where nothing is in
  front and a faint ghost through the part — always visible, veiled a little by a front facet → `RESTING_FACE_ALIGNMENT.md` §21.
* ⭐⭐⭐ The CANDIDATE support face (the facet facing the camera most) carries a fading copy of the orbited piece in the pose it would take (the
  next roll when it is the pink face); the cube HELD + the other touch's drag (desktop: ALT / CTRL in the window + a left drag) scrolls the
  alignment through the candidates — a continuous snapped rotation, one episode → `RESTING_FACE_ALIGNMENT.md` §21.
* ⭐⭐⭐ The window redrawn: no part, no gizmo; inside the cube, in the CANDIDATE face's plane, (a) the piece as it is → (b) a red arrow → (c)
  the piece as it would be, standing on its resting face; the pink face fades as the scene's → `RESTING_FACE_ALIGNMENT.md` §21.
* ⭐⭐ The window: ONE copy of the piece as the candidate face would make it, at the cube's centre (×1.2, 70 % opaque, its resting face's
  edges yellow); the candidate face outlined yellow; no transitions; the piece's and the cube's pink faces never fade; a fading copy no
  longer flies out into the scene mid-orbit → `RESTING_FACE_ALIGNMENT.md` §21.

## 2026-10-12 — on 1.0.68-

* ⭐⭐ The window's copy seated on the candidate face, riding the cube (no transition, never out of the window), the old copy gone at once.
* ⛔⛔ Alignment by the CUBE ONLY: no pink face from a part (second touch, ALT / CTRL raycast deleted); a second-touch tap on a placed part moves
  the orbit centre; the pink fill, the highlights' clock and its slider deleted; the boot aligns to the cube's +y → `RESTING_FACE_ALIGNMENT.md` §22.
* ⭐⭐ The window: a clicked face shows the copy at once (the next orientation); the scene's resting face and the cube's aligned face are YELLOW
  contours, the travelling face (candidate / clicked) PINK; the copy unoutlined; a red arrow of the turn piece → copy in the corner opposite
  the copy; desktop: the window follows the cursor while orbiting (frozen at the release), 175 % → `RESTING_FACE_ALIGNMENT.md` §23.
* ⭐ The arrow at the cube's centre (0.55); a roll's arrow its own clockwise turn about the resting face's normal; the window GLIDES to the
  cursor (a drag only, half a window further right), 150 % on desktop; ⭐ the follow is a SCENE switch, OFF by default → `RESTING_FACE_ALIGNMENT.md` §23.

## 2026-10-12 — on 1.0.69-

* ⛔ The red arrow of the orientation window deleted → `RESTING_FACE_ALIGNMENT.md` §23.
* ⏸⏸ The way in, the orbit round the piece, its dx roll and the way out COMMENTED OUT (kept); the STANDARD pinch on touch; a first-touch / left
  tap on empty space taps the cube's pink face → `RESTING_FACE_ALIGNMENT.md` §24.

## 2026-10-12 — on 1.0.70-

* ⭐⭐ The resting-face quads replace the orientation window (deleted, with its sliders); the pink direction's quad yellow; a tap on a quad aligns
  to its side; the piece's own faces first; the gizmo yellow and thinner; the 1st and 4th rings to 6 m (boot still 3 m) →
  `RESTING_FACE_ALIGNMENT.md` §25.
* ⭐⭐ The 1st and 4th rings at 5 m, mirrored at 51° (the horizontal quad reachable on both, a HUD alert otherwise); the quads 0.1 → 1.4 over the
  piece's distance range; the gizmo a 1 px line → `RESTING_FACE_ALIGNMENT.md` §25.
* ⛔ The 5 m / 51° rings REVERTED to 6 m (all quads turn yellow on the max-distance orbit — now a rule with a HUD alert); the quads 0.01 at half
  the farthest distance (hidden nearer) → 1.4 at the farthest → `RESTING_FACE_ALIGNMENT.md` §25.
* ⭐ The quads' smallest size is ONE PIXEL on the glass (at half the farthest distance) → `RESTING_FACE_ALIGNMENT.md` §25.
* ⭐ The resting face's yellow outline as the quads: one pixel at least, hidden below half the farthest distance (the flickering point) →
  `RESTING_FACE_ALIGNMENT.md` §25.

## 2026-10-13 — on 1.0.71-

* ⭐ The quads (and the resting outline) grow along a LOGARITHM, fastest when small (steepness 9, a slider) → `RESTING_FACE_ALIGNMENT.md` §25.
* ⛔⛔ The second-touch tap on a placed part moves the gizmo again: a tap that wobbled into the pinch is a tap (`holdTapMode`) → §26.
* The vectors that read only commented-out (`// ⏸`) code are pruned (15 assertions, `kept()` deleted).
* ⭐⭐ The second touch's tap on empty space (first held) taps the YELLOW quad, as the first touch's does (it only rolled) → §26.
* ⭐⭐ The camera's pitch offset MIRRORED below the level: the 4th ring's camera 42.9° below the piece, all quads yellow on both rings → §26.

## 2026-10-13 — on 1.0.72-

* ⭐⭐⭐ The orbited piece COLLIDES: the orbit step slides in orbit coordinates (the camera stops with it), every turn checked whole and refused
  when blocked, the yellow quad RED meanwhile → `COLLISION.md` §11, `RESTING_FACE_ALIGNMENT.md` §27.
* ✅ The piece's collision judged on the device (*"Ok. Working."*), against Piece2 placed on the 1st ring at 5.6 m for the test — then put back.

## 2026-10-13 — on 1.0.73-

* ⭐⭐ The piece's slide made smooth: collide and slide in the orbit's coordinates (the step projected through the ring's Jacobian, a rest gap,
  only the input into the contact discarded, the skin held) — the stair-step jitter measured and removed → `COLLISION.md` §11bis.
* ⏸ Slide or block (the discriminant), and where the piece can get STUCK (the gizmo moved under it, a part moved into it, pinched, spawned inside) — fixes offered, nothing built → `COLLISION.md` §11ter.
* ⭐⭐ Case 3: the orbited piece an OBSTACLE for the other parts; a STUCK piece (position and quad turn both blocked) respawned by a double tap / click on it — ⚠ an episode MALUS owed → `COLLISION.md` §11quater, `SCORE.md`.
* ⭐ The stuck piece: a RED pop-up — *Part is blocked. Double-click (Double-tap) the part to restart* — while it is stuck → `COLLISION.md` §11quater.
* ⭐⭐ The orbit's TARGET guarded as a part's input step is (the jitter's architectural cause: the spring and the camera chased a refused input); the red message only when EVERY position step and EVERY quad turn is blocked → `COLLISION.md` §11quinquies.
* ⭐⭐ A large orbit step checked ALONG THE RING (≤ 2° / 2 cm sub-steps), not its chord — the spring effect and the false red flag at large dx; the stuck probes from the piece as it is → `COLLISION.md` §11sexies.
* ⭐⭐ The guards never freeze a frame: a 4 ms budget (the rest of a step kept for the next frame), cheaper slides, the stuck check spread over frames, the quad check paused mid-sweep; the HUD shows the guards' peak → `COLLISION.md` §11septies.
* ⭐⭐ The head-on block UNLOCKED by a step away from the touched part; the approach made cheap (conservative advancement, the 4 ms budget kept); the ring height the finger set kept (the magnet); HUD flags d / H / U → `COLLISION.md` §11octies.
* ⭐⭐ A DRAG from a placed part no longer moves the gizmo (a TAP does) — every re-press moved the ring under the piece and could lock it; the guard starts from the piece as it is when its ring place is in a part → `COLLISION.md` §11nonies.
* ⭐⭐⭐ The orbited piece's collision REBUILT after the audit: one solved place on the ring, a 1 mm gap in the world (reversible by construction), conservative advancement along the arc, an exact slide, a work cap in gap queries, the nearest free place when the ring moves into a part, turns and stuck by the same rule; the eye is the orbit's spring toward the SOLVED place (the path follower shook with the finger) and a slide never goes against the finger → `COLLISION.md` §12, §12bis.
* ⭐⭐ The second audit's fixes: the orbit drag through §1.1's deadband (a sloped slide no longer stutters), the stuck check scheduled with a verdict per key (no more ~60–90 queries a frame at rest), a piece inside a part arms the pop-up, the turn in flight held near a part, the relocation straight out of the contact, the frame decided in `input/` (`orbitFrame`) → `COLLISION.md` §12ter.
* ⭐⭐ The third audit's fixes: the directional stride (no crawl alongside a part), a finger reversal drops the capped backlog, the relocation under the cap and resumed, the stuck verdict kept across a churning key (the scene signature, shared with the red quad), the double tap no longer disarmed by its first tap, the orbit drag's own 2.3 mm deadband → `COLLISION.md` §12quater.
* ⭐⭐ The fourth audit's fixes: the long slide at the gap kept (a piece resting on a part no longer crawls along it), the plane bound for a stride's path (anchors only), the second gap per convex part, the orbit drag's band ticked, the armed pop-up rechecked at once → `COLLISION.md` §12quinquies.
* ⭐⭐ The fifth audit's fixes: the orbit drag's band re-arms only after a 400 ms PAUSE (a stop-and-go approach lost up to 87 % of its travel), the plane bound pinned by a vector, the stuck verdict kept across a nudge, the turn sweep refined near a part (and never "free" when its budget ran out) → `COLLISION.md` §12sexies.
* ⭐⭐ The red square no longer lingers: the quad's turn is re-asked while the piece moves (it paused above 3 mm a frame), under the frame's leftover budget, free at once when clear; the sixth audit's fixes — the stuck gate in `input/`, the turn sweep certified, a resting finger's tremor no longer keeping the orbit band moving → `COLLISION.md` §12septies.
* ⭐⭐ The orbit sway by DISTANCE (0.1° at the rings' closest → the slider's at their farthest; 0.1° while the piece slides on a part), swung about the barycentre of the PLACED parts → the orbit sway bullet above (2026-10-14).
* ⭐⭐⭐ THE HOVER (2026-10-14): a drag starting on the orbited piece, its resting face against a part's face, slides it (and the gizmo) on that face's plane — deadbanded, followed like a translated part, bounded, across coplanar faces, the camera easing to a face-on view, the sway at its least; and the orbited pieces' GOALS (centred on Piece4's top, x/42, captured during orbit and quad turns, then placed) → `HOVER.md`, `LEVEL_END.md` §5quater, `COLLISION.md` §12octies.
* ⭐⭐ The hover's second pass (2026-10-14): face-to-face contact, a 20 mm REACH with a SETTLE onto the face, contact made visible (the contact shadow, the hosting face's fill, the cyan contour), every refusal named on the HUD; the orbited piece's goal judged by its own 5 mm / 3° in the world (it read 35 mm off as placed) → `HOVER.md` §8.
* ⭐⭐ The hover's audit fixes (2026-10-14): the follower DRAWN only (the model the solved place — it overshot a wall by 1.5–2.2 mm and the relocation jumped the piece), a held second touch or a capture ends the hover, the view retargets on a new face, coplanar faces tie by the face under the piece, the pitch turns up on a side face, the fade solved, the goals on Piece4's contour → `HOVER.md` §9.
* ⭐⭐ The hover's second audit fixes (2026-10-14): the orbit held still under a hover, one hover solve a frame inside the 24-query budget with the cut travel kept, parts left out only below the piece's own height, the resting face required over the face, the settle model at once, a capture spends its finger → `HOVER.md` §10.
* ⭐ (2026-10-14, `1.0.76-`) the hover's defaults: the piece alone, unlimited; the hover view ISOMETRIC (equal on the three orthogonal planes, above-right of the face) at the boot distance for the current zoom; the ready highlight green #D8FDD2 → `HOVER.md` §12.
* ⭐⭐ (2026-10-14) after a hover, the orbit WAYS IN: the piece-only offset goes back by the orbit drag's travel over `pieceOrbitEnterMm` (the way in's curve), no jump; the gizmo untouched → `HOVER.md` §13.
* ⭐⭐⭐ (2026-10-14) the hover view is the NEAREST isometric corner of the hosting face (left/right, above/below — where the camera already is), reached on an ARC about the piece at the camera's own distance and left the same way onto the rings by the way in's travel; each hover finger step read by two rays from the camera of the moment → `HOVER.md` §14.
* ⭐⭐⭐ (2026-10-14) the hover latches on ANY portion of the resting face over a face (a dy collision near the gizmo latches at once); a green outline of the coplanar hosting faces; off them the drag orbits on → `HOVER.md` §15. The quads hidden, the gizmo's supporting face is the mating face (yellow, faded); a tap on the piece aligns to the direction shown → `RESTING_FACE_ALIGNMENT.md` §28.
* ⭐⭐ (2026-10-14) the hover BOUNDED by the hosting faces (no switch to the orbit); its draw, the way back and the hover view's share on the orbit's spring → `HOVER.md` §16. The resting contour and the supporting face's yellow grow again toward the gizmo — the quads' mirror → `RESTING_FACE_ALIGNMENT.md` §29.
* ⛔⛔ (2026-10-14) the hover froze: the new hover view was ended the frame after it began, so the camera never turned and a grazing finger moved nothing — fixed (`hoverViewEnds`) → `HOVER.md` §17; the resting face's yellow always full; the supporting face's yellow no longer flashes full as it fades.
* ⭐ (2026-10-14) the hosting face's yellow is full size, faded in as the quads disappear and out as they appear; the mirror growth deleted → `RESTING_FACE_ALIGNMENT.md` §29.
* ⭐⭐ (2026-10-15) the hover's EDGE MARGIN (2 mm, a slider); the desktop slide's jitter (the drawn lag's part across no longer dropped); a one-axis step taken up to the edge → `HOVER.md` §18.
* ⛔⛔⛔ (2026-10-15) the orbit TUNNELLED through a part (a dy near a ring with the owner's 0.2 m rings): a stride is measured on its own travel, a piece inside leaves by strides that open the gap → `COLLISION.md` §12nonies.
* ⭐⭐⭐ (2026-10-15) the QUADS GATE THE TURN — a tap turns the piece or picks its resting face only while they show; the hosting face's yellow deleted (§28 superseded); the resting face's contour green, shown with the quads or a slide; unlit quads 30 % fainter; quads hidden at 65 % of the farthest → `RESTING_FACE_ALIGNMENT.md` §30.
* ⭐ (2026-10-15) the unlit quads fainter still: edges 0.2, fills 0.05 (the yellow one unchanged) → `RESTING_FACE_ALIGNMENT.md` §30.
* ⭐⭐ (2026-10-15) the unlit quads 0.1 / 0.025 with a slider (`quadUnlitAlpha`, the fill a quarter); the yellow gizmo's verdict held 120 ms (it blinked across a thin part on a far orbit — measured, and present two days back too); the slider renamed *yellow gizmo* → `RESTING_FACE_ALIGNMENT.md` §30–§31.
* ⛔⛔ (2026-10-15) the quads' edges never faded (a Babylon line blends only with `useVertexAlpha`) — fixed, the slider live; the yellow gizmo ALWAYS SEEN while its slider is on (no ray, no timer; the pink build blinked the same) → `RESTING_FACE_ALIGNMENT.md` §32.
* ⭐ (2026-10-15) the non-yellow quads' opacity defaults to 0.13 → `RESTING_FACE_ALIGNMENT.md` §32; the hover's edge-margin slider moved to the top-level OBJECT TRANSLATION section → `HOVER.md` §18.
* ⭐⭐⭐ (2026-10-15) the hover's bound: the resting face's CENTRE within the drawn green boundary (the outline's own rectangles); the edge margin and its slider deleted → `HOVER.md` §19.
* ⛔⛔ (2026-10-15, `1.0.77-`) the Fable audit's fixes: the hover's freeze with the centre outside (`holdOffBound`), its queries counted, the view retargeted on a new start, the way back not re-solved idle, the contour a frame late → `HOVER.md` §20; the solver's arc settled at 2 % (6 719 → ≤ 3000 anchors a solve), rule (0) out of two margins → `COLLISION.md` §12decies; the quads' distance from the gizmo's target → `RESTING_FACE_ALIGNMENT.md` §32. The U-shape jump kept (the owner).
* ⭐⭐ (2026-10-15, `1.0.78-`) a placed piece set EXACTLY on its goal at every commit → `LEVEL_END.md` §5quinquies; the green / turquoise piece casts shadows, and keeps its own on a slow device (one light, one map, the piece alone) → `40_RENDER_SCENE/INDEX.md`.
* ⛔⛔ (2026-10-15, `1.0.78-`) a rapid drag no longer throws the piece off the boundary (a step never takes the centre farther from it), a face hosts only a resting face in front of it → `HOVER.md` §21; the placed green piece drawn from its model (the exact goal pose was undone) → `LEVEL_END.md` §5quinquies.
* ⛔ (2026-10-15, `1.0.78-`) the gizmo following the resting face's centre during a slide — built and REVERTED the same day (*"I did not like the gizmo to move"*): the tree back to `51bf7e9` → `HOVER.md` §22.
* ⭐⭐ (2026-10-16, `1.0.78-`) the slide stops at the lift and a press on the piece sets it up again; the hover's highlights parented to their host (they follow the sway); the slide's inertia, the part translation's follower (60 ms / 0.5 / 0.2, OBJECT TRANSLATION › PIECE SLIDING) → `HOVER.md` §23.
* ⭐ (2026-10-16, `1.0.78-`) the slide's inertia defaults set by the owner — 40 ms / 0.93; the phantom lead's slider raised to 0–100 ms → `HOVER.md` §23.
* ⭐⭐ (2026-10-16, `1.0.78-`) the slide's KINETIC FRICTION — a finger step × speed / (speed + 10 mm/s), slider in PIECE SLIDING → `HOVER.md` §23.
* ⛔⛔ (2026-10-16, `1.0.78-`) the spent slide no longer re-armed by the orbit's first step (the piece still in contact re-latched): spent until a press on the piece or out of every contact; the slide's lead 9.75 ms, friction 12.5 mm/s → `HOVER.md` §23.
* ⭐ (2026-10-16, `1.0.78-`) the slide's friction 8 mm/s (the owner) → `HOVER.md` §23.

## 2026-10-16 — on 1.0.79-: the rig turned onto the gizmo's face

> *"the following parameters of the rings stay unchanged: ring numbers, ring radiuses, relative height between each ring and the gizmo — The overall 2D
> curve … is rotated so that between the 2nd and 3rd ring, the camera view is anti-aligned with the normal of the face supporting the gizmo. Therefore,
> the script has to recalculate the 2D curve as well as the transforms of all the rings when the gizmo is moved. — Way in and way out shall be similar to
> the current, except that they need to take into account the rotation of the 2D curve."* → *"build, fix the rotation at the camera's yaw when the gizmo
> moves, keep the camera offsets as they are right now (that means disconnecting the offset from the 2D curve if they were linked so that the offsets are
> the same in any 2D curve orientation), top faces: build what you recommend (I want the principle of a plane movement halfway between rings 2 and 3 to be
> conserved)"* — the owner.

* ⭐⭐⭐ **ONE ROTATION OF THE WHOLE RIG** (`input/orbit_rig.ts`): every ring and the curve between them turned together about the gizmo — each ring keeps
  its number, radius and height IN THE RIG'S FRAME. When the gizmo moves onto a face (a tap on a placed part, first touch or the second's), the rig's new
  turn is the SHORTEST that takes its direction HALFWAY between rings 2 and 3 (`waistV`; `Scene_1`: the gizmo's height, the plane movement), at the
  camera's yaw of that moment, onto the face's normal (`rigRotationFor`, the pick's normal) — so a dy advance at that yaw brings the piece in along the
  normal, the camera behind it looking at the face. A side face: a turn about the VERTICAL (the rings stay level; a face behind turns half a round about
  it, never over the top — `rigArc`); a TOP face: the rig tilted 90° (the rings stand up; dx turns the camera over and under the assembly, the owner's
  choice). No face (the boot, a stuck piece's respawn): unturned, as before.
* ⭐ **Eased with the gizmo's slide** (`rigNow` = slerp from the old turn to the new at `centreBlend.progress`, the orbit finger's travel): the camera and
  the piece swing over, never a jump (`retargetGizmo`, `camera_rig.ts`).
* ⛔ ~~The camera offsets added in the WORLD (`rigCameraOffset`)~~ — deleted the same day (below): undefined straight over the gizmo.
* ⭐ **One path**: the piece's anchor (`ringAnchorAt`, so the solver), the drawn piece, the camera, the way in's and the orbit around the piece's ring
  angles, the way out's home pose — all through the turned rig. A turn keeps every distance: the clamps, the zoom, the gap, the 24-query budget untouched.
  ⚠ Still in the rig's own frame: the all-quads-reachable check, the orientation cube, the reference yaw gain, the boot target.
* Headless (touch, `Scene_1`): a tap on Piece3's TOP face → the rig's axis (0, 0, 1); at the waist (v 0.506) the piece's direction from the gizmo
  (0, 0.99, 0.15), the camera above. A tap on Piece31's SIDE face (normal (−1, 0, 0)) → the axis back to vertical; at the waist (−0.99, 0.16, −0.01).
  ⛔ No device close. 2031 vectors (8 new in `tests/orbit_rig.test.ts`, each wiring one red first).

### ⛔ SUPERSEDED the same day (below) — the camera in the rig's frame, dx about the vertical (`1.0.79-`)

> *"in the case I have placed the gizmo on the top face of piece4: dy downwards input brings the piece towards the gizmo … at position in attachment 2
> the dy downwards triggers a very fast orbit of the camera with the dy input: can we slow down this orbit ? — dx input controls a mix of yaw and pitch
> orbit of the piece and camera. This is not clear what the dx input does."* → *"I want the same as when the camera orbit between rings 2 and 3 when
> the face is vertical"*, *"Always yaw about vertical"* — the owner.

* ⛔⛔ **The cause of the fast orbit**: on a vertical face the waist's crossing swings the camera through the HORIZONTAL; on a top face the same crossing
  passes over the ZENITH, and a camera with the world's up crossing straight over its target flips the picture there (and the offsets added in world
  yaw / elevation were undefined at it). ⚠ The waist itself turns the view fast anywhere — 34°/mm at its middle, 118° over ~3.5 mm of finger
  (`Scene_1`: the piece passes the gizmo 9 cm off) — the owner's *"the same as … vertical"* keeps that.
* ⭐⭐⭐ **THE CAMERA IN THE RIG'S FRAME** (`toRigSpace` / `fromRigSpace`, `camera_rig.ts`): the piece and the way in's / way out's recorded poses carried
  in, the camera placed by the code as it always was (`cameraOffset`, the offsets in the rig's frame — so the same ON THE SCREEN in any orientation),
  carried back out, and the camera's UP turned with the rig (`ArcRotateCamera.upVector`). On a top face the crossing is the vertical face's swing,
  turned. The way in's and way out's piece offsets are rig-frame vectors (turned where the piece is placed); the orbit around the piece keeps its line
  in the world; the end-by-distance rebase finds the yaw whose turned ring points at the piece.
* ⭐⭐ **dx YAWS ABOUT THE WORLD VERTICAL** (`rigAtYaw`): the turn fixed at the gizmo's move (`rigYaw0`) and swung round the vertical by dx —
  `yawTurn(δ) · R · yawTurn(−δ)`. Unturned: today's rig exactly; a side face: unchanged (its turn is about the vertical); a top face: the waist stays
  straight above the face at EVERY dx (dx spins the view about its normal). ⚠ On a tilted rig the level circles dx follows are not the rings' designed
  radii (those hold in the rig's frame).
* Headless (touch, `Scene_1`): Piece3's top face — the crossing's largest frame step of the view 1.14°, its up fixed (0, 0, 1), no flip; after dx at
  the waist the piece still above the face. A side face: up (0, 1, 0), 0.87–1.23°. ⚠ The dy drags to the waist also moved the yaw 45° on a side face —
  the collision's slide along the ring (the solver resets the orbit's yaw), not the turn. ⛔ No device close. 2034 vectors.

### ⛔ The roll back to upright — built and REVERTED the same day (`1.0.79-`)

> *"if I continue the dy input from attachment 1, at one point the scene passes upside down"* → (option A built: the rig's up between rings 2 and 3,
> rolled back to upright over the outer stretches, `1ea316f`, live `18321ec`) → *"revert to commit 6d6670f … I don't like the camera roll"* — the owner.

* Reverted (`5c94bc0`); kept as the record: past a top face's crossing the rig's up points back at the camera — a 180° roll is owed somewhere if the
  camera's up follows the rig; the owner refused the roll, and the model below removes the need for it.

### ⛔ REVERTED the same day — level rings with their OWN centres (`1.0.79-`, `59b4531`, live `58c320a`)

> (two sketches: the 2D curve for a vertical supporting face — no change — and for a HORIZONTAL one: rings 1 and 4 high on either side, rings 2 and 3
> just above the face on either side of the gizmo, the plane movement in the face's plane) *"This is slightly different from what you have built."* →
> *"the axis of each ring is the gravity axis (in such way, the camera is never upside down). dx orbits the piece on the ring it is sitting on."* →
> *"consequently, if the supporting face is horizontal, the resting face will never fully contact the supporting face"* → (a shift of the curve onto
> the face proposed) → *"do not build this shift, build only your previous proposal."* — the owner.

> *"your implementation is not what I want. the camera is now completely disconnected from the piece. the ring 3 shall be in the opposite side of the
> gizmo from the ring 2 in the direction of the 2D curve, the 2D curve shall aim at the gizmo at all time during the orbit … analyze what you did
> wrong, revert to previous commit, rebuild"* — *"sometimes the piece bounces back, sometimes it bounces forward"* — the owner.

* ⛔⛔ **WHAT WAS WRONG** (kept as the record): I read *"the ring it is sitting on"* as a level circle of ITS OWN, centred beyond the piece. (1) The rings
  turned about their own off-centre axes, so off the yaw the gizmo was set at the curve SLID sideways instead of turning about the gizmo — ring 2 and
  ring 3 no longer sat across it; (2) the camera took a heading and tilt round the GIZMO while the piece sat on an off-centre ring — it no longer looked
  through the piece; (3) each v step of the solver moved the ring's centre too, so a stop or a slide at a part landed the piece ahead or behind — the
  BOUNCE. Reverted (`533e67f`). The model as it was:
* ~~**dy** — the piece's place follows the 2D curve TURNED (`q`: halfway between rings 2 and 3 along the face's normal at the camera's yaw when
  the gizmo moved, `yaw0`) — `C(v) = q · orbitOffset(yaw0, v)`. **The ring it sits on** — a LEVEL circle (axis = gravity) of the ring's own radius
  `r(v)`, through `C(v)`, its centre BEYOND the piece as seen from the camera (`beta`, `rigBetaFor`: the turned radial levelled; for a top / bottom
  face the camera's side). **dx** — the piece round that ring: `P = centre + r · u(yaw + beta)`.~~
* ⭐ Unturned it is `orbitOffset` EXACTLY (vectored) — the boot, a respawn, no face; a SIDE face: today's rings turned by a yaw. A TOP face: halfway
  between rings 2 and 3 the piece sits 9 cm (× zoom) above the face on a 9 cm level ring — dx slides it ACROSS the face, dy along the curve.
* ⭐⭐⭐ **The camera UPRIGHT** (`rigCameraAngles`): its up the world's, its HEADING `yaw + beta` turned by dx alone (never read off a position, so it
  cannot spin over the gizmo), its TILT the turned curve's elevation, FOLDED — on a top face it rises to straight down at the crossing and comes back on
  the same side; the offsets as before (yaw on the heading, pitch away from the level), ±89°. Never upside down, nothing rolls.
* ⭐ The old turn and the new are BLENDED at the gizmo's share (places straight, the camera's azimuth the short way); the end-by-distance rebase finds
  the yaw whose level ring points at the piece (`rigYawToward`). ⛔ Deleted: the camera in the rig's frame (`toRigSpace`, its up turned), dx as a yaw
  about the gizmo's vertical (`rigAtYaw` — rings 1 and 4 merged), the wheel about the turned rig's axis.
* ⚠ **Known, not built** (the owner: *"do not build this shift"*): halfway between rings 2 and 3 the piece passes `r` (9 cm × zoom) off the face — the
  resting face never reaches a supporting face by the orbit alone (the hover latches within 20 mm). ⚠ Still in the rig's own frame: the all-quads check,
  the orientation cube, the reference yaw gain, the boot target.
* Headless (touch, `Scene_1`): Piece3's TOP face — at the waist the piece 9 cm above the gizmo, the camera looking straight down; the crossing's largest
  frame step of the view 1.0°, its up (0, 1, 0) throughout; dx there: the piece 13 cm across the face at the same 9 cm. A SIDE face: the axis vertical,
  0.6°. ⛔ No device close. 2037 vectors.

### ⭐⭐⭐ THE TURNED CURVE SWUNG ROUND THE GIZMO'S VERTICAL — the camera upright, behind the piece (`1.0.79-`)

* ⭐⭐⭐ **dy** — the piece follows the 2D curve TURNED (`q`, halfway between rings 2 and 3 along the face's normal at the camera's yaw when the gizmo
  moved, `yaw0`). **dx** — the WHOLE turned curve swung round the vertical THROUGH THE GIZMO: `P = yawTurn(yaw − yaw0) · q · orbitOffset(yaw0, v)`
  (`rigPlace`, `input/orbit_rig.ts` — `6d6670f`'s placement). Every ring is a LEVEL circle about the gizmo's vertical (axis = gravity), the curve aims at
  the gizmo at every dx, ring 3 opposite ring 2 across it along the curve. Smooth in yaw and v: a step of the solver moves the piece as far as on the
  unturned rig — no bounce (vectored; headless 0 reversals).
* ⭐⭐⭐ **The camera UPRIGHT and BEHIND THE PIECE** (`rigCameraAngles`): its up the world's; its heading the near side (`beta`) turned by dx alone; its
  tilt the piece's own elevation, FOLDED — on the near side its direction from the gizmo IS the piece's (vectored), past a top face's crossing it comes
  back down on its own side (the piece beyond the gizmo) instead of going over the top: never upside down, nothing rolls. Unturned: `orbitOffset` and
  `cameraOffset` exactly; a side face: today's rig turned by a yaw. The old turn and the new blended at the gizmo's share; the rebase by `rigYawToward`.
* ⚠ Halfway between rings 2 and 3 on a top face the piece is straight above the gizmo (9 cm × zoom): dx turns it in place there, and the resting face
  never reaches the face by the orbit alone (the shift onto the face — not built, the owner). ⚠ Still in the rig's own frame: the all-quads check, the
  orientation cube, the reference yaw gain, the boot target.
* Headless (touch, `Scene_1`): Piece3's TOP face — at the waist 9 cm above the gizmo, the camera straight down; the crossing's largest frame step of the
  view 0.93°, its up (0, 1, 0), the piece's largest frame step 1.5 mm, no reversal. A SIDE face: 0.6°, 1.2 mm, no reversal. ⛔ No device close.
  2040 vectors (4 new fail against the reverted model).

### …and THE SWING ROUND — the camera follows the piece on the second half (`1.0.79-`; ⛔ its width C superseded by B, below)

> *"the camera does not follow the piece on the second half of the 2d curve"* → (three ways over the top proposed: follow exactly — a 180° flip in one
> frame; swing round over the crossing; swing round over a wider stretch) → *"build C. propose the width so that the camera turn has the same speed vs.
> delta input than the rest of the curve"* — the owner.

* ⛔ **Why**: the fold left the camera on its own side past a top face's crossing — it looked at the gizmo with the piece beyond. To be behind the piece
  on the far half an upright camera must change heading by HALF A ROUND; following exactly makes it in one frame straight over the gizmo.
* ⭐⭐⭐ **C — THE SWING ROUND** (`rigSwing`, `rigSwingShare`, `input/orbit_rig.ts`): where the turned curve passes OVER the gizmo (its level direction
  crosses to the far side — a top face; a side face never does: no swing), the camera's heading turns 180° smoothly (smoothstep), always the same way,
  over a stretch centred on the crossing; past it the camera is behind the piece again (vectored on both halves), upright, the tilt within ±89°.
* ⭐⭐ **Its WIDTH is solved from the rings**: the camera's AVERAGE turning speed through the swing (the heading's turn and the tilt's, combined — the
  camera frame's angular speed) equals the vertical face's crossing between rings 2 and 3 (its pitch from ring 2 to ring 3 over their span) — the
  fastest stretch of the curve, accepted by the owner. `Scene_1`: **0.291 of the curve = 11.3 mm of finger** (v 0.354 → 0.646; rings 3 / 2 at 0.429 /
  0.571, 5.6 mm apart — so ~2.9 mm beyond each). ⚠ Matching the outer stretches (≤ 5°/mm) would need ~36 mm — most of the curve. Cached per turn and
  ring set. ⚠ No slider (to add if 11.3 mm feels wrong).
* Headless (touch, Piece3's top face): the camera's direction 5.3° off the piece's on BOTH halves (v 0.979 and 0.028 — the camera offsets), the
  crossing's largest frame step of the view 0.91°, its up (0, 1, 0), the piece 1.5 mm, no reversal; a side face 0.79°. ⛔ No device close. 2041 vectors.

### ⭐⭐ The swing between rings 2 and 3 only — option B (`1.0.79-`)

> *"I don't like this implementation: it looks like the piece does a Z-shape travel. build option B instead."* — the owner.

* ⛔ **C** (the width solved so the swing turned as fast as the vertical crossing — 11.3 mm of finger in `Scene_1`, ~2.9 mm past rings 2 and 3 on each
  side): the camera was still turning while the piece already travelled outside the crossing — read as a Z-shape travel. Kept above as the record.
* ⭐⭐ **B**: the swing spans rings 2 → 3 EXACTLY, centred on the crossing (`rigSwing`'s width = the ring parameter span of rings 2 and 3 — `Scene_1`
  v 0.429 → 0.571, 5.6 mm of finger); outside it the heading does not move, so on both halves the camera is behind the piece (vectored).
* Headless (touch, Piece3's top face): the camera 5.3° off the piece's direction on BOTH halves (the camera offsets), the crossing's largest frame step
  of the view 1.0°, its up (0, 1, 0), the piece 1.6 mm, no reversal; a side face 0.86°. ⛔ No device close. 2041 vectors.

### ⭐⭐⭐ Every movement synchronized — the camera derived from the piece; the gizmo change blended as a turn (`1.0.79-`)

> *"there is still a Z-shape back and forth of the piece when the camera turns. Can you synchronize all movements so that this disappear ? Also, when I
> change the gizmo, the piece does some strange travels and most of the times the camera never catches the offset that should be its offset during the
> travel, with the piece traveling outside the screen during the orbit."* — the owner.

* ⛔⛔ **What was wrong** (one cause, four symptoms): the camera ran on a heading and tilt OF ITS OWN while the piece ran on the curve — they agreed
  only outside the swing. (1) Through the swing the camera turned sideways while the piece went straight over: the Z. (2) A gizmo change blended the
  piece's PLACE in a straight line between the old rig's and the new one's (a chord through odd places) and the camera's angles apart — mid-blend it no
  longer pointed at the piece, and a blend stopped part-way kept it so. (3) The blend's share stepped with each pointer event (~3 %): the piece, metres
  from the gizmo, jerked 12 % of the screen in a frame. (4) The near side was read off the camera's position — its 7° yaw offset tilted the picture 6.4°
  on a top face.
* ⭐⭐⭐ **The camera DERIVED FROM THE PIECE** (`rigCameraFrame`, `input/orbit_rig.ts`): its direction from the gizmo IS the piece's own (at the camera's
  lagged orbit place, on the SAME turn) plus the offsets (the pitch about the camera's right, the yaw about the world vertical — unturned `cameraOffset`
  exactly); its UP the upright one, blended into the swing's half turn above 30° of elevation (a top face's rings 2 and 3 sit at 30° — option B's
  timing) and fully the swing's above 60°. The camera can no longer lose the piece.
* ⭐⭐ **The gizmo change as a TURN** (`blendRig`): the rotation slerped, the fixed yaw and the near side the short way — every rig on the way is a real
  curve, the piece swings over at its ring distance from the gizmo; the share EASED every frame toward the gizmo's stepped progress (`easeShare`, τ =
  `boxSmoothMs` / 2); a new gizmo starts from the turn as it stands (a blend in progress included). ⭐ **The nearer of two turns** (`rigTurnFor`): the
  first, or the first then half a turn about the face's normal — the one moving the piece least (near ring 1 it was sent over the top of the gizmo).
  ⭐ The swing's heading read on each END turn (stable) and blended (`rigFrameBetween` — read off the blended turn its near / far split flipped, 132° in
  one step); every crossing found, the far share smoothed over the swing's window (a far stretch appearing midway starts at zero width); the near side
  from the turned curve's OWN plane, the way nearer the old one (`rigBetaFor`'s `preferBeta`).
* Headless (touch, `Scene_1`): through a top face's crossing the piece HELD on the screen (≤ 0.0001 of the screen a frame — the Z gone), the up ≤ 1.4°
  a frame; through a gizmo change ≤ 0.4 % of the screen a frame (12 % before), settling onto the camera; upright at rings 1 and 4 (6.4° before); no
  reversal. ⚠ The view still turns half a round between rings 2 and 3 over a top face — about the piece now; a quick drag turns it fast (~9° a frame in
  the scripted drags). ⛔ No device close. 2044 vectors.
* ⭐⭐ (2026-10-16, `1.0.79-`) the slide view UPRIGHT — the camera's up rolled to the world's vertical by the slide view's weight: gravity straight down the screen → `HOVER.md` §24.
* ⛔⛔ (2026-10-17, `1.0.79-`) the orbit blocked after a slide on Piece3's top (gizmo on Piece25) — the solver's contact projection and second-part clamp → `COLLISION.md` §12undecies.

### ⛔ SUPERSEDED the same day (below) — the slide view between rings 2 and 3 (`1.0.80-`, 2026-10-17)

> *"Modify the 2D curve as well as the position of the rings so that during the travel between the 2nd ring and the 3rd ring the camera positions itself
> so that the view is nearly isometric (i.e. same nearest-corner-with-gravity-direction-aligned-with-screen-vertical-direction isometric view as during
> the slide,). For that, you can relax the requirement of heights for the 2nd and 3rd rings, the offset requirements for the camera during the travel
> between the 2nd and 3rd ring. The way in and way out shall be smooth, copied from what is currently existing. If 180 degrees camera turns are required
> in some configurations, implement something similar as what is currently existing when hosting face is horizontal, so that there is no Z-shape movement
> of the green piece in the screen."* → *"12 mm outside rings 2–3"*; the corner turn: *"build both and make a slider to select which in the submenu
> CAMERA ORBIT AROUND CENTER"* — the owner.

* ⭐⭐⭐ **Between rings 2 and 3, with the gizmo on a face** (`input/waist_view.ts`, `waistViewNow` in `camera_rig.ts`): the camera holds the SLIDE VIEW —
  the face's isometric corner `(n ± t1 ± t2)/√3` (35° off the face), upright (`uprightBlend`), looking at the PIECE (centred: no Z by construction), at its
  own distance; the camera offsets do not apply there. The face is the turned curve's halfway direction at the orbit's yaw (the hosting face's normal at the
  yaw the gizmo was set, swung by dx); its axes gravity's — `t1` level across it (blended continuously as a face turns level), `t2 = n × t1`.
* ⛔ ~~**In and out** over 12 mm of finger outside rings 2 and 3 (`waistWeight`), driven by the ring parameter~~ — superseded the same day (below):
  LATCHED all along the curve.
* ⭐⭐ **The corner**: ring 2's (nearest the curve's camera there along `t2`) and ring 3's; across the face, the side the camera's yaw OFFSET puts it on (a
  fixed setting). Where they differ: **`waistCornerTurn` 1** (default) TURNS from one to the other about the face's normal across rings 2 → 3 (smoothstep,
  the piece centred — a side face from above to below, a top face round the vertical); **0** KEEPS the corner it entered by (`waistEntryNext`, latched
  as the view starts), the way out carrying it on. Slider in CAMERA › CAMERA ORBIT AROUND CENTER. The rings and the piece's path are unchanged; not on a
  face (the boot), nothing changes. Through a gizmo change the corner is taken on each END turn and blended by its share.
* ⛔ Fixed while building (headless): the face's level axis switched at a threshold as a face turned level (a 5 % screen jump); the side across read off
  the camera's place (flipped in the curve's plane); the corner chosen on the BLENDED turn (a 32 % flip mid-change).
* Headless (touch, `Scene_1`): Piece3's TOP face — at the waist 35.3° down, roll 0, aimed at the piece; through the crossing the piece did not move on
  the screen; the way in ≤ 1.2 % of the screen a frame (on screen throughout). A SIDE face — the corner's 54.7° off the normal, roll 0, the piece still.
  ⚠ Not staged: a slide starting from this view (the slide script sets the gizmo without a face tap); slider 0 on a top face (its way out may arc near
  overhead). ⛔ No device close. 2057 vectors.

### ⛔ SUPERSEDED the same day (below) — the view LATCHED all along the curve; the camera kept in front of the face (`1.0.80-`, 2026-10-17)

> *"during its travel on ring 1 or 4, the piece does a S-shape travel. I would prefer the way in and way out of the semi-isometric view latch since the
> beginning of the travel so that there is no S-shape travel, or whatever else you can propose — … — if the hosting face is vertical and the travel
> starts with a camera view close to the edge of the hosting face, the semi-isometric view can push the camera on the other side of the hosting face from
> the piece between its travel in the ring 2-ring 3 interval."* → *"build 1 following my suggestion. build 3."* — the owner.

* ⛔ **The S**: over the 12 mm way in the camera's aim slid from the gizmo onto the piece WHILE its direction arced toward the corner — two motions of
  the piece on the screen at once. ⭐⭐⭐ **Latched** (`waistLatchWeight`): with the gizmo on a face the slide view holds at EVERY ring — its weight the
  gizmo's being on a face, eased in by the gizmo's own change (`rigShare`); never the ring parameter. The piece stays centred through the whole travel.
  ⚠ The cost, accepted by the owner: far out (rings 1 and 4, up to 6 m off) the view is aimed at the piece and the assembly may be off the screen
  (~38° off the axis from ring 1 over a side face, computed). Slider 0's entry corner is re-read whenever the piece is outside rings 2–3 (`waistEntryNext`).
* ⛔ **Behind the face**: the corner's side across the face came from the camera's yaw offset, measured against the curve's halfway direction at the
  orbit's yaw — swung by dx; past ~35° toward the face's edge that corner stood BEHIND the real face. ⭐⭐ The rig keeps the face's normal AS TAPPED
  (`RigParams.normal`); the side across is the one IN FRONT of it (`frontSide`; the yaw offset's only across a level face), and a corner dipping below
  ~10° over the real face is tilted back (`keepInFront`, `FRONT_MIN` 0.17).
* ⚠ Not built (the owner chose 1 and 3): the waist's own geometry (point 2 — measured 17.5 cm at rings 2 / 3, 9 cm halfway; the device's reading owed).
* Headless (touch, `Scene_1`, Piece3's top face): at rings 1 and 4 the slide view (35.3° down, upright); the piece did not move on the screen through the
  dy travel and the crossing; after the gizmo tap it eased in with the gizmo's change (≤ 1.6 % of the screen a frame), then centred. ⛔ No device close.
  2058 vectors.

### ⭐⭐⭐ The camera always on the gizmo; rings 2 and 3 at the slide view's tilt (`1.0.80-`, 2026-10-17)

> *"I do not like this implementation. The camera should be focused on the gizmo during the ring 1 and ring 4 travel. Find a solution. Also, when I orbit
> the piece on max distance, the assembly jumps from one side of the screen to the other. I believe that will be solved if the camera focuses on the
> gizmo."* → (an arc toward the corner computed: aimed at the gizmo the piece drifted 5–19° on the screen) → *"camera always aims at the gizmo, position
> the ring 2 and ring 3 so that the camera ends up in the semi-isometric view during the travel of the piece between ring 2 and ring 3. Avoid S-shape
> travels of the piece during the whole travel. The key is positioning the ring 2 and ring 3 to match the semi-isometric view during the waist travel."*
> — the owner.

* ⛔ **Why the jump**: the latched view was aimed at the PIECE — a turn of the view about the piece swung an assembly 6 m off across the screen.
* ⭐⭐⭐ **The camera is the orbit's EVERYWHERE** — behind the piece, aimed at the GIZMO (rings 1 and 4 exactly as before the slide-view work).
* ⭐⭐⭐ **Rings 2 and 3 at the slide view's tilt** (`isoWaistHeightM`, `input/waist_view.ts`): their height `±r·√2` — `Scene_1` ±0.127 m at r 0.09
  (was ±0.15) — so the direction to them from the gizmo is 54.7° off the face's normal: arriving at ring 2 the camera behind the piece is already 35.3°
  off the face, the isometric corner's tilt (31.0° before). No arc.
* ⭐⭐ **Between rings 2 and 3, the gizmo on a face** (`waistTurn`, in `cameraFrameNow`): the camera HOLDS that angle and turns from ring 2's direction to
  ring 3's about the face's normal (smoothstep), the short way — half a round the camera's yaw offset's way — still aimed at the gizmo; it starts and ends
  EXACTLY on its own direction at either ring: continuous, no S. Semi-isometric: the corner's tilt, the yaw offset's sideways (not its 45°). Kept in front
  of the face as tapped (`keepInFront`). A gizmo change from no face blends it in by its share.
* ⛔ Deleted: the slide view latched along the curve (aimed at the piece), its 12 mm arc, the keep-corner slider (`waistCornerTurn`), `waistViewNow`.
* ⚠ The rings' new heights move four older measures (vectors updated): the waist's span in `v`, its turn 1.88× the reference stair's (over 2× before), its
  speed ratio 4.82 (4.24), the peak pitch rate 14.6°/mm (~16.5); rings 2 → 3 still 5.6 mm of finger.
* Headless (touch, `Scene_1`): aimed at the gizmo throughout (0 mm); Piece3's TOP face — at the waist 37.3° down (35.3° + the pitch offset), upright; the
  piece within ~2 % of the screen through the crossing, ≤ 0.5 % a frame from the tap to the waist; a SIDE face 21.9° down mid-turn. ⚠ The max-distance
  orbit not staged (aimed at the gizmo, as before). ⛔ No device close. 2056 vectors.

### …the roll removed; the semi-isometric hold only beyond a CONE (`1.0.80-`, 2026-10-17)

> *"there is a strange mix of roll and jumps of camera positions when the gizmo is supported by a face which is on the right side, back side, or bottom
> side of the assembly. — I think we need to trigger the semi-isometric view during ring 2 and 3 travel only if the normal of the gizmo-supporting face is
> beyond a certain cone vs. the orientation of the camera view. for example, if the face is anti-normal to the camera view during the ring 2-ring 3
> travel, there is no need to trigger the semi-isometric view. if the face normal is orthogonal to the camera view during the ring2-ring3 view, the
> semi-isometric view shall be triggered so the user has a better view of the gizmo-supporting face and its coplanars"* → *"build"* — the owner.

* ⛔ **Reproduced** (headless, the gizmo on a part's front / right / back / bottom / top face, dy swept): (1) a ROLL on the back face, 12.5° a step at
  v 0.2 — far out on the ring 4 stretch: the camera's up took the swing's heading wherever the view stood above 30°, and a crossing there (not over the
  top) rolled the picture; (2) the hold between rings 2 and 3 turned the camera up to 180° in 5.6 mm even where the camera already faced the face.
* ⭐⭐ **The swing's heading only between rings 2 and 3** (`rigCameraFrame`: its 30°–60° band gated by `waistShare`) — where a crossing over the top
  happens; elsewhere the up is the upright one. ⚠ A narrower band (60°/75°–85°) everywhere was tried and squeezed the top crossing to a near-flip.
* ⭐⭐⭐ **The hold only BEYOND A CONE** (`waistConeWeight`): weighted by the angle between the camera's halfway direction without it (the curve's halfway
  direction — the face's normal at the yaw the gizmo was set, swung by dx) and the face's normal AS TAPPED: none within `waistIsoConeDeg` (45°, slider
  *"semi-isometric cone (°)"* in CAMERA › CAMERA ORBIT AROUND CENTER), full 10° past it. When held, it turns about the REAL face's normal and its tilt
  reaches the slide view's 35.3° against the real face halfway (`waistTurn`'s `midTilt`, `ISO_TILT_RAD`) — still exactly the camera's own direction at
  either ring. ⭐ Right after a tap (no dx) the halfway direction IS the face's normal: no hold; a top / bottom face is turned about by dx: never — the
  camera crosses over (under) it behind the piece, the view turning about the piece (the swing).
* Headless sweep (0.4 mm of finger a step): right 2.8°, back 1.7° (the roll gone); front 15°, bottom 8° (18° of up), top 13° (27° of up) — the waist's
  own crossing behind the piece (as on any vertical face) and the swing over / under a level face. ⛔ No device close. 2059 vectors.

### …a vertical face approached from BEHIND: no discontinuity (`1.0.80-`, 2026-10-17)

> *"in case the hosting face is vertical, if I orbit dy to approach from behind the face, there are two discontinuities during the travel."* → *"build"*
> — the owner.

* ⛔ **Reproduced** (headless, dx swung 115° so the curve comes from behind the face): entering rings 2–3 the camera jumped from behind the face to its
  front — 24° of view, 38° of roll — and back at ring 3: the guard keeping the camera IN FRONT of the face as tapped yanked a camera that, behind the
  piece, was rightly behind the face.
* ⭐⭐⭐ **The hold on the PIECE'S side** (`waistHoldDirection`, `input/waist_view.ts`): turned about the face's normal on the side the curve's halfway
  direction is on, its tilt reaching 35.3° halfway, kept ~10° over the face on that side — both FADED by the bump `4s(1−s)` (nothing at rings 2 and 3:
  exactly the camera's own direction there) and by how clearly the curve is on one side (`SIDE_SOFT`, ~17° — nothing edge-on, where dx switches the
  side). ⭐ **The cone two-sided** (`waistConeWeight` on `|n·n0|`): facing the face's BACK is like facing its front — no hold (nothing of the face to
  see better); the hold only near edge-on.
* Headless: through rings 2–3 from behind ≤ 10.7° a step (the crossing; 0.4 mm of finger a step), the ring-2 jump gone. 4 vectors (each red first):
  the two-sided cone; exact continuity at the rings for swings of 60° / 90° / 115° / 150°, on the piece's side; smooth as dx carries the curve across
  edge-on; the wiring. ⛔ No device close. 2063 vectors.

### …a gizmo change from a top face to a vertical face: no roll round (`1.0.80-`, 2026-10-17)

> *"when I move the gizmo from the top face of piece 4 to the vertical front face of piece 10 and start dy approach from max distance, at one point the
> camera does a 360 roll and then another 360 roll in the other direction."* → *"update the md files, deploy"* — the owner.

* ⛔ **Reproduced** (headless, the change advancing with the finger): midway through the change the BLENDED curve passed over the gizmo (~86° looking
  down) OUTSIDE rings 2 and 3 — where the swing's heading was gated off (2026-10-17, the stray roll) and the up read the piece's own heading, undefined
  overhead: it flipped half a round in two steps (110°, then 54°), back the other way as dy reversed; the pitch offset, turned with the up, pushed the
  view further toward the vertical.
* ⭐⭐ **The swing's heading near the vertical everywhere** (`rigCameraFrame`: 70°–85° of elevation outside rings 2 and 3 — no unblended curve goes above
  ~60° there, so the right / back / bottom fix stands); ⭐ **the waist's 30°–60° band faded** over a quarter of the ring 2–3 span past each ring
  (`waistGate`; ⛔ cut at ring 3: a 26° snap mid-change); ⭐ **the piece's heading and the swing's blended as DIRECTIONS** (⛔ the short way swapped
  sides as they passed half a round apart).
* Headless: the worst roll step 110° → 10° per 0.25 mm of finger in the app; on the pure path 24.6° → 3.4°. ⚠ A change PARKED at 30 % while dy sweeps
  still steps 56° (92° before) — two opposite headings at comparable weights have no good answer; the change advances with the finger, so it should not
  arise. 1 vector (red first: 6.7°). ⛔ No device close. 2064 vectors.

### …the Fable audit of `1.0.80-`: A1–A7 fixed (`1.0.80-`, 2026-10-17)

> *"use Fable model agent to audit what we have built in this branch … propose fixes"* → *"build A1 to A7, A4: narrow it, update the md files, deploy"*
> — the owner.

* ⭐⭐⭐ **THE CAMERA'S FRAME IS ONE PURE FUNCTION** (`input/camera_frame.ts`, `cameraFrameHeld`; `render/camera_rig.ts`'s `cameraFrameNow` only calls
  it): the composition the screen shows is the one the vectors measure (⛔ it lived in the render layer).
* ⭐⭐⭐ **A1 — THE UP'S ROLL BOUNDED BY THE CAMERA'S OWN TURN** (`rollLimitedUp`): the direction stays a pure function of the orbit; the up is carried
  from the last frame drawn (`st.cameraPrev`) onto the new view and rolled toward the upright target by at most **2× the camera's own turn** (+ 0.25° a
  frame, so a camera left still settles upright) — the short way, so it can never spin round. ⛔ The audit found my *"should not arise"* false: a gizmo
  change tapped mid-distance reaches rings 2–3 at 8–40 % and the target's up flipped 15°–42° (in the app up to 110°) a 0.25 mm step, passing near the
  vertical. ⚠ Three stateless cures were built and measured first and REFUSED (a branch chosen by the last up, the swing read off the blended curve,
  the swing scaled by the curve's peak elevation) — each moved the jump; *an up passing near the vertical must roll half a round; only its RATE can be
  chosen.* Respawn forgets the last frame.
* ⭐⭐ **A2 / A6 — THE HOLD ON EACH END OF A GIZMO CHANGE**: evaluated with each end's own face and blended at the share (⛔ the old face swapped for the new
  at the first finger move: 8°–18°); a turn caught mid-change carries the faces it was between, weighted (`rigEnds`, at most 4) — a tap mid-change keeps
  exactly the hold it had (⛔ stored faceless: the hold dropped at once). `blendRig` keeps the nearer end's face.
* ⭐⭐ **A3 — THE HOLD FADED NEAR THE NORMAL** (`waistPoleFade`: full while ring 2's and ring 3's directions stand > ~26° off the face's normal, none within
  ~14°) — on a face tilted 22°–35°, ring 3 fell on the normal with dx behind it, where the turn about it has no heading: 27°–110° in one 0.05° of dx. And
  the turn's way read off the camera's own PATH from ring 2 to ring 3 (`waistTurn`'s `path`), the short way only as a fallback.
* ⭐ **A4 — THE SIDE'S BAND NARROWED** (`SIDE_SOFT` 0.3 → 0.1, ~17° → ~6°, *"narrow it"*): 10° off edge-on the lift is 35° (was 20°); exactly edge-on still
  none (no side to lift toward); dx across edge-on ≤ 0.4° per 0.05°.
* ⭐ **A5** the up's roll toward upright faded with the hold's bump — nothing at rings 2 and 3 (⛔ 12.9° of up at ring 3 on a tilted face). **A7** a ring
  direction along the normal: a great-circle step, never a switch at share 0.5 (⛔ 90°).
* Hygiene: `ring23` deleted (`waistRings` the one home), `smoothstep01` exported once for the rig and the waist, the yaw-offset side in `waistPrefer`, a
  stale doc (`frontSide`) and headers corrected, the `waist_view` tautology and two assertions that could not fail fixed, `proto_fourth_ring`'s layout
  pinned to a NUMBER again (0.7778).
* Measured (vectors, 0.25 mm of finger a step): A1 up per step ≤ 3× the view's own turn (≤ 16°, the turn ≤ 7.5°), upright at the end (≤ 0.02°); A2 ≤ 0.5°
  (was 18.2°); A3 ≤ 0.2° (110°); A4 35.3° at 10° off edge-on (20.4°); A5 1.2° (13°); A6 0.00°; A7 smooth (90°). In the app, the owner's scenario (Piece4's
  top → Piece10's front, dy from max distance): ≤ 7.1° of roll a step (10° at the last build, 110° before). 8 vectors (all 8 red first). ⛔ No device close.
  2072 vectors.

### …a gizmo change horizontal → vertical face: no roll there and back at rings 2 and 3 (`1.0.80-`, 2026-10-17)

> *"when I change the gizmo from an horizontal face to a vertical face, there is still this annoying jittery roll twice (at ring 2 and ring 3) during a dy
> approach. I thought we had solved that issue."* → *"look at it"* (the blocked piece) → *"update the md files, deploy"* — the owner.

* ⛔ **Reproduced** in the app, frame by frame (the change advancing with the finger): +3° then −9° of roll at ring 2, −11° then +8° at ring 3; with the
  change completed before the approach: none. The top face's SWING still pulled the up, weighted by the camera's elevation (high near ring 2, nothing
  halfway, high near ring 3: twice) — on a blended curve that peaks at 45°–65° once the change is ~20 % on: nothing to turn for. The roll limiter (A1)
  only slowed it; the cause stood. ⭐ *A rate limit hides a wrong target; it does not correct it.*
* ⭐⭐ **THE SWING ONLY AS FAR AS THE CURVE COMES NEAR THE VERTICAL** (`rigSwingNeed`, `input/orbit_rig.ts`): from the turned curve's peak elevation (its
  elevations are the turn's alone — the yaw swings it about the vertical; cached per turn), none below 75°, full past 88° (a top face's crossing: 90°);
  both the waist's band and the near-vertical one scaled by it. A curve without a crossing keeps the upright camera.
* Measured in the app: at ring 2 one way only, at ring 3 calm (≤ 1.7° a frame, no reversal); the owner's earlier scenario (Piece4's top → Piece10's front)
  ≤ 2.1° a step (7.1°). What is left during the change is the horizon kept level while the change swings the camera sideways. 1 vector (red first: 2.4°
  off upright): the camera upright through rings 2 and 3 once the change is under way. ⛔ No device close. 2073 vectors.
* ⭐ **The blocked piece looked at** (right / left faces of Piece10): ⛔ the 55° camera jump was the HARNESS — it set the orbit's elevation absolutely each
  frame, so a backlog built behind the blocked piece and snapped when it came free; the render loop resets the orbit to the solver's held target and a
  finger adds to it — driven so, no jump. The "right" face (−x) has Piece31 6 mm in front of it: the piece stopping at ring 2 is the collision rule. ⚠ Left
  open (not built, the owner to judge on the glass): the gizmo change advances by the FINGER's travel even while the piece is held, so the curve turns
  under a blocked piece (a relocation — *"the ring moved the piece into a part"* — or, high over the assembly, the camera sweeping 10°–16° a frame once it
  frees). The candidate fix: advance the change by the PIECE's travel.

### …the second Fable audit of the orbit: #1–#5 and the open item fixed (`1.0.80-`, 2026-10-17)

> *"do another audit of the orbit with a fable agent, including what we have built in the last commit … propose fixes"* → *"fix all items, update md
> files, deploy"* — the owner.

* ⭐ **The geometry behind it**: a turned curve lies in a vertical plane and rings 2/3 stand at 54.7°, so EVERY hosting face tilted more than 35.3° makes the
  piece pass exactly over the gizmo (35°–55°: twice) — the swing is the design there, not an accident of the top face.
* ⭐⭐⭐ **#1 — THE UP'S ROLL BOUNDED BY THE ORBIT'S TRAVEL** (`rollLimitedUp`, `input/camera_frame.ts`): at most the larger of the travel since the last frame
  (`ROLL_PER_V` 2500° per unit of the ring — 16° per 0.25 mm of dy on `Scene_1`, the swing's designed peak 12°–14° — and `ROLL_PER_YAW` 2°/° of dx) and
  2× the view's own turn (a jump), plus 30°/s (`ROLL_SETTLE_DEG_S`). ⛔ A1's bound — the VIEW's turn — vanishes over the gizmo, where the picture must roll
  half a round: 126°–174° behind on faces tilted 50°–75°, unwinding over seconds. The last frame carries its orbit place (`st.cameraPrev.cam`); the frame
  time is passed (`cameraFrameNow(…, dtMs)`).
* ⭐⭐⭐ **#2 — THE CURVE'S PEAK ELEVATION IN CLOSED FORM** (`rigPeakElevation`): the curve is planar, `sin e = R·cos(θ − φ)` over the curve's pitch range
  (`pitchRange`, once per ring set, ⚠ not monotone) — `R` when `φ` falls inside it. ⛔ Sampled at 33 places it missed the exact pass of faces tilted
  60°–87° (need 0.00–0.87 for a true 90°): the own heading's flip entered the target, 177° in one step. Checked against a 20 000-sample brute force on 40
  random blended turns (≤ 0.05°). `rigSwingNeed` = the same 75°–88° ramp on it; its single-entry cache deleted.
* ⭐⭐ **#3** the settle per SECOND (⛔ per frame: 5°/s on the tablet, 30°/s at 120 Hz — a 180° residual took 36 s on the tablet). **#4** the end turns'
  swing headings blended as DIRECTIONS (`blendHeadings`, now the one rule for the camera's headings; ⛔ the short way jumped 2π·s, 43° a step at s 0.1).
  **#5** a caught blend's turns dropped by WEIGHT (< 1e-3), never by a count (⛔ 4 kept: a fifth tap swapped faces, 3.9°).
* ⭐⭐⭐ **THE OPEN ITEM — THE GIZMO CHANGE ADVANCES BY THE TRAVEL THE SOLVER HONOURED** (`gizmoBlendTravel`, `input/orbit_rig.ts`): while the piece's place
  is solved (no hover — `pieceSolveRuns`), the drag keeps its travel (`st.gizmoTravelPending`, mm and its dx / dy parts) and the frame advances the change
  after `orbitFrame`: all of it while the piece moved or only waited on the work cap, the share of each axis it slid while blocked, none on a relocation;
  a travel no solve took up (a hover, the way in) all of it, as before. Checked with real mouse drags in the app (the change completes, nothing left
  pending). ⚠ STILL OPEN: the curve turning under a piece that MOVES can still carry it into a part — one relocation per such drag midway through the
  change, measured the same before and after (share 0.3–0.46); a fix would test the place at the new share before taking it (one query a frame).
* Hygiene: the swing's cache keyed by the turn OBJECT first (a `WeakMap`; the value key cost 2 µs a read), the last frame's reset in ONE home (the spawn the
  respawn goes through — the piece switch was missing it), headers corrected (*"a roll can never run ahead of the camera"* was the wrong invariant).
* 7 vectors (each red on the deployed code): faces tilted 35°–85° — the drawn up within 20° of the target at every 0.25 mm step (126°–174° before); the
  peak exact (need 1 at 60°–85°) and against the brute force; the settle equal per second at 20 / 60 / 120 Hz; the headings' blend continuous across half
  a round; a fifth tap smooth; the honoured travel and its wiring; A1's bound restated on the travel. In the app: the owner's scenario ≤ 2° of roll a
  step. ⛔ No device close. 2079 vectors.

### THE TOP ROLL — the plan: over a horizontal face the camera stays in the curve's vertical plane, and turns half a round only at the top (agreed 2026-10-17, branch `1.0.81-`; ✅ BUILT 2026-10-18 — next section)

> *"when the gizmo is on a horizontal face, between the ring 2 and ring 3, the camera passes above the piece with a slight azimuth: for example a gravity
> aligned vertical edge of an assembly part rolls in the screen view during this camera movement. Isn't is possible to modify this camera movement so that
> there is no azimuth i.e. the vertical edges in the scene assembly remain vertical in the screen view. To avoid having the scene upside down at the exit
> of the movement, the camera can also roll between ring 2 and ring 3 so the scene in ring 1 and ring 4 is not upside down. Propose something."* →
> *"update the md files with this build and these defaults so I can restart here tomorrow and we build it tomorrow."* — the owner.

**What was measured (2026-10-17, `cameraFrameHeld` on `Scene_1`, a top face, yaw 0.4, the owner's offsets 2.5° / 2°)**
* The camera leaves the curve's vertical plane by **≤ 2.1°** — ALL of it from the yaw offset (0.00° with the offsets at 0; the pitch offset alone adds
  nothing measurable). The "slight azimuth" is real but small.
* What turns the vertical edges is mostly the **ROLL**: the up, against the in-plane frame, goes **164° → 20° evenly over the whole stretch between rings 2
  and 3** (`rigSwingShare`'s half-round spread over the waist, option B) — the picture turns all the way, where vertical edges are long and clearly seen.

**The agreed build**
1. **No azimuth** — the yaw offset FADED to 0 as the view gets steep (full below 60° of elevation, none past 75°; back on the way down): looking nearly
   straight down a sideways offset means nothing. The camera then stays exactly in the curve's vertical plane — a pure pitch over the gizmo.
2. **No roll on the way up and down** — the up stays IN THAT PLANE (the plane's normal × the view): vertical edges stay vertical on the screen (exactly in
   the screen's centre column; elsewhere they lean symmetrically toward it by perspective, without turning). It IS the upright camera up to the top, so
   nothing changes at rings 2 and 3.
3. **The half-round concentrated AT THE TOP** — all 180° while the view is within the band of straight down (`topRollBandDeg`, see defaults): there the
   vertical edges are short spokes from the screen's centre, so the roll reads as the top view turning under the camera, not the scene tilting. Below the
   band the camera is upright on BOTH sides: rings 1 and 4 never upside down.
   * ρ = π · smoothstep((τ + B) / (2B)), τ = the view's signed angle past the vertical within the plane (0 straight above), B = the band; the up = the
     in-plane up turned by ρ about the view. Before the crossing the in-plane up is the upright one; past it, the in-plane up is upside down and ρ = π
     rights it.
   * ONLY on a curve that truly CROSSES the vertical (`rigPeakElevation` = 90°: horizontal faces, faces tilted > 35.3°); a curve that does not cross keeps
     the upright camera. ⭐ Continuous through a gizmo change: as a crossing slides off a ring end it takes no camera place past it (ρ stays 0).
4. **The roll limiter lets the designed top roll through** — `rollLimitedUp`'s allowance gains the band roll's own change since the last frame
   (|ρ(now) − ρ(prev)|), so the 180° is drawn exactly as designed (⚠ else 16° / 0.25 mm caps it: the band's 180° spans ~2 mm of dy at ±20° → ~22° a step).
5. The PITCH offset applied about the PLANE's normal (not the rolled camera right — inside the band the right turns with ρ and would push the camera out of
   the plane), faded inside the band like the yaw offset.

**Defaults (the owner's, 2026-10-17)**
* **`topRollBandDeg` = 20°** — the half-width of the band about straight above (40° of arc in all): a slider in CAMERA › CAMERA ORBIT AROUND CENTER,
  *"top roll band (°)"*, range 2–60, step 1, validated; 0 would be an instant flip at the top (not offered), the maximum ≈ today's spread.
* **The half-round's direction**: the side of the camera's yaw offset (`cameraYawOffsetDeg`'s sign — the camera already leans that way).
* The yaw-offset fade: 60° → 75° of elevation (constants, one home, beside `SWING_FROM_RAD`).
* ⚠ Cost, accepted: the turn is fast — ~180° over 1.5–2.5 mm of finger.

**How to build it (files)**
* `src/input/orbit_rig.ts` — `rigCameraFrame` / `frameAtHeading`: for a crossing curve (`rigPeakElevation` ≥ 90° − ε) the up from the plane (its normal =
  the turned curve's plane normal, swung by the orbit's yaw) and ρ; the offsets faded / taken about the plane normal; a pure `topRoll(cfg, τ)` for ρ.
  ⚠ Then check what becomes DEAD: the swing heading for crossing curves (`rigSwingHeading`, `rigSwingShare`, `solveSwing` and its caches, `waistGate`, the
  STEEP band, `rigSwingNeed`'s ramp, `blendHeadings` in `rigFrameBetween`) — delete what nothing reads (the 2026-10-17 lesson: *a retired rule that is
  still fed is not inert*); a partial-need curve (peak 75°–88°, not crossing) keeps the upright camera.
* `src/input/camera_frame.ts` — `rollLimitedUp`'s allowance + |Δρ|; `CameraFramePrev` already carries `cam`.
* `src/input/gestureConfig.ts` (`topRollBandDeg`, validated), `src/render/tuning_menu.ts` (the slider).
* The semi-isometric hold (`waistHoldDirection`) never runs on a top face (its cone: the halfway direction IS the normal) — unaffected; vertical faces
  unaffected (no crossing).

**Vectors to write FIRST (each red on today's code)**
1. A top face, dy swept through rings 2–3 at 0.25 mm: outside the band the up's roll against the in-plane up is 0 or π (`|sin| < 0.01`) — today it turns
   164° → 20° all the way.
2. Inside the band ρ goes 0 → π monotonically, π/2 straight above; the sign = the yaw offset's side.
3. The view out of the curve's plane < 0.1° everywhere, the owner's offsets on (today 2.1°).
4. The DRAWN up (threaded `cameraPrev`) within 1° of the target through the band (the limiter lets the top roll through).
5. The slider: default 20, validated, in CAMERA ORBIT AROUND CENTER; the band width honoured (B = 10° / 30°).
6. Kept green: the gizmo change horizontal → vertical (`camera_frame.test.ts`), faces tilted 35°–85° (their crossing now gets the top roll), A1–A7.

### …THE TOP ROLL, built (`1.0.81-`, 2026-10-18; ⭐ over a horizontal face superseded by THE TOP FACE CAMERA RING, 2026-10-20 — last section)

> *"start building, update the md files, deploy"* — the owner.

* ⭐⭐⭐ **The swing concentrated in the band** (`topRollWidth`, `input/orbit_rig.ts`): the existing swing (`rigSwing` / `rigSwingShare`, the heading
  turned half a round over a crossing) now spans only the stretch where the curve's pitch is within `topRollBandDeg` of the crossing's — found on each
  side by bisection (the window their mean, ×2), per crossing (a `far` stretch carries the width at each end). ⛔ Option B (2026-10-16): the whole span of
  rings 2 → 3. Outside the band the swing heading IS the piece's own, so the camera is the upright one — in the curve's vertical plane: vertical edges stay
  vertical. ⭐ No separate in-plane frame was needed: the in-plane continuous frame and the upright camera coincide off the band, and a curve with no
  crossing has no swing (unchanged).
* ⭐⭐ **No azimuth** (`offsetKeep`): the owner's yaw AND pitch offsets fade from 60° to 75° of the view's elevation (up or down), in `frameAtHeading` —
  steep, the camera is exactly in the plane.
* ⭐ **The sense**: toward the yaw offset's side (`rigSwingHeading` × the sign of `cameraYawOffsetDeg`) — today's sense at the owner's +2.5°, the other way
  with a negative offset.
* ⭐ **The limiter lets it through**: `ROLL_PER_V` 2 500 → **8 000** (51° per 0.25 mm on `Scene_1`) — the half-round at ±20° peaks at ~49° a 0.25 mm step
  (⚠ the accepted cost: fast). ⭐ The slider *"top roll band (°)"* in CAMERA › CAMERA ORBIT AROUND CENTER, `topRollBandDeg` **20**, 2–60 (validated, part of
  the swing's cache key).
* Measured (a top face, dy at 0.25 mm, the owner's offsets): the roll against the curve's plane stays at 0° / 180° (± 2° from the offsets below 60°) and
  turns only between ~74° and straight above and back down to ~71° (⛔ before: 164° → 20° all the way); steep (≥ 75°) the camera 0.000° out of the plane
  (2.4° before); the drawn up 0.0° behind the target. In the app the gizmo change top → Piece10's front still ≤ 2.1° of roll a step.
* ⚠ Kept, deliberately: the STEEP band, `waistGate`, `rigSwingNeed` and the heading blends still serve curves NOT in a vertical plane (mid-change blends) —
  not dead code.
* Vectors (4 new, each red on the old code; 2 restated): upright in the plane off the band, the drawn up on the target; the half-round only within the band,
  monotonic, half a round in all, its sense flipping with the offset's sign, a narrower band rolling over less; steep ≤ 0.1° out of the plane with the
  offsets on; the slider. Restated: option B's span → the band's (±20° of pitch, 10° / 30° honoured); the up's step bounded by the top roll's own peak
  rate. ⛔ No device close. 2083 vectors.

### …the curve's face snapped BY GRAVITY: two curves only (`1.0.81-`, 2026-10-18)

> *"If I place the cursor on the top inclined face of piece 42, when i drive the green piece orbit with dy, the piece goes forward towards the gizmo then
> goes backwards back towards the same side of the assembly instead of continuing into the opposite side of the assembly. Is it related to the inclination
> of the gizmo hosting face?"* → *"build as follows: identify which of the faces of the frozen object the face supporting the gizmo projects the most (for
> example, horizontal top or bottom face, right or left face, front or back face). Then, apply the 2D curve of the frozen object's identified face to the
> face supporting the gizmo. This way, there are only 2 types of 2D curve: for horizontal face or for gravity vertical face. Note that if there are several
> frozen object, the biggest one applies (currently, this is the floor of the scene)."* → *"if the face supporting the body projects equally to several
> faces of the frozen object, select the vertical one"* — the owner.

* ⛔ **Measured first**: turned onto the REAL normal of Piece42's top face (32° off up), the curve's halfway sat at 58° and its rings at ±55° / ±32° about
  it — ring 4 26° on the near side, ring 3 67° just over the far side, ring 1 straight overhead: the piece went over the gizmo and came BACK, never down
  the opposite side.
* ⭐ First built as asked — snapped to the six faces of the biggest frozen body (the floor), a tie to the vertical — then the owner asked what to do with
  no frozen body (a hidden one, the play volume, gravity and the camera's view plane, the first seated part's long axis …); my advice: GRAVITY ONLY, which
  needs no frozen body, never reads the camera, and does not swing a turned piece's curve off its face (snapped to the floor's walls, a side face of a piece
  turned 32° about gravity — Piece1 — got a curve 32° off its own direction, up to 45° at worst) → *"switch to gravity-only snapping"*.
* ⭐⭐⭐ **The curve's face snapped by gravity** (`snapToGravity`, `input/orbit_rig.ts`; `retargetGizmo` turns the curve onto it): a gizmo face nearer
  horizontal than vertical takes the horizontal face's curve (straight up or down); any other the vertical face's, turned toward the face's OWN horizontal
  direction — only the TILT is snapped, never the heading. ⭐ A TIE (45°) keeps the VERTICAL face (the owner). The gizmo stays where it was tapped; the
  semi-isometric hold and the top roll read the snapped curve. `snapToFrameAxis` and `curveFrame` (the frozen-frame build) are deleted.
* After: on Piece42's top face the curve is the horizontal one — ring 4 and ring 1 on OPPOSITE sides at 58°, straight above halfway; in the app the gizmo on
  it reads `rigNormal` [0, 1, 0], a full dy sweep clean (the up's fastest step the top roll's own, as on a horizontal face).
* 3 vectors (red on the old code): only the tilt snapped — a tilted top, a tilted underside, a slanted side and a turned piece's side keeping their own
  heading, the 45° tie to the vertical; the piece passing to the opposite side on Piece42's top face; the wiring. ⛔ No device close. 2091 vectors.

### …the TURN GOVERNOR: the camera's turn per mm of dy capped (`1.0.81-`, 2026-10-19)

> *"for the 2D curve when the face supporting the gizmo is horizontal, there is a moment between ring 2 and ring 3 where the camera goes to the azimuth and
> rolls to the other side of the assembly: during this interval, the angular speed (degrees per mm of input delta) is peaking. Can you smoothen the peak by
> reducing this angular speed so that the travel of the camera is gentler ? Propose something."* → *"build it. add a slider in the camera orbit around
> center so I can adjust the governor degree/mm. Also slow the view between rings 2 and 3 on vertical faces: make another slider for that."* → *"update the
> md files, commit and deploy"* — the owner.

* ⛔ **Measured**, the whole frame's turn (view and roll together) per mm of dy at the shipped gains (dy → 0.0129 of the ring per mm; ring 4 → ring 1 is
  76 mm of finger): over a HORIZONTAL face **96°/mm** at the top (the top roll's band), 1–6°/mm on rings 1 and 4; on a VERTICAL face **20°/mm** at the
  waist (the view between rings 2 and 3).
* ⭐⭐⭐ **The governor** (`input/turn_governor.ts`: `frameTurnDeg`, `turnRatePerV`, `governedRingStep`): the curve and the piece's places unchanged — only how
  much ring a millimetre of dy buys. The camera's turn rate is read off the curve (the frame the orbit asks for, on the turn now, ±0.001 of the ring);
  where it exceeds the cap, the dy is cut by `cap / rate` (never below 2 %); the finger's travel walked in 0.1 mm pieces, each read at its middle.
  Elsewhere the whole step passes (rings 1 and 4 as before). ⭐ The coast after the finger lifts is governed the same way (`governedOrbitDv`,
  `orbitDvPerMm` in `render/green_box_wiring.ts`; the drag in `pointer_wiring.ts`).
* ⭐⭐ **Two caps, two sliders** in CAMERA › CAMERA ORBIT AROUND CENTER: *"turn governor, horizontal face (°/mm of dy)"* (`orbitTurnCapDegMm`, **40**) on a
  curve that passes over the gizmo (`rigSwingNeed` — a horizontal face, a face tilted past 35°), *"turn governor, vertical face (°/mm of dy)"*
  (`orbitTurnCapVerticalDegMm`, **10** — ⚠ not 20 as first proposed: at the real gain the vertical face peaks at 20, so 20 would change nothing) on any
  other (a vertical face, no face); both 5–300, validated.
* After (0.3 mm events, a real pointer's): horizontal face ≤ 42°/mm (96 before), +2 mm of finger over the top; vertical face ≤ 10.6°/mm (20 before), +2 mm.
  Cost in the app: ~0.2 ms a pointer event over the top, ~0.1 ms elsewhere (desktop; ~3× on an iPhone) — no collision query.
* 5 vectors (`tests/turn_governor.test.ts`, red without the module): the frame's turn exact for known rotations; the horizontal face held to its cap, the
  rest untouched; the vertical face held to its; the sliders; the wiring (the drag and the coast). 4 text checks restated for the governed drag / coast.
  ⛔ No device close. 2096 vectors.
* ⭐ (2026-10-19, the owner: *"set the turn governor horizontal face to 12.5"* → *"same for vertical faces"*) **both caps 12.5°/mm** (were 40 and 10), the
  sliders stepping 0.5: a horizontal face ≤ 12.5°/mm (96 free), ring 4 → ring 1 88.5 mm of finger (76.5 free, 78.3 at 40); a vertical face ≤ 12.8°/mm (20.4
  free), 77.1 mm.

### ⛔ …the SEMI-ISOMETRIC HOLD deleted (`1.0.81-`, 2026-10-19)

> *"when I set the gizmo on the right face of piece 11 and then approach from more or less perpendicular to the face … the travel between ring 2 and ring 3
> is not a waist but there is a bump in between the two rings … Explain why"* → (the hold, built 2026-10-17: the camera lifted ~35° over a face seen near
> edge-on, halfway between rings 2 and 3) → *"remove the semi-isometric function as well as its slider entirely. I don't need it any longer. update the md
> file. Commit."* — the owner.

* ⛔ **Deleted**: the hold between rings 2 and 3 (`waistHoldDirection`, `waistTurn`, `waistConeWeight`, `keepInFront`, `waistPoleFade`, `waistPrefer`,
  `waistShare`, `waistPath`, the up's roll toward upright with it) and its slider *"semi-isometric cone (°)"* (`waistIsoConeDeg`); with them what existed only
  for it — a caught gizmo change's faces (`rigEnds`, the rig's `ends`, `faced`, `normal`). The camera's frame is the curve's own (`targetFrame` =
  `rigFrameBetween`), its up still carried and rate-bounded (`rollLimitedUp`), the top roll and the turn governor unchanged.
* ⭐ Kept: rings 2 and 3 at `±r·√2` (`isoWaistHeightM`, `waistRings`, `input/waist_view.ts`), so the camera still passes them at the slide view's tilt.
* ⛔ The sections of 2026-10-17 on the hold (its cone, its side, its faces through a gizmo change — the Fable audit's A2–A7) are the record. 18 vectors
  deleted with it, 1 added (the hold and its slider gone, red on the old code). ⛔ No device close. 2078 vectors.

### …THE TOP FACE CAMERA RING: over a horizontal face the camera goes ROUND the gizmo between rings 3 and 2, never over it (`1.0.82-`, 2026-10-20)

> *"The 2D curve for the horizontal hosting face has the camera rising up to the vertical of the gizmo during the travel between ring 2 and ring 3 with dy
> input. Can you lower the camera and probably create a dedicated ring for the camera during this portion of the travel so the camera view is lowered from
> the zenith (that would correspond to what the camera does with a mix of dy and dx during this portion). Take into account the mirror if the camera comes
> from ring 1 or comes from ring 4. No change for the piece 2D curve, only for the camera on horizontal hosting face case. Propose something before
> building."* → *"Build option A"* — the owner.

* ⛔ **Measured first** (`Scene_1`, the gizmo on Piece10's top face, the owner's offsets): rings 1 / 4 — the piece 58° up, the camera 60°, 6.0 m off; rings 3 /
  2 (v 0.43 / 0.57) — 34° / 36°, 0.16 m; halfway (v 0.50) — **90°, the camera straight down**, the piece 0.09 m from the gizmo. The stretch 36° → 90° → 36°
  is ~11 mm of finger (~14.5 governed), the 180° top roll inside it.
* ⭐⭐⭐ **The ring** (`topFaceRing`, `horizontalShare`, in `rigFrameBetween`, `input/orbit_rig.ts`): between rings 3 and 2 the camera's direction goes from
  its frame at ring 3 to its frame at ring 2 HALF ROUND the gizmo — the azimuth by smoothstep (no turn at either ring), the angle above the face lifted to
  `topFaceCameraRingDeg` midway (sin²: level at either ring) — aimed at the gizmo as ever (the piece, 9–16 cm from it there, stays near the screen's centre)
  and UPRIGHT: no roll, vertical edges vertical. An underside: the same ring below the face. The piece's curve and the rings unchanged; a vertical face
  unchanged.
* ⭐ **Option A — the mirror**: a function of the ring parameter alone — driven from ring 1 or from ring 4 it is the same half-circle, one the reverse of the
  other; its side the yaw offset's (as the top roll turned). ⛔ Option B (the same handedness from either end, latched at entry) not built.
* ⭐ **Through a gizmo change** the ring fades by each END turn's share blended at the change's share (⛔ the blended turn's own: it left the horizontal in
  the first fifth of the change); each end's ring is built on its own curve and turned at rings 3 and 2 onto the blended curve's frames (eased between),
  so it meets the curve exactly there (⛔ on the blended curve: a waist ring passed straight above and its azimuth spun); the up the mixed view's upright one
  rolled by what is left of the curve's roll (⛔ the ups mixed as vectors: 1.7° off upright). The share is all within 5° of straight up or down, none past
  15° — a face snapped by gravity is exactly one or the other; a turn past 15° keeps the curve and its TOP ROLL (now only mid-change).
* ⭐ **The slider** *"top face camera ring (°)"* in CAMERA › CAMERA ORBIT AROUND CENTER, `topFaceCameraRingDeg` **50**, 35–85 (validated).
* Measured in the app (dy at 0.25 mm, both ways): 36° at the rings → 50° midway (never above), the azimuth 93° → −87° round, **no roll** (0.00°), the drawn
  up on the target, the fastest step 3.9° a 0.25 mm (~15.7°/mm free: the 12.5°/mm governor holds it). ⚠ Cost: a gizmo change top → vertical made WHILE dy
  crosses the stretch turns the view up to 11.5° a 0.25 mm step ungoverned (7.5° before), 3.1° governed.
* Vectors (3 new, red on the old code): upright all the way and ≤ 50° in the stretch, the drawn up the target's; half a round the yaw offset's way, meeting
  the curve at both rings, retraced when driven back, the slider honoured, an underside below, a vertical face untouched; the slider. Restated: the top
  roll's two vectors (a horizontal face) → the ring's; *no azimuth* on a face tilted 70°; the governor's horizontal face (24°/mm free, held to 12.5); A1's
  step bound 10° → 12°. ⛔ No device close. 2086 vectors.

### ⛔ …two follow-ups to the ring, built, deployed and REVERTED the same day (`1.0.82-`, 2026-10-20)

> *"instead, can the 2D curve of the camera follow rings 1, ring midway (not ring 2 nor ring 3) , ring 4 ? This will avoid a sway of the piece between rings
> 2 and 3."* → *"deploy"* → *"merge rings 2 and 3 for the piece 2D curve in case the hosting face is horizontal. deploy"* → *"These are worse than before.
> revert to commit b97b5b5"* — the owner.

* ⛔ **The camera's curve through ring 1, a midway ring and ring 4** (`dfb4741`, live `77df7d0`): its height eased 60° → 50° → 60° with no dip at rings 3 and
  2 (the half-round between them kept). ⚠ Measured before shipping: the piece's curve still dipped to 34° there, so the camera at ~51° no longer followed it
  down — the piece's path on the screen between v 0.3 and 0.7 grew 12.5° → 17.8° (3.6° below the centre near rings 3 and 2); no midway height (35°–55°)
  got under 12.5°.
* ⛔ **Rings 2 and 3 merged for the piece's curve over a horizontal face** (`8d51330`, live `3f52442`): ring 1, one ring at their mean (0.09 m, 0 — straight
  above the gizmo), ring 4. In radius and height the piece still dipped (30.5°: turned onto a horizontal face the radius IS the height above the face, and it
  reached its floor first); in DISTANCE and ANGLE it climbed 58° → 90° with no dip. ⚠ But with the camera's own curve it rode up to 29.5° above the screen
  centre (off the top) at a 50° midway ring — the default was raised to 80° (11°, ring 1's own offset).
* ⭐ **Reverted to `b97b5b5`** — the ring as built in the section above (the camera following the curve to rings 3 and 2, half round between them at 50°;
  the piece's four-ring curve). The code and the vectors are exactly `b97b5b5`'s (2086). ⭐ What the two attempts showed: over a horizontal face the
  camera and the piece have to be changed TOGETHER — a camera curve that leaves the piece's (or a piece curve the camera does not follow) moves the piece
  across the screen, which reads worse than the camera's own dip.

### …THE TOP FACE PAUSE: the piece waits above the gizmo while the camera goes half round (`1.0.82-`, 2026-10-21)

> *"when hosting face is horizontal, on a dy travel, the piece travel is paused when it crosses the gizmo (when it is exactly midway between ring 2 and ring
> 3), the camera does the half round turn around the gizmo while the piece travel is paused (it maintains its original travel on the 4 ring 2D curve outside
> this pause of the piece and orbit on the mid-ring during the pause of the piece). If the dy reverse at any time, the travel of the camera or piece is
> reversed. Propose something"* → *"what is the mm between ring 2 and ring 3 in case the hosting face is vertical ? use that for the pause length. build,
> update the md files, deploy"* — the owner.

* ⭐ Before it, two other ways were measured and not built (2026-10-20): the camera rings, radii and gains optimised for the piece's swing on the screen (the
  outer stretches' swing is the camera offsets' own drift — offsets × the piece's distance ÷ the camera's 1.25 m — which no ring, curve or gain changes; a
  vertical face is already at its floor: 27.3° of path for 27.4° unavoidable), and the half round spread over the whole travel (evenly: the piece 23° off the
  screen; by the piece's distance: 14.7° of outer swing for 21.4°, but up to 4.8°/mm at the top).
* ⭐⭐⭐ **ONE TRAVEL** (`input/top_pause.ts`: `pauseSpan`, `pauseMid`, `travelOf`, `placeOf`, `settledPause`): over a horizontal face the drag steps a travel `u`
  running ring 4 → the middle → THE PAUSE → the middle → ring 1. Off the pause it is the ring parameter `v` (shifted by the pause past it); through it `v`
  HOLDS at the middle (halfway between rings 3 and 2 — the piece 9 cm straight above the gizmo) while the PAUSE SHARE goes 0 → 1. A function of `u` alone:
  dy reversed anywhere retraces it — the piece back, or the camera back while the piece waits; the coast records the travel taken and goes on through it.
* ⭐⭐ **The pause's length** is the waist's own span in `v` (rings 3 → 2) — a vertical face's ring 2 → 3 travel: **11.1 mm** of dy at `Scene_1`'s gains.
  ⚠ The turn governor (12.5°/mm) holds the camera's half round to **16.3 mm** of finger (the vertical face's waist governs to 12.0 mm): ring 4 → ring 1 is
  94 mm over a horizontal face.
* ⭐⭐ **The camera** (`topFaceRing`): the half round is driven by the pause share (smoothstep), on the 50° ring (`topFaceCameraRingDeg`), upright. Off the
  middle the share is 0 below and 1 above, so between ring 3 and the middle the camera only RISES behind the piece (36° → 50°, its azimuth fixed) and on to
  ring 2 only comes down on the far side (⛔ 2026-10-20: the half round spread over rings 3 → 2 while the piece crossed). The turn always meets the curve at
  rings 3 and 2: before the middle it is the share × an easing 0 at ring 3, after it 1 − (1 − the share) × an easing 0 at ring 2.
* ⭐ **Wiring**: `orbitTravelStep` (`render/green_box_wiring.ts`) — the drag's dy and the coast step the travel, governed ON it (`governedRingStep` takes the
  travel's top, `1 + span`), the share left in `st.topPause`; `topPauseFrame` each frame settles the share to the piece's side when the ring parameter is off
  the middle (a respawn, the solver's reset, a gizmo change onto a top face) and eases the drawn share (`st.topPauseShown`, `boxSmoothMs`), which
  `cameraFrameNow` reads; on while the gizmo's turn is a horizontal face's (`topPauseOn`); the HUD's `elev=` shows `pause=…%` inside it.
* ⭐ **Through a gizmo change** the pause is off as soon as the change goes to a vertical face — the share frozen; each end's ring hands over between its
  pause-driven turn and the waist's own (the 2026-10-20 spread) by the change's share, so nothing jumps at its start. ⚠ Cost: driving the piece back across
  the middle early in a top → vertical change makes the frozen half round over half the waist — 16.7° a 0.25 mm step UNGOVERNED (11.5° before); the governor
  reads those frames (12.5°/mm in the app).
* Measured in the app (the gizmo on the floor at (0.85, 0, 0.85), dy at 0.25 mm): the camera behind the piece at 92° rising 36° → 50°; at the middle the piece
  STOPS at (0.85, 0.111, 0.85) while the camera turns 92° → 166° → −175°; 10 mm back the camera turns back to 93°, then the piece moves; through to the far
  side at −87°; no error.
* Vectors (4 new, `tests/top_pause.test.ts`, red without the module): the pause's span and place; the travel ↔ place both ways and held to its ends; over a top
  face the piece still through the pause, the camera half round at 50°, no turn before or after it, a function of the travel, a vertical face reading nothing
  of the share; the wiring. Restated: the ring's vectors and the governor's top face along the travel; the gizmo-change sweeps with the share frozen as the app
  leaves it; A1's step bound 12° → 17° (measured, ungoverned); four text checks. ⛔ No device close. 2090 vectors.

### …THE CAMERA'S CENTRE LIFTED THROUGH THE WAIST: the piece holds its height on the screen (`1.0.82-`, 2026-10-22)

> *"the movement of the piece in screen view between ring 2 and ring 3 is not nice: it looks like the piece goes up between ring 2 and zenith above gizmo,
> then freeze, then goes down between zenith and ring 3. All the more if top face camera ring is low (35 degrees min slider). Modify the 2D curve of the
> camera and the top face camera ring so that there is no such jump back and forth of the piece in the screen view around the waist of the dy travel."* →
> *"update the md files, deploy"* — the owner.

* ⛔ **Measured first**: aimed at the gizmo, the piece 9 cm above it in the pause is seen above the centre — from −0.3° at ring 3 it rose to **+2.6°** at a
  50° ring (**+3.3°** at 35°, 1.4° at 70°) in ~5 mm of dy, held through the pause, and fell back to −0.3° at ring 2.
* ⛔ **Tried and dropped**: the camera's HEIGHT solved for the piece's place on the screen (the centre on the gizmo) — the piece rose smoothly, but the camera
  had to dive to **8°–13°** at ring 3 (60° → 8° → the ring's height): the whole scene would swing.
* ⭐⭐⭐ **THE CENTRE LIFTED** (`topFaceAimLift`, `pieceScreenY`, `input/orbit_rig.ts`): over a horizontal face, between rings 3 and 2 only, the camera's
  centre — what it is placed about and aimed at — rises off the gizmo along the vertical (below an underside), SOLVED place by place (a bisection on
  −0.2 → 0.5 m, its slope's sign read off the ends) so the piece holds on the screen the height it has at ring 3 (eased to ring 2's: the same by the curve's
  symmetry), at any ring height. 0 at rings 3 and 2 and everywhere else (the camera there exactly as before); ~9–10 cm in the pause — the camera then orbits
  the WAITING PIECE. The camera's height is the ring's as before (36° at the rings → `topFaceCameraRingDeg` at the middle).
* ⭐ **The piece as the eye follows it**: its BODY's centre (`placeAt` in `render/green_box_wiring.ts`) — the curve's place at the piece orbit's zoom, its
  distance clamped (`clampPieceRadiusM`), less the resting face's offset from the mesh's centre turned as the piece stands (⛔ held on the anchor — the
  resting face's centre — the body drifted 0.2° as the camera rose); the camera's distance the zoom's gap (`gapFull`).
* Measured — the model (`Scene_1`, a top face): the piece's height on the screen constant to 1e-11° from ring 3 through the pause to ring 2 at 35°, 50°, 70°
  and 85°, no reversal from ring 1 to the pause; the app (the gizmo on the floor at (0.85, 0, 0.85), a 50° ring): the body at **0.52°** at ring 3, 0.52°
  through the waist, **0.51°** through the whole pause while the camera turns round, 0.51° driven back mid-pause; the lift 0 → 9.2 cm; no error.
* Vectors (3 new, `tests/top_face_aim.test.ts`, red on the old code): the hold at four ring heights with no reversal; the lift 0 at rings 3 and 2 and outside
  the waist, ~9 cm in the pause, below an underside, none on a vertical face; the wiring. Restated: the camera's placement text check (+ lift), the count of
  `clampPieceRadiusM` calls (+1). ⛔ No device close. 2093 vectors.

### …the camera at ONE LEVEL around the waist; no kink at rings 3 and 2 (`1.0.82-`, 2026-10-22)

> *"there are two discontinuities in the movement of the piece in the screen view around ring 2 entrance and ring 3 exit. Can the camera 2D curve be modified
> so that there are no such discontinuities ? for example if the camera stays at the same azimuth between ring 2 and ring 3 (including the half round orbit
> when the piece is paused) instead of increasing azimuth between ring 2 and the start of the half round orbit / decreasing azimuth between the end of the
> half round orbit and the ring 3 ?"* → *"update the md files, deploy"* — the owner (the "azimuth" read as the camera's HEIGHT — its direction round the
> gizmo was already fixed before and after the pause).

* ⛔ **Measured first**: the two were KINKS, not jumps — at ring 3 the camera's height went from ~4°/mm (the curve's camera dipped to 34.6° just before it and
  climbed back) to none (the ring's profile starts level), and the piece's height on the screen from 0.033°/mm to none (the hold began there): the largest
  change of speed between two 0.1 mm steps, 2.8°/mm for the camera.
* ⭐⭐⭐ **ONE LEVEL** (`topFaceFrame`): through the waist and the pause the camera's height is `topFaceCameraRingDeg` (above the face, below an underside) —
  eased into from the curve's halfway between ring 1 and ring 3 (`topFaceKnots.from`) and out to it halfway between ring 2 and ring 4 (`to`), smoothstep: at
  50° the camera goes 60° → 52° → 50° held → 60° (⛔ 36° at rings 3 and 2 lifted to the ring's at the middle). Outside the waist its azimuth the curve camera's;
  in a gizmo change each end's frame turned onto the blended curve at the place itself (in the waist at rings 3 and 2, eased between).
* ⭐⭐ **The lift eased too** (`topFaceAimLift`, now from `from` to `to`): the piece's height held through the waist is halfway between the piece as the LEVEL
  camera sees it at the waist ring and in the pause — the lift evens out only their difference (at 50°: −7.5 cm at rings 3 and 2, +7.6 cm in the pause, 0 at
  `from` and `to`; ⛔ ring 3's height with the curve's camera: from a camera held at 70°–85° that took the centre 0.4–0.6 m below the gizmo); outside the waist
  a MONOTONE ease (a cubic Hermite, its start tangent held to Fritsch–Carlson's 0…3) from the piece's own height and speed to the held one, level at the
  waist ring (⛔ a smoothstep blend overshot by 0.002° at 70°–80°); the solve on −1 → 1 m.
* ⭐ **The slider 35°–80°** (85° before): above 80° the camera held there around ring 3 needs its centre over a metre off the gizmo — the solve breaks (at 70° up
  to 35 cm, at 80° up to 70 cm; at 50° ~11 cm). The slider renamed *"top face camera ring (°): around the waist, the camera this far up (round the gizmo in the
  pause)"*.
* Measured — the model (`Scene_1`, a top face): the largest change of speed between 0.1 mm steps **2.8 → 0.03–0.10°/mm** for the camera's height, **0.022 →
  0.003–0.03°/mm** for the piece's height on the screen (0.028 at 80°, where the far ease starts), no reversal of its vertical motion at 35°–80°; the app (the
  gizmo on the floor, a 50° ring): the piece's body −0.23° → 0.39° → 0.83° → 1.02° at ring 3 → 1.01° through the whole pause and driven back; no error.
* Vectors (restated, red on the old code): the hold now also checks no kink (the camera's height and the piece's) and the camera at one level through the waist
  at 35°/50°/70°/80°; the lift's values (0 outside `from`…`to`, balanced, mirrored below an underside); the slider's 80°. ⛔ No device close. 2093 vectors.

### …THE TOP FACE APPROACH, LOW: at max distance the camera stands where it does over a vertical face (`1.0.82-`, 2026-10-22)

> *"the piece seems to follow the 2D curve in blue in the attachment. Can we modify the 2D curve to follow the black ?"* (blue: a high plateau that plunges into
> the flat of the waist; black: a gentle bowl) → *"this is likely a mix of travel of the piece and relative travel of the camera … It's a compounded effect of
> piece travel and camera travel"* → *"there is no such artifact when the supporting face is vertical"* → *"at the max distance, why the offset and angle of the
> camera is not the same if the gizmo hosting face is horizontal or vertical ? I want the same as for vertical hosting face."* → *"Same in the world"* →
> *"build it, update the md files, deploy"* — the owner.

* ⭐ **What the blue was** (measured): the piece's APPARENT HEIGHT ABOVE THE FACE on the screen (the piece against the point of the face straight under it, from
  the real camera) against the finger's travel — over a top face it held at **17°–18° for 20 mm** of dy (even rising), then fell to **2.5° in 12 mm** and turned
  a corner into the flat of the waist and the pause; over a vertical face an even **36° → 4°**. The piece's path in space is a straight-sided V (58° arms) —
  not the blue; nor is its height against the travel (an S).
* ⭐ **Why**: the turned curve put ring 1 58° above a top face and the camera at ~60°, looking down nearly along the piece's line of descent (the eased camera
  level held it steep near ring 3 too); and the owner's offsets act in the WORLD's frame — the pitch tilts away from the world's horizontal, toward a top face's
  normal but away from a vertical face's. With the offsets at 0 both faces read the same (25.6° → 3.9°).
* ⛔ **Tried and dropped**: re-pacing the travel (the far metres faster, the last slower — a log-distance pace): the plateau shortened, the plunge stayed; the
  offsets in the FACE's frame (the top face an exact rotation of the vertical): the descent even (36.2° → 3.1°), but the camera at max distance still steeper
  than over a vertical face — the owner chose *"same in the world"*.
* ⭐⭐⭐ **The low approach** (`topFaceApproach`, in `rigPlace`, `input/orbit_rig.ts`): over a horizontal face, from ring 1 to ring 3 (and ring 2 to ring 4),
  the piece at the turned curve's DISTANCE and HEADING (the finger's travel, the waist and the pause unchanged) but at an ANGLE ABOVE THE FACE eased
  (smoothstep) from the vertical face's ring angle above the horizon (`atan2(height, radius)` of the end ring: **31.7°**) to the turned curve's own at the waist
  ring (35°); below an underside, the same under it; mid-change mixed and kept at the ring's distance. The camera unchanged: behind the piece, the offsets in
  the world — so at max distance it IS the vertical face's.
* Measured — the model: at ring 1 the top face's piece 31.7° / camera 33.7° / the piece on the screen (10.0°, −9.3°), the vertical face's the same (⛔ 58° /
  ~60° / (6.2°, −9.3°)); the apparent descent 34.4 → 33.7 → 32.3 → 30.1 → 26.8 → 21.7 → 14.9 → 7.9 → 3.3° every 4 mm, then the flat, then the mirror; no kink
  (camera 0.03°/mm, the piece's height on the screen 0.005°/mm). With the camera ring at 37° (the camera's own angle at ring 3) it stays near level
  throughout (34°–37°); at the owner's 50° it rises 37° → 50° over the last 12 mm — the descent even either way. The app (the gizmo on the floor, then on
  Piece10's front): at ring 1 both the camera 33.7°, the piece 31.9°, on the screen (10.1°, −8.6°); no error.
* ⚠ **Cost**: the piece comes in lower over the assembly — 3.15 m above the face at max distance (5.1 m before), ~1 m at 1.7 m out (1.4 m) — so parts near the
  gizmo stop it more often; the camera at max distance 34° (60° before).
* Vectors (3 new, `tests/top_face_approach.test.ts`, 2 red on the old code): max distance the vertical face's (the piece's angle, the camera's, the place on the
  screen; ring 4 above the face); the descent falling from the start and well under way by halfway to ring 3; the waist and the distances unchanged.
  Restated (`orbit_rig.test.ts`): a top face's rings 1 and 4 low; the turned curve on a top face only in the waist (outside it the same distance and heading,
  lower far out); the step lengths within 5 % on the outer stretches. ⛔ No device close. 2096 vectors.
* ⭐ (2026-10-22, the owner: *"set the default top face camera ring to 56 degrees"*) `topFaceCameraRingDeg` **56** (50 since 2026-10-20). Four vectors that
  pinned the 50° ring now read the slider's value; the lift's values stay pinned on an explicit 50° fixture. 2096 vectors.
* ⭐ (2026-10-22, the owner: *"don't recompute the 2D curve, just set the default top face camera ring to 52 degrees (just by moving the slider, nothing
  else)"*) `topFaceCameraRingDeg` **52** — the slider's default only, nothing else changed. 2096 vectors.

### …the camera BEHIND THE PIECE up to its zenith; the pause in three parts there (`1.0.83-`, 2026-10-25)

> *"when the gizmo hosting face is horizontal, modify the 2D curve of the camera so that the camera follows the piece without change (same offset, same
> behind) until the piece reaches its zenith above the gizmo: at this zenith point, the piece pauses, the camera rises to reach the top face camera ring
> degrees and does the half turn"* → *"update the md files, deploy"* — the owner (behind a piece straight above the gizmo the camera is straight above too,
> so it comes DOWN to the ring's height).

* ⭐⭐⭐ **Behind the piece** (`topFaceFrame`, `input/orbit_rig.ts`): over a horizontal face, between ring 3 and the zenith, the camera is the vertical face's
  rule exactly — the piece's direction with the owner's offsets (`frameAtHeading`; the offsets fade only above 60° as ever) — its heading the NEAR side's,
  so it climbs with the piece to ~89° straight above without the top roll's half turn of the picture; from the zenith to ring 2 the same on the FAR side.
  ⛔ Deleted: the camera eased to the ring's level from halfway ring 1 → ring 3 and held there through the waist (2026-10-22).
* ⭐⭐⭐ **The pause in three parts** (`topFacePauseParts`): from the near side's frame at the zenith DOWN to `topFaceCameraRingDeg` on the near side; HALF
  ROUND at that height, the yaw offset's way; UP to the far side's frame at the zenith — each its share of the pause by the angle it turns (52°: 0.20, 0.59,
  0.20), smoothstep each; the up the view's upright one at its own azimuth, defined straight above too, so it meets the near and far sides' frames there.
* ⭐⭐ **The lift to the waiting piece** (`topFaceAimLift`): 0 off the pause; in it the piece's height above the gizmo (its body as drawn), eased in while the
  camera comes down, held through the half round, eased out as it goes up — the piece stays where it is on the screen while the camera turns round it.
  ⛔ Deleted: the lift solved around the waist for the piece's height on the screen (2026-10-22); `pieceScreenY` stays as the vectors' instrument (declared
  in `unwired_debt.test.ts`).
* ⭐ **Through a gizmo change** each end's frame hands over to the BLENDED curve's own frame (the end fading out within the first tenth of the change — the two
  are the same off the zenith and the pause), so a piece crossing the zenith with the pause off never jumps between the near and far sides (their frames
  meet straight above with opposite ups); no pause share given (a sweep of the ring alone): the curve's frame.
* Measured — the model (`Scene_1`, a top face, 52°): the camera 37° at ring 3 → 82° → ~89° at the zenith, behind the piece (its direction within the offsets'
  ~3°); the pause: down to 52° with the lift 0 → 9 cm, half round −154° → 25°, up again; the piece within 0.5° of the screen's centre all through; the
  fastest step 6.3° a 0.25 mm in the half round (ungoverned; the 12.5°/mm governor holds it — the governed pause ~10.5 mm longer than free, the camera now
  turning ~187° in it, 111° before). The app (the gizmo on the floor): the camera 37° → 51° → 76° → 89° up to the zenith, then 55° (from the gizmo, about the
  lifted centre) round the waiting piece, the piece at 0.00° on the screen through the half round, back up toward the zenith driven back; no error.
* Vectors (`tests/top_face_aim.test.ts` rewritten, 3 of 4 red on the old code): behind the piece up to the zenith at 35°/52°/80°; the pause's parts and no jump
  along the whole travel; the piece held through the pause by the lift (0 → its height → 0), below an underside the other way, none on a vertical face; the
  wiring. Restated: the top face camera vectors (behind the piece off the pause, the pause's middle part at the ring, the yaw offset's fade ≤ 3°); vector #1's
  tilts 35°–75° (85° is a horizontal face's share — it pauses); the governor's free peak (≤ 50°/mm) and its governed extra (≤ 12 mm). ⛔ No device close.
  2097 vectors.

### …the camera HELD while the piece climbs; the pause ONE movement — half round and up to the ring together (`1.0.83-`, 2026-10-25)

> *"there are too many camera movements between the ring 2 and 3: the camera rises up towards the vertical of the piece, then goes down to the top face camera
> ring, then half turn, then goes up to the vertical, then goes down again. I don't need the camera to rise up towards the vertical"* → *"I want the camera to
> reach the top face camera ring and half turn rotate in the same time"* → *"and this should be done when the piece pauses, so there is no relative movement
> of the piece and camera"* → *"deploy, update the md files"* — the owner. ⛔ Replaces the section above (the camera behind the piece to its zenith, the pause
> in three parts), deployed earlier the same day.

* ⭐⭐⭐ **Held** (`topFaceFrame`): over a horizontal face, from ring 3 to the zenith the camera IS ring 3's curve camera (the piece's direction there, the
  offsets — `frameAtHeading`) and does not move while the piece climbs; from the zenith to ring 2 it is ring 2's, held while the piece comes down. The piece
  moves only while the camera holds; the camera moves only while the piece waits.
* ⭐⭐⭐ **The pause, one movement**: HALF ROUND the gizmo, the yaw offset's way (smoothstep), and AT THE SAME TIME up to `topFaceCameraRingDeg` at the middle of the
  turn and back to ring 2's held height by its end (sin²) — the ring's height reached within ~0.1° (the pitch offset's correction). `topFacePauseParts` deleted.
* ⭐⭐ **The lift** (`topFaceAimLift`): the camera's centre lifted along the vertical, solved place by place (bisection on −0.6 → 0.6 m, the slope's sign read
  off the ends) so the piece keeps on the screen the place the camera BEHIND it would give it — measured RELATIVE to its actual place at the waist ring, so the
  lift starts from exactly 0 (⛔ in the app the held camera, placed from the piece's anchor, and a target from its body were 0.7° apart at ring 3: the piece
  shifted there); 0 at rings 3 and 2, ~8–9 cm in the pause (the camera orbits the waiting piece). `pieceScreenY` is the app's again.
* Measured — the model (`Scene_1`, 52°): the camera 37.3° while the piece climbs 35° → 90° (the lift 0 → 8.8 cm, the piece −0.25° → 0.00° on the screen); the
  pause 37.5° → 52.0° at its middle → 37.8°, −154° → 25° round; the fastest step 3.75° a 0.25 mm (ungoverned). The app (the gizmo on the floor): the piece
  0.51° at ring 3 → 0.58° → 0.79° → 0.87°, then 0.87° all through the pause while the camera turns and rises; driven back mid-pause, the same; no error.
* Vectors (`tests/top_face_aim.test.ts` rewritten, 3 of 4 red on the old code): the camera still while the piece climbs and comes down, never toward straight
  above, at 35°/52°/80°; the pause one movement (the ring's height at the middle of the turn, half round, turning while rising) with no jump along the travel;
  the piece's place held by the lift (0 at the rings, ~9 cm in the pause, below an underside the other way, none on a vertical face); the wiring. Restated:
  the top face camera vector (held off the pause), the pause vector (never above the ring, at it mid-turn), the slider's height within 0.5°. ⛔ No device
  close. 2097 vectors.

### …STARTED AGAIN: the vertical face's curve turned 90°, the camera behind the piece, a ROLL in the pause (`1.0.83-`, 2026-10-25)

> *"i do not like this implementation at all. let's start again from the beginning: for the case when the gizmo hosting face is horizontal: copy the 2D curve
> of when the gizmo hosting face is vertical, and rotate it 90 degrees. Modify it so that during ring 1 and ring 4 the camera offset is the same in world
> coordinates as the camera offset when gizmo hosting face is vertical. add a pause when the piece is at the exact middle between ring 2 and ring 3, so that
> the camera rolls 180 degrees on dy input during this piece pause. That will keep the assembly upside up in the screen view at all times. taylor the roll
> rotation by dy input mm so that the camera angular speed per dy mm is roughly the same as during orbit. Make sure the roll is reverted if the dy input is
> reverted."* — the owner. ⛔ Replaces every top face section since 2026-10-20 (the camera ring, the level, the lift, the low approach, the held camera).

* ⭐⭐⭐ **The curve**: over a horizontal face the piece rides the vertical face's 2D curve turned 90° (`rigPlace`, as on 2026-10-16) — ring 1 and ring 4 high on
  either side, the zenith 9 cm above the gizmo at the middle of rings 2 and 3. ⛔ Deleted: `topFaceApproach` (2026-10-22, the outer stretches low).
* ⭐⭐⭐ **The camera** (`topFaceFrame`): the vertical face's rule — behind the piece, the owner's offsets in the WORLD's frame (2.5° about the vertical, 2° in
  elevation, `frameAtHeading`), so at rings 1 and 4 the offset is the vertical face's exactly; the near side's heading up to the zenith, the far side's from it
  (no half turn of the picture on the way).
* ⭐⭐⭐ **The roll in the pause** (`input/top_pause.ts`, the pause span as before): straight above the waiting piece the camera ROLLS 180° about its view
  (smoothstep, the yaw offset's way), from the near side's up to the far side's — the assembly upside up on the screen all the way. Its pace is the orbit's:
  the turn governor (`orbitTurnCapDegMm`, 12.5°/mm) reads the roll as a turn of the camera, as it reads the dy orbit's (12.6°/mm at its peak; dx 5.1°/mm), so
  the 180° takes ~16 mm of dy. A function of the travel: dy reversed anywhere unrolls it. `rollLimitedUp` counts the pause share as travel
  (`ROLL_PER_PAUSE`, 1440°), or the roll crawled at the 30°/s settle.
* ⛔ Deleted: `topFaceAimLift`, `pieceScreenY`, `topFacePauseParts`, the slider `topFaceCameraRingDeg` (CAMERA › CAMERA ORBIT AROUND CENTER) — the camera has no
  ring of its own now. Through a gizmo change each end's frame still hands over to the blended curve's (`rigFrameBetween`).
* Measured — the app (`Scene_1`, the gizmo on the floor, dy in 0.25 mm steps): the camera 36° at ring 3, then 48° → 67° → 88° over the last ~5 mm before the
  zenith (behind the piece climbing 35° → 90°); the pause 16 mm, the up −87° → 180° → 93° round, the piece still at the screen's centre (≤ 0.07°); upright
  again after it (36° at ring 2); driven back, the same frames unrolled; no error.
* ⚠ Open (proposed to the owner): the straight-down view at the zenith is back (the 2026-10-20 complaint), and the camera climbs ~50° in the last ~5 mm before
  the pause, because rings 2 and 3 sit only 35° above the face — moving them toward the normal over a horizontal face would spread that climb; dx in the
  pause (straight above, it is a roll too); a gizmo change mid-pause.
* Vectors: `tests/top_face_approach.test.ts` rewritten (the turned curve at every place; the world offset at rings 1 and 4 — the latter true of the old code
  too); the roll in the pause (`camera_frame.test.ts`: straight above, half round, the yaw offset's way, no jump at the ends, unrolled driven back, an
  underside the same below); the pause vector (`top_pause.test.ts`: the view hardly moves, the up half round, behind the piece off it); upright off the pause,
  behind the piece (restated); the wiring (the last frame's pause share) — 5 red on the old code. `tests/top_face_aim.test.ts` deleted with its subject;
  `orbit_rig.test.ts`'s low-approach restatements reverted. ⛔ No device close. 2091 vectors.

### …the roll from the zenith on, even; dx held mid-roll; a gizmo change waits for the roll (`1.0.83-`, 2026-10-25)

> *"there seems to be a pause of the camera movement when the camera is at the zenith and looks straight down towards the piece: the dy does not immediately
> blend in the roll: it looks like the dy accumulates and then suddenly the roll kicks in and catches up the dy which accumulated from when the camera reached
> the zenith above the piece. check. also, I agree with your points 2 and 3. build that."* — the owner (points 2 and 3: dx in the pause, a gizmo change
> mid-pause, proposed in the section above).

* ⛔⛔ **Checked — it was real, and it had TWO causes** (measured in the app, dy in 0.25 mm steps):
  * **The camera's place crept** (the main one): the camera reads its ring place through the drawn piece's spring and the leash (`st.cameraLagged`), and
    `topFaceFrame` rolls only once that `v` sits on the middle within 1e-9 — which an exponential approach takes its time to do. Through the first ~2 mm of the
    pause the input's share went 0 → 0.18 while the camera's up stood at −90°; then it jumped 28° at once. ⭐ **The camera on the travel** (`laggedPlace`,
    `input/top_pause.ts`; `cameraPlaceNow` in the wiring): its place is the INPUT's travel (its ring place, exactly on the middle through the pause, and the
    drawn share) less the camera's lag behind it — off the pause exactly the camera's own `v`; through it the camera's own share. It rolls as soon as its
    travel crosses the zenith.
  * **A smoothstep**: the roll eased in from rest — ~5° in its first tenth, 14° in the second. ⭐ **Linear in the share** now, so the turn governor holds it at
    its 12.5°/mm all through (~16.2°/mm ungoverned over the 11.1 mm span; the pause ~14.4 mm of dy).
  * After both: the camera at 89° at 16.25 mm and rolling at once, −93° → −99° → −107° → −111° → −119° in 0.5 mm steps (~13°/mm), no hold, no jump.
* ⭐⭐ **dx held while the roll is under way** (`pauseYawStep`): straight above the piece a dx turns the picture like a roll, so the orbit's yaw step is 0 while
  the share is strictly between 0 and 1 — the drag and the coast; free at the pause's ends and over a vertical face.
* ⭐⭐ **A gizmo change mid-roll waits** (`retargetGizmo` → `st.gizmoPending`; `pauseEndNearer`, `pauseTowardEnd`): the roll is finished or unwound to its
  NEARER end at 360°/s (`PAUSE_FINISH_PER_S` = 2 shares/s), then the change is made (`topPauseFrame`). A later tap replaces the waiting one. Measured: asked at
  share 0.35, unwound in ~200 ms, then the gizmo moved (0.85, 0.85) → (0.30, 0.30); no error.
* Vectors (`tests/top_pause.test.ts`, 4 new, all red on the old code): the roll even (every twentieth of it 7.5°–10.5°; ⛔ 1.3° in the first); dx held
  mid-roll (the rule and both wirings); the waiting gizmo change (the nearer end, the pace, landing exactly, the wiring); the camera on the travel (rolling
  with a camera a hair short of the middle, its own `v` off the pause, a camera lagging into or out of the pause, the wiring). Restated: the governor's free
  peak in the pause (> 14°/mm, was > 20), the drag's and the coast's text checks, the camera frame's place (`camPlace`). ⛔ No device close. 2095 vectors.

### THE ORBIT AROUND THE ASSEMBLY: dx yaw, dy pitch ±85°, two fingers / Shift the approach to a gizmo the ray finds (`1.0.85from1.0.83-`, 2026-10-28)

> *"I want to capitalize the idea you proposed for moving the gizmo, but with a different implementation. Modify the orbits as follow: the piece orbit on dx
> yaw and dy pitch inputs. The yaw is a full circle, the pitch is half a circle from -90 degrees to + 90 degrees (don't reach beyond 90 degrees to avoid roll
> and upside down issues) … The double finger or shift + click dy brings the piece towards the gizmo … The gizmo is only used for the approach of the piece
> … The orbit is done around the center of the assembly (… put the center at the center inside the assembly at boot and don't change it). The gizmo is
> positioned at the intersection of the sections of the assembly created by the pitch plane and yaw plane at the actual position of the piece orbit … The
> approach of the piece towards the gizmo is the same as currently built (2D curves …) … no change for the camera"* (with a sketch) → the open points
> answered: the gizmo on the ray toward the centre, wherever the piece is, the surface continuous; the approach straight in (the along-the-curve path kept),
> to the contact, in and back; the gizmo and its face locked close in; one far radius; pitch ±85°, the floor no constraint; the camera looking at the centre
> far out, at the gizmo as the approach goes in; two fingers' dx and Shift + dx nothing; the inertia on both → *"build, update the md files, deploy"* — the
> owner. Built on `1.0.83-`'s line (the curve tilt / gizmo-drag trial of `1.0.84-` set aside, reverted on `main`).

* ⭐⭐⭐ **The orbit** (`input/assembly_orbit.ts`, `render/assembly_wiring.ts`; `orbitMode` 0, the default): dx the YAW (the full circle), dy the PITCH —
  the orbit's ring parameter read as −85° … +85° (`pitchOfV`), at the dx yaw's pace (°/mm, ungoverned: no curve crosses the zenith, so no top pause and no
  roll). The piece's direction `u` from the assembly's CENTRE — the placed parts' bounding box's, read once and fixed (`ensureAssembly`; its radius half the
  largest dimension); the boot keeps the pitch the piece had on the rings (33.5° in `Scene_1`).
* ⭐⭐⭐ **The gizmo** = where the ray from the piece toward the centre first meets a PLACED part (`castGizmo`: five rays — the centre one and four 4 mm
  beside it, the outermost hit taken on the centre ray, so a gap narrower than that, the painting's cores, is bridged — the surface reads continuous); the
  piece is ON that ray, at the approach's distance from the gizmo. Its point EASED (90 ms: a step in depth never jumps); its FACE by the edge rule
  (`faceSwitches`: a coplanar neighbour at once, another only once the ray lands `gizmoEdgeMarginMm` — 5 mm, in the world — past the edge; a step at once) —
  its part and face feed the quads as before. The orbit's centre the rest of the code reads (the hover, the quads, the markers) IS the gizmo, set each frame
  before the solve; a TAP on a part no longer moves it (`retargetGizmo` is off).
* ⭐⭐⭐ **The approach** (two fingers moving together on the phone — `twoFingerKind`: their common motion beats their relative one, judged from the
  second's landing; **Shift + drag** on a desktop or touchpad): finger UP brings the piece IN, at the orbit dy's pace on the 2D curve's coordinate. Its
  distance (`approachDistance`): the 2D curve's own distance from the gizmo from ring 1 (6 m — the far orbit, one value for both curves) to the waist
  (9 cm), then straight to the contact — the piece STRAIGHT IN along its ray. Checked against the parts (`approachMove`: in only as far as the gap stays at
  the resting gap, `pieceGapMm`, the largest free share by halving — the piece stops at the contact); its own coast (`approachInertia`). Apart or together
  is the pinch zoom; two fingers' dx and Shift + dx do nothing. A tap that wobbled into the approach is undone.
* ⭐⭐ **The lock** (`nextLock`): once the piece is inside the assembly's bounding sphere, or within `assemblyLockDistM` (0.3 m) of the gizmo, the gizmo
  and its face LOCK; the piece then turns about the locked gizmo (the same formula — continuous at the lock, its direction from the gizmo IS `u`), never more
  than 80° from the face's normal (`coneClamp`; a step further out refused, `leavesCone`). Released past both by a margin (×1.05, ×1.25); the gizmo then
  follows the ray again (eased). Under a HOVER the hover owns the gizmo (taken as the locked one).
* ⭐⭐ **The camera**: behind the piece along its direction with the owner's world offsets (`frameAtHeading`, upright — no roll), about its LOOK POINT
  (`lookShare`: the assembly's centre far out, the gizmo at the lock's distance, smoothstep between; locked, the gizmo; eased 120 ms).
* ⭐ **The gizmo's 2D curve orbit is kept whole**: `orbitMode` 1 (CAMERA › CAMERA ORBIT AROUND CENTER, *"orbit: around the assembly (0) / the gizmo's 2D
  curve (1)"*, or `?orbitMode=1`) is the orbit as built to 2026-10-25 — the along-the-curve approach, the turned curve, the top pause and roll, the tap.
  Sliders: *gizmo lock distance (m)*, *gizmo face edge margin (mm)*.
* Measured — the app (`Scene_1`, CDP touch and Shift + mouse): the centre (0.02, 0.24, −0.03), radius 0.27 m; the boot at pitch 33.5°, the piece 6.01 m from
  the gizmo on Piece10's front face; dx → yaw 28°, dy down → pitch 85°, the gizmo on Piece4's TOP (its face switched — the quads follow); two fingers up →
  the piece 6.0 → 2.6 → 0.12 m (locked: *"close in — the gizmo and its face locked"*) → the contact (0.02 m, stopped by the parts), the look point the
  centre → the gizmo; locked, dy pitched it about the gizmo to 74° off the top's normal, dx round it 28° → 178°; two fingers down → 6 m, unlocked, the gizmo
  on Piece9's left face along the new ray; Shift + drag up → in to the contact, the yaw unchanged; `?orbitMode=1` → the 2D curve's orbit, no error.
* ⚠ Open: the assembly is the PLACED parts — `Scene_1` boots with few placed (radius 0.27 m), so the centre and the lock's sphere are theirs; the centre is
  fixed at the boot and does not grow as pieces are placed (the owner: *"don't change it"* for now); the approach comes in at the orbit's angle, not square
  to the face (straight in along the ray, as asked).
* Vectors (`tests/assembly_orbit.test.ts`, 10, red on the old code — the module is new): the pitch's range and the direction; the approach's distance (ring
  1's, the waist's, the contact, never rising inward, finger up in); the lock and its margins; the cone; the face's edge rule; the rays; the look point; two
  fingers; the sliders; the wiring. Restated: nine source checks of the drag, the coast, the frame and the hold. ⛔ No device close. 2105 vectors.

### …the gizmo CARRIED ALONG THE SECTIONS; the two-finger approach latching; the camera's offset the same on every face (`1.0.85from1.0.83-`, 2026-10-28)

> *"the double finger is not working reliably: sometimes it latches, sometimes not. i want the gizmo to travel along the section when i orbit (the red or
> green sections on the sketch when i orbit the red or green circle). So the gizmo shall not be the raycast to the center. Propose a solution. This will
> enable to see better how the gizmo moves. the camera offset is different depending on the face hosting the gizmo. This is not what i want. I want the
> offset to be the same whichever the hosting face."* → the proposal → *"Build, with the optional, as recommended, update the md files, deploy"* — the owner.

* ⛔⛔ **The two fingers latched only sometimes**: a second finger was the second touch only OFF the orbited piece — close in the piece fills the screen, a
  second finger landing on it made a plain pinch (parallel fingers: nothing). Around the assembly a second finger ON the piece is the second touch too; its
  TAP there still picks the resting face (never the yellow quad). Measured (CDP touch): the second finger on the piece — no hold before; the approach now
  (0.62 → 0.46).
* ⛔⛔ **The camera's offset changed with the face**: the owner's offsets were turned in the WORLD's frame and faded from 60° of pitch (the top roll's rule,
  `frameAtHeading`) — a top face, approached steeply, lost them (the piece dead centre, 0.00° / 0.11°, against 9.97° / −8.69° on a vertical face). Now they
  turn in the CAMERA's own frame (`offsetFrame`: the pitch about its right, the yaw about its upright up), never faded: 11.90° / −8.79° on a vertical face,
  12.29° / −9.77° on a top face (far out; within 0.6° close in). ⚠ On a vertical face the piece now sits a little further aside far out (11.9° for 10.0°): the
  yaw offset turns about the camera's up, not the world's vertical.
* ⭐⭐⭐ **The gizmo carried along the sections** (`carryGizmo`; ⛔ the ray toward the centre for each direction): a point on the surface the orbit MOVES,
  once a frame, by the orbit's step since the last frame:
  * **dx** (`yawAbout`): turned about the assembly's vertical axis by the yaw's step — its height kept — then dropped back (`sectionRay`): on a vertical face by
    the HORIZONTAL ray toward the axis (round the assembly at constant height — the GREEN section), on a top / bottom face straight down / up onto it;
  * **dy** (`pitchSlide`): slid along the yaw plane's section by the assembly's half-size × the pitch's step — UP a face toward the piece, ACROSS a top away
    from it, DOWN the far face (⛔ first turned about the centre: the painting's front face is 2 cm from it — 1.5 cm for 51° of pitch) — then dropped back along
    the face's normal (the RED section);
  * a miss (past an edge, off a part): the RADIAL ray through the moved point finds the section's next face; still nothing, the gizmo stays. The edge rule,
    the ease, the lock unchanged; every query of the piece's place reads the carried gizmo.
  * **The safety resync** (`faceTurnedAway`): a gizmo whose face turns AWAY from the piece is found again on the ray toward the centre (and at the start). ⚠
    The gizmo is now path-dependent: round and back at one height returns it; pitch, yaw, pitch back need not.
* ⭐⭐ **The sections drawn** (the optional; `sectionLines` 1, CAMERA › CAMERA ORBIT AROUND CENTER): the GREEN one (the horizontal plane at the gizmo's height;
  just under a top face's) and the RED one (the yaw plane through the centre) — 96 rays each from outside, their first hits joined (a miss breaks the line),
  lifted 2 mm, recast every 100 ms, hidden locked or under a hover; drawn in the transparent pass after the pieces' see-through contours (⛔ opaque, the
  contours washed them out).
* Measured — the app (`Scene_1`): dx at pitch 34° — the gizmo at y 0.253 all round, from Piece10's front face to its back face and Piece11's; dy 34° → 85° — up
  Piece10's front face 0.253 → 0.493, onto Piece4's front-top edge (the pitch's +85° reached there); 194 vertices of section lines, the green one seen across
  the front at the gizmo's height; no error.
* ⚠ Open: the pitch's pace is the assembly's half-size per radian (0.27 m in `Scene_1`) — the +85° limit stops the gizmo at the top edge of a tall part; a
  path-free alternative is the arc length along the red section from the point level with the centre (a full turn of pitch = the section's perimeter).
* Vectors (`tests/assembly_orbit.test.ts`, + 6, red on the old code): the yaw's turn (its height, its convention, the rays: toward the axis, down / up a
  top / bottom, none on the axis); the pitch's slide (up, across, down, the face square to the plane, along −n, the radial ray); the resync, the sections'
  directions, the slider; the camera's offsets in its own frame (the same split at every pitch, never over the top); the second finger on the piece; the
  wiring. Restated: the two holds' source checks. ⛔ No device close. 2111 vectors.

### …the gizmo's CARRIER ON THE SECTION'S HULL, clamped at ±90°; two overhangs; the sections no longer flicker; the gizmo always where they meet (`1.0.85from1.0.83-`, 2026-10-29)

> *"when the gizmo is on the vertical face of the assembly and I dy in one direction, when the gizmo reaches the extreme edge it jumps back and dy continues
> its travel until the edge. why is that ?"* → *"can you increase the pitch to -90 +90 degrees ? … it should not be able to move to a face which is turned
> away from the piece"* → *"why can't each degree of pitch slide it 0.27m * 1 degree and then clamp it between -90 +90 degrees of red section ?"* →
> *"overhang or concave shape: propose something to drive the gizmo. Same if the overhang or concave is met on the dx yaw orbit."* → the proposal →
> *"build it with the clamp and ±90°; add a seated part … to create overhangs …; check why the green and red sections are flickering all the time …; check
> this bug: there are moment when the gizmo is not at the intersection of the green and red sections"* — the owner.

* ⛔ **The jump back** (2026-10-28's carry): up the painting's front face, over the top edge, across its 4 cm in ~8° of pitch, over the back edge onto the
  back face — turned away from the piece, so the safety resync put the gizmo on the ray toward the centre, mid-face; dy carried it up again, and again.
* ⭐ **The pitch ±90°** (`ORBIT_PITCH_MAX_RAD`; ⛔ ±85°): straight above / under the centre at the ends. At the pole the camera's heading is the orbit's yaw
  (⛔ `atan2(0, 0)`: 0); the finger's pace the whole range over the orbit's degrees per mm (⛔ 170). Checked in the app: the camera straight down at +90°,
  straight up at −90°, a dx there steady; no error.
* ⭐⭐⭐ **THE CARRIER ON THE SECTION'S HULL** (`input/section_hull.ts`; ⛔ `yawAbout`, `pitchSlide`, `sectionRay`, `radialRay` and the resync deleted):
  * the RED section is the yaw plane's cut of the placed parts — each part's convex hull cut by the plane (`sectionPoints`; from the meshes' own vertices,
    cached for the placed set); its CONVEX HULL (`hull2`, Andrew's monotone chain) has no hollow and no overhang; the half facing the piece (`facingChain`)
    runs from the BOTTOM CENTRE (under the centre) up the piece's side to the TOP CENTRE (over it) — **the clamp**: −90° and +90°'s ends;
  * **dy** slides the carrier along it by the assembly's half-size per radian (0.28 m in `Scene_1`, the owner's *"0.27m × 1 degree"*), clamped at both
    centres (it waits there for the rest of the pitch), and it **never ENTERS an edge turned away from the piece** (`facesPiece`: it waits at that edge's
    start; inside one it is on, free);
  * **dx** turns the yaw plane: the carrier is found again on the new chain (`remapOnChain`) — on a SIDE at its **height** (round the assembly at constant
    height: the green section), on a TOP / BOTTOM at its **distance from the axis** (round the axis on the face);
  * the GIZMO is the carrier **DROPPED** onto the real surface (`dropRay`): on a side horizontally toward the axis at the carrier's height, on a top straight
    down, on a bottom straight up — so it is ALWAYS in the yaw plane and on a side at its height: **at the red and green sections' intersection, by
    construction**. A drop that misses, or lands on a face turned away from the piece, holds the gizmo (the carrier goes on). The edge rule, the ease, the
    lock and the quads unchanged.
* ⭐⭐ **Overhangs and hollows** — the hull bridges them; the gizmo steps where a face is hidden horizontally (out onto an overhang's front, back in past it),
  eased by the gizmo's 90 ms; an overhang's underside is never visited (a horizontal ray never lands on it). Measured in the app, the boot's yaw, bottom
  centre → top centre: Piece43's slanted face, Piece19, Piece15, **out onto Piece45's wide face (4.1 cm)**, back onto Piece10, Piece27, Piece4, **up Piece44's
  slanted side, onto its top**, the top centre at +38° (held to +90°); down, the bottom centre at −30° (held to −90°); dx at a height all round — the gizmo
  **0.00 mm off the yaw plane** at every step.
* ⭐⭐ **TWO OVERHANGS** (`Piece44`, `Piece45` — `SCENE_1.md` §11): the frustum, small face down on Piece4's top, and small face on Piece10's front face.
* ⛔⛔ **The flicker**: the section lines were a NEW mesh every 100 ms (dispose, create) even at rest, and a new line mesh's material is not ready for its first
  frames — measured: rebuilt 18 times in 2 s, **missing from 27 of 106 frames**. ✅ Now ONE mesh of a fixed vertex count (96 green segments, 63 red),
  updated in place (a segment not drawn: collapsed), recast only when the yaw, the carrier or the placed set changed: missing from 0 of 119.
* ⛔⛔ **The gizmo off the intersection** (the owner's snapshot): after a LOCK (the piece turns about the locked gizmo — the yaw plane turns away from it) or a
  HOVER (its slide moves it along the face), the gizmo was carried on from the locked point — off the red section from then on (5.5 mm after a 17° locked
  turn, measured; a hover's slide much more). ✅ A lock or a hover now drops the carrier: back out, it is placed again from the gizmo PROJECTED into the yaw
  plane as it is then (a step into it, eased).
* ⭐ **The sections drawn are the gizmo's own paths** (`redSamples`, `greenYaws`): the red the chain's carriers dropped — bottom centre → top centre, the half
  the gizmo can travel (⛔ the whole section by rays toward the centre); a step in depth breaks it; the green the gizmo's drop at every yaw (a side: at its
  height; a top: its distance from the axis) — the gizmo on both, exactly (its own arc length and its own yaw among the samples).
* ⚠ Open: the carrier, not the pitch, says where the gizmo is — path-dependent still (the owner's clamp, as proposed); a tall assembly may reach ±90° before
  the gizmo reaches the top centre, a short one clamps early.
* Vectors (`tests/section_hull.test.ts`, 8, red on the old code — the module did not exist): the section of a box, a tilted cut, a miss; the facing chain
  (its ends at the centres, the overhang bridged, the axis outside); the pitch's step (the clamp, the turned-away edge, free inside one); the yaw's remap
  (a side's height, a top's distance); the drop (in the plane, at the height); COMPOSED on a slab with an overhang (an engine-free raycast: in the plane,
  at the height, held only under the bottom; slab → ledge → slab → top); the drawn samples; the wiring (the unlock's reset, the one mesh). Restated: ±90°
  (and the pole's heading), the frusta's counts (45), `D136` / `D182` without the overhangs (every body there an upright box). ⛔ No device close. 2118
  vectors.

### ⛔ …the old 2D curve for the approach — built twice, REVERTED to `75eb381` (`1.0.86-`, 2026-10-29)

> *"instead of the straight in, can I reinstate the old 2D curves ?"* → built close in only → *"I see very minimal change"* → built over the whole approach
> → *"I do not like this implementation. revert to commit 75eb381cca683780f87d5621edc422a449536da8"* — the owner.

* The approach is again **straight in** along the orbit's own direction (ring 1 6 m → the 9 cm waist on the curve's distance, then to the contact) — the
  code as at `75eb381` exactly. What was tried, so it is not tried again unasked:
  * **close in only** (`fa27ea0`): locked, inside the lock's 0.3 m, the direction turned onto the old curve (rising over the face, level at the waist; its
    plane the yaw's vertical over a vertical face, turned 90° over a horizontal one; its rise scaled by the piece's own pitch against ring 1's 31.7°) —
    *"very minimal change"*: only the last ~12 mm of finger, and the camera placed behind the piece turns with it;
  * **the whole approach** (`cb2e41c`): `tan e = tan p × tan curve(a) / tan curve(ring 1)` on the curve's rise, linear on its descent, its plane by the face
    kind eased — 33.6° at 6 m rising to 62° at 0.19 m, level at the waist — *"I do not like this implementation"*.
* ⚠ Reverted with them: `tests/camera_frame.test.ts`'s stub on `orbitMode` 1 — its three old-curve audits again run the orbit around the assembly (the
  default) silently. 2118 vectors.
