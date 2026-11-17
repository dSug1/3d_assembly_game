# THE ORBIT'S SURFACE — THE BUILD, STARTED IN PARALLEL (2026-11-17)

> **STATUS** · ⭐ **S0 and S1 LAUNCHED 2026-11-17** (Opus agents, a builder then an independent auditor each; local commits; **nothing wired, no existing
> game file changed**). **OWNS** · the record of the surface build: the owner's words, the parallel rule, the merge order, each package as briefed and
> as built, the notes for the merges. **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) (the specification — its decisions are PROVISIONAL, to be
> tested), [ORBIT_SURFACE_SHAPES.md](ORBIT_SURFACE_SHAPES.md) (the shapes study), [ORBIT_SURFACE_AUDIT.md](ORBIT_SURFACE_AUDIT.md).

## 1. The owner's words (2026-11-17), and what they amend

**He asked:** *"In parallel, can we start working on the orbit's surface in the other worktree, keeping in mind that all three worktrees will have to
merge at different times into the 3d_assembly_game worktree?"* It amends his sentence of 2026-11-16 (`ORBIT_SURFACE.md` §0, end: no rebuild work on
the surface before `orbit_charts` is merged).

**The answer given to him:** yes for the OFFLINE part, under the rule of §3; everything wired waits for the merge; three questions the specification
kept for this moment were asked again (§2). **His reply:** *"Agree on all three. Proceed with the"* — the message ends there; it is read as: proceed
with what was proposed to him (this record, then the landing map launched as an Opus builder followed by an Opus auditor).

## 2. The three answers (*"Agree on all three."*)

| # | the question (`ORBIT_SURFACE.md` §8, end) | the recommendation he agreed with |
|---|---|---|
| 1 | The six layers L0 – L5 (§5.1) were still only proposed: accepted? | **ACCEPTED — to be tested**, like the other decisions. Still owed: his word on the catalogue's grid (§3.0) and on §5.2's two words ("nothing to land on", "approached") |
| 2 | A goal's way in: is *"a free direction into the seat exists"* enough, or must the check also prove that the player can bring the piece to where that slide starts? | **The first test is enough for now**; the second once the landing map exists (it needs B3 and B5) |
| 3 | The entry-set check was run on boxes only: run it on `Scene_2`'s real collision pieces before the first surface build? | **Yes** — package S0, before S1 |

## 3. The parallel rule — what keeps the merges clean

* **Measured 2026-11-17:** this branch (`1.0.146s-Orbit-surface-spec`, from `1190db2`) and the charts' branch (`1.0.147-`) touch NO file in common, and
  a trial merge of the two (`git merge-tree`) is clean. This branch so far: its three documents, `scripts/probes/surface_study/` (new), and two
  workflow documents edited (`SCENE_WORKFLOW.md`, `PART_AUTHORING.md`).
* ⛔ **THE RULE: until `orbit_charts` is merged into `3d_assembly_game`, this branch ADDS NEW FILES ONLY.** It edits no existing file but its own
  documents (`ORBIT_SURFACE*.md`). Where a test demands a one-line registration in an existing file, that line is the only exception, and it is
  listed in §6.
* **The PC carries one heavy job at a time** and the charts' chain is running its headless gates: here no headless run, no dev server, no Blender
  run; single-process offline scripts (`npx vite-node`, under 3 minutes) and single test files; `npm run verify` once per package.
* **What waits for the merge** (each edits files the charts' work is changing): the READOUT beside today's depth on `Scene_1`; the mouth's hold
  restricted (Q4); the landing map driving the gizmo; the footprint support re-expressed on it; the queue rows for the findings handed over (F17,
  the mouth's lip, the drop in contact range). **Not launched now:** the Blender checks B1, B2, B4 (§7bis of the specification) — to be written
  and RUN together, when a Blender run does not compete with the chain.
* **So the parallel work saves the offline part only**: the first thing the owner can see on the phone (the readout) still comes after the merge.

## 4. The order of the merges

1. `orbit_charts` (`1.0.147-`) into `3d_assembly_game` (`1.0.145-`) — after its build chain, the owner's look and its step 3.
2. This branch brought onto that merged code (that code merged INTO this branch), the wiring built here on it, then this branch into
   `3d_assembly_game`.
3. `1.0.146b-GL-context-recovery` (the dossier RND6) last — today it changes the queue file, its dossier and its own probes.

The throwaway `1.0.146t-Orbit-charts-test-scenes` is never merged.

## 5. The packages as briefed

**S0 — the entry-set check on `Scene_2`'s real collision pieces** (a study with measurements; no game code). For every part of `Scene_2`, at the
stage of the assembly plan where it is placed: the ENTRY SET of its goal (`ORBIT_SURFACE.md` §2.5 — the directions along which the part, withdrawn
from its seated pose, touches no placed part), computed on the `UCX_` pieces read from the `.glb`, not on boxes: its share of the sphere, its narrowest
opening, EMPTY or NARROW flagged; compared with what the assembly plan and the authored ghosts say; what the check cannot see, said. One offline
script beside the study's, one document.

**S1 — the landing map, layer L2 (P2), as a pure function — NOT wired** (`ORBIT_SURFACE.md` §2.2 P2, §5.1, §5.3; the first item of §6's build
list). Per facet direction: the layered depth of the placed parts, and the first contact of the HELD PIECE as held, moved along the facet's normal —
exact from the convex collision pieces, one operation for voids and protrusions, "nothing to land on" a stated value, read from outside or from a
given depth. Its vectors against a second implementation (the study's brute-force reading) on the study's shapes, for two pieces; the same after a
shape is moved and turned, and for every order of its parts; each vector shown red on a mutant. Its cost measured (the time to build a map for a set
like `Scene_1`'s), as a figure for the wiring step. A new file under `src`, a new test file, new helpers; nothing calls it yet.

## 6. Notes for the merges (filled by the packages)

* (none yet)

## 7. As built (filled by the packages)

* **S0 — MEASURED 2026-11-17** (the builder; the auditor's verdict to follow) → [ORBIT_SURFACE_SCENE2_ENTRIES.md](ORBIT_SURFACE_SCENE2_ENTRIES.md).
  Files ADDED only: `scripts/surface/scene2_entries.ts` (the run), `entry_geom.ts` (exact: a ray against each pair's Minkowski difference, the
  game's contact rule and skin), `entry_selfcheck.ts` (14 known answers, the study's own L05 / L03 / Q07 / L19 among them), and that document.
  **The result: no goal of `Scene_2` is shut; the plan's way in is free for all sixteen; the six pistons are NARROW (1.9° – 2.7° round their bore,
  as the plan's ONE axis); the ghosts differ from the collision pieces by each part's seat marker's offset from its `UCX_` pieces, to 0.1 mm (pistons
  10 mm, heads 17 mm, crankshaft 2 mm) — a question for the owner.** Nothing wired, no game file changed, no registration line needed (§6 unchanged).
* **S1 — THE DESIGN, written before the code** (2026-11-17, the builder) → [ORBIT_SURFACE_LANDING_MAP.md](ORBIT_SURFACE_LANDING_MAP.md): the
  signature, the units and frames, the algorithm (the union of the convex pairs' Minkowski sums as half-spaces, cast along the normal) and why it is
  exact, the tie key, "nothing to land on" a kind with no depth, the lookup and its error. As built: to follow.
