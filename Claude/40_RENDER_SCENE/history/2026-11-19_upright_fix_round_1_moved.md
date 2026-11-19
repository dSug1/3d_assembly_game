# Upright picture — fix round 1 as built and measured (moved out of `UPRIGHT_PICTURE.md` §7, 2026-11-19)

⭐ Moved whole, unchanged, to keep [`UPRIGHT_PICTURE.md`](../spec/UPRIGHT_PICTURE.md) under its 800-line cap when §15 was written (packet V1).
Its links are written from `spec/`: read them from there.

## (was §7) Fix round 1 as built and measured (the builder, 2026-11-19, night; local commits, nothing pushed)

**The result first.** No frame now turns the whole camera by more than 90° on his ten stretches (84 at §5, 0 in `1.0.147-`). Gravity is tilted
over 20° in **7.1 %** of the frames (`1.0.147-` 35.4 %, deployed 47.0 %), under `1.0.147-` on every stretch; its roll is **57.0° a metre**
(101.5; 127.2). The half turn over a top is now a roll of about an eighth of a second (1 440° a second). ⛔ Still open: frames turning the
camera by 45 – 90° in one frame are more than in `1.0.147-` (45 against 5 on the ten); the finger's angle on the picture (A6) is over
`1.0.147-`'s on 9 of 10 stretches; the frames held a metre over the deployed build's on 5 of 10.

### 7.1 What was built

| commit | kind | what |
|---|---|---|
| `5d1f17c` | C | **F1, UD6b** — `uprightPaced` (`upright.ts`): the carry at once, `c = min(w, w before)`; the rest to `w·α` closed at `uprightMaxDegS` everywhere, the short way, `α` the root nearest 0, no unwrap; `uprightMaxDegS` 0 = law U as first built. ⚠ §6 wrote `c = w`: the 10 flips left by §5's experiment were exactly that — an `α` read just inside the band (where it is wild) carried at the weight after a one-frame crossing (vector (c'')). 10 vectors, 9 mutants red |
| `d7ec0d2` | C | **F2, UD4b** — `uprightBandFree` (1): FO3's rule frees a change at any `w`; on a freed frame the twist of `G` about the framed line is undone (the picture keeps its roll), the rest closes in time. 2 vectors, 4 mutants red |
| `9cf3fda` | C | **F3** — the 3 – 5 flips left at 720 / 1 440: on a TIMED turn's first frame the logic's view jumps 33 – 54° across the band and its `Δα` (not a roll) was carried at `c` 0.69 – 1 (`uf` 9° → 132° in one frame, `vyah_42s` frame 67); that frame is now carried by the twist too. Flips 3 → 0. 1 mutant red |
| `06d9faa` | C | `uprightMaxDegS` 1 440 by default (the gates, below) |

### 7.2 The gates (his ten stretches far out at 60 frames a second; the final code, 1 440° a second, unless said)

