# Handover — the orbit closed, the orbit surface work next (2026-11-22, afternoon)

Read this first in a new session; it supersedes [`HANDOVER_2026-11-22.md`](HANDOVER_2026-11-22.md) §0 – §2 (its §3 working rules and §4 places
still hold).

## 0. Where it stands

* ⭐⭐⭐⭐ **The owner, 2026-11-22 evening:** *"rename branch 1.0.155-Orbits-finalized to 1.0.155-Orbits_with_camera_follow_1 in remote and local. rename branch 1.0.156-Orbit-surface to 1.0.156-Orbits_with_camera_follow_final in remote and local. Mark in the md files that this branch is the best implementation of the orbit so far. then create branch 1.0.157-Orbit_surface and move to this new branch."* → branch **`1.0.156-Orbits_with_camera_follow_final`** (pushed; renamed from `1.0.156-Orbit-surface`),
  LIVE main **`3b7a479`** = **`2cd1be34`**, is **the best implementation of the orbit so far** — the reference that must never regress
  ([`UPRIGHT_LESSONS.md`](../../40_RENDER_SCENE/spec/UPRIGHT_LESSONS.md) §3): the orbit on charts and the camera follower CLOSED this afternoon (*"Record
  that the orbit charts and camera follow work is closed and this is the best implementation so far"*; LIVE `40b8095` = `b21b667`, its branch now
  **`1.0.155-Orbits_with_camera_follow_1`**, renamed from `1.0.155-Orbits-finalized`; its last change D-H20,
  [`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §19) + D-H23 and D-H24 (below, §20). **2321 vectors.**
* ⚠ **His amendment (2026-11-22 ~15:00, on `40b8095`) — ROOT FOUND the same evening on his PC play records** (six, `.recordings/`, 33 marks): the back
  and forth he still saw (`Scene_0bis`'s faces, `Scene_1`'s vertical edges at a fast orbit — *"not here in previous branches builds … not seen at low
  orbit speed"*) is a far turn with the gizmo WAITING at the edge, on every face and at every distance (his first impression of the back being worse set
  aside on his word). The root: R5's D-H15 as built reads the jump between two PLACES (last frame's calm), so the calm's share ramp crossed in one big
  step reads as a jump — a pace threshold, §18.4's Root 1 again ([`CAMERA_FOLLOWS_GIZMO.md`](../../40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md) §20).
  ⭐ On his order (*"proceed with the fix and tests without asking me questions"*), on `1.0.156-Orbit-surface` (now `1.0.156-Orbits_with_camera_follow_final`; ⭐ DEPLOYED on his word *"update the md files, deploy"*, 2026-11-22 16:49Z: LIVE main `3b7a479` = `2cd1be34`):
  `ea3a28a1` docs (the revert point) → `9147bd2e` **D-H23** (the jump read at ONE place, `followJumpAtPlace`, 0 = `40b8095` bit for bit) → `e53b3c39`
  docs → `9e82618a` **D-H24** (the taut leash at his finger's pace, `followLeashPace`, 0 = `9147bd2e` bit for bit) → the as-built docs. On his records
  replayed: far turns 43 → 1, the gizmo's waits 325 → 145 frames, the camera never faster than his finger (§20.9). verify **2321**. ⭐ His verdict: the best so
  far (above); open: the waits left, a cap at 520°/s over his own spins (his word).
* **The workfront:** ⭐ since 2026-11-22 evening the worktree `../orbit_surface`, branch **`1.0.158from1.0.157-Orbit_surface`**, made from
  **`1.0.157-Orbit_surface`** (pushed; made from `1.0.156-Orbits_with_camera_follow_final`; the main folder `3d_assembly_game` stays on it). ⭐ 2026-11-22 night: S2, the READOUT, built, audited,
  fixed and gated there; ⭐ 2026-11-23: S3, the mouth's hold restricted, built and gated (`d4b6c222`, [`ORBIT_SURFACE_MOUTH_HOLD.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_MOUTH_HOLD.md)); S2 DEPLOYED on his word (LIVE main `ff41fc3` = `5d30edf5`), then S3 (LIVE main `e80a7b0` = `1bc13f70`, the branch pushed); S4, P2 drives the gizmo, built, gated and DEPLOYED (LIVE main `86a0e53` = `664f9c53`, [`ORBIT_SURFACE_DRIVE.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_DRIVE.md)) → [`ORBIT_SURFACE_READOUT.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_READOUT.md) §14 — his look owed.
* **No longer owed** (closed with the orbit — future improvements only, on his word): FO3's open points ([`FAST_ORBIT.md`](../../40_RENDER_SCENE/spec/FAST_ORBIT.md)
  §12), the lean audit, D-R1's re-crossing study ([`TOP_BOTTOM_STUDY.md`](../../40_RENDER_SCENE/spec/TOP_BOTTOM_STUDY.md) §10), close in's own turns
  (`CAMERA_FOLLOWS_GIZMO.md` §19.4), R5's far strokes pinning the gizmo at a pole ([`PICTURE_REBUILD.md`](../../40_RENDER_SCENE/spec/PICTURE_REBUILD.md)).
