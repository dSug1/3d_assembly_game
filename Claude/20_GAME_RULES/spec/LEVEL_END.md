# LEVEL_END — when a level is complete, the results screen, and the UI theme

> **STATUS** · ✅✅ built and **CLOSED BY A DEVICE LOOK** 2026-09-30 (`D180`: *"Tested, ok"*, build `a796ac0`); ⭐ `D183`'s
> goal capture (§5) ⛔ unjudged · **OWNS** · `GM1`'s level end, what PLACED means and the goal capture, the results screen,
> the UI theme (the graphics style of every screen)
> **READ IF** · you are changing what ends a level, what the results show or where they lead, or restyling the screens

> *"Build level end. Use the current light video games best practices for the scaffold and user interface. For the
> graphics aesthetics, make it so we can later modify to adopt one or another graphics style."* — the owner, 2026-09-30
> (`D180`)

## 1. When a level is complete — the rule (`core/level_end.ts`)

`PLAYABILITY` §2 item 4: *"level end — the clock and the count stop, the result is shown"*.

* ⭐⭐ **Complete = the goal is met AND the scene is at rest** — no finger down (`GestureSpan.active`), no snap animating
  (`alignSnaps`, `seatSnaps`, and a goal pull, `D183`). ⭐ Met = every piece PLACED, §5. The goal is `core/goal.ts`'s verdict — the one the HUD prints and the dissolve acts on;
  ⛔ never a second detector (`PLAYABILITY` §4.1: a cue that can disagree with the rule is worse than none).
* ⭐ **Why at rest**: an episode lands when its gesture's last touch lifts (`D115`), so waiting for rest is what lets the
  LAST move count — and what keeps the results from appearing under a finger still pressing.
* ⭐ **It must have been played**: the clock started (the first press, `D112`). A level that boots solved is not won by
  nobody. A **demo** level is complete when its replay is done (`st.demo.done`) — no one plays it.
* ⛔ **It latches**: once complete, nothing un-completes it; the result is frozen — **the clock stops** at the completing
  frame (`GM3`: *first press → detection*; the HUD shows the frozen time and `LEVEL COMPLETE`), **the count stops**
  (the results overlay covers the canvas: no touch reaches the scene, the router or the ledger), and every body becomes
  unpickable.
* The result: `PLAYED` → episodes, elapsed ms, pieces in place / all; `DEMO` → no moves, no time.
* ⭐ The goal is asked only while the scene is at rest (`render/level_end_wiring.ts`), so a drag pays for no goal check.
* ⚠ `Scene_0` has no goal (`final: null`): it never ends.

## 2. ⭐⭐ The results screen (`render/level_end_ui.ts`) — the casual-game pattern

