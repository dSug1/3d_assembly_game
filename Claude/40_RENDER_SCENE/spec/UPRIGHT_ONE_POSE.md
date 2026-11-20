# One pose — the upright picture rebuilt from the root (branch `1.0.148d-`)

> **What this is**: packet D's study (P1, 2026-11-19, evening): the owner's four parts as one study, an offline check, and the build as commits.
> ⛔ Nothing is built. Before it: [`UPRIGHT_PICTURE.md`](UPRIGHT_PICTURE.md) — law U, live since 2026-11-19 (main `675ec23`), its rebuild (§12 –
> §14) and its defaults (`c3a8ba6`: 720° a second, the band 15 – 50°). The failed rule V1 and its fix round are on `1.0.148c-Upright_near_the_vertical`
> (that file's §15 – §17); the study of the up at the source (design V4) on `1.0.149-Upright_at_the_source` (`UPRIGHT_AT_THE_SOURCE.md`). Both are
> read only. "Measured" = computed on recordings; "read" = read in the code at `c3a8ba6`; "opinion" says so.

## 0. The owner's words (verbatim)

On the live build (main `675ec23` = `1.0.148b-` at `d6f200e`), 2026-11-19: *"I am very satisfied with the live build, except when the dy reach a
pole (in a face or at and edge or at a spit) in polar orbit because there is a small jitter at that moment, and when the dx or dy enters or exits a
level face or a zenith/nadir edge in polar orbit (for example in scene 0bis) because there is a very rapid 180 roll of the camera followed by an
additional circle of the camera in the level plane which is annoying. I believe this can be overcome."*

His slider trials: 720 / 15 / 50 (`uprightMaxDegS`, `uprightFromDeg`, `uprightFullDeg`): *"much better for scene 1 arrival at pole jitter
resolution and it calms the 180 degree realignment. However it does not solve the circle issue."* — `freeEntryUpright` 0: *"No difference"* —
`tiltRollDegS` 90: *"yes, this slows the circle."*

Tonight: *"start again the rebuild. use the branch 1.0.148b- as clean start and take the lessons learned from branch 1.0.148c- to do a new rebuild
in branch 1.0.148d- by addressing the logic failure root causes. Do prototyping of your rebuild to check if all you have listed (circle, quick 180
degree roll, jitter, dy hold, etc.) is fixed."* — *"also use the information from branch 1.0.149-"*.

His rules that bind every design ([`UPRIGHT_PICTURE.md`](UPRIGHT_PICTURE.md) §0): gravity along the glass's vertical (the IDEAL; at least as
`1.0.147-`); a yaw or a pitch of the view is fine, a ROLL of the scene about the view is what he refuses; no stop of the gizmo under 90° (FO3). His
pace: 571 px a second on average, 1 213 at the top tenth.

## 1. The result first

**The design — ONE POSE.** The picture IS the logic's pose: one pose, drawn and read by everything (the finger, the holds, the free face's layout,
the silent entry). ONE owner turns its up: a pure function, `upOne`. The logic only says what the up should be (its heading rules: the turntable at
a pole, the spit's side, a level face's layout) and WHEN its frame changes. Far out the logic makes no timed camera turn any more: a change of frame
is applied at once and its roll carried whole, so none of the logic's own turns ever shows. A pass over the world's vertical then needs exactly
one half turn (unavoidable: L5) — it opens at ONE moment, the logic's own crossing, in one sense kept to its end, at one pace (720° a second); the
gizmo's hold and the push's hold come from that same decision. Near the vertical a dead band (the owner's own T11 rule) keeps the logic's small
wobble off the picture: the jitter.

**Offline** (his ten stretches on `1.0.147-`'s route, only the up replaced; §6): the circle (B2, turns of 90° or more in the level plane that the
finger did not ask) **2** (the live defaults: 74 on their route; `1.0.147-` on this route: 81); every one of the 90 half turns opens AT a logic change
(not one paced by the view), 13° from the vertical (median); the jitter at a pole **5 of 44** arrivals (`1.0.147-`: 18 of 45; the defaults 16 of
26); gravity tilted over 20° **16.9 %** of the frames (`1.0.147-` 35.4 %, the defaults 21.7 %); 0 frames turning the camera over 90°, 3 of 45 – 90°;
no there-and-back. ⚠ The half turn itself stays: once a pass, mostly a spin of the floor seen from above, a quarter of a second at 720° a second.

**What only the game can tell**: the route once the finger reads one glass and the gizmo waits 0.13 s instead of 0.48 s; the finger's way (R7); the
dy hold's place; close in; 143 frames a second; the dead band's backlash on a finger's yaw at a pole.

## 2. The lessons — each checked

| | the lesson (the lead's, `BRIEF_D.md` §3) | checked |
|---|---|---|
| L1 | two owners of the roll | **Read**: `uprightPaced` (`src/input/upright.ts` l. 221) carries the logic's twist with `c = min(w, w before)` — 0 within `uprightFromDeg` of the vertical, so there the logic's timed turn (`zoneMixPose`, the turn about the piece) is drawn whole: the circle. Its target `w·α` (l. 224) then pulls the picture back to the logic's pose at 720° a second as the view leaves: the quick 180°. Two writers turn the picture by themselves. |
| L2 | the half turn had no single moment | **Read** in 148c's §16.4 and §17 (V1 paced by the view; the fix's moment the view leaving 15°). **Measured** for V4's blend (§6): at 1 800° a second, band 5 – 25°, 3 of 78 half turns open where no logic change is; at 720 / 15 – 50°, 0 of 90 on this route. The only place on his hand where the logic's pose stands more than 135° from upright off the vertical: the far half of a level face (110 of 1 547 free-face frames). |
| L3 | the holds read the picture | **Read**: `holdSeen` (`upright.ts` l. 204) sets the push's hold from the share SEEN (`w`); RB3's hold takes the finger's last dy sign (`roll_shadow.ts` l. 196), not the crossing's. |
| L4 | two glasses | **Read**: `fingerAtEntry` (`assembly_wiring.ts` l. 2412) turns the finger from the picture's glass to the logic's; `zoneFinger` (l. 2427) and the free face's layout at its entry (l. 2285) read `asmCamLast` = the logic's pose (written by `zoneMixPose`, l. 1588), a glass he does not see. |
| L5 | one half turn per pass is the price | **Measured** by 149 (all 97 timed half turns of `1.0.147-` are passes over the vertical) and here: 90 half turns on the same route, 1 per pass but for 9 passes (§6). |

## 3. The rules — which stay, which move (⭐ every move for his review, §10)

| rule | stays / moves | how |
|---|---|---|
| IDEAL — gravity on the glass's vertical | stays, closer | upright from `uprightFullDeg` off the vertical far out, a level face too; within `uprightFromDeg` gravity has no direction: the logic's heading |
| "no roll of the scene" | ⭐ bent once a pass | the pass's one half turn (L5) is a roll about the view, 13° from the vertical on median: mostly a spin of the floor seen from above |
| FO3 — no stop of the gizmo under 90° | stays | the gizmo waits only while 90° or more of a half turn is left |
| T1, T2, T3, T8, T10, T12 | stay | close in untouched (the square camera's own turns, the tilt, the way out) |
| T4 — the edge is the only trigger | stays | the half turn opens only at the logic's crossing (the spit's side, a level face's exit, the pole's edge) |
| T5 — one turn, it completes, the gizmo held | ⭐ moves | one turn that completes, in time (never by the view); the gizmo held while 90° or more is left (0.13 s at 720° a second; `1.0.147-`: the whole 0.48 s) — or never (a variant) |
| T6 — upright where it means something | stays, stronger | upright beyond the band far out |
| T7 — no surprise at an entry, paid at the exit | stays | a level face's half turn stays at its exit |
| T9 — the push that crossed held after a half turn | stays | set by the same decision that opens the half turn |
| T11 — a band on every trigger, no noise into the camera | stays, extended | a dead band on the picture near the vertical |
| R6 / S1 — a change of 90° or more is a timed turn | ⭐ moves | far out no timed turn at all; the half turn is the up's |
| UD12 — the logic upside down, the picture hides it | ⭐ reversed | one pose: nothing upside down is carried, shown or read |
| UD13 — the hold a direction on his glass | moot | one glass: the hold is the dy, as in `1.0.147-` |
| UD14 — the gizmo stops only for a turn he sees of 90°+ | stays | the half turn, while 90° or more is left |
| UD15 — one pace | stays | `uprightMaxDegS` (720) |
| UD16 / C4 / ES — a level face's layout, the silent entry | ⭐ bent far out | the layout within the band's inside (near the vertical) and close in; beyond, upright |
| UD17 / UD3 — close in the square camera owns the roll | stays | the up's authority is the square camera's complement |
| his 160 ms (`rollFollowMs`) | moot | no follower under one pose (as under law U) |

## 4. Obstacles and fallbacks, read in the code (149's part 2 checked at `c3a8ba6`)

**Who writes the up today, in one frame's order** (read): the pointer turns the finger from the picture's glass to the logic's (`pointer_wiring.ts`
l. 342 – 344: the hold on the raw finger, then `fingerAtEntry`), then `zoneFinger` reads the logic's glass (`asmCamLast`). The logic's step makes a
level face's entry or exit (`freeFaceFrame` l. 2305, `freeFaceExit` l. 2393) and the pole's edge (`poleCross` l. 2063): each calls `crossTurn` →
`turnBegin` (l. 391), which under law U only ASKS (`changeAsk` l. 410). The camera's stage (`green_box_wiring.ts` l. 1043 – 1075): `spitStep`
(l. 2458: the side's change = the crossing, again through `crossTurn`), then `assemblyCameraFrameRaw` (l. 1608: the heading — `cameraHeading`
for the world, `spitCameraHeading` or `freeShownHeading` in a spit, upright in F for an UPRIGHT zone and the tilt — through `offsetFrame` l. 233),
then `rollPictureFrame` → `uprightPictureFrame` (`roll_shadow.ts` l. 165): the ask resolved (`changeSeen`, `changeApply` l. 436: a timed turn
`asmZoneMix` or at once), `zoneMixPose` (l. 1567: the timed turn about the piece; it writes `asmCamLast`), law U (`uprightStep` → `uprightPaced`),
the picture `P = poseRolled(G, L, φ)`, RB3's hold; then `upSquareToView` and the camera.

