# The dy held after a half turn — "I cannot revert the dy" (2026-11-17)

> **STATUS** · ⛔ **REPORTED BY THE OWNER the night of 2026-11-17** — to troubleshoot and to fix BEFORE the audit: the build as briefed §1 – §4; the
> root cause §5 (measured); ⭐ BUILT §6 (2026-11-18, `1562bd1`, the walks passed) — ⛔ no device look, not deployed. **OWNS** · this report, its root cause, its fix · **READ WITH** ·
> [`ORBIT_ANY_SHAPE.md`](ORBIT_ANY_SHAPE.md) §8 (the hold: its rule; §8.1 the release is the finger's; §8.2 the hold is the gesture's),
> [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) §1 (T9), §10 (D-T4) and §13 (C5: the one event and its hold). The dossier:
> [`RND5.md`](../../00_CORE/queue_notes/RND5.md).

## 0. The owner's words (verbatim, 2026-11-17)

*"one last thing: in scene 0bis, when I cross a level face far edge (with 180 degree camera roll) or when I cross the zenith edge, most of the times I
cannot revert the dy input (the green section travel) until I reach the opposite zenith edge or level face. It is not always the case: this bug is
always present at far distance, not always at close in. It was not here before. Make long walks over the rectangle faces at different distance to
troubleshoot. Fix that before the full audit."* — and, completing it: *"my previous post completed: this is also the case if the travel ends up on a
triangle face: the dy is hold there as well"*.

## 1. What the code does today (read 2026-11-17 — ⚠ nothing here is measured yet)

* **The hold** (`asmEdgeHold`: a sign and `back`) is set by the one half-turn event (`crossTurn`): a tilt's exit, a ridge crossed close in, the
  spit's change of side over or under its axis (`crossingHold`), a free face's exit (`exitHoldSign`) — when the turn is over a quarter and the finger's
  dy pushed the gizmo out over that edge (D-T4).
* **Under it** the finger's OWN dy of the held sign is dropped (`edgeHoldDy`), before the spit's mapping (`zoneFinger`); the other dy and the dx pass.
* **It ends**: at `edgeHoldMm` = **30 mm of FINGER travel the other way** (`edgeHoldFinger`, since 2026-11-14 — before that, 30 mm of the gizmo's
  depth on the SURFACE, 2026-11-12); at the gesture's end (`gestureOver`); round a tip; with no gizmo.
* **A first reading, to be confirmed or refuted by the walks**: far out one millimetre of finger is many millimetres of surface
  ([`ORBIT_ANY_SHAPE.md`](ORBIT_ANY_SHAPE.md) §8.1: about 9), so 30 mm of finger the other way can be the whole way round to the opposite edge — his
  *"until I reach the opposite zenith edge or level face"*, *"always present at far distance, not always at close in"*. The value was chosen as a depth
  on the surface and kept when the release became the finger's. ⚠ It does not explain *"It was not here before"* by itself (C4 and C5 added the hold at
  a level face's far edge on 2026-11-16; he said of C5's build *"nothing feels blocked"*). Other causes to look for: the held sign read from a stale
  `asmDySign` (a crossing made by the coast, or by a dx that the spit maps round the axis); a hold set again while one is on; a hold that the finger's
  own dy never releases because the travel round the axis comes from its dx (the spit's swap, a free face's carried heading).

## 2. The decisions taken for him to review (Fable, that night — he asked for no question)

| # | decision | why |
|---|---|---|
| D1 | The order: after the fast orbit's chain and its deploy, BEFORE the silent entry, before the audit | a defect of the live game first; the silent entry is then tested with these walks ([`LEVEL_FACE_ENTRY.md`](LEVEL_FACE_ENTRY.md) §15) |
| D2 | The root cause first: reproduced, measured, compared with earlier commits (his *"It was not here before"*) — before any change under `src` | his rule: no patch |
| D3 | The fix stays inside his rules: T9 (the dy that crossed is held until the finger reverses; the hold ends with the gesture), *"until the dy in the opposite direction hits the hysteresis threshold"* (2026-11-14), no ping-pong over the edge. If the cause is the band's length: a band in finger millimetres sized to tell a reversal from a wobble, its default chosen from the walks, the slider kept | — |
| D4 | His three-failures rule, by analogy: a failed test fixed and retested, twice; a third failure = the fix ALONE undone, and the report | his rule for the fast orbit |
| D5 | Built and tested, NOT deployed: the deploy on his word | each deploy is his |

