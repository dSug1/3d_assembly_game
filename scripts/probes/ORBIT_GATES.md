# THE ORBIT GATES — the runbook (2026-11-16, package G of the Opus chain; the baseline at `276a6c2`)

What a change to the orbit must pass before it is called built, how to run each gate, how to read it, and the numbers at `276a6c2` to compare
with. Every command runs from the repository's root in **Git Bash** (the batch scripts use `taskkill` and `netstat` to stop the dev server: Windows).
⛔ These gates are necessary, never sufficient: a look on a real device closes a change (rule 5).

## 0. The rules of the house (the owner's own PC)

* **ONE headless run at a time.** Never two batches in parallel, never a loop of `npm run verify`. Each batch starts its own Vite dev server on
  `127.0.0.1:5191` and refuses to start when the port already answers (`port 5191 already serves something: stop`): another batch is running, or a
  server was left up — find it (`netstat -ano | grep 5191`) before anything else.
* **Each probe makes its own Chrome profile** under the OS temp folder (`replay_probe_profile_*`), with Chrome's own TEMP inside it, and removes it
  in a `finally`. After every batch: `ls -d "$TEMP"/replay_probe_profile_* 2>/dev/null` must print nothing; remove only those folders if it does,
  and leave every other file in `%TEMP%` alone.
* **Outputs never go into the repository.** The batch scripts write (the dev server's log, the replays' recordings) to `$OUT`, by default
  `<the OS temp folder>/orbit_gates_out` (`node -p "require('os').tmpdir()"`). A replay recording is 3 – 11 MB: keep few, delete what is no longer
  needed. The probes themselves print to stdout only — redirect to a file in `$OUT` or a scratchpad to keep a run.
* `CHROME` overrides Chrome's path (default `C:/Program Files/Google/Chrome/Application/chrome.exe`); `REPO` makes the dev server serve another
  checkout (the probes still run from this folder) — that is how a replay of an older build is recorded.
* **Scenes**: `Scene_0` the heptagon (`sceneIndex=0`), `Scene_0bis` the heptagon with two pyramid tips (`sceneIndex=4`), `Scene_1` the cube
  (`sceneIndex=1`). ⛔ Never run or judge `Scene_2` here.
* **The switches**: `chartLayout` and `chartCalm` are 1 by default (since `cb55778`). `chartLayout=0&chartCalm=0` is the game before the charts —
  it must stay bit for bit until step 2.5 deletes it. ⚠ `tilt_batch.sh "<scene>:<chartLayout>"` sets `chartLayout` only: `"1:0"` runs
  `chartLayout` 0 with `chartCalm` still 1 (the default); add `EXTRA="&chartCalm=0"` for the game before the charts.

### The probes' facts, learned the hard way

* A mouse wobble under the **3.5 mm deadband** (`motionDeadbandMm`) reaches nothing: to wobble a place across an edge, wobble the ORBIT's own angle
  (`edge_noise.mjs` does: `st.orbit.reset(…)` a frame).
