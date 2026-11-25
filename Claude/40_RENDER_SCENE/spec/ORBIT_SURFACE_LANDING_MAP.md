# THE LANDING MAP — layer L2 (P2) as a pure function: the design (package S1, 2026-11-17)

> **STATUS** · ⭐ **BUILT 2026-11-17** (package S1 of [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §5; the design §1 – §9 written and committed
> before the code, `d35487c`; the code `4758d36`; as built §10; ✅ **AUDITED 2026-11-17: PASS**, §10.8). ⛔ **NOT WIRED**: nothing in the game calls it; no
> existing game file changes. ⚠ **Its cost is over the 50 ms line** (§10.4): the wiring step chooses among the measured options. Its decisions are the specification's, PROVISIONAL (accepted 2026-11-16 / 2026-11-17, to be tested).
> **OWNS** · the landing map's contract: its signature, its inputs and outputs, its algorithm and why it is exact, its tie key, its "nothing to land
> on", its lookup and that lookup's error, what it leaves out. **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §2.2 (P2), §5.1 (L2), §5.2, §5.3;
> [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) (the shapes, the brute-force P reading).

## 1. In one paragraph

The player holds a piece. For one facet direction (a plane and its outward normal), the map answers, for every place of that plane on a 4 mm grid:
**how deep can the held piece, as it is held, come down along the normal before it first touches a placed part?** The answer is exact for a rigid
piece at a fixed orientation, from the convex collision pieces of both sides. It also keeps, per place, the placed parts' own layers along the
normal (where a ray enters and leaves each part), so an overhang's underside, a cavity's floor and a tunnel's two mouths are all present. It is a
pure function: the same input gives the same map bit for bit, whatever the order of the parts.

## 2. Where it lives, and the signature

`src/core/landing_map.ts`. ⭐ In `src/core`, not `src/input`: it reads nothing of the input layer — only the convex hull (`src/core/hull3.ts`) and
the vector helpers (`src/core/vec.ts`); it is geometry, like `collision_shape.ts`. Engine-free (`tests/boundary.test.ts`).

```ts
export const LANDING_STEP_MM = 4;                      // the grid's step; its home becomes src/core/units.ts when the map is wired
export function buildLandingMap(
  placed: readonly ConvexPiece[],                      // the placed parts' convex collision pieces, MODEL coordinates, metres
  held: readonly (readonly Vec3[])[],                  // the held piece's convex pieces AS HELD, relative to its reference point, metres
  frame: LandingFrame,                                 // the facet direction and the region of its plane to cover
  stepMm: number = LANDING_STEP_MM,
): LandingMap;
```

## 3. Inputs, outputs, units, frames

**Units.** Positions and depths in METRES, in the MODEL's coordinates (the frame `face_map.ts` and `footprint.ts` work in; never the drawn, swaying
meshes). The one threshold the map has, the grid's step, is authored in MILLIMETRES (`LANDING_STEP_MM`) and converted at its use (rule 3).

**`ConvexPiece`** `{ id, points }` — one convex collision piece of a placed part: its points (the hull is taken). A part made of several `UCX_`
pieces gives several entries with the part's id. `id` is the key of every tie (§5).

**`held`** — the held piece's convex pieces, each a list of points already turned to the piece's orientation (as held) and expressed RELATIVE TO
ITS REFERENCE POINT. ⭐ **The reference point is the point the gizmo stands for: the held piece's RESTING FACE'S CENTRE.** The game places the piece
by that centre (`placeByFaceCentre`; `orbit_shell.ts` `faceLift`: the lift is 0 when the orbit's direction is the facet's normal, so the resting
face's centre is then exactly the point on the gizmo). The map does not compute it: the caller passes the points relative to it. A piece with no
volume (fewer than four points not in one plane) cannot be a collision piece: it is left out and NAMED in `refused`, never replaced.

**`LandingFrame`** `{ origin, u, v, n, uMin, uMax, vMin, vMax }` — `n` the facet's outward normal, `u` and `v` two unit axes in its plane (any
orthonormal triple), `origin` a point of the plane; the region to cover is `u ∈ [uMin, uMax]`, `v ∈ [vMin, vMax]` (metres, along `u`, `v` from
`origin`). A place `(U, V)` of the plane and a depth `h` stand for the model point `origin + U·u + V·v + h·n`. **A depth is that `h`**: the signed
distance along the OUTWARD normal from the plane through `origin` — higher is farther out.

