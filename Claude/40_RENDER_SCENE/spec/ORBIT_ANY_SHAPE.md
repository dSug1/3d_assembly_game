# THE ORBIT ON ANY SHAPE — `Scene_0`'s heptagon (2026-11-12, branch `1.0.125-Debug_scene_0`)

> *"in the polar orbit of the heptagon: the red and green sections are broken … the green contour larger than the slanted faces … the concept of tight
> rope is not implemented (the gizmo can travel in the void beyond the edges of the heptagon). In the tilted pole orbit of the heptagon: … the dy can push
> the gizmo and piece beyond the zenith edge on the other side, but the camera does not tilt so the view is upside down and at one point … any further dy
> movement in the same direction is blocked … around the zenith edge … jumps of the camera, tilted view … on the bottom face, sometimes the crossing of an
> edge is blocked after crossing an edge"* → *"do a series of random walks … do a deep root cause analysis and propose fixes which would not regress the
> scene 1"* → *"OK. Capture these rules in the tiered md files. Proceed with the fixes."* — the owner

Base: `12dc4b6` (the best orbit so far, `POLAR_ORBIT_CLEANUP.md` §9.16) + `Scene_0` the heptagon and its anchor (`GAME_STRUCTURE.md` §7). ⛔ The slide is not
tested here (it will be removed later; the trial `1.0.122-` failed).

## 1. THE RULES (the owner's, for every shape) — what a walk checks

