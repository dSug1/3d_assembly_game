# The orbit gates' "off" baselines — moved out of the runbook at step 2.5 (2026-11-16)

Step 2.5 (`ORBIT_CHARTS.md` §7.2; the record: [`../../00_CORE/queue_notes/RND5.md`](../../00_CORE/queue_notes/RND5.md)) deleted the two switches
`chartLayout` and `chartCalm` and every path that ran only with one of them at 0 — the game before the charts. The runbook
([`../../../scripts/probes/ORBIT_GATES.md`](../../../scripts/probes/ORBIT_GATES.md)) no longer has an "off" replay or an `S:0` leg. What it said about them and
their baseline numbers at `276a6c2` are kept here, unchanged, never deleted (the tiered architecture: narrative in `history/`).

## The runbook's words, as they stood

* **The switches**: `chartLayout` and `chartCalm` are 1 by default (since `cb55778`). `chartLayout=0&chartCalm=0` is the game before the charts —
  it must stay bit for bit until step 2.5 deletes it. ⚠ `tilt_batch.sh "<scene>:<chartLayout>"` sets `chartLayout` only: `"1:0"` runs
  `chartLayout` 0 with `chartCalm` still 1 (the default); add `EXTRA="&chartCalm=0"` for the game before the charts.
* The off replay: `OUT=<folder> EXTRA="&chartLayout=0&chartCalm=0" bash scripts/probes/replay_batch.sh new_off` — the game before the charts.
* The baselines' folder held `base_off_*.json` (`chartLayout=0&chartCalm=0`) beside `base_def_*.json`, and `…/scratchpad/replay/j_off_*.json`
  (the session's own scripts on the same code); ✅ checked then: the moved scripts' `off_s0bis` differed from `j_off` only in the last digit (2.9e-9
  at most, from frame 3; `1e-6: never`).
* mid / across: `bash scripts/probes/mid_batch.sh "chartLayout=1&chartCalm=1|2|0 chartLayout=0&chartCalm=0|2|0"`;
  `SCRIPT=across_check.mjs PX=1 bash scripts/probes/mid_batch.sh "chartLayout=1&chartCalm=1|0|0 chartLayout=0&chartCalm=0|0|0"`.

## The baseline at `276a6c2` — the rows of the deleted paths

### Gate (b) — the replays

| recording | vs `j_*` (the session's) | view turn °/frame: 99th / largest / > 10° / > 20° | roll °/frame: 99th / largest / > 10° / > 20° | gizmo step mm: 99th / largest / > 50 mm | the orbit driven / the gizmo still | camera's up below 0 (frames) |
|---|---|---|---|---|---|---|
| `base_off_s1` | identical 2794 / 2794 | 12.2 / 14.9 / 85 / 0 | 10.2 / 13.7 / 52 / 0 | 69 / 96 / 160 | 1211 / 326 | 429 |
| `base_off_s0` | identical 2794 / 2794 | 12.1 / 18.9 / 82 / 0 | 10.2 / 14.4 / 54 / 0 | 63 / 89 / 127 | 1234 / 469 | 425 |
| `base_off_s0bis` | 2763 / 2794 identical; 2.9e-9 at most, from frame 3 (`1e-6: never`) — noise | 11.9 / 19.1 / 78 / 0 | 11.2 / 35.0 / 44 / 6 | 71 / 100 / 107 | 1093 / 170 | 46 |

### Gate (c) — `tilt_check.mjs`

| run | largest (°/frame) | in all (°) | tilts made / left | dy holds set | the run's own verdict |
|---|---|---|---|---|---|
| default `1:0` (chartLayout 0, chartCalm 1) | 8.5 | 661 | 2 / 2 | 0 | a tilt by dy |
| default `0:0` | 12.7 | 683 | 3 / 3 | 0 | a tilt by dy (normal y 0.90) |
| default `4:0` | 26.2 | 3763 | 0 / 0 | 13 | no tilt |

### Gate (d) — `Scene_0bis`'s bottom face

| run | the walk | largest (°/frame), walk / whole run | in all (°), walk / whole | side changes | timed turns | frames with the dy hold (walk) | tilts | holds set (whole) |
|---|---|---|---|---|---|---|---|---|
| mid, `chartLayout=0&chartCalm=0`, `S0` 2 mm | NOT reached (−82.3 mm off), 357 frames | 15.2 / 24.0 | 321 / 1413 | 1 | 1 (23 frames) | 309 | 0 / 0 | 3 |
| across, `chartLayout=0&chartCalm=0`, `PX` 1 | the half turn in the face (−56.9 mm), then held; 1017 frames | 6.0 / 6.5 | 231 / 821 | 1 | 1 (30 frames) | 942 | 0 / 0 | 2 |
