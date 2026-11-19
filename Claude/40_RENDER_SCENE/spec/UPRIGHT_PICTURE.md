# The upright picture — gravity on the glass's vertical during the orbit (branch `1.0.148b-Fast_orbit_upright_gravity`)

> **What this is**: the specification of the fast orbit's second build. FO3 (S1, [`FAST_ORBIT.md`](FAST_ORBIT.md) §12 – §14) drew the picture as a
> follower of the logic and was deployed for the owner's look (main `4eabab8`). He found it very good but for one thing: the scene ROLLS on the
> screen. This file: his words (§0), the lead's decisions taken in his absence (§1 — ⭐ for his review), the build as briefed (§2), the gates
> (§3), then the design study this build rests on, unchanged (§4 onwards). What was built and measured goes in a section added at the END.

## 0. The owner's words (2026-11-18, verbatim)

On the deployed build (main `4eabab8` = `1.0.148-` at `48ae89c`): *"the build is very good at 160 ms and 90degrees: set them as default. However, I
want to modify something: is it possible to maintain the gravity align with the screen's vertical axis, or at least : for the vertical axis and
gravity alignment to be as the initial game (for example in previous branch 1.0.147-) ? That would avoid the scene to roll on the screen view
(which is annoying). note that a pitch in the screen view or a yaw in the screen view is ok, in my opinion as I judge it from the screen. I want to
avoid the roll of the scene in the screen view. Propose a logic, test the logic on simple geometries, then build it in a new branch
1.0.148b-Fast_orbit_upright_gravity."*

Then, before sleeping: *"I will go to sleep. finish the builder's report, update the md files in branch 1.0.148- then proceed with the build of
branch 1.0.148b, test, finetune until the result is acceptable, update the md files, deploy. then I will test tomorrow morning and we shall advise
the next step (full audit of orbit charts or rework of the fast orbit). In the meantime, do not ask me question nor decisions as I won't be able to
answer until tomorrow morning."*

**Two levels, his**: the IDEAL — world gravity always along the screen's vertical; AT LEAST — gravity on the screen as in `1.0.147-`. A yaw or a
pitch of the view is fine; a roll of the scene about the view is what he refuses. What he keeps of FO3: no stop of the gizmo under 90°.

## 1. The lead's decisions, taken in his absence — ⭐ FOR HIS REVIEW (each a switch or a slider)

