# ONE CARRIED UP — the picture's up turned only by what the finger asks (branch `1.0.148e-`, packet E, 2026-11-20)

> The fifth rebuild of the upright picture, and the first one that does not compute the up near the vertical from the eye's direction. Its study
> is packet A (`UPRIGHT_ONE_POSE.md` §17 on `1.0.148d-`); the owner accepted its verdict on 2026-11-20. Built behind ONE switch, `uprightCarried`
> (1 on this branch; 0 = `1f62928`, law U with his defaults and 520° a second, frame for frame).

## 1. His words (verbatim)

* His verdict on one pose (`UPRIGHT_ONE_POSE.md` §16 on `1.0.148d-`): *"scene 0bis: the dy hold is solved, the entry and exit from slanted to level
  face is solved … however the entry and exit from the triangle to the level face triggers a jitter back and forth of the camera which prolungates
  deep inside the level face (it looks like the camera does not know what to choose between the calm and the pitch), when I travel with dx around
  the corned of the zenith edge there is a lot of camera movements (which are correct) because there is no hold when I cross the zenith edge and go
  back to the triangle and back to the zenith edge from the other side etc. (check if a dx hold would do without adding too much complexity to the
  user's inputs) - scene 0: when I travel and exit along the zenith edge in polar orbit there is jitter of the camera, tilted-pole orbit is good.
  - scene 1: lot of camera movements when I travel along the dy on the level face during polar orbit (it seems like the camera rotates in pitch and
  roll to reach a full vertical square alignment on the pole: maybe we don't need the roll alignment and it can be deferred to when a dx is
  inputted during this travel). Tilted-pole orbit is good. Analyze and if patches won't fix this properly, start again (initial branch 1.0.148b-,
  new branch, lessons learned from all previous builds, deep root cause analysis, new logic with no patch)"*
* On packet A's verdict: *"ok with your recommendations except 4: the dx shall be hold only if the crossing by dx triggers a camera realignment.
  5: I will not record yet. Fix the rest and I will test if this persists or not. I believe this is a consequence of your rebuilds"*.

## 2. The lessons of every build (ten lines; the details where they are)

1. `1.0.148b-` law U (`UPRIGHT_PICTURE.md` §1 – §14): upright by a weight of the view's angle; near the vertical the weight hands the roll to the
   logic, whose turns show there (the circle, the jitter); entering or leaving the band its own rest made a second turn (the quick 180°).
2. `1.0.148c-` V1 and its fix (`UPRIGHT_PICTURE.md` §15 – §17 there): the half turn paced by the view had no moment; given one by the view, it came
   late (the hold 97 – 103 mm past the edge). A turn's moment is the logic's crossing, never the view.
3. `1.0.149-` (`UPRIGHT_AT_THE_SOURCE.md` there): the study of an upright logic at the source; L5 — a pass over the vertical needs ONE half turn.
4. `1.0.148d-` one pose (`UPRIGHT_ONE_POSE.md` §11 – §17 there): ONE pose and ONE half turn at the logic's crossing work (the circle gone, the dy
   hold as `1.0.147-`); but near the vertical its target IS the logic's pose — and the logic computes its heading FROM THE EYE'S DIRECTION.
5. Packet S (§14 there): the frames over 45° are the orbit's swing and the logic's heading rules, not the band weight; the half turn's sense the
   short way runs against the roll before it (the jitter at a pole); the "held" gizmo kept moving 100 – 250 mm a frame.
6. Packet A (§17 there): on his own play, outside the crossing turns, the camera moves by itself 172° a second near the vertical (law U 161,
   `1.0.147-` 25): the eye crosses the pole region 4 times faster since the fast orbit, and the three heading rules turn ~0.9° of roll per degree.
7. ⭐ So the up near the vertical must be a STATE moved by what the finger asks — never recomputed from the view. No up computed from the view is
   continuous at the pole (the hairy ball); a patch on one heading rule moves the spin elsewhere.

## 3. His decisions as they bind the build

* **E-D1** — ONE CARRIED UP behind `uprightCarried` (1 here; 0 = `1f62928` frame for frame).
* **E-D2** — near the vertical every alignment of the up (a level face's square layout, the spit's side, back to upright) is paid ONLY out of a dx
  he makes; never by itself. A dy never rolls the picture.
