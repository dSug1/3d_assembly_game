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

## `D32` — ✅ IN FORCE

| `D32` | ⭐⭐ **A SHAKE EVICTS ONLY WHILE `ROTATE`, and it is fed BEFORE the refusal** | 2026-09-16 | ⛔ Mine, on `D30`'s precedent — flagged, not assumed. The **mode** half is `D30`'s argument reused. ⭐⭐ The **order** half is the fix for defect 41: a full stack makes `dragRule` refuse and the handler return early, so a detector fed after that gate would never see the gesture that escapes the state — **the escape has to work where nothing else does.** ⚠ It also pays `A4`'s owed half (the flick is skipped from the FIRST reversal, announced in the readout). 12 vectors → [`queue_notes/IN3.md`](queue_notes/IN3.md) |


## `D33` — ✅ IN FORCE

| `D33` | ⭐⭐⭐ **A FLICK IS READ OVER ITS TAIL, NOT THE WHOLE WINDOW** | 2026-09-16 | *"The flick should be triggerable during an ongoing rotation."* ⛔⛔ Travel and purity were measured from the oldest sample in `flickWindow`, and a flick that REVERSES the drag cancels to ≈ 0 net travel. ⭐ The window becomes a MAXIMUM extent; the longest passing tail wins, with a minimum span of `flickLiftWindow`. ⚠⚠ It retracted `A4`'s flick skip the same hour — *a guard sized against one reading of a signal is not still the right size when the reading changes.* Mine, flagged → [`queue_notes/IN3.md`](queue_notes/IN3.md) |

---

# ⭐⭐ A REPORT THE OWNER WITHDREW — moved out of `DECISIONS.md` 2026-09-19

⚠ Moved verbatim to make room for `D55` under the front door's byte budget; the pointer in
`DECISIONS.md` carries the transferable lesson.


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

---

# ⭐⭐ `D55`/`A22`/`A23` AND `D57` — the consequence text, moved 2026-09-19

