# Entering a level face — why the picture shakes there, and what would stop it (2026-11-17)

> **STATUS** · ✅ **APPROVED BY THE OWNER 2026-11-17** (*"Agreed to every recommendation. Proceed."*) — the build as briefed: §9; as built: after it. A study with measurements (an Opus agent, 2026-11-17), on the code of
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
