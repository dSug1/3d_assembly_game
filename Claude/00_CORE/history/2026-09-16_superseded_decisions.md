# Decision consequences — the full text

⚠ Named for *superseded* decisions, which is what it held first; it now carries the
consequence text of BINDING rows too (second half). The filename is left alone on purpose —
several rows link to it by name, and a rename that breaks a pointer costs more than a
slightly stale title.

> **STATUS** · archive · **OWNS** · the consequence text of decisions later superseded
> **READ IF** · you are about to re-open one of them, or need to know why the current one exists
> **LAST VERIFIED** · 2026-09-16

⭐⭐ **WHY THIS FILE EXISTS.** `DECISIONS.md` is a front door with a byte budget, and it
grows by one row per owner decision — so it had to give something up, and the honest thing
to give up is the text nobody needs at *load* time. ⛔ The rows themselves STAY in
`DECISIONS.md`: a decision that vanished from the list would be re-taken. What moves here is
the **consequence essay** of the rows already marked SUPERSEDED or RETIRED.

⚠ `METHOD`: *retractions are kept on purpose.* Nothing here is deleted, rewritten or
softened — the rows are verbatim, in the order the front door had them.

⛔ The current decision always wins. These explain why it exists.

---


## `D26`

| `D26` | ⭐⭐ **THE ASSIGNMENTS WERE A FLAG, NOT A FORK** — ⚠ **CLOSED BY `D28`** | 2026-09-16 | Three readings of §2/§4 ran from **one build** so a hand could compare them in the same minute on the same scene; they differed by one inversion in `holderDrive`, and two branches would have doubled every device pass to express one boolean. ⛔ The flag latched only while nothing touched the glass — the only state in which no gesture can be in flight. ✅ It did its job: `IN13` is answered, and the flag is deleted with the forks · [`queue_notes/IN13.md`](queue_notes/IN13.md) |


## `D24`

| `D24` | ⚠ **RETIRED BY `D28`** — a lift-and-replace of the second touchpoint was ONE gesture | 2026-09-16 | Retired **by construction**: the grace existed because the mode read second-touchpoint PRESENCE, so the 150-300 ms swap fell through it — and a tap decides the mode now. ⚠ By the time it went, the grace had already decayed into a HUD countdown and a slider that changed nothing. ⭐ Its lesson stands in `METHOD`: *a gesture spans the moments between its touchpoints*, and the tell was two runs that *"differ by timing of the input"*. Amendment **A14**, now a stub · [`queue_notes/IN4.md`](queue_notes/IN4.md) |


## `D23`

| `D23` | ⚠ **SUPERSEDED BY `D28`** — one touchpoint TRANSLATES; a second held still ROTATES | 2026-09-16 | This was **fork A**, and the forks are deleted: a tap chooses the mode now, so no assignment of the touchpoints decides it. ⭐ What survives is its argument — *the commonest gesture belongs on the cheapest input* — which is why the mode starts at `TRANSLATE`. ⭐⭐ And its defect is the one worth re-reading: the mode was first keyed on the second finger's MOTION state and a hand overturned it in minutes (`METHOD`: *a mode may be keyed on PRESENCE; never on MOTION*). Amendment **A13**, now a stub · [`queue_notes/IN4.md`](queue_notes/IN4.md) |


## `D17`

| `D17` | ⚠ **SUPERSEDED BY `D20`** — its TRIGGER is gone; the configuration and `A5`'s geometry stand. ⭐ Kept: it is what moved depth off the pinch | 2026-09-15 | ⛔ A hand found `D16`'s hole: two fingers will not fit on a SMALL object, and pushing a part away shrinks it — **the pinch destroyed its own affordance as it succeeded.** ⭐ So depth shares rule 6's configuration and the discriminator is the design: common mode is depth, differential mode is rule 6. ⚠ That tolerance is itself superseded (`D20`/`A10`: a still holder). ⭐ The gain is rule 6's computed factor redirected, so `gainTranslateDepth` was wired rather than invented. Amendment **A6** |


## `D16`

