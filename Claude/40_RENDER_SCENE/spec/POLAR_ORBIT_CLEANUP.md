# THE POLAR ORBIT'S CLEAN-UP — the issues found after `1.0.100-`, applied to its build (branch `1.0.108from1.0.100-`, now `1.0.109-`)

> The owner (2026-11-08, on `1.0.107-`'s reverse band): *"I don't like this implementation. Revert to the built as it was in branch
> 1.0.100-Polar-gizmo-over-void, and create a new branch 1.0.108from1.0.100- … capture the issues we have discovered in the later commits which are
> applicable to 1.0.100- built (any jitter, approach issue, etc. which we did not detect when we debugged 1.0.100-). Propose the fixes for the issues so
> we clean the polar orbit."*

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

**Order proposed**: F2 (a port, measured before; removes I2, half of I6) → F1 (I1, half of I6) → F3 + F4 (the slide) → F6 (I8) → F8 (I10) → F7a → F7b
(after F1) → the §18 matrix (`§18-C6`) and the walks with approaches re-run, each against §18's *after* column. Each fix with its vectors, RED on
`3c00d35`. ⭐ The sketchbook (plates, the hexagon, the corner, the step): https://claude.ai/artifact/UPGYPC5vfQpsK7DpKBxxnQ.

⚠ **Since 2026-11-08 `Scene_1` is a CUBE** (`SCENE_1.md` §12, `1.0.109-`): every measurement above was taken on the PAINTING (0.33 deep). Re-measure
I1 – I10 on the cube before building a fix against them (the faces contour, the steps, Piece44 / Piece45 all moved or changed).
