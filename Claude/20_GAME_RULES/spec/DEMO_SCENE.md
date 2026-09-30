# DEMO_SCENE — a scene that assembles itself

> **STATUS** · 🔨 specified and built 2026-09-29 (`D170`, revised by `D171` the same day; ⭐ the start is a floor grid
> since `D174`, 2026-09-30; lengthwise, the camera 15° earlier, `D175`; in two interlocking rows, `D176`; a natural feel, `D177`, the same day), ⛔ unjudged by a hand ·
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
>
> *"in the demo scene, change the specification: the parts in the start configuration shall be all aligned with the
> floor, set on the fllor on a virtual grid (do not show any grid), ordered by color and inside the collor groups by
> descending size. Once lifted,each part shall reach a position which blends into the current build (piece position
> matching camera orbit movement not to occlude the movement)"* — and, asked: which pieces → *"only the 30 moved"*;
> where → *"in front, just outside the demo cube"*; size → *"volume"* — the owner, 2026-09-30 (`D174`)
>
> *"when they sit on the floor at the start, the parts shall present their longest dimension towards the depth axis and
> their bottom surfaces on depth axis shall be aligned on x axis. Also, start the camera 15degrees orbit yaw before
> current start camera position"* — the owner, 2026-09-30 (`D175`)
>
> *"make two or three rows of parts instead of one unique row. If required to fit the parts, reverse the order of
> alignment along longest dimension every second row. The rows do not need to be justified"* — the owner, 2026-09-30
> (`D176`)
>
> *"randomly roll the parts when they are laid on the floor at start by up to 1.5 degrees negative or positive to give
> a natural feel. Also, randomly misalign the face facing camera by up to 1 pixel negative or positive in depth axis"* —
> then *"I was meaning yaw, not roll"* — the owner, 2026-09-30 (`D177`)

## 1. The idea

A **demo scene** is a level that plays itself: it opens on the pieces laid out on the floor (`D174`; scattered in the
air before) and, move by move,
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
| **`ALIGN`** | taps the Pioneer face while holding the piece: it turns to face it (`D87`/`D106`); the mate sets its spin (`D143`) | **unalign**: lay it FLAT (`D174`) | a rotation about the piece's own centre, from lying flat to the piece's goal orientation |
| **`TRANSLATE`** | drags the piece — one finger, and the second at once for gravity (`D43`: they sum) | **the carry** (`D174`): from the spot in front of its slot to above its grid cell | straight legs, orientation unchanged — ONE leg, or up / across / down OVER the build (`via`) |
| **`LIFT`** | second finger / Shift + drag on gravity | **the lowering** (`D174`): straight down onto its grid cell | a straight VERTICAL translation, orientation unchanged |

⛔ `YAW` is **deleted** (`D174`): it spun a piece in the air at its scatter spot, and there is no scatter spot now.