| `D16` | ⚠ **SUPERSEDED IN PART BY `D17`** — the pinch trigger is gone; the depth GEOMETRY it established stands | 2026-09-15 | Superseded `D10`. Pinch in pushes the object away, pinch out brings it closer; one finger on each of two objects is §4 rule **6ter**, already specified. ⭐⭐ It came from a HAND, as a fourth answer the watch item did not offer — so §3.2 DS3 is declined. ⭐ It removes `D10`'s dead end: lifting one of two fingers now returns to rotation instead of leaving the part unresponsive. ⛔⛔ **The gain is COMPUTABLE — `distance' = distance × (sep₀/sep₁)` — so `gainPinchDepth` is a multiplier on a computed factor and 1.0 is CORRECT, not preferred.** ⚠ `IN2`'s `IGNORED` role survives with a moved trigger: the SECOND touchpoint participates, the third and beyond are ignored — the 22 router vectors are written against the old rule. Amendment **A5** |


## `D12`

| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, and is now a back-and-forth. ⭐ Kept: it is what moved eviction off the double-tap, and that half stands | 2026-09-15 | Resolved the collision with the camera-home reset: a double-tap now means one thing only. ⭐ The two gestures are in different MODALITIES — discrete taps against a continuous sweep — a wider separation than two same-shaped gestures told apart by where they land. ⭐⭐ And the gesture's size matched its consequence: eviction destroys deliberate work. ⛔ Its roll-side machinery (2quinte tracking, the 60°-vs-360° separation, `rollEvictDeg`) died with `D31`; `A4`'s shake replaces it. ⚠ Open, above: does eviction break MATES? Spec amendment **A1** |


## `D10`

| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is now half of a **depth pinch**. ⭐ Kept: its *ignored* role still governs the THIRD touchpoint and beyond | 2026-09-14 | Reading 2 (a rotation axis between the fingers) is **deferred, not rejected**. It binds `IN2`'s role latch: *ignored* is a third latched outcome, and lifting an ignored touchpoint must not run the release verdict, flick test or tap history. ⭐ Its visible consequence — lift the holding finger with a second finger still on the part and the part stops responding — was judged on the glass and **accepted**, which makes it an accepted BEHAVIOUR, not merely an accepted decision → [`queue_notes/IN8.md`](queue_notes/IN8.md) |

---

# ⭐⭐ AND THESE ARE STILL BINDING — only their text moved

⛔⛔ **DO NOT READ THIS SECTION AS RETIRED.** The rows below are in force; what moved is
their *consequence essay*, because `DECISIONS.md` refused a new decision three times in one
day and shaving another row would have been treating the symptom. ⭐ The front door is now
what the tier doctrine says it should be — a **ledger**: headline, date, and where the record
lives. ⚠ A decision's HEADLINE never leaves the front door; a decision that vanished from
the list would be re-taken.


## `D28` — ✅ IN FORCE

| `D28` | ⭐⭐⭐ **FORKS A AND B ARE DELETED — the tap toggle is THE input model** | 2026-09-16 | *"Remove the forks A and B. I am satisfied with fork C."* ⭐ `D26`'s comparison is over and it answers `IN13`: one build carried three readings for three versions, a hand drove all of them, and this is the verdict. ⛔⛔ **Deleted, not disabled** — `holderDrive`, the flag, its latch, the slider, `assignment.ts` (→ `mode_toggle.ts`) and 44 vectors: a dormant fork is a trap. ⛔⛔ **It retired two amendments BY CONSTRUCTION**: `A14`'s grace (the mode no longer reads presence, so the lift-and-replace gap cannot occur — and it had already decayed into a HUD line and a slider) and `A12`'s two-axes-at-once (`A16` narrows the second finger to one). ⚠ Both texts stand as the record of defects that can no longer occur. ⭐ Given up deliberately: A/B-ing by URL, whose whole justification was the comparison now made. Amendment **A17** · [`queue_notes/IN13.md`](queue_notes/IN13.md) |


## `D27` — ✅ IN FORCE

| `D27` | ⭐⭐⭐ **ANY SINGLE TAP toggles the movement behaviour; a PRESS keeps every meaning it has** | 2026-09-16 | ⛔ Not an inversion of the other forks, which is why it was a fork and not a setting: A and B read the mode from **presence**, this from a **discrete tap** — so it **cannot have the defect `A14` fixed**, and `A14` was retired with the forks (`D28`). ⭐ The mode is a **session latch**: it survives a release, so rotation costs a tap only when SWITCHING. ⛔ The toggle is **immediate** — a deferral that waited out the double-tap window was felt as lag, so a double tap flips twice **and** resets the camera, accepted in the owner's words; which is Unity's own `Tap` behaviour, chosen deliberately. ⛔ The toggle also picks the second finger's axis: **depth or roll, never both**, paired by kind. ⭐ Three formulations, each corrected by a hand: [`queue_notes/IN13.md`](queue_notes/IN13.md). Amendment **A16** |


## `D18` — ✅ IN FORCE

| `D18` | ⭐⭐ **Every object gesture stands on a GRAVITY FRAME** | 2026-09-15 | Yaw about the world vertical, pitch about the camera's (always horizontal) right, roll and A6's depth about the view direction FLATTENED onto the ground; translation's dy becomes a true vertical. ⭐ Two of the four were already true — pitch and dx — because the camera carries no roll. ⛔⛔ **The argument is ORTHOGONALITY, not tidiness**: about the camera's axes the view axis gains a vertical component as the camera tilts, so roll stops being independent of yaw and no gain can separate them. ⭐⭐ One basis serves translation AND rotation — *the axis you push along is the axis you can turn about* — and it is the frame the world is built in. ⚠ Costs: vertical motion goes quiet looking straight down (the third and fourth *"goes quiet"* shape), and the roll's PICTURE changes with tilt though the gesture does not. ⭐ It buys a roll that is **reproducible in world terms** across an orbit. Amendment **A7** |


## `D15` — ✅ IN FORCE

| `D15` | ⭐⭐ **Eviction is a QUICK BACK-AND-FORTH, not a roll** | 2026-09-15 | Supersedes `D12`'s trigger. ⛔ `D14` gave the roll channel back to a real control, so eviction had to leave it — *a bigger number is not a resolution to an ambiguity; a different channel is* (720° was considered and rejected: same channel, same kind of conflict, more fatigue). ⭐⭐ It is the only candidate that reuses a reversal detector with a **measured** false-positive rate — the sway's, calibrated against 0.761 mm of pointer noise after a still finger once fired 272 false kicks in 3 s. ⛔ The flick test must be skipped once ONE reversal is seen: a shake is literally two flicks in opposite directions, and without the guard an abandoned shake ADDS a constraint instead of removing one. Amendment **A4** |


## `D13` — ✅ IN FORCE

| `D13` | ⛔⛔ **Eviction SPARES `MATE` entries** — a full turn clears alignments, never a joint | 2026-09-15 | *"Clearing an alignment and detaching an assembly are different intentions so they can't be done by the same gesture."* ⭐ The principle generalises: **one gesture, one intention** — a gesture serving two cannot be aimed, and here the cost of the misread is the whole assembly. ⭐ A surviving `MATE` becomes the OLDEST entry and therefore HARD, which is right: the joint is what must stay exact. ⛔ A full turn on a MATE-ONLY stack must **refuse audibly** (§6's negative haptic) — silence reads as a broken gesture and gets repeated. ⚠ Un-snap stays OPEN and `3D3` still waits: reading (a) would have closed it for free, and this is the judgement that the free answer was the wrong one |


## `D29` — ✅ IN FORCE

| `D29` | ⭐⭐⭐ **THREE ANCHOR-RULE FORKS BEHIND ONE FLAG, and `IN3` is built in fork B** | 2026-09-16 | Fork A is today's behaviour (**the default**), fork B is `IN3`, fork C is a set the owner has not specified. ⛔⛔ **A different shape from `D26`'s flag**: that chose between two readings differing by one inversion, so both were always live. This is a **GATE** — A is the *absence* of a rule set, C is *unspecified* — so the risk is **a session believing it tested a fork that did nothing**. ⭐ Hence C is visibly **inert**, never a quiet fallback to A; the HUD names the live fork; the validator refuses anything but 0/1/2; and it latches only while nothing touches the glass, since flipping mid-drag changes whether the release **pushes a constraint**. ⚠ **Expiry named now**: per `D28`, the day a set is chosen the others are **deleted** · [`queue_notes/IN3.md`](queue_notes/IN3.md) |

## `D14` — ✅ IN FORCE

| `D14` | ⛔⛔ **Roll DRIVES the free DOF of an anchored object; 2sexte suppresses where it degenerates** | 2026-09-15 | The spec forbade roll on a constrained object for a reason that is **conditional on camera pose** and false when the camera looks along the constraint axis — where rolling about the view axis IS twisting about the anchor. ⭐⭐ And 2sexte is **degenerate there**: its axis projects to a point, so *"perpendicular to the axis as projected on screen"* has no value and the rule would turn the object by an arbitrary amount. The two are complementary charts over one DOF. ⛔ **ONE handover constant, with hysteresis, latched at press** — two thresholds would give a dead band where the DOF has no driver, or an overlap where it has two. Amendment **A3** |


## `D19` — ✅ IN FORCE

| `D19` | ⭐⭐ **A DEADBAND on the pointer delta, per axis, with a slider** | 2026-09-15 | *"The logic is right: we just need a deadband on x and y delta position"*, with *"a slider to manually finetune it"*. ⛔⛔ The trap, written down before the build: **a HARD deadband is a jump traded for a jump**, and the residual form is what keeps slow travel exact. ⛔ Per AXIS, never on the magnitude — `dx` is yaw about gravity and `dy` is pitch, so a magnitude band lets noise cross-talk between them. ⭐ The vector asserts **CONTINUITY**, because *"small deltas do nothing"* passes for the broken form too. ⚠ **Absorbed by `D21`/`A11`**, which put the band in §1.1 itself. Amendment **A9** · [`queue_notes/IN12.md`](queue_notes/IN12.md) |


## `D20` — ✅ IN FORCE

| `D20` | ⭐⭐ **Depth is a STILL HOLDER and a MOVING ANCHOR** | 2026-09-15 | Supersedes `D17`/`A6`'s trigger the day it shipped. ⭐⭐ **The fault was in the QUESTION**: *"are these two travels equal?"* has no answer at a reversal or a late start, and both happen in every gesture — while *"is that finger still?"* is answerable at every instant. ⛔ No window, no ratio, no tolerance, no hold; **the holder wins every tie**, which makes the two rules a partition instead of a competition. ⭐ It also closed the small-object hole owed since `A5`. ⚠ What it cost: it was the first rule to ask whether a finger is still, and §1.1 could not answer. Amendment **A10** · [`queue_notes/IN8.md`](queue_notes/IN8.md) |


## `D21` — ✅ IN FORCE

| `D21` | ⭐⭐⭐ **STATIONARY is a POSITION DEADBAND, not a timer** | 2026-09-15 | *"Stationary should mean a deadband around the touchpoint position (independently of the time)."* ⭐ An anchor trails the finger at one dead radius: inside it the finger emits **nothing**; outside, it emits the **excess only** and the anchor is dragged up. ⛔ The second half is the one everyone forgets — without it a deadband inserts a step of exactly one radius. ⭐⭐ Time-free, its emitted travel EXACT, and a slow drag survives. ⚠ It deleted four tunables and a validator rule, and absorbed `A9`. ⛔ **The fourth formulation of §1.1 and the first robust by construction** rather than by a threshold above a measurement. Amendment **A11** · [`queue_notes/IN0.md`](queue_notes/IN0.md) |


## `D25` — ✅ IN FORCE

| `D25` | ⭐⭐⭐ **A HOLDER THAT IS NO LONGER UNDER ITS OBJECT GIVES THE SELECTION UP** | 2026-09-16 | Depth slides the object along the view axis *while the holder holds still*, so it leaves the finger carrying it — and §4's latch kept that finger holding it anyway. ⭐ A **raycast at the second touchpoint's lift** (discrete, deliberate, visible — honouring `D23` rather than re-breaking it), and the unselect **deferred to the next input event**, after which the §4 table re-resolves. ⛔ The orbit centre does **not** move: *"same as previous yellow point"*, overruling the retarget I had built. ⚠ A selection can now end without the user lifting the finger that made it. ✅✅ **CLOSED by a device look 2026-09-16** (⚠ a general *"everything is working ok"*, not case by case). Amendment **A15** · [`queue_notes/IN8.md`](queue_notes/IN8.md) |

## `D41` — ⚠ SUPERSEDED BY `D42` (four hours later)

| `D41` | ⚠ **SUPERSEDED BY `D42` after four hours — the two readings survive, the FLAG does not.** What a turned Pioneer costs the Follower | 2026-09-17 | ⛔⛔ The case had **no rule at all**, and its absence was invisible: an alignment stores a FROZEN world direction (§1.4), so turning the object it was read FROM leaves the Follower obeying a target nothing on the glass matches — with both highlights still claiming it is fine. ⭐⭐ The two forks are opposite answers to *what an alignment IS*: **C1** a SNAPSHOT (turning the Pioneer releases it; the Follower is not moved; both highlights go) and **C2** a RELATIONSHIP (the Follower takes the **same world rotation**, the target is re-read from the Pioneer's face every frame, highlights stay, and a **shake on the Pioneer** releases it). ⚠ `?pioneerTurnRule=0|1`, slider shipped, **C1 default — mine, not the owner's**: it moves nothing the hand did not touch → [`../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) |

