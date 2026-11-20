# THE CAMERA FOLLOWS THE GIZMO — a simple polar orbit behind one follower (packet F, 2026-11-20; a STUDY — ⭐ F1, F2 BUILT since: §13)

> The owner's proposal after eleven failed rebuilds of the upright picture, reviewed in his four parts: the rules, the obstacles, a design from the prior art, its audit plan. Offline only: his ten recorded
> stretches, no game run. Every figure is tagged **measured** (a reader on the recordings), **read** (the code or a document) or **opinion**. The kit: `fo3/follow/` (`follow_f.mjs` the prototype,
> `CHECKPOINT_F.md` every figure). Before it: [`UPRIGHT_CARRIED_UP.md`](UPRIGHT_CARRIED_UP.md) (the live build), [`FAST_ORBIT.md`](FAST_ORBIT.md) §12 – §14 (FO3).

## 0. His words (2026-11-20, verbatim)

* *"I think all the rebuild failures point to a basic logic failure: while the gizmo travel on the assembly looks very good (both polar orbit and tilted orbit), the camera travel is too disrupted by all
  the geometry and topology which rightfully determine the gizmo travel but should not disrupt so much the camera orbit. I have the feeling we shall keep the camera movement as a simple polar orbit and
  find the function which links it to the orbit of the gizmo smoothly. This function shall be both smooth (so it shall filter out the gizmo jumps or sudden changes of direction) while being faithful to the
  gizmo (the camera shall follow the orbit of the gizmo, it shall not be too far behind and avoid the gizmo being unseeable for long). A slerp-lerp function with inertia behind the ghost camera position
  would do that but I am afraid a big lag may occur."*
* The pole — one smooth yaw swing about the vertical, driven by the gizmo's motion, never a roll: *"I believe this is the best option"*.
* *"If I am correct, the delta input directly moves the gizmo. Then the gizmo position can be computed as a quaternion around the assembly center and the camera polar orbit can follow this quaternion.
  Advise."*
* *"Ok. Then we will see if we also need to change the piece orbit the same way as the camera orbit to avoid jumps or rapid turns of the piece."*
* *"indeed, we need to have the calm incorporated into the camera polar orbit: the calm was developped exactly for the purpose of the user being able to see properly the extremities of the faces instead of
  a sharp view angle."*
* *"the camer shall look at the center of the camera orbit, we have decided that several times in the past."*
* *"the calm: therefore, maybe the polar orbit of the camera is not a sphere but a kind of ellipse in yaw and another kind of ellipse in pitch"*.

## 1. The result first

1. **His diagnosis is right for half of the failures, and the proposal cures that half by construction.** Six of the twelve ledger rows are ONE root: the picture's roll has owners in the logic (its heading
   rules near the vertical) — §2. A camera whose up is the world's never reads them. **Measured** on his ten stretches (155 s): gravity tilted over 20° on **0 %** of the frames (live 29.8 %, `1.0.147-`
   35.4 %); camera moves he did not ask **1 817°** (live 30 741°, `1.0.147-` 22 293°); turns of 90° or more seen about the view **1.3 a pass** (live 1.9 — his two circles; `1.0.147-` 1.7 on its own 61
   passes); frames turning the camera over 20°: **96** (live 603, `1.0.147-` 286), over 45°: **0** (13, 5).
2. **It does not cure the other half: the pass over the vertical.** That is the sphere's topology, not the assembly's. His hand passes over or under the vertical **37 times a minute** (96 in 155 s,
   **measured**), the view turning 900°/s at his nine-tenths pace. A polar camera turns each pass into one 180° yaw; no setting makes that yaw both smooth and faithful at that pace (§6: the frontier,
   measured). It is ONE per pass by construction, it keeps gravity upright, and it can be paced by his finger instead of a clock — that is the gain. It is not free.
3. **The filter is the small question; the pole is the big one.** Spring, exponential, speed-adaptive, alpha-beta: the lag moves by a few degrees (p50 10 – 17°, p95 59 – 71°, **measured**) once the pole is
   handled one way. His fear of *"a big lag"* is founded only at the pole.
4. **Two things get worse, and he must see them before a build** (**measured**, §6): the picture's sudden turns near the vertical (118 a minute against 82 live and 25 on `1.0.147-`, though smaller: 36° at
   most in 33 ms against 71° and 111°), and the piece's jumps on the glass (105 a minute against 39 and 14): during the yaw the piece circles the glass's centre.
5. **The piece cannot stay on the logic's ray far out while the camera lags** — it sits 1.3 m before an eye that is 7.6 m from the look point, so 5° of camera lag takes it off the glass (**measured**: off
   the glass on 65 % of the frames). His *"then we will see"* is needed at once: the piece and the camera must ride the SAME followed direction (§5.6).
6. **Recommended**: go on, in gated packets, the first one a SHADOW that changes no picture (§10). Not a build of the whole in one go: the offline run cannot tell what his finger does once it reads another
   glass (§7).

## 2. The ledger — every failed build, its root, and what a polar follower would have done (the lead's table, completed)

Two families and one row apart: **R** = the picture's roll has an owner in the logic; **P** = the pass over the vertical (when, how fast, what is held); **F** = the framing of the piece. The rule each row
binds is kept — it is the checklist for any later design.

