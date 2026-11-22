# RND6 — The black canvas on the iPhone (the WebGL context lost, never restored)

> **STATUS** · ⛔ **NOT FIXED — NOTHING BUILT**, by the owner's instruction · diagnosed to `Scene_2`'s loads; the mechanism PROBABLE, not verified
> **LAST VERIFIED** · 2026-11-16, on the live build `40c6325` (its tree = `c7ac510`, branch `1.0.146-Orbit-charts`)

## The page to read first

**The symptom.** On the owner's iPhone (Safari, from GitHub Pages), the game loads well for a while; then at ONE load the 3D view goes black —
the HUD, the score bar and the buttons still drawn over it — and from then on EVERY load is black, in every tab, in a private tab too, in every
scene, until Safari is force-quit (swiped away). The HUD's `draw` line on the black page: `gl ⛔LOST (lost 1, back 0) · frames 1`.

**The status.** ⛔ Nothing is built. The owner (2026-11-16): *"Don't build anything until we understand the root cause."* — then *"Don't build any
fix. When the root cause is found, record it in the queue md file or somewhere else so i can start a new Opus conversation and fix from there later
on."* A build of a recovery was started on 2026-11-16 and STOPPED at once on his word: the branch `1.0.146b-GL-context-recovery` (worktree
`../gl_recovery`, from `c7ac510`) holds this record and the probes only — no source change.

