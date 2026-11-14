# PART AUTHORING — what a part must carry for the game's rules, in ANY scene

> **STATUS** · ⛔ **PROPOSED 2026-11-12, NOT APPROVED, NOTHING BUILT** · **OWNS** · the conventions every assembly part follows — where it is authored,
> and what it carries besides its look — stage W2 / W3 of the scene workflow
> **READ IF** · you are deriving a scene's geometry from its assembly plan, or modelling, importing or checking a part
> **LAST VERIFIED** · 2026-11-12 (branch `1.0.124from1.0.121-Added_scene_2`)

⭐ The process this serves: [`../../20_GAME_RULES/spec/SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) — the ASSEMBLY PLAN (W1) comes first,
and everything here is DERIVED from its steps: a seat, a gizmo route, an insertion of the plan is what makes a part carry a face, a connector or a
collision piece. ⛔ Nothing here is authored for a step the plan does not have.

## 1. ⭐⭐ Why a part needs more than its look — the game's rules as built

| the game's rule today | what a realistic mesh alone does to it |
|---|---|
| **the gizmo runs on the placed parts' FACETS** — faces clustered within 20°, a facet kept only while its real face covers a quarter of its polygon, built from the EXPOSED faces (`input/face_map.ts`; `40_RENDER_SCENE/spec/POLAR_ORBIT_CLEANUP.md`) | any ROUND part (a cylinder, a bore, a disc's rim, a torus) is dozens of thin side faces: no facet survives, or the gizmo jumps from sliver to sliver |
| **every body collides as ONE convex hull** made at spawn (`COLLISION.md` §2, §8) | the hull fills every hole, slot and notch: nothing is ever INSERTED. ⭐ The answer is specified, not built: `UCX_` pieces (`BLENDER_COLLISION_AUTHORING.md`, `3D8`) |
| **the solver's budget: 24 gap queries a frame** (the owner tests on an iPhone) | many small parts of many collision pieces overrun it: the parts must be FEW and their pieces SIMPLE |
| **a mate is ANTI-PARALLEL** (`../INDEX.md` rule 1) — the seat's two normals face each other | a seat on a curved surface has no single normal: it needs a FLAT stand-in |

## 2. ⭐ Where a scene's parts are authored

| | data in TypeScript (`src/content/<scene>.ts`) | Blender (`.blend` → `.glb`) |
|---|---|---|
| **fits** | boxes, prisms, frusta — what `render/bodies.ts` builds (`Scene_1`'s table, `Scene_0`'s heptagon) | anything else: tori, bent bars, extrusions, rounded or glass parts |
| **the owner** | reads the numbers | SEES and EDITS the part |
| **the proxies (§3)** | none needed while every face is flat and every body convex | authored beside the mesh |
| **needs** | nothing new | the `.glb` loader (`3D4`, ⛔ not built) and the check script (§4) |

⭐ A Blender scene is made by a RE-RUNNABLE script (`Assets/Blender/scripts/build_<scene>.py`, as `build_painting.py` — `BLENDER_ASSETS.md` §2),
ported from the scene's reference when it has one; the `.blend` is the source the owner edits; the game loads a `.glb` exported from it
(`MATERIALS_AND_IMPORT.md`).

## 3. ⭐⭐ What each PART carries (the proposed conventions)

1. **The render mesh** — the look; what a finger taps (`D50`). ⭐ **Kept LIGHT** (the owner, 2026-11-13: *"make the exhaust less vertex-intensive. They
   will slow down the rendering"*): a small round piece about 14 sides (above 12: auto smooth below), a bent pipe a few steps a segment — the phone draws every part at once.
   ⭐ **Drawn properly** (the owner: *"regola d'arte"*): a round piece with an end (a capped pipe, a dome) is ONE revolved profile sharing its rings —
   never a primitive pushed into another; pieces that meet at an angle (a stub into a collector) are SEPARATE objects, a pipe leaving a face square to it; EVERY visible part AUTO
   SMOOTH at Blender's 30° — so a round piece has MORE than 12 sides (14: still light), else it stays faceted (the owner's toggle must work).
   ⭐ A piece with NO real edge (a torus: a ring, a grommet) is smooth ALL over — then 6 – 8 round its tube read round; a hidden piece (a valve's
   head in its bore) is as light as the rest — one profile, never two primitives pushed together.
   ⭐ A bent bar: its rings square to the curve's EXACT tangent (never the average of two segments — it tilts them in an S), and a SUPPORT ring
   just before and after each bend on the straights (the owner's: 0.004) — the turn crisp.
   ⭐ A glass part's OUTER edges bevelled, before its cuts (the inside sharp) — but NOT a seat face's edges (the owner: *"no need for bevel at the
   edges of the banks which snap with the surface of the upper case"*): a part flush on its host shows no groove along the joint.
   ⭐ A flat face with HOLES (a bore through a deck): a face cannot hold a hole, so the part is split by straight planes through every hole's
   centre and every other edge inside a flat face dissolved — no arbitrary BRIDGE edges (the owner: *"what are these edges for ? clean the geometry"*).
1bis. ⭐⭐ **METADATA is its OWN object** (the owner, 2026-11-13: *"make it separate objects so we can hide them in the game later on"* · *"metadata
   in the scene shall be separate objects so they can be hidden during the game"*): anything that MARKS rather than builds — a label, a number,
   a sign (`Scene_2`'s crown names A1 … B3) — is a separate mesh, child of its part, custom property `metadata = true` (a glTF `extra`); never merged
   into a part's mesh; no collision piece, no face proxy. The game may hide it (a setting, a level's choice) without touching the part.
2. **`UCX_<part>_NN` — the collision pieces**: a few convex pieces, only where the plan inserts or rests (a bore as a ring of pieces, or squared),
   as `BLENDER_COLLISION_AUTHORING.md` specifies. Absent: the hull at spawn.
   ⭐ **SIMPLE SHAPES, never a hull of a detailed mesh** (the owner, 2026-11-13: *"the UCX_E16_00 of the exhaust connectors is very bad geometry …
   make a series of cylinders appended together"* · *"same for E13_valve_A1_1_cap"*): a bent pipe is a CHAIN of short cylinders along its path
   (each joint overlapped by half the radius, so no gap opens at a bend; the first starting ON its seat, never into the host below); a valve is
   two cylinders, its cap and its stem — 8 – 12 sides, circumscribed. ⛔ The convex hull of a flange and every vertex of a bent tube, or of a cap's
   rims and a stem's ring, made cones of slivers (60 – hundreds of triangles a piece) the solver pays for every frame.
3. ⭐ **The face proxy — NEW, not yet specified**: ⭐ (2026-11-14) it also gives a picked part its RESTING-FACE QUADS (`20_GAME_RULES/spec/PICK_AND_PLACE.md`
   §5 — the quad nearest the part's orientation as it lay is its start); ⚠ TO TROUBLESHOOT PROPERLY: a part with MANY proxy faces would get too many
   candidates (which faces count as a quad, merged how). A hidden flat-faced stand-in where the plan's SEATS and GIZMO ROUTES are (a bore as a 6- or 8-sided
   prism, a round seat as one flat disc face) — what the face map builds its facets from, so the gizmo RUNS on it and a part RESTS on it. ⚠ Its name
   (e.g. `UFM_<part>`) and its rules (convex or not, which faces count, how it meets the render mesh, what replaces it at the face map) are written
   here before it is built.
   ⭐⭐ **GHOST faces** (the owner, 2026-11-12: *"a ghost surface to support the gizmo for A + dy"*): a proxy face where there is NO real surface —
   across an opening a part goes into (a bore, a socket, a slot), at the depth where that part stops at its goal. The approach (A + dy) moves the
   held part straight along the gizmo's face normal TOWARD the gizmo and stops at it (`render/assembly_wiring.ts`, `placeOffset`; D3: *"center of the
   orbit = gizmo"*); over an opening the part fits, the gizmo reads the real depth (`POLAR_ORBIT_CLEANUP.md` §7, §8.3) — so the ghost face IS that
   depth: the gizmo drops onto it, A + dy brings the part down to it, the goal capture seats it. Never drawn, never collided, never picked; one per
   opening, each at its own part's depth.
   ⭐⭐⭐ **THE PRINCIPLE** (the owner, 2026-11-13: *"surfaces which support gizmo shall be as close to the real surfaces as possible while
   simplifying their geometries. Sanity check shall be done so there are no false gaps, discontinuities between faces, faces floating in the air,
   small unreachable faces"*): a face proxy is the part's REAL OUTER SURFACE, SIMPLIFIED — flat where the real surface is nearly flat, covering
   every real face the gizmo may run on, nothing where the real surface has nothing (a ghost floor aside: it bridges an opening on purpose, its
   edges on real surfaces). ✅ ADOPTED (the owner, 2026-11-13: *"update the md files accordingly, then proceed"*) — the PROXY SANITY CHECK, every run, each failure named (§4.2), a VIRTUAL face (a resting proxy, a ghost) exempt from ① and ② (it is off the real surface by design):
   ① **fidelity** — points sampled over every proxy face within 0.005 (≈ 0.7 mm at 0.14 m a unit) of its part's real mesh (a proxy floating,
   inside the glass, standing off); ② **coverage** — points sampled over the part's real OUTER faces (outward, seen) within 0.005 of a proxy face
   (a false GAP: `Scene_2`'s strip along the upper case's top); ③ **continuity** — every proxy edge meets another proxy face (shared or touching)
   or lies on a real boundary (a fold, an opening's rim); another proxy face NEARLY touching it (0.005 – 0.05) is a CRACK the gizmo falls into;
   ④ **no floating islands** — touching proxy faces grouped: an island touching no other and not a whole face of its part is a stray patch;
   ⑤ **reachability** — faces too small or narrow to stand on (≈ 7 mm), faces the gizmo cannot reach (facing a part at the goal); ⑥ **simplicity**
   — coplanar touching proxy faces merged unless a deliberate cut crosses them (the cuts through holes), each part's face count against a budget.
   ⭐ **As built** (`Scene_2`, 2026-11-13): ① sampled INSIDE each face's triangles (a notched strip is concave — its centroid can fall in a bore);
   ② over the part's OUTER SHELL only (faces within 0.006 of its convex hull — a bore's wall, an open cavity, a ring are no route); ③ a crack is
   two proxies 0.01 – 0.05 apart IN ONE PLANE over real material of THEIR two parts lying IN that plane (under 0.01: two polygons' tessellation
   at a round rim; off the plane: a real STEP — a disc on its ring — reported as information, climbed not fallen into; over an opening, or another
   part passing through it, the proxy is right to stop). ⭐ Its first runs found, on `Scene_2`: the upper case's top stopping short of its edges
   (a strip open), and the decks', feet's and slopes' bore openings SQUARE round ROUND bores (glass left out, cracks round the discs) — now ROUND
   (strips cut through each bore's centre, an arc on each side).
   ⛔⛔ **THE MISTAKES MET — not to repeat** (the owner, 2026-11-13: *"Capture both in the workflow md so we do not repeat those mistakes later on"*,
   *"Update the md files accordingly … so we do not repeat the same later on"*, *"capture in the md file if correction is required in the check"*):
   ⓐ **a proxy from the COLLISION's extents** — inside the walls: the upper case's top stopped short of its edges, first across (z), then, fixed
   on one axis only, along (x): ⛔ a proxy's extents are the part's OUTER ones, on EVERY axis; ⓑ **a ghost OVER a real face** (a slope's ghost
   covering its strips): the face map counts the overlap twice — ⛔ a ghost fills ONLY the opening it bridges, edge to edge with the real rim
   (the check ⑦ *ghost overlap*); ⓒ **a SEAT face forgotten** (the bulkhead tops, the slopes' bottoms on the split): ⛔ every real outer face,
   seats included, has its proxy — coverage reads the OUTER SHELL (within 0.006 of the part's convex hull AND facing as the hull does there: an
   inner wall just under the rim is near the hull, not on it), sampled INSIDE each triangle (a big face's corners touch other proxies); ⓓ **a
   proxy facing the WRONG WAY** (the rim's strips up or down by the order of their corners): the face map reads normals — ⛔ the ORIENTATION
   pass turns every real proxy face OUT of its part and every ghost TOWARD its part's arrival, and ⛔ every pass that CHANGES the file runs
   BEFORE its save (the orientation ran after it once: its turns lost, the review showed the old faces); ⓔ **a review that hides the parts**: a
   small real proxy (the crank's nose) looked floating — ⛔ the review shows each placed part's mesh, faint, behind its faces; the check names
   every small proxy standing ALONE for a person to confirm; ⓕ **a ghost's drop taken for a gap**: a ghost floor meets its rim through a real
   WALL (the tub's inside) — ⛔ SUPERSEDED: a ghost now lies flush at the mouth (item 3's PLUNGE), a dive is an error (⑩ ghost flush);
   ⓖ **islands joined only by shared corners**: strips meeting in a T (a bulkhead's top on a rim) counted apart — ⛔ faces TOUCHING (a corner
   on another's edge) are one island.
   ⭐⭐ **THE CHECKS PROVEN — their CONTROLS** (the owner, 2026-11-13: *"update the md files to make the checks work better. Then do a full rebuild …
   so we can check if our workflow and check are working properly"*): `CHECK_CONTROLS=1` builds the scene with ONE DEFECT PLANTED PER MISTAKE MET —
   the top 2 % short along x (→ coverage), a ghost over a real face (→ ghost overlap), the bulkheads' tops deleted (→ coverage), a face turned
   AFTER the orientation pass (→ the orientation VERIFIED), a patch in the air (→ fidelity, alone), a deck strip's edge pulled back 0.02 in its
   plane (→ continuity); then a proxy face doubled (→ superposed), a ghost recessed down a bore (→ ghost flush), the export without +Y up (→ the
   axes), a dense hull as a collision piece (→ collision simplicity), a crown's sharp edges cleared (→ flat caps; since the crowns in quads, 2026-11-14, → CROWNS IN QUADS: caught at 11.9°, flat caps blind to it) — 11 in all — ⛔ each must be CAUGHT, and the normal build clean; then the build is run again WITHOUT it (that file is broken by
   design). ⭐ The controls found the checks' own blind spots, now corrected: ⓗ a test at a face's CENTRE is blind on a notched (concave) face —
   its centre can fall in the hole: every inside / outside test at a point INSIDE one of its triangles (the orientation pass had the same blind
   spot); ⓘ continuity compared an edge with OTHER proxy objects only — a crack between two strips of ONE proxy was invisible: every proxy face
   but the edge's own; ⓙ a crack is a gap ACROSS an edge between faces facing the SAME way, the edge touching nothing at its middle — not a
   neighbour ALONG the edge (the line carrying on after a cut), not a face at a corner, not a SEAT's other face (the same plane, facing back),
   not past a T-junction (an edge lying on another face's edge is connected). ⛔ A check never seen failing is not trusted (`CLAUDE.md` rule 2's
   spirit); a planted defect it misses is a defect in the CHECK.
   ⭐⭐ **SUPERPOSED FACES** (the owner, 2026-11-13: *"you have a lot of superposed faces. check for example step 3. this is not caught by your
   checks"*): ⑨ a face lying ON another (the same plane, its inside covered) — SAME-facing = a DUPLICATE (⛔ an error: z-fighting, two faces for
   one route), OPPOSITE-facing = a SEAT (two parts pressed together: the covered face unreachable once seated — listed; the game skips it; the
   review draws it GREY, set back 3 mm, never flickering). Checked on the proxies and on the meshes (duplicates only); its control a proxy face
   doubled. ⓚ ⛔ **`BVHTree.FromPolygons` FANS an n-gon from its first corner**: a CONCAVE face (a notched end, a holed strip) gets triangles
   OUTSIDE its outline — phantom surface over the notch (34 false "duplicates", the real ones hidden among them): every tree of faces built from
   the faces' OWN triangulation (`tri_bvh`: `tessellate_polygon`, its index mapped back to the polygon). ⓛ a test point is taken WELL INSIDE a
   face (its centre when inside, else its largest triangle's centroid): a fan's first triangle sits at a disc's RIM — the pulley's inner face was
   tested in its chamfer and left facing INTO the pulley; an inside test votes over THREE rays (one grazing a seam counts it twice). ⓜ a sample
   by a face's own outline finds its coplanar NEIGHBOUR (thin support-ring strips, a number's glyphs): such samples are skipped.
   The owner's visual review (§4.3 item 3) stays the human pass; W6's headless walk the measure.
   ⭐⭐ **A ghost floor is CONNECTED to real surfaces** (the owner, 2026-11-13: *"ghost floors shall be connected to real surfaces (not single
   small surfaces floating in the air)"*): it spans the opening or cavity it serves out to its host's real faces — `Scene_2`'s valve sets' ghost
   is its three bores' mouths, never a small patch the gizmo must find; the build checks it (each corner within 0.005 of its host's meshes) and
   names every floating one.
   ⭐ **A ghost face serves ONE part** (`for_part` on it): two parts may go into the same opening at different depths (`Scene_2`: a bore's piston,
   then its valve set) — the game reads a ghost only while ITS part is held, else the gizmo stops at the wrong one. The check script names each.
   ⭐⭐ **A PART GOING INTO A HOLE OR A RECESS — the ghost AT THE MOUTH, then the PLUNGE** (the owner, 2026-11-13: *"the ghost face shall be aligned with the outer face … Then, we will create a special snap to plunge the pistons inside the cylinder hold … In such case, the ghost face shall always be a face aligned with the assembly face where the hole exits"*):
   the part carries a **resting proxy** — one flat face SQUARE to its approach axis, CENTRED on it, at its hull's extreme along the approach; its host
   carries the **ghost floor** IN THE PLANE WHERE THE HOLE EXITS — flush with the host's outer face, filling the opening exactly (the same outline
   as the hole the outer proxy leaves: a bore's 24-gon, a tub's rooms and notches). The part rests on it at the mouth; a **PLUNGE snap** (⛔ to
   build — `00_CORE/QUEUE.md`) carries it down the hole onto its seat. The ghost says how: `plunge_axis` (into the hole), `plunge` (the depth from
   the mouth to the seat), `plunge_to` (the host's seat marker, item 4). ⛔ SUPERSEDED: a ghost at the goal's DEPTH (in the bore, in the tub) —
   the pistons' floated 0.6 – 0.8 off their bank, the valve sets' and the crank's lay recessed. A bore and an open CAVITY alike (`Scene_2`: the
   crank into the tub, the pistons and the valve sets into the bores). The build checks it: ⑩ **ghost flush** (each ghost's edge ON the route
   round it — a recessed ghost is an error) and prints every plunge.
   ⛔ A face proxy is the part's OUTER surface — never reuse its collision pieces' extents (inside the walls: `Scene_2`'s upper case top stopped
   short of its edges, a strip open between the top and its slopes).
   ⭐ A proxy face keeps the face map's thresholds (`../../20_GAME_RULES/spec/SCENE_WORKFLOW.md` §4: ≥ 15° from 45° of elevation; ≥ 30° between faces
   to be told apart), and an opening in a proxy face follows the REAL opening (a round bore round — 2026-11-13: the squares left real glass out;
   ⚠ the face map's reading of a round rim to be measured at W6).
3bis. ⭐⭐ **A piece that APPEARS WHEN THE PART IS SEATED** (the owner, 2026-11-13, `Scene_2`'s rod caps: *"create the counter closure of the rod
   connections … make the counter closure appear in the game when the piston-rod is seated in its position"*): a part whose way in needs an
   opening (a big end that must pass over its pin) carries the piece that closes it as its OWN object, a child of what it moves with (the rod: it
   turns with it), the custom property **`appears_when_seated: true`** and NO collision piece of its own. ⭐ The game (requirement): hidden while
   the part is held and approached; SHOWN the frame the part seats (the goal capture, `D183`), with a short pop-in; from then on it moves with
   its parent (the level-end animation) — and its collision, if one is ever authored for it (`UCX_<piece>`), enabled only then. The check script:
   the way in is swept WITHOUT it, the motion (§4.2) WITH it.
4. **The seating points** — an empty per seat of the plan, `MC_<part>_<seat>`, at a position on the seat face with its OUTWARD normal (the
   empty's single arrow, its local Z) and a twist reference (its local X), named after the plan's step. ⭐ **REDEFINED** (the owner, 2026-11-13:
   *"the mate connector was designed for translation of parts which no longer exists (it was replaced by our orbit and approach)"*): it is a SEAT
   MARKER, not `core/mate_connector.ts`'s capture — the game seats a part by the orbit, A + dy and the goal capture (`D183`, the goal = the authored
   pose). Read by the check script (each pair ANTI-PARALLEL and coincident at the goal) and later by the level data (the step's approach axis = the
   host's marker normal, its orbit centre). ⚠ `core/mate_connector.ts` is left as it is until the game reads the markers (W5).
   ⭐ **An INSERTION into a hole / recess** (the owner, 2026-11-13): the part's seat marker lies DOWN the hole; the host's ghost at the mouth names
   it (`plunge_to`), with the plunge's axis and depth (item 3) — ⛔ the game's PLUNGE snap is to build (`00_CORE/QUEUE.md`): from the mouth, the
   part carried along the hole's axis onto that marker — the successor of the mate connector's translation, for holes only.
5. **The goal is the authored pose** — a scene is authored ASSEMBLED, so each part's goal is where it sits; where it BOOTS is level data (as
   `Scene_1`'s `BOOT_MOVES`).
6. **Units and axes** — the scene's `unitM`; +Y up at the export (`BLENDER_ASSETS.md` §3).

## 4. ⭐⭐ The Blender build, STEP BY STEP, and its checks (W3 — the procedure for every scene)

> *"make sure you script in blender step by step so I can have a look and review what is built in blender step by step (not the full scene and then
> I test at the end and nothing works and we don't know where to start the debugging from)"* · *"capture your checks in the tiered md files so it
> becomes part of the procedure to create an assembly in blender"* — the owner, 2026-11-13 (first applied: `Scene_2`, `build_engine.py`)

### 4.1 The loop — one step at a time, the owner's look between steps

1. **One script, one argument**: `blender -b --python Assets/Blender/scripts/build_<scene>.py -- --step N` rebuilds the `.blend` FROM SCRATCH
   (factory-empty file, `save_version = 0`) up to the plan's step N — the steps in the PLAN's order, one part (or one kind's parts) a step; the last
   step the `.glb` export.
2. **Every run**: saves the `.blend`, renders `previews/step_NN.png` (a `PREVIEW` collection — floor, light, camera — never exported) and prints the
   REPORT (§4.2). ⭐ **A REVISION for the owner's look** (2026-11-14 — the owner: *"creating a revision2 file (do not overwrite the file) … I shall
   authorize an export then only if I am satisfied"*): `-- --step N --rev 2` writes `<scene>_revision2.blend` and `previews/revision2/` instead,
   leaves `animation_golden.json` untouched and REFUSES step 10 (the export waits for the owner's go); once approved, the normal run (`--step
   <last>`) rebuilds the file and exports, and the revision is deleted.
3. ⛔ **Claude stops after each step**: reads the report and the render, then hands the owner what to look at in Blender for THAT step. The next step
   starts on the owner's word. A failing check is fixed at its step, never carried forward.
4. ⛔ **The `.blend` is the script's output**: the owner looks, closes WITHOUT saving; a change goes into the script (an edit by hand is lost at the
   next run). ⭐ **The owner's edits as a REQUEST** (the owner, 2026-11-13: *"can I modify the blender file and save it so I can show you what I
   want ? … you can compare my blender file with your script and update your script"*): the owner edits and SAVES AS `<scene>_owner.blend` (never
   overwritten); Claude reads both headless, diffs them object by object (transforms, vertex bounds in the reference's units, objects added or
   deleted), states the intent it reads for the owner's confirmation, writes it into the script as a RULE where it is one (*"flush with"*), rebuilds
   and re-runs the checks. ⭐ When the owner wants to model by hand, that part leaves the script — decided per part, written in the scene's spec.
5. ⭐⭐ **THE FINISH PASS, every visible object once built** (the owner, 2026-11-13: *"once the object is built, clean the geometry (remove
   duplicate vertices, reduce the number of vertices where possible in particular hidden faces and hidden objects or hidden object parts, etc.),
   apply shade auto smooth. do that for all the objects"*) — in the build script, after the steps, before the checks: ① the HIDDEN faces deleted:
   an opaque piece's faces wholly inside another opaque piece of the same part (a ring's inner half in its piston, a stem's top in its cap, a pipe's
   end in its collector — glass hides nothing); ② duplicates welded, loose geometry deleted, a flat fan's pole (a cap's centre) dissolved into one
   face — ⛔ never a general limited dissolve (it takes out a bent bar's support rings: their two sides are coplanar); ③ AUTO SMOOTH on every face
   (30°, or the object's own: a torus smooth all over; a bevel whose steps fall ON 30° — the plinth's 3 × 30° — its own 35°); ⭐ a FLAT CAP (a face
   of more than 4 sides: a crown, a deck, a disc) keeps every edge sharp where its neighbour is not coplanar, so it shades FLAT (the owner:
   *"some of the pistons' top face are still not flat"* — each crown met its valve pockets' floors at 17°, under the 30° smoothing: its normals
   leaned 8.6°, a gradient on a flat face; on all six, seen more or less by where each pocket faces). It prints what it removed, object by object.
6. **Authored in the reference's units, y up**: an empty `YUP_ROOT` (rotation x 90°) so every number reads as the reference's; `unitM` on it.

### 4.2 ⭐⭐ The checks every run prints (each for the steps built so far)

| check | what it measures | passes when |
|---|---|---|
| **the size** | per part, its render meshes' box in units and in metres (`unitM`); its counts: render, `UCX_`, `UFM_`, seats | the assembly about `Scene_1`'s cube (`SCENE_WORKFLOW.md` §4); the counts as the scene's sheet |
| **each SEAT** | per pair of the plan (host's marker, part's marker — `MC_`): the distance between them and their normals' dot at the goal | distance 0, dot −1 (anti-parallel — `../INDEX.md` rule 1) |
| ⭐ **each WAY IN** | the part's collision pieces moved BACK along its approach, from 2 mm off its goal to its full length, against EVERY earlier part's collision pieces (triangle overlap, `BVHTree`) | clear at every position; ⛔ else the first blocked distance and the pieces named |
| ⭐⭐ **the CONTROL** | the same part pushed 0.05 units PAST its goal, into its host | ⛔ it must read BLOCKED — else the check is BLIND (a check never seen failing is not trusted: `CLAUDE.md` rule 2's spirit) |
| ⭐ **no redundant geometry** (the owner, 2026-11-13: *"be careful that in your blender file, you have redundant edges … not sure if it can create issues (rendering, gizmo, etc.)"*) | per VISIBLE mesh and per face proxy (⛔ first glass only: it missed the crank's doubled rings and the text's doubled outlines): duplicate vertices, zero-area faces, loose edges | none — a transparent part is ONE solid (a boolean of one outer body, never touching boxes: their faces show through the glass), every boolean's result welded and its flat faces' extra edges dissolved, a proxy's strips welded into whole faces (`tidy`). An opaque part made of touching primitives (a chrome bar and its knees) may keep them |
| ⭐ **the MOTION** (the owner, 2026-11-13: *"when the crank rotates, the piston shall remain in the cylinder"*) — for a scene with a level-end animation (§5) | the mechanism driven through its whole cycle by the game's own formula (every 6°): each moving part against the limits it must keep (a piston inside its cylinder, under its valves) and against the still parts' collision pieces | every margin ≥ 0, no collision — ⭐ with its control (a known-bad dimension must read OUT) |
| ⭐⭐ **the RUN on the meshes** (the owner, 2026-11-13: *"how can we check that the animation will be ok in babylon/ts pipeline ?"*) — a scene with an animation | the game's own formula posing every moving piece through its whole cycle (every 6°), each piece's MESH against every other part's; the same poses baked as keyframes (a preview to scrub); the poses at fixed angles written to `animation_golden.json` — the golden vectors the TypeScript port must reproduce | no interference beyond the contacts NAMED in the script (a big end on its pin) — `Scene_2`'s first run found every valve in its piston: the reference's own preview had hidden it |
| ⭐ **the PROXY SANITY** (✅ adopted, §3 item 3's principle) | fidelity, coverage, continuity, floating islands, reachability, simplicity, ORIENTATION, ghost overlap, GHOST FLUSH (at its hole's mouth; the plunges printed), SUPERPOSED (duplicates ⛔; seats listed) of the face proxies; the ghosts' dives and the real steps (information); lone small proxies (to confirm) | every failure named; ⭐ each check proven by its CONTROL (`CHECK_CONTROLS=1`: one planted defect each, all caught) |
| ⭐ **FLAT CAPS shaded flat** (the owner, 2026-11-13: the pistons' crowns) | every face of more than 4 sides on a smooth object: its shading normals (the split normals) against the face's own | within 1° — ⭐ its control: a crown's sharp edges cleared (caught: 8.6°; ⚠ blind to it since the crowns are quads — the next row catches it) |
| ⭐ **CROWNS IN QUADS** (the owner, 2026-11-14: *"the top of the piston … does not follow the state of the art quad drawing, as a result, the rendering is poor and shows fake facets"*) | each piston's top (its faces within a quarter of its height of the crown): sides per face, folded faces, the flat faces' split normals, every quad's corners and planarity | no n-gon, nothing folded, a triangle only at each pocket's run-out (4 a piston), flat faces within 1°, corners 30° – 150°, planar to 1e-6 — ⭐ its control: a crown's sharp edges cleared (caught: 11.9°) |
| ⭐ **COLLISION SIMPLICITY** (the owner, 2026-11-13: *"why these exhaust connectors and valve caps faces have failed the checks for simplification"*) | every `UCX_` piece's vertices and triangles | ≤ 24 vertices, ≤ 48 triangles (a 12-sided cylinder: 24, 44) — ⭐ its control: a hull of a dense sphere (caught: 220 triangles). It found, besides the exhausts' (216) and the valves' (60): the crank's arms (hulls of two balls, 72) and the plinth (36-gon caps, 140) — all simplified |
| the look | the render of the step | the owner's eye in Blender (§4.1 item 3) |

⭐⭐ **A FLAT FACE WITH HOLES OR NOTCHES IS DRAWN IN QUADS, never left as a boolean's n-gon** (2026-11-14, `Scene_2`'s piston crowns): each part's
own occlusion is baked PER VERTEX into its colours (the `.glb`'s `COLOR_0`, always on — `SCENE_SETUP.md` §6.3), so a flat n-gon fanned into long
slivers carries a dark rim vertex's value across the whole face: FAKE FACETS on a flat crown (revision 1: 57 of its 89 triangles slivers). ⭐ The way
it is drawn (`build_engine.py` `crown_quads`): every surface from its own equation, no boolean; a curved wall in even steps; the flat face in
patches whose rows run from a hole's rim to the outline; a round floor as a BAND round an inner RECTANGLE (the square-in-a-circle layout — never a
ladder parallel to a chord: its rows thin to slivers where the rim runs along them), the band REDUCING 3 to 1 (4 quads) so the inside stays light;
every edge between two surfaces marked sharp (a 17° crease under the 30° smoothing leans the flat face's normals). A triangle only where three
surfaces meet in a point (a pocket's run-out). The layout's numbers SWEPT for the quads' corners and their longest / shortest edge, not guessed.
⭐ **A host is CUT only where a part REALLY passes** (the owner, 2026-11-13, `Scene_2`'s upper case: *"(b)"*): the cut is the part's own swept
hull along its way in (the hull of its two end positions — exact for a convex piece), computed from the part's geometry in the script — never the whole
opening's cylinder, which can eat a host whole; a part's geometry the cut needs is a shared function, built before the part's own step.
⭐⭐ **WHY THE CHECKS MISSED THEM — EVERY ROLE NEEDS A SHAPE CHECK** (2026-11-13): each check reads only some objects. The collision pieces were
checked for what they BLOCK (the ways in, their controls, the crank turned) but never for their SHAPE — the finish pass, the geometry review and
the redundancy check read the visible meshes and the proxies only; simplicity was a rule for the render mesh (§3 item 1) and the proxy (item 3),
never for `UCX_`. So a 216-triangle hull passed every run. ⛔ For every ROLE in the file (render, `UCX_`, `UFM_`, markers, metadata), at least one
check of its SHAPE, as well as of its function — and a new rule (§3) comes with its check and its control the same day.
⚠ Not yet in the report, to add as the steps need them: every collision piece convex and closed; every proxy face flat; every part the plan names
present and nothing unplanned carrying a proxy; each moving part's pivot (§5). ⛔ A skipped check is announced (`00_CORE/METHOD.md`).
⭐⭐ **WRITING A CHECK — its pitfalls, met** (2026-11-13, the owner: *"this is not caught by your checks"*; §3 ⓗ–ⓜ): ⛔ never
`BVHTree.FromPolygons` on faces that may be CONCAVE (it fans each n-gon from its first corner: phantom triangles over a notch) — build the tree
from the faces' own triangulation (`tri_bvh`) and map its index back to the face; ⛔ never a face's CENTRE or its first fan triangle as its test
point — a point WELL INSIDE it (the centre when inside, else the largest triangle's centroid); an inside / outside test by ray parity VOTES over
three rays (a seam grazed counts twice); a sample by a face's own outline is skipped (its coplanar neighbour is there by right); refresh the view
layer before reading world matrices; compare materials with `==`. ⭐ Every new check gets its CONTROL in `CHECK_CONTROLS` the day it is written.
⚠ What the way-in sweep does NOT see: a piece wholly INSIDE another without a crossing triangle (the 0.01 step makes it cross on the way); contact at
the goal (allowed — `COLLISION.md` §9: only penetration is refused), which is why the sweep starts 2 mm off.

### 4.3 ⭐⭐ ONCE THE SCENE IS BUILT, BEFORE ITS EXPORT — three checks (the owner, 2026-11-13: *"update the md files to capture … as part of the
workflow once the scene is built in blender"*)

1. ⭐ **The GEOMETRY of every visible object** (*"once a visible object is drawn, do a check of the geometry to clean it (duplicate vertices,
   optimization of number of vertices especially on objects or object's portions which are mostly hidden during game, shade auto smooth latches"*)
   — the FINISH PASS cleans (§4.1 item 5), the GEOMETRY REVIEW reports, every run: ⓪ **inside out** — a closed mesh's signed volume negative
   (a game engine draws a face's front only: an inverted mesh is INVISIBLE — `Scene_2`'s every ring was, unseen in Blender, which shades both
   sides); ① **auto smooth latches** — on a smooth object, edges at 30° – 35° (they stay hard under 30°: faceted; 35° and more are crisp by
   design and marked sharp — a chamfer); ② **mostly unseen** — rays from each face of the ASSEMBLED scene in 26 directions, the opaque parts
   blocking (glass does not): an object mostly unseen is a candidate for lighter geometry, never deleted (the parts appear one by one — an earlier
   step sees more). ⛔ Its pitfalls, met: compare Blender materials with `==` (never `is`: a new wrapper each access — the glass had counted as a
   wall); refresh the view layer before reading world matrices (stale ones put the caps where they were not).
2. ⭐ **The MOTION, before it exists in the game** (*"how can we check that the animation will be ok in babylon/ts pipeline ?"*) — for a scene
   with an animation (§5): the RUN on the meshes (§4.2's row): every moving piece posed by the game's own formula through its whole cycle, every
   6°, each MESH against every other part's — no interference beyond the contacts named in the script; the poses BAKED as keyframes (the owner
   scrubs the timeline — a preview only, the game computes its own); the poses at fixed angles written to `animation_golden.json` — the golden
   vectors the TypeScript port (`src/core`) must reproduce, so what the run proved holds in Babylon; W6's headless run closes it.
3. ⭐⭐ **The FACE PROXIES and the GHOST floors, for PLAYABILITY — the OWNER's review** (*"the owner shall check the ghost and hidden faces to
   check if the game will be playable … the orbit and gizmo will not be smooth on such faces"*): a REVIEW script colours every proxy face by
   its risk for the gizmo and the orbit, step by step (the faces exposed at that step, the ghosts of the part being placed): 🔴 within 15° of 45°
   of elevation (the face map's side/cap boundary, `SCENE_WORKFLOW.md` §4); 🟠 NARROW or tiny (the gizmo jumps across it; under ≈ 7 mm on the glass);
   🟡 a plane CHOPPED into many separate strips (a deck between bores); 🟢 fine; 🟣 a ghost floor, named with the part it serves; ⚪ a SEAT face (pressed on another part's face, facing back: unreachable once seated) grey and
   set back 3 mm (two faces in one plane flicker); ⛔ every other face LIFTED 2 mm off its real surface (a proxy lies ON it by design: shown over the context meshes, the whole step flickered — the owner, step 3: *"why step 3 still shows superposed faces everywhere?"*) — a review
   `.blend` (never the build's; ⛔ no renders, none committed — the owner: *"no need to have review renders"*; `REVIEW_RENDERS=1` for a quick look) — ⭐ holding ONLY the faces to review (the owner: *"display only the faces I need to review in the review blend file (not all the scene, as I cannot see the faces I need to see)"*): every other object deleted, one collection a step, the first step with a finding shown, the colours in Solid mode too. ⛔ The owner looks and decides (merge, enlarge, a ghost bridging a strip, or accept); W6 then
   walks the real orbit on each step headless; W7 (the device) closes.

### 4.4 ⭐⭐ THE EXPORT — the plan's last step (W4's first half; `Scene_2` 2026-11-13)

1. **`--step <last>`**: the whole build and its checks, then ONE `.glb` beside the `.blend` — a scene authored ASSEMBLED is one file, each part a
   named subtree under the root (`MATERIALS_AND_IMPORT.md` §4's *"one file per part"* was written for a single authored part).
2. **What it holds**: every part's subtree — render meshes, `UCX_`, `UFM_` with its ghosts, `MC_` markers, `HINGE_` pivots — their custom
   properties as glTF `extras` (a boolean as 0 / 1); **+Y up**, reference units (`unitM` on the root); textures EMBEDDED; the GOAL pose.
   ⛔ Not: the `PREVIEW` collection, the keyframes (the game computes the motion, §5), cameras, lights.
3. **For the game**: each marker and hinge carries its frame IN REFERENCE UNITS — `position`, `normal` (a seat) or `axis_dir` (a hinge), `twist`
   — so the game never undoes Blender's axis conversion (in the node itself a marker's normal is its local +Y: Blender's +Z, converted). Every
   material ONE-SIDED (`doubleSided` false: the game draws front faces only — the inside-out check's premise). The collision pieces exported
   SMOOTH (never drawn: their faces share vertices — flat, they were 10,346 vertices for 4,136 triangles).
4. ⭐ **READ BACK, every run**: the file's JSON parsed — every object of every part's collection present (⛔ the expected set INDEPENDENT of the
   export's own list: the first run exported the root alone, and a check against that list passed it), the part count, every custom property
   carried, each marker's place and normal = the reference's (within 1e-4), nothing double-sided, no animation or camera, images embedded; its size
   and vertex counts printed. **Its control** (`CHECK_CONTROLS`): the same export WITHOUT the +Y-up conversion must FAIL the axes check (caught:
   3.18 off). `Scene_2`: 1.47 MB, 280 nodes, 30,416 vertices as exported (glTF splits a vertex at every hard edge).
5. ⭐⭐ **THE GOAL POSE, every piece WHERE IT WAS BUILT** (the owner, 2026-11-13: *"collision layer has two valves cap misaligned"*): the export
   posed the engine at θ 0 — the crank and pistons at their goal, but TWO VALVES part open (each valve opens over 180° of the 720°: at every θ some
   are), their look 0.061 down their axes off the collision cylinders built closed. ⛔ Why no check saw it: the read-back compared the MARKERS with
   the reference, never a drawn piece with the pose its collision and proxies were built in. Now:
   - **the goal pose** = the crank's θ 0 with **every valve CLOSED** (`engine_pose(0, valves_closed=True)` — the valve set is SEATED closed);
   - ⛔ **the preview's KEYFRAMES detached during the export**: Blender re-evaluates an object's action at the current frame on every update and
     overwrites a pose set by hand — the first fix posed the valves closed and the file still had them open (found by the check below). Each
     mover's action is set aside, the goal posed, the file written, the actions put back (the `.blend` keeps its scrubbable preview);
   - ⭐ **⑫ THE BUILT POSE** (read back): every part's every object's matrix is recorded right after the build (`BUILT`, before the running check
     moves anything); every exported node — render, `UCX_`, `UFM_`, marker — must sit there (its place and its three axes, 1e-4) — else
     *"N nodes NOT where they were built"*, named. **Its control** (`CHECK_CONTROLS`): the export at θ 0 with the valves as they are then — must
     FAIL (caught: the 4 valve objects, 0.061).
   ⭐ For ANY scene with moving pieces: the export's pose is the pose the collision and proxies were built in — never a frame of the animation.
6. ⭐⭐ **THE SCENE'S FLOOR is in the file** (the owner, 2026-11-13: *"make it the attributes of the scene (yellow material, invisible from below, with
   just a highlight of its contour when the camera sees it from below …)"*): `FLOOR` under the root (role `floor`, no `part_id`, one face up, a
   one-sided material, at the game's size: `SCENE_WORKFLOW.md` §6.3 item 1). ⚠ Built as an object of the ROOT's frame — not with `mesh_object`, which
   brings reference coordinates into a PART's frame (the root's own rotation then stood the floor on its edge: the build asserts it faces up). Read
   back: exported, its role carried; the game's reader takes at most one, a mesh with no children (`core/model_catalog.ts`).
7. ⭐⭐ **THE CONTACT SHADOWS, BAKED** (2026-11-13, `40_RENDER_SCENE/spec/SCENE_SETUP.md` §6.3): before the export, the build bakes each part's own
   occlusion into its OPAQUE meshes' vertex colours (`AO` → `COLOR_0`) and, per pair of parts within reach at their goals, what one casts on the other →
   `<scene>_contact.json`; the glass neither receives nor occludes. Checks: darkens only (absolute, within the noise), the product = a full bake PER TERM
   (⛔ a global percentile was blind — its control proved it), every baked mesh exported with `COLOR_0`; control ⑬ the darkest term dropped.

## 5. A scene's own reference animation

A scene may come with an animation of the assembled object (a machine running, a mechanism turning). ⭐ The parts are still while they are assembled; the animation
is a REWARD at the level's end (`20_GAME_RULES/spec/LEVEL_END.md`), built last — its moving parts are then the plan's parts, so the plan's
granularity must allow it (a part that moves in the animation is one part, or a known group).
⭐ **A part may hold a HINGE** (the owner, 2026-11-12, `Scene_2`'s piston + rod): two meshes, one a child pivoting on the other at an axis marked
by an empty (`HINGE_<part>_<name>`) — LOCKED at the goal's angle while the player places it (the part rigid, its collision fixed), FREE in the
animation. ⭐ The animation is COMPUTED by the game (a formula in `src/core`, vectored; the poses applied by the render) — not a clip baked in
Blender; Blender previews it. Each moving piece's PIVOT is authored where the formula turns it (`SCENE_2_ASSEMBLY.md` §6.5).