| # | the decision | why | how to reverse it |
|---|---|---|---|
| UD1 | **Law U is built** (§2, §4's recommendation): the picture is the logic's pose turned about the line through the piece and the look point by the angle that puts gravity on the glass's vertical — in full from 25° off the vertical, not at all within 5° of it. No lag. | measured offline on his replayed hand: gravity tilted over 20° in 0.2 – 8 % of the frames (`1.0.147-`: 28 – 42 %; the deployed build: 44 – 53 %). The lead's own first proposal (a lagged roll toward upright) was refuted: worse than `1.0.147-` on the cube | `uprightPicture` 0 = the build he looked at, less S2 |
| UD2 | **A change of frame of ANY angle makes no timed turn, and never holds the gizmo, where the picture is fully upright** (25° or more off the vertical). ⚠ This bends his rule R6 (*a change of 90° or more is today's turn, the gizmo held*). | the hold exists because the glass turns upside down under the finger. Under U the glass does not turn: the gizmo would stop for up to half a second with nothing turning on the screen | `uprightFreeTurns` 0 = the turns of 90° or more held as before |
| UD3 | **Close in, under the square camera, U does nothing**: his rule T1 (the face's layout square on the glass) wins. | offline, U close in brought a frame of 32° of roll where `1.0.147-` shows 3°; close in the tilt is all near the vertical, where gravity has no direction on the glass | `uprightCloseIn` 1 = U under the square camera too |
| UD4 | **Within 25° of the vertical the game is `1.0.147-`'s**: every change of frame is a timed turn there, the gizmo held — FO3's follower is not used. | the follower's gap is the roll he refuses; a variant that kept it near the vertical measured worse than `1.0.147-` on the cube. ⚠ The price: over a top the stops at an edge are back | `uprightPicture` 0; the band on two sliders (`uprightFromDeg` 5, `uprightFullDeg` 25) |
| UD5 | **At rest the picture is the logic's pose made upright**, not that pose bit for bit (FO3's R5 bent). Nothing drifts. | the IDEAL asks for it | `uprightPicture` 0 |
| UD6 | **The half turn that going over a top needs** (gravity upright on both sides) is drawn where the view is nearest the vertical: a spin of the floor seen from above, at the pace the view leaves the vertical. Its speed can be capped. | unavoidable; in `1.0.147-` it is the timed half turn at the far edge | `uprightMaxDegS` (0 = no cap); the default is set by the gates (§3, U-G3) |
| UD7 | **`rollFollowMs` 160, `freeTurnMaxDeg` 90 are the defaults** (his word). Under U the follower's time acts only with `uprightPicture` 0. `freeTurnMaxDeg` 0 still gives `1.0.147-`'s game bit for bit, U included. | his word; R10 | the sliders |
| UD8 | **The finger is read off the picture drawn, everywhere** — but at the vertical the picture IS the logic's pose, so the finger is read there exactly as in `1.0.147-`. | S2 (the finger turned by the gap) made the yaw spin at a pole; with U the picture no longer depends on the logic's own roll, which breaks that loop | `uprightPicture` 0 |
| UD9 | **A gesture that reads the screen keeps reading the picture** (the resting face's roll axis, `camera.getDirection`). | it is what he sees | — |
| UD10 | **"Acceptable"** = §3's gates: on his replayed hand gravity's tilt and the scene's roll no worse than `1.0.147-`'s on any stretch and at most half of it in all; no runaway of the finger; close in unchanged. Two fix rounds at most. **If the gates still fail: `1.0.148b-` is deployed with `uprightPicture` 0 by default** (the build he called very good, less S2, at 160 ms) — he can then try the switch himself. Nothing undone. | he cannot be asked | — |

## 2. The build as briefed

**The law** (formulas: §4's part 3, "U"). Per frame, at the camera's stage: `G` = the logic's pose — the ghost, or the timed turn's pose where a
turn stays (FO3's gap is NOT applied); `L` = the framed line (piece → look point, `framedLine`); `ν` = the angle between `G`'s view and the world's
vertical; `α` = the turn about `L` that puts world-down on the glass's down (the root nearest 0; kept continuous across ±180° while `0 < w < 1`);
`w = smoothstep((ν − uprightFromDeg)/(uprightFullDeg − uprightFromDeg))`, times the square camera's complement (UD3: 0 while the square camera
holds the picture, back to 1 along the share its own turn already uses — no new clock); `φ = w·α`, its change capped by `uprightMaxDegS` where
`w < 1` only (exact at `w = 1`: a lag toward upright adds tilt); the picture `P = poseRolled(G, L, φ)`.

**In order, one commit each** (C = `src` + `tests`, P = `scripts/probes`, D = `.md`):
1. (C) the defaults: `rollFollowMs` 160.
2. (C) **U0** — `src/input/upright.ts`, pure: `α` (closed form or Newton, its no-root case stated), `ν`, `w`, the unwrap, the cap, `φ`; vectors,
   each red on a mutant: gravity exactly on the glass's vertical at `w = 1` whatever `G`'s own roll; the piece and the look point unmoved on the
   glass; `P = G` bit for bit at the vertical; continuity of `φ` through the band and across `α = ±180°`; the cap exact at `w = 1`; the same at
   60 and 143 frames a second.
3. (C) **U1 + U2** — the picture drawn behind `uprightPicture`; ⭐ `st.asmCamLast` stays the LOGIC's pose (`poseShown`, the free entry's heading
   read it), a new field carries the picture for the finger and the recorder; the finger's step read off the picture (outside a spit S2's
   `fingerOnGhost(picture, G)` — in the history at `48ae89c`; inside a spit `zoneFinger` off the picture's field); a reset clears the unwrap and
   the cap's state; the sliders in `gestureConfig.ts`, the menu (ORBIT › SMOOTHING), the menu's layout test.
4. (C) **U3** — behind `uprightFreeTurns`: a change of frame whose first frame has `w = 1` makes no timed turn whatever its angle (the kinds that
   stay — the square camera's, `byMm`, `out`, a tilt's — stay, FO3's rule by kind); where `w < 1` every change is `1.0.147-`'s timed turn (UD4).
5. (C) **S1's open regression traced** (FAST_ORBIT.md §14.6: the level entry's straight dy drifts twice as far sideways): its root; fixed here
   with a vector if it lies in FO3's code (suspected: `freeShownHeading` reading "a turn under way", blind to a freed turn); else reported.
6. (P) the gravity reader in `scripts/probes` (from the study's `m.mjs`: gravity's tilt on the glass, its roll per metre), the gates' batch.
7. The gates (§3) measured; (D) the section "as built" at this file's end, `TUNING_MENU.md`, `ORBIT_GATES.md`, a dated entry in `RND5.md`.

**Forbidden**: any change to WHAT the logic asks (R1) beyond UD2's freeing; to the piece's pose (R8); a rule naming a scene, a face or a geometry;
a lag or a follower toward upright outside the band (refuted, §4); a threshold in pixels or frames; a 3D orientation widget; `Scene_2`.

## 3. The gates — what "acceptable" means (in the game; like for like: per metre of gizmo travel, his hand replayed)

**The runs**: (H) his ten stretches far out at 60 frames a second, three at 0.736 and close in, two at 143; (R) the three seeded replays; (S) the
corner loops at 571 and 1 200 px a second, `Scene_1` over its top, `Scene_0` up, the edge and ridge walks, the level entry's walks, the dy hold's
walks. **The bases**, already recorded in the kit: `1.0.147-`'s game (`6f47219`), the deployed build (`48ae89c`); the switch-off base = the commit
before step 2 with `rollFollowMs` 160.

| gate | what passes |
|---|---|
| U-G1 | `uprightPicture` 0 = the commit before step 2, frame for frame (the three replays, a sample of every family); `freeTurnMaxDeg` 0 = `6f47219` bit for bit |
| U-G2 | **gravity on the glass** (its tilt, not counted within 10° of the vertical): on every stretch of his hand the share of frames over 20° not over `1.0.147-`'s; over the ten together at most HALF of it; the seeded replays not over `1.0.147-`'s + 0.5 point; no run over 90° in more than 1 % of its frames unless `1.0.147-` does. Reported: how far from 0 |
| U-G3 | **the scene's roll**: gravity's roll per metre of gizmo travel not over `1.0.147-`'s on every run; the largest frame reported — over 45° on his hand at 60 frames a second: the cap is tried (720 then 1 440 ° a second) and the default is the setting with the smallest largest-frame that still passes U-G2 |
| U-G4 | **the places**: the piece and the look point on the glass, picture against `G`: within 1e-9 of the half glass, every frame |
| U-G5 | **the finger**: no runaway — `Scene_1` over its top in `1.0.147-`'s frames + 10 % at most, its yaw never spinning; the level entry's walks on `Scene_0`'s bottom leave the face as in `1.0.147-` (S2 stuck there); the angle between the finger's way and the gizmo's ON THE PICTURE: its 95th percentile not over `1.0.147-`'s + 5° per stretch |
| U-G6 | **no stall** (reported against both bases): the frames with the gizmo held by a turn, per metre — not over the deployed build's on his hand; no frame held by a change whose first frame had `w = 1` (but the kinds that stay) |
| U-G7 | **where U is idle nothing moves**: the close-in runs identical to `uprightPicture` 0 frame for frame; the dy hold set as before; the level entry's walks no worse than `1.0.147-`'s (step 5) |
| U-G8 | `npm run verify`; every new vector red on a mutant; the documents and their two tests; the tree clean; no process left |

**To deploy with `uprightPicture` 1**: U-G1, U-G4, U-G5, U-G7, U-G8 pass, and U-G2 and U-G3 pass at least at the AT LEAST level. Otherwise UD10.

## 4. The design study, unchanged (one Opus agent, 2026-11-18; offline only, nothing built, no game run)

Nothing built, no game run. Scripts in this folder: `m.mjs` (part 0), `where.mjs`, `zones.mjs`, `sim.mjs` (part 4). Every figure below is MEASURED
on recorded frames unless it says estimate. The route of every recording is the recorded one: no law here re-reads the finger.

### The result first

1. **Today's game before FO3 (base, 6f47219) is upright almost everywhere but in one place: the spit's timed half turns.** On his hand
   (Scene_0bis, far) the frames with gravity tilted over 20° are 28 – 42 %, over 90° 10 – 24 %; in those runs 42 – 52 % of the frames are in a timed
   turn, and there the mean tilt is 56 – 76° against 1.4 – 9.5° when no turn runs. On the cube and the heptagon the base is upright (over 20°: 1.1 %, 0.4 %).
2. **The deployed build (48ae89c) adds tilt everywhere**: cube over 20° 1.1 → 15.2 %, heptagon 0.4 → 18.7 %, his hand 28 – 42 → 44 – 53 %; gravity's
   roll per metre ×1.3 – 3.4. Cause: S1's gap takes the WHOLE twist about the framed line, and a turntable yaw seen from above the horizon IS a twist
   about the view (yaw × sine of the elevation). The gap cancels it, then rolls it back in 160 – 200 ms: gravity tilts on every yaw.
3. **The logic's own target (the ghost before the timed turn's fade, `sh.gh3`) is nearly upright**: over 20° in 0.9 – 5.6 % of his hand's frames.
   The tilt the owner sees is made by the DRAWING (the turn's fade from a pose carried over the top; S1's gap), not by the logic.
4. **The lead's P2 as written is refuted**: carrying the roll in the cone and following the upright target with a lag makes the cube and the heptagon
   WORSE than base (over 20°: 17.7 %, 18.0 %), for the reason in 2. The neutral in the cone must be the ghost, not the carried picture.
5. **Recommended law U ("upright by the view's angle")**: the picture = the pose today would draw, turned about the framed line by `φ = w·α` —
   `α` the turn that puts world-down on the glass's down, `w` 0 near the vertical, 1 from 25° off it. No lag, no follower, no state but an unwrap.
   Offline on his hand: over 20° 0.2 – 8 % (base 28 – 42 %, deployed 44 – 53 %); never more tilted than base (0 – 1 frame a run far out).

### Part 0 — what he sees (the camera drawn: `c, t, up`)

Measures. **m1** = signed angle between world-down projected on the glass and the glass's down; undefined (cut, not counted) when the view is
within 10° of the vertical. **gRoll** = |Δm1| per frame × sine of the view's angle from the vertical (gravity's arrow turning, weighted by how
visible it is), per metre of gizmo travel. **vTwist** = the camera's twist about its own view per metre (includes a turntable yaw; for reference).

| run (60 fps) | base: >20° / >45° / >90° / max | deployed: same | gRoll °/m base → deployed | largest frame of gRoll |
|---|---|---|---|---|
| Scene_1 cube, seeded replay | 1.1 / 0.6 / 0.0 % / 74° | 15.2 / 4.7 / 0.2 % / 97° | 13 → 34 | 5.5 → 6.7° |
| Scene_0 heptagon, seeded | 0.4 / 0.0 / 0.0 % / 28° | 18.7 / 6.5 / 0.6 % / 122° | 11 → 37 | 6.3 → 7.0° |
| Scene_0bis, seeded | 16.3 / 13.4 / 8.3 % / 179° | 15.2 / 6.3 / 1.7 % / 180° | 43 → 83 | 8.6 → 18.0° |
| his hand ilmj_23s far | 28.5 / 19.6 / 10.7 % | 53.0 / 37.6 / 19.5 % | 83 → 138 | 25 → 36° |
| his hand ilmj_99s far | 32.7 / 23.0 / 9.9 % | 44.3 / 30.3 / 14.5 % | 102 → 125 | 22 → 29° |
| his hand vyah_11s far | 42.4 / 34.9 / 24.0 % | 43.8 / 34.5 / 20.4 % | 128 → 160 | 35 → 66° |
| his hand ogse_3s far | 41.3 / 24.2 / 14.0 % | 47.2 / 35.3 / 22.3 % | 98 → 132 | 10 → 20° |
| his hand ilmj_23s close in | 9.3 / 7.5 / 5.0 % | 9.4 / 7.5 / 5.1 % | 40 → 41 | 3.0 → 3.2° |
| corner loop ccw, 9.52 px/frame | 4.2 / 0 / 0 % / 31° | 0 / 0 / 0 % / 18° | 27 → 34 | 5.7 → 3.9° |
| Scene_1 over the top, 20 px/frame | 0.7 / 0 / 0 % / 23° | 8.5 / 4.9 / 1.4 % / 121° | 9 → 23 (vTwist 129 → 288) | 7.3 → 6.1° |
| Scene_0 up, 20 px/frame | 0 % / 2° | 0 % / 2° | 7 → 7 | 0.6° |

Where (frames over 20° or 45°): base, his hand — in the SPIT (100 %), during a timed turn (94 – 99 %); turns of 180° (`mix.rad`); the views 20 – 90°
off the vertical, mostly looking UP from under the axis. Base seeded Scene_0bis: one stretch of 138 frames upside down looking up, 20 – 40° off the
vertical, no turn. Close in: all near the vertical (under 25°) under the square camera. Deployed: the same turns plus S1's gap outside them (his
hand's free frames: mean tilt 9.5 → 13.3° on vyah_11s; cube and heptagon replays: the whole rise is free frames). ⚠ The seeded replays carry no
zone/turn tags, so "where" is read there only by the view's angle.

### Part 1 — the rules the new picture keeps

* **His words**: no roll of the scene about the view; a yaw or a pitch of the view is fine. IDEAL gravity on the glass's vertical; AT LEAST never more
  tilted than base on the same frame. Keep the fluidity (no gizmo stop under 90°, a smooth picture).
* **R1** (logic untouched), **R3** (piece and look point exact), **R8** (the piece is the logic's; nothing in the logic reads the picture), **R9**, **R10**
  kept. **R2** kept in form (one way every frame: the drawn pose turned about the framed line). **R4** (the gap's one law) and the follower: idle under
  U. **R5 BENT**: at rest the picture is the ghost made upright, not the ghost bit for bit (deterministic: no drift; |α| under 0.01° → 0).
  **R6** kept and possibly widened (decision D1). **R7** kept by P3.
* **T1 – T12**: T6 is what U strengthens (upright everywhere gravity means something). T1/T2 (close in: sections level and upright on the glass on the
  face under the gizmo) can be bent in the band 5 – 25° under the square camera (decision D2). T4/T5 (a turn at an edge, one rule, completes): U draws
  a freed turn's roll as nothing where w = 1; the turns that stay are unchanged in the logic. T9 (the dy hold) untouched (logic).
* **Standing**: the orbit logic not reopened; same direction gizmo/finger on the glass, no jump; no rule naming a scene or a face; thresholds in °, ms,
  °/s; no orientation widget; patent-free (the parts are gluLookAt's world-up camera and Shoemake 1994's twist, both old and free); one switch; sliders.

### Part 2 — obstacles, read in the code (48ae89c / HEAD)

* **Why the base is not upright** (`assemblyCameraFrameRaw`, `spitCameraHeading`, `spitStep`, polar_zone.ts l. 180 – 260): the spit camera IS a world-
  upright turntable (`offsetFrame(u, heading)`); its heading is biased to the SIDE of the axis from 60 – 75° of pitch so a camera passing over the
  axis keeps its picture; past the axis the side flips and ONE timed turn (`asmZoneMix`, `frameMix`, from `poseShown`) rolls 180° to the new side's
  upright. The fade starts from the pose shown (carried, upside down) — that fade is the 10 – 24 % over 90°. The tilted pole (`asmTilt`) and the
  square camera are upright in their frame F; their tilt lies near the vertical (part 0, close in).
* **Who reads the drawn pose**: `st.asmCamLast` is written with the PICTURE in S1 (`rollPictureFrame` l. 143) and read by the LOGIC — `poseShown` (a
  turn's start, l. 320, 2142, 2251), `freeEntry`'s heading (l. 2195), `zoneFinger` (l. 2334). ⛔ Under U it must be split: the logic keeps the pose
  today would draw; a new field carries the picture for the finger only. `green_box_wiring.ts` l. 325, 416, 1374 read `st.camera.getDirection(right)`
  (the resting face's roll axis when no pink axis): a gesture's reading of the screen — decision D6. The recorder must record ghost and picture.
  The gizmo's sections are world geometry: under U they are drawn as the logic placed them; a φ of 180° keeps horizontal lines horizontal.
* **The S2 feedback on Scene_1's top is real** (CHECKPOINT_S1: yaw −30 → 487°, roll 129 → 288°/m): at the pole a dx makes the ghost SPIN about the view
  instead of moving the gizmo; S2 turns the next finger step by the gap that spin opened, which feeds more dx. P3 alone would keep it wherever the
  picture differs from the ghost at the pole. **What breaks it under U: φ = 0 at the pole** (w = 0 under 5°), so the finger is read exactly as base
  there. In the band 5 – 25° the loop gain is at most w × the logic's spin per dx — not measurable offline (gate G5).
* **Timed half turns under U**: the fade's roll is cancelled where w = 1 (the picture stays upright), so the gizmo hold would show as a stall with
  nothing turning (D1). In the cone (under 5°) the turn is drawn as today: a spin of the floor seen from above. **The lead's "known and unavoidable"
  is right**: over a top with gravity upright on both sides a half turn about the view is needed; U places it where the view is nearest the vertical
  — at the speed the view crosses the band (U) or at a capped speed (U-cap). A reset (O11): φ = w·α at once, no state to clear but the unwrap.
* **Close in**: the tilt there lies under 25° from the vertical; U leaves the cone to today's drawing.

### Part 3 — the designs (formulas; angles in rad in code, ° in sliders)

Common: per frame, `G` = the pose today's stage would draw (the ghost when no turn stays, `zoneMixPose`'s pose otherwise); `L` = the framed line
(piece → look point, `framedLine`); `ν` = the view's angle from the vertical; `α` = the root of `m1(rolled(G, L, α)) = 0` nearest 0 (Newton on the
rolled pose, 3 – 6 steps; `rolled` = `poseRolled`); picture `P = rolled(G, L, φ)`.
* **P2 (lead)**: `φc = φ − τ` (τ = the ghost's twist); target `φc + wrap(α − φc)` if ν > 10°, else `φc`; φ follows by the critically damped ease
  (160 ms). Refuted offline (below): the carry removes the turntable yaw's twist and the lag restores it as tilt.
* **U (recommended)**: `w = smoothstep((ν − ν0)/(ν1 − ν0))`, ν0 = `uprightFromDeg` 5°, ν1 = `uprightFullDeg` 25°; `φ = w·ᾱ`, ᾱ = α unwrapped
  only while 0 < w < 1 (at w = 1 a turn of 2π is the same pose). No follower. Finger (P3): the step turned by the picture's roll against G (S2's
  `fingerOnGhost(picture, G)`), in a spit read off the picture's frame. Turns: a change is freed by S1's rule only if w = 1 at its first frame (D1).
  Switch `uprightPicture` 0 = 48ae89c (S1 at 160 / 90 as he asked); `freeTurnMaxDeg` 0 = base bit for bit.
* **U-cap (fallback)**: `φc = φ + w·Δα` (exact at w = 1), then φ moves toward `w·ᾱ` by at most `uprightMaxDegS` × dt (720 °/s; 0 = U).
* **U2 (rejected)**: U plus S1's gap in the cone (`φ = w·ᾱ + (1−w)·g`) — the gap again carries twist (cube over 20°: 2.1 % against U's 0.0 %).
* **U1s (rejected)**: w smoothed in time (200 – 400 ms) — in the cone it applies α where α is wild near the vertical (his hand up to 35 – 47 % over 20°).
* Prior art (all old, free): the world-up look-at camera with a pole fallback (gluLookAt, early 1990s; turntable orbits in modelling tools); Shoemake's
  swing–twist (Graphics Gems IV, 1994); parallel transport of the up (Bishop, 1975 — what P2's carry is, and why it fails here: a carried up is not a
  gravity up); critically damped followers (Game Programming Gems 4, 2004). ⛔ Not used: any orientation widget (ViewCube, patented); HoverCam (2005).
  No web search was made.

### Part 4 — the test offline (`sim.mjs`; 60 fps; cut 10°; band 5 – 25°)

(a) **Over today's drawing** (`runs/new`, SRC=drawn: base with its timed turns), (b) **over the logic's ghost on the deployed route** (`runs/s1`,
`sh.gh3`: every change at once — an approximation of "turns freed"). Over 20° / over 90° / max; gRoll °/m; largest frame of gRoll.

| run | base drawn | P2 (a) | U (a) | U-cap 720 (a) | U (b) |
|---|---|---|---|---|---|
| cube seeded | 1.1 / 0 % / 74°; 13; 5.5° | 17.7 / 2.5 %; 57 | 0.1 / 0 % / 61°; 5; 15° | 0.4 / 0 % / 61°; 5; 8.4° | (a, gh3) 0.0 % / 13°; 3; 2.3° |
| heptagon seeded | 0.4 / 0 % / 28°; 11; 6.3° | 18.0 / 3.1 %; 60 | 0.1 / 0 % / 21°; 4; 2.8° | — | (gh3) 0.1 % / 17°; 4; 2.8° |
| Scene_0bis seeded | 16.3 / 8.3 % / 179°; 43; 8.6° | 13.6 / 0.6 %; 80 | 1.4 / 0 % / 139°; 8; 39° | 2.0 / 0.3 % / 163°; 11; 8.4° | (gh3) 1.3 / 0 % / 139°; 5 |
| hand ilmj_23s | 28.5 / 10.7 %; 83; 25° | 32.0 / 8.0 % | 0.8 / 0 % / 79°; 11; 37° | 8.7 / 3.1 %; 45; 15° | 4.1 / 0 % / 74°; 7; 25° |
| hand ilmj_99s | 32.7 / 9.9 %; 102; 22° | 29.1 / 7.8 % | 2.0 / 0.1 % / 91°; 18; 46° | 9.1 / 2.4 %; 54; 16° | 0.2 / 0 % / 25°; 3; 11° |
| hand vyah_11s | 42.4 / 24.0 %; 128; 35° | 31.5 / 11.5 % | 6.1 / 1.2 % / 139°; 39; 60° | 21.2 / 8.7 %; 106; 26° | 0.3 / 0 % / 39°; 4; 18° |
| hand ogse_3s | 41.3 / 14.0 %; 98; 10° | 29.5 / 7.5 % | 8.0 / 0.8 % / 149°; 31; 44° | 14.1 / 3.6 %; 58; 11° | 1.1 / 0.1 % / 131°; 8; 44° |
| hand close in | 9.3 / 5.0 %; 40; 3.0° | 12.9 / 2.2 % | 5.4 / 0.2 %; 42; 32° | 6.3 / 1.3 %; 32; 7° | — |
| Scene_1 over top | 0.7 % / 23°; 9 | 18.1 / 10.4 % | 0 % / 11°; 3; 5.1° | 0 % / 11° | 0 % / 10°; 1; 1.5° |
| corner ccw / edge | 4.2 % / 1.5 % | 5.8 % | 0 % / — | 0 % | 0 % / 0 % |

* **Places on the glass**: piece and look point exact under every law (largest error 8e-16 half-glass; a turn about the line through both).
* **Never more tilted than base** (frames over 5° and 1° more than base's, law (a)): U 0 – 1 a run far out, 10 of 1 059 close in; U-cap 0 – 27.
* **The finger turn P3 must apply** (|φ|): route (b) 95th percentile 3 – 12°, largest 30 – 173°; route (a) 95th 53 – 154° (the fade's carried pose).
* **The one cost of U**: when the view crosses the band fast while G is upside down (the spit's fade), the rest of the half turn is drawn in 1 – 2
  frames: the largest gravity frame 37 – 60° (base 10 – 35°); the view jumps 15° a frame there at his pace. U-cap trades it for a longer tilt.
* **What offline cannot tell**: the route once the finger is read off the picture (P3) and once turns are freed by w; the loop in the band; 143 fps;
  how the freed half turns change T9's holds; what the sections and the pink axes look like. Hence the gates below, in the game, like for like.

### Recommendation

**Build U**, U-cap behind its slider (0 = off) as the fallback if the band's fast half turn reads as a snap on his device.
**Gates** (in the game; per metre of gizmo travel; his hand replayed far and close, 60 and 143 fps; seeded replays of Scene_0, Scene_1, Scene_0bis;
the corner loops; Scene_1 over the top; Scene_0 up; the edge and the ridge walks): G1 `uprightPicture` 0 = 48ae89c bit for bit and `freeTurnMaxDeg`
0 = base bit for bit (2 794 / 2 794 frames); G2 over 20°: hand ≤ 8 %, seeded ≤ base, Scene_0bis ≤ 2 %, no run over 90° in more than 1 %; G3 gravity
roll per metre ≤ base on every run, the largest frame reported (fails over 45° → switch U-cap on); G4 places ≤ 1e-9; G5 the finger: A6's angle on
the PICTURE ≤ base's 95th, Scene_1 over the top in ≤ base's frames (193) with the yaw monotone (no runaway); G6 gizmo-held frames ≤ deployed;
vectors that fail on 48ae89c, mutants red; the device look closes it.
**Packets**: U0 `src/input/upright.ts` (α, w, φ, unwrap; pure; vectors red on the old code) → U1 the picture in `rollPictureFrame` behind the switch,
`asmCamLast` split from the finger's field, recorder fields → U2 P3 (outside a spit `fingerOnGhost`; inside, `zoneFinger` off the picture field) →
U3 the freeing rule by w (and D1) → U4 the gates' runs → U5 deploy and his look.
**Decisions for the owner**: D1 free the half turns where the view is 25° or more off the vertical (no stall, nothing visible turns) or keep 90°
timed (a stall with no visible turn); D2 U under the close-in square camera, or T1 wins there; D3 the half turn over a top drawn as a spin of the
floor seen from above, at the view's speed (U) or capped (U-cap); D4 `rollFollowMs` 160 then serves only the switch off; D5 R5 bent (the rest pose is
the upright one); D6 the resting face's roll axis read off the picture (what he sees) or the logic.
**Advise against**: P2 as written (refuted: worse than base on cube and heptagon); any follower lag toward upright outside the band; smoothing w in
time; S2's finger at the pole; keeping S1's gap under U.
**Not checked**: no game, no vitest, no device; the s1 files read are those that parsed whole; HEAD has S2 reverted (f198b3a) while runs/s1 is 48ae89c;
the band 5 – 25° and the cap 720 °/s are guesses (sliders); A6 on the picture not computed; T9 holds under freed half turns.

## 5. As built and measured (the builder, 2026-11-18, night; local commits, nothing pushed)

**The result first.** Law U is built and on by default. On his ten stretches replayed far out, **gravity is tilted over 20° in 3.2 % of the
frames** (`1.0.147-`: 35.4 %; the deployed build: 47.0 %), every stretch under `1.0.147-`'s, and **gravity's roll falls to a fifth** (19.9° a metre
against 101.5 and 127.2). On the corner loops gravity never tilts at all; over `Scene_1`'s top the yaw runs as in `1.0.147-` (no runaway).
⛔ **But the half turn over a top now often happens in ONE frame**: 84 frames on the ten stretches where the whole camera turns more than 90° from one
frame to the next (`1.0.147-`: 0; the deployed build: 0). The owner may see this as a snap. The specification assumed the view leaves the 5 – 25° band
over several frames; at his pace the logic's view itself turns 10 – 30° a frame at a turn's start (`1.0.147-` too), so it crosses the band in one
frame and `φ` jumps from 0 to the whole half turn. The cap inside the band cannot help (the band is crossed in one frame); an experiment (not
committed) with the cap applied at `w` = 1 too cuts these frames to 10 (below).

### 5.1 What was built (commits on `1.0.148b-`)

| commit | kind | what |
|---|---|---|
| `7bcae02` | C | `rollFollowMs` 160 ms by default (his word; UD7) |
| `e82ae2e` | C | **U0** `src/input/upright.ts`, pure: `ν`, `w` (smoothstep), `α` in CLOSED FORM (the turn about the framed line whose glass right is level and whose up is to the sky, the root nearest 0; none when no turn about that line can level the glass — then the last `ᾱ` is held), `φ = w·ᾱ` unwrapped in the band, the cap; 13 vectors, 12 mutants all red |
| `bb4b5fa` | C | **U1 + U2** `roll_shadow.ts` `uprightPictureFrame` behind `uprightPicture`: `G` = `zoneMixPose`'s pose (FO3's gap not applied), the picture `poseRolled(G, L, φ)`; `asmCamLast` stays the logic's, `asmPicLast` the picture's; the finger off the picture (outside a spit `fingerOnGhost`, back from `48ae89c`; in a spit the picture's frame); the square camera's complement (`uprightCloseIn` 0); ⚠ a turn now starts from the LOGIC's last pose (`poseShown`: it read the camera drawn, not `asmCamLast` as §4 said — from the picture, law U would turn it once more in the band); 11 vectors, 9 mutants red |
| `8348ce1` | C | **U3** `uprightFrees`: a change of frame freed only where `w` = 1 at both its ends (the pose before, the ghost after); any angle with `uprightFreeTurns` 1, under `freeTurnMaxDeg` with 0; the kinds that stay unchanged; 4 vectors, 5 mutants red |
| `e615a61` | P | `gravity_read.mjs`, `upright_batch.sh`, `uw` / `uf` in the recorded shadow (`ORBIT_GATES.md` §13) |

**The sliders** — ☰ › ORBIT › **UPRIGHT PICTURE** (a section of its own: SMOOTHING may hold 9 at most): `uprightPicture` 1, `uprightFreeTurns` 1,
`uprightCloseIn` 0, `uprightFromDeg` 5°, `uprightFullDeg` 25°, `uprightMaxDegS` 0 (no cap). `rollFollowMs` (160) and `freeTurnMaxDeg` (90) stay in
SMOOTHING. **126 sliders.** `freeTurnMaxDeg` 0 is still `1.0.147-`'s game bit for bit, law U included.

### 5.2 The gates (his hand: the ten stretches far out at 60 frames a second; `1.0.147-` = `6f47219`, deployed = `48ae89c`)

| gate | measured | verdict |
|---|---|---|
| U-G1 | `uprightPicture` 0 against step 1's code: the three replays 2 794 / 2 794 identical, `ilmj_23s` far 886 / 886, the three close-in stretches 1 059 / 1 161 / 1 166 identical. `freeTurnMaxDeg` 0 against `6f47219`: the replays, `ilmj_23s` far and `Scene_1` over its top identical | ✅ |
| U-G2 | over 20°: the ten 3.2 % (`1.0.147-` 35.4, deployed 47.0); a stretch 0.9 – 10.1 % against 23.4 – 46.2 — each under; over 90° at most 0.7 %. Replays `Scene_1` 1.0 % (1.1), `Scene_0` 0.0 % (0.4), `Scene_0bis` 0.5 % (16.3; over 90°: 0 against 8.3) | ✅ the IDEAL nearly |
| U-G3 | gravity's roll a metre: the ten 19.9 (101.5; deployed 127.2), a stretch 12.9 – 31.6 against 71.8 – 127.7; replays 7.5 / 3.9 / 10.0 (13.4 / 11.3 / 43.0); corner loops 0 (18 – 37); `Scene_1` over its top 3.4 (9.3). ⛔ The largest frame: 44 – 88° on his hand (`1.0.147-` 10 – 45), `Scene_0bis` replay 37.9° (8.6). The cap tried: 720° a second in the band — worse (75 – 131°, 33.1° a metre); the band 5 – 45° with 720 — worse (9.2 %, 66.6° a metre). Default left: no cap | ✅ per metre, ⛔ the largest frame |
| U-G4 | the piece and the look point on the glass, picture against `G`: at most 1.8e-15 of the half glass (13 521 frames) | ✅ |
| U-G5 | `Scene_1` over its top: 165 frames (`1.0.147-` 168, deployed 339), the yaw −91° → 319° (−90° → 321°): no runaway. The level entry's walks on `Scene_0`'s bottom close in: 588 / 624 / 597 / 524 frames, drift 0 — as `1.0.147-`. ⛔ A6 on the picture, 95th percentile (`1.0.147-` → U): 37.6 → 39.9, 44.3 → 80.9, 44.1 → 41.2, 50.1 → 89.0, 79.1 → 89.8, 71.1 → 77.9, 57.5 → 72.4, 52.2 → 82.6, 48.2 → 76.9, 65.3 → 39.1 — over `1.0.147-` + 5° on 7 of 10 (the deployed build: 102.3, 52.3, 31.4, 74.6, 89.9, 89.6, 72.6, 90.1, 69.0, 40.7) | ⛔ A6 |
| U-G6 | frames held by a turn a metre (U / deployed / `1.0.147-`): 27.2 / 19.8 / 33.5, 21.9 / 18.2 / 21.3, 25.8 / 25.6 / 30.8, 16.2 / 13.7 / 26.1, 15.8 / 15.3 / 20.6, 23.3 / 17.4 / 32.3, 12.6 / 13.3 / 22.0, 15.9 / 12.3 / 24.1, 17.3 / 13.9 / 24.9, 25.0 / 13.6 / 23.5 — over the deployed build's on 9 of 10 (UD4's price: every change in the band is timed), under `1.0.147-`'s on 8. Turns of 88° or more that stay: 0 on every stretch (`1.0.147-` 4 – 14) | ⛔ against the deployed |
| U-G7 | ⛔ The close-in stretches cannot be identical to `uprightPicture` 0: their first ~180 frames are still far enough that `w` = 1 (the rest made upright, UD5: φ 1.4°), and `uprightPicture` 0 draws S1's own gap there. Gravity close in: `ilmj_23s` as `1.0.147-`; `ilmj_99s` better (over 90° 1.1 → 0.2 %); `vyah_11s` worse (over 90° 0 → 1.0 %, roll 29 → 48° a metre). The level entry's straight dy (step 5): drift 1.2 – 1.9 × `1.0.147-`'s | ⛔ |
| U-G8 | `npm run verify`, the documents' two tests, the tree, the processes: the report (`fo3/upright/REPORT_U_BUILD.md`) | see there |

### 5.3 Step 5 — the level entry's straight dy (FAST_ORBIT.md §14.6): traced, not fixed

**The suspect is refuted**: the free face's heading (`freeShownHeading`) is the same frame for frame in `1.0.147-`, S1 and U (`b_dy_x190`: −49.8 /
−51.1 / −51.1°, then −63.6 / −64.1°). **The root**: the picture differs from the logic's pose while the free face's heading step rolls the logic's
camera, and the finger in a spit is read off the PICTURE. Under S1 the follower lags that roll (nine frames after the entry the camera's up is
(0.49, 0.21, −0.85) against `1.0.147-`'s (−0.03, 0.18, −0.98)); under U the picture is held upright (0.65, 0.49, −0.58 against 0.33, 0.45, −0.83).
It is R7 / UD8's choice (the finger read off what he sees), not a defect of FO3's code alone. Drift from the entry (mm), `1.0.147-` / S1 / U:
−96 / −218 / −181, 92 / 216 / 135, −167 / −363 / −244, 154 / 339 / 192, −251 / −381 / −337, 235 / 374 / 280. On the glass the gizmo's way off
straight down, median: 7.8° / 12.2° / 9.7°.

### 5.4 Amendments the frames ask for (none built)

1. **The band is crossed in one frame at his pace** — refutes UD6's "at the pace the view leaves the vertical" and U-G3's cap rule (a cap inside the
   band only cannot act). The smallest amendment that keeps his words: **the cap on the deviation from the carry at `w` = 1 too** (the carry
   `w·Δα` keeps a rigid roll exact, so the cap acts only where `φ` jumps). Measured as an experiment (one line, not committed), 720° a second: frames
   turning over 90° in one 84 → 10; gravity's largest frame 44 – 88° → 12 – 25°; but over 20° 3.2 → 12.0 % (still each stretch under
   `1.0.147-`, the ten under half of it), roll 19.9 → 51.0° a metre (each under `1.0.147-`); A6 unchanged. It bends "Forbidden: a lag toward
   upright outside the band" — the lead's and the owner's decision.
2. **U-G7 as written** (close in identical to `uprightPicture` 0) is unreachable with UD5 and with S1's gap close in: judge close in by its figures.
3. **U-G5's A6** fails on 7 of 10 (as it did for S1): the finger read off a picture that differs from the logic's — the same root as 5.3.

### 5.5 What he will feel

Far out: the scene stays upright — no slow roll on every yaw any more, no half-second roll after a crossing. Corner loops: perfectly calm. ⛔ Over a
top or a tip's axis at his pace: the half turn arrives in one frame — a flip of the scene, where `1.0.147-` rolled it over half a second.
Close in: as before (the square camera). The gizmo stops at an edge again inside the band (5 – 25° from the vertical); outside it, never.
**Not run**: `Scene_0` up, the edge and ridge walks, the dy hold's walks, the stretches at 0.736 and at 143 frames a second.

## 6. Fix round 1 as briefed — the one-frame flip refutes UD6: the way to upright is paced in TIME, everywhere (the lead, 2026-11-18, 23:45; ⭐ for his review)

**What the builder's frames say** (§5). Law U keeps gravity upright: on his ten stretches the frames with gravity tilted over 20° fall to 3.2 %
(`1.0.147-`: 35.4 %; the deployed build: 47.0 %). ⛔ But the half turn that a pass over the vertical needs arrives in ONE frame: 84 frames turn
the whole camera by more than 90° from one frame to the next (`1.0.147-`: 0; the deployed build: 0). **UD6 is refuted**: it assumed the view
leaves the vertical over several frames. At his pace the logic's own view turns 10 – 30° in a frame when a turn starts (it does in `1.0.147-`
too), so the band 5 – 25° is crossed in one frame and a cap acting only inside the band never acts. The builder's uncommitted experiment — the
cap acting where the picture is fully upright too, 720° a second: 84 → 10 flips; the largest frame of gravity's roll 12 – 25° (`1.0.147-`:
10 – 45°); over 20° 12.0 % (under `1.0.147-`'s on every stretch, a third of it in all); gravity's roll 51° a metre (`1.0.147-`: 101.5°).

**The lead's amendments** — UD6, UD4 and §2's "Forbidden: a lag toward upright outside the band" are amended; the owner's words are kept: the half
turn cannot be avoided, it must never be a jump (his standing rule: no jump).

* **UD6b — the law in time.** The picture's turn `φ` moves in two parts each frame. (1) THE CARRY, at once: `φ ← φ + c·wrap(α − α_prev)`, with
  `c = w` — the picture follows the logic's own roll where gravity has no direction on the glass (at the vertical: `1.0.147-`'s picture) and
  stays upright where it has one. (2) THE REST: what is left to the target `w·α` — taken the short way, `α` always the root nearest 0, no unwrap
  state — closes at `uprightMaxDegS` at most, EVERYWHERE: default **720° a second**, set by the gates below (0 = at once: law U as first built).
  So the half turn after a pass over the vertical is a roll of a quarter of a second with the gizmo free — never a flip; and on any path that
  stays off the vertical, and at rest, the picture is exactly upright: the carry is exact. What §4 refuted is a lag of the CARRY; this is not one.
