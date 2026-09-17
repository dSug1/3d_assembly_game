# DECISIONS — taken, and still open

> **STATUS** · live · **OWNS** · owner decisions and their consequences
> **READ IF** · you are about to re-open something, or need to know whose call it is
> **LAST VERIFIED** · 2026-09-16

⭐ **TIERED, since 2026-09-16**: a SUPERSEDED row keeps its headline here and its
consequence text in
[`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md).
⛔ The row never leaves this file — a decision that vanished from the list would be
re-taken — but its essay is not load-bearing at read time, and this file has a byte budget.

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
| `D45` | ⭐⭐ **THE ALIGNMENT SNAP IS A SLERP, ON THE CAMERA RESET'S SLIDER** | 2026-09-17 | *"Make the rotation a slerp instead of instantaneous. Use the available sliders so we do not inflate the numbers of tuning parameters sliders."* ⛔⛔ **NOT the rejected rotation inertia**: that was a follower on CONTINUOUS rotation and a hand threw it out; this is a **discrete** pose change played over time, like the camera's fly-home. ⭐ A gesture in flight must answer the finger instantly; a snap the hand has already asked for may take a moment to arrive. ⚠ It runs at **2/7 of** `cameraResetMs` (a ratio, not a second tunable — *"twice faster"*, then *"1/3rd"*, then *"2/7th"*, same day) with the camera's own `easeInOut`, so one slider still governs both. ⛔ The constraint is pushed IMMEDIATELY while the pose travels, and a release mid-flight **stops** the snap rather than finishing it, because releasing must not rotate the object |
| `D44` | ⭐⭐ **A TAP ON ANOTHER OBJECT'S FACE ALIGNS IN **EITHER** MOVEMENT MODE** | 2026-09-17 | *"In translation mode, a tap or a double tap on the second object PioneerFace also toggles the alignment logic (same as for rotation)."* ⛔⛔ It overturns a condition I had called **load-bearing**, and the reasoning was over-broad: what keeps `D28`'s toggle reachable is a tap on **empty space or the held object**, not every tap in `TRANSLATE`. ⭐ `TapContext` no longer carries the movement mode at all → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D43` | ⛔⛔⛔ **`A10`'s DEPTH GATE IS DELETED — both fingers integrate at once** | 2026-09-17 | ⛔⛔ It retires `A10`'s gate — six models and five device passes — so the account lives with the row that owns depth: [`queue_notes/IN8.md`](queue_notes/IN8.md), and the code carries the note where the gate used to be |
| `D42` | ⭐⭐⭐ **THE FLAG BECOMES A GESTURE — a single tap aligns as a SNAPSHOT, a double tap as a FOLLOW** | 2026-09-17 | ⛔ `D41`'s two forks and their slider are **deleted** hours after they were built. ⭐⭐ The reading is no longer a session setting but **a property of each alignment**, chosen by the gesture that makes it and **visible**: two colours for a snapshot (cyan Follower, amber Pioneer), ONE colour for a relationship (both amber, the owner's instruction). ⭐ Each gesture is its own toggle — the same gesture on the same face lets go (`D39`), the OTHER switches the mode — so nothing has to be remembered. ⚠ And a double tap that aligns **no longer flies the camera home** (owner: *"the double tap in such case shall not trigger the camera orbit reset"*); everywhere else it still does → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D41` | ⚠ **SUPERSEDED BY `D42` after four hours — the two readings survive, the FLAG does not.** What a turned Pioneer costs the Follower | 2026-09-17 | ⚠ Superseded after four hours — the two readings survive, the FLAG does not (`D42`). Text moved: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D40` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap-to-align set is THE input model** | 2026-09-17 | *"Remove the fork A and the Fork B and set the fork C as the unique default. Remove the slider for the forks accordingly."* ⛔ Deleted, not disabled — `D28`'s precedent, and its reason: **a dormant fork is a trap**. Gone: `anchor_fork.ts`, `align_flick.ts` (fork B's flick-to-align), `drag_rule.ts`, the `anchorRules` flag, its validator rule, the slider, the HUD's fork line and **41 vectors**. ⭐⭐ And with them a whole class of code: the CAP of one alignment makes `ROTATE_REFUSED` unreachable, so eviction's *escape from a full stack* vectors describe a state that can no longer exist. ⚠ A sanity sweep went with it — six orphans, one duplicate gain under two names, one skeleton function → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D39` | ⭐⭐ **BOTH FACES ARE MARKED, AND A RE-TAP ON THE PIONEER BREAKS THE ALIGNMENT** | 2026-09-16 | A **fill** for the face that moved, a **contour** for the one it was aimed at — which says which is which without a legend — and a second tap on that same face lets go. ⛔⛔ Both **retire `D37`'s *"the PioneerFace resets as null"***: its identity survives, though the CONSTRAINT is still a frozen world direction. ⚠ The re-tap is a `ROTATE` gesture, so the shake stays the only undo while translating — and the owner will judge one against the other → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D38` | ⭐⭐ **FORK C IS THE DEFAULT, AND ITS ALIGNMENT NO LONGER SWITCHES THE MODE** | 2026-09-16 | Five corrections after the first device pass. ⭐ *"The game shall start by default to fork C"* overrules my reasoning that the default must be the only set a hand has closed — the owner IS the hand. ⛔⛔ And the automatic switch to translation is **retired, a rule the owner dictated himself**: it *"makes the game too complicated"* and blocked testing the reset after an alignment. ⭐⭐ So **the alignment CONSUMES the tap** and overrides `D28` for that one gesture — stated, where it used to be a coincidence I leaned on. ⚠ Two defects of mine came with it (ledger 44, 45) → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D37` | ⭐⭐⭐ **FORK C: THE TRIGGER IS A TAP — no flick anywhere** | 2026-09-16 | Hold an object, **tap a face on another**, and the held one turns the minimum amount that makes its own face point **the same way** (parallel — the CAD *align* sense, chosen over a mate). ⭐⭐ The owner left fork B because a release-time trigger *"releases the finger from the object it is tracking"*, and **both of its faults are properties of reading a verdict at the lift** — so fork C's alignment completes mid-gesture, with the object still held. ⛔ One alignment, replaced not stacked, so fork B's zero-DOF freeze cannot be built → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |
| `D36` | ⭐⭐⭐ **§1.3's PROVISIONAL-MOTION ROLLBACK IS RETIRED** | 2026-09-16 | ⭐ Binding. Consequence text moved 2026-09-17 — the front door is a LEDGER: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D35` | ⭐⭐ **THE FACE HIGHLIGHT OUTLIVES THE GESTURE AND DIES WITH THE ALIGNMENT** | 2026-09-16 | *"Keep the face highlighted when the object is aligned, until the shaking releases the alignment."* ⭐⭐ Amends §3 rule 3, and the argument is that **the highlight is no longer a selection indicator — it is the alignment's only visible state**. ⛔ It dies with the CONSTRAINT, not the finger: a marker outliving the stack would report something untrue. ⚠ §3 still governs an unaligned object → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D34` | ⭐⭐⭐ **2sexte IS WIRED — and `A3`'s handover was never a decision** | 2026-09-16 | *"A flick immediately remove two DOF now and I cannot rotate the aligned object around the alignment axis."* ⭐⭐⭐ The report dissolved its own blocker: `A3` framed drag-vs-roll as two charts over one DOF needing a handover constant, and `A12` had already made them two **CHANNELS** (drag = one touchpoint, roll = the second's x). *A handover between rules became a handover between fingers.* ⛔ Degenerate cases REFUSE rather than turn arbitrarily → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D33` | ⭐⭐⭐ **A FLICK IS READ OVER ITS TAIL, NOT THE WHOLE WINDOW** | 2026-09-16 | *"The flick should be triggerable during an ongoing rotation."* ⛔⛔ Travel and purity were measured from the oldest sample in `flickWindow`, and a flick that REVERSES the drag cancels to ≈ 0 net travel. ⭐ The window becomes a MAXIMUM extent; the longest passing tail wins, with a minimum span of `flickLiftWindow`. ⚠⚠ It retracted `A4`'s flick skip the same hour — *a guard sized against one reading of a signal is not still the right size when the reading changes.* Mine, flagged → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D32` | ⭐⭐ **A SHAKE EVICTS ONLY WHILE `ROTATE`, and it is fed BEFORE the refusal** | 2026-09-16 | ⛔ Mine, on `D30`'s precedent — flagged, not assumed. The **mode** half is `D30`'s argument reused. ⭐⭐ The **order** half is the fix for defect 41: a full stack makes `dragRule` refuse and the handler return early, so a detector fed after that gate would never see the gesture that escapes the state — **the escape has to work where nothing else does.** ⚠ It also pays `A4`'s owed half (the flick is skipped from the FIRST reversal, announced in the readout). 12 vectors → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D31` | ⭐⭐⭐ **THE ONE-TOUCHPOINT ROLL IS DELETED, NOT PARKED** | 2026-09-16 | ⭐ Binding. Consequence text moved 2026-09-17 — the front door is a LEDGER: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D30` | ⭐⭐⭐ **A FLICK PUSHES AN ALIGNMENT ONLY WHILE THE MODE IS `ROTATE`** | 2026-09-16 | §2's 2ter/2quater predate the movement mode, and read literally a flick anchors whatever the drag was doing — so a brisk vertical **translate** would move a part and then spin it to align a face with gravity. ⭐ In `ROTATE` the hand is already turning the object, so an alignment completes the same intention. ⚠ The alternative was moving anchoring to **its own channel**, as eviction moved off the double-tap (`D12`→`D15`); gating on the mode won because it costs **no new gesture**. ⛔ Nothing is orphaned — `flick.ts` keeps 6quater and the orientation rollback · [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D29` | ⭐⭐⭐ **THREE ANCHOR-RULE FORKS BEHIND ONE FLAG, and `IN3` is built in fork B** | 2026-09-16 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D28` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap toggle is THE input model** | 2026-09-16 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D27` | ⭐⭐⭐ **ANY SINGLE TAP toggles the movement behaviour; a PRESS keeps every meaning it has** | 2026-09-16 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D26` | ⭐⭐ **THE ASSIGNMENTS WERE A FLAG, NOT A FORK** — ⚠ **CLOSED BY `D28`** | 2026-09-16 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D25` | ⭐⭐⭐ **A HOLDER THAT IS NO LONGER UNDER ITS OBJECT GIVES THE SELECTION UP** | 2026-09-16 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D24` | ⚠ **RETIRED BY `D28`** — a lift-and-replace of the second touchpoint was ONE gesture | 2026-09-16 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D23` | ⚠ **SUPERSEDED BY `D28`** — one touchpoint TRANSLATES; a second held still ROTATES | 2026-09-16 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D22` | ⭐⭐⭐ **Roll moves to the SECOND touchpoint's x** | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-17 — the front door is a LEDGER: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D21` | ⭐⭐⭐ **STATIONARY is a POSITION DEADBAND, not a timer** | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D20` | ⭐⭐ **Depth is a STILL HOLDER and a MOVING ANCHOR** | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D19` | ⭐⭐ **A DEADBAND on the pointer delta, per axis, with a slider** | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D18` | ⭐⭐ **Every object gesture stands on a GRAVITY FRAME** | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D17` | ⚠ **SUPERSEDED BY `D20`** — its TRIGGER is gone; the configuration and `A5`'s geometry stand. ⭐ Kept: it is what moved depth off the pinch | 2026-09-15 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D16` | ⚠ **SUPERSEDED IN PART BY `D17`** — the pinch trigger is gone; the depth GEOMETRY it established stands | 2026-09-15 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D15` | ⭐⭐ **Eviction is a QUICK BACK-AND-FORTH, not a roll** | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D14` | ⛔⛔ **Roll DRIVES the free DOF of an anchored object; 2sexte suppresses where it degenerates** | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D13` | ⛔⛔ **Eviction SPARES `MATE` entries** — a full turn clears alignments, never a joint | 2026-09-15 | ⭐ Binding. Consequence text moved 2026-09-16 — the front door is a LEDGER, not the record: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, and is now a back-and-forth. ⭐ Kept: it is what moved eviction off the double-tap, and that half stands | 2026-09-15 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D11` | ⭐⭐ **Adopt the PROVENANCE DISCIPLINE** from the owner's `TECHNIQUE_CATALOG.md` §0/§5 | 2026-09-15 | Every gesture rule carries a prior-art citation, or is marked ⚠ **novel to this project** so it can be assessed separately. Register: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md); binding form: `CONSTRAINTS` §10; review it feeds: `SEC4`. ⭐ Cheap now and expensive to reconstruct later, which is [`LESSONS_CARRIED.md`](LESSONS_CARRIED.md) §7's exact shape. ⚠ Three rules came out NOVEL COMPOSITE: §4's 6bis, 6ter, 6quater |
| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is now half of a **depth pinch**. ⭐ Kept: its *ignored* role still governs the THIRD touchpoint and beyond | 2026-09-14 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
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

