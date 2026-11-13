# `Scene_2` — THE ENGINE: its brief (W0) and its ASSEMBLY PLAN (W1)

> **STATUS** · ✅ **W1 APPROVED 2026-11-12** (the owner: *"plan approved"*), ⭐ **AMENDED the same day** by W2's first finding (§2.7: the pistons
> DOWN THEIR BORES, the banks WHOLE — *"1- agreed … 2- make the banks whole again"*), the V at 120° (§2.10) · ✅ W2 APPROVED 2026-11-13 (§6; the owner: *"W2 sheet approved"*) · ⛔ NOTHING BUILT · **OWNS** · `Scene_2`'s
> brief, its parts catalogue, its assembly steps, the rules' check, its decisions and what the game must gain for it
> **READ IF** · you are working on `Scene_2` (World 0's *Level 2 - Scene 2 - the engine*)
> **LAST VERIFIED** · 2026-11-12 (branch `1.0.124from1.0.121-Added_scene_2`)

⭐ This file is ONE APPLICATION of the generic workflow — [`../../20_GAME_RULES/spec/SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md)
(the stages, the plan's template, its rules) — and of the generic part conventions, [`PART_AUTHORING.md`](PART_AUTHORING.md). ⛔ Nothing generic is
written here; nothing here binds another scene.

> *"I intend to make you reproduce this assembly by building it in blender and later import in the scene 2, or build it directly in scene 2. The
> assembly will be the engine. I will use the engine parts we build in blender or in scene 2 and the orbits to create the game where the player
> assemble the engine parts one by one."* · *"I think we first need to draft an assembly plan how the player would build the assembly."* · *"engine
> assembly or the md files shall be written as applicable for any scene, not just the engine. make sure of it. then let's proceed"* — the owner,
> 2026-11-12

## 1. W0 — the brief

* **The object**: a **glass 90° V6 on a wooden plinth** — the owner's two files, `Assets/Blender/World0_Scene2_engine/` (`BLENDER_ASSETS.md` §1):
  `blender-build-glass-v6-engine.md` (the build sheet; ⭐ its Appendix B, the three.js `engine()`, is the SOURCE OF TRUTH for every dimension and
  motion — where the sheet and the code disagree, the code wins) and `glass-v6-engine-preview.html` (the reference animation, a 720° loop).
  ⚠ Leftovers in both, harmless: *"Glass Four"* and a four-cylinder firing order in the preview's text; *"wooden exhausts"* in the code's header
  (they are chrome); a mill post and a horsehead in the sheet's primitive table (an unused `mill` scene).
* **What the level is FOR**: the player assembles the engine part by part with the orbits (the polar / tilted orbit of the green piece, generalised to
  every part — §5); ⭐ at the end the engine RUNS its loop (`PART_AUTHORING.md` §5).
* **Where it is authored**: Blender (`PART_AUTHORING.md` §2 — round, glass and bent parts).
* **Its size** — ⭐ AMENDED by §2.10 (the V at 120°): **0.14 m per reference unit**, the engine about 0.47 × 0.27 × 0.49 m. (First: 0.15 m at the
  90° V, below.) ⭐ The workflow's rule
  (the owner: the assembly *"similar to the cube assembly of scene 1, because all the inputs and behaviors and sliders have been taylored on these
  dimensions"* — `SCENE_WORKFLOW.md` §4): the assembled engine's box is about 3.35 (the plinth) × 2.25 (to the valve caps) × 2.55 reference units →
  **0.50 × 0.34 × 0.38 m** against the cube's 0.49 × 0.483 × 0.483 — its longest side the cube's, lower and shallower. ⚠ Checked again at W2 on the
  built geometry.
* **The reference geometry the plan uses** (reference units, y up; the crank axis along x at y = `yc` = 0.81): the plinth's top at y = 0.26; the
  crankcase 2.45 × 0.9 × 1.25 from y 0.26 to 1.16; two banks tilted ±45° about the crank axis, each a glass box from 0.45 to 1.38 along its own axis
  (`deck` = 1.22), 0.78 deep, its three bores (r 0.27) open from 0.55 to the deck — bank A (tilted −45°) at x −0.8 / −0.1 / +0.6, bank B (+45°) at
  −0.6 / +0.1 / +0.8; the valves' stems rise through the bank's top to their caps above it; the exhaust stubs leave each bank's OUTER face at 0.86
  along its axis (⭐ MOVED onto the HEAD, at the lower valves' ports — §6.2); the pulley at the crank's front end (−x), outside the case.

## 2. ⭐⭐ W1 — the plan

### 2.1 The owner's decisions (2026-11-12)

> *"D1- 6 pieces for the block (so we can insert the pistons and the crankshaft at the splits) as per attachment, ok for the rest of your 15 parts (now
> they are 19)"* · *"D2- ok, they cannot be interchangeable because they need to have a certain angle to match the crankshaft selected rotation
> degree"* · *"D3- plinth pre-placed (we always need to have a first part pre-placed at boot otherwise the player could choose whatever position in
> the scene and the goals would not be matching)"* · *"D4- see how the parts are placed in the demo scene. I want to emulate the same."* — then, after
> W2's first finding (§2.7): *"1- agreed. make sure the orbit mechanism we have built allows to bring the pistons down their bore (through A+ dy ?
> where the gizmo need to be supported so the A + dy can aim it?) 2- make the banks whole again"* — the owner

* **D1 — THE GLASS BLOCK, AMENDED: FOUR PIECES** — first six (the owner's sketch: the crankcase split HORIZONTALLY for the crankshaft, each BANK split
  LENGTHWISE for the pistons); ⛔ the banks' split served only a sideways way in for the pistons, which the reference's numbers ruled out (§2.7) — so
  **the banks WHOLE again**: a lower case, an upper case, two banks. ⭐ The case's split AT THE CRANK AXIS's height (y 0.81) — the owner: *"yes, where
  the crankshaft lies because that is where the player will have to seat it"*. **17 parts.**
* **D2 — six DISTINCT pistons**: each piston + rod is one rigid part at the goal's crank angle, its rod's angle its own — each fits ONE bore (to be
  told apart on the glass: e.g. numbered crowns, decided at W2). ⭐ The crowns' names (A1 … B3) are METADATA objects (`metadata = true`, W3
  2026-11-13 — removed for their vertices, then restored: *"revert the removal … but make it separate objects so we can hide them in the game"*).
  ⚠ Measured (the owner: *"I imagine all the pistons and rods are the same, confirm ?"*): ONE piston and ONE rod mesh for all six; a part differs
  only by its rod LOCKED at its cylinder's goal angle — 0° (A2, B3) or 8° (A1, A3, B1, B2, toward ±z′). A piston is round, so an 8° one turned half
  round matches the other 8° bores: TWO shapes by eye — with the names hidden, D2's *"each fits ONE bore"* no longer shows. ✅ **Decided** (the
  owner, 2026-11-13: *"names visibles until we hide them in the game"*): the names SHOWN, D2 kept — six distinct pistons, each its own bore;
  hiding them (and then what tells the pistons apart) is a later decision, in the game.
* **D3 — the plinth PRE-PLACED** — and the owner's reason is a rule for every scene (the workflow's rule 9: an anchor at boot).
* **D4 — the boot as the demo's**: small HEAPS, one per type of part, dropped and settled, the next part to place on TOP (§2.5).
* ⭐ **The pistons' way in — DOWN THEIR BORES** (§2.7's option (A), agreed): from the deck, along the bore's axis, the rod's big end OPEN toward the
  crank (§2.6); the heads after the pistons. How the orbit does it: §2.9.

### 2.2 The parts catalogue

| id | part | made of (the reference's pieces) | role | kind | symmetry |
|---|---|---|---|---|---|
| `E01` | **plinth** | the wooden rounded plate | PRE-PLACED, frozen (D3) | — | — |
| `E02` | **lower case** | the glass crankcase BELOW the split (hollow — §2.7), with the four bearing saddles | PLACEABLE | — | a half-turn about the vertical (the saddles and the bosses mirror front–back) |
| `E03` | **crankshaft** | the bent bar, the three throws (pins at 0° / 120° / 240°), the rear cap | PLACEABLE | — | — (the throws are not symmetric; the nose at the front) |
| `E04` | **upper case** | the glass crankcase ABOVE the split (hollow), its roof the two slopes the banks stand on, open under the bores | PLACEABLE | — | a half-turn about the vertical |
| `E05`, `E06` | **bank** ×2 | a bank from its foot to its deck, its three bores open through its foot, its deck rings | PLACEABLE | ⭐ `bank` — one shape: a half-turn about the bank's own axis maps bank A's bores (x −0.8 / −0.1 / +0.6) onto bank B's (−0.6 / +0.1 / +0.8) | — |
| `E07` – `E12` | **piston + rod** ×6 | a piston (its ring) and its rod, rigid at the goal's crank angle, the big end OPEN | PLACEABLE | each its own bore (D2) | — |
| `E13`, `E14` | **head** ×2 | a bank's glass above its deck (y′ 1.22 – 1.38) with its 6 valves (heads, stems, hammered caps, grommets) | PLACEABLE | ⭐ `head` — one shape (the same half-turn) | — |
| `E15`, `E16` | **exhaust** ×2 | a bank's three stubs and flanges, its collector (open rear end, front cap) | PLACEABLE | each its own (the open end is at the rear on both) | — |
| `E17` | **pulley** | the hammered pulley, its dark disc, hub and pin | PLACEABLE | — | about its axis (any turn — a NEW symmetry) |

⭐ 16 placements. ⭐ The valves are inside their head (a cap is too small to orbit — rule 5); the rods inside their piston (a rod alone would be a
step the player cannot see — rule 5).

### 2.3 The steps

| step | part | host | seat: part ↔ host | approach | turn at the goal | gizmo route | after |
|---|---|---|---|---|---|---|---|
| 1 | `E02` lower case | `E01` | its bottom ↔ the plinth's top | down | 2 ways (its half-turn) | the plinth's top | — |
| 2 | `E03` crankshaft | `E02` | its four journals ↔ the four saddles (flat proxies at the saddles' bottoms) | straight down into the saddles | 1 way | the case's split face, into the saddles | 1 |
| 3 | `E04` upper case | `E02` | its bottom ↔ the lower case's top (the split plane, the crank's half-holes) | straight down | 2 ways (its half-turn) | the lower case's top | 2 |
| 4, 5 | `E05`, `E06` bank | `E04` | its foot ↔ the upper case's roof slope on its side | along the bank's axis, down onto the slope | 2 ways (either bank's place, its kind) | the roof slope | 3 |
| 6 – 11 | `E07` – `E12` piston + rod | `E03` + its bank | its resting face on the bore's GHOST FLOOR (§2.9); the big end onto its pin | DOWN ITS BORE, along the bank's axis (ONE axis) | 1 way | the bank's deck, then down the bore | its bank |
| 12, 13 | `E13`, `E14` head | its bank | its bottom ↔ the bank's deck | along the bank's axis, onto the deck | 1 way per bank | the deck | its bank's three pistons |
| 14, 15 | `E15`, `E16` exhaust | its HEAD | the three flanges ↔ the head's TOP face, inside each bore's ring, between the lower valves (§6.2) | ⭐ straight DOWN onto the top face (its normal) — the stubs pass BESIDE the valve caps, never through them | 1 way | the head's top face | its head |
| 16 | `E17` pulley | `E03` | its rear face ↔ the crank nose's shoulder (a flat proxy) | along the crank's axis, from the front | any turn | the upper case's front face, the nose | 3 |

⭐ A partial order: after step 3 the two banks are independent of each other; within a bank: the bank → its three pistons → its head → its exhaust
(on the head); the pulley any time after step 3.

### 2.4 The rules' check

| rule (`SCENE_WORKFLOW.md` §2.3) | verdict |
|---|---|
| 1. an order exists | ✅ the `after` column has no cycle; every host is earlier or pre-placed |
| 2. access | ✅ ON THE NUMBERS (§2.7, §2.9): the crankshaft at the case's split; each piston down its bore — ⚠ with §2.9's radii (the big ends within the piston's footprint). ⚠ The upper case comes down over the crankshaft: its half-holes clear the journals |
| 3. a seat for every step | ✅ flat faces everywhere but the round seats (journals, the nose) — flat PROXIES there; the pistons on GHOST floors (§2.9) |
| 4. the gizmo reaches it | ✅ on the code (§2.9): over a bore the gizmo takes the real depth when the piece fits — the ghost floor. ⚠ To be PROBED (W6): the deck at exactly 45° (§2.9) |
| 5. a step is one action | ✅ the valves in their head, the rods in their piston |
| 6. the phone's budget | ⚠ the worst step: a piston down a bore — the bank's collision is its walls AND three bores; ⭐ the bores SQUARED in the collision (4 slabs each), round only in the look — decided at W2 |
| 7. symmetries and kinds | ✅ kinds: `bank` ×2, `head` ×2; the lower and upper case a half-turn about the vertical (`yawHalfTurns`); the pulley's spin free (a new symmetry); the rest one way |
| 8. the end | every placeable part in its goal → the level ends; ⭐ the engine runs its 720° loop |
| 9. an anchor | ✅ the plinth, pre-placed (D3) |

### 2.5 The boot (D4 — as the demo's, `20_GAME_RULES/spec/DEMO_SCENE.md` §2bis)

* **Small heaps in a strip** between the floor's edge and the engine, in front as the boot camera sees it — ⭐ **one heap per TYPE of part** (the
  owner: *"at start, keep the same types of parts close together (for example the parts of the block, the pistons) so it reproduces the
  classification by color of the demo scene"* — it replaces Claude's one heap per material): the **block** (`E02`, `E04` – `E06`: the two cases and
  the two banks), the **crankshaft** (`E03`), the **pistons** (`E07` – `E12`), the **heads** (`E13`, `E14`), the **exhausts** (`E15`, `E16`), the
  **pulley** (`E17`) — six heaps, a single part its own (⚠ the crankshaft stands with the block in the steps but is its own type: chrome, a bar).
* **Dropped, not placed**: each part falls and settles by the game's own collision rule — flat on the floor, on a part, or leaning; a rest must hold
  (a part balanced on an edge is refused); **three parts stacked at most**, counted both ways the eye counts.
  ⛔ **NOT laid on its seating face** (the owner: *"I would not lie the parts on their seating face at start: I want to keep the same feel as the demo
  scene"* — it reverses Claude's first proposal for D4): a part lands at any yaw and on whichever face it settles on, as the demo's do; turning it
  onto its seat is the player's work.
* ⭐ **The order**: the parts reach their heaps in the REVERSE of the steps (the last step's part first), so within each heap the part the player
  needs next is on TOP of what is left — the demo's *"the last one down is the first one lifted"*. ⚠ The plan's partial order allows several play
  orders; the heaps are built for the steps' order above (step 1 on top).
* ⚠ Generated offline as DATA (the demo's `core/demo_plan.ts` way), its size checked against the strip (the crankshaft 2.9 reference units long —
  0.44 m — is the demo's *long bar* case).
* ⭐⭐⭐ **DRAWN AT EVERY BOOT** (2026-11-13; the owner: *"there has to be a script which randomly distribute the parts within assigned areas and
  with the rules I indicated for demo scene, otherwise the parts will always be the same order game after game and it is very static and boring"*)
  — a committed layout was built first, then replaced: the scene carries the RULE (`src/content/scene2_boot.ts`: the heaps by type, the anchors,
  the areas' arc, the limits) and `render/model_import.ts` draws the layout at load (`core/boot_heaps.ts` `bootFromModel`) with a NEW SEED each
  game — `?bootSeed=N` replays one; the seed and its time on the HUD's first line; a failure shows the parts at their goals and says why.
  - ⭐⭐⭐ **THE FRONT — the yaw origin** (the owner: *"there is a problem of yaw origin … the pieces are currently in the right half of the
    scene"*, then, with Blender's view from +X: *"for me, this is the camera viewing the front of the assembly. this is how the final assembly will be
    placed, this is how we built in blender. this is how I setup the lights and the environment. Therefore, if anything is not in line, everything
    has to be yaw rotated so it matches this"*). The front is **the file's +x — Blender's +X, the flywheel's end** (`model.frontDeg: 0`). The lights
    and the environment were already in line with it (the key from Blender's +X, −Y: behind-left of a camera looking from +X); ONLY THE CAMERA was
    not: it booted at the rig's global yaw −90°, the world's −z — the model seen from 270°, a quarter turn off (the HUD read `yaw origin −90°`, and
    the heaps, centred on that camera, stood in the front's right half). ⭐ Now the camera BOOTS — and RESETS — facing the front (`bootYawForFront`:
    Babylon's glTF reader mirrors x, so a front `f` is the world direction `(−cos f, sin f)`; `Scene_2` → yaw π), and the heaps' arc is centred on
    the FRONT (the HUD shows `front 0° camera N°`: the two agree). Tested: for any front the camera boots on that side; the global −90° reads 270°.
    The heaps: 180° round it — the front half; a heap's radius = room for its parts LYING SIDE BY SIDE (√ of their footprints squared — the demo's
    "√ of the flat area"); a part's spot drawn round its heap's centre, the spread widening with the tries, never past 1.2 × the radius. Tested at
    four yaw origins (0, 90, 180, 270°): every part's centre in the front half; its counter-example (the opposite origin) fires.
  - **Retried, never assembled**: 150 tries a part (80 failed 4 seeds of 30 — the block's long cases between the plinth's perimeter and the floor's
    margin); a layout that still fails is redrawn with the next seed (up to 6) — 50 seeds at random yaw origins: 2 retried, all placed, ≈ 1 s.
  - ⭐ **THE FIRST PART's orientation** (the owner: *"we also need to have the yaw origin as reference to orient the first part (because it can be
    oriented by any yaw value on the plinth)"* → *"this is how the final assembly will be placed"*): the goal is AS BUILT, its front at the front —
    the lower case, which could sit on the plinth at any yaw, is placed only at its goal's yaw (its symmetry, `yawHalfTurn`, accepting the half
    turn). ⚠ To build in W5 (the playable slice).
  - **The demo's rules**: on a stable face of its hull at any yaw (never chosen for its seating face); dropped until it touches; **a rest HOLDS**
    (the centre of mass over the contacts, 1 % of its radius); **one heap per type** (on the floor or its own heap's parts; never the plinth);
    **three high at most, BOTH WAYS THE EYE COUNTS** (up the support chain AND from above: no floor point under more than three of its heap's
    outlines — the demo's `D194`); **the reverse of the steps** (the next part on top).
  - **Fast enough for a boot (≈ 0.3 – 0.7 s)**: a part collides as its HULL (conservative: nothing rests in another's hollow) and only against what
    stands under it, dropped straight to the floor when nothing does — the first version (every collision piece against every piece, a slow descent)
    took 12 – 30 s. ⛔ **The hull was broken** for the heads and exhausts (many coplanar points in float32: 20,000 triangles for 271 points; the
    resting faces 7 s on one part) → the points JOGGLED (qhull's `QJ`), flatness judged before; the hull test checks triangles = 2 × vertices − 4.
  - ⛔ **Blocked = a gap under 1e-4 units**: `gapBetween` reads touching AND overlapping as 0 (the first version tested `null`: no part blocked
    another — the test's counter-example caught it).
  - ⭐ **THE PERIMETER round the plinth** (the owner: *"leave more space around the plinth so that the parts do not interfere later on … make a
    perimeter around the plinth that the parts can't cross"*): the plinth's footprint + **1 unit (14 cm) on every side** (`anchorMargin`); no point
    of a part inside it (its hull's outline against the box, both ways). Tested on every seed, with its counter-example; 30 more seeds: no failure,
    the slowest 1.1 s, 14 parts stacked in all.
  - ⭐ **THE FLOOR'S MARGIN** (the owner: *"add a smaller margin before the edges of the floor"*, then *"0.5 unit is too big"*): no part within
    **0.2 unit (≈ 3 cm)** of the floor's true edge (`floorHalf` 1 / 0.14 = 7.143, `floorMargin` 0.2; an accidental 7.0 — 2 cm — before). Tested
    on every seed.
  - Checked (`tests/boot_heaps.test.ts`, the real collision pieces, FOUR seeds): nothing overlaps (its counter-example fires), on and inside the
    floor less its margin, outside the plinth's perimeter, one heap per type, three high, never on a part needed before it; the same seed = the same layout, four
    seeds = four layouts; each < 3 s.
  - ⚠ Stacks are RARE (0 – 2 parts above the floor per layout): a rest on another engine part (curved, irregular) seldom holds. ⛔ The owner's look.
  - The game: the LEVEL slider **model stage** (0 = boot, the default; 1 = final); the contact shadows follow the seated set (at boot the plinth
    only); the rods' caps (`appears_when_seated`) hidden until seated. The generator travels in the lazy model module (the main bundle unchanged).

### 2.6 ⭐ The rod's big end — OPEN, and the ONE axis of a piston's way in

> *"(a). mark in the md file that we will have to be careful to design a face on which the pistons can slide to reach their goals as there will be
> only one axis on which the piston can slide to reach their goal, won't it ?"* — the owner

* **The big end** (the rod's end round the crank pin; the reference draws it as a solid chrome disc, r 0.1, 0.09 thick, the pin passing through it):
  ⭐ **(a) OPEN** — a half-ring, open toward the piston's way in, so it slides onto the pin and rests on it (a real big end's rod half, its cap left
  out). ⛔ Not (b), the cap drawn on another part (more pieces on the phone), nor (c), the disc with the rod–crankshaft collision ignored (an
  exception to the collision rule, the overlap visible). ⭐ With the way in DOWN THE BORE (§2.7), the opening faces the CRANK (`−y′`): the big end
  lands on its pin like a fork on a bar.
* ⭐ **Its CAP** (the counter closure, 2026-11-13): the big end's other half, a piece of its own that APPEARS when the part seats (§5 item 10) — open
  on the way in, closed round the pin once placed.
* ⭐⭐ **ONE AXIS — yes**: a piston + rod reaches its goal only ALONG ITS BORE's AXIS (`y′`) — the one direction the bore allows. ⚠ So W2 designs for
  it: the face it slides on — the bank's DECK (a flat proxy), the gizmo running on it to the bore's mouth, then DOWN the bore to the ghost floor
  (§2.9); every big end's opening facing `−y′`, turned in its own rod's frame (each rod has its own angle, D2); nothing else on the way down — checked
  at W3 (the check script) and walked at W6 (the probes).
* ⭐ The same holds for the **crankshaft** (step 2): ONE axis, straight down into its four saddles — the lower case's SPLIT FACE its sliding face, a
  flat proxy at each saddle's bottom its seat.
* ⛔ First written for a sideways way in (square to the bank's lengthwise split); superseded by §2.7.

### 2.7 ⛔⛔ W2's FIRST FINDING (2026-11-12): a piston CANNOT go in sideways — the way in DOWN THE BORE

⭐ Measured from Appendix B at the goal's crank angle (θ = 0, the loop's first frame), reference units:

| cylinder | crank pin, world (y, z) | pin in its bank (y′, z′) | piston's body along the bore | rod's angle |
|---|---|---|---|---|
| A, x −0.80 | 1.010, 0.000 | 0.141, 0.141 | 0.79 – 1.11 | −10.9° |
| A, x −0.10 | **0.710**, 0.173 | **−0.193**, 0.052 | **0.47** – 0.79 | −4.0° |
| A, x +0.60 | **0.710**, −0.173 | 0.052, **−0.193** | 0.69 – 1.01 | +14.9° |
| B, x −0.60 | 1.010, 0.000 | 0.141, −0.141 | 0.79 – 1.11 | +10.9° |
| B, x +0.10 | **0.710**, 0.173 | 0.052, **0.193** | 0.69 – 1.01 | −14.9° |
| B, x +0.80 | **0.710**, −0.173 | **−0.193**, −0.052 | **0.47** – 0.79 | +4.0° |

* ⛔ **Every crank pin is INSIDE the crankcase** (within 0.26 of the crank axis), and FOUR of six are BELOW the case's split (y 0.71 < 0.81). A piston +
  rod moving sideways (square to a lengthwise bank split) sweeps its rod's lower end through the case beside the pin — the upper case, for the low pins
  the lower case, then the plinth. ⭐ Rule 2 (access) passed ON PAPER and failed on the NUMBERS — the paper check read the bank's split, not where the
  rod's other end goes (the workflow's rule 2 now says so).
* ⚠ Two pistons reach BELOW their bores (0.47 < 0.55) and every rod lies inside the case: **the cases and the banks' feet are HOLLOW** — a cavity where
  the crankshaft and the rods are, the bores open down into it (the reference draws solid glass with the parts showing through it).
* ⛔ No goal crank angle saves the sideways way in: three pins 120° apart can never all lie above the crank axis.
* ⭐ **The options weighed**: (A) DOWN THE BORE — ✅ **agreed by the owner**; (B) the whole body split along each bank's plane — ⛔ from the outer side
  the low pins' way in runs into the plinth, from the V side through the upper case and the other bank; (C) another goal crank angle — ⛔ impossible
  (above). ⭐ With (A) the banks' lengthwise split served nothing — **the banks whole again** (the owner).

### 2.8 ⭐ The orbit's centre, step by step (proposed — the workflow's *orbit centre*, `SCENE_WORKFLOW.md` §2.2)

> *"each time we seat a part, we will need to redefine the center of the orbit or give the possibility to the player to modify the center of the
> orbit because the seating of the next part may require to orbit around another position for the center"* — the owner, 2026-11-12

| step | the orbit goes round |
|---|---|
| 1 lower case | the plinth's top centre |
| 2 crankshaft | the lower case's split face's centre (where the saddles are) |
| 3 upper case | the same |
| 4, 5 banks | the upper case's roof slope on that bank's side |
| 6 – 11 pistons | the bank's deck centre (the bores' mouths are there) — or each bore's own mouth |
| 12, 13 heads | the bank's deck centre |
| 14, 15 exhausts | the head's top face's centre |
| 16 pulley | the crank's nose, at the front |

⭐ Redefined AUTOMATICALLY when a part seats (the centre of the next step the player is likely to take — ⚠ with a partial order, the next part is the
player's choice: the centre may follow the part the player PICKS rather than the step), eased by the centre blend; and MOVABLE by the player.

### 2.9 ⭐⭐ Down the bore with the orbit we built — A + dy, and the GHOST FLOOR (checked on the code, 2026-11-12)

> *"make sure the orbit mechanism we have built allows to bring the pistons down their bore (through A+ dy ? where the gizmo need to be supported so
> the A + dy can aim it?)"* · *"that may require a ghost surface to support the gizmo for A + dy if this is the mechanism you intend to use for sliding
> the piston down"* — the owner, 2026-11-12

**What the code does today** (`src/render/assembly_wiring.ts`, `placeOffset` / `shownOffset`): the piece's place is the GIZMO + the orbit's direction
`u` (the gizmo's face normal) × (the approach's distance + the piece's lift, `liftOf` — its hull past its resting face toward the gizmo). ⭐ So **A + dy
moves the piece STRAIGHT along the face's normal toward the gizmo** — on a bank's deck, exactly down the bore's axis; the solver stops it at a contact
(`approachMove`), and it stops at the orbit's centre, which IS the gizmo (D3, 2026-11-04: *"center of the orbit = gizmo"*). Over an opening the gizmo
reads the REAL depth when the held piece fits it (D3; `POLAR_ORBIT_CLEANUP.md` §7, §8.3: a closed void with a floor keeps its depth where the piece
fits, `stackDepthAt`, `pieceEnters`). **So the mechanism is A + dy — and it needs four things:**

1. ⭐⭐ **A GHOST FLOOR in every bore** (the owner's *ghost surface*) — down the bore there is no surface where the piston must stop: the ray along the
   deck's normal goes down into the hollow case and finds the crankshaft's arms, a pin off the axis, or the case's floor. A hidden flat face across each
   bore, part of its bank's FACE PROXY (never drawn, never collided, never picked), at the depth where the held piston's support (its hull's end along
   `−u`, what `liftOf` measures) lies AT ITS GOAL: the gizmo drops onto it over the bore's mouth, and A + dy brings the piston down until it meets the
   gizmo — its goal; the goal capture (`D183`) finishes the seat. One per bore, each at its own piston's depth (§2.7's table: they differ).
   ⛔ **AMENDED (W3, 2026-11-13 — the owner: *"the ghost face shall be aligned with the outer face … Then, we will create a special snap to plunge the pistons inside the cylinder hold … In such case, the ghost face shall always be a face aligned with the assembly face where the hole exits"*)**: each bore's ghost lies AT ITS MOUTH, flush with the deck; the piston rests there and
   the PLUNGE snap (§5 item 8) carries it down onto its seat (1.364 or 1.570 deep) — the same for the valve sets (0.119) and the crank into the tub (0.179).
2. ⭐⭐ **The radii — the reference's do NOT let two rods down their bores**: a big end lies |z′| = 0.193 off its bore's axis for two cylinders (§2.7)
   and its radius 0.1 reaches 0.293 — wider than the bore (0.27). ✅ APPROVED (W2, a departure from Appendix B — the owner: *"new radii approved"*): **bore 0.30, piston
   0.28, big end 0.085** (the pin 0.06: a wall of 0.025) — every big end then within 0.278 of the axis, inside the piston's own footprint, so the WHOLE
   part (even as one convex hull) goes down a 0.30 bore with 0.02 to spare (3 mm at 0.15 m a unit); the piston's 0.28 keeps it snug, as the reference.
3. ⚠ **Aiming at the mouth** (⭐ now part of the PLUNGE snap, §5 item 8) — 3 mm of play: the gizmo must be ON the bore's axis when the descent starts, which a finger cannot hold. ⭐ Proposed: a
   MOUTH CAPTURE — over a bore's mouth, within a capture radius, the gizmo's place along the deck is held on the bore's axis (the ghost floor's centre),
   eased in, released when the finger carries it out. A requirement for the game (§5), not built; ⚠ the snap's capture (10 mm on the glass) works at
   the GOAL, not at the mouth.
4. ⛔ **The deck at EXACTLY 45°** — the face map splits the turn into sides and caps at 45° of elevation: a bank's deck sat on that boundary. ✅
   Resolved by §2.10: the V is 120°, the decks at 30°.

### 2.10 ⭐⭐ THE V AT 120° — off the face map's thresholds (decided 2026-11-12)

> *"if 45 degree deck is a problem, capture in the md files to avoid such inclination and increase or decrease the inclination to avoid 45 degrees.
> Then continue the build"* — the owner

* **Why 45° is a problem — on the code** (`input/face_map.ts`, `buildFaceMap`): ① a facet becomes the TOP cap only above 45° of elevation
  (`> π/4 + 1e-12`); a deck tilted exactly 45° is classified by the last bits of its normal; ② faces within 20° facing the same way merge into one
  facet, and in a 90° V each bank's DECK faces exactly as the OTHER bank's INNER face (with each bank tilted θ from the vertical, the deck faces up at
  90° − θ, the other inner face at θ: |90° − 2θ| apart — 0° at θ = 45°). ⚠ A throwaway probe on hand-made faces was INCONCLUSIVE (its faces were not the
  exposed ones the game reads) — the facets are measured at W6 on the built assembly. The rule for every scene: `SCENE_WORKFLOW.md` §4.
* **The candidates, computed** (Appendix B's crank at θ = 0, §2.9's radii): the merge needs |90° − 2θ| ≥ 30° → θ ≤ 30° or ≥ 60°.

| | **V 60° (θ 30°)** | ⭐ **V 120° (θ 60°)** |
|---|---|---|
| deck's elevation (≥ 15° off 45°) | 60° ✅ — but BOTH decks then qualify as the one top cap: a tie | **30°** ✅ — both decks SIDE facets, symmetric; the top cap the upper case's top |
| a big end off its bore's axis (+ 0.085 ≤ 0.28) | ⛔ 0.200 → **0.285**: two rods do not fit | ✅ 0.173 → 0.258 |
| the banks' inner feet | ⛔ cross the midplane into each other | ✅ 0.195 short of it |
| pistons across the V | 0.73 apart (radii 0.56) | 1.32 apart |
| ⚠ costs | — | the outer feet dip BELOW the case's split (y 0.697 < 0.81); the heads reach |z| 1.39, the valve caps ≈ 1.65 — past the plinth (1.275); the engine lower |

* ✅ **CHOSEN: 120°** — every bank 60° from the vertical, its deck and head at 30°, its outer face facing down-out (−60°). ⭐ Mechanically sound: on the three
  shared crank pins (0° / 120° / 240°) both banks reach top dead centre at 60° / 180° / 300°, so over 720° the six fire EVENLY, every 120°; Appendix B's
  valve timing reads the bank angle (`ALPHA`), so the
  level-end animation follows. ⛔ A departure from the reference's 90° — the owner's instruction above.
* **What it changes for W2** (§6): the banks CUT at the case's split (y ≥ 0.81) — each rests on the upper case's slope AND the lower case's top; the
  upper case a TRAPEZOID prism between the two feet planes (z ±0.520 at y 0.81, ±0.317 at its top y 1.16 — the slopes steep, 60°), its top face
  exposed in the V (the top cap); the PLINTH DEEPER (≈ 3.5 for 2.55, to carry the heads and the caps); the size (§1) re-checked: about 3.35 × 1.96 ×
  3.5 units — **0.14 m a unit** keeps the longest side the cube's (0.47 × 0.27 × 0.49 m), the engine about half the cube's height.
* §2.7's table is at 90°; at 120° the pins are unchanged (the crank's), the pistons' places: four at `y′` 0.83 (|z′| 0.173), two at 0.55 (z′ 0).

## 3. What is NOT decided here

The level data (W5). ⭐ **W3 STARTED 2026-11-13, STEP BY STEP** (the owner: *"script in blender step by step so I can have a look and review what is built in blender step by step"*): `Assets/Blender/scripts/build_engine.py -- --step N` rebuilds the .blend up to step N (1 plinth · 2 lower case · 3 crankshaft · 4 upper case · 5 banks · 6 pistons · 7 heads · 8 exhausts · 9 pulley · 10 the .glb), renders `previews/step_NN.png`; the owner reviews each step before the next. ✅ Step 1 (the plinth) reviewed OK by the owner; step 2 (the lower case) reviewed OK; step 3 (the crankshaft) built; step 4 (the upper case) built — its top first cut away by the six bores' whole lines of descent (only a skeleton left, 22 collision pieces), then (the owner, 2026-11-13: *"(b)"*) cut ONLY where the rods really pass: each rod's swept hull along its bore — two narrow slots (A1, B1, the pins leaning toward the V), the top plate kept, 19 pieces; the pistons NOT made smaller (offered by the owner: a piston never leaves its bore, only its rod reaches the case) — step 5 (the banks, kind `bank`, cut at the split, bores round in the look and squared in the collision — 6 pieces each — a GHOST floor per bore at its piston's lowest point) built; ⭐ step 6 (the six pistons + rods, E07 – E12 = A1 – A3, B1 – B3: the cylinder's name on the crown, the big end OPEN, the rod its own object on `HINGE_E0x_wrist`, 2 collision pieces each — the body, the rod above the pin) built: ✅ every piston's way DOWN ITS BORE clear from 0.9 units to 2 mm off its goal, its resting proxy on its bore's ghost floor and its big end on its pin, anti-parallel and coincident; ⭐ then (the owner's file: *"make the rod connection sturdier … rotate the annotations A1 to A3 so they are not upside down"*) every big end's outer radius **0.12** (0.085; the file's A3 at 0.121) — a big end off its bore's axis now reaches 0.293 of the bore's 0.30, every way in still clear — and every crown's name UPRIGHT in the world (the text's up = the world's up seen on the crown; checked by the build: the letters' tops above their bottoms); ⭐⭐ **THE PISTONS STAY IN THEIR CYLINDERS over the whole turn** (the owner: *"when the crank rotates, the piston shall remain in the cylinder … adapt the length of the rods and the depth of the crank axis offset"* — at 120° with the widened cases the skirt left the cylinder by 0.22): **the throw 0.15** (0.2), **the rod 0.93** (0.75) = the foot + the skirt (0.09) + 0.01 + the throw, **the deck 1.35** (1.22; the banks 0.13 longer); the build turns the crank every 6° and checks each piston's skirt above its cylinder's end (≥ 0.010) and its crown under the valves' heads (≥ 0.007), and the piston + rod against the cases' and banks' collision pieces (none) — ✅ the control (the old stroke) reads OUT OF ITS CYLINDER by 0.222 for all six; ⚠ the collision half not yet seen failing; ⭐ then again (*"I made the rod sturdier and the rod connection sturdier again … modify the crankshaft so the rod connection stays within the crankshaft offset"*): every rod **0.09 wide** along the crank (0.08; shank 0.0675, the small end too) and its big end **r 0.14** (0.12), and **every throw wider, its half-width 0.215** (0.2) = the rod's offset 0.1 + half a big end + 0.01 + the arm's radius — the two big ends on a pin between its arms, 0.010 clear of each (printed by the build); ⭐ the FLYWHEEL sturdier again (the owner's file: r **0.277**, **0.094** thick; 0.234 × 0.082) — ⚠ it hangs LOWER than the lowest pin, so the crank's resting proxy and the lower case's ghost floor moved down to its bottom (the crank axis − 0.277; computed as the part's lowest point — a resting proxy at a pin would have stopped A + dy 0.12 short of the goal); step 7 (the two heads, kind `head`, 0.16 of glass on each deck, each cylinder's two valves across the bank tilted ±0.3 rad — each valve its own object on its own axis for the level end, its cap, its grommet; 7 collision pieces a head: the slab and one per valve above it, the gaps between the caps open for the exhaust's stubs) built — every seat, way in and the crank's turn ✅; ⭐⭐ then (the owner's file: *"the block E14_head_B_mesh.001 should not exist and the bank should extend up to the position of this block … the rings of the cylinder … as for the rings of the valves … I shortened the valve stems and repositioned the stem caps"*): **no head glass** — the banks run 0.068 past the deck, the bores open there, their rings at the top; the stems shorter (the caps at 0.32 along the valve, 0.49 before, each stem into its cap); `E13`/`E14` the **VALVE SET** (six valves, caps, grommets) — ⛔ which then rested on nothing (the bores open, the valves within 0.145 of their axes: the control read NOT BLOCKED) → **a GLASS DISC per bore** (the owner: *"A glass disc per bore"*): r 0.312, 0.02 thick, its rim on the chrome ring, the valves through it, the grommets on it, part of the valve set — the exhaust's seat; the valve set's resting proxy at its valve heads' rims on a GHOST floor in the middle bore's mouth — ⭐ **each ghost floor names the ONE part it serves** (`for_part`: that bore holds the piston's deeper one too) (§5 item 9); ⭐ **the plinth and the lower case 20 % higher** (the owner: *"increase the height of the lower case and the plinth by 20% and move everything up accordingly"*): the plinth 0.374, the lower case 0.66, the crank axis = the plinth + 0.66 (y 1.034), every height above it following; ⭐ then (*"spread the pistons 1 and 3 further apart on x axis. increase the height of the lower case by 15%"*, *"i also modified the flywheel in my file"*): **the cylinders' pitch 0.8** (0.7; the outer bores 0.08 from the banks' ends, 0.2 of glass between bores; the inner bulkheads mid-way, ±0.4; the plinth's width FIXED at 3.35 — it followed the crank before), **the lower case 0.759** (×1.15; the crank axis y 1.133), **the flywheel 0.12 thick** (0.094) — every check ✅; ⭐ **the plinth ×1.1** (the owner's file, *"sturdier"*): 3.685 × 3.85, r 0.33, 0.412 high (0.52 × 0.54 m — a little past the cube's 0.49, the owner's look); ⛔ found reading it: the plinth's top-edge BEVEL had never been made (its edges picked at 1e-9 against float32 coordinates — none caught, silently, since step 1) — fixed (1e-6, and an assert); step 8 (the two exhausts, each its own: per cylinder a flange on its valve set's DISC — the disc tops now face proxies, the exhaust's route and seat — a stub bent halfway into the collector, the dead end 0.14 past the first stub, the rear open; 4 collision pieces each) built — ⛔ first blocked 2 mm off the goal: the stub's first ring, square to its leaning start, dipped 0.018 into the disc (and its collision piece was padded downward) → the stub starts on the flange's TOP, its collision from the tube's own vertices; ✅ both ways in clear, every check; ⭐ then (the owner's file: *"make the exhaust less vertex-intensive … I moved one of the exhaust's 3 curved pieces to the left of their valves … reverse the opening and closing of the exhaust"*): **the two exhausts MIRROR images** — bank A's stubs 0.17 BEHIND their bores, bank B's in front; **both collectors OPEN at the FRONT** (0.165 past the case's front face) and **closed at the rear** (0.14 past the last stub); **light**: 8-sided stubs, 5 steps a path segment, a 12-sided collector and flanges — 662 vertices an exhaust (2,760 before); ⭐ then (*"your exhaust cap is poorly drawn … make it a regola d'arte … Shade smooth the exhaust, and the exhaust curved parts … separate objects"*, *"also shade smooth the crankshaft"* — *"I mean shade auto smooth"*): the collector ONE revolved profile (the dark bore and the lip at the open front, the wall, a flattened DOME on the wall's own last ring — no sphere pushed into a cylinder; 122 vertices, closed), each stub and the flanges their OWN objects, the exhausts and the crankshaft AUTO SMOOTH (30°); ⭐ then (*"the joint of the exhaust curved parts is not good"* · *"increase the vertex number slightly … so that the shade auto smooth can toggle"* · *"shade auto smooth all the parts in the scene"*): each stub leaves its flange SQUARE to it (a straight lead, its first ring flat on the flange: checked, spread 0); the exhausts 14-sided (8, 12 — at or past Blender's 30°), the rings' tubes and the valve stems 14 round; **every visible part AUTO SMOOTH 30°** (70 meshes, ≈ 24,400 vertices in all); ⭐ the cases and the banks BEVELLED — first by a modifier (3 segments, every edge: the upper case 2,840 vertices), then (*"revert your 3 segment modifier … Just bevel the outer edges of the cases and banks (not the inside geometry). apply shade auto smooth"*) **only the OUTER shell's edges, before the cuts**: 0.01, 4 segments (22.5° apart — round under auto smooth 30°, 3 would sit exactly on it), applied in the mesh, the bores, saddles and slots sharp — the upper case 823 vertices, the banks ≈ 450; **the bore rings ON the bank's top face** at the bore's edge (*"make the rings level with the bank face (gap in red shall be zero)"*: r 0.312, lifted by their tube's radius — measured gap 0; every torus starts its tube at its lowest point); **the valve set's discs INSIDE the rings, LEVEL with them** (*"these yellow volumes shall be level with the rings"*): r 0.30, on the bank's top face, 0.024 thick — measured: top on the rings' top, bottom on the face (±0.000001); the exhaust's flanges on them; ⭐ then (the owner's file: *"I grabbed the closure of the cylinder to lower it inside the ring. I also modified the rotation and position of three of the rings for the valves. do the same for the other rings"*): every disc **sunk 0.0055** into its bore (its top under the ring's top — its collision still ON the bank's top face, the seat), every valve's grommet **FLAT on its disc** (square to the bank's axis, round its stem, on the disc's top — measured); **the crankshaft simpler** (*"too many vertices here"*): ONE 16-sided tube along its bent centre line, the knees rounded bends (r 0.075, 4 steps) — 992 vertices for 3,040, the flywheel its own object; ⚠ an arm is only 0.15 between two bends of a 0.06 bar, so the bends' insides turn about 0.015 and SHADE as a crease (no face crosses another — measured); the shading tried at 180° with the caps sharp — open for the owner; **the crank's front end FLUSH with the case's front face** (*"i moved the end of the crankshaft flush with the vertical faces"*; −1.431 before) — the pulley's seat; ⭐ **every piston HOLLOW from below** (the owner's file: *"I modified the lower face of one of the pistons to inset it so we can see the end of the rod inside the piston. Make something similar, but limiting the number of vertices inside"*): one revolved profile — the outer wall, the crown, a 0.026 rim (0.28 → 0.254), ONE inner band up to a ceiling 0.10 above the wrist pin (clear of the small end's 0.06) — the interior one ring and a pole; 194 vertices a piston (96 closed; the owner's inset ≈ 336), closed, its collision the same cylinder; ⭐ **lighter, cleaner hidden geometry** (*"I see some bad blender geometries in the hidden faces. make it better, less vertices. For example the valve heads"*): each valve ONE revolved profile (the stem from inside its cap, the head, its seat face; 16 sides — 66 vertices, a 28-sided head with a stem pushed into it before), the caps 16 sides, the glass discs 32, every TORUS light and smooth all over (no real edge: the bore rings 32 × 8, the piston rings 32 × 6, the grommets 12 × 6 — 40 × 14 / 20 × 14 before) — the scene ≈ 16,300 vertices (≈ 25,000); ⛔ *"crankshaft: you have duplicate vertices. clean that"*: an arm exactly two bends long (r 0.075) gave the same ring twice, six times — the bends now skip a repeated point, and the redundancy check reads EVERY visible mesh (it read the glass and the proxies only: it had missed it) — which then caught the crowns' numbers (Blender's text conversion doubles the outlines: welded, resolution 3) — the crank 896 vertices, the scene 13,457, none redundant; ⭐ *"the three sections highlighted in pink are bad geometries … not a stubby look at the curve"*: the rings where an arm's two bends meet were TILTED 11° (each ring stood square to the average of its two segments, which in an S both lean toward the axis — a pinch); now every ring square to the curve's EXACT tangent (a straight's own, an arc's own) — ⚠ a fine crease stays on each bend's inside (the bar 0.06 round a 0.015 inside radius: the arm's 0.15 allows no wider bend) — ✅ closed by the owner's look (*"crank is ok now"*, with the support rings below): kept as built; ⭐ **SUPPORT rings** (the owner's file: *"add bevels just next to the last sections before a curve so that the turn is crisper … repeat for the other turns"* — his two at 0.0033 / 0.0042 off a bend): a ring 0.004 from its bend on every straight that meets one (the journals' and the pins' ends — 12; the arms, two bends with no straight, none) — the crank 1,088 vertices, clean; ⭐ *"Shade auto smooth not latching on E15_exhaust_A_flanges. do better"*: the flags were right (smooth, 30°, 25.7° between sides) but a 14-sided coin 0.02 thick is one band of faces between two hard edges — each flange now ONE revolved profile, 24 sides (15° apart: smooth), its two rims CHAMFERED 0.004 (45°: crisp) — 98 vertices a flange; ⭐ **the FINISH PASS** in the build (the workflow's, `PART_AUTHORING.md` §4.1 item 5): the hidden faces (each piston ring's inner half, each stem's top in its cap, each stub's ends in its collector and flange, the bar's end in the flywheel), the caps' poles, auto smooth everywhere — the scene 13,809 vertices; ⭐ *"no need for bevel at the edges of the banks which snap with the surface of the upper case"*: each bank's FOOT edges left sharp (the foot flush on the slope — a rounded edge left a groove along the joint), its other edges bevelled; then (*"same for the edges of the upper case which snap with the edges of the lower case and vice versa"*) every SEAT face's edges sharp: the lower case's top and bottom (on the plinth), the upper case's bottom and its two slopes (the banks' feet flush to the top's edge); ⭐ *"upper case: what are these edges for ? clean the geometry"* · *"same for banks"*: they were BRIDGES — a face cannot hold a hole, so each holed flat face kept arbitrary edges to its holes; every glass part with holes is now split by planes x = const through each hole's centre (the bores; the lower case's compartments) — each hole two notches — and every other edge inside a flat face dissolved: the only edges left in the flat faces are those straight cuts; ⭐ every rod's shank CHAMFERED (the owner's file: *"I bevelled part of the rod. reapply for all rods"* — all twelve edges, 0.0033, one segment; 156 vertices a rod, his A1's exactly); ⭐⭐ **the FLYWHEEL at the FRONT, the PULLEY at the REAR** (the owner: *"extend the crankshaft and move the flywheel to the other side of the crankshaft (I thought it was the pulley)"*): the bar runs 0.094 past each end face of the case, the flywheel (r 0.277, 0.12) in front, the crank's REAR end the pulley's nose (its seat marker and face now there, facing +x); **step 9 (the pulley `E17`, symmetry `spinFree`) built**: Appendix B's hammered pulley (r 0.34, 0.1; a revolved profile, its rims chamfered), its dark disc, hub and off-axis pin standing proud of its outer face, one collision piece, its inner face its seat — ✅ its seat on the crank's end, its way in along the axis from behind clear, its control BLOCKED; ⚠ §2.3's step 16 and §2.2's `E17` row said the FRONT (the reference's): the rear now; ⭐ **the rod CAPS** (the owner's file: *"create the counter closure of the rod connections (see my file) and update the md files to make the counter closure appear in the game when the piston-rod is seated"*): per rod the big end's other half (r 0.06 – 0.14, 0.09 wide; 84 vertices, his exactly), `E0x_rod_cap`, a child of its rod, no collision, `appears_when_seated` — the way in swept without it, the crank's turn checked with it (no collision) (§5 item 10; `PART_AUTHORING.md` §3bis); ⭐ the flywheel smaller and closer (the owner's file: *"I modified the wheel at the end of the cranskshaft"*): r 0.179, 0.084 thick, 0.057 in front of the case (0.277 × 0.12 at 0.094) — still the crank's lowest point, its resting proxy and ghost floor following; ⭐⭐ **THE ENGINE RUNNING, checked before the game** (the owner: *"how can we check that the animation will be ok in babylon/ts pipeline ? … no interference of the pieces when the crankshaft is rotated"*): the build poses every moving piece by Appendix B's `update(θ)` every 6° over the 720° cycle and tests their MESHES against every other part (known contacts named: the big ends and caps on their pins, the pulley on the crank), bakes the same poses as keyframes (frames 1 – 96 = 720°, a preview to scrub), and writes `animation_golden.json` (the poses every 30°) — the golden vectors the TypeScript port must reproduce (§6.5); ⛔ its first run: **every valve in its own piston** (the reference opens a valve 0.07 at its piston's top dead centre, 0.007 above the crown — its preview let them pass through) → ⭐ **VALVE POCKETS** (the owner: *"Valve pockets in crowns"*): per valve, the space its head sweeps relative to its piston over the cycle, 0.006 wider, cut from the crown (the crown stays closed); the crown's name beside them (0.11, toward the rear) — then (*"bad geometry in blender for the recesses: the surface is not flat any longer"*) each pocket a CLEAN CYLINDER along its valve's axis as the piston sees it (24 sides, a flat floor; r 0.096, its floor 0.078 below the valve's seat — sized from the sweep's positions that reach the crown only; the hull's facets had bent the crown's shading) — ✅ the engine runs 720° with no interference; ⭐ the GEOMETRY REVIEW's first runs (§4.3 item 1): ⛔ **every TORUS was inside out** (the bore rings, the grommets, the piston rings — their faces wound inward: invisible in a game engine, which draws a face's front only; Blender shades both sides) → fixed; its own two traps fixed (materials compared with `is`; stale world matrices); the shank chamfer's buried corners marked crisp; ✅ nothing inside out, auto smooth latching everywhere, only the pulley's disc and hub mostly unseen (80 + 40 vertices: left); ⭐ **THE FACE PROXIES' REVIEW** (`Assets/Blender/scripts/review_proxies.py`, §4.3 item 3; `world0_scene_2_engine_review.blend` — its renders deleted, none kept: the owner, *"no need to have review renders"*): no face near 45° (the decks, slopes and banks' faces AT 15° off it: the 120° V's choice — they pass), none narrow, every ghost named; ⚠ **one finding — step 5: the upper case's two SLOPES, the banks' route, each FOUR strips 0.1 wide between its three bore openings** (the gizmo would stutter strip to strip) — open for the owner (a ghost face bridging each slope for the banks, or accept); ⚠ the review shows every placed part's proxies, the covered ones too (the face map reads only the exposed: W6 measures); ⛔ *"in step 5, why there is a gap"*: the upper case's TOP proxy had reused its collision's boxes, which stop at the plate's INNER width — a strip open along each top edge, between the top and its slope (the gizmo would have fallen into it) → the top proxy to its OUTER edges (z ±0.3935, meeting the slopes; the rods' slots kept open); ⭐ *"ghost floors shall be connected to real surfaces … Then correct to full-deck ghost"*: the valve sets' ghosts FULL-DECK (the bank's whole outline at the valve heads' depth; a 0.2 square in the middle bore's mouth before) — ✅ connected; the build now names every floating ghost: ⚠ the crank's (0.131 off the lower case's walls) and the six pistons' (0.63 – 0.83 off their banks — below the feet, in the cases' cavity) — the pistons' kept as the NAMED exception until the owner chooses (rehost on the cases / the mouth capture / guided along the bore); the crank's widened to the tub's inner walls (✅ connected); ⭐ **the slopes' GHOSTS** (the review's step-5 finding): each slope whole, for its bank, bridging its bore openings; ⭐⭐ **THE PROXY SANITY built** (the owner: *"update the md files accordingly, then proceed to check and rebuild"*; `PART_AUTHORING.md` §3): it found the decks', feet's and slopes' openings SQUARE round round bores (glass left out; cracks round the discs) → ROUND openings (`holed_strips`: strips cut through each bore's centre, an arc on each side) — ✅ fidelity, coverage, continuity, floating, reachability, simplicity all clean; the real steps reported (each disc on its ring, 0.0185); the review all green; ⭐ then the owner's look at the review: the top still open along x at each end (0.05) → OUTER on every axis; the slopes' ghosts over the real slope → the bore discs only; a 'floating' face (the crank's nose: real, its part hidden by the review) → the review shows the parts, the check names lone proxies; the bulkhead tops and the slopes' bottoms missing → added; ⛔ 25 proxy faces facing the wrong way (the plinth's top, the crank's ghost, the rim's strips …) → the ORIENTATION pass (before the save — it ran after it once); the ghosts' dives reported — ✅ every check clean, the review green at every step (`PART_AUTHORING.md` §3 item 3, the mistakes ⓐ – ⓖ); ⭐⭐ **the checks PROVEN** (*"do a full rebuild … so we can check if our workflow and check are working properly"*): `CHECK_CONTROLS=1` plants six defects — all six CAUGHT, after three corrections of the checks themselves (a face's centre blind on notched faces; cracks inside one proxy object unseen; a crack only across an edge between same-facing faces, untouched — `PART_AUTHORING.md` §3 item 3 ⓗ – ⓙ); the normal build clean on every check, the review green at every step; ⭐ the cases WIDENED to the banks' edges (§6.2's amendment); the plinth WRAPPED in the preview HTML's `woodV` texture (the owner: *"wrap a wood texture image on the plinth (same wood pattern as your html)"* — the same seeded draws, `textures/wood_v.png`, packed in the .blend, one tile a unit) — the script now checks each seat pair (anti-parallel, coincident) and each way in (the collision pieces swept back along it against every earlier part, with a control 0.05 past the goal that must read BLOCKED). ⭐ **Superposed faces** (the owner, 2026-11-13: *"you have a lot of superposed faces. check for example step 3. this is not caught by your checks"*): a new check ⑨ (`PART_AUTHORING.md` §3, ⓚ–ⓜ) — no duplicate left; the SEATS listed (the plinth's top ↔ the lower case's bottom, the cases' split, the slopes ↔ the banks' feet, the crank's nose ↔ the pulley); the pulley's inner face found facing INTO it (turned); the review draws seats grey, set back 3 mm; the controls (7) all caught. ⭐⭐ **The ghosts AT THE MOUTH** (the owner: *"the ghost face shall be aligned with the outer face … Then, we will create a special snap to plunge the pistons inside the cylinder hold … In such case, the ghost face shall always be a face aligned with the assembly face where the hole exits"*; and *"step 7: why the ghost faces are recessed ?"*): the crank's ghost now the tub's opening at the split, the pistons' and the valve sets' the bores' mouths on the deck — each flush, connected (the pistons' no longer floating), carrying its plunge; a new check ⑩ ghost flush, its control a ghost recessed down a bore (8 controls, all caught). ⭐⭐ **STEP 10, THE EXPORT** (the owner: *"commit and continue"*): `world0_scene_2_engine.glb` — 1.47 MB, 280 nodes (17 parts, 81 render meshes, 96 `UCX_`, 31 `UFM_` incl. 11 ghosts, 48 markers, 6 hinges), 30,416 vertices; read back clean, its axes control caught (`PART_AUTHORING.md` §4.4). W4's second half — the loader (`3D4`) — is the game's. ⭐ **Metadata and collision** (the owner, 2026-11-13): the crowns' names their own `metadata` objects (removed, then restored); the exhausts' stubs' collision a flange cylinder + a chain of 4 cylinders each (one hull of the bent tube before), the valves' two cylinders each (cap, stem — a cone of slivers before); `UFM_E13_rest` explained (the valve set's resting face, at its goal inside the bores: virtual, it moves with its part). The `.glb` 1.48 MB, 316 nodes (132 `UCX_`), 30,380 vertices; 77 checks. ⭐ **Why the checks missed them** (the owner: *"check the md files why these exhaust connectors and valve caps faces have failed the checks for simplification"*): no check read a collision piece's shape — now COLLISION SIMPLICITY (≤ 24 vertices, ≤ 48 triangles), which also found the crank's arms (72) and the plinth (140): simplified. ⭐ **The crowns** (*"some of the pistons' top face are still not flat"*): flat, but shaded 8.6° off by the pockets' 17° floors — every flat cap's edges sharp now (the finish pass), FLAT CAPS checked; the plinth's own 35°. 11 controls, all caught; 79 checks; the `.glb` 1.47 MB, 316 nodes, 30,288 vertices. ⭐ **The final stage's look** (the owner, 2026-11-13: *"collision layer has two valves cap misaligned"*): the export had posed θ 0 — B1's second and B2's first valve part open, 0.061 off their collision; the goal now every valve CLOSED, the preview's keyframes detached during the export, check ⑫ THE BUILT POSE (every node where it was built; its control caught) — `PART_AUTHORING.md` §4.4 item 5; 12 controls. The chrome black in the game (no environment) → `Assets/Environment/sky_sand.hdr`, generated (`SCENE_WORKFLOW.md` §6.4 item 3). ⭐ **The floor in the file** (the owner: *"the floor is much larger in blender compared to the assembly than what it is in the scene"*): the preview's floor was 24 units (3.4 m) for the game's 2 m → `FLOOR` exported, 14.29 units (2 m), sand yellow, one face one-sided, corners r 0.165 (half the plinth's 0.33); the game draws it instead of `Scene_1`'s floor body, `D128` / `D196` on it; the glass the owner's (his file, after *"too transparent"*: metallic 1, roughness 0.3025, alpha 0.43 — 0, 0.03, 0.26 before; then roughness **0.75**), the world the game's sky, Standard colour (`SCENE_WORKFLOW.md` §6.3 item 1). ⭐ **The game's lights MIRRORED in the .blend** (the owner: *"do it"*): Scene_1's two spots, directional, ambient fill and background, the sky ×`envIntensity`, read from the game's files by the build (its stand-in sun deleted) — ⚠ the owner finds the game's lights TOO BRIGHT on the engine; the mirror shows the same (the floor burnt white): a white face up gets the directional ≈ 0.91, the ambient fill 0.35 and the sky ≈ 0.8 — the fill and the sky both stand for the ambient light. ⭐⭐ **Then THE CREAM STUDIO** (the owner, from a reference picture: *"atmosphere_C_between_floor.png is the setup I want. build that"*): `Scene_2`'s OWN lighting — a soft warm key (directional 10.6 at 40°, 60.4° left of the boot view, 4800 K, soft shadows 25°), the generated `studio_cream.hdr`, no hemispheric fill, the backdrop BFBCB7 (a creamed night blue tried, reverted), ACES at exposure 0.89 (*"lower the lights a little so the player can stay in the game longer"*, then *"+5%"*), contact shadows (screen-space first; then BAKED per part and per pair in the build — 151 terms, 43 kB gzipped — switched on when both parts are seated: `SCENE_SETUP.md` §6.3, §6.4; ⭐ a W5 requirement: `applyContactShadows` at every pick-up, seating, undo and reset); the floor IVORY EFE5D0; mirrored into the `.blend` and matched to render C from its camera — `40_RENDER_SCENE/spec/SCENE_SETUP.md` §4. ⚠ The device's cost of the contact shadows and soft shadows: open.

## 4. ⛔ Open

* ✅ ~~The owner's APPROVAL of this plan~~ — given 2026-11-12 (*"plan approved. commit. proceed"*); ✅ amended by §2.7 (the owner: *"1- agreed …
  2- make the banks whole again"*).
* ✅ **The radii's departure from Appendix B** (§2.9 item 2): bore 0.30, piston 0.28, big end 0.085 — APPROVED (the owner, 2026-11-12: *"new radii approved"*).
* ✅ The V at 120° (§2.10), decided on the owner's instruction (*"increase or decrease the inclination to avoid 45 degrees"*).
* ✅ **W2's sheet** (§6) — APPROVED (the owner, 2026-11-13: *"W2 sheet approved"*).
* ⭐⭐ **W4 → W7, the order** (the owner, 2026-11-13; `SCENE_WORKFLOW.md` §6.4): ✅ the SLICE — the plinth (the anchor), the lower case, the crankshaft,
  the pulley (*"1 ok"*); the loader `@babylonjs/loaders` (*"2 ok"*); then ① **the FINAL STAGE** — the whole engine assembled in the game, settling the
  scale, the lights, the background (*"that's the goal the player has to achieve"*); ② **the BOOT STAGE** — the parts laid out in their heaps (*"so we
  can lay the parts properly"*); ③ the PLAYABLE slice (*"then the slice of playable game"*). Each ⛔ gated by the owner's look.

## 5. What the GAME must gain for this plan (requirements for the queue, once approved)

1. **Every placeable part the orbited piece in turn** — today ONE piece (the green one) is orbited onto its goal (`orbitGoals`): the player must pick
   the next part from the heaps, and the placed ones become the assembly the orbit runs on.
2. **An insertion** — the last straight move along an approach axis (the crankshaft into its saddles, a piston down its bore): ⭐ A + dy does it
   (§2.9); the slide and the contact are being rebuilt (`CLAUDE.md`, 2026-11-12: *"It has to be re-built properly"*).
3. **The `.glb` loader** (`3D4`), the **collision pieces** (`3D8`), the **face proxy** with its GHOST faces (`PART_AUTHORING.md` §3).
4. **Kinds for placed parts** (`FinalPose.kind`, `D183`) carried to the orbited parts; **a free spin** symmetry (the pulley).
5. **The heaps' generator** for a scene's parts (`core/demo_plan.ts`, today `Scene_1`'s).
6. **The running engine at the level's end.**
7. **The orbit's centre per step** (§2.8): redefined when a part seats (or when the player picks the next part), eased; and a player gesture to move
   it (`IN10`, queued: orbit about a chosen point). ⭐⭐ **BUILT (2026-11-13) for the boot — BROWSING** (the owner: *"at boot (ie before a part is
   picked up), the player shall be able to peep at the pieces therefore the player shall be able to move the center of the current orbit towards the
   piece of his choice. I would propose a click or first touch moves the orbit center to the point where the raycast hit the surface of a piece or the
   floor"*), then (*"the change of orbit center shall be done with one rapid tap followed by press (which drives the orbit). The translation of the
   orbit center shall be done as per the mm of delta input or at a certain minimal speed, whichever is fastest"*): with no part in hand,
   ① ⭐⭐ **EVERY PRESS** — a first touch (or the left button) whose ray hits a drawn part or the floor — **starts the centre's glide there AT
   ONCE, and that same press drives the orbit** (the owner: *"at boot, a press modifies the position of the center of the orbit (not any longer the
   tap + press). I am ok that each press changes the orbit center at boot"*; ⛔ before: a TAP armed the point and the press that followed within the
   double-tap window started the glide — *"one rapid tap followed by press"*); ③ ⭐⭐⭐ the centre GLIDES along the straight line to the point, its travel **PROPORTIONAL to the finger's**, arriving
   after **`browseArriveMm` of finger — 12 mm** (*"do 12 mm of travel instead of 30 mm"*; 30 first) whatever the distance — LINEAR, no ease (the owner: *"the center of the orbit shall reach its goal
   within a travel of xx mm of finger. Its travel shall be proportional to the finger travel"*); a still finger leaves it where it is (a CAMERA
   slider: *browsed centre: finger travel to arrive*). ⛔ (0) A glide at 1 screen mm per finger mm came first — replaced by this rule.
   ⛔ (1) First built on the centre BLEND of 2026-09-14 (commits `2590d16`, `08a6a65` — the barycentre's, approved *"Working"*: progress = finger
   travel over a fixed 30 mm, EASED): right for its ~10 cm re-centrings, wrong across the floor — a heap 0.7 m away moved ~25 mm per finger mm (the
   jumps) and the ease's slow start and end were the stalls (the owner: *"there are big jumps and stalls of the camera before the orbit center reaches
   its goal"*). ⛔ (2) A MINIMUM SPEED (time-driven, the larger of it and the finger: 40 → 80 → 240 → 120 mm/s) — REMOVED (the owner: *"remove this
   min speed entirely as the logic is wrong"*). The old principle kept: the press that drives the orbit carries the centre (`input/goal_lock.ts`
   `browseTargetOnPress`, `browseOnPress`, `browseGlideAt`; `render/pointer_wiring.ts`, `render/render_loop.ts`; the model's meshes in
   `st.modelBrowse`). Tested (`tests/browse_centre.test.ts`: proportional, the exact arrival at the set travel whatever the distance, a still finger).
   ⚠ **The orbit around the assembly with a part in hand** (`PIECE_ORBIT.md`, `ORBIT_ANY_SHAPE.md` — the pipeline's) needs an ORBITED PIECE: in
   `Scene_2` none exists yet (the parts are drawn, not bodies), so only the bare rig runs — `Scene_1`'s rings, tuned for the painting (the owner:
   *"it looks like the orbit is an old 3-ring orbit, and not the one we have built in this pipeline"*). W5's order: ① a `.glb` part as the orbited
   piece (its collision pieces, its face proxies as the faces the gizmo and the resting face read), picked from its heap by a tap; ② seating — the
   lower case only at its goal's yaw, the crank's plunge, the pulley; ③ the centre per step, the contact shadows and caps on seating, the rig tuned
   for the engine — the owner's look after each.
8. ⭐⭐ **The PLUNGE snap** (the owner, 2026-11-13; `00_CORE/QUEUE.md`): a part resting on a hole's ghost at its mouth (flush with the host's
   face) carried along the hole's axis onto its seat — the ghost's `plunge_axis`, `plunge`, `plunge_to`; with the mouth capture (§2.9 item 3: the
   gizmo held on the hole's axis) as its first half. 9 in this scene: the crank into the tub, six pistons, two valve sets.
10. ⭐ **The rod CAPS appear when their piston seats** (`appears_when_seated`, W3 2026-11-13 — the owner: *"make the counter closure appear in the
   game when the piston-rod is seated in its position"*): each `E0x_rod_cap` hidden while its piston + rod is held and goes down its bore (the big
   end must stay OPEN to pass over its pin), shown the frame the part seats (the goal capture), then turning with its rod in the level-end
   animation (`PART_AUTHORING.md` §3bis).
11. ⭐ **A SEATED face skipped** (W3 2026-11-13, the superposed check): a proxy face pressed on another part's, facing back (the plinth's top
   under the lower case, the cases' split, the slopes under the banks' feet, the crank's nose under the pulley — the build lists them) is not a
   route once both are placed: the face map never picks it (it would z-fight with its partner under the gizmo's ray).
9. ⭐ **A ghost floor read ONLY for its part** (`for_part`, W3 2026-11-13): one bore holds two at different depths (the piston's, the valve set's) — the gizmo must see only the held part's.

## 6. ⭐⭐ W2 — THE GEOMETRY SHEET (DRAFT 2026-11-12, ✅ APPROVED 2026-11-13)

⭐ Derived from the plan (§2) at the 120° V (§2.10), per `PART_AUTHORING.md` §3. Reference units (× 0.14 m), y up, the crank axis along x at y 0.81;
`y′ z′` a bank's own axes (its axis, its depth; bank A leans to −z, its inner side +z′). ⚠ Every number below is computed from Appendix B and §2.9 /
§2.10; the exact meshes, depths and connectors are made and CHECKED at W3 (the check script), never typed twice.

### 6.1 The rule every insertion follows here (the resting proxy and its ghost floor)

An inserted part (the crankshaft, each piston + rod) carries a **resting proxy**: one flat face SQUARE to its approach axis, CENTRED on that axis, at
its hull's extreme along the approach (`liftOf`'s support) — the face the orbit treats as its resting face. Its host carries the matching **ghost
floor**: a hidden flat face at the SAME place at the goal. So the gizmo, over the opening, stands on the ghost floor's centre (the opening's axis); A
+ dy brings the part straight down until its resting proxy meets it — the goal; the goal capture seats it (§2.9).

### 6.2 The parts

> ⭐⭐ **AMENDED AT W3 (the owner, 2026-11-13, on the step-5 build)**: *"increase the height of the upper case so it is flush with the edge of the bank;
> increase the width of the upper case so it is flush with the vertical edges of the lower case; increase the width of both the upper case and lower
> case so the length of the bank reduces slightly and the assembly looks more robust"* · *"the width of the upper and lower [case] shall be increased
> so that the edges are flush with the bank edge"* — so: **the cases z ±0.78** (= the bank's half depth / cos 60°: the lower case's top outer edge ON
> the bank's outer bottom edge; 0.625 below), **the banks' feet at y′ 0.675** (0.45 below; each bank 0.545 long, foot to deck — 0.77 below; no cut at
> the split any more), **the upper case's top at y 1.485, z ±0.39** (flush with the banks' inner edges; 1.16 / ±0.318 below). The pistons then sit
> partly below the feet: the upper case is cut along each piston body's way in as well as each rod's. The numbers in the table are the W2 sheet's;
> the script (`build_engine.py`) holds the built ones.
>
> ⭐⭐ **AND AGAIN FROM THE OWNER'S OWN FILE** (2026-11-13, `world0_scene_2_engine_owner.blend` — the first round trip, `PART_AUTHORING.md` §4.1):
> *"I have modify the flywheel (more robust), the width and height of the upper and lower cases, the height of the plinth … modify the bank outer
> dimensions so that the edges match with the edges of the upper and lower cases"* — read as: **the cases x ±1.281, z ±0.787**, the upper case's
> **top at y 1.434** (lower); the slopes KEPT at 60° (the file's scale had tilted them ~2°, which breaks the 120° V), so the top is z ±0.426; **the
> banks x ±1.281 and ASYMMETRIC about their bores' axis** — 0.393 outward (their outer bottom edge on the lower case's top outer edge), 0.327 inward
> (their inner bottom edge on the upper case's top edge); the crank's rear cap a **FLYWHEEL r 0.234, 0.082 thick**, 0.094 past the case's end, the
> journals stretched to the longer case — ⛔ the file's ×1.045 scale of the crank in z NOT taken (it makes the throws' circle an ellipse), the cylinders'
> pitch kept 0.7; **the plinth 0.312 high** (×1.2, re-saved: *"plinth change saved"*; 0.26 before) — the assembly stands on `PLINTH_H` (the crank axis
> = the plinth's top + 0.55: y 0.862, every height above it raised 0.052).
>
> ⭐ **The second round** (*"the cylinder hole was not centered on the bank top face. I therefore moved the left face of the bank higher up, also the
> top of the upper case to match. I made the lower case also more robust"*): **the banks SYMMETRIC about their bores, z′ ±0.393** (the inner face
> moved out; 0.327 before), **the upper case's top risen to meet their inner edges** (the crank axis + 0.681, z ±0.394; + 0.624 before) — the rule
> kept (flush), the hand-dragged numbers (0.373, + 0.699) not copied. ⚠ Not taken, asked: the file's crankshaft moved up 0.041 and its lower case
> ×1.011 in height.

| part | the shape (what the look shows) | face proxy (`UFM_`) — routes, seats, ghosts | collision (`UCX_`) | connectors (`MC_`) |
|---|---|---|---|---|
| `E01` plinth | the rounded plate, ⭐ DEEPER: 3.35 × 3.5 (was 2.55 — ✅ the owner, §6.4), r 0.3, h 0.26, a 0.015 bevel | its flat top as is (the rounded sides are no route) | its hull (convex) | `MC_E01_case` at the lower case's seat |
| `E02` lower case | a HOLLOW glass tub: x ±1.225, y 0.26 – 0.81, z ±0.625, walls 0.05; four saddle walls across it (the two ends and two bulkheads at x ±0.35) each with a half-round saddle (r 0.065) on the crank axis | the top rim (the split face, flat); ⭐ a GHOST floor across the cavity at the crankshaft's resting proxy at its goal (y ≈ 0.65: the lowest pin's bottom) | ~11 convex pieces: the floor, two long walls, each saddle wall in two (either side of its saddle) | `MC_E02_plinth`, `MC_E02_crank`, `MC_E02_upper` |
| `E03` crankshaft | as Appendix B: the bent bar (r 0.06), three throws (pins 0° / 120° / 240°, throw 0.2), knees, rear cap; the nose shoulder at the front | ⭐ its resting proxy: a flat face under the throws (y ≈ 0.65 at its goal), across the journals' length; the nose shoulder's flat (the pulley's seat) | ~12 pieces: the journals' bar segments, the three pins, the six arms (its hull would fill the throws and stop every rod) | `MC_E03_saddles`, `MC_E03_pin1`–`3`, `MC_E03_nose` |
| `E04` upper case | a HOLLOW glass TRAPEZOID prism: x ±1.225, bottom z ±0.520 at y 0.81, top z ±0.317 at y 1.16, its slopes the two banks' feet planes (60° steep); half-holes for the journals at its ends; open below each bore | the two slopes (the banks' routes and seats), the top face (the top cap, exposed in the V), the front face (the pulley's route) — all flat | ~10 pieces: the top, the two slopes each cut round its three bore openings (square), the two ends either side of the half-holes | `MC_E04_lower`, `MC_E04_bankA`, `MC_E04_bankB` |
| `E05`, `E06` bank | a glass box in its own frame: x ±1.225, `y′` 0.45 – 1.22, `z′` ±0.39, CUT at the case's split (y ≥ 0.81, §2.10); three bores r **0.30**, open through (foot and deck); a chrome ring at each bore's top | the DECK with three SQUARE openings 0.60 (the face map reads rectangles — round in the look); ⭐ per bore a GHOST floor at its piston's resting proxy at its goal (`y′` ≈ 0.10 for four, −0.20 for two — below the foot, in the case's cavity); the outer face (no seat now — the exhaust is on the head) | ~6 pieces: the two long walls, the two ends, the two partitions between the bores — every bore SQUARED 0.60 (§2.4 rule 6) | `MC_E0x_upper`, `MC_E0x_lower`, `MC_E0x_head`, `MC_E0x_bore1`–`3` |
| `E07` – `E12` piston + rod | a piston r **0.28**, h 0.32, its ring; its rod (l 0.75, shank 0.06 × 0.1) at its own angle (D2); the big end r **0.085**, ⭐ OPEN toward the crank (a half-ring, its tips at the pin's centre); its NUMBER on the crown (D2: told apart). ⭐ **ONE part, TWO meshes, ONE HINGE** (the owner, 2026-11-12: *"can they still be one part which is animated later on with a hinge ?"* → *"add"*): the ROD a child of the PISTON, its pivot on the piston pin (the small end, `y` = l in the rod's frame), turning about x (the crank's direction); an empty `HINGE_E0x_wrist` marks that axis. **LOCKED during play** at the cylinder's goal angle (D2) — the part is rigid while it is orbited and inserted; **free at the level's end**, where the game turns it (§6.5) | ⭐ its resting proxy: a flat face square to `y′`, centred on the bore's axis, at its lowest point along `−y′` (the big end's tips); the crown (no route) | its hull fits the bore (every big end within the piston's 0.28 — §2.9); ⚠ the open big end makes the hull CLOSE over the pin: two pieces (the piston with the rod, the big end's two arms) if the probe shows the hull blocks | `MC_E0x_rest`, `MC_E0x_pin`, `HINGE_E0x_wrist` |
| `E13`, `E14` head | a glass slab in the bank's frame, `y′` 1.22 – 1.38, `z′` ±0.39, x ±1.225; its six valves as Appendix B (head r 0.08, stem 0.018 × 0.5, hammered cap r 0.085, grommet), across the bank | its bottom (its seat on the deck), flat | the slab, and ONE piece per valve above it (stem + cap, 6) — ⛔ not one box over the caps' row: it would fill the gaps between the valves where the exhaust's stubs stand (4.9 mm beside each cap) | `MC_E1x_deck`, `MC_E1x_exhaust` |
| `E15`, `E16` exhaust | ⭐ per cylinder: a FLANGE (r 0.065) on the head's TOP face INSIDE the bore's ring (its edge 0.292 from the axis, the ring 0.30), next to the LOWER (outer) valve (`z′` 0.15) but offset ALONG THE CRANK on its FRONT side (−0.17; first +0.17, then the owner: *"move the stubs on the other side of the lower valves, inside the cylinders' top faces' circles"*) — stubs and valves alternate along the bank, the valves BETWEEN the stubs; one STUB (r 0.05) per flange, SLIGHTLY BENT HALFWAY, rising off the face then running out and a little down into the COLLECTOR (r 0.085, `y′` 1.48, `z′` 0.65); the collector's closed front (the DEAD END) stops 0.14 past the first stub — x −1.11 (bank A), −0.91 (bank B); the reference ran it to the engine's front (−1.175): gas would sit there — its rear end open — the owner's sketches, 2026-11-12: *"The exhaust shall be closer to the lower valves to receive the gas from the valves … make sure the exhaust and valves do not interfere during the game"*, *"the stub should leave from the top face of the cylinder close to the lower valve"*, *"stubs next to the valves but inside the top face's circle: the valves thus seat more or less in-between the studs … stubs which are slightly bent halfway … the exhaust pipe slightly shorter at its dead end"*. ✅ **No interference, measured**: a stub spans x 0.12 – 0.22 off its valve, the cap ±0.085, the stem and grommet ±0.045 — **0.035 (4.9 mm) clear at every height**, valve open or closed; the collector 0.23 beyond the caps. ⭐ So its way in is straight DOWN onto the top face (step 14). ⛔ Tried and rejected the same day: the stubs from the bank's outer face at 1.10; from the head's outer face at 1.30; from the top face OUTWARD of the valve (under its cap, the exhaust then forced sideways); a second exhaust per bank joined behind the engine | the flanges' bottoms — coplanar, flat — its resting face, on the head's top face (a REAL face: no ghost) | ~4 pieces: the collector, the three bent stubs (each its hull) | `MC_E1x_head` |
| `E17` pulley | Appendix B's: hammered pulley r 0.34 × 0.1, dark disc, hub, pin | its rear face (its seat on the nose shoulder), flat | its hull (convex) | `MC_E17_nose` |

### 6.3 The numbers to check (W3's check script, W6's probes)

* **Size**: the assembled box ≈ 3.35 × 1.96 × 3.5 units → 0.47 × 0.27 × 0.49 m at 0.14 (§2.10); the cube 0.49 × 0.483 × 0.483.
* **Clearances**: piston 0.28 in bore 0.30 (0.02 → 2.8 mm); the big ends at most 0.258 off their axes (§2.10's table); a rod's big end (x 0.09 thick)
  between its throw's arms (0.4 apart, r 0.06) — the reference's 0.005 overlap with the knees made 0.01 clear (the big end 0.08 thick); the upper case's
  half-holes round the journals (0.065 for 0.06).
* **The faces' thresholds** (`SCENE_WORKFLOW.md` §4): every route and seat face ≥ 15° from 45° of elevation — the decks and heads 30°, the slopes 60°
  (normals 30° up), the outer faces −60°, the tops and the plinth 90°, the walls 0° ✅; no two faces that must be told apart within 30° — ⚠ the deck
  (30°) and the slope beside it (normal at 30°, the same heading) are PARALLEL: the slope is covered by the bank once it stands (a route only BEFORE),
  to be probed (W6).
* **The phone's budget** (rule 6): ~55 collision pieces in the whole engine; the worst step (a piston down its bore) near its bank (6), the crankshaft
  (12), the upper case (10), the other pistons — counted against 24 gap queries a frame at W6.
* ⚠ **The exhaust's way in**: down onto the head's top face, among the valve stems and caps (4.9 mm beside each cap) — the gizmo's route on a
  top face with six stems rising through it, and the collision pieces of the stubs and the valves (their caps' row, §6.2) to be probed (W6).
* ⚠ **The mouth capture** (§2.9 item 3) — not geometry: a requirement for the game (§5).

### 6.5 ⭐ The engine RUNNING (the level-end reward) — the GAME computes it

> *"if I want to animate later on the pistons in the game, shall the animation be done in blender and imported in the game ? or shall the game manage
> the animation itself ?"* · *"does that mean the rods need to be separate parts from the piston heads or can they still be one part which is
> animated later on with a hinge ?"* → *"add"* — the owner, 2026-11-12

* ⭐ **Checked in Blender, carried to the game** (2026-11-13): the build's 720° interference run on the MESHES; the baked preview; `animation_golden.json` — the TypeScript port's vectors must reproduce those poses, so what the run proved holds in Babylon (then W6's headless run).
* **The game drives it from ONE angle, the crank's** — Appendix B's `update(thDeg)` ported to `src/core` (engine-free, with golden vectors: every big
  end on its pin at every angle, each valve open once per 720° — the build sheet's own checklist): the crankshaft turns; each PISTON slides along its
  bore (the slider-crank); each ROD turns about its HINGE (`HINGE_E0x_wrist`) so its big end follows its pin; each VALVE slides along its axis (the
  timing; ⭐ at 120° the six fire evenly — §2.10). The render only applies the poses (`40_RENDER_SCENE/INDEX.md`'s rule).
* **Why not a clip baked in Blender**: the parts in the game are separate bodies the player placed, and a baked clip assumes Blender's hierarchy and
  poses; the motion is a formula, not artwork; the code reads the assembly as it stands and can be TESTED.
* **The owner's tools**: the game's tuning menu (the speed, the run-up and slow-down, how long it runs — sliders, on the device, no rebuild); the
  scene's data (which part moves how — written by Claude from the formulas); Blender to PREVIEW (the build script can bake the same formulas into
  keyframes, view only). ⭐ Free-hand decorative motion (a camera fly-through) can still be Blender keyframes in the `.glb`, played by Babylon's
  animation groups.
* ⚠ Needs, in the Blender file: each moving part's PIVOT where the formula turns it (the crankshaft on its axis, each rod at its hinge, each valve on
  its own axis) — set at W3, checked by the check script.

### 6.4 ⛔ Open for the owner

1. ✅ ~~Approve this sheet~~ — **APPROVED** (the owner, 2026-11-13: *"W2 sheet approved"*); W3 next, the Blender build script — ⛔ started only on the owner's go (the PC shared with other sessions' walks).
2. ✅ ~~The plinth DEEPER or the heads overhanging it~~ — **DEEPER, 3.5** (the owner, 2026-11-12: *"proceed with deeper plinth"*): at 120° the heads
   reach 1.39 from the centre line, the valve caps ≈ 1.66, the exhaust collectors ≈ 1.69, against the reference plinth's 1.275 — 0.42 (≈ 6 cm) over
   its edge each side; the 3.5 plinth (1.75) carries all of it. A look decision — the parts hold each other, nothing needs the plinth under it.
