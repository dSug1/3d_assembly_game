# BLENDER COLLISION SHAPES AND BOUNDING BOXES — the specification (`3D8`, `3D9`)

> **STATUS** · ⛔ specified 2026-09-27, **NOT BUILT** — future rows behind `3D6`'s seams
> **OWNS** · what a Blender-authored collision shape (`UCX_`) and bounding box (`UBX_`) must be,
> how the loader reads and validates them, and what the game does with them
> **READ IF** · you are modelling a part in Blender, or building the `.glb` loader's collision half

> *"Detail in the md files what the future blender collision shape and box shall meet as
> specifications and functions"* — the owner, 2026-09-27

⭐ Context: today every body collides as ONE convex hull computed at spawn, and its broad-phase box
is derived from that hull ([`COLLISION.md`](COLLISION.md) §2, §8). The hull fills every hole, slot
and notch, so **insertion cannot work until this document is built**. The replacement is a drop-in:
two new implementations behind `CollisionShapeSource` and `BoundsSource`, one line in
`src/render/collision_wiring.ts`, and **no rule changes**. The asset pipeline itself (`.glb`, one
source of truth, materials) is [`MATERIALS_AND_IMPORT.md`](MATERIALS_AND_IMPORT.md).

## 1. What they are FOR — the functions

| | the collision shape (`UCX_`, `3D8`) | the bounding box (`UBX_`, `3D9`) |
|---|---|---|
| **its job** | the NARROW phase: GJK measures the gap between two bodies' pieces; every move is stopped, slid or clamped against it (`resolveMove`) | the BROAD phase: a cheap box test that decides which pairs GJK runs on at all |
| **what a wrong one does** | too big → parts stop short of each other and a peg never enters its hole; too small → parts visibly sink into each other | too small → **a real collision is MISSED** (the pair is never tested) — the one error the box may never make; too big → only a cost |
| **absent** | the body falls back to the hull at spawn | the box is derived from the collision pieces |
| **replaces** | `hullAtSpawn` | `boundsFromShapes` |

⛔ Neither is rendered, picked or used for faces: **what a finger taps (faces, the HitFace) stays
the RENDER mesh's** (`D50`), and so do the snap's face centres and normals. The collision shape is
what another body cannot enter — a different question (`D49`).

## 2. `UCX_` — the collision pieces

### 2.1 Naming and hierarchy

* One or more mesh objects per part named **`UCX_<RenderMesh>_NN`** — `<RenderMesh>` is the render
  mesh's object name **exactly** (case-sensitive), `NN` two digits from `00`. E.g. `bracket` →
  `UCX_bracket_00`, `UCX_bracket_01`. ⭐ The Unreal convention, so exporters, add-ons and artists
  already know it.
* A piece may be a child of its render mesh or a sibling in the same collection — the loader finds
  it by NAME, never by position in the tree.
* ⛔ A `UCX_` whose `<RenderMesh>` matches no render mesh is an ERROR (§5), never ignored silently.

### 2.2 Geometry — each piece

| requirement | value | why |
|---|---|---|
| **convex** | every vertex on the piece's own convex hull, within 0.01 mm (model units) | GJK is exact for convex sets only; a concave piece is silently hulled and its dent vanishes. ⭐ Concavity is made by SEVERAL convex pieces, never by one concave one |
| **closed, with volume** | ≥ 4 non-coplanar vertices; hull volume > 1 mm³ | a flat piece has no inside — a body could pass through it edge-on |
| **point budget** | ≤ 64 vertices per piece (`DEFAULT_MAX_SHAPE_POINTS`); ⭐ 8–24 is typical | more is REDUCED by `reducePoints`, with a warning — it costs every GJK iteration |
| **piece budget** | ≤ 16 pieces per part | a pair of parts costs `pieces(a) × pieces(b)` GJK runs per substep |
| **overlap** | pieces MAY overlap each other | the shape is their union; overlap is the easy way to avoid gaps between pieces |
| **units** | metres, scale applied (`Ctrl+A → Scale`) | the game is in metres; an unapplied scale is baked on load but hides the true size from the artist |
| **no mirrors** | no negative scale | not a GJK problem, but a mirrored piece usually means a mirrored mistake |

### 2.3 Fit to the render mesh — the tolerances that make the game work

| where | requirement | what breaks otherwise |
|---|---|---|
| **everywhere** | the union of the pieces follows the visible surface within **±0.5 mm** | beyond it, parts visibly float apart or sink in |
| ⭐⭐ **on every face that MATES** (a FollowerFace / PioneerFace a level uses) | a piece face **coplanar** with the visible face within **0.1 mm**, and covering it | the aligned Follower SLIDES along the Pioneer's collision surface onto the cursor (`COLLISION.md` §5); a collision face proud of the visible one by more than the capture offset makes the snap **unreachable** |
| **every hole, slot or notch that receives a part** | modelled as EMPTY by the union — e.g. a U as three pieces | the whole reason for `3D8` |
| **clearance of a fit** (peg in hole) | the hole's pieces at least **1 mm** wider than the peg's per side (⚠ see §6.1) | the collision skin keeps every pair apart; a fit tighter than the skin can never enter |

