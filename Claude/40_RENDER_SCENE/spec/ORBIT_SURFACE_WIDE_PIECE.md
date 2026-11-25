# A HELD PIECE WIDER THAN ITS FACET (class C24) — the rule R-W, and where C22 and C41 belong (package S15, 2026-11-25)

> **STATUS (2026-11-25):** ✅ the rule PROPOSED and BUILT as vectors on his word *"Then propose the rule for B. and implement"* (B = the classes of
> [`ORBIT_SURFACE.md`](ORBIT_SURFACE.md) §5.2 with no rule yet). **No game code changes**: P2 already answers the landing; the rule fixes what the
> gizmo's domain is, and the vectors (`tests/wide_piece.test.ts`) pin it. C22 and C41: their SURFACE part already answered by P2's vectors; their
> LAYOUT part is the orbit's (L3 / L4, §5.1 there) — ✅ DECIDED 2026-11-25: handed to the orbit's list (`RND8`), reopened ONLY if a scene shows
> an issue, else nothing built (§5).

## 1. The rules that bind (the four-part method, part 1)

* **P2** ([`ORBIT_SURFACE.md`](ORBIT_SURFACE.md) §2.2): the gizmo's depth is where the held piece, moved along the facet's normal, first touches
  the placed parts — the piece's WHOLE BODY is the ruler. ③: first contact is not rest; a footprint partly past an edge lands where it first
  touches; no stability test.
