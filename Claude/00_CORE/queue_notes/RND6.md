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
5. 🔶 PROBABLE, NOT verified — the trigger is `Scene_2`'s GPU WORK per frame (245 meshes, PCSS soft shadows, PBR, the boot animation redrawing the shadow map every frame, at 3×) — iOS aborting GPU work that runs too long, and Safari then refusing WebGL until restarted.

**What to do next** (in this order — no fix before step 2 says which feature): (1) the phone bisect below (`## How to make it certain`), the owner
filling the empty results table; (2) if possible, Safari's Web Inspector from a Mac on the black page; (3) only then choose among the fix candidates
(`## The fix candidates`), with the owner.

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
  still measures with the shadows FULL — the shadow map, drawn on events (`lighting.ts` `shadowsOnDemand`), is then redrawn EVERY frame. iOS aborts
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

## How to make it certain

**The bisect on the phone** (the owner's method works): **force-quit Safari first**, open the URL, reload with Safari's button, waiting for the
scene each time, and COUNT the loads until black. The baseline: black at the **4th** load of `?sceneIndex=3`. Then one feature off at a time:

| # | URL | What it switches off | Loads until black (owner) |
|---|---|---|---|
| 0 | `https://dsug1.github.io/3d_assembly_game/?sceneIndex=3` | nothing — the baseline (expected ≈ 4) | |
| 0b | the same, again | is the count constant? | |
| 1 | `https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&bootAnimOn=0` | the boot animation (no part moves at boot: the shadow map drawn once) | |
| 2 | `https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&shadowsOn=0` | every shadow caster but the orbited piece (⚠ PCSS still sampled on the receivers) | |
| 3 | `https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&shadowsOn=0&bootAnimOn=0` | both | |
| 4 | `https://dsug1.github.io/3d_assembly_game/?sceneIndex=3&modelStage=1` | the heaps (the final stage at boot) | |
| 5 | `https://dsug1.github.io/3d_assembly_game/?sceneIndex=0` | `Scene_0` (expected: never black) | |

**Reading it.** A row that never goes black (say 20 loads) names its feature as the trigger. A roughly constant count that an override RAISES =
an accumulation per load (that feature's cost per load). Black at the first load or at random counts = a single over-budget frame. ⚠ **No URL
override exists** for: PCSS itself, the HDR environment and its prefilter (`envIntensity=0` only dims it — the cube is still built), the PBR / glass
materials, tone mapping, the device ratio, MSAA, the stencil. `aoOn` does nothing on `Scene_2` (no SSAO is built). Optional rows in the same
minutes: a 30 s pause between reloads (a higher count = a teardown that lags); the level changed by the pause menu instead of Safari's reload button
(a lower count = back/forward-cached pages holding their context).

**Safari's Web Inspector** (a Mac, the phone by cable, Safari › Develop › the phone › the page): the console's message at the loss (a GPU timeout,
or memory), the Timelines' graphics and memory, and whether a NEW context is created already lost.

**On the black page itself**: the end of the HUD's `draw` line (the buffer size the phone allocated; `→ 0×0` = dead) and, on `Scene_2` before the
black, the `frame` line (how slow its frames are on the phone).

## The fix candidates — ⛔ NONE BUILT

| Candidate | What it addresses | What changes on the glass | The owner's decision? |
|---|---|---|---|
| PCF in place of PCSS on phones (`lighting.ts:70`) | the heaviest per-pixel shader | harder shadow edges on the phone | yes (a look) |
| the shadows OFF during the boot animation, or AUTO measured after it | the shadow map redrawn every frame at boot | no shadows for the 1 – 2 s of the fall | yes |
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
