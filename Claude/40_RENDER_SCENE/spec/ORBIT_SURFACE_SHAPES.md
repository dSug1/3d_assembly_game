# THE ORBIT'S SURFACE — the shapes, the study, the consolidation of the rules (companion of ORBIT_SURFACE.md, 2026-11-16)

> ⛔⛔ **PROPOSED, FOR THE OWNER'S REVIEW. NOTHING BUILT IN THE GAME, NO GAME CODE CHANGED.** The third step of [ORBIT_SURFACE.md](ORBIT_SURFACE.md)
> (branch `1.0.146s-Orbit-surface-spec`): an offline study of basic geometries and topologies with surface singularities (commit `903e50d`), then
> the rules consolidated from its evidence (this file §6, the specification §2, §3, §5, §8). Every rule marked **[PROPOSED]** is a reading of the
> study, NOT the owner's decision until he says so.
>
> **The owner's request (2026-11-16, verbatim):** *"I suggest you complement this set of rules by doing like you did for the orbit charts: you
> elaborate some basic geometries or topologies with surface singularities and you consolidate the rules you have drafted, or amend them, or add
> rules which are missing to cover cases we did not consider."* — and about how it is run: *"Make sure you manage the load on my computer"*.
> His standing instructions on these rules (the same day, §0bis of the specification): *"do not propose ad hoc rule for each geometry"*; the earlier
> rules were *"taken ad hoc to simplify. If they conflict with other decisions or if geometry or topology requires a better decisions, propose it."*;
> S17's spirit: *"at far or medium distance, a singularity at the surface does not impact the orbit of the piece - camera ... At close in, this rule
> is overruled by collision rule, etc."*
>
> Moved here from the specification at this step, so that it stays under its line budget: its §3.1b (the classes C25 – C47, unchanged, §7) and its
> §3.2 sketches (§8). Their numbers are kept.

---

## 1. HOW TO RERUN THE STUDY, AND WHAT IT COSTS

Folder: `scripts/probes/surface_study/` — `geom.ts` (convex parts, exact ray casts and levels), `shapes.ts` (the library and the sweep's grid),
`readings.ts` (TODAY and PROPOSED), `checks.ts` (the checks rule by rule), `selfcheck.ts` (14 hand-computed cases, 25 asserts, run first by every
runner), `run_library.ts`, `run_sweep.ts`, `report.ts` → `results.txt` (readable) and `results.json` (compact, committed); the raw `library.json`
(1 MB) and `sweep.json` (766 KB) are regenerated and git-ignored.

```bash
npx vite-node scripts/probes/surface_study/run_library.ts   # 63 shapes:   ≈ 23 – 25 s (23.3 s measured 2026-11-16, 28 s wall with start-up)
npx vite-node scripts/probes/surface_study/run_sweep.ts     # 1596 cells:  ≈ 40 s (39.7 s)
npx vite-node scripts/probes/surface_study/report.ts        # the report:  ≈ 3 s (3.4 s wall)
```

⛔ The load rule (the owner: *"Make sure you manage the load on my computer"*): ONE process at a time, one core, each under a minute; no browser, no
Blender, no `npm run verify`. Rerun by the consolidator once (library + report): `results.txt` and `results.json` came back identical to `903e50d`.

**What each reading is.** **TODAY (T)** = the game's own pure functions on this branch: `buildFaceMap` as shipped (layout "chart", scale "normals",
merge 20°, share ¼), `stackDepthAt` (with `voidOpening`, `pieceEnters`), `castPoint`, `mapTarget` (far, d = 0.3 m), `shellBox` / `shellAnchor`,
`footprintSupport` / `supportTop` / `levelRaise` (close in), `mouthHold`. Emulated, because engine-bound: `rawGizmo`'s D3 cast (an exact ray cast
for `modelCast`; `MAP_OUT` 50 mm; a bridge's hit counts 0.5 mm in front) and `heldFoot` (the two smallest sizes of the piece's own box).
**PROPOSED (P)** = the principles as written: P2 the first contact of the held footprint (axis-aligned in the facet's t / b) along −n — from outside
far, from the piece close in (a part above its bottom + 0.5 mm a wall, P5) — "nothing to land on" marked; P1 the same `shellAnchor` on P2's gizmo;
S22 by a 4 mm voxel flood; S21 by withdrawal along the entry. **Left out**: the edge blend (dead), the depth glide and every ease (the shown
gizmo, not its target), the solver's slide, the ring's hold, the automatic tilt, the mouth's hand-over. **Close in** = the piece at contact
(d = 0), a travel stopped at its first wall (the gizmo is read at the solved angles). **Pieces**: A 41.3 × 45 (48 tall, the green frustum's
footprint), B 80 × 80 (40 tall), the bar 20 × 100 (20 tall), as held and turned. **Parts**: boxes and convex prisms only, on a 480 mm block.

**Not covered** (the study builder's list): inclined held pieces; side columns other than the front; tilted frames and polar-zone switches (P6 not
studied); curved parts (C15, C38); defective input (C47); ghosts and the plunge; P3's place-functions (only today's hold was measured); the sweep
with piece A only.

---

## 2. THE SHAPES

### 2.1 The named library (53 shapes) and the pairs (10)

