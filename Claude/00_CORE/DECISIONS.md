# DECISIONS — taken, and still open

> **STATUS** · live · **OWNS** · owner decisions and their consequences
> **READ IF** · you are about to re-open something, or need to know whose call it is
> **LAST VERIFIED** · 2026-09-21

⭐ **TIERED, since 2026-09-16**: a SUPERSEDED row keeps its headline here and its
consequence text in
[`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md).
⛔ The row never leaves this file — a decision that vanished from the list would be
re-taken — but its essay is not load-bearing at read time, and this file has a byte budget.
⚠ A superseded row's consequence cell is therefore just **⚠ Text: → history**. It said so in a
sentence eleven times over; the sentence is here once instead (compressed 2026-09-18 to make
room for `D49`, which is what the ratchet is for). ⭐ And again 2026-09-21 for `D64`: 26 rows
carried a full LINK to the file named above. It is here once now. **Both budgets came down
afterwards** — an addition that does not fit pays for itself.

⚠ A decision here is **not** a rejected experiment. Things tried and measured out
belong in a `REJECTED.md` — start one the first time something is measured out.

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
| `D64` | ⭐⭐⭐ **DRIVING CONSUMES THE TOGGLE — a second touch that drove the body RELEASES, it does not tap** | 2026-09-21 | *"when the second touch is released the mode toggles: it should not"* + *"discriminate between a release … and a tap or double-tap"*. ⛔⛔ It makes **`D61` real**: the lift toggled what the inert press had refused to, so the channel still alternated on every touch. ⭐ The discriminator is what the finger DID (`A11`'s deadband, via `applyDepthDrag`) — the tap test cannot be it, since a lift only reaches the rule by having passed it → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.11 |
| `D63` | ⭐⭐⭐ **THE APPROACH SWING — the camera looks around the join and comes back** (TRIAL) | 2026-09-19 | *"the camera orbits opposite to the dx movement … when the offset is null the camera shall be back to its original position."* ⭐⭐ Parallax: a face-to-face approach seen head-on gives a hand almost no depth cue. ⛔⛔ The return is **by construction** — an offset that is exactly zero at both ends — not a snapshot restore → [`../10_INPUT_TOUCH/spec/APPROACH_SWING_TRIAL.md`](../10_INPUT_TOUCH/spec/APPROACH_SWING_TRIAL.md) |
| `D62` | ⭐⭐⭐ **A FOLLOWER MAY APPROACH ITS PIONEER AND NOTHING ELSE** | 2026-09-19 | *"a Follower object cannot approach any other object than its Pioneer."* ⚠⚠ **It overturns `A21`** (*"within a SnapIsPossibleRadius of ANY other object"*) — a freedom deliberately given up. ⛔ A Pioneer out of range captures **nothing**; no fallback to the scene → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.10 |
| `D61` | ⭐⭐⭐ **ON A FREE BODY THE FIRST OUTSIDE PRESS OF A HOLD IS INERT** | 2026-09-19 | *"the first time the second touch is pressed outside any object shall not trigger a toggle … reset when the first touch releases."* ✅✅ It closes `D58`'s `A16` collision where `D59` could not: the press that PLACES the depth/roll finger no longer changes what it is about to drive. ⭐ A second press still toggles, so switching costs a lift and a re-press. ⚠ Reset **by construction** — the fact lives on the grip → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.9 |
| `D60` | ⭐⭐⭐ **AND THE FIRST TOUCH THEN TRANSLATES, WHATEVER THE MODE** | 2026-09-19 | *"… and the first touch shall control the translation with delta position x and y (which is currently the case in translation mode but not in rotation mode)."* ⛔⛔ A **DOF budget**: once the second touch owns roll + depth, leaving the first on the twist puts two fingers on ONE DOF. ⭐ It is `translatesOnDrag`'s own two-object rule generalised — which is why the owner saw it already working on the Pioneer → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.8 |
| `D59` | ⭐⭐⭐ **AN ALIGNED FOLLOWER GIVES THE SECOND TOUCH BOTH AXES** | 2026-09-19 | *"whatever translation mode, when an object is aligned as follower the second touch shall control the depth and the roll."* ⛔⛔ The rule moved from *where the finger landed* to *what the body is*: an aligned body has **one rotational DOF left** → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.7 |
| `D58` | ⭐⭐⭐ **THE MOVEMENT MODE TOGGLES ON A PRESS TOO** | 2026-09-19 | *"a new continued press (= a tap where there is no release) outside any object — … or on the exact same PioneerFace."* ⭐⭐ `D55`'s sweep reaching `D28`. ⚠⚠ Collides with `A16` — flagged, and narrowed by `D61` → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.6 |
| `D57` | ⭐⭐⭐ **THE SECOND TOUCHPOINT'S ROLL IS FLAT — `dx`, whatever the orientation** | 2026-09-19 | *"… whatever the orientation of the duo. If there are cos or sin projections on axis based on orientation, remove those projections."* ⛔⛔ Device-reported, and not the degeneracy anyone had written down: authority was `|dir.x|`, **zero** for an axis horizontal on screen — and **silent**. ⛔ Only the RATE could go; the sign is latched at the press → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §5.5 |
| `D55` | ⭐⭐⭐ **THE ALIGNMENT TOGGLES ON AT THE *PRESS*** (+`A22`, `A23`) | 2026-09-19 | *"as soon as a second touch is pressed on second object (= a tap or a continued press), the Pioneer - Follower mechanism toggles on. To toggle off, the rule stays unchanged."* ⛔⛔ The TRIGGER moved, not the mechanism — both ways OUT stay on the release. ✅ `A22`/`A23` extend it to the **upgrade** to `FOLLOW` and the **re-point**. ⚠⚠ Makes `D51` ordinary — owed a device look → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §2 |
| `D54` | ⭐⭐⭐ **`A15`'s ORPHAN UNSELECT IS DELETED — a holder keeps its object for the touchpoint's lifetime** | 2026-09-18 | *"Until first touch is released: first touch can continue controlling the object … and second touchpoint can be pressed again and thus control again the object."* ⛔⛔ It **reverses `D25`** and restores `IN2`'s latch to having **no exceptions**. ⚠ The geometry `A15` was built for is unchanged; what changed is the verdict: **keeping control beats re-resolving** → [`queue_notes/IN8.md`](queue_notes/IN8.md) |
| `D49` | ⭐⭐⭐ **THE CAPTURE IS A SURFACE OFFSET, COMPUTED AT SPAWN** | 2026-09-18 | *"I want to modify that to an offset to the faces… I would prefer [the game computes it] as this avoids to duplicate work in Blender."* ⭐⭐ Computed wins on its own merits: nothing reads a normal, so **inverted normals cannot affect it**. ⛔⛔ **The DISTANCE moved to surfaces; the approach DIRECTION must NOT** → [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md) §19 |
| `D47` | ⭐⭐⭐ **A MATE IS BROKEN BY PULLING IT APART WITH TWO FINGERS** | 2026-09-17 | Two fingers, one on each mated object, moving **oppositely along the centre→centre direction** past a `BreakThreshold` (slider, at the owner's request). ⭐⭐ It answers the worst finding of `D46`'s analysis — `D13` spares mates, so a mate was **permanent**. ⛔⛔ It also exposes a gap: §1.4's stack solves ORIENTATION, so a mate does not hold POSITION and *breaking* is today indistinguishable from *moving* — build `3D2`'s **seat first** → [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md) §8 |
| `D46` | ⭐⭐⭐ **APPROACH & MATE — the owner's mechanism, measured between CENTRES** | 2026-09-17 | ⭐⭐ It removes the blocker that stopped the previous approach: that one mapped a finger onto the direction to a point ON a face, which **collapses at contact**; centres cannot meet. ⚠ Specified, not built → [`../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](../10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md) |
| `D45` | ⭐⭐ **THE ALIGNMENT SNAP IS A SLERP, ON THE CAMERA RESET'S SLIDER** | 2026-09-17 | *"Make the rotation a slerp instead of instantaneous. Use the available sliders so we do not inflate the numbers of tuning parameters sliders."* ⛔⛔ **NOT the rejected rotation inertia**: that was a follower on CONTINUOUS rotation and a hand threw it out; this is a **discrete** pose change played over time, like the camera's fly-home → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §2 |
| `D44` | ⭐⭐ **A TAP ON ANOTHER OBJECT'S FACE ALIGNS IN **EITHER** MOVEMENT MODE** | 2026-09-17 | *"In translation mode, a tap or a double tap on the second object PioneerFace also toggles the alignment logic (same as for rotation)."* ⛔⛔ It overturns a condition I had called **load-bearing**, and the reasoning was over-broad: what keeps `D28`'s toggle reachable is a tap on **empty space or the held object**, not every tap in `TRANSLATE`. ⭐ `TapContext` no longer carries the movement mode at all → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D43` | ⛔⛔⛔ **`A10`'s DEPTH GATE IS DELETED — both fingers integrate at once** | 2026-09-17 | ⛔⛔ It retires `A10`'s gate — six models and five device passes — so the account lives with the row that owns depth: [`queue_notes/IN8.md`](queue_notes/IN8.md), and the code carries the note where the gate used to be |
| `D42` | ⭐⭐⭐ **THE FLAG BECAME A GESTURE — a single tap makes a `SNAPSHOT`, a double tap a `FOLLOW`** | 2026-09-17 | *"Remove the two forks and slider … one single tap … as fork C1; one double tap … as fork C2."* ⭐⭐ Better than a flag in the way that matters: two alignments can differ, and the **colours say which** — cyan+amber for a snapshot, both amber for a relationship. ⭐ Each gesture is its own toggle, so nothing has to be remembered → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §2 |
| `D41` | ⚠ **SUPERSEDED BY `D42` after four hours** — what a turned Pioneer costs the Follower; the two readings survive, the FLAG does not | 2026-09-17 | ⚠ Text: → history (linked at the top) |
| `D40` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap-to-align set is THE input model** | 2026-09-17 | *"Remove the fork A and the Fork B and set the fork C as the unique default."* ⛔ Deleted, not disabled — `D28`'s precedent, and its reason: **a dormant fork is a trap**. Gone: four modules, the flag, its validator rule, the slider, the HUD's fork line and **41 vectors** → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D39` | ⭐⭐ **BOTH FACES ARE MARKED, AND A RE-TAP ON THE PIONEER BREAKS THE ALIGNMENT** | 2026-09-16 | A **fill** for the face that moved, a **contour** for the one it was aimed at — which says which is which without a legend — and a second tap on that same face lets go. ⛔⛔ Both **retire `D37`'s *"the PioneerFace resets as null"***: its identity survives, though the CONSTRAINT is still a frozen world direction → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D38` | ⭐⭐ **FORK C IS THE DEFAULT, AND ITS ALIGNMENT NO LONGER SWITCHES THE MODE** | 2026-09-16 | Five corrections after the first device pass. ⛔⛔ The automatic switch to translation is **retired, a rule the owner dictated himself**: it *"makes the game too complicated"*. ⭐⭐ So **the alignment CONSUMES the tap** and overrides `D28` for that one gesture — stated, where it used to be a coincidence I leaned on → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D37` | ⭐⭐⭐ **FORK C: THE TRIGGER IS A TAP — no flick anywhere** | 2026-09-16 | Hold an object, **tap a face on another**, and the held one turns the minimum amount that makes its own face point **the same way** (parallel — the CAD *align* sense, chosen over a mate). ⭐⭐ Fork B was left because a release-time trigger *"releases the finger from the object it is tracking"*, and **both of its faults are properties of reading a verdict at the lift** → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D36` | ⭐⭐⭐ **§1.3's PROVISIONAL-MOTION ROLLBACK IS RETIRED** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D35` | ⭐⭐ **THE FACE HIGHLIGHT OUTLIVES THE GESTURE AND DIES WITH THE ALIGNMENT** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D34` | ⭐⭐⭐ **2sexte IS WIRED — and `A3`'s handover was never a decision** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D33` | ⭐⭐⭐ **A FLICK IS READ OVER ITS TAIL, NOT THE WHOLE WINDOW** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D32` | ⭐⭐ **A SHAKE EVICTS ONLY WHILE `ROTATE`, and it is fed BEFORE the refusal** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D31` | ⭐⭐⭐ **THE ONE-TOUCHPOINT ROLL IS DELETED, NOT PARKED** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D30` | ⭐⭐⭐ **A FLICK PUSHES AN ALIGNMENT ONLY WHILE THE MODE IS `ROTATE`** | 2026-09-16 | §2's 2ter/2quater predate the movement mode, and read literally a flick anchors whatever the drag was doing — so a brisk vertical **translate** would move a part and then spin it to align a face with gravity. ⭐ In `ROTATE` the hand is already turning the object, so an alignment completes the same intention · [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D29` | ⭐⭐⭐ **THREE ANCHOR-RULE FORKS BEHIND ONE FLAG, and `IN3` is built in fork B** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D28` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap toggle is THE input model** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D27` | ⭐⭐⭐ **ANY SINGLE TAP toggles the movement behaviour; a PRESS keeps every meaning it has** | 2026-09-16 | ⭐ Binding. Text: → history (linked at the top) |
| `D26` | ⭐⭐ **THE ASSIGNMENTS WERE A FLAG, NOT A FORK** — ⚠ **CLOSED BY `D28`** | 2026-09-16 | ⚠ Text: → history (linked at the top) |
| `D25` | ⚠ **REVERSED BY `D54`** — a holder no longer under its object used to give the selection up | 2026-09-16 | ⚠ Text: → history (linked at the top) |
| `D24` | ⚠ **RETIRED BY `D28`** — a lift-and-replace of the second touchpoint was ONE gesture | 2026-09-16 | ⚠ Text: → history (linked at the top) |
| `D23` | ⚠ **SUPERSEDED BY `D28`** — one touchpoint TRANSLATES; a second held still ROTATES | 2026-09-16 | ⚠ Text: → history (linked at the top) |
| `D22` | ⭐⭐⭐ **Roll moves to the SECOND touchpoint's x** | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D21` | ⭐⭐⭐ **STATIONARY is a POSITION DEADBAND, not a timer** | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D20` | ⭐⭐ **Depth is a STILL HOLDER and a MOVING ANCHOR** | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D19` | ⭐⭐ **A DEADBAND on the pointer delta, per axis, with a slider** | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D18` | ⭐⭐ **Every object gesture stands on a GRAVITY FRAME** | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D17` | ⚠ **SUPERSEDED BY `D20`** — its TRIGGER is gone; the configuration and `A5`'s geometry stand. ⭐ Kept: it is what moved depth off the pinch | 2026-09-15 | ⚠ Text: → history (linked at the top) |
| `D16` | ⚠ **SUPERSEDED IN PART BY `D17`** — the pinch trigger is gone; the depth GEOMETRY it established stands | 2026-09-15 | ⚠ Text: → history (linked at the top) |
| `D15` | ⭐⭐ **Eviction is a QUICK BACK-AND-FORTH, not a roll** | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D14` | ⛔⛔ **Roll DRIVES the free DOF of an anchored object; 2sexte suppresses where it degenerates** | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D13` | ⛔⛔ **Eviction SPARES `MATE` entries** — a full turn clears alignments, never a joint | 2026-09-15 | ⭐ Binding. Text: → history (linked at the top) |
| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, and is now a back-and-forth. ⭐ Kept: it is what moved eviction off the double-tap, and that half stands | 2026-09-15 | ⚠ Text: → history (linked at the top) |
| `D11` | ⭐⭐ **Adopt the PROVENANCE DISCIPLINE** from the owner's `TECHNIQUE_CATALOG.md` §0/§5 | 2026-09-15 | Every gesture rule carries a prior-art citation, or is marked ⚠ **novel to this project** so it can be assessed separately. Register: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md); binding form: `CONSTRAINTS` §10; review it feeds: `SEC4`. ⭐ Cheap now and expensive to reconstruct later, which is [`LESSONS_CARRIED.md`](LESSONS_CARRIED.md) §7's exact shape. ⚠ Three rules came out NOVEL COMPOSITE: §4's 6bis, 6ter, 6quater |
| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is now half of a **depth pinch**. ⭐ Kept: its *ignored* role still governs the THIRD touchpoint and beyond | 2026-09-14 | ⚠ Text: → history (linked at the top) |
| `D9` | ⭐ **Babylon over three.js** | 2026-09-13 | `pickResult.faceId` gives face picking directly, which rule 2 needs; multi-pointer handling is built in. ⚠ Apache-2.0, so the NOTICE must ship. ⭐ Reversible in about a day *because* of `D6` — that is what the boundary buys |

## ⚠ Still the owner's to make

| | what is blocked on it |
|---|---|
| **Un-snap: what breaks a mate on a touchscreen?** | the predecessor settled on *"un-snapping needs two hands"*. The touch equivalent is not obvious and `3D3` waits on it. ⚠ **`D12` did NOT answer it**: `D13` (2026-09-15) decided eviction spares mates, precisely because clearing an alignment and detaching an assembly are different intentions. This row stays open |
| ✅ **~~WHICH TOUCHPOINT ASSIGNMENT SHIPS~~** — **ANSWERED by `D28`** | ⛔ Kept one line as a correction: this read *"deliberately not due yet"* until 2026-09-16, when the owner judged all three readings from one build and chose the tap toggle. `IN13` is closed and the other two are deleted |
| ⭐⭐⭐ **FORK C's SECOND HALF — four decisions, and one is a real problem** | `TargetPosition`, its gizmo, the orbit about it and the two-object approach are specified by the owner and **not built**. ⛔⛔ The approach projects a screen delta onto the screen projection of `centre → target`, which **has no direction when that line faces the camera** and **shrinks to noise at contact** — and fork C's target state displaces roll and depth, so there is nothing to hand over to. ⚠ Also owed: `A15` will drop the selection mid-approach; a second touchpoint outside any object while aligned is undefined; and whether the orbit is position-only. ⭐ And the standing one: fork C's align is PARALLEL, so it orients without ever joining — is a mate rule owed? → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §7 |
| **`axisMappingMode`: `rotated` vs `direct`** (§6bis) | build both, A/B on a device. The spec asks for the comparison rather than assuming |
| **`matePriorityOverAnchor`** (§1.4) | default is anchor-wins. The opposite reading exists as a flag for A/B |
| **Landmark registration, contact search, longest-axis alignment** | spec §5 lists them as deliberately deferred, so the gaps are explicit rather than implicit |

## ⛔ Owed, and not closed by anything above

⚠ **This block said the opposite until 2026-09-15**, and is kept as a correction rather
than deleted: it read *"nothing in this repository has been touched by a finger … the
recognizer does not exist yet."* Both were true when written on day one and neither has
been true since 2026-09-13.

✅ **The device look is no longer owed — it is the loop.** `IN1`, `IN9`, `IN2` and
`IN4`'s rule 6 were each closed by finger: `IN1` over **seven** device passes, rule 6 over
**five**, and `IN9`/`IN2` by looks their dossiers record without counting. ⛔ The defects
those passes found are counted in ONE place — the ledger in [`QUEUE.md`](QUEUE.md)'s
YOU-ARE-HERE block — and this file deliberately does not restate the total.

⛔ **What IS still owed is MEASUREMENT, which is a different thing** (`IN5`). Of every
number in `gestureConfig.ts`:

* **one is MEASURED** — `pointerNoiseMm` = 0.761 mm, and measuring it immediately exposed
  a defect in the sagitta guard that eight device passes had accepted;
* **four groups are JUDGEMENTS** — the six orbit ring values, the four gains, rule 6's
  four feel numbers, and the two sway sets: chosen by a hand on the glass, which makes them
  real but not derived. ⚠ Read the count off `gestureConfig.ts`, not off this sentence;
* **the rest are PLACEHOLDERS** and must not be quoted as though anything supports them.

⭐ And the standing rule is unchanged: **`METHOD` closes a change with a device look and
nothing else**, so every row still to come owes one of its own.

## ⭐⭐ Two entries that are not decisions, kept as pointers

⭐ **A report the owner WITHDREW** (*"you destroyed the rotation around the gravity axis…"*,
2026-09-15, then *"it's alright"*). ⛔ `A7`/`D18` was not the fault; `tests/a7_wiring.test.ts`
MEASURES the composition at four camera tilts. ⭐⭐ The transferable part: mistake shape 4 — *a
composition nobody computed* — aims at **correct** work as easily as broken. Full text in
[`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md).

⚠ **Two things were measured out and REVERTED** — rotation inertia (`src/input/spin.ts`) and
`targetVelocity` — recorded in full under *"TWO THINGS A NEW SESSION MUST NOT REBUILD"* in
[`QUEUE.md`](QUEUE.md). ⛔ One home, not two; a third splits that block into `REJECTED.md`.