| gate | measured | `1.0.147-` (`6f47219`) | deployed (`48ae89c`) | verdict |
|---|---|---|---|---|
| U-G1 | `uprightPicture` 0 = `7bcae02`, `freeTurnMaxDeg` 0 = `6f47219`, `uprightMaxDegS` 0 + `uprightBandFree` 0 = `e653099`: the `Scene_1` replay and `ilmj_23s` identical frame for frame (`Scene_0bis` 5.6e-9 from frame 3, its known noise) | | | ✅ |
| U-G2 over 20° | 7.1 % in all; 4.4 – 10.0 % a stretch; over 90° 1.4 – 4.1 %; replays 1.0 / 0.0 / 1.0 % | 35.4 %; 23 – 46 %; over 90° 7 – 24 %; 1.1 / 0.4 / 16.3 % | 47.0 % | ✅ |
| U-G3 roll a metre | 57.0°; 37.7 – 89.9° a stretch; replays 7.5 / 4.0 / 13.8°; `Scene_1` over its top 3.4° | 101.5°; 13.4 / 11.3 / 43.0°; 9.3° | 127.2° | ✅ |
| U-G3 whole camera in one frame | over 90°: 0 (replays 0, `Scene_1` over its top 0); over 45°: 5, 8, 0, 4, 10, 10, 2, 2, 2, 2 a stretch | over 90°: 0; over 45°: 2, 0, 0, 1, 1, 0, 1, 0, 0, 0 | 0 | ✅ over 90°; ⛔ over 45° |
| U-G3 largest frame of gravity's roll | 22.9 – 79.1° (`vyah_42s` 79, `ilmj_39s` 47) | 10 – 45° | | ⛔ on 2 |
| U-G4 | as §5 (at most 1.8e-15) — not re-read | | | ✅ (§5) |
| U-G5 | `Scene_1` over its top 165 frames (168), no runaway; `Scene_0`'s bottom close in: errors 0, as before (at `d7ec0d2`, 720). ⛔ A6 steady (rest under 5°), 95th percentile: 54.6, 94.6, 59.2, 92.9, 118.6, 90.4, 83.0, 79.3, 85.5, 58.4; closing frames 0 – 10 a stretch | 37.6, 44.3, 44.1, 50.1, 79.1, 71.1, 57.5, 52.2, 48.2, 65.3 | | ⛔ 9 of 10 |
| U-G6 held a metre | 23.9, 14.6, 21.5, 12.9, 12.4, 17.1, 16.2, 19.3, 14.1, 13.8 | 33.5, 21.3, 30.8, 26.1, 20.6, 32.3, 22.0, 24.1, 24.9, 23.5 | 19.8, 18.2, 25.6, 13.7, 15.3, 17.4, 13.3, 12.3, 13.9, 13.6 | ✅ base; ⛔ deployed on 5 |
| U-G7 close in (at `d7ec0d2`, 720: φ at most 1.4° there) | `ilmj_23s` as `1.0.147-`; `ilmj_99s` over 90° 0.2 % (1.1), roll 32 (49.6); `vyah_11s` over 90° 1.0 % (0), roll 48.4 (29.0). Straight dy, off straight down on the glass (median): 9.9, 9.1, 10.8, 10.9, 10.6, 10.8° | 7.8, 7.6, 8.9, 8.4, 10.8, 10.5° | | ⛔ `vyah_11s`, the straight dy |
| U-G8 | `npm run verify`, the documents' two tests, the tree, the processes | | | ✅ |

**720° a second** (F3 included): over 20° 13.9 %, roll 72.1° a metre, one frame over 90° (`ilmj_23s`), 33 over 45°. Before F3: 720 left 5 flips,
1 440 left 3.

### 7.3 The defaults left, and why

`uprightMaxDegS` **1 440** (the faster of the two, and the only one with no frame over 90°; U-G2 passes); `uprightBandFree` **1** (no runaway, no
flip measured with it); the others as §5. **Which assumptions of §6 the frames refute**: (1) `c = w` (above: F1); (2) "the carry is exact"
holds for the logic's ROLL only — where the logic's VIEW jumps (a timed turn's first frame) `Δα` is not a roll (F3); (3) U-G3's "over 45° not
more than `1.0.147-`": the logic's own view jumps 33 – 54° there, and a picture kept upright through it turns the camera by more than the view;
the smallest amendment that keeps his words is to judge "no jump" over 90° (a flip) and report 45 – 90°; (4) U-G5's A6 does not depend on the
pace (identical at 720 and 1 440): its root is UD8 (the finger read off a picture that differs from the logic's), unchanged by this round.

### 7.4 What he will feel

Far out: the scene stays upright; over a top the floor turns round in about an eighth of a second instead of a flip or half a second's roll;
no stop of the gizmo under 90° near the vertical either. Some frames still swing the view by 45 – 90° where `1.0.147-` swings it less — at the
start of a timed turn. Close in as before. **Sliders** (☰ › ORBIT › UPRIGHT PICTURE, 7): the rest's pace `uprightMaxDegS` (1 440; 720 slower),
`uprightBandFree` (1; 0 = the gizmo stopped in the band again). **Not run**: the stretches at 143 frames a second and at 0.736, the corner
loops, the dy hold's walks; close in and the level entry not re-run after F3 (φ at most 1.4° there).