* **E-D3** — the calm's PITCH toward a face's middle is kept; only the roll is deferred.
* **E-D4** — the push that crossed: the dy as OP8 on `1.0.148d-` (set on the crossing's frame with the logic's sign — kept exactly); a crossing
  made by a dx is held ONLY IF it triggers a half turn of the up; otherwise nothing is held.
* **E-D5** — no recording of `Scene_0`'s zenith-edge gesture: he judges whether that jitter persists.
* **E-D6** (2026-11-20, after the first measurement — his *"agree with your recommendation"*) — leaving the pole, the up's leftover misalignment is
  paid OUT OF THE dy THAT LEAVES (by the view's way out of the vertical, as `heldOffsetStep`'s descent), never by time: the picture's roll moves only
  while his finger moves. Near the pole E-D2 stands. The half turn unchanged (520° a second). It bends E-D2 on the way OUT only. Built in §7.2.
* From the studies, inside the one rule: the half turn's SENSE by continuity; its pace `uprightMaxDegS` (520° a second); T5 as written — the gizmo
  REALLY still while the half turn closes (the orbit's spring and the coast stopped too); a slider whole / never.

## 4. The design — ONE CARRIED UP

### 4.1 In plain words
The logic still computes its pose `G` each frame (where the camera is, where it looks, an up from its heading rules). The picture is `G` turned by
`φ` about the framed line — one pose's frame (OP1: drawn AND read, one glass). What changes is how `φ` moves. Each frame the picture turns about
the line only by the turn the FINGER ASKED (`τa`); whatever else `G` turned by itself (`τ − τa`) is taken back into `φ`. So a dy never rolls the
picture, a dx at a pole turns it with the turntable, and far out an upright picture stays upright. Three things alone move `φ` toward its
target: a dx (near the vertical, `k` degrees per mm of finger dx), time (far out only, beyond the band, at `uprightMaxDegS`), and the ONE half
turn at the logic's crossing.

### 4.2 The rules (pure, `src/input/upright.ts`, `upCarried`; angles rad in code, degrees in sliders)
* **C1 — the turn asked** (`askedTwist`): the twist about the framed line of the turn an honest camera makes for this frame's eye motion — away
  from the vertical the UPRIGHT camera's (an upright orbit's own roll is asked); near it the TURNTABLE's, the drawn orbit's yaw step about its
  pole axis; between (15° – 30° of the view from the vertical) the two blended by a smoothstep of the view. A weight on an INCREMENT never steps
  the picture (packet S's lesson was about weights on a target). 0 on a frame whose logic frame changed.
* **C2 — the carry**: `φc = φ − c · (τ − τa)`, `τ` the logic's twist over the frame (`twistAbout`), `c` the square camera's complement `κ`
  (1 far out; close in the picture follows `G`, as today).
* **C3 — the target** (one pose's OP3, unchanged): `T = w · h · α` — the logic's pose inside the band (its square layout, the spit's side),
  upright beyond it, a pose more than 150° from upright never blended.
* ⚠ **C4 as first built** (amended by fix round 1, §7.2 — kept as the record) — **the alignment, paid**: not in a half turn, `φ` moves toward `T` by at most `β`: near the vertical (`w` < 1) `β = k · |dx|` (mm of the
  finger's dx this frame, `uprightAlignDegPerMm`); beyond the band (`w` = 1) `β = uprightMaxDegS · dt` too. Close in (`κ` < 1): `φ = T`.
* **C5 — the half turn**: on the frame a logic change is applied at once (OP2: far out every change is), the jump is carried whole (`τa` 0) and
  `e = φc − T`; `|e| ≥ 90°` opens THE half turn. Its sense: within 30° of 180° the way the picture rolled over the last 100 ms (2° or more),
  else the short way; re-decided only by a later change. It closes in time at `uprightMaxDegS` whatever the view does.
* **C6 — the holds, from the same answer** (OP8 + E-D4): at that change, a half turn opened → the dy that crossed held as OP8
  (`holdAtCrossing`, the logic's sign); the logic's sign 0 and a dx pushing → the DX held (`dir` `[sign, 0]` on the glass he sees, released as
  the dy's: `edgeHoldMm` back); no half turn → no hold (a hold still on ended, as OP8).
* **C7 — T5 made real**: while a half turn is under way (`uprightHalfHold` 1) the orbit's target is set to the orbit DRAWN, its spring stopped,
  the coast stopped, and new steps refused (`tiltClampStep`): the gizmo stands still until the turn closes.

### 4.3 One owner per thing

| the thing | its one owner | read by |
|---|---|---|
| the logic's pose, its frame, its crossings and their dy sign | the logic (`spitStep`, `freeFaceExit`, `crossTurn`, `crossingHold`, `exitHoldSign`) | — |
| the turn the finger asked this frame | `askedTwist` (C1) from the drawn orbit's yaw step, the pole axis, the views | `upCarried` |
| the picture's up (every frame) | `upCarried` (C2 – C5) — the ONE writer | the camera, `asmCamLast`, the silent entry, the finger |
| what the up should be (the target) | the logic's heading inside the band, gravity beyond (C3) | `upCarried` only |
| the alignment's budget | the finger's dx this frame (`asmFingerDxMm`, pointer wiring) | `upCarried` |
| whether a change is a timed turn | `changeSeen` with the square camera's authority `κ` (OP2) | `changeApply` |
| the half turn: moment, sense, pace | `upCarried` on the frame of the logic's change | C6, C7 |
| the push held | C6, written once at the change (`carriedHold`) | `edgeHoldGlass` |
| the gizmo still | C7 at the orbit's spring + `tiltClampStep` (T5's one reader) | the orbit |
| close in, the tilt, the tilted pole | the square camera, the tilt, as today (`κ` 0: the picture IS `G`) | — |

### 4.4 The cases
* **`Scene_1`, a dy across the top far out** (world branch): `cameraHeading` blends to the level reading between 50° and 60° of pitch — a roll
  of `G` no finger asked: carried back into `φ`. The picture does not roll; a dx later pays the square alignment.
* **`Scene_0bis`, the level face**: `freeShownHeading` keeps turning by time toward a target that moves with the eye: carried back. The calm's
  pitch is the eye's direction, not the up: kept (E-D3).
* **The spit near the top**: `spitCameraHeading` swings with the eye's level part: carried back; the side's flip is the crossing: one half turn.
* **A dx at a pole** (`Scene_1`'s top, the turntable): asked — shown 1:1.
* **Far out, away from the vertical**: the upright camera's own roll is asked; `G` upright beyond the spit's bias and the world's level reading,
  so `φ` stays near `T`; a residue closes at `uprightMaxDegS` beyond the band.
* **Close in**: `κ` 0 — the picture is `G`; the square camera's and the tilt's timed turns as today.

### 4.5 Prior art — patent-free, no widget
Blender's turntable and the trackball's carried orientation (the camera turned by the orbit's own rotation); the rotation-minimising frame
(Bishop 1975); the hairy-ball seam placed once (the half turn at the crossing); a slew-rate limit for the half turn; phase unwrapping for its
sense; a budget paid out of the operator's own input (the held offset, `heldOffsetStep`, 2026-11-13). Nothing here is known to be patented.

## 5. The gates (BRIEF_E §5 — his symptoms first)

| gate | the bar |
|---|---|
| `his.mjs` moves not asked outside the half turns, his ten stretches (°/s: view < 20° / 20 – 50° / 50°+; level face; zenith; tip) | `1.0.147-`'s: 25 / 17 / 9; 16; 43; 8 |
| `Scene_1` dy across the top (`s4.jsonl`): roll not asked | 0° (law U: 48°) |
| back and forth (his reader) on the level face and leaving a pole | not above `1.0.147-` |
| half turns: one per crossing, sense by continuity, the gizmo still while it closes | 0 same-way re-crossings; 0 mm |
| the dy hold walks | `z_far` / `b_far` as `1.0.147-` |
| gravity over 20° · its roll a metre | not above `1f62928`'s (law U at 520) |
| frames turning the camera over 90° / 45° | not above `1f62928`'s |
| R7 away from the vertical | not above `1f62928`'s |
| close in (κ 0), 143 frames a second, `Scene_1` over its top | as `1f62928` (φ 0 where κ 0) |
| identity: `uprightCarried` 0 | frame for frame |

## 6. The build as commits
(D) this spec · (C) `upCarried`, `askedTwist`, `carriedHold`, `dxSignPushing` with vectors red on named mutants · (C) the wiring behind
`uprightCarried` (`carriedFrame` at the camera stage, the dx budget and sign in the pointer wiring, C7 at the orbit's spring), source tests ·
(P) the probes' record of the carried fields · the measurement · (D) the section as built and measured, `TUNING_MENU.md`, `RND5.md`,
`ORBIT_GATES.md`.

## 7. As built and measured (fix round 1, 2026-11-20 — the builder; the kit's `fo3/rebuild_e/CHECKPOINT_E.md` holds every figure)

### 7.1 The first build measured (`28a29ca`, the lead's batch) and the roots read on its recordings
* **The gizmo "held" moved** on 213 frames of his ten stretches (12.3 m): all in a spit. 131 are the half turn's first frame — the gizmo is drawn
  from LAST frame's solve (`assemblyFrame` runs before the solve, every frame), and the spit's crossing is asked at the camera's stage by `spitStep`
  AFTER this frame's solve, so frame i+1's gizmo shows the place frame i's camera already showed. Deciding the turn before the solve would need a
  second decider (the logic's pose `G` exists only at the camera's stage) — not built. The other 82 (145, 100, 26 mm over 2 – 3 frames): C7 reset the
  orbit to the solved place but the solve still ran, and `orbitFrame` read the reset as a finger step BACK (its last target was ahead by the work
  cap's backlog) — the backlog dropped as a reversal.
* **`Scene_1` over its top** (3 reversals, one frame of 35.8°): the dx's budget, 3° a mm, is 16° a frame at 20 px a frame — as large as the
  turntable's own turn: the picture rolled back.
* **R7 with φ ≥ 5°: 27.9°**: `fingerAtEntry` turned the finger from the picture onto the logic's glass for law U only; under the carried up the
  finger outside a spit reached the logic raw — read as if on `G` while he saw `G` turned by φ.
* **The tips' 64° a second**: at a tip the view is level (`w` 1) and the TIME alignment chased a target that fades toward the spit's `G` when `G` is
  90 – 150° off upright (OP3). His reader's measure (gravity on the glass) is the owner's own rule (no scene roll on screen): the measure stands.

### 7.2 Built (`38a2fdd`; vectors red on 20 of 20 and 10 of 10 mutants — the kit's `mut_f1.json`, `mut_wire_f1.json`; verify 172 files / 2 197)
* **C4 amended — the alignment paid by the finger alone, never by time** (`upCarried`): a dx at most `uprightAlignPerYaw` (0.5) of the drawn orbit's
  yaw step; the dy that leaves the vertical (E-D6) the gap's share of the way out of the band, `(w − w last) / (1 − w last)`; beyond the band a view
  still leaving pays the rest; the whole at most `uprightMaxDegS` a second. A dy toward the vertical, or no finger: the picture stays.
* **C7 made whole**: while the half turn holds, NO SOLVE — the place is the target, the solver's memory of the target set to it, a travel of the
  rig's blend asked meanwhile refused (`green_box_wiring.ts`).
* **The finger outside a spit** turned from the picture onto `G` (`fingerAtEntry`, as law U); in a spit as built (`zoneFinger` reads the picture).
* The slider `uprightAlignDegPerMm` (3° a mm) replaced by `uprightAlignPerYaw` (0 – 1, 0.5); `asmFingerDxMm` deleted.

### 7.3 Measured (one batch, the kit's `drv_f1.sh` → `runs_f1`; law U at 520 = `runs/u_*`, not re-run)

| gate | law U at 520 | first build | fix round 1 |
|---|---|---|---|
| not asked outside the half turns, view < 20° / 20 – 50° / 50°+ (° a s; `1.0.147-` 25 / 17 / 9) | 130.7 / 81.6 / 20.0 | 48.9 / 76.7 / 44.2 | 59.5 / 102.9 / 41.7 |
| … on the level face / a tip / the zenith / a side (° a s; `1.0.147-` 16 / 8 / 43 / –) | 79 / 70 / 79 / 27 | 53 / 64 / 39 / 48 | 73 / 66 / 73 / 55 |
| `Scene_1` dy across the top, roll not asked (°; < 20 / 20 – 50 / 50+) | 88 (36 / 48 / 3) | 61 (6 / 10 / 46) | 250 (184 / 52 / 13) |
| the gizmo moving while held: frames over 1 mm (first frame / later) | – | 213 (131 / 82) | 139 (138 / 1) |
| gravity over 20° / over 90° (% of frames); its roll a metre | 28.9 / –; 94.4 | 28.6 / 11.2; 85.5 | 30.2 / 12.0; 95.9 |
| frames turning the camera over 45° / 90° | 33 / 2 | 10 / 0 | 11 / 0 |
| R7 away from the vertical (median; φ < 5° / φ ≥ 5°) | 13.0 | 15.3 (13.8 / 27.9) | 14.9 (13.6 / 23.9) |
| re-crossings under a steady push (`ht_read` A5) | – | 31 | 51 |
| the seeded replays, gravity over 20° (heptagon / `Scene_0bis` / cube, %) | (720: 0.2 / 4.5 / 1.1) | 18.8 / 4.6 / 20.3 | 5.2 / 8.7 / 3.9 — over 90°: 1.0 / 1.2 / 0.9 (0 before) |
| `Scene_1` over its top: reversals, worst frame | (720: 1, 22.4°) | 3, 35.8° | 6, 30.5° |
| the dy hold walks `z_far` / `b_far` s0, s1 | as `1.0.147-` | blk 113, surf 11 / 12, never back | identical |
| close in (φ 0 where κ 0); 143 frames a second (frames over 45°); identity (`uprightCarried` 0) | – | met; 0; exact | met (2 843 frames); 0; exact |

* **F-E3 answered** — the 8 "blocked" frames of the come-backs s2 – s5 are frames 22 – 29 of the `come` leg, AFTER its second crossing (frame 20, a
  new dy hold): the dy hold holding the push the walk keeps for 10 frames. In `1.0.147-` those frames were inside a timed turn (`mix`), which
  `hold_walk_analyse.mjs` excludes; the half turn is no `mix`. The come-back is honoured at its first frame, as in `1.0.147-`. Not T5: with
  `uprightHalfHold` 0 the 8 frames stay (and s0 / s1's surface slide grows to 79 – 190 mm: T5 is what keeps it at 11 / 12). `b_far` s3 / s5: each
  sub-walk starts where the last one left (path dependence), not a rule.

### 7.4 What still fails, and why (read on `runs_f1`; NOT fixed — one batch in this launch)
* **A dy near a pole pays the alignment** (`s4` < 20°: 184°; the zenith 73° a second): the dx's budget reads the drawn orbit's yaw step, and a dy
  passing near the pole swings that yaw. Root: the budget must be the yaw THE FINGER'S dx asks (its mm × the orbit's yaw gain × 0.5), not the orbit's.
* **Time in disguise beyond the band**: "a view still leaving pays the rest" fires on any outward drift of the view — the spring settling after T5's
  hold moves it a fraction of a degree a frame — so after a half turn the rest (46° on `ilmj_23s` f124 – 129) closes at 520° a second, no finger.
  Root: that payment must be proportional to the view's outward travel, not all or nothing. Related: a half turn ends on the target of its OPENING
  (the target moves while it closes) and leaves that rest.
* **20 – 50°: 102.9° a second** — the dy's share is paid toward the band's target `w·h·α`, which carries a share of the logic's own heading rolls;
  paid toward upright (`α − φ`, the picture's own angle, blind to `G`'s rolls) it would not leak.
* **An upside-down picture lingers** on the seeded replays (gravity over 90° on ~1 % of frames, none before): with no time, a picture carried over
  a pole with no logic change waits for a dx or a dy that leaves.
* The half turn's first frame (138 frames): the gizmo's one-frame catch-up on the spit's crossing (§7.1) — structural, the logic's order.

### 7.5 What he will feel (plain words)
The gizmo now really stops while the picture makes its half turn, except one small catch-up step on the first frame. Away from the vertical the
gizmo follows his finger better when the picture is turned. But over the top of the cube a straight dy now rolls the picture near the pole (it did
not in the first build), the picture still finishes righting itself after a half turn with his finger still, and leaving the pole it rolls more than
before. Not ready for his device: the three roots of §7.4 are one more round.

### 7.6 Sliders (CAMERA › UPRIGHT PICTURE)
`uprightCarried` (1; 0 = law U as at `1f62928`, frame for frame) · `uprightAlignPerYaw` (0.5; 0 – 1, step 0.05 — the dx's budget, a share of the yaw
step; `uprightAlignDegPerMm` before fix round 1) · `uprightHalfHold` (1; 0 = the gizmo never held by the half turn) · `uprightMaxDegS` (520° a second:
the half turn's pace and the alignment's bound).

## 8. Packet J — his verdict on the live build: the jumps at a level face (2026-11-20 afternoon — the kit's `fo3/rebuild_e/CHECKPOINT_J.md`)

### 8.1 His words (verbatim)
*"This implementation is good. There is only one thing I don't like: in polar orbit in scene 1 and in scene 0bis, when I leave or enter a level face or
a triangle face close to the level face, there are lots of jumps of camera and piece. But it does not seem to happen in scene 0. See my two recordings
of today in [his recordings folder]. Analyze vs. all the previous builds and if we can improve something."*

### 8.2 His two videos, by numbers (30 fps, the desktop, `Scene_0bis` far out; 19 frames looked at, downscaled)
* The first (22.9 s): the HUD's `last` line changes 38 times — onto / off the spit's level face (its bottom), each exit *"the camera turned N°"*
  (42° – 180°), and the spit's crossing three times. At one exit (looked at frame by frame): the PIECE leaps ~300 px on the glass in one video frame
  while the assembly stays, then the picture rolls ~40° and back.
* The second (19.0 s): the `last` line never changes — the same event repeating (the spit over the edge, near the tip and the top). With the mouse
  STILL: the piece leaps ~400 px in one frame, then the picture rolls +35° → −40° over 200 ms.

### 8.3 Reproduced, every build in one table
A reader of his words on his video's own frames (33 ms bins of a record, the kit's `j/jr.mjs`): a jump of the camera = its roll in a bin ≥ 10° and
≥ 3 × the bins around; of the piece = its step on his glass (742 px high) ≥ 120 px and ≥ 3 × around. A minute of play:

| build | his ten stretches (60 fps): piece jumps / fast ≥ 200 px / roll jumps | walks at 143 fps, `Scene_0bis` poles: piece / fast / max px | `Scene_1` over its top: roll jumps / max |
|---|---|---|---|
| `1.0.147-` (`freeTurnMaxDeg` 0) | 13.6 / 0.4 / 24.8 | 0.0 / 0.0 / 51 | 146.7 / 44° |
| FO3 S1 (`uprightPicture` 0) | 41.9 / 10.5 / 4.7 | 0.0 / 0.0 / 92 | 0.0 / 41° |
| law U at 720 (`74a247e`) | 40.7 / 9.3 / 101.2 | 4.9 / 4.9 / 225 | 126.7 / 43° |
| law U at 520 (`uprightCarried` 0) | 47.7 / 13.2 / 63.6 | 4.8 / 4.8 / 225 | 126.7 / 43° |
| one pose (`1.0.148d-`, `uprightOnePose` 1) | 117.9 / 61.3 / 95.8 | 38.3 / 33.5 / 340 | 130.6 / 45° |
| **the live build** (`28a29ca`) | **112.8 / 67.1 / 67.9** | **45.0 / 30.0 / 356** | 50.7 / **79°** |
| fix round 1 (`38a2fdd`) | 112.1 / 59.3 / 63.2 | 42.9 / 32.2 / 362 | 55.0 / 54° |
| **this fix** (`uprightFraming` 1, `a3eb6c3`) | **38.8 / 17.8 / 81.8** | **5.0 / 0.0 / 147** | 50.7 / 79° (unchanged) |

(Walks, `j/drv_j.sh`: a dy across `Scene_0bis`'s bottom pole, round the tip, over the ridge, a loop; `Scene_1` over its top ×4; `Scene_0`'s bottom.)

### 8.4 The roots — two kinds, and why `Scene_0` is spared
* **(1) THE PIECE'S LEAP at a logic change — `Scene_0bis`.** Far out every change of the logic is applied at once (one pose's OP2, kept by the carried
  up), and the carry takes back only its ROLL, as a turn about the framed line — the line through the piece and the look point. A turn about that line
  keeps both exactly where the logic's NEW pose frames them; and a change moves the framing, because the logic's camera offsets turn with its heading
  (at a change its eye moves 2.3 m — median — against 0.26 m on other frames, its view 17.6° against 2°). So the piece lands, in ONE frame, where the new
  pose frames it: on his ten stretches the piece's step at the 386 changes equals its step on the logic's own glass at every one (median 103 px, up to
  400), 64 jumps a minute; the world stays (the roll is carried), which is why it reads as the piece jumping round the assembly. ⭐ It is the snap the
  owner reported and had cured on 2026-11-14 (*"the piece still snaps 180 degrees diagonally …"*: a zone's turn from the pose on the glass, the piece
  and the aim each carried straight on it — `zoneMixPose`, `poseFramingTwo`): applying a change at once skipped that turn. It came with one pose
  (38.3 a minute on the walks), not with the carried up. A level face's entry and exit, the spit's crossing and the tip next to the bottom are where
  the changes are; the level face's edge CHATTERS (in / out / in within four frames: 18 flips in 15 s of his stretch), each flip a change, each a leap.
* **(2) THE ROLL PAID BY A DX near the pole — `Scene_1` (also the bottoms).** No change there (no spit: no zone). A dy across the top is carried (the
  picture does not roll, E-D2), leaving φ up to ~100° off its target; the first dx pays it at `uprightAlignDegPerMm` 3° a mm on top of the turntable's
  asked turn — 13° – 18° a frame (2 400° a second) for 40 ms (`Scene_1` over its top: 79° in 33 ms; law U 43°). Rarer than law U's (50.7 against 126.7
  a minute) but the largest. The root is fix round 1's F-E4 (the budget unpaced); its cure there (half the orbit's yaw step) broke E-D2 — **not
  rebuilt here** (one fix alone; §8.7).
* **Why not `Scene_0`**: no tips — no spit, no zone, no change applied at once far out (0 on its bottom walk; the piece's largest step 103 px
  against 356 on `Scene_0bis`); its rolls (kind 2) few there (6.3 a minute).

### 8.5 The fix built — THE FRAMING CARRIED FROM THE POSE SHOWN (`uprightFraming`, 1 by default; 0 = `28a29ca` frame for frame)
* (C) `91168cd` first: fix round 1's code reverted (`src`, `tests` = `28a29ca`'s; its docs, §7, stay as the record). Then (C) `f33ef5c`, `a9c30c1`
  (built), `3a9f866` (a variant, measured worse, §8.6) and `a3eb6c3` (back to `a9c30c1`'s code: the build as it stands).
* The rule (C8, one owner: `carriedFrame`, the camera's stage — the pose DRAWN only): at a change applied at once, the drawn pose starts from the
  picture shown last frame, turned back by this frame's φ about the framed line — the whole of it, the piece's place then included (`framingFrom`) —
  and blends to the logic's pose by the 2026-11-14 rule (`poseFramingTwo`: the piece and the aim each carried straight on the glass; degenerate, about
  the piece alone — `framedPose`), then is rolled by φ as before. Its time: the change's own angle or its half turn's, the larger, at `uprightMaxDegS`
  (520° a second: 346 ms for a half turn), a smoothstep; a change meanwhile starts it again from the pose shown (the chatter: every change from the
  picture he sees); none close in (κ < 1: the square camera's, as before) — `framingStep`, `framingShare` (`src/input/upright.ts`).
* Untouched: φ and every rule C1 – C7 (the carry, the target, the alignment, the half turn and its sense, the holds, T5), the logic. The finger reads
  the pose drawn (`asmCamLast`, one glass), the next change starts from it.
* Vectors: 8 pure (`tests/upright_framing.test.ts`) + 4 wiring (`tests/upright_carried_wiring.test.ts`); 15 of 15 mutants red (the kit's
  `j/mut_j.json`). ⛔ The first build (`f33ef5c`) turned the pose and not the piece's place: at a half turn with his fast piece the blend started the
  piece from its mirror (589 px in one frame) — the vectors had a still piece; `a9c30c1` and a vector at φ = π with a moving piece.

### 8.6 Measured (`a9c30c1` = `a3eb6c3`'s code; one headless job at a time, hygiene clean after each)
* **The walks** (143 fps, `Scene_0bis`'s poles): the piece's jumps 45.0 → **5.0** a minute, the fast ones 30.0 → **0**, the largest step 356 → 147 px;
  at the 38 changes the piece's step drawn median 19 → 5 px, p90 323 → **13 px** (on the logic's own glass still 323: the leap now carried), jumps
  there 13 → **0**. `Scene_1`: identical to the live build (no change there: the turn never opens).
* **His ten stretches** (60 fps): the piece's jumps 112.8 → **38.8** a minute, fast 67.1 → **17.8**; at the 393 changes median 103 → **11 px**, p90
  280 → **28 px**, jumps there 166 → **0**. ⛔ The camera's roll jumps 67.9 → **81.8** a minute — all within 400 ms of a change (49.6 → 63.2; elsewhere
  18.2 → 18.6): the two-target rule ties the camera's roll to the piece → aim separation on the glass, so the leap Δ becomes a roll on top of the half
  turn (`vyah_11s` f100 – 110: no leap, but the roll starts late and peaks at 17.8° a frame against the half turn's steady 9°). `his.mjs`: back and forth
  136 / 71 / 89 → 139 / 65 / 98; moves not asked on the level face 53.3 → 76.5° a second, the tip 63.8 → 77.1, the zenith 39.3 → 46.0 — ⚠ that reader
  counts the CAMERA's moves: the leap was the piece's (the camera stood still), the glide that replaces it is the camera's.
* **The dy hold's walks**: all 24 rows identical to the live build's (`z_far` / `b_far` s0, s1 held, blk 113, surf 11 / 12, NEVER).
* **The identity**: `uprightFraming` 0 = `28a29ca` frame for frame (the 6 walks, `ilmj_23s`, `vyah_11s`: largest difference 0). `npm run verify`:
  173 files / 2 206 tests.
* ⛔ **A variant tried and reverted** (`3a9f866`): the eye glided round the look point instead (no roll of its own) — the piece sits 1.2 m in front of
  the eye, so the glide swept it across the glass: 158.6 piece jumps a minute on the walks (largest 553 px). The two-target rule is what holds the piece.

### 8.7 What still fails, and why (not built — one fix in this packet)
* **The roll the fix adds near a change** (above). The exact cure: a camera that keeps the piece straight on the glass, the assembly at the centre AND
  the world's roll the carried one — the two-target (toric) placement with the roll as a constraint (one degree of freedom left: the distance); a study.
* **`Scene_1`'s roll paid by a dx near the pole** (kind 2, F-E4's root): the budget 3° a mm is unpaced. The consistent rule would bound it by the one
  pace of the picture's turns (`uprightMaxDegS`, as the half turn and the time alignment): 80° then takes 150 ms, not 40.
* **The level face's chatter** (in / out / in within frames, 18 flips in 15 s of one stretch): each flip is a change of the logic — drawn smoothly now,
  but still a turn each time; the flips are the logic's (not reopened).
* ⚠ **His recorder sessions on the external drive were read** by the hand replays of 14:11 – 14:18 (the kit's `stretches.json` points at them —
  found after the lead's amendment *never read that drive again*; read only, nothing written); the v3 replays were stopped. Copy them inside first.

### 8.8 What he will feel (plain words)
Entering or leaving the level face, or crossing near the tip, the piece no longer jumps across the screen: it slides there in about a third of a second,
and the assembly stays in the middle. The price: during that slide the picture turns a little faster than before (up to twice the half turn's speed
for a moment), so the camera may still feel busy at the level face's edge. On `Scene_1` nothing changes: its fast roll at the first dx over the top is
the other cause, not touched here. Not yet seen on his device.

### 8.9 The slider (CAMERA › UPRIGHT PICTURE)
`uprightFraming` — *carried up: a change drawn from the pose shown, the piece carried straight on the glass (1; 0 = at once)*: 1 by default; 0 = the
live build `28a29ca` frame for frame. ⚠ Fix round 1 reverted: `uprightAlignDegPerMm` (3° a mm) is the dx's budget again (`uprightAlignPerYaw` gone).
