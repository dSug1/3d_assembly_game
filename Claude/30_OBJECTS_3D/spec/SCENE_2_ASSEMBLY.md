# `Scene_2` — THE ENGINE: its brief (W0) and its ASSEMBLY PLAN (W1)

> **STATUS** · ✅ **W1 APPROVED 2026-11-12** (the owner: *"plan approved"*) · W2 next · ⛔ NOTHING BUILT · **OWNS** · `Scene_2`'s brief, its parts catalogue, its assembly steps, the rules' check, its decisions and what the game must
> gain for it
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
* **Its size** (proposed): 0.15 m per reference unit — the plinth 0.50 × 0.38 m, about `Scene_1`'s cube (0.49 m); a piston then 7.5 cm across.
* **The reference geometry the plan uses** (reference units, y up; the crank axis along x at y = `yc` = 0.81): the plinth's top at y = 0.26; the
  crankcase 2.45 × 0.9 × 1.25 from y 0.26 to 1.16; two banks tilted ±45° about the crank axis, each a glass box from 0.45 to 1.38 along its own axis
  (`deck` = 1.22), 0.78 deep, its three bores (r 0.27) open from 0.55 to the deck — bank A (tilted −45°) at x −0.8 / −0.1 / +0.6, bank B (+45°) at
  −0.6 / +0.1 / +0.8; the valves' stems rise through the bank's top to their caps above it; the exhaust stubs leave each bank's OUTER face at 0.86
  along its axis; the pulley at the crank's front end (−x), outside the case.

## 2. ⭐⭐ W1 — the plan

### 2.1 The owner's decisions (2026-11-12)

> *"D1- 6 pieces for the block (so we can insert the pistons and the crankshaft at the splits) as per attachment, ok for the rest of your 15 parts (now
> they are 19)"* · *"D2- ok, they cannot be interchangeable because they need to have a certain angle to match the crankshaft selected rotation
> degree"* · *"D3- plinth pre-placed (we always need to have a first part pre-placed at boot otherwise the player could choose whatever position in
> the scene and the goals would not be matching)"* · *"D4- see how the parts are placed in the demo scene. I want to emulate the same."* — the owner

* **D1 — THE GLASS BLOCK IN SIX PIECES** (the owner's sketch: the block in Blender, its split lines drawn): the CRANKCASE split HORIZONTALLY into a
  lower and an upper case — the crankshaft goes in at that split; each BANK split LENGTHWISE, along its own axis through the middle of its depth (the
  plane of its three bores' axes), into an INNER half (toward the V) and an OUTER half — the pistons go in at that split, laid into the half bores.
  ⭐ The case's split AT THE CRANK AXIS's height (y 0.81) — the owner: *"yes, where the crankshaft lies because that is where the player will have to
  seat it"* (the sketch drew the line lower).
  The heads, the exhausts, the pulley as proposed: **19 parts**.
* **D2 — six DISTINCT pistons**: each piston + rod is one rigid part at the goal's crank angle, its rod's angle its own — each fits ONE bore (to be
  told apart on the glass: e.g. numbered crowns, decided at W2).
* **D3 — the plinth PRE-PLACED** — and the owner's reason is a rule for every scene (the workflow's rule 9: an anchor at boot).
* **D4 — the boot as the demo's**: small HEAPS, dropped and settled, put down so that the next part to place is on TOP (§2.5).

### 2.2 The parts catalogue

| id | part | made of (the reference's pieces) | role | kind | symmetry |
|---|---|---|---|---|---|
| `E01` | **plinth** | the wooden rounded plate | PRE-PLACED, frozen (D3) | — | — |
| `E02` | **lower case** | the glass crankcase BELOW the split, with the four bearing saddles | PLACEABLE | — | a half-turn about the vertical (the saddles and the bosses mirror front–back) |
| `E03` | **crankshaft** | the bent bar, the three throws (pins at 0° / 120° / 240°), the rear cap | PLACEABLE | — | — (the throws are not symmetric; the nose at the front) |
| `E04` | **upper case** | the glass crankcase ABOVE the split, its roof the two slopes the banks stand on | PLACEABLE | — | a half-turn about the vertical |
| `E05`, `E06` | **inner bank half** ×2 | each bank's half toward the V, from its foot to its deck, its three half bores | PLACEABLE | ⭐ `bankInner` — bank A's and bank B's are ONE shape (the block's half-turn about the vertical maps one onto the other: bores at −0.8 / −0.1 / +0.6 onto −0.6 / +0.1 / +0.8) | — |
| `E07`, `E08` | **outer bank half** ×2 | each bank's half away from the V, its outer face (where the exhaust goes) | PLACEABLE | ⭐ `bankOuter` — one shape, as the inner ones. ⚠ An inner and an outer half are MIRROR images (the bores' x offsets), never one kind | — |
| `E09` – `E14` | **piston + rod** ×6 | a piston (its ring) and its rod, rigid at the goal's crank angle | PLACEABLE | each its own bore (D2) | — |
| `E15`, `E16` | **head** ×2 | a bank's glass above its deck (y′ 1.22 – 1.38) with its 6 valves (heads, stems, hammered caps, grommets) | PLACEABLE | ⭐ `head` — one shape (a half-turn about the bank's axis maps bank A's valves onto bank B's) | — |
| `E17`, `E18` | **exhaust** ×2 | a bank's three stubs and flanges, its collector (open rear end, front cap) | PLACEABLE | each its own (the open end is at the rear on both) | — |
| `E19` | **pulley** | the hammered pulley, its dark disc, hub and pin | PLACEABLE | — | about its axis (any turn — a NEW symmetry) |

