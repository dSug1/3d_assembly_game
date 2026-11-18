# A fast orbit over many edges — one follower instead of a train of turns (2026-11-17)

> **STATUS** · ⭐⭐⭐ **2026-11-18: WHY THE THREE BUILDS FAILED — the specification, not a limit (§11); the silent entry's 0.3° on the same root — ✅ the owner: *"Keep version 7"* (§11.4); FO3, the picture a follower of the logic, sized on the owner's measured pace — ✅ AGREED, to be built (§12)** · ✅ **THE OWNER'S GO, the night of 2026-11-17** — the build as briefed: §1 – §5 (branch `1.0.148-`, from `1dac167`); as built: after §5 — ⛔ FO1's first build measured and reverted (§6); ⭐ the fix rounds on the contract amended (§7); ⛔ fix round 1 (test 2) built on §7, measured, NOT BUILT — reverted (§8); ⛔ fix round 2 (test 3, the last) — three realisations measured, NOT BUILT — reverted (§9); ⛔ **THE ABORT DONE: the work is back on `1.0.147-`, the fast orbit is NOT in the game** (§10: what was learned, the lead's proposal)
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

## 10. The abort, done — what the three builds taught, what the lead would propose (the lead, 2026-11-18 01:25)

**The abort.** Three real tests, three failures (§6, §8, §9): his rule applied — *"If the test fails a third time, abort and revert to the branch
1.0.147-."* The worktree is back on `1.0.147-`. The night's documents and probes were carried over (twelve commits picked, the tree identical to
`1.0.148-`'s tip); no commit past `892b6a3` touches `src` or `tests` there. That branch — renamed `1.0.148-Fast-orbit-three-builds-reverted` on 2026-11-18, when the owner asked for a new `1.0.148-` (FO3's) — is kept, local and not pushed, as the record of the three
builds: `45b0d2f`, `83a7713`, `1b6b1a7`, each reverted by the commit after it. Nothing deployed: the live game is `892b6a3`'s code. The night goes on
from `1.0.147-`: the dy hold, the silent entry, the audit.

**What the three builds taught** (measured, §6 – §9):

* The first build's circle had one cause — a turn fading from a start fixed in the world while its target moves — and it is cured in both later
  builds.
* What is left is not a method's fault. With the gizmo free, a fast finger turns the camera's TARGET itself by 21 – 52° in one frame at the gate's
  fastest pace (30 px a frame), near the map's poles and the spit's axis. Today's game never draws those stretches: its turns hold the gizmo there.
  Without the hold the picture either draws them (builds 2, v1, v3: frames of 17 – 43°) or lags behind them (v2: 6° a frame at most, a lag of 80 –
  137°, then a held turn that jumps 55 – 130° in its first frame).
* At the gate's second pace (20 px a frame) v2 is better than today's game on three figures of four: the loops in 163 – 291 frames against 178 – 340,
  the picture's total turning 45 – 58 % lower, the worst frame 6.0 – 9.8° against 12.6 – 14.8°. The fourth is worse: more reversals on five loops (2 →
  3, 0 → 2; the edge 0 → 1).
* Found in today's game on the way: a HELD turn's drawing can jump far in its first frame when it starts far from its target and the piece has moved
  (§9, the outside findings) — only v2 makes such starts.

**What the lead would propose, if he wants the fast orbit taken up again** (NOT built, NOT measured — for his word): v2, with the gizmo held again
when a free turn's lag reaches the limit (90°) — §9's option (a). It keeps his rule that a turn of 90° or more holds, and it bends only the lead's own
§2 1. (the hold decided once). To be measured before any build: which pace his own fast orbit has — a play recorded on his phone would say whether 20
or 30 px a frame is the case to judge.

## 11. Why the three builds failed — the specification, not a limit (the lead, 2026-11-18, on the owner's question)

**The owner** (2026-11-18, verbatim): *"analyze why the fast orbit failed: it looks like for me that the specification and the logic behind the fast orbit
was not properly drafted. I see no link between gizmo movement and the smoothing of the camera-piece movement therefore I do not understand the reasons
you provided for the failure of the attemps: they should be overcomeable by a better logic design (for example a camera-piece ghost target and
camera-piece follower with intermediate transformed removed, or other state-of-the-art literature patent-free design)."*

**The result first.** He is right. The builds did not fail because the smoothing cannot be done. They failed because §2 – §7 specified a patch on the
turn events, not a model of the picture, and because §4 measured it with the wrong yardstick. §10's reason (*"the camera's TARGET itself turns 21 – 52°
in one frame"*) was a symptom of that design, not a limit: split into its parts, that fast turning is ROLL — the part a follower absorbs.

