# Entering a level face — why the picture shakes there, and what would stop it (2026-11-17)

> **STATUS** · ✅ **APPROVED BY THE OWNER 2026-11-17** (*"Agreed to every recommendation. Proceed."*) — the build as briefed: §9; as built: after it; ⛔ **THE CHAIN STOPPED on his word 2026-11-17** (§13: (A) built and LIVE, (iv′) and the timing rule built then reverted, (v) stopped at its root cause §12); a fast orbit's turns merged: PROPOSED §14 — ✅ the owner's go the same night, the build → [`FAST_ORBIT.md`](FAST_ORBIT.md). A study with measurements (an Opus agent, 2026-11-17), on the code of
> `e252d0f` (= live `main` `6c0a165`). Every candidate was prototyped in a throwaway worktree and undone; nothing is committed under `src` or `tests`.
> **OWNS** · the entry and the exit of a level face (the bottom of `Scene_0` / `Scene_0bis`, any level top) and the timing of every camera turn ·
> **READ WITH** · [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) §1 – §3 (the rules T1 – T12, the carried heading),
> [`BOTTOM_FACE_CIRCLE_REGRESSION.md`](BOTTOM_FACE_CIRCLE_REGRESSION.md) §10 (the explanation run), [`ORBIT_ANY_SHAPE.md`](ORBIT_ANY_SHAPE.md) §9 (the
> zenith roll). The dossier: [`RND5.md`](../../00_CORE/queue_notes/RND5.md).

## 0. The owner's words (verbatim, 2026-11-17)

**What he saw** (on build `6c0a165`): *"Scene_0bis: Enter and leave the bottom face by dx and by dy, from any previous face at every distance: the camera
view aligns the screen vertical with the world axis quickly at the crossing of the edge. This gives the feel of a shake. Scene 0 at close in: enter the
bottom face from dy on a rectangle face at a calm (ie the gizmo close to one right or left edge): the camera view rolls when dy goes down (probably due
to tge calm) and the quikly realigns when the gizmo enters the bottom face and the tilted-pole orbit takes over. This gives the feeling of a shake as
well. The same does not happen in scene 0 enter/exit from/to the heptagon at close in, nor does it happen in scene 1 to/from the bottom face at any
calm."*

**His question, after the first explanation:** *"I am not satisfied with your explanation: why does this happen only on horizontal face and not on the
slanted rectangles in-between? What make those horizontal faces special (i guess the same would happen on top horizontal faces reached from slanted
faces). There is no impact of the calm at transition between two slanted rectangle faces. I want to keep this behavior for the transition from slanted
to horizontal, and keep one full camera realignment only when exiting from another edge (for example the far edge): is it possible, does it conflict
with other rules, is a patch or a rebuild required?"*