**The grid.** Samples at `U = uMin + i·step`, `V = vMin + j·step`, `i = 0 … nu − 1`, `j = 0 … nv − 1`, `nu = ⌊(uMax − uMin)/step⌋ + 1`.

**Outputs, per sample** (and by the lookups of §6 at any place):
1. **The placed parts' LAYERS** — along the ray `origin + U·u + V·v + h·n`, each stretch of `h` inside the union of the placed pieces, as
   `{ top, bottom, part }` (`top` where the ray coming from outside enters, `bottom` where it leaves), outermost first. `part` names the piece whose
   surface is the stretch's top.
2. **The held piece's LAYERS** — the same for the reference point: each stretch of depths at which the held piece, its reference point over that
   place, would overlap a placed part (the configuration-space obstacle along the ray, §4), outermost first.
3. **THE LANDING** — from those layers:
   * **from outside** (the default): the top of the outermost stretch — the depth at which the piece, brought down from outside, first touches;
   * **from a given depth `h0`** (P2's fifth point, "from where the piece is"): the first contact BELOW `h0` — the top of the outermost stretch whose
     top is at or below `h0`; if `h0` lies strictly inside a stretch, the piece at `h0` already overlaps a part: that is said (`inside`), not a landing;
   * or **NOTHING TO LAND ON** — no stretch below the start.

```ts
export type Landing =
  | { kind: "land"; depth: number; part: string }      // the reference point's depth at the first contact; the part touched (§5)
  | { kind: "nothing" }                                // nothing to land on: no contact along −n below the start
  | { kind: "inside"; part: string }                   // read from a depth inside an obstacle: the piece there overlaps `part`
  | { kind: "uncovered" };                             // the lookup's place is outside the map's region
```

⭐ **"Nothing to land on" is a KIND, not a number.** It carries no depth field, so it can never be read as a depth (the specification's §5.2: the
gizmo then goes on the facet's plane, MARKED — that placing is the wiring's, not the map's).

## 4. The algorithm, and why it is exact

**The obstacle of a translating piece.** The held piece `H` (a union of convex pieces `Hj`, relative to its reference point `r`) overlaps a placed
convex piece `Pi` exactly when `r ∈ Pi ⊕ (−Hj)` — the Minkowski sum of the placed piece with the held piece MIRRORED through its reference point
(the configuration-space obstacle of a translating body: Lozano-Pérez, "Spatial planning: a configuration space approach", IEEE Trans. Computers
1983; along one direction, CAM's "drop cutter"). The obstacle of the whole set is the UNION of these sums over every pair `(i, j)`. A union of
convex pieces' sums is exact: a non-convex part is exact through its convex pieces, and so is a non-convex held piece.

**Each sum as half-spaces, without building its hull.** The facets of a sum `A ⊕ B` of two convex polytopes have normals of three kinds only: a
face normal of `A`, a face normal of `B`, or the cross product of an edge of `A` and an edge of `B` (the standard facet structure of a Minkowski
sum; e.g. de Berg et al., *Computational Geometry*, ch. 13, and the Gauss-map overlay). For every such candidate direction `m` (both signs), the
half-space `m·x ≤ σA(m) + σB(m)` (σ the support function: σ_{−H}(m) = −min over H of m·h) CONTAINS the sum, and the sum is the intersection of
these half-spaces because its true facets are among them. Extra candidates (both signs, a triangle's diagonal) add redundant half-spaces only — never
a wrong one. So the sum is exact with no hull of the sum, no sampling, no tolerance on its shape. Each piece's own hull is taken once
(`convexHull3`) to read its face normals and its real edges (a hull edge between two triangles of different planes).

**Along the ray.** For a place `(U, V)`, the reference point at depth `h` is in one sum exactly when every half-space holds: `(m·n)·h ≤ σ − m·origin
− U·(m·u) − V·(m·v)`. Each is a bound on `h` (above when `m·n > 0`, below when `< 0`); a half-space parallel to `n` either holds for every `h` or
for none. So the sum's stretch on the ray is one interval `[bottom, top]`, computed exactly (one division per half-space). The stretches of all
sums are sorted and merged into the union's layers; the placed parts' own layers (output 1) are the same computation with a point for the held
piece (the sums are the parts themselves).

**Touching is not overlapping.** A side that only grazes (the footprint's edge flush with a wall) and a stretch of zero length are not overlap:
a half-space parallel to `n` must hold by more than `0.1 µm`, and a stretch must be longer than `0.1 µm`, to count (the same convention as the
study's brute force, which shrinks the footprint by `1e-4 mm`). Two stretches closer than `0.1 µm` are one (a gap the reference point cannot be in).

**Why it is the first contact.** From outside, the outermost stretch's top is the highest depth at which the piece overlaps something; just above
it the piece is free all the way out — so the piece brought down from outside first touches there, whatever its shape and the parts' (a pin, a
rim, an overhang's top, a slope). P2's guarantees then follow by construction, not by a rule per shape: a void narrower than the piece leaves its
rims' stretches overlapping across it (CLOSED); a wider one leaves a gap down to its floor only where the piece clears both walls (the floor, no
nearer than half a piece from each wall); a pin's stretch is as wide as pin + piece (TOUCHED FIRST); studs closer than the piece's width merge into
one surface at their tops; a hole right through and wider than the piece leaves no stretch at all (NOTHING TO LAND ON).

**A turn of the piece is a new map.** The function takes the held piece as held and keeps no state; a different orientation is a different input.

## 5. The key that makes it deterministic

* Every stretch carries its placed piece's `id`. The ids are sorted once by code-unit order (`<`, never a locale), and each stretch is sorted by
  `(bottom, top, id)` before the merge — the input's ORDER never reaches the result (parts, their pieces, the held pieces).
* A merged layer's `part` is the id of the stretch whose top is the layer's top; **a tie (two parts whose tops are within 0.1 µm) goes to the smaller
  id**. ⭐ *(as built)* Within 0.1 µm, not "equal floats": a rigid motion turns an exact tie into a near one, and the first build's part name then
  changed with the motion (found by the invariance vector, §10.2).
* A lookup that combines several samples (§6) breaks its ties the same way: the higher depth, then — within 0.1 µm — the smaller id.
* No randomness, no clock, no cache between calls. `convexHull3` is deterministic (its joggle is a fixed sequence) and only its face normals and
  edges are read; the support values are taken on the ORIGINAL points. ⚠ *(the audit)* `convexHull3` joggles by 1e-5 × the piece's size: a vertex standing
  out of its hull by less than about 5 µm on a 0.5 m piece could be dropped, its support value then slightly low — not met in any comparison.

## 6. Between two samples: the lookups, and the error they carry

* **`landing(U, V, from?)` — the lookup.** It reads the samples at the corners of the grid cell holding `(U, V)` (one, two or four: a place on a
  grid line reads only the samples on it, so the lookup AT a sample is that sample). Combined conservatively: `inside` if any corner says so; else
  the HIGHEST `land` (ties within 0.1 µm: the smaller id); else `nothing`. Outside the region: `uncovered`.
* **Its error.** The lookup is never below the exact landing at a corner (by more than a 0.1 µm tie). Between corners: (a) beside a step of the obstacle's top (a part's edge
  grown by half the piece) the lookup takes the higher side up to one cell (4 mm) early — on the side away from the part, never into it; (b) on a
  sloped top (a slope of gradient g, e.g. a wedge, a frustum's side) the exact value may exceed the corners' highest by at most g × step / √2
  (2.8 mm × g at 4 mm); (c) the corner of an obstacle turned off the grid's axes can lie inside a cell with no sample in it — the lookup may then
  miss it within that cell. (b) and (c) are the only ways the lookup reads LOWER than the exact first contact; both are bounded by one cell. The
  offline script measures how often each happens.
* **`landingAt(U, V, from?)` — the exact evaluation.** The same computation as one sample, at any place (one ray through the prepared sums): no
  grid error. It is what a lookup would call where one cell's error matters (the wiring's choice), and what the vectors compare the samples with
  (bit for bit at a sample's place).
* **`layersNear(U, V)`** — the two layer lists of the NEAREST sample (a tie between two samples: the lower index); `null` outside the region. Layers
  cannot be maxed, so they are not combined.

## 7. What is NOT in it (the brief, and why)

The wall rule in contact range (P5: the collision's, which reads the GJK gap); whether the piece DROPS into a slot (Q10: the contact's queue — the
map only says where the first contact is; the piece keeps its level by the contact's rule); the mouth's hold (Q4); a stability test (P2's third
point: first contact is not rest); the entry sets (S0); placing "nothing to land on" on the facet's plane and marking it (the wiring); choosing the
facet directions and their regions (L3, the orbit's); any wiring, readout, or change to today's depth rules or to any existing file.

## 8. How it will be proved (the vectors, §5.3 of the specification)

1. **Against a second implementation** — the study's brute-force P reading (`prismLevels`, the exact levels of each part inside the piece's
   footprint prism, the highest one taken; [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) §1), rebuilt in `tests/helpers/` with the library's
   shapes (a test does not import from `scripts/`), for pieces A (41.3 × 45 × 48 mm) and B (80 × 80 × 40 mm), the bar on L53: the same landing within
   **1e-9 m** (0.000 001 mm), the same "nothing" — on a fixed choice of places in the test; on every place of the library's travels and the 1596-cell
   sweep in an offline script (`scripts/surface/`), run once. ⭐ *(as built)* One convention of the BRUTE FORCE differs and is allowed for: it shrinks
   the footprint by 1e-4 mm, so on a slope of gradient g it reads lower by g × 1e-4 mm (at most 5.67e-4 mm, the knife's 85/15 flank).
2. **The analytic cases**, each with its known answer: a void narrower than the piece closed; a wider one's floor exactly in the band half a piece
   from each wall; a pin touched first; a field of studs a surface at their tops; a hole right through and wider than the piece "nothing to land
   on"; an asymmetric (two-piece) held piece against a step (the mirror).
3. **Invariance**: the shape, the held piece and the frame moved and turned by one rigid motion give the same map (1e-9 m); every order of the parts
   and of the held pieces gives the same map BIT FOR BIT; a sample equals `landingAt` at its place bit for bit.
4. **From a depth**: over a slot under an overhang, from outside the overhang's top, from below the overhang the slot's floor, from inside the
   overhang's stretch `inside`.
5. **Each vector shown RED on a mutant** of the code (listed with the build).

## 9. The cost (to be measured, a figure for the wiring step — not a gate)

On this PC, one process: the time to build the maps for `Scene_1`'s placed boxes (the level data's sizes, its six box directions) at 4 mm, for
pieces A and B; the memory; one lookup. ⚠ The specification's guess (`ORBIT_SURFACE.md` §2.2 P2: ≈ 128² samples per direction, "not measured") is
replaced by the figure. If one direction takes more than about 50 ms here (a phone is several times slower), the options are written with their cost,
not chosen: a coarser grid with `landingAt` at the query; tiles built on demand; the map only round the gizmo.

## 10. As built (2026-11-17, the builder — ✅ audited: PASS, §10.8)

### 10.1 What was built

* `src/core/landing_map.ts` — `buildLandingMap` and `LANDING_STEP_MM` as designed (§2 – §6). Two changes from the design, both written above:
  a tie is two tops within 0.1 µm (§5), and `layersNear` returns `null` outside the region (§6).
* `tests/landing_map.test.ts` — 24 vectors (§10.2). `tests/helpers/surface_shapes.ts` — the study's shapes and its brute-force P reading, copied
  (the offline run checks the copy: 63 shapes, 328 parts, identical to the study's bit for bit).
* `scripts/surface/landing_compare.ts` — the full comparison (§10.3). `scripts/surface/landing_cost.ts` — the cost (§10.4).
* One line added to an existing file: `tests/unwired_debt.test.ts` declares `buildLandingMap` as pending (nothing calls it yet) —
  [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §6.

### 10.2 The vectors, and the mutants that turned them red

24 vectors, 2.8 s of test time: the library against the brute force (one vector, 15 000+ places); the analytic cases (a void narrower than
the piece closed; a wider one's floor exactly in its band; a pin touched first; a field of studs; a hole right through: "nothing", with no depth
field; the mirror, with a two-piece held piece over a step; an edge on a ridge; an edge on a SLANTED ridge; touching is not overlapping, also
with the walls turned 30° off the frame; ties; a piece with no volume named); from a depth (Q07); the lookup; invariance (4 shapes × a rigid motion,
4 shapes × two other orders — the reverse and one seeded shuffle, the held pieces reversed — bit for bit; *the audit*: not EVERY order, which
the full sort key of §5 gives by construction).

| mutant of `src/core/landing_map.ts` | vectors red |
|---|---|
| M1 the held piece not mirrored | 13 |
| M2 the first contact taken as the last | 2 (from a depth; the library) |
| M3 one pair skipped (the last placed piece) | 14; ⭐ +3 since 2026-11-24 (`void_sim`'s groove, notch, rebate — S12) |
| M4 the layers out of order (innermost first) | 3 |
| M5 "nothing" returned as the plane's depth | 2 (the hole; the library); ⭐ +3 since 2026-11-24 (`void_sim`'s U-slot, notch, rebate — S12) |
| M6 a tie broken by array order (the ids not sorted) | 3 (ties; two order vectors) |
| M7 the edge-against-edge facets left out | 1 (the slanted ridge); ⭐ 2 since 2026-11-23 (+ the DOME of `ORBIT_SURFACE.md` §5.3's shapes) |
| M8 the lookup takes the lower corner | 1 |
| M9 touching counted as overlap | 1 (the turned flush slot) |
| M10 a tie on exactly equal floats only (the first build's rule) | 1 (the rigid motion on L26) |

⚠ **Two mutants first SURVIVED, and the vectors were too weak, not the code:** M7 — my first edge vector crossed two HORIZONTAL edges, whose cross
product is the vertical, already a face normal (the knife's base, negated); the slanted ridge was added. M9 — an axis-aligned flush fit is already
rejected by the samples' rectangle, so only walls turned off the frame reach the half-space test; the turned slot was added. Each mutant was run
against the whole test file, the module restored byte for byte after each.

### 10.3 The comparison with the brute force (offline, once, 37.7 s, one process)

| set | places compared | kind differs | depth differs beyond 1e-9 m | the brute's slope shrink (map higher, ≤ 5.67e-4 mm) | "nothing" in both |
|---|---|---|---|---|---|
| library, every travel at 1 mm (`landingAt`), 169 maps | 92 594 | 0 | 0 | 1 374 | 6 852 |
| library, every map sample at 4 mm | 791 249 | 0 | 0 | 18 918 | 49 883 |
| sweep, 1596 cells, both travels at 1 mm (piece A) | 781 011 | 0 | 0 | 0 | 7 481 |
| sweep, the map's samples on the travels | 230 958 | 0 | 0 | 0 | 22 899 |

* A sample equals `landingAt` at its place, bit for bit: 791 249 of 791 249.
* **The lookup against the exact evaluation**, at 33 573 seeded places off the grid (the library's maps): the same 32 915 (98.0 %); higher 607
  (at most 360 mm — a step within one cell, read on its higher side); a landing where the exact value is "nothing" 51 (a corner touches); LOWER 0.
  ⚠ The two ways the lookup can read lower (§6 (b), (c): a slope inside a cell, a turned obstacle's corner) were not met at these places: the
  library has few slopes and no obstacle turned off the grid. Not measured otherwise.

### 10.4 The cost — ⚠ over the 50 ms line

`Scene_1`'s 36 placed boxes (46 bodies less the floor, the five pieces the boot moves out and the four frusta, which are not boxes), each grown by
its contour; the six directions of its box; pieces A and B; 4 mm. This PC, one process, while the other chain was running (two runs differed by up to
1.6×):

| figure | measured |
|---|---|
| samples per direction | 18 225 – 20 735 (135 – 145 a side: the 0.49 m assembly grown by the piece) |
| one direction's build, median of 5 | ±z 58 – 104 ms; ±x, ±y 145 – 270 ms (two runs) |
| the 12 maps held (2 pieces × 6 directions) | 110 MB of heap (`--expose-gc`) |
| one lookup / one exact evaluation (`landingAt`) | 2.4 µs / 4.3 – 4.8 µs |

**The auditor's rerun, the PC less loaded** (medians, pieces A and B): ±z 36 – 52 ms; ±x, ±y 83 – 148 ms; 109.6 MB; a lookup 0.84 µs, `landingAt`
2.71 µs; the options below for B: the sums prepared in 4.2 – 4.9 ms, 8 mm 28 – 31 ms, 16 mm 9 ms, the 100 mm tile 6 – 7 ms. **So every figure here
moves with the PC's load by a factor of 2 to 3; ±x and ±y are over the 50 ms line in every run, ±z is on it.** ⚠ During the builder's runs a
leftover headless browser of the other chain was using about four processor cores ([ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §7).

**The options, measured (piece B, the slow directions +y and +x), not chosen:**

| option | its cost here | what it gives up |
|---|---|---|
| no grid: the sums prepared at the pick-up, `landingAt` at the query | 7.6 – 7.7 ms a direction, then 4.3 – 4.8 µs a query | nothing in exactness; a few queries a frame (the gizmo, the sections' samples) |
| a coarser grid, `landingAt` where one cell's error matters | 54 – 66 ms at 8 mm; 17 – 20 ms at 16 mm | the lookup's error grows with the cell (§6) |
| a tile round the gizmo, built on demand | 13 – 16 ms for 100 × 100 mm at 4 mm | a new tile when the gizmo leaves it |
| the whole map spread over frames (the old one kept meanwhile) | the full figure, split | a stale map for a few frames after a turn |

A phone is several times slower (not measured). The memory is the layers kept as JavaScript objects; a packed layout (typed arrays) is not built
and not measured.

### 10.5 Where a measurement speaks against the specification

* **The cost of P2 as the specification wrote it** (`ORBIT_SURFACE.md` §2.2 P2: "one height map per facet direction at a pick-up and a turn … not
  measured"): measured at 36 – 270 ms a direction on this PC by its load (±x, ±y over the line in every run, §10.4), 110 MB for 12 maps — over the brief's 50 ms line. The rule (P2) is not changed; the
  representation is the wiring step's choice among §10.4's options. ⚠ Its "build them for the piece's orientations at the pick-up" would cost
  0.8 – 1.1 s per orientation (six directions, one piece) here.
* **Nothing measured speaks against P2's guarantees**: a void narrower than the piece closed, a wider one's floor half a piece from each wall, a
  pin touched first, studs a surface, a hole right through "nothing", order and motion invariance — each held, in the vectors and in 1 895 812
  compared places.

### 10.6 What the wiring step must know

* Pass the held piece's `UCX_` pieces turned AS HELD and relative to its resting face's centre (§3); the placed parts' pieces in the MODEL's
  coordinates, metres (never the swaying meshes). A piece with no volume is named in `refused`: look at it.
* "Nothing to land on" is a kind: the wiring puts the gizmo on the facet's plane and marks it (§5.2 of the specification).
* In contact range, read FROM the piece's depth (P2 ⑤): `inside` there means the piece already overlaps — the collision's matter (P5), not a landing.
* Rebuild at a pick-up, a turn of the piece, a change of resting face (⭐ 2026-11-22, the S2 audit: a tapped face moves the reference point with no
  turn — [ORBIT_SURFACE_READOUT.md](ORBIT_SURFACE_READOUT.md) §13.7), a seat, a frame change: the function keeps no state.
* The cost (§10.4) decides the representation before anything drives the gizmo; the readout beside today's depth on `Scene_1` comes first
  (the specification §6).
* `LANDING_STEP_MM` moves to `src/core/units.ts`, and the `PENDING` line leaves `tests/unwired_debt.test.ts` once something calls the map
  ([ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §6).

### 10.7 Not done, not checked

The map on `Scene_2`'s real `UCX_` pieces (not run); the seated frusta in the cost; any phone measurement; the lookup's two lower cases (§10.3);
a packed memory layout. Nothing is wired.

### 10.8 The audit (2026-11-17, an independent Opus auditor — PASS, no blocker)

* **Reproduced**: the 24 vectors; the full comparison, figure for figure (1 895 812 places, 0 kind differences, 0 beyond the tolerance); the
  helper's copy of the brute force, the same text as the study's; `tsc` clean; the docs, boundary, unwired and config tests. `npm run verify` was
  NOT rerun by the auditor (the builder: 162 files / 2058 at the base, 163 / 2082 after, green).
* **Checks of its own**: the 51 places where the lookup's kind differs from the exact one are ALL "the lookup: a landing; exact: nothing" — the
  conservative side, none the other way. ⭐ An INDEPENDENT first contact (a descent and a bisection on the game's own GJK, `gapBetween`), with held
  pieces TURNED about two skew axes, over the knife (L46), a 35° ramp under a two-piece held body and a peg, a slab over a slot (from outside and
  from a depth), a hole right through narrower than the turned piece: 61 places, 0 kind differences, the depths within 5.8e-6 mm (the bisection's
  tolerance) — the first check of the map with a turned held piece against a second implementation (the brute force cannot hold one, §10.7).
* **Three mutants of its own**, each red (the piece not mirrored: 13 vectors; the `inside` branch removed: 1; a tie on bare floats: 1), each undone.
* **Its remarks** (none blocks, each written in above): the cost's figures move with the load (§10.4, §10.5); "every order" was two orders (§10.2);
  the hull's joggle (§5); the 2.8 s of test time is 1.25 s on a quieter PC.

### 10.9 The representation — PROPOSED for the wiring step (Fable's review, 2026-11-17; not built, not decided)

**No grid: the sums prepared once, the exact evaluation at each query** (§10.4's first option). Why: L5 reads the map "at the place" — the gizmo's
place each frame, and the places of the drawn sections' samples; a few hundred exact evaluations (the count is an estimate) cost about 1 ms on this
PC (2.7 – 4.8 µs each), the preparation 4 – 8 ms a direction where a whole map costs 36 – 270 ms and about 9 MB; and the answer carries none of the
lookup's error (§6 (a) – (c) fall away). A tile round the gizmo (the third option) stays the fallback where a rule needs a neighbourhood.
⚠ To settle at the wiring step, after ONE measurement on a phone (none exists). The specification's sentence "one height map per facet
direction … each frame a lookup" (§2.2 P2, its cost) is rewritten then; the rule P2 does not change. The grid and `landing` (the lookup) would
then serve the vectors and the offline comparison only.
✅ **2026-11-22, the owner: no grid for the readout, its cost timed on the HUD** — the phone measurement is taken by the readout itself
([ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §2bis).
