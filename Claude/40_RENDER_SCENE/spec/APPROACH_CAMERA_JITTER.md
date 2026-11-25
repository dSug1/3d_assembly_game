# THE CAMERA'S JUMPS ON THE APPROACH — his records of 2026-11-24, replayed (a STUDY — nothing built)

> **STATUS** · ⏳ **A STUDY, 2026-11-24 — ⭐ HIS WORD 2026-11-25 (§7): A1-a and A2-a; ⭐ packet 1 BUILT (`a3d7446d` `pictureHandWhole`, `e591a9d2` `pictureBandWayIn`, both 0 = LIVE frame for frame) and GATED (§7.2: the unlatch's jump gone on every unlatch; `09fv_r01`'s swing 10 – 14° → 0.6 – 4.1°, the turn after the lift under 1°; ⚠ 4 of 10 unlatches still over the 2° swing gate — a cause outside the packet, measured: the follower PARKED on the camera's heading, §7.2). His look owed; not deployed.** The owner's four-part method: the rules (§2), the obstacle measured
> (§3), the fix options from the root (§4), the risks and the audit (§5); in plain words (§6). Code read on `00e59251` (branch
> `1.0.158from1.0.157-Orbit_surface`, LIVE main `df5426a`); the picture's chain (`picture_wiring.ts`, `picture.ts`, `camera_follow*.ts`, `roll_shadow.ts`,
> `seam_turn.ts`, `orbit_calm.ts`) is byte for byte the reference's (`2cd1be34` = LIVE `3b7a479`, `git diff` empty).
> **OWNS** · why the camera jumps when he takes the piece out of close in, and when he approaches a side face to its floor; what moves the gizmo's
> ring and its sections there.
> **READ WITH** · [PICTURE_REBUILD.md](PICTURE_REBUILD.md) §2 (P1 – P18), §4.3a (the hand-over); [TILTED_POLE_CLOSE_IN.md](TILTED_POLE_CLOSE_IN.md) §1
> (T1 – T12), §8 (the way out, C3); [CAMERA_FOLLOWS_GIZMO.md](CAMERA_FOLLOWS_GIZMO.md) §19 – §20; [UPRIGHT_LESSONS.md](UPRIGHT_LESSONS.md).

## 0. His words and his records (2026-11-24, `Scene_1`, his PC: 1536 × 742, dpr 1.25, ≈ 143 frames a second)

| record (`.recordings/`) | his words (verbatim) | the face | family |
|---|---|---|---|
| `2026-11-24T18-53-00_09fv_r01` (marks 2036, 3001, 3694) | *"when I take the piece back from top face, at one point there is a big jitter of camera"* | top | A |
| `…09fv_r02` (marks 8013, 8738, 9210, 9806) | *"jitter when I approach the piece with resting face aligned (several occurrences)"* | −x side | B |
| `…09fv_r03` (marks 13054, 13772) | *"jump of the camera when I take out the piece (2 occurrences)"* | bottom | A |
| `…09fv_r04` (marks 16913, 17406) | (not described; taking the piece out on a side face) | −x side | B |
| `2026-11-24T18-56-43_n2b8_r01` (marks 3153, 3722, 4155, 4686) | *"jump of the camera when I take out the piece"* | bottom | A |
| `…n2b8_r02` (marks 11411, 11884, 12521) | *"jump of the camera when I take out the piece"* | top | A |
| `…n2b8_r03` (marks 14066, 14480) | *"jitter of the camera when I approach the piece (2 occurrences)"* | front (−z) | B |
| `…n2b8_r04` (6 marks, 15887 – 17265) | *"I don't know why the gizmo and the red / green sections jitter when I approach or take out the piece"* | −x side | C |

⚠ His approach is **A held + the mouse's drag** (`pointer_wiring.ts` 41 – 74). The recorder keeps pointer events only, so a replay with the kit's
walker as it was (`walk_dr.mjs`) ORBITS where he approached (measured: `ap` never moved, the elevation did). The study's walker infers the key
frame by frame: a run of 3 rows or more of a press that moves the approach and not the orbit's angles says A held, one that moves the angles says A
up (`09fv_r02`'s press19 is an orbit, then A pressed in the same press; the other presses are one or the other).

## 1. The result first

* **Two families of camera jumps (A: three movers; B: one) and the ring's jitter (C)** — reproduced headless at his frames on `09fv_r01`, `09fv_r02`,
  `n2b8_r03`, `n2b8_r04` (`n2b8_r02` could not be replayed: it starts latched under a tilt; `09fv_r03`, `r04`, `n2b8_r01` read on his rows — the same
  signatures). None is a smoothing problem; each is an owner that reads the wrong thing at a boundary.
* **A — taking the piece out of close in (top / bottom; `09fv_r01`, `r03`, `n2b8_r01`, `n2b8_r02`).** (A1) At the unlatch the follower takes the
  picture from the latched close drawer; the hand-over holds the view's angles but NOT the look point nor the piece's place, which the latch's pending
  turn had carried with the piece: one frame moves the look point 35 – 366 mm, the piece 26 – 194 mm, the eye 48 – 193 mm. (A2) The hand-over's gap is
  read against an owner the band then moves by place, while the gap is paid by the way out's share: the view swings ≈ 14° off and, at the lift, back
  by time in 8 frames. (A3) The calm is released at the tilt-off by distance and re-calmed by time: the asked direction jumps 17° and the follower's
  reading 6.4° in one frame.
* **B — the approach to a side face's floor (`09fv_r02`, `r04`, `n2b8_r03`).** The close drawer's CARRIED UP rolls the picture about the framed line
  (piece ↔ look point). At contact the two are 12 – 65 mm apart and the line swings 46 – 90° off the view, its direction flipping when it crosses
  square to it: a carried roll (φ ≠ 0) about such a line swings the eye round the piece by 4 – 11° a frame while the logic's camera stands still
  (with φ = 0 the same line moves nothing). A long frame (24 – 50 ms) enlarges the jump (the 520°/s catch-up); it does not cause it — `09fv_r04`'s
  7.9° and 8.2° come on 9 and 12 ms frames.
* **C — the ring and the sections (`n2b8_r04`).** They are drawn at the exact gizmo PLUS the rig's base's lag along the face (the 2026-11-11 rule for
  the orbit). On the approach the base runs along the piece's oblique ray, so its lag is drawn as the gizmo's: the ring leaves the still gizmo by up
  to 33 mm and comes back, up to 40 mm in one frame.
* **Isolation (§3.6): all of it is the CLOSED ORBIT's.** At `landingDrives=0` (the drive before the surface work) A is identical (`09fv_r01`: within
  0.0005 mm on every frame), B is there (`n2b8_r03` identical; `09fv_r02` the same windows), C is identical (`n2b8_r04`); the picture's chain
  is byte for byte the reference's (`3b7a479`).