* **The orbit's layers are not the surface's** (§5.1 there: L3 the contour, L4 the atlas — *"described here only as what the gizmo's travel
  reads, not specified here"*); his word 2026-11-16: never reopen what drives the piece and the camera orbit.
* **C5** ([`SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §10.3): at its stage a part's way in starts on a facet of the face map over
  its seat — B4's second half (S8, `facetTowardGoal`) reports how far outside.

## 2. What a piece wider than its facet does today (measured, not assumed)

* **Its landing**: exact at any size since S1 — S1's vectors compare both engines with the brute force on `L52` (a 30 mm cube under pieces A,
  41.3 × 45, and B, 80 × 80), `L35` (a 10 mm pin), C22's thin bar (400 × 8 mm, narrower than either piece) (`tests/landing_map.test.ts`).
* **The gizmo's domain on a facet**: the facet's polygon (L3), the face switched `gizmoEdgeMarginMm` (5 mm) past its edge — the same for every
  piece. Past the facet's edge the piece's body still covers the facet up to half the piece out, so P2 lands there.
* **`Scene_1`**: its six facets are the cube's faces (≈ 500 × 483 mm); its loose pieces at most 126 mm (Piece1 126 × 29 × 30, Piece17 92 × 55 × 30,
  Piece2 34 × 82 × 30, Piece23 and Piece41 10 wide). **No piece is wider than a facet there**: R-W changes nothing in the game today.
* **Where it will matter**: `Scene_2`'s cases and banks (C24's examples: a piece as big as the assembly) — once P2 drives there (with `GM13`;
  today P2 drives on `Scene_1` only, `READOUT_SCENE`).

## 3. The rule R-W (part 3: the design, from prior art)

> **R-W — A piece wider than its facet: the body is the ruler, the facet stays the gizmo's domain.**
> 1. Its landing is P2's: the first contact of its whole body, at any size — over a narrow facet, on the level its body first touches (a taller
>    neighbour within its reach first, else the facet's own level); partly supported, where it first touches (③; no stability test).
> 2. The gizmo travels the facet as the orbit draws it (L3, the edge's switch 5 mm past) — **never widened by the piece's size**.
> 3. Hence the guarantee pinned by the vectors: **wherever the gizmo can stand on a facet, a piece at least as wide as the switch's margin LANDS** —
>    never "nothing to land on" — on one level continuous to the switch (no step at the facet's edge).
> 4. A part whose seat, seen along its way in, lies OUTSIDE its facet (a cantilever, a lid seated off its box) cannot be brought over its seat
>    from that facet: a defect of the SCENE, reported by B4 (S8) and forbidden by C5 — never patched by a wider domain.

**Prior art.** The configuration-space obstacle of a translating body (Lozano-Pérez 1983) and CAM's drop cutter: a cutter wider than the part
still has a contact wherever its body covers the part — the tool's centre may stand off the part. The movement surface of Oh and Stuerzlinger
(GI 2005, already `footprint.ts`'s source): the object slides with its reference under the cursor on the surface hit, its footprint free to
overhang the supporting face's edge — the cursor's surface is not widened by the object. R-W is that: the reference on the facet, the body
overhanging.

**Refused.** (a) The domain widened by the piece (the facet ⊕ the piece's footprint): every edge's turn would move with the held piece's size —
the camera's path a function of the piece, the closed orbit reopened (his rule). (b) A size threshold ("wider than the facet" switching a rule):
a step at a threshold (§2.6 (3) there, B6). (c) A stability test: ③ stands (not proposed now).

## 4. Obstacles and fallbacks (part 2)

| # | obstacle | fallback | owner |
|---|---|---|---|
| W1 | a seat past its facet's edge (cantilever, an offset lid) | none in the game: B4 reports it, C5 forbids it — the scene is redrawn or re-planned | the scene (B4 / C5) |
| W2 | a piece supported on one side only would tip | ③: it lands where it first touches; the touch is shown | P2 (decided) |
| W3 | a piece wider than the facet carried round an edge IN CONTACT: its inner half against the next face | the collision decides (P5) — ⏳ not measured | the closed orbit's — recorded, not reopened |
| W4 | far and medium the piece rides the shell (a box, `orbit_shell.ts`): its width is not in it | the solver keeps it out of the parts | the closed orbit's — recorded, not reopened |
| W5 | off `Scene_1` today's POINT reads the facet's level at the gizmo, not the body | R-W holds there when P2 drives (`GM13`) | the surface, with `Scene_2` |

## 5. C22 and C41 — ✅ DECIDED: their surface part answered, their layout part the orbit's, dormant

* **C22 very long, flat shapes**: the LANDING on them is P2's, exact (S1's thin bar, 400 × 8 mm, against the brute force); the LAYOUT (the spits'
  zones, the charts on a 730 × 483 mm slab) is L3 / L4 — the orbit's; *"the spits handle the layout"* is the orbit's own answer.
* **C41 a singularity on a singularity**: its landing parts by P2 (the study's Q01, Q05, Q08), a mouth at a pole by Q4 (Q02); the LAYOUT'S EVENTS AT
  A POLE are L4's (poles, fans — `ORBIT_CHARTS.md`) — the orbit's.
* ✅ **DECIDED 2026-11-25** (his word: *"Agree with 1 but mention this has to be reopened only if a scene shows an issue, otherwise nothing to be built as the orbit is currently satisfactory"*): both rows of §5.2
  marked *"surface: P2 — the layout: the orbit's"*, handed to the orbit's list like F17 and the mouth's lip ([`RND8`](../../00_CORE/queue_notes/RND8.md)) —
  **reopened only if a scene shows an issue**; otherwise nothing is built, the orbit being satisfactory as it is.

## 6. The audit (part 4) — the vectors, each RED first

`tests/wide_piece.test.ts` (10 = 5 × the two engines, the sums and the cast): **V1** over a 30 mm cube's top, everywhere the gizmo can stand (the
facet ± 20 mm: the facet and the 5 mm switch, read from `DEFAULT_CONFIG.gizmoEdgeMarginMm`), pieces A, B, the bar both ways and a 200 × 200 plate
LAND on the top (30 mm), 1 681 places each; **V1b** the reason: A lands until half the piece out (15 + 20.65 mm), then nothing; **V2** a tall
neighbour (60 mm, 10 mm beside): the plate lands on IT over the whole domain, A on the cube until its body reaches it (u > 4.35 mm) then on it;
**V3** one level from the centre to the switch along both axes; and the mutant's own check. **RED FIRST**: every vector with the held piece read
as a POINT (a 1 mm cube — today's gizmo off `Scene_1`): **8 of 8 red** on both engines (past the edge "nothing"; beside the neighbour the cube's
top). B4's own vector V10 (past its edge 50 mm out) covers W1's report.
