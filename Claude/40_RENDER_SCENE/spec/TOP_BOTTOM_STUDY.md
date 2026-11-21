# The top and bottom far out — THE STUDY after the last fix round (packet H4, 2026-11-21, branch `1.0.152-`)

> **Status: PROPOSED — nothing built; for the owner's word.** Written because H3 (`f5e35c3` live = `47e7267`) was the last fix round on this join and
> gates still fail ([`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §18; [`UPRIGHT_LESSONS.md`](UPRIGHT_LESSONS.md) row 2, §5 rule 2). His four
> parts: the rules → the obstacles, each reproduced → a design from prior art, one owner per thing → its audit, gates and decisions.
> ⛔ Offline only (the owner was testing on this PC): the code, the kit's recordings (`runs_h3`, `runs_h2`, `runs_g2`, `runs_h1`) and the pure
> functions run with `npx vite-node`. The scripts: the kit's `fo3/follow/h4/` (`oc_hold.ts`, `oc_up.ts`, `oc_who2.mjs`, `od_glide.ts`, `ob_sim.ts`,
> `proto.ts`). What needs the game is written in §5 as an OWED run.

## 0. The result first
* **Two of H3's failures are not where the fix round looked.** `b_far` s4's lost hold is NOT the rebase read by the spit (that hypothesis is refuted
  by the walk's own frames): the follower decides its dy hold on the LOGIC's camera up, which the logic writes every frame just before the follower
  reads it. On his ten stretches 64 of 157 half turns with a dy had their hold decided on an up that is not on his glass. A small fix of its owner.
* **The drawn gizmo's drift in the wait (24 mm) is the depth glide restarting every frame** — a 125 ms ease that is really a slow exponential
  (0.85 s at 60 frames a second, over 1.4 s at 143). Reproduced to the tenth of a millimetre offline. The gizmo's place itself is still.
* **G3 counted his own motion**: read as the exit's step OVER the 33 ms before it, `f5e35c3` passes all eleven walks (largest +4.6°) and `de4a10e`,
  whose exit really jumps (his attachment 4), fails five (+8.8° to +17.3°).
* **The two roots of §18.4 are reproduced offline on the pure rule** and answered by one design (§3): the heading and the elevation as two followers,
  the reading's jump read GEOMETRICALLY (the two faces' readings at the same angles, never a frame's difference), the follower's lag bounded by a
  LEASH of 62.4° (his clamp × the follower's 120 ms), a real turn taking the whole gap while the gizmo waits. Prototyped offline: no turn at a
  vertical edge at any pace (H3: from 600°/s at 60 frames a second), over the top at 1 620°/s the camera never above the asked 55° (H3: 86.5°, a
  70.9° frame after the stop), nothing after the stop faster than his 520°/s clamp, every turn frame within the clamp.

## 1. Part 1 — the rules this camera keeps (each with its source)
| # | the rule | source |
|---|---|---|
| K1 | No roll of the scene on the glass; gravity on the glass's vertical; a pole's half turn ONE smooth yaw | lessons §4 (11-18, 11-20) |
| K2 | The camera a simple polar orbit following the gizmo through a smooth, faithful function; it looks at the orbit's centre; the calm part of it | lessons §4; `CAMERA_FOLLOWS_GIZMO.md` §0, §12 |
| K3 | On the top the heading turns only by his dx, a level face and a zenith / nadir edge alike; a pure dy never yaws; the height capped at 60° | R1 = D-H1 (§14.4) |
| K4 | The edge is the only trigger: none / a quarter / a half turn by the edge left; a vertical edge between two sides is NONE | R2 = D-H2, T4, O2; his point 1 (§17) |
| K5 | The gizmo waits while that turn runs, then follows his input again — "waiting that the camera catches up" | R3 = D-H3 (his proposal), T5 |
| K6 | After a half turn pushed by his dy, that push held (released 8 mm back or with the gesture), by close in's functions | D-H4 / D-H8, T9, `DY_HOLD_REVERSAL.md` |
| K7 | The turn at his finger's pace, never under 360°/s, never over his clamp (520°/s, a slider) | D-H6, F-2, his point 2 (§17) |
| K8 | With the calm: leaving the top costs no turn; the red section may sit up to ~34° off the view | D-H7 |
| K9 | Every realignment paid by his finger's mm, never by time; a pace closes only a gap a change opens, never his own motion | lessons rows 6, 9, 10 |
| K10 | One owner per thing; no layer that undoes another; a hold really holds | lessons rows 1, 2, 6 |
| K11 | Every trigger has a band (no noise into the camera) — a band is an angle, never a speed in disguise | T11; the ms / degrees rule (`BRIEF_COMMON`) |
| K12 | The picture never listens to the logic's heading (or its up) | lessons rows 7, 11 |
| K13 | His symptoms are the gates, at his pace (desk 143 frames a second, 1 200 px/s top tenth; phone 571 px/s mean) | lessons row 8, §5 rule 3 |
| K14 | Kept from what passed: no yaw on a pure dy; the dy hold far out; close in identical; the clamp; no turn at a side edge at his paces | §16.3, §18.3 |
| K15 | Never reopen the gizmo's travel; everything the orbit decides in the MODEL's space; no 3D orientation widget; patent-free | lessons §3; the common brief |

## 2. Part 2 — the obstacles, each reproduced before it is named
**O-a — F-1's "jump" is a frame's difference, so it holds his own motion** (§18.4 root 1). *Recording* `sd84t1` (`Scene_1`'s sides, 1 200 px/s,
143 frames a second): the orbit 11.3° a frame; the reading −2.8 … −3.1° a frame mid-face, then −23.3° (f39) and −25.8° (f40, the facet change) —
F-1 read −25.8° as a jump and turned. *Offline* (`ob_sim.ts`, the pure `followTopStep` at H3's defaults, a reading with NO discontinuity at the edge):
one turn from 600°/s of orbit at 60 frames a second, from 1 620°/s at 143, none at 300°/s. A 10° band on a frame's difference is 600°/s at 60 and
1 430°/s at 143. *Fallback if not removed*: none needed — §3's geometric jump removes the motion term exactly.

**O-b — the follower's lag after a fast dx, paid the short way and over the cap** (§18.4 root 2). *Offline* (`ob_sim.ts`, `proto.ts` B): the
spring on the sphere at a reading moving 900 – 1 620°/s lags 72 – 139° at the stop; its path is a great circle, so the camera rises off the asked
elevation — 15° asked: 20 – 23°; 55° asked: 62 – 66° at 600 – 1 620°/s, 86.5° over the top at 1 620°/s with a 70.9° frame after the stop (the
recording `s1_over` f262 – f288: el 84°, the picture 25° in one frame). *In the code*: during a turn `followTopStep` keeps the heading on the turn
from the heading DRAWN and lays the spring's speed on the meridian, so the lag before the edge is FROZEN through the whole wait and paid by the
spring afterwards from no sideways speed — the surge of `sd84t1` f47 – f74 (23.7° a frame after the finger stopped) and, I read, why his ten's lag
doubled (p50 32.6° against `de4a10e`'s 14.2°; the waits are 45 % of his play) — ⚠ the split by wait / no wait is owed (§5). *Fallback*: the leash
(§3) bounds whatever is left at 62.4°, settled at most at his clamp.

**O-c — `b_far` s4: the hold never written; the builder's hypothesis REFUTED, the real root found.** *Recording* `h3hw_b_far` s4-cross: at f10 the
gizmo leaves the bottom (free → the lower −z side), the spit's side is read afresh to −1 by the free face's exit (`freeFaceFrame` sets it to 0, so
`spitStep` cannot clear anything that frame) and STAYS −1 to f61; the hold is null from f10 on. No side flip, so `spitStep`'s "round a tip" never
ran. `crossingEvent` recomputed on the recorded drawn up and facets (`oc_hold.ts`) gives −1 — the hold due — at f7 – f12 in both builds. *In the
code*: `green_box_wiring.ts` builds the logic's camera frame (`cameraFrameNow` → `assemblyCameraFrame`, which writes `st.asmCamLast` = the LOGIC's
dir and up) just before `followFrame`, which reads `st.asmCamLast.up` as "the glass's up drawn last". *On his ten* (`oc_up.ts`, 157 half turns with a
dy): the hold the follower wrote matches the logic's up 154 times, the drawn up 90; where the two disagree (64) it followed the logic every time —
21 holds lost, 43 holds set that his glass did not call for. `ba369aa` set the hold on `b_far` s4 by luck of order: there the logic's exit fell one
frame after the follower's facet change. Two owners of "the up shown". *Also read*: on his ten 41 of 136 holds end at the follower's own next facet
change (by design: a hold guards the LAST edge crossed); none within 3 frames (`ba369aa` 51 of 125: F-3 works); none by a spit flip. *Fallback*: none
— the fix is the owner's (§3, D-H16).

**O-d — the drawn gizmo drifting in the wait (G5): the writer is the depth glide.** `assemblyFrame` calls `gizmoGlide` every frame with the drawn
gizmo (`asmG`, the glide's remainder in it); the remainder is over 5 mm, so a NEW 125 ms glide starts every frame and the ease never runs its course:
it decays by 1 − smoothstep(dt / 125 ms) a frame — 0.952 at 60 frames a second. *Offline* (`od_glide.ts`, the pure `gizmoGlide`, `swingEase`):
2.12, 2.02, 1.92, 1.83, 1.74 … 0.78 mm a frame; *recorded* (`h3_ilmj_83s` f686 – f706): 2.1, 2.0, 1.9, 1.8, 1.7 … 0.8 mm — the finger still from
f693, the angles constant. 44 mm settle in 0.85 s at 60 frames a second and take over 1.4 s at 143: a time in frames. It is the depth step at the
crossing's place easing out, not the gizmo travelling (the map's angles and place are still). *Fallback*: report it apart from G5 (D-H18).

**O-e — G3 measures his own pace.** *Recordings* (`rd_exit.mjs`, the eleven S1 walks): the camera's turn in the 33 ms at the exit and in the 33 ms
before it — `f5e35c3` nP 9.8 / 9.3, nM 10.8 / 9.2, sP 15.2 / 15.8 (the exit adds −0.6 … +4.6° on all eleven); `ba369aa` nP +7.7, nM +8.7;
`de4a10e` nP +17.3, dP +12.8, ov +10.5, dM +10.4, nPM +8.8. **What he sees on `f5e35c3` at nM, sP**: the camera going on at the 3 – 3.7° a frame it
had before the edge — the tail of his own dx, no step. The 10°-in-33 ms gate is 300°/s: it fails any fast dx, edge or not. What he complained of
(attachment 4) is a STEP, and the excess finds it where it was (`de4a10e`).

**O-f — the calm's reading near a vertical edge outruns the orbit** (new; `sd84t1` f39 – f40: −23.3°, −25.8° a frame against 11.3° of yaw, −3°
mid-face). The calm's share rises by position toward the edge (D-H7, "with the calm"); a faithful follower shows that stretch. *Fallback*: the leash
lets the heading move no faster than his finger's pace (§3 H-2), so that stretch is smoothed, not passed through; to measure at 1 200 px/s (owed).

**O-g — the wait is 45 % of his play on `Scene_0bis`** (69.6 s of 155; 241 turns, 234 over 90°). It is R3 at every far edge at his clamp, not a
defect: shortened only by his slider (`followTurnMaxDegS`) or by D-H6 (c) (the wait at a level face's far edge only). Reported, no decision asked.

## 3. Part 3 — the design: ONE OWNER PER THING (behind three switches; all 0 = `f5e35c3` frame for frame)
| the thing | its one owner | reads | never |
|---|---|---|---|
| the continuous reading `c` | the reading's own motion: each frame `c += wrap(L − Δ − L_before)` | the levelled reading `L` (K8) and its jump `Δ` | a discontinuity |
| the jump `Δ` (H-3) | GEOMETRY: the reading of this frame's calm minus last frame's calm, both at THIS frame's angles (carried on a level face) | the two calms asked, the rig's angles | a frame's difference (O-a) |
| the heading outside a turn (H-2) | a 1-D critically damped follower on the UNWRAPPED `c` (τ `followMs` 120 ms), its speed always carried; a LEASH: never more than `followTurnMaxDegS` × `followMs` (62.4°) behind, and while taut never faster than his finger's pace | `c`, his finger's mm | the sphere's great circle; the reading's own stretch speed |
| the turn (H-4) | started only when `|Δ|` ≥ the band (10°); its angle the WHOLE gap, from the heading drawn to the reading beyond (`ba369aa`'s angle: the lag + `Δ`); its pace F-2's (his finger, 360 – 520°/s); the follower set at rest on `c` | `Δ`, the heading drawn, his finger | the lag left for later |
| the elevation (E-1) | a 1-D follower to the asked elevation capped at ±60°, its speed carried, the drawn height never past the cap | the asked direction | the heading |
| the gizmo's wait | the turn (`tiltClampStep` reads it), as now; F-3's `seamRebase` at its start (the place exact) | the turn | — |
| the dy hold far out (D-H16) | the follower's crossing (D-H8: `Δ` over 90°, `crossingEvent`) on the follower's OWN drawn up of last frame, kept in `asmFollow` | the drawn up, the two facets, his dy | `st.asmCamLast` (the logic's) |
| the up on the glass | the world's (`followPose`), unchanged | — | — |

* **Why the hand-overs are bumpless**: a turn starts from the heading drawn (continuous) and ends on the reading; the gizmo waits meanwhile, so the
  reading is STILL (the rig's angles held exactly, F-3) and the follower, set at rest on it, takes over with no lag and no speed to lose — the camera
  has caught up when the gizmo moves on, his own words (§14.4). Outside a turn nothing but the follower moves the heading.
* **Why two followers are safe here**: the sphere spring was chosen because two angles wrap and stall at the vertical (§5.3); under `followTop` the
  height is capped at 60°, so the vertical is never reached, and the heading is followed UNWRAPPED (no short way exists). The pass over the pole
  stays ONE yaw (K1): the elevation never passes the cap, the heading never inverts.
* **Every pace his**: the turn at his finger's pace (clamped by him); a taut leash moves the camera at his finger's pace; after he stops the
  follower settles from a lag of at most 62.4° at most at 520°/s (the leash is DERIVED so: lag = speed × τ for this spring) — below 520°/s of
  heading the camera is exactly `de4a10e`'s spring. No new tunable.
* **Prior art** (the methods are textbook and old; ⚠ not a legal opinion — the literature table of `CAMERA_FOLLOWS_GIZMO.md` §8 stands):
  the critically damped spring (Lowe, *Game Programming Gems 4*, 2004 — kept); the lazy follower with a maximum lag and per-axis damping of an orbit
  camera, heading apart from height (Haigh-Hutchinson, *Real-Time Cameras*, 2009; the same split in common engine orbit rigs); phase unwrapping with
  the known jumps removed (Itoh, *Applied Optics* 21, 1982); a reading compared across two charts AT THE SAME POINT, the transition map of an atlas
  (any differential-geometry text) — the geometric jump; bumpless transfer between two controllers (Åström & Hägglund, *PID Controllers*, 1995) — the
  hand-over at rest on a still target.
* **Rejected on the way** (measured in `proto.ts` or read): F-1's band on a frame's difference (O-a); the turn of `Δ` alone with the follower
  catching up during it — its turn frames reach 648 – 1 420°/s, the clamp broken (`proto.ts` E); a leash on the sphere spring (still over the
  cap); look-ahead (it leads his finger: moves not asked); a time constant that grows with his pace (time in disguise, row 9).
* **The prototype** (`proto.ts`, the pure rules only — no calm, no game; H3's `followTopStep` beside it on the same input):

| scenario (60 frames a second unless said) | H3 (`f5e35c3`'s rule) | the design |
|---|---|---|
| a vertical edge, no discontinuity, 300 / 900 / 1 620°/s | 0 / 1 / 1 turn; lag at the stop 33 / 74 / 72° | 0 / 0 / 0 turns; lag 33 / 62 / 62° |
| the same at 143 frames a second, 1 620°/s | 1 turn; the height 22.8° for 15° asked | 0 turns; 15.0° |
| over the top, 55° asked, 900 / 1 620°/s, then he stops | lag 81 / 139°; height up to 71.7 / 86.5°; 15.3 / 70.9° in a frame after the stop | lag 62°; 55.0°; 8.6° a frame (= 520°/s) |
| a far edge (the reading jumps 180°) under a dx of 300 / 900 / 1 620°/s | the gizmo held 30 / 19 / – frames (1 620 not run) | held 23 / 12 / 11 frames; every turn frame ≤ 520°/s (the short way: up to 118°) |

## 4. Part 4 — the audit
**Against [`UPRIGHT_LESSONS.md`](UPRIGHT_LESSONS.md) §2, row by row**: 1 one owner of the roll — the up stays the world's ✅. 2 no patch on a join
— this is the study; the leash is a bound inside the one follower, the turn hands over at rest, nothing undoes anything ✅. 3 a turn that needs a
hold has a decided moment — the facet change, its angle by geometry ✅; ⚠ "holds never depend on the picture" is read as: the MOMENT and the
existence never chosen by the view; the SIGN is his dy as pushed on HIS glass — so the up must be the drawn one (D-H16), the only up he sees far out.
4 the holds from the crossing (OP8) — the follower's crossing in the model's space, unchanged ✅. 5 one half turn a pass ✅ (the wait, K6).
6 a pace never caps his motion — the taut leash moves at his pace; a hold really holds — the place exact (F-3), the drawn glide apart (D-H18) ✅.
7 / 11 the logic's heading is no source — and now neither is its up (O-c) ✅. 8 the gates count what he names (below) ✅. 9 every realignment by his
finger — the turn ✅; ⚠ the follower's settle after a stop is time, as in `de4a10e` ("very good"), now bounded (≤ 62.4°, ≤ 520°/s). 10 each payer
reads the finger while it moves — F-2 kept, the leash's speed his finger's ✅.
**Against §16.9 / §17 / §18**: root (a)'s cure (a change measured on the TARGET, FO3 S1's principle) is now exact (geometric, O-a); (b) his finger
✅; (c) the rebase ✅; the event warning (`FAST_ORBIT.md` §11.2: the unit was the turn event) — here the unit is the heading, one follower and one
turn with a still target (§11.4's "a held turn's target is not still" — still by construction, the reading read from the calm ASKED at held angles).
His point 1: no turn at a vertical edge at ANY pace (H3: up to 400 px/s only). His point 2: the clamp on every turn frame AND on the settle.

**The gates, rewritten to count what he names** (pass marks against BOTH `de4a10e` and `f5e35c3`; ⭐ new or rewritten):
| gate | counted | `de4a10e` | `f5e35c3` | pass |
|---|---|---|---|---|
| G1 identity | the three switches 0 against `f5e35c3`: `ilmj_23s`, `vyah_11s`, `nP`, `s1_over` | — | — | every frame identical |
| ⭐ G-side | `Scene_1`'s sides far out at 100, 200, 400, 1 200 px/s (143) and 571 px/s (60, his phone's mean): turns, frames held; ≤ 400: the step against `de4a10e`'s; 1 200: frames turning against his dx, the largest step after he stops | 0 turns; at 1 200 its spring turns the wrong way | 0 turns ≤ 400 (0.24°); 3 turns and 23.7° after the stop at 1 200 | 0 turns and 0 held at every pace; ≤ 0.5° up to 400; at 1 200 no frame against his dx, none after the stop over 520°/s × dt |
| ⭐ G-pole | `s1_over` at 143: the camera's height, the picture's largest frame, piece jumps | 13.8°, 9.0 a minute | 84°, 25.1°, 78.9 | height ≤ 60°; ≤ 13.8°; ≤ 9.0 a minute |
| G-clamp | every heading step in a turn | — | 0 of 6 690 over | ≤ 520°/s × dt + 1 % |
| G2 | the yaw on a pure dy before the edge | `ov` 73.0° | 0.0 – 0.4°, `ov` 1.8° | ≤ 2° |
| ⭐ G3 | the exit's 33 ms minus the 33 ms before, eleven walks | 5 fail (+8.8 … +17.3°) | all pass (≤ +4.6°) | ≤ 5° on all eleven |
| ⭐ G5 | the map's angles and the place shown in every wait; the drawn ring's depth glide REPORTED | — | 0.00°; the ring 24.1 mm | 0.00° |
| ⭐ G6 | `z_far`, `b_far` set and never re-crossed; on his ten the hold written = the hold on the DRAWN up, every half turn with a dy | 4/6, 0/6 | 6/6, 5/6; 90 of 157 | 6/6, 6/6; 157 of 157 |
| G7 his ten (60) | frames over 45° / 20°; piece jumps, roll jumps a minute; back and forth; the lag p50 / p95 | 0 / 290; 26.8, 162.5; 176/67/47; 14.2 / 58.4° | 0 / 0; 15.9, 8.5; 48/28/57; 32.6 / 90.0° | 0 / ≤ 5; ≤ 15.9, ≤ 8.5; ≤ 48/28/57; ≤ 20 / ≤ 63°; the wait reported |
| G8 / G10 | `Scene_0bis`'s pole walks (piece jumps, roll jumps); his two at 143 (piece jumps) | 0, 29.0; 34.5 | 0, 17.2; 11.5 | 0, ≤ 17.2; ≤ 11.5 |
| G9 | close in | — | identical | identical |
| ⭐ G-geo | the jump at every vertical edge of `Scene_1` and `Scene_0bis` (a vector on the pure reading, a sweep along each edge); frames with `Δ` ≠ 0 and no facet change on his ten | — | — | < 1°; 0 frames |
| G11 | vectors red on mutants (each decision; the leash's derivation; the hold's up) | — | 27 of 27 | all red |

**The switches** (rule 4; ORBIT › CAMERA FOLLOWER › THE EDGE'S TURN): `followHeadElev` (H-2 + E-1 + the leash; 0 = the sphere spring),
`followTurnGeo` (H-3 + H-4; 0 = F-1), `followHoldDrawnUp` (D-H16; 0 = `asmCamLast`). All three 0 = `f5e35c3` frame for frame.
**The build as ONE packet**: (C) the pure rules in `input/camera_follow.ts` + vectors, each red on a mutant; (C) the wiring in
`render/camera_follow_wiring.ts` (the calm asked kept a frame, the drawn up kept in `asmFollow`) + source tests; ONE headless batch (only when the
owner allows one: not while he tests); (D) the as-built section. ONE packet because the three changes meet in one function and one wiring site, and
the switches already measure each alone. ⛔ Nothing in the gizmo's travel; the depth glide (D-H18) is NOT in it.

## 5. Owed to a run in the game (none run: the owner was testing on this PC)
1. **O-c in the game** (on `f5e35c3` itself): add to `scripts/probes/hold_walk_check.mjs`'s RECORD `fr: st.asmFollow ? st.asmFollow.rec : null,
   gh: st.asmRollShadow ? st.asmRollShadow.ghost.up : null` (a (P) commit), then from the worktree `bash scripts/probes/hold_walk_batch.sh h4hw base`.
   Expected at `b_far` s4's crossing: `top.s` 1, `|top.x|` ≈ 180°, `top.h` 0, the logic's up and the drawn up on the two sides of the edge.
2. **O-b's split**: the lag on his ten in the waits and outside them — offline on `runs_h3` once a reader names the wait frames (`top.k` ≥ 0).
3. **The packet's batch**: the kit's `follow/h3/drv_h3.sh` copied as `follow/h4/drv_h4.sh` with `Z="&followHeadElev=0&followTurnGeo=0&followHoldDrawnUp=0"`,
   the side walks at 0.7, 1.4, 2.8, 8.4 px a frame (143) plus `sd:9.5:0:f60` at 60, `s1_over`, the hold walks with (1)'s recorder; `bash drv_h4.sh`.

## 6. The decisions for his word
| # | the question | the recommendation |
|---|---|---|
| D-H13 | The heading and the elevation as two followers (the heading unwrapped), so the camera never rises past the 60° cap and never turns the short way after a fast dx | yes — O-b, his `s1_over` |
| D-H14 | The leash: never more than 62.4° behind (his clamp × the follower's 120 ms, derived, no new slider); above 520°/s of heading the camera turns with his finger, and after he stops it settles at most at 520°/s | yes — below 520°/s nothing changes from `de4a10e` |
| D-H15 | The turn started by the reading's GEOMETRIC jump (both faces read at the same angles), its angle the whole gap from the heading drawn (the short way when his lag is large, as `ba369aa`), the follower at rest on the reading when the gizmo moves on | yes — O-a, his point 1 at every pace |
| D-H16 | The follower's dy hold read on the picture HE sees (its own drawn up), never the logic's | yes — a defect: 64 of 157 half turns, `b_far` s4 |
| D-H17 | G3 as the exit's step over the 33 ms before; G5 on the gizmo's angles and place (the ring's depth glide reported apart) | yes — the gates counted his own motion |
| D-H18 | The gizmo's depth glide, restarted every frame (0.85 s at 60 frames a second, over 1.4 s at 143): (a) left as is — the feel he approved on 11-10; (b) written in ms as the decay it really is (τ ≈ 340 ms, his phone's feel at every frame rate); (c) the 125 ms as written | (b), as its own small packet behind a switch — and first his word on whether the glide counts as "what drives the gizmo" |
D-H12 (F-4: in the spit a dx along the axis does not yaw toward a tip) still waits for his eye; untouched here.
