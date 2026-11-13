# THE SCENE WORKFLOW — from an object to a playable assembly level, for ANY new scene

> **STATUS** · ⛔ **PROPOSED 2026-11-12, NOT APPROVED** · **OWNS** · the stages every new assembly scene goes through, what each stage produces, who
> decides at each gate, and the template of the ASSEMBLY PLAN
> **READ IF** · you are starting a new scene, or about to model, import or script the parts of one
> **LAST VERIFIED** · 2026-11-12 (branch `1.0.124from1.0.121-Added_scene_2`)

> *"I think we first need to draft an assembly plan how the player would build the assembly. That will determine how to geometrize the parts, how to
> draw them and their supporting surfaces in blender, etc. Propose a workflow which could be adopted for any new scene and which will be captured in
> the tiered md files."* — the owner, 2026-11-12. ⭐ Written for ANY scene; its first application is `Scene_2` (`30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md`), which binds no other.

## 0. ⭐⭐ The principle — the PLAY decides the GEOMETRY, never the other way

A part's collision pieces, its flat faces for the gizmo, its seating points and its goal all exist to serve ONE thing: the step in which the player
places it. So the steps are written FIRST, on paper, and approved; the geometry is DERIVED from them; nothing is modelled for the game before.
⭐ Everything a stage produces has ONE home (a constant in one place — `CONSTRAINTS.md` §4): the plan names every part, face and connector once, and
every later stage uses those names.

## 1. The stages

| | stage | produces | decided by | gate |
|---|---|---|---|---|
| **W0** | **The brief** | the object; its reference (a sheet, a preview, photos); what the level is FOR; ⭐ its SCALE — the assembled object about `Scene_1`'s cube (§4); the phone's limits (§4) | the owner | the owner's go |
| **W1** | ⭐⭐ **THE ASSEMBLY PLAN** (§2) | the parts catalogue and the steps, on paper, in the scene's spec (§5); a sketch per step where needed | Claude drafts, the owner decides | ⛔ **the owner's approval** — nothing after it starts before |
| **W2** | **The geometry spec** | per part, DERIVED from the plan: what the render mesh shows, its collision pieces, its flat faces (the face proxy), its connectors, its goal; the naming | Claude, from the plan | the owner's approval (the conventions once for all scenes; a scene's sheet each time) |
| **W3** | **The Blender build** | ⭐ STEP BY STEP: a RE-RUNNABLE script (`Assets/Blender/scripts/build_<scene>.py -- --step N`) rebuilding the `.blend` up to the plan's step N, then the FINISH PASS (hidden faces, duplicates, auto smooth — every object), a preview render and the CHECKS each run (§3; `PART_AUTHORING.md` §4) | Claude builds a step; the owner looks; changes go into the script | ⛔ each step's checks clean AND the owner's look in Blender before the next step; ⭐ once the scene is built, BEFORE the export, the three checks of `PART_AUTHORING.md` §4.3 — the geometry review, the motion run (with `animation_golden.json`), and ⛔ the OWNER's review of the face proxies and ghosts for playability |
| **W4** | **The export and the import** | the `.glb` — the build's last step, READ BACK (`PART_AUTHORING.md` §4.4: one file, every part's subtree, `extras`, +Y up, one-sided); the loader reads it and REFUSES, named, what breaks a convention (`3D4`) | Claude | vectors on the loader; the import of the slice |
| **W5** | **The level data** | the scene file (`src/content/<scene>.ts`): the boot layout, the plan's steps as DATA, the rig, the lights | Claude | vectors: the plan's rules (§2.3) checked on the data |
| **W6** | **The headless proof** | probes walking EVERY step: the orbit from the boot to the goal, the seat, the capture, the solver's budget per frame, screenshots | Claude | every step reached, budget kept |
| **W7** | **The device look** | — | the owner | ⛔ **closes the scene** (rule 5) |

⭐⭐ **A VERTICAL SLICE FIRST**: three or four parts (the base, one host, one part that inserts, one that rests) go through W1 – W7 before the rest of
the catalogue does. A broken convention then costs four parts, not the scene. ⭐ Then the scene widens step by step, a device look on each widening.

