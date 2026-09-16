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
