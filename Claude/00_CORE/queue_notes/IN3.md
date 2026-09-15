# `IN3` — rules 1–3 (one touchpoint)

**Status: NEXT, and UNBLOCKED** — `3D1` landed 2026-09-15, so the object model, the face
centres and the constraint stack all exist. ⛔ **`IN3` also CLOSES `3D1`**, which has no
visible behaviour of its own and therefore cannot be closed by a device look alone.

✅ The collision this dossier was opened for is **RESOLVED**, and so is the question it
raised: **eviction spares `MATE` entries** (`D13`). See the end.

## ⛔⛔ THE DOUBLE-TAP COLLISION — decide this before writing rule 2septies

**The spec (§1.4) makes a double-tap the ONLY way a constraint is ever evicted.**

**But since 2026-09-14 a double-tap ALSO resets the camera orbit**, anywhere on the
glass — on an object or not. That is the owner's call, and the reason is reachability:
the orbit can get stuck close in with an object filling the view, and in that state every
tap lands ON something. A reset that only listened to empty space would be unreachable
exactly when it is wanted.

⚠ So when `IN3` builds constraint eviction, one of the two has to give:

* the same double-tap does **both** — evict the constraint *and* reset the camera; or
* the reset moves to a gesture of its own (a triple tap, a two-finger double-tap, a
  button); or
* eviction moves instead.

⛔ **It must be decided, not discovered.** Today the reset fires on every `DOUBLE_TAP`
verdict in `scene.ts`, so whichever way it goes, the change is one branch — but if
eviction is written without looking here, the two will silently both fire and the user
will lose a constraint every time they straighten the view.

⭐ Note also that the tap history is **shared across every touchpoint** (`TapHistory` in
`recognizer.ts`, one instance in `scene.ts`). It was briefly split so object taps and
empty-space taps could not fuse; the owner overruled that — *"no discrimination inside or
outside any object"* — so a double-tap that straddles an object's edge counts as one
gesture, which is what a hand means by it.

---

## ✅✅ DECIDED 2026-09-15 — eviction is a FULL 360° ROLL *(owner, `D12`)*

> *"Replace double-tap in §1.4 by doing a full 360 degree roll rotation on the selected
> object."*

