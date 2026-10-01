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
* ~~Billboarded~~ — ⛔ **no longer billboarded** (2026-10-02, §6: *"remove the billboarding"*); no parent.
* ⭐ **Solid to the finger** (2026-10-01): *"when I click on the green box, the raycast hits the piece behind"* — it was
  unpickable, so the ray went through it. Now it is PICKABLE, so the ray stops on it, and `throughGreenBox`
  (`input/green_box.ts`) turns that hit into a MISS at every pick the router reads: a press on the box is empty space —
  it orbits — and the box is never held, aligned or steered.

## 3. The camera's orbit

* ⭐ **`Scene_1`'s rings on this branch** (the owner, 2026-10-01): top 0.9 / 0.5 m, middle 0.2 / 0 m, bottom 0.9 / −0.4 m
  (radius / height) — pitch −24° at the bottom, 0° at the middle, +29° at the top.
* ⭐ **It BOOTS on the TOP ring** (`bootView: "TOP"`, *"boot scene 1 on the top ring"*) **at zoom 1.5** (`bootZoom`, slider
  *boot zoom* at the top of CAMERA, 0.5–10 step 0.1 — applied at once, and the camera reset's view; `0` restores the derived
  half-radius rule, which made ×7.5 with these rings and capped the box at 3 m over most of its travel).
* **The box's distance from the centre** at zoom 1.5: **1.55 m** on the top ring, **0.30 m** on the middle, **1.48 m** on
  the bottom. A zoom scales the whole surface, and the box is always kept within **0.15–3 m** (`clampCameraRadiusM`); each
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

1. **While the input MOVES: the LEASH** (`cameraLeashDeg`, **3°**, slider 0–60). Inside it the camera does not turn; past
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
  * **On empty space or a frozen body** → the MIDPOINT of the two piece centres (frozen bodies excluded) nearest the finger's
    ray, each measured to the RAY (`nearestPairCentre`, `input/barycentre.ts`). ⛔ It replaces §2 rule 1's subset
    barycentres here; `orbitCentre` is kept (declared unwired debt) for the main line. No piece: the target stays.
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
