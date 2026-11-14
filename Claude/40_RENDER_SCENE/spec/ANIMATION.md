# ANIMATION — what moves, appears or disappears on its own, by the 12 principles

⭐⭐ The owner, 2026-11-14: *"I want to add animations when something move or appear or disappear so the game is dynamic. Animations shall be done
as per the 12 principles of animation by Frank Thomas and Ollie Johnston"* (*The Illusion of Life: Disney Animation*, 1981). This file is the
rule for EVERY animation the game plays; the built ones and the queued ones are in §4; each is a removable MODULE (§6).

## 1. ⛔⛔ The first rules

1. **THE FINGER OWNS WHAT IT DRIVES.** An animation is for what the GAME does on its own: a part appearing, disappearing, landing, snapping to its
   seat, a reset, the level end, a screen, the camera at rest. ⛔ **Never on what the player drives**: the orbit, the held part, the browsed centre's
   glide, a translation or a depth step stay **by position, linear, proportional to the finger** — no ease in time, no overshoot, no follow-through.
   The owner's own findings: the eased centre blend gave *"big jumps and stalls"*; a time-driven minimum speed *"the logic is wrong"*
   (`SCENE_2_ASSEMBLY.md` §5 item 7). A CATCH BACK after an animation (the idle orbit's) is by the finger's travel too.
2. ⛔ **THE FLOOR IS NEVER ANIMATED** (the owner: *"the floor shall never be animated"* — his third example's rings on the floor: never).
3. **Every animation is a MODULE** (the owner: *"make sure all these animations are modular scripts, so I can remove them easily"*) — §6.

## 2. ⭐⭐ The 12 principles, as this game applies them

The parts are MACHINED, RIGID metal and glass: the principles are applied with a mechanical restraint — the motion reads as physical, never rubbery.

| # | principle | in this game |
|---|---|---|
| 1 | **Squash and stretch** | ⛔ never on a part's shape (its geometry is the data: collision, seats, faces). ⭐ Only as a UNIFORM scale pulse on an appearance (the pop: 0 → 1.08 → 1); the collision layer never scales. |
| 2 | **Anticipation** | the HOLD: a short beat in the air after the pop, before the fall — each piece its own (50 – 100 ms), so the fall ripples; a camera move eases in. |
| 3 | **Staging** | the owner's choice for the boot: ALL AT ONCE (*"all pieces shall appear and drop at the same time"*) — one event, the whole scene arriving; the per-piece holds break the unison; nothing animated competes with the part in hand. |
| 4 | **Straight ahead / pose to pose** | POSE TO POSE: keyed poses (the start, the key moments, the end — a computed pose, e.g. the boot layout) joined by curves; nothing is simulated frame by frame. |
| 5 | **Follow through / overlapping action** | a part that lands REBOUNDS (the owner: *"a very small rebound"*, then *"100 % higher"*: 12 % of its radius); the holds offset the falls. |
| 6 | **Slow in / slow out** | the game's own motions ease, by their physics: a fall accelerates (one g for every part), a pop decelerates, an idle orbit fades in. ⛔ Never on what the finger drives (§1). |
| 7 | **Arcs** | a turning fall: the part's tumble shares the fall's timing; the idle orbit an ellipse. |
| 8 | **Secondary action** | the part's shadow follows it down (the shadow map refreshes while anything moves); the contact shadows come back as it lands; a sound later. |
| 9 | **Timing** | §3; one g for every part; the whole boot ≈ 1.6 s. |
| 10 | **Exaggeration** | modest: overshoot ≤ 10 %, a rebound 12 % of a part's radius, the boot's 360° turn the owner's (⛔ the plinth only pops, in place). |
| 11 | **Solid drawing** | a turning part never passes through the floor (tested every 2 ms); ⚠ ALL AT ONCE, neighbours may brush in the air while they turn — measured, the owner's trade (§4). |
| 12 | **Appeal** | clear silhouettes, one clean motion each, the end pose EXACT — the player sees the part where it truly is. |

## 3. ⭐ The timing table (the defaults; sliders per §6)

| motion | duration | curve |
|---|---|---|
| appear (scale pop) | 170 ms (the ball: 5 frames at 30 fps), every piece at once | ease-out-back, 8 % overshoot |
| hold in the air | each piece its own, 50 – 100 ms (drawn from the boot's seed; 300 first) | still |
| fall from 3 units | 500 ms — sets g; the lift 3.6 units ≈ 550 ms | h = lift − ½ g t² |
| landing rebound | 180 ms, 12 % of the radius (6 % first) | a parabola, straight up and down |
| boot camera pull back and sweep | the whole boot (≈ 1.6 s), 2.5 m → 3 m (1.5 first; 2.25 tried), yaw −15° → the front (−5° first) | smoothstep (in and out) |
| idle orbit | starts after 4 s (10, then 5 first); a 6.8 s loop; ± 1.2° yaw, ± 0.5° pitch | an ellipse, faded in over 2 s |
| idle catch back | 12 mm of finger, or 300 ms without a delta | linear |
| *(queued)* a seat's snap · a disappearance · a screen | 120 – 250 ms | out / in |

## 4. The animations

* ⭐⭐ **THE BOOT'S POP AND TUMBLE — BUILT** (the owner, 2026-11-14: *"all the pieces except the floor shall appear with a pop up in the air, then
  rotate 360 on world pitch while they reach their position on the floor"*; his videos: *"the 153 shows a ball which pops up; the 347 shows the pieces
  which pitch rotate; I want to mix the two: first pop up then pitch rotate"*; *"019 … the overall feel (including when the piece lands), except that
  a pop up shall replace the loop"*; *"a very small rebound when the piece lands"*). `core/boot_anim.ts` + `render/boot_anim_wiring.ts`:
  then, having seen it: *"all pieces shall appear and drop at the same time: not one after the others. Also, shorten the pause between the pop
  up end and the start of rotation/fall"*; *"don't rotate the plinth. just pop and fall"*; *"lag between the end of the pop up and the start of
  the fall: make it random, clamped between 50 ms and 100 ms … different lag for each piece"*; *"make the rebound 100 % higher"*; *"the plinth pops
  up directly in its position: no fall nor rotation"*):
  1. the layout is drawn first (`bootFromModel`; ⛔ no stacking at boot — `SCENE_2_ASSEMBLY.md` §2.5) — the animation travels TO it; the end is
     its pose BIT-EXACT (tested);
  2. ⭐ ALL AT ONCE: every part but the floor POPS at the same instant — ⭐ the plinth AT ITS PLACE, nothing more (`motion: "pop"`: no lift, no
     fall, no turn, no rebound); the others above their spots, all lifted by the SAME height (the layout shifted up: nothing overlaps while they
     hang); each HOLDS its own 50 – 100 ms (from the boot's seed: `?bootSeed=N` replays them); FALLS under one g turning `turns` × 360° about the
     world's PITCH axis (the boot camera's right; + tips the top toward the camera); the turn done by `turnTo`, where every turning part's sphere
     is above the floor; straight down from there; REBOUNDS; rests. ≈ 1.6 s in all, the lift 3.6 units;
  3. ⚠ **the price of all at once** — each part turns about its own centre, so neighbours side by side may BRUSH in the air mid-turn: measured on
     the real hulls (four seeds): 3 – 10 pairs a layout, mostly the pistons and the block's cases, for a fraction of the turn. ⛔ The earlier
     schedule that proved no contact (the plinth first, staggered pops, parts popping higher to fall one above the other: 5 – 7.6 s) is replaced;
  4. ⭐ **THE CAMERA PULLS BACK** meanwhile (the owner: *"add a backwards approach of the camera from the boot moment until the pieces are set,
     from r=1.5m to r=3m"*, then *"from 2.25m to 3m, yaw from -5 to 0 degree (current front)"*): from 2.5 m to the game's own distance (3 m — *"revert to 2.5 m -> 3m"* after 2.25) and
     SWEEPING from −15° of yaw onto the front, together (*"camera yaw from -15 to zero degree at boot"*; −5° first), slow in and out, arriving exactly as the last piece is set
     (`pullBackRadius`); a LAYER (the radius set for the draw, given back after it) — the player may orbit meanwhile; `bootCamFromM` 0: none;
  5. not browsed in flight; the contact shadows off while it plays, back at its end; the model unfrozen while it plays, frozen at its end;
  6. replayed by the stage slider (1 → 0) and by any BOOT ANIMATION slider; `?anim=0` or the OS's *reduce motion*: the heaps at once;
  7. ⭐⭐ **IT STARTS WHEN THE BOOT IS READY** (the owner: *"show the scene when everything at boot has been computed. at the moment, the scene is
     shown and the timer starts so the pop up and rotation is cut and I start to see the pieces sometimes when they have fallen already"*): the
     clock started at the first frame drawn, while the GPU still compiled the parts' shaders and drew the shadow maps — frames of hundreds of ms,
     the clock racing past the pop. Now: every part HIDDEN until the boot's other work is done (`host.ready` — the contact file) AND the parts'
     materials and the shadow shaders are COMPILED (`forceCompilationAsync`, 4 s guard); then the clock starts, and it advances by at most one
     30-fps frame a frame — ⭐ a hitch SLOWS the animation, never skips it. ⏳ The proper wiring: the loading indicator below.
* ⭐⭐ **THE IDLE ORBIT — BUILT** (the owner, 2026-11-14, with his video …081353: *"whenever the player is inactive for xx seconds, such small camera
  orbit triggers on: it will small orbit around the current camera position; it will trigger off when the player inputs something in the scene (not
  menu nor UI) and the camera will catch back its game position with mm of input or ms (if the input is not delta position)"*). Measured on the video
  (the tray and floor tracked by features, 30 fps): a closed loop ≈ 6.8 s, ≈ −13 / +3 px across and ± 4 px of 1140, ≈ 1° of turn, ± 1 % zoom.
  `core/idle_orbit.ts` + `render/idle_orbit_wiring.ts`: after `afterS` without a SCENE input (a press, a drag, a wheel on the canvas — ⛔ not the
  menu or the UI, ⛔ not a hovering mouse; `afterS` 4 s — *"reduce the timer for idle camera from 10s to 5s"*, then *"from 5 s to 4 s"*), an ellipse of yaw × pitch round the game angles, faded in; the next scene input stops it and the camera
  catches back — by the finger's travel (12 mm), or in 300 ms for an input without a delta. ⭐ A LAYER: added to the camera's angles for the draw,
  taken off after it — the game's camera, picks and readouts never see it (⚠ a press during it picks from the game camera, ≤ ≈ 1° off).
* ⏳ **QUEUED — THE COLLISION RECOIL** (the owner, 2026-11-14, his video …081840: *"the example of animation movement in reaction to a collision:
  the rod goes backwards and springs back when the disc collides. I want to reapply this later on for collision animation"*). Seen in the video: a
  disc slides down the rod onto the stack; at the impact the stack and its rod RECOIL along the rod's axis (away from the impact, a fraction of a
  disc's thickness, motion-blurred) and SPRING BACK, damped, in ≈ 10 frames (≈ 330 ms) — at every disc's arrival. To build as its own module: on a
  collision event (the solver's contact, `30_OBJECTS_3D/spec/COLLISION.md`), the HIT body (the anchor/assembly, never the floor) recoils along the
  impact's normal by an amount scaled to the impact speed, a damped spring back to EXACTLY its pose; a drawn offset only (the collision state
  untouched, as the idle orbit's layer); ⛔ never on the held part (§1).
* ⏳ **TO DO — A LOADING INDICATOR AND ONE "BOOT READY"** (the owner, 2026-11-14: *"if the scene requires a certain time to load, we will later
  make a button with a slider to show the scene is loading"*, then *"we will then later wire this properly to make sure all the boot computations
  from the other modules are complete before showing the scene, with a button with load slider during this time"*). ⭐ PROPOSED:
  1. **A boot-task registry** (`render/boot_tasks.ts`, engine-free core `core/boot_tasks.ts`): every module that has work before the scene is
     shown REGISTERS a named task with a weight and a promise (the `.glb` fetch — its bytes known: real progress; the boot layout; the contact
     file; the shader compile; the environment `.hdr`; later the level's own); the registry's progress = the weights done / all, monotone.
  2. **The loading screen** — the scene hidden (the canvas drawn but covered, so the GPU warms up behind it), a button-shaped bar with the
     progress slider and the scene's name; ⛔ never a frozen bar: a task without progress of its own moves its share when it ends.
  3. **ONE "boot ready" event** when every task is done (and one frame drawn behind the cover): the cover fades out (150 – 250 ms), THEN the
     boot animation's clock and the idle orbit's timer start — each animation module waits on that event instead of its own (`host.ready`
     becomes the registry's promise; the boot module's compile step becomes a registered task).
  4. A guard: a task that never ends is named on the HUD after N s and the scene shown anyway (a level never stuck behind the cover).
* *(to come)* a part's seat snap, an undo, the reset, the level end (`20_GAME_RULES/spec/LEVEL_END.md`), the screens.

## 5. ⭐ How an animation is built (the pipeline's rules)

1. **The curves are engine-free** (`src/core`, pure functions of time → pose), with golden vectors that FAIL on a counter-example: the end pose exact,
   the overshoot bounded, the sweep rule (each with a planted violation caught), the axis's direction, the catch back's proportionality.
2. **The render applies them** from the frame's time, in its own wiring module; ⛔ never a `setTimeout` chain, never Babylon's animation groups for
   game motion (the state stays the game's, the tests read it).
3. **Tunable** — each duration and amount a slider (`TUNING_MENU.md`), the defaults from §3; `?anim=0` and the OS's *reduce motion* play none.
4. **The frame rate** (`SCENE_SETUP.md` §6): while something animates its meshes are UNFROZEN and the shadow map follows them (its signature
   changes); at the end they are frozen again and the shadow map goes back to its events. Measured on the phone like any stage.
5. **Deterministic** — driven by the boot's seed and the frame time only; a replay (`?bootSeed=N`) plays the same motion (the holds too).

## 6. ⭐⭐ THE MODULES — and how to remove one

Each animation = a CORE file (the curves) + a WIRING file (the render) + its test + its config keys and sliders + **hook lines marked
`ANIMATION MODULE: <name>`**. To remove one: delete its files, the marked lines, its keys in `input/gestureConfig.ts` (the field, the default, the
check) and its menu folder (`render/tuning_menu.ts`, `tests/menu_layout.test.ts` — the count). `tests/config_debt.test.ts` then confirms nothing
dead is left. The game without it behaves as before it.

| module | core · wiring · test | hooks | sliders |
|---|---|---|---|
| `boot` — the pop and tumble | `core/boot_anim.ts` · `render/boot_anim_wiring.ts` · `tests/boot_anim.test.ts` | `render/model_import.ts` (the marked lines; `BootLayout`'s `extent` and `anchors` stay — the layout's) | LEVEL › BOOT ANIMATION (9) |
| `idle` — the idle orbit | `core/idle_orbit.ts` · `render/idle_orbit_wiring.ts` · `tests/idle_orbit.test.ts` | `render/scene.ts` (2 marked lines) | CAMERA › IDLE ORBIT (7) |
