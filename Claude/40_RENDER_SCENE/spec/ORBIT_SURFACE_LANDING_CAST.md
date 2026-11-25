# THE LANDING READ AT QUERY TIME — the landing map's cost rebuilt from its root (package S14, a study + a prototype, 2026-11-24)

> **STATUS** · ✅ **BUILT 2026-11-24 (`defb1195`) behind `landingEngine` (0 = the sums; 1 = the cast) — ⭐ DEPLOYED 2026-11-25 (LIVE `6f03b65`)** on his word *"proceed with S14"* —
> **§9, as built** (the deviations, the cost per engine, the vectors and their red mutants). Owed: G1 at 0 bit for bit and at 1 within 1e-9 m on
> `Scene_1`, the queries a frame counted, his look at 1; then the default, then D9 withdrawn (§6 item 5 — not before his look).
> Written on his word *"The landing cost: i do not accept these costs. You need to find another solution"* (2026-11-24), by his rules (root cause
> before patch; the four-part method; docs before build; the closed orbit's terms — [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §9).
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

* **Build S14** (the cast behind `landingEngine`, his look on `Scene_1` at 1, then its default) — ⏳ recommended; independent of S11 (the caps
  are faces of the face map, never P2's collision pieces). Or an independent audit of this study first. ✅ **His word: *"proceed with S14"*
  (2026-11-24) — built, §9.**

## 9. As built (2026-11-24, package S14 — `defb1195`, behind `landingEngine`, 0 = LIVE)

**The code.** `src/core/landing_cast.ts` (engine-free): `castPlacedOn` (the placed hulls on a direction), `castHeldHulls` (the held hulls, their
refused), `castHeldOn` (the held pieces on a direction), `landingCast` → the same `PreparedLanding` and `top` as `landingFor`; `prepareLandingCast`
the vectors' and scripts' one call (declared debt, as `prepareLanding`). The merge and the read are `landing_map.ts`'s own (`mergeLayers`, `landOf`,
`TOUCH_M`, `support` now exported — one code). The query port of the prototype is step for step (the broad phase, the bound, the bottoms, the chain
above `F`, the touching rule, GJK's tolerances, the flat tetrahedron), its GJK allocation-free (module scratch; the candidates' arrays grown at a
preparation, never in a query). **The game** (`render/landing_readout.ts`): `heldCastFor` (keyed as `heldSumsFor`: the placed set's hulls — the
same `preparePlaced` cache — and the held key) and `castLandingFor` (the placed pieces on a direction cached per placed set, the held ones per held
key; at most 64 directions kept each); the readout and the drive choose the engine at `landingEngine` 1, the engine in their own key at 1 only
(`|E1`: a switch flushes; at 0 every key byte for byte). ⛔ At 1 `heldSumsOn` never runs — proved by a spy on it (V6 below). The slider: THE ORBIT'S
SURFACE, *"P2 engine (0 = the sums, LIVE; 1 = the cast)"* (140 sliders).

**Deviations from the design, stated plainly.**
1. ⭐ **The facet's own plane at a hit** (`facetPlane`) — not in the prototype. GJK's v carries the rounding of x − y (points ~0.3 m away), and its
   stops leave x up to |v| short of D: |v| / cos θ along the ray on a steep facet. Measured on the prototype's own stop: **1.8e-9 m on `Scene_1`**
   (the turned green piece 1 µm past an edge — over the gate's 1e-9 m) and 6.8e-8 m on `Scene_2`'s stage 16. At every hit, the final simplex's
   triangle (three exact vertices of D) gives a direction m; D's SUPPORTING plane along m is crossed by the ray no later than D itself (true for any
   m with m·r < 0), so x is advanced to it — never past D, on the contact facet exactly. `Scene_1`'s largest difference fell to **8.3e-16 m**, and
   S1's exact vectors (e.g. Q07's `depth: 320 mm` by `toEqual`) pass on the cast only with it (mutant M6 below). A second fix tried first — the
   stall (a support already in the simplex) advanced to its plane — added nothing once this one was in (`Scene_2` stage 3: 1.9e-9 against 2.5e-9 m,
   the rest identical): dropped, the prototype's stop kept.