| # | build | what failed | root | the rule it binds | family · a polar follower there |
|---|---|---|---|---|---|
| 1 | `1.0.148b-` law U | rapid 180° roll, a circle at a level face / zenith edge, a jitter at a pole | two owners of the roll: the logic's pose and the picture's law, the weight handing it over near the vertical | ONE owner of the roll | **R** · cured: the up is the world's, no weight, no hand-over |
| 2 | `1.0.148b-` fix rounds 1 – 3 | each round moved the conflict | patches on the join of two owners | no layer undoing the logic; stop after a second round on one join | **R** · cured: no join |
| 3 | `1.0.148c-` V1 | the dy hold lost; gravity tilted 30 %; the half turn still once a pass | the turn paced by the view: no moment, so no hold | a half turn needs a decided moment; holds must not depend on the picture | **P** · stays: the yaw has no moment either. Paced by PLACE it needs none and no hold (§5.5) — the dy hold stays the logic's |
| 4 | `1.0.148c-` fix | the hold 97 – 103 mm late | the moment chosen by the view; the hold read "a turn seen" | holds come from the LOGIC's crossing | **P** · the rule kept as it is: OP8 untouched |
| 5 | `1.0.149-` study | (offline) | every half turn on his hand is a pass over / under the vertical; only count, place and pace are free | one half turn a pass at most | **P** · confirmed here: 96 passes; one yaw a pass by construction |
| 6 | `1.0.148d-` one pose | his own yaw at a pole lagged 70 – 80° | the pace capped every motion, his finger's too; a hold that did not hold | a pace closes only a gap a change opens | **P** · ⚠ RISK REPEATED: a ceiling on the yaw caps his own fast dx too (§5.4) |
| 7 | `1.0.148d-` fix 1 | frames over 45° doubled | following the logic's target showed its heading swings | the logic's heading rules near the vertical are no source for the picture | **R** · cured: never read |
| 8 | `1.0.148d-` studies S, A | back and forth leaving a pole, a circle, a roll toward the square alignment | the up = the logic's heading rules, which move by themselves; the gates did not count HIS symptoms | a gate counts what HE names (`his.mjs`) | **R** · cured — ⚠ but `his.mjs` counts MORE pitch back and forth (171 against 139): going round the vertical the camera pitches up, then down (§6) |
| 9 | `1.0.148e-` carried up | a snap to the vertical; a dx rolled 80° in 40 ms | the leftover paid by TIME | every payment is his FINGER's | **P** · the detour is by place = his finger; the follower's 50 ms and the ceiling are time, small and stated |
| 10 | `1.0.148e-` fix 1 | 250° not asked over the top | payers misread in code | a payer reads the finger's own input | **R** · cured: no payer exists |
| 11 | `1.0.148e-` J (live) | the piece leapt 300 – 400 px | a change applied at once moves the eye 2.3 m; the piece is 1.2 m before it | a change's framing slides; count the PIECE's jumps (`jr.mjs`) | **F** · ⚠ WORSE unless the piece rides the follower, and still 105 jumps a minute against 39 (§6) |
| 12 | live `b03a4dd` | two circles a pass across the bottom | the half turn decided by the logic's heading flips | (the study stopped) | **R** · cured: 1.3 turns a pass against 1.9 (**measured**) |
| P | process | E: read, a batch while he tested, figures unchecked | — | never read E:; no headless run while he tests; the lead re-reads each figure; his pace | kept (this study: offline, C: only) |

**The verdict in one line**: *"the camera disrupted by the geometry and topology that rightly drive the gizmo"* is the root of rows 1, 2, 7, 8, 10, 12. It is NOT the root of rows 3, 4, 5, 6, 9 — there the
disruption is the vertical itself — nor of row 11. And one thing in his sentence is refuted by the frames: the logic's view DIRECTION is not jumpy (**measured**: 3 frames over 45° in 9 274; over 20°: 406,
of which 198 are his own pace with no event). What jumps is the roll, and the yaw at the pole.

**Solved, must not regress** (his eye): the gizmo's travel; the dy hold from the logic's crossing (OP8); a slanted face's entry / exit; close in (the square camera, the tilted pole); the piece's slide at a
change (J); his pace settings.

## 3. The rules (part 1)

| # | the rule | whose |
|---|---|---|
| F1 | The gizmo, the orbit's angles, the face map, the charts, the dy hold: not touched. | his |
| F2 | The camera is a polar orbit: its place a point on a sphere round the orbit's centre, its up the world's. It never reads a heading. | his |
| F3 | It looks at the centre of its orbit. Never at the piece. | his (§5.2) |
| F4 | Its TARGET direction is the calm's; one follower on the sphere smooths it. One ease, not two. | his (the calm), the study (one ease) |
| F5 | Faithful: a bound on the lag in DEGREES, not in milliseconds; the gizmo's face never turned away for long. | his |
| F6 | At the vertical: ONE yaw a pass, driven by the gizmo's travel, going back with it; never a roll, never a timer that decides. | his |
| F7 | The piece is on the gizmo, along the SAME direction the camera rides. | his word wanted (D-F3) |
| F8 | The finger reads the camera DRAWN — there is one glass. | FO3's R7 |
| F9 | Close in (the square camera, the tilted pole) is today's, frame for frame. | his |
| F10 | One switch gives the live build back; the sliders ship with the rule; time in ms, pace in px a second. | the project's |

## 4. The obstacles (part 2 — read on the recordings and in the code)

* **O1 — far out the piece is the binding thing, not the gizmo** (**measured**). The eye is 7.2 – 7.8 from the look point, the piece 6.0 – 6.6, the two 1.26 – 1.39 apart; the piece sits 15° off the view's
  axis (median). The gizmo itself is never lost (off the glass on 0.0 % of the frames in every variant). A piece left on the logic's ray leaves the glass at 5° of camera lag.