## `D22` — ✅ IN FORCE

| `D22` | ⭐⭐⭐ **Roll moves to the SECOND touchpoint's x** | 2026-09-15 | *"This will remove the conflict and decision lag between yaw/pitch and roll and the jump on roll that we have currently due to all being controlled by the one touchpoint."* ⭐⭐ **The ambiguity is dissolved by moving the GESTURE, not by deciding better**: yaw/pitch is ONE touchpoint, roll is TWO, so nothing has to tell them apart — which retired the circle fit, `rollAngle`, `A8`'s rebase and **the jump**, and `D31` then deleted them. ⭐⭐ **It only works because `A11`'s deadband is PER AXIS**, so the two corridors break out independently: `A11` and `A12` are load-bearing for each other. ⚠ `gainRollDrag` 2 °/mm and the sign are guesses with sliders. Amendment **A12**, whose text carries the rest |


## `D31` — ✅ IN FORCE

| `D31` | ⭐⭐⭐ **THE ONE-TOUCHPOINT ROLL IS DELETED, NOT PARKED** | 2026-09-16 | *"clean the roll also for the fork A."* ⭐⭐ **The test of inert is CALLED BY NOTHING, not UNUSED BY INTENT**: the detector `A12` retired was kept unwired on purpose and was still **fed**, and its `ROLL_KEPT` verdict held the top rung of the release ladder, where it silently vetoed `IN3`'s flick (defect 40). ⛔ Gone: `roll.ts`, `one_euro.ts`, 58 vectors, `rebaseOnRollCommit`, the pose history, ~16 tunables, the slider — 632 → **574 vectors**, and the count going down is the point. ⚠ The cost is measured, not assumed: §1.3's flick skip went too, so a curved drag ending fast and straight now aligns. ⭐ `shake.ts` / `anchor_rotate.ts` stay unwired and that stays right — nothing calls them. Full account: [`queue_notes/IN3.md`](queue_notes/IN3.md) |


