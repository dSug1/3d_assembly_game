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
| **W0** | **The brief** | the object; its reference (a sheet, a preview, photos); what the level is FOR; the phone's limits (§4) | the owner | the owner's go |
| **W1** | ⭐⭐ **THE ASSEMBLY PLAN** (§2) | the parts catalogue and the steps, on paper, in the scene's spec (§5); a sketch per step where needed | Claude drafts, the owner decides | ⛔ **the owner's approval** — nothing after it starts before |
| **W2** | **The geometry spec** | per part, DERIVED from the plan: what the render mesh shows, its collision pieces, its flat faces (the face proxy), its connectors, its goal; the naming | Claude, from the plan | the owner's approval (the conventions once for all scenes; a scene's sheet each time) |
| **W3** | **The Blender build** | a RE-RUNNABLE script (`Assets/Blender/scripts/build_<scene>.py`) making the `.blend` from the reference and the plan, and a CHECK script reading it back (§3) | Claude builds; the owner edits the `.blend` | the check script clean; the owner's look in Blender |
| **W4** | **The export and the import** | the `.glb`; the loader reads it and REFUSES, named, what breaks a convention (`3D4`) | Claude | vectors on the loader; the import of the slice |
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

| step | part | host(s) | seat: part face ↔ host face | approach | turn at the goal | gizmo route | after | notes |
|---|---|---|---|---|---|---|---|---|
| e.g. 3 | `P04` shaft | `P03` frame | its two journals ↔ the frame's two saddles | straight down, 30 mm | fixed by its flats (1 way) | the frame's top face, then into the saddles | 2 | |

* **host** — the placed part(s) it rests on or goes into.
* **seat** — the pair of FLAT faces that touch at the goal (or the connector pair): their normals anti-parallel (`30_OBJECTS_3D/INDEX.md` rule 1).
  ⭐ The part's seat face is its RESTING face while it is orbited (as the green piece's largest face is today).
* **approach** — the last straight move into the goal: its axis and length (an insertion: the depth; a resting part: none). ⭐ An insertion often
  has ONE axis only (where the opening, the part's own shape and what it seats on line up): the plan NAMES it, and W2 designs for it the FACE the
  part slides on to reach the opening and the flat seat at the end (`Scene_2`'s pistons — `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md` §2.6).
* **turn at the goal** — how many orientations fit (the twist; a symmetry).
* **gizmo route** — the faces of the assembly-so-far the orbit runs over to reach the goal: they must be EXPOSED faces at that step.
* **after** — the steps that must be done before (a partial order: several orders may be valid).

### 2.3 ⛔ The rules a plan must pass (on paper at W1; as vectors on the data at W5; as probes at W6)

1. **An order exists** — the `after` graph has no cycle; every host is pre-placed or placed at an earlier step.
2. **Access** — at its step, a part's way in (the approach, and the orbit's route before it) is not closed by a part placed before: nothing is placed
   INSIDE what is already closed.
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
* **the face proxy** (a name to be fixed, e.g. `UFM_<part>`) — flat faces exactly where the plan's SEATS and GIZMO ROUTES are; nothing elsewhere;
* **the connectors** — an empty per seat (position, outward normal, twist reference), named after the plan's step;
* **the goal** — the authored pose (the `.blend` is authored assembled); the boot is level data.

⭐ The CHECK script (W3) reads the `.blend` back against the plan: every planned seat has its two faces and connectors, the normals are anti-parallel at
the goal, every collision piece is convex, every proxy face is flat — and refuses, named, what is not (a skipped check is announced — `METHOD.md`).

## 4. ⛔ The limits every plan is written against

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
