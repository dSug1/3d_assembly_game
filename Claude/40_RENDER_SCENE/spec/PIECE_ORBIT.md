# The orbit around the piece — specification (prototype)

> **Status:** ✅ BUILT 2026-10-06 on `1.0.59u-from1.0.59s-Orbit-around-piece` — commits `d3e0c07` (*orbit center on piece*), `68b4584` (*orbit around the
> piece*), `f98b584` (*frozen gain*); the slerp's own slider after. ⛔ Unjudged by a hand. `input/piece_orbit.ts` (engine-free), `render/green_box_wiring.ts`
> (`alignRestingFace`, `greenBoxFrame`, `sweepPoints`, `pieceOrbitAngleOffset`), `render/pointer_wiring.ts` (`orbitDragStep`, the finger
> travel); vectors `tests/proto_piece_orbit.test.ts`.
> **Builds on:** [`RESTING_FACE_ALIGNMENT.md`](RESTING_FACE_ALIGNMENT.md) (the tap that starts it) and the double orbit
> ([`DOUBLE_ORBIT_PROTOTYPE.md`](DOUBLE_ORBIT_PROTOTYPE.md)).
> **Scope:** the orbited piece (green or turquoise) and the camera, from the first resting-face alignment on.

---

## 1. The rule

The owner, 2026-10-06: *"when resting face is aligned, the orbit center moves to the piece, the rest orbit around the piece."* Asked how,
the owner chose: the piece *"still pushed by dy"*; the fingers drive the *"camera on rings"*; *"dx/dy camera, dy also pushes"*; the move
*"the same as when the orbit center is moved in the scene (camera catches up while orbiting, etc.)"*; the pink ring *"stays at the old
centre"*; back to the centre *"never automatically"*.

From the FIRST resting-face alignment (`alignRestingFace`) until a respawn:

| | Orbit around the centre (before) | Orbit around the piece |
|---|---|---|
| **dx** | carries the piece round the rings; the camera follows | turns the **camera** around the piece; the piece does **not** move |
| **dy** | moves the piece along the rings (toward / away from the centre) | moves the camera through the rings' **pitches**, AND pushes the piece on a **straight line** through the pink gizmo |
| **the piece** | on the rings | on the line it had at the alignment (frozen), at the rings' distance for the ring position — dy as fast as before |
| **the camera looks at** | the orbit centre (the pink gizmo) | the piece |
| **the pink ring** | at the orbit centre | **stays** at the orbit centre (`centreBlend.targetM`, never retargeted by this) |

- **A re-alignment** keeps the mode (its state is set only once); **a respawn** (`spawnOrbitPiece`) ends it.
- ⛔ **No way back yet** — see §6.

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
| starting angle offset fade-out (mm of finger travel, 0 = at once) — `pieceOrbitFadeMm` | 60 | CAMERA › CAMERA ORBIT AROUND PIECE |
| view axis slerp to the piece (mm of finger travel, 0 = at once) — `pieceOrbitSlerpMm` | 10 | CAMERA › CAMERA ORBIT AROUND PIECE |

⭐ The owner: *"x% slider shall be in a CAMERA/CAMERA ORBIT AROUND PIECE menu"*, *"rename the menu CAMERA/CAMERA ORBIT to CAMERA ORBIT
AROUND CENTER"*. The HUD's `camera` line: `r=` is the distance **to the piece** in this mode (the camera looks along an axis, not at a
target); `c=` still names the orbit centre.

## 6. Open

- ⛔ **The way back to the orbit around the centre** — none today (only a respawn: the SCENE menu's piece switch, or a restart). Options
  put to the owner: a double tap on empty space (the camera reset's gesture), a tap on the pink ring, a button beside *HUD* / ☰, pushing
  the piece back out past where it was aligned — each the way in reversed (the view axis back to the gizmo, the camera onto the centre's
  rings).
- ⚠ The view-axis slerp and the fade move only with a FINGER — the coast after a lift does not advance them (as the scene's centre move).
- ⚠ This branch has the rings at **±1.575 m** (`1.0.59s-`'s); the ±1.0 m of `1.0.59t-` was not carried over.

## 7. Checked headless (2026-10-06)

`Scene_1`, an orbit + a second-finger tap on the piece at boot (3.0 m from the centre), then dy in, then dx: the camera's distance to the
piece **1.263 → 0.766 m** without ever growing (no swing), 0.752 m at 0.64 m; the gain ×0.74 throughout; after a 180-pixel dx turn the
piece at the screen's centre, the pink ring still on the painting, no error. Vectors: nothing moves at the alignment (three poses); the
slerp is half the angle at half the travel and the distance never leaves the gap; the offset fades onto the rings' angles; the gap's
scaling; dx turns only the camera, dy pushes on the frozen line; the gain equalises the summed sweep and depends on the sliders alone;
the wiring — each failing on a mutant (the look at the piece at once, no fade, the gap never scaled, dx still carrying the piece, a bent
ratio, the gain left out of the drag).
