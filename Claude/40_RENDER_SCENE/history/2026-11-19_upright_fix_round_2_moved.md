# Upright picture — fix round 2 as built and measured (moved out of `UPRIGHT_PICTURE.md` §9, 2026-11-19)

⭐ Moved whole, unchanged, to keep [`UPRIGHT_PICTURE.md`](../spec/UPRIGHT_PICTURE.md) under its 800-line cap when §16 was written (packet V1-B).
Its links are written from `spec/`: read them from there.

## (was §9) Fix round 2 as built and measured (the builder, 2026-11-19, night; local commits, nothing pushed)

**The result first.** The dy hold reads the logic's own glass again (UD8b): over `Scene_0bis`'s top and bottom far out the hold is set where
`1.0.147-` sets it and nothing re-crosses under a steady push. A finding on the way: the finger turned off the picture was **mirrored** since FO3's S2
(the glass's right taken as `forward × up`, Babylon's is `up × forward`): every move was turned by −φ instead of φ; fixed. UD11 is built (51 of 104
holds on six of his stretches were set by a change freed fully upright). ⛔ **Two gates missed**: the finger's way (R7) 14.9° median against the
target 14.1° (16.3° before this round; `1.0.147-` 12.1°), and **one frame turns the camera 98°** on one stretch (before this round: none).

### 9.1 What was built

| commit | kind | what |
|---|---|---|
| `7fe646c` | C | **R1, UD8b** — `fingerOnLogic` (`roll_follow.ts`, pure) called once in the pointer's step (`fingerAtEntry`) BEFORE `dySignPushing`, `edgeHoldDy`, `edgeHoldFinger`, `zoneFinger`; `zoneFinger` reads `asmCamLast` in a spit and converts nothing outside one; `asmPicLast` deleted. ⭐ `fingerOnGhost`'s mirror fixed (found by the new spit vector: 1.83 px off on a 5 px move). 5 vectors (the same world move at 0, 90, 143, 180°; the dy sign the hold reads is the logic's; the hold and its band on the logic's glass; the finger in a spit = the move read on the picture's frame; the picture's right is `up × forward`); 5 mutants red |
| `efa08a5` | P | the hand replay records the hold (`h`, `ds`), the shadow the freed angle (`fe`) |
| `25477c7` | C | **R2, UD11** — `uprightHoldKept` (`upright.ts`) and law U's `closed`: the hold a change set is dropped where that change is freed with `w` 1 before and after and nothing left to close; 7 vectors, 5 mutants red |
| `7516ce3` | C | **R3** — the rest's slider label (*"upright: the rest to upright, its pace (deg a second; 0 = at once)"*), two `gestureConfig` comments, the test title (1 440); F3 out of `uprightBandFree` (with `uprightMaxDegS` 0 the carry is ignored, so `e653099`'s identity holds); 1 mutant red |

### 9.2 The gates (his ten stretches far out at 60 frames a second unless said; before = `0816078`'s code as the auditor measured it)

