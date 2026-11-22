# The picture's rebuild — THE STUDY (packet R1, 2026-11-21, branch `1.0.153-Picture_rebuild`, src = `620f227`)

> **Status: ⭐ DECIDED (2026-11-21, the owner on D-P1 – D-P8 as recommended: *"go ahead"*); R2 + R3 BUILT, DEPLOYED (main `ae456df` = `67d0473`) — ⭐⭐⭐ his look: *"the deploy is very good : this is the best implementation of the orbit so far"*; R4 closed (nothing built); R5 built (behind `pictureFarTop` 0); ⭐ R3-FIX rounds 1 + 2 built, gates PASS, DEPLOYED 2026-11-22 night** (§4.7). ⛔⛔ **His major finding on `ae456df` (2026-11-21, `Scene_0bis`, two videos): the gizmo stuck on a pole, far and close; large camera / piece jumps on a dy travel after a mix of dx and dy.** Read off his videos' HUD: the orbit's centre racing along the axis to the far apex (0.8 m in ≈ 25 frames), then pinned (`elev` 1.00 / 0.00 ⛔LIMIT) — his dy read as a move ALONG the axis. ⭐ **Reproduced (kit `follow/r3fix/runs_str`, free strokes from `../picture_repro` = `ae456df`'s code), R3's only — inside the band:** a dy stroke near the left tip carries the gizmo 0.22 m along the axis (`pictureOne` 0: 0.05), the drawn view looking down to 87 – 89°, its up past the horizontal (`up.y` −0.20); far out and deep close in identical. **Root:** the band blends two directions with DIFFERENT heading owners — the far follower's (world) and the logic's close-in one (on a spit: the SIDE of the axis) — nearly opposite on a spit, so the blend passes over the vertical; the finger is read on that drawn frame (the spit's swap past 60° looking down): dy → along the axis → a pole. ⛔ The far stall at 5.4 m (outside the band) NOT reproduced. Next: R3's fix round 1 — a short study first (one heading owner through the band; on a spit the far and close in agree on the side). Docs only up to here. ⭐ **Then R3-FIX BUILT** (`788085d`; R5 behind `pictureFarTop` 0, `3bad0b7`; the rule §4.3a, as built §8.5) — ⛔ gates owed. His four parts: the rules → the obstacles, each reproduced → a design from
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

### 4.2 The direction: one spring, one target, faded by place (⛔ amended by R3-FIX — §4.3a: the band blends the ELEVATION only)
* **T = slerp(T_far, us, w)**, the spring `sphereSpring` (Lowe, *Game Programming Gems 4*, 2004) with τ = `followMs`·(1 − w): far out exactly today's
  follower (w = 0); at w = 1 exactly the logic's direction, no second ease over close in's.
* **w — the band (D-P3 (a))**: a smoothstep of the approach's place over the last `pictureBandMm` (**10 mm** — ⛔ 40 tried and reverted 2026-11-21, §8.2; a slider: his `tiltBlendMm` figure) of his
  approach finger before 0.65 m (`ap` is linear in his finger: `approachInput`, da = mm × `orbitDvPerMm`). Whole at and inside 0.65 m, so both the
  latch (0.6) and the unlatch (0.65) happen at w = 1: neither draws anything new. A function of place: the same place, the same picture, either way.
* On a side face T_far and `us` agree at rest (the hand-over's step 0.1° on `Scene_0bis`'s sides, `TOP_BOTTOM_STUDY.md` §8 point 5): the band
  changes nothing. On a level face it pays the cap's gap (≈ 25° on `Scene_1`'s top) as ONE pitch over his last 10 mm of approach, the piece staying on the view's line.

### 4.3 The up: one rule, handed over by his finger only (⛔ amended by R3-FIX — §4.3a: the turntable of the DRAWN heading)
* **Far (not latched, the band included)**: the turntable's — the meridian of the carried heading ψ (no roll term exists; at a near-vertical view ψ is
  the state, never the view's residue). The logic's up never enters far out, nor in the band (P6, K12).
* **In (the latch)**: the up drawn is HELD (P8), then blended to G's by his orbit mm (`blendShare`, `tiltBlendMm`; whole at the first edge crossed —
  `blendCrossed`), the same share the square camera takes today.