* **O2 — the pole** (§5.5). 96 passes in 155 s. An unfiltered polar camera on the logic's direction yaws at 4 788°/s (median peak; 10 612 at most) and turns over 45° on 207 frames (**measured**).
* **O3 — his pace** (**measured**): the finger 173 px/s median, 1 209 at nine tenths, 2 688 at ninety-nine hundredths; the logic's direction 126°/s median, 899, 1 160 (p95), 1 608, 3 726 at most. A 180°
  yaw capped at 520°/s takes 0.35 s at least: at 37 passes a minute, a fifth of the time.
* **O4 — the recorded direction is already eased** (**read**: `CALM_TAU_MS` 120 in `input/orbit_calm.ts`; `gizmoEaseMs`, `orbitSpringMs`, `LOOK_TAU_MS` 120 in `render/assembly_wiring.ts`). The prototype
  filters on top: its lag figures are pessimistic by that much.
* **O5 — the gizmo is held on 27 % of the live frames** (the half turn's hold, **measured**): the recorded route contains those stops.
* **O6 — the finger's conversion reads the camera** (**read** in `UPRIGHT_AT_THE_SOURCE.md` part 2 on `1.0.149-`: `zoneFinger`, `fingerInFrame`, `fingerSwapped`, `asmCamLast`): during a yaw the glass turns
  under a moving finger. Only the game tells what he then does.
* **O7 — no continuous rule without a memory exists** (mathematics: a disc cannot be mapped continuously onto its rim keeping the rim fixed). Any polar camera needs at least ONE remembered bit at the
  vertical — which side it goes round. The designs differ only in who sets it.
* **O8 — the look point on `Scene_0bis`** (**measured**, not explained): the recorded look point is the model's origin on 66 % of the frames, while the gizmo's own travel is centred 0.30 m away, at (0.00,
  0.24, 0.19). To check in the game before F2 (D-F5).

## 5. The design (part 3) — ONE OWNER PER THING

| the thing | its one owner |
|---|---|
| the gizmo's place | the logic (finger → angles → the face map). Unchanged. |
| the direction ASKED | the calm: `calmTarget` / `shownDir` — its shares and its face, WITHOUT its ease |
| the direction SHOWN `d` | **the follower** (new, pure, `src/input/camera_follow.ts`): the one ease, the detour round the vertical |
| the camera's yaw, pitch, up | `d`'s longitude and latitude; the world's up. Nothing else. |
| the look point | the orbit's centre, as today (`asmLook`) |
| the distance | the approach (his pinch), as today |
| the piece | the logic's place, hung along `d` from the gizmo's foot (as today along the shown direction) |
| the dy hold | the logic's crossing (OP8), as today |
| close in | the square camera and the tilted pole, as today; the follower's detour fades with their share |

### 5.1 What it reads — his quaternion, answered
The finger does not move the gizmo directly: it moves the orbit's angles, and the face map places the gizmo from them (**read**). Following the gizmo *"as a quaternion"* would carry a twist, and the twist
IS the roll. Follow a DIRECTION — a point on the sphere. Which one, **measured** with no filter and the world's up: the gizmo's own direction from the centre is the worse target (318 frames over 45°, the
camera turning 2 290°/s at p95, the piece off the glass on 84 % of the frames, 2.7 m from the eye); the calm's direction, as the logic shows it today, is the better (207 frames, 1 569°/s, 0.7 %, 1.3 m).
So: **the calm's direction, as he decided.**

### 5.2 The camera, and where it looks
`eye = look point + distance × d`; up = the world's. **Decided before** (**read**): *"center of the orbit = gizmo"* (the owner, 2026-11-04, D3 —
[`TILTED_ORBIT_REBUILD_SCOPE.md`](TILTED_ORBIT_REBUILD_SCOPE.md) §16.1); *"the camera looks at the yellow target (orbit center)"* ([`PICK_AND_PLACE.md`](../../20_GAME_RULES/spec/PICK_AND_PLACE.md) §1);
*"camera always aims at the gizmo"* (`DOUBLE_ORBIT_PROTOTYPE.md`, `1.0.80-`, 2026-10-17); the scope's §3: *"the look point the centre far out, the gizmo close in (`lookShare`)"*. **What that centre is
today** (**read**, `assembly_wiring.ts` l. 97, 1328): the placed parts' box's centre, fixed at boot (*"put the center at the center inside the assembly at boot and don't change it"*), sliding to the
gizmo's eased foot as the piece comes in (`lookShare`), eased 120 ms. The design keeps it exactly.

### 5.3 The follower — the families compared (**measured**, the same pole handling, the piece riding)
| the follower | lag p50 / p95 | frames over 20° | note |
|---|---|---|---|
| none | 6.4° / 58° | 222 | the pole's lag alone |
| critically damped spring, 50 ms (Lowe 2004) | 16.7° / 71° | **96** | smooth start and end, no overshoot — **recommended** |
| exponential (slerp), 40 ms — his *"slerp-lerp"* | 14.4° / 65° | 99 | as good; no inertia, a corner at each start |
| speed-adaptive time (the 1€ idea), 8° asked | 10.0° / 59° | 251 | least lag, least smooth: a step of the target reads as speed and opens it |
| alpha-beta predictor, 40 ms | 12.1° / 67° | 256 | overshoots a change of direction |
| spring 50 ms + a hard arm of 25° | 16.2° / 64° | 198 | the arm bites at his pace |
Without the pole's handling a spring alone lags 8° / 50° at 60 ms and 22° / 86° at 120 ms and still turns over 45° on 143 / 110 frames: **time smoothing does not cure the pole.** Always ON THE SPHERE (a
unit vector and its tangent speed): yaw and pitch filtered as two numbers wrap and stall at the vertical.