| what | how | why (best practice) |
|---|---|---|
| **a beat first** | the card appears `celebrateDelayMs` after completion (700 ms, the theme's) | the last piece is SEEN landing before anything covers it |
| **the ⏸ goes** | `PauseMenuHandle.hide()` | one way on, not two overlapping menus |
| **a dimmed scene, a card LOW on the screen** | a scrim over the canvas; the card pops in (fade + rise) as a **bottom sheet** (to the side in landscape) | the finished build — the reward — stays in view ABOVE the card; ⛔ the first build centred the card and hid the painting (seen headless) |
| **a headline and a badge** | *Level complete!* · ★ Solved (a demo: *Demo complete* · ▶ Watched), the level's title under it | one glance says what happened |
| **three numbers** | **moves** (the episodes — `SCORE.md`'s unit, named for a player), **time** (`mm:ss`), **pieces** (`41/41`) | only what a player can act on; ⛔ no empty *par* or *stars* until `GM4`/`GM5` give them a value |
| **ONE primary action** | *Next level* when there is one, else *Retry* (*Watch again* for a demo) — focused, so Enter works | a single obvious next step; the others are secondary |
| **then** | *Retry* (when *Next* is primary) · *Level select* (that world's list) | the industry's three (`GAME_STRUCTURE.md` §4) |
| **accessibility** | touch targets ≥ the theme's `touchMm` (10 mm), safe areas, `role="dialog"` + `aria-modal`, a visible keyboard focus, no animation under `prefers-reduced-motion`, AA contrast (§3) | a youth audience (`D2`), phones and tablets held in two hands |

⭐ **Where each button goes** is `core/game_route.ts`'s `resultTarget` (vectored): *Next level* = the next PLAYED level in
reading order, across worlds, **never a demo** (`nextPlayableIndex`; none after the last → no button); *Retry* = the same
level from its boot; *Level select* = the level's own world. ⭐ Every other URL parameter is carried (`D144`'s rule).
⚠ Today: *Level 1* has no next playable level (the demo is not one), so its card shows *Retry* as the primary.

## 3. ⭐⭐⭐ The UI theme — a graphics style is DATA (`core/ui_theme.ts`, `content/ui_themes.ts`, `render/ui_theme.ts`)

* ⭐ **Design tokens**, the industry's way to make a look swappable: a theme is one object — **colour** (scrim, surface,
  text, muted text, accent, button, success, each with its text colour), **type** (family, size, bold weight), **shape**
  (radius, border, shadow), **space** (the base unit, the touch size in mm), **motion** (fast, enter, the celebration
  beat, the easing).
* `render/ui_theme.ts` writes them as CSS custom properties (`--ui-*`) and installs ONE stylesheet of classes (`ui-panel`,
  `ui-overlay`, `ui-card`, `ui-button`, `ui-button--primary`, `ui-title`, `ui-stat…`, `ui-toast`, `ui-icon-button`).
  ⛔ **Every screen uses only those classes** — the shell, the pause menu, the goal pop-up, the results. A vector reads
  their sources and refuses any colour, `px` or `cssText` literal: a swap restyles them all.
* ⭐ **Two themes now**, so the swap is real and tested: **`night`** — the look the screens already had (navy,
  monospace), the default — and **`paper`** — light, rounded, sans-serif, springy motion. `GameContent.uiTheme` picks the
  default (`night`); **`?uiTheme=paper`** tries another on any page.
* ⛔ **Legibility is part of the contract** (`themeProblems`, vectored for every theme): WCAG AA contrast (4.5 : 1; 3 : 1
  for muted text), touch targets ≥ 7 mm, sane sizes and durations. A theme that fails is printed on the page at boot.
* ⭐ **To add a graphics style**: one `UiTheme` object in `content/ui_themes.ts`, listed in `UI_THEMES` — nothing else.
  Fonts beyond the system's would be self-hosted (`60_SECURITY_COMPLIANCE`: a font host is egress).
* ⚠ **It is the UI's style, not the 3D scene's.** Piece colours, lights and the background are each scene's data
  (`SCENE_1.md`); a scene-side style (a palette per theme, materials) is a later step (§5).

## 4. What was checked

* ✅ 17 vectors (`tests/d180.test.ts`): the rule (at rest, played, the demo, the latch), the routes over a TWO-world
  fixture with a demo in it, every theme's legibility, `themeProblems` catching a bad theme, the theme choice,
  `?uiTheme=` not reported as a bad tunable, and the no-literal-style guard. ⛔ Four mutants, each RED: no finger-down
  check (2 red), *Next* onto a demo (3), the old inline-styled `screens.ts` (1), the old URL parser (1).
* ⛔⛔ **MY FIRST INSTRUMENT LIED**: Chrome's `--virtual-time-budget` screenshots showed `LEVEL COMPLETE` on the HUD and
  NO card, at 16 s and at 30 s — its virtual clock does not advance a page's timers and frames as real time does (a DOM
  dump in the same mode had the demo at move 1 of 150). ⭐ Re-checked on REAL time over the DevTools protocol (a script:
  load, wait, ask the page, screenshot): the card is there. *The instrument is a suspect, always* (`METHOD`).
* ✅ Real time, 882 × 1304: the DEMO ends on *Demo complete* (`night`); **Level 1** finished through the MODEL (the five
  boot-displaced pieces set on their goal poses on the dev server, the clock started) ends by the product's own path —
  `goal 36/41` → `goal ✅`, the ⏸ gone, the clock frozen at `01:23`, the card *Level complete! · 0 moves · 01:23 ·
  41/41 · Retry · Level select*, in `night` and `paper`.
* ⛔ **Found by that look and fixed**: `?uiTheme=paper` was printed on the HUD as *"not an overridable tunable"* — the
  URL-override parser now passes it by (`input/config_override.ts`), with a vector.
* ⚠ Moves read 0 there because no gesture was made; the count itself is `D112`'s ledger, unchanged.
* ✅✅ **CLOSED BY A DEVICE LOOK** — the owner, on the tablet, build `a796ac0`, 2026-09-30: *"Tested, ok"*.

## 5. ⭐⭐⭐ The goal capture, and what PLACED means (`D183`, 2026-09-30, ⛔ unjudged by a hand)

> *"piece2 should be able to reach its goal also even if unaligned or aligned with other objects provided that its
> transform meets the goal transform within the same position and roll margins as for the snap"* · *"Capture during a
> drag like snap. goal wins over snap"* · *"Loose, use the capture margins so the feeling for the user is the same"* ·
> *"if a piece was never grabbed, the criteria shall restrict to 1mm on the glass and 1 degree"* — the owner

