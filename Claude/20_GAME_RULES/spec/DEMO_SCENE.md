# DEMO_SCENE — a scene that assembles itself

> **STATUS** · 🔨 specified and built 2026-09-29 (`D170`, revised by `D171` the same day), ⛔ unjudged by a hand ·
> **OWNS** · what a demo scene is, how its disassembly is computed, how it plays, and `Scene1_demo`
> **READ IF** · you are making a demo from another scene, changing how moves are generated or played, or changing
> the demo's camera

> *"The demo scene uses a scene's final configuration. The final configuration is known (built and imported in the
> scene by the owner and defines the goal to complete the game level) · compute a series of 30 reverse-movements
> (unsnap, translation, rotation, etc.) which would disassemble the objects from the final configuration up to random
> positions in the scene. Each movement shall be the reverse of a movement do-able by the user (for example, an unsnap
> and estrangement of two aligned faces = reverse of a bringing closer and snap by the user). · Provide the resulting
> configuration (demo start configuration). · at the launch of the demo scene, the demo start configuration is
> displayed, and the 30 movements are performed one after the other to reach the final configuration. · the speed of
> the demo scene can be manually changed by a tuning slider so the complete demo can be adjusted to run between 10 s to
> 1 min (slider) · Then create a Scene_demo in World 0 based on the application of the specification to Scene_1."* ·
> *"the objects shall remain in a volume equivalent to a cube of half the largest dimension of the floor, centered on
> the camera orbit center at boot · the camera shall orbit uniformly towards the right and elevate gradually during the
> demo run up to reaching the highest elevation at the end of the demo"* — the owner, 2026-09-29 (`D170`)
>
> *"150 movements instead of 30 (I take the hypothesis 30 pieces, 5 movements each) · execute the change and redo the
> Scene_demo. Rename it Scene1_demo"* · *"when disassembling the final configuration, bring the pieces towards where
> the camera will be when the pieces are re-assembled: this way, each movement will be clearly visible during the demo
> run, and not occluded"* · *"set the camera zoom at demo start so that the full volume is seeable"* · *"gradually zoom
> out so that the zoom is the most out when the demo finishes"* · *"the final configuration shall be reached when the
> camera still has 15 degrees yaw to orbit. Then, the camera shall gradually slow its orbit to slerp its orbit into the
> final position at the end of the demo."* — the owner, 2026-09-29 (`D171`)

## 1. The idea

A **demo scene** is a level that plays itself: it opens on a scattered set of pieces and, move by move,
**assembles them into the level's final configuration** (`SceneDescriptor.final`, `D129`), while the camera circles
it, rises and draws back. It shows a player what the level asks for and what the moves look like.

⭐ The moves are computed **backwards**: starting from the assembled final configuration, a generator takes it apart
one move at a time, each step the exact **reverse of something a player can do**. Played forwards, the list is a
sequence of player moves that ends on the goal.

## 2. The moves — each the reverse of a player move

The plan stores the moves in PLAY order (forwards). The generator produces their reverses.

| played (forwards) | what a player does to make it | generated (backwards) | constraint on the move |
|---|---|---|---|
| **`SNAP`** | brings a face within capture of its Pioneer face; the snap lerps it home (`D100`) | **unsnap**: slide the piece off its seat along the seat face's normal, away from the Pioneer | a straight translation of `snapGap`, perpendicular to the seat face; ends in contact with its **Pioneer** (named in the move) |
| **`APPROACH`** | slides the aligned piece toward its seat (one finger, or Shift / second finger for gravity) | **estrange**: pull it CLEAR of the assembly | a straight translation along ONE world axis — horizontal (`±x`, `±z`) or gravity (`+y`); it must end `clearance` away from every other body |
| **`ALIGN`** | taps the Pioneer face while holding the piece: it turns to face it (`D87`/`D106`); the mate sets its spin (`D143`) | **unalign**: turn it away | a rotation about the piece's own centre; it ends in the piece's goal orientation |
| **`TRANSLATE`** | drags the piece (one finger / left drag) | a horizontal move to the scatter spot | a straight HORIZONTAL translation, orientation unchanged |
| **`LIFT`** | second finger / Shift + drag on gravity | a vertical move to a random height | a straight VERTICAL translation, orientation unchanged |
| **`YAW`** | spins it about gravity (second touch, `D123`) | a random spin | a rotation about the world vertical through the piece's centre |