### 2.4 Render state

Hidden (`display as: Wire` in Blender is fine — the loader hides them regardless), no material
needed (ignored), not pickable (the loader turns picking off).

## 3. `UBX_` — the bounding box

* **Zero or one** mesh named **`UBX_<RenderMesh>`** per part: a box of exactly 8 vertices.
* ⛔ **AXIS-ALIGNED in the part's LOCAL frame** — the game stores `{ min, max }` in local coordinates
  and rotates its 8 corners per query (`COLLISION.md` §2). A rotated box is rejected (§5).
* ⛔⛔ **CONTAINS every `UCX_` vertex of the part** (and every render vertex if there are no `UCX_`),
  with a margin ≥ 0 — a box that cuts a piece MISSES collisions (§1).
* Tight is only a performance goal: a loose box costs GJK runs, never correctness.
* Absent → the box is derived from the pieces (`boundsFromShapes`), which is always correct.

## 4. Export

* **glTF 2.0 binary (`.glb`)**, `+Y Up` (the game's up is `+y`, gravity `−y`), *Apply Modifiers* on,
  selection or collection including the `UCX_` / `UBX_` objects.
* Mesh compression (Draco) **off** until the loader carries a decoder.
* ⭐ Object names survive glTF export as node names — that is the whole contract; no custom
  properties are needed.

## 5. What the LOADER must do — the functions to build

| step | function (engine-free where marked) | rule |
|---|---|---|
| 1. find | `render/`: walk the loaded `.glb` nodes; group `UCX_<m>_NN` and `UBX_<m>` under render mesh `<m>` | by name only; unknown `<m>` → error |
| 2. transform | bake each piece's node transform relative to its render mesh's node into the BODY'S LOCAL frame — the frame `SceneObject.shape` lives in | ⛔ the same frame as today's hull, or every rule reads a shifted body |
| 3. validate | `core/`: `validateAuthoredPieces(pieces, renderPoints, tol)` and `validateAuthoredBox(box, pieces)` — pure, vectored | §2.2, §2.3 (surface fit), §3 (axis-aligned, contains) |
| 4. reduce | `reducePoints` per piece above 64 vertices | warning, not error |
| 5. register | `authoredShapes: CollisionShapeSource` and `authoredBounds: BoundsSource` — maps `ObjectId → ConvexPart[]` / `Aabb` | ⭐ **per-body fallback**: a body without valid pieces answers from `hullAtSpawn` / `boundsFromShapes` |
| 6. compose | `render/collision_wiring.ts`: `SHAPES = authoredOr(hullAtSpawn)`, `BOUNDS = authoredOr(boundsFromShapes(SHAPES))` | ⛔ the ONE line that changes |
| 7. hide | pieces and boxes invisible and unpickable | §2.4 |

⛔⛔ **A REJECTED SHAPE FALLS BACK, IT NEVER VANISHES.** An invalid piece rejects ALL of that part's
pieces (a partial set would leave a hole the artist did not mean), and the part falls back to its
hull — which blocks MORE, never less. ⭐ It is **named on the HUD**, like `⛔NOSHAPE` today:
`shapes authored 5 · hull 2 · ⛔rejected(bracket: piece 01 concave)`.

## 6. Open points, stated before they bite

1. ⚠⚠ **THE SKIN IS IN MILLIMETRES ON THE GLASS**, so in WORLD metres it grows as the camera pulls
   back (rule 3 — `collisionSkinMm` 0.3 mm on the glass is ~1–2 mm of world at the boot camera). A
   modelled clearance is in world metres. ⛔ So a fit that enters close up may refuse to enter
   zoomed out. Before `3D8` ships, decide: a skin in WORLD units for bodies with authored pieces, or
   a skin capped in world units, or clearances designed for the farthest zoom.
2. **Seated members never collide with each other** today (`COLLISION.md` §5) because a hull cannot
   represent a fit. With authored pieces it could: revisit whether a seated assembly's members
   should test each other (a part twisted inside a slot would then be stopped by the slot's walls).
3. **The snap's face data** stays the render mesh's (§1). A level whose mating face is curved or
   split needs the face definition (`D50`) to agree with the piece's flat face — check the first
   real asset against §2.3.

## 7. The vectors to write first (each RED against the hull-only build)

1. An L exported as two pieces lets a cube into its notch; the hull does not (⭐ already a stub in
   `tests/collision.test.ts` — the seam's proof).
2. Naming: `UCX_bracket_00` groups under `bracket`; `UCX_Bracket_00` does not; an orphan is an error.
3. A concave piece, a flat piece, a piece with 65 vertices: rejected / rejected / reduced.
4. A `UBX_` that cuts a piece, and a rotated `UBX_`: both rejected, the derived box used instead.
5. A rejected part falls back to its hull and is NAMED — never an empty shape.
6. Local frame: a piece authored off the render mesh's origin lands where the render mesh shows it.