**How it was read** — offline, on the night's recordings (`fo1/base`, `fo1b`, `fo1c/v2` in the session's scratchpad; no game run): each frame's turning of
the picture split into the ORBIT ITSELF (the camera's place going round the assembly: the direction centre → camera) and the ROLL (the picture turning
about its own view axis: a frame's change at a crossing, a frame swinging near a pole or a tip). Scripts: the scratchpad's `fo_why/split.mjs`, `sim.mjs`,
`per_metre.mjs`.

### 11.1 What the recordings say (measured; the corner loops, 20 and 30 px a frame at 60 frames a second)

| | today's game (`fo1/base`) | build 2 (`fo1b`) | build 3, v2 (`fo1c/v2`) |
|---|---|---|---|
| frames with the gizmo stopped by a turn | 28 – 67 % of a loop's frames | 0 at 20 px | 0 at 20 px |
| the picture's turning in a loop: the orbit itself / the roll | 216 – 722° / 139 – 893° | 179 – 661° / 52 – 611° | 87 – 1165° / 57 – 1153° |
| worst frame, 20 px: all (orbit / roll) | 12.6 – 14.8° (9.8 – 12.8 / 9.0 – 10.7) | 11.3 – 19.6° (9.1 – 18.8 / 7.8 – 14.6) | 6.0 – 9.8° (6.0 – 9.1 / 5.4 – 6.0) |
| worst frame, 30 px: all (orbit / roll) | 16.8 – 30.5° (15.0 – 21.2 / 10.3 – 26.0) | 15.4 – 43.0° (13.0 – 24.7 / 9.4 – 35.7) | 55 – 130° (55 – 130 / 5.5 – 23.2) |
| ⭐ LIKE FOR LIKE, every 20 px walk: the roll shown per METRE of gizmo travel | **93° a metre**, the gizmo stopped in 39 % of the frames | **24° a metre**, stopped in 2 % | 27° a metre, stopped in 2 % |

* **Today the picture rolls about as much as it orbits, and the gizmo is stopped in a third to two thirds of the frames.** That stop-and-go is what a
  fast orbit over the heptagon looks like.
* **The logic's own jumps are roll.** On build 2's recorded TARGETS (the gizmo free): the worst frame of roll 59 – 153°, the worst frame of the orbit
  itself 11 – 21°.
* **Build 2's bad frames are roll** that no turn event carried (43.0° = 24.3 orbit, 35.7 roll): the frame swinging near a pole or a tip is not an "event".
* **Build 3's jumps are the camera's PLACE** (113.8° = 113.0 orbit): its follower capped the whole picture at the turns' speed, so the camera's place
  fell 80 – 137° behind the piece; a half turn then began, drawn the old way, and put the place back in one frame.
* ⭐ **Per metre of gizmo travel, build 2 already showed four times less roll than today's game** (the table's last row) — and §4's gates failed it:
  they compared a frame's worst and a loop's totals at one finger pace, with today's gizmo stopped four frames in ten.

### 11.2 The four errors of the specification (the lead's)

