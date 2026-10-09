# The orbit around the piece — specification (prototype)

> **Status:** ✅ BUILT 2026-10-06 on `1.0.59u-from1.0.59s-Orbit-around-piece` — commits `d3e0c07` (*orbit center on piece*), `68b4584` (*orbit around the
> piece*), `f98b584` (*frozen gain*), `864c6f2` (the slerp's own slider); then on **`1.0.59v-`** (2026-10-07): `86afd21` (§1bis, an action of
> its own), `f8beaf5` (§6, the end by itself and the way back), the transitions' smoothing (§6bis), and the way back around the piece (§6);
> **2026-10-08**, on `1.0.59v-` (renamed `1.0.59v-Way-In-for-Piece-Orbit`) and **`1.0.59w-`**: the way in rebuilt (§2 — `600c3e2`, the
> gradual pivot `70f50e1`, option B `0aa43da`), the yaw speed one through it, the end at 75 % plus a clear push, the way out in 30 mm (§6 —
> `a8bae99`, `fa95e0f`, `ba0828e`). ⛔ Unjudged by a hand. `input/piece_orbit.ts` (engine-free),
> `render/green_box_wiring.ts` (`enterPieceOrbit`, `returnToCentreOrbit`, `greenBoxFrame`, `sweepPoints`, `pieceOrbitAngleOffset`; the way in:
> `PieceEntry`, `startPieceEntry`, `carryHeading`, `entryCamera`, `entryLook`, `evenSlide`; the end: `pushStep`),
> `render/pointer_wiring.ts` (`orbitTapped`, `orbitDragStep`, the finger travel); vectors `tests/proto_piece_orbit.test.ts`.
> **Builds on:** [`RESTING_FACE_ALIGNMENT.md`](RESTING_FACE_ALIGNMENT.md) (the tap that starts it) and the double orbit
> ([`DOUBLE_ORBIT_PROTOTYPE.md`](DOUBLE_ORBIT_PROTOTYPE.md)).
> **Scope:** the orbited piece (green or turquoise) and the camera, from the alignment tap until the orbit ends (§6).
> ⭐⭐ **Since 2026-10-08 (`1.0.59x-Automated-approach-and-min-distance`) the WHITE SPHERE round the pink gizmo starts and ends it — the
> tap only aligns** (§9); then the piece's own minimum distance, the way out's offset from where the piece is drawn, and (`1.0.59y-Zoom-added`)
> the zoom outside the sphere (§9).

---

## 1. The rule

The owner, 2026-10-06: *"when resting face is aligned, the orbit center moves to the piece, the rest orbit around the piece."* Asked how,
the owner chose: the piece *"still pushed by dy"*; the fingers drive the *"camera on rings"*; *"dx/dy camera, dy also pushes"*; the move
*"the same as when the orbit center is moved in the scene (camera catches up while orbiting, etc.)"*; the pink ring *"stays at the old
centre"*; back to the centre *"never automatically"*.

From the end of the WAY IN (§2 — the alignment tap starts it, `enterPieceOrbit`, §1bis) until it ends (§6):

| | Orbit around the centre (before) | Orbit around the piece |
|---|---|---|
| **dx** | carries the piece round the rings; the camera follows | turns the **camera** around the piece; the piece does **not** move |
| **dy** | moves the piece along the rings (toward / away from the centre) | moves the camera through the rings' **pitches**, AND pushes the piece on a **straight line** through the pink gizmo |
| **the piece** | on the rings | on the line it had at the alignment (frozen), at the rings' distance for the ring position — dy as fast as before |
| **the camera looks at** | the orbit centre (the pink gizmo) | the piece |
| **the pink ring** | at the orbit centre | **stays** at the orbit centre (`centreBlend.targetM`, never retargeted by this) |

- **A tap while in it** keeps the mode (its state is set only once); it ENDS by itself, or at a respawn (`spawnOrbitPiece`) — §6.

## 1bis. An action of its own (`86afd21`, 2026-10-07)