## 3. The troubleshooting — before any change under `src`

**The long walks** (headless, a probe in `scripts/probes`): on `Scene_0bis`, round the heptagon over its rectangle faces (the travel round the axis),
at approach 1.0, 0.736, 0.515 and close in (the latch on), each way round, over the zenith edge and over the bottom face's far edge, **the finger kept
DOWN**: cross; go on N mm of finger the other way (N = 3, 6, 12, 20, 30, 45); then ask to come back. The same with the finger lifted before coming
back. **Ending on a tip's triangle** (his completion): after the crossing, the travel taken sideways off the rectangle faces onto a triangle of each
tip, the dy asked there both ways — the code says a hold ends round a tip (`spitStep`: the side changes silently there), he sees it held. Also at two
finger paces (2 and 8 px a frame), and once crossing by the coast. On `Scene_0` (its ridge, its bottom's far edge) and `Scene_1` (a
top's far edge close in): one walk each.

**Read per walk**: the BLOCKED frames (the finger asks for a dy, the hold is on, nothing moves); the finger's travel and the gizmo's travel on the
surface between the crossing and the first dy back that is honoured; the hold per frame (its sign, its `back`, the site that set it); the finger's own
dx and dy and the pair after the spit's mapping; the millimetres of surface per millimetre of finger at each distance.

**Since when**: the same walks on the code of earlier commits (`git checkout <commit> -- src`, the tree clean first, `git checkout HEAD -- src`
after, one run at a time): `c7ac510` (the build he approved before C4 and C5), the commit before C5 (`ef14420^`), `a1a52f0` (the build of which he
said *"nothing feels blocked"*) — does the report reproduce there, and what differs.

## 4. What "fixed" means — the gates

| gate | what must hold |
|---|---|
| The report's case | at every distance, over both crossings, both ways, the finger kept down: once the finger has gone the band the other way, a dy back is honoured — no BLOCKED frame after that; the surface travelled before a dy back is honoured is stated per distance, and far out it is a fraction of one face, never the way round to the opposite edge; on a tip's triangle reached after a crossing, the dy is honoured both ways |
| No ping-pong | a finger still pushing the way it crossed never takes the gizmo back over the edge — the walk of 2026-11-14 ([`ORBIT_ANY_SHAPE.md`](ORBIT_ANY_SHAPE.md) §8.1: the crossing's overshoot, a small reverse, forward again) and the walks above with N under the band: no second crossing; `ridge_check`, `tilt_check` (`MODE=ridge`), `mid_check`, `across_check`: the crossings and their turns as at the base |
| Elsewhere | `Scene_0` and `Scene_1` not worse; the three replays: every difference traced to a hold that ends sooner, the health clean, the worst frame not over the base's + 1° |
| The rest | `npm run verify` green, each new vector red on a mutant; the docs as built and their two tests; the tree clean; nothing left running |

## 5. THE ROOT CAUSE — measured (2026-11-18, before any change under `src`)

**Result first.** The report reproduces at every distance, both crossings, both ways. Three causes, all in how the hold ENDS or is SET — none in
which turn fires or how it is drawn. They were all already there at `c7ac510`, `ef14420^` (`49f9754`) and `a1a52f0` (below): *"It was not here before"*
is not reproduced by the walks.

**How measured.** `scripts/probes/hold_walk_check.mjs` (real mouse events, the finger kept down, the probes' virtual clock; the runbook
`scripts/probes/ORBIT_GATES.md` §10) on `Scene_0bis`: cross the zenith ridge or the bottom face's far edge with a pure finger dy (2 px a frame),
push 8 frames more, go N mm of finger the other way (N = 3, 6, 12, 20, 30, 45), then ask to come back 60 mm. Code: `3013992` (its `src` = `892b6a3`'s,
the live game). One heptagon face is **221 mm** wide.

### 5.1 Cause 1 — the band is 30 mm of FINGER, and far out a finger mm is 13 – 21 mm of surface

| distance | surface per finger mm (no turn) | N under 30 mm: the come-back | N = 30: honoured after | N = 45 |
|---|---|---|---|---|
| far (1.0) | 20 – 21 | **BLOCKED for its whole 60 mm** (99 – 112 frames), every N from 3 to 20 | 400 mm of surface (zenith), 394 mm (bottom) | 700 mm |
| 0.736 | 21 | the same | 402 / 394 mm | 698 / 538 mm |
| close (0.651, the latch on) | 19 – 21 | the same | 285 mm | 508 mm |
| 0.515 | 5.5 | the same | 99 / 102 mm | 181 / 186 mm |

The hold ends only after 30 mm of finger the other way (§1's reading — CONFIRMED). The full gain runs down to `orbitGainFullM` (0.6 m), so at 1.0,
0.736 and 0.651 the 30 mm is **1.3 – 1.8 faces**: the gizmo ends 430 – 450 mm from the edge crossed — on the bottom face after the zenith, round
to the far side after the bottom face. His *"until I reach the opposite zenith edge or level face"*, *"always present at far distance, not always at close in"*
(only at 0.515 and nearer does it shrink to half a face). The value was chosen as a depth on the surface (2026-11-12) and kept when the release became
the finger's (2026-11-14).

**And it is a COUNTER, not a hysteresis.** `back` adds every move the other way and forward pushes take nothing off. A finger still pushing the
crossing way with a ±2.5 mm wobble (0.5 px a frame, period 24 frames): after 144 frames `back` = 21 mm — one more half-minute of wobble releases the
hold with the finger never reversed (`zW_far`, `zW_close`, `bW_far`: 21.0 – 21.6 mm). So the band could not simply be made shorter.

### 5.2 Cause 2 — a hold SET when no finger is down outlives the gesture

The hold ends at the gesture's end (§8.2). But the spit's crossing is read at the CAMERA's place, which lags the finger: a finger lifted just before
the camera passes over the axis sets the hold one frame AFTER the release (measured: the steering's release f23, the hold set f24). The coast does
the same (crossings 2 – 4 frames after the release, `zC_far`). That hold belongs to no gesture: the NEXT press, pushing the way back, is
**blocked from its first frame** — 19 of its 41 moving frames, the gizmo 0 mm (`zC_far` s0 and s1), and at full length in `z_far` s0 (the probe now ends
such a hold with a still press before each sub-walk and prints `STALE`). The cause: `asmDySign` (the finger's last dy sign) is never reset, so a crossing
with no finger down still finds a sign to hold.

### 5.3 Cause 3 — the triangle: a hold set AGAIN by a crossing the finger's dx made, with the last dy's sign

`zT_far` (both ways): after the zenith crossing (held), a pure finger dx along the axis takes the gizmo round a tip. There the spit's side change is
read as a crossing (`crossingPitch` over the threshold: the camera passes over the axis at the tip), and `crossingHold` takes `asmDySign` — the dy
of the ZENITH crossing, the finger's dy having been 0 for 90 frames. The hold is set again (f513, `[1, 0]`, a one-frame turn); on the tip's triangle the
held dy is **BLOCKED 56 of 57 frames** both times, the other way moves (402 – 418 mm). Close in the same walk ended the hold round the tip (the
silent path, `zT_close`), then a later dx-made crossing set one again (27 blocked frames). `bT_far`: the same (56 blocked). His *"the dy is hold there
as well"*. D-T4 (`TILTED_POLE_CLOSE_IN.md` §10) already says a crossing made sideways by a dx holds nothing; the spit's site still reads the stale sign.
And a crossing that holds nothing leaves an older hold on (`crossTurn`: *"a hold already on is left as it is"*): the edge it guarded is no longer the
last one crossed.

### 5.4 The candidates of §1

| candidate | verdict |
|---|---|
| the band's length in finger mm against the surface far out | **CONFIRMED** (5.1) — plus: the band counts, it does not hysterese |
| a held sign read from a stale `asmDySign` | **CONFIRMED** — the coast and the camera's lag after a lift (5.2), a dx round a tip (5.3) |
| a hold set again while one is on | **CONFIRMED** (5.3, f513) |
| a hold the finger's own dy cannot release because the travel comes from its dx | refuted as a cause of its own: the dx is never held; it is 5.3 (the sign set by a dx-made crossing) |
| a hold that does not end round a tip | **CONFIRMED** far out (5.3); close in the silent path ends it |
| the lifted finger | works as §8.2 says: honoured after 6 frames (the deadband), every distance (`zL_*`, `bL_*`) |

### 5.5 Since when

The same five walks (`z_far`, `b_far`, `zT_far`, `zC_far`, `z_d515`) on the code of `c7ac510` and `49f9754` (= `ef14420^`): **identical to the base
frame for frame** (gizmo within 1e-6 m, the hold equal, every frame). On `a1a52f0` (package A in): the walks differ from frame 35 – 419 (A's camera), the
hold the same — far out 30 mm of finger = 333 – 371 mm of surface, the same blocked come-backs, the same stale hold, the same triangle (56 blocked).
All three causes date from 2026-11-14 (the finger's band, `edgeHoldFinger`) and before (the spit's last-dy-sign hold, `asmDySign` never reset).
`Scene_0` (close in, its ridge and its bottom's far edge): the same (30 mm → 296 – 315 mm of surface, N ≤ 12 blocked). `Scene_1`: the probe's steering did
not reach the cube's top (no crossing measured) — its gate is `tilt_check` `MODE=ridge`.

## 6. AS BUILT (2026-11-18, `1562bd1` — `git revert 1562bd1` undoes it whole) — ⛔ no device look yet; not deployed (D5)

**What changed, one rule per cause** (pure, `src/input/orbit_tilt.ts`, no face, scene or geometry named):

1. **The release is a true hysteresis on the finger** (`edgeHoldFinger`): `back` is how far the finger is back the other way from the farthest point
   it reached the held way; the held way pays it off (never under 0). The band `edgeHoldMm`: **30 → 8 mm** of finger. Why 8: a finger wobbling
   ±2.5 mm swings 5 mm; measured with the forward push, `back` reaches 3.5 mm at most (was 21 mm, summed). 8 mm = the worst 5 mm swing + 3 mm.
   6 mm also stayed clean in the walks (1 mm margin) — the owner's slider (☰ → TILTED POLE, step now 1 mm, label unchanged).
2. **The sign held is the dy pushing NOW** (`dySignPushing`): a finger step with a dy its sign; a sideways step (a dx, no dy) none; a still step
   unchanged; the gesture's end none (`gestureOver`). So a crossing after the lift (the camera's lag, the coast) or made by a dx round a tip holds nothing.
3. **Each half-turn event's hold replaces the last** (`holdAtCrossing`, in `crossTurn`): an event that holds nothing ends the older hold.

Unchanged: when a turn fires, its pace and drawing, which dy is held at a dy-made crossing, the frames, the calm, the square camera; the hold
still ends with the gesture.

**The report's case — the long walks, base (`892b6a3`'s code) → now** (`Scene_0bis`, 2 px a frame; BLOCKED = frames of the come-back with the hold on
and the gizmo still; the surface since the crossing until the first dy back honoured):

| distance, crossing | N = 3 / 6 mm back (under the band) | N = 12 | N = 20 | N = 30 |
|---|---|---|---|---|
| far, zenith | blocked 99 / 104 → **100 / 104** (no second crossing) | blocked 112 (never) → **0**, 45 mm | 112 → **0**, 203 mm | 0, 436 mm → the same |
| far, bottom far edge | 98 / 103 → 98 / 103 | 112 → **0**, 35 mm | 112 → **0**, 208 mm | 0, 429 mm → the same |
| 0.736, zenith / bottom | 99 / 104, 98 / 103 → the same | 112 → **0**, 34 / 35 mm | 112 → **0**, 214 / 207 mm | 0 → 0 |
| close (0.651), zenith / bottom | 98 / 103, 98 / 102 → the same | 113 → **0**, 11 / 22 mm | 112 → **0**, 173 / 189 mm | 0 → 0 |
| 0.515, zenith / bottom | 97 / 102 → the same | 112 → **0**, 6 / 9 mm | 112 → **0**, 50 / 54 mm | 0 → 0 |

(The surface for N ≥ 12 is the walk's own N back, not the band: the walk reverses N in full before asking.) **The band itself, far out**: the turn
over (a finger that waits for it), a finger mm back is ~20 mm of surface — 8 mm back ≈ 160 mm + the crossing's overshoot (4 – 44 mm): a dy back
honoured about **200 mm from the edge (0.9 of a 221 mm face)**, was 430 – 450 mm (two faces, to the opposite level face). Measured with N = 10 at band
8: 238 / 242 mm since the crossing. Most often the reversal starts during the turn (the gizmo held ~30 frames): then it is honoured within the face.

**The triangle** (`zT_far`, `bT_far`, both ways): the hold on the triangle 56 blocked frames → **0 – 1**; the dx round the tip ends the hold.
`zT_close` s1 (27 blocked) and `bT_close` s1 (26 / 19): unchanged and NOT the triangle — the probe's dx slid back onto the top faces (x 215 – 226 mm)
and its dy crossed the ridge again: a new crossing, its hold by the rule. **The coast** (`zC_far`): the hold set by the coast 2 – 4 frames after
the release → **none**; the next press blocked 19 of 41 frames, moved 0 mm → **0**, moved 220 / 262 mm. **The lift** (`zL_*`, `bL_*`): unchanged
(honoured after 6 frames). **No `STALE` hold** after any steering (base: in every run starting from the boot). **The wobble** (`zW_far`,
`zW_close`, `bW_far`): the hold kept, no turn, no second crossing; `back` at most 3.5 mm (was 21 mm). **8 px a frame**: N 3 / 6 blocked as before,
N ≥ 12 not blocked (was 12 – 21 frames).

**No ping-pong**: every walk with N under the band — no second crossing (the walk of 2026-11-14 is N = 3: blocked, no crossing). `tilt_check`
`MODE=ridge` (`0 1 4`), `tilt_check` default (`1 0 4`), `across_check`, `ridge_check` `MODE=tip` (far, close): **identical** to the base, line for
line. `mid_check`: the walk identical; its setup's one hold (a probe step, set with no dy pushing) not set (holds 1 → 0). `ridge_check`
`MODE=across`: the walk identical; the bottom far edge's hold set after the walk-back's release (at the base) → none (holds 3 → 2).

**Elsewhere**: the three replays — `Scene_1` and `Scene_0bis` identical in every frame; `Scene_0` 2696 of 2794 frames identical, the rest within 6e-10
(the last digits: noise; `1e-6: never`, no non-numeric difference) — health and worst frame as the base's. `Scene_0` close in (`s0_ridge_close`,
`s0_bottom_close`): N = 12 blocked 112 → 0; the rest as at the base. `Scene_1`: its replay identical, `MODE=ridge` identical (the probe's own
`s1_top_close` is not meaningful: its steering never reaches the top). `npm run verify`: **165 files, 2066 vectors** passed.

**What the owner will feel**: after a half turn, pushing on the way he crossed stays held (no bounce back over the edge); a deliberate move back of
**8 mm of finger** frees it — far out the gizmo is then within about one face of the edge, never round to the opposite level face; a fresh press
after a lift or a coast is never blocked; a dx onto a tip's triangle carries no hold there.

**Vectors** (`tests/orbit_any_shape.test.ts`, describe "DH"): the hysteresis (a 50-swing wobble, the pay-off, the release, a nadir's), the default
and its slider, `dySignPushing`, `holdAtCrossing` and its wiring; the gesture's end pin. Red on 7 mutants (the old counter; the last dy kept on a
sideways step; `holdAtCrossing`'s back; a 0 hold leaving the last on; no reset at the gesture's end; the old sign wiring; the old default 30).