⭐⭐ **A piece's chain — 5 moves, always the same** (`D171`'s *"30 pieces, 5 movements each"*; the order `D174`'s):
played forwards **`LIFT → TRANSLATE → ALIGN → APPROACH → SNAP`** — *lifted* off the grid, carried to the spot in front
of its slot, turned upright there, slid in, seated. Backwards: unsnap → estrange → lay flat → carry to the cell →
lower. So **150 moves take 30 of the 41 pieces out**; the other 11 stay in the painting — the seed of the build.
⛔ A piece that already lies flat in the painting (a horizontal bar, a flat white piece) is laid down a **half-turn**
away (`D130`: a box's face or its opposite is its goal all the same), so its `ALIGN` is a real turn — found by the
shape vector: 11 of the first plan's `ALIGN`s turned by 0°, empty moves. Seed 1: every `ALIGN` turns 90°–180°.

⭐⭐ *"Once lifted, each part shall reach a position which blends into the current build"* — read as **three rules**,
all vectored (`tests/d174.test.ts`):
1. **It joins the build**: every `SNAP` seats the piece against a Pioneer **already in place** — one of the 11, or a
   piece seated before it — never onto a gap. The build grows by contact, from its seed (the peeling order guarantees
   it; the vector checks it on the plan).
2. **It arrives where the camera is** (*"matching camera orbit movement not to occlude the movement"*): the spot the
   carry ends on is out from its slot **toward the camera at the moment it goes back** (`D171`'s rule, below), so it
   turns and slides in on the side being watched, not behind the assembly.
3. **The build's own moves stay in the cube** (`ALIGN`, `APPROACH`, `SNAP`); only the lift and the carry reach over
   the grid.

⚠ The carry is the long move — **4.3 to 14.9 units** (`D176`; 7.5–16.8 at `D175`) — and while the camera is on the grid's
side it crosses in front of it, from the floor to the spot before its slot. **8 of 30 go OVER the build** (played
forwards: up from the cell to a height above the painting, across, and straight down onto the spot) — every piece put
back while the camera is behind the painting, where its spot is, and a few others. ⭐ `D175`: **one** of them ends with
a level step IN to its spot — a piece laid lengthwise beside the painting's edge cannot come straight down onto it,
the painting's side column is over it; the generator tries a step of 1–3 units out first (found by the generator).

⭐ **Which piece comes off next**: one that has a **seat it can leave** — a face in contact with a neighbour (the
Pioneer), overlapping it by at least `minContact`, such that sliding `snapGap` straight away from it collides with
nothing. On the painting that peels it from the edges inwards, and a piece whose neighbour has left becomes free.

⭐⭐ **Toward the camera that will watch it go back** (`D171`): every piece is taken apart toward where the camera will
be **when that piece is re-assembled** — so each move plays in front of the camera, not behind the assembly.
* The chain taken apart `k`-th plays as chain `K − 1 − k`; the camera then is at `demoYawAt(DEMO_MOVES_END × (K − ½ − k) / K)`
  (an estimate — the schedule weighs moves by travel; measured within 8° of the real one).
* **Estrange**: the world axes are tried **most camera-facing first** (it was always `−z`), each at 1×, 1.5×, 2×
  (`D174`: and 2.5×, 3×) the range — the spot is where the carry ENDS and the piece turns upright (`D174`).
* ⛔ **Scatter** (a spot on the camera's side, at least `facing` 1.5 units out) — **deleted by `D174`** with the
  scatter itself: the pieces start on the grid.
* ✅ Measured on seed 1: the old `−z`-first rule sent **16 of 30** pieces out behind the assembly (worst: straight away,
  −1.00); `D171`'s plan **1**, slightly past square (−0.29); `D174`'s **1**, exactly across the view (−0.00); `D175`'s
  worst −0.15 (9° past square); `D176`'s −0.14.
* ⚠ **What it does not remove**: sampled from the real camera path, **41 of 450** moments (9 %) had the moving piece's
  centre behind another body in `D171`'s plan. ⭐ `D174`, re-measured with one instrument for both (`D171`'s plan reads
  46 on it, 10.2 %): **38 of 450 (8.4 %)** — 29 of them `SNAP`s, the last 3 cm into a slot while the camera sees the
  painting nearly edge-on and the slot's neighbours hide it; 6 `LIFT`s off the grid behind a piece of the build.
  ⚠ The instrument recomputes the camera from the playback's own laws; it is not the product's frame. §9.

## 2bis. ⭐⭐⭐ The start configuration — a floor grid (`D174`)

* **Flat** (*"aligned with the floor"*): each piece rests on its **largest face** — its smallest side vertical, ⭐
  **its longest along DEPTH, world `z`** (`D175`; along `x` at `D174`), its middle one along `x`, square to the floor's
  axes, its bottom face ON the floor (contact, `D136`). Of the four orientations that do that (the half-turns), the one nearest its final orientation that is not
  the final one itself (above).
* **Where** (*"in front, just outside the demo cube"*): on the boot camera's side (`−z`), in the strip between the
  floor's edge and the cube — ~4.65–4.93 units deep, and the longest pieces are 4.83.
* ⭐⭐⭐ **TWO ROWS THAT INTERLOCK** (`D176`; one rank at `D175`, 18.25 units wide):
  * **row 1**, left to right: its pieces' NEAR ends (lowest `z`, toward the boot camera) flush on one line parallel to
    `x` — `D175`'s *"bottom surfaces … aligned on x axis"* — half a gutter in from the floor's edge (`z −9.95`);
  * **row 2**, the order continuing **right to left**, its alignment REVERSED (*"reverse the order of alignment along
    longest dimension every second row"*): its FAR ends flush on a line **3 cm** outside the cube (`z −5.30`,
    `gridOffset`), its pieces reaching back toward the camera;
  * **they share the strip**: each row-2 piece is slid from where the one before ended to the first place where it
    clears row 1 by a gutter — a long piece of one row stands opposite short ones of the other; the 4.83-unit bars
    face a gap. So the rows are ragged at both ends (*"do not need to be justified"*);
  * **the split** between the rows is the one that makes the whole narrowest; the whole is centred across the cube.
  * ⚠ **Two, not three**: a third row cannot interlock — it would share row 1's line (the strip has two ends, not
    three). Measured, two rows already fit the cube's own width.
  * ⚠ Reading *"reverse the order of alignment"* as BOTH the end that is flush and the direction the row runs (a
    snake): the direction is what puts row 2's largest piece opposite row 1's smallest. Either is one choice in
    `demoGrid`.
* ⭐⭐ **A NATURAL FEEL** (`D177`) — each piece on the grid, drawn from the seed and the piece (`naturalOf`, its own
  random stream, so it does not depend on which pieces come off):
  * **a yaw** about the vertical of up to **±1.5°** (`startYawDeg`) — it stays flat on the floor. ⛔ First built as a
    ROLL about depth (the project's own sense of *roll*) and corrected by the owner before it shipped;
  * **a shift along depth** of up to **±1 pixel** (`startJitter`), so the face toward the camera sits off its row's
    line. ⚠ A pixel is a size on the glass and the plan is fixed data: it is fixed at what one CSS pixel covers AT THE
    GRID in the start view on the reference tablet (882 × 1304 portrait, fov 0.8, ~2.15 m away) — **1.4 mm, 0.014
    units**; on another screen, a little more or less than a pixel;
  * **the gutters stay whole**: each cell is widened by the piece's length × sin 1.5°, and the rows keep a gutter plus
    both pieces' corner swing and jitter apart. So the rows widen to **10.95 units** (`x −5.45 → 5.50`);
  * the piece is turned straight into that pose at its spot before the building (its `ALIGN` ends in it), so the
    carry and the lift keep one orientation all the way down.
* **The order** (*"ordered by color and inside the color groups by descending size"*): **white, black, yellow, red,
  blue** — the painting's slot order, `MAT_A`–`MAT_E` (`SCENE1_DEMO_OPTIONS`) — each group by the CORE's **volume**,
  largest first (ties: the table's order). ⭐ In **reading order as the boot camera sees it**: row 1 left to right (`+x`,
  the camera's right), then row 2 right to left (`D176`).
* **The grid** (*"a virtual grid"*): a **5 mm** pitch (`gridPitch` 0.05); a piece takes a whole number of cells ACROSS
  — its width and a **1 cm** gutter (`gridGap` 0.1) — and sits at their middle; the line is on the pitch too.
  ⛔ **Nothing is drawn** — the demo scene has exactly `Scene_1`'s bodies (a vector).
* ⭐⭐ **Measured, seed 1**: the two rows span **`x −4.95 → 5.00`** — the cube's own width (`D175`'s one rank: 18.25
  units); row 1 has 16 pieces, row 2 has 14. ⛔ A grid that would leave the floor, or a piece that would reach into the
  cube from the floor's edge, **throws**. ⛔ `gridWidth` is deleted (`D175`).
* **Seed 1** — row 1, left to right: white Piece9, Piece4, Piece8, Piece15, Piece11, Piece14, Piece20, Piece1, Piece5,
  Piece16; black Piece32 (4.83), Piece27, Piece35, Piece39, Piece22, Piece26. Row 2, right to left: black Piece25,
  Piece34, Piece37, Piece23, Piece24, Piece28, Piece36, Piece40; yellow Piece17, Piece6; red Piece2, Piece21, Piece7;
  blue Piece10 (the largest, at the far left, opposite row 1's shortest whites). ⚠ `D175`'s set (laying pieces
  lengthwise changed which spots let them lie down, so the peeling drew other pieces than `D174`'s).

### 2ter. How it is generated — three phases

The grid's ORDER depends on WHICH pieces come off, known only once they have — so `generateDemoPlan` runs:
* **A — who, and how each leaves**, inside the cube: an unsnap off a seat, an estrangement toward the camera (at 1× to
  **3×** the range now: a piece must have room to lie down there), and the turn to lie flat. The piece is then parked
  far away.
* **B — the grid** for that set (`demoGrid`).
* **C — the replay**: A's three steps again (the grid is outside the cube and A's steps inside it, so a piece already
  lying on the grid cannot block one — a refusal there throws as a defect), then the carry and the lowering. The carry
  tries, in order: straight to just above the cell; straight at the spot's own height; then **over the build** at
  rising heights.

## 3. What every move must satisfy — checked, and vectored

1. **No penetration along the whole path** — `core/collision.ts`'s own rule (`D136`: contact allowed, the skin is the
   tolerated depth), checked in segments of at most `segment` so a long move cannot tunnel; a rotation is checked
   along its own axis (`blendPlacement`), as the game's clamp is.
2. **Inside the demo volume at every step** — a CUBE whose side is **half the floor's largest dimension**, centred on
   the scene's **boot orbit centre**. For `Scene_1`: side 10 units (1 m), centred on `(0, 2.3, 0)` units — so
   `x, z ∈ [−5, 5]`, `y ∈ [−2.7, 7.3]` (the floor keeps every piece above `y = 0`). ⭐ The piece's whole box must fit.
   ⭐ `D174`: the owner put the grid just OUTSIDE the cube, so the lift and the carry may also reach over it — the
   **reach** is the cube extended toward the camera over the grid (`demoReach`: `z` from −8.65); the build's own
   moves (`ALIGN`, `APPROACH`, `SNAP`) stay in the cube (a vector).
   ⛔⛔ **Found by the second route**: checking only at segment ends let a TURNING piece's corner bulge **0.47 mm** past
   the wall between two checks (a corner sweeps an arc). ✅ Each check keeps `R (1 − cos(Δθ / 2))` inside the walls — the
   most an arc of that segment can bulge: exact, not sampled.
3. **Clear after the estrangement** (`D171`) — at least `clearance` from every other body. ⛔ Found at 150 moves: with
   `−z` crowded, a pull along `+y` slid a piece up INSIDE the painting's plane into a hole a removed piece had left —
   never clear, and with no room to turn, so generation failed.
4. **The shape of its kind** (table above).
5. ⭐ **Played forwards, the moves chain**: each move starts where the piece's previous move ended (or at the start
   configuration), and the last pose of every piece is its final pose.

⚠ A random choice that breaks 1–3 is **re-drawn** (`D174`: a farther estrangement spot, another of the four flat
orientations, a higher carry). A generation that still fails **throws** — it never ships a shorter or a colliding plan.
⚠ Found: in a side-6 cube (a 12-unit floor) a piece put back from behind has no room to be carried over the painting,
and the generation throws — the tighter-cube vector uses side 7. A carry AROUND the painting is §9.

## 4. The numbers (authored units; `Scene_1`: 1 unit = 0.1 m)

| | value | why |
|---|---|---|
| moves | **150** (`D171`; 30 at `D170`) | the owner |
| chain | **5** moves per piece | the owner's hypothesis — 30 pieces |
| `snapGap` | **0.3** (3 cm) | inside the snap's reach at the boot camera (`captureOffsetMm` 10 mm on the glass ≈ 4 cm) |
| estrange | 1.0–1.6, up to 3× (`D174`; 2× before) | clear of the painting's 0.33 depth, and room to lie down |
| `clearance` | **0.15** | a piece pulled clear is not still in a hole of the assembly; ⭐ `D174`: the carry's lowest height clears the grid by it |
| `gridPitch` / `gridGap` / `gridOffset` | **0.05 / 0.1 / 0.3** (5 mm / 1 cm / 3 cm) | `D174` — a virtual grid, a gutter, just outside the cube (`D175`: when the floor allows) |
| ⛔ `gridWidth` | deleted (`D175`) | one rank, as wide as the pieces |
| camera start | **15° before** the boot yaw (`D175`) | the orbit is 375°, ending where it did |
| `startYawDeg` / `startJitter` | **±1.5° / ±0.014** (1 pixel, 1.4 mm) | `D177` — a natural feel on the grid |
| colour order | white, black, yellow, red, blue | `D174`, `SCENE1_DEMO_OPTIONS` |
| ⛔ `facing`, unalign angles, yaw | deleted (`D174`) | they went with the scatter |
| `segment` / skin | 0.1 / 0.003 (0.3 mm, the game's skin) | |
| seed | **1** | the plan is deterministic: the same seed always gives the same plan |

## 5. The demo start configuration is DATA

⭐ The plan — the 150 moves and the start pose of every piece that moved — is **generated once by a script and
committed** (`src/content/scene1_demo_plan.ts`, 33.5 KB since `D175` — 3.6 KB compressed — by `scripts/gen_demo_plan.ts`, ~45 s), so it can be read,
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
  each eased in and out — ⭐ a carry over the build eased along its whole path, at one speed through its corners
  (`alongPath`). The HUD's score line reads `demo 81/150 LIFT Piece16 (23s)`, then `demo 150/150 — camera
  settling`, then `demo ✅` (and `goal ✅`).
* ⭐ **The speed slider**: SCENE › *demo duration (s)*, **10–60 s**, default **23 s** (`demoDurationS`; the owner, 2026-09-29 — 30 s, then 20 s) — the WHOLE run,
  from the first move to the camera's stop (the lead-in not counted). A move's share of the moves' time is
  proportional to `0.5 + √travel` (`travel` = distance + angle × the piece's half-diagonal). ⚠ With 150 moves a move
  takes **0.37 %–1.53 %** of the moves' time (`D176`; 0.3–1.25 % at `D171`): 0.08–0.32 s at the default 23 s, 0.03–0.14 s at 10 s, 0.2–0.85 s at 60 s. ⭐ Moving the slider mid-demo changes the
  SPEED from then on — nothing jumps.
* ⛔ **Nothing is pickable while it plays** (a demo is watched; a grip would fight the replay). The episode count stays 0.
* ⚠ **It is a replay of poses, not of gestures**: no alignment, cursor or seat is created, and no highlight is drawn.

## 7. How it plays — the camera (`D170`, `D171`, `D174`)

* **Yaw**: it **orbits to the right**. ⭐⭐ `D175`: it **STARTS 15° before the boot yaw** (to the left) and still ENDS
  where it did — the boot yaw a turn on, the level's own front view — so it turns **375°** (`DEMO_START_BEFORE_DEG`).
  ⚠ Kept the end, not the whole path, because the end is where the player takes over; shifting the whole orbit is one
  constant. ⭐⭐ **The goal is reached with 15° of orbit LEFT**: the camera turns at a steady rate while the moves play
  (360°), then **slows uniformly to rest** over the last 15° — reaching the final yaw at zero speed as the demo ends, with
  no jolt where the moves end (the speed is continuous). Arriving at rest from the steady rate takes `2 × 15° / ω`, so
  the **moves take 360 / 390 = 92.3 % of the run** (345 / 375 before `D175`) and the settling the rest
  (`DEMO_MOVES_END`, `demoYawAt` in `core/demo_plan.ts` — the generator aims with the same law).
* **Elevation**: rises **linearly** from the boot elevation to the top of the rig (`v = 1`), reached at the end.
* **Zoom**: ⭐ at the start, the camera is placed at the **smallest distance at which the whole demo cube is on screen**
  — every corner inside the vertical AND the horizontal field of view, from the boot view, on this screen's aspect
  (a portrait tablet at fov 0.8: **2.25 m**). ⭐ `D174`: **and the floor grid** — the start configuration, off-centre
  toward the camera (`demoFramePointsM`, `fitPointsDistanceM`), from the demo's START yaw (`D175`).
  ⚠⚠ **In portrait it is still slightly too wide**: the two rows need **3.59 m** on the tablet's 882 × 1304 (`D177`; 3.43
  at `D176`, `D175`'s one rank 4.73 m) and the camera is held at the rig's **3 m** maximum — so at the start, in
  portrait, the outer ends of the rows are cut (landscape 1304 × 882: **2.09 m**, all in view). §9. It then **draws back linearly to the rig's maximum**
  (`cameraRadiusMaxM`, 3 m), reached at the end. ⛔ A cube that cannot fit within the maximum is shown from the
  maximum. ⚠ The demo drives the zoom while it plays; the pinch and the wheel are the player's again at the end.
* ✅ Measured headless (`D171`; Chrome, 882 × 1304, `demoDurationS=20`): the scattered pieces all on screen at the start
  (`r = 2.248 m`); at 88.6 % `demo 145/150 SNAP`, yaw 242°; at 94.5 % `camera settling`, 263°; 98.5 %, 269.4°; the end
  at exactly 270° (= −90° + 360°), `r = 3.00 m`, `elev = 1.00`, `goal ✅  demo ✅`.
* ✅ `D174`, headless (Chrome, SwiftShader, 882 × 1304, the built site): the start shows the 11 standing and the 30 on
  the floor, the grid whole in frame at `r = 2.50 m`. ⚠ **Seen from the boot view the grid is nearly EDGE-ON**: the
  camera boots level, 23 cm above the floor, so a piece 3.3 cm thick reads as a strip and the rows behind the first are
  mostly hidden. The order reads left to right; the rows do not. §9.

## 8. `Scene1_demo` — the specification applied to `Scene_1`

* **World 0, `Level1_demo`** — *Demo — the painting*, after `Level_1`: `?sceneIndex=2`, or the SCENE slider.
  (`Scene_demo` / `Level_demo` at `D170`, renamed by `D171`.)
* `Scene_1`'s floor, lights, rig and final configuration; its pieces start at the plan's start poses — the 30 on the
  floor grid (`D174`), the 11 no move touches in the painting. `SceneDescriptor.demo` carries the plan once loaded
  (`D173`, §5).
* **The result, seed 1** (`D175`) — the pieces in PLAY order (the first one put back first): `Piece20, Piece8,
  Piece35, Piece17, Piece26, Piece15, Piece39, Piece10, Piece32, Piece6, Piece9, Piece37, Piece28, Piece24, Piece7,
  Piece27, Piece4, Piece23, Piece16, Piece14, Piece2, Piece21, Piece22, Piece11, Piece1, Piece5, Piece40, Piece25,
  Piece34, Piece36`; the rank's order is §2bis. Every pose: `src/content/scene1_demo_plan.ts`.

## 9. For later

* **Occlusion by the assembly itself** (§2): 8.4 % of sampled moments hide the moving piece (`D174`; 10.2 % on the same
  instrument before), mostly the `SNAP` into a slot while the camera is edge-on. A camera that eases toward the face of
  the slot being filled — or a plan that puts pieces back while the camera faces the painting — would remove most.
* ⚠ **The rows' ends cut in portrait at the start** (`D175`–`D177`, §7: 3.59 m needed, 3 m allowed): a start distance past the rig's maximum (the zoom then
  drawing IN to 3 m, which reverses `D171`'s *"the most out when the demo finishes"*), a wider field of view for the
  demo, or fewer pieces on the floor. The owner's to choose.
* ⚠ The occlusion count (§2) was measured on `D174`'s plan and not re-measured for `D175`/`D176`.
* ⭐ **The grid seen edge-on at the start** (`D174`, §7): a demo that boots a little higher (not `LEVEL`) would show the
  rows; the elevation still rises to the top by the end. ⛔ Not changed: the boot view is `Scene_1`'s, the owner's.
* **A carry AROUND the painting** (§3): a cube barely taller than the painting leaves no room to carry a piece over it.
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