**What is known, in five lines.**
1. ✅ CERTAIN — the game has NO recovery: a WebGL context lost and not given back by the browser leaves the canvas black for the page's life.
2. ✅ CERTAIN (the owner's checks) — the dead state is Safari's, PROCESS-WIDE (its GPU side): it survives reloads, new and private tabs; only a force-quit clears it.
3. ✅ CERTAIN (the owner's experiment) — reloading `Scene_2` (`?sceneIndex=3`) kills it at about the 4th load; reloading `Scene_0` many times does not.
4. ✅ CERTAIN (measured) — `Scene_2` allocates NO MORE WebGL memory than `Scene_0`, and keeps nothing alive after a reload that `Scene_0` does not.
5. 🔶 PROBABLE, NOT verified — the trigger is `Scene_2`'s GPU WORK per frame (245 meshes, PCSS soft shadows, PBR, the shadow map redrawn every frame while shadows are on, the boot animation, at 3×) — iOS aborting GPU work that runs too long, and Safari then refusing WebGL until restarted.

**What to do next** (in this order — no fix before step 1 says which feature): (1) ⭐ **THE TEST ON THE PHONE** — the section of that
name below, a procedure with its addresses and an empty results table (no deploy, no slider needed); (2) if possible, Safari's Web Inspector from
a Mac on the black page; (3) only then choose among the fix candidates (`## The fix candidates`), with the owner.

## The owner's reports and checks (verbatim, dated)

* **2026-11-15** (12:23Z, on `7db32b6`, with a screenshot): *"The scene is black. I can't see anything"*. Then (14:06Z, nothing changed in the
  code): *"it is now working on the phone. solved."* — recorded at the time as solved, its cause never found (`ORBIT_CHARTS.md` §~438, `RND5.md`).
  That screenshot's HUD: `tuning sceneIndex=4` / `⛔ v: not an overridable tunable` / `frame — shadows=auto (measuring…)` / `build 7db32b6
  2026-11-15 12:05Z` / the clock `08:17`, the score bar and the buttons drawn, the canvas the page's background (`#14161a`). The `draw` line did not
  exist yet — `2cae564` added it for this report.
* **2026-11-16**: *"the bug with the black window at relaunch on mobile phone from github has come back. The game launches well, then at one reload
  it happens the black screen (see attached) and then every successive reload is the same black screen."* — the screenshot (iPhone, Safari,
  dsug1.github.io, 4G), the HUD over a black canvas, the score bar and the HUD / menu / pause buttons drawn normally:
  `tuning sceneIndex=0` / `⛔ v: not an overridable tunable` / `draw gl ⛔LOST (lost 1, back 0) · frames 1 · last — (lo…` (cut off) /
  `build 40c6325 2026-11-16 08:19Z` (the live build — NOT a stale bundle) / `frame — shadows=auto (measuring…)` /
  `camera c=(0.00,0.42,-0.09) r=7.569m elev=0.69 …` / `score 0 episodes 00:00 solver 0.03ms (peak 1)` / `last orbit: boot — the resting face
  aligned to cube …` / the goal bar 2/3 / `pointers 0`.
* *"It never happened before this conversation"* (his memory of the phone, not a bisect).
* The checks: *"Close and reopen a tab: error “the render loop produced no frame”"* — *"Private tab: same black screen"* — *"Force sweep safari: the
  game comes back"*.
* The experiment: *"4 reloads on scene 2 and the black screen appears. Multiple reloads on scene 0 and everything is ok."*

## The timeline

* **2026-11-13** — `ddd2572` / `c9738e4`: the last builds the owner judged on the device before. **`Scene_2` first deployed**: `33a78be` (imported),
  `049c290` (the final stage, the environment), `18a8fab` (`1.0.136-Scene2_environment`), `806579a` (`1.0.137-`: baked contact shadows, the shadow
  map drawn on events, the quality ladder). **2026-11-14**: `312a2fb` (`1.0.140-`: `Scene_2`'s boot animation, the rendering for fps), then the
  pick-up of parts (`9023b87`).
* **2026-11-15** — `7db32b6` deployed 15:02 +03 (the orbit on charts behind a switch); **the first black screen** reported 12:23Z (≈ 15:23 +03).
* **2026-11-15 – 16** — `157974f`, `7e49ae7`, `902ae88`, `f1e03d3`, `6685f8f`, `40c6325` (11:17 +03, the charts' switches ON by default).
* **2026-11-16** — **the second black screen**, on `40c6325`; the checks and the experiment above the same day.

## What is CERTAIN, PROBABLE, OPEN, RULED OUT (at `c7ac510`)

### ✅ CERTAIN

* **No recovery.** Babylon 7.54.3 (`scene.ts:106`: `new Engine(canvas, true, { stencil: true }, true)`) listens to `webglcontextlost` and calls
  `preventDefault()` (checked in the shipped `babylon-*.js`), so a restore is allowed — but it rebuilds only on `webglcontextrestored`, which never
  came on the phone (`back 0`). The game's own handlers (`render_loop.ts:41-48`, `2cae564`) only count and paint the HUD: no timeout, no reload, no
  message. Reproduced: a synthetic `loseContext()` on the live page gives the owner's picture exactly — `draw gl ⛔LOST (lost 1, back 0) · … ⛔390×844
  → 0×0`, never recovered (`reload_probe2.mjs`).
* **`frames 1`** = one render-loop call completed (`st.frames++` after `scene.render()`, `render_loop.ts:364`), then the loss (Babylon skips the
  loop while `_contextWasLost`).
* **"The render loop produced no frames"** (`main.ts`, the one-shot check at 1 s) = the context WAS obtained and the scene built (a failed
  `getContext` gives "The level could not be loaded" instead), yet no frame completed in the first second: lost before its first frame, a first
  frame over 1 s, or rAF suspended. The phone's state had worsened from `frames 1` to `frames 0`.
* **The dead state is Safari's, process-wide** — the owner's checks above (a new tab, a private tab: dead; a force-quit: back).
* **`Scene_2` triggers it, `Scene_0` does not** — the owner's experiment.
* **Our page persists nothing that matters**: `localStorage` holds two guarded booleans (`hud.ts:122/153`, `menu.ts:93/101`); no sessionStorage,
  IndexedDB, Cache API or service worker; the play recorder is dev only (`scene.ts:702`). The URL carries `sceneIndex` and the build gate's `v`
  (`main.ts:43-65`, `core/build_gate.ts`), both shown harmless over 15 reloads (`reload_probe.mjs`, one with the gate forced).
* **`Scene_2` allocates no more WebGL memory than `Scene_0`, and keeps nothing alive** (`gpu_ledger_probe.mjs`, 2026-11-16, the live site, 390×844
  at ratio 3, SwiftShader; four `Scene_2` loads gave the same ledger, the browser listed one page target and no worker after each):

| | `Scene_0` | `Scene_2` (`?sceneIndex=3`) |
|---|---|---|
| default framebuffer 1170×2532, MSAA 4× + depth-stencil (computed — the API cannot see it) | ≈ 101 MB | ≈ 101 MB, the same |
| shadow maps | 3 lights × (8 MB half-float colour + 4 MB depth) = 36 MB | 1 light (PCSS) × 12 MB |
| environment | none | HDR 512×256 (17 KB file) → a 256 half-float cube, 4 MB (+ ≈ 10 MB for the prefilter pass, transient) |
| `.glb` textures | none | 1 PNG 1024² (`WoodV`) = 5.3 MB with mips |
| vertex / index buffers | 0.05 MB in 72 | 1.3 MB in 873 (245 meshes, 9 materials, 4 of them BLEND) |
| **peak / steady**, without the default framebuffer | **36 / 36 MB** | **34 (at 2.2 s) / 23 MB** |
| shader programs linked | 11 | 12 |
| Workers / WASM / object URLs | 0 / 0 / 0 | 0 / 0 / 1 (revoked) |
| frame time (SwiftShader) | 72 – 77 ms | 360 – 540 ms (5 – 7× slower) |

| What could keep a page or its GPU memory alive after a reload | Where (`c7ac510`) | `Scene_0` too? |
|---|---|---|
| the engine never disposed, no `pagehide` release of the context | `scene.ts:106`; no handler anywhere | yes |
| window listeners (`keydown`, `keyup`, `blur`, `contextmenu`, `resize`, `error`) | `mouse_adapter.ts:115-125`, `pointer_wiring.ts:47-51`, `scene.ts:998`, `main.ts:80` | yes |
| the screen wake lock | `browser_guards.ts:96` | yes |
| the level change by `location.assign` (a history entry: the old page bfcache-eligible, its context with it) | `main.ts:97`, `screens.ts:62/147`, `level_end_ui.ts:61` | yes |
| `onBeforeRender` hooks (the stage, the boot animation, play) | `model_import.ts:353` | `Scene_2` only — die with the document |
| the `.glb`'s PNG object URL | the Babylon loader | `Scene_2` only — revoked |
| Workers, WASM, audio, video, `preserveDrawingBuffer` | none | none |

  The `.glb` (`Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb`) uses no glTF extension (no Draco, meshopt, KTX, transmission —
  so no opaque-scene render target); the glass is a BLEND PBR material. SSAO2 is never created (`scene_2.ts:84` `ambientOcclusion: false`,
  `model_import.ts:421`). The pick-up's outlines are `renderOutline` (stencil), not a HighlightLayer. No second canvas or context.

### 🔶 PROBABLE (fits every fact; NOT verified)

* **The trigger is `Scene_2`'s GPU WORK per frame, not its memory**: ≈ 245 meshes drawn in the shadow pass and in the main pass, 4 BLEND materials,
  PBR with the environment cube, **PCSS soft shadows** (`lighting.ts:70`, `softnessDeg: 25` in `scene_2.ts`) over a full 3× screen
  (1179×2556 on the phone); and at boot the **boot animation** (`boot_anim_wiring.ts`, `1.0.139-`) moves every part while `shadowsOn` = 2 (AUTO)
  still measures with the shadows FULL. ⭐ MEASURED (2026-11-16, headless, `?sceneIndex=3&shadowsOn=1`, 16 s after the boot, the scene at rest):
  **87 draws a frame into the shadow map, every frame** (73 to the screen) — the map is NOT drawn on events only in `Scene_2`
  (`lighting.ts` `shadowsOnDemand`: a caster's signature changes every frame); with the shadows off (`0`, or AUTO decided OFF): 0. Whether
  AUTO stays ON on the phone (a median frame under 33 ms) is read on its HUD's `frame` line (`shadows=auto → on` / `→ OFF`). iOS aborts
  GPU command buffers that run too long (a GPU timeout / reset); after a few such resets Safari's GPU process stops giving working WebGL contexts
  until it is restarted. ⚠ That WebKit policy, and the timeouts themselves, are NOT verified: desktop Chrome on SwiftShader has no iOS GPU process,
  no GPU watchdog, no jetsam, and never lost a context on its own (≈ 40 loads over four runs).

### ❓ OPEN

* Which `Scene_2` feature crosses the line (the bisect below), and whether the count of loads is constant (an accumulation in Safari's GPU
  process) or random (a single over-budget frame).
* The real MSAA sample count and shadow-map formats on the phone (the MB above are the desktop ledger's and estimates).

### ⛔ RULED OUT

* **The charts' code** (`chartLayout` / `chartCalm`, ON by default since `cb55778`): `git diff 510bbd8 c7ac510` touches no engine, canvas, render
  target, shadow, texture, boot or reload path; the boot cost the same switched on and off (`reload_probe3.mjs`: the first frame's long task ≈ 1.7 –
  2.0 s both ways on SwiftShader, the long tasks' total 7.2 s against 6.3 – 7.2 s).
* **A change of `Scene_0`'s GPU demand**: `git diff c9738e4 c7ac510` changes nothing in `scene_0.ts`, `scene_1.ts` (whose lighting it inherits) or
  the engine's creation; Babylon 7.54.3 at both; only the shadow maps' REDRAW changed (on events since `806579a` — less work, the same memory).
* **A stale bundle**: the black page printed the live build.
* **Our storage, the URL, the build gate's loop**: above.

## THE TEST ON THE PHONE (no deploy, no slider)

**What it decides.** Which feature of `Scene_2` makes Safari lose WebGL: each run switches ONE feature off and counts the loads until the black
screen. A run that never goes black names the feature; the fix is then chosen with the owner (`## The fix candidates`).

**No deploy and no slider are needed.** The owner (2026-11-16): *"Add the test in the md file. I will test later on. I need to modify the deploy
for each test because each reload uses default slider setting which i need to change for each test."* — the sliders are indeed lost at every
reload (nothing saves them), but the same settings can be written in the ADDRESS, and the address is read again at EVERY load. Verified at `c7ac510`:
* `src/render/scene.ts:116` — every boot builds the settings from `window.location.search` (`parseConfigOverrides`, `src/input/config_override.ts`);
  every NUMERIC setting of `src/input/gestureConfig.ts`'s defaults may be given there (`NUMERIC_KEYS`). `shadowsOn` accepts 0 (off), 1 (on),
  2 (auto, the default); `bootAnimOn` 0 or 1 (default 1); `modelStage` 0 (boot, the default) or 1 (final) — `validateGestureConfig`,
  `gestureConfig.ts:1139/1159/1165`. A wrong value is refused and SAID on the HUD (`⛔ name=value: …`), never applied silently.
* ⚠ **What each setting really does on `Scene_2`** (read at `c7ac510`, and measured 2026-11-16 by a headless run on the live site — draws per frame
  and screenshots, `?sceneIndex=3`, 16 s after the boot):
  * `shadowsOn` — `0` = the shadow LEVEL `PIECE` (`core/auto_shadow.ts` `shadowLevel`, `render/lighting.ts` `applyShadowLevel`): the scene's ONE
    light (`Key_softbox`) is the key light, so it keeps its shadow generator and its map, but the map's caster list becomes the ORBITED piece alone
    (a part picked up); every other part's cast shadow disappears and the map is no longer redrawn (measured: 0 draws a frame into it, against
    87 with `1`). ⚠ It does NOT remove: the soft-shadow (PCSS) SAMPLING in every receiving surface's shader (the light's shadows stay enabled), the
    shadow of the part in hand, and the **BAKED contact shadows** (the soft dark under and between the parts, written into the model's vertex
    colours — `model_import.ts` `applyContactShadows`; no switch acts on them). `1` = every part casts, the map redrawn every frame. `2` (the default,
    AUTO) = `1` while the device is measured (the first seconds — the boot animation's time), then `1` or `0` by the verdict. Nothing changes it
    after boot when it is `0` or `1`. **In force when** the HUD's `frame` line ends `shadows=off (the piece's shadow kept)` (or `shadows=on`).
  * `bootAnimOn=0` — the parts appear at once in their heaps: no pop, no fall (`boot_anim_wiring.ts:157`). **In force when** nothing falls at boot,
    and the HUD's model line has no `· boot animation N s`.
  * `modelStage=1` — the engine shown ASSEMBLED (every part at its goal) instead of the heaps; no boot animation then. **In force when** the engine
    stands whole on the table.
* **The HUD's `tuning` line shows what is in force**, e.g. `tuning sceneIndex=3 shadowsOn=0` (`hud_paint.ts:122`). Check it at EVERY load. (The
  line `⛔ v: not an overridable tunable` under it is harmless: the build check's marker — a side finding below.) If the HUD is folded, tap `HUD`.
* **Safari's reload button reloads the same address**, settings included. The build check's own reload (`main.ts`, `location.replace`) keeps them
  and adds `v=…`. The pause menu's *Restart* / *Quit*, the results' *Retry* / *Next* / *Level select* and the level menu also keep them
  (`core/game_route.ts`: `playHref` / `shellHref`, *"every other parameter kept"*) — ⚠ but for the test use **Safari's reload button only**: a
  level change is another kind of load (it keeps the old page in Safari's history) and would not be the same experiment.
* **Open the address in Safari itself**, typed, pasted or tapped from this file. A bookmark is fine if it holds the WHOLE address (check the
  `tuning` line). ⚠ Not a home-screen icon: it may open as a separate web app, outside Safari's state, which is not what is tested here.

**The steps** (one run = one address):
1. **Force-quit Safari** (swipe it away in the app switcher), then open it again — every run starts from a fresh Safari.
2. Open the run's address (below), in one tab, with no other tab of the game open.
3. Check the HUD's `tuning` line: the run's settings must be listed, none refused. Note the `build` line.
4. Wait until the scene has appeared (and, on `Scene_2`, the parts have fallen), then tap **Safari's reload button**. That is load 2.
5. Repeat step 4, counting the loads, until the screen is black (the HUD over a black view, or the message *"The render loop produced no frames"*).
6. If black: note the count, the HUD's `draw` and `frame` lines (a photo is enough). **Stop rule**: 15 loads without black = *"none in 15"*.
7. Force-quit Safari again before the next run.

**The runs, in this order** (each address on its own line):

Run A — the baseline (expected: black at about the 4th load):
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=3
```
Run A2 — the baseline again (is the count constant?):
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=3
```
Run B — the shadow map's draws removed (the parts cast no shadow; ⚠ the baked contact shadows stay, and the soft-shadow sampling still runs):
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&shadowsOn=0
```
Run C — no boot animation (no part moves at boot):
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&bootAnimOn=0
```
Run D — both:
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&shadowsOn=0&bootAnimOn=0
```
Run E — the final stage at boot (no heaps, no fall) — only if B – D leave a doubt:
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&modelStage=1
```
Run G — the WORST case, shadows forced on (every part casts, the map redrawn every frame) — black SOONER than A = the shadow work matters:
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&shadowsOn=1
```
Run F — the control, `Scene_0`, 20 loads (expected: never black):
```
https://dsug1.github.io/3d_assembly_game/?sceneIndex=0
```

**The results** (the owner fills it):

| Run | Address | Loads until black (or "none in 15") | `draw` and `frame` lines if black | Date | `build` |
|---|---|---|---|---|---|
| A | `?sceneIndex=3` | | | | |
| A2 | `?sceneIndex=3` | | | | |
| B | `?sceneIndex=3&shadowsOn=0` | ⚠ not counted yet — the owner (2026-11-16): *"https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&shadowsOn=0: : not working: the scene loads with the shadows on, not off"*: shadows still on the glass — the address does not remove them all (the note below) | | 2026-11-16 | `40c6325` |
| C | `?sceneIndex=3&bootAnimOn=0` | | | | |
| D | `?sceneIndex=3&shadowsOn=0&bootAnimOn=0` | | | | |
| E | `?sceneIndex=3&modelStage=1` | | | | |
| F | `?sceneIndex=0` (20 loads) | | | | |
| G | `?sceneIndex=3&shadowsOn=1` | | | | |

**The note on run B (2026-11-16).** The owner saw shadows with `&shadowsOn=0`. Read at `c7ac510` and run headless on the live site the same day,
the address DOES apply (the HUD: `tuning sceneIndex=3 shadowsOn=0`, `frame … shadows=off (the piece's shadow kept)`) and DOES remove the parts'
cast shadows and the map's per-frame draws (screenshots with `0` and `1` side by side: the cast shadows on the floor gone with `0`). What stays on
the glass with `0`, and reads as "shadows": the **baked contact shadows** (the soft dark under and between the parts, part of the model), the
shadow of a part once picked up — and, in the first seconds with the default AUTO, the full shadows while the device is measured. So `0` is NOT
"no shadows": it is "no cast shadows from the parts at rest". ⚠ Before counting run B, check on the phone that the `frame` line says
`shadows=off (the piece's shadow kept)`; if it says anything else, the address did not apply (retype it in Safari's address bar).

**How to read it.**
* A and A2 about equal (≈ 4) — the damage builds up load after load; A and A2 very different, or black at the 1st load — one frame too heavy.
* B "none in 15" — the shadow map's draws (≈ 245 meshes redrawn into it every frame) are the trigger. G sooner than A says the same.
* C "none in 15" — the boot animation is the trigger.
* D "none in 15" but neither B nor C — the two together.
* B, C or D with a HIGHER count than A but still black — that feature adds to the load, the rest of `Scene_2` too.
* B, C, D all black at about A's count — the trigger is in what NO address can switch off (below).
* F black — not `Scene_2` alone: back to the analysis (`## What is CERTAIN, PROBABLE, OPEN, RULED OUT`).

**What no address can switch off** — a test of these WOULD need a build (a setting added), to be decided with the owner then: the shadows
WHOLLY (no generator, no sampling — `shadowsOn=0` keeps the key light's map and its sampling), the soft shadows' shader itself (PCSS,
`lighting.ts:70`), the baked contact shadows, the HDR environment and its prefilter (`envIntensity=0` only dims it), the glass and the PBR materials, the
tone mapping, the device ratio (the 3× screen's full resolution), antialiasing (MSAA), the stencil. (`aoOn` does nothing on `Scene_2`: its contact
shadows are baked, no SSAO is built.)

### WHAT A TEST BUILD WOULD NEED — ⛔ NOT BUILT, the owner's decision

The owner: *"I need to modify the deploy for each test"*. With the switches below in ONE build, every test would be an address again — one deploy
for all of them. Each OFF by default (today's picture unchanged), each a numeric setting of `gestureConfig.ts` (so overridable from the address and
shown on the `tuning` line), each with its vector:
* **shadows truly off** — no shadow generator created, no surface receiving (no map, no sampling): e.g. `shadowsNone=1`;
* **PCF in place of PCSS** — the key light's soft shadows as plain PCF: e.g. `shadowsPcf=1`;
* **the baked contact shadows off** — e.g. `contactOff=1` (only to tell them apart on the glass; they cost nothing per frame);
* **a device-ratio cap** — the engine's `limitDeviceRatio`: e.g. `maxDeviceRatio=2` (or 1);
* **antialiasing off** — the context without MSAA: e.g. `msaaOff=1` (the engine is created with it, so it must be read before `new Engine`);
* (the boot animation already has `bootAnimOn=0`.)

## How to make it certain

**The bisect on the phone** → `## THE TEST ON THE PHONE` below (the procedure, the addresses, the results table).

**Safari's Web Inspector** (a Mac, the phone by cable, Safari › Develop › the phone › the page): the console's message at the loss (a GPU timeout,
or memory), the Timelines' graphics and memory, and whether a NEW context is created already lost.

**On the black page itself**: the end of the HUD's `draw` line (the buffer size the phone allocated; `→ 0×0` = dead) and, on `Scene_2` before the
black, the `frame` line (how slow its frames are on the phone).

## The fix candidates — ⛔ NONE BUILT

| Candidate | What it addresses | What changes on the glass | The owner's decision? |
|---|---|---|---|
| PCF in place of PCSS on phones (`lighting.ts:70`) | the heaviest per-pixel shader | harder shadow edges on the phone | yes (a look) |
| the shadows OFF during the boot animation, or AUTO measured after it | the shadow map redrawn every frame at boot | no shadows for the 1 – 2 s of the fall | yes |
| the shadow map really drawn on events in `Scene_2` (measured: redrawn EVERY frame at rest with shadows on — 87 draws a frame; find which caster's signature changes, `lighting.ts` `shadowsOnDemand`) | ≈ 245 meshes redrawn into the map each frame | none | no — a defect of `806579a`'s intent |
| a device-ratio cap (e.g. 2) and no MSAA on 3× screens (`scene.ts:106`, `limitDeviceRatio`) | ≈ 100 MB framebuffer, 2.25× the pixels shaded | a slightly softer image | yes (a look) |
| `Scene_2`'s static meshes merged or frozen (`freezeWorldMatrix`, merged by material) | ≈ 245 draws in two passes | none | no — but verify the pick-up and the outlines |
| the context released on `pagehide` (not `persisted`) and before the build gate's `location.replace` (`engine.dispose()` + `WEBGL_lose_context`) | GPU memory overlapping between two pages | none | no |
| a RECOVERY: lost and not restored after ≈ 2.5 s → ONE guarded reload (a marker on the URL, per build, like the gate's `v`), then a full-screen message: *"The browser lost the 3D view; close Safari (swipe it away) and reopen it"*, with a Reload button | the black page for ever | a reload, or the message | yes (the wording; whether to reload during play) |

⚠ **The recovery's trap**: this phone draws ONE frame before the loss (`frames 1`), so the retry marker must NOT be cleared at the first frame — only
after the page has drawn for a while (seconds) — or the guarded reload loops. The decision belongs in a pure function in `src/core` with its vectors
(lost / restored / waiting / marker of this build → message / marker of an older build → retry) and a source-reading vector pinning the wiring.
⚠ A reload loses the level in progress (nothing is saved); a rebuild in place is not an option (`createScene` has no teardown).

## Side findings (not fixed)

* The build gate's own marker is reported on the HUD as an error, `⛔ v: not an overridable tunable` (`input/config_override.ts:114` skips `cb`,
  `t`, `uiTheme` — not `v`) — misleading in every device report, in both screenshots.
* `draw … frames undefined` when the loop never ran: `st.frames = 0` is set at `scene.ts:980`, after the boot's `paint()`.
* `gl.getError()` on every HUD paint (`hud_paint.ts:70`): it swallows errors and is a synchronous round trip to Safari's GPU process.
* The "no frames" check (`main.ts`) fires ONCE at 1 s and its box is opaque, full-screen and never removed — it hides the HUD's `draw` line, and
  the scene even if frames come later.
* Babylon asks `powerPreference: "high-performance"` when it handles the context loss (harmless on iOS).

## The probes (`scripts/probes/gl/`)

Each loads the LIVE site in ONE headless Chrome with ONE profile (its TEMP inside it, removed in `finally`; `CHROME=…` to point at another
`chrome.exe`); `node scripts/probes/gl/<probe>.mjs out.json`, about a minute each; check `%TEMP%` afterwards. ⚠ The PC is shared: one run at a time.
* `reload_probe.mjs` — 15 loads of `?sceneIndex=0` at varied moments, a forced build gate, rapid reloads, a freeze/resume; per load the HUD lines,
  errors, the canvas centre's colour, the storage. Result (2026-11-16): all drew, storage `{}`; the freeze leaves the TAB hidden for later reloads
  (an artifact).
* `reload_probe2.mjs` — the artifact shown, and a synthetic `loseContext()`: the owner's HUD line, never recovered.
* `reload_probe3.mjs` — the boot cost with the charts' switches on and off: no difference.
* `gpu_ledger_probe.mjs` — the WebGL allocation ledger, `Scene_0` against `Scene_2` reloaded: the tables above.
