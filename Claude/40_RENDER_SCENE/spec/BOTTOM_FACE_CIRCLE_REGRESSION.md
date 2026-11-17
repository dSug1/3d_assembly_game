# The camera's circle at the bottom face — the regression of package A (2026-11-17)

⛔⛔ **AN ANALYSIS. NOTHING BUILT. THE OWNER TO DECIDE.** Two Opus agents: one analysed the owner's report, a second tried to refute it and ran its
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
