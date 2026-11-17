# The camera's circle at the bottom face — the regression of package A (2026-11-17)

✅✅ **DECIDED (the owner, 2026-11-17: *"Revert and then deploy"*): PACKAGE A IS REVERTED, `6e56dfc`** — §9. What follows is the analysis as it was put to him (written before his decision: "nothing built, the owner to decide"). Two Opus agents: one analysed the owner's report, a second tried to refute it and ran its
own checks. Every figure here is headless (60 frames a second, a dy of 3 px a frame). ⛔ No device look.

The dossier's entry: [`RND5.md`](../../00_CORE/queue_notes/RND5.md). Package A itself: [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) §18.

## 1. The deploy and the owner's look

* **The deploy, 2026-11-17** (the owner: *"Deploy so i can test and tell me what to look at."*): live `main` `a17c75e` = branch `1.0.147-` at `a1a52f0`
  (package A, both commits `fe06c2c` and `c53f54a`; C5, C2W, step 2.5 before it). R1 (`1038a29`) is not in it: built after, reverted (`21e600d`).
* **The owner's look on that build, verbatim:**
  * *"1 and 5-there is now a regression: in scene 0 at close in, when I dy downwards and enter the bottom face from any previous face (rectangle or
    heptagon face), the camera makes a circle movement before the gizmo enters the face. For scene 0bis the same happens at dy exit of the bottom face
    towards any face at any distance. For the scene 1, the same happens at close in and is even more evident. Analyze the logic root cause, do not patch.
    I may even revert the change in the branch if the logic is flawed."*
  * *"3- scene 0bis top ridge: the movements at the crossing of the top ridge is good and I want to keep it. Just make it 50% faster."*
  * *"4- nothing feels blocked. This is good"* — his look on C5's hold.