The owner: *"Currently, a second touch on piece / right click while left click is hold triggers both resting face alignment and camera
orbit positioning around the piece. Make those two actions independent, although triggered by the same input. Later on, we will likely
map other inputs for those two different actions."*

- **`alignRestingFace`** turns the piece's resting face and nothing else; **`enterPieceOrbit`** starts the orbit around the piece and
  nothing else — neither calls nor reads the other.
- **The tap** (`orbitTapped` — a second touch ON the piece, or a right click while the left button orbits, its FIRST tap) calls both,
  each on its own; ONE episode if either acted. Mapping one to another input is one call moved.
- The orbit no longer needs an alignment to succeed: a piece with nothing to align to enters it too. HUD: the verdict adds *· the camera
  orbits the piece*.

## 2. The way in (2026-10-08)

The owner, in order: *"There is a dissimetry between way in and way out … if i introduce yaw rotation during the way in, the camera end up
having big sweep movement during which neither the piece nor the gizmo is in the screen"*; *"Start again from a5947c3 … Apply whatever of the
way out you can but making it simpler so the piece and gizmo stay in the view"*; *"On the way in, when I input dx, the scene seems to continue
to rotate around the gizmo until one frame when the scene starts to really be pushed left or right by the dx"*; *"Set the way in to the orbit
at 12 mm"*; and, on its view, *"I think I want to retain the sliding point"* → *"Option B is chosen"*.

The tap starts the WAY IN (`startPieceEntry`); when it is done (`entryProgress` = 1) the orbit around the piece starts (`startPieceOrbit`) —
with the camera, the piece and the view exactly where the way in left them.

- **ONE progress**: finger travel over **`pieceOrbitEnterMm` (12 mm)**, eased (smoothstep) and smoothed every frame on the orbit's spring
  (§6bis). **On the tap's frame nothing moves. A way in is never cancelled** (§6).
- **The pivot handed over GRADUALLY** (`carryHeading`): dx turns the CAMERA round the piece with all of the yaw, as the piece orbit does,
  while the PIECE is carried round the gizmo by the share of the yaw LEFT of the way in — all of it at the tap (exactly the centre orbit),
  half midway, none at the end (exactly the piece orbit): the scene goes from turning in place round the gizmo to sliding round the piece
  little by little — no frame where it suddenly starts sliding. dy moves the piece along the rings as in the centre orbit.
- **The camera** (`entryCamera`): round the piece at the rings' angles (the yaw and the ring pitch, the offsets), the camera's distance from
  the piece at the tap, plus the small shift of the tap's pose from those angles (the yaw and pitch offsets) fading out with the progress.
- **The view** (`entryLook`, option B): STRAIGHT AT a point sliding along the line from the gizmo to the piece, the slide paced
  (`evenSlide`: the sine rule in the camera–gizmo–piece triangle) so the view's direction turns the eased share of the whole angle — an
  even turn, gentle at both ends; a view off the gizmo at the tap (a way back cut short) is kept on the tap's frame and fades out.
- **The yaw speed is one** (*"the camera yaw speed is identical on way in and on piece orbit so there is no visual discontinuity"*): the
  game-wide gain (§4) applies to a drag that starts in the way in as in the piece orbit.
- ⛔ **Superseded the same day, in order**: the orbit around the piece starting AT the tap (`802a498`, reverted `a3d6fe9`: dx swung the camera
  round the piece mid-transition — big sweeps with neither in view); the fingers keeping the centre orbit through the way in and the piece
  orbit starting all at once at its end (`600c3e2`: the scene turned round the gizmo until one frame, then slid); a way in per axis — yaw
  with dx, pitch with dy at the orbit's own rates — then fed by the whole movement (`17636ca`, `cca0683`, reverted: on the outer rings the
  ring's pitch is so slow, 0.05°/mm, that a straight push stayed in the way in down to ~1.24 m); a calculated 3 mm (the slide's peak turn
  rate = the orbit's 3.78°/mm — undone by that revert); 60 mm (`600c3e2`: the whole top half of the rings is only ~33 mm of dy, the way in
  never completed on a straight push); the view turned by angle (`8fcae29`, reverted `da996d1` — the owner meant the pivot); the view aimed
  at the sliding point AND blended toward it by the same progress (the turn went as t², a magnet then a snap), then straight at it at an
  even slide (option A, `be823f3`: the turn still gathered toward the piece end as the point neared the camera).
