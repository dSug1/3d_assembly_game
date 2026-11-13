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
  told apart on the glass: e.g. numbered crowns, decided at W2).
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

### 2.6 ⭐ The rod's big end — OPEN, and the ONE axis of a piston's way in

> *"(a). mark in the md file that we will have to be careful to design a face on which the pistons can slide to reach their goals as there will be
> only one axis on which the piston can slide to reach their goal, won't it ?"* — the owner

* **The big end** (the rod's end round the crank pin; the reference draws it as a solid chrome disc, r 0.1, 0.09 thick, the pin passing through it):
  ⭐ **(a) OPEN** — a half-ring, open toward the piston's way in, so it slides onto the pin and rests on it (a real big end's rod half, its cap left
  out). ⛔ Not (b), the cap drawn on another part (more pieces on the phone), nor (c), the disc with the rod–crankshaft collision ignored (an
  exception to the collision rule, the overlap visible). ⭐ With the way in DOWN THE BORE (§2.7), the opening faces the CRANK (`−y′`): the big end
  lands on its pin like a fork on a bar.
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
2. ⭐⭐ **The radii — the reference's do NOT let two rods down their bores**: a big end lies |z′| = 0.193 off its bore's axis for two cylinders (§2.7)
   and its radius 0.1 reaches 0.293 — wider than the bore (0.27). ✅ APPROVED (W2, a departure from Appendix B — the owner: *"new radii approved"*): **bore 0.30, piston
   0.28, big end 0.085** (the pin 0.06: a wall of 0.025) — every big end then within 0.278 of the axis, inside the piston's own footprint, so the WHOLE
   part (even as one convex hull) goes down a 0.30 bore with 0.02 to spare (3 mm at 0.15 m a unit); the piston's 0.28 keeps it snug, as the reference.
3. ⚠ **Aiming at the mouth** — 3 mm of play: the gizmo must be ON the bore's axis when the descent starts, which a finger cannot hold. ⭐ Proposed: a
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

The level data (W5). ⭐ **W3 STARTED 2026-11-13, STEP BY STEP** (the owner: *"script in blender step by step so I can have a look and review what is built in blender step by step"*): `Assets/Blender/scripts/build_engine.py -- --step N` rebuilds the .blend up to step N (1 plinth · 2 lower case · 3 crankshaft · 4 upper case · 5 banks · 6 pistons · 7 heads · 8 exhausts · 9 pulley · 10 the .glb), renders `previews/step_NN.png`; the owner reviews each step before the next. ✅ Step 1 (the plinth) reviewed OK by the owner; step 2 (the lower case) reviewed OK; step 3 (the crankshaft) built; step 4 (the upper case) built — its top first cut away by the six bores' whole lines of descent (only a skeleton left, 22 collision pieces), then (the owner, 2026-11-13: *"(b)"*) cut ONLY where the rods really pass: each rod's swept hull along its bore — two narrow slots (A1, B1, the pins leaning toward the V), the top plate kept, 19 pieces; the pistons NOT made smaller (offered by the owner: a piston never leaves its bore, only its rod reaches the case) — the script now checks each seat pair (anti-parallel, coincident) and each way in (the collision pieces swept back along it against every earlier part, with a control 0.05 past the goal that must read BLOCKED).

## 4. ⛔ Open

* ✅ ~~The owner's APPROVAL of this plan~~ — given 2026-11-12 (*"plan approved. commit. proceed"*); ✅ amended by §2.7 (the owner: *"1- agreed …
  2- make the banks whole again"*).
* ✅ **The radii's departure from Appendix B** (§2.9 item 2): bore 0.30, piston 0.28, big end 0.085 — APPROVED (the owner, 2026-11-12: *"new radii approved"*).
* ✅ The V at 120° (§2.10), decided on the owner's instruction (*"increase or decrease the inclination to avoid 45 degrees"*).
* ✅ **W2's sheet** (§6) — APPROVED (the owner, 2026-11-13: *"W2 sheet approved"*).

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
   it (`IN10`, queued: orbit about a chosen point).
8. ⭐ **A mouth capture** (§2.9 item 3): over an opening the held part goes into, the gizmo held on the opening's axis.

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
