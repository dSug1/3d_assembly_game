# A3 AND A4 IN FULL — anchored roll, and eviction as a shake

> **STATUS** · record · **OWNS** · the ARGUMENT behind A3 and A4
> **READ IF** · you are building the eviction shake or 2sexte/A3 handover (`IN3`)
> **LAST VERIFIED** · 2026-09-15

⛔⛔ **THIS IS NOT THE DESIGN OF RECORD.** The binding clauses of both amendments are in
[`../AMENDMENTS_R5.md`](../AMENDMENTS_R5.md), which carries a short entry for each pointing
here. ⚠ Both are IN FORCE and NOT BUILT — the modules exist and are not wired.

⭐ Moved out of `AMENDMENTS_R5.md` on 2026-09-15 when that file passed its 800-line cap.
`README.md` rule 3: *hitting the cap is the signal to push narrative down a tier, not to
keep appending*, and rule 2: *nothing is rewritten to save space*. The text below is
**verbatim** as it stood.

---
## A3 — ⛔⛔ ROLL MUST DRIVE THE FREE DOF OF AN ANCHORED OBJECT *(owner, 2026-09-15)*

**Supersedes** §2's 2quinte restriction — *"restricted to unconstrained objects, since roll
about the view axis cannot preserve an existing alignment. On a constrained object the
circular gesture is ignored"* — and A1's repetition of it.

> *"If an object is anchored on gravity, it still needs to be able to receive roll input in
> case the camera has orbited and views the object from the gravity axis: therefore roll
> shall be able to drive 1 DOF for an anchored object anyway and the spec seems wrong."*

### ⭐ The spec's reason is TRUE IN GENERAL AND FALSE IN THE CASE THAT MATTERS

Roll turns the object about the **view axis**. An anchor's surviving DOF is the twist about
the **constraint axis**. Let **α** be the angle between them:

| α | what a roll does to the anchor |
|---|---|
| **α ≈ 90°** (constraint axis lies across the screen) | roll swings the constrained normal straight off its target. **The spec is right here** |
| **α ≈ 0°** (camera looking ALONG the constraint axis) | the two axes coincide: rolling about the view axis **IS** twisting about gravity. It preserves the anchor **exactly**, and it is precisely the one free DOF 2sexte exists to drive |

⛔ So revision 5 states as unconditional a fact that is **conditional on camera pose**, and
forbids the gesture in the configuration where it is not merely safe but ideal. ⚠ This is a
shape this project has paid for before — a blanket rule standing in for a conditional one.

### ⭐⭐ AND THE TWO INPUTS ARE COMPLEMENTARY, NOT COMPETING — the part that settles it

2sexte is *"driven by the delta component perpendicular to the axis **as projected on
screen**"*. ⛔ **When the camera looks along the constraint axis, that axis projects to a
POINT** — and "perpendicular to a point" is undefined. Every screen direction is equally
perpendicular, so the drag mapping is degenerate exactly at α ≈ 0.

⭐⭐ **So 2sexte degenerates precisely where roll becomes exact, and roll is destructive
precisely where 2sexte is well-conditioned.** They are not two rules competing for one DOF;
they are two charts covering one circle, each valid where the other fails. That is the
argument for admitting roll on an anchored object — stronger than "the user wants it".

### What `IN3` implements

⭐ **On a constrained object, roll drives the SAME single DOF that 2sexte drives** — the
twist about the constraint axis — rather than a rotation about the view axis. The screen
gesture is read as an angle; the axis it is applied about is the CONSTRAINT's, not the
camera's. The anchor then survives by construction rather than by luck.

⛔ **Gated on |cos α|, and SUPPRESSED in the crossover.** Near α = 90° the gesture must do
nothing: a roll there cannot be honoured without breaking the anchor, and honouring it
partially is worse than refusing it. `LESSONS_CARRIED` §6 — *where a quantity is
ill-conditioned, stop using it; do not substitute a plausible value.*

⚠ New tunable, landing with the code that reads it and **with a slider** (`IN5`):
`rollAnchorAlignCos`, the minimum |cos α| at which roll is accepted on a constrained
object. ⛔ It is **not** a number to guess — the honest range is wide and the crossover is
exactly where a hand will tell you something a simulation cannot.

⚠ **Two constraints on the stack ⇒ still nothing.** Zero free rotational DOF means zero,
and roll is not an exception to the DOF budget.

### ⛔⛔ AND 2SEXTE MUST BE CORRECTED TOO — it has no degeneracy handling at all

§2's 2sexte is *"driven by the delta component perpendicular to the axis **as projected on
screen**"* and says nothing about what happens when that projection collapses. ⛔ **At
α ≈ 0° the constraint axis projects to a POINT**, every screen direction is equally
perpendicular to it, and the rule as written produces a value from a quantity that has no
value. That is not a rounding problem — the mapping's sign and magnitude both become
arbitrary, so the object turns by an amount and in a direction nothing chose.

⭐ **So the correction is symmetric, and it is one rule, not two:**

| α, view axis to constraint axis | what drives the free DOF |
|---|---|
| **near 0°** — axis points at the camera | ⭐ **ROLL.** 2sexte is degenerate and must SUPPRESS |
| **near 90°** — axis lies across the screen | ⭐ **2SEXTE.** Roll would break the anchor and must SUPPRESS |

⛔⛔ **ONE CONSTANT GOVERNS THE HANDOVER, NOT TWO.** Two independently chosen thresholds
give either a **dead band** where neither input drives the DOF — the control simply stops
working at some camera angles, which reads as a bug nobody can reproduce — or an
**overlap** where both drive it at once and the object turns twice as fast as either rule
intends. `CONSTRAINTS` §4: *one constant lives in exactly one place.*