## `D36` — ✅ IN FORCE

| `D36` | ⭐⭐⭐ **§1.3's PROVISIONAL-MOTION ROLLBACK IS RETIRED** | 2026-09-16 | *"A rotation followed by a flick was previously resetting the quaternion of the object: get rid of that if this conflicts with the alignment by flick."* ⭐⭐⭐ **A ROLLBACK IS ONLY HONEST WHILE THE MOTION IT UNDOES WAS PROVISIONAL** — §1.3 was written when a drag and a flick were RIVAL readings of one gesture, so the loser's effect was unwanted. `A16` made rotation a mode a hand CHOOSES and `D33` made the flick readable at the end of a drag, so *drag-then-snap* is now the normal gesture and restoring the press pose throws away deliberate work. ⚠ Moot for the anchored axis anyway: 2ter re-solves from the CURRENT orientation, so only the free DOF differs. ⛔ `snapshot` stays for `IN6`'s undo and is now READ (`pressSnapshot`), and the HUD's `ROLLED BACK` line is deleted — a readout that cannot fire is the dead instrument shape, met three times on this same day |

## `D34` — ✅ IN FORCE

| `D34` | ⭐⭐⭐ **2sexte IS WIRED — and `A3`'s handover was never a decision** | 2026-09-16 | *"A flick immediately remove two DOF now and I cannot rotate the aligned object around the alignment axis."* ⭐⭐⭐ The report dissolved its own blocker: `A3` framed drag-vs-roll as two charts over one DOF needing a handover constant, and `A12` had already made them two **CHANNELS** (drag = one touchpoint, roll = the second's x). *A handover between rules became a handover between fingers.* ⛔ Degenerate cases REFUSE rather than turn arbitrarily → [`queue_notes/IN3.md`](queue_notes/IN3.md) |


## `D35` — ✅ IN FORCE

| `D35` | ⭐⭐ **THE FACE HIGHLIGHT OUTLIVES THE GESTURE AND DIES WITH THE ALIGNMENT** | 2026-09-16 | *"Keep the face highlighted when the object is aligned, until the shaking releases the alignment."* ⭐⭐ Amends §3 rule 3, and the argument is that **the highlight is no longer a selection indicator — it is the alignment's only visible state**. ⛔ It dies with the CONSTRAINT, not the finger: a marker outliving the stack would report something untrue. ⚠ §3 still governs an unaligned object → [`queue_notes/IN3.md`](queue_notes/IN3.md) |
