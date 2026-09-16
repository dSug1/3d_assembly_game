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
| `D35` | ⭐⭐ **THE FACE HIGHLIGHT OUTLIVES THE GESTURE AND DIES WITH THE ALIGNMENT** | 2026-09-16 | *"Keep the face highlighted when the object is aligned, until the shaking releases the alignment."* ⭐⭐ Amends §3 rule 3, and the argument is that **the highlight is no longer a selection indicator — it is the alignment's only visible state**. ⛔ It dies with the CONSTRAINT, not the finger: a marker outliving the stack would report something untrue. ⚠ §3 still governs an unaligned object → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D34` | ⭐⭐⭐ **2sexte IS WIRED — and `A3`'s handover was never a decision** | 2026-09-16 | *"A flick immediately remove two DOF now and I cannot rotate the aligned object around the alignment axis."* ⭐⭐⭐ The report dissolved its own blocker: `A3` framed drag-vs-roll as two charts over one DOF needing a handover constant, and `A12` had already made them two **CHANNELS** (drag = one touchpoint, roll = the second's x). *A handover between rules became a handover between fingers.* ⛔ Degenerate cases REFUSE rather than turn arbitrarily → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D33` | ⭐⭐⭐ **A FLICK IS READ OVER ITS TAIL, NOT THE WHOLE WINDOW** | 2026-09-16 | *"The flick should be triggerable during an ongoing rotation."* ⛔⛔ Travel and purity were measured from the oldest sample in `flickWindow`, and a flick that REVERSES the drag cancels to ≈ 0 net travel. ⭐ The window becomes a MAXIMUM extent; the longest passing tail wins, with a minimum span of `flickLiftWindow`. ⚠⚠ It retracted `A4`'s flick skip the same hour — *a guard sized against one reading of a signal is not still the right size when the reading changes.* Mine, flagged → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D32` | ⭐⭐ **A SHAKE EVICTS ONLY WHILE `ROTATE`, and it is fed BEFORE the refusal** | 2026-09-16 | ⛔ Mine, on `D30`'s precedent — flagged, not assumed. The **mode** half is `D30`'s argument reused. ⭐⭐ The **order** half is the fix for defect 41: a full stack makes `dragRule` refuse and the handler return early, so a detector fed after that gate would never see the gesture that escapes the state — **the escape has to work where nothing else does.** ⚠ It also pays `A4`'s owed half (the flick is skipped from the FIRST reversal, announced in the readout). 12 vectors → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D31` | ⭐⭐⭐ **THE ONE-TOUCHPOINT ROLL IS DELETED, NOT PARKED** | 2026-09-16 | *"clean the roll also for the fork A."* ⭐⭐ **The test of inert is CALLED BY NOTHING, not UNUSED BY INTENT**: the detector `A12` retired was kept unwired on purpose and was still **fed**, and its `ROLL_KEPT` verdict held the top rung of the release ladder, where it silently vetoed `IN3`'s flick (defect 40). ⛔ Gone: `roll.ts`, `one_euro.ts`, 58 vectors, `rebaseOnRollCommit`, the pose history, ~16 tunables, the slider — 632 → **574 vectors**, and the count going down is the point. ⚠ The cost is measured, not assumed: §1.3's flick skip went too, so a curved drag ending fast and straight now aligns. ⭐ `shake.ts` / `anchor_rotate.ts` stay unwired and that stays right — nothing calls them. Full account: [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D30` | ⭐⭐⭐ **A FLICK PUSHES AN ALIGNMENT ONLY WHILE THE MODE IS `ROTATE`** | 2026-09-16 | §2's 2ter/2quater predate the movement mode, and read literally a flick anchors whatever the drag was doing — so a brisk vertical **translate** would move a part and then spin it to align a face with gravity. ⭐ In `ROTATE` the hand is already turning the object, so an alignment completes the same intention. ⚠ The alternative was moving anchoring to **its own channel**, as eviction moved off the double-tap (`D12`→`D15`); gating on the mode won because it costs **no new gesture**. ⛔ Nothing is orphaned — `flick.ts` keeps 6quater and the orientation rollback · [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D29` | ⭐⭐⭐ **THREE ANCHOR-RULE FORKS BEHIND ONE FLAG, and `IN3` is built in fork B** | 2026-09-16 | Fork A is today's behaviour (**the default**), fork B is `IN3`, fork C is a set the owner has not specified. ⛔⛔ **A different shape from `D26`'s flag**: that chose between two readings differing by one inversion, so both were always live. This is a **GATE** — A is the *absence* of a rule set, C is *unspecified* — so the risk is **a session believing it tested a fork that did nothing**. ⭐ Hence C is visibly **inert**, never a quiet fallback to A; the HUD names the live fork; the validator refuses anything but 0/1/2; and it latches only while nothing touches the glass, since flipping mid-drag changes whether the release **pushes a constraint**. ⚠ **Expiry named now**: per `D28`, the day a set is chosen the others are **deleted** · [`queue_notes/IN3.md`](queue_notes/IN3.md) |
| `D28` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap toggle is THE input model** | 2026-09-16 | *"Remove the forks A and B. I am satisfied with fork C."* ⭐ `D26`'s comparison is over and it answers `IN13`: one build carried three readings for three versions, a hand drove all of them, and this is the verdict. ⛔⛔ **Deleted, not disabled** — `holderDrive`, the flag, its latch, the slider, `assignment.ts` (→ `mode_toggle.ts`) and 44 vectors: a dormant fork is a trap. ⛔⛔ **It retired two amendments BY CONSTRUCTION**: `A14`'s grace (the mode no longer reads presence, so the lift-and-replace gap cannot occur — and it had already decayed into a HUD line and a slider) and `A12`'s two-axes-at-once (`A16` narrows the second finger to one). ⚠ Both texts stand as the record of defects that can no longer occur. ⭐ Given up deliberately: A/B-ing by URL, whose whole justification was the comparison now made. Amendment **A17** · [`queue_notes/IN13.md`](queue_notes/IN13.md) |
| `D27` | ⭐⭐⭐ **ANY SINGLE TAP toggles the movement behaviour; a PRESS keeps every meaning it has** | 2026-09-16 | ⛔ Not an inversion of the other forks, which is why it was a fork and not a setting: A and B read the mode from **presence**, this from a **discrete tap** — so it **cannot have the defect `A14` fixed**, and `A14` was retired with the forks (`D28`). ⭐ The mode is a **session latch**: it survives a release, so rotation costs a tap only when SWITCHING. ⛔ The toggle is **immediate** — a deferral that waited out the double-tap window was felt as lag, so a double tap flips twice **and** resets the camera, accepted in the owner's words; which is Unity's own `Tap` behaviour, chosen deliberately. ⛔ The toggle also picks the second finger's axis: **depth or roll, never both**, paired by kind. ⭐ Three formulations, each corrected by a hand: [`queue_notes/IN13.md`](queue_notes/IN13.md). Amendment **A16** |
| `D26` | ⭐⭐ **THE ASSIGNMENTS WERE A FLAG, NOT A FORK** — ⚠ **CLOSED BY `D28`** | 2026-09-16 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D25` | ⭐⭐⭐ **A HOLDER THAT IS NO LONGER UNDER ITS OBJECT GIVES THE SELECTION UP** | 2026-09-16 | Depth slides the object along the view axis *while the holder holds still*, so it leaves the finger carrying it — and §4's latch kept that finger holding it anyway. ⭐ A **raycast at the second touchpoint's lift** (discrete, deliberate, visible — honouring `D23` rather than re-breaking it), and the unselect **deferred to the next input event**, after which the §4 table re-resolves. ⛔ The orbit centre does **not** move: *"same as previous yellow point"*, overruling the retarget I had built. ⚠ A selection can now end without the user lifting the finger that made it. ✅✅ **CLOSED by a device look 2026-09-16** (⚠ a general *"everything is working ok"*, not case by case). Amendment **A15** · [`queue_notes/IN8.md`](queue_notes/IN8.md) |
| `D24` | ⚠ **RETIRED BY `D28`** — a lift-and-replace of the second touchpoint was ONE gesture | 2026-09-16 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D23` | ⚠ **SUPERSEDED BY `D28`** — one touchpoint TRANSLATES; a second held still ROTATES | 2026-09-16 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D22` | ⭐⭐⭐ **Roll moves to the SECOND touchpoint's x** | 2026-09-15 | *"This will remove the conflict and decision lag between yaw/pitch and roll and the jump on roll that we have currently due to all being controlled by the one touchpoint."* ⭐⭐ **The ambiguity is dissolved by moving the GESTURE, not by deciding better**: yaw/pitch is ONE touchpoint, roll is TWO, so nothing has to tell them apart — which retired the circle fit, `rollAngle`, `A8`'s rebase and **the jump**, and `D31` then deleted them. ⭐⭐ **It only works because `A11`'s deadband is PER AXIS**, so the two corridors break out independently: `A11` and `A12` are load-bearing for each other. ⚠ `gainRollDrag` 2 °/mm and the sign are guesses with sliders. Amendment **A12**, whose text carries the rest |
| `D21` | ⭐⭐⭐ **STATIONARY is a POSITION DEADBAND, not a timer** | 2026-09-15 | *"Stationary should mean a deadband around the touchpoint position (independently of the time)."* ⭐ An anchor trails the finger at one dead radius: inside it the finger emits **nothing**; outside, it emits the **excess only** and the anchor is dragged up. ⛔ The second half is the one everyone forgets — without it a deadband inserts a step of exactly one radius. ⭐⭐ Time-free, its emitted travel EXACT, and a slow drag survives. ⚠ It deleted four tunables and a validator rule, and absorbed `A9`. ⛔ **The fourth formulation of §1.1 and the first robust by construction** rather than by a threshold above a measurement. Amendment **A11** · [`queue_notes/IN0.md`](queue_notes/IN0.md) |
| `D20` | ⭐⭐ **Depth is a STILL HOLDER and a MOVING ANCHOR** | 2026-09-15 | Supersedes `D17`/`A6`'s trigger the day it shipped. ⭐⭐ **The fault was in the QUESTION**: *"are these two travels equal?"* has no answer at a reversal or a late start, and both happen in every gesture — while *"is that finger still?"* is answerable at every instant. ⛔ No window, no ratio, no tolerance, no hold; **the holder wins every tie**, which makes the two rules a partition instead of a competition. ⭐ It also closed the small-object hole owed since `A5`. ⚠ What it cost: it was the first rule to ask whether a finger is still, and §1.1 could not answer. Amendment **A10** · [`queue_notes/IN8.md`](queue_notes/IN8.md) |
| `D19` | ⭐⭐ **A DEADBAND on the pointer delta, per axis, with a slider** | 2026-09-15 | *"The logic is right: we just need a deadband on x and y delta position"*, with *"a slider to manually finetune it"*. ⛔⛔ The trap, written down before the build: **a HARD deadband is a jump traded for a jump**, and the residual form is what keeps slow travel exact. ⛔ Per AXIS, never on the magnitude — `dx` is yaw about gravity and `dy` is pitch, so a magnitude band lets noise cross-talk between them. ⭐ The vector asserts **CONTINUITY**, because *"small deltas do nothing"* passes for the broken form too. ⚠ **Absorbed by `D21`/`A11`**, which put the band in §1.1 itself. Amendment **A9** · [`queue_notes/IN12.md`](queue_notes/IN12.md) |
| `D18` | ⭐⭐ **Every object gesture stands on a GRAVITY FRAME** | 2026-09-15 | Yaw about the world vertical, pitch about the camera's (always horizontal) right, roll and A6's depth about the view direction FLATTENED onto the ground; translation's dy becomes a true vertical. ⭐ Two of the four were already true — pitch and dx — because the camera carries no roll. ⛔⛔ **The argument is ORTHOGONALITY, not tidiness**: about the camera's axes the view axis gains a vertical component as the camera tilts, so roll stops being independent of yaw and no gain can separate them. ⭐⭐ One basis serves translation AND rotation — *the axis you push along is the axis you can turn about* — and it is the frame the world is built in. ⚠ Costs: vertical motion goes quiet looking straight down (the third and fourth *"goes quiet"* shape), and the roll's PICTURE changes with tilt though the gesture does not. ⭐ It buys a roll that is **reproducible in world terms** across an orbit. Amendment **A7** |
| `D17` | ⚠ **SUPERSEDED BY `D20`** — its TRIGGER is gone; the configuration and `A5`'s geometry stand. ⭐ Kept: it is what moved depth off the pinch | 2026-09-15 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D16` | ⚠ **SUPERSEDED IN PART BY `D17`** — the pinch trigger is gone; the depth GEOMETRY it established stands | 2026-09-15 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D15` | ⭐⭐ **Eviction is a QUICK BACK-AND-FORTH, not a roll** | 2026-09-15 | Supersedes `D12`'s trigger. ⛔ `D14` gave the roll channel back to a real control, so eviction had to leave it — *a bigger number is not a resolution to an ambiguity; a different channel is* (720° was considered and rejected: same channel, same kind of conflict, more fatigue). ⭐⭐ It is the only candidate that reuses a reversal detector with a **measured** false-positive rate — the sway's, calibrated against 0.761 mm of pointer noise after a still finger once fired 272 false kicks in 3 s. ⛔ The flick test must be skipped once ONE reversal is seen: a shake is literally two flicks in opposite directions, and without the guard an abandoned shake ADDS a constraint instead of removing one. Amendment **A4** |
| `D14` | ⛔⛔ **Roll DRIVES the free DOF of an anchored object; 2sexte suppresses where it degenerates** | 2026-09-15 | The spec forbade roll on a constrained object for a reason that is **conditional on camera pose** and false when the camera looks along the constraint axis — where rolling about the view axis IS twisting about the anchor. ⭐⭐ And 2sexte is **degenerate there**: its axis projects to a point, so *"perpendicular to the axis as projected on screen"* has no value and the rule would turn the object by an arbitrary amount. The two are complementary charts over one DOF. ⛔ **ONE handover constant, with hysteresis, latched at press** — two thresholds would give a dead band where the DOF has no driver, or an overlap where it has two. Amendment **A3** |
| `D13` | ⛔⛔ **Eviction SPARES `MATE` entries** — a full turn clears alignments, never a joint | 2026-09-15 | *"Clearing an alignment and detaching an assembly are different intentions so they can't be done by the same gesture."* ⭐ The principle generalises: **one gesture, one intention** — a gesture serving two cannot be aimed, and here the cost of the misread is the whole assembly. ⭐ A surviving `MATE` becomes the OLDEST entry and therefore HARD, which is right: the joint is what must stay exact. ⛔ A full turn on a MATE-ONLY stack must **refuse audibly** (§6's negative haptic) — silence reads as a broken gesture and gets repeated. ⚠ Un-snap stays OPEN and `3D3` still waits: reading (a) would have closed it for free, and this is the judgement that the free answer was the wrong one |
| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, and is now a back-and-forth. ⭐ Kept: it is what moved eviction off the double-tap, and that half stands | 2026-09-15 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D11` | ⭐⭐ **Adopt the PROVENANCE DISCIPLINE** from the owner's `TECHNIQUE_CATALOG.md` §0/§5 | 2026-09-15 | Every gesture rule carries a prior-art citation, or is marked ⚠ **novel to this project** so it can be assessed separately. Register: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md); binding form: `CONSTRAINTS` §10; review it feeds: `SEC4`. ⭐ Cheap now and expensive to reconstruct later, which is [`LESSONS_CARRIED.md`](LESSONS_CARRIED.md) §7's exact shape. ⚠ Three rules came out NOVEL COMPOSITE: §4's 6bis, 6ter, 6quater |
| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is now half of a **depth pinch**. ⭐ Kept: its *ignored* role still governs the THIRD touchpoint and beyond | 2026-09-14 | ⚠ Text moved 2026-09-16 — a superseded decision is not load-bearing at read time: [`history/2026-09-16_superseded_decisions.md`](history/2026-09-16_superseded_decisions.md) |
| `D9` | ⭐ **Babylon over three.js** | 2026-09-13 | `pickResult.faceId` gives face picking directly, which rule 2 needs; multi-pointer handling is built in. ⚠ Apache-2.0, so the NOTICE must ship. ⭐ Reversible in about a day *because* of `D6` — that is what the boundary buys |

## ⚠ Still the owner's to make

| | what is blocked on it |
|---|---|
| **Un-snap: what breaks a mate on a touchscreen?** | the predecessor settled on *"un-snapping needs two hands"*. The touch equivalent is not obvious and `3D3` waits on it. ⚠ **`D12` did NOT answer it**: `D13` (2026-09-15) decided eviction spares mates, precisely because clearing an alignment and detaching an assembly are different intentions. This row stays open |
| ⭐⭐ **WHICH TOUCHPOINT ASSIGNMENT SHIPS** — fork A (`A13`, one-finger translate) or fork B (the spec's, two-finger translate) | row `IN13`. ⛔ **Deliberately not due yet**: the owner's condition is a *holistic* judgement once the input system is complete enough to feel as a whole, not a snap verdict on one gesture. ⭐ Both run from one build (`D26`), so the cost of leaving it open is one boolean rather than a divergent branch. ⚠ `D23` recorded the argument FOR A — it *"puts the commonest gesture (translate) on the EASIEST hand shape"* — and that sentence is what the comparison should try to confirm or refute |
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
