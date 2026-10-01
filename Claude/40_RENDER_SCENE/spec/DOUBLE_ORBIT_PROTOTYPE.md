# The double-orbit camera — a PROTOTYPE (branch `1.0.58a-` only)

⛔⛔ **THIS FILE EXISTS ON THE PROTOTYPE BRANCH ONLY.** `1.0.58a-` (from `1.0.58-Trial-with-double-orbit`) is never merged
into `main` or the fork; the main line is merged INTO it, one way. It is deployed beside the main line at
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
* **Eased after the rig** — the box approaches the rig's pose exponentially (`easeOrbit`, `boxSmoothMs` **60 ms**): the
  pointer events come every 47–68 ms on the tablet against 16–40 ms frames, so a box written straight from the rig moved in
  steps while the camera, smoothed, did not (*"why is the camera fluid and the box jerky?"*).
* **Billboarded** (`BILLBOARDMODE_ALL`), not pickable, no parent.

## 3. The camera's orbit

* **Its own angles** (`input/follow_camera.ts`, `CameraOrbitState`), stepped every frame before the draw
  (`render/green_box_wiring.ts` `greenBoxFrame`).
* **Its distance = the box's CURRENT distance + `cameraRadiusOffsetMm`** (**1500 mm**, slider 100–2000 step 100). ⛔ It was
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

* ⛔ **The demo's camera path drives the BOX, not the camera** — `20_GAME_RULES/spec/DEMO_SCENE.md` §7 and its fixes §9.
* ⚠ Every default above is a guess with a slider unless the owner set it: the owner set the yaw gain, both offsets, the
  leash and the settle delay; the pitch gain, the radius offset, the box smoothing, `COAST_MS` and the catch-up are mine.
