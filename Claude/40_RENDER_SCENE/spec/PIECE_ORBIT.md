# The orbit around the piece — specification (prototype)

> **Status:** ✅ BUILT 2026-10-06 on `1.0.59u-from1.0.59s-Orbit-around-piece` — commits `d3e0c07` (*orbit center on piece*), `68b4584` (*orbit around the
> piece*), `f98b584` (*frozen gain*), `864c6f2` (the slerp's own slider); then on **`1.0.59v-`** (2026-10-07): `86afd21` (§1bis, an action of
> its own), `f8beaf5` (§6, the end by itself and the way back), the transitions' smoothing (§6bis), and the way back around the piece (§6). ⛔ Unjudged by a hand. `input/piece_orbit.ts` (engine-free),
> `render/green_box_wiring.ts` (`enterPieceOrbit`, `returnToCentreOrbit`, `greenBoxFrame`, `sweepPoints`, `pieceOrbitAngleOffset`),
> `render/pointer_wiring.ts` (`orbitTapped`, `orbitDragStep`, the finger travel); vectors `tests/proto_piece_orbit.test.ts`.
> **Builds on:** [`RESTING_FACE_ALIGNMENT.md`](RESTING_FACE_ALIGNMENT.md) (the tap that starts it) and the double orbit
> ([`DOUBLE_ORBIT_PROTOTYPE.md`](DOUBLE_ORBIT_PROTOTYPE.md)).
> **Scope:** the orbited piece (green or turquoise) and the camera, from the alignment tap until the orbit ends (§6).

---

## 1. The rule

The owner, 2026-10-06: *"when resting face is aligned, the orbit center moves to the piece, the rest orbit around the piece."* Asked how,
the owner chose: the piece *"still pushed by dy"*; the fingers drive the *"camera on rings"*; *"dx/dy camera, dy also pushes"*; the move
*"the same as when the orbit center is moved in the scene (camera catches up while orbiting, etc.)"*; the pink ring *"stays at the old
centre"*; back to the centre *"never automatically"*.

From the alignment tap (`enterPieceOrbit`, §1bis) until it ends (§6):

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

## 2. The way in — the camera does not move (`f98b584`)

The owner: *"Why not simply slerp rotating the view axis of the camera to align with the piece and catch the orbit from there?"* — then
*"the view-axis slerp runs with finger travel like the centre move"* and *"fade out the starting angle offset"*.

- **On the alignment's frame nothing moves** — the camera where it was, looking where it looked.
- **The VIEW AXIS slerps** from the orbit centre to the piece, from where the camera is, by **finger travel** over `pieceOrbitSlerpMm`
  (**10 mm**; smoothstep) — `viewAxis`. ⭐ The owner: *"make the camera slerp faster (put a slider)"* — it had shared the scene's centre
  move's `orbitBlendDistanceMm` (30 mm). ⛔ A fixed-time slerp (400 ms, then a quintic ease) was built and DISCARDED by the owner the same
  day; the slerp stays on finger travel.
- **The orbit starts from where the camera is**: at the alignment, the camera's angles around the piece are recorded AGAINST the rings'
  angles (`startPieceOrbit` → `dAzRad`, `dElRad`). The camera then sits at the rings' angles (`cameraOffset`'s: the rig's yaw + the yaw
  offset, the ring pitch + the pitch offset) **plus that difference, fading out with finger travel** over `pieceOrbitFadeMm` (60 mm) —
  `pieceCamera`. Once faded, dx and dy move the camera exactly as the rings say.
- ⛔ **Superseded** (`d3e0c07`): the camera's orbit CENTRE glided from the pink gizmo to the piece by finger travel, the camera keeping its
  ring angles around the moving centre. Because those angles are not the centre-to-piece direction (the ring pitch, the offsets), the
  camera swung OUT and back toward the piece during the glide — the owner: *"why does the camera move away from the piece … to then move
  back close to the piece"*.

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
- **Applied to a drag that STARTS around the piece** (`pieceYawGainDrag`, latched at the drag's first step): a drag running at the
  alignment tap keeps its speed to its end — a steady speed through every drag.
- ⛔ **Superseded**: a per-frame gain at the live pose (it ranged 0.55–0.95 through a turn; first it hit the 0.1 floor, the corners behind
  the camera swinging through ±90°); then that gain frozen at each drag's start (*"I'd rather have a steady speed, so freeze the gain at the
  start of each drag"*) — replaced, before it was committed, by the one game-wide gain.

## 5. Settings

| Slider | Default | Menu |
|---|---|---|
| gap at the closest ring (% of the gap at alignment) — `pieceOrbitGapMinPct` | 50 | CAMERA › **CAMERA ORBIT AROUND PIECE** |
| starting angle offset fade-out (mm of finger travel, 0 = at once) — `pieceOrbitFadeMm` (the way IN) | 60 | CAMERA › CAMERA ORBIT AROUND PIECE |
| view axis slerp to the piece (mm of finger travel, 0 = at once) — `pieceOrbitSlerpMm` (the way IN) | 10 | CAMERA › CAMERA ORBIT AROUND PIECE |
| ends when the piece is this close to the pink gizmo (% of its start distance) — `pieceOrbitEndPct` | 50 | CAMERA › CAMERA ORBIT AROUND PIECE |
| way back to the centre orbit (mm of finger travel, 0 = at once) — `pieceOrbitReturnMm` (the way BACK: move and view, ONE value) | 60 | CAMERA › CAMERA ORBIT AROUND PIECE |

⭐ The owner: *"x% slider shall be in a CAMERA/CAMERA ORBIT AROUND PIECE menu"*, *"rename the menu CAMERA/CAMERA ORBIT to CAMERA ORBIT
AROUND CENTER"*. The HUD's `camera` line: `r=` is the distance **to the piece** in this mode (the camera looks along an axis, not at a
target); `c=` still names the orbit centre.