- ⛔ **Before 2026-10-08**: the camera's orbit CENTRE gliding to the piece (`d3e0c07`: the camera swung out and back); the view slerped to the
  piece over 10 mm (`pieceOrbitSlerpMm`) and the starting offset faded over 60 mm (`pieceOrbitFadeMm`) — both sliders gone.

## 3. The gap — scaled as the piece comes in (`68b4584`)

The owner: *"only the gap scales from the camera distance from the green box at the moment of resting face alignment to x% of this value
(create a slider)"*.

- The camera's distance from the piece is **its distance at the alignment** (`gap0M`) with the piece where it was then (`ring0M` from the
  centre), **`pieceOrbitGapMinPct` %** of it with the piece at the rings' **closest** point, linear in the piece's distance between —
  `scaledGap`. Pushed back out beyond where it was aligned: held at 100 %.
- So dy brings the camera toward the piece as it pushes the piece in. ⛔ A first reading scaled from the radius offset (*"from the camera
  radius offset beyond the green box"*) — replaced by the owner's correction before it shipped.

## 4. The yaw gain — one for the game (`68b4584`, `f98b584`)

Why (measured, `68b4584`): the smoothing is the same in both orbits (the spring, the leash 0, the lag 0, 5.1°/mm), but the pivot is the
piece, close to the camera, so the rest of the scene SLIDES across the screen — 2–3× more per degree (the painting 0.00° → 0.54° per degree
of yaw, the floor's far corner 0.30° → 0.71°, the piece 2.23 m out) — larger steps per frame, judder at the tablet's ~20 fps.

The owner: *"lower gain while orbiting. Compute the lower gain based on the geometry and the parameters already set by slider (camera
position, etc.)"* — then *"the gain shall be unique during the whole game, and computed based on the camera position dictated by the
sliders values"*.

- **`referenceYawGain`**: the ratio of the scene's on-screen sweep (the play volume's 8 corners and centre, `sweepPoints`) for one small
  yaw step about the CENTRE — the camera the rings and the sliders place (the radius offset at the **boot zoom**, the yaw and pitch
  offsets) — to the same step about the PIECE at the sliders' gap there (`scaledGap`), **summed over 33 ring positions × 8 yaws**. Points
  behind the camera do not count. ⛔ Never above 1, never below 0.1.
- **Recomputed only when a slider it reads changes** (the key: the offsets, the radius offset, the boot zoom, the gap %, the radius clamp,
  the rings) — never from the live camera or zoom. **×0.74** with today's sliders. The HUD's `green` line shows it.
- **Applied to a drag that STARTS around the piece or in the way in** (`pieceYawGainDrag`, latched at the drag's first step; the way in since
  2026-10-08 — one yaw speed through it and the orbit): a drag running at the alignment tap keeps its speed to its end — a steady speed
  through every drag.
- ⛔ **Superseded**: a per-frame gain at the live pose (it ranged 0.55–0.95 through a turn; first it hit the 0.1 floor, the corners behind
  the camera swinging through ±90°); then that gain frozen at each drag's start (*"I'd rather have a steady speed, so freeze the gain at the
  start of each drag"*) — replaced, before it was committed, by the one game-wide gain.

## 5. Settings

