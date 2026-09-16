# Superseded decisions — the full text

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