* Under a tilt the face map's normals are the TILTED frame's (`st.gizmoNormal` read in a tilt is not the world's).
* Close in, ONE finger pixel is **2 to 7 mm of surface**: park the gizmo by small steps of the orbit's angle (`PARKTILT=1`), never by pixels.
* A drag begun at **y ≥ 740 px** (of the 1200 × 800 window) lands on the HUD and drives nothing.
* Replay differences in the **last digit** (up to 3e-9, from frame 3) are noise, not a regression — `replay_cmp.mjs`'s `1e-9` column can fire on
  them; `1e-6: never` is the verdict that matters.
* `Scene_0bis`'s body is off the orbit's centre: its poles at (±0.365, 0.229, 0.191) m, its bottom face's centre at (2, 0, 191) mm.
* A Bash error saying the auto mode classifier gave no verdict is transient: run the same command again.
* All the probes run the page on a **virtual clock** (`performance.now` and `requestAnimationFrame` stepped by the probe, 1000/60 ms a frame): a
  run is deterministic — the same code gives the same numbers on every machine and every run (checked at `276a6c2`: the default legs twice, equal).

## 1. Gate (a) — `npm run verify`

The typecheck and every golden vector. **About 3 minutes.** Good: `Test Files  162 passed`, `Tests  2058 passed` at `276a6c2`, no type error.
Run it ONCE at the end of a package, never in a loop. While working: `npx vitest run tests/<file>`. Before a commit that touches a `.md`:
`npx vitest run tests/doc_links.test.ts tests/doc_budget.test.ts`.

## 2. Gate (b) — the replays (the whole game, bit for bit)

`replay_probe.mjs` plays a **seeded script** (SEED 1, LEGS 40: presses, drags, approaches with A held, taps — the input is generated inside the
probe, there is no input file) and records every frame at full precision: the camera (`c`, `t`, `up`, `fov`), the piece (`p`, `q`), the orbit
(`o`), the gizmo (`g`), the approach (`ap`), every body (`w`). 2 794 frames a scene.

```bash
OUT=<folder> EXTRA=""                             bash scripts/probes/replay_batch.sh new_def     # the default game: new_def_s1/_s0/_s0bis.json
OUT=<folder> EXTRA="&chartLayout=0&chartCalm=0"   bash scripts/probes/replay_batch.sh new_off     # the game before the charts
node scripts/probes/replay_cmp.mjs  <baseline>/base_def_s1.json <folder>/new_def_s1.json             # per scene, per switch
node scripts/probes/view_jumps.mjs  <folder>/new_def_s1.json <folder>/new_def_s0.json <folder>/new_def_s0bis.json
node scripts/probes/replay_health.mjs <folder>/new_def_s1.json …
```

**About 3.5 minutes a batch** (Scene_1 ~90 s, Scene_0 ~55 s, Scene_0bis ~60 s, the server ~10 s); `replay_batch.sh <prefix> twice` also records
Scene_1 a second time (`_s1_again`, must be identical: the determinism check). Each recording ends with `moved: the camera … m, the piece … m, the
gizmo … m` (nothing moved: exit 3 — the replay compared nothing) and `<name>: 2794 frames, 0 errors, recErr null`.

**Reading `replay_cmp.mjs`**: `identical frames N of 2794`; the largest difference per field; the first frame over 1e-9 / 1e-6 / 1e-3; non-numeric
differences. **Good** for a change that must not touch a scene: `1e-6: never` and `non-numeric differences: 0` (a 1e-9 hit from frame 3 is noise).
A change that is meant to move a scene shows the first frame it does (its leg named) — say why that frame and that leg.
(`CMP=a.json,b.json node scripts/probes/replay_probe.mjs` is the strict byte comparison: exit 1 on the first difference.)

**Reading `view_jumps.mjs`**: per recording, the view's turn (the look direction) and its roll a frame — the 99th percentile, the largest, the
frames over 10°, 20°, 45°. `WORST=n` lists the n worst frames with their leg. **Good**: no frame over 45°, the largest no worse than the baseline.

**Reading `replay_health.mjs`**: the gizmo's step a frame (median, 99th, largest, frames over 50 mm and 150 mm), the piece's and the camera's,
the camera's up (its lowest y and the frames below 0), the frames the orbit was driven while the gizmo stayed still, missing values, errors.
**Good**: no gizmo step over 150 mm, no missing value, 0 errors, nothing worse than the baseline without a reason.

**The baselines**:
* `C:/Users/sugit/AppData/Local/Temp/claude/58fcf8122906abb9/b2290347-4989-4dda-a6ab-49506e5270d4/scratchpad/replay_base_276a6c2/` —
  `base_def_s1.json`, `base_def_s0.json`, `base_def_s0bis.json` (the default) and `base_off_*.json` (`chartLayout=0&chartCalm=0`), recorded with
  these moved scripts at `276a6c2` (the tree at `a794693`, docs only after it).
* `…/scratchpad/replay/j_def_*.json`, `j_off_*.json` — the same, recorded by the session's own scripts on the same code (before the move).
* ✅ Checked: the moved scripts' recordings equal `j_def` / `j_off` — five of six identical in every frame; `off_s0bis` differs only in the last
  digit (2.9e-9 at most, from frame 3; `1e-6: never`) — the move changed nothing.
* ⚠ The scratchpad is the session's: a reboot or a clean-up can empty it. If the baselines are gone, re-record them from `276a6c2` with
  `REPO=<a checkout of 276a6c2>`.

## 3. Gate (c) — `tilt_check.mjs`: the tilted pole close in

`bash scripts/probes/tilt_batch.sh "<scene>:<chartLayout> …"` — e.g. `"1:1 0:1 4:1"`. Every run boots the scene (240 frames), then does its legs
with mouse drags (A held for the approach) and prints: the state after each leg; **the largest roll / view turn in ONE frame per leg** (with the
gizmo's largest step, while a turn runs, the orbit's angles against the map's, the piece's direction on the glass, the yaw at the leg's start → end);
the **SUMMARY** line (every recorded frame: the view's largest turn in one frame, in all; tilts made, left; dy holds set); then every change of the
tilt's state (`f<frame> <leg> ap el auto pend tilt zone n up | the verdict`). `WIDTH` (330) cuts the lines.

| mode | what it does | command | about |
|---|---|---|---|
| (default) | the approach in until the automatic tilt's latch is on; dy onto a face holding a pole until a tilt is made; in the tilt a dx, a dy, a dx back; the approach out past the threshold | `bash scripts/probes/tilt_batch.sh "1:1 0:1 4:1"` | 25 – 60 s a scene |
| `MODE=out` (`GZ` m, the top's depth to reach, default 0.33; `OUTPX` px a frame of the approach finger out, default 1; `DX`) | the way out of close in (C3, §8 of `TILTED_POLE_CLOSE_IN.md`): onto the top by dy (the tilt made), the gizmo to GZ, ONE approach drag OUT; prints **THE WAY OUT**: the frame the latch turned off, the view's turn after it (along its path, start to end, 95 % within n frames, at most x° a frame), how far the piece backed out, the frames marked "a turn runs", the gizmo's travel | `MODE=out GZ=0.33 OUTPX=4 bash scripts/probes/tilt_batch.sh "1:1"` | 35 s |
| `MODE=ridge` (`PX`, default 3) | close in, up the front face to the top, ONE long drag up over the ridge (the dy kept: the hold), the dy reversed 45 frames, ONE drag back up; prints the crossings (a yaw jump over 1.5 rad) and in how many readings the dy hold was on after the first | `MODE=ridge bash scripts/probes/tilt_batch.sh "0:1"` | 40 s |
| `MODE=press` (`FACE=top\|bottom`, `NY` 0.8, `PX` 2, `DX`) | FAR out, the gizmo onto a face holding a pole, then a press held still 150 frames: what the press alone turns | `MODE=press FACE=top bash scripts/probes/tilt_batch.sh "0:1 1:1"` | 13 s |
| `MODE=rim` (`RIM` m, 0.2475; `PX` 2) | `Scene_0bis` far out: a slow dx from the rectangle over its end (x = RIM) onto the tip and back; prints the view's turn a frame away from the edge (median) and within 45 mm of it (largest), and a strip of the crossing | `MODE=rim EXTRA="&chartCalm=1" bash scripts/probes/tilt_batch.sh "4:1"` | 20 s |
| `MODE=pole` | far out to the zenith, the approach in there until the automatic tilt is made, the approach out past its threshold | `MODE=pole bash scripts/probes/tilt_batch.sh "1:1"` | 80 s |
| `SHOW=<leg>` (any mode) | the 23 frames round the largest view turn of that leg: turn°, roll°, gizmo mm, the turn's share k, paced, tilt id, pending, blend mm, the direction's ease°, the whole turn° | `SHOW=orbit-dy-up bash scripts/probes/tilt_batch.sh "1:1"` | — |
| `SWITCH=1` (default mode) | the orbited piece switched under the tilt (the test scenes' piece switch): the state before, one frame and 61 frames after | — | — |

**Good**: no EXCEPTION, `errors 0, recErr null`; the largest one-frame turn no worse than the baseline (the one speed of a timed turn is 6.0° a
frame; drags reach 8 – 9°); tilts made = tilts left at the end of a run that ends far out; THE WAY OUT within the one speed (6.0° a frame).
⚠ Where a mode is not meaningful: `out` and `pole` make no tilt on `Scene_0` / `Scene_0bis` (their top is not a level face holding a pole; on
`Scene_0bis` the spit keeps the elevation at 0.5 — `pole` never reaches the zenith); `rim` is `Scene_0bis` only; `ridge` on `Scene_0bis` counts
no "crossing" (the spit turns the yaw continuously; read its SUMMARY's holds instead).

## 4. Gate (d) — `mid_check.mjs` and `across_check.mjs`: `Scene_0bis`'s bottom face (C4)

`bash scripts/probes/mid_batch.sh "<query>|<S0 mm>|<A px>[|IN] …"` — `SCENE` (default 4), `SCRIPT` (default `mid_check.mjs`), `WIDTH` (420).
Both climb the gizmo by 6-frame direction probes (undone) — slow but sure — then make ONE drag and read it.

* **mid_check** (the owner's comment of 2026-11-16): the gizmo onto the triangle under the +x tip at `S0` mm off the bottom face's middle line, then
  ONE drag along the axis toward the body's middle (`PX` px a frame, default 3; a wobble of ±`A` px across, `PERIOD` 40 frames). Prints: the
  places reached; THE WALK (reached the middle or not); **the walk's line**: the side changed n times, timed camera turns, the view's turn in all and
  at most in one frame, frames in a turn, frames with the dy hold; the path every 12 frames (along mm / off the middle mm / side); the verdicts.
  `bash scripts/probes/mid_batch.sh "chartLayout=1&chartCalm=1|2|0 chartLayout=0&chartCalm=0|2|0"` — about 45 s a run.
* **across_check** (`SCRIPT=across_check.mjs`): from the rectangle beside the bottom face (`FROM_SIDE` +1, or −1), ONE drag round the axis across
  the bottom face toward the rectangle beyond (the face's edges at ±94 mm off the middle).
  `SCRIPT=across_check.mjs PX=1 bash scripts/probes/mid_batch.sh "chartLayout=1&chartCalm=1|0|0 chartLayout=0&chartCalm=0|0|0"` — about 50 s a run.
* `SHOW=1` (with `BEFORE` 40, `AFTER` 14, `EVERY` 2, or `FROM` n frames after the walk's start) prints the frames round the first event: along /
  off / side / turning / hold, the view's turn, the camera's heading and look-up, the axis on the glass, the normal. `IN=1` (the 4th field) makes
  the run close in first. `GEOM=1` prints the face map's facets and stops.

**Good** (as C4 was accepted, `TILTED_POLE_CLOSE_IN.md` §9.1): mid — the middle reached, the side changed 0 times, no dy hold in the walk, the view
~76° in all, ≤ 6.2° in a frame; across — nothing at the middle, the half turn at the far edge (one band past it), then the dy hold (the finger must
reverse: "reached the rectangle beyond false" is expected), ≤ 6.6° a frame.

## 5. Gate (e) — `edge_noise.mjs`: a place wobbling across an edge, close in (2.4d)

`bash scripts/probes/edge_batch.sh "<scene>|<query>|<EDGE>|<AMM>|<OFFMM> …"` — `EDGE=top` (a side face's top edge, the face beyond holding the
top pole) or `side` (the vertical edge between two side faces); `AMM` the wobble's half width across the edge in mm on the model; `OFFMM` the run's
distance from the edge (0: on it; a control: 20 – 30); `RUN` frames (default 240); `PARKTILT=1` parks the gizmo by the orbit's angle 1.5 mm
(`PARKMM`) short of the edge, keeping the tilt (else by a half-pixel drag, out of the tilt); `SIGN=-1` the other side edge; `TRACE=1` lists the
approach to the edge frame by frame. It closes in, finds the finger's ways (12 px probes), goes to the edge one pixel a frame, parks, calibrates
(mm across for a unit of the angle), then wobbles the ORBIT's angle (a sine of ±AMM, `PERIOD` 24 frames) — never the finger (the deadband).

`PARKTILT=1 bash scripts/probes/edge_batch.sh "1|chartLayout=1&chartCalm=1|top|2.5|0"` — about 2 – 2.5 minutes a run.

Prints: one pixel in mm; over the edge; parked n mm short; **THE RUN**: how far short / past the gizmo went and how often it crossed; the map's
facet changes, the banded face's, **the tilt made / left**, the square camera's target, timed camera turns, frames with the dy hold; **the view's
turn in all and at most in one frame**; the verdicts; the SUMMARY (every recorded frame, the approach included).
**Good** (2.4d): crossing the edge ~20 times, the tilt made / left 0, the view 0° — the facet under the gizmo may flip (the map), nothing the
player sees may. ⚠ On `Scene_0bis` `EDGE=top` is not meaningful (the spit: the elevation wobble moves nothing; "one unit … = 0 mm").

## 6. THE BASELINE AT `276a6c2`

The code of `276a6c2` (the runs made on `a794693`, one docs commit after it — no code changed). Both switches at their defaults (1) unless the
line says otherwise. "Largest" is the view's largest turn in ONE frame (look and roll, the whole camera frame); "in all" its sum over the run;
tilts and holds from the SUMMARY line (every recorded frame). Deterministic: a rerun of the same code must give the same numbers.

### 6.1 Gate (a)

`npm run verify` at `a794693` (the code of `276a6c2`; this package adds no code under `src` or `tests`): typecheck clean, **162 test files,
2058 vectors passed**, about 3 minutes.

### 6.2 Gate (b) — the replays

| recording | vs `j_*` (the session's) | view turn °/frame: 99th / largest / > 10° / > 20° | roll °/frame: 99th / largest / > 10° / > 20° | gizmo step mm: 99th / largest / > 50 mm | the orbit driven / the gizmo still | camera's up below 0 (frames) |
|---|---|---|---|---|---|---|
| `base_def_s1` | identical 2794 / 2794 | 12.1 / 14.2 / 85 / 0 | 10.2 / 13.8 / 52 / 0 | 70 / 93 / 163 | 1222 / 333 | 429 |
| `base_def_s0` | identical 2794 / 2794 | 11.8 / 15.4 / 77 / 0 | 10.2 / 17.9 / 48 / 0 | 64 / 90 / 141 | 1224 / 496 | 428 |
| `base_def_s0bis` | identical 2794 / 2794 | 10.3 / 14.1 / 40 / 0 | 9.9 / 18.9 / 27 / 0 | 80 / 105 / 138 | 987 / 115 | 32 |
| `base_off_s1` | identical 2794 / 2794 | 12.2 / 14.9 / 85 / 0 | 10.2 / 13.7 / 52 / 0 | 69 / 96 / 160 | 1211 / 326 | 429 |
| `base_off_s0` | identical 2794 / 2794 | 12.1 / 18.9 / 82 / 0 | 10.2 / 14.4 / 54 / 0 | 63 / 89 / 127 | 1234 / 469 | 425 |
| `base_off_s0bis` | 2763 / 2794 identical; 2.9e-9 at most, from frame 3 (`1e-6: never`) — noise | 11.9 / 19.1 / 78 / 0 | 11.2 / 35.0 / 44 / 6 | 71 / 100 / 107 | 1093 / 170 | 46 |

Every recording: 2794 frames, 0 errors, recErr null, no gizmo step over 150 mm, no missing value, no frame over 45°.

### 6.3 Gate (c) — `tilt_check.mjs`

| run | largest (°/frame) | in all (°) | tilts made / left | dy holds set | the run's own verdict |
|---|---|---|---|---|---|
| default `1:1` (Scene_1) | 8.7 | 673 | 2 / 2 | 0 | a tilt (id 1) by dy, left in the tilt's dx; the approach out: auto false |
| default `0:1` (Scene_0) | 8.8 | 2149 | 2 / 2 | 7 | a tilt by dy (normal y −1.00) |
| default `4:1` (Scene_0bis) | 8.9 | 3627 | 0 / 0 | 13 | no tilt (the spit's zone) |
| default `1:0` (chartLayout 0, chartCalm 1) | 8.5 | 661 | 2 / 2 | 0 | a tilt by dy |
| default `0:0` | 12.7 | 683 | 3 / 3 | 0 | a tilt by dy (normal y 0.90) |
| default `4:0` | 26.2 | 3763 | 0 / 0 | 13 | no tilt |
| `MODE=out GZ=0.33 OUTPX=4` `1:1` | 8.0 | 277 | 1 / 1 | 0 | THE WAY OUT: latch off at frame 4; the view 193° along its path (180° start to end), 95 % within 35 frames = 0.58 s, at most 6.0°/frame; the piece backed out 5348 mm; 37 frames "a turn runs"; the gizmo 0 mm |
| `MODE=out GZ=0.33 OUTPX=1` `1:1` | 8.0 | 280 | 1 / 1 | 0 | THE WAY OUT: latch off at frame 13; 196° (180°), 95 % within 41 frames = 0.68 s, at most 6.0°/frame; 1963 mm; 46 frames; the gizmo 0 mm |
| `MODE=out GZ=0.33 OUTPX=4` `0:1` | 8.8 | 2532 | 0 / 0 | 12 | no tilt made (not meaningful); the way out 26°, at most 3.2°/frame |
| `MODE=out GZ=0.33 OUTPX=4` `4:1` | 8.6 | 2673 | 0 / 0 | 12 | no tilt made (not meaningful); the way out 14°, at most 1.8°/frame |
| `MODE=ridge` `0:1` | 8.5 | 641 | 0 / 0 | 2 | crossings 1 + 1; the dy hold on in 54 / 54 and 45 / 45 readings after them |
| `MODE=ridge` `1:1` | 8.5 | 771 | 3 / 3 | 2 | crossings 1 + 1; the hold on in 51 / 51 and 36 / 36 |
| `MODE=ridge` `4:1` | 8.1 | 672 | 0 / 0 | 2 | crossings 0 + 0 (the spit; not a yaw jump) |
| `MODE=press FACE=top` `0:1` | 1.9 | 17 | 0 / 0 | 0 | the press held 150 frames: 0.00°/frame at most |
| `MODE=press FACE=top` `1:1` | 3.0 | 30 | 0 / 0 | 0 | 0.00° |
| `MODE=press FACE=top` `4:1` | 2.9 | 24 | 0 / 0 | 0 | 0.00° |
| `MODE=rim` `4:1` (`EXTRA="&chartCalm=1"`) | 5.7 | 151 | 0 / 0 | 0 | out: x 0.318; back: x 0.088; rim-out: median 0.67°, within 45 mm of the edge 4.92°; rim-back: 1.30°, 3.58° |
| `MODE=pole` `1:1` | 6.6 | 67 | 1 / 1 | 0 | at the zenith el 1.00000; in: tilt 1; out: tilt null, auto false |
| `MODE=pole` `0:1` | 6.9 | 58 | 0 / 0 | 0 | at the zenith; no tilt made in there |
| `MODE=pole` `4:1` | 8.6 | 1776 | 0 / 0 | 8 | not meaningful: the spit keeps el 0.49964 |

### 6.4 Gate (d) — `Scene_0bis`'s bottom face

| run | the walk | largest (°/frame), walk / whole run | in all (°), walk / whole | side changes | timed turns | frames with the dy hold (walk) | tilts | holds set (whole) |
|---|---|---|---|---|---|---|---|---|
| mid, default, `S0` 2 mm | the middle reached (4.8 mm off it), 51 frames | 6.2 / 9.6 | 76 / 960 | 0 | 1 (2 frames) | 0 | 0 / 0 | 1 |
| mid, `chartLayout=0&chartCalm=0`, `S0` 2 mm | NOT reached (−82.3 mm off), 357 frames | 15.2 / 24.0 | 321 / 1413 | 1 | 1 (23 frames) | 309 | 0 / 0 | 3 |
| across, default, `PX` 1 | the half turn past the far edge (−116.7 mm), then held; 1017 frames | 6.6 / 7.4 | 241 / 788 | 1 | 2 (31 frames) | 936 | 0 / 0 | 2 |
| across, `chartLayout=0&chartCalm=0`, `PX` 1 | the half turn in the face (−56.9 mm), then held; 1017 frames | 6.0 / 6.5 | 231 / 821 | 1 | 1 (30 frames) | 942 | 0 / 0 | 2 |

### 6.5 Gate (e) — `edge_noise.mjs` (both switches 1, `RUN` 240)

| run | parked | the run: short → past, crossings | facet changes | the tilt made / left | square target flips | timed turns | dy hold frames | view in the run: in all / largest | SUMMARY: largest / in all / tilts made, left / holds |
|---|---|---|---|---|---|---|---|---|---|
| `PARKTILT=1`, Scene_1 top, ±2.5 mm | 1.7 mm short, tilt 1 | 4.2 → 0.8 mm, 20 | 20 | 0 | 0 | 0 | 0 | 0° / 0.0° | 6.1 / 134 / 1, 0 / 0 |
| `PARKTILT=1`, Scene_0 top, ±2.5 mm | 1.6 mm short, no tilt | 4.1 → 0.9 mm, 20 | 0 | 0 | 0 | 0 | 0 | 0° / 0.0° | 6.0 / 86 / 0, 0 / 0 |
| `PARKTILT=1`, Scene_0bis top | not meaningful (never over the edge; one unit = 0 mm) | — | 1 | 0 | 0 | 0 | 0 | 0° / 0.0° | 8.6 / 2715 / 0, 0 / 12 |
| Scene_1 side, ±3 mm | 7.1 mm short, no tilt | 10.1 mm short → 4.1 mm short, 0 (the wobble too small: never reaches the edge) | 0 | 0 | 0 | 0 | 0 | 0° / 0.0° | 6.0 / 224 / 0, 0 / 0 |
| Scene_0 side, ±3 mm | 7.1 mm short, no tilt | 10.1 → 4.1 mm short, 0 (the same) | 0 | 0 | 0 | 0 | 0 | 0° / 0.0° | 6.1 / 217 / 0, 0 / 0 |
| Scene_0bis side, ±3 mm | not meaningful: the spit's yaw moves nothing across ("one unit … = -0 mm"), so the wobble's amplitude explodes (243 mm short → 218 mm past) | 105 | 207 | 0 | 204 | 0 | 0 | 1443° / 6.5° | 6.5 / 1499 / 0, 0 / 0 |
| **Scene_1 side, ±10 mm** (use this one) | 7.1 mm short, no tilt | 17.1 mm short → 2.9 mm past, 20 | 20 | 0 | 0 | 0 | 0 | 0° / 0.0° | 6.0 / 224 / 0, 0 / 0 |
| **Scene_0 side, ±10 mm** (use this one) | 7.1 mm short, no tilt | 17.1 mm short → 2.3 mm past, 20 | 20 | 0 | 0 | 0 | 0 | 0° / 0.0° | 6.1 / 217 / 0, 0 / 0 |

Commands of this table: `PARKTILT=1 bash scripts/probes/edge_batch.sh "1|chartLayout=1&chartCalm=1|top|2.5|0 0|…|top|2.5|0 4|…|top|2.5|0"`
(~400 s for three), `bash scripts/probes/edge_batch.sh "1|chartLayout=1&chartCalm=1|side|10|0 0|chartLayout=1&chartCalm=1|side|10|0"` (~120 s).
⚠ For a side edge use `AMM` ≥ 10: the park by a half-pixel drag stops ~7 mm short, and ±3 mm never reaches the edge.