⭐ 18 placements. ⭐ The valves are inside their head (a cap is too small to orbit — rule 5); the rods inside their piston (a rod alone would be a
step the player cannot see — rule 5).

### 2.3 The steps

| step | part | host | seat: part ↔ host | approach | turn at the goal | gizmo route | after |
|---|---|---|---|---|---|---|---|
| 1 | `E02` lower case | `E01` | its bottom ↔ the plinth's top | down | 2 ways (its half-turn) | the plinth's top | — |
| 2 | `E03` crankshaft | `E02` | its four journals ↔ the four saddles (flat proxies at the saddles' bottoms) | straight down into the saddles | 1 way | the case's split face, into the saddles | 1 |
| 3 | `E04` upper case | `E02` | its bottom ↔ the lower case's top (the split plane, the crank's half-holes) | straight down | 2 ways (its half-turn) | the lower case's top | 2 |
| 4, 5 | `E05`, `E06` inner bank half | `E04` | its foot ↔ the upper case's roof slope on its side | along the bank's axis, down onto the slope | 1 way per bank | the roof slope | 3 |
| 6 – 11 | `E09` – `E14` piston + rod | `E03` + its inner half | the piston ↔ its half bore (a flat proxy on each); the rod's big end round its pin | SQUARE to the split, into the half bore | 1 way | the inner half's split face, into the half bore | its bank's inner half |
| 12, 13 | `E07`, `E08` outer bank half | its inner half | its split face ↔ the inner half's split face | square to the split, closing it | 1 way per bank | the inner half's split face | its bank's three pistons |
| 14, 15 | `E15`, `E16` head | its bank (both halves) | its bottom ↔ the bank's deck | along the bank's axis, onto the deck | 1 way per bank | the deck | its bank's outer half |
| 16, 17 | `E17`, `E18` exhaust | its outer half | the three flanges ↔ the outer face | square to the face | 1 way | the outer face | its bank's outer half |
| 18 | `E19` pulley | `E03` | its rear face ↔ the crank nose's shoulder (a flat proxy) | along the crank's axis, from the front | any turn | the upper case's front face, the nose | 3 |

⭐ A partial order: after step 3 the two banks are independent of each other; within a bank: inner half → its three pistons → outer half → head and
exhaust; the pulley any time after step 3.

### 2.4 The rules' check (on paper)

| rule (`SCENE_WORKFLOW.md` §2.3) | verdict |
|---|---|
| 1. an order exists | ✅ the `after` column has no cycle; every host is earlier or pre-placed |
| 2. access | ✅ by the six-piece block (D1): the crankshaft at the case's split, the pistons at each bank's split. ⚠ The upper case (step 3) comes down over the crankshaft: its half-holes must clear the journals |
| 3. a seat for every step | ✅ flat faces everywhere but the round seats (journals, half bores, the nose) — flat PROXIES there (`PART_AUTHORING.md` §3). ✅ The rod's big end: OPEN (§2.6) |
| 4. the gizmo reaches it | ✅ on paper: every route is an open face at its step (a split face, a slope, a deck). ⚠ To be PROBED (W6): into a half bore |
| 5. a step is one action | ✅ the valves in their head, the rods in their piston |
| 6. the phone's budget | ⚠ the worst step: a piston into a half bore, beside the crankshaft and the other pistons — half bores are many collision pieces if round. ⭐ Proposed: half bores squared in the collision (3 slabs), round only in the look — decided at W2 |
| 7. symmetries and kinds | ✅ kinds: `bankInner` ×2, `bankOuter` ×2, `head` ×2; the lower and upper case a half-turn about the vertical (`yawHalfTurns`); the pulley's spin free (a new symmetry); the rest one way |
| 8. the end | every placeable part in its goal → the level ends; ⭐ the engine runs its 720° loop |
| 9. an anchor | ✅ the plinth, pre-placed (D3) |

### 2.5 The boot (D4 — as the demo's, `20_GAME_RULES/spec/DEMO_SCENE.md` §2bis)

