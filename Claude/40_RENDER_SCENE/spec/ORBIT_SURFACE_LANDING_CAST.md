# THE LANDING READ AT QUERY TIME — the landing map's cost rebuilt from its root (package S14, a study + a prototype, 2026-11-24)

> **STATUS** · ⏳ **PROPOSED — a study with a measured prototype; NOTHING BUILT in the game.** Written on his word *"The landing cost: i do not
> accept these costs. You need to find another solution"* (2026-11-24), by his rules (root cause before patch; the four-part method; docs before
> build; the closed orbit's terms — [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §9). **One question for his word (§8).**
> **OWNS** · how P2's landing is COMPUTED (the engine); never what it answers — that stays [ORBIT_SURFACE_LANDING_MAP.md](ORBIT_SURFACE_LANDING_MAP.md)'s.
> **READ WITH** · [ORBIT_SURFACE_PART_CHECKS.md](ORBIT_SURFACE_PART_CHECKS.md) §19 (C2, the cost per stage), §21 (WHEN it is paid);
> [ORBIT_SURFACE_DRIVE.md](ORBIT_SURFACE_DRIVE.md) §12 (S4b). Code read on `599e97c4` (`src/core/landing_map.ts`).

## 1. The root cause (measured, `ORBIT_SURFACE_PART_CHECKS.md` §21)

Today's engine BUILDS, for every pair (a placed collision piece, a piece of the held part), the pair's whole forbidden shape — the configuration
obstacle P ⊕ (−H), as the intersection of half-spaces whose normals include every EDGE PAIR of the two pieces — and keeps them all. Its size is the
product: on `Scene_2`'s last stage 115 placed pieces × E16's 16 = 1 840 shapes, 691 764 half-spaces. The held piece's orientation is part of every
shape, so **every frame of a turn rebuilds them all** (698 ms on this PC), and each new face direction projects them all again (56 ms). Yet a query
— *where does the piece land here?* — only ever meets the few pairs under the held part's footprint. **The cost is the eager, global preparation,
not the question.** A budget, fewer pieces (D9) or the held piece's hull would shrink the product; none removes it.

## 2. The rules the new engine keeps (the same answers — never a new rule)

* **The same landing, kind for kind** (`land` / `nothing` / `inside` / `uncovered`), the same part, the same depth — read from outside or from `F`
  — with the same MERGE and READ (`mergeLayers`, `landOf`: ties within `TOUCH` to the smaller id; touching is not overlapping; a stretch shorter than
  `TOUCH` is none). Exact to rounding: agreement within `TOUCH` (0.1 µm, the code's own "touching").
* Model coordinates (`orbit-reads-model-coordinates`); deterministic; engine-free (`src/core`); patent-free; no new constant outside its one home.
* **The closed orbit**: behind a switch, 0 = LIVE bit for bit; his records at 1 within 1e-9 m of 0 on `Scene_1` (the reference `3b7a479`).

## 3. The design, from prior art (all published before 2006: any patent has run out)

* **CAM's drop cutter** (the landing map's own ancestor, its header): a tool dropped onto a part at a query point, computed AT QUERY TIME against a
  spatial index — never an offset surface built ahead. Here: the held part dropped along −n at (u, v).
* **The configuration obstacle by its SUPPORT MAPPING, never built** (Lozano-Pérez 1983 for the obstacle; GJK — Gilbert, Johnson, Keerthi 1988):
  D's support is s_P(d) − s_H(−d) — two loops over ≤ 24 points. **GJK's ray cast** (van den Bergen 2004) gives the line's first contact with D
  exactly: its top from above, its bottom from below. The closest point on a simplex: Ericson 2005 (*Real-Time Collision Detection* §5.1).
* **A broad phase on the plane** (the pieces' rectangles on the facet's plane — the sweep-and-prune family, 1990s): only the placed pieces under the
  held part's footprint, then only the pairs whose rectangle holds the line.
* **A bound** (branch and bound): a pair's top can never exceed its two pieces' extents along n — the pairs taken highest first, stopping once no
  lower pair can reach the best top; from `F`, the stack above `F` followed only when `F` is inside it (the merged layer's top sets its part).
* **The touching rule, kept**: the line must lie inside D's shadow on the plane by more than `TOUCH` (D's shadow = the two shadows' Minkowski sum —
  its edges are theirs), as today's vertical half-spaces and rectangle require.

**What is prepared, and when** (nothing is built per pair):

| when | what | `Scene_2` stage 16, this PC |
|---|---|---|
| a seat (once per placed set) | the placed pieces' hulls (as today) | as today |
| a new face direction (once per placed set) | the placed pieces' points and shadows on the facet's frame | 1.4 ms (today: 56 ms after EVERY turn) |
| a turn frame (each face direction in use) | the held pieces' points and shadows on that frame (their hulls once per held part: a turn never changes a hull) | 0.18 ms (today: 698 ms) |
| a query | the near pairs, highest first, cast exactly | ≈ 50 µs (today: 96 µs, once prepared) |

## 4. The prototype, measured (2026-11-24 — the kit's `fo3/surface/cast/proto_cast.ts`, unoptimized TypeScript)

