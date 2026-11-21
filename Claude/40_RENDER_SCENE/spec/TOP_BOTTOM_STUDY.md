# The top and bottom far out — THE STUDY after the last fix round (packet H4, 2026-11-21, branch `1.0.152-`)

> **Status: PROPOSED — nothing built; for the owner's word.** (⭐ H5, 2026-11-21: his look on `f5e35c3` read — §7 – §9: A, B and point 2 one root, D-H19 the top rule only near the vertical; ✅ D-H20 DECIDED by him: `followMs` 200; point 5, the approach's handover, D-H22.) Written because H3 (`f5e35c3` live = `47e7267`) was the last fix round on this join and
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
| K3 | On the top the heading turns only by his dx, a level face and a zenith / nadir edge alike; a pure dy never yaws (⭐ H5: where the view nears the WORLD vertical — from 60° of the orbit's world elevation, §9; below 50° the calm as on `de4a10e`); the height capped at 60° | R1 = D-H1 (§14.4) |
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
| ⭐ K16 | `de4a10e`'s calm kept wherever it was (the shown direction's own heading), a spit's tips included: the camera turns toward a tip on its triangles | his look on `f5e35c3`, A, and `followTop` 0 (§7) |

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
| the continuous reading `c` | the reading's own motion: each frame `c += wrap(L − Δ − L_before)` | the levelled reading `L` (K8) and its jump `Δ`; ⭐ `L` = the calm asked's own WORLD heading below 50° of the orbit's world elevation, the level reading from 60°, a smoothstep between (D-H19, §9) | a discontinuity; F's level where the view is far from the vertical |
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
| ⭐ G-tip (H5) | his ten: on a spit's tip triangles the camera's turn toward the tip against the asked | 57 – 72° (asked 55 – 81°) | 3 – 13° | within 10° of the asked |
| ⭐ G-BT (H5) | off the level face onto the bottom triangle: turns within 1 s | one swing | 90 + 90 (40 pairs) | one turn ≤ 100° |
| ⭐ G-apex (H5) | turns at a crossing between two triangles; time turning on the triangles; the owed zigzags | 0; 0 % | 0.82 a second; 40 % (`ba369aa` 1.61, 29 %) | 0; ≤ 5 % |
| G-level (H5, reported) | far out, his finger replayed: the view's step roughness (|step − last|) and lag, against close in's chain on the same target | — | p90 1.76 – 1.88°, lag p50 12 – 28° (at 120) | close in's (p90 0.81 – 0.97°) |

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
| ⭐ D-H19 (H5) | The top rule's reading only where the view nears the vertical (A, B, point 2 — one root, §8): `cameraHeading`'s band read in the WORLD — the calm asked's own heading (`de4a10e`'s) below 50° of the orbit's world elevation, H2's level reading from 60°, a smoothstep between; a level face carried at every elevation. One rule for every frame | yes — the calm back on the tips, no turn along the apex edges (6 as built), the bottom triangle stable; its costs in §9; behind a switch (0 = `f5e35c3`); gates G-tip, G-BT, G-apex, G2 on `ov` / `nP` ≤ 2°, `Scene_1` within 0.1° of `f5e35c3` |
| ⭐ D-H20 (H5) | ✅ DECIDED by him (2026-11-21, on the live slider): the follower's ease `followMs` **200 ms** by default, its slider 0 – 500 ms by 10 (point 3, §8). ⛔ The first reading's (b) and (c) — a pan — were a MISREADING of his point and are withdrawn; (a), (d) superseded | the lead's change (config, menu, vectors); D-H14's leash: the note below |
| ⭐ D-H21 (H5) | D-H12 (F-4: in the spit a dx along the axis does not yaw toward a tip) WITHDRAWN — his A (§7) answers it: the yaw toward a tip is wanted | yes |
| ⭐ D-H22 (H5) | Point 5 (§8), ONE PART of it (he sees movement all along): the handover between the far-out follower and close in's picture as ONE owner, his 2026-11-11 rule applied to the picture DRAWN — at the automatic tilt's latch the camera PENDING keeps the follower's last drawn pose (not the logic's, never shown far out), then blends to close in's by his orbit mm (`blendShare`, `tiltBlendMm`); leaving, the follower restarts on the drawn direction and its target is blended in by the same mm (⛔ not by its spring's time); the latch's 5 cm hysteresis kept | yes, behind a switch (0 = today's); measured first by the owed approach walk (§9) under the default, `followTop` 0, `cameraFollower` 0 |

