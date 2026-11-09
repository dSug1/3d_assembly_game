# The polar orbit's random walks and root causes (2026-11-09, branch `1.0.110-` → `1.0.110-Polar-orbit-issues`)

> The record behind `spec/POLAR_ORBIT_CLEANUP.md` §4 – §5. Part A: the walks (`scripts/probes/walk_probe.mjs`, `walk_analyse.mjs`, `walk_scenarios.json`), as measured before the fixes. Part B: the root-cause analysis (a Fable agent), verbatim. ⚠ Two of Part A's claims are corrected by Part B: the solved yaw DOES follow at the pole (I1), and I16 is mostly the probe (the product inserts the ring as a vertex of both lines).

## Part A — the walks

Tooling (in the repo, uncommitted): `scripts/probes/walk_probe.mjs` (scenarios from a view, legs that change direction under one press,
approaches A + drag, a seeded finger tremble `wob`, every frame the gizmo / piece / camera / angles / the drawn lines' breaks and the gizmo's
distance to them; each line break sub-sampled 16× on `mapGizmo` → FALSE break or MAP JUMP), `scripts/probes/walk_analyse.mjs` (the checks),
`scripts/probes/walk_scenarios.json` (19 scenarios). Recordings: `%TEMP%/walks/before_{a,b,c1,c2,wob}.json`, analyses `before_*.txt`.
Dev server: `npm run dev:usb:bare` → http://127.0.0.1:5174/ (5173 is taken by another server on this machine).

Geometry (mm): the cube x −242…247, y 15…499, z −51…432; protrusions Piece42 (+x, frustum, slanted faces, x 247…289, y 404…508, z 168…214),
Piece43 (below, y −26…16), Piece44 (top, y 498…540, x 0…46, z 139…243), Piece45 (front, z −92…−50, x 0…46, y 138…242). Grooves (loose pieces'
empty slots, open through the whole depth): top-left x −242…−193 y 414…499; Piece1's x −135…−6 y 467…499; bottom-left x −242…−147 y 16…73;
x 104…117 y 16…74. Yaw: −90° faces the front (−z), 0 +x, 90° back (+z), 180° −x. Pitch = (2v−1)·90°.
Face map as built (measured): FIVE facets — +x at e 0.2135 (x = 213.5), −x at e 0.1475 (x = −147.5), front (−z) at z −50.5, top y 498.5,
bottom y 15.5. ⚠ The cube's outer ±x faces are at +247 / −242: the two side facets sit ON INTERNAL faces (Piece32's +x side, Piece30's −x side —
both covered by their neighbours). Columns: +x mid 22.5° hw 67.5° (−45°…90°), −x mid 157.5° hw 67.5° (90°…225°), front 270° hw 45°.

### What the walks found (19 scenarios + 4 with a tremble, ~83 000 frames, 0 page errors)