### 5.4 The bounds
* **The lag**, in degrees: the spring's time shortened with the speed of the ORBIT'S ANGLES (smooth, his finger's) so that the lag stays near a set angle — not with the target's own speed (the 1€ filter's
  weakness on a step, above). ⚠ Not measurable offline: the angles are not in the recordings (F1 records them).
* **The gizmo's face**: turned over 80° from the eye on 3.2 % of the frames, 217 ms at the longest (**measured**; live 0.0 %).
* **A ceiling on the yaw** (900°/s) as the LAST resort. ⚠ It is row 6's risk: it caps his own fast dx (his p99 is 1 608°/s). Without it the detour alone leaves 120 frames over 45° (**measured**). His word
  (D-F2).

### 5.5 The pole — the detour, by place
Within `θ0` of the vertical (60°) the followed direction is pushed SIDEWAYS, in the plane tangent at the pole, by `θmin · (1 − (θ/θ0)²)²` (`θmin` 30°), on the side it was drifting to when it came in — the
one remembered bit (O7), kept until it leaves. So the camera goes ROUND the vertical at 30° instead of over it; its yaw is a function of where the gizmo is, runs with his finger, and runs back if he goes
back. No clock decides, no moment is needed, nothing is held. Where the push is 0 (the rim) the camera is the calm's exactly.
* The price by place: at the top the view stands up to 30° off the calm's (lag p95 28° with the detour alone, **measured**) — a top face far out is seen 30° off square.
* The price by pace: the yaw runs about 2 × the gizmo's own angular speed at the closest point; at his pace that is over the ceiling.
* One bad point: a path that curls back round the far side of the vertical after coming in. The ceiling holds it (not counted on his hand).

### 5.6 The finger, the hold, the piece, close in
* **The finger** reads the camera drawn (F8). **The dy hold** is untouched (OP8). The half turn's gizmo hold (T5, `uprightHalfHold`) has no object any more far out (D-F4).
* **The piece** — his *"then we will see"*, answered by the frames: left on the logic's ray it is off the glass on **65 %** of the frames (45 % with no filter at all). Riding `d` it is off on 1.0 % (live
  0.5 %). ⚠ What the recordings say of the piece's own motion: its place moves 231 mm a frame at the median, 2.1 m at p95, 5.9 m at most (it is 6 m out: that is the orbit's pace, not a fault). Its
  ORIENTATION is not recorded: its *"rapid turns"* cannot be read offline.
* **Close in**: not simulated. The rule proposed: the detour's `θmin` and the follower's time × the square camera's complement (1 far, 0 at contact), so the picture close in is today's.

### 5.7 The calm at an edge, and his "ellipse"
* **The calm's fast turn at an edge.** It is fast only because the finger is: the share rises with the PLACE in the edge zone (`edgeShare`, **read**). The follower bounds the lag in degrees, so at a face's
  extremity the camera is at most that angle SHORT of the calm's edge view — and short means MORE square to the face the gizmo is on. After the crossing the next face is seen that same angle late. The
  extremities are kept if the calm's own 120 ms ease goes: two eases in a row add their lags (**opinion**; F1 measures it).
* **An ellipse in the ANGLES** — reading 1: that IS the calm (slow in a face's middle, fast toward its edges, by each face's own run in dx and in dy: `zonePct` of the run, **read**). Nothing to add; it is
  the target (F4). ⚠ Its share cannot be isolated offline (the raw target is not recorded); the proxy is §5.1's comparison.