* ⭐⭐ **PLACED** — one rule, read by the capture, the HUD's `goal n/41`, the dissolve (`D142`) and §1: a piece's CENTRE
  within the margin of its slot (the `RELATIVE` fit, `D130`), its ORIENTATION within the angle of the nearest accepted
  one (the half-turns only where the scene's data says `symmetry: "halfTurns"` — `Scene_1`'s, not a rule).
  * a piece **GRABBED** this level (pressed by a finger or the mouse, or dragged as an assembly's root): **the snap's own
    margins** — `captureOffsetMm` (10 mm) on the glass at the camera NOW, `snapConeDeg` (15°);
  * a piece **NEVER grabbed**: **1 mm on the glass and 1°** (`ungrabbedGoalMm`, `ungrabbedGoalDeg`, sliders in SCENE) —
    so zooming out (which widens 10 mm of glass to ~8 cm of scene at 3 m) cannot place a piece nobody moved.
  * ⛔ `D130`'s fixed 5 mm / 5° (`goalPositionTolM`, `goalAngleTolDeg`) are deleted with their sliders.
* ⭐⭐ **THE CAPTURE** — a piece that MOVES INTO its margins, aligned or not, is pulled onto its EXACT goal pose (centre
  and orientation, the nearest accepted one) — the snap's magnet (`snapMs`, `magnetEase`) — during the drag, as the snap
  is. ⭐ **The goal wins over the snap**: asked first each frame; a snap in flight is dropped, the piece's alignment and
  seat released (it keeps its pose), and the drag that made it STOPS as a snap's does (`D139`: the roll alone until the
  finger lifts). It lands with the pop-up `✅ PieceN reached its goal · n/41`.
* ⛔⛔ **ENTRY, NOT PRESENCE** — a piece already inside when it is first seen (the boot; the frame after an undo) or just
  captured must LEAVE its margins before it is captured again; otherwise the first millimetre of any drag off the goal
  would pull it back, and a placed piece could never be moved. A piece inside that did not move (a zoom, another piece's
  fit shifting) is not captured.
* ⭐ **A blocked flight WAITS** — `D182`'s path check: no pull starts through a third body; the piece stays pending while
  it stays inside and is pulled once the way is clear. A pull cut mid-flight is re-offered the same way. ⚠ A SEATED
  piece whose pull is blocked falls back to `D143`: its couple dissolves and only its spin is mated.
* ⭐ **Identical pieces are interchangeable** — `FinalPose.kind`: pieces of one kind may fill any of that kind's slots,
  matched at the least total error (a tie keeps each on its own). `Scene_1`: one colour and one size, same axis order, is
  one kind — the black 1.26 bars Piece22/26/29/38 fill any of their four slots.
* ⭐ **A piece never dragged** (a follower carried by its seated Pioneer) is captured by the same rule when it moves in —
  under its never-grabbed margins unless it was grabbed before. The owner: at best its Pioneer's goal brings it home; at
  worst a false positive, accepted.
* ⛔ Not in a demo (it plays itself), not after the level end. Undo drops a pull in flight and re-sights every piece.
* ✅ 19 vectors (`tests/d183.test.ts`): the kinds (twins swapped both placed; without kinds 39/41), loose vs strict, the
  exact target (half-turn kept), the tunables, entry-not-presence, pending, retry, the pull landing exactly, the wiring
  order. ⛔ Four mutants each RED: no kinds, the per-piece margins ignored, armed on first sight, capture left armed.
* ✅ **The real app** (dev server, DevTools protocol, one step per frame through the drag's writer): Piece2, unaligned,
  8° off — grabbed, captured at 38 mm (the margin is 39.7 mm at 1.5 m) and landed at 0.00 mm / 0.00°, `✅ … 37/41`;
  never grabbed, not captured. ⛔⛔ **Two defects it found, each fixed with a vector that failed first**: the relative
  fit's inlier cut WAS the placement margin, so the piece being captured bent its own frame and landed 4.7 mm / 0.7° off
  (the fit has its own 2 mm floor now, `FIT_INLIER_M`); and a seated follower dissolved at its goal was CAPTURED again
  the next frame — two pop-ups (a dissolve now counts as its capture). ✅ `D182`'s horizontal snap onto Piece22 still
  seats, then dissolves once.

## 6. For later

* **Scores**: *par* and stars once `GM4` (the solver) and `GM5` (the score) exist; the best result kept on the device
  (`GAME_STRUCTURE.md` §5 #6, `SEC1` first).
* **The celebration on the scene itself** — the pieces pulse, the camera eases around the finished build — and sound and
  haptics (`GM9`, `PLAYABILITY` §4.1), honouring reduced motion.
* **A settings screen** with the theme choice in it (`GAME_STRUCTURE.md` §5 #3).
* **A scene-side style** — a theme carrying the 3D palette, lighting mood and materials, for a full art-direction swap.
* **Pause freezes the clock** (`GAME_STRUCTURE.md` §5 #4) — the results' time still counts a paused stretch.