⚠ Moved out of `DECISIONS.md` to keep the front door inside its byte budget; the rows there carry
the owner's words and the pointer. ⛔ The DESIGN of record is
[`../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](../../10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §2
and §5.5 — this is the decision-log detail only.

## `D55` — the press trigger

⛔ It aligns as `SNAPSHOT` because a press **cannot know the tap count** (`D42`).
⛔⛔ Its release is **spent**, or the `TAP` reads as `UNALIGN` and undoes the gesture 80 ms later.
⚠ The **reverse** direction (the pressed body follows the held one) stays refused — that one-way
guard shipped and the glass broke an alignment with it within minutes.
⚠ `A23`'s cost: only the Pioneer's **aligned** face is still a safe handhold; grabbing it elsewhere
re-points the alignment onto the face under the finger.

## `D57` — the flat roll

⛔ The near side travels perpendicular to the axis's SCREEN projection while the second-touchpoint
channel supplies `dx` only (`A16`), so the authority was a cosine in the axis's screen orientation.
⚠ It failed silently: `twist` was `0`, not `null`, so nothing refused and nothing was printed.
⭐ `flatTwistAngle` now gives one rate for every axis, degenerate cases included.
⛔ The projection carried the RATE *and* the DIRECTION. A raw `+dx` would re-break `D52` (the
owner's own report that the second touchpoint was inverted vs the first), and a per-frame sign would
flip mid-drag — so `rollSignFor` is read once and latched in `Held.anchorRollSign`.
⛔⛔ Chasing it found a hole in the suite: a sign flip in `nearSideScreenDirection`'s screen-y
conversion survived all 880 vectors, because every consumer passed `dx, 0` and never read `dir.y`.
Closed by deriving the direction from a rotated near-side point.

## `D58` — the mode toggle on a press

⛔ A press on the **held object itself** (`SECOND`) is deliberately absent from the owner's list;
a press on **another** object stays `D55`'s alignment trigger. `IGNORED` is excluded because a
third touchpoint runs nothing on release, so no tap triggers a toggle there either.
⚠⚠ The `A16` collision, worked: boot in `ROTATE`, place a finger outside → flips to `TRANSLATE`
→ that finger drives **depth**, not roll. Lift (a drag, no tap), place again → flips to `ROTATE`
→ **roll**. The channel alternates on every touch instead of being chosen, which is what `A16`
(*"switching shall require the tap"*) reserved a tap for. ⭐ The one-line alternative is to latch
that finger's channel at its own press, at the cost of the HUD's mode disagreeing with what it
drives. ✅ The `PioneerFace` case is clean: `pinnedSecondDrive` gives both axes, mode-independent.
⛔⛔ A tap is a press PLUS a lift, so `pressToggled` spends the release's toggle — otherwise
every tap would flip down and flip back, a no-op from the gesture the owner asked to have an
effect. ⭐ On the PioneerFace the toggle is **rolled back** when the release turns out to be
`D39`'s re-tap, so that gesture keeps its single meaning. Cost: ~80 ms of the other mode on the
HUD — the same honest flicker `D55` accepted for the cyan that precedes `FOLLOW`.

## `D49` — the surface-gap capture, consequence text moved 2026-09-19

⭐ The offset is scaled by camera distance through rule 6's own tracking factor, so it keeps a
constant APPARENT size and is never authored in pixels. ⭐⭐ The white contour IS the shell: the
body inflated by **half** the offset, recomputed every frame — half, not the full offset, or the
eye would see two boxes meet at twice the threshold. So two touching white boxes mean the pair
captures. ⚠ `snapRadiusFactor` was deleted with it: `4L` answered *how far apart may two CENTRES
be*, a different question, and it could not repair the audit's finding 3 where a plate read 312 mm
by centres while a part RESTING on it read 228 mm.

## `D45` and `D42` — consequence text moved 2026-09-19

### `D45` — the snap's timing

⭐ A gesture in flight must answer the finger instantly; a snap the hand has already asked for may
take a moment to arrive. ⚠ It runs at **2/7 of** `cameraResetMs` — a ratio, not a second tunable
(*"twice faster"*, then *"1/3rd"*, then *"2/7th"*, same day) — with the camera's own `easeInOut`,
so one slider governs both. ⛔ The constraint is pushed IMMEDIATELY while the pose travels, and a
release mid-flight **stops** the snap rather than finishing it, because releasing must not rotate
the object.

### `D42` — the gesture that replaced the flag

⚠ Leaving `FOLLOW` by single taps takes two — one to switch, one to release — which is the price
of one gesture carrying two jobs. ⚠⚠ A double tap that ALIGNS no longer flies the camera home
(*"the double tap in such case shall not trigger the camera orbit reset"*); everywhere else —
empty space, the held object, a second touchpoint — the double tap keeps every meaning it had.

## `D54`, `D40`, `D38`, `D37` — consequence text moved 2026-09-19

⚠ Moved to keep `DECISIONS.md` inside its byte budget as `D55`–`D61` landed. The rows there keep
the owner's words and the pointer; nothing is lost, it is one tier down.

**`D54`** — gone with it: `holder_binding.ts`, `relatchOnOrphan`, `evaluateBindings`,
`collectOrphans`, `objectUnder`, the HUD's `⛔ORPHANED` line and 16 vectors. ⭐⭐ And it closes
`D51`'s recorded hole **by construction**: with no unselect anywhere, a pinned Pioneer cannot
orphan its Follower's holder.

**`D40`** — the deleted modules were `anchor_fork.ts`, `align_flick.ts` (fork B's flick-to-align)
and `drag_rule.ts`. ⭐⭐ A whole class of code went with them: the CAP of one alignment makes
`ROTATE_REFUSED` unreachable, so eviction's *escape from a full stack* vectors described a state
that can no longer exist. ⚠ A sanity sweep went with it — six orphans, one duplicate gain under
two names, one skeleton function.

**`D38`** — *"The game shall start by default to fork C"* overruled my reasoning that the default
must be the only set a hand has closed; the owner IS the hand. ⚠ The retirement of the automatic
mode switch also unblocked testing the rotation reset after an alignment. Two defects of mine came
with it (ledger 44, 45).

**`D37`** — ⛔ One alignment, replaced not stacked, so fork B's zero-DOF freeze cannot be built.
⭐ Fork C's alignment completes **mid-gesture**, with the object still held.

## `D30` and `D39` — consequence text moved 2026-09-19

**`D30`** — ⚠ The alternative was moving anchoring to **its own channel**, as eviction moved off
the double-tap (`D12`→`D15`); gating on the mode won because it costs **no new gesture**.
⛔ Nothing was orphaned — `flick.ts` keeps 6quater and the orientation rollback.

**`D39`** — ⚠ The re-tap is a `ROTATE` gesture, so the shake stayed the only undo while
translating, and the owner said he would judge one against the other. ✅ Superseded in part by
`D37`→`D55`'s sweep: the re-tap now works in either mode.

## `D63`, `D49`, `D46` — consequence text moved 2026-09-19

**`D63`** (the approach swing, a TRIAL on `1.0.18-`) — the amplitude is **divided by the finger's
speed**, `(gain × speed)^exponent` with the product GROUPED so the knee stays at `1/gain` for
every exponent and the two dials are independent; smoothed at τ = 120 ms against the speed
estimator's own 40 ms-window steps; and **frozen unless a TRANSLATION drives it**, because
rotation changes the surface gap and would orbit the camera on its own. ⚠ It ships with a
selector (`approachRetargetsOrbit`) for switching the yellow orbit target to the pair's
barycentre on capture, and a boot scene of two square pre-aligned parts.

**`D49`** — ⚠ glTF has no quads, and a phantom would be a second source of truth for one fact.
⭐ The offset is **millimetres on the glass** with a slider, and the white contour **is** that
shell — the body inflated by HALF the offset, so two touching contours mean the pair captures.

**`D46`** — ⭐ Three visible states: capture (white contours), docking (the drag partitions by
ANGLE, not by mode) and an authorised MATE — with **one finger on each object** driving the fine
approach, which is `D47`'s break with the sign reversed. ⚠ The owner answered every question the
same day.

---

# ⛔⛔ TWO THINGS A NEW SESSION MUST NOT REBUILD — moved from `QUEUE.md` 2026-09-19

⚠ Moved to keep the mandatory load inside its byte budget as the 2026-09-19 pass landed.
### ⛔⛔ TWO THINGS A NEW SESSION MUST NOT REBUILD, and a number that came out of them

⛔ **Rotation inertia** (`spin.ts`) and **`targetVelocity`** were both BUILT, MEASURED and
removed — the first rejected on the device by the owner, the second because it made everything
visibly jitter. ⚠ Both ideas are attractive and will occur to anyone reading this code; the
measurements, and why `translateInertiaMs` has a **floor of one pointer interval** (the shipped
7.6 ms), are in [`queue_notes/REJECTED_AND_MEASURED.md`](queue_notes/REJECTED_AND_MEASURED.md).
⭐ *An invisible 0.4 mm of trail is not worth a visible 2 mm of jitter.*


## `D58` and `D59` — consequence text moved 2026-09-19

**`D58`** — ⛔ A press on the **held object itself** is deliberately absent from the owner's
list; a press on **another** object stays `D55`'s align. ⚠ The `A16` collision: the OUTSIDE
finger is the one that drives depth/roll, so its channel would alternate on every touch instead
of being chosen — narrowed by `D61`, which makes the FIRST outside press of a hold inert on a
free body. ⛔ A tap must not toggle twice, and on the PioneerFace the toggle is **rolled back**
when the release turns out to be `D39`'s re-tap.

**`D59`** — ✅ It settles `D58`'s `A16` collision for aligned bodies; ⚠ the collision survives
on a **free** one, which is what `D61` then covers. ⚠ `SAME_OBJECT` is untouched: the owner's
sentence says *outside any object*, and `A12`'s finger shares a body with the holder where a
diagonal would smear one axis into the other.


## `D64` — SUPERSEDED BY `D65` THE SAME DAY, 2026-09-21

**The decision as taken**: *driving consumes the toggle* — a second touch that applied any roll
or any depth ended in a RELEASE, and only a touchpoint that had driven **nothing** could still
toggle the mode on its lift. ⭐ It came from the owner's constraint on the fix — *"make sure you
discriminate between a release … and a tap or double-tap (a tap or double-tap is a deliberate
action and should not be modified at this time)"* — and the discriminator was `applyDepthDrag`'s
own return value, i.e. `A11`'s deadband, so it introduced no new threshold.

⛔⛔ **IT SHIPPED AS `a33b485` AND A HAND REJECTED IT WITHIN THE HOUR**, on two counts:

1. *"when I release the second touch (outside of any object), the follower mode changes: fix did
   not solve that."* ⚠⚠ **The fact had a hole, and it is arithmetic rather than bad luck**:
   *drove* is a per-CHANNEL question. On a FREE body the movement mode gives the second finger
   **one** axis, so a finger moved along the other one applies nothing at all, `applyDepthDrag`
   answers `false` **truthfully**, and the lift toggled exactly as before.
2. *"When I release the second touch from the pioneer, it also toggles the follower mode."*
   ⛔ A finger pressed on **another body** is an `OBJECT` role with a grip of its own and
   releases through the recognizer's `TAP` verdict — a path `D64` never touched. ⚠ It had been
   **flagged in the same change** as *"the same argument would apply to it; it was not
   reported"*. ⭐ `METHOD`: *a fix that lands beside the defect leaves a green suite and a broken
   product* — and, second lesson, **naming a risk is not the same as not taking it.**

⭐⭐ **WHAT SURVIVES IT**: the `releaseTogglesMode` seam itself, the `toggledOnPress` half, and
the finding that made the row worth having — **the lift was toggling what `D61`'s inert press had
refused to**, so `D61` was postponing its own defect rather than closing it. `D65` keeps all of
that and replaces only the fact it asks for.


## `D58`, `D61` and `D65` — ALL REPEALED BY `D66`, 2026-09-21

⭐⭐⭐ **THEY ARE ONE CHAIN, AND THE FIRST LINK IS THE ONLY REAL DECISION IN IT.**

**`D58`** (2026-09-19) made a **press** toggle the movement mode, in two places: a continued
press outside any object, and one on the held body's exact `PioneerFace`. The owner's reason was
`D55`'s own: *a finger that comes down and stays down is asking for the same thing as one that
comes down and lifts.* ⚠ It was flagged in the same change as colliding with `A16` — the OUTSIDE
finger is the one that drives depth or roll, and the mode picks **which**, so placing that finger
flipped what it was about to do.

**`D61`** (2026-09-19) narrowed `D58` to contain that collision: the **first** outside press of a
hold is inert, so placing the finger costs nothing and a *second* press switches. ⛔ It exempted
an aligned **Follower**, arguing that `D59` had taken the mode out of a Follower's channel choice
and so *"there is nothing left for a toggle to disturb"*.

⚠⚠ **THAT ARGUMENT WAS INCOMPLETE, AND IT IS THE WHOLE DEFECT.** The toggle disturbs what the
**first** touch does *after the second one lifts* — and `translatesOnDrag` returns `true` for the
entire two-finger phase (`D59`/`D60`), so **the change is invisible until exactly that moment**.

**`D64`** and **`D65`** (2026-09-21) were both aimed at the **release**, because that is where a
hand could see it. Each fixed a real defect on its own path and neither touched the cause.

⭐⭐ **THE TRANSFERABLE LESSON IS ABOUT THE REPORT, NOT THE CODE**: *when a rule's effect is
masked while a gesture is in progress, a hand can only report the moment the mask lifts — so the
event named in the report is the one where it BECAME VISIBLE, not the one where it happened.*
⛔ Two rounds were spent on the wrong event. The HUD had printed `press outside → ROTATE` the
whole time, in a dump taken from the device the day before.

✅ **`D66` deletes the press toggle**, and with it every guard that existed only to contain it:
`pressTogglesMode`, `PressToggleContext`, `D61`'s exemption, `Held.outsidePressSeen`,
`pressToggled`, the PioneerFace re-tap **rollback**, and `releaseTogglesMode` with both facts it
was tried on. ⭐ The `A16` collision cannot recur, because placing a finger now does nothing.


## `D42` — SUPERSEDED IN PART BY `D67`, 2026-09-21

**What it decided** (2026-09-17): the flag that chose what a turned Pioneer costs its Follower
became a **GESTURE** — a single tap makes a `SNAPSHOT`, a double tap makes a `FOLLOW`. ⭐ Better
than a flag in the way that matters: two alignments can differ, and the colours say which is
which — cyan + amber for a snapshot, both amber for a relationship.

✅ **THE TWO MODES AND THEIR COLOURS SURVIVE `D67` UNCHANGED.** What is superseded is *which
gesture asks for `FOLLOW`*: the owner moved that question from the second touch's tap count to
the **Pioneer's own press** — *"the first touch shall be double tap without final release [on]
the pioneer object"*. ⛔ The reason is the multi-select: with several Followers chosen during one
hold, a per-Follower tap count would let one hold produce a mixture of colours nobody asked for.
⭐ `alignModeFor` is still the one place the mapping lives; only its input changed.