* **An ellipse in the DISTANCE** — reading 2: **not recommended.** Looking at the centre it changes only the size on the glass. The distance already follows the surface: eye to look point 7.24 – 7.81 far
  out (± 4 %, **measured**), because the piece hangs from the gizmo's foot. Close in the distance is the approach's and the contact's. Step 2's lesson (**read**, the scope's §10): a shell read from the
  wrong place *"never latched"* the slide and jumped the piece 40 mm. Any shape there fights his pinch.

## 6. The offline prototype (part 3, measured) — `Scene_0bis`, far out, 60 frames a second, his ten stretches, 155 s

`follow_f.mjs` runs the function on the logic's recorded pose (`sh.gh3`), frame by frame, and writes a recording the project's own readers read (`his.mjs`: back and forth, moves not asked, turns ≥ 90°;
`jr.mjs`: jumps on his video's 33 ms). Roll is 0 by construction: gravity tilted over 20° on 0.0 % of the frames in every variant. D is the recommended setting.

| | lag p50 / p95 (ms p50) | face away (longest) | frames > 45° / > 20° | yaw peak, median | not asked | turns ≥ 90° (a pass) | back and forth pitch / yaw / roll | sudden turns a min (largest) | piece jumps a min |
|---|---|---|---|---|---|---|---|---|---|
| live `b03a4dd` | 0.1° / 5.7° | 0.0 % | 13 / 603 | 724°/s (roll) | 30 741° | 180 (1.9) | 139 / 65 / 98 | 82 (71°) | 39 |
| `1.0.147-` | 0.0° / 6.1° | 0.0 % | 5 / 286 | 413°/s (roll) | 22 293° | 103 (1.7 of its own 61) | 115 / 54 / 81 | 25 (111°) | 14 |
| **D** detour 60 / 30, spring 50 ms, ceiling 900°/s | 16.7° / 71° (50) | 3.2 % (217 ms) | **0 / 96** | 900°/s | **1 817°** | 126 (1.3) | 171 / 60 / 48 | 118 (36°) | 105 |
| A detour 45 / 25, ceiling 1 500 | 11.7° / 57° (50) | 0.9 % (133 ms) | 0 / 711 | 1 439°/s | 1 233° | 133 (1.4) | 172 / 65 / 42 | 214 (51°) | 144 |
| C detour 90 / 35, ceiling 1 500 | 21.8° / 63° (67) | 1.5 % (117 ms) | 0 / 472 | 1 239°/s | 3 128° | 122 (1.3) | 166 / 69 / 60 | 180 (58°) | 135 |
| B no detour: a cap at 15°, the yaw by TIME at 520°/s | 32.4° / 109° (117) | 14.4 % (483 ms) | 0 / 8 | 520°/s | 4 778° | 98 (1.0) | 149 / 70 / 68 | 41 (19°) | 119 |
| D on `1.0.147-`'s own route (61 passes) | 13.6° / 54° (50) | 1.1 % (100 ms) | 0 / 79 | 900°/s | 799° | 81 (1.3) | 127 / 46 / 51 | 133 (37°) | 83 |

* **The frontier, in plain words.** B is the smooth one: no sudden turn over 19°, but the camera trails a third of a right angle at the median and the gizmo's face is turned away for up to half a second. A
  is the faithful one and the least smooth. D is between. No row wins both: that is his pace at the pole (O3), not a tuning left undone.
* **His desk (143 frames a second)**, two stretches on `28a29ca`'s route: D's lag 20.8° / 79°, 56 ms; at 60 frames a second on the same two 14.3° / 73°, 50 ms. The times agree; the frames over 20° fall
  from 13 to 0.
* **The pole's yaw, D**: 0.48 s at the median, 1.2 s at p95, 900°/s at the peak (the ceiling) — against the live roll's 0.33 s and 724°/s.
* **Where the roll is not 0**: nowhere in the up. What `his.mjs` and `jr.mjs` count as roll is the yaw seen from near the vertical: from 60° up, a turn about the vertical is, on the glass, mostly a turn
  about the centre.

## 7. What an offline run cannot tell

The route changes once his finger reads another camera (O6) — every figure above is the function on a route walked with ANOTHER picture, with the live build's holds in it (O5) and its eases under it (O4).
Not simulated: close in; `Scene_0` and `Scene_1` (the cube's top, the heptagon's ridge); the piece's orientation; the lag bound by the angles' speed; the one ease in place of two. Not judged: whether the
pitch up-then-down round the vertical, and the yaw seen from above, read to HIS eye as a back and forth or a circle. Only his look tells.

## 8. The literature (part 3) — methods, sources, patent status as far as could be told. ⚠ Not a legal opinion.

Four web searches were run. A source not marked verified is cited from memory.

| the method | source | status |
|---|---|---|
| a turntable orbit (fixed world up, yaw and pitch) | common practice in modelling tools (Blender's *Turntable* against *Trackball*); the two-axis valuator, Chen, Mountford, Sellen, 1988 | decades old; no patent known to this study |
| a fixed axis matched to the object's own axis is easier | *The Visual Computer*, 2021 (doi 10.1007/s00371-021-02394-x; found by search, abstract only) | a paper. ⚠ It argues for the spit's own axis — the tilted orbit he refused for its roll |
| critically damped ease | Lowe, *Game Programming Gems 4*, 2004 (not re-verified online tonight) | a textbook method |
| the 1€ filter | Casiez, Roussel, Vogel, CHI 2012 | reference code under BSD-3-Clause (verified by search); no patent found, none searched for at a patent office |
| the alpha-beta filter | radar tracking, Sklansky 1957; Benedict and Bordner 1962 | public by age |
| slerp; filters on orientation | Shoemake 1985; Lee and Shin, IEEE TVCG 2002 (not re-verified online) | papers |
| a follower with a longest arm | game engines' spring arms (a camera lag with a largest distance) | engine practice; status unknown, generic |
| an obstacle pushed round by a field | Khatib 1986 (robots) — here the obstacle is the vertical | a paper |
| frame coherence against constraint; camera control surveyed | Halper, Helbing, Strothotte 2001; Christie, Olivier, Normand 2008 | papers |
**Not used, on purpose**: any orientation widget (the ViewCube patent US 7,782,319 — not found by tonight's search, status not verified); HoverCam (US 8,044,953, Autodesk, filed 2006-03-28, granted
2011-10-25 — verified on a patent listing; whether it is still in force NOT verified): this camera never searches the surface for its closest point — it reads a direction on a sphere about a fixed centre.

## 9. What it removes, what it keeps (read in the documents and by file; the call sites are F1's first task)

* **Removes, far out**: the upright laws and the carried up with its payers and holds on the picture (`input/upright.ts`, 534 lines); FO3's follower and its shadow (`input/roll_follow.ts` 236,
  `render/roll_shadow.ts` 285); the framing slide (`uprightFraming`); the camera's timed turn at a crossing (the angles' rebase stays); the heading rules as the far-out camera's up (`cameraHeading`,
  `spitCameraHeading`, `freeShownHeading`); the half turn's gizmo hold; thirteen sliders (`upright*` × 11, `rollFollowMs`, `freeTurnMaxDeg`); the calm's ease.
