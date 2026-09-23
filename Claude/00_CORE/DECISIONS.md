# DECISIONS — taken, and still open

> **STATUS** · live · **OWNS** · owner decisions and their consequences
> **READ IF** · you are about to re-open something, or need to know whose call it is
> **LAST VERIFIED** · 2026-09-21

⭐ **TIERED, since 2026-09-16**: a SUPERSEDED row keeps its headline here and its consequence
text in [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md).
⛔ The row never leaves this file — a decision that vanished from the list would be re-taken —
but its essay is not load-bearing at read time, and this file has a byte budget.

⭐⭐ **SO A CONSEQUENCE CELL IS SHORTHAND, AND THE KEY IS HERE ONCE**: **⚠ → history** is a
superseded row whose essay is in that file; **⭐ Binding** is a live row whose text went there
too; a bare **§N** points at
[`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) and
**§N (approach)** at the approach spec. ⚠ Each was written out in full a dozen times or
more and is collapsed to its key here, every collapse paying for an addition — `D49`, `D64`,
`D71`/`D72`, and now `D48`–`D53`. **An addition that does not fit pays for itself.**

⚠ A decision here is **not** a rejected experiment; things measured out are named at the foot
of this file.

## Taken and binding

| # | decision | date | consequence |
|---|---|---|---|
| `D1` | ⭐⭐⭐ **TypeScript + Babylon.js, web-first, Capacitor for stores** | 2026-09-13 | Made on **day one**, deliberately, because the predecessor's deferred platform decision blocked four rows and the whole game layer. One codebase for web + iOS + Android + desktop |
| `D2` | ⛔⛔ **Audience is ALL PUBLIC, INCLUDING YOUTH** | 2026-09-13 | Carried from the predecessor. COPPA / GDPR-K live → no analytics or ads SDKs; local-only is load-bearing; Play Families + Apple Kids rules apply |
| `D3` | **The game will be commercialised** | carried | `N13` binding: no non-commercially-licensed dependency |
| `D4` | ⭐ **Manipulation is direct and kinematic, not physics-driven** | carried | The transform is driven straight from input. Never regretted in the predecessor |
| `D5` | ⭐⭐ **Assembly is by MATE CONNECTORS** (Onshape's model) | carried | `src/core/mate_connector.ts`, and the four rules in `LESSONS_CARRIED.md` |
| `D6` | ⛔ **`src/core` and `src/input` import no engine**, and a test enforces it | 2026-09-13 | The predecessor stated the same contract in prose and it silently became false |
| `D7` | **Thresholds in millimetres, never pixels** | 2026-09-13 | `src/core/units.ts`; every threshold converts at runtime |
| `D8` | ⭐ **The constraint stack replaces the three booleans** | 2026-09-13 | Owner's revision-5 spec §1.4, adopted as the design of record |
| `D76` | ⭐⭐⭐ **A TRANSLATION TRACKS THE FINGER — the cosine loss is a DEFECT, and the edge-on case must not go dead** | 2026-09-23 | Three device reports: the channels *"seem inverted"*, *"the input seems very weak and not the same as the gravity axis"*, and *"the holder's dy is dead at a level camera"*. ⭐⭐ **BLENDER ANSWERS ALL THREE, AND IT ANSWERS *NO* TO THE FIRST**: it never binds screen-x to a world axis — unconstrained it follows the mouse in the view plane, constrained it maps the WHOLE delta onto the chosen axis and still tracks it, with **no cosine loss**. ⛔ So the rate is now DIVIDED by the foreshortening, and the holder's 2D delta is **solved onto both horizontal axes** so the body follows the finger (`translatePairing=1`, default; `0` is the dictated channels, now tracking too). ⚠⚠ **AND THE PLANE SOLVE MAKES `D74`'s IN-ZONE BASIS INERT** — an orthogonalised face basis spans the same horizontal plane, so nothing changes at the zone edge. ⛔ Owner's call. ⭐ Edge-on falls back to the judged fixed rate inside **Blender's own 5° cone** (`axisTrackingConeDeg`) |
| `D75` | ⭐⭐⭐ **A TRANSLATION IS PROJECTED ONTO THE BODY'S OWN AXES, AND THE CHANNELS ARE REMAPPED** | 2026-09-22 | *"dx and dy from touch on the object control the translation on object x axis and object depth axis, and dy from second touch control the translation on object gravity axis … projected onto the object axis (same as what Blender does)"*. ⛔⛔ One finger now slides a body about its own HORIZONTAL plane and a second finger LIFTS it — `dy` and the second touch swapped jobs. ⭐⭐ **The projection is NOT normalised** (the owner's choice over Blender's division): a foreshortened axis goes QUIET instead of running away, so the rule needs no cutoff — and the sign `depthTranslate` needed `awaySign` for **falls out of it**. ⚠ Cost, inherent: the holder's `dy` is dead at a level camera. ⭐ A **LeadingFace** (the exit face along the direction the body ACTUALLY goes) carries a 3-axis gizmo → `input/axis_translate.ts`, `core/leading_face.ts` |
| `D74` | ⭐⭐⭐ **`WorldAxisB` — THE OBJECT AXES ARE FIXED AT SCENE BOOT, AND THE CAPTURE ZONE OVERRIDES THEM** | 2026-09-22 | *"the world x, world gravity and world depth axis are created at scene boot as per camera position at scene boot and are fixed forever for this scene"*, **default ON**; `0` restores the camera-referred build. ⛔⛔ Inside the offset radius zone the basis is the **LeadingFace normal, gravity and their orthogonal** instead — ⭐ **orthogonalised** (the owner's choice), because a sloped face's normal is not square to gravity and `A7`'s argument binds again: *there is no gain that fixes a basis that is not a basis*. ⚠ Re-decided on the zone's **EDGE**, which is what breaks the circularity (the basis picks the travel, the travel picks the face, the face builds the basis). ⛔ `cameraOffsetZoneEnterSetupB` gates a method **not yet defined** → `input/object_axes.ts` |
| `D73` | ⭐⭐⭐ **A ROTATION IS ALWAYS ON AN INCREMENT** — ✅✅ **CLOSED BY A DEVICE LOOK** | 2026-09-22 | ⭐ Binding. `rotationIncrementDeg` 0–45/5, **ships at 0**; four formulations, three rejected by a hand. ⚠ `dy` no longer twisting is the unjudged cost |
| `D72` | ⭐⭐⭐ **THE RIGHT-HAND BODY IS A TRAPEZOIDAL PYRAMID, AND HALF AGAIN AS THICK** | 2026-09-22 | ⭐ Binding. Built by MOVING a box's vertices (`core/frustum.ts`); the hull and the faces were already mesh-derived, so it cost nothing downstream |
| `D71` | ⭐⭐⭐ **THE SESSION BOOTS IN `TRANSLATE`** | 2026-09-22 | *"Set the default to translation mode at scene boot."* ⚠⚠ It reverses *"Default start: rotation mode"* (2026-09-16) and its 2026-09-17 re-confirmation, **both kept** — *a claim that was overturned is more useful than one silently deleted*. ⛔⛔ **It is NOT the audit's defect returning**: that was a DISAGREEMENT between every document and the code; the tell is not the VALUE but whether any instruction still asks for the other mode. |
| `D70` | ⭐⭐⭐ **A MOVED PIONEER COSTS A FOLLOWER WHAT A TURNED ONE DOES — cyan BREAKS, orange follows** | 2026-09-21 | *"a translation of the pioneer should break the alignment of the cyan."* ⛔⛔ It corrects `D69`. ⭐⭐ **Position and orientation are two components of one pose**; answering differently for each WAS the asymmetry → §5.17 |
| `D69` | ⚠ **CORRECTED BY `D70` THE SAME DAY** — a translated Pioneer carried EVERY Follower; cyan should break instead | 2026-09-21 | ⚠ → §5.16 |
| `D68` | ⭐⭐ **A DOUBLE TAP REVERTS THE MODE EVEN WHEN THE SECOND HALF NEVER LIFTS** | 2026-09-21 | ⭐ Binding — the completing PRESS takes the toggle over, and its own release is spent → §5.15 |
| `D67` | ⭐⭐⭐ **THE ROLES ARE INVERTED — FIRST TOUCH THE PIONEER, SECOND THE FOLLOWER** | 2026-09-21 | *"First the Pioneer & PioneerFace, second the Follower & the FollowerFace"*. ⭐⭐ It buys **several Followers in one hold**. ⚠⚠ **Cost**: a frozen body can never be a Follower, so *align a part to the plate* is now *hold the plate FIRST* → §5.14 |
| `D66` | ⭐⭐⭐ **A PRESS DOES NOT TOGGLE THE MODE — ONLY A TAP DOES, WHICH IS `D28` AGAIN** | 2026-09-21 | *"A press never toggles while a body is held, but a tap by the second touchpoint can (as per present rule for tap)."* ⛔⛔ It repeals `D58`, `D61`, `D64` and `D65` — one chain whose first link was the only decision in it. ⚠ *When a rule's effect is masked during a gesture, the reported event is where it became VISIBLE, not where it happened.* ⭐ Restores `A16` → §5.13 |
| `D65` | ⚠ **REPEALED BY `D66` the same day** — a second touch's release never toggled; the cause was the PRESS all along | 2026-09-21 | ⚠ → history |
| `D64` | ⚠ **SUPERSEDED BY `D65`, THEN REPEALED WITH IT** — *driving consumes the toggle* | 2026-09-21 | ⚠ → history |
| `D63` | ⭐⭐⭐ **THE APPROACH SWING — the camera looks around the join and comes back** (TRIAL) | 2026-09-19 | ⭐ Binding, and the trial's whole record is [`../10_INPUT_TOUCH/spec/APPROACH_SWING_TRIAL.md`](../10_INPUT_TOUCH/spec/APPROACH_SWING_TRIAL.md), which carries its delete list |
| `D62` | ⭐⭐⭐ **A FOLLOWER MAY APPROACH ITS PIONEER AND NOTHING ELSE** | 2026-09-19 | *"a Follower object cannot approach any other object than its Pioneer."* ⚠⚠ **It overturns `A21`** (*"within a SnapIsPossibleRadius of ANY other object"*) — a freedom deliberately given up. ⛔ A Pioneer out of range captures **nothing**; no fallback to the scene → §5.10 |
| `D61` | ⚠ **REPEALED BY `D66`** — the first outside press of a hold was inert, exempting a Follower | 2026-09-19 | ⚠ → history |
| `D60` | ⭐⭐⭐ **AND THE FIRST TOUCH THEN TRANSLATES, WHATEVER THE MODE** | 2026-09-19 | ⭐ Binding — a **DOF budget**: once the second touch owns roll + depth, leaving the first on the twist puts two fingers on ONE DOF → §5.8 |
| `D59` | ⭐⭐⭐ **AN ALIGNED FOLLOWER GIVES THE SECOND TOUCH BOTH AXES** | 2026-09-19 | *"whatever translation mode, when an object is aligned as follower the second touch shall control the depth and the roll."* ⛔⛔ The rule moved from *where the finger landed* to *what the body is*: an aligned body has **one rotational DOF left** → §5.7 |
| `D58` | ⚠ **REPEALED BY `D66`** — a PRESS toggled the movement mode, in two places | 2026-09-19 | ⚠ → history |
| `D57` | ⭐⭐⭐ **THE SECOND TOUCHPOINT'S ROLL IS FLAT — `dx`, whatever the orientation** | 2026-09-19 | ⭐ Binding — authority was `|dir.x|`, **zero** for an axis horizontal on screen, and **silent**. Only the RATE could go; the sign is latched at the press → §5.5 |
| `D55` | ⚠ **SUPERSEDED IN PART BY `D67`** — the alignment still toggles ON at the PRESS; `A22`'s rapid-pair upgrade is gone with the second touch's tap count | 2026-09-19 | ⚠ → history |
| `D54` | ⭐⭐⭐ **`A15`'s ORPHAN UNSELECT IS DELETED — a holder keeps its object for the touchpoint's lifetime** | 2026-09-18 | ⭐ Binding — it REVERSES `D25` and restores `IN2`'s latch to having no exceptions. ⚠ The geometry was never the fault: **keeping control beats re-resolving** → [`queue_notes/IN8.md`](queue_notes/IN8.md) |
| `D53` | ⭐⭐ **A BODY UNDER A FINGER IS NOT SWAYED** | 2026-09-18 | *"While a touchpoint is pressed on an object, disable its sway."* ⛔ A **second** exclusion — `receivesSway` already spared the body that CAUSED the kick. ⚠ They coincide only while one body is held; two fingers on two bodies is where they part — the posture `D51` made central |
| `D52` | ⚠ **RESOLVED BY `D57` THE SAME DAY** — the second touchpoint's roll had a dead zone: authority was `|dir.x|`, **0.00° for an axis horizontal on screen**, while the first touch never lost it | 2026-09-19 | ⚠ → §5.5 |
| `D51` | ⭐⭐⭐ **A HELD PIONEER MAY BE PINNED — it steers, not carries** | 2026-09-18 | *"a flag to toggle on or off the translation of the Pioneer … the second touchpoint controls both the depth translation and the roll of the Follower."* ⛔ `pioneerTranslates` is a **rule selector, not a tunable**, and breaks `A16`'s one-axis rule on purpose → §21 (approach) |
| `D50` | ⭐⭐⭐ **EVERY OUTLINE AND FACE MARKER IS READ OFF THE MESH** | 2026-09-18 | *"the outlines shall be calculated from meshes at the time the object is imported"*. ⛔⛔ It deleted a `Map<name, dims>`: for a cuboid a box and the mesh coincide, which is why it survived two device passes — for an imported part it is the wrong shape. ⭐ Why `D72`'s frustum cost nothing → §20 (approach) |
| `D49` | ⭐⭐⭐ **THE CAPTURE IS A SURFACE OFFSET, COMPUTED AT SPAWN** | 2026-09-18 | *"I want to modify that to an offset to the faces… I would prefer [the game computes it] as this avoids to duplicate work in Blender."* ⭐⭐ Computed wins on its own merits: nothing reads a normal, so **inverted normals cannot affect it**. ⛔⛔ **The DISTANCE moved to surfaces; the approach DIRECTION must NOT** → §19 |
| `D48` | ⚠ **RETIRED WITHIN THE DAY, KEPT AS THE RECORD** — white contours required the alignment; the owner removed it, keeping the TRANSLATION condition | 2026-09-17 | ⚠ *both readings fit the evidence — name both* → §13 (approach) |
| `D47` | ⭐⭐⭐ **A MATE IS BROKEN BY PULLING IT APART WITH TWO FINGERS** | 2026-09-17 | ⭐ Binding — one finger on each mated body, moving oppositely along the centre→centre direction past a `BreakThreshold` (slider). ⛔ It needs `3D2`'s **seat** first, or *breaking* is indistinguishable from *moving* → §8 (approach) |
| `D46` | ⭐⭐⭐ **APPROACH & MATE — the owner's mechanism, measured between CENTRES** | 2026-09-17 | ⭐⭐ It removes the blocker that stopped the previous approach: that one mapped a finger onto the direction to a point ON a face, which **collapses at contact**; centres cannot meet. ⚠ Specified, not built → the approach spec |
| `D45` | ⭐⭐ **THE ALIGNMENT SNAP IS A SLERP, ON THE CAMERA RESET'S SLIDER** — binding; ⛔ NOT the rejected rotation inertia | 2026-09-17 | ⚠ → history |
| `D44` | ⭐⭐ **A TAP ON ANOTHER OBJECT'S FACE ALIGNS IN **EITHER** MOVEMENT MODE** | 2026-09-17 | ⭐ Binding — it overturned a condition I had called load-bearing; what keeps `D28`'s toggle reachable is a tap on **empty space or the held object** → the alignment spec |
| `D43` | ⛔⛔⛔ **`A10`'s DEPTH GATE IS DELETED — both fingers integrate at once** | 2026-09-17 | ⛔⛔ It retires `A10`'s gate — six models and five device passes — so the account lives with the row that owns depth: [`queue_notes/IN8.md`](queue_notes/IN8.md), and the code carries the note where the gate used to be |
| `D42` | ⚠ **SUPERSEDED IN PART BY `D67`** — the flag became a GESTURE; which GESTURE asks for `FOLLOW` has now moved to the Pioneer's press | 2026-09-17 | ⚠ → history |
| `D41` | ⚠ **SUPERSEDED BY `D42` after four hours** — what a turned Pioneer costs the Follower; the two readings survive, the FLAG does not | 2026-09-17 | ⚠ → history |
| `D40` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap-to-align set is THE input model** | 2026-09-17 | ⭐ Binding — deleted, not disabled (`D28`'s precedent: *a dormant fork is a trap*). Gone: four modules, the flag, its validator rule, the slider, the HUD's fork line and **41 vectors** → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D39` | ⚠ **SUPERSEDED IN PART BY `D67`** — both faces are still marked; the re-tap UNDO moved onto the **FollowerFace** | 2026-09-16 | ⚠ → history |
| `D38` | ⭐⭐ **FORK C IS THE DEFAULT, AND ITS ALIGNMENT NO LONGER SWITCHES THE MODE** | 2026-09-16 | ⭐ Binding — the automatic switch to translation is retired, *a rule the owner dictated himself*: it *"makes the game too complicated"*. ⭐⭐ So **the alignment CONSUMES the tap** |
| `D37` | ⭐⭐⭐ **FORK C: THE TRIGGER IS A TAP — no flick anywhere** | 2026-09-16 | ⭐ Binding — hold an object, **tap a face on another**, and the held one turns the minimum that makes its own face point the same way. ⛔ Fork B died because a release-time trigger *"releases the finger from the object it is tracking"* → the alignment spec |
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
| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, and is now a back-and-forth. ⭐ Kept: it is what moved eviction off the double-tap, and that half stands | 2026-09-15 | ⚠ → history |
| `D11` | ⭐⭐ **Adopt the PROVENANCE DISCIPLINE** from the owner's `TECHNIQUE_CATALOG.md` §0/§5 | 2026-09-15 | ⭐ Binding — every gesture rule carries a dated prior-art citation or is marked ⚠ novel. Register: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md); binding form: `CONSTRAINTS` §10; the review it feeds is `SEC4` |
| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is now half of a **depth pinch**. ⭐ Kept: its *ignored* role still governs the THIRD touchpoint and beyond | 2026-09-14 | ⚠ → history |
| `D9` | ⭐ **Babylon over three.js** | 2026-09-13 | ⭐ Binding — `pickResult.faceId` gives face picking directly, which rule 2 needs. ⚠ Apache-2.0, so the NOTICE must ship. ⭐ Reversible in about a day *because* of `D6` |

## ⚠ Still the owner's to make

| | what is blocked on it |
|---|---|
| **Un-snap: what breaks a mate on a touchscreen?** | the predecessor settled on *"un-snapping needs two hands"*. The touch equivalent is not obvious and `3D3` waits on it. ⚠ **`D12` did NOT answer it**: `D13` (2026-09-15) decided eviction spares mates, precisely because clearing an alignment and detaching an assembly are different intentions. This row stays open |
| ✅ **~~WHICH TOUCHPOINT ASSIGNMENT SHIPS~~** — **ANSWERED by `D28`** | ⛔ One line kept as a correction: it read *"deliberately not due yet"* until the owner judged three readings from one build and chose the tap toggle. `IN13` closed, the other two deleted |
| ⭐⭐ **FORK C's SECOND HALF — what is left of it** | `TargetPosition`, its gizmo and the orbit about it are specified and **not built**. ⛔⛔ Its approach is **superseded by `D46`**: projecting onto `centre → target` has no direction when that line faces the camera and shrinks to noise at contact. ⚠ Still owed: a second touchpoint outside any object while aligned is undefined, and whether the orbit is position-only. ⭐ And the standing one: the align is PARALLEL, so it orients without ever joining — **is a mate rule owed?** → §7 |
| **`axisMappingMode`: `rotated` vs `direct`** (§6bis) | build both, A/B on a device. The spec asks for the comparison rather than assuming |
| **`matePriorityOverAnchor`** (§1.4) | default is anchor-wins. The opposite reading exists as a flag for A/B |
| **Landmark registration, contact search, longest-axis alignment** | spec §5 lists them as deliberately deferred, so the gaps are explicit rather than implicit |

## ⛔ Owed, and not closed by anything above

⚠ **This block said the opposite until 2026-09-15** and the correction is kept, not deleted: it
read *"nothing in this repository has been touched by a finger … the recognizer does not exist
yet"* — true on day one, false since 2026-09-13.

✅ **The device look is no longer owed — it is the loop.** `IN1` (**seven** passes), `IN9`, `IN2`
and `IN4`'s rule 6 (**five**) were each closed by finger. ⛔ The defects they found are counted
in ONE place, the ledger in [`QUEUE.md`](QUEUE.md)'s YOU-ARE-HERE block; this file deliberately
does not restate the total.

⛔ **What IS still owed is MEASUREMENT, a different thing** (`IN5`). Of every number in
`gestureConfig.ts`: **one is MEASURED** — `pointerNoiseMm` = 0.761 mm, and measuring it exposed
a defect in the sagitta guard eight device passes had accepted; **four groups are JUDGEMENTS** —
the six orbit rings, the four gains, rule 6's four feel numbers and the two sway sets, chosen by
a hand, so real but not derived (⚠ read the count off `gestureConfig.ts`, not off this
sentence); **the rest are PLACEHOLDERS** and must not be quoted as though anything supports them.

⭐ And the standing rule is unchanged: **`METHOD` closes a change with a device look and
nothing else**, so every row still to come owes one of its own.

## ⭐⭐ Two entries that are not decisions, kept as pointers

⭐ **A report the owner WITHDREW** (*"you destroyed the rotation around the gravity axis…"*,
2026-09-15, then *"it's alright"*) — `A7`/`D18` was not the fault, and `tests/a7_wiring.test.ts`
measures the composition at four camera tilts. ⭐⭐ Mistake shape 4, *a composition nobody
computed*, aims at **correct** work as easily as broken → history.

⚠ **Two things were measured out and REVERTED** — rotation inertia and `targetVelocity` → the
*"TWO THINGS A NEW SESSION MUST NOT REBUILD"* block in [`QUEUE.md`](QUEUE.md). ⛔ One home, not
two; a third splits that block into `REJECTED.md`.
