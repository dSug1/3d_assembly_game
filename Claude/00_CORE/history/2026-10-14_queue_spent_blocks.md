# QUEUE.md — blocks moved out of the YOU ARE HERE record (2026-10-14)

Moved verbatim to keep `QUEUE.md` inside its 40 KB budget when the 2026-10-14 block (the prototype, the hover) went in.

⭐⭐ **2026-09-28, live on `1.0.48-Scene_1-completed`** (all unjudged by a hand): `Scene_1`'s goal + boot + relative goal check
(`D129`–`D131`), a rig per scene, the edge-on readout (`D134`), collision allows contact (`D136`), a sideways
pinch while translating zooms (`D137`), auto shadows + a frame meter (`D138`), a snap stops its drag (`D139`),
defect 73 (`D140`), undo only on the moved body (`D141`), ⭐ the mate sets the spin at the goal's dissolve (`D143`). ⚠ `D133`/`D135` were built and reverted.
⭐ **`1.0.51-Game-shell`: `D144`** — a ⏸ pause menu leaves a level (by page reload), ONE scene list, `Scene_1` boots → `GM6`.
⭐⭐ **`1.0.52-`: `D145`** — translation along the LIVE camera (`dx` its right, `dy` its view, flattened; up = away iff the camera is at/above the gizmo, read every step, so a zoom or a lift mid-drag can flip it, `D147`/`D148`); red + blue light together, each line stopping at the object it hits with a white ring in perspective (`D153`; `D149`–`D152` reverted) → `IN4`.

⭐⭐ **`D181`** `3D7`, the play volume → `COLLISION.md` §10 ✅. **`D182`** the snap waits for a clear flight; the unsnap
holds; no Pioneer sway → `ALIGNMENT_RULES.md` §24. **`D183`** (`1.0.57-`) the goal capture; PLACED = the snap's margins
(1 mm / 1° never grabbed); twins swap → `LEVEL_END.md` §5. **`D184`** finger up always away → §25. **`D185`** the pitch, a
wheel from the press side → §26. **`D186`–`D188`** HUD button, live episodes, score bar → `LEVEL_END` §6. **`D189`** the goal
count/pop-up move when an action ends → §5bis. **`D190`** only moved pieces re-judged → §5ter **`D191`–`D194`** demo heaps → `DEMO_SCENE`. **`D195`** no depth ceiling with a play volume → `COLLISION`. **`D196`** floor from below: contour → §16. ⛔ `D182`–`D196` unjudged. Next: `3D2`.