* **Out (the unlatch)**: the way out's share (C3: his out mm, the gizmo free) blends G's up toward the turntable's at the drawn direction, ψ SET at
  its start from the drawn up (bumpless — Åström & Hägglund, *PID Controllers*, 1995), his out mm closing what is left: no spin (O-3); no drift (w = 1
  there: T is the logic's direction; the band brings the cap back by place as he backs out).
* **Close (latched)**: G's up — the carried up, its band 15 / 50, J's framing — as approved (P17).

### 4.3a ⛔ Amended by R3-FIX (fix round 1 on R3, 2026-11-21 night — the lead's finding on `ae456df`, `03cd142`; rule 4 amended by the lead from his third video)
**The result first.** The drawn direction is a HEADING and an ELEVATION, each with ONE owner at every moment. Not latched — far, the band, between the band
and the latch, through every logic turn, the way out — the heading is the follower's and the band moves the elevation only: the view never passes over the
vertical, and the finger is never read on a frame drawn from another heading. Latched, G draws. At each change of owner (the latch, the unlatch) the pose
drawn is HELD — its heading, its elevation, its up — and his finger closes the gap.
* **The root.** R3's band slerped the follower's direction (a world heading) toward the logic's `us` (on a spit: the SIDE of the axis) — nearly opposite
  there, so the blend passed over the vertical (87 – 89° down, `up.y` −0.20) and the finger, read on that frame (`zoneFinger` on `asmCamDrawn`), went along
  the axis → a pole. Second part (his third video: the camera 2.4 m from its centre, in the band, a stream of the logic's turns): every logic turn not latched
  (`asmZoneMix`) made `followActive` false, so R3's close branch drew — the follower PARKED (`followStart(T)` every frame, T from a reading that flips)
  blended with the logic's turning G by w: jitter at every turn.
1. **Far, the band included**: the heading the follower's (`headingOf(dFar)`, never blended by place); the elevation lerp(el(dFar), el(`us`), w); the eye,
   look and piece by the follower's own rule at that direction (`followPose`). w 0, nothing held: the follower's own pose objects (bit for bit, as R3).
   ⭐ R3's residual toward G's eye (`bandEye`: the logic camera's catch-up and its heading) is no longer drawn — it carried the logic's heading by place.
   Equal headings and no residual (`Scene_1`'s fixture): R3's poses exactly.
2. **Between the band's inner end and the latch** (w = 1, not latched): the same — the follower's heading at the logic's elevation (no longer G whole).
3. **The latch**: G draws. A turn of G started at the latch frame starts from the pose DRAWN (`poseShown`: last frame drawn far and the latch on → the
   camera drawn — already so after a frame the follower drew, now also after one drawn through a logic turn). ⛔ **Found in the code**: in a polar zone (the
   spit included) no tilt is made (`tiltOn` returns in `asmZone`), so NO turn starts at the latch and G is the zone's pose at once (the spit: the side's
   heading). ⇒ the picture's own hand-over (5.), as the up's already was: G = the drawn pose, then his orbit mm.
4. **The way out — as amended by the lead**: not latched, the FOLLOWER draws through every logic turn (`asmZoneMix`, the way out's included; the square
   camera's share; a tilt turning off): its state runs on, never parked, never restarted; rule 1's pose. The logic's turns run on their own clocks — the close
   drawer still runs for them, not drawn (`zoneMixPose`'s angle, `zoneStep`, `seamOutFrame`), and the resolver (`changeResolve`) is unchanged, so the gizmo's
   waits and the holds stay the logic's. The follower's own rule comes whole (its edge turn holds the gizmo and writes its dy hold, as far out). The way out
   after the unlatch = the hand-over from G to rule 1's pose by the way out's own share (`asmZoneMix.out`'s k: his out mm, C3), else by his finger's mm over
   `pictureBandMm`. `followPark` only in the close branch (latched).
5. **The hand-over (one, for the whole pose)**: at each change of owner the drawn view's own heading (its up's only when exactly vertical — amended
   while building, §8.5) and elevation are held as offsets from the new owner's, and the up's φ about the view. The owner's pose is turned by the offsets left —
   about the world vertical, then about the horizontal axis square to the heading (the elevation kept within ±89.5°); the eye and the up about the look
   point, the piece about the foot — never a slerp across the vertical. One share closes all three: latched the square camera's (`blendShare`; 0 while
   pending), the way out its own, else his mm. A turn of G that starts from the drawn pose leaves offsets ≈ 0.
   ⭐ **Decided by the lead (his rule, C4), 2026-11-21 night**: at the latch the hand-over is paid by his orbit finger at his own realignment pace — never
   faster than `uprightAlignDegPerMm` (3°/mm) nor than `tiltBlendMm` (10 mm): share = min(1, mm / max(`tiltBlendMm`, gap° / `uprightAlignDegPerMm`)), the
   gap (the larger of the heading's and the elevation's, between the pose drawn held and G) read once at its start; a 180° gap: 60 mm. Where the square
   camera's own share already keeps that pace (its smoothstep's peak 1.5 × gap / `tiltBlendMm` ≤ 3°/mm: a gap ≤ 20°, as wherever a turn starts from the
   pose drawn — `Scene_1`) it is kept as it is: nothing changes there.
6. **The up**: not latched the turntable's of the DRAWN heading — outside the 20° cone the world's up (its literal), inside the meridian of the follower's
   heading plus the heading offset held (from the view's own at the cone's edge); latched G's, turned by the offsets. After a latch the follower's heading
   is the one drawn when the way out ends: the up turns there by the share (the f480 vector amended), never at once.
⭐⭐ **Round 2 (2026-11-21 night, decided by the lead — his rule *"minimize the camera movements while maintaining the key rules"*).** Measured on round 1
   (`4f34c7a`, kit `follow/r3fix/runs_gate/str_*`): the band's outer part on `Scene_0bis` drifts 0.05 m along the axis, as the old build; deeper in the
   band (ap ≈ 0.67) the view goes 81 – 88° down (the logic's elevation, by rule 1's lerp) and past 60° looking down the spit's finger swap (`zoneFinger` →
   `fingerSwapped`) turns his dy into a move along the axis: 0.25 m (old build 0.05). **Root: two payers of one gap on a spit** — the band paid the
   elevation by place, and the latch's hand-over (C4) paid heading AND elevation by his orbit mm, because a polar zone has no pending turn at the latch.
   **The rule:** the band's elevation share is w ONLY where the latch starts G's pending turn — not in a polar zone (`asmZone`, the spit included); in a
   polar zone it is 0: the far elevation kept until the latch, the latch's hand-over (C4) the one payer. `Scene_1` (no zone) unchanged.
7. **R5 behind its own switch `pictureFarTop`** (0 by default — the lead: its gates unfinished, its far strokes on `Scene_0bis` pin the gizmo at a pole,
   `runs_str5/r5_farmix`; 1 = R5 as built); `farTopDecided` requires it.
⭐ Identity: `pictureOne` 0 runs today's line, untouched (`620f227`). Far out outside the band with nothing held: the follower's own objects (R3's).

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
| R2 (C) | ⭐ **BUILT `83c5d9c` — gates RUN 2026-11-21, PASS** (§8; kit `follow/r2/drv_r2.sh`, `runs`, `rd_cmp.mjs`, `rd_turns.mjs`): `pictureOne` 0 = `3bc9d7f` frame for frame; far out (his stretches) bit for bit; the gizmo 0.000 mm on every run; close in outside turns identical; the approach cycle latched 0.0° at 5 / 9.5 / 8.4 px (id: 290 – 520°, max 28 – 48°); in turns the max view step 10.7 / 6.3° (id 7.6 / 18.0), up 10.7 / 10.4° (id 9.0 / 26.2). ⚠ R3's baseline: the held cap's gap moved to the unlatch (5.9 + 17.1°), the follower's return 118° of up in one frame (id 94°), the drift 87 → 62°. close in's turns about the piece (`turnFraming(closeIn)` pure; `framing_sim.ts` as the vector's fixture — red on the two-target rule) | the approach cycle on `Scene_1`'s top: no view step over 3° at the approach's end or leaving (today 32 – 48°, 35°); `Scene_0bis` close in (`h3c_*`): frames outside a turn within 0.1° of `620f227`, the aim on the glass within 0.02 half-glass in its turns; far out bit for bit |
| R3 (C) | ⭐ **fix rounds 1 + 2 (R3-FIX) BUILT `788085d`, `4f34c7a` (the spit's latch at his C4 pace), `6c2b8a6` (round 2: no band in a polar zone) — gates RUN 2026-11-22 night, PASS** (kit `follow/r3fix/runs_gate`, `runs_gate2`; `r3fix/rd_stuck.mjs`, `r2/rd_cmp.mjs`, `r3/rd_sum.mjs`): `pictureOne` 0 exact; his ten far and the eleven S1 walks bit for bit; close within 0.06° / 2 mm of R3; `Scene_1`'s approach cycle as R3 (largest view 5.9 / 11.3 / 10.1°, today's 34 – 48°); ⭐ his `Scene_0bis` free strokes in the band (HALFN 9, 11, the mix) IDENTICAL to the old build — no tumble, no race along the axis (R3: the view 87 – 89° down, `up.y` −0.20, a dy 0.22 m along the axis); the spit's latch (an approach cycle at the left tip) ≤ 3.4° a frame (old build 31.8°); the dy holds identical (§4.3a, §8.5: one heading owner, the band the elevation only; the follower draws through every logic turn not latched; one hand-over of the whole pose at the latch and the unlatch); R5 behind `pictureFarTop` 0 (`3bad0b7`). Before it: ⭐ **BUILT `ce5abfe`, `f5344b5` (band 10 mm, `d758976`) — gates RUN 2026-11-21, PASS** (kit `follow/r3/drv_r3.sh` → `runs`, `drv_r3c.sh` → `runs_c`; `r2/rd_cmp.mjs`, `r3/rd_sum.mjs`, `r4/rd_slide_pd.mjs`): `pictureOne` 0 = `3bc9d7f` frame for frame; his ten far and the eleven S1 walks bit for bit; close in within 0.02 mm / 0.01° of R2 (the gizmo 0.021 mm: R3b's reader order), identical outside turns; the dy hold walks' holds, blocks and releases identical (z_close starts 45 mm apart: it begins in the band); the approach cycle (4 cycles) the view 290 / 276 / 273° in all (today 1 104 / 767 / 896°), its largest frame 5.9 / 11.1 / 9.7° (today 48.5 / 44.5 / 34.5°), the up 7.2 / 13.1 / 9.7° (today 105 – 123°) — ≈ 4.4° per mm of his finger at the band's steepest (its mean 2.7°/mm; his C4 3°/mm); no spin, no drift; the DRAWN piece within 15.2° of the view at 143 (as today), its step ≤ 3.4°; `Scene_0bis`'s side approach within 3.2° of today in the band, the same largest steps. (§8.2: the band on the follower's output — amended —, the up's hand-overs, ψ from the drawn up, the follower parked, the published facts, one resolver, the record split) `pictureStep` + wiring: the band, τ(w), the up's hand-overs, ψ from the drawn up, the published facts, one resolver, the record split | the approach cycle: no view or up step over 3° in any frame (today 23°, 94° up, the 22° drift), no leg ≥ 5° not asked in the 1 s after the unlatch; his ten and the S1 walks far out bit for bit outside the band; the gizmo's place, `asmMapQ`, `asmEdgeHold` per frame identical on every walk |
| R4 (C) | ⭐ **CLOSED 2026-11-21, NOTHING BUILT — measured** (kit `follow/r4/CHECKPOINT_R4.md`, `rd_r4.ts`, the drawn piece `sh.pd`): far out (w 0) the piece slides 0.45 – 0.59° a mm of finger on `Scene_1`'s top against 0.58 – 0.64° on `Scene_0bis`'s side — the top NO worse than a side; the foot does not move far out (0.00 – 0.05 mm a frame: on the top `us` is the face's normal at the cap); the slide is his camera offsets' (`cameraYawOffsetDeg` 2.5, `cameraPitchOffsetDeg` 2: the view 3.2° off the followed direction, every face) plus the look point's ease (`lookShare`), partly cancelling on the top — §3 O-6's sin(gap) premise not in the frames. The lead, by his rule: the gate restated *the top no worse than a side, per mm*, met today; his offsets kept (his 2026-10-01/05 words). D-P4: the drawn foot along the picture's direction far out | the approach far out on `Scene_1`'s top: the piece's step across the view ≤ 0.5° a frame (today sin(gap) × the dolly); sides bit for bit |
| R5 (C) | ⭐ **BUILT `1eca57d`, `af17b7d`, `ca21d0a`, `4ee392e` — gates owed**; ⛔ since R3-FIX behind its own switch `pictureFarTop`, **0** by default (`3bad0b7`, the lead) (§8.4): the far target's top rule as decided — D-H19 the reading in the world, D-H15 the jump by geometry, D-H13 + D-H14 two followers and the derived leash (104°), D-H16 the hold on the drawn up; **2317** vectors | `TOP_BOTTOM_STUDY.md` §4's G-tip, G-BT, G-apex, G2; moves not asked (`rd_g1`) ≤ `de4a10e`'s (2 of 16 exits, 8 % of crossings); the far view's roughness p90 ≤ 1.1° (`rd_p3c`) |
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
D-H13 – D-H19 (`TOP_BOTTOM_STUDY.md` §6) enter at R5 — ⭐ DECIDED 2026-11-21 by his rule *"Do what minimize the camera movements while maintaining the
key rules (calm, etc.)"*: D-H13 – D-H17 yes (D-H14 tied), D-H18 (a) left as is, D-H19 yes, D-H21 yes (`TOP_BOTTOM_STUDY.md` §6); D-H22 is answered by D-P3.
⭐ **His word (2026-11-21): *"go ahead"* — D-P1 – D-P8 DECIDED as recommended**, R2 first; the owed runs (§7) one batch at a time when he frees the PC.
⭐ **His word (2026-11-22)** on the handover's list: R5 ON — `pictureFarTop` **1 by default** (*"set the slider default to 1"*; its far pole pin on
`Scene_0bis` not studied, §4.7's R5 row); **R6: *"proceed"*** (§8.6); D-R1 (`TOP_BOTTOM_STUDY.md` §10) kept as a future improvement, not built; then a
deploy, and the merge into the main folder prepared for his word.

## 7. Owed runs (none run: no headless run while he tests) — from `../camera_follow`, one batch at a time
1. **The approach cycle** (R2, R3, R4), each build and `&pictureOne=0` (the identity to `620f227`): the kit's `follow/h5/drv_h5c.sh` line —
   `env FPS=60 TGT="T:0:90:*" SEQ="T" REPS=1 IN=osc OSCN=4 OSCPX=5 OSCIN=40 OSCOUT=40 URL="http://127.0.0.1:$PORT/?sceneIndex=1&idleOrbitOn=0$EXTRA" LPX=9.5 OUTJSON="$F.json" node scripts/probes/fast_walk_check.mjs`
   with `OSCPX=9.5` (571 px/s) and `FPS=143 OSCPX=8.4` (1 200 px/s) added; read by `r1/rd_r1a.mjs`, `h5/rd_p5c.mjs`, `h5/rd_p5d.mjs <rec> N 1`.
   ⚠ The 2 px runs of H5 did not build: find why first.
2. **His ten far and close** (R2 – R5): `STRETCHES=<kit>/hand/stretches.json OUT=<kit>/follow/r2/runs EXTRA="$Z" bash scripts/probes/hand_batch.sh r2 "ilmj_23s|60|far" "vyah_11s|60|far" "ilmj_23s|60|close" "vyah_11s|60|close"`
   (Z = "" and "&pictureOne=0"), then the ten (`drv_h3.sh`'s `ALL`); read by `r1/rd_roll.mjs`, `r1/rd_drawer.mjs`, `h5/rd_g1.mjs`, `h5/rd_a2.mjs`, `h5/rd_p3c.mjs`.
3. **The S1 walks and the holds** (R3, R5): `drv_h3.sh`'s G2 – G6 lines (`drv_h.sh` walks, `hold_walk_batch.sh r2hw base`) with the same EXTRA.
4. **`Scene_0bis`'s A, B, 2 walks** (R5): the kit's `follow/h5/drv_h5.sh`.

## 8. As built
### 8.1 R2 — close in's turns about the piece (`83c5d9c`, 2026-11-21; ⛔ gates owed: §7 items 1 and 2, no headless run made)
* **The switch** `pictureOne` (1 on this branch; 0 = `620f227` frame for frame), the rebuild's one switch (R3 – R5 extend what 1 does); its slider in ORBIT ›
  CAMERA FOLLOWER, next to `cameraFollower` (`TUNING_MENU.md`).
* **The predicate: the automatic tilt's latch** (`st.asmTiltAuto`: the approach within `tiltAutoM`, 0.6 m, of the gizmo; off past 0.65 m), read at the
  turn's FIRST frame and kept. Why: it is close in's one distance switch, whatever `cameraFollower` is. ⛔ "The follower not drawing" would take every far
  turn with `cameraFollower` 0 (none draws far out then), and every timed turn with it at 1 (the follower stops while one runs). ⛔ "`asmTilt` set" misses the
  close-in turns with no tilt (a zone's switch, the spit's crossing) and a tilt's exit (its turn starts after `asmTilt` is cleared).
* **The rule's home**: `src/input/orbit_tilt.ts` — `turnFraming(rule, closeIn, pictureOne)` (born close in with the switch on: 2, about the piece; else 0,
  the framing tried; a rule made is kept) inside `turnPose`, the ONE pose rule. Both drawers call it: `zoneMixPose` (a zone's turn, the tilt's) and
  `framedPose` (packet J's framing turn, `upright.ts`; `roll_shadow.ts` passes the latch). No other file calls `poseFramingTwo` or `poseAboutPiece` (a vector).
  The turn's clock still reads the turn about the piece's angle, as before.
* **Not changed**: a turn born outside the latch keeps the framing, null → about the piece, as today. That includes far out with `cameraFollower` 0, and the
  way out of close in (born at the unlatch). The way out belongs to R3's band (§4.4, "the way out at w = 1").
* **The vectors** (`tests/turn_framing.test.ts`, 9; the fixture is `framing_sim.ts`'s numbers): the old rule reproduces 7.1°, 20.3°, then 40.2° onto
  (0.09, 1.79, 0.21). With the switch on, close in: no view step over 3°, aim to the gizmo or held; the piece within 0.02 half-glass; a turn born close in
  stays about the piece when the latch drops; a turn born far stays framed. With the switch at 0, or far out: the old poses exactly. Mutants: the old rule
  → 3 red; the predicate inverted → 4 red; the choice re-made each frame → 2 red; the switch ignored → 2 red. ⚠ The 0.02 half-glass vector went red on
  none: at k 0 the framing holds the piece's place too. It is a guard, not a test of the change.
* ⚠ Inferred, not run: the logic reads `asmCamLast`, which is written from the pose drawn. During a close-in turn it now carries the turn about the piece.
  R3's published frame (§4.4) owns that split.
### 8.2 R3 — the one picture and the published facts (`ce5abfe` R3a, `f5344b5` R3b, 2026-11-21; ⛔ gates owed: §7 items 1 – 3, no headless run made)
**The result first.** With `pictureOne` 1 (and `cameraFollower` 1) one function draws at every distance. Far out outside the band it draws the follower
exactly. Over his last 10 mm of approach finger before 0.65 m it moves to the logic's pose by place, so the latch and the unlatch draw nothing new. The up
is handed over by his finger only, and the follower is never restarted. The picture writes nothing into the logic any more. With either switch at 0 the
camera's stage runs today's line (`followFrame ?? rollPictureFrame`), moved as written.

* **Where it is.** `src/input/picture.ts` (pure): `approachOutMm` (his approach finger's mm beyond 0.65 m), `bandShare` (w), `bandDir`, `bandEye`,
  `turntableUp` / `turntableFromDrawn` / `psiFromUp` (the up), `pictureStep` (the frame). `src/render/picture_wiring.ts`: `pictureFrame` (the one call at
  the camera's stage, `green_box_wiring.ts`), `pictureLegacy` (today's line), `changeResolve` (the one resolver), `publishDrawn`, `followPark`.
  `assembly_wiring.ts`: `approachBand` (w from the logic's own place), `pictureEventsRead` (the logic's reader), `zoneMixCam`. Slider `pictureBandMm`
  (10 mm, ORBIT › CAMERA FOLLOWER).
* **Far out, why it is bit for bit outside the band.** `followFrame` runs exactly as before: the same resolver, the same `followTopStep` /
  `followStep`, the same `followPose`, in the same order. Its pose then goes through a hook to `pictureStep`. At w 0, with no up held and the view
  outside the turntable's cone, `pictureStep` returns the follower's own eye, look and piece objects and the world's up literal. So `followFrame`
  publishes the same values. The far cap (60°, plus the owner's 2° pitch offset) stays 8° outside the 20° cone.
  ⚠ Two places where this does not hold: the detour (`followTop` 0, up to 80°) enters the cone, and a placed piece (`orbitPiecePlaced`) now gets the
  turntable's up instead of the carried up.
* **The pose.** Latched: G (the close drawer's) exactly. Not latched: w 0 is the follower, w 1 is G's eye, look and piece exactly. In between, the
  follower's direction is turned toward `us` by w (`bandDir`) and its eye by w of the remaining gap to G's eye (`bandEye`). That gap is the camera's
  120 ms catch-up and the offsets' heading. The piece stays on the view's line, and the drawn piece moves to the logic's.
  ⭐ **Amended (1):** the spec puts the band on the follower's TARGET, with τ = `followMs`·(1 − w). Built: the band acts on the follower's OUTPUT, with
  its spring unchanged. The ends are the same (w 0 today's follower, w 1 the logic's exactly, no second ease), and the picture is a function of place
  both ways (vector). With τ(1 − w) the lag differs going in and going out, and the drift by time comes back after a fast exit.
  ⭐ **Amended (2):** the band also draws through the way out. Its turn is G, and it runs over 12 mm of out finger (`tiltOutBlendMm`), more than the
  band's 10. Drawn as G alone, the follower's return after it jumped 28° in the fixture.
* **The up (D-P5).** Not latched (far, the band, the way out) the target is the turntable's: world up, or within 20° of the vertical the meridian of a
  carried heading ψ — whole in the cone's inner half, blended by place toward its edge. Latched the target is G's up. At each change of target the
  drawn up is HELD as an offset about the view (bumpless), then closed by his finger only. Latched it closes with the square camera's own share
  (`blendShare`, `asmTiltPending` / `asmBlend`). The way out closes it with its share (`asmZoneMix.k`, his out mm). Elsewhere it closes over
  `pictureBandMm` of his finger (orbit mm, approach mm outward). While latched, ψ is set from the drawn up every frame, so the way out starts from it.
* **The follower parked, never restarted (O-3).** While G draws, the follower rests ON its own target: the levelled reading, else the carried heading,
  at the asked height capped. Its top state sits at the gizmo's facet and the orbit's place now. Latched, the heading comes from the drawn up. Through
  the way out it is HELD: read from the view in the band, it fed back on itself frame by frame, a drift by time.
* **The way out born in the band is turned about the piece** (§4.4): `zoneMixPose` passes `asmTiltAuto || approachBand > 0` to `turnPose`, only with
  both switches on.
* **R3b — the readers of `asmCamLast`, re-pointed** (its value at each read is unchanged): the null checks in `seamTurnStart`, `turnBegin`, the ease's
  gap and `changeApply` → `asmCamLogic` (they run at the camera's stage, after the logic's frame, or ask only "a frame exists"). `freeEntry`'s heading
  and `zoneFinger` → `asmCamDrawn` (they run before the stage and read last frame's end value). `followTopStep`'s `upShown` → `asmCamLogic` (it read the
  logic's frame of this frame; D-H16 changes that at R5). `asmCamLogic` is written only by `assemblyCameraFrame`. `asmCamDrawn` is written only by
  `publishDrawn`: the drawer's own frame, else the logic's — exactly what `asmCamLast` held after the stage.
* **R3b — moves, not changes.** The drawers (`followFrame`, `rollPictureFrame`, `carriedFrame`, `uprightPictureFrame`, `zoneMixPose`) hand back their
  frame (`cam`) and their hold events (`ev`). The follower's crossing hold and its F-3 rebase, the carried up's hold and law U's half-turn hold are
  written by the logic's `pictureEventsRead`, right after the drawer, before anything reads them. `asmChange` is resolved once, before any drawer, by
  `changeResolve`. Where the follower draws it is applied at once; elsewhere it uses the carried up's rule or law U's, each moved as written. ⚠ The
  brief's "latched → close in's rule" is built as "the follower not drawing → close in's rule": that is today's split, and so the values stay the same.
* **The vectors.** `tests/picture.test.ts` (13): the band by place, the ends (w 0 the follower's objects and the world's up, w 1 G exactly), the turntable,
  the approach cycle, the same place either way, the f480 restart. `tests/picture_facts.test.ts` (6): one writer per frame, the readers, the drawers
  publishing, the reader's holds, the one resolver. All red on the old code (the modules and fields did not exist). Mutants, each red:
  - no blend (`bandShare` 0): the band's vectors and the cycle (27° in one frame);
  - the state dropped (`turntableUp` without its state): the cycle and the f480 vector;
  - the up from the residue (ψ = the view's heading): the same two;
  - w by time (in the fixture): the same-place vector;
  - a drawer writing the hold again, the drawn frame written by a drawer, `zoneFinger` on the logic's frame, the reader dropping the follower's hold:
    each red in `picture_facts`.
  `npm run verify`: 2290 (R3a), then 2296 (R3b) — up from 2277.
* ⛔ **A contradiction in the spec, for the lead.** At his pace the gate "no frame's view step over 3°" cannot hold with a 10 mm band on a level face.
  The band pays the cap's gap (≈ 27° on `Scene_1`'s top) over 10 mm of finger. At 5 px a frame (1.3 mm) that is a mean 3.5° a frame and a smoothstep
  peak of 6.0°; at 9.5 px (2.5 mm), 10.5° a frame (the fixture). The fixture passes at 0.5 mm a frame (view 2.3°, up 2.7°). A 3° peak at 2.5 mm a
  frame needs a band of about 34 mm. The gate is not bent: the slider is his.
* ⭐ **Resolved by the lead, 2026-11-21, by his rule** (*"Do what minimize the camera movements while maintaining the key rules (calm, etc.)"*): the approach cycle in the game (kit `follow/r3/runs_a`, `rd_sum.mjs`; 4 cycles) — the view's whole turn the same at 10 and 34 mm (290 / 276 / 273° against 258 / 259 / 248° at 5, 9.5 px a frame at 60 and 8.4 at 143; today's 1 104 / 767 / 896°), its largest frame step 5.9 / 11.1 / 9.7° at 10 mm against 1.9 / 3.3 / 3.1° at 34 mm (today's 48.5 / 44.5 / 34.5°), the up's 7.2 / 13.1 / 9.7° against 2.1 / 4.2 / 3.3° (today's 105 – 123°); the gizmo's path identical in all. ⇒ `pictureBandMm` **40 mm** by default (the peak ∝ 1 / width: ≈ 2.8° at his fast pace), the slider 0 – 100; the gate kept as written. Cost: the pitch starts 40 mm of approach finger before 0.65 m (≈ a third of `Scene_1`'s far approach).
  ⛔⛔ **REVERTED the same day (the lead's mistake):** the whole far approach of `Scene_1`'s top is ≈ **30 mm** of finger from its rest to 0.65 m (5 px a frame: 24 frames from `ap` 1.000 to the latch), so 34 / 40 mm reached the far REST — the far picture partly blended toward close in's everywhere: his ten stretches far and the eleven S1 walks no longer the follower's (from frame 6 – 8; the drawn height up to 7° above the follower's, the 60° cap D-F1 broken), while 0 and 10 mm are identical to `pictureOne` 0 there (kit `follow/r3/runs_b`). ⇒ **10 mm**, the design's (≈ 2.7° a mm, his realignment pace C4's 3° a mm); the gate amended by his rule: on the approach no frame's step over 3° per mm of his finger that frame, and none without his finger — the 3° a frame was a time figure (row 9: his finger pays, not the clock). A band that spreads the pitch further needs a share of each scene's far range, never mm beyond it: not built (it would break D-F1 wherever he rests).
* ⚠ **Inferred, not run:** the identity of R3b on his walks; the band's feel; the gizmo's place, `asmMapQ` and `asmEdgeHold` per frame (the moves are
  read in the code, and no reader sits between a write's old and new places).

### 8.4 R5 — the far target's top rule as decided (`1eca57d` D-H19, `af17b7d` D-H15, `ca21d0a` D-H13 + D-H14, `4ee392e` D-H16, 2026-11-21; ⛔ gates owed: §7 items 2 – 4, no headless run made)
**The result first.** With `pictureOne` 1 (and `cameraFollower` 1, `followTop` 1: `farTopDecided`) the far follower aims, turns and holds by D-H13 –
D-H16 and D-H19 as the lead took them by his rule ([`TOP_BOTTOM_STUDY.md`](TOP_BOTTOM_STUDY.md) §6). Close in, the gizmo's glide and travel and the calm's
own computation are unchanged. With `pictureOne` 0 the far follower is H2 / H3 exactly (`620f227`): the new code is reached only through `farTopDecided`.
No new slider.
* **D-H19, the reading** (`farReading`, `farReadingShare` in `input/camera_follow.ts`; `farAsked` in `render/assembly_wiring.ts`, called at the rig's
  angles for `asmAskLevel`): below 50° of the orbit's WORLD elevation (`st.orbit` in the world, his finger's place) the calm asked's own world heading
  (the direction asked's); from 60° H2's `levelledHeading`; a smoothstep between, on `cameraHeading`'s own constants (read, not copied); a level face
  carried at every elevation. On the kit's `band_sim.ts` fixtures: the tips 115.9 / 102.2 / 88.8° where H2 reads 180 / 180 / 0°; the bottom triangle's
  six cases within 2.4° of each other (H2: 0, 90 and 180°).
* **D-H15, the jump by geometry** (`farJump`, `followFarStep`; `farJumpRead` beside `farAsked`: last frame's calm asked kept IN THE WORLD in
  `asmAskCalmWas`, read again in this frame's F at these angles into `asmAskLevelWas`; both reset with the orbit's state). The jump is this frame's
  reading minus that one; a level face's side is the heading carried. A turn starts when the jump is at least `followTurnMinDeg` (10°), on any frame. Its
  angle is the whole gap from the heading drawn to the reading beyond, at his finger's pace clamped (F-2, 520°/s). The gizmo still waits on `top.turn`;
  F-3's rebase still runs at the start. The dy hold is still decided at the gizmo's facet change (over 90°: the crossing's own; a 0 writes none).
  ⚠ The record's `top.x` now holds the jump on every frame where it is read (H3 wrote it only at a facet change).
* **D-H13 + D-H14, two followers and the leash** (`FollowHead` in `top.hd`, `spring1`, `followLeashRad`): the heading follows the continuous reading,
  unwrapped (the reading's own motion each frame; a turned jump removed, one under the band paid by the follower). The elevation follows the asked
  height capped at 90° − `followPoleDeg` (60°) and is never drawn past the cap (a start above it eases down without rising). Both use τ = `followMs`
  (200 ms). The leash is `followTurnMaxDegS` × `followMs` = 104°, derived (none when F-2 is off, `followTurnFinger` 0). A turn pays an offset while the
  follower rests at its start, so nothing jumps. With no `hd` (a start, or the follower parked close in) both followers start at rest on the drawn direction.
* **D-H16, the far dy hold on the drawn up** (`camera_follow_wiring.ts`): `upShown` is `st.asmCamDrawn?.up`, the picture's own frame of last frame
  (published after the follower's step); `followTopStep` (`pictureOne` 0) keeps `asmCamLogic`.
* **The vectors** (`tests/camera_follow_r5.test.ts`, 19; pinned lines amended in `camera_follow_wiring.test.ts`, `orbit_state_reset.test.ts`), each red on
  a mutant: the share 0 (H2's reading) or read on F's pitch (tips, B, the band's ends); no level face carried; the old wiring lines; the jump a frame's
  difference (a vertical edge — H3 turns there at 900°/s at 60 frames a second and 1 620 at 143); the turn the jump alone (its end off the reading —
  H3 > 20° off); the jump 0, not wired, or last frame's calm not carried into the frame; no leash, a fixed 62.4° leash, the reading wrapped (over the top:
  the height ≤ 60°, after the stop ≤ 520°/s, nothing backwards — H3 over 60° and backwards; below 520°/s frame for frame the plain follower); the height
  not capped; the follower not at rest at a turn's start; the hold on the logic's up or on none. **2317** vectors (2298 before R5).
* **Where the build departs from the study, or infers** (none worked around): (1) the turn may start on any frame while the hold keeps H3's moment (the
  gizmo's facet change); on a side the calm's facet and the gizmo's are the same map place (`sh.t.stack`), but if the two ever changed on different
  frames the hold would not be decided — inferred. (2) If the continuous reading itself steps by more than the leash without a geometric jump (a zone's
  frame changing H2's reading above 60°, a seam rebase), the leash pulls the follower to 104° at once — not met in the vectors; the walks will show it.
  (3) The first frame with no calm kept reads no jump. (4) `proto.ts`'s figures were at τ 120 ms (leash 62.4°); built at 200 ms (104°), §6's note. (5) ⚠ (found 2026-11-22 evening, his PC
  records) the jump compares LAST frame's place's calm with this frame's — two places, not the two faces at one place: a pace threshold at the sides
  (the gizmo waiting at the edges) → D-H23, [`CAMERA_FOLLOWS_GIZMO.md`](CAMERA_FOLLOWS_GIZMO.md) §20.
* **Owed** (none run): §7 items 2 – 4, each with `&pictureOne=0` as the identity — the kit's `follow/h5/drv_h5.sh` walks (A tipdy, B botbt, 2 edgez /
  edgec, `Scene_1`'s top) at 60 and 143 frames a second, the S1 walks and holds (`follow/r3/drv_r3.sh`), his ten; read by `h5/rd_a2`, `rd_g1`, `rd_p3c`,
  `r3/rd_sum`; the gates in §4.7's R5 row.

### 8.5 R3-FIX — one heading owner (`788085d`; R5's switch `3bad0b7`; the C4 latch `4f34c7a`; round 2 `6c2b8a6`; 2026-11-21 night; ⭐ gates PASS, §4.7)
⭐ **Round 2 (`6c2b8a6`, the lead's decision by his rule):** round 1's gates passed but deeper in the band on a spit the view went 81 – 88° down (the band's elevation lerp to the logic's), the spit's finger swap past 60° turned his dy into a move along the axis (0.25 m) — two payers of one gap; now in a polar zone the band pays nothing (`polar: st.asmZone !== null`), the latch's hand-over at his C4 pace the one payer; `Scene_1` unchanged.
**The result first.** With `pictureOne` 1, not latched, the follower draws — far, in the band, between the band and the latch, and through every logic
turn. Its heading is never blended; the band moves only the elevation, so the view stays on the follower's side of the vertical. Latched, G draws. At
the latch and the unlatch the pose drawn is held and his finger closes the gap: nothing jumps. With `pictureOne` 0 nothing changed.
* **Where.** `src/input/picture.ts`: `pictureStep` rewritten (the owner's pose, the hand-over, the up); `turnedPose` (a pose turned about the world
  vertical, then about the horizontal axis square to its heading, the elevation within ±89.5°); `viewHeadEl`; `turntableUp` takes the DRAWN heading.
  `bandDir` (the slerp) and `bandEye` (the residual toward G's eye) deleted. `src/render/picture_wiring.ts` `pictureFrame`: the far path is
  `!asmTiltAuto && asmAsk !== null && !orbitPiecePlaced`; where `followActive` is false there (a logic turn, the square camera's share, a tilt turning
  off), the close drawer runs first for the logic, not drawn, its facts read. `followFrame` takes `also`: run anyway, and leave the close drawer's own
  state alone (the carried up's dx budget and yaw, the record `asmRollShadow`). `followPark` only in the close branch (latched). `assembly_wiring.ts`
  `poseShown`: a turn started at the latch starts from the camera drawn (`drawnPose`). ⭐ Amended while building (§4.3a 5.): the hand-over reads each
  view's OWN heading. Read off the up inside the cone, a rolled G read 100° off its view, and the latch turned the view by 4.6° (R3's cycle vector).
* **Rule 3's start pose, how it is guaranteed.** Every turn at the latch frame is made by `seamTurnStart` → `poseShown`, read before the picture writes
  this frame's facts. If last frame was drawn by the far path (`asmPicture.far`) and the latch is on, `poseShown` returns the camera drawn last frame
  and the piece drawn. After a frame the follower drew alone, this is what R3 already returned. After a frame drawn through a logic turn, it used to be
  the logic's ghost. Every other turn keeps its start, so its angle and clock are unchanged.
* ⛔ **A contradiction with the brief, found in the code.** Rule 3 assumed a pending turn at every latch. In a polar zone (the spit included) `tiltOn`
  returns early, so no turn starts there and G is the zone's pose at once, with the side's heading. Built: the picture's own hand-over (§4.3a 5.), the
  same as the up's (P8). Cost: on a spit the heading's gap (90 – 180°) is paid by the square camera's share, his first `tiltBlendMm` (10 mm) of orbit
  finger, so 9 – 18° a mm. That is above his C4 3° a mm, and it is a decision for the lead (a longer span for it, or nothing to pay if the zone's
  camera kept the follower's heading, which would reopen the logic). ⭐ DECIDED by the lead (C4): the pace capped at 3°/mm, at least 10 mm (§4.3a 5.).
* **Decided by the builder (for the lead's review).** (1) R3's residual toward G's eye is no longer drawn in the band: it carried the logic's heading by
  place. On `Scene_1` the band now differs from R3 by the logic camera's catch-up, and the latch's turn starts from the pose drawn. (2) The follower's
  own rule comes whole in the frames it now draws through a logic turn: its edge turn holds the gizmo (`tiltClampStep` reads `asmFollow.top.turn`) and
  writes its dy hold. R3 had the follower parked there. (3) The resolver `changeResolve` is unchanged, so the logic's turns, their waits and their holds
  are the logic's as in R3, though not drawn. (4) The hand-over closes, not latched, by the way out's own share while its turn lives, else by his mm over
  `pictureBandMm`. (5) With the owner's 2° pitch offset the drawn view reaches el(`us`) + 2°: where the logic's direction is within 2° of the vertical,
  the view passes it by that much, as the logic's own camera does.
* **Identity.** `pictureOne` 0: `pictureLegacy`, `followFrame` without `also`, and `poseShown`'s guard are what they were. Far out outside the band with
  nothing held: `pictureStep` returns the follower's own objects and the world's up (outside the 20° cone). In the cone (the detour only, `followTop` 0)
  the up is now the meridian of the follower's heading, where R3 used the heading carried from the cone's edge.
* **The vectors** (`tests/picture_fix.test.ts`, 7; written first and run on the old code: 6 red, and the identity one green by design). The spit's band
  stays on the follower's side, never above the logic's elevation, `up.y` ≥ 0, up steps under 5°, and draws the follower's heading at w 1. Equal
  headings give R3's poses (1e-9). The way out with opposite headings turns the heading by the share, with the follower's pose exactly at its end. The
  spit's latch with no turn: held while pending, G exactly at the end. Rule 6: in the cone the up is the meridian of the follower's heading (old code
  5.0°). The source vectors cover the far path and the latch's start. Mutants, each red: the slerp put back; the elevation not blended; no hand-over of
  the direction; the way out's share ignored; the far path gated by `followActive`; the up from the view's own heading. `pictureFarTop`: the default 0
  pinned (red on the old code and on the predicate without it). R3's own vectors amended where R3's rule changed (w 1, the latch's elevation, the f480
  restart with the follower parked as the game parks it), and three source pins (`picture_facts`, `camera_follow_wiring`, `camera_follow_r5`).
  `npm run verify`: **2323**, then **2324** (from 2317).
* **Owed** (none run). §7 items 1 – 3 with `&pictureOne=0` as the identity. His three videos' strokes on `Scene_0bis` (kit `follow/r3fix`:
  `walk_h.mjs`, `rd_stuck.mjs`), the band's dy near the left tip (R3: 0.22 m along the axis; `pictureOne` 0: 0.05). The approach cycle on `Scene_1`'s
  top. The spit's latch and its way out (the heading paid by the mm). The dy hold walks (the follower's own holds now drawn through logic turns).
### 8.6 R6 — the deletions (his word of 2026-11-22: *"proceed"*; ⛔ as briefed, not yet built)
* **What goes** (§4.6's order of deletion): every path the game no longer takes with the defaults — `pictureOne` 0 (`pictureLegacy`, `620f227`'s line),
  `cameraFollower` 0, `followTop` 0 (the detour: `poleDetour`, `polarStep`, `followCeiling`, `followFromDeg`, `followMaxDegS`), H3's 0 paths
  (`followTurnOnJump`, `followTurnFinger`, `followTurnRebase`), law U (`uprightPictureFrame`, `uprightPicture`, `uprightCloseIn`), FO3 S1's gap and the
  shadow (`freeTurnMaxDeg`, `rollFollowMs`, `rollShadowFrame`), `poseFramingTwo` (`zm.rule` 1), the 0 paths of `uprightCarried` and `uprightFraming` —
  each with its switch, its slider and its vectors. A name goes only once a trace shows nothing on the kept path reads it.
* **What stays**: the one picture (`pictureStep`, `picture_wiring.ts`); close in's target (C1, C4, J's `framingStep` and what it uses); the logic's
  targets and clocks (§4.6's last row); `pictureFarTop` (**1**; 0 = `98ac680`'s far top rule, H2 / H3, kept until his look on R5), `pictureBandMm`,
  `followMs`, `followTurnMaxDegS`.
* **The gate** (kit `follow/r6/drv_r6.sh`, one batch each side, the same probes): the baseline commit (`pictureFarTop` 1) served from
  `../picture_repro`, R6's tip from `../camera_follow`. The replay probe on `Scene_1`, `Scene_0`, `Scene_0bis` with `pictureFarTop` 1 and 0; his
  `Scene_0bis` free strokes (band, band 11, far, far with `pictureFarTop` 0, the mix, close); `Scene_1`'s approach cycle at 5 / 9.5 / 8.4 px; the spit's
  latch near the left tip; his two close stretches; the dy hold walks. Every recording identical (`Scene_0bis`'s first ~30 frames to 1e-6, the replay
  probe's known noise), the `moved:` line read.
* **As built** (2026-11-22, the builder; ⛔ no headless run, no device look: the lead's batch `drv_r6.sh` is the gate). Two code commits, §4.6's order
  merged where the same files carried the steps: `53f00b5` (FO3 S1 and the shadow, law U, `uprightFraming` 0) and `3014e53` (the detour, `cameraFollower`
  0 with `pictureOne` 0, H3's 0 paths). **Switches and sliders removed (12; 144 → 132):** `uprightPicture`, `uprightCloseIn`, `uprightCarried`,
  `uprightFraming`, `cameraFollower`, `pictureOne`, `followFromDeg`, `followMaxDegS`, `followTop`, `followTurnOnJump`, `followTurnFinger`,
  `followTurnRebase`. **Deleted with them:** `rollShadowFrame`, FO3 S1's gap in `rollPictureFrame`, `uprightPictureFrame`, `roll_follow.followStep` /
  `gapTake` / `FollowMode`, `fingerOnGhost` / `fingerOnLogic`, `upright.ts` `uprightStep` / `uprightPaced` / `UprightState` / `UPRIGHT_REST` /
  `holdOnPicture`, the `lawHalf` event, the record's `upright` field and its three readers, `fingerAtEntry` (the identity once law U is gone), `turnBegin`'s
  own turn (`uprightDecides`, `seamEase`, `easeCarry`, `TurnAsk.noCamNull`), `pictureOn` / `pictureLegacy`, `followFrame`'s drop without a hook,
  `camera_follow.ts` `FollowKnobs` / `FOLLOW_CAP_DEG` / `poleDetour` / `followCeiling` / `polarStep` / `followStep`, `followPark`'s detour branch, the
  `pictureOne` parameter of `turnFraming` / `turnPose` / `framedPose`, the knobs `onJump` / `finger` and H2's branches in `followTopStep` /
  `followFarStep`. **Lines (src, deleted / added):** step 1 — `roll_shadow.ts` 173 / 17, `upright.ts` 98 / 8, `assembly_wiring.ts` 76 / 18,
  `roll_follow.ts` 56 / 6, `picture_wiring.ts` 23 / 11, `gestureConfig.ts` 21 / 3, `pointer_wiring.ts` 8 / 6, `scene_state.ts` 8 / 4, `tuning_menu.ts`
  6 / 1, `green_box_wiring.ts` 2 / 1; step 2 — `camera_follow.ts` 142 / 26, `camera_follow_wiring.ts` 46 / 38, `gestureConfig.ts` 34 / 2,
  `picture_wiring.ts` 25 / 8, `tuning_menu.ts` 11 / 3, `orbit_tilt.ts` 7 / 6, `green_box_wiring.ts` 6 / 6, `assembly_wiring.ts` 6 / 6, the rest ≤ 3.
  **Vectors:** 2327 → 2289 (step 1) → 2278 (step 2).
* **Kept, read on the kept path** (the trace: kit `follow/r6/CHECKPOINT_R6.md`): `poseFramingTwo` — a turn far out or outside the band is `rule` 0
  (`turnFraming(0, false)`), the framing tried: its pose is G, read by `upCarried`, the record's ghost and `zm.rule` (the recorder's `mix.rule`);
  `freeTurnMaxDeg` — its value feeds `changeSeen` (the carried up's timed / at once), only its 0 (the shadow) deleted: the validator now `(0, 90]`, the
  slider 5 – 90; `rollFollowMs` — the clock of the piece's shown direction's rest (`asmDirEase.own`, written by `changeApply` at once); `followPoleDeg`;
  `FollowDetour` and `FollowState.det` (the record `asmFollow.rec` reads `side`, `det`: `followStart`'s rest); `src/render/roll_shadow.ts` (it holds the
  close drawer `carriedFrame` and the record; its name kept for the recorders); `poseTurnAngle`, `turnIsFree`, `gapStep`, `restShare`. ⚠ Left as dead data
  (not removed, for the lead's word): `FollowTop.orbitWas` and `FollowTopIn.orbit` (H2's pace was their only reader; ~25 test literals carry them), the
  record's `drawn` (always true now), `rollFollowMs`' slider label (it names the deleted roll follower).
* **For the lead (probes and URLs, not touched):** `turn_rec.mjs`'s `SHADOW_REC` keeps every field it reads (`s.upright` is now always absent: its own
  fallback `s.one`, as with the defaults before); `drv_r6.sh` passes none of the deleted switches. The older kit drivers do (`freeTurnMaxDeg=0` ×36,
  `uprightPicture=0` ×30, `pictureOne=0` ×16, `followTop=0` ×13, `cameraFollower=0` ×7, `uprightCarried=0` ×7, H3's three ×3, `uprightFraming=0` ×1 —
  `follow/r2` … `r5`, `h*`, `rebuild_d`, `rebuild_e`): an unknown key is now reported by `config_override.ts`, and `freeTurnMaxDeg=0` refused.
  `scripts/probes/ORBIT_GATES.md` lines 492 – 583 cite the same switches.
* ⭐ **The gate RUN, PASS** (2026-11-22, the lead; kit `follow/r6`: `drv_r6.sh`, `cmp_r6.mjs` — checked first on a planted 1e-4 m difference, caught):
  `runs_base` = `2c8ad70` served from `../picture_repro`, `runs_r6` = `6221bf0` from `../camera_follow`, the same probes. **27 recordings: 26 identical
  frame for frame**, the 27th (`Scene_0bis`'s replay, the defaults) 551 frames (3 – 556) within 2.34e-9 m — the same R6 code run twice gives the same
  551 frames at 2.34e-9, and the base against that repeat differs in **0** frames: the scene's own boot noise (`ORBIT_GATES.md` §17). Every replay moved
  (`Scene_0bis`: the camera 412 m, the gizmo 19 m); his strokes, the approach cycle at three paces, the spit's latch, his two close stretches and the
  six dy hold walks identical, `pictureFarTop` 1 and 0. `npm run verify` **2278** (the lead). ⛔ No device look on R6 nor on R5 at 1.