* **Keeps**: everything in §2's solved list; the calm's shares; the look point; the approach; the sections; the sway's rule (model coordinates).
* **How close to FO3**: the same idea — the picture a follower of the logic — moved from one number (the roll about the framed line, the place exact) to the whole direction (the place free, the roll gone).
  FO3 kept the piece's place and lost the upright; this keeps the upright and must carry the piece (O1).

## 10. The build as packets, each with its gate (part 4) — one agent each, vectors red on mutants, one headless batch, his look closes; after a second fix round on one packet, STOP and study (row 2)

| # | the packet | its gate |
|---|---|---|
| F0 | his word on D-F1 – D-F8 | — |
| F1 | **the SHADOW**: `camera_follow.ts` (pure; the spring on the sphere, the detour, the pose) + its vectors; computed each frame from the RAW calm target and recorded beside the live pose, with the orbit's angles and the face's true normal. NO picture change. | the picture bit for bit (the replay probe); the shadow's figures on his ten stretches against §6; the lag with ONE ease |
| F2 | **drawn far out**, behind `cameraFollow` (0 = the live build, frame for frame): the camera and the piece ride `d`; the finger reads it | HIS symptoms, his hand replayed and the steered walks: turns ≥ 90° a pass ≤ 1.1; back and forth in roll and yaw ≤ `1.0.147-`'s (pitch reported); piece jumps ≤ live's; frames > 45°: 0; face away < 250 ms; the dy hold walks `z_far`, `b_far` as `1.0.147-`, no re-crossing |
| F3 | **far ↔ close**: the detour and the time fading with the square camera's complement | close in frame for frame; the tilted pole's walks; the close stretches |
| F4 | `Scene_1`, `Scene_0`; the sliders in the menu | the seeded replays; the cube's top; no special case per scene |
| F5 | **the removal** (§9), after his look on F2 – F4 | `npm run verify`; the independent audit |

## 11. The decisions for his word

| # | the question | the study's advice |
|---|---|---|
| D-F1 | How close to straight above may the camera come far out? At 30° a top face is seen 30° off square; closer, the yaw is faster. | 30°, a slider |
| D-F2 | The yaw's pace: (a) by PLACE, his finger's, with a ceiling as the last resort (D); (b) by TIME at 520°/s (B: smooth, trailing); (c) by time with the GIZMO HELD until the camera is round, as `1.0.147-` did — not simulated. | (a); if the sudden turns of §6 are what he refuses, (c) |
| D-F3 | The piece rides the same followed direction far out, from F2 on — not later. | yes: 65 % off the glass otherwise |
| D-F4 | The half turn's gizmo hold far out goes; the dy hold stays. | yes under (a) |
| D-F5 | The look point stays the orbit's centre — and O8 is checked: the centre 0.30 m off the gizmo's travel on `Scene_0bis` widens the piece's circle on the glass during a yaw. | check before F2 |
| D-F6 | The calm's 120 ms ease and the rig's spring become the follower's ONE ease (it touches the shown direction's ease, not the gizmo). | yes |
| D-F7 | No ellipse in the distance. | none |
| D-F8 | Going round the vertical the camera pitches up, then down. Inherent to a polar camera. | accept, or keep `1.0.147-`'s tilted orbit there — his eye |

## 12. HIS WORD — build it (2026-11-20, evening, verbatim) — branch `1.0.150-Camera_follows_gizmo`

*"capture all the lessons learned in the md files, capture this specification as well. Then create a new branch and build the follower in this
new branch. Remember that at the end, when orbit charts is completed, we will have to merge everything into 3d_assembly_game worktree."*

* **The lessons**: [`UPRIGHT_LESSONS.md`](UPRIGHT_LESSONS.md) — the checklist every camera design is read against (this file's §2 is its
  detailed ledger).
