# A fast orbit over many edges — one follower instead of a train of turns (2026-11-17)

> **STATUS** · ✅ **THE OWNER'S GO, the night of 2026-11-17** — the build as briefed: §1 – §5 (branch `1.0.148-`, from `1dac167`); as built: after §5.
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
| G3 — the held turns | at the defaults, every turn at or over the limit: still one turn, the gizmo held, its one rotation within 2°, its path ratio not worse (+ 0.02), its dy hold as at the base |
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