* **Recommended (each behind its own switch, nothing built):** A1-a the hand-over carries the whole pose; A2-a one payer on the way out (the band
  silent while the way out's turn lives); A3-a the calm carried out of the tilt as it is carried in (its horizontal share kept); B-a the framed line's degenerate case by its
  real condition, on the glass; C-a the ring shows the gizmo's travel lag only, not the approach's.

## 2. Part 1 — the rules in force

| id | the rule | where |
|---|---|---|
| **P1** | ONE owner of the picture at every distance | [PICTURE_REBUILD.md](PICTURE_REBUILD.md) §2 |
| **P8 = T10** | *"keep the camera orientation when the tilted-pole-orbit toggles on as long as the approach continue, then the camera blends … with the delta position mm"* — the latch's turn PENDING (k 0) while he only approaches | §2; [TILTED_POLE_CLOSE_IN.md](TILTED_POLE_CLOSE_IN.md) §1 |
| **P9 = D-T1, C3** | the way out of close in blended by his fingers (`tiltOutBlendMm` 12 mm); by time ONLY once the finger has lifted with the turn unfinished, at the one speed (`tiltRollDegS`) | §2; TILTED_POLE_CLOSE_IN §8 |
| **P10** | the camera looks at its orbit's centre — the gizmo close in; the look point trailing 120 ms, the gizmo 45 ms | §2 |
| **P14** | every realignment paid by his finger's mm, never by time; **a pace closes only a gap a change opens** | §2; UPRIGHT_LESSONS rows 6, 9, 10 |
| **P15** | no layer that undoes what the logic decided; one owner per thing | §2; lessons row 2 |
| **P17** | close in as approved: the square camera, the tilted pole, the carried up and its framing (J), the piece's slide at a change | §2 |
| **§4.3a rule 1** | not latched the FOLLOWER draws; the band (`pictureBandMm` 10 mm beyond the unlatch, w by PLACE) moves its elevation from the follower's toward the logic's (`us`) | PICTURE_REBUILD §4.3a |
| **§4.3a rule 4** | the way out after the unlatch = the hand-over from G to rule 1's pose by the way out's own share (`asmZoneMix.out`'s k) | §4.3a |
| **§4.3a rule 5** | **THE HAND-OVER (one, for the whole pose)**: at each change of owner the drawn view's heading, elevation and up held as offsets from the new owner's, closed by one share | §4.3a |
| **§4.3a round 2** | **one payer of a gap** (the band paid the elevation by place AND the latch's hand-over paid it by mm on a spit: the root of a 0.25 m drift) | §4.3a |
| **T5, T11** | one rule for every tilt; no noise into the camera — every trigger has a band | TILTED_POLE_CLOSE_IN §1 |
| **D-H13, D-H14, D-H24** | the far follower: two 1-D springs (`followMs` 200), the leash taut at his finger's pace | CAMERA_FOLLOWS_GIZMO §20 |
| **gizmo lag** (2026-11-11) | *"I don't like the way the gizmo moves (it jitters slightly) but I like the smooth movement of the piece and scene"* — the ring and the sections drawn at the rig's base's lag ALONG THE FACE (`gizmoLag`, `gizmoShownAt`) | `assembly_orbit.ts` 61 – 79 |
| **the calm** | the calm's shares eased by TIME (`CALM_TAU_MS` 120 ms); off the tilt by distance both shares released to 1 (`tiltOff`) — the code's own words: *"the calmed yaw released at every exit, then calmed again — a swing there and back"* | `orbit_calm.ts` 124 – 130; `assembly_wiring.ts` 2236 – 2238 |

## 3. Part 2 — the obstacle, measured frame by frame

### 3.1 Reproduced headless (the kit `fo3/surface/jitter/`: his window and dpr, each frame at its recorded time, his events, the A key inferred)

| record | replayed | against his rows | his jitter in the replay |
|---|---|---|---|
| `09fv_r01` (A) | 2 775 frames | eye ≤ 31 mm, look ≤ 35 mm, view ≤ 0.44° at every frame | ✅ the same frames: f1906 (173 mm), f2872, f3553, f3557 – f3563, f3606 – f3607 |
| `n2b8_r03` (B) | 798 frames | look ≤ 19 mm; the eye equal outside the jitter | ✅ the same window f13991 – f13994, the same size (7.1°, 2.1°, 11.0°, 6.4° against his 5.9°, 10.4°, 5.9°, 10.8°) — its phase frame by frame differs: the loop is that sensitive |
| `09fv_r02` (B) | 3 315 frames, the piece's rotation set from his first row (`SETPR=1`), the A key frame by frame | look ≤ 27 mm; the eye ≤ 135 mm and the view ≤ 6.4° only inside the jitters | ✅ at the floor: f8607 (3.1°), f9075 (5.0°), f9084 – f9086 (4.6°, 5.2°, 3.2°), f9643, f9657 – f9658 against his f8607 (4.1°), f9075 (3.4°), f9085 – f9087 (4.8°, 5.1°, 2.1°), f9658 – f9659; ⚠ not his f7770 / f7780 (4.0°, 4.3°): the replay's framed line swings there just as much (50 – 90° off the view, square to it at f7780) but its φ is exactly 0 — a roll of 0 about any line moves nothing; his φ there came from before the record began |
| `n2b8_r04` (C) | 1 830 frames | eye ≤ 25 mm, look ≤ 8 mm, view ≤ 0.01° | ✅ the camera barely moves, as in his; the ring's motion measured in §3.4 |
| `n2b8_r02` (A) | ❌ NOT reproduced | his record STARTS in close in under the tilted pole (f11110: `tl` 15, `ap` 0.45, a latched turn pending): the walker sets the orbit's angles in the world's frame at that approach, and at the floor the orbit did not go there (it stayed at yaw −90°, the gizmo on the front face) — every later frame differs (view up to 80°) | read on his rows only (§3.2) |

`09fv_r03`, `09fv_r04`, `n2b8_r01` were read on his rows only (the same signatures: §3.2's table, §3.3). Replays that did NOT reproduce, and why:
the kit's walker without the A key (his approach replayed as an orbit); `09fv_r02` without `SETPR` (his piece turned before the record began);
`09fv_r02` with the A key per PRESS (press19 is an orbit, then A pressed in the same press: from f7651 the yaw stayed 24° off his — the key is now
inferred frame by frame inside a press, a mode counting only in a run of 3 rows).

### 3.2 Family A — taking the piece out of close in (top and bottom faces): THREE movers at the unlatch, each by another owner

Read on `r01` f1900 – f1952 (the replay's own state each frame, `walk_jt.mjs`'s `jt`); the same on f2872 and f3553, and in the records of `r03`,
`n2b8_r01`, `n2b8_r02` (§3.1's table).

**A1 — the look point, the piece and the eye leap in ONE frame at the unlatch (the "big jitter").** While latched he only approaches (no orbit mm), so
the latch's turn stays PENDING (`asmZoneMix` k 0, `byMm`: P8 = T10) and, born close in, it is drawn ABOUT THE PIECE (R2, D-P2: `turnPose` rule 2): the
whole camera rides with the piece as it backs out — that is why |eye − look| (R) is frozen at 1 885 – 1 911 mm while `ap` rises: the look point drawn
(`t`) leaves the gizmo's look point (`asmLook`) with the piece (f1903: t (−48, 552, 167) mm, `asmLook` (143, 542, 172) mm — 191 mm apart). At
`tiltAutoM` + 0.05 m (the unlatch, f1906) the FOLLOWER becomes the owner (§4.3a rules 1, 4): its pose looks at `asmLook` and hangs the piece on its own
line. The hand-over (rule 5) holds the view's heading, elevation and up (`dh` 23.3°, `de` −16.6°, φ 0) — **but not the look point nor the piece's
place**: in that frame the look point jumps 191 mm, the drawn piece 180 mm, the eye 173 mm, while the view's direction turns 0.8°. Every family-A
record has it, at the unlatch frame (the record's own rows):

| record | frame | look point | piece drawn | eye | the latch's turn paid (k) |
|---|---|---|---|---|---|
| `r01` (top) | 1906 · 2872 · 3553 | 188 · 202 · 366 mm | 184 · 182 · 194 mm | 175 · 182 · 193 mm | 0.15 · 0.12 · 0.19 |
| `r03` (bottom) | 12939 · 13651 | 86 · 116 mm | 83 · 105 mm | 88 · 113 mm | 0.18 · 0.28 |
| `n2b8_r01` (bottom) | 2908 · 3380 · 3600 · 4019 · 4547 | 51 · 59 · 129 · 35 · 44 mm | 79 · 161 · 78 · 55 · 26 mm | 91 · 162 · 100 · 56 · 48 mm | 0.89 · 0.63 · 0.77 · 0.71 · 0.75 |
| `n2b8_r02` (top) | 11271 · 11746 · 12392 | 194 · 125 · 124 mm | 191 · 121 · 125 mm | 186 · 120 · 121 mm | 0.12 · 0.10 · 0.11 |

The less of the latch's turn he paid by orbiting (k), the bigger the leap — `n2b8_r01`, where he orbited in close in, has the smallest.

**A2 — the view swings ≈ 14° away and, at the lift, back (two payers of one gap).** At the unlatch the owner is rule 1's pose at w ≈ 1: the follower's
heading at the LOGIC's elevation (`us`, the piece from the gizmo's foot — on the top face nearly straight up: 83.7°). Near the vertical the camera's own
offset (`cameraYawOffsetDeg` 2.5°, applied at the direction's heading) turns that pose's eye heading to 61.7° — 23.3° off the follower's own
85.0° (computed: atan(sin 2.5° / cos 83.7°) ≈ 22°, the pitch offset the rest) — so the hand-over holds a gap of 23.3° in
heading and −16.6° in elevation that **no finger opened** — the drawn view (85.0°, 67.1°) is where the picture already was. Then two payers move it:

| f | the owner's view (rule 1) | the band w (by PLACE) | the hand-over left r (the way out's k: his out mm; after the lift by time, C3) | the view drawn |
|---|---|---|---|---|
| 1906 | 61.7°, 83.7° | 1.000 | 0.958 | 84.0°, 67.8° |
| 1914 | 73.8°, 78.7° | 0.832 | 0.902 | 94.9°, 63.8° |
| 1926 (his finger stops) | 81.0°, 71.7° | 0.573 | 0.714 | 97.7°, 59.9° |
| 1940 (still pressed) | 82.1°, 71.7° | 0.573 | 0.714 | 98.9°, 59.9° |
| 1941 – 1949 (lifted) | 83 → 84.8°, 70 → 64.9° | 0.573 | 0.617 → 0 in 8 frames | 97.1 → 84.8° |

The band brings the owner back toward where the view was (by place), while the offset held against it is paid by another share (his out mm, then
time): the sum leaves the right place by 14° and returns — at the lift in 8 frames, 1 – 2° a frame. The follower's own heading moves too (85.0° →
90.7°, its spring toward a target that jumped 6.4° at the tilt-off frame — A3).

**A3 — the calm released at the tilt-off by distance, then calmed again by time.** `tiltOff` (`assembly_wiring.ts` 2236 – 2238) sets both calm shares
to 1 when the tilt is turned off by distance (only an exit ACROSS keeps the horizontal share); the calm then eases back to its target over ≈ 0.5 s
(`CALM_TAU_MS` 120). Measured (`r01` f1906 → f1907): the calm's sH 0.25 → 0.95 → … → 0.28 (f1955); the asked direction's elevation 82.1° → 65.2° in one
frame; the follower's far reading 85.0° → 91.5° (a 6.4° jump, under the 10° turn band: its spring pays it). On `n2b8_r02`'s rows the same frame
(f11272, the tilt off) turns the view 5.9° and moves the piece 72 mm in one frame, with the calm's sH 0.26 → 0.97 and sV 0.68 → 1 — ⚠ not replayed
(§3.1), and at that frame the orbit's angles are also turned into the world's frame: the share of the 5.9° that is the calm's release is NOT
measured. On `r01` the tilt-off frame itself turns the view 0.27°; there the release shows through the follower's target (+6.4°) in the drift (A2).

### 3.3 Family B — the approach to a side face's floor: the carried up rolls about a line that is no longer the view

At the floor (`ap` 0.45, the contact) the automatic tilt is latched (within 0.6 m), so the CLOSE drawer draws (`rollPictureFrame` → `carriedFrame`): G,
the logic's pose, turned by the CARRIED UP's φ about the **framed line** — the line through the piece and the look point (`framedLine`,
`roll_follow.ts` 58 – 64; FAST_ORBIT.md O4: *"a camera turned about it keeps both where they are on the glass"*; only when the two are closer than
`ROLL_LINE_MIN_M` = **3 mm** is it the view's own direction). On a side face no square camera runs (κ = 1), so the carried up's three steps all read
that line: C2 the carry (the logic's twist about it taken back), C3 the target α (the roll about it that sets the glass upright), C4 the catch-up at
`uprightMaxDegS` 520°/s × the frame's time (`upCarried`, `upright.ts` 246 – 302).

His finger dragging on past the floor moves nothing itself (`approachMove`: the step clamped at the floor, 0 taken; the orbit's angles untouched —
A held). What still moves is the look point, trailing 120 ms (P10) into the gizmo's foot, and the piece settling on its contact: at contact the two
are **22 – 31 mm apart** (`n2b8_r03`), the line between them is set by millimetre residues, and it sweeps off the view as they converge
(`n2b8_r03`, replayed, f13986 – f13997):

| f | ‖piece − look‖ | the framed line off the view | φ (the carried up) | the logic's pose G | the view drawn turns |
|---|---|---|---|---|---|
| 13988 | 136 mm | 7.5° | −0.75° | still (az −178.12°, el −14.83°) | 0.01° |
| 13989 | 54 mm | 15.2° | −0.74° | still | 0.10° |
| 13990 | 29 mm | 73.0° | −1.54° | still | 1.28° |
| 13991 | 28 mm | 72.8° (**its direction flipped**: (0.66, −0.60, 0.44) → (−0.62, 0.78, 0.12)) | −5.90° | still | **7.11°** |
| 13992 | 27 mm | 68.4° | −3.83° | still | 2.07° |
| 13993 | 25 mm | 82.3° | **+7.55°** | still | **11.05°** |
| 13994 | 24 mm | 64.7° | −1.23° | still | 6.37° |
| 13995 – 13997 | 23 – 22 mm | 37° → 19° | −0.82 → −0.75° | still | 0.62 → 0.09° |

The logic's camera (`asmCamLogic`, G) does not move at all; the follower does not draw (latched). **The swing is the carried up rolling the picture
about an axis 65 – 82° off the view**: a "roll" about it moves the eye on a 1.26 m arm round the piece (140 – 240 mm a frame). The line flips its
direction when (piece − look) crosses square to the view (the sign test `dot(u, view) < 0`), so φ carried about one direction is read about the
opposite one, and C4's catch-up (12.5° a frame at his 24 ms) chases a target that flips — the back and forth of his record (5.9°, 10.4°, 5.9°, 10.8°
a frame).

`09fv_r02` (replayed with his piece's rotation, the A key frame by frame) shows the same mechanism without a flip — the line 47 – 62° off the view,
steep (its y −0.74 to −0.77), ‖piece − look‖ 31 – 65 mm, the logic's pose still (az −87.47°, el 35.45°, `dL` 0.00 on every frame):

| f | the framed line off the view | φ | the view drawn turns |
|---|---|---|---|
| 9073 | 35.7° | 3.05° | 0.38° |
| 9074 | 46.7° | 4.89° | 1.78° |
| 9075 (the floor reached) | 54.8° | **10.41°** | **4.96°** |
| 9076 – 9083 | 58 – 62° | 10.41° (held exactly for 8 frames while the line moves — inferred: the one branch of `upCarried` that holds φ is `uprightAngle` null, no upright roll about so steep a line; α itself is not recorded) | 0.00 – 0.34° |
| 9084 | 56.2° | **16.18°** (a solution again: caught up at 520°/s × 11 ms = 5.7°) | **4.62°** |
| 9085 | 53.8° | 10.26° | **5.18°** |
| 9086 – 9090 | 51 → 39° | 6.59 → 3.44° | 3.17 → 0.42° |

So the carried up's target toggles between "none" (held) and a value as the line sweeps, and the catch-up pays each toggle in one or two frames: the
one-frame spike he sees at f9085 (his record: −94.34° → −98.55° → −93.96°). FAST_ORBIT.md's O4 measured the framed line 4 – 23° off the view on the
frames that twist, far out (*"so the twist IS mostly roll"*); at contact on a side face it is 47 – 82° off: the assumption the carried up rests on
does not hold there.

`09fv_r04` (his rows only — the record starts with his piece turned; the same signature, at the floor `ap` 0.4533, the gizmo still): f16775 – f16793
‖piece − look‖ 17 – 24 mm, the line 34 – 74° off the view and on the flipped side from f16776 to f16785, the view turning 2.1°, 4.3°, then 5.7°,
**7.9°** a frame (f16791 – f16792, 9 ms frames); f17271 – f17285 ‖piece − look‖ 59 → 20 mm, the line 59 → 90° off and flipped twice, the view
turning 2.1, 2.0, 5.3, 6.1, 5.2, 4.1, …, 4.6, 5.6, 5.6, **8.2°** a frame (11 – 15 ms frames). ⚠ Family B needs the carried up to HOLD a roll: on
`09fv_r02` f7770 / f7780 the replay's line swings as much but its φ is 0 and nothing moves (§3.1).

### 3.4 What draws the gizmo's ring and its red / green sections when he approaches or takes out (`n2b8_r04`)

* **The names.** `g` (`asmGizmoAt`) is the gizmo's exact point — still for the whole record (he only approaches). `gf` (`asmGizmo`) is NOT the drawn
  gizmo: it is the rig's eased BASE, the orbit's centre the piece and the camera hang from — the shell's anchor on the piece's ray (`footOf` →
  `shellAnchor`: g + u·e(d), `orbit_shell.ts` 96), eased at `gizmoEaseMs` 45 ms; `look` trails it at 120 ms. Near the contact e(d) changes with the
  approach, so the base travels along u — the calm's shown direction, here ≈ 52° off the face's normal: `gf` moves −66, −74, −39 mm (x, y, z) over
  f16012 – f16030, mostly ALONG the face.
* **What draws the ring and the sections**: `gizmoShownAt(g, …, asmGizmoLag)` (`green_box_wiring.ts` 798) and the section lines' position
  (`assembly_wiring.ts` 1571 – 1574) — the exact gizmo PLUS the base's lag behind its target along the face (`gizmoLag`: eased base − base, its normal
  part dropped). Not the swaying meshes, not the piece, not the camera.
* **Measured** (replayed, `rd_ring.cjs`): the gizmo still on all 1 829 frames, the ring moved over 1 mm on 66 of them, by up to **39.7 mm** a frame
  (f17197), its offset up to **33.5 mm** (f17023) — at every approach off or onto the floor (`ap` 0.45 – 0.49), e.g. f16012 – f16019: the base steps
  2.9, 15.2, **45.2** (a 39 ms frame of his), 11.3, 8.6 mm; the ring 6.9, 6.9, 12.0, 6.5, 6.8, 2.4, 3.7, 3.7 mm out and back while `g` does not move.
  The same on `09fv_r02` (162 frames over 1 mm, up to 36.6 mm) and `n2b8_r03` (30 frames, up to 8.4 mm).
* **Why.** The lag rule (2026-11-11) shows the rig's lag as the GIZMO's — right for the orbit, where the base follows the gizmo's travel. On the
  approach the gizmo does not travel; the base's motion along an oblique ray is the approach's own, yet its part along the face is drawn as the ring's
  and the sections' motion. The frame time sets how far the base jumps in one frame (his 24 – 39 ms frames: 45 mm), hence the jerkiness he names.
  At `landingDrives=0` the same, to the frame (66 frames over 1 mm, 39.7 mm at f17197).

### 3.5 The slow frames (his 24 – 50 ms)

* **In his records.** Session `09fv` runs at his 7 ms (143 fps) free, 10 – 11 ms while the approach moves. Session `n2b8` slows down as it goes: from
  `n2b8_r03` on even his free frames take 9 – 11 ms, the approach's moving frames 17 – 24 ms (31 – 100 % of them over 20 ms) — a slowdown of the whole
  page or of the PC at that time, not of one rule.
* **Headless, the same frames are not expensive** (`rd_wall.cjs` on `JT_n3`: the approach moving 9.4 – 9.9 ms of wall time against 8.2 – 13.2 ms still,
  SwiftShader — relative only; the solver's queries 2 a frame, 13 on the contact frame). Nothing the game computes on those frames stands out.
* **What a long frame does to the jitter.** Every ease on this path is exact in its frame time (`easePoint`, `easeToward`, `spring1`, `sphereSpring`:
  exponentials, no overshoot at any dt) — the hypothesis of an ease stepped past its target is refuted. Time enters through the RATES: C4's catch-up
  (520°/s: 3.6° a frame at 7 ms, 12.5° at 24 ms, 26° at 50 ms) and the approach's own step (his finger's travel over a long frame lands at once). A
  long frame makes family B's jumps bigger; it does not make them — `09fv_r02`'s happen on 11 – 14 ms frames.

### 3.6 Isolation — `landingDrives=0` (the drive before the surface work)

* **A stays, identical**: `09fv_r01` replayed at `landingDrives=0` against the default: the camera identical on 2 039 of 2 775 frames and within
  0.0005 mm on the rest; the three unlatches the same (look 192 / 202 / 366 mm, piece 180 / 182 / 194 mm, eye 173 / 182 / 193 mm, held 23.3° / −16.6°,
  excursions 14.9° / 12.3° / 11.8° over the next 60 frames — `rd_unlatch.cjs`).
* **B stays, identical**: `n2b8_r03` at `landingDrives=0`: the same frames, the same φ (−1.54°, −5.90°, −3.83°, +7.55°, −1.23°), the same framed lines.
  `09fv_r02`'s numbers above are the `landingDrives=0` replay itself: the jitter is there with the drive off. With the default drive (2) the same
  windows jump the same way (f8607 3.7°, f8624 5.2°, f9075 5.0°, f9084 – f9086 4.6°, 5.2°, 3.2°, f9643, f9657 – f9658); the two replays are identical
  on 778 frames and part by up to 110 mm only inside the floor's windows (the drive moves the contact by millimetres, and the loop is that sensitive).
* **C stays, identical**: `n2b8_r04` at `landingDrives=0`: the ring's motion the same to the frame (§3.4).
* ⇒ **Both families and the ring belong to the CLOSED ORBIT** (the picture's chain is byte for byte the reference's `2cd1be34` = LIVE `3b7a479`): the hand-over of
  the picture rebuild (R3-FIX, §4.3a), the tilt's exit (`tiltOff`), the carried up's framed line (FO3 S0 `580913f6`, the carried up `1.0.148e-`) —
  never the surface work (S2 – S14).

## 4. Part 3 — the fix options, from the root (nothing built; each names the rule or owner that is wrong or missing)

⛔ Refused on principle (P15, UPRIGHT_LESSONS rows 2, 6, 9): a smoothing of the drawn camera, a cap on its step, a filter on φ, an undo of a turn — each
would hide the owner that is wrong and move the conflict elsewhere.

### 4.1 A1 — the hand-over carries the WHOLE pose (rule 5 completed)

* **What is wrong.** §4.3a rule 5 is titled *"one, for the whole pose"* but holds three angles only (heading, elevation, up). Two owners place the look
  point and the piece differently on the way out — G (a turn born close in is drawn about the piece: the camera rides with it) and the follower (the
  gizmo's look point, P10; its own line) — so their difference is drawn in one frame.
* **A1-a (recommended).** The hand-over holds the look point's offset and the piece's offset as well (new owner's minus the pose drawn last frame),
  closed by the SAME share as the angles (the way out's k; latched the C4 pace; else his mm over `pictureBandMm`). One owner (the hand-over), one payer,
  nothing undone. Elsewhere: at the latch (G from the pose drawn) the offsets are ≈ 0 — unchanged; far out, no hand-over — unchanged; `Scene_0bis` /
  `Scene_2` spits: the same rule. Vectors: a pure `pictureStep` case (latched → unlatched with G's look 191 mm off the follower's: the first frame drawn
  equal to the last within 1 mm; red on the mutant without the offset).
* **A1-b.** The pending turn keeps its look point on the gizmo (only its ORIENTATION held — P8's own words: *"keep the camera orientation"*). Reopens R2's
  D-P2 (about the piece for the turn's whole life, decided to stop a 32 – 48° swing) for the pending case: the piece would cross the glass while he
  approaches in the latch — his approved close in (P17) changes. Needs his word.

### 4.2 A2 — one payer for the way out's gap (the gap read where the way out ends)

* **What is wrong.** At the unlatch the hand-over measures the gap against rule 1's pose at w ≈ 1 (the logic's elevation, `us`), which the band then
  moves by PLACE while the offset is closed by the way out's share — two payers of one gap (the lesson of §4.3a round 2, met again on the top and
  bottom). The gap they pay (23°, −17° on `r01`) is not in the picture: the view drawn at the unlatch is already ≈ where the follower ends (84.8°, 64.9°).
* **A2-a (recommended).** While the way out's turn lives (`asmZoneMix.out`), the band pays nothing: rule 1's owner is the follower's own pose (as the
  band already does in a polar zone, round 2's rule), so the hand-over reads the TRUE gap (on `r01` the view drawn at the unlatch and the view the
  way out ends on are 0.2° apart in heading, 2.2° in elevation — against the 23.3° / −16.6° held today) and C3's share is its one payer — by his
  out mm, and after the lift by time at the one speed as he decided (D-T1). Elsewhere: the way IN unchanged (the band's purpose: to reach the latch at
  the logic's elevation); after a way out completed inside the band (he stops in it), the band must not take over by place with a step — its share on
  the way out held at 0 until he goes back in past the latch (a decision for his word: the band then becomes the way IN's rule only).
* **A2-b.** The hand-over's offset closed by the band's own w (place) instead of the way out's share: one payer, but the lift's completion (C3, his
  D-T1: *"by time only once the finger has lifted"*) no longer closes it — what he stops with stays held. Contradicts a decision of his.

### 4.3 A3 — the calm carried out of the tilt as it is

* **What is wrong.** `tiltOff` releases both calm shares by distance and the calm re-takes them by time (120 ms): a swing there and back that the code's
  own comment names, a realignment paid by time (P14), and a 6.4° jump of the follower's far reading at the tilt-off frame.
* **A3-a (recommended).** Off by distance, the calm is carried out of F as it is carried INTO F at the latch (`assembly_wiring.ts` 2157 – 2161: *"the
  horizontal one KEPT"* — his 2026-11-10 *"the tilt seems to catch up what the calm prevented"*) and as an exit ACROSS already carries it
  (`tl.exitAcross`: the horizontal share kept): the same rule for the distance's exit. Today the way in keeps it and the way out releases it.
  Elsewhere: the exits across an edge unchanged; the far reading continuous at the tilt-off. ⚠ The tilt's frame and the world's differ by a quarter turn on a level face: the shares' MEANING is per facet
  — a vector must show the shown direction continuous across the switch (red on today's rule).

### 4.4 B — the framed line's degenerate case by its real condition (on the glass)

* **What is wrong.** O4's fallback (the view's direction through the piece) is decided by a WORLD distance, 3 mm, where the question is the GLASS: at
  1.26 m, 22 – 31 mm apart is ≈ 1° on the glass — the piece and the look point are ONE place there, and "the line through both" is any direction. CLAUDE.md
  rule 3 (thresholds on the physical screen) is the rule it misses.
* **B-a (recommended).** The framed line's direction blended CONTINUOUSLY from the view's own direction (when the piece and the look point are within a
  few millimetres ON THE GLASS) to the line through both (beyond a band) — one rule, by place, never by time; and no sign flip can occur inside the band
  (there the line is the view). Elsewhere: far out and mid distances (the piece well in front of the look point, the line within 4 – 23° of the view —
  FAST_ORBIT.md's measurement) unchanged; close in on a top face (the square camera, κ < 1) unchanged in kind. Vectors: `framedLine` at 25 mm apart, 80°
  off the view → the view's direction; continuity across the band; red on today's 3 mm rule.
* **B-b.** No carried up at contact (κ → 0 when the approach is at its floor): reopens P17 (the carried up approved close in) — refused unless he asks.

### 4.5 C — the ring shows the GIZMO's lag, not the approach's

* **What is wrong.** The gizmo lag (2026-11-11, his *"I don't like the way the gizmo moves (it jitters slightly) but I like the smooth movement of the piece
  and scene"*, *"avoid adding another lerp or spring"*) draws the ring and the sections at the gizmo's exact point plus the rig's base's lag along the
  face — meant for the gizmo's TRAVEL (the orbit). It already drops the lag's part along the normal (*"a turn of the camera, not the gizmo"*). But the
  approach moves the base too: the foot is the shell's anchor ALONG THE PIECE'S RAY (`shellAnchor`: g + u·e(d)), and the ray is oblique to the face
  (the calm's direction), so the approach's own motion has a part along the face — drawn as if the gizmo had moved, while it is still.
* **C-a (recommended).** The lag drawn is the base's lag for the gizmo's travel only: the approach's own move of the target (its part along the ray,
  e(d) this frame minus last) is taken out of the lag before it is drawn — no new ease, the rig's one time law kept for the piece and the camera.
  Elsewhere: the orbit's lag (his 2026-11-11 fix) unchanged — `g` moves there, the approach does not.
* **C-b.** The ring at the gizmo's exact point while the approach moves (no lag): the 2026-11-11 step-per-event jitter would come back whenever he
  orbits and approaches together — refused.

## 5. Part 4 — the risks and the audit plan

* **One switch per option, 0 = today frame for frame** (UPRIGHT_LESSONS §5.4): A1-a, A2-a, A3-a, B-a, C-a each behind its own; an identity run at 0 on his
  eight records (G1: the walker's per-frame JSON bit for bit against this study's replays `JT_*`).
* **His records are the gates** (P18), replayed as here (`run_jt.sh`, the A key inferred, `SETPR=1` where the record starts with a piece turned —
  `09fv_r02`, `r03`, `r04`):
  * A — at every unlatch frame (§3.2's table): the look point, the drawn piece and the eye each step < 10 mm more than the frame before (his own out
    motion), the view < 1°; through the way out the drawn heading MONOTONIC toward where it ends (no excursion over 2°); at the lift no step over 1°.
  * B — at the floor (`09fv_r02`, `r04`, `n2b8_r03`): no frame over 1° of view turn or 30 mm of eye while the logic's pose is still (`dL` 0).
  * C — `n2b8_r04`: the ring and the sections still on the glass (< 1 mm) while `g` is still.
* **What each may break, and the check**: A1-a — the latch's hand-over (offsets ≈ 0 there: its vectors unchanged); A2-a — the band on the way in
  (`Scene_1`'s top, his `S1B` / `S1F` records: identical up to the latch); A3-a — the exits across an edge (the bounce, CAMERA_FOLLOWS_GIZMO §20's
  records: identical); B-a — FAST_ORBIT's spit frames (the line within 4 – 23° of the view there: the blend must leave them bit for bit — measure the
  band's onset against them before choosing its width); C — the 2026-11-11 jitter of the ring while orbiting (his words then): the orbit's lag kept.
* **The kit** (`../_saved_patches/orbit_chain_2026-11-18/fo3/surface/jitter/`): `walk_jt.mjs` (the S4 walker `walk_dr.mjs` + per frame, READ ONLY, `jt`:
  the picture's state and hand-over, the follower's, the latch, the logic's and drawn frames, the carried up's φ and framed line, the gizmo's lag; the
  A key inferred; `SETPR=1`; START / END; Vite's hot reload stubbed — another agent's edit reloaded a page mid-replay once; chunked read-back); `run_jt.sh`,
  `queue_jt.sh` (one job at a time; ⛔ never stopped mid-replay: its Chrome and server are orphaned); readers `rd_jt.cjs` (per frame; flags f, l, r, g,
  q, v, z), `cmp_jt.cjs` (a replay against his record), `rd_unlatch.cjs` (family A at each unlatch), `rd_ring.cjs` (the ring against the gizmo),
  `rd_wall.cjs` (wall times). Runs: `fo3/surface/runs/JT_*` (`r01`, `r01_ld0`, `r02` (per press, superseded), `r02_ld0`, `r02d`, `n3`, `n3_ld0`,
  `n4`, `n4_ld0`, `n2` (not reproduced)).
* **His look on the device closes each** (rule 5). The two decisions for his word: A1-b vs A1-a (whether the camera may stop riding with the piece in
  the latch), and A2-a's band on the way out.

## 6. In plain words

**Taking the piece out of a top or bottom face.** While you pull the piece back inside the close range, the camera is told to wait, so it travels
backwards WITH the piece — that is why the distance on the screen does not change. The moment you cross 0.65 m, the far camera takes over. It is
handed the old camera's viewing angles but not where the old camera was looking, so in one frame the point it looks at jumps 4 to 37 cm and the
camera 5 to 19 cm — that is the big jump. Then two different rules each fix half of an angle that did not really need fixing, at two different
paces, so the view drifts about 14° away while you keep pulling and comes back by itself when you lift your finger. And the "calm" that frames the faces is switched off and back on
at that moment, which nudges the view a third time. **Approaching a side face to the end.** When the piece touches the face, it sits 2 – 3 cm from
the point the camera looks at. The rule that keeps the picture upright turns it about the line joining those two points — a line that, at that
distance, points almost anywhere and can flip from one frame to the next — so "keeping upright" swings the camera 4 – 11° to one side and back. A
slow frame makes the swing bigger but is not its cause. **The gizmo and its lines.** They are drawn where the gizmo is plus the small delay of the
point the piece hangs from — a rule made so the ring moves smoothly when you orbit. When you approach, that point slides along the piece's slanted
path, and the ring is drawn sliding with it (up to 3 cm off and back) though the gizmo itself never moves. **All of it is the closed orbit's**, not the surface
work: with the surface's drive off, the same jumps happen to the same frames. The fixes proposed hand over the whole picture, let one rule pay each
gap, keep the calm through the switch, decide the "upright" axis by what you see on the glass, and draw the ring with the gizmo's own delay only —
none built, each behind its own switch.

## 7. ⭐ His word (2026-11-25) and the build's packets

**His word, verbatim:** *"A1-a and A2-a as you recommend."* (asked in plain words: A1-a vs A1-b; A2-a with the band acting on the way IN only.)

* **D-J1 — A1-a.** At the unlatch the hand-over holds the WHOLE pose: the three angles as today, AND the look point's offset and the drawn piece's
  offset (the new owner's minus the pose drawn the frame before), all closed by ONE share — the way out's (C3: his out mm while the finger is down,
  then by time at the one speed after the lift, D-T1). ⛔ A1-b refused (the camera keeps riding with the piece close in: his approved close in, P17,
  unchanged). At the latch the offsets are ≈ 0 (G is set from the pose drawn): unchanged.
* **D-J2 — A2-a.** While the way out's turn lives, the band pays nothing: rule 1's owner is the follower's own pose, so the hand-over reads the TRUE gap
  and the way out's share is its one payer. **The band after a way out (his answer to the question):** the band is the way IN's rule only. Its share
  is held at 0 from the unlatch until either (a) the piece is again beyond the band's far edge (`pictureBandMm` of approach finger past the unlatch —
  where the band's share is 0 by place anyway, so re-arming there is continuous), or (b) the piece latches again (the latch's own hand-over, from the
  pose drawn). So: he stops inside the band after a way out → no step, the follower's pose stays; he goes on out past the far edge → the band armed for
  the next way in, as today; he comes back in without leaving the band → no band, the latch's hand-over takes the view.
* **The packets** (his standing rule: small, sequential): **packet 1 = A1-a + A2-a** (one join — the unlatch's hand-over and what it measures
  against), each behind its own switch, 0 = LIVE frame for frame; vectors red first; verify; the gates of §5 on his records (family A: `09fv_r01`,
  `r03`, `n2b8_r01`; the way in unchanged: `S1B` / `S1F`). **Packet 2 = A3-a, B-a, C-a** — as recommended (he raised no objection when told they
  would follow), each behind its own switch, after packet 1's gates. His look on the device closes each (rule 5).
* **D-J3 — the branches (his word 2026-11-25: *"make sure you commit these five fixes also in branches 1.0.156 and 1.0.157 as they also belong
  there"*).** The five fixes are the closed orbit's, not the surface work's: each lands on `1.0.158from1.0.157-Orbit_surface` (built and gated here),
  then is ported as its own commit (code + vectors) onto `1.0.157-Orbit_surface` and `1.0.156-Orbits_with_camera_follow_final` (their code is
  identical to each other: `1.0.157` = `1.0.156` + three docs commits), verified there, both switches at 0 = that branch's game frame for frame.
  The fixes therefore depend on nothing of the surface work (no landing, readout, `surfaceL1`, `landingEngine`).

### 7.1 Packet 1 AS BUILT (2026-11-25, an Opus agent — `a3d7446d` A1-a, `e591a9d2` A2-a; each switch 0 = `3b7a479` frame for frame; not deployed)

* **`pictureHandWhole`** (D-J1, A1-a; 0 by default; ORBIT › CAMERA FOLLOWER after `pictureBandMm`; `gestureConfig.ts`, validated 0 / 1). Pure, in
  `src/input/picture.ts`: at the UNLATCH (`pictureStep`'s change of owner to not latched, `whole`) the hand-over holds, beside the three angles, the
  look point's offset, the drawn piece's offset and the eye's distance from its look point (`heldPlaces`: the pose drawn the frame before — kept in the
  state, `drawn`, at 1 only — against the new owner's pose turned by the angles held), closed by the same share `r` (`placedPose`: the look point and the
  piece by their offsets, the eye with the look point and its distance along the view, so the view's direction stays the angles'). The wiring passes
  `whole` at 1 only (`picture_wiring.ts`, `base`).
* **`pictureBandWayIn`** (D-J2, A2-a; 0 by default; the same folder). Pure, `bandHeld(on, wasHeld, unlatched, latched, wPlace)`: the band's share held
  at 0 from the unlatch (the hand-over's last owner latched, this frame not) until the band's share by place is 0 (beyond its far edge: re-armed there
  continuously) or the piece latches again; the picture draws with `w` 0 meanwhile (`asmPicture.bandHeld`, written only then). The logic's own rule
  for a way out born in the band (`zoneMixPose`: about the piece) still reads the band by place — untouched.
* ⚠ **Three deviations from §7's text, stated plainly.**
  1. **The places are held at the UNLATCH only, not at the latch.** D-J1 says *"at the latch the offsets are ≈ 0 (G is set from the pose drawn)"* —
     measured, they are not: G's turn at the latch starts from the pose drawn (`poseShown`) and carries it with the piece's own step of that frame
     (`09fv_r01` f1564, f2476, f3395: 26, 81, 443 mm — the look point, the piece and the eye the same step, the view 0.00°), so the offsets read there
     are that step, and the pending share (0) would have held them — the picture behind the piece — through the whole pending. At the latch the
     places' hand-over is G's own turn from the pose drawn (R3-FIX rule 3), as today: the latch is unchanged bit for bit (a vector).
  2. **The eye's DISTANCE is held too** (D-J1 names the look point and the piece): with those and the angles alone the eye is at the new owner's
     distance (4.5 mm off on the vector's numbers) — held along the view, so it moves no angle.
  3. **The unlatch's own frame draws the held pose whole** (`r` 1 there): the way out's turn — its share, the one payer — is born the frame after
     (`asmZoneMix.out` first at f1907 for the unlatch at f1906), and today's fallback on that frame (his mm over `pictureBandMm`) paid 4 % of the gap
     at once (7.7 mm of the vector's 191 mm). From the next frame the way out's share; with no way out alive, his mm (as today).
* **Vectors** (`tests/approach_jitter_a1.test.ts` 8, `tests/approach_jitter_a2.test.ts` 9 — `09fv_r01`'s numbers in pure `pictureStep` frames;
  `menu_layout` 142 sliders), each red first: A1-a on the old code (the first frame's look point 191 mm off), the eye moved with the look point only
  (4.5 mm), the unlatch's frame paid by his mm (7.7 mm), the places held at the latch too (the latch's poses differ), the places closed by his mm
  instead of the way out's share; A2-a on `bandHeld` held for the unlatch's frame only, re-armed at any w under 1, not cleared at the latch, set on the
  way in too, the switch ignored (each red on 2 – 7 of its 9; the old code has no `bandHeld`). **`npm run verify`: 2574.**

### 7.2 THE GATES (2026-11-25 — the kit `fo3/surface/jitter/` on the branch at `e591a9d2`; runs `fo3/surface/runs/JT_P1_*`, `W11_*`; the queue and the readers `jitter/p1/`: `gates_p1.sh`, `rd_gate_a.cjs`, `rd_latch.cjs`, `rd_park.cjs`, `cmp_first.cjs`, `cmp_all.cjs`)

* **G1 — both switches 0: identical.** `09fv_r01` against the study's `JT_r01`: every shared per-frame field bit for bit (2 775 frames: the camera,
  the gizmo, the piece, the picture's and the follower's state — the walker gained six `jt` fields since). `09fv_r03` and `n2b8_r01` had no study
  replay: their runs at 0 (`JT_P1_r03_00`, `JT_P1_n1_00`) are the baselines — against his rows the camera within 45 mm and 17 mm, his unlatch frames.
* **Every run at 1 is identical to its run at 0 up to the record's first unlatch** (each switch alone and both; the camera, the gizmo and the drawn
  piece bit for bit): neither switch acts before an unlatch.
* **Family A at each unlatch** (§5: the look point, the drawn piece and the eye each step < 10 mm more than the frame before; the view < 1°; through
  the way out the drawn heading's swing beyond its start and its end ≤ 2°; after the lift no turn over 1°):

| record (unlatches) | at 0 (= `3b7a479`) | A1-a alone | A2-a alone | both |
|---|---|---|---|---|
| `09fv_r01` top (f1906, f2872, f3553) | look 192 · 202 · 366, piece 180 · 182 · 194, eye 173 · 182 · 193 mm; view 0.80 · 0.40 · 0.82°; swing 14.1 · 11.9 · 10.2°; after the lift 1.27 · 0.65 · 1.95° | steps **0 · 0 · 0**, view **0.00°**; swing 13.9 · 11.8 · 10.2°; the lift as at 0 | steps 192 – 406 mm (the leap stays: now against the follower's own pose); view 0.24 · 0.05 · 0.11°; swing **3.3 · 4.2 · 0.8°**; lift **0.61 · 0.20 · 0.22°** | steps **0**, view **0.00°**; swing **3.3 · 4.1 · 0.6°** (⚠ 2 over 2°); lift **0.61 · 0.20 · 0.22°** |
| `09fv_r03` bottom (f12939, f13651) | look 84 · 116, piece 82 · 105, eye 86 · 114 mm; view 0.15 · 0.44°; swing 3.9 · 2.9°; lift 1.20 · 1.74° | steps **0**, view **0.00°**; the swing and the lift as at 0 | steps 84 – 123 mm; view 0.05 · 0.16°; swing 3.5 · 2.5°; lift **0.77 · 0.96°** | steps **0**, view **0.00°**; swing **3.5 · 2.5°** (⚠ both over 2°); lift **0.77 · 0.96°** |
| `n2b8_r01` bottom (f2908, f3380, f3600, f4019, f4547) | look 51 · 59 · 129 · 35 · 44, piece 79 · 161 · 78 · 55 · 26, eye 91 · 162 · 100 · 56 · 49 mm; view ≤ 0.38°; swing ≤ 0.3°; lift ≤ 0.01° | **all five PASS**: steps 0, view 0.00°, swing ≤ 0.30°, lift ≤ 0.01° | steps as at 0; swing ≤ 0.29°; lift ≤ 0.01° | **all five PASS** (as A1-a alone) |

* **The way in unchanged** — his two `Scene_1` records of the S14 gates (`s1back`, `s1front`) at BOTH switches 1 against their runs at 0 (`E0_*`):
  **every per-frame field bit for bit** (2 916 and 6 034 frames). ⚠ Neither record comes near a latch (the approach held at 0.81 and 1.0: far
  orbits) — they prove the switches change nothing far out. The way IN proper is read on the family-A records: before the first unlatch every run at 1
  is the run at 0 bit for bit (the way in from far and the first latch included); and after a way out that went on past the band's far edge (re-armed:
  `09fv_r03` f13265 – f13388, `n2b8_r01` f3393 – f3477) the next way in had the same band share frame for frame, the gizmo the same to 0.00 mm and
  the drawn view the same at the latch (0.00°).
* **The re-latch after a way out stopped inside the band** (D-J2 (b): `09fv_r01` f2476, f3395; `n2b8_r01` four times): continuous — the latch's turn
  from the pose drawn carries the picture rigidly with the piece (the view 0.00°); the frame's step is its own approach plus the piece taken from the
  follower's line onto the logic's (`09fv_r01` f2476: 108.6 mm, 81.0 at 0).
* ⚠ **WHAT THE GATES LEAVE — 4 of the 10 unlatches over the 2° swing (both switches), and its cause, measured (outside this packet; nothing built
  for it).** With the band silent the drawn heading is the follower's own plus the hand-over's offset left. At each LATCH the follower is PARKED
  (`followPark`, `picture_wiring.ts`: latched, its heading the turntable's ψ — set from the drawn up, i.e. the CAMERA's heading) while its state is a
  DIRECTION to which the owner's camera offsets are applied (`cameraYawOffsetDeg` 2.5° turns the heading by ≈ atan(sin 2.5° / cos el) — 6.4° at the
  cap's 67°): far out before the first latch on `09fv_r01` the follower's direction and its target are at 91.46° and the camera drawn at 85.02°; from
  the latch frame it is parked at 85.02°. At the unlatch the far reading comes back (91.46°, the frame after) and the follower's spring pays the
  difference BY TIME, while the hand-over's offset — read against the parked follower: 5.1°, not the 0.2° §4.2 computed against where the way out
  ends — is paid by the way out's share: two payers again, so the drawn heading rises with the spring and comes back with the share. The parked
  heading's offset at every latch: `09fv_r01` 6.44 · 5.31 · 5.25°, `09fv_r03` 4.70 · 4.70°, `n2b8_r01` 3.74 · 2.57 · 3.75 · 1.65 · 3.42° (there
  his orbit had paid most of the latch's turn: the swing stays ≤ 0.3°). ⚠ **The study's A3 is contradicted here**: the 6.4° "jump of the
  follower's far reading at the tilt-off" (§3.2) is not the calm's release — the far reading (`asmAskLevel`) holds 91.46° on every frame while the
  calm's sH eases 0.85 → 0.28 (on these level caps the calm does not move it; it is null under the tilt) — it is the parked heading's convention, so
  A3-a as designed (the calm carried out) would leave it. **The root is the follower's parking (R3, O-3 — the closed orbit's)**: its heading while
  latched in the camera's convention where the follower reads a direction's. A fix (the parked heading in the direction's convention — the far path's
  own heading carried through the latch, or the turntable's ψ turned by the owner's offset at the drawn elevation) changes the follower's state through
  every latch: for his word / the lead's, with A3's study (packet 2) — not patched here.