* **UD4b — no stop under 90° near the vertical either.** On the frame a change of frame is FREED, the carry is whole: the picture keeps its roll
  across that frame (the frame's twist of the logic's pose about the framed line undone — `twistAbout`, well defined at the vertical, where `α`
  is not), and the rest closes by (2). Freed = FO3's rule at any `w` (under `freeTurnMaxDeg`, the kinds that stay excepted), and UD2's any angle
  at `w = 1`. Behind `uprightBandFree` (default 1; 0 = UD4: within the band every change is `1.0.147-`'s timed turn). ⚠ At the vertical only a
  CHANGE OF FRAME may open a rest — never the logic's continuous spin there (that was S2's loop: its gap took the spin).
* **The gates amended.** U-G3: the frames turning the WHOLE camera by more than 45° and by more than 90° from one frame to the next — not more
  than `1.0.147-`'s on the same stretch (0 over 90°); the cap's default = the fastest of 720 and 1 440° a second that keeps this, U-G2 still
  passing. U-G5: the finger's angle read apart on the frames where the picture is steady (the rest under 5°) and where it is closing — steady: its
  95th percentile not over `1.0.147-`'s + 5°. U-G6: against the deployed build again. U-G7: close in judged by its figures per metre against
  `1.0.147-`'s — it cannot be frame for frame (§5: the rest pose is made upright before the square camera holds). The others as §3.