| gate | now | before this round | `1.0.147-` (`6f47219`) | verdict |
|---|---|---|---|---|
| (i) hold walks, set where 6f sets it | `z_far`, `z_close`, `b_close` 6/6, `zT_far` 2/2, `b_far` s0; `b_far` s1, s2: the level face's exit FREED, no hold, the back honoured at once | `b_far` none of 6 | as base | ✅ |
| (i) no re-crossing under a steady push | none anywhere | — | — | ✅ |
| (i) come-back honoured as in 6f | `z_close`, `b_close`, `zT`, `zC` as base; `z_far` s2 not (s3 – s5 yes) | `b_far` s2, s4 never | | ⛔ `z_far` s2 |
| (i) refused both ways | nowhere | | | ✅ |
| (ii) R7 away, median / p95 | **14.9 / 83.6** (target ≤ 14.1) | 16.3 / 92.7 | 12.1 / 61.1 | ⛔ +0.8° |
| (ii) R7 near the vertical | 19.7 / 103.4 | 20.5 / 102.9 | 11.6 / 52.2 | |
| (ii) R7 picture under 5° / 5° or more from the logic | 14.0 / 79.7 · 37.2 / 146.2 | 15.1 / 87.7 · 41.7 / 156.8 | | |
| (iii) gravity over 20° | 7.3 % | 7.1 % | 35.4 % | ✅ |
| (iii) gravity's roll a metre | 57.2° | 57.0° | 101.5° | ✅ |
| (iii) a frame turning the camera over 90° / 45° | **1** (98.3°, `ilmj_39s`) / 55 | 0 / 45 | 0 / 5 | ⛔ |
| (iii) frames held a metre (the auditor's measure) | 1.4 | 1.7 | 2.7 | ✅ |
| (iv) `uprightPicture` 0 = `7bcae02`; `freeTurnMaxDeg` 0 = `6f47219` | three replays 2 794 / 2 794 and `ilmj_23s` 886 / 886 identical, both | | | ✅ |
| (v) `Scene_1` over its top | 169 frames (168), turning 632°, no reversal, 0 errors | | | ✅ |
| (v) level entry | the a walks: 0 errors, drift 0; straight dy drift (mm) −177, 139, −271, 187, −444, 289 | −179, 135, −244, 192, −337, 280 | −96, 92, −167, 154, −251, 235 | ⛔ px 6 |
| (v) close in | `ilmj_23s` = 6f; `ilmj_99s` roll 32.0 (49.6); `vyah_11s` 48.4° a metre (29.0) | the same | | ⛔ `vyah_11s` (§9.3) |
| (v) 143 frames a second | 0 errors; largest camera turn 43° and 21°; over 20° 6.9 and 7.8 % | | | ✅ |

### 9.3 What the frames say (roots)

* **R7's loss is not the finger's reading.** Split by the frames since the last FREED change: from 21 frames on, the median is 11.9° (n 706, `1.0.147-`
  12.1°); 3 – 20 frames after one it was 51° before UD11 and is 21 – 33° now. The holds those changes set last 20 – 50 frames: the dy held, only the
  dx passes, the gizmo goes sideways. The ones left are freed IN the band (UD4b, `w` under 1 after the change), which UD11 as briefed keeps.
* **The 98° frame** (`ilmj_39s` f629): the frame AFTER a freed change, the logic's view jumping 13 → 33° from the vertical across the band; φ 57 → 9°
  in one frame — the carry `c` = 0.70 of a `Δα` that is not a roll: F3's shape, one frame later (F3 covers only the change's own frame).
* **`z_far` s2**: the back (12.2 mm) fell inside the timed turn; law U has the picture upright by frame 86 while the logic is still turning (6f: frame
  98), so on the logic's glass most of the back is a dx — the hold's band counted 5.1 mm, not 12.2, and kept the come blocked.
* **`vyah_11s` close in (R4)**: all the excess roll is ONE timed turn (f672 – 690: 160°, law U inactive there, `w` 0) that rolls gravity the long way
  (−80 → ±180 → −1°) where `1.0.147-`'s goes −80 → −1°. The trajectory parted from f0 (the rest made upright far out, UD5, 1.4°) and the gizmo was
  7.6 cm elsewhere by f670. Not law U's code: no fix.
* Like for like: the walker steers by the glass; a pure glass dy on an upright picture 7° from the logic leaks ~0.25 px a frame of dx — a held push
  slides slowly along the axis (`z_far`: 100 – 215 mm over 100 frames; 6f still). On `zT_far` the dx round the tip, a small logic dy, sets the hold
  again (6f: the hold ends there); the dy still moves both ways (blocked 0 – 2 frames).

### 9.4 Amendments the frames ask for (none built) — ⭐ for his review

1. **UD11 to every change freed where the picture keeps its roll** (UD4b's in the band too): the frames 3 – 20 after such a change are what keeps R7
   over target. The question for the owner: after a freed change in the band the picture rights itself in up to 1/8 s — a turn he sees, or not?
2. **F3 extended to the frame after a freed change** when the logic's view crosses the band (the 98° frame) — or the carry `c` taken as `min(w)`
   over the change and the next frame.
3. **The hold's band during a timed turn read on the turn's end frame** (`z_far` s2) — a rule about the hold, so the owner's.

### 9.5 What he will feel

Far out the scene stays upright as before. Over the top and the bottom face the dy hold behaves as in `1.0.147-`: the push that crossed never brings
the gizmo back; after a crossing he does not see turn (a freed change, fully upright), no hold: the finger goes on, and back at once. The finger
steers a little better than last night (the mirror) but still worse than `1.0.147-` for a third of a second after a fast pass over a ridge. One flick
of 98° on one of his ten stretches. Close in as before. **Slider label changed**: ☰ › ORBIT › UPRIGHT PICTURE, *the rest to upright, its pace*.
**Not run**: the corner loops, the stretches at 0.736, `Scene_0` up, the edge and ridge walks; `z_far` s2 not re-run under amendment 3.