| Slider | Default | Menu |
|---|---|---|
| gap at the closest ring (% of the gap at alignment) — `pieceOrbitGapMinPct` | 50 | CAMERA › **CAMERA ORBIT AROUND PIECE** |
| way in to the orbit around the piece (mm of finger travel, 0 = at once; 0–60, 1 mm steps) — `pieceOrbitEnterMm` (§2) | 12 | CAMERA › CAMERA ORBIT AROUND PIECE |
| ends when the piece is this close to the pink gizmo (% of its distance at the piece orbit's start) — `pieceOrbitEndPct` (§6) | 75 | CAMERA › CAMERA ORBIT AROUND PIECE |
| way back to the centre orbit (mm of finger travel, 0 = at once) — `pieceOrbitReturnMm` (the way BACK: move and view, ONE value) | 30 | CAMERA › CAMERA ORBIT AROUND PIECE |

⭐ The owner: *"x% slider shall be in a CAMERA/CAMERA ORBIT AROUND PIECE menu"*, *"rename the menu CAMERA/CAMERA ORBIT to CAMERA ORBIT
AROUND CENTER"*. The HUD's `camera` line: `r=` is the distance **to the piece** in this mode (the camera looks along an axis, not at a
target); `c=` still names the orbit centre.

## 6. The end, and the way back to the orbit around the centre (`f8beaf5`, 2026-10-07)

> ⛔ **The END RULE below is SUPERSEDED (2026-10-08, `1.0.59x-`)** — the x % and then the 75 % + a clear push step are deleted; the way out
> starts when the piece ENTERS the white sphere (§9). ⭐ The way out itself stands: 30 mm, around the piece, its squared turn.

The owner: *"Track the initial distance of the piece to pink gizmo when orbit around the piece is triggered. Automatically end it when
the distance crosses initial distance * x% (make a slider in camera orbit around piece menu and set default to 50%). When it ends (in this
case or at respawn), the camera orbit transition to center orbit is the same reverse as when it transitions from center orbit to piece
orbit."*

- **The start distance** to the pink gizmo (`centreBlend.targetM`) is recorded when the orbit around the piece STARTS — at the end of the
  way in (2026-10-08, *"Add it"*; at the tap before, which cut a way in short on a push).
- **The end, by itself**: checked at each frame's start — the piece closer than **`pieceOrbitEndPct` % (75)** of it (`pieceOrbitEnds`;
  pushed away, never) **AND a CLEAR PUSH step seen** (2026-10-08, the owner: *"the way out triggers only when, besides the xx% distance, a
  finger step is a clear push. That means |dy| at least twice |dx| on that step, with dy outside the deadband. If the piece crosses the
  xx% line during a diagonal or sideways movement, the way out waits for the first such push step"* — `pushStep`; *"Set to 75% plus clear
  push step"*, 50 before). ⭐ It replaces *"never automatically"* (§1). ⛔ A way in is never cancelled by it. ⛔ A FORCED way out (when dy
  had no more room for it before the waist rings) was built and dropped before it was committed: the whole top half of the rings is ~33 mm
  of dy, so it fired almost at once.
