# L1 IN THE GAME — THE ASSEMBLY'S SURFACE AS IT GROWS: sealed, buried, the caps between parts (package S11, a study, 2026-11-24)

> **STATUS** · ⏳ **A STUDY — NOTHING BUILT.** Written on his word *"Then finish the orbit's surface work"* (2026-11-24), by his rules (docs before
> build; the four-part method; the closed orbit's terms — [ORBIT_SURFACE_BUILD.md](ORBIT_SURFACE_BUILD.md) §9). **Three questions for his word (§6).**
> **OWNS** · what the game's face map must leave out or add at a seat (layer L1), measured on today's scenes, and the design proposed.
> **READ WITH** · [ORBIT_SURFACE.md](ORBIT_SURFACE.md) §5.1 (L1); [PROXY_AND_COLLISION_RULES.md](../../30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md) §3bis
> (his decision 4, 2026-11-23); [ORBIT_SURFACE_PART_CHECKS.md](ORBIT_SURFACE_PART_CHECKS.md) §9 (B2), §16 (B5). Code read on `f0144df3`.

## 1. The rules (his, and the specification's)

* **L1's invariant** (`ORBIT_SURFACE.md` §5.1): *"a glued, buried or sealed face never present; every point in one face"* — rebuilt at a seat, a
  put-down, an undo.
* **His decision 4** (2026-11-23, §3bis): the stage's surface = the placed proxies LESS the faces glued / buried / sealed (S22) PLUS the caps of the
  hollows formed BETWEEN parts; a seat appends; a face partly covered is split at the cover's edge, each piece ≥ w; coplanar faces merged by the face
  map; offline by B2, in the game by L1 — *glued only today, sealed / buried / caps owed*.
* **The closed orbit** (§9 there): every change behind its switch, 0 = LIVE; a change of the map's faces changes the camera's path — measured, never
  assumed.

## 2. Where the game stands (`render/assembly_wiring.ts`, `placedFaces`)

The face map reads every face of every placed part — goal-locked, not the held one, ⚠ not a FROZEN one (the surface ledger's row 21) — each with its
part (a GLUED face is no surface: R1, 2026-11-09). No face is ever left out for being SEALED or BURIED, and no cap is added between parts.

## 3. Measured (2026-11-24 — `scripts/surface/l1_data_scenes.ts`)

* **Sealed, buried — NONE in today's data scenes**: each scene's plain boxes at their places as one set (B2's states at 2 mm): `Scene_1` 39 boxes
  (241 triangles exposed, 227 glued), `Scene1_demo` 42 (238, 266), `Scene_0` / `Scene_0bis` / `Scene_2`'s data part one each — 0 sealed, 0 buried
  (a data part is ONE convex body, C4: it cannot bury its own face). ⚠ The 7 frusta and prisms of `Scene_1` (2 of `Scene_0`, `Scene_0bis`) left out.
  → **That half of L1 changes nothing on today's data scenes**; on `Scene_2` (a `.glb`) ⚠ (corrected 2026-11-24, §7) B2 reads E03's nose GLUED once E17 seats —
  nothing sealed — and E17's proxy half BURIED because it faces inward, a drawing defect (`ORBIT_SURFACE_PART_CHECKS.md` §9).
* **Caps between parts — they WOULD change `Scene_1`**: packet 2's R1b on the set as ONE part reads 4 places deeper than their mouth is wide on
  `Scene_1`'s boxes (≈ 501 680 mm², 279 s), 2 on `Scene1_demo`'s (≈ 21 912 mm²). ⚠ Not yet trusted: the frusta's and prisms' sockets are empty in
  that set (the largest place, ≈ 304 725 mm² with no straight way out, may be one) — the measure needs every body first.

## 4. The design (⏳ PROPOSED)

1. **Precomputed, offline, per placed set** — the audit's 7.1 (7) (*"stage caps precomputed"*): B2's walk (4 mm, ≈ 5 s on `Scene_2` — too slow for a
   seat on the phone) and R1b on each stage's union, written with the scene (`<scene>_stages.json`: per placed set, the faces left out and the caps);
   the game reads its placed set's line at a seat, a put-down, an undo. The placed set's key: the parts at their goals (the plan's order within a step
   may vary: 2^k sets for k parts of one step — the pistons' banks, 3 → 8).
2. **In the face map** — the faces left out never reach `buildFaceMap` (`placedFaces`); the caps join it as faces of a VIRTUAL part (`real` false: no
   share, no landing — P2 reads the collision pieces, a cap is no solid: S3's H1, *never a hold on a cap*, already reads caps).
3. **Behind a switch** (`surfaceL1`, 0 = LIVE `6a2da88`); G1 his records at 0 identical; at 1 on `Scene_1` the camera's path measured against 0.

## 5. Obstacles and fallbacks

* The data scenes have no `.glb`: their stages computed from the descriptor (the bodies' hulls — the same as S2's readout reads).
* A put-down OFF its goal is no placed part (no stage change); an undo returns to the previous set's line.
* No line for a placed set (a file older than its scene): today's face map (as LIVE), said on the HUD.

## 6. For his word (three questions)

* **Q1** — sealed and buried (no effect on today's data scenes; `Scene_2` only): build it now behind its switch, or with `GM13` when `Scene_2` runs
  with the charts (⏳ recommended: with GM13 — nothing on today's scenes can show it working, and `Scene_2` has never been played with the charts).
* **Q2** — the caps between parts: they would change `Scene_1`'s surface (the closed orbit — the channel, the slots): in the game on every scene, only
  on scenes authored in Blender (their `_cap` faces), or not (P2 and S3's mouth hold read the voids already)? (⏳ recommended: first measure with
  every body, then his look on a build behind the switch on `Scene_1`.)
* **Q3** — the precompute (`<scene>_stages.json` with the scene, §4.1) or a fast L1 in the game.

## 7. In plain words (his question 2026-11-24: *"explain in layman's terms … when that S11 will run"*)

**What it is about.** The gizmo — and the camera that follows it — travels over the assembly's SKIN: the face map, made from the faces of the
parts already placed. When a part is seated, the skin must change. Today one change is made: two faces pressed together (GLUED) leave the skin.
S11 adds the other two the rules ask for: a face SEALED in a closed pocket, or BURIED inside another part, leaves it too; and a narrow hollow formed
BETWEEN parts gets a CAP.

**The caps.** A cap is an invisible lid over the mouth of a hollow that is deeper than its mouth is wide (his rule of 2026-11-23). The skin passes
over the lid like a bridge instead of following every wall down and up; the piece can still go INTO the hollow where it fits — P2 reads the depth
under the lid (S4). A hollow inside ONE part is capped by that part's own drawing (`_cap`, rule R1b); S11 is about the hollows that only exist once two or
more parts are side by side — a gap between two boxes, a slot between three.

**Why `Scene_2` and not `Scene_1` — and a correction.** ⚠ §3 first said B2 found E03's nose SEALED once E17 seats: wrong — B2's pinned
result (`ORBIT_SURFACE_PART_CHECKS.md` §9, V3) reads it GLUED (pressed by E17, 14 of 16 triangles) and NOTHING SEALED in any scene. The only
BURIED faces are half of E17's own proxy, because that half faces INWARD — a drawing defect (B1f, the ledger's rows 14 – 15) that `Scene_2`'s
redraw (`GM13`) fixes. `Scene_1`'s parts are simple solids set side by side, each ONE convex body (boxes, a few frusta and prisms): one can press on
another (glued) but its boxes close no pocket round another's face nor sink into it (measured on the boxes, §3). **So the sealed / buried half has no real case today, on either scene**; built now, it would only hide E17's
inward faces — a defect the drawing must fix. The caps are the other way round: they DO concern `Scene_1` — its gaps between boxes (the 10 mm
slots near the bottom, maybe the top channel; 4 hollows deeper than wide were found, not yet trusted: the frusta and prisms were left out of that
measure and their empty sockets may have been counted).

**Each option's effect.**

| | `Scene_1` | `Scene_2` |
|---|---|---|
| Q1 sealed / buried — now | no change (it has none) | no real case; it would hide E17's inward proxy half (a drawing defect) — and `Scene_2` does not run with the charts yet |
| Q1 — with `GM13` (recommended) | no change | built with the redrawn parts, when `Scene_2` runs with the charts and a real case can be seen |
| Q2 caps — every scene | ⚠ changes: the gizmo and the camera bridge its gaps (the closed orbit's path — measured first) | lids over its between-parts hollows (not measured yet) |
| Q2 — only scenes made in Blender | no change (described in the game's code, not in Blender) | lids written by the scene's build |
| Q2 — not at all | no change | no lids: the hollows stay open in the skin, as today (P2 and the mouth's hold already read them) |

**When it runs.** Never during the orbit's frames: the skin changes only when the set of placed parts changes — a seat, a put-down, an undo.
* **Q3 precomputed** (recommended in §4): the work is done ONCE on the PC when the scene is exported (seconds to minutes), saved in a file beside
  the scene; the game reads the file at BOOT with the scene, and at each seat it LOOKS UP the line for the new placed set — instant.
* **Q3 in the game**: the work is done AT EACH SEAT on the phone — today's methods on this PC: the hidden faces ≈ 0.3 s a seat (B2: 5 s for
  `Scene_2`'s 17 stages), the caps MINUTES (R1b: 279 s on `Scene_1`'s boxes); the phone slower — a freeze at every seat until a far faster method
  is found.
