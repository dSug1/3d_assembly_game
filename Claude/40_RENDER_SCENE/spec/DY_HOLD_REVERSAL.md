# The dy held after a half turn — "I cannot revert the dy" (2026-11-17)

> **STATUS** · ⛔ **REPORTED BY THE OWNER the night of 2026-11-17** — to troubleshoot and to fix BEFORE the audit: the build as briefed §1 – §4; the
> root cause and what was built: after §4. **OWNS** · this report, its root cause, its fix · **READ WITH** ·
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
