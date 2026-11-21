# The picture's rebuild — THE STUDY (packet R1, 2026-11-21, branch `1.0.153-Picture_rebuild`, src = `620f227`)

> **Status: PROPOSED — nothing built; for the owner's word.** Docs only. His four parts: the rules → the obstacles, each reproduced → a design from
> prior art, one owner per thing → its audit, the decisions. ⛔ Offline only (he may be testing on this PC): the code, `git show` of the commits named,
> the kit's recordings (`fo3/follow/h5/runs_h5b`, `h3/runs_h3`, `runs_g2`) and the pure functions run with `npx vite-node`. The scripts of this packet:
> the kit's `fo3/follow/r1/` — `rd_r1a.mjs` (one approach cycle frame by frame), `rd_drawer.mjs` (the drawer's hand-overs far out), `rd_roll.mjs` (the
> drawn up against gravity's), `framing_sim.ts` (close in's pending turn, the pure `poseFramingTwo` / `poseAboutPiece`). What needs the game: §7, OWED.

## 0. His words, and the evaluation he accepted
<!-- VERBATIM-BEGIN -->
> I think this needs a major rebuild. Wait until the runs complete. then evaluate the necessity to do a proper rebuild with rules which capture the
> lessons learned. Advise which commit and which branch of which worktree the rebuild shall start from (orbit_charts branch 1.0.148c- or one of the
> builds of camera_follow).

then, on the lead's evaluation: **"go on with the rebuild"**.
<!-- VERBATIM-END -->