⭐ **Going back is normal**: a step that fails at W6 or W7 goes back to W1 (the plan changes) or W2 (the geometry changes), never patched at W5 —
*no heuristic pile-up* (`METHOD.md`).

## 2. ⭐⭐ W1 — THE ASSEMBLY PLAN (the template)

### 2.1 The parts catalogue

| id | name | role | kind | symmetry | boot | notes |
|---|---|---|---|---|---|---|
| e.g. `P01` | base | **PRE-PLACED** (frozen: the ground of the assembly) | — | — | its goal | |
| `P02` | peg + collar | **PLACEABLE** | `peg` (4 interchangeable) | about its axis | the tray | one part: the collar is not placed on its own |

* **role** — PRE-PLACED (in its goal from the start; frozen or not), PLACEABLE (the player brings it), or a SUBASSEMBLY (several meshes moving as one
  part — the granularity decision, per part).
* **kind** — interchangeable copies fill each other's slots (`FinalPose.kind`, `D183`).
* **symmetry** — the turns that look the same at the goal (`GoalSymmetry`; a new one is a new rule, written here first).
* **boot** — where the part starts (a tray, heaps — `DEMO_SCENE.md`'s ways), and how it lies there. ⭐ A known way, `Scene_2`'s choice: the
  demo's HEAPS (`DEMO_SCENE.md` §2bis) — dropped and settled, the next part to place on top, ⭐ ONE HEAP PER TYPE of part (the owner: *"keep the
  same types of parts close together … so it reproduces the classification by color of the demo scene"*), as the demo's one per colour. ⭐ A part does NOT start on its seating face (the owner,
  2026-11-12: *"I want to keep the same feel as the demo scene"*): turning it onto its seat is the player's work.

### 2.2 The steps

| step | part | host(s) | seat: part face ↔ host face | approach | turn at the goal | gizmo route | orbit centre | after | notes |
|---|---|---|---|---|---|---|---|---|---|
| e.g. 3 | `P04` shaft | `P03` frame | its two journals ↔ the frame's two saddles | straight down, 30 mm | fixed by its flats (1 way) | the frame's top face, then into the saddles | the frame's top centre | 2 | |

* **host** — the placed part(s) it rests on or goes into.
* **seat** — the pair of FLAT faces that touch at the goal (or the connector pair): their normals anti-parallel (`30_OBJECTS_3D/INDEX.md` rule 1).
  ⭐ The part's seat face is its RESTING face while it is orbited (as the green piece's largest face is today).