**So the up has three writers that turn it** — the heading rules, the timed turn, law U's rest — and L1 is their overlap near the vertical.

**149's map holds, with four amendments**: (a) the spit's crossing is decided at the camera's stage, in the frame the camera passes over the axis
(`spitStep` from `green_box_wiring.ts` l. 1043), not in the logic's step; (b) `poseShown` (l. 1593) returns the logic's last pose under law U, not the
camera drawn; (c) two readers of `asmCamLast` read the logic's glass, not the picture's: the finger in a spit (l. 2427) and the level face's layout
chosen at its entry (`freeEntryHeading`, l. 2285); (d) RB3's push hold takes `asmDySign` (the last dy), not the crossing's sign.

**The obstacles to one pose, and their fallbacks:**

| # | obstacle (read or measured) | answer |
|---|---|---|
| O1 | the owner's camera offsets (2.5°, 2°) turn with the heading (`offsetFrame`): a heading turned 180° moves the eye a few degrees | the roll is about the framed line through the piece and the look point (`poseRolled`, as law U): both keep their places on the glass (R3) |
| O2 | the turn's angle is known only at the camera's stage (the new pose is built there) | RB1's ask-and-resolve kept; only its weight changes (§5.2 OP2) |
| O3 | a change applied at once moves the piece's shown direction | its ease on a clock of its own (`OWN_EASE`, built for RB1) |
| O4 | a level face's layout far out: 88 % of `Scene_0bis`'s free-face frames far out tilted over 20° in `1.0.147-` (seeded replay, measured), mostly SIDEWAYS (171 of 230 frames 45 – 135° from upright) | upright beyond the band (OP3); the layout kept near the vertical |
| O5 | the logic's heading wobbles at a pole (the jitter's candidate `gyaw`: the logic itself turning over 20° in a frame, at 13 of the 17 arrivals that jitter, measured) | a dead band on the picture near the vertical (OP6). ⚠ Not chosen: changing the spit's heading rule itself (the logic's) |
| O6 | the logic's pose more than 90° from upright in the band: a weighted blend would pace a half turn by the view (L2) | the correction fades out from 90° to 150° (OP3): never a half-turn blend |
| O7 | a rest of 90° or more where no logic change is (L2's shape) | measured 0 of 90 at 720° a second; if it happens: the same half turn, the gizmo held, no push held (no crossing) |
| O8 | close in the square camera turns the picture itself (T1) | the up's authority `κ` = the square camera's complement: close in `P = G` exactly, the live build's path |

## 5. The design — ONE POSE

### 5.1 In plain words

The logic computes, each frame, the pose it wants (`G`): where the camera is, where it looks, and an up from its heading rules. Far out it never
animates a change of frame itself any more — it jumps to the new frame and says so. One function, `upOne`, owns how the picture's up moves: it keeps
the up the player sees (it undoes the logic's own twist every frame), steers it toward its target (the logic's up near the vertical, upright away
from it) at most 720° a second, and when the logic says "my frame changed" and the target is 90° or more away, it makes THE half turn: decided
there, in one sense, at that pace, the gizmo waiting while most of it is left, the push that crossed held after it. Everything reads that one pose.

### 5.2 The rules (pure, `src/input/upright.ts`; angles in rad in code, ° in sliders)

* **OP1 — one pose.** `P = poseRolled(G, L, φ)` (`L` the framed line) is drawn AND read: `asmCamLast` is `P`'s (the finger in a spit, the level face's
  layout at its entry), the silent entry continues `P`'s up (`asmSpitPic`), the finger is never converted (`fingerAtEntry` the identity), the dy hold
  is `[0, sign]` (today's, bit for bit). `poseShown` stays the logic's last pose (a timed turn close in starts there; `P = G` there).
* **OP2 — the change decided by WHO OWNS THE ROLL, not by the view.** `κ = 1 −` the square camera's share (`uprightCloseIn` 0, as today). `changeSeen`
  with `seen = (1 − min(κ before, κ after)) × the turn`: far out (`κ` 1) every change is applied at once — no timed camera turn; close in (`κ` 0) a
  timed turn exactly where the live build makes one. The kinds that stay (the square camera's, a tilt's, `byMm`, the way out `out`) stay. ⛔ Law U
  weighed by `w(ν)`, so near the vertical every change was timed and shown: the circle.
* **OP3 — the target.** `ν` the view's angle from the vertical; `w = smoothstep((ν − from)/(full − from)) · κ` (`uprightFromDeg`, `uprightFullDeg`);
  `α = uprightAngle(G, L)` (the root nearest 0; none: last frame's target); `h = 1 − smoothstep((|α| − 90°)/60°)`; the target `φ* = w · h · α`. Inside
  the band the logic's own heading (the turntable at a pole, the spit's side, a level face's layout), beyond it upright, and a logic pose more than 150°
  from upright is never blended toward upright: its half turn waits for the logic's change.
* **OP4 — the carry whole.** `φc = wrap(φ before − c · τ)`, `τ` the logic's twist about `L` over the frame (`twistAbout`), `c = min(κ, κ before)` — 1 far
  out at every view. ⛔ Law U's `c = min(w, w before)`: 0 near the vertical, the logic's turns drawn there (L1).
* **OP5 — the rest, and THE HALF TURN.** `e = wrap(φ* − φc)`. A half turn under way keeps its sense `s`: if `sign(e) ≠ s` and `|e| > 90°`, `e += 2π·s`. None
  under way and `|e| ≥ 90°`: a half turn OPENS — `s = sign(e)`, `halfStart = |e|`, and the caller knows whether a change was applied at once this frame
  (the moment). It closes in time at `uprightMaxDegS`, whatever the view does (the gizmo held cannot stall it: no deadlock).
* **OP6 — the dead band (T11).** Far out only (`κ` 1), no half turn under way and `ν < uprightFromDeg`: `|e| ≤ uprightDeadDeg` moves nothing; beyond,
  the excess only. Close in (`κ` under 1) no band: there `φ` closes to 0 as in the live build.
* **OP7 — the step.** `step = sign(e) · min(|e| − band, maxDegS · dt)`; `φ = wrap(φc + step)`; the half turn ends when `|e − step|` is 0; `holding` =
  a half turn under way with `|e − step| ≥ 90°` (`uprightHalfHold` 0: never).
* **OP8 — the holds, from the same answer.** At the camera's stage, the frame a change is applied at once: `halfStart > 0` → the gizmo held while
  `holding` (T5's one reader, `tiltClampStep`, through `lawHalfTurn`), and the push held: `holdAtCrossing(the crossing's sign)` — the logic's sign
  (`crossingHold`, `exitHoldSign`, `crossingEvent`), on the one glass; `halfStart` 0 → no hold, and a hold still on is ended (every crossing ends the
  last edge's hold, `DY_HOLD_REVERSAL.md` §5.3). A half turn with no change this frame (O7): the gizmo held, no push held. A timed change (close in):
  `holdSeen` as today (with `P = G`, today's hold bit for bit).

### 5.3 One owner per thing

| the thing | its one owner | read by |
|---|---|---|
| the logic's state, its frame, which push crossed | the logic's step (`seamRebase`, `spitStep`, `freeFaceFrame`, `poleCross`; `crossingHold` / `exitHoldSign` / `crossingEvent`) | — |
| what the up should be | the logic's heading rules (`cameraHeading`, `spitCameraHeading`, `freeShownHeading`, F's upright) inside the band; gravity beyond (OP3) | `upOne` only |
| whether a change is a timed turn | `changeSeen` with the square camera's authority `κ` (OP2) | `changeApply` |
| the picture's up (every frame, far out) | `upOne` (OP3 – OP7) | the camera, `asmCamLast`, the silent entry |
| the half turn: its moment, sense, pace | `upOne`'s `halfStart` on the frame of the logic's change | T5's reader, OP8 |
| the gizmo's wait | `tiltClampStep` (one reader: timed turns close in, `holding` far out) | the orbit |
| the push's hold | OP8, written once, at the change | `edgeHoldGlass` (`[0, sign]`) |
| close in, the tilt | the square camera, the tilt, as today (`κ` 0: `P = G`) | — |

### 5.4 ONE moment for the half turn, never paced by the view

1. The carry is whole far out (OP4): no turn of the logic rolls the picture; so the picture's up moves only by `upOne`'s step.
2. The target is continuous between the logic's changes: the logic's heading is continuous for a given side, face or frame; the band weight is
   continuous; and the one place where a weight could blend two targets half a turn apart — the logic's pose more than 90° from upright in the band
   (a level face's far half) — is faded out (OP3's `h`), so the view never sweeps a half turn.
3. So a rest of 90° or more can open only where the target jumps: at a logic change (measured: 90 of 90 at 720° a second; 92 of 94 at 360).
4. It then closes in TIME at one pace, its sense fixed at its start; a held gizmo stops the view, not the turn. ⛔ V1: paced by the view, it never
   closed with the gizmo held; the fix round: its moment the view leaving 15°, after the crossing (the hold 97 – 103 mm past the edge).
5. V4's own blend (149: `logicUp` turned by `w·α`) differs exactly at step 2: unfaded, a level face's far half in the band was blended by the view.

### 5.5 The cases

* **A zenith or nadir edge far out** (`Scene_0bis`'s spit): the side flips 2° past the axis (`spitSide`), the logic's heading jumps about 180°, the
  change is applied at once, the half turn opens THERE (13° from the vertical on median), 0.25 s at 720° a second; the gizmo waits 0.13 s; the push
  that crossed is held from that frame — where `1.0.147-` set it (the same crossing, the same frame). No circle: the logic's timed turn is gone.
* **A level face** (the silent entry, E1 – E7): the entry continues the picture drawn (no turn, T7); near the vertical the layout (inside the band);
  sideways layouts righted beyond the band; on the far half, a layout more than 150° from upright is shown as it is until the exit; the exit
  (`freeFaceExit`) is the logic's change: one half turn there if 90° or more is left, else none. ⚠ That half turn sits 20 – 45° from the vertical: a
  roll, not a spin (the alternative — the half turn where the camera passes the axis on the face — measured worse, §6).
* **An arrival on a pole without a crossing** (`Scene_1`'s top): no change, no half turn; the logic's heading wobbling within 10° moves nothing (OP6).
* **Under the bottom far out** (`b_far`, his Q4): the bottom face's exit. Beyond 50° from the vertical the picture is already upright: the change turns
  nothing he sees, no half turn, no hold (Q4 kept); nearer, the hold follows the half turn. The game says which.
* **Close in**: `κ` 0 — the live build's path, frame for frame (the square camera, the tilt, the way out).
* **A zone with a tilted axis, the tilted pole**: the logic's heading inside the band, as today (Q5 kept).

### 5.6 Prior art — patent-free, no widget

The world-up look-at camera (gluLookAt, early 1990s) beyond the band; the turntable heading at a pole (Blender's turntable, three.js
`OrbitControls`) inside it; the rotation-minimising carry (parallel transport, Bishop 1975); two charts and ONE seam crossed once (the hairy-ball
theorem's textbook remedy: no continuous up over every view exists, so the seam is placed — here at the logic's crossing); a slew-rate limit (control
engineering) for the pace; a dead band (backlash, hysteresis; the input layer's own §1.1). Nothing here is known to be patented; no orientation widget.

## 6. The offline check (measured; the kit's `fo3/rebuild_d/od.mjs`, `rd_od.sh`)

**How**: `1.0.147-`'s recordings of his ten stretches (`Scene_0bis`, far out, 60 frames a second: 9 284 frames, 158 m of gizmo travel, 253 logic
changes) carry the logic's TARGET pose (`sh.gh3`: every change at once). The script keeps its eye and look, replaces the up by the design's, writes a
recording, and the kit's own readers measure it (`bursts.mjs`, `vb.mjs`, `au_read.mjs`, `t_read.mjs`, 149's `sa.mjs`). Checked first: the script
gives 149's V4 figures exactly (6.4 % / 45.3° a metre / 10 frames), and the readers give `1.0.147-`'s published ones.

| on `1.0.147-`'s route | half turns · at a logic change | bursts entry / exit / else · passes 2+ | circle B2 | jitter A | tilt > 20° · its roll a metre | camera 45 – 90° / > 90° |
|---|---|---|---|---|---|---|
| `1.0.147-` drawn | (97 timed) | 2 / 115 / 3 · 14 | 81 | 18 of 45 | 35.4 % · 101.5° | 5 / 0 |
| the logic's target, unpaced | 89 · 88 | 7 / 114 / 2 · 9 | 1 | 25 of 44 | 5.4 % · 22.7° | 34 / 90 |
| V4 (149), 1 800° a second, band 5 – 25° | 78 · 75 | — | — | — | 6.4 % · 45.3° | 10 frames over 45° |
| A: the target the logic's up only, 720 | 91 · 91 | 3 / 116 / 2 · 9 | 3 | 17 of 44 | 18.0 % · 80.8° | 3 / 0 |
| B: V4's blend, 720, 15 – 50° | 90 · 90 | 3 / 116 / 2 · 10 | 4 | 17 of 44 | 17.7 % · 76.7° | 3 / 0 |
| ⭐ ONE POSE: faded, 720, 10 – 30°, dead band 10° | 90 · 90 | 3 / 115 / 2 · 9 | 2 | **5 of 44** | **16.9 % · 73.8°** | 3 / 0 |
| the same, dead band 0 | 90 · 90 | — | 3 | 19 of 44 | 16.9 % · 73.7° | 3 / 0 |
| the same, 360° a second | 94 · 92 | 4 / 111 / 2 · 9 | 3 | 5 of 44 | 32.2 % · 90.1° | 3 / 0 |
| the same, 1 440° a second (A) | 89 · 89 | 6 / 114 / 2 · 11 | 1 | 17 of 44 | 10.5 % · 63.4° | 4 / 0 |
| a level face's half turn at the axis (hysteresis 10°) | 96 · 96 | 3 / 120 / 2 · 11 | 11 | 6 of 44 | 17.1 % · 77.8° | 3 / 0 |

* The defaults `74a247e` on their own route (148c §16.3): bursts 7 / 161 / 2 · 11, B2 74, A 16 of 26, 21.7 % · 88.8°, 27 / 1, there-and-back 6.
  ONE POSE: no there-and-back on any variant (149's rule).
* **The gizmo's wait** (90° or more of a half turn left): 2.8 frames a metre at 720° a second (`1.0.147-`'s timed turns: 2.7), 6.1 at 360.
* **The band**: 15 – 50° and 10 – 30° differ by about a point of tilt; the narrower one rights a level face sooner. **The dead band** makes the jitter's
  gain (19 → 12 → 5 of 44 at 0°, 4°, 10°). **The pace** trades tilt for calm: 360° a second doubles the tilt and the wait.
* **The 9 passes with two bursts** are in the logic's own target too; the one read (`ilmj_60s` f84, f111): two real crossings 0.45 s apart — over
  the top, then under the bottom — each its own half turn, both counted on the first pass by the reader's 48-frame tail. The other 8 not read.
* **Seeded replays** (`1.0.147-`'s routes): heptagon / `Scene_0bis` / cube 0.4 / 9.0 / 1.5 % over 20° (`1.0.147-` 0.4 / 16.3 / 1.1). `Scene_0bis`
  split: far 1.4 % (7.5 %), a level face far out 23.0 % (88.3 %), close in 10.9 % (unchanged by design: the square camera's).
* ⛔ **What offline cannot tell**: the route (the finger read on one glass; the gizmo waiting 0.13 s instead of 0.48 s); R7; the holds' places;
  close in; 143 frames a second; the level entry's walks; `Scene_1` over its top; the identities. The script turns the up about the VIEW, not the
  framed line (the eye's small circle about `L` is not modelled). The dead band's backlash on a finger's yaw at a pole is not measurable here.

## 7. The build as commits (P2, on the lead's word)

| # | kind | what | its proof |
|---|---|---|---|
| 1 | (C) | `upOne` in `src/input/upright.ts` (OP3 – OP7) and `changeSeen` read with `κ` (OP2), pure; vectors in `tests/upright.test.ts`: (a) a rigid twist of `G` undone whole far out; (b) a 180° jump of the target opens ONE half turn, its sense kept across ±180°, closed at the pace, `holding` while 90° or more is left, `halfStart` once; (c) a pose 150°+ from upright is not blended; (d) a ±8° wobble within `fromDeg` moves nothing, beyond `fromDeg` no band; (e) `κ` 0: `φ` exactly 0; (f) `maxDegS` 0: at once; (g) a rest of 90°+ with no change: a half turn | each vector red on a mutant: `c = min(w, w before)`; the sense re-read each frame; `h` ≡ 1; no band; `κ` ignored; the half turn ended at 90° |
| 2 | (C) | the wiring behind ONE switch `uprightOnePose` (1; 0 = `c3a8ba6`): `uprightPictureFrame` → `onePoseFrame` (`roll_shadow.ts`); OP8 at the change; `asmCamLast` and `asmSpitPic` from `P`; `fingerAtEntry` the identity; the record (`sh.pi3`, `sh.uf`, the half turn's state); gestureConfig and the menu (ORBIT › UPRIGHT PICTURE: `uprightOnePose`, `uprightDeadDeg` 10, `uprightHalfHold` 1); source tests: one writer of the up far out, no `seamTurnStart` far out under the switch, every reader of `asmCamLast` named | the identities (gate G9); mutants red |
| 3 | (P) | the recorder's new fields in the probes' readers; the batch on the model of `fo3/vertical/fix/drv_f.sh` (phases `hand hold reps over le close fps143`, then the identities) at each variant: 720 / 360° a second; the gizmo held / never; the band 15 – 50 / 10 – 30; the dead band 10 / 0 | one figure table against `74a247e`, `6f47219`, V1 (`runsB2`), the fix (`runsF`) |
| 4 | (D) | the built section at the END of this file; `TUNING_MENU.md`; `RND5.md`; `scripts/probes/ORBIT_GATES.md` | doc tests |

## 8. The gates (BRIEF_D §5, like for like; two readings stated)

G1 – G10 as briefed. ⚠ **Two readings to state before measuring**: (1) B2 (`vb.mjs`) counts the turn about the vertical on frames of a logic timed
turn (`mix`) or of a level face carried near the vertical — under one pose there is no `mix` far out, so the pass's one half turn, which IS a turn
about the vertical near it, is not counted; it is counted by G2 (bursts), as the one allowed. (2) G2's "no second burst": a pass with a second
CROSSING within the reader's 48-frame tail has two legitimate half turns (§6); the gate is read per crossing, each case listed. Offline expectations
(§6): G1 2 · G2 3 / 115 / 2, 9 to read · G3 5 of 44 · G5 16.9 % · G6 3 / 0; G4, G7, G8, G9, G10 game only.

## 9. Risks

* The route changes once the finger reads one glass (R7 expected as where picture and logic agree today, about 12 – 13° median: an estimate).
* The dead band's backlash: a finger's yaw at a pole reversed needs up to 20° before the picture follows (the world's turntable) — to judge by hand.
* A level face's far half far out stays upside down until its exit when its layout stands 150° or more from upright (110 of 1 547 free-face frames
  on his hand), then the half turn there is a roll 20 – 45° from the vertical. The fade (90 – 150°) can let the picture right itself partly and fall
  back as the camera descends — not seen offline (no there-and-back), to watch.
* `changeSeen` with `κ`: close in (`κ` 0) as the live build; between close in and far out (the square camera's share between 0 and 1) a change is
  applied at once more often than in the live build (`κ` ≥ its `w`) — the level entry's walks and the close-in stretches will say.
* The logic's own view jumping at a change applied at once (149: 35 – 62° in a frame on `gh3`) — its ease on its own clock must hold (3 frames over
  45° offline).
* `Scene_2` is never run or judged.

## 10. Decisions for his review — each with its switch or slider

| # | the decision | his rule it moves | switch / slider |
|---|---|---|---|
| OD1 | ONE pose: the picture is the logic's pose, read by everything; the logic's own up only a target | UD12 reversed | `uprightOnePose` (0 = `c3a8ba6`) |
| OD2 | far out no timed camera turn: a change is applied at once; who owns the roll (`κ`) decides, never the view | R6, S1 | `uprightOnePose` |
| OD3 | the pass's ONE half turn opens at the logic's crossing, sense kept, at 720° a second | "no roll" (once a pass), T5 | `uprightMaxDegS` (variant 360) |
| OD4 | the gizmo waits only while 90° or more of the half turn is left | T5 | `uprightHalfHold` (0: never) |
| OD5 | the push that crossed is held only when the half turn opens; a change he does not see holds nothing (`b_far`, Q4) | T9 | — |
| OD6 | a dead band of 10° on the picture near the vertical (the jitter) | T11 extended | `uprightDeadDeg` (0: none) |
| OD7 | a level face far out: its layout near the vertical, upright beyond the band; its half turn still at its exit | C4, ES, T7 kept | `uprightFromDeg` / `uprightFullDeg` (variant 10 / 30) |
| OD8 | a logic pose 150° or more from upright is never blended toward upright: its half turn waits for the logic's change | IDEAL (there) | — |

## 11. As built and measured (P2, 2026-11-19, evening; the lead's amendments A1 – A8; local commits, nothing pushed) — ⭐ for his review

**The result first.** One pose works as designed where it was aimed: the circle is gone as a second turn (`vb.mjs`'s B2: 1 event against 74 for the
defaults), each pass's half turn opens at the logic's own crossing, the dy hold is set on the same frame as in `1.0.147-`, and no frame turns the
camera over 90°. ⛔ But four gates fail: the finger's way right after a half turn (R7 18.8° against 14.3°), the jitter at a pole (17 of 35 arrivals,
not better), a fast yaw at a pole capped by the pace (the picture 70 – 80° behind, 0.1 s late on a reversal), and close in is micrometres apart
from the live build, not bit for bit. `uprightOnePose` 0 gives the defaults' game frame for frame.

### 11.1 What was built (commits on `1.0.148d-`)

| commit | kind | what |
|---|---|---|
| `fe3e42f` | (C) | `upOne` (OP3 – OP7) with A1 (at a logic change the half turn is re-decided, the shortest way); 11 vectors, 10 of 10 mutants red |
| `7f68eac` | (C) | `onePoseFrame` behind `uprightOnePose` (1; 0 = `c3a8ba6`): the change decided by the square camera's complement; OP8's holds; `asmCamLast` and the silent entry's picture from the pose drawn; T5's one reader; sliders `uprightOnePose`, `uprightDeadDeg` 10, `uprightHalfHold` 1 (128); source tests, 6 of 6 mutants red |
| `21c72c4` | (P) | the shadow record carries one pose (`oh`, `ohd`, `oc`, `ok`); `hand_replay.mjs` fails fast when the page is replaced mid-run (A6) |
| `bc6af1b` | (C) | three source pins follow T5's one reader; `npm run verify` 171 files, 2 189 vectors |

### 11.2 The gates (his ten stretches, `Scene_0bis`, far out, 60 frames a second; the same readers on every build)

| gate | ONE POSE (720°/s, held, 15 – 50°, band 10°) | defaults `74a247e` | `6f47219` | V1 | the fix | 360°/s | dead band 0 | band 10 – 30° | never held |
|---|---|---|---|---|---|---|---|---|---|
| G1 the circle: `vb` B2 · `au_read` B2 | **1** · 26 | 74 · 24 | 81 · 10 | 3 · 1 | 3 · 14 | 4 · 13 | 1 · 22 | 1 · 18 | 3 · 27 |
| G2 bursts entry / exit / else · passes 2+ | 6 / 176 / 0 · 18 | 7 / 161 / 2 · 11 | 2 / 115 / 3 · 14 | 6 / 164 / 3 · 14 | 6 / 169 / 3 · 9 | 7 / 145 / 4 · 8 | 3 / 180 / 1 · 20 | 8 / 170 / 2 · 15 | 2 / 169 / 0 · 10 |
| G2 per crossing: 0 / 1 / 2+ bursts | 49 / 106 / 6 | — | — | — | — | 81 / 94 / 2 | 47 / 106 / 5 | 53 / 104 / 10 | 66 / 105 / 5 |
| G3 the jitter at a pole | 17 of 35 | 16 of 26 | 18 of 45 | 9 of 24 | 14 of 23 | 20 of 30 | 16 of 29 | 18 of 31 | 16 of 29 |
| G5 gravity over 20° · its roll a metre | 22.4 % · 83.3° | 21.7 % · 88.8° | 35.4 % · 101.5° | 29.4 % · 107.6° | 21.9 % · 89.4° | 43.8 % · 101.2° | 22.5 % · 83.8° | 21.7 % · 83.7° | 23.3 % · 84.2° |
| G6 frames over 90° / 45 – 90° | **0 / 13** | 1 / 27 | 0 / 5 | 0 / 7 | 0 / 6 | 0 / 10 | 0 / 10 | 0 / 11 | 0 / 13 |
| G7 R7 median / p90 | 18.8° / 90.4° | 14.3° / 65.9° | 12.1° / 61.1° | 15.7° / 71.3° | 16.0° / 72.7° | 15.5° / 76.5° | 18.6° / 90.2° | 16.7° / 88.1° | 21.0° / 111.4° |

**A4 — his two places apart** (the default): at a zenith / nadir edge (the spit's side flip) 90 half turns, 15.6° from the vertical (median; p90
32.5°), 144°, 200 ms, the gizmo waiting 83 ms; at a level face's exit 62, 12.5° (p90 23.8°), 165°, 233 ms, 100 ms. ⚠ 3 more open at a level face's
ENTRY with the view about 85° from the vertical, and 6 with no logic change (42°): G2 wants none there.

**G4 — the dy hold** (the hold walks, frame by frame): `z_far` sets its hold on the SAME frame as `6f47219` (f69, the crossing), blocks the push 112 /
112 frames (100 / 104), the come never crosses again, every come-back in 1 frame. `b_far` holds 112 / 112 (`6f47219` 98 / 103): the bottom face's exit
far out opens a half turn he sees (Q4 as decided). The gizmo's travel after the crossing rose (79 / 135 mm against 11): read frame by frame, the push
stays blocked; the gizmo is free again after the first 90° of the half turn (0.13 s) and the `back` leg's finger carries it back 11 mm a frame —
`1.0.147-` held it the whole 0.48 s. **A5** — re-crossings under one steady push on the hold walks: 0 (all builds 0). On his hand the count read off the
camera's eye is not valid for one pose: 23 of its 61 fall inside a half turn's first frames (the turn rolls the eye about the framed line, across
the axis plane); the logic's own side is not recorded in the hand runs.

**The rest**: the seeded replays 0.6 / 3.4 / 1.7 % over 20° (heptagon / `Scene_0bis` / cube; defaults 0.2 / 4.5 / 1.1 %), jitter 4 of 36; the level
entry's walks B2 4 (defaults 16), bursts at an entry 0; 143 frames a second 0 frames over 45°; `Scene_1` over its top 2 reversals (defaults 1),
worst 22.8° (22.4°); ⛔ close in identical to the live build for 150 frames, then apart from frame 179, at most 7.2·10⁻⁶ (OP2 decides the approach's
blend by `κ`, law U by `w`). **G9**: `uprightOnePose` 0 = `74a247e`, `uprightPicture` 0 and `freeTurnMaxDeg` 0 = their recordings — three seeded
replays and `ilmj_23s`, every one identical, largest difference 0. **G10**: the source tests, 16 mutants red, 2 189 vectors.

### 11.3 What the frames say (the roots; measured unless said)

1. **R7**: outside the 20 frames after a half turn opens, 14.4° / 61.0° (the defaults' 14.3°); inside, with the dy hold on, 60.6° (561 frames) —
   his finger pushes the held way while the gizmo, free again after 0.1 s, can only move sideways. Without the hold, 17.7°.
2. **The jitter** (A2 (b), at dead band 0, 16 arrivals): 9 are the spit's side flip at the pole — the logic's heading jumps 150 – 180° in a frame,
   the half turn opens there and its target wobbles after it; 6 a level face; 1 the spit heading's own wobble. Read: near the top the spit's heading
   is `atan2(u_level + side · 0.3 · r)` — 2 – 5° from the vertical it swings up to ±17°. A fix at the SOURCE exists (the side's own heading within a
   few degrees of the vertical); not built.
3. **The dead band** changes nothing measurable in the game (17 of 35 against 16 of 29 without), and its BACKLASH (A2 (a)) could not be isolated:
   at `Scene_1`'s top a dx at his mean pace yaws the logic at 769° a second, the picture capped at 719° a second falls 70 – 80° behind and follows
   the reversal after 100 ms and 17.6 mm of finger — at band 10 and at 0 alike. ⭐ The root (opinion, read in `upOne`): OP4 carries ALL the logic's
   twist, its continuous, finger-driven yaw at a pole too, so the pace caps a yaw the finger asks for. The candidate: the carry whole only for a
   change applied at once; law U's weight for the logic's continuous motion. Not built (A8).
4. **The pace**: 360° a second doubles the tilt (43.8 %) and the wait (167 – 200 ms) for no gain elsewhere.
5. **A6**: the fix round's `f0` `ilmj_23s` run lasted about 50 s where the stretch takes 4.5 min: the page was replaced early, every step a no-op.
   No commit or mutant touched `src` that minute; the cause outside the probe is not identified. The probe now stops with that diagnosis.

### 11.4 What he will feel

Over a top or under the bottom, one quick half turn where the camera passes the edge — a fifth of a second, mostly a spin of the floor seen from
above — and no second turn after it. Pushing over a ridge, the push is held exactly where `1.0.147-` held it; but the gizmo waits only a tenth of
a second, so pulling back moves it back at once. Gravity is tilted as often as with the live defaults. The small jitter at a pole is still there.
At `Scene_1`'s top a fast sideways drag turns the view at most 720° a second, so the picture trails a fast finger. Close in nothing he can see.

### 11.5 Decisions for his review

* **OD9** — keep `uprightOnePose` 1 on this branch, or 0 (the live defaults, frame for frame) until the next round.
* **OD10** — the carry's rule: whole only at a logic change, the logic's continuous motion followed near the vertical (11.3, 3).
* **OD11** — the spit's heading at the pole fixed at its source (11.3, 2).
* **OD12** — the gizmo held for the whole half turn rather than its first 90° (the hold walks and R7 show the cost of releasing it early).
* OD1 – OD8 (§10) as built; the pace stays 720° a second (360 measured worse).

## 12. Fix round 1 (the lead's F1 – F5, 2026-11-19, night; `453b19e`; local, nothing pushed) — ⛔ the join still fails: for the lead's study

**The result first.** F1 does what it says: at `Scene_1`'s top a dx at his pace yaws the picture with the logic, 1:1 (769° a second, 0° behind; P2:
capped at 719°, 70 – 80° behind), a reversal followed on the logic's own frame; no half turn opens without a logic change (0; P2: 6); the gizmo waits
the whole half turn (F2); gravity is upright more often than with the live defaults (19.2 % over 20° against 21.7 %). ⛔ Still failing: frames turning
the camera over 45° rose to 49 (2 over 90°), the jitter at a pole (16 of 30), R7 (15.8°), close in bit for bit, and 2 half turns at a level face's entry.

**Built** (`453b19e`, (C)): the picture = its target + a GAP — the target (`w · h · α`) followed exactly, the gap opened only by a logic change (the
picture's last up carried to the new view, re-decided the shortest way, A1) and closed at 720° a second in one sense; a half turn = a gap of 90° or
more, the gizmo held for the whole of it; the dead band and its slider deleted (127); the spit's heading at the pole the side's own within 4° of the
vertical, blended into the formula by 12° (`spitCameraHeadingOne`, behind the switch). Vectors; mutants 7 of 7 and 2 of 2 red; 2 191 vectors.

| his ten stretches, far out, 60 fps | fix round 1 | P2 (§11) | defaults `74a247e` | `6f47219` |
|---|---|---|---|---|
| G1 the circle: `vb` B2 · `au_read` B2 | 2 · 28 | 1 · 26 | 74 · 24 | 81 · 10 |
| G2 bursts entry / exit / else · passes 2+ · per crossing 0 / 1 / 2+ | 5 / 170 / 1 · 13 · 45 / 103 / 6 | 6 / 176 / 0 · 18 · 49 / 106 / 6 | 7 / 161 / 2 · 11 | 2 / 115 / 3 · 14 |
| G3 the jitter at a pole | 16 of 30 | 17 of 35 | 16 of 26 | 18 of 45 |
| G5 gravity over 20° · its roll a metre | **19.2 % · 79.0°** | 22.4 % · 83.3° | 21.7 % · 88.8° | 35.4 % · 101.5° |
| G6 frames over 90° / 45 – 90° | ⛔ 2 / 47 | 0 / 13 | 1 / 27 | 0 / 5 |
| G7 R7 median / p90 | 15.8° / 81.5° | 18.8° / 90.4° | 14.3° / 65.9° | 12.1° / 61.1° |

* **His two places**: at an edge 88 half turns (15.4° from the vertical, 233 ms, the gizmo waiting 217 ms), at a level face's exit 64 (13.7°, 233 ms,
  233 ms); with no logic change 0; at a level face's ENTRY 2 (the view 85° from the vertical) — not fixed.
* **The dy hold**: `z_far` s0 now exactly `6f47219`'s (held 113 frames, the gizmo 11 mm after the crossing); every come-back in 1 frame but `z_far` s5
  (10 frames; `6f47219` 2); `b_far` held; 0 re-crossings under a steady push. **The rest**: seeded replays 0.4 / 3.1 / 1.1 %; the level entry's walks B2 4;
  143 frames a second 0 frames over 45°; `Scene_1` over its top 2 reversals (defaults 1); G9 every switch at 0 identical.

**What the frames say (F4, F5 and the gates still failing; measured unless said)**
1. **G6** — of the 49 frames over 45°: 28 the logic's OWN view jumping 35 – 52° in one frame at his fastest (the band weight jumping with it), 8 the
   logic's pose rolling 45°+ in a frame with no change event, 6 the fade, 6 changes. Followed exactly, the target's roll now adds to the view's own swing;
   P2 capped it. The root is the band weight read off a view that crosses the band in one frame (RB4 found the same) — not fixed.
2. **The jitter** — 10 of 16 arrivals are a logic change at the arrival (the side's flip at the pole): the half turn's roll, then the logic's own motion
   after it, read as a there-and-back; 6 a heading's wobble (spit 3, a level face's edge 3). F3 removed the spit's wobble only at the pole itself.
3. **F4, close in** — still apart from frame 179 (to 1.6 later). Read frame by frame: the LOGIC's pose differs first (1.1·10⁻⁷), on the first frame his
   finger's step passes the motion dead band, still far out with the picture 1.4° off the logic. One pose maps that step on the picture's glass, the
   live build turns it onto the logic's glass: the same world move only for a roll about the view, and the picture rolls about the framed line. Root:
   OP1 (one glass) — by design, not fixed.
4. **F5** — `au_read`'s B2 (28) counts any turn about the vertical within 45° of it outside a pass's main burst: under F1 that is the logic's own heading
   moving near the pole, shown 1:1 — not a lag (the top walk is 1:1). `Scene_1`'s 2 reversals are unchanged by F1: not the lag; not read further.
5. **R7** — 14.2° where the picture is within 5° of the logic (2 086 frames, the defaults' level); 39.0° on the 297 frames it is not (a gap closing).

**For the lead** (the owner's rule: the same join failing twice → stop and study): the half turn is now where and as decided; what fails lies in the
target's own inputs at his pace — the logic's view jumping 35 – 52° in a frame, the band weight read off it, the logic's pose rolling with no change
event — and in one glass against the framed line's roll (close in, R7).

## 13. Deployed for his look, the switch OFF (2026-11-20; the owner: *"do 1"* — then *"proceed with both 1 and 2"*)

`uprightOnePose` is **0 by default** (`ab2f841`): the site plays exactly as the live build with his defaults (`c3a8ba6` = `74a247e`, law U at
720° a second, the band 15 – 50°), proven frame for frame (§12, G9). **His A/B look**: ☰ › ORBIT › UPRIGHT PICTURE › `uprightOnePose` → 1 gives one
pose (§12 as measured: the circle gone, the dy hold as `1.0.147-`, one half turn a crossing at 720° a second with the gizmo waiting through it, a
yaw at a pole 1:1; still the jitter at a pole, and more camera jumps over 45° at his fastest swipes). Same scene, same session, switch flipped —
`Scene_0bis` far out over a top and across a level face is where the two differ most. Close in they look the same. Nothing else changed.
Next (his *"2"*): the study of §12's open roots, offline — the up's target by the faces and edges the orbit crosses rather than by the view's
angle, and the half turn at a pole made smooth rather than stop-and-go.

## 14. Packet S — the study of the open roots (2026-11-20; the owner: *"proceed with both 1 and 2"*) — offline, NOTHING BUILT, for his word

**The result first.** The band weight is not what turns the camera over 45° in a frame: of the 49 such frames, 11 are the orbit's own swing of the
view (out of scope: any up turns that much) and 38 are the LOGIC's own roll about the view — its heading rules near the vertical answering a view
that moves 10 – 46° a frame at his fastest; the up law's own share is 0 (it adds 12 – 16° in the same sense on about 25 of them). The jitter at a
pole is real and reproduced frame by frame: a small roll one way as the eye nears the axis, then the half turn the OTHER way (the shortest way), and
the gizmo stalling a quarter of a second under a moving finger. Choosing the half turn's sense with the roll just before halves it offline (13 → 7 of
27). The two "half turns at a level face's entry" are one half turn re-decided while the eye races on; what is wrong there is that the picture stays
upside down while the camera is already low on the far side. R7's rise is a gap closing under the finger (the glass rolling 12° a frame) and the
spit's swap rounding the picture's roll away. Close in, one pose is exact: the difference with the live build is inherited from the approach's
far-out frames.

### 14.1 How it was read (the kit's `fo3/rebuild_d/s/`; every figure in `CHECKPOINT_S.md`)
The recordings of fix round 1 (`runs_f1`, his ten stretches, far out, 60 frames a second) and the defaults (`74a247e`, `fo3/vertical/runs`), read
frame by frame: `q1.mjs` (who turns the camera), `groll.mjs` (the logic's own jumps), `look.mjs` (one window, the picture against the logic),
`q3.mjs` / `q3b.mjs` (R7 by class), `upside.mjs` (gravity upside down), `q5.mjs` (close in). `sim.mjs` re-applies fix round 1's up rule offline on
the recorded route (the logic's pose each frame, its changes, the square camera's share), rolled about the view — validated: the picture within
0.01° on median, 211 of 9 284 frames more than 5° off (a 6° offset in a half turn's start), every reader within its noise (over 45°: 49 = 49; the
jitter 13 of 27 against 16 of 30 recorded; tilt 18.9 % against 19.2 %). Offline cannot tell: R7, the route itself (the finger is read on the
picture), the gizmo's stall, the dy hold — the game only.

### 14.2 The roots (measured unless said)
1. **The frames over 45° (Q1).** By who turns (`q1.mjs`): the view's own swing of 45° or more 11 · the logic's own roll, no change 36 · at a change
   2 · the law's own 0. `big_read.mjs`'s "weight jump" (28) was a mislabel: it sorted by the weight's step before asking who rolled. Where the law
   adds, P is `(1 − w) G + w` upright, and near the vertical the upright up spins faster than the logic's heading (the hairy ball). The logic's own
   rolls come from two heading rules (read in the code): **the spit's heading** (`spitCameraHeading`, `polar_zone.ts` 213: the eye's level part plus
   the side × 0.3 — 5 – 35° from the vertical the eye's part along the axis swings it 30 – 60° a frame at his pace; F3 fixed only the last 4 – 12°),
   and **the level face's seam** in `offsetFrame` (`assembly_orbit.ts` 233: the up is `cos e·Y − sin e·heading` made square to the view; with the
   layout's heading opposite the eye's own, that vector lies ALONG the view at 45° of elevation, so the up flips through 180° there — 148°, 177°,
   174° in one frame at `ilmj_39s` f441, `vyah_42s` f13 and f392; the picture rolled 71°, 149°, 102°). Both are the up's rules, not the orbit's: the
   eye and the look are untouched. The eye's swing itself is the orbit's: out of scope. ⚠ It is faster than before: frames with the view swinging
   30 – 45° in one frame 80 (F1), 60 (defaults), 19 (`1.0.147-`) — opinion: the follower catching up after a hold, now that no timed turn holds it far
   out; the game only.
2. **The jitter (Q2), one case reproduced** (`ilmj_83s` f260 – f288, vb's 55°): the view arrives at the top coasting; the picture rolls +22° in four
   frames — the logic's own (the spit heading as the eye nears the axis, `w` 0, shown 1:1); the eye passes 6° beyond the axis, the side flips, the
   logic jumps −179°, the half turn opens the shortest way (A1) = −179°, −12° a frame for 15 frames, AGAINST the +22°; his next drag (5 – 36 px a
   frame from f278) moves nothing: the gizmo is held the whole turn (F2). He sees a there-and-back and a stall — not noise. `jit_read`: the
   picture's back equals the logic's own on 14 of 16 arrivals. The lever is the half turn's SENSE (offline both ways: against the roll before 24 of
   27, with it 7 of 27, the shortest way 13).
3. **R7 where the picture is off the logic (Q3)** (`q3.mjs`, `q3b.mjs`): of the 297 frames, 286 have the picture rolling 6° or more a frame (a gap
   closing at 720° a second); 124 lie under the dy hold (T9's price, §11.3). Without the hold (173): 172 lie within 6 frames after a logic change —
   small gaps (under 90°) closing during his fastest swipes (the camera turning 15 – 30° a frame on 104 of them). Read on the glass the finger was
   read on (last frame's picture), R7 falls from 36.8° to 24.7° (the picture rolls 12.9° a frame there): about 12° is the glass rolling between the
   read and the draw. The follower's lag is NOT it (corrected by the roll of the last k frames, it gets worse). In the spit looking down (the view
   under 30° from the vertical), `fingerSwapped` (`polar_zone.ts` 164) rounds the glass's angle to ±90° — exact on the logic's glass, but on a
   picture rolled off it the roll is thrown away: 61.4° on 23 frames (the defaults 33.1°).
4. **The two half turns at a level face's entry (Q4)** (`vyah_11s` f318 – f333, `vyah_42s` f2 – f11): the side flips at the top (176°, 178°), his
   flick carries the eye on — 4.5° → 19.5° → 47.7° → 82.5° from the vertical in three frames — the gizmo enters a level face, A1 re-decides the gap
   (150°, 153°: what was left) and the reader counts a new half turn. The picture rolls +10 – +15° every frame, one sense: ONE turn. What is wrong
   under it: the gizmo "held" (`tiltClampStep` refuses new orbit steps) still moves 100 – 250 mm a frame — the follower catching its target — so
   the half turn runs while the camera sweeps the far side: gravity upside down on 641 frames, 633 of them inside a half turn, 269 with the view 50°
   or more from the vertical (`upside.mjs`; the defaults 701, `1.0.147-` 1 233).
5. **Close in (Q5)** (`q5.mjs` against the live build's `runs3`): on every frame where the square camera owns the roll (`κ` 0) the picture IS the
   logic's pose (φ = 0 exactly, 2 843 frames). The logic first differs at f179 in all three stretches, BEFORE `κ` reaches 0 (`κ` 1.00 / 0.92 /
   0.61, the picture 1.38° off the logic the frame before): the approach's far-out frames read the finger on a glass 1.4° rolled. Inherited, by OP1.

### 14.3 The design proposed — one owner per thing (`uprightOnePose` 1; every new knob at 0 = fix round 1 frame for frame)

| the thing | its one owner | what changes |
|---|---|---|
| the half turn's moment | the logic's change (OP5, F1) | nothing: a half turn opens only at a logic change |
| the half turn's SENSE | `upOne`, decided once at the change | a gap within 30° of 180°: the sense the picture rolled over the last 100 ms (2° or more), else the shortest way; a re-decision keeps the sense under way — `uprightHalfSense` 1 |
| the half turn's PACE | `upOne` | a time floor `uprightMaxDegS` (720: never slower, no deadlock with the view held), raised so that the gap is closed by the time the view leaves the band (`uprightFullDeg`), at most `uprightLeaveDegS` (0 off; 1 080 proposed); optionally eased start and stop (`uprightEaseDegS2`, 0 off) |
| a logic jump with no change (the level face's seam) | `onePoseFrame`: a change handed to `upOne` when the logic's pose rolls `uprightJumpDeg` (90) or more in one frame | the gap absorbs it; its root fixed at the source later (S5) |
| the gizmo's wait | T5's one reader (`tiltClampStep` via `lawHalfTurn`) | his word: the whole half turn (F2) or while 90° or more is left (P2) |
| the finger in the spit looking down | `zoneFinger` / `fingerSwapped` | the rounding to F's axes only within ±10° of ±90° (`swapBandDeg`); beyond, `fingerInFrame`'s exact turn: the picture's roll kept (R7) |
| the heading rules near the vertical | `spitCameraHeading`, `freeShownHeading` with `offsetFrame` (the up's rules) | a study first (S5): the spit's side heading over the whole looking-down band; a level face's layout never shown with its heading behind the eye at mid elevation |
| close in | the square camera (`κ` 0: P = G) | nothing; the gate restated (14.6) |

Prior art, patent-free, no widget: a slew-rate limit with a time floor (control engineering), an acceleration-limited (trapezoidal) profile (motion
control), the sense of a 180° turn chosen by continuity (phase unwrapping), the hairy-ball seam placed once, a dead band on a rounding.

### 14.4 Offline figures (`sim.mjs` on `runs_f1`'s route; his ten stretches; the recorded F1 and the defaults beside, the same readers)

| | over 45° a frame | the picture's roll a frame: 30 / 45 / 90° or more | jitter A | gravity over 20° | upside down, view 50°+ |
|---|---|---|---|---|---|
| defaults `74a247e` (recorded) | 27 | 49 / 9 / 1 | 16 of 26 | 21.7 % | 280 |
| F1 (recorded · offline) | 49 · 49 | 85 / 25 / 2 · 85 / 26 / 2 | 16 of 30 · 13 of 27 | 19.2 % · 18.9 % | 269 · 254 |
| + the sense | 49 | 85 / 26 / 2 | **7 of 27** | 19.4 % | 280 |
| + the sense + the jump 90 | 46 | 83 / 23 / **0** | 7 of 27 | 19.4 % | 280 |
| the target = the logic's own up (no band weight) + the jump | 45 | 87 / 20 / 0 | 14 of 27 | 20.1 % | — |
| + the sense + the jump + eased (9 000°/s²) | **36** | 65 / 12 / 0 | 7 of 27 | 23.8 % | — |
| + the sense + the jump + the pace ceiling 1 080°/s | 53 | 91 / 26 / 0 | 7 of 27 | **14.9 %** | 140 |
| + the sense + the jump + the ceiling 1 440°/s | 60 | 113 / 30 / 0 | 7 of 27 | 12.3 % | 73 |
| + the sense + the jump + no ceiling | 218 | 292 / 190 / 81 | 7 of 27 | 6.1 % | — (rejected: a half turn in one frame) |

Readings: the sense is the jitter's lever and costs nothing measurable; the jump removes the frames rolling 90° or more; the band weight neither
causes nor cures the frames over 45° (Q1's target by crossings is equal within a point, so it is NOT proposed); easing trades gravity (+4.4
points) for fewer big frames; the pace ceiling trades big frames for gravity. 36 – 46 frames over 45° remain whatever the up: 10 are the eye's
swing, the rest the logic's heading rules — only their source (S5) or the orbit's pace can remove them.

### 14.5 The build as packets (each behind `uprightOnePose` 1, every knob 0 = `453b19e` frame for frame; nothing before his word)
* **S1 (C)** `upOne`: the sense (`uprightHalfSense`), the jump (`uprightJumpDeg`), the pace ceiling (`uprightLeaveDegS`), the ease
  (`uprightEaseDegS2`); vectors, each red on a mutant (the sense against the roll, the jump ignored, the ceiling unbounded, the floor lost: a held
  view must still close the turn). Sliders in ORBIT › UPRIGHT PICTURE.
* **S2 (C)** `zoneFinger`: the swap's band (`swapBandDeg` 10); vectors (a picture rolled 30°: the finger's way kept; 5°: the swap as today).
* **S3 (P)** the readers: `ht_read` counts a re-decision under way as the same turn; the frame roll (`q1.mjs`) and `upside.mjs` as gates; a replay
  that starts close in (14.6).
* **S4 (game)** ONE batch (hand, hold, le, over, close, fps143, the identities) at the default chosen, then `hand` with the ease on / off and the
  ceiling 1 080 / 1 440; one table against `74a247e`, `6f47219`, fix round 1.
* **S5 (study, then C)** the heading rules near the vertical at their source: the spit's side heading over the looking-down band (5 – 35°), the
  level face's seam (its layout never behind the eye at mid elevation). The game's prototype only: offline cannot recompute the logic's up (the
  spit's axis and side are not recorded).

### 14.6 The gates restated
* **G6** — the whole camera's turn mixes the orbit's swing (out of scope) with the up's roll: count **the picture's roll about the view in one
  frame** (30 / 45 / 90° or more: F1 85 / 25 / 2, the defaults 49 / 9 / 1, `1.0.147-` 5 / 1 / 0), split by who rolls; the whole turn a second line.
* **G8 close in** — (a) every frame with `κ` 0: the picture = the logic's pose (φ = 0) — met (2 843 frames); (b) the first frame where the logic
  differs from the live build has `κ` above 0 and φ not 0 the frame before — met (f179, three of three); (c) a replay STARTING close in (the
  approach latched before his first event) identical to the live build bit for bit — a (P) probe mode, the game; (d) the rule given the same state:
  `onePoseFrame` with `κ` 0 returns the live build's pose, holds and timed turn — a source vector.
* **New**: gravity upside down with the view 50° or more from the vertical (F1 269, the defaults 280); the jitter A at most 9 of ~27 (offline 7).

### 14.7 What it bends of his rules — the decisions for his word
* **D-S1 the half turn's sense** — with the roll just before, so a half turn may run up to 210° (bends A1's "never the long way" within 30° of
  180°); or the shortest way, as today. Offline: the jitter 13 → 7 of 27.
* **D-S2 the pace when his flick carries the camera on** — 720° a second as today (the picture upside down at a low view, 280 frames), or raised to
  close by the time the view leaves the band, capped at 1 080° a second (140 frames; gravity tilted 19.4 → 14.9 %; frames rolling 30° or more 83 →
  91) or 1 440 (73; 12.3 %; 113). It bends "never paced by the view" (L2): the moment stays the logic's and the time floor keeps it closing with the
  view held; but the turn gets quicker exactly where he complained of a quick 180°.
* **D-S3 eased start and stop** — smoother (frames over 45° 46 → 36) but a longer turn (about 0.33 s against 0.25 s), gravity +4.4 points.
* **D-S4 the gizmo's wait** — the whole half turn (F2: his drag after a pole answered 0.23 s late) or while 90° or more is left (P2: 0.13 s).
* **D-S5 the logic's own seam** — absorbed as a change now (bends OD10's "a half turn opens only at a logic change": the seam counts as one), its
  source fixed in S5.
* **D-S6 the finger's swap band** (R7 in the spit looking down) — a change of how the finger is read, not of the orbit's logic.
* **D-S7 the gates** — G6 on the picture's roll, G8 as 14.6.
* Not proposed: the up's target by crossings instead of the band weight (measured equal, 14.4); a pace with no ceiling (a half turn in one frame).

## 15. His first message (2026-11-20, verbatim) — ⚠ CORRECTED: he had NOT turned one pose on; it describes `uprightOnePose` 0 (law U, his defaults) — his verdict on one pose is §16

*"I don't like this implementation: when I leave the pole in scene 1 there is a back and forth of the camera, when I leave the zenith edge of
scene 0 there is also a back and forth of the camera, there is still a circle movement in addition to the camera roll on the bottom face of
scene 0bis. The dy hold seems to be solved. Start again (initial branch 1.0.148b-, new branch, lessons learned from all previous builds, deep root
cause analysis, new logic)"*

* Kept as the lesson that worked: **the dy hold from the logic's own crossing** (OP8: set on the frame of the crossing, with the logic's sign, on
  one glass — `z_far` and `b_far` as `1.0.147-`, zero re-crossings).
* ⛔ What the gates missed: none of the readers counted HIS three symptoms as he names them. `Scene_1` over its top read 2 reversals against 1 (§11,
  §12) — the back and forth leaving the pole — and was set aside. The jitter reader (A) looks at ARRIVALS, he names LEAVING. The circle on
  `Scene_0bis`'s bottom face was read as gone (B2 2) by a reader that does not count a roll and a yaw together.
* The live site (`1558b55`) keeps `uprightOnePose` 0: the build he had, with his defaults.

## 16. HIS VERDICT ON ONE POSE (2026-11-20, `uprightOnePose` 1 on the device, verbatim) — the analysis packet A follows (BRIEF_D §10)

*"amended:*
*- scene 0bis: the dy hold is solved, the entry and exit from slanted to level face is solved, upright the rest of the upright : set it by default
to 520 ms, however the entry and exit from the triangle to the level face triggers a jitter back and forth of the camera which prolungates deep
inside the level face (it looks like the camera does not know what to choose between the calm and the pitch), when I travel with dx around the
corned of the zenith edge there is a lot of camera movements (which are correct) because there is no hold when I cross the zenith edge and go back
to the triangle and back to the zenith edge from the other side etc. (check if a dx hold would do without adding too much complexity to the user's
inputs)*
*- scene 0: when I travel and exit along the zenith edge in polar orbit there is jitter of the camera, tilted-pole orbit is good.*
*- scene 1: lot of camera movements when I travel along the dy on the level face during polar orbit (it seems like the camera rotates in pitch and
roll to reach a full vertical square alignment on the pole: maybe we don't need the roll alignment and it can be deferred to when a dx is inputted
during this travel). Tilted-pole orbit is good.*
*Analyze and if patches won't fix this properly, start again (initial branch 1.0.148b-, new branch, lessons learned from all previous builds, deep
root cause analysis, new logic with no patch)"*

* Solved by one pose, his eye: the dy hold; a slanted face's entry and exit to a level face; the tilted-pole orbit (`Scene_0`, `Scene_1`).
* Done: `uprightMaxDegS` **520° a second** by default (`421c2ce`; the slider is in degrees a second, now in steps of 40). ⚠ It changes the switch at
  0 as well: an identity run against `74a247e` now needs `&uprightMaxDegS=720`.
* Open, his words: (1) `Scene_0bis` a tip's triangle ↔ the level face: a back and forth deep into the level face ("the calm or the pitch");
  (2) `Scene_0bis` dx round the zenith edge's corner: many correct camera moves for want of a hold — a dx hold, if simple; (3) `Scene_0` leaving
  along the zenith edge in polar orbit: a jitter; (4) `Scene_1` dy across the level face in polar orbit: pitch AND roll toward the square vertical
  alignment at the pole — the roll perhaps deferred to a dx.

## 17. Packet A — his four symptoms on one pose: reproduced, rooted, the verdict (2026-11-20; BRIEF_D §10; no `src` change) — ⭐ for his word

**The result first.** Three of his four symptoms have ONE root, and it is not one pose's alone: near the vertical the picture's up is the logic's
own heading (one pose's OP3 target is the logic's pose there; law U's carry is 0 there), and the logic computes that heading FROM THE EYE'S
DIRECTION (three rules: the spit's, the level face's, the world's). Since the fast orbit the eye crosses the pole region 4 times faster than in
`1.0.147-`, and those rules turn about 0.9° of roll per degree the eye swings there, so the camera rolls by itself: on his own play, outside the
crossing turns, 172° a second near the vertical (law U, the build he had: 161; `1.0.147-`: 25). The fourth (the dx round the zenith edge's
corner) is a different root: the hold after a crossing reads only the dy. **Verdict: (b) — a new logic on `1.0.148e-`**: the up near the vertical
must be a CARRIED state moved only by what the finger asks, never recomputed from the eye's direction. Patching the three heading rules one by one
(F3 did one) moves the spin, it does not remove it: no up computed from the view is continuous at the pole (the hairy ball).

### 17.1 The reader that counts what he names (`fo3/rebuild_d/a/his.mjs`; every figure in `CHECKPOINT_A.md`)
* **A back and forth**: one component of the camera's turn (pitch, yaw or roll in its own axes) 3° or more one way and 3° or more back within
  0.3 s, while the finger's way did not reverse.
* **A camera move not asked**: away from the vertical (20° or more) the picture rolling against gravity (an upright orbit's own roll is asked);
  near it, the roll about the view unless the finger's last step was a dx (a turntable yaw there is asked); the view's swing once the finger has
  been still 0.5 s (the follower's tail is the finger's). Split inside a crossing's turn / outside it, by place, by the view from the vertical.
* It sees the symptoms where the old gates did not: on his ten stretches (`Scene_0bis` far out) one pose shows more moves not asked than the
  defaults, and both up to 7 times `1.0.147-`'s near the vertical (17.2).

### 17.2 Reproduced (his ten stretches, 60 frames a second, far out; one pose = fix round 1's recordings, op0 = `74a247e`, the build he had)

| outside a crossing's turn, not asked (° a second) | one pose | op0 (law U) | `1.0.147-` |
|---|---|---|---|
| the view < 20° from the vertical · 20 – 50° · 50°+ | **172** · 104 · 19 | 161 · 83 · 13 | 25 · 17 · 9 |
| the LOGIC's own pose, the same split | 222 · 95 · 13 | 200 · 81 · 14 | 24 · 14 · 5 |
| by place: the level face · a tip · the zenith region · a side | 98 · 39 · 103 · 48 | 116 · 45 · 90 · 26 | 16 · 8 · 43 · 11 |
| inside the crossing turns (° in all) · back and forths pitch / yaw / roll | 21 748 · 153 / 44 / 102 | 20 548 · 124 / 52 / 81 | 20 184 · 115 / 54 / 81 |

* **(1) `Scene_0bis`, the tip's triangle ↔ the level face**: on the level face the camera moves by itself 98° a second (op0 116, `1.0.147-` 16).
* **(4) `Scene_1`, a dy across the top** (`a/s4.jsonl`: a short dx off square, then a dy up to the pole, three times): far out `Scene_1` is the
  world branch; during the climbs, 20 – 50° from the vertical, the picture rolls 45° not asked in 33 frames (82° a second; op0 48°): his "roll
  toward the square alignment", the same at op0.
* **(3) `Scene_0` along the zenith edge**: NOT reproduced by a walk — far out the view stops at the pole's limit (3.2°) where a dx is the turntable's
  yaw (asked): 0° not asked. His gesture is needed (the play recorder on `Scene_0`); its root is read below.
* **(2) the dx round the zenith edge's corner**: his stretches hold no such gesture. Of one pose's 154 half turns, 28 come back within 0.5 s: 16
  with his finger reversed (asked), 12 the same way — 5 under the dy hold, 7 with NO hold (of the 12, 5 at a tip).
* Two synthetic walk sets were rejected as not his gesture (closed-loop steering hunted; strokes along the gizmo's gradient mixed the axes).

### 17.3 The roots (read in the code; measured where said)
* **R-A1 — one root for (1), (3), (4): the up near the vertical is computed from the eye's direction.** One pose: `upOne` (`upright.ts` 291) —
  within `uprightFromDeg` the weight is 0, the target 0, so the picture IS the logic's pose plus a gap. Law U: `uprightPaced` (`upright.ts` 219),
  carry `min(w, w before)` = 0 there. The logic's heading, per zone:
  * the spit (`assemblyCameraFrameRaw`, `assembly_wiring.ts` 1616 → `spitCameraHeading`, `polar_zone.ts` 213): the eye's level part + the side × 0.3,
    faded in from 60° to 75° of pitch — 5 – 35° from the vertical it swings with the eye (packet S, §14.2);
  * a level face (`freeShownHeading`, `assembly_wiring.ts` 2366): a heading stepped by TIME (`headingStep`, `free_face.ts` 411, `tiltRollDegS`) toward
    a target that moves with the eye (`entryBlendHeading` 386 of the view's level part, the offset re-read every frame) and with the gizmo's depth:
    it keeps turning deep inside the face — his "the calm or the pitch";
  * the world (`cameraHeading`, `orbit_calm.ts` 211): the eye's own heading blended to the level reading (`calmLevelHeading` 168: the face's square
    layout) between 50° and 60° of pitch — a dy alone rolls the camera toward the square alignment (his (4)); the calm's direction (`calmDir`,
    `assembly_wiring.ts` 509) adds the pitch.
  Measured (`a/eye.mjs`, near the vertical, outside the turns): the eye swings 6.9° a frame (op0 7.7°; `1.0.147-` 1.7°), the logic rolls 6.0° (0.8°),
  0.87° per degree of swing (0.48). The eye's pace is the fast orbit's — out of scope; the rules that turn it into a roll are the up's.
* **R-A2 — (2): the hold after a crossing reads only the dy.** `spitStep` (`assembly_wiring.ts` 2466 – 2512): a side change whose path is not
  steep (`crossingPitch` < 60°, `polar_zone.ts` 274) or round a tip (`SPIT_OVER_AXIS_MIN`, 252) changes the side SILENTLY and ends any hold; a
  crossing holds `crossingHold(…, st.asmDySign)` — the dy's sign. A crossing made by a dx is not held: the glass turns half round under a finger that
  keeps its way, the gizmo goes back over (the comment there records this case, "a second half turn").
* **R-A3 (packet S, confirmed)**: the gizmo "held" by a half turn still moves 100 – 250 mm a frame (`tiltClampStep`, 1717, refuses only new steps);
  a half turn's sense the shortest way, against the roll before (the jitter at a pole).
* **The hypothesis TESTED: confirmed.** Near the vertical, the picture's unasked roll equals the logic's own (one pose 2 081° against 2 693°; op0
  1 858° / 2 310°); in `1.0.147-` the same rules moved 7 – 9 times less because the eye moved 4 times slower there.

### 17.4 The dx hold (his question)
* **What**: the hold of the push that crossed, on WHATEVER finger axis pushed — the finger's step at the crossing frame, its component across the
  edge on the glass held until the gizmo is `edgeHoldMm` beyond, the other component free, a reversal free at once. For his inputs it is the dy
  hold's rule unchanged, read on the push instead of on the dy: no new gesture.
* **Cost**: a dx along the zenith edge that wanders over it is blocked across it for ~30 mm (it slides along the edge); crossings round a tip
  must count as crossings for it (today silent) — one decision (D-A3).
* **Root or patch**: the ROOT's rule — the dy hold exists because the glass turns half round under a moving finger (T9); that cause does not care
  which axis the finger moves. As an extra hold beside the dy's it would be a patch; as THE hold (one owner, OP8, the push that crossed) it is not.

### 17.5 The new logic for `1.0.148e-` — in his four parts (designed, nothing built)
1. **The rules.** His: no roll he did not ask — near the vertical a roll only from his dx (a turntable yaw) or from the ONE half turn of a pass
   over the vertical; gravity on the glass's vertical away from it (at least as `1.0.147-`); a yaw or pitch is fine; the roll alignment to a
   level face's square layout deferred to a dx; the fast orbit's pace not reopened; the tilted-pole close in kept. Kept from one pose: the half turn
   at the logic's crossing (its moment), the push that crossed held from the same answer (OP8), 520° a second.
2. **Obstacles and fallbacks.** The three heading rules (17.3) also feed the finger's mapping (`zoneFinger` 2429 through `asmCamLast`;
   `fingerSwapped` 164 rounds to F's axes) — they must read the carried up, not their own. No up is continuous over every view: the seam is the
   half turn at the crossing, nowhere else. The follower moves under a hold (R-A3): the half turn must not depend on the gizmo standing still.
   The calm's pitch is the camera's direction, not its up: in scope only if he says so (D-A4). Fallback for each rule: today's, behind a switch.
3. **The design (prior art: Blender's turntable, a rotation-minimising frame (Bishop 1975), the trackball's carried orientation; patent-free, no
   widget).** ONE CARRIED UP: a state turned each frame by the orbit's OWN rotation this frame (its yaw about its pole axis, its pitch about the
   level axis square to it) — so a dy never rolls the picture, a dx at a pole turns it with the turntable, and far from the vertical an upright
   picture stays upright by construction (the world branch's turntable: heading = the orbit's yaw, no level-reading blend). Three changes only:
   (a) the asked rotation; (b) the half turn at the logic's crossing (sense by continuity, §14.3; pace 520); (c) an ALIGNMENT (to a level face's
   square layout, to the spit's side, to upright where the carry has drifted) paid only out of the asked yaw, at most `k` per radian (his
   deferral; the code has the mechanism: `heldOffsetStep`, `HELD_OFFSET_PER_YAW` 0.5) — never by time, never by the eye's direction.
   One owner per thing: the up — the carry; the moment of the half turn — the logic's crossing; the alignment — the asked yaw; the hold — the push
   that crossed (17.4); the finger — read on the one glass; close in — the square camera (unchanged).
4. **The audit plan.** Gates on `his.mjs` with `1.0.147-` as the bar: not asked outside the turns at most 25 / 17 / 9° a second (near / band /
   away), on his ten stretches and on a recorded `Scene_0` / `Scene_1` play of his; `Scene_1`'s dy across the top 0° not asked; same-way
   re-crossings 0; the hold walks as `1.0.147-`; gravity tilted no more than `1.0.147-`; close in bit for bit; vectors red on mutants (a dy that
   rolls, an alignment by time, a hold on the dy only).

### 17.6 Decisions for his word
* **D-A1** the verdict (b): start `1.0.148e-` (worktree `../upright_e`, `1.0.148b-` + his defaults, 520 carried) with ONE CARRIED UP; one pose stays
  on `1.0.148d-` as the record.
* **D-A2** the roll alignment to a level face's square layout: only with a dx, at `k` = 0.5 per radian of yaw — or never.
* **D-A3** the dx hold: THE hold of the push that crossed (any axis), crossings round a tip included — or the dy hold as today.
* **D-A4** the calm's pitch toward a face's square ("the pitch" of his (1) and (4)): kept as the camera's direction, or deferred like the roll.
* **D-A5** the gates: `his.mjs` with `1.0.147-` as the bar; a recording of his `Scene_0` zenith-edge gesture to reproduce (3).
