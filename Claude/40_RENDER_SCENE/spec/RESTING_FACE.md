# Resting-face selector — specification (prototype)

> **Status:** ✅ BUILT 2026-10-05 (⛔ unjudged by a hand) — `src/core/resting_face.ts`, `src/render/resting_face_wiring.ts`; one gap found
> while building is open (§14). ⭐ The orbited pieces' resting face is filled **PINK** — the pink ring's own colour (2026-10-06; it was
> yellow) — and seen faintly through its own piece. Built on `1.0.59p-from1.0.59m-`; carried to **`1.0.59r-`** (2026-10-05). The orbited pieces' resting face
> drives the alignment gesture → [`RESTING_FACE_ALIGNMENT.md`](RESTING_FACE_ALIGNMENT.md).
> **Source:** the owner's `resting-face-selection.md`, amended by the review of 2026-10-04 (§9) and the owner's decision on
> symmetry: *"the face which maximizes the number of plane symmetries in the vertical direction shall be preferred: this way, a
> bottle stands up, a simplified conical pine tree stands up, etc."*
> **Scope** (the owner, 2026-10-04: *"the selector shall be implemented at boot for every part in the game which is not seated … If a
> part is unseated, the selector shall be implemented at the moment it is unseated"*): **every part that is not seated**, at boot — the
> scene's parts and the prototype's orbited pieces (the green frustum, the turquoise prism) — and **a part at the moment it is
> unseated** (§11). In the piece's **own frame**. ⛔ It moves nothing: it only answers which face the piece rests on and what its
> principal axis is — the stable REFERENCE the rotation will start from (§12).

---

## 1. Input and output

**Input:** the piece's welded mesh — vertex positions and triangles in its own frame (`topologyFromMesh`, scale included) — uniform
density.

**Output** (all in the piece's frame):

| field | meaning |
|---|---|
| `ranked` | every surviving candidate, best first: its face id(s), outward normal, metrics (§3–§5) |
| `restingGroup` | the winning **equivalence group** — the faces the rule cannot tell apart (§6), e.g. the prism's two ends |
| `restingNormal` | the outward normal of the face chosen from that group (§6) — the one that will point DOWN |
| `principalAxis` | the solid's long axis (§7), or `null` when no axis is distinguished |
| `ambiguous` | the runner-up group, when it is within the ambiguity band of the winner (§5) — reported, never chosen |

---

## 2. The solid

- **Centre of mass `G`:** the volume centroid (signed tetrahedra from the origin over the triangles). ⚠ Not the bounding-box centre:
  the green frustum's `G` is 16.205 mm above its bottom face, the box centre 20.625 mm.
- **Inertia tensor** about `G` (the same tetrahedra) — for §7.
- **`diag`:** the bounding-box diagonal — every length tolerance is a share of it.

---

## 3. Candidates and the hard gate

**Candidate faces.** A candidate is a **planar support set**: the piece's logical faces (`meshTopology`), coplanar facets merged
(normals within `coplanarAngleTol`, plane offsets within `coplanarDistTol`).
⚠ This is exact only for a **convex** piece — both pieces are. A non-convex piece rests on its **convex hull**, so its candidates must
be the hull's faces; no hull is built in the project today (`collision_shape.ts` queries a support function instead). ⛔ Out of scope
now; the seam is the candidate list.

For each candidate, with its outward normal turned to point DOWN (along gravity):

- **Support polygon `P`:** the 2D convex hull of every vertex within `contactTol` of the plane.
- **`h`:** the height of `G` above the plane.
- **`c`:** `G` projected onto the plane. ⛔ Discard the candidate if `c` lies outside `P` — it cannot stand there.
- **`d_min`, `d_max`:** the smallest and the largest PERPENDICULAR distance from `c` to the lines of `P`'s edges. (Edges' lines, not
  corners — so a regular polygon centred on `c` has `d_min = d_max`.)
- **The tipping angle** `θ = atan2(d_min, h)` — how far the piece must tilt before it falls.

**Hard gate:** reject the candidate if `θ < thetaFloor`, **15°** by default.
⭐ Why 15° (lowered from the review's 25°, which would have refused the prism's end at 23.4° — the very face the owner wants): a
bottle of height 3 × its diameter stands (18.4°), one of 4 × lies down (14.0°), the 10 × 10 × 100 column lies down (5.7°), a cone of
height 3 × its radius stands (53.1°). ⚠ This one number decides how tall a piece may be and still stand up.

---

## 4. Primary criterion — the mirror planes about the vertical

**`M`** = the number of the solid's **mirror planes that contain the vertical** when the piece rests on that face: planes through `G`
whose normal is perpendicular to the candidate's normal. **The higher `M` wins**, before any score (§5).

⭐ This is the owner's rule. A bottle, a cone, a hexagonal prism on its end: one symmetry axis, vertical — `M` is the number of segments
(6 for the prism). The same pieces lying down keep only 2 (or 1).

**How it is counted** (exact up to a tolerance, no symmetry analysis of the mesh's connectivity):

1. **Candidate mirror normals `m`:** for every pair of vertices `(vᵢ, vⱼ)`, the difference `vᵢ − vⱼ` with its component along the
   candidate normal removed, normalised (skipped when shorter than `symTol`); duplicates within `symAngleTol` merged, `m` and `−m` being
   one plane. ⭐ Complete: any mirror plane that is not the identity maps some vertex onto another one, and that pair generates its `m`.
2. **The test:** reflect every vertex across the plane through `G` with normal `m`; the plane is a mirror plane when every reflected
   vertex lies within `symTol` of some vertex.
3. **`M`** = the number of planes that pass.

⚠ **The cost the source spec warned about, accepted by the owner:** a count is all-or-nothing. A chamfer or a draft larger than
`symTol` removes a plane outright. Below `symTol` it is ignored. ⚠ It reads the VERTEX SET, not the surface: a symmetric shape
triangulated asymmetrically is still symmetric (only indices differ); a symmetric shape whose vertices are not (an uneven tessellation)
is not.

Cost: `O(V²)` candidates × `O(V²)` tests per face, `V` the welded vertex count — 8 and 12 here; fine at creation up to a few hundred
vertices. ⛔ Above that, reduce the vertex set first (`reducePoints`, `collision_shape.ts`).

---

## 5. Secondary criterion — the score, within the same `M`

Among the candidates with the best `M`:

| metric | formula | captures |
|---|---|---|
| `S` stability | `θ / 90` | tip resistance — the only term with physical authority |
| `C` certainty | `1 − clamp(dist(c, centroid(P)) / d_min, 0, 1)` | 1 when the centre of mass sits over the support's middle |
| `I` isotropy | `d_min / d_max` | penalises long thin supports |

`score = 0.55·S + 0.20·C + 0.15·I`

⛔ **`U` (uprightness) is DROPPED.** It rewarded the long axis vertical as a perceptual bias; the symmetry count (§4) now decides
whether a piece stands up, on a geometric ground, and the two would fight.

**Ambiguity:** when the runner-up is within `ambiguityBand` (0.05) of the winner, the **lower centre of mass wins** (smaller `h`). ⭐ It
replaces the source spec's §5 shortcut (*shared tipping edges*), which does not fire on the green frustum: its bottom tips about its
long BOTTOM edge, its slanted side about its TOP edge (21.20 mm from `c`, against 21.55 to the bottom one). The lower-CoM rule is the
shortcut's principle without its precondition. The runner-up is still reported in `ambiguous`.

---

## 6. Equivalence groups and the face chosen

Faces the rule cannot tell apart — the same `M`, scores within `1e−6`, `h` within `contactTol` — form **one group**: the prism's two
ends, its six sides, the frustum's two slanted long sides. A tie inside a group is not an ambiguity.

**The face chosen from the winning group:** the one needing the **smallest turn** from the piece's current pose to point its outward
normal DOWN — i.e. the face whose WORLD normal (under the boot quaternion) is most aligned with gravity. ⭐ So the pose the owner orients
it to later is the nearest one, and the choice is deterministic.

---

## 7. Principal axis

The eigenvectors of the inertia tensor about `G`. The **principal axis** is the one with the **smallest** moment of inertia — the
direction of the largest extent (the green piece's length, the prism's axis).
**Degenerate:** when the smallest eigenvalue is within `axisDegenerateTol` (5 %, relative) of the next, no axis is distinguished →
`null` (a cube, a sphere). ⚠ The prism's two transverse moments are equal; that does not matter — only the long axis is reported.

---

## 8. Expected results (the golden vectors)

**Green frustum** (103.5 × 41.25 × 45 mm, top halved; `G` 16.205 mm above the bottom):

| face | θ | gate | `M` | `S` | `C` | `I` | score | `h` |
|---|---|---|---|---|---|---|---|---|
| **bottom** 103.5 × 45 | 54.2° | ✓ | **2** | 0.603 | 1.000 | 0.435 | **0.597** | 16.21 |
| top 51.75 × 22.5 | 24.2° | ✓ | 2 | 0.269 | 1.000 | 0.435 | 0.413 | 25.04 |
| slanted long side (×2) | 50.6° | ✓ | 1 | 0.562 | 0.880 | 0.640 | — | 17.44 |
| slanted short end (×2) | 12.0° | ✗ | 1 | — | — | — | — | 35.23 |

→ **rests on its bottom** (`M` 2 ties with the top; the score decides, far outside the band). Principal axis: its length (`x`).

**Turquoise hexagonal prism** (103.5 long, 51.75 across the corners; `G` at its centre):

| face | θ | gate | `M` | `S` | `C` | `I` | score | `h` |
|---|---|---|---|---|---|---|---|---|
| **hexagon end** (×2, one group) | 23.4° | ✓ | **6** | 0.260 | 1.000 | 1.000 | 0.493 | 51.75 |
| side (×6, one group) | 30.0° | ✓ | 2 | 0.333 | 1.000 | 0.250 | — | 22.41 |

→ **stands on one of its ends** (`M` 6 beats 2), the end chosen by the smallest turn from the boot pose. Principal axis: its axis.

**Rule-level vectors**, each shown to FAIL on a broken version first (rule 2): the gate at 15° (the 4:1 bottle lies, the 3:1 stands);
`M` for a 24-segment cylinder = 24 on its end, 2 on its side; a chamfer larger than `symTol` drops a plane, a smaller one does not; the
frustum's ambiguity resolved by the lower `h` once a band is set wide enough to include the slant; the degenerate axis of a cube.

---

## 9. What changed from the source spec, and why

| source | here | why |
|---|---|---|
| `thetaFloor` 20° | **15°** | lets a 3:1 bottle stand; the prism's end (23.4°) must pass for the owner's rule |
| score ranks everything | **`M` first, then the score** | the owner's symmetry rule; the score alone stood the prism on its end only through `U` and `I`, and laid a bottle down |
| `U` uprightness | **dropped** | replaced by `M`, on a geometric ground |
| §5 shared-edge shortcut | **lower `h` wins inside the band** | the shortcut's precondition fails on this frustum (§5) |
| `d_max` undefined | **edges' lines** | a regular polygon gives `I` = 1 |
| symmetric faces "ambiguous" | **equivalence groups** (§6) | twins are one answer, not two |
| §6 flatness, §7 accessibility | **not built** | no warped table; no mating face known at creation. ⛔ The accessibility filter is the seam for the assembly (a mating face known → applied BEFORE §4) |

---

## 10. Configuration

```
coplanarAngleTol     1°
coplanarDistTol      0.01 × diag
contactTol           0.005 × diag
thetaFloor           15°   (fixed — a slider later, §12)
symTol               0.005 × diag
symAngleTol          1°
wS, wC, wI           0.55, 0.20, 0.15
ambiguityBand        0.05
axisDegenerateTol    0.05 (relative eigenvalue gap)
```

## 11. Where it lives, and WHEN it runs

`src/core/resting_face.ts` — pure, engine-free (rule 1). Golden vectors in `tests/proto_resting_face.test.ts`.

**When:**

| moment | which parts | where it is called |
|---|---|---|
| **boot** | every part of the scene that is **not seated** — neither seated on a Pioneer (`st.links`) nor **placed in its goal** (§13.2) — and not frozen (§13.1) | once the bodies, the links and the goal status exist (`scene.ts`) |
| **boot** | the orbited pieces (green, turquoise) | at their creation (`createGreenBox`) |
| **unseated / leaves its goal** | a part that was seated last frame and is not any more | ⭐ AS BUILT: the seated set (on a Pioneer, or placed in its goal) is DIFFED every frame, after the goal commit (`restingFaceFrame`) — one funnel for EVERY path that frees a part: the unsnap, an unalign, a dissolve, and an UNDO that restores the links or the goal wholesale. ⛔ The first plan (a call in `unseatWorld`) would have missed the undo. |

⭐ The boot pass waits for the goal's BASELINE commit (its first frame): a part placed in its goal at boot is seated, so it must be known
first. In `Scene_1` that leaves the 5 parts that boot out of the goal (36 of 41 are placed).

**What is cached:** everything except the face chosen inside the winning group (§6) depends on the mesh alone, so it is computed once
per SHAPE and kept (`Scene_1`'s identical pieces share it). At an unseat only §6 runs again — the smallest turn from the pose the part
has AT THAT MOMENT.

**Which mesh:** the body's own collision mesh — the one the model reads (`topologyOfBody`; in `Scene_1` the contour around the core,
`D125`). ⚠ `Scene_1`'s parts are boxes, so convex (§3 holds); an imported non-convex part needs the hull seam of §3.

**Kept:** per part, in the scene state (`st.restingFaces`, by object id; the orbited pieces with `st.orbitPieces`). **Shown:** on the
HUD — the held part's resting face, `M` and axis; the orbited piece's on the green line.

## 12. Decisions (the owner, 2026-10-04 — every question answered)

1. **`thetaFloor` is FIXED at 15°** — *"fix. we can later make a slider"*.
2. **Inside a group, the face needing the smallest turn from the boot pose** (§6) — *"agreed"*.
3. **`M` beats stability for EVERY piece**, not only bottles and trees — *"every future piece. In any case, we will then rotate the
   piece so the face selector is only to have a reference for the rotation to start on a stable basis."* ⭐ So the resting face is a
   REFERENCE pose for the rotation to start from, not a final placement — which is why a symmetric face is preferred over a merely
   stabler one.

## 13. Decisions on the scope (the owner, 2026-10-04)

1. **Frozen bodies** (`Scene_1`'s floor) — **excluded** (*"agreed"*): a resting face for the table itself is meaningless.
2. **A part placed in its goal IS a seated part** (*"part placed in its goal: for me, this is a seated part"*) — **excluded** at boot, and
   it gets its resting face at the moment it **leaves** its goal (placed → not placed), as an unseated part does (§11).
   ⚠ With `lockPlacedPieces` on (the default), a placed part is locked and cannot leave — that moment then never comes, except by an
   undo that takes the placing back, which must reach the same call.
3. **A Pioneer whose Follower is seated on it** — **its own resting face**, on its OWN mesh, not the assembly's (*"agreed"*), until
   assemblies get a rule of their own.

## 14. Found while building (2026-10-05) — ⛔ open, for the owner

**A ROUND part lying down has NO face above the gate.** A faceted cylinder's side tips at HALF its facet angle — 7.5° for 24 sides —
so a round bottle 4× as tall as wide has its ends refused (13.9°) AND its sides (7.5°): no candidate at all. §3's *"one of 4× lies
down"* is true for a SQUARE-section bottle (its side tips at 45°), not a round one. ⭐ **As built, a fallback:** when nothing passes,
the least tippable face (the largest θ) is taken and the result is flagged `belowGate` (the HUD reads `⚠BELOW-GATE`) — so the round
4:1 bottle STANDS. ⚠ To decide: keep it; or treat a ROUND side as one support (the cylinder lies down, rolling being the table's
business); or lower the gate for such parts. Neither of today's two pieces reaches it.
