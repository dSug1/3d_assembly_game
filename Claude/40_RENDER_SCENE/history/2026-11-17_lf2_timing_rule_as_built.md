# LF2 — one rule for every tilt, AS BUILT then reverted: the record, moved out of the spec (2026-11-17)

Moved WORD FOR WORD (its links alone re-pointed) from [LEVEL_FACE_ENTRY.md](../spec/LEVEL_FACE_ENTRY.md) §11.1 to make room there for §15 (the silent
entry ordered by the owner the night of 2026-11-17). The rule `e7ff2ed` was REVERTED by `cb89bdd`: why, and the owner's options, stay in the spec's
§11.2; the inventory stays in its §11. The dossier: [`RND5.md`](../../00_CORE/queue_notes/RND5.md).

## From §11: §11.1, as it stood

### 11.1 As built (2026-11-17: the gate `6236fb4`, the rule `e7ff2ed` — ⛔ REVERTED by `cb89bdd`, §11.2; this section is the record)

**In one paragraph.** The rule is built as §9 states it (`turnDurationMs`, `turnStepRad` in `src/input/orbit_tilt.ts`; three dials `tiltMinMs` 250,
`tiltMaxMs` 333, `tiltSmallDeg` 30, sliders after the speed in ORBIT › TILTED POLE, URL overrides). It paces `zoneStep`'s turns, the paced entry's
time tail and the way out's ceiling. **One thing differs from the brief, measured first**: a turn with the square camera turning BESIDE it keeps the one
speed (`turnDials`, `turnDialsOf`: kept for the turn's life). Built without it, the rule changed those turns' path. So close in nothing changes, and the
52° entries close in stay 9 frames. Far out every timed turn follows the rule. With both durations at 0 the three replays are identical in every frame.

**Why the exception (measured with the rule alone, before the build above).** Close in, a crossing runs two clocks: the transition's turn and the
square camera's pitch (`TILTED_POLE_CLOSE_IN.md` §12). Slowing one and not the other drew another picture. The close-in half turns (`tilt_check` on
`Scene_0` / `Scene_0bis`) ended 171.8° from where they began instead of 178° – 180°, 9° – 11° off the base's route on the way, up to 11.3° in a frame.
On `Scene_1`'s dy onto the top, 12° in 2 frames then the square camera's own 72° became ONE turn of 99° of path for 89°, 72° off the base's route.
Timing the square camera too would rebuild the two clocks (§12's option A, reverted with package A): not this package's.

**Every timed turn on the gates** (the base `0ab1f9f` → now; frames at 60 a second; "rule": the frames the rule gives; "one / path": the one rotation
and the path drawn, degrees; the largest frame in degrees). Like turns are grouped; the full tables: `node scripts/probes/turn_table.mjs` on the
recordings in the session scratchpad's `lf2/base` and `lf2/def`.

| where (the gate) | angle | frames | rule | one / path | largest frame |
|---|---|---|---|---|---|
| `Scene_0bis` far out and at 0.736, the entry onto the bottom (`level_entry` b, every walk) | 25° – 41° | 6 – 7 → **15 – 16** | 15 | 31.5 – 37.0 / 34.5 – 40.7 → 33.8 – 38.5 / 39.7 – 45.1 | 7.2 – 7.7 → 5.4 – 6.2 |
| the same, the exit onto the triangle, ccw | 83° – 89° | 15 → 16 | 15 | 84.0 – 84.2 / 86.1 – 88.9 → 89.1 – 89.4 / 91.2 – 94.4 | 6.1 – 6.9 → 6.0 – 6.9 |
| the same, the exit onto the rectangle, cw | 61° – 69° | 12 – 13 → 16 | 15 | 66.5 – 72.4 / 72.0 – 77.4 → 58.4 – 65.5 / 63.3 – 72.3 | 6.9 – 7.5 → 5.6 – 6.0 |
| the same, back out over the entry edge | 32° – 41° | 7 → 15 | 15 | 36.7 – 37.0 / 40.1 – 40.7 → 39.7 – 40.4 / 44.5 – 44.8 | 6.6 – 7.3 → 4.9 – 5.5 |
| the same, out in the face's middle | 11° → 23° (the end pose moves) | 2 → 12 | 12 | 10.6 / 10.8 → 23.2 / 23.3 | 5.9 → 5.9 |
| the spit's far edge far out (`b_far`, `b_dy`, `across_check`, `ridge_check` across, `MODE=pole`) | 175° – 210° | 25 – 31 → **20 – 21** | 20 | 174.1 / 185.6 → 171.2 / 181.3 (pole); 174.2 / 182.6 → 171.3 / 178.5 (across) | 6.6 – 8.6 → 9.4 – 10.9 |
| the way out of close in, 4 px a frame (`MODE=out`, `Scene_1`) | 180° | 37 → 25 (95 % in 35 → 24) | 20 | 179.9 / 189.7 → 179.9 / 187.4 | 6.0 → 9.0 |
| the way out, 1 px a frame — PACED BY THE FINGER (gate 4) | 180° | 46 → 46 | — | identical | 6.0 → 6.0 |
| close in, every turn with the square camera beside it: the tilt's entries and exits, the half turns, the 52° entries, the ridge (`tilt_check` every mode, `level_entry` a, the close-in walks of b) | 6° – 180° | identical | (the one speed) | identical (`Scene_1`'s ridge within 0.5°) | identical |
| the square camera's own turns (no transition) | 6° – 90° | identical | (stays, §11) | identical | identical |