| # | rule | broken when |
|---|---|---|
| R1 | **the rope is tight**: the green and red sections lie ON the surface; over a void they are a STRAIGHT segment between the surface either side | a section point off every part, not on the straight chord across a void |
| R2 | **the green and the red are PLANES** (plane cuts of the shape) | a section's points off its best plane |
| R3 | **the gizmo at the sections' intersection** | the gizmo off either section |
| R4 | **the camera never upside down** | the camera's up against the world's up, the view not near vertical |
| R5 | **tilted pole: the camera's view aligned with the world's axes** | neither the screen's right nor its up along a world axis |
| R6 | **no jump** of the gizmo, the piece or the camera | a step large against the walk's own recent steps |
| R7 | **no blocked movement** (other than at the polar orbit's poles) | the finger moving, the gizmo and the piece still |
| R8 | **no tilt** of the camera (a roll step) or of the piece (a turn the player did not make) | |
| R9 | ⛔ the solver's budget: **24 gap queries a frame** (the owner tests on an iPhone) | a frame's total over 24 |

## 2. ⭐⭐⭐ THE RULE FOR A FACE THAT IS NOT A RECTANGLE (the owner, 2026-11-12: *"OK"*)

On a rectangle both sections are straight edge to edge. On another polygon (the heptagon's END faces) they cannot both be: the face is narrow at one
place and wide at another. **Per face, any shape: keep straight the section that continues as ONE RING onto the neighbouring faces; when neither does,
keep the GREEN (dx) straight.** The other one follows the face (the same share of its chord).

* The horizontally extruded heptagon: its upright end faces are crossed by the green ring that goes round the long faces → the green straight
  (horizontal, edge to edge at every height), the red bending toward the narrow top / bottom.
* A vertically extruded one: the heptagonal top / bottom hold the poles — far out the polar map is RADIAL there (the red straight through the centre, the
  green rings on the face's plane: both rules hold, no choice); close in, tilted square to the camera, every way off it is a frame change, no ring → the
  green straight.
* ⭐ A rectangle is untouched by construction: `Scene_1`'s cube (six rectangles) is unchanged whatever the rule.

## 3. ⭐⭐⭐ A RIDGE HOLDS THE POLE (the owner, 2026-11-12: *"2 … OK"*)

Two faces equally near the vertical that meet at an edge (the heptagon's two top faces at the zenith) hold the pole TOGETHER: neither is "the cap". Each
top face runs up to 90° in its column, a dy goes straight over the zenith onto the other one, each tilts (close in) from ITS OWN side. ⛔ Before: a
tie-break made the back face the cap, the front top face (the goal's) an ordinary side.

## 4. The walks (2026-11-12) — 13 on the heptagon, the same 13 on `Scene_1`

Far (polar), mid, close (tilted pole), at contact; the zenith, the bottom, the ends, random dx / dy zig-zags. The recorder (`walk_probe.mjs`) extended
with the camera's own axes, the piece's turn, the sections' points at every change and the parts' face planes; the rules checked by
`scripts/probes/walk_rules.mjs` (R1 – R8), the tight rope by `walk_rope.mjs`.

| per 1000 frames (same walks) | heptagon | `Scene_1` |
|---|---|---|
| R4 the view upside down | 1.2 | 0.1 |
| R8 a camera roll step | 3.6 | 1.2 |
| R2 the green not a plane | 12.7 | 5.5 |
| R1 runs over a void NOT straight (whole runs) | 11 536, none straight | 3 342 (689 straight) |
| R6 jumps (gizmo / piece / camera) | 5.8 / 7.7 / 14.4 | 5.2 / 11.0 / 13.4 |
| R7 blocked | 1.4 | 1.5 |
| R9 the worst frame (queries) | 31 | 38 |

⚠ `Scene_1` has rope and budget breaks of its own today — "no regression" means none made worse.

## 5. ⭐⭐⭐ THE ROOT CAUSES

**RC1 — every facet is placed in its BOUNDING RECTANGLE** (`face_map.ts`: `mapTarget` across `tLo … tHi`, up `bLo … bHi`). The seven-sided end faces'
squares have void corners: ALL 11 536 rope breaks (up to 184 mm off the surface) are there; most of the green's non-planarity too (253 of 409 polar cases
planar once the end faces' points are left out). → the owner's *"green contour larger than the slanted faces … beyond the edges"*.

**RC2 — the pole model assumes ONE LEVEL cap, CENTRED on the core** (`buildFaceMap`'s `capOf`, `capCentre`, `capTilt`):
* the two top faces tie at 63.7° — a tie-break made the BACK one the top cap, the front top face (the goal's) a side up to 76.9°; far out from the front
  the place was handed to the back face there: the piece took its normal, beyond the zenith;
* close in the automatic tilt fired on that back face WITH THE CAMERA'S HEADING (front): a face leaning away needs 116° — past the vertical, the view
  upside down (17 of 22 such tilts; 0 of 19 with the camera behind); leaving it rolled the camera back ~170° in 10 frames;
* the cap's quarters converge to the core's middle projected on the cap's plane — off a cap that is not centred on the core.
→ *"beyond the zenith edge on the other side … upside down"*, *"jumps of the camera, tilted view"* (attachments 6, 8).

**RC3 — each column has its OWN pitch bands** (the facets' elevations: front −64 / −13 / 38 / 77°, back −64 / −13 / 51°, ends ±45°): a constant pitch
sits at different heights in adjacent columns — the green ring is not a plane and breaks at the columns' borders (on a box every column is ±45°).

**RC4 — the orbit's angles and the map's angles part after a tilt.** `tiltOff` turns the orbit's angles by the frame's rotation; the map's are taken at
the gizmo (`mapAngles`). On the heptagon they disagree: the orbit ends at a POLE (v 0 or 1) with the gizmo mid-face; the map moves only by the orbit's
step (`mapAnglesStep`) — zero at the pole: the face is never reached (45 – 378 frames blocked at v 0 / 1). → *"on the bottom face … blocked after
crossing an edge"*.

**RC5 — the budget.** The checks (the stuck probe's four solves, the turn sweeps) are billed to the NEXT frame (~23 queries); that frame's solve has ~1
left and its first iteration always completes: 25 – 31 on the heptagon, 38 on `Scene_1` (one solve alone 29 there).

## 6. THE FIXES — in this order (the owner: *"3 … OK"*), each with its vectors (red on the old code), then the same walks on both scenes

| | fix | `Scene_1` unchanged because |
|---|---|---|
| F2a | the cap's centre = the cap POLYGON's centroid | the cube's top polygon is centred on the core |
| F2b | a RIDGE holds the pole (§3): two faces tied for it, meeting at an edge — no cap; each runs to ±90° in its column | one level top: never a tie |
| F2c | a slanted face holding a pole tilted toward ITS OWN heading (never past the vertical) | a level cap has no heading: the camera's, as today |
| F4 | the map's angles moved by the FINGER's step at a pole (clamped ±90°), not the orbit's clamped step | map and orbit coincide on the cube (but the catch-up after a slide) |
| F1 | a facet placed on its POLYGON (§2's rule): the straight section edge to edge, the other the same share of the chord | a rectangle's chord is the rectangle |
| F3 | ONE pitch → height scale for all the side columns (the green horizontal everywhere) | the cube's columns are single ±45° facets |
| F5 | the checks within what the frame leaves, the solve's first iteration reserved, a check that does not fit resumed next frame | ⚠ changes `Scene_1` (fixes its overruns): only the stuck verdict's / the red quads' timing, by a frame or two |

## 7. ✅ AS BUILT (2026-11-12, `1.0.125-Debug_scene_0`) — ✅✅ closed by the owner's look with §8 (2026-11-13, `de789f6`)

⭐⭐⭐ **`Scene_1` unchanged, proven**: its face map from the cube's real faces (`tests/fixtures/scene_1_cube_faces.json`) is `12dc4b6`'s **bit for bit** —
place, blended place, band, facet, chord, the angles read back, the columns — over 5 568 points every 3.75° (worst difference 0), kept as a vector on
an 11.25° grid (`tests/fixtures/scene_1_cube_map_grid.json`).

| | where | what |
|---|---|---|
| F1 | `face_map.ts` `chordAt`, `Facet.tb` / `rect`; `mapTarget`, `mapAngles`, `castPoint`, `capSpan` | a facet's polygon in its frame; one not a rectangle placed on its CHORD at the place's height (§2 (a): the green edge to edge, the red the same share); the cap's rim from that chord. ⚠ A vertex within 1e-9 of the height is on it (an exact `===` made the top chord one corner — an 87 mm jump, found by the vectors) |
| F2a | `capCentre` | the cap polygon's area centroid (a ridge's degenerate cap: its points' middle); the old point kept when they agree within 1e-9 |
| F2b | `buildFaceMap` (`RIDGE_TIE_DEG` 1°), `holdsPole`, `tiltOn` | two facets beyond 45° tied within 1°, facing apart: a virtual cap, the side band to ±90°; a side facet beyond 45° holds the pole (the tilt from it) |
| F2c | `tiltHeading` (`orbit_tilt.ts`, `TILT_SLANT_MIN`) | a slanted face holding a pole tilted toward its own snapped heading; a level one the orbit's, as before |
| F3 | `buildFaceMap` (the bounds by height), `FaceMap.levels`, `levelHeight` / `levelPitch` | one pitch → height scale (±45° under a cap, ±90° at a ridge); a column's bounds at its facets' edges' heights; where any column has an inner bound, the side place read on the height scale — the edge stretch at every level all round (⛔ per facet: the green 1.6 mm off level) |
| F4 | `OrbitController.takeBeyond`, `poleBeyondPitch`, `assemblyFrame` | the elevation asked past a ring's limit kept; at the pole it moves the map's pitch (held within ±90°) |
| F5 | `FIRST_ITERATION_MAX_QUERIES` (12), `orbitFrame`, `queriesLeft`, `pieceStuckFrame`, `restAlignFrame`, `hoverQueryBudget`, `orient_cube` | ONE LEDGER A FRAME: reset before the solve (its whole cap — its first iteration fits); every check charged to its own frame within what is left, strictly (the stuck check undecided past it — asked again; the turn checks' sweep budgeted; the rest-alignment turn waits a frame); the relocation leaves the solve its 12; the way back and the slide's solves only with 12 left. ⚠ A tap's turn check (`pieceTurnBlocker`, at an align / a roll) stays unbudgeted: an event, not a frame's work |

**Vectors**: `tests/orbit_any_shape.test.ts` (15 — the cube's grid; the heptagon: the ridge, the rope on the surface, the chord, the green level, no
jump, the round trip; the off-centre cap; the pole's leftover; the tilt's wiring; the budget — RED on `12dc4b6`'s sources but the cube's grid and the
no-jump bound); updated with their reasons: `facets.test.ts` (the horizontal hexagonal prism's bounds by height, its parting gone at its root),
`orbit_tilt.test.ts` (the vertex-up hexagon is a ridge), `calm_slanted.test.ts` (that face's middle at 20 – 25° now), four source pins (the ledger).
The probes: every Chrome-launching probe without disk litter (the trial branch's fix brought here); `walk_probe.mjs` records the camera's axes, the
piece's turn, the sections' points, the parts' planes, the frame's queries; `walk_rules.mjs` (R1 – R8), `walk_rope.mjs` (the tight rope),
`walk_scenarios_any_shape.json`, `walk_scenarios_contact.json`.

## 8. ✅ THE DY HOLD AFTER A POLE-HOLDING FACE'S FAR EDGE (2026-11-12) — ✅✅ closed by the owner's look (2026-11-13, `de789f6`)

> *"just give an hysteresis of the dy: the dy upwards is blocked until a certain band is reached in the face beyond but dx and dy downwards are allowed
> (the reverse for dy if the pole-holding edge was at the nadir). This will also be OK in case of the cube of scene 1 (there is the same issue when a dy
> crosses the pole-holding face's far edge)."* — the owner

**Why**: the heptagon's walks on the fixed code (`hepF1`, against `hep1`): the rope 11 536 → 0 runs off the surface, the green not a plane 12.7 → 2.9, the
gizmo's leaps 159 → 12, the lines' map jumps 4 803 → 444, blocked 28 → 17, the top faces' tilts upside down 17 of 22 → 0 of 388 — but the piece's
back-and-forths 11 → 60: on the front top face (tilted toward the front) dy up crossed the ridge; the back top face, tilted toward ITS heading (F2c),
turned the camera round, and the finger still pushing up went straight back over the ridge.
**The rule** (`edgeHoldAt`, `edgeHoldDepth`, `edgeHoldDy` in `input/orbit_tilt.ts`): leaving a tilted face over the edge AWAY from the tilt's heading
(`asmTilt.heading` — the face beyond faces away from the camera, the roll back turns it round: the cube's far edges, the heptagon's ridge, the nadir's far
edge; never a near or a side edge), the dy sign that crossed (the finger's last, `asmDySign`) is HELD until the gizmo is `edgeHoldMm` (30 mm, a slider in
☰ → CAMERA → CAMERA ORBIT AROUND CENTER — a guess) deep in the face beyond, SQUARE to the edge (a dx along the edge does not release it); dx and the
other dy free; the coast stopped at the crossing; released too when the assembly's orbit is off. ⭐ `Scene_1` too, by the owner's choice.
⚠ What is left upside down: a few frames on the roll back after the BOTTOM face's far edge (that tilt's heading the camera's — a level face) — the
far-edge roll back accepted on the cube (`POLAR_ORBIT_CLEANUP.md` §9.16), more often met on the heptagon's lower faces.
**Vectors**: `orbit_any_shape.test.ts` (+3: set only over a far edge, the sign held and the depth square to the edge, the wiring); two source pins.
**1792** with `Scene_0bis` merged.
**The after-walks** (2026-11-13, `hepH1` / `hepH2` / `s1H1` / `s1H2`, against `hepF1` / `hepF2` and `s1ref` / `s1ref2`): the heptagon's close-in
back-and-forths — piece 86 → 3, gizmo 88 → 1, camera 67 → 1; the rope 0 runs off the surface still; the green not a plane 1.1 – 1.5 per 1 000 frames;
the top faces' tilts 0 upside down of 31; `Scene_1` at contact: blocked 41 → 46 frames (the same). The long BLOCKED runs (to 486 frames) are the walk's
finger pushing the held sign — by design; the other sign took the gizmo down the face beyond and released the hold.
⚠ Not readable from these runs, ⛔ open: they ran beside another session's walks, the frames 2 – 5 × longer (`ts`), so every per-frame-step count (the
jumps, ×2 on both scenes) is not comparable; and the RED section's not-a-plane count on the heptagon far out, 7.1 → 29.4 per 1 000 frames (≈ 35 at
contact before the hold already) — to re-walk on an idle machine before it is read as a defect. The far walks stopped at 4 of 9 scenarios (the
watchdog), the tilt probe gave nothing.
✅✅ **The owner (2026-11-13, on the device, `de789f6` — F1 – F5 and this hold): *"the behavior is tested and is ok for me"*.**

## 9. ✅ THE CAMERA'S ROLL AT THE ZENITH (2026-11-13, `1.0.125-Debug_scene_0`, live `a0ec9bc`) — ✅✅ the owner: *"this is good"*

> *"polar orbit far out: the sections are ok. however there is only one defect: when the gizmo reach the zenith edge, there is a camera roll when the
> gizmo is stopped at the zenith. This happens at all the distances in polar orbit mode"* → *"if I hit the zenith edge at zero camera yaw there is almost
> no roll … with camera yaw towards the left, there is a roll towards the left … the more the camera yaw when the gizmo hit the zenith edge the more the
> camera roll at the hit"* — the owner (⚠ my first reading, a dx spinning the view at the pole, was wrong: the roll is a dy's, at the hit).

**Root cause**: the calm holds the camera nearer square to the face than the orbit's yaw; the world camera's heading was `calmHeading` of the SHOWN
direction, and toward the pole that direction gave the withheld yaw back — the calm faded (`poleWeight`, 60° … 85° of pitch) and, straight up, no heading
at all (the guard: the bare yaw; `ORBIT_PITCH_MAX_RAD` is exactly 90°). A dy alone rolled a camera looking down by (1 − sH) × the yaw's angle off the face,
toward the yaw's side. Probed (`zen_left` / `zen_mid` / `zen_right`, 21° off the front): 14 – 19° on both scenes; on `Scene_1`'s cube over the last 25° of
pitch, on the heptagon in ONE frame (18.6°) where the ridge's vertical share went whole. In `12dc4b6` too — not a regression of the any-shape fixes.
**The rule** (`input/orbit_calm.ts`):
* **the heading read LEVEL** (`calmLevelHeading`): the calm's horizontal share (made whole by `asmCalmWhole` as `calmDir` does) times the yaw's angle off the
  face's OWN heading (its normal's level part; whole behind the face) — independent of the pitch; on a vertical face exactly `calmHeading`'s below the fade;
* **the camera's heading** (`cameraHeading`): the shown direction's own below 50° of the orbit's pitch (unchanged), the level reading from 60°, a smoothstep
  between;
* **its offset HELD while the view looks down** (`heldOffsetStep`, stepped once a frame in `calmFrame` — `asmHeadO`, `asmHeadW`, `asmHeadYaw`): whole at
  ≤ 60° (`poleWeight` 1); a dy alone climbing keeps it (no roll at the hit); a dx looking down relaxes it toward NONE — the old zenith heading — by at most
  `HELD_OFFSET_PER_YAW` (0.5) of the yaw turned (the view spinning at 0.5 – 1.5 × its pace meanwhile); coming down closes the gap by the share of the way
  to 60° just made — by the pitch, never by time; cleared under the tilted pole and with the assembly's orbit off (the slide's lock too, before `1.0.126-Slide_removal` was merged — no lock since);
* the tilted pole's exit target (`hW`) through the same `cameraHeading`, with the calm the world's branch has right after the exit.
**Rejected on the way** (each probed on `Scene_1`'s cube against the old code, three short scenarios — a dx at the zenith, the same at the nadir, a close-in
exit over the top's far edge): the level reading at the pole as is — a dx spun the view at 0.25 × mid-face and caught up at the corners, 8.3° in a frame
(the old even spin 3.0°); the offset held whole through a dx — the whole difference rolled on the way down, 22° against the old 6°; relaxed toward the side's
reading — a corner's reading changing late, 20° left for the way down.
**Measured as built**: the hit's roll 14 – 19° → ≈ 2° on both scenes (≈ 2° is there square to the face, old and new — not the calm); the heptagon's largest
frame 18.6° → 0.6°; the cube: leaving the zenith after a dx as the old code at that yaw, the nadir −5.4° against −6.3°, the tilted pole's exit 378° of roll in
sum both; a dx at the zenith after an off-square arrival, the largest frame 3.7° against 3.0° (the relaxation).
**Vectors**: `tests/zenith_roll.test.ts` (7 — the old composition kept beside the new: its 0.75 × yaw roll, left and right); five source pins
(`assembly_orbit`, `orbit_calm`, `orbit_tilt` ×2, `orbit_any_shape`'s F4 early return). The walk probe records the calm (`cm`, `cw`). **1799**. ✅✅ the
owner's look (*"this is good"*).
