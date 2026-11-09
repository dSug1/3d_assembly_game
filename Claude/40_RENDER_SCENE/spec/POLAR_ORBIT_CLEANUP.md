# THE POLAR ORBIT'S CLEAN-UP — the issues found after `1.0.100-`, applied to its build (branch `1.0.108from1.0.100-`, now `1.0.110-`)

> The owner (2026-11-08, on `1.0.107-`'s reverse band): *"I don't like this implementation. Revert to the built as it was in branch
> 1.0.100-Polar-gizmo-over-void, and create a new branch 1.0.108from1.0.100- … capture the issues we have discovered in the later commits which are
> applicable to 1.0.100- built (any jitter, approach issue, etc. which we did not detect when we debugged 1.0.100-). Propose the fixes for the issues so
> we clean the polar orbit."*

## 0. ⭐⭐⭐ START HERE — a new conversation fixing I1 – I14

* ⭐⭐⭐ **THE OWNER (2026-11-09): `1.0.111-Polar-orbit-fixes` IS THE BEST PIECE ORBIT BUILT SO FAR IN THE PIPELINE** (live as `eef4be0`) — the reference to come back to; work goes on from it on `1.0.112-`.
* ⭐⭐⭐ **2026-11-09 — CONTINUE FROM §8** (branch `1.0.114from1.0.112-`; `1.0.113-` renamed `1.0.113-not-used`: its step walk F8 made the notches'
  sections intricate — the owner went back to `1.0.112-`): F7b ported (the calm on slanted facets), the lines refined (I17's drawing), a closed void with a
  floor keeps its depth (the owner's amendment); open: I17's reach by a finger far out, and the input-driven design on world-plane cuts (proposed, §8.5).
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
  walks' map reversals at the notch are a probe finding the device does not show; the notch stays as built (neither bridged nor followed).
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

### I17 — a narrow face cannot be held under the gizmo by a finger far out (the quads never show it)

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

### 8.5 Proposed, NOT built — the input-driven gizmo on world-plane cuts (a Fable simulation, 2026-11-09)

The owner asked for a logic keeping both lines world planes while the gizmo reaches every face, steps allowed. Proposed: the finger moves the gizmo BY
DISTANCE along the TRUE outline of the parts cut by two world planes (the facet's frame choosing them), the camera from the big facet plus ≤ 20° of tilt;
simulated on the cube's 240 faces: 0 mm off the planes, 100 % of the exposed area reached (the map today ~80 %), no jump. ⚠ It is §28.4 of
`TILTED_ORBIT_REBUILD_SCOPE.md` (branch `1.0.107-Close-in-atlas`) — proposed 2026-11-06, not adopted. It removes §31.4's bijection (no second surface to
map onto) but reopens the cap exits (C1 a hold, B / A rolls — the owner's *"no roll"*), several-loop cuts and path dependence (0.7 mm median on the cube,
75 – 100 mm on synthetic shapes). Recommended: not now — an offline test of the cap exits and the loops first.

### 8.6 Vectors

`tests/calm_slanted.test.ts` (6, F7b, RED on `f82bfbe`); `tests/line_refine.test.ts` (6, all RED on `b073178`); `tests/void_bridge.test.ts` and
`tests/void_rims_fit.test.ts` rewritten to the amended rule (7 RED on `b073178`; the two *no floor → bridged* cases pass on both — the rule kept);
`face_map.test.ts`'s wiring strings. **1696**.