**Against the contract.** (1) Start and end: within 2° of the base on every far-out turn that starts from the base's state (the first turn of each
walk: 0.2° – 1.6°); a later turn starts from another state (the gizmo held longer before it) and is read by its shape only. (2) **The route on the way
is NOT exactly the base's on the far-out entries: 4° – 7° off at the same fraction of the path, the path 3° – 6° longer (ratio 1.10 → 1.17 – 1.19).**
Read frame by frame (`b_back_p_far`): the turn's first two frames carry the gizmo's own ease (13 mm a frame) and the piece's spring, which the rule does
not time — 5.6° and 4.8° in those frames, then 2° a frame; at the base the same motion was inside its 6° a frame. The end pose moves while the turn
runs (its whole 36.7° → 37.7°), and the brief's rule for that ("the pace read each frame from the whole as it is now") is kept. (3) The far-out half
turns end 2.9° short of the base's end at their last frame; the picture then reaches the base's place, and the two recordings are identical from the
base's last frame of the turn on (`MODE=pole`, read frame by frame). **The tolerance taken for "the same pose at the same fraction": 3°** — the far-out
entries exceed it (4° – 7°): reported, not hidden.

**Turns whose path is over 1.15 × the one rotation + 5°** (package A's gate). New, not so at the base: (a) `b_far_p_far`'s second far-edge half turn
(the way back) — at the base 143° (one rotation 144.1°, path 150.7°), now **−208°** (151.4°, 216.3°, ratio 1.43, 12° in a frame): the flip of side LF1's
(iv′) met (§10.3) — the half turn's two-target drawing (`poseFramingTwo`) goes the long way for a start pose a degree different; the root is LF3's;
(b) the `Scene_0bis` replay at the defaults, another play from frame 315 (drag 31): 135° drawn with 235° of path (1.67, 13.8° in a frame), the same
drawing. So at the base and still: `b_ccw_p_d515` 3.36, `b_ccw_p_close` 2.48, `b_cw_m_close` 2.40, `b_cw_m_d515` 1.38, `b_ccw_m_d515` 1.28,
`b_cw_p_d515` 1.26, the first `b_far_p_far` half turn 1.42, `b_dy_x190`'s far edge 1.37 → 1.39, the close-in ridge half turns 1.20 (LF3's, or close in
and untouched).

**The other gates.** `view_jumps`: no frame over 45° (the `Scene_0bis` replay's largest 14.1° → 11.8°); `replay_health` clean (0 errors, no gizmo step
over 150 mm; `Scene_0bis` the camera's up below level 32 → 34 frames, its other play); `Scene_1`'s replay identical at the defaults, `Scene_0`'s from
frame 1398 (the way out, `A22`: 7 → 8 frames); `tilt_check` default "1 0 4" identical (8.7° / 8.8° / 8.9°), ridge identical, press and rim with no
timed turn; `MODE=pole` `Scene_0bis` 8.6° → 10.9° a frame (its half turns at 9° a frame, the rule's); the tilts made and left and the holds as at the
base in every `tilt_check` run; `across_check` the half turn then the hold as at the base, 7.4° → 9.9°; `mid_check` reaches the middle, the side
changed 0 times, one turn (2 → 11 frames, 76° → 81°, 6.2° → 5.8° a frame) — its setup ran on another track (a turn of the climb held the gizmo 14
frames instead of 2): parked elsewhere, the run's dy holds 1 → 4. `ridge_check` across, far out: 7.4° → 10.0° (its half turns). The free roll (LF1's
gate): equal or lower on every walk (2.6° at most far out). Nothing else ends elsewhere than what a longer or shorter hold moves (the probes' finger
goes on while the gizmo is held).

**§9's expected table against the measured**: the far-out entries 6 – 9 → 15 – 16 frames ✓; the far-out half turns 25 – 31 → 20 – 21 ✓ (the owner's
*"50% faster"*: `Scene_0bis`'s top ridge far out, `ridge_check` across, 30 → 20); the quarter turns 15 → 16 ✓; under 30° 2° a frame ✓ (the free face's
exit in its middle, 11° → 12 frames). ⛔ **Not as expected: everything close in** — the 52° entries stay 9 frames, the close-in half turns 30 – 31, the
first-frame peaks of `TILTED_POLE_CLOSE_IN.md` §12 — because of the exception above.

**What is left — the owner's.** (1) Close in: to put those turns under the rule, the square camera's pitch must become part of the one turn (§12's
option A), then the rule on that one clock; or keep them at the one speed. (2) The far-out entries' route 4° – 7° off the base's on the way (the gizmo's
ease and the piece's spring, untimed, in the turn's first frames): accept it, or time the turn from the frame those settle. (3) The long way of a half
turn's drawing, (a) – (b): LF3. No device look (rule 5).
