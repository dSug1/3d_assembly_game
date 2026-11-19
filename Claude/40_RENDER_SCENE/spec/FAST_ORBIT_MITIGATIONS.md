# FAST_ORBIT — the mitigations of the gap over 90° (a study, nothing built)

* **What it is**: a study of the fast roll near a tip's axis, by one Opus agent, offline (no game run, nothing built, no web search; the literature from memory).
* **Who asked**: the owner; his words are in [`FAST_ORBIT.md`](FAST_ORBIT.md) §13.7.
* **Status**: nothing built; largely superseded the same night by the upright picture, under which the follower's gap is not what he sees.
* The study below is copied unchanged from the kit (its headings one level down).

## FO3 — the gap over 90°: the mitigations studied (an Opus agent, 2026-11-18; offline, nothing built, no game run)

### 0. The result first

* **The cause is the frame, not the follower.** The ghost is a camera upright in the WORLD. Its heading is read off the view's own level direction
  (`spitCameraHeading` in a spit under 75° of pitch; `cameraHeading` elsewhere). Near the vertical that heading swings at about
  (the orbit's speed) / sin(the angle to the vertical), and the picture rolls by (heading change) × sin(pitch). On his hand the camera passes
  **1 – 5° from the vertical** (measured, all ten stretches). So a pass by the top concentrates about a half turn into 3 – 6 frames.
* **A second source comes from S1 itself.** A zone's or a crossing's turn under 90° made free puts its WHOLE angle into ONE ghost frame:
  first-frame twists of **21 – 87°**, 10 – 20 such turns per stretch (measured). One turn in `ilmj_39s` reaches **180°** in one frame (§13.5's
  moving target, judged at its first frame by the shadow).
* **They do not cancel.** After a swing of more than 30°, the turn that follows goes the SAME way in **21 of 27** passes (measured, ten stretches).
* **No follower alone can hold the gap under 90° without fast frames.** The best possible follower for a given drawn speed (a pure rate limiter: a
  lower bound) still passes 90° on **3 of 10** stretches at 600° a second (10° a frame) and on **1 of 10** at 1 200° a second (20° a frame).
* **A clamp or a damping of the finger does not fix it either** (an estimate): capped at 300° of twist a second, **9 of 10** stretches still pass 90°,
  and his stretches get **0.35 – 1.6 s** longer.
* **Recommended, if his look is not satisfactory**: (1) try the slider he already has (`rollFollowMs` 120); (2) a follower whose time shortens with the
  ghost's twist RATE (small packet, the logic untouched); (3) for the cause itself, a study, not a build: the up carried by parallel transport while
  the view looks steeply down, given back by the pitch on the way down — this needs his word (it changes the logic's frame, R1). **Advised against**:
  the finger clamp, the damping by the distance to the pole, and a hard stop at 90°.

### 1. The root cause, read in the code and on the recordings

* `assemblyCameraFrameRaw` (`assembly_wiring.ts`, l. 1514 – 1556): in a spit the camera is upright in the world, its heading `spitCameraHeading(uW, axis, side)`.
  `spitCameraHeading` (`polar_zone.ts` l. 213) = the heading of the direction's level part + the side's bias (0.3), faded in from 60° to 75° of pitch.
  Under 75° the bias is partial, and the heading follows the direction's own. Outside a zone (`Scene_1`), `cameraHeading` (`orbit_calm.ts` l. 211) and
  the calm's held offset (`heldOffsetStep`) work the same way: by the pitch, upright in the world.
* **Checked on the recordings** (`cause.mjs`): on gizmo-free frames twisting over 0.5°, the sum of |heading change × sin pitch| against the sum of the
  measured twist is **×1.16 – 1.49** on 6 of 10 stretches and up to **×3.1** where the side's bias holds the heading. The sign agrees on all but 3 – 15
  frames per stretch. The model is an upper bound; the mechanism is confirmed. The worst frames sit at a view pitch of **59 – 82°**.
* `ilmj_99s` frames 84 – 101 (`peek.mjs`): pitch 29 → 70 → 51°, heading −2 → −179° in 11 frames; twists 3, 4, 8, 14, 24, 26, **42°**; then the crossing's
  turn (`mix` id 5) adds 16° more, the same way. The finger moved 1 – 30 px a frame.
* `Scene_1` over the cube's top (`fw_f_s1_over_px20`): no zone and no turn; 41 free frames, worst 22° a frame at a pitch of 87°, 3° from the vertical.
* **Necessity or choice? Both.** Going over the top from one side to the other, a camera that is upright at both ends must roll about a half turn
  against a camera that just follows the orbit (parallel transport, Bishop 1975). That total is geometry, once "upright" is the rule (T6, the charts'
  Upright). WHEN it is paid is a choice of frame: the heading read off the direction pays it in the few frames nearest the vertical, at a rate of
  1 / (the miss angle). An exact pass is handled by the crossing's timed turn; a near miss of a few degrees is not.
* **The lead's question (§13.7, the crossing's half turn after the roll)**: it is short, because the swing has already done most of it. But it is not
  cancelled: it ADDS the same way in 21 of 27 passes (before / during, in degrees: `ilmj_99s` 120 / 19; `ilmj_23s` −157 / −116, 45 / 5, 63 / 71; `ogse_3s`
  52 / −87 is one of the 6 that cancel in part). Twice in `ilmj_23s` the swing and the turn sum to more than 180°; the gap's short-way rule then closes it
  the other way.

### 2. His five lines, every reading

Figures from `sim.mjs` (the follower re-run on the recorded twists, `follow_sim.mjs`'s step and take rule; T200 reproduces the recorded gap to **5e-12°**),
over his ten stretches far out at 60 frames a second, given as **median / max** over the runs. "Worst" is the largest turn of the picture about the framed
line drawn in ONE frame (follow_sim's measure). It compares the variants with each other, NOT with §13.2's "roll a metre today", which is split about the
view. All measured offline on today's route.

| candidate | gap's largest | runs over 90° | frames over 90° | worst frame | frames over 10° | from the peak to 5° |
|---|---|---|---|---|---|---|
| (a) `rollFollowMs` 60 | 98 / 179° | 6 / 10 | 2 / 5 | 21.5 / 35.2° | 15 / 38 | 167 / 183 ms |
| (a) 120 | 115 / 178° | 8 / 10 | 6 / 15 | 12.9 / 18.1° | 9 / 17 | 300 / 333 ms |
| (a) **200 (S1 as built)** | 122 / 178° | 9 / 10 | 13 / 23 | 8.1 / 10.9° | 0 / 5 | 517 / 1 233 ms |
| (a) 300 | 127 / 178° | 9 / 10 | 18 / 38 | 5.5 / 7.3° | 0 / 0 | 683 / 1 600 ms |
| (b-ii) the time 200 → 60 ms as the view's pitch goes 45 → 75° | 113 / 178° | 7 / 10 | 6 / 15 | 12.8 / 34.5° | 3 / 15 | 417 / 1 167 ms |
| (2) the time 200 / (1 + rate / 600° a second), at least 60 ms | 100 / 178° | 7 / 10 | 4 / 11 | 14.7 / 23.3° | 9 / 15 | 383 / 983 ms |
| (2) T200 + the drawn turn capped at 600° a second | 122 / 178° | 9 / 10 | 13 / 23 | 8.1 / 10.0° | 0 / 0 | 517 / 1 233 ms |
| bound: rate limiter only, 600° a second | 77 / 170° | 3 / 10 | 0 / 9 | 10.0° | 23 / 39 | 150 / 283 ms |
| bound: rate limiter only, 1 200° a second | 65 / 160° | 1 / 10 | 0 / 4 | 20.0° | 29 / 50 | 67 / 133 ms |

On `Scene_1` over the top (one walk, 1 200 px a second, no turn there): T200 gives **161°**; the pitch rule gives **76°**, the rate rule **85°**, T60 **76°**,
each with a worst frame of **17 – 18°**. At 143 frames a second (`ilmj_23s`, `ogse_3s`) every variant reaches 180°, from a turn whose twist is 180° in one
frame (the O2 rounding, §13.5).

**(a) The follower's speed on a slider.** It already ships (`rollFollowMs`, 60 – 600). Measured above: no value keeps the gap under 90°. 120 halves the
time to rest and the frames over 90°, but the worst frame goes from 8 to 13°. 60 is close to today's game (frames of 20 – 35°). Risk: none, it is a
slider. Rules: none.

**(b) Quicker "with the distance": three readings.**
* (i) *by the gap*: measured in §13.6 (× 60/gap, × (60/gap)²): 90 – 155°, a worst frame of 13 – 41°. Not redone here.
* (ii) *by the closeness to the pole* (the view's pitch, the cause's own variable): see the table. It helps `Scene_1` (161 → 76°) more than the spits
  (9 → 7 runs over 90°), because in a spit the largest steps come from the turns, not from the pitch. A rule on the WORLD's vertical names no scene or
  face, but it is a geometric threshold in degrees: it needs his word.
* (iii) *by the piece's distance to the assembly*: close in the gap is already **3 – 7°** (§13.2), because `closeInGain` slows the orbit there (Ware and
  Fleet 1997, already built). Far out it is just a shorter `rollFollowMs`, which is reading (a). Nothing to add.

**(c) A clamp on how much the finger's step moves the orbit**, per frame or per second, everywhere or only near the pole. Estimated (`retime.mjs`: the
recorded steps re-timed so that no free frame twists more than the cap, the finger assumed to go on pushing; NOT a game run, he would react):

| cap | stretches still over 90° | the gap's largest | time added per 10 – 15 s stretch | his travel delayed |
|---|---|---|---|---|
| 300° a second | 9 / 10 | 77 – 178° | 0.35 – 1.6 s | 43 – 2 610 px |
| 600° a second | 9 / 10 | 82 – 178° | 0.03 – 0.53 s | 0 – 950 px |

It does not fix the gap, because the turns' one-frame dumps and the half turn's total stay the same. It changes the LOGIC: R1 bent; *"never reopen what
drives the piece and the camera's orbit"* bent (the finger's pace on the surface changes near the top, which his fast orbit asked to keep); a clamp per
AXIS would also change the step's direction (R7, *"same direction of gizmo and finger"*), so only a scaling of the whole step is possible. A cap per
FRAME breaks R9 (time, not frames). The per-millimetre form already exists: the TURN GOVERNOR (`input/turn_governor.ts`, 2026-10-19, his own request,
the scene's orbit; `orbitDragStep` bypasses it around the assembly). If ever, that form is the one to use (by position, so it does not depend on his pace).

**(d) A damping of that step by the distance**: to the pole, it is (c) made smooth, with the same estimate and the same rules bent, plus a threshold in
degrees. By the approach, it is `closeInGain`, already built. The calm (`orbit_calm.ts`) does NOT damp the finger: it shapes the direction and the heading
shown, by the pitch. Its `heldOffsetStep` (the heading offset held while the view looks down, given back by the pitch) is the nearest thing in the
project to candidate L2 below.

### 3. Other candidates from the literature (all over twenty years old unless said; from memory, no web search made)

| # | candidate | prior art | removes the cause or hides it | verdict |
|---|---|---|---|---|
| L1 | a rate limiter, the excess kept in the gap | the classic slew-rate limiter (control) | hides it | measured above: the bound; at 10° a frame, 3 / 10 runs still over 90° |
| L2 | **the up carried by parallel transport** while the view looks steeply down (no heading swing near the vertical), given back to upright BY THE PITCH on the way down | Bishop 1975; Hanson and Ma 1995 (parallel-transport frames); the project's own `heldOffsetStep` | **removes it**: the half turn is paid over the descent, by the finger's travel, never in a few frames | to study (§4.3) |
| L3 | the side's heading from a lower pitch (the spit's bias earlier), so a near miss becomes the crossing's timed turn | the project's `spitCameraHeading` | moves it into a timed turn of 90° or more: the gizmo held (R6) | ⛔ tried the other way 2026-11-14: the bias from lower pitch left the camera 5 – 17° off upright for hundreds of frames (105 – 112 ROLL events); against |
| L4 | a follower time set by the twist rate | Casiez, Roussel, Vogel 2012 (the speed-adaptive "1€" filter; recent, published openly) | hides it | measured above (row "rate") |
| L5 | orientation filters | Lee and Shin 2002 | hides it | it is what the follower is |
| L6 | a turntable with the pitch clamped short of the pole | common practice in modelling tools (turntable / tumble) | removes it by forbidding the pass | ⛔ against: the game crosses the top on purpose (the charts, the pole's crossing) |
| L7 | a free trackball (no up at all) | Chen, Mountford, Sellen 1988; Shoemake 1992 | removes it, with the up | ⛔ against: T6 and the charts' Upright |
| L8 | a field of cameras over the surface | Hanson and Wernert 1997 | by place | not needed: L2 is its simplest case |
| ⛔ | the ViewCube (Khan et al. 2008), HoverCam (Khan et al. 2005), "Safe 3D navigation" (Fitzmaurice et al. 2008) | Autodesk | — | **NOT usable**: patented or very likely so (not checked), and the ViewCube is a 3D orientation widget, which he forbids |

### 4. Recommendation, ranked (only if his look at the deploy is not satisfactory)

**4.1 First, his slider (no packet).** Ask him to try `rollFollowMs` **120**, then 60. Measured: rest in about 0.3 s instead of 0.5 s; frames over 90°
halved (median 13 → 6); the worst frame 13° (median) instead of 8°. Nothing changes in the code.

**4.2 The follower's time by the twist rate (L4, a small packet).**
* What: `src/input/roll_follow.ts` `followStep` takes a time that depends on the twist rate (`T = max(Tmin, rollFollowMs / (1 + rate / rateRef))`, a
  second-order step whose ω changes between frames); `src/render/roll_shadow.ts` and the camera's stage pass the rate. Sliders: `rollFollowRateRef`
  (° a second, 600), `rollFollowMinMs` (60); `rateRef` 0 = today's S1, bit for bit (R10).
* Measured offline: the runs over 90° 9 → 7 of 10; the median gap 122 → 100°; `Scene_1` over its top 161 → 85°; the price is a worst frame of 14.7°
  (median) instead of 8.1°.
* Rules: none bent (R1 – R10 kept; the logic untouched; it names no scene).
* Risks: a time that changes inside the critically damped step must keep it without overshoot (vector: a step of the rate between two frames; A3 at rest
  the ghost, bit for bit). The pitch reading (b-ii) is the alternative; it scores about the same and adds a threshold in degrees: not advised over this one.
* Gate, like for like: his ten stretches replayed (the same pointer events), the roll per metre of gizmo travel, the gap's largest and its share over 90°,
  the worst frame; `fw_f_s1_over_px20`; A0 with the slider at 0. Size: one builder and one auditor, about the size of S0's code commit.

**4.3 The cause: the up carried near the vertical (L2) — a STUDY first, then his word.**
* What it would change: the logic's camera frame (`assemblyCameraFrameRaw`, `spitCameraHeading`, `cameraHeading` and `heldOffsetStep` together): over a
  pitch threshold the up is carried by parallel transport (no heading read off the direction), and given back to upright by the pitch on the way down,
  as `heldOffsetStep` does for the calm's offset. The half turn is then paid by the finger's travel down the far side, not in 3 – 6 frames.
* Rules: R1 bent (the logic's frame; NOT the gizmo ↔ orbit bijection, the drive is untouched); T6 / Upright: kept where the view is not steep (T6 asks
  upright only on faces that are not level); T4 (no turn in the middle of a face) better kept than today. **His word needed.**
* Not measurable offline: I tried (`transport.mjs`) and the ghost's view direction itself jumps at the changes of frame (e.g. a pitch of 67° → 40° in one
  frame, `ilmj_23s` frame 11), so the estimate is meaningless (frames of 100 – 180° either way). Only a game run can tell. The spit's crossing turn and
  the free entry (`freeShownHeading`) must be re-read with it. Size: a study (the four parts: rules, obstacles, design, audit), then a build of the size of
  a C-step.

