# PLAYABILITY — what the scene lacks to be a usable game, and the order to build it

> **STATUS** · ⛔⛔⛔ **THE BUILD PROGRAM — build NOW, before anything else** (the owner, 2026-09-27:
> *"Capture all this in the md files (in particular in queue md file) to be built immediately now
> before anything else. I agree with your order."*)
> **OWNS** · the gap analysis of the SCENE (not the shell: intro, menus, worlds are `GM6`–`GM8`)
> and the order of rows `3D6` → `GM1` → `3D7` → `3D2`'s approach → `GM9`
> **READ IF** · you are choosing what to build next

## The order, as agreed

| # | row | what | spec |
|---|---|---|---|
| 1 | **`3D6`** ✅ BUILT 2026-09-27, unjudged | ⛔⛔ **COLLISION** — no body penetrates another: translation STOPS and SLIDES; rotation CLAMPS on the same axis (never slides, never switches axis); snapping and seated rules; broad phase; blocked feedback. ⭐ Modular: shape source and bounds source are interfaces, today the hull at spawn and its box | [`../../30_OBJECTS_3D/spec/COLLISION.md`](../../30_OBJECTS_3D/spec/COLLISION.md) |
| 2 | **`GM1`** (+ the mate) | ⛔⛔ **A GOAL AND ITS DETECTION** — target data per level (which face on which Pioneer, where, which spin), the MATE check against it, a completion detector read from the model, level end (clock and count frozen, result shown). Par per level until the solver (`GM4`) | §2 below |
| 3 | **`3D7`** | **THE PLAY VOLUME** — translation clamped to a volume; a lost part recoverable; + the blocked / snap feedback of `3D6` §6 | §3 below |
| 4 | **`3D2`** (the approach) | the assist that brings a part onto its target — alignment hint on the approach, hold-off; needed badly once collision makes tight fits hard by finger | `APPROACH_AND_MATE.md` |
| 5 | **`GM9`** | **THE PLAYER LAYER IN THE SCENE** — a clean player HUD (episodes, time, par, level) with the debug HUD behind a toggle; held / blocked / correct-target cues for a player rather than a developer; first-level gesture hints; sound and haptics (snap, block, undo, complete); the level in progress saved (IndexedDB) | §4 below |

⭐ Later, and CAPTURED so they are not rediscovered: **`3D8`** — collision shapes authored in
Blender (`UCX_` convex pieces in the `.glb`), replacing the hull at spawn behind the `3D6` seam;
**`3D9`** — bounding boxes authored in Blender, replacing the derived box behind the same seam.
Both → [`../../30_OBJECTS_3D/spec/COLLISION.md`](../../30_OBJECTS_3D/spec/COLLISION.md) §2 and
[`../../30_OBJECTS_3D/spec/MATERIALS_AND_IMPORT.md`](../../30_OBJECTS_3D/spec/MATERIALS_AND_IMPORT.md).

## 1. Collision — the owner's rulings (2026-09-27)

* **Translation: kinematic stop and slide** — ✅ *"ok for translation"*.
* **Rotation: NOT slide, and never switch the axis** — *"i do not want to switch rotation axis if
  there is a collision because quaternion are not commutable and the user cannot go back"*. ⭐ So a
  blocked turn is CLAMPED along its own axis (`Δᵗ`), the excess dropped; the undo is the exact way
  back. ✅ **Clamp**, confirmed by the owner (*"clamp"*) over refusing the whole frame step.
* **Shapes: the hull at spawn and the GJK gap, for now** — modular, replaceable by Blender `UCX_`
  shapes (`3D8`). ⚠ Interim cost: a hole is filled, so insertion waits for `3D8`.
* **Broad phase: a cheap bounding box** — modular, replaceable by an authored box (`3D9`).
* **Snapped vs seated** — *snapped* IS *seated* (the lerp has landed, the Follower is a child of its
  Pioneer); *snapping* is the ~60 ms lerp before it. Aligned: collides, even with its Pioneer, and
  slides along its face to the cursor. Snapping: exempt from its Pioneer, cancelled if it would
  cross a third body. Seated: the assembly is one compound, its members exempt from each other →
  `COLLISION.md` §5.

## 2. The goal — and how the MATE differs from the SNAP

> *"Mate mechanism: what is the difference with snap mechanism? Only the roll rotation around
> followerface normal can differ. Is it what you mean?"* — the owner, 2026-09-27

⭐ **Yes — geometrically, the roll is the whole difference.** The SNAP (`D100`) fixes the
FollowerFace **anti-parallel** to the PioneerFace and its **centre on the cursor**: 5 of 6 degrees
of freedom. The spin about the face normal stays free — that is why a seated Follower can still be
twisted. A MATE (`3D0`'s `MateConnector`, `testMate`) fixes all **6**: the connector frames
coincide, spin included (`rollOrder`, the 3D rule 4: *normals alone leave the roll free*).

⭐⭐ **And one difference that is not geometry: the mate is JUDGED.** A snap joins any face to any
face wherever the cursor sits; a level's target says *this* face of *this* part on *that* face of
*that* Pioneer, at *this* position and *this* spin. So `GM1` is:

1. **target data** per level — the pairs, the position on the Pioneer face, the spin (or its
   symmetry: a square face accepts 4 quadrants, `D98`);
2. **the mate check** on a seated couple: position within tolerance, `testMate` anti-parallel,
   spin within tolerance of an accepted quadrant — `mateResidual` measured, never the gap
   (rule 4: the gap is zero by construction);
3. **the completion detector** — every target couple mated, read from the model every frame;
4. **level end** — the clock and the count stop, the result is shown (`GM5` scores it).

⏸ **DEFERRED BY THE OWNER** (2026-09-27: *"we will see mate and spin later on. Just capture in md
files"*) — two questions to answer before `GM1` builds the mate check:
1. does a couple seated on the right faces but at the wrong SPIN show as wrong?
2. once the spin is right, does the mate LOCK it, or leave it free until the level ends?

### 2.1 ⭐⭐ `D129` — the first target data, 2026-09-28

⭐ The owner defined `Scene_1`'s goal as a whole LAYOUT — *"current configuration of parts is 'level
completed configuration'"* — not as couples: `SceneDescriptor.final` holds each piece's pose
(`FinalConfiguration`, parsed and vectored), and the boot moves five pieces out of it → `SCENE_1.md`
§7. ⛔ Still to build: level end.
✅ **2026-09-28, `D130`**: the DETECTOR is built — `core/goal.ts`, RELATIVE (the painting anywhere), a box's
face or its opposite (four half-turns), read on the HUD's score line → `SCENE_1.md` §8. ⚠ It judges POSES;
§2's mate and spin questions stay deferred.

## 3. The play volume

Nothing keeps a part inside the scene today: it can be dragged off-screen, far behind the camera,
or (until `3D6`) under the plate. ⭐ A volume per level clamps translation (the same stop-and-slide
as `3D6`, against the volume's walls); a lost part is recoverable (undo covers the last actions,
not a part pushed away over many).

## 4. The player layer

* The HUD is a **debug readout**; a player needs episodes, time, par and the level name, with the
  debug HUD behind a toggle.
* Cues are coloured for RULE STATE (cyan / amber / white / fuchsia) — a player needs *held*,
  *blocked*, *correct target* unambiguously.
* Nothing teaches a gesture: the second finger lifts, a double tap undoes, the edge band exists.
* Sound and haptics are absent: snap, block, undo and level complete first.
* A backgrounded phone tab loses the level: save it in progress.

## 5. Debt that bounds all of it

Nearly everything since 2026-09-24 is **unjudged by a hand** (rule 5), and "millimetres" are CSS mm,
not physical — collision's `ε` and every band are tuned in mm on the glass, so the calibration
becomes load-bearing.

---

## ⭐⭐⭐ `D136` — CONTACT ALLOWED, ONLY PENETRATION REFUSED, 2026-09-28

⚠ Report: *"I cannot get the blue object to snap … Snap gets immediately cancelled"* (`Piece31 is in
the way`). ⭐ Cause: `D125`'s zero-clearance slots against §3's skin (every pair kept a skin apart) —
measured, a piece stopped 33 mm short of its own slot. The owner chose *"Allow touching"*; the skin is
now the depth a body may sink into another, with its slider relabelled → `COLLISION.md` §9.
✅ 6 new vectors (4 RED on the old rule), 9 restated. ⛔ Unjudged.
