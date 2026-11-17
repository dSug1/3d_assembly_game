# Package A (W11) — the trials before it and the gates of its first commit, moved out of the spec (2026-11-17)

Moved WORD FOR WORD from [TILTED_POLE_CLOSE_IN.md](../spec/TILTED_POLE_CLOSE_IN.md) (§12.2 and §18.1) to make room for the record of `c53f54a`
(the topic file at its 800 lines). Nothing here is changed; what `c53f54a` changed in these figures is in §18.1 there and in
[`RND5.md`](../../00_CORE/queue_notes/RND5.md).

## From §12 (step C1, W11): §12.2, as it stood

### 12.2 Tried, measured, reverted — nothing of it committed

| trial | `Scene_1` | `Scene_0` | `Scene_0bis` |
|---|---|---|---|
| today | the largest 8.7°, in all 673°; the entry 6.2 / 8.0 | 8.8° | 8.9° |
| T1 — the ease read once the frame's view is set (after `calmFrame`) | the entry **0.4 / 1.4**; but the bottom's entry **10.4** (was 6.7): the gap now holds the square's first step, which the camera's turn counts too, while the square keeps turning | — | — |
| T2 — T1, and the square camera at its target while a transition's turn runs (its pitch INSIDE the one turn) | **6.0** at most, in all 504°; the same tilts made / left | 8.0 (a finger drag, no turn running) | ⛔ **54.6**: the spit's turn starts in the camera's stage, after the read — the piece's direction jumps; every start of a turn would need the read |

So (1.) cannot be fixed alone: it is part of (2.). T2 shows the shape of a fix, and that it is not local.

## From §18.1 (package A as built, `fe06c2c`): the gate table, as it stood

From the paragraph's last sentence: **The gates** (base → A; "in a turn" = a transition's turn running, `tilt_check`'s new `WORSTF`, `TURNONLY`):

| run | largest a frame, all / in a turn / no turn running | in all | notes |
|---|---|---|---|
| default `Scene_1` | 8.7 → **6.0** / 5.9 / 6.0 | 673 → 507° | tilts 2 / 2 as before |
| default `Scene_0` | 8.8 → 8.0 / **5.8** / 8.0 | 2149 → 1851° | the 8.0 – 7.3: a dx drag onto the end cap while the square camera turns on its own (no transition); holds 7 → 6 |
| default `Scene_0bis` | 8.9 → 7.6 / 6.4 / 7.6 | 3627 → 3476° | the 6.4: the frame the spit's turn starts (its share 0) — the square camera's own step and the drag before it; 7.6 drags |
| `out` 4 px / 1 px | 6.0 → **5.2** (the way out) | 277 → 266° | 95 % within 0.67 s (0.58) / 0.70 s (0.68) |
| `ridge` 0 / 1 / 4 | 8.5 / 8.5 / 8.1 → **6.0 / 5.8 / 6.0**; in a turn 4.8 / 5.8 / 5.8 | | crossings and holds as before (`Scene_1`'s second hold 36 → 28 readings, all on) |
| `pole` 1 / 0 | 6.6 / 6.9, unchanged (no turn over 0.8°) | | |
| ridge_check tip (§13.4, decision 3) | walk-in 124° at ≤ 10.0° → **125° at ≤ 6.6°** (in its turn ≤ 4.8°), the same way round; walk-back 357° ≤ 8.6° → 337° ≤ 6.0° | | the arrival kept as the owner saw it, slower |
| across / edge_noise | 6.6 → 6.7 (walk); the edges: 0 made / left, 0° in the runs — equal | | |