* **Small heaps in a strip** between the floor's edge and the engine, in front as the boot camera sees it — ⭐ **one heap per TYPE of part** (the
  owner: *"at start, keep the same types of parts close together (for example the parts of the block, the pistons) so it reproduces the
  classification by color of the demo scene"* — it replaces Claude's one heap per material): the **block** (`E02`, `E04` – `E08`: the two cases and the
  four bank halves), the **crankshaft** (`E03`), the **pistons** (`E09` – `E14`), the **heads** (`E15`, `E16`), the **exhausts** (`E17`, `E18`), the
  **pulley** (`E19`) — six heaps, a single part its own (⚠ the crankshaft stands with the block in the steps but is its own type: chrome, a bar).
* **Dropped, not placed**: each part falls and settles by the game's own collision rule — flat on the floor, on a part, or leaning; a rest must hold
  (a part balanced on an edge is refused); **three parts stacked at most**, counted both ways the eye counts.
  ⛔ **NOT laid on its seating face** (the owner: *"I would not lie the parts on their seating face at start: I want to keep the same feel as the demo
  scene"* — it reverses Claude's first proposal for D4): a part lands at any yaw and on whichever face it settles on, as the demo's do; turning it
  onto its seat is the player's work.
* ⭐ **The order**: the parts reach their heaps in the REVERSE of the steps (the last step's part first), so within each heap the part the player
  needs next is on TOP of what is left — the demo's *"the last one down is the first one lifted"*. ⚠ The plan's partial order allows several play orders; the heaps
  are built for the steps' order above (step 1 on top).
* ⚠ Generated offline as DATA (the demo's `core/demo_plan.ts` way), its size checked against the strip (the crankshaft 2.9 reference units long —
  0.44 m — is the demo's *long bar* case).

### 2.6 ⭐ The rod's big end — OPEN, and the ONE axis of a piston's way in (decided 2026-11-12, for W2)

> *"(a). mark in the md file that we will have to be careful to design a face on which the pistons can slide to reach their goals as there will be
> only one axis on which the piston can slide to reach their goal, won't it ?"* — the owner

* **The big end** (the rod's end round the crank pin; the reference draws it as a solid chrome disc, r 0.1, 0.09 thick, the pin passing through it):
  ⭐ **(a) OPEN** — a half-ring, open toward the piston's way in, so it slides onto the pin and rests on it (a real big end's rod half, its cap left
  out). ⛔ Not (b), the cap drawn on the outer bank half (more pieces on the phone), nor (c), the disc with the rod–crankshaft collision ignored (an
  exception to the collision rule, the overlap visible).
* ⭐⭐ **ONE AXIS — yes, and a strict one**: a piston + rod reaches its goal only SQUARE TO ITS BANK'S SPLIT (the bank's own depth axis, `z′`) — the
  one direction along which the half bore's opening, the big end's open side and the crank pin all line up; any other direction meets the half bore's
  wall or the pin. ⚠ So at W2 the geometry must be designed for it, carefully:
  * **the face it slides on** — the inner half's SPLIT FACE (a flat proxy), the gizmo running on it to the half bore's mouth, then INTO the half bore
    (the real depth, D3) down to the seat: a flat proxy at the half bore's floor, parallel to the split, where the piston rests;
  * **the big end's opening faces `z′` for EVERY piston** — each rod has its own angle (D2), so each opening is turned in the rod's frame to face the
    same bank direction;
  * **nothing else on the way**: the piston's way in along `z′` is clear of the pins and the throws of the other pistons and of the crankshaft's arms
    — checked on the geometry at W3 (the check script) and walked at W6 (the probes).
* ⭐ The same holds for the **crankshaft** (step 2): ONE axis, straight down into its four saddles — the lower case's SPLIT FACE its sliding face, a
  flat proxy at each saddle's bottom its seat.

## 3. What is NOT decided here

The geometry (W2: the proxies' exact faces, the collision pieces, the big end's exact shape (open — §2.6), the pistons' marks, the connectors' names),
the Blender build (W3), the level data (W5) — each after this plan is approved.

## 4. ⛔ Open

* ✅ ~~The owner's APPROVAL of this plan~~ — given 2026-11-12 (*"plan approved. commit. proceed"*). Next: W2, the geometry.

## 5. What the GAME must gain for this plan (requirements for the queue, once approved)

1. **Every placeable part the orbited piece in turn** — today ONE piece (the green one) is orbited onto its goal (`orbitGoals`): the player must pick
   the next part from the heaps, and the placed ones become the assembly the orbit runs on.
2. **An insertion** — the last straight move along an approach axis (the crankshaft into its saddles, a piston into its half bore) — the slide and the
   contact are being rebuilt (`CLAUDE.md`, 2026-11-12: *"It has to be re-built properly"*).
3. **The `.glb` loader** (`3D4`), the **collision pieces** (`3D8`), the **face proxy** (`PART_AUTHORING.md` §3).
4. **Kinds for placed parts** (`FinalPose.kind`, `D183`) carried to the orbited parts; **a free spin** symmetry (the pulley).
5. **The heaps' generator** for a scene's parts (`core/demo_plan.ts`, today `Scene_1`'s).
6. **The running engine at the level's end.**