⭐ D-H14 at `followMs` 200: the leash stays TIED to it (`followTurnMaxDegS` × `followMs`, 104° at 200) — recommended: the leash is the lag the follower has at his clamp (lag = pace × τ for this spring), so below 520°/s of heading nothing differs from the plain follower he just chose; fixed at 62.4° it would go taut from 312°/s and move the camera at his finger's pace at ordinary paces — the smoothing undone. Cost: after a spin over 520°/s the camera may trail up to 104° (62.4°), still settling at most at 520°/s. ⭐ D-H15 amended by H5: its geometric jump is read on D-H19's reading (on the F-level one it inherits B and point 2). D-H13, D-H14, D-H16 – D-H18 unchanged.

## 7. His look on `f5e35c3` (2026-11-21) — packet H5, docs only
> Verbatim: *"This implementation is good except:
> - scene 0bis on dy : A) there is no calm any more : the camera orbit yaws only when the gizmo arrives very close to the poles. So the triangle faces are
>   viewed from the same view as the rectangle faces (attachment 3). This is not what was done previously and I don't like this new behavior. B) on the
>   level face, when the gizmo arrives to the edge with dy, the camera turns 90 degrees and then immediately another 90 degrees if the dy continues to push
>   (it then goes backwards, aligned with the input). I am not sure why this is now different from previous branches.
> - scene 0bis edges of the triangles connecting the pole and either the zenith/nadir edge or connecting the pole with the corners of the level face: when
>   I travel the gizmo close to these edges there is a lot of back and forth of the camera as the gizmo crosses these edges and the input directions change
>   (attachments 1 and 2) (attachments 4 and 5). I don't recall the same issue in the previous branch.
> - in the polar orbit when the gizmo is on the level face (for example in scene 1), the camera tends to follow each and every delta input: this is good for
>   accuracy but it makes the camera view quite jerky. why can't it be smoothed similarly to when the camera pans when the tilted-orbit gizmo is on the level
>   face ?"*

Then, verbatim: *"none of the sliders change what I observed and reported in my previous post"* (H3's three switches at 0 in the live menu), and on
the top rule's switch (`followTop`, its label quoted by him):
> *"yes, with follower: the top's rule — the calm's level heading, a turn at an edge…" at zero the calm comes back and this is what I want*

On point 3: *"I was referring to the tilted-pole 120ms smoothing so that the camera movements are smooth (I was not referring to having a pan on the
polar orbit)."* Then, on the live slider: *"yes, "follower: its one ease on the sphere (ms)" at 200 ms is better at far out distance. Increase the slider
up to 500 ms with 10 ms increment and set default to 200ms"*. And point 5: *"major finding as well: when I A + dy to approach on the level face of
scene 1, there is an insane amount of camera movements."*, then (on the hand-over read): *"it's not only at the threshold crossing: there is a lot of
orbit, camera movement, etc. happening everywhere during the A + dy travel"*.
His screenshots (all `f5e35c3`, desktop, `Scene_0bis`), the kit's `fo3/follow/h5/look_f5e35c3_att1.png` … `att5.png`: **att 3** the camera square to
the side (elevation 7°), the gizmo on a tip's side triangle seen nearly edge on; **att 1 – 2** the gizmo near the edge from the apex to a corner of the
level face (the bottom), the camera along the axis (att 2); **att 4 – 5** the gizmo near the apex's edge toward the zenith ridge, the same camera height
(47°), once along the axis (att 4), once square to the side (att 5). ⭐ **"The poles" = the tips' APICES** (the spit's own poles): on `Scene_0bis` the
polar zone is a SPIT whose axis is the heptagon's length (world x); the finger keeps its way on the glass (`fingerInFrame`), and the "yaw" he misses is
the world heading turning toward a tip as the gizmo goes onto its triangles; a zenith / nadir is never reached far out (the height is capped at 60°).
"The level face" = the bottom, on the floor.