**His two further points (the acceptance criteria):** *"1. Scene 0 close in: while I agree on the fix, i assume this will also change scene 0bis close
in. Is the behavior of scene 0 close in different from scene 0bis close in? Will the fix in scene 0 introduce a regression in the scene 0bis? 2.i
believe the only acceptable solution is the one which minimizes camera realignment tilts when the user orbits around a corner at the intersection of
bottom face-slanted face - triangle: in the zone around such type or corner, the camera realignments are numerous and I don't want any fix to regress
somewhere else in particular in this zone. In any case, if a camera tilt is required to realign, it should be times so this does not look like a jitter
(check how this is done at other edges' crossings to not have another specific rule for that particular case). Advise."*

**His decision on the timing:** *"You can relax "one speed for every tilt" to "one rule for every tilt" and the timing rule you wrote above seems about
right as a first draft. . You can finalize the rule and implement it when we build the final two fixes."*

## 1. In one page

* **Why a level face** (§2): between two slanted faces both sides set "up on the glass" from the SAME thing, the world's vertical — so whatever the
  camera does, nothing is handed over at the edge. On a level face the world's vertical cannot set it (the camera may look straight along it), so the
  game sets "up" from ANOTHER thing, a direction lying in the face (the heading carried in). The two agree on the glass only when the camera looks
  square to the edge; when the camera leans along the edge (the calm near a face's end does exactly that), they differ by
  **atan(tan(lean) / sin(view's elevation))** — 47° at the bottom of `Scene_0bis` far out near an end. Paying that difference is the shake.
  ✅ His guess holds: a level TOP reached from slanted faces has the same geometry (the formula is the same, the view looking down instead of up).
* **(A) `Scene_0` close in** (§3): a leak — the camera's heading toward the pole was read from the CALM while the picture is the SQUARE camera's. The
  correction (one formula: the level reading takes the square camera's share) removes the roll before the edge (−11.1° → 0.0°) and the take-back at the
  edge (13.2° → 2.3°, the pitch's own). ✅ **`Scene_0bis` cannot be touched**: its whole body is a spit zone, whose camera returns before the line where
  the leak sits — its recorded play is identical in every frame with and without the correction. `Scene_1` identical too.
* **(B) `Scene_0bis` and the corner** (§4): measured on four candidates and today's build, far out, part way in, close in, loops round the corner of the
  bottom, a slanted rectangle and a tip's triangle. Today a loop pays TWO opposite timed turns (+25° to +32°, then −83°). ⭐ And close in a defect worse
  than the shake: at the side exit onto the tip's triangle the picture rolls **the long way round — 262° to 274°, up to 127° in ONE frame**, where one
  rotation of 105° would do.
* **The recommendation** (§6): (A) as prototyped; for (B) far out the candidate **(iv′) — near the edge it came in by, the free face shows the
  picture the slanted face would (upright continued); by the face's middle, its layout** (the entry silent at every place: 0° against 25° – 45°; a ccw
  corner loop ONE timed turn of 83° instead of two opposite ones; the cw loop 56° instead of 69°; an exit in the middle ~2°); close in **(v) — the turn
  drawn as one rotation about the piece** where today's drawing goes the long way (79° instead of 262° – 273°) — ⚠ (v) as prototyped (every close-in
  turn) made a fast dy's frame 12° in `tilt_check` (8.7° today): its condition must be narrowed before it is built; and **one rule for every tilt**
  (§5), because some turns under 30° remain. All three are corrections inside the existing design, each with what it bends stated.

## 2. Why a level face, and not the slanted faces in between

**What sets "up on the glass".** On every face that is not level the camera is UPRIGHT: up on the glass is the world's vertical as the camera sees it
(rule T6). On a level face that cannot work close in: the camera looks straight up (or down) along the vertical, and the vertical has no direction on the
glass. So on a level face (a FREE face) the game carries a direction lying IN the face — the heading — and up on the glass is that heading as the
camera sees it (the design of `TILTED_POLE_CLOSE_IN.md` §3: carry the heading across a free face, anchor it to gravity on every other face).

**Between two slanted faces** (`Scene_0bis`'s rectangles): both sides read the world's vertical. However the camera leans, it reads the same vector on
both sides of the edge, so up on the glass is continuous: nothing is handed over, the calm can turn the camera as it likes. **That is the behaviour the
owner wants kept.**

**Between a slanted face and a level one**: one side reads the vertical, the other the heading (level, square to the edge). Seen by a camera, two
different vectors point the same way on the glass only if the camera's line of sight lies in their common plane — here the plane square to the edge.
Leaning along the edge by an angle λ, at an elevation e (how steeply the camera looks up or down), the two differ on the glass by
**δ = atan(tan λ / sin e)**:

| the view's elevation e | λ = 10° | 20° | 30° | 40° | 50° |
|---|---|---|---|---|---|
| 38.6° (square to the heptagon's lower faces, close in) | 16° | 30° | 43° | 53° | 62° |
| 55° (`Scene_0bis`'s bottom far out, measured) | 12° | 24° | 35° | 46° | 55° |
| 63° | 11° | 22° | 33° | 43° | 53° |

* **Close in** the square camera pitches over the edge square to it (λ = 0): δ = 0 — no turn at the edge, *by construction*. What the owner saw on
  `Scene_0` close in is not this: it is a LEAK (A, §3).
* **Far out** (and part way in, before the close-in latch: measured at 0.736) the calm leans the camera toward a face's end: at x = 190 mm of ±245 the
  measured lean gives δ ≈ 45°. Paid at the edge as a timed turn: the shake.
* **In the middle of a face** the calm keeps the camera square (λ ≈ 0): nothing — as measured (0.3°).
* **Why not `Scene_1`**: its bottom is reached from VERTICAL faces, and far out its bottom is the polar orbit's (decision D-T3: no free face far out on
  gravity's caps) — no heading is handed over; close in, the square camera's view is level (e = 0): a heading gap is invisible there.
* **A level top** (his guess): the same formula, e the angle the camera looks DOWN. ✅ The leak (A) was measured on `Scene_0`'s top faces, which lean
  64° (the ridge's): coming down from them near an end close in, the picture rolls −13.1° in 20 frames before the edge (0.0° with the correction). A
  level top between slanted faces would also get (B)'s turn far out in a spit zone. ⚠ No scene has a level top between slanted faces; the formula and the
  ridge-face measurement are the evidence, not a walk on such a top (§8).

## 3. (A) `Scene_0` close in — the leak of the calm, corrected at its root

**The root.** Close in the square camera shows the piece along the face's normal, whatever the orbit's yaw. The camera's heading toward the pole (above
50° of the ORBIT's pitch) is the "level reading" of the zenith fix (`ORBIT_ANY_SHAPE.md` §9: `calmLevelHeading`, `cameraHeading` in
`src/input/orbit_calm.ts`), which assumes the picture is the CALM's: heading = yaw + (share − 1) × the yaw's angle off the face. The square camera shows
the face's own heading instead. The gap is the calm's share × that angle (28° near an end); on a leaning face (the view 38° off level) it is a roll.

**The correction (one formula).** The level reading takes the square camera's share: the calm's share multiplied by (1 − the square camera's share). With
the square camera whole, the level reading IS the face's own heading — the picture's. With the square camera absent (far out) the formula is unchanged to
the bit (multiplied by 1). Pure: `calmLevelHeading(yaw, calm, kH, squareShare)`; the wiring passes `st.asmSquare.q` at its two calls (`calmFrame`,
`levelHeadingOf`). ⛔ A first try (the blend toward the level reading read off the square camera's normal instead of the orbit's pitch) was rejected: it
moved `Scene_1`'s tilt exits (a 0.1 m step in the camera's place at frame 283 of a walk) — the level reading itself was the wrong quantity, not the blend.

**Measured** (headless, 60 frames a second, `Scene_0`, close in, a slow dy of 1 px a frame down the lower front face, then across the bottom):

| | today | with the correction |
|---|---|---|
| near the +x end (x = 199 mm): the roll in the 20 frames before the edge | **−11.1°** (3.3° a frame at most) | **0.0°** |
| the same: the picture's roll in the edge's turn (the view pitches 52° in 9 frames) | **13.2°** (5.6° a frame) | **2.3°** (0.3° a frame — the pitch's own) |
| the same: the picture after the far edge's half turn (off upright) | −12.3° | −1.9° |
| the middle (x = −17): before the edge / in the edge's turn | 0.4° / 1.9° | 0.0° / 2.3° |
| the top's faces (the ridge's, leaning 64°) near the end, down onto the side face: the roll before the edge | **−13.1°** | **0.0°** |

**Nothing else moved** — the gates, against `e252d0f` recorded the same way:
* the replays (`replay_probe.mjs`, the seeded 2 794 frames): **`Scene_0bis` identical in every frame**; `Scene_1` identical (1e-6: never; 11 frames
  differ in the last digit, the known noise); `Scene_0` identical to frame 1143 (drag 17, close in at 0.611), another play after — by design (the largest
  view turn in a frame 15.4° both, the largest roll 17.9° → 18.2°, frames with a roll over 10°: 48 → 50; the gizmo's and camera's steps as before);
* `tilt_check` (`Scene_1`: identical; `Scene_0`: the largest turn in a frame 8.8° both) and the ridge (`MODE=ridge`, `Scene_0` and `Scene_0bis`:
  identical, 8.5° and 8.1° at most, holds 2);
* far out the expression is bit-for-bit today's (the square camera's share is 0).

**His question 1 answered.** `Scene_0` and `Scene_0bis` close in are two different mechanisms. `Scene_0` is in GRAVITY's frame: its bottom is a cap,
close in the automatic tilt makes it a side (the tilted pole) and on the leaning faces the world camera reads the level heading — where the leak was.
`Scene_0bis`'s whole body is a SPIT zone (the camera held by the world, the orbit round its axis): its camera is built by the zone's branch
(`assemblyCameraFrameRaw`, the `baseFrame` branch: `freeHeadingAngle` on its free face, `spitCameraHeading` elsewhere), which returns BEFORE the line
reading the level heading, and the level reading is not even computed in a zone (`calmFrame` returns first). ✅ Confirmed by the replay: identical in
every frame. **The correction cannot regress `Scene_0bis`.**

**What it changes in the rule he approved on 2026-11-13** (*"this is good"* — the zenith roll removed): far out nothing (the polar orbit's camera is
the calm's, the level reading as before). Close in the camera's heading near the poles follows the face the camera is square to, not the calm it no
longer shows. In his words: the zenith fix stays where there is a calm; where the camera is square to a face, the picture keeps that face upright.

## 4. (B) `Scene_0bis` — the entry far out, and the corner

**The walks** (headless; a probe that steers the finger on the glass toward targets 45 mm round the corner where the bottom, the lower front
rectangle and the +x tip's two triangles meet; two loops each; far out = approach 1.0, part way = 0.736 (the far-out regime) and 0.515, close in = 0.651
with the latch on). A loop is ccw = front rectangle → bottom → bottom triangle → front triangle → front rectangle, cw the reverse. "Turns" = the timed
camera turns (the gizmo held), their roll on the glass (signed), frames. ⚠ Turns under 2° not listed.

### 4.1 Today (`e252d0f`)

| walk | timed turns | per loop |
|---|---|---|
| far out, ccw | **+25° to +32° (6 – 7 frames)** at the entry onto the bottom, then **−83° (15)** at the side exit onto the triangle | 2 turns, opposite ways, 108° – 115° |
| far out, cw | 0° at the entry from the triangle, **+69° (13)** at the exit onto the rectangle | 1 turn, 69° |
| far out, down the rectangle near the end, across the bottom | **+45° (9)** at the entry; the far edge's half turn 205° (25 frames, **10.1° a frame**) | — |
| far out, the same in the middle | 0.3°; the half turn 175° (30) | — |
| part way (0.736), ccw / cw | as far out: +26° – +32° then −83°; 0 then +69° | 2 / 1 turns |
| close in, ccw | the side exit split, −25° (4 frames, **10.3° a frame**) then −61° (14); ⛔ the next loop: **+262° (18 frames, 26° a frame)** — the long way round | — |
| part way in (0.515), ccw | ⛔ **+273° (18 frames), 127° in ONE frame** — one rotation would be 105.5° | — |
| close in, cw | +83° (17) at the exit onto the rectangle | 1 turn |

**What the close-in long way is.** The turn is drawn by the two-target framing (`poseFramingTwo`), which keeps the piece and the aim on the glass by
blending two angles. Close in the camera is a few degrees off the line from the piece to the aim, and here the end pose swings half round that line:
the blend goes round the other way. Measured: one rotation 105.5°, the path drawn 287° – 346°. It is the case `RND5.md` left open (*"rolls the long way
when a turn's end pose swings half round the piece–aim line"*) and the same drawing as the circle of package A (`BOTTOM_FACE_CIRCLE_REGRESSION.md` §3).

### 4.2 The candidates

* **(i) Carry the PICTURE's up** at the entry (the level direction whose image is the picture's up), not the edge's layout: the entry silent anywhere.
* **(ii) The calm stops leaning the camera along the edge** near an edge with a free face (its sideways share to none within 40 mm of that edge), so
  the camera is square to the edge at every crossing place.
* **(iii) N1** — `freeFaceSquare` 1, built behind a slider (the camera square to the free face at every distance).
* **(iv) The picture continued, the layout reached by the face's middle** — found in this study: at the entry the heading is the picture's (as (i)), and
  it turns toward the entry edge's layout as the gizmo goes deeper, whole at the depth of the face's centre (a smoothstep of the depth over the centre's
  depth). Paid by the finger's travel, never by time, and never at an edge.
* **(iv′) The picture's upright continued near the entry edge at EVERY place, the layout by the face's middle** — (iv) mended after its first
  measurement: near the entry edge the heading is the camera's own level direction (the one whose image IS the upright picture), wherever along the
  edge the gizmo is — (iv) used the entry PLACE's, so an exit back over the same edge elsewhere paid the difference (20.5° measured); faded where the
  view nears the vertical (close in: the layout).
* **(v) Every close-in turn drawn as ONE rotation about the piece** (the drawing `poseAboutPiece`, rule 2) while the close-in latch is on — the drawing
  already used when the framing is degenerate; far out the two-target framing as today.

### 4.3 Measured (far out unless said; per loop)

| | ccw loop | cw loop | the entry near the end (x 190) / the drift of a straight dy across the bottom | close in ccw (side exit) | other walks |
|---|---|---|---|---|---|
| today | +25…+32° then −83°: **2 turns, 108° – 115°** | +69°: 1 turn | +45° / −15 mm | −25° + −61°, then **+262°** (26°/frame) | — |
| (i) | 0°, then −59° … −71°: **1 turn, 60° – 71°** | +62° … +69° | **0°** / ⛔ **−370 mm**: the dy runs diagonally across the face | as today | the far edge 191° (8.3°/frame) |
| (ii) | +21…+28° then −83°: 2 turns, 104° – 111° | +68° | +41.5° / −14 mm; ⛔ the view jumps at the edge (25° – 34° of look in the entry's turn, 18° today; 34° in the middle where today 6°) | as today | — |
| (iii) N1 | +19…+28°, then −16° (3 frames, 9°/frame) and −67°: **3 turns**, 102° – 107° | +67° … +74° | ⛔ **+44°** (not removed) / −21 mm | as today | the far edge 198° |
| (iv) | 0°, then −83°: **1 turn, 83°** | +69° | **0°** / −100 mm (a curve over the face's first half) | as today | the far edge 180.5° (6.7°/frame, today 10.1) |
| (v), close in | — | +76° | — | −25° + −54°, then **−79°** (7.8°/frame at most); path 108.5° for a 105.5° rotation | part way 0.515: −79° (today +273°) |
| (iv) + (v), close in | — | — | — | −25° + −54°, then −79° | — |
| **(iv′)** | 0°, then −83°: **1 turn, 83°** | **+56°** (11 frames) | **0°** / −112 mm | as today | the far edge 185° (6.7°/frame) |

**Back over the same edge, and the far edge** (far out; "back" = in near the corner, out again near the same place — the probe returns 0 – 35 mm
away; "back, middle" = in near the corner, along the bottom to its middle, out there; "far" = in, across to the far edge, back in, out over the first edge):

| | back | back, middle | far | part way (0.736) back |
|---|---|---|---|---|
| today | **+32° then −32°** (7 frames each) | +32° (7) in, 1.4° out | +32°, 208° (10.5°/frame), −24°, 143° | +32° then −32° |
| (i) | 0°, −26° | 0°, **+25°** | 0°, 234° (13.9°/frame), −4°, −228° | 0°, −26° |
| (iv) | 0°, −26° | 0°, ⛔ **+20.5°** (today 1.4°: the flaw (iv′) mends) | 0°, 208°, −4°, 143° | 0°, −26° |
| (iii) N1 | +24°, — | +24°, −2° | +24°, 196°, −18°, −194° | +24°, −16° |
| **(iv′)** | 0°, **+27°** | 0°, **−2.4°** | 0°, 207°, −4°, −210° | — |

⚠ **Why (iv′) still turns 27° back over the same edge near the end**: at that crossing the LOOK itself swings 27° in 6 frames (the view's heading
−16° → −43°): the calm's frame on the free face and on the slanted face differ there, and the shown direction is handed from one to the other. That is
a second cause, beside the heading: the calm on a spit's free face — not studied here (§8). Close in all candidates: back 0.3° – 2.3° (no calm).

⚠ **THE MEASUREMENT CORRECTS A STATEMENT MADE TO THE OWNER**: N1 (`freeFaceSquare` 1) does NOT remove the entry's turn far out — **44° against 45°
today** (the camera turns square to the face at the entry, at the same moment, by the same angle). `BOTTOM_FACE_CIRCLE_REGRESSION.md` §10.5 item 3 is
corrected.

### 4.4 Each candidate against the rules

The charts' order: Landing, Continuity and Upright never yield; then Finger; then Sections. The calm *"shall stay"*, with the whole orbit angle at a
face's edges. T1 every face like a side face (the green and red straight, level and upright on the glass; the gizmo the finger's way); T2 no calm close
in; T3 the gizmo stays; T4 the edge the only trigger of a camera turn that changes the layout; T5 one turn that completes, the gizmo held (now "one rule
for every tilt", §5); T6 upright where upright means something; T7 no surprise at an entry; T8 – T12 as in `TILTED_POLE_CLOSE_IN.md` §1.

| | bends | keeps | close in |
|---|---|---|---|
| (i) | **Finger / T1** on the free face far out: the zone's lines lie up to 47° off the glass's axes, a straight dy crosses the face diagonally (370 mm along the axis over a 210 mm crossing); **his wish**: back over the same edge at another place costs the difference of the leans there | T4, T7 (silent entry), the calm | untouched |
| (ii) | **Continuity** (the shown direction jumps at the edge, the free face's own calm not suppressed); **the calm** (*"the whole orbit angle at a face's edges"*: near the corner the end's zone needs the lean); and it does not remove the turn (+41.5°) | — | untouched | 
| (iii) N1 | nothing new, but does not answer (44°); adds a 3-frame 16° turn at the side exit | — | identical |
| (iv) | **T4 in its letter**: the picture turns while the gizmo crosses the face's first half — paced by the finger, never by time, never in a frame (a calm's kind of motion, not a timed turn); **Finger**: a straight dy curves by up to 100 mm in that band | T7 (silent entry at every place), the calm whole, T3, T5, T6 on bound faces, the far edge's ONE realignment (his wish), the exits back over the entry edge silent at every place (the depth there is 0) | untouched (close in the picture's heading IS the layout's: the blend is between two equal headings) |
| **(iv′)** | as (iv): **T4 in its letter** (the picture turns as the gizmo goes into the face, by the finger, never by time) and **Finger** (a straight dy curves 112 mm over the face's first half) | as (iv), and an exit anywhere on the entry edge pays nothing for the heading (the 27° left is the calm's look, above) | untouched (the fade by the view's elevation: close in the view is vertical on the face, the layout) |
| (v) | **none of the owner's rules**; it replaces a drawing (the two-target framing close in), which changes how every close-in turn is drawn — the tilts' entries and exits on `Scene_1` / `Scene_0`, the ridge's crossing, the zone switches — looks he has accepted | Continuity, T5 (one rotation, never over the speed), Upright | it IS close in |

## 5. One rule for every tilt — the timing

**How every crossing times its turn today** (`zoneStep`, `src/render/assembly_wiring.ts`): ONE turn from the pose shown to the pose beyond, its share =
the angle turned so far / the whole angle (the camera's turn plus the piece's direction's ease), the angle advanced at ONE speed, `tiltRollDegS` = 360°
a second = 6° a frame; the gizmo held while it runs (`tiltClampStep`); a turn made during the approach is paced by the finger instead (not timed). Its
duration is therefore its angle: 10° → 2 frames, 30° → 5, 45° → 8, 90° → 15, 180° → 30. **A turn under about 30° lasts 5 frames or fewer: that is what
reads as a shake.**

**The rule proposed (a pure function of the turn's angle, the same at every crossing):**

> duration(θ) = θ / ω between the limits — ω the one speed (360°/s) — never under **T_min** and never over **T_max**; a turn under θ₀ (2°: below what one
> frame of a drag already moves, 8 – 9°) keeps the speed (invisible, and never a hold for nothing). Recomputed each frame from the whole as it is now (as
> today), so a growing whole keeps the rule.

* **T_min = 250 ms (15 frames)** — the time of a quarter turn today: every turn from 2° to 90° then lasts exactly as long as the quarter turns he has
  accepted, so a small realignment is seen as a turn, not a twitch. ⚠ A perceptual threshold cannot be measured headless: 250 ms is the quarter turn's own
  time and the usual length of a UI transition; a slider (`tiltMinMs`) for his eye on the phone.
* **T_max — PROPOSED FOR HIS CONFIRMATION** (he has not chosen between a speed of its own for the half turns and every turn faster): 333 ms
  (20 frames) carries his *"scene 0bis top ridge … Just make it 50% faster"* through the same rule — the half turns (the ridge's crossing, the spit's
  half turn at a far edge, the tilt's far edge, `Scene_0`'s bottom far edge) from 30 frames to 20 (9° a frame), every turn up to 120° unchanged. A
  slider (`tiltMaxMs`; 0 = none).
* **The share stays linear** — no measurement here asks for an ease in or out.

**Every timed turn on the walks measured, today and under the rule (with the recommendation (A) + (iv′) + (v))**:

| the turn | angle | frames today | under the recommendation, at today's speed | under the rule (T_min 15, T_max 20) | the gizmo held, against today |
|---|---|---|---|---|---|
| `Scene_0bis` far out, the entry near an end | 25° – 45° | 6 – 9 | **none** (0°) | — | −6 to −9 frames |
| `Scene_0bis` far out, back out over the same edge near the end (the calm's look, §4.3) | 26° – 32° | 7 | 27° in 6 | 15 | +9 |
| `Scene_0bis` far out, the side exit onto a triangle (ccw) | 83° | 15 | 83° in 15 | 15 | as today |
| `Scene_0bis` far out, the exit onto the rectangle (cw) | 69° | 13 | 56° in 11 | 15 | +2 |
| `Scene_0bis` the far edge's half turn (far out) | 175° – 210° | 25 – 30 | 185° – 210° in 25 – 30 | 20 | −5 to −10 |
| `Scene_0bis` close in, the side exit's first part (the second clock, `TILTED_POLE_CLOSE_IN.md` §12) | 25° | 4 (10.3°/frame) | 25° in 4 | 15 | +11 |
| `Scene_0bis` close in, the side exit | 61°, then ⛔ 262° – 273° | 14 – 18 | 54° – 79° in 14 – 18 | 15 – 18 | about as today |
| `Scene_0bis` close in, the exit onto the rectangle (cw) | 83° | 17 | 76° in 17 | 17 | as today |
| `Scene_0bis` close in, in and back (the square camera's pitch, 52°; the roll 0.3° – 2.3°) | 52° | 9 | 9 | 15 | +6 |
| `Scene_0` close in, the tilt's entry on the bottom (the view pitches 52°) | ≈ 52° | 9 | 9 | 15 | +6 |
| `Scene_0` close in, the bottom's far edge | 175° – 189° | 29 – 31 | 31 | 20 | −11 |
| `Scene_1` close in, the tilt's entry on the bottom | 90° | 16 | 16 | 16 | as today |
| the top ridge's crossing (`Scene_0bis`, the regression file's §7) | ≈ 180° | 30 | 30 | 20 | −10 |

⭐ **So a timing rule IS needed**: under the recommendation two turns under 30° remain (27° in 6 frames far out, back over the entry edge near an end;
25° in 4 frames close in, at the side exit's start) — each reads as the shake he describes.

**What it changes elsewhere** (to be shown on the replays, by design): every turn under 90° lasts 15 frames, so close in the square camera's 52° turns
on `Scene_0` / `Scene_0bis` hold the gizmo 6 frames longer; every half turn 20 frames at 9° a frame (the "never over 6° a frame" of package A is not a
rule any more: his request). **The first-frame peaks** (the two clocks of `TILTED_POLE_CLOSE_IN.md` §12: the square camera's pitch running beside the
turn, 8 – 10° a frame) are not removed by a duration: a slower small turn lowers the turn's own share, the square camera's own stays. Their root is §12's
(option A, chosen by him 2026-11-16, reverted with package A); the rule is the timing, not that fix.

## 6. The recommendation and his three answers

**(A) `Scene_0` close in.** Build the correction of §3.
* *Possible?* Yes — measured: the roll before the edge and the take-back gone, near an end, slow; at a fast finger there was none to remove.
* *Conflicts?* None with his rules. It narrows the zenith fix (2026-11-13) to where the calm is shown; close in the square camera's face sets the
  heading. `Scene_0bis`, `Scene_1` and everything far out are identical (§3).
* *Patch or rebuild?* A **correction inside the existing design**: one pure formula (`calmLevelHeading`), two call sites in
  `src/render/assembly_wiring.ts`. Not a special case: it holds on any face the square camera shows.

**(B) `Scene_0bis` and the corner.** Build **(iv′)** far out, **(v) with a narrowed condition** close in, and the timing rule. Per walk, the
timed turns become fewer and smaller everywhere measured: a ccw corner loop ONE turn of 83° (today two opposite, 108° – 115°), a cw loop 56° (69°),
in and back near the end 27° (today +32° then −32°), in near the end and out in the middle ~2° (32°), the far edge one realignment as today, and close in
79° instead of 262° – 273°.
* *Possible?* **Mostly.** His wish — the slanted-to-level entry as quiet as a slanted-to-slanted crossing, one full realignment only at ANOTHER edge — is
  met at the entry (0° at every place and distance measured) and at the far and side edges. ⚠ **Not met in full back over the entry edge near an end
  far out (27°)**: there the LOOK itself swings at the crossing (the calm's frames on the two faces differ), not the heading — a second cause, not
  studied here. ⚠ *Not* free either: what the entry no longer pays is paid by the finger while the gizmo goes into the face (the picture turning up to
  45° over the face's first half, never in one frame).
* *Conflicts?* (iv′) bends **T4 in its letter** (the picture's heading changes inside a face — paced by the finger like the calm, never by time) and
  **the Finger** (a straight dy curves up to 112 mm over the face's first half); none of the rules that never yield. (v) bends none of his rules, but as
  prototyped (every close-in turn about the piece) it made a fast dy's frame **12°** in `tilt_check` (`Scene_1` and `Scene_0`; 8.7° and 8.8° today)
  while improving the ridge (8.5° → 6.3°, 8.1° → 6.1°): its condition must be narrowed — about the piece only where the two-target framing would turn
  further than the one rotation (measured at the corner: 287° – 346° for 105.5°) — and re-gated before it is built. (i) is out (a 370 mm diagonal:
  Finger and Sections); (ii) is out (Continuity — the view jumps at the edge — the calm, and it leaves 41.5°); (iii) does not answer (44°). **By his
  criterion "no crossing worse than today"**: (iv′) passes on every crossing walked but one, the exit back over the entry edge near the end — +27°
  where today it is −32° after a +32° entry: smaller, not worse, but no longer paired with the entry. **Which gives way least**: (iv′)'s T4 — the rule
  was written against timed turns in a face's middle, and far out the free face already turns its picture with the finger today (its world vertical
  drifts 50° → 123° on the glass across the face).
* *Patch or rebuild?* **Corrections inside the C4 design, not a rebuild**: (iv′) changes the heading carried on a free face (`freeFaceFrame`; a pure
  `entryBlendHeading(viewLevel, layout, depth, centreDepth, viewElevation)` in `src/input/free_face.ts`, the depth signed); (v) the choice of drawing
  in `zoneMixPose` (a measured condition, not a face); the timing rule a pure `turnDurationMs(θ, ω, T_min, T_max, θ₀)` in `src/input/orbit_tilt.ts`,
  read by `zoneStep`. ⚠ The 27° that remains needs a study of the calm on a spit's free face before anything is built for it.

## 7. What would be built, its gates, and what he judges on the phone

| piece | files | vectors | gates |
|---|---|---|---|
| (A) the level reading with the square camera's share — ✅ BUILT `3ef7ba7` (§10) | `src/input/orbit_calm.ts`, `src/render/assembly_wiring.ts` | `tests/zenith_roll.test.ts`: the share 0 equal to today bit for bit, the share 1 = the face's own heading; RED against today's formula first | the replays (`Scene_1`, `Scene_0bis` identical; `Scene_0` another play from its first close-in leg, explained); `tilt_check` "1 0"; the ridge "0 4"; this study's walk (the roll before the edge ≤ 0.5°) |
| (iv′) the picture's upright continued near the entry edge, the layout by the middle — ⛔ built `069682a`, REVERTED `fa72bab` (§10: 21° in one frame) | `src/input/free_face.ts`, the wiring's `freeFaceFrame` | the blend: depth ≤ 0 = the view's level heading, the centre's depth = the layout, monotone, faded by the view's elevation (70° – 80°); a mutant per term | `mid_check`, `across_check`; the corner loops (one turn a loop, ≤ the corner's angle + 10°); the replays (`Scene_0bis` another play, `Scene_0`/`Scene_1` identical) |
| (v) one rotation where the framing would go the long way | the wiring's `zoneMixPose` | the drawing's choice (the framing's path against the one rotation) | the corner loops close in (no turn over 110°, no frame over 9°); the ridge close in (`MODE=ridge`, not worse than 8.5°); `tilt_check` on the three scenes (⛔ the prototype's 12°: not worse than 8.8°); the replays |
| the timing rule | `src/input/orbit_tilt.ts`, `zoneStep`, two sliders in the menu's ORBIT section | the function's table (2° → the speed; 30° → 15 frames; 180° → T_max) | every replay changes at every turn by design: the largest step a frame not worse than the half turn's 9°; `view_jumps` no frame over 45° |

**What he judges on the phone**: (1) `Scene_0` close in, down a leaning face near an end, slowly: no roll before the edge, nothing at the edge; (2)
`Scene_0bis` far out and part way, round the corner both ways: one turn a loop, the entry silent, the picture turning while the gizmo goes into the
bottom (is that turn, paced by his finger, acceptable? does the dy's curve bother him?); (3) `Scene_0bis` close in round the corner: one quarter-ish
turn, no spin; (4) the ridge and every close-in tilt under (v) and the timing rule: the half turns faster (20 frames, if he confirms T_max), the small
turns slower (15 frames) — the two sliders.

## 8. Not checked

* No device look (rule 5). One finger speed for the loops (2 px a frame) and the far-out walks; the corner at the +x end only; the −x corner and the top
  ridge's corners not walked.
* (v) run through the ridge gate and `tilt_check` as prototyped only (every close-in turn): the ridge better, a fast dy's frame 12°; the narrowed
  condition is not prototyped.
* (iv′) prototyped with the centre's depth as the band; a shorter band not tried; its finger drift measured on one walk; part way and close in only
  through (iv)'s loops (identical to today close in by construction). The calm's look at the crossing back near an end (27°) not analysed.
* A level TOP between slanted faces not walked: the heptagon turned over (a throwaway edit of `Scene_0`) booted, but the probe's drags pressed where
  nothing moved (the orbit still: a probe fault, not the game's) — the formula and the ridge faces' leak are the evidence.
* (A) at a fast finger (3 px a frame) and at the −x end: checked — as today at the fast finger (2.2° before the edge, 2.3° in the turn), as at the +x
  end at −x (0.0°, 2.3°).
* The timing rule not prototyped: its table is computed from the measured angles, not run.
* The probes (not in the repo): `C:/Users/sugit/AppData/Local/Temp/claude/58fcf8122906abb9/b2290347-4989-4dda-a6ab-49506e5270d4/scratchpad/regress_bottom/level_entry/`
  (`walk.mjs`, `walk2.mjs` — the corner loops; `events.mjs`, `loopan.mjs`, `rotang.mjs`; the prototypes `protoA2.diff`, `protoB.py`, `protoIV2.py` (and the signed depth); the recordings in
  `out/` and `rep/`). A scratch folder: it may be cleared.

## 9. The owner's approval, and the build as briefed (2026-11-17)

**What was put to him** (four questions, each with a recommendation): (1) the `Scene_0` fix (A): build it — yes; (2) `Scene_0bis` far out: build (iv′)
**behind a switch**, so that he compares it with today's entry on the phone (with the switch off, the timing rule alone stretches today's entry turn) — yes;
(3) the close-in roll the long way round (v): include it **only if its narrowed condition passes the gates**, otherwise leave it out and report — yes;
(4) the timing: the longest duration 333 ms **for every half turn** confirmed, 250 ms as the starting value of the least duration — yes.
**His answer:** *"Agreed to every recommendation. Proceed."*

**The timing rule, finalized** (his word: *"You can finalize the rule"*). §5's rule had a cliff: a turn of 1.9° at the speed, a turn of 2.1° held for
250 ms — and turns of about 2° exist (an exit in the face's middle: 1.4° today, 2.4° under (iv′)), so the same crossing would sometimes hold the gizmo a
quarter of a second for nothing. The least duration therefore GROWS with the angle up to the angle where a turn starts to read as a shake (30°, §5):

> duration(θ) = max( θ / ω , T_min × min(1, θ / θ_s) ), never over T_max — ω = 360°/s (`tiltRollDegS`), T_min = 250 ms (`tiltMinMs`; 0: none),
> T_max = 333 ms (`tiltMaxMs`; 0: none), θ_s = 30° (`tiltSmallDeg`).

One continuous function, the same at every crossing: under 30° a slow speed (120°/s, 2° a frame: 2.4° → about 1 frame, 10° → 5, 27° → 13.5); 30° – 90°
250 ms (15 frames); 90° – 120° the one speed; over 120° 333 ms (a half turn 20 frames, 9° a frame). With both durations at 0 it is today's speed, bit for
bit. A turn paced by the finger (during the approach) is not timed, as today. Three sliders in the menu's ORBIT section.

**The build — three packages, each an Opus builder then an independent Opus auditor, on `1.0.147-`, local commits, no push:**

| package | what | the switch / the dials | its own gate that nothing else moved |
|---|---|---|---|
| **LF1** | (A), then (iv′) — two code commits; the study's walks (the roll before the edge, the corner loops, each timed turn's path against its one rotation) ported into `scripts/probes` as a gate | `freeEntryUpright` 0 = the entry edge's layout at once (today) / **1 = the upright continued (the default)** | (A): `Scene_1` and `Scene_0bis` replay frame for frame; (iv′) at 0: the three replays frame for frame |
| **LF2** | the timing rule | `tiltMinMs` 250, `tiltMaxMs` 333, `tiltSmallDeg` 30 | both durations at 0: the three replays frame for frame |
| **LF3** | (v) — FIRST the root cause of the long way in `poseFramingTwo` (a branch cut in a blended angle, or the framing's geometry); the fix at that root, or the narrowed choice of drawing latched at a turn's start | none | every turn it does not touch frame for frame; `tilt_check` and the ridge not worse than its base; ⛔ if no condition passes: NOT built, reported |

**The lesson of package A binds the three** (`BOTTOM_FACE_CIRCLE_REGRESSION.md` §5): a gate on a frame's speed does not see a path's shape — every
timed turn on the gates' walks is also judged by the path drawn against the one rotation from its first pose to its last. **Not in this build:** the 27°
left back over the entry edge near an end (the calm's look on the two faces, §4.3 — a study of its own first); the first-frame peaks of
`TILTED_POLE_CLOSE_IN.md` §12; anything on a level top (no scene has one). **Then:** the deploy only on his word, his look on the phone (§7), step 3
once on the final code, the merge.

## 10. LF1 as built (2026-11-17, an Opus agent — base `a9b061f`): the gate, (A) built, (iv′) built then REVERTED

**In one paragraph.** The gate is in the repo (`92f0878`). (A) is built (`3ef7ba7`): on `Scene_0` close in the roll before the bottom edge near an end
is gone (−11.1° → 0.0°) and the edge's take-back is the pitch's own (13.2° → 2.3°); nothing else moved. (iv′) was built behind its switch
(`069682a`); the gates the brief named passed but three (one half turn drawn the long way, LF3's; a 2-frame −4° at one entry a ccw loop; `mid_check`'s
whole run, 9.3° → 21.6° in a frame), and a reading the brief did not name failed: **far out, at a slow finger (2 px a frame), the picture rolls up to
21° in ONE frame outside any timed turn (today at most 4.4°)**. A timed turn of 32° in 7 frames was traded for
an untimed roll of 20° in one. It is reverted (`fa72bab`); what to do is the owner's (§10.3).

### 10.1 The gate (`92f0878`)

`scripts/probes/level_entry_check.mjs` (the study's `walk2.mjs`, unchanged but its header), `level_entry_analyse.mjs` (the study's `events.mjs` and
`loopan.mjs` in one, plus every timed turn's ONE ROTATION, PATH and ratio — package A's lesson — and the FREE ROLL: the largest roll in one frame
outside every timed turn), `level_entry_table.mjs` (runs side by side), `level_entry_batch.sh` (mode a: 6 walks on `Scene_0`; mode b: 27 walks on
`Scene_0bis`, both tips) → `scripts/probes/ORBIT_GATES.md` §7. **The study's figures reproduced exactly** (its recordings and the gate's at
`a9b061f` are identical frame for frame; the code is `e252d0f`'s). Found at the −x tip (the study walked +x only): close in, the cw loop's exit onto
the rectangle rolls the long way too — **+257° in 17 frames for a 112.6° rotation** (path 270°) — for LF3.

### 10.2 (A) — built (`3ef7ba7`), as §3; the figures against the study's

`calmLevelHeading(yaw, calm, kH, squareShare)`: the calm's share × (1 − the square camera's share); the wiring passes the share the square camera
SHOWS (`squareShareShown`: 0 without its normal — the share `calmDir` blends by), at `calmFrame` and `levelHeadingOf`. 4 vectors
(`tests/level_square_share.test.ts`), red on 4 mutants: the share ignored; × the share (the wrong way round); the share applied before the fade
behind the face; the share unclamped above 1. Measured (mode a, `Scene_0` close in, 1 px a frame):

| | base `a9b061f` | (A) | the study's (A) |
|---|---|---|---|
| near +x: the roll in the 20 frames before the edge / the edge's turn | −11.1° / 13.2° (9 fr) | **0.0° / 2.3°** (9 fr) | 0.0° / 2.3° |
| near −x | 11.8° / −9.4° | 0.0° / 2.3° | 0.0° / 2.3° |
| the middle | 0.4° / 1.9° | 0.0° / 2.3° | 0.0° / 2.3° |
| the picture after the far edge's half turn (off upright), +x / −x | −12.3° / 9.3° | −1.9° / −1.9° | −1.9° |
| the far edge's half turn, +x: path / one rotation | 208.5° / 172.3° (⚠ 1.21), 29 fr | 201.5° / 180.0° (1.12), 31 fr | — |
| down off a top face near +x / −x: the roll before the edge | −13.1° / 14.0° | 0.0° / 0.0° | 0.0° |
| fast finger (3 px), +x: before / in the turn | 2.0° / 2.5° | 2.2° / 2.3° | 2.2° / 2.3° |
| the largest free roll in a frame (6 walks) | 1.2° – 5.3° | 1.2° | — |

**Nothing else moved**: `Scene_0bis` replay identical in every frame and its 27 gate walks identical; `Scene_1` replay: 11 frames differ by at most
4.3e-7 (1e-6: never — the study's same 11); `Scene_0` identical to frame 1143 (drag 17, close in at 0.611), another play after: the view's largest
turn in a frame 15.4° both, the roll's 17.9° → 18.2°, frames with a roll over 10°: 48 → 50, health clean. Far out the formula multiplies by exactly
1, so a frame can differ only once the square camera shows. `tilt_check` "1 0 4": `Scene_1` and `Scene_0bis` identical, `Scene_0` the same events,
8.8° at most a frame both, 2149° → 2162° in all (its ups more upright); the ridge "0 4" identical.

### 10.3 (iv′) — built (`069682a`), measured, REVERTED (`fa72bab`)

**What was built** (the patch is the commit): `entryBlendHeading(viewLevel, layout, depth, centreDepth, viewElevation, upright)` as §4.2; the depth
signed, read at the gizmo's place (the MODEL's: `t.surface` through `baseFrame`); the switch `freeEntryUpright` (default 1; a slider in POLAR ZONES;
a URL override). **What differs from the study's prototype, and why** (each measured): the view's level direction is read on the camera's direction
BEFORE the owner's offsets, turned by the picture's offset read ONCE at the entry (`pictureOffset`, `viewLevelTurned`) — the prototype's level part
of the drawn camera gave the entry a 3° – 4° turn (the offsets 2.5° / 2° and the spit's side bias), and reading the bound camera's picture every
frame swung close in by 24° in one frame; its sign is kept — turned to the layout's side (the prototype) it flips near a tip; the fade is a
smoothstep of the elevation's angle (the prototype's: of its cosine). 11 vectors, red on 11 mutants (depth ignored, the centre's depth doubled, a
linear depth, no fade, the elevation signed, the flip to the layout's side, the switch ignored, the share reversed, the offset 0, the picture's sign
by the view, the view not turned).

**What passed** (against `3ef7ba7`): the switch at 0 — the three replays and the 27 walks identical frame for frame. At 1 — `Scene_1` and `Scene_0`
replays identical; `Scene_0bis` another play from frame 315 (the view's largest turn in a frame 14.1° → 12.4°, the roll's 18.9° → 18.7°, frames
over 10° of roll 27 → 26; health clean; frames with the camera's up below level 32 → 75 in that other play); `tilt_check` and the ridge identical;
`across_check` identical; close in (0.651) and at 0.515 every timed turn as at (A), turn for turn. Mode b far out (+x; −x alike):

| walk | (A) | (iv′) | the study's (iv′) |
|---|---|---|---|
| ccw corner loop | +32 / 7 fr, −83 / 15 a loop | **−83 / 15 a loop** (and a 2-frame −4° at the second loop's entry: the picture's roll on the glass across it −5.3° → −4.7°) | 0, −83 |
| cw corner loop | +69 / 13 | **+32 / 7** (−x: −62 → −28 / 6) | +56 / 11 |
| a straight dy near the end: the entry / the drift | +45° (9 fr) / −8 mm | **0.0° / −94 mm** (−x +92) | 0° / −112 mm (from x 190) |
| in and back near the end | +32, −32 | 0, **+8 / 2 fr** | 0, +27 |
| in near the end, out in the middle | +32, +1.4 | 0, −2 / 2 fr | 0, −2.4 |
| across to the far edge and back | +32, 208, −24, 143 | 0, 207, 0, **−210** (path 217° for 149°: the long way, ⚠ — LF3's drawing; a 1° change of the pose flipped its side) | 0, 207, −4, −210 |
| `freeFaceSquare` 1 (N1): the dy's entry / a ccw loop | +44° / +24, −16, −67 | 0.1° / −16, −72 (the fade leaves the layout as the square camera climbs; the 3-frame −16° stays) | — |

**What failed — the FREE ROLL** (the largest roll in ONE frame outside every timed turn, 2 px a frame unless said):

| walk | base / (A) | (iv′) |
|---|---|---|
| cw loop +x / −x (far out and 0.736) | 2.0° / 1.3° | **21.4° / 17.1°** |
| ccw loop | 2.3° – 2.5° | 7.2° – 7.3° |
| in and back near the end (far, 0.736; both tips) | 1.1° – 1.5° | **11.7° – 11.8°** (66° in the 20 frames before the exit) |
| the corner loop at 4 px a frame | 3.3° | **19.4°** |
| `mid_check`'s whole run (its climb: a fast drag along the bottom toward the tip) | 9.3° | **21.6°** |
| a straight dy, the largest frame of the leg, at 2 / 4 / 6 px a frame | 10.9° / 9.5° / 10.0° | 8.0° / **12.1° / 19.7°** |

**The two causes** (read off the frames): (1) the fade by the view's elevation, 70° – 80°, lies where `Scene_0bis`'s bottom is seen far out (71° –
75° on the cw loop): the elevation moves 4° in a frame and the fade's share with it — the heading 20° in one frame (the cw loop, the frame before the
exit; `mid_check` f603). (2) the depth's blend has no bound per frame: its pace is the gizmo's travel × the smoothstep's slope (45° over half a face),
so a fast finger, or the calm swinging the view on the way back to the entry edge, turns the picture 12° – 20° in a frame. ⚠ The study's prototype
had both (its own recording of the way back: −80° in 20 frames, 12.3° in one) — its gates read timed turns only. **Package A's lesson in another
form: a gate on the timed turns does not see a turn that is not timed.**

**The options (the owner's; nothing built):** (a) fade by the square camera's share instead of the view's elevation (close in it is whole, far out
none: "close in nothing changes" exactly; cause 1 gone) — not prototyped; (b) bound the heading's change per frame at the tilts' one speed (6° a
frame) — time enters a rule decided "by the place only"; (c) a longer depth band (the whole face) halves cause 2's rate and bounds nothing; (d) leave
(iv′) out — today's entry, its 25° – 45° turn then stretched by LF2's least duration (15 frames). (a) + (b) together is the one that would answer
every reading measured here; it is not measured.

### 10.4 What is left

(iv′): the owner's choice above, then a builder (`069682a` is the starting point). LF2 (the timing rule) and LF3 (the long way round: now seen at both
tips — +263° at +x ccw, +257° at −x cw close in, +273° with 128° in one frame at 0.515) as briefed in §9, on `3ef7ba7`'s code. No device look (rule 5).

## 11. LF2 — one rule for every tilt: the inventory (2026-11-17, an Opus agent — base `0ab1f9f`, the code of `3ef7ba7`)

**What reads the tilts' one speed (`tiltRollDegS`, 360°/s) or times a camera turn today, and what LF2 does with each.** The rule (§9) is for a TIMED
TURN OF THE PICTURE AT A CROSSING — the gizmo held, one turn that completes. Everything else keeps today's pace, for the reason given. One rule for
every tilt: no crossing keeps a pace of its own, none gets a case of its own. Lines are at `0ab1f9f`.

| where | what it times | LF2 |
|---|---|---|
| `src/render/assembly_wiring.ts:2039-2047` `zoneStep` (its clock, `zm.done` toward `turnWhole`) | the ONE camera turn of every change of frame by time: a zone's switch (`zoneSwitch` :2122), a free face's entry (`freeFaceFrame` :2224) and exit (`freeFaceExit` → `crossTurn` :2248), the spit's crossing (`spitStep` → :2337), the ridge's half turn (`poleCross` → :1979), the tilt's exit over an edge (`tiltOff` → :1849 / :1862, not paced), the tilt's entry made with the approach over (`tiltOn` :1762, not pending) | **the rule** — the pace read each frame from the whole as it is now, as today |
| `src/render/assembly_wiring.ts:338` `seamTurnFrame` → `src/input/seam_turn.ts:136` `seamTurnStep` (its TIME branch) | the tilt's entry made while the approach ran (`byMm`): held, then by the finger's travel, then by time | **the rule** on its TIME branch; HELD and FINGER unchanged (a turn paced by the finger is not timed) |
| `src/render/assembly_wiring.ts:375` `seamOutFrame` → `src/input/seam_turn.ts:178` `seamOutStep` | the way out of close in (C3): paced by the fingers, never faster than the one speed on the share shown; by time once no finger is down | **the rule** as its ceiling (the rule's pace for that turn instead of the one speed); the fingers' pace unchanged |
| `src/render/assembly_wiring.ts:453` `squareFrame` → `src/input/orbit_tilt.ts:294` `squareTurn` | the square camera's own turn toward its face close in (its direction stepped at the one speed; the gizmo held meanwhile by `squareTurning`) | **stays**: the square camera's own clock — the second clock of `TILTED_POLE_CLOSE_IN.md` §12; it has no whole of its own (a step toward a target that moves), and timing it apart from the transition it runs beside would draw another path (package A's lesson). Its 52° pitches close in stay 9 frames: an owner's decision (§11's report) |
| `src/render/assembly_wiring.ts:458` `squareFrame` (`wholeShareStep` over `rollDurationMs(RELOCATE_ANGLE, …)`) | the square camera's SHARE eased in / out (125 ms) | **stays**: a share's ease, not a turn |
| `src/render/assembly_wiring.ts:1173` (the gizmo's depth glide), `:1750`, `:1856`, `:1928`, `:2118` (the relocations after a change of frame) | the gizmo's drawn place glided over 45°'s time (125 ms) | **stays**: a relocation glide, not a turn of the picture |
| `src/render/assembly_wiring.ts:1720` `tiltOn` (`swingDurMs = rollDurationMs(deltaShown, …)`) | read only by the tilt's relocation glide (:1750) — the camera's turn of the tilt's entry is `zoneStep`'s / `seamTurnFrame`'s (row 1, 2) | **stays**: a relocation glide's duration |
| `src/input/gestureConfig.ts:862`, `src/render/tuning_menu.ts:220` | the speed itself and its slider | the speed stays the rule's `ω`; three dials beside it (§9) |

**The contract — the rule changes the pace, never the path.** Within a transition other clocks may run (the square camera's turn and share, the
piece's direction ease — part of the whole, on the same clock —, the gizmo's relocation glide). Each transition put under the rule is measured on the
gates' walks against `0ab1f9f`: the same one rotation (within 2°), the same path (within 3° or 3 %), the same orientation at the same fraction of the
path. Where the square camera turns BESIDE a transition's turn (close in: the tilt's entry and exit, the ridge, the spit), stretching one clock and not
the other could draw another path — that is measured first; what does not hold the contract keeps today's pace and is written here with the reason.
The gate's instrument: `scripts/probes/turn_rec.mjs` (`DUMP=` on the probes) and `scripts/probes/turn_table.mjs` (every timed turn, base against new).

### 11.1 As built (2026-11-17: the gate `6236fb4`, the rule `e7ff2ed` — ⛔ REVERTED by `cb89bdd`, §11.2; this section is the record)

**In one paragraph.** The rule is built as §9 states it (`turnDurationMs`, `turnStepRad` in `src/input/orbit_tilt.ts`; three dials `tiltMinMs` 250,
`tiltMaxMs` 333, `tiltSmallDeg` 30, sliders after the speed in ORBIT › TILTED POLE, URL overrides). It paces `zoneStep`'s turns, the paced entry's
time tail and the way out's ceiling. **One thing differs from the brief, measured first**: a turn with the square camera turning BESIDE it keeps the one
speed (`turnDials`, `turnDialsOf`: kept for the turn's life). Built without it, the rule changed those turns' path. So close in nothing changes, and the
52° entries close in stay 9 frames. Far out every timed turn follows the rule. With both durations at 0 the three replays are identical in every frame.

**Why the exception (measured with the rule alone, before the build above).** Close in, a crossing runs two clocks: the transition's turn and the
square camera's pitch (`TILTED_POLE_CLOSE_IN.md` §12). Slowing one and not the other drew another picture. The close-in half turns (`tilt_check` on
`Scene_0` / `Scene_0bis`) ended 171.8° from where they began instead of 178° – 180°, 9° – 11° off the base's route on the way, up to 11.3° in a frame.
On `Scene_1`'s dy onto the top, 12° in 2 frames then the square camera's own 72° became ONE turn of 99° of path for 89°, 72° off the base's route.
Timing the square camera too would rebuild the two clocks (§12's option A, reverted with package A): not this package's.

**Every timed turn on the gates** (the base `0ab1f9f` → now; frames at 60 a second; "rule": the frames the rule gives; "one / path": the one rotation
and the path drawn, degrees; the largest frame in degrees). Like turns are grouped; the full tables: `node scripts/probes/turn_table.mjs` on the
recordings in the session scratchpad's `lf2/base` and `lf2/def`.

| where (the gate) | angle | frames | rule | one / path | largest frame |
|---|---|---|---|---|---|
| `Scene_0bis` far out and at 0.736, the entry onto the bottom (`level_entry` b, every walk) | 25° – 41° | 6 – 7 → **15 – 16** | 15 | 31.5 – 37.0 / 34.5 – 40.7 → 33.8 – 38.5 / 39.7 – 45.1 | 7.2 – 7.7 → 5.4 – 6.2 |
| the same, the exit onto the triangle, ccw | 83° – 89° | 15 → 16 | 15 | 84.0 – 84.2 / 86.1 – 88.9 → 89.1 – 89.4 / 91.2 – 94.4 | 6.1 – 6.9 → 6.0 – 6.9 |
| the same, the exit onto the rectangle, cw | 61° – 69° | 12 – 13 → 16 | 15 | 66.5 – 72.4 / 72.0 – 77.4 → 58.4 – 65.5 / 63.3 – 72.3 | 6.9 – 7.5 → 5.6 – 6.0 |
| the same, back out over the entry edge | 32° – 41° | 7 → 15 | 15 | 36.7 – 37.0 / 40.1 – 40.7 → 39.7 – 40.4 / 44.5 – 44.8 | 6.6 – 7.3 → 4.9 – 5.5 |
| the same, out in the face's middle | 11° → 23° (the end pose moves) | 2 → 12 | 12 | 10.6 / 10.8 → 23.2 / 23.3 | 5.9 → 5.9 |
| the spit's far edge far out (`b_far`, `b_dy`, `across_check`, `ridge_check` across, `MODE=pole`) | 175° – 210° | 25 – 31 → **20 – 21** | 20 | 174.1 / 185.6 → 171.2 / 181.3 (pole); 174.2 / 182.6 → 171.3 / 178.5 (across) | 6.6 – 8.6 → 9.4 – 10.9 |
| the way out of close in, 4 px a frame (`MODE=out`, `Scene_1`) | 180° | 37 → 25 (95 % in 35 → 24) | 20 | 179.9 / 189.7 → 179.9 / 187.4 | 6.0 → 9.0 |
| the way out, 1 px a frame — PACED BY THE FINGER (gate 4) | 180° | 46 → 46 | — | identical | 6.0 → 6.0 |
| close in, every turn with the square camera beside it: the tilt's entries and exits, the half turns, the 52° entries, the ridge (`tilt_check` every mode, `level_entry` a, the close-in walks of b) | 6° – 180° | identical | (the one speed) | identical (`Scene_1`'s ridge within 0.5°) | identical |
| the square camera's own turns (no transition) | 6° – 90° | identical | (stays, §11) | identical | identical |

**Against the contract.** (1) Start and end: within 2° of the base on every far-out turn that starts from the base's state (the first turn of each
walk: 0.2° – 1.6°); a later turn starts from another state (the gizmo held longer before it) and is read by its shape only. (2) **The route on the way
is NOT exactly the base's on the far-out entries: 4° – 7° off at the same fraction of the path, the path 3° – 6° longer (ratio 1.10 → 1.17 – 1.19).**
Read frame by frame (`b_back_p_far`): the turn's first two frames carry the gizmo's own ease (13 mm a frame) and the piece's spring, which the rule does
not time — 5.6° and 4.8° in those frames, then 2° a frame; at the base the same motion was inside its 6° a frame. The end pose moves while the turn
runs (its whole 36.7° → 37.7°), and the brief's rule for that ("the pace read each frame from the whole as it is now") is kept. (3) The far-out half
turns end 2.9° short of the base's end at their last frame; the picture then reaches the base's place, and the two recordings are identical from the
base's last frame of the turn on (`MODE=pole`, read frame by frame). **The tolerance taken for "the same pose at the same fraction": 3°** — the far-out
entries exceed it (4° – 7°): reported, not hidden.

**Turns whose path is over 1.15 × the one rotation + 5°** (package A's gate). New, not so at the base: (a) `b_far_p_far`'s second far-edge half turn
(the way back) — at the base 143° (one rotation 144.1°, path 150.7°), now **−208°** (151.4°, 216.3°, ratio 1.43, 12° in a frame): the flip of side LF1's
(iv′) met (§10.3) — the half turn's two-target drawing (`poseFramingTwo`) goes the long way for a start pose a degree different; the root is LF3's;
(b) the `Scene_0bis` replay at the defaults, another play from frame 315 (drag 31): 135° drawn with 235° of path (1.67, 13.8° in a frame), the same
drawing. So at the base and still: `b_ccw_p_d515` 3.36, `b_ccw_p_close` 2.48, `b_cw_m_close` 2.40, `b_cw_m_d515` 1.38, `b_ccw_m_d515` 1.28,
`b_cw_p_d515` 1.26, the first `b_far_p_far` half turn 1.42, `b_dy_x190`'s far edge 1.37 → 1.39, the close-in ridge half turns 1.20 (LF3's, or close in
and untouched).

**The other gates.** `view_jumps`: no frame over 45° (the `Scene_0bis` replay's largest 14.1° → 11.8°); `replay_health` clean (0 errors, no gizmo step
over 150 mm; `Scene_0bis` the camera's up below level 32 → 34 frames, its other play); `Scene_1`'s replay identical at the defaults, `Scene_0`'s from
frame 1398 (the way out, `A22`: 7 → 8 frames); `tilt_check` default "1 0 4" identical (8.7° / 8.8° / 8.9°), ridge identical, press and rim with no
timed turn; `MODE=pole` `Scene_0bis` 8.6° → 10.9° a frame (its half turns at 9° a frame, the rule's); the tilts made and left and the holds as at the
base in every `tilt_check` run; `across_check` the half turn then the hold as at the base, 7.4° → 9.9°; `mid_check` reaches the middle, the side
changed 0 times, one turn (2 → 11 frames, 76° → 81°, 6.2° → 5.8° a frame) — its setup ran on another track (a turn of the climb held the gizmo 14
frames instead of 2): parked elsewhere, the run's dy holds 1 → 4. `ridge_check` across, far out: 7.4° → 10.0° (its half turns). The free roll (LF1's
gate): equal or lower on every walk (2.6° at most far out). Nothing else ends elsewhere than what a longer or shorter hold moves (the probes' finger
goes on while the gizmo is held).

**§9's expected table against the measured**: the far-out entries 6 – 9 → 15 – 16 frames ✓; the far-out half turns 25 – 31 → 20 – 21 ✓ (the owner's
*"50% faster"*: `Scene_0bis`'s top ridge far out, `ridge_check` across, 30 → 20); the quarter turns 15 → 16 ✓; under 30° 2° a frame ✓ (the free face's
exit in its middle, 11° → 12 frames). ⛔ **Not as expected: everything close in** — the 52° entries stay 9 frames, the close-in half turns 30 – 31, the
first-frame peaks of `TILTED_POLE_CLOSE_IN.md` §12 — because of the exception above.

**What is left — the owner's.** (1) Close in: to put those turns under the rule, the square camera's pitch must become part of the one turn (§12's
option A), then the rule on that one clock; or keep them at the one speed. (2) The far-out entries' route 4° – 7° off the base's on the way (the gizmo's
ease and the piece's spring, untimed, in the turn's first frames): accept it, or time the turn from the frame those settle. (3) The long way of a half
turn's drawing, (a) – (b): LF3. No device look (rule 5).

### 11.2 Reverted (2026-11-17, `cb89bdd`): the rule changes the camera's path far out — the owner decides

**The result first.** The timing rule is NOT in the game any more. `cb89bdd` reverts `e7ff2ed` (the code and its vectors): `src` and `tests` are
`0ab1f9f`'s again, byte for byte. The gate's tools (`6236fb4`) and the record above stay.

**Why.** The brief's contract was "the pace, never the path", and its answer to a path change was to build nothing. The independent audit reproduced
three path changes far out, at the default dials:
- `Scene_0bis`, `b_far_p_far`, the way back over the far edge: a NEW long-way turn. Path 150.7° → 216.3°, one rotation 144.1° → 151.4°, ratio
  1.05 → 1.43, the largest frame 7.1° → 12.0°.
- The far-out entries onto the bottom: 4° – 7° off the base's route at the same fraction of the path (5.7° – 6.5° in the audit's sample), against a
  3° tolerance.
- The `Scene_0bis` replay (its other play from frame 315): a 135° turn drawn with 235° of path (ratio 1.67, 13.8° in a frame). Measured by the builder
  only.

Close in nothing had changed (the exception of §11.1). So what was left of the rule was its far-out part, and that part changed paths.

**What it would take — the owner's options.**
1. **Wait for LF3** (the half turn's two-target drawing going the long way), then measure the rule again: the long-way turns (a) and (c) should go
   with it. The entries' 4° – 7° would remain.
2. **Time the entries from the frame the gizmo's ease and the piece's spring settle** (the first two frames carry 5.6° and 4.8° that the rule does
   not time), so the slower turn draws the base's route. A small design of its own, not built.
3. **Accept the far-out route as it was measured at `e7ff2ed`** and restore it: `git revert cb89bdd`. The figures are in §11.1.
4. Close in, unchanged: the rule there needs the square camera's pitch inside the one turn (`TILTED_POLE_CLOSE_IN.md` §12, option A).

No device look (rule 5).

## 12. LF3 — (v), the close-in roll the long way round: the root cause, measured (2026-11-17, an Opus agent — base `892b6a3`, the code of `0ab1f9f`)

**The result first.** It is NOT a branch cut (R-a): the blend is exact and its kept branches never flip. It is the framing's geometry near its
degenerate case (R-b): close in, at the side exit, the camera is 2° – 13° off the line from the piece to the aim and sees the two only 0.6° – 1.3°
apart. There the two angles `poseFramingTwo` blends — the camera's place round that line (φ) and the separation's angle on the glass (q) — swing tens
of degrees for a small move of the turn's end pose. The blend follows them, as it must, past the half turn. And when the two come under 0.5° apart
mid-turn, the framing gives up (`null`) and `zoneMixPose` draws the other drawing (about the piece) for the turn's last frames: a jump. The one rotation
about the piece draws the same turns straight (96° – 105° of path).

**The base.** LF2's rule is reverted (`cb89bdd`): the base is the one speed (6° a frame), not the timing rule. Every gate recorded at `892b6a3` into the
session scratchpad's `lf3/base`: identical to LF2's base (`0ab1f9f`'s code) in every frame and every line (the replays 2794 / 2794 frames, the 27 + 6
level-entry walks, `tilt_check` every mode, `mid_check`, `across_check`, `ridge_check`).

**How it was measured.** A throwaway probe (never committed) recorded, every frame of every turn drawn by `zoneMixPose`: the start pose, this frame's
end pose, the piece, the share `k`, the angles kept (`FramingKeep`) before and after, the rule, whether the framing returned `null`, the pose drawn and
the pose about the piece. A replica of `poseFramingTwo` with its internals exposed reproduced every drawn pose to 0.0000°. The recording itself changed
nothing (every gate identical to the base).

**The four walks** (`Scene_0bis`, mode b of the gate; "off the line" = the camera's angle off the line piece → aim; "apart" = the piece and the aim seen
from the camera):

| walk, turn | apart at the start / end pose | off the line | what the frames show | drawn: one rotation / path / largest frame | about the piece |
|---|---|---|---|---|---|
| `b_ccw_p_close` f492 | 1.3° / 2.0° | 4° – 6° | φ1 moves 38° → 111° in 9 frames (the kept `dphi` 160° → 233°), q1 nearly still: the end pose's φ crosses the half turn, the blend keeps its way | 112.5° / **278.5°** / 26.6° | 102.0° / 105.0° / 9.3° |
| `b_ccw_p_d515` f442 | 0.73° / 1.19° | 7° – 12° | `dq` 168° at the first frame (near the cut), then 220° as q1 swings 50°; from frame 12 the two come under 0.5° apart: the framing `null`, the pose about the piece drawn for the 6 last frames | 102.0° / **342.7°** / **128.2°** | 102.0° / 105.0° / 9.3° |
| `b_cw_m_close` f428 | 1.2° / 1.1° | 3° – 4° | `dphi` 141° → 196° while `dq` 129° → 74° | 112.6° / **270.0°** / 19.2° | 96.0° / 97.7° / 6.7° |
| `b_cw_m_d515` f584 (and `b_cw_p_d515` f578) | 0.64° / 0.64° | 6° – 7° | the framing `null` from k 0.53 (0.77): the drawing switched inside the running turn | 96.0° / 132.0° (121.4°) / 23.8° (14.1°) | 96.0° / 97.7° / 6.7° |

**Why not R-a.** The kept branches (`nearestTurn`, `FramingKeep`) do exactly their job: each angle continuous from frame to frame. Taking "the short
way" again mid-turn would jump the picture by k × 360° — the very leap `FramingKeep` was built to stop (112° – 161° in one frame, 2026-11-14). The long
way is what a continuous blend of φ and q MUST draw once the end pose's φ has crossed the half turn — and it crossed only because φ is ill-conditioned
there: the end pose's one rotation from the start went 160° → 102° (closer), while its φ went 73° further.

**Why it is the geometry (R-b), and where.** φ is the camera's place round the line piece → aim; q the direction from the piece to the aim on the
glass. With the camera a few degrees off that line and the two under ~1.5° apart, both are angles of a very small circle: a millimetre of the end
pose's eye (its square camera turning beside the turn, the piece's spring) is tens of degrees of φ or q. Far out (the two 10° – 20° apart) they are
well conditioned. The drawing is decided ONCE, at the turn's first frame (`zm.rule`), from "not degenerate yet" (0.5° apart) — and these turns start at
0.6° – 1.3°, then drift under 0.5°.

**What is NOT this cause.** `b_ccw_m_d515` f446 (90.8° for 70.8°, ⚠ path) and the 4-frame first parts of the close-in side exits (12.1° – 12.2° in a
frame) are the two clocks of `TILTED_POLE_CLOSE_IN.md` §12 (the square camera's pitch running beside the turn) — not in this chain.

**Where the fix must go (step 2):** the choice of drawing at the turn's first frame, from the two end poses: about the piece where the framing is too
close to its degenerate case to be trusted, or where its own path would exceed the one rotation. Never switched inside a running turn.

## 13. The deploy, the owner's look, the chain stopped on his word (2026-11-17, evening)

* **Deployed** (the owner: *"deploy the fix"*): live `main` `c343c4f` = `1.0.147-` at `892b6a3` (20:46) — `src` and `tests` equal to `3ef7ba7`: (A)
  alone; 165 files, 2062 vectors.
* **His look**: *"I am happy with the build as it is now. Is it necessary to continue the chain ?"* — it was not: only LF3 was left, for a defect he
  had not reported. His word: *"stop the chain and clear its leftover processes. save the builder's unfinished prototype as a patch outside the
  project, then restore the folder to the deployed commit. record in the documents the deploy, the stop on your word, and the open point. Do not audit
  yet. I want to check one thing before"* (§14).
* **Stopped at 21:13**: LF3 in its step 2. KEPT: §12 (the root cause, `3553f79`). NOT in the tree — its prototype, never committed, not audited:
  `lf3Drawable(a, b, A)` in `src/input/orbit_tilt.ts`, asked ONCE at a turn's first frame from its two end poses (`zoneMixPose`: `zm.rule` 0 → 2, the
  turn drawn about the piece, never switched inside a running turn): the framing's blend walked in 16 steps; about the piece when the framing gives up
  on the way (`null`), when the piece and the aim come under **0.9°** apart, or when they come under **3°** apart AND the framing's path exceeds 1.15
  × the one rotation + 5°. Its only reading (the builder's, the gate's nine close-in walks; not audited): the four long-way turns drawn straight —
  `b_ccw_p_close` f492 278.5° → 105.0° of path for 102.0°, `b_ccw_p_d515` f442 342.7° → 105.0°, `b_cw_m_close` f428 270.0° → 97.7° for 96.0°,
  `b_cw_m_d515` f584 132.0° → 97.7°; the two-clocks turn (`b_ccw_m_d515` f446, 90.8° for 70.8°) as before. NOT read: the replays, `tilt_check`,
  `mid_check`, the far-out walks; no vector. The patch (97 lines): `orbit_charts_lf3_prototype_2026-11-17.patch` in the folder `_saved_patches` beside
  the worktrees.
* **The code now**: `src`, `tests`, `scripts` = `892b6a3`'s, byte for byte; the worktree clean.
* **Step 3** (the audit of the whole diff, the final docs): NOT run — *"Do not audit yet"*.

**Open — none is owed for the build the owner is happy with; each waits for his word:**

| # | open point | where it stands |
|---|---|---|
| 1 | Close in on `Scene_0bis`, at a corner's side exits the picture rolls the long way round (262° – 274° for ~105°, up to 128° in one frame) — in the live build; not reported by the owner | the root cause §12, the prototype above; reopened if it shows on a game scene |
| 2 | `Scene_0bis` far out: the entry turn onto the bottom near an end (25° – 45° in 6 – 9 frames), the two opposite turns of a corner loop | as built; (iv′) reverted — his options §10.3 |
| 3 | One rule for every tilt (333 ms / 250 ms), with it the top ridge's half turn *"50% faster"* | reverted — his options §11.2; the ridge as built |
| 4 | The 27° back over the entry edge near an end (the calm's look) | never studied (§8) |
| 5 | A fast orbit over many edges: the turns merged | PROPOSED §14 |

## 14. A fast orbit over many edges — one follower instead of a train of turns (PROPOSED 2026-11-17 — ✅ the owner's go that night: the build as briefed and as built → `FAST_ORBIT.md`)

**The owner** (verbatim): *"when I orbit fast, the gizmo travels fast on the orbit's surface. This is not a problem for large surfaces such as the
cube of scene 1 but this is an issue on the spit heptagon in scene 0bis because there are a lot of edges and corners and each crossing triggers a
movement of the camera: orbiting fast creates a lot of rapid movements of the camera. Is there a way to smoothen these movements, for example by
smoothing the curve of the camera movement between an initial quaternion and a final quaternion and ignoring the intermediate quaternion (this would
avoid unecessary turns if the intermediate quaternions are caused by intermediate crossings of edges or corners) ? Do not build: check the patent-free
state-of-the-art literature, propose something."*

**Measured, from recordings already on disk** (the session scratchpad's `lf3/base` = the deployed code; the gates' scripted replay, the SAME finger on
each scene, 2794 frames = 46.6 s; a transition's turn = the recorder's `mix`; no new run):

| scene | a transition's turns | their frames (the gizmo held) | under 15° / 15° – 45° / 45° – 100° / over 100° |
|---|---|---|---|
| `Scene_0bis` | **22** | 229 (8.2 % of the play) | 4 / 6 / 9 / 3 |
| `Scene_0` | 4 | 33 (1.2 %) | 2 / 0 / 2 / 0 |
| `Scene_1` | 4 | 40 (1.4 %) | 2 / 0 / 1 / 1 |

On `Scene_0bis` 14 of the 22 turns start within 30 frames (half a second) of the end of the one before, in 6 trains: 90° (16 frames), 5° (1), 174°
(30) inside 1.08 s — 282° turned, the train's last picture 116° from its first; 55° (10), 91° (17) inside 0.50 s — 160° for 68°; 120° (21), 32° (6) —
170° for 91°. The 6 trains together: 1034° turned, 688° first to last. ⚠ A crude upper reading of what merging could save: "first to last" includes
the orbit's own motion between the turns, and with the gizmo free the walk itself would differ. ⚠ The square camera's own turns close in (they hold
the gizmo too) are not counted. ⚠ No gate walks faster than 6 px a frame. At 4 px a frame the corner walk (`b_ccw_p_far_px4`) dithers across the
bottom's edge: 119 turns of 2° – 4°, two frames each, the gizmo held each time — LF1's builder read it as the probe's steering; a finger running along
an edge would do the same (not shown on a device).

**Why today's game cannot merge them.** T5 (2026-11-10: *"once the tilt starts, it cannot be rolled back … and shall complete"*, the decision *"1-b"*,
`POLAR_ORBIT_CLEANUP.md` §9.7): every turn runs to its end on its own clock and **the gizmo is held meanwhile** (`tiltClampStep` → `turnHoldsGizmo`:
each orbit step refused, the finger's travel dropped, the coast stopped). So the next crossing can only come AFTER the turn has ended: there is never
an intermediate target to skip, and a fast finger gets stop – turn – go – stop – turn. His idea needs T5 relaxed where it has no job. ✅ The other half
exists already: a change of frame arriving while a turn runs starts the new turn FROM THE PICTURE SHOWN (`zoneSwitch`, `seamTurnStart`,
`freeFaceFrame`: `from: poseShown(st)`) — the turn before is left where it was.

**The literature** (the test applied for "patent-free": published in print over 20 years ago, or a patent listed as expired — ⚠ a reading of dates,
not a lawyer's opinion):

| technique | source | what it gives here |
|---|---|---|
| The one rotation between two orientations (slerp) | Shoemake, *Animating rotation with quaternion curves*, SIGGRAPH 1985 | the straight turn between two pictures — the game's `poseAboutPiece` already |
| A critically damped follower: it chases a target that may move or be replaced, never overshoots, keeps its speed across a change of target | Lowe, *Critically Damped Ease-In/Ease-Out Smoothing*, Game Programming Gems 4, 2004, pp. 95 – 101 (the engines' "smooth damp"); second-order tracking in control theory, far older | the camera eases toward the NEWEST target; a target replaced before the ease has built up leaves almost no trace |
| Arrive: full speed, then slowing so as to stop on the target; re-aimed every frame | Reynolds, *Steering Behaviors For Autonomous Characters*, GDC 1999; the trapezoid speed profile of motion control | a bounded speed (the one speed) with an eased end |
| A band at a trigger (hysteresis) | classic | T11's band, already |
| Moving round an object close to its surface: the camera turned EARLY at a corner by looking ahead along the motion, the motion clipped, an optional smoothing of the eye and the aim | Khan, Komalo, Stam, Fitzmaurice, Kurtenbach, *HoverCam*, I3D 2005; US 8,044,953 (priority 2002-06-28; listed expired, 2025-01-18) | the look-ahead — ⛔ NOT proposed: it changes what drives the camera (out of scope), and needs a forecast for each kind of trigger |
| A transition as an offset on the new target, faded out | Bollo, *Inertialization*, GDC 2018 | the same result as Lowe's follower — ⛔ NOT used: recent, its patent status not established |
| The survey | Christie, Olivier, Normand, *Camera Control in Computer Graphics*, Computer Graphics Forum 27(8), 2008 | where reactive (follower) methods stand against planned paths |

**The proposal — ONE FOLLOWER, three parts, each measurable alone:**

1. **The newest target wins** — as coded today when a turn is replaced: a crossing never queues a turn, it redirects the running one from the picture
   shown. Nothing to build: it only shows once part 2 lets a second crossing happen.
2. **The gizmo is not held for a turn under 90°** (`turnHoldsGizmo`): the finger goes on, read off the picture drawn (as a spit's `zoneFinger` reads
   it today). Over 90° (a ridge's or a far edge's half turn, where the finger's reading flips) today's hold and T9's dy hold stay; the close-in
   entries (T10) and the square camera's own turn stay.
3. **The pace eased** (a critically damped follower, its speed capped at the one speed): the first frames of a turn are small, so a target replaced
   within about a tenth of a second is almost never drawn (his *"ignoring the intermediate"*), and a small turn no longer reads as a jitter (his
   criterion of 2026-11-17; what LF2's rule was for). ⚠ LF2's lesson binds it: a pace changes the PATH far out (the gizmo's ease, the piece's spring,
   the two-target drawing) — so part 3 is measured after parts 1 – 2, alone, with the path gate.

**What it bends, said before any build:** T5's *"the gizmo held while it runs"* (under 90°) and *"cannot be rolled back … shall complete"* (a turn may
be REDIRECTED by a new crossing — never undone by the same crossing inside the band, T11). The reasons he gave for T5 (R1 no oscillation at an edge,
R2 never left half done, R3 a bounded speed) are kept by: the band (R1), the follower always arriving at the newest target (R2), the cap (R3).

**Obstacles, and the fallback for each:** (a) a finger running ALONG an edge — crossings in a row, the picture between the two frames' — the band; if
it still shows, a turn redirected BACK within a few frames keeps the hold (today's rule there); (b) T6 — during a redirected turn the picture is not
yet upright on the face under the gizmo: bounded by the turn's own time (≤ 0.25 s under 90°); (c) the two-target drawing restarted mid-turn near its
degenerate case (§12): today's defect, not a new one — but more restarts; (d) close in, the square camera's pitch beside the turn (the two clocks):
out of this proposal — far out and part way first.

**Looked at and not proposed:** a wait before every turn (a lag at every slow crossing — against T4); a forecast of the next crossing (five kinds of
trigger to forecast); fewer frames at speed (reopens what drives the orbit).

**Before any build:** his word; then a throwaway prototype (parts 1 – 2 are one predicate), measured headless on the three scenes with FAST walks
added to the gate (20 – 30 px a frame: round the corner, along an edge, over the ridge), read with the path gate and the free roll; his look; then
part 3.

**No drift — the owner's question** (2026-11-17: *"The newest target wins: how is it done. How do you make sure that after an orbit moving the gizmo,
the final transform of the camera of today's built will be the final transform of the camera with your new build i.e. no drift will happen by
redirecting the running turn instead of queuing the turns."*), answered from the code:

* **How a turn is made** (the camera's stage in `green_box_wiring.ts` → `zoneMixPose`): every frame the TARGET pose is built from the state alone
  (`cameraFrameNow`: the frame the orbit is in, its angles, the heading carried on a free face, the spit's side, the calm, the square camera). A turn
  (`asmZoneMix`) is a fade laid over it: a snapshot of the pose shown at its start (`from`) and a share `k` 0 → 1; the pose drawn lies between the
  snapshot and THIS frame's target. At `k` = 1 the turn is deleted and the pose drawn is the target itself (`zm === null → return to`). A turn writes
  nothing into the state. Redirecting = the turn replaced by a new one whose snapshot is the pose shown at that instant (`from: poseShown(st)`, `k` 0
  — `zoneSwitch`, `seamTurnStart`, `freeFaceFrame` today).
* **So nothing is summed.** The final camera is not the start plus the turns played: it is the target of the final state. Three turns one after the
  other, or one turn redirected twice, end on the same pose to the last bit — IF the state is the same. A change of frame SETS every angle from the
  map at the gizmo's exact place (`seamRebase`); it adds nothing to them.
* **What must hold: the state never reads the fade.** What reads it today (every use of `asmCamLast`, `cameraPrev`, `drawnDir`, `dirAt` read): (1) the
  finger (`zoneFinger`: the picture drawn — the rule, the gizmo goes the finger's way on the glass); (2) a free face entered with NO entry edge — a
  pick-up on it, or the gizmo over a whole face in one frame (`freeEntryHeading`'s fallback: the layout nearest the up drawn); (3) a zone's switch
  exactly at a pole of the world's map (`poleYawKept`: the heading of the direction drawn, eased with the turn). ⭐ `shownHeading` already reads the
  TARGET's frame (`cameraPrev`, set before the fade). Today the gizmo is held, so (2) and (3) nearly always read a settled picture. In the proposal
  (2) and (3) read the TARGET (`cameraPrev`'s up, the direction without its ease) — the value today's settled picture gives. (1) stays: it is why the
  gizmo's ROUTE under a fast finger will differ from today's (today that travel is dropped) — the camera for a given route does not.
* **Route, not drift.** For one end place the camera depends on the ROUTE already, by the owner's rules (the heading carried onto a level face by its
  entry edge, the spit's side, the tilt's latch and bands). The claim: the same route of faces to the same place → the same camera as today's,
  exactly. ⛔ NOT claimed: the same finger gesture → the same end place (today's hold drops finger travel; that is what goes).
* **How it is checked, in the prototype's gate:** (i) on every frame with no turn running, the pose drawn equals the target, to the last bit; (ii) a
  fast walk recorded in the prototype (the orbit's angles, frame by frame), then the SAME angles replayed with every turn whole at once
  (`tiltRollDegS` 0 — no fade at all): on every frame the state identical (the zone, the tilt's frame, the heading carried, the spit's side, the map's
  angles), and at the end the camera's transform identical to the last bit. A difference names a reader of the fade — found and corrected before any
  build.
