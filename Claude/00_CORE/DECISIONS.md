# DECISIONS — taken, and still open

> **STATUS** · live · **OWNS** · owner decisions and their consequences
> **READ IF** · you are about to re-open something, or need to know whose call it is
> **LAST VERIFIED** · 2026-09-21

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
| `D86` | ⭐⭐⭐ **THE REST WINDOW IS DERIVED FROM THE DEVICE, NOT FIXED** | 2026-09-24 | *"I would prefer to derive the ms from the device fps."* ⛔⛔ Browsers dispatch pointer input **once per frame per pointer**, so §1.1's silence interval IS the frame interval — and **30 ms** sat below even the measured one-finger gap (**47–68 ms**). ✅ `restMs = clamp(2.5 × median(gaps), 50, 250)`. ✅✅ **JUDGED: *"working well"*** → defect 62 |
| `D87` | ⛔⛔⛔ **THE ROLES ARE INVERTED AGAIN: FIRST TOUCH THE FOLLOWER, SECOND THE PIONEER** | 2026-09-25 | *"the pioneer is pressed first and the follower is pressed second. Invert that order. That will allow to align a hitface with a pioneer face."* ⛔ It reverses `D67`, four days old; both texts stand. ⭐⭐ It makes `D88`'s offer and this press ONE gesture. ⚠⚠ Cost, and `D67` was chosen for it: several Followers can no longer be aligned to one Pioneer in a single hold. ⛔⛔ It also aimed three other rules at the wrong finger → `D89`, `D90`, defects 63–64 |
| `D88` | ⭐⭐⭐ **THE FUCHSIA OFFER — every face the held body is nearly ready to MATE with** | 2026-09-24 | *"highlight in fuchsia any face of any other object which normal is aligned within xx degrees of the normal of the HitFace."* ⭐⭐ ***Aligned* is ANTI-PARALLEL** (`D78`'s sense): the other reading lights the faces a press is about to turn the body AWAY from. ⚠ **OFF by default** → `core/face_candidates.ts`, §11 |
| `D89` | ⛔⛔⛔ **`D77`'s CARVE-OUT FOLLOWS THE ROLE: THE **FIRST** TOUCH ON A FROZEN BODY IS THE MISS NOW** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D90` | ⭐⭐⭐ **A PRESS ON THE HELD BODY'S OWN FOLLOWER IS A *SWAP*, AND THE RELEASE PATH STOPS ALIGNING** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D91` | ⭐⭐ **THE PYRAMID'S SMALL FACE IS A PART'S SMALL FACE, AND IT IS A QUARTER SHORTER** | 2026-09-25 | *"scale the pyramid so that the small rectangular face has the same dimensions as the small rectangular face of the grey rectangle"*, then *"reduce the height by 25%"*. ⭐⭐ **The scale is UNIFORM in `x` and `z` and that is not a choice — it falls out**: both ratios are **4/3**. ⛔ The height's extra 0.75 cannot touch the top face, because `y` IS the taper axis — `2L × 2L × 4L`. ⛔ Boot clearance **300 → 280 mm** |
| `D92` | ⚠⚠ **REVERSED THE SAME DAY — `objectD` IS A CUBOID AGAIN** | 2026-09-25 | *"remove the hollow cylinder and reinstate the previous rectangle."* ⛔ `core/ring.ts` and its 10 vectors are **deleted, not parked** (`D28`/`D40`). ⭐ Kept for what the hour bought — **defect 68**: the mesh was correct and the body still read as a doughnut, because the wall and the end face share their rim vertices and `ComputeNormals` blends across them. ⭐⭐⭐ *A vector suite that reads the geometry cannot see the SHADING, and the shading is what a hand judges* — ten green vectors on a body rejected on sight |
| `D93` | ⭐⭐ **THE SCENE BOOTS UNALIGNED, IN `TRANSLATE`, WITH THE TWO PARTS TILTED 30°** | 2026-09-25 | ⭐ Binding, ⚠ → history |
| `D94` | ⭐⭐ **A MOUSE IS A TWO-TOUCH DEVICE** — rebuilt from scratch | 2026-09-25 | ⭐ Left drag = the first touch; **Shift + left drag = the second** (gravity + roll); **right-press and hold = the HitFace**, then **left click the Pioneer face** (double = amber). ⛔ The right button never moves anything. Never touches a DOM event, models only #2, reads `buttons`. ⚠ Playable, never testable → defect 70 |
| `D95` | ⭐⭐ **A TAP ON EMPTY SPACE WHILE HOLDING AN ALIGNED BODY RELEASES IT** | 2026-09-25 | One rule for phone and desktop: the right-button hold IS the first touch, a left click on nothing IS an `OUTSIDE` tap. ⛔ Free body → still the mode toggle. Consumed → §11.9 |
| `D96` | ⭐⭐ **A PIONEERFACECURSOR PER ALIGNMENT** | 2026-09-25 | An amber ring at the PioneerFace centre, facing the screen; one per follower couple, disposed with it. Dragged on the face's surface, bounded by its edges — ⛔ **drag ships OFF** (FACE ALIGNMENT menu) → §11.10, defect 71 |
| `D97` | ⭐⭐ **AN ALIGNED FOLLOWER'S AXES: SHOWN WHILE HELD, AS SEGMENTS TO THE CURSOR** | 2026-09-26 | First touch → red + blue; second touch / Shift → green, or none while a roll is on. Each from the FollowerFace centre to the cursor's projection. ⛔ Rotation lines unchanged → §11.11 |
| `D98` | ⭐⭐ **AN ALIGNMENT IS SQUARED TO ITS PIONEER** | 2026-09-26 | After the minimal swing, a ≤ 45° twist about the aligned normal squares the Follower's edges to the Pioneer's; the swing alone lost 8–30° on a tilted part. ⚠ No longer strictly minimal → §11.12 |
| `D99` | ⭐⭐⭐ **THE SCORE: TOUCHPOINT EPISODES AGAINST A SOLVED OPTIMUM, AND ELAPSED TIME** | 2026-09-26 | One episode = press → release; ⛔ camera, zoom, mode and axis toggles excluded (§3.1). Fewer wins; equal to the optimum wins the bonus; time punishes sloppiness. Not built → `20_GAME_RULES/spec/SCORE.md` |
| `D100` | ⭐⭐ **THE SNAP IS AUTOMATIC AND A SEATED PIONEER CARRIES ITS FOLLOWERS; UNSNAP IS AN EPISODE** | 2026-09-26 | ✅ **BUILT 2026-09-26**: capture offset + fuchsia cone → lerp onto the cursor, then a CHILD; unsnap = Pioneer first, Follower second, a rapid move → §11.13 |
| `D101` | ⭐ **FREE FLOW MODE** — the cursor-drag slider, renamed, escapes the score | 2026-09-26 | key `pioneerCursorDrag` unchanged; the cursor drag is its first freedom |
| `D77` | ⭐⭐ **A FROZEN BODY SHOWS NO GIZMO, AND ONE OF ITS TOUCHES IS A MISS** | 2026-09-23 | ⭐ Binding, ⚠⚠ **but `D89` SWAPPED WHICH TOUCH**. ⛔⛔ Its *no gizmo* half lapsed when `leadingFace` was deleted, with **nothing going red**; it is a guard now. ⭐ *Deleting the file a rule lived in deletes the rule* |
| `D76` | ⭐⭐⭐ **A TRANSLATION TRACKS THE FINGER — the cosine loss is a DEFECT, and the edge-on case must not go dead** | 2026-09-23 | ⭐ Binding, ⚠ → history |
| `D75` | ⭐⭐⭐ **A TRANSLATION IS PROJECTED ONTO THE BODY'S OWN AXES, AND THE CHANNELS ARE REMAPPED** | 2026-09-22 | ⛔⛔ One finger slides a body about its own HORIZONTAL plane (`dx`→x, `dy`→depth) and a second finger LIFTS it. ⚠⚠ Its MAPPING is superseded by `D76`; the channels stand |
| `D82` | ⛔⛔⛔ **THE IN-ZONE BASIS IS DELETED — inside the capture zone is the same as outside** | 2026-09-23 | ⭐ Binding, ⚠ → history |
| `D84` | ⭐⭐⭐ **`WorldAxisB` NOW GOVERNS A FREE BODY'S *ROTATION* BASIS TOO** | 2026-09-23 | *"was it a miss?"* → *"do the change."* ⛔⛔ **NEITHER**: `D74`/`D75` named only TRANSLATION channels, so `A7`'s LIVE frame stood on — not by decision but because none was made. ⭐ `METHOD`: *a scope never stated is not a scope chosen.* ⭐⭐ **YAW WAS ALREADY WORLD-FIXED**; only PITCH and ROLL freeze |
| `D74` | ⭐⭐⭐ **`WorldAxisB` — THE OBJECT AXES ARE FIXED AT SCENE BOOT** | 2026-09-22 | ⭐ Binding, ⚠ → history |
| `D73` | ⭐⭐⭐ **A ROTATION IS ALWAYS ON AN INCREMENT** — ✅✅ **CLOSED BY A DEVICE LOOK** | 2026-09-22 | ⭐ Binding. `rotationIncrementDeg` 0–45/5, **ships at 0**; four formulations, three rejected by a hand. ⚠ `dy` no longer twisting is the unjudged cost |
| `D72` | ⭐⭐⭐ **THE RIGHT-HAND BODY IS A TRAPEZOIDAL PYRAMID, AND HALF AGAIN AS THICK** | 2026-09-22 | ⭐ Binding — built by MOVING a box's vertices; the hull and faces were already mesh-derived, so it cost nothing downstream |
| `D71` | ⭐⭐⭐ **THE SESSION BOOTS IN `TRANSLATE`** | 2026-09-22 | ⭐ Binding, re-confirmed by `D93`. ⛔⛔ **NOT the audit's defect returning**: that was a DISAGREEMENT between every document and the code, and the tell is whether any instruction still asks for the other mode. ⚠ A stale `scene.ts` comment claimed `ROTATE` until 2026-09-25 — the same shape, one layer down |
| `D70` | ⭐⭐⭐ **A MOVED PIONEER COSTS A FOLLOWER WHAT A TURNED ONE DOES — cyan BREAKS, orange follows** | 2026-09-21 | ⭐ Binding, and it corrects `D69`. ⭐⭐ **Position and orientation are two components of one pose** → §5.17 |
| `D69` | ⚠ **CORRECTED BY `D70` THE SAME DAY** — a translated Pioneer carried EVERY Follower; cyan should break instead | 2026-09-21 | ⚠ → §5.16 |
| `D68` | ⭐⭐ **A DOUBLE TAP REVERTS THE MODE EVEN WHEN THE SECOND HALF NEVER LIFTS** | 2026-09-21 | ⭐ Binding — the completing PRESS takes the toggle over, and its own release is spent → §5.15 |
| `D67` | ⚠ **REVERSED BY `D87`** — first touch the PIONEER, second the Follower. ⭐ Kept: it bought **several Followers in one hold**, which is exactly what the reversal costs | 2026-09-21 | ⚠ → §5.14 |
| `D66` | ⭐⭐⭐ **A PRESS DOES NOT TOGGLE THE MODE — ONLY A TAP DOES, WHICH IS `D28` AGAIN** | 2026-09-21 | ⭐ Binding, ⚠ → history |
| `D65` | ⚠ **REPEALED BY `D66` the same day** — a second touch's release never toggled; the cause was the PRESS all along | 2026-09-21 | ⚠ → history |
| `D64` | ⚠ **SUPERSEDED BY `D65`, THEN REPEALED WITH IT** — *driving consumes the toggle* | 2026-09-21 | ⚠ → history |
| `D63` | ⭐⭐⭐ **THE APPROACH SWING — the camera looks around the join and comes back** (TRIAL) | 2026-09-19 | ⭐ Binding, ⚠ → history |
| `D62` | ⭐⭐⭐ **A FOLLOWER MAY APPROACH ITS PIONEER AND NOTHING ELSE** | 2026-09-19 | ⭐ Binding — it overturns `A21` (*within a radius of ANY other object*), a freedom deliberately given up. ⛔ A Pioneer out of range captures **nothing** → §5.10 |
| `D61` | ⚠ **REPEALED BY `D66`** — the first outside press of a hold was inert, exempting a Follower | 2026-09-19 | ⚠ → history |
| `D60` | ⭐⭐⭐ **AND THE FIRST TOUCH THEN TRANSLATES, WHATEVER THE MODE** | 2026-09-19 | ⭐ Binding — a **DOF budget**: once the second touch owns roll + depth, leaving the first on the twist puts two fingers on ONE DOF → §5.8 |
| `D59` | ⭐⭐⭐ **AN ALIGNED FOLLOWER GIVES THE SECOND TOUCH BOTH AXES** | 2026-09-19 | ⭐ Binding — the rule moved from *where the finger landed* to *what the body is*: an aligned body has one rotational DOF left → §5.7 |
| `D58` | ⚠ **REPEALED BY `D66`** — a PRESS toggled the movement mode, in two places | 2026-09-19 | ⚠ → history |
| `D57` | ⭐⭐⭐ **THE SECOND TOUCHPOINT'S ROLL IS FLAT — `dx`, whatever the orientation** | 2026-09-19 | ⭐ Binding — authority was `|dir.x|`, **zero** for an axis horizontal on screen, and **silent**. Only the RATE could go; the sign is latched at the press → §5.5 |
| `D55` | ⚠ **SUPERSEDED IN PART BY `D67`** — the alignment still toggles ON at the PRESS; `A22`'s rapid-pair upgrade is gone with the second touch's tap count | 2026-09-19 | ⚠ → history |
| `D54` | ⭐⭐⭐ **`A15`'s ORPHAN UNSELECT IS DELETED — a holder keeps its object for the touchpoint's lifetime** | 2026-09-18 | ⭐ Binding, ⚠ → history |
| `D53` | ⭐⭐ **A BODY UNDER A FINGER IS NOT SWAYED** | 2026-09-18 | ⭐ Binding — the hand's own body must not wobble under it. ⚠ Excluded: the kicker, any held body, and (2026-09-26) the mover's **Pioneer within `pioneerSwayRadii` capture offsets** (slider, 3) |
| `D52` | ⚠ **RESOLVED BY `D57` THE SAME DAY** — the second touchpoint's roll had a dead zone: authority was `|dir.x|`, **0.00° for an axis horizontal on screen**, while the first touch never lost it | 2026-09-19 | ⚠ → §5.5 |
| `D51` | ⭐⭐⭐ **A HELD PIONEER MAY BE PINNED — it steers instead of being carried** | 2026-09-18 | ⭐ Binding — at `pioneerTranslates = 0` its finger gives the Follower **both** depth and roll, breaking `A16`'s one-axis rule on purpose |
| `D50` | ⭐⭐⭐ **EVERY OUTLINE AND FACE MARKER IS READ OFF THE MESH** | 2026-09-18 | ⭐ Binding — it deleted a `Map<name, dims>`, which for a cuboid coincides with the mesh and for an imported part is the wrong shape. ⭐ Why `D72`'s frustum cost nothing → §20 (approach) |
| `D49` | ⭐⭐⭐ **THE CAPTURE IS A SURFACE OFFSET, COMPUTED AT SPAWN** | 2026-09-18 | ⭐ Binding, ⚠ → history |
| `D48` | ⚠ **RETIRED WITHIN THE DAY, KEPT AS THE RECORD** — white contours required the alignment; the owner removed it, keeping the TRANSLATION condition | 2026-09-17 | ⚠ *both readings fit the evidence — name both* → §13 (approach) |
| `D47` | ⭐⭐⭐ **A MATE IS BROKEN BY PULLING IT APART WITH TWO FINGERS** | 2026-09-17 | ⭐ Binding, ⚠ → history |
| `D46` | ⭐⭐⭐ **APPROACH & MATE — the owner's mechanism, measured between CENTRES** | 2026-09-17 | ⭐ Binding, ⚠ → history |
| `D45` | ⭐⭐ **THE ALIGNMENT SNAP IS A SLERP, ON THE CAMERA RESET'S SLIDER** — binding; ⛔ NOT the rejected rotation inertia | 2026-09-17 | ⚠ → history |
| `D44` | ⭐⭐ **A TAP ON ANOTHER OBJECT'S FACE ALIGNS IN **EITHER** MOVEMENT MODE** | 2026-09-17 | ⭐ Binding — what keeps `D28`'s toggle reachable is a tap on **empty space or the held object**, not every tap in `TRANSLATE` → the alignment spec |
| `D43` | ⛔⛔⛔ **`A10`'s DEPTH GATE IS DELETED — both fingers integrate at once** | 2026-09-17 | ⭐ Binding — it retires a gate that cost six models and five device passes, so the account lives with the row that owns depth: [`queue_notes/IN8.md`](queue_notes/IN8.md) |
| `D42` | ⚠ **SUPERSEDED IN PART BY `D67`** — the flag became a GESTURE; which GESTURE asks for `FOLLOW` has now moved to the Pioneer's press | 2026-09-17 | ⚠ → history |
| `D41` | ⚠ **SUPERSEDED BY `D42` after four hours** — what a turned Pioneer costs the Follower; the two readings survive, the FLAG does not | 2026-09-17 | ⚠ → history |
| `D40` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap-to-align set is THE input model** | 2026-09-17 | ⭐ Binding, ⚠ → history |
| `D39` | ⚠ **SUPERSEDED IN PART BY `D67`** — both faces are still marked; the re-tap UNDO moved onto the **FollowerFace** | 2026-09-16 | ⚠ → history |
| `D38` | ⭐⭐ **FORK C IS THE DEFAULT, AND ITS ALIGNMENT NO LONGER SWITCHES THE MODE** | 2026-09-16 | ⭐ Binding — the automatic switch to translation is retired, *a rule the owner dictated himself*: it *"makes the game too complicated"*. ⭐⭐ So **the alignment CONSUMES the tap** |
| `D37` | ⭐⭐⭐ **FORK C: THE TRIGGER IS A TAP — no flick anywhere** | 2026-09-16 | ⭐ Binding, ⚠ → history |
| `D36` | ⭐⭐⭐ **§1.3's PROVISIONAL-MOTION ROLLBACK IS RETIRED** | 2026-09-16 | ⭐ Binding |
| `D35` | ⭐⭐ **THE FACE HIGHLIGHT OUTLIVES THE GESTURE AND DIES WITH THE ALIGNMENT** | 2026-09-16 | ⭐ Binding |
| `D34` | ⭐⭐⭐ **2sexte IS WIRED — and `A3`'s handover was never a decision** | 2026-09-16 | ⭐ Binding |
| `D33` | ⭐⭐⭐ **A FLICK IS READ OVER ITS TAIL, NOT THE WHOLE WINDOW** | 2026-09-16 | ⭐ Binding |
| `D32` | ⭐⭐ **A SHAKE EVICTS ONLY WHILE `ROTATE`, and it is fed BEFORE the refusal** | 2026-09-16 | ⭐ Binding |
| `D31` | ⭐⭐⭐ **THE ONE-TOUCHPOINT ROLL IS DELETED, NOT PARKED** | 2026-09-16 | ⭐ Binding |
| `D30` | ⭐⭐⭐ **A FLICK PUSHES AN ALIGNMENT ONLY WHILE THE MODE IS `ROTATE`** | 2026-09-16 | ⭐ Binding — read literally, §2's 2ter/2quater anchor whatever the drag was doing, so a brisk vertical TRANSLATE would move a part and then spin it · [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D29` | ⭐⭐⭐ **THREE ANCHOR-RULE FORKS BEHIND ONE FLAG, and `IN3` is built in fork B** | 2026-09-16 | ⭐ Binding |
| `D28` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap toggle is THE input model** | 2026-09-16 | ⭐ Binding |
| `D27` | ⭐⭐⭐ **ANY SINGLE TAP toggles the movement behaviour; a PRESS keeps every meaning it has** | 2026-09-16 | ⭐ Binding |
| `D26` | ⭐⭐ **THE ASSIGNMENTS WERE A FLAG, NOT A FORK** — ⚠ **CLOSED BY `D28`** | 2026-09-16 | ⚠ → history |
| `D25` | ⚠ **REVERSED BY `D54`** — a holder no longer under its object used to give the selection up | 2026-09-16 | ⚠ → history |
| `D24` | ⚠ **RETIRED BY `D28`** — a lift-and-replace of the second touchpoint was ONE gesture | 2026-09-16 | ⚠ → history |
| `D23` | ⚠ **SUPERSEDED BY `D28`** — one touchpoint TRANSLATES; a second held still ROTATES | 2026-09-16 | ⚠ → history |
| `D22` | ⭐⭐⭐ **Roll moves to the SECOND touchpoint's x** | 2026-09-15 | ⭐ Binding |
| `D21` | ⭐⭐⭐ **STATIONARY is a POSITION DEADBAND, not a timer** | 2026-09-15 | ⭐ Binding |
| `D20` | ⭐⭐ **Depth is a STILL HOLDER and a MOVING ANCHOR** | 2026-09-15 | ⭐ Binding |
| `D19` | ⭐⭐ **A DEADBAND on the pointer delta, per axis, with a slider** | 2026-09-15 | ⭐ Binding |
| `D18` | ⭐⭐ **Every object gesture stands on a GRAVITY FRAME** | 2026-09-15 | ⭐ Binding |
| `D17` | ⚠ **SUPERSEDED BY `D20`** — its TRIGGER is gone; the configuration and `A5`'s geometry stand. ⭐ Kept: it is what moved depth off the pinch | 2026-09-15 | ⚠ → history |
| `D16` | ⚠ **SUPERSEDED IN PART BY `D17`** — the pinch trigger is gone; the depth GEOMETRY it established stands | 2026-09-15 | ⚠ → history |
| `D15` | ⭐⭐ **Eviction is a QUICK BACK-AND-FORTH, not a roll** | 2026-09-15 | ⭐ Binding |
| `D14` | ⛔⛔ **Roll DRIVES the free DOF of an anchored object; 2sexte suppresses where it degenerates** | 2026-09-15 | ⭐ Binding |
| `D13` | ⛔⛔ **Eviction SPARES `MATE` entries** — a full turn clears alignments, never a joint | 2026-09-15 | ⭐ Binding |
| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, now a back-and-forth. ⭐ Kept: it moved eviction off the double-tap, and that half stands | 2026-09-15 | ⚠ → history |
| `D11` | ⭐⭐ **Adopt the PROVENANCE DISCIPLINE** from the owner's `TECHNIQUE_CATALOG.md` §0/§5 | 2026-09-15 | ⭐ Binding, ⚠ → history |
| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is half of a **depth pinch** now. ⭐ Kept: *ignored* still governs the THIRD touchpoint on | 2026-09-14 | ⚠ → history |
| `D9` | ⭐ **Babylon over three.js** | 2026-09-13 | ⭐ Binding — `pickResult.faceId` gives face picking directly, which rule 2 needs. ⚠ Apache-2.0, so the NOTICE must ship. ⭐ Reversible in about a day *because* of `D6` |

## ⚠ Still the owner's to make

| | what is blocked on it |
|---|---|
| **Un-snap: what breaks a mate on a touchscreen?** | the predecessor settled on *"un-snapping needs two hands"*; the touch equivalent is not obvious and `3D3` waits on it. ⚠ **`D12` did NOT answer it** — `D13` decided eviction SPARES mates, because clearing an alignment and detaching an assembly are different intentions |
| ✅ **~~WHICH TOUCHPOINT ASSIGNMENT SHIPS~~** — **ANSWERED by `D28`** | ⛔ Kept as a correction: it read *"deliberately not due yet"* until the owner judged three readings from one build and chose the tap toggle |
| ⭐⭐ **FORK C's SECOND HALF — what is left of it** | `TargetPosition`, its gizmo and the orbit about it are specified and **not built**; the approach is **superseded by `D46`** — projecting onto `centre → target` has no direction when that line faces the camera |
| **`axisMappingMode`: `rotated` vs `direct`** (§6bis) | build both, A/B on a device. The spec asks for the comparison rather than assuming |
| **`matePriorityOverAnchor`** (§1.4) | default is anchor-wins. The opposite reading exists as a flag for A/B |
| **Landmark registration, contact search, longest-axis alignment** | spec §5 lists them as deliberately deferred, so the gaps are explicit rather than implicit |

## ⛔ Owed, and not closed by anything above

⚠ **This block said the opposite until 2026-09-15** and the correction is kept, not deleted: it
read *"nothing in this repository has been touched by a finger … the recognizer does not exist
yet"* — true on day one, false since 2026-09-13.

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