## 8. The four points — each reproduced, its build, its root, its place in the design
Kit `fo3/follow/h5/`: readers `rd_a`, `rd_a2` (A), `rd_b`, `rd_b2`, `rd_b3` (B), `rd_p2`, `rd_p2b`, `rd_rb` (2), `rd_g0`, `rd_g1` (`followTop` 0), `rd_p3`,
`rd_p3b`, `rd_p3c` (3) `.mjs` on `runs_g2` / `runs_h1` (`de4a10e`), `runs_h2` (`ba369aa`), `runs_h3` (`f5e35c3`); the pure rules offline in `ab_sim`,
`p2_sim`, `band_sim`, `p3_filt` `.ts` (`npx vite-node`). His ten = his 1.0.142 play replayed on each build (60 frames a second).

**A — no calm on the tip triangles. Reproduced; root in H2's reading (`followTop` 1), so in `ba369aa` too; `de4a10e` had the calm.** On his ten, on the
tips' side triangles, the camera turns toward the tip by p50 **57 – 72°** on `de4a10e`, **2 – 3°** on `ba369aa`, **3 – 13°** on `f5e35c3` (the calm
asked 55 – 88° in all three; the face itself 62 – 77°); the reading (`top.L`) is square to the axis on 95 – 98 % of those frames in H2 and H3.
*Offline* (`ab_sim.ts`, the pure `levelledHeading` in the spit's frame): 180.0° (square) on a side triangle at every calm share; the calm asked 62 – 80°
toward the tip. *The root* — `levelledHeading` (`camera_follow.ts` l.298 – 312) reads the calm LEVEL in the orbit's frame F (`[cos y, 0, sin y]` turned
by `R`). In an upright frame F's level is the world's; in a SPIT F's vertical is the horizontal axis, so every reading lies in the vertical plane square
to the axis — its world heading 0° or 180° — and the calm's share toward the tip (F's pitch, a world YAW on a spit) is dropped. A yaw appears only
where the reading degenerates (near an apex, on the bottom triangle). *The lead's leads*: the level reading at every pitch — the object right, the
mechanism not: it is the FRAME (square below 50° of pitch too); the calm's ease missing the band — refuted (no jump exists: the reading is constant
across a triangle); the reading null there — refuted (null only on the level face). ⭐ It is exactly D-H12 (F-4, *"in the spit a dx along the axis no
longer yaws the camera toward a tip"*, left for his eye): his eye says no.

**B — 90° then another 90° off the level face. Reproduced; the same root; in `ba369aa` too; far less at `followTop` 0 (`de4a10e`).** On his ten the exits off the level face
onto the bottom triangle run *90 + 90* on both H2 and H3 (`ba369aa` `ilmj_60s` f131 – f156: the camera 176° → −93° → −3°, i.e. backwards; `f5e35c3`
`ilmj_114s` f252 – f294: 90° there and back); 90 + 90 pairs within 0.6 s, all on the triangles: 51 on `ba369aa`, 40 on `f5e35c3`; `de4a10e`'s spring
swings once toward the tip (~105°) and stays. *Offline* (`ab_sim.ts`): on the bottom triangle (normal (0.89, −0.46, 0)) the reading is **180°, 90° or
0°** by the sign of a 1e-9 residue of the normal's z and the side of the face's middle line; the calm asked 88.8 – 91.2° whatever. *The root*: there
the F-level direction is straight down, its horizontal part a residue, and the side test (`r·n > 0`, n's z exactly 0) falls to `headingOf(n)` (along the
axis) or not by rounding. Leaving the level face (the heading carried) the first jump is a real quarter turn (K4, by the edge left); the second is the
reading flipping on the same face. Each ≤ 90°, so no dy hold (D-H8 holds over 90° only): the camera ends reversed with his push going on —
*"backwards, aligned with the input"*. `p2_sim.ts`: as built one turn then 5 swings back and forth (up to 9.6° a frame); fed the calm asked's world
heading, the one quarter turn and nothing after. *At `followTop` 0* (`rd_g1.mjs`: the camera's heading legs ≥ 20° in the 1 s after the exit beyond
the calm asked's own — moves NOT asked): 2 of 16 exits on `de4a10e`, 4 of 18 on `ba369aa`, 7 of 15 on `f5e35c3`. *Why it shows more now*: F-2's clamp (his 520°/s) — a turn lasts p50 198 ms against 106 ms on
`ba369aa`; on the triangles 40 % of the time is spent turning, the gizmo held (29 %): the two turns are seen as two. Not the cause (his sliders at 0).

**Point 2 — back and forth along the apex edges. Reproduced offline; the same root; in `ba369aa` too; far less at `followTop` 0.** Across the apex → zenith-ridge
edge the two upper triangles read 0° and 180° (or one falls to its normal's heading, ±103°); across the apex → level-corner edge the side triangle reads
square and the bottom triangle 90° (B): every crossing near an apex is a jump of 90 – 180°, so a follower turn, the gizmo held. The finger in a spit is
read on the DRAWN camera (`zoneFinger`, `assembly_wiring.ts` l.2479 – 2505: `fingerInFrame` on `st.asmCamLast`, which `followFrame` writes with the
drawn pose): by design the finger keeps its way on the glass, so each turn rotates what his push does on the surface by the turn's angle — *"the input
directions change"* — and a push that crossed can carry the gizmo back over the edge: another turn. *Offline* (`p2_sim.ts`, the pure rules at H3's
defaults, a ±3 mm zigzag along each edge at 1.5 mm a frame): as built **6 turns, the gizmo held 48 / 59 of 150 frames, 5 / 6 back-and-forths**; fed the
calm asked's world heading **0 turns, 0 held, none** (the calm is whole at an edge: both sides show the orbit's own direction). *Recordings*: turns at a
crossing between two triangles on his ten — `de4a10e` 0, `ba369aa` 1.61, `f5e35c3` 0.82 a second; a heading leg NOT asked in the 0.5 s after a crossing
(`rd_g1.mjs`): 8 % of crossings on `de4a10e`, 22 % on `ba369aa` and `f5e35c3` (the plain back-and-forth count is alike — his own path reverses there; his
replayed play does not follow those edges: the game run is owed, §9). *The lead's leads*: F-3's rebase — refuted (his sliders at 0; at the
57 rebases near an apex the yaw step is 0.0°); F-1 — refuted (`ba369aa` turns twice as often there: the reading itself jumps).

**Point 3 — far out the camera is not as smooth as close in's "120 ms" (his meaning). Since the follower (`de4a10e`); ✅ decided: `followMs` 200.**
The two "120 ms" are not the same filter. The follower's (`followMs`, `sphereSpring`, `camera_follow.ts` l.134) is Lowe's SMOOTH TIME — ω = 2 / τ: two
poles of 60 ms on the camera's direction, the piece hung on that same direction (D-F3); its target the asked direction at the solver's RAW angles (D-F6:
the one ease). Close in's (`LOOK_TAU_MS`, `assembly_wiring.ts` l.52, l.1375) is one first-order pole of 120 ms on the LOOK POINT, behind the gizmo's own
45 ms (`gizmoEaseMs`): the piece moves with the finger and the camera trails it (`green_box_wiring.ts` l.1062 – 1070, his 8f86339). *What the picture
moves by per delta* (`rd_p3c.mjs`, his finger replayed far and close in): far out the view TURNS p50 4.1 – 4.5° a frame, its step changing p50 0.8 – 0.9°,
p90 3.0 – 3.3° a frame from frame to frame, on a target stepping p50 9 – 13° a frame (changing 8.7 – 10.9° — the finger's own cadence); close in the
view's direction is held on a face (p50 0.00°) and turns only in the timed turns, at a constant 6° a frame. *Offline on his recorded far-out target*
(`p3_filt.ts`): the follower at 120 roughness p90 1.76 / 1.88° (lag p50 28 / 12°); close in's chain on the same target 0.81 / 0.97° (49 / 25°); the
follower at **200: 0.92 / 1.02° (53 / 28°)** — close in's smoothness and lag. His trial on the live slider agreed: D-H20 decided. ⛔ The first reading
of his point (a pan, a level face only) was wrong and is withdrawn. *Kept as a note for later, nothing proposed*: close in's piece LEADS the camera
(the piece at the finger, the camera trailing); far out the piece rides the followed direction with the picture (D-F3), so at 200 it trails his
finger as the camera does — the gizmo stays where the finger puts it. Owed: `drv_h5.sh`'s `s1top` far and close in at 200 (G-level).

**Point 5 — the A + dy approach on `Scene_1`'s top: the camera jumps at the handover. Reproduced from the code and the recordings (the jump's size); the
approach in and out is owed. Since the follower draws far out (`de4a10e`, `cameraFollower` 1); not with `cameraFollower` 0 (`b03a4dd`).** The lead's
lead is PROVEN: `followActive` (`camera_follow_wiring.ts` l.33) hands the picture to close in's (`rollPictureFrame` → `carriedFrame`: the logic's pose,
its up carried about the framed line — the DIRECTION the logic's) the frame the automatic tilt latches (`tiltAutoLatch`: 0.6 m in, 0.65 m out —
`TILT_AUTO_HYST_M` 5 cm, the only hysteresis), the square camera's share leaves 0 or a zone mix starts, with no blend (its own header, l.9: *"⛔ No blend at
that boundary yet (F3)"*); leaving, the follower restarts AT REST on the piece's drawn direction (`followStart`, l.67) and its spring swings to its own
target by time. Close in's entry was built for a DRAWN logic: the tilt's PENDING (`tiltPendingStep`, `orbit_tilt.ts` l.678 — his 2026-11-11 rule, *"keep
the camera orientation when the tilted-pole-orbit toggles on as long as the approach continue"*) keeps the LOGIC's orientation, which far out is no
longer the one on the glass. *How far apart* (`rd_p5.mjs`, far out on `Scene_1`'s top, the S1 walks and `s1_over`): the picture drawn against the logic's
own pose p50 / p90 / max **27.6 / 31.2 / 84.6°** on `de4a10e`, **24.3 / 33.1 / 42.3°** on `ba369aa`, **16.5 / 30.6 / 42.3°** on `f5e35c3`; the drawn height
57 – 62° (the cap / the detour), the logic's 71 – 87° (nearly straight down). So each latch on the top is a one-frame jump of that size, and each
unlatch a timed turn out then the follower's swing back to its 60° cap; an approach dithering across 0.6 / 0.65 m repeats both. On a side at rest the
two poses agree (`h3c_*`, `Scene_0bis`: the handover's step 0.1°), so it shows on level faces only — *"on the level face"*. The approach far out
itself (before the latch) is read below. ⭐ **All along the travel (his second word): the hand-over is at most one part.** The candidates, read in the
code: *the dy feeding the orbit* — refuted: with A held both drag channels are zeroed (`pointer_wiring.ts` l.367 – 378) and the finger mm not counted
(l.383); *the target changing with the distance* — refuted far out on `Scene_1`'s top: the asked direction is the orbit's own at the solved angles (no
calm on a cap), which A does not move (far from any contact); *the facet flickering, turns at facet changes* — the facet is the map's at the angles,
unmoved by A: refuted far out; *the depth glide* — the ring's, after a depth step only (O-d): not the approach's. ⭐ *The piece hung on the follower's
direction* — a mechanism PROVEN in the code, top-specific: the orbit's centre (the foot, `footOf` → `shellAnchor(gs, u, d, …)`, `assembly_wiring.ts`
l.776) is laid along the LOGIC's shown direction `u` at the approach distance `d`, and the look point eases toward it (`lookShare`); the follower's
camera looks along ITS direction (capped at 60°). On a side the two agree, so an approach is a pure dolly — measured on `Scene_0bis`'s side
(`h3c_*` / `g2c_*`, the probe's approach legs): the view still (0.00°), the orbit's angles and the gizmo still, the eye 270 – 300 mm a frame at 5 px a
frame (1 : 1 with `d`, no ease), the look point 3 – 15 mm. On the top they part by the gap above (16.5 – 27.6° p50, up to 42 – 85°), so each mm of
approach slides the foot, the piece and the look point ACROSS the view by sin(gap) — 0.28 – 0.46 of it — besides the dolly. *The 60° cap against a target
near the vertical* is that gap's source. ⛔ Close in (past the latch), the approach runs the contact rules (the support's raise `restRaise`, the shell's
anchor, the tilt's pending) — no recording here: the owed walk counts it, frame by frame, with the far part.

## 9. What H5 amends, and what is owed
§1 (K3 narrowed, K16 added), §3 (the reading), §4 (the gates G-tip, G-BT, G-apex, G-level) and §6 (D-H19 – D-H21; D-H15 amended, D-H12 withdrawn)
are amended in place. ⭐ **The boundary** (his `followTop` 0 answer: keep `de4a10e`'s calm where it was; the top rule only where his D-H1 – D-H4 were —
a pure dy yawing near the vertical, the hold, the red section turned round the pole, the level face): `cameraHeading`'s own band (`orbit_calm.ts`: the
shown heading below 50°, the level reading from 60°, a smoothstep), read on the ORBIT's direction in the WORLD (his finger's place, `inp.orbit`) — never
F's pitch, which on a spit is a world yaw; a level face carried at every elevation. One rule for every frame (it replaces H5's first "on a spit" form).
*Offline* (`band_sim.ts`): on the tips 116° / 102° / 89° (the calm asked's own) where H2 reads 180° / 180° / 0°. *What it keeps*: above 60° R1 – R4 as
built (no yaw on a pure dy, the dy hold, the red section turned only by dx, the 60° cap); the zenith edge's half turn within ≈ 0.15 m of the middle.
*Its costs*: (i) below 50° a pure dy may yaw by the CALM, as on `de4a10e` (never by its detour, deleted): up the last slanted face 0.0° mid-axis, 12.7°
at 2.75 cm from a tip end (by place, ≤ 0.17° per 0.5° of orbit) — R1 bent there only; (ii) the zenith edge's jump is 180° × (1 − the band's share): a
half turn mid-axis, a partial one between ≈ 0.15 and 0.22 m, none near a tip end (one smooth yaw round the tip, K1) — R2's *"one line"* holds where the
view nears the vertical; (iii) `Scene_1`: the two readings are equal on vertical faces (`calmLevelHeading` = `calmHeading` below the pole fade) and on
the cap (no calm), but differ near a side's top edge where the calm reads ACROSS (`wA`) — G2 (`ov`, `nP` ≤ 2°) and G1 (within 0.1°) decide. Lessons:
rows 7 / 11 kept (from 60° nothing from the asked heading); rows 9 / 10 (by his finger's place, no time) and K11 (a band in degrees) kept; row 2 —
one owner, the band inside the reading, no layer. The rest of §3 and D-H8 stand (B's second turn goes, not the rule).
**Owed** (none run: no headless run while he tests): (1) the kit's `fo3/follow/h5/drv_h5.sh` — `Scene_0bis` along a side to a tip (A), the level face
onto the bottom triangle (B), zigzags along both apex edges (2), `Scene_1`'s top far and close in (3), at 571 px/s (60) and 1 200 px/s (143), on
`f5e35c3`, `ba369aa` (H3's switches 0), `de4a10e` (`followTop` 0) by URL — add `&followMs=120` / `200` once the default moves — read by the readers above;
(2) after D-H19 is built, the same, his ten, G1 on `Scene_1` / `Scene_0`; (3) point 5: `drv_h5.sh`'s approach walk on `Scene_1`'s top, A + dy in and out
across the threshold under the default, `followTop` 0, `cameraFollower` 0 — it needs a (P) probe mode first (`fast_walk_check.mjs` `IN=osc`, spelt out
in the driver) — read by `rd_p5b.mjs` all along the travel (which camera draws each frame, the latch, the view's step, the orbit's yaw / pitch steps,
the facet changes, the turns started, the eye's, look point's and gizmo's steps) and `rd_p5.mjs` (the gap that slides the piece across the view).
⭐ **(3) RUN 2026-11-21** (the lead; kit `h5/drv_h5b.sh` + `drv_h5c.sh`, `runs_h5b/h5_*_s1top_approach_60_px5`, read by `rd_p5c.mjs` / `rd_p5d.mjs`; 4 cycles
at 5 px a frame; the 2 px runs did not build): far out going in, the view turns **0°** in every build (a pure dolly). One cycle on `f5e35c3`: at the latch
a **23°** jump (the drawer handed over); close in's tilt 37° in 10 frames; at the approach's END (the piece at its closest, `ap` 0.451) **33° + 48°** in
two frames; leaving it a **35°** jump, a 57° tilt back; at the follower's return (≈ 0.85) the picture SPINS about the view **94° in one frame, ≈ 190° in
5**, then a 25° drift of height to the 60° cap. With `cameraFollower` 0 the hand-over, the spin and the drift go (the up's turn going out 23° against 905°)
— ⛔ **but close in's tilt and the two jumps at the approach's end stay, identical with every upright switch at 0 as well** (`uprightCarried`,
`uprightPicture`, `freeTurnMaxDeg` 0, `rollFollowMs` 200: the same figures to the 0.1°) — close in's own camera, older than the upright work (by switches,
not proven frame for frame to `892b6a3`). `followMs` 200 changes none of it.
