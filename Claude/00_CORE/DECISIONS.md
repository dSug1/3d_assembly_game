# DECISIONS — taken, and still open

> **STATUS** · live · **OWNS** · owner decisions and their consequences
> **READ IF** · you are about to re-open something, or need to know whose call it is
> **LAST VERIFIED** · 2026-09-27

⭐ **TIERED, since 2026-09-16**: a SUPERSEDED row keeps its headline here and its consequence text
in [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md).
⛔ The row never leaves this file — a decision that vanished would be re-taken — but its essay is
not load-bearing at read time, and this file has a byte budget.

⭐⭐ **SO A CONSEQUENCE CELL IS SHORTHAND, AND THE KEY IS HERE ONCE**: **⚠ → history** is a
superseded row whose essay is in that file; **⭐ Binding** is a live row whose text went there
too; a bare **§N** points at
[`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) and
**§N (approach)** at the approach spec. ⛔ **An addition that does not fit pays for itself**, and
every row below has been collapsed to its key at least once to pay for a later one.

⚠ A decision here is **not** a rejected experiment; things measured out are at the foot of this
file.

## Taken and binding

| # | decision | date | consequence |
|---|---|---|---|
| `D1` | ⭐⭐⭐ **TypeScript + Babylon.js, web-first, Capacitor for stores** | 2026-09-13 | Made on **day one**, because the predecessor's deferred platform decision blocked four rows and the whole game layer. One codebase for web + iOS + Android + desktop |
| `D2` | ⛔⛔ **Audience is ALL PUBLIC, INCLUDING YOUTH** | 2026-09-13 | Carried. COPPA / GDPR-K live → no analytics or ads SDKs; local-only is load-bearing; Play Families + Apple Kids apply |
| `D3` | **The game will be commercialised** | carried | `N13` binding: no non-commercially-licensed dependency |
| `D4` | ⭐ **Manipulation is direct and kinematic, not physics-driven** | carried | The transform is driven straight from input. Never regretted in the predecessor |
| `D5` | ⭐⭐ **Assembly is by MATE CONNECTORS** (Onshape's model) | carried | `src/core/mate_connector.ts`, and the four rules in `LESSONS_CARRIED.md` |
| `D6` | ⛔ **`src/core` and `src/input` import no engine**, and a test enforces it | 2026-09-13 | The predecessor stated the same contract in prose and it silently became false |
| `D7` | **Thresholds in millimetres, never pixels** | 2026-09-13 | `src/core/units.ts`; every threshold converts at runtime |
| `D8` | ⭐ **The constraint stack replaces the three booleans** | 2026-09-13 | Owner's revision-5 spec §1.4, adopted as the design of record |
| `D78` | ⭐⭐⭐ **THE ALIGNMENT IS ANTI-PARALLEL — a FollowerFace points AT the PioneerFace** | 2026-09-23 | ⭐ Binding, ⚠ → history |
| `D86` | ⭐⭐⭐ **THE REST WINDOW IS DERIVED FROM THE DEVICE, NOT FIXED** | 2026-09-24 | ⭐ Binding, ⚠ → history |
| `D87` | ⛔⛔⛔ **THE ROLES ARE INVERTED AGAIN: FIRST TOUCH THE FOLLOWER, SECOND THE PIONEER** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D88` | ⭐⭐⭐ **THE FUCHSIA OFFER — every face the held body is nearly ready to MATE with** | 2026-09-24 | ⛔ The offer is DELETED (`D109`); its cone is the snap cone. ⚠ → history |
| `D89` | ⛔⛔⛔ **`D77`'s CARVE-OUT FOLLOWS THE ROLE: THE **FIRST** TOUCH ON A FROZEN BODY IS THE MISS NOW** | 2026-09-25 | ⛔ Reversed by `D119` → §14 |
| `D90` | ⭐⭐⭐ **A PRESS ON THE HELD BODY'S OWN FOLLOWER IS A *SWAP*, AND THE RELEASE PATH STOPS ALIGNING** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D91` | ⭐⭐ **THE PYRAMID'S SMALL FACE IS A PART'S SMALL FACE, AND IT IS A QUARTER SHORTER** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D92` | ⚠⚠ **REVERSED THE SAME DAY — `objectD` IS A CUBOID AGAIN** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D93` | ⭐⭐ **THE SCENE BOOTS UNALIGNED, IN `TRANSLATE`, WITH THE TWO PARTS TILTED 30°** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D94` | ⭐⭐ **A MOUSE IS A TWO-TOUCH DEVICE** — rebuilt from scratch | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D95` | ⭐⭐ **A TAP ON EMPTY SPACE WHILE HOLDING AN ALIGNED BODY RELEASES IT** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D96` | ⭐⭐ **A PIONEERFACECURSOR PER ALIGNMENT** | 2026-09-25 | ⭐ Binding. ⚠ → history |
| `D97` | ⭐⭐ **AN ALIGNED FOLLOWER'S AXES: SHOWN WHILE HELD, AS SEGMENTS TO THE CURSOR** | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D98` | ⭐⭐ **AN ALIGNMENT IS SQUARED TO ITS PIONEER** | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D99` | ⭐⭐⭐ **THE SCORE: TOUCHPOINT EPISODES AGAINST A SOLVED OPTIMUM, AND ELAPSED TIME** | 2026-09-26 | ⭐ Binding → `20_GAME_RULES/spec/SCORE.md`. ⚠ → history |
| `D100` | ⭐⭐ **THE SNAP IS AUTOMATIC AND A SEATED PIONEER CARRIES ITS FOLLOWERS; UNSNAP IS AN EPISODE** | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D101` | ⭐ **FREE FLOW MODE** — the cursor-drag slider, renamed, escapes the score | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D102` | ⭐⭐ **A SEATED ASSEMBLY DRIVES AS ONE BODY; THE SNAP IS A MAGNET; THE OFFSET IS 15 mm** | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D103` | ⭐⭐ **UNSNAP COSTS 2; A FLICK UNSNAPS FOR 1, AND TAKES ITS DEPENDANTS** | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D104` | ⭐⭐⭐ **`scene.ts` IS SPLIT INTO MODULES** — a composition root + thirteen render modules over one `SceneState` | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D105` | ⭐⭐ **THE GAME SCAFFOLD: intro → menu → worlds → levels → play; the current scene is `Scene_0`** | 2026-09-26 | ⭐ Binding. ⚠ → history |
| `D106` | ⭐⭐ **`FOLLOW` IS DELETED — every alignment is a SNAPSHOT** | 2026-09-27 | ⭐ Binding, ⚠ → history |
| `D107` | ⭐⭐ **TWO WAYS TO UNALIGN: tap empty space while holding, or align elsewhere** | 2026-09-27 | ⭐ Binding, ⚠ → history |
| `D108` | ⭐⭐⭐ **AN ALIGNED BODY IS MODE-LESS; THE MODE TOGGLE NARROWS** | 2026-09-27 | ⭐ Binding, ⚠ → history |
| `D109` | ⭐⭐ **THE DORMANT SWITCHES ARE DELETED; THE FUCHSIA CONE IS THE SNAP CONE** | 2026-09-27 | ⭐ Binding, ⚠ → history |
| `D110` | ⭐⭐ **THE FLICK IS DELETED — and `D103`'s flick-unsnap with it** | 2026-09-27 | → §13 |
| `D111` | ⭐⭐⭐ **A DOUBLE TAP ON A BODY UNDOES THE LAST ACTION** | 2026-09-27 | → §13, `IN6.md` |
| `D112` | ⭐⭐ **THE HUD LEADS WITH THE SCORE: episodes and time** | 2026-09-27 | `SCORE.md` §3 as a rule; the undo pair costs 1; the clock starts at the first press → §13 |
| `D113` | ⭐⭐ **THE EDGE BAND IS ALWAYS EMPTY SPACE** — the camera reset stays reachable | 2026-09-27 | 6 mm along the edges, a slider; a body cannot be grabbed through it → §13 |
| `D114` | ⭐⭐ **THE EDGE BAND OPENS ONLY WHEN NO EMPTY SPACE IS LEFT** | 2026-09-27 | A 4 Hz fingertip-grid probe; empty = a first touch would miss; else 0 → §13 |
| `D115` | ⭐⭐ **A TWO-TOUCH ACTION IS ONE EPISODE, COUNTED WHEN ITS LAST TOUCH LIFTS** | 2026-09-27 | Align, unalign, a Pioneer's release, unsnap; tablet and desktop alike → §13 |
| `D116` | ⛔⛔⛔ **BUILD THE PLAYABILITY PROGRAM FIRST; COLLISION: STOP+SLIDE ON TRANSLATION, SAME-AXIS CLAMP ON ROTATION** | 2026-09-27 | ✅ `3D6` BUILT; clamp owner-confirmed; seams for Blender → `COLLISION.md` |
| `D117` | ⭐⭐ **`Scene_1`, THE PAINTING; A SCENE SLIDER REBOOTS ON THE CHOSEN SCENE** | 2026-09-27 | Owner's values at 0.1 m/unit; Unity lights read as URP → `SCENE_1.md` |
| `D118` | ⭐ **A PINCH IS TWO REAL FINGERS — the mouse never pinches** | 2026-09-27 | The wheel is the desktop's zoom → §14 |
| `D119` | ⭐⭐⭐ **THE SECOND TOUCH ALIGNS ONLY ON A RELEASED TAP; A FROZEN BODY IS EMPTY SPACE TO A PRESS** | 2026-09-27 | A tap on the plate aligns; a press steers → §14 |
| `D120` | ⭐⭐ **THE WHITE CAPTURE HIGHLIGHTS AND THE APPROACH SWING ARE DELETED** | 2026-09-27 | They matched no shape and served no rule → §14 |
| `D121` | ⚠ **REVERSED BY `D128`** — a frozen body seen from below turned see-through | 2026-09-27 | → §15 |
| `D122` | `Scene_1`'s floor: halved, 80 %, 107 %, 103 % — 21.116236 units | 2026-09-27 | → `SCENE_1.md` |
| `D123` | ⭐⭐ **A FREE BODY'S SECOND TOUCH SPINS IT ABOUT GRAVITY (in `TRANSLATE`)** | 2026-09-27 | With the gravity lift, as an aligned body → §15 |
| `D124` | ⭐⭐⭐ **A SECOND PRESS ON ANOTHER BODY STEERS THE HELD ONE; ONE BODY MOVES AT A TIME** | 2026-09-27 | A tap there still aligns → §15 |
| `D125` | ⭐⭐ **A PIECE IS A TRANSPARENT CONTOUR AROUND ITS COLOURED CORE** — faces touch, cores keep the gap | 2026-09-27 | `Scene_1`: margin 0.015; opacity 0.1, a slider; contact at 0 reads DEPTH → `SCENE_1.md` §6 |
| `D126` | ⭐ **A HIGHLIGHT FLOATS ONE PIXEL OFF WHAT IT MARKS, AT EVERY ZOOM** | 2026-09-27 | Was 1.5 mm / 2 % in the world; mm on the glass, a slider → `40_RENDER_SCENE/INDEX.md` |
| `D127` | ⭐⭐⭐ **EDGE-ON: THE HOLDER'S `dy` DRIVES BLUE ALONE, FINGER UP = AWAY FROM THIS CAMERA** | 2026-09-28 | ⛔ Reversed by `D145` → §19 |
| `D128` | ⭐⭐ **A FROZEN BODY SEEN FROM BELOW DISAPPEARS — its material unchanged** | 2026-09-28 | Not drawn, not picked; reverses `D121` → §16 |
| `D129` | ⭐⭐⭐ **`Scene_1`'s TABLE IS THE LEVEL'S GOAL; FIVE PIECES BOOT OUT OF IT** | 2026-09-28 | → `SCENE_1.md` §7 |
| `D130` | ⭐⭐⭐ **THE GOAL IS MET RELATIVE TO EACH OTHER; A BOX'S FACE OR ITS OPPOSITE** | 2026-09-28 | `core/goal.ts` → `SCENE_1.md` §8 |
| `D131` | ⭐⭐ **EACH SCENE CARRIES ITS OWN ORBIT RIG** | 2026-09-28 | → `SCENE_1.md` §8 |
| `D132` | ⭐⭐ **EDGE-ON *AWAY* IS READ FROM THE CAMERA TO THE GIZMO, NOT ALONG THE VIEW** | 2026-09-28 | ⛔ Reversed by `D145` → §19 |
| `D133` | ⚠ **REVERTED THE SAME DAY** — finger up *away* from below too; never shipped, the flip stands | 2026-09-28 | → §16 |
| `D134` | ⭐ **THE HUD's EDGE-ON IS THE CAMERA's, READ EVERY FRAME** | 2026-09-28 | → §16 |
| `D136` | ⭐⭐⭐ **CONTACT IS ALLOWED; ONLY PENETRATION IS REFUSED** — the skin is how far a body may sink | 2026-09-28 | Scene_1's slots were unreachable → `COLLISION.md` §9 |
| `D137` | ⭐⭐ **A SIDEWAYS PINCH WHILE TRANSLATING ZOOMS; translation and roll pause** — until a dy leaves the band | 2026-09-28 | → §17 |
| `D138` | ⭐⭐ **AUTO SHADOWS: OFF ON A DEVICE MEASURED TOO SLOW FOR THEM** | 2026-09-28 | → render `INDEX.md` |
| `D139` | ⭐⭐ **A SNAP STOPS THE DRAG THAT MADE IT — only roll till a lift** | 2026-09-28 | → §18 |
| `D140` | ⛔ **ONLY THE LIVE COUPLE'S CURSOR MAY SNAP** — defect 73, a stale one jumped a re-aligned Follower | 2026-09-28 | → §18 |
| `D141` | ⭐⭐ **A DOUBLE TAP UNDOES ONLY ON THE BODY THE LAST ACTION MOVED** | 2026-09-28 | → `IN6.md` |
| `D142` | ⭐ **A SEATED PIECE AT ITS GOAL DISSOLVES ITS COUPLE** | 2026-09-28 | → GM1 |
| `D143` | ⭐⭐ **THE MATE: AT THE GOAL'S DISSOLVE THE SPIN IS SET** — `Scene_1`: a face or its opposite | 2026-09-28 | → `PLAYABILITY` §2.1 |
| `D144` | ⭐⭐ **A ⏸ PAUSE MENU LEAVES A LEVEL, BY PAGE RELOAD; ONE SCENE LIST; `Scene_1` BOOTS** | 2026-09-28 | → `GAME_STRUCTURE.md` §4–§5 |
| `D145` | ⭐⭐⭐ **TRANSLATION ALONG THE LIVE CAMERA; UP = AWAY IFF THE CAMERA IS AT/ABOVE THE GIZMO** | 2026-09-29 | Reverses `D74`'s boot axes → §19 |
| `D146` | ⚠ **REVERSED BY `D147`** — the sign latched at press | 2026-09-29 | → §19 |
| `D147` | ⭐⭐ **A ZOOM RE-DECIDES THE DIRECTION, EVEN MID-DRAG** | 2026-09-29 | → §19 |
| `D148` | ⭐⭐ **…AND A GRAVITY LIFT: THE SIGN IS READ EVERY STEP** | 2026-09-29 | → §19 |
| `D150` | ⭐⭐ **FREE-BODY GIZMO: FULL AT A START, THEN A RAY TOWARD THE TRAVEL** | 2026-09-29 | → §19 |
| `D151` | ⭐⭐ **A TRANSLATION LINE STOPS AT THE OBJECT IT HITS, WITH A WHITE RING** | 2026-09-29 | → §19 |
| `D152` | ⭐ **A HIT RING KEEPS THE ORIGIN RING'S WORLD SIZE — IN PERSPECTIVE** | 2026-09-29 | → §19 |
| `D77` | ⭐⭐ **A FROZEN BODY SHOWS NO GIZMO, AND ONE OF ITS TOUCHES IS A MISS** | 2026-09-23 | ⭐ No gizmo binds; every press a miss since `D119`. ⚠ → history |
| `D76` | ⭐⭐⭐ **A TRANSLATION TRACKS THE FINGER — the cosine loss is a DEFECT, and the edge-on case must not go dead** | 2026-09-23 | ⭐ Binding, ⚠ → history |
| `D75` | ⭐⭐⭐ **A TRANSLATION IS PROJECTED ONTO THE BODY'S OWN AXES, AND THE CHANNELS ARE REMAPPED** | 2026-09-22 | ⭐ Binding. ⚠ → history |
| `D82` | ⛔⛔⛔ **THE IN-ZONE BASIS IS DELETED — inside the capture zone is the same as outside** | 2026-09-23 | ⭐ Binding, ⚠ → history |
| `D84` | ⭐⭐⭐ **`WorldAxisB` NOW GOVERNS A FREE BODY'S *ROTATION* BASIS TOO** | 2026-09-23 | ⭐ Binding — the flag is deleted (`D109`), the boot frame is the only frame. ⚠ → history |
| `D74` | ⭐⭐⭐ **`WorldAxisB` — THE OBJECT AXES ARE FIXED AT SCENE BOOT** | 2026-09-22 | ⭐ Binding, ⚠ → history |
| `D73` | ⭐⭐⭐ **A ROTATION IS ALWAYS ON AN INCREMENT** — ✅✅ **CLOSED BY A DEVICE LOOK** | 2026-09-22 | ⭐ Binding, ⚠ → history |
| `D72` | ⭐⭐⭐ **THE RIGHT-HAND BODY IS A TRAPEZOIDAL PYRAMID, AND HALF AGAIN AS THICK** | 2026-09-22 | ⭐ Binding, ⚠ → history |
| `D71` | ⭐⭐⭐ **THE SESSION BOOTS IN `TRANSLATE`** | 2026-09-22 | ⭐ Binding, re-confirmed by `D93`. ⚠ → history |
| `D70` | ⭐⭐⭐ **A MOVED PIONEER COSTS A FOLLOWER WHAT A TURNED ONE DOES — cyan BREAKS, orange follows** | 2026-09-21 | ⭐ Binding, ⚠ → history |
| `D69` | ⚠ **CORRECTED BY `D70` THE SAME DAY** | 2026-09-21 | ⚠ → §5.16 |
| `D68` | ⭐⭐ **A DOUBLE TAP REVERTS THE MODE EVEN WHEN THE SECOND HALF NEVER LIFTS** | 2026-09-21 | ⭐ Binding, ⚠ → history |
| `D67` | ⚠ **REVERSED BY `D87`** — first touch the PIONEER, second the Follower | 2026-09-21 | ⚠ → §5.14, history |
| `D66` | ⭐⭐⭐ **A PRESS DOES NOT TOGGLE THE MODE — ONLY A TAP DOES, WHICH IS `D28` AGAIN** | 2026-09-21 | ⭐ Binding, ⚠ → history |
| `D65` | ⚠ **REPEALED BY `D66` the same day** — a second touch's release never toggled; the cause was the PRESS all along | 2026-09-21 | ⚠ → history |
| `D64` | ⚠ **SUPERSEDED BY `D65`, THEN REPEALED WITH IT** — *driving consumes the toggle* | 2026-09-21 | ⚠ → history |
| `D63` | ⭐⭐⭐ **THE APPROACH SWING — the camera looks around the join and comes back** (TRIAL) | 2026-09-19 | ⛔ Deleted by `D120`. ⚠ → history |
| `D62` | ⭐⭐⭐ **A FOLLOWER MAY APPROACH ITS PIONEER AND NOTHING ELSE** | 2026-09-19 | ⭐ Binding, ⚠ → history |
| `D61` | ⚠ **REPEALED BY `D66`** — the first outside press of a hold was inert, exempting a Follower | 2026-09-19 | ⚠ → history |
| `D60` | ⭐⭐⭐ **AND THE FIRST TOUCH THEN TRANSLATES, WHATEVER THE MODE** | 2026-09-19 | ⭐ Binding, ⚠ → history |
| `D59` | ⭐⭐⭐ **AN ALIGNED FOLLOWER GIVES THE SECOND TOUCH BOTH AXES** | 2026-09-19 | ⭐ Binding, ⚠ → history |
| `D58` | ⚠ **REPEALED BY `D66`** — a PRESS toggled the movement mode, in two places | 2026-09-19 | ⚠ → history |
| `D57` | ⭐⭐⭐ **THE SECOND TOUCHPOINT'S ROLL IS FLAT — `dx`, whatever the orientation** | 2026-09-19 | ⭐ Binding. ⚠ → history |
| `D55` | ⚠ **SUPERSEDED IN PART BY `D67`** | 2026-09-19 | ⛔ Reversed by `D119` → §14, history |
| `D54` | ⭐⭐⭐ **`A15`'s ORPHAN UNSELECT IS DELETED — a holder keeps its object for the touchpoint's lifetime** | 2026-09-18 | ⭐ Binding, ⚠ → history |
| `D53` | ⭐⭐ **A BODY UNDER A FINGER IS NOT SWAYED** | 2026-09-18 | ⭐ Binding, ⚠ → history |
| `D52` | ⚠ **RESOLVED BY `D57` THE SAME DAY** — the second touchpoint's roll had a dead zone: authority was `|dir.x|`, **0.00° for an axis horizontal on screen**, while the first touch never lost it | 2026-09-19 | ⚠ → §5.5 |
| `D51` | ⭐⭐⭐ **A HELD PIONEER MAY BE PINNED — it steers instead of being carried** | 2026-09-18 | ⭐ Binding, ⚠ → history |
| `D50` | ⭐⭐⭐ **EVERY OUTLINE AND FACE MARKER IS READ OFF THE MESH** | 2026-09-18 | ⭐ Binding. ⚠ → history |
| `D49` | ⭐⭐⭐ **THE CAPTURE IS A SURFACE OFFSET, COMPUTED AT SPAWN** | 2026-09-18 | ⭐ The surface gap binds (snap, sway); the white it drove is deleted (`D120`). ⚠ → history |
| `D48` | ⚠ **RETIRED WITHIN THE DAY, KEPT AS THE RECORD** — white contours required the alignment; the owner removed it, keeping the TRANSLATION condition | 2026-09-17 | ⚠ *both readings fit the evidence — name both* → §13 (approach) |
| `D47` | ⭐⭐⭐ **A MATE IS BROKEN BY PULLING IT APART WITH TWO FINGERS** | 2026-09-17 | ⭐ Binding, ⚠ → history |
| `D46` | ⭐⭐⭐ **APPROACH & MATE — the owner's mechanism, measured between CENTRES** | 2026-09-17 | ⭐ Binding, ⚠ → history |
| `D45` | ⭐⭐ **THE ALIGNMENT SNAP IS A SLERP, ON THE CAMERA RESET'S SLIDER** — binding; ⛔ NOT the rejected rotation inertia | 2026-09-17 | ⚠ → history |
| `D44` | ⭐⭐ **A TAP ON ANOTHER OBJECT'S FACE ALIGNS IN **EITHER** MOVEMENT MODE** | 2026-09-17 | ⭐ Binding, ⚠ → history |
| `D43` | ⛔⛔⛔ **`A10`'s DEPTH GATE IS DELETED — both fingers integrate at once** | 2026-09-17 | ⭐ Binding. ⚠ → history |
| `D42` | ⚠ **SUPERSEDED IN PART BY `D67`** | 2026-09-17 | ⚠ → history |
| `D41` | ⚠ **SUPERSEDED BY `D42` after four hours** — what a turned Pioneer costs the Follower; the two readings survive, the FLAG does not | 2026-09-17 | ⚠ → history |
| `D40` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap-to-align set is THE input model** | 2026-09-17 | ⭐ Binding, ⚠ → history |
| `D39` | ⚠ **SUPERSEDED IN PART BY `D67`** — both faces are still marked; the re-tap UNDO moved onto the **FollowerFace** | 2026-09-16 | ⛔ The re-tap undo is deleted (`D107`). ⚠ → history |
| `D38` | ⭐⭐ **FORK C IS THE DEFAULT, AND ITS ALIGNMENT NO LONGER SWITCHES THE MODE** | 2026-09-16 | ⭐ Binding. ⚠ → history |
| `D37` | ⭐⭐⭐ **FORK C: THE TRIGGER IS A TAP — no flick anywhere** | 2026-09-16 | ⭐ Binding, ⚠ → history |
| `D36` | ⭐⭐⭐ **§1.3's PROVISIONAL-MOTION ROLLBACK IS RETIRED** | 2026-09-16 | ⭐ Binding |
| `D35` | ⭐⭐ **THE FACE HIGHLIGHT OUTLIVES THE GESTURE AND DIES WITH THE ALIGNMENT** | 2026-09-16 | ⭐ Binding |
| `D34` | ⭐⭐⭐ **2sexte IS WIRED — and `A3`'s handover was never a decision** | 2026-09-16 | ⭐ Binding |
| `D33` | ⭐⭐⭐ **A FLICK IS READ OVER ITS TAIL, NOT THE WHOLE WINDOW** | 2026-09-16 | ⛔ Flick deleted (`D110`) |
| `D32` | ⭐⭐ **A SHAKE EVICTS ONLY WHILE `ROTATE`, and it is fed BEFORE the refusal** | 2026-09-16 | ⛔ Shake deleted (`D107`) |
| `D31` | ⭐⭐⭐ **THE ONE-TOUCHPOINT ROLL IS DELETED, NOT PARKED** | 2026-09-16 | ⭐ Binding |
| `D30` | ⭐⭐⭐ **A FLICK PUSHES AN ALIGNMENT ONLY WHILE THE MODE IS `ROTATE`** | 2026-09-16 | ⛔ Flick deleted (`D110`). ⚠ → history |
| `D29` | ⭐⭐⭐ **THREE ANCHOR-RULE FORKS BEHIND ONE FLAG, and `IN3` is built in fork B** | 2026-09-16 | ⭐ Binding |
| `D28` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap toggle is THE input model** | 2026-09-16 | ⭐ Binding — the toggle NARROWED by `D108`: one tablet tap, none on desktop |
| `D27` | ⭐⭐⭐ **ANY SINGLE TAP toggles the movement behaviour; a PRESS keeps every meaning it has** | 2026-09-16 | ⛔ Narrowed by `D108` |
| `D26` | ⭐⭐ **THE ASSIGNMENTS WERE A FLAG, NOT A FORK** — ⚠ **CLOSED BY `D28`** | 2026-09-16 | ⚠ → history |
| `D25` | ⚠ **REVERSED BY `D54`** | 2026-09-16 | ⚠ → history |
| `D24` | ⚠ **RETIRED BY `D28`** | 2026-09-16 | ⚠ → history |
| `D23` | ⚠ **SUPERSEDED BY `D28`** | 2026-09-16 | ⚠ → history |
| `D22` | ⭐⭐⭐ **Roll moves to the SECOND touchpoint's x** | 2026-09-15 | ⭐ Binding |
| `D21` | ⭐⭐⭐ **STATIONARY is a POSITION DEADBAND, not a timer** | 2026-09-15 | ⭐ Binding |
| `D20` | ⭐⭐ **Depth is a STILL HOLDER and a MOVING ANCHOR** | 2026-09-15 | ⭐ Binding |
| `D19` | ⭐⭐ **A DEADBAND on the pointer delta, per axis, with a slider** | 2026-09-15 | ⭐ Binding |
| `D18` | ⭐⭐ **Every object gesture stands on a GRAVITY FRAME** | 2026-09-15 | ⭐ Binding |
| `D17` | ⚠ **SUPERSEDED BY `D20`** — its TRIGGER is gone; the configuration and `A5`'s geometry stand | 2026-09-15 | ⚠ → history |
| `D16` | ⚠ **SUPERSEDED IN PART BY `D17`** — the pinch trigger is gone; the depth GEOMETRY it established stands | 2026-09-15 | ⚠ → history |
| `D15` | ⭐⭐ **Eviction is a QUICK BACK-AND-FORTH, not a roll** | 2026-09-15 | ⛔ Shake deleted (`D107`) |
| `D14` | ⛔⛔ **Roll DRIVES the free DOF of an anchored object; 2sexte suppresses where it degenerates** | 2026-09-15 | ⭐ Binding |
| `D13` | ⛔⛔ **Eviction SPARES `MATE` entries** — a full turn clears alignments, never a joint | 2026-09-15 | ⛔ Eviction deleted (`D107`); mates are broken by `D47`/`D100`'s unsnap |
| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, now a back-and-forth | 2026-09-15 | ⚠ → history |
| `D11` | ⭐⭐ **Adopt the PROVENANCE DISCIPLINE** from the owner's `TECHNIQUE_CATALOG.md` §0/§5 | 2026-09-15 | ⭐ Binding, ⚠ → history |
| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is half of a **depth pinch** now | 2026-09-14 | ⚠ → history |
| `D9` | ⭐ **Babylon over three.js** | 2026-09-13 | ⭐ Binding, ⚠ → history |

## ⚠ Still the owner's to make

| | what is blocked on it |
|---|---|
| ✅ **~~Un-snap: what breaks a mate?~~** — answered: `D100`'s unsnap (built), 1 episode (`D115`) | `D47`'s pull-apart break stays specified |
| ✅ **~~WHICH TOUCHPOINT ASSIGNMENT SHIPS~~** — **ANSWERED by `D28`** | ⛔ Kept as a correction: it read *"deliberately not due yet"* until the owner judged three readings from one build and chose the tap toggle |
| ⭐⭐ **FORK C's SECOND HALF — what is left of it** | `TargetPosition`, its gizmo and the orbit about it are specified and **not built**; the approach is **superseded by `D46`** — projecting onto `centre → target` has no direction when that line faces the camera |
| **`axisMappingMode`: `rotated` vs `direct`** (§6bis) | build both, A/B on a device. The spec asks for the comparison rather than assuming |
| **`matePriorityOverAnchor`** (§1.4) | default is anchor-wins. The opposite reading exists as a flag for A/B |
| **Landmark registration, contact search, longest-axis alignment** | spec §5 lists them as deliberately deferred, so the gaps are explicit rather than implicit |

## ⛔ Owed, and not closed by anything above

✅ **The device look is no longer owed — it is the loop.** `IN1` (**seven** passes), `IN9`, `IN2`
and `IN4`'s rule 6 (**five**) were each closed by finger. ⛔ The defects they found are counted in
ONE place, the ledger in [`QUEUE.md`](QUEUE.md)'s YOU-ARE-HERE block.

⛔ **What IS still owed is MEASUREMENT, a different thing** (`IN5`). Of every number in
`gestureConfig.ts`: **one is MEASURED** — `pointerNoiseMm` = 0.761 mm, and measuring it exposed a
defect in the sagitta guard eight device passes had accepted; **four groups are JUDGEMENTS** — the
orbit rings, the gains, rule 6's feel numbers and the sway sets, chosen by a hand, so real but not
derived; **the rest are PLACEHOLDERS** and must not be quoted as though anything supports them.

⭐ And the standing rule is unchanged: **a device look closes a change and nothing else**, so
every row still to come owes one of its own.

## ⭐⭐ Two entries that are not decisions, kept as pointers

⭐ **A report the owner WITHDREW** (2026-09-15) — `A7`/`D18` was not the fault, and
`tests/a7_wiring.test.ts` measures the composition at four tilts. ⭐⭐ Mistake shape 4 aims at
**correct** work as easily as at broken work.

⚠ **Two things were measured out and REVERTED** — rotation inertia and `targetVelocity` → the
*"TWO THINGS A NEW SESSION MUST NOT REBUILD"* block in [`QUEUE.md`](QUEUE.md).