⚠ **Two things have been measured out and REVERTED** — rotation inertia (`src/input/spin.ts`)
and `targetVelocity` in the follower. The note at the top of this file asks for a
`REJECTED.md` the first time that happens; both are instead recorded in full, with their
measurements, under *"TWO THINGS A NEW SESSION MUST NOT REBUILD"* in
[`QUEUE.md`](QUEUE.md). ⛔ One home, not two — but if a third is measured out, that block
is the thing to split into `REJECTED.md`, not this file.

## ⭐⭐ A report the owner WITHDREW — kept, because it is the more useful entry

> *"You destroyed the rotation around the gravity axis and orthogonal to gravity: the
> rotation came back to the axis of the screen view plane."* — 2026-09-15, then
> *"it's alright: the logic is right"*.

⛔⛔ **`A7`/`D18` was not the fault, and that is now a MEASURED claim rather than a
defence.** Every part of the gravity frame already had green vectors — it is orthonormal,
`up` is the world vertical, the wiring compiled — and ⚠ **none of that is the same claim as
*a horizontal drag yaws about gravity***, which is what a hand judges.
`tests/a7_wiring.test.ts` composes the frame with the rotation and asserts the axis that
comes out the far end, at level, 45° down, 72° down and on the **bottom ring**, with two
counter-examples so *"it came back to the screen axes"* is distinguishable from *"it did
not"*: the camera's own up is ≤ 0.4 against the vertical at 72°, and the view axis ≥ 0.9.

⭐⭐ **The transferable part**: mistake shape 4 — *a composition nobody computed* — can
aim at a **correct** piece of work as easily as a broken one, and it costs the same either
way until someone measures the composition. ⭐ `METHOD`: *a composition is a thing to
MEASURE, not an emergent property.* The real defect in the same report (no deadband, `D19`)
was only separable from the impression once the composition had a number.

⚠ This is not a rejected experiment and does not belong in a `REJECTED.md`: nothing was
built and nothing was measured out. It is a **claim that was tested and did not hold**.