* **approach** — the last straight move into the goal: its axis and length (an insertion: the depth; a resting part: none). ⭐ An insertion often
  has ONE axis only (where the opening, the part's own shape and what it seats on line up): the plan NAMES it, and W2 designs for it the FACE the
  part slides on to reach the opening and the flat seat at the end (`Scene_2`'s pistons — `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md` §2.6).
  ⭐ An insertion is driven by the APPROACH (A + dy: the held part straight along the gizmo's face normal toward the gizmo) — so it needs a GHOST face
  at the opening's goal depth for the gizmo to stand on (`30_OBJECTS_3D/spec/PART_AUTHORING.md` §3), and, when the play is a few millimetres, a way to
  hold the gizmo on the opening's axis at its mouth (`SCENE_2_ASSEMBLY.md` §2.9). ⛔ And the WHOLE part must fit the opening along that axis — every
  end of it, measured on the reference's numbers (rule 2).
* **turn at the goal** — how many orientations fit (the twist; a symmetry).
* **gizmo route** — the faces of the assembly-so-far the orbit runs over to reach the goal: they must be EXPOSED faces at that step.
* ⭐ **orbit centre** — where the orbit's CENTRE is for that step (the owner, 2026-11-12: *"each time we seat a part, we will need to redefine the
  center of the orbit or give the possibility to the player to modify the center of the orbit because the seating of the next part may require to
  orbit around another position for the center"*): one centre for a whole assembly (`Scene_1`'s boot centre, `Scene_0`'s heptagon's) cannot serve a
  part whose goal is at one end, inside a bore or under an overhang. The plan names, per step, the centre the orbit should go round — the host's, the
  seat's, the opening's — so it can be REDEFINED automatically when the previous part seats; ⭐ and the game gives the PLAYER a way to move it (a
  gesture, the queue's `IN10` — orbit about a chosen point — and the camera's centre blend, so the change is eased, never a jump). ⚠ Both are
  requirements for the queue (§2.4), not built.
* **after** — the steps that must be done before (a partial order: several orders may be valid).

### 2.3 ⛔ The rules a plan must pass (on paper at W1; as vectors on the data at W5; as probes at W6)

1. **An order exists** — the `after` graph has no cycle; every host is pre-placed or placed at an earlier step.
2. **Access** — at its step, a part's way in (the approach, and the orbit's route before it) is not closed by a part placed before: nothing is placed
   INSIDE what is already closed. ⛔ Checked ON THE REFERENCE's NUMBERS at W1, not on the picture — the WHOLE part's sweep along its approach, every
   end of it (`Scene_2`, 2026-11-12: an approved plan slid each piston in sideways at its bank's split; the numbers showed the rods' other ends inside
   the crankcase, below its split — `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md` §2.7).
3. **A seat for every step** — a flat face on the part and one on the host, anti-parallel at the goal.
4. **The gizmo can reach it** — every face of the route is an exposed face of the assembly at that step (the face map is built from the EXPOSED faces —
   `POLAR_ORBIT_CLEANUP.md`, R1).
5. **A step is one action** — a part too small to orbit on its own (a cap, a screw) belongs to a subassembly; a step the player cannot see is
   redesigned (the camera, the order) or removed.
6. **The phone's budget** (§4) — counted for the worst step: the bodies and collision pieces near the held part at its goal.
7. **Symmetries and kinds declared** — every interchangeable part and every look-alike turn is in the catalogue, never discovered at the device.
8. **The end** — what "assembled" means (every placeable part in its goal), and what the level end shows (a reward: `LEVEL_END.md`).
9. ⭐ **An anchor** — at least ONE part is PRE-PLACED at boot, in its goal (the owner, 2026-11-12: *"we always need to have a first part pre-placed at
   boot otherwise the player could choose whatever position in the scene and the goals would not be matching"*): the goals are absolute poses, so
   the first placed part must not be free to land anywhere.

### 2.4 What the plan is NOT

⛔ Not the geometry (W2): it names faces by what they ARE (*"the bearing saddles"*), not by mesh. ⛔ Not the code: what the game must GAIN for a plan
(a sequence of orbited pieces, a new symmetry, an insertion) is listed in the plan as a requirement for the queue, and built only when approved.

## 3. ⭐ W2 / W3 — what the geometry carries (the conventions to be written once)

Derived from the plan, per part — the conventions for every scene are [`../../30_OBJECTS_3D/spec/PART_AUTHORING.md`](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) (⛔ proposed; the face proxy's rules not written yet), in short:

* **the render mesh** — the look, what a finger taps;
* **the collision pieces** (`UCX_<part>_NN`, `30_OBJECTS_3D/spec/BLENDER_COLLISION_AUTHORING.md`) — only as many as the steps' insertions need;
* **the face proxy** (`UFM_<part>`) — the part's REAL OUTER SURFACE, SIMPLIFIED, where the plan's SEATS and GIZMO ROUTES are: as close to the real surface as it can be while flat and few; no false gap, no crack, nothing floating, nothing unreachable, ⛔ no face DOUBLED (a SEAT — two parts' faces pressed together, facing back — is expected: listed, skipped by the game once seated) — checked by the PROXY SANITY (`PART_AUTHORING.md` §3 item 3, ✅ adopted);
* ⭐ **metadata** (a label, a number, a sign) — its OWN object, `metadata = true`, so the game can hide it (`PART_AUTHORING.md` §3 item 1bis);
* **the connectors** — an empty per seat (position, outward normal, twist reference), named after the plan's step;
* ⭐⭐ **a part going INTO a hole or a recess** (the owner, 2026-11-13: *"the ghost face shall be aligned with the outer face … Then, we will create a special snap to plunge the pistons inside the cylinder hold … In such case, the ghost face shall always be a face aligned with the assembly face where the hole exits"*) — its host's ghost floor lies IN THE PLANE WHERE THE HOLE EXITS, flush with the host's outer face, filling the opening; the part rests there and the game's PLUNGE snap (⛔ to build — `00_CORE/QUEUE.md`) carries it down onto its seat (`PART_AUTHORING.md` §3 items 3 and 4);
* **the goal** — the authored pose (the `.blend` is authored assembled); the boot is level data.

⭐ The CHECKS (W3), printed by every run of the build for the steps built so far — the procedure and the table: `PART_AUTHORING.md` §4: the size;
each seat (its two markers coincident, anti-parallel); each WAY IN (the part's collision pieces swept back along its approach against every earlier
part); ⭐ a CONTROL that must read BLOCKED (the part pushed past its goal) — else the check is blind. A skipped check is announced (`METHOD.md`).

## 4. ⛔ The limits every plan is written against

* ⭐⭐ **THE SIZE OF `Scene_1`'s CUBE** — the complete assembly's overall dimensions are similar to `Scene_1`'s cube assembly (4.9 × 4.83 × 4.83
  units: 0.49 × 0.483 × 0.483 m; `Scene_0`'s heptagon fills the same box), the owner, 2026-11-12: *"the overall dimensions of the engine complete
  assembly shall be similar to the cube assembly of scene 1, because all the inputs and behaviors and sliders have been taylored on these
  dimensions"* — the orbit's rings, the zoom, the gizmo's ease, the close-in tilt's 0.6 m, the face map's thresholds, the camera's distances were all
  tuned on that size; a scene far larger or smaller would need them all re-tuned. ⭐ Set at W0 (the scene's scale), checked at W2 (the assembled
  bounding box against the cube's) and at W6 (measured on the built scene).
* ⭐⭐ **THE FACE MAP's TWO THRESHOLDS — no face the orbit runs on or seats on at them** (the owner, 2026-11-12: *"if 45 degree deck is a problem,
  capture in the md files to avoid such inclination and increase or decrease the inclination"*): ① a face becomes a TOP / BOTTOM cap only beyond
  **45° of elevation** (`input/face_map.ts`, `buildFaceMap`'s `capOf`: `> π/4 + 1e-12`) — a face AT 45° is classified by rounding; ② faces facing the
  same way within **20°** (`MAP_AXIS_DEG`, the merge) become ONE facet — two faces the player must reach separately cannot be that close. ⭐ So a face of
  a gizmo route or a seat keeps **≥ 15° from 45° of elevation**, and faces that must stay apart are **≥ 30° apart**; where the reference puts one at a
  threshold, the scene's geometry is TILTED off it at W1 / W2 (`Scene_2`: its 90° V → 120°, its decks 45° → 30° — `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md`
  §2.10). ⚠ Reasoned on the code; measured on the built scene at W6.
* **24 gap queries a frame** — the solver's budget (the owner tests on an iPhone): few bodies near the held part, few collision pieces each.
* **Few parts** — every part is a step; the level's length and the phone's cost both grow with them.
* **Patent-free methods only.**
* **Rule 5** — a scene, a slice, a widening is closed by the owner's look on the device, never by a green suite.

## 5. Where each scene's documents live

* A scene's brief, plan and geometry sheet: `30_OBJECTS_3D/spec/SCENE_<N>_ASSEMBLY.md` (e.g. `SCENE_2_ASSEMBLY.md`), pointed at by `30_OBJECTS_3D/INDEX.md`.
* The conventions every scene's parts follow: `30_OBJECTS_3D/spec/PART_AUTHORING.md` — ⛔ never restated in a scene's file.
* The level as played (its menu entry, its boot): `20_GAME_RULES/spec/GAME_STRUCTURE.md` §7.
* The Blender files and scripts: `Assets/Blender/World<N>_Scene<M>_<name>/`, registered in `30_OBJECTS_3D/spec/BLENDER_ASSETS.md` §1.
* What the game must gain: a row in `00_CORE/QUEUE.md`, once approved — never a second list.

## 6. ⭐⭐⭐ THE PLAYBOOK — the steps as followed for `Scene_2` (2026-11-12 – 13), to reuse for the next scene

> *"update the md files with the steps we follow, so that next time I create a new scene I can use that to speed up things"* — the owner, 2026-11-13

⭐ A RUN-SHEET, in order: what to do, what to ask, what closes each stage. The rules live above (§1 – §4) and in `PART_AUTHORING.md`; this section only
says WHEN. ⛔ Each ⛔ GATE is the owner's — nothing after it starts before it.

### 6.1 Setting up

1. **A branch for the scene** — a worktree is optional (`Scene_2` was built in `../3d_assembly_game-scene2` beside the main folder's work, then merged
   `--no-ff` into it and the worktree removed: `node_modules` checked for links first — `git worktree remove` follows a junction).
2. **The menu entry first** — an EMPTY scene in the level menu (`src/content/scene_<n>.ts`, `worlds.ts`, `GAME_STRUCTURE.md` §7): the floor, lights,
   rig and play volume read from `SCENE_1` (never retyped), so the level boots from day one.
3. **The scene's spec file** — `30_OBJECTS_3D/spec/SCENE_<N>_ASSEMBLY.md` (§5), with the owner's words quoted as they come.

### 6.2 W0 – W2: on paper

1. **W0 — the brief**: the object and its reference (`Scene_2`: the owner's glass V6 sheet and HTML preview); ⭐ the SCALE at once — the assembled
   object about `Scene_1`'s cube (§4); the reference's units → `unitM` (`Scene_2`: 0.14 m a unit).
2. **W1 — the plan** (§2's template): the catalogue, the steps, the nine rules checked ON THE REFERENCE'S NUMBERS. ⭐ Ask the owner the decisions the
   plan turns on, numbered (`Scene_2`'s D1 – D4: how the block splits, the anchor, look-alike parts, the boot). ⭐ Check the face thresholds (§4) on the
   reference — tilt off 45° here, not later (`Scene_2`'s 90° V → 120°). ⛔ **GATE: "plan approved".**
3. **W2 — the geometry sheet**: per part its look, collision pieces, face proxy and ghosts, seat markers, goal (`SCENE_2_ASSEMBLY.md` §6 is the model).
   ⛔ **GATE: "sheet approved".**

### 6.3 W3: the Blender build, one step at a time

1. **The script** — `Assets/Blender/scripts/build_<scene>.py -- --step N` (`build_engine.py` is the model to copy): rebuilds the `.blend` up to step N,
   the finish pass, a preview render, ⭐ every check of `PART_AUTHORING.md` §4.2 printed. ⚠ Blender runs are HEAVY: started on the owner's go only.
   ⭐⭐ **FROM STEP 1, THE GAME'S STAGE IN THE `.blend`, AT THE GAME'S SCALE** (the owner, 2026-11-13: *"I can see the floor is much larger in blender
   compared to the assembly than what it is in the scene of the pipeline"* — `Scene_2`'s preview floor was 24 units, 3.4 m at 0.14 m a unit, for the
   game's 2 m: every look until the export judged the engine against a floor 1.7× too big):
   - **the FLOOR is DESIGNED in the scene's Blender file and EXPORTED** (`FLOOR`, a child of the root, role `floor`, never a part): the game's size in
     reference units = **its metres / `unitM`** (`Scene_2`: 2 m / 0.14 = 14.29), its colour (`Scene_1`'s sand yellow), ONE FACE facing up with a
     ONE-SIDED material — invisible from below by itself (Blender's backface culling, the game's). The game draws it INSTEAD of the level's floor body
     (whose collision and rules stand) and applies the floor's rules to it: hidden from below (`D128`), its top face's contour shown then (`D196` — a
     contour cannot be a material: the game draws it from the mesh's own vertices, `render/model_import.ts`). Its corners: the scene's choice
     (`Scene_2`: r = half the plinth's corner radius, 0.165);
   - **the game's ENVIRONMENT as the world** (`Assets/Environment/sky_sand.hdr`, §6.4 item 3) and **the colour transform Standard** (Babylon has no
     tone mapping; Filmic washed the floor's yellow to cream), the viewport in Material Preview with the scene's world and lights;
   - ⛔ **checked**: the floor's size × `unitM` = the game's floor (2.000 m) — before the first look, not at the export.
   - ⭐⭐ **WHERE EACH THING IS MADE — ONE SOURCE EACH** (the owner, 2026-11-13: *"do we need to work the environment, the lighting, etc. directly in
     blender …, or does it need to be made in the babylon/ts pipeline ?"* → *"do it"*). What a `.glb` carries is made in Blender; what it cannot carry
     is made in the game and MIRRORED into the `.blend` by the build, read from the game's files (never retyped):

     | What | Made in | The other side |
     |---|---|---|
     | shapes, collision, proxies, markers, the FLOOR | the `.blend` (the build script) | the game reads the `.glb` |
     | materials (colour, metallic, roughness, alpha, textures) | the `.blend` — Principled's glTF inputs only (sheen, specular tint … are dropped) | the `.glb` |
     | the ENVIRONMENT (the sky the metal reflects) | ONE image, `Assets/Environment/sky_sand.hdr` (`scripts/gen_sky_hdr.mjs`) | both load the same file |
     | the LIGHTS (spots, directional, ambient fill), the background, tone mapping, contact shadows, the environment's strength | the GAME's data (the scene's `lighting`, `envIntensity`) — shadows, the auto-shadow switch and the frame budget depend on them | the build MIRRORS them as Blender lights and world (`build_engine.py`: "the GAME's lighting mirrored") |
     | shadows, tone mapping, the contour seen from below | the game | Blender: Standard colour; the rest not shown |

     ⭐ The conversions (Babylon's PBR on the `.glb`): a directional of intensity I → a Blender sun of strength I (both apply Lambert's 1/π); a spot → its URP intensity at the
     bodies' mean, Babylon's physical falloff I/d² in metres → a Blender spot of power 4π·I / `unitM`²; the ambient fill and the sky → the world's
     light, the camera seeing the background colour; positions (−X, Y, Z) / `unitM` (Babylon's glTF reader mirrors x); the sky's panorama mirrored
     (Mapping y × −1). ⚠ Eevee approximates Babylon (reflections, soft shadows): the look in Blender is close — ⛔ the game's look is the judge.
     ⭐⭐ **THE SCENE SETUP, in full — `40_RENDER_SCENE/spec/SCENE_SETUP.md`** (the lighting's fields, the mirror, `Scene_2`'s cream studio). ⭐ To set a
     scene's atmosphere: proposals rendered in Blender from the reference (`atmosphere_proposal.py`, renders only), ⛔ GATE: the owner picks one;
     then its numbers go into the scene's `lighting` (the game) and the build mirrors them — compared against the chosen render from its camera.
2. **One step a round** — build step N, the checks clean, ⛔ **GATE: the owner's look in Blender**; his changes come back either as words or as edits
   in his own copy of the `.blend` (`<scene>_owner.blend`): READ them (the file's numbers), carry the RULE into the script, never the hand-dragged number
   (§4.1 of `PART_AUTHORING.md`); a request that breaks a rule (a scale that bends the V) is asked, not taken.
3. **Every finding the owner makes that a check missed → a new check AND a planted control** (`CHECK_CONTROLS=1`: each must be CAUGHT), and the
   mistake written into `PART_AUTHORING.md` §3's list (ⓐ … ⓜ) — so it is caught by the script next time, not by the owner.
4. **Before the export** — the three checks of `PART_AUTHORING.md` §4.3: the geometry review, the motion run (`animation_golden.json` if the object
   moves at the end), ⛔ **GATE: the owner's review of the face proxies and ghosts** (`review_proxies.py`, the review `.blend`).
5. **The export** — the last step: one `.glb`, read back by the script (§4.4). Commit the `.blend`, the script, the `.glb`, the previews.

### 6.4 W4 – W7: into the game — ⭐ a VERTICAL SLICE first (§1)

1. **Choose the slice with the owner** — the anchor, one part resting on it, one INSERTED, one more if cheap (`Scene_2`: the plinth (pre-placed), the
   lower case, the crankshaft (plunged into the tub), the pulley (pushed onto the crank's end)). ⛔ **GATE: "slice ok".**
2. **W4 — the loader** (decided 2026-11-13: Babylon's own glTF reader `@babylonjs/loaders`, Apache-2.0, the same version as `@babylonjs/core`): the
   `.glb` read in `src/core` from its JSON (the conventions checked, every refusal NAMED, vectors on the real file and on broken copies), meshes made in
   `src/render`, with a debug view of the collision pieces, the face proxies and the markers.
3. ⭐⭐ **THE FINAL STAGE — the WHOLE scene assembled, in the game** (the owner, 2026-11-13: *"probably good to have a look at the scene in its final
   stage because that's the goal the player has to achieve. That will settle dimensions and scales, lighting, background, etc."*): every part at its
   goal, on the floor, under the scene's lights and background, the camera's rig round it — what the player builds toward. ⭐ Settled here, once: the
   SCALE (`unitM`; against `Scene_1`'s cube, §4), where it stands on the floor, the LIGHTS and SHADOWS, the BACKGROUND, the materials as Babylon draws
   them (glass, chrome, wood; the axes and nothing inside out). ⛔ **GATE: the owner's look** (the browser, then the device).
   ⭐ Found at `Scene_2`'s look (2026-11-13), for every scene: **(a) metal is BLACK without an environment** — a metallic material shows only what
   it reflects; Blender's viewport lights it with a studio image, the game had none. The fix: an environment made for the game, no third-party image,
   no network — `scripts/gen_sky_hdr.mjs` writes `Assets/Environment/sky_sand.hdr` (512 × 256 Radiance RGBE, run-length coded, ≈ 63 KB: a light grey sky tinted blue — the owner: *"the sky is too blue"* —,
   a small bright sun 40° up, warm sand below), loaded by `render/model_import.ts` as a prefiltered `HDRCubeTexture` (`scene.environmentTexture`;
   it lights the glTF's PBR materials only, not drawn as a background); its strength the RENDERING slider **environment** (`envIntensity`, 0 – 3).
   **(b) look with the debug layers** (the `model layers` slider): the look against its collision pieces and proxies — `Scene_2`'s showed two valves
   off their collision: exported in an animation frame, not the goal (`PART_AUTHORING.md` §4.4 item 5).
   ⭐⭐ **(c) THE FRAME RATE, measured here** (the owner, 2026-11-13: *"so this becomes part of the pipeline"*): the four toggles (contact shadows ×
   shadows) on the desktop GPU AND the phone, the table filled; the scene's contact shadows BAKED per part and per pair (switched on when seated, any
   order), the shadow map drawn on events, the model frozen, the quality ladder — `40_RENDER_SCENE/spec/SCENE_SETUP.md` §6. ⛔ **GATE: the table filled,
   the phone at its ceiling or the gap named.** ⭐ During play (W5) the shadows follow the assembly by events — the shadow map on a caster's change, the
   contact shadows on a change of the SEATED set (pick-up, seat, undo, reset): `SCENE_SETUP.md` §6.4, to wire in the playable slice.
4. ⭐⭐ **THE BOOT STAGE — the parts laid out where the player finds them** (the owner: *"also good to have a look at the scene in its boot stage so we
   can lay the parts properly"*): the anchor at its goal, every other part in its boot place (`Scene_2`: the HEAPS, one per type of part, a part never on
   its seating face — `SCENE_2_ASSEMBLY.md` D4), reachable by the orbit, inside the play volume, in view from the boot camera. ⛔ **GATE: the owner's
   look** — the layout is level data, so it is tuned here before any part is played.
5. **W5 — the PLAYABLE SLICE: the level data and what the game must gain**: the slice's parts as bodies (the anchor frozen, the others placeable), the
   boot layout from item 4, the steps as data; the plan's requirements for the game (`SCENE_<N>_ASSEMBLY.md` §5 — `Scene_2`: every part orbited in turn,
   the plunge snap, a ghost read only for its part, a seated face skipped, the orbit's centre per step) built as needed by the slice, each with its vectors.
6. **W6 — the headless proof**: probes walking the slice from boot to goal (`scripts/probes/`), the budget per frame. ⚠ HEAVY: on the owner's go.
7. **W7** — deploy on the owner's word; ⛔ **GATE: the owner's look on the device** closes the slice. Then widen a step at a time, a look each.

### 6.5 Each round, whatever the stage

* `npm run verify:quick` before every commit (the full `verify` in CI); md, commits, deploys only when the owner asks; stage files by path.
* Record the owner's words in the scene's spec, the status in ONE line of `CLAUDE.md` / `QUEUE.md` (their byte budgets: move old lines to `history/`).