Each is a block 480 mm wide (the cube's size) with one feature on its top or its front, or a whole assembly; a PAIR (Q) is two singularities on one
shape. `C…` = the class of the specification's catalogue (§3.1 there, §7 here).

| # | shape | classes | what it is | parts |
|---|---|---|---|---|
| **L01** | through hole 100 | C4 (genus 1) | a 100 x 100 hole right through the block, inside the top | 4 |
| **L02** | through hole 30 (narrower) | C4 | a 30 x 30 hole through, narrower than every piece | 4 |
| **L03** | blind slot 60x60x40 | C6 | a pocket 60 x 60, 40 deep, inside the top; a peg 59 x 59 seats in it from above | 5 |
| **L04** | blind slot 30x30x40 (narrower) | C6, C8 | a pocket 30 x 30, 40 deep | 5 |
| **L05** | channel 60w 30d, open at one end | C5 | a 60-wide, 30-deep channel from z -100 to the front edge, open there | 4 |
| **L06** | channel 60w 30d, open at both ends | C5 | a 60-wide, 30-deep channel the whole top long | 3 |
| **L07** | mouth (L05 seen from its open end) | C7(a) | the front face with the channel's end: a 60 x 30 notch at its top edge | 4 |
| **L08** | groove 13w 10d | C8 | a 13-wide, 10-deep groove the whole top long (the cube's bottom groove) | 3 |
| **L09** | two islands, gap 3 | C9 (islands), C8 | two blocks 3 mm apart (the whole assembly) | 2 |
| **L10** | two islands, gap 30 | C9 (islands), C8 | two blocks 30 mm apart (the whole assembly) | 2 |
| **L11** | two islands, gap 60 | C9 (islands), C8 | two blocks 60 mm apart (the whole assembly) | 2 |
| **L12** | step 60 (half the top lowered) | C3 (a concave edge), C35 | the top's front half 60 mm lower: a riser across the top | 2 |
| **L13** | staircase (treads 60, risers 30) | C3, C12 (the tread) | four steps down toward the front: treads 60 deep, risers 30 | 5 |
| **L14** | L (the assembly) | C40, C3 | the block less its front-right quarter: an L seen from above | 2 |
| **L15** | notch 47 at the top-front edge | C3, C35 | a 47-wide notch cut into the top-front edge, 60 down, 50 in (Scene_1's notches) | 4 |
| **L16** | missing corner 100 | C35 (across three facets) | a 100 mm cube missing at the top-front-right corner | 3 |
| **L17** | overhang slab | C10 | a 300 x 30 slab on the top, sticking 100 mm out over the front face | 2 |
| **L18** | tray (an open box) | C25 | a 300 x 120 x 300 tray, walls 20 thick (the whole assembly) | 5 |
| **L19** | tray sealed by a lid (two stages) | C26, C46 | L18, then a lid seated on it: the cavity sealed | 6 |
| **L20** | parts overlapping (a cube sunk 30 into the top) | C27 | a 100 mm cube whose lower 30 mm are inside the block | 2 |
| **L21** | parts touching on an edge | C28 | two 100 mm cubes on the top sharing one vertical edge | 3 |
| **L22** | parts touching at a corner | C28 | a cube on the top and a second one touching it only at a corner, up in the air | 3 |
| **L23** | arch (two posts and a lintel) | C29 (genus), C10 | two 60 x 120 posts on the top and a lintel across them: an opening 140 wide, 120 high | 4 |
| **L24** | table on four legs (the whole assembly) | C29, C10, C40 | a 400 x 30 x 400 top on four 30 mm legs 200 tall | 5 |
| **L25** | elbow tunnel | C30 | a 60 x 60 shaft down from the top that turns and leaves through the front | 5 |
| **L26** | countersunk slot (narrowing 45°) | C31 (narrowing) | a slot 70 wide at the top, chamfered 45° to 30 at 20 deep, then 30 wide to 60 deep, 200 long | 7 |
| **L27** | V groove 60w 30d | C31 (a V) | a V groove 60 wide, 30 deep, the whole top long | 2 |
| **L28** | counterbore | C31 (stepped) | an 80 x 80 recess 15 deep, then a 40 x 40 bore to 60 deep | 9 |
| **L29** | dovetail slot (widening) | C31 (widening, an undercut) | a slot 30 wide at the mouth widening to 50 at 25 deep, the whole top long | 5 |
| **L30** | ramp 18° (within the merge) | C31 (inclined floor) | a 120 x 60 pocket whose floor slopes 18° down from the top's level to 39 mm deep | 5 |
| **L31** | ramp 35° (beyond the merge) | C31 | the same pocket, its floor 35° (84 mm deep at the low end) | 5 |
| **L32** | boss in a pocket | C32 | a 150 x 150 pocket 40 deep with a 50 x 50 boss rising to 20 below the top | 6 |
| **L33** | tube (a hole in a protrusion) | C32, C11 | an 80 x 80 square tube 60 tall on the top, walls 15, a 50 x 50 hole | 5 |
| **L34** | plateau 120x120x20 | C33 (a plateau) | a 120 x 120 block 20 tall on the top | 2 |
| **L35** | pin 10x10x40 | C33 (a pin) | a 10 x 10 pin 40 tall | 2 |
| **L36** | rib 10w 15h 300 long | C33 (a rib) | a 10-wide rib 15 tall along z | 2 |
| **L37** | mushroom (stem 20, cap 60) | C33 (with its own overhang) | a 20 x 20 stem 30 tall carrying a 60 x 60 cap 10 thick | 3 |
| **L38** | grille (20 holes, 30 pitch, through) | C34 | 36 holes 20 x 20 through, at a 30 mm pitch | 44 |
| **L39** | studs (12 x 12 x 8, 40 pitch) | C34 (studs) | a 4 x 4 field of studs | 17 |
| **L40** | frame (a pocket taking most of the facet) | C35 (void or face?) | a 400 x 400 pocket 20 deep, a 40 mm rim | 5 |
| **L41** | rebate 60w 30d along the top-front edge | C35 (a rebate) | a 60-wide, 30-deep step along the whole top-front edge | 2 |
| **L42** | step of 0.3 mm | C36 (shallow) | the top's back half raised 0.3 mm | 2 |
| **L43** | step of 1 mm | C36 (shallow) | the top's back half raised 1 mm | 2 |
| **L44** | step of 6 mm | C36 (shallow) | the top's back half raised 6 mm | 2 |
| **L45** | shallow edge (a low gable, 8°) | C37 (shallow edge) | a roof of 8° on the top, its ridge along z | 3 |
| **L46** | knife wedge (a 20° ridge) | C37 (acute), C13 | a triangular blade 30 wide at its foot, 85 tall, along z | 2 |
| **L47** | fin 4 mm (80 tall, 200 long) | C13 | a 4 mm plate standing 80 tall along z | 2 |
| **L48** | U (the assembly) | C40 | a back wall and two arms: a U open to the front | 3 |
| **L49** | ring (the assembly, a 200 hole) | C40, C4 (genus 1) | four blocks round a 200 x 200 hole through | 4 |
| **L50** | two towers and a bridge | C40, C29 | two 120 x 400 towers 240 apart, a bridge across their tops | 3 |
| **L51** | nothing placed | C42 |  | undefined |
| **L52** | one small part (30 mm cube) | C42, C24 | a single 30 mm cube, smaller than every piece | 1 |
| **L53** | keyed slot 25x105 for the oblong piece | C44 | a 25 x 105 slot 30 deep: the bar 20 x 100 fits only lengthwise along z | 5 |
| **Q01** | through hole at the pole | C4 + C41 (a void at a pole) | L01's 100 mm hole at the top's centre, where the cap's quarters converge | 4 |
| **Q02** | channel through the pole, open at the edges that hold it | C5 + C7(a) + C41 | a 60 x 30 channel the whole top long through its centre; its ends are mouths on the front and back | 3 |
| **Q03** | pin beside a slot | C6 + C33 | L03's slot with a 10 mm pin 30 tall standing 15 mm from its rim | 6 |
| **Q04** | step inside a channel | C5 + C3 | a 100-wide channel along z, 40 deep at the back, 60 deep at the front | 6 |
| **Q05** | two slots closer than the piece | C6 x 2 + C41 (two features closer than the piece) | two 30 x 30 slots 20 mm apart | 7 |
| **Q06** | boss flush with the front edge | C11 on an edge | a 60 x 60 x 40 boss on the top, its front face flush with the block's | 2 |
| **Q07** | slot under an overhang | C6 + C10 (a goal under an overhang) | a slot 60 x 60 x 40 under a slab carried 60 mm above the top on a post | 7 |
| **Q08** | grille under the pole | C34 + C41 | L38's grille at the top's centre | 44 |
| **Q09** | pin in a hole (a moat) | C32 | an 80 x 80 hole 40 deep with a 20 x 20 pin rising from its floor to 10 above the top | 6 |
| **Q10** | fin beside a channel | C5 + C13 | L06's channel with a 4 mm fin 60 tall on its rim | 4 |

### 2.2 Twelve sketches (cross-sections; `#` material, `.` air; `T` today's gizmo, `P` the proposal's landing, `o` "nothing to land on", marked)

```
L03 blind slot 60 x 60 x 40, piece A 41.3 wide        L07 the channel of L05 seen from its open end (the "mouth")
  T T T T T T T T T T T T T T T                         front face |#######|  lip at y 210; the channel runs 340 mm back,
  P P P P P P P P     P P P P P P   <- the rims          ========== |##   ..|  closed there: TODAY no mouth, no hold (the
  ##########.............########                                  |##   ..|  back wall counts as a floor); P2: a 340 mm
  ##########.............########   P on the floor only            |#######|  deep landing at the lip (a slid entry)
  ##########_____P P_____########   in a 19 mm band (60 - 41.3); T steps at the walls (91, 150 mm), P at 111, 130

L10 two islands 30 apart (narrower than A)             L12 a step 60 (half the top lowered), close in
  T T T T T T T T T T T T T T T     the gap is closed     P P P P P P P P P                  far: the marker on the high tread
  ###########...###########         across, open up       ##############P P P P P P P        until half a piece past the riser
  ###########...###########         the facet, no floor:  ##############                     close in: a step down rests the
  ###########...###########         a "mouth" — a dy      ###########################        piece; going back up, a WALL (P5)
  along the gap HELD for up to 479 mm (today); P2: closed by the rims, no mouth

L17 a slab 100 mm proud over the front                 L19 the tray (L18), then its lid (two stages)
  ##############################   <- the slab          T on the lid lands on the TRAY'S FLOOR (y 20): the lid judged
            ####################      grows the box    20 x 300 (its two smallest sizes); P2 as held: 120, its seat
  ..........####################      by 100: the far   ###################   <- the lid: the cavity sealed —
  ..........####################      foot moves 100    #.................#      2397 cm² of inner faces counted
            (its underside: from the bottom cap only)   ###################      as surface today (S22: none)

L30 / L31 a ramp 18° / 35°                             L39 studs 12 x 12 x 8 at a 40 pitch
  T at the centre: the uphill half of the piece          T T   T T   T T   today: the gizmo climbs each stud (8 mm steps)
  enters the slope (L30: 38.7 mm); beyond the 20°        P P P P P P P P   P2: a footprint of 41.3 always covers a stud:
  merge (L31) T is bridged 54.9 mm above it              ## .. ## .. ##    the surface is the studs' tops
  P exact on both (the uphill edge touches first)        ##############

L48 a U open to the front (the whole assembly)        L53 the keyed slot 25 x 105, the bar 20 x 100
  ###########  the contour's front facet is mostly        lengthwise: the bar lands on the floor (both readings)
  ##.......##  void: D5 drops it, the front retreats      turned across: TODAY "fits" (judged 20 x 20) and
  ##.......##  360 mm (the far foot with it); 718        enters 130 places by up to 20 mm; P2 as held: closed
  ##       ##  places held by the mouth's hold; 43 %      (the slot's length a ruler: a flip at 100 ± 1 mm)
               of the exposed area is a place

Q07 a slot under a slab carried 60 mm above          F6 a layer thinner than the 0.5 mm coplanar tolerance
  ######################  <- the slab on a post        ===========  <- a 0.15 mm layer: its underside lies within
  ...........                                          ###########     0.5 mm of the top's plane, "glued" to it:
  ######....######  the peg withdrawn along +y meets   ###########     D5 drops the real cap, the charts lose the
  ######....######  the slab at 40.3 mm: BLOCKED,      pole, the far foot moves up to 256.5 mm and the facet under
  found by B4 (S21), never by the player               the gizmo turns 90° — in both readings
```

### 2.3 The parametric sweep (1596 cells)

The specification's §3.0 grid read systematically, so that the study does not rest on hand-picked shapes: every meaningful combination of the axes
below on the block's top (no protrusion "right through", no widening profile under 6 mm, no corner for a strip open at both ends), piece A on two
1 mm travels through the feature (along t and along b), both readings; the far regime against the bare block on 72 angles; the reading at the
feature's centre for the sensitivity across the width ruler.

| axis | its values |
|---|---|
| sign | void · protrusion |
| footprint | island · strip open at one end (`strip1`) · strip open at both (`strip2`, a gap between two islands for a void) · ring · array |
| profile | straight · stepped (two halves) · widening (an undercut, a mushroom) · right through (voids only) |
| width against A's 41.3 mm | × 0.5 · 0.9 · 1.1 · 2 |
| depth or height | 0.3 · 1 · 6 · 40 mm |
| position | inside the facet · on an edge · on a corner · under the pole |

---

## 3. THE RESULTS

### 3.1 The library, shape × rule (today → proposed)

**Legend.** *landing* (far, the gizmo's target with the piece centred on it): `✓` holds · `✗n` the piece enters a part, up to n mm · `○` over
nothing, unmarked (today) · `◐` "nothing to land on", marked (P2) — for pieces A, B (and the bar on L53). *jumps*: depth steps 0.5 – 5 mm with no
event, T / P. *path*: places whose target depends on the way in (all of them the mouth's hold), T / P. *close in*: piece A in contact — reach %
· travels ended at a wall (P5) · drops ≥ 5 mm, T / P. *far*: the far foot's move against the bare block (mm), T = P on every shape, and what moved
it (the box, the contour). *S22*: the exposed area today / reachable from outside (cm²), shown where they differ. *cover*: the share of the
reachable area that is a place, T / P. *goal*: the withdrawal along the entry, and the landing today / P2 against the seat (y, mm). `·` = nothing.

| # | landing today | landing P2 | jumps | path | close in (A) T / P | far | S22 | cover | goal |
|---|---|---|---|---|---|---|---|---|---|
| **L01** | A○ B○ | A◐ B◐ | · | · | 100·0·0 / 100·0·0 | · | · | 90 / 90 | · |
| **L02** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 97 / 97 | · |
| **L03** | A✗40 B✓ | A✓ B✓ | · | · | 54·4·4 / 54·4·4 | · | · | 99 / 99 | clear; 200 / 200 vs 200 |
| **L04** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 99 / 99 | · |
| **L05** | A✗30 B✗30 | A✓ B✓ | · | · | 52·4·2 / 77·3·3 | · | · | 98 / 98 | clear; -100 / -100 vs 120 |
| **L06** | A✗30 B✗30 | A✓ B✓ | · | · | 77·2·2 / 77·2·2 | · | · | 97 / 97 | · |
| **L07** | A○ B✓ | A✓ B✓ | · | · | 100·0·0 / 84·1·1 | · | · | 98 / 98 | · |
| **L08** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 99 / 99 | · |
| **L09** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | 11520 / 9216 | 100 / 100 | · |
| **L10** | A✓ B✓ | A✓ B✓ | · | 844 / 0 | 100·0·0 / 100·0·0 | · | · | 79 / 79 | · |
| **L11** | A○ B✓ | A◐ B✓ | · | 844 / 0 | 100·0·0 / 100·0·0 | · | · | 78 / 78 | · |
| **L12** | A✗48 B✗40 | A✓ B✓ | · | · | 86·2·2 / 86·2·2 | · | · | 100 / 100 | · |
| **L13** | A✗48 B✗40 | A✓ B✓ | · | · | 41·6·8 / 81·2·8 | · | · | 100 / 100 | · |
| **L14** | A✗48 B✗40 | A◐ B◐ | · | · | 98·1·1 / 98·1·1 | · | · | 100 / 100 | · |
| **L15** | A✗48 B✓ | A✓ B✓ | · | · | 56·6·6 / 56·6·6 | · | · | 99 / 99 | · |
| **L16** | A✗48 B✗40 | A✓ B✓ | · | · | 72·4·4 / 72·4·4 | · | · | 100 / 100 | · |
| **L17** | A✗48 B✗40 | A✓ B✓ | · | · | 52·7·1 / 69·5·3 | 100 (box 100) | · | 91 / 91 | · |
| **L18** | A✗48 B✗40 | A✓ B✓ | · | · | 88·4·4 / 88·4·4 | · | · | 75 / 74 | clear; 20 / 20 vs 20 |
| **L19** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | 5650 / 3252 | 100 / 100 | clear; 20 / 120 vs 120 |
| **L20** | A✗48 B✗40 | A✓ B✓ | · | · | 25·4·0 / 25·4·0 | 70 (box 70) | 9769 / 9462 | 97 / 97 | · |
| **L21** | A✗48 B✗40 | A✓ B✓ | · | · | 12·4·0 / 12·4·0 | 100 (box 100) | · | 92 / 92 | · |
| **L22** | A✗48 B✗40 | A✓ B✓ | · | · | 56·2·4 / 28·4·0 | 100 (box 100) | · | 91 / 90 | · |
| **L23** | A✗48 B✗40 | A◐ B◐ | · | · | 78·2·12 / 78·2·5 | · | · | 91 / 90 | · |
| **L24** | A○ B○ | A◐ B◐ | · | 378 / 0 | 100·0·0 / 100·0·0 | 189 (contour 200) | · | 78 / 78 | · |
| **L25** | A✗48 B✓ | A✓ B✓ | · | · | 65·6·8 / 65·6·8 | · | · | 93 / 92 | · |
| **L26** | A✗48 B✗40 | A✓ B✓ | · | · | 100·0·0 / 66·4·2 | · | · | 97 / 96 | · |
| **L27** | A○ B✓ | A✓ B✓ | · | 482 / 0 | 100·0·0 / 75·2·0 | · | · | 96 / 96 | · |
| **L28** | A✗45 B✗40 | A✓ B✓ | · | · | 58·4·4 / 58·4·4 | · | · | 98 / 98 | · |
| **L29** | A✓ B✓ | A✓ B✓ | · | 46 / 0 | 100·0·0 / 100·0·0 | · | · | 95 / 95 | · |
| **L30** | A✗39 B✗39 | A✓ B✓ | · | · | 100·0·0 / 68·3·3 | · | · | 99 / 99 | · |
| **L31** | A○ B✓ | A✓ B✓ | · | · | 100·0·0 / 68·3·38 | · | · | 98 / 98 | · |
| **L32** | A✗40 B✗40 | A✓ B✓ | · | · | 34·4·4 / 34·4·4 | · | · | 97 / 97 | · |
| **L33** | A✗48 B✗40 | A✓ B✓ | · | · | 25·4·0 / 25·4·0 | 60 (box 60) | · | 97 / 97 | · |
| **L34** | A✗20 B✗20 | A✓ B✓ | · | · | 21·4·0 / 21·4·0 | 20 (box 20) | · | 99 / 99 | · |
| **L35** | A✗40 B✗40 | A✓ B✓ | · | · | 37·4·0 / 37·4·0 | 40 (box 40) | · | 100 / 100 | · |
| **L36** | A✗15 B✗15 | A✓ B✓ | · | · | 69·2·0 / 69·2·0 | 15 (box 15) | · | 99 / 98 | · |
| **L37** | A✗30 B✗30 | A✓ B✓ | · | · | 27·4·0 / 27·4·0 | 40 (box 40) | · | 99 / 99 | · |
| **L38** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 59 / 59 | · |
| **L39** | A✗8 B✗8 | A✓ B✓ | · | · | 17·4·0 / 17·4·0 | 8 (box 8) | · | 100 / 98 | · |
| **L40** | A✗20 B✗20 | A✓ B✓ | · | · | 87·4·4 / 87·4·4 | · | · | 97 / 97 | · |
| **L41** | A✗30 B✗30 | A✓ B✓ | · | · | 91·1·1 / 79·2·2 | · | · | 98 / 100 | · |
| **L42** | A✗0 B✗0 | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 100 / 100 | · |
| **L43** | A✗1 B✗1 | A✓ B✓ | 2 / 2 | · | 86·1·0 / 86·1·0 | 1 (box 1) | · | 100 / 100 | · |
| **L44** | A✗6 B✗6 | A✓ B✓ | · | · | 86·1·1 / 86·1·1 | 6 (box 6) | · | 100 / 100 | · |
| **L45** | A✗3 B✗6 | A✓ B✓ | · | · | 50·2·0 / 100·0·0 | 34 (box 34) | · | 78 / 78 | · |
| **L46** | A✗48 B✗40 | A◐ B◐ | · | · | 84·2·4 / 74·3·3 | 85 (box 85) | · | 94 / 94 | · |
| **L47** | A✗48 B✗40 | A✓ B✓ | · | · | 70·2·0 / 70·2·0 | 80 (box 80) | · | 97 / 97 | · |
| **L48** | A✗48 B✗40 | A◐ B◐ | · | 718 / 0 | 96·2·2 / 96·2·2 | 360 (contour 360) | · | 44 / 43 | · |
| **L49** | A○ B○ | A◐ B◐ | · | · | 100·0·0 / 100·0·0 | · | · | 81 / 81 | · |
| **L50** | A○ B○ | A◐ B◐ | · | 698 / 0 | 100·0·0 / 100·0·0 | 340 (contour 360) | · | 32 / 32 | · |
| **L51** | no map | no map | — | — | — | — | — | — | — |
| **L52** | A○ B○ | A◐ B◐ | · | · | 100·0·0 / 100·0·0 | — | · | 100 / 100 | · |
| **L53** | A✓ bar✗20 bar⊥✗20 | A✓ bar✓ bar⊥✓ | · | · | 100·0·0 / 100·0·0 | · | · | 99 / 99 | clear; 210 / 210 vs 210 |
| **Q01** | A○ B○ | A◐ B◐ | · | · | 100·0·0 / 100·0·0 | · | · | 91 / 91 | · |
| **Q02** | A✗30 B✗30 | A◐ B✓ | · | 56 / 0 | 88·2·2 / 88·2·2 | · | · | 97 / 96 | · |
| **Q03** | A✗40 B✗30 | A✓ B✓ | · | · | 45·4·3 / 45·4·3 | · | · | 99 / 99 | clear; 200 / 200 vs 200 |
| **Q04** | A✗40 B✗40 | A✓ B✓ | · | · | 66·3·3 / 66·3·3 | · | · | 95 / 94 | · |
| **Q05** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 99 / 99 | · |
| **Q06** | A✗40 B✗40 | A✓ B✓ | · | · | 73·3·1 / 73·3·1 | 40 (box 40) | · | 99 / 99 | · |
| **Q07** | A○ B✓ | A◐ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 91 / 91 | BLOCKED; 320 / 320 vs 200 |
| **Q08** | A✓ B✓ | A✓ B✓ | · | · | 100·0·0 / 100·0·0 | · | · | 58 / 58 | · |
| **Q09** | A✗48 B✗40 | A✓ B✓ | · | · | 37·4·0 / 37·4·0 | 10 (box 10) | · | 98 / 98 | · |
| **Q10** | A✗48 B✗40 | A✓ B✓ | · | · | 70·2·1 / 70·2·1 | · | · | 95 / 95 | · |

### 3.2 The sweep, cells broken per check (today / proposed)

| group (sign, footprint, profile) | cells | enter | air | jump | path | far | trap | drop |
|---|---|---|---|---|---|---|---|---|
| void island straight | 64 | 40/0 | 0/0 | 8/8 | 0/0 | 0/0 | 24/24 | 16/16 |
| void island stepped | 64 | 32/0 | 0/0 | 8/8 | 0/0 | 16/16 | 16/16 | 8/8 |
| void island widening | 32 | 16/0 | 0/0 | 0/0 | 0/0 | 0/0 | 16/16 | 16/16 |
| void island through | 16 | 0/0 | 8/0 | 0/0 | 4/0 | 0/0 | 0/0 | 0/0 |
| void strip1 straight | 64 | 40/0 | 6/0 | 8/10 | 0/0 | 0/0 | 24/30 | 16/20 |
| void strip1 stepped | 64 | 32/0 | 4/0 | 8/10 | 0/0 | 16/16 | 16/20 | 8/10 |
| void strip1 widening | 32 | 16/0 | 4/0 | 0/0 | 0/0 | 0/0 | 16/20 | 16/20 |
| void strip1 through | 16 | 0/0 | 10/0 | 0/0 | 8/0 | 0/0 | 0/0 | 0/0 |
| void strip2 straight | 48 | 30/0 | 3/0 | 6/7 | 0/0 | 0/0 | 18/21 | 12/14 |
| void strip2 stepped | 48 | 24/0 | 2/0 | 6/7 | 0/0 | 12/12 | 12/14 | 6/7 |
| void strip2 widening | 24 | 12/0 | 2/0 | 0/0 | 0/0 | 0/0 | 12/14 | 12/14 |
| void strip2 through | 12 | 0/0 | 7/0 | 0/0 | 8/0 | 4/4 | 0/0 | 0/0 |
| void ring straight | 64 | 40/0 | 6/0 | 8/10 | 0/0 | 0/0 | 28/30 | 16/20 |
| void ring stepped | 64 | 32/0 | 4/0 | 8/10 | 0/0 | 16/16 | 20/20 | 8/10 |
| void ring widening | 32 | 16/0 | 4/0 | 0/0 | 0/0 | 0/0 | 16/20 | 16/20 |
| void ring through | 16 | 0/0 | 9/0 | 0/0 | 4/0 | 0/0 | 0/0 | 0/0 |
| void array straight | 64 | 40/0 | 0/0 | 8/8 | 0/0 | 0/0 | 29/24 | 16/16 |
| void array stepped | 64 | 32/0 | 0/0 | 8/8 | 1/0 | 16/16 | 21/16 | 8/8 |
| void array widening | 32 | 16/0 | 0/0 | 0/0 | 0/0 | 2/2 | 16/16 | 16/16 |
| void array through | 16 | 0/0 | 8/0 | 0/0 | 9/0 | 3/3 | 0/0 | 0/0 |
| protrusion island straight | 64 | 64/0 | 0/0 | 16/16 | 0/0 | 48/48 | 48/48 | 16/16 |
| protrusion island stepped | 64 | 48/0 | 0/0 | 16/16 | 4/0 | 48/48 | 35/32 | 0/8 |
| protrusion island widening | 32 | 32/0 | 0/0 | 0/0 | 0/0 | 32/32 | 32/32 | 16/16 |
| protrusion strip1 straight | 64 | 64/0 | 0/0 | 16/16 | 0/0 | 48/48 | 48/48 | 32/32 |
| protrusion strip1 stepped | 64 | 48/0 | 0/0 | 16/16 | 8/0 | 48/48 | 34/32 | 0/8 |
| protrusion strip1 widening | 32 | 32/0 | 0/0 | 0/0 | 0/0 | 32/32 | 32/32 | 32/32 |
| protrusion strip2 straight | 48 | 48/0 | 0/0 | 12/12 | 0/0 | 36/36 | 36/36 | 8/8 |
| protrusion strip2 stepped | 48 | 36/0 | 0/0 | 12/12 | 8/0 | 36/36 | 25/24 | 0/4 |
| protrusion strip2 widening | 24 | 24/0 | 0/0 | 0/0 | 0/0 | 24/24 | 24/24 | 8/8 |
| protrusion ring straight | 64 | 64/0 | 0/0 | 16/16 | 0/0 | 48/48 | 52/48 | 16/16 |
| protrusion ring stepped | 64 | 48/0 | 0/0 | 16/16 | 4/0 | 48/48 | 41/32 | 0/8 |
| protrusion ring widening | 32 | 32/0 | 0/0 | 0/0 | 0/0 | 32/32 | 32/32 | 16/16 |
| protrusion array straight | 64 | 64/0 | 0/0 | 16/16 | 0/0 | 50/50 | 54/48 | 16/18 |
| protrusion array stepped | 64 | 48/0 | 0/0 | 16/16 | 9/0 | 50/50 | 40/32 | 1/9 |
| protrusion array widening | 32 | 32/0 | 0/0 | 0/0 | 0/0 | 32/32 | 32/32 | 16/18 |
| **ALL** | 1596 | 1102/0 | 77/0 | 228/238 | 67/0 | 697/697 | 849/833 | 367/432 |

*enter*: the piece set at the gizmo enters a part; *air*: nothing within 0.5 mm under it, unmarked; *jump*: a 0.5 – 5 mm depth step with no event;
*path*: a target that depends on the way in; *far*: the far foot moves > 0.5 mm against the bare block; *trap*: a close-in travel that ends at a
wall; *drop*: close in the piece goes down ≥ 5 mm into something.

---

## 4. THE FINDINGS, GROUPED BY CAUSE

Kinds: (i) a principle confirmed · (ii) a principle that breaks one of the owner's rules · (iii) two rules in conflict · (iv) a case no rule
covers · (v) a difference between today and the proposal that the player sees. The study builder's text, condensed; the numbers unchanged.

| # | kind | the finding | the numbers | shapes |
|---|---|---|---|---|
| **F1** | (v) (i) | **The point against the body.** Today's gizmo is a point: the piece set centred on it enters the part beside every wall, rim and protrusion. P2 never does. Far and medium it is the MARKER only (the piece rides the shell); close in the footprint support covers it (F9) | today 41 of 62 library shapes, 1102 of 1596 cells, up to 48 mm (a wall's full height); P2: 0 entries, 0 unmarked air gaps | L03, L12, L17, L34 – L37, Q09 … (41) |
| **F2** | (i) | **P2 moves each depth step half a piece off the wall; it does not remove it.** S5's "real depth under the gizmo" then holds in the central band only | 132 steps matched: median offset 21 mm (A's half-sizes 20.65 / 22.5), range 8 – 39; L03: today at 91 and 150 mm along the travel, P2 at 111 and 130 (a 19 mm band) | L03, L05, L12, L15 … (39) |
| **F3** | (v) | **WS10: today's ruler is the piece's two smallest sizes**, not its footprint as held | B (80 × 80 × 40) judged 40 × 80: its gizmo on the floor of 60-wide channels, the piece entering the rims by up to 30 mm (35 shapes); the bar judged 20 × 20: across the keyed slot 130 entries today, 0 under P2; L19's lid lands on the tray's floor (20) instead of its seat (120); P2: 120 | L05, L06, Q02, L19, L53 … |
| **F4** | (i) (v) | **"Nothing to land on" is one class**: wide through holes, gaps between islands, inside an L, a U, a ring, under a table or a bridge, round a small part | 13 shapes, 43 cells marked by P2; today the same places put the piece over nothing, unmarked (12 shapes, 77 cells) | L01, L11, L14, L23, L24, L48 – L50, L52, Q01, Q02, Q07 |
| **F5** | (iv) (ii) | **The mouth's hold fires wherever a void is closed across and open up the facet with no floor** — on the TOP CAP too, along a gap between islands, in a V or a dovetail run the whole length. In the designed case it holds the red as labelled. A channel closed at its far end has NO mouth: the back wall 340 mm away counts as a floor | Q02: the red going up held 28 mm under the lip, not coming down; 32 sweep cells hold a dy on the cap for up to 479 mm; path-dependent places: L10 844, L11 844, L48 718, L50 698, L27 482, L24 378, Q02 56, L29 46; L07: held 0 | Q02, L07, L10, L11, L24, L27, L29, L48, L50 |
| **F6** | (ii) (iv) | **A layer thinner than the 0.5 mm coplanar tolerance erases the face above it** (today's code, inherited by the proposal): a plane's level is its FIRST face's (`stackOf`), and R1 glues any opposite face of another part within 0.5 mm of that plane, whichever side | 76 cells (0.15 mm layers): D5 drops the real top cap, the charts lose the pole, far out the foot moves up to 256.5 mm and the facet under the gizmo turns 90°; 32 cells (layers of exactly 0.5 mm): a false mouth, a hold on the top up to 235 mm; L42: the contour moves 0.3 mm with the parts' order | the stepped 0.3 mm voids, the stepped 1 mm protrusions; L42 |
| **F7** | (ii) | **P1 against a shell built on the BOX**: every protrusion that rises above the box moves the far piece and camera by its own height — the move equal to the box's growth; voids keep P1 except where they cut the box's extreme. A strongly non-convex assembly moves it through its CONTOUR (D5 drops a mostly void facet) | 612 of 760 protrusion cells (the other 148: 0.3 mm, under the noise); a pin 40 mm, the knife 85, the slab 100; 9 of 836 void cells; L24 189, L48 360, L50 340 mm with the box unchanged (contour Δ 200 – 360 mm) | L17, L20, L21, L33 – L37, L46, L47, Q06, Q09; L24, L48, L50 |
| **F8** | (iii) | **S5 ("the piece shall not go in") against the contact close in**: in contact, the piece drops into every slot it fits; a dx across it is then trapped at the far wall (P5). Traps at protrusions are a proud part acting as a wall, as his Q1 (b) intends. No rule says whether crossing a slot close in should capture the piece | drops ≥ 5 mm: 367 cells today / 432 P2; travels ended at a wall 849 / 833, of which 190 / 215 after a drop into a void, 565 / 532 at protrusions; L03: reach 54 % | L03, L05, L06, L12, L13, L15, L16, L18, L28, L32, Q03, Q04 … |
| **F9** | (i) (iv) | **Close in, P2 started at the piece IS today's footprint support** — except where the footprint hangs past the assembly's edge: P2 then lands the piece in a rebate narrower than itself, open on the edge's side | 1398 of 1596 cells identical; the other 198: 80 on an edge, 62 on a corner, 30 inside, 26 at the pole; e.g. a 37 mm rebate: today bridged, P2 1 – 40 mm down | the sweep's edge and corner cells; L41 |
| **F10** | (iv) | **C36 / WS23: depth steps between 0.5 and 5 mm are jumps with no event**, in both readings | 238 cells, up to 3 mm; L43 (1 mm): 2 jumps each reading; L44 (6 mm): glided | L43 |
| **F11** | (v) | **Slopes**: today the point lands at the centre (the uphill half enters); beyond the 20° merge today's gizmo is bridged across the slope. P2 is exact on all | L45 (8°): 2.9 mm = half-width × tan 8°; L30: up to 38.7 mm in; L31 (35°): bridged 54.9 mm above; L27 (V): 9.4 mm above; L26: 48 mm in | L26, L27, L30, L31, L45, L46 |
| **F12** | (i) (iv) | **S22: today counts sealed and buried faces as surface.** The faces that are no place are the same classes in both readings: undersides, inner walls, walls facing no facet | L09 11520 vs 9216 cm² (the 3 mm gap reads sealed at the flood's 4 mm), L19 5650 vs 3252 (2397 sealed), L20 9769 vs 9462 (buried); coverage L50 32 %, L48 43 %, Q08 58 %, L38 59 %, L18 74 % | L09, L19, L20; L18, L38, L48, L50, Q08 |
| **F13** | (i) (iv) | **S21 / B4: the withdrawal finds the blocked goal.** A goal entered sideways is no landing under any principle | Q07: blocked by the slab at 40.3 mm along +y; L05: the block slid along the channel lands at the back wall (−100), 220 mm from its seat (120) | Q07, L05; clear: L03, L18, L19, L53, Q03 |
| **F14** | (i) | **OS15 / B6: a class flip at a ruler moves the gizmo by the feature's whole depth for a millimetre of width**, in both readings | L03 ± 1 mm round 45: 20 mm of gizmo per mm; width 0.9 → 1.1 × A flips the centre in 105 of 399 pairs today, 120 under P2; L30 at the 20° merge: today 31 mm for 2°, P2 2.7 mm; L53 at the bar's 100 mm: only P2 flips (today's 20 × 20 ruler never binds) | L03, L08, L30, L43, L53 |
| **F15** | (i) (iv) | **Determinism**: P2 is exactly invariant to the parts' order and to a quarter turn plus a move; today's depth is too, but for ties exactly over a wall (measure zero) and the plane's first-face level (F6's cause) | ties: L17, L20, L47, Q09 (gone 0.37 mm off the wall); order: L42, 0.3 mm | L17, L20, L42, L47, Q09 |
| **F16** | (iv) | **C42: nothing placed has no rule** (no box, no map); round one part smaller than the piece, most places are "nothing to land on" | L51: no map; L52 (a 30 mm cube, A): 96 of 242 places | L51, L52 |

---

## 5. WHAT THE CONSOLIDATOR CHECKED IN THE STUDY'S CODE

Read: `readings.ts` (both readings, the close-in travel, the far feet), `run_sweep.ts`, the report's aggregates; the shell's code
(`orbit_shell.ts`) for F7. Trusted: the TODAY reading calls the game's functions, the emulations are the two the study names. **Doubted, and
how it is read here**: (1) F7's "far" compares an assembly with its bare twin — a box grown by a placed part moves the far foot, but along ONE
assembly the foot does not bump (the shell is a function of the box alone, `shellAnchor`): F7 is therefore a re-wording of P1, not a break of
S17's spirit (§6, P1). (2) The close-in model is the piece at contact (d = 0) with no solver slide: F8's traps are an upper bound of what the
player meets; the drops are what the footprint support does. (3) P3 was not prototyped: F5 measures today's hold only. (4) F9's "landing in a
rebate narrower than the piece" is physically right (the rebate is open on the edge's side; the piece overhangs it) — read as a clarification of
P2 ③, not a defect.

---

## 6. THE CONSOLIDATION — rule or principle → verdict, with the shapes that show why

Verdicts: **confirmed** · **amended** (old → new; a principle or a fallback for a CLASS, never a case for one shape) · **added** (numbered,
[PROPOSED]) · **conflict** (the order, or the owner's question) · **owner** (a decision, §8 of the specification) · **out of reach** (no general
repair: the fallback stated). "Built" = today's code already satisfies it.

| rule / principle | verdict | the text (old → new), or why | shapes / finding |
|---|---|---|---|
| the landing rule (`ORBIT_CHARTS.md` §1 rule 1) + **P2** | confirmed | P2 is the only reading that never puts the piece into a part or unmarked over nothing; today breaks it on 41 of 62 shapes (the marker far out) | F1: L03, L12, L17, L34 – L37, Q09 |
| **P2 ④** steps remain | confirmed | moved half a piece out (median 21 mm), not removed; S5's "real depth" in the central band only — the price, stated in Q2 | F2: L03, L05, L12, L15 |
| **P2 ①** nothing to land on | confirmed | one class (holes, island gaps, inside L / U / ring, under a table, round a small part); on the glass only the mark changes | F4: L01, L11, L14, L23, L24, L48 – L50, L52 |
| **P2 ②** the piece as held | confirmed — the recommendation strengthened | today's two-smallest-sizes ruler mislands real cases (a lid on a tray's floor); Q3 merged into Q2 | F3: L19, L53, L05, L06, Q02 |
| **P2 ③** first contact is not rest | **amended** | old: *"a piece dropped on one pin touches it and would tip: the gizmo still shows the touch"* → new: the same for EVERY partial support — a footprint partly over nothing (past an edge, beside a hole) lands where it first touches; no stability test, no "centre over the support" test | F9: 198 cells (80 edge, 62 corner), L41 |
| **P2 ⑤** the drop from the piece close in | confirmed — built | reproduces today's footprint support in 1398 of 1596 cells; the rest is P2 ③ | F9 |
| **P2** on slopes and profiles | confirmed | exact on ramps, V, countersinks, gables; the 20° merge no longer decides what is a floor (WS22 answered) | F11: L26, L27, L30, L31, L45, L46 |
| **P1** two regimes | **amended** (wording) — built | old: *"Far and medium, no singularity of the surface changes the path of the piece and the camera"* → new: *far and medium, the path of the piece and the camera is a function of the placed parts' BOX (the shell) and the CONTOUR (the layout) only: no feature under them changes it; a part that grows the box or changes the contour changes it everywhere at once, at the seat that places it (S19's event), never along a travel* | F7: 612 / 760 protrusion cells (1 : 1 with the box), 9 / 836 voids; L24, L48, L50 (contour) |
| **P3** each real face in the frame that faces it | **amended** (its condition) — still to measure | "where a facet's direction finds nothing to land on" is NOT the mouth's class: a channel closed far behind its mouth finds a far wall (L07: P2 would glide the gizmo 340 mm into it at the lip). P3 stays unbuilt; its condition is to be found by the measurement (Q4) on Q02, L07, L10, L11 and `Scene_1` | F5: L07, Q02 |
| the mouth's **hold** (S10's mechanism, S18) | **conflict** → owner (Q4) | its trigger ("closed across, open up the facet, no floor") is wider than its purpose (the tilt's hand-over at a side's lip) and narrower too (L07). Proposed domain, a stated fallback for the class: *the hold acts only where it hands over to the automatic tilt — on a side facet, toward a cap's edge, over a void that P2 leaves open for the held piece; never on a cap* | F5: 32 cells, 479 mm; L10, L11, L24, L27, L29, L48, L50 |
| **P4** a function of the place | confirmed for P2 | 0 path-dependent places in every shape and cell under P2; today only the hold (F5) and the plane's first-face level (F6) break it | F15, F5 |
| **P5** blocked, not jumped | confirmed — built | the traps at protrusions are walls as his Q1 (b) intends; out by the approach | F8: 565 / 532 cells |
| **S5** the piece does not dive by itself | **conflict** → owner (Q10) | close in the contact drops the piece into every slot it fits, then traps it at the far wall. Proposed order: S5's *"the piece shall not go in"* binds far and medium (the shell keeps it there by construction), close in P2 ⑤ + P5 — P1 in his words (*"At close in, this rule is overruled by collision rule"*) | F8: 367 / 432 drops; 190 / 215 traps after a drop; L03 54 % |
| **S6, S7, S8** holes, voids, the piece-fit | confirmed — consequences of P2 | the same outcomes from one operation on every void width and profile | L01, L02, L04, L08, L09, L29 |
| **S9 / S23** protrusions, one ruler | confirmed — consequences of P2 + P5 | pins, ribs, plateaus, a mushroom, studs: the marker on their top where the piece touches first; close in a wall | L34 – L37, L39, Q06, Q09 |
| **S22** exposed = reachable from outside | confirmed | today counts sealed (L19: 2397 cm²) and buried (L20) faces | F12 |
| **S24 / B5** nothing unreachable silently | confirmed | the no-place classes are the same in both readings; B5's coverage is the measure C40 lacked (L48 43 %, L50 32 %) | F12 |
| **S21 / B4** every goal reachable | confirmed | the blocked goal found offline | F13: Q07 |
| **S28** a goal's entry | **added** [PROPOSED] | *every goal's entry is stated; only a set-down along its host facet's normal is a landing (P2, B4 checks its first contact is its seat); any other entry — slid, plunged, hooked — is a guarded move along the entry direction from the pre-insertion pose B4 computes (S13's (3) + (4) for every such entry)* | F13: L05 (−100 against 120), L19 (P2 = seat) |
| the noise family (§2.6 (2)) → **S27** | **added** [PROPOSED] — not built | *tolerances join, never erase*: (a) a face joins a plane when its OWN level is within the tolerance of the plane's level, a level stated independently of order (the area-weighted mean); (b) a face, or part of one, is removed only where another part's material covers it (S22) — never by pairing with an opposite face on either side; (c) a part thinner than, or an overlap shallower than, the noise tolerance is refused at authoring (B1) — OUT of the surface's reach otherwise | F6: 76 + 32 cells; F15: L42 |
| depth steps → **S26** | **added** [PROPOSED] — not built | *no unnamed depth step*: one depth tolerance (the noise family's "flush", 0.5 mm today) splits every depth change — under it the same face, at or above it the named depth event (glided far and medium, P5 close in); the glide's own 5 mm goes | F10: 238 cells, up to 3 mm; L43 |
| the empty placed set → **S29** | **added** [PROPOSED] — built in effect | *an empty placed set is out of the surface's reach*: every level boots with a placed part (W1 states it, B4 checks it); with none (only `lockPlacedPieces` 0, a debug setting) the gizmo holds, as today. One part smaller than the piece needs no rule: P2 ① | F16: L51, L52 |
| **OS15 / B6** rulers and margins | confirmed — B6 completed | B6's rulers include the held piece's sizes AS HELD, in each orientation the level allows (the bar's 100 mm flips only under P2) | F14: L03, L30, L53 |
| **C12** a tread between risers | re-classed | not "unreachable": a place of the facet that faces it (OS3's fallback) — the treads of L12, L13 are 100 % covered from the top; only the side's travel does not reach them | L12, L13 |
| **C35** void or face? (the order) | answered by the layers | D5 decides the facet (L3), P2 the use (L2): no order of tests; every facet kept on the frame, the rebate, the notch, the missing corner | L15, L16, L40, L41 |
| **C34 / WS21** a porous face loses its facet | not reproduced | the grille and the studs kept their cap; the closing at the level's smallest piece (§2.6) stays proposed, untested on a comb | L38, L39, Q08 |
| **C41** a singularity on a singularity | the same case for the landing | a hole, a grille, two close slots at the pole read as anywhere (Q01, Q05, Q08); a mouth at a pole is F5's (Q02); the layout's events at a pole NOT studied | Q01, Q02, Q05, Q08 |
| **C40** strongly non-convex | measured, warned | the measure is B5's coverage (L48 43 %, L50 32 %, L14 100 %); the far path moves with the contour (P1 amended); lobes still not proposed | L14, L48 – L50, L24 |
| **P6** the layout's singular points | not studied | the study ran the far map at fixed charts, no zone switch | — |

New classes the study showed missing (the specification §3.1b): **C48** sub-tolerance layers and shallow overlaps (F6) and **C49** a void open
along a travel whose far wall decides what it is (L07 against Q02, F5). The classes the study showed to be the same case: C12 → OS3; C28 → C11
(touching cubes grow the box and are protrusions: L21, L22); C29 → C10 + P2 ① (L23, L24); C32 → C6 + C11 (L32, L33, Q09); C35 → P2 + D5 by
layers; C41 → its parts for the landing.

---

## 7. THE CLASSES THE PIPELINE HAS NOT MET (C25 – C47), moved from the specification §3.1b *(review)*

[PROPOSED] From the specification's §3.0 grid. "Today's code" is what the rules as described in this study would do there — expected, not run; the
cells that cite a `file:line` were read in the code on `1190db2` (2026-11-16), the others are inferences from the rules of §2 and §3.1 there. Where
the study of 2026-11-16 measured a class, the shape is named in the last column (§6).

| # | class | plain definition | G / T | where it occurs, or will | today's code (expected) | "small" against → answered by (spec §2.2, §5.2) |
|---|---|---|---|---|---|---|
| **C25** | **open cavities the piece can enter** — a tray, an open box, a cup, a U | a void so large that the piece works INSIDE it: a floor, and inner walls | T for a height field: the inner walls face no facet of the contour | `Scene_2`'s lower case; any box built wall by wall | the floor is a void's floor (entered, S7 / S8); the inner walls are faces parallel to the cast (C12): never a place | the piece → **P2; inner walls S13** (study: L18) |
| **C26** | **sealed cavities, enclosed parts** | a space closed on all sides once a cover is placed, and whatever is inside it | T (a second, inner boundary) | `Scene_2` when a case closes over the crank | its faces stay "exposed" (they are not glued): only a coplanar opposite face of another part removes a face (`face_map.ts:488-496`, `exposedRects` `:515-534`); every face fed seeds a candidate facet (`:627-630`) and joins its stack (`:474`), so it can be a stack's main group and carry the D5 share (`:537-543`); no cast from outside reaches it — the cover is met first (`assembly_wiring.ts:972`) | — → **S22** (study: L19) |
| **C27** | **buried faces** — parts overlapping in volume | a face, or a part of one, inside another part's material (a press fit, a part sunk into another) | T (the surface is that of the parts taken together) | Piece43 sunk 26 mm (into the floor, which is not surface); none designed in `Scene_2` — its rod's big end was left OPEN so as not to overlap the crank pin, the overlap refused (`SCENE_2_ASSEMBLY.md` §2.6); a press fit in a later scene | only a coplanar opposite face of another part removes a face (C18; `face_map.ts:488-496`, `:515-534`): a buried face stays, whole | — → **S22** (study: L20) |
| **C28** | **parts that only touch** — along an edge, at a point | two solids sharing a line or a point: the surface pinches there | T (not a proper surface at that line) | boxes set diagonally; a wedge's edge on a face | no rule: the contour spans it; beside it a void narrowing to zero | the coplanar tolerance → **the noise family** (study: L21, L22 — the same case as C11) |
| **C29** | **handles, arches, bridges, legs** | a hole through whose axis runs ALONG the facet: a lintel on two posts, a table on its legs, a handle | T (genus) + an overhang (C10) | a part bridging two others; an assembly raised on feet | from the facet above: an overhang; from the side: a void, open toward the floor (a mouth (a) turned down) or closed (C4) | the piece → **P2 + OS3** (study: L23, L24, L50) |
| **C30** | **bent and branching tunnels** | an elbow (its two mouths on two facets), a T of channels, a tunnel opening on the bottom | T | channels meeting at a corner; `Scene_2`'s ports | each mouth is judged alone, on its own facet; nothing ties the two ends | the piece, at each mouth → **P2 at each mouth; S13** (study: L25) |
| **C31** | **voids with a profile** | narrowing (a countersink, a V groove, a funnel); stepped or nested (a counterbore, a slot in a slot's floor); with a floor that is inclined or curved (a ramp, the valley between two banks, a bowl) | G + T: "the floor" is no longer one plane parallel to the facet | `Scene_2` (counterbores; the V between the cylinder banks) | a floor is a deeper group of the facet's stack (`face_map.ts:988`): faces within the merge angle (20°) of the facet's normal, each at the level of its CENTRE (`stackOf`, `:474-478`). An inclined floor within 20° is a floor at its centre's level, and the cast reads its real slope (`assembly_wiring.ts:965-973`); a curved floor is many such groups, one per level. ⚠ Beyond 20° it is in no group of that stack — a closed void over it is bridged as if it had no floor (`face_map.ts:991`), an open one falls to the nearest group's plane with no cast (`:1004-1010`, WS4). The fit is read only at the plane (`voidOpening`, `:1021`), never level by level | the piece, at each depth → **P2, layered depth** (study: L26 – L31) |
| **C32** | **ring-shaped voids, things inside pockets** | a moat round a boss, a pin standing in a hole, a tube (a hole in a protrusion) | T (the footprint is a ring) | `Scene_2`'s bores and their pins | the fit test reads two runs through the point, along the facet's `t` and `b`, each to the PLANE's first real face (`voidOpening`, `face_map.ts:1021-1058`), the piece either way round (`pieceEnters`, `:1061-1064`): in a moat one run is the ring's width, the other runs along it. A boss whose top is flush with the plane cuts the runs; a boss standing proud or sunk is on another plane and does not — the opening read is the whole pocket's, and the boss itself is climbed (`:1003`) | the piece against the ring's width → **P2** (study: L32, L33, Q09) |
| **C33** | **protrusions by their own size and profile** | a plateau the piece can stand on; a pin, a rib, a lip, a rim it cannot; a mushroom, a flange, a hook (a protrusion with its own overhang) | G (+ T for the overhang) | each seated piece (a plateau); `Scene_2`'s 2.8 mm flanges, its pins | any height is climbed whatever the width (C11): no ruler for a protrusion | the piece (proposed, S23) → **P2** (study: L34 – L37) |
| **C34** | **arrays and porous faces** | many features, each too small for the piece, together most of the face: a grille, a perforated plate, a comb, a row of fins, studs, teeth, threads | G (their spacing) | `Scene_2` (fins, bolt circles) | each void bridged (S8) — but the facet's keep rule (D5) reads the area of the stack's MAIN group only, grown 1.6 mm and with its ENCLOSED holes closed whatever their size (`mainOf` → `regionArea` → `filledRegion`, `face_map.ts:537-543, 312-317, 173-224`): a grille's holes inside a frame count, a comb's slots open to the facet's edge and the studs' tops (another plane) do not — a comb or a field of studs may lose its facet (D5 against S8); studs: the gizmo climbs each one (`:1003`) | the piece against the spacing → **P2 + D5 after the closing** (study: L38, L39, Q08 — the facet kept) |
| **C35** | **void or face?** | a void that takes most of its facet (a frame, the rim of a tray), a rebate open on two sides, a missing corner (a notch across three facets) | G (a share) — a continuum: pocket → rebate → step → another face | `Scene_1`'s 90 mm rebate; any assembly half built | decided by D5's share and by which plane is the facet's main region: an implicit rule | the facet's share → **P2 + D5 (by layers, §6)** (study: L15, L16, L40, L41) |
| **C36** | **shallow features** | a recess or a step of about a millimetre; a seated piece a little proud or a little low; faces a degree apart | G (a depth, an angle) | every seat (a fit is never exactly flush) | under 0.5 mm: coplanar; over 5 mm: a glide; between the two: a small jump with no event | a DEPTH ruler — missing today → **the noise family; S26** (study: L42 – L44) |
| **C37** | **edges by their angle** | a shallow edge merged under 20° (the facet's normal then up to 20° off the real face's); an acute edge, a knife ridge (a turn near 180°); a dished face (shallow, concave) | G | frusta, wedges, chamfered parts | merged or kept by `MAP_AXIS_DEG`; the acute ones are the half turns of `TILTED_POLE_CLOSE_IN.md` | the merge angle → **P1 merge (⏳ the rest normal)** (study: L45, L46) |
| **C38** | **doubly curved and free-form parts** | a dome, a ball, a cone, a fillet as large as the piece, an organic shape | T for a ball (all pole); G elsewhere | none today | quantised into facets (C15); no stable flat face, nowhere flat for the piece to rest | the merge angle; authored proxies → **authored (⏳)** |
| **C39** | **faces at a threshold** | nearly level (the cap's 1°), at the 20° merge, leaning outward and down (an inverted frustum) | G | `Scene_0bis`'s tips; any tilted frame (WS14) | a class may differ between the world's map and a tilted frame's | each tolerance → **B6** |
| **C40** | **strongly non-convex assemblies** | an L, a U, a C, a cross, a ring, two towers and a bridge; the orbit's centre in the air | T / G: the convex contour is far from the solid | assemblies half built; the early stages of `Scene_2` | the contour's facets are mostly void; floors hundreds of mm down, glided in ~125 ms; inner faces out of reach (C25) | how much of the contour is real → **B5's coverage** (study: L14, L48 – L50) |
| **C41** | **a singularity on a singularity** | a void or a protrusion at a pole, on a seam, across a chart's edge; a mouth at a pole's edge; two features closer than the piece, or than the 5 mm band | T (a coincidence) | a channel on a face that holds a pole (`Scene_1`'s top) | each rule is written alone; their meeting is not specified (OS9's last line) | — → **its parts for the landing; the mouth F5; the layout ⏳** (study: Q01 – Q10) |
| **C42** | **empty and nearly empty assemblies** | nothing placed yet; one part smaller than the held piece; the first seat | T (no surface at all) | the start of `Scene_2` (a slab); a level's first move | no surface at all: with nothing placed the shell's box is `null` (`shellBox`, `orbit_shell.ts:26-33`), so is the face map (`assembly_wiring.ts:873, 887`) and the map's gizmo (`:949`); the gizmo stays where it was, else the orbit's centre — the boot target, radius 0.5 m (`ensureAssembly`, `:94-96`; `:1242`, `:657`). Every scene boots with a placed part — `Scene_0`'s heptagon (`scene_0.ts:13-14`), `Scene_1`'s pieces at their goals, `Scene_2`'s anchors (`model_import.ts:87, 281`); the set is empty when `lockPlacedPieces` is 0 (`goal_lock.ts:22`). One small part: the map is built on it like any other | — → **S29** (study: L51, L52) |
| **C43** | **the piece's BODY against the gizmo's POINT** | a place where the point is on the surface but the body does not fit: beside a wall, a protrusion, a void's rim; the piece hanging over a facet's edge; a face narrower than the piece | G (the piece's half-width) | everywhere, close in | the footprint support and `levelRaise` lift the piece over what its footprint covers (`assembly_wiring.ts:675-694` on `30f7bb3`), the solver and the ring's hold decide the contact: the gizmo and the piece part there | the piece's half-width → **P2 + P5; P2 ③ amended** (study: F1, F9) |
| **C44** | **the piece turned** | an oblong piece enters a slot one way only (a keyed slot); the ruler changes when the player turns the piece | G + time | `Scene_1`'s bars; the piece's eight orientations | the footprint is the two smallest sizes, whichever way the piece is turned (WS10) | the piece as it is turned → **P2 ② (Q2)** (study: L53) |
| **C45** | **how a piece ENTERS its goal** | set down on a face; slid along a channel from its open end; plunged along a bore; hooked under an overhang; pushed between two parts | the purpose, not a shape | every level's assembly plan (`SCENE_WORKFLOW.md`, W1) | set down: by the orbit close in (the goal capture) or the approach; the plunge specified, not built; the others where the approach happens to work (the slide is removed, `CLOSE_IN_CONTACT.md` §1) | — → **S13 + B4; S28** (study: L05, Q07) |
| **C46** | **the topology changing in play** | a seat seals a cavity, completes an arch (a new hole through), joins two islands, fills a slot flush or nearly; an undo reverses it | T + time | every level | the map is rebuilt for the new placed set (C23); what happens to a gizmo standing on a face that has just gone is not stated | — → **S19** (study: L19) |
| **C47** | **defective input** | a part that is not a closed solid: open edges, flipped faces, self-crossings, duplicate or zero-area faces | the input | an imported `.glb` | the proxy's sanity checks ①–⑩ for model parts, at the Blender build only; the game checks nothing — a proxy goes straight into a mesh (`model_bodies_wiring.ts:111-117`; no closed-solid test anywhere in `src`); a scene written as data is made of boxes, frusta and prisms, closed by construction | — → **S25 (B1)** |
| **C48** *(study)* | **sub-tolerance layers and shallow overlaps** | a part thinner than the coplanar tolerance (a shim), or two parts overlapping by less than it (a press fit, the collision's 0.3 mm skin) | G at a tolerance, with T effects (a face erased, a pole lost) | none designed; any shim or press fit | the plane's level is its FIRST face's (`stackOf`) and R1 glues an opposite face within 0.5 mm on either side: the face above is erased, D5 may drop a cap (F6) | the noise tolerance → **S27; refused at authoring (B1)** |
| **C49** *(study)* | **a void whose far end decides what it is** | a channel seen through its open end: closed far behind (a floor along the facet's direction, 340 mm away) or right through (none) | T (a fact far from the place) | `Scene_1`'s channel (through); any channel closed at its far end | through: a mouth and the hold (C7(a)); closed far behind: no mouth, the lip no event (F5, L07); under P2 a deep landing at the lip | — → **⏳ P3's measurement (Q4); a slid entry: S28** |

---

## 8. THE SKETCHES OF THE FIRST CLASSES, moved from the specification §3.2

`#` = material, `.` = air, `G` = where the gizmo goes today.

```
C5 channel, seen across its length          C7(a) the same channel seen from its end: a "mouth"
  G G G G . . . . . G G G G   <- plane        front face  |######|   G held on the plane, then the tilt
  #######.........#######                                 |######|   hands it to the top's facet
  #######_G_G_G_G_#######   <- floor                      |##  ..|<- the channel's end, open up
  (the piece fits: the red runs on the floor)             |##  ..|

C4 through hole (no floor)                  C10 overhang: the cast from above meets the top first
  G G G G G G G G G G G G    <- bridged       G G G G G
  #######.......#######                       #########          <- the overhang
  #######.......#######                       ...........        <- its underside: never a place from above
  #######.......#######                       ####.........####  <- the host face, hidden under it

C12 a step: the tread is parallel to the cast of the side facet
  facet's normal -->   |####       the red, driven by pitch, casts horizontally: it meets the riser,
                       |####       then the next riser; the TREAD between them is zero width
                  _____|####       on that height field: never a place (I10) — but a place of
                 |#########        the TOP's facet, which faces it (the study: L12, L13)
```
