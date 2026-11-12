# THE POLAR ORBIT'S CLEAN-UP — the issues found after `1.0.100-`, applied to its build (branch `1.0.108from1.0.100-`, now `1.0.110-`)

> The owner (2026-11-08, on `1.0.107-`'s reverse band): *"I don't like this implementation. Revert to the built as it was in branch
> 1.0.100-Polar-gizmo-over-void, and create a new branch 1.0.108from1.0.100- … capture the issues we have discovered in the later commits which are
> applicable to 1.0.100- built (any jitter, approach issue, etc. which we did not detect when we debugged 1.0.100-). Propose the fixes for the issues so
> we clean the polar orbit."*

## 0. ⭐⭐⭐ START HERE — a new conversation fixing I1 – I14

* ⭐⭐⭐ **THE OWNER (2026-11-12): `12dc4b6` (the tip of `1.0.121-two-types-of-orbits-finalized`, = `main`) IS THE BEST IMPLEMENTATION OF THE ORBIT SO
  FAR** — the reference to come back to; work goes on from it on `1.0.124from1.0.121-` (`1.0.122-`, the slide's removal, not used). The open points closed with nothing built (the far edge's roll back, the
  camera's lean, the slide under the tilted pole: ok; I17 and §8.5: not applicable any longer) → **§9.16**.
* ⭐⭐⭐ **THE OWNER (2026-11-10): `1.0.117-Tilted-polar-orbit` IS THE BEST PIECE ORBIT BUILT SO FAR IN THE PIPELINE** (the tilted pole, live as `6c6da30`; before it `1.0.116from1.0.114-`, `f96ddeb`; `1.0.111-Polar-orbit-fixes`, `eef4be0`) — the reference to come back to; work goes on from it on `1.0.118-`.
* ⭐⭐⭐ **§9, THE TILTED POLE — BUILT 2026-11-10** (branch `1.0.117-`; the rule §9.4, as built and probed §9.5 — three sliders, the roll back by the finger with a 250 ms minimum; ⛔ no device close).
* ⭐⭐⭐ **2026-11-09 — §8** (branch `1.0.114from1.0.112-`, now `1.0.114from1.0.112-Polar-orbit-cleaned-with-slide`, live as `98ef251`; `1.0.113-` renamed `1.0.113-not-used`: its step walk F8 made the notches'
  sections intricate — the owner went back to `1.0.112-`): F7b ported (the calm on slanted facets), the lines refined (I17's drawing), a closed void with a
  floor keeps its depth (the owner's amendment), a line broken only where the gizmo jumps + the lift along the real surface (§8.7); open: I17's reach by a finger far out, and the input-driven design on world-plane cuts (proposed, §8.5).
* **Where things stand** (2026-11-08): branch **`1.0.110-`** (from `469653b`; the clean-up's line: `1.0.108from1.0.100-Polar-orbit-with-calm` →
  `1.0.109-Polar-orbit-with-cube-assembly` → here). Live: build **`0bf3134`** (`Scene_1` a cube). `npm run verify`: **1642** vectors passing. **Nothing
  of F1 – F10 is built.** ⛔ No device close on anything since §18.
* ⚠ **`Scene_1` IS A CUBE** since `1.0.109-` (`SCENE_1.md` §12): I1 – I10 were measured on the PAINTING (0.33 deep); I11 – I14 on the cube. ⭐ So the
  first job is to **re-measure I1 – I10 on the cube** (the probes below): some change (the faces contour, Piece44 / Piece45 moved, the grooves), some
  may vanish.
* ⭐⭐⭐ **2026-11-09 — THE WALKS AND THE ROOT CAUSES** (branch `1.0.110-Polar-orbit-issues`): 23 random-walk scenarios over the cube (~83 000
  frames, every distance, dx / dy / mixed / reversals / approaches / a finger tremble) found two NEW issues (**I15** the seam trap, **I16** the
  ring off its lines — mostly the probe) and a root-cause analysis put the sixteen on **seven roots R1 – R7** → **§4 – §5 below** (the record:
  [`../history/2026-11-09_polar_orbit_walks_and_root_causes.md`](../history/2026-11-09_polar_orbit_walks_and_root_causes.md)). ⭐ **§5's build order
  replaces the work order below** (R1 + R2 → R4 → R3 → R6 → R7 → F10 …), built on `1.0.111-Polar-orbit-fixes`.
* ⭐⭐⭐ **2026-11-09 — AS BUILT** (`1.0.111-Polar-orbit-fixes`): R1, R2, R4, R3, R6, the calm's branch cut, the map's catch-up hold and the void crossing built; the walks re-run — the seam trap (I15) 36 → 1, the slide traps 17 → 3, the blocked stalls back to 21 (23 before); ✅ The owner (2026-11-09) closed three open points with NOTHING BUILT (§6): the left notch (not reproduced on the device — normal, even with small jumps), the poles (a dx moves nothing there) and the close-in block at a protruding part — all normal. ✅ The fourth — a groove too narrow for the piece — STUDIED AND BUILT on `1.0.112-` (the owner: *"make sure this is not an ad hoc patch"*): **§7**.
* **The work order** (⛔ superseded by §5, 2026-11-09; the owner may reorder; each fix its own commit):
  1. **F9 → I11** (no back facet) — the root is known and measured (§1, I11), the fix one constant; it changes the whole back of the map, so first.
  2. **I14** (the jitter over the top's edges) — reproduce, then find the cause (its row's TO DO). Fix only once the cause is named.
  3. Re-measure I13 after F9 (it sits in I11's region); then I1 – I10 on the cube.
  4. Then §3's order: F2 → F1 → F3 + F4 → F6 → F8 → F7a → F7b → F10; then §18's matrix and the walks with approaches re-run.
* **The project's rules for each fix** (`CLAUDE.md`'s five): the golden vectors land WITH the code and are shown **RED on the old code first**; `src/core`
  and `src/input` import no engine; thresholds in mm on the glass; `npm run verify` green; a probe's numbers before / after; ⛔ only a look on the device
  closes it. The solver budget stays 24 gap queries a frame; patent-free methods. **Commit, edit md, deploy only when the owner asks** (deploy: push the
  branch, merge `--no-ff` into `main`, push, wait for `version.json`).
* **Where the code is**: `src/input/face_map.ts` (`buildFaceMap` — D5's greedy, the caps, the columns; `facetPolygon` — the clip, I11; `mapTarget`, the
  polar cap — I12; `blendThroughEdges`, `edgeMap`; `stackDepthAt` — D3, the voids); `src/render/assembly_wiring.ts` (`faceMapOf`, `rawGizmo`, `mapGizmo`
  (exported), `calmFrame` / `calmDir` — I9 (b), `sectionLinesFrame` / `sampleJoins` — I8, `placeOffset`); `src/input/orbit_calm.ts` (`poleWeight`);
  `src/input/orbit_shell.ts` (the shell, `placeAtAngles`, `faceLift`); `src/input/assembly_orbit.ts` (`ORBIT_PITCH_MAX_RAD` — F1); `src/content/scene_1.ts`
  (the cube). Vectors: `tests/facets.test.ts` (the face map; ⚠ its fixtures are exact — I11's lesson), `tests/scene_1_cube.test.ts`.
* **How to measure** (the dev server: `npm run dev:usb`, http://127.0.0.1:5173; headless Chrome over DevTools; `window.__st` exists in DEV):
  * the map at ANY angles, no input: `const AW = await import("/src/render/assembly_wiring.ts"); AW.mapGizmo(st, yawRad, pitchRad)` → `{ hit: { point,
    normal, host }, t: { stack, band, surface } }`; the facets: `st.asmFaceMap.map` (after one `mapGizmo` call). This found I8, I10, I11, I13: sweep yaw ×
    pitch, compare neighbours (a gizmo step, a facet change, the drawn step against the place's step).
  * a view to start from: `st.orbit.reset(yawRad, v)` (`v` the elevation, 0 … 1) — I14's place: yaw 180°, `v` 0.76 (the gizmo on Piece3's top,
    (−167, 498, 101) mm).
  * input over time: `scripts/probes/orbit_probe.mjs` (`MODE=const LEGS=…`, `MODE=random SEED=… DIAG=1`, `APPR=px` an approach first, `AFTER=expr`,
    `OUT=name`) → `node scripts/probes/analyse_orbit.mjs <file>` (back-and-forth, blockage, jumps). ⚠ It has no option to start from a view: add one (a
    `st.orbit.reset` after the boot) — the I14 try did it in a scratch copy; ⚠ setting `st.approach` by hand then A + drag moved nothing (unexplained).
    ⚠ Headless input is bursty (an event every 2 – 3 frames): count reversals, not single jumps. ⭐ A probe's Chrome profile is removed in `finally`.
* **The sketchbook** (plates: the shell's line, the hexagon, the corner, the step, the issue cards and the fixes table; on the painting):
  https://claude.ai/artifact/UPGYPC5vfQpsK7DpKBxxnQ — ⚠ it stops at I10; this file is the record.
* **The owner's open decisions**: F3's lift (to the orbit's distance, or orbit from where it is); I7's rule for a notch open on a travel; F10 (the frame
  turn over a cap) against F1 (the pitch capped short of the pole); **the cube's grooves** — deepen the loose pieces too, or keep them 30 mm (§3).

**The base**: `3c00d35` (the tip of `1.0.100-polar-orbit-gizmo-over-void`; its build live as `ef5fa8f` on 2026-11-05). The scope
(`TILTED_ORBIT_REBUILD_SCOPE.md`) stops at §18 on this branch; §19 – §32.13 live on the later branches (`1.0.101-` … `1.0.107-Close-in-atlas`), which
are a different design (the frame turn, the plane-cut loops, the shell, the close-in chart). ⛔ None of their code comes back by default; a fix below names
the later commit when one was built for THIS code and is portable.

**How each item was checked**: re-read in the later sections and commits, then MEASURED on this build where a probe could (2026-11-08,
`1.0.107-`'s `orbit_probe.mjs` run against this branch's dev server — `MODE=seq` legs with `WOBBLEX` (a tremble along the drag), `MODE=walk` with
`APPROACHES=1` (seeds 11, 22), a per-frame hook recording the gizmo and the orbit's angles; 0 page errors). ⚠ Headless input is bursty (an event every
2–3 frames): far-out camera jumps there are an artefact (§28's finding), so jumps alone are not counted as issues below.

## 1. The issues that apply — each with its evidence and a proposed fix (⛔ nothing built)

| # | issue | found in | on `1.0.100-` (measured 2026-11-08) |
|---|---|---|---|
| **I1** | **The poles block the orbit**: straight above (below), a dx moves nothing — the piece and the gizmo still while the camera circles ~18° off the vertical; the yaw spins unseen, so the side a dy comes down is set by turns the player never saw; a dy pushing on past the pole is held | §18-C3; the owner on `9394aae` (*"at zenith or bottom … the orbit gets blocked most of the time"*) | ✅ **applies**: walk s11 — at the top, dx 154 frames: yaw −0.003 → 3.40 rad, gizmo 0 mm, piece 0 mm, camera 806 mm round; at the bottom, dx 457 frames: yaw +10.5 rad, 0 mm; close in at the bottom a dy 530 frames, 0 mm |
| **I2** | **Close in, the piece stopped by a part proud of the faces contour** (Piece44's overhang over the front / top, Piece3 45 mm off −x): the solver refuses each step and slides the piece along the ring — *"almost stuck"*, sideways; the approach in or out refused | §18-C1 (b); §24 (the root: D5 — a proud part never makes a facet); built for this code as §24.1 (`00c9514`) | ✅ **applies**: walk s11 — at the top (v 0.91) an approach in 143 frames moves nothing, then a dx 309 frames: 277 BLOCKED, the piece 1 mm; walk s22 — *"the way out is blocked by Piece44"* |
| **I3** | **The slide traps the piece**: latched on a small face (Piece44's top), every drag ends *"at the edge of the hosting faces — reverse to come back"*; the orbit never takes over, only A + drag leaves | §18-C5 (`HOVER.md` §0 item 22) | ✅ **applies**: walk s22 — after the approach in latched the slide on Piece44's face, 9 legs (~1 700 frames) moved the piece 0 – 60 mm each |
| **I4** | **The slide's camera runs on while the piece is stopped, and steps per event**: the limited orbit (2°/mm) reads the FINGER, not the piece's slid travel | measured here (new) | ✅ **applies**: walk s22 in the slide — camera 1 047 mm for 34 mm of piece in one leg, in steps of ~21 mm every pointer event (then 2, then 0 mm), never back |
| **I5** | **The finger's tremble on its own axis passes**: §1.1's orbit band is paid once per axis ENTERING motion, then every step passes with its sign | §32.13 (`1.0.107-`) | ⚠ **applies, small**: a ±2 px tremble along a dx — the yaw reverses 36 – 42 times a 600-frame leg, the gizmo 23 – 27 at a middle distance; the piece on the screen ≤ 0.3° (the gizmo's ease and the orbit's spring absorb it) — far below `1.0.107-`'s (a cap crossed at 33 mm a mm) |
| **I6** | **The pole's slide swing**: over the top at ~70°, close in against Piece44, a dy — the slide's yaw ±7.5° every input frame (the piece 2.5 mm, the camera 33 mm) | §18-C2 | not re-measured; the same place as I2 / I3 |
| **I7** | **A void open on a travel** (the red straight up through a notch open along it, in the air): the gizmo a function of the angles cannot turn at the notch's real edge | §18-C4 | applies by construction (unchanged since §18) |
| **I8** | **The green and the red lines break at a face's 90° corners** (the owner: *"why the green line is discontinuous"*, then *"also valid for the red contour"*): the drawn line is cut round an outer corner though the gizmo stays on the surface | found 2026-11-08 (new) | ✅ **applies**: every `sampleJoins` break of the green within 10° of a facet change — the place 3.7 – 3.8 mm a sample (the edge stretch), the drawn point 12 – 29 mm (`2.5 × place + 2 mm` fails), no depth change; at pitch 0, 4 segments lost at the front-left corner, 1 at the right. The red at eight yaws: breaks at pitch ±36° – ±53° (the ±45° edge), the place 1.5 – 2.8 mm, the drawn point 6 – 109 mm, the surface turning 82° – 122° in one sample |
| **I9** | **Faces at other pitches than 0 / ±90°** (the owner: *"the face map shall include these possibilities"*): (a) on a RIDGE (no level face on top, e.g. a hexagonal prism lying on a face's edge) the top cap is one of the two upper slanted facets — dy over the top is not symmetric, +90° lands in one slanted face's middle; (b) **THE CALM is on vertical faces only** (`calmFrame`: targets on SIDE bands only, the normal flattened to level, faded between 60° and 85° by `poleWeight`) — on a slanted face, the top and the bottom the piece is squared to the horizontal, not to the face | found 2026-11-08 (new; a synthetic prism, `face_map.ts`) | ⚠ (a) **applies, no jump**: the ridge prism's bands front −45° / 30° / 75°, back −75° / −30° / 45°, worst step 7.5 mm; a FLAT top prism is symmetric and already vectored (`facets.test.ts`). (b) ✅ **applies** by construction (read in `calmFrame`, `calmDir`) |
| **I10** | **A line jumps over a STEP: a face parallel to the cast is never a place** (the owner: *"these two horizontal black faces are never reachable by the red section"*) — on a side band the pitch drives the gizmo's height and the place is cast HORIZONTALLY along the wall's axis to the real depth (D3): a horizontal tread between two risers is skipped; the same for the green at a step seen from above (a part proud of a wall: its two sides), and for a vertical riser in a cap's band | found 2026-11-08 (new) | ✅ **applies**: the red at yaw 136° (facing −x): up the left column's side (x −196.9 mm), then from pitch 21° to 24° straight onto Piece3's side (−171.2 mm) — **Piece25's top** (y 414 mm) never a place; down, from −26° to −29° onto Piece30's side (−147.5 mm) — **Piece37's bottom** (y 73 mm) never. The green at Piece45's height (pitch −10°): onto Piece45's back face at yaw 264°, off at 274° — 288 landings on that face over every yaw × pitch, **0 on its two sides**; Piece44's sides the same. The sweep (1° × 0.5°) also finds 0 on Piece42's top / bottom, Piece45's top / bottom, Piece44's underside, Piece43's top — their causes not checked one by one. ⛔ First described as *"faces outside the contour"* (fixed by F2) — WRONG: the cast already reaches the column; F2 leaves it horizontal |
| **I11** | **On the cube, NO BACK FACET** (the owner, on the glass: *"on the back face the green contour is discontinued and the gizmo and piece jumps directly from one edge to the other edge"*) — the face map holds five facets (±x, the front, the top, the bottom); the right and left columns each take half of the back's yaw | found 2026-11-08 on the cube (`1.0.109-`) | ✅ **applies**: the green at pitch 0.2 rad runs the right side to the back edge (z 432 mm), then at yaw 90° the gizmo jumps **245 mm** to the back's middle and **245 mm** on to the other edge, within 0.25°; nothing drawn between. ⭐⭐ **THE ROOT** (measured): a facet's polygon is clipped by the placed parts' BOX (`facetPolygon`, `boxPlanes`), a point kept within **1e-9 m** of a plane; the back's plane IS the box's face, computed twice — the box from the hulls' vertices in doubles, z = 0.43250000000000005; the facet from the faces' world triangles (the engine's float32 matrices), z = 0.43250000512599945 — **5.1e-9 m apart, 5× the tolerance**: every corner outside, the polygon empty, its share 0, D5 drops it (*"drop 0,0,1 … shares 0.797/0.797/0"*) though its real face is the front's, 2254 cm². The module's own coplanar tolerance is 0.5 mm (`MAP_COPLANAR_M`): two rules for *"the same plane"*. ⭐ **Why the painting had a back facet**: no facet ever lay ON the box's face — the back (−17.5 mm) 35 mm inside it (Piece44, its long axis along the depth, stuck out to +17.7 mm), the front inside Piece45, the right inside Piece42, the left inside the column, the top inside Piece44, the bottom inside Piece43; the cube centred Piece44 within a 483 mm-deep top, the back became the box's extreme. ⛔ **Why no vector caught it**: `facets.test.ts`'s synthetic shapes put facets on the box's face, but their faces and box come from the same exact numbers — the difference exactly 0, the one set where it cannot appear |
| **I12** | **The red over a cap is RADIAL, so it bends at the edge** (the owner: *"strange contour of the red section"*, over the cube's top) — on a cap the map is polar (each side a quarter of the turn, the pitch the distance in to the cap's centre): at a fixed yaw the red runs from the rim straight to the cap's centre, so unless the yaw faces a side's MIDDLE it crosses the cap diagonally and bends where it comes over the edge | found 2026-11-08 on the cube | ✅ **applies** by construction (`mapTarget`'s cap); invisible on the painting (a 33 mm-deep top). The broken bits where it crosses the cube's grooves are I10 (steps) and I7 (voids) |
| **I13** | **The red shifts sideways in a bottom edge band** (the owner: *"the red contour has a discontinuity in the alignment of the lines as it crosses the underneath of the red part"*, the back-right from below) | found 2026-11-08 on the cube | ⚠ **measured, cause not settled**: at yaw 85° the red runs down the RIGHT side's map at x 248 mm (I11 gives the back's yaw to the right side), then in the bottom edge band (pitch −39° … −51°) the gizmo goes 92 mm IN (x 156 → 136 → 125 mm) and back OUT to 194 mm on the bottom cap. Candidates: I11's region; the right facet's plane at Piece32's covered side (x 213.5 mm) 34 mm inside the real right face (247.5 mm), the edge blend's cast built on it. ⛔ Re-measure after F9 before calling it its own issue |
| **I14** | **THE GIZMO JITTERS BACK AND FORTH OVER THE TOP FACE'S EDGES, and the piece with it** (the owner, on the glass, 2026-11-08: *"when I approach, the gizmo jitters a lot with back and forth. So does the piece"* — the gizmo on the top near the left edge, the camera `c=(-0.22,0.56,0.10)`, `elev=0.76`; then *"this is also valid for a lot of edges on the top face: the gizmo jitters with back and forth when I orbit over those edges, even without approach"*) | found 2026-11-08 on the cube (`0bf3134`) | ⛔ **NOT YET REPRODUCED, CAUSE NOT ANALYSED** — a first headless try only: the orbit reset to yaw 180°, elevation 0.76 (the gizmo on Piece3's top, (−167, 498, 101) mm — the screenshot's place), an approach (A + drag) from 0.99 to 0.45: the gizmo still to 0.0 mm, the piece coming in (its steps the headless input's bursts). A second run with the approach set to 0.45 by hand did not move (the drag had no effect — the probe's, to fix). ⭐ **TO DO**: (1) **random walks** over the top face (`orbit_probe.mjs MODE=random`, `DIAG=1`, several seeds) and over its edges — the yaw sweeping the top's rim, the pitch across the side / top edge (±45°), and the grooves' edges (the loose pieces' empty cells, I12's note); (2) **approaches** on the top (A + dy down to the contact) at a dozen places on and near those edges, with and without a dx / dy held after; (3) count the gizmo's and the piece's REVERSALS per frame (`analyse_orbit.mjs`'s back-and-forth, §18's I7 pattern) and name the place of each; (4) **analyse the cause** where it appears — candidates to check, none confirmed: the solver's slide along the ring at a blocked step (I2 / §18's back-and-forth), the edge blend's cast on the grooves' rims (I10 / I13), the slide latching and unlatching at the contact (the HUD read *"off the slide — the gizmo on the sections again"*), the void rule (I7) flipping over a groove |

## 2. Found later, and NOT applicable to this build (checked)

* **The rubber-band spring** (§32.11, the shown place 40 – 50 mm behind the travel): `1.0.107-`'s V6 spring. Here the piece follows the gizmo's 45 ms
  ease and the angles' 30 ms spring — the owner's reference feel (*"there was no such spring in the finalized polar orbit movement"*). Measured: after a
  release the piece moves 2 – 7 mm (the coast far out, 243 mm, is the inertia, as before).
* **The middle-distance sawtooth** (§32.12, the eased look point against a piece that did not lag: −3° … −5° on the screen at each event): measured
  here at a middle distance — the piece held within **±0.1°** on the screen (both trail together). Not an issue.
* **The slide latching mid-drag, ten times slower** (§24 A): *"before §22: none"* — the contour at the real depth then. Not reproduced here.
* **The sections that show paths no input follows** (§21.1): a consequence of Step 6's frame turn; here the lines ARE the sweeps the input follows.
* **The calm on the parts' box at a turn** (§19 item 7), **the frame's disagreements** (§20 (3)), **the shell's and the ropes' findings** (§27 – §31),
  **the slide's latch loop** (§32.9 — the shell's place): other designs' rules, absent here.
* **The floor** (§25): checked then on code inherited from this build — nothing the orbited piece does reads it; a stop at the front's bottom is
  `Piece41`, a loose piece. Already the rule.

## 3. The proposed fixes — one rule each, at the point every caller shares

* **F1 → I1 (the poles): CAP THE PITCH SHORT OF THE POLE** (`ORBIT_PITCH_MAX_RAD`, `input/assembly_orbit.ts` — today π/2; one constant, made a slider; proposed **80°**). A dx there always moves
  the piece round a visible circle over the top (at 80° its radius is 17 % of the orbit's), the camera turning with it — no input dead, no yaw spun
  unseen, the exit side the one on the screen. The top's centre is reached by the approach in (A + dy) and the slide, as any face's. ⚠ Cost: the view
  never straight above. ⭐ Alternative (larger): over a cap, dx and dy move the gizmo along the cap's world axes (a chart on the top) — the later rebuilds'
  direction, a new rule set; not proposed for a clean-up.
* **F2 → I2 (proud parts): THE CONTOUR CLEAR OF EVERY PART** — port §24.1 (`00c9514`, built on THIS face map): each chosen facet's plane pushed out to the
  placed parts' support along its normal (`supportOf`; the same normals, D5's choice kept). The piece's orbit path never meets a part; the gizmo stays at
  the REAL depth (D3) and the approach goes on in to the contact. Measured then (`1.0.102-`): the close-in dx across the front 5 mm a frame, 0 stalls; the close-in
  dy no longer pinned against Piece44 (camera jumps 3 → 0, back-and-forth 122 → 0). ⚠ Cost: a face with a proud part orbited that far off it (the front 42 mm — Piece44).
* **F3 → I3 (the slide's trap): AT THE EDGE OF THE HOSTING FACES THE ORBIT TAKES THE DRAG** — the slide lets go (as it does beyond 20 mm on an approach)
  and the same drag goes on as the orbit, instead of *"reverse to come back"*. ⚠ To decide (the owner): whether the piece then lifts to the orbit's
  distance or orbits from where it is (the approach's floor).
* **F4 → I4 (the slide's camera): THE LIMITED ORBIT READS THE PIECE'S SLID TRAVEL** — 2°/mm of what the piece actually slid (0 when it is stopped), not of
  the finger; eased with the gizmo's ease (45 ms) so it does not step per event.
* **F5 → I5 (the tremble): NONE PROPOSED** — small here (≤ 0.3°); `1.0.107-`'s reverse band was rejected (*"I don't like this implementation"*). To
  re-measure on the device after F1 – F4.
* **I6, I7**: no fix proposed before F1 – F3 are judged — F1 removes the pole and F2 Piece44 from the orbit's path (I6's two causes); I7 needs the
  owner's rule for a notch open on a travel.

* **F6 → I8 (the corners): A LINE BREAKS ON A DEPTH JUMP ONLY** — `sampleJoins` compares the two samples' depths along their cast normals, not the
  drawn step against the place's step (which the edge stretch slows to 1.5 – 3.8 mm). Corners join; a recess, a protrusion's edge, a step still break
  the line (until F8 walks it). Green and red. Cost: none expected — drawing only.
* **F7a → I9 (a): A VIRTUAL LEVEL CAP ON A RIDGE** — `buildFaceMap`'s caps: when no facet is within 45° of level, a virtual cap at the box (as when
  none is found today), so dy over the top is symmetric and ±90° is the top's centre. ⚠ To check: a degenerate cap (a line along the ridge).
* **F7b → I9 (b): THE CALM ON EVERY FACE — ✅ DECIDED** (the owner, 2026-11-08: *"we shall add the calm on all the faces (not only the vertical faces),
  even slanted, even horizontal"*): in a face's middle the piece near square to THAT face's normal, pitch included; the whole orbit angle at its edges.
  (1) the calm's normal the facet's own, not flattened; (2) on a cap the two runs the cap's own extent along its two axes (dx and dy each a share by the
  distance to the cap's rims), as a side's are across it and up the parts' box; (3) `poleWeight`'s fade removed — the top and the bottom have their own
  calm; (4) the camera's heading still from the orbit's yaw, defined near straight above. ⚠ Depends on F1: square to the top in its middle is the pole —
  with the pitch capped at 80° and the calm's interior share the shown direction stays ~2.5° off the vertical at the top's centre. Vectors RED on
  `3c00d35`: square to a +30° face in its middle, square to the top in its middle, the whole angle at each face's rims, no jump from a wall onto the top.
* **F8 → I10 (steps): THE LINE WALKS A STEP** — when two neighbouring samples of one band land at different depths on PARALLEL faces (a step), the stretch
  of the angle between them is given to the step itself, in proportion to its length (the tread, then the riser); over the tread the place is cast along
  the TRAVEL (down onto a tread facing up, up onto one facing down; along the green's travel onto a proud part's side). The gizmo goes along the tread
  and up the riser continuously, the line drawn through. Red and green; a riser in a cap's band the same. Where: `mapTarget` / `blendThroughEdges`
  (`face_map.ts`). Vectors RED on `3c00d35`: a two-step stair, every tread landed on, no step of the place larger than the slowest band's. Cost: the
  angle spent on a step's tread and riser. ⭐ F6 alone keeps the break at a step (correct: the gizmo jumps there); after F8 nothing jumps, the line joins.
* **F9 → I11 (no back facet): CLIP A FACET'S POLYGON WITH THE FACE MAP'S COPLANAR TOLERANCE** (`MAP_COPLANAR_M`, 0.5 mm) instead of 1e-9 m —
  one constant, one place: *"the same plane"* means the same in the stack and in the clip; a facet on the box's face kept. Vectors RED on `0bf3134`: a
  plain box whose faces' levels carry 5e-9 m of noise keeps its six facets; on the cube six facets, the back's share 1; the green at the back with no
  gizmo step over 15 mm. ⭐ The lesson for the vectors: a fixture whose two sources of one plane are the SAME numbers cannot test their agreement.
* **F10 → I12 (the red radial over a cap): THE FRAME TURN** — the red over a cap goes on SQUARE to the edge it came over, as it did up the side (the cap
  mapped in the crossing edge's frame), not to the cap's centre: the scope's Step 6 (§16, the facet frames: *"at every crossing … the orbit's frame turns
  about the edge"*). ⚠ A new rule set for the cap — weighed against F1 (the pitch capped short of the pole) before it is built.
* **I13**: no fix proposed — re-measured after F9.
* **I14**: no fix proposed — reproduce it first (the random walks and approaches on the top face), then find its cause.
* ⚠ **The cube's grooves** (not an issue of the orbit; a decision for the owner): the five loose pieces were kept 30 mm deep (*"the seated parts"*), so
  their empty cells are 480 mm-deep tunnels through the cube — Piece1's and Piece2 + Piece23's across the top, Piece17's and Piece41's across the bottom,
  all five open at the back. Deepening them too would close them (their goal slots 480 mm deep; Piece17's own size kept for the green piece).
* **Not an issue** (checked 2026-11-08): on the cube's FRONT the green is joined across the face — its gaps are I8 at the corners, and the line hidden
  where the orbited piece stands between the camera and the face (the lines are depth-tested).

**Order proposed**: F2 (a port, measured before; removes I2, half of I6) → F1 (I1, half of I6) → F3 + F4 (the slide) → F9 (I11, first on the cube) → F6 (I8) → F8 (I10) → F7a → F7b
(after F1) → F10 (I12) → the §18 matrix (`§18-C6`) and the walks with approaches re-run, each against §18's *after* column. Each fix with its vectors, RED on
`3c00d35`. ⭐ The sketchbook (plates, the hexagon, the corner, the step): https://claude.ai/artifact/UPGYPC5vfQpsK7DpKBxxnQ.

⚠ **Since 2026-11-08 `Scene_1` is a CUBE** (`SCENE_1.md` §12, `1.0.109-`): every measurement above was taken on the PAINTING (0.33 deep). Re-measure
I1 – I10 on the cube (I11 – I13 were found on it) before building a fix against them (the faces contour, the steps, Piece44 / Piece45 all moved or changed).

## 4. ⭐⭐⭐ The random walks (2026-11-09, on `469653b` — the cube)

**The instrument**: `scripts/probes/walk_probe.mjs` (headless Chrome on the dev server; each scenario from a VIEW — `st.orbit.reset`; legs that
change direction under one press; approaches A + drag mixed in; a seeded finger TREMBLE `wob`; every frame the gizmo, the piece, the camera, the
angles, and the drawn lines — each break sub-sampled on `mapGizmo`: a FALSE break or a MAP jump), `scripts/probes/walk_analyse.mjs` (jitter,
back-and-forth with the finger held one way, blockage / pole stall, jumps and leaps, the line-break map, against the finger, the piece behind its
face, the camera's roll), `scripts/probes/walk_scenarios.json` (19 scenarios: far 6 m, mid 1.2 m, close 0.3 m, very close 0.1 m, contact; the
edges, corners, grooves, the four protrusions, Piece42's slanted faces, the back, the poles; six seeded random zig-zag walks with approaches) + 4
with a tremble. ~83 000 frames, 0 page errors. ⚠ Three of my own instrument's errors found and fixed on the way (the screen's right negated; reversals the
scenario asked for counted as back-and-forth; a probe writing only at its end lost a run to its watchdog).

| | found | where (mm, the cube's frame) |
|---|---|---|
| **I15 (NEW) — THE SEAM TRAP** | the solved angles lock at yaw = 90° exactly and never leave — dx (turns), dy (to both poles): the gizmo and the piece 0 mm for 350 – 2100 frames, at every distance; only an approach / a slide frees it | far (v 0.162), mid (ap 0.621), close (random_5: 955 + 1071 frames) |
| I11 | confirmed: 490 mm across the back at pitch 0; 523 / 375 mm in the bottom cap's back quarter, 261 mm in the top's; the piece 0.4 – 3.3 m, the camera to 4.4 m far out | the back, both caps |
| I1 | confirmed: the gizmo still at the cap centre while dx spins the yaw (stalls 30 – 732 frames); ⚠ the solved yaw DOES follow (§5) | (33, 540, 191), (33, −26, 191) |
| I14 | **reproduced only with a tremble** (±2 – 3 px): 3 – 4 reversals in 5 – 17 frames, 10 – 23 mm, gizmo and piece; a straight finger: none | the right-top, front-top edges, Piece3's top, by Piece44 |
| I3 / I4 | the slide blocked 39 – 189 frames a leg, *"at the edge of the hosting faces"*; the camera 7.6 m for a piece still | Piece3's, Piece44's, Piece4's tops |
| I10 / I7 | the gizmo leaps 46 – 49 mm onto / off Piece44, 45, 43; 95 – 99 mm at the bottom-left groove (a 97 mm back-and-forth); 151 mm over Piece1's groove | |
| I8 | false breaks at every 90° corner band (the green, the map continuous: sub-step ≤ 6 mm) and the ±45° bands (the red) | |
| I16 (NEW) | the ring 9 – 93 mm from the sampled lines' joined segments — ⚠ mostly the probe (§5, R-note 3) | the back corners, the pole |

## 5. ⭐⭐⭐ The root causes (2026-11-09) and the fixes — the build order

A root-cause analysis (measured: the face map dumped from the page and rebuilt offline, the real solver run in the page; the record in
[`../history/2026-11-09_polar_orbit_walks_and_root_causes.md`](../history/2026-11-09_polar_orbit_walks_and_root_causes.md) Part B):

| root | mechanism (measured) | carries | the fix (one rule, one place) |
|---|---|---|---|
| **R1 — HIDDEN FACES MAKE THE FACETS** | `faceMapOf` feeds every face, the GLUED ones included; `mainOf` takes the largest coplanar region: the +x facet at **213.5** (Piece32's covered side; the real face 247.5 — a 2364 cm² tie broken by order), −x at **−147.5** (Piece30's side, 88 % mated; the real −242.5, 1669 cm² cut by two grooves). The contour 361 mm wide for 490: every polygon 34 / 95 mm short of the real edges | I8, I13, I14 (a built-in 17 / 32 mm back-and-forth at pitch 45°), the corner chords, half of I11 | **the stack reads the EXPOSED area** (`stackOf`): a face's rectangle is not real where a face of another part with the opposite normal lies on its plane (`MAP_COPLANAR_M`) — the mated area subtracted cell by cell, `mainOf` and `regionReal` on what is left. Offline: six facets at the real faces |
| **R2 — the clip at 1e-9** (F9) | the back's plane from float32 triangles 5.1e-9 m off the box's | I11 | `facetPolygon` with `MAP_COPLANAR_M` (offline: six facets, four 90° columns) |
| **R3 — the edge blend defeated by its own cast; no blend in the cap bands** | the blended place's cast takes the near facet's own face (the chord ALONG it): 86 – 89.5° x 247.5, 90° x 2.5, 90.5° x −242.5; the slice-end blend skipped in the cap bands (`same`): a 284 mm raw jump at pitch −61° | I11's step, I13's 77 mm, I14's spikes, I15's trigger | (a) the cast's hit taken only where the chord CUTS a surface (its offset along the chord small — a sagitta rule); (b) the slice-end blend in the cap bands too; (c) one EPS for the bound |
| **R4 — THE SOLVER IS ABSORBED BY ANY RING DISCONTINUITY** | a lateral jump J of the anchor larger than `spare·0.9` (0.27 m far, ~16 mm close in) never fits a stride: the piece converges onto the jump, 24 queries a frame, `deferred` for ever, the orbit's target runs away; a dy carried with the yaw's backlog is dead too | **I15**, the close-in *"frozen, not touching"* blockages at grooves and Piece44 | `solveOrbitStep`: a stride that cannot fit while the gap is open takes the jump when its LANDING is admissible (one query); `orbitFrame`: a deferred solve with no progress keeps no backlog beyond this frame's input |
| **R5 — one polar chart** | at v = 1 the anchor moves 0 mm/rad of yaw (the solved yaw follows, nothing seen moves); the red over a cap runs to the centre | I1, I12, I6 | F10 (the cap charted in the column it was entered from) after R1 – R4; F1 a stopgap |
| **R6 — the slide owns every drag; its camera reads the finger** | `hoverDragTake` takes every one-finger drag in the slide mode; the limited orbit fed the finger's step before `hoverSolve` clamps it | I3, I4 | F3 (a refused bound step hands the drag to the orbit, the slide unlatched) + F4 (the limited orbit fed the SOLVED step, eased) |
| **R7 — the piece placed from one surface point under the shell's offset** | within 60 mm the foot comes down onto the gizmo (the top at 498.5) while Piece44 stands to 540: the piece's body under Piece44's top, refused | I2 | a footprint placement (the piece's box clear of the parts' boxes inflated by the approach) — after R1 – R4, over F2 |

**Also found**: the gizmo and the lines one frame behind the solved piece (`assemblyFrame` before the solve); `shownDir`'s branch cut opposite
the calm's normal (the seam's jump far out 1406 mm against 490); I16 mostly the probe (`gizmoJoins` keeps the ring on a drawn segment) plus I8 / I10;
I5 small (close in the finger ~1:1 on the glass; far out the PIECE sweeps 30 – 48 screen px a finger px).

**The build order** (`1.0.111-Polar-orbit-fixes`): **R1 + R2** (each its commit; vectors on the dumped `Scene_1` faces) → **R4** → **R3** →
**R6** (F3 + F4) → **R7** → F10 (subsuming F1) → F8, F7a / b, I7 → the walks re-run against §4. ✅ R1 – R4, R6 built and the walks re-run → §6 (R7, F10 … not built).

## 6. ⭐⭐⭐ As built (2026-11-09, `1.0.111-Polar-orbit-fixes`) — and what the walks still find

**Built** (each its commit, its vectors RED on the commit before; ⛔ no device close on any):

| fix | commit | the rule | vectors |
|---|---|---|---|
| **R1** | `7d0d01d` | `stackOf` reads the EXPOSED area: a face's rectangles minus another part's coplanar opposite faces (`exposedRects`; `MapFace.part`) — the cube's six facets on its real faces (±x 247.5 / −242.5) | `face_map_exposed` (7, on `tests/fixtures/scene_1_cube_faces.json`, the page's 240 faces) |
| **R2** | `7d0d01d` | `facetPolygon`'s clip at `MAP_COPLANAR_M` (was 1e-9): the back facet kept — four 90° columns | in `face_map_exposed` |
| **R4** | `3c3ce8d` | `ringJump`: a free-air stride that fits under a quarter of its allowance looks for a JUMP of the anchor ahead (≥ `RING_JUMP_M`, bisected on the anchors) and crosses it when the landing is admissible (one query); `orbitFrame`: a deferred solve with no progress keeps no backlog | `solver_ring_jump` (5) |
| **R3** | `5f0d049` | (a) no cast across two facets FACING APART (`BLEND_APART_COS`); (b) the slice-end blend at every pitch; (c) `castPoint`: D3's cast from just inside the facet, never its rim | `face_map_blend_cast` (5) |
| **R6** = F3 + F4 | `a865d14` | `slideLetsGoAtBound`: a step the hosting faces refuse WHOLE hands the drag to the orbit (`slideArmedByOrbit`: that drag never re-arms it); `slideTurnTravel`: the limited orbit turned by what the piece SLID | `slide_edge_letgo` (5) |
| the calm's cut | `a66cd4a` | `shownDir`'s horizontal share faded to 1 from 90° to 180° off the face's normal (no branch cut behind it) | `calm_branch_cut` (3) |
| the map's catch-up (a regression R4 exposed) | `217de6d` | `mapAnglesStep`: where the catch-up ALONE would move the gizmo more than `MAP_SYNC_HOLD_M`, it is held that frame (a 32 mm limit cycle at Piece1's groove edge) | `map_sync_hold` (3) |
| **the void crossing** ((b) below, the second pass) | `bf720a2` | `voidCrossing`: where R4's landing past a jump is REFUSED, the jump BACK out further along the step (anchors only, each candidate bisected); the whole void crossed when the piece's straight move past it fits the clearance's stride and that landing is admissible (one query); else the jump is a WALL — BLOCKED, never `deferred` | `solver_void_crossing` (4) |

**Not built**: R7 and F10 / F1 (⛔ the owner, 2026-11-09: not issues — (c), (d) below), F8, F7a / b, I7, the one-frame gizmo lag (`assemblyFrame` before the solve — reordering touches `gizmoAtAngles`).

**The walks re-run** (the 23 scenarios on `217de6d`, ~83 000 frames, 0 page errors; before = `469653b`). Two instruments added:
`scripts/probes/walk_compare.mjs` (each check's events, and the long stalls classified SEAM / SLIDE / POLE / BLOCKED) and
`scripts/probes/walk_norm.mjs` (⭐ the motion NORMALISED by the input — headless input is bursty, an event every 2 – 3 frames, so the raw jump counts
measure the input as much as the orbit: MAP-STEP a gizmo step > 15 mm at > 25 mm per degree of the map's angles; MAP-REVERSAL the gizmo going back while
the map's angles go one way; SOLVE-REVERSAL the solved yaw going back while the target goes one way).

| measure | before | after | |
|---|---|---|---|
| **I15** seam stalls (≥ 30 frames still at a column's bound) | 36 | **1** | ✅ |
| slide traps (stalls with the slide on) | 17 | **2** | ✅ (I3 / I4) |
| the piece BEHIND the gizmo | 18 | **1** | ✅ |
| solver reversals | 1 | 0 | ✅ |
| map steps (normalised) | 121 | 114 | ≈ — what is left: the grooves' (32 – 95 mm) and Piece44 / 45's (41 mm) depths, D3 by design |
| ⛔ **map reversals** (normalised) | 8 | **134** | a REGRESSION — (a) below |
| ⛔ **long BLOCKED stalls** (not seam, slide, pole) | 23 | **51** | a REGRESSION — not yet traced, (b) below |
| pole stalls | 70 | 83 | open — R5 (c) |
| **after the void crossing** (`bf720a2`, the walks re-run): long BLOCKED stalls | 23 | 51 → **21** | ✅ the notch 26 → 4, near the bottom 15 → 4; seam 1, slide 3, pole 86; map reversals 134 → 122 (the notch's order, (a)) |
| raw leaps / jumps (`walk_analyse`) | 210 / 163 | 416 / 457 | ⚠ mostly the input's bursts × a map 6.7 mm/° wide (R1; was 4.0) × motion where it used to freeze — the normalised rows are the ones to read |

**What remains — the root causes and the fixes proposed:**

* **(a) the notch reversals** (96 of the 116 reversals listed are at the cube's two LEFT grooves, x < −180, y > 400 or < 90). The side band's horizontal
  cast meets the groove's RISER (x −193), the cap band's vertical cast its TREAD (y 414): the edge band blends riser → tread in the wrong order (the
  gizmo runs y 488 → 415 while the finger goes up), then steps 84 mm. ⭐ R1 exposed it — the −x facet moved −147.5 → −242.5, so the groove now lies
  under the edge band. **Fix**: F8 (walk the step, never jump it) extended to the edge bands — the blend's cast walks from the place it left; and the
  owner's I7 rule for an OPEN notch (bridged as a void, or followed into). ✅ **THE OWNER (2026-11-09): NOT AN ISSUE, NOTHING BUILT** — *"I don't
  see the current implementation as an issue. I cannot reproduce your issue. The gizmo and piece movements are normal, even with small jumps."* The
  walks' map reversals at the notch are a probe finding the device does not show; the notch stays as built (neither bridged nor followed). Confirmed when asked whether to bridge it: *"Stays as it is"*.
* **(b) the BLOCKED stalls 23 → 51** — binned by place: the **top-left notch 5 → 26**, **near the bottom 7 → 15**, top 6 → 4, elsewhere 5 → 6.
  * ⭐⭐⭐ **near the bottom — ROOT FOUND AND BUILT** (the solver replayed in the page, `walk_probe`'s `eval` leg): under the cube's bottom groove
    (x 104 – 117) D3 puts the gizmo at the groove's real depth, so the piece's anchor JUMPS 43.9 mm up into the groove's lips (gap 0): R4 refused the
    landing and the stride CONVERGED onto the jump (`tS` 0.014 → 0.0045 → … → 1e-6, the 24 queries spent, `deferred`; R4's no-backlog rule then dropped
    the target — the piece still in FREE AIR, 16.8 mm of gap, for ever: I15's mechanism where the landing is not admissible). ✅ **The void crossing**
    (above): the same yaw step now crosses in 3 queries; a dy there is BLOCKED (along `v` the void is longer than the straight move) — a visible stop
    instead of a freeze. D3 makes a groove the piece cannot enter a WALL along it — ✅ **§7** (2026-11-09, `1.0.112-`): the study found the groove ALREADY bridged (closed across) — its wall was the map's rims, 1.6 mm inside the void, where the gizmo dived to the floor at x 104 and 117. Fixed, and an open void the held piece cannot enter made surface.
  * ⭐⭐ **the top-left notch — (a)'s root** (replayed: the piece touching Piece3 at the gap kept, a dy UP moved its anchor HORIZONTALLY inward
    (−245, 438) → (−218, 436), along the tread into the riser — gap 0, blocked): the map's wrong order IS the stall; (a)'s fix (I7's rule) removes both.
* **(c) the poles** (R5): F10 (the cap charted in the column it was entered from) or F1 (a pitch cap, the stopgap) — ✅ **THE OWNER (2026-11-09):
  NOT AN ISSUE, NOTHING BUILT** — *"it is normal that a sideways drag moves nothing at the pole"*. Neither F1 nor F10; the walks' POLE stalls (86) are
  expected behaviour, not a defect to count.
* **(d) R7 vs a slot**: a box-clearance placement would hold a piece at a slot's MOUTH (a goal slot's walls touch the piece). F2, or R7 with a slot
  exemption — ✅ **THE OWNER (2026-11-09): NOT AN ISSUE, NOTHING BUILT** — *"it is normal the orbit gets blocked if the piece collides with the
  protruding part at close in"*. Neither F2 nor R7; I2's close-in block at Piece44 / 45 / 42 is expected behaviour.
* **(e) I5** (a ±3 px tremble over a 2 px step reverses the target): not built.

## 7. ⭐⭐⭐ The void study and the rule built (2026-11-09, `1.0.112-`)

> The owner: *"I am tempted to fix with your recommendation B but i want to make sure this is not an ad hoc patch for our particular assembly configuration.
> Study the behavior for cases where there is a recess (with a bottom) or a hole (no bottom), with different geometries (shapes, position within face or at
> the edges, ratio depth over widths, etc.)"* — *"In our scene, there are no holes, no recess inside of a face, etc. so you need to simulate gizmo and piece
> behavior over such singularities before proposing"* — then *"Build, update the md files, deploy"*.

**The instrument**: `scripts/probes/void_sim.ts` (`npx vite-node scripts/probes/void_sim.ts`) — the REAL face map (`buildFaceMap`, `stackDepthAt`) on a
400 × 400 × 120 mm plate of box parts with voids cut into its top face, nine families: blind recesses (13 / 40 / 100 mm wide, 10 / 60 deep), through holes,
grooves the whole face long (with a floor), through slots, a U-slot from an edge, corner notches and rebates along a whole edge (13 / 50), an L-shaped recess,
an undercut (a 20 mm mouth over a 60 mm cavity); three pieces (a 30 mm cube, an 80 mm cube, a 20 × 20 × 100 bar); travels across and along at 1 mm. The
piece CLOSE IN: its resting face 16 mm over the gizmo, centred on it — its largest depth step, the steps it overlaps a part (blocked), the steps a straight
approach down to the gizmo clears (enterable). ⚠ Boxes only, the piece centred under the gizmo, one face (no edge band, no solver).

**What it found** (the rules before the build):

| family | before | why |
|---|---|---|
| every void WITH A FLOOR (recess, groove, U-slot, L, undercut, notch) | two 10 – 60 mm SPIKES, one at each rim (1.6 mm wide each); the piece blocked there | ⛔ a BUG: the faces' rectangles are grown `MAP_GROW_M` (1.6 mm) to close the 3 mm joints between the cores, and the growth moved every rim INTO its void — the map read a face, the wiring cast the floor. ⭐ **The cube's bottom groove (x 103.5 – 116.5) was already bridged (closed across); its "wall" was these two strips, at x 104 and 117** |
| an OPEN void narrower than the piece (a 13 mm notch or rebate) | the real depth: the piece, centred on the gizmo, down in it — **201 of 201 steps blocked** along a 13 mm rebate, every piece | D3's real depth for any void open on both travels, whatever the piece |
| an open void the piece fits (a 50 mm notch / rebate, a 30 mm piece) | the real depth, enterable; blocked near the riser (13 of 151) | as designed — the riser contact is I2's kind (§6 (d), *normal*) |
| a closed void, any size | bridged (D3 amended, 2026-11-05) — ⛔ **amended again 2026-11-09 (§8.3): bridged only with NO floor; a floor → its real depth where the piece fits** | — |
| a through hole / slot (no floor) | the mouth's plane | — |
| ⛔ the alternative weighed: real depth wherever the piece FITS, closed voids too | enterable, but crossing a 40 mm slot with a 30 mm piece blocked 28 of 201 steps (the piece sinks into the slot and meets its walls); and it reverses D3's amendment | rejected |

**Built** (`src/input/face_map.ts`, `src/render/assembly_wiring.ts`):
1. **The rims where the faces end** — `filledRegion(rects, cores)`: the grown rectangles still join and close (the joints, the holes), `real` is read from the
   faces' TRUE rectangles (`stackOf` passes both). A void's rim strip is a void now: closed → bridged on the plane; open → the strip continues the plane.
2. **An open void the held piece cannot enter is surface** — `stackDepthAt(s, x, y, foot)`: where no face of the plane is under the point, the void is open
   on both travels and a floor lies below, the void's OPENING (`voidOpening`: its run along `t` and `b` on the plane, to the first real face or the facet's
   extents — an undercut measured by its mouth) against the held piece's FOOTPRINT (`heldFoot`: its two smallest sizes, any way round, `pieceEnters`,
   `VOID_FIT_TOL_M` 0.5 mm): too narrow → `bridged`, the plane. No piece held → as before.
3. **Unchanged** (⛔ the first clause amended 2026-11-09, §8.3 — a closed void with a floor keeps its depth where the piece fits): a closed void is bridged whatever the piece (D3 amended); a void with no floor stays at its mouth; an open void the piece fits keeps its
   real depth. ⭐ **On the cube**: the bottom groove flat; the top-left notch (~50 mm) and the bottom-left (~90 mm) keep their depth — both held pieces fit
   (41.3 × 45, 44.8 × 51.8 mm): the notch the owner judged normal (§6 (a)) is untouched.

**Measured after**: the simulator's `built` column equals the chosen rule on 105 of 111 rows (the 6 others: one sample on the plate's outer border); no
rim spike in any family. On the cube (a 0.5° sweep of the map, the page): no gizmo below the bottom's plane at the groove (was 6693 samples 58 mm down at
x 104 – 117). Vectors: `tests/void_rims_fit.test.ts` (8; 7 RED on `7cbc8b4`, the 8th — a closed void stays bridged — the owner's rule kept). **1682**.
**The walks** (20 of the 23 scenarios, `rims_*` against `void_*`): no page error; gizmo jumps 491 → 432, piece jumps 324 → 253, camera jumps 326 → 225,
back-and-forth 31 + 34 → 21 + 24, map jumps 7765 → 5800, off-lines 238 → 139. ⚠ Long blocked stalls 17 → 30 (on the same 20) — but the walks are timed by
the clock: 10 of the 13 pairs part within the first 10 frames by one frame's step (2.8 mm), before any void, so after that the two runs walk DIFFERENT
paths. The one parting the rule made is the one meant: `close_top_grooves`, the gizmo kept on the top's plane where it dived 32 mm (466.5 → 498.5 mm).
None of the new stalls is over a void (the sides at x ±247.5, the top off its grooves, the bottom with the piece under the floor — where the old ones were).
⚠ Open: the face map outlines a face by its BOUNDING RECTANGLE, so a hole inside ONE face (a round hole cut in a plate) is invisible to it — only the cast
finds it. Every part is a box today; a non-box part needs the region from the triangles.

## 8. ⭐⭐⭐ `1.0.114from1.0.112-` (2026-11-09) — F7b, the lines refined, the closed void with a floor; open: I17's reach

### 8.1 ✅ F7b — the calm on every side facet, slanted ones included (ported; live first as `32732ee`)

Ported unchanged from `1.0.113-not-used` (its §8.3 holds the full record): `calmTarget`, `calmStep`, `calmShown` (`input/orbit_calm.ts`) — the calm in the
FACET's own frame (its normal as it is, its level `t`, its `b` up the slope; dy's run its own extent along `b`); a vertical facet exactly as before (the
cube untouched); the caps none; both shares whole where the frame changes. Simulated on a horizontal hexagonal prism (`tests/calm_slanted.test.ts`, 6):
10° of orbit off a 30° face's normal shows 2.5° (the old rule 25°); no sweep swings more than the old rule. ⛔ NOT ported from `1.0.113-`: the step walk
(F8), the line joins by bisection (F6) and `closedAlong` on real faces — the owner: *"too many back and forth of the red and green sections"* at the notches.

### 8.2 Open, for later improvement

### I17 — a narrow face cannot be held under the gizmo by a finger far out (the quads never show it) — ✅ CLOSED 2026-11-12, not applicable any longer (§9.16)

**The owner** (on the device, Piece42's slanted sides, proud of the cube's +x side): *"when I put the gizmo on the slanted face with the green line and
take the piece far away, the orientation of the slanted face under the gizmo does not show in the quads."*

**Checked in the page** (`scripts/probes/page_eval.mjs`, the orbit reset at yaw −2.5°, pitch 30°, far out): the code DOES carry the face — the gizmo at
(269, 455, 174) mm on Piece42's slanted side, its normal (0.26, 0, −0.96) (15° off −z), `orientationFrames` / `quadFrames` add it as the fourth quad
(drawn: a vertical quad turned 15°, outlined yellow); at yaw 0° the gizmo is back on Piece42's front and the fourth quad is gone. **A hand cannot get
there**:

1. **The slanted face is tiny in yaw.** Along the green it covers only yaw −3.25° … −1.5° — 1.75°. Far out the HUD reads `orbit 5.11°/mm dx`: **0.34 mm
   of finger**. §1.1's band (`motionDeadbandMm`, 3.5 mm) ignores the first 3.5 mm of a drag before anything moves, so a finger cannot stop the gizmo
   inside that window.
2. **The quads switch even later.** They take the new face only once the gizmo lies 5 mm off the current face's plane (`faceSwitches`,
   `gizmoEdgeMarginMm`, the *gizmo face edge margin* slider) — the window shrinks to ~1.35°, **0.26 mm of finger**.
3. **The green line misleads.** It is drawn from 96 samples round the turn — one every **3.75°** (~25 mm on that side); only the sample at yaw 0° lands
   on Piece42 (its front, x 288.8 mm), its neighbours on the side behind (x 247.5 at z 166 / 216), so the line is two chords THROUGH the part. Where the
   eye sees the line cross the slanted face, the gizmo is really on Piece42's front or on the cube's side, and the quads show those. (The red, 64 samples
   over 180° — one every 2.9°, ~19 mm of height — lands 2 – 6 samples on each of the part's slopes, so it follows them: the owner's *"why does the red
   follow the slanted faces whereas the green crosses through"*.)

**The root**: the gizmo moves by ANGLE (`mapGizmo` of the orbit's yaw / pitch), so a face seen nearly edge-on from the map's centre — a proud part's side,
37 mm deep — is a fraction of a degree, whatever its size; the drawn lines sample by angle too. Every narrow face far out has it.

⏸ **The owner (2026-11-10): *"do nothing for the moment"*** — recorded for a later possible improvement.

**Candidate fixes**: ✅ (a) BUILT (2026-11-09, the owner: *"build the fix"*) — §8.4; (b), (c) not built. (a) the lines sampled ADAPTIVELY — subdivided where the depth changes between two neighbours until they follow the
surface within ~1 mm (drawing only, cached per line) — fixes 3, not 1 – 2; (b) ⭐ the gizmo moved by DISTANCE on the surface rather than by angle (the
input-driven gizmo on world-plane cuts, the Fable simulation of 2026-11-09: the slanted face is then 37 mm of travel at any distance, the lines the exact
cuts) — fixes all three; (c) the edge margin read on the glass or relative to the face's size — eases 2 only.

### 8.3 ✅ THE VOID RULE AMENDED AGAIN — a closed void is bridged only where it has NO FLOOR (2026-11-09, the owner)

> The owner, on the top's black channel (130 mm wide, ~32 mm deep, running the whole depth front to back) — *"why does the red section completely avoid
> the bottom of the black channel recess?"*; the rule restated (D3 amended, 2026-11-05: *a void closed on either line's travel is bridged*) → *"Modify this
> rule: a void that is closed on either line's travel (faces of that plane on both sides of it along the green's travel or along the red's) and has no
> bottom (there is no bottom of the void where the gizmo can project) is bridged. Therefore, for the black channel, a green section correctly bridges, the
> red section would catch the bottom of the channel because the gizmo can project onto it"* → asked (the gizmo is one point on both lines: a green
> bridged while the red is on the floor parts them by the channel's depth) — *"I was meaning the green section bridges it when the green section is on the
> vertical face (not when the green section is on the horizontal face)"*; and the piece-fit rule (§7) for closed voids too: *"Yes"*.

**Why it was bridged** (probed: `stackDepthAt` over every facet of the cube, a 10 mm grid): the channel is closed ACROSS (the top's faces on both sides
along x — the green's travel over the top), so D3's amendment bridged it for BOTH lines (one gizmo), though it is open along the red's travel. The same
rule bridged three strips on the front / back near the top (the channel's mouths), a 10 mm groove under the bottom, the rims round Piece42 (+x) and round
a proud part on the bottom.

**The rule as built** (`stackDepthAt`, `input/face_map.ts`; the wiring's cast unchanged):
1. A void closed on a travel with **no floor under the point** — no deeper group of the facet's stack there (a slot through; the channel seen from the
   FRONT: it runs through to the back) — **bridged** on the facet's plane, as before.
2. A void closed on a travel **with a floor** — **its real depth**: `inside`, the wiring casts onto the floor (D3). From the top, the channel: the red runs
   along its floor, the green steps down its wall, across its floor and back up.
3. ⭐ **The piece-fit rule for closed voids too** (§7's, the owner's *"Yes"*): a void with a floor the held piece cannot enter (`voidOpening` against
   `heldFoot`, 0.5 mm) — **bridged**, whether closed or open. The cube's 10 mm bottom groove and the rims round Piece42 stay on the plane; the channel
   (130 mm; the pieces 41 × 45 / 45 × 52 mm) keeps its depth.
4. ⭐ **The floor read as ANY deeper group under the point** — ⛔ `front` alone (the frontmost group holding the point): a hole enclosed by the plane's own
   face is filled in that face's region (`filledRegion` closes holes), so the plane's group came first and the floor beneath it was never seen.

**Measured** (the page, the cube): the red at yaw 98° over the top — on the channel's floor (y 466 mm) from pitch 58° to 82°, then onto the top (499);
the green at pitch 70° over the top — 466 across the channel (x −132 … −20), 498 elsewhere; the front's green at the mouths' height (y 482) — the front's
plane (z −51) straight across the channel's mouth.

### 8.4 ✅ I17 (3) — THE LINES SAMPLED ADAPTIVELY (`refineStart`, `refineStep`, `refineNow` — `input/section_hull.ts`)

* Every interval between two neighbouring samples is split at its middle while the middle's point lies more than **1 mm** off the chord
  (`LINE_REFINE_M`), level by level over the whole line (breadth first — a budget of **160** evaluations a line, shared fairly, never spent on the first
  jump), at most **7** halvings. A real jump halves until its chord lies within 1 mm of the riser — kept as a jump; the join rule breaks it.
* ⭐ **A slice a frame**: a new line (its key changed — the line being dragged across) is drawn from its base samples (96 green / 63 red, as before); a
  line that stays refines **32 evaluations a frame** (`LINE_REFINE_PER_FRAME`). ⛔ All at once: 18.6 ms for one green on the desktop (256 evaluations,
  ~0.07 ms each) — a hitch on every dy frame on a phone. The mesh at a fixed size (the base + the budget; unused segments collapsed).
* ⛔ First built reading the quarters too on the first level: 96 intervals × 3 evaluations spent the whole budget before any split — Piece42 still a chord.
* **Measured** (the page, the green at pitch 30° by Piece42): its slopes drawn — x 250 → 252 → 264 → 287 → 291 mm up the near side, the front, and down
  the far side (was: two chords through the part); 118 samples, settled in 5 frames, a step 0.9 ms, a new line's base 5.3 ms (as before).
* ⚠ It fixes I17's third point (the line misleads) only: far out the slanted face is still 0.26 – 0.34 mm of finger (points 1 – 2, §8.2).

### 8.5 Proposed, NOT built — the input-driven gizmo on world-plane cuts (a Fable simulation, 2026-11-09) — ✅ CLOSED 2026-11-12, not applicable any longer (§9.16)

The owner asked for a logic keeping both lines world planes while the gizmo reaches every face, steps allowed. Proposed: the finger moves the gizmo BY
DISTANCE along the TRUE outline of the parts cut by two world planes (the facet's frame choosing them), the camera from the big facet plus ≤ 20° of tilt;
simulated on the cube's 240 faces: 0 mm off the planes, 100 % of the exposed area reached (the map today ~80 %), no jump. ⚠ It is §28.4 of
`TILTED_ORBIT_REBUILD_SCOPE.md` (branch `1.0.107-Close-in-atlas`) — proposed 2026-11-06, not adopted. It removes §31.4's bijection (no second surface to
map onto) but reopens the cap exits (C1 a hold, B / A rolls — the owner's *"no roll"*), several-loop cuts and path dependence (0.7 mm median on the cube,
75 – 100 mm on synthetic shapes). Recommended: not now — an offline test of the cap exits and the loops first.

### 8.6 Vectors

`tests/calm_slanted.test.ts` (6, F7b, RED on `f82bfbe`); `tests/line_refine.test.ts` (6, all RED on `b073178`); `tests/void_bridge.test.ts` and
`tests/void_rims_fit.test.ts` rewritten to the amended rule (7 RED on `b073178`; the two *no floor → bridged* cases pass on both — the rule kept);
`face_map.test.ts`'s wiring strings. **1696** (§8.7: **1700**).

### 8.7 ✅ A LINE BREAKS ONLY WHERE THE GIZMO JUMPS — the joins verified within the frame's budget; the lift along the real surface (2026-11-09)

> The owner: *"the slanted vertical faces still do not show the green contour while all the slanted faces show the red contour … why?"* → *"why such a
> difference between red and green contours? (I do not want a patch, I want to understand why such difference before fixing it)"*; then *"check why the
> red contour on this protruding grey part slanted face only shows when there is delta position change and then disappear when delta position stops"* →
> *"Build lift fix and budgeted continuity test"*.

**Why** (measured on the page, each line's settled samples): two neighbours were joined when the drawn step was at most **2.5 × the place's step + 2 mm**
(`sampleJoins`) — a rule about SPEED, not continuity. On a slope the drawn step is 1 / cos(its angle to the big face) times the place's, so every surface
steeper than ~66° to the big face read as a jump: the red crosses Piece42's top / bottom slopes at 58° (1.9 ×) — joined; the green crosses its slanted
vertical sides at 75° (3.8 ×) — CUT (23.6 mm drawn for 17.5 allowed). The refinement (§8.4) exposed it: before, one chord 25 mm wide passed the rule.
The reverse on Piece44 — an UPSIDE-DOWN frustum on the top, its four slopes facing down (an overhang the top's cast never meets): the gizmo truly jumps
41 mm onto its top; at rest the refined line is cut there (right), but the line being DRAGGED, rebuilt every frame from its base samples ~20 mm apart,
joined the jump by the same rule — a chord through the air lying almost on the slanted front face (the ephemeral red).
⚠ A second, smaller inconsistency: the lines were lifted 2 mm along the BIG face's normal — on Piece42's sides 0.53 mm off the surface.

**Built** (`input/section_hull.ts`; the wiring's `sectionLinesFrame`):
1. **The joins** — each interval of a line carries its join: both ends on the SAME real face (one part, one normal, one plane: `sameFace`) — joined at
   once, no evaluation; a face change — verified by `pathJoins` (the interval halved, the larger step kept, until under 3 mm: continuous; 12 halvings at
   most: a jump), out of the SAME per-frame budget as the refinement (`LINE_REFINE_PER_FRAME`, 32 evaluations — the joins first, then the refinement);
   ⭐ **unverified: drawn broken — never a chord**. A refined split keeps a continuous interval joined in both halves. The speed rule (`sampleJoins`)
   deleted. The gizmo's vertex: both sides when the interval it splits is continuous, else each by the same face (the nearer one at least, as before).
2. **The lift along the real surface's own normal** (the gizmo's hit), the gizmo's vertex too — 2 mm off every face.

**The cost** (the owner's condition, measured on the desktop): 0.013 – 0.06 ms an evaluation; verifying every face change of a line at once would cost
12 – 112 evaluations (0.2 – 4.8 ms) — on the line being dragged, rebuilt every frame, up to ~+10 ms a frame on an iPhone. Budgeted: a fresh line's
joins 0.4 – 1.8 ms in its first frame (the red at eight yaws), then at most 32 evaluations a frame per line — no added frame cost. ⚠ The price: while
dragging, a face change not yet verified shows as a short break, closed within a few frames.

**Measured** (the page): the green over Piece42's sides joined at every height probed; the red over Piece44 on its FIRST frame — the jump's interval
unverified (broken, no chord), settled — a jump (cut).

**Vectors**: `tests/line_joins.test.ts` (4, all RED on `2879172`: `pathJoins` absent); `line_refine.test.ts`'s wiring string. **1700**.

## 9. ⭐⭐⭐ THE TILTED POLE: the pressed cap becomes a side (proposed 2026-11-09; decided 2026-11-10, §9.4; ✅ BUILT on `1.0.117-`, §9.5)

> The owner: *"create a new rule: when the left click or finger is pressed for orbiting, the orbit tilts so the face currently holding the gizmo becomes
> the one with the red and green sections which are perpendicular (currently these are the vertical faces which have the red and green sections
> perpendicular while the top and bottom faces have the polar red and green sections). If the gizmo crosses the edge of the face towards a face which
> would result in the scene upside down or slanted, the camera tilts when the gizmo crosses the edge so that the verticality on the next face is restored
> and the next face becomes the face with the red and green sections which are perpendicular (therefore the face which is exited takes the polar if it
> shall contain the pole, unless it is slanted and does not take the pole and can continue to receive perpendicular red and green sections) : at the
> moment the camera tilts the gizmo stays where it is but the red and green sections are recomputed to adopt the perpendicular configuration on the
> coming face"* — *"my new rule allows to convert a polar red-green face to a perpendicular red-green face once, until the gizmo crossing edges requires
> the polar orbit to realign its poles with the world vertical axis so the camera view remains faithful to the world vertical alignment"* — *"the calm
> follows the tilt for the face which receives the perpendicular red and green sections"* → *"update the md file to capture this proposal as next to
> build"*.

### 9.1 The rule proposed

1. **At a press on a cap** (the top / the bottom — a facet that holds a pole) the orbit's FRAME tilts about the camera's horizontal right axis, by the
   angle that brings the pressed face's normal to the horizontal toward the camera (90° on the cube's top). ⭐ The camera does not move (measured: the
   view at the press unchanged, 0°). In the tilted frame the pressed face is a SIDE: the red runs straight away from the viewer across it, the green
   straight left–right; ⭐ the calm in the tilted frame on that face (the owner). ⭐ The gizmo stays where it is: the tilted map's angles put at the gizmo
   (`mapAngles`, as after the slide), the 0 – 5° gap closed by the existing catch-up (`mapAnglesStep`) — ⛔ read at the camera's angles instead, the
   gizmo jumped 46 – 49 mm at the press off a side's middle.
2. **The tilt holds while the gizmo stays on that face** (its stack: proud parts and grooves included), across releases and presses.
3. **At the first crossing off it, the orbit returns to the world frame**: the gizmo stays, the map's angles and the lines recomputed in the world frame,
   the face exited polar again. At the crossing the camera already points within 10° of the world orbit's direction there — the re-tilt is essentially a
   ROLL back to upright (measured, the camera facing the front):

   | crossing | the view at the edge | the re-tilt |
   |---|---|---|
   | dx to the left or right side | slanted 63° (90° further on) | a 63° roll back to upright; the direction 10° off |
   | dy toward the viewer, onto the front | upright, on the world orbit's direction | none — the switch is invisible |
   | dy away, over the far edge onto the back | upside down (180°) | a 180° roll — decision 2 |
4. **A face that does not hold a pole never tilts** (the vertical sides, slanted side facets). ⭐ While tilted, the tilted orbit's poles (the front's and
   the back's centres) are never reached — any crossing re-tilts first.

### 9.2 The owner's decisions — ✅ DECIDED 2026-11-10: 1 (c), 2 (a), 3 (a), 4 the rule removed → §9.4

1. **The camera not square to a side at the press** (measured at 30° and 60° off the front): (a) the tilt about the camera's EXACT right — no motion,
   but the pressed face's lines are vertical planes at the camera's heading, up to 45° off the world x / z axes (the world-axis rule bent on that face) —
   recommended; (b) the tilt snapped to the nearest world axis — the view ROLLS 34° and the gizmo jumps 64 mm at the press; (c) snapped, with the camera's
   heading swung at the press (up to 45° about the vertical, no roll).
2. **dy away over the cap's far edge**: (a) the 180° roll — the same dy kept up then brings the gizmo back over the edge onto the cap, polar again;
   (b) a stop at the far edge (as today's pole — round by dx); (c) other.
3. **The pace of the roll back**: over the edge's slow stretch (the last 10 mm / 10°, tied to the place, reversible) or a fixed time.
4. **Rolls**: the owner ruled them out on 2026-11-06 (*"no camera roll"*); this rule needs one at every exit of a tilted face but dy toward the viewer —
   63 – 90° at a side exit, 180° at the far edge unless 2 (b).

### 9.3 The probe and the cost

Simulated offline on the cube's 240 real faces through the real face map (`buildFaceMap`, `mapTarget`, `mapAngles`, `stackDepthAt` — no cast, no
solver, no calm): a press on the top from three camera headings (−90°, −60°, −30°), each tilt variant, then dx and dy both ways to every facet change,
the view's verticality read there (the world's up on the screen against the screen's up). The scripts: the session's scratchpad `tilt_sim.ts`,
`tilt_sim2.ts` (to be moved to `scripts/probes/` when built). ⭐ The bottom is symmetric (a press from below) — not simulated.
**The build**: ONE rotation at the boundary between the orbit and the world — the orbit's direction and the camera's up turned by it, the face map built
in the tilted frame (cached per tilt), the solver's ring through it, `mapAngles` at the press and at the re-tilt; the calm's targets on the tilted map.

### 9.4 ✅ THE RULE AS DECIDED (2026-11-10, the owner; ⛔ NOT BUILT)

> The owner: *"Decision1: c. But make sure the gizmo stays at its exact position on the face and then the red and green sections recompute from there.
> If gizmo is on a channel, the recompute the green/red sections shall apply the rule and maybe the gizmo needs to relocate with a step jump (i don't
> know): in such case, make the jump smooth (same as the camera tilt)"* — *"Decision 2: a"* — *"Decision 3: a"* — *"Decision 4: remove the rule as it
> conflicts with my decisions here"*.

1. **The press on a cap (1 (c))**: the tilt's axis SNAPPED to the nearest world horizontal axis, and the camera's heading SWUNG about the vertical to face
   the pressed face square (0 – 45°, no roll) — ⭐ a timed ease (a press has no finger travel to pace it), its duration a slider (a guess until a hand
   sets it). The red and green on the tilted face run along the world x / z.
2. **The gizmo stays at its EXACT point on the face** — the tilted map's angles taken AT that point (`mapAngles`), the lines recomputed from there.
   ⭐ Where the tilted frame's rules place the gizmo elsewhere at those angles (a void's rule read on the new lines' travels — a channel bridged or
   floored differently, a rim), the gizmo RELOCATES — ⛔ never a step: eased over the SAME ease as the camera's swing, starting and ending with it.
3. **The far edge (2 (a))**: a dy away over the tilted cap's far edge — the view rolls 180°, the frame back to the world's, upright on the back face.
   ⚠ As measured: the same dy kept up then brings the gizmo back up over that edge onto the cap, polar again (the input reversed after a half roll, as the
   scope's §4.2); to go on down the back the finger reverses. A new press on the cap tilts it again.
4. **Every roll back to upright paced by the FINGER (3 (a))** — over the edge's slow stretch (the last 10 mm / 10°, `faceEdgeSlideMm` / `faceEdgeSlideDeg`), reversible, held
   when the finger stops: the 63 – 90° at a side exit, the 180° at the far edge; none toward the viewer (the switch unseen). A relocation of the gizmo at
   the re-tilt (point 2 read in the world frame) eased over the same stretch.
5. **The "no camera roll" rule (2026-11-06) is REMOVED (4)** — the owner: it conflicts with these decisions. ⚠ Its text lives on the later branches
   (`TILTED_ORBIT_REBUILD_SCOPE.md` §19 onward, `1.0.101-` … `1.0.107-`), not on this one; this line is its retraction here.
6. Unchanged from §9.1: the tilt held while the gizmo stays on that face's stack, across releases and presses; a face holding no pole never tilts; the
   calm in the tilted frame on the tilted face; the bottom the same rule mirrored (⚠ not simulated — to be probed before it is built).

### 9.5 ✅ BUILT (2026-11-10, branch `1.0.117-`) — ⛔ no device close

> The owner: *"Build it, then probe for issues. Update the md files. Deploy"*; then, on the probe's first finding: *"Make the roll back by finger && minimum
> of xx ms to smoothen it. Select a duration and put a slider."*

**The rule in `src/input/orbit_tilt.ts`** (engine-free), wired in `render/assembly_wiring.ts`:
* **ONE ROTATION BETWEEN THE ORBIT'S ANGLES AND THE WORLD** (`st.asmTilt`): `map` (F → world) — the face map BUILT IN F (`tiltFaces`, `tiltBox`; the
  pressed cap a SIDE facet there), every cast turned into the world and back (`frameCast` → `modelCast`: still the parts at rest); `dir` — the orbit's
  DIRECTIONS (the piece, the camera, the cone, the slide's way out), `map` once the press's swing is over. `mapGizmo` gives its point and normal in the
  world; its `t` (the calm, the lines' angles) stays F's. The world's map is kept beside (`asmWorldMap`).
* **The press** (`tiltOnPress`, `pointer_wiring.ts`: a FIRST press alone — a finger, the left button; not the second touch): the gizmo on the world's
  top / bottom (a real facet), the world's frame, no slide. `capTilt` about the world horizontal axis square to the SNAPPED heading (`snapHeading` —
  the piece's yaw to the nearest 90°; ⭐ an axis square to the heading never rolls the view, vectored with the camera's offsets); the heading SWUNG over
  `tiltSwingMs` (`swingDir`: at the press exactly where it was); the map's angles put AT the gizmo in F (`mapAngles`); a relocation (`asmGOff`) eased with
  the swing. ⭐ EVERY stored orbit angle turned into F (`turnAngles`): the orbit's, the solved piece's, the spring's, the camera's as shown, the solver's
  memory (`orbitUserV`, `orbitRawPrev` — ⛔ missed in the first build: the solver read the whole frame change as a finger step, the pitch thrown to −90° at
  the press), the calm's normal. The coast stopped.
* **The roll back** (`exitShare`, `rollStep`, `frameMix`): the finger's share of the way off the tilted facet (`kT`: its edge band toward another facet —
  ½ the blend's weight doubled, 1 at the edge; 1 beyond it) and the roll SHOWN (`k`) following it at most 1 / `tiltRollMinMs` a ms — ⭐ the owner's minimum
  time (*"by finger && minimum of xx ms"*): reversible, a whole roll never under 250 ms. The camera's frame turned from F's upright toward the world's by
  `k` about ONE axis (the half turn's kept from frame to frame). ⭐ The world's frame (`tiltOff`) only once the roll shown is whole and the gizmo is off the
  facet — until then it goes on in F past the edge (F's map is the real surface there too); every angle turned back, the calm's shares whole, the map's
  angles put at the gizmo in the world, a relocation there eased by the finger's travel (`faceEdgeSlideDeg`).
* **The calm** in F on the tilted facet, whole toward EVERY edge (each a frame change) over its own edge zones (`tiltCalmWhole`; ⛔ forced by the exit's
  share alone — the 10° band — the piece caught up its calmed angle in two or three input steps: 957 mm in a frame, probed).
* **Three sliders** (☰ → CAMERA → CAMERA ORBIT AROUND CENTER, under the edge's two): `tiltedPole` (1 on / 0 the polar cap as before), `tiltSwingMs`
  (300 ms), `tiltRollMinMs` (250 ms) — the two times guesses until a hand sets them.

**The probe** (`scripts/probes/tilt_probe.mjs`, headless, the cube far out — the camera ~7.8 m — the mouse at 3 px a frame; seven scenarios: the top by
dx both ways, dy away over the far edge, dy toward the front, a diagonal with a 40° swing; the bottom by dx and by dy over its far edge):
* the press: the camera and the gizmo moved 0.0 mm at the press; the swing ends at the snapped heading (−60° → −90°, −50° → −90°, −120° → −90°), a
  frame's look ≤ 3.5°, the gizmo 0.0 mm; the calm in F then lifts the piece toward the face's normal (62° → 70° of elevation; the diagonal 70° → 85°).
* on the tilted face: the gizmo with the finger on the screen in EVERY frame (dx and dy, top and bottom); the red along the heading, the green square to it
  (vectored on the cube's 240 faces).
* every exit: the roll back to upright (a side 52 – 56° shown, the far edge 180°), then upright (|roll| ≤ 3° — the camera's own 2.5° yaw offset reads as
  ~2 – 5° there); the gizmo continuous through the crossing; dy toward the viewer: no roll (the switch unseen).
* ⚠ **Found, and fixed (the owner's slider)**: far out the edge's stretch is ~1.5 mm of finger (the orbit ~5°/mm), so by the finger alone the far edge's
  half turn passed in one or two input events — **105° in a frame**. With `tiltRollMinMs` 250: ≤ 27° a frame, over ~8 frames; a side's ≤ 10°.
* ⚠ After an exit 2 – 4 frames in 40 have the gizmo against the finger on the screen — while its relocation eases out (the world map's place differs from
  F's at the crossing by up to ~50 mm, eased over 10° of travel).
* ⚠ Past the far edge the same dy brings the gizmo back over it onto the top, polar (point 3) — to go down the back the finger reverses.
* The press's cost: building F's map 4 – 13 ms once on the desktop (the world's 3 ms) — a phone's maybe 3 ×, one frame.

⚠ **The walks** (`walk_probe.mjs`, six scenarios — far meridians, the top close in (I14), the top's grooves, the bottom by Piece43, random 0 / 1 — the
tilt on against `?tiltedPole=0`, 0 page errors both). ⛔ The recorder had recorded NOTHING since §8.7 (it read `cache.surf`, deleted with the speed rule — it
threw every frame); fixed to read the lines' own joins (unverified joins count as breaks: line-break counts are not comparable with the walks before §8.7).
| total (six scenarios) | tilt off | tilt on |
|---|---|---|
| gizmo leaps / gizmo jumps | 196 / 60 | **153 / 41** |
| pole stalls | 43 | **31** |
| the ring off its lines (frames) | 2765 | **1644** |
| fly-offs | 94 | 81 |
| camera jumps / camera back-and-forth | 5 / 0 | 79 / 42 → **4 / 1** on the top close in after the fix below |
| the gizmo against the finger | 165 | 357 |
| rolls on a wall (the analyser's: the up > 5° off the vertical) | 1 | 29 — the roll back, by design |
* ⛔ **FOUND AND FIXED**: under a SLIDE on the tilted top the lock's cone was measured from F's angles read as the world's (`assemblyFrame`'s hover branch)
  — the piece clamped, the camera jumping 23 – 34 mm back and forth for 20+ frames (the top close in: 76 camera jumps, 41 back-and-forth); now the orbit's
  direction turned into the world: 4 and 1 (tilt off: 2 and 0).
* ⚠ The gizmo AGAINST the finger, 357 against 165: the extra events are in the WORLD's frame after an exit, on the vertical sides at the cube's corners
  (dx legs low down) — the world orbit's own corner crossing; the tilt changes where the random walks go next, and they pass those corners more often.
  Not established as the tilt's; the tilted face itself: every frame with the finger (the tilt probe).
* ⚠ Only the top close in was re-walked after the fix (the other five as above, before it).

✅ **THE OWNER (2026-11-10): *"The build is good."*** — the branch renamed `1.0.117-Tilted-polar-orbit`, the best piece orbit so far. ⏸ **The slide under the
tilted pole** (the cone fixed above; what remains — a slide ending off the tilted facet, below): *"just record it: we will later work on the slide and this
will solve by itself hopefully"* — nothing more built for it now.

**Not done**: the slide ending OFF the tilted facet (it lets go at its edge, R6) would switch the frame with the roll eased by time only; the coast is
stopped at a frame change (a flick across an edge stops there); the bottom's far edge probed, its grooves not. **Vectors**: `tests/orbit_tilt.test.ts` (16,
RED on `46d24db` — the module absent); twelve wiring strings in six suites updated to the frame-aware code. **1716**.

### 9.6 ✅ THE AUTOMATIC TILT, ANY FACE HOLDING A POLE, AND THE CROSSING (2026-11-10, branches `1.0.118-Tilted-polar-orbit-debugged` → `1.0.119-`; live `c16f5e1`) — ⛔ no device close

⭐ **The owner's term**: *"the faces holding the poles"* (not "the top / bottom": a pole may be held by an edge or a slanted face — a hexagon extruded
horizontally).

**1. The automatic tilt** (the owner's logic, after a first build reverted — *"you did not understand my logic"*):
> *"if the distance is greater than your slider threshold (… with hysteresis …), the automatic tilt toggles off (the tilt can be triggered manually as
> current reverted build) — if the piece crosses the hysteresis threshold, the tilt automatically triggers on or off (if the face is not already a red-green
> perpendicular) — if the piece is beyond the hysteresis threshold (ie close to the face), the tilt automatically triggers each time the gizmo crosses the
> edge towards a face's which is not red-green perpendicular (with a small hysteresis which I propose to be the time required for the camera to align)"*;
> then *"Set the default tilted pole automatic within 20%"*.
* `tiltAutoLatch`: on within `tiltAutoPct` % of the far distance (**20 %**: 1.2 m of 6.0 on `Scene_1`), off only beyond + 5 points; 0: the press only.
  Close in, the gizmo entering a face holding a pole tilts by itself; going out past the threshold turns a tilt off (the roll back and the gizmo's
  relocation by time — no edge to pace them).
* The hysteresis: no tilt back before the camera has aligned (`tiltExits`: the swing over, the roll shown whole); a tilt made at an EDGE (every automatic one)
  asks no roll back until the gizmo has once been in the face's middle (`tiltExitTarget`'s arming).
* ⚠ A consequence recorded (decision 2 (a) composed with the automatic re-tilt): dy held up close in crosses the top again and again with a 180° roll each —
  the gizmo always with the finger on the screen; to go down the back, the finger goes down.

**2. Any face holding a pole** (*"fix the gap"*): `capTilt(hs, n)` turns by the face's OWN angle about the horizontal axis square to the snapped heading
(no roll at any angle): 90° a level face, 60° a hexagon's slanted face toward the camera, 120° one slanting away (⛔ a quarter turn always: 30° short). A
VIRTUAL face holding a pole (an edge holds it, no face beyond 45° — a diamond) tilts as a level one; the gizmo onto the nearest real face, eased.
Vectored on synthetic prisms only (no such scene yet).

**3. The back-and-forth at a crossing** (*"why is there a back-and-forth jump of the scene when the gizmo crosses an edge"*): the calm's shares are EASED;
at a fast finger the wall's vertical share was 0.78 at the edge, the stale state applied on the face holding the pole for the frame before the automatic
tilt (the piece thrown back 6°), then the tilted face's calm brought it forth. ✅ Close in the calm is made whole by POSITION on the shown direction, never
eased (`poleEdgeWhole` toward a wall's end bordering a face holding a pole, whole ON that face, `tiltCalmWhole` on the tilted face): the piece's elevation
−40.6° → −51.4° steadily through the crossing and the tilt (was −43° → −37° → −46°). Also: a frame change turns the camera's follow state and the
spring's rates instead of resetting them.

**4. The crossing** (⛔ REPLACED the same day by the rebuild, §9.7) — the owner's decisions: *"Finishing the tilt when finger stops: no halfway roll back: it shall finish the tilt. Make sure we end up in a
situation compatible with the commitment at edge that you recommend. yes to all your other recommendations"*:
* **COMMIT AT THE EDGE** (`tiltStepAllowed`, after every finger and coast step — `tiltClampStep`): past the edge with the roll not whole, never back onto the
  face nor back down the stretch; during a swing, never back over the edge it came in by. Before the edge the roll stays the finger's (decision 3 (a)).
* **A STOPPED FINGER FINISHES THE TILT** (`tiltFinishes`): armed, the roll begun, the finger at rest (§1.1's device-derived rest, or lifted with no coast)
  — the gizmo carried over the edge (`edgeBlendDir`, `tiltCarry`) and the roll completed; never rolled back; then committed as any crossing.
* **THE ROLL AT MOST `tiltRollDegS`** (**360°/s**; `rollDurationMs` of the turn's own angle): a half turn 0.5 s, a side's 63° 0.18 s — ⛔ `tiltRollMinMs`
  (a whole roll in 250 ms whatever its size) deleted.
* **THE FINGER'S DELTA CLAMPED IN THE STRETCH**: armed, the share never ahead of the roll shown by more than a frame's slack — the finger's excess
  discarded; the gizmo and the view reach the edge together.
* Probed (`tilt_probe.mjs`, the piece 1.0 m out): stopped at a roll of 0.20 → finished to 1.00, then the world's frame; a 4 × finger → the roll at its speed,
  the gizmo held with it; the far edge's half turn ≤ 12.8° a frame (was 27°); with the clamp the gizmo reaches the edge only with the roll essentially whole,
  so the commit is the safety net for a frame or two. ⚠ Not stopped: a finger rocked INSIDE the stretch rocks the view (by design, 3 (a)), now ≤ 360°/s.

**The sliders** (☰ → CAMERA → CAMERA ORBIT AROUND CENTER): `tiltedPole` (1), `tiltSwingMs` (300 ms), `tiltRollDegS` (360°/s), `tiltAutoPct` (20 %).
**Vectors**: `tests/orbit_tilt.test.ts` (30). **1730**.

### 9.7 ✅ THE REBUILD: THE TILT AT THE EDGE, COMMITTED, TIMED, THE GIZMO HELD; THE FACE MAP'S STRETCH REMOVED (2026-11-10, `1.0.119-`) — ⛔ no device close

> The owner: *"Modify: once the tilt starts, it cannot be rolled back (i did not understand what you meant by stretch but this shall not impact the tilt) and
> shall complete"* — *"I do not understand the purpose of the stretch. I think this is superfluous since any tilt cannot be reversed before completed. I
> would prefer to simply keep the edge, and not use any stretch"* — *"Revisit my requirements since my post with the crossing of the edge and the 4
> attachments and propose a rebuild"* → the decisions: *"1-b; 2- one speed for every tilt; 3- remove it"*.

**The requirements revisited** (since the post with the crossing and its attachments): R1 no going back before the tilt completes (no oscillation); R2 a
tilt never left half done; R3 a bounded tilt speed; R4 finish, never undo; R5 a started tilt is irreversible and completes; R6 the edge the only trigger;
the hysteresis the camera's alignment time. ⛔ §9.6's crossing (the roll in the edge's stretch by the finger, reversible, then the commit, the finish on a
rest, the carry, the share clamp) is REPLACED — its rules answered a stretch R5 and R6 removed.

**The rule as built** (`src/input/orbit_tilt.ts`, `render/assembly_wiring.ts`):
1. **One trigger — the EDGE crossing**: onto a face holding a pole (close in, automatic; or a press) the orbit tilts so it is a side; OFF the tilted face the
   roll back to upright starts the moment the gizmo crosses (off the tilted facet in F's map).
2. **A tilt runs to the end on its own clock**, whatever the finger: **ONE SPEED FOR EVERY TILT**, `tiltRollDegS` (360°/s) of its own angle
   (`rollDurationMs`): a roll back of 180° 0.5 s, of 63° 0.18 s; the swing of a tilt just made (≤ 45°) 0.13 s at most, none at once.
   ⛔ `tiltSwingMs` (300 ms for any swing) deleted.
3. **THE GIZMO HELD while a tilt is under way** (1-b; `tiltUnderWay`, `tiltClampStep` after every finger and coast step): its swing, or its roll back not
   whole — every orbit step refused, the coast stopped; complete, the finger has the orbit again. The next tilt only after (the owner's hysteresis).
4. Out past the automatic tilt's threshold: the same timed roll, the gizmo held.
5. **Kept**: the calm made whole by position (§9.6 — the back-and-forth), the camera's state turned through a frame change, the gizmo at its exact point,
   any face holding a pole by its own angle, the automatic latch (20 % / 25 %). A relocation of the gizmo where a frame change moves it: by time (with the
   swing; after an exit 45°'s time at the speed — 125 ms).
6. **THE FACE MAP'S SLOW STRETCH THROUGH AN EDGE REMOVED** (3 — *"remove it"*): `faceEdgeSlideMm` / `faceEdgeSlideDeg` (10 mm / 10° since 2026-11-04)
   deleted with their sliders; the map's knobs zero (`MAP_OPTS`). ⚠ **Its cost, measured** (✅ answered by the glide at an edge, §9.8) (the page, the gizmo swept over the whole map every 0.25°): the
   blend through an edge it carried went with it — the gizmo now STEPS where the real outline is not the map's at an edge: **110 mm** at the bottom edge
   (pitch −45°, yaw 180° / 225°), **85 mm** at the top edge (yaw 135°), 50 – 58 mm at slice ends round yaw 131° – 135° (pitch −60°, 40°); 41 mm over the face
   holding the top pole (Piece44 — stepped before too, §8.7); continuous mid-height round the sides (≤ 1.4 mm). The blend alone (no slowing) can be
   restored if the device shows the steps.

**Probed** (`tilt_probe.mjs`): the roll starts exactly at the crossing (0 until it, then 0.23, 0.43 … 1 for a side; 0.06 a frame for the far edge's half
turn — ≤ 11.5° a frame); a finger reversed just after a crossing neither stops nor reverses the roll (the gizmo held, then free); the swing of 30° in 83 ms,
the gizmo still; the automatic tilt at 1.0 m: onto the face holding the pole and back at the next crossing (the held-dy loop of §9.6 unchanged).
**Vectors**: `tests/orbit_tilt.test.ts` (the share, the arming, the finish, the carry and the clamp deleted with their rules; the speed, the hold, the timed
roll added); `face_map.test.ts`'s stretch vector now asserts its removal. **1724**.

### 9.8 ✅ THE GLIDE AT AN EDGE (2026-11-10, `1.0.119-`) — ⛔ no device close

> The owner: *"What causes the jumps? Explain with a sketch"* → the three options (the blend alone, a glide by time at the edge, leave them) → *"Build 2"*.

**The cause** (measured in the page): the gizmo is the contour's point pushed in along the FACET's normal onto the parts (D3). Where a NOTCH is cut along an
edge the contour's corner lies in empty space, and the two facets' rays land on the notch's two different walls: at the cube's bottom edge (yaw 180°,
pitch −45°) the −x side's ray meets Piece30 at x −147, the bottom's meets Piece37 at y 74 — **110 mm** in one 0.25° step; at the top edge (yaw 135°,
pitch 45°) the side's ray meets nothing (the void rule: the side's plane), the top's drops onto the notch's floor (Piece25, y 414) — **85 mm**. The
stretch's blend (removed, §9.7) had glided A → B over the last 10° before the edge.

**Built** (`edgeGlide` — ⛔ generalised the same day, §9.9; the wiring's per-frame gizmo): when the map hands the gizmo to the next facet and its point jumps more than
`EDGE_GLIDE_MIN_M` (5 mm — a plain convex edge: both rays meet at its corner, nothing), the switch stays AT the edge and the jump is eased by time
(`asmGOff`, the piece's ring with it) over 45°'s time at the tilt speed (125 ms at 360°/s). A frame change keeps its own relocation.
**Probed** (`tilt_probe.mjs`, `glide_*`): the bottom edge 110 mm → 18 + 34 + 31 + 13 mm over four frames; the top edge 85 mm → 22 + 34 + 24 mm.
⚠ **Not an edge, not glided**: inside a face, the gizmo leaving a notch's floor for the face's surface (the notch's own wall — D3's real depth): 90 mm on
the top (y 414 → 499), 62 mm on the bottom (y 74 → 15) — as before the rebuild (§6 (a): the owner, *"normal, even with small jumps"*).
**Vectors**: `orbit_tilt.test.ts` +2 (the measured 110 mm case; none on one facet, under 5 mm, after a frame change). **1726**.

### 9.9 ✅ THE GLIDE OF THE GIZMO'S DEPTH — every step of the real surface (2026-11-10, `1.0.119-`) — ⛔ no device close

> The owner: *"Apply the glide to those steps as well, and check if this can be applied anywhere else."*

**Built** (`gizmoGlide`, replacing §9.8's `edgeGlide`): the shown gizmo keeps the face map's OWN travel (the contour's place — continuous, across an edge
too) and every step of the REAL depth beyond it (more than 5 mm) is eased out by time over 45°'s time at the tilt speed (125 ms at 360°/s), the piece's
ring with it. One rule for: a notch cut along an edge (§9.8, the switch still AT the edge), a notch's own wall inside a face, a void's rim, a proud part's
side. A frame change keeps its own relocation.

**Probed**: the notch runs of §9.8 — the largest gizmo step through the bottom edge and onto the bottom's surface 62 → **22 mm**, through the top edge and
out of the top's notch 90 → **34 mm** (the input's own step ~22 mm). The walks (`close_top_grooves`, `close_bottom_piece43`, `random_0`, 0 page errors): the
notch's wall on the tilted top 85 mm in 63 + 19 + 2 mm, a proud part 74 mm in 65 + 9 — the headless page draws ~10 – 15 frames a second under the walks,
so 125 ms is one or two frames there; ~7 – 8 on a phone at 60.

**Checked elsewhere** (the walks' remaining jumps):
* ⚠ an AUTOMATIC TILT's swing at one speed (decision 2): up to 45° of heading in 125 ms, eased already — read as camera steps of 0.2 – 0.6 m, the piece up
  to 0.3 m; a minimum swing time would soften it (not a glide: the speed itself).
* the relocation after leaving a tilted face (42 – 50 mm steps): already glided over 125 ms; a longer time would soften it.
* an approach leg (A + drag): a camera step of 0.56 m — not the tilt's; not examined.
* not seen in these walks: the solver's relocation of the piece out of a part, the slide's latch and release — candidates if the device shows them.

**Vectors**: `orbit_tilt.test.ts` (the glide: the measured bottom edge, a notch's wall inside a face, none for the map's own travel, under 5 mm, after a
frame change). **1727**.

### 9.10 ✅ THE SHAKE AT A CROSSING — three roots, and the calm carried over a top / bottom edge (2026-11-10, `1.0.119-`) — ⛔ no device close

> The owner: *"when i cross the edge (i tested on the horizontal edges), there seems to be a sort of shake of the scene. probe that and propose a fix"* —
> *"when i cross at close in"* — *"Build 1 and 2 fixes"*, *"Also build fix 3"*, *"Make sure those three fixes address deep root causes and not just patch"* —
> fix 2: *"i think the tilt shall happen when the red section reaches the edge at the bottom of the mouth, therefore the green section should not be an
> issue"* → *"build b"* — the tilt of the assembly: *"The tilt of the assembly is related to the calm: the calm limits the tilt during the right or left
> orbit, but when dy approaches the gizmo to the edge, the tilt seems to catch up what the calm prevented"* → *"build it"*.

**1. Two time laws in one rig** (the jerk before an edge). The calm's whole share by POSITION (§9.6, `poleEdgeWhole`, `tiltCalmWhole`) turned the camera's
DIRECTION at once on every finger event, while its LOOK (the gizmo, `gizmoEaseMs`) followed 45 ms behind; in the edge zone a mm of gizmo is ~4× the
camera's angle — the image leapt forward, then slipped back (probed close in: 4.5 – 7.7° in the event's frame, then 0.1° back; far out, where the share
was the calm's own 120 ms ease, the pitch rate doubled at the edge, 2.4 → 5.3° a frame). **Built**: the share by position kept, put on the rig's own lag
(`wholeShareStep`, `gizmoEaseMs`), at every distance. **Probed**: 2.9 – 5.8° on an event, carried on over the next frames; the slip ≤ 0.04°; far out
2.5° a frame through the edge.

**2. The auto tilt held back by a glide** (the transition *"not at the edge but somewhere inside the horizontal face"*). Its guard `asmGOff === null`
meant *no frame change under way* until the glide of the depth (§9.8 – §9.9) set that offset at every depth step: an edge with a step held the tilt
125 ms a step, the orbit going on in the world's frame (probed at the channel's mouth: the tilt 7 frames and 43 mm onto the top). **Built**: the guard
DELETED — a tilt under way already holds the gizmo (`tiltUnderWay`) and leaves only once whole (`tiltExits`); the gizmo SHOWN (its glide in it) kept.
**Probed**: the tilt on the frame after the crossing, the gizmo where it crossed.

**3. A void's MOUTH — the hand-over at its floor's edge** (option (b)). Seen from a side, the top's channel runs through (no floor): §8.3 bridged it on
the side's plane, so a dy climbed the mouth to the box's corner (487 mm over a 466 mm floor), then the tilt dropped it onto the floor. **The conflict**:
the gizmo is one point on both lines — the green bridges the mouth (§8.3), the red must end at the floor. **Built** (`stackDepthAt`'s `mouth`: closed
across, open up the facet to its end; `mouthHold`): a dy toward the open end HOLDS the gizmo where it last was — the floor's edge — and hands over: the
automatic tilt from there toward the face holding that pole (`tiltOn`'s cap from the mouth), or far out the cap's first place once the angles reach it
(the release glided straight from the held place); a dx lets it go onto the bridge (the green straight across). ⚠ Path-dependent, the map's first
exception since 2026-11-04 (the gizmo a function of the angles) — the owner's (b). **Probed**: close in the red climbs to 465 – 466 mm, held, tilted
there, then along the floor at 466 (no 487, no drop); far out held at 465, then 465 → 466 onto the floor over three frames.

**4. THE CALM CARRIED OVER A TOP / BOTTOM EDGE** (the tilt of the assembly). The calm's horizontal angle was a turn about the face's UP (`shownDir`);
a top / bottom edge turns the frame about the edge's own LINE (dx's axis, both frames' `h`), which that angle does not survive — so the horizontal share
was made whole toward the edge, and the yaw withheld through a dx was released in the last stretch (probed, 20° off square: the piece's heading
−83.6° → −70.4°, then the tilt's swing back to −90°). **Built** (`input/orbit_calm.ts`): a second reading, the angle TOWARD the edge's line
(`shownDirAcross` — a latitude toward `h`, a turn about `h` off `n`): a turn about `h` keeps it, so only the vertical share needs to be whole there.
The two readings blended by the place (`acrossWeight`: toward the `b` ends the new one, toward the ends across the old — a pure dx never changes the
vertical calm, the bounce; mid-face they differ by a fraction of a degree). Toward a top / bottom edge the vertical share alone whole (`asmCalmWholeV`);
a normal turned about `h` with the vertical share whole taken at once, the horizontal share kept (`turnedAboutH`); the slanted facet's forced
horizontal share at its `b` ends deleted. Over a cap of the world's frame (far out) the side's calm KEPT, released by a dx away from where it came over
(`capYawRelease`, whole at 45°) and by the pitch (`poleWeight`, 60° → 85°). The tilt carries the calm INTO F (the tilted facet's normal, the horizontal
share kept — set once `tiltOn` has settled the facet: ⛔ the provisional facet's normal first, eased across for 20 frames) and OUT of it over a `b` end
(`exitAcross`: the new side's normal, the share kept; across, both whole). ⭐ The camera's swing at the tilt from the heading SHOWN (`deltaShown`) — the
orbit's angles turned by their own (`D0`: the gizmo and the solver exact). **Probed** (20° off square, close in, top and bottom, −70° and −110°): the
heading −83.6° … −83.8° all the way to the edge (was → −70.4°), then the swing to square in 1 – 3 frames, one way.

**Not changed**: the camera's yaw offset turned about its own up (2026-10-28) leans the world's vertical by atan(sin 2.5° · tan(elevation)) — 2.5° at 45°,
4.3° at 60°; found while probing, kept (the owner: the tilt of the assembly is the calm's); to be measured once the calm's fix is on the device.
**Vectors**: `orbit_tilt.test.ts` (the share's lag, the two whole parts, the mouth's hand-over, the cap's release, the wiring), `void_bridge.test.ts`
(the mouth; `closedAlong`'s ends), `orbit_calm.test.ts`, `calm_slanted.test.ts`. **1732**.

### 9.11b THE SQUARE CAMERA CLOSE IN (2026-11-10, branch `1.0.120b-`, renamed `1.0.120b-Orthogonal-tilted-poles` — ⭐⭐⭐ THE WAY FORWARD, §9.12; deployed once as `58f63c5`) — ⛔ no device close

> The owner: *"do we need a calm when the automatic tilt is toggled on? … on orthogonal red-green sections, we already have a mechanism to cross the edges
> and the calm is not required, is it?"* → *"build the square camera close in branch 1.0.120b-. we will deploy this branch later on"*. (`1.0.120a-`, the
> heading squared by position, is §9.11 on its own branch.)

**Built** (`squareTurn`, `squareTurning`, `squareFrame`, `asmSquare`): with the automatic tilt on, the camera's direction is the gizmo's face's NORMAL — no
calm — over the calm by `q` (eased over 125 ms as the automatic latch turns on / off); every edge a frame change: the normal turned to the next face's at
the tilts' one speed (360°/s: a vertical edge's 90° in 0.25 s), the gizmo held meanwhile (`tiltClampStep`); a top / bottom edge the tilt (the camera
square already: no swing), the square camera carried into F and out of it as it is, then turned. ⭐ The roll back's target built exactly as the world's
camera after the exit (`calmHeading` on the orbit's world yaw) — ⛔ a vertical view's heading read off the tilted camera's own up: the target equal to it,
the roll 0 ms, then a 180° flip in one frame (walked, the square camera looking straight down at the tilted top).
**Walked** (the loops at 1.0 m): within a face 0.00° of look a frame (the camera pans square); each crossing a 90° turn over 0.25 s with ~1° of roll;
the far edge's roll back over 0.5 s. ⚠ The first finger event after a crossing still moves the gizmo once (the hold starts with the turn's target, one
frame later).
**Vectors**: `orbit_tilt.test.ts` (`squareTurn`, `squareTurning`, the wiring). **1734**.

### 9.12 ⭐⭐⭐ THE WAY FORWARD: `1.0.120b-Orthogonal-tilted-poles` (2026-11-10, the owner) — ⛔ no device close

> The owner: *"rename branch 1.0.120b- to 1.0.120b-Orthogonal-tilted-poles in remote and local. we will use this branch as the way forward."*

Of the three answers to the jolt at a tilt near a vertical edge (§9.11), the owner chose **the square camera close in** (§9.11b): with the automatic
tilt on (within 0.6 m of the gizmo, `tiltAutoM`), no calm — the camera square to the gizmo's face, every edge a frame change made at one speed with the
gizmo held: a top / bottom edge the tilt (no swing), a vertical edge a 90° turn in 0.25 s. Far out the calm as before (`1.0.119-Fixes`, §9.10).
The two others stay on their branches as the record: `1.0.120a-` (the heading squared by position, §9.11 on its branch) and `1.0.120c-` (no yaw
realignment, the camera's up carried, §9.11c on its branch — live as `b7dccd0` when this was decided; `main` not redeployed from this branch yet).
**Open, from the walks**: ~~the first finger event after a crossing still moves the gizmo once before the hold~~ (✅ fixed below); the far edge's roll back (180°,
0.5 s) unchanged — the owner has not said whether it is part of the shake felt. **1734** vectors.

**The hold through the crossing, fixed** (2026-11-10, the owner: *"Build that one alone"* — the step fix declined as a patch: the view follows the real
surface on purpose, D3 — over a channel A + dy goes in to the contact; placed from the face's plane the piece would stop 32 mm above a floor and run into a
proud part close in). ⭐ **The root**: the hold ended with the roll back's END, one frame before the EXIT — a finger event slipped in between, the orbit a
step ahead of the piece's solved angles through the frame change; they caught up during the square camera's turn: the gizmo moved one step while the
camera turned (walked: 22 mm on the turn's second frame at every heading). Now held until the exit itself (`tiltClampStep`: `finishing` / `off`), and the
turn's target set at the exit (`nW`). **Walked** (up the side, over the top and back down, 0.5 m, three headings): 0 mm through the turn at 165° and 195°;
at 180° 13 + 5 + 2 mm — `Piece42`'s 41 mm step glided (the real surface), as it should. ⚠ The first build set only the target — no change, walked; the
trace found the gap. **1734**.

### 9.13 ✅ THE EXIT ELSEWHERE ON THE EDGE — the roll's heading, the base along the shown direction, the gizmo drawn on the rig's lag (2026-11-11, `1.0.120b-Orthogonal-tilted-poles`) — ⛔ no device close

> The owner (after the stretch, `a37259b`, reverted: *"much worse"*): *"I see issue going down from horizontal to vertical at a different place of the same
> edge (probably because you accumulate a position gap on screen between the gizmo and the piece)"* → `ea4f179` (one base for the piece and the camera),
> then: *"it did not solve the issue: there is still a shake at crossing the edge at a different location (the shake is a roll of the piece back and forth
> while the piece is still on the horizontal face)"*, *"I don't like the way the gizmo moves (it jitters slightly) but I like the smooth movement of the
> piece and scene"*, *"avoid adding another lerp or spring"* → reverted to `8f86339` (`c6ef5f7`) and built there; then *"the piece movement makes it look
> like static (it is frozen in front of the camera) … I liked the behavior there"* (8f86339).

**1. THE ROLL** (the shake). Walked (in over the front edge at 0.5 m, along the tilted top by 0 / 4 / 8 finger steps, out over the same edge): on the frame
the tilt's roll back completes at the edge the camera rolled about the vertical by **0° / 4.1° / 18°**, and back the next frame — at `8f86339` and at
`ea4f179` alike. **Root**: the square camera looks STRAIGHT DOWN at the tilted top — no heading of its own; the roll back's target (`hW`, §9.11b) read its
heading through `calmHeading`, which for a vertical view falls back to the ORBIT's yaw — and over the tilted top that yaw follows the gizmo along it; the
world's camera the frame after reads the face it turns toward (its view already turning there). Two readings of one heading, equal only at the entry's
place. **Fix**: a view straight down / up reads its heading from the face the gizmo exits onto (`headingFrom`, `exitNormal` — the square turn's target, the
same normal `tiltOff` uses). Walked: the worst roll step **0°** on every exit.

**2. THE BASE ALONG THE SHOWN DIRECTION** (`ea4f179`, kept): the base the piece and the camera hang from (the gizmo's foot on the shell) was pushed off the
gizmo along the ORBIT's direction while the piece hangs along the SHOWN one (the square camera's, the calm's) — 45° apart at an edge, 21° after a dx on the
tilted top: the base slid off the gizmo's line (29 mm, ~1°). Now along the shown direction (`dirAt`).

**3. THE GIZMO DRAWN ON THE RIG'S LAG** (the jitter, no new ease): the gizmo was drawn at its exact place — a step of 22 mm on each finger event, then nothing —
against a piece and a scene on the rig's 45 ms ease. Now the ring AND its sections are drawn at the base's lag along the gizmo's face (`gizmoLag`: the
eased base minus its target, its part along the face's normal dropped — never off its surface; the sections' mesh translated by it, so the ring stays their
intersection). The exact place still drives everything (the orbit, the face map, the crossings, the holds). Walked: the drawn gizmo's jerk **0.20° → 0.01°**.

**4. THE LOOK POINT TRAILING THE PIECE** (`8f86339`'s, back): `ea4f179` aimed the camera at the piece's own base (`pieceLookPoint`) — the piece frozen on the
screen (0.014° a frame). The camera aims again at `st.asmLook` (the base eased again, `LOOK_TAU_MS` 120 ms): the piece leads the camera with the finger and
settles when it stops. Walked: the piece 0.18 – 0.24° a frame (0.22 – 0.26° at `8f86339`), the gizmo with it (its spread against the piece 0.8 – 0.9°,
1.9 – 2.9° at `8f86339`), the roll at every exit 0°. The left side (165°, 180°, 195°): unchanged (the square camera's timed turn at a vertical edge, by
design).
**Vectors**: `orbit_tilt.test.ts` — `headingFrom` (a vertical view's heading the same wherever along the top; the old reading 21° apart), `gizmoLag`,
`gizmoShownAt` with the lag, the wiring (the roll's target, the lag, the trailing aim); `orbit_shell.test.ts`, `edge_surface.test.ts` (the base along the
shown direction). The walk probe records the drawn gizmo (`gd`). **1738**.

### 9.14 ✅ POLAR ORBIT: A CAP READS THE CALM OF THE SIDE IT WOULD BE LEFT BY — the yaw at an exit (2026-11-11, `1.0.121-`) — ⛔ no device close

> The owner: *"in polar orbit at far distance, if you enter the face holding the pole with dy, then orbit the gizmo with dx and then exit the face holding the
> pole (be it towards the same initial face or another face), the camera rolls the moment the gizmo crosses the edge at exit"*, *"this is a jump of the yaw
> orbit of the camera"* → a first fix (`432631d`: the dx's release carried over the edge) → *"there is still a yaw at exit when I enter the face holding the
> pole from one face and exit from the opposite face"*, *"the camera yaw exist when the yaw angle of the camera vs. vertical face is not the same at exit vs.
> entrance (the vertical face can be the same or another vertical face, it does not matter …)"*, *"analyze the similarities with the camera roll issue we
> fixed on tilted-pole-orbit … If the fix you have built in commit 432631d is a patch which is not addressing the issue, remove it and build a proper fix"*.

**Walked at `432631d`** (far out; in over a side, a turn of 21° / 100° / 180° / 200° at the pole, out; the top and the bottom; random dy / dx — 14 walks):
at an exit the calm's offset (the shown heading against the orbit's yaw) jumped **0° → 9 – 14°**, the camera turning up to **2.74°** on frames with no
finger event. `432631d` did not address it — it carried only the dx's release.
**Root — the tilted pole's roll at an exit (§9.13) in the world's frame: one heading read two ways, equal only where the gizmo came in.** Over a cap the
calm KEPT the entry side's (its normal and share — released by a dx, `capYawRelease`, carried over the edge, `capReleaseCarried`); after the exit it read
the exit side at the gizmo's place. The same yaw against the same kind of face at entry and exit: equal; any other: the calm changed reading at the
crossing, the rig's lag turned the camera there.
**Fix**: over a cap the calm reads **the side the red leaves it by at the orbit's yaw** (`capEdgePitch`: the last side place below the cap at that yaw —
its facet, its horizontal share and reading there; the vertical share whole). The cap's reading and the side's after the exit are ONE at the edge,
whatever the entry; at a slice's end the side's calm is whole (no calm), so a dx over the cap crossing into another side's slice changes nothing either.
⭐ Any cap (level or slanted — every band but SIDE) and any side facet it borders (a column's end facet, vertical or slanted) by construction; `Scene_1`'s
assembly has only level and vertical faces, so a slanted one was not walked. `capYawRelease`, `capReleaseCarried` and their state deleted; the
automatic tilt's camera wait (§9.15) untouched.
**Walked after** (the same 14 walks): the calm's offset continuous through every exit (largest step **0.4°**); the camera's largest turn with no finger at
an exit **0.44°** (2.74° before); the entries unchanged; turns over 1° with no finger over the walks 156 → 97.
**Vectors**: `orbit_tilt.test.ts` — `capEdgePitch` (top and bottom, at five yaws), the side read at the edge the red's own, the wiring.

### 9.15 ✅ THE AUTOMATIC TILT: THE SECTIONS AT ONCE, THE CAMERA PENDING THROUGH THE APPROACH, THEN BLENDED BY THE ORBIT'S FINGER (2026-11-11, `1.0.121-`) — ⛔ no device close

> The owner: *"during the approach, if the gizmo is on a vertical face, the rotation of the camera to arrive square on … is very smooth and blends with the
> approach. On the contrary, if the gizmo is on a face holding the pole … there is an immediate alignment of the camera so the red and green sections are
> aligned with world axis: this does not blend with the approach"* → a first build (the tilt itself pending, a 30 mm blend), reverted → *"the red-green
> sections automatically switches to orthogonal when the automatic tilted pole is toggled on but the camera view waits through the approach … I am ok if
> the orthogonal red-green sections are temporarily not aligned with world axis until the camera alignment resolves … then the camera view resolves with
> the mm when the close in orbit starts (set a faster alignment per mm …) or it completely resolves when the first edge is crossed (otherwise, it may carry
> over a tilted view on another face)"*.

**Before**: as the approach crossed `tiltAutoM` (0.6 m) on a face holding a pole the tilt was made and the camera swung to the snapped heading
(`snapHeading`, 360°/s) and squared (125 ms) at once — by time, the approach still running.
**Built**:
1. **THE TILT AT ONCE**: made as the automatic tilt switches on — the map in F, the sections orthogonal, the gizmo on them (its relocation by time).
2. **THE CAMERA PENDING** (`tiltPendingStep`): until the orbit's first millimetre of finger the camera keeps its orientation — the tilt's swing (`swingE`)
   and the square camera's share held, on every face. A press within the distance leaves it to the automatic tilt.
3. **THE BLEND BY THE FINGER** (`asmBlend`, `blendShare` — a smoothstep over `tiltBlendMm`, **10 mm**, ☰ → CAMERA → CAMERA ORBIT AROUND CENTER; the finger
   counted at the orbit's input, the approach's excluded): the square share and the swing; the gizmo moving from the first millimetre (a swing pending
   or paced by the finger never holds it).
4. **WHOLE AT THE FIRST EDGE CROSSED** (`blendCrossed`: another tilt, the roll back under way, the square camera's target another face): the rest at the
   tilts' one speed, the gizmo held as at every crossing — never a part-way view carried onto another face.
**Walked** (the gizmo on the top square and 21° off square, on a side; the approach 1.0 → 0.5 m, a rest, then dx or dy): the camera's turn **0°** a frame
through the approach and the rest (the tilt made, the sections orthogonal); then up to **2.5°** a frame over the first 10 mm.
**Vectors**: `orbit_tilt.test.ts` — `tiltPendingStep`, `blendShare` (10 mm), `blendCrossed`, the wiring. The walk probe records `pd` / `bl` / `sw`. **1744**.

### 9.16 ⭐⭐⭐ THE BEST IMPLEMENTATION OF THE ORBIT SO FAR: `12dc4b6` (2026-11-12, the owner) — and the open points closed with nothing built

> The owner, on the open points read back to them: *"Far edge ok"*, *"Camera lean ok"*, *"Slide under tilted pole ok"*, *"Older item: not applicable any
> longer. Close"*, *"Update the md to record the current commit is the best implementation of the orbit so far"*.

* ⭐⭐⭐ **`12dc4b6` IS THE BEST IMPLEMENTATION OF THE ORBIT SO FAR** — the tip of `1.0.121-two-types-of-orbits-finalized` (= `main`; its code `eae0541`):
  the square camera close in (§9.11b – §9.13, `1.0.120b-Orthogonal-tilted-poles`), the polar orbit far out with a cap reading the calm of the side it
  would be left by (§9.14), the automatic tilt's camera pending then blended by the finger (§9.15). **1744** vectors. It supersedes `1.0.117-Tilted-polar-orbit`
  (`6c6da30`) as the reference to come back to; work goes on from it on `1.0.124from1.0.121-` (`1.0.122-`, the slide's removal, not used).
* ✅ **Closed — ok as built, nothing to do**: the far edge's roll back (180° in 0.5 s, §9.12); the camera's lean (its yaw offset leaning the world's vertical
  by 2.5 – 4.3°, §9.10 *Not changed*); the slide under the tilted pole (a slide ending off the tilted facet, §9.5 *Not done*).
* ✅ **Closed — not applicable any longer**: I17 (a narrow face held by a finger far out, §8.2) and the input-driven gizmo on world-plane cuts (§8.5).
* ⚠ Recorded as the owner gave them: they close these open points; a device close of §9.11b – §9.15 as a whole is not stated.
