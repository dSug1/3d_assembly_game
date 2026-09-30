# LEVEL_END — when a level is complete, the results screen, and the UI theme

> **STATUS** · ✅✅ built and **CLOSED BY A DEVICE LOOK** 2026-09-30 (`D180`: *"Tested, ok"*, build `a796ac0`) · **OWNS** · `GM1`'s level end, the results screen, the
> UI theme (the graphics style of every screen)
> **READ IF** · you are changing what ends a level, what the results show or where they lead, or restyling the screens

> *"Build level end. Use the current light video games best practices for the scaffold and user interface. For the
> graphics aesthetics, make it so we can later modify to adopt one or another graphics style."* — the owner, 2026-09-30
> (`D180`)

## 1. When a level is complete — the rule (`core/level_end.ts`)

`PLAYABILITY` §2 item 4: *"level end — the clock and the count stop, the result is shown"*.

* ⭐⭐ **Complete = the goal is met AND the scene is at rest** — no finger down (`GestureSpan.active`), no snap animating
  (`alignSnaps`, `seatSnaps`). The goal is `core/goal.ts`'s verdict — the one the HUD prints and the dissolve acts on;
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

## 5. For later

* **Scores**: *par* and stars once `GM4` (the solver) and `GM5` (the score) exist; the best result kept on the device
  (`GAME_STRUCTURE.md` §5 #6, `SEC1` first).
* **The celebration on the scene itself** — the pieces pulse, the camera eases around the finished build — and sound and
  haptics (`GM9`, `PLAYABILITY` §4.1), honouring reduced motion.
* **A settings screen** with the theme choice in it (`GAME_STRUCTURE.md` §5 #3).
* **A scene-side style** — a theme carrying the 3D palette, lighting mood and materials, for a full art-direction swap.
* **Pause freezes the clock** (`GAME_STRUCTURE.md` §5 #4) — the results' time still counts a paused stretch.