* **After the surface work:** RND6, the iPhone's black screen ([`RND6.md`](RND6.md); diagnosed, not fixed).

## 1. The orbit surface work — read in this order

0. The queue rows [`RND7.md`](RND7.md) (this work) and [`RND8.md`](RND8.md) (its handed findings); [`ORBIT_SURFACE.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE.md)'s
   header — its 2026-11-22 evening block: what changed since it was written; [`ORBIT_SURFACE_BUILD.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) §9 —
   the terms the closed orbit sets for the wiring.
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

✅ **ASKED 2026-11-22 evening, all answered** → [`ORBIT_SURFACE_BUILD.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) §2bis. **His words still owed** (the ledger's review): the catalogue's grid (`ORBIT_SURFACE.md` §3.0) and §5.2's two words; the thresholds NARROW (10°) and
BESIDE (10 mm), with B4; the map's representation (no grid — one phone measurement first, at the wiring step); the ghosts and markers against the
collision pieces (one measurement before the plunge is built); the frozen plinth of `Scene_2` (does a held part pass through it in the pick-up flow?).
**The charts' step B** (`ORBIT_CHARTS.md` §5.3 — the normal of the shape with its edges rounded, at the gizmo's place) belongs to this work
(`ORBIT_SURFACE.md` §1.1).

## 2. Rules for this work

* The working rules, unchanged → [`HANDOVER_2026-11-22.md`](HANDOVER_2026-11-22.md) §3: lean packets; ONE headless job at a time; never read drive E:;
  deploy only on his word (the recipe there — push the CURRENT branch, not `1.0.153-`); commits by path; docs before build; root cause before patch;
  one switch per change, 0 = the build before frame for frame.
* ⛔ **Every lesson of this work → a RULE of construction or drawing, written for a script, then its check** (the owner, 2026-11-22 — to automate
  the scene's construction and the parts' drawing in Blender later): [`SCENE_WORKFLOW.md`](../../20_GAME_RULES/spec/SCENE_WORKFLOW.md) §10,
  [`PART_AUTHORING.md`](../../30_OBJECTS_3D/spec/PART_AUTHORING.md) §6.4, the ledger `ORBIT_SURFACE_BUILD.md` §8.
* ⛔ **The orbit is closed**: never reopen what drives the gizmo and the piece's orbit, nor the camera. Anything the surface work changes in the picture is
  read against `UPRIGHT_LESSONS.md` row by row and compared with `40b8095` through a switch.
* The kit (outside the repo): `C:/Users/sugit/Documents/_scripts_persos/_Persos/_saved_patches/orbit_chain_2026-11-18/fo3/` — `follow/cap/` the last
  drivers and readers (`walk_c.mjs` serves the main folder; `CHECKPOINT_CAP.md`), `ARCHIVED.md` the closed folders; the runbook
  `scripts/probes/ORBIT_GATES.md`; the surface study's scripts `scripts/probes/surface_study/` (its `library.json`, `sweep.json` gitignored, present).
* The archived lines: the pushed `archive/*` tags (`HANDOVER_2026-11-22.md` §4).

## ⭐ 2026-11-23 night — the state for the morning (his overnight word: *"continue building the orbit's surface pipeline without stopping and without asking me questions. Commit regularly, update the md files with the lessons learned"*)

* **Where**: worktree `../orbit_surface`, branch `1.0.158from1.0.157-Orbit_surface`, head `8be12136`+ (LOCAL — nothing pushed or deployed since `7f69e034`;
  LIVE main `86a0e53`). `npm run verify`: 198 files / 2457 tests.
* **Built tonight**: S6 packets 2 – 3 (`proxy_cover.ts`, `collision_cover.ts` — coverage, closure, caps; the collision pieces both ways, the resting
  candidates); THE ONE COMMAND `scripts/surface/check_scene.ts` (the export gate: `Scene_2` FAIL), `scene_gate.py`, `rules_constants.json`; R2 against
  the ρ-closing; C4's guard; `ORBIT_SURFACE.md` §5.3's shapes in the landing map's vectors. The lessons: `PROXY_AND_COLLISION_RULES.md` §9.3, §9.5.
* **For his word**: B3 / B5's three questions (`ORBIT_SURFACE_PART_CHECKS.md` §14); the one command (`SCENE_WORKFLOW.md` §9.3, built on its proposal —
  reversible); the resting share ¼ (PROPOSED); `Scene_2`'s findings (ledger rows 14 – 20: the file or the rule — not rebuilt here); a deploy of S4b
  (the stutter fix) for his phone look.

## ⭐ 2026-11-24 — his answers, the deploy, the rest of the work

* **His word**: *"do 1, 2 and 3 and 5 as you recommend. Scene 2 need a separate work in a separate worktree. Then finish the orbit's surface work."*
  B3 / B5's questions, the one command, the share ¼ DECIDED (`bd5e69b4`); `Scene_2`'s findings → queue row `GM13` (its own worktree, not opened).
* **Deployed**: S4b — LIVE main `6a2da88` = `bd5e69b4` (2026-11-24 02:35Z); his phone look owed (the alignment tap).
* **The rest of the surface work**: the packets S7 – S13 → [`ORBIT_SURFACE_BUILD.md`](../../40_RENDER_SCENE/spec/ORBIT_SURFACE_BUILD.md) §10.

## ⭐ 2026-11-24, later — the rest of the surface work built (S7 – S13, `ORBIT_SURFACE_BUILD.md` §10)

* **Where**: `../orbit_surface`, `1.0.158from1.0.157-Orbit_surface`, head `99b74304`+ (LOCAL past `bd5e69b4` = LIVE main `6a2da88`). `npm run
  verify`: 199 files / 2483 tests.
* **Built** (each with its vectors, its mutants red, its record — `ORBIT_SURFACE_PART_CHECKS.md` §15 – §20): S7 B3 + B5 (where each part lands at
  each stage, the faces no place and why); S8 B4's second half (does a way in start at a place — the reading PROPOSED); S9 B6's margins (2 mm,
  0.05 — PROPOSED); S10 C2, the landing map's cost per stage (the budget PROPOSED); S12 `void_sim`'s families; S13 B1's cheap subset at import (the
  game's `model_import.ts`, a HUD warning). THE ONE COMMAND now runs four checks (`check_scene.ts`). S11 (L1 in the game) STUDIED only.
* **For his word**: S11's three questions (`ORBIT_SURFACE_L1.md` §6); the PROPOSED readings and margins (B4's start at a place and its rule C5,
  B6's two margins, C2's budget and the drawing rule D9); `Scene_2`'s new findings for `GM13` — the frozen plinth NO PLACE in the face map (ledger
  row 21), TEN ways in starting at no place (row 22), the TOP facet just above the share (row 23), P2's cost 3 203 × `Scene_1`'s (row 7: P2 cannot
  drive `Scene_2` as drawn); his phone look on S4b; a deploy of S13 (a HUD warning at load — nothing changes on `Scene_2`).

## ⭐ 2026-11-24, later still — S7 – S13 DEPLOYED (his word *"Deploy"*)

* **LIVE main `19c7f88`** = `16f3c845` (2026-11-24 10:48Z; the branch pushed). In the game only S13 (the scene's collision pieces re-checked when a `.glb`
  loads: a HUD warning, never a refusal; `Scene_2` has none — its HUD unchanged); the rest rides offline. His phone look owed (S4b's alignment tap).
* **His two questions** answered in plain words and recorded: the landing map's cost — WHEN it is paid (`ORBIT_SURFACE_PART_CHECKS.md` §19,
  the timing of 2026-11-24); S11 — what it is, the caps, why `Scene_2` and not `Scene_1`, each option's effect, when it runs
  (`ORBIT_SURFACE_L1.md` §7). S11's three questions still wait for his word.

## ⭐ 2026-11-24, afternoon — his two words: S11 *"proceed as you recommend"*; the landing cost *"I do not accept these costs"*

* **S11 DECIDED** (`ORBIT_SURFACE_L1.md` §8): Q1 with `GM13`; Q2 the caps measured with every body first, then behind `surfaceL1` on `Scene_1`;
  Q3 precomputed. Not started: after the landing's engine (one heavy job at a time).
* **S14 PROPOSED** (`ORBIT_SURFACE_LANDING_CAST.md`): the landing read at query time — prototype in the kit's `fo3/surface/cast/` (`proto_cast.ts`,
  `cost_when.ts`; run from `../orbit_surface` with `npx vite-node <path>`; env `F=near`, `N`, `STAGES`). His word owed: build it (recommended), or audit first.

## ⭐ 2026-11-24, evening — the floor is not a part (his rule, repeated); S11's one cap; its build designed

* ⛔ The caps' measure had kept the frozen floor — he had said several times it is no part (*"it is like a UI inside the game scene"*). Rerun
  without it: `Scene_1` has ONE cap, the 13 mm tunnel behind Piece41's goal (`ORBIT_SURFACE_L1.md` §9). Every surface measure leaves frozen bodies out.
* S11's build designed (§10 there): the cap a virtual FILLER glued to the tunnel's walls, precomputed with the scene, behind `surfaceL1` (0 = LIVE).
* S14 (the landing read at query time) still waits for his word.

## ⭐ 2026-11-24, night — S11 deployed; S14 and the ring built and gated; his camera jitters diagnosed

* **LIVE main `df5426a`** = `00e59251` (S11, his word *"deploy"*, 18:51Z). On the branch since (pushed, not deployed): S14 (`landingEngine`, 0 = LIVE —
  `ORBIT_SURFACE_LANDING_CAST.md` §9 – §10), the white ring showing what the gizmo uses (`ORBIT_SURFACE_READOUT.md` §15) — both gated on his records.
* **His camera jitters** (nine play records, `../orbit_surface/.recordings/`): all the closed orbit's — `APPROACH_CAMERA_JITTER.md` (A1 – A3, B, C; five
  fix options, each its own switch). His word owed: A1-a or A1-b; A2-a's band after a way out.

## ⭐ 2026-11-25 — S14 and the ring deployed

* **LIVE main `6f03b65`** = `c6a4ffa5` (his word *"deploy"*, 2026-11-25 02:12Z): S14 behind `landingEngine` (0 = the sums, as before; 1 = the cast) and the
  white ring on the driven gizmo where P2 drives. At the defaults the game is `df5426a`'s but for the ring (G1 bit for bit). His looks owed: S14 at 1,
  the ring; then S14's default and D9's withdrawal. The jitters' fixes wait for his word (A1-a / A1-b, A2-a's band).

## ⭐ 2026-11-25, later — the camera jitters' five fixes built, gated, ported

* His words: *"A1-a and A2-a as you recommend"*, *"make sure you commit these five fixes also in branches 1.0.156 and 1.0.157"*, *"yes, push them too.
  proceed as you recommend. do not ask me further question until you finish those fixes"* → `APPROACH_CAMERA_JITTER.md` §7 (D-J1 – D-J5).
* Five switches, all 0 = LIVE: `pictureHandWhole` (A1-a + D-J5), `pictureBandWayIn` (A2-a), `followParkOwn` (A3-p — A3 corrected by measurement),
  `framedLineGlass` (B-a), `gizmoLagTravel` (C-a). All at 1 on his records: the unlatch's jump 0 mm on 10 / 10, no swing over 2°, the floor's roll
  gone (0 frames over 1°), the ring still while the gizmo is. Ported and pushed: `1.0.157-Orbit_surface` `5eaf3eb4`, `1.0.156-` `4a6a95a1` (§7.8).
* Not deployed. His look owed (all five at 1 on the phone; B-a's band is in screen mm — on the phone's smaller screen mid-distance frames may enter
  it, §7.6); then their defaults.
