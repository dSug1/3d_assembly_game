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

1. **The render mesh** — the look; what a finger taps (`D50`).
2. **`UCX_<part>_NN` — the collision pieces**: a few convex pieces, only where the plan inserts or rests (a bore as a ring of pieces, or squared),
   as `BLENDER_COLLISION_AUTHORING.md` specifies. Absent: the hull at spawn.
3. ⭐ **The face proxy — NEW, not yet specified**: a hidden flat-faced stand-in where the plan's SEATS and GIZMO ROUTES are (a bore as a 6- or 8-sided
   prism, a round seat as one flat disc face) — what the face map builds its facets from, so the gizmo RUNS on it and a part RESTS on it. ⚠ Its name
   (e.g. `UFM_<part>`) and its rules (convex or not, which faces count, how it meets the render mesh, what replaces it at the face map) are written
   here before it is built.
4. **The seating points** — an empty per seat of the plan, at a position with an OUTWARD normal and a twist reference: a MATE CONNECTOR
   (`core/mate_connector.ts`), named after the plan's step.
5. **The goal is the authored pose** — a scene is authored ASSEMBLED, so each part's goal is where it sits; where it BOOTS is level data (as
   `Scene_1`'s `BOOT_MOVES`).
6. **Units and axes** — the scene's `unitM`; +Y up at the export (`BLENDER_ASSETS.md` §3).

## 4. ⭐ The check script (W3)

Reads the `.blend` back against the plan, and refuses, NAMED, what breaks a convention: every planned seat has its two flat faces and its two
connectors, anti-parallel at the goal; every collision piece is convex and closed; every proxy face is flat; every part the plan names exists and
nothing unplanned carries a proxy. ⛔ A skipped check is announced (`00_CORE/METHOD.md`).

## 5. A scene's own reference animation

A scene may come with an animation of the assembled object (a machine running, a mechanism turning). ⭐ The parts are still while they are assembled; the animation
is a REWARD at the level's end (`20_GAME_RULES/spec/LEVEL_END.md`), built last — its moving parts are then the plan's parts, so the plan's
granularity must allow it (a part that moves in the animation is one part, or a known group).