- **The way back — AROUND THE PIECE, the view TIED to the move, ONE value** (`returnToCentreOrbit`, `startCentreReturn`; 2026-10-07). The
  owner: *"Explain how the camera exits … if the camera is in between the piece and the gizmo due to some piece orbit, when the camera
  moves to center orbit there are moments when the piece is not seen any longer"* — the cause: the camera moved AROUND THE GIZMO (its
  angles and distance about the centre, over 60 mm) while its view reached the gizmo after only 10 mm, so from between the piece and
  the gizmo the piece sat BEHIND the camera for most of the way; then *"both together … with 10mm and 60mm merged into one single
  value"* — *"60 mm"*, then *"Set way out in 30mm"* (2026-10-08). On the frame it ends **nothing moves** — the camera where it is, looking
  where it looks; then ONE eased progress, finger travel over **`pieceOrbitReturnMm` (30 mm)**, drives everything:
  - **the camera moves AROUND THE PIECE** — its angles around the piece and its distance from it, against the centre orbit's home camera
    seen from the piece, fade out (`returnCamera`) — so it never swings round the gizmo;
  - **its view aims at a point sliding from the piece to the gizmo** at that same progress (`returnLook`; blended from the LIVE direction
    to the piece by it too, and the start's own turn off that direction fading out) — it reaches the gizmo only when the camera is home;
  - the piece's offset from the rings fades with it (below).
  Home, the state is dropped: the centre orbit as it always was. ⛔ The start's view is held as a TURN off the direction to the piece,
  never a fixed world direction — the first build kept `look0` fixed, and a long dx during the way back pointed the view off the scene
  (seen headless). ⭐⭐ **Its view keeps the SQUARED turn** (the owner, 2026-10-08: *"I prefer the squared turn for the way out"*): option
  B (§2's even slide) was tried on it and discarded — from between the piece and the gizmo the even turn left the piece up to 33.5° off
  the view's centre (the squared turn: 23.8°; the usual case 8.7° against 6.9°).
- ⛔ A TWO-PHASE way back (`b80111a`: the camera home watching the piece, then the watch to the gizmo, twice the travel) was built and
  REVERTED by the owner (`bb0b79b`, back to `4539a2b`); the one-slerp way back around the gizmo (`f8beaf5`) is replaced by the one above.
- **The piece**: dx turned only the camera around the piece, so the rig's yaw had drifted from the piece's real direction — at the end
  the rig's yaw is put back on it (the springs and the camera started again from there), and the piece's small difference from the ring
  curve (its frozen line is straight, the rings are not) fades out the same way (`returnPieceOffset`).
- **At a respawn** (around the piece, or still on the way back): the same way back from the camera as it is; the piece and the rig go
  back to boot as a respawn always does.
- **A new tap** enters the orbit around the piece again — a way back still in progress gives way.
- HUD: the `green` line reads *· entering the orbit around the piece* during the way in, *· around the piece, yaw gain ×…* in it, *· back
  to the centre orbit* during the way back; the verdict *orbit: the piece within 75 % of its start distance to the pink gizmo — back to the
  centre orbit*.

## 6bis. The transitions ease every frame, as the orbit does (2026-10-07)

The owner: *"Why when the camera changes focus to piece and then to pink gizmo, the movement of the camera with delta position input is
much less smooth than during standard orbit?"* — then *"Smooth the movement of the camera at start and end of piece orbit"*. (Built on the
way in of its day; the way in of §2 reads its progress the same way.)

- **Why** (read in the code): the orbit itself steps once per pointer EVENT (47–68 ms apart on the tablet, `D86`) but is eased EVERY FRAME
  on its spring (`boxSmoothMs`, 60 ms). The transitions — the way in's view-axis slerp (§2) and offset fade, the way back's fade and slerp
  (§6) — read the finger's travel RAW, added in the pointer handler: they moved in steps at the event rate, a 10 mm slerp 20–30 % of its
  turn per event (~10° jolts on a 30–40° swing).
- **Now** (`smoothTravel`): the drag adds to a RAW count (`rawMm`); every frame the travel the transitions read (`travelledMm`) follows it on
  the SAME critically damped spring as the orbit (τ = `boxSmoothMs` / 2) — continuous, never past the finger's count, settling exactly on
  it. ⚠ Cost: the orbit's own ~60 ms of lag. `boxSmoothMs` 0: the raw count, as before.
- Vector: events every 60 ms of 3 mm, frames every 16 ms — the travel moves on EVERY frame, never more than 1.6 mm (the raw jump is 3),
  never back, settles exactly; failing on the code before it.

## 7. Open

- ⚠ **The way in's progress is finger travel**: 12 mm — on a straight push from the top ring it completes at ~1.8–2.0 m, the piece orbit
  then runs to 75 % of that (~1.3 m) and a push step. Nothing here is judged on the tablet yet.
- ⚠ The view-axis slerps and the fades move only with a FINGER — the coast after a lift does not advance them (as the scene's centre
  move); a finger lifted right after the end leaves the camera partly turned until the next orbit (the smoothing of §6bis only lets the
  last event's travel land).
- ⚠ The frame where it ENDS was not caught headless (the harness's last frame before it is missing): continuity there is vectored, not
  yet seen.
- ⚠ This branch has the rings at **±1.575 m** (`1.0.59s-`'s); the ±1.0 m of `1.0.59t-` was not carried over.

## 8. Checked headless (2026-10-06, 2026-10-07)

`Scene_1`, an orbit + a second-finger tap on the piece at boot (3.0 m from the centre), then dy in, then dx: the camera's distance to the
piece **1.263 → 0.766 m** without ever growing (no swing), 0.752 m at 0.64 m; the gain ×0.74 throughout; after a 180-pixel dx turn the
piece at the screen's centre, the pink ring still on the painting, no error. Vectors: nothing moves at the alignment (three poses); the
slerp is half the angle at half the travel and the distance never leaves the gap; the offset fades onto the rings' angles; the gap's
scaling; dx turns only the camera, dy pushes on the frozen line; the gain equalises the summed sweep and depends on the sliders alone;
the wiring — each failing on a mutant (the look at the piece at once, no fade, the gap never scaled, dx still carrying the piece, a bent
ratio, the gain left out of the drag).

⭐ 2026-10-07 (`f8beaf5`): aligned at boot (3.0 m from the gizmo), pushed in — the orbit ENDED at **1.49 m**, the first step under 50 %; the
two frames after it nearly identical; a 160-pixel sideways drag brought the camera most of the way back onto the centre orbit (60 mm of
travel needed); no error. Vectors: the start distance and the threshold (pushed away, never; from zero, never); the way back — nothing
moves at its start, the slerp half at half, home exactly the centre orbit's camera looking at the centre, the piece's offset gone —; the
two actions apart (the alignment never starts the orbit, the orbit never reads the alignment); each failing on a mutant (never ending,
the distance not faded, the coupled tap).

⭐ 2026-10-07, the way back around the piece: the end at 1.50 m, then a 160-pixel dx during the way back — the piece and the painting
in the middle of the view (the first build, its start view a fixed world direction, looked down at the floor there). Vectors: from BETWEEN
the piece and the gizmo, the camera's distance to the piece stays between its two ends and the piece within 25° of the view axis ALL the
way; home exactly the centre orbit's camera looking at the gizmo; a big dx early on keeps the piece within 30° — failing on mutants (the
view straight to the gizmo; the fixed world start direction).

⭐ 2026-10-08 (`ba0828e`, then the gradual pivot and option B): a straight push after the tap at boot — the way in done by ~1.8–2.0 m, the
orbit around the piece to 1.26 m (75 % of its start, on a push step), the way back; with sideways drags during the way in, it completes
within its 12 mm and the orbit around the piece takes over without a jump; no error. Vectors: nothing moves at the tap; the piece carried
by the share left (all at the tap, none at the end); the orbit starting exactly where the way in ended; the view straight at a point on the
gizmo–piece line, turned the eased share of the angle (option B); the push rule; the gain latched in the way in too — each failing on a
mutant (the all-at-once switch, the plain slide of option A, a looser push rule).

## 9. The white sphere, and what it brought (2026-10-08/09, `1.0.59x-` → `1.0.59y-`)

The owner: *"Create a sphere radius x centered on pink gizmo, slider for x, default = 1m, translucent white. When the piece enters the
sphere, automatically trigger way out. When the piece exits the sphere, automatically trigger way in. place an hysteresis of 10% on the
crossing … The way in and way out are therefore disconnected from resting face (which keeps its input trigger as it is now)."* — *"Way in
at boot"*, *"±10 %: in at 0.9 m, out at 1.1 m"*.

- **The sphere** (`sphereFrame`, after `pinkRingFrame` each frame): centred on the pink gizmo, radius `pieceSphereRadiusM` (CAMERA ORBIT
  AROUND PIECE, 0–3 m, **1 m**; 0 = none), white at α 0.08 seen from both sides (the camera is often inside it), never picked.
  **Inside below 0.9 r → the WAY OUT; outside beyond 1.1 r → the WAY IN** (`outsideSphere`, `SPHERE_HYSTERESIS` 0.1); at boot and after
  a respawn the plain radius decides (`Scene_1` boots at 3 m: a way in). **The resting-face tap only aligns.**
- **Room, as advised**: from 0.9 m about 12 mm of dy are left before the waist, so a 30 mm way out may still run past it (harmless); past the
  waist the piece can leave at 1.1 m on the lower half — a new way in; the way in has ~25 mm of room outward. ⚠ A radius ≥ **2.87 m** would
  let a 30 mm way out always finish before the floor — but then 1.1 r > 3 m, the rings' ends, and the piece could never leave again.
- **No jump at the crossings** (`f62a346`; *"I want the position and quaternion to remain at the entrance and exit of the sphere even if the
  resting face is not aligned"*): the spin with the orbit reads the piece's REAL heading round the centre (`headingAbout`) — the way
  out's rebase of the yaw had spun an unaligned piece by 3× its drift in one frame; and a way in that cuts a way out short TAKES OVER its
  offset still left and fades it over its own 12 mm (`entryPieceOffset`) — it was dropped in one frame.
- **No spin while the sphere is on** (*"when the piece is not aligned and inside the sphere, the piece rotates with the yaw orbit. remove
  that (I want the piece to behave the same as when resting face is aligned)"*): `counterYawFrame` does nothing while `pieceSphereRadiusM`
  > 0, inside the sphere or out; a sphere at 0 resumes it without a jump.
- **The way out's offset is measured where the piece is DRAWN** (`44327fc`, *"do the fix"*): the rebase keeps the box spring's elevation
  (re-based on the yaw only) and measures from there — it measured from the FINGER's, so a fast dy baked the spring's trailing into an
  offset faded over 30 mm. The closest approach coming from outside, sphere 1 m: **5 mm/s 0.168 → 0.155 m, 40 mm/s 0.203 → 0.166 m,
  160 mm/s 0.357 → 0.197 m**; what is left is the way out's own travel smoothing (§6bis — kept: removing it brings the jolts back).
- **The piece's OWN minimum distance, ZERO** (`0f42faf`, *"give the piece its minimum at zero. no slider"*): `PIECE_MIN_DISTANCE_M`,
  `clampPieceRadiusM`, read at the four places that place or judge the piece. It rode the CAMERA's near-plane guard (`cameraRadiusMinM`,
  0.15 m) — a 0.15 m ball through the waist; now the rings decide (`Scene_1`'s waist **0.09 m**), the camera keeping its 0.15 m.
  ⚠ Until collision is built the piece passes THROUGH the painting at the waist. Headless: closest 0.090 m from inside, ~0.13 m from outside.
- **The zoom outside the sphere** (`6b5e8b7`, *"why the zoom only works if the piece is inside the white sphere?"* → *"build it"*): the way
  in and the orbit around the piece multiply the camera's distance from the piece by the zoom now over the zoom at their start
  (`zoomScale`, `PieceEntry.zoom0`, `PieceOrbit.zoom0`) — they read `gap0M` alone. Headless, outside: **1.263 m → 0.799 m** (zoom 0.633)
  **→ 1.996 m** (1.58); the hand-over from the way in keeps the distance at any zoom (vectored at 3).
- ⛔ Three rings (the 2nd and 3rd merged) were tried and rejected the same day → [`DOUBLE_ORBIT_PROTOTYPE.md`](DOUBLE_ORBIT_PROTOTYPE.md) §6.

Vectors: `tests/proto_piece_orbit.test.ts` (the hysteresis, the wiring, no jump at either crossing, the drawn-elevation offset at 5 and
160 mm/s, the zero minimum, the zoom) — each failing on the old code.
