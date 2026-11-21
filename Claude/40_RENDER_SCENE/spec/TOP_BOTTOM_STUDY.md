# The top and bottom far out — THE STUDY after the last fix round (packet H4, 2026-11-21, branch `1.0.152-`)

> **Status: PROPOSED — nothing built; for the owner's word.** (⭐ H5, 2026-11-21: his look on `f5e35c3` read — §7 – §9: A, B and point 2 one root, D-H19 – D-H21.) Written because H3 (`f5e35c3` live = `47e7267`) was the last fix round on this join and
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
| K3 | On the top the heading turns only by his dx, a level face and a zenith / nadir edge alike; a pure dy never yaws (⭐ H5: where the orbit's pitch is the world's — on a spit the dy runs along a horizontal axis, §9); the height capped at 60° | R1 = D-H1 (§14.4) |
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
| ⭐ K16 | The calm is part of the camera's orbit at a spit's tips too: the camera turns toward a tip as the gizmo goes onto its triangles | his look on `f5e35c3`, A (§7) |

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
| the continuous reading `c` | the reading's own motion: each frame `c += wrap(L − Δ − L_before)` | the levelled reading `L` (K8) and its jump `Δ`; ⭐ on a SPIT `L` = the calm asked's WORLD heading (D-H19, §8 – §9) | a discontinuity; F's level on a spit |
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
| G-level (H5, reported) | `Scene_1`'s top: the view's turn a frame per mm of gizmo; the rotation share | 0.63° height + 1.00° heading / 5.2 mm; 1.00 | 0.63° + 0.14°; 1.00 | his eye |

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
| ⭐ D-H19 (H5) | On a spit the follower's heading reads the calm asked in the WORLD (A, B, point 2 — one root, §8): the camera turns toward a tip as on `de4a10e`, one quarter turn off the level face's short edge (K4), no turn along the apex edges; upright frames unchanged bit for bit | yes — offline no turn along the edges (6 as built), the bottom triangle stable (±1.2° against 0 / 90 / 180°); behind a switch (0 = `f5e35c3`); gates G-tip, G-BT, G-apex, G1 |
| ⭐ D-H20 (H5) | A level face far out (point 3): (a) as is; (b) the CALM on a level face for the picture — its height and heading held in the face's middle, the whole angle in his edge band (15 / 50), so a delta there moves the gizmo and the piece under a still picture; (c) close in's pan far out (the look on the gizmo — bends K2); (d) a longer ease (time; the piece trails its gizmo) | (b), its own small packet behind a switch, measured first on the owed `s1top` runs; the follower's targets only, nothing of the gizmo's travel — and first his word that a still picture in the face's middle is what he means |
| ⭐ D-H21 (H5) | D-H12 (F-4: in the spit a dx along the axis does not yaw toward a tip) WITHDRAWN — his A (§7) answers it: the yaw toward a tip is wanted | yes |

⭐ D-H15 amended by H5: its geometric jump is read on D-H19's reading on a spit (on the F-level one it inherits B and point 2). D-H13, D-H14, D-H16 – D-H18 unchanged.

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

Then: *"none of the sliders change what I observed and reported in my previous post"* (H3's three switches at 0 in the live menu: all four points stay).
His screenshots (all `f5e35c3`, desktop, `Scene_0bis`), the kit's `fo3/follow/h5/look_f5e35c3_att1.png` … `att5.png`: **att 3** the camera square to
the side (elevation 7°), the gizmo on a tip's side triangle seen nearly edge on; **att 1 – 2** the gizmo near the edge from the apex to a corner of the
level face (the bottom), the camera along the axis (att 2); **att 4 – 5** the gizmo near the apex's edge toward the zenith ridge, the same camera height
(47°), once along the axis (att 4), once square to the side (att 5). ⭐ **"The poles" = the tips' APICES** (the spit's own poles): on `Scene_0bis` the
polar zone is a SPIT whose axis is the heptagon's length (world x), so his dy runs ALONG the axis toward an apex and the "yaw" he misses is the world
heading turning toward a tip; a zenith / nadir is never reached far out (the height is capped at 60°). "The level face" = the bottom, on the floor.

## 8. The four points — each reproduced, its build, its root, its place in the design
Scripts in the kit's `fo3/follow/h5/`: `rd_a.mjs`, `rd_a2.mjs` (A), `rd_b.mjs`, `rd_b2.mjs`, `rd_b3.mjs` (B), `rd_p2.mjs`, `rd_p2b.mjs`, `rd_rb.mjs`
(point 2), `rd_p3.mjs`, `rd_p3b.mjs` (point 3) on `runs_g2` / `runs_h1` (`de4a10e`), `runs_h2` (`ba369aa`), `runs_h3` (`f5e35c3`); the pure rules
offline in `ab_sim.ts`, `p2_sim.ts` (`npx vite-node`). His ten = his 1.0.142 play replayed on each build (60 frames a second).

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

