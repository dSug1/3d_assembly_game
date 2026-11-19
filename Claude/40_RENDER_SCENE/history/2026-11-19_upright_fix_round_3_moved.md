# Upright picture — fix round 3 as built and measured (moved out of `UPRIGHT_PICTURE.md` §11, 2026-11-19)

⭐ Moved whole, unchanged, to keep [`UPRIGHT_PICTURE.md`](../spec/UPRIGHT_PICTURE.md) under its 800-line cap when §17 was written (packet V1-fix).
Its links are written from `spec/`: read them from there.

## (was §11) Fix round 3 as built and measured (the builder, 2026-11-19, early morning; local commits, nothing pushed)

**The result first.** The carry is the logic's twist undone (UD6c) and a freed change never holds (UD11b). On his ten stretches no frame turns
the camera by more than 90° (round 2: one of 98°), the finger's way improves to **13.4°** median (round 2: 14.9°; `1.0.147-`: 12.1°), the dy hold
is round 2's on every hold walk. ⚠ At the old pace (1 440° a second) the new carry let gravity tilt more (over 20°: 9.6 %, its roll 69.5° a metre
— over the round's limits): **the rest's pace is now 1 800° a second** (7.8 %, 58.8°).

### (was 11.1) What was built

| commit | kind | what |
|---|---|---|
| `fb80fd0` | C | **T1, UD6c** — `uprightPaced`: `φ − c·τ`, `τ` = `twistAbout` of the logic's pose about the framed line over the frame, read by the law from its own state (`gp`, last frame's pose); `c = min(w, w before)`, 1 on a freed frame and a timed turn's first frame (`whole`; F2 and F3 one rule); the rest as before. 5 vectors, 6 mutants red |
| `f1f9b55` | C | **T2, UD11b** — `uprightHoldKept(freed)`: every freed change drops its hold, inside the band too; timed turns keep theirs. 1 mutant red |
| `4d4f658` | C | `uprightMaxDegS` **1 800** by default (the figures below); its two pins moved |

### (was 11.2) The gates (his ten stretches far out, 60 frames a second, at the default unless said)

| gate | now (1 800) | 1 440 | 2 160 | round 2 | `1.0.147-` | verdict |
|---|---|---|---|---|---|---|
| frames over 90° | 0 | 0 | 0 | 1 | 0 | ✅ |
| frames 45 – 90° (aim under 27) | 47 | 22 | 97 | 55 | 5 | ⚠ under round 2, not under half |
| gravity over 20° (limit 9.3 %) | 7.8 % | 9.6 % | 6.3 % | 7.3 % | 35.4 % | ✅ |
| gravity's roll a metre (limit 62.2°) | 58.8° | 69.5° | 58.3° | 57.2° | 101.5° | ✅ |
| frames held a metre | 1.6 | 1.6 | 1.8 | 1.4 | 2.7 | ✅ |
| R7 away from the vertical, median / p95 | 13.4 / 71.9 | 13.1 / 64.9 | 13.5 / 77.6 | 14.9 / 83.6 | 12.1 / 61.1 | ✅ |
| hold walks | as round 2 on all 28 sub-walks; refused both ways nowhere | | | | | ✅ |
| 143 frames a second (`ilmj_23s`) | 0 errors, largest camera turn 46° | | | 43° | | ✅ |
| identities | `uprightPicture` 0 = `7bcae02` and `freeTurnMaxDeg` 0 = `6f47219`: the `Scene_1` replay 2 794 / 2 794 and `ilmj_23s` 886 / 886 identical. ⛔ `uprightMaxDegS` 0 + `uprightBandFree` 0 against `e653099`: differs from frame 3 – 6 (§11.3) | | | | | ✅ two; ⛔ the third |
| `Scene_1` over its top | 169 frames, 632°, no reversal, 0 errors | | | 169 | 168 | ✅ |
| level entry, `Scene_0`'s bottom close in | 0 errors, drift 0 | | | | | ✅ |

### (was 11.3) What the frames say

* **The default**: at 1 440° a second the upright's own swing (the view passing near the vertical, now through the rest) lags: gravity over 20°
  9.6 %, its roll 69.5° a metre. 1 800 meets both limits with 47 frames of 45 – 90°; 2 160 halves the tilt but doubles those frames (97). The figures
  support **1 800**. The assumption of §10 the frames refute: that the rest at 1 440° a second would leave the picture "still exactly upright" on his
  paths — at his pace the upright's own turn often runs over 24° a frame.
* **The identity with `e653099`** (`uprightMaxDegS` 0 + `uprightBandFree` 0) no longer holds, from frame 3 of the replays and 6 of `ilmj_23s`.
  Not T1: with `uprightMaxDegS` 0 the law returns before the new carry. Round 2's deliberate changes act there — the finger's mirror fixed (wherever
  the picture is turned from the logic's pose, from the start: the rest made upright, UD5) and the holds dropped (UD11, UD11b). Round 2 did not run
  this identity. The two switches that give back earlier games whole (`uprightPicture` 0, `freeTurnMaxDeg` 0) still do.
* **R7**: under UD11b the frames right after a freed change no longer hold the dy; 13.4° median (round 2: 14.9°).

### (was 11.4) What he will feel

Far out the scene stays upright; the rare flick of the whole view over a ridge is gone (none over 90°). The finger steers closer to his way than last
night. Over a top the floor rights itself in about a tenth of a second (1 800° a second). After a crossing he does not see turn, no hold.
**Slider**: ☰ › ORBIT › UPRIGHT PICTURE, *the rest to upright, its pace* — 1 800 now (1 440 is calmer frame to frame, tilts more; 2 160 the reverse).
**Not run**: the corner loops, the stretches at 0.736, close in, the straight dy walks; `ogse_3s` at 143 frames a second.