## 7. Fix round 1 as built and measured (the builder, 2026-11-19, night; local commits, nothing pushed)

**The result first.** No frame now turns the whole camera by more than 90° on his ten stretches (84 at §5, 0 in `1.0.147-`). Gravity is tilted
over 20° in **7.1 %** of the frames (`1.0.147-` 35.4 %, deployed 47.0 %), under `1.0.147-` on every stretch; its roll is **57.0° a metre**
(101.5; 127.2). The half turn over a top is now a roll of about an eighth of a second (1 440° a second). ⛔ Still open: frames turning the
camera by 45 – 90° in one frame are more than in `1.0.147-` (45 against 5 on the ten); the finger's angle on the picture (A6) is over
`1.0.147-`'s on 9 of 10 stretches; the frames held a metre over the deployed build's on 5 of 10.

### 7.1 What was built

| commit | kind | what |
|---|---|---|
| `5d1f17c` | C | **F1, UD6b** — `uprightPaced` (`upright.ts`): the carry at once, `c = min(w, w before)`; the rest to `w·α` closed at `uprightMaxDegS` everywhere, the short way, `α` the root nearest 0, no unwrap; `uprightMaxDegS` 0 = law U as first built. ⚠ §6 wrote `c = w`: the 10 flips left by §5's experiment were exactly that — an `α` read just inside the band (where it is wild) carried at the weight after a one-frame crossing (vector (c'')). 10 vectors, 9 mutants red |
| `d7ec0d2` | C | **F2, UD4b** — `uprightBandFree` (1): FO3's rule frees a change at any `w`; on a freed frame the twist of `G` about the framed line is undone (the picture keeps its roll), the rest closes in time. 2 vectors, 4 mutants red |
| `9cf3fda` | C | **F3** — the 3 – 5 flips left at 720 / 1 440: on a TIMED turn's first frame the logic's view jumps 33 – 54° across the band and its `Δα` (not a roll) was carried at `c` 0.69 – 1 (`uf` 9° → 132° in one frame, `vyah_42s` frame 67); that frame is now carried by the twist too. Flips 3 → 0. 1 mutant red |
| `06d9faa` | C | `uprightMaxDegS` 1 440 by default (the gates, below) |

