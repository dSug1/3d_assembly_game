# FORK C — the owner's anchor and alignment rules

> **STATUS** · 🔨 **STAGE 1 BUILT, NO DEVICE LOOK YET** (dictated + built 2026-09-16, `1.0.8-`) · **OWNS** ·
> the rule set behind `?anchorRules=2`
> **READ IF** · you are building or judging fork C
> **LAST VERIFIED** · 2026-09-16

✅ **STAGE 1 IS BUILT** behind `?anchorRules=2` — the alignment, its cap, the highlight, the
mode switch, the shake release, the rotation reset and the twist about the aligned normal.
⛔ **NO HAND HAS TOUCHED IT.** Rule 5: a look on a real device closes a change and nothing
else does. ⚠ `TargetPosition`, the gizmo, the orbit and the approach (§2's last four bullets)
are **NOT built** — §7's remaining questions gate them.
⭐ The conflict check the owner asked for, before any building, is §4–§6.

---

## 1. Why fork B's trigger was abandoned — the owner's report, verbatim

> *"I will leave fork B for the moment, as I am not satisfied with the flick mechanism."*
> Asked what specifically: *"difficult for user to implement, and releases the finger from
> the object it is tracking"*

⛔⛔ **BOTH FAULTS ARE PROPERTIES OF A RELEASE-TIME TRIGGER, NOT OF THIS FLICK** (my claim,
not the owner's). §1.3's flick is a verdict computed *at the lift*: the release **is** the
trigger, so the finger must leave the glass for the alignment to happen — and 2ter/2quater
then unselect the object. And because it must be told apart from an ordinary drag it has to
clear three thresholds, which is what *difficult to implement* means: the gesture is not
chosen, it is performed to a specification.

⭐⭐ So fork C's alignment **completes mid-gesture, with the object still held** — and the
owner's rules below do exactly that: the trigger is a **tap by a second touchpoint**, while
the first keeps its object.

---

## 2. THE RULES — ⚠ THE OWNER'S TEXT, verbatim

> **Fork C rules**
>
> * Fork C branches from Fork A, not from Fork B (no flick).
> * Default start: rotation mode and fork C
> * There can be only one alignment axis (therefore one DOF reduction). I do not want to
>   have 2 DOF removed.
> * If in rotation mode && one touchpoint on first object's hit face (FollowerFace) && tap on
>   second object's hit face (PioneerFace) => PioneerFace and FollowerFaces are defined, the
>   FollowerFace shall remain highlighted until un-highlight occurs, then first object
>   minimally rotates (rotation on the minimum number of axis) so that FollowerFace normal
>   aligns with PioneerFace normal and then the PioneerFace resets as null and then the mode
>   switches to translation mode.
> * Shaking of one object releases the alignment constraints on that object and un-highlight
>   the FollowerFace and then nullify the FollowerFace.
> * If first object is aligned && Second touchpoint pressed on second object:
> * The TargetPosition is defined by the point transform where the second touchpoint raycast
>   hits the second object's face. Highlight the TargetPosition by a cross quad gizmo
>   positioned at the TargetPosition which normal is aligned with the second object's face
>   normal at this TargetPosition (for the moment, this is the normal of the second object's
>   face).
> * If rotation mode, the first object orbits along the gravity axis and the horizontal x
>   axis around the TargetPosition while maintaining its alignment.
> * If in mode translation, the first object translates towards / away from the
>   TargetPosition based on the projection of its touchpoint's delta position vector onto the
>   direction between first object center and TargetPosition. The Second object can also
>   translate based on the projection of its touchpoint's delta position vector onto the
>   direction between the TargetPosition and the first object center
> * Second touchpoint release nullify the highlighted cross quad gizmo and the TargetPosition.
>
> * Before building anything, check if the above rules do conflict with any other inputs rule
>   previously defined and how to transition back and forth from these rules to the other
>   inputs rules

And, dictated immediately after:

> *"reinstate the rotation reset by flick which was previously implemented in fork C"*

⭐ **What that was, exactly**: §1.3's provisional-motion rollback, deleted globally by `D36`
the same day at the owner's instruction because it fought fork B's flick alignment. It
restored the **orientation** captured at press and left the position alone — so *"rotation
reset"* is literally what it did. ⭐⭐ Fork C has no flick alignment, so the channel is free
and the conflict `D36` removed does not exist here. ⚠ It returns **as a fork C rule**, not
as a global behaviour: fork A shipped without it since `D36`.

### ✅ CORRECTIONS AFTER THE FIRST DEVICE PASS — the owner's text, verbatim

> *"corrections to be done to fork C:*
> * *the game shall start by default to fork C, not fork A*
> * *the fork C shall start by default in rotation mode. currently, it start in translation mode.*
> * *when the object is aligned, the aligned face shall continue to be highlighted. you
>   completely disregarded the highlight / un-highlight rule I gave you. Or if you built it, I
>   can't see it on the usb debugging.*
> * *modify the rule: the mode shall not switch automatically to translation mode after an
>   alignment in rotation mode. It makes the game too complicated. Ignore this rule (therefore,
>   remove the lines and continue in rotation mode). This will also allow me to test the flick
>   after an alignment (currently, I cannot test since alignment triggers translation mode).*
> * *shake: currently, your shake movement is triggered only if the touchpoint is pressed and
>   the shake immediately follows (if I am correct). Modify so the shake can occur at anytime
>   during a movement. Also, the shake is not working in translation mode, contradicting what
>   you have written above: correct this bug.*
>
> *The rest is working good."*

✅ **ALL FIVE ARE DONE** (2026-09-16, 615 vectors). ⭐ Two were **defects of mine** and are in
the ledger — the highlight was built and wiped one event later, and the shake's axis was
claimed once at the press. ⛔ The third correction **retires a rule the owner had dictated
himself** (the automatic switch to translation), which is why §2's text keeps it and this
block overrides it: *the later text wins, and the superseded one explains why the current one
exists.*

---

## 3. MY READING — the rules as a state machine

⚠ Mine, for the conflict check. Where it guesses, §7 asks instead of assuming.

| state | what is true | one finger on obj 1 does | second finger does |
|---|---|---|---|
| **C0** | nothing held | — | camera: orbit (§2 r1), pinch (§4 r4), double-tap home |
| **C1** | holding obj 1, no alignment | rotate (mode `ROTATE`) or translate (mode `TRANSLATE`), per fork A | **tap on obj 2's face ⇒ ALIGN** (→ C2). Pressed-and-held: ⚠ §7.5 |
| **C2** | obj 1 aligned, `FollowerFace` highlighted, ⛔ mode **unchanged — stays `ROTATE`** | ✅ `ROTATE`: **twist about the aligned normal** (owner, §7.3). `TRANSLATE`: fork A's screen-plane drag | press on obj 2 ⇒ `TargetPosition` + gizmo (→ C3) |
| **C3** | aligned + `TargetPosition` live | `ROTATE`: orbit obj 1 about the target. `TRANSLATE`: move obj 1 along centre→target | its own delta moves **obj 2** along target→centre |
| — | shake obj 1 (any state) | alignment released, highlight cleared, `FollowerFace` null (→ C1) | |
| — | flick (any state) | **orientation restored to the press pose** (the reinstated reset) | |

⭐⭐ **THE DESIGN HAS A SHAPE WORTH NAMING**: in C3 the two modes are **angle** and
**distance** about one point — orbit sets the direction of approach, translation sets the
separation. That is a polar decomposition about `TargetPosition`, and it is why the mode
switch at the end of the alignment rule reads naturally: aligning is finished, so what is
left is *where*, not *which way up*.

---

## 4. CONFLICTS WITH RULES ALREADY IN FORCE

### 4.1 ⛔⛔ THE TAP CHANNEL IS ALREADY TAKEN — and it resolves, by luck

`D27`/`D28`: **any single tap anywhere** flips the movement mode, immediately, and the mode
is a session latch. Fork C's alignment trigger *is* a tap (by a second touchpoint, on another
object's face) — so today that tap toggles the mode and nothing else.
`src/render/scene.ts` toggles in **two** places: `noteTap` (a non-holding touchpoint) and the
holder's own release verdict.

✅ **AND THE COLLISION RESOLVES WITHOUT A CONTRADICTION A HAND COULD SEE.** The rule fires
only in `ROTATE`, and it ends by switching to `TRANSLATE` — which is *exactly* the flip the
toggle would have produced. So in fork C the tap can carry both meanings at once:

* tap **hits an object's face** while another object is **held** and mode is `ROTATE` ⇒
  define `PioneerFace`, align, `Pioneer := null`, mode → `TRANSLATE`;
* every other tap ⇒ toggle, as `D28` specifies.

⚠ Assumed, not dictated — §7.4. ⛔ And the `ROTATE`-only condition is load-bearing: in
`TRANSLATE` the same tap must still toggle (to `ROTATE`), or the hand loses the only way back.

### 4.2 ⛔⛔ THE SECOND TOUCHPOINT *PRESSED* IS TAKEN — roll and depth (`A10`/`A12`/`D22`)

Today, a second touchpoint pressed while the holder is still drives **roll by its x** *or*
**depth by its y**, the mode picking one. Fork C's C3 gives that same configuration an
entirely different meaning (target + orbit/approach).

⭐ **The two are separable by a condition that is already discrete**: fork C's meaning needs
*obj 1 aligned* **and** *the second touchpoint on another object*. So:

| second touchpoint pressed… | obj 1 aligned? | fork C |
|---|---|---|
| on **another object** | yes | `TargetPosition` + orbit/approach (C3) |
| on **another object** | no | ⚠ §7.6 — roll/depth, or 6bis/6ter, or nothing |
| **outside** any object, or on obj 1 | either | ⚠ §7.6 — presumed roll/depth as fork A |

⛔ Note what this displaces: in C3 there is **no roll and no depth at all**. `A12`'s roll is
the only control that can spin the object about its aligned normal, and C3 takes it away —
which matters because of §7.3.

### 4.3 ⛔⛔ §4's **6bis / 6ter** ALREADY DEFINE TWO-OBJECT TRANSLATION, ALONG A DIFFERENT AXIS

The owner's revision-5 §4 specifies, for two touchpoints on two objects:

* **6bis** (one `MOVING`, one `STATIONARY`) — the axis between the two **selected FACE
  CENTRES**, projected on screen; the delta is projected onto it *and its first orthogonal*,
  and the moving object translates **in depth and along the orthogonal** (`axisMappingMode`
  exists to A/B this against the `"direct"` reading).
* **6ter** (both `MOVING`) — both objects translate **oppositely towards each other** along
  that same axis.

⭐⭐ **FORK C's approach rule IS 6ter's shape with three deliberate differences**, and they
should be recorded as amendments rather than discovered later:

| | §4 6bis/6ter | fork C |
|---|---|---|
| the axis | between two **selected face centres** | **obj 1's centre → the raycast POINT** on obj 2 |
| the mapping | onto the axis **and its orthogonal**, depth-swapped in `"rotated"` mode | **onto the axis only** — the `"direct"` reading, one degree of freedom |
| who may move | 6bis: the moving one. 6ter: both, toward each other | **each finger moves its own object** along the line |
| the partition | by **`MOVING`/`STATIONARY`** | by **mode** and **alignment state** |

⛔ The last row is the real conflict: 6bis/6ter's asymmetric-hands invariant (one hand holds
the reference frame) is **gone** in fork C, and `A10`'s depth gate — *the holder must be
still* — does not appear in the owner's text at all. ⚠ In fork C, both objects can move at
once with no stillness condition, which is precisely what §4's own note flagged as *"the
hardest case to control"*.

### 4.4 ⛔⛔ `A15`/`D25` WILL DROP THE SELECTION MID-ASSEMBLY

`A15` exists because depth slides an object *out from under the finger carrying it*: a
raycast at the second touchpoint's lift asks whether the holder is still on its object, and
if not the selection drops at the next input event. ⛔ **Fork C's C3 does the same thing by
design** — obj 1 travels along the line to the target, so it leaves the finger — and `R9`
(the second touchpoint's release) is exactly the moment `A15` fires its raycast.

⚠ So as written, fork C ends an approach by **unselecting obj 1**, while the rules say the
`FollowerFace` stays highlighted *"until un-highlight occurs"* (a shake). Those two cannot
both be true → §7.7.

### 4.5 ⛔ THE REINSTATED FLICK RESET FIGHTS THE ALIGNMENT IT SHARES A FORK WITH

A flick restores the orientation captured **at the press**. In C2/C3 the press snapshot is
from *before* the alignment, so a flick would rotate obj 1 off its aligned direction **while
the constraint stays on the stack**: the object and its own constraint would then disagree,
which is the one state §1.4 is built to prevent → §7.2.

⚠ Also: `ShakeDetector.suppressesFlick` exists because *a shake is two flicks by
construction*. In fork C the shake clears the alignment and the flick resets the rotation —
two different undos on gestures that look alike. ⭐ The suppression should stay wired, and
`D33`'s narrowing (it arms once the shake **fires**) is what keeps an abandoned shake from
also resetting the rotation.

### 4.6 ⚠ THE DEFAULTS CHANGE TWO THINGS, ONE OF THEM SHIPPED

*"Default start: rotation mode and fork C"* means `initialBehaviour()` (today `TRANSLATE`)
and `anchorRules` (today `0`). ⛔ Making fork C the **default flag** ships an unjudged rule
set as the product, against `anchor_fork.ts`'s stated reason for `NONE` being the default —
*it is the only set a hand has closed*. ⭐ Proposed sequencing: build fork C behind `=2`,
default the **mode** to `ROTATE` *within fork C only* (so fork A's closed feel is untouched),
and move the flag's default to `2` the day a device pass closes it → §7.8.

### 4.7 ✅ WHAT DOES **NOT** CONFLICT — checked, and worth stating

* **§2 rule 1 (camera orbit) and §4 rule 4 (pinch)**: both need every touchpoint `OUTSIDE`
  any object; fork C's states all hold at least one object. No overlap.
* **`A11`'s deadband**: fork C's projections consume `step`, like every other rule. It is
  applied once, upstream, and needs no fork knowledge.
* **`A7`'s gravity frame**: `R7`'s *"gravity axis and the horizontal x axis"* **are** `A7`'s
  two axes — the same basis 2bis already turns about. Fork C inherits it unchanged.
* **`D35`** (the highlight outlives the gesture and dies with the constraint): the owner's
  `FollowerFace` rule states the same thing independently. ✅ Confirmation, not conflict.
* **§1.4's world-vector doctrine**: *"the `PioneerFace` resets as null"* means the alignment
  is a **frozen world direction**, not a live relationship — which is exactly what §1.4
  demands of `WORLD_AXIS_ALIGN`. ⚠ Consequence: if obj 2 is later moved, obj 1's alignment
  does not follow it.
* **`D13`** (eviction spares `MATE`s): no mates exist in fork C yet, so the shake takes
  everything. It will matter the day `6quater` or `3D2` lands.
* **`IGNORED`** (a third touchpoint on a held object): unchanged and still inert.

---

## 5. GEOMETRY — where the rules as written cannot be built literally

### 5.1 ⛔⛔ ONE FACE-NORMAL ALIGNMENT REMOVES **TWO** ROTATIONAL DOF, NOT ONE

> *"There can be only one alignment axis (therefore one DOF reduction). I do not want to have
> 2 DOF removed."*

⭐ Bringing a face normal onto a direction fixes **two** of the three rotational DOF; what
survives is the **spin about that normal**. There is no alignment of a normal that costs one
DOF — one DOF is what is *left*. So the rule is buildable in exactly one reading:

✅ **At most ONE alignment ever on an object; after it, the spin about the aligned normal
stays free.** That is §1.4's entry 1 with the stack **capped at one entry** — and it does
answer the fork B complaint, because entry 2 (which took the last DOF and froze the object)
becomes unreachable by construction.

⚠ Needs confirming, and §7.1 asks — including what a **second** tap on a new face then does:
replace the alignment, or be refused.

### 5.2 ⛔⛔ PARALLEL OR **ANTI**-PARALLEL? — the rules say parallel; assembly needs anti-parallel

> *"so that FollowerFace normal aligns with PioneerFace normal"*

⛔ Read literally that is **parallel**: both faces then point the same way, so obj 1 presents
its *opposite* side to the target and the two faces cannot meet flush — while `CLAUDE.md`
rule 4 and §4's `6quater` both state a mate is **ANTI-PARALLEL** (*"the selected face normal
is brought anti-parallel to the other selected face normal"*).

⭐ Both are legitimate operations and CAD tools ship both — *align* (same facing, like
levelling two top faces) and *mate* (facing each other). ⚠ Which one fork C means changes the
sign of every later rule, so §7.1 asks rather than guessing.

### 5.3 ⚠ *"ORBITS … WHILE MAINTAINING ITS ALIGNMENT"* — position-only, or reorient and re-solve

A rigid rotation of obj 1 about an external pivot changes its **orientation** too, which
breaks the alignment unless the pivot axis happens to be the aligned normal. ⭐ So *maintaining
the alignment* has one cheap reading: the orbit moves obj 1's **POSITION** along a sphere
about `TargetPosition` and leaves its orientation untouched — the constraint is then
maintained by construction, with no re-solve.

⚠ My reading, and it has a consequence to accept knowingly: orbiting away from the line of
the frozen Pioneer normal means the two faces end up parallel **but offset** — flush contact
only happens on that line. → §7.9.

### 5.4 ⛔⛔ THE APPROACH MAPPING DIES EXACTLY WHERE IT MATTERS MOST

`R8` projects a screen delta onto *"the direction between first object center and
TargetPosition"* — a **world** direction, so the projection must be onto its **screen
projection**. That fails in two places, and one of them is the assembly itself:

1. **The line points at the camera** ⇒ it projects to a point, every screen direction is
   equally valid, and the gain is undefined. ⛔ This is the identical degeneracy
   `anchor_rotate.ts` documents for 2sexte, where the honest tracking mapping `1/(r·sin α)`
   *diverges*; the build's answer there is to **refuse** and say so.
2. **The objects touch** ⇒ `centre → target` shrinks to nothing and its direction becomes
   noise-dominated, so the control gets least stable at contact.

⚠ Fork C has no second channel to hand over to in this state, because §4.2 took roll and
depth away. → §7.10.

---

## 6. TRANSITIONS — in and out of fork C's rules

⭐ What the owner asked for: *"how to transition back and forth from these rules to the other
inputs rules"*. Every fork C state is **entered and left on a discrete event**, which is the
one thing `METHOD` insists on: *a mode may be keyed on PRESENCE, never on MOTION.*

| from | event | to | what the other rules do about it |
|---|---|---|---|
| C1 | tap on obj 2's face, mode `ROTATE` | C2 | the tap's toggle meaning is **consumed** by the alignment; the mode change is the same one it would have made (§4.1) |
| C2 | second touchpoint **pressed** on obj 2 | C3 | roll/depth (`A10`/`A12`) are **displaced** for the life of that touchpoint (§4.2) |
| C3 | second touchpoint **released** | C2 | gizmo and target null. ⛔ `A15`'s orphan raycast fires on this same event (§4.4) |
| C2/C3 | **shake** obj 1 | C1 | `evict` clears the stack, the highlight goes; `D13` would spare mates |
| C2/C3 | **flick** | same state, orientation reset | ⛔ leaves the constraint in place — §7.2 |
| C1/C2/C3 | holder **released** | C0/C1 | §3 rule 3 unselects the object, ⭐ but `D35` keeps the highlight while the alignment holds |
| any | fork slider moved | — | `adoptAnchorFork` defers the change until **nothing** is on the glass. ⚠ An alignment made in fork C **survives** a switch to fork A, where nothing consults it → §7.11 |
| C0 | every touchpoint outside | camera | orbit and pinch are untouched (§4.7) |

⛔⛔ **THE ONE TRANSITION WITH NO DEFINED DESTINATION IS C2 ITSELF** — an aligned object with
one finger on it and no target. §7.3 is the question that blocks the first build stage.

---

## 7. QUESTIONS — ✅ FOUR ANSWERED, and the rest still gate stage 2

✅ **1. PARALLEL, with a CAP OF ONE** (owner, 2026-09-16). The normals end up pointing the
**same way** — the CAD *align* sense, not a mate — with the consequence in §5.2 accepted: the
held object presents its opposite side toward the tapped face. ⭐ *One alignment axis* is
implemented as **at most one entry on the stack, replaced by the next tap**
(`singleAlignment`), which makes fork B's zero-DOF freeze unreachable by construction.

✅ **2. THE RESET IS SCOPED BY *WHEN*, NOT BY *WHETHER*** — the owner's own words:
> *"If the object was already aligned when the rotation was started, reset to the beginning
> of the rotation (therefore the alignment is conserved). If the alignment occurred during the
> rotation, reset the rotation (therefore this looses the alignment)."*

⭐⭐ **A SHARPER RULE THAN ANY OF THE THREE I OFFERED**, and the reason is worth keeping: I
framed the question as a property of the STATE (*is it aligned?*) and the answer is a property
of the GESTURE (*when did the alignment happen?*). The state cannot separate the two cases;
the gesture can. ⭐ And the first case then costs nothing: a snapshot taken while aligned
already satisfies the constraint, so restoring it conserves the alignment for free.

✅ **3. TWIST ABOUT THE ALIGNED NORMAL** — `anchor_rotate.ts`, reused unchanged from `A3`.

✅ **4. THE TAP'S DOUBLE MEANING** as set out in §4.1 — confirmed.

✅ **5. EACH FINGER MOVES ITS OWN OBJECT** while obj 1 is not aligned — today's behaviour for
two holders, per the current mode. ⚠ Not roll/depth: that is reserved for a second touchpoint
on the **same** object, which the router already routes differently (`SECOND` vs `OBJECT`).
6. **A second touchpoint outside any object** while aligned — fork A's roll/depth, or
   nothing? (§4.2) ⚠ It is also the only channel that could rescue §5.4's degenerate twist.
7. **`A15`'s orphan rule in C3**: exempt the holder while a target is live, or let the
   selection drop when the object leaves the finger? (§4.4)
8. **Defaults**: `ROTATE` inside fork C only, and the flag's default left at `NONE` until a
   hand closes fork C? (§4.6)
9. **The orbit**: position-only about the target, orientation untouched? (§5.3)
10. **The degenerate approach line**: refuse (as 2sexte does) or hand over to another
    channel? (§5.4)
11. **An alignment that outlives a fork switch** — keep, or clear on the switch? (§6)
12. **How does a MATE ever get asserted in fork C?** §4's `6quater` is the only rule that
    pushes one and it is **flick-based**, so fork C as dictated brings faces close and never
    joins them. Deliberate for now, or is a joining rule owed? (§4.3)

---

## 8. WHAT IT COSTS TO BUILD — reuse versus new

⚠ Stated so the specification can be revised with the price visible.

✅ **Already built, engine-free, reusable as-is**: `core/constraint_stack.ts` (entry 1 is the
minimal swing — the *"minimum number of axis"* the rules ask for — plus `evict`),
`core/face_pick.ts` (a face from a picked normal, and the marker orientation `D35` needed),
`input/shake.ts` (the undo trigger), `input/anchor_rotate.ts` (twist about a constraint axis,
should §7.3 want it), `input/gravity_frame.ts` (`R7`'s two axes).

⭐ **New, and small**: the tap-with-a-holder trigger (one predicate over the router's roles,
plus the existing pick), the one-entry cap, the `TargetPosition` + cross-quad gizmo (a render
concern, modelled on the existing `selected-face` quad), and one projection module for `R8`
(the screen projection of a world direction, with the degenerate case refusing — the same
shape as `nearSideScreenDirection`, which it can borrow from).

⛔ **The orbit-about-an-external-point of `R7` is the only genuinely new mechanic**, and it
needs a tunable pair (angle gain) plus a slider, like every other number here.

⚠ **`branches from Fork A` means the TRIGGER and the RULE TABLE, not the mechanisms**: fork C
still needs face picking and the highlight, which only fork B currently wires, and the
constraint stack, which is fork-agnostic core. What it does **not** take from fork B is
`align_flick.ts`, 2bis's empty-stack precondition and 2ter/2quater.

---

## 9. WHAT STAGE 1 BUILT — 2026-09-16

✅ **Engine-free, 15 vectors, 3 mutants** (`src/input/fork_c.ts`, `tests/fork_c.test.ts`):
`faceAlignConstraint` (the parallel align, world-frozen), `tapMeaning` (the tap's two
meanings), `flickResetPlan` (the owner's *when*-scoping), and `singleAlignment` in
`core/constraint_stack.ts` (the cap of one, with a `MATE` on the stack refusing).
⭐ The mutants: anti-parallel reddens 5 including the composition, append-instead-of-replace
reddens the cap, and a reset that never drops reddens the *during-the-gesture* case.

✅ **Wired** (`src/render/scene.ts`): the Pioneer tap on a second holder's `TAP` verdict, the
alignment applied through `solve`, the highlight raised **at the alignment** and dropped with
the constraint, the mode switch to `TRANSLATE`, the shake release **in either mode** (see
below), the rotation reset, and the twist about the aligned normal in `ROTATE`.

⚠⚠ **THREE PLACES FORK C DELIBERATELY DIVERGES FROM A DECISION ALREADY TAKEN**, each recorded
where it is written:

1. **`D32`'s shake is `ROTATE`-only; fork C's is not.** Fork C's alignment *ends* in
   `TRANSLATE`, so a mode-gated shake would force a toggle before the hand could undo — and
   the owner's sentence carries no mode condition. ⚠ The cost: in fork C a vigorous
   repositioning can evict. The four shake tunables are the only defence and have sliders.
2. **`D36` deleted the rotation reset globally; fork C reinstates it** — as a fork rule, not a
   restored global behaviour. Fork A shipped without it and still does.
3. **The mode default is `ROTATE` inside fork C only** — fork A's `TRANSLATE` default has been
   closed by a hand, and the flag's own default stays `0` until fork C is closed too (§4.6).

⛔ **What a device look should ask first**, in order: does the tap reach the alignment at all
(the HUD prints `forkC: ALIGNED …` or the refusal); is *parallel* what the hand expected once
it sees it; does the twist feel like a control or like a dead axis; and can an ordinary
reposition shake the alignment away by accident.
