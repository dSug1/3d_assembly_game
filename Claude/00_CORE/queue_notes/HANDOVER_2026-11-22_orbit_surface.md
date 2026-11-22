# Handover — the orbit closed, the orbit surface work next (2026-11-22, afternoon)

Read this first in a new session; it supersedes [`HANDOVER_2026-11-22.md`](HANDOVER_2026-11-22.md) §0 – §2 (its §3 working rules and §4 places
still hold).

## 0. Where it stands

* ⭐⭐⭐ **The owner, 2026-11-22:** *"Record that the orbit charts and camera follow work is closed and this is the best implementation so far. We will
  then move to the orbit surface work."* → **the orbit on charts and the camera follower are CLOSED.** LIVE main **`40b8095`** = **`b21b667`** on
  branch **`1.0.155-Orbits-finalized`** (pushed; renamed on his word from `1.0.155-Camera_back_and_forth_at_the_cap_edge`, the name the deploy commit
  carries) is **the best implementation so far** — the reference that must never regress
  ([`UPRIGHT_LESSONS.md`](../../40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) §3). Its last change: D-H20, the far turn aimed where the gizmo waits
  ([`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §19). **2308 vectors.**
* ⚠ **His amendment (2026-11-22 ~15:00, on `40b8095`) — ROOT FOUND the same evening on his PC play records** (six, `.recordings/`, 33 marks): the back
  and forth he still saw (`Scene_0bis`'s faces, `Scene_1`'s vertical edges at a fast orbit — *"not here in previous branches builds … not seen at low
  orbit speed"*) is a far turn with the gizmo WAITING at the edge, on every face and at every distance (his first impression of the back being worse set
  aside on his word). The root: R5's D-H15 as built reads the jump between two PLACES (last frame's calm), so the calm's share ramp crossed in one big
  step reads as a jump — a pace threshold, §18.4's Root 1 again ([`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20).
  ⭐ His order: the docs committed, then the fix **D-H23** (the jump read at one place, switch `followJumpAtPlace`, 0 = `40b8095`) built and gated on
  `1.0.156-Orbit-surface` (local — a failure is reverted to the docs commit); not deployed (his word).
* **The workfront:** the MAIN folder `3d_assembly_game` (the only worktree), branch **`1.0.156-Orbit-surface`**, made from `1.0.155-Orbits-finalized`
  (local, not pushed — start from `1.0.155-Orbits-finalized` elsewhere).
* **No longer owed** (closed with the orbit — future improvements only, on his word): FO3's open points ([`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md)
  §12), the lean audit, D-R1's re-crossing study ([`TOP_BOTTOM_STUDY.md`](../../40_RENDER_SCENE/spec/TOP_BOTTOM_STUDY.md) §10), close in's own turns
  (`CAMERA_FOLLOWS_GIZMO.md` §19.4), R5's far strokes pinning the gizmo at a pole ([`PICTURE_REBUILD.md`](../../40_RENDER_SCENE/spec/PICTURE_REBUILD.md)).
* **After the surface work:** RND6, the iPhone's black screen ([`RND6.md`](RND6.md); diagnosed, not fixed).

## 1. The orbit surface work — read in this order

1. [`ORBIT_SURFACE.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE.md) §0 (one page): what the surface aims at. ⛔ Its decisions are PROVISIONAL — to be
   tested, and may be reversed by the testing (§8). Its header's condition (*nothing built before the charts are finished and merged*) is **MET**.
2. `ORBIT_SURFACE.md` §8, its end: **what to ask him again when the surface work starts — ask before building anything.**
3. [`ORBIT_SURFACE_BUILD.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md), the ledger: §4 the merge order (**done** 2026-11-22: `1.0.146s-`
   merged into `1.0.154-`), §5 the packages as briefed, §7 as built — S0 (the entry sets on `Scene_2`'s real collision pieces) and S1 (the landing
   map, `src/core/landing_map.ts`, **NOT wired**: nothing calls it), the review's five points (§7, end), §8 FINDINGS → CHECKS.
4. [`ORBIT_SURFACE_LANDING_MAP.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_LANDING_MAP.md) (S1's design; §10.9 the representation proposed: no grid),
   [`ORBIT_SURFACE_SCENE2_ENTRIES.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_SCENE2_ENTRIES.md) (S0),
   [`ORBIT_SURFACE_SHAPES.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_SHAPES.md), [`ORBIT_SURFACE_AUDIT.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_AUDIT.md).
5. The scene workflow's checks: [`SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §8 – §9 (the reach check
   `check_parts_reach_their_seat.ts`; every surface finding about a scene becomes a check).

**His words still owed** (the ledger's review): the catalogue's grid (`ORBIT_SURFACE.md` §3.0) and §5.2's two words; the thresholds NARROW (10°) and
BESIDE (10 mm), with B4; the map's representation (no grid — one phone measurement first, at the wiring step); the ghosts and markers against the
collision pieces (one measurement before the plunge is built); the frozen plinth of `Scene_2` (does a held part pass through it in the pick-up flow?).
**The charts' step B** (`ORBIT_CHARTS.md` §5.3 — the normal of the shape with its edges rounded, at the gizmo's place) belongs to this work
(`ORBIT_SURFACE.md` §1.1).

## 2. Rules for this work

* The working rules, unchanged → [`HANDOVER_2026-11-22.md`](HANDOVER_2026-11-22.md) §3: lean packets; ONE headless job at a time; never read drive E:;
  deploy only on his word (the recipe there — push the CURRENT branch, not `1.0.153-`); commits by path; docs before build; root cause before patch;
  one switch per change, 0 = the build before frame for frame.
* ⛔ **The orbit is closed**: never reopen what drives the gizmo and the piece's orbit, nor the camera. Anything the surface work changes in the picture is
  read against `UPRIGHT_LESSONS.md` row by row and compared with `40b8095` through a switch.
* The kit (outside the repo): `C:/Users/sugit/Documents/_scripts_persos/_Persos/_saved_patches/orbit_chain_2026-11-18/fo3/` — `follow/cap/` the last
  drivers and readers (`walk_c.mjs` serves the main folder; `CHECKPOINT_CAP.md`), `ARCHIVED.md` the closed folders; the runbook
  `scripts/probes/ORBIT_GATES.md`; the surface study's scripts `scripts/probes/surface_study/` (its `library.json`, `sweep.json` gitignored, present).
* The archived lines: the pushed `archive/*` tags (`HANDOVER_2026-11-22.md` §4).