### 7.2 The gates (his ten stretches far out at 60 frames a second; the final code, 1 440° a second, unless said)

| gate | measured | `1.0.147-` (`6f47219`) | deployed (`48ae89c`) | verdict |
|---|---|---|---|---|
| U-G1 | `uprightPicture` 0 = `7bcae02`, `freeTurnMaxDeg` 0 = `6f47219`, `uprightMaxDegS` 0 + `uprightBandFree` 0 = `e653099`: the `Scene_1` replay and `ilmj_23s` identical frame for frame (`Scene_0bis` 5.6e-9 from frame 3, its known noise) | | | ✅ |
| U-G2 over 20° | 7.1 % in all; 4.4 – 10.0 % a stretch; over 90° 1.4 – 4.1 %; replays 1.0 / 0.0 / 1.0 % | 35.4 %; 23 – 46 %; over 90° 7 – 24 %; 1.1 / 0.4 / 16.3 % | 47.0 % | ✅ |
| U-G3 roll a metre | 57.0°; 37.7 – 89.9° a stretch; replays 7.5 / 4.0 / 13.8°; `Scene_1` over its top 3.4° | 101.5°; 13.4 / 11.3 / 43.0°; 9.3° | 127.2° | ✅ |
| U-G3 whole camera in one frame | over 90°: 0 (replays 0, `Scene_1` over its top 0); over 45°: 5, 8, 0, 4, 10, 10, 2, 2, 2, 2 a stretch | over 90°: 0; over 45°: 2, 0, 0, 1, 1, 0, 1, 0, 0, 0 | 0 | ✅ over 90°; ⛔ over 45° |
| U-G3 largest frame of gravity's roll | 22.9 – 79.1° (`vyah_42s` 79, `ilmj_39s` 47) | 10 – 45° | | ⛔ on 2 |
| U-G4 | as §5 (at most 1.8e-15) — not re-read | | | ✅ (§5) |
| U-G5 | `Scene_1` over its top 165 frames (168), no runaway; `Scene_0`'s bottom close in: errors 0, as before (at `d7ec0d2`, 720). ⛔ A6 steady (rest under 5°), 95th percentile: 54.6, 94.6, 59.2, 92.9, 118.6, 90.4, 83.0, 79.3, 85.5, 58.4; closing frames 0 – 10 a stretch | 37.6, 44.3, 44.1, 50.1, 79.1, 71.1, 57.5, 52.2, 48.2, 65.3 | | ⛔ 9 of 10 |
| U-G6 held a metre | 23.9, 14.6, 21.5, 12.9, 12.4, 17.1, 16.2, 19.3, 14.1, 13.8 | 33.5, 21.3, 30.8, 26.1, 20.6, 32.3, 22.0, 24.1, 24.9, 23.5 | 19.8, 18.2, 25.6, 13.7, 15.3, 17.4, 13.3, 12.3, 13.9, 13.6 | ✅ base; ⛔ deployed on 5 |
| U-G7 close in (at `d7ec0d2`, 720: φ at most 1.4° there) | `ilmj_23s` as `1.0.147-`; `ilmj_99s` over 90° 0.2 % (1.1), roll 32 (49.6); `vyah_11s` over 90° 1.0 % (0), roll 48.4 (29.0). Straight dy, off straight down on the glass (median): 9.9, 9.1, 10.8, 10.9, 10.6, 10.8° | 7.8, 7.6, 8.9, 8.4, 10.8, 10.5° | | ⛔ `vyah_11s`, the straight dy |
| U-G8 | `npm run verify`, the documents' two tests, the tree, the processes | | | ✅ |

