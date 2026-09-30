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
| 2 | **`GM1`** (+ the mate, `D143`) | ⛔⛔ **A GOAL AND ITS DETECTION** — target data per level (which face on which Pioneer, where, which spin), the MATE check against it, a completion detector read from the model, level end (clock and count frozen, result shown). Par per level until the solver (`GM4`) | §2 below |
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

✅ **ANSWERED BY `D143`** (below) — the mate is ONE act at the dissolve, and items 1–3 above are
`core/goal.ts` rather than a mate check. ⚠ The two questions as they were deferred (2026-09-27: *"we
will see mate and spin later on. Just capture in md files"*):
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

⭐⭐ **`D142`, 2026-09-28 — a seated follower in its goal pose lets go of its Pioneer** (the owner): the
couple, its highlights and its cursor disappear, the piece stays put, and a pop-up says so (§4.1 for
making it better). `input/goal_dissolve.ts` over `core/goal.ts`'s verdict (now naming the pieces in
place). ✅ 4 vectors. ⛔ Unjudged.

⭐⭐ **`D143`, 2026-09-28 — THE MATE** (the owner: *"complete D142 by adding a mate which orients the spin
to the correct angle at the moment the follower-pioneer is dissolved. That will be it."*). The goal
accepts a piece within `goalAngleTolDeg` (5°; ⭐ the snap cone since `D183`, which also pulls any piece that moves
into its goal margins onto its exact pose → `LEVEL_END.md` §5); at the dissolve the leftover error about the FollowerFace
normal — the one DOF the snap leaves free — is removed, so the piece sits on its goal spin exactly.
`mateSpin` (`input/goal_dissolve.ts`) turns by the TWIST part only (a swing–twist split), through the
face centre: the face stays flush and on its spot; a tilt in the error is left to the snap. The target is
the NEAREST accepted orientation, carried by the relative fit (`GoalReport.targetOrientations`).
⭐⭐ **A FACE OR ITS OPPOSITE — IN `Scene_1` ONLY** (the owner: *"a face and its opposite face can snap and
meet the goal so the mate shall take that into account in this specific scene (this will not be true in
all the scenes)"*): a piece seated by its opposite face mates onto the HALF-TURN, never flipped back. ⭐ It
is scene DATA, not a rule: the half-turns are accepted only for a goal body carrying `symmetry:
"halfTurns"` (`Scene_1`'s five pieces); without it a flipped piece is not in place, so it never dissolves
nor mates. ⚠ Written
without collision, like the alignment turn (≤ 5°). ⭐ So §2's two questions: a wrong spin reads *not in
place* (the goal check's angle); a right one is SET, then the piece is free. ⛔ Not built, by *"that will be
it"*: a mate check apart from `goal.ts`, a spin lock, `mateResidual`. ✅ 7 vectors; five mutants RED
(no mate, full turn, sign, the symmetry ignored, body centre — the last survived a face centre on the body's axis until moved
off it). ⛔ Unjudged.
### 2.2 ⭐⭐⭐ `D180` — THE LEVEL END, 2026-09-30

> *"Build level end. Use the current light video games best practices for the scaffold and user interface. For the
> graphics aesthetics, make it so we can later modify to adopt one or another graphics style."* — the owner

✅ §2 item 4, built: a level is complete when `goal.ts`'s verdict is met AND the scene is at rest (no finger down, no snap
animating) — played (the clock started) or a demo done; it latches, the clock and the count stop, and a results card comes
up after a beat (moves · time · pieces; *Next level* · *Retry* · *Level select*). Every screen reads a UI THEME (design
tokens; `night`, `paper`). `core/level_end.ts`, `core/ui_theme.ts`, `render/level_end_ui.ts` → `LEVEL_END.md`.
✅ 17 vectors, four mutants RED. ✅✅ **Closed by a device look** — the owner, 2026-09-30, build `a796ac0`: *"Tested, ok"*.
⭐ `GM1` is BUILT and CLOSED; next in the program, `3D7`.

## 3. The play volume

Nothing keeps a part inside the scene today: it can be dragged off-screen, far behind the camera,
or (until `3D6`) under the plate. ⭐ A volume per level clamps translation (the same stop-and-slide
as `3D6`, against the volume's walls); a lost part is recoverable (undo covers the last actions,
not a part pushed away over many).

✅ **`D181`, 2026-09-30 — BUILT** (*"Build 3D7"*): each level declares a box on its floor (`Scene_1`: 2 × 2 m, 1 m high);
its walls are one more blocker to `3D6`'s rule — a move stops, a translation slides, a turn clamps on its own axis — and a
piece already outside may come back in, never further out → `COLLISION.md` §10. ✅ 11 vectors, three mutants RED.
✅✅ **Closed by a device look** — the owner, 2026-09-30, build `18584ed`: *"Tested OK"*. Next in the program: `3D2`, the approach.

## 4. The player layer

* The HUD is a **debug readout**; a player needs episodes, time, par and the level name, with the
  debug HUD behind a toggle.
* Cues are coloured for RULE STATE (cyan / amber / white / fuchsia) — a player needs *held*,
  *blocked*, *correct target* unambiguously.
* Nothing teaches a gesture: the second finger lifts, a double tap undoes, the edge band exists.
* Sound and haptics are absent: snap, block, undo and level complete first.
* A backgrounded phone tab loses the level: save it in progress.

### 4.1 ⭐⭐ The goal pop-up — built plain on purpose, to be made better (`D142`, 2026-09-28)

> *"when dissolve on goal, make a pop up in the HUD so the user can see one piece has reached its goal.
> write in the md file to make this pop up better later on for more game interactivity"* — the owner

✅ **What exists** (`render/goal_popup.ts`): a green rounded box, centred at 22 % from the top, *"✅
PieceN reached its goal · 37/41"*, 2.2 s then a 0.5 s fade; a new one replaces the one showing; it never
takes a touch. ⛔ It is the ONLY player-facing cue for the goal, and it is text.

⭐ **To make it better — the ideas to weigh, not decided:**
1. **On the piece, not only on the screen** — a short glow / pulse of the piece's own contour, or a
   ring that expands from it, so the eye is already where the event happened.
2. **The count as progress** — a bar or a ring filling toward the level (`N/41`), with the LAST piece
   and the level end (`GM1`'s level end, `GM5`'s score) as a bigger moment: episodes against the par,
   time, a bonus when the optimum is equalled (`SCORE.md`).
3. **Sound and haptics** — a short chime; on iOS a native haptic (`IN7`: web-iOS has no Vibration
   API — Capacitor's plugin), a light vibration on Android.
4. **Streaks and combos** — pieces placed in a row without an undo, or quickly, as a reason to play
   better (only if the score model agrees — `SCORE.md` counts episodes, not speed bonuses).
5. **Wording and language** — the piece's NAME (`Piece10`) means nothing to a player: a colour /
   shape word, or none, and localisation.
6. **Accessibility** — contrast, a size that reads on a phone, reduced motion honoured
   (`prefers-reduced-motion`), and never covering the piece just placed.
7. **Placement** — away from the finger that made the move (it is often at the top of the screen on a
   tablet held in two hands).
⚠ Whatever is chosen: the cue must come from the SAME verdict that dissolves the couple
(`core/goal.ts`), never from a second detector — a cue that disagrees with the rule is worse than none.

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