**The lead's evaluation** (a PROPOSAL to falsify, read in §2 – §5): rebuild the PICTURE only — the camera as drawn. Today TWO DRAWERS hand over
unblended (the far-out follower `followFrame` ↔ close in's `rollPictureFrame` / `carriedFrame`, by `followActive`) over the upright layers, each fix a
layer with a switch. The rebuild starts here: `../camera_follow`, branch `1.0.153-Picture_rebuild` at `620f227` (= `1.0.152-` H3 `47e7267` + `followMs`
200 `3bc9d7f` + the probe's `IN=osc` `7faca08` + docs).

## 1. The result first
* **Close in's own jumps at the approach's end are ONE writer: the two-target framing of the automatic tilt's PENDING turn** (`zoneMixPose` →
  `poseFramingTwo`, Lino & Christie's toric space). The pending holds the turn at k = 0 while the approach goes on; the framing re-solves the camera
  every frame from the piece's and the aim's places on the glass at the turn's start; the approach brings the piece down onto its aim (the gizmo, close
  in), so their separation shrinks under rA·sin α — first the solve swings the camera round the piece (the "tilt" 37° in 10 frames), then it has no
  solution and falls back to the turn about the piece: the 32° – 48° snap. Backing out, the solution comes back: the 35°. Not the contact's raise, not
  the support, not the square camera (its share 0 throughout). **Reproduced on the recordings and offline on the pure function** (§3, O-1). Since the
  charts' 2.4c (`c25a1cc`, 2026-11-15); the same code in `892b6a3` (read, not run). ⭐ A smoothing would MASK it: the target itself is wrong — fixed
  at its source.
* **The hand-over is real and has three parts**, all reproduced: at the latch the drawn piece leaps 308 mm sideways (from the follower's line onto the
  logic's); at the follower's return its up is rebuilt from the residue of a near-vertical view — 94° in one frame; then its spring pulls the camera
  ≈ 25° down to its 60° cap by time (22° in the first 12 frames), a move he never asked.
* **The lead's rule (3) does not survive as written**: one smoothing over close in would delay the drawn turn behind the clock the gizmo waits on (his
  T5, "waiting that the camera catches up") and change the close in he approved. Amended: one smoothing PER REGIME, the far one faded out by place
  before the latch; no pace layer — the view's step is a GATE.
* **The design** (§4): ONE picture function at every distance, its state never dropped; far ↔ close a change of TARGET by the approach's own place over
  his last 10 mm of approach finger before 0.65 m (outside the latch's hysteresis), so the latch and the unlatch draw nothing new; the up handed over by
  his orbit mm in, his out mm out (his own 2026-11-11 and C3 rules); every close-in turn turned about the piece. Five packets R2 – R6, one switch.

## 2. Part 1 — the rules (each with its source)
| # | the rule | source |
|---|---|---|
| P1 | ONE owner of the picture at every distance; close in's tilt, the approach, the square camera are its TARGETS | lead (1); lessons row 1, §5.1 |
| P2 | No roll of the scene on the glass; gravity on its vertical, at least as `1.0.147-`; a pole's half turn one smooth yaw | 11-18, 11-20 (lessons §4) |
| P3 | One smoothing and one pace limit — no frame turns the view more than a set angle (⚠ the lead's HYPOTHESIS, tested in O-1, O-5) | lead (3) |
| P4 | The calm on every face, the spit's tips included, read in the WORLD | lead (4); his A, `followTop` 0 (K16, D-H19) |
| P5 | The top / bottom: the heading by dx only near the vertical, the height capped at 60°, a turn only at an edge with the gizmo waiting, paid by his mm | D-H1 – D-H4 (R1 – R4) |
| P6 | The picture never reads the logic's heading as its own and never writes into the logic | lead (6); lessons rows 7, 11 (K12) |
| P7 | One switch for the rebuild, 0 = `620f227` frame for frame; the old layers deleted after his look, proven bit for bit | lead (7); §5.4; `CL1` |
| P8 | *"keep the camera orientation when the tilted-pole-orbit toggles on as long as the approach continue, then the camera blends with the new alignment with the delta position mm when the orbit at close in starts"* | 2026-11-11; T10 |
| P9 | The way out of close in blended by the fingers; the distance switch stays (0.6 / 0.65 m) | D-T1, C3 |
| P10 | The camera looks at its orbit's centre (the gizmo close in), the look point trailing 120 ms; the gizmo 45 ms | his words (lessons §4); `8f86339`; 11-04 |
| P11 | Far out a simple polar orbit following the gizmo through ONE ease (D-F1 30° off the vertical, D-F2 by place, D-F3 the piece on the followed direction, D-F4, D-F5, D-F6, D-F7, D-F8); `followMs` 200 | §12 of `CAMERA_FOLLOWS_GIZMO.md`; D-H20 |
| P12 | The edge turn: none / a quarter / a half by the edge left; the gizmo waits while it runs; at his pace, 360 – 520°/s; with the calm | R2, R3, D-H6, D-H7, T4, T5 |
| P13 | The dy hold after a turn over 90° the dy made, by close in's functions; elsewhere the logic's crossing (OP8) — never touched | D-H8, D-T4, `DY_HOLD_REVERSAL.md` |
| P14 | Every realignment paid by his finger's mm, never by time; a pace closes only a gap a change opens | lessons rows 6, 9, 10 |
| P15 | No layer that undoes what the logic decided; one owner per thing; after a second fix round on a join, stop and study | memory rule (11-19); row 2 |
| P16 | Never reopen the gizmo's travel; the MODEL's space; no 3D orientation widget; patent-free methods, each named | the common brief; D-T7 |
| P17 | Close in as approved: the square camera, the tilted pole, the carried up and its framing (J), the piece's slide at a change | lessons §3; `ba369aa` |
| P18 | The gates are his symptoms, counted as he names them, at his pace | row 8; §5.3 |

**The conflicts, and which wins:**
* **P2 against P17.** Close in's approved picture is NOT gravity-upright everywhere: on `Scene_0bis` close in (his two stretches, `h3c_*`) the drawn up
  is off the turntable's (gravity's) by p50 1.2 – 1.3°, p90 5.4 – 22.5°, max 171 – 178°, over 5° on 11 – 27 % of frames (`rd_roll.mjs`). **P17 wins
  close in** (*"at least as 1.0.147-"*, the SOLVED list). P2 binds as: the picture adds no roll of its own, and every hand-over of the up is his mm.
* **P3 against P17 / P12.** Close in has its own smoothing (the look point 120 ms, the gizmo 45 ms) and its turns run on the logic's clock, which the
  gizmo waits on (T5). A 200 ms spring over it lags the drawn turn behind that clock — the gizmo released before the camera caught up. **P3 bent**:
  one smoothing per regime, the far spring faded out by place (§4.2); no pace layer (P15) — the frame's step a gate (D-P7).
* **P6 against P12 / P13 and the finger.** His D-H3 makes the gizmo wait for the PICTURE's turn far out, D-H8 holds after it, and in a spit the finger is
  read on the drawn glass (`zoneFinger` on `asmCamLast`, by design). **Bent**: the picture writes nothing into the logic; the logic READS three facts
  it publishes from last frame (§4.4). Lessons rows 3 – 4 (*"holds never depend on the picture"*) are kept in their reason: the turn's moment is a
  facet change of the logic's map (decided, never paced by the view), so row 3's deadlock and row 4's late hold cannot occur.
* **P8 against P11 (D-F1, D-F3) on a level face.** At the latch the follower looks down at its 60° cap while close in looks square at the face (on
  `Scene_1`'s top 16.5 – 27.6° apart p50, up to 42 – 85°), and the drawn piece hangs on the follower's line, not the logic's. The gap must be paid
  somewhere, by his finger: D-P3. ⛔ Holding the follower's pose through the approach (D-H22) leaves the drawn piece off the logic's at contact.
* **P5 against P4.** Below 50° of the orbit's world elevation a pure dy may yaw by the calm (as on `de4a10e`): D-H19's band decides (`TOP_BOTTOM_STUDY.md` §9).

## 3. Part 2 — the obstacles, each reproduced before it is named
**The writers of what is drawn** (read in the code; `green_box_wiring.ts` l.1026 – 1099 is the camera's stage):
`cameraOrbitStep` (the logic's camera angles, catch-up 120 ms) → `cameraPlaceNow` → `spitStep` → `cameraFrameNow` → `assemblyCameraFrame` (the
logic's direction and up: the calm, the square camera, the tilt's `map`, the spit's carried heading; writes `st.asmCamLast`) → the eye behind the
piece about the look point (`asmLook`, `LOOK_TAU_MS` 120, `lookShare`) → `askedDir` / `levelledAsked` → **either** `followFrame` (far: `followStep`
or `followTopStep`, `followPose`; moves the drawn piece, writes `asmCamLast`, `asmRollShadow`, `asmEdgeHold`, `seamRebase`, resolves `asmChange`)
**or** `rollPictureFrame` (`freeTurnMaxDeg` 0: `zoneMixPose`; law U `uprightPictureFrame`; FO3 S1's gap; by default `carriedFrame`: resolves
`asmChange` (`changeSeen`), `zoneMixPose` → `poseFramingTwo` / `poseAboutPiece` on the logic's turn `asmZoneMix` (its clock: `zoneStep`,
`seamTurnFrame` held by `tiltPendingStep`, `seamOutFrame`), `upCarried` φ, J's `framingStep`; writes `asmCamLast`, `asmEdgeHold`, `asmSpitPic`) →
`upSquareToView`. Upstream targets: `squareFrame` (`sq.q`), `calmFrame`, `supportFrame` / `liftOf`, `footOf`, `gizmoEaseMs`, `asmDirEase`.
**Far out the follower draws every frame of his ten** (9 274 far frames on `f5e35c3`, no hand-over: `rd_drawer.mjs`): the boundary is the latch only.

**O-1 — close in's jumps at the approach's end: the pending turn's two-target framing. REPRODUCED, ROOTED.** *Recording* `h5_c0_s1top_approach_60_px5`
(`cameraFollower` 0, cycle 1, `rd_r1a.mjs`): at the latch (f367) the tilt is made, the turn `mix` 3 starts PACED (`byMm`, k = 0, rule 1 = two framed)
and stays at k = 0 (no orbit mm); the square camera's share 0. The camera then slides sideways (x 0.10 → 0.64 m) at 0.7 … 2.2, 5.6, 12.9° a frame
while the gizmo is still; at f378, the piece 3 mm above the gizmo, **32.2°** back onto the line (camera (0.09, 1.79, 0.21)); still after. Backing out,
f459 **35.9°** off the line again, then back by 0.65 m. On the default (`h5_f5_*`) the same at f376 – f377 (**32.7°**, then **48.5°**) and f462
(**35.2°**). *Offline* (`framing_sim.ts`, the pure functions, f366's pose, the recorded heights): the aim held, the camera tilts 86.8 → 74.5° over the
approach (the drift alone); the aim converging to the gizmo, it slides to x 0.73 at 7.1, 20.3° a frame, then `poseFramingTwo` is NULL (piece – aim
15 mm < rA·sin α 41 mm) and the turn about the piece puts it back: **40.2°** in one frame, onto **(0.09, 1.79, 0.21) — the recorded camera**.
*The root*: the framing holds two glass places and the piece's distance while the approach moves the piece ALONG THE VIEW onto its aim — an ill-posed
solve (no triangle under rA·sin α), chosen once at the turn's first frame (`zm.rule`, a glass-separation threshold of 0.06°) and kept. His rule P8
asks the orientation KEPT: held orientation with the piece moving along the view is a pure dolly — what `poseAboutPiece` gives at k = 0. *Smoothing:
a mask* (the target swings 30 – 50° and comes back). *Fix at the source*: close in, every turn turned about the piece (D-P2). *Fallback*: none needed.

**O-2 — the latch: the drawn piece leaps. REPRODUCED.** `h5_f5_*` f366 → f367: the piece z −0.117 → 0.191 (a 314 mm step against 145 mm of approach
in `c0`): the follower stops hanging it on its direction (D-F3) and the logic's piece is on another line (the cap vs the square view, P8 / P11); the
pending turn starts from the follower's pose and the framing re-solves round the moved piece — **23.2°** of view, 23.1° of up in one frame. *Root*: two
drawers with two directions for the piece. *Smoothing*: a mask (a 300 mm piece leap eased is still a leap). *Fix*: the target blend before the latch (D-P3).

**O-3 — the follower's return: the spin and the drift. REPRODUCED.** `h5_f5_*` f479 → f492: the way out's turn (`mix` 4, `out`) ends at the logic's far
pose (look-down 86.6°); at f480 the follower restarts at rest on the piece's direction (`followStart`) with the WORLD up squared to an 87° view — the
heading of the view's 3° residue: **up 94.0°** in one frame, then 48.6, 32.5, 12.3 (≈ 190° in 4); then its spring pulls the view down to its cap,
87.3 → 65.6° by f492, by time (§9 of `TOP_BOTTOM_STUDY.md`: 25°). With `cameraFollower` 0 both go. *Root*: the restart keeps the drawn DIRECTION, not
the drawn UP; and the way out aims at a pose the follower will not keep. *Fix*: the up's heading carried from the drawn up; the way out's target the
follower's own (D-P3, D-P5). *Fallback*: none.

**O-4 — A, B, point 2 (`Scene_0bis` far out). RE-RUN, as H5.** `rd_a2.mjs` on his ten: on the tip triangles the camera turns toward the tip p50
57 – 73° on `de4a10e`, 3 – 30° on `f5e35c3` (the calm asked 61 – 88°); `rd_g1.mjs`: exits off the level face with a camera leg not asked 2 of 16
(`de4a10e`) against 7 of 15, triangle crossings 8 % against 22 %. Root (H5 §8): H2's levelled reading in the spit's frame. Fix: D-H19 inside the far
target (R5). *Smoothing*: a mask (the reading jumps 90 – 180°).

**O-5 — point 3, far out rougher than close in. RE-RUN at 120 ms.** `rd_p3c.mjs`, `ilmj_23s`: far, the view's step p50 4.45°, its roughness p90 3.29°;
close in, the view held (p50 0.00°), turning only in timed turns. Decided: `followMs` 200 (close in's roughness offline, `p3_filt.ts`). Here the
smoothing IS the root fix: far out the picture owns its pose and the logic gives a target (D-F6).

**O-6 — far out on a level face the approach slides the piece across the view** (read, H5 §8 point 5: the foot laid along the logic's direction, the
camera along the follower's — sin(gap) of each mm, 0.28 – 0.46, on level faces only; on a side a pure dolly, 0.00°). Not run here. Fix: D-P4.

**O-7 — two "ups shown"** (H4 O-c, reproduced there: the follower's hold read on the LOGIC's up, 64 of 157 half turns on his ten). `asmCamLast` has
two writers (the logic's frame, the picture). Fix: two named records, each reader naming its own (§4.4).

**O-8 — the picture writes into the logic** (read): `followFrame` writes `asmEdgeHold` and calls `seamRebase` (every angle state set), `carriedFrame`
writes `asmEdgeHold`; both resolve the logic's asked change. Fix: §4.4 — one resolver, the logic's own owners write their state.

## 4. Part 3 — the design: ONE picture, one owner per thing
### 4.1 The function
`pictureStep(state, in, dtMs) → { eye, look, up, piece, published }` — pure, `src/input/picture.ts`; `src/render/picture_wiring.ts` holds the state and
the call, at the camera's stage in place of the `followFrame ?? rollPictureFrame` line. The state: the follower's direction and speed (or D-H13's two
followers), its carried heading ψ, the edge turn, the up hand-over's share, the last drawn frame. **Never dropped**: it runs at every distance.

| in (read-only, last computed by the logic this frame) | what for |
|---|---|
| the asked direction `askedDir` and D-H19's reading (the far target, the top rule) | T_far |
| the logic's shown direction `us` (`dirAt`) and its camera pose G — close in's, with its own timed turns, square camera, carried up and J | T_close |
| the approach's place `ap`, the latch, the pending, the blend's mm (`asmBlend`), the way out's share (`asmZoneMix.out`) | w, the up's share |
| the look point `asmLook`, the gizmo's foot, the hang, the gap, the owner's offsets | the eye (`followPose`'s rule) |
| the gizmo's facet (model), his finger's mm this frame, the dy sign | the edge turn (H2 / H3, D-H13 – D-H16) |

### 4.2 The direction: one spring, one target, faded by place
* **T = slerp(T_far, us, w)**, the spring `sphereSpring` (Lowe, *Game Programming Gems 4*, 2004) with τ = `followMs`·(1 − w): far out exactly today's
  follower (w = 0); at w = 1 exactly the logic's direction, no second ease over close in's.
* **w — the band (D-P3 (a))**: a smoothstep of the approach's place over the last `pictureBandMm` (10 mm, a slider: his `tiltBlendMm` figure) of his
  approach finger before 0.65 m (`ap` is linear in his finger: `approachInput`, da = mm × `orbitDvPerMm`). Whole at and inside 0.65 m, so both the
  latch (0.6) and the unlatch (0.65) happen at w = 1: neither draws anything new. A function of place: the same place, the same picture, either way.
* On a side face T_far and `us` agree at rest (the hand-over's step 0.1° on `Scene_0bis`'s sides, `TOP_BOTTOM_STUDY.md` §8 point 5): the band
  changes nothing. On a level face it pays the cap's gap (≈ 25° on `Scene_1`'s top) as ONE pitch over his last 10 mm of approach, the piece staying on the view's line.

### 4.3 The up: one rule, handed over by his finger only
* **Far (not latched, the band included)**: the turntable's — the meridian of the carried heading ψ (no roll term exists; at a near-vertical view ψ is
  the state, never the view's residue). The logic's up never enters far out, nor in the band (P6, K12).
* **In (the latch)**: the up drawn is HELD (P8), then blended to G's by his orbit mm (`blendShare`, `tiltBlendMm`; whole at the first edge crossed —
  `blendCrossed`), the same share the square camera takes today.
* **Out (the unlatch)**: the way out's share (C3: his out mm, the gizmo free) blends G's up toward the turntable's at the drawn direction, ψ SET at
  its start from the drawn up (bumpless — Åström & Hägglund, *PID Controllers*, 1995), his out mm closing what is left: no spin (O-3); no drift (w = 1
  there: T is the logic's direction; the band brings the cap back by place as he backs out).
* **Close (latched)**: G's up — the carried up, its band 15 / 50, J's framing — as approved (P17).

### 4.4 The turns, the wait, the hold — and what the logic reads
* **Close in**: the logic's timed turns (T5) as today, drawn at w = 1 with τ = 0, so the picture has caught up exactly when their clock ends — the
  gizmo's wait reads that clock, as now. ⭐ **Every turn of G — close in, and the way out at w = 1 — turned ABOUT THE PIECE** (`poseAboutPiece`;
  D-P2): close in the aim is the gizmo by the piece, a few degrees apart on the glass — the two-target framing's purpose (the assembly kept on the glass far out, 2026-11-14) does not arise,
  and its solve is ill-posed under an approach (O-1). Far out the follower draws (no logic turn is drawn): the framing has no user left.
* **Far out**: the edge turn is the picture's one turn object (H2 / H3, amended by D-H13 – D-H16), at his pace clamped by his 520°/s — that turn's own
  pace, not a layer.
* **Published, last frame's, read-only** (the logic reads; the picture writes nothing): (1) `asmCamDrawn` — the drawn frame (the finger in a spit;
  a turn's start pose `poseShown`); (2) the turn bit — the gizmo waits (`tiltClampStep`), and the logic itself rebases its angles at the turn's start
  (F-3 moved to its reader); (3) the turn's start event — its angle, the dy that crossed — from which the logic's hold code writes `asmEdgeHold`
  (`holdAtCrossing`, D-H8; read on the drawn up, D-H16). The logic's own frame is `asmCamLogic` (renamed from `asmCamLast`; every reader named).
* **The change of frame the logic asks** (`asmChange`): resolved ONCE, in `picture_wiring.ts`: latched → close in's rule (`changeSeen`, timed); else at
  once (D-F4). One resolver for both regimes (RB1's one place).

### 4.5 Prior art (methods textbook and old; ⚠ not a legal opinion — `CAMERA_FOLLOWS_GIZMO.md` §8's table stands)
The critically damped spring (Lowe 2004, kept); the orbit camera as heading + elevation with a world up — the turntable (Haigh-Hutchinson, *Real-Time
Cameras*, 2009, the "orbit" and its pole handling; every 3D package's turntable mode); camera behaviours blended by a scalar of the player's place
rather than switched (Haigh-Hutchinson's interpolation between camera hints); bumpless transfer on a still target (Åström & Hägglund 1995); slerp
(Shoemake, SIGGRAPH 1985); the turn about the framed subject (`poseAboutPiece`, the eye a rigid function of the subject — the classic follow
camera). ⛔ Dropped close in: through-the-lens two-target solves (Gleicher & Witkin 1992; Lino & Christie 2012 / 2015) — ill-posed when the targets
converge in depth.

### 4.6 The inventory — every picture module and switch
| module / switch | today | the rebuild | when |
|---|---|---|---|
| `followActive`, `followFrame` (`cameraFollower`) | the far drawer, a predicate for the close one | replaced by `pictureStep` (its `followPose`, `sphereSpring`, `followTopStep` reused) | R3; switch deleted R6 |
| `followStart` | restart on the drawn direction | ψ from the drawn UP (O-3) | R3 |
| `rollPictureFrame`'s dispatch | the close drawer | gone: G is a target | R3 |
| `carriedFrame`, `upCarried` (C1, C4), J `framingStep` (`uprightCarried`, `uprightFraming`, `uprightAlignDegPerMm`, `uprightHalfHold`, `uprightMaxDegS`, band 15 / 50) | close in's roll | KEPT as close in's target (P17), its state run every frame | — |
| law U `uprightPictureFrame` (`uprightPicture` 1, `uprightCarried` 0), `uprightCloseIn` | a variant | deleted | R6 |
| FO3 S1's gap (`freeTurnMaxDeg` > 0, law U off; `roll_follow.followStep`, `rollFollowMs`) | a variant | deleted (`poseRolled`, `framedLine`, `twistAbout` kept: J uses them) | R6 |
| `rollShadowFrame` (`freeTurnMaxDeg` 0) | the shadow record | deleted with its path; the recorders read the picture's record | R6 |
| `poseFramingTwo` (`zm.rule` 1) | close-in turns' pose | unused close in (R2); deleted with `cameraFollower` 0 | R2, R6 |
| the detour (`poleDetour`, `polarStep`, `followCeiling`, `followFromDeg`, `followMaxDegS`; `followTop` 0) | `de4a10e`'s far heading | deleted once D-H19 is built and judged | R6 |
| `followTopStep`, H3's `followTurnOnJump` / `Finger` / `Rebase` | the far top rule | kept, amended (D-H13 – D-H16, D-H19); the 0 paths deleted | R5, R6 |
| `seamRebase` from `followFrame`, `asmEdgeHold` from `followFrame` / `carriedFrame` | picture writes into the logic | moved to their readers (§4.4) | R3 |
| `asmCamLast` (two writers) | | `asmCamLogic` / `asmCamDrawn` | R3 |
| `zoneMixPose`, `seamTurnFrame`, `seamOutFrame`, `zoneStep`, `tiltPendingStep`, `blendShare`, `squareFrame`, the calm, `asmLook` (120 ms), `gizmoEaseMs`, `cameraOrbitStep` | the logic's targets and clocks | kept, read | — |
**The order of deletion** (R6, after his look on R3 – R5): FO3 S1 and the shadow → law U → the detour (after D-H19's look) → `poseFramingTwo` with
`cameraFollower` 0 → the switches' 0 paths; each proven bit for bit with `pictureOne` 1 on every walk (the replay probe, as `CL1`).

### 4.7 The step plan — one switch `pictureOne` (0 = `620f227` frame for frame), each packet one builder, vectors red on mutants, one batch, his look
| packet | builds | its gates (his symptoms; at 60 frames a second 5 and 9.5 px a frame = 571 px/s, at 143 8.4 px a frame = 1 200 px/s) |
|---|---|---|
| R2 (C) | close in's turns about the piece (`turnFraming(closeIn)` pure; `framing_sim.ts` as the vector's fixture — red on the two-target rule) | the approach cycle on `Scene_1`'s top: no view step over 3° at the approach's end or leaving (today 32 – 48°, 35°); `Scene_0bis` close in (`h3c_*`): frames outside a turn within 0.1° of `620f227`, the aim on the glass within 0.02 half-glass in its turns; far out bit for bit |
| R3 (C) | `pictureStep` + wiring: the band, τ(w), the up's hand-overs, ψ from the drawn up, the published facts, one resolver, the record split | the approach cycle: no view or up step over 3° in any frame (today 23°, 94° up, the 22° drift), no leg ≥ 5° not asked in the 1 s after the unlatch; his ten and the S1 walks far out bit for bit outside the band; the gizmo's place, `asmMapQ`, `asmEdgeHold` per frame identical on every walk |
| R4 (C) | D-P4: the drawn foot along the picture's direction far out | the approach far out on `Scene_1`'s top: the piece's step across the view ≤ 0.5° a frame (today sin(gap) × the dolly); sides bit for bit |
| R5 (C) | the far target's top rule as he decides D-H13 – D-H19 | `TOP_BOTTOM_STUDY.md` §4's G-tip, G-BT, G-apex, G2; moves not asked (`rd_g1`) ≤ `de4a10e`'s (2 of 16 exits, 8 % of crossings); the far view's roughness p90 ≤ 1.1° (`rd_p3c`) |
| R6 (C) | the deletions (§4.6), after his look | every walk bit for bit with `pictureOne` 1 before and after |
After a second fix round on one packet: stop and study (row 2).

## 5. Part 4 — the audit
| rule / lesson row | against the design |
|---|---|
| P1 | kept — one function, never dropped; G, the square camera and the tilt are targets |
| P2 | bent — far out exact (no roll term), close in as approved (P17); every hand-over of the up by his mm |
| P3 | bent — one smoothing per regime, the far one faded by place; the view's step a gate, not a layer |
| P4, P5 | kept by R5 (D-H19's world band; the cap, the edge turn, the wait) — their costs `TOP_BOTTOM_STUDY.md` §9 |
| P6 | bent — writes nothing; three published facts read (§4.4) |
| P7, P18 | kept — `pictureOne`, the gates of §4.7, R6 bit for bit |
| P8 | kept — the orientation held at the latch, blended by his orbit mm; under the band it is already the logic's |
| P9 | kept — the way out by his out mm (C3); the distance switch untouched |
| P10, P16 | kept — the look point and the gizmo's eases untouched, nothing of the travel reopened, the model's space |
| P11 | bent — D-F1's 60° and D-F3 hold everywhere outside the band; within his last 10 mm before 0.65 m on a level face the view goes to the logic's |
| P12, P13 | kept — the turns and the holds as today; their writes by their own owners |
| P14 | kept — the band by his approach mm, the up by his orbit / out mm; the far ease is the one he approved (D-F6) |
| P15 | kept — close in's jumps fixed at the turn's pose rule; nothing undoes a decision |
| P17 | kept — close in's target is today's G, minus the framing's solve |
| row 1 | kept — far the turntable alone owns the roll, close the carried up; the hand-over his mm |
| row 2 | kept — this study follows H3's last round; the jumps rooted, not smoothed |
| rows 3, 4 | bent — the far hold reads the picture's turn EVENT (D-H8): its moment is the logic's facet change, never the view's |
| row 5 | kept — the cap far out, the tilted pole close in: one yaw a pass |
| row 6 | kept — τ fades by place, the clamp is the turn's own pace, the wait rebases (a hold holds) |
| row 7 | kept — far D-H19's world reading; in the band the logic's DIRECTION only, never its heading or up |
| row 8 | kept — the gates count the approach cycle as he described it, moves not asked, roughness |
| rows 9, 10 | kept — every hand-over reads his finger's own mm (the approach's place, `asmBlend.mm`, the out mm) |
| row 11 | kept far; close in the logic's pose is the target by his approval (T4 / T5: it changes only at edges) |

**The costs.** D-P3 (a): on a level face the view pitches ≈ 25° (on `Scene_1`'s top) over his last 10 mm of approach; a dx inside that band yaws a
view nearer the vertical than 60° (spin-like, as D-F1 avoids). D-P2: close-in turns no longer keep the aim exactly where the framing put it (a few
degrees; gated). D-P6: three reads from the picture into the logic, named. **What it cannot do**: remove the pass over the vertical's one yaw (row 5);
make close in gravity-upright near the vertical (P17); shorten the waits (45 % of his play on `Scene_0bis`, his clamp); prove the feel offline.

## 6. The decisions for his word
| # | the question | the recommendation |
|---|---|---|
| D-P1 | One picture function at every distance, its state never dropped; far ↔ close a change of target, never of drawer | yes |
| D-P2 | Close in's jumps (O-1): (a) every close-in turn turned about the piece; (b) only the pending's turn; (c) a smoothing or pace layer | (a) — the root; (c) is a mask |
| D-P3 | Where the level face's gap (the cap vs the square view) is paid: (a) the band — the view to the logic's over his last `pictureBandMm` (10 mm) of approach before 0.65 m; (b) D-H22 — the follower's pose held at the latch, blended by his first orbit mm, the drawn piece swung onto the logic's line by the approach before contact (the assembly slides behind it); (c) today's one frame | (a) — the latch and the unlatch invisible, the piece on the view's line, reversible by place; D-H22 superseded |
| D-P4 | Far out the drawn foot along the picture's direction (an approach a pure dolly on a level face too) | yes, measured first (R4) |
| D-P5 | The up: far the turntable of a carried heading; at the latch held, then his orbit mm; out by his out mm; ψ from the drawn up at a restart | yes |
| D-P6 | The picture writes nothing; the logic reads the drawn frame, the turn bit, the turn's start event; `asmCamLogic` / `asmCamDrawn` | yes |
| D-P7 | Rule (3) amended: one smoothing per regime; no pace layer; the gate "no frame over 3°" on the approach cycle, elsewhere the excess over the 33 ms before (D-H17) ≤ 5° | yes |
| D-P8 | The order R2 → R3 → R4 → R5 → R6, each behind `pictureOne`, his look after R3 and after R5 | yes |
D-H13 – D-H19 (`TOP_BOTTOM_STUDY.md` §6) enter at R5 as he decides them; D-H22 is answered by D-P3.

## 7. Owed runs (none run: no headless run while he tests) — from `../camera_follow`, one batch at a time
1. **The approach cycle** (R2, R3, R4), each build and `&pictureOne=0` (the identity to `620f227`): the kit's `follow/h5/drv_h5c.sh` line —
   `env FPS=60 TGT="T:0:90:*" SEQ="T" REPS=1 IN=osc OSCN=4 OSCPX=5 OSCIN=40 OSCOUT=40 URL="http://127.0.0.1:$PORT/?sceneIndex=1&idleOrbitOn=0$EXTRA" LPX=9.5 OUTJSON="$F.json" node scripts/probes/fast_walk_check.mjs`
   with `OSCPX=9.5` (571 px/s) and `FPS=143 OSCPX=8.4` (1 200 px/s) added; read by `r1/rd_r1a.mjs`, `h5/rd_p5c.mjs`, `h5/rd_p5d.mjs <rec> N 1`.
   ⚠ The 2 px runs of H5 did not build: find why first.
2. **His ten far and close** (R2 – R5): `STRETCHES=<kit>/hand/stretches.json OUT=<kit>/follow/r2/runs EXTRA="$Z" bash scripts/probes/hand_batch.sh r2 "ilmj_23s|60|far" "vyah_11s|60|far" "ilmj_23s|60|close" "vyah_11s|60|close"`
   (Z = "" and "&pictureOne=0"), then the ten (`drv_h3.sh`'s `ALL`); read by `r1/rd_roll.mjs`, `r1/rd_drawer.mjs`, `h5/rd_g1.mjs`, `h5/rd_a2.mjs`, `h5/rd_p3c.mjs`.
3. **The S1 walks and the holds** (R3, R5): `drv_h3.sh`'s G2 – G6 lines (`drv_h.sh` walks, `hold_walk_batch.sh r2hw base`) with the same EXTRA.
4. **`Scene_0bis`'s A, B, 2 walks** (R5): the kit's `follow/h5/drv_h5.sh`.