* **The night chain was stopped before step 3.** Step 3 (the charts' step 3) is not run.

## 2. What was measured — the reproduction

The walk: close in, a dy down the front of the body onto the bottom face (and, on `Scene_0bis`, back out of it). For each camera move: its **path**
(the sum of the picture's turns frame by frame) against the **straight angle** from its start to its end, and how far the look leaves the great
circle between the two ("off its arc"). A straight turn has path = straight angle and about 0° off its arc.

| walk (close in, approach 0.651) | `c5aa295` (before A) | `fe06c2c` (A's first commit) |
|---|---|---|
| `Scene_0`, the lower front face to the bottom | 52.1° path for 52.1°, 0.3° off, 9 frames | **72.4° for 52.1°, 19.3° off**, 19 frames |
| `Scene_1`, the front face to the bottom | 90.0° for 90.0°, 1.0° off, 15 frames | **124.0° for 89.9°, 32.7° off**, 31 frames |
| `Scene_0bis`, onto the bottom | 52.1° for 52.1°, 0.3° off, 9 frames | **70.2° for 52.1°, 18.3° off**, 19 frames |
| `Scene_0bis`, out of the bottom to the lower front | 52.1° for 52.1°, 0.3° off, 9 frames | **55.4° for 52.0°, 7.9° off**, 18 frames |

* **The first bad commit is `fe06c2c`** (package A's first commit), on all three scenes; its parent `c5aa295` is clean. The first agent found the same
  figures at `c7ac510` (the last build the owner judged good) and at HEAD (`c53f54a`'s code: only the largest one-frame step changes). The second agent
  re-ran `c5aa295` and `fe06c2c` and got the same figures to the tenth of a degree. `package-lock.json` is the same at every commit.
* **What the eye sees.** `Scene_1`, A: while the camera pitches from level to under the body (its height round the gizmo 7° → −86°), it also swings
  sideways round the gizmo (−88° → −34°, then back to −48°); the look direction swings sideways 93° → 166° → 141°. Before A the camera stayed in the
  vertical plane (−88° all the way down). That sideways swing and its return is the "circle".
* **Before the gizmo enters.** `Scene_0` and `Scene_1`: the gizmo stops at the edge of the bottom face and moves 0 mm while the turn runs; it goes onto
  the bottom 2 frames after the turn ends — the owner's *"before the gizmo enters the face"*. `Scene_0bis`'s exit: the gizmo steps just over the edge
  (about 30 mm, 2 frames), then is held there while the turn runs.
* **Where it does not happen.** Far out on `Scene_0` and `Scene_1` (no tilt, no timed turn: the camera follows the drag, path = straight angle, 146°
  and 151°). `Scene_0`'s top is a ridge (no tilt). The 180° half turns (the tilt's exits) are not worse than before.
* **Also touched, not reported:** `Scene_1`'s top entry close in (71.6° for 61.3°, 15.3° off; before A 0.4° off); the `Scene_0` entry from the +x
  end face (342.9° of path for a 90° turn, 33.1° off: the picture rolls about a whole turn; before A 90.0°, 1.0° off).

## 3. The cause

1. **The trigger.** The gizmo reaches the edge of a face with a pole (`Scene_0`, `Scene_1`: the automatic tilt) or a spit's level face (`Scene_0bis`:
   the free face). The frame changes at once and ONE timed camera turn starts (`asmZoneMix`). The square camera's target becomes the new face's normal,
   52° to 90° away.
2. **Before A.** The turn carried only a few degrees (the square camera still at its old normal: 6° to 12° measured on `Scene_1`, done in 2 frames).
   The big pitch was then made by the square camera's own turn (`squareTurn`), one rotation of the normal about the edge at 6° a frame: a straight
   pitch in the vertical plane.
3. **Package A** (`squareFrame` in `src/render/assembly_wiring.ts`): while a turn runs, the square camera stands at its target at once —
   `if (sq.target !== null) sq.n = sq.target;`. So the turn's end pose now carries the WHOLE 52° to 90° pitch.
4. **What draws it.** The turn is drawn by the two-target framing (`poseFramingTwo`, rule 1 in `zoneMixPose`) whenever that is not degenerate; by
   one rotation about the piece (`poseAboutPiece`, rule 2) otherwise. `poseFramingTwo` was built for zone switches and the spit's half turns, far out:
   it keeps the piece and the aim on the glass by moving their places on the glass in straight lines and blending two angles linearly. It is not one
   rotation. Close in the camera lies a few degrees off the line from the piece to the aim, and that line itself turns by most of the pitch during the
   turn: the blended angles walk the camera sideways round the body while it pitches.
5. **Why the wait is longer.** A reads the piece direction's ease after the view is set and runs the turn's clock over turn + ease. Close in the piece
   sits on the camera's axis, so the two are one motion on the glass, counted twice: `Scene_1` 31 frames instead of 15, `Scene_0` 19 instead of 9;
   the gizmo is held for all of it. This makes the circle last longer; it does not make its shape.

## 4. The challenge — what the second agent confirmed, and how

* **The flip, re-run:** confirmed (the table above), on all three scenes close in.
* **A discriminating run** (the throwaway worktree, at `c53f54a`'s code, nothing committed, undone): ONLY the one block of A that sets the square
  camera at its target inside a running turn switched off; everything else of A kept (the ease read, the share cap, the holds, the clock). If the cause
  were the clock, the ease or the hold, the circle would stay. ⭐ It went: `Scene_0` 52.5° for 52.1° (0.7° off), `Scene_1` 92.6° for 90.0° (3.2° off),
  `Scene_0bis` in 52.2° for 52.1°, out 52.2° for 52.2° (0.4° off and less). ⚠ And W11 came back: 8.2°, 7.8°, 8.7°, 9.1° in one frame (two clocks
  again). The first agent's own counterfactual (rule 2 forced, the jump kept) also straightened every one of these turns.
* **A prediction where it should NOT happen**, checked: on `Scene_0bis` at approach 0.452 the same 52° exit turn (the same angle, 0.910 rad) is drawn by
  rule 2 (the piece and the aim on one ray): straight, 52.1° for 52.1°, 0.3° off — at A's code. At 0.651 the same turn is drawn by rule 1: 7.9° off.
  The rule that draws the turn decides the shape.
* **Not confirmed — `Scene_0bis` "at any distance".** Far out (approach 1.0 and 0.719) the exit of the bottom is straight on every walk tried (toward
  the front 48.7° for 48.7°, toward the back a half turn as before A); far out the free face's turn there is only 4 frames long. Close in (0.58 – 0.65)
  it is reproduced. ⛔ What the owner's far-out walk was is not known: to ask him, or to look at on the phone.
* **A nuance:** the owner reports `Scene_0bis` at the EXIT only, but its ENTRY close in is as bent (18.3° off). On `Scene_0bis` the gizmo crosses first
  and is held just past the edge during the circle; on `Scene_0` and `Scene_1` it is held at the edge.

## 5. The verdict

**Sound in principle, with a case it missed.** A's idea — one transition, one clock, the picture never over the one speed — holds, and its own
measures hold (the largest one-frame step 6.0°). Its missed case: setting the square camera at its target inside the turn hands a big pitch
(52° – 90°) to a drawing (`poseFramingTwo`) that was only ever asked for a few degrees there, and whose path is not one rotation close in. No slider
changes that path's shape (the speed changes only its pace). A's gates measured the speed of each frame, not the path's shape: that is why they passed.
A second, separate fault: the ease counted twice close in (every close-in turn about twice as long, the gizmo held as long).

## 6. The options (nothing built)

1. **Revert A** (`git revert c53f54a fe06c2c`). Gives back `c5aa295`'s straight turns and short holds exactly. Costs: W11 comes back (two clocks: 6.7°
   to 8.9° in one frame at the tilts, the ridge, the spit); c53f54a's cap goes (6.66° a frame at the free face's exit); ⛔ **and the top ridge the owner
   has just called good changes** (back to up to 8.2° a frame across it close in, 9.98° from a tip) — against his *"I want to keep it"*.
2. **Keep A; draw the merged turn as ONE rotation about the piece where the framing is thin** (close in), the two-target framing kept for half turns
   and far out. The first agent's counterfactual: every cap turn straight. Costs: a selection rule — a measured condition, not a special face — new
   vectors, every gate re-run. Risk: rule 2 bends the 180° half turns (21° – 29° off), so they must keep rule 1.
3. **Keep A's one clock, but draw the pitch as before:** the square camera's own one-rotation turn driven by the transition's share, not set at once.
   The second agent's run shows the shape comes back straight, but that run (the old own clock) also brings W11 back (up to 9.1° a frame): the square's
   turn must be paced by the ONE clock, not left on its own. Costs: rework of `squareFrame` inside a turn and of where the ease is read; it touches
   every close-in change of frame (tilt, ridge, spit, zones) — looks the owner has accepted; full gates.
4. **Count the ease once** (only where it adds on the glass). Gives turns about twice as fast close in, holds half as long. Not a fix for the circle
   on its own. The first agent's crude try ran away on `Scene_1`: the clock leans on the ease term.
5. **Keep as is.** The circles stay at every cap entry close in, and the long holds.
6. ⭐ (added by the second agent) **Make the two-target framing itself one rotation when its two angles turn together** — fix the drawing instead of
   choosing between drawings. It would serve every turn that rule 1 draws, but it changes the zone switches' and the spit's turns, which the owner
   has looked at: the largest risk and the most gates.

Options 2 or 3, with 4, keep what A gained and the ridge the owner likes. Option 1 is the fast, known state, at the ridge's cost.

## 7. The top ridge's pace — measured; the request NOT built

`Scene_0bis`, `ridge_check.mjs` at A's code (frames with the turn running):

| crossing | before A (`c5aa295` = `c7ac510`) | A (the tested build) |
|---|---|---|
| across, far out, from side +1 | 30 frames, 181.2°, 6.04° a frame, max 7.05 | **32 frames, 186.2°, 5.82, max 6.00** (re-run by the second agent: the same) |
| across, far out, from side −1 | 30 frames, 181.2°, 6.04, max 7.10 | 32 frames, 186.0°, 5.81, max 6.00 |
| across, close in, side +1 | 30 frames, 187.7°, 6.26, max 8.23 | **35 frames, 182.2°, 5.21, max 5.93** (re-run: the same) |
| across, close in, side −1 | 30 frames, 187.0°, 6.23, max 8.06 | 35 frames, 182.3°, 5.21, max 5.68 |
| from the −x tip, far out | 13 frames, 76.1°, 5.85, max 7.65 | 15 frames, 82.0°, 5.47, max 6.00 |
| from the +x tip, close in | 16 frames, 102.1°, 6.38, max 9.98 | 26 frames, 103.7°, 3.99, max 6.10 |

* **What paces it:** the one speed `tiltRollDegS`, 360°/s = 6° a frame (the menu's *tilted pole: every tilt's speed*), over the turn's whole = turn +
  ease. Close in the ease inflates the whole (from the tip 93.1° + 52.4°; across 180° + 22.6°).
* **50 % faster** = two thirds of the time: about 21 frames far out, 23 close in, 17 from the +x tip. ⚠ The speed is shared by every timed turn (tilts,
  the free face, zones, the square camera, the way out, the relocations): the slider at 540°/s makes ALL of them 50 % faster. Only the ridge needs its
  own speed for the spit's crossing turn — ⚠ and that relaxes A's "never over the one speed" for that turn (9° a frame): the owner's call. Counting the
  ease once (option 4) alone would take the close-in tip crossing from 26 to about 18 frames.

## 8. Not checked

No device look; one finger speed; `Scene_2`; the commits between `c7ac510` and `c5aa295` one by one (both clean, the same figures); the full gates.
The probes (not in the repo — absolute paths): `C:/Users/sugit/AppData/Local/Temp/claude/58fcf8122906abb9/b2290347-4989-4dda-a6ab-49506e5270d4/scratchpad/regress_bottom/`
(`bottom_walk.mjs`, `bw_batch.sh`, `bw_turns.mjs`, `my_frames.mjs`; the recordings in `out/` and `out2/`). A scratch folder: it may be cleared.

## 9. The owner's decision, and what is open (2026-11-17)

* **The decision**: option 1 of §6 was recommended to him (it restores exactly a state he approved on the phone; what A protects — never over 6° a
  frame — is not what he asks for: he asks for the ridge 50 % faster, about 9° a frame). His word: *"Revert and then deploy"*.
* **The revert**: `6e56dfc` (one commit undoing `c53f54a` and `fe06c2c`). `src` and `tests` are byte-equal to `c5aa295` again (`git diff c5aa295 -- src
  tests` is empty); `npm run verify`: 164 files, **2058 vectors**. The probes' options A added (`WORSTF`, `TURNONLY`, `TRACE`) went with it;
  `mid_check`'s mended setup (`c67bb67`) stays. W11 (the two clocks in one transition, `TILTED_POLE_CLOSE_IN.md` §12) stands as before A: measured, not
  reported by the owner.
* **The deploy** (the same word of his): live `main` `6c0a165` = branch `1.0.147-` at `3de1256` (pushed), served 2026-11-17 06:33Z. ⛔ His look on it is owed.
* **His correction on `Scene_0bis`, verbatim** (after the analysis, before the revert): *"Sorry: this is exit or enter from or into the bottom face with dx
  or with dy in scene 0bis at all distance: this creates a shake of the camera at the entrance or exit"*. ⛔ NOT ANALYSED: the two agents walked dy
  only, and found nothing far out. A check (dx and dy, every distance, before and after A, against `c7ac510`) was started and stopped for the revert:
  first his look on the reverted build — if the shake is still there, it is not package A's and the check is run against that build.
* **The top ridge 50 % faster (§7)**: not built. Put to him, not answered yet: (a) a speed of its own for the half turns at a crossing, with a
  slider (recommended), or (b) every turn 50 % faster by the existing setting. After the revert the ridge is the one of `c7ac510` again (30 frames
  across; 13 – 16 from a tip).
* **The order agreed with him** (*"Agreed"*): the change and its own check → the deploy on his word and his look → step 3 ONCE on the final code
  (the whole rebuild audited, safe clean-ups, the docs in final form) → the merge into the main folder.

## 10. Why the heptagon's bottom face shakes — AN EXPLANATION, NOTHING BUILT (2026-11-17, an Opus agent, on HEAD `86ae4e8` = live `6c0a165`)

**The owner, verbatim (on the phone, build `6c0a165`):** *"This is good and if nothing else needs to be built I will keep like that, except one thing I
want to understand: Scene_0bis: Enter and leave the bottom face by dx and by dy, from any previous face at every distance: the camera view aligns the
screen vertical with the world axis quickly at the crossing of the edge. This gives the feel of a shake. Scene 0 at close in: enter the bottom face from
dy on a rectangle face at a calm (ie the gizmo close to one right or left edge): the camera view rolls when dy goes down (probably due to tge calm) and
the quikly realigns when the gizmo enters the bottom face and the tilted-pole orbit takes over. This gives the feeling of a shake as well. The same does
not happen in scene 0 enter/exit from/to the heptagon at close in, nor does it happen in scene 1 to/from the bottom face at any calm. Why the bottom
face of the heptagon is different?"*

### 10.1 The answer in five sentences

1. The heptagon's bottom is the only level face in these scenes reached from faces that LEAN (51° from it). A cube's bottom and the heptagon's end
   faces are reached from vertical faces.
2. Two camera rules choose the "heading" (which way is up on the glass) differently, by 28° to 50°. On `Scene_0` close in: the calm's heading near the
   bottom edge against the face's own. On `Scene_0bis` far out: the camera's own heading against the heading carried onto the free face.
3. A camera square to a VERTICAL face looks level. For a level look every heading gives the same picture, so the difference does not show.
4. A camera square to the LEANING face looks up 38°. There a heading difference IS a roll of the picture, and the turn at the edge takes it back in
   2 to 9 frames: the shake.
5. It shows only near an END of the face: only there does the calm (or the camera's line of sight) leave the face's own heading. In the middle the two
   agree.

### 10.2 What was measured (headless, 60 frames a second, a slow dy of 1 px a frame)

"The roll" = the angle on the glass between the screen's vertical and the world's vertical (meaningful while the view is not near vertical). A "turn" =
how much the picture turns about the look in a frame. The calm share = how much of the orbit's yaw the picture shows (1 = all of it, 0.25 = a quarter).

| case | before the edge | at the edge |
|---|---|---|
| `Scene_0` close in, lower front face, gizmo near the +x end (x = 202 of ±245 mm; calm share 0.77) | roll −1.9° → **+8.9° in 4 frames**, as the camera's pitch passes 50° – 56° (frames −16 … −12) | the tilt made at −11; the picture rolls back **5.6°, 3.2°, 1.6°, 0.9°** (frames −10 … −7); then the square camera pitches 6° a frame |
| the same, gizmo in the middle (x = −17; share 0.25) | −1.9° all the way | no roll (0.26° a frame: the pitch's own) |
| the same near the end with a fast dy (3 px a frame) | no roll: the tilt fires before the camera's pitch reaches 50° | — |
| `Scene_0`, the +x end face (vertical) down to the bottom | 0.0° | 0.3° a frame (the pitch only) |
| `Scene_1` close in, front face near the +x end (x = 198; share 0.73) | 0.0° | 0.2° – 0.3° a frame |
| `Scene_0bis` far out, middle (x = 3) | −2° … −4° | no turn at the entry (0.2° a frame) |
| `Scene_0bis` far out, near the +x end (x = 191; share 0.7) | −3° (upright); the body's axis 57° off the screen's vertical | **one turn of 47° in 9 frames** (5.9° a frame), the gizmo held: the world's vertical ends 50° off the screen's vertical, the body's axis across the glass (100°) |
| the same, out again over the entry edge (a dy up) | −50° | **one turn of 39° in 7 frames**: upright again (−3°) |
| `Scene_0bis` close in, near the +x end (x = 186) | −1.9° | in 0.8°, out −2.3° in all: no turn |
| `Scene_0bis` far out, a dx out over the +x end onto the tip's triangle | −78° | **78° in 14 frames** (the side exit's quarter turn, 6° a frame) |
| the same close in | −63° | **68° in 16 frames**, three frames of 9.1° – 9.6° |

* **"The world axis" the view aligns to on `Scene_0bis`** is the heading carried in, (0, 0, −1): across the body, toward the long edge the gizmo came
  over. After the entry turn the body's axis lies across the glass and the world's vertical no longer points up the glass (50° off). It is not the world's
  vertical, nor the spit's axis.
* **`c7ac510`** (the build the owner approved on 2026-11-16, before C5, C2W, step 2.5): the `Scene_0` near-end walk and the `Scene_0bis` far-out entry
  and exit give the SAME figures frame for frame (+8.9°, then 5.56°, 3.15° …; 46.8° in, 39.9° out). Nothing since changed it.

### 10.3 The logic, with file and line

**(a) `Scene_0`: what rolls the picture on the way down a leaning face near its end.**

* Close in the square camera shows the piece along the FACE'S NORMAL, whatever the orbit's yaw: `calmDir` mixes in `sq.n` with the share `sq.q` = 1
  (`src/render/assembly_wiring.ts` 420 – 425; target and share in `squareFrame`, 448 – 458).
* The world camera's heading is `cameraHeading(…, levelHeadingOf(…))` (`assembly_wiring.ts` 1527; `src/input/orbit_calm.ts` 205). Below 50° of the
  camera's pitch it is the shown direction's own heading (`calmHeading`, 146): upright. From 50° to 60° (`LEVEL_HEADING_BLEND_RAD`,
  `LEVEL_HEADING_FROM_RAD`, 196 – 198) it blends to the "level reading" (`calmLevelHeading`, 162; held by `heldOffsetStep` in `calmFrame`,
  `assembly_wiring.ts` 494 – 500). That is the owner's zenith-roll fix (2026-11-13, [`ORBIT_ANY_SHAPE.md`](ORBIT_ANY_SHAPE.md) §9: *"this is good"*).
* The level reading assumes the picture is the CALM's: heading = yaw + (share − 1) × (the yaw's angle off the face). The square camera shows the face's
  own heading instead. The gap is share × that angle: near the end 0.77 × 37° ≈ 28° (measured: yaw −53°, face −90°, level reading −62°).
* `offsetFrame` (`src/input/assembly_orbit.ts` 233) turns a heading into an up vector weighted by the sine of the view's elevation. Square to the lower
  face the view looks up 38°: a 28° gap is a ~12° roll (10.8° measured, the blend not yet whole). Square to a vertical face the view is level: the same
  gap gives 0°. That is why `Scene_1` and the heptagon's end faces show nothing.
* The camera follows the orbit with a lag; the roll needs the camera's pitch past 50° before the tilt fires. A slow dy shows it, a fast one does not.

**(b) `Scene_0`: what realigns it at the bottom's edge, and how fast.**

* At the edge the automatic tilt is made (`tiltOn`, `assembly_wiring.ts` 1673). The bottom is a free face, so its heading is the one carried in by the
  entry edge (C2W: `freeEntry`, 1694; `capTiltHeading(…, along)`, 1695; `src/input/orbit_charts.ts` 533). Over the lower front face that is the face's
  up unfolded: the picture as it was BEFORE the roll.
* Under the tilt the camera is upright in the tilted frame (`assembly_wiring.ts` 1512 – 1518): the level reading is no longer read. The difference is
  carried by ONE camera turn from the pose shown (`seamTurnStart`, 1752) at the one speed `tiltRollDegS` = 360°/s, its share = angle done / whole
  (`zoneStep`, 2029 – 2036). The roll is ~11°: two to four frames.

**(c) `Scene_0bis`: the entry and the exit far out.**

* On the spit's bound faces the heading is `spitCameraHeading` (`src/input/polar_zone.ts` 213; `assembly_wiring.ts` 1506 – 1507): below 60° of view
  pitch the shown direction's own heading — upright against the world's vertical.
* On the free face the camera's up IS the carried heading (`assembly_wiring.ts` 1505; `freeHeadingAngle`, `src/input/free_face.ts` 338). Entered from a
  long side it lies across the body (`freeEntry` 2160 – 2166 → `entryHeading`; D-T2, [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) §3.4: *"the
  layout with the axis ACROSS the glass"*).
* Far out the camera is not square to the face (N2, the calm kept): near an end it looks partly ALONG the body (the calm shows 0.7 of the yaw), so its
  own heading differs from the carried one by 40° – 50°. At the entry `freeFaceFrame` starts one camera turn from the pose shown (2213 – 2214); at the
  exit `freeFaceExit` turns to the spit's upright camera (2228 – 2238); both at 360°/s, the gizmo held. Close in the square camera looks straight at the
  face, the two headings agree, and the turn is next to nothing.

### 10.4 By design or not

* **The rules are the owner's:** the calm (58d86ff, *"It shall stay"*); the zenith-roll level reading (`ORBIT_ANY_SHAPE.md` §9, *"this is good"*); the
  square camera close in (2026-11-10); the carried heading on a free face (D-T2 *"agreed"*, D-T7); a free face's exits by the edge (§3.3); one speed (T5).
* **The shake is a consequence nobody decided.** (a) The level reading was written for the world camera under the calm; nothing adapts it to the square
  camera, which shows the face's own heading. The gap shows only on a leaning face near an end, and no gate walks that slowly. (b) C4's brief says the
  entry turn is *"by the rule, next to nothing"*, and T7 *"no surprise at an entry"*. That holds when the camera is square to the face (close in, or the
  middle). Far out near an end it is a 47° turn; §9.1 of `TILTED_POLE_CLOSE_IN.md` measured the entry in the middle only. The dx exit onto a tip's
  triangle is a quarter turn, as decided (§3.4: *"a side exit: a quarter turn there"*).
* **Not new:** `c7ac510` gives the same figures.

### 10.5 What could change it (nothing built, no recommendation)

1. **`Scene_0`: the level reading with the square camera's share.** Close in, read the level heading as the square camera shows it (the face's own),
   so it agrees with the picture. Cost: it touches the owner-approved zenith fix; a close-in arrival at a top edge to re-measure; a pure function, vectors.
2. **`Scene_0`: no level reading while the square camera is whole.** The same effect by state, not by a formula. Cost: a second rule beside the zenith
   fix; the same re-checks.
3. **`Scene_0bis`: N1 (`freeFaceSquare` 1), already built behind a slider.** Far out too the camera goes square to the free face, so the carried
   heading is the picture's own (as close in: no turn). Cost: the orbit over that face becomes a pan; the owner judges on the device. Nothing to build.
4. **`Scene_0bis`: blend toward the carried heading before the edge** (by the finger's last millimetres, as the way in blends, T10). Cost: a camera
   change before the edge, against T4 (*"the edge is the only trigger"*); a band to add.
5. **A slower realignment** (a speed of its own for these small turns). Cost: the gizmo held longer (T5); *"one speed for every tilt"* relaxed.
6. **Keep as is.** The shake stays near the ends of the heptagon's leaning faces close in under a slow dy, and at `Scene_0bis`'s bottom far out near
   its ends.

### 10.6 Not checked

No device look. Two finger speeds (1 and 3 px a frame). `Scene_0bis` at medium distance. The dx ENTRY from a tip's triangle (the walk's dx back went
round the body: not reached). `Scene_0`'s exit from the bottom near an end. The probes (not in the repo — absolute paths):
`C:/Users/sugit/AppData/Local/Temp/claude/58fcf8122906abb9/b2290347-4989-4dda-a6ab-49506e5270d4/scratchpad/regress_bottom/why_bottom/` (`walk.mjs`,
`batch.sh`, `roll.mjs`; the recordings in `out/`). A scratch folder: it may be cleared.