1. **I15 (NEW) — THE SEAM TRAP: the solver is absorbed at yaw = 90° exactly.** At the seam the I11 discontinuity puts (the +x / −x columns'
   join, no back facet), the solved angles `st.pieceQ` lock at yaw 1.5708 and NEVER leave — dx (several full turns of the orbit's own target),
   dy (to both poles), mixed: the gizmo and the piece 0 mm for 350 … 2100 frames, at every distance: far (ap 1.0, far_rings frame ~1288: v 0.162),
   mid (ap 0.621, mid_rings_zig frame ~213), close (random_5: pq yaw −270° v 0.350 for 955 frames, −268° v 0.194 for 1071 frames;
   contact_slide_front pq −269.8°). Only a new approach / a slide changes anything. The orbit's own target (`st.orbit.yaw`) runs away freely.
2. **I11 confirmed** — the gizmo leaps 490 mm across the back at pitch 0 (and 440, 245, 228, 220, 169 mm at other pitches; 523 / 375 / 345 / 266 /
   250 mm in the BOTTOM cap's back quarter, 261 / 245 mm in the TOP cap's) — the piece 430 – 3283 mm and the camera up to 4.4 m (far out).
3. **I1 confirmed** — at v = 0 / 1 the gizmo still at the cap centre (33, 540, 191) / (33, −26, 191) while dx spins the yaw (pole stalls 30 – 732
   frames) — and the SOLVED yaw does not follow either (pq yaw stays while the orbit's runs).
4. **I14 reproduced, only with a finger tremble** (±2 – 3 px a frame): reversals of the gizmo AND the piece (3 – 4 in 5 – 17 frames, 10 – 23 mm
   back-and-forth, camera 8 – 33 mm) over the top's edges close in (ap 0.45 – 0.49): the right-top edge (230, 499, 87…165), the front-top edge
   (169, 499, −51), Piece3's top near the left edge (−167, 498, 93…142 — the owner's place), next to Piece44 (64…74, 498, 88…112). With a
   STRAIGHT finger: no back-and-forth anywhere (the first count's were reversals the scenario asked for). ⚠ Measured: close in dx is ~1.35° of
   yaw a px (far out ~0.6°): a ±2 px tremble moves the gizmo ~±15 mm while the camera is ~20× closer than far out.
5. **I3 confirmed** — the slide latched on Piece3's / Piece44's / Piece4's top: legs blocked 39 – 189 frames, *"at the edge of the hosting faces —
   reverse to come back"*, and *"blocked by Piece44"*.
6. **Steps / protrusions / grooves (I10, I7)** — the gizmo leaps 46 – 49 mm in one frame onto / off Piece44 (top), Piece45 (front), Piece43
   (bottom); ~95 – 99 mm at the bottom-left groove (x −243 ↔ −148, y 63 – 84; a 97 mm back-and-forth there with a dx+dy diagonal); 151 mm on
   the top over Piece1's groove (−42, 499, 292).
7. **The lines (I8 and more)** — the green breaks FALSELY at every 90° corner band (yaw 216° – 232°, 306°, 78° – 96°: the map continuous there,
   sub-step ≤ 6 mm, the chord 12 – 156 mm); the red at the ±45° edge bands (pitch −54° … −42°, 30° … 48°). Real map jumps on the red at
   pitch 18° and −30° (50 – 95 mm: steps on the sides), −60° … −84° (58 mm: Piece43 / the bottom grooves), 78° … 84° (41 mm: Piece44).
8. **I16 (NEW) — the gizmo off its own lines**: the ring 9 – 93 mm from the nearest JOINED segment of the green or the red (533 + 132 + … frames):
   at the back corners (120, 498, 430) 93 mm, the bottom-back (−96, 16, 427) 52 mm, the front-left corner (−205, 257, −51) 38 mm, the pole
   (33, 540, 191) red 43 – 44 mm for 75 frames, Piece42's slanted face (264, 497, 176) 9.6 mm.
9. **Not issues (checked)**: the gizmo against the finger — 10 frames in all, each at a leap; the piece's distance to the gizmo changing (the shell
   keeps the piece while the gizmo steps in depth); one camera roll of 5° after a slide.

## Part B — the root causes (verbatim)

Scratch (all under `C:\Users\sugit\AppData\Local\Temp\claude\58fcf8122906abb9\6a51aa41-7116-495a-94d2-1ddc35769a96\scratchpad\fable\`):
`stalls.mjs` / `seam.mjs` (the recordings' stalls), `gains3.mjs` (finger→screen composition), `probe1.js` + `probe1.out.json` (one boot: the face map, its stacks, the 240 faces fed to it, sweeps), `an1.mjs` (its reading), `drive_probe.mjs` + `steps_*.json` (a CDP driver: reset / drag / eval; `steps_solver.json` runs the real `solveOrbitStep` in the page), `fm/` (the face map rebuilt offline from the dumped faces with `node --experimental-strip-types`: `run.mjs`, `run2.mjs`, `run3.mjs`, patched copies `face_map_tol.ts`). Nothing under `src/`, `tests/`, `Claude/` touched; no temp profiles left.

### 0. The short version

Six root causes carry the sixteen issues. Two are in the DATA the face map is built from (R1, R2), one in the edge blend's own cast (R3), one in the solver (R4), one is the chart's topology (R5), one is the slide's ownership of the drag (R6). Three doc explanations are refuted: the solved yaw DOES follow at the pole (I1), "the gizmo off its lines" (I16) is mostly a probe artefact plus I8/I10, and I15's trap is not the seam per se but the solver's inability to stride across any ring discontinuity larger than `spare·0.9`.

| root | issues it carries | measured |
|---|---|---|
| **R1 hidden (mated) faces make the facets** — `mainOf` picks the largest coplanar region, internal planes included | I8, I13, I14, half of I11's jump, I15's chord size, I16 | +x facet at **213.5 mm** (real face 247.5), −x at **−147.5** (real −242.5); contour 361 mm wide vs 490; 116 of 240 faces are ≥90 % mated |
| **R2 clip tolerance 1e-9** (F9) | I11 (no back facet) | offline: 1e-9 → 5 facets; `MAP_COPLANAR_M` → 6, back at 432.5, four 90° columns |
| **R3 the edge blend defeated by its cast; no blend in the cap bands** | I11's 490 mm step, I13, I14's 17–32 mm spikes, I15's trigger | yaw 86…89.5°: x = 247.5; 90.0°: 2.5; 90.5°…: −242.5 (no blend); pitch 44.5/45.0/45.5° at the right-top edge: x 230.9 / **247.5** / 230.1 |
| **R4 the solver cannot cross a ring discontinuity > `spare·0.9`** | I15 (new), the close-in "frozen" blockages of I10/§18-C1(a), the dy poisoned at the seam | real solver in page: bottom band, ap 0.621, +4.05°: **24 queries, 0 progress, deferred, rest 4.05°**; far out crosses only because the jump (245 mm) < 269 mm |
| **R5 one polar chart** | I1, I12, I6, the quarters' seams | d(anchor)/d(yaw) = **0.000 mm/rad** at v = 1; the red at yaw 60° collinear to the cap centre (slope 1.20 vs 1.20) |
| **R6 the slide owns every drag; its camera reads the finger** | I3, I4 | `close_top_I14`: 1922 frames piece still, camera **7573 mm**; `random_4`: 2031 frames "at the edge of the hosting faces" |

### 1. R1 — THE FACES CONTOUR IS BUILT FROM HIDDEN FACES (the biggest one)

**Mechanism.** `faceMapOf` (`src/render/assembly_wiring.ts:343–364`) feeds EVERY face of every placed part — the faces glued to a neighbour included. `stackOf` (`src/input/face_map.ts:374–394`) groups them by plane and `mainOf` (:397) takes the LARGEST closed region as the facet's plane. On the cube the glued internal planes are the largest: the +x stack (probe1 dump) holds `247.5: 2364 cm²`, `213.5: 2364 cm²`, `200.5: 2364 cm²`, `7.5: 2364 cm²`… — a tie at 2364 cm² (every full column of pieces is one plane), broken by order → **213.5**. The −x stack: `242.5: 1669 cm²` (the real outer face, cut by two grooves) against `147.5: 2364 cm²` (Piece30's inner side, **88 % mated** — `fm/dbg2.mjs`) → **−147.5**. The painting (0.33 deep) never showed it because each side was ONE piece's face.

**Consequences (all measured, `an1.mjs`):**
- The contour's core is `x −147.5…213.5` while the real cube is `−242.5…247.5`: the top, bottom, front (and the back, once it exists) polygons are clipped **34 mm / 95 mm short of the real edges** (facet 2 FRONT `t [−147.5, 213.5]`). A dx on the front sweeps the place over 361 of 490 mm; the last 34/95 mm are reached only through the edge blend (`frontCorner` sweep: the place `s` stops at x 213.5 at yaw −45° while the gizmo `pt` is already at 230; the +x facet's place stays at x 213.5 and D3's cast puts the gizmo at 247.5 — **34 mm off its own place on every point of the +x side**).
- **I8 (false breaks)**: through the 10° band the two facets' real points are 34 mm apart (front corner) / 95 mm (left corner) so the DRAWN point moves 12–29 mm a sample while `t.surface` moves 3.75 mm → `sampleJoins` (`assembly_wiring.ts:597–605`, `2.5 × place + 2 mm`) breaks. Control: the front–top edge, whose facet IS the real plane, is smooth (worst step 0.7 mm per 0.1°).
- **I14 (the top's edges jitter)**: `steps_edge.json`: right-top edge (yaw 0°) pitch 30→60° by 0.1°: the gizmo goes x 247.5 (side) → 245.7 at 40.5° → 230.9 at 44.5° → **247.5 at 45.0°** → 230.1 at 45.5° → 203.5 at 55° → 2.4 mm/0.1° beyond: a built-in back-and-forth of 17 mm around the bound, and the blend's target is the top's edge point at the INTERNAL plane (213.5), so the gizmo leaves the real edge by 17 mm and comes back. Left-top edge (Piece3 proud): −170.4 / **−192.5** / −169.6 → 32 mm. A ±2–3 px tremble (±0.6°) across the bound reproduces the owner's "jitters with back and forth over those edges" — the walk's I14 reproduced only with a tremble, exactly these places.
- **I13**: yaw 85°, pitch −36…−56°: the gizmo x 247.5 → 171.8 → 136.6 → 119.2 → **198.6** (`i13` sweep): the v-blend mixes the +x facet's real point (247.5) with the bottom cap's rim at the facet's edge x = 213.5 (`capSpan` reads the cap polygon clipped by the internal +x plane), then the blended normal (+x −y)/√2 is cast and lands 77 mm sideways (R3).
- **I15/I11's chord**: with the back facet restored (R2) but R1 unfixed, the back's polygon is `t [−213.5, 147.5]` — the corner chords stay 34/95 mm.

**Fix (one rule, one place): the stack reads the EXPOSED area.** In `stackOf`, a face's rectangle contributes to `real` only where no face of ANOTHER part with the opposite normal lies on the same plane (`|level_a + level_b| ≤ MAP_COPLANAR_M` along `n`, rectangles intersecting) — the mated area is subtracted cell by cell in `filledRegion` (mark the mated rectangles as "not real" after the real ones; a fully mated face contributes nothing). `mainOf` then compares exposed areas; `regionReal` (used by the void rule) also becomes right (a glued face is not a surface). Textbook rectangle clipping, engine-free, O(faces²) once per placed set (240² ≈ 58k rectangle tests, negligible). **Verified offline** (`fm/run3.mjs`: mated ≥ 50 % removed + R2): six facets `+x 247.5, −x −242.5, front −50.5, back 432.5, top 498.5, bottom −15.5`, core `−242.5…247.5 × 15.5…498.5 × −50.5…432.5`, four 90° columns — the ideal cube map. ⚠ The per-face filter (my experiment) is not the fix: Piece30's side is 88 % mated and the rule must work on AREA, not on whole faces.
**Vectors RED today**: (1) two unit boxes glued at x = 0 with a third box behind them making the x = 0 plane the largest: the +x facet must be the outer face (today 0); (2) `Scene_1`'s dump (the 240 faces of `probe1.out.json` can be the fixture): +x facet `e = 0.2475 ± 1e-6`, −x `−0.2425`, core width 490 mm; (3) a glued face's cells are not `regionReal`.
**Risk**: a face mated with a FROZEN body (the floor) is not fed (frozen excluded) — unchanged; faces of a part mated with a loose piece: loose pieces are not placed, so they do not cover — correct (the slot is a surface the orbit sees). Cost: none per frame.

### 2. R2 — the clip tolerance (F9, confirmed)

`facetPolygon` keeps a vertex within `1e-9` of a plane (`face_map.ts:444–446`); the back's plane from float32 triangles is `0.432500005126` and the box `0.43250000000000005` (dump: back faces' levels). Offline: with `1e-9` → 5 facets; with `MAP_COPLANAR_M` → **6 facets, the back `e 432.5 share 1.000`, columns 0°/90°/180°/270° hw 45°**. Fix exactly F9 (one constant, both comparisons at :444 and :446). Vectors as the doc says; add: the back's share ≥ 0.95 on the dumped `Scene_1` faces.

### 3. R3 — the edge blend is defeated by its own cast, and the cap bands have no blend

**Mechanism 1 (the §18-3 cast).** `blendThroughEdges` (`face_map.ts:860–902`) mixes the two facets' points, then casts along the blended normal from `chord/2 + 5 mm` in front and TAKES any hit more than 0.1 mm in front of the chord (:897–898). At a column seam whose two edge points are far apart (R1/R2: 490 mm along the back face), the chord lies ALONG a face; the near facet's own face is "a surface in front" and the gizmo snaps back onto it. Measured (`steps_seam6.json`, pitch 20°, in-frame and between frames identical): `86…89.5°: x 247.5`, `90.0°: 2.5` (the midpoint only when the blended normal is exactly zero → no cast), `90.5…94°: −242.5`. The I11 "jumps within 0.25°" is this. The same cast makes the 17/32 mm spikes at exactly pitch 45° (R1) and I13's 77 mm sideways landing (diagonal normal at the bottom edge).
**Mechanism 2 (no h-blend beyond the caps' first band).** `edgeBlend` (:826–833): when the two columns share the same bounds (`same`), the slice-end blend is applied only for `p ∈ [lo − E, hi + E]`; in the bottom band at pitch −61° (v 0.162) the gizmo jumps **284 mm** raw (`175,15.5,381 → −109,15.5,381`, `seam` dump) and the solver stuck there 354 frames (`far_rings @1316`).
**Fix.** (a) After R1+R2 the chords at convex edges of a box vanish (both facets' points coincide at the real edge) — the cast becomes a no-op there; keep it for proud parts but make its acceptance a SAGITTA rule: accept a hit only if it lies within `BLEND_REACH_M` of the segment between the two ENDPOINTS' own surface points projected along the blended normal — i.e. the hit is a surface the chord CUTS, never a face the chord runs along (equivalently: reject a hit whose lateral distance from the chord's midpoint exceeds `chord/2 · tan(θ/2)` for the dihedral θ between the two facets' normals; for 90° that is `chord/2`, and the +x face hit at 238 mm of a 490 mm chord is rejected only because its direction is along the chord — compute the hit's offset along the chord direction, not along the normal). (b) Apply the slice-end blend in the cap bands whenever `|a| > 1 − bandY`, dropping the `same` shortcut (the quarters' rims differ wherever the two columns' facets differ in width). (c) The bound tie: make `edgeBlend`'s `below` and `mapTarget`'s facet choice read the bound on the same side with the same EPS so `w` is continuous through `p = B[j]` (today `p <= B[j]` vs `while (p > B[i+1])` agree, but the mix at exactly the bound casts from the corner's diagonal and lands on the side — covered by (a)).
**Vectors RED today**: the dumped cube at pitch 20°: `mapGizmo` over yaw 86…94° every 0.5° has no step > 15 mm (today 245/490); the right-top edge pitch 30…60° every 0.1° monotone in x (today 247 → 230 → 247 → 230).

### 4. R4 — THE SOLVER IS ABSORBED BY ANY DISCONTINUITY OF ITS RING (I15, and the close-in freezes)

**Mechanism.** The anchor `ringAnchorAt → placeOffset → placeAtAngles(gizmoAtAngles …)` inherits every jump of the gizmo map (the seam's 490/284 mm, I10's 46–99 mm steps at grooves/protrusions, D3's depth steps are absorbed by the shell but the LATERAL ones are not). `solveOrbitStep` (`piece_orbit_solver.ts:318–361`): `spare = g − gapM` with `g ≤ LOOK_M = 0.3` (`nearestObstacle` returns `maxM` when nothing is near — `collision.ts:447`), so far out `spare·0.9 = 0.269 m`; `fitStride` (:123–131) shrinks `t` until the sub-arc ≤ `maxM`; an arc containing a jump J > maxM can only fit by NOT crossing → the piece converges geometrically onto the seam (walk: `pq = 90° ± 3e-6`, `mid_rings_zig` 368 + 530 + 464 + … frames; `random_5` 699 + 768 frames), each iteration costs one `gapAt`, 24 → `deferred`, `orbitFrame` keeps the rest (:693) → `st.orbit` runs away (716°, 1085°) and a later dy is scaled with the yaw backlog in one vector (`plus(q, rest, t)`, t → 0) → the dy is dead too (walk: dy legs at the seam 0 mm). Measured with the REAL solver in the page (`steps_solver.json`): `bottom band, ap 0.621, 89.99° + 4.05°: travel 300 mm, first stride t = 0, 24 queries, deferred, rest 4.05°`; `side close ap 0.45: gap 16 mm → 24 queries, yaw 89.993, deferred`; far out `bottom 89.9976 + 4.05° → crossed in 2 queries` (J 245 < 269) and the walk's far stall at the same place was the calm's bend making J larger (the anchor jump depends on the shown direction: 1406 mm when the direction is opposite the calm's normal, 490 without the calm — `steps_seam.json`). So the trap condition is **J_anchor > spare·0.9**, which close in (gap ≈ the approach distance, 16 mm) every I10 step satisfies — the walk's "BLOCKED" runs at the grooves and at Piece44 with `tc false` (not touching) are this, not collisions.
**Fix (the solver, one rule).** A ring discontinuity is not a wall: when `fitStride` returns 0 while the gap at the start is open (`g ≥ gapM`), take the smallest sub-step that fits as a JUMP if its landing is admissible (`gapAt(landing) ≥ gapM`, one query) — the solver's own rule says admissibility reads the pose alone. Also in `orbitFrame`: a deferred solve that made NO progress drops the backlog beyond this frame's own input (today only `blocked` resets the target), so the orbit's target can never run hundreds of degrees ahead of a parked piece and a dy is never scaled by a yaw backlog. Cost: ≤ 1 query. Risk: a lateral jump across a thin part — the landing is checked, the sweep is not; the jump is the ring's own, so no continuous path exists anyway.
**Vector RED today**: a synthetic `SolverEnv` whose anchor is `[yaw, 0, 0]` for yaw < 1 and `[yaw + 0.3, 0, 0]` beyond, gap 0.3 everywhere, `solveOrbitStep({yaw: 0.99}, [0.05, 0])` → today `deferred, q.yaw ≈ 1 − 1e-9, 24 queries`; after: `q.yaw = 1.04, deferred false`. A second vector: the same with `[0.05, 0.1]` → `v` must advance.
⭐ With R1+R2+R3 the cube has no seam jump; R4 is what makes the orbit robust on every OTHER assembly (steps, grooves, proud parts).

### 5. R5 — one polar chart (I1, I12, I6)

I1: at v = 1 `d(anchor)/d(yaw) = 0.000 mm/rad` (dump `pole`), the solver takes the step whole (travel < 1e-12, :279) and **the solved yaw follows exactly** (`far_meridians` f366–480: `pq −73.38 → 129.23` with `ov`) — the walk file's "the solved yaw does not follow" is wrong; what the player sees is right: nothing moves but the camera. I12: the red at yaw 60° over the top runs from the rim (203.5, 333.6) to the centre (33, 191): every sample on that line (slope 1.20 = the centre's) — by construction of `mapTarget`'s cap (:729–739). I6 (§18-C2) is the same singular Jacobian (a cheap yaw near the pole) plus I2's Piece44. These are intrinsic to one spherical chart with a pole; F1 (cap at 80°) hides the pole, keeps the radial red and the quarters' seams; F10 (the facet frame turned over the cap: the top charted in the column it was entered from, x/z linear) removes I1, I12, I6 and the cap seams together — but it is STATE (which column), which the owner's D1 already accepted. Order: F10 after R1–R4, F1 only as a stopgap.

### 6. R6 — the slide owns every drag and its camera reads the finger (I3, I4)

Code: `hoverDragTake` (`hover_wiring.ts:306–386`) returns `true` for any one-finger drag while `slideModeOn && st.hover !== null` (:322–325, :354–385) — the orbit never gets the drag; the bound is the hosting plane's coplanar component (`coplanarBoundary` :996 → `rectComponent`), on Piece44's top a 46 × 104 mm island → `boundStep` refuses every step (`hoverSolve` :664–668 "at the edge of the hosting faces") — walks: 1474/1982 frames (`vclose_top_front`), 2031/2041 (`random_4`), only A + drag beyond 20 mm leaves (`slideExits` :561). I4: `slideOrbitMove(st, hb.sway, s, asked, hypot(dx, dy))` (:377) runs in the drag handler with the FINGER's `asked` and travel, BEFORE `hoverSolve` clamps the step the next frame; `slideOrbitStep` is applied per pointer event unfiltered — walks: `close_top_I14` 1922 frames with the piece still (< 0.2 mm) while the camera moved 7573 mm; `contact_slide_top` 304 still frames / 2035 mm. Fix = F3 (at the bound the drag goes to the orbit: `hoverDragTake` returns `false` when `boundStep` would refuse the whole step, the slide unlatched as `slideExits` does) + F4 (move `slideOrbitMove` after `hoverSolve`, feed it the SOLVED step `[nu − u, nv − v]`; ease `hv.orbit` toward its target with the gizmo's 45 ms). Vectors RED today: `slideOrbitTurnOf` fed a zero solved step turns nothing while the finger moved; a `boundStep` refusal returns the drag to the orbit.

### 7. R7 — I2, the piece placed from one surface point under the shell's offset

Within `orbitShellOffsetMm` (60) `pieceAlong` (`orbit_shell.ts:84–88`) brings the foot from the shell (whose box includes Piece44's top at 540) down onto the gizmo (the top at 498.5): the piece's 10 cm body ends under Piece44's top → the solver refuses (`random_3`: 874 frames "blocked by Piece44"; the §18-C1 count 13 of 36). F2 (the contour pushed to the support) buys this by orbiting 42 mm off every face with a proud part; the §18-C1 footprint rule (the piece's place along the ray where its own box clears the parts' boxes inflated by the approach distance — a box sphere-trace, no GJK) is the root fix and keeps D3. Build after R1–R4 (R4 already removes the FROZEN half of §18-C1).

### 8. The composition nobody computed (I5, I14's amplitude, and a UX fact)

`gains3.mjs` over the recordings (fov 0.8, 734 px): yaw per finger px 0.63–0.81° (0.040 inside the leash band); the gizmo on the glass **0.3–0.4 screen px per finger px far out (camera 7.3 m), 1.7 mid (1.7 m), 0.9–2.0 close in (1.3 m)**; the PIECE on the glass **30–48 px per finger px far out** (a 6 m arm), 5.6 mid, 1.0–3.4 close. So close in the finger is near 1:1 and the tremble is NOT amplified by the gain — I14's amplitude comes from the map's edge-band spikes (R1/R3: ±0.6° → ±17 mm), and I5's ≤ 0.3° on screen is real and small. Far out the piece sweeps the screen 40× faster than the finger — not an issue listed, worth a slider tied to the camera distance (rule-6 style: a tracking factor so one mm of finger is one mm of piece on the glass).

### 9. Other defects found on the way

1. **The gizmo and the sections are one frame behind the solved piece**: `assemblyFrame` runs before the solve in `greenBoxFrame` (:968 vs :1014) and `syncAngle` stands still on frames with `d = 0` (:329) — at the headless cadence `mq` lags `pq` by one event (4° = 20 mm on the cube's front, every sampled frame). `gizmoAtAngles` compensates for the solver, not for the drawing.
2. **`shownDir` has a branch cut** (`orbit_calm.ts:39`, `atan2` at α = ±π): the direction opposite the calm's eased normal flips the shown direction by `2(1−sH)·180°` — measured 1406 mm of anchor jump vs 490 without the calm (`steps_seam.json`, n = front, sH 0.976, u = back); `calmFrame` switches `k.n` at once when `sH > 0.999` (:224) and eases otherwise. It enlarges every seam jump far out (the walk's "piece 430–3283 mm").
3. **I16 is a probe artefact plus I8/I10**: `sectionLinesFrame` inserts the ring as a vertex of both lines and `gizmoJoins` (`section_hull.ts:33`) forces the nearer neighbour joined, so the ring is always on a drawn segment; the walk's `lineOf` measured the distance to the SAMPLED polyline's joined segments without that vertex. What the player sees at the pole (43 mm) is the red ending at Piece44's foot (a 41 mm riser, I10) and at the corners the I8 breaks next to the ring.
4. The walk file's I1 claim (the solved yaw does not follow) is false — §5.
5. `nearestObstacle` reading `maxM` as the far gap means every far-out event is split into 0.27 m strides (3–7 queries per event); harmless, but it is why the seam traps far out too.
6. The cap seams: at yaw 90° in the bottom band the rims of the two quarters are 284 mm apart with no blend (R3-2); after R1+R2 the quarters meet on the diagonals as designed.

### 10. Order to build, and what subsumes what

1. **R1** (exposed-area stacks) + **R2** (F9) — one commit each, the vectors on the dumped `Scene_1` faces: removes I8, I13, I14, the 34/95 mm chords, half of I11; the cube's map becomes six real faces (verified offline).
2. **R4** (the solver strides across a ring jump; no backlog without progress): removes I15 everywhere and the close-in "frozen, not touching" blockages; independent of the map.
3. **R3** (the cast's sagitta rule; the blend in the cap bands): the seams on any non-box assembly.
4. **R6** = F3 + F4 (the slide).
5. **R7** (the footprint placement) over F2.
6. **F10** (the cap chart / frame turn) subsuming F1; then F8 (steps), F7a/b (ridges, the calm on every face — I9), I7 with Step 7.
Then re-run `walk_scenarios.json` (the 19 + 4 tremble scenarios) against `walk_findings_before.md`.

Constraints kept: every fix is in `src/input` or the solver (engine-free), one constant per place (`MAP_COPLANAR_M` reused), no pixel thresholds, ≤ 24 queries (R4 adds at most one), textbook methods (rectangle clipping, conservative advancement with an admissible landing). D3, the shell and the calm stand; "no jumps" is what R1–R4 restore; "the gizmo a function of the angles" stands until F10.