2. **The held hulls once per held SHAPE** (§3's table: *"a turn never changes a hull"*): `castHeldHulls(held, like)` re-reads the hull's points by
   their INDICES (`convexHull3` returns the input's own points) — the readout's cache keys the shape by the piece's id and points; a turn computes no
   hull. Hulled afresh at each orientation, a turn frame cost `Scene_2`'s stage 3 1.5 ms (14 hulls); re-read, 0.1 ms. The vertex set of a turned
   piece is the same (a rigid motion); only near-duplicate points (within `convexHull3`'s 1 µm de-duplication) could differ — none in the vectors.
3. **GJK's tolerances live in `landing_cast.ts`** (the method's, named there: 1e-11 m, 1e-10 of the simplex's size, three still steps, 80 steps,
   the flat share 1e-9, the ray's 1 mm start outside D) — numerical constants of an algorithm, no length a hand sees: not `units.ts`'s thresholds
   (the precedent: `landing_map.ts`'s `KEY_DIGITS`). `TOUCH_M` stays in `landing_map.ts`, imported.

**The agreement** (`scripts/surface/landing_engine_cost.ts` — the study's protocol, 400 queries × 8 directions × 3 passes: F through the stack, F
near the landing, the held pieces TURNED 0.7 rad with the cast's hulls re-read by index): **48 000 queries, 0 kinds different, 0 parts different**,
`top` and the refused bit for bit at every direction. The largest depth difference: **`Scene_1` 8.3e-16 m**; `Scene_2` stage 3 2.5e-9, stage 9
2.5e-8, stage 13 2.6e-8, stage 16 5.4e-8 m (< `TOUCH_M`). ⚠ Where the two differ by more than 1e-9 m on `Scene_2`, an independent exact
computation (the convex hull of the pair's 576 vertex differences, the line through its triangles) puts the truth BELOW both and the cast the
closer: stage 9 turned — the sums 2.5e-8 m high, the cast exact to 3e-16; stage 16 turned — the sums 6.5e-8, the cast 1.1e-8 m high. Today's sums
lose a facet there (normals merged by their 9-digit key, near-coplanar faces' edges dropped): a supporting half-space missing reads higher.

**The cost per engine** (this PC, the same run; turn frame / new direction / query, the median of the drive's case — the sums' turn frame is
`heldSumsOn`, the cast's the held hulls re-read and put on one direction; the PC was loaded: the run before read `Scene_2`'s stage 16 at 693 ms):

| set | the sums (LIVE) | the cast | a pick-up's hulls (once) |
|---|---|---|---|
| `Scene_1` (36 × 1) | 1.12 ms / 0.06 ms / 3.1 µs | 0.010 ms / 0.11 ms / 7.7 µs | 0.04 ms |
| `Scene_2` stage 3 (16 × 14) | 41.5 ms / 1.6 ms / 13.4 µs | 0.10 ms / 0.05 ms / 15.1 µs | 0.9 ms |
| `Scene_2` stage 9 (61 × 2) | 34.1 ms / 2.4 ms / 8.5 µs | 0.05 ms / 0.25 ms / 14.0 µs | 0.4 ms |
| `Scene_2` stage 13 (69 × 15) | 521 ms / 41.5 ms / 74.2 µs | 0.19 ms / 0.32 ms / 35.8 µs | 2.6 ms |
| `Scene_2` stage 16 (115 × 16) | 1 160 ms / 97.9 ms / 92.8 µs | 0.19 ms / 0.91 ms / 38.0 µs | 2.7 ms |

A query costs more than the sums' once prepared on `Scene_1` (7.7 against 3.1 µs: k × 5 µs a frame); nothing at a turn. C2's size check
(`check_landing_cost.ts`) still reads the sums' size — what C2 budgets; this table is its re-measure per engine.

**The vectors** (`tests/landing_map.test.ts` — S1's and S12's on BOTH engines, the cast's "sample" its exact landing at the sample's place, + a
touching vector within `TOUCH`; `tests/landing_cast.test.ts` — V1 `Scene_1`'s agreement (as held and turned, ≤ 1e-9 m), V2 `Scene_2`'s stages 3, 9,
13, 16 (≤ `TOUCH_M`), V3 the chain above `F`, V4 `top` and the refused bit for bit, V5 a turn's hulls by index, V6 the switch, the wiring and the
spy). Each shown RED first on a mutant of `landing_cast.ts` (applied one at a time by a script, both files run, the source restored and compared byte for
byte):

| mutant | red |
|---|---|
| M1 the bound too greedy (the first top found wins) | V1 ×2, V2 ×2; S1's library, TIES, §5.3's V trench and oblique facet (the cast) |
| M1b the bound read on the pairs' bottoms | the same 8 |
| M2 the touching rule dropped | S1 TOUCHING (the cast) |
| M2b the touching rule's margin dropped (TOUCH → 0) | S1 TOUCHING (the cast) — its new 50 nm case; red too on the sums with `castSum`'s margin dropped |
| M3 a flat simplex taken as "inside" | V1 turned, V2 stages 3 / 9, §5.3's dome |
| M4 the chain above `F` skipped | V3, V1 ×2, V2 ×2 |
| M6 the facet plane dropped (the prototype as measured) | S1 FROM A DEPTH, TIES (exact depths) |
| M8 a turn keeps the old orientation's hull points | V5, V1 turned, V2, V6 |
| M9 `top`'s held half read along +n | V4, V1 ×2, V2 ×2 |
| the readout / the drive ignoring the switch | V6 (the spy: `heldSumsOn` called at 1; the source) |

**`npm run verify`** (once, at the end): typecheck clean, 2550 of 2551 tests — the one red a wall-clock cap outside this work
(`boot_heaps.test.ts`, *"each under 3 s"*: 3.6 s under the full run's load; 9 of 9 alone).

**Not done here (the gates, his):** G1 at 0 bit for bit and at 1 within 1e-9 m on his `Scene_1` records; k (the queries a frame) counted; the phone's
figure on his look (`ORBIT_SURFACE_DRIVE.md` §11); D9 ([PART_AUTHORING.md](../../30_OBJECTS_3D/spec/PART_AUTHORING.md)) stays until his look.

## 10. ✅ The gates (2026-11-24, on `ab17666d` — the kit's `fo3/surface/s14/run_s14.sh`; one headless job at a time)

* **G1 — at 0 (the defaults, with the ring of `ORBIT_SURFACE_READOUT.md` §15): PASSED, bit for bit.** His two `Scene_1` records of 2026-11-22
  (back 2 916 frames, front 6 034) against the defaults' replays of 2026-11-23 (`runs/S6_*`): the largest difference **0** on every frame — the gizmo,
  the camera's position and target, the piece; the support the same.
* **At 1 (the cast) against 0: within 3.6e-15 m** (back; front 8.9e-16 m) on every frame — 0 frames over 1 µm for the gizmo, the camera, the piece.
* **The queries a frame (k)**: not counted in the page (no counter there); the jitter's replays read the solver at 2 queries a frame on an approach
  and 13 on a contact frame (`APPROACH_CAMERA_JITTER.md`) — each one landing query at most: ≈ 13 × 5 µs more on such a frame at 1 on `Scene_1`.
* `npm run verify` on a quiet PC: 202 files, 2 557 tests, all green. No probe profile left; 5191 stopped.
* ⏳ His look at 1 (the slider "P2 engine"); then its default; then D9 withdrawn (§6 step 5).
