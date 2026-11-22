# THE TILTED-POLE ORBIT — THE TEST SCENES (package T1, its findings, T2 after C2W; 2026-11-16)

> **STATUS** · a record, moved WORD FOR WORD (2026-11-16, branch `1.0.147-`, to make room) out of [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md),
> whose §14 and §15 these were — their numbers kept; every other § named below is that file's. **OWNS** · the six test shapes and what was measured on
> them (F1 – F9) · **READ IF** · you build a test scene, RINGS, W8 or the surface's definition before step B · **THE OWNER'S DECISIONS** on what
> remains (2026-11-16, evening) · [`TILTED_POLE_CLOSE_IN.md`](TILTED_POLE_CLOSE_IN.md) §17.

⛔ **ARCHIVED (2026-11-22, the owner: *"archive properly so as not to pollute the pipeline"*)**: the branch `1.0.146t-` deleted, its worktree removed,
kept as the tag `archive/1.0.146t-Orbit-charts-test-scenes` (`f787193`) — to reopen: `git worktree add ../orbit_charts_test_scenes archive/1.0.146t-Orbit-charts-test-scenes`.

## 14. PACKAGE T1 — THE TEST SCENES, as briefed (2026-11-16, an Opus agent; before C2's wiring)

* **What**: six test shapes as scenes, in a THROWAWAY worktree (`../orbit_charts_test_scenes`, branch `1.0.146t-Orbit-charts-test-scenes`, from
  `ef14420`) — nothing of it enters the game; only the findings come back here (§15). Each: one placed body (or a few glued ones), the green piece, a
  goal, added as data the way `Scene_0bis` was (`src/content`, `BodySpec`): (a) an upright prism whose level top is NOT a rectangle; (b) a shape on
  which the charts choose RINGS (the simplest of [`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §6's); (c) a step — a low box against a high one; (d) an
  L-shaped level top (two boxes of one height); (e) a box turned 30° about the vertical; (f) a lying bar with pointed ends, thinner and longer than
  `Scene_0bis`'s.
* **What is run on each, headless, one run at a time**: the atlas (its zones, kinds, poles, caps, free and bound faces); far out a walk round (dx)
  and over the top and the bottom (dy); close in on each level face the tilt's entry, the layout shown against the entry edge, the exit over each side
  (the turn, the hold), the way out by distance; the square camera's target on the caps that are not rectangles; per frame the view's turn.
* **What is flagged**: a one-frame turn over the one speed's step (6.0°); a hold blocking a direction; a layout not carried from the entry edge
  (**W5**); a tilted frame whose map sits in the wrong box — the gizmo off the face, a wrong facet under it (**W7**); the square camera's target on a
  non-rectangular cap (**W8**); what RINGS needs that is not wired (**W12**). Nothing is fixed in this package.
* **As built** (2026-11-16): the six scenes and the probe on the throwaway branch (`367fa8a`, `a828c92`); T_b is a square bipyramid with a 1 mm
  band laid on a triangle (`BodySpec` has no octahedron) — the charts put it on RINGS; the findings → §15. `GAME_STRUCTURE.md` §7 not touched (no
  game scene added).

## 15. THE TEST SCENES — FINDINGS (before C2's wiring; package T1, 2026-11-16, an Opus agent — measured, nothing fixed)

**Where**: the throwaway worktree `../orbit_charts_test_scenes` (branch `1.0.146t-Orbit-charts-test-scenes`, `a828c92`; never merged) — the scenes in
`src/content/test_scenes.ts` (`?sceneIndex=5` … `10`), the probe `scripts/probes/t1_walk.mjs` and its batch `t1_batch.sh`. **Reproduce** (Git Bash, in
that worktree, one run at a time, 3 – 6 min a scene): `bash scripts/probes/t1_batch.sh "<index>"` (`PHASE=atlas|far|close`; `SHOW=<leg>` prints the
frames round that leg's largest turn). Both switches at their defaults (1). The probe: THE ATLAS (the world map's contour, `assignCharts`, the gravity
free faces, the zones) and the REAL faces (the parts' faces on their MODEL poses, coplanar ones merged); FAR a dx walk round, a dy to the top's limit
and to the bottom's; CLOSE IN a climb by dy up, then down — on every LEVEL real face met: W5 (the entry edge's inward way on the glass against the
finger's way: 0 = the layout carries the view), the view over the entry, the square camera's target; then four exits (up, right, down, left on the
glass): the turn, the hold, the same way again 6 frames (a hold blocks it), the other way, and back on by navigation (that re-entry examined too);
W7 (the gizmo on no real face; the map's facet normal, turned into the world, not the true face's); the way out by distance.
**The control**: `Scene_1` (`t1_batch.sh "1"`): every entry W5 0.0 – 1.6°; the far edge 180° and held (the same way again 1.8 mm); a side exit 90° –
120°, not held; one-frame turns: far drags 11.6°, timed turns 8.5 – 9.0° (W11's known level, §12), the way out 5.0°. ⚠ The probe's own artefacts:
the seams between pieces read "no face" (`Scene_1`, the L); the first entry after the approach is not yet square (the camera waits, T10); in a ZONE
the square camera's target is the zone frame's (not turned back: "90° off" there means nothing).

| scene (index) | what it is | the atlas |
|---|---|---|
| T_a (5) | an upright pentagon prism, 480 × 460 mm, 400 high | gravity: 5 cells, 2 caps of 5 corners — NO layouts (D-C2: polar at every distance), free |
| T_b (6) | a square bipyramid with a 1 mm band, on a triangle — the nearest `BodySpec` makes to the octahedron on a face | gravity breaks 8: the 6 side triangles and BOTH caps on RINGS (no layouts); the band's 4 slivers: 2 in the map (`BENT`), 2 dropped |
| T_c (7) | a step: a low box 400 × 160 mm against a high one 240 × 480 mm, one depth (480) | ⛔ the map ONE box, x 0 … 240, y 0 … 160 mm — no real face of either box (F1) |
| T_d (8) | an L-shaped top: two boxes 300 high | ⛔ the map the L's bounding SQUARE (6 facets; the top a 500 × 500 cap with 4 layouts) (F1) |
| T_e (9) | `Scene_1`'s box turned 30° about the vertical | 4 cells, 2 caps; each cap's 4 layouts along the turned axes — as designed |
| T_f (10) | a heptagon bar 240 × 240, 960 long with 180 mm tips, lying | the frame about x serves all 21 (the 14 tip faces as fans, the whole rule): a SPIT zone, as `Scene_0bis`; the bottom FREE |

**The findings** — each with its class and the scene that reproduces it:

| # | finding | numbers | class | AFTER C2W (T2) |
|---|---|---|---|---|
| **F1** | **A step and an L are not on the face map at all.** The world map (and so the atlas, `chartContour`) is the polytope of each direction's MAIN plane: on T_c the top's main region is the LOW top (larger), the −x side's the wall above it — their intersection a box neither part is. On T_d the top is the bounding square; the notch's two walls are not facets. The gizmo, cast to the real depth (D3), lands on real faces the map does not have, or on none | T_c: the low box's top and −x face never under the gizmo, far nor close in; no face 11 frames round, 86 up the front, 73 down. T_d: no face 81 + 34 + 43 frames of the dx round; at the top's limit (the pole = the box's centre = the notch's corner) the face under the gizmo FLICKERS top ↔ the notch's wall every 1 – 6 frames for ~500 frames; close in, the far edge over the notch drops the gizmo onto the notch's wall: **the dy hold SET with no turn (0°)**, the map's facet the top while the gizmo is on the wall (26 frames, 90° off) | **new** — structural (the faces contour is convex: "Step 8, what the contour misses"); W7 in its widest sense | **unchanged** — T_c's, T_d's whole output identical line for line; close in (`PHASE=close`, the probe's count corrected) the map's facet the top while the gizmo is on a wall T_c 42 frames, T_d 184; on no face T_c 193 of 2056, T_d 471 of 2986 — `frameBox` cannot reach it (the box is right, the contour convex) |
| **F2** | **W5 confirmed on a box turned 30°**: 4 of 10 entries onto a cap took a layout off the entry edge — 36° (the first), 90° (three: after the up and the right exits, the bottom's first entry) — the view turning 120° over the entry instead of 90°. Every entry on `Scene_1`, T_d's square and T_f's free face: 0.0 – 6.8° | T_e: 35.9°, −89.9°, −89.9°, +90.1°; the six others 0.0° | **W5** | **fixed but one** — off the edge 4 of 10 → 1: the three at 90° now 0.0°, the view over them 120° → 90°; frames over 6° in a timed turn 429 → 305. Left: the first entry (35.9°, the camera 38.3° off square — pending, not shown to be the layout) |
| **F3** | **W8 confirmed**: close in on a cap with no layout (T_a's pentagon top, T_b's RINGS triangles) no tilt; the square camera's target is the face LEFT | T_a top: 35.6° off square, the target 90° off the cap's normal; T_b top: 28.7 – 68.6°, 70.5°; T_b bottom (on the floor): 111°, 109.5° | **W8** | **unchanged** — the same numbers (T_b's output identical line for line) |
| **F4** | **A cap with no layout is a STALL close in** (polar at every distance, D-C2): a dy into its middle stops there | T_a up: not left, the same way again 0.0 mm (the other way 78 mm); T_b's top: three of four exits never leave it; the fourth turns the view 149° at the drag's pace (13.1°/frame, no timed turn) | W8 / D-T5 as decided — a stall where T1 wants a side face's walk | **unchanged, seen wider** (the probe's way back onto a face, `a828c92`): T_a's top 3 of 4 exits not left (down leaves, 144° at 6.0°/frame), its bottom 3 of 4; T_b as before |
| **F5** | **RINGS not wired (W12 measured)**: far out on T_b a dy from the boot elevation to the top's limit keeps the gizmo on ONE side triangle — the place stalls on a face gravity's map breaks | T_b: the cap after 7 frames, then 494 frames on it; the triangles' homes RINGS, served by gravity's columns map | **RINGS** | **unchanged** — 7 frames, then 494 on the cap |
| **F6** | **The way out from a cap with no tilt is not paced** (C3 paces the TILT's only): the square camera lets go at the latch's off frame and the view turns at the drag's pace | T_a bottom (`PHASE=close SHOW=approach-out`): 8.5 → 9.6°/frame, 78° in 13 frames; in the full run (after the far walk) **55.6° in ONE frame**; T_b 12.1°/frame | **new** (C3's rule, for the square camera alone) | **unchanged** — T_a `PHASE=close`: 9.6°/frame, 92° in all; T_b 12.1°. The 55.6° frame not reproduced: the full run now reaches the later exits and leaves from another state (C2W reaches nothing on T_a — no layout, no zone) |
| **F7** | **Timed turns over W11's level** at a bottom cap's side exit | T_c's bottom, exit right (to the high box's +x face): **18.9°/frame in a timed turn**; T_f's bottom (the spit's free face), exit right 11.8°; `Scene_1` 8.5 – 9.0° | **new** (W11's family: two clocks, §12) | **unchanged** — T_c 18.9°, T_f 11.8°; `Scene_1` 8.6° |
| **F8** | **A hold with no turn** | T_c's bottom, exit down: the hold SET, the view 0° net, then the same way again 292 mm (not blocked); T_d's far edge over the notch (F1) | **new** (the hold read off the map's square, not the real edge) | **unchanged** — T_c: SET, 0° net, the same way again 292.4 mm |
| **F9** | **The spit bar** (T_f): far out a dx goes round the bar's axis (the yaw 28° in 40 drags, as designed), its drags 8.8 – 9.0°/frame; a dy 13.3° in one frame out of a timed turn; close in the bottom (a free face, C4) entered 6 times at W5 0.0 – 3.4° | ⚠ 1 649 frames with the map's facet 90° off the real face — UNCONFIRMED: the probe may read `asmShown` in the zone's frame while `asmZone` is null | W7 (unconfirmed) | **WITHDRAWN — the probe's**: in a zone it records no map normal (NaN); JSON gave `null` and `null` passed its NaN test. Counted right (throwaway `f787193`): T_f **0** frames. The rest unchanged (13.3°, 8.8 – 9.0°/frame) |

**Not found**: W7 in its narrow sense (a tilted frame's map in the world box's turned corners) on T_e — 0 frames off a face, 0 with a wrong facet in
a tilt: the turned layouts work (F2 is the CHOICE of layout, not the map).

**What RINGS needs that is not wired** (F5, T_b): the place on the ring at the pitch's height and the azimuth's half-plane (`ring_chart.ts`, built,
not called); its cap's rays on the cap's own outline; the seams to gravity's chart (one transition); a close-in camera for its caps (F3, F4).

**Open — the owner's**: F1 is the largest: the faces contour cannot hold a non-convex level set (a step, an L) — with the surface's definition
"before step B" (`RND5.md`), not C2. F2 is C2's W5 as designed (`entryHeading`). F3, F4, F6 are D-T5's loophole measured: a cap that is not a
rectangle has neither a layout nor a target. ⚠ Outside the orbit: a 4-sided `BodySpec.prismSides` comes out a DIAMOND (`render/bodies.ts` turns a
vertex to the top), so "one edge flat at the bottom" holds for odd sides only.

**AFTER C2W** (package T2, 2026-11-16: the rebuild branch at `9f101a4` merged INTO the throwaway, every command above re-run one at a time): the
column AFTER. `Scene_1` the control: every entry 0.0° but the first (4.8°, the pending camera), the far edge 180° held (0.0 mm), timed turns 8.6°,
the way out 5.0°. T_a, T_b, T_c, T_d, T_f identical; only T_e moved (W5). W7 in its narrow sense still not found (T_e 0 / 0).
**WHAT REMAINS** — ⛔ **W8** (F3, F4, F6), the root measured: a cap with no layout takes no tilt (D-C2, D-T5 kept), so `squareFrame` has no
target there and keeps the face left; the polar orbit's place over its middle is its pole (the dy stalls, F4); C3 paces the tilt's way out only (F6).
Options: (a) a layout square to the ENTRY EDGE on any polygon cap (`freeEdges` / `freeEntry` give one per side — the spit's free-face rule on
gravity's caps): the tilt then serves the square camera, the exits and C3's pace; (b) polar kept, the cap's normal the square camera's target and its
let-go paced as C3's — the stall stays; (c) today's. **The owner's: reopen D-T5, (a) or (b).** ⛔ **RINGS** (F5, W12): `assignCharts` gives the
bipyramid's 8 faces to RINGS, the wiring serves them from gravity's columns map, which breaks them. Owed: the place on the ring (`ring_chart.ts`,
built, not called), its caps' rays on their own outline, one transition at the seams to gravity, its caps' close-in camera (W8's choice). **The
owner's: RINGS before step B, or such shapes wait.** ⛔ **F1** (structural, the largest): the contour is convex — the surface's definition before
step B (`RND5.md`). F7 (W11's two clocks, §12's A – D the owner's); F8 follows F1; T_e's bottom far edge held but the same way again 17.5 mm (as
`Scene_1`'s bottom at T1's control, 17.4: not new, state-dependent, open). The first entry's 35.9° needs the probe to print the layout: not done.
