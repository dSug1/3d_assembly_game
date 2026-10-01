# DEMO_SCENE — a scene that assembles itself

> **STATUS** · 🔨 specified and built 2026-09-29 (`D170`, revised by `D171` the same day; ⭐ the start is a floor grid
> since `D174`, 2026-09-30; lengthwise, the camera 15° earlier, `D175`; in two interlocking rows, `D176`; a natural feel, `D177`, made bolder, `D178`, then a median law, `D179`, the same day); ⭐⭐ **the start is SMALL HEAPS, ONE PER COLOUR, since `D191`** (2026-09-30, §2bis — the grid is §2quater, the record), ⭐ three pieces stacked at most and the camera 50° earlier, `D192` (2026-10-01), the stack counted from above, `D193`, and up its support chain too, `D194`, ⛔ unjudged by a hand ·
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
>
> *"random between 5 to 10 degrees negative or positive yaw, random between 5 to 10% of longest dimension of each part
> negative or positive for part misalignment on depth for the row alignments"* — the owner, 2026-09-30 (`D178`)
>
> *"random between 0 to 4 degrees negative or positive yaw absolute value median 2.5 degrees, random between 0 to 5 % of
> longest dimension of each part negative or positive for part misalignment on depth for the row alignments, absolute
> value median 3%"* — the owner, 2026-09-30 (`D179`)
>
> *"modify the specification so that the start configuration is small heaps one per color (E. in the artefact). Make
> sure that the parts are disassembled and added to the heap in the correct order so later they can be reassembled
> without colliding with any when they are picked from the heap. pieces in the heap can lay on top of each other at
> different elevations (for example one end on floor and one end on top of another piece) which creates natural
> rotation of the piece (same as what is shown for the longest black piece in the artefact E.). rebuild the demo scene.
> deploy"* — the owner, 2026-09-30 (`D191`), after ten layouts were proposed as snapshots (E: *small heaps, one per
> colour*)
>
> *"limit the heaps height to max three pieces stacked on top of each other"* · *"camera should start from current from
> 50degrees yaw to the left. Therefore, total yaw rotation of the camera during demo = 410 degrees"* — the owner,
> 2026-10-01 (`D192`) · *"There are more than 3 pieces stacked in the white heap"* — the owner, on the deployed build
> (`D193`) · *"There is something wrong. The white heap is still more than 3 pieces stacked: 4 pieces are stacked and one
> piece is leaning on three stacked. This is the second time you are breaking the rule i gave you"* — the owner, on the
> deployed `D193` build (`D194`)

## 1. The idea

A **demo scene** is a level that plays itself: it opens on the pieces in small heaps on the floor (`D191`; a floor grid
at `D174`, scattered in the air before) and, move by move,
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
| **`ALIGN`** | taps the Pioneer face while holding the piece: it turns to face it (`D87`/`D106`); the mate sets its spin (`D143`) | **unalign**: turn it into its HEAP pose (`D191`; flat at `D174`) | a rotation about the piece's own centre, from its heap pose to the piece's goal orientation |
| **`TRANSLATE`** | drags the piece — one finger, and the second at once for gravity (`D43`: they sum) | **the carry** (`D174`): from the spot in front of its slot to above its place on its heap (`D191`) | straight legs, orientation unchanged — ONE leg, or up / across / down OVER the build (`via`) |
| **`LIFT`** | second finger / Shift + drag on gravity | **the lowering** (`D174`): straight down onto its heap (`D191`) | a straight VERTICAL translation, orientation unchanged |

⛔ `YAW` is **deleted** (`D174`): it spun a piece in the air at its scatter spot, and there is no scatter spot now.

⭐⭐ **A piece's chain — 5 moves, always the same** (`D171`'s *"30 pieces, 5 movements each"*; the order `D174`'s):
played forwards **`LIFT → TRANSLATE → ALIGN → APPROACH → SNAP`** — *lifted* off its heap (`D191`), carried to the spot
in front of its slot, turned upright there, slid in, seated. Backwards: unsnap → estrange → turn into its heap pose →
carry above its heap → lower onto it. So **150 moves take 30 of the 41 pieces out**; the other 11 stay in the painting — the seed of the build.
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
   the heaps.

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

## 2bis. ⭐⭐⭐ The start configuration — small HEAPS, one per colour (`D191`, ⛔ unjudged by a hand)