* **The decisions §11, as the lead advised and he took them by his order to build**: D-F1 the camera no nearer than **30°** to straight above far
  out (a slider); D-F2 **(a)**: the yaw at a pole paced by PLACE — his finger's — a ceiling only as the last resort, and it must not cap his own fast
  dx (the ledger's row 6); D-F3 the piece rides the followed direction from the first drawn packet; D-F4 the half turn's gizmo hold goes far out,
  the dy hold (OP8) stays exactly; D-F5 the look point stays the orbit's centre — the 66 % origin record (O8) explained FIRST, in the game;
  D-F6 ONE ease (the calm's 120 ms and the rig's spring become the follower's); D-F7 no ellipse in the distance; D-F8 the pitch up then down
  round the vertical accepted — his eye judges it.
* **The branch**: `1.0.150-Camera_follows_gizmo` (worktree `../camera_follow`), from `461eeb2` = the LIVE build's code (main `b03a4dd`), so the
  follower's switch at 0 is the live build frame for frame. Packet K's payers (`1.0.148e-`, `3c39c47` + `4e47890`, built, NOT measured) are not
  carried: far out the follower replaces every payer.
* **The packets** (§10, each with its gate, one agent each, vectors red on mutants): F1 the SHADOW (nothing drawn changes; the raw calm target, the
  orbit's angles, the true normal recorded; O8 explained); F2 the follower DRAWN far out behind one switch, the piece riding it; F3 the blend far ↔
  close; F4 `Scene_1` and `Scene_0`; then his look; F5 the removal of what it replaces — only after his look.
* ⭐ **At the end — when the orbit charts are completed — everything is merged into the `3d_assembly_game` worktree** (his word).

## 13. AS BUILT AND MEASURED — F1 the shadow, F2 the follower drawn far out (packet G, 2026-11-20 evening, branch `1.0.150-Camera_follows_gizmo`)

> Commits (local, not pushed): (C) `2ea35c0` F1 · (P) `a13b708` the recorder · (C) `972c9ad` F2 · (C) `fb2fa15` the ease 120 ms · (D) this section. The kit
> `fo3/follow/`: `CHECKPOINT_G.md` (every figure), `drv_g.sh`, `rd_g.sh`, `follow_g.mjs`, `o8_g.mjs`, `near_v.mjs`, `mut_f1.json`, `mut_f2.json`. ⛔ No device look.

### 13.1 The result first
* **`cameraFollower` 0 is the live build, frame for frame** (two stretches); F1 drew nothing (three stretches identical to the live recordings).
* **On his ten stretches far out** (155 s, 60 frames a second): gravity tilted over 20° on **0 %** of the frames (live 29.8 %, `1.0.147-` 35.4 %); the camera
  turned over 45° in one frame **never** (13, 5); moves he did not ask **1 804°** (30 741°, 22 293°); the roll back and forth **47** (98, 81); the piece's
  jumps **26.8 a minute** (38.8, 13.6); the gizmo's face never turned away; the piece off the glass on 0.1 % of the frames (0.5 %).
* **Worse**: sudden turns of the camera **162.5 a minute** (81.8, 24.8 — the yaw near the vertical, read on his video's 33 ms); the pitch back and forth
  **176** (139, 115 — D-F8, accepted); the camera **14° behind the logic's at the median, 58° at p95**; and **the dy hold far out at the bottom of
  `Scene_0bis` is LOST** (§13.6).
* **Close in is the live build**: the follower never draws once the automatic tilt latches; the close stretches are identical frame for frame from there.
* **O8**: the look point is the model's origin because the assembly's centre was frozen before the placed parts were known — 0.31 m from the heptagon's
  centre his rule names. The design is right; the value is not (§13.3, D-G1).

### 13.2 The design read against every row of `UPRIGHT_LESSONS.md`, before the wiring

| # | the rule it binds | the follower as built |
|---|---|---|
| 1 | ONE owner of the picture's roll | the up is the world's (`followPose`), squared to the view; far out nothing else writes the camera (a source test) |
| 2 | root, not patch; no layer undoing the logic | no join: far out `rollPictureFrame` is not called; a change asked is resolved once by the logic's own `changeApply` |
| 3 | a turn that needs a hold needs a moment; holds never from the picture | the picture makes no turn; the only hold is the dy hold, from the logic's crossing |
| 4 | holds from the LOGIC's crossing (OP8) | `holdAtCrossing(ask.hold)` at the change — the `1.0.147-` rule (⚠ but see §13.6: the finger that crosses changed) |
| 5 | one half turn a pass at most | one yaw a pass by construction (the detour's one remembered side): 1.15 runs of 90° a pass measured |
| 6 | a pace never caps his own motion | the yaw's ceiling never under the pace of the eased direction (`followCeiling`; a vector: a 1 600°/s dx is the same camera with no ceiling) |
| 7 | the logic's heading rules are no source | the follower reads a DIRECTION (`askedDir`), never a heading or an up; the owner's camera offsets in the world-up frame |
| 8 | a gate counts what he names | `his.mjs`, `jr.mjs` on his ten stretches, the pole walks, the dy hold walks |
| 9 | realignments paid by his finger, not time | the yaw at a pole by PLACE (the detour); the time left: the one ease (120 ms) and the last-resort ceiling |
| 10 | payers read the finger; a vector per decision | no payer; 27 vectors, 30 mutants red (F1 9, F2 21) |
| 11 | the picture never listens to the logic's heading | the polar camera |
| P | docs before build; one switch, 0 = live; his pace; one headless job; never E: | his word §12; `cameraFollower` 0 identical frame for frame; 60 and 143 fps; one batch at a time; his sessions from C: |

### 13.3 F1 — the shadow, and O8
* Recorded per frame (`sh.fx`): the direction ASKED (`askedDir`: the calm's TARGET before its 120 ms ease, the whole shares by position, at the rig's
  solved angles, no ease after a change), the orbit's, the solver's and the spring's angles, the gizmo's true surface normal, the look point, the centre.
* **O8, in the game** (`o8_g.mjs`, a page read at boot): the assembly's centre is (0, 0, 0) on every frame; the placed parts (the heptagon and the anchor)
  are centred at (0.002, 0.244, 0.191); the scene's own orbit centre is (0.0025, 0.2415, 0.191). **Read**: `ensureAssembly` freezes the centre ONCE (*"at
  boot … don't change it"*) from the placed parts' box, else from the centre blend's target; exactly zero means it ran before any part was placed, with
  the target at its default origin (the exact frame not traced). Far out the look point IS that centre. **Measured offline**: looking at the right centre,
  the piece moves on the glass 15 % slower at p95 and 32 % slower at its fastest.
* **The raw target changes the design's numbers** (offline, the same route): it is jumpier than the logic's eased eye (in the spit it sweeps 25 – 54° a
  frame over the top at his pace). With D's 50 ms as the one ease, 56 frames turned over 45°; **with the calm's own 120 ms (D-F6) none** — 120 ms ships.

### 13.4 F2 — as built
* **Pure** (`input/camera_follow.ts`): `sphereSpring` the ONE ease (critically damped on the sphere, `followMs`); `poleDetour` round the vertical by place
  (`followPoleDeg` 30°, from `followFromDeg` 60°, the side kept from the entry); `polarStep` the camera's yaw toward the detoured direction at most the
  ceiling, never within 10° of the vertical; `followCeiling` = max(`followMaxDegS` 900°/s, his pace ÷ cos of the latitude) — never under his own pace;
  `followPose` the piece hung along the followed direction from the gizmo's foot, the camera on the owner's 2.5° / 2° offsets in the world-up frame,
  1.25 m behind the piece, looking at the look point, up the world's.
* **The stage** (`render/camera_follow_wiring.ts`): the follower draws while `cameraFollower` is 1, no tilt is on, the automatic tilt is not latched, the
  square camera's share is 0 and no timed turn runs. A change asked is applied at once with the logic's crossing's dy hold; no half turn exists, so no
  gizmo hold (D-F4). The finger reads the camera drawn (`asmCamLast`). The upright laws and the carried up are bypassed there, not deleted.
* **Where far ends**: when the automatic tilt latches (the approach within `tiltAutoM`, 0.6 m of the gizmo). From that frame the live picture draws.
  **What he sees there**: the camera turns to the live picture in one frame — 0.1° on the close stretches (he was still); moving, up to the follower's lag
  plus the live picture's roll (F3 blends it). Coming back out, the follower restarts at rest on the piece's drawn direction.

### 13.5 Measured — `Scene_0bis` unless said
| | the follower | live `b03a4dd` | `1.0.147-` |
|---|---|---|---|
| his ten, 60 fps: lag behind the logic p50 / p95 | 14.2° / 58.4° | 0.1° / 5.7° | 0.0° / 6.1° |
| frames turning over 45° / 20° | 0 / 290 | 13 / 603 | 5 / 286 |
| back and forth pitch / yaw / roll | 176 / 67 / 47 | 139 / 65 / 98 | 115 / 54 / 81 |
| runs of 90° or more (passes: 96) | 110 (1.15 a pass) | 180 | 103 (1.7 of its 61) |
| his two at 143 fps: gravity over 20° · frames over 20° · sudden turns · piece jumps a minute | 0 % · 0 · 147.6 · 34.5 | (the carried up `28a29ca`) 31.9 % · 11 · 61.3 · 145.7 | — |
| the pole walks at 143 (bottom, tip, ridge, a round): sudden turns · piece jumps a minute · not asked | 29.0 · 0.0 · 663° | 5.0 · 5.0 · 2 551° | — |
| `Scene_1` over its top at 143: sudden turns · piece jumps · not asked · frames to cross | 31.5 · 9.0 · 470° · 1 908 | 50.7 · 50.7 · 1 465° · 677 | — |
| the dy hold `z_far`, a steady push: set · re-crossed · surface after the crossing | set · never · 79 / 135 mm | set · never · 11 mm | set · never · 11 mm |
| the dy hold `b_far`: set | **never (6 of 6)** | set | set |
| close in (`z_close`, `b_close`, the close stretches) | the live build | — | — |

### 13.6 What still fails, and why (read, not fixed — no fix round in this launch)
* **The dy hold at `Scene_0bis`'s bottom far out is lost.** The hold is the logic's sign that crossed, through the same code; what changed is the finger:
  in the spit it is read off the picture drawn, and on the world-up glass the walker's *down* is no longer the spit's dy — it crosses by dx (no sign, no
  hold). And without the half turn's gizmo hold (D-F4) a steady push carries the gizmo 79 – 135 mm past the edge (11 before). This is O6 come true.
* **Sudden turns near the vertical** (162.5 a minute; 210 of 9 274 frames with the camera within 25° of the vertical, the nearest 8.4°): the detour's bad
  point is common on the raw target — the spring cuts across the vertical when the target sweeps over the top in a few frames, and the ceiling, opened by
  his pace, does not hold it. Packet F's D held it with a second ease on the yaw and a flat 900°/s that caps his dx (row 6).
* **The walker needed 2.8× the frames to cross `Scene_1`'s top** (1 908 against 677): the glass yaws under the steering finger near the vertical.
* **O8's centre**; **the boundary** with close in (F3). Not measured: `Scene_0`, `Scene_1` beyond the one walk (F4).

### 13.7 What he will feel (plain words)
Far out the picture never rolls: the world stays upright, and the camera swings round the top or the bottom as ONE turn that follows his finger. It
trails his finger a little — a seventh of a right angle typically, more at the poles. Near the top and the bottom it turns fast, at his own pace, and can
feel quick. The piece stays on the glass. Close in nothing changed. At the bottom of the heptagon with tips, a push across the edge is no longer held.

### 13.8 The sliders — ORBIT › CAMERA FOLLOWER (`TUNING_MENU.md`)
`cameraFollower` 1 (0 = the live build) · `followMs` 120 ms (0 – 200) · `followPoleDeg` 30° (0 = over the vertical) · `followFromDeg` 60° · `followMaxDegS`
900°/s (0 = none; never under his pace). By URL too (`?cameraFollower=0`).

### 13.9 Decisions for his review
| # | the question | the advice |
|---|---|---|
| D-G1 | O8: freeze the centre once the placed parts are known (the heptagon's centre, his rule) — it changes the live picture too, so behind its own switch | yes, before F3 |
| D-G2 | the dy hold far out under the follower: read the finger in the spit off the LOGIC's frame again (not the picture), or keep a gizmo hold at a crossing | a study first (row 2: a join of two readers) |
| D-G3 | the ease 120 ms (the calm's) against 50 ms (packet F's D): 50 ms trails less (7° median offline) but turned 56 frames over 45° | 120, his eye |
| D-G4 | the pole: the yaw at his pace (row 6, as built) or a flat ceiling with a second ease (D: smoother, caps his dx) | his eye on the device |
