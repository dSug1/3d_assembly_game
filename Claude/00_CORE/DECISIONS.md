# DECISIONS — taken, and still open

> **STATUS** · live · **OWNS** · owner decisions and their consequences
> **READ IF** · you are about to re-open something, or need to know whose call it is
> **LAST VERIFIED** · 2026-09-15

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
| `D17` | ⭐⭐ **Depth is a COMMON VERTICAL DRAG, not a pinch** | 2026-09-15 | Supersedes `D16`'s TRIGGER; its geometry stands. One finger on the object, one **anywhere**, both travelling in y together. ⛔ A hand found the hole: two fingers will not fit on a SMALL object, and pushing a part away shrinks it — **the pinch destroyed its own affordance as it succeeded**. ⭐⭐ It shares rule 6's configuration, so the discriminator is the design: **common mode is depth, differential mode is rule 6**, and the tolerance is on the DIFFERENCE of the two travels. ⭐ The gain is rule 6's computed factor redirected, so `gainTranslateDepth` — already declared as debt owed to 6bis — is wired rather than invented, and 1.0 means *as far as a drag would*. ⚠ Not "under the finger": that mapping diverges as the camera levels out. Amendment **A6** |
| `D16` | ⚠ **SUPERSEDED IN PART BY `D17`** — the pinch trigger is gone; the depth GEOMETRY it established stands | 2026-09-15 | Superseded `D10`. Pinch in pushes the object away, pinch out brings it closer; one finger on each of two objects is §4 rule **6ter**, already specified. ⭐⭐ It came from a HAND, as a fourth answer the watch item did not offer — so §3.2 DS3 is declined. ⭐ It removes `D10`'s dead end: lifting one of two fingers now returns to rotation instead of leaving the part unresponsive. ⛔⛔ **The gain is COMPUTABLE — `distance' = distance × (sep₀/sep₁)` — so `gainPinchDepth` is a multiplier on a computed factor and 1.0 is CORRECT, not preferred.** ⚠ `IN2`'s `IGNORED` role survives with a moved trigger: the SECOND touchpoint participates, the third and beyond are ignored — the 22 router vectors are written against the old rule. Amendment **A5** |
| `D15` | ⭐⭐ **Eviction is a QUICK BACK-AND-FORTH, not a roll** | 2026-09-15 | Supersedes `D12`'s trigger. ⛔ `D14` gave the roll channel back to a real control, so eviction had to leave it — *a bigger number is not a resolution to an ambiguity; a different channel is* (720° was considered and rejected: same channel, same kind of conflict, more fatigue). ⭐⭐ It is the only candidate that reuses a reversal detector with a **measured** false-positive rate — the sway's, calibrated against 0.761 mm of pointer noise after a still finger once fired 272 false kicks in 3 s. ⛔ The flick test must be skipped once ONE reversal is seen: a shake is literally two flicks in opposite directions, and without the guard an abandoned shake ADDS a constraint instead of removing one. Amendment **A4** |
| `D14` | ⛔⛔ **Roll DRIVES the free DOF of an anchored object; 2sexte suppresses where it degenerates** | 2026-09-15 | The spec forbade roll on a constrained object for a reason that is **conditional on camera pose** and false when the camera looks along the constraint axis — where rolling about the view axis IS twisting about the anchor. ⭐⭐ And 2sexte is **degenerate there**: its axis projects to a point, so *"perpendicular to the axis as projected on screen"* has no value and the rule would turn the object by an arbitrary amount. The two are complementary charts over one DOF. ⛔ **ONE handover constant, with hysteresis, latched at press** — two thresholds would give a dead band where the DOF has no driver, or an overlap where it has two. Amendment **A3** |
| `D13` | ⛔⛔ **Eviction SPARES `MATE` entries** — a full turn clears alignments, never a joint | 2026-09-15 | *"Clearing an alignment and detaching an assembly are different intentions so they can't be done by the same gesture."* ⭐ The principle generalises: **one gesture, one intention** — a gesture serving two cannot be aimed, and here the cost of the misread is the whole assembly. ⭐ A surviving `MATE` becomes the OLDEST entry and therefore HARD, which is right: the joint is what must stay exact. ⛔ A full turn on a MATE-ONLY stack must **refuse audibly** (§6's negative haptic) — silence reads as a broken gesture and gets repeated. ⚠ Un-snap stays OPEN and `3D3` still waits: reading (a) would have closed it for free, and this is the judgement that the free answer was the wrong one |
| `D12` | ⚠ **SUPERSEDED BY `D15`** — eviction was a full 360° roll, and is now a back-and-forth. ⭐ Kept: it is what moved eviction off the double-tap, and that half stands | 2026-09-15 | Resolved the collision with the camera-home reset: a double-tap now means one thing only. ⭐ The two gestures are in different MODALITIES — discrete taps against a continuous swept circle — a wider separation than two same-shaped gestures told apart by where they land. ⭐⭐ And the gesture's size now matches its consequence: eviction destroys deliberate work, and a full turn cannot be done by accident. ⛔ It AMENDS 2quinte (a constrained object must TRACK the circle without rolling, or the gesture is unreachable), shares a context with **2sexte** (both run; the roll detector separates them, 60° commit against a 360° turn), and requires the flick test to be skipped once a circle is TRACKED — or an abandoned eviction would PUSH a constraint instead of removing one. ⚠ **One question stays open and is above**: does a full turn break MATES too? Spec amendment **A1**; `rollEvictDeg` (360) lands with `IN3`, with a slider |
| `D11` | ⭐⭐ **Adopt the PROVENANCE DISCIPLINE** from the owner's `TECHNIQUE_CATALOG.md` §0/§5 | 2026-09-15 | Every gesture rule carries a prior-art citation, or is marked ⚠ **novel to this project** so it can be assessed separately. Register: [`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md); binding form: `CONSTRAINTS` §10; review it feeds: `SEC4`. ⭐ Cheap now and expensive to reconstruct later, which is [`LESSONS_CARRIED.md`](LESSONS_CARRIED.md) §7's exact shape. ⚠ Three rules came out NOVEL COMPOSITE: §4's 6bis, 6ter, 6quater |
| `D10` | ⚠ **SUPERSEDED BY `D16`** — a second touchpoint on a held object was IGNORED; it is now half of a **depth pinch**. ⭐ Kept: its *ignored* role still governs the THIRD touchpoint and beyond | 2026-09-14 | Reading 2 (a rotation axis between the fingers) is **deferred, not rejected**. It binds `IN2`'s role latch: *ignored* is a third latched outcome, and lifting an ignored touchpoint must not run the release verdict, flick test or tap history. ⭐ Its visible consequence — lift the holding finger with a second finger still on the part and the part stops responding — was judged on the glass and **accepted**, which makes it an accepted BEHAVIOUR, not merely an accepted decision → [`queue_notes/IN8.md`](queue_notes/IN8.md) |
| `D9` | ⭐ **Babylon over three.js** | 2026-09-13 | `pickResult.faceId` gives face picking directly, which rule 2 needs; multi-pointer handling is built in. ⚠ Apache-2.0, so the NOTICE must ship. ⭐ Reversible in about a day *because* of `D6` — that is what the boundary buys |

## ⚠ Still the owner's to make

| | what is blocked on it |
|---|---|
| **Un-snap: what breaks a mate on a touchscreen?** | the predecessor settled on *"un-snapping needs two hands"*. The touch equivalent is not obvious and `3D3` waits on it. ⚠ **`D12` did NOT answer it**: `D13` (2026-09-15) decided eviction spares mates, precisely because clearing an alignment and detaching an assembly are different intentions. This row stays open |
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