Against today's engine (`landingFor`) on `Scene_1`'s 36 boxes × the green piece and `Scene_2`'s stages 3, 9, 13, 16 (the part placed next held as
held), each over 8 face directions (the six axes, two slanted), 400 queries a direction — a quarter ON the pairs' rectangle edges (flush, ± 10 nm,
± 1 µm: the alignment's cases), half read from `F` (random through the stack, then the drive's case: 0 – 20 mm above the landing):

* **Agreement: 32 000 queries, 0 kinds different, 0 parts different**; depths within **1.4e-12 m on `Scene_1`**, **8.4e-8 m on `Scene_2`** (< `TOUCH`).
* **Cost** (the drive's case; today's turn frame / new direction / query → the cast's):

| set | today | the cast |
|---|---|---|
| `Scene_1` (36 × 1) | 1.2 ms / 0.3 ms / 3 µs | 0.02 ms / 0.28 ms / 18 µs |
| `Scene_2` stage 3 (16 × 14) | 17 ms / 1.7 ms / 14 µs | 0.10 ms / 0.10 ms / 36 µs |
| `Scene_2` stage 9 (61 × 2) | 28 ms / 1.8 ms / 10 µs | 0.02 ms / 0.25 ms / 21 µs |
| `Scene_2` stage 13 (69 × 15) | 326 ms / 26 ms / 80 µs | 0.22 ms / 1.8 ms / 53 µs |
| `Scene_2` stage 16 (115 × 16) | 698 ms / 56 ms / 96 µs | 0.18 ms / 1.4 ms / 51 µs |

A turn frame with k queries: `Scene_2`'s worst ≈ 0.2 ms + k × 0.05 ms — k = 5: 0.45 ms, **under `Scene_1`'s turn frame today** (1.2 ms + k × 3 µs,
C2's proposed budget); k = 24 (the solver's budget): 1.4 ms, about `Scene_1`'s today. A query costs more than today's once prepared (no sums to read): `Scene_1` 18 µs against 3 µs —
k × 15 µs more a frame, nothing at a turn.

## 5. Obstacles and fallbacks

* **GJK's rounding** — its loop stops at |v| ≤ 1e-11 m, or 1e-10 of the simplex's size, or no progress for three steps (λ still), or 80 steps; a
  flat tetrahedron is never "inside" (its first build read 2.7 mm high there — fixed, measured). The cap met in under 1 % of casts, every answer still
  within `TOUCH`. Vectors: today's S1 / S12 vectors (the brute force) run on BOTH engines.
* **Two tops within ~`TOUCH`** (a tie): the cast's 84 nm on `Scene_2` could flip a tie's part where today's reads two tops within 0.1 µm — none in
  32 000 queries; a cross-engine vector on each scene guards it.
* **The phone** — allocation-free typed arrays in the build (the prototype allocates per step); its figure on his look (`ORBIT_SURFACE_DRIVE.md` §11).
* **The queries a frame** (k) — not yet counted on his records: counted at the build's gates (the gizmo memo keys a frame's angles).
* **The offline checks** (B3, C2) read the same engine: B3 faster; C2 re-measured (turn frame, new direction, query — its budget per frame).

## 6. The build proposed (S14)

1. `src/core/landing_cast.ts` — the same `PreparedLanding` (`landingAt`, `top`, `refused`) from the placed hulls on a frame and the held hulls;
   the merge and the read SHARED with `landing_map.ts` (one code, exported there — never copied).
2. The shared preparation (`heldSumsFor`, S4b) keyed as today; switch **`landingEngine`** (0 = the sums, LIVE; 1 = the cast), in THE ORBIT'S SURFACE.
3. Vectors: S1's and S12's on both engines; the cross-engine agreement on `Scene_1` and `Scene_2`'s stages (kinds, parts, depth ≤ `TOUCH`); mutants
   red first (the bound too greedy, the touching rule dropped, a flat simplex "inside", the chain above `F` skipped).
4. Gates: G1 his records at 0 identical; at 1 within 1e-9 m on `Scene_1`; k counted; C2 re-measured on `Scene_2`.
5. Then **D9** (few pieces on held parts, PROPOSED for cost only) withdrawn — the cost no longer grows with the product.

## 7. In plain words

Today, each time the held part turns, the game rebuilds — for every placed piece paired with every piece of the held part — the whole zone where the
part may not go: 1 840 shapes, 690 000 faces on `Scene_2`'s last stage, though the gizmo only ever looks at a handful. The new way builds nothing in
advance: when the game asks *"where does the part land here?"*, it takes only the pieces under the part's footprint, starts with the tallest, and
slides the part down onto each with the standard collision method of games and CAD (GJK), stopping as soon as no lower piece can matter. The
answers are the same — measured on 32 000 questions — and a turn on `Scene_2` costs ≈ 0.5 ms instead of 0.7 s.

## 8. For his word

* **Build S14** (the cast behind `landingEngine`, his look on `Scene_1` at 1, then its default) — ⏳ recommended before S11's build, which reads
  the same engine. Or an independent audit of this study first.