**B — 90° then another 90° off the level face. Reproduced; the same root; in `ba369aa` too; not in `de4a10e`.** On his ten the exits off the level face
onto the bottom triangle run *90 + 90* on both H2 and H3 (`ba369aa` `ilmj_60s` f131 – f156: the camera 176° → −93° → −3°, i.e. backwards; `f5e35c3`
`ilmj_114s` f252 – f294: 90° there and back); 90 + 90 pairs within 0.6 s, all on the triangles: 51 on `ba369aa`, 40 on `f5e35c3`; `de4a10e`'s spring
swings once toward the tip (~105°) and stays. *Offline* (`ab_sim.ts`): on the bottom triangle (normal (0.89, −0.46, 0)) the reading is **180°, 90° or
0°** by the sign of a 1e-9 residue of the normal's z and the side of the face's middle line; the calm asked 88.8 – 91.2° whatever. *The root*: there
the F-level direction is straight down, its horizontal part a residue, and the side test (`r·n > 0`, n's z exactly 0) falls to `headingOf(n)` (along the
axis) or not by rounding. Leaving the level face (the heading carried) the first jump is a real quarter turn (K4, by the edge left); the second is the
reading flipping on the same face. Each ≤ 90°, so no dy hold (D-H8 holds over 90° only): the camera ends reversed with his push going on —
*"backwards, aligned with the input"*. `p2_sim.ts`: as built one turn then 5 swings back and forth (up to 9.6° a frame); fed the calm asked's world
heading, the one quarter turn and nothing after. *Why it shows more now*: F-2's clamp (his 520°/s) — a turn lasts p50 198 ms against 106 ms on
`ba369aa`; on the triangles 40 % of the time is spent turning, the gizmo held (29 %): the two turns are seen as two. Not the cause (his sliders at 0).

**Point 2 — back and forth along the apex edges. Reproduced offline; the same root; in `ba369aa` too; not in `de4a10e`.** Across the apex → zenith-ridge
edge the two upper triangles read 0° and 180° (or one falls to its normal's heading, ±103°); across the apex → level-corner edge the side triangle reads
square and the bottom triangle 90° (B): every crossing near an apex is a jump of 90 – 180°, so a follower turn, the gizmo held. The finger in a spit is
read on the DRAWN camera (`zoneFinger`, `assembly_wiring.ts` l.2479 – 2505: `fingerInFrame` on `st.asmCamLast`, which `followFrame` writes with the
drawn pose): by design the finger keeps its way on the glass, so each turn rotates what his push does on the surface by the turn's angle — *"the input
directions change"* — and a push that crossed can carry the gizmo back over the edge: another turn. *Offline* (`p2_sim.ts`, the pure rules at H3's
defaults, a ±3 mm zigzag along each edge at 1.5 mm a frame): as built **6 turns, the gizmo held 48 / 59 of 150 frames, 5 / 6 back-and-forths**; fed the
calm asked's world heading **0 turns, 0 held, none** (the calm is whole at an edge: both sides show the orbit's own direction). *Recordings*: turns at a
crossing between two triangles on his ten — `de4a10e` 0, `ba369aa` 1.61, `f5e35c3` 0.82 a second; his replayed play does not follow those edges, so the
back-and-forth count there is alike (0.38, 0.43, 0.32 a second) — the game run is owed (§9). *The lead's leads*: F-3's rebase — refuted (his sliders
at 0; at the 57 rebases near an apex the orbit's yaw step is 0.0°); F-1 turning where `ba369aa` did not — refuted (`ba369aa` turns twice as often
there: the reading itself jumps). Near an apex the orbit's own yaw sweeps fast (p50 12.9° a frame): the polar orbit's mapping, never reopened.

**Point 3 — on a level face far out the camera follows every delta. Reproduced on the recordings; since the follower (`de4a10e`), not H2 / H3.** On
`Scene_1`'s top (the S1 walks, 330 frames, the same route in the three builds) the camera's height steps **0.63°** a frame for 5.2 mm of gizmo on
`de4a10e`, `ba369aa` and `f5e35c3` alike; its heading **1.00°** on `de4a10e`, 0.14° on H2 / H3 (carried within 30° of the vertical). All of it is a
ROTATION of the view about the assembly's centre (the eye's step against the look point's: share 1.00). Close in on a level face (`h3c_*`, few frames):
the view's turn p50 0.00°, the eye moving with the look point (rotation share 0.05) — a PAN. *The root*: far out the follower's target on a level face
is the orbit's own direction (no calm on `Scene_1`'s cap: `asmAskCalm` null; the height the asked one under the 60° cap) through the ONE 120 ms spring,
and the camera looks at the assembly's centre (`st.asmLook`, `lookShare` 0 far out — K2), so following the piece IS turning the whole picture: 1 mm of
gizmo ≈ 0.15° of view. Close in is not smoothed by a longer time — its look point eases at **120 ms** (`LOOK_TAU_MS`, `assembly_wiring.ts` l.52,
l.1375) after the gizmo's **45 ms** (`gizmoEaseMs`), the follower's own 120 ms — but its view does not TURN: the calm keeps it square in the face's middle
and only the look point (the gizmo) slides. *Close in's way far out would cost*: the look point on the gizmo (bends K2, *"the camera looks at the
centre of its orbit"*), or a longer ease (time; the piece, hung along the followed direction, would trail off its gizmo's line — the gizmo itself stays
under the finger). The calm's way costs neither (D-H20).

## 9. What H5 amends, and what is owed
§1 (K3 narrowed, K16 added), §3 (the reading on a spit), §4 (the gates G-tip, G-BT, G-apex, G-level) and §6 (D-H19 – D-H21; D-H15 amended, D-H12
withdrawn) are amended in place. Nothing else in the design changes: the two followers, the leash, the turn's whole gap, the hold on the drawn up and
the depth glide's decision stand; D-H8 stands (B's second turn goes, not the rule).
**Owed** (none run: no headless run while he tests): (1) the kit's `fo3/follow/h5/drv_h5.sh` — `Scene_0bis` along a side to a tip (A), the level face
onto the bottom triangle (B), zigzags along the apex → zenith and apex → corner edges (point 2), `Scene_1`'s top far and close (point 3), at 571 px/s
(60) and 1 200 px/s (143), on `f5e35c3`, `ba369aa` (H3's switches 0) and `de4a10e` (`followTop` 0) by URL, read with the readers above; (2) after
D-H19 is built, the same, his ten, G1 on `Scene_1` / `Scene_0`; (3) D-H20 (b) measured on (1)'s `s1top` runs before any build.
