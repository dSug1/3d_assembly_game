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