* **One heap per colour** (`demoHeaps`), left to right as the boot camera sees them, in `colourOrder` — white, black,
  yellow, red, blue, for the colours the 30 include — in the strip between the floor's edge (5 mm in) and the cube
  (3 cm out, `heapStrip`). A heap is `1.2 × √(its pieces' flat area) + 3 cm` wide, 4 cm from the next, the row centred
  on the cube.
* **Dropped, not placed** (`settle`): a piece falls straight down, face-down flat, at a spot drawn around its heap's
  centre (σ = 15 % of the heap's width across, 5 cm in depth), at any yaw; it is tried at every tilt about its WIDTH
  (±40°, 2.5° steps) and its LENGTH (±6°, 2° steps), comes down at each until it first touches the floor or a piece
  already there (the game's own collision rule, `D136`), and the tilt whose CENTRE ends lowest wins — refined to 0.1°.
  So it lies flat on the floor, flat on a piece, or LEANS: *"one end on floor and one end on top of another piece"*.
  ⛔ Found by the vectors: on the coarse steps a leaning piece stopped 11 mm short of its support (hence the
  refinement), and the drop stops a SKIN (0.3 mm) deep in what holds it — it rests a skin higher, touching.
* ⭐⭐ **A REST THAT HOLDS**: a landing is kept only if a small turn about its centre, either way about its width and
  either way about its length, presses into something. ⛔ Found by the vectors: the lowest landing at a fixed centre is
  not physics — a piece balanced on one edge of another, its other half over nothing, would tip. ⭐ When the lowest
  landing does not hold, the next-lowest are tried; a lowest landing AT the tilt limit is refused (it would tip further).
* ⭐⭐⭐ **THE ORDER** (*"added to the heap in the correct order so later they can be reassembled without colliding"*):
  the pieces reach their heaps IN THE ORDER THEY COME OFF the painting, each settling on those already there — so,
  played forwards, **the last one down is the first one lifted**: every `LIFT` starts from the top of what is left, and
  the lowering it reverses was checked against exactly the pieces then on the heaps. ⭐ Vectored both ways
  (`tests/d191.test.ts`): lifted in play order, no lift meets anything; lifted in the order they were put down, some do.
* **The long bars** (48 cm; the strip is 46.5 cm deep): a piece longer than 80 % of the strip's depth lies ACROSS it,
  within 20°, and the spot it is pulled out to must have room for THAT turn (phase A). ⛔ Found by the generator: a bar
  pulled out sideways beside the painting could lie flat only pointing in depth there, which no strip holds.
* ⭐⭐⭐ **THREE PIECES STACKED AT MOST — BOTH WAYS THE EYE COUNTS** (`D194`), and a rest that breaks either is refused:
  * **Up the support chain**: a piece lying FLAT ON THE FLOOR is level 1 (a neighbour it touches side by side holds
    nothing up); any other piece is one level above the highest EARLIER heap piece it touches — rests on or LEANS on (a
    gap under 1 mm; a piece put down later can only come to rest on or against earlier ones). No piece above level 3.
  * **from above**, below.
  ⛔⛔⛔ **THE OWNER'S RULE WAS BROKEN TWICE, AND BOTH TIMES BY THE SAME MISTAKE**: I chose a count that was easy to
  compute instead of the count the owner makes when looking at the heap, and closed it on a green suite without looking.
  `D192` counted support but only through lower centres (a piece over a leaning bar was not on it); `D193` counted only
  from above, and a STAIRCASE — each piece on the one below, shifted — is 4 high with no spot under 4. ⭐ *A rule about
  what the eye sees is checked by every way the eye counts, and by looking.* Measured by the chain: `D193`'s plan **7**
  high (the vector fails on it), white 4 — the owner's report.
* ⭐⭐ **THREE PIECES STACKED AT MOST, COUNTED FROM ABOVE** (`D192`, `D193`): each heap piece's outline on the floor is
  the hull of its corners; a rest is refused if any point of its outline (a 2.5 mm grid, its corners 1 mm in) already
  lies under three outlines (`heapMaxLayers`), and the piece goes elsewhere. ⛔⛔ **`D192` counted LAYERS OF SUPPORT**
  (one more than the highest piece a rest touches with a lower centre) and the owner saw a pile deeper than three on the
  glass: a piece lying over a steeply leaning bar has a LOWER centre than the bar, so the bar was not counted — 4 deep
  from above, passed as 3. ⛔ And a 9 × 9 sample of the outline let a thin sliver four deep through (found by the
  vector, which scans the strip every 1 cm). ⭐ *Count what the eye counts.* Measured: `D191`'s plan 7 deep by layers,
  `D192`'s 4 deep from above — the vector fails on both.
  ⚠⚠ **COST**: a 48 cm bar leaning across a heap covers four pieces from above, so the bars no longer lean — `D191`'s
  *"same as what is shown for the longest black piece"* is no longer held (its vector is dropped, the reason kept).
* **The fallback**: after 30 of its 60 tries, a piece that finds no rest on its heap lies flat on free floor beside it,
  within a heap and a half of its centre (`D191`'s plan: one, Piece9; `D192`'s: none; `D193`'s: three white).
* **The stage** (what the start view frames, and what the reach adds to the cube): every corner outside the cube of every
  piece on its heap and along every carry and lift, from the floor to the heaps' top — padded 0.1 mm across and in depth
  (`D193`: fitted exactly, a piece at its edge poked past it by the saved plan's 1e-6 rounding; found by the playback
  vector).
* ⭐ **Measured, seed 1** (the committed plan, `D194`): five heaps — 10 white, 14 black, 2 yellow, 3 red, 1 blue;
  every heap **3 high at most** by the chain (17 pieces on level 1, 8 on level 2, 5 on level 3) and from above; **2**
  pieces leaning (white Piece15 at 28°, yellow Piece17 at 23°), **11** resting wholly on other pieces; the highest point
  **12.1 cm**; **2** pieces needed the fallback (Piece4, Piece32). A headless look at the start frame: no tall pile.
  (`D193`'s: 7 high by the chain, 4 leaning, 13.9 cm; `D192`'s: 4 deep from above; `D191`'s: 7 deep, 15 cm.)
  ⚠ The cost, again: the stricter the stack, the fewer pieces lean (9 at `D191`, 2 now). ⚠ Generating the plan takes ~2 min (~45 s before).
* ⛔ **Nothing is drawn**: the demo scene has exactly `Scene_1`'s bodies (a vector).

## 2quater. ⛔ SUPERSEDED BY `D191` — the floor grid (`D174`–`D179`), kept as the record

⛔ `demoGrid`, `naturalOf`, `sizeWithMedian` and their options (`gridPitch`, `gridGap`, `gridOffset`, `startYawDeg`,
`startShiftFrac`) are deleted with their vectors. ⭐ What stands of it: the chain (§2), the camera 15° earlier (`D175`,
§7), the colour order. What follows is the grid as it was built.

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
* ⭐⭐ **A NATURAL FEEL** (`D177`; bolder at `D178`; a median law since `D179`) — each piece on the grid, drawn from
  the seed and the piece (`naturalOf`, its own random stream, so it does not depend on which pieces come off):
  * **a yaw** about the vertical, either sign, its size **0°–4° with a median of 2.5°** (`startYawDeg`; 5°–10° at
    `D178`, ±1.5° at `D177`) — it stays flat on the floor. ⛔ `D177` was first built as a ROLL about depth and
    corrected by the owner before it shipped;
  * **a shift of its aligned face along depth** — row 1's near face, row 2's far face — either sign, its size **0–5 %
    of its longest side with a median of 3 %** (`startShiftFrac`; 5–10 % at `D178`, ±1 pixel at `D177`);
  * ⭐ **the law** (`sizeWithMedian`): size = `max × u^k` for a uniform `u`, `k = ln(median / max) / ln ½` — 0 at
    `u = 0`, the max at 1, exactly the median at ½ (yaw `k` = 0.678, shift `k` = 0.737). Seed 1's 30: median yaw
    2.45° (max 3.90°), median shift 2.85 %;
  * ⚠⚠ **A SHIFT'S SIGN IS FLIPPED WHERE IT MUST BE**: the strip between the floor's edge and the cube is ~4.9 units deep
    and the longest pieces are 4.83, so a bar shifted the wrong way cannot stay both on the floor and out of the cube.
    Each row's line moves to make room first; where a drawn sign still cannot fit, the LONGER piece in the conflict is
    flipped first (its SIZE is kept). Seed 1: **1 of 30** — Piece32, the 4.83 bar (9 at `D178`, when the short pieces
    flipped first). The yaw is never changed. `DemoGrid.shift` holds the final shifts;
  * **the gutters stay whole**: each cell is the piece's TURNED footprint plus a gutter, and the rows interlock on
    their real, turned and shifted extents; pieces stay 2 cm clear of the cube. Seed 1: rows **11.5 units** wide
    (`x −5.75 → 5.75`), row 1's line at `z −9.80`, row 2's at `z −5.30`; 14 and 16 pieces;
  * the piece is turned straight into that pose at its spot before the building (its `ALIGN` ends in it), so the
    carry and the lift keep one orientation all the way down.
  * ⚠ The larger yaw changed which pieces can lie down at their spots, so the peeling drew a slightly different 30
    again (Piece3 is among them now).
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
* **B — the heaps** for that set (`demoHeaps`, `D191`; the grid, `demoGrid`, before).
* **C — the replay**: A's unsnap and estrangement again (the heaps are outside the cube and those steps inside it, so a
  piece already on a heap cannot block one — a refusal there throws as a defect); then, `D191`, a spot on its heap and
  the rest it settles in there (§2bis), the turn into that pose, the carry and the lowering — the spot re-drawn until
  all four are free. The carry
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
| `heapWidthK` / `heapWidthPad` / `heapGap` | **1.2 / 0.3 / 0.4** (3 cm / 4 cm) | `D191` — a heap as wide as its pieces need |
| `heapSpread` / `heapSpreadDepth` | **15 % of the heap / 0.5** (5 cm) | `D191` — where a piece is dropped |
| `heapOffset` / `heapFloorMargin` | **0.3 / 0.05** (3 cm / 5 mm) | `D191` — outside the cube, inside the floor |
| `heapPitchDeg` / `heapRollDeg` | **40° / 6°**, steps **2.5° / 2°**, refined to 0.1° | `D191` — how far a piece may tilt as it settles |
| `heapTries` | **60** (the floor fallback after 30) | `D191` |
| `heapMaxLayers` | **3** | `D192`–`D194` — three pieces high up the support chain, and over any point seen from above |
| ⛔ `gridPitch`, `gridGap`, `gridOffset`, `gridWidth` | deleted (`D191`; `gridWidth` at `D175`) | the grid |
| camera start | **50° before** the boot yaw (`D192`; 15° at `D175`) | the orbit is **410°** (375° at `D175`), ending where it did |
| ⛔ `startYawDeg` / `startShiftFrac` | deleted (`D191`) — were 0–4°, median 2.5° / 0–5 %, median 3 % (`D179`) | the grid's natural feel |
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

* **Yaw**: it **orbits to the right**. ⭐⭐ `D192`: it **STARTS 50° before the boot yaw** (to the left; 15° at `D175`)
  and still ENDS where it did — the boot yaw a turn on, the level's own front view — so it turns **410°** (375° at
  `D175`; `DEMO_START_BEFORE_DEG`).
  ⚠ Kept the end, not the whole path, because the end is where the player takes over; shifting the whole orbit is one
  constant. ⭐⭐ **The goal is reached with 15° of orbit LEFT**: the camera turns at a steady rate while the moves play
  (360°), then **slows uniformly to rest** over the last 15° — reaching the final yaw at zero speed as the demo ends, with
  no jolt where the moves end (the speed is continuous). Arriving at rest from the steady rate takes `2 × 15° / ω`, so
  the **moves take 395 / 425 = 92.9 % of the run** (`D192`; 360 / 390 at `D175`, 345 / 375 before) and the settling the rest
  (`DEMO_MOVES_END`, `demoYawAt` in `core/demo_plan.ts` — the generator aims with the same law).
* **Elevation**: rises **linearly** from the boot elevation to the top of the rig (`v = 1`), reached at the end.
* **Zoom**: ⭐ at the start, the camera is placed at the **smallest distance at which the whole demo cube is on screen**
  — every corner inside the vertical AND the horizontal field of view, from the boot view, on this screen's aspect
  (a portrait tablet at fov 0.8: **2.25 m**). ⭐ `D174`: **and the floor grid** — the start configuration, off-centre
  toward the camera (`demoFramePointsM`, `fitPointsDistanceM`), from the demo's START yaw (`D175`). ⭐ `D191`: the
  heaps' stage instead (1.17 m across at seed 1, against the grid's 1.15 m); ⚠ the portrait figure below is the grid's,
  not re-measured.
  ⚠⚠ **In portrait it is still too wide**: the two rows need **3.65 m** on the tablet's 882 × 1304 (`D179`; 3.91 at
  `D178`, 3.43 at `D176`, `D175`'s one rank 4.73 m) and the camera is held at the rig's **3 m** maximum — so at the
  start, in portrait, the outer ends of the rows are cut (landscape 1304 × 882: **2.11 m**, all in view). §9. It then **draws back linearly to the rig's maximum**
  (`cameraRadiusMaxM`, 3 m), reached at the end. ⛔ A cube that cannot fit within the maximum is shown from the
  maximum. ⚠ The demo drives the zoom while it plays; the pinch and the wheel are the player's again at the end.
* ✅ Measured headless (`D171`; Chrome, 882 × 1304, `demoDurationS=20`): the scattered pieces all on screen at the start
  (`r = 2.248 m`); at 88.6 % `demo 145/150 SNAP`, yaw 242°; at 94.5 % `camera settling`, 263°; 98.5 %, 269.4°; the end
  at exactly 270° (= −90° + 360°), `r = 3.00 m`, `elev = 1.00`, `goal ✅  demo ✅`.
* ✅ `D174`, headless (Chrome, SwiftShader, 882 × 1304, the built site): the start shows the 11 standing and the 30 on
  the floor, the grid whole in frame at `r = 2.50 m`. ⚠ **Seen from the boot view the grid is nearly EDGE-ON**: the
  camera boots level, 23 cm above the floor, so a piece 3.3 cm thick reads as a strip and the rows behind the first are
  mostly hidden. The order reads left to right; the rows do not. §9.
* ⛔⛔ **ON THE LOCAL PROTOTYPE BRANCH `1.0.58-Trial-with-double-orbit` ONLY — THE PATH ABOVE DRIVES THE GREEN BOX, NOT THE
  CAMERA** (the owner, 2026-10-01: *"to be fixed later on if we continue developing this prototype"*). On that branch the
  orbit rig places a green proxy box, and the camera follows it on its own orbit: twice the box's radius and height, looking
  at the orbit centre, held inside a 7° leash and gliding onto the box once the input stops (`input/follow_camera.ts`,
  `render/green_box_wiring.ts`). ⚠ The demo writes its yaw, elevation and zoom through the rig (`demo_wiring.ts` →
  `applyCamera`), so on that branch they move the BOX — and the camera trails it by the leash and the glide instead of
  showing the planned path: the 410° turn, the rise to the top ring and the draw-back to 3 m reach the camera late and
  softened. ⭐ Every other branch is unaffected. The fixes are in §9.

## 8. `Scene1_demo` — the specification applied to `Scene_1`

* **World 0, `Level1_demo`** — *Demo — the painting*, after `Level_1`: `?sceneIndex=2`, or the SCENE slider.
  (`Scene_demo` / `Level_demo` at `D170`, renamed by `D171`.)
* `Scene_1`'s floor, lights, rig and final configuration; its pieces start at the plan's start poses — the 30 on the
  floor grid (`D174`), the 11 no move touches in the painting. `SceneDescriptor.demo` carries the plan once loaded
  (`D173`, §5).
* ⚠ `D191` drew another set of 30 (the blue plate stays in the painting, Piece12 comes off); the order below is
  `D175`'s, and the current one is the plan file's `LIFT` moves.
* **The result, seed 1** (`D175`) — the pieces in PLAY order (the first one put back first): `Piece20, Piece8,
  Piece35, Piece17, Piece26, Piece15, Piece39, Piece10, Piece32, Piece6, Piece9, Piece37, Piece28, Piece24, Piece7,
  Piece27, Piece4, Piece23, Piece16, Piece14, Piece2, Piece21, Piece22, Piece11, Piece1, Piece5, Piece40, Piece25,
  Piece34, Piece36`; the rank's order is §2bis. Every pose: `src/content/scene1_demo_plan.ts`.

## 9. For later

* **Occlusion by the assembly itself** (§2): 8.4 % of sampled moments hide the moving piece (`D174`; 10.2 % on the same
  instrument before), mostly the `SNAP` into a slot while the camera is edge-on. A camera that eases toward the face of
  the slot being filled — or a plan that puts pieces back while the camera faces the painting — would remove most.
* ✅ **KEPT AS IT IS** — the owner, 2026-09-30: *"Ok, keep as current"*. ⚠ **The rows' ends cut in portrait at the start** (`D175`–`D179`, §7: 3.65 m needed, 3 m allowed): a start distance past the rig's maximum (the zoom then
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
* ⛔ **If the double-orbit prototype is developed further** (`1.0.58-`, §7): the demo's planned path must reach the CAMERA
  again. Either the demo writes the camera directly while it plays (the green box and its follow suspended, and resumed
  aligned at the end, so the player takes over without a jump), or the demo plans the BOX's path so that the camera's
  follow — leash, ×2 orbit, glide — lands on the planned camera views. The first is the small change; the second keeps
  one camera behaviour everywhere. The owner's to choose.

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