**720° a second** (F3 included): over 20° 13.9 %, roll 72.1° a metre, one frame over 90° (`ilmj_23s`), 33 over 45°. Before F3: 720 left 5 flips,
1 440 left 3.

### 7.3 The defaults left, and why

`uprightMaxDegS` **1 440** (the faster of the two, and the only one with no frame over 90°; U-G2 passes); `uprightBandFree` **1** (no runaway, no
flip measured with it); the others as §5. **Which assumptions of §6 the frames refute**: (1) `c = w` (above: F1); (2) "the carry is exact"
holds for the logic's ROLL only — where the logic's VIEW jumps (a timed turn's first frame) `Δα` is not a roll (F3); (3) U-G3's "over 45° not
more than `1.0.147-`": the logic's own view jumps 33 – 54° there, and a picture kept upright through it turns the camera by more than the view;
the smallest amendment that keeps his words is to judge "no jump" over 90° (a flip) and report 45 – 90°; (4) U-G5's A6 does not depend on the
pace (identical at 720 and 1 440): its root is UD8 (the finger read off a picture that differs from the logic's), unchanged by this round.

### 7.4 What he will feel

Far out: the scene stays upright; over a top the floor turns round in about an eighth of a second instead of a flip or half a second's roll;
no stop of the gizmo under 90° near the vertical either. Some frames still swing the view by 45 – 90° where `1.0.147-` swings it less — at the
start of a timed turn. Close in as before. **Sliders** (☰ › ORBIT › UPRIGHT PICTURE, 7): the rest's pace `uprightMaxDegS` (1 440; 720 slower),
`uprightBandFree` (1; 0 = the gizmo stopped in the band again). **Not run**: the stretches at 143 frames a second and at 0.736, the corner
loops, the dy hold's walks; close in and the level entry not re-run after F3 (φ at most 1.4° there).

## 8. The independent test, and fix round 2 as briefed (the lead, 2026-11-19, 02:35; ⭐ for his review)

**The test** (one Opus auditor; its own runs and readers at `0816078` — the kit's `fo3/upright/audit`): **FAIL — one blocker.** What it measured again
and confirms: the switches give the earlier games back frame for frame (U-G1); on his ten stretches gravity tilted over 20° in 7.1 % of the
frames (`1.0.147-`: 35.4 %), gravity's roll 57.0° a metre (101.5°), no frame turning the camera by more than 90°; at 143 frames a second no error
and no flip (over 20°: 5.8 and 15.3 % against 36.9 and 36.7 %); `Scene_1` over its top, the level entry's walks, the corner loops, the stretches
at 0.736: pass.

* ⛔ **THE BLOCKER — the dy hold is broken**: on the hold walks over `Scene_0bis`'s bottom face far out no hold is set on 6 sub-walks of 6
  (`1.0.147-` sets it on 4), and the come-back is never honoured on two where `1.0.147-` honours it. **The root** (frames 66 – 98 of `b_far` s0):
  the dy's sign that the hold reads (`asmDySign`, `edgeHoldDy`, `edgeHoldFinger` — `pointer_wiring.ts` l. 336 – 342) is the RAW glass dy, read
  BEFORE the finger is turned from the picture onto the logic's glass (`zoneFinger`). With the picture and the logic's pose 143° apart, the hold's
  rules (`exitHoldSign`, `crossingEvent`, `crossingHold` — written for the logic's glass) read the opposite sign.
* **The finger (R7), measured through one frame's own camera**: away from the vertical, the angle between the finger's way and the gizmo's way —
  median 16.3°, 95th percentile 92.7° (`1.0.147-`: 12.1° / 61.1°; the deployed build: 14.3° / 81.2°); near the vertical 20.5° / 102.9°
  (11.6° / 52.2°); on the frames where the picture is turned 5° or more from the logic's pose (8 % of them) 41.7° / 156.8°. The finger steers
  somewhat worse, mostly where the picture is turned away from the logic's pose.
* **Minors**: close in, one stretch of three worse (`vyah_11s`: 48.4° a metre against 29.0°; with `uprightPicture` 0: 30.3°); the straight dy
  1 – 3° further off straight down on the glass; 45 frames turning the camera 45 – 90° at once (`1.0.147-`: 5); one mutant alive (the finger in a
  spit has no behavioural vector); a slider's label and two comments stale; F3 goes off with `uprightBandFree` 0.

**Fix round 2** (UD8 amended; the lead's):

* **UD8b — ONE conversion, at the entry.** The finger's step is turned from the picture onto the LOGIC's glass ONCE, in the pointer's step, BEFORE
  anything reads it (`dySignPushing`, `edgeHoldDy`, `edgeHoldFinger`, `zoneFinger`); after it the logic reads its own pose everywhere, as in
  `1.0.147-` (`zoneFinger` off `asmCamLast` again; `asmPicLast` for the recorder only). The logic then behaves exactly as `1.0.147-` does for a
  finger drawn on its own glass: every rule written for that glass — the holds first — is right again, from the root. No second reading of the
  picture anywhere.
* **UD11 — a hold belongs to a turn the player SEES.** The dy hold exists because the picture turns half round under the finger: the same push
  would then go back. Where the change of frame that set a hold is freed and the picture does not turn (fully upright at both its ends, nothing
  left to close), that hold is dropped: the same push goes on, and a come-back is honoured at once.
* **This round's gates**: the hold walks' verdicts as `1.0.147-`'s (the hold set where it sets it, the come-back honoured where it honours it),
  and no re-crossing by itself under a steady push; R7 by the auditor's own reader — the median away from the vertical not over `1.0.147-`'s + 2°
  on the ten stretches together; U-G1 to U-G4 as before; the cheap minors (the stale texts, a behavioural vector for the finger, F3 out of
  `uprightBandFree`); `vyah_11s` close in looked at, its root said.

## 9. Fix round 2 as built and measured (the builder, 2026-11-19, night; local commits, nothing pushed)

**The result first.** The dy hold reads the logic's own glass again (UD8b): over `Scene_0bis`'s top and bottom far out the hold is set where
`1.0.147-` sets it and nothing re-crosses under a steady push. A finding on the way: the finger turned off the picture was **mirrored** since FO3's S2
(the glass's right taken as `forward × up`, Babylon's is `up × forward`): every move was turned by −φ instead of φ; fixed. UD11 is built (51 of 104
holds on six of his stretches were set by a change freed fully upright). ⛔ **Two gates missed**: the finger's way (R7) 14.9° median against the
target 14.1° (16.3° before this round; `1.0.147-` 12.1°), and **one frame turns the camera 98°** on one stretch (before this round: none).

### 9.1 What was built

| commit | kind | what |
|---|---|---|
| `7fe646c` | C | **R1, UD8b** — `fingerOnLogic` (`roll_follow.ts`, pure) called once in the pointer's step (`fingerAtEntry`) BEFORE `dySignPushing`, `edgeHoldDy`, `edgeHoldFinger`, `zoneFinger`; `zoneFinger` reads `asmCamLast` in a spit and converts nothing outside one; `asmPicLast` deleted. ⭐ `fingerOnGhost`'s mirror fixed (found by the new spit vector: 1.83 px off on a 5 px move). 5 vectors (the same world move at 0, 90, 143, 180°; the dy sign the hold reads is the logic's; the hold and its band on the logic's glass; the finger in a spit = the move read on the picture's frame; the picture's right is `up × forward`); 5 mutants red |
| `efa08a5` | P | the hand replay records the hold (`h`, `ds`), the shadow the freed angle (`fe`) |
| `25477c7` | C | **R2, UD11** — `uprightHoldKept` (`upright.ts`) and law U's `closed`: the hold a change set is dropped where that change is freed with `w` 1 before and after and nothing left to close; 7 vectors, 5 mutants red |
| `7516ce3` | C | **R3** — the rest's slider label (*"upright: the rest to upright, its pace (deg a second; 0 = at once)"*), two `gestureConfig` comments, the test title (1 440); F3 out of `uprightBandFree` (with `uprightMaxDegS` 0 the carry is ignored, so `e653099`'s identity holds); 1 mutant red |

### 9.2 The gates (his ten stretches far out at 60 frames a second unless said; before = `0816078`'s code as the auditor measured it)

| gate | now | before this round | `1.0.147-` (`6f47219`) | verdict |
|---|---|---|---|---|
| (i) hold walks, set where 6f sets it | `z_far`, `z_close`, `b_close` 6/6, `zT_far` 2/2, `b_far` s0; `b_far` s1, s2: the level face's exit FREED, no hold, the back honoured at once | `b_far` none of 6 | as base | ✅ |
| (i) no re-crossing under a steady push | none anywhere | — | — | ✅ |
| (i) come-back honoured as in 6f | `z_close`, `b_close`, `zT`, `zC` as base; `z_far` s2 not (s3 – s5 yes) | `b_far` s2, s4 never | | ⛔ `z_far` s2 |
| (i) refused both ways | nowhere | | | ✅ |
| (ii) R7 away, median / p95 | **14.9 / 83.6** (target ≤ 14.1) | 16.3 / 92.7 | 12.1 / 61.1 | ⛔ +0.8° |
| (ii) R7 near the vertical | 19.7 / 103.4 | 20.5 / 102.9 | 11.6 / 52.2 | |
| (ii) R7 picture under 5° / 5° or more from the logic | 14.0 / 79.7 · 37.2 / 146.2 | 15.1 / 87.7 · 41.7 / 156.8 | | |
| (iii) gravity over 20° | 7.3 % | 7.1 % | 35.4 % | ✅ |
| (iii) gravity's roll a metre | 57.2° | 57.0° | 101.5° | ✅ |
| (iii) a frame turning the camera over 90° / 45° | **1** (98.3°, `ilmj_39s`) / 55 | 0 / 45 | 0 / 5 | ⛔ |
| (iii) frames held a metre (the auditor's measure) | 1.4 | 1.7 | 2.7 | ✅ |
| (iv) `uprightPicture` 0 = `7bcae02`; `freeTurnMaxDeg` 0 = `6f47219` | three replays 2 794 / 2 794 and `ilmj_23s` 886 / 886 identical, both | | | ✅ |
| (v) `Scene_1` over its top | 169 frames (168), turning 632°, no reversal, 0 errors | | | ✅ |
| (v) level entry | the a walks: 0 errors, drift 0; straight dy drift (mm) −177, 139, −271, 187, −444, 289 | −179, 135, −244, 192, −337, 280 | −96, 92, −167, 154, −251, 235 | ⛔ px 6 |
| (v) close in | `ilmj_23s` = 6f; `ilmj_99s` roll 32.0 (49.6); `vyah_11s` 48.4° a metre (29.0) | the same | | ⛔ `vyah_11s` (§9.3) |
| (v) 143 frames a second | 0 errors; largest camera turn 43° and 21°; over 20° 6.9 and 7.8 % | | | ✅ |

### 9.3 What the frames say (roots)

* **R7's loss is not the finger's reading.** Split by the frames since the last FREED change: from 21 frames on, the median is 11.9° (n 706, `1.0.147-`
  12.1°); 3 – 20 frames after one it was 51° before UD11 and is 21 – 33° now. The holds those changes set last 20 – 50 frames: the dy held, only the
  dx passes, the gizmo goes sideways. The ones left are freed IN the band (UD4b, `w` under 1 after the change), which UD11 as briefed keeps.
* **The 98° frame** (`ilmj_39s` f629): the frame AFTER a freed change, the logic's view jumping 13 → 33° from the vertical across the band; φ 57 → 9°
  in one frame — the carry `c` = 0.70 of a `Δα` that is not a roll: F3's shape, one frame later (F3 covers only the change's own frame).
* **`z_far` s2**: the back (12.2 mm) fell inside the timed turn; law U has the picture upright by frame 86 while the logic is still turning (6f: frame
  98), so on the logic's glass most of the back is a dx — the hold's band counted 5.1 mm, not 12.2, and kept the come blocked.
* **`vyah_11s` close in (R4)**: all the excess roll is ONE timed turn (f672 – 690: 160°, law U inactive there, `w` 0) that rolls gravity the long way
  (−80 → ±180 → −1°) where `1.0.147-`'s goes −80 → −1°. The trajectory parted from f0 (the rest made upright far out, UD5, 1.4°) and the gizmo was
  7.6 cm elsewhere by f670. Not law U's code: no fix.
* Like for like: the walker steers by the glass; a pure glass dy on an upright picture 7° from the logic leaks ~0.25 px a frame of dx — a held push
  slides slowly along the axis (`z_far`: 100 – 215 mm over 100 frames; 6f still). On `zT_far` the dx round the tip, a small logic dy, sets the hold
  again (6f: the hold ends there); the dy still moves both ways (blocked 0 – 2 frames).

### 9.4 Amendments the frames ask for (none built) — ⭐ for his review

1. **UD11 to every change freed where the picture keeps its roll** (UD4b's in the band too): the frames 3 – 20 after such a change are what keeps R7
   over target. The question for the owner: after a freed change in the band the picture rights itself in up to 1/8 s — a turn he sees, or not?
2. **F3 extended to the frame after a freed change** when the logic's view crosses the band (the 98° frame) — or the carry `c` taken as `min(w)`
   over the change and the next frame.
3. **The hold's band during a timed turn read on the turn's end frame** (`z_far` s2) — a rule about the hold, so the owner's.

### 9.5 What he will feel

Far out the scene stays upright as before. Over the top and the bottom face the dy hold behaves as in `1.0.147-`: the push that crossed never brings
the gizmo back; after a crossing he does not see turn (a freed change, fully upright), no hold: the finger goes on, and back at once. The finger
steers a little better than last night (the mirror) but still worse than `1.0.147-` for a third of a second after a fast pass over a ridge. One flick
of 98° on one of his ten stretches. Close in as before. **Slider label changed**: ☰ › ORBIT › UPRIGHT PICTURE, *the rest to upright, its pace*.
**Not run**: the corner loops, the stretches at 0.736, `Scene_0` up, the edge and ridge walks; `z_far` s2 not re-run under amendment 3.

## 10. Fix round 3 as briefed — the carry is the logic's twist undone (the lead, 2026-11-19, 04:00; ⭐ for his review)

**What round 2 gave** (§9, its builder's figures): the dy hold is `1.0.147-`'s again on the hold walks — the blocker is fixed; ⭐ found on the way:
`fingerOnGhost` was MIRRORED since FO3's S2 (the glass's right taken as forward × up; the engine's is up × forward), so every move was turned the
wrong way round — the deployed build's S2 had it; fixed, with a vector that sees it. The finger's angle (R7) 16.3° → 14.9° (`1.0.147-`: 12.1°).
⛔ Left: ONE frame turning the camera by 98° (`ilmj_39s` frame 629: the law's angle 57° → 9° in one frame, the carry at 0.70, while the view
crosses the band) and 55 frames of 45 – 90° (`1.0.147-`: 5); the come-back on one hold walk (`z_far` s2); the straight dy at 360 px a second.

**One more round than UD10's two** — the lead's choice: what is left is ONE rule of the law (how the carry is read), not a new design, and the
night leaves the time for it and for an independent re-test. If that re-test finds a blocker, UD10's fallback stands (`uprightPicture` 0).

* **UD6c — the carry is the logic's twist, undone; never `Δα`.** Each frame `φ ← φ − c·τ`: `τ` the twist of the logic's pose about the framed
  line over that frame (`twistAbout` — well defined everywhere), `c = min(w, w before)`, `c = 1` on a freed frame and on a timed turn's first
  frame (round 1's F2 and F3 become this one rule); then the rest to `w·α` closes at `uprightMaxDegS`, as before. So beyond the share of the
  logic's own twist that the picture keeps near the vertical, the picture never rolls faster than the cap — the upright's OWN swing (fast when
  the view passes close to the vertical) now goes through the cap too. Why: `α` has no meaning at the vertical, so `Δα` read across a frame where
  the view crosses the band is not a roll — that is the 98° frame and most of the 45 – 90° ones. At rest, and on a path where the upright's own
  turn stays under the cap (1 440° a second: 24° a frame at 60), the picture is still exactly upright.
* **UD11b — a freed change never holds.** A change that is freed turns the picture by less than 90° (it is under `freeTurnMaxDeg`) or not at
  all (`w = 1`): the push that crossed never goes back. Its hold is dropped inside the band too (round 2 measured: what is left of R7 over
  `1.0.147-`'s sits in the third of a second after such a change).
* **Not built** (an event's patch, for his review): the hold's band read at a timed turn's END — `z_far` s2, where a come-back of 12.2 mm fell
  inside the turn and counted as 5.1 mm.
* **This round's gates**: no frame turning the camera by more than 90° on his ten stretches, nor at 143 frames a second; the 45 – 90° frames
  reported (the aim: under half of 55); gravity over 20° and its roll a metre not over round 2's 7.3 % and 57.2° by more than 2 points and 5°;
  the hold walks as round 2's; R7 not over 14.9°; the identities (`uprightPicture` 0, `freeTurnMaxDeg` 0, and `uprightMaxDegS` 0 with
  `uprightBandFree` 0 = `e653099`); `npm run verify`.