⭐ **A piece's chain — 5 moves** (`D171`, *"30 pieces, 5 movements each"*): backwards `unsnap → estrange → unalign →
translate → (lift or yaw)`; played forwards `(yaw or lift) → translate → align → approach → snap`. So **150 moves take
30 of the 41 pieces out**; the other 11 start in place. ⛔ `ALIGN` is in every chain, so a `YAW` is always undone by one.
⚠ A kind that finds no free path after its tries is replaced by another (seed 1: one piece has a `LIFT` where its
`TRANSLATE` found no free path — 29 `TRANSLATE`s, 16 `LIFT`s, 15 `YAW`s).

⭐ **Which piece comes off next**: one that has a **seat it can leave** — a face in contact with a neighbour (the
Pioneer), overlapping it by at least `minContact`, such that sliding `snapGap` straight away from it collides with
nothing. On the painting that peels it from the edges inwards, and a piece whose neighbour has left becomes free.

⭐⭐ **Toward the camera that will watch it go back** (`D171`): every piece is taken apart toward where the camera will
be **when that piece is re-assembled** — so each move plays in front of the camera, not behind the assembly.
* The chain taken apart `k`-th plays as chain `K − 1 − k`; the camera then is at `demoYawAt(DEMO_MOVES_END × (K − ½ − k) / K)`
  (an estimate — the schedule weighs moves by travel; measured within 8° of the real one).
* **Estrange**: the world axes are tried **most camera-facing first** (it was always `−z`), each at 1×, 1.5× and 2× the range.
* **Scatter**: the `TRANSLATE` spot is drawn **on the camera's side**, at least `facing` (1.5 units) from the centre
  toward it, anywhere across — drawn in the camera's own frame.
* ✅ Measured on seed 1: the old `−z`-first rule sent **16 of 30** pieces out behind the assembly (worst: straight away,
  −1.00); now **1** runs slightly past square (−0.29), where every camera-facing axis was blocked. Every scatter spot is
  ≥ 1.57 toward the camera at its own time.
* ⚠ **What it does not remove**: sampled from the real camera path, **41 of 450** moments (9 %) have the moving piece's
  centre behind another body — almost all as a piece slides into its SLOT (`APPROACH`'s end, `SNAP`) while the camera
  sees the painting nearly edge-on, so its neighbours in the painting hide it. That is the camera path's, not the
  scatter's; §9.

## 3. What every move must satisfy — checked, and vectored

1. **No penetration along the whole path** — `core/collision.ts`'s own rule (`D136`: contact allowed, the skin is the
   tolerated depth), checked in segments of at most `segment` so a long move cannot tunnel; a rotation is checked
   along its own axis (`blendPlacement`), as the game's clamp is.
2. **Inside the demo volume at every step** — a CUBE whose side is **half the floor's largest dimension**, centred on
   the scene's **boot orbit centre**. For `Scene_1`: side 10 units (1 m), centred on `(0, 2.3, 0)` units — so
   `x, z ∈ [−5, 5]`, `y ∈ [−2.7, 7.3]` (the floor keeps every piece above `y = 0`). ⭐ The piece's whole box must fit.
   ⛔⛔ **Found by the second route**: checking only at segment ends let a TURNING piece's corner bulge **0.47 mm** past
   the wall between two checks (a corner sweeps an arc). ✅ Each check keeps `R (1 − cos(Δθ / 2))` inside the walls — the
   most an arc of that segment can bulge: exact, not sampled.
3. **Clear after the estrangement** (`D171`) — at least `clearance` from every other body. ⛔ Found at 150 moves: with
   `−z` crowded, a pull along `+y` slid a piece up INSIDE the painting's plane into a hole a removed piece had left —
   never clear, and with no room to turn, so generation failed.
4. **The shape of its kind** (table above).
5. ⭐ **Played forwards, the moves chain**: each move starts where the piece's previous move ended (or at the start
   configuration), and the last pose of every piece is its final pose.

⚠ A random choice that breaks 1–3 is **re-drawn** (the unalign's angles shrinking, then a turn about the axis the piece
was pulled along — which keeps it parallel to where it came from — then about the vertical). A generation that still
fails **throws** — it never ships a shorter or a colliding plan.

## 4. The numbers (authored units; `Scene_1`: 1 unit = 0.1 m)

| | value | why |
|---|---|---|
| moves | **150** (`D171`; 30 at `D170`) | the owner |
| chain | **5** moves per piece | the owner's hypothesis — 30 pieces |
| `snapGap` | **0.3** (3 cm) | inside the snap's reach at the boot camera (`captureOffsetMm` 10 mm on the glass ≈ 4 cm) |
| estrange | 1.0–1.6, up to 2× | clear of the painting's 0.33 depth |
| `clearance` | **0.15** | a piece pulled clear is not still in a hole of the assembly |
| `facing` | **1.5** | scatter spots in front of the assembly as the camera will see it |
| unalign | 30°–120° about a random axis, then smaller, then about the pull axis, then the vertical | |
| yaw | ±30°–150° | |
| `segment` / skin | 0.1 / 0.003 (0.3 mm, the game's skin) | |
| seed | **1** | the plan is deterministic: the same seed always gives the same plan |

## 5. The demo start configuration is DATA

⭐ The plan — the 150 moves and the start pose of every piece that moved — is **generated once by a script and
committed** (`src/content/scene1_demo_plan.ts`, 37 KB, by `scripts/gen_demo_plan.ts`, ~17 s), so it can be read,
reviewed and diffed. ⛔ A vector regenerates it and fails if the committed file differs.

⭐⭐ **And it is LOADED ONLY BY THE DEMO LEVEL** (`D173`, the owner, 2026-09-29: *"load the demo's move plan only in the
demo scene"*). The level carries a loader (`LevelSpec.demoPlan`, a dynamic `import()`), so the plan is its own file
(`scene1_demo_plan-….js`, 31.6 KB, **4.3 KB** compressed) fetched when `?sceneIndex=2` boots; `scene1_demo.ts` exports the
SHELL (every piece at its final pose, no plan), and `withDemoPlan` (`core/demo_plan.ts`) completes it once the plan has
arrived — `sceneReady` (`content/scenes.ts`) awaits it before `createScene`. ⛔ Nothing may import the plan
statically: `tests/d173.test.ts` reads the sources to hold that (one static import and the plan is back in every page
load, every other test green). ✅ Measured on the built site: `Scene_1` fetches no plan, the demo fetches it and plays
to `goal ✅  demo ✅`; the main script went 1,336 → 1,305 KB (334.7 → 329.4 KB compressed).

## 6. How it plays — the pieces

* **At launch** the start configuration is shown for a **1 s lead-in**, then the moves play **one after the other**,
  each eased in and out. The HUD's score line reads `demo 81/150 YAW Piece16 (23s)`, then `demo 150/150 — camera
  settling`, then `demo ✅` (and `goal ✅`).
* ⭐ **The speed slider**: SCENE › *demo duration (s)*, **10–60 s**, default **23 s** (`demoDurationS`; the owner, 2026-09-29 — 30 s, then 20 s) — the WHOLE run,
  from the first move to the camera's stop (the lead-in not counted). A move's share of the moves' time is
  proportional to `0.5 + √travel` (`travel` = distance + angle × the piece's half-diagonal). ⚠ With 150 moves a move
  takes **0.3 %–1.25 %** of the run: 0.07–0.29 s at the default 23 s, 0.03–0.12 s at 10 s, 0.17–0.75 s at 60 s. ⭐ Moving the slider mid-demo changes the
  SPEED from then on — nothing jumps.
* ⛔ **Nothing is pickable while it plays** (a demo is watched; a grip would fight the replay). The episode count stays 0.
* ⚠ **It is a replay of poses, not of gestures**: no alignment, cursor or seat is created, and no highlight is drawn.

## 7. How it plays — the camera (`D170`, `D171`)

* **Yaw**: it **orbits to the right** — one full turn. ⭐⭐ **The goal is reached with 15° of orbit LEFT**: the camera
  turns at a steady rate while the moves play (345°), then **slows uniformly to rest** over the last 15° — reaching the
  final yaw at zero speed as the demo ends, with no jolt where the moves end (the speed is continuous). Arriving at rest
  from the steady rate takes `2 × 15° / ω`, so the **moves take 345 / 375 = 92 % of the run** and the settling 8 %
  (`DEMO_MOVES_END`, `demoYawAt` in `core/demo_plan.ts` — the generator aims with the same law).
* **Elevation**: rises **linearly** from the boot elevation to the top of the rig (`v = 1`), reached at the end.
* **Zoom**: ⭐ at the start, the camera is placed at the **smallest distance at which the whole demo cube is on screen**
  — every corner inside the vertical AND the horizontal field of view, from the boot view, on this screen's aspect
  (`fitDistanceM`; a portrait tablet at fov 0.8: **2.25 m**). It then **draws back linearly to the rig's maximum**
  (`cameraRadiusMaxM`, 3 m), reached at the end. ⛔ A cube that cannot fit within the maximum is shown from the
  maximum. ⚠ The demo drives the zoom while it plays; the pinch and the wheel are the player's again at the end.
* ✅ Measured headless (Chrome, 882 × 1304, `demoDurationS=20`): the scattered pieces all on screen at the start
  (`r = 2.248 m`); at 88.6 % `demo 145/150 SNAP`, yaw 242°; at 94.5 % `camera settling`, 263°; 98.5 %, 269.4°; the end
  at exactly 270° (= −90° + 360°), `r = 3.00 m`, `elev = 1.00`, `goal ✅  demo ✅`.

## 8. `Scene1_demo` — the specification applied to `Scene_1`

* **World 0, `Level1_demo`** — *Demo — the painting*, after `Level_1`: `?sceneIndex=2`, or the SCENE slider.
  (`Scene_demo` / `Level_demo` at `D170`, renamed by `D171`.)
* `Scene_1`'s floor, lights, rig and final configuration; its pieces start at the plan's start poses (the 11 no move
  touches stay in the painting). `SceneDescriptor.demo` carries the plan once loaded (`D173`, §5).
* **The result, seed 1** — the pieces in PLAY order (the first one put back first): `Piece8, Piece32, Piece39,
  Piece15, Piece25, Piece35, Piece26, Piece7, Piece36, Piece10, Piece27, Piece24, Piece11, Piece6, Piece22, Piece2,
  Piece5, Piece40, Piece28, Piece3, Piece23, Piece9, Piece1, Piece37, Piece34, Piece16, Piece17, Piece14, Piece21,
  Piece4`. Every pose: `src/content/scene1_demo_plan.ts`.

## 9. For later

* **Occlusion by the assembly itself** (§2): 9 % of sampled moments hide the moving piece, mostly as it slides into
  its slot while the camera is edge-on. A camera that eases toward the face of the slot being filled — or a plan that
  puts pieces back while the camera faces the painting — would remove most of them.
* Draw the alignment highlights (HitFace, PioneerFace, the cursor) during `ALIGN` / `APPROACH` / `SNAP`.
* With 150 moves, 10 s is 0.03–0.12 s a move — too fast to read; the range may want to grow with the move count.
* Loop the demo, or end it on the level's own start. A demo generated at boot from a random seed.
* Pieces never in contact (free-standing parts) need a seat-free first move; the generator refuses them today.

## 10. ⭐ Why a scripted replay and not a recorded video (the owner asked: *"is it lighter to display a frame capture animation or to run the movements through a script and render the scene? (I am interested in portability and light weight)"*)

| | the scripted replay (built) | a recorded video |
|---|---|---|
| **download** | the plan is **4.3 KB** compressed (37 KB of text, 150 moves), fetched by the demo level alone (`D173`); the scene's code is already loaded | a 30 s clip is **~3–10 MB** (H.264/VP9, 720–1080p); a frame-by-frame capture far more |
| **fits the screen** | renders at the device's own size and aspect, portrait or landscape, sharp at any density — and the zoom fits the cube to THIS screen | fixed resolution and aspect; letterboxed or cropped, soft when scaled up |
| **follows the game** | a change to a piece, a colour, the lights or the plan shows at once; the slider changes its speed | re-record at every change; a speed change is only a playback rate |
| **interactive** | the level is live at its end | none |
| **cost on the device** | renders the scene like play does (`Scene_1` ran ~20–27 fps on the tablet with auto shadows) | only video decode — cheaper on a very weak GPU |
| **portability** | anywhere the game runs (a WebGL browser, the Capacitor wrapper) | anywhere, and also OUTSIDE the game (store page, social post) |

⭐ **For the game: the script** — lighter by two to three orders of magnitude, sharp everywhere, never stale. ⭐ **A
video is worth recording separately** for marketing (a store listing cannot run WebGL) — and it can be captured FROM
the scripted demo, so there is still one source.
