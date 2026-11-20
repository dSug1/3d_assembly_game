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
* **A probe and its server end by themselves** (2026-11-16, step 2.5 — an interrupted run had left `edge_noise.mjs`, its Chrome and the server on 5191
  alive past the probe's 8-minute watchdog). Why: the watchdog was a timer INSIDE the probe; killing the tool's command (a Windows tree kill) did not
  reach the Git Bash children (their Windows parents are MSYS stubs), it killed the pipe's reader (`| cut`), and the probe's next write to that pipe
  blocked its event loop — a blocked loop never fires its timer; the batch's shell waited on the pipeline, so `server_stop` never ran. Now
  (`probe_guard.mjs`): each probe starts a guard in a process of its own (launched detached, so no tree kill reaches it) that, at the deadline (the
  watchdog's + 30 s) or as soon as the probe's parent shell is gone, kills Chrome's tree and the probe and removes the profile; the batch scripts stop
  the server on ANY exit (`trap server_stop EXIT`, INT / TERM / HUP turned into an exit) and start a detached server guard that stops whatever listens
  on 5191 once the batch's shell is gone (or after 90 minutes). Measured (RND5, 2026-11-16): a tree kill of a running `tilt_batch.sh` left the batch's
  shell, the server, the probe and its Chrome alive (the incident reproduced); the probe, its work done, stayed blocked; at the deadline its guard killed
  Chrome, the probe ended, the batch went on and stopped its server — no process, no profile left.
* **Outputs never go into the repository.** The batch scripts write (the dev server's log, the replays' recordings) to `$OUT`, by default
  `<the OS temp folder>/orbit_gates_out` (`node -p "require('os').tmpdir()"`). A replay recording is 3 – 11 MB: keep few, delete what is no longer
  needed. The probes themselves print to stdout only — redirect to a file in `$OUT` or a scratchpad to keep a run.
* `CHROME` overrides Chrome's path (default `C:/Program Files/Google/Chrome/Application/chrome.exe`); `REPO` makes the dev server serve another
  checkout (the probes still run from this folder) — that is how a replay of an older build is recorded.
* **Scenes**: `Scene_0` the heptagon (`sceneIndex=0`), `Scene_0bis` the heptagon with two pyramid tips (`sceneIndex=4`), `Scene_1` the cube
  (`sceneIndex=1`). ⛔ Never run or judge `Scene_2` here.
* **The switches** `chartLayout` and `chartCalm` were DELETED at step 2.5 (2026-11-16) with the game before the charts: no "off" replay, no `S:0`
  leg (`tilt_batch.sh` refuses the `"<scene>:<n>"` form); a URL that still carries one boots the default game, the key reported on the HUD
  (`chartLayout: not an overridable tunable`). Their words and baselines: [`../../Claude/40_RENDER_SCENE/history/2026-11-16_orbit_gates_off_baselines.md`](../../Claude/40_RENDER_SCENE/history/2026-11-16_orbit_gates_off_baselines.md).

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
OUT=<folder> EXTRA=""                             bash scripts/probes/replay_batch.sh new_def     # the game: new_def_s1/_s0/_s0bis.json
node scripts/probes/replay_cmp.mjs  <baseline>/base_def_s1.json <folder>/new_def_s1.json             # per scene
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
  `base_def_s1.json`, `base_def_s0.json`, `base_def_s0bis.json` (the default), recorded with these moved scripts at `276a6c2` (the tree at
  `a794693`, docs only after it) — ⛔ `base_off_*.json`: the game before the charts, deleted at step 2.5 ([the history note](../../Claude/40_RENDER_SCENE/history/2026-11-16_orbit_gates_off_baselines.md)).
* `…/scratchpad/replay/j_def_*.json` — the same, recorded by the session's own scripts on the same code (before the move).
* ✅ Checked: the moved scripts' recordings equal `j_def` — identical in every frame — the move changed nothing.
* `…/scratchpad/replay_base_before_2_5_b/base_def_*.json` — the default game at `0e758a7` (the code of `d917d04`), the baseline step 2.5 was replayed
  against (identical after it, RND5).
* ⚠ The scratchpad is the session's: a reboot or a clean-up can empty it. If the baselines are gone, re-record them from `276a6c2` with
  `REPO=<a checkout of 276a6c2>`.

## 3. Gate (c) — `tilt_check.mjs`: the tilted pole close in

`bash scripts/probes/tilt_batch.sh "<scene> …"` — e.g. `"1 0 4"`. Every run boots the scene (240 frames), then does its legs
with mouse drags (A held for the approach) and prints: the state after each leg; **the largest roll / view turn in ONE frame per leg** (with the
gizmo's largest step, while a turn runs, the orbit's angles against the map's, the piece's direction on the glass, the yaw at the leg's start → end);
the **SUMMARY** line (every recorded frame: the view's largest turn in one frame, in all; tilts made, left; dy holds set); then every change of the
tilt's state (`f<frame> <leg> ap el auto pend tilt zone n up | the verdict`). `WIDTH` (330) cuts the lines.

| mode | what it does | command | about |
|---|---|---|---|
| (default) | the approach in until the automatic tilt's latch is on; dy onto a face holding a pole until a tilt is made; in the tilt a dx, a dy, a dx back; the approach out past the threshold | `bash scripts/probes/tilt_batch.sh "1 0 4"` | 25 – 60 s a scene |
| `MODE=out` (`GZ` m, the top's depth to reach, default 0.33; `OUTPX` px a frame of the approach finger out, default 1; `DX`) | the way out of close in (C3, §8 of `TILTED_POLE_CLOSE_IN.md`): onto the top by dy (the tilt made), the gizmo to GZ, ONE approach drag OUT; prints **THE WAY OUT**: the frame the latch turned off, the view's turn after it (along its path, start to end, 95 % within n frames, at most x° a frame), how far the piece backed out, the frames marked "a turn runs", the gizmo's travel | `MODE=out GZ=0.33 OUTPX=4 bash scripts/probes/tilt_batch.sh "1"` | 35 s |
| `MODE=ridge` (`PX`, default 3) | close in, up the front face to the top, ONE long drag up over the ridge (the dy kept: the hold), the dy reversed 45 frames, ONE drag back up; prints the crossings (a yaw jump over 1.5 rad) and in how many readings the dy hold was on after the first | `MODE=ridge bash scripts/probes/tilt_batch.sh "0"` | 40 s |
| `MODE=press` (`FACE=top\|bottom`, `NY` 0.8, `PX` 2, `DX`) | FAR out, the gizmo onto a face holding a pole, then a press held still 150 frames: what the press alone turns | `MODE=press FACE=top bash scripts/probes/tilt_batch.sh "0 1"` | 13 s |
| `MODE=rim` (`RIM` m, 0.2475; `PX` 2) | `Scene_0bis` far out: a slow dx from the rectangle over its end (x = RIM) onto the tip and back; prints the view's turn a frame away from the edge (median) and within 45 mm of it (largest), and a strip of the crossing | `MODE=rim bash scripts/probes/tilt_batch.sh "4"` | 20 s |
| `MODE=pole` | far out to the zenith, the approach in there until the automatic tilt is made, the approach out past its threshold | `MODE=pole bash scripts/probes/tilt_batch.sh "1"` | 80 s |
| `SHOW=<leg>` (any mode) | the 23 frames round the largest view turn of that leg: turn°, roll°, gizmo mm, the turn's share k, paced, tilt id, pending, blend mm, the direction's ease°, the whole turn° | `SHOW=orbit-dy-up bash scripts/probes/tilt_batch.sh "1"` | — |
| `WORSTF=n` (any mode; `TURNONLY=1`) | ⛔ REMOVED with package A's revert (`6e56dfc`; the probe as it was: `a1a52f0`). (2026-11-17, package A) a `TURNS` line — the turns, the frames with a transition's turn running, the largest one-frame turn while one runs and with none — then the n frames of the largest whole turn (only those in a turn with `TURNONLY`): the turn's share before / after, paced, tilt, pending, blend, ease, whole, hold, the square camera's angle to its target and its share | `WORSTF=4 TURNONLY=1 bash scripts/probes/tilt_batch.sh "1 0 4"` | — |
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
  `bash scripts/probes/mid_batch.sh "idleOrbitOn=0|2|0"` — about 45 s a run (the first field: any tunables to set in the URL).
  ⭐ (2026-11-17, package R1) its setup mended: since package A the 6-frame direction probes, pressed at the glass's centre, landed on a quad of the
  held piece — each read as a quad's TAP (a roll of the piece), the orbit never moved, the gizmo was never parked (`S0` 24 – 27 mm instead of 2). Now
  they press at (300, 600), off the piece, and the climb ends with a FINE PARK by the orbit's own yaw (a secant, within 1 mm of `S0`; far out one drag
  moves the gizmo ~16 mm across). Its line: `at 2 mm from the middle: true (the climb …, then n fine steps of the orbit's yaw)`. At `a1a52f0`: parked
  3.0 mm off; the walk reaches the middle, the side changed 0 times, one turn (the free face's entry, 5 frames), 72° in all, 6.2° at most a frame.
* **across_check** (`SCRIPT=across_check.mjs`): from the rectangle beside the bottom face (`FROM_SIDE` +1, or −1), ONE drag round the axis across
  the bottom face toward the rectangle beyond (the face's edges at ±94 mm off the middle).
  `SCRIPT=across_check.mjs PX=1 bash scripts/probes/mid_batch.sh "idleOrbitOn=0|0|0"` — about 50 s a run.
* `SHOW=1` (with `BEFORE` 40, `AFTER` 14, `EVERY` 2, or `FROM` n frames after the walk's start) prints the frames round the first event: along /
  off / side / turning / hold, the view's turn, the camera's heading and look-up, the axis on the glass, the normal. `IN=1` (the 4th field) makes
  the run close in first. `GEOM=1` prints the face map's facets and stops.

**Good** (as C4 was accepted, `TILTED_POLE_CLOSE_IN.md` §9.1): mid — the middle reached, the side changed 0 times, no dy hold in the walk, the view
~76° in all, ≤ 6.2° in a frame; across — nothing at the middle, the half turn at the far edge (one band past it), then the dy hold (the finger must
reverse: "reached the rectangle beyond false" is expected), ≤ 6.6° a frame.

* **ridge_check** (`SCRIPT=ridge_check.mjs`, step C5 — `TILTED_POLE_CLOSE_IN.md` §13): `Scene_0bis`'s TOP. `MODE=tip` (`TIP` +1 / −1, `S0` mm off
  the middle): the gizmo onto the triangle above the tip's end, ONE drag along the axis toward the body's middle, then ONE drag back (`BACK=0`: none);
  `MODE=across` (`FROM_SIDE` ±1): from a ridge face ONE drag round the axis over the ridge, then ONE back. `WALKDIR=dx,dy` forces the finger's way
  (else the 6-frame probes pick it). Per drag: the side's changes, the timed turns, the dy hold (set / ended, where), the view's turn, the gizmo still,
  and the gizmo's way on the glass against the finger's (sideways 60 – 120°, against > 120°: a finger axis swapped under the finger); the path every
  `EVERY` frames with the axis's angle on the glass and how far the view looks down. ~60 s a run.
  `SCRIPT=ridge_check.mjs MODE=tip TIP=1 bash scripts/probes/mid_batch.sh "idleOrbitOn=0|2|0|IN"` (the 4th field: close in).
  `TRACE=n` — ⛔ REMOVED with package A's revert (`6e56dfc`; as it was: `a1a52f0`) — (2026-11-17, package A): per drag, the frames of its first camera turn (3 before, n in all) — the view's turn, the turn's share and
  angle, the ease, the square camera.

## 5. Gate (e) — `edge_noise.mjs`: a place wobbling across an edge, close in (2.4d)

`bash scripts/probes/edge_batch.sh "<scene>|<query>|<EDGE>|<AMM>|<OFFMM> …"` — `EDGE=top` (a side face's top edge, the face beyond holding the
top pole) or `side` (the vertical edge between two side faces); `AMM` the wobble's half width across the edge in mm on the model; `OFFMM` the run's
distance from the edge (0: on it; a control: 20 – 30); `RUN` frames (default 240); `PARKTILT=1` parks the gizmo by the orbit's angle 1.5 mm
(`PARKMM`) short of the edge, keeping the tilt (else by a half-pixel drag, out of the tilt); `SIGN=-1` the other side edge; `TRACE=1` lists the
approach to the edge frame by frame. It closes in, finds the finger's ways (12 px probes), goes to the edge one pixel a frame, parks, calibrates
(mm across for a unit of the angle), then wobbles the ORBIT's angle (a sine of ±AMM, `PERIOD` 24 frames) — never the finger (the deadband).

`PARKTILT=1 bash scripts/probes/edge_batch.sh "1|idleOrbitOn=0|top|2.5|0"` — about 2 – 2.5 minutes a run.

Prints: one pixel in mm; over the edge; parked n mm short; **THE RUN**: how far short / past the gizmo went and how often it crossed; the map's
facet changes, the banded face's, **the tilt made / left**, the square camera's target, timed camera turns, frames with the dy hold; **the view's
turn in all and at most in one frame**; the verdicts; the SUMMARY (every recorded frame, the approach included).
**Good** (2.4d): crossing the edge ~20 times, the tilt made / left 0, the view 0° — the facet under the gizmo may flip (the map), nothing the
player sees may. ⚠ On `Scene_0bis` `EDGE=top` is not meaningful (the spit: the elevation wobble moves nothing; "one unit … = 0 mm").

## 6. THE BASELINE AT `276a6c2`

⭐ (2026-11-17, LF2) LF2's timing rule was built (`e7ff2ed`) and REVERTED (`cb89bdd`): these rows stand for the current code; §8 records what the rule moved.

⭐ (2026-11-18, DH `1562bd1`) holds set: mid_check 1 → 0, ridge_check MODE=across 3 → 2 (a hold set with no dy pushing is no longer set — `DY_HOLD_REVERSAL.md`, [the spec](../../Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md) §6); every other row of 6.3 – 6.4 identical.

The code of `276a6c2` (the runs made on `a794693`, one docs commit after it — no code changed). Both switches at their defaults (1) — ⛔ the rows
of the switches off moved at step 2.5 to [the history note](../../Claude/40_RENDER_SCENE/history/2026-11-16_orbit_gates_off_baselines.md). ⭐ Step 2.5
(2026-11-16) recorded every default gate below again at its base and after it: equal to these rows (RND5). "Largest" is the view's largest turn in ONE frame (look and roll, the whole camera frame); "in all" its sum over the run;
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

Every recording: 2794 frames, 0 errors, recErr null, no gizmo step over 150 mm, no missing value, no frame over 45°.

### 6.3 Gate (c) — `tilt_check.mjs`

| run | largest (°/frame) | in all (°) | tilts made / left | dy holds set | the run's own verdict |
|---|---|---|---|---|---|
| default `1:1` (Scene_1) | 8.7 | 673 | 2 / 2 | 0 | a tilt (id 1) by dy, left in the tilt's dx; the approach out: auto false |
| default `0:1` (Scene_0) | 8.8 | 2149 | 2 / 2 | 7 | a tilt by dy (normal y −1.00) |
| default `4:1` (Scene_0bis) | 8.9 | 3627 | 0 / 0 | 13 | no tilt (the spit's zone) |
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
| across, default, `PX` 1 | the half turn past the far edge (−116.7 mm), then held; 1017 frames | 6.6 / 7.4 | 241 / 788 | 1 | 2 (31 frames) | 936 | 0 / 0 | 2 |

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

Commands of this table: `PARKTILT=1 bash scripts/probes/edge_batch.sh "1|idleOrbitOn=0|top|2.5|0 0|…|top|2.5|0 4|…|top|2.5|0"`
(~400 s for three), `bash scripts/probes/edge_batch.sh "1|idleOrbitOn=0|side|10|0 0|idleOrbitOn=0|side|10|0"` (~120 s).
⚠ For a side edge use `AMM` ≥ 10: the park by a half-pixel drag stops ~7 mm short, and ±3 mm never reaches the edge.

## 7. Gate (f) — the level face's entry (`level_entry_*`, package LF1 — `LEVEL_FACE_ENTRY.md` §10)

The study's walks (2026-11-17, `LEVEL_FACE_ENTRY.md` §3, §4), ported: `level_entry_check.mjs` (one walk a run, every frame recorded),
`level_entry_analyse.mjs` (per walk: the crossings into / out of the level face with their timed turn and the roll in the 20 frames before the edge; the
drift of a straight dy; EVERY timed turn — roll on the glass, frames, largest frame, THE ONE ROTATION from the frame before the turn to its last frame,
THE PATH summed frame by frame, their ratio, ⚠ PATH when the path is over 1.15 × the one rotation + 5°: package A's lesson,
`BOTTOM_FACE_CIRCLE_REGRESSION.md` §5; and the FREE ROLL — the largest roll in ONE frame outside every timed turn: a picture turned by the finger's
place is no timed turn, and LF1's (iv′) was reverted on it, 21° in a frame), `level_entry_table.mjs` (one line per walk, several runs side by side, then the path gate turn by turn:
"← WORSE" where a later run's ratio is over the first's by more than 0.02).

```bash
OUT=<folder> EXTRA="" bash scripts/probes/level_entry_batch.sh <tag> a        # Scene_0 close in: 6 walks, ~2 min
OUT=<folder> EXTRA="" bash scripts/probes/level_entry_batch.sh <tag> b        # Scene_0bis: 27 walks, ~10 min (run it in the background, one at a time)
OUT=<folder> bash scripts/probes/level_entry_batch.sh <tag> b_ccw_p_far b_dy_x190   # any walks by name
node scripts/probes/level_entry_table.mjs <base>/<tag>_analysis.txt <new>/<tag2>_analysis.txt
```

* **Mode a** (`Scene_0`, close in 0.651, 1 px a frame): `a_x190`, `a_xm190`, `a_x0` — down the lower front face near +x, −x, the middle, then across
  the bottom; `a_top_x190`, `a_top_xm190` — up to a top face near an end, then down off it (the level face there is the top's: `INV=1 NY=0.85`);
  `a_fast_x190` — the +x walk at 3 px a frame. Read: the entry's `IN` line (`before edge: roll … in 20 fr` and the turn's roll), the `OUT` line's
  `rollW … -> …` (the picture off upright after the far edge).
* **Mode b** (`Scene_0bis`, 2 px a frame): `b_<ccw|cw>_<p|m>_<far|d736|d515|close>` — two loops round the corner of the bottom, the lower front
  rectangle and a tip's two triangles, 45 mm round it, at the +x (`p`) / −x (`m`) tip, far out, at approach 0.736 (`HALFN=7`), 0.515 (`HALFN=20`) and
  close in (0.651, the latch on); ccw = rectangle → bottom → bottom triangle → front triangle; `b_back_*` in near the end and back out there,
  `b_backm_*` in near the end and out in the middle, `b_far_*` across to the far edge and back (far out, both tips; `b_back_p_d736`,
  `b_back_p_close`); `b_ccw_p_far_px4` (4 px a frame); `b_dy_x190`, `b_dy_xm190` — a straight dy down the rectangle at x ±190 mm and across the
  bottom (the entry's turn, the drift: x after the dy − x at the entry, and − the aimed x, the study's reading).
* ⚠ `b_ccw_p_far_px4`: at 4 px a frame the probe's steering dithers on the bottom / triangle edge (119 turns of nothing, 2 frames each, roll 0°):
  a probe artefact, its real turns are read alone (the table counts the others).
* Deterministic: the study's recordings (`e252d0f`, the same code) and this gate's at `a9b061f` are identical frame for frame.

### 7.1 The baseline at `a9b061f` (the code of the live `6c0a165`)

Turns as roll on the glass / frames, in order; the study's figures (`LEVEL_FACE_ENTRY.md` §3, §4.1, §4.3) all reproduced to the tenth of a degree.

| walk (mode a) | the entry: roll before the edge (20 fr) / the turn's roll | the far edge's turn | the picture after it (off upright) | path ⚠ |
|---|---|---|---|---|
| `a_x190` | **−11.1°** / **13.2°** (9 fr) | 189° (29 fr) | −12.3° | the far edge: 208.5° for 172.3° (1.21) |
| `a_xm190` | 11.8° / −9.4° (9 fr) | 168° (29 fr) | 9.3° | — |
| `a_x0` | 0.4° / 1.9° | 175° (30 fr) | −1.5° | — |
| `a_top_x190` / `a_top_xm190` | the roll before the top's edge −13.1° / 14.0° (no timed turn) | — | — | — |
| `a_fast_x190` | 2.0° / 2.5° | 182° | −8.9° | — |

| walk (mode b) | timed turns (roll / frames) | worst path ratio |
|---|---|---|
| `b_ccw_p_far` / `b_ccw_p_d736` | +32/7, −83/15, +25/6, −83/15 (two opposite turns a loop) | 1.10 |
| `b_cw_p_far` / `b_cw_p_d736` | +69/13 a loop (the entry 0°) | 1.07 |
| `b_ccw_p_d515` | **+273/18 a loop, 128° in ONE frame** | ⚠ 3.36 |
| `b_cw_p_d515` | +83/17 a loop | ⚠ 1.26 |
| `b_ccw_p_close` | −25/4, −61/14, then **+263/18** | ⚠ 2.48 |
| `b_cw_p_close` | +83/17, +3/11, +83/17 | 1.15 |
| `b_ccw_m_far` / `b_ccw_m_d736` | −31/7, +83/15, −24/6, +83/15 | 1.10 |
| `b_cw_m_far` / `b_cw_m_d736` | −62/12 a loop | 1.09 |
| `b_ccw_m_d515` / `b_ccw_m_close` | +25/4, +60/14 a loop | ⚠ 1.28 / 1.16 |
| `b_cw_m_d515` | −84/17 a loop | ⚠ 1.38 |
| `b_cw_m_close` | **+257/17**, +3/11, **+257/17** — the long way round at the −x tip too | ⚠ 2.40 |
| `b_back_p_far` / `b_back_p_d736` / `b_back_m_far` | +32/7, −32/7 / the same / −31/7, +32/7 | 1.10 |
| `b_backm_p_far` / `b_backm_m_far` | +32/7, 1.4° / −31/7, −2/2 | 1.10 |
| `b_far_p_far` / `b_far_m_far` | +32/7, 208/25, −24/6, 143/25 / −31/7, 144/25, +31/7, −136/24 | ⚠ 1.42 (the 208°) / 1.10 |
| `b_ccw_p_far_px4` | +36/8, −89/17, +43/9, −89/17 | 1.10 |
| `b_back_p_close` | −2/9 | 1.00 |
| `b_dy_x190` / `b_dy_xm190` | the entry **+45/9** / −37/8; the far edge 205/25 / 163/28; drift −8 mm (−15 from 190) / +26 mm (+43 from −190) | ⚠ 1.37 (the 205°) / 1.09 |

The other gates at `a9b061f`, for the record: the replays identical frame for frame to the study's (`e252d0f`); `tilt_check` "1 0 4" 8.7° / 8.8° /
8.9° at most a frame; the ridge "0 4" 8.5° / 8.1°; `mid_check` the middle reached, 1 turn (2 frames), 76°, 6.2° at most a frame (9.3° in the whole
run); `across_check` 2 turns (31 frames), 241°, 6.6° at most a frame, the half turn past the far edge then the hold.

### 7.2 At `3ef7ba7` ((A), LF1 — `LEVEL_FACE_ENTRY.md` §10.2): the next packages' base

**Mode a** (`Scene_0` close in) — every walk: the roll before the edge 0.0° (before: −11.1° / 11.8° near the ends, 0.4° in the middle, −13.1° / 14.0°
off a top face; 2.2° at 3 px a frame), the edge's turn 2.3° (9 frames), the far edge's half turn 181° in 31 frames (path 201.5° for 180.0°, 1.12),
the picture after it −1.9° off upright; the largest free roll 1.2° (before: 1.2° – 5.3°). **Mode b** (`Scene_0bis`): all 27 walks identical frame
for frame to `a9b061f` (the table of §7.1 stands). The free roll at `a9b061f` = at `3ef7ba7`, mode b: 0.3° (in and back close in) – 4.4° (close in,
0.515); far out 0.9° – 3.3°. The replays: `Scene_0bis` identical, `Scene_1` 11 frames in the last digits (≤ 4.3e-7), `Scene_0` another play from
frame 1143 (drag 17; the largest view turn 15.4°, roll 18.2°). `tilt_check` 8.7° / 8.8° / 8.9°, the ridge 8.5° / 8.1°; `mid_check` and
`across_check` NOT rerun at `3ef7ba7` (`Scene_0bis` is untouched by (A): its replay and its 27 walks identical).
⛔ (iv′) (`069682a`, reverted `fa72bab`): its runs are recorded in `LEVEL_FACE_ENTRY.md` §10.3 — read the FREE ROLL column first (21.4° there).

### 7.3 The free-roll gate of the silent entry (2026-11-18, package ES — `LEVEL_FACE_ENTRY.md` §15 gate 5, §16; not built, the base `bc867a0`)

```bash
OUT=<f> bash scripts/probes/level_entry_batch.sh <tag> b c                               # c: the straight dy at 4 and 6 px a frame, both ends
node scripts/probes/level_entry_worst.mjs <base>/<t>_b_cw_p_far.json <new>/<t2>_b_cw_p_far.json  # any recording with t, c, up, mix (a mid DUMP too)
node scripts/probes/level_entry_cmp.mjs   <base>/<t>_b_cw_p_far.json <new>/<t2>_b_cw_p_far.json  # frame for frame (the switch at 0)
```

`level_entry_worst.mjs` prints the FREE ROLL against the base's + 6° and the whole walk's WORST FRAME against the base's + 1°, and whether the worst
frame falls in a timed turn. `mid_check`'s whole run: `DUMP=<f>/mid bash scripts/probes/mid_batch.sh "idleOrbitOn=0|2|0"`, then the reader on
`<f>/mid_1.json`. The base at `bc867a0` (the session scratchpad's `es/base`): far out the free roll 1.1° – 2.5° on the loops and the walks back,
3.3° at 4 px, 4.3° – 4.4° on the straight dy, 5.2° over `mid_check`'s run; the worst frame 6.9° – 7.9° on the loops, 9.3° `mid_check`, 9.0° – 10.9°
the straight dy. ES's four versions against it: `LEVEL_FACE_ENTRY.md` §16 (recordings `es/def` = v1, `es/v2` … `es/v4`, `es/off` the switch at 0).
Fix round 1 (v5 – v7, recordings `es2/v5` … `es2/v7`): read also the 4 px corner loop's `LOOP 0` line in the analysis (`awk '/^=== /{w=$2}
w=="b_ccw_p_far_px4" && /LOOP/'`) — the number of turns, their |roll| in all and the frames the gizmo is held. Each frame can pass while the dither
makes dozens of 6° turns (v7: 61 turns, 442°, 67 frames held; the base 118, 330°, 21).

## 8. Gate (g) — every timed turn, base against new (`turn_rec.mjs`, `turn_table.mjs`, package LF2 — `LEVEL_FACE_ENTRY.md` §11)

Package A's lesson on every gate: a turn is judged by its path, not only by its speed. `DUMP=<prefix>` on any batch (`tilt_batch.sh`, `mid_batch.sh`,
`replay_batch.sh`) records every frame of each run besides the probe's own readings (`<prefix>_s<scene>.json`, `<prefix>_<n>.json`,
`<prefix>_<recording>.json`); `level_entry_check.mjs` records the same fields. Then, the same run at a base and now:

```bash
OUT=<base> DUMP=<base>/td bash scripts/probes/tilt_batch.sh "1 0 4"      # at the base; then the same with OUT=<new>
node scripts/probes/turn_table.mjs <base>/td_s1.json <new>/td_s1.json     # pairs: base, new [, base2, new2 …]
```

Per turn (a transition's turn `mix`, paced `time` / `mm` / `out`; the square camera's own turn `sq`; `mix+sq` both): its whole base → now, frames
base → now and the rule's, one rotation, path, ratio, the largest frame, THE SHAPE (the largest angle between the two pictures at the same fraction of
the path) and the start. Flags: `⚠PATH` (path over 1.15 × one + 5°), `RATIO+`, `PACE+` (a frame over the turn's own pace + 2°; `sq` / `mix+sq` at the
one speed), `NEW ONLY` / `BASE ONLY`. ⚠ Turns are paired in order within a leg: once a walk has diverged (a longer hold), read the shape of the first
turns only.

**At `e7ff2ed` (LF2) against `0ab1f9f`** — ⛔ a RECORD: the rule is reverted (`cb89bdd`, `LEVEL_FACE_ENTRY.md` §11.2), the code is `0ab1f9f`'s again. The figures of §6 and §7 stand for the code before LF2; these moved (the rest is identical, frame for frame
where the walk is): `tilt_check` `MODE=out OUTPX=4` `Scene_1` the way out 95 % within 35 → 24 frames, at most 6.0° → 9.0° a frame (the rule's half
turn); `MODE=pole` `Scene_0bis` 8.6° → 10.9°; `across_check` 7.4° → 9.9° a frame, the half turn 30 → 20 frames; `mid_check` the walk 1 turn, 2 → 11
frames, 6.2° → 5.8° (the setup on another track: the run's holds 1 → 4, its largest 9.3° → 6.9°); `ridge_check` across 7.4° → 10.0°; `level_entry` b far
out and at 0.736 every entry 6 – 7 → 15 – 16 frames, the far edge's half turns 25 → 21, `b_far_p_far`'s way back now drawn the long way (−208°, 1.43 —
LF3's drawing); the replays: `Scene_1` identical, `Scene_0` another play from frame 1398 (the way out), `Scene_0bis` from frame 315 (the largest view
turn 14.1° → 11.8°). With `EXTRA="&tiltMinMs=0&tiltMaxMs=0"` the three replays are identical to `0ab1f9f` in every frame. The recordings: the session
scratchpad's `lf2/base`, `lf2/def` (a scratch folder).

## 9. Gate (h) — the FAST walks (`fast_walk_*`, package FO1 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §4, §6)

The fast orbit's gate (G4, G6): a fast finger crossing many edges. `fast_walk_check.mjs` (one walk a run, every frame recorded), `fast_walk_analyse.mjs`
(the reading), `fast_walk_table.mjs` (base against new), `fast_walk_drift.mjs` (no drift), run by `fast_walk_batch.sh`.

```bash
OUT=<folder> EXTRA="" bash scripts/probes/fast_walk_batch.sh <tag> all               # 23 walks, about 15 minutes
OUT=<folder> REC=1 DRIFT=1 bash scripts/probes/fast_walk_batch.sh <tag> all          # + each walk replayed for G4 (ii): about 30 minutes
node scripts/probes/fast_walk_table.mjs <base>/fw_f_edge_px20.json <new>/<tag>_f_edge_px20.json   # pairs: base, new [, …]
```

* **The steering.** The gizmo is steered to targets round the heptagon's long axis (x along it, the angle round it) — the level-entry gate's corner
  targets (§7) — so the route is the targets' whatever the pace. A leg goes at `LPX` px a frame toward its target, read on the gizmo's raw point
  (`asmG`) led by its last step × 2.5 (the raw point trails a fast finger by the map's catch-up and the piece's spring: 2 – 3 frames), until the led
  place has PASSED the target and the gizmo is on the target's face; the legs are CHAINED (the finger stays down from target to target, lifted only at the
  glass's border and at the end, each lift after 6 still frames: no coast). The start leg is slow (2 px a frame) and is read apart (`to-start`).
* ⚠ **What the pace means.** Far out one px of finger is about 2 – 3 mm of surface: at 20 px a frame a corner loop (about 90 mm a leg) is 2 – 4 frames a
  leg, and the route is the targets' only to within a frame's travel — the faces crossed are printed per loop (`F B T U F` is the loop as meant; a
  loop that cuts or overshoots a face shows it). At 30 px a frame the last loop of some walks wanders (e.g. `f_ccw_p_far_px30` loop 2). The zigzag's
  targets are 10 mm each side of the edge and `:pass` (reached once crossed, never slowed): at 20 px a frame it overshoots to 30 – 40 mm.
* **The walks.** `f_<ccw|cw>_<p|m>_<far|d736>_px<20|30>` — `Scene_0bis`, the corner loops (rectangle → bottom → bottom triangle → front triangle, and
  back the other way), three loops, at the +x / −x tip, far out / approach 0.736; `f_edge_px<2|8|20>` — the bottom face's long edge at its middle (x 0),
  six crossings 10 mm each side (R1, `POLAR_ORBIT_CLEANUP.md` §9.7: no oscillation at an edge); `f_far_p_px20` — across the bottom to its far edge and
  back; `f_ridge_px20` — over the top ridge and back (a half turn); `f_s0_up_px20` (`Scene_0`) and `f_s1_over_px20` (`Scene_1`, the cube up over its top
  and down its back face, and back) — far out, two edges and back.
* **The reading** (per walk `WALK` and per loop): frames; `still <90 / ≥90` — the frames the gizmo stood still (under 0.05 mm) while a turn that HOLDS it
  ran, by the turn's size at its first known frame (`LIMIT`, 90; a free turn with the gizmo still — the finger's own stop — counted apart, `stillFree`;
  `fast_walk_table.mjs` with `ALLOW_HELD=1` lists a hold under the limit without flagging it, for a build with a fallback that holds); the picture's TOTAL TURNING (each frame's rotation summed); its REVERSALS (the roll on the glass
  changing side with over 1° a frame on both sides); the WORST frame; the faces crossed. Then every turn by its own object (`mix.id`): its size, frames,
  ONE ROTATION, PATH, ratio, largest frame, HELD / free (the build's decision — `hold`; a build without it: every timed turn held), REPLACED (the next frame
  runs another turn: a change of frame arrived before it was whole).
* **G4, no drift** (`REC=1 DRIFT=1`): the walk records its inputs (the events at their frames, the orbit's angles, its clamp's carry and the approach as each
  frame began), then is REPLAYED from them with `&tiltRollDegS=0` (every turn whole at once) and compared frame by frame (`fast_walk_drift.mjs`): (i) the
  pose drawn equals the camera stage's target on every frame with no turn (the build's readout `probeCamPose`; at the base: not recorded); (ii) the zone,
  the tilt, the free face and its heading, the spit's side, the map's angles; the camera on every frame where neither run turns; the last frame's camera.
  Measured at the base on two walks: the discrete state identical, the numbers within 5e-10 (the replays' last-digit noise) — the replay itself is sound.
  ⚠ (FO1, 2026-11-18) on `Scene_1` (`f_s1_over_px20`, no turn at all) the replay drifts by 5.6 mm from frame 20: the inputs recorded are not the whole
  state there — read that walk's G4 as not meaningful. FO1's own figures (built, reverted): `FAST_ORBIT.md` §6; its recordings `<scratchpad>/fo1/def`, `fo1/off`.
* **The circle's check** (2026-11-18, fix round 1 — `FAST_ORBIT.md` §8): `node scripts/probes/turn_circle.mjs <rec.json> …` on a fast walk or on a replay's
  DUMP (`OUT=<f> DUMP=<f>/tr bash scripts/probes/replay_batch.sh rep` — `turn_rec.mjs` now records each turn's `id`, its `hold`, its readers `rt` and the
  pose built / drawn `pose`; null on a build without `probeCamPose`). Per free turn: its angle (min..max), the gap drawn ↔ target (first, the most it
  grew in a frame — GAP+ over 1° —, its decrements, at the end), its one rotation, path and the target's own path (PATH); per run the worst frame with
  the TARGET's own turn in it. Read the worst frame against the target's: a free turn whose start is carried turns as its target does.
  ⚠ Never edit a file under `src` while a batch runs: Vite reloads the page and that walk's recording is lost (`Cannot read properties of undefined`).
  The second build's figures (reverted): `FAST_ORBIT.md` §8; its recordings `<scratchpad>/fo1b` (`fw_*`, `rep_*`, `tr_rep_*`, `g6_table.txt`).
* **Where the worst frame falls** (2026-11-18, fix round 2 — `FAST_ORBIT.md` §9): `node scripts/probes/turn_where.mjs <rec.json> …` (a fast walk or a
  replay's DUMP): the picture's largest frame inside a FREE turn, a HELD turn and with NO turn, each with the target's own turn on that frame; the
  largest gap of a free turn; the target's own speed in free turns (median, 90th, largest; a turn's first frame left out — the change of frame's jump).
  Read: a free turn's worst frame equal to the target's = the picture carried with the target; a held turn's huge first frame = a turn held from a
  lagging pose. The third build's three realisations (reverted): `FAST_ORBIT.md` §9; recordings `<scratchpad>/fo1c` (v1), `fo1c/v2`, `fo1c/v3`.

### 9.1 The base (the code of `892b6a3` = the live `c343c4f`'s; recorded at `8997e45`, docs only after it) — `<scratchpad>/fo1/base`

| walk | frames | still <90 / ≥90 | turning ° | reversals | worst ° | turns (all held) / replaced |
|---|---|---|---|---|---|---|
| f_ccw_p_far_px20 / px30 | 220 / 256 | 50 / 0 · 71 / 0 | 653 / 962 | 6 / 8 | 14.8 / 24.8 | 8 / 3 · 9 / 4 |
| f_cw_p_far_px20 / px30 | 178 / 233 | 26 / 0 · 51 / 0 | 437 / 803 | 5 / 10 | 13.6 / 17.3 | 4 / 1 · 12 / 7 |
| f_ccw_p_d736_px20 / px30 | 335 / 346 | 49 / 0 · 35 / 22 | 650 / 1123 | 6 / 4 | 14.8 / 30.5 | 8 / 3 · 8 / 3 |
| f_cw_p_d736_px20 / px30 | 293 / 337 | 26 / 0 · 46 / 0 | 450 / 788 | 5 / 10 | 13.6 / 25.3 | 4 / 1 · 10 / 6 |
| f_ccw_m_far_px20 / px30 | 225 / 266 | 56 / 0 · 65 / 2 | 609 / 849 | 8 / 8 | 12.6 / 16.8 | 12 / 5 · 9 / 3 |
| f_cw_m_far_px20 / px30 | 187 / 1013 | 25 / 0 · 59 / 21 | 471 / 932 | 6 / 11 | 14.1 / 18.0 | 6 / 3 · 14 / 8 |
| f_ccw_m_d736_px20 / px30 | 340 / 396 | 55 / 0 · 83 / 2 | 624 / 1009 | 8 / 6 | 13.6 / 25.9 | 12 / 5 · 9 / 3 |
| f_cw_m_d736_px20 / px30 | 302 / 430 | 25 / 0 · 60 / 63 | 477 / 1523 | 6 / 15 | 13.6 / 19.8 | 6 / 3 · 18 / 10 |
| f_edge_px2 / px8 / px20 | 166 / 159 / 220 | 0 / 0 · 3 / 0 · 44 / 0 | 125 / 183 / 469 | 0 / 0 / 0 | 5.7 / 7.7 / 16.9 | 6 / 0 each |
| f_far_p_px20 | 190 | 34 / 15 | 651 | 2 | 17.2 | 7 / 3 |
| f_ridge_px20 | 137 | 0 / 28 | 270 | 0 | 7.4 | 1 (the half turn, 180°) / 0 |
| f_s0_up_px20 (`Scene_0`) | 134 | 0 / 0 | 180 | 0 | 13.5 | 0 |
| f_s1_over_px20 (`Scene_1`) | 168 | 0 / 0 | 611 | 1 | 22.5 | 0 |

Deterministic as every probe here (the virtual clock). The figures per loop: `fw_analysis.txt` beside the recordings.

## 10. Gate (i) — the dy hold's long walks (`hold_walk_*`, package DH — `Claude/40_RENDER_SCENE/spec/DY_HOLD_REVERSAL.md` §3, §5, §6)

The hold after a half turn lives on the FINGER's path (`pointer_wiring.ts`): these walks use real mouse events, never the orbit's angles.
`hold_walk_check.mjs` (one run = one distance and one crossing, every frame recorded), `hold_walk_analyse.mjs` (the reading), run by `hold_walk_batch.sh`.

```bash
OUT=<folder> EXTRA="" bash scripts/probes/hold_walk_batch.sh <tag> all        # 30 walks, about 70 minutes (run it in the background)
OUT=<folder> bash scripts/probes/hold_walk_batch.sh <tag> base                 # z_far b_far z_close b_close zT_far zC_far, about 15 minutes
OUT=<folder> bash scripts/probes/hold_walk_batch.sh <tag> z_far zT_far         # any walks by name
node scripts/probes/hold_walk_analyse.mjs <rec.json> [SHOW=s3 FROM=0 TO=400]   # the reading again; SHOW: the frames of one sub-walk
```

* **A run** (`Scene_0bis` unless named): the approach (`far` 1.0, `d736` 0.736, `d515` 0.515, `close` the latch on, 0.651), then one SUB-WALK per N
  (`NS`, default 3, 6, 12, 20, 30, 45 mm): steered to 8° before the edge (`START`) at x 80 mm (`X`), released; ONE press, a pure finger dy at 2 px a
  frame (`PX`) toward the edge until the hold is set; 8 frames more (`PUSH`); N mm of finger the other way; the crossing's way again 60 mm (`COME`,
  "come back"). The sub-walks alternate their side, so the crossings go both ways. `z_*` the zenith ridge, `b_*` the bottom face's far edges.
* **Variants**: `zL_* / bL_*` the finger lifted before coming back; `zT_* / bT_*` after the crossing a pure dx onto a tip's triangle, then the dy both
  ways (`tri-held`, `tri-other`, `tri-held2`, 30 mm each); `zC_far` the crossing made by the coast (released 6° before the edge at 8 px a frame), then a
  new press; `zW_* / bW_far` a finger still pushing the crossing way at 0.5 px a frame with a ±2.5 mm wobble (`WAMP`, period 24 frames, 144 frames);
  `*_px8` 8 px a frame; `s0_ridge_close`, `s0_bottom_close` (`Scene_0`); `s1_top_close` (`Scene_1`: ⚠ its steering does not reach the cube's top —
  not meaningful, use `tilt_check` `MODE=ridge` there).
* **Reading, per sub-walk**: the frame the hold was set, the site's verdict, its sign against the finger's dy that crossed (`⚠ NOT the crossing's` if
  not); the surface per finger mm (frames with no turn running); `back` (finger mm → surface mm, the hold after it); `come`: **BLOCKED** frames (the
  finger asks the held sign, the hold on, no turn, the gizmo still), the first dy back HONOURED (the gizmo going toward the edge two frames running) with
  the finger's travel and the surface since the crossing, or NEVER; a second crossing in it. `STALE hold … after the steering` on a run's line: a hold
  left on after the steering's release (a hold set with no finger down) — ended by a still press before the sub-walk.
* **Good** (DH, `DY_HOLD_REVERSAL.md` §6): N under the band — the come-back blocked, no second crossing (no ping-pong); N over it — honoured with
  0 blocked frames after the band; the wobble — the hold on, no turn; the triangle — no BLOCKED frame; the coast and the lift — no hold left for the
  next press; no `STALE`.
* The base (`892b6a3`'s code) and the fix's recordings: the session scratchpad's `dh/base`, `dh/new`; the band's sweep `dh/sweep`; the earlier commits
  `dh/old_<commit>`. Deterministic (the virtual clock).

## 11. Gate (j) — the owner's hand replayed and the shadow read (`hand_replay.mjs`, `hand_batch.sh`, `shadow_read.mjs`, package FO3 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §12.5, §13)

```bash
STRETCHES=<stretches.json> OUT=<folder> bash scripts/probes/hand_batch.sh <tag> "ilmj_23s|60|far" "ilmj_23s|143|far" "ilmj_23s|60|half" "ilmj_23s|60|close"
node scripts/probes/shadow_read.mjs <folder>/<tag>_*.json <a fast walk's OUTJSON> <a DUMP>     # JSON=1: one object a recording
```

* **His hand**: a stretch of a play recorder's session (its raw pointer events, read only on E:) sent at its recorded times on HIS glass (1 536 × 742,
  the DevTools' metrics override) under the virtual clock — `FPS` 60 or 143 — so a run repeats bit for bit; `PRE=half` the approach first (0.736 on
  `Scene_0bis`), `PRE=close` on until the automatic tilt latches. The stretches (whole presses, 10 – 15 s) are cut by the lead's kit
  (`_saved_patches/orbit_chain_2026-11-18/fo3/cut_stretches.mjs` → `fo3/hand/stretches.json`). ⛔ His play is private: `OUT` never the repository.
  About 30 – 50 s a stretch at 60, 70 s at 143.
* **The shadow** (`st.asmRollShadow`, recorded as `sh` by every recorder through `SHADOW_REC`): `shadow_read.mjs` prints per recording the roll a
  metre of gizmo travel today and as S1 would draw on the route, the gap (largest, frames over 45° / 90°), the free twists, the frames with a gap
  outside a spit (O8), A2, the gap at the end (A3), the turns by their twist, and on the hand A6 (the finger's way against the gizmo's on the glass).
* The figures at `580913f` – `aa1aa8f`: `FAST_ORBIT.md` §13; the recordings: `_saved_patches/orbit_chain_2026-11-18/fo3/runs` (`base` at `6f47219`).

## 12. FO3 S1 — the gates read base against S1 (`Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §14)

* **The base** for his hand and the fast walks is S0's recordings (`fo3/runs/new`: the game as drawn today, identical to `6f47219`'s); the dy hold's
  and the level entry's base was recorded at `6f47219` (`git checkout 6f47219 -- src`, one batch, `git checkout HEAD -- src`). A0: the same batches
  with `EXTRA="&freeTurnMaxDeg=0"`, compared frame for frame (`replay_cmp.mjs`; the kit's `same.mjs` for the other recorders).
* **The readers** (the kit's `_saved_patches/orbit_chain_2026-11-18/fo3/`, outside the repository): `gates_s1.mjs <base> <s1> …` — one line a pair:
  the roll a metre drawn (A5), its worst frame, the gap (A7, reported), A2, A3, the held frames and the turns ≥ 88° (A4), A6's largest; `a6_detail.mjs`
  — A6 split by the gap and inside / outside a spit; `cancel.mjs` — the half turn's length from the pose shown (14.5); `wrap_sim.mjs` — the follower
  re-run on S1's twists, the gap wrapped or not.
* ⚠ On `Scene_0bis` the finger outside a spit never meets a gap (0 frames on his hand and the loops): S2 changed nothing there, and the runs made with
  it stand for S1 alone (checked: `ilmj_23s` with and without S2 identical).

## 13. Law U — the upright picture (`Claude/40_RENDER_SCENE/spec/UPRIGHT_PICTURE.md` §3, §5)

```bash
STRETCHES=<stretches.json> OUT=<folder> bash scripts/probes/upright_batch.sh <tag> hand close half fps143 reps over loops more le hold
node scripts/probes/gravity_read.mjs <rec.json> ...          # JSON=1: one object a recording
```

* **`gravity_read.mjs`** reads the camera DRAWN of any recording (`c`, `t`, `up`; the gizmo `g`): gravity's tilt on the glass (world-down projected
  on the glass against the glass's down; not counted within 10° of the vertical, `CUT`) — the share of frames over 20°, 45°, 90° and its largest;
  gravity's roll per metre of gizmo travel (|Δtilt| a frame × the sine of the view's angle from the vertical) and its largest frame; the frames held
  by a turn per metre; with law U's record (`sh.uw`, `sh.uf`, added to `SHADOW_REC`) the largest φ and the frames held by a turn whose frame before
  had `w` = 1.
* **The bases**: `1.0.147-`'s game = the kit's `fo3/runs/new` (`6f47219`); the deployed build = `fo3/runs/s1` (`48ae89c`); the dy hold's and the
  level entry's base `fo3/runs/base` (`6f47219`). U-G1: `EXTRA="&uprightPicture=0"` against step 1's code (`git checkout 7bcae02 -- src`, one batch,
  `git checkout HEAD -- src`), `EXTRA="&freeTurnMaxDeg=0"` against `fo3/runs/new` — the kit's `same.mjs`.
* **The kit's readers** (`_saved_patches/orbit_chain_2026-11-18/fo3/upright/`, outside the repository): `vsum.mjs` (a line a stretch and the ten's
  totals, with the frames whose camera turns over 90° / 45° in ONE frame), `jumps.mjs` (those frames: the view from the vertical, `w`, φ, the turn),
  `viewjump.mjs` (the view's own turn a frame, at a turn's start and elsewhere), `a6p.sh` (A6 on the picture: largest / 95th / n), `dy_cmp.sh` and
  `dy_glass.mjs` (the straight dy walks: the world drift and the gizmo's way on the drawn glass), `id_cmp.sh` (U-G1, U-G7).
* ⚠ A whole-camera turn over 90° in one frame is the measure gravity's tilt misses: law U as built makes 84 of them on his ten stretches (the base 0) —
  `UPRIGHT_PICTURE.md` §5.
* **Fix round 1** (`UPRIGHT_PICTURE.md` §7): the kit's `sum_fr1.sh <tag>` (vsum + A6 split), `a6split.mjs` (A6 apart on the frames where law U's rest
  is under 5° and where it is closing — α recomputed from the recorded `gh3`, `pp`), `j90.sh <tag> [deg]` (the frames turning the whole camera over
  `deg` a stretch, with `1.0.147-`'s count over 45°), `jrep.sh <tag>` (the same on the replays and `Scene_1` over its top), `id_fr1.sh` (U-G1).
* **Fix round 2** (`UPRIGHT_PICTURE.md` §9): the dy hold's walks (`upright_batch.sh <tag> hold`) are an upright gate — read LIKE FOR LIKE, the
  walker steering by the glass: the kit's `hw_world.mjs` (per sub-walk the gizmo toward / away from the edge per leg, the picture's tilt before and
  after, a re-crossing, refused both ways) beside `hold_walk_analyse.mjs`; base `fo3/runs/base/bhw_*`. R7 (the finger's way against the gizmo's on the
  drawn glass) by the auditor's `audit/t_read.mjs` (`audit/rd_hand.sh <dir> <tag> 60 far`, `ALL` line, `awayAll`): `1.0.147-` 12.1 / 61.1°; split by
  the frames since a freed change (`r7_freed.mjs`, needs the shadow's `fe`) and by the view (`r7_buckets.mjs`). The holds set and by what change:
  `ud11_read.mjs` (needs the hand record's `h`, `efa08a5`).
* **The rebuild** (`UPRIGHT_PICTURE.md` §12 – §13, 2026-11-19): the same batches (`upright_batch.sh <tag> hold hand fps143 reps over le close`, then
  `EXTRA="&uprightMaxDegS=1440"` / `=2160` hand for the pace). Readers, all in the kit: the hold walks by `audit/hold_tab.mjs <base bhw_analysis>
  <new analysis>` and `audit/come_split.mjs <hold rec>` (the come leg's gizmo along the axis / round it / still); the ten stretches by
  `audit/t_read.mjs` (`ALL=1`), `rebuild/big_frames.mjs` (the 45° frames by cause), `rebuild/pic_turns.mjs` (holds against the turn SEEN); RB4's
  offline proof `rebuild/rb4.mjs` (`w` off the camera's view against off the piece's direction); the straight dy `upright/dy_glass.mjs`; the identities
  `scripts/probes/replay_cmp.mjs` (replays) and the kit's `same.mjs` (a stretch). The driver `rebuild/drv_rb.sh`, `drv_rb2.sh`.
* **ONE CARRIED UP** (`1.0.148e-`, `UPRIGHT_CARRIED_UP.md` §7, 2026-11-20): the kit's `fo3/rebuild_e/drv_e.sh` (the first build, `runs/`; law U at 520
  `u_*`) and `drv_f1.sh` (fix round 1, `runs_f1/`: every phase, `Scene_1`'s dy across the top `s4`, the identity `uprightCarried` 0 + 720 against
  `fo3/vertical/runs`, the hold walks at `uprightHalfHold` 0); readers `R=<dir> rd_f1.sh hand|hold|rest|id`, the gizmo while held `gz.mjs` (by cause
  `gz2.mjs`, frames `gz3.mjs` / `gz4.mjs`), a walk's largest camera turns `ov.mjs` / `ov2.mjs`, the tips `tip.mjs`, far out by φ `far.mjs` / `far2.mjs`.
  ⚠ `hold_walk_analyse.mjs`'s BLOCKED excludes timed-turn frames (`mix`) only: a half turn is none, so the dy hold after a come-back's second crossing
  counts as blocked (8 frames) where `1.0.147-`'s turn hid them — read the `come` leg frame by frame before calling it a regression.
* ⭐ (2026-11-20, packet J — `UPRIGHT_CARRIED_UP.md` §8) `fast_walk_check.mjs` takes `FPS` (60 by default; its waits keep their time, a finger step
  stays one frame): his desktop at 143 with `LPX` 8.4 (1 200 px a second). The jump reader and the walks through the poles (`Scene_0bis`'s bottom, its
  tip, its ridge, `Scene_1` over its top, `Scene_0`'s bottom) are the kit's `rebuild_e/j/` (`jr.mjs`, `chg.mjs`, `drv_j.sh`). ⚠ `hand_replay.mjs` reads
  the owner's raw sessions where `stretches.json` points (his external drive): copy them inside before a hand batch when that drive is not to be read.

## 14. The camera follower — packet G (`Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13, 2026-11-20)

* **The recorder**: `turn_rec.mjs`'s `FOLLOW_REC`, inside `SHADOW_REC` as `sh.fx` — the direction asked (`a`), the orbit's / solver's / spring's angles
  (`y`, `v`, `q`, `b`), the gizmo's true normal (`n`), the look point (`L`), the centre (`C`), the follower's record (`f`: `on`, the followed `d`, the
  spring's `sd`, `psi`, the detour's `side` / `det`, the pace, the hang), and once the placed parts' box (`pb`, O8). The follower writes a shadow
  record without `one` / `upright` (the recorders and `his.mjs`, `jr.mjs` read it as any other).
* **The batches** (the kit's `fo3/follow/drv_g.sh`, one phase after another, each its own server): `PH="hand id hold walks close close0" TAG=<tag>` —
  his ten stretches at 60 far; the identity (`cameraFollower=0`, two stretches, against the live `rebuild_e/j/runs2/jf_*` by the kit's `same.mjs`); the
  dy hold's base walks (`hold_walk_batch.sh base`); the pole walks at 143 (`drv_jg.sh`, packet J's targets); two close stretches with the switch 1 and
  0 (identical from the tilt's latch on). About 28 minutes.
* **The readers** (the kit): `rd_g.sh hand|walks|hold|id <tag>` (`follow_g.mjs base`: the lag behind the logic, the face away, the frames over 45° /
  20°, gravity's tilt; `his.mjs`; `jr.mjs`; `hold_tab.mjs` against `1.0.147-`'s `bhw` and the live `jfhw`), `near_v.mjs` (frames with the camera near
  the vertical), `o8_g.mjs` (the centre, the look point, the placed box). Offline: `follow_g.mjs` = packet F's prototype + the raw target (`tgt=a`),
  the one ease (`swing=0`), the pace-opened ceiling (`vrel=1,psrc=inst`), the hanging piece (`pose=hang`), the right centre (`lc=box`).