## 6. The end, and the way back to the orbit around the centre (`f8beaf5`, 2026-10-07)

The owner: *"Track the initial distance of the piece to pink gizmo when orbit around the piece is triggered. Automatically end it when
the distance crosses initial distance * x% (make a slider in camera orbit around piece menu and set default to 50%). When it ends (in this
case or at respawn), the camera orbit transition to center orbit is the same reverse as when it transitions from center orbit to piece
orbit."*

- **The start distance** to the pink gizmo (`centreBlend.targetM`) is recorded when the orbit starts (`pink0M`).
- **The end, by itself**: checked at each frame's start — the piece closer than **`pieceOrbitEndPct` %** (50) of it (`pieceOrbitEnds`;
  pushed away, never). ⭐ It replaces *"never automatically"* (§1).
- **The way back — AROUND THE PIECE, the view TIED to the move, ONE value** (`returnToCentreOrbit`, `startCentreReturn`; 2026-10-07). The
  owner: *"Explain how the camera exits … if the camera is in between the piece and the gizmo due to some piece orbit, when the camera
  moves to center orbit there are moments when the piece is not seen any longer"* — the cause: the camera moved AROUND THE GIZMO (its
  angles and distance about the centre, over 60 mm) while its view reached the gizmo after only 10 mm, so from between the piece and
  the gizmo the piece sat BEHIND the camera for most of the way; then *"both together … with 10mm and 60mm merged into one single
  value"* — *"60 mm"*. On the frame it ends **nothing moves** — the camera where it is, looking where it looks; then ONE eased progress,
  finger travel over **`pieceOrbitReturnMm` (60 mm)**, drives everything:
  - **the camera moves AROUND THE PIECE** — its angles around the piece and its distance from it, against the centre orbit's home camera
    seen from the piece, fade out (`returnCamera`) — so it never swings round the gizmo;
  - **its view aims at a point sliding from the piece to the gizmo** at that same progress (`returnLook`; blended from the LIVE direction
    to the piece by it too, and the start's own turn off that direction fading out) — it reaches the gizmo only when the camera is home;
  - the piece's offset from the rings fades with it (below).
  Home, the state is dropped: the centre orbit as it always was. ⛔ The start's view is held as a TURN off the direction to the piece,
  never a fixed world direction — the first build kept `look0` fixed, and a long dx during the way back pointed the view off the scene
  (seen headless). The way IN is unchanged (*"For the way in, we will advise later on"*).
- ⛔ A TWO-PHASE way back (`b80111a`: the camera home watching the piece, then the watch to the gizmo, twice the travel) was built and
  REVERTED by the owner (`bb0b79b`, back to `4539a2b`); the one-slerp way back around the gizmo (`f8beaf5`) is replaced by the one above.
- **The piece**: dx turned only the camera around the piece, so the rig's yaw had drifted from the piece's real direction — at the end
  the rig's yaw is put back on it (the springs and the camera started again from there), and the piece's small difference from the ring
  curve (its frozen line is straight, the rings are not) fades out the same way (`returnPieceOffset`).
- **At a respawn** (around the piece, or still on the way back): the same way back from the camera as it is; the piece and the rig go
  back to boot as a respawn always does.
- **A new tap** enters the orbit around the piece again — a way back still in progress gives way.
- HUD: the `green` line reads *· back to the centre orbit* during it; the verdict *orbit: the piece within 50 % of its start distance to
  the pink gizmo — back to the centre orbit*.

## 6bis. The transitions ease every frame, as the orbit does (2026-10-07)

The owner: *"Why when the camera changes focus to piece and then to pink gizmo, the movement of the camera with delta position input is
much less smooth than during standard orbit?"* — then *"Smooth the movement of the camera at start and end of piece orbit"*.

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