**4.4 Advised AGAINST.**
* (c) the clamp and (d) the damping by the distance to the pole: they do not fix the gap (9 / 10 still over 90°, estimated), they slow his fast orbit
  by 0.35 – 1.6 s per stretch, and they bend R1 and the standing rule on what drives the orbit.
* The hard stop at 90°: a worst frame of 9.5 – 70° (§13.6).
* L3 (the bias earlier), L6, L7, and the patented systems above.
* A smaller variant worth naming, NOT advised without his word: keep the zone's turns that FOLLOW a near-pole swing timed (amendment 2 of §13.6). It would
  remove the one-frame dumps of 21 – 87°, but it bends R6.

### 5. What I did not check

* No game run: every figure is on today's route (S0's recordings, `runs/new`). Under S1 and S2 the route changes, because the finger is read off the
  picture; the follower-side figures hold only as far as the route stays close.
* The shadow decides a turn's "free" by its first-frame twist (O2); S1 judges it on the whole angle with a tolerance. So the 180° turn in `ilmj_39s` and
  the 143-frame runs may count frames that S1 keeps timed.
* Only far out at 60 frames a second, plus `Scene_1` over its top and two runs at 143. The 0.736 runs (`*_half`) and the seeded replays were not re-run.
* (c) and (d) are estimates by re-timing; the player's reaction is not modelled.
* The literature is cited from memory; the patent status was not searched.
* Not read: `TILTED_ORBIT_REBUILD_SCOPE.md` §21 – 32 (this branch's file stops at §18); `POLAR_ORBIT_CLEANUP.md` §8.5 by its title only (world-plane
  cuts, a gizmo mapping, not a rate).

Scripts (this folder): `peek.mjs`, `cause.mjs`, `sim.mjs` (+ `sim_out.json`), `turns.mjs`, `retime.mjs`, `transport.mjs` (inconclusive, kept as the record).
