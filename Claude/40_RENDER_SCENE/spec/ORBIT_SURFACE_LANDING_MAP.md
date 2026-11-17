# THE LANDING MAP — layer L2 (P2) as a pure function: the design (package S1, 2026-11-17)

> **STATUS** · DESIGN, written before the code (package S1 of [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §5). ⛔ **NOT WIRED**: nothing in the
> game calls it; no existing game file changes. Its decisions are the specification's, PROVISIONAL (accepted 2026-11-16 / 2026-11-17, to be tested).
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
* A merged layer's `part` is the id of the stretch whose top is the layer's top; **a tie (two parts with the same top) goes to the smaller id**.
* A lookup that combines several samples (§6) breaks its ties the same way: the higher depth, then the smaller id.
* No randomness, no clock, no cache between calls. `convexHull3` is deterministic (its joggle is a fixed sequence) and only its face normals and
  edges are read; the support values are taken on the ORIGINAL points.

## 6. Between two samples: the lookups, and the error they carry

* **`landing(U, V, from?)` — the lookup.** It reads the samples at the corners of the grid cell holding `(U, V)` (one, two or four: a place on a
  grid line reads only the samples on it, so the lookup AT a sample is that sample). Combined conservatively: `inside` if any corner says so; else
  the HIGHEST `land` (ties: the smaller id); else `nothing`. Outside the region: `uncovered`.
* **Its error.** The lookup is never below the exact landing at a corner. Between corners: (a) beside a step of the obstacle's top (a part's edge
  grown by half the piece) the lookup takes the higher side up to one cell (4 mm) early — on the side away from the part, never into it; (b) on a
  sloped top (a slope of gradient g, e.g. a wedge, a frustum's side) the exact value may exceed the corners' highest by at most g × step / √2
  (2.8 mm × g at 4 mm); (c) the corner of an obstacle turned off the grid's axes can lie inside a cell with no sample in it — the lookup may then
  miss it within that cell. (b) and (c) are the only ways the lookup reads LOWER than the exact first contact; both are bounded by one cell. The
  offline script measures how often each happens.
* **`landingAt(U, V, from?)` — the exact evaluation.** The same computation as one sample, at any place (one ray through the prepared sums): no
  grid error. It is what a lookup would call where one cell's error matters (the wiring's choice), and what the vectors compare the samples with
  (bit for bit at a sample's place).
* **`layersNear(U, V)`** — the two layer lists of the NEAREST sample (a tie between two samples: the lower index). Layers cannot be maxed, so they
  are not combined.

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
   sweep in an offline script (`scripts/surface/`), run once.
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

## 10. As built

*(filled when the code lands)*
