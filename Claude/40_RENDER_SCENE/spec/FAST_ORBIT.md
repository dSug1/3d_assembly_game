# A fast orbit over many edges — one follower instead of a train of turns (2026-11-17)

> **STATUS** · ✅ **THE OWNER'S GO, the night of 2026-11-17** — the build as briefed: §1 – §5 (branch `1.0.148-`, from `1dac167`); as built: after §5 — ⛔ FO1's first build measured and reverted (§6); ⭐ the fix rounds on the contract amended (§7); ⛔ fix round 1 (test 2) built on §7, measured, NOT BUILT — reverted (§8); ⛔ fix round 2 (test 3, the last) — three realisations measured, NOT BUILT — reverted (§9): the abort, back to `1.0.147-`
> **OWNS** · how a camera turn behaves when the gizmo crosses edges fast: which turns hold the gizmo, a running turn redirected, the pace of a turn that
> does not hold · **READ WITH** · [`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §14 (the proposal: the turns counted, the literature, why nothing
> drifts), [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) §1 (the rules T1 – T12), `scripts/probes/ORBIT_GATES.md` (the gates). The dossier:
> [`RND5.md`](../../00_CORE/queue_notes/RND5.md).

## 0. The owner's words (verbatim, 2026-11-17)

His question: [`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §14. **His go:** *"I will go to sleep. Therefore, proceed with the following and do not stop or
ask me question until you finish: - create a new branch 1.0.148- and move to this new branch - built the fast orbit, test it, make sure there is no
regression. If the test fail, fix it and retest. If the test fail another time, fix and retest. If the test fails a third time, abort and revert to the
branch 1.0.147-. If the test pass, update the md files, deploy. - perform the full audit of the orbit charts (either on the work of branch 1.0.148- if
the fast orbit is successful or on the work of branch 1.0.147- if you reverted). Proceed with one round of fixes if required, test, make sure no
regression. If test fail, report and wait my instruction. - Once audit is complete, update the md files, prepare for the merge into worktree
"3d_assembly_game". I will then authorize the merge, you will merge, and we will then continue our work on the orbit's surface."*

**The job list modified the same night** (his words whole in [`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §15): *"once you have successfully completed
branch 1.0.148- or you have reverted to 1.0.147-, insert the build and test of entry silent … before you perform the full audit"*, and *"make sure
that this can be done after the fast orbit (i.e. the fast orbit does not need the entry silent built beforehand"* — it does not: FO1 and FO2 are built
and gated on a tree without it (§15's E4).

**And one more, the same night**: a defect he reported — after a level face's far edge or the zenith edge on `Scene_0bis` he often cannot revert the
dy — *"Fix that before the full audit"* → [`DY_HOLD_REVERSAL.md`](DY_HOLD_REVERSAL.md). **The night's order**: the fast orbit (this file) and its
deploy → the dy hold's fix → the silent entry → the audit → the final documents, the merge prepared.

## 1. The decisions taken for him to review (Fable, that night — he asked for no question)

| # | decision | why | to change it |
|---|---|---|---|
| F1 | Two packages: **FO1** = the proposal's parts 1 – 2 (a running turn redirected; no hold under the limit); **FO2** = part 3 (the eased pace), only once FO1 has passed | §14: each part measurable alone; LF2's lesson on a pace | — |
| F2 | His three-failures rule applies to FO1 (the abort: back to `1.0.147-`). FO2 failing = FO2 alone undone, FO1 kept and deployed | FO2 is the risky part; to lose FO1 for it would lose the answer to his question | his word |
| F3 | **Only outside close in** (the automatic tilt's latch off). Close in every turn holds the gizmo as today | close in the square camera's pitch runs beside a turn (two clocks) and the long way round is open ([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §12); close in is for placing the piece, not for viewing (his D-T1) | a later package |
| F4 | The limit is a slider, default **90°**; **at 0 every turn holds — today's game, bit for bit** | his comparison on the phone; the OFF gate | the slider |
| F5 | The eased pace (FO2) ONLY on a turn that does not hold the gizmo; a held turn (a half turn) keeps the one speed | LF2: a pace on a held half turn changed its path far out | — |
| F6 | The ease is a slider, default **100 ms** (the time to reach the one speed from rest); at 0 today's pace, bit for bit | a guess, for his hand | the slider |
| F7 | The coast stopped at a crossing, the dy hold after a half turn (T9), the band at every trigger (T11): as today | not part of his question | — |
| F8 | ONE deploy, once both packages are settled | one look for him | — |
| F9 | A far edge's HALF TURN coming out the other way round is LISTED, not a failure (G3's note) — added by the lead at 22:45 while FO1 was being built | far out the two-target drawing takes a half turn the short way (ratio about 1.05) or the long way (about 1.4) by a degree of its start pose; it is so at the base already ([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §10.3's far walk, §11.2, §12), and both LF2 and (iv′) met it; a gate that fails on it would undo the build for a defect that is not its own | the drawing's own fix (§13's table, row 1) |

## 2. FO1 — a running turn redirected, the gizmo not held under the limit: the contract

1. **Which turn holds.** A turn of the picture run by TIME (a transition's `asmZoneMix`: a zone's switch, a free face's entry or exit, the spit's side, a
   tilt's exit) holds the gizmo only if (a) its angle — the one rotation from the pose shown to its target — is at or over the limit, or (b) the
   automatic tilt's close-in latch is on, or (c) the limit is 0. Decided ONCE, at the first frame the angle is known, and kept for that turn's life
   (held until it is known). A pure function in `src/input`; the wiring holds the state and the call.
2. **A turn that does not hold**: the orbit's steps are honoured while it runs; the finger is read as today (in a spit: off the picture drawn). A change
   of frame arriving meanwhile replaces the turn FROM THE POSE SHOWN — the code's own way today (`zoneSwitch`, `seamTurnStart`, `freeFaceFrame`,
   `crossTurn`), with the piece's ease carried (`easeCarry`).
3. **Unchanged**: a turn paced by the finger (the approach's entry, the way out of close in); the square camera's own turn; a held turn's pace, its dy
   hold (T9); the band (T11); the coast stopped at a crossing; WHEN a turn fires; the frames; what drives the piece and the camera.
4. **The state never reads the fade** ([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §14): a free face entered with no entry edge, and a zone's switch
   exactly at a pole of the world's map, read the TARGET while a turn runs (the up of `cameraPrev`, the direction without its ease).
5. **The fallback, if a finger along an edge shows the picture going back and forth more than at the base**: a turn that would send the picture back
   toward the frame just left, a short time after leaving it, holds the gizmo as today — ONE pure rule, no geometry named. If that does not pass
   either: FO1 is not built.

## 3. FO2 — the pace eased on a turn that does not hold: the contract

1. A turn that does not hold the gizmo starts from the picture's own turning speed along it (none: from rest), gains speed at the one speed per
   `tiltEaseMs`, never exceeds the one speed, and slows so as to stop on its target (the "arrive" law). A turn redirected keeps the part of its speed
   that points along the new turn. A pure function in `src/input/orbit_tilt.ts`.
2. A turn that HOLDS the gizmo, a turn paced by the finger, the square camera's turn: untouched — frame for frame.
3. At `tiltEaseMs` 0: FO1's game, bit for bit.

## 4. What "the test passes" means — the gates

**The base** = the code of `1dac167` (= the live `c343c4f`'s). The existing gates' base recordings are the session scratchpad's `lf3/base`; the new FAST
walks are recorded at the base BEFORE any change under `src`.

| gate | what must hold |
|---|---|
| G0 | `npm run verify` green; every new vector shown red on a mutant |
| G1 — OFF | the limit at 0 (FO2: the ease at 0): the three replays and the level-entry walks FRAME FOR FRAME against the base (FO2: against FO1's end) |
| G2 — close in | at the defaults, every turn made while the close-in latch is on: turn for turn as at the base (its frames, its one rotation, its path, the gizmo held) |
| G3 — the held turns | at the defaults, every turn at or over the limit still holds the gizmo until it is whole and keeps its dy hold as at the base; where its START is the base's (the gizmo within 5 mm, the picture within 2°) its one rotation within 2° and its path ratio not worse (+ 0.02). ⚠ **KNOWN, NOT THIS BUILD'S** (F9 — it binds the builder AND the auditor): a half turn that starts from another pose than at the base and comes out the other way round (short ↔ long) is LISTED with both figures and is not a failure, provided its largest frame is not over the base's worst half turn on the same walk + 1°, and nothing else of it changed (one turn, the gizmo held, its dy hold) |
| G4 — no drift | (i) on every frame with no turn running the pose drawn equals the target, to the last bit; (ii) a fast walk's orbit angles replayed frame by frame with every turn whole at once (`tiltRollDegS` 0): the state identical on every frame, the final camera identical to the last bit |
| G5 — the slow walks | at the defaults, each existing far-out walk: no error, the health clean, its route completed in no more frames than at the base + 10 %, its worst frame (the picture's turn in one frame) not over the base's + 1° |
| G6 — the benefit | FAST walks (20 and 30 px a frame, steered to the same targets: the corner loops both ways at both tips far out and part way, along the bottom's edge, across the bottom and back, over the top ridge), against the base on the same walk: no frame with the gizmo stopped for a turn under the limit; per loop the picture's total turning not over the base's + 5 %; the picture's reversals (its roll changing side by over 1° a frame) not more than at the base; the frames per loop not more; the worst frame not over the base's + 1° |
| G7 | the docs as built and their two tests; the tree clean; no probe process, driver script, server or profile folder left |

FO2's own: G1 against FO1's end; the held turns turn for turn as at FO1's end; G6 against FO1's end, with the total turning or the reversals BETTER on
the fast corner loops (else no benefit: not built); G4 again.

## 5. Not in this build

Close in (F3). The close-in long way round, the far-out entry turn's size, one rule for every tilt on the held turns, the 27° back over the entry edge
([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §13's table, rows 1 – 4). Any change to what drives the piece and the camera. A wait before a turn, a
forecast of the next crossing, fewer frames at speed (§14: looked at, not proposed).

## 6. FO1 as measured — NOT BUILT (2026-11-18, the builder of the night's chain)

**The result first.** FO1 was built (`45b0d2f`), measured, and **reverted** (`2a5a28b`): the game's code is the base's again (`892b6a3`'s `src` and
`tests`). Its own fallback (§2 5.) was built and measured too; with it, the picture still goes back and forth more than at the base on the 30 px loops,
so by §2 5. FO1 is not built. To look at it again: `git revert 2a5a28b` (one commit brings the code, its slider and its 15 vectors back).

**What was built** (in `45b0d2f`): the limit `turnHoldFromDeg` (90; 0 … 180; a slider under TILTED POLE next to the turns' speed; at 0 every turn holds);
the decision `timedTurnHolds` in `seam_turn.ts`, made once at a timed turn's first frame in `zoneMixPose` (the picture's one rotation from the pose shown
to its target; the close-in latch on, the limit 0 or the angle unknown: held) and kept on the turn (`asmZoneMix.hold`); `tiltClampStep` lets the
orbit's steps through a turn decided free; the two readers (a free face entered with no entry edge, a zone's switch at a pole) read the target while such
a turn runs (`fadeFree`, `readNotFade`, `bareDir`); the fallback `turnGoesBack` — a turn that would send the picture back toward the one the last free turn
left, within 300 ms (`TURN_BACK_WINDOW_MS`), holds. Vectors: `tests/fast_orbit.test.ts` (15; 16 mutants each turned it red: the limit, close in, the unknown angle,
the angle at the limit, the decision passed, the readers, the window, back / on, the default, the range, the four wiring pins).

**The gates** (base: `<scratchpad>/fo1/base` and `lf3/base`; now: `fo1/off`, `fo1/def`; the runbook `scripts/probes/ORBIT_GATES.md` §9).

| gate | measured | verdict |
|---|---|---|
| G1 — the limit 0 | the three replays identical frame for frame (2794 / 2794 each); level entry a 6 / 6 and b 27 / 27 walks identical; the 23 fast walks identical | ✅ |
| G2 — close in | `tilt_check` default, out (4 px, 1 px), ridge, press, rim, pole on the three scenes: every recording identical frame for frame; `ridge_check` tip far and close in identical | ✅ |
| G3 — the held turns | the over-the-ridge walk's half turn identical (180°, 28 frames held); the dy holds of `across_check` as at the base (936 → 937 frames) | ✅ where measured |
| G4 (i) | on every frame with no turn running, in all 23 fast walks, the pose drawn = the target to the last bit | ✅ |
| G4 (ii) | 18 walks identical but in the last digits (≤ 1.1e-9), 3 to the last bit; ⚠ `f_ccw_p_d736_px30` and `f_ccw_m_d736_px30`: the free face's carried heading differs on ONE frame (the entry read while a HELD turn ran — the readers were changed only during a free turn); ⚠ `f_s1_over_px20` (`Scene_1`, no turn at all): the camera 5.6 mm off from frame 20 — the replay's inputs are not the whole state there (a probe limit, not the build) | ⚠ |
| G5 — the replays at the defaults | `Scene_1` the last digits (≤ 6.8e-10), `Scene_0` identical, `Scene_0bis` another play from frame 315 (drag 5) — ⛔ **one free turn there began at 58.8° and its target ran away with the finger: 113° in the end, drawn over a PATH of 342° in 36 frames (ratio 3.02, 17.4° in one frame)** — package A's circle, by another road | ❌ |
| G6 — the fast walks | the gizmo never held for a turn under 90° (but the fallback's); the total turning 18 – 61 % lower on every loop walk; the frames 3 – 30 % fewer; ⛔ the worst frame over the base + 1° on 5 walks (12.6 → 15.6°, 13.6 → 15.8°, 13.6 → 15.9°, 16.8 → 20.9°, 19.8 → 24.3°: the finger's own turn now adds to the timed turn's 6° a frame); ⛔ the reversals more than at the base on 5 walks (30 px: 4 → 14, 6 → 12, 10 → 16, 15 → 18; the edge at 20 px 0 → 1, in the lift after it) | ❌ |

**What a hand would have felt** (the walks at 20 px a frame far out): a corner loop in 11 – 17 frames instead of 19 – 36, the picture turning about half as
much, no stop at each edge; along the bottom's long edge at 20 px, 21 frames instead of 91 and 92° of turning instead of 332°. And on the fastest finger
(30 px a frame), the picture swinging back and forth up to three times as often, and frames of 20 – 24° where the base had 17 – 20°.

**Why, in plain words.** A timed turn fades from a FIXED picture (the pose shown when it began) to a target the finger now keeps moving. When the gizmo
was held the target stood still; free, the target runs ahead of the fade, the angle left grows instead of shrinking (58.8° → 267° in the replay), and the
fade goes round the long way. And each frame the finger's own turn adds to the turn's 6° (`tiltRollDegS`). Both are in the two-target drawing and the
turn's pace — which this build was told not to touch (§2 3., lesson 3 of the brief).

**Options for the owner** (none built): (a) a free turn that eases the GAP between the shown and the target rather than fading from a fixed pose (the
target's own motion passed through, only the initial difference dissolved — as the piece's direction is eased, `easedDir`); (b) a free turn whose
angle grows past the limit while it runs becomes held (the decision made once today: the brief forbade switching it inside a turn); (c) FO2's eased pace
alone does not cure either (it never exceeds the one speed, and the circle is the fixed start, not the speed); (d) keep today's game (the limit 0).
The probes stay: the fast walks and their base (§9 of the runbook) are the gate any next attempt is measured on.

## 7. The fix rounds — how the three tests stand, the root cause, the contract amended (the lead, 2026-11-18 00:30 — written BEFORE the build)

**How the three tests stand.** His rule: *"If the test fail, fix it and retest. If the test fail another time, fix and retest. If the test fails a
third time, abort and revert to the branch 1.0.147-."* The night's chain made ONE real test (§6). Its two fix rounds changed nothing and measured
nothing (43 and 26 seconds each): the cure lay outside the contract — and that contract (§2, the decisions F1 – F9) is the lead's, written in his
place; it is not his. To count those two rounds as his second and third failure would be untrue. So: **test 1 failed (§6); the two fix rounds he
ordered are run now, on the contract amended below; a failed test 3 is the abort — back to `1.0.147-`.**

**The root cause** (read in `zoneStep` and `zoneMixPose` after §6's figures). A turn's picture is a fade between the pose shown when the turn began —
FIXED — and the target; its share is the angle turned so far over the turn's whole angle, read every frame from that fixed pose to the target. With
the gizmo held the target stands still. Free, the target moves with the finger: the whole angle grows (58.8° → 267°), the share falls back, and the
picture swings round its fixed START instead of following the target — the circle. It is not the pace, and it is not the two-target drawing's
branches.

| # | decision (the lead's, for him to review) | why |
|---|---|---|
| F10 | **A turn that does not hold the gizmo: its START is carried with the target.** The pose shown at the turn's first frame is kept in the TARGET's own frame (as it was at that frame) and put back from the target's pose every frame. So the turn's angle stays its first frame's, its clock runs over that angle alone, and the finger's own orbit passes through whole — only the turn's own gap dissolves. A turn that HOLDS the gizmo: today's code, untouched | the root cause. The oldest form of it — a displacement laid over a motion and dissolved: Bruderlin & Williams, *Motion signal processing* (1995); Witkin & Popović, *Motion warping* (1995); the stair step smoothed in Quake's view (1996, source 1999) — all over 20 years old. ⛔ Not inertialization's own curve (2018: patent status not established) |
| F11 | **Its pace: the one speed is the PICTURE's budget.** In a frame the turn advances by the one speed's step LESS the target's own turn in that frame (never back). The picture never turns faster than the faster of the two — the finger's own orbit, or the one speed; under a very fast finger the turn waits, and dissolves when the finger slows | §6: the finger's turn added to the turn's 6° a frame; his words: *"ignoring the intermediate quaternion"*; the gate G6 stays as written |
| F12 | The two readers (§2 4.) read the TARGET during EVERY timed turn made outside close in with the limit not 0 — the first build changed them during a free turn only, and a held turn's fade was still read (G4 (ii), two walks) | §2 4. as written |
| F13 | A free turn still running when the close-in latch comes on is replaced by a held turn from the pose shown (the code's own way to replace a turn) | F3: close in every turn holds |
| F14 | §2 5.'s fallback (`turnGoesBack`) stays only if the walk along the edge needs it once F10 and F11 are in — measured, said | one rule less if it is not needed |
| F15 | G6's reversals are compared per walk, as written, where the walk crosses as many edges as at the base (within 20 %); else per crossing, both figures given. G4 (ii) on a walk with no turn at all says nothing: the probe is completed, or the walk is left out and said so | §6: at 30 px a frame the loops' routes wander (the base's holds also slow the steering) — like with like |
| F16 | FO2 (the eased pace) is NOT run tonight | the proposal put it after his look at parts 1 – 2 ([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §14); F11 already slows a free turn under a fast finger; the night's list is long |

**Unchanged**: §2 1. (which turn holds: decided once, at the first frame the angle is known — with F10 that angle no longer grows), §2 2. and 3., the
decisions F1 – F9 but F8 (one deploy, of FO1 alone), the gates G0 – G7 of §4 as written (with F15's reading), the limit at 0 = today's game bit for
bit. **Measured first**: the `Scene_0bis` replay at the defaults (§6's circle), the 30 px loops, the walk along the edge, the no-drift check — then
the OFF and close-in gates. As built: §8.

## 8. Fix round 1 (test 2) as measured — NOT BUILT (2026-11-18, the builder of fix round 1)

**The result first.** The second build (`83a7713`: §7's F10, F11, F12, F13; no fallback) was measured and **reverted** (`18787b9`): `src` and `tests`
are `892b6a3`'s again. It **cures the circle** but fails G6 and G5: the picture now follows the finger's own fastest turn while a free turn runs. To
look at it again: `git revert 18787b9`. Not deployed: there is nothing for the owner to look at on his phone.

**What was built**: the start of a free turn kept in its first frame's target's frame and put back from each frame's target (`startInTarget`,
`startPutBack`, in `seam_turn.ts`; given to both drawings); the clock of a free turn advanced by the one speed's step less the target's own turn in the
last frame (`turnBudgetStep`); the two readers on the target during every timed turn made far out with the limit not 0 (`timedTurnReadsTarget`); a free
turn running when the close-in latch comes on replaced by a held one from the pose shown (`freeTurnEndsAtLatch`). A turn that holds: today's code.
Vectors `tests/fast_orbit.test.ts` (25); 19 mutants, each red (the axes, the origin, the up, the piece of the put back; the budget negative, blind,
reading NaN; the readers close in, at 0, by the hold; the latch every frame, on a held turn; the wiring's fixed start, carry, two-target drawing, held
pace, target's turn, readers, F13).

| gate | base → now | verdict |
|---|---|---|
| the circle (`Scene_0bis` replay, 20 free turns) | the turn's angle: grew 58.8° → 267° (§6) → **constant** in every turn (spread 0.0°); the gap drawn ↔ target grew at most 0.93° a frame in 18 turns, 1.13° and 1.08° in two; every turn not replaced ends on the target (gap 0.00°); path ≤ the target's own path + the first gap (e.g. 97° = 53° + 42°, the §6 turn's 342° for 113° gone) | ✅ (two frames 0.1° over) |
| G5 replays | `Scene_0`, `Scene_1`: identical to the base, every frame. `Scene_0bis`: another play from frame 315; the view's largest frame 14.1° → 13.8°; **the roll 18.9° → 29.3°** (f1704: the target's own roll 29.8° there, at the free face's exit in the spit); gizmo steps ≤ 98 mm, 0 errors | ❌ |
| G6 fast walks (23) | the gizmo never still for a turn under 90°; total turning −3 % to −68 % on 17 walks, unchanged on the three with no free turn, **+17 %, +18 %, +28 %** on three 30 px walks; **the worst frame over the base + 1° on 9 walks** (12.6 → 17.7°, 13.6 → 19.6°, 16.8 → 26.8°, 17.3 → 29.6°, 25.9 → 43.0° …); **more reversals on 11** (6 → 7 … 4 → 14) | ❌ |
| F14 — the edge (2 / 8 / 20 px) | reversals 0 / 0 / 0 → 0 / 0 / 1 (the one in the lift after the walk, the walk itself 0 → 0); turning −3 %, −22 %, −50 % | the fallback NOT needed: not built |
| G1 – G4, G0 on `83a7713` | NOT MEASURED (stopped at G6, the brief's rule); its vectors and typecheck green on the files touched | — |

**Why, in plain words.** With the start carried, a free turn's picture turns exactly as its target does, plus the turn's own small step. So the
worst frame is the target's own: in each walk's worst frame the target itself turned 15 – 41° (e.g. 43.0° drawn, 41.3° the target's, at the map's pole
at 30 px a frame). At the base the same moments fall inside HELD turns: the gizmo stops, the target stands still, and the finger's fastest stretch
is never drawn. F11 cannot slow the picture below its target without letting the gap grow, which F10 forbids. And under a fast finger the budget is
0, so a turn waits, the next change of frame replaces it from the pose shown and the gaps add up: turns replaced before whole 3 → 16, and some sums
reach 90° and hold again (51 frames on `f_ccw_p_far_px30`).

**What is left — options for the owner** (none built): (a) judge the worst frame against the TARGET's own turn (+ 1°) instead of the base's — the
cure as built passes that; (b) a free turn held again while the target turns faster than the one speed (a hold decided inside a turn: §2 1. forbids
it); (c) smooth the finger's own orbit where it turns fastest (the map's poles, the spit's axis) — a change to what drives the camera: out of bounds;
(d) keep today's game (the limit 0). Test 3 is the last: a third failure is the abort, back to `1.0.147-`. Recordings: `<scratchpad>/fo1b`.

## 9. Fix round 2 (test 3, the last) as measured — NOT BUILT (2026-11-18, the builder of fix round 2)

**The result first.** Test 3 failed: by the owner's rule this is the abort, back to `1.0.147-`. The third build (`1b6b1a7`) was measured and
**reverted** (`3ad84da`): `src` and `tests` are `892b6a3`'s again. Nothing to look at on the phone. To look at the build: `git revert 3ad84da`.

**Fix round 1's blockers, their root cause** (read on `<scratchpad>/fo1b`, `scripts/probes/turn_where.mjs`): every worst frame was INSIDE a free turn
and equal to the target's own turn there (43.0° / target 41.3°, 29.6° / 29.7°, 28.9° / 28.9°; the `Scene_0bis` replay 32.3° / 32.8°). With the start
carried, the picture turns as fast as the target. At 30 px a frame the target itself turns up to 21 – 52° in a frame during a free turn (90th
percentile 15 – 25°, the third build's walks). At the base those stretches fall inside HELD turns: the gizmo is held, the finger's steps are dropped, they are never drawn.

**What was tried — three ways to realise F10 – F11** (each built, its 23 fast walks measured; recordings `<scratchpad>/fo1c`):

| realisation | free turn's worst frame | 20 px walks | 30 px walks | flags (G6) |
|---|---|---|---|---|
| v1: one follower — the picture from the pose DRAWN last frame toward the newest target, one speed's share, the two framed | 20.8° (the two framed carry the camera round with the piece) | WORST+ 1.0 – 1.4° on 3 loops, REV+ on 4 | holds ≥ 90° (38 – 43 frames), WORST+ up to 7° | 22 |
| **v2 (committed `1b6b1a7`)**: v1, the picture's turn capped at the one speed — about the piece when the two framed would turn more | **6.0°** | turning −45 % to −58 %, worst 6.0 – 9.8° (base 12.6 – 14.8°), fewer frames; ⚠ REV+ on 5 loops (2 → 3, 0 → 2; the edge 0 → 1) | the gap grows to 80 – 137°; the next turn holds and its first frame jumps 55 – 130° | 33 |
| v3: v2, but the gap never grows (the brief's circle check) | 17 – 42° (= the target's) | WORST+ 2° on 2 loops, REV+ on 4 (up to 2 → 9) | WORST+ up to 42°, holds ≥ 90° | 38 |

**The gates on v2** (base → now): G0 — `npm run verify` not run on `1b6b1a7` (its typecheck and the 8 touched test files green; 25 vectors in
`tests/fast_orbit.test.ts`, 16 mutants each red: the share, the step, the target reached, the step bound, the about-piece frame, the angles left, the
start drawn, the free turn drawn as held, the end, the readers, the latch); at `3ad84da` green. G5 — `Scene_0`, `Scene_1` identical to the base on
all 2794 frames; `Scene_0bis` another play from frame 314: the largest view turn **14.1° → 49.6°** (f482, a HELD turn started from a lagging free
turn's pose), roll 18.9° → 16.1° ❌. G6 ❌ (above). G1 – G4: NOT MEASURED (stopped at G6 and G5, the brief's rule).

**Why it cannot pass, in plain words.** Without the hold, a fast finger drives the camera's target through stretches where it turns 30 – 50° in one
frame. The picture can follow it (v1, v3, round 1: frames far over the base's worst), or lag behind it at the one speed (v2: every free frame within
6°). But a lag past 90° makes the next turn a held one, and the held turn's own drawing then starts far from its target and jumps. Every way to remove
that needs one of: a hold decided inside a turn (§2 1.), a change to a held turn's drawing (forbidden), or a slower finger orbit at those stretches
(a change to what drives the camera). None is in this chain's contract.

**What a hand would feel with v2** (not deployed): at 20 px a frame the loops in about half the frames, the picture turning half as much, never more
than 6° a frame inside a turn; at 30 px a frame the picture falls behind the finger, then a long held turn and a jump.

**The owner's options** (none built): (a) v2 with a hold decided again when a free turn's gap reaches the limit (changes §2 1.); (b) the gates judged
at 20 px only, with 30 px read as "beyond the one speed" (changes G6); (c) the held turn's drawing fixed for a start far from its target (§5, row 1 of
`LEVEL_FACE_ENTRY.md` §13's table); (d) keep today's game — the abort, `1.0.147-`.