1. **The unit was the turn event, not the picture.** FO1 said which turn holds and how a running turn is redirected. A turn's drawing assumes a still
   target (build 1's circle), and every roll that is not an event passed unfiltered (build 2).
2. **No split between the orbit and the roll.** F11 made the turns' one speed (6° a frame) the budget of the WHOLE picture — the orbit itself asks 11 – 21°
   a frame at those paces. The lag was built in (build 3).
3. **Two drawings side by side** — the follower for a free turn, the old fade for a held one — with different assumptions: the jump at the hand-over.
4. **The yardstick.** (a) The paces were chosen, not measured: measured since (§12.1), 20 and 30 px a frame at 60 are the top tenth and the top
   fiftieth of his own pace — real, but the gates sat only there; none at his average (9.5 px a frame at 60), where both builds were better than today
   on the one walk made (8 px: 30 → 23 frames, 85° → 65° / 51° of turning). (b) G5 – G6 compared a frame's worst and a loop's totals with a game whose
   gizmo is stopped: with the gizmo free the same finger makes the orbit go further, so the comparison is not like for like. (c) A pace was written in
   px a FRAME: his desk draws 143 frames a second, the probes and the phone 60.

### 11.3 The link between the gizmo and the smoothing (his question)

* **Today a camera turn is a timed event that STOPS the gizmo until it ends** (T5). To end the stop-and-go, FO1 let the gizmo move during a turn under
  90°. From then on the turn's target moves while it is drawn. That is the only reason the gizmo entered the smoothing — and it was handled by patching
  the event's drawing three times instead of drawing the picture as a follower of the logic.
* **One link is real and stays in any design: the finger steers by the picture on the glass** (in a spit the finger is read off the picture DRAWN,
  `zoneFinger`). So the camera's place must not lag the piece, and a half turn (the glass upside down) must still hold. The roll may lag: the finger keeps
  its way on the glass.
* ⭐ **The silent entry failed the same night on the same root** ([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §16, its auditor): *a timed turn advances
  its share by the angle it had before the frame and applies it to the angle it has now — the target keeps moving.* One cause, two packages.

### 11.4 The silent entry's 0.3° — the same root, read frame by frame (the lead, 2026-11-18)

**The owner** (2026-11-18, verbatim; fix round 1 had missed one gate by 0.3°): *"Silent entry: if fix round 2 fails, let’s do a deep analysis of the
root cause before undoing the code. 0.3degree failure does jot warrant reverting to previous build."* Fix round 2 failed (v8, worse than v7:
[`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §16). ✅ **The chain was stopped on his word before its undo step.** Nothing was ever committed under
`src`: each version is a patch in the session's scratchpad — the best, v7: `es2/es_build_v7.diff`.

**Read** (the scratchpad's `fo_why/es_worst.mjs`): the clockwise loop on the −x side, far out — the same figures at 0.736. The frame that fails is the
second frame of the timed turn at the level face's exit.

| | today's game (`bc867a0`) | the silent entry, v7 |
|---|---|---|
| the turn's angle at its first frame | 57.7° | 14.4° |
| the turn's angle one frame later | 58.0° | 20.8° |
| the turn shown in that frame (the one speed asks 6.0°) | 6.03° | 8.64° |
| the whole frame: the turn and the camera following the finger (3.95° in v7) | 7.54° | **8.80°** (the gate: the base's + 1° = 8.54°) |

* **The root is in the timed turn, not in the silent entry.** `zoneStep` advances the turn's share on the angle the camera's stage read a frame BEFORE
  (`zm.rad`); `zoneMixPose` then applies that share to the angle of THIS frame. Its own note of 2026-11-14 states the rule — *"over the turn's whole
  angle as it is NOW"* — and the read is one frame late: 6.0° over 14.4° is a share of 0.415, applied to 20.8°.
* **Today's game has it too**: 6.03°, 6.19°, 6.38°, 6.21° shown in a frame where 6.0° is asked — its long turn grows slowly (57.7° → 64.5°).
* **Why the angle grows while the gizmo is "held"**: the gizmo still moves in the turn's first two frames (12.7 mm, 12.4 mm; the hold bites from the
  third), then the look point settles behind the finger — v7's turn goes 14.4° → 20.8° → 25.6° → 28.9° → 31.4° → 33.1°. A held turn's target is not still.
* **The silent entry only exposes it**: it keeps the picture near the face's layout, so the exit turn is short and the same growth is 44 % of it in one
  frame (0.5 % in today's game). The gate it missed is the lead's own (§15's gate 5).
* **An estimate, not built**: the share taken on the frame's own angle — the turn shows 6.0°, the frame about 6.7°.

**The options** (for his word): **(1)** v7 kept as it is, the 8.8° frame accepted — FO3 (§12) makes this exit turn, under 90°, a free change: no timed
turn, no share; **(2)** the share read on the frame's own angle in every timed turn — every crossing's pace changes (by up to 6 % on a long turn),
the replays no longer the base's bit for bit: a package of its own; **(3)** today's entry kept. ⭐ The lead's recommendation, relayed to him: (1) —
with the gates never run on v7 (the switch at 0 frame for frame, the replays, close in, the mutants) run and independently checked before it is
committed.

✅ **THE OWNER'S DECISION** (2026-11-18, verbatim): *"Keep version 7. Continue."* — option (1). v7 goes in as the builders left it (the switch
`freeEntryUpright`, default 1; 0 = today's entry), the 8.8° frame accepted until FO3 removes that timed turn. ⭐ Put in by the lead from the
saved patch, then EVERY gate of [`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §15 run on the commit by an Opus agent and checked by an independent
one (the figures: that file's section as built). A gate failing there, other than the 0.3°, is reported to him — ⛔ never undone without his word.

## 12. FO3 — the picture a follower of the logic: the study in four parts (the lead, 2026-11-18; ✅ AGREED by the owner — §12.6)

**The owner** (2026-11-18, verbatim, on §11's proposal — *1. a recording of his own fast orbit, 2. the study in his four parts with the test rewritten,
3. the build after the charts' audit and the merge*): *"You don't need new recordings. Use the existing recordings to see the px per frame average and
design from that. Then do 2 and 3."* — and, the lead having found one session only: *"They are in the E: drive"*.

### 12.1 His pace, measured (his own play; the reader: the scratchpad's `fo_why/pace.mjs`)

**The source**: `E:\Web\_Github websites\3d_assembly_game\Recordings\branch 1-0-142\` — the play recorder's sessions of 2026-11-14 (`_vyah`, `_ogse`,
`_ilmj`; three more hold no press): his MOUSE on the desk, `Scene_0bis`, far out (the approach at 1 throughout), 143 frames a second, 27 presses,
**170 s with the button down, 102 s moving**, the gizmo's travel 238 m (1 077 face lengths). The game was that day's (`7c38150`, before the charts).

| the pointer's speed (a 100 ms window) | px a second | = px a frame at 60 (the probes, the phone) | = px a frame on his desk (143) |
|---|---|---|---|
| **the average** | **571** | **9.5** | 6.9 (measured per frame) |
| the median | 468 | 7.8 | 4.9 |
| three quarters of the time under | 835 | 13.9 | 8.8 |
| nine tenths under | 1 213 | 20.2 | 14.4 |
| 95 % / 99 % under | 1 469 / 1 996 | 24.5 / 33.3 | 19.3 / 32.8 |

* **Half of his moving time is fast**: 183 stretches at 600 px a second or more (150 ms or longer), 43.7 s of the 102, at 850 – 1 120 px a second on
  average — 14 – 19 px a frame at 60. A fast stretch lasts 0.2 – 0.45 s: a flick of the wrist, then a reversal or a pause.
* **The gizmo**: 2.6 m a second on average, 5.9 at the top tenth, 12.3 at most — a rectangle face (221 mm) every 0.1 s at the median, every 0.04 s at
  the top tenth: one face in two or three frames at 60.
* **What he saw that day**: the pointer MOVING and the gizmo STOPPED by a turn during **31 – 39 % of the moving time** (40 – 44 % of the fast
  stretches' frames); the picture's roll as large as the orbit itself (42 465° against 48 559° over the three sessions). The stop-and-go and the
  rolling are his complaint, measured on his own hand.
* **What it says of §4's gates**: 20 px a frame (1 200 px a second) is his top tenth, 30 px (1 800) his top fiftieth. ⛔ No gate stood at his average.
* ⭐ **A pace is written in px a SECOND from here on** (the frame rate is not one: 143 on his desk, 60 in the probes and on the phone).

### 12.2 Part 1 — the rules (what the picture must do)

| # | the rule | whose |
|---|---|---|
| R1 | **The logic is not touched.** The pose the logic asks for each frame — every change of frame applied at once — is the GHOST. Every rule of the orbit stays (T1 – T12, the charts), but for R6. | his: *"a camera-piece ghost target"* |
| R2 | **The picture is drawn ONE way on every frame**: the ghost, turned back by what is left of the gap. Never a fade from a pose fixed in the world. | §11.2, errors 1 and 3 |
| R3 | **The place is exact.** The piece and the camera's look point keep, at every frame, the places on the glass the ghost gives them. Only the roll about the line through the two may lag. | his, 2026-11-14: the piece never leaps, nothing flies off the glass; §11.2, error 2 |
| R4 | **The gap closes by one law, smooth at its start and its end; the newest target wins** — an intermediate frame that the next one cancels is never shown. | his: *"ignoring the intermediate quaternion"* |
| R5 | **At rest the picture IS the ghost, bit for bit.** Nothing drifts. | his question on the drift ([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §14) |
| R6 | **No change under 90° stops the gizmo** (T5 bent, as he accepted for FO1). **A change of 90° or more is today's turn, bit for bit**: timed, the gizmo held. | his go of 2026-11-17 |
| R7 | **The finger steers by the picture drawn**: a straight finger gives a straight gizmo on the glass while a gap closes. | §11.3 |
| R8 | **The piece is drawn where the logic puts it** (the model's truth: contact, collisions). Only the camera follows. | the lead's (the solver must never read a picture) |
| R9 | **Time, not frames**: every pace in ms and px a second; the same picture at 60 and at 143 frames a second. | §12.1 |
| R10 | **One switch gives today's game back, bit for bit; the sliders ship with the rule.** | the project's (a guessed number has been wrong every time) |

### 12.3 Part 2 — the obstacles and the fallbacks (read in the code at `bc867a0`; re-read at the audited tip before S0)

| # | the obstacle | where | the answer | the fallback |
|---|---|---|---|---|
| O1 | Today's turn is a fade from a pose FIXED IN THE WORLD (`asmZoneMix.from`) at a share `k`; its target moves when the gizmo is free | `zoneMixPose`, `zoneStep` (`assembly_wiring.ts`) | under 90° no such turn is made; the gap is a scalar on the ghost (§12.4) | — |
| O2 | The change's angle is known only at the camera's stage, a frame after the site that makes the turn (`seamTurnStart`, the zone's switch, the spit's crossing) | the three sites; `tiltClampStep` | the builder decides WHERE under 90° is known; the rule: **no orbit step is refused for a change under 90°, not for one event** | decided at the camera's stage, the hold's test blind to a turn whose angle is not read yet |
| O3 | A change of frame is not only a roll: the piece's shown direction steps by a few degrees (`asmDirEase`), eased today on the turn's clock (`e.mix === zm`) | `seam_turn.ts` `dirGap`, `easedDir`; `shownDir` | with no turn, the direction's rest decays on a clock of its own, by the same law | by time at the tilts' one speed over its own angle (`seamTurnStep`'s TIME) |
| O4 | The roll's axis: about the view axis through the glass's centre the piece goes round the centre (⛔ tried 2026-11-13) | `assemblyCameraFrame`'s note | about the LINE THROUGH THE PIECE AND THE LOOK POINT: a camera turned about it keeps both where they are on the glass | the two closer than a few mm (close in): the view's own direction through the piece |
| O5 | The turns that stay as they are: 90° or more; the automatic tilt's entry (`byMm`); the way out of close in (`out`); the square camera's (`asmSquare`); a tilt's exit | `turnHoldsGizmo`, `seamTurnFrame`, `seamOutFrame` | untouched. One starting takes its start from the pose SHOWN (it holds the gap): the gap is then 0, the follower idle until it ends | — |
| O6 | Changes under 90° piling up the same way faster than the gap closes | offline: never on the routes walked at 20 px a frame, at any pace to 1 200 px a second (largest gap 59 – 67° = one change); on the routes walked at 30 px a frame (the probe lost its way there) 110 – 138° in 0.4 – 2 % of the frames, at 1 200 – 2 000 px a second | reported, not bounded: a hard stop at 90° shows up to 43° in one frame (offline) — worse than the lag | if the gap passes 90° at his paces in the game: the law's time shortened over 60° of gap — to be measured before it is built |
| O7 | Who reads "a turn is under way": the pole's crossing (`turning`), the hold, the recorder, `easeCarry` | `pole_crossing.ts`, `assembly_wiring.ts` l. 1115, `play_recorder.ts` | each reader listed by the builder with what it now sees, before any change (step S0) | — |
| O8 | Outside a spit the finger is read as it is: with a gap, the gizmo would run aside of the finger on the glass | `zoneFinger`, `orbitDragStep` | R7: the finger's step turned by the gap wherever it is not already read off the picture drawn (`asmCamLast` = the picture) | measured first in S0: where a gap can exist outside a spit at all |
| O9 | A probe steered by the glass takes another route when the picture differs; no two builds walk the same metres | the night's G6 | like for like only: per metre of gizmo travel, and HIS HAND replayed (the same pointer events on both) | — |
| O10 | The dy hold (`DY_HOLD_REVERSAL.md`), the look point's trail, the sway, the calm | — | part of the ghost or of a turn of 90° or more: untouched | — |
| O11 | A reset (boot, a piece picked or put down, `resetOrbitState`) | — | the gap 0, no last ghost: the first frame is the ghost | — |

### 12.4 Part 3 — the design (from the prior art, sized on his pace)

**The model.** Each frame the camera's stage builds, as today, the pose the logic asks for: the eye, the look point, the up — **the ghost**. The piece is
at `pp`, the look point at `L`. The **framed line** `a` goes through the two.

1. **The ghost's twist.** The rotation from last frame's ghost to this frame's is split in two (swing and twist): the SWING takes last frame's line onto
   this frame's — the orbit itself — and is shown in full, at once. The TWIST `τ` is what is left: a turn about the line — a change of frame, a frame
   swinging near a pole or a tip, whatever made it. The follower need not know.
2. **The gap.** One number, `θ`: `θ ← θ − τ`, taken the short way round. It is how far the picture is rolled back from the ghost. ⭐ The gap takes the
   ghost's twist **only while the gizmo is free**: while a turn that stays holds it (5., O5), the picture turns as today's and a gap already open goes on
   closing.
3. **The follower.** `θ` closes to 0 by the critically damped ease (a smooth start, a smooth end, no overshoot; its state the gap and its speed), its
   time `rollFollowMs`. A new twist adds to the gap while it closes: the newest target wins, and two changes that cancel are never drawn.
4. **The picture** = the ghost turned about the framed line (through the piece) by `θ`. The piece and the look point are on the line: both keep their
   places on the glass, exactly, whatever `θ`. The eye rides a small circle about the line. `θ = 0`: the ghost itself, bit for bit (under 0.01° and
   slower than 0.01° a second it is set to 0).
5. **The limit.** A change whose twist is 90° or more (`freeTurnMaxDeg`) is today's timed turn, the gizmo held (R6, O5). `freeTurnMaxDeg = 0`: every
   change is today's turn — today's game, bit for bit (R10).
6. **The finger** is read on the picture drawn (R7, O8); the piece is the logic's (R8).

**Sized on his pace** — an ESTIMATE, offline (the scratchpad's `fo_why/pace_sim.mjs`: build 2's recorded targets, the gizmo free, re-timed to a pointer
speed; NOT a run of the game — there the route changes with the picture). The ghost rolls 132° per metre of gizmo travel on the corner loops; today's
game shows 93° a metre at 1 200 px a second with the gizmo stopped in 39 % of the frames (measured, §11.1).

| the pointer | the roll shown per metre, `rollFollowMs` 200 | the worst frame of roll at 60 a second | the largest gap | the same with today's speed redirected (360° a second) |
|---|---|---|---|---|
| 240 px a second (slow) | 52° (40 % of the ghost's) | 4.3° | 66° | 105° a metre, 6.0° a frame |
| 470 (his median) | 26° (20 %) | 3.7° | 63° | 74°, 6.0° |
| **571 (his average)** | **21° (16 %)** | **3.7°** | **61°** | 64°, 6.0° |
| 835 (three quarters under) | 14° (10 %) | 3.5° | 62° | 49°, 6.0° |
| 1 050 (his fast stretches) | 11° (8 %) | 3.1° | 59° | 43°, 6.0° |
| 1 200 (nine tenths under) | 10° (7 %) | 3.0° | 59° | 40°, 6.0° |
| 1 800 – 2 000 (the top fiftieth; the routes walked at 30 px a frame, the half turns left to today's turn) | 19 – 20° (23 – 24 %) | 7.6° | 112 – 116° (over 90° in 1 % of the frames) | 33 – 35°, 6.0° |

* **The defaults**: `rollFollowMs` **200** (slider 60 – 600; at 300: 13° a metre at his average, 2.3° a frame; at 250: 17°), `freeTurnMaxDeg` **90**
  (slider 0 – 90; 0 = today's game). On his desk (143 frames a second) the same shares, 1.3 – 1.6° a frame.
* **What he will feel**: no stop at an edge under 90°; a change of 51° (a face of the heptagon to the next) rolls in softly — within 5° after 0.39 s,
  within 1° after 0.58 s, at 188° a second at most (today: 0.14 s at 360° a second, the gizmo stopped). He asked for it of the level face's entry: *"why
  can't we make the turn slower instead of a tenth of a second ?"*. ⛔ The price: after a fast stretch the picture goes on rolling for about half a
  second — the slider is his.
* **Prior art, all over twenty years old**: the twist about an axis split from the swing (Shoemake, *Fiber bundle twist reduction*, Graphics Gems IV,
  1994); a follower whose speed grows with what is left (Mackinlay, Card, Robertson, 1990), in its critically damped form (Game Programming Gems 4,
  2004); filters on orientation signals (Lee and Shin, 2002); the up carried along a path (Bishop, 1975); the camera as a field over the surface the
  pointer travels (Hanson and Wernert, 1997) — the second candidate, not taken: it smooths by PLACE, and his fast orbit needs a smoothing in TIME; the
  trade named in the literature — frame coherence against constraint satisfaction (Halper, Helbing, Strothotte, 2001). That a camera keeping two points
  at fixed places on the glass is free only to turn about the line through them is plain geometry.

### 12.5 Part 4 — the audit: what "the test passes" means now

**The inputs.** (H) **his hand**: stretches of his three sessions replayed (`walk_probe.mjs`'s `replay`: the same pointer events at their times, his
1536 × 742 glass) on today's game and on the build — far out as recorded, and once more at 0.736 and close in; (S) the steered walks at **his** paces:
240, 470, 571, 835, 1 050, 1 200 px a second, and 1 800 – 2 000 as a "nothing breaks" check only; (R) the older gates, the three seeded replays, the
dy hold's walks, the level entry's walks. Each at 60 frames a second; (H) once at 143.

| gate | what passes |
|---|---|
| A0 | `freeTurnMaxDeg = 0`: today's game, bit for bit — the three replays, a sample of every family of walks |
| A1 | `npm run verify`; the new vectors land with the code, each shown to fail on a mutant |
| A2 | **the place exact**: on every frame outside a timed turn, the piece's and the look point's places on the glass are the ghost's (within 1e-6 of the half glass) |
| A3 | **at rest the ghost**: the gap is exactly 0 within 1.5 s after the ghost stops turning, and the pose is then the ghost's bit for bit; on the slow walks (the same route) the last pose is the base's |
| A4 | **no stop under 90°**: no frame and no refused orbit step with the gizmo held by a change under 90°; the turns of 90° or more as many and as long as the base's |
| A5 | **the roll, like for like**, on (H) and on (S) at 470 – 1 200 px a second: the roll shown per metre of gizmo travel under HALF the base's on every run where the base shows 30° a metre or more, never over the base's + 2° a metre elsewhere; the worst frame of roll not over the base's |
| A6 | **the finger straight**: while a gap closes, the angle on the glass between the finger's way and the gizmo's not over the base's own largest on the same walk outside its turns, + 5° |
| A7 | **the gap**: never over 90° on (H) and on (S) to 1 200 px a second; its largest value and its share over 45° reported at every pace |
| A8 | **nothing breaks** at 1 800 – 2 000 px a second and at 143 frames a second: no error, no step of the gizmo out of its pace, A2 and A3 still true |
| A9 | **no regression where nothing is free**: every walk on which the ghost never twists with the gizmo free (S0 lists them: close in, the tilted pole, the square camera, the way out, the dy hold's) identical to the base frame for frame; a difference elsewhere traced to a named free change |
| A10 | the documents, the tree clean, no process left |

**The chain**: an Opus builder, then an independent Opus auditor who re-measures with readers of its own and mutates the vectors; two fix rounds at
most; a third failure: the code commits reverted, the documents and probes kept, a report. ⛔ No deploy without the owner's word.

### 12.6 The build's order

* **S0 — the shadow, before any change of what is drawn** (probes and documents only, then one code commit that draws nothing new): the readers of a
  turn under way listed (O7); the ghost, its twist, the gap and the picture COMPUTED each frame and recorded, not drawn; his hand replayed; A2, A3 and
  A7 read on the shadow; where a gap exists outside a spit (O8). The figures in this file before S1.
* **S1 — the picture drawn** from the gap (R2 – R5), the changes under 90° free (R6), the direction's rest on its own clock (O3), the two sliders.
* **S2 — the finger** on the picture wherever S0 found it is not (R7).
* **Not in this build**: (2026-11-18) the silent entry v7 IS in the base (`3c66eb9`, `freeEntryUpright` 1; 0 = the entry before): S0 lists `freeShownHeading` among the readers of a turn under way (O7) and says what it sees once a change under 90° makes no timed turn; A0 and A9 run with `freeEntryUpright` 1 and 0; any change
  to a turn of 90° or more; the surface.
* **Where**: branch `1.0.148-` from the audited tip of `1.0.147-`, the worktree `orbit_charts`; ⛔ nothing merged, nothing deployed without his word.

**For his review** (the lead's choices, each a slider or a line to change): the follower's time 200 ms; no hard stop of the gap at 90° (O6); the price
named above; FO3 built after the charts' audit — on its own branch, so the merge of `1.0.147-` waits for nothing.

✅ **The owner** (2026-11-18, on the design, the estimate, the price and these choices as relayed): *"Agreed"*. The build is S0 – S2 as written here;
⛔ still nothing deployed without his word.

## 13. FO3 S0 — the shadow, measured: section 12 CONFIRMED on the corner loops, REFUTED on his own hand (A7, O6) — S1 waits for a decision (the builder, 2026-11-18)

**The result first.** The follower was computed on every frame of the game and recorded, never drawn (the replays: the camera and the gizmo identical
to the base, bit for bit). Where the lead sized it — the steered corner loops — it does what §12.4 says: the roll shown per metre of gizmo travel is
**half or less of today's** at 240 – 1 200 px a second, the gap at most **17 – 59°**. **On his own hand it does not hold**: replayed on `Scene_0bis`,
far out at his paces, the gap passes **90° in 9 of his 10 stretches** (up to 178°, 3 – 23 frames a stretch at 60 frames a second). The cause is in the
logic, not the follower: **inside a tip's spit, as the camera nears the tip's axis, the ghost turns about the framed line WITH THE GIZMO FREE by up to
42° a frame** (249 – 746° in one 15 s stretch), always the same way, and a crossing's turns under 90° add to it. On `Scene_1` the same happens over
the cube's top (the upright camera's half turn: 161° of gap at 1 200 px a second), and there no spit reads the finger off the picture.
⛔ So A7 (*"the gap never over 90° on (H)"*) and O6's premise (*"never on the routes walked at ≤ 1 200 px a second"*) are false on his hand.
**S1 is not started**: the decision is the owner's (§13.6).

### 13.1 What was built (S0, nothing drawn changes)

* `src/input/roll_follow.ts` (engine-free): the framed line (`framedLine`; the piece and the look point closer than **3 mm**: the view's direction
  through the piece — O4); the ghost's twist about it (`twistAbout`); the gap and its critically damped step (`gapStep`, `followStep`: ω = 2 / 200 ms,
  the closed form — exact at any frame rate; under 0.01° and slower than 0.01° a second: exactly 0); the picture (`poseRolled`); a place on the glass
  (`onGlass`). **16 vectors** (`tests/roll_follow.test.ts`), **15 mutants all red** (the twist's sign, ω, a plain exponential, no rest snap, the twist
  read about the view, the axis through the eye, not the short way, no degenerate line, the line's orientation, gap 0 not the pose itself, the take
  before the step, ZERO ignored, no rest after the take, the speed dropped).
* `src/render/roll_shadow.ts`: each frame at the camera's stage (`green_box_wiring.ts`, just before `zoneMixPose`) the ghost, its twist, two gaps —
  **held** (§12.4.2 as written: the twist taken only with the gizmo free today) and **free** (as S1 would on this route: also during a timed turn that
  S1 makes free — a zone's turn whose twist at its first frame is under 90°, not `byMm`, not `out`; a turn that stays: the gap 0) — the picture, A2's
  error; stored on `st.asmRollShadow` (reset with the orbit's state, O11). The recorders read it (`SHADOW_REC`).
* **Checked**: the three seeded replays with the shadow against the base (`6f47219`): `Scene_1` and `Scene_0bis` identical bit for bit (2 794
  frames); `Scene_0` within the replays' known last-digit noise (largest 1.8e-10 m, `1e-9: never`). His hand (two runs) and a steered walk: the camera
  and the gizmo identical in every frame.

### 13.2 His hand replayed (H) — `Scene_0bis`, his 1 536 × 742 glass, the virtual clock

Ten stretches of his three sessions (`hand_replay.mjs`; whole presses, 10 – 15 s each; his pace in each: 384 – 865 px a second on average, fast
stretches over 600 px a second 21 – 60 % of the time). The roll is about the view (`pace.mjs`'s split), per metre of gizmo travel; the free twist =
frames where the ghost turns over 0.5° about the line with the gizmo free today (frames / largest / sum).

| stretch (mean px a second) | gizmo m | roll a metre, today | worst frame today | free twist | the gap's largest | frames over 45° / 90° | held gap's largest |
|---|---|---|---|---|---|---|---|
| vyah_11s (631) | 15.4 | 177° | 26.9° | 43 / 25.8° / 146° | 85° | 12 / 0 | 36° |
| vyah_42s (627) | 17.5 | 116° | 23.3° | 106 / 22.9° / 422° | 119° | 33 / 6 | 57° |
| ogse_3s (384) | 13.3 | 186° | 20.5° | 116 / 20.9° / 340° | 98° | 35 / 4 | 57° |
| ilmj_4s (538) | 16.4 | 149° | 29.7° | 118 / 19.5° / 404° | 122° | 53 / 13 | 63° |
| ilmj_23s (865) | 18.2 | 138° | 42.2° | 126 / 42.5° / 746° | 178° | 84 / 23 | 108° |
| ilmj_39s (695) | 17.8 | 182° | 26.1° | 83 / 25.7° / 288° | 178° | 78 / 14 | 68° |
| ilmj_60s (609) | 18.3 | 171° | 55.5° | 180 / 25.0° / 585° | 120° | 107 / 21 | 76° |
| ilmj_83s (690) | 16.1 | 129° | 35.1° | 104 / 33.8° / 344° | 132° | 34 / 9 | 63° |
| ilmj_99s (833) | 15.6 | 153° | 43.0° | 117 / 42.4° / 479° | 133° | 78 / 23 | 122° |
| ilmj_114s (553) | 9.4 | 138° | 15.8° | 98 / 12.9° / 249° | 97° | 38 / 3 | 34° |
| ilmj_23s at **143** frames a second | 19.6 | 154° | 38.4° | 266 / 28.6° / 775° | 137° | 256 / 54 | 103° |
| ogse_3s at 143 | 15.3 | 183° | 71.8° | 220 / 18.2° / 489° | 180° | 105 / 35 | 100° |
| at **0.736**: ilmj_23s / ilmj_99s / vyah_11s | 17.0 / 15.8 / 15.0 | 157° / 145° / 200° | 34.9° / 45.6° / 48.5° | 126 / 140 / 40 frames | 152° / 145° / 174° | 58·15 / 110·32 / 29·16 | 53° / 115° / 29° |
| **close in**: the same three | 8.1 / 8.2 / 6.9 | 157° / 115° / 54° | 11.7° / 26.0° / 10.1° | 12 / 19 / 4 frames, ≤ 6.7° | **7° / 4° / 3°** | 0 / 0 | 7° / 4° / 3° |

* **Where**: every gap over 1° on his hand is **inside a spit** (0 frames outside, on every run): the frames before the crossing's half turn, the
  camera near the tip's axis (e.g. `ilmj_99s` frames 90 – 95: 4°, 8°, 14°, 24°, 26°, **42°**, the gizmo free, the finger 7 – 30 px a frame; the
  crossing's turn then starts). Close in it stays under 7.3°.
* **A2 on the shadow**: the piece's and the look point's places, picture against ghost: at most **1.5e-15** of the half glass on every run. ✅
* **A3**: with the rest after the take (`7473761`), the gap is **exactly 0** at the end of the 1.5 s settle on the runs re-made (`ilmj_23s`,
  `vyah_42s`); before it the ghost's own rounding (1e-16 – 1e-7 rad a frame) kept it at 1e-12 – 1e-7 rad — the defect found here (R5).
* **A6, today's own** (the finger's way against the gizmo's on the glass, outside turns, the finger ≥ 3 px): largest **38 – 178°**, 95th
  percentile **28 – 114°** — today's game is far from straight on his hand already (a spit reads the finger in its own frame).

### 13.3 The steered walks at his paces (S) — the corner loops of `Scene_0bis`, far out, 60 frames a second

| px a second | ccw at +x: roll a metre today → S1 on the route | its gap's largest | cw at −x: today → S1 | its gap's largest |
|---|---|---|---|---|
| 240 | 140° → 49° | 34° | 61° → 32° | 17° |
| 470 | 88° → 34° | 30° | 57° → 21° | 18° |
| 571 | 76° → 35° | 36° | 53° → 18° | 45° |
| 835 | 84° → 42° | 39° | 90° → 44° | 60° |
| 1 050 | 98° → 51° | 41° | 53° → 26° | 56° |
| 1 200 | 72° → 35° | 46° | 80° → 34° | 56° |
| 1 800 (nothing breaks) | 90° → 84° | **135°** (9 frames over 90°) | 88° → 71° | 89° |
| 2 000 (nothing breaks) | 109° → 93° | **139°** (9 frames over 90°) | 55° → 38° | 86° |

* **This is §12.4's estimate, confirmed** (59 – 67° there): to 1 200 px a second the gap stays under 60° and the roll a metre is halved or better.
* ⚠ "S1 on the route" is the shadow's picture where the gizmo is free or the turn would be, today's drawn picture where a turn stays — today's ROUTE
  (the gizmo still held by today's turns); the frames where the two hand over are not a real picture (their "worst frame" is not reported).
* The walks end 6 frames after the last move: their last gap (0.1 – 2.7°) is not a rest; A3 is read on his hand (13.2).

### 13.4 The other recordings (the older gates — A9's list)

* **The seeded replays** (random drags of up to 8 px a frame: ≤ 680 px a second): `Scene_1` the gap up to **121°** (65 frames over 90°), **1 478
  frames with a gap over 1° outside a spit**; `Scene_0` 121° (69), 1 460 frames outside a spit; `Scene_0bis` 112° (8), none outside. The free twist:
  3 743°, 3 812°, 1 385° in 21 – 23 m of gizmo travel — far out, the upright camera near the top of its orbit (e.g. `Scene_1` frames 246 – 260: 6 –
  12° a frame for 15 frames, the camera 7.7 m up).
* `f_s1_over_px20` (`Scene_1`, up over the cube's top and down its back, 1 200 px a second): free twist 372° in 41 frames, the gap **161°**, 26 frames
  over 90°, **76 frames outside a spit**.
* **Never a free twist** (over 0.5°): `f_edge_px2 / px8 / px20` (gap ≤ 0.4°, from their six turns under 90°), `f_s0_up_px20` (no turn, gap 0.1°),
  `f_ridge_px20` (its one turn 180°: stays; gap 0), `tilt_check` on `Scene_1` (gap 0.2°). A few: `tilt_check` `Scene_0` (23 frames, ≤ 3.8°, gap 9.2°,
  107 frames outside a spit), `Scene_0bis` (8 frames, ≤ 2.0°, gap 2.6°).
* **For A9** (identical frame for frame): only the walks with no free twist AND no turn under 90° can be — `f_s0_up_px20`, `f_ridge_px20`. The edge
  walks and `tilt_check` have turns under 90° that S1 makes free: they will differ, by those named turns.

### 13.5 The obstacles read on the shadow

* **O2 — where the change's angle is known**: at the camera's stage, the turn's first frame. ⚠ **The twist there understates a 90° change**: the square
  camera's turns read **88.3 – 89.8°** of twist (89.9 – 90.2° of `zm.rad`) at their first frame; `zm.rad` itself grows after it (a turn read 21.7° of
  twist, 32° then 59° of angle — §11.4's moving target). A limit read on the twist frees a 90° turn by rounding; the square camera's turn must stay by
  its kind (O5), and the zone's turns be judged on their whole angle, with a stated tolerance.
* **O7 — the readers of "a turn is under way"** (`asmZoneMix`), and what each sees once a change under 90° makes no turn: the piece's shown direction
  (`shownDir`, `easedDir` at the turn's share — no turn: the ease whole at once, hence O3's own clock); the ease's start and carry (`easeCarry`, the
  `asmDirEase.mix` link — no turn to hang on); `turnWhole`, `seamTurnFrame`, `seamOutFrame`, `seamOutFeed` (only `byMm` and `out`, which stay); the
  pole's crossing (`poleCrossingDue`'s `turning`: no crossing while a turn runs — with none, one can be made the next frame); `zoneMixPose`;
  `tiltClampStep` (the hold — none); `crossTurn`'s and the free entry's `mixWas` (a turn restarted — none to carry); `zoneStep` (the clock);
  **`freeShownHeading`** (`asmFree.turning`: the silent entry's heading carried while a turn runs — with none it settles at the tilts' one speed a
  frame by itself); the play recorder (`zm`) and the probes (`turn_rec`, `fast_walk_check`, `hand_replay`).
* **O8 — where a gap exists outside a spit**: on `Scene_0bis`, nowhere (his hand, the walks). On `Scene_1` and `Scene_0` far out, near the top of the
  orbit: up to 161°. There the finger is read as it is: **S2 is needed there** (R7), not on `Scene_0bis`.
* **O4**: the framed line is close to the view on the frames that twist (the angle between them: median 4°, at most 9 – 23°), so the twist IS mostly
  roll; the view itself then lags the ghost by up to 7.8 – 13.5° (the eye on its circle about the line) while the piece and the look point stay exact.

### 13.6 What the frames refute, and the amendments

* **Refuted — A7 and O6's premise**: the gap passes 90° at his paces on his own hand (13.2), from the logic's own near-half-turn roll with the gizmo
  free (a spit's axis, the cube's top). **O6's fallback, sized offline on the recorded twists** (the follower re-run, `fo3/follow_sim.mjs`; it
  reproduces the recorded gap to 6e-12°): 200 ms → 98 – 178°; 120 ms → 90 – 153°, 0 – 32 frames still over 90°; the time shortened over 60° (× 60/gap)
  → 95 – 155°, 3 – 31 frames; (× (60/gap)²) → 90 – 145°, 0 – 17 frames, worst frame **13 – 41°**; a hard stop at 90° → worst frame **9.5 – 70°**. None
  keeps A7 on every run without a frame of 38 – 70° on some run (five runs read: `ilmj_23s`, `ilmj_99s`, `ogse_3s` far, `ilmj_23s` at 143, `ilmj_99s` at 0.736).
* **Amended in the code, measured** (§12.4's wording): (a) the twist is **Shoemake's twist of the whole rotation about THIS frame's line** — not *"the
  swing taking last frame's line onto this one's"* first: the two agree when the line is fixed in the camera, and differ when the look point slides
  (0.26° in a 5.7° turn), where the latter left the picture a turn about the line (vectored); (b) **the rest after a take too** (R5, 13.2).
* **The smallest amendments that keep R1 – R10, for his decision** (the builder's reading; none built):
  1. **Accept a gap over 90°** — drop A7's bound, keep the rest. Inside a spit the finger is read off the picture drawn (`zoneFinger`, R7 holds if
     `asmCamLast` is the picture); outside one (`Scene_0`, `Scene_1` over a top) S2 turns the finger by the gap. R3, R5, R6, R8 untouched. The price:
     for about half a second the picture is up to a half turn behind the logic's after a fast pass by a tip or over a top — the glass upside down
     relative to the logic, then rolling back.
  2. **A gap that would pass 90° hands its excess to today's timed turn** (from the pose shown, the gizmo held). ⛔ It bends R6: changes each under
     90° would then stop the gizmo — **his word needed**.
  3. O6 as written — measured above: it does not meet A7.
* ⛔ Not decided here, not built: S1 waits for the lead and the owner.

### 13.7 The owner's decision (2026-11-18) — a gap over 90° accepted; the mitigations studied aside

**The owner** (verbatim, on 13.6's options as relayed): *"Let's do 1. There might also be ways to mitigate it further, for example: - select the speed
of the follower with a slider - increase the speed of the follower with the distance - clamp by how much the delta input moves the orbit - damp by
how much the delta input moves the orbit in function with the distance - recommend other (check state-of-the-art literature)"* — and: *"Do 1, and in
parallel launch Opus agent(s) to evaluate the feasibility of those mitigations, if they can introduce regressions or conflicts with other rules and
which one(s) to recommend for later implementation if the deploy result is not satisfactory to me."*

* **S1 is built on amendment 1**: no bound on the gap, no hard stop, O6's fallback not built. ⭐ **A7 amended**: the gap's largest value and its
  shares over 45° and over 90° are REPORTED at every pace and on his hand — never a failure. R1 – R10 unchanged. S2 is built where a gap exists
  outside a spit (`Scene_0`, `Scene_1` over a top — 13.5).
* **O2 as S0 read it**: the turns that stay are kept by their KIND (the square camera's, `byMm`, `out`, a tilt's); a zone's turn is judged on its
  whole angle with a stated tolerance — never on the first frame's twist alone.
* **To read offline before anything is drawn** (the lead's question, ⛔ not measured): the roll before a tip's crossing and the crossing's half turn
  — at the frame the timed turn starts from the pose shown, how far is that pose from the turn's target? If the two largely cancel, the half turn
  drawn is short. The figure goes in section 14.
* **The mitigations**: a study aside (one Opus agent, offline, no game run, nothing built) — for each of his five lines: feasible or not, the
  regressions, the conflicts with the rules (his third and fourth lines change what the finger's step does to the orbit: the logic, R1), and which
  to build later **if his look at the deploy is not satisfactory**. Its result: the kit's `fo3/mitigations/MITIGATIONS.md`, then a section here.