⚠ **And the handover needs HYSTERESIS**, for the reason §1.1 gives for
`moveEnterDistance` > `moveExitDistance` and the reason the orbit centre has a grace
period: a bare threshold **chatters**. A camera parked near the crossover would flip the
DOF's driver back and forth between two mappings with different gains, mid-gesture.
⭐ One constant plus a band: `anchorHandoverCos` and `anchorHandoverHysteresis`, both
device-tuned on sliders (`IN5`).

⚠ **The handover is latched at PRESS**, like §4's roles and like the screen axes — a camera
that moves during a gesture must not change which rule is driving the finger already down.

### ⛔ Consequence for A1, and it is not small

A1 made a full 360° roll the eviction gesture. ⚠ **A3 makes roll a legitimate continuous
control on exactly the objects eviction applies to** — so the two now share a channel, and
"spin the part round to look at it" becomes a path to accidental eviction rather than a
hypothetical. ⭐ **The eviction gesture is under review for this reason**; see
[`../00_CORE/queue_notes/IN3.md`](../../00_CORE/queue_notes/IN3.md).

---

## A4 — ⭐⭐ EVICTION IS A QUICK BACK-AND-FORTH, NOT A ROLL *(owner, 2026-09-15)*

**Supersedes A1's TRIGGER.** ⭐ Everything else A1 established stands: the double-tap is
still purely the camera-home fly, `D13` still spares `MATE` entries, and A1's conflict
audit is still the reason this rule looks the way it does.

> **To clear a selected object's alignments, shake it** — one touchpoint on the object, a
> quick **back-and-forth** in any direction, reversing within a time threshold.

### ⛔ Why the roll had to go — A3 took its channel away

A1 chose a 360° roll when roll was **forbidden** on a constrained object, so the channel
was free and a full turn there could mean nothing else. ⛔ **A3 reverses that**: roll is now
a legitimate continuous control on precisely the objects eviction applies to. *"Spin the
part round to look at it"* stops being hypothetical and becomes a path to destroying the
user's own work.

⚠ **720° was considered and rejected.** Doubling the threshold widens a margin without
changing the KIND of conflict — it is the same channel carrying a real control either way —
and it buys that with a tedious, fatiguing gesture during which the object visibly spins
two full turns. ⭐ *A bigger number is not a resolution to an ambiguity; a different channel
is.*

### ⭐⭐ Why the back-and-forth is the right channel

1. ⭐ **It is not the roll channel**, so A3's control is left completely free — no threshold
   anywhere near it.
2. ⭐⭐ **The detector already exists and is already MEASURED.** The sympathetic sway
   re-triggers on a change of direction, and that cost real work: a per-sample direction is
   noise — at 8 ms between samples, 0.761 mm of jitter is ±95 mm/s, and **a still finger
   fired 272 false kicks in 3 s**. It now reads displacement over **60 ms** and requires
   **3× the measured noise** to claim a heading. ⛔ This is the only one of the three
   candidates that can reuse a reversal detector with a KNOWN false-positive rate.
3. ⭐ **A symmetric out-and-back nets to ZERO displacement**, so whatever 2bis or 2sexte
   does during the shake cancels itself and the object ends where it started. The same
   property the circle had, kept.
4. ⭐ **Shake-it-loose** matches the destructive intent, which a tap never did.

### ⛔ What must be implemented, because the shake has its own conflicts

* ⛔⛔ **THE FLICK TEST IS SHARPER HERE, NOT MILDER.** A flick is *fast + straight + far*; a
  shake is **literally two flicks in opposite directions**, so each leg matches the flick
  signature by construction. **Once one reversal has been seen, the flick test is skipped
  for that touchpoint.** Without it a user shaking to REMOVE a constraint gets 2ter or
  2quater at release and ADDS one — and with two on the stack the object then has zero free
  rotational DOF and stops responding entirely. ⭐ The discriminator is crisp — zero
  reversals is a flick, one or more is a shake — but it must be written, not assumed.
* ⚠ **Corrective nudges are the accident risk.** *"Left a bit, right a bit"* during fine
  positioning is a genuine back-and-forth, and this risk is higher than a full circle's.
  Managed by requiring **≥ 2 reversals inside a tight window** and a **minimum leg amplitude
  well above the 0.761 mm measured noise floor** — not by hoping.
* ⛔ **Single touchpoint only.** With a second finger down, rule 6 is translating the object
  and a back-and-forth there is an ordinary drag. Gate on `activeCount === 1` (§4's count,
  which already excludes `IN8`-ignored touchpoints).
* ⚠ **Refuse audibly on a MATE-ONLY stack** (`D13`): the gesture was aimed at something and
  did nothing, and silence reads as a broken control that gets repeated. ⭐ **On an EMPTY
  stack, stay silent** — nothing was aimed at, and a buzz for every shake of a free object
  is noise.

### The tunables — all three device-tuned, none guessed

`evictShakeReversals` (2), `evictShakeWindowMs`, `evictShakeLegMm`. ⛔ They land WITH the
code that reads them (`config_debt` refuses an orphan) and **each ships with a slider**.
⭐ `IN5`: a guessed number has been wrong every time on this project, and this gesture's
whole safety rests on the gap between a shake and a nudge — which is a hand's judgement,
not a simulation's.

### ⚠ Provenance

⚠ **NOVEL COMPOSITE**, and flagged for `SEC4`. The nearest widely-known relative is iOS's
*shake to undo* (2009) — but that reads the **accelerometer**, a device motion, not a touch
path, so it is a different input entirely and not a safe prior-art anchor for this. ⭐ The
metaphor is old; **this gesture is not attested anywhere found.** Registered in
[`PROVENANCE.md`](../PROVENANCE.md).

---

