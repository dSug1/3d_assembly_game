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
2. **`UCX_<part>_NN` — the collision pieces**: a few convex pieces, only where the plan inserts or rests (a bore as a ring of pieces, or squared),
   as `BLENDER_COLLISION_AUTHORING.md` specifies. Absent: the hull at spawn.
3. ⭐ **The face proxy — NEW, not yet specified**: a hidden flat-faced stand-in where the plan's SEATS and GIZMO ROUTES are (a bore as a 6- or 8-sided
   prism, a round seat as one flat disc face) — what the face map builds its facets from, so the gizmo RUNS on it and a part RESTS on it. ⚠ Its name
   (e.g. `UFM_<part>`) and its rules (convex or not, which faces count, how it meets the render mesh, what replaces it at the face map) are written
   here before it is built.
   ⭐⭐ **GHOST faces** (the owner, 2026-11-12: *"a ghost surface to support the gizmo for A + dy"*): a proxy face where there is NO real surface —
   across an opening a part goes into (a bore, a socket, a slot), at the depth where that part stops at its goal. The approach (A + dy) moves the
   held part straight along the gizmo's face normal TOWARD the gizmo and stops at it (`render/assembly_wiring.ts`, `placeOffset`; D3: *"center of the
   orbit = gizmo"*); over an opening the part fits, the gizmo reads the real depth (`POLAR_ORBIT_CLEANUP.md` §7, §8.3) — so the ghost face IS that
   depth: the gizmo drops onto it, A + dy brings the part down to it, the goal capture seats it. Never drawn, never collided, never picked; one per
   opening, each at its own part's depth.
   ⭐ **A ghost face serves ONE part** (`for_part` on it): two parts may go into the same opening at different depths (`Scene_2`: a bore's piston,
   then its valve set) — the game reads a ghost only while ITS part is held, else the gizmo stops at the wrong one. The check script names each.
   ⭐ **THE PAIR**: an inserted part carries a **resting proxy** — one flat face SQUARE to its approach axis, CENTRED on it, at its hull's extreme along
   the approach (what the orbit's lift measures) — and its host carries the **ghost floor** at the SAME place at the goal; the gizmo then stands on the
   opening's axis and A + dy lands the part exactly on its goal. A ghost floor may lie outside its host's body (in a cavity below an opening). An open
   CAVITY (a tub the part goes into) needs one as much as a bore: its real depth is the cavity's bottom, not the seat (`Scene_2`'s crankshaft).
   ⭐ A proxy face keeps the face map's thresholds (`../../20_GAME_RULES/spec/SCENE_WORKFLOW.md` §4: ≥ 15° from 45° of elevation; ≥ 30° between faces
   to be told apart), and an opening in a proxy face is a RECTANGLE (the face map reads rectangles), round only in the look.
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
   REPORT (§4.2).
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
   (30°, or the object's own: a torus smooth all over). It prints what it removed, object by object.
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
| the look | the render of the step | the owner's eye in Blender (§4.1 item 3) |

⭐ **A host is CUT only where a part REALLY passes** (the owner, 2026-11-13, `Scene_2`'s upper case: *"(b)"*): the cut is the part's own swept
hull along its way in (the hull of its two end positions — exact for a convex piece), computed from the part's geometry in the script — never the whole
opening's cylinder, which can eat a host whole; a part's geometry the cut needs is a shared function, built before the part's own step.
⚠ Not yet in the report, to add as the steps need them: every collision piece convex and closed; every proxy face flat; every part the plan names
present and nothing unplanned carrying a proxy; each moving part's pivot (§5). ⛔ A skipped check is announced (`00_CORE/METHOD.md`).
⚠ What the way-in sweep does NOT see: a piece wholly INSIDE another without a crossing triangle (the 0.01 step makes it cross on the way); contact at
the goal (allowed — `COLLISION.md` §9: only penetration is refused), which is why the sweep starts 2 mm off.

## 5. A scene's own reference animation

A scene may come with an animation of the assembled object (a machine running, a mechanism turning). ⭐ The parts are still while they are assembled; the animation
is a REWARD at the level's end (`20_GAME_RULES/spec/LEVEL_END.md`), built last — its moving parts are then the plan's parts, so the plan's
granularity must allow it (a part that moves in the animation is one part, or a known group).
⭐ **A part may hold a HINGE** (the owner, 2026-11-12, `Scene_2`'s piston + rod): two meshes, one a child pivoting on the other at an axis marked
by an empty (`HINGE_<part>_<name>`) — LOCKED at the goal's angle while the player places it (the part rigid, its collision fixed), FREE in the
animation. ⭐ The animation is COMPUTED by the game (a formula in `src/core`, vectored; the poses applied by the render) — not a clip baked in
Blender; Blender previews it. Each moving piece's PIVOT is authored where the formula turns it (`SCENE_2_ASSEMBLY.md` §6.5).