⭐ The reset did NOT move; **eviction** did. A double-tap now means exactly one thing — fly
the camera home — and the tap history stays shared across every touchpoint, as the owner
required. Spec amendment **A1**, at the top of
[`../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

### Why it is a good answer, in two sentences

⭐⭐ The gestures are now in different **modalities** — a discrete pair of taps against a
continuous swept circle — which is a far wider separation than two same-shaped gestures told
apart by where they land. ⭐⭐ And the **size of the gesture matches the size of the
consequence**: eviction destroys deliberate work, §1.4's eviction clause exists precisely
because a 2 mm accidental drag used to wipe an anchor, and a full turn cannot be performed by
accident — where a double-tap plainly can.

### ⛔ What `IN3` must implement, because A1 removed an exclusivity

Revision 5 had a constrained object IGNORE circles, so **2sexte owned every drag on a
constrained object**. It no longer does. Three consequences, all resolved in A1, plus one
that is not:

1. **2quinte is amended** — a constrained object **tracks** the circle without rolling.
   Ignoring it, as revision 5 says, would make the new gesture unreachable on the only
   objects it applies to.
2. **2sexte and eviction run in PARALLEL.** Both are one finger on a constrained object.
   Suppressing 2sexte whenever a path looked curved would make constrained rotation stutter,
   because fingers pivot about a knuckle and a hand arcs constantly. ⭐ The margin is wide:
   the detector commits at `rollAngle` = **60°** and eviction needs **360°**.
   ⚠ Open for the device: is the 2sexte rotation performed *during* the circle kept or
   rolled back when eviction fires? **Kept** is the better default.
3. ⛔ **The flick test must be skipped once a circle is TRACKED**, not only once a roll is
   applied. Otherwise a user who starts a circle, gets part way and releases with speed runs
   the flick test — and a flick on a selected object **pushes** `GRAVITY_ALIGN` or
   `WORLD_AXIS_ALIGN`. The hand reaching to REMOVE a constraint would add one.

### ⛔⛔ AND ONE QUESTION THAT IS STILL THE OWNER'S — it blocks writing eviction

**Does a full turn break MATES too?** §1.4 clears *the constraint stack*, and a `MATE` is a
stack entry, so as written the eviction gesture would disassemble every joint on that
object.

⭐ That may be exactly right and free: `DECISIONS.md` carries *"un-snap: what breaks a mate
on a touchscreen?"* as open, the predecessor's answer was *"un-snapping needs two hands"* —
**deliberately hard** — and a full turn is deliberately hard. ⛔ Or it is too much: clearing
an alignment and detaching an assembly are different intentions, and one gesture doing both
means a user tidying an alignment loses their assembly.

* **(a) one gesture, whole stack** — and the un-snap question closes with it;
* **(b) eviction spares `MATE` entries** — alignments only, and `3D3` keeps waiting.

⚠ It is recorded in [`../DECISIONS.md`](../DECISIONS.md) under *still the owner's to make*,
and `IN3` must not guess it.

### The tunable

`rollEvictDeg`, default **360**, **signed** accumulation so a reversal unwinds rather than
adds. ⛔ It lands WITH the code that reads it (`config_debt` refuses an orphan) and **with a
slider** — `IN5`: a guessed number has been wrong every time.

---

## ⚠ SUPERSEDED THE SAME DAY — eviction is a BACK-AND-FORTH, not a roll (`D15`, amendment A4)

⛔ **The 360° roll above is obsolete.** It was chosen while roll was FORBIDDEN on a
constrained object, so that channel was free and a full turn there could mean nothing else.
⭐ **`D14` reversed that**: the owner found the spec wrong — an object anchored on gravity
must still take roll when the camera has orbited to look **along** the gravity axis, because
there rolling about the view axis **IS** twisting about the anchor, and it is exactly the one
free DOF 2sexte exists to drive.

⭐⭐ **And 2sexte is DEGENERATE in that same pose**: its axis projects to a point, so *"the
delta component perpendicular to the axis as projected on screen"* has no value — every
screen direction is equally perpendicular, and the rule would turn the object by an arbitrary
amount in an arbitrary direction. The two inputs are **complementary charts over one DOF**,
each well-conditioned where the other fails, handed over on **ONE constant with hysteresis,
latched at press**. ⛔ Two independent thresholds would give either a dead band where the DOF
has no driver at all, or an overlap where it has two and the object turns twice as fast as
either rule intends.

⛔ With roll now carrying a real control, eviction had to leave that channel. ⚠ **720° was
considered and rejected**: a bigger number widens a margin without changing the KIND of
conflict, and pays for it with a fatiguing gesture during which the object visibly spins two
full turns. ⭐ *A different channel is the resolution; a bigger number is not.*

### What `IN3` implements for eviction

**A quick back-and-forth** — one touchpoint on the object, **≥ 2 reversals** inside a window,
each leg well above the measured **0.761 mm** noise floor. ⭐ It reuses the **sway's reversal
detector**, the only one on this project with a MEASURED false-positive rate: a per-sample
direction is noise, a still finger once fired 272 false kicks in 3 s, and it now reads
displacement over 60 ms and needs 3× the noise to claim a heading.

⛔⛔ **THE ONE THING THAT MUST NOT BE FORGOTTEN: skip the flick test once ONE reversal is
seen.** A shake is literally two flicks in opposite directions, so every leg matches the
flick signature by construction. Without the guard, a user shaking to REMOVE a constraint
gets 2ter or 2quater at release and **ADDS** one — after which two constraints leave zero
free rotational DOF and the part stops responding to drags entirely.

⚠ **Refuse audibly on a MATE-ONLY stack** (`D13`) — the gesture was aimed at something and
did nothing, and silence reads as a broken control that gets repeated. ⭐ **Stay silent on an
EMPTY stack**: nothing was aimed at, and a buzz for every shake of a free object is noise.

⛔ **Gate on `activeCount === 1`.** With a second finger down, rule 6 is translating the
object and a back-and-forth there is an ordinary drag.

⚠ Three tunables — `evictShakeReversals` (2), `evictShakeWindowMs`, `evictShakeLegMm` —
land WITH the code that reads them and **each ships with a slider**. ⭐ The whole safety of
this gesture is the gap between a shake and a corrective nudge, and that is a hand's
judgement, not a simulation's.

⭐ Full text: [`../../10_INPUT_TOUCH/AMENDMENTS_R5.md`](../../10_INPUT_TOUCH/AMENDMENTS_R5.md), A3 and A4.
